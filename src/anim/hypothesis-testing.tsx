// Hypothesis testing: build the null distribution by simulation, place the observed statistic, read the p-value as a tail
// area, then alpha, Type I / Type II errors and power with the alternative curve. Running example: 62 heads in 100 tosses (g-stats1).
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Bars, Dots, FnLine, Seg, Label, Region, Caption, Readout, Slider, Choice, Toggle, Layout, Legend, useStepPlayer, PlayerControls, rng, C } from '../viz/kit';
import { normPdf, normCdf, normInv, pct, pFmt } from './_stats1-helpers';

/* ---------- pure helpers ---------- */
const N_OBS = 100, HEADS = 62;
function tosses(n: number, p: number, seed: number): number[] { const r = rng(seed); return Array.from({ length: n }, () => (r() < p ? 1 : 0)); }
function observed() { // a fixed sequence with exactly 62 heads, in a random-looking order
  const r = rng(62), a: number[] = Array.from({ length: N_OBS }, (_, i) => (i < HEADS ? 1 : 0));
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const se = (n: number, p: number) => Math.sqrt((p * (1 - p)) / n);
function power(n: number, p1: number, alpha: number, oneSided = false) {
  const s0 = se(n, 0.5), s1 = se(n, p1), z = normInv(1 - (oneSided ? alpha : alpha / 2));
  const hi = 0.5 + z * s0, lo = 0.5 - z * s0;
  const pw = 1 - normCdf(hi, p1, s1) + (oneSided ? 0 : normCdf(lo, p1, s1));
  return { hi, lo, pw };
}
function shareHist(props: number[], n: number) { // one bar per possible count, as a density so it shares the axis with the curves
  const c = new Map<number, number>(); props.forEach((p) => c.set(Math.round(p * n), (c.get(Math.round(p * n)) ?? 0) + 1));
  return [...c.entries()].map(([k, v]) => ({ x: k / n, y: v / props.length * n }));
}

function Strip({ seq, label }: { seq: number[]; label: string }) {
  return (
    <Plot x={[0, 26]} y={[0, 6.2]} height={120} fy={() => ''} fx={() => ''} yTicks={0} xTicks={0} grid={false}>
      {(s) => <>
        <Dots s={s} pts={seq.map((_, i) => ({ x: 1 + (i % 25), y: 3.8 - Math.floor(i / 25) * 0.9 }))} r={5.5} color={(i) => (seq[i] ? C.gold : C.grey)} animate={false} />
        <Label s={s} x={13} y={5.0} anchor="middle" color={C.text}>{label}</Label>
      </>}
    </Plot>
  );
}

/* ---------- Animate ---------- */
interface Frame { k: number; seq: 'obs' | 'sim'; curve?: boolean; obs?: boolean; simP?: boolean; zP?: boolean; alpha?: number; typeI?: boolean; alt?: number; pw?: boolean; n: number; cap: (sims: number[]) => JSX.Element }
const tailShare = (sims: number[], d: number) => sims.filter((p) => Math.abs(p - 0.5) >= d - 1e-9).length / Math.max(sims.length, 1);
const FRAMES: Frame[] = [
  { k: 0, seq: 'obs', n: 100, cap: () => <>A coin is tossed <b>100 times</b> and lands heads <b>62 times</b> (gold). Is it biased, or could a fair coin do this by luck? A hypothesis test turns that hunch into a number.</> },
  { k: 1, seq: 'sim', n: 100, cap: (s) => <>Step 1: assume the boring explanation, <b>H₀: the coin is fair</b>. Simulate 100 tosses of a truly fair coin: {Math.round(s[0] * 100)} heads. That share becomes one block in the chart below.</> },
  { k: 10, seq: 'sim', n: 100, cap: () => <>Ten fair-coin experiments. Their head counts vary from run to run, purely by chance.</> },
  { k: 200, seq: 'sim', n: 100, cap: () => <><b>200 experiments.</b> A hump forms around 50%. This is what "no effect" looks like.</> },
  { k: 5000, seq: 'sim', n: 100, curve: true, cap: () => <><b>5,000 fair-coin experiments</b>: the <b>null distribution</b>. Its centre is 50% and its SD is √(0.5 × 0.5 / 100) = <b>5 points</b>. The blue curve is the normal approximation.</> },
  { k: 5000, seq: 'obs', n: 100, curve: true, obs: true, cap: () => <>Step 2: place what we actually saw, <b>62%</b> (gold line). It is out in the right tail of the "fair coin" world. Rare, but how rare?</> },
  { k: 5000, seq: 'obs', n: 100, curve: true, obs: true, simP: true, cap: (s) => <>Step 3: count fair-coin runs at least as extreme as ours (62% or more, or 38% or less, red): <b>{pct(tailShare(s, 0.12))}</b> of 5,000. That share is the <b>p-value</b>. The exact binomial answer is 0.021.</> },
  { k: 5000, seq: 'obs', n: 100, curve: true, obs: true, zP: true, cap: () => <>With the normal curve: z = (0.62 − 0.50) / 0.05 = <b>2.4</b> standard errors. Each shaded tail holds 0.82%, so <b>p = 0.016</b>. If the coin were fair, a result this extreme would happen about <b>1.6% of the time</b>.</> },
  { k: 5000, seq: 'obs', n: 100, curve: true, obs: true, alpha: 0.05, cap: () => <>Step 4: compare with <b>α = 0.05</b>, fixed in advance. The red zones (beyond 50% ± 1.96 × 5 = 40.2% and 59.8%) are where we reject H₀. 62% is inside, p = 0.016 ≤ 0.05: <b>reject H₀</b>, the coin looks biased.</> },
  { k: 5000, seq: 'obs', n: 100, curve: true, alpha: 0.05, typeI: true, cap: (s) => <><b>Type I error</b>: even a perfectly fair coin lands in the red zones {pct(tailShare(s, 0.1))} of the time here (5% for the smooth curve; whole numbers of heads make it a little lumpy). α is the <b>false-alarm rate</b> we chose to accept.</> },
  { k: 0, seq: 'obs', n: 100, curve: true, alpha: 0.05, alt: 0.6, cap: () => <>Now imagine the coin really is biased: heads <b>60%</b> of the time (H₁, teal curve). Its experiments scatter around 60% with SD 4.9 points, overlapping the fair-coin curve a lot.</> },
  { k: 0, seq: 'obs', n: 100, curve: true, alpha: 0.05, alt: 0.6, pw: true, cap: () => <>Only the green part of the teal curve falls in the rejection zone: <b>power = {pct(power(100, 0.6, 0.05).pw)}</b>. The purple part ({pct(1 - power(100, 0.6, 0.05).pw)}) is a <b>Type II error</b>: the bias is real but the test says "not significant". With 100 tosses we miss it about half the time.</> },
  { k: 0, seq: 'obs', n: 100, curve: true, alpha: 0.01, alt: 0.6, pw: true, cap: () => <>Make the test stricter, <b>α = 0.01</b>: the red zones shrink (cut-off {pct(power(100, 0.6, 0.01).hi)}), fewer false alarms, but power falls to <b>{pct(power(100, 0.6, 0.01).pw)}</b>. Type I and Type II errors trade off against each other.</> },
  { k: 0, seq: 'obs', n: 400, curve: true, alpha: 0.05, alt: 0.6, pw: true, cap: () => <>The way out is <b>more data</b>. With <b>400 tosses</b> (α back at 0.05) both curves are half as wide, they barely overlap, and power jumps to <b>{pct(power(400, 0.6, 0.05).pw)}</b>.</> },
  { k: 0, seq: 'obs', n: 100, curve: true, obs: true, zP: true, alpha: 0.05, cap: () => <><b>Recap:</b> p = 0.016 means "if the coin were fair, data this extreme turn up 1.6% of the time". It is <b>not</b> the probability that the coin is fair, and it says nothing about how big the bias is. Plan power before you collect data.</> },
];

function Animate() {
  const obsSeq = useMemo(observed, []);
  const sims = useMemo(() => Array.from({ length: 5000 }, (_, i) => tosses(N_OBS, 0.5, 1000 + i).reduce((s, v) => s + v, 0) / N_OBS), []);
  const p = useStepPlayer(FRAMES.length, 2700);
  const f = FRAMES[p.i];
  const shown = sims.slice(0, f.k);
  const seq = f.seq === 'sim' ? tosses(N_OBS, 0.5, 1000 + f.k - 1) : obsSeq;
  const s0 = se(f.n, 0.5), null0 = (x: number) => normPdf(x, 0.5, s0);
  const yMax = normPdf(0.5, 0.5, s0) * 1.3;
  const pw = f.alt ? power(f.n, f.alt, f.alpha ?? 0.05) : undefined;
  const crit = f.alpha ? power(f.n, 0.6, f.alpha) : undefined;
  const alt = f.alt ? (x: number) => normPdf(x, f.alt!, se(f.n, f.alt!)) : undefined;
  const bars = shareHist(shown, N_OBS);
  const X: [number, number] = [0.28, 0.8];
  return (
    <div>
      <Layout
        main={<>
          <Strip seq={seq} label={f.seq === 'sim' ? `simulated fair coin #${f.k}: ${seq.reduce((a, b) => a + b, 0)} heads` : `the real coin: ${HEADS} heads out of ${N_OBS}`} />
          <Plot x={X} y={[0, yMax]} height={320} xLabel={`share of heads in ${f.n} tosses`} yLabel="density" fx={(v) => Math.round(v * 100) + '%'} fy={() => ''} yTicks={0}>
            {(s) => <>
              {crit && <><Region s={s} x0={X[0]} x1={crit.lo} color={C.red} opacity={0.1} /><Region s={s} x0={crit.hi} x1={X[1]} color={C.red} opacity={0.1} /></>}
              {f.k > 0 && <Bars s={s} data={bars} width={0.0075} color={(i) => ((f.simP && Math.abs(bars[i].x - 0.5) >= 0.12 - 1e-9) || (f.typeI && Math.abs(bars[i].x - 0.5) >= 0.1 - 1e-9) ? C.red : C.grey)} highlight={f.k <= 10 ? (i) => Math.abs(bars[i].x - shown[f.k - 1]) < 1e-9 : undefined} />}
              {f.zP && <><FnLine s={s} f={null0} from={0.62} to={X[1]} color={C.red} width={0} fill={C.red} /><FnLine s={s} f={null0} from={X[0]} to={0.38} color={C.red} width={0} fill={C.red} /></>}
              {f.typeI && crit && <><FnLine s={s} f={null0} from={crit.hi} to={X[1]} color={C.red} width={0} fill={C.red} /><FnLine s={s} f={null0} from={X[0]} to={crit.lo} color={C.red} width={0} fill={C.red} /></>}
              {alt && pw && f.pw && <><FnLine s={s} f={alt} from={pw.hi} to={X[1]} color={C.green} width={0} fill={C.green} /><FnLine s={s} f={alt} from={pw.lo} to={pw.hi} color={C.purple} width={0} fill={C.purple} /></>}
              {f.curve && <FnLine s={s} f={null0} color={C.blue} width={3} />}
              {f.curve && <Label s={s} x={0.5} y={yMax * 0.93} anchor="middle" color={C.blue} size={12}>H₀: fair coin</Label>}
              {alt && <FnLine s={s} f={alt} color={C.teal} width={3} dash="7 4" />}
              {alt && <Label s={s} x={f.alt! + 0.012} y={normPdf(f.alt!, f.alt!, se(f.n, f.alt!)) * 1.04} color={C.teal} size={12}>H₁: heads {pct(f.alt!, 0)}</Label>}
              {crit && [crit.lo, crit.hi].map((c, i) => <Seg key={i} s={s} x1={c} x2={c} y1={0} y2={yMax} color={C.red} dash="4 3" />)}
              {crit && <Label s={s} x={X[1] - 0.006} y={yMax * 0.95} color={C.red} size={12} anchor="end">red zones: reject H₀ (α = {f.alpha})</Label>}
              {f.obs && <Seg s={s} x1={0.62} x2={0.62} y1={0} y2={yMax * 0.86} color={C.gold} width={3} />}
              {f.obs && <Label s={s} x={0.625} y={yMax * 0.6} color={C.gold} size={12}>observed 62%</Label>}
              {f.zP && <Label s={s} x={0.66} y={yMax * 0.12} color={C.red} size={12}>0.82%</Label>}
              {f.zP && <Label s={s} x={0.34} y={yMax * 0.12} color={C.red} size={12} anchor="middle">0.82%</Label>}
            </>}
          </Plot>
        </>}
        side={<>
          <Readout items={[
            ['fair-coin runs', f.k || '–'],
            ['observed', '62 / 100', C.gold],
            ['z', '2.40'],
            ['p-value', f.simP ? pct(tailShare(shown, 0.12)) + ' (sim)' : f.zP || f.alpha ? '0.016' : '–', C.red],
            ['α', f.alpha ?? '–', C.red],
            ['power', pw ? pct(pw.pw) : '–', C.green],
            ['Type II (β)', pw ? pct(1 - pw.pw) : '–', C.purple],
            ['tosses n', f.n],
          ]} />
          <Legend items={[['H₀ world (fair coin)', C.blue], ['observed result', C.gold], ['tail / reject zone', C.red], ['H₁ world (biased coin)', C.teal], ['power', C.green], ['Type II error', C.purple]]} />
          <p className="small muted" style={{ margin: 0 }}>Every test has this shape: a world where nothing is going on, and a question of how surprising your data would be there.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{f.cap(shown)}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
function Playground() {
  const [n, setN] = useState(100);
  const [p1, setP1] = useState(0.6);
  const [alpha, setAlpha] = useState(0.05);
  const [obs, setObs] = useState(0.62);
  const [one, setOne] = useState(false);
  const s0 = se(n, 0.5), s1 = se(n, p1);
  const { hi, lo, pw } = power(n, p1, alpha, one);
  const z = (obs - 0.5) / s0;
  const pv = one ? normCdf(-z) : 2 * normCdf(-Math.abs(z));
  const X: [number, number] = [0.2, 0.9];
  const yMax = Math.max(normPdf(0.5, 0.5, s0), normPdf(p1, p1, s1)) * 1.25;
  const nul = (x: number) => normPdf(x, 0.5, s0), alt = (x: number) => normPdf(x, p1, s1);
  const d = Math.abs(obs - 0.5);
  return (
    <Layout
      main={<>
        <Plot x={X} y={[0, yMax]} height={360} xLabel={`share of heads in ${n} tosses`} yLabel="density" fx={(v) => Math.round(v * 100) + '%'} fy={() => ''} yTicks={0}>
          {(s) => <>
            {!one && <Region s={s} x0={X[0]} x1={lo} color={C.red} opacity={0.1} />}
            <Region s={s} x0={hi} x1={X[1]} color={C.red} opacity={0.1} />
            {p1 > 0.5 && <><FnLine s={s} f={alt} from={hi} to={X[1]} color={C.green} width={0} fill={C.green} /><FnLine s={s} f={alt} from={one ? X[0] : lo} to={hi} color={C.purple} width={0} fill={C.purple} /></>}
            <FnLine s={s} f={nul} from={one ? Math.max(obs, X[0]) : 0.5 + d} to={X[1]} color={C.gold} width={0} fill={C.gold} />
            {!one && <FnLine s={s} f={nul} from={X[0]} to={0.5 - d} color={C.gold} width={0} fill={C.gold} />}
            <FnLine s={s} f={nul} color={C.blue} width={3} />
            {p1 > 0.5 && <FnLine s={s} f={alt} color={C.teal} width={3} dash="7 4" />}
            {[...(one ? [] : [lo]), hi].map((c, i) => <Seg key={i} s={s} x1={c} x2={c} y1={0} y2={yMax} color={C.red} dash="4 3" />)}
            <Seg s={s} x1={obs} x2={obs} y1={0} y2={yMax * 0.9} color={C.gold} width={3} />
            <Label s={s} x={0.5} y={yMax * 0.95} anchor="middle" color={C.blue} size={12}>H₀: 50%</Label>
            {p1 > 0.5 && <Label s={s} x={p1} y={normPdf(p1, p1, s1) * 1.05} anchor="middle" color={C.teal} size={12}>H₁: {pct(p1, 0)}</Label>}
          </>}
        </Plot>
        <Legend items={[['H₀ (fair)', C.blue], ['H₁ (true bias)', C.teal], ['reject zone', C.red], ['p-value area', C.gold], ['power', C.green], ['Type II error β', C.purple]]} />
      </>}
      side={<>
        <Slider label="tosses n" min={10} max={1000} step={10} value={n} onChange={setN} />
        <Slider label="true heads rate (H₁)" min={0.5} max={0.75} step={0.01} value={p1} onChange={setP1} format={(v) => pct(v, 0)} />
        <Slider label="observed heads share" min={0.3} max={0.8} step={0.01} value={obs} onChange={setObs} format={(v) => pct(v, 0)} />
        <Choice label="α" value={alpha} onChange={setAlpha} options={[0.01, 0.05, 0.1].map((v) => ({ value: v, label: String(v) }))} />
        <Toggle label="one-sided test (H₁: heads > 50%)" value={one} onChange={setOne} />
        <Readout items={[
          ['z', z.toFixed(2)], ['p-value', pFmt(pv), C.gold],
          ['decision', pv <= alpha ? 'reject H₀' : 'keep H₀', pv <= alpha ? C.red : C.blue],
          ['power', p1 > 0.5 ? pct(pw) : '= α', C.green], ['β', p1 > 0.5 ? pct(1 - pw) : '–', C.purple],
        ]} />
        <p className="small muted" style={{ margin: 0 }}>Set the true rate to 50%: then "power" is just α, the false-alarm rate.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Is a coin that gave **62 heads in 100 tosses** fair? We simulate thousands of fair coins to build the **null distribution**, read the **p-value** as a tail area, then add α, Type I / II errors and **power**.', steps: [
      { do: 'Step through frames 2 to 5.', notice: 'Fair-coin experiments pile up into a bell centred at 50% with SD 5 points.' },
      { do: 'Continue to frames 6 to 9.', notice: 'Only about 2% of fair-coin runs are as extreme as 62%: that share is the p-value. It falls inside the α = 0.05 reject zone.' },
      { do: 'Watch frames 11 to 14 (the teal H₁ curve).', notice: 'Power is the green area: 52% with 100 tosses, 28% with α = 0.01, 98% with 400 tosses.' },
    ] },
    Playground: { what: 'The classic power picture: the **H₀** curve (fair coin), the **H₁** curve (a truly biased coin), the reject zones set by α, and the p-value of your observed result.', steps: [
      { do: 'Move **observed heads share** from 50% to 70%.', notice: 'The gold p-value area shrinks; the decision flips to "reject H₀" once p ≤ α.' },
      { do: 'Keep H₁ at 60% and drag **tosses n** from 50 to 500.', notice: 'Both curves narrow, overlap less, and power climbs from about 30% to over 95%.' },
      { do: 'Switch α from 0.05 to 0.01.', notice: 'The red zones move outward: fewer false alarms, but more purple Type II errors.' },
    ] },
  },
};
export default anim;
