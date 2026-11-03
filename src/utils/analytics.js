/**
 * One tracking API for the whole storefront.
 *
 *   track('add_to_cart', { items: [toItem(product, { size, quantity })] })
 *
 * Every event goes to Google Analytics 4 (standard e-commerce event names, so GA4's
 * Monetization reports work) AND to the Meta Pixel (mapped to Meta's standard events),
 * so both tools always see the same funnel. Microsoft Clarity records sessions.
 *
 * Nothing loads and nothing is sent until the visitor accepts the cookie banner.
 * Purchases are also reported server-side after the payment is verified (server/lib/tracking.js);
 * the browser Purchase uses the order ID as Meta event_id so Meta de-duplicates the two.
 */
import { app } from '../firebase';
import { hasAnalyticsConsent, onConsentChange } from './consent';
import { customerUnitPrice, CURRENCY } from '../../shared/pricing.js';

export const META_PIXEL_ID = '1261232606125599';
const CLARITY_PROJECT_ID = import.meta.env.VITE_CLARITY_PROJECT_ID || '';

let started = false;
let ga = null; // { analytics, logEvent, setAnalyticsCollectionEnabled }
const pending = []; // GA4 events sent before the SDK finished loading
let serverTracksGa4Purchase = false;

function loadMetaPixel() {
  if (window.fbq) return;
  /* eslint-disable */
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n;
    n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
    t = b.createElement(e); t.async = !0; t.src = v;
    s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
  window.fbq('consent', 'grant');
  window.fbq('init', META_PIXEL_ID);
  window.fbq('track', 'PageView');
}

function loadClarity() {
  if (!CLARITY_PROJECT_ID || window.clarity) return;
  /* eslint-disable */
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, 'clarity', 'script', CLARITY_PROJECT_ID);
  /* eslint-enable */
  window.clarity('consent');
}

async function loadGa4() {
  const m = await import('firebase/analytics');
  if (!(await m.isSupported())) return;
  ga = { analytics: m.getAnalytics(app), logEvent: m.logEvent, setAnalyticsCollectionEnabled: m.setAnalyticsCollectionEnabled };
  ga.setAnalyticsCollectionEnabled(ga.analytics, true);
  while (pending.length) {
    const [name, params] = pending.shift();
    ga.logEvent(ga.analytics, name, params);
  }
}

function start() {
  if (started) {
    // Consent given again after a withdrawal in the same visit.
    if (ga) ga.setAnalyticsCollectionEnabled(ga.analytics, true);
    window.fbq?.('consent', 'grant');
    window.clarity?.('consent');
    return;
  }
  started = true;
  loadMetaPixel();
  loadClarity();
  loadGa4().catch(() => {});
}

function stop() {
  if (ga) ga.setAnalyticsCollectionEnabled(ga.analytics, false);
  window.fbq?.('consent', 'revoke');
  window.clarity?.('consent', false);
  pending.length = 0;
}

/** Call once at app start. Loads trackers only if/when the visitor has consented. */
export function initAnalytics() {
  if (typeof window === 'undefined') return;
  if (hasAnalyticsConsent()) start();
  onConsentChange((c) => (c.analytics ? start() : stop()));
}

/** Set from the checkout response: when true, the server reports GA4 purchases (avoids double counting). */
export function setServerPurchaseTracking({ ga4 } = {}) {
  serverTracksGa4Purchase = Boolean(ga4);
}

/** GA4 item from a product (base price → customer price). */
export function toItem(product, { size = '', quantity = 1, index } = {}) {
  return {
    item_id: String(product.id),
    item_name: product.name,
    item_category: product.gender ? `${product.gender} - ${product.category}` : product.category,
    ...(size ? { item_variant: size } : {}),
    price: customerUnitPrice(product.price),
    quantity,
    ...(index != null ? { index } : {}),
  };
}

const valueOf = (items) => items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);

const META_EVENTS = {
  view_item: 'ViewContent',
  add_to_cart: 'AddToCart',
  add_to_wishlist: 'AddToWishlist',
  begin_checkout: 'InitiateCheckout',
  add_payment_info: 'AddPaymentInfo',
  purchase: 'Purchase',
  search: 'Search',
  sign_up: 'CompleteRegistration',
  generate_lead: 'Contact',
  find_location: 'FindLocation',
  seller_application: 'SubmitApplication',
};

function toMeta(event, p) {
  const items = p.items || [];
  const base = items.length
    ? {
        content_ids: items.map((i) => i.item_id),
        content_type: 'product',
        contents: items.map((i) => ({ id: i.item_id, quantity: i.quantity })),
        num_items: items.reduce((s, i) => s + (i.quantity || 1), 0),
        value: p.value ?? valueOf(items),
        currency: p.currency || CURRENCY,
      }
    : {};
  if (event === 'search') return { search_string: p.search_term };
  return base;
}

/**
 * Sends an event to GA4 and the Meta Pixel. Silently does nothing without consent.
 * @param {string} event GA4 event name (view_item, add_to_cart, begin_checkout, purchase, …)
 * @param {object} params GA4 params; `items` from toItem()
 */
export function track(event, params = {}) {
  if (!hasAnalyticsConsent()) return;
  const items = params.items || [];
  const gaParams = items.length ? { currency: CURRENCY, value: valueOf(items), ...params } : { ...params };

  const skipGa = event === 'purchase' && serverTracksGa4Purchase;
  if (!skipGa) {
    if (ga) ga.logEvent(ga.analytics, event, gaParams);
    else pending.push([event, gaParams]);
  }

  const metaName = META_EVENTS[event];
  if (metaName && window.fbq) {
    const options = event === 'purchase' && params.transaction_id ? { eventID: String(params.transaction_id) } : undefined;
    window.fbq('track', metaName, toMeta(event, gaParams), options);
  }
}

/** Meta PageView on client-side route changes (GA4 page views come from Enhanced Measurement). */
export function trackPageView() {
  if (!hasAnalyticsConsent()) return;
  window.fbq?.('track', 'PageView');
}

/** Identifiers the server needs to attribute the verified purchase to this visit (consent only). */
export function getAttribution() {
  if (!hasAnalyticsConsent()) return { consent: false };
  const cookies = Object.fromEntries(
    document.cookie.split(';').map((c) => c.trim().split('=')).filter(([k]) => k).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))])
  );
  // _ga = GA1.1.<random>.<timestamp> → client_id "<random>.<timestamp>"
  const gaClientId = (cookies._ga || '').split('.').slice(-2).join('.') || undefined;
  // _ga_<STREAM> = GS1.1.<session_id>.… or GS2.1.s<session_id>$…
  const streamCookie = Object.entries(cookies).find(([k]) => k.startsWith('_ga_'))?.[1] || '';
  const gaSessionId = (streamCookie.match(/^GS1\.\d\.(\d+)/) || streamCookie.match(/^GS2\.\d\.s(\d+)/) || [])[1];
  return { consent: true, gaClientId, gaSessionId, fbp: cookies._fbp, fbc: cookies._fbc };
}
