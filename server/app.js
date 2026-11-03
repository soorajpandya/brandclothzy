/**
 * BrandClothzy API.
 *
 * Payment flow (server-authoritative):
 *   1. POST /api/checkout/orders   — server prices the cart, stores an awaiting_payment order,
 *                                     creates the Razorpay order for that exact amount.
 *   2. Browser opens Razorpay Checkout with the server-issued order_id.
 *   3. POST /api/checkout/verify   — signature + Razorpay API check, capture, mark paid (idempotent).
 *   4. POST /api/webhooks/razorpay — signature-verified events reconcile payments even if the
 *                                     browser closed before step 3.
 *   5. GET  /api/checkout/orders/:id/status — customer polls; also re-checks Razorpay.
 *
 * All dependencies are injected so the whole flow can be tested without network access.
 */
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { buildOrder, cartFingerprint, CheckoutError, parseCartItems } from './lib/checkout.js';
import { applyPayment, verifyCheckoutSignature, verifyWebhookSignature } from './lib/payments.js';
import { sendOnce, welcomeEmail, orderConfirmationEmail } from './lib/emails.js';
import { requireAuth, requireAdmin, rateLimit } from './lib/http.js';

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const RZP_ID_RE = /^[A-Za-z0-9_]{6,40}$/;
const isId = (v) => typeof v === 'string' && ID_RE.test(v);
const isRzpId = (v) => typeof v === 'string' && RZP_ID_RE.test(v);

/** Customer-facing status derived from the order record. */
export function publicStatus(order) {
  if (!order) return 'not_found';
  if (order.payment_status === 'refunded') return 'refunded';
  if (order.needs_review) return 'needs_review';
  if (['captured', 'partially_refunded'].includes(order.payment_status)) return 'confirmed';
  if (order.payment_status === 'authorized') return 'processing';
  if (order.payment_status === 'failed') return 'failed';
  if (order.status === 'cancelled') return 'cancelled';
  return 'awaiting_payment';
}

function orderSummary(order) {
  return {
    orderId: order.id,
    status: publicStatus(order),
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total,
    items: (order.items || []).map((i) => ({ productId: i.product_id, name: i.name, size: i.size || null, quantity: i.quantity, unitPrice: i.unit_price, lineTotal: i.line_total })),
  };
}

async function withRetry(fn, { attempts = 3, delayMs = 150 } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw lastErr;
}

export function createApp({ config, store, razorpay, verifyIdToken, mailer, logger = console }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(
    cors({
      origin(origin, cb) {
        // No Origin header = server-to-server (e.g. Razorpay webhooks, health checks): allowed, no CORS headers needed.
        if (!origin || config.allowedOrigins.includes(origin)) return cb(null, true);
        return cb(null, false);
      },
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 600,
    })
  );

  const auth = requireAuth(verifyIdToken);
  const byUser = (req) => req.user?.uid || req.ip;
  const audit = (entry) => store.appendAudit(entry).catch((e) => logger.error(`[audit] write failed: ${e.message}`));

  // ── Payment settlement (shared by verify, webhook and reconcile) ──────────────
  async function settlePayment(orderId, payment, source) {
    let outcome = 'order_missing';
    const result = await withRetry(() =>
      store.updateOrder(orderId, (cur) => {
        if (cur == null) return cur; // RTDB: let the transaction retry with server data
        const r = applyPayment(cur, payment, source);
        outcome = r.outcome;
        return r.next === cur ? undefined : r.next; // undefined = no write
      })
    );
    const order = result.value || (await store.getOrder(orderId));
    if (!['already_processed', 'already_authorized', 'ignored'].includes(outcome)) {
      audit({ type: 'payment_transition', order_id: orderId, outcome, source, payment_id: payment.id, payment_status: payment.status, amount: payment.amount });
    }
    if (order && ['captured', 'already_processed'].includes(outcome) && order.payment_status === 'captured') {
      await afterPaid(order).catch((e) => logger.error(`[order ${orderId}] post-payment step failed: ${e.message}`));
    }
    return { outcome, order };
  }

  // Idempotent side effects once an order is paid. Failures never undo the payment.
  async function afterPaid(order) {
    const updates = {};
    for (const sellerId of order.seller_ids || []) {
      updates[`seller_orders/${sellerId}/${order.id}`] = {
        id: order.id,
        status: order.status,
        created_at: order.created_at,
        paid_at: order.paid_at || null,
        customer_name: order.customer_name,
        shipping_address: order.shipping_address,
        items: (order.items || []).filter((i) => i.seller_id === sellerId),
      };
    }
    if (Object.keys(updates).length) await store.writeSellerOrders(updates);
    await sendOnce({
      store,
      mailer,
      logger,
      key: `order_confirmed__${order.id}`,
      to: order.customer_email,
      build: () => orderConfirmationEmail(order),
    });
  }

  /** Captures an authorized payment when it matches the order exactly (server capture mode). */
  async function maybeCapture(order, payment) {
    if (payment.status !== 'authorized' || config.razorpay.captureMode !== 'server') return payment;
    if (payment.order_id !== order.razorpay_order_id || payment.amount !== order.amount_paise || payment.currency !== order.currency) return payment;
    try {
      return await razorpay.payments.capture(payment.id, payment.amount, payment.currency);
    } catch (err) {
      logger.error(`[order ${order.id}] capture failed: ${err?.error?.description || err.message}`);
      try {
        return await razorpay.payments.fetch(payment.id); // may already have been captured elsewhere
      } catch {
        return payment;
      }
    }
  }

  /** Re-checks Razorpay for payments on an order (customer polling, admin reconcile). */
  async function reconcileOrder(order, source) {
    if (!order?.razorpay_order_id) return order;
    const list = await razorpay.orders.fetchPayments(order.razorpay_order_id);
    const payments = (list?.items || []).sort((a, b) => (a.created_at || 0) - (b.created_at || 0));
    let latest = order;
    for (let p of payments) {
      if (!['authorized', 'captured', 'failed', 'refunded'].includes(p.status)) continue;
      p = await maybeCapture(latest, p);
      latest = (await settlePayment(order.id, p, source)).order || latest;
    }
    return latest;
  }

  // ── Webhook (raw body; must be registered before express.json) ────────────────
  app.post('/api/webhooks/razorpay', express.raw({ type: '*/*', limit: '256kb' }), async (req, res) => {
    if (!config.razorpay.webhookSecret) return res.status(503).json({ error: 'Webhook not configured.' });
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
    const signature = req.get('x-razorpay-signature') || '';
    if (!verifyWebhookSignature({ rawBody, signature, webhookSecret: config.razorpay.webhookSecret })) {
      audit({ type: 'webhook_rejected', reason: 'invalid_signature', ip: req.ip });
      return res.status(400).json({ error: 'Invalid signature.' });
    }
    let event;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return res.status(400).json({ error: 'Invalid payload.' });
    }
    const eventId = req.get('x-razorpay-event-id') || crypto.createHash('sha256').update(rawBody).digest('hex').slice(0, 40);
    const safeEventId = eventId.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 64);

    if ((await store.claimWebhookEvent(safeEventId)) === 'duplicate') return res.status(200).json({ status: 'duplicate' });

    try {
      const handled = ['payment.authorized', 'payment.captured', 'payment.failed', 'order.paid', 'refund.processed', 'refund.created'];
      if (!handled.includes(event.event)) {
        await store.completeWebhookEvent(safeEventId, { event: event.event, result: 'ignored' });
        return res.status(200).json({ status: 'ignored' });
      }
      let payment = event.payload?.payment?.entity;
      if (!payment) {
        await store.completeWebhookEvent(safeEventId, { event: event.event, result: 'no_payment_entity' });
        return res.status(200).json({ status: 'ignored' });
      }
      if (event.event.startsWith('refund.')) {
        payment = { ...payment, status: payment.refund_status === 'partial' ? 'partially_refunded' : 'refunded' };
      }
      const index = payment.order_id ? await store.getRazorpayIndex(payment.order_id) : null;
      const orderId = index?.order_id || payment.notes?.internal_order_id;
      const order = isId(orderId) ? await store.getOrder(orderId) : null;
      if (!order) {
        // Captured money with no matching order must never disappear silently.
        audit({ type: 'webhook_unmatched', event: event.event, razorpay_order_id: payment.order_id || null, payment_id: payment.id, amount: payment.amount });
        await store.completeWebhookEvent(safeEventId, { event: event.event, result: 'unmatched' });
        return res.status(200).json({ status: 'unmatched' });
      }
      payment = await maybeCapture(order, payment);
      const { outcome } = await settlePayment(order.id, payment, 'webhook');
      await store.completeWebhookEvent(safeEventId, { event: event.event, result: outcome, order_id: order.id });
      return res.status(200).json({ status: 'ok' });
    } catch (err) {
      logger.error(`[webhook ${safeEventId}] processing failed: ${err.message}`);
      await store.releaseWebhookEvent(safeEventId).catch(() => {});
      return res.status(500).json({ error: 'Processing failed; please retry.' }); // Razorpay retries
    }
  });

  app.use(express.json({ limit: '20kb' }));

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.get('/api/config', (req, res) => res.json({ razorpayKeyId: config.razorpay.keyId, mode: config.razorpay.mode }));

  // ── 1. Create checkout order ─────────────────────────────────────────────────
  app.post('/api/checkout/orders', auth, rateLimit({ name: 'create', windowMs: 10 * 60_000, max: 20, key: byUser }), async (req, res) => {
    const uid = req.user.uid;
    const key = String(req.body?.idempotencyKey || '');
    if (!/^[A-Za-z0-9-]{8,64}$/.test(key)) return res.status(400).json({ error: 'Missing checkout reference. Please refresh and try again.' });

    try {
      const items = parseCartItems(req.body?.items);
      const fingerprint = cartFingerprint(items, String(req.body?.shippingOption || 'standard'));

      const attempt = await store.getCheckoutAttempt(uid, key);
      if (attempt) {
        if (attempt.fingerprint !== fingerprint) return res.status(409).json({ error: 'Your bag changed. Please try again.', code: 'idempotency_conflict' });
        const existing = await store.getOrder(attempt.order_id);
        if (existing && existing.razorpay_order_id && existing.status === 'awaiting_payment') {
          return res.json({ ...orderSummary(existing), razorpayOrderId: existing.razorpay_order_id, amountPaise: existing.amount_paise, currency: existing.currency, keyId: config.razorpay.keyId });
        }
        if (existing && publicStatus(existing) === 'confirmed') return res.status(409).json({ error: 'This order has already been paid.', code: 'already_paid', orderId: existing.id });
      }

      const orderId = store.newOrderId();
      const order = await buildOrder({ store, user: req.user, body: { ...req.body, items }, orderId });
      await withRetry(() => store.putOrder(order));

      let rzpOrder;
      try {
        rzpOrder = await razorpay.orders.create({
          amount: order.amount_paise,
          currency: order.currency,
          receipt: order.id,
          notes: { internal_order_id: order.id, customer_id: uid },
        });
      } catch (err) {
        logger.error(`[order ${order.id}] Razorpay order create failed: ${err?.error?.description || err.message}`);
        await store.updateOrder(order.id, (cur) => (cur == null ? cur : { ...cur, status: 'cancelled', payment_status: 'not_started', updated_at: new Date().toISOString() })).catch(() => {});
        return res.status(502).json({ error: 'Payment gateway is unavailable. Please try again in a minute.' });
      }
      if (rzpOrder.amount !== order.amount_paise) throw new Error('Gateway amount mismatch');

      await withRetry(() => store.setRazorpayIndex(rzpOrder.id, { order_id: order.id, customer_id: uid }));
      await withRetry(() =>
        store.updateOrder(order.id, (cur) => (cur == null ? cur : { ...cur, razorpay_order_id: rzpOrder.id, updated_at: new Date().toISOString() }))
      );
      await store.setCheckoutAttempt(uid, key, { order_id: order.id, fingerprint, created_at: order.created_at });
      audit({ type: 'checkout_created', order_id: order.id, customer_id: uid, amount_paise: order.amount_paise, razorpay_order_id: rzpOrder.id });

      return res.status(201).json({
        ...orderSummary({ ...order, razorpay_order_id: rzpOrder.id }),
        razorpayOrderId: rzpOrder.id,
        amountPaise: order.amount_paise,
        currency: order.currency,
        keyId: config.razorpay.keyId,
      });
    } catch (err) {
      if (err instanceof CheckoutError) return res.status(err.status).json({ error: err.message, code: err.code });
      logger.error(`[checkout] create failed: ${err.message}`);
      return res.status(500).json({ error: 'Could not start checkout. Please try again.' });
    }
  });

  // ── 3. Verify payment from the Checkout callback ─────────────────────────────
  app.post('/api/checkout/verify', auth, rateLimit({ name: 'verify', windowMs: 10 * 60_000, max: 40, key: byUser }), async (req, res) => {
    const { orderId, razorpay_order_id: rzpOrderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body || {};
    if (!isId(orderId) || !isRzpId(rzpOrderId) || !isRzpId(paymentId) || typeof signature !== 'string') {
      return res.status(400).json({ error: 'Invalid payment details.' });
    }
    const order = await store.getOrder(orderId);
    if (!order || order.customer_id !== req.user.uid) return res.status(404).json({ error: 'Order not found.' });

    if (order.razorpay_order_id !== rzpOrderId) {
      audit({ type: 'verify_rejected', reason: 'order_mismatch', order_id: orderId, customer_id: req.user.uid, payment_id: paymentId });
      return res.status(400).json({ error: 'Payment does not belong to this order.' });
    }
    if (!verifyCheckoutSignature({ orderId: rzpOrderId, paymentId, signature, keySecret: config.razorpay.keySecret })) {
      audit({ type: 'verify_rejected', reason: 'invalid_signature', order_id: orderId, customer_id: req.user.uid, payment_id: paymentId });
      return res.status(400).json({ error: 'Payment verification failed.' });
    }

    let payment;
    try {
      payment = await razorpay.payments.fetch(paymentId);
    } catch (err) {
      logger.error(`[order ${orderId}] payment fetch failed: ${err.message}`);
      return res.status(202).json({ ...orderSummary(order), status: 'processing' }); // webhook / polling will finish
    }

    try {
      payment = await maybeCapture(order, payment);
      const { order: updated } = await settlePayment(orderId, payment, 'checkout_verify');
      const summary = orderSummary(updated || order);
      const code = summary.status === 'confirmed' ? 200 : summary.status === 'failed' ? 402 : 202;
      return res.status(code).json(summary);
    } catch (err) {
      logger.error(`[order ${orderId}] settle failed: ${err.message}`);
      return res.status(202).json({ ...orderSummary(order), status: 'processing' });
    }
  });

  // ── 5. Order status (customer polling) ───────────────────────────────────────
  app.get('/api/checkout/orders/:orderId/status', auth, rateLimit({ name: 'status', windowMs: 60_000, max: 30, key: byUser }), async (req, res) => {
    const { orderId } = req.params;
    if (!isId(orderId)) return res.status(400).json({ error: 'Invalid order.' });
    let order = await store.getOrder(orderId);
    if (!order || order.customer_id !== req.user.uid) return res.status(404).json({ error: 'Order not found.' });
    if (['awaiting_payment', 'processing'].includes(publicStatus(order))) {
      try {
        order = await reconcileOrder(order, 'customer_poll');
      } catch (err) {
        logger.error(`[order ${orderId}] reconcile failed: ${err.message}`);
      }
    }
    return res.json(orderSummary(order));
  });

  // ── Welcome email (recipient = the signed-in user's verified token email) ────
  app.post(
    '/api/emails/welcome',
    rateLimit({ name: 'welcome-ip', windowMs: 60 * 60_000, max: 20 }),
    auth,
    rateLimit({ name: 'welcome-user', windowMs: 60 * 60_000, max: 3, key: byUser }),
    async (req, res) => {
      if (!req.user.email) return res.status(400).json({ error: 'No email on this account.' });
      const profile = await store.getUser(req.user.uid).catch(() => null);
      const result = await sendOnce({
        store,
        mailer,
        logger,
        key: `welcome__${req.user.uid}`,
        to: req.user.email,
        build: () => welcomeEmail({ name: profile?.name || req.user.name, siteUrl: config.publicSiteUrl }),
      });
      return res.status(202).json({ status: result.status === 'failed' ? 'queued' : result.status });
    }
  );

  // ── Admin: payment reconciliation queue ──────────────────────────────────────
  app.get('/api/admin/orders/attention', auth, requireAdmin, async (req, res) => {
    const [review, awaiting] = await Promise.all([store.listOrdersNeedingReview(), store.listAwaitingPayment(50)]);
    const strip = (o) => ({ id: o.id, status: o.status, payment_status: o.payment_status, needs_review: Boolean(o.needs_review), review_reason: o.review_reason || null, total: o.total, customer_name: o.customer_name, created_at: o.created_at, razorpay_order_id: o.razorpay_order_id || null, payment_id: o.payment_id || null });
    return res.json({ needsReview: review.map(strip), awaitingPayment: awaiting.map(strip) });
  });

  app.post('/api/admin/orders/:orderId/reconcile', auth, requireAdmin, async (req, res) => {
    const { orderId } = req.params;
    if (!isId(orderId)) return res.status(400).json({ error: 'Invalid order.' });
    const order = await store.getOrder(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    try {
      const updated = await reconcileOrder(order, 'admin_reconcile');
      audit({ type: 'admin_reconcile', order_id: orderId, actor_uid: req.user.uid, result: publicStatus(updated) });
      return res.json({ ...orderSummary(updated), payment_status: updated.payment_status, needs_review: Boolean(updated.needs_review) });
    } catch (err) {
      logger.error(`[order ${orderId}] admin reconcile failed: ${err.message}`);
      return res.status(502).json({ error: 'Could not reach Razorpay. Try again.' });
    }
  });

  app.post('/api/admin/orders/:orderId/resolve', auth, requireAdmin, async (req, res) => {
    const { orderId } = req.params;
    const note = String(req.body?.note || '').trim().slice(0, 500);
    if (!isId(orderId) || !note) return res.status(400).json({ error: 'A resolution note is required.' });
    const r = await store.updateOrder(orderId, (cur) => (cur == null ? cur : { ...cur, needs_review: false, review_resolution: note, review_resolved_by: req.user.uid, updated_at: new Date().toISOString() }));
    if (!r.value) return res.status(404).json({ error: 'Order not found.' });
    audit({ type: 'admin_resolve_review', order_id: orderId, actor_uid: req.user.uid, note });
    return res.json({ ok: true });
  });

  app.use((req, res) => res.status(404).json({ error: 'Not found.' }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large.' });
    if (err instanceof SyntaxError) return res.status(400).json({ error: 'Invalid JSON.' });
    logger.error(`[api] ${err?.message}`);
    return res.status(500).json({ error: 'Something went wrong.' });
  });

  return app;
}
