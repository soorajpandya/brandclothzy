import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterProducts } from './filterProducts.js';
import { priceRanges, products as catalog } from '../data/products.js';
import { customerUnitPrice } from '../../shared/pricing.js';

const P = (id, customerPrice, extra = {}) => ({ id, name: `P${id}`, category: 'Jeans', gender: 'Men', sizes: ['M'], customerPrice, ...extra });
const ids = (list) => list.map((p) => p.id);
const [under250, r250to500, r500to1000, above1000] = priceRanges;

test('filters use the customer price, not the stored base price', () => {
  // Base ₹243 is shown to customers as ₹340 → must NOT appear under ₹250
  const shirt = { ...P(1, customerUnitPrice(243)), price: 243 };
  assert.equal(shirt.customerPrice, 340);
  assert.deepEqual(ids(filterProducts([shirt], { priceRange: under250 })), []);
  assert.deepEqual(ids(filterProducts([shirt], { priceRange: r250to500 })), [1]);
});

test('boundary values land in exactly one bucket', () => {
  const list = [P('a', 249), P('b', 250), P('c', 499), P('d', 500), P('e', 999), P('f', 1000), P('g', 1001)];
  assert.deepEqual(ids(filterProducts(list, { priceRange: under250 })), ['a']);
  assert.deepEqual(ids(filterProducts(list, { priceRange: r250to500 })), ['b', 'c']);
  assert.deepEqual(ids(filterProducts(list, { priceRange: r500to1000 })), ['d', 'e']);
  assert.deepEqual(ids(filterProducts(list, { priceRange: above1000 })), ['f', 'g']);
});

test('sorting uses the customer price', () => {
  const list = [P('x', 500), P('y', 100), P('z', 300)];
  assert.deepEqual(ids(filterProducts(list, { sortBy: 'price-asc' })), ['y', 'z', 'x']);
  assert.deepEqual(ids(filterProducts(list, { sortBy: 'price-desc' })), ['x', 'z', 'y']);
});

test('size, category, gender and search filters still work after removing color', () => {
  const list = [P(1, 300, { sizes: ['S'] }), P(2, 300, { sizes: ['L'], category: 'Shirts', gender: 'Women', name: 'Silk Saree' })];
  assert.deepEqual(ids(filterProducts(list, { sizes: ['L'] })), [2]);
  assert.deepEqual(ids(filterProducts(list, { categories: ['Shirts'] })), [2]);
  assert.deepEqual(ids(filterProducts(list, { gender: 'Men' })), [1]);
  assert.deepEqual(ids(filterProducts(list, { searchQuery: 'saree' })), [2]);
});

test('every real catalog product falls into exactly one price bucket', () => {
  for (const p of catalog) {
    const cp = customerUnitPrice(p.price);
    assert.equal(priceRanges.filter((r) => cp >= r.min && cp < r.max).length, 1, p.name);
  }
});
