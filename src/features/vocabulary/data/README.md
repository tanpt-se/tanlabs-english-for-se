# Vocabulary local pack preview

Dev-only: set `VOCABULARY_FORCE_LOCAL_SEED=1` in `.env`, then rebuild native (`pnpm ios` / `pnpm android`).

- Loads [`supabase/seed/vocabulary/packs.json`](../../../../supabase/seed/vocabulary/packs.json)
- Forces `feature_vocabulary` ON in the client (remote flag still OFF in DB)
- Situation list uses compact `TermRow` + Known/Learning (AsyncStorage)
- Detail list capped at 120 rows; tap row to expand meaning
- Practice builds **20** MCQs (meaning→term and term→meaning), prefers unknown terms

Turn the flag off before shipping.
