// ARIMA: difference a trending series until it is stationary (the "I"), then forecast with an autoregression (the "AR"):
// AR(1) forecasts decay geometrically back to the mean, and prediction intervals grow (bounded for AR, unbounded once integrated).
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Bars, Dots, Seg, Arrow, Label, Region, Caption, Readout, Slider, Choice, Toggle, Layout, Legend, useStepPlayer, PlayerControls, rng, gauss, C, Scales } from '../viz/kit';
import { mean, sdS } from '../viz/math';
import { acf, pathD, bandD, toPts, Pt } from './_ts-helpers';

/* ---------- pure helpers ---------- */
function Line({ s, pts, color, width = 2.5, dash, opacity = 1 }: { s: Scales; pts: Pt[]; color: string; width?: number; dash?: string; opacity?: number }) {
  return <path d={pathD(s.sx, s.sy, pts)} fill="none" stroke={color} strokeWidth={width} strokeDasharray={dash} opacity={opacity} strokeLinejoin="round" />;
}
function Band({ s, xs, lo, hi, color = C.yellow, opacity = 0.15 }: { s: Scales; xs: number[]; lo: number[]; hi: number[]; color?: string; opacity?: number }) {
  return <path d={bandD(s.sx, s.sy, xs, lo, hi)} fill={color} fillOpacity={opacity} stroke="none" />;
}
function AcfBars({ r, n, title, height = 190 }: { r: number[]; n: number; title: string; height?: number }) {
  const band = 1.96 / Math.sqrt(n);
  return <>
    <div className="small muted" style={{ marginTop: 6 }}>{title}</div>
    <Plot x={[0.3, r.length + 0.7]} y={[Math.min(-0.5, ...r.map((v) => v - 0.05)), 1]} height={height} xLabel="lag k" yLabel="autocorrelation" xTicks={10}>
      {(s) => <>
        <Region s={s} x0={0.3} x1={r.length + 0.7} y0={-band} y1={band} color={C.grey} opacity={0.25} />
        <Seg s={s} x1={0.3} x2={r.length + 0.7} y1={0} y2={0} color={C.muted} width={1} />
        <Bars s={s} data={r.map((v, i) => ({ x: i + 1, y: v }))} width={0.6} color={(i) => (r[i] < 0 ? C.purple : C.blue)} />
      </>}
    </Plot>
  </>;
}
/** Growing product: changes follow an AR(1) around a drift; rescaled so the last value is 200 and the last change +10 (lesson example). */
function salesSeries(n = 60) {
  const r = rng(15), c = 2.6, phi = 0.5;
  const d: number[] = [c];
  for (let t = 1; t < n - 1; t++) d.push(c + phi * (d[t - 1] - c) + 4 * gauss(r));
  d.push(10);
  const y = [0]; d.forEach((v) => y.push(y[y.length - 1] + v));
  const shift = 200 - y[y.length - 1];
  return y.map((v) => v + shift); // length n
}
/** AR(1) daily peak demand yₜ = 20 + 0.6·yₜ₋₁ + shock, forced to end at 70 (lesson example). */
function gridSeries(n = 40) {
  const r = rng(17); const y = [50];
  for (let t = 1; t < n - 1; t++) y.push(20 + 0.6 * y[t - 1] + 5 * gauss(r));
  y.push(70);
  return y;
}
/** AR(1) forecasts from y0 around mean mu, with half-widths of a z·σ prediction interval. */
function ar1Fc(y0: number, mu: number, phi: number, sigma: number, H: number, z = 1.96) {
  const fc: number[] = [], hw: number[] = []; let v = 0;
  for (let h = 1; h <= H; h++) { fc.push(mu + phi ** h * (y0 - mu)); v += phi ** (2 * (h - 1)); hw.push(z * sigma * Math.sqrt(v)); }
  return { fc, hw };
}
/** ARIMA(1,1,0) forecasts: changes decay as φ^h·(Δ_n − c) + c, levels add them up; interval uses ψ-weights. */
function arima110Fc(yN: number, dN: number, phi: number, sigma: number, H: number, c = 0, z = 1.96) {
  const fc: number[] = [], dfc: number[] = [], hw: number[] = []; let lvl = yN, v = 0;
  for (let h = 1; h <= H; h++) {
    const dh = c + phi ** h * (dN - c); dfc.push(dh); lvl += dh; fc.push(lvl);
    let psi = 0; for (let i = 0; i < h; i++) psi += phi ** i; // ψ_{h−1} = 1 + φ + … + φ^{h−1}
    v += psi * psi; hw.push(z * sigma * Math.sqrt(v));
  }
  return { fc, dfc, hw };
}
const f1 = (v: number) => v.toFixed(1);

/* ---------- Animate ---------- */
type Ph = 'levels' | 'diff' | 'stationary' | 'diffAcf' | 'grid' | 'step' | 'pi' | 'phis' | 'arima' | 'drift';
const FRAMES: { ph: Ph; h?: number }[] = [
  { ph: 'levels' }, { ph: 'diff' }, { ph: 'stationary' }, { ph: 'diffAcf' },
  { ph: 'grid' }, { ph: 'step', h: 1 }, { ph: 'step', h: 2 }, { ph: 'step', h: 3 }, { ph: 'step', h: 14 },
  { ph: 'pi' }, { ph: 'phis' }, { ph: 'arima' }, { ph: 'drift' },
];
const PHI = 0.6, MU = 50, SIG = 5, HG = 14;

function Animate() {
  const sales = useMemo(() => salesSeries(), []);
  const dSales = useMemo(() => sales.slice(1).map((v, i) => v - sales[i]), [sales]);
  const acfLev = useMemo(() => acf(sales, 20), [sales]);
  const acfDif = useMemo(() => acf(dSales, 20), [dSales]);
  const grid = useMemo(() => gridSeries(), []);
  const g = useMemo(() => ar1Fc(70, MU, PHI, SIG, HG), []);
  const sigD = useMemo(() => sdS(dSales.slice(0, -1)), [dSales]);
  const ar = useMemo(() => arima110Fc(200, 10, 0.5, sigD, 18), [sigD]);
  const arDrift = useMemo(() => arima110Fc(200, 10, 0.5, sigD, 18, mean(dSales)), [sigD, dSales]);
  const p = useStepPlayer(FRAMES.length, 2600);
  const fr = FRAMES[p.i];
  const ph = fr.ph;
  const n = sales.length, half = Math.floor(n / 2);

  let top: JSX.Element, bottom: JSX.Element, caption: JSX.Element, read: [string, React.ReactNode, string?][], legend: [string, string][], title: string, bottomTitle = '';

  if (ph === 'levels' || ph === 'diff' || ph === 'stationary' || ph === 'diffAcf') {
    const m1 = mean(sales.slice(0, half)), m2 = mean(sales.slice(half));
    const dm1 = mean(dSales.slice(0, half)), dm2 = mean(dSales.slice(half));
    title = 'Monthly sales of a growing product (units)';
    top = <Plot x={[0, n + 1]} y={[0, 230]} height={250} xLabel="month" yLabel="units">
      {(s) => <>
        <Line s={s} pts={toPts(sales, 1)} color={C.blue} width={2} opacity={ph === 'levels' ? 1 : 0.6} />
        <Dots s={s} pts={toPts(sales, 1)} r={3} animate={false} opacity={ph === 'levels' ? 1 : 0.6} />
        {ph === 'levels' && <><Seg s={s} x1={1} x2={half} y1={m1} y2={m1} color={C.green} width={2.5} dash="6 4" /><Seg s={s} x1={half + 1} x2={n} y1={m2} y2={m2} color={C.green} width={2.5} dash="6 4" />
          <Label s={s} x={2} y={m1 + 12} color={C.green} size={12}>mean {f1(m1)}</Label><Label s={s} x={half + 2} y={m2 + 12} color={C.green} size={12}>mean {f1(m2)}</Label></>}
        {ph === 'diff' && sales.slice(1).map((v, i) => <Seg key={i} s={s} x1={i + 2} x2={i + 2} y1={sales[i]} y2={v} color={C.gold} width={2.5} />)}
      </>}
    </Plot>;
    if (ph === 'levels') { bottomTitle = ''; bottom = <AcfBars r={acfLev} n={n} title="ACF of the sales levels" />; }
    else if (ph === 'diffAcf') bottom = <AcfBars r={acfDif} n={n - 1} title="ACF of the monthly changes Δy" />;
    else {
      bottomTitle = 'Monthly change Δyₜ = yₜ − yₜ₋₁ (units)';
      bottom = <Plot x={[0, n + 1]} y={[-12, 16]} height={190} xLabel="month" yLabel="change">
        {(s) => <>
          <Seg s={s} x1={0} x2={n + 1} y1={0} y2={0} color={C.muted} width={1} />
          {ph === 'stationary' && <Region s={s} x0={1} x1={n} y0={mean(dSales) - 2 * sdS(dSales)} y1={mean(dSales) + 2 * sdS(dSales)} color={C.green} opacity={0.08} />}
          <Bars s={s} data={dSales.map((v, i) => ({ x: i + 2, y: v }))} width={0.6} color={C.gold} />
          {ph === 'stationary' && <><Seg s={s} x1={2} x2={half + 1} y1={dm1} y2={dm1} color={C.green} width={2.5} dash="6 4" /><Seg s={s} x1={half + 2} x2={n} y1={dm2} y2={dm2} color={C.green} width={2.5} dash="6 4" /></>}
        </>}
      </Plot>;
    }
    caption = ph === 'levels'
      ? <>Sales climb from about {sales[0].toFixed(0)} to 200 units. The average of the first half is <b>{f1(m1)}</b>, of the second half <b>{f1(m2)}</b>: the mean keeps moving, so the series is <b>not stationary</b>. Its ACF stays high for many lags, the classic sign of a trend. ARIMA cannot model this directly.</>
      : ph === 'diff'
        ? <>The fix is <b>differencing</b>: instead of the level, model the <b>change</b> each month, Δy<sub>t</sub> = y<sub>t</sub> − y<sub>t−1</sub> (gold sticks, top). Laid side by side (bottom), the changes no longer climb. The last change was <b>+{dSales[dSales.length - 1].toFixed(0)}</b> units.</>
        : ph === 'stationary'
          ? <>The changes wobble around a constant mean (first half <b>{f1(dm1)}</b>, second half <b>{f1(dm2)}</b>) with a steady spread (green band ±2 SD). That is <b>stationary</b>: the same statistical behaviour at any time. One difference was enough, so <b>d = 1</b>.</>
          : <>ACF of the changes: r₁ = <b>{acfDif[0].toFixed(2)}</b>, r₂ = {acfDif[1].toFixed(2)}, r₃ = {acfDif[2].toFixed(2)}: roughly halving each lag, then noise. A change tends to be followed by a similar change, and the memory fades quickly. That fading pattern is the signature of an <b>autoregressive</b> AR(1) model on the changes, the "AR" in ARIMA.</>;
    read = ph === 'levels' ? [['mean, 1st half', f1(m1), C.green], ['mean, 2nd half', f1(m2), C.green], ['ACF lag 1', acfLev[0].toFixed(2), C.blue], ['stationary?', 'no', C.red]]
      : [['mean Δ, 1st half', f1(dm1), C.green], ['mean Δ, 2nd half', f1(dm2), C.green], ['ACF lag 1 of Δ', acfDif[0].toFixed(2), C.blue], ['stationary?', ph === 'diff' ? '…' : 'yes (d = 1)', C.green]];
    legend = [['sales', C.blue], ['monthly change', C.gold], ['means', C.green]];
  } else if (ph === 'grid' || ph === 'step' || ph === 'pi' || ph === 'phis') {
    const H = ph === 'grid' ? 0 : ph === 'step' ? fr.h! : HG;
    const N = grid.length;
    const xs = Array.from({ length: HG }, (_, i) => N + i + 1);
    const curves = ph === 'phis' ? [0.2, 0.6, 0.95].map((ph_) => ({ phi: ph_, ...ar1Fc(70, MU, ph_, SIG, HG) })) : [];
    title = 'Daily peak electricity demand (hundreds of MW): yₜ = 20 + 0.6 · yₜ₋₁ + shock';
    top = <Plot x={[0, N + HG + 1]} y={[20, 90]} height={250} xLabel="day" yLabel="peak demand">
      {(s) => <>
        <Seg s={s} x1={0} x2={N + HG + 1} y1={MU} y2={MU} color={C.green} width={1.5} dash="6 4" />
        <Label s={s} x={2} y={25} color={C.green} size={12}>green dashes: long-run mean 20 / (1 − 0.6) = 50</Label>
        {ph === 'pi' && <Band s={s} xs={xs} lo={g.fc.map((v, i) => v - g.hw[i])} hi={g.fc.map((v, i) => v + g.hw[i])} opacity={0.18} />}
        {ph === 'pi' && <Band s={s} xs={xs} lo={g.fc.map((v, i) => v - g.hw[i] * 1.2816 / 1.96)} hi={g.fc.map((v, i) => v + g.hw[i] * 1.2816 / 1.96)} opacity={0.22} />}
        <Line s={s} pts={toPts(grid, 1)} color={C.blue} width={1.5} />
        <Dots s={s} pts={toPts(grid, 1)} r={3.5} animate={false} />
        <Dots s={s} pts={[{ x: N, y: 70 }]} r={6} color={C.gold} animate={false} />
        {ph !== 'phis' && H > 0 && <Line s={s} pts={[{ x: N, y: 70 }, ...g.fc.slice(0, H).map((v, i) => ({ x: N + i + 1, y: v }))]} color={C.yellow} width={2.5} />}
        {ph !== 'phis' && <Dots s={s} pts={g.fc.slice(0, H).map((v, i) => ({ x: N + i + 1, y: v }))} color={C.yellow} r={5} animate={false} />}
        {ph === 'step' && H <= 3 && <Arrow s={s} x1={N + H - 1 + 0.15} y1={H === 1 ? 70 : g.fc[H - 2]} x2={N + H - 0.1} y2={g.fc[H - 1]} color={C.gold} />}
        {ph === 'step' && H <= 3 && <Label s={s} x={N + H + 0.4} y={g.fc[H - 1] + 3} color={C.yellow} size={12}>{g.fc[H - 1].toFixed(2)}</Label>}
        {ph === 'phis' && curves.map((c, j) => <Line key={j} s={s} pts={[{ x: N, y: 70 }, ...c.fc.map((v, i) => ({ x: N + i + 1, y: v }))]} color={[C.teal, C.yellow, C.gold][j]} width={2.5} dash={j === 1 ? undefined : '6 3'} />)}
        {ph === 'phis' && curves.map((c, j) => <Label key={'l' + j} s={s} x={N + HG + 0.8} y={c.fc[HG - 1] + [-4, 3, 4][j]} color={[C.teal, C.yellow, C.gold][j]} size={12} anchor="end">φ = {c.phi}</Label>)}
        <Label s={s} x={N - 1} y={76} color={C.gold} size={12} anchor="end">today: 70</Label>
      </>}
    </Plot>;
    if (ph === 'pi' || ph === 'phis') {
      bottomTitle = ph === 'pi' ? '95% interval half-width by horizon (σ = 5): it grows, then levels off' : 'Gap to the mean (70 − 50 = 20) shrinking by a factor φ each day';
      bottom = ph === 'pi'
        ? <Plot x={[0.5, HG + 0.5]} y={[0, 16]} height={190} xLabel="days ahead h" yLabel="± half-width" xTicks={HG}>
          {(s) => <>
            <Seg s={s} x1={0.5} x2={HG + 0.5} y1={1.96 * SIG / Math.sqrt(1 - PHI * PHI)} y2={1.96 * SIG / Math.sqrt(1 - PHI * PHI)} color={C.green} dash="5 4" />
            <Bars s={s} data={g.hw.map((v, i) => ({ x: i + 1, y: v }))} width={0.6} color={C.yellow} />
            <Label s={s} x={HG + 0.4} y={1.96 * SIG / Math.sqrt(1 - PHI * PHI) + 1} anchor="end" color={C.green} size={12}>limit 1.96·σ/√(1−φ²) = {(1.96 * SIG / Math.sqrt(1 - PHI * PHI)).toFixed(1)}</Label>
          </>}
        </Plot>
        : <Plot x={[0.5, HG + 0.5]} y={[0, 21]} height={190} xLabel="days ahead h" yLabel="gap to mean" xTicks={HG}>
          {(s) => <>{[0.2, 0.6, 0.95].map((ph_, j) => <Bars key={j} s={s} data={Array.from({ length: HG }, (_, i) => ({ x: i + 1 + (j - 1) * 0.27, y: 20 * ph_ ** (i + 1) }))} width={0.25} color={[C.teal, C.yellow, C.gold][j]} />)}</>}
        </Plot>;
    } else {
      // cobweb on the lag plot: iterate y → 20 + 0.6y and bounce off the diagonal
      const lagPts = grid.slice(1).map((v, i) => ({ x: grid[i], y: v }));
      const web: Pt[] = [{ x: 70, y: 70 }];
      let cur = 70; for (let h = 0; h < H; h++) { const nx = 20 + PHI * cur; web.push({ x: cur, y: nx }, { x: nx, y: nx }); cur = nx; }
      bottomTitle = 'Lag plot: each day (yₜ, up) against the day before (yₜ₋₁, across). Yellow line = the AR(1) rule.';
      bottom = <Plot x={[30, 80]} y={[30, 80]} height={230} xLabel="yesterday yₜ₋₁" yLabel="today yₜ" xTicks={10}>
        {(s) => <>
          <Seg s={s} x1={30} x2={80} y1={30} y2={80} color={C.muted} width={1} dash="3 4" />
          <Dots s={s} pts={lagPts} r={3.5} animate={false} opacity={0.75} />
          <Seg s={s} x1={30} x2={80} y1={20 + PHI * 30} y2={20 + PHI * 80} color={C.yellow} width={2.5} />
          <Dots s={s} pts={[{ x: 50, y: 50 }]} color={C.green} r={6} animate={false} />
          {H > 0 && <Line s={s} pts={web} color={C.gold} width={2} />}
          {H > 0 && <Dots s={s} pts={web.filter((_, i) => i % 2 === 1)} color={C.yellow} r={4.5} animate={false} />}
          <Label s={s} x={79} y={20 + PHI * 79 - 7} anchor="end" color={C.yellow} size={12}>yₜ = 20 + 0.6·yₜ₋₁</Label>
          <Label s={s} x={66} y={75} anchor="end" color={C.muted} size={11}>yₜ = yₜ₋₁</Label>
        </>}
      </Plot>;
    }
    caption = ph === 'grid'
      ? <>A different series: a grid's daily peak demand follows <b>AR(1)</b>: today = 20 + 0.6 × yesterday + a random shock. The lag plot (bottom) shows the rule as the yellow line through the cloud of (yesterday, today) pairs. Today's peak was unusually high: <b>70</b>.</>
      : ph === 'step' && H === 1 ? <>Tomorrow: 20 + 0.6 × 70 = <b>62</b>. Future shocks are unknown, so we use their average, zero. On the lag plot: go up from 70 to the yellow line, then across to the diagonal to make 62 the new "yesterday".</>
        : ph === 'step' && H === 2 ? <>Day 2: 20 + 0.6 × 62 = <b>57.2</b>. The gap to 50 went 20 → 12 → 7.2: it shrinks by <b>40% every day</b> (multiplied by φ = 0.6).</>
          : ph === 'step' && H === 3 ? <>Day 3: 20 + 0.6 × 57.2 = <b>54.32</b>. The gold staircase on the lag plot is closing in on the green point where the yellow line meets the diagonal: the mean, 50.</>
            : ph === 'step' ? <>Two weeks of forecasts: the line <b>decays geometrically back to the mean</b> (day 7 ≈ {g.fc[6].toFixed(1)}, day 14 ≈ {g.fc[13].toFixed(2)}). An AR(1) forecast says: "today's surprise fades". Plan extra capacity for two or three days, not the whole month.</>
              : ph === 'pi' ? <>But how sure are we? Each future day adds a new unknown shock, so the <b>prediction interval</b> (dark = 80%, light = 95%) widens: ±{g.hw[0].toFixed(1)} tomorrow, ±{g.hw[2].toFixed(1)} on day 3, ±{g.hw[13].toFixed(1)} on day 14. Because old shocks fade too, the width <b>levels off</b> at the spread of the series itself.</>
                : <><b>φ sets the memory.</b> φ = 0.2 (teal) forgets almost at once; φ = 0.95 (gold) holds the surprise for weeks: after 14 days the gap is still {(20 * 0.95 ** 14).toFixed(1)} of the original 20. As φ → 1 the forecast stops returning at all: that is a random walk, which needs differencing.</>;
    read = [['φ', ph === 'phis' ? '0.2 / 0.6 / 0.95' : PHI], ['long-run mean', MU, C.green], ['forecast day 1', H > 0 || ph === 'pi' ? '62.0' : '–', C.yellow], [ph === 'pi' ? '95% PI day 14' : 'forecast day ' + Math.max(H, 1), ph === 'pi' ? `${g.fc[13].toFixed(1)} ± ${g.hw[13].toFixed(1)}` : H > 0 ? g.fc[H - 1].toFixed(2) : '–', C.yellow]];
    legend = ph === 'phis' ? [['φ = 0.2', C.teal], ['φ = 0.6', C.yellow], ['φ = 0.95', C.gold], ['mean', C.green]] : [['history', C.blue], ['forecast', C.yellow], ['mean', C.green], ...(ph === 'pi' ? [['prediction interval', C.yellow] as [string, string]] : [['iteration path', C.gold] as [string, string]])];
  } else {
    const show = 24, x0 = n - show, H = 18;
    const xs = Array.from({ length: H }, (_, i) => n + i + 1);
    title = 'ARIMA(1,1,0) on the sales: forecast the changes with AR(1), then add them up';
    top = <Plot x={[x0, n + H + 1]} y={[120, 300]} height={250} xLabel="month" yLabel="units">
      {(s) => <>
        <Band s={s} xs={xs} lo={ar.fc.map((v, i) => v - ar.hw[i])} hi={ar.fc.map((v, i) => v + ar.hw[i])} opacity={0.15} />
        {ph === 'drift' && <Band s={s} xs={xs} lo={arDrift.fc.map((v, i) => v - arDrift.hw[i])} hi={arDrift.fc.map((v, i) => v + arDrift.hw[i])} color={C.gold} opacity={0.08} />}
        <Line s={s} pts={sales.map((v, i) => ({ x: i + 1, y: v })).slice(x0)} color={C.blue} width={2} />
        <Dots s={s} pts={sales.map((v, i) => ({ x: i + 1, y: v })).slice(x0)} r={3.5} animate={false} />
        <Line s={s} pts={[{ x: n, y: 200 }, ...ar.fc.map((v, i) => ({ x: n + i + 1, y: v }))]} color={C.yellow} width={2.5} />
        <Dots s={s} pts={ar.fc.slice(0, 3).map((v, i) => ({ x: n + i + 1, y: v }))} color={C.yellow} r={5} animate={false} />
        <Seg s={s} x1={n} x2={n + H + 1} y1={210} y2={210} color={C.green} width={1.2} dash="4 4" />
        <Label s={s} x={n + H + 0.5} y={ph === 'drift' ? 196 : 224} color={C.green} size={12} anchor="end">levels off at 210</Label>
        {ph === 'drift' && <Line s={s} pts={[{ x: n, y: 200 }, ...arDrift.fc.map((v, i) => ({ x: n + i + 1, y: v }))]} color={C.gold} width={2.5} dash="6 3" />}
      </>}
    </Plot>;
    bottomTitle = 'Forecast monthly changes: the AR(1) part (φ = 0.5)';
    bottom = <Plot x={[x0, n + H + 1]} y={[-12, 16]} height={190} xLabel="month" yLabel="change">
      {(s) => <>
        <Seg s={s} x1={x0} x2={n + H + 1} y1={0} y2={0} color={C.muted} width={1} />
        <Bars s={s} data={dSales.map((v, i) => ({ x: i + 2, y: v })).slice(x0 - 1)} width={0.6} color={C.blue} />
        <Bars s={s} data={(ph === 'drift' ? arDrift : ar).dfc.map((v, i) => ({ x: n + i + 1, y: v }))} width={0.6} color={ph === 'drift' ? C.gold : C.yellow} />
        {ph === 'drift' && <Seg s={s} x1={n} x2={n + H + 1} y1={mean(dSales)} y2={mean(dSales)} color={C.green} dash="4 4" />}
      </>}
    </Plot>;
    caption = ph === 'arima'
      ? <>Back to the sales, last value 200, last change +10. The AR(1) model on changes forecasts <b>+5, +2.5, +1.25…</b> (bottom). Adding them up ("integrating") gives levels <b>205, 207.5, 208.75</b>, levelling off at <b>210</b>. Notice the interval: it <b>fans out without limit</b> (±{ar.hw[0].toFixed(0)} next month, ±{ar.hw[H - 1].toFixed(0)} after {H}), because every error is added up too.</>
      : <>This lesson model has no constant, so momentum fades and sales flatten. Add a <b>drift</b> (the average change, {f1(mean(dSales))} units/month, green) and the changes decay to the drift instead of zero: the gold forecast keeps climbing. <b>Choosing d and the constant decides the long-run shape of an ARIMA forecast.</b></>;
    read = [['model', ph === 'drift' ? 'ARIMA(1,1,0) + drift' : 'ARIMA(1,1,0)'], ['forecast +1, +2, +3', (ph === 'drift' ? arDrift : ar).fc.slice(0, 3).map((v) => v.toFixed(1)).join(', '), C.yellow], ['long run', ph === 'drift' ? `+${f1(mean(dSales))}/month` : '→ 210', C.green], [`95% PI at +${H}`, `±${(ph === 'drift' ? arDrift : ar).hw[H - 1].toFixed(0)}`, C.yellow]];
    legend = [['history', C.blue], ['forecast (no constant)', C.yellow], ...(ph === 'drift' ? [['forecast with drift', C.gold] as [string, string]] : []), ['long-run level', C.green]];
  }

  return (
    <div>
      <Layout
        main={<>
          <div className="small muted">{title}</div>
          {top}
          {bottomTitle && <div className="small muted" style={{ marginTop: 6 }}>{bottomTitle}</div>}
          {bottom}
        </>}
        side={<>
          <Readout items={read} />
          <Legend items={legend} />
          <p className="small muted" style={{ margin: 0 }}><b>ARIMA(p, d, q)</b>: difference <b>d</b> times until stationary, then predict from <b>p</b> past values (AR) and <b>q</b> past shocks (MA). Here p = 1, d = 0 or 1, q = 0.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caption}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
type Model = 'ar' | 'arima';
function Playground() {
  const [phi, setPhi] = useState(0.6);
  const [sigma, setSigma] = useState(5);
  const [H, setH] = useState(24);
  const [model, setModel] = useState<Model>('ar');
  const [diffAcf, setDiffAcf] = useState(false);
  const [seed, setSeed] = useState(3);
  const z = useMemo(() => { const r = rng(seed); return Array.from({ length: 80 }, () => gauss(r)); }, [seed]);
  const { y, x } = useMemo(() => {
    const x: number[] = [0];
    for (let t = 1; t < z.length; t++) x.push(phi * x[t - 1] + sigma * z[t]);
    if (model === 'ar') return { y: x.map((v) => 50 + v), x };
    const y = [100]; for (let t = 1; t < x.length; t++) y.push(y[t - 1] + x[t]);
    return { y, x };
  }, [z, phi, sigma, model]);
  const n = y.length;
  const fc = useMemo(() => {
    if (model === 'ar') { const f = ar1Fc(y[n - 1], 50, phi, sigma, H); return { ...f, hw80: f.hw.map((v) => v * 1.2816 / 1.96) }; }
    const f = arima110Fc(y[n - 1], x[n - 1], phi, sigma, H); return { fc: f.fc, hw: f.hw, hw80: f.hw.map((v) => v * 1.2816 / 1.96) };
  }, [y, x, n, phi, sigma, H, model]);
  const xs = Array.from({ length: H }, (_, i) => n + i + 1);
  const all = [...y, ...fc.fc.map((v, i) => v + fc.hw[i]), ...fc.fc.map((v, i) => v - fc.hw[i])];
  const lo = Math.min(...all), hi = Math.max(...all), padY = (hi - lo) * 0.06 + 1;
  const src = diffAcf ? y.slice(1).map((v, i) => v - y[i]) : y;
  const r = acf(src, 20);
  const halfLife = Math.abs(phi) > 0.001 && Math.abs(phi) < 1 ? Math.log(0.5) / Math.log(Math.abs(phi)) : NaN;
  return (
    <Layout
      main={<>
        <Plot x={[0, n + H + 1]} y={[lo - padY, hi + padY]} height={290} xLabel="time" yLabel="value">
          {(s) => <>
            <Band s={s} xs={xs} lo={fc.fc.map((v, i) => v - fc.hw[i])} hi={fc.fc.map((v, i) => v + fc.hw[i])} opacity={0.14} />
            <Band s={s} xs={xs} lo={fc.fc.map((v, i) => v - fc.hw80[i])} hi={fc.fc.map((v, i) => v + fc.hw80[i])} opacity={0.2} />
            {model === 'ar' && <Seg s={s} x1={0} x2={n + H + 1} y1={50} y2={50} color={C.green} dash="6 4" width={1.5} />}
            <Line s={s} pts={toPts(y, 1)} color={C.blue} width={1.6} />
            <Dots s={s} pts={toPts(y, 1)} r={2.8} animate={false} />
            <Line s={s} pts={[{ x: n, y: y[n - 1] }, ...fc.fc.map((v, i) => ({ x: n + i + 1, y: v }))]} color={C.yellow} width={2.5} />
          </>}
        </Plot>
        <AcfBars r={r} n={src.length} height={180} title={`ACF of the ${diffAcf ? 'differenced series Δy' : 'series y'}`} />
      </>}
      side={<>
        <Choice label="Model" value={model} onChange={setModel} options={[{ value: 'ar', label: 'AR(1), d = 0' }, { value: 'arima', label: 'ARIMA(1,1,0)' }]} />
        <Slider label="φ" min={-0.9} max={0.99} step={0.01} value={phi} onChange={setPhi} format={(v) => v.toFixed(2)} />
        <Slider label="shock SD σ" min={1} max={10} step={0.5} value={sigma} onChange={setSigma} format={(v) => v.toFixed(1)} />
        <Slider label="horizon" min={4} max={40} value={H} onChange={setH} />
        <Toggle label="ACF of the differences" value={diffAcf} onChange={setDiffAcf} />
        <button className="btn" onClick={() => setSeed(seed + 1)}>🎲 New shocks</button>
        <Readout items={[
          ['half-life (steps)', isFinite(halfLife) ? halfLife.toFixed(1) : '–'],
          ['95% PI, h = 1', '±' + fc.hw[0].toFixed(1), C.yellow],
          [`95% PI, h = ${H}`, '±' + fc.hw[H - 1].toFixed(1), C.yellow],
          ['ACF lag 1', r[0].toFixed(2), C.blue],
        ]} />
        <Legend items={[['simulated history', C.blue], ['forecast + 80/95% PI', C.yellow], ...(model === 'ar' ? [['mean 50', C.green] as [string, string]] : [])]} />
        <p className="small muted" style={{ margin: 0 }}>Half-life = steps for a surprise to halve: ln 0.5 / ln |φ|. With d = 1 the interval never stops growing.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Three acts: **differencing** turns a trending sales series stationary; an **AR(1)** forecast of grid demand decays from 70 back to the mean of 50 with growing intervals; then **ARIMA(1,1,0)** combines both, as in the lesson.', steps: [
      { do: 'Step through the first four frames.', notice: 'The level\'s mean moves and its ACF stays high; the monthly changes have a flat mean and an ACF that dies out after a lag or two.' },
      { do: 'Step through the grid-demand frames and watch the lag plot.', notice: 'Forecasts 62, 57.2, 54.32… form a gold staircase between the AR line and the diagonal, converging on 50.' },
      { do: 'Compare the interval in the AR(1) frame with the ARIMA frame.', notice: 'AR(1) intervals level off; once the series is integrated (d = 1) they fan out forever.' },
    ] },
    Playground: { what: 'Simulate an AR(1) or ARIMA(1,1,0) series with your own φ and shock size, and see its forecast, 80% / 95% intervals and ACF.', steps: [
      { do: 'With **AR(1)**, drag **φ** from 0 to 0.95.', notice: 'The series wanders longer before returning, the ACF decays more slowly, and the forecast takes longer to reach 50 (half-life grows).' },
      { do: 'Set **φ** negative, around −0.7.', notice: 'The series zig-zags, the ACF alternates sign, and the forecast oscillates around the mean.' },
      { do: 'Switch to **ARIMA(1,1,0)** and turn on **ACF of the differences**.', notice: 'The level ACF stays high (non-stationary) but the differences look like a clean AR(1). The 95% interval keeps widening with the horizon.' },
    ] },
  },
};
export default anim;
