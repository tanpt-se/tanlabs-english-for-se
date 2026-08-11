# Glossary

| Term                      | Definition                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **PH1**                   | Production Foundation phase: auth, profile, flags, notifications lifecycle, monitoring wiring, quality gates |
| **PH2**                   | Grammar / Tenses learning phase                                                                              |
| **APP_ENV**               | Build-time app environment: `development` or `production` only                                               |
| **Feature flag**          | Boolean (or structured) remote config key in `app_config`, e.g. `feature_grammar`                            |
| **Coming soon**           | Home presentation when a feature flag is off                                                                 |
| **Profile complete**      | Authenticated user has required `display_name` and `english_level`                                           |
| **English level**         | One of A1, A2, B1, B2, C1 (product profile field; not a full CEFR curriculum claim)                          |
| **Topic**                 | One of the five PH2 grammar topics                                                                           |
| **Lesson**                | Learnable unit under a topic (rules + examples); content-driven                                              |
| **Exercise**              | Graded practice item (MC, fill blank, or sentence order)                                                     |
| **Attempt**               | Immutable record of a completed practice session for a user/lesson                                           |
| **client_attempt_id**     | Client-generated UUID used for idempotent attempt persistence                                                |
| **Progress**              | Per-user per-lesson state including scores and completion                                                    |
| **Completion threshold**  | 70% score required to mark a lesson completed                                                                |
| **Deterministic grading** | Exact rule-based scoring with no AI/fuzzy matching                                                           |
| **Published content**     | Backend rows visible to clients; unpublished rows are excluded                                               |
| **RLS**                   | Row Level Security policies enforcing per-user and published-content access                                  |
| **Secure storage**        | iOS Keychain / Android Keystore for session and similar runtime secrets                                      |
| **Device token**          | FCM registration token mapped to `user_devices`                                                              |
| **Claim device token**    | Server RPC allowing token ownership transfer on account switch                                               |
| **Paused mutation**       | TanStack mutation persisted while offline and resumed when online                                            |
| **SA / BA docs**          | This documentation set: Solution Architecture / Business Analysis                                            |
| **Plans**                 | Local execution boards and acceptance evidence (`plans/`, often gitignored)                                  |
