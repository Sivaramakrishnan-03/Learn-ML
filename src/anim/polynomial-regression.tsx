// Polynomial regression: bend the line with x², x³ … and watch train vs test error as the degree goes from 1 to 15 (overfitting).
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Dots, FnLine, Seg, Label, Caption, Readout, Slider, Toggle, Layout, Legend, useStepPlayer, PlayerControls, rng, gauss, C } from '../viz/kit';
import { polyFit, rmse } from '../viz/math';

/* ---------- pure helpers ---------- */
// Test-track fuel use (litres per 100 km) against cruising speed (km/h): high when slow, lowest near 80 km/h, high again when fast.
const LO = 30, HI = 130, MAXDEG = 15;
const truth = (s: number) => 5.6 + 0.0011 * (s - 82) ** 2;
interface Pt { x: number; y: number }
// `spread`: one run per speed band (how a test engineer would plan runs); otherwise speeds are fully random.
function drives(n: number, seed: number, noise: number, spread = false): Pt[] {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => { const x = spread ? LO + ((i + r()) * (HI - LO)) / n : LO + r() * (HI - LO); return { x, y: truth(x) + noise * gauss(r) }; }).sort((a, b) => a.x - b.x);
}
function fitAll(train: Pt[], test: Pt[]) {
  return Array.from({ length: MAXDEG }, (_, k) => {
    const deg = k + 1, f = polyFit(train.map((p) => p.x), train.map((p) => p.y), deg, LO, HI);
    return { deg, f, tr: rmse(train.map((p) => f(p.x)), train.map((p) => p.y)), te: rmse(test.map((p) => f(p.x)), test.map((p) => p.y)) };
  });
}
const Y: [number, number] = [3.5, 11];
const EMAX = 3;
const clipE = (v: number) => Math.min(v, EMAX * 0.98);

function ErrorPlot({ fits, upto, cursor, height = 200 }: { fits: ReturnType<typeof fitAll>; upto: number; cursor?: number; height?: number }) {
  const shown = fits.slice(0, upto);
  return (
    <Plot x={[0.5, MAXDEG + 0.5]} y={[0, EMAX]} height={height} xLabel="polynomial degree" yLabel="RMSE (L/100 km)" xTicks={15} yTicks={4}>
      {(s) => <>
        {cursor && <Seg s={s} x1={cursor} x2={cursor} y1={0} y2={EMAX} color={C.gold} dash="4 4" />}
        {shown.slice(1).map((q, i) => <g key={i}>
          <Seg s={s} x1={shown[i].deg} x2={q.deg} y1={clipE(shown[i].tr)} y2={clipE(q.tr)} color={C.blue} />
          <Seg s={s} x1={shown[i].deg} x2={q.deg} y1={clipE(shown[i].te)} y2={clipE(q.te)} color={C.purple} />
        </g>)}
        <Dots s={s} pts={shown.map((q) => ({ x: q.deg, y: clipE(q.tr) }))} color={C.blue} r={4} animate={false} />
        <Dots s={s} pts={shown.map((q) => ({ x: q.deg, y: clipE(q.te) }))} color={(i) => (shown[i].te > EMAX ? C.red : C.purple)} r={4} animate={false} />
        <Label s={s} x={0.7} y={EMAX * 0.88} color={C.muted} size={11}>blue = train error · purple = test error · red dot = off the chart</Label>
      </>}
    </Plot>
  );
}

/* ---------- Animate ---------- */
function Animate() {
  const NOISE = 0.45;
  const train = useMemo(() => drives(18, 4, NOISE, true), []);
  const test = useMemo(() => drives(60, 99, NOISE), []);
  const fits = useMemo(() => fitAll(train, test), [train, test]);
  const best = fits.reduce((a, b) => (b.te < a.te ? b : a));
  const frames = [{ d: 0, test: false }, { d: 0, test: true }, ...fits.map((q) => ({ d: q.deg, test: true })), { d: best.deg, test: true, end: true }];
  const p = useStepPlayer(frames.length, 1400);
  const f = frames[p.i] as { d: number; test: boolean; end?: boolean };
  const cur = f.d ? fits[f.d - 1] : undefined;
  const caption = (() => {
    if (f.end) return <>The winner on unseen drives is <b>degree {best.deg}</b> (test RMSE {best.te.toFixed(2)}). The green dashed curve is the true relationship. The lesson: <b>training error always falls as the model gets more flexible; test error falls, bottoms out, then rises.</b> Choose the degree on held-out data (cross-validation), never on training error.</>;
    if (f.d === 0 && !f.test) return <>Eighteen test-track runs (blue): fuel use is high at low speed, lowest around 80 km/h and high again at speed. A straight line cannot follow that. Polynomial regression adds columns <b>speed², speed³, …</b> and fits them with ordinary least squares.</>;
    if (f.d === 0) return <>We also keep <b>60 other runs</b> (purple) that the model never sees while fitting. They tell us how the curve will do on <b>new drives</b>. Now we raise the degree one step at a time.</>;
    const d = f.d, q = cur!;
    if (d === 1) return <>Degree 1 is a plain straight line. It <b>underfits</b>: it says speed barely matters. Train RMSE {q.tr.toFixed(2)}, test RMSE {q.te.toFixed(2)}, both bad. Watch the error chart below.</>;
    if (d === 2) return <>Degree 2 (one bend) captures the U-shape. Both errors drop to about <b>{q.te.toFixed(2)}</b>, close to the noise level of the measurements ({NOISE}). This is the right flexibility for this data.</>;
    if (d <= 5) return <>Degree {d}: barely any change. Training error creeps down to {q.tr.toFixed(2)}, test error stays near {q.te.toFixed(2)}. The extra terms have almost nothing real left to explain.</>;
    if (d <= 10) return <>Degree {d}: the curve starts to <b>wiggle</b> to pass closer to individual blue points. Training error keeps falling ({q.tr.toFixed(2)}), but test error {q.te > fits[1].te * 1.15 ? <b>rises to {q.te.toFixed(2)}</b> : <>is {q.te.toFixed(2)}</>}: it is learning noise, not fuel physics.</>;
    return <>Degree {d}: <b>overfitting</b>. With {d + 1} coefficients for 18 points the curve snakes through the training runs (train RMSE {q.tr.toFixed(2)}) and shoots off near the edges where data is thin. Test RMSE: <b style={{ color: C.red }}>{q.te > 99 ? 'over 99' : q.te.toFixed(2)}</b>.</>;
  })();
  return (
    <div>
      <Layout
        main={<>
          <Plot x={[LO - 2, HI + 2]} y={Y} height={330} xLabel="cruising speed (km/h)" yLabel="fuel use (L / 100 km)">
            {(s) => <>
              {f.test && <Dots s={s} pts={test} color={C.purple} r={3.5} opacity={0.75} animate={false} />}
              {f.end && <FnLine s={s} f={truth} color={C.green} dash="7 5" width={2.5} />}
              {cur && <FnLine s={s} f={cur.f} color={C.yellow} width={3} n={300} />}
              <Dots s={s} pts={train} r={6} animate={false} />
              {cur && <Label s={s} x={LO + 1} y={Y[1] - 0.5} color={C.yellow} size={14}>degree {cur.deg}</Label>}
            </>}
          </Plot>
          <ErrorPlot fits={fits} upto={f.d} cursor={f.d || undefined} />
        </>}
        side={<>
          <Readout items={[
            ['degree', f.d || '–', C.yellow],
            ['coefficients', f.d ? f.d + 1 : '–'],
            ['train RMSE', cur ? cur.tr.toFixed(2) : '–', C.blue],
            ['test RMSE', cur ? (cur.te > 99 ? '> 99' : cur.te.toFixed(2)) : '–', cur && cur.te > 1 ? C.red : C.purple],
            ['noise level (best possible)', NOISE.toFixed(2), C.green],
          ]} />
          <Legend items={[['training runs (fitted)', C.blue], ['held-out runs (test)', C.purple], ['fitted polynomial', C.yellow], ['true curve', C.green]]} />
          <p className="small muted" style={{ margin: 0 }}>Test error can never beat the noise level: no model can predict the random part of each run.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caption}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
function Playground() {
  const [deg, setDeg] = useState(2);
  const [n, setN] = useState(18);
  const [noise, setNoise] = useState(0.45);
  const [showTest, setShowTest] = useState(true);
  const [seed, setSeed] = useState(4);
  const train = useMemo(() => drives(n, seed, noise, true), [n, seed, noise]);
  const test = useMemo(() => drives(80, 500 + seed, noise), [seed, noise]);
  const fits = useMemo(() => fitAll(train, test), [train, test]);
  const cur = fits[deg - 1];
  const best = fits.reduce((a, b) => (b.te < a.te ? b : a));
  const xs = [40, 80, 120];
  return (
    <Layout
      main={<>
        <Plot x={[LO - 2, HI + 2]} y={Y} height={320} xLabel="cruising speed (km/h)" yLabel="fuel use (L / 100 km)">
          {(s) => <>
            {showTest && <Dots s={s} pts={test} color={C.purple} r={3} opacity={0.7} animate={false} />}
            <FnLine s={s} f={truth} color={C.green} dash="7 5" width={1.5} />
            <FnLine s={s} f={cur.f} color={C.yellow} width={3} n={300} />
            <Dots s={s} pts={train} r={5} animate={false} />
          </>}
        </Plot>
        <ErrorPlot fits={fits} upto={MAXDEG} cursor={deg} height={190} />
      </>}
      side={<>
        <Slider label="degree" min={1} max={MAXDEG} value={deg} onChange={setDeg} />
        <Slider label="training runs" min={6} max={80} value={n} onChange={setN} />
        <Slider label="measurement noise" min={0.05} max={1.2} step={0.05} value={noise} onChange={setNoise} format={(v) => v.toFixed(2)} />
        <Toggle label="show held-out runs" value={showTest} onChange={setShowTest} />
        <button className="btn" onClick={() => setSeed(seed + 1)}>🎲 New training runs</button>
        <Readout items={[
          ['train RMSE', cur.tr.toFixed(2), C.blue],
          ['test RMSE', cur.te > 99 ? '> 99' : cur.te.toFixed(2), cur.te > 2 * best.te ? C.red : C.purple],
          ['best degree (on test)', best.deg, C.gold],
          ...xs.map((x) => [`predicted at ${x} km/h`, cur.f(x).toFixed(1) + ' L', C.yellow] as [string, string, string]),
        ]} />
        <p className="small muted" style={{ margin: 0 }}>Try degree 15 with only 10 runs, then give it 80 runs. More data tames a flexible model.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Fuel use against cruising speed. We fit polynomials of **degree 1 to 15** to 18 training runs and track **training** vs **test** error on 60 runs the model never saw.', steps: [
      { do: 'Step to **degree 1** and **degree 2**.', notice: 'The straight line underfits; one bend (degree 2) captures the U and both errors drop to the noise level.' },
      { do: 'Press **▶ Play** through degrees 3–15 and watch the lower chart.', notice: 'Blue (train) keeps falling; purple (test) flattens, then climbs as the curve starts to wiggle.' },
      { do: 'Look at the **last frame**.', notice: 'The best test degree is small, and the fitted curve sits on the green true curve.' },
    ] },
    Playground: { what: 'Pick the degree, the number of training runs and the noise; the lower chart shows train and test error for **every** degree on the current data.', steps: [
      { do: 'Drag **degree** to 15 with **training runs = 10**.', notice: 'The yellow curve swings wildly between points and the test error turns red.' },
      { do: 'Keep degree 15 and raise **training runs** to 80.', notice: 'The wiggles calm down: more data supports a more flexible model.' },
      { do: 'Set **noise** to 0.05, then 1.2.', notice: 'With clean data high degrees do little harm; with noisy data overfitting starts at a much lower degree.' },
    ] },
  },
};
export default anim;
