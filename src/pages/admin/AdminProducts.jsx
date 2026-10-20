import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Search, CheckCircle, XCircle, Eye, MessageSquare, Filter,
  Image, Clock, Shield, ChevronLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import Button from '../../components/Button';
import SEO from '../../components/SEO';
import { formatPrice } from '../../utils/helpers';

const STATUS_COLORS = {
  pending_review: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  disabled: 'bg-neutral-200 text-neutral-500',
};
const STATUS_LABELS = {
  pending_review: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  disabled: 'Disabled',
};

export default function AdminProducts({ embedded }) {
  const { user } = useAuth();
  const { products, fetchAllProducts, approveProduct, rejectProduct, loading } = useMarketplace();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState('pending_review');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rejectFeedback, setRejectFeedback] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!user && !embedded) { navigate('/account'); return; }
    if (!user) return;
    fetchAllProducts().then(() => setPageLoading(false));
  }, [user, navigate, embedded, fetchAllProducts]);

  const filtered = products
    .filter(p => statusFilter === 'all' || p.status === statusFilter)
    .filter(p => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return p.name?.toLowerCase().includes(q) || p.seller_name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
    });

  const stats = {
    total: products.length,
    pending: products.filter(p => p.status === 'pending_review').length,
    approved: products.filter(p => p.status === 'approved').length,
    rejected: products.filter(p => p.status === 'rejected').length,
  };

  const handleApprove = async (productId) => {
    setActionLoading(true);
    await approveProduct(productId);
    setSelectedProduct(null);
    setActionLoading(false);
  };

  const handleReject = async (productId) => {
    if (!rejectFeedback.trim()) { alert('Please provide feedback'); return; }
    setActionLoading(true);
    await rejectProduct(productId, rejectFeedback);
    setRejectFeedback('');
    setSelectedProduct(null);
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
      <SEO title="Admin – Product Verification" path="/admin/products" noindex />
      <div className="max-w-6xl mx-auto px-4">
        <button onClick={() => navigate('/dashboard#admin-dashboard')} className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600 mb-4 transition-colors">
          <ChevronLeft size={14} /> Back to Dashboard
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl text-luxury-charcoal">Product Verification</h1>
            <p className="text-xs text-neutral-400 font-light mt-1">Review and approve seller product listings</p>
          </div>
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-luxury-gold" />
            <span className="text-[10px] uppercase tracking-wider font-medium text-luxury-taupe">Admin</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Pending" value={stats.pending} color="bg-amber-50" />
          <StatCard label="Approved" value={stats.approved} color="bg-emerald-50" />
          <StatCard label="Rejected" value={stats.rejected} color="bg-red-50" />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search products, sellers, categories..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-neutral-200 bg-white outline-none focus:border-luxury-charcoal" />
          </div>
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {['all', 'pending_review', 'approved', 'rejected', 'disabled'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 text-[10px] uppercase tracking-wider font-medium whitespace-nowrap border transition-colors ${
                  statusFilter === s
                    ? 'border-luxury-charcoal bg-luxury-charcoal text-white'
                    : 'border-neutral-200 text-neutral-400 hover:border-neutral-400'
                }`}>{s === 'all' ? 'All' : STATUS_LABELS[s]}</button>
            ))}
          </div>
        </div>

        {/* Products List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Package size={40} className="mx-auto text-neutral-300 mb-4" />
            <p className="text-sm text-neutral-400">No products found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product}
                onSelect={() => setSelectedProduct(product)} />
            ))}
          </div>
        )}

        {/* Detail Panel */}
        {selectedProduct && (
          <ProductDetailPanel
            product={selectedProduct}
            onClose={() => { setSelectedProduct(null); setRejectFeedback(''); }}
            onApprove={() => handleApprove(selectedProduct.id)}
            onReject={() => handleReject(selectedProduct.id)}
            rejectFeedback={rejectFeedback}
            setRejectFeedback={setRejectFeedback}
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

function ProductCard({ product, onSelect }) {
  const statusClass = STATUS_COLORS[product.status] || 'bg-neutral-100 text-neutral-600';

  return (
    <div className="border border-neutral-200 hover:border-neutral-300 transition-colors p-4 cursor-pointer flex items-center gap-4"
      onClick={onSelect}>
      <div className="w-16 h-16 bg-neutral-100 border border-neutral-200 overflow-hidden flex-shrink-0">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Image size={20} className="text-neutral-300" /></div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-medium text-luxury-charcoal truncate">{product.name}</h3>
          <span className={`text-[9px] uppercase tracking-wider font-medium px-2 py-0.5 flex-shrink-0 ${statusClass}`}>
            {STATUS_LABELS[product.status]}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-neutral-400">
          <span>Seller: {product.seller_name}</span>
          <span>{product.category}</span>
          <span>{formatPrice(product.price)}</span>
          <span>{new Date(product.created_at).toLocaleDateString()}</span>
        </div>
      </div>
      <Eye size={16} className="text-neutral-400 flex-shrink-0" />
    </div>
  );
}

function ProductDetailPanel({ product, onClose, onApprove, onReject, rejectFeedback, setRejectFeedback, actionLoading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 pb-8 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full max-w-3xl mx-4 p-6 sm:p-8 shadow-xl z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-xl text-luxury-charcoal">Product Review</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 text-xl">&times;</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Images */}
          <div>
            {product.images?.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {product.images.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                    className="aspect-square bg-neutral-100 border border-neutral-200 overflow-hidden hover:opacity-80 transition-opacity">
                    <img src={url} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            ) : (
              <div className="aspect-square bg-neutral-50 flex items-center justify-center">
                <Image size={40} className="text-neutral-300" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <span className={`text-[9px] uppercase tracking-wider font-medium px-2 py-0.5 ${STATUS_COLORS[product.status]}`}>
                {STATUS_LABELS[product.status]}
              </span>
            </div>

            <h3 className="font-serif text-lg text-luxury-charcoal">{product.name}</h3>
            <p className="text-xs text-neutral-500">{product.description}</p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Seller</p>
                <p className="text-luxury-charcoal font-medium">{product.seller_name}</p>
              </div>
              <div>
                <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Category</p>
                <p className="text-luxury-charcoal">{product.category}</p>
              </div>
              <div>
                <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Price</p>
                <p className="text-luxury-charcoal font-medium">{formatPrice(product.price)}</p>
              </div>
              <div>
                <p className="text-[10px] text-neutral-400 uppercase tracking-wider">MRP</p>
                <p className="text-luxury-charcoal">{product.original_price ? formatPrice(product.original_price) : '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Sizes</p>
                <p className="text-luxury-charcoal">{product.sizes?.join(', ') || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Colors</p>
                <p className="text-luxury-charcoal">{product.colors?.join(', ') || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Images</p>
                <p className="text-luxury-charcoal">{product.images?.length || 0}</p>
              </div>
              <div>
                <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Submitted</p>
                <p className="text-luxury-charcoal">{new Date(product.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Review Checklist */}
            <div className="bg-neutral-50 p-3 text-[11px] text-neutral-500 space-y-1.5">
              <p className="font-medium text-neutral-600">Verification Checklist:</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-luxury-gold" /> Image quality & authenticity
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-luxury-gold" /> Accurate product description
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-luxury-gold" /> Correct pricing & category
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-luxury-gold" /> No copyright / trademark issues
              </label>
            </div>

            {product.admin_feedback && (
              <div className="bg-red-50 border border-red-200 p-3">
                <p className="text-[10px] uppercase tracking-wider text-red-400 mb-1">Previous Feedback</p>
                <p className="text-xs text-red-700">{product.admin_feedback}</p>
              </div>
            )}

            {/* Actions */}
            {product.status === 'pending_review' && (
              <div className="space-y-3 pt-2">
                <div className="flex gap-2">
                  <Button size="sm" variant="gold" onClick={onApprove} loading={actionLoading}>
                    <CheckCircle size={14} /> Approve
                  </Button>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-medium text-luxury-taupe mb-1.5">
                    Rejection Feedback
                  </label>
                  <textarea value={rejectFeedback} onChange={e => setRejectFeedback(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-neutral-200 bg-white outline-none focus:border-luxury-charcoal h-20 resize-none"
                    placeholder="Explain why this product is being rejected..." />
                  <Button size="sm" variant="outline" onClick={onReject} loading={actionLoading} className="mt-2">
                    <XCircle size={14} /> Reject with Feedback
                  </Button>
                </div>
              </div>
            )}

            {product.status === 'rejected' && (
              <Button size="sm" variant="gold" onClick={onApprove} loading={actionLoading}>
                <CheckCircle size={14} /> Approve (Override Rejection)
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
