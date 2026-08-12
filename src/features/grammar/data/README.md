# Grammar content sources

## Runtime (app)

Default: **Supabase published rows** are the runtime content SoT.

Screens → hooks → `services/` → Supabase (or local packs when force-preview is on).

## Bootstrap + ongoing management

| Step       | Where                                             | Role                                            |
| ---------- | ------------------------------------------------- | ----------------------------------------------- |
| Template   | `supabase/seed/grammar/packs.json`                | Shared topics + A2–C1 lessons (authoring only)  |
| Preview    | `GRAMMAR_FORCE_LOCAL_SEED=1` in `.env` (dev only) | App reads packs.json instead of Supabase        |
| Generate   | `pnpm run grammar:seed:sql`                       | Writes `008_grammar_seed.sql`                   |
| Apply      | `pnpm run db:migrate`                             | Loads catalogs into linked non-prod DB          |
| Day-to-day | **Supabase** Table Editor / SQL                   | Edit lessons/levels, toggle `published`         |
| Contract   | `../types/content.ts` + `../validation/`          | Shape rules for JSONB payloads                  |
| Schema     | migrations `007` + `010` (level) + `011` (title)  | Tables + RLS + RPC (`009` is a historical noop) |

Starter template: **13 shared topics** (10 PH2 + 3 PH2.1), 4 lessons/topic (A2–C1), 18 exercises / lesson (theory then practice). Do not apply `008` to a remote DB unless asked. Details: [`supabase/seed/grammar/README.md`](../../../../supabase/seed/grammar/README.md).

```bash
# Preview packs on device/simulator (development builds only)
# 1) set GRAMMAR_FORCE_LOCAL_SEED=1 in .env
# 2) rebuild native so react-native-config picks it up
# 3) enable feature_grammar and open Grammar (content comes from packs.json, not Supabase)

# Regenerate 008 from packs.json
pnpm run grammar:seed:sql

# Apply to linked non-prod
pnpm run db:migrate
```

Turn **off** `GRAMMAR_FORCE_LOCAL_SEED` before shipping. `seedInventory.ts` stays empty on purpose.

## Product docs (not executable)

- `docs/ba/*` — FR/UC/vision
- `plans/PH2.md` + `plans/ph2/*` — freeze rules / status
