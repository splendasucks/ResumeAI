#!/usr/bin/env bash
# Apply Clerk Development API keys (pk_test_/sk_test_) for temporary public deploy without a custom domain.
# Sets CLERK_ALLOW_DEVELOPMENT_KEYS=true on Doppler prd so the app accepts dev keys on resume-ai-app.vercel.app.
# Usage:
#   ./scripts/apply-clerk-development.sh [<pk_test_...> <sk_test_...>]
# Or (loads .env.local from repo root when no args):
#   ./scripts/apply-clerk-development.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ $# -eq 0 && -f "$ROOT/.env.local" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$ROOT/.env.local"
  set +a
fi

PK="${1:-${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-}}"
SK="${2:-${CLERK_SECRET_KEY:-}}"
PROJECT="${DOPPLER_PROJECT:-resumeai}"
PROD_URL="${PRODUCTION_BASE_URL:-https://resume-ai-app.vercel.app}"

if [[ -z "$PK" || -z "$SK" ]]; then
  echo "Usage: $0 [<pk_test_...> <sk_test_...>]" >&2
  echo "With no args, reads NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY from .env.local." >&2
  echo "Create a new Clerk Application (Development) in https://dashboard.clerk.com/ if you hit the 500-user cap." >&2
  exit 1
fi

if [[ "$PK" != pk_test_* ]]; then
  echo "Error: publishable key must start with pk_test_ (got ${PK:0:12}...)" >&2
  exit 1
fi

if [[ "$SK" != sk_test_* ]]; then
  echo "Error: secret key must start with sk_test_ (got ${SK:0:12}...)" >&2
  exit 1
fi

echo "Verifying keys against Clerk API..."
ENV_TYPE=$(curl -sS -H "Authorization: Bearer $SK" "https://api.clerk.com/v1/instance" | node -e "
let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
  const j=JSON.parse(d);
  if(j.errors){console.error(JSON.stringify(j));process.exit(1);}
  console.log(j.environment_type||'unknown');
})")

if [[ "$ENV_TYPE" != "development" ]]; then
  echo "Error: Clerk instance environment_type is '$ENV_TYPE', expected 'development'." >&2
  echo "Use ./scripts/apply-clerk-production.sh for pk_live_/sk_live_ keys." >&2
  exit 1
fi

INSTANCE_ID=$(curl -sS -H "Authorization: Bearer $SK" "https://api.clerk.com/v1/instance" | node -e "
let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
  const j=JSON.parse(d);
  if(j.errors){console.error(JSON.stringify(j));process.exit(1);}
  console.log(j.id);
})")

RETIRED_INSTANCE_ID="${CLERK_RETIRED_INSTANCE_ID:-ins_3D4lJzi93lEUu5YRR4xFgB5Y3pf}"
if [[ "$INSTANCE_ID" == "$RETIRED_INSTANCE_ID" ]]; then
  echo "Error: these keys belong to the exhausted Clerk app (instance $RETIRED_INSTANCE_ID, 500-user cap)." >&2
  echo "Create a new application at https://dashboard.clerk.com/apps/new (e.g. ResumeAI) and use its API keys." >&2
  exit 1
fi

EXPECTED_INSTANCE_ID="${CLERK_EXPECTED_INSTANCE_ID:-ins_3DmIBkDGfeSViZWmCWtEaElPIaj}"
if [[ -n "$EXPECTED_INSTANCE_ID" && "$INSTANCE_ID" != "$EXPECTED_INSTANCE_ID" ]]; then
  echo "Error: expected Clerk instance $EXPECTED_INSTANCE_ID but keys are for $INSTANCE_ID." >&2
  exit 1
fi

echo "Clerk development instance: $INSTANCE_ID"

echo "Updating Doppler project=$PROJECT configs dev + prd..."
for CONFIG in dev prd; do
  doppler secrets set \
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$PK" \
    "CLERK_SECRET_KEY=$SK" \
    --project "$PROJECT" \
    --config "$CONFIG" \
    --silent
done

doppler secrets set "BASE_URL=$PROD_URL" --project "$PROJECT" --config prd --silent
doppler secrets set "BASE_URL=http://localhost:3000" --project "$PROJECT" --config dev --silent
doppler secrets set "CLERK_ALLOW_DEVELOPMENT_KEYS=true" --project "$PROJECT" --config prd --silent

echo "Done. Development Clerk keys are in Doppler (dev + prd)."
echo "Temporary: CLERK_ALLOW_DEVELOPMENT_KEYS=true on prd (remove when you switch to pk_live_)."
echo "Clerk Dashboard → allow origins: $PROD_URL and http://localhost:3000"
echo "Next: redeploy Vercel (or run: doppler run --config prd -- npm run deploy)"
