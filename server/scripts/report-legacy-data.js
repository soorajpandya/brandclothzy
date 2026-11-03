/**
 * Read-only report on data created before the remediation (issues 3 and 5).
 *
 *   node scripts/report-legacy-data.js          # report only (default, writes nothing)
 *   node scripts/report-legacy-data.js --flag   # also adds review flags (never unpublishes)
 *
 * 1. Orders with blank sizes: legacy checkout read `item.selectedSize`, which never existed,
 *    so every legacy order item was saved without a size. Sizes CANNOT be reconstructed from
 *    trustworthy data — contact the customer before dispatch. With --flag, each affected
 *    order gets `size_remediation: 'contact_customer'` (no other field changes).
 * 2. Sellers that went live through the old automatic promotions (status live but not
 *    verified, or catalog not approved). With --flag: `review_flag: 'auto_approved_legacy'`.
 * 3. Approved marketplace products with no reviewer recorded (auto-approved on upload).
 *    With --flag: `review_flag: 'auto_approved_legacy'`. They stay published.
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });
const FLAG = process.argv.includes('--flag');

const app = initializeApp({
  credential: process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) : applicationDefault(),
  projectId: process.env.FIREBASE_PROJECT_ID || 'brandclothzy',
  databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://brandclothzy-default-rtdb.firebaseio.com',
});
const db = getDatabase(app);
const val = async (p) => (await db.ref(p).get()).val() || {};
const list = (v) => (Array.isArray(v) ? v : Object.values(v || {}));

const [orders, sellers, products] = await Promise.all([val('orders'), val('sellers'), val('products')]);
const updates = {};

const blankSize = Object.entries(orders).filter(([, o]) => list(o.items).some((i) => !i?.size && i?.size_applicable !== false));
console.log(`\n1) Orders with at least one item missing a size: ${blankSize.length}`);
for (const [id, o] of blankSize) {
  console.log(`   ${id}  ${o.created_at || ''}  status=${o.status}  items=${list(o.items).map((i) => i.name).join(' | ')}`);
  updates[`orders/${id}/size_remediation`] = 'contact_customer';
}

const autoSellers = Object.entries(sellers).filter(([, s]) => s.status === 'live' && (s.verification?.verified !== true || s.catalog_sample?.approved !== true));
console.log(`\n2) Live sellers without verification or catalog approval: ${autoSellers.length}`);
for (const [id, s] of autoSellers) {
  console.log(`   ${id}  ${s.brand_name || ''}  verified=${Boolean(s.verification?.verified)} catalog_approved=${Boolean(s.catalog_sample?.approved)}`);
  updates[`sellers/${id}/review_flag`] = 'auto_approved_legacy';
}

const autoProducts = Object.entries(products).filter(([, p]) => p.status === 'approved' && !p.reviewed_by);
console.log(`\n3) Approved products with no reviewer recorded: ${autoProducts.length}`);
for (const [id, p] of autoProducts) {
  console.log(`   ${id}  ${p.name || ''}  seller=${p.seller_id || ''}`);
  updates[`products/${id}/review_flag`] = 'auto_approved_legacy';
}

if (FLAG && Object.keys(updates).length) {
  await db.ref().update(updates);
  await db.ref('audit_logs').push({ type: 'legacy_remediation_flags', count: Object.keys(updates).length, actor: 'cli', at: new Date().toISOString() });
  console.log(`\nFlagged ${Object.keys(updates).length} records (nothing was unpublished).`);
} else {
  console.log('\nReport only — nothing was changed. Re-run with --flag to add review flags.');
}
process.exit(0);
