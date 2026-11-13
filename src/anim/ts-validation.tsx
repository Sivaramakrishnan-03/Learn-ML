// Forecast validation: rolling-origin backtesting. Train only on the past, forecast the next h months, score, slide the
// origin forward, repeat; then compare the model's errors with a seasonal-naive baseline.
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Bars, Dots, Seg, Label, Region, Caption, Readout, Slider, Choice, Layout, Legend, useStepPlayer, PlayerControls, rng, gauss, C, Scales } from '../viz/kit';
import { SWEETS_SEASON, holtWinters, holt, ses, pathD, mean, wape, toPts, Pt } from './_ts-helpers';

/* ---------- pure helpers ---------- */
function Line({ s, pts, color, width = 2, dash, opacity = 1 }: { s: Scales; pts: Pt[]; color: string; width?: number; dash?: string; opacity?: number }) {
  return <path d={pathD(s.sx, s.sy, pts)} fill="none" stroke={color} strokeWidth={width} strokeDasharray={dash} opacity={opacity} strokeLinejoin="round" />;
}
/** Monthly demand: trend + festive season + a slowly wandering level (random walk) + noise, so errors grow with the horizon. */
function demandSeries(n = 60, seed = 8) {
  const r = rng(seed); let w = 0;
  return Array.from({ length: n }, (_, t) => { w += 4 * gauss(r); return 300 + 1.5 * t + 2.5 * SWEETS_SEASON[t % 12] + w + 6 * gauss(r); });
}
type Model = 'hw' | 'holt' | 'ses';
const MODEL_LABEL: Record<Model, string> = { hw: 'Holt-Winters', holt: 'Holt', ses: 'Simple smoothing' };
function forecast(train: number[], h: number, model: Model) {
  if (model === 'hw') return holtWinters(train, 0.3, 0.05, 0.2, 12, h).fut;
  if (model === 'holt') return holt(train, 0.3, 0.1, h).fut;
  const f = ses(train, 0.3); return Array(h).fill(f[f.length - 1]);
}
const seasonalNaive = (train: number[], h: number) => Array.from({ length: h }, (_, j) => train[train.length - 12 + (j % 12)]);

interface Win { o: number; trainStart: number; act: number[]; fm: number[]; fb: number[]; wm: number; wb: number }
/** Rolling-origin backtest: origins o (= size of the training history) from `init`, every `step`, horizon h. */
function backtest(y: number[], { init, h, step, model, sliding }: { init: number; h: number; step: number; model: Model; sliding: boolean }): Win[] {
  const out: Win[] = [];
  for (let o = init; o + h <= y.length; o += step) {
    const trainStart = sliding ? o - init : 0;
    const train = y.slice(trainStart, o), act = y.slice(o, o + h);
    const fm = forecast(train, h, model), fb = seasonalNaive(train, h);
    out.push({ o, trainStart, act, fm, fb, wm: wape(act, fm), wb: wape(act, fb) });
  }
  return out;
}
/** Hyndman-style diagram: one row per window, a dot per month coloured train / test / unused. */
function Diagram({ wins, n, upto, height = 230, randomTest, highlightLast = true }: { wins: Win[]; n: number; upto: number; height?: number; randomTest?: Set<number>; highlightLast?: boolean }) {
  const rows = randomTest ? 1 : wins.length;
  const r = Math.max(1.6, Math.min(4.5, 120 / Math.max(rows, 1) / 1.3, 760 / n / 3));
  return <Plot x={[0, n + 1]} y={[0.3, Math.max(rows, 1) + 0.7]} height={height} xLabel="month" yLabel={randomTest ? '' : 'window'} fy={(v) => (Number.isInteger(v) && v >= 1 && v <= rows ? String(rows - v + 1) : '')} yTicks={Math.min(rows, 12)} grid={false}>
    {(s) => <>
      {randomTest
        ? <Dots s={s} pts={Array.from({ length: n }, (_, t) => ({ x: t + 1, y: 1 }))} r={r} color={(t) => (randomTest.has(t) ? C.red : C.blue)} animate={false} />
        : wins.slice(0, upto).map((w, k) => {
          const yRow = rows - k;
          return <g key={k}>
            {highlightLast && k === upto - 1 && <Region s={s} x0={0.3} x1={n + 0.7} y0={yRow - 0.45} y1={yRow + 0.45} color={C.gold} opacity={0.12} />}
            <Dots s={s} pts={Array.from({ length: n }, (_, t) => ({ x: t + 1, y: yRow }))} r={r} animate={false}
              color={(t) => (t >= w.trainStart && t < w.o ? C.blue : t >= w.o && t < w.o + w.act.length ? C.red : '#2a3242')} />
          </g>;
        })}
    </>}
  </Plot>;
}

/* ---------- Animate ---------- */
const N = 60, INIT = 24, HZ = 3, STEP = 3;
const fYear = (v: number) => (v % 12 === 0 ? `Y${v / 12 + 1}` : '');

function Animate() {
  const y = useMemo(() => demandSeries(N), []);
  const wins = useMemo(() => backtest(y, { init: INIT, h: HZ, step: STEP, model: 'hw', sliding: false }), [y]);
  const winsS = useMemo(() => backtest(y, { init: INIT, h: HZ, step: STEP, model: 'hw', sliding: true }), [y]);
  const randomTest = useMemo(() => { const r = rng(5); const s = new Set<number>(); while (s.size < 12) s.add(Math.floor(r() * N)); return s; }, []);
  const K = wins.length;
  const frames = [{ kind: 'random' as const, k: 0 }, ...wins.map((_, k) => ({ kind: 'win' as const, k: k + 1 })), { kind: 'summary' as const, k: K }, { kind: 'sliding' as const, k: K }];
  const p = useStepPlayer(frames.length, 1900);
  const fr = frames[p.i];
  const set = fr.kind === 'sliding' ? winsS : wins;
  const cur = fr.kind === 'win' ? wins[fr.k - 1] : null;
  const done = set.slice(0, fr.k);
  const avgM = mean(done.map((w) => w.wm)), avgB = mean(done.map((w) => w.wb));
  const beat = done.filter((w) => w.wm < w.wb).length;
  const yMin = Math.min(...y) - 15, yMax = Math.max(...y) + 15;
  const errMax = Math.max(6, ...wins.map((w) => Math.max(w.wm, w.wb)), ...winsS.map((w) => Math.max(w.wm, w.wb))) * 1.15;

  const caption = fr.kind === 'random'
    ? <>The <b>wrong</b> way: pick 12 random months as a test set (red), as you would for ordinary data. The model then trains on months <b>after</b> the ones it predicts: it has seen the future. Errors look great on paper and disappoint in production. Time series need a <b>time-ordered</b> test.</>
    : fr.kind === 'win' && cur
      ? fr.k === 1
        ? <>Window 1: pretend today is the end of month {cur.o}. Train Holt-Winters on months 1–{cur.o} only (blue), forecast months {cur.o + 1}–{cur.o + HZ} (red), then compare with what actually happened. Model WAPE <b>{cur.wm.toFixed(1)}%</b> vs seasonal naive (same month last year) <b>{cur.wb.toFixed(1)}%</b>.</>
        : fr.k <= 3
          ? <>Window {fr.k}: move the forecast date forward {STEP} months and repeat. The training set <b>grows</b> (months 1–{cur.o}); the test is always the next {HZ} months. Model <b>{cur.wm.toFixed(1)}%</b>, baseline <b>{cur.wb.toFixed(1)}%</b>.</>
          : <>Window {fr.k} of {K} (months 1–{cur.o} → {cur.o + 1}–{cur.o + HZ}). Model <b>{cur.wm.toFixed(1)}%</b>, baseline <b>{cur.wb.toFixed(1)}%</b>. {cur.wm > cur.wb ? <b>This time the baseline wins:</b> : 'The staircase in the diagram is the backtest: every row is one "live" forecast we could have made in the past.'}{cur.wm > cur.wb ? ' one window proves nothing, which is why we test many.' : ''}</>
      : fr.kind === 'summary'
        ? <>Across <b>{K} forecast dates</b>: average WAPE <b>{avgM.toFixed(1)}%</b> for Holt-Winters vs <b>{avgB.toFixed(1)}%</b> for seasonal naive, and the model wins {beat} of {K} windows. That relative skill (1 − {avgM.toFixed(1)} / {avgB.toFixed(1)} = <b>{(100 * (1 - avgM / avgB)).toFixed(0)}%</b> better) is the honest number to show the business.</>
        : <>Variant: a <b>sliding</b> window keeps the training length fixed at {INIT} months and drops the oldest data (useful when old history is no longer relevant). Here the average WAPE is <b>{avgM.toFixed(1)}%</b> (expanding: {mean(wins.map((w) => w.wm)).toFixed(1)}%). Either way the golden rule holds: <b>train only on the past</b>.</>;

  return (
    <div>
      <Layout
        main={<>
          <div className="small muted">Monthly demand for an auto part (units). Blue = training data, red = test months, yellow = model forecast, purple = seasonal-naive forecast</div>
          <Plot x={[0, N + 1]} y={[yMin, yMax]} height={230} xLabel="month" yLabel="units">
            {(s) => <>
              {cur && <Region s={s} x0={cur.trainStart + 0.5} x1={cur.o + 0.5} color={C.blue} opacity={0.08} />}
              {cur && <Region s={s} x0={cur.o + 0.5} x1={cur.o + HZ + 0.5} color={C.red} opacity={0.15} />}
              <Line s={s} pts={toPts(y, 1)} color={C.blue} width={1.5} opacity={cur ? 0.35 : 0.8} />
              {cur && <Line s={s} pts={toPts(y.slice(0, cur.o), 1)} color={C.blue} width={2} />}
              <Dots s={s} pts={toPts(y, 1)} r={3} animate={false} color={(t) => (fr.kind === 'random' ? (randomTest.has(t) ? C.red : C.blue) : cur ? (t < cur.o ? C.blue : t < cur.o + HZ ? C.red : '#3a4456') : C.blue)} />
              {cur && <Line s={s} pts={cur.fb.map((v, j) => ({ x: cur.o + j + 1, y: v }))} color={C.purple} width={2} dash="4 3" />}
              {cur && <Dots s={s} pts={cur.fb.map((v, j) => ({ x: cur.o + j + 1, y: v }))} color={C.purple} r={4.5} animate={false} />}
              {cur && <Line s={s} pts={cur.fm.map((v, j) => ({ x: cur.o + j + 1, y: v }))} color={C.yellow} width={2.5} />}
              {cur && <Dots s={s} pts={cur.fm.map((v, j) => ({ x: cur.o + j + 1, y: v }))} color={C.yellow} r={4.5} animate={false} />}
              {cur && cur.act.map((a, j) => <Seg key={j} s={s} x1={cur.o + j + 1} x2={cur.o + j + 1} y1={a} y2={cur.fm[j]} color={C.red} width={2} />)}
              {cur && <Label s={s} x={cur.o + 0.3} y={yMax - 10} color={C.gold} size={12} anchor="end">forecast date ▸</Label>}
            </>}
          </Plot>
          <div className="small muted" style={{ marginTop: 6 }}>{fr.kind === 'random' ? 'Random split: test months scattered through history' : fr.kind === 'sliding' ? 'Sliding-window backtest: fixed 24-month training window' : 'Rolling-origin backtest (expanding window): one row per forecast date'}</div>
          <Diagram wins={set} n={N} upto={fr.k} height={fr.kind === 'random' ? 110 : 230} randomTest={fr.kind === 'random' ? randomTest : undefined} />
          <div className="small muted" style={{ marginTop: 6 }}>WAPE per window (%): model (yellow) vs seasonal naive (purple)</div>
          <Plot x={[0.3, K + 2]} y={[0, errMax]} height={170} xLabel="window" yLabel="WAPE %" xTicks={K} fx={(v) => (v >= 1 && v <= K ? String(v) : "")}>
            {(s) => <>
              <Bars s={s} data={done.map((w, k) => ({ x: k + 1 - 0.18, y: w.wm }))} width={0.34} color={C.yellow} />
              <Bars s={s} data={done.map((w, k) => ({ x: k + 1 + 0.18, y: w.wb }))} width={0.34} color={C.purple} />
              {(fr.kind === 'summary' || fr.kind === 'sliding') && <>
                <Seg s={s} x1={0.3} x2={K + 2} y1={avgM} y2={avgM} color={C.yellow} dash="6 4" />
                <Seg s={s} x1={0.3} x2={K + 2} y1={avgB} y2={avgB} color={C.purple} dash="6 4" />
                <Label s={s} x={K + 1.95} y={avgB + errMax * 0.03} anchor="end" color={C.purple} size={12}>avg {avgB.toFixed(1)}%</Label>
                <Label s={s} x={K + 1.95} y={avgM + errMax * 0.03} anchor="end" color={C.yellow} size={12}>avg {avgM.toFixed(1)}%</Label>
              </>}
              {fr.kind === 'random' && <Label s={s} x={K / 2} y={errMax / 2} anchor="middle" color={C.muted} size={13}>no honest errors from a random split</Label>}
            </>}
          </Plot>
        </>}
        side={<>
          <Readout items={[
            ['windows tested', fr.kind === 'random' ? '–' : `${done.length} / ${K}`],
            ['training months', cur ? `${cur.trainStart + 1}–${cur.o}` : fr.kind === 'sliding' ? '24 (sliding)' : fr.kind === 'summary' ? 'expanding' : 'shuffled!', C.blue],
            ['avg WAPE model', done.length ? avgM.toFixed(1) + '%' : '–', C.yellow],
            ['avg WAPE baseline', done.length ? avgB.toFixed(1) + '%' : '–', C.purple],
            ['model wins', done.length ? `${beat} of ${done.length}` : '–', C.gold],
          ]} />
          <Legend items={[['train', C.blue], ['test', C.red], ['model forecast', C.yellow], ['seasonal naive', C.purple], ['not yet seen', '#3a4456']]} />
          <p className="small muted" style={{ margin: 0 }}><b>WAPE</b> = Σ|actual − forecast| / Σ actual. A model is only worth deploying if it beats a simple baseline <b>across many forecast dates</b>, at the horizon the business uses (here {HZ} months).</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caption}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
function Playground() {
  const [h, setH] = useState(3);
  const [step, setStep] = useState(3);
  const [model, setModel] = useState<Model>('hw');
  const [sliding, setSliding] = useState<'exp' | 'slide'>('exp');
  const y = useMemo(() => demandSeries(N), []);
  const wins = useMemo(() => backtest(y, { init: INIT, h, step, model, sliding: sliding === 'slide' }), [y, h, step, model, sliding]);
  const K = wins.length;
  const avgM = mean(wins.map((w) => w.wm)), avgB = mean(wins.map((w) => w.wb));
  const beat = wins.filter((w) => w.wm < w.wb).length;
  const worst = Math.max(...wins.map((w) => w.wm));
  const errMax = Math.max(6, ...wins.map((w) => Math.max(w.wm, w.wb))) * 1.15;
  const last = wins[K - 1];
  return (
    <Layout
      main={<>
        <Plot x={[0, N + 1]} y={[Math.min(...y) - 15, Math.max(...y) + 15]} height={200} xLabel="month" yLabel="units">
          {(s) => <>
            <Line s={s} pts={toPts(y, 1)} color={C.blue} width={1.5} />
            <Dots s={s} pts={toPts(y, 1)} r={2.5} animate={false} />
            {wins.map((w, k) => <Line key={k} s={s} pts={w.fm.map((v, j) => ({ x: w.o + j + 1, y: v }))} color={C.yellow} width={2} opacity={0.8} />)}
            {last && <Line s={s} pts={last.fb.map((v, j) => ({ x: last.o + j + 1, y: v }))} color={C.purple} width={2} dash="4 3" />}
          </>}
        </Plot>
        <div className="small muted" style={{ marginTop: 6 }}>Backtest diagram ({K} windows): blue = train, red = test</div>
        <Diagram wins={wins} n={N} upto={K} height={Math.max(160, Math.min(300, 60 + K * 14))} highlightLast={false} />
        <div className="small muted" style={{ marginTop: 6 }}>WAPE per window: {MODEL_LABEL[model]} (yellow) vs seasonal naive (purple)</div>
        <Plot x={[0.3, K + 0.7]} y={[0, errMax]} height={170} xLabel="window" yLabel="WAPE %" xTicks={Math.min(K, 12)}>
          {(s) => <>
            <Bars s={s} data={wins.map((w, k) => ({ x: k + 1 - 0.18, y: w.wm }))} width={0.34} color={C.yellow} />
            <Bars s={s} data={wins.map((w, k) => ({ x: k + 1 + 0.18, y: w.wb }))} width={0.34} color={C.purple} />
            <Seg s={s} x1={0.3} x2={K + 0.7} y1={avgM} y2={avgM} color={C.yellow} dash="6 4" />
            <Seg s={s} x1={0.3} x2={K + 0.7} y1={avgB} y2={avgB} color={C.purple} dash="6 4" />
          </>}
        </Plot>
      </>}
      side={<>
        <Choice label="Model" value={model} onChange={setModel} options={[{ value: 'hw', label: 'Holt-Winters' }, { value: 'holt', label: 'Holt' }, { value: 'ses', label: 'SES' }]} />
        <Choice label="Window" value={sliding} onChange={setSliding} options={[{ value: 'exp', label: 'expanding' }, { value: 'slide', label: 'sliding 24 m' }]} />
        <Slider label="horizon h (months)" min={1} max={12} value={h} onChange={setH} />
        <Slider label="step between origins" min={1} max={12} value={step} onChange={setStep} />
        <Readout items={[
          ['windows', K],
          ['avg WAPE model', avgM.toFixed(1) + '%', C.yellow],
          ['avg WAPE baseline', avgB.toFixed(1) + '%', C.purple],
          ['skill vs baseline', `${(100 * (1 - avgM / avgB)).toFixed(0)}%`, avgM < avgB ? C.green : C.red],
          ['model wins', `${beat} of ${K}`, C.gold],
          ['worst window', worst.toFixed(1) + '%', C.red],
        ]} />
        <Legend items={[['actual', C.blue], ['model forecasts', C.yellow], ['seasonal naive (last window)', C.purple]]} />
        <p className="small muted" style={{ margin: 0 }}>Skill = 1 − model WAPE / baseline WAPE. Negative skill means "just use last year's numbers".</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'A **rolling-origin backtest**: we pretend to stand at 12 past forecast dates, train only on data before each date, forecast the next 3 months, and score Holt-Winters against a seasonal-naive baseline.', steps: [
      { do: 'Look at frame 1, then press **▶ Step**.', notice: 'A random split mixes future months into training. The backtest instead always trains on the blue past and tests on the red next 3 months.' },
      { do: 'Keep stepping and watch the diagram grow row by row.', notice: 'Each row is one forecast date; the blue part grows (expanding window). Some windows the baseline wins.' },
      { do: 'Go to the last two frames.', notice: 'Average WAPE across all windows is the honest score; the sliding-window variant keeps the training length fixed.' },
    ] },
    Playground: { what: 'Design your own backtest: choose the model, window type, forecast horizon and how often to re-forecast, and see whether the model still beats seasonal naive.', steps: [
      { do: 'Drag **horizon h** from 1 to 12.', notice: 'Errors grow with the horizon: always backtest at the horizon your decision needs.' },
      { do: 'Switch the model to **SES**.', notice: 'Without seasonality it loses to seasonal naive in most windows: skill turns negative (red).' },
      { do: 'Set **step** to 12.', notice: 'Only a few windows remain, so the average depends on a handful of lucky or unlucky dates. More windows give a more trustworthy estimate.' },
    ] },
  },
};
export default anim;
