# Grammar content sources

## Runtime (app)

Default: **Supabase published rows** are the runtime content SoT.

Screens → hooks → `services/` → Supabase (or local packs when force-preview is on).

## Bootstrap + ongoing management

| Step       | Where                                               | Role                                               |
| ---------- | --------------------------------------------------- | -------------------------------------------------- |
| Template   | `supabase/seed/grammar/packs-v2.json`               | Lean v2 topics + 3 lessons (runtime local seed)    |
| Preview    | `GRAMMAR_FORCE_LOCAL_SEED=1` in `.env` (dev only)   | App reads packs-v2.json instead of Supabase        |
| Generate   | `pnpm run grammar:v2:packs` / `grammar:v2:seed:sql` | Writes packs-v2.json and `016_grammar_v2_seed.sql` |
| Apply      | `pnpm run db:migrate`                               | Loads `015`–`016` after historical `008`           |
| Day-to-day | **Supabase** Table Editor / SQL                     | Edit lessons/levels, toggle `published`            |
| Contract   | `../types/content.ts` + `../validation/`            | Shape rules for JSONB payloads                     |
| Schema     | migrations `007` + `010` (level) + `011` (title)    | Tables + RLS + RPC (`009` is a historical noop)    |

Starter template: **12 topics** in 4 categories, 3 lessons/topic, ≤8 exercises / lesson. Historical v1 (`packs.json` / `008`) stays unpublished. Do not edit `008_grammar_seed.sql`. Details: [`supabase/seed/grammar/README.md`](../../../../supabase/seed/grammar/README.md).

```bash
# Preview packs on device/simulator (development builds only)
# 1) set GRAMMAR_FORCE_LOCAL_SEED=1 in .env
# 2) rebuild native so react-native-config picks it up
# 3) enable feature_grammar and open Grammar (content comes from packs-v2.json, not Supabase)

# Regenerate v2 packs + 016 (do not regenerate 008)
pnpm run grammar:v2:packs
pnpm run grammar:v2:seed:sql

# Apply to linked non-prod
pnpm run db:migrate
```

Turn **off** `GRAMMAR_FORCE_LOCAL_SEED` before shipping. `seedInventory.ts` stays empty on purpose.

## Product docs (not executable)

- `docs/ba/*` — FR/UC/vision
- `plans/PH2.md` + `plans/ph2/*` — freeze rules / status
