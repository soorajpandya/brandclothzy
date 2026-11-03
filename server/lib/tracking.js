/**
 * Server-side purchase reporting, sent once per order after the payment is VERIFIED:
 *   - Google Analytics 4 Measurement Protocol  (needs GA4_MEASUREMENT_ID + GA4_API_SECRET)
 *   - Meta Conversions API                      (needs META_PIXEL_ID + META_CAPI_TOKEN)
 *
 * Only for visitors who accepted analytics cookies (order.attribution.consent === true).
 * Contact details are SHA-256 hashed before they leave the server (Meta requirement).
 * Meta de-duplicates with the browser Pixel Purchase via event_id = order ID.
 * When GA4 is configured here, the browser skips its GA4 purchase so it is counted once.
 */
import crypto from 'crypto';

const sha256 = (v) => crypto.createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex');

export function trackingStatus(config) {
  const t = config.tracking || {};
  return { ga4: Boolean(t.ga4MeasurementId && t.ga4ApiSecret), meta: Boolean(t.metaPixelId && t.metaCapiToken) };
}

const ID_PATTERNS = {
  gaClientId: /^\d{1,20}\.\d{1,20}$/,
  gaSessionId: /^\d{1,20}$/,
  fbp: /^fb\.\d\.\d{1,20}\.\d{1,30}$/,
  fbc: /^fb\.\d\.\d{1,20}\.[A-Za-z0-9_-]{1,500}$/,
};

/** Validates browser-supplied attribution; returns null unless the visitor consented. */
export function sanitizeAttribution(raw, { ip, userAgent } = {}) {
  if (!raw || raw.consent !== true) return null;
  const out = { consent: true };
  for (const [k, re] of Object.entries(ID_PATTERNS)) {
    if (typeof raw[k] === 'string' && re.test(raw[k])) out[k] = raw[k];
  }
  if (typeof ip === 'string' && ip.length <= 64) out.ip = ip;
  if (typeof userAgent === 'string') out.user_agent = userAgent.slice(0, 300);
  return out;
}

function ga4Payload(order, a) {
  return {
    client_id: a.gaClientId,
    timestamp_micros: Date.parse(order.paid_at || order.updated_at || Date.now()) * 1000,
    consent: { ad_user_data: 'GRANTED', ad_personalization: 'GRANTED' },
    events: [
      {
        name: 'purchase',
        params: {
          transaction_id: order.id,
          currency: order.currency,
          value: order.total,
          shipping: order.shipping,
          ...(a.gaSessionId ? { session_id: Number(a.gaSessionId) } : {}),
          engagement_time_msec: 1,
          items: (order.items || []).map((i) => ({
            item_id: String(i.product_id),
            item_name: i.name,
            ...(i.size ? { item_variant: i.size } : {}),
            price: i.unit_price,
            quantity: i.quantity,
          })),
        },
      },
    ],
  };
}

function metaPayload(order, a, siteUrl) {
  const phone = String(order.customer_phone || '').replace(/\D/g, '');
  return {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.parse(order.paid_at || Date.now()) / 1000),
        event_id: order.id,
        action_source: 'website',
        event_source_url: `${siteUrl}/checkout`,
        user_data: {
          ...(order.customer_email ? { em: [sha256(order.customer_email)] } : {}),
          ...(phone ? { ph: [sha256(phone.length === 10 ? `91${phone}` : phone)] } : {}),
          external_id: [sha256(order.customer_id)],
          ...(a.ip ? { client_ip_address: a.ip } : {}),
          ...(a.user_agent ? { client_user_agent: a.user_agent } : {}),
          ...(a.fbp ? { fbp: a.fbp } : {}),
          ...(a.fbc ? { fbc: a.fbc } : {}),
        },
        custom_data: {
          currency: order.currency,
          value: order.total,
          order_id: order.id,
          content_type: 'product',
          content_ids: (order.items || []).map((i) => String(i.product_id)),
          contents: (order.items || []).map((i) => ({ id: String(i.product_id), quantity: i.quantity, item_price: i.unit_price })),
          num_items: (order.items || []).reduce((s, i) => s + i.quantity, 0),
        },
      },
    ],
  };
}

async function post(fetchImpl, url, body) {
  const res = await fetchImpl(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

/**
 * Reports a paid order once per destination. Failures are logged, the claim is released
 * so a later settle (webhook / polling / admin re-check) retries; the order is never affected.
 */
export async function reportPurchase({ order, config, store, fetchImpl, logger = console }) {
  const a = order.attribution;
  const result = { ga4: 'skipped', meta: 'skipped' };
  if (!a?.consent) return result;
  const t = config.tracking || {};
  const status = trackingStatus(config);

  const once = async (name, fn) => {
    const key = `purchase_${name}__${order.id}`;
    if (!(await store.claimEmail(key))) return 'duplicate';
    try {
      await fn();
      await store.setEmailStatus(key, { status: 'sent' });
      return 'sent';
    } catch (err) {
      logger.error(`[tracking] ${name} purchase report failed for ${order.id}: ${err.message}`);
      await store.releaseEmail(key).catch(() => {});
      return 'failed';
    }
  };

  if (status.ga4 && a.gaClientId) {
    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(t.ga4MeasurementId)}&api_secret=${encodeURIComponent(t.ga4ApiSecret)}`;
    result.ga4 = await once('ga4', () => post(fetchImpl, url, ga4Payload(order, a)));
  }
  if (status.meta) {
    const url = `https://graph.facebook.com/${t.metaGraphVersion}/${encodeURIComponent(t.metaPixelId)}/events?access_token=${encodeURIComponent(t.metaCapiToken)}`;
    result.meta = await once('meta', () => post(fetchImpl, url, metaPayload(order, a, config.publicSiteUrl)));
  }
  return result;
}
