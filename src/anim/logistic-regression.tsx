// Logistic regression: why a straight line fails for yes/no, the sigmoid fitted by gradient descent with log-loss falling, and a movable decision threshold.
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Dots, FnLine, Seg, Label, Region, Caption, Readout, Slider, Choice, Toggle, Layout, Legend, MatrixView, useStepPlayer, PlayerControls, rng, gauss, C } from '../viz/kit';
import { lstsq, sigmoid, solve, clamp } from './_regression-helpers';

/* ---------- pure helpers ---------- */
// Loan applicants: debt-to-income ratio (DTI, %) and whether they defaulted (1) or repaid (0).
// True model, as in the lesson: z = −5.54 + 1.16 × (DTI / 10).
interface App { x: number; y: number }
function applicants(n: number, seed: number): App[] {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => { const x = 8 + ((i + r()) * 70) / n; return { x, y: r() < sigmoid(-5.54 + 0.116 * x) ? 1 : 0 }; });
}
const MU = 45, SC = 18; // standardise DTI for gradient descent, then convert back
const logloss = (d: App[], p: (x: number) => number) => d.reduce((s, q) => { const pi = clamp(p(q.x), 1e-9, 1 - 1e-9); return s - (q.y ? Math.log(pi) : Math.log(1 - pi)); }, 0) / d.length;
function gd(d: App[], lr: number, iters: number) {
  let w0 = 0, w1 = 0; const out = [{ it: 0, w0, w1 }];
  for (let it = 1; it <= iters; it++) {
    let g0 = 0, g1 = 0;
    d.forEach((q) => { const u = (q.x - MU) / SC, e = sigmoid(w0 + w1 * u) - q.y; g0 += e; g1 += e * u; });
    w0 -= (lr * g0) / d.length; w1 -= (lr * g1) / d.length;
    out.push({ it, w0, w1 });
  }
  return out;
}
const pOf = (w: { w0: number; w1: number }) => (x: number) => sigmoid(w.w0 + (w.w1 * (x - MU)) / SC);
const toRaw = (w: { w0: number; w1: number }) => ({ b1: w.w1 / SC, b0: w.w0 - (w.w1 * MU) / SC });
function confusion(d: App[], p: (x: number) => number, t: number) {
  let tp = 0, fp = 0, fn = 0, tn = 0;
  d.forEach((q) => { const yes = p(q.x) >= t; if (yes && q.y) tp++; else if (yes) fp++; else if (q.y) fn++; else tn++; });
  return { tp, fp, fn, tn };
}
const jit = (i: number) => (((i * 53) % 13) / 13 - 0.5) * 0.06;

/* ---------- Animate ---------- */
const CHECK = [0, 1, 2, 4, 7, 12, 20, 35, 60, 100, 180, 300, 500];
type F = { kind: 'data' | 'ols' | 'gd' | 'thr' | 'end'; it?: number; t?: number };
function Animate() {
  const data = useMemo(() => applicants(40, 3), []);
  const path = useMemo(() => gd(data, 1.2, 500), [data]);
  const losses = useMemo(() => path.map((w) => logloss(data, pOf(w))), [path, data]);
  const ols = useMemo(() => lstsq(data.map((q) => [1, q.x]), data.map((q) => q.y)), [data]);
  const frames: F[] = [{ kind: 'data' }, { kind: 'ols' }, ...CHECK.map((it) => ({ kind: 'gd' as const, it })), { kind: 'thr', t: 0.5 }, { kind: 'thr', t: 0.3 }, { kind: 'thr', t: 0.7 }, { kind: 'end', t: 0.3 }];
  const p = useStepPlayer(frames.length, 1500);
  const f = frames[p.i];
  const it = f.kind === 'gd' ? f.it! : f.kind === 'thr' || f.kind === 'end' ? 500 : -1;
  const w = it >= 0 ? path[it] : null;
  const pf = w ? pOf(w) : null;
  const raw = w ? toRaw(w) : null;
  const t = f.t;
  const xCut = raw && t ? (Math.log(t / (1 - t)) - raw.b0) / raw.b1 : null;
  const cm = pf && t ? confusion(data, pf, t) : null;
  const nDef = data.filter((q) => q.y).length;
  const caption = (() => {
    switch (f.kind) {
      case 'data': return <>Forty past loan applicants. Across: their <b>debt-to-income ratio</b> (DTI). Up: <b>1 = defaulted</b> (red), <b>0 = repaid</b> (blue). Defaults become more common as DTI rises, but there is no clean cut-off. We want a <b>probability of default</b> for any DTI.</>;
      case 'ols': return <>A straight line (least squares) through 0/1 data gives "probabilities" of <b>{(ols[0] + ols[1] * 5).toFixed(2)}</b> at DTI 5% and <b>{(ols[0] + ols[1] * 85).toFixed(2)}</b> at 85%: outside 0–1 (red zones). Probabilities need an <b>S-shaped</b> curve that flattens at 0 and 1.</>;
      case 'gd': {
        const L = losses[it];
        if (it === 0) return <>Logistic regression squeezes a straight-line score z = b₀ + b₁·DTI through the <b>sigmoid</b> σ(z) = 1/(1+e^−z), which always lies between 0 and 1. Start with b₀ = b₁ = 0: everyone gets p = 0.5. Average <b>log-loss</b> = ln 2 = {L.toFixed(3)}. Red bars show each applicant's miss.</>;
        if (it <= 7) return <>Gradient descent step {it}: nudge b₀, b₁ downhill on the log-loss. The curve starts to tilt: high-DTI applicants get higher p. Log-loss {L.toFixed(3)} (falling, see the chart below).</>;
        if (it <= 60) return <>Step {it}: the S-curve steepens and slides to where defaults take over. Log-loss <b>{L.toFixed(3)}</b>. Log-loss punishes confident mistakes hard: a defaulter given p = 0.01 costs −ln 0.01 = 4.6, one given p = 0.6 only 0.51.</>;
        return <>Step {it}: the curve has settled, z = {raw!.b0.toFixed(2)} + {(raw!.b1 * 10).toFixed(2)}·(DTI/10), log-loss <b>{L.toFixed(3)}</b>. Each extra 10 points of DTI multiplies the <b>odds</b> of default by e^{(raw!.b1 * 10).toFixed(2)} = <b>{Math.exp(raw!.b1 * 10).toFixed(1)}</b>.</>;
      }
      case 'thr': return t === 0.5
        ? <>The model outputs probabilities; a <b>decision</b> needs a threshold. At t = 0.5, applicants with DTI above <b>{xCut!.toFixed(0)}%</b> are declined (shaded). It catches {cm!.tp} of {nDef} defaulters and wrongly declines {cm!.fp} good customers.</>
        : t === 0.3
          ? <>Lower the threshold to <b>0.3</b>: the cut moves left to DTI {xCut!.toFixed(0)}%. Now {cm!.tp} of {nDef} defaulters are caught, at the price of {cm!.fp} false alarms. A bank that loses ₹2 lakh per default but only ₹20,000 per wrongly declined customer prefers a <b>low</b> threshold.</>
          : <>Raise it to <b>0.7</b>: cut at DTI {xCut!.toFixed(0)}%. Very few false alarms ({cm!.fp}) but only {cm!.tp} of {nDef} defaulters caught. <b>The curve does not change; only the business decision does.</b></>;
      case 'end': return <><b>Logistic regression</b>: a linear score → sigmoid → probability, fitted by minimising log-loss (here by gradient descent). The threshold is chosen from the costs of each kind of mistake, not fixed at 0.5. Try the Playground to fit it in two dimensions.</>;
    }
  })();
  return (
    <div>
      <Layout
        main={<>
          <Plot x={[0, 90]} y={[-0.35, 1.35]} height={330} xLabel="debt-to-income ratio (%)" yLabel="P(default)" yTicks={6}>
            {(s) => <>
              {f.kind === 'ols' && <><Region s={s} x0={0} x1={90} y0={1} y1={1.35} color={C.red} opacity={0.12} /><Region s={s} x0={0} x1={90} y0={-0.35} y1={0} color={C.red} opacity={0.12} /></>}
              {xCut !== null && <Region s={s} x0={clamp(xCut, 0, 90)} x1={90} y0={-0.35} y1={1.35} color={C.gold} opacity={0.1} />}
              <Seg s={s} x1={0} x2={90} y1={0} y2={0} color={C.grey} width={1} />
              <Seg s={s} x1={0} x2={90} y1={1} y2={1} color={C.grey} width={1} />
              {pf && f.kind === 'gd' && data.map((q, i) => <Seg key={i} s={s} x1={q.x} x2={q.x} y1={q.y + jit(i)} y2={pf(q.x)} color={C.red} width={1.2} dash="3 2" />)}
              <Dots s={s} pts={data.map((q, i) => ({ x: q.x, y: q.y + jit(i) }))} color={(i) => (data[i].y ? C.red : C.blue)} r={5} animate={false} />
              {f.kind === 'ols' && <Seg s={s} x1={0} x2={90} y1={ols[0]} y2={ols[0] + ols[1] * 90} color={C.purple} width={2.5} dash="7 5" />}
              {pf && <FnLine s={s} f={pf} color={C.yellow} width={3} />}
              {t !== undefined && xCut !== null && <>
                <Seg s={s} x1={0} x2={90} y1={t} y2={t} color={C.gold} dash="5 4" width={1.5} />
                <Seg s={s} x1={xCut} x2={xCut} y1={-0.35} y2={1.35} color={C.gold} width={2} />
                <Label s={s} x={2} y={t + 0.05} color={C.gold} size={12}>threshold t = {t}</Label>
                <Label s={s} x={Math.min(xCut + 1.5, 70)} y={1.25} color={C.gold} size={12}>declined →</Label>
              </>}
            </>}
          </Plot>
          {f.kind === 'gd' ? <>
            <div className="small muted">Average log-loss during training</div>
            <Plot x={[0, Math.log10(501)]} y={[0.2, 0.75]} height={150} xLabel="gradient-descent step (log scale)" yLabel="log-loss" fx={(v) => String(Math.round(10 ** v - 1))} xTicks={5} yTicks={4}>
              {(s) => <>
                <path d={losses.slice(0, it + 1).map((L, k) => `${k ? 'L' : 'M'}${s.sx(Math.log10(k + 1))},${s.sy(L)}`).join('')} fill="none" stroke={C.red} strokeWidth={2.2} />
                <Dots s={s} pts={[{ x: Math.log10(it + 1), y: losses[it] }]} color={C.red} r={5} animate={false} />
              </>}
            </Plot>
          </> : cm && <MatrixView title={`Confusion matrix at threshold ${t}`} rowLabels={['actually defaulted', 'actually repaid']} colLabels={['declined (p ≥ t)', 'approved (p < t)']} data={[[cm.tp, cm.fn], [cm.fp, cm.tn]]} cellColor={(r, c) => (r === c ? 'rgba(131,193,103,0.18)' : 'rgba(252,98,85,0.18)')} />}
        </>}
        side={<>
          <Readout items={[
            ['b₀ (intercept)', raw ? raw.b0.toFixed(2) : '–', C.yellow],
            ['b₁ per 10 pts DTI', raw ? (raw.b1 * 10).toFixed(2) : '–', C.yellow],
            ['odds ratio per 10 pts', raw ? Math.exp(raw.b1 * 10).toFixed(2) + '×' : '–'],
            ['average log-loss', it >= 0 ? losses[it].toFixed(3) : '–', C.red],
            ['GD step', f.kind === 'gd' ? it : it > 0 ? 'done (500)' : '–'],
            ['defaulters caught', cm ? `${cm.tp} / ${nDef}` : '–', C.gold],
            ['good customers declined', cm ? `${cm.fp} / ${data.length - nDef}` : '–', C.gold],
          ]} />
          <Legend items={[['defaulted (1)', C.red], ['repaid (0)', C.blue], ['P(default) curve', C.yellow], ['straight line (wrong)', C.purple], ['threshold / declined zone', C.gold]]} />
          <p className="small muted" style={{ margin: 0 }}>Lesson's fitted model on its 12 applicants: z = −5.54 + 1.16·(DTI/10). Ours, on 40 simulated applicants from that model, lands close.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caption}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
// Two features: DTI (%) and years at current job. Default risk rises with DTI and falls with job tenure.
interface P2 { x: number; y: number; c: number }
function twoD(seed: number): P2[] {
  const r = rng(seed);
  return Array.from({ length: 50 }, () => {
    const x = clamp(45 + 17 * gauss(r), 5, 85), y = clamp(8 + 5 * gauss(r), 0, 20);
    return { x, y, c: r() < sigmoid(-0.5 + 0.11 * (x - 45) - 0.3 * (y - 8)) ? 1 : 0 };
  });
}
/** Newton's method for L2-penalised logistic regression on standardised features. */
function fit2(d: P2[], lam: number) {
  const mx = 45, sx = 17, my = 8, sy = 5, n = Math.max(d.length, 1);
  let w = [0, 0, 0];
  for (let it = 0; it < 25; it++) {
    const H = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], g = [0, 0, 0];
    d.forEach((q) => { const u = [1, (q.x - mx) / sx, (q.y - my) / sy], pi = sigmoid(u[0] * w[0] + u[1] * w[1] + u[2] * w[2]); for (let j = 0; j < 3; j++) { g[j] += (pi - q.c) * u[j]; for (let k = 0; k < 3; k++) H[j][k] += pi * (1 - pi) * u[j] * u[k]; } });
    for (let j = 0; j < 3; j++) { g[j] /= n; for (let k = 0; k < 3; k++) H[j][k] /= n; if (j) { g[j] += lam * w[j]; H[j][j] += lam; } H[j][j] += 1e-6; }
    const step = solve(H, g); w = w.map((v, j) => clamp(v - step[j], -60, 60));
  }
  const p = (x: number, y: number) => sigmoid(w[0] + (w[1] * (x - mx)) / sx + (w[2] * (y - my)) / sy);
  return { p, w, raw: { b1: w[1] / sx, b2: w[2] / sy, b0: w[0] - (w[1] * mx) / sx - (w[2] * my) / sy } };
}
const mix = (t: number) => { // blue (0) → red (1), dark so points stay visible
  const a = [0x58, 0xc4, 0xdd], b = [0xfc, 0x62, 0x55];
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`;
};

function Playground() {
  const [pts, setPts] = useState<P2[]>(() => twoD(4));
  const [cls, setCls] = useState<number>(1);
  const [thr, setThr] = useState(0.5);
  const [logLam, setLogLam] = useState(-3);
  const [heat, setHeat] = useState(true);
  const lam = 10 ** logLam;
  const m = useMemo(() => fit2(pts, lam), [pts, lam]);
  const nx = 36, ny = 20;
  const cells = useMemo(() => { const out: { x: number; y: number; p: number }[] = []; for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const x = (i + 0.5) * (90 / nx), y = (j + 0.5) * (20 / ny); out.push({ x, y, p: m.p(x, y) }); } return out; }, [m]);
  let tp = 0, fp = 0, fn = 0, tn = 0, ll = 0;
  pts.forEach((q) => { const pi = m.p(q.x, q.y), yes = pi >= thr; if (yes && q.c) tp++; else if (yes) fp++; else if (q.c) fn++; else tn++; ll -= Math.log(clamp(q.c ? pi : 1 - pi, 1e-9, 1)); });
  const L = Math.log(thr / (1 - thr));
  const lineY = (x: number) => (L - m.raw.b0 - m.raw.b1 * x) / (m.raw.b2 || 1e-9);
  return (
    <Layout
      main={<>
        <Plot x={[0, 90]} y={[0, 20]} height={400} xLabel="debt-to-income ratio (%) · click to add an applicant" yLabel="years at current job" onClick={(q) => setPts([...pts, { x: q.x, y: q.y, c: cls }])}>
          {(s) => <>
            {heat && <g opacity={0.3}>{cells.map((c, k) => <rect key={k} x={s.sx(c.x - 1.25)} y={s.sy(c.y + 0.5)} width={s.sx(2.5) - s.sx(0) + 0.6} height={s.sy(0) - s.sy(1) + 0.6} fill={mix(c.p)} />)}</g>}
            {Math.abs(m.raw.b2) > 1e-6 && <Seg s={s} x1={0} x2={90} y1={lineY(0)} y2={lineY(90)} color={C.yellow} width={3} />}
            <Dots s={s} pts={pts} color={(i) => (pts[i].c ? C.red : C.blue)} r={5} animate={false} />
          </>}
        </Plot>
        <Legend items={[['defaulted', C.red], ['repaid', C.blue], [`boundary where P(default) = ${thr.toFixed(2)}`, C.yellow], ['background = predicted probability (blue low → red high)', C.muted]]} />
      </>}
      side={<>
        <Choice label="Click adds" value={cls} onChange={setCls} options={[{ value: 1, label: 'defaulter' }, { value: 0, label: 'repayer' }]} />
        <Slider label="threshold t" min={0.05} max={0.95} step={0.01} value={thr} onChange={setThr} format={(v) => v.toFixed(2)} />
        <Slider label="L2 penalty log₁₀ λ" min={-4} max={1} step={0.1} value={logLam} onChange={setLogLam} format={(v) => v.toFixed(1)} />
        <Toggle label="probability background" value={heat} onChange={setHeat} />
        <div className="row"><button className="btn" onClick={() => setPts(twoD(4))}>Reset data</button><button className="btn" onClick={() => setPts([])}>Clear</button><button className="btn" onClick={() => setPts(twoD(Math.floor(pts.length * 7 + thr * 100)))}>🎲 New data</button></div>
        <Readout items={[
          ['z =', `${m.raw.b0.toFixed(2)} + ${m.raw.b1.toFixed(3)}·DTI ${m.raw.b2 < 0 ? '−' : '+'} ${Math.abs(m.raw.b2).toFixed(3)}·years`, C.yellow],
          ['accuracy', pts.length ? `${(((tp + tn) / pts.length) * 100).toFixed(0)}%` : '–'],
          ['defaulters caught (recall)', `${tp} / ${tp + fn}`, C.gold],
          ['good customers declined', `${fp} / ${fp + tn}`, C.gold],
          ['average log-loss', pts.length ? (ll / pts.length).toFixed(3) : '–', C.red],
        ]} />
        <p className="small muted" style={{ margin: 0 }}>Make the classes perfectly separable and set λ to its minimum: the coefficients race off towards infinity and the background turns into a hard step. A small penalty keeps them finite.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Forty loan applicants by **debt-to-income ratio**. We see why a straight line fails, fit the **sigmoid** by gradient descent while the **log-loss** falls, then move the **decision threshold**.', steps: [
      { do: 'Step to frame 2 (the straight line).', notice: 'It predicts probabilities below 0 and above 1 (red zones).' },
      { do: 'Press **▶ Play** through the gradient-descent frames.', notice: 'The yellow S-curve tilts and steepens; red miss-bars shrink and the log-loss curve below falls and flattens.' },
      { do: 'Watch the **threshold** frames (0.5 → 0.3 → 0.7).', notice: 'The curve stays put; the cut-off DTI moves and the confusion matrix trades caught defaulters against false alarms.' },
    ] },
    Playground: { what: 'Two features: **DTI** and **years at current job**. The model refits instantly as you add applicants; the yellow line is where P(default) equals your threshold.', steps: [
      { do: 'Drag the **threshold** from 0.5 down to 0.2.', notice: 'The boundary shifts towards the low-risk corner: more defaulters caught, more good customers declined.' },
      { do: 'Choose **defaulter** and click several times in the low-DTI, long-tenure corner.', notice: 'The boundary tilts to accommodate them: every point pulls on a logistic fit.' },
      { do: 'Press **Clear**, add a few well-separated points of each class, and set **L2 penalty** to −4.', notice: 'The background becomes a razor-sharp step; raise λ and it softens again.' },
    ] },
  },
};
export default anim;
