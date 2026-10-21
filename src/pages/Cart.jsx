import { Link } from 'react-router-dom';
import { Minus, Plus, X, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { displayPrice } from '../utils/helpers';
import Button from '../components/Button';
import SEO from '../components/SEO';

export default function Cart() {
  const {
    items,
    removeItem,
    updateQuantity,
    itemCount,
    subtotal,
    shipping,
    total,
    shippingOption,
    setShippingOption,
    shippingTiers,
    visibleSubtotal,
  } = useCart();

  if (items.length === 0) {
    return (
      <div className="pt-32 pb-20 text-center max-w-md mx-auto px-4">
        <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-luxury-pearl rounded-full">
          <ShoppingBag size={28} className="text-luxury-taupe" />
        </div>
        <h1 className="font-serif text-3xl text-luxury-charcoal mb-3">Your Bag is Empty</h1>
        <p className="text-sm text-neutral-400 font-light mb-8 leading-relaxed">
          Discover our curated collection of luxury pieces crafted for the extraordinary.
        </p>
        <Link to="/shop">
          <Button size="lg">
            Continue Shopping
            <ArrowRight size={14} />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-24 lg:pt-28 pb-16">
      <SEO
        title="Shopping Bag"
        path="/cart"
        description="Review your BrandClothzy shopping bag. Premium Indian fashion with free shipping on orders above ₹999."
        noindex
      />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="text-center mb-12">
          <h1 className="font-serif text-3xl sm:text-4xl text-luxury-charcoal mb-2">Shopping Bag</h1>
          <p className="text-sm text-neutral-400 font-light">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
          <div className="lg:col-span-2">
            <div className="border-b border-neutral-100 pb-3 mb-6 hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-8 items-center">
              <span className="text-[10px] uppercase tracking-[0.2em] text-luxury-taupe">Product</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-luxury-taupe w-28 text-center">Quantity</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-luxury-taupe w-24 text-right">Total</span>
              <span className="w-8" />
            </div>

            <div className="space-y-6">
              {items.map((item) => (
                <div
                  key={`${item.id}-${item.size}-${item.color}`}
                  className="flex gap-4 sm:gap-6 pb-6 border-b border-neutral-100"
                >
                  <Link to={`/product/${item.id}`} className="flex-shrink-0">
                    <div className="w-24 h-32 sm:w-28 sm:h-36 bg-neutral-50 overflow-hidden">
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  </Link>

                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <Link to={`/product/${item.id}`}>
                        <h3 className="text-sm font-medium text-luxury-charcoal hover:text-luxury-gold transition-colors">
                          {item.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-neutral-400 mt-1 font-light">
                        {item.color} · Size {item.size}
                      </p>
                      <p className="text-sm font-medium mt-1 sm:hidden">{displayPrice(item.price)}</p>
                    </div>

                    <div className="inline-flex items-center border border-neutral-200 w-fit sm:w-28 justify-center">
                      <button
                        onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-neutral-50 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 h-8 flex items-center justify-center text-xs border-x border-neutral-200">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-neutral-50 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <p className="text-sm font-medium hidden sm:block w-24 text-right">
                      {displayPrice(item.price * item.quantity)}
                    </p>

                    <button
                      onClick={() => removeItem(item.id, item.size, item.color)}
                      className="self-start sm:self-auto p-1 text-neutral-300 hover:text-luxury-charcoal transition-colors"
                      aria-label={`Remove ${item.name}`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-luxury-charcoal hover:text-luxury-gold transition-colors"
              >
                <ArrowRight size={14} className="rotate-180" />
                Continue Shopping
              </Link>
            </div>
          </div>

          <div>
            <div className="bg-luxury-pearl p-6 lg:p-8 sticky top-28">
              <h2 className="text-[10px] uppercase tracking-[0.25em] font-semibold text-luxury-taupe mb-6">
                Order Summary
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500 font-light">Subtotal</span>
                  <span className="font-medium">{displayPrice(subtotal)}</span>
                </div>

                {/* Delivery Options Selector */}
                <div className="pt-2 pb-1">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-luxury-taupe block mb-2.5">
                    Select Delivery Method
                  </label>
                  <div className="space-y-2">
                    {shippingTiers.map((tier) => {
                      const isFree = tier.id === 'standard' && visibleSubtotal >= 999;
                      const isSelected = shippingOption === tier.id;
                      return (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => setShippingOption(tier.id)}
                          className={`w-full text-left p-3 border transition-all text-xs flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'border-luxury-charcoal bg-white shadow-sm'
                              : 'border-neutral-200/80 bg-white/50 hover:border-neutral-400'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                isSelected ? 'border-luxury-charcoal' : 'border-neutral-300'
                              }`}
                            >
                              {isSelected && <span className="w-2 h-2 rounded-full bg-luxury-charcoal" />}
                            </span>
                            <div>
                              <p className="font-medium text-luxury-charcoal">{tier.title}</p>
                              <p className="text-[11px] text-neutral-400 font-light">{tier.timeline}</p>
                            </div>
                          </div>
                          <span className={`font-medium flex-shrink-0 ${isFree ? 'text-emerald-600' : 'text-luxury-charcoal'}`}>
                            {isFree ? 'Free' : `₹${tier.price}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-between text-sm pt-2">
                  <span className="text-neutral-500 font-light">Shipping</span>
                  <span className={`font-medium ${shipping === 0 ? 'text-emerald-600' : ''}`}>
                    {shipping === 0 ? 'Complimentary' : displayPrice(shipping)}
                  </span>
                </div>

                {visibleSubtotal >= 999 ? (
                  <p className="text-[11px] text-emerald-700 font-light">
                    ✓ Qualified for Free Standard Shipping (orders above ₹999)
                  </p>
                ) : (
                  <p className="text-[11px] text-luxury-gold font-light">
                    Free Standard Shipping on orders above ₹999
                  </p>
                )}
              </div>

              <div className="border-t border-neutral-200 pt-4 mb-8">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Total</span>
                  <span className="text-lg font-semibold">{displayPrice(total)}</span>
                </div>
                <p className="text-[11px] text-neutral-400 font-light mt-1">Including all taxes</p>
              </div>

              <Link to="/checkout" className="block">
                <Button className="w-full" size="lg">
                  Proceed to Checkout
                </Button>
              </Link>

              <div className="mt-6 text-center">
                <p className="text-[10px] text-neutral-400 font-light">
                  Secure checkout · Free returns · Authenticity guaranteed
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
