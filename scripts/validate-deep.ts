// Usage: npx tsx scripts/validate-deep.ts [topicId ...]
// Checks every textbook chapter for completeness, structure, diagrams and valid KaTeX.
import fs from 'fs';
import path from 'path';
import katex from 'katex';
import { TOPICS } from '../src/data/curriculum';
import type { DeepLesson, Block, Diagram, TreeNodeSpec } from '../src/lessons/deep/types';

const dir = path.resolve('src/lessons/deep');
const all: Record<string, DeepLesson> = {};
for (const f of fs.readdirSync(dir).filter((f) => /^g-.*\.ts$/.test(f))) {
  const mod = await import(path.join(dir, f));
  for (const rec of Object.values(mod) as Record<string, DeepLesson>[]) for (const [k, v] of Object.entries(rec)) {
    if (all[k]) console.log(`DUPLICATE ${k} in ${f}`);
    all[k] = v;
  }
}
const only = process.argv.slice(2);
const ids = only.length ? only : TOPICS.map((t) => t.id);
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
let fails = 0;

function texOk(t: string) { try { katex.renderToString(t, { throwOnError: true }); return null; } catch (e: any) { return e.message.slice(0, 120); } }
function depth(n: TreeNodeSpec): number { return 1 + Math.max(0, ...(n.children ?? []).map(depth)); }
function diagErr(d: Diagram): string | null {
  if (!d.caption) return 'diagram without caption';
  switch (d.kind) {
    case 'flow': return d.nodes.length < 2 || d.nodes.length > 6 ? 'flow needs 2-6 nodes' : null;
    case 'bars': return d.labels.length !== d.values.length || !d.values.every(isFinite) ? 'bars labels/values mismatch' : null;
    case 'curve': {
      try {
        const f = new Function('x', `"use strict"; return (${d.fn});`) as (x: number) => number;
        const g = d.fn2 ? new Function('x', `"use strict"; return (${d.fn2});`) as (x: number) => number : null;
        const xs = [0, .25, .5, .75, 1].map((t) => d.xMin + t * (d.xMax - d.xMin));
        if (xs.filter((x) => isFinite(f(x))).length < 3) return `curve fn mostly non-finite: ${d.fn}`;
        if (g && xs.filter((x) => isFinite(g(x))).length < 3) return `curve fn2 mostly non-finite`;
        if (!(d.xMax > d.xMin)) return 'curve xMax <= xMin';
      } catch (e: any) { return 'curve fn error ' + e.message; }
      return null;
    }
    case 'scatter': return d.points.length < 3 || !d.points.every((p) => isFinite(p[0]) && isFinite(p[1])) ? 'scatter needs >=3 finite points' : null;
    case 'table': return d.rows.some((r) => r.length !== d.head.length) ? 'table row length != head length' : null;
    case 'compare': return !d.left.items.length || !d.right.items.length ? 'compare needs items' : null;
    case 'tree': return depth(d.root) > 4 ? 'tree too deep' : null;
  }
  return 'unknown diagram kind';
}

for (const id of ids) {
  const L = all[id];
  if (!L) { console.log(`MISSING ${id}`); fails++; continue; }
  const errs: string[] = [];
  const texts: string[] = [L.hook];
  let diagrams = 0, examples = 0, terms = 0, thinks = 0, cases = 0, formulas = 0;
  const visit = (b: Block) => {
    if ('p' in b) texts.push(b.p);
    else if ('term' in b) { terms++; texts.push(b.term, b.def); }
    else if ('tex' in b) { formulas++; texts.push(b.plain); const e = texOk(b.tex); if (e) errs.push(`bad tex "${b.tex.slice(0, 50)}": ${e}`); b.symbols?.forEach(([s, m]) => { texts.push(m); const e2 = texOk(s); if (e2) errs.push(`bad symbol tex "${s}"`); }); }
    else if ('steps' in b) texts.push(...b.steps, b.title ?? '');
    else if ('bullets' in b) texts.push(...b.bullets);
    else if ('diagram' in b) { diagrams++; texts.push(b.diagram.caption); const e = diagErr(b.diagram); if (e) errs.push(e); }
    else if ('example' in b) { examples++; texts.push(b.example.title, b.example.setup, ...b.example.steps, b.example.result); }
    else if ('callout' in b) texts.push(b.callout);
    else if ('case' in b) { cases++; texts.push(b.case.title, b.case.story); }
    else if ('think' in b) { thinks++; texts.push(b.think.q, b.think.a); }
    else errs.push('unknown block ' + JSON.stringify(b).slice(0, 60));
  };
  L.sections.forEach((s) => { texts.push(s.heading); s.blocks.forEach(visit); });
  L.faq.forEach((f) => texts.push(f.q, f.a));
  const w = words(texts.join(' '));
  if (w < 1500) errs.push(`too short: ${w} words (min 1500)`);
  if (w > 3400) errs.push(`too long: ${w} words (max 3400)`);
  if (L.sections.length < 6) errs.push(`only ${L.sections.length} sections (min 6)`);
  if (diagrams < 2) errs.push(`only ${diagrams} diagrams (min 2)`);
  if (examples < 2) errs.push(`only ${examples} worked examples (min 2)`);
  if (terms < 3) errs.push(`only ${terms} term boxes (min 3)`);
  if (thinks < 1) errs.push('no think block');
  if (cases < 1) errs.push('no case study');
  if (L.faq.length < 4) errs.push(`only ${L.faq.length} FAQ (min 4)`);
  const status = errs.length ? 'FAIL' : 'ok  ';
  if (errs.length) fails++;
  console.log(`${status} ${id.padEnd(24)} ${String(w).padStart(5)} words · ${L.sections.length} sec · ${diagrams} diag · ${examples} ex · ${terms} terms · ${formulas} tex · ${L.faq.length} faq · ~${L.minutes} min${errs.length ? '\n     - ' + errs.join('\n     - ') : ''}`);
}
console.log(fails ? `\n${fails} topic(s) need fixing` : '\nAll checked topics pass.');
process.exit(fails ? 1 : 0);
