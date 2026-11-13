// Hyperparameter tuning: grid search vs random search over a (normally invisible) validation-score landscape.
// With the same budget, random search tries many more distinct values of the hyperparameter that matters.
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Seg, Label, Caption, Readout, Slider, Choice, Toggle, Layout, Legend, useStepPlayer, PlayerControls, rng, C, Scales } from '../viz/kit';

/* ---------- pure helpers ---------- */
// x = log10(C) (regularisation strength of an RBF-kernel SVM), y = log10(gamma) (kernel width).
// C matters a lot (narrow ridge near C ≈ 10^1.1); gamma matters only a little.
const XR: [number, number] = [-3, 3], YR: [number, number] = [-4, 1];
const score = (x: number, y: number) => 0.6 + 0.28 * Math.exp(-((x - 1.1) ** 2) / (2 * 0.45 ** 2)) * (1 - 0.18 * ((y + 1.6) / 2.6) ** 2) + 0.02 * (x + 3) / 6;
const NX = 48, NY = 40;
const CELLS = Array.from({ length: NX * NY }, (_, k) => { const i = k % NX, j = Math.floor(k / NX); const x = XR[0] + ((i + 0.5) * (XR[1] - XR[0])) / NX, y = YR[0] + ((j + 0.5) * (YR[1] - YR[0])) / NY; return { i, j, x, y, v: score(x, y) }; });
const TRUE_BEST = Math.max(...CELLS.map((c) => c.v));
type Trial = { x: number; y: number; v: number };
function gridTrials(k: number): Trial[] {
  const xs = Array.from({ length: k }, (_, i) => XR[0] + ((i + 0.5) * (XR[1] - XR[0])) / k), ys = Array.from({ length: k }, (_, j) => YR[0] + ((j + 0.5) * (YR[1] - YR[0])) / k);
  return ys.flatMap((y) => xs.map((x) => ({ x, y, v: score(x, y) })));
}
function randomTrials(n: number, seed: number): Trial[] {
  const r = rng(seed);
  return Array.from({ length: n }, () => { const x = XR[0] + r() * (XR[1] - XR[0]), y = YR[0] + r() * (YR[1] - YR[0]); return { x, y, v: score(x, y) }; });
}
const best = (t: Trial[]) => t.reduce((a, b) => (b.v > a.v ? b : a), t[0]);
const fmtC = (x: number) => { const v = 10 ** x; return v >= 100 ? v.toFixed(0) : v >= 1 ? v.toFixed(1) : v.toPrecision(1); };
const marginal = (x: number) => Math.max(...Array.from({ length: 41 }, (_, j) => score(x, YR[0] + (j * (YR[1] - YR[0])) / 40)));

/** Blend from the background colour to green (opaque, so neighbouring cells leave no seams). */
const shade = (t: number) => { const a = Math.min(1, Math.max(0.04, t)), from = [11, 14, 19], to = [131, 193, 103]; return `rgb(${from.map((v, i) => Math.round(v + (to[i] - v) * a)).join(',')})`; };
function Heatmap({ s, show }: { s: Scales; show: number }) {
  const w = s.sx(XR[0] + (XR[1] - XR[0]) / NX) - s.sx(XR[0]), h = s.sy(YR[0]) - s.sy(YR[0] + (YR[1] - YR[0]) / NY);
  return <g opacity={show}>{CELLS.map((c) => <rect key={c.i + '-' + c.j} x={s.sx(c.x) - w / 2} y={s.sy(c.y) - h / 2} width={w + 0.6} height={h + 0.6} fill={shade((c.v - 0.58) / 0.32)} />)}</g>;
}
function TrialMarks({ s, trials, kind, upto, bestT }: { s: Scales; trials: Trial[]; kind: 'grid' | 'random'; upto: number; bestT?: Trial }) {
  return <>
    {trials.slice(0, upto).map((t, i) => kind === 'grid'
      ? <rect key={i} x={s.sx(t.x) - 6} y={s.sy(t.y) - 6} width={12} height={12} fill={C.yellow} stroke={C.bg} />
      : <circle key={i} cx={s.sx(t.x)} cy={s.sy(t.y)} r={6.5} fill={C.teal} stroke={C.bg} />)}
    {bestT && <circle cx={s.sx(bestT.x)} cy={s.sy(bestT.y)} r={12} fill="none" stroke={C.gold} strokeWidth={3} />}
  </>;
}
function Rug({ s, trials, color, y0 }: { s: Scales; trials: Trial[]; color: string; y0: number }) {
  return <>{trials.map((t, i) => <line key={i} x1={s.sx(t.x)} x2={s.sx(t.x)} y1={s.sy(y0)} y2={s.sy(y0) - 12} stroke={color} strokeWidth={2.5} />)}</>;
}

/* ---------- Animate ---------- */
const BUDGET = 9;
function Animate() {
  const grid = useMemo(() => gridTrials(3), []);
  const rand = useMemo(() => randomTrials(BUDGET, 3), []);
  const gB = best(grid), rB = best(rand);
  const frames = [
    { g: 0, r: 0, map: 1 }, { g: 0, r: 0, map: 0.25 },
    ...Array.from({ length: BUDGET }, (_, i) => ({ g: i + 1, r: 0, map: 0.25 })),
    { g: BUDGET, r: 0, map: 0.25, gBest: true },
    ...Array.from({ length: BUDGET }, (_, i) => ({ g: BUDGET, r: i + 1, map: 0.25, gBest: true, dimG: true })),
    { g: BUDGET, r: BUDGET, map: 0.25, gBest: true, rBest: true, dimG: true },
    { g: BUDGET, r: BUDGET, map: 1, gBest: true, rBest: true },
  ] as { g: number; r: number; map: number; gBest?: boolean; rBest?: boolean; dimG?: boolean }[];
  const p = useStepPlayer(frames.length, 1300);
  const f = frames[p.i];
  const gi = f.g - 1, ri = f.r - 1;
  const distinct = (t: Trial[]) => new Set(t.map((q) => q.x.toFixed(3))).size;
  let cap: React.ReactNode;
  if (p.i === 0) cap = <>An SVM has two hyperparameters: <b>C</b> (x-axis) and <b>gamma</b> (y-axis), both searched on a log scale. Brighter green = higher <b>5-fold CV accuracy</b>. Notice the bright band is <b>narrow in C</b> but stretches across almost all gamma values: C matters, gamma barely does.</>;
  else if (p.i === 1) cap = <>In real life <b>this map is invisible</b>. Each point we probe costs a full 5-fold cross-validation (5 model fits). We get a budget of <b>{BUDGET} trials = {BUDGET * 5} fits</b>. How should we spend it?</>;
  else if (f.g > 0 && f.r === 0 && !f.gBest) cap = <>Grid search, trial {f.g}: C = {fmtC(grid[gi].x)}, gamma = {fmtC(grid[gi].y)} → CV accuracy <b>{grid[gi].v.toFixed(3)}</b>. {f.g <= 3 ? 'The grid tries every combination of 3 C values × 3 gamma values.' : f.g < BUDGET ? 'Same three C values again, just with a different gamma.' : 'Last grid point.'}</>;
  else if (f.gBest && f.r === 0) cap = <>Grid best: <b>{gB.v.toFixed(3)}</b> (gold ring). Look at the ticks under the x-axis: the grid spent 9 trials but tested only <b>{distinct(grid)} distinct values of C</b>, the one setting that matters. Six of its trials only re-tested gamma, which hardly moves the score.</>;
  else if (f.r > 0 && !f.rBest) cap = <>Random search, trial {f.r}: C and gamma drawn at random within the same ranges → <b>{rand[ri].v.toFixed(3)}</b>. {f.r === 1 ? 'Every trial uses a new value of C.' : f.r < BUDGET ? `Best so far: ${best(rand.slice(0, f.r)).v.toFixed(3)}.` : 'That is the whole budget.'}</>;
  else if (f.rBest && p.i < frames.length - 1) cap = <>Random best: <b>{rB.v.toFixed(3)}</b> vs grid {gB.v.toFixed(3)}, for the same {BUDGET * 5} fits. Random tried <b>{distinct(rand)} distinct C values</b> (ticks under the axis), so it had more chances to land on the narrow ridge.</>;
  else cap = <>Map revealed. Random search does not "know" which setting matters; it simply never repeats a value, so it explores each important axis more finely. Random is not guaranteed to win every time (try reseeding in the Playground), but with <b>several hyperparameters and a fixed budget</b> it usually beats a grid. True best here: {TRUE_BEST.toFixed(3)}.</>;
  const gShown = grid.slice(0, f.g), rShown = rand.slice(0, f.r);
  return (
    <div>
      <Layout
        main={<>
          <Plot x={XR} y={YR} height={360} xLabel="C (log scale)" yLabel="gamma (log scale)" fx={fmtC} fy={fmtC} xTicks={6} yTicks={5} grid={false}>
            {(s) => <>
              <Heatmap s={s} show={f.map} />
              <g opacity={f.dimG ? 0.55 : 1}><TrialMarks s={s} trials={grid} kind="grid" upto={f.g} bestT={f.gBest ? gB : undefined} /></g>
              <TrialMarks s={s} trials={rand} kind="random" upto={f.r} bestT={f.rBest ? rB : undefined} />
              {f.g > 0 && f.r === 0 && !f.gBest && <Label s={s} x={Math.min(grid[gi].x + 0.15, 2.2)} y={grid[gi].y + 0.2} color={C.yellow} size={13}>{grid[gi].v.toFixed(3)}</Label>}
              {f.r > 0 && !f.rBest && <Label s={s} x={Math.min(rand[ri].x + 0.15, 2.2)} y={rand[ri].y + 0.2} color={C.teal} size={13}>{rand[ri].v.toFixed(3)}</Label>}
              <Rug s={s} trials={gShown} color={C.yellow} y0={YR[0]} />
              <Rug s={s} trials={rShown} color={C.teal} y0={YR[0] + 0.33} />
            </>}
          </Plot>
          <div className="small muted" style={{ marginTop: 6 }}>Projection onto C: green = best accuracy achievable at each C; marks = trials</div>
          <Plot x={XR} y={[0.56, 0.92]} height={170} xLabel="C (log scale)" yLabel="CV accuracy" fx={fmtC} xTicks={6} yTicks={4}>
            {(s) => <>
              <path d={Array.from({ length: 121 }, (_, i) => { const x = XR[0] + (i * (XR[1] - XR[0])) / 120; return `${i ? 'L' : 'M'}${s.sx(x)},${s.sy(marginal(x))}`; }).join('')} fill="none" stroke={C.green} strokeWidth={2} opacity={0.8} />
              {gShown.map((t, i) => <rect key={'g' + i} x={s.sx(t.x) - 5} y={s.sy(t.v) - 5} width={10} height={10} fill={C.yellow} />)}
              {rShown.map((t, i) => <circle key={'r' + i} cx={s.sx(t.x)} cy={s.sy(t.v)} r={5.5} fill={C.teal} />)}
            </>}
          </Plot>
        </>}
        side={<>
          <Readout items={[
            ['grid trials', `${f.g} / ${BUDGET}`, C.yellow],
            ['grid best', gShown.length ? best(gShown).v.toFixed(3) : '–', C.yellow],
            ['random trials', `${f.r} / ${BUDGET}`, C.teal],
            ['random best', rShown.length ? best(rShown).v.toFixed(3) : '–', C.teal],
            ['distinct C (grid)', gShown.length ? distinct(gShown) : '–', C.yellow],
            ['distinct C (random)', rShown.length ? distinct(rShown) : '–', C.teal],
            ['fits per strategy', `${Math.max(f.g, f.r) * 5} of ${BUDGET * 5}`],
          ]} />
          <Legend items={[['grid trial', C.yellow], ['random trial', C.teal], ['best found', C.gold], ['CV accuracy (brighter = better)', C.green]]} />
          <p className="small muted" style={{ margin: 0 }}>Every trial is scored by cross-validation on the training data. The test set is not touched while tuning.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{cap}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
type Method = 'grid' | 'random';
function Playground() {
  const [method, setMethod] = useState<Method>('random');
  const [budget, setBudget] = useState(9);
  const [seed, setSeed] = useState(1);
  const [reveal, setReveal] = useState(false);
  const k = Math.max(2, Math.floor(Math.sqrt(budget)));
  const trials = useMemo(() => (method === 'grid' ? gridTrials(k) : randomTrials(budget, 100 + seed)), [method, k, budget, seed]);
  const b = best(trials);
  const gridBest = best(gridTrials(k)).v;
  const winRate = useMemo(() => { const n = 200; let w = 0; for (let s = 0; s < n; s++) if (best(randomTrials(k * k, 5000 + s)).v > gridBest) w++; return w / n; }, [k, gridBest]);
  const distinctC = new Set(trials.map((q) => q.x.toFixed(3))).size;
  return (
    <Layout
      main={<Plot x={XR} y={YR} height={430} xLabel="C (log scale)" yLabel="gamma (log scale)" fx={fmtC} fy={fmtC} xTicks={6} yTicks={5} grid={false}>
        {(s) => <>
          <Heatmap s={s} show={reveal ? 1 : 0.12} />
          <TrialMarks s={s} trials={trials} kind={method} upto={trials.length} bestT={b} />
          <Rug s={s} trials={trials} color={method === 'grid' ? C.yellow : C.teal} y0={YR[0]} />
          <Seg s={s} x1={1.1} x2={1.1} y1={YR[0]} y2={YR[1]} color={reveal ? C.green : 'transparent'} dash="4 4" width={1} />
        </>}
      </Plot>}
      side={<>
        <Choice label="Search" value={method} onChange={setMethod} options={[{ value: 'grid', label: 'Grid' }, { value: 'random', label: 'Random' }]} />
        <Slider label="budget (trials)" min={4} max={49} value={budget} onChange={setBudget} format={(v) => (method === 'grid' ? `${v} → grid ${Math.max(2, Math.floor(Math.sqrt(v)))}×${Math.max(2, Math.floor(Math.sqrt(v)))}` : String(v))} />
        <Toggle label="reveal the score map" value={reveal} onChange={setReveal} />
        <button className="btn" onClick={() => setSeed(seed + 1)} disabled={method === 'grid'}>🎲 New random draw</button>
        <Readout items={[
          ['best CV accuracy', b.v.toFixed(3), method === 'grid' ? C.yellow : C.teal],
          ['true best', TRUE_BEST.toFixed(3), C.green],
          ['best C found', fmtC(b.x)],
          ['distinct C values', distinctC],
          ['trials × 5 folds', `${trials.length * 5} fits`],
          [`random beats ${k}×${k} grid`, `${(winRate * 100).toFixed(0)}% of draws`, C.teal],
        ]} />
        <p className="small muted" style={{ margin: 0 }}>The last readout repeats a {k * k}-trial random search 200 times and counts how often it beats the {k}×{k} grid with the same budget.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Two SVM hyperparameters, C and gamma, with a validation-score map (green = better) that you normally cannot see. **Grid search** and **random search** each get 9 trials.', steps: [
      { do: 'Step through the 9 grid trials.', notice: 'The grid keeps re-using the same 3 values of C; the ticks under the x-axis show only 3 positions.' },
      { do: 'Step through the 9 random trials.', notice: 'Every random trial uses a new C (9 ticks), and one lands close to the narrow bright ridge.' },
      { do: 'Compare the two "best" readouts and the lower projection chart.', notice: 'Same cost (45 fits), better result: random search explores the axis that matters more finely.' },
    ] },
    Playground: { what: 'Run your own grid or random search with any budget. The score map is hidden unless you reveal it.', steps: [
      { do: 'Choose **Grid** and drag the budget from 4 to 49.', notice: 'The grid only improves when one of its columns happens to hit the ridge; the number of distinct C values grows slowly (√budget).' },
      { do: 'Choose **Random** and click **🎲 New random draw** several times.', notice: 'Results vary from draw to draw, but the win-rate readout shows how often random beats the grid on the same budget.' },
      { do: 'Tick **reveal the score map**.', notice: 'The ridge is narrow in C and wide in gamma: the classic case where random search shines.' },
    ] },
  },
};
export default anim;
