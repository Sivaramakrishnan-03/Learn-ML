// Poisson regression: counts vs a log-linear curve, why OLS goes negative, fitting by IRLS, Poisson scatter and rate ratios.
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Dots, FnLine, Seg, Arrow, Label, Region, Caption, Readout, Slider, Toggle, Layout, Legend, useStepPlayer, PlayerControls, rng, Scales, C } from '../viz/kit';
import { lstsq, solve, mean, poissonDraw, poissonPmf, logFact } from './_regression-helpers';

/* ---------- pure helpers ---------- */
// Toll plaza: cars arriving in one minute, observed at random minutes between 10:00 and 20:00.
interface Obs { x: number; y: number }
const H0 = 10, H1 = 20;
function arrivals(n: number, seed: number, base: number, ratio: number): Obs[] {
  const r = rng(seed), b1 = Math.log(ratio), b0 = Math.log(base) - b1 * H0;
  return Array.from({ length: n }, () => { const x = H0 + r() * (H1 - H0); return { x, y: poissonDraw(Math.exp(b0 + b1 * x), r) }; }).sort((a, b) => a.x - b.x);
}
/** IRLS (Newton) for log(μ) = b0 + b1·(hour − 15). Returns every iterate so we can animate the fit. Centring hour keeps it stable. */
function irls(d: Obs[], iters = 8) {
  const c = 15, out: { b: number[]; ll: number }[] = [];
  let b = [Math.log(Math.max(mean(d.map((q) => q.y)), 0.05)), 0];
  const ll = (b: number[]) => d.reduce((s, q) => { const eta = b[0] + b[1] * (q.x - c); return s + q.y * eta - Math.exp(eta) - logFact(q.y); }, 0);
  out.push({ b, ll: ll(b) });
  for (let it = 0; it < iters; it++) {
    const A = [[0, 0], [0, 0]], g = [0, 0];
    d.forEach((q) => { const x = [1, q.x - c], mu = Math.exp(b[0] + b[1] * x[1]); for (let j = 0; j < 2; j++) { g[j] += (q.y - mu) * x[j]; for (let k = 0; k < 2; k++) A[j][k] += mu * x[j] * x[k]; } });
    const step = solve(A, g); b = [b[0] + step[0], b[1] + step[1]];
    out.push({ b, ll: ll(b) });
  }
  // standard error of the slope from the Fisher information at the optimum
  const A = [[0, 0], [0, 0]];
  d.forEach((q) => { const x = [1, q.x - c], mu = Math.exp(b[0] + b[1] * x[1]); for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) A[j][k] += mu * x[j] * x[k]; });
  const det = A[0][0] * A[1][1] - A[0][1] * A[1][0], se1 = Math.sqrt(Math.max(A[0][0] / det, 0));
  return { steps: out, c, se1 };
}
const curve = (b: number[], c = 15) => (h: number) => Math.exp(b[0] + b[1] * (h - c));
const jitY = (i: number) => (((i * 37) % 11) / 11 - 0.5) * 0.35;

/** Poisson probabilities drawn as horizontal bars at hour h0 (bar length ∝ probability). */
function PmfBars({ s, h0, mu, kmax, scale = 4 }: { s: Scales; h0: number; mu: number; kmax: number; scale?: number }) {
  return <>{Array.from({ length: kmax + 1 }, (_, k) => {
    const p = poissonPmf(k, mu), x0 = s.sx(h0), x1 = s.sx(h0 + p * scale);
    return <rect key={k} x={x0} y={s.sy(k + 0.38)} width={Math.max(0, x1 - x0)} height={Math.max(1, s.sy(k - 0.38) - s.sy(k + 0.38))} fill={C.gold} opacity={0.75} />;
  })}</>;
}

/* ---------- Animate ---------- */
type F = { kind: 'data' | 'ols' | 'spread' | 'log' | 'fit' | 'pmf' | 'ratio' | 'end'; it?: number; step?: number };
function Animate() {
  const data = useMemo(() => arrivals(70, 8, 0.6, 1.4), []);
  const fit = useMemo(() => irls(data), [data]);
  const ols = useMemo(() => lstsq(data.map((q) => [1, q.x]), data.map((q) => q.y)), [data]);
  const frames: F[] = [{ kind: 'data' }, { kind: 'ols' }, { kind: 'spread' }, { kind: 'log' },
    ...[0, 1, 2, 3, 4, 6].map((it) => ({ kind: 'fit' as const, it })), { kind: 'pmf' }, ...[1, 2, 3].map((step) => ({ kind: 'ratio' as const, step })), { kind: 'end' }];
  const p = useStepPlayer(frames.length, 1600);
  const f = frames[p.i];
  const it = f.kind === 'fit' ? f.it! : ['pmf', 'ratio', 'end'].includes(f.kind) ? fit.steps.length - 1 : -1;
  const b = it >= 0 ? fit.steps[it].b : null;
  const bF = fit.steps[fit.steps.length - 1].b, rr = Math.exp(bF[1]);
  const olsAt = (h: number) => ols[0] + ols[1] * h;
  const bins = Array.from({ length: 10 }, (_, k) => { const g = data.filter((q) => q.x >= H0 + k && q.x < H0 + k + 1); return { x: H0 + k + 0.5, m: mean(g.map((q) => q.y)), n: g.length, sd: Math.sqrt(mean(g.map((q) => (q.y - mean(g.map((z) => z.y))) ** 2))) }; });
  const lo = bins[1], hi = bins[8];
  const showOls = ['ols', 'spread', 'end'].includes(f.kind);
  const ladder = [14, 15, 16, 17].slice(0, (f.step ?? 0) + 1);
  const caption = (() => {
    switch (f.kind) {
      case 'data': return <>Each dot is <b>one minute</b> at a toll plaza: the number of cars that arrived. Counts are whole numbers, never negative, and they climb steeply towards the evening rush. A quiet 10 a.m. minute sees about 1 car; a 7 p.m. minute about 12.</>;
      case 'ols': return <>Ordinary least squares draws a straight line (red dashed): <b>{ols[1].toFixed(2)} extra cars per hour</b>. It predicts <b>{olsAt(10).toFixed(1)} cars</b> at 10:00, a <b>negative count</b> (red zone), and it undershoots the steep evening rise.</>;
      case 'spread': return <>A second problem: the <b>spread grows with the level</b>. Around 11:00 counts vary by about ±{lo.sd.toFixed(1)}; around 18:00 by ±{hi.sd.toFixed(1)}. OLS assumes the same spread everywhere. For counts, variance ≈ mean: that is the <b>Poisson</b> pattern.</>;
      case 'log': return <>The fix: model the <b>logarithm</b> of the expected count as a straight line, log μ = b₀ + b₁·hour. The lower chart shows log of each hour's average count (blue): they do lie on a line. Then μ = e^(b₀ + b₁·hour) is always positive and curves upward.</>;
      case 'fit': return f.it === 0
        ? <>Fitting starts from a flat guess: every minute gets the overall average, {Math.exp(fit.steps[0].b[0]).toFixed(1)} cars (b₁ = 0). Log-likelihood {fit.steps[0].ll.toFixed(1)}. The algorithm (IRLS, a Newton method) improves b₀ and b₁ step by step to make the observed counts as likely as possible.</>
        : <>Iteration {f.it}: b₁ = {b![1].toFixed(3)} per hour, log-likelihood <b>{fit.steps[f.it!].ll.toFixed(1)}</b>{f.it! >= 4 ? <> — no longer changing: <b>converged</b>. The yellow curve bends upward to follow the rush and never goes below zero.</> : <>. The line on the log scale tilts, and the curve above bends with it.</>}</>;
      case 'pmf': return <>The model also says how counts <b>scatter</b>. Gold bars are Poisson probabilities: at 11:00 (mean {curve(bF)(11).toFixed(1)}) counts bunch near 0–3; at 18:00 (mean {curve(bF)(18).toFixed(1)}) they spread over roughly {Math.max(0, Math.round(curve(bF)(18) - 2 * Math.sqrt(curve(bF)(18))))}–{Math.round(curve(bF)(18) + 2 * Math.sqrt(curve(bF)(18)))}. Wider spread at higher rates comes built in.</>;
      case 'ratio': return <>Reading the coefficient: e^b₁ = e^{bF[1].toFixed(3)} = <b>{rr.toFixed(2)}</b>. Each extra hour <b>multiplies</b> the arrival rate by {rr.toFixed(2)} (+{((rr - 1) * 100).toFixed(0)}%): {ladder.map((h) => curve(bF)(h).toFixed(1)).join(' → ')} cars per minute. Effects are rate ratios, not fixed additions.</>;
      case 'end': return <><b>Poisson regression</b> = a linear score, exponentiated to give a positive rate, with Poisson scatter around it. Compared with OLS (red dashed) it never predicts negative counts, follows the curve, and its coefficients read as <b>rate ratios</b> ({rr.toFixed(2)}× per hour), exactly what an insurer or traffic planner needs.</>;
    }
  })();
  return (
    <div>
      <Layout
        main={<>
          <Plot x={[H0, H1]} y={[-4, 24]} height={330} xLabel="time of day (hour)" yLabel="cars arriving in one minute" fx={(v) => `${v}:00`} xTicks={10}>
            {(s) => <>
              {showOls && <Region s={s} x0={H0} x1={H1} y0={-4} y1={0} color={C.red} opacity={0.12} />}
              <Seg s={s} x1={H0} x2={H1} y1={0} y2={0} color={C.grey} width={1} />
              {f.kind === 'spread' && <>
                <Region s={s} x0={lo.x - 0.5} x1={lo.x + 0.5} y0={lo.m - 2 * lo.sd} y1={lo.m + 2 * lo.sd} color={C.gold} opacity={0.18} stroke={C.gold} />
                <Region s={s} x0={hi.x - 0.5} x1={hi.x + 0.5} y0={hi.m - 2 * hi.sd} y1={hi.m + 2 * hi.sd} color={C.gold} opacity={0.18} stroke={C.gold} />
              </>}
              {f.kind === 'pmf' && <><PmfBars s={s} h0={11} mu={curve(bF)(11)} kmax={6} scale={2.5} /><PmfBars s={s} h0={18} mu={curve(bF)(18)} kmax={23} scale={6} /></>}
              <Dots s={s} pts={data.map((q, i) => ({ x: q.x, y: q.y + jitY(i) }))} r={4} animate={false} opacity={f.kind === 'pmf' ? 0.45 : 1} />
              {showOls && <Seg s={s} x1={H0} x2={H1} y1={olsAt(H0)} y2={olsAt(H1)} color={C.red} dash="7 5" width={2.5} />}
              {showOls && <Label s={s} x={10.15} y={olsAt(10) - 1.4} color={C.red} size={12}>OLS predicts {olsAt(10).toFixed(1)} cars</Label>}
              {b && <FnLine s={s} f={curve(b)} color={C.yellow} width={3} />}
              {f.kind === 'ratio' && ladder.map((h, i) => <g key={h}>
                <Seg s={s} x1={h} x2={h} y1={0} y2={curve(bF)(h)} color={C.gold} width={2} />
                {i > 0 && <Arrow s={s} x1={h - 1} y1={curve(bF)(h - 1)} x2={h} y2={curve(bF)(h)} color={C.gold} width={2} />}
                {i > 0 && <Label s={s} x={h - 0.5} y={curve(bF)(h) + 1.4} color={C.gold} size={12} anchor="middle">×{rr.toFixed(2)}</Label>}
              </g>)}
            </>}
          </Plot>
          {['log', 'fit', 'pmf', 'ratio', 'end'].includes(f.kind) && <>
            <div className="small muted">Same model on the log scale: log(expected cars) is a straight line in hour</div>
            <Plot x={[H0, H1]} y={[-1.5, 3.5]} height={170} xLabel="time of day (hour)" yLabel="log(cars per minute)" fx={(v) => `${v}:00`} xTicks={10} yTicks={4}>
              {(s) => <>
                <Dots s={s} pts={bins.filter((q) => q.m > 0).map((q) => ({ x: q.x, y: Math.log(q.m) }))} r={5} animate={false} />
                {b && <Seg s={s} x1={H0} x2={H1} y1={b[0] + b[1] * (H0 - 15)} y2={b[0] + b[1] * (H1 - 15)} color={C.yellow} width={2.5} />}
              </>}
            </Plot>
          </>}
        </>}
        side={<>
          <Readout items={[
            ['b₁ (per hour, log scale)', b ? b[1].toFixed(3) : '–', C.yellow],
            ['rate ratio e^b₁', b ? Math.exp(b[1]).toFixed(2) + '×' : '–', C.yellow],
            ['log-likelihood', it >= 0 ? fit.steps[it].ll.toFixed(1) : '–'],
            ['IRLS iteration', f.kind === 'fit' ? f.it! : it >= 0 ? 'converged' : '–'],
            ['OLS prediction at 10:00', olsAt(10).toFixed(1) + ' cars', C.red],
            ['Poisson prediction at 10:00', curve(bF)(10).toFixed(2) + ' cars', C.green],
          ]} />
          <Legend items={[['observed minutes', C.blue], ['Poisson fit', C.yellow], ['OLS line', C.red], ['spread / probabilities', C.gold]]} />
          <p className="small muted" style={{ margin: 0 }}>True rate used to simulate: 0.6 cars/min at 10:00, ×1.40 every hour.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caption}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
function Playground() {
  const [base, setBase] = useState(0.6);
  const [growth, setGrowth] = useState(40);
  const [n, setN] = useState(70);
  const [showOls, setShowOls] = useState(true);
  const [hour, setHour] = useState(18);
  const [seed, setSeed] = useState(8);
  const ratio = 1 + growth / 100;
  const data = useMemo(() => arrivals(n, seed, base, ratio), [n, seed, base, ratio]);
  const fit = useMemo(() => irls(data), [data]);
  const b = fit.steps[fit.steps.length - 1].b;
  const ols = lstsq(data.map((q) => [1, q.x]), data.map((q) => q.y));
  const yMax = Math.max(8, ...data.map((q) => q.y)) * 1.1;
  const mu = curve(b)(hour);
  const pOver = 1 - Array.from({ length: 6 }, (_, k) => poissonPmf(k, mu)).reduce((s, v) => s + v, 0);
  const negHours = Array.from({ length: 101 }, (_, k) => H0 + k / 10).filter((h) => ols[0] + ols[1] * h < 0).length / 10;
  const lo = Math.exp(b[1] - 1.96 * fit.se1), hi = Math.exp(b[1] + 1.96 * fit.se1);
  return (
    <Layout
      main={<>
        <Plot x={[H0, H1]} y={[-Math.max(3, yMax * 0.15), yMax]} height={380} xLabel="time of day (hour) · click to choose an hour" yLabel="cars arriving in one minute" fx={(v) => `${v}:00`} xTicks={10} onClick={(q) => setHour(Math.round(q.x * 4) / 4)}>
          {(s) => <>
            {showOls && <Region s={s} x0={H0} x1={H1} y0={-yMax} y1={0} color={C.red} opacity={0.1} />}
            <Seg s={s} x1={H0} x2={H1} y1={0} y2={0} color={C.grey} width={1} />
            <PmfBars s={s} h0={hour} mu={mu} kmax={Math.ceil(mu + 4 * Math.sqrt(mu) + 2)} scale={Math.min(6, 2.2 / Math.max(0.05, poissonPmf(Math.floor(mu), mu)))} />
            <Seg s={s} x1={hour} x2={hour} y1={-yMax} y2={yMax} color={C.gold} dash="3 4" width={1} />
            <Dots s={s} pts={data.map((q, i) => ({ x: q.x, y: q.y + jitY(i) }))} r={3.5} animate={false} opacity={0.85} />
            {showOls && <Seg s={s} x1={H0} x2={H1} y1={ols[0] + ols[1] * H0} y2={ols[0] + ols[1] * H1} color={C.red} dash="7 5" width={2.5} />}
            <FnLine s={s} f={curve(b)} color={C.yellow} width={3} />
            <FnLine s={s} f={(h) => base * ratio ** (h - H0)} color={C.green} dash="4 4" width={1.5} />
          </>}
        </Plot>
        <Legend items={[['observed minutes', C.blue], ['Poisson fit', C.yellow], ['true rate', C.green], ['OLS line', C.red], ['Poisson probabilities at chosen hour', C.gold]]} />
      </>}
      side={<>
        <Slider label="rate at 10:00 (cars/min)" min={0.1} max={3} step={0.1} value={base} onChange={setBase} format={(v) => v.toFixed(1)} />
        <Slider label="growth per hour" min={0} max={50} value={growth} onChange={setGrowth} format={(v) => `+${v}%`} />
        <Slider label="minutes observed" min={15} max={400} value={n} onChange={setN} />
        <Toggle label="show OLS straight line" value={showOls} onChange={setShowOls} />
        <button className="btn" onClick={() => setSeed(seed + 1)}>🎲 New sample</button>
        <Readout items={[
          ['fitted rate ratio e^b₁', Math.exp(b[1]).toFixed(3) + '×', C.yellow],
          ['95% interval', `${lo.toFixed(2)} – ${hi.toFixed(2)}`],
          ['true rate ratio', ratio.toFixed(2) + '×', C.green],
          [`expected at ${Math.floor(hour)}:${String(Math.round((hour % 1) * 60)).padStart(2, '0')}`, mu.toFixed(2) + ' cars', C.gold],
          ['P(more than 5 cars) = one lane overloaded', (pOver * 100).toFixed(1) + '%', pOver > 0.2 ? C.red : C.text],
          ['hours where OLS predicts < 0', negHours.toFixed(1) + ' h', negHours > 0 ? C.red : C.text],
        ]} />
        <p className="small muted" style={{ margin: 0 }}>Click the chart to move the gold probability bars. Crank the growth up and the base down: OLS dives below zero while the Poisson curve hugs the floor.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Cars arriving per minute at a toll plaza across the day. We see why a straight line fails for **counts**, fit a **log-linear** Poisson model step by step, and read its coefficient as a **rate ratio**.', steps: [
      { do: 'Step through the first three frames.', notice: 'The OLS line predicts negative cars in the morning, and the spread of counts grows as the level rises.' },
      { do: 'Play through the **IRLS iterations**.', notice: 'On the log chart the yellow line tilts into place; above, the curve bends upward and stops changing after about 4 steps.' },
      { do: 'Watch the **gold bars** and the **×1.40 ladder**.', notice: 'Higher rates mean wider scatter, and every hour multiplies the rate by the same factor.' },
    ] },
    Playground: { what: 'Set the true morning rate and hourly growth, then compare the Poisson fit with OLS. Click any hour to see the Poisson probabilities of each count there.', steps: [
      { do: 'Set **growth per hour** to +50% and **rate at 10:00** to 0.2.', notice: 'The red OLS line spends hours below zero; the yellow curve never does.' },
      { do: 'Click around **18:00** and read **P(more than 5 cars)**.', notice: 'That is the chance one lane is overloaded in a minute: the staffing question the model answers.' },
      { do: 'Drop **minutes observed** to 15, then raise it to 400.', notice: 'The 95% interval for the rate ratio narrows around the true value.' },
    ] },
  },
};
export default anim;
