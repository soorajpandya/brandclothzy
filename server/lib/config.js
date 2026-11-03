/**
 * Validates server configuration at startup. Never logs secret values.
 */
export function loadConfig(env = process.env) {
  const errors = [];
  const warnings = [];

  const nodeEnv = env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';

  const keyId = env.RAZORPAY_KEY_ID || '';
  const keySecret = env.RAZORPAY_KEY_SECRET || '';
  const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET || '';
  const razorpayMode = keyId.startsWith('rzp_live_') ? 'live' : keyId.startsWith('rzp_test_') ? 'test' : 'unknown';

  if (!keyId || !keySecret) errors.push('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required.');
  else if (razorpayMode === 'unknown') errors.push('RAZORPAY_KEY_ID must start with rzp_test_ or rzp_live_.');

  // Live keys outside production must be an explicit, deliberate choice.
  if (razorpayMode === 'live' && !isProduction && env.ALLOW_LIVE_PAYMENTS_IN_DEV !== 'true') {
    errors.push(
      'Live Razorpay keys detected while NODE_ENV is not "production". Use rzp_test_ keys for development, ' +
        'or set ALLOW_LIVE_PAYMENTS_IN_DEV=true if you really intend to take real payments locally.'
    );
  }
  if (razorpayMode === 'test' && isProduction) {
    warnings.push('Razorpay TEST keys are configured in production — customers cannot pay real money.');
  }
  if (!webhookSecret) {
    warnings.push('RAZORPAY_WEBHOOK_SECRET is not set — webhook reconciliation is disabled (POST /api/webhooks/razorpay returns 503).');
  }

  const allowedOrigins = (env.ALLOWED_ORIGINS || (isProduction ? '' : 'http://localhost:5173,http://localhost:5174'))
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowedOrigins.length === 0) errors.push('ALLOWED_ORIGINS must list the storefront origin(s), e.g. https://brandclothzy.com');

  const firebaseProjectId = env.FIREBASE_PROJECT_ID || 'brandclothzy';
  const firebaseDatabaseURL = env.FIREBASE_DATABASE_URL || 'https://brandclothzy-default-rtdb.firebaseio.com';
  // On Google Cloud Run (K_SERVICE is set by the platform) the service's own identity is used
  // automatically — no key file needed. FIREBASE_USE_ADC=true opts in elsewhere (e.g. Cloud Shell).
  const onGoogleCloud = Boolean(env.K_SERVICE) || env.FIREBASE_USE_ADC === 'true';
  const hasServiceAccount = Boolean(env.FIREBASE_SERVICE_ACCOUNT_JSON || env.GOOGLE_APPLICATION_CREDENTIALS) || onGoogleCloud;
  if (!hasServiceAccount) {
    errors.push(
      'Firebase Admin credentials missing: deploy on Cloud Run, or set GOOGLE_APPLICATION_CREDENTIALS (path to a ' +
        'service-account JSON) or FIREBASE_SERVICE_ACCOUNT_JSON. The server needs them to create and verify orders.'
    );
  }

  const smtpConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
  if (!smtpConfigured) warnings.push('SMTP is not configured — transactional emails are logged, not sent.');

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    nodeEnv,
    isProduction,
    port: Number(env.PORT || 5000),
    razorpay: { keyId, keySecret, webhookSecret, mode: razorpayMode, captureMode: env.RAZORPAY_CAPTURE_MODE === 'manual' ? 'manual' : 'server' },
    allowedOrigins,
    firebase: { projectId: firebaseProjectId, databaseURL: firebaseDatabaseURL, serviceAccountJson: env.FIREBASE_SERVICE_ACCOUNT_JSON || '' },
    smtpConfigured,
    publicSiteUrl: env.PUBLIC_SITE_URL || 'https://brandclothzy.com',
  };
}
