import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ref as dbRef, get, set, update, query, orderByChild } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from './AuthContext';

const SellerContext = createContext(null);

const SELLER_STATUSES = ['applied', 'under_review', 'approved', 'onboarding_complete', 'live', 'rejected'];

const BRAND_TYPES = ['Manufacturer', 'D2C Brand', 'Distributor'];
const BRAND_TIERS = ['budget', 'mid-range', 'premium'];
const CATEGORIES = [
  'Men - Shirts', 'Men - T-Shirts', 'Men - Trousers', 'Men - Jeans',
  'Men - Blazers', 'Men - Ethnic', 'Men - Activewear', 'Men - Accessories',
  'Women - Dresses', 'Women - Tops', 'Women - Sarees', 'Women - Kurtas',
  'Women - Jeans', 'Women - Ethnic', 'Women - Activewear', 'Women - Accessories',
  'Unisex - Footwear', 'Unisex - Bags', 'Unisex - Watches', 'Unisex - Sunglasses'
];

export function SellerProvider({ children }) {
  const { user } = useAuth();
  const [sellerProfile, setSellerProfile] = useState(null);
  const [sellerLoading, setSellerLoading] = useState(true);
  const [allSellers, setAllSellers] = useState([]);

  // Fetch current user's seller profile
  const fetchSellerProfile = useCallback(async () => {
    if (!user) {
      setSellerProfile(null);
      setSellerLoading(false);
      return;
    }
    try {
      const snapshot = await get(dbRef(db, `sellers/${user.uid}`)).catch(() => null);
      if (snapshot && snapshot.exists()) {
        const data = snapshot.val();
        // Auto-promote status when verification is marked true
        if (data.verification?.verified === true && ['applied', 'under_review'].includes(data.status)) {
          data.status = 'approved';
          update(dbRef(db, `sellers/${user.uid}`), { status: 'approved', updated_at: new Date().toISOString() }).catch(() => {});
        }
        // Auto-promote onboarding_complete to live (no separate admin approval needed)
        if (data.status === 'onboarding_complete') {
          data.status = 'live';
          update(dbRef(db, `sellers/${user.uid}`), { status: 'live', updated_at: new Date().toISOString() }).catch(() => {});
        }
        setSellerProfile({ id: user.uid, ...data });
      } else {
        setSellerProfile(null);
      }
    } catch (err) {
      console.error('Error fetching seller profile:', err);
    }
    setSellerLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSellerProfile();
  }, [fetchSellerProfile]);

  // Submit seller application
  const submitApplication = useCallback(async (formData) => {
    if (!user) throw new Error('Must be logged in');

    const now = new Date().toISOString();
    const sellerData = {
      uid: user.uid,
      brand_name: formData.brandName,
      legal_name: formData.legalName,
      phone: formData.phone,
      email: user.email,
      status: 'applied',
      created_at: now,
      updated_at: now,

      verification: {
        gst_number: formData.gstNumber.toUpperCase(),
        pan_number: formData.panNumber.toUpperCase(),
        cin: formData.cin ? formData.cin.toUpperCase() : '',
        verified: false,
      },

      brand_profile: {
        website: formData.website || '',
        instagram: formData.instagram || '',
        years_in_business: Number(formData.yearsInBusiness) || 0,
        brand_type: formData.brandType,
        categories: formData.categories || [],
        brand_tier: '',
      },

      warehouse: {
        address: formData.warehouseAddress || '',
        city: formData.warehouseCity || '',
        state: formData.warehouseState || '',
        pincode: formData.warehousePincode || '',
        can_fulfill_daily: formData.canFulfillDaily === 'yes',
        dispatch_time: formData.dispatchTime || '',
      },

      catalog_sample: {
        images: [],
        price_range: '',
        approved: false,
      },

      financial: {
        bank_name: '',
        account_number: '',
        ifsc_code: '',
        account_holder: '',
        commission_rate: 25,
        settlement_cycle: 'T+7',
        completed: false,
      },

      return_policy: '',
      shipping_sla: '',
      reviews: [],
    };

    const writePromise = set(dbRef(db, `sellers/${user.uid}`), sellerData);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out. Check your internet connection.')), 15000)
    );
    await Promise.race([writePromise, timeoutPromise]);
    setSellerProfile({ id: user.uid, ...sellerData });
    return { success: true };
  }, [user]);

  // Upload catalog images
  const uploadCatalogImages = useCallback(async (files) => {
    if (!user || !sellerProfile) throw new Error('Not authorized');

    const urls = [];
    for (const file of files) {
      const fileRef = storageRef(storage, `catalog/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      urls.push(url);
    }

    const existingImages = sellerProfile.catalog_sample?.images || [];
    await update(dbRef(db, `sellers/${user.uid}/catalog_sample`), {
      images: [...existingImages, ...urls],
    });
    await update(dbRef(db, `sellers/${user.uid}`), { updated_at: new Date().toISOString() });

    setSellerProfile(prev => ({
      ...prev,
      catalog_sample: {
        ...prev.catalog_sample,
        images: [...existingImages, ...urls],
      }
    }));

    return urls;
  }, [user, sellerProfile]);

  // Update catalog details
  const updateCatalog = useCallback(async (data) => {
    if (!user) throw new Error('Not authorized');
    const updates = { updated_at: new Date().toISOString() };
    if (data.priceRange) updates['catalog_sample/price_range'] = data.priceRange;
    if (data.description) updates['catalog_sample/description'] = data.description;

    await update(dbRef(db, `sellers/${user.uid}`), updates);
    await fetchSellerProfile();
  }, [user, fetchSellerProfile]);

  // Update financial details (post-approval)
  const updateFinancial = useCallback(async (data) => {
    if (!user) throw new Error('Not authorized');
    await update(dbRef(db, `sellers/${user.uid}`), {
      'financial/bank_name': data.bankName,
      'financial/account_number': data.accountNumber,
      'financial/ifsc_code': data.ifscCode,
      'financial/account_holder': data.accountHolder,
      'financial/completed': true,
      updated_at: new Date().toISOString(),
    });
    await fetchSellerProfile();
  }, [user, fetchSellerProfile]);

  // Update policies (post-approval)
  const updatePolicies = useCallback(async (data) => {
    if (!user) throw new Error('Not authorized');
    await update(dbRef(db, `sellers/${user.uid}`), {
      return_policy: data.returnPolicy,
      shipping_sla: data.shippingSla,
      updated_at: new Date().toISOString(),
    });
    await fetchSellerProfile();
  }, [user, fetchSellerProfile]);

  // Mark onboarding complete
  const completeOnboarding = useCallback(async () => {
    if (!user) throw new Error('Not authorized');
    await update(dbRef(db, `sellers/${user.uid}`), {
      status: 'onboarding_complete',
      updated_at: new Date().toISOString(),
    });
    await fetchSellerProfile();
  }, [user, fetchSellerProfile]);

  // ===== ADMIN FUNCTIONS =====

  // Fetch all sellers (admin)
  const fetchAllSellers = useCallback(async () => {
    try {
      const sellersRef = query(dbRef(db, 'sellers'), orderByChild('created_at'));
      const snapshot = await get(sellersRef);
      if (!snapshot.exists()) {
        setAllSellers([]);
        return [];
      }
      const data = snapshot.val();
      const sellers = Object.entries(data)
        .map(([id, val]) => ({ id, ...val }))
        .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      setAllSellers(sellers);
      return sellers;
    } catch (err) {
      console.error('Error fetching sellers:', err);
      return [];
    }
  }, []);

  // Update seller status (admin)
  const updateSellerStatus = useCallback(async (sellerId, newStatus) => {
    await update(dbRef(db, `sellers/${sellerId}`), {
      status: newStatus,
      updated_at: new Date().toISOString(),
    });
    await fetchAllSellers();
    if (user && sellerId === user.uid) await fetchSellerProfile();
  }, [fetchAllSellers, fetchSellerProfile, user]);

  // Add review (admin)
  const addReview = useCallback(async (sellerId, review) => {
    const snapshot = await get(dbRef(db, `sellers/${sellerId}/reviews`));
    const existingReviews = snapshot.exists() ? snapshot.val() : [];
    const reviews = Array.isArray(existingReviews) ? existingReviews : Object.values(existingReviews);
    reviews.push({
      ...review,
      reviewer_id: user?.uid,
      reviewer_name: user?.name,
      created_at: new Date().toISOString(),
    });
    await update(dbRef(db, `sellers/${sellerId}`), {
      reviews,
      updated_at: new Date().toISOString(),
    });
    await fetchAllSellers();
  }, [user, fetchAllSellers]);

  // Update brand tier (admin)
  const updateBrandTier = useCallback(async (sellerId, tier) => {
    await update(dbRef(db, `sellers/${sellerId}`), {
      'brand_profile/brand_tier': tier,
      updated_at: new Date().toISOString(),
    });
    await fetchAllSellers();
  }, [fetchAllSellers]);

  // Approve/reject catalog (admin)
  const updateCatalogApproval = useCallback(async (sellerId, approved) => {
    await update(dbRef(db, `sellers/${sellerId}`), {
      'catalog_sample/approved': approved,
      updated_at: new Date().toISOString(),
    });
    await fetchAllSellers();
  }, [fetchAllSellers]);

  // Update commission (admin)
  const updateCommission = useCallback(async (sellerId, rate) => {
    await update(dbRef(db, `sellers/${sellerId}`), {
      'financial/commission_rate': rate,
      updated_at: new Date().toISOString(),
    });
    await fetchAllSellers();
  }, [fetchAllSellers]);

  const value = {
    sellerProfile,
    sellerLoading,
    allSellers,
    SELLER_STATUSES,
    BRAND_TYPES,
    BRAND_TIERS,
    CATEGORIES,
    submitApplication,
    uploadCatalogImages,
    updateCatalog,
    updateFinancial,
    updatePolicies,
    completeOnboarding,
    fetchSellerProfile,
    fetchAllSellers,
    updateSellerStatus,
    addReview,
    updateBrandTier,
    updateCatalogApproval,
    updateCommission,
  };

  return (
    <SellerContext.Provider value={value}>
      {children}
    </SellerContext.Provider>
  );
}

export function useSeller() {
  const context = useContext(SellerContext);
  if (!context) throw new Error('useSeller must be used within a SellerProvider');
  return context;
}
