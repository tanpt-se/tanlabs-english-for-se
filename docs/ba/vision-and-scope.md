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
| PH2     | Grammar learn → practise → save progress loop (12 lean topics in 4 categories)          | **Delivered (code + v2 seed)** — production exposure gated by `feature_grammar`                              |
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

Topics (lean v2 — 4 categories, 3 lessons each, no sequential lock):

**Core Tenses (required)**

1. Present Simple
2. Present Continuous
3. Past Simple
4. Past Continuous
5. Present Perfect
6. Future Forms (`will`, `be going to`)

**Timeline & Planning (optional)**

7. Progress & Earlier Past
8. Future Milestones

**Sentence Structure**

9. Clear Sentence Building
10. Passive & Relative

**Workplace Communication**

11. Requests, Questions & Modals
12. Conditions, Reporting & Tone

Content volume (lean v2): **12 topics** in **4 categories** × **3 lessons** × **≤8 exercises**. Timeline & Planning is optional. Completion threshold: **70%** (does not lock other topics). Historical v1 (13×4×18) stays unpublished.

### PH3 — Vocabulary (delivered in code; prod flag OFF)

- **5 workplace situations**, each with **10 core expressions** (50 total)
- Situation practice uses **5–8** questions from the core list only
- Reference **Library** (~2000–3000 terms) with search / situation / CEFR filters; cores rank first
- Term detail: POS, countability (words only), respelling pronunciation (not invented IPA)

## Explicitly out of scope (near term)

- AI correction, generative content, chat tutors
- Speech / STT / TTS / listening exams
- Vocabulary and Interview **product loops** in production until flags are on (PH3 Vocabulary is VERIFIED with prod flag OFF; Interview remains later)
- Full CEFR curriculum, spaced repetition, XP/coins/leaderboards
- Further grammar families beyond the twelve lean topics (advanced tenses live in optional Timeline & Planning)
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
