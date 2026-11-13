// Train/test split: shuffle rows, cut into two sets, fit on train only, judge on test. Variants: stratified and time-based.
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Dots, FnLine, Seg, Label, Caption, Readout, Slider, Choice, Layout, Legend, useStepPlayer, PlayerControls, C } from '../viz/kit';
import { sampleCurve, permutation, sd } from '../viz/math';
import { Pt, polyFit, rmse, clipped } from './_workflow-helpers';

/* ---------- pure helpers ---------- */
const TRAIN = C.blue, TEST = C.purple;
const sales = (m: number) => 20 + 0.4 * m + 4 * Math.sin((2 * Math.PI * m) / 12);
const fmt1 = (v: number) => (v > 99 ? Math.round(v).toString() : v.toFixed(1));

/** Error bars drawn as a tiny chart; values above `cap` are drawn to the top with an arrow label. */
function ErrBars({ items, cap }: { items: { label: string; v: number; col: string }[]; cap: number }) {
  return (
    <Plot x={[0, items.length]} y={[-cap * 0.16, cap]} height={180} width={380} yLabel="RMSE (₹ lakh)" xTicks={0} fx={() => ''} fy={(v) => (v < 0 ? '' : String(v))} yTicks={4} grid={false}>
      {(s) => <>{items.map((it, i) => {
        const v = Math.min(it.v, cap);
        return <g key={it.label}>
          <rect x={s.sx(i + 0.18)} width={s.sx(i + 0.82) - s.sx(i + 0.18)} y={s.sy(v)} height={Math.max(0, s.sy(0) - s.sy(v))} fill={it.col} rx={3} />
          <Label s={s} x={i + 0.5} y={Math.min(v, cap * 0.86) + cap * 0.05} anchor="middle" size={13} color={C.text}>{fmt1(it.v)}{it.v > cap ? ' ↑' : ''}</Label>
          <Label s={s} x={i + 0.5} y={-cap * 0.11} anchor="middle" size={12} color={C.muted}>{it.label}</Label>
        </g>;
      })}</>}
    </Plot>
  );
}

/** A strip of rows (one dot per row) in their current order; `slot[i]` = position of row i. */
function RowStrip({ n, slot, color, ring, label }: { n: number; slot: number[]; color: (i: number) => string; ring?: (i: number) => boolean; label: string }) {
  return (
    <Plot x={[0, n + 1]} y={[0, 1]} height={86} xLabel={label} xTicks={0} fx={() => ''} fy={() => ''} grid={false}>
      {(s) => <>
        {ring && <Dots s={s} pts={slot.map((p) => ({ x: p + 1, y: 0.45 }))} r={9} color={(i) => (ring(i) ? C.gold : 'transparent')} />}
        <Dots s={s} pts={slot.map((p) => ({ x: p + 1, y: 0.45 }))} r={6} color={color} />
      </>}
    </Plot>
  );
}

/* ---------- Animate ---------- */
const N = 30, NTEST = 6, DEG = 9;
type Fr = { order: 'orig' | 'shuf'; split: boolean; hide?: boolean; fit?: boolean; trRes?: boolean; teRes?: boolean; bars?: number; time?: boolean };

function Animate() {
  const pts = useMemo(() => sampleCurve(sales, N, 0.5, 30.5, 1.5, 1, true), []);
  const perm = useMemo(() => permutation(N, 11), []);
  const isTestR = useMemo(() => { const t = Array(N).fill(false); perm.slice(N - NTEST).forEach((i) => (t[i] = true)); return t; }, [perm]);
  const slotR = useMemo(() => { const s = Array(N).fill(0); perm.forEach((row, pos) => (s[row] = pos)); return s; }, [perm]);
  const fitR = useMemo(() => polyFit(pts.filter((_, i) => !isTestR[i]), DEG, 0, 31), [pts, isTestR]);
  const fitT = useMemo(() => polyFit(pts.slice(0, N - NTEST), DEG, 0, 31), [pts]);
  const trR = rmse(pts.filter((_, i) => !isTestR[i]), fitR), teR = rmse(pts.filter((_, i) => isTestR[i]), fitR);
  const trT = rmse(pts.slice(0, N - NTEST), fitT), teT = rmse(pts.slice(N - NTEST), fitT);

  const frames: Fr[] = [
    { order: 'orig', split: false },
    { order: 'shuf', split: false },
    { order: 'shuf', split: true },
    { order: 'shuf', split: true, hide: true },
    { order: 'shuf', split: true, hide: true, fit: true },
    { order: 'shuf', split: true, hide: true, fit: true, trRes: true, bars: 1 },
    { order: 'shuf', split: true, fit: true, trRes: true, bars: 1 },
    { order: 'shuf', split: true, fit: true, trRes: true, teRes: true, bars: 2 },
    { order: 'shuf', split: true, fit: true, teRes: true, bars: 2 },
    { order: 'orig', split: false, time: true, bars: 2 },
    { order: 'orig', split: true, time: true, bars: 2 },
    { order: 'orig', split: true, time: true, fit: true, trRes: true, bars: 3 },
    { order: 'orig', split: true, time: true, fit: true, trRes: true, teRes: true, bars: 4 },
    { order: 'orig', split: true, time: true, fit: true, teRes: true, bars: 4 },
  ];
  const p = useStepPlayer(frames.length, 1700);
  const f = frames[p.i];
  const isTest = (i: number) => (f.time ? i >= N - NTEST : isTestR[i]);
  const slot = f.order === 'orig' ? pts.map((_, i) => i) : slotR;
  const fit = f.time ? fitT : fitR;
  const rowCol = (i: number) => (f.split ? (isTest(i) ? TEST : TRAIN) : C.blue);
  const visible = pts.map((q, i) => (f.hide && isTest(i) ? { x: q.x, y: -100 } : q));

  const caps: React.ReactNode[] = [
    <>Here are <b>30 months of sales</b> for a two-wheeler dealer (₹ lakh). The strip on top lists the rows in the order they sit in the file: month 1, 2, 3, … The question we care about: <b>will a model work on months it has never seen?</b></>,
    <>Step 1: <b>shuffle</b> the rows. Watch the dots in the strip jump to random positions. The chart below does not change; only the order of the rows does. Shuffling makes sure the cut that follows is not biased by how the file was sorted.</>,
    <>Step 2: <b>cut</b> the shuffled list: the first 24 rows (80%) become the <b style={{ color: TRAIN }}>training set</b>, the last 6 (20%) the <b style={{ color: TEST }}>test set</b>. Because of the shuffle, test months are scattered across the whole period.</>,
    <>Step 3: <b>lock the test set away</b>. The 6 purple months vanish: from now until the very end, the model and the analyst must not look at them, not even for scaling or choosing settings.</>,
    <>Step 4: fit a very flexible model (a degree-{DEG} polynomial) on the <b>24 training months only</b>. The yellow curve bends to pass close to almost every blue dot.</>,
    <>Score it on its own training data: the red lines are the misses. <b>Training RMSE = {trR.toFixed(1)}</b> lakh. Looks excellent… but this number rewards memory, not understanding.</>,
    <>Step 5: <b>unlock the test set</b>. The 6 purple months come back. The model never saw them while it was learning.</>,
    <>Score on the test months: <b>test RMSE = {teR.toFixed(1)}</b> lakh, about {(teR / trR).toFixed(0)}× worse than on training data. The curve wiggles between the points it memorised and misses the new ones.</>,
    <><b>The gap between {trR.toFixed(1)} and {teR.toFixed(1)} is the whole point of the split.</b> Only the test number is an honest preview of next month. Had we scored on training data, we would have promised a forecast accuracy we cannot deliver.</>,
    <>Variant: <b>time-based split</b>. For forecasting we must never shuffle: in real life you only know the past. Put the rows back in calendar order.</>,
    <>Cut by time: train on <b>months 1–24</b>, test on the <b>last 6 months</b>. This copies the day you actually use the model: every test month lies in the future.</>,
    <>Fit the same degree-{DEG} model on months 1–24. Training RMSE = <b>{trT.toFixed(1)}</b>: again the model looks great on what it has seen.</>,
    <>Now forecast months 25–30. The curve shoots off the chart: <b>test RMSE ≈ {fmt1(teT)}</b>. The random split hid this, because its test months sat <i>between</i> training months, so the model only had to interpolate.</>,
    <><b>Lesson:</b> shuffle-and-split for ordinary data, split by time for anything that will be used to predict the future. The time-based error is worse, and <b>that worse number is the true one</b>.</>,
  ];
  const bars = [
    { label: 'train', v: trR, col: TRAIN }, { label: 'test', v: teR, col: TEST },
    { label: 'train(t)', v: trT, col: TRAIN }, { label: 'test(t)', v: teT, col: TEST },
  ].slice(0, f.bars ?? 0);
  return (
    <div>
      <Layout
        main={<>
          <RowStrip n={N} slot={slot} color={rowCol} label={f.order === 'orig' ? 'rows in file order (month 1 → 30)' : 'rows after shuffling'} />
          <Plot x={[0, 31]} y={[10, 42]} height={320} xLabel="month" yLabel="sales (₹ lakh)">
            {(s) => <>
              {f.time && f.split && <Seg s={s} x1={N - NTEST + 0.5} x2={N - NTEST + 0.5} y1={10} y2={42} color={C.muted} dash="5 4" />}
              {f.time && f.split && <Label s={s} x={N - NTEST + 1} y={40} color={TEST} size={12}>future →</Label>}
              {f.fit && <FnLine s={s} f={clipped(fit, 10, 42)} color={C.yellow} />}
              {f.fit && pts.map((q, i) => {
                const show = isTest(i) ? f.teRes : f.trRes;
                return show ? <Seg key={i} s={s} x1={q.x} x2={q.x} y1={q.y} y2={Math.max(9, Math.min(43, fit(q.x)))} color={C.red} width={2} /> : null;
              })}
              <Dots s={s} pts={visible} color={rowCol} r={5.5} />
            </>}
          </Plot>
        </>}
        side={<>
          <Readout items={[
            ['training rows', f.split ? N - NTEST : '–', TRAIN],
            ['test rows', f.split ? NTEST : '–', TEST],
            ['train RMSE', f.trRes || f.teRes ? (f.time ? trT : trR).toFixed(2) : '–', TRAIN],
            ['test RMSE', f.teRes ? fmt1(f.time ? teT : teR) : '–', TEST],
          ]} />
          <Legend items={[['training rows', TRAIN], ['test rows', TEST], ['model', C.yellow], ['miss (residual)', C.red]]} />
          {bars.length > 0 && <ErrBars items={bars} cap={20} />}
          <p className="small muted" style={{ margin: 0 }}>(t) = time-based split. RMSE is the typical miss in ₹ lakh; lower is better.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caps[p.i]}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
type Method = 'random' | 'stratified' | 'time';
const NM = 40;
const festive = (m: number) => { const k = ((Math.round(m) - 1) % 12) + 1; return k === 10 || k === 11; }; // Oct–Nov (Navratri / Diwali)
const sales2 = (m: number) => sales(m) + (festive(m) ? 6 : 0);

function Playground() {
  const [method, setMethod] = useState<Method>('random');
  const [testPct, setTestPct] = useState(25);
  const [deg, setDeg] = useState(4);
  const [seed, setSeed] = useState(1);
  const pts = useMemo(() => sampleCurve(sales2, NM, 0.5, NM + 0.5, 1.5, 5, true).map((q, i) => ({ ...q, x: i + 1 })), []);
  const isF = pts.map((q) => festive(q.x));
  const nF = isF.filter(Boolean).length;
  const nTest = Math.max(2, Math.round((NM * testPct) / 100));
  const { order, isTest } = useMemo(() => {
    let order: number[];
    if (method === 'time') order = pts.map((_, i) => i);
    else if (method === 'random') order = permutation(NM, 100 + seed);
    else {
      const pf = permutation(NM, 300 + seed).filter((i) => isF[i]), pn = permutation(NM, 500 + seed).filter((i) => !isF[i]);
      const kF = Math.round((nF * nTest) / NM);
      order = [...pf.slice(kF), ...pn.slice(nTest - kF), ...pf.slice(0, kF), ...pn.slice(0, nTest - kF)];
    }
    const isTest = Array(NM).fill(false); order.slice(NM - nTest).forEach((i) => (isTest[i] = true));
    return { order, isTest };
  }, [method, seed, nTest, pts]); // eslint-disable-line react-hooks/exhaustive-deps
  const slot = Array(NM).fill(0); order.forEach((row, pos) => (slot[row] = pos));
  const train: Pt[] = pts.filter((_, i) => !isTest[i]), test: Pt[] = pts.filter((_, i) => isTest[i]);
  const fit = useMemo(() => polyFit(train, deg, 0, NM + 1), [train, deg]); // eslint-disable-line react-hooks/exhaustive-deps
  const trE = rmse(train, fit), teE = rmse(test, fit);
  const fInTest = isTest.filter((t, i) => t && isF[i]).length;
  // how much the festive count in the test set swings across 200 random splits (for the readout)
  const swing = useMemo(() => {
    const ks = Array.from({ length: 200 }, (_, s) => permutation(NM, 9000 + s).slice(NM - nTest).filter((i) => isF[i]).length);
    return sd(ks);
  }, [nTest]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Layout
      main={<>
        <RowStrip n={NM} slot={slot} color={(i) => (isTest[i] ? TEST : TRAIN)} ring={(i) => isF[i]} label={method === 'time' ? 'rows in calendar order; test = the last months' : 'rows after shuffling; test = the right-hand block'} />
        <Plot x={[0, NM + 1]} y={[10, 52]} height={330} xLabel="month" yLabel="sales (₹ lakh)">
          {(s) => <>
            {pts.map((q, i) => isF[i] ? <circle key={'f' + i} cx={s.sx(q.x)} cy={s.sy(q.y)} r={9} fill="none" stroke={C.gold} strokeWidth={1.5} /> : null)}
            <FnLine s={s} f={clipped(fit, 10, 52)} color={C.yellow} />
            {pts.map((q, i) => <Seg key={i} s={s} x1={q.x} x2={q.x} y1={q.y} y2={Math.max(9, Math.min(53, fit(q.x)))} color={C.red} width={isTest[i] ? 2 : 1} />)}
            <Dots s={s} pts={pts} color={(i) => (isTest[i] ? TEST : TRAIN)} r={5} />
          </>}
        </Plot>
      </>}
      side={<>
        <Choice label="Split" value={method} onChange={setMethod} options={[{ value: 'random', label: 'Random' }, { value: 'stratified', label: 'Stratified' }, { value: 'time', label: 'By time' }]} />
        <Slider label="test size" min={10} max={50} step={5} value={testPct} onChange={setTestPct} format={(v) => `${v}% (${Math.max(2, Math.round((NM * v) / 100))} rows)`} />
        <Slider label="model flexibility (degree)" min={1} max={12} value={deg} onChange={setDeg} />
        <button className="btn" onClick={() => setSeed(seed + 1)} disabled={method === 'time'}>🔀 Reshuffle</button>
        <Readout items={[
          ['train RMSE', trE.toFixed(2), TRAIN],
          ['test RMSE', fmt1(teE), TEST],
          ['festive months in test', `${fInTest} of ${nTest}`, C.gold],
          ['expected (15%)', ((nF * nTest) / NM).toFixed(1), C.green],
        ]} />
        <Legend items={[['train', TRAIN], ['test', TEST], ['festive month (Oct–Nov)', C.gold], ['model', C.yellow]]} />
        <p className="small muted" style={{ margin: 0 }}>
          {method === 'random' && <>Random splits put a varying number of festive months in the test set (typical swing ± {swing.toFixed(1)}). Reshuffle a few times and watch it and the test RMSE jump.</>}
          {method === 'stratified' && <>Stratified: the test set always gets its fair share of festive months, so the test score no longer depends on luck.</>}
          {method === 'time' && <>By time: the model must forecast the last months. High degrees explode beyond the training range; the random split hid that weakness.</>}
        </p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Thirty months of dealer sales are **shuffled**, **cut** 80/20 into training and test rows, and a flexible model is judged on both. Then the same data is split **by time**.', steps: [
      { do: 'Press **▶ Step** through the first three frames.', notice: 'In the top strip the rows jump to new positions (shuffle), then the last 6 turn purple: that is the test set.' },
      { do: 'Keep stepping until the purple months come back.', notice: 'The red misses on purple dots are much longer than on blue ones: training RMSE is tiny, test RMSE is several times bigger.' },
      { do: 'Continue to the time-based split at the end.', notice: 'Forecasting the last 6 months, the same model shoots off the chart. The honest error for a forecaster is far worse than the random split suggested.' },
    ] },
    Playground: { what: 'Forty months of sales with **festive months** (gold rings, sales spike). Choose how to split, how big the test set is and how flexible the model is.', steps: [
      { do: 'With **Random**, click **🔀 Reshuffle** five times.', notice: 'The number of festive months in the test set and the test RMSE change every time: a single random split is partly luck.' },
      { do: 'Switch to **Stratified** and reshuffle again.', notice: 'The festive count in the test set stays at its fair share every time.' },
      { do: 'Choose **By time**, then drag **flexibility** from 1 to 12.', notice: 'Training RMSE keeps falling while test RMSE explodes: flexible curves cannot forecast beyond the data they saw.' },
    ] },
  },
};
export default anim;
