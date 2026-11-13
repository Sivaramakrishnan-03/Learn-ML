// Bagging: bootstrap samples → one jagged tree each → averaged vote is smoother and less variable.
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, FnLine, Seg, Label, Caption, Readout, Slider, Toggle, Layout, Legend, useStepPlayer, PlayerControls, rng, C, SERIES } from '../viz/kit';
import { credit, growTree, predict, bootstrap, treeGrid, boundary, Field, Boundary, ClassDots, CLS, AX, CP, TNode, G, mean } from './_ensembles-helpers';

/* ---------- pure helpers ---------- */
const XY = (pts: CP[]) => pts.map((p) => [p.x, p.y]);
const LAB = (pts: CP[]) => pts.map((p) => p.label);
interface Bag { trees: TNode[]; counts: number[][]; grids: Uint8Array[]; cum: Float32Array[] }
function bag(pts: CP[], B: number, depth: number, seed: number): Bag {
  const r = rng(seed), X = XY(pts), y = LAB(pts);
  const trees: TNode[] = [], counts: number[][] = [], grids: Uint8Array[] = [], cum: Float32Array[] = [];
  const acc = new Float32Array(G * G);
  for (let b = 0; b < B; b++) {
    const bs = bootstrap(pts.length, r);
    const w = bs.counts; // a row drawn k times counts k times
    const t = growTree(X, y, w, { maxDepth: depth, minLeaf: 1 }, bs.idx.filter((v, i, a) => a.indexOf(v) === i)).root;
    trees.push(t); counts.push(bs.counts);
    const g = treeGrid(t); grids.push(g);
    for (let k = 0; k < G * G; k++) acc[k] += g[k];
    cum.push(Float32Array.from(acc, (v) => v / (b + 1)));
  }
  return { trees, counts, grids, cum };
}
const vote = (trees: TNode[], q: number[], B = trees.length) => mean(trees.slice(0, B).map((t) => (predict(t, q) > 0.5 ? 1 : 0)));
function testAccCurve(bg: Bag, test: CP[]) {
  const votes = test.map(() => 0);
  return bg.trees.map((t, b) => {
    test.forEach((p, i) => { votes[i] += predict(t, [p.x, p.y]) > 0.5 ? 1 : 0; });
    return mean(test.map((p, i) => ((votes[i] / (b + 1) >= 0.5 ? 1 : 0) === p.label ? 1 : 0)));
  });
}
function oobAcc(bg: Bag, pts: CP[], B: number) {
  let ok = 0, n = 0;
  pts.forEach((p, i) => {
    let v = 0, k = 0;
    for (let b = 0; b < B; b++) if (bg.counts[b][i] === 0) { v += predict(bg.trees[b], [p.x, p.y]) > 0.5 ? 1 : 0; k++; }
    if (k) { n++; if ((v / k >= 0.5 ? 1 : 0) === p.label) ok++; }
  });
  return n ? ok / n : NaN;
}
const PROBE = [4.7, 5.8]; // ₹14 lakh income, credit score 648: right on the corner of the two rules
const NOISE = 0.1;
/** Dot-plot positions: values binned to `bw`, stacked upward. */
function pile(vals: number[], bw: number) { const seen = new Map<number, number>(); return vals.map((v) => { const b = Math.round(v / bw); const k = seen.get(b) ?? 0; seen.set(b, k + 1); return { x: b * bw, k }; }); }

/* ---------- Animate ---------- */
const N = 70;
function Animate() {
  const pts = useMemo(() => credit(N, 18, NOISE), []);
  const test = useMemo(() => credit(500, 99, NOISE), []);
  const bg = useMemo(() => bag(pts, 100, 8, 21), [pts]);
  const single = useMemo(() => growTree(XY(pts), LAB(pts), pts.map(() => 1), { maxDepth: 8 }).root, [pts]);
  const singleGrid = useMemo(() => treeGrid(single), [single]);
  const curve = useMemo(() => testAccCurve(bg, test), [bg, test]);
  const singleAcc = useMemo(() => mean(test.map((p) => ((predict(single, [p.x, p.y]) > 0.5 ? 1 : 0) === p.label ? 1 : 0))), [single, test]);
  // variance of the prediction at the probe point across 30 fresh training sets
  const spread = useMemo(() => Array.from({ length: 30 }, (_, s) => {
    const d = credit(N, 300 + s, NOISE);
    const one = predict(growTree(XY(d), LAB(d), d.map(() => 1), { maxDepth: 8 }).root, PROBE) > 0.5 ? 1 : 0;
    return { one, bag: vote(bag(d, 25, 8, 40 + s).trees, PROBE) };
  }), []);
  const sd = (a: number[]) => { const m = mean(a); return Math.sqrt(mean(a.map((v) => (v - m) ** 2))); };
  type F = { kind: 'data' | 'boot' | 'fit' | 'many' | 'var'; b: number };
  const frames: F[] = [{ kind: 'data', b: 0 }];
  for (let b = 1; b <= 5; b++) frames.push({ kind: 'boot', b }, { kind: 'fit', b });
  [10, 25, 50, 100].forEach((b) => frames.push({ kind: 'many', b }));
  frames.push({ kind: 'var', b: 100 });
  const p = useStepPlayer(frames.length, 1500);
  const f = frames[p.i];
  const B = f.kind === 'boot' ? f.b - 1 : f.b;
  const cnt = f.kind === 'boot' || f.kind === 'fit' ? bg.counts[f.b - 1] : null;
  const field = f.kind === 'data' ? singleGrid : B > 0 ? bg.cum[B - 1] : null;
  const oob = cnt ? cnt.filter((c) => c === 0).length : 0;
  const dbl = cnt ? cnt.filter((c) => c >= 2).length : 0;
  const probeVotes = B > 0 ? Math.round(vote(bg.trees, PROBE, B) * B) : 0;
  const oneSd = sd(spread.map((d) => d.one)), bagSd = sd(spread.map((d) => d.bag));
  const caption = {
    data: <>70 loan applicants: <b style={{ color: CLS[1] }}>circles repaid</b>, <b style={{ color: CLS[0] }}>squares defaulted</b>. One deep tree grown on all of them draws this <b>jagged boundary</b> (yellow): it bends around single noisy points. Its accuracy on 500 fresh applicants is {(singleAcc * 100).toFixed(0)}%. Change a few rows and it would look very different: <b>high variance</b>.</>,
    boot: <>Bootstrap sample #{f.b}: draw 70 rows <b>with replacement</b>. Bigger dots were drawn twice or more ({dbl} rows), faded ones were not drawn at all: <b>{oob} rows ({Math.round((oob / N) * 100)}%) are out-of-bag</b>. Each sample is a slightly distorted copy of the data.</>,
    fit: <>Tree #{f.b} is grown on that sample; its own boundary is the thin coloured line. The yellow line is the <b>majority vote of all {f.b} tree{f.b > 1 ? 's' : ''}</b> so far. {f.b >= 3 ? <>Notice the trees disagree on details but agree on the big picture, so the vote ignores the quirks.</> : <>Every tree is jagged in its own way. Dark patches = the trees disagree (a 1–1 tie).</>}</>,
    many: <><b>{f.b} trees.</b> The shading shows the vote share (darker = more agreement). The averaged boundary is now <b>much smoother</b> than any single tree, and accuracy on fresh applicants is {(curve[f.b - 1] * 100).toFixed(0)}% vs {(singleAcc * 100).toFixed(0)}% for one tree. At the gold ✚ applicant, {probeVotes} of {f.b} trees vote "repaid".</>,
    var: <>Why it works: we repeat the whole experiment on <b>30 fresh training sets</b> and record the prediction for the ✚ applicant. A single tree's answer is a coin flip: {spread.filter((d) => d.one).length} of 30 say repaid, the rest say default (SD {oneSd.toFixed(2)}); a bag of 25 trees gives a vote share that wobbles about half as much (SD {bagSd.toFixed(2)}). <b>Averaging cuts variance</b>, without adding bias.</>,
  }[f.kind];
  return (
    <div>
      <Layout
        main={<Plot x={[0, 10]} y={[0, 10]} height={460} {...AX}>
          {(s) => <>
            {field && <Field s={s} field={field} />}
            {(f.kind === 'fit' || f.kind === 'boot') && bg.grids.slice(0, B).map((g, k) => <Boundary key={k} s={s} segs={boundary(g)} color={SERIES[(k + 2) % SERIES.length]} width={k === B - 1 && f.kind === 'fit' ? 2 : 1} opacity={k === B - 1 && f.kind === 'fit' ? 0.95 : 0.35} />)}
            {f.kind === 'many' && bg.grids.slice(Math.max(0, B - 8), B).map((g, k) => <Boundary key={k} s={s} segs={boundary(g)} color={C.muted} width={1} opacity={0.3} />)}
            {field && <Boundary s={s} segs={boundary(field)} color={C.yellow} width={3} />}
            <ClassDots s={s} pts={pts} r={(i) => (cnt ? (cnt[i] === 0 ? 4 : 4 + 2.2 * (cnt[i] - 1)) : 5)} op={(i) => (cnt && cnt[i] === 0 ? 0.25 : 1)} label={(i) => (f.kind === 'boot' && cnt && cnt[i] >= 2 ? `×${cnt[i]}` : null)} />
            <Label s={s} x={PROBE[0]} y={PROBE[1]} color={C.gold} size={20} anchor="middle">✚</Label>
          </>}
        </Plot>}
        side={<>
          <Readout items={[
            ['trees in the bag', B],
            ['out-of-bag rows', cnt ? `${oob} / ${N}` : '–'],
            ['1 tree: fresh accuracy', `${(singleAcc * 100).toFixed(1)}%`, C.red],
            ['bag: fresh accuracy', B ? `${(curve[B - 1] * 100).toFixed(1)}%` : '–', C.yellow],
            ['votes "repaid" at ✚', B ? `${probeVotes} / ${B}` : '–', C.gold],
          ]} />
          {f.kind !== 'var' ? <>
            <div className="small muted">accuracy on 500 fresh applicants vs number of trees</div>
            <Plot x={[1, 100]} y={[0.7, 0.95]} width={340} height={190} xLabel="trees B" fy={(v) => `${Math.round(v * 100)}%`} xTicks={5} yTicks={5}>
              {(s) => <>
                <Seg s={s} x1={1} x2={100} y1={singleAcc} y2={singleAcc} color={C.red} dash="5 4" />
                {B > 1 && <FnLine s={s} f={(x) => curve[Math.round(x) - 1]} from={1} to={B} n={Math.max(2, B - 1)} color={C.yellow} />}
                <Label s={s} x={60} y={singleAcc - 0.015} color={C.red} size={11}>single tree</Label>
              </>}
            </Plot>
          </> : <>
            <div className="small muted">prediction at ✚ across 30 training sets (P(repaid))</div>
            <Plot x={[-0.05, 1.05]} y={[0, 3]} width={340} height={220} xLabel="predicted P(repaid)" fy={() => ''} yTicks={3} xTicks={5}>
              {(s) => <>
                <Label s={s} x={0.5} y={2.75} color={C.red} size={11} anchor="middle">single tree (top) · bag of 25 (bottom)</Label>
                {pile(spread.map((d) => d.one), 0.04).map((d, k) => <circle key={'o' + k} cx={s.sx(d.x) + (d.k % 2 ? 4 : -4) * (d.x > 0.5 ? -1 : 1)} cy={s.sy(1.7) - Math.floor(d.k / 2) * 6} r={3} fill={C.red} />)}
                {pile(spread.map((d) => d.bag), 0.04).map((d, k) => <circle key={'b' + k} cx={s.sx(d.x)} cy={s.sy(0.25) - d.k * 6} r={3} fill={C.yellow} />)}
              </>}
            </Plot>
            <Readout items={[['SD, one tree', oneSd.toFixed(2), C.red], ['SD, bag of 25', bagSd.toFixed(2), C.yellow]]} />
          </>}
          <Legend items={[['repaid', CLS[1]], ['default', CLS[0]], ['bagged vote boundary', C.yellow], ['probe applicant', C.gold]]} />
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caption}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
function Playground() {
  const [B, setB] = useState(25);
  const [depth, setDepth] = useState(8);
  const [seed, setSeed] = useState(7);
  const [showTrees, setShowTrees] = useState(true);
  const pts = useMemo(() => credit(N, seed, NOISE), [seed]);
  const test = useMemo(() => credit(500, 99, NOISE), []);
  const bg = useMemo(() => bag(pts, 100, depth, seed * 7 + 1), [pts, depth, seed]);
  const curve = useMemo(() => testAccCurve(bg, test), [bg, test]);
  const single = useMemo(() => growTree(XY(pts), LAB(pts), pts.map(() => 1), { maxDepth: depth }).root, [pts, depth]);
  const singleAcc = mean(test.map((p) => ((predict(single, [p.x, p.y]) > 0.5 ? 1 : 0) === p.label ? 1 : 0)));
  const oob = useMemo(() => oobAcc(bg, pts, B), [bg, pts, B]);
  const field = bg.cum[B - 1];
  return (
    <Layout
      main={<Plot x={[0, 10]} y={[0, 10]} height={460} {...AX}>
        {(s) => <>
          <Field s={s} field={field} />
          {showTrees && bg.grids.slice(0, Math.min(B, 12)).map((g, k) => <Boundary key={k} s={s} segs={boundary(g)} color={SERIES[(k + 2) % SERIES.length]} width={1} opacity={0.4} />)}
          <Boundary s={s} segs={boundary(field)} color={C.yellow} width={3} />
          <ClassDots s={s} pts={pts} />
        </>}
      </Plot>}
      side={<>
        <Slider label="trees B" min={1} max={100} value={B} onChange={setB} />
        <Slider label="tree depth" min={1} max={10} value={depth} onChange={setDepth} />
        <Toggle label="show individual tree boundaries (first 12)" value={showTrees} onChange={setShowTrees} />
        <button className="btn" onClick={() => setSeed(seed + 1)}>🎲 New training sample</button>
        <Readout items={[
          ['1 tree: fresh acc.', `${(singleAcc * 100).toFixed(1)}%`, C.red],
          ['bag: fresh acc.', `${(curve[B - 1] * 100).toFixed(1)}%`, C.yellow],
          ['bag: OOB acc.', isFinite(oob) ? `${(oob * 100).toFixed(1)}%` : '–', C.green],
        ]} />
        <Plot x={[1, 100]} y={[0.6, 1]} width={340} height={170} xLabel="trees B" fy={(v) => `${Math.round(v * 100)}%`} xTicks={5} yTicks={4}>
          {(s) => <>
            <Seg s={s} x1={1} x2={100} y1={singleAcc} y2={singleAcc} color={C.red} dash="5 4" />
            <FnLine s={s} f={(x) => curve[Math.round(x) - 1]} from={1} to={100} n={99} color={C.yellow} />
            <Seg s={s} x1={B} x2={B} y1={0.6} y2={1} color={C.gold} width={1} dash="3 3" />
          </>}
        </Plot>
        <p className="small muted" style={{ margin: 0 }}>Try tree depth 1 (stumps): every bootstrap stump is nearly the same, so bagging cannot help. Bagging fixes <b>variance</b>, not <b>bias</b>. OOB accuracy (green) estimates fresh accuracy without a test set.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'We draw **bootstrap samples** from 70 loan applicants, grow one deep tree on each, and let the trees **vote**. Watch the jagged single-tree boundary turn into a smooth averaged one.', steps: [
      { do: 'Press **▶ Step** through the first bootstrap sample.', notice: 'Some rows are drawn twice (bigger, ×2) and about a third are left out (faded): these are **out-of-bag**.' },
      { do: 'Keep stepping through trees 1 to 5.', notice: 'Each tree\'s thin boundary is jagged in a different place; the yellow vote boundary keeps only what they agree on.' },
      { do: 'Play to the end and compare the two SD numbers.', notice: 'Across 30 fresh training sets, the bag\'s prediction moves far less than a single tree\'s: **variance shrinks**.' },
    ] },
    Playground: { what: 'Change the number of trees and their depth, redraw the training data, and compare single-tree, bagged and out-of-bag accuracy.', steps: [
      { do: 'Slide **trees B** from 1 to 100.', notice: 'The yellow boundary smooths out and the accuracy curve rises quickly, then flattens: extra trees never hurt, they just stop helping.' },
      { do: 'Press **New training sample** a few times at B = 1, then at B = 100.', notice: 'One tree changes shape wildly; the bag of 100 barely changes.' },
      { do: 'Set **tree depth = 1**.', notice: 'Bagged stumps are no better than one stump: bagging reduces variance, but stumps suffer from bias.' },
    ] },
  },
};
export default anim;
