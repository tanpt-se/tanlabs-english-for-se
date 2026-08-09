# Supabase local / typegen notes (PH1)

## Apply migrations

Preferred (psql + connection string):

```bash
cp .env.rls.example .env.rls
# Fill DATABASE_URL (and SERVICE_ROLE for RLS verify)
pnpm run db:migrate
```

Or paste SQL files in order in the Supabase SQL editor:

1. `supabase/migrations/001_profiles.sql`
2. `supabase/migrations/002_app_config.sql`
3. `supabase/migrations/003_user_devices.sql`
4. `supabase/migrations/004_notification_settings.sql`
5. `supabase/migrations/005_claim_device_token.sql`
6. `supabase/seed.sql`

CLI alternative (when linked). **Pin ≥ 2.113.0** — Homebrew `supabase` 2.112.0 fails `link` with `SchemaError … inserted_at` on api-keys:

```bash
npx supabase@2.113.0 login
npx supabase@2.113.0 link --project-ref nxzjttciafqaqevquuev -p '<db-password>'
# Prefer: pnpm run db:migrate (psql) instead of db push
```

Or skip `link` after login and generate types directly:

```bash
echo nxzjttciafqaqevquuev > supabase/.temp/project-ref
SUPABASE_CLI_VERSION=2.113.0 pnpm run db:types
```

Linked locally 2026-08-08 (`supabase/.temp/`, gitignored).

## Generate TypeScript types

When logged in (`supabase login` / access token) or linked:

```bash
SUPABASE_CLI_VERSION=2.113.0 pnpm run db:types
```

Overwrites `src/types/database.ts` (prefers `--project-id` / `--linked`; `--db-url` needs Docker).

Generated and typechecked 2026-08-08 after CLI login + pin 2.113.0.

## Auth setting (PH1)

Dashboard → Authentication → Providers → Email → keep **Confirm email = ON** for staging and production. Local-only projects may disable it for smoke testing.

## RLS cross-user verification

```bash
set -a && source .env.rls && set +a
pnpm run verify:rls
```

Creates two temp users with a random password, asserts own vs cross-user denials, and fails unless both users are deleted.

## Generate types

```bash
npx supabase@2.112.0 gen types typescript --project-id nxzjttciafqaqevquuev > src/types/database.generated.ts
# Then merge/replace src/types/database.ts with generated output when available.
```

Until generated types are committed, `src/types/database.ts` is the hand-maintained schema mirror.
