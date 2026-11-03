import { fuzzyMatch } from '../utils/helpers.js';
import { inPriceRange } from '../../shared/pricing.js';

/**
 * Pure product filtering/sorting used by the Shop page.
 * Price filters and price sorting use `customerPrice` — the price the shopper actually
 * sees and pays — never the stored base price.
 */
export function filterProducts(products, { gender = null, searchQuery = '', categories = [], sizes = [], priceRange = null, sortBy = 'featured' } = {}) {
  let filtered = [...products];

  if (gender) filtered = filtered.filter((p) => p.gender === gender);

  if (searchQuery) {
    const q = searchQuery.trim();
    filtered = filtered.filter((p) => fuzzyMatch(p.name, q) || fuzzyMatch(p.category, q));
  }

  if (categories.length > 0) filtered = filtered.filter((p) => categories.includes(p.category));

  if (sizes.length > 0) filtered = filtered.filter((p) => (p.sizes || []).some((s) => sizes.includes(s)));

  if (priceRange) filtered = filtered.filter((p) => inPriceRange(p.customerPrice, priceRange));

  switch (sortBy) {
    case 'price-asc':
      filtered.sort((a, b) => a.customerPrice - b.customerPrice);
      break;
    case 'price-desc':
      filtered.sort((a, b) => b.customerPrice - a.customerPrice);
      break;
    case 'newest':
      filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
      break;
    default:
      break;
  }
  return filtered;
}
