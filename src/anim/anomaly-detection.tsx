// Anomaly detection with Isolation Forest: random cuts isolate an outlier in a few splits but a normal point needs many; path length → score.
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Caption, Readout, Slider, Choice, Layout, Legend, Bars, useStepPlayer, PlayerControls, rng, gauss, C, Scales } from '../viz/kit';
import { Pt } from './_unsup-helpers';

/* ---------- pure helpers ---------- */
interface Box { x0: number; x1: number; y0: number; y1: number }
interface Cut { f: 'x' | 'y'; v: number; box: Box }
const X0: Box = { x0: 0, x1: 10, y0: 0, y1: 24 };
/** Expected path length of an unsuccessful search in a random binary tree with n points (normalises the score). */
const cN = (n: number) => (n <= 1 ? 0 : n === 2 ? 1 : 2 * (Math.log(n - 1) + 0.5772156649) - (2 * (n - 1)) / n);
const score = (h: number, n: number) => Math.pow(2, -h / cN(n));

/** Card transactions of one customer: x = amount (₹ thousand), y = hour of day. */
function transactions(seed = 4, ring = false): Pt[] {
  const r = rng(seed);
  const out: Pt[] = Array.from({ length: 60 }, () => ({ x: Math.max(0.2, 2 + gauss(r) * 0.8), y: Math.min(23, Math.max(7, 14.5 + gauss(r) * 3.2)) }));
  out.push({ x: 8.4, y: 3.2 }, { x: 6.2, y: 20.5 }, { x: 0.6, y: 5.5 });
  if (ring) for (let i = 0; i < 7; i++) out.push({ x: 7.3 + gauss(r) * 0.25, y: 9.5 + gauss(r) * 0.6 }); // a small fraud ring
  return out;
}

/** Grow one isolation path for a target point: random feature, random threshold inside the remaining points' range. */
function isolate(pts: Pt[], target: number, seed: number, maxDepth = 50): Cut[] {
  const r = rng(seed);
  let idx = pts.map((_, i) => i), box = { ...X0 };
  const cuts: Cut[] = [];
  let tries = 0;
  while (idx.length > 1 && cuts.length < maxDepth && tries++ < 4 * maxDepth) {
    const f: 'x' | 'y' = r() < 0.5 ? 'x' : 'y';
    const vals = idx.map((i) => pts[i][f]);
    const lo = Math.min(...vals), hi = Math.max(...vals);
    if (hi - lo < 1e-9) continue;
    const v = lo + r() * (hi - lo);
    cuts.push({ f, v, box: { ...box } });
    const left = pts[target][f] < v;
    idx = idx.filter((i) => (pts[i][f] < v) === left);
    box = f === 'x' ? (left ? { ...box, x1: v } : { ...box, x0: v }) : (left ? { ...box, y1: v } : { ...box, y0: v });
  }
  return cuts;
}
/** Box that contains the target after the first k cuts of its isolation path. */
function boxAfter(cuts: Cut[], k: number, target: Pt): Box {
  let b = { ...X0 };
  cuts.slice(0, k).forEach((c) => { const left = target[c.f] < c.v; b = c.f === 'x' ? (left ? { ...b, x1: c.v } : { ...b, x0: c.v }) : (left ? { ...b, y1: c.v } : { ...b, y0: c.v }); });
  return b;
}
const inBox = (p: Pt, b: Box) => p.x >= b.x0 && p.x <= b.x1 && p.y >= b.y0 && p.y <= b.y1;

/* Full isolation forest (height-limited trees on sub-samples), used for scores everywhere. */
type Node = { f: 'x' | 'y'; v: number; l: Node; r: Node } | { size: number };
function buildTree(pts: Pt[], r: () => number, depth: number, limit: number): Node {
  if (pts.length <= 1 || depth >= limit) return { size: pts.length };
  const f: 'x' | 'y' = r() < 0.5 ? 'x' : 'y';
  const vals = pts.map((p) => p[f]); const lo = Math.min(...vals), hi = Math.max(...vals);
  if (hi - lo < 1e-9) return { size: pts.length };
  const v = lo + r() * (hi - lo);
  return { f, v, l: buildTree(pts.filter((p) => p[f] < v), r, depth + 1, limit), r: buildTree(pts.filter((p) => p[f] >= v), r, depth + 1, limit) };
}
function pathLen(n: Node, p: Pt, d = 0): number { return 'size' in n ? d + cN(n.size) : pathLen(p[n.f] < n.v ? n.l : n.r, p, d + 1); }
function forest(pts: Pt[], trees: number, seed: number, psi = 64) {
  const r = rng(seed), m = Math.min(psi, pts.length), limit = Math.ceil(Math.log2(m));
  const roots = Array.from({ length: trees }, () => {
    const sample = Array.from({ length: m }, () => pts[Math.floor(r() * pts.length)]);
    return buildTree(sample, r, 0, limit);
  });
  return { avgPath: (p: Pt) => roots.reduce((s, t) => s + pathLen(t, p), 0) / roots.length, m };
}

const AX = { xLabel: 'transaction amount (₹ thousand)', yLabel: 'hour of day' };
function CutLine({ s, c, color, width = 1.5 }: { s: Scales; c: Cut; color: string; width?: number }) {
  return c.f === 'x'
    ? <line x1={s.sx(c.v)} x2={s.sx(c.v)} y1={s.sy(c.box.y0)} y2={s.sy(c.box.y1)} stroke={color} strokeWidth={width} />
    : <line x1={s.sx(c.box.x0)} x2={s.sx(c.box.x1)} y1={s.sy(c.v)} y2={s.sy(c.v)} stroke={color} strokeWidth={width} />;
}
function Heat({ s, f, n, cells = 30 }: { s: Scales; f: (p: Pt) => number; n: number; cells?: number }) {
  const w = 10 / cells, h = 24 / cells, out = [];
  for (let i = 0; i < cells; i++) for (let j = 0; j < cells; j++) {
    const sc = score(f({ x: (i + 0.5) * w, y: (j + 0.5) * h }), n);
    out.push(<rect key={i + '-' + j} x={s.sx(i * w)} y={s.sy((j + 1) * h)} width={s.sx(w) - s.sx(0)} height={s.sy(0) - s.sy(h)} shapeRendering="crispEdges" fill={sc > 0.5 ? C.red : C.blue} fillOpacity={Math.min(0.55, Math.abs(sc - 0.5) * 2.2)} />);
  }
  return <>{out}</>;
}

/* ---------- Animate ---------- */
function Animate() {
  const pts = useMemo(() => transactions(4), []);
  const OUT = 60, NORM = useMemo(() => { // the most typical transaction: closest to the centre of the cloud
    let b = 0; pts.slice(0, 60).forEach((p, i) => { if ((p.x - 2) ** 2 + ((p.y - 14.5) / 4) ** 2 < (pts[b].x - 2) ** 2 + ((pts[b].y - 14.5) / 4) ** 2) b = i; }); return b;
  }, [pts]);
  const cutsOut = useMemo(() => isolate(pts, OUT, 11), [pts]);
  const cutsNorm = useMemo(() => isolate(pts, NORM, 11), [pts, NORM]);
  const TREES = 100;
  const paths = useMemo(() => {
    const po: number[] = [], pn: number[] = [];
    for (let t = 0; t < TREES; t++) { po.push(isolate(pts, OUT, 100 + t).length); pn.push(isolate(pts, NORM, 100 + t).length); }
    return { po, pn };
  }, [pts, NORM]);
  const forestF = useMemo(() => forest(pts, 100, 3), [pts]);
  const avgO = paths.po.reduce((a, b) => a + b, 0) / TREES, avgN = paths.pn.reduce((a, b) => a + b, 0) / TREES;
  const n = pts.length;
  // frames
  type F = { kind: 'data' | 'out' | 'norm' | 'many' | 'heat'; k: number };
  const frames: F[] = [{ kind: 'data', k: 0 }];
  cutsOut.forEach((_, k) => frames.push({ kind: 'out', k: k + 1 }));
  const normSteps = cutsNorm.length <= 10 ? cutsNorm.map((_, k) => k + 1) : [1, 2, 3, 4, 5, 6, 7, 8, 9, cutsNorm.length].filter((v, i, a) => a.indexOf(v) === i);
  normSteps.forEach((k) => frames.push({ kind: 'norm', k }));
  frames.push({ kind: 'many', k: 0 }, { kind: 'heat', k: 0 });
  const p = useStepPlayer(frames.length, 1300);
  const f = frames[p.i];
  const target = f.kind === 'out' ? OUT : NORM;
  const cuts = f.kind === 'out' ? cutsOut.slice(0, f.k) : f.kind === 'norm' ? cutsNorm.slice(0, f.k) : [];
  const box = f.kind === 'out' || f.kind === 'norm' ? boxAfter(f.kind === 'out' ? cutsOut : cutsNorm, f.k, pts[target]) : X0;
  const left = pts.filter((q) => inBox(q, box)).length;
  const last = cuts[cuts.length - 1];
  const fmtCut = (c: Cut) => (c.f === 'x' ? `amount < ₹${(c.v * 1000).toFixed(0)}?` : `hour < ${c.v.toFixed(1)}?`);
  const hist = (arr: number[]) => Array.from({ length: 16 }, (_, i) => ({ x: i + 1, y: arr.filter((v) => v === i + 1).length }));
  const caption =
    f.kind === 'data' ? <>{n} card transactions of one customer. Most are ₹1–3k during the day. One is <b>₹8,400 at 3 am</b> (red ring). Isolation Forest does not model "normal"; it asks <b>how easy each point is to isolate</b> with random yes/no questions.</>
      : f.kind === 'out' ? <>Random question {f.k}: <b>"{fmtCut(last)}"</b> (random feature, random threshold). Keep only the side containing the 3 am transaction (shaded). {left === 1 ? <><b>Isolated after just {f.k} cut{f.k > 1 ? 's' : ''}!</b> Few and different points get separated almost immediately.</> : <>{left} points still share its box.</>}</>
        : f.kind === 'norm' ? <>Now the same game for a <b>typical</b> transaction (blue ring). Cut {f.k}: "{fmtCut(last)}". {left > 1 ? <>{left} points still share its box: it is surrounded by look-alikes, so every cut removes only a few.</> : <><b>Finally isolated after {f.k} cuts</b>, versus {cutsOut.length} for the outlier.</>}</>
          : f.kind === 'many' ? <>One tree is luck. Repeat with <b>{TREES} random trees</b>: the outlier needs on average <b>{avgO.toFixed(1)}</b> cuts, the typical point <b>{avgN.toFixed(1)}</b>. Score s = 2^(−h / c(n)) with c({n}) = {cN(n).toFixed(2)}: outlier s ≈ <b>{score(avgO, n).toFixed(2)}</b> (anomalous), typical s ≈ <b>{score(avgN, n).toFixed(2)}</b> (normal).</>
            : <>The same scoring for every location (sub-samples of {forestF.m}, 100 trees): <b>red = short paths = anomalous</b>, blue = long paths = normal. The 3 am transaction and the other strays land in red. No labelled fraud was needed, just "few and different".</>;
  return (
    <div>
      <Layout
        main={<Plot x={[0, 10]} y={[0, 24]} height={420} {...AX} yTicks={6}>
          {(s) => <>
            {f.kind === 'heat' && <Heat s={s} f={forestF.avgPath} n={forestF.m} />}
            {(f.kind === 'out' || f.kind === 'norm') && <rect x={s.sx(box.x0)} y={s.sy(box.y1)} width={s.sx(box.x1) - s.sx(box.x0)} height={s.sy(box.y0) - s.sy(box.y1)} fill={f.kind === 'out' ? C.red : C.blue} fillOpacity={0.12} stroke={f.kind === 'out' ? C.red : C.blue} strokeOpacity={0.6} />}
            {cuts.map((c, i) => <CutLine key={i} s={s} c={c} color={i === cuts.length - 1 ? C.gold : C.muted} width={i === cuts.length - 1 ? 2.5 : 1.2} />)}
            {pts.map((q, i) => {
              const sc = f.kind === 'heat' ? score(forestF.avgPath(q), forestF.m) : 0;
              const dim = (f.kind === 'out' || f.kind === 'norm') && !inBox(q, box);
              return <circle key={i} cx={s.sx(q.x)} cy={s.sy(q.y)} r={4.5} fill={f.kind === 'heat' ? (sc > 0.6 ? C.red : C.blue) : C.blue} opacity={dim ? 0.3 : 1} stroke={C.bg} />;
            })}
            {f.kind !== 'norm' && <circle cx={s.sx(pts[OUT].x)} cy={s.sy(pts[OUT].y)} r={10} fill="none" stroke={C.red} strokeWidth={2.5} />}
            {f.kind !== 'out' && <circle cx={s.sx(pts[NORM].x)} cy={s.sy(pts[NORM].y)} r={10} fill="none" stroke={C.blue} strokeWidth={2.5} />}
          </>}
        </Plot>}
        side={<>
          <Readout items={[
            ['cuts so far', f.kind === 'out' || f.kind === 'norm' ? f.k : '–', C.gold],
            ['points in box', f.kind === 'out' || f.kind === 'norm' ? left : '–'],
            ['outlier: path', f.kind === 'many' || f.kind === 'heat' ? avgO.toFixed(1) : f.kind === 'norm' ? cutsOut.length : '–', C.red],
            ['typical: path', f.kind === 'many' || f.kind === 'heat' ? avgN.toFixed(1) : '–', C.blue],
            ['outlier score', f.kind === 'many' || f.kind === 'heat' ? score(avgO, n).toFixed(2) : '–', C.red],
            ['typical score', f.kind === 'many' || f.kind === 'heat' ? score(avgN, n).toFixed(2) : '–', C.blue],
          ]} />
          {(f.kind === 'many' || f.kind === 'heat') && <>
            <div className="small muted">Cuts needed to isolate, over {TREES} trees</div>
            <Plot x={[0, 17]} y={[0, Math.max(...hist(paths.po).map((d) => d.y)) * 1.1]} width={300} height={150} xTicks={8} yTicks={3} xLabel="path length (cuts)">
              {(s) => <><Bars s={s} data={hist(paths.pn)} width={0.42} color={C.blue} /><Bars s={s} data={hist(paths.po).map((d) => ({ x: d.x - 0.42, y: d.y }))} width={0.42} color={C.red} /></>}
            </Plot>
          </>}
          <Legend items={[['3 am outlier', C.red], ['typical transaction', C.blue], ['latest cut', C.gold]]} />
          <p className="small muted" style={{ margin: 0 }}>Score near 1 = isolated very quickly (anomaly). Around 0.5 or below = an ordinary point.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caption}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
function Playground() {
  const [ring, setRing] = useState<'single' | 'ring'>('single');
  const [added, setAdded] = useState<Pt[]>([]);
  const [trees, setTrees] = useState(100);
  const [thr, setThr] = useState(0.6);
  const [seed, setSeed] = useState(3);
  const pts = useMemo(() => [...transactions(4, ring === 'ring'), ...added], [ring, added]);
  const F = useMemo(() => forest(pts, trees, seed), [pts, trees, seed]);
  const scores = useMemo(() => pts.map((q) => score(F.avgPath(q), F.m)), [pts, F]);
  const flagged = scores.filter((v) => v >= thr).length;
  const lastScore = added.length ? scores[scores.length - 1] : undefined;
  return (
    <Layout
      main={<>
        <Plot x={[0, 10]} y={[0, 24]} height={420} {...AX} yTicks={6} onClick={(q) => setAdded([...added, q])}>
          {(s) => <>
            <Heat s={s} f={F.avgPath} n={F.m} cells={25} />
            {pts.map((q, i) => <circle key={i} cx={s.sx(q.x)} cy={s.sy(q.y)} r={i >= pts.length - added.length ? 6 : 4.5} fill={scores[i] >= thr ? C.red : C.blue} stroke={i >= pts.length - added.length ? C.gold : C.bg} strokeWidth={i >= pts.length - added.length ? 2 : 1} />)}
          </>}
        </Plot>
        <p className="small muted" style={{ marginTop: 4 }}>Click anywhere to add a transaction (gold ring) and see its anomaly score.</p>
      </>}
      side={<>
        <Choice label="Data" value={ring} onChange={(v) => { setRing(v); setAdded([]); }} options={[{ value: 'single', label: 'Lone outliers' }, { value: 'ring', label: '+ fraud ring' }]} />
        <Slider label="trees" min={1} max={200} value={trees} onChange={setTrees} />
        <Slider label="alert threshold" min={0.4} max={0.8} step={0.01} value={thr} onChange={setThr} format={(v) => v.toFixed(2)} />
        <button className="btn" onClick={() => setSeed(seed + 1)}>🎲 Grow a new forest</button>
        <Readout items={[['flagged', `${flagged} / ${pts.length}`, C.red], ['last added score', lastScore !== undefined ? lastScore.toFixed(2) : '–', C.gold], ['sub-sample size', F.m]]} />
        <p className="small muted" style={{ margin: 0 }}>With 1 tree the map is blocky and changes with every new forest; with 100+ trees it is stable. A tight fraud ring isolates less easily than a lone outlier: groups of anomalies can hide each other.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'An **Isolation Forest** cuts the data with random yes/no questions. We count how many cuts it takes to isolate a **₹8,400 transaction at 3 am** (red ring) versus a **typical** one (blue ring).', steps: [
      { do: 'Step through the first cuts.', notice: 'The shaded box around the red-ringed outlier shrinks to a single point in only a few cuts.' },
      { do: 'Keep stepping through the blue-ringed point\'s cuts.', notice: 'It is surrounded by similar transactions, so it takes many more cuts to isolate.' },
      { do: 'Go to the last two frames.', notice: 'Over 100 trees, short average paths give scores near 1 (anomaly); the heat map shows which regions are suspicious.' },
    ] },
    Playground: { what: 'A full Isolation Forest scores every location (red = anomalous). Change the number of trees and the alert threshold, add your own transactions, and try a small fraud ring.', steps: [
      { do: 'Click in an empty corner, then right in the middle of the cloud.', notice: 'The corner point scores high (red); the middle point scores low (blue).' },
      { do: 'Set **trees** to 1, then click **Grow a new forest** a few times.', notice: 'One tree gives a blocky, unstable map. Averaging many trees makes the scores reliable.' },
      { do: 'Switch to **+ fraud ring** and move the threshold.', notice: 'The 7 clustered frauds score lower than a lone outlier because they shield each other: lower the threshold or add features.' },
    ] },
  },
};
export default anim;
