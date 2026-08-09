#!/usr/bin/env bash
# Deterministic RLS verification against a non-prod Supabase project.
# Required env:
#   SUPABASE_URL
#   SUPABASE_ANON_KEY
#   SUPABASE_SERVICE_ROLE_KEY
#
# Optional overrides:
#   RLS_TEST_PASSWORD
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f .env.rls ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.rls
  set +a
fi

: "${SUPABASE_URL:?Set SUPABASE_URL}"
: "${SUPABASE_ANON_KEY:?Set SUPABASE_ANON_KEY}"
: "${SUPABASE_SERVICE_ROLE_KEY:?Set SUPABASE_SERVICE_ROLE_KEY (Dashboard → Settings → API)}"

export SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY
export RLS_TEST_PASSWORD="${RLS_TEST_PASSWORD:-}"

node scripts/verify-rls.mjs
