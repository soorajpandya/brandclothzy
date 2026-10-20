import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, Play } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { collections } from '../data/products';
import { validateEmail } from '../utils/helpers';
import ProductCard from '../components/ProductCard';
import Button from '../components/Button';
import { BCMonogram } from '../components/BrandLogo';
import { useUI } from '../context/UIContext';
import SEO from '../components/SEO';

export default function Home() {
  const { getBestSellers, getNewArrivals } = useProducts();
  const { addToast } = useUI();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    setEmailError('');
    addToast('Welcome to the BrandClothzy world. Expect elegance in your inbox.', 'success');
    setEmail('');
  };

  return (
    <div>
      <SEO
        path="/"
        description="Shop premium Indian fashion at BrandClothzy. Discover curated collections of men's shirts, t-shirts, jeans, jackets & women's sarees, kurtis, dresses, lehengas. Free shipping on orders above ₹999."
        keywords="BrandClothzy, indian fashion, premium clothing, men shirts, women sarees, kurtis, lehengas, dresses, ethnic wear, casual wear, online shopping india, affordable luxury"
      />
      <section className="relative h-screen flex items-end sm:items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/hero.png"
            alt="Luxury Indian fashion campaign"
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        </div>
        <div className="relative z-10 text-left text-white max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-10 pb-24 sm:pb-0">
          <div className="max-w-2xl">
          <div className="mb-8 animate-fade-in">
            <BCMonogram size={64} light className="opacity-90" />
          </div>
          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.4em] text-luxury-gold-light mb-6 animate-fade-in font-light">
            Spring / Summer 2026 Collection
          </p>
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-8xl mb-5 leading-[1.05] animate-slide-up">
            Elevated
            <br />
            <span className="italic">Indian</span> Elegance
          </h1>
          <p className="text-base sm:text-lg font-light text-neutral-300 mb-10 max-w-md leading-relaxed animate-slide-up">
            Crafted for modern luxury
          </p>
          <div className="flex items-center gap-4 animate-slide-up">
            <Link to="/shop">
              <Button variant="white" size="lg">
                Explore Collection
              </Button>
            </Link>
            <button className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/80 hover:text-white transition-colors group">
              <span className="w-10 h-10 flex items-center justify-center border border-white/40 rounded-full group-hover:border-white transition-colors">
                <Play size={12} fill="white" />
              </span>
              Watch Film
            </button>
          </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-[1px] h-12 bg-white/40" />
        </div>
      </section>

      <section className="py-20 lg:py-28 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="text-center mb-14">
          <p className="text-[10px] uppercase tracking-[0.3em] text-luxury-taupe mb-3">Curated For You</p>
          <h2 className="font-serif text-3xl sm:text-4xl text-luxury-charcoal">Featured Collections</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              to={collection.id === 'men' ? '/shop?gender=Men' : collection.id === 'women' ? '/shop?gender=Women' : '/shop'}
              className="group relative overflow-hidden aspect-[3/4]"
            >
              <img
                src={collection.image}
                alt={collection.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
                <p className="text-[10px] uppercase tracking-[0.25em] text-luxury-gold-light mb-2">
                  {collection.subtitle}
                </p>
                <h3 className="font-serif text-xl lg:text-2xl text-white mb-3">{collection.title}</h3>
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-white/80 group-hover:text-white transition-colors">
                  Discover
                  <ChevronRight size={12} className="transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-luxury-pearl py-20 lg:py-28">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative aspect-[4/5] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=900&q=80"
                alt="Editorial campaign"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="lg:max-w-md">
              <p className="text-[10px] uppercase tracking-[0.3em] text-luxury-gold mb-4">The Campaign</p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-luxury-charcoal mb-6 leading-[1.15]">
                Where Heritage
                <br />
                Meets <span className="italic">Modernity</span>
              </h2>
              <p className="text-sm text-neutral-500 leading-relaxed mb-8 font-light">
                Our latest campaign celebrates the duality of tradition and innovation.
                Shot on location in the rolling hills of Tuscany, each frame captures the
                essence of what it means to wear BrandClothzy — confidence, grace, and an
                unwavering commitment to beauty.
              </p>
              <Link to="/shop">
                <Button variant="outline" size="lg">
                  View Campaign
                  <ArrowRight size={14} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-luxury-taupe mb-3">Most Coveted</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-luxury-charcoal">Best Sellers</h2>
          </div>
          <Link
            to="/shop"
            className="mt-4 sm:mt-0 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-luxury-charcoal hover:text-luxury-gold transition-colors"
          >
            View All
            <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {getBestSellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="py-20 lg:py-28 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-luxury-taupe mb-3">Just Arrived</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-luxury-charcoal">New Arrivals</h2>
          </div>
          <Link
            to="/shop"
            className="mt-4 sm:mt-0 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-luxury-charcoal hover:text-luxury-gold transition-colors"
          >
            View All
            <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {getNewArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="bg-luxury-charcoal py-20 lg:py-28">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-luxury-gold mb-4">Stay Connected</p>
          <h2 className="font-serif text-3xl sm:text-4xl text-white mb-4">
            Join the <span className="italic">BrandClothzy</span> World
          </h2>
          <p className="text-sm text-neutral-400 mb-10 font-light leading-relaxed">
            Subscribe to receive exclusive previews, early access to new collections,
            and invitations to private events.
          </p>
          <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <div className="flex-1">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                }}
                placeholder="Your email address"
                className="w-full px-5 py-3.5 text-sm bg-white/10 border border-white/20 text-white placeholder:text-neutral-500 outline-none focus:border-luxury-gold transition-colors"
                aria-label="Email address for newsletter"
              />
              {emailError && (
                <p className="text-[11px] text-red-400 mt-1.5 text-left">{emailError}</p>
              )}
            </div>
            <Button variant="gold" size="lg" type="submit">
              Subscribe
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
