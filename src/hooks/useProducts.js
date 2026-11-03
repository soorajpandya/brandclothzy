import { useState, useEffect, useMemo, useCallback } from 'react';
import { ref as dbRef, get, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '../firebase';
import { products as staticProducts } from '../data/products';
import { customerUnitPrice } from '../../shared/pricing.js';

// Convert Firebase product category "Men - Shirts" → { gender: "Men", category: "Shirts" }
function normalizeFirebaseProduct(p) {
  let gender = '';
  let category = p.category || '';
  if (category.includes(' - ')) {
    const parts = category.split(' - ');
    gender = parts[0].trim();
    category = parts.slice(1).join(' - ').trim();
    if (gender === 'Unisex') gender = '';
  }
  // The stored `price` is exactly what the server charges (see server/lib/catalog.js), so it is
  // never swapped here. MRP is shown only when it is genuinely higher.
  const price = Number(p.price) || 0;
  const mrp = Number(p.original_price) || 0;
  return {
    id: p.id,
    name: p.name || '',
    price,
    originalPrice: mrp > price ? mrp : null,
    category,
    gender,
    description: p.description || '',
    sizes: p.sizes || [],
    colors: p.colors || [],
    images: p.images?.length ? p.images : [],
    badge: null,
    isNew: true,
    collection: null,
    seller_name: p.seller_name || '',
    _source: 'firebase',
  };
}

export function useProducts() {
  const [firebaseProducts, setFirebaseProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Only approved products are readable by the public (database.rules.json).
        const snapshot = await get(query(dbRef(db, 'products'), orderByChild('status'), equalTo('approved')));
        if (snapshot.exists() && !cancelled) {
          const data = snapshot.val();
          const approved = Object.entries(data)
            .map(([id, val]) => ({ id, ...val }))
            .filter(p => p.status === 'approved');
          setFirebaseProducts(approved.map(normalizeFirebaseProduct));
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // customerPrice = what the shopper pays; used by cards, filters, sorting and SEO alike.
  const products = useMemo(() => {
    return [...staticProducts, ...firebaseProducts]
      .map((p) => ({ ...p, customerPrice: customerUnitPrice(p.price) }))
      .filter((p) => Number.isFinite(p.customerPrice));
  }, [firebaseProducts]);

  const getProductById = useCallback((id) => {
    // Firebase IDs are strings, static IDs are numbers
    return products.find((p) => String(p.id) === String(id));
  }, [products]);

  const getRelatedProducts = useCallback((product, limit = 4) => {
    return products
      .filter((p) => String(p.id) !== String(product.id) && p.category === product.category && p.gender === product.gender)
      .slice(0, limit);
  }, [products]);

  const getBestSellers = useMemo(() => {
    return products.filter((p) => p.badge === 'Best Seller');
  }, [products]);

  const getNewArrivals = useMemo(() => {
    return products.filter((p) => p.isNew);
  }, [products]);

  return { products, loading, setLoading, getProductById, getRelatedProducts, getBestSellers, getNewArrivals };
}
