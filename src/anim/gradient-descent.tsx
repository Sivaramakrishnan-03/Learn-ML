// Gradient descent: walking down a 1-D loss bowl, the effect of the learning rate (slow / just right / bouncing / diverging),
// then fitting a sales line by descending a 2-D loss surface.
import { ReactNode, useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, FnLine, Dots, Seg, Arrow, Label, Bars, Caption, Readout, Slider, Choice, Toggle, Layout, Legend, useStepPlayer, PlayerControls, C, Scales } from '../viz/kit';
import { V2, contours, segPath, polyPath, equalH, f2, clamp } from './_math-helpers';

/* ---------- pure helpers ---------- */
const L1 = (w: number) => (w - 3) ** 2;
const dL1 = (w: number) => 2 * (w - 3);
function gd1(alpha: number, w0: number, n: number) { const ws = [w0]; for (let k = 0; k < n; k++) ws.push(ws[k] - alpha * dL1(ws[k])); return ws; }

const XS = [1, 2, 3], YS = [3, 5, 7];
const salesLoss = (m: number, b: number) => XS.reduce((s, x, i) => s + (YS[i] - m * x - b) ** 2, 0) / 3;
const salesGrad = (m: number, b: number): V2 => XS.reduce<V2>((g, x, i) => { const e = YS[i] - m * x - b; return [g[0] - (2 / 3) * x * e, g[1] - (2 / 3) * e]; }, [0, 0]);
function gdSales(alpha: number, n: number) { const path: V2[] = [[0, 0]]; for (let k = 0; k < n; k++) { const [m, b] = path[k], g = salesGrad(m, b); path.push([m - alpha * g[0], b - alpha * g[1]]); } return path; }

/** Zig-zag path on the loss curve: from (w_k, L(w_k)) to (w_k+1, L(w_k+1)). */
function Walk({ s, ws, upto, color = C.gold }: { s: Scales; ws: number[]; upto: number; color?: string }) {
  return <>
    {ws.slice(0, upto).map((w, k) => <Arrow key={k} s={s} x1={w} y1={L1(w)} x2={ws[k + 1]} y2={L1(ws[k + 1])} color={color} width={1.8} />)}
    <Dots s={s} pts={ws.slice(0, upto + 1).map((w) => ({ x: w, y: L1(w) }))} color={(i) => (i === upto ? C.gold : C.blue)} r={5} animate={false} />
  </>;
}

/* ---------- Animate ---------- */
type Frame = { kind: '1d' | '2d'; draw: (s: Scales) => ReactNode; xr?: [number, number]; yr?: [number, number]; losses?: number[]; k?: number; cap: ReactNode; read: [string, ReactNode, string?][] };

function buildFrames(): Frame[] {
  const fr: Frame[] = [];
  const good = gd1(0.25, 0, 6);
  const near: [number, number] = [-1.5, 7.5], nearY: [number, number] = [0, 12];
  for (let k = 0; k <= 5; k++) {
    const w = good[k], g = dL1(w), wn = good[k + 1];
    fr.push({ kind: '1d', xr: near, yr: nearY, losses: good.slice(0, k + 1).map(L1),
      draw: (s) => <>
        <FnLine s={s} f={L1} color={C.blue} width={3} />
        <FnLine s={s} f={(x) => L1(w) + g * (x - w)} from={w - 1.3} to={w + 1.3} color={C.yellow} width={2} />
        <Walk s={s} ws={good} upto={k} />
        <Arrow s={s} x1={w} y1={0.4} x2={wn} y2={0.4} color={C.red} width={2.5} />
        <Seg s={s} x1={3} y1={0} x2={3} y2={12} color={C.green} dash="5 4" />
        <Label s={s} x={3.1} y={11.2} color={C.green}>minimum w = 3</Label>
      </>,
      cap: k === 0 ? <>A one-weight model has loss <b>L(w) = (w − 3)²</b>. We start blindfolded at <b>w = 0</b> (loss 9). We cannot see the valley, only feel the slope underfoot: L′(0) = 2(0 − 3) = <b>−6</b> (yellow tangent). Negative slope means "downhill is to the right".</>
        : k === 1 ? <>Update rule: <b>w ← w − α × slope</b> with learning rate α = 0.25. So w = 0 − 0.25 × (−6) = <b>1.5</b> (red step). Loss falls from 9 to <b>2.25</b>. New slope: −3.</>
          : k < 5 ? <>Step {k}: w = {f2(good[k - 1], 4)} − 0.25 × ({f2(dL1(good[k - 1]), 3)}) = <b>{f2(w, 4)}</b>, loss <b>{f2(L1(w), 4)}</b>. The slope gets gentler near the bottom, so the steps <b>shrink automatically</b>: each one halves the remaining gap.</>
            : <>After 5 steps w = {f2(w, 3)} and the loss is {f2(L1(w), 4)}. The gap to 3 went 3 → 1.5 → 0.75 → 0.375 → …, exactly the factor (1 − 2α) = 0.5 per step. No algebra needed, just repeated "feel the slope, step downhill".</>,
      read: [['α', '0.25'], ['w', f2(w, 4), C.gold], ['slope L′(w)', f2(g, 3), C.yellow], ['loss', f2(L1(w), 4), C.red]] });
  }
  const scen = (alpha: number, n: number, xr: [number, number], yr: [number, number], cap: ReactNode, verdict: string, col: string): Frame => {
    const ws = gd1(alpha, 0, n);
    return { kind: '1d', xr, yr, losses: ws.map(L1),
      draw: (s) => <><FnLine s={s} f={L1} color={C.blue} width={3} /><Seg s={s} x1={3} y1={0} x2={3} y2={yr[1]} color={C.green} dash="5 4" /><Walk s={s} ws={ws} upto={n} color={col} />
        {ws.map((w, i) => <Label key={i} s={s} x={w} y={L1(w) + yr[1] * 0.035} anchor="middle" size={11} color={C.muted}>{i}</Label>)}</>,
      cap, read: [['α', String(alpha), col], ['w after ' + n + ' steps', f2(ws[n], 3), C.gold], ['loss', f2(L1(ws[n]), 3), C.red], ['verdict', verdict, col]] };
  };
  fr.push(scen(0.01, 4, near, nearY, <>Same start, but a timid learning rate <b>α = 0.01</b>: w = 0 → 0.06 → 0.119 → 0.176 → 0.233. The dots barely leave the start. Safe, but after 4 steps it has covered <b>under 8%</b> of the distance. Training would take forever.</>, 'too slow', C.purple));
  fr.push(scen(0.5, 2, near, nearY, <><b>α = 0.5</b> lands exactly on w = 3 in a single step, because on this perfect bowl 0 − 0.5 × (−6) = 3. Real loss surfaces are not perfect bowls, so nobody knows this magic value in advance.</>, 'perfect (lucky)', C.green));
  fr.push(scen(1.0, 4, [-1.5, 7.5], [0, 12], <><b>α = 1.0</b>: w = 0 → 6 → 0 → 6 → 0. Each step leaps clean across the valley to the same height on the other side. The loss stays at 9 for ever: <b>oscillation</b>.</>, 'bouncing', C.gold));
  fr.push(scen(1.1, 5, [-6, 12], [0, 75], <><b>α = 1.1</b>: w = 0 → 6.6 → −1.32 → 8.18 → −3.22 → 10.46. Every jump <b>overshoots further</b> (gap × 1.2 per step) and the loss climbs: 9 → 13 → 19 → 27 → 39 → 56. This is <b>divergence</b>, the classic sign of a learning rate that is too big.</>, 'DIVERGES', C.red));
  const path = gdSales(0.05, 500);
  [0, 1, 2, 3, 4, 20, 100, 500].forEach((k) => {
    const [m, b] = path[k], g = salesGrad(m, b);
    fr.push({ kind: '2d', k, losses: path.slice(0, Math.min(k, 30) + 1).map(([a, c]) => salesLoss(a, c)),
      draw: (s) => <>
        <polyline points={path.slice(0, k + 1).map(([a, c]) => `${s.sx(a)},${s.sy(c)}`).join(' ')} fill="none" stroke={C.gold} strokeWidth={2} />
        <Dots s={s} pts={path.slice(0, Math.min(k, 6) + 1).map(([a, c]) => ({ x: a, y: c }))} color={C.blue} r={4} animate={false} />
        {k < 500 && <Arrow s={s} x1={m} y1={b} x2={m - 0.05 * g[0]} y2={b - 0.05 * g[1]} color={C.red} width={2} />}
        <Dots s={s} pts={[{ x: 2, y: 1 }]} color={C.green} r={6} animate={false} /><Label s={s} x={2.12} y={0.8} color={C.green} size={12}>best (2, 1)</Label>
        <Dots s={s} pts={[{ x: m, y: b }]} color={C.gold} r={7} />
      </>,
      cap: k === 0 ? <>A real model: <b>sales ≈ m × advertising + b</b> with data (1, 3), (2, 5), (3, 7). The loss (mean squared error) now depends on <b>two</b> weights, so it is a contour map (left). Start at m = b = 0: loss <b>27.67</b>, gradient (−22.67, −10). The red arrow is the first step, −α × gradient with α = 0.05.</>
        : k === 1 ? <>Step 1: m = 0 − 0.05 × (−22.67) = <b>1.133</b>, b = 0 − 0.05 × (−10) = <b>0.5</b>. Loss drops to <b>5.49</b>. On the right, the yellow line is the model's current prediction.</>
          : k <= 4 ? <>Step {k}: m = {f2(m, 3)}, b = {f2(b, 3)}, loss <b>{f2(salesLoss(m, b), 3)}</b>. Notice the path heads straight for the long narrow valley, then has to turn: the loss is much steeper in m than in b.</>
            : k < 500 ? <>After {k} steps: m = {f2(m, 3)}, b = {f2(b, 3)}, loss {salesLoss(m, b).toExponential(1)}. Progress along the flat valley floor is slow; the remaining steps only polish the intercept.</>
              : <>After 500 steps: <b>m = 2.000, b = 1.000</b>: sales ≈ 2 × advertising + 1, a perfect fit. The loss fell 99.8% in the first four steps. This is how every neural network is trained, just with millions of weights instead of two.</>,
      read: [['step', k], ['m', f2(m, 3), C.gold], ['b', f2(b, 3), C.gold], ['loss', salesLoss(m, b) < 0.01 ? salesLoss(m, b).toExponential(1) : f2(salesLoss(m, b), 3), C.red]] });
  });
  return fr;
}

function Animate() {
  const frames = useMemo(buildFrames, []);
  const segs = useMemo(() => contours(salesLoss, [-0.5, 3], [-0.5, 2], [0.05, 0.2, 0.5, 1, 2, 4, 8, 14, 22, 30], 90), []);
  const p = useStepPlayer(frames.length, 2000);
  const f = frames[p.i];
  const path = useMemo(() => gdSales(0.05, 500), []);
  const mr: [number, number] = [-0.5, 3], br: [number, number] = [-0.5, 2];
  const cur = f.kind === '2d' ? path[f.k!] : undefined;
  const lossBars = (f.losses ?? []).map((v, i) => ({ x: i, y: v }));
  const lmax = Math.max(1, ...lossBars.map((d) => d.y)) * 1.1;
  return (
    <div>
      <Layout
        main={f.kind === '1d' ? <>
          <Plot x={f.xr!} y={f.yr!} height={320} xLabel="weight w" yLabel="loss L(w)">{f.draw}</Plot>
          <Plot x={[-0.6, Math.max(6, lossBars.length) - 0.4]} y={[0, lmax]} height={160} xTicks={6} fx={(v) => (Number.isInteger(v) ? String(v) : '')} xLabel="step" yLabel="loss">
            {(s) => <Bars s={s} data={lossBars} width={0.6} color={(i) => (i === lossBars.length - 1 ? C.gold : C.red)} />}
          </Plot>
        </> : <div className="row" style={{ gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 340px', minWidth: 0 }}>
            <Plot x={mr} y={br} width={520} height={equalH(mr, br, 520)} xLabel="m (slope)" yLabel="b (intercept)">
              {(s) => <>{segs.map((sg, i) => <path key={i} d={segPath(s, sg)} stroke={`hsl(${200 - i * 16}, 45%, 45%)`} strokeWidth={1.2} fill="none" />)}{f.draw(s)}</>}
            </Plot>
          </div>
          <div style={{ flex: '1 1 220px', minWidth: 0 }}>
            <Plot x={[0, 4]} y={[0, 10]} width={360} height={300} xLabel="advertising (₹ lakh)" yLabel="sales (₹ lakh)">
              {(s) => <>
                <FnLine s={s} f={(x) => cur![0] * x + cur![1]} color={C.yellow} />
                {XS.map((x, i) => <Seg key={i} s={s} x1={x} y1={YS[i]} x2={x} y2={cur![0] * x + cur![1]} color={C.red} width={1.5} />)}
                <Dots s={s} pts={XS.map((x, i) => ({ x, y: YS[i] }))} color={C.blue} r={6} animate={false} />
              </>}
            </Plot>
          </div>
        </div>}
        side={<>
          <Readout items={f.read} />
          <Legend items={f.kind === '1d' ? [['loss curve', C.blue], ['slope (tangent)', C.yellow], ['step taken', C.red], ['minimum', C.green]] : [['path of (m, b)', C.gold], ['next step −α∇L', C.red], ['data', C.blue], ['current model line', C.yellow], ['errors', C.red]]} />
          <p className="small muted" style={{ margin: 0 }}><b>w ← w − α · ∇L(w)</b>. The gradient gives the direction, the learning rate α sets the step size. Too small: slow. Too big: bounce or blow up.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{f.cap}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
type SK = 'round' | 'narrow' | 'sales' | 'valleys';
const SURF: Record<SK, { label: string; f: (m: number, b: number) => number; g: (m: number, b: number) => V2; xr: [number, number]; yr: [number, number]; start: V2; note: string }> = {
  round: { label: 'Round bowl', f: (m, b) => m * m + b * b, g: (m, b) => [2 * m, 2 * b], xr: [-3, 3], yr: [-3, 3], start: [-2.5, 2], note: 'Round bowl: converges for any α below 1; at exactly 0.5 it lands in one step.' },
  narrow: { label: 'Narrow valley', f: (m, b) => m * m + 10 * b * b, g: (m, b) => [2 * m, 20 * b], xr: [-3, 3], yr: [-3, 3], start: [-2.5, 1.5], note: 'Steep walls in b force a small α (below 0.1), which makes progress along m crawl. Momentum helps.' },
  sales: { label: 'Sales line fit', f: salesLoss, g: salesGrad, xr: [-1, 4], yr: [-1.5, 3.5], start: [0, 0], note: 'The real regression loss from the Animate tab. Above α ≈ 0.18 it diverges.' },
  valleys: { label: 'Two valleys', f: (m, b) => 0.5 * (m * m - 2) ** 2 + 0.6 * m + b * b, g: (m, b) => [2 * m * (m * m - 2) + 0.6, 2 * b], xr: [-3, 3], yr: [-3, 3], start: [2.5, 2], note: 'Not a bowl: the deeper valley is on the left. Where you start decides where you end up.' },
};
const ALPHAS = [0.001, 0.003, 0.01, 0.02, 0.05, 0.08, 0.1, 0.15, 0.2, 0.3, 0.5, 0.7, 0.9, 1.0, 1.1];

function run(S: (typeof SURF)[SK], start: V2, alpha: number, n: number, momentum: boolean) {
  const path: V2[] = [start]; let v: V2 = [0, 0]; let diverged = false;
  for (let k = 0; k < n; k++) {
    const [m, b] = path[k], g = S.g(m, b);
    v = momentum ? [0.9 * v[0] + g[0], 0.9 * v[1] + g[1]] : g;
    const q: V2 = [m - alpha * v[0], b - alpha * v[1]];
    if (!isFinite(q[0]) || !isFinite(q[1]) || Math.abs(q[0]) > 1e6 || Math.abs(q[1]) > 1e6) { diverged = true; break; }
    path.push(q);
  }
  const last = path[path.length - 1];
  if (Math.abs(last[0]) > 50 || Math.abs(last[1]) > 50) diverged = true;
  return { path, diverged };
}

function Playground() {
  const [key, setKey] = useState<SK>('narrow');
  const S = SURF[key];
  const [start, setStart] = useState<V2>(S.start);
  const [ai, setAi] = useState(4);
  const [n, setN] = useState(30);
  const [mom, setMom] = useState(false);
  const alpha = ALPHAS[ai];
  const { segs, fmin } = useMemo(() => {
    const vals: number[] = [];
    for (let i = 0; i <= 40; i++) for (let j = 0; j <= 40; j++) vals.push(S.f(S.xr[0] + ((S.xr[1] - S.xr[0]) * i) / 40, S.yr[0] + ((S.yr[1] - S.yr[0]) * j) / 40));
    vals.sort((a, b) => a - b);
    const lv = [0.01, 0.04, 0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 0.92].map((q) => vals[Math.floor(q * (vals.length - 1))]);
    return { segs: contours(S.f, S.xr, S.yr, lv, 80), fmin: vals[0] };
  }, [S]);
  const { path, diverged } = useMemo(() => run(S, start, alpha, n, mom), [S, start, alpha, n, mom]);
  const last = path[path.length - 1], lossNow = S.f(last[0], last[1]);
  const logs = path.map(([m, b]) => Math.log10(Math.max(S.f(m, b) - fmin, 1e-6)));
  const hiL = Math.max(1, ...logs) + 0.5;
  const choose = (k: SK) => { setKey(k); setStart(SURF[k].start); };
  const cl = (p: V2): V2 => [clamp(p[0], -1e3, 1e3), clamp(p[1], -1e3, 1e3)];
  return (
    <Layout
      main={<>
        <Plot x={S.xr} y={S.yr} width={600} height={equalH(S.xr, S.yr, 600)} xLabel="weight 1" yLabel="weight 2" onClick={(q) => setStart([+q.x.toFixed(2), +q.y.toFixed(2)])}>
          {(s) => <>
            {segs.map((sg, i) => <path key={i} d={segPath(s, sg)} stroke={`hsl(${200 - i * 18}, 45%, 45%)`} strokeWidth={1.2} fill="none" />)}
            <path d={polyPath(s, path.map(cl))} fill="none" stroke={diverged ? C.red : C.gold} strokeWidth={2} />
            <Dots s={s} pts={path.slice(0, 60).map(([a, c]) => ({ x: clamp(a, -1e3, 1e3), y: clamp(c, -1e3, 1e3) }))} color={diverged ? C.red : C.blue} r={3} animate={false} />
            <Dots s={s} pts={[{ x: start[0], y: start[1] }]} color={C.text} r={6} animate={false} />
            {!diverged && <Dots s={s} pts={[{ x: last[0], y: last[1] }]} color={C.gold} r={7} animate={false} />}
          </>}
        </Plot>
        <Plot x={[0, Math.max(n, 2)]} y={[-6.5, hiL]} width={600} height={170} xLabel="step" yLabel="loss above min" fy={(v) => (Number.isInteger(v) ? `1e${v}` : '')} yTicks={5}>
          {(s) => <>
            <path d={polyPath(s, logs.map((v, i) => [i, v] as V2))} fill="none" stroke={diverged ? C.red : C.yellow} strokeWidth={2} />
            {diverged && <Label s={s} x={Math.max(n, 2) * 0.5} y={(hiL - 6.5) / 2} anchor="middle" color={C.red} size={14}>diverged: loss exploded</Label>}
          </>}
        </Plot>
      </>}
      side={<>
        <Choice label="Loss surface" value={key} onChange={choose} options={(Object.keys(SURF) as SK[]).map((k) => ({ value: k, label: SURF[k].label }))} />
        <Slider label="learning rate α" min={0} max={ALPHAS.length - 1} value={ai} onChange={setAi} format={() => String(alpha)} />
        <Slider label="steps" min={1} max={200} value={n} onChange={setN} />
        <Toggle label="momentum (β = 0.9)" value={mom} onChange={setMom} />
        <Readout items={[
          ['start (click map)', `(${f2(start[0])}, ${f2(start[1])})`],
          ['final point', diverged ? 'off the map' : `(${f2(last[0])}, ${f2(last[1])})`, diverged ? C.red : C.gold],
          ['final loss', diverged ? '∞' : f2(lossNow, 4), diverged ? C.red : C.yellow],
          ['status', diverged ? 'diverged' : lossNow - fmin < 1e-3 ? 'converged' : 'still descending', diverged ? C.red : lossNow - fmin < 1e-3 ? C.green : C.muted],
        ]} />
        <p className="small muted" style={{ margin: 0 }}>{S.note}</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'A blindfolded walk to the bottom of a loss curve: feel the slope, step downhill, repeat. Then the same walk with four different learning rates, and finally on a real 2-weight problem (fitting a sales line).', steps: [
      { do: 'Step through the first six frames.', notice: 'Each step is **w − α × slope**. Steps shrink by themselves as the slope flattens near w = 3, and the loss bars drop fast.' },
      { do: 'Keep stepping through α = 0.01, 0.5, 1.0 and 1.1.', notice: 'Too small crawls, 1.0 bounces between 0 and 6 for ever, and **1.1 diverges**: each jump lands higher than the last.' },
      { do: 'Watch the contour-map frames at the end.', notice: 'The (m, b) point zooms into the narrow valley in 4 steps, then creeps along it to (2, 1). The yellow line on the right fits the data.' },
    ] },
    Playground: { what: 'Run gradient descent on a 2-D loss surface. Click the map to choose a starting point; set the learning rate, number of steps and momentum. The lower chart shows the loss on a log scale.', steps: [
      { do: 'On **Narrow valley**, move the learning rate from 0.05 up to 0.1, then 0.15.', notice: 'The path zig-zags across the valley more and more, then **diverges** (red). Steep directions set the speed limit.' },
      { do: 'Set α back to 0.05 and switch **momentum** on.', notice: 'Momentum builds up speed along the flat valley floor and reaches the minimum in far fewer steps.' },
      { do: 'Choose **Two valleys** and click starting points on the right and left.', notice: 'Starting on the right ends in the shallower **local** minimum; gradient descent only knows the local slope.' },
    ] },
  },
};
export default anim;
