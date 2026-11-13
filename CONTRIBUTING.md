# Contributing to LearnPath ML

All teaching content is **plain JSON** in `content/`. You do not need to know React to fix a typo, improve an explanation or add quiz questions. VS Code validates every file against the schemas in `content/schema/` as you type (each file starts with a `"$schema"` line).

## Where things live

| What | File |
|---|---|
| 5-minute core, practitioner toolkit, Python, quick check | `content/topics/<topic-id>/lesson.json` |
| Textbook chapter (sections, diagrams, worked examples, FAQ) | `content/topics/<topic-id>/chapter.json` (guide: `docs/README-DEEP.md`) |
| Quiz bank for a topic (6–10 questions) | `content/quizzes/<topic-id>.json` |
| Hands-on project | `content/projects/<project-id>.json` |
| Topic list, prerequisites, roles | `src/data/curriculum.ts` (developers) |
| Book references | `src/data/references.ts` |
| Animations | `src/anim/<topic-id>.tsx` (guide: `docs/README-ANIM.md`) |

Inline formatting inside any text: `**bold**` and `` `code` ``. Maths goes in `tex` fields only (KaTeX syntax; in JSON write each backslash as `\\`).

## Quiz bank format (`content/quizzes/<topic-id>.json`)
```json
{
  "$schema": "../schema/quiz.schema.json",
  "questions": [
    { "q": "…", "options": ["…", "…", "…", "…"], "answer": 1, "why": "Why the right answer is right (and the tempting wrong one is wrong).",
      "level": 1, "kind": "concept" }
  ]
}
```
- `level`: 1 = beginner, 2 = practitioner, 3 = advanced. `kind`: `concept`, `calculation`, `interpretation` or `interview`.
- 6–10 questions per topic, at least one of each level, at least one `calculation` where the topic has numbers, at least one `interview`.
- 4 options, one clearly correct, distractors that reflect real misconceptions. `answer` is the 0-based index.
- Questions must agree with the topic's lesson and chapter (same numbers, same terminology).

## Project format (`content/projects/<project-id>.json`)
See `content/schema/project.schema.json`: `id` (= file name), `title`, `track`, `level`, `hours`, `summary`, `business`, `topics` (topic ids), `dataset {name, how}`, `steps [{title, detail, code?}]` (the code of all steps runs top to bottom as one script, using only numpy/pandas/scikit-learn/scipy/statsmodels/matplotlib and datasets that ship with scikit-learn or are generated in code), `deliverables`, `rubric [{criterion, good}]`, `extensions`.

## Before you open a pull request
```
npm install
npm run verify      # typecheck + unit tests + content validation + build
npm run snippets    # runs every Python snippet (needs: pip install -r requirements-snippets.txt)
```
CI runs the same checks plus a browser test of every animation on each push.

## Reporting problems
Use **🐞 Report a mistake** on any topic page, or open a GitHub issue. Include the topic, the tab and what should change.
