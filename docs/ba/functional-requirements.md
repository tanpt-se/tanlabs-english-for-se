# Functional requirements

Requirement IDs are stable. **Status:** `Delivered` | `Planned` | `Deferred`.

Priority: **M** Must | **S** Should | **C** Could.

## Authentication and session

| ID         | Requirement                                                                                                    | Pri | Status    |
| ---------- | -------------------------------------------------------------------------------------------------------------- | --- | --------- |
| FR-AUTH-01 | System shall allow email/password registration with client-side validation before network calls                | M   | Delivered |
| FR-AUTH-02 | System shall allow email/password sign-in with mapped, user-readable errors (credentials, rate-limit, network) | M   | Delivered |
| FR-AUTH-03 | System shall persist session in platform secure storage (Keychain/Keystore)                                    | M   | Delivered |
| FR-AUTH-04 | System shall restore session on cold start when tokens remain valid                                            | M   | Delivered |
| FR-AUTH-05 | System shall route unauthenticated users to Auth stack                                                         | M   | Delivered |
| FR-AUTH-06 | System shall sign the user out and return to Auth without exposing prior account UI state                      | M   | Delivered |

## Profile

| ID         | Requirement                                                                                                                 | Pri | Status    |
| ---------- | --------------------------------------------------------------------------------------------------------------------------- | --- | --------- |
| FR-PROF-01 | Authenticated users with incomplete profile shall be routed to Complete Profile before Home                                 | M   | Delivered |
| FR-PROF-02 | Profile shall require display name and English level in {A1,A2,B1,B2,C1}                                                    | M   | Delivered |
| FR-PROF-03 | Users shall edit display name and English level from Settings                                                               | M   | Delivered |
| FR-PROF-04 | Selected English level shall not rely on colour alone                                                                       | M   | Delivered |
| FR-PROF-05 | When profile fetch fails but a valid cached profile exists, system shall prefer app shell over false Complete Profile flash | M   | Delivered |

## Home and feature exposure

| ID         | Requirement                                                                                                                          | Pri | Status           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------ | --- | ---------------- |
| FR-HOME-01 | Home shall present feature entries driven by remote flags `feature_grammar`, `feature_vocabulary`, `feature_interview`, `feature_ai` | M   | Delivered        |
| FR-HOME-02 | When a flag is off, Home shall show a non-interactive coming-soon state for that feature                                             | M   | Delivered        |
| FR-HOME-03 | Production Grammar entry shall remain closed until PH2 is accepted and `feature_grammar` is intentionally enabled                    | M   | Delivered (gate) |

## Notifications

| ID          | Requirement                                                                                         | Pri | Status            |
| ----------- | --------------------------------------------------------------------------------------------------- | --- | ----------------- |
| FR-NOTIF-01 | Users shall toggle notification preference in Settings                                              | M   | Delivered         |
| FR-NOTIF-02 | Enabling notifications shall respect OS permission flows (including open-settings when blocked)     | M   | Delivered         |
| FR-NOTIF-03 | Preference OFF shall deactivate server device delivery for the user device                          | M   | Delivered         |
| FR-NOTIF-04 | Sign-out shall deactivate device delivery while session is still valid                              | M   | Delivered         |
| FR-NOTIF-05 | Account switch shall transfer device token ownership safely (claim RPC)                             | M   | Delivered         |
| FR-NOTIF-06 | Notification preference mutations shall pause offline and resume with user-visible failure handling | S   | Delivered         |
| FR-NOTIF-07 | Live Console push receipt matrix (fg/bg/terminated)                                                 | S   | Deferred post-PH1 |

## Grammar learning (PH2)

| ID       | Requirement                                                                                                                       | Pri | Status    |
| -------- | --------------------------------------------------------------------------------------------------------------------------------- | --- | --------- |
| FR-GR-01 | System shall expose the thirteen grammar topics listed in Vision (10 PH2 core + 3 PH2.1)                                          | M   | Delivered |
| FR-GR-02 | Lessons, examples, and exercises shall be loaded from published backend content (not hard-coded per-tense screens)                | M   | Delivered |
| FR-GR-03 | System shall support exercise types: multiple choice, fill blank, sentence order                                                  | M   | Delivered |
| FR-GR-04 | Grading and feedback shall be deterministic; AI/fuzzy scoring shall not be used                                                   | M   | Delivered |
| FR-GR-05 | Practice shall remain usable after questions are loaded even if connectivity drops                                                | M   | Delivered |
| FR-GR-06 | Completing practice shall persist an attempt idempotently using a client attempt id                                               | M   | Delivered |
| FR-GR-07 | Score ≥ 70% on first completion path shall mark lesson progress completed; lower scores mark in progress                          | M   | Delivered |
| FR-GR-08 | Retry shall create a new attempt and shall not reduce best score                                                                  | M   | Delivered |
| FR-GR-09 | System shall show Result with score and navigation to retry/continue                                                              | M   | Delivered |
| FR-GR-10 | Continue Learning shall pick the most recently active incomplete published lesson, else first not-started (stable sort tie-break) | M   | Delivered |
| FR-GR-11 | Users shall only read published content; clients shall not mutate content tables                                                  | M   | Delivered |
| FR-GR-12 | Users shall only read/write their own progress and attempts                                                                       | M   | Delivered |
| FR-GR-13 | Grammar screens shall call hooks/services only (no direct Supabase from screens)                                                  | M   | Delivered |
| FR-GR-14 | One representative E2E Grammar flow shall exist for release                                                                       | M   | Delivered |
| FR-GR-15 | Optional daily Grammar reminder                                                                                                   | C   | Stretch   |

## Security and privacy (functional)

| ID        | Requirement                                                                                     | Pri | Status                                     |
| --------- | ----------------------------------------------------------------------------------------------- | --- | ------------------------------------------ |
| FR-SEC-01 | Mobile app shall never embed Supabase service_role or private keys                              | M   | Delivered                                  |
| FR-SEC-02 | Cross-user profile/device/progress access shall be denied by RLS                                | M   | Delivered                                  |
| FR-SEC-03 | Remote config / app_config shall be readable per policy; clients shall not insert/update config | M   | Delivered                                  |
| FR-SEC-04 | Analytics/Crashlytics shall not send raw secrets or passwords                                   | M   | Delivered (wiring); Console proof Deferred |

## Observability (functional expectations)

| ID        | Requirement                                                                | Pri | Status    |
| --------- | -------------------------------------------------------------------------- | --- | --------- |
| FR-OBS-01 | App shall initialise Crashlytics without blocking bootstrap                | M   | Delivered |
| FR-OBS-02 | App shall emit only allow-listed analytics events with non-sensitive props | M   | Delivered |
| FR-OBS-03 | Controlled Console crash / DebugView evidence                              | S   | Deferred  |

## Explicit non-requirements

- NRF-01 AI essay scoring or chat coaching in PH1–PH2
- NRF-02 Speech input/output learning modes in PH1–PH2
- NRF-03 In-app CMS for editors
- NRF-04 Multi-tenant organisation / classroom administration

## Coverage notes

Delivered requirements map primarily to `src/features/{auth,home,profile,settings}` and `src/core/*`. Grammar requirements map to `src/features/grammar/**` and Supabase migrations `007`–`012`.
