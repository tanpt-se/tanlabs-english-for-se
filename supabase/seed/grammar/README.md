# Grammar seed templates (Supabase bootstrap)

## Current runtime (v2)

Lean Grammar v2 is **4 categories / 12 topics / 3 lessons / ≤8 exercises**.

1. **Author** in [`packs-v2.json`](./packs-v2.json) via `pnpm run grammar:v2:packs` (curriculum modules under `scripts/lib/grammar-v2-*.mjs`).
2. **Audit:** `pnpm run grammar:audit` (v2). Historical v1: `pnpm run grammar:audit:v1`.
3. **Generate SQL:** `pnpm run grammar:v2:seed:sql` → `supabase/migrations/016_grammar_v2_seed.sql`.
4. **Apply** forward migrations `015`–`016` (do **not** edit `008_grammar_seed.sql`).
5. Local preview: `GRAMMAR_FORCE_LOCAL_SEED=1` loads **`packs-v2.json`**, not `packs.json`.

v1 catalog rows stay in the database unpublished (`*-v1` slugs) so old progress/attempts remain. The app only reads published curriculum version 2. Timeline & Planning topics are optional and are not required for Continue Learning.

## Historical v1 (`packs.json` / `008`)

Frozen 13-topic × 4-lesson × 18-exercise template. Do **not** regenerate or hand-edit `008_grammar_seed.sql`. `pnpm run grammar:seed:sql` is kept only for that historical file.

## Related

- Authoring spec: [`AUTHORING.md`](./AUTHORING.md) + [`lexicon.json`](./lexicon.json)
- Content contract: `src/features/grammar/types/content.ts` + `validation/`
- Feature docs: `src/features/grammar/data/README.md`
