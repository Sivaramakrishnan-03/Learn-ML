// k-Nearest Neighbours: a new customer finds its k nearest past customers and they vote; the decision boundary smooths as k grows; scaling matters.
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Dots, Seg, Label, Caption, Readout, Slider, Choice, Toggle, Layout, Legend, useStepPlayer, PlayerControls, rng, Scales, C } from '../viz/kit';
import { sigmoid } from '../viz/math';

/* ---------- pure helpers ---------- */
// Telecom customers: satisfaction score (0–10) and monthly bill (₹ hundred, 0–10). Label 1 = churned, 0 = stayed.
interface Cust { x: number; y: number; c: number }
function customers(n: number, seed: number): Cust[] {
  const r = rng(seed);
  return Array.from({ length: n }, () => {
    const x = 0.5 + r() * 9, y = 0.5 + r() * 9;
    // churn is likelier with low satisfaction and a high bill, with a curved boundary and some noise
    const z = 1.1 * (4.8 - x) + 0.4 * (y - 5) + 2.5 * Math.sin(y * 1.2);
    return { x, y, c: r() < sigmoid(1.5 * z) ? 1 : 0 };
  });
}
const Q0 = { x: 4, y: 6 };
type Weight = 'uniform' | 'distance';
/** Distances from q to every training point (billScale > 1 mimics forgetting to scale: bill measured in ₹ instead of ₹ hundred). */
function ranked(train: Cust[], q: { x: number; y: number }, billScale = 1) {
  return train.map((p, i) => ({ i, d: Math.hypot(p.x - q.x, (p.y - q.y) * billScale) })).sort((a, b) => a.d - b.d);
}
function vote(train: Cust[], rk: { i: number; d: number }[], k: number, w: Weight = 'uniform') {
  let ch = 0, st = 0;
  rk.slice(0, k).forEach(({ i, d }) => { const wt = w === 'distance' ? 1 / Math.max(d, 1e-3) : 1; if (train[i].c) ch += wt; else st += wt; });
  return { ch, st, p: ch / Math.max(ch + st, 1e-9) };
}
function accuracy(train: Cust[], test: Cust[], k: number, w: Weight = 'uniform', billScale = 1, loo = false) {
  let ok = 0;
  test.forEach((q, j) => { let rk = ranked(train, q, billScale); if (loo) rk = rk.filter((e) => e.i !== j); const v = vote(train, rk, k, w); if ((v.p > 0.5 ? 1 : 0) === q.c) ok++; });
  return ok / test.length;
}
function boundaryGrid(train: Cust[], k: number, w: Weight = 'uniform', billScale = 1, n = 40) {
  const out: { x: number; y: number; p: number }[] = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const q = { x: ((i + 0.5) * 10) / n, y: ((j + 0.5) * 10) / n };
    out.push({ ...q, p: vote(train, ranked(train, q, billScale), k, w).p });
  }
  return out;
}
const mix = (t: number) => { const a = [0x58, 0xc4, 0xdd], b = [0xfc, 0x62, 0x55]; return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`; };
function Grid({ s, cells, n = 40 }: { s: Scales; cells: { x: number; y: number; p: number }[]; n?: number }) {
  const w = s.sx(10 / n) - s.sx(0) + 0.6, h = s.sy(0) - s.sy(10 / n) + 0.6;
  return <g opacity={0.3}>{cells.map((c, k) => <rect key={k} x={s.sx(c.x - 5 / n)} y={s.sy(c.y + 5 / n)} width={w} height={h} fill={mix(c.p)} />)}</g>;
}
const colour = (c: number) => (c ? C.red : C.blue);

function ErrorVsK({ rows, cur, height = 170 }: { rows: { k: number; tr: number; te: number }[]; cur?: number; height?: number }) {
  const kmax = rows[rows.length - 1].k;
  const line = (s: Scales, key: 'tr' | 'te') => rows.map((r, i) => `${i ? 'L' : 'M'}${s.sx(r.k)},${s.sy(1 - r[key])}`).join('');
  return (
    <Plot x={[0, kmax + 1]} y={[0, 0.5]} height={height} xLabel="k (number of neighbours) → smoother" yLabel="error rate" yTicks={5} fy={(v) => `${Math.round(v * 100)}%`}>
      {(s) => <>
        <path d={line(s, 'tr')} fill="none" stroke={C.blue} strokeWidth={2.2} />
        <path d={line(s, 'te')} fill="none" stroke={C.purple} strokeWidth={2.2} />
        {cur && <Seg s={s} x1={cur} x2={cur} y1={0} y2={0.5} color={C.gold} dash="4 4" />}
        <Label s={s} x={kmax * 0.45} y={0.45} color={C.muted} size={12}>blue = training error · purple = error on new customers</Label>
      </>}
    </Plot>
  );
}

/* ---------- Animate ---------- */
type F = { kind: 'data' | 'query' | 'dist' | 'k' | 'bound' | 'end'; k?: number };
function Animate() {
  const train = useMemo(() => customers(70, 23), []);
  const test = useMemo(() => customers(500, 77), []);
  const rk = useMemo(() => ranked(train, Q0), [train]);
  const KS = [1, 5, 15, 39];
  const grids = useMemo(() => Object.fromEntries(KS.map((k) => [k, boundaryGrid(train, k)])), [train]);
  const curve = useMemo(() => Array.from({ length: 28 }, (_, i) => 2 * i + 1).map((k) => ({ k, tr: accuracy(train, train, k), te: accuracy(train, test, k) })), [train, test]);
  const frames: F[] = [{ kind: 'data' }, { kind: 'query' }, { kind: 'dist' }, ...[1, 3, 5, 7, 9].map((k) => ({ kind: 'k' as const, k })), ...KS.map((k) => ({ kind: 'bound' as const, k })), { kind: 'end', k: 15 }];
  const p = useStepPlayer(frames.length, 1600);
  const f = frames[p.i];
  const k = f.k ?? 0;
  const v = k ? vote(train, rk, k) : null;
  const radius = k ? rk[k - 1].d : 0;
  const nb = new Set(rk.slice(0, f.kind === 'k' ? k : 0).map((e) => e.i));
  const cr = curve.find((r) => r.k === k);
  const best = curve.reduce((a, r) => (r.te > a.te ? r : a));
  const nCh = train.filter((q) => q.c).length;
  const showQ = f.kind !== 'data' && f.kind !== 'bound' && f.kind !== 'end';
  const caption = (() => {
    switch (f.kind) {
      case 'data': return <>Seventy past telecom customers, placed by <b>satisfaction score</b> and <b>monthly bill</b>. Red ones <b>churned</b> ({nCh}), blue ones stayed. Unhappy customers with big bills tend to leave, but the two groups overlap.</>;
      case 'query': return <>A new customer Q (gold) has satisfaction <b>4</b> and a bill of <b>₹600</b>. Will she churn? k-NN has <b>no training step</b>: it simply keeps all 70 past customers and looks for the most similar ones.</>;
      case 'dist': return <>Step 1: measure the straight-line distance from Q to <b>every</b> past customer (grey lines). Both features are on 0–10 scales, so neither dominates the distance. The nearest is {rk[0].d.toFixed(2)} away; the farthest {rk[rk.length - 1].d.toFixed(1)}.</>;
      case 'k': return k === 1
        ? <>k = 1: take only the single closest customer. They {train[rk[0].i].c ? <b style={{ color: C.red }}>churned</b> : <b style={{ color: C.blue }}>stayed</b>}, so that is the prediction. One neighbour is a fragile basis for a decision.</>
        : <>k = {k}: the circle grows until it holds the <b>{k} nearest</b> customers. Vote: <b style={{ color: C.red }}>{v!.ch} churned</b> vs <b style={{ color: C.blue }}>{v!.st} stayed</b> → predict <b>{v!.p > 0.5 ? 'churn' : 'stay'}</b>, with an estimated churn probability of {v!.ch}/{k} = {(v!.p * 100).toFixed(0)}%.{k === 5 && v!.p > 0.5 ? ' (The lesson’s seven-customer example also predicted churn at k = 5, by 3 votes to 2.)' : ''}</>;
      case 'bound': return k === 1
        ? <>Now colour <b>every location</b> by what k-NN would predict there. With k = 1 the boundary is jagged, with islands around single customers: <b>training error {(100 - cr!.tr * 100).toFixed(0)}%</b> (each point is its own neighbour) but error on 500 new customers <b>{(100 - cr!.te * 100).toFixed(0)}%</b>. That is overfitting.</>
        : k === 39
          ? <>k = 39: over half the data votes on every prediction. The map is very smooth, maybe too smooth: it misses the curve of the real boundary. Test error {(100 - cr!.te * 100).toFixed(0)}%. Too large a k <b>underfits</b>.</>
          : <>k = {k}: the islands melt away and the boundary <b>smooths</b>. Training error rises to {(100 - cr!.tr * 100).toFixed(0)}%, while error on new customers {cr!.te >= curve[0].te ? 'falls' : 'is'} {(100 - cr!.te * 100).toFixed(0)}%. Small k = low bias, high variance; large k = the opposite.</>;
      case 'end': return <>The lower chart shows the whole trade-off: training error is zero at k = 1 and rises with k; test error is U-shaped, lowest near <b>k = {best.k}</b> ({(100 - best.te * 100).toFixed(0)}%). Pick k by cross-validation, and <b>always scale features first</b> (try the Playground toggle to see why).</>;
    }
  })();
  return (
    <div>
      <Layout
        main={<>
          <Plot x={[0, 10]} y={[0, 10]} height={400} xLabel="satisfaction score (0–10)" yLabel="monthly bill (₹ hundred)" xTicks={10} yTicks={10}>
            {(s) => <>
              {(f.kind === 'bound' || f.kind === 'end') && <Grid s={s} cells={grids[f.kind === 'end' ? 15 : k]} />}
              {f.kind === 'dist' && train.map((q, i) => <line key={i} x1={s.sx(Q0.x)} y1={s.sy(Q0.y)} x2={s.sx(q.x)} y2={s.sy(q.y)} stroke={C.grey} strokeWidth={0.8} opacity={0.7} />)}
              {f.kind === 'k' && <circle cx={s.sx(Q0.x)} cy={s.sy(Q0.y)} r={Math.max(2, s.sx(radius) - s.sx(0))} fill={C.gold} fillOpacity={0.08} stroke={C.gold} strokeDasharray="5 4" />}
              {f.kind === 'k' && rk.slice(0, k).map(({ i }) => <line key={i} x1={s.sx(Q0.x)} y1={s.sy(Q0.y)} x2={s.sx(train[i].x)} y2={s.sy(train[i].y)} stroke={colour(train[i].c)} strokeWidth={1.5} />)}
              <Dots s={s} pts={train} color={(i) => colour(train[i].c)} r={5} animate={false} opacity={f.kind === 'k' ? 0.4 : 1} />
              {f.kind === 'k' && <Dots s={s} pts={[...nb].map((i) => train[i])} color={(j) => colour(train[[...nb][j]].c)} r={7} animate={false} />}
              {showQ && <><circle cx={s.sx(Q0.x)} cy={s.sy(Q0.y)} r={9} fill={C.gold} stroke={C.bg} strokeWidth={2} /><Label s={s} x={Q0.x + 0.25} y={Q0.y + 0.3} color={C.gold} size={14}>Q</Label></>}
              {(f.kind === 'bound' || f.kind === 'end') && <Label s={s} x={0.2} y={9.5} color={C.text} size={14}>k = {f.kind === 'end' ? 15 : k}</Label>}
            </>}
          </Plot>
          {(f.kind === 'bound' || f.kind === 'end') && <ErrorVsK rows={curve} cur={f.kind === 'end' ? best.k : k} />}
        </>}
        side={<>
          <Readout items={[
            ['k', k || '–', C.gold],
            ['neighbours who churned', f.kind === 'k' ? v!.ch : '–', C.red],
            ['neighbours who stayed', f.kind === 'k' ? v!.st : '–', C.blue],
            ['P(churn) for Q', f.kind === 'k' ? `${(v!.p * 100).toFixed(0)}%` : '–'],
            ['prediction for Q', f.kind === 'k' ? (v!.p > 0.5 ? 'churn' : 'stay') : '–', f.kind === 'k' ? (v!.p > 0.5 ? C.red : C.blue) : C.text],
            ['training error', cr && f.kind !== 'k' ? `${(100 - cr.tr * 100).toFixed(0)}%` : '–', C.blue],
            ['error on new customers', cr && f.kind !== 'k' ? `${(100 - cr.te * 100).toFixed(0)}%` : '–', C.purple],
          ]} />
          <Legend items={[['churned', C.red], ['stayed', C.blue], ['new customer Q', C.gold], ['map: predicted churn (red) / stay (blue)', C.muted]]} />
          <p className="small muted" style={{ margin: 0 }}>Odd k avoids ties in a two-class vote.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caption}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
function Playground() {
  const [k, setK] = useState(5);
  const [w, setW] = useState<Weight>('uniform');
  const [unscaled, setUnscaled] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [q, setQ] = useState(Q0);
  const [seed, setSeed] = useState(23);
  const train = useMemo(() => customers(70, seed), [seed]);
  const test = useMemo(() => customers(400, 77 + seed), [seed]);
  const bs = unscaled ? 100 : 1; // bill measured in ₹ (×100) while satisfaction stays 0–10
  const rk = ranked(train, q, bs);
  const v = vote(train, rk, k, w);
  const grid = useMemo(() => boundaryGrid(train, k, w, bs, 36), [train, k, w, bs]);
  const curve = useMemo(() => Array.from({ length: 20 }, (_, i) => 2 * i + 1).map((kk) => ({ k: kk, tr: accuracy(train, train, kk, w, bs), te: accuracy(train, test, kk, w, bs) })), [train, test, w, bs]);
  const best = curve.reduce((a, r) => (r.te > a.te ? r : a));
  const teNow = accuracy(train, test, k, w, bs);
  return (
    <Layout
      main={<>
        <Plot x={[0, 10]} y={[0, 10]} height={400} xLabel="satisfaction score (0–10) · click to move Q" yLabel={unscaled ? 'monthly bill (₹, unscaled!)' : 'monthly bill (₹ hundred)'} xTicks={10} yTicks={10} fy={unscaled ? (v) => String(v * 100) : undefined} onClick={(pt) => setQ({ x: pt.x, y: pt.y })}>
          {(s) => <>
            {showMap && <Grid s={s} cells={grid} n={36} />}
            {rk.slice(0, k).map(({ i }) => <line key={i} x1={s.sx(q.x)} y1={s.sy(q.y)} x2={s.sx(train[i].x)} y2={s.sy(train[i].y)} stroke={colour(train[i].c)} strokeWidth={1.4} />)}
            <Dots s={s} pts={train} color={(i) => colour(train[i].c)} r={5} animate={false} />
            <circle cx={s.sx(q.x)} cy={s.sy(q.y)} r={9} fill={C.gold} stroke={C.bg} strokeWidth={2} />
          </>}
        </Plot>
        <ErrorVsK rows={curve} cur={k} height={160} />
      </>}
      side={<>
        <Slider label="k neighbours" min={1} max={39} step={2} value={k} onChange={setK} />
        <Choice label="Vote" value={w} onChange={setW} options={[{ value: 'uniform', label: 'one each' }, { value: 'distance', label: 'weighted 1/d' }]} />
        <Toggle label="forget to scale (bill in ₹, not ₹ hundred)" value={unscaled} onChange={setUnscaled} />
        <Toggle label="show prediction map" value={showMap} onChange={setShowMap} />
        <button className="btn" onClick={() => setSeed(seed + 1)}>🎲 New customers</button>
        <Readout items={[
          ['Q', `satisfaction ${q.x.toFixed(1)}, bill ₹${Math.round(q.y * 100)}`, C.gold],
          ['vote churn : stay', `${v.ch.toFixed(w === 'uniform' ? 0 : 2)} : ${v.st.toFixed(w === 'uniform' ? 0 : 2)}`],
          ['P(churn)', `${(v.p * 100).toFixed(0)}%`, v.p > 0.5 ? C.red : C.blue],
          ['error on new customers', `${(100 - teNow * 100).toFixed(1)}%`, C.purple],
          ['best k (on new customers)', best.k, C.green],
        ]} />
        <p className="small muted" style={{ margin: 0 }}>Tick "forget to scale": the bill now counts 100× more in the distance, so Q's neighbours are just the customers with the nearest bill and the map turns into horizontal stripes.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'A new telecom customer **Q** finds her **k nearest** past customers, who vote on whether she will churn. Then the whole map is coloured by the k-NN prediction for several k.', steps: [
      { do: 'Step through frames 1–3.', notice: 'k-NN measures the distance from Q to every past customer: that is all the "training" there is.' },
      { do: 'Step through **k = 1, 3, 5, 7, 9**.', notice: 'The gold circle grows to hold k neighbours; the vote and the churn probability update.' },
      { do: 'Play through the **map** frames (k = 1 → 39).', notice: 'Jagged islands at k = 1 smooth into a gentle boundary; test error is lowest at a middle k.' },
    ] },
    Playground: { what: 'Click to place a customer, choose k and the voting rule, and see neighbours, the prediction map and error against k.', steps: [
      { do: 'Click near the red/blue border and drag **k** from 1 to 39.', notice: 'The prediction for Q can flip; the map goes from noisy islands to a smooth split.' },
      { do: 'Tick **forget to scale**.', notice: 'Neighbours line up horizontally (same bill), the map becomes stripes, and test error jumps: distance-based models need scaled features.' },
      { do: 'Switch the vote to **weighted 1/d** at k = 1 → 15.', notice: 'Closer neighbours count more, so large k hurts less.' },
    ] },
  },
};
export default anim;
