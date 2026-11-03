import crypto from 'crypto';
import { createApp } from '../app.js';
import { createMemoryStore } from '../lib/store.js';
import { loadConfig } from '../lib/config.js';

export const KEY_SECRET = 'test_key_secret_not_real';
export const WEBHOOK_SECRET = 'test_webhook_secret_not_real';
export const ORIGIN = 'http://localhost:5173';

export const sign = (secret, payload) => crypto.createHmac('sha256', secret).update(payload).digest('hex');

/** Offline stand-in for the Razorpay Node SDK (only the calls the API uses). */
export function createFakeRazorpay() {
  const orders = new Map();
  const payments = new Map();
  let n = 0;
  const fake = { down: false, captureFails: false, calls: { create: 0, capture: 0 } };
  fake.api = {
    orders: {
      async create({ amount, currency, receipt, notes }) {
        if (fake.down) throw new Error('gateway down');
        fake.calls.create += 1;
        const o = { id: `order_T${String(++n).padStart(6, '0')}`, amount, currency, receipt, notes, status: 'created' };
        orders.set(o.id, o);
        return { ...o };
      },
      async fetchPayments(orderId) {
        return { items: [...payments.values()].filter((p) => p.order_id === orderId).map((p) => ({ ...p })) };
      },
    },
    payments: {
      async fetch(id) {
        const p = payments.get(id);
        if (!p) throw Object.assign(new Error('not found'), { statusCode: 400 });
        return { ...p };
      },
      async capture(id, amount, currency) {
        fake.calls.capture += 1;
        if (fake.captureFails) throw new Error('capture failed');
        const p = payments.get(id);
        if (!p || p.status !== 'authorized' || p.amount !== amount || p.currency !== currency) throw new Error('bad capture');
        p.status = 'captured';
        return { ...p };
      },
    },
  };
  /** Simulates a customer paying in the Razorpay popup. */
  fake.pay = (orderId, { amount, currency = 'INR', status = 'captured', id } = {}) => {
    const o = orders.get(orderId);
    const p = {
      id: id || `pay_T${String(++n).padStart(6, '0')}`,
      order_id: orderId,
      amount: amount ?? o.amount,
      currency,
      status,
      method: 'upi',
      notes: o?.notes || {},
      created_at: n,
    };
    payments.set(p.id, p);
    return { ...p, signature: sign(KEY_SECRET, `${orderId}|${p.id}`) };
  };
  fake.setPayment = (id, patch) => Object.assign(payments.get(id), patch);
  return fake;
}

export const USERS = {
  tok_alice: { uid: 'alice', email: 'alice@example.com', email_verified: true, name: 'Alice' },
  tok_bob: { uid: 'bob', email: 'bob@example.com', email_verified: true, name: 'Bob' },
  tok_admin: { uid: 'boss', email: 'boss@example.com', email_verified: true, name: 'Boss', admin: true },
};

export function createMailerSpy() {
  const sent = [];
  const mailer = {
    sent,
    failNext: 0,
    async send(msg) {
      if (mailer.failNext > 0) {
        mailer.failNext -= 1;
        throw new Error('smtp down');
      }
      sent.push(msg);
      return { messageId: `m${sent.length}` };
    },
  };
  return mailer;
}

export const silentLogger = { log() {}, warn() {}, error() {} };

export async function startServer({ seed = {}, env = {} } = {}) {
  const config = loadConfig({
    NODE_ENV: 'test',
    RAZORPAY_KEY_ID: 'rzp_test_FAKEKEY000001',
    RAZORPAY_KEY_SECRET: KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET: WEBHOOK_SECRET,
    ALLOWED_ORIGINS: ORIGIN,
    FIREBASE_SERVICE_ACCOUNT_JSON: '{}',
    ...env,
  });
  const store = createMemoryStore(seed);
  const rzp = createFakeRazorpay();
  const mailer = createMailerSpy();
  const app = createApp({
    config,
    store,
    razorpay: rzp.api,
    mailer,
    logger: silentLogger,
    verifyIdToken: async (t) => {
      if (!USERS[t]) throw new Error('bad token');
      return USERS[t];
    },
  });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;

  const call = async (method, path, { token, body, headers = {}, raw } = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: {
        ...(body !== undefined || raw !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: raw !== undefined ? raw : body !== undefined ? JSON.stringify(body) : undefined,
    });
    let json = null;
    try {
      json = await res.json();
    } catch {
      /* empty body */
    }
    return { status: res.status, body: json, headers: res.headers };
  };

  const sendWebhook = (event, { eventId = crypto.randomUUID(), secret = WEBHOOK_SECRET } = {}) => {
    const raw = JSON.stringify(event);
    return call('POST', '/api/webhooks/razorpay', { raw, headers: { 'x-razorpay-signature': sign(secret, raw), 'x-razorpay-event-id': eventId } });
  };

  return { base, call, sendWebhook, store, rzp, mailer, config, close: () => new Promise((r) => server.close(r)) };
}

export const CONTACT = { firstName: 'Alice', lastName: 'Shah', email: 'alice@example.com', phone: '9876543210' };
export const ADDRESS = { address: '12 MG Road', city: 'Ahmedabad', state: 'Gujarat', pincode: '380001' };

export const checkoutBody = (items, extra = {}) => ({
  idempotencyKey: crypto.randomUUID(),
  items,
  shippingOption: 'standard',
  contact: CONTACT,
  shippingAddress: ADDRESS,
  ...extra,
});
