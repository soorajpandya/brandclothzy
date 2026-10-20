import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, ShoppingBag, Heart, Package, Store, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSeller } from '../context/SellerContext';
import { useMarketplace } from '../context/MarketplaceContext';
import { displayPrice } from '../utils/helpers';
import Button from '../components/Button';
import SEO from '../components/SEO';

export default function Account() {
  const { user, signInWithGoogle, logout, loading } = useAuth();
  const { sellerProfile, sellerLoading } = useSeller();
  const { fetchUserOrders, isAdmin } = useMarketplace();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    if (user) {
      fetchUserOrders(user.uid).then(data => {
        setOrders(data);
        setOrdersLoading(false);
      });
    }
  }, [user, fetchUserOrders]);

  const handleGoogleLogin = async () => {
    const result = await signInWithGoogle();
    if (result.success) {
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'CompleteRegistration');
      }
      navigate('/');
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
      <div className="pt-32 pb-20">
        <SEO title="Sign In" path="/account" description="Sign in to your BrandClothzy account to track orders, manage your wishlist and enjoy personalised shopping." noindex />
        <div className="max-w-md mx-auto px-4 text-center">
          <h1 className="font-serif text-3xl sm:text-4xl text-luxury-charcoal mb-3">Welcome</h1>
          <p className="text-sm text-neutral-400 font-light mb-10 leading-relaxed">
            Sign in to track your orders, save your wishlist, and enjoy a personalised shopping experience.
          </p>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-6 border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors text-sm font-medium text-luxury-charcoal"
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

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-4 text-neutral-400 uppercase tracking-[0.15em]">or</span>
            </div>
          </div>

          <Link to="/shop">
            <Button variant="outline" size="lg" className="w-full">
              Continue Shopping as Guest
            </Button>
          </Link>

          <p className="mt-8 text-[11px] text-neutral-400 font-light leading-relaxed">
            By signing in, you agree to our{' '}
            <Link to="/terms" className="underline hover:text-luxury-charcoal">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="underline hover:text-luxury-charcoal">
              Privacy Policy
            </Link>
            .
          </p>
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
                  <span className="text-sm font-medium text-luxury-charcoal block">Dashboard</span>
                  <span className="text-[10px] text-neutral-400 capitalize">{sellerProfile.status?.replace(/_/g, ' ')}</span>
                </div>
              </Link>
            ) : (
              <Link to="/dashboard#seller-apply"
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
