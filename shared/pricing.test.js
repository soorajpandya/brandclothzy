import { test } from 'node:test';
import assert from 'node:assert/strict';
import { products } from '../src/data/products.js';
import {
  customerUnitPrice,
  computeTotals,
  shippingFee,
  inPriceRange,
  orderDisplayAmounts,
  baseFromCustomerPrice,
  isShippingTierAvailable,
} from './pricing.js';
import { priceRanges } from '../src/data/products.js';

test('40% markup gives exact whole-rupee customer prices', () => {
  assert.equal(customerUnitPrice(253.57), 355);
  assert.equal(customerUnitPrice(177.14), 248);
  assert.equal(customerUnitPrice(1000), 1400);
  assert.equal(customerUnitPrice(0.71), 1);
});

test('invalid base prices are rejected (NaN), never charged as ₹0', () => {
  for (const bad of [0, -5, NaN, 'abc', null, undefined]) assert.ok(Number.isNaN(customerUnitPrice(bad)), String(bad));
});

test('every catalog product round-trips to its Meesho price exactly', () => {
  for (const p of products) {
    const shown = customerUnitPrice(p.price);
    assert.ok(Number.isInteger(shown) && shown > 0, p.name);
    assert.equal(customerUnitPrice(baseFromCustomerPrice(shown)), shown);
  }
});

test('totals are integer paise with no floating-point drift', () => {
  const lines = Array.from({ length: 10 }, () => ({ basePrice: 0.1 + 0.2, quantity: 3 }));
  const t = computeTotals(lines, 'standard');
  assert.ok(Number.isInteger(t.amountPaise));
  assert.equal(t.amountPaise, t.total * 100);
});

test('standard shipping is free from ₹999; express/same-day are disabled', () => {
  assert.equal(shippingFee('standard', 998), 49);
  assert.equal(shippingFee('standard', 999), 0);
  assert.equal(isShippingTierAvailable('express'), false);
  assert.equal(isShippingTierAvailable('same-day'), false);
  assert.equal(isShippingTierAvailable('standard'), true);
});

test('price filter buckets do not overlap at the boundaries', () => {
  for (const boundary of [250, 500, 1000]) {
    const hits = priceRanges.filter((r) => inPriceRange(boundary, r));
    assert.equal(hits.length, 1, `₹${boundary} must be in exactly one bucket`);
  }
  assert.ok(inPriceRange(249, priceRanges[0]));
  assert.ok(!inPriceRange(250, priceRanges[0]));
  assert.ok(inPriceRange(5000, priceRanges[3]));
});

test('legacy orders display in customer rupees without double markup', () => {
  // Legacy: items/subtotal stored as base prices, total already marked up.
  const legacy = { items: [{ price: 253.57, quantity: 2 }], subtotal: 507.14, shipping: 35, total: 759 };
  const d = orderDisplayAmounts(legacy);
  assert.equal(d.items[0].unitPrice, 355);
  assert.equal(d.subtotal, 710);
  assert.equal(d.total, 759);
  assert.equal(d.shipping, 49);
  const v2 = { pricing_version: 2, items: [{ unit_price: 355, line_total: 710, quantity: 2 }], subtotal: 710, shipping: 49, total: 759 };
  assert.equal(orderDisplayAmounts(v2).total, 759);
});
