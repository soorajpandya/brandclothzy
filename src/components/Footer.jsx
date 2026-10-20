import { Link } from 'react-router-dom';
import { Instagram, Facebook, Mail, MapPin, Phone } from 'lucide-react';
import { BCMonogram, BCWordmark } from './BrandLogo';

const clientServices = [
  { label: 'About Us', to: '/about' },
  { label: 'Contact Us', to: '/contact' },
  { label: 'Shipping & Returns', to: '/shipping-returns' },
  { label: 'Size Guide', to: '/size-guide' },
  { label: 'Care Instructions', to: '/care' },
  { label: 'FAQs', to: '/faqs' },
  { label: 'Store Locator', to: '/stores' },
];

const legalLinks = [
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms of Service', to: '/terms' },
  { label: 'Cookie Preferences', to: '/cookies' },
];

const socialLinks = [
  { icon: Instagram, label: 'Instagram', href: 'https://www.instagram.com/brand_clothzy/' },
  { icon: Facebook, label: 'Facebook', href: 'https://www.facebook.com/brandclothzy' },
];

export default function Footer() {
  return (
    <footer className="bg-luxury-charcoal text-white border-t border-neutral-800/80">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="py-16 lg:py-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-4 pr-0 lg:pr-6">
            <div className="flex items-center gap-2.5 mb-6">
              <BCMonogram size={38} light />
              <BCWordmark size="md" light />
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed mb-6 font-light">
              A brand by <span className="text-white font-normal">Burptech Private Limited</span>, defining Indian luxury fashion since 2020.
              Each piece is crafted with uncompromising attention to detail and master craftsmanship.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-neutral-700/80 bg-neutral-900/50 flex items-center justify-center text-neutral-400 hover:border-luxury-gold hover:text-luxury-gold hover:bg-neutral-800/70 transition-all duration-300"
                  aria-label={label}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Men & Women Links */}
          <div className="lg:col-span-3 grid grid-cols-2 gap-6 sm:gap-8">
            <div>
              <h3 className="text-[11px] uppercase tracking-[0.25em] font-medium text-luxury-gold mb-6">
                Men
              </h3>
              <ul className="space-y-3">
                {[
                  { label: 'All Men', to: '/shop?gender=Men' },
                  { label: 'Shirts', to: '/shop?gender=Men&category=Shirts' },
                  { label: 'T-Shirts', to: '/shop?gender=Men&category=T-Shirts' },
                  { label: 'Jeans', to: '/shop?gender=Men&category=Jeans' },
                  { label: 'Trousers', to: '/shop?gender=Men&category=Trousers' },
                  { label: 'Jackets', to: '/shop?gender=Men&category=Jackets' },
                ].map(({ label, to }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}
                      className="text-sm text-neutral-300 hover:text-luxury-gold transition-colors font-light"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-[11px] uppercase tracking-[0.25em] font-medium text-luxury-gold mb-6">
                Women
              </h3>
              <ul className="space-y-3">
                {[
                  { label: 'All Women', to: '/shop?gender=Women' },
                  { label: 'Sarees', to: '/shop?gender=Women&category=Sarees' },
                  { label: 'Kurtis', to: '/shop?gender=Women&category=Kurtis' },
                  { label: 'Dresses', to: '/shop?gender=Women&category=Dresses' },
                  { label: 'Lehengas', to: '/shop?gender=Women&category=Lehengas' },
                  { label: 'Tops & Blouses', to: '/shop?gender=Women&category=Tops & Blouses' },
                ].map(({ label, to }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}
                      className="text-sm text-neutral-300 hover:text-luxury-gold transition-colors font-light"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Client Services */}
          <div className="lg:col-span-2">
            <h3 className="text-[11px] uppercase tracking-[0.25em] font-medium text-luxury-gold mb-6">
              Client Services
            </h3>
            <ul className="space-y-3">
              {clientServices.map(({ label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}
                    className="text-sm text-neutral-300 hover:text-luxury-gold transition-colors font-light"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-3">
            <h3 className="text-[11px] uppercase tracking-[0.25em] font-medium text-luxury-gold mb-6">
              Contact
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-neutral-300 font-light">
                <MapPin size={16} className="flex-shrink-0 mt-0.5 text-luxury-gold" />
                <div className="space-y-0.5 leading-relaxed text-neutral-300 text-xs sm:text-sm">
                  <p>B-7 Aryan Bungalows, Chankyapuri Road</p>
                  <p>Nr Harivilla Flat, Opp. Kargil Petrol Pump</p>
                  <p className="text-neutral-400">Ahmedabad, Gujarat 380060</p>
                </div>
              </li>
              <li className="flex items-center gap-3 text-sm text-neutral-300 font-light">
                <Phone size={15} className="flex-shrink-0 text-luxury-gold" />
                <a href="tel:+917778867131" className="hover:text-luxury-gold transition-colors">
                  +91 77788 67131
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm text-neutral-300 font-light">
                <Mail size={15} className="flex-shrink-0 text-luxury-gold" />
                <a href="mailto:concierge@brandclothzy.com" className="hover:text-luxury-gold transition-colors">
                  concierge@brandclothzy.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-neutral-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2 sm:gap-3 text-[11px] text-neutral-400 font-light">
            <p>&copy; {new Date().getFullYear()} BrandClothzy. All rights reserved.</p>
            <span className="hidden sm:inline text-neutral-600">•</span>
            <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] tracking-wider text-neutral-400">
              CIN: U62012GJ2023PTC145295
            </span>
            <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] tracking-wider text-neutral-400">
              GSTIN: 24AALCB9972G1Z9
            </span>
          </div>
          <div className="flex gap-6">
            {legalLinks.map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}
                className="text-[11px] text-neutral-400 hover:text-luxury-gold transition-colors font-light"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
