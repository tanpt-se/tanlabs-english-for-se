# Vision and scope

## Product vision

**TanLabs English for SE** helps software engineers practise workplace English that matches real engineering contexts (standups, PRs, incidents, client calls), starting with a solid mobile foundation and a practical Grammar learning loop.

Long-term product arc:

```text
PH1  Production Foundation
PH2  Grammar / Tenses
PH3  Vocabulary / Expressions
PH4  Interview
PH5  AI / Coach / Speaking
```

## Business problem

Engineers often know technical English passively but struggle to use tense and structure correctly in spoken/written work updates. Generic English apps are not SE-contextual. TanLabs focuses on short, practical lessons and deterministic practice—not academic grammar textbooks or AI tutors in early phases.

## Current delivery posture

| Phase   | Business intent                                                                         | System status                                                                                                |
| ------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| PH1     | Accounts, profile, secure backend, remote flags, notifications lifecycle, quality gates | **Delivered** (foundation baseline)                                                                          |
| PH2     | Grammar learn → practise → save progress loop (13 topics incl. PH2.1)                   | **Delivered (code + seed template)** — production exposure gated by `feature_grammar`                        |
| PH3     | Vocabulary / Expressions (situation-first; **2000–3000** unique IT terms)               | **VERIFIED** (2026-08-13) — SHA `ef80ae0`; CI + Maestro iOS/Android green; `feature_vocabulary` prod **OFF** |
| PH4–PH5 | Broader content and coaching capabilities                                               | **Out of near-term scope**                                                                                   |

## In scope (system today + locked next)

### PH1 — Foundation (delivered)

- Email authentication, session restore, logout
- Profile completion and edit (display name, CEFR-style levels A1–C1)
- Home shell with feature flag–driven teasers
- Settings: notification preference, sign-out
- Secure session storage; RLS-backed Supabase data
- Remote feature flags via `app_config`
- FCM device registration lifecycle (preference, refresh, account switch, logout)
- Crashlytics and Analytics wiring
- Dual environment Firebase client mapping (`development` \| `production`)
- Automated quality gates (lint/format/unit/coverage/CI) and auth smoke E2E

### PH2 — Grammar / Tenses (delivered)

Learning loop:

```text
Choose topic → Learn rule → See IT examples → Practice
→ Deterministic feedback → Save progress → Continue later
```

Topics (ten workplace families for PH2 core; CEFR on lessons):

1. Present Simple
2. Present Continuous
3. Past Simple
4. Present Perfect
5. Future Forms (`will`, `be going to`)
6. Modals (`can`, `could`, `should`, `must`, `might`)
7. Conditionals (0/1 + `unless`)
8. Passives
9. Articles (`a` / `the` / ∅)
10. Reported Speech

### PH2.1 — Grammar expansions (seeded in packs template)

Additional families for workplace transfer (same lesson shape A2–C1 × 18):

11. Present Perfect Continuous (`have been + V-ing` — open investigations)
12. Verb Patterns (`need to` / `avoid -ing` / `keep -ing`)
13. Connectors (`because` / `so` / `however` / `which means`)

Content volume (core + PH2.1 template): **13 topics** × **4 lessons** × **18 exercises**. Exercise types unchanged. Completion threshold: **70%**.

## Explicitly out of scope (near term)

- AI correction, generative content, chat tutors
- Speech / STT / TTS / listening exams
- Vocabulary and Interview **product loops** (PH3 Vocabulary is VERIFIED with prod flag OFF; Interview remains later)
- Full CEFR curriculum, spaced repetition, XP/coins/leaderboards
- Further grammar families beyond the thirteen seeded topics (e.g. phrasal verbs as a dedicated grammar track, relative clauses as a full topic)
- High-security exam anti-cheat
- A generic cross-feature “learning platform” framework before a second feature proves reuse
- Store///Ops deep automation as a product requirement (platform concern)

Stretch (non-blocking): optional single daily Grammar reminder after PH2 core is release-ready.

## Success measures (business)

| Phase           | Signal                                                                                                                              |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| PH1             | Engineer can register/sign in, complete profile, use Home/Settings, with stable sessions and flag-safe Home                         |
| PH2             | Engineer can complete a seeded Grammar loop, see deterministic feedback, return and continue from saved progress on Android and iOS |
| PH3             | Engineer can learn/practise workplace vocabulary (2000–3000 unique terms), review weak items, with flag-safe exposure               |
| Release control | Grammar/Vocabulary remain hidden in production until their feature flags are intentionally enabled                                  |

## Constraints (business-facing)

- Content must be practical for software work, not textbook-first
- Practice scoring must be explainable and deterministic
- User progress is private; no cross-account leakage
- Production Grammar exposure must be reversible via remote flag
