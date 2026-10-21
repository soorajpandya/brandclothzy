import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Lock, ArrowRight, Smartphone, CreditCard, Landmark, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import { useMarketplace } from '../context/MarketplaceContext';
import { displayPrice, validateEmail, validatePhone, validatePincode, validateRequired } from '../utils/helpers';
import Input from '../components/Input';
import Button from '../components/Button';
import SEO from '../components/SEO';
import { triggerEmail } from '../utils/mailer';

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY;

export default function Checkout() {
  const {
    items,
    subtotal,
    shipping,
    total,
    clearCart,
    shippingOption,
    setShippingOption,
    shippingTiers,
    visibleSubtotal,
  } = useCart();
  const { addToast } = useUI();
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, logout } = useAuth();
  const { createOrder } = useMarketplace();
  const [step, setStep] = useState(user ? 'shipping' : 'identify');
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [generatedOrderId, setGeneratedOrderId] = useState('');

  // Auth form state for unauthenticated checkout
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

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

  // Sync checkout step with user authentication state.
  // If user logs out anywhere (Navbar or Checkout), immediately redirect to Sign In / Create Account ('identify')
  useEffect(() => {
    if (user) {
      const nameParts = (user.name || '').split(' ');
      setShippingForm((prev) => ({
        ...prev,
        firstName: prev.firstName || nameParts[0] || '',
        lastName: prev.lastName || nameParts.slice(1).join(' ') || '',
        email: prev.email || user.email || '',
      }));
      setStep((prev) => (prev === 'payment' ? 'payment' : 'shipping'));
    } else {
      setStep('identify');
    }
  }, [user]);

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
    setAuthError('');
    const result = await signInWithGoogle();
    if (result.success) {
      setStep('shipping');
    } else if (result.error) {
      setAuthError(result.error);
    }
  };

  const handleEmailAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (authMode === 'forgot') {
      if (!validateEmail(authForm.email)) {
        setAuthError('Please enter a valid email address.');
        return;
      }
      setAuthSubmitting(true);
      const res = await resetPassword(authForm.email.trim());
      setAuthSubmitting(false);
      if (res.success) {
        setAuthSuccess('Password reset link sent to your email.');
      } else {
        setAuthError(res.error || 'Failed to send reset email.');
      }
      return;
    }

    if (authMode === 'signup') {
      if (!authForm.name.trim()) {
        setAuthError('Please enter your full name.');
        return;
      }
      if (!validateEmail(authForm.email)) {
        setAuthError('Please enter a valid email address.');
        return;
      }
      if (!authForm.password || authForm.password.length < 6) {
        setAuthError('Password must be at least 6 characters.');
        return;
      }
      setAuthSubmitting(true);
      const res = await signUpWithEmail(authForm.email.trim(), authForm.password, authForm.name.trim());
      setAuthSubmitting(false);
      if (!res.success) {
        setAuthError(res.error || 'Unable to create account. Please try again.');
      } else {
        setStep('shipping');
      }
      return;
    }

    // Login mode
    if (!validateEmail(authForm.email)) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    if (!authForm.password) {
      setAuthError('Please enter your password.');
      return;
    }
    setAuthSubmitting(true);
    const res = await signInWithEmail(authForm.email.trim(), authForm.password);
    setAuthSubmitting(false);
    if (!res.success) {
      setAuthError(res.error || 'Invalid email or password.');
    } else {
      setStep('shipping');
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
      if (!RAZORPAY_KEY) {
        throw new Error('Razorpay Key not found in environment (VITE_RAZORPAY_KEY). Please verify .env');
      }
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

          // Trigger automated order confirmation email (Non-blocking)
          triggerEmail({
            to: shippingForm.email,
            type: 'order_confirmed',
            name: `${shippingForm.firstName} ${shippingForm.lastName}`,
            data: {
              orderId: paymentId,
              total: Math.round(total * 1.4),
            },
          });
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
    } catch (err) {
      console.error('Payment error:', err);
      addToast(err?.message || 'Unable to initiate payment. Please try again.', 'error');
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
      <div className="pt-28 pb-20 bg-luxury-pearl/20 min-h-screen">
        <SEO
          title={authMode === 'signup' ? 'Create Account — Checkout' : 'Sign In — Checkout'}
          path="/checkout"
          description="Sign in or create your BrandClothzy account to complete your purchase securely."
          noindex
        />
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white border border-neutral-200/80 p-8 sm:p-10 shadow-sm">
            {/* Header */}
            <div className="text-center mb-6">
              <span className="text-[10px] tracking-[0.3em] uppercase text-luxury-gold font-medium block mb-2">
                BrandClothzy Maison
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl text-luxury-charcoal mb-2">
                {authMode === 'signup'
                  ? 'Create Your Account'
                  : authMode === 'forgot'
                  ? 'Reset Password'
                  : 'Sign In to Checkout'}
              </h1>
              <p className="text-xs text-neutral-400 font-light leading-relaxed">
                {authMode === 'signup'
                  ? 'Create an account to complete your order, track delivery, and receive updates.'
                  : authMode === 'forgot'
                  ? 'Enter your registered email and we will send you a link to reset your password.'
                  : 'Sign in to access saved addresses and complete your purchase securely.'}
              </p>
            </div>

            {/* Quick 1-Click Google Sign In */}
            <div className="mb-6">
              <button
                type="button"
                onClick={handleGoogleCheckout}
                className="w-full flex items-center justify-center gap-3 py-3 px-6 border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors text-xs uppercase tracking-[0.15em] font-medium text-luxury-charcoal shadow-sm"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex py-2 items-center mb-6">
              <div className="flex-grow border-t border-neutral-200"></div>
              <span className="flex-shrink mx-4 text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                Or with Email
              </span>
              <div className="flex-grow border-t border-neutral-200"></div>
            </div>

            {/* Tabs for Login / Sign Up */}
            {authMode !== 'forgot' && (
              <div className="grid grid-cols-2 border-b border-neutral-100 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  className={`pb-3 text-xs uppercase tracking-[0.18em] font-medium transition-colors border-b-2 -mb-[1px] ${
                    authMode === 'login'
                      ? 'border-luxury-charcoal text-luxury-charcoal'
                      : 'border-transparent text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  className={`pb-3 text-xs uppercase tracking-[0.18em] font-medium transition-colors border-b-2 -mb-[1px] ${
                    authMode === 'signup'
                      ? 'border-luxury-charcoal text-luxury-charcoal'
                      : 'border-transparent text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  Create Account
                </button>
              </div>
            )}

            {/* Status alerts */}
            {authError && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-xs flex items-start gap-2.5">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5 text-red-500" />
                <span className="leading-relaxed">{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2.5">
                <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5 text-emerald-600" />
                <span className="leading-relaxed">{authSuccess}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleEmailAuthSubmit} className="space-y-4">
              {authMode === 'signup' && (
                <Input
                  id="checkout-name"
                  label="Full Name"
                  value={authForm.name}
                  onChange={(e) => setAuthForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Arjun Mehta"
                  required
                />
              )}

              <Input
                id="checkout-email"
                label="Email Address"
                type="email"
                value={authForm.email}
                onChange={(e) => setAuthForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="you@example.com"
                required
              />

              {authMode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-medium text-luxury-taupe">
                      Password
                    </label>
                    {authMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('forgot');
                          setAuthError('');
                          setAuthSuccess('');
                        }}
                        className="text-[10px] text-luxury-gold hover:underline"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <input
                    id="checkout-password"
                    type="password"
                    value={authForm.password}
                    onChange={(e) => setAuthForm((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder={authMode === 'signup' ? 'At least 6 characters' : 'Enter password'}
                    required
                    className="w-full px-4 py-3 text-sm bg-white border border-neutral-200 text-luxury-charcoal placeholder:text-neutral-400 outline-none focus:border-luxury-gold transition-colors"
                  />
                </div>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full justify-center"
                  disabled={authSubmitting}
                >
                  {authSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Please wait...
                    </span>
                  ) : authMode === 'signup' ? (
                    'Create Account & Continue'
                  ) : authMode === 'forgot' ? (
                    'Send Password Reset Link'
                  ) : (
                    'Sign In & Continue'
                  )}
                </Button>
              </div>

              {authMode === 'forgot' && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setAuthError('');
                      setAuthSuccess('');
                    }}
                    className="text-xs text-neutral-500 hover:text-luxury-charcoal"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              )}
            </form>

            <p className="mt-6 text-center text-[10px] text-neutral-400 font-light leading-relaxed">
              By continuing, you agree to BrandClothzy{' '}
              <Link
                to="/terms"
                onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}
                className="underline hover:text-luxury-charcoal"
              >
                Terms
              </Link>{' '}
              &amp;{' '}
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

        <div className={`grid grid-cols-1 ${step !== 'payment' ? 'lg:grid-cols-3' : ''} gap-12 lg:gap-16`}>
          <div className={step !== 'payment' ? 'lg:col-span-2' : ''}>
            {step !== 'payment' && (
              <div className="animate-fade-in">
                {/* Signed In User Banner */}
                {user && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 mb-6 bg-luxury-pearl border border-neutral-200/80 text-xs">
                    <div className="flex items-center gap-2 text-neutral-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Signed in as <strong className="text-luxury-charcoal font-medium">{user.email || user.name || 'Customer'}</strong></span>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await logout();
                        addToast('Logged out. Please sign in or create an account to continue.', 'info');
                      }}
                      className="text-luxury-gold hover:underline font-medium text-left sm:text-right text-[11px] tracking-wider uppercase"
                    >
                      Sign Out / Switch Account →
                    </button>
                  </div>
                )}

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

                  {/* Delivery Method Selection */}
                  <div className="pt-6 border-t border-neutral-100">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-luxury-taupe block mb-3">
                      Select Delivery Method
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {shippingTiers.map((tier) => {
                        const isFree = tier.id === 'standard' && visibleSubtotal >= 999;
                        const isSelected = shippingOption === tier.id;
                        return (
                          <button
                            key={tier.id}
                            type="button"
                            onClick={() => setShippingOption(tier.id)}
                            className={`p-3.5 border text-left transition-all flex flex-col justify-between ${
                              isSelected
                                ? 'border-luxury-charcoal bg-white shadow-sm ring-1 ring-luxury-charcoal/20'
                                : 'border-neutral-200/80 bg-luxury-pearl/30 hover:border-neutral-300'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full mb-1.5">
                              <span className="font-medium text-xs text-luxury-charcoal">{tier.title}</span>
                              <span className={`text-xs font-semibold ${isFree ? 'text-emerald-600' : 'text-luxury-charcoal'}`}>
                                {isFree ? 'Free' : `₹${tier.price}`}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-400 font-light leading-relaxed">{tier.timeline}</p>
                          </button>
                        );
                      })}
                    </div>
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

          {step !== 'payment' && (
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
                  <span className={`font-medium ${shipping === 0 ? 'text-emerald-600' : ''}`}>
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
