# Vocabulary seed templates (Supabase bootstrap)

## Recommended flow

1. **Author** lemma catalogs under [`sources/`](./sources/).
2. **Generate** packs: `pnpm run vocabulary:packs:generate` → [`packs.json`](./packs.json).
3. **Audit:** `pnpm run vocabulary:audit` (always); `pnpm run vocabulary:audit:ship` when unique count must be in **2000–3000**.
4. **Core overlay:** edit [`core-expressions.json`](./core-expressions.json) (10 per situation), then `pnpm run vocabulary:audit:core` and `pnpm run vocabulary:core:sql` → `018_vocabulary_core_seed.sql`.
5. **Historical full catalog SQL:** `pnpm run vocabulary:seed:sql` → `014_vocabulary_seed.sql` (do **not** edit `014` by hand).
6. **Apply** `013` + `014` once, then forward `017` (schema) + `018` (core overlay) + `019` (library rank + core exercises) on the linked DB.

## Current inventory

**2500 unique** reference terms across **5 situations**, plus **50 core expressions** (10 per situation) used by Home Continue and situation practice. The Library screen searches the full catalog.

Exercise contract fixture: [`fixtures/exercise-contract.json`](./fixtures/exercise-contract.json).

## Related

- Authoring spec: [`AUTHORING.md`](./AUTHORING.md) + [`lexicon.json`](./lexicon.json)
- Plan: `plans/PH3.md` + `plans/ph3/PH3-01-content-contract.md`
