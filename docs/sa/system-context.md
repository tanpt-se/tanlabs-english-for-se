# System context

## Purpose

Describe the mobile system boundary, external systems, and trust zones for TanLabs English for SE.

## Context diagram

```text
                    ┌─────────────────────────────┐
                    │     Software Engineer        │
                    │         (end user)           │
                    └──────────────┬──────────────┘
                                   │ uses
                                   ▼
┌──────────────┐         ┌─────────────────────┐         ┌──────────────────┐
│ Apple / GCP  │◄───────►│  TanLabs mobile app │◄───────►│    Supabase      │
│  FCM / APNs  │  push   │  (iOS + Android)    │  Auth + │ Auth · DB · RLS  │
└──────────────┘         └──────────┬──────────┘  data   └──────────────────┘
                                    │
                                    │ Crashlytics / Analytics / Messaging SDK
                                    ▼
                         ┌─────────────────────┐
                         │ Firebase projects   │
                         │ (dev / production)  │
                         └─────────────────────┘
```

Optional later: first-party HTTP API via `API_BASE_URL` (axios client exists; Grammar/content path today is Supabase).

## System boundary (inside the app)

- React Native UI and navigation
- Client-side session handling and route resolution
- Local caches (query persistence, encrypted profile cache)
- Pure grading engine (PH2 — planned, in-app)
- Feature hooks/services that call backends

## Outside the boundary

- Supabase Auth, Postgres, RLS, RPCs, content seed authorship
- Firebase project configuration and Console operations
- App Store / Play distribution and signing vaults
- CI runners and Maestro host machines
- Human content review workflows

## Trust boundaries

| Boundary                        | Rule                                                                |
| ------------------------------- | ------------------------------------------------------------------- |
| Device ↔ Supabase               | JWT from Auth; RLS enforces row access; anon key is public          |
| Device ↔ Firebase               | Client config is public; server keys never ship in the app          |
| Account A ↔ Account B           | No shared progress/profile UI; device token claim on switch         |
| Published ↔ unpublished content | Clients see published rows only (PH2)                               |
| Secure storage ↔ JS heap        | Session/refresh materials in Keychain/Keystore, not plaintext prefs |

## Actor interactions (summary)

| Actor            | Touchpoints                                         |
| ---------------- | --------------------------------------------------- |
| Learner          | Auth, profile, Home, Settings; Grammar when flagged |
| Content operator | Supabase data (outside app)                         |
| Release operator | Remote flags, Firebase/Supabase env selection       |

## Assumptions

1. One logical product binary per store listing; env differs by `APP_ENV` + backend projects, not by separate package names (current decision).
2. Learners are individual accounts (no org tenancy in PH1–PH2).
3. Connectivity is intermittent; critical writes that must survive offline use the paused-mutation pattern.
