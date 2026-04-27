#!/usr/bin/env bash
set -euo pipefail

required_vars=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "NEXT_PUBLIC_APP_URL"
  "RESEND_API_KEY"
  "CRON_SECRET"
)

missing=()
for name in "${required_vars[@]}"; do
  if [[ -z "${!name:-}" ]]; then
    missing+=("$name")
  fi
done

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "❌ Missing env vars: ${missing[*]}"
  exit 1
fi

echo "✅ Required env vars are present."

if command -v curl >/dev/null 2>&1; then
  echo "Checking auth health endpoint..."
  curl -fsS "${NEXT_PUBLIC_APP_URL%/}/api/health/auth" >/dev/null \
    && echo "✅ /api/health/auth responded successfully" \
    || echo "⚠️ Could not reach /api/health/auth from this environment"
fi
