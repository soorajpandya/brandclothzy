import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Store, Package, Users, ShoppingCart, BarChart3,
  Shield, ChevronLeft, ChevronRight, Menu, X, Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSeller } from '../context/SellerContext';
import { useMarketplace } from '../context/MarketplaceContext';
import SEO from '../components/SEO';

// Lazy-load panels
const AdminDashboardPanel = lazy(() => import('./admin/AdminDashboard'));
const AdminReviewPanel = lazy(() => import('./admin/AdminReview'));
const AdminProductsPanel = lazy(() => import('./admin/AdminProducts'));
const AdminOrdersPanel = lazy(() => import('./admin/AdminOrders'));
const AdminCatalogPanel = lazy(() => import('./admin/AdminCatalog'));
const AdminPerformancePanel = lazy(() => import('./admin/AdminPerformance'));
const SellerDashboardPanel = lazy(() => import('./seller/SellerDashboard'));
const SellerProductsPanel = lazy(() => import('./seller/SellerProducts'));
const SellerApplicationPanel = lazy(() => import('./seller/SellerApplication'));

const SELLER_NAV = [
  { id: 'seller-overview', label: 'My Store', icon: Store, panel: 'seller-dashboard' },
  { id: 'seller-products', label: 'My Products', icon: Package, panel: 'seller-products' },
];

const ADMIN_NAV = [
  { id: 'admin-dashboard', label: 'Overview', icon: LayoutDashboard, panel: 'admin-dashboard' },
  { id: 'admin-sellers', label: 'Sellers', icon: Users, panel: 'admin-sellers' },
  { id: 'admin-products', label: 'Products', icon: Package, panel: 'admin-products' },
  { id: 'admin-orders', label: 'Orders', icon: ShoppingCart, panel: 'admin-orders' },
  { id: 'admin-catalog', label: 'Catalog', icon: BarChart3, panel: 'admin-catalog' },
  { id: 'admin-performance', label: 'Performance', icon: BarChart3, panel: 'admin-performance' },
];

function PanelLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-luxury-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { sellerProfile, sellerLoading } = useSeller();
  const { isAdmin } = useMarketplace();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active panel from URL hash or default
  const getInitialPanel = () => {
    const hash = location.hash.replace('#', '');
    if (hash) return hash;
    return 'admin-dashboard';
  };

  const [activePanel, setActivePanel] = useState(getInitialPanel);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user && !sellerLoading) navigate('/account');
  }, [user, sellerLoading, navigate]);

  // Sync hash with active panel
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && hash !== activePanel) {
      setActivePanel(hash);
    }
  }, [location.hash]);

  const switchPanel = (panelId) => {
    setActivePanel(panelId);
    window.history.replaceState(null, '', `/dashboard#${panelId}`);
    setSidebarOpen(false);
  };

  if (!user) return null;

  const isSeller = !!sellerProfile;
  const onboardingDone = sellerProfile && ['onboarding_complete', 'live'].includes(sellerProfile.status);

  // Force seller-dashboard panel until onboarding is complete
  const effectivePanel = (!onboardingDone)
    ? (isSeller ? 'seller-dashboard' : 'seller-apply')
    : activePanel;

  const renderPanel = () => {
    switch (effectivePanel) {
      case 'seller-dashboard':
        return isSeller ? <SellerDashboardPanel embedded /> : <SellerApplicationPanel embedded />;
      case 'seller-products':
        return isSeller ? <SellerProductsPanel embedded /> : <SellerApplicationPanel embedded />;
      case 'seller-apply':
        return <SellerApplicationPanel embedded />;
      case 'admin-dashboard':
        return isAdmin() ? <AdminDashboardPanel embedded /> : (isSeller ? <SellerDashboardPanel embedded /> : <SellerApplicationPanel embedded />);
      case 'admin-sellers':
        return isAdmin() ? <AdminReviewPanel embedded /> : (isSeller ? <SellerDashboardPanel embedded /> : <SellerApplicationPanel embedded />);
      case 'admin-products':
        return isAdmin() ? <AdminProductsPanel embedded /> : (isSeller ? <SellerDashboardPanel embedded /> : <SellerApplicationPanel embedded />);
      case 'admin-orders':
        return isAdmin() ? <AdminOrdersPanel embedded /> : (isSeller ? <SellerDashboardPanel embedded /> : <SellerApplicationPanel embedded />);
      case 'admin-catalog':
        return isAdmin() ? <AdminCatalogPanel embedded /> : (isSeller ? <SellerDashboardPanel embedded /> : <SellerApplicationPanel embedded />);
      case 'admin-performance':
        return isAdmin() ? <AdminPerformancePanel embedded /> : (isSeller ? <SellerDashboardPanel embedded /> : <SellerApplicationPanel embedded />);
      default:
        return isSeller ? <SellerDashboardPanel embedded /> : <SellerApplicationPanel embedded />;
    }
  };

  return (
    <div className="pt-16 lg:pt-20 min-h-screen bg-neutral-50">
      <SEO title="Dashboard" path="/dashboard" noindex />

      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-20 left-3 z-40 lg:hidden w-9 h-9 bg-white border border-neutral-200 shadow-sm flex items-center justify-center"
      >
        {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
      </button>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed lg:sticky top-16 lg:top-20 left-0 z-30 h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] w-56 bg-white border-r border-neutral-100 overflow-y-auto transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="p-4">
            {/* User card */}
            <div className="flex items-center gap-2.5 p-3 bg-neutral-50 mb-5">
              {user.photo ? (
                <img src={user.photo} alt={user.name} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-luxury-pearl flex items-center justify-center text-xs font-semibold text-luxury-charcoal">
                  {user.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium text-luxury-charcoal truncate">{user.name}</p>
                <p className="text-[10px] text-neutral-400 truncate">{user.email}</p>
              </div>
            </div>

            {/* Seller Section */}
            <div className="mb-6">
              <p className="text-[9px] uppercase tracking-[0.2em] font-semibold text-neutral-400 mb-2 px-2 flex items-center gap-1.5">
                <Store size={10} />
                Seller
              </p>
              {isSeller ? (
                <nav className="space-y-0.5">
                  {SELLER_NAV
                    .filter(item => onboardingDone || item.panel === 'seller-dashboard')
                    .map(item => {
                    const Icon = item.icon;
                    const isActive = effectivePanel === item.panel;
                    return (
                      <button key={item.id} onClick={() => switchPanel(item.panel)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors ${
                          isActive
                            ? 'bg-luxury-charcoal text-white font-medium'
                            : 'text-neutral-500 hover:bg-neutral-50 hover:text-luxury-charcoal'
                        }`}>
                        <Icon size={14} />
                        {item.label}
                        {item.panel === 'seller-dashboard' && sellerProfile?.status && (
                          <span className={`ml-auto w-1.5 h-1.5 rounded-full ${
                            sellerProfile.status === 'live' ? 'bg-green-500' :
                            sellerProfile.status === 'approved' ? 'bg-emerald-400' :
                            sellerProfile.status === 'rejected' ? 'bg-red-400' :
                            'bg-amber-400'
                          }`} />
                        )}
                      </button>
                    );
                  })}
                </nav>
              ) : (
                <button onClick={() => switchPanel('seller-apply')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors ${
                    effectivePanel === 'seller-apply'
                      ? 'bg-luxury-charcoal text-white font-medium'
                      : 'text-neutral-500 hover:bg-neutral-50 hover:text-luxury-charcoal'
                  }`}>
                  <Plus size={14} />
                  Become a Seller
                </button>
              )}
            </div>

            {/* Admin Section - only visible to admin after onboarding */}
            {onboardingDone && isAdmin() && (
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] font-semibold text-neutral-400 mb-2 px-2 flex items-center gap-1.5">
                <Shield size={10} />
                Admin
              </p>
              <nav className="space-y-0.5">
                {ADMIN_NAV.map(item => {
                  const Icon = item.icon;
                  const isActive = effectivePanel === item.panel;
                  return (
                    <button key={item.id} onClick={() => switchPanel(item.panel)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors ${
                        isActive
                          ? 'bg-luxury-charcoal text-white font-medium'
                          : 'text-neutral-500 hover:bg-neutral-50 hover:text-luxury-charcoal'
                      }`}>
                      <Icon size={14} />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <Suspense fallback={<PanelLoader />}>
            {renderPanel()}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
