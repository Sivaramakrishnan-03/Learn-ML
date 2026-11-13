// t-SNE & UMAP: a small, simplified neighbour-preserving layout evolving iteration by iteration from random positions.
// Honest simulation: exact gradients on 60 points (no Barnes–Hut / approximate nearest neighbours), random initialisation for both methods.
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, FnLine, Caption, Readout, Slider, Choice, Layout, Legend, Bars, useStepPlayer, PlayerControls, rng, gauss, C, Scales } from '../viz/kit';
import { Pt } from './_unsup-helpers';

/* ---------- pure helpers ---------- */
const GROUPS = ['snacks', 'dairy', 'drinks', 'cleaning'];
const GC = [C.gold, C.blue, C.teal, C.pink];
const DIM = 6, PER = 15;

/** 60 products, each described by 6 numbers (an "embedding" we cannot plot). 4 product families. */
function products(seed = 3) {
  const r = rng(seed);
  const centres = GROUPS.map(() => Array.from({ length: DIM }, () => gauss(r) * 2.2));
  const X: number[][] = [], g: number[] = [];
  centres.forEach((c, k) => { for (let i = 0; i < PER; i++) { X.push(c.map((v) => v + gauss(r) * 0.9)); g.push(k); } });
  return { X, g };
}
const sq = (a: number[], b: number[]) => a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0);
function knn(D: number[][], k: number) { return D.map((row, i) => row.map((d, j) => [d, j]).filter(([, j]) => j !== i).sort((a, b) => a[0] - b[0]).slice(0, k).map(([, j]) => j)); }
/** Share of each point's k nearest neighbours (original space) that are also among its k nearest on the map. */
function preserved(trueNN: number[][], Y: Pt[], k: number) {
  const D = Y.map((a) => Y.map((b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2));
  const mapNN = knn(D, k);
  return trueNN.reduce((s, nn, i) => s + nn.filter((j) => mapNN[i].includes(j)).length / k, 0) / trueNN.length;
}
/** t-SNE input: Gaussian neighbour probabilities with a per-point width chosen to match the perplexity (binary search). */
function affinities(D: number[][], perp: number) {
  const n = D.length, P = D.map(() => Array(n).fill(0)), target = Math.log(perp);
  for (let i = 0; i < n; i++) {
    let lo = 0, hi = Infinity, beta = 1;
    for (let it = 0; it < 60; it++) {
      let sum = 0, h = 0;
      for (let j = 0; j < n; j++) if (j !== i) { P[i][j] = Math.exp(-D[i][j] * beta); sum += P[i][j]; }
      sum = sum || 1e-300;
      for (let j = 0; j < n; j++) if (j !== i) { P[i][j] /= sum; if (P[i][j] > 1e-12) h -= P[i][j] * Math.log(P[i][j]); }
      if (Math.abs(h - target) < 1e-4) break;
      if (h > target) { lo = beta; beta = hi === Infinity ? beta * 2 : (beta + hi) / 2; } else { hi = beta; beta = (beta + lo) / 2; }
    }
  }
  return P.map((row, i) => row.map((v, j) => (v + P[j][i]) / (2 * n)));
}
function randomStart(n: number, seed: number): Pt[] { const r = rng(seed); return Array.from({ length: n }, () => ({ x: gauss(r) * 3, y: gauss(r) * 3 })); }

interface Snap { it: number; Y: Pt[]; cost: number }
function runTSNE(D: number[][], perp: number, seed: number, iters = 400, every = 5): Snap[] {
  const n = D.length, P = affinities(D, perp);
  let Y = randomStart(n, seed); const V = Y.map(() => ({ x: 0, y: 0 }));
  const snaps: Snap[] = [];
  for (let t = 0; t <= iters; t++) {
    const ex = t < 80 ? 4 : 1, mom = t < 80 ? 0.5 : 0.8, lr = 50;
    const num = Y.map((a) => Y.map((b) => 1 / (1 + (a.x - b.x) ** 2 + (a.y - b.y) ** 2)));
    let Z = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j) Z += num[i][j];
    if (t % every === 0) {
      let cost = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j && P[i][j] > 1e-12) cost += P[i][j] * Math.log(P[i][j] / Math.max(num[i][j] / Z, 1e-12));
      snaps.push({ it: t, Y: Y.map((p) => ({ ...p })), cost });
    }
    if (t === iters) break;
    Y = Y.map((a, i) => {
      let gx = 0, gy = 0;
      for (let j = 0; j < n; j++) if (j !== i) { const m = 4 * (ex * P[i][j] - num[i][j] / Z) * num[i][j]; gx += m * (a.x - Y[j].x); gy += m * (a.y - Y[j].y); }
      V[i].x = mom * V[i].x - lr * gx; V[i].y = mom * V[i].y - lr * gy;
      return { x: a.x + V[i].x, y: a.y + V[i].y };
    });
  }
  return snaps;
}
/** UMAP-style layout: fuzzy k-nearest-neighbour graph, attraction along edges and repulsion elsewhere, map similarity 1/(1 + a·d^2b). */
function runUMAP(D: number[][], k: number, seed: number, iters = 300, every = 5): Snap[] {
  const n = D.length, nn = knn(D, k), W = D.map(() => Array(n).fill(0));
  nn.forEach((list, i) => {
    const rho = Math.sqrt(D[i][list[0]]);
    // width sigma so that the edge weights sum to log2(k), as in UMAP
    let lo = 0, hi = 1e3, sig = 1;
    for (let it = 0; it < 50; it++) { const s = list.reduce((t, j) => t + Math.exp(-Math.max(0, Math.sqrt(D[i][j]) - rho) / sig), 0); if (s > Math.log2(k)) hi = sig; else lo = sig; sig = (lo + hi) / 2; }
    list.forEach((j) => { W[i][j] = Math.exp(-Math.max(0, Math.sqrt(D[i][j]) - rho) / sig); });
  });
  const Wsym = W.map((row, i) => row.map((v, j) => v + W[j][i] - v * W[j][i]));
  const a = 1.58, b = 0.9; // roughly min_dist = 0.1
  let Y = randomStart(n, seed); const snaps: Snap[] = [];
  const clip = (v: number) => Math.max(-4, Math.min(4, v));
  for (let t = 0; t <= iters; t++) {
    if (t % every === 0) {
      let cost = 0;
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const d2 = (Y[i].x - Y[j].x) ** 2 + (Y[i].y - Y[j].y) ** 2, q = 1 / (1 + a * Math.pow(d2, b)), w = Wsym[i][j];
        cost += -(w * Math.log(Math.max(q, 1e-9)) + (1 - w) * Math.log(Math.max(1 - q, 1e-9)));
      }
      snaps.push({ it: t, Y: Y.map((p) => ({ ...p })), cost: cost / n });
    }
    if (t === iters) break;
    const lr = 1 - t / iters;
    Y = Y.map((p, i) => {
      let gx = 0, gy = 0;
      for (let j = 0; j < n; j++) if (j !== i) {
        const dx = p.x - Y[j].x, dy = p.y - Y[j].y, d2 = dx * dx + dy * dy + 1e-6, w = Wsym[i][j];
        const att = w * (-2 * a * b * Math.pow(d2, b - 1)) / (1 + a * Math.pow(d2, b));
        const rep = (1 - w) * (2 * b) / ((0.001 + d2) * (1 + a * Math.pow(d2, b))) * 0.3; // repulsion down-weighted, like UMAP's negative sampling
        gx += clip((att + rep) * dx); gy += clip((att + rep) * dy);
      }
      return { x: p.x + lr * 0.1 * gx, y: p.y + lr * 0.1 * gy };
    });
  }
  return snaps;
}
/** Axis limits that fit a layout with equal units on both axes. */
function frameOf(Y: Pt[], aspect = 1.9) {
  const xs = Y.map((p) => p.x), ys = Y.map((p) => p.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const h = Math.max((Math.max(...ys) - Math.min(...ys)) / 2, (Math.max(...xs) - Math.min(...xs)) / 2 / aspect, 0.5) * 1.15;
  return { x: [cx - h * aspect, cx + h * aspect] as [number, number], y: [cy - h, cy + h] as [number, number] };
}
function Map2D({ s, Y, g, focus, nn }: { s: Scales; Y: Pt[]; g: number[]; focus?: number; nn?: number[] }) {
  return <>
    {focus !== undefined && nn && nn.map((j) => <line key={'l' + j} x1={s.sx(Y[focus].x)} y1={s.sy(Y[focus].y)} x2={s.sx(Y[j].x)} y2={s.sy(Y[j].y)} stroke={C.yellow} strokeOpacity={0.5} strokeWidth={1.2} />)}
    {Y.map((p, i) => <circle key={i} cx={s.sx(p.x)} cy={s.sy(p.y)} r={i === focus ? 7 : 5} fill={GC[g[i]]} stroke={i === focus ? C.text : nn?.includes(i) ? C.yellow : C.bg} strokeWidth={i === focus || nn?.includes(i) ? 2.5 : 1} />)}
  </>;
}

/* ---------- Animate ---------- */
const SHOW = [0, 5, 15, 30, 50, 80, 120, 200, 300, 400];
const K = 5;

function Animate() {
  const { X, g } = useMemo(() => products(3), []);
  const D = useMemo(() => X.map((a) => X.map((b) => sq(a, b))), [X]);
  const trueNN = useMemo(() => knn(D, K), [D]);
  const snaps = useMemo(() => runTSNE(D, 10, 7), [D]);
  const P = useMemo(() => affinities(D, 10), [D]);
  const focus = 3;
  type F = { kind: 'start' | 'scores' | 'iter' | 'read'; it: number };
  const frames: F[] = [{ kind: 'start', it: 0 }, { kind: 'scores', it: 0 }, ...SHOW.slice(1).map((it) => ({ kind: 'iter' as const, it })), { kind: 'read', it: 400 }];
  const p = useStepPlayer(frames.length, 1400);
  const f = frames[p.i];
  const snap = snaps.find((s) => s.it === f.it)!;
  const pres = preserved(trueNN, snap.Y, K);
  const view = frameOf(snaps[snaps.length - 1].Y);
  const view0 = frameOf(snaps[0].Y);
  const v = f.it < 50 ? view0 : view;
  const topP = P[focus].map((pv, j) => ({ pv: pv * 2 * X.length, j })).filter((o) => o.j !== focus).sort((a, b) => b.pv - a.pv).slice(0, 8);
  const costs = snaps.filter((s) => s.it <= f.it);
  const caption =
    f.kind === 'start' ? <>60 grocery products, each described by <b>6 numbers</b> (sales pattern, price band, basket partners…). We cannot draw 6-D, so t-SNE starts by throwing the products onto a 2-D page <b>at random</b>. Colours show the product family; <b>t-SNE never sees them</b>, we only use them to judge the result. The white-ringed product's 5 true nearest neighbours are ringed in yellow.</>
      : f.kind === 'scores' ? <>Step 1, in the original 6-D space: turn distances into <b>neighbour scores</b> with a bell curve. The bars show the white-ringed product's scores: its 5 true neighbours get almost all the weight, distant products get ≈ 0. The width is set by <b>perplexity = 10</b> ("about 10 effective neighbours").</>
        : f.it <= 80 ? <>Iteration {f.it}: points are pulled towards their high-score neighbours and pushed away from everyone else. For the first 80 iterations the pull is exaggerated (×4) so <b>families clump together quickly</b>. Neighbours kept: <b>{(pres * 100).toFixed(0)}%</b>.</>
          : f.kind === 'iter' ? <>Iteration {f.it}: normal forces. The heavy-tailed <b>t-curve</b> on the map lets clusters spread into <b>well-separated islands</b>. The cost (mismatch between original and map neighbour scores) keeps falling. Neighbours kept: <b>{(pres * 100).toFixed(0)}%</b>.</>
            : <>Final map: four islands that match the four families, and <b>{(pres * 100).toFixed(0)}%</b> of each product's 5 nearest neighbours are still its nearest on the map. Read it carefully: <b>who is next to whom</b> is meaningful; island sizes and the gaps between islands are not. (This is a small, simplified t-SNE: exact forces on 60 points.)</>;
  return (
    <div>
      <Layout
        main={<Plot x={v.x} y={v.y} height={420} xLabel="map dimension 1 (no units)" yLabel="map dimension 2" fx={() => ''} fy={() => ''}>
          {(s) => <Map2D s={s} Y={snap.Y} g={g} focus={focus} nn={trueNN[focus]} />}
        </Plot>}
        side={<>
          <Readout items={[['iteration', f.it], ['neighbours kept (k=5)', `${(pres * 100).toFixed(0)}%`, C.green], ['cost (KL)', snap.cost.toFixed(2), C.red], ['exaggeration', f.it < 80 && f.kind === 'iter' ? '×4' : '×1']]} />
          {f.kind === 'scores' || f.kind === 'start' ? <>
            <div className="small muted">Ringed product: neighbour scores in 6-D (top 8)</div>
            <Plot x={[-0.6, 7.6]} y={[0, Math.max(...topP.map((o) => o.pv)) * 1.1]} width={300} height={140} xTicks={8} yTicks={2} fx={(d) => (Number.isInteger(d) ? `#${topP[d]?.j ?? ''}` : '')} grid={false}>
              {(s) => <Bars s={s} data={topP.map((o, i) => ({ x: i, y: f.kind === 'scores' ? o.pv : 0 }))} width={0.6} color={(i) => (trueNN[focus].includes(topP[i].j) ? C.yellow : C.grey)} />}
            </Plot>
          </> : <>
            <div className="small muted">Cost by iteration</div>
            <Plot x={[0, 400]} y={[0, Math.max(...snaps.map((s) => s.cost)) * 1.05]} width={300} height={140} xTicks={4} yTicks={3}>
              {(s) => <path d={costs.map((c, i) => `${i ? 'L' : 'M'}${s.sx(c.it)},${s.sy(c.cost)}`).join('')} fill="none" stroke={C.red} strokeWidth={2} />}
            </Plot>
          </>}
          <div className="small muted">Bell curve (6-D) vs t-curve (map)</div>
          <Plot x={[0, 5]} y={[0, 1]} width={300} height={120} xTicks={5} yTicks={2} xLabel="distance">
            {(s) => <><FnLine s={s} f={(d) => Math.exp(-d * d / 2)} color={C.blue} width={2} /><FnLine s={s} f={(d) => 1 / (1 + d * d)} color={C.yellow} width={2} /></>}
          </Plot>
          <Legend items={[...GROUPS.map((n, i) => [n, GC[i]] as [string, string]), ['true neighbours', C.yellow]]} />
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caption}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
function Playground() {
  const { X, g } = useMemo(() => products(3), []);
  const D = useMemo(() => X.map((a) => X.map((b) => sq(a, b))), [X]);
  const trueNN = useMemo(() => knn(D, K), [D]);
  const [method, setMethod] = useState<'tsne' | 'umap'>('tsne');
  const [nb, setNb] = useState(10);
  const [seed, setSeed] = useState(7);
  const snaps = useMemo(() => (method === 'tsne' ? runTSNE(D, nb, seed, 400, 10) : runUMAP(D, nb, seed, 300, 10)), [D, method, nb, seed]);
  const [step, setStep] = useState(1);
  const snap = snaps[Math.round(step * (snaps.length - 1))];
  const pres = preserved(trueNN, snap.Y, K);
  const v = frameOf(snap.Y);
  const [focus, setFocus] = useState(3);
  return (
    <Layout
      main={<>
        <Plot x={v.x} y={v.y} height={420} xLabel="map dimension 1 (no units)" yLabel="map dimension 2" fx={() => ''} fy={() => ''}
          onClick={(q) => { let b = 0; snap.Y.forEach((pt, i) => { if ((pt.x - q.x) ** 2 + (pt.y - q.y) ** 2 < (snap.Y[b].x - q.x) ** 2 + (snap.Y[b].y - q.y) ** 2) b = i; }); setFocus(b); }}>
          {(s) => <Map2D s={s} Y={snap.Y} g={g} focus={focus} nn={trueNN[focus]} />}
        </Plot>
        <p className="small muted" style={{ marginTop: 4 }}>Click a product to see its 5 true (6-D) neighbours, joined by yellow lines. Short lines = a faithful map around that product.</p>
      </>}
      side={<>
        <Choice label="Method" value={method} onChange={setMethod} options={[{ value: 'tsne', label: 't-SNE' }, { value: 'umap', label: 'UMAP-style' }]} />
        <Slider label={method === 'tsne' ? 'perplexity' : 'n_neighbors'} min={2} max={40} value={nb} onChange={setNb} />
        <Slider label="progress" min={0} max={1} step={0.02} value={step} onChange={setStep} format={() => `it ${snap.it}`} />
        <button className="btn" onClick={() => setSeed(seed + 1)}>🎲 New random start</button>
        <Readout items={[['neighbours kept', `${(pres * 100).toFixed(0)}%`, C.green], [method === 'tsne' ? 'cost (KL)' : 'cost (cross-entropy)', snap.cost.toFixed(2), C.red]]} />
        <Legend items={GROUPS.map((n, i) => [n, GC[i]] as [string, string])} />
        <p className="small muted" style={{ margin: 0 }}>A simplified simulation on 60 points. Real libraries add speed tricks (Barnes–Hut, approximate neighbours) and UMAP starts from a spectral layout, not random.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'A small, simplified **t-SNE** arranges 60 products (6 numbers each) on a 2-D page, starting from **random positions**. Colours are product families, used only to judge the result.', steps: [
      { do: 'Look at frame 2 (the bars).', notice: 'In the original space, the ringed product gives almost all its "neighbour score" to its 5 nearest products (yellow bars).' },
      { do: 'Press **▶ Play**.', notice: 'Families clump together during the exaggerated early phase, then separate into islands; "neighbours kept" climbs from about 10% (random) to over 70%.' },
      { do: 'Watch the yellow lines from the white-ringed product.', notice: 'They start long (random map) and become short: its true neighbours end up next to it.' },
    ] },
    Playground: { what: 'Run t-SNE or a UMAP-style layout yourself. Change the **neighbourhood size**, scrub through the iterations and restart from different random positions.', steps: [
      { do: 'Set perplexity to **2**, then to **40**.', notice: 'Tiny neighbourhoods shatter families into small fragments; large ones keep families whole but squeeze detail.' },
      { do: 'Click **New random start** several times.', notice: 'Islands land in different places and orientations each time: positions and gaps between islands carry no meaning.' },
      { do: 'Switch to **UMAP-style** and drag **progress** from 0.', notice: 'Same goal, different forces (attraction only along nearest-neighbour edges). Neighbours kept is similar, but island shapes and positions differ: compare structure, not coordinates.' },
    ] },
  },
};
export default anim;
