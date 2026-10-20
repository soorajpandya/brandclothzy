import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Search, Package, Image, CheckCircle, XCircle,
  Eye, Ban, ChevronLeft, Shield, Filter
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
  pending_review: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  disabled: 'Disabled',
};

export default function AdminCatalog({ embedded }) {
  const { user } = useAuth();
  const { products, fetchAllProducts, disableProduct, enableProduct, loading } = useMarketplace();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sellerFilter, setSellerFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [pageLoading, setPageLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    if (!user && !embedded) { navigate('/account'); return; }
    if (!user) return;
    fetchAllProducts().then(() => setPageLoading(false));
  }, [user, navigate, embedded, fetchAllProducts]);

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();
  const sellers = [...new Set(products.map(p => p.seller_name).filter(Boolean))].sort();

  const filtered = products
    .filter(p => statusFilter === 'all' || p.status === statusFilter)
    .filter(p => categoryFilter === 'all' || p.category === categoryFilter)
    .filter(p => sellerFilter === 'all' || p.seller_name === sellerFilter)
    .filter(p => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return p.name?.toLowerCase().includes(q) || p.seller_name?.toLowerCase().includes(q);
    });

  const handleToggle = async (product) => {
    setActionLoading(product.id);
    if (product.status === 'disabled') {
      await enableProduct(product.id);
    } else {
      await disableProduct(product.id);
    }
    setActionLoading('');
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
      <SEO title="Admin – Catalog Management" path="/admin/catalog" noindex />
      <div className="max-w-6xl mx-auto px-4">
        <button onClick={() => navigate('/dashboard#admin-dashboard')} className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600 mb-4 transition-colors">
          <ChevronLeft size={14} /> Back to Dashboard
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl text-luxury-charcoal">Catalog Management</h1>
            <p className="text-xs text-neutral-400 font-light mt-1">View and manage all products across sellers</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              <button onClick={() => setViewMode('grid')}
                className={`p-2 border ${viewMode === 'grid' ? 'border-luxury-charcoal bg-luxury-charcoal text-white' : 'border-neutral-200 text-neutral-400'}`}>
                <LayoutDashboard size={14} />
              </button>
              <button onClick={() => setViewMode('list')}
                className={`p-2 border ${viewMode === 'list' ? 'border-luxury-charcoal bg-luxury-charcoal text-white' : 'border-neutral-200 text-neutral-400'}`}>
                <Filter size={14} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-luxury-gold" />
              <span className="text-[10px] uppercase tracking-wider font-medium text-luxury-taupe">Admin</span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="flex flex-wrap gap-4 mb-6 text-xs text-neutral-400">
          <span>{filtered.length} of {products.length} products</span>
          <span>{categories.length} categories</span>
          <span>{sellers.length} sellers</span>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search products or sellers..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-neutral-200 bg-white outline-none focus:border-luxury-charcoal" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 text-xs border border-neutral-200 bg-white outline-none focus:border-luxury-charcoal">
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2.5 text-xs border border-neutral-200 bg-white outline-none focus:border-luxury-charcoal">
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sellerFilter} onChange={e => setSellerFilter(e.target.value)}
            className="px-3 py-2.5 text-xs border border-neutral-200 bg-white outline-none focus:border-luxury-charcoal">
            <option value="all">All Sellers</option>
            {sellers.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Products */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Package size={40} className="mx-auto text-neutral-300 mb-4" />
            <p className="text-sm text-neutral-400">No products match your filters</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(product => (
              <CatalogGridCard key={product.id} product={product}
                onToggle={() => handleToggle(product)}
                isLoading={actionLoading === product.id} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(product => (
              <CatalogListRow key={product.id} product={product}
                onToggle={() => handleToggle(product)}
                isLoading={actionLoading === product.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CatalogGridCard({ product, onToggle, isLoading }) {
  const statusClass = STATUS_COLORS[product.status] || 'bg-neutral-100 text-neutral-600';
  const isDisabled = product.status === 'disabled';

  return (
    <div className={`border border-neutral-200 overflow-hidden group ${isDisabled ? 'opacity-60' : ''}`}>
      <div className="aspect-square bg-neutral-100 overflow-hidden relative">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Image size={30} className="text-neutral-300" /></div>
        )}
        <span className={`absolute top-2 left-2 text-[8px] uppercase tracking-wider font-medium px-1.5 py-0.5 ${statusClass}`}>
          {STATUS_LABELS[product.status]}
        </span>
      </div>
      <div className="p-3">
        <h3 className="text-xs font-medium text-luxury-charcoal truncate">{product.name}</h3>
        <p className="text-[10px] text-neutral-400 truncate">{product.seller_name}</p>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs font-medium text-luxury-charcoal">{formatPrice(product.price)}</p>
          <button onClick={onToggle} disabled={isLoading}
            className={`text-[9px] uppercase tracking-wider font-medium px-2 py-0.5 border transition-colors ${
              isDisabled ? 'border-emerald-300 text-emerald-600 hover:bg-emerald-50' : 'border-red-300 text-red-500 hover:bg-red-50'
            }`}>
            {isLoading ? '...' : isDisabled ? 'Enable' : 'Disable'}
          </button>
        </div>
        <p className="text-[10px] text-neutral-400 mt-1">{product.category}</p>
      </div>
    </div>
  );
}

function CatalogListRow({ product, onToggle, isLoading }) {
  const statusClass = STATUS_COLORS[product.status] || 'bg-neutral-100 text-neutral-600';
  const isDisabled = product.status === 'disabled';

  return (
    <div className={`border border-neutral-200 p-3 flex items-center gap-4 ${isDisabled ? 'opacity-60' : ''}`}>
      <div className="w-14 h-14 bg-neutral-100 border overflow-hidden flex-shrink-0">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Image size={18} className="text-neutral-300" /></div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="text-xs font-medium text-luxury-charcoal truncate">{product.name}</h3>
          <span className={`text-[8px] uppercase tracking-wider font-medium px-1.5 py-0.5 flex-shrink-0 ${statusClass}`}>
            {STATUS_LABELS[product.status]}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-3 text-[10px] text-neutral-400">
          <span>{product.seller_name}</span>
          <span>{product.category}</span>
          <span>{formatPrice(product.price)}</span>
        </div>
      </div>
      <button onClick={onToggle} disabled={isLoading}
        className={`text-[9px] uppercase tracking-wider font-medium px-3 py-1.5 border transition-colors flex-shrink-0 ${
          isDisabled ? 'border-emerald-300 text-emerald-600 hover:bg-emerald-50' : 'border-red-300 text-red-500 hover:bg-red-50'
        }`}>
        {isLoading ? '...' : isDisabled ? 'Enable' : 'Disable'}
      </button>
    </div>
  );
}
