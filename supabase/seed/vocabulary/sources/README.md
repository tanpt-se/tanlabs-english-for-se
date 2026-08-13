# Vocabulary source catalogs

Curated lemma inputs for `pnpm run vocabulary:packs:generate`.

| File                        | Situation / role                         |
| --------------------------- | ---------------------------------------- |
| `daily-standup.json`        | → `daily-standup`                        |
| `meetings.json`             | → `meetings`                             |
| `task-progress.json`        | → `task-progress`                        |
| `bugs-problems.json`        | → `bugs-problems`                        |
| `client-communication.json` | → `client-communication`                 |
| `cross-cutting.json`        | Fill thinnest situations after core load |

Edit sources, then regenerate `../packs.json`. Do not hand-edit the generated packs for bulk authoring.

Global dedupe is by normalized `term`. Target unique count defaults to **2500** (`VOCABULARY_PACK_TARGET`).
