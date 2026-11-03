/**
 * BrandClothzy — single source of truth for customer-facing pricing.
 *
 * Imported by BOTH the storefront (Vite) and the API server (Node), so the price a
 * customer sees is exactly the price the server charges.
 *
 * Definitions
 *   base price      Price stored on the product (seller-entered for marketplace products).
 *   platform markup Fixed multiplier applied to every base price (existing 40% policy).
 *   unit price      Customer selling price per item = round(base × markup), whole rupees.
 *   line total      unit price × quantity.
 *   subtotal        Σ line totals.
 *   shipping fee    From SHIPPING_TIERS (customer rupees, markup NOT applied again).
 *   total           subtotal + shipping fee (whole rupees). No taxes are added on top:
 *                   prices are tax-inclusive (no tax logic exists in this codebase).
 *   amount (paise)  total × 100 — the integer sent to Razorpay.
 *
 * All arithmetic is done in integer paise to avoid binary floating-point drift.
 */

// 40% platform markup, expressed as an exact ratio (14/10) to keep integer math.
export const MARKUP_NUMERATOR = 14;
export const MARKUP_DENOMINATOR = 10;
export const MARKUP_PERCENT = 40;

export const CURRENCY = 'INR';
export const MAX_QUANTITY_PER_LINE = 10;
export const MAX_CART_LINES = 25;

export const FREE_SHIPPING_THRESHOLD = 999; // customer rupees, standard delivery only

export const SHIPPING_TIERS = [
  { id: 'standard', title: 'Standard Delivery', timeline: '5–7 business days', price: 49, freeAbove: FREE_SHIPPING_THRESHOLD },
  { id: 'express', title: 'Express Delivery', timeline: '2–3 business days', price: 99 },
  { id: 'same-day', title: 'Same-Day Delivery (Delhi NCR)', timeline: 'Available for orders placed before 12PM', price: 149 },
];

// Delivery methods temporarily unavailable (festive season). Empty this array to re-enable them.
export const UNAVAILABLE_SHIPPING_TIERS = ['express', 'same-day'];
export const SHIPPING_UNAVAILABLE_MESSAGE =
  "Due to the festive season, Express and Same-Day Delivery are temporarily unavailable. We've switched your order to Standard Delivery.";

/** Convert a rupee amount (number, may have paise decimals) to integer paise. */
export function rupeesToPaise(rupees) {
  const n = Number(rupees);
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n * 100);
}

/**
 * Customer selling price (whole rupees) for a base price.
 * Returns NaN for invalid / non-positive input so callers can reject the product.
 */
export function customerUnitPrice(basePrice) {
  const basePaise = rupeesToPaise(basePrice);
  if (!Number.isFinite(basePaise) || basePaise <= 0) return NaN;
  const customerPaise = Math.round((basePaise * MARKUP_NUMERATOR) / MARKUP_DENOMINATOR);
  return Math.round(customerPaise / 100);
}

/** Inverse helper for tooling: the base price that yields an exact customer price. */
export function baseFromCustomerPrice(customerRupees) {
  return Math.round(((customerRupees * MARKUP_DENOMINATOR) / MARKUP_NUMERATOR) * 100) / 100;
}

export function isShippingTierAvailable(tierId) {
  return SHIPPING_TIERS.some((t) => t.id === tierId) && !UNAVAILABLE_SHIPPING_TIERS.includes(tierId);
}

/** Shipping fee in customer rupees for a tier and a customer-rupee subtotal. */
export function shippingFee(tierId, subtotalRupees) {
  const tier = SHIPPING_TIERS.find((t) => t.id === tierId);
  if (!tier) return NaN;
  if (tier.freeAbove != null && subtotalRupees >= tier.freeAbove) return 0;
  return tier.price;
}

/**
 * Totals for a list of lines. Each line: { basePrice, quantity }.
 * Returns customer rupees plus the Razorpay amount in paise.
 */
export function computeTotals(lines, tierId) {
  let subtotal = 0;
  const priced = lines.map((line) => {
    const unitPrice = customerUnitPrice(line.basePrice);
    const lineTotal = unitPrice * line.quantity;
    subtotal += lineTotal;
    return { ...line, unitPrice, lineTotal };
  });
  const shipping = shippingFee(tierId, subtotal);
  const total = subtotal + shipping;
  return { lines: priced, subtotal, shipping, total, amountPaise: total * 100, currency: CURRENCY };
}

/** Price-range filter: min inclusive, max exclusive (so ₹250 is not in two buckets). */
export function inPriceRange(unitPrice, range) {
  if (!range) return true;
  return unitPrice >= range.min && unitPrice < range.max;
}

/**
 * Normalises any stored order (legacy or v2) into customer-rupee display values.
 * Legacy orders (no pricing_version) stored base prices for items/subtotal/shipping
 * but an already-marked-up `total`.
 */
export function orderDisplayAmounts(order) {
  if (!order) return { items: [], subtotal: 0, shipping: 0, total: 0 };
  const items = Array.isArray(order.items) ? order.items : Object.values(order.items || {});
  if (order.pricing_version >= 2) {
    return {
      items: items.map((i) => ({ ...i, unitPrice: i.unit_price, lineTotal: i.line_total })),
      subtotal: order.subtotal,
      shipping: order.shipping,
      total: order.total,
    };
  }
  const legacyItems = items.map((i) => {
    const unitPrice = customerUnitPrice(i.price);
    return { ...i, unitPrice, lineTotal: unitPrice * (i.quantity || 1) };
  });
  const subtotal = legacyItems.reduce((s, i) => s + (Number.isFinite(i.lineTotal) ? i.lineTotal : 0), 0);
  return {
    items: legacyItems,
    subtotal,
    shipping: Math.max(0, (order.total || 0) - subtotal),
    total: order.total || 0,
  };
}
