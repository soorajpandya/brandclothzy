import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { startServer, checkoutBody, sign, KEY_SECRET } from './helpers.js';

// Product 12 "Fancy Fashionista Men Jeans": base 253.57 → customer ₹355, sizes 28–36
// Product 1  "Ethnic … Shirts":              base 177.14 → customer ₹248, sizes S–XXL
const JEANS = { productId: '12', size: '32', quantity: 2 };
const SHIRT = { productId: '1', size: 'M', quantity: 1 };

let t;
beforeEach(async () => { t = await startServer(); });
afterEach(async () => { await t.close(); });

async function createOrder(token = 'tok_alice', items = [JEANS, SHIRT], extra = {}) {
  const r = await t.call('POST', '/api/checkout/orders', { token, body: checkoutBody(items, extra) });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  return r.body;
}
const verify = (token, orderId, p, overrides = {}) =>
  t.call('POST', '/api/checkout/verify', {
    token,
    body: { orderId, razorpay_order_id: p.order_id, razorpay_payment_id: p.id, razorpay_signature: p.signature, ...overrides },
  });

describe('server-authoritative pricing', () => {
  test('server computes the amount from its own catalog', async () => {
    const o = await createOrder();
    // 2 × ₹355 + 1 × ₹248 = ₹958, below ₹999 → ₹49 shipping → ₹1,007
    assert.equal(o.subtotal, 958);
    assert.equal(o.shipping, 49);
    assert.equal(o.total, 1007);
    assert.equal(o.amountPaise, 100700);
    const stored = t.store._data.orders[o.orderId];
    assert.equal(stored.status, 'awaiting_payment');
    assert.equal(stored.razorpay_order_id, o.razorpayOrderId);
    assert.equal(t.store._data.razorpay_orders[o.razorpayOrderId].order_id, o.orderId);
  });

  test('client-supplied prices, totals and discounts are ignored (₹1,400 → ₹1 attack)', async () => {
    const body = checkoutBody([{ ...JEANS, price: 0.01, unitPrice: 1 }], { total: 1, amount: 100, discount: 99, coupon: 'FREE100', subtotal: 1 });
    const r = await t.call('POST', '/api/checkout/orders', { token: 'tok_alice', body });
    assert.equal(r.status, 201);
    assert.equal(r.body.total, 759); // 2 × 355 + 49 — server price, no discount
  });

  test('free standard shipping applies at ₹999 and above', async () => {
    const o = await createOrder('tok_alice', [{ productId: '12', size: '30', quantity: 3 }]);
    assert.equal(o.subtotal, 1065);
    assert.equal(o.shipping, 0);
    assert.equal(o.amountPaise, 106500);
  });

  test('paying a lower amount than the order never confirms it', async () => {
    const o = await createOrder();
    const p = t.rzp.pay(o.razorpayOrderId, { amount: 100 }); // ₹1
    const r = await verify('tok_alice', o.orderId, p);
    assert.notEqual(r.body.status, 'confirmed');
    const stored = t.store._data.orders[o.orderId];
    assert.equal(stored.needs_review, true);
    assert.equal(stored.review_reason, 'amount_mismatch');
    assert.notEqual(stored.payment_status, 'captured');
  });

  test('currency mismatch is flagged', async () => {
    const o = await createOrder();
    const p = t.rzp.pay(o.razorpayOrderId, { currency: 'USD' });
    const r = await verify('tok_alice', o.orderId, p);
    assert.equal(r.body.status, 'needs_review');
  });

  test('changing the cart after checkout starts requires a new order (idempotency conflict)', async () => {
    const body = checkoutBody([JEANS]);
    const first = await t.call('POST', '/api/checkout/orders', { token: 'tok_alice', body });
    const again = await t.call('POST', '/api/checkout/orders', { token: 'tok_alice', body });
    assert.equal(again.status, 200);
    assert.equal(again.body.orderId, first.body.orderId, 'double-click returns the same order');
    assert.equal(t.rzp.calls.create, 1, 'no duplicate Razorpay order');
    const changed = await t.call('POST', '/api/checkout/orders', { token: 'tok_alice', body: { ...body, items: [{ ...JEANS, quantity: 5 }] } });
    assert.equal(changed.status, 409);
  });

  test('a payment made for the old cart cannot confirm a new order', async () => {
    const oldOrder = await createOrder('tok_alice', [{ ...JEANS, quantity: 1 }]);
    const newOrder = await createOrder('tok_alice', [{ ...JEANS, quantity: 5 }]);
    const p = t.rzp.pay(oldOrder.razorpayOrderId);
    const r = await verify('tok_alice', newOrder.orderId, p);
    assert.equal(r.status, 400);
    assert.equal(t.store._data.orders[newOrder.orderId].payment_status, 'created');
  });
});

describe('payment verification attacks', () => {
  test('happy path: verify → confirmed, captured, email once, seller copy not needed for catalog items', async () => {
    const o = await createOrder();
    const p = t.rzp.pay(o.razorpayOrderId);
    const r = await verify('tok_alice', o.orderId, p);
    assert.equal(r.status, 200);
    assert.equal(r.body.status, 'confirmed');
    const stored = t.store._data.orders[o.orderId];
    assert.equal(stored.status, 'pending');
    assert.equal(stored.payment_status, 'captured');
    assert.equal(stored.payment_id, p.id);
    assert.equal(t.mailer.sent.length, 1);
    assert.equal(t.mailer.sent[0].to, 'alice@example.com');
  });

  test('invalid signature is rejected and the order is untouched', async () => {
    const o = await createOrder();
    const p = t.rzp.pay(o.razorpayOrderId);
    const r = await verify('tok_alice', o.orderId, p, { razorpay_signature: 'f'.repeat(64) });
    assert.equal(r.status, 400);
    assert.equal(t.store._data.orders[o.orderId].payment_status, 'created');
  });

  test('fake success response with a made-up payment ID is rejected', async () => {
    const o = await createOrder();
    const fakeId = 'pay_FAKE000000001';
    const r = await verify('tok_alice', o.orderId, { order_id: o.razorpayOrderId, id: fakeId, signature: crypto.randomBytes(32).toString('hex') });
    assert.equal(r.status, 400);
    assert.equal(t.store._data.orders[o.orderId].status, 'awaiting_payment');
  });

  test("another customer's order ID returns 404 (no ownership leak)", async () => {
    const o = await createOrder('tok_alice');
    const p = t.rzp.pay(o.razorpayOrderId);
    const r = await verify('tok_bob', o.orderId, p);
    assert.equal(r.status, 404);
    const s = await t.call('GET', `/api/checkout/orders/${o.orderId}/status`, { token: 'tok_bob' });
    assert.equal(s.status, 404);
  });

  test("submitting another customer's valid payment against your own order fails", async () => {
    const alice = await createOrder('tok_alice');
    const bob = await createOrder('tok_bob');
    const alicePayment = t.rzp.pay(alice.razorpayOrderId);
    // Bob replays Alice's payment id + signature on his own order
    const r1 = await verify('tok_bob', bob.orderId, alicePayment);
    assert.equal(r1.status, 400); // razorpay_order_id mismatch
    const r2 = await verify('tok_bob', bob.orderId, alicePayment, { razorpay_order_id: bob.razorpayOrderId });
    assert.equal(r2.status, 400); // signature no longer matches
    assert.equal(t.store._data.orders[bob.orderId].payment_status, 'created');
  });

  test('replaying an already verified payment is idempotent (no duplicate email or events)', async () => {
    const o = await createOrder();
    const p = t.rzp.pay(o.razorpayOrderId);
    await verify('tok_alice', o.orderId, p);
    const eventsBefore = t.store._data.orders[o.orderId].payment_events.length;
    const r = await verify('tok_alice', o.orderId, p);
    assert.equal(r.status, 200);
    assert.equal(r.body.status, 'confirmed');
    assert.equal(t.store._data.orders[o.orderId].payment_events.length, eventsBefore);
    assert.equal(t.mailer.sent.length, 1);
  });

  test('authorized-but-not-captured payment is captured by the server for the exact amount', async () => {
    const o = await createOrder();
    const p = t.rzp.pay(o.razorpayOrderId, { status: 'authorized' });
    const r = await verify('tok_alice', o.orderId, p);
    assert.equal(r.body.status, 'confirmed');
    assert.equal(t.rzp.calls.capture, 1);
  });

  test('manual capture mode leaves an authorized payment as processing (not confirmed)', async () => {
    await t.close();
    t = await startServer({ env: { RAZORPAY_CAPTURE_MODE: 'manual' } });
    const o = await createOrder();
    const p = t.rzp.pay(o.razorpayOrderId, { status: 'authorized' });
    const r = await verify('tok_alice', o.orderId, p);
    assert.equal(r.status, 202);
    assert.equal(r.body.status, 'processing');
    assert.equal(t.rzp.calls.capture, 0);
  });

  test('failed capture keeps the order unconfirmed', async () => {
    const o = await createOrder();
    t.rzp.captureFails = true;
    const p = t.rzp.pay(o.razorpayOrderId, { status: 'authorized' });
    const r = await verify('tok_alice', o.orderId, p);
    assert.equal(r.body.status, 'processing');
    assert.equal(t.store._data.orders[o.orderId].payment_status, 'authorized');
  });

  test('a second successful payment for a paid order is flagged for refund review', async () => {
    const o = await createOrder();
    const p1 = t.rzp.pay(o.razorpayOrderId);
    await verify('tok_alice', o.orderId, p1);
    const p2 = t.rzp.pay(o.razorpayOrderId);
    const r = await verify('tok_alice', o.orderId, p2);
    assert.equal(r.body.status, 'needs_review');
    assert.equal(t.store._data.orders[o.orderId].review_reason, 'duplicate_payment');
    assert.equal(t.store._data.orders[o.orderId].payment_id, p1.id, 'original payment kept');
  });

  test('verification requires sign-in', async () => {
    const r = await t.call('POST', '/api/checkout/verify', { body: {} });
    assert.equal(r.status, 401);
  });
});

describe('webhooks and reconciliation', () => {
  const capturedEvent = (p) => ({ event: 'payment.captured', payload: { payment: { entity: { ...p, signature: undefined } } } });

  test('browser closed after payment: webhook confirms the order', async () => {
    const o = await createOrder();
    const p = t.rzp.pay(o.razorpayOrderId);
    const r = await t.sendWebhook(capturedEvent(p));
    assert.equal(r.status, 200);
    assert.equal(t.store._data.orders[o.orderId].payment_status, 'captured');
    assert.equal(t.mailer.sent.length, 1);
  });

  test('browser closed and no webhook yet: status polling reconciles from Razorpay', async () => {
    const o = await createOrder();
    t.rzp.pay(o.razorpayOrderId, { status: 'authorized' });
    const s = await t.call('GET', `/api/checkout/orders/${o.orderId}/status`, { token: 'tok_alice' });
    assert.equal(s.body.status, 'confirmed');
  });

  test('webhook before checkout callback, then callback: one confirmation', async () => {
    const o = await createOrder();
    const p = t.rzp.pay(o.razorpayOrderId);
    await t.sendWebhook(capturedEvent(p));
    const r = await verify('tok_alice', o.orderId, p);
    assert.equal(r.body.status, 'confirmed');
    assert.equal(t.mailer.sent.length, 1);
  });

  test('checkout callback before webhook: webhook is a no-op', async () => {
    const o = await createOrder();
    const p = t.rzp.pay(o.razorpayOrderId);
    await verify('tok_alice', o.orderId, p);
    const before = JSON.stringify(t.store._data.orders[o.orderId]);
    const r = await t.sendWebhook(capturedEvent(p));
    assert.equal(r.status, 200);
    assert.equal(JSON.stringify(t.store._data.orders[o.orderId]), before);
    assert.equal(t.mailer.sent.length, 1);
  });

  test('the same webhook delivered multiple times is processed once', async () => {
    const o = await createOrder();
    const p = t.rzp.pay(o.razorpayOrderId);
    const ev = capturedEvent(p);
    const first = await t.sendWebhook(ev, { eventId: 'evt_same_1' });
    const second = await t.sendWebhook(ev, { eventId: 'evt_same_1' });
    assert.equal(first.body.status, 'ok');
    assert.equal(second.body.status, 'duplicate');
  });

  test('webhook with an invalid signature is rejected', async () => {
    const o = await createOrder();
    const p = t.rzp.pay(o.razorpayOrderId);
    const r = await t.sendWebhook(capturedEvent(p), { secret: 'wrong-secret' });
    assert.equal(r.status, 400);
    assert.equal(t.store._data.orders[o.orderId].payment_status, 'created');
  });

  test('webhook signed with the API key secret (not the webhook secret) is rejected', async () => {
    const o = await createOrder();
    const p = t.rzp.pay(o.razorpayOrderId);
    const r = await t.sendWebhook(capturedEvent(p), { secret: KEY_SECRET });
    assert.equal(r.status, 400);
  });

  test('webhook with a tampered amount cannot confirm the order', async () => {
    const o = await createOrder();
    const p = t.rzp.pay(o.razorpayOrderId, { amount: 100 });
    await t.sendWebhook(capturedEvent(p));
    assert.notEqual(t.store._data.orders[o.orderId].payment_status, 'captured');
    assert.equal(t.store._data.orders[o.orderId].needs_review, true);
  });

  test('payment.failed records the failure; a later successful retry still confirms', async () => {
    const o = await createOrder();
    const failed = t.rzp.pay(o.razorpayOrderId, { status: 'failed' });
    await t.sendWebhook({ event: 'payment.failed', payload: { payment: { entity: { ...failed, error_description: 'Bank declined' } } } });
    assert.equal(t.store._data.orders[o.orderId].payment_status, 'failed');
    const ok = t.rzp.pay(o.razorpayOrderId);
    const r = await verify('tok_alice', o.orderId, ok);
    assert.equal(r.body.status, 'confirmed');
  });

  test('refund webhook marks the order refunded', async () => {
    const o = await createOrder();
    const p = t.rzp.pay(o.razorpayOrderId);
    await verify('tok_alice', o.orderId, p);
    await t.sendWebhook({ event: 'refund.processed', payload: { refund: { entity: { payment_id: p.id } }, payment: { entity: { ...p, refund_status: 'full' } } } });
    assert.equal(t.store._data.orders[o.orderId].payment_status, 'refunded');
  });

  test('captured payment with no matching order is audited, not lost', async () => {
    const r = await t.sendWebhook({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_ORPHAN00001', order_id: 'order_UNKNOWN001', amount: 5000, currency: 'INR', status: 'captured' } } } });
    assert.equal(r.status, 200);
    assert.ok(t.store._audit.some((a) => a.type === 'webhook_unmatched' && a.payment_id === 'pay_ORPHAN00001'));
  });

  test('webhook processing failure returns 500 and the retry succeeds', async () => {
    const o = await createOrder();
    const p = t.rzp.pay(o.razorpayOrderId);
    t.store._faults.updateOrder = 3; // exhausts the 3 internal retries
    const first = await t.sendWebhook(capturedEvent(p), { eventId: 'evt_retry_1' });
    assert.equal(first.status, 500);
    const retry = await t.sendWebhook(capturedEvent(p), { eventId: 'evt_retry_1' });
    assert.equal(retry.status, 200);
    assert.equal(t.store._data.orders[o.orderId].payment_status, 'captured');
  });
});

describe('durable orders and failure recovery', () => {
  test('a transient database failure while saving the order is retried', async () => {
    t.store._faults.putOrder = 1;
    const o = await createOrder();
    assert.ok(t.store._data.orders[o.orderId]);
  });

  test('database down: no Razorpay order is created, so the customer cannot pay for an unsaved order', async () => {
    t.store._faults.putOrder = 5;
    const r = await t.call('POST', '/api/checkout/orders', { token: 'tok_alice', body: checkoutBody([JEANS]) });
    assert.equal(r.status, 500);
    assert.equal(t.rzp.calls.create, 0);
  });

  test('payment gateway down: order is cancelled, customer told to retry', async () => {
    t.rzp.down = true;
    const r = await t.call('POST', '/api/checkout/orders', { token: 'tok_alice', body: checkoutBody([JEANS]) });
    assert.equal(r.status, 502);
    const [order] = Object.values(t.store._data.orders);
    assert.equal(order.status, 'cancelled');
  });

  test('database failure during verification → "processing", then polling recovers the paid order', async () => {
    const o = await createOrder();
    const p = t.rzp.pay(o.razorpayOrderId);
    t.store._faults.updateOrder = 3;
    const r = await verify('tok_alice', o.orderId, p);
    assert.equal(r.status, 202);
    assert.equal(r.body.status, 'processing', 'customer is NOT told the order is confirmed');
    const s = await t.call('GET', `/api/checkout/orders/${o.orderId}/status`, { token: 'tok_alice' });
    assert.equal(s.body.status, 'confirmed');
  });

  test('email failure does not affect the confirmed order; the email is sent on a later retry', async () => {
    const o = await createOrder();
    const p = t.rzp.pay(o.razorpayOrderId);
    t.mailer.failNext = 1;
    const r = await verify('tok_alice', o.orderId, p);
    assert.equal(r.body.status, 'confirmed');
    assert.equal(t.mailer.sent.length, 0);
    await verify('tok_alice', o.orderId, p); // any later settle retries the email
    assert.equal(t.mailer.sent.length, 1);
  });

  test('admin reconciliation queue lists flagged orders and is admin-only', async () => {
    const o = await createOrder();
    const p = t.rzp.pay(o.razorpayOrderId, { amount: 100 });
    await verify('tok_alice', o.orderId, p);
    const denied = await t.call('GET', '/api/admin/orders/attention', { token: 'tok_alice' });
    assert.equal(denied.status, 403);
    const q = await t.call('GET', '/api/admin/orders/attention', { token: 'tok_admin' });
    assert.equal(q.status, 200);
    assert.ok(q.body.needsReview.some((x) => x.id === o.orderId && x.review_reason === 'amount_mismatch'));
    const resolve = await t.call('POST', `/api/admin/orders/${o.orderId}/resolve`, { token: 'tok_admin', body: { note: 'Refunded ₹1 manually' } });
    assert.equal(resolve.status, 200);
    assert.ok(t.store._audit.some((a) => a.type === 'admin_resolve_review' && a.actor_uid === 'boss'));
  });

  test('signature helper matches the Razorpay algorithm', () => {
    assert.equal(sign('secret', 'order_1|pay_1'), crypto.createHmac('sha256', 'secret').update('order_1|pay_1').digest('hex'));
  });
});
