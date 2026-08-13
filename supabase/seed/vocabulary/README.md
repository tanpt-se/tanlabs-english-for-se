# Vocabulary seed templates (Supabase bootstrap)

## Recommended flow

1. **Author** packs in [`packs.json`](./packs.json) (repo template only).
2. **Audit:** `pnpm run vocabulary:audit` (always); `pnpm run vocabulary:audit:ship` when unique count must be in **2000–3000**.
3. **Generate** SQL (PH3-02+): future `pnpm run vocabulary:seed:sql` → migration after `012`.
4. **Apply** to non-prod Supabase first; app inventory stays empty in-repo (same pattern as Grammar).

## Current starter

Scaffold only: **5 situations** + sample items to lock shape. Author toward **~2500** unique terms (ship band **2000–3000**). See [`AUTHORING.md`](./AUTHORING.md).

## Related

- Authoring spec: [`AUTHORING.md`](./AUTHORING.md) + [`lexicon.json`](./lexicon.json)
- Plan: `plans/PH3.md` + `plans/ph3/PH3-01-content-contract.md`
