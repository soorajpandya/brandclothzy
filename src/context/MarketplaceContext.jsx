import { createContext, useContext, useState, useCallback } from 'react';
import { ref as dbRef, get, set, update, push, query, orderByChild, equalTo } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from './AuthContext';

const MarketplaceContext = createContext(null);

// ─── Status Constants ────────────────────────────────
export const PRODUCT_STATUSES = ['pending_review', 'approved', 'rejected', 'disabled'];
export const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'returned'];

// ─── Admin UIDs (hardcoded for now) ──────────────────
const ADMIN_UIDS = ['ADMIN']; // Will match any logged-in user for now

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
      status: 'approved',
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
        status: 'approved',
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
      updated_at: new Date().toISOString(),
    });
    await fetchAllProducts();
  }, [fetchAllProducts]);

  // Admin: Reject product with feedback
  const rejectProduct = useCallback(async (productId, feedback) => {
    await update(dbRef(db, `products/${productId}`), {
      status: 'rejected',
      admin_feedback: feedback,
      updated_at: new Date().toISOString(),
    });
    await fetchAllProducts();
  }, [fetchAllProducts]);

  // Admin: Disable product
  const disableProduct = useCallback(async (productId) => {
    await update(dbRef(db, `products/${productId}`), {
      status: 'disabled',
      updated_at: new Date().toISOString(),
    });
    await fetchAllProducts();
  }, [fetchAllProducts]);

  // Admin: Re-enable product
  const enableProduct = useCallback(async (productId) => {
    await update(dbRef(db, `products/${productId}`), {
      status: 'approved',
      updated_at: new Date().toISOString(),
    });
    await fetchAllProducts();
  }, [fetchAllProducts]);

  // ════════════════════════════════════════════════════
  //  ORDERS
  // ════════════════════════════════════════════════════

  // Create order (from checkout)
  const createOrder = useCallback(async (orderData) => {
    if (!user) throw new Error('Must be logged in');

    const now = new Date().toISOString();
    const newOrderRef = push(dbRef(db, 'orders'));
    const order = {
      id: newOrderRef.key,
      customer_id: user.uid,
      customer_name: orderData.customerName,
      customer_email: orderData.customerEmail,
      customer_phone: orderData.customerPhone,
      shipping_address: orderData.shippingAddress,
      items: orderData.items.map(item => ({
        product_id: item.id,
        seller_id: item.seller_id || '',
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        image: item.images?.[0] || '',
      })),
      subtotal: orderData.subtotal,
      shipping: orderData.shipping,
      total: orderData.total,
      payment_id: orderData.paymentId || '',
      status: 'pending',
      status_history: [{ status: 'pending', timestamp: now }],
      created_at: now,
      updated_at: now,
    };

    await set(newOrderRef, order);
    return order;
  }, [user]);

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

  // Fetch orders by seller
  const fetchSellerOrders = useCallback(async (sellerId) => {
    try {
      const snapshot = await get(dbRef(db, 'orders'));
      if (!snapshot.exists()) return [];
      const data = snapshot.val();
      return Object.entries(data)
        .map(([id, val]) => ({ id, ...val }))
        .filter(order => order.items?.some(item => item.seller_id === sellerId))
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

  // Admin: Update order status
  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    const now = new Date().toISOString();
    const snapshot = await get(dbRef(db, `orders/${orderId}/status_history`));
    const history = snapshot.exists() ? snapshot.val() : [];
    const historyArr = Array.isArray(history) ? history : Object.values(history);
    historyArr.push({ status: newStatus, timestamp: now });

    await update(dbRef(db, `orders/${orderId}`), {
      status: newStatus,
      status_history: historyArr,
      updated_at: now,
    });
    await fetchAllOrders();
  }, [fetchAllOrders]);

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
        totalRevenue += (item.price || 0) * (item.quantity || 1);
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

  const isAdmin = useCallback(() => {
    return user?.email === 'soorajpandya@gmail.com';
  }, [user]);

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
    createOrder,
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
