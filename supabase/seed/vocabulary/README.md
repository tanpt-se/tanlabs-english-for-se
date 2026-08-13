# Vocabulary seed templates (Supabase bootstrap)

## Recommended flow

1. **Author** lemma catalogs under [`sources/`](./sources/).
2. **Generate** packs: `pnpm run vocabulary:packs:generate` → [`packs.json`](./packs.json).
3. **Audit:** `pnpm run vocabulary:audit` (always); `pnpm run vocabulary:audit:ship` when unique count must be in **2000–3000**.
4. **Generate** SQL (PH3-02+): future `pnpm run vocabulary:seed:sql` → migration after `012`.
5. **Apply** to non-prod Supabase first; app inventory stays empty in-repo (same pattern as Grammar).

## Current inventory

**2500 unique** terms across **5 situations** (500 each after global dedupe). Ship band **2000–3000**. See [`AUTHORING.md`](./AUTHORING.md).

Exercise contract fixture: [`fixtures/exercise-contract.json`](./fixtures/exercise-contract.json).

## Related

- Authoring spec: [`AUTHORING.md`](./AUTHORING.md) + [`lexicon.json`](./lexicon.json)
- Plan: `plans/PH3.md` + `plans/ph3/PH3-01-content-contract.md`
