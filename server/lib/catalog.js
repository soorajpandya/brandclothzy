/**
 * Authoritative product lookup for checkout. Prices, names, sizes and eligibility
 * come from here, never from the browser.
 *
 * Two sources:
 *   - The built-in catalog (src/data/products.js), shared with the storefront build.
 *   - Marketplace products in Firebase (products/{id}), which must be approved and
 *     belong to a seller whose account is live.
 */
import { products as staticProducts } from '../../src/data/products.js';

const STATIC_BY_ID = new Map(staticProducts.map((p) => [String(p.id), p]));

// Seller statuses allowed to sell. Everything else (applied, under_review, approved,
// onboarding_complete, rejected, suspended) cannot.
export const SELLABLE_SELLER_STATUSES = new Set(['live']);
export const PURCHASABLE_PRODUCT_STATUSES = new Set(['approved']);

function normalizeSizes(sizes) {
  const list = Array.isArray(sizes) ? sizes : Object.values(sizes || {});
  return list.map((s) => String(s).trim()).filter(Boolean);
}

/**
 * @returns {Promise<{ ok: true, product: object } | { ok: false, code: string, message: string }>}
 */
export async function resolveProduct(store, productId) {
  const id = String(productId ?? '').trim();
  if (!id || id.length > 64 || !/^[A-Za-z0-9_-]+$/.test(id)) {
    return { ok: false, code: 'invalid_product', message: 'Invalid product reference.' };
  }

  const builtIn = STATIC_BY_ID.get(id);
  if (builtIn) {
    return {
      ok: true,
      product: {
        id,
        source: 'catalog',
        sellerId: '',
        name: builtIn.name,
        basePrice: Number(builtIn.price),
        sizes: normalizeSizes(builtIn.sizes),
        image: builtIn.images?.[0] || '',
      },
    };
  }

  const p = await store.getProduct(id);
  if (!p) return { ok: false, code: 'product_not_found', message: 'A product in your bag is no longer available.' };
  if (!PURCHASABLE_PRODUCT_STATUSES.has(p.status)) {
    return { ok: false, code: 'product_unavailable', message: `"${p.name || 'A product'}" is not available for purchase.` };
  }
  const seller = p.seller_id ? await store.getSeller(p.seller_id) : null;
  if (!seller || !SELLABLE_SELLER_STATUSES.has(seller.status)) {
    return { ok: false, code: 'seller_unavailable', message: `"${p.name || 'A product'}" is temporarily unavailable.` };
  }
  return {
    ok: true,
    product: {
      id,
      source: 'marketplace',
      sellerId: p.seller_id,
      name: p.name || '',
      basePrice: Number(p.price),
      sizes: normalizeSizes(p.sizes),
      image: (Array.isArray(p.images) ? p.images[0] : Object.values(p.images || {})[0]) || '',
    },
  };
}
