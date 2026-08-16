# Vocabulary content sources

## Runtime (app)

Default: **Supabase published rows** are the runtime content SoT.

Screens → hooks → `services/` → `vocabulary_situations` / `vocabulary_items` / `vocabulary_exercises`.

Hosted catalog (linked project): **5** situations, **2500** library items, **50** core expressions, `feature_vocabulary` on.

Remote browse loads every published item in a situation (PostgREST pages of 1000). Look up situations by **slug or uuid**, never both in one `.or()` filter (`id` is uuid).

## Bootstrap + ongoing management

| Step          | Where                                                | Role                                          |
| ------------- | ---------------------------------------------------- | --------------------------------------------- |
| Template      | `supabase/seed/vocabulary/packs.json`                | Authoring only (do not ship as app inventory) |
| Preview       | `VOCABULARY_FORCE_LOCAL_SEED=1` in `.env` (dev only) | App reads packs.json instead of Supabase      |
| Core overlay  | `supabase/seed/vocabulary/core-expressions.json`     | 10 workplace phrases per situation            |
| Generate core | `pnpm run vocabulary:core:sql`                       | Writes `018_vocabulary_core_seed.sql`         |
| Library rank  | `019_vocabulary_library_quality.sql`                 | Quality sort + missing core exercises         |
| Generate      | `pnpm run vocabulary:seed:sql`                       | Writes `014_vocabulary_seed.sql` (frozen)     |
| Apply         | `psql` `013`/`014` then `017`/`018`                  | Schema + catalog + core overlay               |
| Day-to-day    | **Supabase** Table Editor / SQL                      | Edit items, toggle `published`                |

```bash
# Optional: preview packs on a development build only
# 1) set VOCABULARY_FORCE_LOCAL_SEED=1 in .env
# 2) rebuild native so react-native-config picks it up
# 3) open Vocabulary (content comes from packs.json, not Supabase)

# Shipping / day-to-day: leave VOCABULARY_FORCE_LOCAL_SEED unset
```

Turn **off** `VOCABULARY_FORCE_LOCAL_SEED` before shipping. Native rebuild is required after changing the flag (`react-native-config`).
