#!/usr/bin/env bash
# Verify Doppler has development Clerk keys and optional bypass for public deploy.
set -euo pipefail

PROJECT="${DOPPLER_PROJECT:-resumeai}"
CONFIG="${1:-prd}"

PK=$(doppler secrets get NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY --project "$PROJECT" --config "$CONFIG" --plain)
SK=$(doppler secrets get CLERK_SECRET_KEY --project "$PROJECT" --config "$CONFIG" --plain)
ALLOW=$(doppler secrets get CLERK_ALLOW_DEVELOPMENT_KEYS --project "$PROJECT" --config "$CONFIG" --plain 2>/dev/null || echo "")

echo "config=$CONFIG publishable=${PK:0:12}... allow_dev_on_public=$ALLOW"

if [[ "$PK" != pk_test_* ]]; then
  echo "FAIL: expected pk_test_ publishable key." >&2
  exit 1
fi

if [[ "$SK" != sk_test_* ]]; then
  echo "FAIL: expected sk_test_ secret key." >&2
  exit 1
fi

ENV_TYPE=$(curl -sS -H "Authorization: Bearer $SK" "https://api.clerk.com/v1/instance" | node -e "
let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
  const j=JSON.parse(d);
  if(j.errors){console.error(JSON.stringify(j));process.exit(1);}
  console.log(j.environment_type);
})")

if [[ "$ENV_TYPE" != "development" ]]; then
  echo "FAIL: Clerk environment_type=$ENV_TYPE (expected development)." >&2
  exit 1
fi

if [[ "$CONFIG" == "prd" && "$ALLOW" != "true" ]]; then
  echo "FAIL: prd needs CLERK_ALLOW_DEVELOPMENT_KEYS=true for pk_test_ on resume-ai-app.vercel.app." >&2
  exit 1
fi

echo "OK: Clerk development keys configured (config=$CONFIG)."
