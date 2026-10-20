import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store, Clock, CheckCircle, XCircle, CreditCard,
  BarChart3, Package, FileText, ChevronRight, ChevronLeft, Shield, Rocket
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSeller } from '../../context/SellerContext';
import Button from '../../components/Button';
import Input from '../../components/Input';
import SEO from '../../components/SEO';

const STATUS_CONFIG = {
  applied:              { color: 'bg-amber-400',   text: 'Applied – Pending Review', icon: Clock },
  under_review:         { color: 'bg-blue-400',    text: 'Under Review',             icon: FileText },
  approved:             { color: 'bg-emerald-400',  text: 'Approved – Complete Onboarding', icon: CheckCircle },
  onboarding_complete:  { color: 'bg-purple-400',   text: 'Onboarding Complete – Pending Go-Live', icon: Package },
  live:                 { color: 'bg-green-500',     text: 'Live – Selling',           icon: Rocket },
  rejected:             { color: 'bg-red-400',       text: 'Rejected',                 icon: XCircle },
};

const ONBOARDING_STEPS = [
  { id: 1, title: 'Financial Details', description: 'Bank account for payouts', icon: CreditCard },
  { id: 2, title: 'Store Policies', description: 'Return & shipping terms', icon: Shield },
  { id: 3, title: 'Review & Go Live', description: 'Verify details & submit', icon: Rocket },
];

export default function SellerDashboard({ embedded }) {
  const { user } = useAuth();
  const { sellerProfile, sellerLoading, updateFinancial, updatePolicies, completeOnboarding, fetchSellerProfile } = useSeller();
  const navigate = useNavigate();

  // Determine initial onboarding step based on data
  const getInitialStep = () => {
    if (!sellerProfile) return 1;
    if (!sellerProfile.financial?.completed) return 1;
    if (!sellerProfile.return_policy || !sellerProfile.shipping_sla) return 2;
    return 3;
  };

  const [onboardingStep, setOnboardingStep] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (sellerProfile) setOnboardingStep(getInitialStep());
  }, [sellerProfile?.financial?.completed, sellerProfile?.return_policy, sellerProfile?.shipping_sla]);

  useEffect(() => {
    if (!sellerLoading && !user && !embedded) navigate('/account');
    if (!sellerLoading && user && !sellerProfile && !embedded) navigate('/dashboard#seller-apply');
  }, [sellerLoading, user, sellerProfile, embedded, navigate]);

  if (sellerLoading || !sellerProfile) {
    return (
      <div className={embedded ? 'py-20 text-center' : 'pt-32 pb-20 text-center'}>
        <div className="w-10 h-10 mx-auto border-2 border-luxury-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const status = STATUS_CONFIG[sellerProfile.status] || STATUS_CONFIG.applied;
  const isApproved = sellerProfile.status === 'approved';
  const isPostOnboarding = ['onboarding_complete', 'live'].includes(sellerProfile.status);
  const isLive = sellerProfile.status === 'live';
  const isPending = ['applied', 'under_review'].includes(sellerProfile.status);

  const financialDone = !!sellerProfile.financial?.completed;
  const policiesDone = !!sellerProfile.return_policy && !!sellerProfile.shipping_sla;

  // Approved sellers see step-by-step onboarding
  if (isApproved) {
    return (
      <div className={embedded ? 'p-6' : 'pt-28 pb-20'}>
        <SEO title="Complete Onboarding" path="/dashboard" noindex />
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-serif text-2xl sm:text-3xl text-luxury-charcoal">{sellerProfile.brand_name}</h1>
            <p className="text-xs text-neutral-400 font-light mt-1">Complete these steps to start selling on BrandClothzy</p>
          </div>

          {/* Stepper */}
          <div className="flex items-center justify-center gap-0 mb-10">
            {ONBOARDING_STEPS.map((s, i) => {
              const done = (s.id === 1 && financialDone) || (s.id === 2 && policiesDone) || false;
              const active = onboardingStep === s.id;
              const Icon = s.icon;
              return (
                <div key={s.id} className="flex items-center">
                  <button
                    onClick={() => setOnboardingStep(s.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs transition-all
                      ${active ? 'bg-luxury-charcoal text-white' : done ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-400'}`}
                  >
                    {done && !active ? <CheckCircle size={14} /> : <Icon size={14} />}
                    <span className="hidden sm:inline font-medium">{s.title}</span>
                    <span className="sm:hidden font-medium">{s.id}</span>
                  </button>
                  {i < ONBOARDING_STEPS.length - 1 && (
                    <ChevronRight size={14} className="text-neutral-300 mx-1 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step Content */}
          {onboardingStep === 1 && (
            <FinancialStep
              profile={sellerProfile}
              updateFinancial={updateFinancial}
              onNext={() => setOnboardingStep(2)}
            />
          )}
          {onboardingStep === 2 && (
            <PoliciesStep
              profile={sellerProfile}
              updatePolicies={updatePolicies}
              onBack={() => setOnboardingStep(1)}
              onNext={() => setOnboardingStep(3)}
            />
          )}
          {onboardingStep === 3 && (
            <ReviewStep
              profile={sellerProfile}
              financialDone={financialDone}
              policiesDone={policiesDone}
              completeOnboarding={completeOnboarding}
              onBack={() => setOnboardingStep(2)}
              onEditFinancial={() => setOnboardingStep(1)}
              onEditPolicies={() => setOnboardingStep(2)}
            />
          )}
        </div>
      </div>
    );
  }

  // Pre-approval (applied/under_review/rejected) & Post-onboarding (onboarding_complete/live)
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    ...(isLive ? [{ id: 'analytics', label: 'Analytics', icon: BarChart3 }] : []),
  ];

  return (
    <div className={embedded ? 'p-6' : 'pt-28 pb-20'}>
      <SEO title="Seller Dashboard" path="/dashboard" noindex />
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl text-luxury-charcoal">{sellerProfile.brand_name}</h1>
            <p className="text-xs text-neutral-400 font-light mt-1">{sellerProfile.legal_name}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${status.color}`} />
            <span className="text-sm font-medium text-luxury-charcoal">{status.text}</span>
          </div>
        </div>

        {/* Status Banner */}
        {!isLive && <StatusBanner profile={sellerProfile} status={status} />}

        {/* Tabs */}
        <div className="flex gap-1 mb-8 overflow-x-auto scrollbar-hide border-b border-neutral-100">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-[11px] uppercase tracking-wider font-medium border-b-2 transition-colors whitespace-nowrap
                ${activeTab === t.id ? 'border-luxury-charcoal text-luxury-charcoal' : 'border-transparent text-neutral-400 hover:text-neutral-600'}`}>
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && <OverviewTab profile={sellerProfile} isPostOnboarding={isPostOnboarding} isLive={isLive} />}
        {activeTab === 'analytics' && isLive && <AnalyticsTab />}
      </div>
    </div>
  );
}

/* ──────────────────────── Status Banner ──────────────────────── */

function StatusBanner({ profile, status }) {
  const isRejected = profile.status === 'rejected';
  const latestReview = profile.reviews?.length > 0 ? profile.reviews[profile.reviews.length - 1] : null;

  return (
    <div className={`p-5 mb-8 border ${isRejected ? 'bg-red-50 border-red-200' : 'bg-neutral-50 border-neutral-200'}`}>
      <div className="flex items-start gap-3">
        <status.icon size={20} className={isRejected ? 'text-red-500' : 'text-luxury-gold'} />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-luxury-charcoal mb-1">
            {profile.status === 'applied' && 'Your application is being processed'}
            {profile.status === 'under_review' && 'Our team is reviewing your application'}
            {profile.status === 'onboarding_complete' && 'Onboarding complete – pending final go-live approval'}
            {profile.status === 'rejected' && 'Application was not approved'}
          </h3>
          <p className="text-xs text-neutral-500">
            {profile.status === 'applied' && "We typically review within 3-5 business days. You'll receive an email update."}
            {profile.status === 'under_review' && 'Please ensure your documents are valid. We may contact you for additional information.'}
            {profile.status === 'onboarding_complete' && 'Our team will activate your store shortly. You can start adding products in My Products.'}
            {profile.status === 'rejected' && 'Please review the feedback below and consider re-applying with updated information.'}
          </p>
          {latestReview && (
            <div className="mt-3 p-3 bg-white border border-neutral-100">
              <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-1">Latest Review Note</p>
              <p className="text-xs text-neutral-600">{latestReview.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────── Overview Tab ──────────────────────── */

function OverviewTab({ profile, isPostOnboarding, isLive }) {
  return (
    <div className="space-y-6">
      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <InfoCard label="Brand Type" value={profile.brand_profile?.brand_type} />
        <InfoCard label="Categories" value={profile.brand_profile?.categories?.join(', ') || '—'} />
        <InfoCard label="Years in Business" value={profile.brand_profile?.years_in_business || '—'} />
        <InfoCard label="GST Number" value={profile.verification?.gst_number} mono />
        <InfoCard label="PAN Number" value={profile.verification?.pan_number} mono />
        <InfoCard label="Verification" value={profile.verification?.verified ? 'Verified' : 'Pending'}
          valueClass={profile.verification?.verified ? 'text-emerald-600' : 'text-amber-600'} />
        <InfoCard label="Warehouse" value={`${profile.warehouse?.city || ''}, ${profile.warehouse?.state || ''}`} />
        <InfoCard label="Dispatch Time" value={profile.warehouse?.dispatch_time || '—'} />
        {profile.brand_profile?.brand_tier && (
          <InfoCard label="Brand Tier" value={profile.brand_profile.brand_tier}
            valueClass={profile.brand_profile.brand_tier === 'premium' ? 'text-luxury-gold' : ''} />
        )}
      </div>

      {/* Financial Terms */}
      {isPostOnboarding && (
        <div className="border border-neutral-200 p-6">
          <h3 className="text-xs uppercase tracking-wider font-medium text-luxury-taupe mb-4">Financial Terms</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-neutral-400">Commission Rate</p>
              <p className="text-lg font-medium text-luxury-charcoal">{profile.financial?.commission_rate || 25}%</p>
            </div>
            <div>
              <p className="text-xs text-neutral-400">Settlement Cycle</p>
              <p className="text-lg font-medium text-luxury-charcoal">{profile.financial?.settlement_cycle || 'T+7'}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-400">Bank</p>
              <p className="text-sm font-medium text-luxury-charcoal">{profile.financial?.bank_name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-400">Shipping SLA</p>
              <p className="text-sm font-medium text-luxury-charcoal">{profile.shipping_sla || '—'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Reviews */}
      {profile.reviews?.length > 0 && (
        <div className="border border-neutral-200 p-6">
          <h3 className="text-xs uppercase tracking-wider font-medium text-luxury-taupe mb-4">Review History</h3>
          <div className="space-y-3">
            {profile.reviews.map((r, i) => (
              <div key={i} className="p-3 bg-neutral-50 border border-neutral-100">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] uppercase tracking-wider font-medium ${
                    r.decision === 'approve' ? 'text-emerald-600' : r.decision === 'reject' ? 'text-red-500' : 'text-amber-600'
                  }`}>{r.decision}</span>
                  <span className="text-[10px] text-neutral-400">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-neutral-600">{r.notes}</p>
                {r.rating && <p className="text-[10px] text-neutral-400 mt-1">Quality: {r.rating}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value, mono, valueClass }) {
  return (
    <div className="p-4 bg-neutral-50 border border-neutral-100">
      <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-1">{label}</p>
      <p className={`text-sm text-luxury-charcoal ${mono ? 'font-mono' : ''} ${valueClass || ''}`}>{value || '—'}</p>
    </div>
  );
}

/* ──────────────────────── Step 1: Financial ──────────────────────── */

function FinancialStep({ profile, updateFinancial, onNext }) {
  const fin = profile.financial || {};
  const [form, setForm] = useState({
    bankName: fin.bank_name || '',
    accountNumber: fin.account_number || '',
    ifscCode: fin.ifsc_code || '',
    accountHolder: fin.account_holder || '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.bankName.trim()) e.bankName = 'Required';
    if (!form.accountNumber.trim()) e.accountNumber = 'Required';
    if (!form.ifscCode.trim() || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifscCode.toUpperCase())) e.ifscCode = 'Valid IFSC required';
    if (!form.accountHolder.trim()) e.accountHolder = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveAndNext = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await updateFinancial({ ...form, ifscCode: form.ifscCode.toUpperCase() });
      onNext();
    } catch (err) {
      alert('Save failed: ' + err.message);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-xl text-luxury-charcoal mb-1">Bank & Financial Details</h2>
        <p className="text-xs text-neutral-400">Required for settlement payouts. Verified before first payout.</p>
      </div>

      {fin.completed && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle size={16} />
          Bank details already saved. You can update or proceed to next step.
        </div>
      )}

      <div className="bg-neutral-50 border border-neutral-100 p-4 text-xs text-neutral-500">
        <p className="font-medium text-neutral-600 mb-2">Financial Terms:</p>
        <p>• Commission: {fin.commission_rate || 25}% per order (20–40% based on brand tier)</p>
        <p>• Settlement: {fin.settlement_cycle || 'T+7'} (payment after delivery confirmation)</p>
        <p>• No COD abuse – controlled returns policy enforced</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Input label="Bank Name *" id="bankName" value={form.bankName}
          onChange={e => set('bankName', e.target.value)} error={errors.bankName}
          placeholder="e.g., HDFC Bank" />
        <Input label="Account Holder Name *" id="accountHolder" value={form.accountHolder}
          onChange={e => set('accountHolder', e.target.value)} error={errors.accountHolder}
          placeholder="As per bank records" />
        <Input label="Account Number *" id="accountNumber" value={form.accountNumber}
          onChange={e => set('accountNumber', e.target.value)} error={errors.accountNumber}
          placeholder="Bank account number" type="password" />
        <Input label="IFSC Code *" id="ifscCode" value={form.ifscCode}
          onChange={e => set('ifscCode', e.target.value.toUpperCase())} error={errors.ifscCode}
          placeholder="e.g., HDFC0001234" maxLength={11} />
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSaveAndNext} loading={saving}>
          Save & Continue <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}

/* ──────────────────────── Step 2: Policies ──────────────────────── */

function PoliciesStep({ profile, updatePolicies, onBack, onNext }) {
  const [returnPolicy, setReturnPolicy] = useState(profile.return_policy || '');
  const [shippingSla, setShippingSla] = useState(profile.shipping_sla || '');
  const [saving, setSaving] = useState(false);

  const handleSaveAndNext = async () => {
    if (!returnPolicy.trim() || !shippingSla.trim()) {
      alert('Both fields are required');
      return;
    }
    setSaving(true);
    try {
      await updatePolicies({ returnPolicy, shippingSla });
      onNext();
    } catch (err) {
      alert('Save failed: ' + err.message);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-xl text-luxury-charcoal mb-1">Store Policies & Shipping SLA</h2>
        <p className="text-xs text-neutral-400">Required before going live. Set clear return and shipping policies for your customers.</p>
      </div>

      {profile.return_policy && profile.shipping_sla && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle size={16} />
          Policies already saved. You can update or proceed to review.
        </div>
      )}

      <div>
        <label className="block text-[10px] uppercase tracking-[0.2em] font-medium text-luxury-taupe mb-1.5">Return Policy *</label>
        <textarea value={returnPolicy} onChange={e => setReturnPolicy(e.target.value)}
          className="w-full px-4 py-3 text-sm border border-neutral-200 bg-white outline-none focus:border-luxury-charcoal h-32 resize-none"
          placeholder="e.g., 7-day no-questions-asked returns. Products must be unworn with original tags. Refund processed in 5-7 business days." />
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-[0.2em] font-medium text-luxury-taupe mb-1.5">Shipping SLA *</label>
        <select value={shippingSla} onChange={e => setShippingSla(e.target.value)}
          className="w-full px-4 py-3 text-sm border border-neutral-200 bg-white outline-none focus:border-luxury-charcoal">
          <option value="">Select shipping commitment</option>
          <option value="Same-day dispatch, 2-3 day delivery">Same-day dispatch, 2-3 day delivery</option>
          <option value="Next-day dispatch, 3-5 day delivery">Next-day dispatch, 3-5 day delivery</option>
          <option value="2-day dispatch, 5-7 day delivery">2-day dispatch, 5-7 day delivery</option>
          <option value="3-5 day dispatch, 7-10 day delivery">3-5 day dispatch, 7-10 day delivery</option>
        </select>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft size={14} /> Back
        </Button>
        <Button onClick={handleSaveAndNext} loading={saving}>
          Save & Continue <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}

/* ──────────────────────── Step 3: Review & Go Live ──────────────────────── */

function ReviewStep({ profile, financialDone, policiesDone, completeOnboarding, onBack, onEditFinancial, onEditPolicies }) {
  const [completing, setCompleting] = useState(false);
  const canComplete = financialDone && policiesDone && profile.status === 'approved';

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await completeOnboarding();
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setCompleting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-xl text-luxury-charcoal mb-1">Review & Go Live</h2>
        <p className="text-xs text-neutral-400">Verify your details below and submit to request go-live.</p>
      </div>

      {/* Checklist */}
      <div className="border border-neutral-200 p-6">
        <h3 className="text-xs uppercase tracking-wider font-medium text-luxury-taupe mb-4">Onboarding Checklist</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {financialDone ? <CheckCircle size={16} className="text-emerald-500" /> : <div className="w-4 h-4 rounded-full border-2 border-neutral-300" />}
              <span className={`text-sm ${financialDone ? 'text-neutral-400 line-through' : 'text-luxury-charcoal font-medium'}`}>Bank Details Completed</span>
            </div>
            {!financialDone && (
              <button onClick={onEditFinancial} className="text-[10px] text-luxury-gold font-medium uppercase tracking-wider hover:underline">Complete</button>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {policiesDone ? <CheckCircle size={16} className="text-emerald-500" /> : <div className="w-4 h-4 rounded-full border-2 border-neutral-300" />}
              <span className={`text-sm ${policiesDone ? 'text-neutral-400 line-through' : 'text-luxury-charcoal font-medium'}`}>Policies Set</span>
            </div>
            {!policiesDone && (
              <button onClick={onEditPolicies} className="text-[10px] text-luxury-gold font-medium uppercase tracking-wider hover:underline">Complete</button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <InfoCard label="Brand" value={profile.brand_name} />
        <InfoCard label="Legal Entity" value={profile.legal_name} />
        <InfoCard label="Brand Type" value={profile.brand_profile?.brand_type} />
        <InfoCard label="GST Number" value={profile.verification?.gst_number} mono />
        <InfoCard label="PAN Number" value={profile.verification?.pan_number} mono />
        <InfoCard label="Warehouse" value={`${profile.warehouse?.city || ''}, ${profile.warehouse?.state || ''}`} />
        {financialDone && <InfoCard label="Bank" value={profile.financial?.bank_name} />}
        {policiesDone && <InfoCard label="Return Policy" value={profile.return_policy} />}
        {policiesDone && <InfoCard label="Shipping SLA" value={profile.shipping_sla} />}
      </div>

      {/* Financial Terms */}
      <div className="bg-neutral-50 border border-neutral-100 p-4 text-xs text-neutral-500">
        <p className="font-medium text-neutral-600 mb-2">After Go-Live:</p>
        <p>• Commission: {profile.financial?.commission_rate || 25}% per order</p>
        <p>• Settlement: {profile.financial?.settlement_cycle || 'T+7'}</p>
        <p>• Add products via My Products (single or bulk CSV upload)</p>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft size={14} /> Back
        </Button>
        <Button variant="gold" onClick={handleComplete} loading={completing} disabled={!canComplete}>
          <Rocket size={14} /> Complete Onboarding & Request Go-Live
        </Button>
      </div>
      {!canComplete && (
        <p className="text-[10px] text-amber-600 text-center">Complete all checklist items above before requesting go-live.</p>
      )}
    </div>
  );
}

/* ──────────────────────── Analytics Tab ──────────────────────── */

function AnalyticsTab() {
  return (
    <div className="text-center py-16">
      <BarChart3 size={40} className="mx-auto text-neutral-300 mb-4" />
      <h3 className="font-serif text-lg text-luxury-charcoal mb-2">Analytics Coming Soon</h3>
      <p className="text-xs text-neutral-400">Track your sales, views, and performance metrics once your store is live.</p>
    </div>
  );
}
