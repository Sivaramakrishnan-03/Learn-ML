// Bias–variance trade-off: polynomial fits of growing flexibility, the falling training error and the U-shaped test error,
// then many refits on fresh samples to show bias (systematic miss) and variance (spread) directly.
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Dots, FnLine, Seg, Label, Caption, Readout, Slider, Toggle, Layout, Legend, useStepPlayer, PlayerControls, C } from '../viz/kit';
import { mean, sampleCurve } from '../viz/math';
import { Pt, polyFit, mse, clipped } from './_workflow-helpers';

/* ---------- pure helpers ---------- */
const LO = 10, HI = 100;
// Fuel efficiency of a delivery van vs average speed: best around 55 km/h, with a gentle wobble (gear changes).
const truth = (x: number) => 8 + 10 * Math.exp(-(((x - 55) / 25) ** 2)) + 1.5 * Math.sin(x / 7);
const GRID = Array.from({ length: 46 }, (_, i) => LO + i * 2);
const YR: [number, number] = [2, 24];

function study(n: number, noise: number, maxDeg: number, reps: number, seed: number) {
  const test = sampleCurve(truth, 400, LO, HI, noise, seed + 77);
  const samples = Array.from({ length: reps }, (_, r) => sampleCurve(truth, n, LO, HI, noise, seed + 1000 + r, true));
  return Array.from({ length: maxDeg }, (_, k) => {
    const d = k + 1;
    const fits = samples.map((s) => polyFit(s, d, LO, HI));
    const preds = fits.map((g) => GRID.map(g));
    const avg = GRID.map((_, j) => mean(preds.map((p) => p[j])));
    const bias2 = mean(GRID.map((x, j) => (avg[j] - truth(x)) ** 2));
    const vari = mean(GRID.map((_, j) => mean(preds.map((p) => (p[j] - avg[j]) ** 2))));
    return { d, train: mean(fits.map((g, i) => mse(samples[i], g))), test: mean(fits.map((g) => mse(test, g))), bias2, vari, noise: noise * noise };
  });
}

/** Simplest degree whose test error is within 5% of the minimum (the usual "prefer the simpler model" rule). */
const sweetSpot = <T extends { d: number; test: number }>(rows: T[]) => { const m = Math.min(...rows.map((q) => q.test)); return rows.find((q) => q.test <= m * 1.05)!; };

/** Error-vs-flexibility chart (ISLR style). Values above yMax are clipped to the top edge. */
function ErrChart({ rows, upto, yMax, mark, decomp, showTT = true, height = 230 }: {
  rows: { d: number; train: number; test: number; bias2: number; vari: number; noise: number }[]; upto: number; yMax: number; mark?: number; decomp?: boolean; showTT?: boolean; height?: number;
}) {
  const r = rows.filter((q) => q.d <= upto);
  const cl = (v: number) => Math.min(v, yMax * 1.02);
  const path = (s: any, get: (q: typeof r[0]) => number) => r.map((q, i) => `${i ? 'L' : 'M'}${s.sx(q.d)},${s.sy(cl(get(q)))}`).join('');
  const maxD = rows.length;
  return (
    <Plot x={[0.5, maxD + 0.5]} y={[0, yMax]} height={height} xLabel="flexibility (polynomial degree)" yLabel="mean squared error" xTicks={maxD}>
      {(s) => <>
        <Seg s={s} x1={0.5} x2={maxD + 0.5} y1={rows[0].noise} y2={rows[0].noise} color={C.grey} dash="4 4" />
        {mark !== undefined && <Seg s={s} x1={mark} x2={mark} y1={0} y2={yMax} color={C.gold} dash="3 3" />}
        {showTT && r.length > 0 && <>
          <path d={path(s, (q) => q.train)} fill="none" stroke={C.blue} strokeWidth={2.5} />
          <path d={path(s, (q) => q.test)} fill="none" stroke={C.red} strokeWidth={2.5} />
          <Dots s={s} pts={r.map((q) => ({ x: q.d, y: cl(q.train) }))} color={C.blue} r={4} animate={false} />
          <Dots s={s} pts={r.map((q) => ({ x: q.d, y: cl(q.test) }))} color={C.red} r={4} animate={false} />
        </>}
        {decomp && <>
          <path d={path(s, (q) => q.bias2)} fill="none" stroke={C.purple} strokeWidth={2.5} />
          <path d={path(s, (q) => q.vari)} fill="none" stroke={C.teal} strokeWidth={2.5} />
          <path d={path(s, (q) => q.bias2 + q.vari + q.noise)} fill="none" stroke={C.red} strokeWidth={2} strokeDasharray="6 3" />
        </>}
      </>}
    </Plot>
  );
}

/* ---------- Animate ---------- */
const N = 25, NOISE = 1.2, MAXD = 14;
type Fr = { deg?: number; upto: number; bundle?: number; mark?: boolean; decomp?: boolean };

function Animate() {
  const pts = useMemo(() => sampleCurve(truth, N, LO, HI, NOISE, 3, true), []);
  const test = useMemo(() => sampleCurve(truth, 400, LO, HI, NOISE, 999), []);
  // errors of THIS sample (what a learner would actually measure) for the top curves
  const rows1 = useMemo(() => Array.from({ length: MAXD }, (_, k) => { const g = polyFit(pts, k + 1, LO, HI); return { d: k + 1, train: mse(pts, g), test: mse(test, g), bias2: 0, vari: 0, noise: NOISE * NOISE }; }), [pts, test]);
  const theory = useMemo(() => study(N, NOISE, MAXD, 60, 5), []);
  const bundles = useMemo(() => {
    const out: Record<number, ((x: number) => number)[]> = {};
    [1, 6, 14].forEach((d) => (out[d] = Array.from({ length: 10 }, (_, r) => polyFit(sampleCurve(truth, N, LO, HI, NOISE, 4000 + r, true), d, LO, HI))));
    return out;
  }, []);
  const DEGS = [1, 2, 4, 6, 9, 12, 14];
  const frames: Fr[] = [
    { upto: 0 },
    ...DEGS.map((d) => ({ deg: d, upto: d })),
    { deg: 6, upto: MAXD, mark: true },
    { bundle: 1, upto: MAXD, mark: true },
    { bundle: 14, upto: MAXD, mark: true },
    { bundle: 6, upto: MAXD, mark: true },
    { bundle: 6, upto: MAXD, mark: true, decomp: true },
    { deg: 6, upto: MAXD, mark: true, decomp: true },
  ];
  const p = useStepPlayer(frames.length, 1800);
  const f = frames[p.i];
  const best = sweetSpot(rows1);
  const row = f.deg ? rows1[f.deg - 1] : undefined;
  const th = (d: number) => theory[d - 1];
  const fit = useMemo(() => (f.deg ? polyFit(pts, f.deg, LO, HI) : undefined), [f.deg, pts]);
  const bundleAvg = f.bundle ? (x: number) => mean(bundles[f.bundle!].map((g) => g(x))) : undefined;

  const degCap = (d: number, r: typeof rows1[0]) => {
    if (d === 1) return <>Degree 1: a <b>straight line</b>. It cannot bend to follow the hump, so it misses in the same way everywhere. Training MSE {r.train.toFixed(1)}, test MSE {r.test.toFixed(1)}: <b>both high and close together. That is high bias (underfitting).</b></>;
    if (d === 2) return <>Degree 2: a parabola captures the hump. Training error drops to {r.train.toFixed(1)}, and test error falls with it ({r.test.toFixed(1)}). More flexibility is helping.</>;
    if (d === 4) return <>Degree 4: the curve starts to follow the wobble. Train {r.train.toFixed(2)}, test {r.test.toFixed(2)}. Both errors are still falling.</>;
    if (d === 6) return <>Degree 6: the yellow curve sits almost on the green truth. Test MSE {r.test.toFixed(2)} is close to the noise floor σ² = {(NOISE * NOISE).toFixed(2)}, the error no model can beat.</>;
    if (d === 9) return <>Degree 9: training error keeps falling ({r.train.toFixed(2)}), but test error has stopped improving ({r.test.toFixed(2)}). The extra flexibility is now spent on <b>noise</b>, not on the truth.</>;
    if (d === 12) return <>Degree 12: the curve bends towards individual points. Training error is lower again, test error is creeping up ({r.test.toFixed(2)}).</>;
    return <>Degree 14: wild swings near the edges. Training MSE is the lowest yet ({r.train.toFixed(2)}), test MSE jumps to <b>{r.test.toFixed(1)}</b>. <b>Low training error, high test error: overfitting (high variance).</b></>;
  };
  const caps: React.ReactNode[] = [
    <>Twenty-five trips of a delivery van: average speed vs fuel efficiency. The <b style={{ color: C.green }}>green dashed curve is the truth</b> (best around 55 km/h); the blue dots are what we actually observe, truth plus random noise. We will fit polynomials of growing flexibility and track two errors below.</>,
    ...DEGS.map((d) => degCap(d, rows1[d - 1])),
    <>All 14 degrees. <b style={{ color: C.blue }}>Training error only goes down.</b> <b style={{ color: C.red }}>Test error falls, bottoms out near degree {best.d}, then rises</b>: the famous U. (Degrees {best.d}–9 are within a whisker of each other; prefer the simplest.) Choose flexibility where test (or cross-validated) error is lowest, never where training error is lowest.</>,
    <>Why the U? Imagine collecting 10 fresh samples and refitting each time. <b>Degree 1</b>: the 10 lines (faint) barely differ, but their average (white) is far from the truth. Consistently wrong = <b style={{ color: C.purple }}>bias² ≈ {th(1).bias2.toFixed(1)}</b>.</>,
    <><b>Degree 14</b> on the same 10 samples: the curves disagree wildly, especially at the edges. On average they are near the truth, but any single fit is unreliable. That spread is <b style={{ color: C.teal }}>variance ≈ {th(14).vari.toFixed(1)}</b>.</>,
    <><b>Degree 6</b>: the curves are tightly bundled <i>and</i> centred on the truth. Bias² ≈ {th(6).bias2.toFixed(2)}, variance ≈ {th(6).vari.toFixed(2)}. This is the sweet spot: a little of each, small total.</>,
    <>Averaged over 60 samples: <b style={{ color: C.purple }}>bias²</b> falls with flexibility, <b style={{ color: C.teal }}>variance</b> rises, and their sum plus noise (dashed red) traces the same U as the test error. <b>Expected test error = bias² + variance + σ².</b></>,
    <><b>Takeaway:</b> more flexibility trades bias for variance. Training error cannot see variance, so it always rewards complexity. Only held-out error reveals the bottom of the U, here at degree ≈ {best.d}.</>,
  ];
  const yMax = 16;
  return (
    <div>
      <Layout
        main={<>
          <Plot x={[LO - 2, HI + 2]} y={YR} height={290} xLabel="average speed (km/h)" yLabel="fuel efficiency (km/l)">
            {(s) => <>
              <FnLine s={s} f={truth} color={C.green} dash="7 5" width={2.5} />
              {f.bundle && bundles[f.bundle].map((g, i) => <FnLine key={i} s={s} f={clipped(g, YR[0], YR[1])} color={C.yellow} width={1.2} n={120} />)}
              {bundleAvg && <FnLine s={s} f={clipped(bundleAvg, YR[0], YR[1])} color={C.text} width={3} />}
              {!f.bundle && <Dots s={s} pts={pts} r={5} />}
              {fit && !f.bundle && <FnLine s={s} f={clipped(fit, YR[0], YR[1])} color={C.yellow} width={3} />}
              {fit && !f.bundle && pts.map((q, i) => <Seg key={i} s={s} x1={q.x} x2={q.x} y1={q.y} y2={Math.max(YR[0] - 1, Math.min(YR[1] + 1, fit(q.x)))} color={C.red} width={1.2} />)}
              {f.bundle && <Label s={s} x={LO} y={YR[1] - 1.5} color={C.yellow}>degree {f.bundle}: 10 refits on fresh samples</Label>}
              {f.deg && !f.bundle && <Label s={s} x={LO} y={YR[1] - 1.5} color={C.yellow}>degree {f.deg} fit</Label>}
            </>}
          </Plot>
          <ErrChart rows={f.decomp ? theory : rows1} upto={f.upto} yMax={yMax} mark={f.mark ? best.d : f.deg} decomp={f.decomp} showTT={!f.decomp} />
        </>}
        side={<>
          <Readout items={[
            ['degree', f.deg ?? f.bundle ?? '–', C.yellow],
            ['train MSE', row ? row.train.toFixed(2) : '–', C.blue],
            ['test MSE', row ? row.test.toFixed(2) : '–', C.red],
            ['noise σ²', (NOISE * NOISE).toFixed(2), C.grey],
            ['bias²', f.bundle ? th(f.bundle).bias2.toFixed(2) : '–', C.purple],
            ['variance', f.bundle ? th(f.bundle).vari.toFixed(2) : '–', C.teal],
          ]} />
          <Legend items={[['truth', C.green], ['data', C.blue], ['model fit', C.yellow], ['training error', C.blue], ['test error', C.red], ['bias²', C.purple], ['variance', C.teal], ['noise floor σ² (dashed)', C.grey]]} />
          <p className="small muted" style={{ margin: 0 }}>Bias² and variance come from refitting the same degree on 60 fresh samples of 25 trips and comparing the fits with the truth.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caps[p.i]}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
function Playground() {
  const [deg, setDeg] = useState(3);
  const [n, setN] = useState(25);
  const [noise, setNoise] = useState(1.2);
  const [seed, setSeed] = useState(1);
  const [refits, setRefits] = useState(true);
  const rows = useMemo(() => study(n, noise, 15, 12, 50 + seed), [n, noise, seed]);
  const pts: Pt[] = useMemo(() => sampleCurve(truth, n, LO, HI, noise, 20 + seed, true), [n, noise, seed]);
  const fit = useMemo(() => polyFit(pts, deg, LO, HI), [pts, deg]);
  const others = useMemo(() => (refits ? Array.from({ length: 12 }, (_, r) => polyFit(sampleCurve(truth, n, LO, HI, noise, 50 + seed + 1000 + r, true), deg, LO, HI)) : []), [refits, n, noise, seed, deg]);
  const r = rows[deg - 1];
  const best = sweetSpot(rows);
  const yMax = Math.max(6, Math.min(30, best.test * 4, rows[0].test * 1.25));
  return (
    <Layout
      main={<>
        <Plot x={[LO - 2, HI + 2]} y={YR} height={290} xLabel="average speed (km/h)" yLabel="fuel efficiency (km/l)">
          {(s) => <>
            <FnLine s={s} f={truth} color={C.green} dash="7 5" width={2.5} />
            {others.map((g, i) => <FnLine key={i} s={s} f={clipped(g, YR[0], YR[1])} color={C.yellow} width={1} n={100} />)}
            <Dots s={s} pts={pts} r={n > 80 ? 3 : 4.5} animate={false} />
            <FnLine s={s} f={clipped(fit, YR[0], YR[1])} color={C.yellow} width={3.5} />
          </>}
        </Plot>
        <ErrChart rows={rows} upto={15} yMax={yMax} mark={deg} decomp height={240} />
      </>}
      side={<>
        <Slider label="flexibility (degree)" min={1} max={15} value={deg} onChange={setDeg} />
        <Slider label="training trips n" min={12} max={200} value={n} onChange={setN} />
        <Slider label="noise SD" min={0.3} max={3} step={0.1} value={noise} onChange={setNoise} format={(v) => v.toFixed(1)} />
        <Toggle label="show 12 refits on fresh samples" value={refits} onChange={setRefits} />
        <button className="btn" onClick={() => setSeed(seed + 1)}>🎲 New samples</button>
        <Readout items={[
          ['train MSE', r.train.toFixed(2), C.blue], ['test MSE', r.test.toFixed(2), C.red],
          ['bias²', r.bias2.toFixed(2), C.purple], ['variance', r.vari.toFixed(2), C.teal],
          ['best degree', best.d, C.gold], ['noise σ²', r.noise.toFixed(2), C.grey],
        ]} />
        <p className="small muted" style={{ margin: 0 }}>Lower chart: training (blue) and test (red) error averaged over 12 samples, with bias² (purple), variance (teal) and their sum + σ² (dashed). Grey dashed = noise floor σ². Gold line = your degree.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Polynomials of growing flexibility are fitted to 25 noisy trips. The lower chart tracks **training error** (blue) and **test error** (red); then 10 refits on fresh samples show **bias** and **variance** directly.', steps: [
      { do: 'Step through degrees 1 → 14.', notice: 'Blue (training) error falls every time. Red (test) error falls, bottoms out around degree 6, then climbs: the U-shape.' },
      { do: 'Keep stepping to the three "10 refits" frames.', notice: 'Degree 1: tight bundle, wrong place (bias). Degree 14: right on average but scattered everywhere (variance). Degree 6: tight and right.' },
      { do: 'Watch the final chart.', notice: 'Bias² (purple) falls, variance (teal) rises, and their sum plus noise reproduces the U.' },
    ] },
    Playground: { what: 'Pick a flexibility, a training-set size and a noise level, and see the fit, 12 refits on fresh samples, and the full error curves.', steps: [
      { do: 'Drag **flexibility** to 15 with n = 25.', notice: 'The faint refits splay out at the edges and test error shoots up while training error keeps falling.' },
      { do: 'Keep degree 15 and drag **training trips n** to 200.', notice: 'The refits collapse together: more data shrinks variance, and the best degree moves to the right.' },
      { do: 'Set n back to 25 and raise **noise SD** to 3.', notice: 'The noise floor rises and the best degree moves left: noisy data favours simpler models.' },
    ] },
  },
};
export default anim;
