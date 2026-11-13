// Perceptron: the learning rule nudges a line point by point. AND converges; XOR cycles forever.
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Bars, Dots, Seg, Label, Caption, Readout, Slider, Choice, Toggle, Layout, Legend, useStepPlayer, PlayerControls, Tex, C, Scales, rng } from '../viz/kit';
import { LP, runPerceptron, PercStep, DecisionHeat, lineEnds, equalH, blobs, f2 } from './_clf-helpers';

/* ---------- pure helpers ---------- */
const CL = [C.blue, C.red];
const XR: [number, number] = [-0.6, 1.6];
const PW = 560, PH = equalH(XR, XR, PW);
const corners = (t: number[]): LP[] => [[0, 0], [0, 1], [1, 0], [1, 1]].map(([x, y], i) => ({ x, y, c: t[i] as 0 | 1 }));
const AND = corners([0, 0, 0, 1]), OR = corners([0, 1, 1, 1]), XOR = corners([0, 1, 1, 0]);
const NAME = ['(0,0)', '(0,1)', '(1,0)', '(1,1)'];
const fw = (w: [number, number], b: number) => `w = (${f2(w[0], w[0] % 1 ? 2 : 0)}, ${f2(w[1], w[1] % 1 ? 2 : 0)}), b = ${f2(b, b % 1 ? 2 : 0)}`;
function mistakesPerEpoch(steps: PercStep[], epochs: number) {
  const m = Array(epochs).fill(0); steps.forEach((s) => { if (s.wrong) m[s.epoch]++; }); return m;
}

function Board({ s, pts, w, b, prev, hi }: { s: Scales; pts: LP[]; w: [number, number]; b: number; prev?: { w: [number, number]; b: number }; hi?: number }) {
  const e = lineEnds(s, w, b), pe = prev ? lineEnds(s, prev.w, prev.b) : null;
  return <>
    <DecisionHeat s={s} nx={44} ny={44} c0={C.blue} c1={C.red} strength={0.22} score={(x, y) => (w[0] * x + w[1] * y + b > 0 ? 1 : 0)} />
    {pe && <Seg s={s} x1={pe[0]} y1={pe[1]} x2={pe[2]} y2={pe[3]} color={C.grey} width={2} dash="6 5" />}
    {e && <Seg s={s} x1={e[0]} y1={e[1]} x2={e[2]} y2={e[3]} color={C.yellow} width={3} />}
    <Dots s={s} pts={pts} color={(i) => CL[pts[i].c]} r={pts.length > 6 ? 5 : 11} animate={false} />
    {hi !== undefined && <circle cx={s.sx(pts[hi].x)} cy={s.sy(pts[hi].y)} r={17} fill="none" stroke={C.gold} strokeWidth={3} />}
  </>;
}

/* ---------- Animate ---------- */
type PF = { set: 'AND' | 'XOR'; kind: 'intro' | 'step' | 'epoch' | 'done' | 'cycle'; st?: PercStep; epoch?: number; w: [number, number]; b: number; prev?: { w: [number, number]; b: number }; ups?: string[] };

function buildFrames(): { frames: PF[]; andM: number[]; xorM: number[] } {
  const A = runPerceptron(AND, 6), X = runPerceptron(XOR, 6);
  const frames: PF[] = [{ set: 'AND', kind: 'intro', w: [0, 0], b: 0 }];
  A.slice(0, 8).forEach((st) => frames.push({ set: 'AND', kind: 'step', st, w: st.w, b: st.b, prev: st.wrong ? { w: st.wBefore, b: st.bBefore } : undefined }));
  for (let e = 2; e <= 4; e++) {
    const es = A.filter((q) => q.epoch === e), first = es[0];
    frames.push({ set: 'AND', kind: 'epoch', epoch: e, w: es[3].w, b: es[3].b, prev: { w: first.wBefore, b: first.bBefore }, ups: es.filter((q) => q.wrong).map((q) => NAME[q.idx]) });
  }
  const last = A[A.length - 1];
  frames.push({ set: 'AND', kind: 'done', epoch: 5, w: last.w, b: last.b });
  frames.push({ set: 'XOR', kind: 'intro', w: [0, 0], b: 0 });
  for (let e = 0; e < 5; e++) {
    const es = X.filter((q) => q.epoch === e), first = es[0];
    frames.push({ set: 'XOR', kind: 'epoch', epoch: e, w: es[3].w, b: es[3].b, prev: { w: first.wBefore, b: first.bBefore }, ups: es.filter((q) => q.wrong).map((q) => NAME[q.idx]) });
  }
  const xl = X[X.length - 1];
  frames.push({ set: 'XOR', kind: 'cycle', w: xl.w, b: xl.b });
  return { frames, andM: mistakesPerEpoch(A, 6), xorM: mistakesPerEpoch(X, 6) };
}

function Animate() {
  const { frames, andM, xorM } = useMemo(buildFrames, []);
  const p = useStepPlayer(frames.length, 1700);
  const f = frames[p.i];
  const pts = f.set === 'AND' ? AND : XOR;
  const mist = f.set === 'AND' ? andM : xorM;
  const shownEpochs = f.kind === 'intro' ? 0 : f.kind === 'step' ? f.st!.epoch + 1 : f.kind === 'epoch' ? f.epoch! + 1 : 6;
  const st = f.st;
  const caption = (() => {
    if (f.kind === 'intro' && f.set === 'AND') return <>The <b>AND</b> rule: output 1 (red) only when both inputs are 1. The perceptron starts with all weights zero, w = (0, 0), b = 0, so z = w·x + b = 0 everywhere and it answers 0 for everything. It will look at the four points in order and <b>change its weights only when it is wrong</b>.</>;
    if (f.kind === 'intro') return <>Now <b>XOR</b>: output 1 when exactly one input is 1. The red points sit on one diagonal and the blue on the other. Look closely: <b>no single straight line can put both reds on one side and both blues on the other.</b> Let's see what the learning rule does anyway.</>;
    if (f.kind === 'step' && st) {
      const p0 = AND[st.idx];
      return st.wrong
        ? <>Epoch {st.epoch + 1}, point <b>{NAME[st.idx]}</b> (target {p0.c}): z = {f2(st.z, 0)} → predicts {st.pred}. <b>Wrong!</b> Update w ← w + (target − prediction)·x, b ← b + (target − prediction): now <b>{fw(st.w, st.b)}</b>. The line jumps (grey dashed = before).</>
        : <>Epoch {st.epoch + 1}, point <b>{NAME[st.idx]}</b> (target {p0.c}): z = {f2(st.z, 0)} → predicts {st.pred}. <b>Correct</b>, so nothing changes. The perceptron only learns from mistakes.</>;
    }
    if (f.kind === 'epoch' && f.set === 'AND') return <>Epoch {f.epoch! + 1}: {f.ups!.length} mistake{f.ups!.length === 1 ? '' : 's'} (at {f.ups!.join(', ')}), each nudging the line. Weights now <b>{fw(f.w, f.b)}</b>. The mistakes per epoch (right) are shrinking.</>;
    if (f.kind === 'done') return <>Epoch 6: <b>zero mistakes</b>. With {fw(f.w, f.b)}, only (1,1) gives z &gt; 0. The point (1,0) sits exactly on the line (z = 0) and counts as 0. Because AND is <b>linearly separable</b>, the convergence theorem guarantees the rule stops, here after 10 updates.</>;
    if (f.kind === 'epoch') return <>XOR, epoch {f.epoch! + 1}: {f.ups!.length} mistake{f.ups!.length === 1 ? '' : 's'}. Every fix for one point breaks another, and the line swings around: <b>{fw(f.w, f.b)}</b>.</>;
    return <>After epoch 2 the weights repeat exactly the same four values every epoch, and <b>all 4 points are misclassified every time</b>. The perceptron never settles because XOR is <b>not linearly separable</b>. This is the 1969 "Perceptrons" critique; the fix is a hidden layer (the MLP topic).</>;
  })();
  return (
    <div>
      <Layout
        main={<div style={{ maxWidth: PW, margin: '0 auto' }}>
          <Plot x={XR} y={XR} width={PW} height={PH} xLabel="input x₁" yLabel="input x₂" xTicks={5} yTicks={5}>
            {(s) => <>
              <Board s={s} pts={pts} w={f.w} b={f.b} prev={f.prev} hi={st?.idx} />
              {pts.map((q, i) => <Label key={i} s={s} x={q.x} y={q.y - 0.16} anchor="middle" size={12} color={C.muted}>{`${NAME[i]} → ${q.c}`}</Label>)}
            </>}
          </Plot>
        </div>}
        side={<>
          <div className="small muted">Mistakes per epoch ({f.set})</div>
          <Plot x={[0.4, 6.6]} y={[0, 4.4]} width={320} height={170} xLabel="epoch" xTicks={6} yTicks={4}>
            {(s) => <Bars s={s} data={mist.slice(0, shownEpochs).map((m, i) => ({ x: i + 1, y: m }))} width={0.6} color={f.set === 'AND' ? C.blue : C.red} />}
          </Plot>
          <Readout items={[
            ['w₁', f2(f.w[0], 0), C.yellow], ['w₂', f2(f.w[1], 0), C.yellow], ['b', f2(f.b, 0), C.yellow],
            ['this point', st ? (st.wrong ? 'wrong → update' : 'correct') : '–', st?.wrong ? C.red : C.green],
          ]} />
          <Tex block>{'\\hat y = [\\,w\\cdot x + b > 0\\,],\\quad w \\leftarrow w + \\eta\\,(y-\\hat y)\\,x'}</Tex>
          <Legend items={[['target 0', C.blue], ['target 1', C.red], ['decision line', C.yellow], ['point being checked', C.gold]]} />
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caption}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
type DS = 'AND' | 'OR' | 'XOR' | 'blobs' | 'noisy';
const DSETS: Record<DS, () => LP[]> = {
  AND: () => AND, OR: () => OR, XOR: () => XOR,
  blobs: () => blobs(40, [0.15, 0.2], [0.85, 0.8], 0.13, 3),
  noisy: () => blobs(40, [0.3, 0.3], [0.7, 0.7], 0.22, 3),
};
const MAXE = 30;

function Playground() {
  const [ds, setDs] = useState<DS>('blobs');
  const [ep, setEp] = useState(1);
  const [eta, setEta] = useState(1);
  const [shuffle, setShuffle] = useState(false);
  const pts = useMemo(() => DSETS[ds](), [ds]);
  const steps = useMemo(() => runPerceptron(pts, MAXE, eta, [0, 0], 0, shuffle ? (e) => {
    const r = rng(100 + e), o = pts.map((_, i) => i);
    for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; }
    return o;
  } : undefined), [pts, eta, shuffle]);
  const mist = mistakesPerEpoch(steps, MAXE);
  const conv = mist.findIndex((m) => m === 0);
  const after = steps[ep * pts.length - 1];
  const prevS = ep > 1 ? steps[(ep - 1) * pts.length - 1] : undefined;
  const yMax = Math.max(4, ...mist) * 1.1;
  const errsNow = pts.filter((q) => ((after.w[0] * q.x + after.w[1] * q.y + after.b > 0 ? 1 : 0) !== q.c)).length;
  return (
    <Layout
      main={<>
        <div style={{ maxWidth: PW, margin: '0 auto' }}>
          <Plot x={XR} y={XR} width={PW} height={PH} xLabel="input x₁" yLabel="input x₂" xTicks={5} yTicks={5}>
            {(s) => <Board s={s} pts={pts} w={after.w} b={after.b} prev={prevS ? { w: prevS.w, b: prevS.b } : undefined} />}
          </Plot>
        </div>
        <div className="small muted" style={{ marginTop: 6 }}>Mistakes made during each epoch (gold = the epoch shown above)</div>
        <Plot x={[0.3, MAXE + 0.7]} y={[0, yMax]} height={150} xLabel="epoch" xTicks={10} yTicks={3}>
          {(s) => <Bars s={s} data={mist.map((m, i) => ({ x: i + 1, y: m }))} width={0.7} color={C.blue} highlight={(i) => i === ep - 1} />}
        </Plot>
      </>}
      side={<>
        <Choice label="Data" value={ds} onChange={(v) => { setDs(v); setEp(1); }} options={[{ value: 'AND', label: 'AND' }, { value: 'OR', label: 'OR' }, { value: 'XOR', label: 'XOR' }, { value: 'blobs', label: 'Blobs' }, { value: 'noisy', label: 'Overlap' }]} />
        <Slider label="show after epoch" min={1} max={MAXE} value={ep} onChange={setEp} />
        <Slider label="learning rate η" min={0.1} max={2} step={0.1} value={eta} onChange={setEta} format={(v) => v.toFixed(1)} />
        <Toggle label="shuffle order each epoch" value={shuffle} onChange={setShuffle} />
        <Readout items={[
          ['weights', `(${f2(after.w[0])}, ${f2(after.w[1])})`, C.yellow], ['bias', f2(after.b), C.yellow],
          ['errors now', `${errsNow} / ${pts.length}`, errsNow ? C.red : C.green], ['converged at', conv >= 0 ? `epoch ${conv + 1}` : 'never (30 ep.)', conv >= 0 ? C.green : C.red],
        ]} />
        <Legend items={[['target 0', C.blue], ['target 1', C.red], ['line now', C.yellow], ['line one epoch earlier', C.grey]]} />
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'A perceptron learns **AND** one point at a time, moving its line only when it makes a mistake, and then fails forever on **XOR**. The numbers match the chapter\'s worked example (w and b start at 0, η = 1).', steps: [
      { do: 'Press **▶ Step** through the first eight frames.', notice: 'The gold ring shows the point being checked. Correct → nothing happens; wrong → the yellow line jumps (grey dashes show where it was).' },
      { do: 'Continue to the "zero mistakes" frame.', notice: 'The bars on the right shrink to 0: AND is linearly separable, so learning stops (after 10 updates).' },
      { do: 'Play through the XOR frames.', notice: 'The bars stay at 4 forever and the line keeps swinging: no straight line can solve XOR.' },
    ] },
    Playground: { what: 'Run the perceptron for up to 30 epochs on logic gates or point clouds. Scrub through epochs and watch the line and the mistakes per epoch.', steps: [
      { do: 'On **Blobs**, drag "show after epoch" from 1 upwards.', notice: 'The line settles within a few epochs and the mistake bars drop to zero.' },
      { do: 'Switch to **Overlap**.', notice: 'Mistakes never reach zero and the line keeps jumping between epochs: no convergence on non-separable data.' },
      { do: 'Change **η** on AND, then turn on **shuffle**.', notice: 'With zero starting weights, η only rescales w and b: the line and the mistakes stay the same. Shuffling changes the path and the final line.' },
    ] },
  },
};
export default anim;
