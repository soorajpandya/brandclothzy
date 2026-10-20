import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LogOut,
  ShoppingBag,
  Heart,
  Package,
  Store,
  Shield,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSeller } from '../context/SellerContext';
import { useMarketplace } from '../context/MarketplaceContext';
import { displayPrice } from '../utils/helpers';
import Button from '../components/Button';
import Input from '../components/Input';
import SEO from '../components/SEO';

export default function Account() {
  const {
    user,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    resetPassword,
    logout,
    loading,
  } = useAuth();
  const { sellerProfile } = useSeller();
  const { fetchUserOrders, isAdmin } = useMarketplace();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  // Auth form states
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserOrders(user.uid).then((data) => {
        setOrders(data);
        setOrdersLoading(false);
      });
    }
  }, [user, fetchUserOrders]);

  const handleGoogleLogin = async () => {
    setAuthError('');
    setAuthSuccess('');
    const result = await signInWithGoogle();
    if (result.success) {
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'CompleteRegistration');
      }
      navigate('/');
    } else if (result.error) {
      setAuthError(result.error);
    }
  };

  const handleAuthChange = (field, value) => {
    setAuthForm((prev) => ({ ...prev, [field]: value }));
    if (authError) setAuthError('');
    if (authSuccess) setAuthSuccess('');
  };

  const handleEmailAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (authMode === 'forgot') {
      if (!authForm.email.trim()) {
        setAuthError('Please enter your email address.');
        return;
      }
      setAuthSubmitting(true);
      const res = await resetPassword(authForm.email.trim());
      setAuthSubmitting(false);
      if (res.success) {
        setAuthSuccess('Password reset link sent to your email. Please check your inbox.');
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
      if (!authForm.email.trim()) {
        setAuthError('Please enter your email address.');
        return;
      }
      if (authForm.password.length < 6) {
        setAuthError('Password must be at least 6 characters long.');
        return;
      }
      if (authForm.password !== authForm.confirmPassword) {
        setAuthError('Passwords do not match.');
        return;
      }

      setAuthSubmitting(true);
      const res = await signUpWithEmail(
        authForm.email.trim(),
        authForm.password,
        authForm.name.trim()
      );
      setAuthSubmitting(false);
      if (res.success) {
        if (typeof window.fbq === 'function') {
          window.fbq('track', 'CompleteRegistration');
        }
      } else {
        setAuthError(res.error || 'Could not create account. Please try again.');
      }
      return;
    }

    // Sign in mode
    if (!authForm.email.trim() || !authForm.password) {
      setAuthError('Please enter both email and password.');
      return;
    }

    setAuthSubmitting(true);
    const res = await signInWithEmail(authForm.email.trim(), authForm.password);
    setAuthSubmitting(false);
    if (!res.success) {
      setAuthError(res.error || 'Invalid email or password.');
    }
  };

  if (loading) {
    return (
      <div className="pt-32 pb-20 text-center">
        <div className="w-10 h-10 mx-auto border-2 border-luxury-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-28 pb-20 bg-luxury-pearl/20 min-h-screen">
        <SEO
          title={authMode === 'signup' ? 'Create Account' : 'Sign In'}
          path="/account"
          description="Sign in or create your BrandClothzy account to access your wishlist, track orders, and experience luxury fashion."
          noindex
        />
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white border border-neutral-200/80 p-8 sm:p-10 shadow-sm">
            {/* Header */}
            <div className="text-center mb-8">
              <span className="text-[10px] tracking-[0.3em] uppercase text-luxury-gold font-medium block mb-2">
                BrandClothzy Maison
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl text-luxury-charcoal mb-2">
                {authMode === 'signup'
                  ? 'Create Your Account'
                  : authMode === 'forgot'
                  ? 'Reset Password'
                  : 'Welcome Back'}
              </h1>
              <p className="text-xs text-neutral-400 font-light leading-relaxed">
                {authMode === 'signup'
                  ? 'Join our private luxury circle for exclusive collections and instant order tracking.'
                  : authMode === 'forgot'
                  ? 'Enter your registered email and we will send you a link to reset your password.'
                  : 'Sign in to access your orders, saved pieces, and personalized concierge.'}
              </p>
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
              <div className="mb-6 p-3.5 bg-red-50/80 border border-red-200 text-red-600 text-xs flex items-start gap-2.5">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-red-500" />
                <span className="leading-relaxed">{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="mb-6 p-3.5 bg-emerald-50/80 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2.5">
                <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5 text-emerald-600" />
                <span className="leading-relaxed">{authSuccess}</span>
              </div>
            )}

            {/* Email / Password Form */}
            <form onSubmit={handleEmailAuthSubmit} className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-medium text-luxury-taupe mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={authForm.name}
                      onChange={(e) => handleAuthChange('name', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-sm border border-neutral-200 bg-white focus:border-luxury-charcoal outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] font-medium text-luxury-taupe mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={authForm.email}
                    onChange={(e) => handleAuthChange('email', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-sm border border-neutral-200 bg-white focus:border-luxury-charcoal outline-none transition-colors"
                  />
                </div>
              </div>

              {authMode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-medium text-luxury-taupe">
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
                        className="text-[11px] text-neutral-400 hover:text-luxury-charcoal transition-colors underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={authForm.password}
                      onChange={(e) => handleAuthChange('password', e.target.value)}
                      className="w-full pl-10 pr-10 py-3 text-sm border border-neutral-200 bg-white focus:border-luxury-charcoal outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {authMode === 'signup' && (
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-medium text-luxury-taupe mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={authForm.confirmPassword}
                      onChange={(e) => handleAuthChange('confirmPassword', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-sm border border-neutral-200 bg-white focus:border-luxury-charcoal outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={authSubmitting}
                className="w-full mt-2"
              >
                {authSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : authMode === 'signup' ? (
                  'Create Account'
                ) : authMode === 'forgot' ? (
                  'Send Reset Link'
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {authMode === 'forgot' ? (
              <div className="text-center mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  className="text-xs text-neutral-500 hover:text-luxury-charcoal underline"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <>
                {/* Divider */}
                <div className="relative my-7">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-200" />
                  </div>
                  <div className="relative flex justify-center text-[10px]">
                    <span className="bg-white px-3 text-neutral-400 uppercase tracking-[0.2em]">
                      or continue with
                    </span>
                  </div>
                </div>

                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-3 py-3 px-6 border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors text-xs font-medium text-luxury-charcoal uppercase tracking-[0.1em]"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </button>
              </>
            )}

            <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
              <Link
                to="/shop"
                className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-luxury-charcoal transition-colors tracking-wide"
              >
                <span>Continue Shopping as Guest</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <p className="mt-6 text-[10px] text-center text-neutral-400 font-light leading-relaxed">
              By proceeding, you agree to BrandClothzy&apos;s{' '}
              <Link
                to="/terms"
                onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}
                className="underline hover:text-luxury-charcoal"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                to="/privacy"
                onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}
                className="underline hover:text-luxury-charcoal"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20">
      <SEO title="My Account" path="/account" description="Manage your BrandClothzy account, track orders, and view your wishlist." noindex />
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-12">
          {user.photo ? (
            <img
              src={user.photo}
              alt={user.name}
              className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-luxury-pearl"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-luxury-pearl flex items-center justify-center text-2xl font-serif text-luxury-charcoal">
              {user.name?.charAt(0) || 'U'}
            </div>
          )}
          <h1 className="font-serif text-3xl text-luxury-charcoal mb-1">{user.name}</h1>
          <p className="text-sm text-neutral-400 font-light">{user.email}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {[
            { to: '/wishlist', icon: Heart, label: 'Wishlist' },
            { to: '/cart', icon: ShoppingBag, label: 'Shopping Bag' },
            { to: '/shop', icon: Package, label: 'Shop Now' },
          ].map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 p-5 border border-neutral-200 hover:border-luxury-gold transition-colors"
            >
              <Icon size={18} className="text-luxury-gold" />
              <span className="text-sm font-medium text-luxury-charcoal">{label}</span>
            </Link>
          ))}
        </div>

        {/* Order History */}
        <div className="mb-12">
          <h2 className="text-[10px] uppercase tracking-[0.2em] font-medium text-luxury-taupe mb-4">Order History</h2>
          {ordersLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 mx-auto border-2 border-luxury-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 border border-neutral-200">
              <Package size={24} className="mx-auto mb-2 text-neutral-300" />
              <p className="text-sm text-neutral-400 font-light">No orders yet</p>
              <Link to="/shop" className="text-xs text-luxury-gold hover:underline mt-1 inline-block">Start Shopping</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} className="border border-neutral-200">
                  <button
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors text-left"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-medium text-luxury-charcoal">Order #{order.id?.slice(-8)}</span>
                        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 ${
                          order.status === 'delivered' ? 'bg-green-50 text-green-600' :
                          order.status === 'shipped' ? 'bg-blue-50 text-blue-600' :
                          order.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>{order.status || 'pending'}</span>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-neutral-400">
                        <span>{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span>{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}</span>
                        <span className="font-medium text-luxury-charcoal">{displayPrice(order.total)}</span>
                      </div>
                    </div>
                    {expandedOrder === order.id ? <ChevronUp size={16} className="text-neutral-400" /> : <ChevronDown size={16} className="text-neutral-400" />}
                  </button>

                  {expandedOrder === order.id && (
                    <div className="border-t border-neutral-100 p-4 space-y-3">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          {(item.image || item.images?.[0]) && (
                            <img src={item.image || item.images[0]} alt={item.name} className="w-12 h-12 object-cover border border-neutral-100" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-luxury-charcoal truncate">{item.name}</p>
                            <p className="text-[11px] text-neutral-400">
                              {item.size && `Size: ${item.size}`}{item.size && item.color && ' · '}{item.color && `Color: ${item.color}`}
                              {' · '}Qty: {item.quantity || 1}
                            </p>
                          </div>
                          <span className="text-sm text-luxury-charcoal">{displayPrice(item.price)}</span>
                        </div>
                      ))}
                      {order.shipping_address && (
                        <div className="pt-3 border-t border-neutral-100">
                          <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-1">Shipping Address</p>
                          <p className="text-xs text-neutral-500 leading-relaxed">
                            {order.shipping_address.address}, {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.pincode}
                          </p>
                        </div>
                      )}
                      {order.payment_id && (
                        <p className="text-[10px] text-neutral-400">Payment ID: {order.payment_id}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Seller Section */}
        <div className="mb-12">
          <h2 className="text-[10px] uppercase tracking-[0.2em] font-medium text-luxury-taupe mb-4">Seller</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sellerProfile ? (
              <Link to="/dashboard#seller-dashboard"
                className="flex items-center gap-3 p-5 border border-neutral-200 hover:border-luxury-gold transition-colors">
                <Store size={18} className="text-luxury-gold" />
                <div>
                  <span className="text-sm font-medium text-luxury-charcoal block">Seller Dashboard</span>
                  <span className="text-[10px] text-neutral-400 capitalize">{sellerProfile.status?.replace(/_/g, ' ')}</span>
                </div>
              </Link>
            ) : (
              <Link to="/seller/apply"
                className="flex items-center gap-3 p-5 border border-neutral-200 hover:border-luxury-gold transition-colors">
                <Store size={18} className="text-luxury-gold" />
                <div>
                  <span className="text-sm font-medium text-luxury-charcoal block">Sell on BrandClothzy</span>
                  <span className="text-[10px] text-neutral-400">Apply to become a seller</span>
                </div>
              </Link>
            )}
            {isAdmin() && (
              <Link to="/dashboard#admin-dashboard"
                className="flex items-center gap-3 p-5 border border-neutral-200 hover:border-luxury-gold transition-colors">
                <Shield size={18} className="text-luxury-gold" />
                <div>
                  <span className="text-sm font-medium text-luxury-charcoal block">Admin Panel</span>
                  <span className="text-[10px] text-neutral-400">Manage marketplace</span>
                </div>
              </Link>
            )}
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-luxury-charcoal transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
