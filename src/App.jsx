import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import { BCMonogram } from './components/BrandLogo';

const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Account = lazy(() => import('./pages/Account'));
const Contact = lazy(() => import('./pages/Contact'));
const FAQs = lazy(() => import('./pages/FAQs'));
const SizeGuide = lazy(() => import('./pages/SizeGuide'));
const ShippingReturns = lazy(() => import('./pages/ShippingReturns'));
const CareInstructions = lazy(() => import('./pages/CareInstructions'));
const StoreLocator = lazy(() => import('./pages/StoreLocator'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Terms = lazy(() => import('./pages/Terms'));
const Cookies = lazy(() => import('./pages/Cookies'));
const About = lazy(() => import('./pages/About'));

// Unified Dashboard
const Dashboard = lazy(() => import('./pages/Dashboard'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-pulse mb-4">
          <BCMonogram size={48} className="mx-auto" />
        </div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-luxury-taupe">Loading</p>
      </div>
    </div>
  );
}

function PixelPageTracker() {
  const location = useLocation();
  useEffect(() => {
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
    }
  }, [location.pathname]);
  return null;
}

export default function App() {
  return (
    <MainLayout>
      <PixelPageTracker />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/account" element={<Account />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faqs" element={<FAQs />} />
          <Route path="/size-guide" element={<SizeGuide />} />
          <Route path="/shipping-returns" element={<ShippingReturns />} />
          <Route path="/care" element={<CareInstructions />} />
          <Route path="/stores" element={<StoreLocator />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/about" element={<About />} />

          {/* Unified Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Suspense>
    </MainLayout>
  );
}
