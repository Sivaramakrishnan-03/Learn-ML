// Exponential smoothing: the forecast moves a fraction α of each error, which makes it a weighted average with
// exponentially decaying weights. Holt adds a trend, Holt-Winters adds a season.
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Bars, Dots, Seg, Arrow, Label, Region, Caption, Readout, Slider, Choice, Layout, Legend, useStepPlayer, PlayerControls, rng, gauss, C, Scales } from '../viz/kit';
import { ses, holt, holtWinters, monthlySeries, pathD, mean, rmse, toPts, Pt } from './_ts-helpers';

/* ---------- pure helpers ---------- */
function Line({ s, pts, color, width = 2.5, dash, opacity = 1 }: { s: Scales; pts: Pt[]; color: string; width?: number; dash?: string; opacity?: number }) {
  return <path d={pathD(s.sx, s.sy, pts)} fill="none" stroke={color} strokeWidth={width} strokeDasharray={dash} opacity={opacity} strokeLinejoin="round" />;
}
const f2 = (v: number) => v.toFixed(2);
const sg = (v: number, d = 2) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(d);
/** Weights that SES puts on y_T, y_{T−1}, … (k = 0 is the latest). */
const sesWeights = (alpha: number, n: number) => Array.from({ length: n }, (_, k) => alpha * (1 - alpha) ** k);

function shiftSeries(noise: number, n = 30, seed = 4) {
  const r = rng(seed);
  return Array.from({ length: n }, (_, t) => (t < 5 ? 100 : 150) + noise * gauss(r));
}
function trendSeries(n = 24, seed = 5) {
  const r = rng(seed);
  return Array.from({ length: n }, (_, t) => 100 + 6 * t + 6 * gauss(r));
}

/* ---------- Animate ---------- */
const SHAMPOO = [120, 110, 95, 130, 105];
const A = 0.3;
type Ph = 'ses' | 'weights' | 'weights2' | 'shift' | 'shiftNoise' | 'trendSes' | 'trendHolt' | 'holtParts' | 'seasHolt' | 'seasHW' | 'hwParts';
const FRAMES: { ph: Ph; k?: number }[] = [
  ...[0, 1, 2, 3, 4, 5].map((k) => ({ ph: 'ses' as Ph, k })),
  { ph: 'weights' }, { ph: 'weights2' }, { ph: 'shift' }, { ph: 'shiftNoise' },
  { ph: 'trendSes' }, { ph: 'trendHolt' }, { ph: 'holtParts' }, { ph: 'seasHolt' }, { ph: 'seasHW' }, { ph: 'hwParts' },
];
const H = 12;

function Animate() {
  const sh = useMemo(() => ses(SHAMPOO, A, 100), []);                // forecasts for weeks 1..6
  const shift0 = useMemo(() => shiftSeries(0), []);
  const shiftN = useMemo(() => shiftSeries(9), []);
  const tr = useMemo(() => trendSeries(), []);
  const trSes = useMemo(() => ses(tr, 0.5), [tr]);
  const trHolt = useMemo(() => holt(tr, 0.5, 0.3, 6), [tr]);
  const seas = useMemo(() => monthlySeries({ n: 36, seed: 8 }).y, []);
  const seHolt = useMemo(() => holt(seas, 0.5, 0.1, H), [seas]);
  const seHW = useMemo(() => holtWinters(seas, 0.3, 0.05, 0.3, 12, H), [seas]);
  const p = useStepPlayer(FRAMES.length, 2600);
  const fr = FRAMES[p.i];
  const ph = fr.ph;

  let main: JSX.Element, bottom: JSX.Element, caption: JSX.Element, read: [string, React.ReactNode, string?][], legend: [string, string][], title: string, bottomTitle: string;

  if (ph === 'ses') {
    const k = fr.k!;
    const e = k ? SHAMPOO[k - 1] - sh[k - 1] : 0;
    title = 'Weekly demand for a shampoo SKU (units), simple exponential smoothing with α = 0.3';
    main = <Plot x={[0.5, 6.5]} y={[85, 140]} height={280} xLabel="week" yLabel="units" xTicks={6}>
      {(s) => <>
        <Line s={s} pts={sh.slice(0, k + 1).map((y, i) => ({ x: i + 1, y }))} color={C.yellow} width={2.5} />
        <Seg s={s} x1={k + 1} x2={6.5} y1={sh[k]} y2={sh[k]} color={C.yellow} dash="5 4" width={1.5} />
        {SHAMPOO.slice(0, k).map((y, i) => <Seg key={i} s={s} x1={i + 1} x2={i + 1} y1={sh[i]} y2={y} color={C.red} width={i === k - 1 ? 3 : 1.5} />)}
        <Dots s={s} pts={SHAMPOO.slice(0, k).map((y, i) => ({ x: i + 1, y }))} r={7} animate={false} />
        <Dots s={s} pts={sh.slice(0, k + 1).map((y, i) => ({ x: i + 1, y }))} color={C.yellow} r={5} animate={false} />
        {k > 0 && <Arrow s={s} x1={k} y1={sh[k - 1]} x2={k + 1 - 0.08} y2={sh[k]} color={C.gold} />}
        {k > 0 && <Label s={s} x={k + 0.08} y={(sh[k - 1] + SHAMPOO[k - 1]) / 2} color={C.red} size={12}>error {sg(e)}</Label>}
        <Label s={s} x={k + 1.1} y={sh[k] + (k === 3 ? -4 : 3)} color={C.yellow} size={12}>forecast {f2(sh[k])}</Label>
      </>}
    </Plot>;
    bottomTitle = 'Each week: the error (red) and the step the forecast actually takes, α × error (yellow)';
    bottom = <Plot x={[0.5, 6.5]} y={[-15, 30]} height={190} xLabel="week" yLabel="units" xTicks={6}>
      {(s) => <>
        <Seg s={s} x1={0.5} x2={6.5} y1={0} y2={0} color={C.muted} width={1} />
        <Bars s={s} data={SHAMPOO.slice(0, k).map((y, i) => ({ x: i + 1 - 0.15, y: y - sh[i] }))} width={0.28} color={C.red} />
        <Bars s={s} data={SHAMPOO.slice(0, k).map((y, i) => ({ x: i + 1 + 0.15, y: A * (y - sh[i]) }))} width={0.28} color={C.yellow} />
      </>}
    </Plot>;
    caption = k === 0
      ? <>Before any data arrives our forecast for week 1 is <b>100 units</b> (yellow). Simple exponential smoothing has one rule: <b>new forecast = old forecast + α × error</b>. Here α = 0.3, so we move 30% of the way towards each surprise.</>
      : <>Week {k}: actual <b>{SHAMPOO[k - 1]}</b> vs forecast {f2(sh[k - 1])}, so the error is <b>{sg(e)}</b>. The forecast moves only α × error = 0.3 × {sg(e)} = <b>{sg(A * e)}</b>, to <b>{f2(sh[k])}</b>.{k === 4 ? ' A big surprise moves it more, but still only 30% of the way.' : k === 5 ? ' Demand swung between 95 and 130; the forecast stayed calmly between 100 and 111.' : ''}</>;
    read = [['week', k], ['α', A], ['last error', k ? sg(e) : '–', C.red], ['next forecast', f2(sh[k]), C.yellow]];
    legend = [['actual demand', C.blue], ['forecast', C.yellow], ['error', C.red], ['update step', C.gold]];
  } else if (ph === 'weights' || ph === 'weights2') {
    const w = sesWeights(A, 5), w8 = sesWeights(0.8, 5);
    const labels = ['wk 5', 'wk 4', 'wk 3', 'wk 2', 'wk 1', 'start'];
    title = 'Unrolling the updates: the week-6 forecast is a weighted average of everything seen so far';
    main = <Plot x={[0.5, 6.5]} y={[85, 140]} height={280} xLabel="week" yLabel="units" xTicks={6}>
      {(s) => <>
        <Line s={s} pts={sh.map((y, i) => ({ x: i + 1, y }))} color={C.yellow} width={2.5} />
        {SHAMPOO.map((y, i) => <Dots key={i} s={s} pts={[{ x: i + 1, y }]} r={4 + 22 * w[4 - i]} color={C.blue} animate={false} />)}
        {SHAMPOO.map((y, i) => <Label key={'l' + i} s={s} x={i + 1} y={y + 6 + 22 * w[4 - i] * 0.25} anchor="middle" size={11} color={C.muted}>w = {w[4 - i].toFixed(2)}</Label>)}
        <Dots s={s} pts={[{ x: 6, y: sh[5] }]} color={C.yellow} r={7} animate={false} />
        <Label s={s} x={5.65} y={sh[5] + 4} color={C.yellow} size={12} anchor="end">{f2(sh[5])}</Label>
      </>}
    </Plot>;
    bottomTitle = ph === 'weights' ? 'Weight on each past value in the week-6 forecast (α = 0.3)' : 'Weights with α = 0.3 (yellow) vs α = 0.8 (gold)';
    bottom = <Plot x={[0.5, 6.5]} y={[0, ph === 'weights' ? 0.35 : 0.85]} height={190} xLabel="how far back" yLabel="weight" fx={(v) => labels[v - 1] ?? ''} xTicks={6}>
      {(s) => <>
        <Bars s={s} data={[...w, (1 - A) ** 5].map((y, i) => ({ x: i + 1 - (ph === 'weights2' ? 0.17 : 0), y }))} width={ph === 'weights2' ? 0.32 : 0.6} color={(i) => (i === 5 ? C.grey : C.yellow)} />
        {ph === 'weights2' && <Bars s={s} data={[...w8, 0.2 ** 5].map((y, i) => ({ x: i + 1 + 0.17, y }))} width={0.32} color={C.gold} />}
        {ph === 'weights' && w.map((v, i) => <Label key={i} s={s} x={i + 1} y={v + 0.012} anchor="middle" size={12}>{v.toFixed(3)}</Label>)}
        {ph === 'weights' && <Label s={s} x={6} y={(1 - A) ** 5 + 0.012} anchor="middle" size={12}>{((1 - A) ** 5).toFixed(3)}</Label>}
      </>}
    </Plot>;
    caption = ph === 'weights'
      ? <>Unroll the five updates and the forecast <b>{f2(sh[5])}</b> = 0.300×105 + 0.210×130 + 0.147×95 + 0.103×110 + 0.072×120 + 0.168×100 (the starting guess). Each step back the weight shrinks by (1 − α) = 0.7: <b>exponentially decaying weights</b>, hence the name. Bigger dots = more weight.</>
      : <>With <b>α = 0.8</b> (gold) the latest week gets 80% of the weight and older weeks almost nothing: a nervous forecast that follows every wiggle. With <b>α = 0.3</b> the memory is longer and the forecast calmer. α is the dial between "react" and "remember".</>;
    read = [['α', ph === 'weights' ? '0.3' : '0.3 vs 0.8'], ['weight on newest', ph === 'weights' ? '0.30' : '0.30 vs 0.80', C.yellow], ['weights sum to', '1.00'], ['week-6 forecast', f2(sh[5]), C.yellow]];
    legend = ph === 'weights' ? [['actual (size = weight)', C.blue], ['weights, α = 0.3', C.yellow], ['starting guess', C.grey]] : [['α = 0.3', C.yellow], ['α = 0.8', C.gold]];
  } else if (ph === 'shift' || ph === 'shiftNoise') {
    const y = ph === 'shift' ? shift0 : shiftN;
    const lo = ses(y, 0.2, 100), hi = ses(y, 0.8, 100);
    // how far each forecast wanders from the true level (150) once both have caught up (weeks 16–30)
    const errLo = lo.slice(15, 30).map((v) => v - 150), errHi = hi.slice(15, 30).map((v) => v - 150);
    title = ph === 'shift' ? 'Demand jumps from 100 to 150 after a shelf move (no noise)' : 'Same jump, now with week-to-week noise (SD 9 units)';
    main = <Plot x={[0.5, 31.5]} y={[80, 180]} height={280} xLabel="week" yLabel="units">
      {(s) => <>
        <Line s={s} pts={[{ x: 0.5, y: 100 }, { x: 5.5, y: 100 }, { x: 5.5, y: 150 }, { x: 31.5, y: 150 }]} color={C.green} width={1.5} dash="3 4" />
        <Line s={s} pts={y.map((v, i) => ({ x: i + 1, y: v }))} color={C.blue} width={1.5} />
        <Dots s={s} pts={y.map((v, i) => ({ x: i + 1, y: v }))} r={4} animate={false} />
        <Line s={s} pts={lo.map((v, i) => ({ x: i + 1, y: v }))} color={C.yellow} width={2.5} />
        <Line s={s} pts={hi.map((v, i) => ({ x: i + 1, y: v }))} color={C.gold} width={2.5} dash="6 3" />
        <Label s={s} x={1} y={170} color={C.green} size={12}>{ph === 'shift' ? 'level jumps to 150 at week 6 →' : 'true level 150 from week 6 →'}</Label>
      </>}
    </Plot>;
    const w = sesWeights(0.2, 10), w8 = sesWeights(0.8, 10);
    bottomTitle = 'Weights on the last 10 weeks: α = 0.2 (yellow) vs α = 0.8 (gold)';
    bottom = <Plot x={[0.5, 10.5]} y={[0, 0.85]} height={190} xLabel="weeks back (1 = latest)" yLabel="weight" xTicks={10}>
      {(s) => <>
        <Bars s={s} data={w.map((v, i) => ({ x: i + 1 - 0.18, y: v }))} width={0.34} color={C.yellow} />
        <Bars s={s} data={w8.map((v, i) => ({ x: i + 1 + 0.18, y: v }))} width={0.34} color={C.gold} />
      </>}
    </Plot>;
    caption = ph === 'shift'
      ? <>A permanent jump. <b>α = 0.8</b> (gold) is at 140 after one week and 149.6 after three. <b>α = 0.2</b> (yellow) closes only 20% of the gap each week: 110, 118, 124.4, 129.5, 133.6, still 16 short after five weeks. <b>High α adapts fast to real change.</b></>
      : <>Now add noise. α = 0.8 jumps after every random wiggle (in weeks 16–30 its forecast wanders <b>±{rmse(errHi).toFixed(1)}</b> units around the true level 150), while α = 0.2 averages the noise away (only <b>±{rmse(errLo).toFixed(1)}</b>). <b>Low α resists noise.</b> In practice α is fitted by minimising one-step errors on history, balancing the two.</>;
    read = [['α = 0.2, wk 10 forecast', lo[10].toFixed(1), C.yellow], ['α = 0.8, wk 10 forecast', hi[10].toFixed(1), C.gold], ['wander from 150, α 0.2', '±' + rmse(errLo).toFixed(1), C.yellow], ['wander from 150, α 0.8', '±' + rmse(errHi).toFixed(1), C.gold]];
    legend = [['actual', C.blue], ['SES α = 0.2', C.yellow], ['SES α = 0.8', C.gold], ['true level', C.green]];
  } else if (ph === 'trendSes' || ph === 'trendHolt' || ph === 'holtParts') {
    const useHolt = ph !== 'trendSes';
    const n = tr.length;
    const one = useHolt ? trHolt.f : trSes.slice(0, n);
    const fut = useHolt ? trHolt.fut : Array(6).fill(trSes[n]);
    const err = tr.map((v, i) => v - one[i]).slice(1);
    const l = trHolt.L[n - 1], b = trHolt.B[n - 1];
    title = 'Monthly sales of a growing EV charging cable (units)';
    main = <Plot x={[0, 31]} y={[80, 330]} height={280} xLabel="month" yLabel="units">
      {(s) => <>
        <Region s={s} x0={n + 0.5} x1={31} color={C.yellow} opacity={0.05} />
        <Line s={s} pts={tr.map((v, i) => ({ x: i + 1, y: v }))} color={C.blue} width={1.5} />
        <Dots s={s} pts={tr.map((v, i) => ({ x: i + 1, y: v }))} r={4} animate={false} />
        <Line s={s} pts={one.slice(1).map((v, i) => ({ x: i + 2, y: v }))} color={C.yellow} width={2.2} />
        <Line s={s} pts={[{ x: n, y: useHolt ? l : trSes[n] }, ...fut.map((v, h) => ({ x: n + h + 1, y: v }))]} color={C.yellow} width={2.5} dash="6 4" />
        <Dots s={s} pts={fut.map((v, h) => ({ x: n + h + 1, y: v }))} color={C.yellow} r={4.5} animate={false} />
        {ph === 'trendSes' && <Label s={s} x={n + 1} y={trSes[n] - 18} color={C.yellow} size={12}>flat forecast</Label>}
        {ph === 'holtParts' && <>
          <Dots s={s} pts={[{ x: n, y: l }]} color={C.green} r={7} animate={false} />
          <Arrow s={s} x1={n} y1={l} x2={n + 3} y2={l + 3 * b} color={C.gold} />
          <Label s={s} x={n + 0.6} y={l - 28} color={C.gold} size={12}>trend b = {sg(b, 1)}/month</Label>
          <Label s={s} x={n - 0.5} y={l + 22} color={C.green} size={12} anchor="end">level ℓ = {l.toFixed(1)}</Label>
        </>}
        <Label s={s} x={n + 1} y={95} color={C.muted} size={11}>future →</Label>
      </>}
    </Plot>;
    bottomTitle = `One-step forecast errors (actual − forecast) of ${useHolt ? "Holt's method" : 'simple smoothing'}`;
    bottom = <Plot x={[0, 31]} y={[-30, 40]} height={190} xLabel="month" yLabel="units">
      {(s) => <>
        <Seg s={s} x1={0} x2={31} y1={0} y2={0} color={C.muted} width={1} />
        <Bars s={s} data={err.map((v, i) => ({ x: i + 2, y: v }))} width={0.6} color={C.red} />
        <Seg s={s} x1={1} x2={tr.length} y1={mean(err)} y2={mean(err)} color={C.gold} width={2} dash="5 3" />
      </>}
    </Plot>;
    caption = ph === 'trendSes'
      ? <>Simple smoothing on a <b>growing</b> product. The yellow forecast always trails behind the data, so the errors below are almost all positive (average <b>{sg(mean(err), 1)}</b> units, gold line): a <b>biased</b> forecast. Worse, its future forecast is a flat line at {trSes[n].toFixed(0)}, while sales keep climbing.</>
      : ph === 'trendHolt'
        ? <><b>Holt's method</b> smooths two things: the <b>level</b> (α = 0.5) and the <b>trend</b>, the monthly change (β = 0.3). The one-step forecast is level + trend, so it keeps up with the growth. Errors now scatter around zero (average <b>{sg(mean(err), 1)}</b>), and the future forecast slopes upward.</>
        : <>At the last month Holt holds a <b>level ℓ = {l.toFixed(1)}</b> and a <b>trend b = {sg(b, 1)}</b> per month. Forecast h months ahead = ℓ + h·b: {fut[0].toFixed(1)}, {fut[1].toFixed(1)}, {fut[2].toFixed(1)}… Each new month nudges both: a surprise raises the level, and a level jump bigger than b raises the trend (lesson example: ℓ 200 → 212.5, b 10 → 10.75).</>;
    read = [['method', useHolt ? 'Holt (α 0.5, β 0.3)' : 'SES (α 0.5)'], ['mean error (bias)', sg(mean(err), 1), C.red], ['RMSE', rmse(err).toFixed(1), C.red], ['forecast in 6 months', fut[5].toFixed(0), C.yellow]];
    legend = [['actual', C.blue], ['one-step & future forecast', C.yellow], ['errors', C.red], ['mean error', C.gold], ...(ph === 'holtParts' ? [['level', C.green] as [string, string]] : [])];
  } else {
    const useHW = ph !== 'seasHolt';
    const n = seas.length;
    const one = useHW ? seHW.f : seHolt.f;
    const fut = useHW ? seHW.fut : seHolt.fut;
    const err = seas.map((v, i) => v - one[i]).map((v, i) => (i < 12 ? NaN : v));
    const errV = err.filter(isFinite);
    const octH = 10; // Oct of the forecast year is h = 10 (index 9)
    title = 'Monthly sweets sales with a Diwali peak (₹ lakh): 3 years of history, 12 months forecast';
    main = <Plot x={[0, 49]} y={[60, 210]} height={280} xLabel="month" yLabel="₹ lakh">
      {(s) => <>
        <Region s={s} x0={n + 0.5} x1={49} color={C.yellow} opacity={0.05} />
        <Line s={s} pts={toPts(seas, 1)} color={C.blue} width={1.5} />
        <Dots s={s} pts={toPts(seas, 1)} r={3.5} animate={false} />
        <Line s={s} pts={one.map((v, i) => ({ x: i + 1, y: i < 12 ? NaN : v }))} color={C.yellow} width={2} />
        <Line s={s} pts={fut.map((v, h) => ({ x: n + h + 1, y: v }))} color={C.yellow} width={2.8} dash="6 4" />
        <Dots s={s} pts={fut.map((v, h) => ({ x: n + h + 1, y: v }))} color={C.yellow} r={4} animate={false} />
        {ph === 'hwParts' && <Dots s={s} pts={[{ x: n + octH, y: fut[octH - 1] }]} color={C.gold} r={8} animate={false} />}
        {ph === 'hwParts' && <Label s={s} x={n + octH} y={fut[octH - 1] + 10} color={C.gold} size={12} anchor="middle">Oct: {fut[octH - 1].toFixed(0)}</Label>}
        <Label s={s} x={n + 1} y={70} color={C.muted} size={11}>future →</Label>
      </>}
    </Plot>;
    bottomTitle = `One-step forecast errors of ${useHW ? 'Holt-Winters' : "Holt's method"} (from year 2)`;
    bottom = <Plot x={[0, 49]} y={[-40, 35]} height={190} xLabel="month" yLabel="₹ lakh">
      {(s) => <>
        <Seg s={s} x1={0} x2={49} y1={0} y2={0} color={C.muted} width={1} />
        <Bars s={s} data={err.map((v, i) => ({ x: i + 1, y: isFinite(v) ? v : 0 }))} width={0.6} color={C.red} />
      </>}
    </Plot>;
    caption = ph === 'seasHolt'
      ? <>Holt's method on a <b>seasonal</b> series: it chases each Diwali peak a month late, so the errors below repeat every 12 months (under-forecast in the festive run-up, over-forecast in the slump after it), and its future forecast is a straight line through the festive season. <b>A pattern left in the errors means the model is missing something.</b></>
      : ph === 'seasHW'
        ? <><b>Holt-Winters</b> adds a third smoothed component: one seasonal effect per calendar month (γ = 0.3). The forecast now rises into Diwali and dips in February, and the one-step errors shrink to plain noise: RMSE <b>{rmse(errV).toFixed(1)}</b> vs {rmse(seas.map((v, i) => (i < 12 ? NaN : v - seHolt.f[i]))).toFixed(1)} for Holt.</>
        : <>Every forecast is <b>level + h × trend + seasonal effect</b> of that month. Next October (gold) comes out at about <b>₹{fut[octH - 1].toFixed(0)} lakh</b>. The family in one line: <b>SES = level</b>, <b>Holt = level + trend</b>, <b>Holt-Winters = level + trend + season</b>, each updated by its own smoothing dial.</>;
    read = [['method', useHW ? 'Holt-Winters' : 'Holt'], ['RMSE (one-step)', rmse(errV).toFixed(1), C.red], ['Oct forecast', fut[octH - 1].toFixed(0), C.yellow], ['Feb forecast', fut[1].toFixed(0), C.yellow]];
    legend = [['actual', C.blue], ['one-step & future forecast', C.yellow], ['errors', C.red], ...(ph === 'hwParts' ? [['next October', C.gold] as [string, string]] : [])];
  }

  return (
    <div>
      <Layout
        main={<>
          <div className="small muted">{title}</div>
          {main}
          <div className="small muted" style={{ marginTop: 6 }}>{bottomTitle}</div>
          {bottom}
        </>}
        side={<>
          <Readout items={read} />
          <Legend items={legend} />
          <p className="small muted" style={{ margin: 0 }}>Update rule: <b>level ← level + α × error</b>. Holt adds <b>trend ← trend + β × (change in level − trend)</b>; Holt-Winters also smooths one <b>seasonal effect</b> per month with γ.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caption}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
type DS = 'shift' | 'trend' | 'season';
type Method = 'ses' | 'holt' | 'hw';
function Playground() {
  const [ds, setDs] = useState<DS>('trend');
  const [method, setMethod] = useState<Method>('ses');
  const [alpha, setAlpha] = useState(0.3);
  const [beta, setBeta] = useState(0.2);
  const [gamma, setGamma] = useState(0.3);
  const y = useMemo(() => {
    if (ds === 'shift') { const r = rng(9); return Array.from({ length: 40 }, (_, t) => (t < 18 ? 100 : 150) + 9 * gauss(r)); }
    if (ds === 'trend') { const r = rng(5); return Array.from({ length: 36 }, (_, t) => 100 + 5 * t + 8 * gauss(r)); }
    return monthlySeries({ n: 48, seed: 8 }).y;
  }, [ds]);
  const n = y.length;
  const res = useMemo(() => {
    if (method === 'ses') { const f = ses(y, alpha); return { f: f.slice(0, n), fut: Array(H).fill(f[n]) }; }
    if (method === 'holt') return holt(y, alpha, beta, H);
    return holtWinters(y, alpha, beta, gamma, 12, H);
  }, [y, method, alpha, beta, gamma, n]);
  const start = method === 'hw' ? 12 : 1;
  const err = y.map((v, i) => (i < start ? NaN : v - res.f[i]));
  const errV = err.filter(isFinite);
  const all = [...y, ...res.fut.filter(isFinite)];
  const lo = Math.min(...all) - 15, hi = Math.max(...all) + 15;
  const w = sesWeights(alpha, 12);
  return (
    <Layout
      main={<>
        <Plot x={[0, n + H + 1]} y={[Math.floor(lo), Math.ceil(hi)]} height={280} xLabel={ds === 'shift' ? 'week' : 'month'} yLabel="demand">
          {(s) => <>
            <Region s={s} x0={n + 0.5} x1={n + H + 1} color={C.yellow} opacity={0.05} />
            <Line s={s} pts={toPts(y, 1)} color={C.blue} width={1.5} />
            <Dots s={s} pts={toPts(y, 1)} r={3.5} animate={false} />
            <Line s={s} pts={res.f.map((v, i) => ({ x: i + 1, y: i < start ? NaN : v }))} color={C.yellow} width={2} />
            <Line s={s} pts={res.fut.map((v, h) => ({ x: n + h + 1, y: v }))} color={C.yellow} width={2.8} dash="6 4" />
          </>}
        </Plot>
        <div className="small muted" style={{ marginTop: 6 }}>One-step forecast errors, actual − forecast</div>
        <Plot x={[0, n + H + 1]} y={[-Math.max(20, ...errV.map(Math.abs)), Math.max(20, ...errV.map(Math.abs))]} height={170} xLabel={ds === 'shift' ? 'week' : 'month'} yLabel="error">
          {(s) => <>
            <Seg s={s} x1={0} x2={n + H + 1} y1={0} y2={0} color={C.muted} width={1} />
            <Bars s={s} data={err.map((v, i) => ({ x: i + 1, y: isFinite(v) ? v : 0 }))} width={0.6} color={C.red} />
          </>}
        </Plot>
      </>}
      side={<>
        <Choice label="Data" value={ds} onChange={setDs} options={[{ value: 'shift', label: 'level shift' }, { value: 'trend', label: 'trend' }, { value: 'season', label: 'seasonal' }]} />
        <Choice label="Method" value={method} onChange={setMethod} options={[{ value: 'ses', label: 'SES' }, { value: 'holt', label: 'Holt' }, { value: 'hw', label: 'Holt-Winters' }]} />
        <Slider label="α (level)" min={0.02} max={1} step={0.02} value={alpha} onChange={setAlpha} format={(v) => v.toFixed(2)} />
        {method !== 'ses' && <Slider label="β (trend)" min={0} max={1} step={0.02} value={beta} onChange={setBeta} format={(v) => v.toFixed(2)} />}
        {method === 'hw' && <Slider label="γ (season)" min={0} max={1} step={0.02} value={gamma} onChange={setGamma} format={(v) => v.toFixed(2)} />}
        <Readout items={[
          ['RMSE (one-step)', rmse(errV).toFixed(1), C.red],
          ['bias (mean error)', sg(mean(errV), 1), C.red],
          ['next forecast', res.fut[0].toFixed(1), C.yellow],
          [`in ${H} steps`, res.fut[H - 1].toFixed(1), C.yellow],
        ]} />
        <div className="small muted">Level weights α(1 − α)^k on the last 12 observations</div>
        <Plot x={[0.5, 12.5]} y={[0, 1]} width={380} height={170} xLabel="steps back (1 = latest)" yLabel="weight" xTicks={6}>
          {(s) => <Bars s={s} data={w.map((v, i) => ({ x: i + 1, y: v }))} width={0.7} color={C.yellow} />}
        </Plot>
        <Legend items={[['actual', C.blue], ['forecast', C.yellow], ['errors', C.red]]} />
        <p className="small muted" style={{ margin: 0 }}>α = 1 is the naive forecast (tomorrow = today). A good model leaves errors that look like noise: no drift above zero, no repeating shape.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Follow the lesson\'s shampoo example week by week, see why the forecast is a **weighted average with exponentially decaying weights**, then watch **Holt** fix trend and **Holt-Winters** fix seasonality.', steps: [
      { do: 'Step through the first six frames.', notice: 'Each week the red error appears and the forecast moves only 30% of it (yellow bar below is 0.3 × the red bar).' },
      { do: 'Continue to the weights and the 100 → 150 jump.', notice: 'High α (gold) forgets fast: great after a real jump, jittery with noise. Low α (yellow) is calm but slow.' },
      { do: 'Watch the error bars below in the trend and seasonal frames.', notice: 'SES errors sit above zero on a trend; Holt errors repeat every 12 months on a seasonal series; Holt-Winters errors look like plain noise.' },
    ] },
    Playground: { what: 'Pick a dataset and a method, tune the smoothing dials, and judge the fit by the one-step errors and the future forecast (dashed).', steps: [
      { do: 'Data **trend**, method **SES**, then switch to **Holt**.', notice: 'SES has a large positive bias and a flat future; Holt removes the bias and the forecast slopes upward.' },
      { do: 'Data **level shift**, method **SES**, drag **α** from 0.1 to 1.', notice: 'Small α takes many weeks to reach 150; α = 1 copies the last value and its errors get noisier. The lowest RMSE is in between.' },
      { do: 'Data **seasonal**: compare **Holt** and **Holt-Winters**.', notice: 'Only Holt-Winters forecasts the Diwali peak; Holt\'s errors keep a 12-month rhythm.' },
    ] },
  },
};
export default anim;
