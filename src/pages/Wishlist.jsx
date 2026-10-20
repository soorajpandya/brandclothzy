import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Heart, X, ShoppingBag } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import { displayPrice } from '../utils/helpers';
import Button from '../components/Button';
import SEO from '../components/SEO';

export default function Wishlist() {
  const { items, removeItem, clearWishlist } = useWishlist();
  const { addItem } = useCart();
  const { addToast } = useUI();

  const handleAddToBag = (product) => {
    addItem(product, product.sizes[0], product.colors[0]);
    addToast(`${product.name} added to your bag`, 'success');
  };

  if (items.length === 0) {
    return (
      <div className="pt-24 lg:pt-28 pb-20">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <nav className="flex items-center gap-2 py-4 text-[11px] text-neutral-400">
            <Link to="/" className="hover:text-luxury-charcoal transition-colors">Home</Link>
            <ChevronRight size={11} />
            <span className="text-luxury-charcoal">Wishlist</span>
          </nav>
          <div className="text-center py-20">
            <div className="w-20 h-20 border-2 border-neutral-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart size={32} className="text-neutral-300" />
            </div>
            <h1 className="font-serif text-3xl text-luxury-charcoal mb-3">Your Wishlist is Empty</h1>
            <p className="text-sm text-neutral-500 font-light mb-8 max-w-sm mx-auto">
              Save your favourite pieces here. Explore our collections to find something you love.
            </p>
            <Link to="/shop">
              <Button variant="outline" size="lg">Explore Collections</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 lg:pt-28 pb-20">
      <SEO
        title="Your Wishlist"
        path="/wishlist"
        description="Your saved BrandClothzy favourites. Premium men's and women's fashion curated just for you."
        noindex
      />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <nav className="flex items-center gap-2 py-4 text-[11px] text-neutral-400">
          <Link to="/" className="hover:text-luxury-charcoal transition-colors">Home</Link>
          <ChevronRight size={11} />
          <span className="text-luxury-charcoal">Wishlist</span>
        </nav>

        <div className="flex items-end justify-between mt-8 mb-10">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-luxury-taupe mb-2">Your Wishlist</p>
            <h1 className="font-serif text-3xl sm:text-4xl text-luxury-charcoal">
              Saved Pieces <span className="text-lg text-neutral-400 font-sans font-light">({items.length})</span>
            </h1>
          </div>
          <button
            onClick={clearWishlist}
            className="text-[11px] uppercase tracking-[0.1em] text-neutral-400 hover:text-red-500 transition-colors"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {items.map((product) => (
            <div key={product.id} className="group relative">
              <Link to={`/product/${product.id}`} className="block">
                <div className="relative aspect-[3/4] bg-neutral-50 overflow-hidden mb-3">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <h3 className="text-sm font-medium text-luxury-charcoal truncate">{product.name}</h3>
                <p className="text-sm text-neutral-500 font-light mt-1">{displayPrice(product.price)}</p>
              </Link>

              <button
                onClick={() => removeItem(product.id)}
                className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white/90 hover:bg-white transition-colors"
                aria-label="Remove from wishlist"
              >
                <X size={14} />
              </button>

              <button
                onClick={() => handleAddToBag(product)}
                className="mt-3 w-full py-2.5 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.15em] border border-neutral-200 hover:border-luxury-charcoal hover:bg-luxury-charcoal hover:text-white transition-all"
              >
                <ShoppingBag size={13} />
                Add to Bag
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
