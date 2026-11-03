import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, checkoutBody, ORIGIN } from './helpers.js';
import { escapeHtml, welcomeEmail } from '../lib/emails.js';
import { loadConfig } from '../lib/config.js';

const SEED = {
  sellers: {
    s_live: { status: 'live' },
    s_suspended: { status: 'suspended' },
    s_onboarding: { status: 'onboarding_complete' },
  },
  products: {
    mp_ok: { name: 'Seller Kurta', price: 500, status: 'approved', seller_id: 's_live', sizes: ['S', 'M', 'L'], images: ['https://x/1.webp'] },
    mp_nosize: { name: 'Seller Dupatta', price: 300, status: 'approved', seller_id: 's_live', sizes: [] },
    mp_pending: { name: 'Pending Item', price: 500, status: 'pending_review', seller_id: 's_live', sizes: ['M'] },
    mp_rejected: { name: 'Rejected Item', price: 500, status: 'rejected', seller_id: 's_live', sizes: ['M'] },
    mp_suspended_seller: { name: 'Suspended Seller Item', price: 500, status: 'approved', seller_id: 's_suspended', sizes: ['M'] },
    mp_not_live: { name: 'Not Live Seller Item', price: 500, status: 'approved', seller_id: 's_onboarding', sizes: ['M'] },
  },
  users: { alice: { name: '<img src=x onerror=alert(1)>' } },
};

let t;
beforeEach(async () => { t = await startServer({ seed: SEED }); });
afterEach(async () => { await t.close(); });

const create = (items, token = 'tok_alice', extra) => t.call('POST', '/api/checkout/orders', { token, body: checkoutBody(items, extra) });

describe('size persistence (issue 3)', () => {
  test('every line keeps its size, including the same product in two sizes', async () => {
    const r = await create([
      { productId: '12', size: '30', quantity: 1 },
      { productId: '12', size: '34', quantity: 2 },
      { productId: '1', size: 'XL', quantity: 1 },
      { productId: '26', size: 'S', quantity: 1 },
    ]);
    assert.equal(r.status, 201);
    const items = t.store._data.orders[r.body.orderId].items;
    assert.deepEqual(items.map((i) => [i.product_id, i.size, i.quantity]), [['12', '30', 1], ['12', '34', 2], ['1', 'XL', 1], ['26', 'S', 1]]);
  });

  test('same product + same size sent twice is merged into one line', async () => {
    const r = await create([{ productId: '12', size: '32', quantity: 1 }, { productId: '12', size: '32', quantity: 2 }]);
    const items = t.store._data.orders[r.body.orderId].items;
    assert.equal(items.length, 1);
    assert.equal(items[0].quantity, 3);
  });

  test('missing size is rejected instead of saving a blank size', async () => {
    const r = await create([{ productId: '12', quantity: 1 }]);
    assert.equal(r.status, 400);
    assert.equal(r.body.code, 'size_required');
  });

  test('a size the product does not have is rejected', async () => {
    const r = await create([{ productId: '12', size: 'XXXL', quantity: 1 }]);
    assert.equal(r.status, 409);
    assert.equal(r.body.code, 'size_invalid');
  });

  test('products without sizes are accepted without one and stored as not applicable', async () => {
    const r = await create([{ productId: 'mp_nosize', quantity: 1 }]);
    assert.equal(r.status, 201);
    const [item] = t.store._data.orders[r.body.orderId].items;
    assert.equal(item.size_applicable, false);
  });

  test('marketplace product size is validated against its own sizes', async () => {
    assert.equal((await create([{ productId: 'mp_ok', size: 'M', quantity: 1 }])).status, 201);
    assert.equal((await create([{ productId: 'mp_ok', size: '32', quantity: 1 }])).status, 409);
  });

  test('quantity limits are enforced', async () => {
    assert.equal((await create([{ productId: '12', size: '32', quantity: 0 }])).status, 400);
    assert.equal((await create([{ productId: '12', size: '32', quantity: 11 }])).status, 400);
    assert.equal((await create([{ productId: '12', size: '32', quantity: 1.5 }])).status, 400);
  });

  test('seller copy of a paid order contains only that seller\'s items, with sizes', async () => {
    const r = await create([{ productId: 'mp_ok', size: 'L', quantity: 2 }, { productId: '12', size: '30', quantity: 1 }]);
    const p = t.rzp.pay(r.body.razorpayOrderId);
    await t.call('POST', '/api/checkout/verify', { token: 'tok_alice', body: { orderId: r.body.orderId, razorpay_order_id: p.order_id, razorpay_payment_id: p.id, razorpay_signature: p.signature } });
    const copy = t.store._data.seller_orders.s_live[r.body.orderId];
    assert.equal(copy.items.length, 1);
    assert.equal(copy.items[0].size, 'L');
  });
});

describe('marketplace eligibility (issue 5)', () => {
  for (const [id, code] of [
    ['mp_pending', 'product_unavailable'],
    ['mp_rejected', 'product_unavailable'],
    ['mp_suspended_seller', 'seller_unavailable'],
    ['mp_not_live', 'seller_unavailable'],
    ['does_not_exist', 'product_not_found'],
  ]) {
    test(`${id} cannot be bought (${code})`, async () => {
      const r = await create([{ productId: id, size: 'M', quantity: 1 }]);
      assert.equal(r.status, 409);
      assert.equal(r.body.code, code);
    });
  }

  test('unavailable delivery tiers are refused server-side', async () => {
    const r = await create([{ productId: '12', size: '32', quantity: 1 }], 'tok_alice', { shippingOption: 'express' });
    assert.equal(r.status, 400);
    assert.equal(r.body.code, 'shipping_unavailable');
  });

  test('invalid contact details are refused', async () => {
    const r = await create([{ productId: '12', size: '32', quantity: 1 }], 'tok_alice', { contact: { firstName: 'A', lastName: 'B', email: 'x', phone: '123' } });
    assert.equal(r.status, 400);
  });
});

describe('email endpoint abuse (issue 2)', () => {
  test('the old open relay endpoint is gone', async () => {
    const r = await t.call('POST', '/api/send-email', { body: { to: 'victim@example.com', subject: 'Reset your password', html: '<a href=evil>x</a>' } });
    assert.equal(r.status, 404);
    assert.equal(t.mailer.sent.length, 0);
  });

  test('legacy unauthenticated payment endpoints are gone', async () => {
    for (const [m, p] of [['POST', '/api/create-order'], ['POST', '/api/verify-payment'], ['GET', '/api/order-status/x'], ['POST', '/api/close-qr/x']]) {
      assert.equal((await t.call(m, p, { body: m === 'POST' ? { amount: 100 } : undefined })).status, 404, p);
    }
  });

  test('welcome email requires sign-in', async () => {
    const r = await t.call('POST', '/api/emails/welcome', { body: { to: 'victim@example.com' } });
    assert.equal(r.status, 401);
    assert.equal(t.mailer.sent.length, 0);
  });

  test('recipient, subject and HTML from the request are ignored', async () => {
    const r = await t.call('POST', '/api/emails/welcome', { token: 'tok_alice', body: { to: 'victim@example.com', subject: 'Hacked', html: '<script>x</script>' } });
    assert.equal(r.status, 202);
    assert.equal(t.mailer.sent.length, 1);
    assert.equal(t.mailer.sent[0].to, 'alice@example.com');
    assert.ok(!t.mailer.sent[0].html.includes('<script>'));
    assert.ok(!t.mailer.sent[0].subject.includes('Hacked'));
  });

  test('stored names are HTML-escaped (no template injection)', async () => {
    await t.call('POST', '/api/emails/welcome', { token: 'tok_alice' });
    assert.ok(!t.mailer.sent[0].html.includes('<img src=x'));
    assert.ok(t.mailer.sent[0].html.includes('&lt;img src=x'));
  });

  test('welcome email is sent once per account, then rate limited', async () => {
    const r1 = await t.call('POST', '/api/emails/welcome', { token: 'tok_bob' });
    const r2 = await t.call('POST', '/api/emails/welcome', { token: 'tok_bob' });
    assert.equal(r1.body.status, 'sent');
    assert.equal(r2.body.status, 'duplicate');
    await t.call('POST', '/api/emails/welcome', { token: 'tok_bob' });
    const r4 = await t.call('POST', '/api/emails/welcome', { token: 'tok_bob' });
    assert.equal(r4.status, 429);
    assert.equal(t.mailer.sent.length, 1);
  });

  test('order confirmation can only be triggered by a verified payment', async () => {
    // There is no endpoint that accepts an order ID to "send a confirmation"; creating an order alone sends nothing.
    await create([{ productId: '12', size: '32', quantity: 1 }]);
    assert.equal(t.mailer.sent.length, 0);
  });

  test('escapeHtml covers all HTML metacharacters', () => {
    assert.equal(escapeHtml(`<a href="x" onclick='y'>&</a>`), '&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;');
    assert.ok(!welcomeEmail({ name: 'A\r\nBcc: x@y.z', siteUrl: 'https://b' }).subject.includes('\n'));
  });
});

describe('CORS and auth', () => {
  test('allowed origin gets CORS headers; other origins do not', async () => {
    const ok = await t.call('GET', '/api/health', { headers: { Origin: ORIGIN } });
    assert.equal(ok.headers.get('access-control-allow-origin'), ORIGIN);
    const bad = await t.call('GET', '/api/health', { headers: { Origin: 'https://evil.example' } });
    assert.equal(bad.headers.get('access-control-allow-origin'), null);
  });

  test('checkout requires a valid Firebase token', async () => {
    assert.equal((await create([{ productId: '12', size: '32', quantity: 1 }], null)).status, 401);
    assert.equal((await create([{ productId: '12', size: '32', quantity: 1 }], 'forged-token')).status, 401);
  });

  test('admin endpoints reject customers and unauthenticated callers', async () => {
    assert.equal((await t.call('GET', '/api/admin/orders/attention')).status, 401);
    assert.equal((await t.call('POST', '/api/admin/orders/x/reconcile', { token: 'tok_bob' })).status, 403);
  });

  test('/api/config exposes only the public key id', async () => {
    const r = await t.call('GET', '/api/config');
    assert.deepEqual(Object.keys(r.body).sort(), ['mode', 'razorpayKeyId']);
    assert.ok(!JSON.stringify(r.body).includes('secret'));
  });
});

describe('configuration safety (issue 10)', () => {
  const base = { RAZORPAY_KEY_SECRET: 's', ALLOWED_ORIGINS: 'https://brandclothzy.com', GOOGLE_APPLICATION_CREDENTIALS: '/x.json' };
  test('live keys are refused outside production unless explicitly allowed', () => {
    assert.equal(loadConfig({ ...base, NODE_ENV: 'development', RAZORPAY_KEY_ID: 'rzp_live_abc' }).ok, false);
    assert.equal(loadConfig({ ...base, NODE_ENV: 'development', RAZORPAY_KEY_ID: 'rzp_live_abc', ALLOW_LIVE_PAYMENTS_IN_DEV: 'true' }).ok, true);
    assert.equal(loadConfig({ ...base, NODE_ENV: 'production', RAZORPAY_KEY_ID: 'rzp_live_abc' }).ok, true);
    assert.equal(loadConfig({ ...base, NODE_ENV: 'development', RAZORPAY_KEY_ID: 'rzp_test_abc' }).ok, true);
  });
  test('production requires an explicit CORS allowlist and Firebase credentials', () => {
    assert.equal(loadConfig({ NODE_ENV: 'production', RAZORPAY_KEY_ID: 'rzp_live_a', RAZORPAY_KEY_SECRET: 's', GOOGLE_APPLICATION_CREDENTIALS: '/x' }).ok, false);
    assert.equal(loadConfig({ NODE_ENV: 'production', RAZORPAY_KEY_ID: 'rzp_live_a', RAZORPAY_KEY_SECRET: 's', ALLOWED_ORIGINS: 'https://a.com' }).ok, false);
  });
  test('Cloud Run uses its built-in identity instead of a key file', () => {
    const prod = { NODE_ENV: 'production', RAZORPAY_KEY_ID: 'rzp_live_a', RAZORPAY_KEY_SECRET: 's', ALLOWED_ORIGINS: 'https://brandclothzy.com' };
    assert.equal(loadConfig(prod).ok, false);
    assert.equal(loadConfig({ ...prod, K_SERVICE: 'brandclothzy-api' }).ok, true);
  });
  test('config errors never contain secret values', () => {
    const c = loadConfig({ NODE_ENV: 'development', RAZORPAY_KEY_ID: 'rzp_live_SECRETKEYID', RAZORPAY_KEY_SECRET: 'supersecretvalue' });
    assert.ok(!JSON.stringify([c.errors, c.warnings]).includes('supersecretvalue'));
    assert.ok(!JSON.stringify([c.errors, c.warnings]).includes('SECRETKEYID'));
  });
});
