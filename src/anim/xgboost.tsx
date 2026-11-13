// XGBoost = gradient boosting + regularised trees: split gain with λ and γ, shrunken leaf weights, early stopping on validation data.
import { ReactNode, useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Dots, FnLine, Seg, Label, Region, Caption, Readout, Slider, Toggle, Layout, Legend, useStepPlayer, PlayerControls, Tex, C } from '../viz/kit';
import { stores, storeTrend, RP, mean } from './_ensembles-helpers';

/* ---------- pure helpers: second-order (XGBoost-style) regression trees, squared loss so g = F − y, h = 1 ---------- */
const gainOf = (GL: number, HL: number, GR: number, HR: number, lam: number) => 0.5 * (GL ** 2 / (HL + lam) + GR ** 2 / (HR + lam) - (GL + GR) ** 2 / (HL + HR + lam));
interface XNode { w: number; t?: number; l?: XNode; r?: XNode; gain?: number }
function xgbTree(x: number[], g: number[], idx: number[], depth: number, maxDepth: number, lam: number, gam: number): XNode {
  const G = idx.reduce((a, i) => a + g[i], 0), H = idx.length;
  const node: XNode = { w: -G / (H + lam) };
  if (depth >= maxDepth || idx.length < 2) return node;
  const s = [...idx].sort((a, b) => x[a] - x[b]);
  let gl = 0, best = { gain: 0, k: -1 };
  for (let k = 0; k < s.length - 1; k++) {
    gl += g[s[k]];
    if (x[s[k + 1]] - x[s[k]] < 1e-12) continue;
    const gn = gainOf(gl, k + 1, G - gl, H - k - 1, lam);
    if (gn > best.gain) best = { gain: gn, k };
  }
  if (best.k < 0) return node;
  node.t = (x[s[best.k]] + x[s[best.k + 1]]) / 2; node.gain = best.gain;
  node.l = xgbTree(x, g, s.slice(0, best.k + 1), depth + 1, maxDepth, lam, gam);
  node.r = xgbTree(x, g, s.slice(best.k + 1), depth + 1, maxDepth, lam, gam);
  // post-pruning as in XGBoost: collapse a split whose children are leaves and whose gain does not beat γ
  if (!node.l.l && !node.r.l && best.gain - gam < 0) return { w: node.w };
  return node;
}
const xPred = (n: XNode, v: number): number => (n.l && n.r ? xPred(v <= n.t! ? n.l : n.r, v) : n.w);
const nLeaves = (n: XNode): number => (n.l && n.r ? nLeaves(n.l) + nLeaves(n.r) : 1);
interface XB { f0: number; trees: XNode[]; eta: number; tr: number[]; va: number[] }
function xgb(pts: RP[], val: RP[], M: number, eta: number, depth: number, lam: number, gam: number): XB {
  const x = pts.map((p) => p.x), f0 = mean(pts.map((p) => p.y));
  const F = pts.map(() => f0), V = val.map(() => f0), trees: XNode[] = [];
  const tr = [mean(pts.map((p) => (p.y - f0) ** 2))], va = [mean(val.map((p) => (p.y - f0) ** 2))];
  const all = pts.map((_, i) => i);
  for (let m = 0; m < M; m++) {
    const g = pts.map((p, i) => F[i] - p.y);
    const t = xgbTree(x, g, all, 0, depth, lam, gam);
    trees.push(t);
    pts.forEach((p, i) => { F[i] += eta * xPred(t, p.x); });
    val.forEach((p, i) => { V[i] += eta * xPred(t, p.x); });
    tr.push(mean(pts.map((p, i) => (p.y - F[i]) ** 2))); va.push(mean(val.map((p, i) => (p.y - V[i]) ** 2)));
  }
  return { f0, trees, eta, tr, va };
}
const xEns = (b: XB, m: number) => (v: number) => { let s = b.f0; for (let k = 0; k < m; k++) s += b.eta * xPred(b.trees[k], v); return s; };
/** Early stopping: stop once validation error has not improved for `patience` rounds; keep the best round. */
function earlyStop(va: number[], patience: number) {
  let best = 0;
  for (let m = 1; m < va.length; m++) { if (va[m] < va[best] - 1e-9) best = m; if (m - best >= patience) return { best, stop: m }; }
  return { best, stop: va.length - 1 };
}

/* ---------- Part A data: the four stores from the lesson ---------- */
const SALES = [10, 14, 20, 28], F0 = 18, GR = SALES.map((y) => F0 - y); // g = prediction − actual = 8, 4, −2, −10
const sumG = (ids: number[]) => ids.reduce((a, i) => a + GR[i], 0);
interface Q { groups: number[][]; lam: number; gam: number; parent?: number[] }
function evalQ(q: Q) {
  const ws = q.groups.map((gp) => -sumG(gp) / (gp.length + q.lam));
  const gain = q.groups.length === 2 ? gainOf(sumG(q.groups[0]), q.groups[0].length, sumG(q.groups[1]), q.groups[1].length, q.lam) : 0;
  return { ws, gain, net: gain - q.gam };
}

/* ---------- Animate ---------- */
function Animate() {
  const pts = useMemo(() => stores(40, 11), []);
  const val = useMemo(() => stores(60, 77), []);
  const b = useMemo(() => xgb(pts, val, 150, 0.1, 2, 1, 0), [pts, val]);
  const es = useMemo(() => earlyStop(b.va, 15), [b]);
  type FA = { part: 'A'; q: Q | null; text: (r: ReturnType<typeof evalQ>) => ReactNode };
  type FB = { part: 'B'; m: number };
  const A: FA[] = [
    { part: 'A', q: null, text: () => <>The four stores from the lesson: sales 10, 14, 20, 28 (₹ lakh). The model starts at <b>18</b> for everyone. For squared error, each store's <b>gradient</b> is g = prediction − actual = <b>8, 4, −2, −10</b> (red), and its hessian h = 1.</> },
    { part: 'A', q: { groups: [[0, 1], [2, 3]], lam: 0, gam: 0 }, text: (r) => <>Split A: small {'{1, 2}'} vs large {'{3, 4}'}. Sums: G = 12, H = 2 and G = −12, H = 2. With <b>λ = 0</b> the leaf weights w = −G/(H+λ) are <b>{r.ws.map((w) => w.toFixed(1)).join(' and +')}</b>: plain average residuals, like ordinary gradient boosting.</> },
    { part: 'A', q: { groups: [[0, 1], [2, 3]], lam: 1, gam: 0 }, text: (r) => <>Same split with <b>λ = 1</b> (XGBoost's default): w = −12/3 and +12/3 = <b>{r.ws[0].toFixed(1)} and +{r.ws[1].toFixed(1)}</b>. The yellow leaf values moved towards 18: λ makes every correction <b>more cautious</b>. Split gain = ½[144/3 + 144/3 − 0²/5] = <b>{r.gain.toFixed(1)}</b>.</> },
    { part: 'A', q: { groups: [[0, 1, 2], [3]], lam: 1, gam: 0 }, text: (r) => <>Split B: {'{1, 2, 3}'} vs {'{4}'}. G = 10, H = 3 and G = −10, H = 1, so gain = ½[100/4 + 100/2 − 0] = <b>{r.gain.toFixed(1)}</b>. That is less than 48, so XGBoost picks <b>split A</b>. The gain formula already contains the penalty.</> },
    { part: 'A', q: { groups: [[2], [3]], lam: 1, gam: 0, parent: [2, 3] }, text: (r) => <>Should the large-store leaf split again into single stores? Gain = ½[(−2)²/2 + (−10)²/2 − (−12)²/3] = ½(2 + 50 − 48) = <b>{r.gain.toFixed(1)}</b>. With <b>γ = 0</b> any positive gain is accepted, so it splits.</> },
    { part: 'A', q: { groups: [[2], [3]], lam: 1, gam: 5, parent: [2, 3] }, text: (r) => <>Now set <b>γ = 5</b>, the price of one extra leaf. Net gain = {r.gain.toFixed(0)} − 5 = <b>{r.net.toFixed(0)}</b> &lt; 0, so the split is <b>pruned</b> (crossed out). γ stops the tree from splitting hairs.</> },
    { part: 'A', q: { groups: [[0], [1]], lam: 1, gam: 0, parent: [0, 1] }, text: (r) => <>The small-store leaf {'{1, 2}'} (g = 8 and 4) with λ = 1: gain = ½[64/2 + 16/2 − 144/3] = <b>{r.gain.toFixed(0)}</b>, refused even with γ = 0. With λ = 0 the same split would score ½(64 + 16 − 72) = +4 and be accepted. <b>λ and γ both guard against tiny, two-row splits.</b></> },
  ];
  const Bf: FB[] = [1, 3, 10, 25, 50].filter((m) => m < es.stop).map((m) => ({ part: 'B' as const, m }));
  if (!Bf.some((f) => f.m === es.best)) Bf.push({ part: 'B', m: es.best });
  Bf.push({ part: 'B', m: es.stop });
  Bf.sort((a, z) => a.m - z.m);
  const frames: (FA | FB)[] = [...A, ...Bf];
  const p = useStepPlayer(frames.length, 2000);
  const f = frames[p.i];
  if (f.part === 'A') {
    const r = f.q ? evalQ(f.q) : null;
    const pruned = !!f.q && r!.net < 0;
    const leafLines: { ids: number[]; w: number }[] = [];
    if (f.q) {
      if (f.q.parent) leafLines.push({ ids: f.q.parent, w: -sumG(f.q.parent) / (2 + f.q.lam) });
      f.q.groups.forEach((gp, k) => leafLines.push({ ids: gp, w: r!.ws[k] }));
    }
    return (
      <div>
        <Layout
          main={<Plot x={[0.4, 4.6]} y={[0, 32]} height={430} xLabel="store" yLabel="monthly sales (₹ lakh)" fx={(v) => (Number.isInteger(v) ? `store ${v}` : '')} xTicks={4}>
            {(s) => <>
              <Seg s={s} x1={0.4} x2={4.6} y1={F0} y2={F0} color={C.muted} dash="5 4" width={1.5} />
              <Label s={s} x={0.45} y={F0 + 0.8} color={C.muted} size={12}>start: 18</Label>
              {SALES.map((y, i) => <Seg key={i} s={s} x1={i + 1} x2={i + 1} y1={F0} y2={y} color={C.red} width={2} />)}
              {SALES.map((y, i) => <Label key={'g' + i} s={s} x={i + 1} y={y < F0 ? y - 2.2 : y + 1.4} color={C.red} size={12} anchor="middle">g = {GR[i] > 0 ? '+' : ''}{GR[i]}</Label>)}
              {f.q && f.q.groups.length === 2 && <Seg s={s} x1={Math.max(...f.q.groups[0]) + 1.5} x2={Math.max(...f.q.groups[0]) + 1.5} y1={0} y2={32} color={pruned ? C.red : C.gold} width={2.5} dash={pruned ? '6 5' : undefined} />}
              {pruned && <Label s={s} x={Math.max(...f.q!.groups[0]) + 1.5} y={30} color={C.red} size={22} anchor="middle">✕</Label>}
              {leafLines.map((L, k) => {
                const isParent = !!f.q?.parent && k === 0;
                if (!isParent && pruned) return null;
                if (isParent && !pruned && r!.net > 0) return <Label key={k} s={s} x={Math.min(...L.ids) + 0.6} y={F0 + L.w + 1} color={C.muted} size={11}>leaf before: {L.w > 0 ? '+' : ''}{L.w.toFixed(0)}</Label>;
                return <g key={k}>
                  <Seg s={s} x1={Math.min(...L.ids) + 0.6} x2={Math.max(...L.ids) + 1.4} y1={F0 + L.w} y2={F0 + L.w} color={isParent ? C.muted : C.yellow} width={isParent ? 1.5 : 3} dash={isParent ? '3 3' : undefined} />
                  {!isParent && <Label s={s} x={Math.max(...L.ids) + 1.4} y={F0 + L.w + (L.w > 0 ? 1 : -2)} color={C.yellow} size={12} anchor="end">w = {L.w > 0 ? '+' : ''}{L.w.toFixed(2)}</Label>}
                </g>;
              })}
              <Dots s={s} pts={SALES.map((y, i) => ({ x: i + 1, y }))} r={7} animate={false} />
            </>}
          </Plot>}
          side={<>
            <div className="small muted">leaf weight and split gain (squared error: h = 1 per row)</div>
            <Tex block>{'w = -\\frac{G}{H+\\lambda}'}</Tex>
            <Tex block>{'\\text{gain} = \\tfrac12\\Big[\\tfrac{G_L^2}{H_L+\\lambda} + \\tfrac{G_R^2}{H_R+\\lambda} - \\tfrac{(G_L+G_R)^2}{H_L+H_R+\\lambda}\\Big] - \\gamma'}</Tex>
            <Readout items={[
              ['λ (L2 on leaf weights)', f.q ? f.q.lam : '–', C.gold],
              ['γ (cost per leaf)', f.q ? f.q.gam : '–', C.gold],
              ['split gain', r ? r.gain.toFixed(1) : '–'],
              ['gain − γ', r ? r.net.toFixed(1) : '–', r ? (r.net > 0 ? C.green : C.red) : undefined],
            ]} />
            <Legend items={[['store sales', C.blue], ['gradient g', C.red], ['leaf value 18 + w', C.yellow], ['split', C.gold]]} />
            <p className="small muted" style={{ margin: 0 }}>Yellow level = 18 + w: where the leaf moves the prediction of its stores. G and H are the sums of g and h over the rows in a leaf.</p>
          </>}
        />
        <PlayerControls p={p} />
        <Caption>{f.text(r!)}</Caption>
      </div>
    );
  }
  const m = f.m;
  const isBest = m === es.best, isStop = m === es.stop;
  const yMax = Math.max(3, Math.ceil(2.2 * b.va[es.best]));
  const caption: ReactNode = isStop
    ? <>Round {m}: validation error has not improved for <b>15 rounds</b> (the patience window, shaded). Training stops and the model is <b>rolled back to round {es.best}</b>, where validation MSE was lowest ({b.va[es.best].toFixed(2)}). Training MSE kept falling ({b.tr[m].toFixed(2)}): it cannot tell you when to stop. Yellow = the kept model, grey dashed = round {m}.</>
    : isBest
      ? <>Round {m}: the <b>lowest validation error so far</b> ({b.va[m].toFixed(2)} on 60 stores the model never trained on). XGBoost remembers this round and keeps going to see whether it can improve.</>
      : m === 1
        ? <>Now the real thing on 40 stores: λ = 1, γ = 0, depth 2, η = 0.1. After <b>1 tree</b> the curve has taken one shrunken step from the average. The green curve tracks error on <b>60 held-out validation stores</b>.</>
        : <>Round {m}: training MSE {b.tr[m].toFixed(2)}, validation MSE {b.va[m].toFixed(2)}. {m < es.best ? 'Both are still falling: the trees are learning real structure.' : 'Training error keeps falling, validation error has stopped improving: new trees mostly fit noise.'}</>;
  return (
    <div>
      <Layout
        main={<Plot x={[0, 10]} y={[0, 18]} height={430} xLabel="store floor area (×1000 sq ft)" yLabel="monthly sales (₹ lakh)">
          {(s) => <>
            <Dots s={s} pts={val} r={3} color={C.muted} animate={false} opacity={0.55} />
            {isStop && <FnLine s={s} f={xEns(b, m)} color={C.muted} width={1.5} dash="4 3" n={500} />}
            <FnLine s={s} f={xEns(b, isStop ? es.best : m)} color={C.yellow} width={3} n={500} />
            <Dots s={s} pts={pts} r={4.5} animate={false} />
          </>}
        </Plot>}
        side={<>
          <Readout items={[
            ['round', isStop ? `${m} → keep ${es.best}` : m],
            ['training MSE', b.tr[m].toFixed(2), C.red],
            ['validation MSE', b.va[m].toFixed(2), C.green],
            ['best round so far', earlyStop(b.va.slice(0, m + 1), 1e9).best, C.gold],
          ]} />
          <div className="small muted">error vs boosting rounds</div>
          <Plot x={[0, Math.max(40, es.stop + 5)]} y={[0, yMax]} width={340} height={220} xLabel="rounds" xTicks={5} yTicks={4}>
            {(s) => <>
              {isStop && <Region s={s} x0={es.best} x1={es.stop} color={C.gold} opacity={0.12} />}
              <FnLine s={s} f={(x) => b.tr[Math.round(x)]} from={0} to={m} n={Math.max(2, m)} color={C.red} />
              <FnLine s={s} f={(x) => b.va[Math.round(x)]} from={0} to={m} n={Math.max(2, m)} color={C.green} />
              {m >= es.best && <Seg s={s} x1={es.best} x2={es.best} y1={0} y2={yMax} color={C.gold} width={1.5} dash="4 3" />}
              {m >= es.best && <Label s={s} x={es.best + 1} y={yMax * 0.9} color={C.gold} size={11}>best</Label>}
            </>}
          </Plot>
          <Legend items={[['training stores', C.blue], ['validation stores', C.muted], ['model', C.yellow], ['validation MSE', C.green], ['training MSE', C.red]]} />
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caption}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
function Playground() {
  const [lam, setLam] = useState(1);
  const [gam, setGam] = useState(0);
  const [eta, setEta] = useState(0.3);
  const [depth, setDepth] = useState(4);
  const [stop, setStop] = useState(true);
  const pts = useMemo(() => stores(40, 11), []);
  const val = useMemo(() => stores(60, 77), []);
  const b = useMemo(() => xgb(pts, val, 200, eta, depth, lam, gam), [pts, val, eta, depth, lam, gam]);
  const es = earlyStop(b.va, 15);
  const used = stop ? es.best : 200;
  const leaves = mean(b.trees.slice(0, Math.max(1, used)).map(nLeaves));
  const yMax = Math.max(3, Math.ceil(2.2 * b.va[es.best]));
  return (
    <Layout
      main={<Plot x={[0, 10]} y={[0, 18]} height={440} xLabel="store floor area (×1000 sq ft)" yLabel="monthly sales (₹ lakh)">
        {(s) => <>
          <FnLine s={s} f={storeTrend} color={C.green} width={1.5} dash="6 4" />
          <Dots s={s} pts={val} r={3} color={C.muted} animate={false} opacity={0.55} />
          <FnLine s={s} f={xEns(b, used)} color={C.yellow} width={3} n={500} />
          <Dots s={s} pts={pts} r={4.5} animate={false} />
        </>}
      </Plot>}
      side={<>
        <Slider label="λ (leaf shrinkage)" min={0} max={20} step={0.5} value={lam} onChange={setLam} />
        <Slider label="γ (cost per leaf)" min={0} max={20} step={0.5} value={gam} onChange={setGam} />
        <Slider label="learning rate η" min={0.05} max={1} step={0.05} value={eta} onChange={setEta} />
        <Slider label="max depth" min={1} max={6} value={depth} onChange={setDepth} />
        <Toggle label="early stopping (patience 15)" value={stop} onChange={setStop} />
        <Readout items={[
          ['trees used', used, C.gold],
          ['validation MSE', b.va[used].toFixed(2), C.green],
          ['training MSE', b.tr[used].toFixed(2), C.red],
          ['avg leaves / tree', leaves.toFixed(1)],
        ]} />
        <Plot x={[0, 200]} y={[0, yMax]} width={340} height={170} xLabel="rounds" xTicks={4} yTicks={3}>
          {(s) => <>
            <FnLine s={s} f={(x) => b.tr[Math.round(x)]} from={0} to={200} n={200} color={C.red} />
            <FnLine s={s} f={(x) => b.va[Math.round(x)]} from={0} to={200} n={200} color={C.green} />
            <Seg s={s} x1={used} x2={used} y1={0} y2={yMax} color={C.gold} width={1.5} dash="4 3" />
          </>}
        </Plot>
        <p className="small muted" style={{ margin: 0 }}>Turn early stopping off with λ = 0, γ = 0, depth 6: the curve memorises the blue stores. Raise γ to 10+ and watch the leaves per tree collapse. These are illustrations on 40 synthetic stores, not benchmarks.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Part 1 replays the lesson\'s **four stores** to show how XGBoost scores a split with **λ** (shrinks leaf weights) and **γ** (charges for each extra leaf). Part 2 boosts 40 stores and uses **early stopping** on validation data.', steps: [
      { do: 'Step through the first frames and watch the yellow leaf levels.', notice: 'Going from λ = 0 to λ = 1 pulls the leaf values towards the starting prediction: smaller, safer corrections.' },
      { do: 'Continue to the γ frames.', notice: 'The same split (gain 2) is accepted with γ = 0 and pruned (✕) with γ = 5.' },
      { do: 'Play through part 2 to the end.', notice: 'Validation error bottoms out; after 15 rounds without improvement training stops and the model rolls back to the best round.' },
    ] },
    Playground: { what: 'Change XGBoost\'s regularisation and see the fitted curve, the training/validation error curves, and the average number of leaves per tree.', steps: [
      { do: 'Turn **early stopping off**, set λ = 0, γ = 0, depth 6.', notice: 'The yellow curve zig-zags through individual stores and validation MSE is clearly worse than training MSE.' },
      { do: 'Now raise **γ** step by step.', notice: '"avg leaves / tree" drops: splits whose gain cannot pay γ are pruned, and the curve becomes simpler.' },
      { do: 'Turn **early stopping on** and change η.', notice: 'With small η, more trees are used before stopping; with large η, it stops after a few big steps.' },
    ] },
  },
};
export default anim;
