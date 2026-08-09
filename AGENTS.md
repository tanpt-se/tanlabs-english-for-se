# AGENTS.md — tanlabs-english-for-se

Shared instructions for **Cursor** and **Codex**. Keep this file the source of truth.
Prefer editing here over duplicating rules in tool-specific files.

## Project

English learning product for software engineers (TanLabs).
Stack: React Native 0.86 · React Navigation · TanStack Query · Supabase · FastImage (`@d11/react-native-fast-image`) · React Native core UI · Reactotron (dev).

PH1 source of truth: `plans/PH1.md` (status-only edits when verified; do not change scope/prose).

Prefer images via `import FastImage from '@/components/FastImage'` (not RN `Image` for remote URLs).
HTTP: `import { api } from '@/lib/api'` (axios + auth/refresh interceptors). Set `API_BASE_URL` in `src/app/config/env.ts`.

Put Supabase URL + anon key in `src/app/config/env.ts` or local `.env` (gitignored; see `.env.example`).
Never commit secrets. Never put Supabase `service_role` in the mobile app.

**Client keys ≠ secret:** URL + anon key end up in the JS bundle. Security = Supabase RLS + auth.
Use iOS Keychain / Android Keystore only for _runtime_ user secrets (session/refresh tokens), not for baking build-time API keys.

Path alias: `@/*` → `src/*` (Babel + TypeScript + Jest). Prefer `import { x } from '@/lib/x'`.
Layout: `src/app` (bootstrap/config/navigation/providers), `src/core` (services), `src/features` (screens/hooks), `src/components`, `src/lib` (HTTP/query).

Formatting: Prettier `endOfLine: lf` + `.gitattributes` / `.editorconfig` so Windows and macOS stay consistent.

## How agents should work

- Read this file first. Follow it for every session.
- Prefer small, reversible changes. Ask before destructive ops (force push, hard reset, mass delete).
- Do not commit secrets (`.env`, keys, tokens).
- Do not invent APIs, folder layouts, or brand copy when unclear — ask.
- Match existing style once code exists; do not drive-by refactor.
- User-facing / notable changes → update `CHANGELOG.md` (`[Unreleased]`). On release, cut a dated version section and bump `package.json` + native versions together.

### Git commit messages

Use a **type prefix** (lowercase) then a short summary. Prefer one logical change per commit.

```text
features: add offline profile cache
fixes: deactivate FCM token before sign-out
bugs: prevent CompleteProfile flash on account switch
chores: regenerate pnpm-lock for Node 22 CI
docs: clarify supabase link CLI pin
```

Allowed prefixes: `features:`, `fixes:`, `bugs:`, `chores:`, `docs:`, `tests:`, `refactor:`.
Do **not** use free-form subjects like “Add X so Y” without a prefix.

### Git push

- **Never `git push` (or force-push) unless the user explicitly approves that push in the conversation.**
- Commit-only / local commits are OK when the user asks to commit.
- “Ship it”, “push”, or choosing a prompt option that says push counts as approval for that action only.

## Communication

- Concise. Direct. Technical accuracy over fluff.
- Vietnamese OK when the user writes Vietnamese; keep code/identifiers in English.
- Summarize the outcome first on long answers.

## Verification

```bash
pnpm run check   # eslint + prettier
pnpm test
pnpm run test:coverage # hard global 90% (also used in CI)
pnpm run test:coverage:soft # report only (COVERAGE_ENFORCE=0)
pnpm run e2e:ios     # Maestro device smoke (optional; maestro/)
pnpm run e2e:android
```

Git pre-commit (Husky + lint-staged): auto `eslint --fix` + `prettier --write` on staged files.
`pnpm run ios` / `android` also run `check` via `preios` / `preandroid`.

Package manager: **pnpm** (`pnpm-lock.yaml`). Use `pnpm install` locally and `pnpm install --frozen-lockfile` in CI. Do not commit `package-lock.json`.

iOS after native deps: `npx pod-install ios`

Fastlane (CI/CD): `bundle install` then `bundle exec fastlane doctor`.
See `fastlane/README.md` + `fastlane/.env.example`. Prefer `bundle exec fastlane …` / pnpm `fastlane:*` scripts.

## Cursor-only (optional)

File-scoped Cursor rules live in `.cursor/rules/*.mdc` (globs / `alwaysApply`).
Do **not** duplicate long shared policy there — point back to this file or keep only Cursor-specific globs.

## Codex-only (optional)

- Nested `AGENTS.md` / `AGENTS.override.md` in subdirs override closer to cwd.
- Keep total project docs under Codex’s size budget (~32 KiB combined by default).
