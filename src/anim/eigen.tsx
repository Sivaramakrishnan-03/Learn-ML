// Eigenvectors: the directions a matrix only stretches. Test arrows, a ring of arrows morphing, the circle → ellipse, power iteration.
import { ReactNode, useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Arrow, Seg, Label, FnLine, Dots, MatrixView, Caption, Readout, Slider, Choice, Toggle, Layout, Legend, useStepPlayer, PlayerControls, C, Scales } from '../viz/kit';
import { M2, V2, mv, norm, blendI, eig2, equalH, polyPath, f2 } from './_math-helpers';

/* ---------- pure helpers ---------- */
const A: M2 = [[2, 1], [1, 2]];
const deg = (r: number) => (r * 180) / Math.PI;
/** Signed angle (degrees) that A turns v by. */
const turn = (M: M2, v: V2) => { const w = mv(M, v); return deg(Math.atan2(v[0] * w[1] - v[1] * w[0], v[0] * w[0] + v[1] * w[1])); };
/** How far a direction is from staying on its own line (0 = eigen-direction). Handles flips (180°). */
const offLine = (M: M2, v: V2) => { const t = Math.abs(turn(M, v)); return Math.min(t, 180 - t); };
const RING: V2[] = Array.from({ length: 16 }, (_, i) => { const t = (i * Math.PI) / 8; return [Math.cos(t), Math.sin(t)]; });
const circle = (n = 72): V2[] => Array.from({ length: n + 1 }, (_, i) => [Math.cos((2 * Math.PI * i) / n), Math.sin((2 * Math.PI * i) / n)]);
const lineThrough = (s: Scales, v: V2, color: string, dash = '5 4', L = 6) => <Seg s={s} x1={-L * v[0]} y1={-L * v[1]} x2={L * v[0]} y2={L * v[1]} color={color} dash={dash} width={1.2} />;
const isEigen = (M: M2, v: V2) => offLine(M, v) < 0.5;

/* ---------- Animate ---------- */
type Frame = { draw: (s: Scales) => ReactNode; cap: ReactNode; read: [string, ReactNode, string?][] };
const D1: V2 = [Math.SQRT1_2, Math.SQRT1_2], D2: V2 = [Math.SQRT1_2, -Math.SQRT1_2];

function buildFrames(): Frame[] {
  const test = (v: V2, name: string, eig: boolean) => (s: Scales) => {
    const w = mv(A, v), u: V2 = [v[0] / norm(v), v[1] / norm(v)];
    return <>{lineThrough(s, u, eig ? C.green : C.grey)}<Arrow s={s} x1={0} y1={0} x2={w[0]} y2={w[1]} color={eig ? C.green : C.red} label={`A${name} = [${w[0]}, ${w[1]}]`} /><Arrow s={s} x1={0} y1={0} x2={v[0]} y2={v[1]} color={C.blue} /><Label s={s} x={v[0] + (v[1] < 0 ? 0.15 : -0.2)} y={v[1] + (v[1] < 0 ? -0.35 : 0.25)} color={C.blue} anchor={v[1] < 0 ? 'start' : 'end'}>{name}</Label></>;
  };
  const ring = (t: number) => (s: Scales) => {
    const M = blendI(A, t);
    return <>
      <path d={polyPath(s, circle())} fill="none" stroke={C.grey} strokeDasharray="3 4" />
      {t === 1 && <path d={polyPath(s, circle().map((v) => mv(A, v)))} fill={C.yellow} fillOpacity={0.06} stroke={C.yellow} strokeWidth={1.5} />}
      {lineThrough(s, D1, C.green)}{lineThrough(s, D2, C.green)}
      {RING.map((v, i) => { const w = mv(M, v), e = isEigen(A, v); return <Arrow key={i} s={s} x1={0} y1={0} x2={w[0]} y2={w[1]} color={e ? C.green : C.blue} width={e ? 3 : 1.8} />; })}
    </>;
  };
  const power: V2[] = [[1, 0]];
  for (let k = 0; k < 4; k++) { const w = mv(A, power[k]); const n = norm(w); power.push([w[0] / n, w[1] / n]); }
  const powFrame = (k: number) => (s: Scales) => <>
    {lineThrough(s, D1, C.green)}
    {power.slice(0, k + 1).map((v, i) => <Arrow key={i} s={s} x1={0} y1={0} x2={2.5 * v[0]} y2={2.5 * v[1]} color={i === k ? C.gold : C.grey} width={i === k ? 3 : 1.5} label={i === k ? `after ${k} × A` : undefined} />)}
  </>;
  const angle = (v: V2) => deg(Math.atan2(v[1], v[0]));
  return [
    { draw: (s) => <>{lineThrough(s, [1, 0], C.grey)}<Arrow s={s} x1={0} y1={0} x2={1} y2={0} color={C.blue} label="[1, 0]" /></>,
      cap: <>Take the matrix <b>A = [[2, 1], [1, 2]]</b> and feed it arrows. The dashed line is the arrow's own direction. Question: after multiplying by A, <b>does the arrow stay on its line?</b></>,
      read: [['testing', '[1, 0]', C.blue]] },
    { draw: test([1, 0], '[1, 0]', false),
      cap: <>A [1, 0] = [2 × 1 + 1 × 0, 1 × 1 + 2 × 0] = <b>[2, 1]</b>. The arrow pointed east; now it points north-east. It was <b>turned off its line</b> by {turn(A, [1, 0]).toFixed(0)}°, so [1, 0] is <b>not</b> an eigenvector.</>,
      read: [['A [1, 0]', '[2, 1]', C.red], ['turned by', `${turn(A, [1, 0]).toFixed(1)}°`, C.red]] },
    { draw: test([1, 1], '[1, 1]', true),
      cap: <>A [1, 1] = [2 + 1, 1 + 2] = <b>[3, 3] = 3 × [1, 1]</b>. Same line, just three times longer. [1, 1] is an <b>eigenvector</b> with <b>eigenvalue λ = 3</b>.</>,
      read: [['A [1, 1]', '[3, 3]', C.green], ['turned by', '0°', C.green], ['stretch λ', '3', C.green]] },
    { draw: test([1, -1], '[1, −1]', true),
      cap: <>A [1, −1] = [2 − 1, 1 − 2] = <b>[1, −1]</b>. Unchanged! Another eigenvector, this time with <b>λ = 1</b> (stretch factor one).</>,
      read: [['A [1, −1]', '[1, −1]', C.green], ['turned by', '0°', C.green], ['stretch λ', '1', C.green]] },
    { draw: ring(0),
      cap: <>Now 16 arrows of length 1, pointing every way around the circle. The green ones lie on the two directions we just found. Watch what A does to <b>all of them at once</b>.</>,
      read: [['progress', '0%']] },
    ...[0.25, 0.5, 0.75].map((t): Frame => ({ draw: ring(t),
      cap: <>Applying A gradually ({t * 100}% of the way). The blue arrows <b>swing</b> towards the diagonal as they grow. Only the green arrows slide straight out along their own dashed line.</>,
      read: [['progress', `${t * 100}%`]] })),
    { draw: ring(1),
      cap: <>Finished. The dashed circle became the yellow <b>ellipse</b>. Its long axis lies exactly on the eigenvector [1, 1] (stretched ×3) and its short axis on [1, −1] (stretched ×1). <b>Eigenvectors are the skeleton of the transformation.</b></>,
      read: [['λ₁ (long axis)', '3', C.green], ['λ₂ (short axis)', '1', C.green]] },
    ...[0, 1, 2, 3, 4].map((k): Frame => ({ draw: powFrame(k),
      cap: k === 0 ? <>What happens if we apply A <b>again and again</b>? Start with [1, 0] (gold, drawn at a fixed length so only the direction matters).</>
        : k < 4 ? <>After {k} multiplication{k > 1 ? 's' : ''} by A the arrow points at <b>{angle(power[k]).toFixed(1)}°</b>. Each pass stretches the [1, 1] part 3× but the [1, −1] part only 1×, so the diagonal part takes over.</>
          : <>After 4 passes: <b>{angle(power[4]).toFixed(1)}°</b>, nearly 45°. Repeated multiplication always swings towards the eigenvector with the <b>largest eigenvalue</b>. This "power iteration" is how PageRank and long-run market shares are found.</>,
      read: [['multiplications', k], ['direction', `${angle(power[k]).toFixed(1)}°`, C.gold], ['target', '45°', C.green]] })),
    { draw: (s) => <>{lineThrough(s, D1, C.green)}{lineThrough(s, D2, C.green)}<Arrow s={s} x1={0} y1={0} x2={3 * D1[0]} y2={3 * D1[1]} color={C.green} label="λ = 3" /><Arrow s={s} x1={0} y1={0} x2={D2[0]} y2={D2[1]} color={C.green} label="λ = 1" /></>,
      cap: <><b>A v = λ v</b>: an eigenvector v is only stretched (by λ), never turned. Checks: the eigenvalues add up to the trace (2 + 2 = 4 = 3 + 1) and multiply to the determinant (4 − 1 = 3 = 3 × 1). In PCA the matrix is a covariance matrix, and the biggest-λ direction is the direction of most variance.</>,
      read: [['λ₁ + λ₂', '4 = trace', C.green], ['λ₁ × λ₂', '3 = det', C.green]] },
  ];
}

function Animate() {
  const frames = useMemo(buildFrames, []);
  const p = useStepPlayer(frames.length, 2000);
  const f = frames[p.i];
  const R: [number, number] = [-3.5, 3.5];
  return (
    <div>
      <Layout
        main={<Plot x={R} y={R} width={600} height={equalH(R, R, 600)} xLabel="first coordinate" yLabel="second coordinate">{f.draw}</Plot>}
        side={<>
          <MatrixView title="A" data={A} />
          <Readout items={f.read} />
          <Legend items={[['arrow before', C.blue], ['turned off its line', C.red], ['eigen-direction', C.green], ['repeated multiplication', C.gold]]} />
          <p className="small muted" style={{ margin: 0 }}>"Eigen" is German for "own": an eigenvector keeps its own direction.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{f.cap}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
const PRESETS: Record<string, { label: string; A: M2; note: string }> = {
  sym: { label: 'Stretch [[2,1],[1,2]]', A: [[2, 1], [1, 2]], note: 'Symmetric matrices always have perpendicular eigenvectors.' },
  cov: { label: 'Covariance (r = 0.8)', A: [[1, 0.8], [0.8, 1]], note: 'PCA: the λ = 1.8 direction carries 90% of the variance.' },
  markov: { label: 'Brand switching', A: [[0.9, 0.2], [0.1, 0.8]], note: 'Eigenvector with λ = 1 is the long-run market share (2/3, 1/3).' },
  shear: { label: 'Shear', A: [[1, 1], [0, 1]], note: 'Only one eigen-direction: the horizontal axis.' },
  rotate: { label: 'Rotate 90°', A: [[0, -1], [1, 0]], note: 'Every arrow turns 90°: no real eigenvectors at all.' },
};

function Playground() {
  const [key, setKey] = useState('sym');
  const [theta, setTheta] = useState(20);
  const [ring, setRing] = useState(false);
  const [showEig, setShowEig] = useState(false);
  const M = PRESETS[key].A;
  const v: V2 = [Math.cos((theta * Math.PI) / 180), Math.sin((theta * Math.PI) / 180)];
  const w = mv(M, v), tv = turn(M, v), off = offLine(M, v), eigs = eig2(M);
  const hit = off < 1.5;
  const R: [number, number] = [-3.2, 3.2];
  return (
    <Layout
      main={<>
        <Plot x={R} y={R} width={600} height={equalH(R, R, 600)} xLabel="first coordinate" yLabel="second coordinate">
          {(s) => <>
            {showEig && eigs.map((e, i) => <g key={i}>{lineThrough(s, e.v, C.green, '6 3')}</g>)}
            {ring && RING.map((u, i) => { const z = mv(M, u); return <Arrow key={i} s={s} x1={0} y1={0} x2={z[0]} y2={z[1]} color={C.grey} width={1.2} />; })}
            {lineThrough(s, v, hit ? C.green : C.grey)}
            <Arrow s={s} x1={0} y1={0} x2={w[0]} y2={w[1]} color={hit ? C.green : C.red} label="A v" />
            <Arrow s={s} x1={0} y1={0} x2={v[0]} y2={v[1]} color={C.blue} label="v" />
          </>}
        </Plot>
        <Plot x={[0, 180]} y={[-100, 100]} height={190} xTicks={9} yTicks={4} xLabel="direction of v (degrees)" yLabel="turned by (°)">
          {(s) => <>
            <Seg s={s} x1={0} y1={0} x2={180} y2={0} color={C.green} width={1} />
            <FnLine s={s} f={(t) => { const u: V2 = [Math.cos((t * Math.PI) / 180), Math.sin((t * Math.PI) / 180)]; return Math.max(-99, Math.min(99, turn(M, u))); }} color={C.red} n={180} />
            <Dots s={s} pts={[{ x: theta, y: Math.max(-99, Math.min(99, tv)) }]} color={hit ? C.green : C.gold} r={6} animate={false} />
            <Label s={s} x={4} y={-85} color={C.muted} size={11}>eigen-directions are where this curve crosses 0</Label>
          </>}
        </Plot>
      </>}
      side={<>
        <Choice label="Matrix" value={key} onChange={setKey} options={Object.entries(PRESETS).map(([k, o]) => ({ value: k, label: o.label }))} />
        <MatrixView title="A" data={M} />
        <Slider label="direction of v" min={0} max={180} value={theta} onChange={setTheta} format={(t) => `${t}°`} />
        <Toggle label="show the whole ring of arrows" value={ring} onChange={setRing} />
        <Toggle label="reveal the eigen-directions" value={showEig} onChange={setShowEig} />
        <Readout items={[
          ['A v turned by', `${tv.toFixed(1)}°`, hit ? C.green : C.red],
          ['length ×', f2(norm(w)), C.yellow],
          ['eigenvector?', hit ? `yes, λ ≈ ${f2(norm(w) * Math.sign(v[0] * w[0] + v[1] * w[1]))}` : 'no', hit ? C.green : C.muted],
          ['eigenvalues', eigs.length ? [...new Set(eigs.map((e) => f2(e.lam)))].join(', ') : 'none (complex)', C.green],
        ]} />
        <p className="small muted" style={{ margin: 0 }}>{PRESETS[key].note}</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'We multiply arrows by the matrix **A = [[2, 1], [1, 2]]** and watch which ones stay on their own line. Those are the **eigenvectors**; how much they stretch is the **eigenvalue**.', steps: [
      { do: 'Step through the first four frames.', notice: '[1, 0] gets turned (red), but [1, 1] is only stretched ×3 and [1, −1] is left alone (green): two eigenvectors.' },
      { do: 'Keep stepping while the ring of 16 arrows transforms.', notice: 'Blue arrows swing towards the diagonal; green ones slide straight out. The circle becomes an ellipse whose axes are the eigenvectors.' },
      { do: 'Watch the gold arrow in the "again and again" frames.', notice: 'Repeated multiplication pulls any arrow towards the eigenvector with the **largest** eigenvalue (45°).' },
    ] },
    Playground: { what: 'Pick a matrix, then rotate the test arrow v with the slider. The lower chart shows how much A turns v for every direction.', steps: [
      { do: 'Drag **direction of v** until the turn readout is 0°.', notice: 'v and A v line up and turn green: you found an eigenvector. The lower curve crosses zero exactly there.' },
      { do: 'Switch to **Shear**, then **Rotate 90°**.', notice: 'The shear has only one zero crossing (one eigen-direction). The rotation curve never touches zero: **no real eigenvectors**.' },
      { do: 'Choose **Brand switching** and find its eigenvector.', notice: 'It points at about 26.6° (shares 2 : 1) with λ = 1: the long-run market share that does not change month to month.' },
    ] },
  },
};
export default anim;
