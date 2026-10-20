import { useState, useEffect, useMemo, useCallback } from 'react';
import { ref as dbRef, get } from 'firebase/database';
import { db } from '../firebase';
import { products as staticProducts } from '../data/products';

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
  return {
    id: p.id,
    name: p.name || '',
    price: Number(p.price) || 0,
    originalPrice: Number(p.original_price) || null,
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
        const snapshot = await get(dbRef(db, 'products'));
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

  const products = useMemo(() => {
    return [...staticProducts, ...firebaseProducts];
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
