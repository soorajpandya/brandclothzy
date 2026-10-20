import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Heart, Share2, Truck, RotateCcw, Shield, ChevronRight } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useUI } from '../context/UIContext';
import { displayPrice } from '../utils/helpers';
import ProductCard from '../components/ProductCard';
import Button from '../components/Button';
import { ProductDetailSkeleton } from '../components/Skeleton';
import SEO, { ProductJsonLd, BreadcrumbJsonLd } from '../components/SEO';

export default function ProductDetail() {
  const { id } = useParams();
  const { getProductById, getRelatedProducts } = useProducts();
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const { addToast } = useUI();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [imageZoomed, setImageZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [activeInfoTab, setActiveInfoTab] = useState('description');

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const found = getProductById(id);
      setProduct(found);
      setSelectedImage(0);
      setSelectedSize('');
      setSelectedColor('');
      setQuantity(1);
      setLoading(false);
      if (found && typeof window.fbq === 'function') {
        window.fbq('track', 'ViewContent', {
          content_ids: [found.id],
          content_name: found.name,
          content_type: 'product',
          value: found.price,
          currency: 'INR',
        });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [id, getProductById]);

  if (loading) return <ProductDetailSkeleton />;
  if (!product) {
    return (
      <div className="pt-32 pb-20 text-center">
        <h2 className="font-serif text-3xl text-luxury-charcoal mb-3">Product Not Found</h2>
        <p className="text-sm text-neutral-400 mb-8 font-light">
          The piece you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link to="/shop">
          <Button variant="outline">Return to Shop</Button>
        </Link>
      </div>
    );
  }

  const relatedProducts = getRelatedProducts(product);

  const handleAddToCart = () => {
    if (!selectedSize) {
      addToast('Please select a size', 'error');
      return;
    }
    const color = selectedColor || product.colors[0];
    for (let i = 0; i < quantity; i++) {
      addItem(product, selectedSize, color);
    }
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'AddToCart', {
        content_ids: [product.id],
        content_name: product.name,
        content_type: 'product',
        value: product.price * quantity,
        currency: 'INR',
        num_items: quantity,
      });
    }
    addToast(`${product.name} added to your bag`, 'success');
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  return (
    <div className="pt-20 lg:pt-24 pb-16">
      <SEO
        title={`${product.name} — ${product.category} for ${product.gender}`}
        path={`/product/${product.id}`}
        description={`Buy ${product.name} at ₹${product.price}. ${product.description} Shop ${product.gender.toLowerCase()}'s ${product.category.toLowerCase()} at BrandClothzy.`}
        keywords={`${product.name}, ${product.category}, ${product.gender} ${product.category}, buy ${product.category.toLowerCase()} online, BrandClothzy ${product.category.toLowerCase()}`}
        image={product.images[0]}
        type="product"
        jsonLd={[
          ProductJsonLd(product),
          BreadcrumbJsonLd([
            { name: 'Home', url: '/' },
            { name: product.gender === 'Men' ? "Men's Collection" : "Women's Collection", url: `/shop?gender=${product.gender}` },
            { name: product.category, url: `/shop?gender=${product.gender}&category=${product.category}` },
            { name: product.name },
          ]),
        ]}
      />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <nav className="flex items-center gap-2 py-4 text-[11px] text-neutral-400">
          <Link to="/" className="hover:text-luxury-charcoal transition-colors">Home</Link>
          <ChevronRight size={11} />
          <Link to={`/shop?gender=${product.gender}`} className="hover:text-luxury-charcoal transition-colors">{product.gender}</Link>
          <ChevronRight size={11} />
          <Link to={`/shop?gender=${product.gender}&category=${product.category}`} className="hover:text-luxury-charcoal transition-colors">{product.category}</Link>
          <ChevronRight size={11} />
          <span className="text-luxury-charcoal">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 mt-4">
          <div className="space-y-4">
            <div
              className="relative aspect-[3/4] bg-neutral-50 overflow-hidden cursor-zoom-in"
              onMouseEnter={() => setImageZoomed(true)}
              onMouseLeave={() => setImageZoomed(false)}
              onMouseMove={handleMouseMove}
            >
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className={`w-full h-full object-cover transition-transform duration-300 ${
                  imageZoomed ? 'scale-150' : 'scale-100'
                }`}
                style={
                  imageZoomed
                    ? { transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%` }
                    : undefined
                }
              />
              {product.badge && (
                <span className="absolute top-4 left-4 bg-luxury-charcoal text-white px-3 py-1.5 text-[9px] uppercase tracking-[0.2em] font-medium">
                  {product.badge}
                </span>
              )}
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`flex-shrink-0 w-20 h-24 overflow-hidden border-2 transition-colors ${
                    selectedImage === idx ? 'border-luxury-charcoal' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt={`${product.name} view ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="lg:py-4">
            <div className="lg:sticky lg:top-28">
              <p className="text-[10px] uppercase tracking-[0.25em] text-luxury-taupe mb-2">
                {product.collection}
              </p>
              <h1 className="font-serif text-3xl lg:text-4xl text-luxury-charcoal mb-3">
                {product.name}
              </h1>
              <div className="flex items-center gap-3 mb-8">
                <span className="text-xl font-medium">{displayPrice(product.price)}</span>
                {product.originalPrice && (
                  <span className="text-base text-neutral-400 line-through">
                    {displayPrice(product.originalPrice)}
                  </span>
                )}
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] uppercase tracking-[0.25em] font-medium text-luxury-taupe">
                    Size
                  </p>
                  <Link
                    to="/size-guide"
                    className="text-[10px] uppercase tracking-[0.1em] text-luxury-taupe underline hover:text-luxury-charcoal transition-colors"
                  >
                    Size Guide
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[48px] px-4 py-2.5 text-xs border transition-all duration-200 ${
                        selectedSize === size
                          ? 'border-luxury-charcoal bg-luxury-charcoal text-white'
                          : 'border-neutral-200 hover:border-luxury-charcoal text-luxury-charcoal'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <p className="text-[10px] uppercase tracking-[0.25em] font-medium text-luxury-taupe mb-3">
                  Color
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2.5 text-xs border transition-all duration-200 ${
                        selectedColor === color
                          ? 'border-luxury-charcoal bg-luxury-charcoal text-white'
                          : 'border-neutral-200 hover:border-luxury-charcoal text-luxury-charcoal'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <p className="text-[10px] uppercase tracking-[0.25em] font-medium text-luxury-taupe mb-3">
                  Quantity
                </p>
                <div className="inline-flex items-center border border-neutral-200">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-neutral-50 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-12 h-10 flex items-center justify-center text-sm border-x border-neutral-200">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-neutral-50 transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mb-8">
                <Button onClick={handleAddToCart} className="flex-1" size="lg">
                  Add to Bag
                </Button>
                <button
                  onClick={() => { toggleItem(product); addToast(isInWishlist(product.id) ? 'Removed from wishlist' : 'Added to wishlist', 'success'); }}
                  className={`w-12 h-12 flex items-center justify-center border transition-colors ${
                    isInWishlist(product.id) ? 'border-luxury-charcoal bg-luxury-charcoal text-white' : 'border-neutral-200 hover:border-luxury-charcoal'
                  }`}
                  aria-label="Add to wishlist"
                >
                  <Heart size={18} fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={() => { navigator.clipboard.writeText(window.location.href); addToast('Link copied to clipboard', 'success'); }}
                  className="w-12 h-12 flex items-center justify-center border border-neutral-200 hover:border-luxury-charcoal transition-colors"
                  aria-label="Share product"
                >
                  <Share2 size={18} />
                </button>
              </div>

              <div className="border-t border-neutral-100 pt-8">
                <div className="flex gap-6 mb-6">
                  {['description', 'delivery', 'care'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveInfoTab(tab)}
                      className={`text-[10px] uppercase tracking-[0.2em] pb-2 border-b-2 transition-colors ${
                        activeInfoTab === tab
                          ? 'border-luxury-charcoal text-luxury-charcoal'
                          : 'border-transparent text-neutral-400 hover:text-neutral-600'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {activeInfoTab === 'description' && (
                  <p className="text-sm text-neutral-500 leading-relaxed font-light">
                    {product.description}
                  </p>
                )}

                {activeInfoTab === 'delivery' && (
                  <div className="space-y-4">
                    {[
                      { icon: Truck, title: 'Free Shipping', desc: 'Free shipping on orders above ₹999' },
                      { icon: RotateCcw, title: 'Free Returns', desc: '14-day return policy for unworn items' },
                      { icon: Shield, title: 'Authenticity Guaranteed', desc: 'Certificate of authenticity included' },
                    ].map(({ icon: Icon, title, desc }) => (
                      <div key={title} className="flex items-start gap-3">
                        <Icon size={16} className="text-luxury-taupe mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-luxury-charcoal">{title}</p>
                          <p className="text-xs text-neutral-400 font-light">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeInfoTab === 'care' && (
                  <div className="text-sm text-neutral-500 leading-relaxed font-light space-y-2">
                    <p>Professional dry clean recommended.</p>
                    <p>Store in the provided dust bag when not in use.</p>
                    <p>Avoid prolonged exposure to direct sunlight.</p>
                    <p>Handle gold-tone hardware with care to prevent scratching.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-20 lg:mt-28">
            <div className="text-center mb-12">
              <p className="text-[10px] uppercase tracking-[0.3em] text-luxury-taupe mb-3">
                You May Also Like
              </p>
              <h2 className="font-serif text-3xl text-luxury-charcoal">Related Pieces</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
