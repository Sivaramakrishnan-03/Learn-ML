# LearnPath ML

**The ML & statistics playbook.** A learning-path web app with 69 topics, from vectors and p-values to random forests, time series and neural networks. Every topic has:

- a **lesson in three depths**: a 5-minute core, a full textbook chapter (about 2,000 words, with diagrams, worked examples and FAQ), and a practitioner toolkit (when to use it, mistakes, Python, interview questions, book references)
- a narrated **animation** and an interactive **playground**, each with a "How to use this" guide
- a **quiz** (8+ questions per topic) and a printable **cheat sheet**

The app also has track **exams**, an adaptive **placement quiz** covering every topic, 10 end-to-end **projects**, full-text search, a light and dark theme, and progress backup.

> ⚠️ The content was drafted with AI assistance and checked with automated tests (arithmetic verified in Python, every animation tested in a browser). Not every page has been reviewed by a subject-matter expert yet. Use **🐞 Report a mistake** on any page.

## Use it

- **No install:** download `LearnPath-ML.html` from the latest [GitHub release](../../releases) or the CI run's artifact, then double-click it. Everything works offline except the ▶ Run buttons, which download in-browser Python (Pyodide) the first time. If your network blocks that, set an internal mirror in ⚙️ Settings.
- **Developer mode** (Node.js 20+):
  ```bash
  npm install
  npm run dev            # http://localhost:5173
  npm run build:single   # writes LearnPath-ML.html
  ```

## Project layout

| What | Where |
|---|---|
| Teaching content as JSON (editable without React) | `content/topics/<id>/lesson.json`, `chapter.json` · `content/quizzes/<id>.json` · `content/projects/<id>.json` · schemas in `content/schema/` |
| Topic list, prerequisites, roles | `src/data/curriculum.ts` |
| Book references | `src/data/references.ts` |
| Animations (one per topic) | `src/anim/<id>.tsx`, toolkit `src/viz/kit.tsx`, maths `src/viz/math.ts` (pilots: `src/models/`) |
| Pages and components | `src/pages/`, `src/components/` |
| Writing and animation guides | `docs/README-DEEP.md`, `docs/README-ANIM.md`, `CONTRIBUTING.md` |
| Product spec and changelog | `docs/SPEC.md` |

## Quality checks

```bash
npm run verify       # typecheck + unit tests + content validation + build
npm run snippets     # run every Python snippet (pip install -r requirements-snippets.txt)
npm run dev & node scripts/check-anim.cjs 5173 <topic ids…>   # browser test of animations
```

GitHub Actions runs all of these on every push (`.github/workflows/ci.yml`). Tagging `v*` publishes the single-file app as a release (`release.yml`).

## Licence

All rights reserved. See `LICENSE`.
