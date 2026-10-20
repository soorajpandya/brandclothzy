import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ChevronRight, ChevronLeft, Store, FileText, Truck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSeller } from '../../context/SellerContext';
import Button from '../../components/Button';
import Input from '../../components/Input';
import SEO from '../../components/SEO';
import { validatePAN, validateGST, validateCIN, validatePhone, validateURL, validatePincode } from '../../utils/helpers';

const STEPS = [
  { id: 1, title: 'Brand Identity', icon: Store },
  { id: 2, title: 'Business Verification', icon: FileText },
  { id: 3, title: 'Logistics', icon: Truck },
  { id: 4, title: 'Review & Submit', icon: CheckCircle },
];

const initialForm = {
  brandName: '', legalName: '', brandType: '', website: '', instagram: '',
  yearsInBusiness: '', phone: '', categories: [],
  panNumber: '', gstNumber: '', cin: '',
  warehouseAddress: '', warehouseCity: '', warehouseState: '', warehousePincode: '',
  canFulfillDaily: '', dispatchTime: '',
};

export default function SellerApplication({ embedded }) {
  const { user } = useAuth();
  const { sellerProfile, submitApplication, BRAND_TYPES, CATEGORIES } = useSeller();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!user && !embedded) navigate('/account');
  }, [user, embedded, navigate]);

  useEffect(() => {
    if (sellerProfile && !submitted && !embedded) navigate('/dashboard#seller-dashboard');
  }, [sellerProfile, submitted, embedded, navigate]);

  if (!user) return null;
  if (sellerProfile && !submitted && !embedded) return null;

  const set = (field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    setErrors(p => ({ ...p, [field]: '' }));
  };

  const toggleCategory = (cat) => {
    setForm(p => ({
      ...p,
      categories: p.categories.includes(cat)
        ? p.categories.filter(c => c !== cat)
        : p.categories.length < 5 ? [...p.categories, cat] : p.categories,
    }));
  };

  const validateStep = (s) => {
    const e = {};
    if (s === 1) {
      if (!form.brandName.trim()) e.brandName = 'Brand name is required';
      if (!form.legalName.trim()) e.legalName = 'Legal entity name is required';
      if (!form.brandType) e.brandType = 'Select brand type';
      if (!form.phone || !validatePhone(form.phone)) e.phone = 'Valid 10-digit phone required';
      if (form.website && !validateURL(form.website)) e.website = 'Enter a valid URL';
      if (form.categories.length === 0) e.categories = 'Select at least one category';
    } else if (s === 2) {
      if (!form.panNumber || !validatePAN(form.panNumber)) e.panNumber = 'Valid PAN required (ABCDE1234F)';
      if (!form.gstNumber || !validateGST(form.gstNumber)) e.gstNumber = 'Valid 15-digit GST required';
      if (form.cin && !validateCIN(form.cin)) e.cin = 'Invalid CIN format';
    } else if (s === 3) {
      if (!form.warehouseAddress.trim()) e.warehouseAddress = 'Warehouse address required';
      if (!form.warehouseCity.trim()) e.warehouseCity = 'City required';
      if (!form.warehouseState.trim()) e.warehouseState = 'State required';
      if (!form.warehousePincode || !validatePincode(form.warehousePincode)) e.warehousePincode = 'Valid 6-digit pincode required';
      if (!form.canFulfillDaily) e.canFulfillDaily = 'Select an option';
      if (!form.dispatchTime) e.dispatchTime = 'Select dispatch time';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep(s => Math.min(s + 1, 4));
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      return;
    }
    setSubmitting(true);
    try {
      await submitApplication(form);
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'SubmitApplication');
      }
      setSubmitted(true);
    } catch (err) {
      setErrors({ submit: err.message });
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="pt-32 pb-20">
        <SEO title="Application Submitted" path="/seller/apply" noindex />
        <div className="max-w-lg mx-auto px-4 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-50 flex items-center justify-center">
            <CheckCircle size={32} className="text-emerald-500" />
          </div>
          <h1 className="font-serif text-3xl text-luxury-charcoal mb-3">Application Submitted</h1>
          <p className="text-sm text-neutral-500 font-light leading-relaxed mb-2">
            Thank you for applying to sell on BrandClothzy. Your application is now under review.
          </p>
          <p className="text-xs text-neutral-400 mb-8">
            We'll review your brand, verify your documents, and get back to you within 3–5 business days.
          </p>
          <div className="bg-neutral-50 p-6 text-left mb-8 space-y-2">
            <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium mb-3">Application Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-sm text-luxury-charcoal font-medium">Applied – Pending Review</span>
            </div>
            <p className="text-xs text-neutral-400 pl-4">Brand: {form.brandName}</p>
            <p className="text-xs text-neutral-400 pl-4">GST: {form.gstNumber.toUpperCase()}</p>
          </div>
          <Button onClick={() => navigate('/dashboard#seller-dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? 'p-6' : 'pt-28 pb-20'}>
      <SEO title="Sell on BrandClothzy" path="/seller/apply" description="Apply to become a seller on BrandClothzy – India's curated fashion marketplace." />
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl sm:text-4xl text-luxury-charcoal mb-2">Sell on BrandClothzy</h1>
          <p className="text-sm text-neutral-400 font-light">Apply to join our curated marketplace. Only quality brands are approved.</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <button
                onClick={() => {
                  if (s.id < step || (s.id === step)) return;
                  if (s.id - 1 <= step && validateStep(step)) setStep(s.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-wider font-medium transition-colors
                  ${step === s.id ? 'bg-luxury-charcoal text-white' : step > s.id ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-400'}`}
              >
                <s.icon size={12} />
                <span className="hidden sm:inline">{s.title}</span>
                <span className="sm:hidden">{s.id}</span>
              </button>
              {i < STEPS.length - 1 && <ChevronRight size={14} className="text-neutral-300 mx-1" />}
            </div>
          ))}
        </div>

        {/* Step 1: Brand Identity */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="font-serif text-xl text-luxury-charcoal mb-1">Brand Identity</h2>
            <p className="text-xs text-neutral-400 mb-6">Tell us about your brand so we can evaluate the fit.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input label="Brand Name *" id="brandName" value={form.brandName}
                onChange={e => set('brandName', e.target.value)} error={errors.brandName}
                placeholder="e.g., Urban Edge Clothing" />
              <Input label="Legal Entity Name *" id="legalName" value={form.legalName}
                onChange={e => set('legalName', e.target.value)} error={errors.legalName}
                placeholder="e.g., Urban Edge Pvt. Ltd." />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-medium text-luxury-taupe mb-1.5">Brand Type *</label>
              <div className="flex flex-wrap gap-3">
                {BRAND_TYPES.map(t => (
                  <button key={t} onClick={() => set('brandType', t)}
                    className={`px-4 py-2 text-xs border transition-colors ${form.brandType === t
                      ? 'border-luxury-charcoal bg-luxury-charcoal text-white'
                      : 'border-neutral-200 text-neutral-500 hover:border-neutral-400'}`}>
                    {t}
                  </button>
                ))}
              </div>
              {errors.brandType && <p className="text-[11px] text-red-500 mt-1">{errors.brandType}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input label="Phone Number *" id="phone" value={form.phone}
                onChange={e => set('phone', e.target.value)} error={errors.phone}
                placeholder="10-digit mobile number" />
              <Input label="Years in Business" id="yearsInBusiness" type="number" value={form.yearsInBusiness}
                onChange={e => set('yearsInBusiness', e.target.value)} placeholder="e.g., 3" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input label="Brand Website" id="website" value={form.website}
                onChange={e => set('website', e.target.value)} error={errors.website}
                placeholder="https://yourbrand.com" />
              <Input label="Instagram Handle" id="instagram" value={form.instagram}
                onChange={e => set('instagram', e.target.value)}
                placeholder="@yourbrand" />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-medium text-luxury-taupe mb-1.5">
                Categories (select up to 5) *
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 text-[11px] border transition-colors ${form.categories.includes(cat)
                      ? 'border-luxury-gold bg-luxury-gold/10 text-luxury-charcoal'
                      : 'border-neutral-200 text-neutral-400 hover:border-neutral-300'}`}>
                    {cat}
                  </button>
                ))}
              </div>
              {errors.categories && <p className="text-[11px] text-red-500 mt-1">{errors.categories}</p>}
            </div>
          </div>
        )}

        {/* Step 2: Business Verification */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="font-serif text-xl text-luxury-charcoal mb-1">Business Verification</h2>
            <p className="text-xs text-neutral-400 mb-6">We verify all seller documents before approval. This information is kept confidential.</p>

            <div className="bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
              <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-700">
                <strong>Important:</strong> PAN & GST are mandatory. CIN is required only for Private Limited companies.
                GST will be verified via API during review.
              </div>
            </div>

            <Input label="PAN Number *" id="panNumber" value={form.panNumber}
              onChange={e => set('panNumber', e.target.value.toUpperCase())} error={errors.panNumber}
              placeholder="ABCDE1234F" maxLength={10}
              className="font-mono" />

            <Input label="GST Number *" id="gstNumber" value={form.gstNumber}
              onChange={e => set('gstNumber', e.target.value.toUpperCase())} error={errors.gstNumber}
              placeholder="22AAAAA0000A1Z5" maxLength={15}
              className="font-mono" />

            <Input label="CIN (if Pvt. Ltd.)" id="cin" value={form.cin}
              onChange={e => set('cin', e.target.value.toUpperCase())} error={errors.cin}
              placeholder="U12345AB1234ABC123456" maxLength={21}
              className="font-mono" />

            
          </div>
        )}

        {/* Step 3: Logistics */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="font-serif text-xl text-luxury-charcoal mb-1">Logistics Capability</h2>
            <p className="text-xs text-neutral-400 mb-6">Tell us about your fulfillment capabilities.</p>

            <Input label="Warehouse Address *" id="warehouseAddress" value={form.warehouseAddress}
              onChange={e => set('warehouseAddress', e.target.value)} error={errors.warehouseAddress}
              placeholder="Full warehouse address" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Input label="City *" id="warehouseCity" value={form.warehouseCity}
                onChange={e => set('warehouseCity', e.target.value)} error={errors.warehouseCity} />
              <Input label="State *" id="warehouseState" value={form.warehouseState}
                onChange={e => set('warehouseState', e.target.value)} error={errors.warehouseState} />
              <Input label="Pincode *" id="warehousePincode" value={form.warehousePincode}
                onChange={e => set('warehousePincode', e.target.value)} error={errors.warehousePincode}
                maxLength={6} />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-medium text-luxury-taupe mb-1.5">
                Can you fulfill orders daily? *
              </label>
              <div className="flex gap-3">
                {['yes', 'no'].map(v => (
                  <button key={v} onClick={() => set('canFulfillDaily', v)}
                    className={`px-6 py-2.5 text-xs uppercase tracking-wider border transition-colors ${form.canFulfillDaily === v
                      ? 'border-luxury-charcoal bg-luxury-charcoal text-white'
                      : 'border-neutral-200 text-neutral-500 hover:border-neutral-400'}`}>
                    {v}
                  </button>
                ))}
              </div>
              {errors.canFulfillDaily && <p className="text-[11px] text-red-500 mt-1">{errors.canFulfillDaily}</p>}
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-medium text-luxury-taupe mb-1.5">
                Average Dispatch Time *
              </label>
              <div className="flex flex-wrap gap-3">
                {['Same Day', '1-2 Days', '3-5 Days', '5-7 Days'].map(t => (
                  <button key={t} onClick={() => set('dispatchTime', t)}
                    className={`px-4 py-2 text-xs border transition-colors ${form.dispatchTime === t
                      ? 'border-luxury-charcoal bg-luxury-charcoal text-white'
                      : 'border-neutral-200 text-neutral-500 hover:border-neutral-400'}`}>
                    {t}
                  </button>
                ))}
              </div>
              {errors.dispatchTime && <p className="text-[11px] text-red-500 mt-1">{errors.dispatchTime}</p>}
            </div>
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="font-serif text-xl text-luxury-charcoal mb-1">Review Your Application</h2>
            <p className="text-xs text-neutral-400 mb-6">Please verify all details before submitting. Incorrect data may delay approval.</p>

            <div className="space-y-4">
              {/* Brand Summary */}
              <div className="border border-neutral-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs uppercase tracking-wider font-medium text-luxury-taupe">Brand Identity</h3>
                  <button onClick={() => setStep(1)} className="text-[10px] text-luxury-gold hover:underline uppercase tracking-wider">Edit</button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-neutral-400 text-xs">Brand:</span> <span className="text-luxury-charcoal">{form.brandName}</span></div>
                  <div><span className="text-neutral-400 text-xs">Legal:</span> <span className="text-luxury-charcoal">{form.legalName}</span></div>
                  <div><span className="text-neutral-400 text-xs">Type:</span> <span className="text-luxury-charcoal">{form.brandType}</span></div>
                  <div><span className="text-neutral-400 text-xs">Phone:</span> <span className="text-luxury-charcoal">{form.phone}</span></div>
                  <div className="col-span-2"><span className="text-neutral-400 text-xs">Categories:</span> <span className="text-luxury-charcoal">{form.categories.join(', ')}</span></div>
                </div>
              </div>

              {/* Verification Summary */}
              <div className="border border-neutral-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs uppercase tracking-wider font-medium text-luxury-taupe">Verification</h3>
                  <button onClick={() => setStep(2)} className="text-[10px] text-luxury-gold hover:underline uppercase tracking-wider">Edit</button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-neutral-400 text-xs">PAN:</span> <span className="text-luxury-charcoal font-mono">{form.panNumber}</span></div>
                  <div><span className="text-neutral-400 text-xs">GST:</span> <span className="text-luxury-charcoal font-mono">{form.gstNumber}</span></div>
                  {form.cin && <div><span className="text-neutral-400 text-xs">CIN:</span> <span className="text-luxury-charcoal font-mono">{form.cin}</span></div>}
                </div>
              </div>

              {/* Logistics Summary */}
              <div className="border border-neutral-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs uppercase tracking-wider font-medium text-luxury-taupe">Logistics</h3>
                  <button onClick={() => setStep(3)} className="text-[10px] text-luxury-gold hover:underline uppercase tracking-wider">Edit</button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="col-span-2"><span className="text-neutral-400 text-xs">Address:</span> <span className="text-luxury-charcoal">{form.warehouseAddress}, {form.warehouseCity}, {form.warehouseState} – {form.warehousePincode}</span></div>
                  <div><span className="text-neutral-400 text-xs">Daily Fulfillment:</span> <span className="text-luxury-charcoal capitalize">{form.canFulfillDaily}</span></div>
                  <div><span className="text-neutral-400 text-xs">Dispatch:</span> <span className="text-luxury-charcoal">{form.dispatchTime}</span></div>
                </div>
              </div>
            </div>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 p-4 text-sm text-red-600">{errors.submit}</div>
            )}

            <div className="bg-neutral-50 p-4 text-xs text-neutral-500">
              By submitting, you agree to BrandClothzy's{' '}
              <a href="/terms" className="underline hover:text-luxury-charcoal">Seller Terms</a> and acknowledge
              that your application will be reviewed within 3–5 business days. Only approved brands will be listed.
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-neutral-100">
          {step > 1 ? (
            <Button variant="ghost" onClick={prevStep}>
              <ChevronLeft size={14} /> Back
            </Button>
          ) : <div />}

          {step < 4 ? (
            <Button onClick={nextStep}>
              Next <ChevronRight size={14} />
            </Button>
          ) : (
            <Button variant="gold" onClick={handleSubmit} loading={submitting}>
              Submit Application
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
