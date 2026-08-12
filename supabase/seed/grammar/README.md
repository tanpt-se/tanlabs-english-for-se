# Grammar seed templates (Supabase bootstrap)

## Recommended flow

1. **Author** starter packs in [`packs.json`](./packs.json) (repo template only).
2. **Generate** SQL: `pnpm run grammar:seed:sql` → writes `supabase/migrations/008_grammar_seed.sql`.
3. **Apply** to your Supabase project (non-prod first): migrations `008`–`012` via `pnpm run db:migrate` or `psql` (see `scripts/apply-migrations.sh`).
4. **Run the app** against Supabase (do not set `GRAMMAR_FORCE_LOCAL_SEED` in `.env`). Rebuild native after env changes.

## Pack shape (`packs.json`)

Topics are **shared per tense**. CEFR level lives on each **lesson**.

| Field         | Notes                                                      |
| ------------- | ---------------------------------------------------------- |
| `slug`        | Grammar-family contract slug, e.g. `present-simple`        |
| `lessons[]`   | `key`, **`level`**, **`title`**, **`description`**, forms… |
| `exercises[]` | MC / fill_blank / sentence_order linked by `lessonKey`     |

Lesson keys are CEFR only (`a2`, `b1`, `b2`, `c1`). Title is a skill line (`A2 · Habits`). Description is When + cue. Every lesson has theory + **18** exercises. The generator expands `exampleSentences` into lesson `content` JSONB and assigns stable UUIDs.

## Current starter

**13 shared topics** × **4 lessons** (A2–C1) · **18 exercises / lesson** (**936** total).

Ten PH2 core families plus PH2.1: Present Perfect Continuous, Verb Patterns, Connectors. A2 = form. B1 = pick the tense/pattern. B2 = register. C1 = incident. Higher levels are original items, not A2 clones. Accuracy + deny-list: [`AUTHORING.md`](./AUTHORING.md). Audit: `pnpm run grammar:audit`. Job-fit: `pnpm run grammar:audit:quality`. Scorecard: `pnpm run grammar:score`.

Prefer editing live rows on Supabase for day-to-day content work so you do not wipe production edits with a blind regen.

## Related

- Authoring spec: [`AUTHORING.md`](./AUTHORING.md) + [`lexicon.json`](./lexicon.json)
- Content contract: `src/features/grammar/types/content.ts` + `validation/`
- Feature docs: `src/features/grammar/data/README.md`
