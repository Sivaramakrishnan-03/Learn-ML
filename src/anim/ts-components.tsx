// Time series components: build a monthly series layer by layer (trend + seasonality + noise), decompose it back
// with a centred 12-month moving average, and read the seasonal lag off the autocorrelation function (ACF).
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Bars, Dots, Seg, Label, Region, Caption, Readout, Slider, Choice, Layout, Legend, useStepPlayer, PlayerControls, C, Scales } from '../viz/kit';
import { monthlySeries, decompose, acf, pathD, mean, sd, variance, MONTHS, Pt } from './_ts-helpers';

/* ---------- pure helpers ---------- */
const N = 60;
const X = (t: number) => 2022 + t / 12;               // month index → decimal year for the x-axis
const fYear = (v: number) => (Math.abs(v - Math.round(v)) < 1e-6 ? String(Math.round(v)) : '');
const fMonth = (v: number) => MONTHS[v - 1] ?? '';
const seriesPts = (ys: number[]) => ys.map((y, t) => ({ x: X(t), y }));
const sgn = (v: number) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1);

function Line({ s, pts, color, width = 2.5, dash, opacity = 1 }: { s: Scales; pts: Pt[]; color: string; width?: number; dash?: string; opacity?: number }) {
  return <path d={pathD(s.sx, s.sy, pts)} fill="none" stroke={color} strokeWidth={width} strokeDasharray={dash} opacity={opacity} strokeLinejoin="round" />;
}
/** ACF bar chart with ±1.96/√n significance band; lags 12 and 24 highlighted. */
function AcfPlot({ r, n, height = 200, title }: { r: number[]; n: number; height?: number; title: string }) {
  const band = 1.96 / Math.sqrt(n);
  const lo = Math.min(-0.6, ...r.map((v) => v - 0.05));
  return <>
    <div className="small muted" style={{ marginTop: 6 }}>{title}</div>
    <Plot x={[0.3, r.length + 0.7]} y={[lo, 1]} height={height} xLabel="lag k (months apart)" yLabel="autocorrelation r_k" xTicks={12}>
      {(s) => <>
        <Region s={s} x0={0.3} x1={r.length + 0.7} y0={-band} y1={band} color={C.grey} opacity={0.25} />
        <Seg s={s} x1={0.3} x2={r.length + 0.7} y1={0} y2={0} color={C.muted} width={1} />
        <Bars s={s} data={r.map((v, i) => ({ x: i + 1, y: v }))} width={0.6} color={(i) => (r[i] < 0 ? C.purple : C.blue)} highlight={(i) => (i + 1) % 12 === 0} />
        {r.length >= 12 && <Label s={s} x={12} y={Math.max(r[11], 0) + 0.08} anchor="middle" color={C.gold} size={12}>lag 12</Label>}
      </>}
    </Plot>
  </>;
}

/* ---------- Animate ---------- */
type Stage = 'trend' | 'season' | 'peaks' | 'noise' | 'observed' | 'win0' | 'win1' | 'win2' | 'trendEst' | 'seasonal' | 'remainder' | 'acfDetr' | 'acfRem';
const STAGES: Stage[] = ['trend', 'season', 'peaks', 'noise', 'observed', 'win0', 'win1', 'win2', 'trendEst', 'seasonal', 'remainder', 'acfDetr', 'acfRem'];
const WIN_T = [12, 27, 41];

function Animate() {
  const sim = useMemo(() => monthlySeries({ n: N, seed: 8 }), []);
  const dec = useMemo(() => decompose(sim.y), [sim]);
  const acfRaw = useMemo(() => acf(sim.y, 24), [sim]);
  const acfDetr = useMemo(() => acf(dec.detr.filter(isFinite), 24), [dec]);
  const acfRem = useMemo(() => acf(dec.rem.filter(isFinite), 24), [dec]);
  const p = useStepPlayer(STAGES.length, 2600);
  const st = STAGES[p.i];
  const k = p.i;
  const built = k >= 3;
  const decomposing = k >= 5;
  const winIdx = st === 'win0' ? 0 : st === 'win1' ? 1 : st === 'win2' ? 2 : -1;
  const wt = winIdx >= 0 ? WIN_T[winIdx] : 0;
  const winVals = winIdx >= 0 ? Array.from({ length: 13 }, (_, j) => sim.y[wt - 6 + j]) : [];
  const trendMA = dec.trend;
  const fitted = sim.y.map((_, t) => trendMA[t] + dec.season[t]);
  const remSd = sd(dec.rem.filter(isFinite));
  const octEst = dec.seasIdx[9];
  const validTrend = trendMA.map((v, t) => ({ v, t })).filter((d) => isFinite(d.v));
  const slopeEst = (validTrend[validTrend.length - 1].v - validTrend[0].v) / (validTrend[validTrend.length - 1].t - validTrend[0].t);
  const octs = [9, 21, 33, 45, 57];

  const caption: Record<Stage, JSX.Element> = {
    trend: <>Start with a <b>trend</b>: a sweets maker in Chennai whose monthly sales grow steadily from ₹100 lakh by about <b>₹1.2 lakh every month</b>. On its own the trend is a smooth, boring ramp.</>,
    season: <>Add <b>seasonality</b> (purple, lower chart): the same 12-month pattern every year, from −₹15 lakh in February to <b>+₹22 lakh in October</b>. Top: trend + season. The ramp now wiggles, but the wiggle repeats exactly.</>,
    peaks: <>The gold dots are the five <b>Octobers</b> (Diwali). They sit on the same position in every cycle and climb with the trend. Peaks exactly <b>12 months apart</b> are the fingerprint of monthly seasonality.</>,
    noise: <>Finally add <b>noise</b> (red, lower chart): random month-to-month surprises with SD ≈ ₹4 lakh (weather, a late delivery, one big order). The blue line is the <b>observed series</b>: trend + season + noise.</>,
    observed: <>Now forget how it was built: a planner only sees the blue line. Its raw ACF (lower chart) is <b>positive for many lags and fades slowly</b>, because the trend makes every month resemble its neighbours (r₁ = {acfRaw[0].toFixed(2)}). The seasonal bump at lag 12 is there, but blurred by the trend. So we take it apart.</>,
    win0: <>Step 1, estimate the trend. Put a <b>12-month window</b> around {MONTHS[wt % 12]} {2022 + Math.floor(wt / 12)} (gold box). The window holds exactly one of every month (lower chart), so the high Octobers and low Februaries <b>cancel out</b>. Their average, <b>₹{trendMA[wt].toFixed(1)} lakh</b>, is the trend at the centre.</>,
    win1: <>Slide the window to {MONTHS[wt % 12]} {2022 + Math.floor(wt / 12)}: the average of its 12 months is <b>₹{trendMA[wt].toFixed(1)} lakh</b>. (The two end months get half weight, so the window stays centred: this is the classic "2×12" moving average.)</>,
    win2: <>And at {MONTHS[wt % 12]} {2022 + Math.floor(wt / 12)}: <b>₹{trendMA[wt].toFixed(1)} lakh</b>. Seasonal ups and downs always cancel inside a full year, and most noise cancels too. What is left is the slow movement: the trend.</>,
    trendEst: <>Do this at every month and you get the yellow <b>trend estimate</b>, very close to the true green trend (slope ≈ <b>{slopeEst.toFixed(2)}</b> vs 1.2 per month). It is missing for the first and last 6 months: the window would run off the data. Lower chart: <b>observed − trend</b> leaves only season + noise.</>,
    seasonal: <>Step 2, estimate the season: average the detrended values of each calendar month across the years. Purple bars are the estimates, green dots the truth. October comes out at <b>{sgn(octEst)}</b> (truth +22). Top: trend + season (yellow) already tracks the data closely.</>,
    remainder: <>Step 3: whatever is left, <b>observed − trend − season</b>, is the remainder (red). Its SD is <b>₹{remSd.toFixed(1)} lakh</b>, close to the true noise SD of 4. No pattern is visible: we have recovered all three layers.</>,
    acfDetr: <>Now redo the ACF on the <b>detrended</b> series. A tall bar appears at <b>lag 12: r = {acfDetr[11].toFixed(2)}</b> (each month looks like the same month last year, gold links on top) while lags of 3–4 and 8–9 months are negative (a festive month compared with a slack one). <b>The ACF reveals the season length.</b></>,
    acfRem: <>Finally the ACF of the <b>remainder</b>: every bar is small and almost all sit inside the grey band (±1.96/√n). Remainder ≈ <b>white noise</b>: nothing predictable is left. A good forecasting model should leave exactly this behind.</>,
  };

  const bottomTitle: Record<Stage, string> = {
    trend: 'Layer 1: trend (₹ lakh)', season: 'Layer 2: seasonal pattern (₹ lakh, added to the trend)', peaks: 'Layer 2: seasonal pattern (₹ lakh, added to the trend)', noise: 'Layer 3: random noise (₹ lakh)',
    observed: 'ACF of the raw observed series', win0: 'The 13 values inside the window (end months half weight) and their average', win1: 'The 13 values inside the window (end months half weight) and their average', win2: 'The 13 values inside the window (end months half weight) and their average',
    trendEst: 'Observed − trend estimate = season + noise (₹ lakh)', seasonal: 'Estimated seasonal effect per calendar month (₹ lakh)', remainder: 'Remainder = observed − trend − season (₹ lakh)',
    acfDetr: 'ACF of the detrended series', acfRem: 'ACF of the remainder',
  };

  const top = (
    <Plot x={[2022, 2027]} y={[60, 220]} height={260} xLabel="month" yLabel="sales (₹ lakh)" fx={fYear}>
      {(s) => <>
        {winIdx >= 0 && <Region s={s} x0={X(wt - 6)} x1={X(wt + 6)} color={C.gold} opacity={0.12} stroke={C.gold} />}
        {(!built || k >= 8) && <Line s={s} pts={seriesPts(sim.trend)} color={C.green} dash={k >= 1 ? '6 4' : undefined} width={k >= 1 ? 2 : 3} />}
        {(st === 'season' || st === 'peaks') && <Line s={s} pts={seriesPts(sim.trend.map((v, t) => v + sim.season[t]))} color={C.purple} width={2.5} />}
        {st === 'peaks' && <Dots s={s} pts={octs.map((t) => ({ x: X(t), y: sim.trend[t] + sim.season[t] }))} color={C.gold} r={7} animate={false} />}
        {built && <Line s={s} pts={seriesPts(sim.y)} color={C.blue} width={k >= 9 ? 1.5 : 2} opacity={k >= 9 ? 0.8 : 1} />}
        {built && <Dots s={s} pts={seriesPts(sim.y)} r={k >= 9 ? 2.5 : 3.2} animate={false} />}
        {winIdx >= 0 && <Dots s={s} pts={[{ x: X(wt), y: trendMA[wt] }]} color={C.yellow} r={7} />}
        {k >= 8 && <Line s={s} pts={seriesPts(trendMA)} color={C.yellow} width={3} />}
        {k >= 9 && <Line s={s} pts={seriesPts(fitted)} color={C.yellow} width={1.8} dash="3 3" />}
        {st === 'acfDetr' && octs.slice(0, 4).map((t) => <Seg key={t} s={s} x1={X(t)} y1={sim.y[t] + 6} x2={X(t + 12)} y2={sim.y[t + 12] + 6} color={C.gold} width={2} />)}
        {st === 'acfDetr' && octs.map((t) => <Dots key={t} s={s} pts={[{ x: X(t), y: sim.y[t] }]} color={C.gold} r={5} animate={false} />)}
        {k === 0 && <Label s={s} x={2024.6} y={sim.trend[31] - 14} color={C.green}>slope +1.2 / month</Label>}
      </>}
    </Plot>
  );

  let bottom: JSX.Element;
  if (st === 'trend') bottom = <Plot x={[2022, 2027]} y={[60, 220]} height={200} xLabel="month" yLabel="₹ lakh" fx={fYear}>{(s) => <Line s={s} pts={seriesPts(sim.trend)} color={C.green} width={3} />}</Plot>;
  else if (st === 'season' || st === 'peaks') bottom = <Plot x={[2022, 2027]} y={[-30, 30]} height={200} xLabel="month" yLabel="₹ lakh" fx={fYear}>{(s) => <>
    <Seg s={s} x1={2022} x2={2027} y1={0} y2={0} color={C.muted} width={1} />
    <Line s={s} pts={seriesPts(sim.season)} color={C.purple} width={2.5} />
    {st === 'peaks' && <Dots s={s} pts={octs.map((t) => ({ x: X(t), y: sim.season[t] }))} color={C.gold} r={6} animate={false} />}
    {st === 'peaks' && <Label s={s} x={X(9) + 0.05} y={25} color={C.gold} size={12}>Oct +22</Label>}
  </>}</Plot>;
  else if (st === 'noise') bottom = <Plot x={[2022, 2027]} y={[-15, 15]} height={200} xLabel="month" yLabel="₹ lakh" fx={fYear}>{(s) => <Bars s={s} data={sim.rem.map((v, t) => ({ x: X(t), y: v }))} width={0.06} color={C.red} />}</Plot>;
  else if (st === 'observed') bottom = <AcfPlot r={acfRaw} n={N} title={bottomTitle[st]} />;
  else if (winIdx >= 0) bottom = <Plot x={[0.3, 13.7]} y={[0, 200]} height={200} xLabel="month inside the window" yLabel="₹ lakh" fx={() => ''} xTicks={13}>{(s) => <>
    <Bars s={s} data={winVals.map((v, j) => ({ x: j + 1, y: v }))} width={0.7} color={(j) => (j === 0 || j === 12 ? C.grey : (wt - 6 + j) % 12 === 9 ? C.gold : C.blue)} />
    <Seg s={s} x1={0.3} x2={13.7} y1={trendMA[wt]} y2={trendMA[wt]} color={C.yellow} width={3} />
    <Label s={s} x={13.6} y={trendMA[wt] + 8} anchor="end" color={C.yellow}>average ₹{trendMA[wt].toFixed(1)}</Label>
    {winVals.map((_, j) => <Label key={j} s={s} x={j + 1} y={6} anchor="middle" size={11} color={C.bg}>{MONTHS[(wt - 6 + j) % 12]}</Label>)}
  </>}</Plot>;
  else if (st === 'trendEst') bottom = <Plot x={[2022, 2027]} y={[-30, 35]} height={200} xLabel="month" yLabel="₹ lakh" fx={fYear}>{(s) => <>
    <Seg s={s} x1={2022} x2={2027} y1={0} y2={0} color={C.muted} width={1} />
    <Line s={s} pts={seriesPts(dec.detr)} color={C.blue} width={2} />
    <Dots s={s} pts={seriesPts(dec.detr).filter((d) => isFinite(d.y))} r={3} animate={false} />
  </>}</Plot>;
  else if (st === 'seasonal') bottom = <Plot x={[0.3, 12.7]} y={[-25, 30]} height={200} xLabel="calendar month" yLabel="seasonal effect (₹ lakh)" fx={fMonth} xTicks={12}>{(s) => <>
    <Seg s={s} x1={0.3} x2={12.7} y1={0} y2={0} color={C.muted} width={1} />
    <Bars s={s} data={dec.seasIdx.map((v, j) => ({ x: j + 1, y: v }))} width={0.6} color={C.purple} highlight={(j) => j === 9} />
    <Dots s={s} pts={sim.season.slice(0, 12).map((v, j) => ({ x: j + 1, y: v }))} color={C.green} r={5} animate={false} />
  </>}</Plot>;
  else if (st === 'remainder') bottom = <Plot x={[2022, 2027]} y={[-15, 15]} height={200} xLabel="month" yLabel="₹ lakh" fx={fYear}>{(s) => <Bars s={s} data={dec.rem.map((v, t) => ({ x: X(t), y: isFinite(v) ? v : 0 }))} width={0.06} color={C.red} />}</Plot>;
  else bottom = <AcfPlot r={st === 'acfDetr' ? acfDetr : acfRem} n={N - 12} title={bottomTitle[st]} />;
  const isAcf = st === 'observed' || st === 'acfDetr' || st === 'acfRem';

  const legend: [string, string][] = !built
    ? [['trend', C.green], ['seasonal pattern', C.purple], ...(st === 'peaks' ? [['Octobers', C.gold] as [string, string]] : [])]
    : k === 3 ? [['observed sales', C.blue], ['noise', C.red]]
      : k < 8 ? [['observed sales', C.blue], ['moving-average trend', C.yellow], ...(isAcf ? [['lag 12', C.gold] as [string, string]] : [])]
        : [['observed sales', C.blue], ['true trend', C.green], ['estimated trend / fit', C.yellow], ...(k === 9 ? [['seasonal effect', C.purple] as [string, string]] : []), ...(k === 10 ? [['remainder', C.red] as [string, string]] : []), ...(k >= 11 ? [['lag 12 / Octobers', C.gold] as [string, string]] : [])];

  return (
    <div>
      <Layout
        main={<>
          <div className="small muted">{built ? 'Monthly sales of a sweets maker, Jan 2022 – Dec 2026' : 'Building the series one layer at a time'}</div>
          {top}
          {!isAcf && <div className="small muted" style={{ marginTop: 6 }}>{bottomTitle[st]}</div>}
          {bottom}
        </>}
        side={<>
          <div className="small muted">{decomposing ? 'Phase 2: decompose it back' : 'Phase 1: build the series'}</div>
          <Readout items={[
            ['trend slope / month', k >= 8 ? `${slopeEst.toFixed(2)} (true 1.2)` : '1.2', C.green],
            ['October effect', k >= 9 ? `${sgn(octEst)} (true +22)` : '+22', C.purple],
            ['noise SD', k >= 10 ? `${remSd.toFixed(1)} (true 4)` : '4', C.red],
            ['ACF at lag 12', isAcf ? (st === 'observed' ? acfRaw : st === 'acfDetr' ? acfDetr : acfRem)[11].toFixed(2) : '–', C.gold],
          ]} />
          <Legend items={legend} />
          <p className="small muted" style={{ margin: 0 }}>Additive model: <b>y = trend + season + remainder</b>. Decomposition runs the recipe backwards: moving average → trend, monthly averages → season, leftovers → remainder.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caption[st]}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
type AcfOn = 'raw' | 'detr' | 'rem';
function Playground() {
  const [slope, setSlope] = useState(1.2);
  const [amp, setAmp] = useState(1);
  const [noise, setNoise] = useState(4);
  const [on, setOn] = useState<AcfOn>('detr');
  const [seed, setSeed] = useState(8);
  const sim = useMemo(() => monthlySeries({ n: N, slope, amp, noise, seed }), [slope, amp, noise, seed]);
  const dec = useMemo(() => decompose(sim.y), [sim]);
  const src = on === 'raw' ? sim.y : on === 'detr' ? dec.detr.filter(isFinite) : dec.rem.filter(isFinite);
  const r = useMemo(() => acf(src, 24), [src]);
  const rem = dec.rem.filter(isFinite);
  const tr = dec.trend.filter(isFinite);
  const se = dec.season.filter((_, t) => isFinite(dec.trend[t]));
  const fT = Math.max(0, 1 - variance(rem) / Math.max(1e-9, variance(tr.map((v, i) => v + rem[i]))));
  const fS = Math.max(0, 1 - variance(rem) / Math.max(1e-9, variance(se.map((v, i) => v + rem[i]))));
  const lo = Math.min(...sim.y) - 10, hi = Math.max(...sim.y) + 10;
  const yAbs = Math.max(10, ...dec.seasIdx.map(Math.abs), ...sim.season.slice(0, 12).map(Math.abs)) * 1.2;
  return (
    <Layout
      main={<>
        <Plot x={[2022, 2027]} y={[Math.floor(lo), Math.ceil(hi)]} height={230} xLabel="month" yLabel="sales (₹ lakh)" fx={fYear}>
          {(s) => <>
            <Line s={s} pts={seriesPts(sim.y)} color={C.blue} width={1.8} />
            <Dots s={s} pts={seriesPts(sim.y)} r={2.5} animate={false} />
            <Line s={s} pts={seriesPts(sim.trend)} color={C.green} width={2} dash="6 4" />
            <Line s={s} pts={seriesPts(dec.trend)} color={C.yellow} width={3} />
          </>}
        </Plot>
        <div className="small muted" style={{ marginTop: 6 }}>Estimated seasonal effect per month (purple) vs the truth (green dots)</div>
        <Plot x={[0.3, 12.7]} y={[-yAbs, yAbs]} height={150} xLabel="calendar month" yLabel="₹ lakh" fx={fMonth} xTicks={12}>
          {(s) => <>
            <Seg s={s} x1={0.3} x2={12.7} y1={0} y2={0} color={C.muted} width={1} />
            <Bars s={s} data={dec.seasIdx.map((v, j) => ({ x: j + 1, y: v }))} width={0.6} color={C.purple} />
            <Dots s={s} pts={sim.season.slice(0, 12).map((v, j) => ({ x: j + 1, y: v }))} color={C.green} r={4.5} animate={false} />
          </>}
        </Plot>
        <AcfPlot r={r} n={src.length} height={190} title={`ACF of the ${on === 'raw' ? 'raw series' : on === 'detr' ? 'detrended series' : 'remainder'}`} />
      </>}
      side={<>
        <Slider label="trend slope" min={-2} max={3} step={0.1} value={slope} onChange={setSlope} format={(v) => v.toFixed(1)} />
        <Slider label="season strength" min={0} max={2} step={0.1} value={amp} onChange={setAmp} format={(v) => v.toFixed(1) + '×'} />
        <Slider label="noise SD" min={0} max={20} step={0.5} value={noise} onChange={setNoise} format={(v) => v.toFixed(1)} />
        <Choice label="ACF of" value={on} onChange={setOn} options={[{ value: 'raw', label: 'raw' }, { value: 'detr', label: 'detrended' }, { value: 'rem', label: 'remainder' }]} />
        <button className="btn" onClick={() => setSeed(seed + 1)}>🎲 New noise</button>
        <Readout items={[
          ['trend strength', fT.toFixed(2), C.yellow],
          ['season strength', fS.toFixed(2), C.purple],
          ['ACF lag 12', r[11].toFixed(2), C.gold],
          ['remainder SD', sd(rem).toFixed(1), C.red],
          ['mean of remainder', mean(rem).toFixed(2), C.red],
        ]} />
        <Legend items={[['observed', C.blue], ['true trend', C.green], ['moving-average trend', C.yellow]]} />
        <p className="small muted" style={{ margin: 0 }}>Strength = 1 − var(remainder) / var(component + remainder): near 1 means the component dominates the noise, near 0 means it is buried.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'First we **build** five years of monthly sweets sales from three layers (trend, Diwali seasonality, noise). Then we pretend we only see the result and **decompose** it back, finishing with the **autocorrelation function** (ACF) that exposes the 12-month cycle.', steps: [
      { do: 'Press **▶ Step** through the first four frames.', notice: 'Each layer is shown on its own in the lower chart and added to the top chart. October peaks sit exactly 12 months apart.' },
      { do: 'Keep stepping through the gold **moving-average window**.', notice: 'Each window holds one of every month, so the season cancels and the window average traces the trend.' },
      { do: 'Watch the last two ACF frames and compare them with the raw ACF in frame 5.', notice: 'Detrending turns a slowly fading ACF into a clear spike at **lag 12**; the remainder ACF stays inside the grey band (white noise).' },
    ] },
    Playground: { what: 'Control how strong each layer is and see whether the decomposition and the ACF can still find them.', steps: [
      { do: 'Choose **ACF of: raw**, then drag **trend slope** from 0 to 3.', notice: 'With a strong trend every raw ACF bar is high, so the lag-12 bar no longer stands out from its neighbours. Switch to **detrended** and the spike at 12 is clear again.' },
      { do: 'Drag **noise SD** up to 20.', notice: 'Purple bars stop matching the green dots, season strength falls towards 0 and the lag-12 spike sinks into the grey band: too much noise hides real seasonality.' },
      { do: 'Set **season strength** to 0 and look at the ACF of the remainder.', notice: 'Without seasonality there is no spike at 12. Small random bars poking just outside the band are normal (about 1 in 20 by chance).' },
    ] },
  },
};
export default anim;
