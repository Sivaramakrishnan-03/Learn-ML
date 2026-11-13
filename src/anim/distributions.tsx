// Probability distributions built from simulation: binomial (deals from 20 leads), Poisson (calls per minute),
// exponential (gaps between cars), uniform (waiting for a bus) and Student's t (small-sample ratios). Examples from g-stats1.
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Bars, Dots, FnLine, Seg, Label, Region, Caption, Readout, Slider, Choice, Layout, Legend, useStepPlayer, PlayerControls, rng, gauss, C } from '../viz/kit';
import { mean, sdS, histogram, normPdf, tPdf, tCdf, binomPmf, poissonPmf, chi2Pdf, chi2Sf } from '../viz/math';
import { pct } from './_stats1-helpers';

/* ---------- pure helpers: one simulated "trial" per distribution, with the detail needed to draw it ---------- */
type Kind = 'binom' | 'pois' | 'expo' | 'unif' | 't' | 'chi2';
interface Trial { value: number; marks: number[]; extra?: number[] }

const expDraw = (r: () => number, beta: number) => -beta * Math.log(1 - r());
function trial(kind: Kind, a: number, b: number, seed: number): Trial {
  const r = rng(seed);
  switch (kind) {
    case 'binom': { const o: number[] = Array.from({ length: a }, () => (r() < b ? 1 : 0)); return { value: o.reduce((s, v) => s + v, 0), marks: o }; }
    case 'pois': { const t: number[] = []; let x = expDraw(r, 1 / a); while (x < 1 && t.length < 200) { t.push(x); x += expDraw(r, 1 / a); } return { value: t.length, marks: t }; }
    case 'expo': { const t: number[] = []; let x = 0; while (t.length < 40) { x += expDraw(r, a); t.push(x); } return { value: t[0], marks: t }; }
    case 'unif': { const arrive = r() * a; return { value: a - arrive, marks: [arrive] }; } // bus every a minutes; wait until the next bus
    case 'chi2': { const zs = Array.from({ length: a }, () => gauss(r)); return { value: zs.reduce((s, z) => s + z * z, 0), marks: zs }; }
    case 't': { const n = a + 1, xs = Array.from({ length: n }, () => gauss(r)); const m = mean(xs), se = sdS(xs) / Math.sqrt(n); return { value: m / se, marks: xs, extra: [m, se] }; }
  }
}
const simulate = (kind: Kind, a: number, b: number, k: number, base: number) => Array.from({ length: k }, (_, i) => trial(kind, a, b, base + i * 7919).value);

function exact(kind: Kind, a: number, b: number) {
  switch (kind) {
    case 'binom': return { m: a * b, sd: Math.sqrt(a * b * (1 - b)), pmf: (k: number) => binomPmf(k, a, b) };
    case 'pois': return { m: a, sd: Math.sqrt(a), pmf: (k: number) => poissonPmf(k, a) };
    case 'expo': return { m: a, sd: a, pdf: (x: number) => (x >= 0 ? Math.exp(-x / a) / a : 0) };
    case 'unif': return { m: a / 2, sd: a / Math.sqrt(12), pdf: (x: number) => (x >= 0 && x <= a ? 1 / a : 0) };
    case 't': return { m: 0, sd: a > 2 ? Math.sqrt(a / (a - 2)) : NaN, pdf: (x: number) => tPdf(x, a) };
    case 'chi2': return { m: a, sd: Math.sqrt(2 * a), pdf: (x: number) => (x > 0 ? chi2Pdf(x, a) : 0) };
  }
}
const discrete = (kind: Kind) => kind === 'binom' || kind === 'pois';
/** Chi-square upper tail by Simpson integration of the density (accurate to ~1e-5 for UI use). */
function counts(values: number[], max: number) {
  const c = Array(max + 1).fill(0); values.forEach((v) => { if (v <= max) c[v]++; });
  return c.map((k, x) => ({ x, y: k / Math.max(values.length, 1) }));
}

/* ---------- the "process" strip: what one trial looks like ---------- */
function Process({ kind, a, t }: { kind: Kind; a: number; t: Trial }) {
  const H = 130;
  if (kind === 'binom') return (
    <Plot x={[0, a + 1]} y={[0, 1]} height={H} xLabel={`lead number (1 to ${a})`} fy={() => ''} yTicks={0} xTicks={Math.min(a, 20)} grid={false}>
      {(s) => <>
        <Dots s={s} pts={t.marks.map((_, i) => ({ x: i + 1, y: 0.45 }))} r={Math.min(11, 300 / a)} color={(i) => (t.marks[i] ? C.green : C.grey)} animate={false} />
        <Label s={s} x={(a + 1) / 2} y={0.85} anchor="middle" color={C.gold}>{t.value} deal{t.value === 1 ? '' : 's'} this week</Label>
      </>}
    </Plot>
  );
  if (kind === 'pois') return (
    <Plot x={[0, 60]} y={[0, 1]} height={H} xLabel="seconds within one minute" fy={() => ''} yTicks={0}>
      {(s) => <>
        <Seg s={s} x1={0} x2={60} y1={0.4} y2={0.4} color={C.muted} />
        {t.marks.map((m, i) => <Seg key={i} s={s} x1={m * 60} x2={m * 60} y1={0.25} y2={0.6} color={C.blue} width={3} />)}
        <Label s={s} x={30} y={0.82} anchor="middle" color={C.gold}>{t.value} call{t.value === 1 ? '' : 's'} arrived in this minute</Label>
      </>}
    </Plot>
  );
  if (kind === 'expo') {
    const ts = [0, ...t.marks.filter((m) => m < 20)];
    return (
      <Plot x={[0, 20]} y={[0, 1]} height={H} xLabel="minutes (cars arriving at a fuel station)" fy={() => ''} yTicks={0}>
        {(s) => <>
          {ts.slice(1).map((m, i) => <g key={i}>
            <Seg s={s} x1={ts[i]} x2={m} y1={0.4} y2={0.4} color={i % 2 ? C.gold : C.teal} width={5} />
            {m - ts[i] > 0.9 && <Label s={s} x={(ts[i] + m) / 2} y={0.55} anchor="middle" size={11} color={C.muted}>{(m - ts[i]).toFixed(1)}</Label>}
          </g>)}
          {ts.slice(1).map((m, i) => <Seg key={'c' + i} s={s} x1={m} x2={m} y1={0.28} y2={0.52} color={C.blue} width={3} />)}
          <Label s={s} x={10} y={0.85} anchor="middle" color={C.gold}>each coloured stretch is one gap between cars</Label>
        </>}
      </Plot>
    );
  }
  if (kind === 'unif') return (
    <Plot x={[0, a]} y={[0, 1]} height={H} xLabel={`minutes since the last bus (a bus every ${a} minutes)`} fy={() => ''} yTicks={0}>
      {(s) => <>
        <Seg s={s} x1={0} x2={a} y1={0.4} y2={0.4} color={C.muted} />
        <Seg s={s} x1={0.05} x2={0.05} y1={0.2} y2={0.65} color={C.green} width={4} />
        <Seg s={s} x1={a - 0.05} x2={a - 0.05} y1={0.2} y2={0.65} color={C.green} width={4} />
        <Seg s={s} x1={t.marks[0]} x2={a} y1={0.4} y2={0.4} color={C.red} width={4} />
        <Dots s={s} pts={[{ x: t.marks[0], y: 0.4 }]} r={7} animate={false} />
        <Label s={s} x={a / 2} y={0.85} anchor="middle" color={C.gold}>you arrive at {t.marks[0].toFixed(1)} min and wait {t.value.toFixed(1)} min (red)</Label>
      </>}
    </Plot>
  );
  if (kind === 'chi2') return (
    <Plot x={[-3.5, 3.5]} y={[0, 1]} height={H} xLabel={`${a} independent standard-normal values z`} fy={() => ''} yTicks={0}>
      {(s) => <>
        <Seg s={s} x1={0} x2={0} y1={0.1} y2={0.7} color={C.green} dash="4 3" />
        {t.marks.map((z, i) => <Seg key={i} s={s} x1={0} x2={z} y1={0.3 + i * 0.1} y2={0.3 + i * 0.1} color={C.red} width={3} />)}
        <Dots s={s} pts={t.marks.map((z, i) => ({ x: z, y: 0.3 + i * 0.1 }))} r={6} animate={false} />
        <Label s={s} x={0} y={0.85} anchor="middle" color={C.gold}>χ² = {t.marks.map((z) => `(${z.toFixed(2)})²`).join(' + ')} = {t.value.toFixed(2)}</Label>
      </>}
    </Plot>
  );
  const [m, se] = t.extra!;
  return (
    <Plot x={[-3, 3]} y={[0, 1]} height={H} xLabel="5 measurements of a quantity whose true mean is 0 (true SD 1)" fy={() => ''} yTicks={0}>
      {(s) => <>
        <Region s={s} x0={m - se} x1={m + se} y0={0.2} y1={0.6} color={C.red} opacity={0.2} />
        <Dots s={s} pts={t.marks.map((x) => ({ x, y: 0.4 }))} r={6} animate={false} />
        <Seg s={s} x1={0} x2={0} y1={0.1} y2={0.7} color={C.green} dash="4 3" />
        <Seg s={s} x1={m} x2={m} y1={0.15} y2={0.65} color={C.yellow} width={3} />
        <Label s={s} x={0} y={0.85} anchor="middle" color={C.gold}>t = (mean − 0) / (s/√5) = {m.toFixed(2)} / {se.toFixed(2)} = {t.value.toFixed(2)}</Label>
      </>}
    </Plot>
  );
}

/* ---------- histogram + exact curve ---------- */
function domain(kind: Kind, a: number, b: number): { x: [number, number]; bins: number } {
  switch (kind) {
    case 'binom': { const m = a * b, sd = Math.sqrt(a * b * (1 - b)); return { x: [Math.max(0, Math.floor(m - 4.5 * sd - 2)) - 0.5, Math.min(a, Math.ceil(m + 4.5 * sd + 2)) + 0.5], bins: 0 }; }
    case 'pois': return { x: [Math.max(0, Math.floor(a - 4.5 * Math.sqrt(a) - 2)) - 0.5, Math.ceil(a + 4.5 * Math.sqrt(a) + 2) + 0.5], bins: 0 };
    case 'expo': return { x: [0, 7 * a], bins: 35 };
    case 'unif': return { x: [0, 42], bins: 42 };
    case 't': return { x: [-6, 6], bins: 40 };
    case 'chi2': return { x: [0, Math.ceil(a + 5 * Math.sqrt(2 * a) + 3)], bins: 40 };
  }
}
function Dist({ kind, a, b, values, hl, showExact, threshold, height = 260 }: { kind: Kind; a: number; b: number; values: number[]; hl?: number; showExact: boolean; threshold?: number; height?: number }) {
  const d = domain(kind, a, b), ex = exact(kind, a, b);
  const disc = discrete(kind);
  const data = disc ? counts(values, Math.floor(d.x[1])) : histogram(values, d.x[0], d.x[1], d.bins, { density: true, closed: false });
  const curveMax = disc ? Math.max(...data.map((_, k) => ex.pmf!(k))) : kind === 'unif' ? 1 / a : kind === 'expo' ? 1 / a : kind === 'chi2' ? Math.min(0.6, ex.pdf!(Math.max(a - 2, 0.15))) : tPdf(0, a);
  const yMax = Math.max(curveMax, ...data.map((p) => p.y)) * 1.18 || 1;
  const binW = disc ? 1 : (d.x[1] - d.x[0]) / d.bins;
  const label = { binom: 'number of successes', pois: 'calls in one minute', expo: 'gap between cars (minutes)', unif: 'waiting time (minutes)', t: 't statistic', chi2: 'sum of squared z-values' }[kind];
  return (
    <Plot x={d.x} y={[0, yMax]} height={height} xLabel={label} yLabel={disc ? 'share of trials' : 'density'} fy={(v) => (disc ? v.toFixed(2) : '')} xTicks={disc ? Math.min(20, d.x[1] - d.x[0]) : 8}>
      {(s) => <>
        {threshold !== undefined && <Region s={s} x0={threshold + (disc ? 0.5 : 0)} x1={kind === 'unif' ? Math.max(a, threshold) : d.x[1]} color={C.red} opacity={0.12} />}
        <Bars s={s} data={data} width={binW * 0.85} color={(i) => (threshold !== undefined && data[i].x > threshold ? C.red : C.blue)} highlight={hl !== undefined ? (i) => (disc ? data[i].x === hl : Math.abs(data[i].x - hl) <= binW / 2) : undefined} />
        {showExact && disc && <Dots s={s} pts={data.map((p) => ({ x: p.x, y: ex.pmf!(p.x) }))} r={5} color={C.yellow} animate={false} />}
        {showExact && !disc && <FnLine s={s} f={ex.pdf!} color={C.yellow} width={3} n={kind === 'unif' ? 800 : 200} />}
        {showExact && kind === 't' && <FnLine s={s} f={(x) => normPdf(x)} color={C.red} width={2} dash="6 4" />}
      </>}
    </Plot>
  );
}

/* ---------- Animate ---------- */
interface Frame { kind: Kind; a: number; b: number; k: number; exact: boolean; thr?: number; cap: (v: number[], t: Trial) => JSX.Element }
const tail = (v: number[], c: number) => v.filter((x) => x > c).length / Math.max(v.length, 1);
const FRAMES: Frame[] = [
  { kind: 'binom', a: 20, b: 0.1, k: 1, exact: false, cap: (_, t) => <><b>Binomial: count the yeses.</b> A salesperson has 20 leads, each closing with probability 10%. Green dots are deals. This week: <b>{t.value} deal{t.value === 1 ? '' : 's'}</b>, which becomes the first block below.</> },
  { kind: 'binom', a: 20, b: 0.1, k: 2, exact: false, cap: (_, t) => <>Week 2: same 20 leads, same 10% chance, but luck differs: <b>{t.value} deals</b>.</> },
  { kind: 'binom', a: 20, b: 0.1, k: 3, exact: false, cap: (_, t) => <>Week 3: <b>{t.value} deals</b>. Each week is one draw from the same random process.</> },
  { kind: 'binom', a: 20, b: 0.1, k: 100, exact: false, cap: (v) => <><b>100 simulated weeks.</b> Most weeks bring 1 to 3 deals, but {v.filter((x) => x === 0).length} weeks brought none at all.</> },
  { kind: 'binom', a: 20, b: 0.1, k: 2000, exact: true, cap: (v) => <><b>2,000 weeks</b>, and the yellow dots are the binomial formula. P(0 deals) = <b>0.122</b>, P(2) = <b>0.285</b>, P(4 or more) = <b>0.133</b> (simulated: {pct(tail(v, 3))}). An average performer has a zero week about one week in eight, purely by chance.</> },
  { kind: 'binom', a: 20, b: 0.5, k: 2000, exact: true, cap: () => <>Change one parameter: p = <b>0.5</b> (like tossing 20 coins). The shape becomes <b>symmetric</b> around n × p = 10. With small p it was lopsided. Mean = np, SD = √(np(1−p)) = {Math.sqrt(5).toFixed(2)}.</> },
  { kind: 'pois', a: 3, b: 0, k: 1, exact: false, cap: (_, t) => <><b>Poisson: arrivals in a window.</b> Calls reach a bank's call centre at random, on average <b>3 per minute</b>. In this minute, <b>{t.value}</b> arrived (blue ticks). No fixed number of tries, just a rate.</> },
  { kind: 'pois', a: 3, b: 0, k: 2000, exact: true, thr: 6, cap: (v) => <>Over 2,000 minutes, counts follow the <b>Poisson</b> formula with λ = 3 (yellow). A team that handles 6 calls is swamped when more arrive: P(more than 6) = <b>3.4%</b> (simulated {pct(tail(v, 6))}), about <b>2 minutes every hour</b>. Planning for the average guarantees trouble.</> },
  { kind: 'expo', a: 2, b: 0, k: 1, exact: false, cap: () => <><b>Exponential: waiting between random arrivals.</b> Cars reach a fuel station at random, one every <b>2 minutes</b> on average. The coloured stretches are the gaps: many short, a few long.</> },
  { kind: 'expo', a: 2, b: 0, k: 2000, exact: true, thr: 3, cap: (v) => <>2,000 gaps. The curve <b>(1/2)·e^(−x/2)</b> is highest at zero: short gaps are most common. P(gap over 3 min) = e^(−1.5) = <b>22.3%</b> (simulated {pct(tail(v, 3))}). Median gap 1.39 min, below the mean of 2: right skew.</> },
  { kind: 'unif', a: 20, b: 0, k: 1, exact: false, cap: (_, t) => <><b>Uniform: no favourites.</b> A bus comes every 20 minutes and you turn up at a random moment. Today you wait <b>{t.value.toFixed(1)} minutes</b>.</> },
  { kind: 'unif', a: 20, b: 0, k: 2000, exact: true, thr: 15, cap: (v) => <>2,000 trips: every wait from 0 to 20 minutes is <b>equally likely</b>, so the histogram is flat at height 1/20. P(wait over 15) = 5/20 = <b>0.25</b> (simulated {pct(tail(v, 15))}). Average wait: 10 minutes.</> },
  { kind: 't', a: 4, b: 0, k: 1, exact: false, cap: (_, t) => <><b>Student's t: signal ÷ estimated noise.</b> Take just 5 measurements, compute their mean (yellow) and divide by its estimated standard error s/√5 (red band). This sample gives t = <b>{t.value.toFixed(2)}</b>.</> },
  { kind: 't', a: 4, b: 0, k: 2000, exact: true, cap: (v) => <>2,000 such ratios follow the <b>t-distribution with 4 degrees of freedom</b> (yellow), not the normal (red dashed). Its tails are <b>fatter</b> because s itself is noisy: {pct(v.filter((x) => Math.abs(x) > 1.96).length / v.length)} of ratios land beyond ±1.96 (theory 12.2%), not 5%.</> },
  { kind: 'chi2', a: 3, b: 0, k: 1, exact: false, cap: (_, t) => <><b>Chi-square: add up squared surprises.</b> Draw 3 independent standard-normal values (red sticks = distance from 0), square them and add: <b>{t.value.toFixed(2)}</b>. This is the engine behind chi-square tests of counts and variances.</> },
  { kind: 'chi2', a: 3, b: 0, k: 2000, exact: true, thr: 7.81, cap: (v) => <>2,000 such sums form the <b>chi-square distribution with 3 df</b>: never negative, skewed right, mean = df = 3. Only <b>5%</b> exceed 7.81 (simulated {pct(tail(v, 7.81))}), the cut-off a chi-square test with 3 df uses.</> },
  { kind: 't', a: 4, b: 0, k: 2000, exact: true, thr: 2.776, cap: () => <><b>Which story fits?</b> Fixed tries, count yeses → <b>binomial</b>. Events per window → <b>Poisson</b>. Time between events → <b>exponential</b>. Any value equally likely → <b>uniform</b>. Mean ÷ estimated SE from a small sample → <b>t</b> (5% cut-off ±2.776 for 4 df, not ±1.96). Sum of squared z's → <b>chi-square</b>.</> },
];
const SEED: Record<Kind, number> = { binom: 101, pois: 202, expo: 303, unif: 404, t: 505, chi2: 606 };

function Animate() {
  const sims = useMemo(() => {
    const out: Record<string, number[]> = {};
    FRAMES.forEach((f) => { const key = `${f.kind}${f.a}${f.b}`; if (!out[key]) out[key] = simulate(f.kind, f.a, f.b, 2000, SEED[f.kind] + f.b * 1000); });
    return out;
  }, []);
  const p = useStepPlayer(FRAMES.length, 2600);
  const f = FRAMES[p.i];
  const all = sims[`${f.kind}${f.a}${f.b}`];
  const v = all.slice(0, f.k);
  const t = trial(f.kind, f.a, f.b, SEED[f.kind] + f.b * 1000 + (f.k - 1) * 7919);
  const ex = exact(f.kind, f.a, f.b);
  const names: Record<Kind, string> = { binom: `Binomial(n = ${f.a}, p = ${f.b})`, pois: `Poisson(λ = ${f.a})`, expo: `Exponential(mean ${f.a})`, unif: `Uniform(0, ${f.a})`, t: `t with ${f.a} df`, chi2: `Chi-square(${f.a} df)` };
  const thrT = f.kind === 't' ? undefined : f.thr;
  return (
    <div>
      <Layout
        main={<>
          <div className="small muted">One trial of the process ({f.k === 1 ? 'the first' : `trial #${f.k}`})</div>
          <Process kind={f.kind} a={f.a} t={t} />
          <div className="small muted" style={{ marginTop: 6 }}>All {f.k} trial{f.k === 1 ? '' : 's'} so far · {names[f.kind]}</div>
          <Dist kind={f.kind} a={f.a} b={f.b} values={v} hl={f.k <= 3 ? t.value : undefined} showExact={f.exact} threshold={thrT} />
          {f.kind === 't' && f.thr && <div className="small muted">t(4) 5% two-sided cut-offs: ±2.776 · normal: ±1.96 · P(|t| &gt; 1.96) = {pct(2 * (1 - tCdf(1.96, 4)))}</div>}
        </>}
        side={<>
          <Readout items={[
            ['distribution', names[f.kind].split('(')[0]],
            ['trials', f.k],
            ['this trial', f.kind === 'binom' || f.kind === 'pois' ? t.value : t.value.toFixed(2), C.gold],
            ['theory mean', ex.m.toFixed(2), C.yellow],
            ['simulated mean', mean(v).toFixed(2), C.blue],
            ['theory SD', isFinite(ex.sd) ? ex.sd.toFixed(2) : '∞'],
            ['simulated SD', v.length > 1 ? sdS(v).toFixed(2) : '–', C.blue],
          ]} />
          <Legend items={[['simulated trials', C.blue], ['this trial', C.gold], ['exact formula', C.yellow], ['tail of interest', C.red], ...(f.kind === 't' ? [['normal curve', C.red] as [string, string]] : [])]} />
          <p className="small muted" style={{ margin: 0 }}>Each distribution is just the long-run histogram of a simple random story.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{f.cap(v, t)}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
const P_SPEC: Record<Kind, { label: string; a: [string, number, number, number, number]; b?: [string, number, number, number, number]; thr: number }> = {
  binom: { label: 'Binomial', a: ['trials n', 1, 60, 1, 20], b: ['success chance p', 0.01, 0.99, 0.01, 0.1], thr: 3 },
  pois: { label: 'Poisson', a: ['rate λ per window', 0.5, 20, 0.5, 3], thr: 6 },
  expo: { label: 'Exponential', a: ['mean gap β', 0.5, 10, 0.5, 2], thr: 3 },
  unif: { label: 'Uniform', a: ['max value b', 2, 40, 1, 20], thr: 15 },
  t: { label: 't', a: ['degrees of freedom', 1, 30, 1, 4], thr: 1.96 },
  chi2: { label: 'Chi-square', a: ['degrees of freedom', 1, 30, 1, 3], thr: 7.81 },
};

function Playground() {
  const [kind, setKind] = useState<Kind>('binom');
  const [a, setA] = useState(20);
  const [b, setB] = useState(0.1);
  const [k, setK] = useState(2000);
  const [thr, setThr] = useState(3);
  const [seed, setSeed] = useState(1);
  const spec = P_SPEC[kind];
  const values = useMemo(() => simulate(kind, a, b, k, seed * 100003), [kind, a, b, k, seed]);
  const ex = exact(kind, a, b);
  const d = domain(kind, a, b);
  const thrMax = kind === 't' ? 5 : Math.floor(d.x[1]);
  const exTail = discrete(kind) ? 1 - Array.from({ length: Math.floor(thr) + 1 }, (_, i) => ex.pmf!(i)).reduce((s, v) => s + v, 0)
    : kind === 'expo' ? Math.exp(-thr / a) : kind === 'unif' ? Math.max(0, Math.min(1, (a - thr) / a)) : kind === 'chi2' ? chi2Sf(thr, a) : 1 - tCdf(thr, a);
  const pick = (v: Kind) => { setKind(v); setA(P_SPEC[v].a[4]); if (P_SPEC[v].b) setB(P_SPEC[v].b![4]); setThr(P_SPEC[v].thr); };
  return (
    <Layout
      main={<>
        <Dist kind={kind} a={a} b={b} values={values} showExact threshold={Math.min(thr, thrMax)} height={340} />
        <Legend items={[['simulated draws', C.blue], ['exact formula', C.yellow], [`draws above ${thr}`, C.red], ...(kind === 't' ? [['standard normal', C.red] as [string, string]] : [])]} />
      </>}
      side={<>
        <Choice label="Story" value={kind} onChange={pick} options={(Object.keys(P_SPEC) as Kind[]).map((v) => ({ value: v, label: P_SPEC[v].label }))} />
        <Slider label={spec.a[0]} min={spec.a[1]} max={spec.a[2]} step={spec.a[3]} value={a} onChange={setA} />
        {spec.b && <Slider label={spec.b[0]} min={spec.b[1]} max={spec.b[2]} step={spec.b[3]} value={b} onChange={setB} format={(v) => v.toFixed(2)} />}
        <Slider label="tail threshold c" min={0} max={thrMax} step={discrete(kind) ? 1 : 0.1} value={Math.min(thr, thrMax)} onChange={setThr} />
        <Slider label="simulated draws" min={50} max={5000} step={50} value={k} onChange={setK} />
        <button className="btn" onClick={() => setSeed(seed + 1)}>🎲 Re-simulate</button>
        <Readout items={[
          ['theory mean', ex.m.toFixed(2), C.yellow], ['simulated mean', mean(values).toFixed(2), C.blue],
          ['theory SD', isFinite(ex.sd) ? ex.sd.toFixed(2) : '∞ (df ≤ 2)', C.yellow], ['simulated SD', sdS(values).toFixed(2), C.blue],
          [`P(X > ${+Math.min(thr, thrMax).toFixed(2)})`, pct(exTail), C.red], ['simulated', pct(tail(values, Math.min(thr, thrMax))), C.red],
        ]} />
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Five standard distributions, each **built from a simple random story**: the top strip shows one trial, the bottom histogram collects 2,000 of them and the yellow marks show the exact formula.', steps: [
      { do: 'Step through the first five frames (binomial).', notice: 'Each week of 20 leads adds one block; after 2,000 weeks the blocks match the binomial formula (P(2 deals) ≈ 0.285).' },
      { do: 'Continue to the Poisson and exponential frames.', notice: 'The red tail is the risk: 3.4% of minutes overload a 6-call team; 22% of gaps between cars exceed 3 minutes.' },
      { do: 'Watch the last three frames (t).', notice: 'Ratios from samples of 5 have fatter tails than the red normal curve: 12% land beyond ±1.96 instead of 5%.' },
    ] },
    Playground: { what: 'Pick a story, change its parameters and compare the **simulated** histogram with the **exact** distribution, including a tail probability P(X > c).', steps: [
      { do: 'Binomial: drag **p** from 0.05 to 0.5, then to 0.95.', notice: 'Skewed right, then symmetric, then skewed left. The mean np slides along.' },
      { do: 'Poisson: raise **λ** from 1 to 15.', notice: 'The shape turns from lopsided into a bell, and the SD grows like √λ.' },
      { do: 't: set df = 1, then 30.', notice: 'With df = 1 the tails are enormous; by df = 30 the t curve and the normal almost coincide.' },
    ] },
  },
};
export default anim;
