/**
 * Firebase Realtime Database security-rules tests (issue 6).
 *
 * Requires the Firebase Emulator Suite (Java 11+ and firebase-tools):
 *   npx firebase-tools emulators:exec --only database --project demo-brandclothzy "node --test tests/rules/"
 *
 * Roles covered: visitor, customer, other customer, applicant seller, live seller,
 * suspended seller, administrator (custom claim admin=true).
 */
import { test, before, after, beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { ref, get, set, update, push, query, orderByChild, equalTo } from 'firebase/database';

let env;
const db = (uid, claims = {}) => (uid ? env.authenticatedContext(uid, { email: `${uid}@example.com`, ...claims }) : env.unauthenticatedContext()).database();

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-brandclothzy',
    database: { rules: readFileSync(new URL('../../database.rules.json', import.meta.url), 'utf8'), host: '127.0.0.1', port: 9000 },
  });
});
after(async () => env?.cleanup());

beforeEach(async () => {
  await env.clearDatabase();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const d = ctx.database();
    await set(ref(d), {
      sellers: {
        live_s: { uid: 'live_s', status: 'live', email: 'live_s@example.com', verification: { verified: true }, financial: { commission_rate: 25 }, catalog_sample: { approved: true }, brand_profile: { brand_tier: 'premium' } },
        applied_s: { uid: 'applied_s', status: 'applied', email: 'applied_s@example.com', verification: { verified: false }, financial: { commission_rate: 25 }, catalog_sample: { approved: false }, brand_profile: { brand_tier: '' } },
        suspended_s: { uid: 'suspended_s', status: 'suspended', email: 'suspended_s@example.com' },
        approved_s: { uid: 'approved_s', status: 'approved', email: 'approved_s@example.com', financial: { commission_rate: 25 } },
      },
      products: {
        p_live: { name: 'Kurta', price: 500, status: 'approved', seller_id: 'live_s' },
        p_pending: { name: 'Draft', price: 500, status: 'pending_review', seller_id: 'live_s' },
        p_other: { name: 'Other', price: 500, status: 'approved', seller_id: 'approved_s' },
      },
      orders: {
        o_alice: { id: 'o_alice', pricing_version: 2, customer_id: 'alice', total: 759, amount_paise: 75900, status: 'pending', payment_status: 'captured', items: { 0: { name: 'x', unit_price: 355 } } },
        o_unpaid: { id: 'o_unpaid', pricing_version: 2, customer_id: 'alice', total: 759, status: 'awaiting_payment', payment_status: 'created' },
        o_bob: { id: 'o_bob', pricing_version: 2, customer_id: 'bob', total: 100, status: 'pending', payment_status: 'captured' },
      },
      seller_orders: { live_s: { o_alice: { id: 'o_alice', status: 'pending' } } },
      users: { alice: { uid: 'alice', name: 'Alice', email: 'alice@example.com' } },
    });
  });
});

// ── Visitors ───────────────────────────────────────────────────────────────
test('visitor can list approved products only via the approved query', async () => {
  await assertSucceeds(get(query(ref(db(null), 'products'), orderByChild('status'), equalTo('approved'))));
  await assertFails(get(ref(db(null), 'products')));
  await assertFails(get(query(ref(db(null), 'products'), orderByChild('status'), equalTo('pending_review'))));
  await assertFails(get(ref(db(null), 'products/p_pending')));
});
test('visitor cannot read orders, sellers, users or subscribers', async () => {
  for (const p of ['orders', 'orders/o_alice', 'sellers', 'sellers/live_s', 'users/alice', 'newsletter_subscribers', 'audit_logs']) {
    await assertFails(get(ref(db(null), p)));
  }
});
test('visitor can subscribe once, but cannot overwrite or read the list', async () => {
  const sub = { email: 'new@example.com', created_at: '2026-11-03' };
  await assertSucceeds(set(ref(db(null), 'newsletter_subscribers/new%40example%2Ecom'), sub));
  await assertFails(set(ref(db(null), 'newsletter_subscribers/new%40example%2Ecom'), sub));
  await assertFails(set(ref(db(null), 'newsletter_subscribers/bad'), { email: 'not-an-email', created_at: 'x' }));
});

// ── Customers ──────────────────────────────────────────────────────────────
test("customer reads own orders but not another customer's", async () => {
  await assertSucceeds(get(query(ref(db('alice'), 'orders'), orderByChild('customer_id'), equalTo('alice'))));
  await assertSucceeds(get(ref(db('alice'), 'orders/o_alice')));
  await assertFails(get(ref(db('alice'), 'orders/o_bob')));
  await assertFails(get(query(ref(db('alice'), 'orders'), orderByChild('customer_id'), equalTo('bob'))));
  await assertFails(get(ref(db('alice'), 'orders')));
});
test('customer cannot create, edit, mark paid, change totals or delete orders', async () => {
  const d = db('alice');
  await assertFails(set(ref(d, 'orders/new1'), { customer_id: 'alice', total: 1, status: 'pending', payment_status: 'captured' }));
  await assertFails(update(ref(d, 'orders/o_unpaid'), { payment_status: 'captured' }));
  await assertFails(update(ref(d, 'orders/o_alice'), { total: 1 }));
  await assertFails(set(ref(d, 'orders/o_alice'), null));
});
test('customer cannot edit another profile or grant themselves admin', async () => {
  await assertFails(set(ref(db('alice'), 'users/bob'), { uid: 'bob', name: 'x' }));
  await assertFails(update(ref(db('alice'), 'users/alice'), { isAdmin: true }));
  await assertFails(update(ref(db('alice'), 'users/alice'), { role: 'admin' }));
  await assertFails(update(ref(db('alice'), 'users/alice'), { email: 'other@example.com' }));
  await assertSucceeds(update(ref(db('alice'), 'users/alice'), { name: 'Alice S', last_login: 'now' }));
});
test('customer cannot read private seller data or write audit logs', async () => {
  await assertFails(get(ref(db('alice'), 'sellers/live_s')));
  await assertFails(set(push(ref(db('alice'), 'audit_logs')), { type: 'x', actor_uid: 'alice' }));
});

// ── Sellers ────────────────────────────────────────────────────────────────
test('new seller application must start as applied and unverified', async () => {
  const base = { uid: 'newbie', email: 'newbie@example.com', verification: { verified: false }, financial: { commission_rate: 25 }, catalog_sample: { approved: false }, brand_profile: { brand_tier: '' } };
  await assertFails(set(ref(db('newbie'), 'sellers/newbie'), { ...base, status: 'live' }));
  await assertFails(set(ref(db('newbie'), 'sellers/newbie'), { ...base, status: 'applied', verification: { verified: true } }));
  await assertFails(set(ref(db('newbie'), 'sellers/newbie'), { ...base, status: 'applied', financial: { commission_rate: 0 } }));
  await assertSucceeds(set(ref(db('newbie'), 'sellers/newbie'), { ...base, status: 'applied' }));
});
test('seller cannot approve themselves, go live, verify or change commission', async () => {
  const d = db('applied_s');
  await assertFails(update(ref(d, 'sellers/applied_s'), { status: 'approved' }));
  await assertFails(update(ref(d, 'sellers/applied_s'), { status: 'live' }));
  await assertFails(update(ref(d, 'sellers/applied_s'), { 'verification/verified': true }));
  await assertFails(update(ref(d, 'sellers/applied_s'), { 'financial/commission_rate': 0 }));
  await assertFails(update(ref(d, 'sellers/applied_s'), { 'brand_profile/brand_tier': 'premium' }));
  await assertSucceeds(update(ref(d, 'sellers/applied_s'), { return_policy: '7 days' }));
});
test('approved seller may only move to onboarding_complete', async () => {
  await assertFails(update(ref(db('approved_s'), 'sellers/approved_s'), { status: 'live' }));
  await assertSucceeds(update(ref(db('approved_s'), 'sellers/approved_s'), { status: 'onboarding_complete' }));
});
test('seller cannot read other sellers', async () => {
  await assertFails(get(ref(db('live_s'), 'sellers/approved_s')));
  await assertFails(get(ref(db('live_s'), 'sellers')));
});
test('seller products always go to review; sellers cannot publish or edit others', async () => {
  const d = db('live_s');
  await assertSucceeds(set(ref(d, 'products/new_p'), { name: 'New', price: 300, status: 'pending_review', seller_id: 'live_s' }));
  await assertFails(set(ref(d, 'products/new_p2'), { name: 'New', price: 300, status: 'approved', seller_id: 'live_s' }));
  await assertFails(update(ref(d, 'products/p_pending'), { status: 'approved' }));
  await assertFails(update(ref(d, 'products/p_live'), { name: 'Renamed without review' }));
  await assertSucceeds(update(ref(d, 'products/p_live'), { name: 'Renamed', status: 'pending_review' }));
  await assertFails(update(ref(d, 'products/p_other'), { name: 'Hijack', status: 'pending_review' }));
  await assertFails(set(ref(d, 'products/x'), { name: 'Spoof', price: 300, status: 'pending_review', seller_id: 'approved_s' }));
  await assertFails(set(ref(d, 'products/neg'), { name: 'Neg', price: -1, status: 'pending_review', seller_id: 'live_s' }));
});
test('pending applicant and suspended seller cannot list products', async () => {
  await assertFails(set(ref(db('applied_s'), 'products/a1'), { name: 'A', price: 1, status: 'pending_review', seller_id: 'applied_s' }));
  await assertFails(set(ref(db('suspended_s'), 'products/s1'), { name: 'S', price: 1, status: 'pending_review', seller_id: 'suspended_s' }));
});
test('seller sees own seller-order copies only, read-only', async () => {
  await assertSucceeds(get(ref(db('live_s'), 'seller_orders/live_s')));
  await assertFails(get(ref(db('approved_s'), 'seller_orders/live_s')));
  await assertFails(update(ref(db('live_s'), 'seller_orders/live_s/o_alice'), { status: 'delivered' }));
  await assertFails(get(ref(db('live_s'), 'orders/o_alice')));
});

// ── Administrators ─────────────────────────────────────────────────────────
const admin = () => db('boss', { admin: true });
test('admin custom claim is required — the email alone grants nothing', async () => {
  const fake = env.authenticatedContext('impostor', { email: 'soorajpandya@gmail.com' }).database();
  await assertFails(get(ref(fake, 'orders')));
  await assertFails(update(ref(fake, 'products/p_pending'), { status: 'approved' }));
});
test('admin can moderate sellers and products', async () => {
  await assertSucceeds(update(ref(admin(), 'sellers/applied_s'), { status: 'approved' }));
  await assertSucceeds(update(ref(admin(), 'products/p_pending'), { status: 'approved' }));
  await assertSucceeds(set(push(ref(admin(), 'audit_logs')), { type: 'product_approved', actor_uid: 'boss' }));
  await assertFails(set(push(ref(admin(), 'audit_logs')), { type: 'spoof', actor_uid: 'someone_else' }));
});
test('admin can change fulfilment status but not money or payment fields', async () => {
  await assertSucceeds(update(ref(admin(), 'orders/o_alice'), { status: 'shipped', updated_at: 'now' }));
  await assertFails(update(ref(admin(), 'orders/o_alice'), { total: 1 }));
  await assertFails(update(ref(admin(), 'orders/o_alice'), { payment_status: 'refunded' }));
  await assertFails(update(ref(admin(), 'orders/o_unpaid'), { status: 'shipped' }));
  await assertFails(set(ref(admin(), 'orders/o_alice'), null));
  await assertFails(set(ref(admin(), 'orders/forged'), { customer_id: 'alice', status: 'pending' }));
});
