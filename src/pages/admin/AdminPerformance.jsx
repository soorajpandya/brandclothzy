import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, Users, TrendingUp, TrendingDown, ShoppingCart, Package,
  RotateCcw, ChevronLeft, Shield, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSeller } from '../../context/SellerContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import SEO from '../../components/SEO';
import { formatPrice } from '../../utils/helpers';

export default function AdminPerformance({ embedded }) {
  const { user } = useAuth();
  const { allSellers, fetchAllSellers } = useSeller();
  const { products, orders, fetchAllProducts, fetchAllOrders, getSellerPerformance } = useMarketplace();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('revenue');
  const [sortDir, setSortDir] = useState('desc');
  const [expandedSeller, setExpandedSeller] = useState(null);

  useEffect(() => {
    if (!user && !embedded) { navigate('/account'); return; }
    if (!user) return;
    const load = async () => {
      await Promise.all([fetchAllSellers(), fetchAllProducts(), fetchAllOrders()]);
      setLoading(false);
    };
    load();
  }, [user, navigate, embedded, fetchAllSellers, fetchAllProducts, fetchAllOrders]);

  const liveSellers = allSellers.filter(s => ['approved', 'onboarding_complete', 'live'].includes(s.status));

  const sellerData = liveSellers.map(seller => ({
    ...seller,
    perf: getSellerPerformance(seller.id, products, orders),
  }));

  // Sort
  const sorted = [...sellerData].sort((a, b) => {
    let aVal, bVal;
    switch (sortBy) {
      case 'revenue': aVal = a.perf.total_revenue; bVal = b.perf.total_revenue; break;
      case 'orders': aVal = a.perf.total_orders; bVal = b.perf.total_orders; break;
      case 'products': aVal = a.perf.total_products; bVal = b.perf.total_products; break;
      case 'returns': aVal = Number(a.perf.return_rate); bVal = Number(b.perf.return_rate); break;
      default: aVal = 0; bVal = 0;
    }
    return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
  });

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  // Aggregate metrics
  const totalRevenue = sellerData.reduce((s, d) => s + d.perf.total_revenue, 0);
  const totalOrders = sellerData.reduce((s, d) => s + d.perf.total_orders, 0);
  const totalProducts = sellerData.reduce((s, d) => s + d.perf.total_products, 0);
  const totalReturns = sellerData.reduce((s, d) => s + d.perf.returned_orders, 0);
  const avgReturnRate = totalOrders > 0 ? ((totalReturns / totalOrders) * 100).toFixed(1) : '0.0';

  if (loading) {
    return (
      <div className="pt-32 pb-20 text-center">
        <div className="w-10 h-10 mx-auto border-2 border-luxury-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={embedded ? 'p-6' : 'pt-28 pb-20'}>
      <SEO title="Admin – Seller Performance" path="/admin/performance" noindex />
      <div className="max-w-6xl mx-auto px-4">
        <button onClick={() => navigate('/dashboard#admin-dashboard')} className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600 mb-4 transition-colors">
          <ChevronLeft size={14} /> Back to Dashboard
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl text-luxury-charcoal">Seller Performance</h1>
            <p className="text-xs text-neutral-400 font-light mt-1">Per-seller analytics, revenue, and quality metrics</p>
          </div>
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-luxury-gold" />
            <span className="text-[10px] uppercase tracking-wider font-medium text-luxury-taupe">Admin</span>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          <MetricCard icon={Users} label="Active Sellers" value={liveSellers.length} />
          <MetricCard icon={TrendingUp} label="Total Revenue" value={formatPrice(totalRevenue)} />
          <MetricCard icon={ShoppingCart} label="Total Orders" value={totalOrders} />
          <MetricCard icon={Package} label="Total Products" value={totalProducts} />
          <MetricCard icon={RotateCcw} label="Avg Return Rate" value={`${avgReturnRate}%`}
            alert={Number(avgReturnRate) > 10} />
        </div>

        {/* Leaderboard Table */}
        {sorted.length === 0 ? (
          <div className="text-center py-16">
            <BarChart3 size={40} className="mx-auto text-neutral-300 mb-4" />
            <p className="text-sm text-neutral-400">No active sellers to display</p>
          </div>
        ) : (
          <div className="border border-neutral-200 overflow-hidden">
            {/* Table Header */}
            <div className="bg-neutral-50 border-b border-neutral-200 flex items-center gap-3 px-4 py-3 text-[10px] uppercase tracking-wider font-medium text-neutral-400">
              <div className="w-8 text-center">#</div>
              <div className="flex-1">Seller</div>
              <SortHeader label="Revenue" field="revenue" current={sortBy} dir={sortDir} onSort={toggleSort} />
              <SortHeader label="Orders" field="orders" current={sortBy} dir={sortDir} onSort={toggleSort} />
              <SortHeader label="Products" field="products" current={sortBy} dir={sortDir} onSort={toggleSort} />
              <SortHeader label="Return %" field="returns" current={sortBy} dir={sortDir} onSort={toggleSort} />
              <div className="w-8" />
            </div>

            {/* Rows */}
            {sorted.map((seller, i) => (
              <div key={seller.id}>
                <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-50 hover:bg-neutral-50/50 cursor-pointer transition-colors"
                  onClick={() => setExpandedSeller(expandedSeller === seller.id ? null : seller.id)}>
                  <div className="w-8 text-center text-xs text-neutral-400">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-luxury-charcoal truncate">{seller.brand_name}</p>
                    <p className="text-[10px] text-neutral-400">{seller.legal_name}</p>
                  </div>
                  <div className="w-24 text-right text-xs font-medium text-luxury-charcoal">
                    {formatPrice(seller.perf.total_revenue)}
                  </div>
                  <div className="w-16 text-right text-xs text-luxury-charcoal">{seller.perf.total_orders}</div>
                  <div className="w-16 text-right text-xs text-luxury-charcoal">{seller.perf.total_products}</div>
                  <div className={`w-20 text-right text-xs font-medium ${Number(seller.perf.return_rate) > 10 ? 'text-red-500' : 'text-emerald-600'}`}>
                    {seller.perf.return_rate}%
                  </div>
                  <div className="w-8 text-center">
                    {expandedSeller === seller.id ? <ChevronUp size={14} className="text-neutral-400" /> : <ChevronDown size={14} className="text-neutral-400" />}
                  </div>
                </div>

                {/* Expanded Detail */}
                {expandedSeller === seller.id && (
                  <div className="bg-neutral-50 border-b border-neutral-200 px-4 py-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1">Approved Products</p>
                        <p className="text-lg font-medium text-luxury-charcoal">{seller.perf.approved_products}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1">Pending Products</p>
                        <p className="text-lg font-medium text-amber-600">{seller.perf.pending_products}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1">Items Sold</p>
                        <p className="text-lg font-medium text-luxury-charcoal">{seller.perf.total_items_sold}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1">Returns</p>
                        <p className="text-lg font-medium text-red-500">{seller.perf.returned_orders}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1">Brand Tier</p>
                        <p className="text-xs text-luxury-charcoal capitalize">{seller.brand_profile?.brand_tier || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1">Commission</p>
                        <p className="text-xs text-luxury-charcoal">{seller.financial?.commission_rate || 25}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1">Status</p>
                        <p className="text-xs text-luxury-charcoal capitalize">{seller.status}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-1">Joined</p>
                        <p className="text-xs text-luxury-charcoal">{new Date(seller.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, alert }) {
  return (
    <div className="p-4 bg-neutral-50 border border-neutral-100">
      <Icon size={18} className={`mb-2 ${alert ? 'text-red-500' : 'text-luxury-gold'}`} />
      <p className={`text-lg font-medium ${alert ? 'text-red-500' : 'text-luxury-charcoal'}`}>{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-neutral-400">{label}</p>
    </div>
  );
}

function SortHeader({ label, field, current, dir, onSort }) {
  const isActive = current === field;
  return (
    <button onClick={() => onSort(field)}
      className={`w-20 text-right text-[10px] uppercase tracking-wider font-medium flex items-center justify-end gap-0.5 ${
        isActive ? 'text-luxury-charcoal' : 'text-neutral-400 hover:text-neutral-600'
      }`}>
      {label}
      {isActive && (dir === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />)}
    </button>
  );
}
