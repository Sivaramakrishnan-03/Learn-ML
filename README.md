# LearnPath ML

The ML & statistics playbook: a learning-path web app with 69 topics. Every topic has a plain-English lesson, a worked example, playbook advice (when to use or avoid it), runnable Python and a quick check. Key models are fully animated.

## Run it

### Option 1: no install (quickest)
Double-click **`LearnPath-ML.html`** in this folder. It opens in Chrome or Edge.
Everything works offline except the **Code** tab: running Python in the browser downloads Pyodide (about 10 MB) the first time, so it needs internet.

### Option 2: developer mode (to edit the code)
Requires [Node.js 20+](https://nodejs.org).
```bash
npm install
npm run dev            # open http://localhost:5173
npm run build:single   # rebuild the one-file LearnPath-ML.html (output: dist-single/index.html)
```

## What's inside
| Area | Where |
|---|---|
| Curriculum (69 topics, prerequisites, roles, roadmap phase) | `src/data/curriculum.ts` |
| Textbook chapters for all 69 topics (diagrams, worked examples, FAQ) | `src/lessons/deep/g-*.ts` (guide: `docs/README-DEEP.md`, check: `npx tsx scripts/validate-deep.ts`) |
| Goals, playbook, Python practice and quick checks for all 69 topics | `src/lessons/*.ts` |
| "How to use this" guidance for the interactive tabs | `src/models/howto.ts`, `src/components/HowTo.tsx` |
| Animations for every topic (Animate + Playground) | `src/anim/<topic-id>.tsx` (toolkit `src/viz/kit.tsx`, guide `docs/README-ANIM.md`) |
| Textbook references per topic | `src/data/references.ts` |
| Playbook overview page | `src/pages/Playbook.tsx` |
| Skill tree · linear track · role tracks · adaptive placement quiz | `src/pages/` |
| Animated models: Linear Regression, K-Means, Decision Tree | `src/models/` |
| Pure algorithm and animation-frame generators | `src/lib/ml.ts` |
| Regression statistics engine (OLS, tests, diagnostics, regularisation, CV) | `src/lib/stats.ts` |
| Long-form guide shell, shared plots/tables, Linear Regression chapters and widgets | `src/guide/` |
| Compare view · "Which model?" flowchart · glossary · search | `src/pages/` |
| Product and technical spec, roadmap | `docs/SPEC.md` |

Every topic page opens with a **Lesson**: goals, why it matters, the idea in plain English, the formula read out in words, a worked example, when to use it, common mistakes, Python, takeaways and a quick check.
Animated topics add **Animate · Playground · Pipeline · Math · Code · Quiz · Cheat sheet** tabs, each with a "How to use this" guide. Linear Regression also has a 20-chapter **Deep dive**.

### Linear Regression: the full guide
Linear Regression also has a **📘 Full guide** tab (opens by default): 20 chapters in 6 parts with a chapter navigator and per-browser reading progress.

| Part | Chapters |
|---|---|
| I · Foundations | business story (Advertising data, Galton) · intuition · OLS math (calculus, matrix form, projection, Gauss–Markov, distribution of β̂, MLE) |
| II · Assumptions & diagnostics | LINE+ assumptions · 4 diagnostic plots · formal tests (Shapiro–Wilk, Jarque–Bera, Breusch–Pagan, White, Durbin–Watson, RESET, Rainbow) · multicollinearity (VIF, condition number) · influence (leverage, Cook's D, DFFITS) |
| III · Inference | t / F tests, ANOVA, partial F · remedies (HC robust SEs, WLS, log, Box–Cox) · confidence vs prediction intervals |
| IV · Evaluation & selection | R², adj R², RMSE, MAE, MAPE · AIC / BIC / Cp, best subset, stepwise pitfalls · k-fold CV, bias–variance, leakage |
| V · Extensions | dummies, interactions, polynomials, scaling · gradient descent (batch / mini-batch / SGD) · Ridge, Lasso, Elastic Net |
| VI · Practice | end-to-end pipeline · auto-filled model card (Markdown download) · quiz, interview questions, diagnose-this-model, cheat sheet |

Interactive pieces: drag-points playground, assumption breaker (with a coverage simulation), least-squares animation, influence lab, collinearity lab, remedy lab, CV / bias–variance lab, gradient-descent contours, regularisation paths with L1/L2 geometry, pipeline stepper. Every chapter ends with runnable Python (NumPy from scratch, statsmodels, scikit-learn). The first statsmodels run downloads extra Pyodide packages (roughly 30–40 MB in total), so it needs internet.

The business case uses a **synthetic replica of the ISLR Advertising data** (`src/lib/advertising.ts`, seeded). Chapter 1 has a *Download advertising.csv* button for your own notebooks.

### Checking the numbers
All statistics in the guide come from `src/lib/stats.ts` (no dependencies). Two checks need Python with `statsmodels`, `scipy` and `scikit-learn`:
```bash
npm run verify:stats      # 46 checks: stats.ts vs statsmodels / scipy / scikit-learn
npm run verify:snippets   # runs every Python snippet in the guide
```

Progress is saved in your browser only. Clearing browser data resets it.

## Add the next model
1. Write a frame generator in `src/lib/ml.ts`.
2. Create `src/models/<topic-id>.tsx` exporting a `ModelContent` object (copy `kmeans.tsx` as a template).
3. Register it in `src/models/registry.ts` and set its status to full in `src/data/curriculum.ts` (the `FULL` set).
