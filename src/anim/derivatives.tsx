// Derivatives: a secant line shrinking into the tangent, then sweeping the tangent to build the derivative function.
import { ReactNode, useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, FnLine, Dots, Seg, Label, Caption, Readout, Slider, Choice, Toggle, Layout, Legend, useStepPlayer, PlayerControls, C, Scales } from '../viz/kit';
import { f2 } from './_math-helpers';

/* ---------- pure helpers ---------- */
const sq = (x: number) => x * x;
const lineThrough = (x0: number, y0: number, m: number) => (x: number) => y0 + m * (x - x0);

/** Rise-over-run triangle between (x0, f(x0)) and (x0+h, f(x0+h)). */
function RiseRun({ s, f, x0, h }: { s: Scales; f: (x: number) => number; x0: number; h: number }) {
  const y0 = f(x0), y1 = f(x0 + h);
  return <>
    <Seg s={s} x1={x0} y1={y0} x2={x0 + h} y2={y0} color={C.teal} width={1.5} dash="4 3" />
    <Seg s={s} x1={x0 + h} y1={y0} x2={x0 + h} y2={y1} color={C.red} width={1.5} dash="4 3" />
  </>;
}

/* ---------- Animate ---------- */
const X0 = 3;
const HS = [2, 1, 0.5, 0.25, 0.1, 0.01];
const SWEEP = [-2, -1, 0, 1, 2, 3, 4, 5];
type Frame = { kind: 'secant' | 'tangent' | 'sweep'; h?: number; k?: number; cap: ReactNode; read: [string, ReactNode, string?][] };

function buildFrames(): Frame[] {
  const fr: Frame[] = [{ kind: 'secant', cap: <>The curve <b>f(x) = x²</b> gets steeper as x grows. How steep is it <b>exactly at x = 3</b> (gold dot, height 9)? A slope needs two points, but "at a point" gives only one. Trick: take a second point a little to the right.</>, read: [['x', '3', C.gold], ['f(3)', '9', C.gold]] }];
  HS.forEach((h) => {
    const m = (sq(X0 + h) - sq(X0)) / h;
    fr.push({ kind: 'secant', h, cap: h === 2
      ? <>Second point at x = 3 + h with <b>h = 2</b>: f(5) = 25. The line through both points (a <b>secant</b>) has slope rise / run = (25 − 9) / 2 = <b>{f2(m)}</b>. Too steep: it averages over the whole stretch from 3 to 5.</>
      : h > 0.05 ? <>Shrink the gap to <b>h = {h}</b>: slope = (f({3 + h}) − 9) / {h} = <b>{f2(m, 2)}</b>. The secant swings closer to the curve's direction at x = 3.</>
        : <><b>h = 0.01</b>: slope = (9.0601 − 9) / 0.01 = <b>6.01</b>. The two points have practically merged. The slopes went 8, 7, 6.5, 6.25, 6.1, 6.01: always <b>6 + h</b>, heading for <b>6</b>.</>,
      read: [['gap h', String(h), C.teal], ['rise', f2(sq(X0 + h) - sq(X0), 4), C.red], ['secant slope', f2(m, 3), C.gold]] });
  });
  fr.push({ kind: 'tangent', cap: <>The limit is the <b>tangent line</b> y = 6x − 9 (yellow): it just touches the curve at (3, 9). Its slope <b>f′(3) = 6</b> is the derivative: near x = 3, every extra 0.1 in x adds about 0.6 to f. The power rule agrees: f′(x) = 2x = 2 × 3 = 6.</>, read: [['f′(3)', '6', C.yellow], ['tangent', 'y = 6x − 9', C.yellow]] });
  SWEEP.forEach((x, k) => fr.push({ kind: 'sweep', k, cap: k === 0
    ? <>Now slide the touching point along the curve. At <b>x = −2</b> the tangent slopes <b>down</b>: slope −4. Each slope we measure becomes a dot on the lower chart.</>
    : x === 0 ? <>At <b>x = 0</b>, the bottom of the bowl, the tangent is <b>flat</b>: slope 0. A zero derivative marks a minimum (or maximum). This is how optimisers know they have arrived.</>
      : k < SWEEP.length - 1 ? <>At x = {x} the slope is <b>{2 * x}</b>. {x > 0 ? 'Positive slope: going right goes up.' : 'Negative slope: going right goes down.'}</>
        : <>At x = 5 the slope is 10. The lower dots lie on a straight line: <b>f′(x) = 2x</b>. The derivative is itself a function, a "slope meter" you can read at any x.</>,
    read: [['x', String(x), C.gold], ['f(x)', String(x * x)], ['slope f′(x)', String(2 * x), C.yellow]] }));
  fr.push({ kind: 'sweep', k: SWEEP.length, cap: <><b>Why ML cares:</b> if f were a model's error and x a weight, the derivative's <b>sign</b> says which way to move (negative → increase x, positive → decrease) and its <b>size</b> says how much it matters. At x = 0 the error is smallest and the slope is zero. Gradient descent is built on exactly this.</>, read: [['f′(x)', '2x', C.green], ['minimum at', 'x = 0 (f′ = 0)', C.green]] });
  return fr;
}

function Animate() {
  const frames = useMemo(buildFrames, []);
  const p = useStepPlayer(frames.length, 1900);
  const f = frames[p.i];
  const xr: [number, number] = [-3, 5.5];
  const swept = f.kind === 'sweep' ? SWEEP.slice(0, Math.min(f.k! + 1, SWEEP.length)) : [];
  const cur = f.kind === 'sweep' && f.k! < SWEEP.length ? SWEEP[f.k!] : undefined;
  return (
    <div>
      <Layout
        main={<>
          <Plot x={xr} y={[-4, 30]} height={320} xLabel="x" yLabel="f(x) = x²">
            {(s) => <>
              <FnLine s={s} f={sq} color={C.blue} width={3} />
              {f.kind === 'secant' && f.h && <>
                {f.h <= 1 && <FnLine s={s} f={lineThrough(3, 9, 6)} color={C.yellow} width={1.2} dash="6 4" />}
                <FnLine s={s} f={lineThrough(X0, 9, (sq(X0 + f.h) - 9) / f.h)} color={C.gold} width={2} />
                <RiseRun s={s} f={sq} x0={X0} h={f.h} />
                <Dots s={s} pts={[{ x: X0 + f.h, y: sq(X0 + f.h) }]} color={C.teal} r={6} />
                {f.h >= 0.5 && <><Label s={s} x={X0 + f.h / 2} y={7.3} color={C.teal} anchor="middle">run h = {f.h}</Label><Label s={s} x={X0 + f.h + 0.1} y={(9 + sq(X0 + f.h)) / 2} color={C.red}>rise</Label></>}
              </>}
              {f.kind === 'tangent' && <FnLine s={s} f={lineThrough(3, 9, 6)} color={C.yellow} width={2.5} />}
              {(f.kind === 'secant' || f.kind === 'tangent') && <Dots s={s} pts={[{ x: X0, y: 9 }]} color={C.gold} r={7} animate={false} />}
              {cur !== undefined && <>
                <FnLine s={s} f={lineThrough(cur, cur * cur, 2 * cur)} from={cur - 1.6} to={cur + 1.6} color={C.yellow} width={2.5} />
                <Dots s={s} pts={[{ x: cur, y: cur * cur }]} color={C.gold} r={7} />
                <Label s={s} x={cur + 0.2} y={cur * cur + 2.4} color={C.yellow}>slope {2 * cur}</Label>
              </>}
            </>}
          </Plot>
          {f.kind === 'secant' && f.h && <>
            <div className="small muted" style={{ marginTop: 6 }}>Zoomed in around x = 3 (window width {f2(3 * f.h, 2)}): the closer you look, the straighter the curve gets. The secant (gold) hugs the tangent (dashed yellow, the target) more tightly each time h shrinks.</div>
            <Plot x={[X0 - f.h, X0 + 2 * f.h]} y={[sq(X0 - f.h), sq(X0 + 2 * f.h)]} height={200} xTicks={4} yTicks={4} fx={(v) => f2(v, f.h! < 0.1 ? 3 : 2)} fy={(v) => f2(v, f.h! < 0.1 ? 3 : 1)} xLabel="x (zoomed)" yLabel="f(x)">
              {(s) => <>
                <FnLine s={s} f={sq} color={C.blue} width={3} />
                <FnLine s={s} f={lineThrough(3, 9, 6)} color={C.yellow} width={1.5} dash="6 4" />
                <FnLine s={s} f={lineThrough(X0, 9, (sq(X0 + f.h!) - 9) / f.h!)} color={C.gold} width={2} />
                <RiseRun s={s} f={sq} x0={X0} h={f.h!} />
                <Dots s={s} pts={[{ x: X0, y: 9 }, { x: X0 + f.h!, y: sq(X0 + f.h!) }]} color={(i) => (i ? C.teal : C.gold)} r={6} animate={false} />
              </>}
            </Plot>
          </>}
          {f.kind === 'sweep' && <Plot x={xr} y={[-6, 12]} height={200} xLabel="x" yLabel="slope f′(x)">
            {(s) => <>
              <Seg s={s} x1={-3} y1={0} x2={5.5} y2={0} color={C.muted} width={1} />
              {f.k! >= SWEEP.length - 1 && <FnLine s={s} f={(x) => 2 * x} color={C.green} width={2} dash="6 4" />}
              <Dots s={s} pts={swept.map((x) => ({ x, y: 2 * x }))} color={C.yellow} r={6} />
              {f.k! >= SWEEP.length - 1 && <Label s={s} x={3.4} y={3.5} color={C.green}>f′(x) = 2x</Label>}
            </>}
          </Plot>}
        </>}
        side={<>
          <Readout items={f.read} />
          <Legend items={[['curve f(x)', C.blue], ['secant (two points)', C.gold], ['tangent / slope', C.yellow], ['derivative f′(x)', C.green]]} />
          <p className="small muted" style={{ margin: 0 }}>Derivative = <b>limit of rise / run</b> as the run h shrinks to 0: f′(x) = lim (f(x + h) − f(x)) / h.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{f.cap}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
type FKey = 'sq' | 'cubic' | 'sin' | 'abs' | 'chai';
const FUNCS: Record<FKey, { label: string; f: (x: number) => number; df: (x: number) => number | null; x: [number, number]; y: [number, number]; x0: number; xl: string; yl: string }> = {
  sq: { label: 'x²', f: sq, df: (x) => 2 * x, x: [-3, 3], y: [-1, 9], x0: 1, xl: 'x', yl: 'f(x)' },
  cubic: { label: 'x³ − 3x', f: (x) => x ** 3 - 3 * x, df: (x) => 3 * x * x - 3, x: [-2.5, 2.5], y: [-5, 5], x0: 1.5, xl: 'x', yl: 'f(x)' },
  sin: { label: 'sin x', f: Math.sin, df: Math.cos, x: [-4, 4], y: [-1.6, 1.6], x0: 1, xl: 'x (radians)', yl: 'f(x)' },
  abs: { label: '|x| (kink)', f: Math.abs, df: (x) => (Math.abs(x) < 1e-9 ? null : Math.sign(x)), x: [-2, 2], y: [-0.5, 2], x0: 0, xl: 'x', yl: 'f(x)' },
  chai: { label: 'chai profit', f: (p) => (p - 10) * (1000 - 20 * p) / 1000, df: (p) => (-40 * p + 1200) / 1000, x: [10, 50], y: [-1, 9], x0: 25, xl: 'price per cup (₹)', yl: 'daily profit (₹ thousand)' },
};
const H_STEPS = [1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01, 0.001];

function Playground() {
  const [key, setKey] = useState<FKey>('sq');
  const F = FUNCS[key];
  const [x0, setX0] = useState(F.x0);
  const [hi, setHi] = useState(0);
  const [showD, setShowD] = useState(true);
  const span = F.x[1] - F.x[0];
  const h = H_STEPS[hi] * (key === 'chai' ? 10 : 1);
  const fwd = (F.f(x0 + h) - F.f(x0)) / h, bwd = (F.f(x0) - F.f(x0 - h)) / h;
  const true_ = F.df(x0);
  const dVals = Array.from({ length: 101 }, (_, i) => F.df(F.x[0] + (span * i) / 100) ?? 0);
  const dLo = Math.min(...dVals, 0), dHi = Math.max(...dVals, 0), pad = (dHi - dLo) * 0.15 || 1;
  const choose = (k: FKey) => { setKey(k); setX0(FUNCS[k].x0); };
  return (
    <Layout
      main={<>
        <Plot x={F.x} y={F.y} height={330} xLabel={F.xl} yLabel={F.yl}>
          {(s) => <>
            <FnLine s={s} f={F.f} color={C.blue} width={3} />
            {true_ !== null && <FnLine s={s} f={lineThrough(x0, F.f(x0), true_)} color={C.yellow} width={2} dash="7 4" />}
            <FnLine s={s} f={lineThrough(x0, F.f(x0), bwd)} color={C.purple} width={1.8} />
            <FnLine s={s} f={lineThrough(x0, F.f(x0), fwd)} color={C.gold} width={2.2} />
            <Dots s={s} pts={[{ x: x0 - h, y: F.f(x0 - h) }, { x: x0 + h, y: F.f(x0 + h) }]} color={(i) => (i ? C.gold : C.purple)} r={5} animate={false} />
            <Dots s={s} pts={[{ x: x0, y: F.f(x0) }]} color={C.text} r={6} animate={false} />
          </>}
        </Plot>
        {showD && <Plot x={F.x} y={[dLo - pad, dHi + pad]} height={170} xLabel={F.xl} yLabel="slope f′">
          {(s) => <>
            <Seg s={s} x1={F.x[0]} y1={0} x2={F.x[1]} y2={0} color={C.muted} width={1} />
            <FnLine s={s} f={(x) => F.df(x) ?? NaN} color={C.green} width={2} />
            {true_ !== null && <Dots s={s} pts={[{ x: x0, y: true_ }]} color={C.yellow} r={6} animate={false} />}
          </>}
        </Plot>}
      </>}
      side={<>
        <Choice label="Function" value={key} onChange={choose} options={(Object.keys(FUNCS) as FKey[]).map((k) => ({ value: k, label: FUNCS[k].label }))} />
        <Slider label="point x" min={F.x[0] + span * 0.1} max={F.x[1] - span * 0.1} step={span / 200} value={x0} onChange={setX0} format={(v) => v.toFixed(2)} />
        <Slider label="gap h" min={0} max={H_STEPS.length - 1} value={hi} onChange={setHi} format={() => String(h)} />
        <Toggle label="show derivative curve f′(x)" value={showD} onChange={setShowD} />
        <Readout items={[
          ['right secant slope', f2(fwd, 3), C.gold],
          ['left secant slope', f2(bwd, 3), C.purple],
          ['true f′(x)', true_ === null ? 'undefined' : f2(true_, 3), true_ === null ? C.red : C.yellow],
          ['error (right)', true_ === null ? '–' : f2(Math.abs(fwd - true_), 4), C.red],
        ]} />
        <p className="small muted" style={{ margin: 0 }}>Shrink h and the gold and purple secants squeeze onto the yellow tangent. At the kink of |x| they never agree (slope +1 versus −1): no single tangent, no derivative.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'We measure how steep **f(x) = x²** is at x = 3 by drawing lines through two nearby points and pushing them together, then slide that slope meter along the curve.', steps: [
      { do: 'Step through the frames where **h** shrinks from 2 to 0.01.', notice: 'The gold secant swings into the yellow tangent and its slope goes 8, 7, 6.5 … towards **6**.' },
      { do: 'Keep stepping as the touching point slides from x = −2 to x = 5.', notice: 'Each slope becomes a dot below. The dots line up on **f′(x) = 2x**; at the bottom (x = 0) the slope is zero.' },
    ] },
    Playground: { what: 'Pick a function, a point x and a gap h. The gold line uses the point to the right, the purple one the point to the left; the dashed yellow line is the true tangent.', steps: [
      { do: 'Drag **gap h** from 1 down to 0.001.', notice: 'The secant slopes converge on the true derivative and the error readout shrinks towards 0.' },
      { do: 'Choose **|x| (kink)** with the point at 0.', notice: 'The left and right secants stay at −1 and +1 however small h gets: the derivative **does not exist** at a corner.' },
      { do: 'Choose **chai profit** and move the price until the slope is 0.', notice: 'The flat tangent sits at **₹30**, the profit-maximising price from the chapter. At ₹25 the slope is +0.2 (₹200 per extra rupee).' },
    ] },
  },
};
export default anim;
