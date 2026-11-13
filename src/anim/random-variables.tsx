// Random variables: a distribution built from simulated days, the mean as balance point, variance as average squared distance,
// a linear transformation (profit), and "same mean, different risk".
import { ReactNode, useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Bars, Dots, Seg, Label, Region, Caption, Readout, Slider, Choice, Layout, Legend, useStepPlayer, PlayerControls, rng, C, Scales } from '../viz/kit';
import { mean, variance, drawDiscrete, binomPmfs, poissonPmfs } from '../viz/math';
import { f2 } from './_math-helpers';

/* ---------- pure helpers ---------- */
const VALS = [0, 1, 2], PROBS = [0.2, 0.5, 0.3];
const MU = 1.1, VAR = 0.49, SD = 0.7;
function simulate(vals: number[], probs: number[], n: number, seed: number) { const r = rng(seed); return Array.from({ length: n }, () => drawDiscrete(vals, probs, r)); }
const freq = (xs: number[], vals: number[]) => vals.map((v) => xs.filter((x) => x === v).length / Math.max(1, xs.length));

/** Balance-point triangle under the x axis at the mean. */
function Fulcrum({ s, x, y = 0, color = C.green }: { s: Scales; x: number; y?: number; color?: string }) {
  const X = s.sx(x), Y = s.sy(y);
  return <polygon points={`${X},${Y} ${X - 10},${Y + 16} ${X + 10},${Y + 16}`} fill={color} />;
}

/* ---------- Animate ---------- */
const DAY_N = [1, 2, 3, 4, 5, 10, 20, 50, 100, 500, 2000];
type Frame = { kind: 'sim' | 'mean' | 'var' | 'profit' | 'risk'; n?: number; cap: ReactNode; read: [string, ReactNode, string?][] };

function Animate() {
  const days = useMemo(() => simulate(VALS, PROBS, 2000, 1), []);
  const frames = useMemo<Frame[]>(() => {
    const fr: Frame[] = DAY_N.map((n) => {
      const xs = days.slice(0, n), m = mean(xs), v = variance(xs);
      return { kind: 'sim', n, cap: n === 1 ? <>A small shop's <b>orders per day</b> is a <b>random variable</b> X: before the day starts you don't know the number, but you know the odds: <b>0 orders 20%</b>, 1 order 50%, 2 orders 30% (green marks). Day 1: <b>{xs[0]} order{xs[0] === 1 ? '' : 's'}</b>.</>
        : n <= 5 ? <>Day {n}: {xs[n - 1]} order{xs[n - 1] === 1 ? '' : 's'}. The diary (top) keeps growing; the bars (bottom) show what share of days had 0, 1 or 2 orders. After {n} days they are still lumpy.</>
          : n < 500 ? <>{n} days. The bar heights are creeping towards the green marks, and the running average is {f2(m, 3)}.</>
            : <>{n.toLocaleString()} days. The bars sit on the green marks: the <b>distribution</b> of X is the long-run pattern of its values. Average {f2(m, 3)} (theory 1.1), variance {f2(v, 3)} (theory 0.49).</>,
        read: [['days simulated', n.toLocaleString()], ['average orders', f2(m, 3), C.blue], ['theory mean μ', '1.1', C.green], ['sample variance', n > 1 ? f2(v, 3) : '–', C.blue], ['theory σ²', '0.49', C.green]] };
    });
    fr.push({ kind: 'mean', cap: <>The <b>mean</b> (expected value) is μ = 0 × 0.2 + 1 × 0.5 + 2 × 0.3 = <b>1.1 orders</b>. Picture the bars as weights on a see-saw: 1.1 is where it balances. You never get exactly 1.1 orders on a day; it is a long-run average, not a typical value.</>, read: [['μ = Σ x·P(x)', '1.1', C.green]] });
    fr.push({ kind: 'var', cap: <>The <b>variance</b> measures spread: square each value's distance from 1.1 and average with the same weights. (0 − 1.1)² × 0.2 + (1 − 1.1)² × 0.5 + (2 − 1.1)² × 0.3 = 0.242 + 0.005 + 0.243 = <b>0.49</b>. The <b>standard deviation</b> σ = √0.49 = <b>0.7</b> orders (purple band).</>, read: [['σ² = Σ (x − μ)²·P(x)', '0.49', C.purple], ['σ', '0.7', C.purple]] });
    fr.push({ kind: 'profit', cap: <>Each order earns ₹200 and the day costs ₹100, so <b>profit = 200X − 100</b> is a new random variable: −₹100, ₹100 or ₹300 with the same probabilities. Mean = 200 × 1.1 − 100 = <b>₹120</b>; SD = 200 × 0.7 = <b>₹140</b> (the −100 shift does not change the spread). One day in five loses money.</>, read: [['mean profit', '₹120', C.green], ['SD of profit', '₹140', C.purple], ['P(loss)', '0.2', C.red]] });
    fr.push({ kind: 'risk', cap: <><b>Same mean, different risk.</b> Supplier A delivers in 4 or 6 days, B in 2 or 8 (each 50/50). Both average <b>5 days</b>, but SD is 1 day for A and <b>3 days</b> for B. To be safe you need 6 days of stock with A and 8 with B. The mean alone hides the risk; the variance shows it.</>, read: [['mean A = mean B', '5 days', C.green], ['SD A', '1 day', C.blue], ['SD B', '3 days', C.red]] });
    return fr;
  }, [days]);
  const p = useStepPlayer(frames.length, 1800);
  const f = frames[p.i];
  let main: ReactNode;
  if (f.kind === 'sim') {
    const n = f.n!, xs = days.slice(0, n), show = xs.slice(-60), off = Math.max(0, n - 60);
    main = <>
      <div className="small muted">Diary: orders on each day{n > 60 ? ` (last 60 of ${n.toLocaleString()})` : ''}</div>
      <Plot x={[off + 0.5, off + 60.5]} y={[-0.5, 2.5]} height={150} yTicks={3} xLabel="day" yLabel="orders" fy={(v) => (Number.isInteger(v) ? String(v) : '')}>
        {(s) => <>
          {show.map((v, i) => <Seg key={i} s={s} x1={off + i + 1} y1={0} x2={off + i + 1} y2={v} color={C.grey} width={1} />)}
          <Dots s={s} pts={show.map((v, i) => ({ x: off + i + 1, y: v }))} color={(i) => (i === show.length - 1 ? C.gold : C.blue)} r={4} animate={false} />
        </>}
      </Plot>
      <Plot x={[-0.6, 2.6]} y={[0, 1]} height={260} xTicks={3} fx={(v) => (Number.isInteger(v) ? `${v} order${v === 1 ? '' : 's'}` : '')} xLabel="orders in a day" yLabel="share of days">
        {(s) => <>
          <Bars s={s} data={freq(xs, VALS).map((y, i) => ({ x: i, y }))} width={0.55} color={C.blue} />
          {PROBS.map((pr, i) => <g key={i}><Seg s={s} x1={i - 0.36} y1={pr} x2={i + 0.36} y2={pr} color={C.green} width={3} /><Label s={s} x={i + 0.4} y={pr - 0.01} size={12} color={C.green}>{pr}</Label></g>)}
          <Seg s={s} x1={mean(xs)} y1={0} x2={mean(xs)} y2={1} color={C.yellow} dash="5 4" />
          <Label s={s} x={mean(xs) + 0.04} y={0.93} color={C.yellow} size={12}>average {f2(mean(xs), 2)}</Label>
        </>}
      </Plot>
    </>;
  } else if (f.kind === 'mean' || f.kind === 'var') {
    main = <Plot x={[-0.8, 2.8]} y={[-0.08, 0.62]} height={380} xTicks={3} fx={(v) => (Number.isInteger(v) ? `${v} order${v === 1 ? '' : 's'}` : '')} xLabel="orders in a day (X)" yLabel="probability">
      {(s) => <>
        {f.kind === 'var' && <Region s={s} x0={MU - SD} x1={MU + SD} y0={0} y1={0.6} color={C.purple} opacity={0.12} />}
        <Seg s={s} x1={-0.8} y1={0} x2={2.8} y2={0} color={C.muted} width={3} />
        <Bars s={s} data={PROBS.map((y, i) => ({ x: i, y }))} width={0.45} color={C.blue} />
        <Fulcrum s={s} x={MU} />
        <Label s={s} x={MU} y={-0.065} anchor="middle" color={C.green}>μ = 1.1</Label>
        {f.kind === 'mean' && PROBS.map((pr, i) => <Label key={i} s={s} x={i} y={pr + 0.02} anchor="middle" color={C.text}>weight {pr}</Label>)}
        {f.kind === 'var' && VALS.map((v, i) => <g key={i}>
          <Seg s={s} x1={MU} y1={PROBS[i] + 0.05} x2={v} y2={PROBS[i] + 0.05} color={C.red} width={2} />
          <Label s={s} x={v} y={PROBS[i] + 0.075} anchor="middle" size={12} color={C.red}>({v} − 1.1)² × {PROBS[i]} = {f2((v - MU) ** 2 * PROBS[i], 3)}</Label>
        </g>)}
        {f.kind === 'var' && <Label s={s} x={MU + SD + 0.03} y={0.57} color={C.purple} size={12}>μ ± σ</Label>}
      </>}
    </Plot>;
  } else if (f.kind === 'profit') {
    main = <Plot x={[-200, 400]} y={[-0.08, 0.62]} height={380} xTicks={6} xLabel="daily profit (₹) = 200X − 100" yLabel="probability">
      {(s) => <>
        <Region s={s} x0={120 - 140} x1={120 + 140} y0={0} y1={0.6} color={C.purple} opacity={0.12} />
        <Region s={s} x0={-200} x1={0} y0={0} y1={0.6} color={C.red} opacity={0.06} />
        <Seg s={s} x1={-200} y1={0} x2={400} y2={0} color={C.muted} width={3} />
        <Bars s={s} data={[-100, 100, 300].map((x, i) => ({ x, y: PROBS[i] }))} width={60} color={(i) => (i === 0 ? C.red : C.blue)} />
        <Fulcrum s={s} x={120} />
        <Label s={s} x={120} y={-0.065} anchor="middle" color={C.green}>mean ₹120</Label>
        <Label s={s} x={-190} y={0.56} color={C.red} size={12}>loss-making days</Label>
      </>}
    </Plot>;
  } else {
    main = <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
      {[{ name: 'Supplier A', v: [4, 6], col: C.blue, sd: 1 }, { name: 'Supplier B', v: [2, 8], col: C.red, sd: 3 }].map((sp) => (
        <div key={sp.name} style={{ flex: '1 1 260px', minWidth: 0 }}>
          <div className="small" style={{ color: sp.col }}>{sp.name}: {sp.v[0]} or {sp.v[1]} days, SD {sp.sd}</div>
          <Plot x={[0, 10]} y={[-0.1, 0.7]} width={400} height={300} xTicks={5} xLabel="delivery time (days)" yLabel="probability">
            {(s) => <>
              <Region s={s} x0={5 - sp.sd} x1={5 + sp.sd} y0={0} y1={0.68} color={C.purple} opacity={0.12} />
              <Seg s={s} x1={0} y1={0} x2={10} y2={0} color={C.muted} width={3} />
              <Bars s={s} data={sp.v.map((x) => ({ x, y: 0.5 }))} width={0.8} color={sp.col} />
              <Fulcrum s={s} x={5} />
              <Label s={s} x={5} y={-0.085} anchor="middle" color={C.green}>mean 5</Label>
            </>}
          </Plot>
        </div>))}
    </div>;
  }
  return (
    <div>
      <Layout
        main={main}
        side={<>
          <Readout items={f.read} />
          <Legend items={[['simulated / probability', C.blue], ['true probability, mean', C.green], ['± one SD', C.purple], ['squared distances', C.red]]} />
          <p className="small muted" style={{ margin: 0 }}>A random variable = a number decided by chance + the probabilities of each value. Mean = centre of balance; SD = typical distance from it.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{f.cap}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
type DK = 'orders' | 'binom' | 'poisson' | 'dice';
function dist(k: DK, a: number, b: number): { vals: number[]; probs: number[]; label: string } {
  if (k === 'orders') { const p0 = a / 100, p1 = Math.min(b / 100, 1 - p0); return { vals: [0, 1, 2], probs: [p0, p1, Math.max(0, 1 - p0 - p1)], label: 'orders per day' }; }
  if (k === 'binom') { const n = Math.round(a), pr = b / 100; return { vals: Array.from({ length: n + 1 }, (_, i) => i), probs: binomPmfs(n, pr), label: `sales from ${n} calls` }; }
  if (k === 'poisson') { const lam = a / 10, kmax = Math.ceil(lam + 5 * Math.sqrt(lam) + 3); return { vals: Array.from({ length: kmax + 1 }, (_, i) => i), probs: poissonPmfs(lam, kmax), label: 'customers per hour' }; }
  return { vals: [1, 2, 3, 4, 5, 6], probs: Array(6).fill(1 / 6), label: 'die face' };
}
const PARAMS: Record<DK, { label: string; a: [string, number, number, number, (v: number) => string]; b?: [string, number, number, number, (v: number) => string] }> = {
  orders: { label: 'Daily orders', a: ['P(0 orders)', 0, 100, 20, (v) => `${v}%`], b: ['P(1 order)', 0, 100, 50, (v) => `${v}%`] },
  binom: { label: 'Binomial (sales calls)', a: ['calls n', 1, 30, 10, (v) => String(v)], b: ['conversion p', 1, 99, 20, (v) => `${v}%`] },
  poisson: { label: 'Poisson (arrivals)', a: ['average λ', 5, 150, 30, (v) => (v / 10).toFixed(1)] },
  dice: { label: 'Fair die', a: ['(no parameter)', 0, 1, 0, () => '–'] },
};

function Playground() {
  const [k, setK] = useState<DK>('binom');
  const [a, setA] = useState(PARAMS.binom.a[3]);
  const [b, setB] = useState(PARAMS.binom.b![3]);
  const [n, setN] = useState(200);
  const [seed, setSeed] = useState(4);
  const D = dist(k, a, b);
  const xs = useMemo(() => simulate(D.vals, D.probs, n, seed), [D.vals.length, D.probs.join(), n, seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const mu = D.vals.reduce((s, v, i) => s + v * D.probs[i], 0);
  const sd = Math.sqrt(D.vals.reduce((s, v, i) => s + (v - mu) ** 2 * D.probs[i], 0));
  const fr = freq(xs, D.vals), m = mean(xs), sdS = Math.sqrt(variance(xs));
  const lo = D.vals[0] - 0.7, hi = D.vals[D.vals.length - 1] + 0.7;
  const yMax = Math.max(0.1, ...D.probs, ...fr) * 1.18;
  const choose = (key: DK) => { setK(key); setA(PARAMS[key].a[3]); if (PARAMS[key].b) setB(PARAMS[key].b![3]); };
  const P = PARAMS[k];
  return (
    <Layout
      main={<Plot x={[lo, hi]} y={[0, yMax]} height={400} xLabel={D.label} yLabel="probability / share" xTicks={Math.min(12, D.vals.length)}>
        {(s) => <>
          <Region s={s} x0={mu - sd} x1={mu + sd} y0={0} y1={yMax} color={C.purple} opacity={0.1} />
          <Bars s={s} data={fr.map((y, i) => ({ x: D.vals[i], y }))} width={0.6} color={C.blue} />
          {D.probs.map((pr, i) => <Seg key={i} s={s} x1={D.vals[i] - 0.38} y1={pr} x2={D.vals[i] + 0.38} y2={pr} color={C.green} width={3} />)}
          <Seg s={s} x1={mu} y1={0} x2={mu} y2={yMax} color={C.green} dash="6 4" />
          <Seg s={s} x1={m} y1={0} x2={m} y2={yMax * 0.92} color={C.yellow} width={2} />
          <Label s={s} x={m + (hi - lo) * 0.01} y={yMax * 0.88} color={C.yellow} size={12}>sample mean</Label>
        </>}
      </Plot>}
      side={<>
        <Choice label="Random variable" value={k} onChange={choose} options={(Object.keys(PARAMS) as DK[]).map((key) => ({ value: key, label: PARAMS[key].label }))} />
        {k !== 'dice' && <Slider label={P.a[0]} min={P.a[1]} max={P.a[2]} value={a} onChange={setA} format={P.a[4]} />}
        {P.b && <Slider label={P.b[0]} min={P.b[1]} max={P.b[2]} value={b} onChange={setB} format={P.b[4]} />}
        <Slider label="draws simulated" min={10} max={5000} step={10} value={n} onChange={setN} format={(v) => v.toLocaleString()} />
        <button className="btn" onClick={() => setSeed(seed + 1)}>🎲 Simulate again</button>
        <Readout items={[
          ['theory mean μ', f2(mu, 3), C.green], ['sample mean', f2(m, 3), C.yellow],
          ['theory SD σ', f2(sd, 3), C.purple], ['sample SD', f2(sdS, 3), C.blue],
        ]} />
        {k === 'orders' && D.probs[2] === 0 && a + b > 100 && <p className="small" style={{ margin: 0, color: C.red }}>P(0) + P(1) cannot exceed 100%: P(1) is capped at {100 - a}%.</p>}
        <p className="small muted" style={{ margin: 0 }}>Green marks = exact probabilities, blue bars = simulated shares, purple band = μ ± σ. With few draws the bars and the sample mean wander; with thousands they lock onto the theory.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'We simulate a shop\'s **daily orders** (0, 1 or 2 with chances 20%, 50%, 30%) day after day, then read off the **mean** as a balance point and the **variance** as average squared distance, and transform it into profit.', steps: [
      { do: 'Step through the simulated days.', notice: 'The diary is unpredictable day to day, but the bar heights settle onto the green probabilities and the average heads for **1.1**.' },
      { do: 'Continue to the see-saw and squared-distance frames.', notice: 'The bars balance at μ = 1.1; the three squared distances add up to σ² = 0.49, so σ = 0.7 orders.' },
      { do: 'Watch the last two frames.', notice: 'Profit = 200X − 100 has mean ₹120 and SD ₹140. Two suppliers with the same 5-day mean can carry very different risk.' },
    ] },
    Playground: { what: 'Pick a random variable and its parameters, then simulate many draws. Compare the simulated bars with the exact probabilities, and the sample mean and SD with theory.', steps: [
      { do: 'Set **draws simulated** to 10, press **🎲 Simulate again** several times, then set it to 5,000.', notice: 'Ten draws give a different, lumpy picture each time; five thousand draws match the green marks almost exactly.' },
      { do: 'Choose **Binomial**, then raise **calls n** while keeping p at 20%.', notice: 'The mean grows like n·p and the shape becomes a smooth hump: the bell curve is starting to appear.' },
      { do: 'Choose **Daily orders** and move P(0) and P(1) so most days have 0 or 2 orders.', notice: 'The mean can stay near 1 while the SD (purple band) gets much wider: same average, more risk.' },
    ] },
  },
};
export default anim;
