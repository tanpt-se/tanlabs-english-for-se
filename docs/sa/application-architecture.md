# Application architecture

## Style

Mobile client-server application:

- **Presentation:** React Native core UI (no third-party UI kit in foundation)
- **Client state:** React context (auth/network) + TanStack Query for server state; local reducers for practice sessions (PH2)
- **Integration:** Supabase JS client (primary); React Native Firebase SDKs; optional axios `api` client
- **Security enforcement:** Supabase RLS + Auth (not “hidden” client keys)

## Logical layers

```text
┌──────────────────────────────────────────────┐
│ features/*/screens  (UI only)                │
├──────────────────────────────────────────────┤
│ features/*/hooks    (query/mutation adapters)│
├──────────────────────────────────────────────┤
│ core/* services     (domain + SDK calls)     │
├──────────────────────────────────────────────┤
│ lib / supabase client / firebase SDK         │
└──────────────────────────────────────────────┘
```

**Hard rule:** screens do not import Supabase or Firebase Messaging directly. Policy tests guard this (`architecturePolicy` suite).

## Source layout

```text
src/
  app/           env, providers, navigation, bootstrap
  core/          auth, profile, supabase, remote-config, notification, analytics, monitoring
  features/      auth, home, profile, settings, vocabulary, grammar
  components/    shared RN primitives, FastImage
  lib/           api, queryClient, offline recovery
  theme/         colour tokens + navigation themes
  types/         generated Database types
```

Path alias: `@/*` → `src/*`.

## Composition root

`AppProviders` mounts:

1. Gesture handler + Safe Area
2. Network status
3. Persisted Query Client
4. Auth provider
5. Navigation container → `RootNavigator`

Post-render bootstrap keeps Crashlytics/Analytics/messaging non-blocking where applicable.

## Navigation model

`RootNavigator` selects a root stack from auth destination:

| Destination       | Stack                                                                               |
| ----------------- | ----------------------------------------------------------------------------------- |
| `auth`            | Login, Register                                                                     |
| `completeProfile` | Complete Profile                                                                    |
| `app`             | Main tabs: Home, Grammar, Vocabulary, Interview, Profile (flag-gated learning tabs) |

Route resolution centralised in `core/auth/routeResolver` to avoid Complete Profile flashes on same-user refresh and to support offline `unknown` profile completeness → app shell.

## Feature flags

Remote keys on `app_config` drive Home and learning tabs. Grammar remains off in production until `feature_grammar` is intentionally enabled after release sign-off.

## PH2 Grammar module (delivered)

```text
Screen → Grammar hook/query → Grammar service → Supabase
```

Suggested ownership tree:

```text
src/features/grammar/
  components/ hooks/ screens/ services/ types/ utils/ validation/
```

Constraints:

- Content JSON validated before render; no arbitrary HTML
- Pure grading engine free of RN/Supabase imports
- Completion writes owned by a single persistence path (idempotent RPC)
- No new global store or UI framework

## Cross-cutting mechanisms

| Concern        | Mechanism                                                                             |
| -------------- | ------------------------------------------------------------------------------------- |
| Theming        | System light/dark via RN + navigation themes                                          |
| Images         | FastImage wrapper for remote URLs                                                     |
| Offline reads  | Query persistence for allowed public/server state                                     |
| Offline writes | Pause/persist/resume mutations (notifications); Grammar completion via idempotent RPC |
| Errors         | Domain error mapping (e.g. auth) + user alerts                                        |
| A11y           | Labels, roles, min touch height, non-colour-only selection                            |

## Deliberate exclusions

- Expo
- Tamagui / gluestack / Zustand
- Per-tense dedicated screen classes
- Repository/UoW layers without proven need

## Evolution rules

1. New learning features follow the same screen → hook → service pattern.
2. Shared abstractions wait until a second feature proves duplication.
3. Architecture changes that affect BA scope require updates in `docs/ba` and `docs/sa` together.
