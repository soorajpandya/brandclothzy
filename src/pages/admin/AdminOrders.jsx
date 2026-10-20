import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Search, Package, Truck, CheckCircle, RotateCcw, Clock,
  ChevronLeft, Shield, Eye, MapPin, CreditCard, User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import Button from '../../components/Button';
import SEO from '../../components/SEO';
import { formatPrice } from '../../utils/helpers';

const ORDER_STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  returned: 'bg-red-100 text-red-700',
};
const ORDER_STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  returned: 'Returned',
};
const STATUS_FLOW = ['pending', 'confirmed', 'shipped', 'delivered'];

export default function AdminOrders({ embedded }) {
  const { user } = useAuth();
  const { orders, fetchAllOrders, updateOrderStatus } = useMarketplace();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!user && !embedded) { navigate('/account'); return; }
    if (!user) return;
    fetchAllOrders().then(() => setPageLoading(false));
  }, [user, navigate, embedded, fetchAllOrders]);

  const filtered = orders
    .filter(o => statusFilter === 'all' || o.status === statusFilter)
    .filter(o => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        o.id?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.customer_email?.toLowerCase().includes(q) ||
        o.payment_id?.toLowerCase().includes(q)
      );
    });

  const stats = {
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

  const handleStatusUpdate = async (orderId, newStatus) => {
    setActionLoading(true);
    await updateOrderStatus(orderId, newStatus);
    setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
    setActionLoading(false);
  };

  if (pageLoading) {
    return (
      <div className="pt-32 pb-20 text-center">
        <div className="w-10 h-10 mx-auto border-2 border-luxury-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={embedded ? 'p-6' : 'pt-28 pb-20'}>
      <SEO title="Admin – Order Management" path="/admin/orders" noindex />
      <div className="max-w-6xl mx-auto px-4">
        <button onClick={() => navigate('/dashboard#admin-dashboard')} className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600 mb-4 transition-colors">
          <ChevronLeft size={14} /> Back to Dashboard
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl text-luxury-charcoal">Order Management</h1>
            <p className="text-xs text-neutral-400 font-light mt-1">Track and manage all customer orders</p>
          </div>
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-luxury-gold" />
            <span className="text-[10px] uppercase tracking-wider font-medium text-luxury-taupe">Admin</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-8">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Pending" value={stats.pending} color="bg-amber-50" />
          <StatCard label="Confirmed" value={stats.confirmed} color="bg-blue-50" />
          <StatCard label="Shipped" value={stats.shipped} color="bg-purple-50" />
          <StatCard label="Delivered" value={stats.delivered} color="bg-emerald-50" />
          <StatCard label="Returned" value={stats.returned} color="bg-red-50" />
          <StatCard label="Revenue" value={`₹${(totalRevenue / 1000).toFixed(1)}K`} color="bg-neutral-50" />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by order ID, customer name, email, payment ID..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-neutral-200 bg-white outline-none focus:border-luxury-charcoal" />
          </div>
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {['all', ...Object.keys(ORDER_STATUS_LABELS)].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 text-[10px] uppercase tracking-wider font-medium whitespace-nowrap border transition-colors ${
                  statusFilter === s
                    ? 'border-luxury-charcoal bg-luxury-charcoal text-white'
                    : 'border-neutral-200 text-neutral-400 hover:border-neutral-400'
                }`}>{s === 'all' ? 'All' : ORDER_STATUS_LABELS[s]}</button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart size={40} className="mx-auto text-neutral-300 mb-4" />
            <p className="text-sm text-neutral-400">No orders found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(order => (
              <OrderCard key={order.id} order={order}
                onSelect={() => setSelectedOrder(order)} />
            ))}
          </div>
        )}

        {/* Order Detail Panel */}
        {selectedOrder && (
          <OrderDetailPanel
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onStatusUpdate={handleStatusUpdate}
            actionLoading={actionLoading}
          />
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color = 'bg-neutral-50' }) {
  return (
    <div className={`p-4 ${color} border border-neutral-100`}>
      <p className="text-[10px] uppercase tracking-wider text-neutral-400">{label}</p>
      <p className="text-xl font-medium text-luxury-charcoal">{value}</p>
    </div>
  );
}

function OrderCard({ order, onSelect }) {
  const statusClass = ORDER_STATUS_COLORS[order.status] || 'bg-neutral-100 text-neutral-600';

  return (
    <div className="border border-neutral-200 hover:border-neutral-300 transition-colors p-4 cursor-pointer"
      onClick={onSelect}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-luxury-charcoal font-mono">#{order.id?.slice(-8)}</h3>
            <span className={`text-[9px] uppercase tracking-wider font-medium px-2 py-0.5 ${statusClass}`}>
              {ORDER_STATUS_LABELS[order.status]}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-neutral-400">
            <span>{order.customer_name}</span>
            <span>{order.items?.length || 0} item(s)</span>
            <span>{formatPrice(order.total)}</span>
            <span>{new Date(order.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {order.payment_id && (
            <span className="text-[10px] text-neutral-400 font-mono">{order.payment_id.slice(0, 16)}...</span>
          )}
          <Eye size={16} className="text-neutral-400" />
        </div>
      </div>
    </div>
  );
}

function OrderDetailPanel({ order, onClose, onStatusUpdate, actionLoading }) {
  const currentIndex = STATUS_FLOW.indexOf(order.status);
  const nextStatus = currentIndex >= 0 && currentIndex < STATUS_FLOW.length - 1
    ? STATUS_FLOW[currentIndex + 1] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 pb-8 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full max-w-3xl mx-4 p-6 sm:p-8 shadow-xl z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-xl text-luxury-charcoal">Order #{order.id?.slice(-8)}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 text-xl">&times;</button>
        </div>

        <div className="space-y-6">
          {/* Status Timeline */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-3">Order Status</p>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {STATUS_FLOW.map((s, i) => {
                const idx = STATUS_FLOW.indexOf(order.status);
                const isCompleted = i <= idx;
                const isCurrent = s === order.status;
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-wider font-medium border whitespace-nowrap ${
                      isCurrent ? 'border-luxury-charcoal bg-luxury-charcoal text-white' :
                      isCompleted ? 'border-emerald-400 bg-emerald-50 text-emerald-700' :
                      'border-neutral-200 text-neutral-400'
                    }`}>
                      {isCompleted && !isCurrent && <CheckCircle size={12} />}
                      {ORDER_STATUS_LABELS[s]}
                    </div>
                    {i < STATUS_FLOW.length - 1 && <div className="w-6 h-px bg-neutral-200" />}
                  </div>
                );
              })}
              {order.status === 'returned' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-wider font-medium border border-red-400 bg-red-50 text-red-700 whitespace-nowrap">
                  <RotateCcw size={12} /> Returned
                </div>
              )}
            </div>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-neutral-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <User size={14} className="text-neutral-400" />
                <p className="text-[10px] uppercase tracking-wider text-neutral-400">Customer</p>
              </div>
              <p className="text-sm text-luxury-charcoal font-medium">{order.customer_name}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{order.customer_email}</p>
              <p className="text-xs text-neutral-400">{order.customer_phone}</p>
            </div>
            <div className="border border-neutral-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={14} className="text-neutral-400" />
                <p className="text-[10px] uppercase tracking-wider text-neutral-400">Shipping Address</p>
              </div>
              <p className="text-xs text-neutral-600">{typeof order.shipping_address === 'object' && order.shipping_address ? `${order.shipping_address.address || ''}, ${order.shipping_address.city || ''}, ${order.shipping_address.state || ''} ${order.shipping_address.pincode || ''}` : (order.shipping_address || '—')}</p>
            </div>
          </div>

          {/* Items */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-3">Order Items</p>
            <div className="space-y-2">
              {order.items?.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-100">
                  <div className="w-12 h-12 bg-neutral-200 border overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Package size={16} className="text-neutral-300" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-luxury-charcoal font-medium truncate">{item.name}</p>
                    <p className="text-[10px] text-neutral-400">
                      Qty: {item.quantity} {item.size && `| Size: ${item.size}`} {item.color && `| ${item.color}`}
                    </p>
                  </div>
                  <p className="text-xs font-medium text-luxury-charcoal">{formatPrice(item.price * (item.quantity || 1))}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="border border-neutral-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard size={14} className="text-neutral-400" />
              <p className="text-[10px] uppercase tracking-wider text-neutral-400">Payment</p>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-neutral-400">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-neutral-400">Shipping</span><span>{order.shipping === 0 ? 'Free' : formatPrice(order.shipping)}</span></div>
              <div className="flex justify-between font-medium text-sm pt-1 border-t border-neutral-100 mt-1">
                <span>Total</span><span>{formatPrice(order.total)}</span>
              </div>
              {order.payment_id && (
                <p className="text-[10px] text-neutral-400 pt-1">Payment ID: <span className="font-mono">{order.payment_id}</span></p>
              )}
            </div>
          </div>

          {/* Status History */}
          {order.status_history?.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-3">Status History</p>
              <div className="space-y-2">
                {(Array.isArray(order.status_history) ? order.status_history : Object.values(order.status_history))
                  .slice().reverse().map((h, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <Clock size={12} className="text-neutral-400 flex-shrink-0" />
                    <span className="text-luxury-charcoal capitalize">{h.status}</span>
                    <span className="text-neutral-400">{new Date(h.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-100">
            {nextStatus && (
              <Button size="sm" variant="gold" loading={actionLoading}
                onClick={() => onStatusUpdate(order.id, nextStatus)}>
                Move to {ORDER_STATUS_LABELS[nextStatus]}
              </Button>
            )}
            {order.status === 'delivered' && (
              <Button size="sm" variant="outline" loading={actionLoading}
                onClick={() => onStatusUpdate(order.id, 'returned')}>
                <RotateCcw size={14} /> Mark as Returned
              </Button>
            )}
            {/* Direct status change */}
            <div className="flex gap-1 ml-auto">
              {Object.keys(ORDER_STATUS_LABELS).filter(s => s !== order.status).map(s => (
                <button key={s} onClick={() => onStatusUpdate(order.id, s)}
                  className={`px-2 py-1 text-[9px] uppercase tracking-wider border transition-colors ${ORDER_STATUS_COLORS[s]} border-transparent hover:border-neutral-300`}>
                  {ORDER_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
