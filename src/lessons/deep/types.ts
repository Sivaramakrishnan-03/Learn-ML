// Textbook-chapter format for every topic. Content is pure data so it can be validated and rendered consistently.
// Inline formatting inside any string: **bold** and `code`. Math goes ONLY in `tex` fields (KaTeX syntax).

/** Diagrams are described as data; the app draws them in the dark theme. Keep values in sensible ranges. */
export type Diagram =
  /** Boxes joined by arrows, left to right. 2–6 nodes. */
  | { kind: 'flow'; nodes: string[]; caption: string }
  /** Vertical bars. Optional highlight index. */
  | { kind: 'bars'; labels: string[]; values: number[]; highlight?: number; yLabel?: string; caption: string }
  /** Plot y = f(x). `fn` is a JavaScript expression in x using Math.* (e.g. "Math.exp(-x*x/2)"). Optional shaded x-range, vertical marks, second curve. */
  | { kind: 'curve'; fn: string; fn2?: string; xMin: number; xMax: number; shade?: [number, number]; marks?: { x: number; label: string }[]; xLabel?: string; yLabel?: string; legend?: [string, string]; caption: string }
  /** Scatter plot. points = [x, y, group?] (group 0–5 picks a colour). Optional straight line y = m·x + b and highlighted centres. */
  | { kind: 'scatter'; points: [number, number, number?][]; line?: { m: number; b: number }; centers?: [number, number][]; xLabel?: string; yLabel?: string; caption: string }
  /** A small table (e.g. a dataset sample, a confusion matrix, a comparison). Max ~8 rows × 6 cols. */
  | { kind: 'table'; head: string[]; rows: string[][]; caption: string }
  /** Two-column contrast (e.g. bias vs variance, PCA vs LDA). */
  | { kind: 'compare'; left: { title: string; items: string[] }; right: { title: string; items: string[] }; caption: string }
  /** A small tree (decision tree, hierarchy). Max depth 3. */
  | { kind: 'tree'; root: TreeNodeSpec; caption: string };
export interface TreeNodeSpec { label: string; edge?: string; children?: TreeNodeSpec[] }

export type Block =
  | { p: string }                                              // a paragraph of explanation
  | { term: string; def: string }                              // "new term" box: plain-English definition at first use
  | { tex: string; plain: string; symbols?: [string, string][] } // a formula + what it says in words + optional symbol glossary [symbol(tex), meaning]
  | { steps: string[]; title?: string }                        // an ordered procedure
  | { bullets: string[] }                                      // an unordered list
  | { diagram: Diagram }                                       // a picture
  | { example: { title: string; setup: string; steps: string[]; result: string } } // worked example with numbers
  | { callout: string; tone: 'tip' | 'warn' | 'key' }          // highlighted note
  | { case: { title: string; story: string } }                 // real-world case study
  | { think: { q: string; a: string } };                       // "pause and think" question with a reveal

export interface DeepSection { heading: string; blocks: Block[] }

export interface DeepLesson {
  minutes: number;           // realistic reading time (≈ words / 120 incl. examples)
  hook: string;              // 2–4 sentence opening story
  sections: DeepSection[];   // see the template in README-DEEP.md
  faq: { q: string; a: string }[];
}
