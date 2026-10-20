import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, ShoppingCart, BarChart3, Shield,
  TrendingUp, Clock, CheckCircle, XCircle, AlertTriangle, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSeller } from '../../context/SellerContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import SEO from '../../components/SEO';

export default function AdminDashboard({ embedded }) {
  const { user } = useAuth();
  const { allSellers, fetchAllSellers } = useSeller();
  const { products, orders, fetchAllProducts, fetchAllOrders } = useMarketplace();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user && !embedded) { navigate('/account'); return; }
    if (!user) return;
    const load = async () => {
      await Promise.all([fetchAllSellers(), fetchAllProducts(), fetchAllOrders()]);
      setLoading(false);
    };
    load();
  }, [user, navigate, embedded, fetchAllSellers, fetchAllProducts, fetchAllOrders]);

  if (loading) {
    return (
      <div className="pt-32 pb-20 text-center">
        <div className="w-10 h-10 mx-auto border-2 border-luxury-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const sellerStats = {
    total: allSellers.length,
    pending: allSellers.filter(s => ['applied', 'under_review'].includes(s.status)).length,
    live: allSellers.filter(s => s.status === 'live').length,
  };

  const productStats = {
    total: products.length,
    pending: products.filter(p => p.status === 'pending_review').length,
    approved: products.filter(p => p.status === 'approved').length,
    rejected: products.filter(p => p.status === 'rejected').length,
  };

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    returned: orders.filter(o => o.status === 'returned').length,
  };

  const totalRevenue = orders
    .filter(o => ['confirmed', 'shipped', 'delivered'].includes(o.status))
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const cards = [
    {
      title: 'Seller Management',
      description: 'Review applications, manage sellers',
      icon: Users,
      link: '/dashboard#admin-sellers',
      stats: [
        { label: 'Total', value: sellerStats.total },
        { label: 'Pending', value: sellerStats.pending, alert: sellerStats.pending > 0 },
        { label: 'Live', value: sellerStats.live },
      ],
    },
    {
      title: 'Product Verification',
      description: 'Approve or reject product listings',
      icon: Package,
      link: '/dashboard#admin-products',
      stats: [
        { label: 'Total', value: productStats.total },
        { label: 'Pending', value: productStats.pending, alert: productStats.pending > 0 },
        { label: 'Approved', value: productStats.approved },
      ],
    },
    {
      title: 'Order Management',
      description: 'Track and manage all orders',
      icon: ShoppingCart,
      link: '/dashboard#admin-orders',
      stats: [
        { label: 'Total', value: orderStats.total },
        { label: 'Pending', value: orderStats.pending, alert: orderStats.pending > 0 },
        { label: 'Delivered', value: orderStats.delivered },
      ],
    },
    {
      title: 'Catalog Management',
      description: 'View and manage all products',
      icon: LayoutDashboard,
      link: '/dashboard#admin-catalog',
      stats: [
        { label: 'Products', value: productStats.total },
        { label: 'Disabled', value: products.filter(p => p.status === 'disabled').length },
        { label: 'Active', value: productStats.approved },
      ],
    },
    {
      title: 'Seller Performance',
      description: 'Per-seller analytics and metrics',
      icon: BarChart3,
      link: '/dashboard#admin-performance',
      stats: [
        { label: 'Sellers', value: sellerStats.live },
        { label: 'Orders', value: orderStats.total },
        { label: 'Returns', value: orderStats.returned },
      ],
    },
  ];

  return (
    <div className={embedded ? 'p-6' : 'pt-28 pb-20'}>
      <SEO title="Admin Dashboard" path="/admin/dashboard" noindex />
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl text-luxury-charcoal">Admin Dashboard</h1>
            <p className="text-xs text-neutral-400 font-light mt-1">Marketplace control center</p>
          </div>
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-luxury-gold" />
            <span className="text-[10px] uppercase tracking-wider font-medium text-luxury-taupe">Admin</span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <MetricCard icon={Users} label="Active Sellers" value={sellerStats.live} color="text-blue-500" />
          <MetricCard icon={Package} label="Live Products" value={productStats.approved} color="text-emerald-500" />
          <MetricCard icon={ShoppingCart} label="Total Orders" value={orderStats.total} color="text-purple-500" />
          <MetricCard icon={TrendingUp} label="Revenue" value={`₹${(totalRevenue / 1000).toFixed(1)}K`} color="text-luxury-gold" />
        </div>

        {/* Alerts */}
        {(sellerStats.pending > 0 || productStats.pending > 0 || orderStats.pending > 0) && (
          <div className="bg-amber-50 border border-amber-200 p-4 mb-8 flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-700 space-y-1">
              {sellerStats.pending > 0 && <p>{sellerStats.pending} seller application(s) awaiting review</p>}
              {productStats.pending > 0 && <p>{productStats.pending} product(s) pending verification</p>}
              {orderStats.pending > 0 && <p>{orderStats.pending} order(s) need processing</p>}
            </div>
          </div>
        )}

        {/* Module Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(card => (
            <Link key={card.title} to={card.link}
              className="border border-neutral-200 hover:border-neutral-300 p-5 transition-all hover:shadow-sm group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-neutral-50 flex items-center justify-center">
                    <card.icon size={20} className="text-luxury-charcoal" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-luxury-charcoal">{card.title}</h3>
                    <p className="text-[10px] text-neutral-400">{card.description}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-neutral-300 group-hover:text-neutral-500 transition-colors" />
              </div>
              <div className="flex gap-4">
                {card.stats.map(stat => (
                  <div key={stat.label}>
                    <p className="text-[10px] uppercase tracking-wider text-neutral-400">{stat.label}</p>
                    <p className={`text-lg font-medium ${stat.alert ? 'text-amber-600' : 'text-luxury-charcoal'}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-8 border border-neutral-200 p-5">
          <h3 className="text-xs uppercase tracking-wider font-medium text-luxury-taupe mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {orders.slice(0, 5).map(order => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-neutral-50 last:border-0">
                <div className="flex items-center gap-3">
                  <ShoppingCart size={14} className="text-neutral-400" />
                  <div>
                    <p className="text-xs text-luxury-charcoal">Order #{order.id?.slice(-8)}</p>
                    <p className="text-[10px] text-neutral-400">{order.customer_name} – {order.items?.length || 0} item(s)</p>
                  </div>
                </div>
                <span className={`text-[9px] uppercase tracking-wider font-medium px-2 py-0.5 ${
                  order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                  order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                  order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  'bg-neutral-100 text-neutral-600'
                }`}>{order.status}</span>
              </div>
            ))}
            {orders.length === 0 && (
              <p className="text-xs text-neutral-400 text-center py-4">No orders yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }) {
  return (
    <div className="p-4 bg-neutral-50 border border-neutral-100">
      <Icon size={18} className={`${color} mb-2`} />
      <p className="text-xl font-medium text-luxury-charcoal">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-neutral-400">{label}</p>
    </div>
  );
}
