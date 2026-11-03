import { createContext, useContext, useState, useCallback } from 'react';
import { ref as dbRef, get, set, update, push, query, orderByChild, equalTo } from 'firebase/database';
import { db, getStorageLazy } from '../firebase';
import { useAuth } from './AuthContext';

const MarketplaceContext = createContext(null);

// ─── Status Constants ────────────────────────────────
export const PRODUCT_STATUSES = ['pending_review', 'approved', 'rejected', 'disabled'];
export const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'returned'];

// Product lifecycle (existing status names kept so live catalog data needs no migration):
//   pending_review → approved (published) | rejected (with reason)
//   approved → disabled (unpublished / seller suspended) → approved
// Sellers can only create or edit into pending_review; only admins publish (database.rules.json).
// Every seller edit sends the product back to review.

/** Append-only audit trail for moderation actions (admin-only path in database.rules.json). */
async function writeAudit(actor, entry) {
  try {
    await push(dbRef(db, 'audit_logs'), { ...entry, actor_uid: actor?.uid || null, at: new Date().toISOString() });
  } catch (err) {
    console.warn('Audit log write failed:', err?.message);
  }
}

export function MarketplaceProvider({ children }) {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // ════════════════════════════════════════════════════
  //  PRODUCTS
  // ════════════════════════════════════════════════════

  // Seller: Upload a new product
  const addProduct = useCallback(async (productData, imageFiles) => {
    if (!user) throw new Error('Must be logged in');

    // Upload images
    const imageUrls = [];
    const { storage, ref: storageRef, uploadBytes, getDownloadURL } = await getStorageLazy();
    for (const file of imageFiles) {
      const fileRef = storageRef(storage, `products/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      imageUrls.push(url);
    }

    const now = new Date().toISOString();
    const newProductRef = push(dbRef(db, 'products'));
    const product = {
      id: newProductRef.key,
      seller_id: user.uid,
      seller_name: productData.brandName || '',
      name: productData.name,
      description: productData.description,
      category: productData.category,
      price: Number(productData.price),
      original_price: Number(productData.originalPrice) || 0,
      sizes: productData.sizes || [],
      colors: productData.colors || [],
      images: imageUrls,
      status: 'pending_review',
      admin_feedback: '',
      created_at: now,
      updated_at: now,
    };

    await set(newProductRef, product);
    return product;
  }, [user]);

  // Seller: Bulk upload products (from CSV)
  const addProducts = useCallback(async (productsList) => {
    if (!user) throw new Error('Must be logged in');
    const now = new Date().toISOString();
    const results = [];
    for (const item of productsList) {
      const newRef = push(dbRef(db, 'products'));
      const product = {
        id: newRef.key,
        seller_id: user.uid,
        seller_name: item.brandName || '',
        name: item.name || '',
        description: item.description || '',
        category: item.category || '',
        price: Number(item.price) || 0,
        original_price: Number(item.originalPrice) || 0,
        sizes: item.sizes || [],
        colors: item.colors || [],
        images: item.images || [],
        status: 'pending_review',
        admin_feedback: '',
        created_at: now,
        updated_at: now,
      };
      await set(newRef, product);
      results.push(product);
    }
    return results;
  }, [user]);

  // Seller: Update an existing product
  const updateProduct = useCallback(async (productId, productData, newImageFiles = [], existingImages = []) => {
    if (!user) throw new Error('Must be logged in');

    // Upload any new image files
    const newUrls = [];
    const { storage, ref: storageRef, uploadBytes, getDownloadURL } = await getStorageLazy();
    for (const file of newImageFiles) {
      const fileRef = storageRef(storage, `products/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      newUrls.push(url);
    }

    const allImages = [...existingImages, ...newUrls];

    await update(dbRef(db, `products/${productId}`), {
      name: productData.name,
      description: productData.description,
      category: productData.category,
      price: Number(productData.price),
      original_price: Number(productData.originalPrice) || 0,
      sizes: productData.sizes || [],
      colors: productData.colors || [],
      images: allImages,
      status: 'pending_review',
      admin_feedback: '',
      updated_at: new Date().toISOString(),
    });
  }, [user]);

  // Fetch products by seller
  const fetchSellerProducts = useCallback(async (sellerId) => {
    try {
      const snapshot = await get(query(dbRef(db, 'products'), orderByChild('seller_id'), equalTo(sellerId)));
      if (!snapshot.exists()) return [];
      const data = snapshot.val();
      return Object.entries(data).map(([id, val]) => ({ id, ...val }))
        .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    } catch {
      return [];
    }
  }, []);

  // Fetch all products (admin)
  const fetchAllProducts = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await get(dbRef(db, 'products'));
      if (!snapshot.exists()) { setProducts([]); return []; }
      const data = snapshot.val();
      const list = Object.entries(data).map(([id, val]) => ({ id, ...val }))
        .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      setProducts(list);
      return list;
    } catch {
      setProducts([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Admin: Approve product
  const approveProduct = useCallback(async (productId) => {
    await update(dbRef(db, `products/${productId}`), {
      status: 'approved',
      admin_feedback: '',
      reviewed_by: user?.uid || null,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    await writeAudit(user, { type: 'product_approved', product_id: productId });
    await fetchAllProducts();
  }, [fetchAllProducts, user]);

  // Admin: Reject product with feedback
  const rejectProduct = useCallback(async (productId, feedback) => {
    if (!feedback || !String(feedback).trim()) throw new Error('A rejection reason is required.');
    await update(dbRef(db, `products/${productId}`), {
      status: 'rejected',
      admin_feedback: String(feedback).trim(),
      reviewed_by: user?.uid || null,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    await writeAudit(user, { type: 'product_rejected', product_id: productId, reason: String(feedback).trim() });
    await fetchAllProducts();
  }, [fetchAllProducts, user]);

  // Admin: Disable product
  const disableProduct = useCallback(async (productId) => {
    await update(dbRef(db, `products/${productId}`), {
      status: 'disabled',
      updated_at: new Date().toISOString(),
    });
    await writeAudit(user, { type: 'product_disabled', product_id: productId });
    await fetchAllProducts();
  }, [fetchAllProducts, user]);

  // Admin: Re-enable product
  const enableProduct = useCallback(async (productId) => {
    await update(dbRef(db, `products/${productId}`), {
      status: 'approved',
      disabled_reason: null,
      updated_at: new Date().toISOString(),
    });
    await writeAudit(user, { type: 'product_enabled', product_id: productId });
    await fetchAllProducts();
  }, [fetchAllProducts, user]);

  // ════════════════════════════════════════════════════
  //  ORDERS
  // ════════════════════════════════════════════════════

  // Orders are created and marked paid ONLY by the API server (server/app.js) after Razorpay
  // verification. The browser cannot write orders (database.rules.json).

  // Fetch all orders (admin)
  const fetchAllOrders = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await get(dbRef(db, 'orders'));
      if (!snapshot.exists()) { setOrders([]); return []; }
      const data = snapshot.val();
      const list = Object.entries(data).map(([id, val]) => ({ id, ...val }))
        .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      setOrders(list);
      return list;
    } catch {
      setOrders([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch orders by seller — reads the seller-scoped copies written by the server, so a seller
  // never needs (or gets) read access to other customers' orders.
  const fetchSellerOrders = useCallback(async (sellerId) => {
    try {
      const snapshot = await get(dbRef(db, `seller_orders/${sellerId}`));
      if (!snapshot.exists()) return [];
      return Object.entries(snapshot.val())
        .map(([id, val]) => ({ id, ...val }))
        .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    } catch {
      return [];
    }
  }, []);

  // Fetch orders by customer (user)
  const fetchUserOrders = useCallback(async (userId) => {
    try {
      const snapshot = await get(query(dbRef(db, 'orders'), orderByChild('customer_id'), equalTo(userId)));
      if (!snapshot.exists()) return [];
      const data = snapshot.val();
      return Object.entries(data)
        .map(([id, val]) => ({ id, ...val }))
        .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    } catch {
      return [];
    }
  }, []);

  // Admin: Update fulfilment status. Payment fields (amount, payment status, items) cannot be
  // changed from the browser — the rules reject it. Seller copies are kept in sync.
  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    if (!ORDER_STATUSES.includes(newStatus)) throw new Error('Invalid status');
    const now = new Date().toISOString();
    const snapshot = await get(dbRef(db, `orders/${orderId}`));
    if (!snapshot.exists()) throw new Error('Order not found');
    const order = snapshot.val();
    if (!['captured', 'partially_refunded'].includes(order.payment_status) && order.pricing_version >= 2) {
      throw new Error('This order has not been paid yet.');
    }
    const history = order.status_history || [];
    const historyArr = Array.isArray(history) ? history : Object.values(history);
    historyArr.push({ status: newStatus, timestamp: now, actor: user?.uid || 'admin' });

    const updates = {
      [`orders/${orderId}/status`]: newStatus,
      [`orders/${orderId}/status_history`]: historyArr,
      [`orders/${orderId}/updated_at`]: now,
    };
    for (const sellerId of order.seller_ids || []) {
      updates[`seller_orders/${sellerId}/${orderId}/status`] = newStatus;
    }
    await update(dbRef(db), updates);
    await writeAudit(user, { type: 'order_status_changed', order_id: orderId, from: order.status, to: newStatus });
    await fetchAllOrders();
  }, [fetchAllOrders, user]);

  // ════════════════════════════════════════════════════
  //  SELLER PERFORMANCE (derived)
  // ════════════════════════════════════════════════════

  const getSellerPerformance = useCallback((sellerId, allProducts, allOrders) => {
    const sellerProducts = allProducts.filter(p => p.seller_id === sellerId);
    const sellerOrders = allOrders.filter(o => o.items?.some(i => i.seller_id === sellerId));

    let totalRevenue = 0;
    let totalItems = 0;
    let returnedOrders = 0;

    sellerOrders.forEach(order => {
      const sellerItems = order.items.filter(i => i.seller_id === sellerId);
      sellerItems.forEach(item => {
        // Seller revenue is measured on the seller (base) price, not the marked-up customer price.
        totalRevenue += (item.base_price ?? item.price ?? 0) * (item.quantity || 1);
        totalItems += item.quantity || 1;
      });
      if (order.status === 'returned') returnedOrders++;
    });

    return {
      total_products: sellerProducts.length,
      approved_products: sellerProducts.filter(p => p.status === 'approved').length,
      pending_products: sellerProducts.filter(p => p.status === 'pending_review').length,
      total_orders: sellerOrders.length,
      total_revenue: totalRevenue,
      total_items_sold: totalItems,
      returned_orders: returnedOrders,
      return_rate: sellerOrders.length > 0 ? ((returnedOrders / sellerOrders.length) * 100).toFixed(1) : '0.0',
    };
  }, []);

  // ════════════════════════════════════════════════════
  //  ROLE CHECK
  // ════════════════════════════════════════════════════

  // UI-only role check. Real enforcement is the 'admin' custom claim in database.rules.json and the API.
  const isAdmin = useCallback(() => user?.isAdmin === true, [user]);

  const value = {
    // Products
    products,
    addProduct,
    addProducts,
    updateProduct,
    fetchSellerProducts,
    fetchAllProducts,
    approveProduct,
    rejectProduct,
    disableProduct,
    enableProduct,
    // Orders
    orders,
    fetchAllOrders,
    fetchSellerOrders,
    fetchUserOrders,
    updateOrderStatus,
    // Performance
    getSellerPerformance,
    // Role
    isAdmin,
    // State
    loading,
    // Constants
    PRODUCT_STATUSES,
    ORDER_STATUSES,
  };

  return (
    <MarketplaceContext.Provider value={value}>
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  const context = useContext(MarketplaceContext);
  if (!context) throw new Error('useMarketplace must be used within a MarketplaceProvider');
  return context;
}
