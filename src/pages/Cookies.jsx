import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Button from '../components/Button';
import { useUI } from '../context/UIContext';
import SEO from '../components/SEO';

const cookieTypes = [
  { id: 'essential', label: 'Essential Cookies', description: 'Required for the website to function. These cannot be disabled. They include session management, shopping cart, and security cookies.', required: true },
  { id: 'analytics', label: 'Analytics Cookies', description: 'Help us understand how visitors interact with our website. Data is anonymised and used solely to improve the user experience.' },
  { id: 'marketing', label: 'Marketing Cookies', description: 'Used to deliver personalised advertisements and measure the effectiveness of our marketing campaigns across platforms.' },
  { id: 'functional', label: 'Functional Cookies', description: 'Enable enhanced features such as remembering your preferences, language settings, and previously viewed products.' },
];

export default function Cookies() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);
  const { addToast } = useUI();
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: true,
    marketing: false,
    functional: true,
  });

  const toggle = (id) => {
    if (id === 'essential') return;
    setPreferences((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = () => {
    addToast('Cookie preferences saved successfully.', 'success');
  };

  const handleAcceptAll = () => {
    setPreferences({ essential: true, analytics: true, marketing: true, functional: true });
    addToast('All cookies accepted.', 'success');
  };

  return (
    <div className="pt-24 lg:pt-28 pb-20">
      <SEO
        title="Cookie Preferences"
        path="/cookies"
        description="Manage your cookie preferences on BrandClothzy. Control analytics and marketing cookies."
        keywords="BrandClothzy cookies, cookie policy, cookie preferences"
      />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <nav className="flex items-center gap-2 py-4 text-[11px] text-neutral-400">
          <Link to="/" className="hover:text-luxury-charcoal transition-colors">Home</Link>
          <ChevronRight size={11} />
          <span className="text-luxury-charcoal">Cookie Preferences</span>
        </nav>

        <div className="max-w-3xl mx-auto mt-8">
          <h1 className="font-serif text-4xl text-luxury-charcoal mb-4">Cookie Preferences</h1>
          <p className="text-sm text-neutral-500 font-light leading-relaxed mb-12">
            We use cookies to enhance your experience on our website. You can manage your preferences below.
            For more information, please read our{' '}
            <Link
              to="/privacy"
              onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}
              className="text-luxury-charcoal underline hover:text-luxury-gold transition-colors"
            >
              Privacy Policy
            </Link>.
          </p>

          <div className="space-y-6 mb-10">
            {cookieTypes.map(({ id, label, description, required }) => (
              <div key={id} className="flex items-start justify-between gap-6 p-6 border border-neutral-100">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-luxury-charcoal">{label}</h3>
                    {required && (
                      <span className="text-[9px] uppercase tracking-[0.1em] text-luxury-taupe bg-neutral-100 px-2 py-0.5">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-500 font-light leading-relaxed">{description}</p>
                </div>
                <button
                  onClick={() => toggle(id)}
                  className={`relative flex-shrink-0 w-12 h-7 rounded-full transition-colors ${
                    preferences[id] ? 'bg-luxury-charcoal' : 'bg-neutral-200'
                  } ${required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  disabled={required}
                  aria-label={`Toggle ${label}`}
                >
                  <span
                    className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      preferences[id] ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <Button onClick={handleSave}>Save Preferences</Button>
            <Button variant="outline" onClick={handleAcceptAll}>Accept All</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
