/**
 * Small HTTP helpers: Firebase ID-token auth, admin guard, rate limiting.
 */

/**
 * requireAuth(verifyIdToken) → middleware that verifies "Authorization: Bearer <Firebase ID token>"
 * and sets req.user = { uid, email, emailVerified, name, admin }.
 * Admin rights come ONLY from the `admin` custom claim, set via server/scripts/set-admin-claim.js.
 */
export function requireAuth(verifyIdToken) {
  return async (req, res, next) => {
    const header = req.get('authorization') || '';
    const match = header.match(/^Bearer (.+)$/);
    if (!match) return res.status(401).json({ error: 'Sign in required.' });
    try {
      const t = await verifyIdToken(match[1]);
      req.user = { uid: t.uid, email: t.email || '', emailVerified: Boolean(t.email_verified), name: t.name || '', admin: t.admin === true };
      return next();
    } catch {
      return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
    }
  };
}

export function requireAdmin(req, res, next) {
  if (!req.user?.admin) return res.status(403).json({ error: 'Not allowed.' });
  return next();
}

/**
 * Fixed-window in-memory rate limiter. Suitable for a single server instance;
 * use a shared store (e.g. Redis) if the API is scaled horizontally.
 */
export function rateLimit({ windowMs, max, key = (req) => req.ip, name = 'default' }) {
  const hits = new Map();
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
  }, windowMs);
  timer.unref?.();
  return (req, res, next) => {
    const k = `${name}:${key(req)}`;
    const now = Date.now();
    const entry = hits.get(k);
    if (!entry || entry.reset <= now) {
      hits.set(k, { count: 1, reset: now + windowMs });
      return next();
    }
    entry.count += 1;
    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.reset - now) / 1000)));
      return res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
    }
    return next();
  };
}
