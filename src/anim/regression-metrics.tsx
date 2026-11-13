// Regression metrics built residual by residual: MAE vs RMSE (squared errors drawn as real squares), R² against the mean baseline,
// and what a single outlier does to each number.
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Dots, Seg, Label, Caption, Readout, Choice, Slider, Toggle, Layout, Legend, useStepPlayer, PlayerControls, C, Scales } from '../viz/kit';
import { mean } from '../viz/math';

/* ---------- pure helpers ---------- */
type Row = { x: number; y: number; yhat: number };
function metrics(rows: Row[]) {
  const e = rows.map((r) => r.y - r.yhat), ybar = mean(rows.map((r) => r.y));
  const sse = e.reduce((s, v) => s + v * v, 0), sst = rows.reduce((s, r) => s + (r.y - ybar) ** 2, 0);
  const mae = mean(e.map(Math.abs)), mse = sse / rows.length;
  return { e, mae, mse, rmse: Math.sqrt(mse), sse, sst, r2: sst > 0 ? 1 - sse / sst : 0, ybar, mape: 100 * mean(rows.map((r) => Math.abs(r.y - r.yhat) / Math.max(1e-9, Math.abs(r.y)))) };
}
/** Draw the squared error of one point as an actual square (side = |miss| in y-units, converted to pixels). */
function Square({ s, x, y, yhat, color = C.red, opacity = 0.18, left = false }: { s: Scales; x: number; y: number; yhat: number; color?: string; opacity?: number; left?: boolean }) {
  const top = Math.min(s.sy(y), s.sy(yhat)), side = Math.abs(s.sy(y) - s.sy(yhat));
  return <rect x={left ? s.sx(x) - side : s.sx(x)} y={top} width={side} height={side} fill={color} fillOpacity={opacity} stroke={color} strokeOpacity={0.7} />;
}
const r2c = (v: number) => (v < 0 ? C.red : C.green);

/* ---------- Animate (spare-parts demand at a car dealership) ---------- */
const ACT = [120, 95, 150, 80, 105], FC = [110, 100, 140, 90, 130], FC_OUT = [110, 100, 140, 90, 165];
type Fr = { upto: number; mae?: boolean; rmse?: boolean; base?: boolean; r2?: boolean; outlier?: boolean; sum?: boolean };

function ErrBars({ vals, upto, cap, line, lineLabel, col, yLabel, hi }: { vals: number[]; upto: number; cap: number; line?: number; lineLabel?: string; col: string; yLabel: string; hi?: number }) {
  return (
    <Plot x={[0.4, 5.6]} y={[0, cap]} height={200} width={380} xLabel="month" yLabel={yLabel} xTicks={5} yTicks={4}>
      {(s) => <>
        {vals.map((v, i) => i <= upto ? <g key={i}>
          <rect x={s.sx(i + 1 - 0.3)} width={s.sx(i + 1.3) - s.sx(i + 0.7)} y={s.sy(Math.min(v, cap))} height={Math.max(0, s.sy(0) - s.sy(Math.min(v, cap)))} fill={i === hi ? C.gold : col} rx={2} />
          <Label s={s} x={i + 1} y={Math.min(v, cap * 0.88) + cap * 0.04} anchor="middle" size={11}>{Math.round(v)}</Label>
        </g> : null)}
        {line !== undefined && <><Seg s={s} x1={0.4} x2={5.6} y1={Math.min(line, cap)} y2={Math.min(line, cap)} color={C.text} dash="6 4" /><Label s={s} x={0.48} y={cap * 0.9} size={12}>- - {lineLabel}</Label></>}
      </>}
    </Plot>
  );
}

function Animate() {
  const frames: Fr[] = [
    { upto: -1 }, { upto: 0 }, { upto: 1 }, { upto: 2 }, { upto: 3 }, { upto: 4 },
    { upto: 4, mae: true }, { upto: 4, mae: true, rmse: true }, { upto: 4, mae: true, rmse: true, base: true }, { upto: 4, mae: true, rmse: true, base: true, r2: true },
    { upto: 4, mae: true, rmse: true, outlier: true }, { upto: 4, mae: true, rmse: true, outlier: true, base: true, r2: true }, { upto: 4, mae: true, rmse: true, sum: true },
  ];
  const p = useStepPlayer(frames.length, 1800);
  const f = frames[p.i];
  const fc = f.outlier ? FC_OUT : FC;
  const rows: Row[] = ACT.map((y, i) => ({ x: i + 1, y, yhat: fc[i] }));
  const m = metrics(rows), m0 = metrics(ACT.map((y, i) => ({ x: i + 1, y, yhat: FC[i] })));
  const shown = rows.slice(0, f.upto + 1), ms = shown.length ? metrics(shown) : undefined;
  const abs = m.e.map(Math.abs), sq = m.e.map((v) => v * v);
  const share = (sq[4] / m.sse) * 100;
  const caps: React.ReactNode[] = [
    <>Five months of demand for a brake-pad kit at a car dealership. <b style={{ color: C.green }}>Green = what customers actually bought</b>, <b style={{ color: C.yellow }}>yellow = the forecast</b>. How good is the forecast? We will build three metrics one residual at a time.</>,
    ...ACT.map((a, i) => {
      const e = a - FC[i];
      return <>Month {i + 1}: actual {a}, forecast {FC[i]}, so the miss is <b>{e > 0 ? '+' : ''}{e}</b> units (red line). Absolute error = <b>{Math.abs(e)}</b> (left bar). Squared error = {Math.abs(e)}² = <b>{e * e}</b>, drawn as a real square on the chart{i === 4 ? <>: notice how much bigger the month-5 square is than the others</> : ''}.</>;
    }),
    <><b>MAE</b> = average of the absolute errors = (10 + 5 + 10 + 10 + 25) / 5 = <b>{m0.mae} units</b>. Every unit of miss counts the same: "we are off by about 12 kits a month".</>,
    <><b>MSE</b> = average square = 950 / 5 = {m0.mse}; <b>RMSE</b> = √190 = <b>{m0.rmse.toFixed(2)} units</b>. RMSE is higher than MAE because squaring lets the big month-5 miss dominate: it supplies <b>{share.toFixed(0)}%</b> of all squared error.</>,
    <>Is 950 big or small? Compare with a lazy baseline that always predicts the <b style={{ color: C.green }}>average demand, {m0.ybar}</b> (dashed). Its squared misses (grey squares) add up to <b>{m0.sst.toLocaleString()}</b>.</>,
    <><b>R² = 1 − 950 / 2,850 = {m0.r2.toFixed(2)}</b>. The forecast removes two-thirds of the squared error of the "always say {m0.ybar}" rule. R² = 0 means no better than the mean; R² = 1 means perfect.</>,
    <>Now one bad month: a cancelled fleet order, and month 5 is forecast at <b>165</b> instead of 130 (miss −60). MAE rises from {m0.mae} to <b>{m.mae}</b> (+{((m.mae / m0.mae - 1) * 100).toFixed(0)}%), but RMSE jumps from {m0.rmse.toFixed(1)} to <b>{m.rmse.toFixed(1)}</b> (+{((m.rmse / m0.rmse - 1) * 100).toFixed(0)}%). One square of 3,600 swamps everything.</>,
    <>And R² = 1 − {m.sse.toLocaleString()} / 2,850 = <b style={{ color: C.red }}>{m.r2.toFixed(2)}</b>: <b>negative</b>. With that one miss the forecast is now worse than simply predicting the average every month.</>,
    <><b>Summary.</b> MAE: typical miss, robust to one-offs. RMSE: punishes big misses, use it when one large miss is costly (stock-outs). R²: improvement over the mean, unitless. When RMSE is much bigger than MAE, look for a few large misses.</>,
  ];
  const yr: [number, number] = [50, 175];
  return (
    <div>
      <Layout
        main={<>
          <Plot x={[0.3, 6.6]} y={yr} height={330} xLabel="month" yLabel="brake-pad kits sold (units)" xTicks={6} fx={(v) => (v >= 1 && v <= 5 && Number.isInteger(v) ? String(v) : '')}>
            {(s) => <>
              {f.base && <Seg s={s} x1={0.3} x2={6.6} y1={m0.ybar} y2={m0.ybar} color={C.green} dash="7 5" />}
              {f.base && rows.map((r, i) => <g key={'b' + i}><Square s={s} x={r.x} y={r.y} yhat={m0.ybar} color={C.grey} opacity={0.25} left /><Seg s={s} x1={r.x} x2={r.x} y1={r.y} y2={m0.ybar} color={C.grey} width={2} /></g>)}
              <path d={rows.map((r, i) => `${i ? 'L' : 'M'}${s.sx(r.x)},${s.sy(r.yhat)}`).join('')} fill="none" stroke={C.yellow} strokeWidth={1.5} strokeDasharray="4 4" opacity={0.7} />
              {rows.map((r, i) => i <= f.upto && !f.base ? <Square key={'q' + i} s={s} x={r.x} y={r.y} yhat={r.yhat} opacity={i === f.upto && !f.mae ? 0.35 : 0.18} /> : null)}
              {rows.map((r, i) => i <= f.upto ? <Seg key={'e' + i} s={s} x1={r.x} x2={r.x} y1={r.y} y2={r.yhat} color={C.red} width={3} /> : null)}
              <Dots s={s} pts={rows.map((r) => ({ x: r.x, y: r.yhat }))} color={C.yellow} r={6} />
              <Dots s={s} pts={rows.map((r) => ({ x: r.x, y: r.y }))} color={C.green} r={6} />
              {f.base && <Label s={s} x={5.4} y={m0.ybar + 3} color={C.green} size={12}>mean {m0.ybar}</Label>}
              {rows.map((r, i) => i <= f.upto && !f.base ? <Label key={'l' + i} s={s} x={r.x - 0.08} y={(r.y + r.yhat) / 2} anchor="end" size={12} color={C.red}>{r.y - r.yhat > 0 ? '+' : ''}{r.y - r.yhat}</Label> : null)}
            </>}
          </Plot>
          <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 300px', minWidth: 0 }}><ErrBars vals={abs} upto={f.upto} cap={65} col={C.red} yLabel="|error| (units)" line={f.mae ? m.mae : undefined} lineLabel={`MAE ${fmtN(m.mae)}`} hi={f.outlier ? 4 : undefined} /></div>
            <div style={{ flex: '1 1 300px', minWidth: 0 }}><ErrBars vals={sq} upto={f.upto} cap={f.outlier ? 4200 : 700} col={C.red} yLabel="error² (units²)" line={f.rmse ? m.mse : undefined} lineLabel={`MSE ${fmtN(m.mse)} → RMSE ${m.rmse.toFixed(1)}`} hi={f.outlier ? 4 : undefined} /></div>
          </div>
        </>}
        side={<>
          <Readout items={[
            ['MAE', ms ? fmtN(ms.mae) : '–', C.red],
            ['RMSE', ms ? ms.rmse.toFixed(2) : '–', C.red],
            ['RMSE / MAE', ms && ms.mae > 0 ? (ms.rmse / ms.mae).toFixed(2) : '–'],
            ['MAPE', ms ? ms.mape.toFixed(1) + '%' : '–'],
            ['SSE (model)', ms ? Math.round(ms.sse).toLocaleString() : '–', C.red],
            ['SST (mean baseline)', f.base || f.sum ? m.sst.toLocaleString() : '–', C.grey],
            ['R²', f.r2 || f.sum ? m.r2.toFixed(2) : '–', r2c(m.r2)],
          ]} />
          <Legend items={[['actual', C.green], ['forecast', C.yellow], ['miss / squared miss', C.red], ['miss of the mean baseline', C.grey]]} />
          <p className="small muted" style={{ margin: 0 }}>Each red square has side = the miss, so its area is the squared error. RMSE is the side of the "average square".</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caps[p.i]}</Caption>
    </div>
  );
}
const fmtN = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

/* ---------- Playground ---------- */
type Fit = 'ls' | 'lad' | 'mean';
// Weekly sales vs ad spend for 15 stores; store #12 is where the outlier slider acts.
const XS = [1, 1.6, 2.2, 2.9, 3.4, 4.1, 4.7, 5.2, 5.9, 6.5, 7.1, 7.8, 8.4, 9.1, 9.7];
const NOISE = [1.8, -2.4, 0.9, 2.6, -1.1, -2.9, 1.4, 0.3, -1.9, 2.2, -0.6, 1.1, -2.1, 0.7, -1.4];
const OUT = 11;
function lineFit(xs: number[], ys: number[], kind: Fit) {
  if (kind === 'mean') return { a: mean(ys), b: 0 };
  let w = xs.map(() => 1), a = 0, b = 0;
  for (let it = 0; it < (kind === 'ls' ? 1 : 60); it++) {
    const W = w.reduce((s, v) => s + v, 0), mx = xs.reduce((s, x, i) => s + w[i] * x, 0) / W, my = ys.reduce((s, y, i) => s + w[i] * y, 0) / W;
    const sxy = xs.reduce((s, x, i) => s + w[i] * (x - mx) * (ys[i] - my), 0), sxx = xs.reduce((s, x, i) => s + w[i] * (x - mx) ** 2, 0);
    b = sxy / sxx; a = my - b * mx;
    w = xs.map((x, i) => 1 / Math.max(0.05, Math.abs(ys[i] - a - b * x))); // IRLS for least absolute deviations
  }
  return { a, b };
}

function Playground() {
  const [out, setOut] = useState(0);
  const [kind, setKind] = useState<Fit>('ls');
  const [squares, setSquares] = useState(true);
  const ys = useMemo(() => XS.map((x, i) => 12 + 3 * x + NOISE[i] + (i === OUT ? out : 0)), [out]);
  const { a, b } = useMemo(() => lineFit(XS, ys, kind), [ys, kind]);
  const rows: Row[] = XS.map((x, i) => ({ x, y: ys[i], yhat: a + b * x }));
  const m = metrics(rows);
  const top = Math.max(55, 12 + 3 * 8.4 + out + 6);
  const outShare = (m.e[OUT] ** 2 / Math.max(1e-9, m.sse)) * 100;
  return (
    <Layout
      main={<Plot x={[0, 10.5]} y={[0, top]} height={430} xLabel="ad spend (₹ thousand per week)" yLabel="weekly sales (₹ thousand)">
        {(s) => <>
          <Seg s={s} x1={0} x2={10.5} y1={a} y2={a + b * 10.5} color={C.yellow} width={3} />
          <Seg s={s} x1={0} x2={10.5} y1={m.ybar} y2={m.ybar} color={C.green} dash="6 5" width={1.5} />
          {squares && rows.map((r, i) => <Square key={'q' + i} s={s} x={r.x} y={r.y} yhat={r.yhat} opacity={i === OUT ? 0.3 : 0.15} />)}
          {rows.map((r, i) => <Seg key={i} s={s} x1={r.x} x2={r.x} y1={r.y} y2={r.yhat} color={C.red} width={2} />)}
          <Dots s={s} pts={rows} color={(i) => (i === OUT && out !== 0 ? C.gold : C.blue)} r={6} />
        </>}
      </Plot>}
      side={<>
        <Slider label="outlier on store 12" min={-30} max={60} value={out} onChange={setOut} format={(v) => (v > 0 ? '+' : '') + v} />
        <Choice label="Line fitted by" value={kind} onChange={setKind} options={[{ value: 'ls', label: 'Least squares' }, { value: 'lad', label: 'Least absolute' }, { value: 'mean', label: 'Mean only' }]} />
        <Toggle label="draw squared errors as squares" value={squares} onChange={setSquares} />
        <Readout items={[
          ['MAE', m.mae.toFixed(2), C.red], ['RMSE', m.rmse.toFixed(2), C.red],
          ['RMSE / MAE', (m.rmse / Math.max(1e-9, m.mae)).toFixed(2)], ['R²', m.r2.toFixed(3), r2c(m.r2)],
          ['MAPE', m.mape.toFixed(1) + '%'], ['store 12 share of SSE', outShare.toFixed(0) + '%', C.gold],
        ]} />
        <Legend items={[['stores', C.blue], ['outlier store', C.gold], ['model line', C.yellow], ['mean baseline', C.green], ['misses', C.red]]} />
        <p className="small muted" style={{ margin: 0 }}>Least squares minimises RMSE, so a big square drags the line towards it. Least absolute deviations minimises MAE and barely moves.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Five months of dealership demand vs forecast. Each miss becomes an **absolute error** (bar) and a **squared error** (a real square). Then the metrics are compared with a "predict the mean" baseline, and one outlier is added.', steps: [
      { do: 'Step through months 1–5.', notice: 'The absolute bars are similar, but month 5\'s square is far larger than the rest: squaring magnifies big misses.' },
      { do: 'Continue to the MAE, RMSE and R² frames.', notice: 'MAE = 12, RMSE ≈ 13.8, R² ≈ 0.67. RMSE > MAE because of the one big miss.' },
      { do: 'Watch the outlier frames.', notice: 'One miss of 60 raises MAE by 58% but more than doubles RMSE, and R² turns negative: worse than predicting the mean.' },
    ] },
    Playground: { what: 'Fifteen stores, a fitted line and its residuals. Drag one store into an outlier and switch between lines fitted by least squares, least absolute deviations or just the mean.', steps: [
      { do: 'Drag **outlier on store 12** up to +60 with **Least squares**.', notice: 'Its square dominates, RMSE climbs much faster than MAE, and the yellow line tilts towards the outlier.' },
      { do: 'Switch to **Least absolute**.', notice: 'The line ignores the outlier and stays with the other 14 stores; MAE is lower, RMSE higher.' },
      { do: 'Choose **Mean only**.', notice: 'R² is exactly 0: R² measures improvement over this flat line.' },
    ] },
  },
};
export default anim;
