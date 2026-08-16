# Grammar packs authoring

v2 SoT: [`packs-v2.json`](./packs-v2.json). Audit: `pnpm run grammar:audit`. Generate: `pnpm run grammar:v2:packs` then `pnpm run grammar:v2:seed:sql` → `016`. Do **not** edit `008_grammar_seed.sql`.

This file documents the **historical v1** [`packs.json`](./packs.json) shape (`pnpm run grammar:audit:v1`).

Do **not** apply generated SQL to a live database unless asked. Preview locally with `GRAMMAR_FORCE_LOCAL_SEED=1` + native rebuild (v2 packs).

## Shape

- Topics are shared grammar families. CEFR lives on **lessons**.
- Keys: `a2` | `b1` | `b2` | `c1` (runtime slug `{topic}-{key}`, e.g. `present-simple-a2`).
- **4 lessons / topic.** Title is a skill line, not Form/Usage/Practice: `A2 · Habits`, `B1 · Pick the tense`, `B2 · Register`, `C1 · Timeline`.
- Description = When + cue (one line, ≤140).
- Every lesson: theory → **18** exercises (no teach-only cards).
- Examples: **5** per lesson. Tips: **2**.

| Level | Exercises              | Band                                |
| ----- | ---------------------- | ----------------------------------- |
| A2    | 6 MC + 6 FB + 6 SO     | Produce form                        |
| B1    | **8 MC + 6 FB + 4 SO** | ≥12/18 choose the tense / structure |
| B2    | 6/6/6                  | Register (RFC / diary / evidence)   |
| C1    | 6/6/6                  | Incident (stamp vs result)          |

Total: **13 × 4 × 18 = 936** (10 PH2 core + 3 PH2.1).

## Theory (When / Form / Cue / Don't)

Rewrite each level. Do not dump old Form+Usage cards.

| Field                                         | Limit                     | Role                                         |
| --------------------------------------------- | ------------------------- | -------------------------------------------- |
| `usage`                                       | ≤220                      | **When** (1 sentence) + **Cue** (1 sentence) |
| `forms.affirmative` / `negative` / `question` | ≤80 each                  | **Form** — exact formula, no example essay   |
| `tips[0]`                                     | ≤120                      | **Don't** — the SE mistake this level traps  |
| `tips[1]`                                     | ≤120                      | Second trap or contrast line                 |
| `exampleSentences`                            | 5 × `[context, sentence]` | Same vocab as the 18 drills                  |

Learner should read theory in ≤15 seconds, then practice. Workplace English only.

## Situations (closed)

`context` must be one of [`lexicon.json`](./lexicon.json) `contexts`:

Standup, Slack, PR, Review, RFC, Ticket, Incident, War room, Postmortem, On-call, CI, Docs, Calendar, Offer, Decision, Alert, Deploy, QA, Policy.

Each sentence must contain ≥1 SE token from the lexicon. Forbidden textbook words are listed there.

| Situation          | A2            | B1               | B2                 | C1                  |
| ------------------ | ------------- | ---------------- | ------------------ | ------------------- |
| Standup / Slack    | habit vs now  | contrast tense   | diary / evidence   | war-room move       |
| PR / Review        | form          | yet / already    | stative / register | hedge + invariant   |
| Ticket / RFC       | fact          | policy vs live   | contract English   | scope line          |
| Incident / on-call | finished time | yesterday vs yet | after / when       | timestamp vs result |

## Level ladder

- **A2** — form + surface cue (`every`, `right now`, `yesterday`, `already`).
- **B1** — contrast with the adjacent tense/structure. Prompt/payload must not clone A2.
- **B2** — written register (RFC, SLA, stative, diary `am meeting`).
- **C1** — incident: invariant vs live; stamp vs result.

## Practice recipe (order in `exercises[]`)

Fill-blank: `prompt` = `template` (one `___`). Put the **lemma / form cue** in parentheses right after the blank: `We ___ (do · negative) merge…`, `This service ___ (reject) expired tokens.`, `I ___ (be · affirmative) updating…`, `___ (do · question) the job still run?`. For aux/modal blanks, tag polarity with `· negative` / `· affirmative` / `· question` so A2 learners know which polarity to produce. Learners type the conjugated word only (e.g. `don't`, `rejects`, `am`, `Does`) — not the cue. For content nouns use a **meaning hint** that does not spoil the key (`small % rollout`, `go-live switch`, `uncount noun · no a/the`) — avoid opaque `SE noun`. Strip `(write the form)` fluff. Include contraction + full form in `accepted` when both are valid.

Sentence-order: last token carries `.` or `?`. Reconstruct must be grammatical (2–12 tokens).

MC: exactly one correct option. Distractors are a **wrong tense/structure for the cue**, not nonsense (except A2 form slots).

### A2 / B2 / C1 (6 / 6 / 6)

| Slot  | Type | Band                          |
| ----- | ---- | ----------------------------- |
| 1–2   | MC   | form                          |
| 3–4   | MC   | contrast trap                 |
| 5–6   | MC   | SE register                   |
| 7–8   | FB   | auxiliary / particle          |
| 9–10  | FB   | contrast                      |
| 11–12 | FB   | register                      |
| 13–14 | SO   | short affirmative             |
| 15–16 | SO   | question                      |
| 17–18 | SO   | longer workplace (≤12 tokens) |

### B1 (8 / 6 / 4)

| Slot  | Type | Band                                                                           |
| ----- | ---- | ------------------------------------------------------------------------------ |
| 1–8   | MC   | ≥6 of these are **pick the tense** (options contain ≥2 real tenses/structures) |
| 9–14  | FB   | contrast / produce the chosen form                                             |
| 15–18 | SO   | short contrast sentences                                                       |

`explanation` must name the **cue** (e.g. `yesterday` → Past), not only “because grammar”.

## Accuracy (fail-closed)

Audit scans **correct answers** (MC label, fill-blank filled sentence, SO reconstruct) plus `usage` / `forms` / `examples`. Tips may name a banned form as a Don't (they are not scanned). Wrong English as a key is a ship-stopper.

### Form laws

- **Present Simple:** he/she/it + -s/-es; `don't` / `doesn't` + **base** (never `doesn't goes`); `Do` / `Does` + subject + base.
- **Present Continuous:** `am` / `is` / `are` + V-ing. Never mark stative as correct: `is owning`, `is needing`, `is knowing`, `is meaning`.
- **Past Simple:** V-ed / irregular; `didn't` + **base** (never `didn't went`); `Did` + subject + base.
- **Present Perfect:** `have` / `has` + past participle; `Have` / `Has` + subject + PP.
- **Future:** `will` + base; `am/is/are going to` + base; diary = Present Continuous + clock. Never `will to`, `am going disable`, `going to` + V-ing.
- **Modals:** modal + **base**. Never `should to`, `must to`, `can to`, `musts`, `can going`.
- **Conditionals:** if-clause has **no** `will` (0/1). Zero: If + present, present. First: If + present, `will`. `unless` = if not.
- **Passives:** `be` + past participle; `was` / `were` agree in number.
- **Articles:** `a` / `an` + count singular; `the` when identified; ∅ for uncount/generic (`latency`, `production`).
- **Reported:** `tell` + object; `say` does not require an object; backshift when the reporting verb is past.

### Cue → tense (correct keys must match)

| Cue                                                                | Correct tense                     | Never the correct key                |
| ------------------------------------------------------------------ | --------------------------------- | ------------------------------------ |
| `every` / `usually` / `still` (fact)                               | Present Simple                    | Continuous                           |
| `right now` / `at the moment`                                      | Present Continuous                | Simple                               |
| `yesterday` / `last night` / `at 14:02`                            | Past Simple                       | Perfect (`has` / `have` + PP)        |
| `yet` / `already` / `so far` / `since` / `this week` (open window) | Present Perfect                   | Past Simple                          |
| Locked calendar / `going to`                                       | `be going to` or diary Continuous | `will` (except a decision just made) |
| `Okay, I…` just decided                                            | `will`                            | `am going to`                        |

`this morning` / `today`: Past if the window is **closed** in the sentence; Perfect if it still matters **now**. Always put that cue in the item. Do not default one tense.

### Correct answer must be grammatical English

- Fill: `template` + `accepted[0]` is one sentence. List both contraction and full form when both are right (`don't` / `do not`).
- SO: reconstruct one sentence, ASCII `'`, ending `.` `?` or `!`.
- MC: one key. A2 may use form distractors; B1+ distractors must be a real wrong tense for the cue.
- No curly quotes.

### Deny-list (regex on correct answers + examples)

Fail if a **correct** string matches:

- `doesn't \w+s\b`
- `didn't \w+ed\b`
- `will to `
- `going to \w+ing\b`
- `\bis owning\b` / `\bis needing\b` / `\bis knowing\b` / `\bis meaning\b`
- `should to ` / `must to ` / `can to `
- `have .+ yesterday` / `has .+ yesterday`
- `at \d{1,2}:\d{2}.+have (already )?(shifted|patched|mitigated)`

These may appear as **wrong** MC options. They must never be the key, an example, or a Form line.

### Human dump (each topic, after authoring)

Reconstruct every correct sentence. Check (1) form law (2) cue match (3) sounds like Slack/RFC. Fix `packs.json`, not SQL.

## Job-shaped practice (quality bar)

Accuracy audit (`pnpm run grammar:audit`) is necessary but not enough for workplace transfer.
Also run `pnpm run grammar:audit:quality`.

### Goals inside the existing 18 slots

1. **B1 = pick the tense/structure** — ≥6/8 MC options span ≥2 real tense families (not `write|writes|is writing` only).
2. **No clone stems** — within one lesson, every `prompt` is unique (SO must not all say `Order the tokens.`).
3. **Discourse on B2/C1** — each topic’s B2+C1 set must include ≥2 discourse kinds and ≥4 hits among: request (`could you` / `please`), status (`right now` / `so far`), hedge (`might` / `hypothesis`), decision (`Okay, I will`), advise (`should` / `must`).
4. **Daily contexts** — across all lesson examples, Slack + Standup + PR ≥ 22%. Avoid 5/5 identical contexts on one lesson.
5. **Fill-blank** — `prompt` === `payload.template` (hard accuracy rule).

### Rewrite recipe when a lesson fails quality

| Symptom                | Fix                                                                    |
| ---------------------- | ---------------------------------------------------------------------- |
| B1 form triad          | Replace with habit↔now, yet↔yesterday, will↔going to, etc.             |
| MC and FB share a stem | Rewrite FB to a new Slack/PR/standup scene; keep the same grammar law  |
| SO boilerplate         | `Standup — put the words in order. (cue)` / Slack / PR / Ticket frames |
| All Incident examples  | Mix Slack, Standup, PR, War room                                       |

One-shot content reshapers have been removed after PH2 packs were sealed; prefer editing `packs.json` + `pnpm run grammar:audit` / `grammar:audit:quality` / `grammar:seed:sql`.
Per-topic scorecard: `pnpm run grammar:score`.

### PH2.1 families (seeded)

| Slug                         | Workplace job                                                |
| ---------------------------- | ------------------------------------------------------------ |
| `present-perfect-continuous` | Open hunt / status still running (`I've been investigating`) |
| `verb-patterns`              | `need to` vs `avoid/keep -ing` in Slack/PR                   |
| `connectors`                 | `because` / `so` / `however` / `which means` in updates      |

Form laws (correct keys):

- **PPC:** `have/has been` + V-ing; `for` + duration; `since` + start. Do not key a clock stamp with PPC.
- **Verb patterns:** `need/want/decide/agree` + `to` + base; `avoid/keep/consider/suggest/mind` + V-ing. Never `need to merging` / `avoid to merge`.
- **Connectors:** `because` = reason; `so` = result; `however` = contrast; `which means` + full clause. No `because so` stack as a correct key.

## Do not

- Clone A2 examples or exercise payloads into B1–C1.
- Use school / holiday-textbook English.
- Add exercise types beyond MC / fill-blank / sentence-order.
- Teach-only lessons (0 exercises) or Form/Usage/Practice split.
- Edit `008_grammar_seed.sql` by hand.
- Run `db:migrate` / apply `008` to a remote database from this template unless explicitly asked.
