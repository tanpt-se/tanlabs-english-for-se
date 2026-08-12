# System documentation (BA / SA)

Business Analysis and Solution Architecture documentation for **TanLabs English for SE**.

| Audience          | Use                                                        |
| ----------------- | ---------------------------------------------------------- |
| Product / BA      | Scope, personas, journeys, functional requirements         |
| Architecture / SA | Context, app design, data/security, integrations, NFRs     |
| Delivery          | Trace requirements → current phase without inventing scope |

## Document map

### Business Analysis (`docs/ba/`)

| Document                                                       | Description                                    |
| -------------------------------------------------------------- | ---------------------------------------------- |
| [Vision and scope](./ba/vision-and-scope.md)                   | Product intent, phase roadmap, in/out of scope |
| [Stakeholders and personas](./ba/stakeholders-and-personas.md) | Actors and primary user persona                |
| [Journeys and use cases](./ba/journeys-and-use-cases.md)       | End-to-end flows and use-case catalogue        |
| [Functional requirements](./ba/functional-requirements.md)     | FR baseline for shipped PH1 and PH2 Grammar    |
| [Glossary](./ba/glossary.md)                                   | Shared business and domain terms               |

### Solution Architecture (`docs/sa/`)

| Document                                                               | Description                                 |
| ---------------------------------------------------------------------- | ------------------------------------------- |
| [System context](./sa/system-context.md)                               | Actors, external systems, trust boundaries  |
| [Application architecture](./sa/application-architecture.md)           | Layering, navigation, feature module rules  |
| [Data and security](./sa/data-and-security.md)                         | Logical data model, RLS, secrets model      |
| [Integrations and environments](./sa/integrations-and-environments.md) | Supabase, Firebase, env mapping             |
| [Non-functional requirements](./sa/non-functional-requirements.md)     | Quality attributes and acceptance envelopes |

## Document control

| Field         | Value                                                                      |
| ------------- | -------------------------------------------------------------------------- |
| Product       | TanLabs English for SE                                                     |
| Version       | 0.2 (PH1 foundation + PH2 Grammar delivered)                               |
| Language      | English                                                                    |
| Last reviewed | 2026-08-12                                                                 |
| Status        | Living baseline — update when phase scope or architecture contracts change |

## Relationship to other sources

| Source                         | Role                                           |
| ------------------------------ | ---------------------------------------------- |
| This `docs/` tree              | **Committed** BA/SA baseline for the system    |
| `plans/` (often gitignored)    | Detailed phase execution, checklists, evidence |
| `AGENTS.md`                    | Engineering agent/policy rules for this repo   |
| `CHANGELOG.md`                 | User-visible and operational change history    |
| `src/`, `supabase/migrations/` | Implementation truth                           |

When BA/SA docs conflict with shipped code, **update the docs** (or open an explicit change-control note). When they conflict with local `plans/` scope invents, **plans win for in-flight phase detail** after reconciliation into `docs/`.

## Reading order

1. BA: Vision → Personas → Journeys → Functional requirements
2. SA: System context → Application architecture → Data/security → Integrations → NFRs
3. Cross-check FR IDs against the current delivery phase before implementing
