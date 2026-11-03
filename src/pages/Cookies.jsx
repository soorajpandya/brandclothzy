import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Button from '../components/Button';
import { useUI } from '../context/UIContext';
import SEO from '../components/SEO';
import { getConsent, setConsent } from '../utils/consent';

const cookieTypes = [
  { id: 'essential', label: 'Essential Cookies', description: 'Required for the website to work: sign-in, your shopping bag, secure checkout and fraud prevention (Firebase, Razorpay). These cannot be turned off.', required: true },
  { id: 'analytics', label: 'Analytics & Marketing', description: 'Google Analytics (how visitors use the site), Meta Pixel (measuring our Facebook and Instagram ads) and Microsoft Clarity (anonymous heatmaps and session recordings; form fields are masked). When you place an order with these on, we also report the verified purchase from our server to Google and Meta, using hashed contact details, so ad results stay accurate.' },
];

export default function Cookies() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);
  const { addToast } = useUI();
  const [preferences, setPreferences] = useState(() => ({ essential: true, analytics: getConsent()?.analytics === true }));

  const toggle = (id) => {
    if (id === 'essential') return;
    setPreferences((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = () => {
    setConsent(preferences.analytics);
    addToast('Cookie preferences saved.', 'success');
  };

  const handleAcceptAll = () => {
    setPreferences({ essential: true, analytics: true });
    setConsent(true);
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
