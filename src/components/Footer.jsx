import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Mail, MapPin, Phone } from 'lucide-react';
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
  { icon: Instagram, label: 'Instagram', href: 'https://instagram.com' },
  { icon: Facebook, label: 'Facebook', href: 'https://facebook.com' },
  { icon: Twitter, label: 'Twitter', href: 'https://x.com' },
];

export default function Footer() {
  return (
    <footer className="bg-luxury-charcoal text-white">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="py-16 lg:py-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <BCMonogram size={36} light />
              <BCWordmark size="md" light />
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed mb-6 font-light">
              A brand by <span className="text-neutral-200 font-normal">Burptech Private Limited</span>, defining luxury fashion since 2020.
              Each piece is crafted with the finest materials and uncompromising attention to detail.
            </p>
            <div className="flex gap-4">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 flex items-center justify-center border border-neutral-700 text-neutral-400 hover:border-luxury-gold hover:text-luxury-gold transition-colors"
                  aria-label={label}
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[10px] uppercase tracking-[0.25em] font-semibold text-neutral-400 mb-6">
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
                  <Link to={to} className="text-sm text-neutral-300 hover:text-luxury-gold transition-colors font-light">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <h3 className="text-[10px] uppercase tracking-[0.25em] font-semibold text-neutral-400 mt-8 mb-6">
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
                  <Link to={to} className="text-sm text-neutral-300 hover:text-luxury-gold transition-colors font-light">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] uppercase tracking-[0.25em] font-semibold text-neutral-400 mb-6">
              Client Services
            </h3>
            <ul className="space-y-3">
              {clientServices.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-sm text-neutral-300 hover:text-luxury-gold transition-colors font-light">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] uppercase tracking-[0.25em] font-semibold text-neutral-400 mb-6">
              Contact
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-neutral-300 font-light">
                <MapPin size={15} className="flex-shrink-0 mt-0.5 text-luxury-gold" />
                <div className="space-y-1">
                  <p>B-7 Aryan Bungalows</p>
                  <p>Chankyapuri Road</p>
                  <p>Nr Harivilla Flat</p>
                  <p>Opp. Kargil Petrol Pump</p>
                  <p>Ahmedabad, Gujarat 380060</p>
                </div>
              </li>
              <li className="flex items-center gap-3 text-sm text-neutral-300 font-light">
                <Phone size={15} className="flex-shrink-0 text-luxury-gold" />
                <span>+91 90238 44259</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-neutral-300 font-light">
                <Mail size={15} className="flex-shrink-0 text-luxury-gold" />
                <span>concierge@brandclothzy.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="py-6 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-neutral-500 font-light">
            &copy; {new Date().getFullYear()} BrandClothzy. All rights reserved.
          </p>
          <div className="flex gap-6">
            {legalLinks.map(({ label, to }) => (
              <Link key={label} to={to} className="text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors font-light">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
