import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Clock, CheckCircle, XCircle, AlertCircle, Search, Filter,
  ChevronDown, ChevronRight, Eye, MessageSquare, Star, Shield, Rocket,
  Image, CreditCard, ExternalLink, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSeller } from '../../context/SellerContext';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import SEO from '../../components/SEO';

const STATUS_COLORS = {
  applied: 'bg-amber-100 text-amber-700',
  under_review: 'bg-blue-100 text-blue-700',
  approved: 'bg-emerald-100 text-emerald-700',
  onboarding_complete: 'bg-purple-100 text-purple-700',
  live: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const STATUS_LABELS = {
  applied: 'Applied',
  under_review: 'Under Review',
  approved: 'Approved',
  onboarding_complete: 'Onboarding Complete',
  live: 'Live',
  rejected: 'Rejected',
};

export default function AdminReview({ embedded }) {
  const { user } = useAuth();
  const {
    allSellers, fetchAllSellers, updateSellerStatus, addReview,
    updateBrandTier, updateCatalogApproval, updateCommission,
    BRAND_TIERS, SELLER_STATUSES
  } = useSeller();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [reviewModal, setReviewModal] = useState(false);

  useEffect(() => {
    if (!user && !embedded) {
      navigate('/account');
      return;
    }
    if (!user) return;
    const load = async () => {
      await fetchAllSellers();
      setLoading(false);
    };
    load();
  }, [user, navigate, embedded, fetchAllSellers]);

  const filtered = allSellers
    .filter(s => statusFilter === 'all' || s.status === statusFilter)
    .filter(s => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.brand_name?.toLowerCase().includes(q) ||
        s.legal_name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.verification?.gst_number?.toLowerCase().includes(q)
      );
    });

  const stats = {
    total: allSellers.length,
    applied: allSellers.filter(s => s.status === 'applied').length,
    under_review: allSellers.filter(s => s.status === 'under_review').length,
    approved: allSellers.filter(s => ['approved', 'onboarding_complete'].includes(s.status)).length,
    live: allSellers.filter(s => s.status === 'live').length,
    rejected: allSellers.filter(s => s.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="pt-32 pb-20 text-center">
        <div className="w-10 h-10 mx-auto border-2 border-luxury-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={embedded ? 'p-6' : 'pt-28 pb-20'}>
      <SEO title="Admin – Seller Review" path="/admin/sellers" noindex />
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl text-luxury-charcoal">Seller Management</h1>
            <p className="text-xs text-neutral-400 font-light mt-1">Review, approve, and manage seller applications</p>
          </div>
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-luxury-gold" />
            <span className="text-[10px] uppercase tracking-wider font-medium text-luxury-taupe">Admin Panel</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <StatCard label="Total" value={stats.total} color="bg-neutral-100" />
          <StatCard label="Applied" value={stats.applied} color="bg-amber-50" />
          <StatCard label="In Review" value={stats.under_review} color="bg-blue-50" />
          <StatCard label="Approved" value={stats.approved} color="bg-emerald-50" />
          <StatCard label="Live" value={stats.live} color="bg-green-50" />
          <StatCard label="Rejected" value={stats.rejected} color="bg-red-50" />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by brand, email, or GST..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-neutral-200 bg-white outline-none focus:border-luxury-charcoal" />
          </div>
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {['all', ...Object.keys(STATUS_LABELS)].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 text-[10px] uppercase tracking-wider font-medium whitespace-nowrap border transition-colors ${
                  statusFilter === s
                    ? 'border-luxury-charcoal bg-luxury-charcoal text-white'
                    : 'border-neutral-200 text-neutral-400 hover:border-neutral-400'
                }`}>
                {s === 'all' ? 'All' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Sellers List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users size={40} className="mx-auto text-neutral-300 mb-4" />
            <p className="text-sm text-neutral-400">No sellers found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(seller => (
              <SellerCard key={seller.id} seller={seller}
                onSelect={() => { setSelectedSeller(seller); setReviewModal(true); }} />
            ))}
          </div>
        )}

        {/* Review Modal */}
        {selectedSeller && (
          <Modal isOpen={reviewModal} onClose={() => { setReviewModal(false); setSelectedSeller(null); }}
            title={selectedSeller.brand_name}>
            <SellerReviewPanel
              seller={selectedSeller}
              onStatusChange={async (status) => {
                await updateSellerStatus(selectedSeller.id, status);
                const updated = allSellers.find(s => s.id === selectedSeller.id);
                if (updated) setSelectedSeller({ ...updated, status });
              }}
              onAddReview={async (review) => {
                await addReview(selectedSeller.id, review);
                await fetchAllSellers();
              }}
              onTierChange={async (tier) => {
                await updateBrandTier(selectedSeller.id, tier);
              }}
              onCatalogApproval={async (approved) => {
                await updateCatalogApproval(selectedSeller.id, approved);
              }}
              onCommissionChange={async (rate) => {
                await updateCommission(selectedSeller.id, rate);
              }}
              brandTiers={BRAND_TIERS}
            />
          </Modal>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className={`p-4 ${color} border border-neutral-100`}>
      <p className="text-[10px] uppercase tracking-wider text-neutral-400">{label}</p>
      <p className="text-xl font-medium text-luxury-charcoal">{value}</p>
    </div>
  );
}

function SellerCard({ seller, onSelect }) {
  const statusClass = STATUS_COLORS[seller.status] || 'bg-neutral-100 text-neutral-600';
  const createdDate = seller.created_at?.toDate?.() || seller.created_at?.seconds
    ? new Date(seller.created_at.seconds * 1000) : null;

  return (
    <div className="border border-neutral-200 hover:border-neutral-300 transition-colors p-5 cursor-pointer" onClick={onSelect}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-sm font-medium text-luxury-charcoal truncate">{seller.brand_name}</h3>
            <span className={`text-[9px] uppercase tracking-wider font-medium px-2 py-0.5 ${statusClass}`}>
              {STATUS_LABELS[seller.status]}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-neutral-400">
            <span>{seller.legal_name}</span>
            <span>{seller.email}</span>
            <span className="font-mono">{seller.verification?.gst_number}</span>
            {createdDate && <span>{createdDate.toLocaleDateString()}</span>}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {seller.brand_profile?.brand_tier && (
            <span className={`text-[9px] uppercase tracking-wider font-medium px-2 py-0.5 border ${
              seller.brand_profile.brand_tier === 'premium' ? 'border-luxury-gold text-luxury-gold' :
              seller.brand_profile.brand_tier === 'mid-range' ? 'border-blue-400 text-blue-500' :
              'border-neutral-300 text-neutral-500'
            }`}>{seller.brand_profile.brand_tier}</span>
          )}
          <ChevronRight size={16} className="text-neutral-400" />
        </div>
      </div>
    </div>
  );
}

function SellerReviewPanel({ seller, onStatusChange, onAddReview, onTierChange, onCatalogApproval, onCommissionChange, brandTiers }) {
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewDecision, setReviewDecision] = useState('');
  const [reviewRating, setReviewRating] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [commissionRate, setCommissionRate] = useState(seller.financial?.commission_rate || 25);
  const [activeSection, setActiveSection] = useState('details');

  const handleSubmitReview = async () => {
    if (!reviewNotes.trim() || !reviewDecision) return;
    setSubmittingReview(true);
    await onAddReview({
      notes: reviewNotes,
      decision: reviewDecision,
      rating: reviewRating,
    });

    // Auto-update status based on decision
    if (reviewDecision === 'approve' && seller.status === 'applied') {
      await onStatusChange('under_review');
    } else if (reviewDecision === 'approve' && seller.status === 'under_review') {
      await onStatusChange('approved');
    } else if (reviewDecision === 'reject') {
      await onStatusChange('rejected');
    }

    setReviewNotes('');
    setReviewDecision('');
    setReviewRating('');
    setSubmittingReview(false);
  };

  const sections = [
    { id: 'details', label: 'Details' },
    { id: 'review', label: 'Review' },
    { id: 'catalog', label: 'Catalog' },
    { id: 'settings', label: 'Settings' },
    { id: 'history', label: 'History' },
  ];

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={`px-3 py-1.5 text-[10px] uppercase tracking-wider font-medium border transition-colors ${
              activeSection === s.id ? 'border-luxury-charcoal bg-luxury-charcoal text-white' : 'border-neutral-200 text-neutral-400'
            }`}>{s.label}</button>
        ))}
      </div>

      {/* Details Section */}
      {activeSection === 'details' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <DetailItem label="Brand Name" value={seller.brand_name} />
            <DetailItem label="Legal Name" value={seller.legal_name} />
            <DetailItem label="Email" value={seller.email} />
            <DetailItem label="Phone" value={seller.phone} />
            <DetailItem label="Brand Type" value={seller.brand_profile?.brand_type} />
            <DetailItem label="Years in Business" value={seller.brand_profile?.years_in_business} />
            <DetailItem label="PAN" value={seller.verification?.pan_number} mono />
            <DetailItem label="GST" value={seller.verification?.gst_number} mono />
            {seller.verification?.cin && <DetailItem label="CIN" value={seller.verification.cin} mono />}
            <DetailItem label="Status" value={STATUS_LABELS[seller.status]}
              valueClass={seller.status === 'live' ? 'text-green-600' : seller.status === 'rejected' ? 'text-red-500' : ''} />
          </div>

          <div className="border-t border-neutral-100 pt-4">
            <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-2">Categories</p>
            <div className="flex flex-wrap gap-1.5">
              {seller.brand_profile?.categories?.map(c => (
                <span key={c} className="text-[10px] px-2 py-0.5 bg-neutral-100 text-neutral-600">{c}</span>
              ))}
            </div>
          </div>

          <div className="border-t border-neutral-100 pt-4">
            <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-2">Warehouse</p>
            <p className="text-xs text-neutral-600">
              {seller.warehouse?.address}, {seller.warehouse?.city}, {seller.warehouse?.state} – {seller.warehouse?.pincode}
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              Daily fulfillment: {seller.warehouse?.can_fulfill_daily ? 'Yes' : 'No'} | Dispatch: {seller.warehouse?.dispatch_time}
            </p>
          </div>

          {(seller.brand_profile?.website || seller.brand_profile?.instagram) && (
            <div className="border-t border-neutral-100 pt-4">
              <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-2">Links</p>
              <div className="flex gap-3">
                {seller.brand_profile?.website && (
                  <a href={seller.brand_profile.website} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                    <ExternalLink size={12} /> Website
                  </a>
                )}
                {seller.brand_profile?.instagram && (
                  <span className="text-xs text-neutral-500">{seller.brand_profile.instagram}</span>
                )}
              </div>
            </div>
          )}

          {/* Quick Status Change */}
          <div className="border-t border-neutral-100 pt-4">
            <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-2">Change Status</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <button key={key} onClick={() => onStatusChange(key)}
                  disabled={seller.status === key}
                  className={`px-3 py-1.5 text-[10px] uppercase tracking-wider font-medium border transition-colors ${
                    seller.status === key
                      ? 'border-luxury-charcoal bg-luxury-charcoal text-white cursor-default'
                      : 'border-neutral-200 text-neutral-400 hover:border-neutral-400'
                  }`}>{label}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Review Section */}
      {activeSection === 'review' && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-luxury-charcoal">Add Review</h4>

          {/* Review Checklist */}
          <div className="bg-neutral-50 p-4 text-xs text-neutral-500 space-y-2">
            <p className="font-medium text-neutral-600">Review Checklist:</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-luxury-gold" /> Brand quality assessment
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-luxury-gold" /> Image quality check
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-luxury-gold" /> Price positioning review
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-luxury-gold" /> Category fit verification
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-luxury-gold" /> GST / PAN verification
            </label>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-medium text-luxury-taupe mb-1.5">Quality Rating</label>
            <div className="flex gap-2">
              {['low', 'mid', 'premium'].map(r => (
                <button key={r} onClick={() => setReviewRating(r)}
                  className={`px-4 py-2 text-xs border capitalize transition-colors ${
                    reviewRating === r ? 'border-luxury-charcoal bg-luxury-charcoal text-white' : 'border-neutral-200 text-neutral-400'
                  }`}>{r}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-medium text-luxury-taupe mb-1.5">Decision *</label>
            <div className="flex gap-2">
              {[
                { value: 'approve', label: 'Approve', class: 'border-emerald-400 bg-emerald-50 text-emerald-700' },
                { value: 'request_changes', label: 'Request Changes', class: 'border-amber-400 bg-amber-50 text-amber-700' },
                { value: 'reject', label: 'Reject', class: 'border-red-400 bg-red-50 text-red-700' },
              ].map(d => (
                <button key={d.value} onClick={() => setReviewDecision(d.value)}
                  className={`px-4 py-2 text-xs border transition-colors ${
                    reviewDecision === d.value ? d.class : 'border-neutral-200 text-neutral-400'
                  }`}>{d.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-medium text-luxury-taupe mb-1.5">Internal Notes *</label>
            <textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)}
              className="w-full px-4 py-3 text-sm border border-neutral-200 bg-white outline-none focus:border-luxury-charcoal h-24 resize-none"
              placeholder="e.g., Images are low quality, ask for white background photos. Price range seems inconsistent with brand quality." />
          </div>

          <Button onClick={handleSubmitReview} loading={submittingReview}
            disabled={!reviewNotes.trim() || !reviewDecision} size="sm">
            <MessageSquare size={14} /> Submit Review
          </Button>
        </div>
      )}

      {/* Catalog Section */}
      {activeSection === 'catalog' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-luxury-charcoal">Catalog Review</h4>
            <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 ${
              seller.catalog_sample?.approved ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}>{seller.catalog_sample?.approved ? 'Approved' : 'Pending'}</span>
          </div>

          {seller.catalog_sample?.images?.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {seller.catalog_sample.images.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                  className="aspect-square bg-neutral-100 border border-neutral-200 overflow-hidden hover:opacity-80 transition-opacity">
                  <img src={url} alt={`Catalog ${i + 1}`} className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-neutral-50">
              <Image size={24} className="mx-auto text-neutral-300 mb-2" />
              <p className="text-xs text-neutral-400">No catalog images uploaded yet</p>
            </div>
          )}

          {seller.catalog_sample?.price_range && (
            <p className="text-xs text-neutral-500">Price Range: <strong>{seller.catalog_sample.price_range}</strong></p>
          )}

          <div className="flex gap-2">
            <Button size="sm" variant="gold" onClick={() => onCatalogApproval(true)}>
              <CheckCircle size={14} /> Approve Catalog
            </Button>
            <Button size="sm" variant="outline" onClick={() => onCatalogApproval(false)}>
              <XCircle size={14} /> Reject Catalog
            </Button>
          </div>
        </div>
      )}

      {/* Settings Section */}
      {activeSection === 'settings' && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-luxury-charcoal">Brand Settings</h4>

          {/* Brand Tier */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-medium text-luxury-taupe mb-1.5">Brand Tier</label>
            <div className="flex gap-2">
              {brandTiers.map(t => (
                <button key={t} onClick={() => onTierChange(t)}
                  className={`px-4 py-2 text-xs border capitalize transition-colors ${
                    seller.brand_profile?.brand_tier === t
                      ? 'border-luxury-charcoal bg-luxury-charcoal text-white'
                      : 'border-neutral-200 text-neutral-400 hover:border-neutral-400'
                  }`}>{t}</button>
              ))}
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">
              This affects UI segmentation and recommendation engine. Avoid mixing ₹299 & ₹4999 products.
            </p>
          </div>

          {/* Commission Rate */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-medium text-luxury-taupe mb-1.5">
              Commission Rate: {commissionRate}%
            </label>
            <input type="range" min="20" max="40" value={commissionRate}
              onChange={e => setCommissionRate(Number(e.target.value))}
              className="w-full accent-luxury-gold" />
            <div className="flex justify-between text-[10px] text-neutral-400">
              <span>20% (Premium)</span>
              <span>30% (Mid)</span>
              <span>40% (Budget)</span>
            </div>
            <Button size="sm" className="mt-2" onClick={() => onCommissionChange(commissionRate)}>
              Update Commission
            </Button>
          </div>

          {/* Verification */}
          <div className="border-t border-neutral-100 pt-4">
            <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-2">Document Verification</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-neutral-50">
                <span className="text-xs text-neutral-600">GST: <span className="font-mono">{seller.verification?.gst_number}</span></span>
                <span className={`text-[10px] ${seller.verification?.verified ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {seller.verification?.verified ? 'Verified' : 'Unverified'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-neutral-50">
                <span className="text-xs text-neutral-600">PAN: <span className="font-mono">{seller.verification?.pan_number}</span></span>
                <span className={`text-[10px] ${seller.verification?.verified ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {seller.verification?.verified ? 'Verified' : 'Unverified'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Section */}
      {activeSection === 'history' && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-luxury-charcoal">Review History</h4>
          {seller.reviews?.length > 0 ? (
            seller.reviews.map((r, i) => (
              <div key={i} className="p-4 border border-neutral-100 bg-neutral-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 ${
                      r.decision === 'approve' ? 'bg-emerald-100 text-emerald-700' :
                      r.decision === 'reject' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>{r.decision}</span>
                    {r.rating && (
                      <span className="text-[10px] text-neutral-400 capitalize">Quality: {r.rating}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-400">{new Date(r.created_at).toLocaleString()}</span>
                </div>
                <p className="text-xs text-neutral-600">{r.notes}</p>
                {r.reviewer_name && (
                  <p className="text-[10px] text-neutral-400 mt-1">By: {r.reviewer_name}</p>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 bg-neutral-50">
              <MessageSquare size={24} className="mx-auto text-neutral-300 mb-2" />
              <p className="text-xs text-neutral-400">No reviews yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value, mono, valueClass }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-neutral-400">{label}</p>
      <p className={`text-xs text-luxury-charcoal ${mono ? 'font-mono' : ''} ${valueClass || ''}`}>{value || '—'}</p>
    </div>
  );
}
