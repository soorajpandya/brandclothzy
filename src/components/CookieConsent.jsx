import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getConsent, setConsent } from '../utils/consent';

/**
 * Cookie / tracking consent banner. Shown until the visitor chooses; reopened from the
 * Cookie Preferences page. Analytics, Meta Pixel and Clarity load only after "Accept".
 */
export default function CookieConsent() {
  const [open, setOpen] = useState(() => getConsent() === null);

  useEffect(() => {
    const reopen = () => setOpen(true);
    window.addEventListener('bcz:open-consent', reopen);
    return () => window.removeEventListener('bcz:open-consent', reopen);
  }, []);

  if (!open) return null;

  const choose = (analytics) => {
    setConsent(analytics);
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[60] p-4 sm:p-6 pointer-events-none"
    >
      <div className="pointer-events-auto max-w-3xl mx-auto bg-white border border-neutral-200 shadow-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed flex-1">
          We use cookies to understand how the site is used and to measure our ads (Google Analytics,
          Meta Pixel and Microsoft Clarity). They load only if you accept. Essential cookies for sign-in and
          checkout are always on.{' '}
          <Link to="/cookies" className="underline underline-offset-2 text-luxury-charcoal">Learn more</Link>
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => choose(false)}
            className="px-4 py-2.5 text-[11px] uppercase tracking-[0.15em] border border-neutral-300 text-neutral-600 hover:border-luxury-charcoal"
          >
            Essential only
          </button>
          <button
            type="button"
            onClick={() => choose(true)}
            className="px-4 py-2.5 text-[11px] uppercase tracking-[0.15em] bg-luxury-charcoal text-white hover:bg-black"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
