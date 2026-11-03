/**
 * Builds a validated, server-priced order from a checkout request.
 * The browser sends only product IDs, sizes, quantities, delivery option and
 * address/contact details. Prices are never accepted from the client.
 */
import crypto from 'crypto';
import {
  computeTotals,
  isShippingTierAvailable,
  MAX_CART_LINES,
  MAX_QUANTITY_PER_LINE,
  CURRENCY,
} from '../../shared/pricing.js';
import { resolveProduct } from './catalog.js';

export class CheckoutError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function validateContact(contact = {}, address = {}) {
  const c = {
    firstName: str(contact.firstName, 60),
    lastName: str(contact.lastName, 60),
    email: str(contact.email, 254).toLowerCase(),
    phone: str(contact.phone, 20).replace(/\s/g, ''),
  };
  const a = {
    address: str(address.address, 300),
    city: str(address.city, 80),
    state: str(address.state, 80),
    pincode: str(address.pincode, 6),
  };
  const errors = [];
  if (!c.firstName) errors.push('firstName');
  if (!c.lastName) errors.push('lastName');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) errors.push('email');
  if (!/^[6-9]\d{9}$/.test(c.phone) || /^(\d)\1{9}$/.test(c.phone)) errors.push('phone');
  if (!a.address) errors.push('address');
  if (!a.city) errors.push('city');
  if (!a.state) errors.push('state');
  if (!/^\d{6}$/.test(a.pincode)) errors.push('pincode');
  if (errors.length) throw new CheckoutError('invalid_details', `Please check: ${errors.join(', ')}.`);
  return { contact: c, address: a };
}

/** Stable fingerprint of what is being bought, used for idempotency. */
export function cartFingerprint(items, shippingOption) {
  const norm = items
    .map((i) => `${i.productId}|${i.size}|${i.quantity}`)
    .sort()
    .join(',');
  return crypto.createHash('sha256').update(`${norm}#${shippingOption}`).digest('hex');
}

export function parseCartItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) throw new CheckoutError('empty_cart', 'Your bag is empty.');
  if (rawItems.length > MAX_CART_LINES) throw new CheckoutError('too_many_items', 'Too many items in one order.');
  const merged = new Map();
  for (const raw of rawItems) {
    const productId = String(raw?.productId ?? '').trim();
    const size = typeof raw?.size === 'string' ? raw.size.trim() : '';
    const quantity = Number(raw?.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_LINE) {
      throw new CheckoutError('invalid_quantity', `Quantity must be between 1 and ${MAX_QUANTITY_PER_LINE}.`);
    }
    const key = `${productId}|${size}`;
    const prev = merged.get(key);
    const q = (prev?.quantity || 0) + quantity;
    if (q > MAX_QUANTITY_PER_LINE) throw new CheckoutError('invalid_quantity', `Maximum ${MAX_QUANTITY_PER_LINE} of one item per order.`);
    merged.set(key, { productId, size, quantity: q });
  }
  return [...merged.values()];
}

/**
 * @returns {Promise<object>} the order record to persist (status awaiting_payment)
 */
export async function buildOrder({ store, user, body, orderId, now = new Date() }) {
  const shippingOption = String(body?.shippingOption || 'standard');
  if (!isShippingTierAvailable(shippingOption)) {
    throw new CheckoutError('shipping_unavailable', 'That delivery method is not available right now. Please choose Standard Delivery.');
  }
  const items = parseCartItems(body?.items);
  const { contact, address } = validateContact(body?.contact, body?.shippingAddress);

  const lines = [];
  for (const item of items) {
    const r = await resolveProduct(store, item.productId);
    if (!r.ok) throw new CheckoutError(r.code, r.message, 409);
    const p = r.product;
    if (!Number.isFinite(p.basePrice) || p.basePrice <= 0) {
      throw new CheckoutError('price_invalid', `"${p.name}" cannot be purchased right now.`, 409);
    }
    if (p.sizes.length > 0) {
      if (!item.size) throw new CheckoutError('size_required', `Please choose a size for "${p.name}".`);
      if (!p.sizes.includes(item.size)) throw new CheckoutError('size_invalid', `Size ${item.size} is not available for "${p.name}".`, 409);
    } else if (item.size) {
      throw new CheckoutError('size_invalid', `"${p.name}" does not come in sizes.`);
    }
    lines.push({ product: p, size: p.sizes.length ? item.size : null, quantity: item.quantity, basePrice: p.basePrice });
  }

  const totals = computeTotals(lines, shippingOption);
  if (!Number.isInteger(totals.amountPaise) || totals.amountPaise < 100) {
    throw new CheckoutError('amount_invalid', 'Order total is invalid.', 409);
  }

  const iso = now.toISOString();
  return {
    id: orderId,
    pricing_version: 2,
    customer_id: user.uid,
    customer_name: `${contact.firstName} ${contact.lastName}`,
    customer_email: contact.email,
    customer_phone: contact.phone,
    shipping_address: address,
    items: totals.lines.map((l) => ({
      product_id: l.product.id,
      seller_id: l.product.sellerId,
      source: l.product.source,
      name: l.product.name,
      image: l.product.image,
      size: l.size,
      size_applicable: l.size !== null,
      quantity: l.quantity,
      base_price: l.basePrice,
      unit_price: l.unitPrice,
      line_total: l.lineTotal,
    })),
    seller_ids: [...new Set(lines.map((l) => l.product.sellerId).filter(Boolean))],
    shipping_option: shippingOption,
    subtotal: totals.subtotal,
    shipping: totals.shipping,
    total: totals.total,
    amount_paise: totals.amountPaise,
    currency: CURRENCY,
    status: 'awaiting_payment',
    payment_status: 'created',
    razorpay_order_id: null,
    payment_id: null,
    needs_review: false,
    status_history: [{ status: 'awaiting_payment', timestamp: iso, actor: 'system' }],
    created_at: iso,
    updated_at: iso,
  };
}
