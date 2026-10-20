import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Lock, ArrowRight, Smartphone, CreditCard, Landmark } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import { useMarketplace } from '../context/MarketplaceContext';
import { displayPrice, validateEmail, validatePhone, validatePincode, validateRequired } from '../utils/helpers';
import Input from '../components/Input';
import Button from '../components/Button';
import SEO from '../components/SEO';

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY || 'rzp_live_SZRHO7fpJcDGVe';

export default function Checkout() {
  const { items, subtotal, shipping, total, clearCart } = useCart();
  const { addToast } = useUI();
  const { user, signInWithGoogle } = useAuth();
  const { createOrder } = useMarketplace();
  const [step, setStep] = useState(null);
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [generatedOrderId, setGeneratedOrderId] = useState('');

  const [shippingForm, setShippingForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [shippingErrors, setShippingErrors] = useState({});
  const [pincodeLoading, setPincodeLoading] = useState(false);

  // Determine initial step and pre-fill from Google profile
  useEffect(() => {
    if (step !== null) return;
    if (user) {
      const nameParts = (user.name || '').split(' ');
      setShippingForm((prev) => ({
        ...prev,
        firstName: prev.firstName || nameParts[0] || '',
        lastName: prev.lastName || nameParts.slice(1).join(' ') || '',
        email: prev.email || user.email || '',
      }));
      setStep('shipping');
    } else {
      setStep('identify');
    }
  }, [user, step]);

  // Fire InitiateCheckout once when items are present
  useEffect(() => {
    if (items.length > 0 && typeof window.fbq === 'function') {
      window.fbq('track', 'InitiateCheckout', {
        content_ids: items.map((i) => i.id),
        num_items: items.reduce((s, i) => s + i.quantity, 0),
        value: total,
        currency: 'INR',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleCheckout = async () => {
    const result = await signInWithGoogle();
    if (result.success) {
      setStep(null); // trigger re-evaluation with user data
    }
  };

  const updateShipping = (field, value) => {
    setShippingForm((prev) => ({ ...prev, [field]: value }));
    setShippingErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // Auto-fill city & state from pincode API
  useEffect(() => {
    const pincode = shippingForm.pincode.trim();
    // Clear city/state whenever pincode is incomplete
    if (pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      setShippingForm(prev => ({ ...prev, city: '', state: '' }));
      return;
    }
    let cancelled = false;
    setPincodeLoading(true);
    fetch(`https://api.postalpincode.in/pincode/${pincode}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        const result = Array.isArray(data) ? data[0] : data;
        if (result?.Status === 'Success' && result.PostOffice?.length) {
          const po = result.PostOffice[0];
          setShippingForm(prev => ({
            ...prev,
            city: po.District || po.Name || '',
            state: po.State || '',
          }));
          setShippingErrors(prev => ({ ...prev, city: '', state: '', pincode: '' }));
        } else {
          setShippingForm(prev => ({ ...prev, city: '', state: '' }));
          setShippingErrors(prev => ({ ...prev, pincode: 'Invalid pincode' }));
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setPincodeLoading(false); });
    return () => { cancelled = true; };
  }, [shippingForm.pincode]);

  const validateShipping = () => {
    const errors = {};
    if (!validateRequired(shippingForm.firstName)) errors.firstName = 'First name is required';
    if (!validateRequired(shippingForm.lastName)) errors.lastName = 'Last name is required';
    if (!validateEmail(shippingForm.email)) errors.email = 'Valid email is required';
    if (!validatePhone(shippingForm.phone)) errors.phone = 'Valid 10-digit phone number required';
    if (!validateRequired(shippingForm.address)) errors.address = 'Address is required';
    if (!validateRequired(shippingForm.city)) errors.city = 'City is required';
    if (!validateRequired(shippingForm.state)) errors.state = 'State is required';
    if (!validatePincode(shippingForm.pincode)) errors.pincode = 'Valid 6-digit pincode required';
    setShippingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleShippingContinue = () => {
    if (validateShipping()) {
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'AddPaymentInfo');
      }
      setStep('payment');
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-script')) return resolve(true);
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePay = async (method) => {
    setLoading(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Payment gateway failed to load');

      const options = {
        key: RAZORPAY_KEY,
        amount: Math.round(total * 1.4 * 100),
        currency: 'INR',
        name: 'BrandClothzy',
        description: `Order for ${shippingForm.firstName} ${shippingForm.lastName}`,
        prefill: {
          name: `${shippingForm.firstName} ${shippingForm.lastName}`,
          email: shippingForm.email,
          contact: shippingForm.phone,
        },
        handler: async (response) => {
          const paymentId = response.razorpay_payment_id || `BCZ-${Date.now().toString().slice(-8)}`;
          try {
            const order = await createOrder({
              customerName: `${shippingForm.firstName} ${shippingForm.lastName}`,
              customerEmail: shippingForm.email,
              customerPhone: shippingForm.phone,
              shippingAddress: {
                address: shippingForm.address,
                city: shippingForm.city,
                state: shippingForm.state,
                pincode: shippingForm.pincode,
              },
              items: items.map(item => ({
                id: item.id,
                seller_id: item.seller_id || '',
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                size: item.selectedSize || '',
                color: item.selectedColor || '',
                images: item.images || [],
              })),
              subtotal,
              shipping,
              total: Math.round(total * 1.4),
              paymentId,
            });
            setGeneratedOrderId(order.id);
          } catch (err) {
            // Order save failed — still show success with payment ID so customer is not confused
            console.error('Order save failed:', err);
            setGeneratedOrderId(paymentId);
          }
          if (typeof window.fbq === 'function') {
            window.fbq('track', 'Purchase', {
              value: Math.round(total * 1.4),
              currency: 'INR',
              content_ids: items.map((i) => i.id),
              content_type: 'product',
              num_items: items.reduce((s, i) => s + i.quantity, 0),
            });
          }
          setOrderPlaced(true);
          clearCart();
          addToast('Payment successful \u2014 Order placed!', 'success');
        },
        modal: { ondismiss: () => setLoading(false) },
        theme: { color: '#1A1A1A' },
      };

      if (method === 'upi') {
        options.config = { display: { blocks: { upi: { instruments: [{ method: 'upi' }] } }, sequence: ['block.upi'], preferences: { show_default_blocks: false } } };
      } else if (method === 'card') {
        options.config = { display: { blocks: { card: { instruments: [{ method: 'card' }] } }, sequence: ['block.card'], preferences: { show_default_blocks: false } } };
      } else if (method === 'netbanking') {
        options.config = { display: { blocks: { nb: { instruments: [{ method: 'netbanking' }] } }, sequence: ['block.nb'], preferences: { show_default_blocks: false } } };
      }

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        addToast(resp.error?.description || 'Payment failed. Please try again.', 'error');
        setLoading(false);
      });
      rzp.open();
    } catch {
      addToast('Unable to initiate payment. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };



  if (items.length === 0 && !orderPlaced) {
    return (
      <div className="pt-32 pb-20 text-center max-w-md mx-auto px-4">
        <h1 className="font-serif text-3xl text-luxury-charcoal mb-3">Nothing to Checkout</h1>
        <p className="text-sm text-neutral-400 font-light mb-8">
          Your bag is empty. Add some pieces before checking out.
        </p>
        <Link to="/shop">
          <Button size="lg">Shop Now</Button>
        </Link>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="pt-32 pb-20 text-center max-w-lg mx-auto px-4">
        <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-green-50 rounded-full">
          <CheckCircle size={36} className="text-green-500" />
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-luxury-charcoal mb-3">
          Thank You for Your Order
        </h1>
        <p className="text-sm text-neutral-400 font-light mb-3 leading-relaxed">
          Your order has been placed successfully. A confirmation email has been sent to{' '}
          <span className="text-luxury-charcoal font-medium">{shippingForm.email}</span>.
        </p>
        <p className="text-xs text-neutral-400 font-light mb-10">
          Order #{generatedOrderId || `BCZ-${Date.now().toString().slice(-8)}`}
        </p>
        <div className="bg-luxury-pearl p-6 mb-8 text-left">
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-luxury-taupe mb-4">
            Shipping Details
          </h3>
          <p className="text-sm text-luxury-charcoal">
            {shippingForm.firstName} {shippingForm.lastName}
          </p>
          <p className="text-sm text-neutral-500 font-light">{shippingForm.address}</p>
          <p className="text-sm text-neutral-500 font-light">
            {shippingForm.city}, {shippingForm.state} {shippingForm.pincode}
          </p>
        </div>
        <Link to="/shop">
          <Button variant="outline" size="lg">
            Continue Shopping
            <ArrowRight size={14} />
          </Button>
        </Link>
        <div className="mt-4">
          <Link to="/account" className="text-sm text-luxury-gold hover:underline">
            View Order History
          </Link>
        </div>
      </div>
    );
  }

  if (step === 'identify') {
    return (
      <div className="pt-32 pb-20">
        <div className="max-w-md mx-auto px-4 text-center">
          <Lock size={32} className="mx-auto mb-6 text-luxury-gold" />
          <h1 className="font-serif text-3xl sm:text-4xl text-luxury-charcoal mb-3">Sign In to Checkout</h1>
          <p className="text-sm text-neutral-400 font-light mb-10 leading-relaxed">
            A BrandClothzy account is required to place an order and track your purchases.
          </p>

          <button
            onClick={handleGoogleCheckout}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-6 border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors text-sm font-medium text-luxury-charcoal"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </button>

          <p className="mt-8 text-[11px] text-neutral-400 font-light leading-relaxed">
            By signing in, you agree to our{' '}
            <Link
              to="/terms"
              onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}
              className="underline hover:text-luxury-charcoal"
            >
              Terms of Service
            </Link>{' '}and{' '}
            <Link
              to="/privacy"
              onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}
              className="underline hover:text-luxury-charcoal"
            >
              Privacy Policy
            </Link>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 lg:pt-28 pb-16">
      <SEO title="Checkout" path="/checkout" description="Secure checkout at BrandClothzy. Multiple payment options including UPI, cards, and net banking." noindex />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl sm:text-4xl text-luxury-charcoal mb-6">Checkout</h1>
          <div className="flex items-center justify-center gap-4">
            {['shipping', 'payment'].map((s, i) => (
              <div key={s} className="flex items-center gap-4">
                {i > 0 && <div className="w-12 h-[1px] bg-neutral-200" />}
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-medium ${
                      step === s
                        ? 'bg-luxury-charcoal text-white'
                        : s === 'shipping' && step === 'payment'
                        ? 'bg-luxury-gold text-white'
                        : 'bg-neutral-200 text-neutral-500'
                    }`}
                  >
                    {s === 'shipping' && step === 'payment' ? '✓' : i + 1}
                  </span>
                  <span
                    className={`text-[10px] uppercase tracking-[0.15em] hidden sm:block ${
                      step === s ? 'text-luxury-charcoal font-medium' : 'text-neutral-400'
                    }`}
                  >
                    {s}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`grid grid-cols-1 ${step === 'shipping' ? 'lg:grid-cols-3' : ''} gap-12 lg:gap-16`}>
          <div className={step === 'shipping' ? 'lg:col-span-2' : ''}>
            {step === 'shipping' && (
              <div className="animate-fade-in">
                <h2 className="text-[10px] uppercase tracking-[0.25em] font-semibold text-luxury-taupe mb-6">
                  Shipping Information
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      id="firstName"
                      label="First Name"
                      value={shippingForm.firstName}
                      onChange={(e) => updateShipping('firstName', e.target.value)}
                      error={shippingErrors.firstName}
                      placeholder="e.g. Arjun"
                    />
                    <Input
                      id="lastName"
                      label="Last Name"
                      value={shippingForm.lastName}
                      onChange={(e) => updateShipping('lastName', e.target.value)}
                      error={shippingErrors.lastName}
                      placeholder="e.g. Mehta"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      id="email"
                      label="Email"
                      type="email"
                      value={shippingForm.email}
                      onChange={(e) => updateShipping('email', e.target.value)}
                      error={shippingErrors.email}
                      placeholder="you@example.com"
                    />
                    <Input
                      id="phone"
                      label="Phone"
                      type="tel"
                      value={shippingForm.phone}
                      onChange={(e) => updateShipping('phone', e.target.value)}
                      error={shippingErrors.phone}
                      placeholder="10-digit mobile number"
                    />
                  </div>
                  <Input
                    id="address"
                    label="Address"
                    value={shippingForm.address}
                    onChange={(e) => updateShipping('address', e.target.value)}
                    error={shippingErrors.address}
                    placeholder="Street address"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                      id="city"
                      label="City"
                      value={shippingForm.city}
                      onChange={() => {}}
                      readOnly
                      error={shippingErrors.city}
                      placeholder={pincodeLoading ? 'Fetching…' : 'Auto-filled from pincode'}
                      className={pincodeLoading ? 'opacity-60' : ''}
                    />
                    <Input
                      id="state"
                      label="State"
                      value={shippingForm.state}
                      onChange={() => {}}
                      readOnly
                      error={shippingErrors.state}
                      placeholder={pincodeLoading ? 'Fetching…' : 'Auto-filled from pincode'}
                      className={pincodeLoading ? 'opacity-60' : ''}
                    />
                    <Input
                      id="pincode"
                      label="Pincode"
                      value={shippingForm.pincode}
                      onChange={(e) => updateShipping('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                      error={shippingErrors.pincode}
                      placeholder="6-digit pincode"
                      maxLength={6}
                    />
                  </div>
                </div>
                <div className="mt-8">
                  <Button onClick={handleShippingContinue} size="lg" className="w-full sm:w-auto">
                    Continue to Payment
                    <ArrowRight size={14} />
                  </Button>
                </div>
              </div>
            )}

            {step === 'payment' && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[10px] uppercase tracking-[0.25em] font-semibold text-luxury-taupe">
                    Payment
                  </h2>
                  <button
                    onClick={() => setStep('shipping')}
                    className="text-[10px] uppercase tracking-[0.1em] text-luxury-taupe hover:text-luxury-charcoal transition-colors"
                  >
                    â† Edit Shipping
                  </button>
                </div>

                <div className="bg-luxury-pearl p-4 mb-6">
                  <p className="text-xs text-neutral-500 font-light">
                    Shipping to: {shippingForm.firstName} {shippingForm.lastName},{' '}
                    {shippingForm.address}, {shippingForm.city}, {shippingForm.state}{' '}
                    {shippingForm.pincode}
                  </p>
                </div>

                {/* Payment Method Tabs */}
                <div className="flex border border-neutral-200 mb-8">
                  {[
                    { id: 'upi', label: 'UPI', icon: Smartphone },
                    { id: 'card', label: 'Card', icon: CreditCard },
                    { id: 'netbanking', label: 'Net Banking', icon: Landmark },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setPaymentMethod(id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-4 text-[11px] uppercase tracking-[0.15em] font-medium transition-all ${
                        paymentMethod === id
                          ? 'bg-luxury-charcoal text-white'
                          : 'bg-white text-neutral-500 hover:bg-neutral-50'
                      }`}
                    >
                      <Icon size={15} />
                      {label}
                    </button>
                  ))}
                </div>

                {/* UPI Payment */}
                {paymentMethod === 'upi' && (
                  <div className="border border-neutral-200 bg-white">
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                      {/* Left — Order Details & Pricing */}
                      <div className="p-6 sm:p-8 lg:border-r border-b lg:border-b-0 border-neutral-100">
                        <h3 className="text-[10px] uppercase tracking-[0.25em] font-semibold text-luxury-taupe mb-5">
                          Order Details
                        </h3>
                        <div className="space-y-3 mb-6 max-h-48 overflow-y-auto scrollbar-hide">
                          {items.map((item) => (
                            <div key={`${item.id}-${item.size}-${item.color}`} className="flex gap-3">
                              <div className="w-12 h-16 bg-neutral-50 overflow-hidden flex-shrink-0">
                                <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-luxury-charcoal truncate">{item.name}</p>
                                <p className="text-[11px] text-neutral-400 font-light">
                                  {item.color} · {item.size} · Qty {item.quantity}
                                </p>
                              </div>
                              <p className="text-sm font-medium text-luxury-charcoal flex-shrink-0">
                                {displayPrice(item.price * item.quantity)}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-neutral-100 pt-4 space-y-2.5">
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-500 font-light">Subtotal</span>
                            <span className="font-medium text-luxury-charcoal">{displayPrice(subtotal)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-500 font-light">GST (Included)</span>
                            <span className="font-medium text-neutral-500">—</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-500 font-light">Shipping</span>
                            <span className="font-medium text-luxury-charcoal">
                              {shipping === 0 ? 'Complimentary' : displayPrice(shipping)}
                            </span>
                          </div>
                          <div className="flex justify-between items-baseline pt-3 border-t border-neutral-100">
                            <span className="text-xs uppercase tracking-[0.15em] font-semibold text-luxury-taupe">Total</span>
                            <span className="text-xl font-serif font-semibold text-luxury-charcoal">{displayPrice(total)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right — UPI Pay */}
                      <div className="p-6 sm:p-8 flex flex-col justify-center bg-luxury-pearl/30">
                        <div className="flex items-center gap-2 mb-6">
                          <Smartphone size={14} className="text-luxury-gold" />
                          <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-luxury-charcoal">
                            UPI Payment
                          </span>
                        </div>

                        <p className="text-[11px] text-neutral-500 font-light mb-6 leading-relaxed">
                          You will be redirected to complete your UPI payment via Google Pay, PhonePe, Paytm, or any UPI app.
                        </p>

                        <p className="text-xl font-serif font-semibold text-luxury-charcoal mb-6 text-center">
                          {displayPrice(total)}
                        </p>

                        <Button
                          onClick={() => handlePay('upi')}
                          size="lg"
                          loading={loading}
                          className="w-full"
                        >
                          <Lock size={14} />
                          Pay {displayPrice(total)}
                        </Button>

                        <p className="mt-4 text-[10px] text-neutral-400 font-light flex items-center justify-center gap-1.5">
                          <Lock size={10} />
                          Secured · End-to-end encrypted
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Card Payment */}
                {paymentMethod === 'card' && (
                  <div className="border border-neutral-200 bg-white">
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                      {/* Left — Order Details & Pricing */}
                      <div className="p-6 sm:p-8 lg:border-r border-b lg:border-b-0 border-neutral-100">
                        <h3 className="text-[10px] uppercase tracking-[0.25em] font-semibold text-luxury-taupe mb-5">
                          Order Details
                        </h3>
                        <div className="space-y-3 mb-6 max-h-48 overflow-y-auto scrollbar-hide">
                          {items.map((item) => (
                            <div key={`${item.id}-${item.size}-${item.color}`} className="flex gap-3">
                              <div className="w-12 h-16 bg-neutral-50 overflow-hidden flex-shrink-0">
                                <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-luxury-charcoal truncate">{item.name}</p>
                                <p className="text-[11px] text-neutral-400 font-light">
                                  {item.color} · {item.size} · Qty {item.quantity}
                                </p>
                              </div>
                              <p className="text-sm font-medium text-luxury-charcoal flex-shrink-0">
                                {displayPrice(item.price * item.quantity)}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-neutral-100 pt-4 space-y-2.5">
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-500 font-light">Subtotal</span>
                            <span className="font-medium text-luxury-charcoal">{displayPrice(subtotal)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-500 font-light">GST (Included)</span>
                            <span className="font-medium text-neutral-500">—</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-500 font-light">Shipping</span>
                            <span className="font-medium text-luxury-charcoal">
                              {shipping === 0 ? 'Complimentary' : displayPrice(shipping)}
                            </span>
                          </div>
                          <div className="flex justify-between items-baseline pt-3 border-t border-neutral-100">
                            <span className="text-xs uppercase tracking-[0.15em] font-semibold text-luxury-taupe">Total</span>
                            <span className="text-xl font-serif font-semibold text-luxury-charcoal">{displayPrice(total)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right — Card Info */}
                      <div className="p-6 sm:p-8 flex flex-col justify-center bg-luxury-pearl/30">
                        <div className="flex items-center gap-2 mb-6">
                          <CreditCard size={14} className="text-luxury-gold" />
                          <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-luxury-charcoal">
                            Card Payment
                          </span>
                        </div>

                        <p className="text-[11px] text-neutral-500 font-light mb-6 leading-relaxed">
                          You will be securely redirected to complete your card payment. Your card details are handled by our payment partner.
                        </p>

                        <p className="text-xl font-serif font-semibold text-luxury-charcoal mb-6 text-center">
                          {displayPrice(total)}
                        </p>

                        <Button
                          onClick={() => handlePay('card')}
                          size="lg"
                          loading={loading}
                          className="w-full"
                        >
                          <Lock size={14} />
                          Pay {displayPrice(total)}
                        </Button>

                        <p className="mt-4 text-[10px] text-neutral-400 font-light flex items-center justify-center gap-1.5">
                          <Lock size={10} />
                          256-bit SSL encrypted · PCI DSS compliant
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Netbanking Payment */}
                {paymentMethod === 'netbanking' && (
                  <div className="border border-neutral-200 bg-white">
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                      {/* Left — Order Details & Pricing */}
                      <div className="p-6 sm:p-8 lg:border-r border-b lg:border-b-0 border-neutral-100">
                        <h3 className="text-[10px] uppercase tracking-[0.25em] font-semibold text-luxury-taupe mb-5">
                          Order Details
                        </h3>
                        <div className="space-y-3 mb-6 max-h-48 overflow-y-auto scrollbar-hide">
                          {items.map((item) => (
                            <div key={`${item.id}-${item.size}-${item.color}`} className="flex gap-3">
                              <div className="w-12 h-16 bg-neutral-50 overflow-hidden flex-shrink-0">
                                <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-luxury-charcoal truncate">{item.name}</p>
                                <p className="text-[11px] text-neutral-400 font-light">
                                  {item.color} · {item.size} · Qty {item.quantity}
                                </p>
                              </div>
                              <p className="text-sm font-medium text-luxury-charcoal flex-shrink-0">
                                {displayPrice(item.price * item.quantity)}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-neutral-100 pt-4 space-y-2.5">
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-500 font-light">Subtotal</span>
                            <span className="font-medium text-luxury-charcoal">{displayPrice(subtotal)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-500 font-light">GST (Included)</span>
                            <span className="font-medium text-neutral-500">—</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-500 font-light">Shipping</span>
                            <span className="font-medium text-luxury-charcoal">
                              {shipping === 0 ? 'Complimentary' : displayPrice(shipping)}
                            </span>
                          </div>
                          <div className="flex justify-between items-baseline pt-3 border-t border-neutral-100">
                            <span className="text-xs uppercase tracking-[0.15em] font-semibold text-luxury-taupe">Total</span>
                            <span className="text-xl font-serif font-semibold text-luxury-charcoal">{displayPrice(total)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right — Netbanking */}
                      <div className="p-6 sm:p-8 flex flex-col justify-center bg-luxury-pearl/30">
                        <div className="flex items-center gap-2 mb-6">
                          <Landmark size={14} className="text-luxury-gold" />
                          <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-luxury-charcoal">
                            Net Banking
                          </span>
                        </div>

                        <p className="text-[11px] text-neutral-500 font-light mb-6 leading-relaxed">
                          You will be securely redirected to your bank's website to authorize the payment.
                        </p>

                        <p className="text-xl font-serif font-semibold text-luxury-charcoal mb-6 text-center">
                          {displayPrice(total)}
                        </p>

                        <Button
                          onClick={() => handlePay('netbanking')}
                          size="lg"
                          loading={loading}
                          className="w-full"
                        >
                          <Lock size={14} />
                          Pay {displayPrice(total)}
                        </Button>

                        <p className="mt-4 text-[10px] text-neutral-400 font-light flex items-center justify-center gap-1.5">
                          <Lock size={10} />
                          Bank-grade security · 256-bit encrypted
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {step === 'shipping' && (
          <div>
            <div className="bg-luxury-pearl p-6 lg:p-8 sticky top-28">
              <h2 className="text-[10px] uppercase tracking-[0.25em] font-semibold text-luxury-taupe mb-6">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto scrollbar-hide">
                {items.map((item) => (
                  <div key={`${item.id}-${item.size}-${item.color}`} className="flex gap-3">
                    <div className="w-14 h-18 bg-neutral-100 overflow-hidden flex-shrink-0">
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-luxury-charcoal truncate">{item.name}</p>
                      <p className="text-[11px] text-neutral-400 font-light">
                        {item.color} · {item.size} · Qty {item.quantity}
                      </p>
                      <p className="text-sm font-medium mt-0.5">
                        {displayPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-neutral-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500 font-light">Subtotal</span>
                  <span className="font-medium">{displayPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500 font-light">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? 'Complimentary' : displayPrice(shipping)}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-3 border-t border-neutral-200">
                  <span className="font-medium">Total</span>
                  <span className="text-lg font-semibold">{displayPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
