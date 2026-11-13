// MLP: a tiny 2-4-1 network; a forward pass lights up, errors flow back, and hidden units bend the boundary while the loss falls.
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Dots, Seg, Label, Caption, Readout, Slider, Choice, Toggle, Layout, Legend, useStepPlayer, PlayerControls, Tex, C, Scales } from '../viz/kit';
import { LP, moons, xorPts, rings, trainMLP, mlpForward, MLPW, DecisionHeat, lineEnds, f2 } from './_clf-helpers';

/* ---------- pure helpers ---------- */
const CL = [C.blue, C.red];
const XR: [number, number] = [-3.5, 3.5], YR: [number, number] = [-2.4, 2.4];

/** Network diagram. `act` (optional) = values to print in nodes; `glow` = which layer of edges to highlight. */
function NetDiagram({ m, act, glow, back }: { m: MLPW; act?: { x: [number, number]; h?: number[]; p?: number }; glow?: 'in' | 'out'; back?: boolean }) {
  const H = m.W.length, W = 380, Hh = 250;
  const inY = [Hh * 0.35, Hh * 0.65], hY = m.W.map((_, j) => (Hh * (j + 0.5)) / H + 0), oY = Hh / 2;
  const X0 = 50, X1 = 190, X2 = 330;
  const ec = (w: number) => (w >= 0 ? C.teal : C.pink);
  const ew = (w: number) => 0.6 + Math.min(Math.abs(w), 4) * 1.1;
  const node = (x: number, y: number, label: string, val?: number, scale = 1) => {
    const a = val === undefined ? 0 : Math.min(1, Math.abs(val) / scale);
    return <g key={label + x + y}>
      <circle cx={x} cy={y} r={20} fill={val === undefined ? '#151a22' : val >= 0 ? C.gold : C.purple} fillOpacity={val === undefined ? 1 : 0.15 + 0.75 * a} stroke={C.muted} strokeWidth={1.4} />
      <text x={x} y={y + (val === undefined ? 4 : -2)} textAnchor="middle" fill={C.text} fontSize={11}>{label}</text>
      {val !== undefined && <text x={x} y={y + 11} textAnchor="middle" fill={C.text} fontSize={11} fontWeight={700}>{f2(val)}</text>}
    </g>;
  };
  return (
    <svg viewBox={`0 0 ${W} ${Hh}`} className="canvas">
      {m.W.map((w, j) => [0, 1].map((k) => <line key={`i${j}${k}`} x1={X0} y1={inY[k]} x2={X1} y2={hY[j]} stroke={glow === 'in' ? (back ? C.gold : ec(w[k])) : ec(w[k])} strokeWidth={ew(w[k]) + (glow === 'in' ? 1 : 0)} strokeOpacity={glow && glow !== 'in' ? 0.3 : 0.85} />))}
      {m.v.map((v, j) => <line key={`o${j}`} x1={X1} y1={hY[j]} x2={X2} y2={oY} stroke={glow === 'out' && back ? C.gold : ec(v)} strokeWidth={ew(v) + (glow === 'out' ? 1 : 0)} strokeOpacity={glow && glow !== 'out' ? 0.3 : 0.85} />)}
      {node(X0, inY[0], 'x₁', act?.x[0], 2.5)}{node(X0, inY[1], 'x₂', act?.x[1], 2.5)}
      {m.W.map((_, j) => node(X1, hY[j], `h${j + 1}`, act?.h?.[j], 1))}
      {node(X2, oY, 'p', act?.p, 1)}
      <text x={X0} y={Hh - 6} textAnchor="middle" fill={C.muted} fontSize={11}>inputs</text>
      <text x={X1} y={Hh - 2} textAnchor="middle" fill={C.muted} fontSize={11}>hidden (tanh)</text>
      <text x={X2} y={Hh - 6} textAnchor="middle" fill={C.muted} fontSize={11}>output (sigmoid)</text>
    </svg>
  );
}
function HiddenLines({ s, m }: { s: Scales; m: MLPW }) {
  return <>{m.W.map((w, j) => {
    const e = lineEnds(s, w, m.bh[j]); if (!e) return null;
    // label at the foot of the perpendicular from the origin, kept inside the view
    const n2 = w[0] * w[0] + w[1] * w[1], fx = Math.max(-3.1, Math.min(3.1, (-m.bh[j] * w[0]) / n2)), fy = Math.max(-2.1, Math.min(2.1, (-m.bh[j] * w[1]) / n2));
    return <g key={j}><Seg s={s} x1={e[0]} y1={e[1]} x2={e[2]} y2={e[3]} color={C.teal} width={1.4} dash="5 4" /><Label s={s} x={fx + 0.08} y={fy + 0.1} color={C.teal} size={12}>{`h${j + 1}`}</Label></g>;
  })}</>;
}

/* ---------- Animate ---------- */
const DATA = moons(100, 0.2, 4);
const H = 4;
const SNAP_EPOCHS = Array.from({ length: 151 }, (_, k) => k * 10);
const TRAIN_FRAMES = [10, 30, 60, 100, 200, 400, 800, 1500];
type MF = { kind: 'intro' | 'in' | 'hid' | 'out' | 'back' | 'train' | 'final'; epoch: number };

function Animate() {
  const snaps = useMemo(() => trainMLP(DATA, H, SNAP_EPOCHS, 0.02, 1), []);
  const frames: MF[] = [{ kind: 'intro', epoch: 0 }, { kind: 'in', epoch: 0 }, { kind: 'hid', epoch: 0 }, { kind: 'out', epoch: 0 }, { kind: 'back', epoch: 0 },
    ...TRAIN_FRAMES.map((e) => ({ kind: 'train' as const, epoch: e })), { kind: 'final', epoch: 1500 }];
  const p = useStepPlayer(frames.length, 1700);
  const f = frames[p.i];
  const snap = snaps[f.epoch / 10];
  const m = snap.m;
  const PI = 1; // the example point: a red (class 1) point
  const P = DATA[PI];
  const fwd0 = mlpForward(snaps[0].m, P.x, P.y);
  const loss0 = -Math.log(fwd0.p);
  const fwdStage = f.kind === 'in' || f.kind === 'hid' || f.kind === 'out' || f.kind === 'back';
  const xin: [number, number] = [P.x, P.y];
  const act = f.kind === 'in' ? { x: xin } : f.kind === 'hid' ? { x: xin, h: fwd0.h } : f.kind === 'out' || f.kind === 'back' ? { x: xin, h: fwd0.h, p: fwd0.p } : undefined;
  const curve = snaps.filter((q) => q.epoch <= f.epoch);
  const lMax = Math.max(...snaps.map((q) => q.loss)) * 1.1;
  const caption = (() => {
    switch (f.kind) {
      case 'intro': return <>Two interleaved half-moons: no straight line separates them. Our network has <b>2 inputs, 4 hidden neurons and 1 output</b> (17 weights and biases), all starting at small random values. Its first guess (shaded) is poor: <b>{(snap.acc * 100).toFixed(0)}% accuracy</b>, loss {snap.loss.toFixed(2)}.</>;
      case 'in': return <><b>Forward pass</b> for one red point (gold ring): its two coordinates x₁ = {f2(P.x)}, x₂ = {f2(P.y)} enter the input nodes. Edge thickness shows weight size; <b style={{ color: C.teal }}>teal</b> = positive, <b style={{ color: C.pink }}>pink</b> = negative.</>;
      case 'hid': return <>Each hidden neuron computes its own weighted sum plus bias, then squashes it with tanh into (−1, 1): h = ({fwd0.h.map((v) => f2(v)).join(', ')}). <b>Each hidden neuron is a little perceptron</b> asking "which side of my line is this point on, and how far?"</>;
      case 'out': return <>The output neuron combines the hidden values and applies a sigmoid: <b>p = {f2(fwd0.p, 3)}</b>, the network's probability that this point is red. It is red, so the log loss is −ln({f2(fwd0.p, 3)}) = <b>{loss0.toFixed(2)}</b>. {fwd0.p < 0.5 ? 'A confident wrong answer, heavily penalised.' : 'Right side, but not confident.'}</>;
      case 'back': return <><b>Backward pass</b> (gold edges): the error p − y = {f2(fwd0.p - 1, 3)} flows back. Each output weight is blamed in proportion to its hidden neuron's value; each first-layer weight gets the blame passed through its hidden neuron. Do this for all 100 points, average, and nudge all 17 numbers downhill. That is <b>one epoch</b>.</>;
      case 'train': return f.epoch <= 60
        ? <>Epoch <b>{f.epoch}</b>: loss {snap.loss.toFixed(2)}, accuracy {(snap.acc * 100).toFixed(0)}%. The dashed teal lines are the four hidden neurons' own lines; they rotate and shift as training proceeds, and the shaded boundary starts to <b>bend</b>.</>
        : <>Epoch <b>{f.epoch}</b>: loss <b>{snap.loss.toFixed(3)}</b>, accuracy <b>{(snap.acc * 100).toFixed(0)}%</b>. The loss curve on the right keeps falling as the boundary wraps around the moons. {f.epoch >= 800 ? 'Progress slows: the network is fine-tuning.' : ''}</>;
      default: return <>Finished: {(snap.acc * 100).toFixed(0)}% accuracy. Look at the dashed lines: <b>each hidden neuron only knows one straight line</b>, but the output blends their soft "which side?" answers, and the blend is a <b>curved boundary</b>. More hidden neurons = more lines to blend = more flexible shapes (and more risk of overfitting).</>;
    }
  })();
  return (
    <div>
      <Layout
        main={<>
          <Plot x={XR} y={YR} height={420} xLabel="feature 1" yLabel="feature 2">
            {(s) => <>
              <DecisionHeat s={s} nx={64} ny={44} c0={C.blue} c1={C.red} score={(x, y) => mlpForward(m, x, y).p} />
              {(f.kind === 'train' || f.kind === 'final') && <HiddenLines s={s} m={m} />}
              <Dots s={s} pts={DATA} color={(i) => CL[DATA[i].c]} r={4.5} animate={false} />
              {fwdStage && <circle cx={s.sx(P.x)} cy={s.sy(P.y)} r={11} fill="none" stroke={C.gold} strokeWidth={3} />}
            </>}
          </Plot>
        </>}
        side={<>
          <NetDiagram m={fwdStage ? snaps[0].m : m} act={act} glow={f.kind === 'in' || f.kind === 'hid' ? 'in' : f.kind === 'out' ? 'out' : f.kind === 'back' ? 'out' : undefined} back={f.kind === 'back'} />
          <div className="small muted">Training loss (log loss) by epoch</div>
          <Plot x={[0, 1500]} y={[0, lMax]} width={320} height={160} xLabel="epoch" xTicks={4} yTicks={4}>
            {(s) => <>
              <path d={curve.map((q, i) => `${i ? 'L' : 'M'}${s.sx(q.epoch)},${s.sy(q.loss)}`).join('')} fill="none" stroke={C.red} strokeWidth={2.2} />
              <circle cx={s.sx(f.epoch)} cy={s.sy(snap.loss)} r={4.5} fill={C.gold} />
            </>}
          </Plot>
          <Readout items={[['epoch', f.epoch], ['loss', snap.loss.toFixed(3), C.red], ['accuracy', `${(snap.acc * 100).toFixed(0)}%`, C.green]]} />
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caption}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
type DS = 'xor' | 'moons' | 'rings';
const GEN: Record<DS, () => LP[]> = { xor: () => xorPts(100, 0.45, 2), moons: () => moons(120, 0.2, 4), rings: () => rings(120, 0.2, 3) };
const PE = Array.from({ length: 81 }, (_, k) => k * 25);

function Playground() {
  const [ds, setDs] = useState<DS>('xor');
  const [hN, setHN] = useState(2);
  const [k, setK] = useState(80);
  const [lines, setLines] = useState(true);
  const pts = useMemo(() => GEN[ds](), [ds]);
  const snaps = useMemo(() => trainMLP(pts, hN, PE, 0.03, 1), [pts, hN]);
  const snap = snaps[Math.min(k, snaps.length - 1)];
  const lMax = Math.max(...snaps.map((q) => q.loss)) * 1.1;
  return (
    <Layout
      main={<Plot x={XR} y={YR} height={460} xLabel="feature 1" yLabel="feature 2">
        {(s) => <>
          <DecisionHeat s={s} nx={64} ny={44} c0={C.blue} c1={C.red} score={(x, y) => mlpForward(snap.m, x, y).p} />
          {lines && <HiddenLines s={s} m={snap.m} />}
          <Dots s={s} pts={pts} color={(i) => CL[pts[i].c]} r={4.5} animate={false} />
        </>}
      </Plot>}
      side={<>
        <Choice label="Data" value={ds} onChange={setDs} options={[{ value: 'xor', label: 'XOR' }, { value: 'moons', label: 'Moons' }, { value: 'rings', label: 'Rings' }]} />
        <Slider label="hidden neurons" min={1} max={8} value={hN} onChange={setHN} />
        <Slider label="training epoch" min={0} max={80} value={k} onChange={setK} format={(v) => String(v * 25)} />
        <Toggle label="show hidden neurons' lines" value={lines} onChange={setLines} />
        <Plot x={[0, 2000]} y={[0, lMax]} width={320} height={150} xLabel="epoch" xTicks={4} yTicks={3}>
          {(s) => <>
            <path d={snaps.map((q, i) => `${i ? 'L' : 'M'}${s.sx(q.epoch)},${s.sy(q.loss)}`).join('')} fill="none" stroke={C.red} strokeWidth={2} />
            <circle cx={s.sx(snap.epoch)} cy={s.sy(snap.loss)} r={4.5} fill={C.gold} />
          </>}
        </Plot>
        <Readout items={[['loss', snap.loss.toFixed(3), C.red], ['accuracy', `${(snap.acc * 100).toFixed(0)}%`, C.green], ['weights', 4 * hN + 1]]} />
        <Tex block>{'p=\\sigma\\Big(\\sum_j v_j \\tanh(w_j\\cdot x+b_j)+b_o\\Big)'}</Tex>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'A 2-4-1 neural network learns to separate two half-moons. We follow **one forward pass** through the diagram, see the error flow **backwards**, then watch training: the boundary bends and the loss falls.', steps: [
      { do: 'Step through frames 2 to 5.', notice: 'Values light up layer by layer (gold = positive, purple = negative); the output p gives the loss, then gold edges show the error flowing back.' },
      { do: 'Play the training frames.', notice: 'The shaded boundary curves around the moons while the red loss curve on the right drops.' },
      { do: 'On the last frame, look at the dashed teal lines.', notice: 'Each hidden neuron is just one straight line; blending them produces the curve.' },
    ] },
    Playground: { what: 'Train a small network on XOR, moons or rings. Choose how many hidden neurons it has and scrub through training.', steps: [
      { do: 'On **XOR**, set **hidden neurons = 1**, then 2.', notice: 'One neuron is a single line (a perceptron) and gets stuck around 50–75%. Two neurons give two lines and solve XOR.' },
      { do: 'Switch to **Rings** and try 2, then 3 or more neurons.', notice: 'Enclosing a circle needs at least three lines; with too few the loss stalls high.' },
      { do: 'Drag **training epoch** from 0 to the end.', notice: 'The hidden lines move into position and the boundary sharpens as the loss curve flattens.' },
    ] },
  },
};
export default anim;
