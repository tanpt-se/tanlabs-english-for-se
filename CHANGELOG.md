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

- PH2 Grammar Sprint 1 foundations: nested `Grammar` navigator + flag-gated Home entry (`feature_grammar` stay off in seed), content contract + seed inventory (5 topics / 5 lessons / 40 exercises), pure practice engine, Supabase migrations `007_grammar_schema` + `008_grammar_seed` + `complete_grammar_attempt` RPC
- PH1 foundation UI aligned to Figma: Welcome (navy cover + hero mark), auth copy, Complete/Edit profile radios, Home streak + foundation card, Settings summary + confirm sign-out
- Shared UI: `AppIcon`, `AppSwitch` (Figma 44×28 coral/gray), `ConfirmModal`, `StreakCard`, `HomeFeatureRow`, `ProfileSummaryCard`; `AppButton` `fullWidth`; `SettingRow` switch/chevron
- Test coverage for PH1/PH3 UI branches (`WelcomeScreen`, `ConfirmModal`, vocabulary flows) to keep CI global 90% gate green
- PH3 learning screens (flag-gated): home → situation → practice → result with mock catalog
- Learning primitives: `SituationCard`, `ExpressionCard`, `PromptCard`, `ProgressBanner`, `InsightPanel`, `CompletionHero`, `ResultMetric`, `Feedback`, `FieldTextInput`
- Shell primitives: `TopAppHeader`, `BottomNavigation`, `AnswerOption`, `BottomActionBar`
- `FieldTextInput` password mode with Eye/EyeOff toggle; Login/Register use labeled fields
- Semantic theme aliases (`borderSubtle`, success/warning/error soft fills, expanded spacing/radius)
- Reusable TanLabs brand logo in Welcome UI, sourced from the launcher foreground asset
- Committed BA/SA documentation pack under `docs/ba` (vision, personas, journeys, FRs, glossary) and `docs/sa` (context, architecture, data/security, integrations, NFRs)
- Firebase per-env client config layout (`config/firebase/{development,production}`) with `pnpm run firebase:config` / `verify:firebase-config`
- Architecture/dependency policy regression suite (`architecturePolicy.test.ts`) and RN UI shell guards (`uiRegression.test.ts`)
- Client auth credential validation shared by Login/Register (`src/core/auth/validation.ts`)
- Offline mutation resume recovery helper (`resumePausedMutationsWithRecovery`) with user-facing sync alerts
- Supabase RPC `claim_device_token` (migration 005) so FCM tokens can change owner on account switch under RLS
- Secure local persistence for the current FCM token (survives cold start / logout deactivate)
- Keychain/Keystore-backed Supabase session storage with legacy AsyncStorage migration
- Regression coverage for auth profile races, secure storage, and patched image parsing
- Settings edit-profile flow and notification settings service/hooks (no direct screen Supabase)
- React Native Firebase messaging, Crashlytics, and Analytics wiring (non-blocking bootstrap)
- `pnpm run db:migrate` / `pnpm run db:types` / hardened `pnpm run verify:rls` (+ `.env.rls.example`)
- Offline profile cache (`src/core/profile/cache.ts`) so session → app when profile fetch fails
- Generated Supabase `Database` types via linked CLI (`pnpm run db:types`)
- Maestro E2E smoke (`pnpm run e2e:ios` / `e2e:android`, flows under `maestro/`)

### Removed

- Settings DEV “Trigger test crash” UI and `maestro/ios/trigger-crashlytics.yaml`
- `V2Icon` / `icons/v2` naming — icons live under `AppIcon` + `src/assets/icons/`
- Repo `docs/` tree (smoke/E2E/build/firebase verify notes); rebuild in later phases as needed
- Unused `react-dom`, `react-native-web`, `chart.js`, and `d3` (not referenced; were breaking `npm ci`)
- gluestack UI dependencies; PH1 UI now uses React Native core components and the local theme

### Changed

- UI components are grouped by stable families (`brand`, `button`, `feedback`, `input`, `layout`, `navigation`, `selection`); feature-only composites now live with their owning feature
- Auth stack starts on Welcome; Login/Register match foundation copy without header logo
- Icon PNGs re-exported as transparent white templates so `tintColor` renders correctly (was opaque light canvas)
- Review fixes: always register Vocabulary routes; Edit profile title; sign-out busy lock; honest session/result/settings copy; practice CTA uses question count; bottom nav flex; dead preference chevrons removed
- `AppButton` default size is Medium (Figma `Button/AppButton` Size default + screen instances); remove explicit Large overrides on primary CTAs
- Home drops DEV `env=` / `flags loaded=` debug line
- Fix TS: `StyleSheet.absoluteFill`, `AppColors` dark/light union-safe, `disabledDestinations` `as const`
- Settings drops OS permission help, Open system settings, and DEV Trigger test crash
- Home PH1 layout: greeting + neutral weekly activity, source-safe Learning paths rows (`HomeFeatureRow`), sticky bottom nav with disabled unavailable destinations
- Auth forms center vertically while content fits and remain keyboard-safe/scrollable for smaller screens and large text
- Vocabulary Home entry, bottom destination, and routes now fail closed while its remote feature flag is unavailable
- Home / Settings / Vocabulary share sticky `BottomNavigation` via `useMainTabSelect`
- Settings uses profile summary, sectioned rows, confirm modal, and Profile tab
- English level picker is a vertical radio list (`A1 · Beginner` …) with peach selected fill
- Settings / Profile PH1: coral level on summary, Appearance + Language rows, primary Sign out; Complete/Edit titles, coral step labels, soft-fill level radios, Save profile CTA
- `AppButton` supports medium/large sizes, secondary style, and `fullWidth`
- Theme tokens aligned to TanLabs Figma variables (accent, border subtle/default, radius 12/16/20)
- Android Gradle Firebase selection uses ProcessBuilder-style `.execute()` (Gradle Project has no configuration-time `exec {}`)
- Maestro Android e2e requires a connected `adb` device and prefers erase/hideKeyboard around text entry
- Maestro iOS auth smoke clears fields with eraseText and hides the keyboard before submit (aligns with Android flow reliability)
- `APP_ENV` is `development` | `production` only (staging removed by change control); Firebase backends map with fixed package/bundle IDs
- Notification mutation failures (including auto-resumed paused mutations) alert and roll back optimistic preference
- RLS verification covers app_config insert denial and anonymous profile leakage/insert denial
- Husky verification script (`pnpm run verify:hooks`) and `.husky/.gitignore` so fresh-clone hook install stays reproducible without tracking generated `_/`
- Coverage target is global **90%** (lines/functions/branches/statements); CI runs `pnpm run test:coverage` / `test:coverage:enforce` with the hard gate (`COVERAGE_ENFORCE=0` soft escape hatch only for local ad-hoc reports)
- Unit coverage raised across core services, FCM/Crashlytics/Analytics, hooks, RN UI wrappers, screens, navigator/providers, and API interceptors — `test:coverage:enforce` now passes
- Notification consent now commits server preference before activating FCM; token refresh and logout revoke delivery safely
- Profile cache and FCM tokens migrate from plaintext AsyncStorage to Keychain/Keystore; persisted query cache is limited to public remote config
- Production auth requires email verification; registration handles confirmation-required accounts
- Privacy manifests/disclosures, Android permission minimization, Supabase RPC search-path hardening, secret scanning, and immutable CI action pins
- Stop calling `registerDeviceForRemoteMessages` (iOS auto-register on by default; removes RN Firebase warning)
- Switch package manager to **pnpm** (`pnpm-lock.yaml`, CI `pnpm install --frozen-lockfile`); hoisted `node-linker` for React Native/Metro
- Theme follows App Icon / BootSplash palette with system light/dark via React Native and Navigation themes
- Primary/selected control foregrounds use theme-aware contrast tokens in light and dark modes
- Form validation errors expose live-region alerts and invalid input relationships for screen readers
- CI enforces global and security-critical module coverage thresholds; Android and iOS Maestro smoke flows are deterministic across cold starts
- Auth errors map rate-limit / credentials / email-taken / network via `AuthUserError`; Register shows Sign in instead when rate-limited
- Theme muted/primary contrast raised for AA intent; PH1 screens use `ScreenScroll` + KeyboardAvoiding for Dynamic Type / keyboard
- Primary buttons use local `AppButton` controls with ≥44pt height and Dynamic Type-safe padding
- Notification Switch tracks preference (not preference∧OS) so preference can be turned off when OS is denied
- Preference OFF deactivates `user_devices`; sign-in sync skips FCM persist when preference is off
- Device deactivate surfaces Supabase errors; logout records deactivate failures via Crashlytics
- Primary auth/home/settings controls use ≥44pt touch height; OS-blocked notifications offer Open settings
- CI: install ripgrep on Ubuntu, set `HUSKY=0` for install; secret-scan falls back to grep; add `.nvmrc` (Node 22)
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
- Modular Firebase Jest mocks cover notification permission and token lifecycle
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
- pnpm `secret:scan` + CI gates for format:check / secret:scan
- Accessibility labels on auth / profile / home / settings controls

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
