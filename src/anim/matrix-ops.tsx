// Matrix operations: matrix–vector multiplication row by row (loan scoring), then a 2×2 matrix as a transformation of the plane.
import { ReactNode, useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Bars, Arrow, Dots, Seg, Label, MatrixView, Caption, Readout, Slider, Choice, Layout, Legend, useStepPlayer, PlayerControls, C, Scales } from '../viz/kit';
import { M2, V2, mv, det } from '../viz/math';
import { blendI, equalH, polyPath, f2 } from './_math-helpers';

/* ---------- pure helpers ---------- */
const X = [[10, 700], [4, 600], [20, 800]];
const W = [0.5, 0.01];
const SCORES = X.map((r) => r[0] * W[0] + r[1] * W[1]); // [12, 8, 18]
const M: M2 = [[2, -1], [1, 1]];
const P: V2 = [1, 2];
const GRID = Array.from({ length: 25 }, (_, i) => [(i % 5) - 2, Math.floor(i / 5) - 2] as V2);
const lines = (e: number) => Array.from({ length: 2 * e + 1 }, (_, i) => i - e).flatMap((k) => [[[k, -e], [k, e]], [[-e, k], [e, k]]] as [V2, V2][]);
const LINES2 = lines(2), LINES4 = lines(4);
const SQUARE: V2[] = [[0, 0], [1, 0], [1, 1], [0, 1]];
const F_SHAPE: V2[] = [[0.3, 0.2], [0.3, 1.6], [1.1, 1.6], [0.3, 1.6], [0.3, 0.9], [0.9, 0.9]]; // a letter "F" shows flips and shears

/** The transformed plane: grid lines, grid points, unit square, basis vectors. */
function Plane({ s, A, showSquare = false, showBasis = true, showF = false, dots = true, wide = false }: { s: Scales; A: M2; showSquare?: boolean; showBasis?: boolean; showF?: boolean; dots?: boolean; wide?: boolean }) {
  const d = det(A);
  return <>
    {(wide ? LINES4 : LINES2).map(([a, b], i) => { const p = mv(A, a), q = mv(A, b); return <Seg key={i} s={s} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} color={a[0] === 0 && b[0] === 0 || a[1] === 0 && b[1] === 0 ? C.muted : C.grey} width={1} />; })}
    {showSquare && <path d={polyPath(s, SQUARE.map((v) => mv(A, v)), true)} fill={d >= 0 ? C.green : C.red} fillOpacity={0.25} stroke={d >= 0 ? C.green : C.red} />}
    {showF && <path d={polyPath(s, F_SHAPE.map((v) => mv(A, v)))} fill="none" stroke={C.pink} strokeWidth={3} />}
    {dots && <Dots s={s} pts={GRID.map((v) => { const q = mv(A, v); return { x: q[0], y: q[1] }; })} r={4} color={C.blue} />}
    {showBasis && <><Arrow s={s} x1={0} y1={0} x2={A[0][0]} y2={A[1][0]} color={C.green} label="î" /><Arrow s={s} x1={0} y1={0} x2={A[0][1]} y2={A[1][1]} color={C.red} label="ĵ" /></>}
  </>;
}

/* ---------- Animate ---------- */
type Frame = { phase: 'table' | 'plane'; filled: number; hl?: (r: number, c: number) => boolean; mHl?: (r: number, c: number) => boolean; t: number; point?: 'start' | 'x' | 'xy'; basis?: 'i' | 'j' | 'both'; square?: boolean; cap: ReactNode; read: [string, ReactNode, string?][] };

function buildFrames(): Frame[] {
  const tf = (filled: number, hl: Frame['hl'], cap: ReactNode, read: Frame['read']): Frame => ({ phase: 'table', filled, hl, t: 0, cap, read });
  const pf = (o: Partial<Frame> & { cap: ReactNode; read: Frame['read'] }): Frame => ({ phase: 'plane', filled: 3, t: 0, ...o });
  return [
    tf(0, undefined, <>A bank scores loan applicants with weights <b>w = [0.5 per ₹ lakh income, 0.01 per credit point]</b>. Three applicants are the three <b>rows</b> of X, a (3 × 2) matrix. Inner sizes match (2 and 2), so <b>X @ w</b> is a list of 3 scores.</>, [['shape of X', '3 × 2'], ['shape of w', '2'], ['shape of X @ w', '3']]),
    tf(0, (r, c) => r === 0 && c === 0, <>Row 1 times w, entry by entry. First pair: income 10 × weight 0.5 = <b>5</b>.</>, [['running sum', '5', C.gold]]),
    tf(1, (r) => r === 0, <>Second pair: credit 700 × 0.01 = 7. Add them: 5 + 7 = <b>12</b>. A matrix–vector product is just one <b>dot product per row</b>.</>, [['applicant 1', '12', C.yellow]]),
    tf(2, (r) => r === 1, <>Row 2: 0.5 × 4 + 0.01 × 600 = 2 + 6 = <b>8</b>. Same weights, different row.</>, [['applicant 1', '12', C.yellow], ['applicant 2', '8', C.yellow]]),
    tf(3, (r) => r === 2, <>Row 3: 0.5 × 20 + 0.01 × 800 = 10 + 8 = <b>18</b>. Applicant 3 scores highest. For one lakh applicants the code is identical: X just has more rows.</>, [['applicant 1', '12', C.yellow], ['applicant 2', '8', C.yellow], ['applicant 3', '18', C.yellow]]),
    pf({ t: 0, basis: 'both', cap: <>Now a different view. A <b>2 × 2 matrix</b> M = [[2, −1], [1, 1]] can multiply <b>every point of the plane</b>. Here are 25 grid points (blue) and the two unit arrows <b>î = [1, 0]</b> (green) and <b>ĵ = [0, 1]</b> (red).</>, read: [['M', '[[2, −1], [1, 1]]']] }),
    pf({ t: 0, point: 'start', mHl: () => false, cap: <>Follow one point, <b>p = [1, 2]</b> (gold). M @ p is computed exactly like the loan scores: one dot product per row of M.</>, read: [['p', '[1, 2]', C.gold]] }),
    pf({ t: 0, point: 'x', mHl: (r) => r === 0, cap: <><b>Row 1</b> of M gives the new first coordinate: 2 × 1 + (−1) × 2 = <b>0</b>.</>, read: [['p', '[1, 2]', C.gold], ['new x', '0', C.yellow]] }),
    pf({ t: 0, point: 'xy', mHl: (r) => r === 1, cap: <><b>Row 2</b> gives the new second coordinate: 1 × 1 + 1 × 2 = <b>3</b>. So M moves p = [1, 2] to <b>[0, 3]</b> (yellow).</>, read: [['p', '[1, 2]', C.gold], ['M @ p', '[0, 3]', C.yellow]] }),
    pf({ t: 0, basis: 'i', mHl: (_r, c) => c === 0, cap: <>Shortcut: where does <b>î = [1, 0]</b> go? Row by row: [2 × 1 − 1 × 0, 1 × 1 + 1 × 0] = <b>[2, 1]</b>, which is simply the <b>first column</b> of M.</>, read: [['M @ î', '[2, 1]', C.green]] }),
    pf({ t: 0, basis: 'j', mHl: (_r, c) => c === 1, cap: <>And <b>ĵ = [0, 1]</b> lands on [−1, 1], the <b>second column</b>. Read a matrix by its columns: they tell you where the two unit arrows end up.</>, read: [['M @ ĵ', '[−1, 1]', C.red]] }),
    ...[0.25, 0.5, 0.75, 1].map((t) => pf({ t, basis: 'both', square: true, cap: t < 1
      ? <>Now apply M to <b>every</b> point at once (we slide smoothly from "do nothing" to M: {Math.round(t * 100)}% of the way). Grid lines stay <b>straight</b>, <b>parallel</b> and evenly spaced: that is what "linear" means.</>
      : <>Done: every point has moved to M @ point. The green arrow sits at the first column [2, 1], the red at the second column [−1, 1], and the whole grid followed them.</>, read: [['progress', `${Math.round(t * 100)}%`]] })),
    pf({ t: 1, basis: 'both', square: true, point: 'xy', cap: <>The unit square (area 1) became a parallelogram of area <b>3</b> = 2 × 1 − (−1) × 1, the <b>determinant</b> of M. Every shape in the plane grows 3 times. Our gold point is at [0, 3] as computed row by row.</>, read: [['det M', '3', C.green], ['area of square', '1 → 3']] }),
    pf({ t: 1, basis: 'both', square: true, cap: <><b>Two views, one operation.</b> Row view: each output entry is a dot product (scores, predictions). Column view: the output is a blend of M's columns, so a matrix <b>transforms space</b>. Neural-network layers, PCA and rotations are all this.</>, read: [['det M', '3', C.green], ['columns', '[2, 1], [−1, 1]']] }),
  ];
}

function Animate() {
  const frames = useMemo(buildFrames, []);
  const p = useStepPlayer(frames.length, 2000);
  const f = frames[p.i];
  const xr: [number, number] = [-6, 6], yr: [number, number] = [-4.5, 4.5];
  const A = blendI(M, f.t);
  const scoreCol = (r: number) => (r < f.filled ? 'rgba(255,255,0,0.18)' : undefined);
  return (
    <div>
      <Layout
        main={f.phase === 'table' ? <>
          <div className="row" style={{ gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
            <MatrixView title="X (applicants)" data={X} colLabels={['income ₹L', 'credit']} rowLabels={['1', '2', '3']} highlight={f.hl} />
            <b style={{ fontSize: 22 }}>@</b>
            <MatrixView title="w (weights)" data={W.map((v) => [v])} highlight={f.hl ? (r) => !!f.hl && [0, 1, 2].some((rr) => f.hl!(rr, r)) : undefined} />
            <b style={{ fontSize: 22 }}>=</b>
            <MatrixView title="score" data={SCORES.map((v, i) => [i < f.filled ? v : '?'])} cellColor={scoreCol} highlight={f.hl ? (r) => !!f.hl && f.hl(r, 1) : undefined} />
          </div>
          <Plot x={[0.4, 3.6]} y={[0, 20]} height={250} xTicks={3} fx={(v) => (Number.isInteger(v) ? `applicant ${v}` : '')} xLabel="applicant" yLabel="score">
            {(s) => <>
              <Bars s={s} data={SCORES.map((v, i) => ({ x: i + 1, y: i < f.filled ? v : 0 }))} width={0.5} color={C.yellow} />
              {SCORES.map((v, i) => i < f.filled && <Label key={i} s={s} x={i + 1} y={v + 0.8} anchor="middle" color={C.yellow}>{v}</Label>)}
            </>}
          </Plot>
        </> : <>
          <div className="row" style={{ gap: 18, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
            <MatrixView title="M" data={M} highlight={f.mHl} />
            {f.point && <><b>@</b><MatrixView title="p" data={[[1], [2]]} highlight={f.point !== 'start' ? () => true : undefined} /><b>=</b>
              <MatrixView title="M @ p" data={[[f.point === 'start' ? '?' : 0], [f.point === 'xy' ? 3 : '?']]} highlight={f.mHl ? (r) => f.mHl!(r, 0) && f.point !== 'start' : undefined} /></>}
          </div>
          <Plot x={xr} y={yr} height={equalH(xr, yr)} xLabel="first coordinate" yLabel="second coordinate">
            {(s) => <>
              <Plane s={s} A={A} showSquare={f.square} showBasis={f.basis === 'both'} />
              {f.basis === 'i' && <><Arrow s={s} x1={0} y1={0} x2={1} y2={0} color={C.green} width={1.5} /><Arrow s={s} x1={0} y1={0} x2={2} y2={1} color={C.green} label="M î = [2, 1]" /></>}
              {f.basis === 'j' && <><Arrow s={s} x1={0} y1={0} x2={0} y2={1} color={C.red} width={1.5} /><Arrow s={s} x1={0} y1={0} x2={-1} y2={1} color={C.red} label="M ĵ = [−1, 1]" /></>}
              {f.point && <><Dots s={s} pts={[{ x: P[0], y: P[1] }]} color={C.gold} r={7} animate={false} /><Label s={s} x={P[0] + 0.2} y={P[1] - 0.4} color={C.gold}>p</Label></>}
              {f.point === 'x' && <Seg s={s} x1={0} y1={-4.5} x2={0} y2={4.5} color={C.yellow} dash="5 4" />}
              {f.point === 'xy' && <><Arrow s={s} x1={P[0]} y1={P[1]} x2={0} y2={3} color={C.yellow} width={1.5} /><Dots s={s} pts={[{ x: 0, y: 3 }]} color={C.yellow} r={7} animate={false} /><Label s={s} x={-0.3} y={3.3} color={C.yellow} anchor="end">M p = [0, 3]</Label></>}
            </>}
          </Plot>
        </>}
        side={<>
          <Readout items={f.read} />
          <Legend items={f.phase === 'table' ? [['current row × weights', C.gold], ['computed score', C.yellow]] : [['grid points', C.blue], ['î and its image', C.green], ['ĵ and its image', C.red], ['followed point', C.gold]]} />
          <p className="small muted" style={{ margin: 0 }}>{f.phase === 'table' ? 'Rule for shapes: (rows × k) @ (k) → (rows). The inner sizes must match.' : 'Columns of M = where the unit arrows land. Determinant = how much areas grow.'}</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{f.cap}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
const PRESETS: Record<string, { label: string; A: M2 }> = {
  identity: { label: 'Identity', A: [[1, 0], [0, 1]] },
  stretch: { label: 'Stretch', A: [[2, 0], [0, 0.5]] },
  rotate: { label: 'Rotate 45°', A: [[0.7, -0.7], [0.7, 0.7]] },
  shear: { label: 'Shear', A: [[1, 1], [0, 1]] },
  reflect: { label: 'Mirror', A: [[-1, 0], [0, 1]] },
  squash: { label: 'Squash (det 0)', A: [[1, 2], [0.5, 1]] },
};

function Playground() {
  const [A, setA] = useState<M2>([[2, -1], [1, 1]]);
  const [preset, setPreset] = useState('');
  const [p, setP] = useState<V2>([1, 2]);
  const set = (r: number, c: number) => (v: number) => { const B = A.map((row) => [...row]) as M2; B[r][c] = v; setA(B); setPreset(''); };
  const d = det(A), Ap = mv(A, p);
  const pr: [number, number] = [-5, 5];
  return (
    <Layout
      main={<Plot x={pr} y={pr} width={600} height={equalH(pr, pr, 600)} xLabel="first coordinate" yLabel="second coordinate" onClick={(pt) => setP([Math.round(pt.x * 2) / 2, Math.round(pt.y * 2) / 2])}>
        {(s) => <>
          <Plane s={s} A={A} showSquare showF dots={false} wide />
          <Dots s={s} pts={[{ x: p[0], y: p[1] }]} color={C.gold} r={6} animate={false} />
          <Arrow s={s} x1={p[0]} y1={p[1]} x2={Ap[0]} y2={Ap[1]} color={C.yellow} width={1.5} />
          <Dots s={s} pts={[{ x: Ap[0], y: Ap[1] }]} color={C.yellow} r={6} />
          <Label s={s} x={-4.8} y={4.4} color={C.muted} size={12}>pink "F": watch it shear, rotate or flip</Label>
        </>}
      </Plot>}
      side={<>
        <Choice label="Preset" value={preset} onChange={(k) => { setPreset(k); setA(PRESETS[k].A.map((r) => [...r]) as M2); }} options={Object.entries(PRESETS).map(([k, v]) => ({ value: k, label: v.label }))} />
        <MatrixView title="M (columns = where î, ĵ land)" data={A.map((r) => r.map((v) => +v.toFixed(2)))} cellColor={(_r, c) => (c === 0 ? 'rgba(131,193,103,0.18)' : 'rgba(252,98,85,0.18)')} />
        <Slider label="a (top-left)" min={-2} max={2} step={0.1} value={A[0][0]} onChange={set(0, 0)} format={(v) => v.toFixed(1)} />
        <Slider label="b (top-right)" min={-2} max={2} step={0.1} value={A[0][1]} onChange={set(0, 1)} format={(v) => v.toFixed(1)} />
        <Slider label="c (bottom-left)" min={-2} max={2} step={0.1} value={A[1][0]} onChange={set(1, 0)} format={(v) => v.toFixed(1)} />
        <Slider label="d (bottom-right)" min={-2} max={2} step={0.1} value={A[1][1]} onChange={set(1, 1)} format={(v) => v.toFixed(1)} />
        <Readout items={[
          ['determinant', f2(d), Math.abs(d) < 0.05 ? C.red : d > 0 ? C.green : C.red],
          ['invertible?', Math.abs(d) < 0.05 ? 'no: squashed' : d < 0 ? 'yes (flipped)' : 'yes', Math.abs(d) < 0.05 ? C.red : C.text],
          ['p (click)', `[${p[0]}, ${p[1]}]`, C.gold],
          ['M @ p', `[${f2(Ap[0], 1)}, ${f2(Ap[1], 1)}]`, C.yellow],
        ]} />
        <p className="small muted" style={{ margin: 0 }}>Row 1 · p = {f2(A[0][0], 1)}×{p[0]} + {f2(A[0][1], 1)}×{p[1]} = {f2(Ap[0], 1)}. When the determinant hits 0 the whole plane collapses onto a line: different points land on the same spot, so you can never undo M.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Part 1 scores three loan applicants with **X @ w**, one row at a time. Part 2 treats a 2 × 2 matrix as a machine that moves every point of the plane.', steps: [
      { do: 'Press **▶ Step** through the first five frames.', notice: 'Each score is one **dot product**: a row of X times the weights. The gold cells show which numbers are being multiplied.' },
      { do: 'Keep stepping through the gold point p = [1, 2].', notice: 'Row 1 of M gives the new x (0), row 2 the new y (3). The unit arrows land exactly on the **columns** of M.' },
      { do: 'Watch the grid morph to the end.', notice: 'Lines stay straight and parallel, and the unit square grows to area **3 = det M**.' },
    ] },
    Playground: { what: 'Set the four entries of a 2 × 2 matrix (or pick a preset) and see how it transforms the grid, the unit square and the letter F. Click anywhere to move the gold test point.', steps: [
      { do: 'Try the presets **Rotate 45°**, **Shear** and **Mirror**.', notice: 'The green and red arrows always sit on the matrix columns. The mirror makes the determinant negative and the F reads backwards.' },
      { do: 'Choose **Squash (det 0)**.', notice: 'The whole plane collapses onto one line. The determinant is 0 and the matrix has **no inverse**: information is destroyed.' },
      { do: 'Drag slider **b** slowly and watch the readout.', notice: 'Area (the determinant) changes smoothly; when it crosses 0 the square turns red and the F flips.' },
    ] },
  },
};
export default anim;
