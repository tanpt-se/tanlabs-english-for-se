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

- Lean Grammar v2: 4 categories / 12 topics / 36 lessons (3 per topic, max 8 exercises); optional Timeline topics; migrations `015`–`016`
- Vocabulary core + Library: 10 core expressions per situation, 50-phrase overlay, search/filter Library screen; migrations `017`–`019`
- Practice streak: first Grammar or Vocabulary practice finish of a local day (any score) shows a Continue modal and ticks Home’s week card; signed-in progress syncs through `practice_streaks` / `merge_practice_streak` (`020`)

### Changed

- Grammar Continue skips optional Timeline topics until required ones are done, and no longer locks a sequential path
- Vocabulary practice uses 5–8 core questions only; Library ranks cores then high-quality phrases first
- Local Grammar preview reads `packs-v2.json` and stores progress at `@tanlabs/grammar_local_progress_v2` so v1 attempts stay isolated
- Home Dashboard aligned with Figma V2: Continue Learning card, streak week card, path rows with progress bars, and Review needed reminder
- Grammar catalog is category-first (4 path cards → topic list → 3 numbered lessons) per Figma Screen & Flow; upcoming rows stay tappable and there is no topic checkpoint
- Vocabulary Home uses situation status cards plus a Library CTA; Situation Detail lists numbered cores with Continue; Term Detail follows Figma 03 (countability, pronunciation, Mark as known). Lean inventory is unchanged
- Core vocabulary pronunciations are English respelling (not fake IPA slashes); countability is `na` on phrases; Grammar Home/Vocab banners derive path counts from catalog; Library card uses real known/total
- Production `feature_grammar` and `feature_vocabulary` are on (`021`); Interview and AI stay off

### Fixed

- Grammar category and topic hide Continue when every item is completed; rows stay tappable
- Vocabulary Weak items card uses known/library ratio instead of a fake empty bar
- Home Continue Learning waits for grammar progress before picking a lesson
- Situation practice stays on the core list and does not fall back to the full library
- Grammar/Vocabulary Review Submit after skipping still finishes the attempt (session state no longer rewinds)
- Practice streak only celebrates when the attempt’s local day is today, stores per signed-in user, and never copies the unscoped device key onto another account

### Added

- PH3 Vocabulary verification candidate: frozen SHA with hosted CI green; Maestro vocabulary smoke on iOS Simulator + Android Emulator; production `feature_vocabulary` remains OFF
- Auth foundation: `AppButton` loading spinner (replaces label, keeps colors, disables press); signup confirm screen (6-digit OTP via Supabase `verifyOtp`) with `OtpPinInput` (6 PIN boxes); forgot-password flow with `tanlabs://auth/reset` deeplink → set-new-password screen
- Supabase Auth wrappers: `verifySignupOtp`, `resendSignupOtp`, `requestPasswordReset`, `verifyRecoveryFromUrl`, `updatePassword`; iOS/Android URL scheme + `AuthProvider` recovery deeplink handler
- Figma PH1 Foundation: screens **10 Confirm signup** (6-box OTP PIN), **11 Forgot password**, **12 Set new password**, **02b Sign in · Loading**; `Button/AppButton` **State=Loading** variant; Sign in aligned with app (no social row)

### Changed

- Vocabulary catalog: app reads hosted Supabase (`013`/`014` — 5 situations, 2500 items, 2500 exercises); `packs.json` is authoring-only and dynamic-imported only when `VOCABULARY_FORCE_LOCAL_SEED=1`

### Fixed

- Vocabulary remote catalog: look up situations by slug or uuid (not `.or()` on a uuid column); page item queries past PostgREST `max_rows`; list the full situation instead of a 120-row preview
- Auth recovery: ignore `PASSWORD_RECOVERY` without a session; skip duplicate recovery deeplinks; do not mark recovery pending when verify returns no session
- Auth recovery: await initial deeplink verification before bootstrap completes; surface invalid/expired reset links on Sign in (`recoveryLinkError`) instead of swallowing failures
- Auth analytics: allow `register_confirmed`; tighten OTP vs generic token error mapping; `AppButton` loading accessibility label; OTP PIN forwards `aria-*` props; Set new password only in recovery navigator (not auth stack)
- Foundation auth screens aligned with Figma PH1: 30px titles, 15px subtitles, 14px form rhythm, 342×24 column, `AuthFormScreen` / `AuthLink` / `AuthNote`; Welcome medium CTA; Register password note; Confirm resend secondary button
- Auth polish: Welcome `replace`→Login on recovery error; `recovery_invalid` kind; runtime deeplink errors recorded; Forgot rate-limit disables CTA; Set password sign-out feedback; OTP PIN a11y single focus target; Confirm resent uses `AuthNote`
- Figma Design System **V2**: theme tokens (type scale Display→Caption, spacing/radius, semantic colors); `AppText`; `AppButton` Size/Style (primary/secondary/ghost/destructive); Auth/Profile/Grammar/Vocabulary layout pass; component map in `docs/sa/figma-code-connect.md`

- PH3 Vocabulary packs: curated `sources/` → `pnpm run vocabulary:packs:generate` → **2500** unique IT terms + **2500** item-linked exercises (`choose_expression` / `fill_blank` / `sentence_order`); `vocabulary:audit` / `vocabulary:audit:ship`; exercise contract fixture
- PH3 Vocabulary schema: migrations `013_vocabulary_schema` (5 tables + `complete_vocabulary_attempt`) and `014_vocabulary_seed` (`pnpm run vocabulary:seed:sql`)
- Dev preview: `VOCABULARY_FORCE_LOCAL_SEED=1` loads packs into Vocabulary UI and forces the tab on; practice composes 5/3/2 from pack exercises
- Vocabulary situation UX: compact `TermRow` (term only; no WORD/A2 chips), Known/Learning toggle, full-width `SegmentedControl` filter (default All); practice CTA opens nested Practice → Review → Result (10-question mix)
- PH3 Vocabulary client loop: services/hooks/mutations, `PracticeSessionProvider`, three exercise UIs, Review + Result save states (`clientAttemptId`), Weak items list/retry, analytics event allowlist
- Vocabulary progress: Home/Situation show known/total from local Known marks (refreshes on focus); overall + per-situation progress bars
- Vocabulary browse: CEFR sections A2–C1 (collapsible `LevelSectionHeader`), colored POS badges, tap term → Cambridge-style detail
- Shared UI: `BrandLoading` (Figma Feedback/BrandLoading — logo + coral orbit ring); replaces `ActivityIndicator` on boot + Grammar loading states

- Home learning paths: Grammar/Vocabulary show progress counts (`N / total`) with `tone="progress"` instead of `Open`
- PH3-12/14: Vocabulary Home/Weak loading·empty·retry + a11y labels; architecture policy covers Vocabulary; Maestro smoke-vocabulary + `e2e:ios:vocabulary` / `e2e:android:vocabulary`
- Navigation: main Home/Grammar/Vocabulary/Interview/Profile uses React Navigation Bottom Tabs so the tab bar stays fixed (no stack slide)
- PH2 Grammar UI pass against Figma `04 — PH2 Grammar`: LessonCard + progress banner bar, Topic/Lesson layouts, Practice InsightPanel, Result CompletionHero/metrics/Feedback
- PH2 Sprint 3 practice: feature-local session provider, Practice UI for multiple-choice / fill-blank / sentence-order, Result resolves by `clientAttemptId` only (persist still PH2-09)
- PH2 Sprint 2 browse path: Grammar service/hooks read published Supabase content; Home → Topic → Lesson wired without screen-level Supabase; authoring map in `src/features/grammar/data/README.md`
- PH2 Grammar Sprint 1 foundations: nested `Grammar` navigator + flag-gated Home entry (`feature_grammar` stay off in seed), content contract + empty in-repo inventory, pure practice engine, Supabase migrations `007_grammar_schema` + `008_grammar_seed` (clears catalogs) + `009` C1 level + `complete_grammar_attempt` RPC
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

### Changed

- Vocabulary browse / Weak / Practice chrome aligned with Figma `06 — Vocabulary`: navy banner, Weak items card + chevron, TermRow + muted POS, LevelSectionHeader, choose-expression context card + 22px stem
- Grammar: Result labels this attempt (not “best”); Review can reopen Wrong as well as Skipped; save-fail returns to Review
- Grammar: topic cards show **0%** and an empty progress bar until the first lesson is started (no min-width fill artifact)
- Grammar: Continue Learning on Home picks the most recently active incomplete lesson (`last_activity_at`), else first not-started; topic Continue uses the same rule
- Grammar: Maestro PH2 smoke (`pnpm run e2e:ios:grammar` / `e2e:android:grammar`) — login → Grammar → topic → lesson → practice
- Grammar: RPC `complete_grammar_attempt` rejects score/count mismatch (migration `012`); analytics `grammar_attempt_complete` on submit
- Grammar: Result resolves memory → AsyncStorage cache → Supabase attempt; Continue Learning uses one lessons catalog query
- Grammar: practice shuffles question order + MC/SO choices each attempt; topic/lesson progress uses best score % (not 0 until pass); submit persists via local preview map or `complete_grammar_attempt`
- Grammar: fill-blank stems use `___ (lemma · polarity)` cues (negative / affirmative / question) plus matching Practice instructions; input placeholder is a short form hint
- Grammar: PH2.1 topics seeded (`present-perfect-continuous`, `verb-patterns`, `connectors`) — 13×4×18; `pnpm run grammar:score`
- Grammar: job-fit quality gate (`pnpm run grammar:audit:quality`) + AUTHORING checklist
- Tests: Grammar unit suites grouped under `__tests__/unit/features/grammar/{screens,components,hooks,services,session,utils,content}`
- Chores: drop one-shot pack reshapers (`generate-ph21`, `reshape`, `rewrite-fill-cues`, `improve-job-fit`, `grammar-lesson-theory`) after packs sealed
- Grammar: `contentService` dynamic-imports local seed only when `GRAMMAR_FORCE_LOCAL_SEED` is on (packs.json stays out of the default Metro graph)
- Grammar: `PracticeSessionProvider` wraps Practice → Review → Result only (`GrammarPracticeFlow`); screens use `applyAction` instead of peeking `practiceReducer`; errors surface via `grammarErrorMessage`
- Grammar: Practice ends on a Review answers screen (Done / Skipped, reopen, then Submit) before Result; Figma PH2 frame `14 · Review answers`
- Grammar: Practice UI uses a thin question progress bar with Previous/Skip icon controls, small instruction + large stem; Figma PH2 practice frames updated to match
- Grammar: Review/Practice back flow restores skipped coverage on abort, leave-confirm exits once, Submit drops Practice from the stack
- Grammar: Practice guards sentence-order Check until full token length; action taps debounce; Home topic completion needs all CEFR lessons; submit fail-closed if coverage incomplete
- Grammar: lessons use `title` + `description` (same shape as topics); Topic list shows both lines
- Grammar: topics are shared per family; CEFR `level` moves to `grammar_lessons` (migration `010`); packs seed 10 topics × **4 lessons (A2–C1)** (5 tenses + modals, conditionals, passives, articles, reported speech), **18 exercises / lesson**, original B1–C1 (not A2 clones)
- Grammar: authoring spec + closed SE lexicon + fail-closed Accuracy / deny-list; `pnpm run grammar:audit` gates `packs.json` (do not apply `008` to a remote DB unless asked)
- Grammar: bootstrap catalogs via `supabase/seed/grammar/packs.json` → `pnpm run grammar:seed:sql` → `008`; day-to-day edits on Supabase (app inventory stays empty)
- Grammar: content served from Supabase (local `GRAMMAR_FORCE_LOCAL_SEED` preview removed from `.env.example`; migrate `008`–`012` for catalogs)
- Docs: BA/SA baseline synced for PH2 closure (FR/NFR/UC Delivered; migration head `012`)
- BrandLoading: orbit transform on a wrapper (borders on child) to avoid native-driver boot crash

### Fixed

- Vocabulary practice: wait for Known store before `startSession`, and refuse mid-flow session restarts so Review submit is not wiped; `beforeRemove` reads live session phase so Result navigation is not blocked after submit
- Vocabulary seed SQL: `escLiteral` emits Postgres single-quoted literals (014 regenerates cleanly); ignore bulk `packs.json` / `sources/*.json` in Prettier
- Maestro vocabulary smoke: recover from iOS “Save Password?” / accidental Register navigation after login
- Grammar: submit commits completed session only after server ack; failed save mints a new `clientAttemptId`; Review gates reopen/back while saving; Result Retry resets the practice stack; unauthenticated complete throws instead of navigating to Result
- Grammar: offline completion uses paused mutation queue (`grammar-complete-attempt`) with account-switch guard; Result shows saving/queued/retry-save; PH2 analytics funnel + Crashlytics grammar context; `verify-rls` covers grammar content/progress/RPC; Maestro grammar smoke reaches Result
- Fixed screen headers: `LearningScreen` / `ScreenScroll` `header` slot stays put while content scrolls (app-wide TopAppHeader / AuthHeader)
- BrandLoading: `fill` centers the mark in the available screen area (boot + Grammar loading)
- Main tabs: render custom `tabBar` as JSX (`renderAppTabBar` → `<AppTabBar />`) so hooks work — React Navigation invokes `tabBar` as a plain function
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

- Figma PH3 Vocabulary list items synced to shipping app: Situation `TermRow` + CEFR headers + PosBadge, Home `SituationCard` progress bars + Weak entry, Weak compact rows; practice CTA sample **10** questions
- Grammar lesson rows: completed lessons use light green (`successSoft`) surface + green check/badge
- Figma PH2 **07 · Topic overview** rebuilt to match `GrammarTopicScreen` / `GrammarLessonRow` (fixed clipped rows, progress copy, index badges, Continue CTA)
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
- Coverage target is global **90%** (lines/functions/branches/statements); CI runs `pnpm run test:coverage` with the hard gate (`COVERAGE_ENFORCE=0` soft escape hatch only for local ad-hoc reports via `test:coverage:soft`)
- Unit coverage raised across core services, FCM/Crashlytics/Analytics, hooks, RN UI wrappers, screens, navigator/providers, and API interceptors — `test:coverage` passes in CI
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
