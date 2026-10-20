import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, MapPin, Clock, Phone } from 'lucide-react';
import SEO from '../components/SEO';

const stores = [
  { city: 'Ahmedabad', address: 'B/7, Aryan Bungalows, Opp. Kargil Petrol Pump, Chankyapuri Cross Road, Sola, Ahmedabad.', phone: '+91 77788 67131', hours: 'Mon–Sat 10AM–8PM, Sun 11AM–6PM', flagship: true }
  
];

export default function StoreLocator() {
  useEffect(() => {
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'FindLocation');
    }
  }, []);

  return (
    <div className="pt-24 lg:pt-28 pb-20">
      <SEO
        title="Store Locator — Find a BrandClothzy Store"
        path="/stores"
        description="Find your nearest BrandClothzy store. Visit our flagship locations for an exclusive in-store fashion experience."
        keywords="BrandClothzy store, fashion store near me, BrandClothzy Ahmedabad, clothing store india"
      />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <nav className="flex items-center gap-2 py-4 text-[11px] text-neutral-400">
          <Link to="/" className="hover:text-luxury-charcoal transition-colors">Home</Link>
          <ChevronRight size={11} />
          <span className="text-luxury-charcoal">Store Locator</span>
        </nav>

        <div className="text-center mt-8 mb-16">
          <p className="text-[10px] uppercase tracking-[0.3em] text-luxury-taupe mb-3">Visit Us</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-luxury-charcoal mb-4">Our Boutiques</h1>
          <p className="text-sm text-neutral-500 font-light max-w-lg mx-auto leading-relaxed">
            Experience the world of BrandClothzy in person. Visit one of our boutiques for
            a personalised styling consultation and discover our latest collections.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {stores.map((store) => (
            <div
              key={store.city}
              className="border border-neutral-100 p-8 hover:border-neutral-300 transition-colors group"
            >
              <div className="flex items-center gap-2 mb-4">
                <h2 className="font-serif text-xl text-luxury-charcoal">{store.city}</h2>
                {store.flagship && (
                  <span className="text-[9px] uppercase tracking-[0.15em] bg-luxury-gold/10 text-luxury-gold px-2 py-0.5 font-medium">
                    Flagship
                  </span>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm text-neutral-500 font-light">
                  <MapPin size={14} className="text-luxury-gold flex-shrink-0 mt-0.5" />
                  <span>{store.address}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-500 font-light">
                  <Phone size={14} className="text-luxury-gold flex-shrink-0" />
                  <span>{store.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-500 font-light">
                  <Clock size={14} className="text-luxury-gold flex-shrink-0" />
                  <span>{store.hours}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto mt-12 p-8 bg-luxury-pearl text-center">
          <h3 className="font-serif text-xl text-luxury-charcoal mb-3">Book a Private Appointment</h3>
          <p className="text-sm text-neutral-500 font-light max-w-md mx-auto mb-6 leading-relaxed">
            Enjoy an exclusive one-on-one styling session with our in-store consultants.
            Available at all flagship locations.
          </p>
          <Link to="/contact">
            <button className="px-8 py-3 text-[11px] uppercase tracking-[0.15em] border border-luxury-charcoal text-luxury-charcoal hover:bg-luxury-charcoal hover:text-white transition-all">
              Book Now
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
