# Vocabulary packs authoring

SoT for [`packs.json`](./packs.json). Audit: `pnpm run vocabulary:audit` (structure + dedupe). Ship count gate: `pnpm run vocabulary:audit:ship` (unique items in **[2000, 3000]**).

Do **not** apply generated SQL to a live database unless asked. Never hand-edit seed SQL — regenerate via the future `vocabulary:seed:sql` script after PH3-02.

## Volume (locked)

| Gate          | Unique `term` count (normalized) |
| ------------- | -------------------------------- |
| Ship band     | **2000–3000**                    |
| Author target | **~2500**                        |
| Out of PH3 P0 | &gt; 3000                        |

`term` uniqueness is global (all situations). Intentional cross-situation reuse of the **same** lemma is forbidden — put the item in the primary situation and reference context tags instead.

## Shape

```text
situations[] → items[] → exercises[]
```

| Field                                              | Notes                                                      |
| -------------------------------------------------- | ---------------------------------------------------------- |
| `contentSchemaVersion`                             | Integer; start at `1`                                      |
| `situations[].slug`                                | Stable kebab-case; P0 core five listed below               |
| `situations[].items[].key`                         | Stable within situation; used for exercise links           |
| `type`                                             | `word` \| `phrase` \| `expression`                         |
| `term`                                             | Surface form learners see (dedupe on normalized form)      |
| `meaning`                                          | Short sense; not a dictionary essay (≤160)                 |
| `context`                                          | Must be one of [`lexicon.json`](./lexicon.json) `contexts` |
| `level`                                            | `A2` \| `B1` \| `B2` only (no C1 in Vocabulary P0)         |
| `patterns` / `examples` / `alternatives` / `notes` | Bounded lists; no HTML                                     |

### P0 situation slugs (order)

1. `daily-standup`
2. `meetings`
3. `task-progress`
4. `bugs-problems`
5. `client-communication`

Additional situation packs may be added under change control if volume needs clearer browse taxonomy; keep the five above published first.

## Item types

| Type         | Use when                                                           |
| ------------ | ------------------------------------------------------------------ |
| `word`       | Single lemma (`blocker`, `rollback`)                               |
| `phrase`     | Multi-word unit without full clause (`on track`, `root cause`)     |
| `expression` | Ready-to-say workplace line (`I'm blocked by the API dependency.`) |

Do not duplicate the same meaning across types (e.g. both `blocker` and a near-identical expression only restating the word).

## Exercises (when authoring drills)

P0 types only: `choose_expression`, `fill_blank`, `sentence_order`. Session mix targets **5 / 3 / 2** in a 10-question session. Every exercise must link to an `itemKey` in the same situation unless explicitly approved otherwise.

- Fill-blank: one `___`; trim + documented case/apostrophe normalization; no fuzzy/AI grading.
- Sentence-order: stable token IDs; last token may carry `.` or `?`.
- Choose-expression: exactly one correct option; distractors plausible in the same workplace frame.

## Editorial rules

- Daily SE English only (standup, Slack, PR, ticket, incident, deploy, client).
- Role-neutral; no customer names, secrets, URLs that must fetch at runtime, HTML, or executable payloads.
- Reject textbook fluff and non-workplace slang (see lexicon `forbidden`).
- Each example sentence should include ≥1 SE token from the lexicon when practical.

## Workflow

1. Author in `packs.json`.
2. `pnpm run vocabulary:audit` (always).
3. When inventory is ready to seed: `pnpm run vocabulary:audit:ship`.
4. Generate SQL (PH3-02+) and apply to non-prod first.
