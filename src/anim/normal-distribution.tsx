// Normal distribution: a bell built from simulated heights, the 68–95–99.7 areas, z-scores as a universal ruler,
// and what sliding μ and σ does. Running example: adult heights, mean 170 cm, SD 7 cm (g-stats1).
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Bars, FnLine, Seg, Label, Arrow, Caption, Readout, Slider, Toggle, Layout, Legend, useStepPlayer, PlayerControls, rng, C } from '../viz/kit';
import { hist, normPdf, normCdf, normalSample, pct } from './_stats1-helpers';

/* ---------- pure helpers ---------- */
const MU = 170, SIG = 7;
const BAND_COL = [C.blue, C.teal, C.purple];
const X: [number, number] = [135, 205];
interface Frame { k: number; mu: number; sd: number; curve: boolean; band: number; cut?: number; zArrows?: boolean; zPlot: boolean; cap: (sim: number[]) => JSX.Element }

const within = (a: number[], lo: number, hi: number) => a.filter((v) => v >= lo && v <= hi).length / Math.max(a.length, 1);

function makeFrames(): Frame[] {
  const tail = (mu: number, sd: number) => 1 - normCdf(184, mu, sd);
  const base = { mu: MU, sd: SIG, curve: true, band: 0, zPlot: true, k: 2000 };
  return [
    { ...base, k: 40, curve: false, zPlot: false, cap: () => <>We measure the heights of <b>40 men</b>. Each one drops into a bar of the histogram (2 cm wide). With so few people the shape is ragged.</> },
    { ...base, k: 300, curve: false, zPlot: false, cap: () => <><b>300 men.</b> A shape is emerging: most heights cluster in the middle, fewer and fewer towards the extremes, and the two sides look alike.</> },
    { ...base, k: 2000, curve: false, zPlot: false, cap: (a) => <><b>2,000 men.</b> A smooth, symmetric hump. The sample mean is {(a.reduce((s, v) => s + v, 0) / a.length).toFixed(1)} cm. Many natural measurements, built from lots of small independent effects, look like this.</> },
    { ...base, cap: () => <>The yellow <b>bell curve</b> is the normal distribution with mean μ = 170 cm and SD σ = 7 cm. Only those <b>two numbers</b> describe the whole shape. Below it, the same bell measured in SDs: the <b>standard normal</b>.</> },
    { ...base, band: 1, cap: (a) => <>Shade one SD either side: <b>163 to 177 cm</b>. The theory says <b>68.3%</b> of the area lies here; in our 2,000 simulated men it is {pct(within(a, 163, 177))}. About <b>two out of three</b> men.</> },
    { ...base, band: 2, cap: (a) => <>Two SDs either side, <b>156 to 184 cm</b>, holds <b>95.4%</b> of the area (simulation: {pct(within(a, 156, 184))}). Only about 1 man in 22 falls outside.</> },
    { ...base, band: 3, cap: (a) => <>Three SDs, <b>149 to 191 cm</b>: <b>99.7%</b> (simulation: {pct(within(a, 149, 191))}). This is the <b>68–95–99.7 rule</b>: beyond ±3σ the bell is almost flat on the floor.</> },
    { ...base, cut: 184, cap: () => <>A car designer asks: what share of men are <b>taller than 184 cm</b>? We need the area of the shaded right tail.</> },
    { ...base, cut: 184, zArrows: true, cap: () => <>Measure the distance in SD-steps: from 170 to 184 is 14 cm, which is <b>two steps of 7 cm</b>. That count is the <b>z-score</b>: z = (184 − 170) / 7 = <b>2</b>.</> },
    { ...base, cut: 184, zArrows: true, cap: () => <>On the standard normal (bottom), the area beyond <b>z = 2</b> is <b>{pct(tail(MU, SIG), 2)}</b>, the same as the top tail. So about <b>23 men in 1,000</b> are taller than 184 cm. One table (or <code>norm.cdf</code>) serves every bell curve.</> },
    { ...base, mu: 175, cut: 184, cap: () => <>Slide the mean to <b>μ = 175 cm</b> (another population). The bell moves but keeps its shape. Now 184 cm is only z = 9/7 = <b>1.29</b> SDs above, and the tail grows to <b>{pct(tail(175, SIG))}</b>.</> },
    { ...base, sd: 4, cut: 184, cap: () => <>Back to μ = 170 but with <b>σ = 4 cm</b>: a narrower, <b>taller</b> bell (the area must stay 1). 184 cm is now z = 3.5 SDs out and the tail almost vanishes: <b>{pct(tail(MU, 4), 3)}</b>.</> },
    { ...base, sd: 10, cut: 184, cap: () => <>With <b>σ = 10 cm</b> the bell is wide and flat, z = 1.4 and the tail is <b>{pct(tail(MU, 10))}</b>. <b>Same mean, different spread, very different extremes</b>: that is why quality engineers fight variation.</> },
    { ...base, band: 2, cut: 184, cap: () => <><b>Takeaway:</b> every normal curve is the same bell, shifted by μ and stretched by σ. Convert any value to a <b>z-score</b> and the areas are universal: 68% within ±1, 95% within ±2, 99.7% within ±3.</> },
  ];
}

function StdNormal({ lo, hi, bands, height = 170 }: { lo?: number; hi?: number; bands: number; height?: number }) {
  return (
    <Plot x={[-4, 4]} y={[0, 0.44]} height={height} xLabel="z = (height − μ) / σ   (standard deviations from the mean)" fy={() => ''} yTicks={0}>
      {(s) => <>
        {[3, 2, 1].filter((b) => b <= bands).map((b) => <FnLine key={b} s={s} f={(x) => normPdf(x)} from={-b} to={b} color={BAND_COL[b - 1]} width={0} fill={BAND_COL[b - 1]} />)}
        {lo !== undefined && hi !== undefined && hi > lo && [0, 1].map((j) => <FnLine key={j} s={s} f={(x) => normPdf(x)} from={Math.max(-4, lo)} to={Math.min(4, hi)} color={C.red} width={0} fill={C.red} />)}
        {lo !== undefined && hi !== undefined && hi > lo && <Label s={s} x={Math.min(Math.max((Math.max(-4, lo) + Math.min(4, hi)) / 2, -2.6), 2.6)} y={0.41} color={C.red} size={12} anchor="middle">{lo > -4 ? `z = ${lo.toFixed(2)}` : ''}{lo > -4 && hi < 4 ? ' to ' : ''}{hi < 4 ? `z = ${hi.toFixed(2)}` : ''} · area {pct(normCdf(hi) - normCdf(lo), 2)}</Label>}
        <FnLine s={s} f={(x) => normPdf(x)} color={C.yellow} width={2} />
        {lo !== undefined && lo > -4 && <Seg s={s} x1={lo} x2={lo} y1={0} y2={0.42} color={C.red} dash="4 3" />}
        {hi !== undefined && hi < 4 && <Seg s={s} x1={hi} x2={hi} y1={0} y2={0.42} color={C.red} dash="4 3" />}
      </>}
    </Plot>
  );
}

/* ---------- Animate ---------- */
function Animate() {
  const sim = useMemo(() => normalSample(rng(21), 2000, MU, SIG), []);
  const frames = useMemo(makeFrames, []);
  const p = useStepPlayer(frames.length, 2600);
  const f = frames[p.i];
  const shown = sim.slice(0, f.k);
  const h = hist(shown, X[0], X[1], 35);
  const showHist = f.mu === MU && f.sd === SIG && f.cut === undefined;
  const yMax = 0.115;
  const pdf = (x: number) => normPdf(x, f.mu, f.sd);
  const zCut = f.cut !== undefined ? (f.cut - f.mu) / f.sd : undefined;
  return (
    <div>
      <Layout
        main={<>
          <div className="small muted">Heights of adult men (cm)</div>
          <Plot x={X} y={[0, yMax]} height={280} xLabel="height (cm)" yLabel="density" fy={() => ''} yTicks={0}>
            {(s) => <>
              {showHist && <Bars s={s} data={h} width={1.8} color={f.curve ? C.grey : C.blue} />}
              {f.curve && [3, 2, 1].filter((b) => b <= f.band).map((b) => <FnLine key={b} s={s} f={pdf} from={f.mu - b * f.sd} to={f.mu + b * f.sd} color={BAND_COL[b - 1]} width={0} fill={BAND_COL[b - 1]} />)}
              {f.curve && f.cut !== undefined && [0, 1].map((j) => <FnLine key={j} s={s} f={pdf} from={f.cut!} to={X[1]} color={C.red} width={0} fill={C.red} />)}
              {f.curve && <FnLine s={s} f={pdf} color={C.yellow} width={3} />}
              {f.curve && <Seg s={s} x1={f.mu} x2={f.mu} y1={0} y2={yMax * 0.97} color={C.green} dash="5 4" />}
              {f.curve && <Label s={s} x={f.mu + 0.6} y={yMax * 0.92} color={C.green} size={12}>μ = {f.mu}</Label>}
              {f.band > 0 && [-f.band, f.band].map((k) => <Label key={k} s={s} x={f.mu + k * f.sd} y={pdf(f.mu + k * f.sd) + 0.006} size={12} anchor="middle" color={BAND_COL[f.band - 1]}>{(k > 0 ? '+' : '−') + Math.abs(k)}σ = {f.mu + k * f.sd}</Label>)}
              {f.cut !== undefined && <Seg s={s} x1={f.cut} x2={f.cut} y1={0} y2={yMax * 0.75} color={C.red} width={2} />}
              {f.cut !== undefined && <Label s={s} x={f.cut + 0.6} y={yMax * 0.7} color={C.red} size={12}>184 cm: {pct(1 - normCdf(zCut!), zCut! > 3 ? 3 : 1)} taller</Label>}
              {f.zArrows && <>
                <Arrow s={s} x1={MU} y1={0.012} x2={MU + SIG} y2={0.012} color={C.gold} label="+1σ" />
                <Arrow s={s} x1={MU + SIG} y1={0.024} x2={MU + 2 * SIG} y2={0.024} color={C.gold} label="+2σ" />
              </>}
            </>}
          </Plot>
          {f.zPlot && <StdNormal bands={f.band} lo={zCut} hi={zCut !== undefined ? 4.5 : undefined} />}
        </>}
        side={<>
          <Readout items={[
            ['men simulated', showHist ? f.k : '–'],
            ['mean μ', `${f.mu} cm`, C.green],
            ['SD σ', `${f.sd} cm`],
            ['z of 184 cm', zCut !== undefined ? zCut.toFixed(2) : '–', C.red],
            ['P(taller than 184)', zCut !== undefined ? pct(1 - normCdf(zCut), zCut > 3 ? 3 : 2) : '–', C.red],
            ['peak height', (1 / (f.sd * Math.sqrt(2 * Math.PI))).toFixed(3)],
          ]} />
          <Legend items={[['simulated heights', C.blue], ['normal curve', C.yellow], ['±1σ', C.blue], ['±2σ', C.teal], ['±3σ', C.purple], ['tail beyond 184 cm', C.red]]} />
          <p className="small muted" style={{ margin: 0 }}>The curve's height is a density, not a probability. Probabilities are <b>areas</b>.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{f.cap(shown)}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
function Playground() {
  const [mu, setMu] = useState(170);
  const [sd, setSd] = useState(7);
  const [a, setA] = useState(160);
  const [b, setB] = useState(184);
  const [rule, setRule] = useState(false);
  const lo = Math.min(a, b), hi = Math.max(a, b);
  const za = (lo - mu) / sd, zb = (hi - mu) / sd;
  const P = normCdf(zb) - normCdf(za);
  const yMax = Math.max(0.06, normPdf(mu, mu, sd) * 1.12);
  const pdf = (x: number) => normPdf(x, mu, sd);
  return (
    <Layout
      main={<>
        <Plot x={[120, 220]} y={[0, yMax]} height={290} xLabel="height (cm)" yLabel="density" fy={() => ''} yTicks={0}>
          {(s) => <>
            {rule && [3, 2, 1].map((k) => <FnLine key={k} s={s} f={pdf} from={mu - k * sd} to={mu + k * sd} color={BAND_COL[k - 1]} width={0} fill={BAND_COL[k - 1]} />)}
            <FnLine s={s} f={pdf} from={lo} to={hi} color={C.red} width={0} fill={C.red} />
            <FnLine s={s} f={pdf} color={C.yellow} width={3} />
            <Seg s={s} x1={mu} x2={mu} y1={0} y2={yMax} color={C.green} dash="5 4" />
            <Seg s={s} x1={lo} x2={lo} y1={0} y2={yMax * 0.8} color={C.red} />
            <Seg s={s} x1={hi} x2={hi} y1={0} y2={yMax * 0.8} color={C.red} />
            <Label s={s} x={(lo + hi) / 2} y={yMax * 0.86} color={C.red} anchor="middle">area = {pct(P, 2)}</Label>
          </>}
        </Plot>
        <StdNormal bands={rule ? 3 : 0} lo={za} hi={zb} height={180} />
        <Legend items={[['normal curve', C.yellow], ['your range (area = probability)', C.red], ['mean μ', C.green]]} />
      </>}
      side={<>
        <Slider label="mean μ (cm)" min={150} max={190} value={mu} onChange={setMu} />
        <Slider label="SD σ (cm)" min={2} max={15} step={0.5} value={sd} onChange={setSd} />
        <Slider label="from a (cm)" min={120} max={220} value={a} onChange={setA} />
        <Slider label="to b (cm)" min={120} max={220} value={b} onChange={setB} />
        <Toggle label="show 68–95–99.7 bands" value={rule} onChange={setRule} />
        <Readout items={[['z of a', za.toFixed(2), C.red], ['z of b', zb.toFixed(2), C.red], ['P(a < X < b)', pct(P, 2), C.red], ['per 1,000 men', (P * 1000).toFixed(0)]]} />
        <p className="small muted" style={{ margin: 0 }}>The red area on the top curve and on the standard (z) curve below are always identical: only the z-scores matter.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Simulated heights of men pile up into a **bell curve** (μ = 170 cm, σ = 7 cm). We shade the **68–95–99.7** areas, use a **z-score** to find the share taller than 184 cm, then slide μ and σ.', steps: [
      { do: 'Press **▶ Play** and watch the first three frames.', notice: 'The histogram becomes smoother and more symmetric as more men are measured.' },
      { do: 'Step through the shaded bands (frames 5 to 7).', notice: 'Simulated shares match 68.3%, 95.4% and 99.7% closely.' },
      { do: 'Watch frames 9 to 13 (the 184 cm question).', notice: 'z = 2 gives a 2.3% tail; moving μ or shrinking σ changes that tail dramatically.' },
    ] },
    Playground: { what: 'Set the mean and SD of the heights and pick a range **a to b**. The red area is the probability, shown both on the cm scale and on the standard (z) scale.', steps: [
      { do: 'Set a = 163 and b = 177 (with μ = 170, σ = 7).', notice: 'The area is about 68%: one SD each side.' },
      { do: 'Keep a and b fixed and drag **σ** from 3 to 15.', notice: 'The same range holds almost everything when σ is small and only a fraction when σ is large.' },
      { do: 'Change **μ** and the range together by the same amount.', notice: 'The z-scores and the area stay the same: shifting everything does not change probabilities.' },
    ] },
  },
};
export default anim;
