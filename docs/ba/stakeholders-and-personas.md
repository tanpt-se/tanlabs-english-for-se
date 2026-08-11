# Stakeholders and personas

## Stakeholders

| Stakeholder           | Interest                                                 | Decisions they own                             |
| --------------------- | -------------------------------------------------------- | ---------------------------------------------- |
| Product owner         | Learning outcomes, phase priorities, flag rollout        | Scope in/out, go-live of `feature_*` flags     |
| Content reviewer      | Grammar correctness, SE relevance, unambiguous exercises | Publish/reject seed content                    |
| Engineering           | Delivery of foundation and feature modules               | Architecture fidelity, security, quality gates |
| Backend / data        | Schema, RLS, seeds                                       | Migration safety, cross-user isolation         |
| Quality               | Regression and release evidence                          | Blockers for release                           |
| End user (SE learner) | Practical practice with progress continuity              | N/A — primary beneficiary                      |

## Primary persona — “Working SE learner”

| Attribute   | Description                                                                      |
| ----------- | -------------------------------------------------------------------------------- |
| Who         | Software engineer (IC or lead) using English at work                             |
| Goal        | Sound clearer in updates, tickets, and meetings with correct tense/structure     |
| Context     | Short practice windows; flaky network (commute / VPN)                            |
| Constraints | Low patience for academic walls of text; distrusts opaque AI scores              |
| Success     | Finishes a short lesson, understands why an answer is right/wrong, resumes later |

### Needs

- SE-relevant examples (standups, deploys, incidents, clients)
- Immediate, explainable feedback
- Progress that survives app restarts and brief offline gaps
- Clear account privacy (another user never sees my attempts)

### Anti-needs

- Long theory chapters
- Gamification noise before learning value is proven
- Voice/AI coaching before core grammar loop works

## Secondary actors (system)

| Actor                                       | Role                                                                                 |
| ------------------------------------------- | ------------------------------------------------------------------------------------ |
| Anonymous visitor                           | Can only reach auth; cannot read user progress                                       |
| Authenticated user without complete profile | Must complete profile before Home                                                    |
| Authenticated user with complete profile    | Uses Home, Settings, and (when flagged) Grammar                                      |
| Platform operators                          | Manage Supabase content/config and Firebase projects (outside the mobile app binary) |

## Persona implications for requirements

1. Profile must capture enough English level context for future personalisation, without blocking early login when offline rules apply.
2. Home must not advertise unfinished modules as interactive when flags are off (coming-soon is acceptable).
3. Grammar scoring must never soft-match or “AI guess” — incorrect practice must stay incorrect with clear feedback.
4. Offline after questions load must not wipe an in-progress attempt; completion persistence must be idempotent.
