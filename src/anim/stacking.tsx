// Stacking: out-of-fold predictions of base models become the features of a simple meta-model.
import { ReactNode, useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Dots, FnLine, Bars, Label, Caption, Readout, Slider, Choice, Toggle, Layout, Legend, MatrixView, useStepPlayer, PlayerControls, rng, C } from '../viz/kit';
import { mean } from '../viz/math';
import { stores, growTree, predict, RP } from './_ensembles-helpers';

/* ---------- pure helpers ---------- */
type Model = (train: RP[]) => (x: number) => number;
const linear: Model = (tr) => {
  const mx = mean(tr.map((p) => p.x)), my = mean(tr.map((p) => p.y));
  const sxx = tr.reduce((a, p) => a + (p.x - mx) ** 2, 0) || 1, sxy = tr.reduce((a, p) => a + (p.x - mx) * (p.y - my), 0);
  const b = sxy / sxx; return (x) => my + b * (x - mx);
};
const knn = (k: number): Model => (tr) => (x) => mean([...tr].sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x)).slice(0, k).map((p) => p.y));
const tree: Model = (tr) => { const t = growTree(tr.map((p) => [p.x]), tr.map((p) => p.y), tr.map(() => 1), { maxDepth: 2, minLeaf: 3, bounds: [[0, 10]] }).root; return (x) => predict(t, [x]); };
interface Base { name: string; color: string; fit: Model }
const basesFor = (k: number): Base[] => [
  { name: 'linear', color: C.purple, fit: linear },
  { name: k === 1 ? '1-nearest neighbour' : `${k}-nearest neighbours`, color: C.teal, fit: knn(k) },
  { name: 'tree (depth 2)', color: C.pink, fit: tree },
];
/** Fold id for each row: shuffled, balanced. */
function folds(n: number, K: number, seed: number) {
  const r = rng(seed), order = Array.from({ length: n }, (_, i) => ({ i, u: r() })).sort((a, b) => a.u - b.u);
  const f = Array(n).fill(0); order.forEach((o, j) => { f[o.i] = j % K; }); return f as number[];
}
/** Out-of-fold predictions Z[i][m] and, per fold, the base models trained without it. */
function oof(pts: RP[], bases: Base[], fold: number[], K: number) {
  const Z = pts.map(() => bases.map(() => NaN));
  const fitted: ((x: number) => number)[][] = [];
  for (let k = 0; k < K; k++) {
    const tr = pts.filter((_, i) => fold[i] !== k);
    const fs = bases.map((b) => b.fit(tr)); fitted.push(fs);
    pts.forEach((p, i) => { if (fold[i] === k) fs.forEach((f, m) => { Z[i][m] = f(p.x); }); });
  }
  return { Z, fitted };
}
/** Non-negative least squares (no intercept) by cyclic coordinate descent. */
function nnls(Z: number[][], y: number[], iters = 400) {
  const M = Z[0].length, w = Array(M).fill(1 / M);
  for (let it = 0; it < iters; it++) for (let j = 0; j < M; j++) {
    let num = 0, den = 0;
    Z.forEach((z, i) => { const pred = z.reduce((a, v, m) => a + v * w[m], 0); num += z[j] * (y[i] - pred); den += z[j] * z[j]; });
    w[j] = Math.max(0, w[j] + num / (den || 1));
  }
  return w;
}
const mae = (f: (x: number) => number, pts: RP[]) => mean(pts.map((p) => Math.abs(p.y - f(p.x))));
const fmt1 = (v: number) => (isFinite(v) ? v.toFixed(1) : '·');

/* ---------- Animate ---------- */
const N = 30, K = 5;
function Animate() {
  const pts = useMemo(() => stores(N, 5, 1.1), []);
  const test = useMemo(() => stores(300, 99, 1.1), []);
  const bases = useMemo(() => basesFor(1), []);
  const fold = useMemo(() => folds(N, K, 3), []);
  const { Z, fitted } = useMemo(() => oof(pts, bases, fold, K), [pts, bases, fold]);
  const y = pts.map((p) => p.y);
  const w = useMemo(() => nnls(Z, y), [Z]); // eslint-disable-line react-hooks/exhaustive-deps
  const full = useMemo(() => bases.map((b) => b.fit(pts)), [bases, pts]);
  const inZ = useMemo(() => pts.map((p) => full.map((f) => f(p.x))), [pts, full]);
  const wLeak = useMemo(() => nnls(inZ, y), [inZ]); // eslint-disable-line react-hooks/exhaustive-deps
  const stack = (ws: number[]) => (x: number) => full.reduce((a, f, m) => a + ws[m] * f(x), 0);
  const avg = (x: number) => mean(full.map((f) => f(x)));
  const scores = useMemo(() => ({ base: full.map((f) => mae(f, test)), avg: mae(avg, test), stack: mae(stack(w), test), leak: mae(stack(wLeak), test) }), [full, test, w, wLeak]); // eslint-disable-line react-hooks/exhaustive-deps
  // table excerpt: two rows per fold
  const rows = useMemo(() => Array.from({ length: K }, (_, k) => fold.map((f, i) => (f === k ? i : -1)).filter((i) => i >= 0).slice(0, 2)).flat(), [fold]);
  type F = { kind: 'data' | 'fold' | 'table' | 'refit' | 'meta' | 'leak'; k: number };
  const frames: F[] = [{ kind: 'data', k: -1 }, ...Array.from({ length: K }, (_, k) => ({ kind: 'fold' as const, k })), { kind: 'table', k: K }, { kind: 'refit', k: K }, { kind: 'meta', k: K }, { kind: 'leak', k: K }];
  const p = useStepPlayer(frames.length, 2000);
  const f = frames[p.i];
  const doneFolds = f.kind === 'fold' ? f.k + 1 : f.kind === 'data' ? 0 : K;
  const shown = (i: number) => fold[i] < doneFolds;
  const curves = f.kind === 'fold' ? fitted[f.k] : f.kind === 'refit' || f.kind === 'meta' || f.kind === 'leak' ? full : null;
  const ws = f.kind === 'leak' ? wLeak : w;
  const table = rows.map((i) => [...bases.map((_, m) => (shown(i) ? fmt1(Z[i][m]) : '·')), fmt1(pts[i].y)]);
  let caption: ReactNode;
  if (f.kind === 'data') caption = <>30 stores (floor area → monthly sales). We will combine three different <b>base models</b>: a straight line, a 1-nearest-neighbour copycat and a small tree. First the rows are split into <b>5 folds</b> of 6 (numbers next to the dots).</>;
  else if (f.kind === 'fold') caption = <>Fold {f.k + 1}: train all three base models on the <b>other four folds</b> (curves), then predict the 6 held-out stores (gold rings). Those predictions are <b>out-of-fold (OOF)</b>: no model has seen the row it is predicting. They fill rows of the table on the right.</>;
  else if (f.kind === 'table') caption = <>After 5 rounds <b>every store has one honest OOF prediction from every base model</b>. This table is the meta-model's training data: three prediction columns as features, actual sales as target. (Shown: 2 rows per fold.)</>;
  else if (f.kind === 'refit') caption = <>For future use, each base model is <b>refitted on all 30 stores</b>. The line misses the wave, the 1-NN copies every bump of noise, the tree is a coarse staircase. Each is wrong in its own way.</>;
  else if (f.kind === 'meta') caption = <>The <b>meta-model</b> (least squares with non-negative weights) learns from the OOF table: final = {ws.map((v, m) => `${v.toFixed(2)} × ${bases[m].name}`).join(' + ')}. Test error (MAE on 300 new stores): stack <b>{scores.stack.toFixed(2)}</b> vs best single model {Math.min(...scores.base).toFixed(2)} and simple average {scores.avg.toFixed(2)}.</>;
  else caption = <><b>The leaky shortcut:</b> fit the meta-model on <b>in-sample</b> predictions instead. 1-NN predicts its own training rows perfectly, so the meta-model trusts it: weights become {ws.map((v) => v.toFixed(2)).join(' / ')}. Test MAE rises to <b>{scores.leak.toFixed(2)}</b> (vs {scores.stack.toFixed(2)} with OOF). <b>Always fit the meta-model on out-of-fold predictions.</b></>;
  return (
    <div>
      <Layout
        main={<>
          <Plot x={[0, 10]} y={[0, 18]} height={400} xLabel="store floor area (×1000 sq ft)" yLabel="monthly sales (₹ lakh)">
            {(s) => <>
              {curves && curves.map((c, m) => <FnLine key={m} s={s} f={c} color={bases[m].color} width={f.kind === 'meta' || f.kind === 'leak' ? 1.5 : 2.2} n={400} dash={f.kind === 'meta' || f.kind === 'leak' ? '5 4' : undefined} />)}
              {(f.kind === 'meta' || f.kind === 'leak') && <FnLine s={s} f={stack(ws)} color={C.yellow} width={3.2} n={400} />}
              <Dots s={s} pts={pts} r={4.5} animate={false} opacity={f.kind === 'fold' ? 0.8 : 1} />
              {f.kind === 'fold' && pts.map((q, i) => (fold[i] === f.k ? <circle key={'h' + i} cx={s.sx(q.x)} cy={s.sy(q.y)} r={8} fill="none" stroke={C.gold} strokeWidth={2} /> : null))}
              {f.kind === 'fold' && pts.map((q, i) => (fold[i] === f.k ? bases.map((b, m) => <rect key={`o${i}-${m}`} x={s.sx(q.x) - 3.5} y={s.sy(Z[i][m]) - 3.5} width={7} height={7} fill={b.color} stroke={C.bg} />) : null))}
              {f.kind === 'data' && pts.map((q, i) => <Label key={'f' + i} s={s} x={q.x + 0.12} y={q.y + 0.35} color={C.muted} size={11}>{fold[i] + 1}</Label>)}
            </>}
          </Plot>
          {(f.kind === 'meta' || f.kind === 'leak') && <>
            <div className="small muted" style={{ marginTop: 6 }}>test MAE on 300 new stores (lower is better)</div>
            <Plot x={[0.4, 6.6]} y={[0, Math.max(...scores.base, scores.leak) * 1.15]} height={170} xTicks={6} fx={(v) => ['', 'linear', '1-NN', 'tree', 'average', 'stack (OOF)', 'stack (leaky)'][Math.round(v)] ?? ''} yLabel="MAE (₹ lakh)" yTicks={3}>
              {(s) => <Bars s={s} data={[...scores.base, scores.avg, scores.stack, scores.leak].map((v, i) => ({ x: i + 1, y: v }))} width={0.6} color={(i) => [C.purple, C.teal, C.pink, C.grey, C.yellow, C.red][i]} highlight={(i) => (f.kind === 'leak' ? i === 5 : i === 4)} />}
            </Plot>
          </>}
        </>}
        side={<>
          <MatrixView title="meta-model training table (OOF predictions)" colLabels={['lin', '1NN', 'tree', 'actual']} rowLabels={rows.map((i) => `fold ${fold[i] + 1}`)} data={table}
            highlight={(r) => f.kind === 'fold' && fold[rows[r]] === f.k} />
          <div className="small muted">meta-model weights{f.kind === 'leak' ? ' (leaky, in-sample)' : ''}</div>
          <Plot x={[0.4, 3.6]} y={[0, 1.2]} width={340} height={150} xTicks={3} fx={(v) => ['', 'linear', '1-NN', 'tree'][Math.round(v)] ?? ''} yTicks={3}>
            {(s) => (f.kind === 'meta' || f.kind === 'leak') ? <Bars s={s} data={ws.map((v, m) => ({ x: m + 1, y: Math.min(1.2, v) }))} width={0.55} color={(m) => bases[m].color} /> : <Label s={s} x={2} y={0.6} color={C.muted} size={11} anchor="middle">learned at the end</Label>}
          </Plot>
          <Legend items={[...bases.map((b) => [b.name, b.color] as [string, string]), ['stacked model', C.yellow], ['held-out fold', C.gold]]} />
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caption}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
function Playground() {
  const [k, setK] = useState(1);
  const [K2, setK2] = useState(5);
  const [mode, setMode] = useState<'oof' | 'leaky'>('oof');
  const [use, setUse] = useState([true, true, true]);
  const pts = useMemo(() => stores(N, 5, 1.1), []);
  const test = useMemo(() => stores(300, 99, 1.1), []);
  const all = useMemo(() => basesFor(k), [k]);
  const idx = use.map((u, m) => (u ? m : -1)).filter((m) => m >= 0);
  const bases = idx.map((m) => all[m]);
  const res = useMemo(() => {
    if (!bases.length) return null;
    const fold = folds(N, K2, 3);
    const full = bases.map((b) => b.fit(pts));
    const Z = mode === 'oof' ? oof(pts, bases, fold, K2).Z : pts.map((p) => full.map((f) => f(p.x)));
    const w = nnls(Z, pts.map((p) => p.y));
    const stack = (x: number) => full.reduce((a, f, m) => a + w[m] * f(x), 0);
    return { full, w, stack, base: full.map((f) => mae(f, test)), st: mae(stack, test), avg: mae((x) => mean(full.map((f) => f(x))), test) };
  }, [pts, test, k, K2, mode, use.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Layout
      main={<Plot x={[0, 10]} y={[0, 18]} height={440} xLabel="store floor area (×1000 sq ft)" yLabel="monthly sales (₹ lakh)">
        {(s) => <>
          {res && res.full.map((c, m) => <FnLine key={m} s={s} f={c} color={bases[m].color} width={1.5} dash="5 4" n={400} />)}
          {res && <FnLine s={s} f={res.stack} color={C.yellow} width={3} n={400} />}
          <Dots s={s} pts={pts} r={4.5} animate={false} />
        </>}
      </Plot>}
      side={<>
        <div className="small muted">base models</div>
        {all.map((b, m) => <Toggle key={m} label={b.name} value={use[m]} onChange={(v) => setUse(use.map((u, j) => (j === m ? v : u)))} />)}
        <Slider label="k for nearest neighbours" min={1} max={10} value={k} onChange={setK} />
        <Slider label="folds" min={2} max={10} value={K2} onChange={setK2} />
        <Choice label="meta-model trained on" value={mode} onChange={setMode} options={[{ value: 'oof', label: 'out-of-fold' }, { value: 'leaky', label: 'in-sample (leaky)' }]} />
        {res ? <>
          <Readout items={[
            ...bases.map((b, m) => [`${b.name} MAE`, res.base[m].toFixed(2), b.color] as [string, ReactNode, string]),
            ['simple average MAE', res.avg.toFixed(2), C.muted],
            ['stack MAE', res.st.toFixed(2), C.yellow],
          ]} />
          <div className="small muted">weights: {bases.map((b, m) => `${b.name} ${res.w[m].toFixed(2)}`).join(' · ')}</div>
        </> : <p className="small muted">Switch on at least one base model.</p>}
        <p className="small muted" style={{ margin: 0 }}>MAE is measured on 300 new stores. With k = 1 and "in-sample", the meta-model hands almost all weight to the copycat and test error jumps. Out-of-fold predictions keep it honest.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Three different base models predict store sales. **Stacking** builds honest **out-of-fold** predictions fold by fold, then trains a small **meta-model** on them to decide how much to trust each base model.', steps: [
      { do: 'Step through the five **fold** frames.', notice: 'Each time, the curves are trained without the gold-ringed stores, and their predictions (small squares) fill new rows of the table.' },
      { do: 'Continue to the **meta-model** frame.', notice: 'The weights bar chart shows how much each model counts; the yellow stacked curve and the test-error bars show the payoff.' },
      { do: 'Go to the last frame (**leaky**).', notice: 'Fitting on in-sample predictions gives the 1-NN copycat most of the weight, and test error gets worse.' },
    ] },
    Playground: { what: 'Pick which base models to stack, the k of the nearest-neighbour model, the number of folds, and whether the meta-model sees honest out-of-fold or leaky in-sample predictions.', steps: [
      { do: 'Switch the meta-model to **in-sample (leaky)** with k = 1.', notice: 'The 1-NN weight jumps towards 1 and the stack MAE gets worse than with out-of-fold.' },
      { do: 'Back on **out-of-fold**, turn models off one at a time.', notice: 'The stack usually beats or matches the best single model; removing a model that errs differently hurts the most.' },
      { do: 'Raise **k** to 5–8.', notice: 'k-NN becomes a good model on its own, and the meta-model shifts weight towards it.' },
    ] },
  },
};
export default anim;
