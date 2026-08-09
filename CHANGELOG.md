# Changelog

All notable changes to **TanLabs English for SE** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

App version sources:

- npm / marketing: `package.json` → `version`
- Android: `android/app/build.gradle` → `versionName` / `versionCode`
- iOS: Xcode `MARKETING_VERSION` / `CURRENT_PROJECT_VERSION`

When cutting a release: move items from `[Unreleased]` into a dated version section, then bump native + npm versions together.

## [Unreleased]

### Added

- Supabase RPC `claim_device_token` (migration 005) so FCM tokens can change owner on account switch under RLS
- Local AsyncStorage persistence for the current FCM token (survives cold start / logout deactivate)
- Keychain/Keystore-backed Supabase session storage with legacy AsyncStorage migration
- Regression coverage for auth profile races, secure storage, and patched image parsing
- Settings edit-profile flow and notification settings service/hooks (no direct screen Supabase)
- React Native Firebase messaging, Crashlytics, and Analytics wiring (non-blocking bootstrap)
- `npm run db:migrate` / `npm run db:types` / hardened `npm run verify:rls` (+ `.env.rls.example`)
- Offline profile cache (`src/core/profile/cache.ts`) so session → app when profile fetch fails
- Generated Supabase `Database` types via linked CLI (`npm run db:types`)
- Maestro E2E smoke (`npm run e2e:ios` / `e2e:android`, flows under `maestro/`)
- Auth session storage falls back to AsyncStorage when Keychain native module is unavailable (Simulator/Maestro)

### Removed

- Repo `docs/` tree (smoke/E2E/build/firebase verify notes); rebuild in later phases as needed
- Unused `react-dom`, `react-native-web`, `chart.js`, and `d3` (not referenced; were breaking `npm ci`)

### Changed

- CI: install ripgrep on Ubuntu, set `HUSKY=0` for `npm ci`; secret-scan falls back to grep; add `.nvmrc` (Node 22)
- Add repo `.npmrc` with `legacy-peer-deps=true` so CI matches local installs (gluestack peer noise)
- Session persistence now fails securely when Keychain/Keystore is unavailable
- Release builds require production environment values and dedicated Android signing credentials
- Notification preference writes pause, persist, and resume when connectivity returns
- Edit Profile waits for profile hydration before enabling changes
- Restored notification mutations wait for confirmed connectivity and reconcile optimistic state
- Edit Profile exposes retry when profile data is unavailable instead of loading indefinitely
- iOS beta signing uses Match certificates and the configured Apple development team
- RLS verification loads admin credentials only from `.env.rls`
- Sign-out deactivates device rows while the session is still valid; Settings no longer doubles the call
- Auth bootstrap only waits on `profileSettled` for account changes (same-user refresh no longer remounts navigators)
- Notification switch reflects preference **and** OS permission; modular Firebase Jest mocks
- Background FCM handler uses RN Firebase modular `setBackgroundMessageHandler`
- Logout clears persisted user query data; profile requests ignore stale account responses
- Database migrations are transactional/idempotent and RLS smoke users use random passwords with verified cleanup
- Patched `image-size` zero-length ICNS/JXL loops and overrode vulnerable transitive `uuid`
- Canonical `src` layout only (`app` / `core` / `features` / `components` / `lib`); removed shim `config` / `navigation` / `providers` / `lib/supabase`
- Auth routing treats profile completeness `unknown` as app (not Complete Profile)
- Android local builds default to `arm64-v8a` + Gradle parallel/caching; Fastlane release still builds all ABIs
- iOS development builds use active architecture, DWARF debug info, and compiler caching
- iOS Podfile: CocoaPods Firebase (`$RNFirebaseDisableSPM`) + disable user-script sandboxing for embed frameworks
- Notification enable: rationale/OS permission runs outside online-gated mutation (fixes silent no-op when NetInfo offline)
- iOS: `FirebaseApp.configure()` in AppDelegate + clearer messaging permission errors
- Theme typography tokens added under `src/theme`
- RN Firebase v26: migrate messaging/analytics/crashlytics to modular API (`getMessaging` / `getAnalytics` / `getCrashlytics`)
- Notification preference enables before FCM token (8s timeout) so Switch is not stuck disabled on Simulator
- npm `secret:scan` + CI gates for format:check / secret:scan
- Accessibility labels on auth / profile / home / settings controls
- Dev-only Settings → Trigger test crash (Crashlytics Console verify)

## [0.0.1] - 2026-08-08

Initial project scaffold (pre-release).

### Added

- React Native `0.86` app shell (TypeScript)
- React Navigation (native stack) + TanStack Query + Supabase client
- Axios HTTP client with auth / refresh interceptors (`@/lib/api`)
- FastImage via `@d11/react-native-fast-image` (`@/components/FastImage`)
- Reactotron (dev) for debugging
- Path alias `@/*` → `src/*` (Babel, TypeScript, Jest, ESLint)
- Husky + lint-staged (ESLint + Prettier on commit)
- Prettier / EditorConfig / `.gitattributes` with `LF` for Windows + macOS
- Fastlane root setup (`ios` / `android` build & beta stubs) for future CI/CD
- Agent rules (`AGENTS.md`, `.cursor/rules`) shared for Cursor + Codex
- `.env.example` + gitignore for secrets (`.env` not committed)

### Changed

- TypeScript `paths` without deprecated `baseUrl` (TS 6+ ready)

[Unreleased]: https://github.com/tanpt-se/tanlabs-english-for-se/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/tanpt-se/tanlabs-english-for-se/releases/tag/v0.0.1
