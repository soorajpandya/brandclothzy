import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const { default: Razorpay } = await import('razorpay');
const { initializeApp, cert, applicationDefault } = await import('firebase-admin/app');
const { getAuth } = await import('firebase-admin/auth');
const { getDatabase } = await import('firebase-admin/database');
const { loadConfig } = await import('./lib/config.js');
const { createRtdbStore } = await import('./lib/store.js');
const { createMailer } = await import('./lib/mailer.js');
const { createApp } = await import('./app.js');

const config = loadConfig();
for (const w of config.warnings) console.warn(`[config] WARNING: ${w}`);
if (!config.ok) {
  for (const e of config.errors) console.error(`[config] ERROR: ${e}`);
  console.error('[config] Refusing to start. See server/.env.example.');
  process.exit(1);
}

const firebaseApp = initializeApp({
  credential: config.firebase.serviceAccountJson ? cert(JSON.parse(config.firebase.serviceAccountJson)) : applicationDefault(),
  projectId: config.firebase.projectId,
  databaseURL: config.firebase.databaseURL,
});
const adminAuth = getAuth(firebaseApp);

const app = createApp({
  config,
  store: createRtdbStore(getDatabase(firebaseApp)),
  razorpay: new Razorpay({ key_id: config.razorpay.keyId, key_secret: config.razorpay.keySecret }),
  // checkRevoked=true so disabled / signed-out accounts cannot keep using old tokens.
  verifyIdToken: (token) => adminAuth.verifyIdToken(token, true),
  mailer: createMailer(),
});

app.listen(config.port, () => {
  console.log(`[api] listening on :${config.port} (${config.nodeEnv}, Razorpay ${config.razorpay.mode} mode, capture=${config.razorpay.captureMode})`);
});
