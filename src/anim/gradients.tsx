// Gradients & chain rule: partial derivatives as slopes of slices, the gradient arrow on a contour map, the gradient field,
// then back-propagation through one neuron as a chain of local slopes.
import { ReactNode, useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Arrow, Dots, Seg, Label, FnLine, Caption, Readout, Slider, Choice, Toggle, Layout, Legend, useStepPlayer, PlayerControls, C, Scales } from '../viz/kit';
import { V2, norm, sigmoid } from '../viz/math';
import { contours, segPath, equalH, f2 } from './_math-helpers';

/* ---------- pure helpers ---------- */
type F2 = (m: number, b: number) => number;
const bowl: F2 = (m, b) => m * m + 3 * b * b;
const numGrad = (f: F2, m: number, b: number): V2 => { const e = 1e-4; return [(f(m + e, b) - f(m - e, b)) / (2 * e), (f(m, b + e) - f(m, b - e)) / (2 * e)]; };

function ContourMap({ s, segs, colors }: { s: Scales; segs: ReturnType<typeof contours>; colors?: (i: number) => string }) {
  return <>{segs.map((sg, i) => <path key={i} d={segPath(s, sg)} stroke={colors ? colors(i) : C.grey} strokeWidth={1.3} fill="none" />)}</>;
}
const shade = (i: number, n: number) => `hsl(${200 - (i / Math.max(1, n - 1)) * 160}, 45%, ${38 + (i / Math.max(1, n - 1)) * 14}%)`;

/** Computation-graph node for the chain-rule frames. */
function Node({ s, x, y, title, value, hl }: { s: Scales; x: number; y: number; title: string; value: string; hl?: boolean }) {
  const w = 1.5, h = 1.1;
  return <g>
    <rect x={s.sx(x - w / 2)} y={s.sy(y + h / 2)} width={s.sx(w) - s.sx(0)} height={s.sy(0) - s.sy(h)} rx={8} fill={C.bg} stroke={hl ? C.gold : C.blue} strokeWidth={hl ? 2.5 : 1.5} />
    <text x={s.sx(x)} y={s.sy(y + 0.12)} fill={C.muted} fontSize={12} textAnchor="middle">{title}</text>
    <text x={s.sx(x)} y={s.sy(y - 0.32)} fill={C.text} fontSize={15} textAnchor="middle" fontFamily="JetBrains Mono, monospace">{value}</text>
  </g>;
}

/* ---------- Animate ---------- */
const P: V2 = [1, 2];
const G: V2 = [2, 12];
const K = 0.12; // arrows are drawn at 0.13 × their true length so they fit
const XR: [number, number] = [-3, 3], YR: [number, number] = [-2.2, 3.8];
const LEVELS = [1, 3, 6, 9, 13, 18, 24, 31];
type Frame = { kind: 'map' | 'chain'; draw: (s: Scales) => ReactNode; slice?: 'm' | 'b'; cap: ReactNode; read: [string, ReactNode, string?][] };

function buildFrames(segs: ReturnType<typeof contours>): Frame[] {
  const base = (s: Scales) => <>
    <ContourMap s={s} segs={segs} colors={(i) => (LEVELS[i] === 13 ? C.blue : shade(i, LEVELS.length))} />
    <Label s={s} x={0.08} y={0.12} color={C.green} size={12}>min</Label>
    <Dots s={s} pts={[{ x: 0, y: 0 }]} color={C.green} r={4} animate={false} />
  </>;
  const pt = (s: Scales) => <><Dots s={s} pts={[{ x: P[0], y: P[1] }]} color={C.gold} r={7} animate={false} /><Label s={s} x={P[0] + 0.12} y={P[1] - 0.28} color={C.gold}>(1, 2)</Label></>;
  const gArrow = (s: Scales) => <Arrow s={s} x1={P[0]} y1={P[1]} x2={P[0] + K * G[0]} y2={P[1] + K * G[1]} color={C.yellow} width={3} label="∇f" />;
  const tangent: V2 = [-G[1] / norm(G), G[0] / norm(G)];
  const field = (s: Scales, dense: boolean) => {
    const out: ReactNode[] = []; const st = dense ? 0.5 : 1;
    for (let m = -2.5; m <= 2.51; m += st) for (let b = -2; b <= 3.51; b += st) {
      const g = numGrad(bowl, m, b); if (norm(g) < 1e-6) continue;
      out.push(<Arrow key={`${m},${b}`} s={s} x1={m} y1={b} x2={m + 0.035 * g[0]} y2={b + 0.035 * g[1]} color={C.yellow} width={1.4} />);
    }
    return out;
  };
  const graph = (stage: number) => (s: Scales) => {
    const z = 1, a = sigmoid(1), L = (a - 1) ** 2, dLda = 2 * (a - 1), dadz = a * (1 - a);
    const back = (x1: number, x2: number, txt: string, show: boolean) => show && <>
      <Arrow s={s} x1={x2 - 0.8} y1={-0.95} x2={x1 + 0.8} y2={-0.95} color={C.red} width={2} />
      <Label s={s} x={(x1 + x2) / 2} y={-1.45} color={C.red} anchor="middle" size={13}>{txt}</Label>
    </>;
    return <>
      {[[0, 3], [3, 6], [6, 9]].map(([a1, a2], i) => <Arrow key={i} s={s} x1={a1 + 0.8} y1={0} x2={a2 - 0.8} y2={0} color={C.muted} width={1.5} />)}
      <Node s={s} x={0} y={0} title="w (x = 2)" value="w = 0.5" hl={stage === 4} />
      <Node s={s} x={3} y={0} title="z = w·x" value={f2(z, 2)} hl={stage === 3} />
      <Node s={s} x={6} y={0} title="a = σ(z)" value={f2(a, 4)} hl={stage === 2} />
      <Node s={s} x={9} y={0} title="L = (a − 1)²" value={f2(L, 4)} hl={stage === 1} />
      {back(6, 9, `∂L/∂a = ${f2(dLda, 4)}`, stage >= 1)}
      {back(3, 6, `∂a/∂z = ${f2(dadz, 4)}`, stage >= 2)}
      {back(0, 3, '∂z/∂w = x = 2', stage >= 3)}
      {stage >= 4 && <Label s={s} x={4.5} y={1.4} color={C.gold} anchor="middle" size={15}>∂L/∂w = {f2(dLda, 4)} × {f2(dadz, 4)} × 2 = {f2(dLda * dadz * 2, 4)}</Label>}
    </>;
  };
  return [
    { kind: 'map', draw: (s) => <>{base(s)}{pt(s)}</>,
      cap: <>A <b>contour map</b> of f(m, b) = m² + 3b², like a hiking map of a valley. Each ring joins points of <b>equal height</b>; the lowest point is (0, 0). We stand at <b>(1, 2)</b>, height 1 + 12 = <b>13</b> (blue ring). Which way is uphill, and how steep?</>,
      read: [['position (m, b)', '(1, 2)', C.gold], ['height f', '13']] },
    { kind: 'map', slice: 'm', draw: (s) => <>{base(s)}<Seg s={s} x1={-3} y1={2} x2={3} y2={2} color={C.teal} dash="5 4" />{pt(s)}<Arrow s={s} x1={P[0]} y1={P[1]} x2={P[0] + K * G[0]} y2={P[1]} color={C.teal} width={3} label="∂f/∂m = 2" /></>,
      cap: <>Freeze b = 2 and walk only in the <b>m direction</b> (teal dashed line). The lower chart is that slice: m² + 12. Its slope at m = 1 is 2m = <b>2</b>. That is the <b>partial derivative ∂f/∂m</b>.</>,
      read: [['∂f/∂m = 2m', '2', C.teal]] },
    { kind: 'map', slice: 'b', draw: (s) => <>{base(s)}<Seg s={s} x1={1} y1={-2.2} x2={1} y2={3.8} color={C.purple} dash="5 4" />{pt(s)}
      <Arrow s={s} x1={P[0]} y1={P[1]} x2={P[0] + K * G[0]} y2={P[1]} color={C.teal} width={2} /><Arrow s={s} x1={P[0]} y1={P[1]} x2={P[0]} y2={P[1] + K * G[1]} color={C.purple} width={3} label="∂f/∂b = 12" /></>,
      cap: <>Now freeze m = 1 and walk in the <b>b direction</b>. The slice 1 + 3b² has slope 6b = <b>12</b> at b = 2. Six times steeper than the m direction: this valley is narrow in b.</>,
      read: [['∂f/∂m', '2', C.teal], ['∂f/∂b = 6b', '12', C.purple]] },
    { kind: 'map', draw: (s) => <>{base(s)}{pt(s)}
      <Seg s={s} x1={P[0] + K * G[0]} y1={P[1]} x2={P[0] + K * G[0]} y2={P[1] + K * G[1]} color={C.purple} dash="3 3" width={1.2} />
      <Arrow s={s} x1={P[0]} y1={P[1]} x2={P[0] + K * G[0]} y2={P[1]} color={C.teal} width={2} />{gArrow(s)}</>,
      cap: <>Stack the two partial slopes into one vector: the <b>gradient ∇f = (2, 12)</b> (yellow, drawn at {K}× length). It points in the direction of <b>steepest ascent</b>, and its length √(2² + 12²) ≈ <b>12.17</b> is how steep that climb is.</>,
      read: [['∇f', '(2, 12)', C.yellow], ['steepness ‖∇f‖', '12.17', C.yellow]] },
    { kind: 'map', draw: (s) => <>{base(s)}
      <Seg s={s} x1={P[0] - 0.9 * tangent[0]} y1={P[1] - 0.9 * tangent[1]} x2={P[0] + 0.9 * tangent[0]} y2={P[1] + 0.9 * tangent[1]} color={C.blue} width={2} dash="6 3" />
      {gArrow(s)}{pt(s)}</>,
      cap: <>Notice the angle: the gradient crosses the contour line at <b>90°</b>. Walking along a contour (dashed blue) keeps your height constant, so the slope there is 0; all the steepness lies in the perpendicular direction.</>,
      read: [['slope along contour', '0', C.blue], ['slope along ∇f', '12.17', C.yellow]] },
    { kind: 'map', draw: (s) => <>{base(s)}
      {Array.from({ length: 8 }, (_, i) => { const t = (i * Math.PI) / 4, u: V2 = [Math.cos(t), Math.sin(t)], d = u[0] * G[0] + u[1] * G[1];
        return <g key={i}><Arrow s={s} x1={P[0]} y1={P[1]} x2={P[0] + 0.6 * u[0]} y2={P[1] + 0.6 * u[1]} color={d < 0 ? C.green : C.grey} width={1.5} /><Label s={s} x={P[0] + 0.85 * u[0]} y={P[1] + 0.85 * u[1] - 0.08} color={d < 0 ? C.green : C.muted} anchor="middle" size={11}>{d.toFixed(1)}</Label></g>; })}
      <Arrow s={s} x1={P[0]} y1={P[1]} x2={P[0] - K * G[0]} y2={P[1] - K * G[1]} color={C.red} width={3} label="−∇f" />{pt(s)}</>,
      cap: <>Slope in 8 compass directions = ∇f · direction. Every one is smaller in size than 12.17. Downhill directions are green; the steepest way <b>down</b> is <b>−∇f = (−2, −12)</b> (red): mostly decrease b, a little m. That single arrow is what gradient descent follows.</>,
      read: [['steepest descent', '(−2, −12)', C.red], ['max slope', '12.17']] },
    { kind: 'map', draw: (s) => <>{base(s)}{field(s, false)}{pt(s)}</>,
      cap: <>Compute the gradient <b>everywhere</b> and you get a field of arrows. Each one is perpendicular to its contour and points away from the minimum. They are longest where the rings are packed tight (steep walls, high b) and shrink to zero at the bottom.</>,
      read: [['∇f at (0, 0)', '(0, 0)', C.green], ['∇f at (1, 2)', '(2, 12)', C.yellow]] },
    { kind: 'map', draw: (s) => <>{base(s)}{field(s, true)}</>,
      cap: <>Denser field. Follow the arrows <b>backwards</b> from any point and you slide into the green minimum. In a model with a million weights the map has a million directions, but the gradient is still "the list of partial slopes", one per weight.</>,
      read: [['dimensions', '2 here, millions in deep nets']] },
    { kind: 'chain', draw: graph(0),
      cap: <><b>Chain rule.</b> How do we get partial slopes inside a neural network? One neuron: input x = 2, weight w = 0.5, z = w·x = 1, a = σ(z) = 0.7311, loss L = (a − 1)² = 0.0723. This is the <b>forward pass</b>.</>,
      read: [['L', '0.0723', C.red]] },
    { kind: 'chain', draw: graph(1), cap: <>Backward, one link at a time. Last link: L = (a − 1)², so ∂L/∂a = 2(a − 1) = <b>−0.5379</b>. Raising a would lower the loss.</>, read: [['∂L/∂a', '−0.5379', C.red]] },
    { kind: 'chain', draw: graph(2), cap: <>Middle link: the sigmoid's slope is σ(z)(1 − σ(z)) = 0.7311 × 0.2689 = <b>0.1966</b>.</>, read: [['∂L/∂a', '−0.5379', C.red], ['∂a/∂z', '0.1966', C.red]] },
    { kind: 'chain', draw: graph(3), cap: <>First link: z = w·x, so ∂z/∂w = x = <b>2</b>.</>, read: [['∂L/∂a', '−0.5379', C.red], ['∂a/∂z', '0.1966', C.red], ['∂z/∂w', '2', C.red]] },
    { kind: 'chain', draw: graph(4),
      cap: <><b>Multiply the local slopes</b>: ∂L/∂w = −0.5379 × 0.1966 × 2 ≈ <b>−0.2115</b>. Negative, so increasing w reduces the loss. Back-propagation is exactly this, repeated for every weight: the chain rule fills in each entry of the gradient.</>,
      read: [['∂L/∂w', '−0.2115', C.gold], ['so', 'increase w']] },
  ];
}

function Animate() {
  const segs = useMemo(() => contours(bowl, XR, YR, LEVELS, 90), []);
  const frames = useMemo(() => buildFrames(segs), [segs]);
  const p = useStepPlayer(frames.length, 2100);
  const f = frames[p.i];
  return (
    <div>
      <Layout
        main={f.kind === 'map' ? <>
          <Plot x={XR} y={YR} width={600} height={equalH(XR, YR, 600)} xLabel="m (slope weight)" yLabel="b (intercept)">{f.draw}</Plot>
          {f.slice && <Plot x={[-3, 3]} y={[0, 30]} width={600} height={180} xLabel={f.slice === 'm' ? 'm (b held at 2)' : 'b (m held at 1)'} yLabel="f">
            {(s) => f.slice === 'm'
              ? <><FnLine s={s} f={(m) => m * m + 12} color={C.teal} /><FnLine s={s} f={(m) => 13 + 2 * (m - 1)} from={-0.5} to={2.5} color={C.yellow} width={1.8} dash="5 3" /><Dots s={s} pts={[{ x: 1, y: 13 }]} color={C.gold} r={6} animate={false} /><Label s={s} x={1.2} y={9} color={C.teal}>slope 2</Label></>
              : <><FnLine s={s} f={(b) => 1 + 3 * b * b} color={C.purple} /><FnLine s={s} f={(b) => 13 + 12 * (b - 2)} from={1.2} to={2.7} color={C.yellow} width={1.8} dash="5 3" /><Dots s={s} pts={[{ x: 2, y: 13 }]} color={C.gold} r={6} animate={false} /><Label s={s} x={0.6} y={18} color={C.purple}>slope 12</Label></>}
          </Plot>}
        </> : <Plot x={[-1, 10]} y={[-2.2, 2.2]} height={300} grid={false} xTicks={0} yTicks={0}>{f.draw}</Plot>}
        side={<>
          <Readout items={f.read} />
          <Legend items={f.kind === 'map' ? [['contours (equal height)', C.grey], ['gradient (uphill)', C.yellow], ['steepest descent', C.red], ['our position', C.gold]] : [['forward values', C.blue], ['local slopes (backward)', C.red], ['node being used', C.gold]]} />
          <p className="small muted" style={{ margin: 0 }}>{f.kind === 'map' ? 'Gradient = (∂f/∂m, ∂f/∂b): one partial slope per input. Arrows on the map are drawn shorter than true length.' : 'Chain rule: the slope through a chain of functions is the product of the slopes of each link.'}</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{f.cap}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
const PXR: [number, number] = [-3, 3], PYR: [number, number] = [-2.5, 2.5];
type FK = 'bowl' | 'round' | 'saddle' | 'hills';
const FUNCS: Record<FK, { label: string; f: F2; levels: number[]; k: number; note: string }> = {
  bowl: { label: 'Narrow bowl m² + 3b²', f: bowl, levels: [0.5, 2, 4, 7, 10, 14, 19, 25], k: 0.08, note: 'Contours are ellipses; the gradient does not point at the centre unless you are on an axis.' },
  round: { label: 'Round bowl m² + b²', f: (m, b) => m * m + b * b, levels: [0.5, 1.5, 3, 5, 7, 9], k: 0.15, note: 'Round contours: here −∇f points straight at the minimum.' },
  saddle: { label: 'Saddle m² − b²', f: (m, b) => m * m - b * b, levels: [-6, -4, -2, -0.5, 0.5, 2, 4, 6], k: 0.15, note: 'At (0, 0) the gradient is zero but it is not a minimum: up in m, down in b.' },
  hills: { label: 'Two hills', f: (m, b) => 3 * Math.exp(-((m - 1) ** 2 + (b - 0.8) ** 2)) + 2 * Math.exp(-((m + 1.3) ** 2 + (b + 1) ** 2) / 0.8), levels: [0.2, 0.5, 1, 1.5, 2, 2.5], k: 0.5, note: 'Each hilltop has zero gradient. Following the gradient uphill finds the nearest top, not necessarily the highest.' },
};

function Playground() {
  const [key, setKey] = useState<FK>('bowl');
  const [pt, setPt] = useState<V2>([1.5, 1]);
  const [ang, setAng] = useState(200);
  const [showField, setShowField] = useState(false);
  const F = FUNCS[key];
  const segs = useMemo(() => contours(F.f, PXR, PYR, F.levels, 80), [F]);
  const g = numGrad(F.f, pt[0], pt[1]), gn = norm(g);
  const u: V2 = [Math.cos((ang * Math.PI) / 180), Math.sin((ang * Math.PI) / 180)];
  const du = u[0] * g[0] + u[1] * g[1];
  const gAng = ((Math.atan2(g[1], g[0]) * 180) / Math.PI + 360) % 360;
  const lim = Math.max(gn, 0.5) * 1.15;
  return (
    <Layout
      main={<>
        <Plot x={PXR} y={PYR} width={600} height={equalH(PXR, PYR, 600)} xLabel="m" yLabel="b" onClick={(q) => setPt([+q.x.toFixed(2), +q.y.toFixed(2)])}>
          {(s) => <>
            <ContourMap s={s} segs={segs} colors={(i) => shade(i, F.levels.length)} />
            {showField && Array.from({ length: 13 * 11 }, (_, i) => { const m = -3 + (i % 13) * 0.5, b = -2.5 + Math.floor(i / 13) * 0.5, q = numGrad(F.f, m, b);
              return norm(q) > 1e-6 ? <Arrow key={i} s={s} x1={m} y1={b} x2={m + F.k * 0.5 * q[0]} y2={b + F.k * 0.5 * q[1]} color={C.yellow} width={1} /> : null; })}
            {gn > 1e-6 && <><Arrow s={s} x1={pt[0]} y1={pt[1]} x2={pt[0] + F.k * g[0]} y2={pt[1] + F.k * g[1]} color={C.yellow} width={3} label="∇f" />
              <Arrow s={s} x1={pt[0]} y1={pt[1]} x2={pt[0] - F.k * g[0]} y2={pt[1] - F.k * g[1]} color={C.red} width={2} /></>}
            <Arrow s={s} x1={pt[0]} y1={pt[1]} x2={pt[0] + 0.7 * u[0]} y2={pt[1] + 0.7 * u[1]} color={C.teal} width={2.5} label="u" />
            <Dots s={s} pts={[{ x: pt[0], y: pt[1] }]} color={C.gold} r={7} animate={false} />
          </>}
        </Plot>
        <Plot x={[0, 360]} y={[-lim, lim]} width={600} height={170} xTicks={8} yTicks={4} xLabel="direction u (degrees)" yLabel="slope along u">
          {(s) => <>
            <Seg s={s} x1={0} y1={0} x2={360} y2={0} color={C.muted} width={1} />
            <FnLine s={s} f={(t) => Math.cos((t * Math.PI) / 180) * g[0] + Math.sin((t * Math.PI) / 180) * g[1]} color={C.teal} />
            {gn > 1e-6 && <Seg s={s} x1={gAng} y1={-lim} x2={gAng} y2={lim} color={C.yellow} dash="4 3" width={1.2} />}
            <Dots s={s} pts={[{ x: ang, y: du }]} color={C.gold} r={6} animate={false} />
          </>}
        </Plot>
      </>}
      side={<>
        <Choice label="Surface" value={key} onChange={setKey} options={(Object.keys(FUNCS) as FK[]).map((k) => ({ value: k, label: FUNCS[k].label }))} />
        <Slider label="walking direction u" min={0} max={359} value={ang} onChange={setAng} format={(v) => `${v}°`} />
        <Toggle label="show gradient field" value={showField} onChange={setShowField} />
        <Readout items={[
          ['point (click)', `(${f2(pt[0])}, ${f2(pt[1])})`, C.gold],
          ['height f', f2(F.f(pt[0], pt[1])), C.text],
          ['∇f', `(${f2(g[0])}, ${f2(g[1])})`, C.yellow],
          ['‖∇f‖ (max slope)', f2(gn), C.yellow],
          ['slope along u', f2(du), du < 0 ? C.green : C.red],
          ['∇f direction', gn > 1e-6 ? `${gAng.toFixed(0)}°` : 'none (flat)', C.yellow],
        ]} />
        <p className="small muted" style={{ margin: 0 }}>{F.note} The lower curve is ∇f · u: it peaks at ‖∇f‖ exactly when u points along the gradient (dashed line) and bottoms out in the opposite direction.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'On the contour map of **f(m, b) = m² + 3b²** we measure the slope in each direction, stack the slopes into the **gradient**, see the whole gradient field, and finally use the **chain rule** to get a gradient through one neuron.', steps: [
      { do: 'Step through the first four frames, watching the lower slice chart.', notice: 'Each partial derivative is the slope of a 1-D slice: 2 in m, 12 in b. Together they form ∇f = (2, 12).' },
      { do: 'Look at the frames with the dashed contour tangent and the 8-direction compass.', notice: 'The gradient is **perpendicular to the contour**; no other direction is steeper; −∇f is steepest downhill.' },
      { do: 'Step through the last five frames (the boxes).', notice: 'Back-propagation multiplies local slopes along the chain: −0.5379 × 0.1966 × 2 = **−0.2115**.' },
    ] },
    Playground: { what: 'Click anywhere on the map to stand there. The yellow arrow is the gradient, red the steepest descent, teal a walking direction you choose. The lower chart shows the slope for every walking direction.', steps: [
      { do: 'Drag **walking direction u** all the way round.', notice: 'The slope traces a wave that peaks (= ‖∇f‖) exactly at the gradient direction and is zero at right angles to it.' },
      { do: 'Choose **Saddle** and click on (0, 0).', notice: 'The gradient vanishes, yet it is not a minimum: a zero gradient only means "flat", not "best".' },
      { do: 'Choose **Two hills**, turn on the field, and click between the hills.', notice: 'Arrows lead to the nearest hilltop. Gradient methods are local: they can miss the highest (or lowest) point.' },
    ] },
  },
};
export default anim;
