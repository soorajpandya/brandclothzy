import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, ShoppingBag } from 'lucide-react';
import { displayPrice } from '../utils/helpers';
import { useUI } from '../context/UIContext';

export default function ProductCard({ product }) {
  const [imageIndex, setImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { openQuickView } = useUI();

  return (
    <div className="group relative">
      <div className="relative overflow-hidden bg-neutral-50 aspect-[3/4]">
        <Link to={`/product/${product.id}`}>
          {!imageLoaded && (
            <div className="absolute inset-0 bg-neutral-100 animate-pulse" />
          )}
          <img
            src={product.images[imageIndex]}
            alt={product.name}
            className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onMouseEnter={() => product.images.length > 1 && setImageIndex(1)}
            onMouseLeave={() => setImageIndex(0)}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
          />
        </Link>

        {product.badge && (
          <span className="absolute top-3 left-3 bg-luxury-charcoal text-white px-3 py-1 text-[9px] uppercase tracking-[0.2em] font-medium">
            {product.badge}
          </span>
        )}

        {product.isNew && !product.badge && (
          <span className="absolute top-3 left-3 bg-luxury-gold text-white px-3 py-1 text-[9px] uppercase tracking-[0.2em] font-medium">
            New
          </span>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-center gap-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={() => openQuickView(product)}
            className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-luxury-charcoal px-4 py-2.5 text-[10px] uppercase tracking-[0.15em] font-medium hover:bg-luxury-charcoal hover:text-white transition-colors"
            aria-label={`Quick view ${product.name}`}
          >
            <Eye size={13} />
            Quick View
          </button>
          <button
            onClick={() => openQuickView(product)}
            className="flex items-center justify-center bg-luxury-charcoal text-white p-2.5 hover:bg-luxury-gold transition-colors"
            aria-label={`Add ${product.name} to bag`}
          >
            <ShoppingBag size={14} />
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-1">
        <p className="text-[10px] uppercase tracking-[0.2em] text-luxury-taupe">{product.category}</p>
        <Link to={`/product/${product.id}`}>
          <h3 className="text-sm font-medium text-luxury-charcoal group-hover:text-luxury-gold transition-colors leading-snug">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{displayPrice(product.price)}</p>
          {product.originalPrice && (
            <p className="text-xs text-neutral-400 line-through">{displayPrice(product.originalPrice)}</p>
          )}
        </div>
      </div>
    </div>
  );
}
