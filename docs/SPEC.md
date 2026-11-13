# LearnPath ML: Product & Technical Spec (v0.1)

Owner: Sivaramakrishnan · Date: 2026-11-12 · Status: prototype built (Phase 1)

## 1. Vision
One place to learn statistics and classical machine learning, from foundations to models, through **animations you can watch, poke and break**. Every model page follows the same template: an intuition-first story, step-by-step animation, an interactive playground, the full ML pipeline, the math revealed step by step, runnable Python, and a self-check quiz.

Audience: self-study, P3 colleagues, clients/external learners, students. Default depth is intuition-first, with the math one tab away.

## 2. Scope
| In v1 (69 topics) | Later |
|---|---|
| Math foundations, Python/pandas, ML workflow, Statistics, Regression, Classification, Ensembles, Unsupervised, Time series, intro Neural nets | Deep learning (CNN/RNN/Transformers), GenAI/LLMs/RAG, RL, AI tutor, accounts, German/Tamil |

The full topic list and its prerequisite graph live in `src/data/curriculum.ts`. That file is the single source of truth, and every learning path is generated from it.

## 3. Learning paths (all four, generated from the one graph)
1. **Skill tree**: a prerequisite DAG with one column per depth level, coloured by track. A topic unlocks when all its prerequisites are complete.
2. **Linear track**: a topological sort of the DAG, tie-broken by level and then track. This gives a single "Day 1 … Day N" order.
3. **Role tracks**: Analyst, Data Scientist, ML Engineer, AI Consultant. Each is the set of topics tagged for that role plus all their prerequisites, in linear order.
4. **Placement quiz (adaptive)**: 12 questions, each mapped to a topic. Correct answers mark the topic and its prerequisites as "tested out". The quiz gets harder after correct answers and easier after misses, then recommends the first unmet topics.

Progress is stored in the browser (`localStorage`). There is no login.

## 4. Model page template
| Tab | Content | Component |
|---|---|---|
| Story | Analogy, business case, when to use / avoid | `models/<id>/content` |
| Animate | Algorithm step-by-step (play / pause / step / scrub) | `StepPlayer` + model frames |
| Playground | Click to add points, drag sliders, live refit | model `Playground` |
| Pipeline | Data → clean → features → split → train → evaluate → deploy, animated with a real model output | `Pipeline` |
| Math | Equations built up step by step (KaTeX) next to the geometry | `MathSteps` |
| Code | A from-scratch NumPy version and a scikit-learn version, both runnable in the browser via Pyodide (loaded only when this tab is used) | `CodeLab` |
| Quiz | Concept checks and interview questions with explanations | `Quiz` |
| Cheat sheet | One printable page (Print → PDF) | `CheatSheet` |

Topics that haven't been animated yet show the shared shell: summary, analogy, prerequisites, which topics they unlock, and their roadmap phase.

## 5. Animation standard
- 3Blue1Brown-like dark canvas (`#0e1116`), with the fixed track colours from `TRACKS`.
- Algorithms are **deterministic, pure functions** in `src/lib/ml.ts` that return a list of frames. The UI only renders the frames, which makes animations testable and lets the scrub bar jump to any step.
- Data comes from seeded random generators, so every learner sees the same story. A "Reshuffle" button changes the seed.
- Animations are SVG plus Framer Motion tweens, with D3 used for scales and layout. No 3D in v1.

## 6. Architecture
```
React 18 + TypeScript + Vite   (HashRouter → works from file:// too)
├─ data/        curriculum, glossary, placement quiz, chooser tree
├─ lib/         ml.ts (pure algorithms), datasets.ts (seeded), progress.ts (localStorage)
├─ components/  StepPlayer, Scatter, Tex, Quiz, CodeLab (Pyodide CDN), Pipeline, CheatSheet
├─ models/      linear-regression, kmeans, decision-tree  (one folder per animated model)
└─ pages/       Home, SkillTree, Track, Roles, Placement, Topic, Compare, Chooser, Glossary, Search
```
**Why this stack:** React is the most common front-end skill, so colleagues can contribute. D3 gives full control over the animations. KaTeX renders the math quickly. Pyodide runs real scikit-learn in the browser with no server. There is no backend, so there is no hosting cost while it runs locally.
**Risks:** Pyodide downloads about 10 MB on first use and needs internet. `localStorage` progress is lost if the browser data is cleared, and it can't be reported on across a team.

## 7. Extras
- **Compare view**: the same 2D dataset with logistic regression, k-NN and a decision tree side by side, showing decision boundaries and accuracy.
- **Model chooser**: an interactive flowchart ("Do you have labels? → Is the target numeric? …") that ends on a recommended set of topics.
- **Search + glossary**: instant search across topics and glossary terms. Glossary entries link to topics.
- **Cheat sheets**: print-optimised CSS, saved as PDF with the browser's "Save as PDF".

## 8. Roadmap
| Phase | Deliverable |
|---|---|
| 1 (done) | Shell, 4 path modes, curriculum of 69 topics, 3 fully animated pilots (Linear Regression, K-Means, Decision Tree), extras |
| 2 | Gradient descent, CLT, hypothesis testing, logistic regression, k-NN, PCA, random forest, metrics pages (~20) |
| 3 | Remaining stats tests, boosting, SVM, clustering family, time series basics, MLP (~25) |
| 4 | Advanced: GLMs, kernels, GMM, t-SNE/UMAP, ARIMA, recommenders, stacking; hosting on Azure Static Web Apps |

**Content effort is the bottleneck, not code.** Each new model needs a frame generator, a playground, about 6 quiz items and the story text. Budget about 1 day per model.

## 9. How to add a model
1. Write a pure frame generator in `lib/ml.ts`.
2. Create `models/<id>/index.tsx` exporting a `ModelContent` object (see `models/types.ts`).
3. Register it in `models/registry.ts`.

The topic page picks it up automatically.

## 10. Long-form guides (added 2026-11-12)
Some models get an optional **Full guide** tab: a chapter-based course rendered by `src/guide/Guide.tsx` (sticky chapter navigator, "read" checkmarks and last position in `localStorage`, Alt+←/→ navigation). A model opts in by setting `Guide` on its `ModelContent`. It's lazy-loaded.

**Linear Regression guide** (`src/guide/linreg/`): 20 chapters, ~6 h, layered depth (intuition → formulas → collapsible "deep dive" derivations).
- `chapters1–5.tsx`: the text, 4–5 chapters per file
- `widgets1–5.tsx`: interactive pieces, grouped by chapter range
- `sim.ts`: synthetic data with switchable assumption violations (breaker, coverage simulation, diagnose exercises)
- `facts.ts`: numbers quoted in the prose, computed from the data so text and widgets never disagree
- `code.ts`: Python snippets (CodeLab now accepts `packages` and `globals`, used to load statsmodels and inject the dataset as `AD_CSV`)

**Statistics engine** (`src/lib/stats.ts`): OLS with full inference, HC0/HC1/HC3, WLS, intervals, nested F, Mallows' Cp, influence measures, VIF, condition number, Shapiro–Wilk (Royston AS R94), Jarque–Bera, Breusch–Pagan (Koenker), White, Durbin–Watson, RESET, Rainbow (Utts, central half by leverage), Box–Cox MLE, LOWESS, Ridge, Elastic Net/Lasso (coordinate descent, sklearn objective), k-fold CV.

**Verification:** `npm run verify:stats` compares 46 quantities with statsmodels 0.15, scipy and scikit-learn (all agree to ≤1e-7 relative error; most to 1e-13). `npm run verify:snippets` executes every Python snippet; they were also run against Pyodide 0.26.4's library versions (numpy 1.26, scipy 1.12, scikit-learn 1.4.2, statsmodels 0.14.2).

**Data:** `src/lib/advertising.ts` builds a seeded synthetic replica of ISLR's Advertising data (200 markets) that reproduces the textbook lessons: newspaper is significant alone (p < 0.001) but not next to radio (p ≈ 0.70); TV × radio interaction and TV curvature (RESET p < 1e-6); heteroscedasticity (BP p ≈ 0.0002).

**Template for future guides:** reuse `Guide`, `ui.tsx` (Plot, DiagPlots, CoefTable, TestTable, Callout, Deep…) and the same file split. Budget ~3–4 days per guide-depth model (vs ~1 day for the 8-tab page).


## 10. v0.3: clarity update (2026-11-12)
Feedback: the tool was not user-friendly, and most pages had no clear explanation.
- **Lessons for all 69 topics** (`src/lessons/`): goals, why it matters, plain-English explanation, the formula read out in words, a worked example with numbers, use/avoid playbook, common mistakes, Python (copy or run in the browser), interview questions, takeaways and a quick check. No topic page is empty any more.
- **Every topic opens on the Lesson tab.** Animated pages show a suggested path (Lesson → Watch → Try → Quiz). Each interactive tab has a "How to use this" box listing what to try and what to notice.
- **Linear Regression beginner view:** the Lesson tab is the default; the 20-chapter guide moved to a "Deep dive" tab.
- **Home redesigned** around one primary action (Start/Continue), a 3-step "how it works", and "best for" guidance for each learning mode. New **Playbook** page lists every topic with its key point.
- Intro boxes added to the skill tree, track, roles, compare and glossary pages.
- Verification: all 69 practice snippets run in CPython (statsmodels/xgboost/mlxtend ones flagged "run locally"); Playwright opens all 69 topic pages and every tab with no console errors.


## 11. v0.4: textbook chapters and full-width layout (2026-11-12)
Feedback: the page did not use the full width, and the theory was too short and hard to follow (too compressed, too much jargon, no diagrams, too few examples).
- **Full-width layout**: the main column and lessons now use the whole screen.
- **A textbook chapter for every one of the 69 topics** (`src/lessons/deep/g-*.ts`, about 158,000 words in total; 1,900–2,700 words and 14–19 minutes each). Each chapter has 8 sections (problem → intuition → step by step → math explained slowly → worked examples → topic-specific section → real world → pitfalls) plus a 5–6 question FAQ. Every chapter has at least 4 diagrams on average, at least 3 worked examples with verified numbers, "New term" boxes defining jargon at first use, "Pause and think" questions, and a case study.
- **Diagrams as data**: curve, scatter, bars, table, flow, tree and compare, drawn by `src/components/DiagramView.tsx` in the app theme.
- **Validation**: `npx tsx scripts/validate-deep.ts` checks length, structure, diagram validity and KaTeX for every chapter (all 69 pass). Playwright renders all 69 chapters with no errors, no broken diagrams and no horizontal overflow.
- Writing guide for future chapters: `docs/README-DEEP.md`; gold standard: `g-kmeans.ts`.
- Corrections found while writing: the A/B test sample size is about 3,800 visitors per arm (not 1,900), and the coin example now uses 62 heads so the normal approximation and the exact test agree.


## 12. v0.5: every topic animated (2026-11-12)
Request: animations for all models, taking help from well-known books.
- **All 69 topics now have interactive animations.** The 3 pilots keep their 8-tab pages. The other 66 each get a narrated **Animate** tab (8–30 frames, a caption on every frame, play / step / scrub) and a **Playground** (sliders, choices and click-to-add with live recomputation), each with a "How to use this" guide.
- **Shared toolkit** `src/viz/kit.tsx`: Plot, Dots, FnLine, Seg, Arrow, Label, Region, Bars, MatrixView, Caption, Readout, Slider, Choice, Toggle, Legend, Layout, plus the step player. One file per topic in `src/anim/<id>.tsx`, loaded lazily through `src/anim/registry.ts`. Gold standard: `src/anim/sampling-clt.tsx`. Build guide: `docs/README-ANIM.md`. Test: `node scripts/check-anim.cjs <port> <ids…>`.
- **Book references** (`src/data/references.ts`): every lesson ends with "Further reading", giving chapter and section pointers into ISLR, ESL, Géron, Bishop, Murphy, Freedman, Wasserman, Bruce, Hyndman (FPP3), Goodfellow, McKinney and Strang. The animations follow these books' teaching approaches (e.g. ISLR's flexibility and U-shaped test-error plots, ESL's ridge/lasso constraint regions, Bishop's EM for GMMs, Hyndman's time-series CV diagram) with original visuals and data. No figures are copied.
- Known simplifications (stated in the animations): t-SNE/UMAP is a small teaching simulation, XGBoost is a simplified sketch of the algorithm, and reinforcement learning in "What is ML?" uses value iteration.
