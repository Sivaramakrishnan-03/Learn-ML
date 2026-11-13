# Writing a LearnPath ML textbook chapter

Every topic page opens with a **textbook chapter**: a 15–25 minute, plain-English explanation. The person who asked for this said the old short lessons were **too compressed, used too much jargon, lacked diagrams and needed more examples**. Every chapter must fix all four problems.

## Files
- Format (read first): `src/lessons/deep/types.ts`
- **Gold standard to imitate (read fully):** `src/lessons/deep/g-kmeans.ts`
- Existing short lessons with facts, examples and Python you may reuse or extend: `src/lessons/{math,python-workflow,stats,supervised,advanced}.ts`
- Topic list, titles, prerequisites and analogies: `src/data/curriculum.ts`
- Validator: `npx tsx scripts/validate-deep.ts <topicId> [<topicId> ...]` (run from the project root `/home/claude/lp2`)

## Your output
One file `src/lessons/deep/g-<group>.ts` that exports one constant:
```ts
import { DeepLesson } from './types';
export const <GROUP>_DEEP: Record<string, DeepLesson> = { '<topic-id>': { ... }, ... };
```
Keys must be the exact topic ids. **Do not edit any other file.** Other writers are working on other groups at the same time.

## Required structure per chapter (headings can be tailored to the topic)
1. **The problem / why this exists**: concrete business situation, why people needed this idea.
2. **Building the intuition**: an everyday analogy, explained step by step, **with no formulas**.
3. **How it works, step by step**: a numbered procedure plus a `flow` (or other) diagram.
4. **The math, explained slowly** (or **Under the hood** for non-mathematical topics such as pandas): each formula in a `tex` block with `plain` words and a `symbols` glossary. Explain *why* each piece is there.
5. **Worked examples**: at least 2, ideally 3, with small real numbers worked through line by line. At least one must be a business case (₹, Indian or global companies, manufacturing, automotive, retail, finance…).
6. **A topic-specific section**: e.g. "Choosing k", "Reading the output", "Variants", "Assumptions and how to check them", "Interpreting coefficients".
7. **In the real world**: at least one `case` block plus bullets of other uses.
8. **Pitfalls, limits and alternatives**: what goes wrong and what to use instead (a `compare` diagram works well).
Then `faq` with **5–6** questions beginners really ask.

## Minimums (the validator enforces them)
- **1,800–2,600 words** (validator hard limits: 1,500–3,400). Set `minutes` ≈ words ÷ 140, rounded.
- ≥ 6 sections, ≥ **3 diagrams** (validator min 2), ≥ 2 worked examples, ≥ 4 `term` boxes, ≥ 1 `think` block, ≥ 1 `case` block, ≥ 5 FAQ.
- Every `tex` must compile in KaTeX (validator checks it). Use `\\` for backslashes inside TS strings.

## Style rules
- **Plain English first.** Introduce every technical word with a `term` box *the first time it appears*, before using it freely. Assume a smart reader with school maths and no ML background.
- **Build ideas step by step.** Never state a result without first motivating it. Prefer short paragraphs (2–4 sentences).
- Tone: warm, clear, mentor-like. Use British/Indian spelling (standardise, optimise, colour). Use ₹ and lakh where natural.
- Inline formatting only `**bold**` and `` `code` ``. No Markdown headings, links or HTML in strings. No emoji inside strings.
- Avoid the words "genuinely", "honestly", "straightforward".
- Diagrams: choose the kind that teaches. `curve` for distributions and loss curves (fn is a JS expression in `x`, e.g. `"Math.exp(-x*x/2)/Math.sqrt(2*Math.PI)"`); `scatter` for data and fitted lines; `bars` for comparisons and metrics; `table` for small datasets and confusion matrices; `flow` for procedures; `tree` for decision trees and hierarchies; `compare` for "X vs Y". Every diagram needs an informative caption that says what to notice.

## Accuracy rules (non-negotiable)
- **Check every number.** Verify all arithmetic in worked examples with Python (`python3 -c ...`) before writing it. Rounded values must be correctly rounded.
- **Do not invent facts about real companies or people**: no made-up statistics, revenues, quotes or dates. Use well-established public facts stated cautiously (e.g. "Netflix famously ran a $1 million prize for better recommendations"), or label the case **"(illustrative)"** and keep it realistic.
- Technical claims must match standard textbooks and scikit-learn / statsmodels behaviour.

## Done means
`npx tsx scripts/validate-deep.ts <all your ids>` prints **"All checked topics pass."** Then reply with a one-line summary per topic (id, words, diagrams) and anything you were unsure about. Type errors from *other* groups' files are not your concern; your own file must type-check (the validator imports it).
