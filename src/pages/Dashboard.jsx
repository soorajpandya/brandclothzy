import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Store, Package, Users, ShoppingCart, BarChart3,
  Shield, Menu, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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

// Phase 1: Seller / Store Management
const SELLER_NAV = [
  { id: 'seller-overview', label: 'My Store', icon: Store, panel: 'seller-dashboard' },
  { id: 'seller-products', label: 'My Products', icon: Package, panel: 'seller-products' },
];

// Phase 2: Marketplace Admin
const ADMIN_NAV = [
  { id: 'admin-dashboard', label: 'Overview', icon: LayoutDashboard, panel: 'admin-dashboard' },
  { id: 'admin-sellers', label: 'Sellers', icon: Users, panel: 'admin-sellers' },
  { id: 'admin-products', label: 'Products', icon: Package, panel: 'admin-products' },
  { id: 'admin-orders', label: 'Orders', icon: ShoppingCart, panel: 'admin-orders' },
  { id: 'admin-catalog', label: 'Catalog', icon: BarChart3, panel: 'admin-catalog' },
  { id: 'admin-performance', label: 'Performance', icon: BarChart3, panel: 'admin-performance' },
];

const ALL_NAV = [...SELLER_NAV, ...ADMIN_NAV];

function PanelLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-luxury-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { isAdmin } = useMarketplace();
  const navigate = useNavigate();
  const location = useLocation();

  const currentHash = location.hash.replace('#', '');
  const activePanel = ALL_NAV.some(n => n.panel === currentHash)
    ? currentHash
    : 'admin-dashboard';

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/account');
    } else if (!isAdmin()) {
      navigate('/account');
    }
  }, [user, navigate, isAdmin]);

  const switchPanel = (panelId) => {
    navigate(`/dashboard#${panelId}`, { replace: true });
    setSidebarOpen(false);
  };

  if (!user || !isAdmin()) return null;

  const renderPanel = () => {
    switch (activePanel) {
      case 'seller-dashboard':
        return <SellerDashboardPanel embedded />;
      case 'seller-products':
        return <SellerProductsPanel embedded />;
      case 'admin-dashboard':
        return <AdminDashboardPanel embedded />;
      case 'admin-sellers':
        return <AdminReviewPanel embedded />;
      case 'admin-products':
        return <AdminProductsPanel embedded />;
      case 'admin-orders':
        return <AdminOrdersPanel embedded />;
      case 'admin-catalog':
        return <AdminCatalogPanel embedded />;
      case 'admin-performance':
        return <AdminPerformancePanel embedded />;
      default:
        return <AdminDashboardPanel embedded />;
    }
  };

  return (
    <div className="pt-16 lg:pt-20 min-h-screen bg-neutral-50">
      <SEO title="Admin Dashboard" path="/dashboard" noindex />

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

            {/* Phase 1: Seller / My Store Section */}
            <div className="mb-6">
              <p className="text-[9px] uppercase tracking-[0.2em] font-semibold text-neutral-400 mb-2 px-2 flex items-center gap-1.5">
                <Store size={10} />
                Seller (My Store)
              </p>
              <nav className="space-y-0.5">
                {SELLER_NAV.map(item => {
                  const Icon = item.icon;
                  const isActive = activePanel === item.panel;
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

            {/* Phase 2: Marketplace Admin Section */}
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] font-semibold text-neutral-400 mb-2 px-2 flex items-center gap-1.5">
                <Shield size={10} />
                Admin Panel
              </p>
              <nav className="space-y-0.5">
                {ADMIN_NAV.map(item => {
                  const Icon = item.icon;
                  const isActive = activePanel === item.panel;
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
