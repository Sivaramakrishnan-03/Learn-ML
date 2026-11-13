# Building a LearnPath ML topic animation

Every topic gets two interactive tabs, **🎬 Animate** and **🕹 Playground**, each with a "How to use this" guide. The person who asked wants every topic animated, in the spirit of well-known textbooks (ISLR/ESL, Géron, Bishop/Murphy, Freedman, Wasserman, Bruce, Hyndman), with clear explanations. Quality bar: a learner with no background watches the animation and *gets* the idea.

## Read first
1. `src/anim/types.ts` (the contract) and **`src/anim/sampling-clt.tsx` (the gold standard; copy its structure)**.
2. `src/viz/kit.tsx`: the shared toolkit. **Build only from it** (plus React, `useMemo`/`useState`, and `d3` helpers if truly needed). Components: `Plot` (render-prop scales), `Dots`, `FnLine`, `Seg`, `Arrow`, `Label`, `Region`, `Bars`, `MatrixView`, `Caption`, `Readout`, `Slider`, `Choice`, `Toggle`, `Legend`, `Layout`, `useStepPlayer` + `PlayerControls`, `rng`/`gauss` (seeded randomness), `Tex` (KaTeX), `Md`, colours `C` / `SERIES`.
3. The topic's chapter `content/topics/<id>/chapter.json` and short lesson `content/topics/<id>/lesson.json`: reuse their running examples and numbers so the animation matches what the learner just read.
4. For the three existing pilots, see how rich an animation can be: `src/models/linear-regression.tsx`, `kmeans.tsx`, `decision-tree.tsx` (do not edit them).

## Your output
One file per topic: **`src/anim/<topic-id>.tsx`** with `export default anim` where `const anim: TopicAnim = { Animate, Playground, howto }`. The file name must equal the topic id. **Do not edit any other file**; other builders work in parallel. You may create a helper file `src/anim/_<group>-helpers.ts` if several of your topics share logic.

## Animate tab (narrated, step-by-step)
- Precompute a list of **frames** with pure functions (`useMemo`), then render frame `p.i` from `useStepPlayer(frames.length, ms)` and show `<PlayerControls p={p} />`.
- **8–30 frames.** Each frame changes one thing the learner can see (a point moves, a bar grows, a region shades, a number updates).
- **Every frame has a `<Caption>`** in plain English: what just happened + what to notice. Bold the key idea. Use the real numbers from the frame.
- Use a side panel (`Layout` + `Readout`) for live numbers and a `Legend` for colours.
- Show the mechanism, not just the result: e.g. for a t-test, build the difference, then the noise, then the ratio, then the tail area. For PCA, rotate the axis and show variance captured. For gradient boosting, fit residuals tree by tree.

## Playground tab (free exploration)
- 2–4 controls (`Slider`, `Choice`, `Toggle`, clicking on a `Plot`) that change the data or a parameter, with **instant recomputation** and readouts.
- Design it so that "trying to break it" teaches the key lesson (overfitting, sensitivity to outliers, effect of sample size, etc.).

## howto
`howto.Animate` and `howto.Playground`: `{ what, steps: [{ do, notice }] }`, 2–4 steps each. Tell the learner exactly what to click and what they should see.

## Visual rules
- Dark theme only; use `C.*` colours. Consistent meaning: data = blue, model/prediction = yellow, error/residual = red, truth/target/mean = green, highlight = gold.
- Label axes with units. Keep text in SVG at least 11 px. Plot widths default to 760 (they scale to the container).
- No `localStorage`, no network, no external libraries, no `Math.random()` (use `rng(seed)` so animations are reproducible).
- Must not produce `NaN`/`Infinity` in the SVG, must not overflow horizontally, and must stay responsive (keep per-frame computation light; precompute heavy work).
- Non-visual topics still get real visuals: NumPy = arrays as coloured grids with broadcasting animated; pandas = `MatrixView` tables with filter/groupby animated; plotting = the same data shown as histogram / box / scatter with "what each reveals"; pipelines = data flowing through steps with fit/transform per fold.

## Books (for ideas, not copying)
Base the *teaching approach* on the classic treatments (e.g. ISLR's bias–variance and flexibility plots, ESL's ridge/lasso constraint regions, Bishop's EM for GMMs, Hyndman's decomposition and time-series CV diagrams, Freedman's box models). **Design your own visuals and data; do not reproduce book figures or text.** References are added centrally; you do not need to cite.

## Test (required)
A shared dev server runs on port 5190 (if `curl -s localhost:5190 >/dev/null` fails, start it with `cd /home/claude/lp2 && (npx vite --port 5190 --strictPort > /tmp/claude-0/dev5190.log 2>&1 &)`; do not stop it). Then:
```
cd /home/claude/lp2 && node scripts/check-anim.cjs 5190 <id1> <id2> ...
```
It must print `ok` for every topic. **Then open the screenshots it lists with the Read tool and look at them**: check that the animation is legible, the caption makes sense, nothing overlaps, axes fit the data and the end state teaches the point. Fix and re-test. Also run `npx tsc --noEmit -p .` and fix any errors in *your* files (ignore other groups' in-progress files).

## Done means
All your topics print `ok`, you have looked at every screenshot, and `tsc` shows no errors in your files. Reply with one line per topic (what the Animate and Playground show) and anything you were unsure about.
