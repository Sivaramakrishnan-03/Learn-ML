// Confidence intervals: many repeated samples, each producing its own interval; about 95% of them catch the true mean.
// Then: width vs confidence level and vs sample size. Running example: delivery times, true mean 52 min, SD 10 (g-stats1).
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Dots, Seg, Label, Caption, Readout, Slider, Choice, Toggle, Layout, Legend, useStepPlayer, PlayerControls, rng, C } from '../viz/kit';
import { mean, sdS, normalSample, normInv, tInv, pct } from './_stats1-helpers';

/* ---------- pure helpers ---------- */
const MU = 52, SIGMA = 10;
interface CI { xs: number[]; m: number; s: number; lo: number; hi: number; hit: boolean }
function samples(n: number, k: number, seed: number) { const r = rng(seed); return Array.from({ length: k }, () => normalSample(r, n, MU, SIGMA)); }
const crit = (n: number, conf: number, useZ = false) => (useZ ? normInv(1 - (1 - conf) / 2) : tInv(1 - (1 - conf) / 2, n - 1));
function intervals(ss: number[][], conf: number, useZ = false): CI[] {
  return ss.map((xs) => {
    const n = xs.length, m = mean(xs), s = sdS(xs), h = crit(n, conf, useZ) * s / Math.sqrt(n);
    return { xs, m, s, lo: m - h, hi: m + h, hit: m - h <= MU && MU <= m + h };
  });
}
/** Long-run coverage by brute force (used in the Playground readout). */
function coverage(n: number, conf: number, useZ: boolean, seed: number, reps = 1500) {
  const r = rng(seed), c = crit(n, conf, useZ); let hit = 0;
  for (let i = 0; i < reps; i++) { const xs = normalSample(r, n, MU, SIGMA), m = mean(xs), h = c * sdS(xs) / Math.sqrt(n); if (Math.abs(m - MU) <= h) hit++; }
  return hit / reps;
}

/* ---------- shared view: stacked intervals ---------- */
function Stack({ cis, x, height = 380, k }: { cis: CI[]; x: [number, number]; height?: number; k: number }) {
  const shown = cis.slice(0, k);
  const rows = Math.max(k, 20);
  return (
    <Plot x={x} y={[rows + 1, -1.1 - 4.5 * rows / 100]} height={height} xLabel="delivery time (minutes) · one horizontal line = one sample's interval" yLabel="sample number" fy={(v) => (v < 1 ? '' : String(Math.round(v)))} yTicks={5}>
      {(s) => <>
        <Seg s={s} x1={MU} x2={MU} y1={0.2} y2={rows + 1} color={C.green} width={2} dash="6 4" />
        {shown.map((c, i) => <Seg key={i} s={s} x1={c.lo} x2={c.hi} y1={i + 1} y2={i + 1} color={c.hit ? C.blue : C.red} width={rows > 60 ? 2 : 3} />)}
        <Dots s={s} pts={shown.map((c, i) => ({ x: c.m, y: i + 1 }))} r={rows > 60 ? 2 : 3.5} color={(i) => (shown[i].hit ? C.yellow : C.red)} animate={false} />
        <Label s={s} x={MU} y={-0.3} color={C.green} size={12} anchor="middle">true mean μ = 52</Label>
      </>}
    </Plot>
  );
}

/* ---------- Animate ---------- */
interface Frame { n: number; conf: number; k: number; detail: boolean; cap: (cis: CI[], k: number) => JSX.Element }
const hits = (cis: CI[], k: number) => cis.slice(0, k).filter((c) => c.hit).length;
const FRAMES: Frame[] = [
  { n: 25, conf: 0.95, k: 1, detail: true, cap: (c) => <>We sample <b>25 deliveries</b> (blue dots, top). Their average is <b>{c[0].m.toFixed(1)} min</b> (yellow). In real life we never see the true mean of 52 (green); we only have this one sample.</> },
  { n: 25, conf: 0.95, k: 1, detail: true, cap: (c) => <>Build the interval: margin = t × s / √n = 2.064 × {c[0].s.toFixed(1)} / √25 = <b>{(c[0].hi - c[0].m).toFixed(1)} min</b>. So the 95% CI is <b>{c[0].lo.toFixed(1)} to {c[0].hi.toFixed(1)}</b>, drawn as line 1 below.</> },
  { n: 25, conf: 0.95, k: 2, detail: true, cap: (c) => <>A <b>second sample</b> of 25 gives a different average ({c[1].m.toFixed(1)}) and a different SD, so a different interval: {c[1].lo.toFixed(1)} to {c[1].hi.toFixed(1)}.</> },
  { n: 25, conf: 0.95, k: 3, detail: true, cap: (c) => <>Sample 3: {c[2].lo.toFixed(1)} to {c[2].hi.toFixed(1)}. Every interval wobbles, because every sample is different. {c[2].hit ? 'This one also covers' : 'This one misses'} the green line.</> },
  { n: 25, conf: 0.95, k: 5, detail: true, cap: (c, k) => <>Five samples, five intervals. {hits(c, k)} of 5 contain 52. Each interval either catches the truth or it does not; we can't tell which from inside one sample.</> },
  { n: 25, conf: 0.95, k: 10, detail: false, cap: (c, k) => <><b>10 intervals</b>: {hits(c, k)} catch μ.</> },
  { n: 25, conf: 0.95, k: 25, detail: false, cap: (c, k) => <><b>25 intervals</b>: {hits(c, k)} catch μ ({pct(hits(c, k) / k, 0)}). Red ones are the misses: their sample happened to be unusually high or low.</> },
  { n: 25, conf: 0.95, k: 50, detail: false, cap: (c, k) => <><b>50 intervals</b>: {hits(c, k)} hits, {k - hits(c, k)} misses.</> },
  { n: 25, conf: 0.95, k: 100, detail: false, cap: (c, k) => <><b>100 intervals: {hits(c, k)} contain the true mean.</b> That is what "95% confidence" means: the <b>method</b> catches the truth in about 95% of samples. Any single interval is either right or wrong.</> },
  { n: 25, conf: 0.8, k: 100, detail: false, cap: (c, k) => <>Same 100 samples, but <b>80% confidence</b> (t = 1.318 instead of 2.064). The intervals shrink, and now {k - hits(c, k)} miss. <b>Less confidence buys a narrower interval.</b></> },
  { n: 25, conf: 0.99, k: 100, detail: false, cap: (c, k) => <><b>99% confidence</b> (t = 2.797): wider intervals, only {k - hits(c, k)} miss{k - hits(c, k) === 1 ? 'es' : ''}. Certainty costs width; you cannot have both from the same data.</> },
  { n: 100, conf: 0.95, k: 100, detail: false, cap: (c, k) => <>Back to 95%, but each sample now has <b>100 deliveries</b>. The intervals are about <b>half as wide</b> (√100 / √25 = 2) and still {hits(c, k)} of 100 catch μ. <b>More data buys precision, not more confidence.</b></> },
  { n: 100, conf: 0.95, k: 100, detail: true, cap: () => <><b>Takeaway:</b> report "52 minutes, 95% CI 50 to 54", and read it as: "built by a method that captures the true mean in 95% of samples". It is <b>not</b> a range for 95% of individual deliveries (those spread from about 32 to 72).</> },
];

function Animate() {
  const s25 = useMemo(() => samples(25, 100, 17), []);
  const s100 = useMemo(() => samples(100, 100, 29), []);
  const sets = useMemo(() => {
    const o: Record<string, CI[]> = {};
    FRAMES.forEach((f) => { const key = `${f.n}-${f.conf}`; if (!o[key]) o[key] = intervals(f.n === 25 ? s25 : s100, f.conf); });
    return o;
  }, [s25, s100]);
  const p = useStepPlayer(FRAMES.length, 2600);
  const f = FRAMES[p.i];
  const cis = sets[`${f.n}-${f.conf}`];
  const cur = cis[f.k - 1];
  const shown = cis.slice(0, f.k);
  const avgW = mean(shown.map((c) => c.hi - c.lo));
  return (
    <div>
      <Layout
        main={<>
          <div className="small muted">Latest sample: {f.n} deliveries</div>
          <Plot x={[20, 85]} y={[0, 1]} height={120} xLabel="delivery time (minutes)" fy={() => ''} yTicks={0}>
            {(s) => <>
              <Dots s={s} pts={cur.xs.map((v, i) => ({ x: v, y: 0.45 + (((i * 37) % 11) - 5) * 0.06 }))} r={f.n > 50 ? 3 : 4.5} animate={false} />
              <Seg s={s} x1={MU} x2={MU} y1={0} y2={1} color={C.green} dash="6 4" />
              <Seg s={s} x1={cur.m} x2={cur.m} y1={0.05} y2={0.95} color={C.yellow} width={3} />
              {p.i > 0 && <Seg s={s} x1={cur.lo} x2={cur.hi} y1={0.1} y2={0.1} color={cur.hit ? C.blue : C.red} width={5} />}
              <Label s={s} x={cur.m + 0.6} y={0.82} color={C.yellow} size={12}>x̄ = {cur.m.toFixed(1)}</Label>
            </>}
          </Plot>
          <Stack cis={cis} x={[40, 64]} k={p.i > 0 ? f.k : 0} height={370} />
        </>}
        side={<>
          <Readout items={[
            ['sample size n', f.n],
            ['confidence', pct(f.conf, 0)],
            ['t critical value', crit(f.n, f.conf).toFixed(3)],
            ['intervals drawn', p.i > 0 ? f.k : 0],
            ['caught μ', p.i > 0 ? `${hits(cis, f.k)} / ${f.k}` : '–', C.blue],
            ['average width', p.i > 0 ? `${avgW.toFixed(1)} min` : '–'],
          ]} />
          <Legend items={[['sample values', C.blue], ['sample mean x̄', C.yellow], ['interval that caught μ', C.blue], ['interval that missed', C.red], ['true mean μ (unknown in practice)', C.green]]} />
          <p className="small muted" style={{ margin: 0 }}>The green line never moves. The intervals do. Confidence describes the long-run hit rate of the procedure.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{f.cap(cis, f.k)}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
function Playground() {
  const [n, setN] = useState(25);
  const [conf, setConf] = useState(0.95);
  const [k, setK] = useState(50);
  const [useZ, setUseZ] = useState(false);
  const [seed, setSeed] = useState(5);
  const ss = useMemo(() => samples(n, k, seed * 7 + n), [n, k, seed]);
  const cis = useMemo(() => intervals(ss, conf, useZ), [ss, conf, useZ]);
  const cov = useMemo(() => coverage(n, conf, useZ, seed + 1000), [n, conf, useZ, seed]);
  const h = hits(cis, k);
  return (
    <Layout
      main={<Stack cis={cis} x={[30, 74]} k={k} height={430} />}
      side={<>
        <Slider label="sample size n" min={3} max={200} value={n} onChange={setN} />
        <Choice label="Confidence" value={conf} onChange={setConf} options={[0.8, 0.9, 0.95, 0.99].map((v) => ({ value: v, label: pct(v, 0) }))} />
        <Slider label="intervals shown" min={20} max={100} step={10} value={k} onChange={setK} />
        <Toggle label="use z instead of t (a common mistake)" value={useZ} onChange={setUseZ} />
        <button className="btn" onClick={() => setSeed(seed + 1)}>🎲 Draw new samples</button>
        <Readout items={[
          ['caught μ (shown)', `${h} / ${k}`, C.blue],
          ['long-run coverage', pct(cov, 1), cov < conf - 0.02 ? C.red : C.green],
          ['critical value', crit(n, conf, useZ).toFixed(3)],
          ['average width', `${mean(cis.map((c) => c.hi - c.lo)).toFixed(1)} min`],
        ]} />
        <p className="small muted" style={{ margin: 0 }}>Long-run coverage uses 1,500 extra simulated samples. Try n = 4 with the z toggle on: the "95%" intervals only catch μ about 86% of the time.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'We repeatedly sample **25 deliveries** from a process whose true mean is 52 minutes and build a **95% confidence interval** from each sample. Stacked up, they show what "95% confidence" really means.', steps: [
      { do: 'Step through the first five frames.', notice: 'Each sample (top) gives its own mean and its own interval (one line in the stack). Most cross the green true-mean line.' },
      { do: 'Press **▶ Play** until 100 intervals are drawn.', notice: 'About 95 are blue (caught μ) and about 5 are red (missed). The confidence belongs to the method.' },
      { do: 'Watch the last frames (80%, 99%, n = 100).', notice: 'Lower confidence = narrower but more misses; larger n = narrower with the same 95% hit rate.' },
    ] },
    Playground: { what: 'Choose the sample size and confidence level and watch a stack of intervals from fresh samples, with the **long-run coverage** computed by simulation.', steps: [
      { do: 'Drag **n** from 10 to 200.', notice: 'The intervals shrink like 1/√n, but the share that catches μ stays near the chosen confidence.' },
      { do: 'Switch between **80%** and **99%**.', notice: 'Higher confidence widens every interval; misses become rare.' },
      { do: 'Set n = 4 and tick **use z instead of t**.', notice: 'Coverage drops well below 95%: with tiny samples you must use the t value (3.182 for n = 4), not 1.96.' },
    ] },
  },
};
export default anim;
