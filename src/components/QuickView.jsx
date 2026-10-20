import { useState } from 'react';
import { Link } from 'react-router-dom';
import { displayPrice } from '../utils/helpers';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import Button from './Button';

export default function QuickView() {
  const { quickViewProduct, closeQuickView, addToast } = useUI();
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  if (!quickViewProduct) return null;

  const product = quickViewProduct;

  const handleAddToCart = () => {
    if (!selectedSize) {
      addToast('Please select a size', 'error');
      return;
    }
    addItem(product, selectedSize, selectedColor || product.colors[0]);
    addToast(`${product.name} added to bag`, 'success');
    closeQuickView();
    setSelectedSize('');
    setSelectedColor('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeQuickView} />
      <div className="relative bg-white w-full max-w-3xl animate-fade-in overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="aspect-[3/4] bg-neutral-50">
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-8 flex flex-col justify-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-luxury-taupe mb-2">
              {product.category}
            </p>
            <h2 className="font-serif text-2xl text-luxury-charcoal mb-2">{product.name}</h2>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-lg font-medium">{displayPrice(product.price)}</span>
              {product.originalPrice && (
                <span className="text-sm text-neutral-400 line-through">
                  {displayPrice(product.originalPrice)}
                </span>
              )}
            </div>

            <div className="mb-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-luxury-taupe mb-3">Size</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[44px] px-3 py-2 text-xs border transition-colors ${
                      selectedSize === size
                        ? 'border-luxury-charcoal bg-luxury-charcoal text-white'
                        : 'border-neutral-200 hover:border-luxury-charcoal'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-luxury-taupe mb-3">Color</p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-3 py-2 text-xs border transition-colors ${
                      selectedColor === color
                        ? 'border-luxury-charcoal bg-luxury-charcoal text-white'
                        : 'border-neutral-200 hover:border-luxury-charcoal'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleAddToCart} className="w-full mb-3">
              Add to Bag
            </Button>
            <Link
              to={`/product/${product.id}`}
              onClick={closeQuickView}
              className="text-center text-[11px] uppercase tracking-[0.15em] text-luxury-taupe hover:text-luxury-charcoal transition-colors"
            >
              View Full Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
