/**
 * Persistence layer. One interface, two implementations:
 *   createRtdbStore(db)  — Firebase Realtime Database via the Admin SDK (production).
 *   createMemoryStore()  — in-memory, used by the automated tests.
 *
 * NOTE: the Admin SDK bypasses Firebase security rules, so every caller of this store
 * must enforce authorization itself (see app.js).
 *
 * Paths written only by the server (clients have no rule granting access):
 *   orders/{orderId}                       – order + immutable pricing snapshot
 *   razorpay_orders/{razorpayOrderId}      – index → internal order
 *   checkout_attempts/{uid}/{key}          – idempotency for "Pay" double-clicks
 *   webhook_events/{eventId}               – webhook de-duplication
 *   email_log/{key}                        – transactional email de-duplication
 *   seller_orders/{sellerId}/{orderId}     – seller-scoped copy of paid orders
 *   audit_logs/{pushId}                    – append-only audit trail
 */

const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));

export function createRtdbStore(db) {
  const ref = (p) => db.ref(p);
  const val = async (p) => (await ref(p).get()).val();

  async function transaction(path, fn) {
    const result = await ref(path).transaction((current) => fn(current), undefined, false);
    return { committed: result.committed, value: result.snapshot.val() };
  }

  return {
    newOrderId: () => ref('orders').push().key,
    getProduct: (id) => val(`products/${id}`),
    getSeller: (uid) => val(`sellers/${uid}`),
    getUser: (uid) => val(`users/${uid}`),
    getOrder: (id) => val(`orders/${id}`),
    putOrder: (order) => ref(`orders/${order.id}`).set(order),
    updateOrder: (id, fn) => transaction(`orders/${id}`, fn),
    setRazorpayIndex: (rzpOrderId, data) => ref(`razorpay_orders/${rzpOrderId}`).set(data),
    getRazorpayIndex: (rzpOrderId) => val(`razorpay_orders/${rzpOrderId}`),
    getCheckoutAttempt: (uid, key) => val(`checkout_attempts/${uid}/${key}`),
    setCheckoutAttempt: (uid, key, data) => ref(`checkout_attempts/${uid}/${key}`).set(data),
    async claimWebhookEvent(eventId) {
      const r = await transaction(`webhook_events/${eventId}`, (cur) => (cur ? undefined : { status: 'processing', at: new Date().toISOString() }));
      return r.committed ? 'claimed' : 'duplicate';
    },
    completeWebhookEvent: (eventId, data) => ref(`webhook_events/${eventId}`).set({ status: 'processed', at: new Date().toISOString(), ...data }),
    releaseWebhookEvent: (eventId) => ref(`webhook_events/${eventId}`).remove(),
    async claimEmail(key) {
      const r = await transaction(`email_log/${key}`, (cur) => (cur ? undefined : { status: 'sending', at: new Date().toISOString() }));
      return r.committed;
    },
    setEmailStatus: (key, data) => ref(`email_log/${key}`).set({ ...data, at: new Date().toISOString() }),
    releaseEmail: (key) => ref(`email_log/${key}`).remove(),
    appendAudit: (entry) => ref('audit_logs').push({ ...entry, at: new Date().toISOString() }),
    writeSellerOrders: (updates) => ref().update(updates),
    async listOrdersNeedingReview() {
      const snap = await ref('orders').orderByChild('needs_review').equalTo(true).get();
      return Object.values(snap.val() || {});
    },
    async listAwaitingPayment(limit = 50) {
      const snap = await ref('orders').orderByChild('status').equalTo('awaiting_payment').limitToLast(limit).get();
      return Object.values(snap.val() || {});
    },
  };
}

export function createMemoryStore(seed = {}) {
  const data = clone(seed) || {};
  const get = (path) => path.split('/').reduce((node, k) => (node == null ? undefined : node[k]), data);
  const set = (path, value) => {
    const keys = path.split('/');
    let node = data;
    for (const k of keys.slice(0, -1)) node = node[k] ??= {};
    if (value === null || value === undefined) delete node[keys.at(-1)];
    else node[keys.at(-1)] = clone(value);
  };
  let counter = 0;
  const audit = [];

  // Allow tests to inject failures.
  const faults = { putOrder: 0, updateOrder: 0 };
  const maybeFail = (name) => {
    if (faults[name] > 0) {
      faults[name] -= 1;
      throw new Error(`Injected ${name} failure`);
    }
  };

  function transaction(path, fn) {
    const next = fn(clone(get(path)) ?? null);
    if (next === undefined) return { committed: false, value: clone(get(path)) };
    set(path, next);
    return { committed: true, value: clone(next) };
  }

  return {
    _data: data,
    _audit: audit,
    _faults: faults,
    newOrderId: () => `ord_${String(++counter).padStart(4, '0')}`,
    getProduct: async (id) => clone(get(`products/${id}`)) ?? null,
    getSeller: async (uid) => clone(get(`sellers/${uid}`)) ?? null,
    getUser: async (uid) => clone(get(`users/${uid}`)) ?? null,
    getOrder: async (id) => clone(get(`orders/${id}`)) ?? null,
    putOrder: async (order) => { maybeFail('putOrder'); set(`orders/${order.id}`, order); },
    updateOrder: async (id, fn) => { maybeFail('updateOrder'); return transaction(`orders/${id}`, fn); },
    setRazorpayIndex: async (rzp, v) => set(`razorpay_orders/${rzp}`, v),
    getRazorpayIndex: async (rzp) => clone(get(`razorpay_orders/${rzp}`)) ?? null,
    getCheckoutAttempt: async (uid, key) => clone(get(`checkout_attempts/${uid}/${key}`)) ?? null,
    setCheckoutAttempt: async (uid, key, v) => set(`checkout_attempts/${uid}/${key}`, v),
    claimWebhookEvent: async (id) => (transaction(`webhook_events/${id}`, (c) => (c ? undefined : { status: 'processing' })).committed ? 'claimed' : 'duplicate'),
    completeWebhookEvent: async (id, v) => set(`webhook_events/${id}`, { status: 'processed', ...v }),
    releaseWebhookEvent: async (id) => set(`webhook_events/${id}`, null),
    claimEmail: async (key) => transaction(`email_log/${key}`, (c) => (c ? undefined : { status: 'sending' })).committed,
    setEmailStatus: async (key, v) => set(`email_log/${key}`, v),
    releaseEmail: async (key) => set(`email_log/${key}`, null),
    appendAudit: async (entry) => { audit.push(clone(entry)); },
    writeSellerOrders: async (updates) => { for (const [p, v] of Object.entries(updates)) set(p, v); },
    listOrdersNeedingReview: async () => Object.values(clone(get('orders')) || {}).filter((o) => o.needs_review === true),
    listAwaitingPayment: async () => Object.values(clone(get('orders')) || {}).filter((o) => o.status === 'awaiting_payment'),
  };
}
