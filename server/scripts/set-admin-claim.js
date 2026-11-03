/**
 * Grants or revokes the Firebase custom claim `admin: true`.
 * This is the ONLY way to become an administrator — the database rules and the API
 * both check `auth.token.admin === true`.
 *
 * Usage (from server/, with Firebase Admin credentials configured as for the API):
 *   node scripts/set-admin-claim.js grant  owner@example.com
 *   node scripts/set-admin-claim.js revoke owner@example.com
 *   node scripts/set-admin-claim.js list   owner@example.com
 *
 * The user must sign out and back in (or wait up to 1 hour) for the claim to apply.
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const [action, email] = process.argv.slice(2);
if (!['grant', 'revoke', 'list'].includes(action) || !email) {
  console.error('Usage: node scripts/set-admin-claim.js <grant|revoke|list> <email>');
  process.exit(1);
}

const app = initializeApp({
  credential: process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) : applicationDefault(),
  projectId: process.env.FIREBASE_PROJECT_ID || 'brandclothzy',
  databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://brandclothzy-default-rtdb.firebaseio.com',
});
const auth = getAuth(app);
const user = await auth.getUserByEmail(email);

if (action === 'list') {
  console.log(`${email}: claims =`, user.customClaims || {});
  process.exit(0);
}
if (action === 'grant' && !user.emailVerified) {
  console.error(`Refusing: ${email} has not verified their email address.`);
  process.exit(1);
}

const claims = { ...(user.customClaims || {}) };
if (action === 'grant') claims.admin = true;
else delete claims.admin;
await auth.setCustomUserClaims(user.uid, claims);
await auth.revokeRefreshTokens(user.uid); // force a fresh token with the new claim
await getDatabase(app).ref('audit_logs').push({ type: `admin_claim_${action}`, target_uid: user.uid, actor: 'cli', at: new Date().toISOString() });
console.log(`${action === 'grant' ? 'Granted' : 'Revoked'} admin for ${email} (uid ${user.uid}). They must sign in again.`);
process.exit(0);
