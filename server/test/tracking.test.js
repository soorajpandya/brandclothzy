import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { startServer, checkoutBody } from './helpers.js';
import { sanitizeAttribution } from '../lib/tracking.js';

const TRACKING_ENV = {
  GA4_MEASUREMENT_ID: 'G-TEST000000',
  GA4_API_SECRET: 'ga4-secret-not-real',
  META_PIXEL_ID: '1261232606125599',
  META_CAPI_TOKEN: 'meta-token-not-real',
};
const CONSENTED = { consent: true, gaClientId: '1234567890.1730000000', gaSessionId: '1730000100', fbp: 'fb.1.1730000000000.987654321', fbc: 'fb.1.1730000000000.AbCdEf123' };
const sha = (v) => crypto.createHash('sha256').update(v).digest('hex');

let t;
beforeEach(async () => { t = await startServer({ env: TRACKING_ENV }); });
afterEach(async () => { await t.close(); });

async function buy(analytics) {
  const r = await t.call('POST', '/api/checkout/orders', {
    token: 'tok_alice',
    body: checkoutBody([{ productId: '12', size: '32', quantity: 2 }], { analytics }),
    headers: { 'User-Agent': 'TestBrowser/1.0' },
  });
  assert.equal(r.status, 201);
  const p = t.rzp.pay(r.body.razorpayOrderId);
  const v = await t.call('POST', '/api/checkout/verify', {
    token: 'tok_alice',
    body: { orderId: r.body.orderId, razorpay_order_id: p.order_id, razorpay_payment_id: p.id, razorpay_signature: p.signature },
  });
  assert.equal(v.body.status, 'confirmed');
  return { created: r.body, payment: p, verify: () => t.call('POST', '/api/checkout/verify', { token: 'tok_alice', body: { orderId: r.body.orderId, razorpay_order_id: p.order_id, razorpay_payment_id: p.id, razorpay_signature: p.signature } }) };
}

test('checkout response tells the browser which purchase reports the server sends', async () => {
  const r = await t.call('POST', '/api/checkout/orders', { token: 'tok_alice', body: checkoutBody([{ productId: '12', size: '32', quantity: 1 }]) });
  assert.deepEqual(r.body.serverTracking, { ga4: true, meta: true });
});

test('no consent → nothing is sent to Google or Meta', async () => {
  await buy({ consent: false, gaClientId: '1.2' });
  await buy(undefined);
  assert.equal(t.tracking.calls.length, 0);
});

test('with consent → one GA4 purchase and one Meta Purchase with the verified amount', async () => {
  const { created } = await buy(CONSENTED);
  const ga4 = t.tracking.calls.find((c) => c.url.startsWith('https://www.google-analytics.com/mp/collect'));
  const meta = t.tracking.calls.find((c) => c.url.startsWith('https://graph.facebook.com/'));
  assert.ok(ga4 && meta);
  assert.equal(t.tracking.calls.length, 2);

  const ev = ga4.body.events[0];
  assert.equal(ga4.body.client_id, CONSENTED.gaClientId);
  assert.equal(ev.name, 'purchase');
  assert.equal(ev.params.transaction_id, created.orderId);
  assert.equal(ev.params.value, 759); // 2 × ₹355 + ₹49
  assert.equal(ev.params.session_id, 1730000100);
  assert.deepEqual(ev.params.items.map((i) => [i.item_id, i.item_variant, i.price, i.quantity]), [['12', '32', 355, 2]]);

  const m = meta.body.data[0];
  assert.equal(m.event_name, 'Purchase');
  assert.equal(m.event_id, created.orderId, 'same ID as the browser Pixel → Meta de-duplicates');
  assert.equal(m.custom_data.value, 759);
  assert.equal(m.user_data.fbp, CONSENTED.fbp);
  assert.equal(m.user_data.client_user_agent, 'TestBrowser/1.0');
});

test('contact details are hashed, never sent in plain text', async () => {
  await buy(CONSENTED);
  const meta = t.tracking.calls.find((c) => c.url.startsWith('https://graph.facebook.com/'));
  const raw = JSON.stringify(meta.body);
  assert.ok(!raw.includes('alice@example.com'));
  assert.ok(!raw.includes('9876543210'));
  assert.deepEqual(meta.body.data[0].user_data.em, [sha('alice@example.com')]);
  assert.deepEqual(meta.body.data[0].user_data.ph, [sha('919876543210')]);
});

test('purchase is reported once, even when the payment is verified again or the webhook repeats', async () => {
  const { payment, verify } = await buy(CONSENTED);
  await verify();
  await t.sendWebhook({ event: 'payment.captured', payload: { payment: { entity: { ...payment, signature: undefined } } } });
  assert.equal(t.tracking.calls.length, 2);
});

test('a tracking outage never affects the order and is retried on the next settle', async () => {
  t.tracking.failNext = 2;
  const { verify } = await buy(CONSENTED);
  assert.equal(t.tracking.calls.length, 0);
  await verify(); // later reconciliation retries
  assert.equal(t.tracking.calls.length, 2);
});

test('unpaid orders are never reported', async () => {
  await t.call('POST', '/api/checkout/orders', { token: 'tok_alice', body: checkoutBody([{ productId: '12', size: '32', quantity: 1 }], { analytics: CONSENTED }) });
  assert.equal(t.tracking.calls.length, 0);
});

test('browser-supplied attribution is validated (no injection into tracking payloads)', () => {
  const s = sanitizeAttribution({ consent: true, gaClientId: '1.2"><script>', gaSessionId: 'abc', fbp: 'evil', fbc: 'fb.1.123.ok_value' }, { ip: '1.2.3.4', userAgent: 'x'.repeat(1000) });
  assert.equal(s.gaClientId, undefined);
  assert.equal(s.gaSessionId, undefined);
  assert.equal(s.fbp, undefined);
  assert.equal(s.fbc, 'fb.1.123.ok_value');
  assert.equal(s.user_agent.length, 300);
  assert.equal(sanitizeAttribution({ consent: 'yes' }), null);
});
