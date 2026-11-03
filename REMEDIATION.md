# BrandClothzy — Security, Payment, Order & Performance Remediation

Status as of 2026-11-03. Everything below is implemented in this working tree. **Nothing has been deployed or committed.**
"Verified" means verified by automated tests or a local production build; anything else is marked **Unverified**.

## 1. Issue matrix

| # | Issue | Sev. | Root cause | Fix | Evidence |
|---|---|---|---|---|---|
| 1 | Browser controls payment amount; payments never verified | Critical | `Checkout.jsx` computed `amount` client-side, opened Razorpay without an `order_id`, and wrote the order itself on the browser "success" callback. Server endpoints existed but were unused and unauthenticated. | Server-authoritative flow (`server/app.js`): server prices the cart from its own catalog → persists `awaiting_payment` order with immutable snapshot → creates Razorpay order → browser pays that `order_id` → `/api/checkout/verify` checks HMAC signature (constant-time), fetches the payment from Razorpay, checks order/amount/currency, captures, transitions idempotently. Signature-verified webhook reconciles independently. | 30 tests in `server/test/payment.test.js` (₹1 attack, discount injection, tampered IDs, other customer's payment, invalid/forged signature, replay, browser closed, webhook before/after callback, duplicate webhooks, authorized-not-captured, amount/currency mismatch, refunds) |
| 2 | `/api/send-email` open relay | Critical | Endpoint accepted any `to`, `subject`, `html`, unauthenticated, CORS `origin: true`. Names interpolated into HTML unescaped. | Endpoint removed. Order confirmation is sent only by the server after a verified payment, to the stored order email. Welcome email: `POST /api/emails/welcome` requires a Firebase ID token, recipient = token email, once per account, per-user + per-IP rate limits. All template values HTML-escaped. CORS allowlist (`ALLOWED_ORIGINS`). Logs mask addresses and never include bodies. | 8 tests in `orders-and-email.test.js` |
| 3 | Size missing from every order | Critical | Cart stores `item.size`; checkout read `item.selectedSize` (never set). | Checkout sends `size`; server validates it against the product's sizes (required when the product has sizes, rejected when invalid, `size_applicable:false` when not applicable) and stores it in the snapshot, the seller copy and the confirmation email. Admin UI shows "Size: not recorded" for legacy orders. | 8 tests (multiple sizes, same product two sizes, merge, missing, invalid, no-size product, seller copy) |
| 4 | Paid orders can be lost | Critical | Order write happened in the browser after payment; failure still showed "success" with an invented order number. | Order is persisted **before** payment; payment only changes its state. DB writes retried; RTDB transactions make transitions idempotent; customer sees *confirmed* only after server confirmation, otherwise *Confirming…* (polls; server re-checks Razorpay) or *We're checking your payment*. Unmatched captured payments are audited. Admin "Payments needing attention" queue with *Re-check with Razorpay* and *Mark resolved*. Email failures never affect the order and are retried. | 7 recovery tests (DB transient/down, gateway down, DB down during verify, email failure, admin queue) |
| 5 | Sellers and products auto-approved | High | `addProduct`/`addProducts` wrote `status:'approved'`; `SellerContext` auto-promoted `verified→approved` and `onboarding_complete→live`. | New/edited seller products → `pending_review` (edits always re-review). Auto-promotions removed; explicit transition table; `suspended` state added; suspending/rejecting a seller unpublishes their products, reinstating republishes only those. Rejection requires a reason. Audit log for every moderation action. Checkout refuses products that are not approved or whose seller is not `live`. | 7 eligibility tests; rules tests (§4) |
| 6 | Admin = browser email comparison | High | `isAdmin()` compared `user.email`; no rules file in repo. | Admin = Firebase custom claim `admin:true` only (`server/scripts/set-admin-claim.js`). Version-controlled `database.rules.json` + `storage.rules` (least privilege; orders writable only by the server; even admins cannot change amounts/payment fields from the browser; sellers read only their own `seller_orders`). API verifies ID tokens (with revocation check) and the claim. | API auth tests ✓. **Rules tests written (`tests/rules/`) but Unverified** — emulator needs Java, not installed. |
| 7 | Price filters use base price | Medium | `p.price` compared with displayed ranges; ranges overlapped at boundaries. | `shared/pricing.js` is the single pricing policy used by storefront and server; products carry `customerPrice`; filters/sort use it; ranges are `[min, max)`. | 5 filter tests + 7 pricing tests |
| 8 | SEO shows base price | Medium | JSON-LD and meta description used `product.price`; MRP emitted as a plain price. | Customer price in `Offer.price` and meta description; MRP as `StrikethroughPrice`; Pixel values use customer price. | Headless Chrome on `/product/12`: `"price":355`, "Buy … at ₹355" |
| 9 | Sellers can't see the markup | Medium | — | Seller forms preview "Your price ₹X → customers pay ₹Y (includes 40% markup)" + commission on file; list and admin views show both. **Payout rules are not defined in code — confirm wording with the business.** | Build ✓ |
| 10 | Live keys in development | Low | Live keys in local `.env`; old live Key ID hard-coded in git history. | Server refuses live keys unless `NODE_ENV=production` or `ALLOW_LIVE_PAYMENTS_IN_DEV=true`; validates config at startup without printing secrets; browser no longer needs any Razorpay key. History scan: only an **old Key ID** (`rzp_live_SZRH…`, public by design) was committed — no secrets. | 3 config tests |
| 11 | Color filter without color data | Low | — | Removed filter UI, state, and `colorOptions`; product `colors` data kept. | Filter tests ✓ |
| 12 | 766 KB main bundle | Low | Firebase Storage + Analytics loaded eagerly; single vendor bundle; 1.8 MB PNG hero. | See §3. | Measured |

Additional defects found and fixed during the work: Account page showed order totals ×1.96 (markup applied twice); welcome email sent twice on sign-up; newsletter required a publicly readable subscriber list (now write-only `newsletter_subscribers/{key}`); old unauthenticated `/api/create-order` could create Razorpay orders/QR codes for any amount (removed); admin product preview showed only base price; seller revenue now on base price.

## 2. Test evidence

`npm test` → **79 passing, 0 failing** (12 pricing/filter + 67 API). Rules suite: `npm run test:rules` (needs Java 11+). Production build passes; `/`, `/shop`, `/product/12`, `/cart`, `/checkout`, `/account` render in headless Chrome.

**Not verified here:** real Razorpay (test-mode) payments end-to-end, real webhook delivery, Firebase rules in the emulator, real SMTP, Lighthouse/Core Web Vitals (Lighthouse could not run: the disk had < 200 MB free).

## 3. Performance (measured, lab only)

| Metric | Before | After |
|---|---|---|
| JS on first load | 1 file, 768.7 KB (192.5 KB gzip) | 4 files, 703.3 KB (180.0 KB gzip); Storage + Analytics deferred |
| Vendor caching | one hash for everything | `vendor-react`, `vendor-firebase-core`, `vendor-firebase-db` cached independently |
| Hero (LCP) image | `hero.png` 1,769 KB | AVIF 16–41 KB / WebP 21–56 KB, responsive, `fetchpriority=high`, sized |
| Product card image | ~75 KB each (1024 px) | ~21 KB (480 px `srcset`) |

LCP/INP/CLS/FCP/TTFB were **not measured** (see §2). Further opportunity: lazy-load `firebase/database` (~41 KB gzip) — requires refactoring 6 modules. `public/men1.png`, `public/men2.png` (4 MB) are unused; `public/menswear.csv`/`womenwear.csv` (scraped data) are publicly served.

## 4. Deployment runbook (in this order)

1. **Razorpay:** create **test** keys for development. Dashboard → Webhooks: URL `https://<api-host>/api/webhooks/razorpay`, events `payment.authorized, payment.captured, payment.failed, order.paid, refund.created, refund.processed`, copy the webhook secret.
2. **Firebase service account:** Console → Project settings → Service accounts → Generate key. Store outside the repo.
3. **server/.env** per `server/.env.example` (`ALLOWED_ORIGINS`, keys, webhook secret, credentials, SMTP).
4. **Grant admin:** `cd server && node scripts/set-admin-claim.js grant <owner email>` — must be done **before** deploying the rules, or the admin panel stops working.
5. **Deploy the API** (`npm start` sets `NODE_ENV=production`). Set `VITE_API_URL` in the frontend `.env` to its URL and rebuild.
6. **Deploy rules:** `npx firebase-tools deploy --only database,storage` (after running `npm run test:rules`).
7. **Legacy data report:** `node scripts/report-legacy-data.js` (read-only); `--flag` adds review flags without unpublishing anything.
8. **Deploy the storefront** (`dist/`). Configure SPA fallback and cache headers (`public/_headers` covers Netlify/Cloudflare Pages).
9. **Smoke test with test keys:** pay, close the browser mid-payment, refund — confirm states in the admin queue.

**Rotate the Razorpay live secret** — it was shared in a chat transcript.
