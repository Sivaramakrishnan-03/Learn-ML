// Vectors: a list of numbers = a point = an arrow. Addition (tip-to-tail), scaling, difference and distance, angle.
import { ReactNode, useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Arrow, Dots, Seg, Label, Caption, Readout, Slider, Choice, Toggle, Layout, Legend, useStepPlayer, PlayerControls, C, Scales } from '../viz/kit';
import { V2, norm, equalH, f2 } from './_math-helpers';

/* ---------- pure helpers ---------- */
const add = (a: V2, b: V2): V2 => [a[0] + b[0], a[1] + b[1]];
const sub = (a: V2, b: V2): V2 => [a[0] - b[0], a[1] - b[1]];
const scl = (c: number, a: V2): V2 => [c * a[0], c * a[1]];
const dot = (a: V2, b: V2) => a[0] * b[0] + a[1] * b[1];
const cosSim = (a: V2, b: V2) => (norm(a) && norm(b) ? dot(a, b) / (norm(a) * norm(b)) : 0);
const vs = (v: V2) => `[${f2(v[0], Number.isInteger(v[0]) ? 0 : 1)}, ${f2(v[1], Number.isInteger(v[1]) ? 0 : 1)}]`;

/** Small arc showing the angle between two directions, radius r (data units). */
function AngleArc({ s, a, b, r = 1.2, color = C.gold }: { s: Scales; a: V2; b: V2; r?: number; color?: string }) {
  const t1 = Math.atan2(a[1], a[0]), t2 = Math.atan2(b[1], b[0]);
  const n = 24, pts = Array.from({ length: n + 1 }, (_, i) => { const t = t1 + ((t2 - t1) * i) / n; return `${i ? 'L' : 'M'}${s.sx(r * Math.cos(t))},${s.sy(r * Math.sin(t))}`; });
  return <path d={pts.join('')} fill="none" stroke={color} strokeWidth={2} />;
}

/* ---------- Animate ---------- */
const A: V2 = [4, 3], B: V2 = [7, 7], Cc: V2 = [5, 3], D: V2 = [1, 2];
const XR: [number, number] = [-4, 9], YR: [number, number] = [-4.5, 8.5];
type Frame = { draw: (s: Scales) => ReactNode; cap: ReactNode; read: [string, ReactNode, string?][] };

function buildFrames(): Frame[] {
  const o = (s: Scales) => <Dots s={s} pts={[{ x: 0, y: 0 }]} color={C.muted} r={3} animate={false} />;
  const aArrow = (s: Scales, label = 'A') => <Arrow s={s} x1={0} y1={0} x2={A[0]} y2={A[1]} color={C.blue} label={label} />;
  const pts3 = (s: Scales) => <>
    <Dots s={s} pts={[{ x: B[0], y: B[1] }, { x: Cc[0], y: Cc[1] }]} color={C.purple} r={6} animate={false} />
    <Label s={s} x={B[0] + 0.25} y={B[1] + 0.25} color={C.purple}>B [7, 7]</Label>
    <Label s={s} x={Cc[0] + 0.25} y={Cc[1] - 0.6} color={C.purple}>C [5, 3]</Label>
  </>;
  const AmB = sub(A, B), AmC = sub(A, Cc), Apd = add(A, D);
  return [
    { draw: (s) => <>{o(s)}<Dots s={s} pts={[{ x: A[0], y: A[1] }]} r={7} animate={false} /><Label s={s} x={A[0] + 0.3} y={A[1] - 0.2} color={C.blue}>A = [4, 3]</Label></>,
      cap: <>Customer A visits the shop <b>4 times a month</b> and spends <b>₹3 thousand</b> per basket. Written as the ordered list <b>[4, 3]</b>, that is a <b>vector</b>, and it is also a point on a map: 4 across, 3 up.</>,
      read: [['A', '[4, 3]', C.blue]] },
    { draw: (s) => <>{o(s)}{aArrow(s)}</>,
      cap: <>The same vector drawn as an <b>arrow</b> from the origin [0, 0] to the point. Point or arrow: same two numbers, two pictures. The arrow view lets us talk about <b>direction</b> and <b>length</b>.</>,
      read: [['A', '[4, 3]', C.blue]] },
    { draw: (s) => <>{o(s)}<Seg s={s} x1={0} y1={0} x2={4} y2={0} color={C.gold} dash="5 4" /><Seg s={s} x1={4} y1={0} x2={4} y2={3} color={C.gold} dash="5 4" />
      <Label s={s} x={2} y={-0.6} color={C.gold} anchor="middle">4</Label><Label s={s} x={4.25} y={1.4} color={C.gold}>3</Label>{aArrow(s, 'length 5')}</>,
      cap: <>Its <b>length</b> (norm) comes from Pythagoras: the arrow is the long side of a right triangle with sides 4 and 3, so ‖A‖ = √(4² + 3²) = √25 = <b>5</b>.</>,
      read: [['A', '[4, 3]', C.blue], ['‖A‖', '5', C.gold]] },
    { draw: (s) => <>{o(s)}<Arrow s={s} x1={0} y1={0} x2={8} y2={6} color={C.yellow} label="2A = [8, 6]" />{aArrow(s)}</>,
      cap: <><b>Scalar multiplication</b>: 2 × [4, 3] = [8, 6]. Every entry doubles, so the arrow keeps its direction and becomes twice as long (length 10). A customer who does "twice as much of everything".</>,
      read: [['A', '[4, 3]', C.blue], ['2A', '[8, 6]', C.yellow], ['‖2A‖', '10']] },
    { draw: (s) => <>{o(s)}{aArrow(s)}<Arrow s={s} x1={A[0]} y1={A[1]} x2={Apd[0]} y2={Apd[1]} color={C.teal} label="d = [1, 2]" /></>,
      cap: <><b>Addition, tip to tail.</b> Next month A changes by d = [1, 2] (one more visit, ₹2k more per basket). Put d's tail at A's tip.</>,
      read: [['A', '[4, 3]', C.blue], ['d', '[1, 2]', C.teal]] },
    { draw: (s) => <>{o(s)}<Arrow s={s} x1={0} y1={0} x2={D[0]} y2={D[1]} color={C.teal} /><Seg s={s} x1={D[0]} y1={D[1]} x2={Apd[0]} y2={Apd[1]} color={C.grey} dash="4 4" />{aArrow(s)}
      <Arrow s={s} x1={A[0]} y1={A[1]} x2={Apd[0]} y2={Apd[1]} color={C.teal} /><Arrow s={s} x1={0} y1={0} x2={Apd[0]} y2={Apd[1]} color={C.yellow} label="A + d = [5, 5]" /></>,
      cap: <>The yellow arrow from the origin to where we ended up is <b>A + d = [4 + 1, 3 + 2] = [5, 5]</b>. Add entry by entry. Doing d first and A second lands in the same place: the two routes form a parallelogram.</>,
      read: [['A', '[4, 3]', C.blue], ['d', '[1, 2]', C.teal], ['A + d', '[5, 5]', C.yellow]] },
    { draw: (s) => <>{o(s)}{aArrow(s)}{pts3(s)}</>,
      cap: <>Two more customers: <b>B = [7, 7]</b> and <b>C = [5, 3]</b>. Question from the chapter: which of them is <b>more like A</b>? On a map, "alike" means "close".</>,
      read: [['A', '[4, 3]', C.blue], ['B', '[7, 7]', C.purple], ['C', '[5, 3]', C.purple]] },
    { draw: (s) => <>{o(s)}{pts3(s)}<Dots s={s} pts={[{ x: A[0], y: A[1] }]} r={7} animate={false} /><Label s={s} x={A[0] - 0.4} y={A[1] - 0.6} color={C.blue} anchor="end">A</Label>
      <Arrow s={s} x1={B[0]} y1={B[1]} x2={A[0]} y2={A[1]} color={C.red} /><Arrow s={s} x1={0} y1={0} x2={AmB[0]} y2={AmB[1]} color={C.red} />
      <Label s={s} x={-1.2} y={-3.4} color={C.red}>A − B = [−3, −4]</Label></>,
      cap: <><b>Difference</b>: A − B = [4 − 7, 3 − 7] = <b>[−3, −4]</b>. It is the arrow that walks from B to A (red, top). Slide it to the origin (red, bottom-left) and it is an ordinary vector of length √(9 + 16) = <b>5</b>. That length is the <b>distance</b> between A and B.</>,
      read: [['A − B', '[−3, −4]', C.red], ['distance A↔B', '5', C.red]] },
    { draw: (s) => <>{o(s)}{pts3(s)}<Dots s={s} pts={[{ x: A[0], y: A[1] }]} r={7} animate={false} /><Label s={s} x={A[0] - 0.4} y={A[1] - 0.6} color={C.blue} anchor="end">A</Label>
      <Seg s={s} x1={B[0]} y1={B[1]} x2={A[0]} y2={A[1]} color={C.red} dash="4 4" width={1.5} />
      <Arrow s={s} x1={Cc[0]} y1={Cc[1]} x2={A[0]} y2={A[1]} color={C.green} /><Arrow s={s} x1={0} y1={0} x2={AmC[0]} y2={AmC[1]} color={C.green} label="A − C = [−1, 0]" /></>,
      cap: <>A − C = [4 − 5, 3 − 3] = <b>[−1, 0]</b>, length √(1 + 0) = <b>1</b>. C is only 1 unit from A, while B is 5 units away.</>,
      read: [['distance A↔B', '5', C.red], ['distance A↔C', '1', C.green]] },
    { draw: (s) => <>{o(s)}
      <circle cx={s.sx(A[0])} cy={s.sy(A[1])} r={s.sx(5) - s.sx(0)} fill="none" stroke={C.red} strokeDasharray="5 4" />
      <circle cx={s.sx(A[0])} cy={s.sy(A[1])} r={s.sx(1) - s.sx(0)} fill={C.green} fillOpacity={0.15} stroke={C.green} />
      {pts3(s)}<Dots s={s} pts={[{ x: A[0], y: A[1] }]} r={7} animate={false} /><Label s={s} x={A[0] - 0.4} y={A[1] - 0.6} color={C.blue} anchor="end">A</Label></>,
      cap: <>Circles of radius 1 and 5 around A. <b>C is A's nearest neighbour</b>, five times closer than B. A recommender would suggest to A what C bought. That is k-nearest neighbours in one picture: <b>distance = length of the difference vector</b>.</>,
      read: [['distance A↔B', '5', C.red], ['distance A↔C', '1', C.green], ['nearest to A', 'C', C.green]] },
    { draw: (s) => <>{o(s)}<AngleArc s={s} a={A} b={B} r={2.2} /><Arrow s={s} x1={0} y1={0} x2={B[0]} y2={B[1]} color={C.purple} label="B" /><Arrow s={s} x1={0} y1={0} x2={Cc[0]} y2={Cc[1]} color={C.purple} label="C" />{aArrow(s)}</>,
      cap: <>A different question: do they shop in the same <b>pattern</b>? Compare <b>directions</b>, not positions. A · B = 4×7 + 3×7 = 49, and cos θ = 49 / (5 × 9.90) = <b>0.99</b>: A and B point almost the same way (B is a "bigger A"). Cosine ignores size completely: B buys more of everything, but in almost the same <b>proportions</b> as A.</>,
      read: [['A · B', '49'], ['‖A‖ ‖B‖', '5 × 9.90'], ['cos(A, B)', '0.99', C.gold], ['angle', '8°', C.gold]] },
    { draw: (s) => <>{o(s)}{pts3(s)}<Seg s={s} x1={B[0]} y1={B[1]} x2={A[0]} y2={A[1]} color={C.red} dash="4 4" width={1.5} /><Arrow s={s} x1={0} y1={0} x2={B[0]} y2={B[1]} color={C.purple} /><Arrow s={s} x1={Cc[0]} y1={Cc[1]} x2={A[0]} y2={A[1]} color={C.green} />{aArrow(s)}</>,
      cap: <><b>Two notions of "similar".</b> By <b>distance</b>, B is far from A (5 units, a much bigger spender). By <b>direction</b>, B is nearly a copy of A (cos 0.99, angle 8°). Distance cares about size; cosine only about proportions. Choosing between them is a modelling decision you will meet again in k-NN, clustering and text search.</>,
      read: [['distance A↔B', '5', C.red], ['cos(A, B)', '0.99', C.gold], ['distance A↔C', '1', C.green]] },
  ];
}

function Animate() {
  const frames = useMemo(buildFrames, []);
  const p = useStepPlayer(frames.length, 2200);
  const f = frames[p.i];
  return (
    <div>
      <Layout
        main={<Plot x={XR} y={YR} width={600} height={equalH(XR, YR, 600)} xLabel="visits per month" yLabel="average basket (₹ thousand)">{f.draw}</Plot>}
        side={<>
          <Readout items={f.read} />
          <Legend items={[['customer A', C.blue], ['other customers', C.purple], ['result of an operation', C.yellow], ['difference / distance', C.red]]} />
          <p className="small muted" style={{ margin: 0 }}>Every operation works <b>entry by entry</b>, so the same rules hold for vectors with 3 or 300 entries; we just can't draw them.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{f.cap}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
const PR: [number, number] = [-6, 6];
function Playground() {
  const [u, setU] = useState<V2>([3, 1]);
  const [v, setV] = useState<V2>([1, 3]);
  const [which, setWhich] = useState<'u' | 'v'>('u');
  const [c, setC] = useState(1);
  const [showSum, setShowSum] = useState(true);
  const [showDiff, setShowDiff] = useState(false);
  const cu = scl(c, u), sum = add(cu, v), diff = sub(cu, v);
  const cos = cosSim(cu, v);
  const ang = (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
  const click = (pt: { x: number; y: number }) => {
    const q: V2 = [Math.round(pt.x * 2) / 2, Math.round(pt.y * 2) / 2];
    if (which === 'u') setU(q); else setV(q);
  };
  return (
    <Layout
      main={<Plot x={PR} y={PR} width={600} height={equalH(PR, PR, 600)} xLabel="first entry" yLabel="second entry" onClick={click}>
        {(s) => <>
          {norm(cu) > 0 && norm(v) > 0 && <AngleArc s={s} a={cu} b={v} r={1} />}
          {showSum && <><Seg s={s} x1={cu[0]} y1={cu[1]} x2={sum[0]} y2={sum[1]} color={C.grey} dash="4 4" /><Seg s={s} x1={v[0]} y1={v[1]} x2={sum[0]} y2={sum[1]} color={C.grey} dash="4 4" />
            <Arrow s={s} x1={0} y1={0} x2={sum[0]} y2={sum[1]} color={C.yellow} label={`${c === 1 ? 'u' : c + 'u'} + v`} /></>}
          {showDiff && <Arrow s={s} x1={v[0]} y1={v[1]} x2={cu[0]} y2={cu[1]} color={C.red} label="difference" />}
          {c !== 1 && <Seg s={s} x1={0} y1={0} x2={u[0]} y2={u[1]} color={C.blue} dash="3 3" width={1} />}
          <Arrow s={s} x1={0} y1={0} x2={cu[0]} y2={cu[1]} color={C.blue} label={c === 1 ? 'u' : `${c}u`} />
          <Arrow s={s} x1={0} y1={0} x2={v[0]} y2={v[1]} color={C.purple} label="v" />
        </>}
      </Plot>}
      side={<>
        <Choice label="Click on the plot to move" value={which} onChange={setWhich} options={[{ value: 'u', label: 'u (blue)' }, { value: 'v', label: 'v (purple)' }]} />
        <Slider label="scale u by c" min={-2} max={2} step={0.25} value={c} onChange={setC} />
        <Toggle label="show sum (yellow)" value={showSum} onChange={setShowSum} />
        <Toggle label="show difference / distance (red)" value={showDiff} onChange={setShowDiff} />
        <Readout items={[
          [c === 1 ? 'u' : 'c·u', vs(cu), C.blue], ['v', vs(v), C.purple],
          ['sum', vs(sum), C.yellow], ['distance', f2(norm(diff)), C.red],
          ['dot product', f2(dot(cu, v)), C.gold], ['cos θ', f2(cos), C.gold], ['angle θ', `${ang.toFixed(0)}°`, C.gold],
        ]} />
        <p className="small muted" style={{ margin: 0 }}>Make u and v perpendicular: the dot product becomes 0. Set c negative: u flips and the cosine changes sign. Scaling u never changes the angle unless c crosses 0, but it does change the distance.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Three customers described by **(visits per month, basket size)** become vectors. We draw them as points and arrows, then add, scale and subtract them to answer "who is most like customer A?".', steps: [
      { do: 'Press **▶ Step** through the first six frames.', notice: 'A vector is both a point and an arrow. Its length comes from Pythagoras (5), scaling stretches it, and addition is "tip to tail".' },
      { do: 'Keep stepping to the red and green difference arrows.', notice: 'The **distance** between two customers is the length of their difference vector: B is 5 away from A, C only 1.' },
      { do: 'Watch the last two frames.', notice: 'By **distance** B is far from A, yet by **direction** (cosine 0.99) B shops in almost the same proportions. Size versus pattern: two different meanings of "similar".' },
    ] },
    Playground: { what: 'Two vectors u and v you can place by clicking. See their sum, difference, dot product and angle update live.', steps: [
      { do: 'Choose **u**, then click around the plot to move its tip.', notice: 'The yellow sum always closes the parallelogram; the readouts update entry by entry.' },
      { do: 'Place v so it is at a right angle to u.', notice: 'The **dot product drops to 0** and cos θ = 0: perpendicular vectors share nothing.' },
      { do: 'Turn on the difference and drag **scale u by c** from 1 to 2, then to −1.', notice: 'Scaling changes the **distance** but not the **angle**, until c turns negative and u flips to point the other way.' },
    ] },
  },
};
export default anim;
