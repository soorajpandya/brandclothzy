/**
 * Visitor consent for analytics & marketing (DPDP Act / Meta terms).
 * No analytics, pixel or session-recording script loads until the visitor accepts.
 * The choice is remembered in this browser; "Cookie settings" in the footer reopens the banner.
 */
const KEY = 'bcz_consent_v1';
const listeners = new Set();

export function getConsent() {
  try {
    const raw = localStorage.getItem(KEY);
    const v = raw ? JSON.parse(raw) : null;
    return v && typeof v.analytics === 'boolean' ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(analytics) {
  const value = { analytics: Boolean(analytics), at: new Date().toISOString() };
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* private mode: choice lasts for this page view only */
  }
  listeners.forEach((fn) => fn(value));
}

export const hasAnalyticsConsent = () => getConsent()?.analytics === true;

export function onConsentChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Lets the footer "Cookie settings" link reopen the banner. */
export function openConsentSettings() {
  window.dispatchEvent(new CustomEvent('bcz:open-consent'));
}
