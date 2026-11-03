#!/usr/bin/env bash
# Deploys the BrandClothzy API to Google Cloud Run (Mumbai). Run it in Google Cloud Shell
# (https://shell.cloud.google.com) from the repository root:
#
#   bash deploy/cloud-run.sh setup                 # once: APIs, service account, secrets
#   bash deploy/cloud-run.sh deploy                # build + deploy (repeat for every update)
#   bash deploy/cloud-run.sh grant-admin <email>   # once: make <email> a BrandClothzy admin
#   bash deploy/cloud-run.sh tracking              # optional: GA4 + Meta server-side purchase secrets
#   bash deploy/cloud-run.sh rotate-webhook-secret # new Razorpay webhook secret (update Razorpay after)
#   bash deploy/cloud-run.sh info                  # print the API and webhook URLs
#
# Secrets are typed in (hidden) and stored in Secret Manager — never in files or the image.
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-brandclothzy}"
REGION="${REGION:-asia-south1}"                 # Mumbai
SERVICE="${SERVICE:-brandclothzy-api}"
SA_NAME="brandclothzy-api"
SA="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
ALLOWED_ORIGINS="${ALLOWED_ORIGINS:-https://brandclothzy.com,https://www.brandclothzy.com}"
PUBLIC_SITE_URL="${PUBLIC_SITE_URL:-https://brandclothzy.com}"
DATABASE_URL="${DATABASE_URL:-https://brandclothzy-default-rtdb.firebaseio.com}"
GA4_MEASUREMENT_ID="${GA4_MEASUREMENT_ID:-G-K6G07KR20D}"
META_PIXEL_ID="${META_PIXEL_ID:-1261232606125599}"

gcloud config set project "$PROJECT_ID" >/dev/null

secret_exists() { gcloud secrets describe "$1" >/dev/null 2>&1; }

new_webhook_secret() {
  local secret
  secret="$(openssl rand -hex 32)"
  if secret_exists razorpay-webhook-secret; then
    printf '%s' "$secret" | gcloud secrets versions add razorpay-webhook-secret --data-file=- >/dev/null
  else
    printf '%s' "$secret" | gcloud secrets create razorpay-webhook-secret --replication-policy=automatic --data-file=- >/dev/null
  fi
  gcloud secrets add-iam-policy-binding razorpay-webhook-secret --member="serviceAccount:$SA" --role=roles/secretmanager.secretAccessor >/dev/null
  echo
  echo "  New webhook secret. Paste it into Razorpay → Webhooks → Secret, then run: bash deploy/cloud-run.sh deploy"
  echo "  $secret"
  echo
}

put_secret() { # name, prompt
  local name="$1" prompt="$2" value
  read -r -s -p "$prompt: " value; echo
  if [ -z "$value" ]; then echo "  (skipped $name)"; return; fi
  if secret_exists "$name"; then
    printf '%s' "$value" | gcloud secrets versions add "$name" --data-file=- >/dev/null
  else
    printf '%s' "$value" | gcloud secrets create "$name" --replication-policy=automatic --data-file=- >/dev/null
  fi
  gcloud secrets add-iam-policy-binding "$name" --member="serviceAccount:$SA" --role=roles/secretmanager.secretAccessor >/dev/null
  echo "  saved $name"
}

case "${1:-}" in
setup)
  echo "→ Enabling APIs (Cloud Run, Cloud Build, Artifact Registry, Secret Manager)…"
  gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com

  echo "→ Creating service account $SA (least privilege)…"
  gcloud iam service-accounts describe "$SA" >/dev/null 2>&1 || \
    gcloud iam service-accounts create "$SA_NAME" --display-name="BrandClothzy API (Cloud Run)"
  for role in roles/firebasedatabase.admin roles/firebaseauth.viewer; do
    gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$SA" --role="$role" --condition=None >/dev/null
  done

  echo "→ Secrets (input is hidden; press Enter to skip an optional one)"
  read -r -p "Razorpay Key ID (rzp_test_… to test first, rzp_live_… for real payments): " KEY_ID
  gcloud secrets describe razorpay-key-id >/dev/null 2>&1 && printf '%s' "$KEY_ID" | gcloud secrets versions add razorpay-key-id --data-file=- >/dev/null || \
    printf '%s' "$KEY_ID" | gcloud secrets create razorpay-key-id --replication-policy=automatic --data-file=- >/dev/null
  gcloud secrets add-iam-policy-binding razorpay-key-id --member="serviceAccount:$SA" --role=roles/secretmanager.secretAccessor >/dev/null
  put_secret razorpay-key-secret "Razorpay Key Secret"
  if secret_exists razorpay-webhook-secret; then
    echo "  Keeping the existing Razorpay webhook secret (use rotate-webhook-secret to change it)."
  else
    new_webhook_secret
  fi
  put_secret smtp-pass "SMTP password (optional)"
  echo "✓ Setup done. Next: bash deploy/cloud-run.sh deploy"
  ;;

deploy)
  SECRETS="RAZORPAY_KEY_ID=razorpay-key-id:latest,RAZORPAY_KEY_SECRET=razorpay-key-secret:latest,RAZORPAY_WEBHOOK_SECRET=razorpay-webhook-secret:latest"
  secret_exists smtp-pass && SECRETS="$SECRETS,SMTP_PASS=smtp-pass:latest"
  secret_exists ga4-api-secret && SECRETS="$SECRETS,GA4_API_SECRET=ga4-api-secret:latest"
  secret_exists meta-capi-token && SECRETS="$SECRETS,META_CAPI_TOKEN=meta-capi-token:latest"
  ENV_VARS="^@^NODE_ENV=production@ALLOWED_ORIGINS=${ALLOWED_ORIGINS}@PUBLIC_SITE_URL=${PUBLIC_SITE_URL}@FIREBASE_PROJECT_ID=${PROJECT_ID}@FIREBASE_DATABASE_URL=${DATABASE_URL}@RAZORPAY_CAPTURE_MODE=server@GA4_MEASUREMENT_ID=${GA4_MEASUREMENT_ID}@META_PIXEL_ID=${META_PIXEL_ID}"
  [ -n "${SMTP_HOST:-}" ] && ENV_VARS="${ENV_VARS}@SMTP_HOST=${SMTP_HOST}@SMTP_PORT=${SMTP_PORT:-465}@SMTP_USER=${SMTP_USER:-}@SMTP_FROM=${SMTP_FROM:-}"

  echo "→ Building and deploying $SERVICE to $REGION…"
  # max-instances=1: the API's rate limiter keeps counts in memory (one instance = one set of counts).
  gcloud run deploy "$SERVICE" \
    --source . \
    --region "$REGION" \
    --service-account "$SA" \
    --allow-unauthenticated \
    --max-instances 1 \
    --min-instances 0 \
    --memory 512Mi \
    --cpu 1 \
    --timeout 60 \
    --set-env-vars "$ENV_VARS" \
    --set-secrets "$SECRETS"
  bash "$0" info
  ;;

grant-admin)
  EMAIL="${2:?Usage: bash deploy/cloud-run.sh grant-admin you@example.com}"
  # Uses the project's built-in Firebase Admin SDK account via a short-lived key that is
  # deleted immediately afterwards.
  ADMIN_SA="$(gcloud iam service-accounts list --filter='email~firebase-adminsdk' --format='value(email)' | head -1)"
  [ -n "$ADMIN_SA" ] || { echo "Firebase Admin SDK service account not found"; exit 1; }
  KEYFILE="$(mktemp)"
  gcloud iam service-accounts keys create "$KEYFILE" --iam-account="$ADMIN_SA" >/dev/null
  KEY_ID="$(python3 -c "import json;print(json.load(open('$KEYFILE'))['private_key_id'])")"
  # Always delete the temporary key, even if the grant fails.
  cleanup() { gcloud iam service-accounts keys delete "$KEY_ID" --iam-account="$ADMIN_SA" --quiet >/dev/null 2>&1 && echo "✓ Temporary key deleted."; rm -f "$KEYFILE"; }
  trap cleanup EXIT
  (cd server && npm ci --omit=dev --silent)
  (cd server && GOOGLE_APPLICATION_CREDENTIALS="$KEYFILE" FIREBASE_PROJECT_ID="$PROJECT_ID" FIREBASE_DATABASE_URL="$DATABASE_URL" node scripts/set-admin-claim.js grant "$EMAIL")
  ;;

tracking)
  echo "Server-side purchase reporting (both optional; press Enter to skip one)."
  echo "  GA4: Google Analytics → Admin → Data streams → Web → Measurement Protocol API secrets → Create"
  put_secret ga4-api-secret "GA4 Measurement Protocol API secret"
  echo "  Meta: Events Manager → your Pixel → Settings → Conversions API → Generate access token"
  put_secret meta-capi-token "Meta Conversions API access token"
  echo "✓ Saved. Apply with: bash deploy/cloud-run.sh deploy"
  ;;

rotate-webhook-secret)
  new_webhook_secret
  ;;

info)
  URL="$(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)')"
  echo
  echo "API URL:          $URL"
  echo "Health check:     $(curl -s "$URL/api/health" || echo 'unreachable')"
  echo "Razorpay webhook: $URL/api/webhooks/razorpay"
  echo "Storefront .env:  VITE_API_URL=$URL"
  ;;

*)
  sed -n '2,10p' "$0"
  exit 1
  ;;
esac
