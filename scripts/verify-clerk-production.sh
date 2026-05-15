#!/usr/bin/env bash
# Verify Doppler + Clerk are configured for production auth (no 500-user dev cap).
set -euo pipefail

PROJECT="${DOPPLER_PROJECT:-resumeai}"
CONFIG="${1:-prd}"

PK=$(doppler secrets get NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY --project "$PROJECT" --config "$CONFIG" --plain)
SK=$(doppler secrets get CLERK_SECRET_KEY --project "$PROJECT" --config "$CONFIG" --plain)
BASE=$(doppler secrets get BASE_URL --project "$PROJECT" --config "$CONFIG" --plain 2>/dev/null || echo "")

echo "config=$CONFIG publishable=${PK:0:12}... base_url=$BASE"

if [[ "$PK" != pk_live_* ]]; then
  echo "FAIL: expected pk_live_ publishable key (development keys hit the 500-user limit)." >&2
  exit 1
fi

if [[ "$SK" != sk_live_* ]]; then
  echo "FAIL: expected sk_live_ secret key." >&2
  exit 1
fi

ENV_TYPE=$(curl -sS -H "Authorization: Bearer $SK" "https://api.clerk.com/v1/instance" | node -e "
let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
  const j=JSON.parse(d);
  if(j.errors){console.error(JSON.stringify(j));process.exit(1);}
  console.log(j.environment_type);
})")

if [[ "$ENV_TYPE" != "production" ]]; then
  echo "FAIL: Clerk environment_type=$ENV_TYPE (expected production)." >&2
  exit 1
fi

echo "OK: Clerk production instance and live keys are configured."
