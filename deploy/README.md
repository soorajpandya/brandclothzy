# Deploying the BrandClothzy API to Google Cloud Run (Mumbai)

Everything runs in **Google Cloud Shell** (a free terminal in your browser with all tools installed),
so nothing needs to be installed on your computer.

## Before you start
- Billing must be enabled on the `brandclothzy` Google Cloud project (Firebase Console → ⚙ → Usage and billing → Blaze plan). Cloud Run and Secret Manager need it.
- Have your Razorpay **Key ID** and **Key Secret** ready (Razorpay Dashboard → Account & Settings → API Keys). Start with **test-mode** keys.

## 1. Open Cloud Shell and get the code
Open https://shell.cloud.google.com (sign in with the Google account that owns the Firebase project), then:
```bash
git clone https://github.com/soorajpandya/brandclothzy.git
cd brandclothzy
git checkout <branch-with-these-changes>
```

## 2. One-time setup
```bash
bash deploy/cloud-run.sh setup
```
It enables the required Google services, creates a dedicated service account with only the
roles the API needs (Realtime Database admin, Auth viewer, secret access), and asks for:
- Razorpay Key ID and Key Secret (typed input is hidden; stored in Secret Manager)
- SMTP password (optional — press Enter to skip)

It **generates the Razorpay webhook secret and prints it once** — copy it for step 4.

## 3. Deploy
```bash
bash deploy/cloud-run.sh deploy
```
Takes ~3–5 minutes the first time. At the end it prints:
```
API URL:          https://brandclothzy-api-xxxxxxxxxx-el.a.run.app
Health check:     {"ok":true}
Razorpay webhook: https://brandclothzy-api-xxxxxxxxxx-el.a.run.app/api/webhooks/razorpay
Storefront .env:  VITE_API_URL=https://brandclothzy-api-xxxxxxxxxx-el.a.run.app
```
Optional email sending:
`SMTP_HOST=smtp.example.com SMTP_USER=orders@brandclothzy.com SMTP_FROM='"BrandClothzy" <orders@brandclothzy.com>' bash deploy/cloud-run.sh deploy`

## 4. Add the webhook in Razorpay
Razorpay Dashboard → Account & Settings → Webhooks → **Add New Webhook**
- **URL:** the "Razorpay webhook" line from step 3
- **Secret:** the secret printed in step 2
- **Events:** `payment.authorized`, `payment.captured`, `payment.failed`, `order.paid`, `refund.created`, `refund.processed`

Do it in **test mode** first; repeat in **live mode** when you switch to live keys.

## 5. Make yourself an admin
```bash
bash deploy/cloud-run.sh grant-admin you@yourdomain.com
```
Sign out of the website and back in afterwards.

## 6. Point the storefront at the API and deploy the rules
- In the storefront `.env`: `VITE_API_URL=<API URL from step 3>`, then `npm run build` and redeploy the site.
- Deploy the database and storage rules (from Cloud Shell, after step 5):
  `npx firebase-tools deploy --only database,storage --project brandclothzy`

## Switching to live payments
Re-run `bash deploy/cloud-run.sh setup` and enter the live Key ID/Secret (a new webhook secret is
generated — add it to the Razorpay **live-mode** webhook), then `bash deploy/cloud-run.sh deploy`.

## Notes
- `--max-instances 1` is deliberate: the API's rate limiter keeps counts in memory.
- `--min-instances 0` keeps costs near zero; the first request after idle takes a few seconds. For
  instant checkout at all times, redeploy with `--min-instances 1` (billed continuously).
- If the storefront is not on `brandclothzy.com`/`www.brandclothzy.com`, set it when deploying:
  `ALLOWED_ORIGINS=https://your-domain bash deploy/cloud-run.sh deploy`
- Logs: Cloud Console → Cloud Run → brandclothzy-api → Logs. Secrets are never logged.
