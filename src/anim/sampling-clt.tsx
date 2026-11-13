// GOLD STANDARD animation: every other topic animation follows this structure.
// 1) pure helpers that generate data / frames   2) <Animate> = narrated frames + player   3) <Playground> = live controls   4) howto
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Bars, FnLine, Dots, Seg, Label, Caption, Readout, Slider, Choice, Layout, Legend, useStepPlayer, PlayerControls, rng, C } from '../viz/kit';

/* ---------- pure helpers ---------- */
type Shape = 'skewed' | 'uniform' | 'bimodal';
const SHAPES: Record<Shape, { label: string; draw: (r: () => number) => number }> = {
  skewed: { label: 'Skewed (delivery times)', draw: (r) => Math.min(-12 * Math.log(1 - r() * 0.9995), 80) },
  uniform: { label: 'Flat (dice-like)', draw: (r) => r() * 60 },
  bimodal: { label: 'Two humps', draw: (r) => (r() < 0.5 ? 12 : 45) + (r() + r() + r() - 1.5) * 8 },
};
function population(shape: Shape, n = 20000, seed = 1) { const r = rng(seed); return Array.from({ length: n }, () => SHAPES[shape].draw(r)); }
const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
const sd = (a: number[]) => { const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length); };
function hist(values: number[], lo: number, hi: number, bins: number) {
  const w = (hi - lo) / bins, c = Array(bins).fill(0);
  values.forEach((v) => { const i = Math.floor((v - lo) / w); if (i >= 0 && i < bins) c[i]++; });
  return c.map((k, i) => ({ x: lo + (i + 0.5) * w, y: k / (values.length * w) })); // density, so it can share an axis with the normal curve
}
const normal = (m: number, s: number) => (x: number) => Math.exp(-((x - m) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));
function drawSamples(pop: number[], n: number, k: number, seed: number) {
  const r = rng(seed);
  return Array.from({ length: k }, () => Array.from({ length: n }, () => pop[Math.floor(r() * pop.length)]));
}

/* ---------- Animate ---------- */
const N = 30;
const CHECKPOINTS = [1, 2, 3, 4, 5, 10, 25, 50, 100, 250, 500, 1000, 2000];

function Animate() {
  const pop = useMemo(() => population('skewed'), []);
  const samples = useMemo(() => drawSamples(pop, N, 2000, 7), [pop]);
  const means = useMemo(() => samples.map(mean), [samples]);
  const mu = mean(pop), sigma = sd(pop), se = sigma / Math.sqrt(N);
  const frames = [...CHECKPOINTS.map((k) => ({ k, curve: false })), { k: 2000, curve: true }];
  const p = useStepPlayer(frames.length, 1400);
  const f = frames[p.i];
  const shown = means.slice(0, f.k);
  const last = samples[f.k - 1];
  const popH = useMemo(() => hist(pop, 0, 80, 40), [pop]);
  const meanH = hist(shown, 0, 40, 40);
  const yMax = Math.max(0.2, ...meanH.map((d) => d.y)) * 1.1;
  const caption =
    f.curve ? <>The red curve is a <b>normal distribution</b> with mean μ = {mu.toFixed(1)} and spread σ/√n = {sigma.toFixed(1)}/√{N} = {se.toFixed(2)}. It fits the histogram of averages almost perfectly, even though the population above is lopsided. <b>That is the Central Limit Theorem.</b></>
      : f.k === 1 ? <>We draw <b>{N} random deliveries</b> (yellow dots) from a very skewed population: most are quick, a few take ages. Their average is the yellow line: <b>{means[0].toFixed(1)} min</b>. That one average becomes the first block in the lower chart.</>
        : f.k <= 5 ? <>Sample #{f.k}: another {N} deliveries, average <b>{means[f.k - 1].toFixed(1)} min</b>. Each sample gives a slightly different average. Notice they all land near the middle, never at the extremes.</>
          : f.k <= 100 ? <>Now <b>{f.k} samples</b>. The averages are piling up into a hump around {mu.toFixed(0)} minutes, and it is already more <b>symmetric</b> than the population above.</>
            : <><b>{f.k} sample averages.</b> The pile is a smooth bell shape. Its centre matches the population mean, and it is much narrower: averages vary far less than individual deliveries.</>;
  return (
    <div>
      <Layout
        main={<>
          <div className="small muted">Population: 20,000 delivery times (minutes)</div>
          <Plot x={[0, 80]} y={[0, 0.07]} height={210} xLabel="delivery time (minutes)" fy={() => ''}>
            {(s) => <>
              <Bars s={s} data={popH} width={2} color={C.grey} />
              {last && <Dots s={s} pts={last.map((v, i) => ({ x: v, y: 0.005 + ((i * 37) % 10) * 0.004 }))} color={C.yellow} r={4} animate={false} />}
              {last && !f.curve && <Seg s={s} x1={mean(last)} x2={mean(last)} y1={0} y2={0.07} color={C.yellow} />}
              <Seg s={s} x1={mu} x2={mu} y1={0} y2={0.07} color={C.green} dash="5 4" />
            </>}
          </Plot>
          <div className="small muted" style={{ marginTop: 8 }}>Averages of {N} deliveries, one block per sample</div>
          <Plot x={[0, 40]} y={[0, yMax]} height={230} xLabel="sample average (minutes)" fy={() => ''}>
            {(s) => <>
              <Bars s={s} data={meanH} width={0.9} color={C.blue} />
              {f.curve && <FnLine s={s} f={normal(mu, se)} color={C.red} width={3} />}
              <Seg s={s} x1={mu} x2={mu} y1={0} y2={yMax} color={C.green} dash="5 4" />
              {f.curve && <Label s={s} x={mu + 2.5} y={yMax * 0.9} color={C.red}>Normal(μ, σ/√n)</Label>}
            </>}
          </Plot>
        </>}
        side={<>
          <Readout items={[
            ['samples drawn', f.k],
            ['population mean μ', mu.toFixed(1), C.green],
            ['mean of averages', mean(shown).toFixed(1), C.blue],
            ['population SD σ', sigma.toFixed(1)],
            ['SD of averages', shown.length > 1 ? sd(shown).toFixed(2) : '–', C.blue],
            ['σ / √n', se.toFixed(2), C.red],
          ]} />
          <Legend items={[['one sample of 30', C.yellow], ['population mean', C.green], ['sample averages', C.blue]]} />
          <p className="small muted" style={{ margin: 0 }}>Watch the last two blue/red numbers converge: the spread of averages equals σ/√n.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caption}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
function Playground() {
  const [shape, setShape] = useState<Shape>('skewed');
  const [n, setN] = useState(30);
  const [k, setK] = useState(1000);
  const [seed, setSeed] = useState(3);
  const pop = useMemo(() => population(shape), [shape]);
  const means = useMemo(() => drawSamples(pop, n, k, seed).map(mean), [pop, n, k, seed]);
  const mu = mean(pop), sigma = sd(pop), se = sigma / Math.sqrt(n);
  const lo = Math.max(0, mu - Math.max(4.5 * se, 3)), hi = mu + Math.max(4.5 * se, 3);
  const h = hist(means, lo, hi, 36);
  const yMax = Math.max(normal(mu, se)(mu), ...h.map((d) => d.y)) * 1.15;
  return (
    <Layout
      main={<>
        <Plot x={[0, 80]} y={[0, 0.08]} height={170} xLabel="population values" fy={() => ''}>
          {(s) => <Bars s={s} data={hist(pop, 0, 80, 40)} width={2} color={C.grey} />}
        </Plot>
        <Plot x={[lo, hi]} y={[0, yMax]} height={280} xLabel={`average of ${n} values`} fy={() => ''}>
          {(s) => <>
            <Bars s={s} data={h} width={(hi - lo) / 36 * 0.9} color={C.blue} />
            <FnLine s={s} f={normal(mu, se)} color={C.red} width={3} />
          </>}
        </Plot>
      </>}
      side={<>
        <Choice label="Population" value={shape} onChange={setShape} options={(Object.keys(SHAPES) as Shape[]).map((v) => ({ value: v, label: SHAPES[v].label }))} />
        <Slider label="sample size n" min={1} max={100} value={n} onChange={setN} />
        <Slider label="samples" min={50} max={5000} step={50} value={k} onChange={setK} />
        <button className="btn" onClick={() => setSeed(seed + 1)}>🎲 Draw new samples</button>
        <Readout items={[['σ (population)', sigma.toFixed(1)], ['SD of averages', sd(means).toFixed(2), C.blue], ['σ / √n', se.toFixed(2), C.red]]} />
        <p className="small muted" style={{ margin: 0 }}>The red curve is the CLT prediction. With n = 1 the "averages" are just single values, so the histogram copies the population. Increase n and watch it become a bell.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'We repeatedly take **samples of 30 deliveries** from a lopsided population (top chart) and record each sample\'s **average** as one block in the lower chart.', steps: [
      { do: 'Press **▶ Step** five times slowly.', notice: 'Each sample of 30 yellow dots gives a slightly different average (the yellow line). Averages never land at the extremes.' },
      { do: 'Press **▶ Play** and let it run to the end.', notice: 'The averages pile up into a symmetric **bell**, even though the population is skewed.' },
      { do: 'Compare the **SD of averages** with **σ / √n** on the right.', notice: 'They match: averages are √30 ≈ 5.5 times less variable than single deliveries.' },
    ] },
    Playground: { what: 'Choose a population shape and a sample size, and see the distribution of sample averages with the Central Limit Theorem\'s prediction (red curve).', steps: [
      { do: 'Set **sample size n = 1**, then slowly drag it to 5, 10 and 30.', notice: 'At n = 1 the histogram copies the population. By n ≈ 30 it is a bell for every shape.' },
      { do: 'Switch to **Two humps**.', notice: 'Even a two-humped population produces bell-shaped averages once n is large enough.' },
      { do: 'Change n from 25 to 100.', notice: 'The bell gets **twice as narrow** (σ/√n): four times the data, twice the precision.' },
    ] },
  },
};
export default anim;
