import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Menu, X, User, Heart, LogOut } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../hooks/useProducts';
import { displayPrice, fuzzyMatch } from '../utils/helpers';
import { BCMonogram, BCWordmark } from './BrandLogo';
import MegaMenu from './MegaMenu';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const searchInputRef = useRef(null);
  const { itemCount } = useCart();
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu, isMegaMenuOpen, setIsMegaMenuOpen } = useUI();
  const { user, logout } = useAuth();
  const { products: allProducts } = useProducts();
  const navigate = useNavigate();
  const location = useLocation();

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.trim();
    return allProducts
      .filter(p => fuzzyMatch(p.name, q) || fuzzyMatch(p.category, q) || (p.gender && fuzzyMatch(p.gender, q)))
      .slice(0, 6);
  }, [searchQuery, allProducts]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleResultClick = (productId) => {
    setSearchOpen(false);
    setSearchQuery('');
    navigate(`/product/${productId}`);
  };

  useEffect(() => {
    closeMobileMenu();
    setSearchOpen(false);
    setSearchQuery('');
    setUserMenuOpen(false);
  }, [location, closeMobileMenu]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHome = location.pathname === '/';
  const navBg = scrolled || !isHome
    ? 'bg-white/95 backdrop-blur-md border-b border-neutral-100 shadow-sm'
    : 'bg-transparent';
  const textColor = scrolled || !isHome ? 'text-luxury-charcoal' : 'text-white';

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navBg}`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <button
              onClick={toggleMobileMenu}
              className={`lg:hidden p-2 -ml-2 ${textColor} transition-colors hover:opacity-70`}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <div className="hidden lg:flex items-center gap-8">
              <button
                onMouseEnter={() => setIsMegaMenuOpen(true)}
                className={`text-[11px] uppercase tracking-[0.2em] font-medium ${textColor} hover:opacity-70 transition-opacity`}
              >
                Collections
              </button>
              <Link
                to="/shop?gender=Men"
                className={`text-[11px] uppercase tracking-[0.2em] font-medium ${textColor} hover:opacity-70 transition-opacity`}
              >
                Men
              </Link>
              <Link
                to="/shop?gender=Women"
                className={`text-[11px] uppercase tracking-[0.2em] font-medium ${textColor} hover:opacity-70 transition-opacity`}
              >
                Women
              </Link>
              <Link
                to="/about"
                className={`text-[11px] uppercase tracking-[0.2em] font-medium ${textColor} hover:opacity-70 transition-opacity`}
              >
                About
              </Link>
            </div>

            <Link to="/" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              <BCMonogram size={34} light={isHome && !scrolled} className="hidden sm:block" />
              <BCWordmark size="md" light={isHome && !scrolled} />
            </Link>

            <div className="flex items-center gap-3 lg:gap-5">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className={`p-2 ${textColor} hover:opacity-70 transition-opacity`}
                aria-label="Search"
              >
                <Search size={18} />
              </button>
              <Link
                to="/wishlist"
                className={`hidden lg:block p-2 ${textColor} hover:opacity-70 transition-opacity`}
                aria-label="Wishlist"
              >
                <Heart size={18} />
              </Link>
              <div className="hidden lg:block relative" ref={userMenuRef}>
                {user ? (
                  <>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="p-1 hover:opacity-80 transition-opacity"
                      aria-label="Account menu"
                    >
                      {user.photo ? (
                        <img src={user.photo} alt={user.name} className="w-7 h-7 rounded-full border border-neutral-200" referrerPolicy="no-referrer" />
                      ) : (
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold ${scrolled || !isHome ? 'bg-luxury-pearl text-luxury-charcoal' : 'bg-white/20 text-white'}`}>
                          {user.name?.charAt(0) || 'U'}
                        </div>
                      )}
                    </button>
                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white border border-neutral-100 shadow-lg py-2 z-50 animate-fade-in">
                        <div className="px-4 py-2 border-b border-neutral-100">
                          <p className="text-sm font-medium text-luxury-charcoal truncate">{user.name}</p>
                          <p className="text-[11px] text-neutral-400 font-light truncate">{user.email}</p>
                        </div>
                        <Link to="/account" className="block px-4 py-2.5 text-sm text-neutral-600 hover:bg-luxury-pearl transition-colors">
                          My Account
                        </Link>
                        <Link to="/wishlist" className="block px-4 py-2.5 text-sm text-neutral-600 hover:bg-luxury-pearl transition-colors">
                          Wishlist
                        </Link>
                        <Link to="/dashboard" className="block px-4 py-2.5 text-sm text-neutral-600 hover:bg-luxury-pearl transition-colors">
                          Dashboard
                        </Link>
                        <button
                          onClick={logout}
                          className="w-full text-left px-4 py-2.5 text-sm text-neutral-600 hover:bg-luxury-pearl transition-colors flex items-center gap-2"
                        >
                          <LogOut size={14} />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to="/account"
                    className={`p-2 ${textColor} hover:opacity-70 transition-opacity`}
                    aria-label="Sign in"
                  >
                    <User size={18} />
                  </Link>
                )}
              </div>
              <Link
                to="/cart"
                className={`relative p-2 ${textColor} hover:opacity-70 transition-opacity`}
                aria-label={`Shopping bag with ${itemCount} items`}
              >
                <ShoppingBag size={18} />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 flex items-center justify-center text-[9px] font-semibold bg-luxury-gold text-white rounded-full min-w-[18px] h-[18px]">
                    {itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {searchOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-neutral-100 shadow-lg animate-slide-down z-50">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-4">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
                <Search size={18} className="text-neutral-400 flex-shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, categories..."
                  className="flex-1 text-sm font-light border-none outline-none bg-transparent placeholder:text-neutral-400"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-neutral-400 hover:text-neutral-700"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                  className="p-1 text-neutral-400 hover:text-neutral-700"
                  aria-label="Close search"
                >
                  <X size={18} />
                </button>
              </form>

              {searchQuery.trim() && (
                <div className="mt-3 border-t border-neutral-100 pt-3">
                  {searchResults.length > 0 ? (
                    <>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-2">
                        {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                      </p>
                      <div className="space-y-1 max-h-[320px] overflow-y-auto">
                        {searchResults.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => handleResultClick(product.id)}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 transition-colors text-left"
                          >
                            {product.images?.[0] && (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-luxury-charcoal truncate">{product.name}</p>
                              <p className="text-[11px] text-neutral-400">
                                {product.gender && `${product.gender} · `}{product.category}
                              </p>
                            </div>
                            <span className="text-sm font-medium text-luxury-charcoal flex-shrink-0">
                              {displayPrice(product.price)}
                            </span>
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={handleSearchSubmit}
                        className="w-full mt-2 pt-2 border-t border-neutral-100 text-center text-xs uppercase tracking-[0.15em] text-luxury-gold hover:text-luxury-charcoal transition-colors py-2"
                      >
                        View all results for &ldquo;{searchQuery}&rdquo;
                      </button>
                    </>
                  ) : (
                    <p className="text-sm text-neutral-400 py-4 text-center">
                      No products found for &ldquo;{searchQuery}&rdquo;
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {isMegaMenuOpen && (
          <div onMouseLeave={() => setIsMegaMenuOpen(false)}>
            <MegaMenu onClose={() => setIsMegaMenuOpen(false)} />
          </div>
        )}
      </nav>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={closeMobileMenu} />
          <div className="absolute top-0 left-0 bottom-0 w-[300px] bg-white animate-slide-down overflow-y-auto">
            <div className="p-6 pt-20">
              <div className="flex items-center gap-2 mb-8 pb-6 border-b border-neutral-100">
                <BCMonogram size={28} />
                <BCWordmark size="sm" />
              </div>
              <nav className="space-y-1">
                {user && (
                  <div className="flex items-center gap-3 py-3 border-b border-neutral-100">
                    {user.photo ? (
                      <img src={user.photo} alt={user.name} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-luxury-pearl flex items-center justify-center text-sm font-semibold text-luxury-charcoal">
                        {user.name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-luxury-charcoal truncate">{user.name}</p>
                      <p className="text-[10px] text-neutral-400 truncate">{user.email}</p>
                    </div>
                  </div>
                )}
                {[
                  { to: '/', label: 'Home' },
                  { to: '/about', label: 'About Us' },
                  { to: '/shop?gender=Men', label: 'Men' },
                  { to: '/shop?gender=Women', label: 'Women' },
                  { to: '/wishlist', label: 'Wishlist' },
                  { to: '/cart', label: 'Shopping Bag' },
                  ...(user
                    ? [{ to: '/account', label: 'My Account' }]
                    : [{ to: '/account', label: 'Sign In' }]),
                ].map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="block py-3 text-sm uppercase tracking-[0.15em] text-luxury-charcoal hover:text-luxury-gold transition-colors border-b border-neutral-100"
                  >
                    {link.label}
                  </Link>
                ))}
                {user && (
                  <button
                    onClick={logout}
                    className="w-full text-left py-3 text-sm uppercase tracking-[0.15em] text-neutral-400 hover:text-luxury-charcoal transition-colors border-b border-neutral-100 flex items-center gap-2"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                )}
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
