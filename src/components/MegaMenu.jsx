import { Link } from 'react-router-dom';

const menCategories = ['Shirts', 'T-Shirts', 'Jeans', 'Trousers', 'Track Pants', 'Vests', 'Ethnic Wear', 'Shorts', 'Jackets'];
const womenCategories = ['Sarees', 'Kurtis', 'Kurta Sets', 'Dupattas', 'Tops & Blouses', 'Lehengas', 'Dresses', 'Salwar Suits', 'Ethnic Wear'];

export default function MegaMenu({ onClose }) {
  const menuSections = [
    {
      title: 'Men',
      links: [
        { label: 'All Men', to: '/shop?gender=Men' },
        ...menCategories.map((c) => ({ label: c, to: `/shop?gender=Men&category=${c}` })),
      ],
    },
    {
      title: 'Women',
      links: [
        { label: 'All Women', to: '/shop?gender=Women' },
        ...womenCategories.map((c) => ({ label: c, to: `/shop?gender=Women&category=${c}` })),
      ],
    },
    {
      title: 'Featured',
      links: [
        { label: 'New Arrivals', to: '/shop' },
        { label: 'Best Sellers', to: '/shop' },
        { label: 'Shop All', to: '/shop' },
      ],
    },
  ];

  return (
    <div className="absolute top-full left-0 right-0 bg-white border-b border-neutral-100 shadow-lg animate-slide-down">
      <div className="max-w-[1440px] mx-auto px-10 py-10">
        <div className="grid grid-cols-4 gap-12">
          {menuSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-[10px] uppercase tracking-[0.25em] font-semibold text-luxury-taupe mb-5">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      onClick={onClose}
                      className="text-sm text-luxury-charcoal hover:text-luxury-gold transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="relative overflow-hidden rounded-sm group">
            <img
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&q=80"
              alt="New Collection"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/30 flex items-end p-6">
              <div>
                <p className="text-white text-[10px] uppercase tracking-[0.2em] mb-1">New Season</p>
                <p className="text-white font-serif text-lg">Pre-Fall 2026</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
