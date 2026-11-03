/**
 * Payment verification and the order payment state machine.
 *
 * Order status (fulfilment):   awaiting_payment → pending (paid) → confirmed → shipped → delivered / returned
 * Payment status (financial):  created → authorized → captured → refunded / partially_refunded
 *                              created → failed (customer may retry on the same Razorpay order)
 *
 * Only trusted gateway data (Razorpay API responses or signature-verified webhooks)
 * can move an order to "captured". Every transition is idempotent: replaying the
 * same payment produces no further change; a *different* payment for an already
 * paid order is flagged for review (possible double charge → refund).
 */
import crypto from 'crypto';

export function hmacHex(secret, payload) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/** Constant-time comparison of two hex strings. */
export function safeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/** Razorpay Checkout signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
export function verifyCheckoutSignature({ orderId, paymentId, signature, keySecret }) {
  if (!orderId || !paymentId || !signature || !keySecret) return false;
  return safeEqualHex(hmacHex(keySecret, `${orderId}|${paymentId}`), signature);
}

/** Razorpay webhook signature: HMAC_SHA256(raw request body, webhook_secret). */
export function verifyWebhookSignature({ rawBody, signature, webhookSecret }) {
  if (!rawBody || !signature || !webhookSecret) return false;
  return safeEqualHex(hmacHex(webhookSecret, rawBody), signature);
}

const FINAL_PAYMENT = new Set(['captured', 'refunded', 'partially_refunded']);

/**
 * Pure transition: returns { next, outcome } where `next` is the new order object
 * (or the same object when nothing changes) and `outcome` describes what happened.
 *
 * @param {object} order   current order
 * @param {object} payment trusted payment entity { id, order_id, amount, currency, status, method, error_description }
 * @param {string} source  'checkout_verify' | 'webhook' | 'reconcile'
 */
export function applyPayment(order, payment, source, nowIso = new Date().toISOString()) {
  if (!order) return { next: order, outcome: 'order_missing' };
  const event = {
    source,
    payment_id: payment.id,
    payment_status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    at: nowIso,
  };
  const withEvent = (o, extra = {}) => ({
    ...o,
    ...extra,
    payment_events: [...(Array.isArray(o.payment_events) ? o.payment_events : Object.values(o.payment_events || {})), event].slice(-50),
    updated_at: nowIso,
  });
  const flag = (reason) => ({
    next: withEvent(order, { needs_review: true, review_reason: reason }),
    outcome: reason,
  });

  // 1. The payment must belong to this order's Razorpay order.
  if (!order.razorpay_order_id || payment.order_id !== order.razorpay_order_id) {
    return { next: order, outcome: 'order_mismatch' }; // do not touch the order: likely tampering
  }

  // 2. Already paid?
  if (FINAL_PAYMENT.has(order.payment_status)) {
    if (order.payment_id === payment.id) {
      if (['refunded', 'partially_refunded'].includes(payment.status) && order.payment_status !== payment.status) {
        return { next: withEvent(order, { payment_status: payment.status }), outcome: payment.status };
      }
      return { next: order, outcome: 'already_processed' };
    }
    if (payment.status === 'captured' || payment.status === 'authorized') {
      return flag('duplicate_payment'); // second successful payment for one order → refund needed
    }
    return { next: order, outcome: 'ignored' };
  }

  // 3. Amount and currency must match the server-side order exactly.
  if (payment.amount !== order.amount_paise || payment.currency !== order.currency) {
    if (payment.status === 'captured' || payment.status === 'authorized') return flag('amount_mismatch');
    return { next: order, outcome: 'ignored' };
  }

  switch (payment.status) {
    case 'captured': {
      const history = Array.isArray(order.status_history) ? order.status_history : Object.values(order.status_history || {});
      return {
        next: withEvent(order, {
          status: order.status === 'awaiting_payment' ? 'pending' : order.status,
          payment_status: 'captured',
          payment_id: payment.id,
          payment_method: payment.method || null,
          paid_at: nowIso,
          needs_review: false,
          review_reason: null,
          status_history: order.status === 'awaiting_payment'
            ? [...history, { status: 'pending', timestamp: nowIso, actor: 'system', note: `Payment captured (${source})` }]
            : history,
        }),
        outcome: 'captured',
      };
    }
    case 'authorized':
      if (order.payment_status === 'authorized' && order.payment_id === payment.id) return { next: order, outcome: 'already_authorized' };
      return { next: withEvent(order, { payment_status: 'authorized', payment_id: payment.id }), outcome: 'authorized' };
    case 'failed':
      if (order.payment_status === 'authorized') return { next: withEvent(order), outcome: 'ignored' };
      return {
        next: withEvent(order, { payment_status: 'failed', last_payment_error: String(payment.error_description || 'Payment failed').slice(0, 200) }),
        outcome: 'failed',
      };
    default:
      return { next: withEvent(order), outcome: 'ignored' };
  }
}
