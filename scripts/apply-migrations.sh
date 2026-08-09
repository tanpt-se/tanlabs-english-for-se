#!/usr/bin/env bash
# Apply PH1 SQL migrations + seed via Postgres connection string.
# Requires: DATABASE_URL or SUPABASE_DB_URL in env / .env.rls
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f .env.rls ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.rls
  set +a
fi

DB_URL="${DATABASE_URL:-${SUPABASE_DB_URL:-}}"
: "${DB_URL:?Set DATABASE_URL or SUPABASE_DB_URL (postgres://...) in .env.rls}"

if ! command -v psql >/dev/null 2>&1; then
  echo "psql not found. Install Postgres client or paste SQL in Supabase SQL Editor."
  exit 1
fi

echo "Applying migrations…"
for f in \
  supabase/migrations/001_profiles.sql \
  supabase/migrations/002_app_config.sql \
  supabase/migrations/003_user_devices.sql \
  supabase/migrations/004_notification_settings.sql \
  supabase/migrations/005_claim_device_token.sql \
  supabase/seed.sql
do
  echo "→ $f"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$f"
done

echo "Migrations + seed applied."
