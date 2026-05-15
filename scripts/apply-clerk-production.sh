#!/usr/bin/env bash
# Apply Clerk Production API keys to Doppler and verify instance type.
# Usage:
#   ./scripts/apply-clerk-production.sh <NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY> <CLERK_SECRET_KEY>
# Or:
#   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_... CLERK_SECRET_KEY=sk_live_... ./scripts/apply-clerk-production.sh
# Or (loads .env.local from repo root when no args):
#   ./scripts/apply-clerk-production.sh
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
  echo "Usage: $0 [<pk_live_...> <sk_live_...>]" >&2
  echo "With no args, reads NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY from .env.local." >&2
  echo "Get keys from Clerk Dashboard → Production instance → API keys." >&2
  exit 1
fi

if [[ "$PK" != pk_live_* ]]; then
  echo "Error: publishable key must start with pk_live_ (got ${PK:0:12}...)" >&2
  exit 1
fi

if [[ "$SK" != sk_live_* ]]; then
  echo "Error: secret key must start with sk_live_ (got ${SK:0:12}...)" >&2
  exit 1
fi

echo "Verifying keys against Clerk API..."
ENV_TYPE=$(curl -sS -H "Authorization: Bearer $SK" "https://api.clerk.com/v1/instance" | node -e "
let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
  const j=JSON.parse(d);
  if(j.errors){console.error(JSON.stringify(j));process.exit(1);}
  console.log(j.environment_type||'unknown');
})")

if [[ "$ENV_TYPE" != "production" ]]; then
  echo "Error: Clerk instance environment_type is '$ENV_TYPE', expected 'production'." >&2
  echo "Create a Production instance in https://dashboard.clerk.com/ and use its API keys." >&2
  exit 1
fi

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
doppler secrets delete CLERK_ALLOW_DEVELOPMENT_KEYS --project "$PROJECT" --config prd --silent 2>/dev/null || true

echo "Done. Production Clerk keys are in Doppler (dev + prd)."
echo "Next: redeploy Vercel (or run: doppler run --config prd -- npm run deploy)"
echo "Clerk Dashboard → Domains: allow $PROD_URL and http://localhost:3000"
