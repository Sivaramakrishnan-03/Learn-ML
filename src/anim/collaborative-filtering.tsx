// Collaborative filtering by matrix factorisation: a user × film ratings matrix whose missing cells are filled by factor dot products learned step by step.
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, MatrixView, Caption, Readout, Slider, Toggle, Layout, Legend, Tex, useStepPlayer, PlayerControls, rng, gauss, C, Scales } from '../viz/kit';
import { dot } from '../viz/math';

/* ---------- pure helpers ---------- */
const FILMS = ['Desert Chase', 'Highway Heist', 'Monsoon Letters', 'Wedding Season', 'Night Train'];
const USERS = ['Asha', 'Ravi', 'Meera', 'Kabir', 'Priya', 'Dev'];
// 0 = not rated. First four rows extend the lesson's matrix (two action films, two romances, plus a thriller).
const R0: number[][] = [
  [5, 4, 1, 0, 0],
  [5, 5, 1, 2, 4],
  [1, 2, 5, 5, 0],
  [4, 4, 2, 1, 5],
  [0, 5, 1, 0, 4],
  [2, 0, 4, 5, 1],
];
interface Model { mu: number; P: number[][]; Q: number[][] }
const predict = (m: Model, u: number, i: number) => m.mu + dot(m.P[u], m.Q[i]);
const clip = (v: number) => Math.min(5.5, Math.max(0.5, v));

function known(R: number[][]) { const out: [number, number][] = []; R.forEach((row, u) => row.forEach((v, i) => { if (v > 0) out.push([u, i]); })); return out; }
function init(R: number[][], k: number, seed: number): Model {
  const r = rng(seed), ks = known(R);
  const mu = ks.reduce((s, [u, i]) => s + R[u][i], 0) / ks.length;
  return { mu, P: R.map(() => Array.from({ length: k }, () => gauss(r) * 0.3)), Q: R[0].map(() => Array.from({ length: k }, () => gauss(r) * 0.3)) };
}
/** One SGD update on a single known rating; returns the new model plus the numbers used (for narration). */
function sgdStep(m: Model, R: number[][], u: number, i: number, lr: number, lam: number) {
  const pred = predict(m, u, i), e = R[u][i] - pred;
  const pu = m.P[u], qi = m.Q[i];
  const P = m.P.map((row, a) => (a === u ? row.map((v, f) => v + lr * (e * qi[f] - lam * v)) : row));
  const Q = m.Q.map((row, b) => (b === i ? row.map((v, f) => v + lr * (e * pu[f] - lam * v)) : row));
  return { model: { mu: m.mu, P, Q }, pred, e };
}
function order(R: number[][], seed: number) { const ks = known(R), r = rng(seed); for (let j = ks.length - 1; j > 0; j--) { const k = Math.floor(r() * (j + 1)); [ks[j], ks[k]] = [ks[k], ks[j]]; } return ks; }
/** Train for the given epochs; return snapshots at the requested epochs. */
function train(R: number[][], k: number, lam: number, epochs: number[], seed = 4, lr = 0.05) {
  let m = init(R, k, seed); const ord = order(R, seed + 1), max = Math.max(...epochs), snaps = new Map<number, Model>();
  if (epochs.includes(0)) snaps.set(0, m);
  for (let ep = 1; ep <= max; ep++) { ord.forEach(([u, i]) => { m = sgdStep(m, R, u, i, lr, lam).model; }); if (epochs.includes(ep)) snaps.set(ep, m); }
  return snaps;
}
function rmse(m: Model, R: number[][], cells: [number, number][]) { return cells.length ? Math.sqrt(cells.reduce((s, [u, i]) => s + (R[u][i] - predict(m, u, i)) ** 2, 0) / cells.length) : 0; }

function RatingsTable({ R, m, focus, hidden, users = USERS }: { R: number[][]; m: Model; focus?: [number, number]; hidden?: [number, number][]; users?: string[] }) {
  const isHidden = (u: number, i: number) => !!hidden?.some(([a, b]) => a === u && b === i);
  return <MatrixView rowLabels={users} colLabels={FILMS.map((f) => f.split(' ')[0])}
    data={R.map((row, u) => row.map((v, i) => (v > 0 && !isHidden(u, i) ? `${v} (${clip(predict(m, u, i)).toFixed(1)})` : `? → ${clip(predict(m, u, i)).toFixed(1)}${isHidden(u, i) ? ` [${v}]` : ''}`)))}
    highlight={(u, i) => !!focus && focus[0] === u && focus[1] === i}
    cellColor={(u, i) => (R[u][i] > 0 && !isHidden(u, i) ? `rgba(252,98,85,${Math.min(0.5, Math.abs(R[u][i] - predict(m, u, i)) / 3).toFixed(2)})` : isHidden(u, i) ? 'rgba(154,114,172,0.3)' : `rgba(255,255,0,${(0.05 + Math.abs(predict(m, u, i) - m.mu) / 6).toFixed(2)})`)} />;
}
/** Axis half-height that fits all factor vectors with equal units on both axes (inner plot area ≈ 332 px wide). */
function factorLim(m: Model, height: number) {
  const asp = 332 / (height - 56), all = [...m.P, ...m.Q];
  return Math.max(0.6, ...all.map((v) => Math.abs(v[0]) / asp * 1.2), ...all.map((v) => Math.abs(v[1] ?? 0) * 1.25));
}
function FactorMap({ m, users = USERS, lim, height = 300 }: { m: Model; users?: string[]; lim: number; height?: number }) {
  const asp = 332 / (height - 56);
  return <Plot x={[-lim * asp, lim * asp]} y={[-lim, lim]} width={400} height={height} xLabel="taste factor 1" yLabel="taste factor 2" xTicks={4} yTicks={4}>
    {(s: Scales) => <>
      <line x1={s.sx(0)} x2={s.sx(0)} y1={s.pad.t} y2={s.H - s.pad.b} stroke={C.grey} />
      <line x1={s.pad.l} x2={s.W - s.pad.r} y1={s.sy(0)} y2={s.sy(0)} stroke={C.grey} />
      {m.Q.map((q, i) => <g key={'f' + i}><rect x={s.sx(q[0]) - 5} y={s.sy(q[1] ?? 0) - 5} width={10} height={10} fill={C.pink} /><text x={s.sx(q[0]) + 8} y={s.sy(q[1] ?? 0) + 4} fill={C.pink} fontSize={11}>{FILMS[i].split(' ')[0]}</text></g>)}
      {m.P.map((p, u) => <g key={'u' + u}><circle cx={s.sx(p[0])} cy={s.sy(p[1] ?? 0)} r={5} fill={C.blue} /><text x={s.sx(p[0]) + 8} y={s.sy(p[1] ?? 0) - 6} fill={C.blue} fontSize={11}>{users[u]}</text></g>)}
    </>}
  </Plot>;
}

/* ---------- Animate ---------- */
const EPOCHS = [0, 1, 3, 6, 10, 20, 40, 80, 150];

function Animate() {
  const snaps = useMemo(() => train(R0, 2, 0.02, EPOCHS), []);
  const ks = known(R0);
  const m0 = snaps.get(0)!;
  const step = useMemo(() => sgdStep(m0, R0, 0, 0, 0.05, 0.02), [m0]);
  const final = snaps.get(150)!;
  const lim = factorLim(final, 300);
  type F = { kind: 'matrix' | 'init' | 'step' | 'epoch' | 'read'; ep: number };
  const frames: F[] = [{ kind: 'matrix', ep: 0 }, { kind: 'init', ep: 0 }, { kind: 'step', ep: 0 }, ...EPOCHS.slice(1).map((ep) => ({ kind: 'epoch' as const, ep })), { kind: 'read', ep: 150 }];
  const p = useStepPlayer(frames.length, 1500);
  const f = frames[p.i];
  const m = f.kind === 'step' ? step.model : snaps.get(f.ep)!;
  const err = rmse(m, R0, ks);
  const curve = EPOCHS.filter((ep) => ep <= f.ep).map((ep) => ({ ep, v: rmse(snaps.get(ep)!, R0, ks) }));
  const aw = clip(predict(m, 0, 3)), an = clip(predict(m, 0, 4));
  const f2 = (v: number) => v.toFixed(2), f3 = (v: number) => v.toFixed(3);
  const caption =
    f.kind === 'matrix' ? <>Six viewers rated five films (1–5). Blank cells are films they have not watched: <b>those are what we want to predict</b>. Collaborative filtering uses only the pattern of ratings, no genres or descriptions.</>
      : f.kind === 'init' ? <>Matrix factorisation gives every viewer and every film a short vector of <b>2 hidden taste factors</b>, starting tiny and random (bottom chart, all near the centre). Prediction = average rating μ = {f2(m.mu)} + viewer · film. With random factors every prediction is ≈ {m.mu.toFixed(1)} (the numbers in brackets). Red cells = big errors.</>
        : f.kind === 'step' ? <>One learning step on <b>Asha × Desert Chase</b> (gold cell): prediction {f2(step.pred)}, actual 5, error <b>{f2(step.e)}</b>. Nudge Asha's vector towards the film's vector and the film's towards Asha's, by learning rate × error. Her prediction rises a little. Now repeat for every known rating, many times.</>
          : f.kind === 'epoch' ? <>After <b>{f.ep} pass{f.ep > 1 ? 'es' : ''}</b> over all {ks.length} known ratings: error on known cells (RMSE) = <b>{f2(err)}</b>. {f.ep < 10 ? 'Viewers and films start to spread out along the taste axes.' : 'Action fans and action films drift to one side, romance to the other; the yellow guesses in blank cells become confident.'}</>
            : <>Learned. Asha's predicted rating for Wedding Season is <b>{aw.toFixed(1)}</b> (don't recommend) and for Night Train <b>{an.toFixed(1)}</b> (recommend). In the factor map she sits next to the action films and far from the romances. Nobody told the model about genres: <b>the factors were discovered from the ratings alone</b>.</>;
  return (
    <div>
      <Layout
        main={<>
          <RatingsTable R={R0} m={m} focus={f.kind === 'step' ? [0, 0] : f.kind === 'read' ? [0, 3] : undefined} />
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,1fr)', gap: 8, marginTop: 8 }}>
            <FactorMap m={m} lim={lim} />
            <Plot x={[0, 150]} y={[0, 2.5]} width={360} height={300} xLabel="passes over the data (epochs)" yLabel="RMSE on known ratings" xTicks={5} yTicks={5}>
              {(s) => <>
                <path d={curve.map((c, i) => `${i ? 'L' : 'M'}${s.sx(c.ep)},${s.sy(c.v)}`).join('')} fill="none" stroke={C.red} strokeWidth={2.5} />
                {curve.map((c) => <circle key={c.ep} cx={s.sx(c.ep)} cy={s.sy(c.v)} r={3.5} fill={C.red} />)}
              </>}
            </Plot>
          </div>
        </>}
        side={<>
          <Readout items={[['epoch', f.kind === 'step' ? '1 step' : f.ep], ['RMSE (known)', f2(err), C.red], ['Asha · Wedding', aw.toFixed(1), C.yellow], ['Asha · Night Train', an.toFixed(1), C.yellow]]} />
          {f.kind === 'step' && <div className="small mono" style={{ lineHeight: 1.7 }}>
            p_Asha: ({m0.P[0].map(f3).join(', ')}) → ({step.model.P[0].map(f3).join(', ')})<br />
            q_Desert: ({m0.Q[0].map(f3).join(', ')}) → ({step.model.Q[0].map(f3).join(', ')})
          </div>}
          <div className="small"><Tex>{'\\hat r_{ui} = \\mu + p_u \\cdot q_i'}</Tex></div>
          <div className="small"><Tex>{'p_u \\leftarrow p_u + \\eta\\,(e\\, q_i - \\lambda p_u)'}</Tex></div>
          <Legend items={[['viewer', C.blue], ['film', C.pink], ['prediction for blank', C.yellow], ['error on known', C.red]]} />
          <p className="small muted" style={{ margin: 0 }}>Cells show "actual (prediction)" for known ratings and "? → prediction" for blanks.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caption}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
const HIDDEN: [number, number][] = [[1, 3], [2, 1], [3, 4]]; // Ravi·Wedding, Meera·Highway, Kabir·Night Train held out as a test

function Playground() {
  const [k, setK] = useState(2);
  const [lam, setLam] = useState(0.02);
  const [epochs, setEpochs] = useState(150);
  const [test, setTest] = useState(true);
  const [cold, setCold] = useState(false);
  const users = cold ? [...USERS, 'Zoya (new)'] : USERS;
  const R = useMemo(() => (cold ? [...R0, [5, 0, 0, 0, 0]] : R0), [cold]);
  const Rtrain = useMemo(() => R.map((row, u) => row.map((v, i) => (test && HIDDEN.some(([a, b]) => a === u && b === i) ? 0 : v))), [R, test]);
  const m = useMemo(() => train(Rtrain, k, lam, [epochs], 4, 0.05).get(epochs)!, [Rtrain, k, lam, epochs]);
  const trainErr = rmse(m, Rtrain, known(Rtrain));
  const testErr = test ? rmse(m, R, HIDDEN) : NaN;
  const lim = factorLim(m, 280);
  return (
    <Layout
      main={<>
        <RatingsTable R={R} m={m} hidden={test ? HIDDEN : undefined} users={users} />
        <div style={{ marginTop: 8, maxWidth: 480 }}><FactorMap m={m} users={users} lim={lim} height={280} /></div>
        {k === 1 && <p className="small muted">With one factor every viewer and film is a point on a line (shown on the horizontal axis).</p>}
        {k === 3 && <p className="small muted">With three factors the map shows only the first two.</p>}
      </>}
      side={<>
        <Slider label="factors k" min={1} max={3} value={k} onChange={setK} />
        <Slider label="regularisation λ" min={0} max={0.5} step={0.01} value={lam} onChange={setLam} format={(v) => v.toFixed(2)} />
        <Slider label="epochs" min={0} max={400} step={10} value={epochs} onChange={setEpochs} />
        <Toggle label="hide 3 known ratings as a test (purple)" value={test} onChange={setTest} />
        <Toggle label="add a new viewer who rated one film" value={cold} onChange={setCold} />
        <Readout items={[['train RMSE', trainErr.toFixed(2), C.red], ['test RMSE (hidden)', test ? testErr.toFixed(2) : '–', C.purple], ['μ (average)', m.mu.toFixed(2)]]} />
        <p className="small muted" style={{ margin: 0 }}>Purple cells show "? → prediction [true value]". Watch train error and test error separately: driving train error to 0 is not the goal.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'A viewer × film ratings matrix with blanks. **Matrix factorisation** learns 2 hidden taste factors per viewer and per film so that μ + viewer · film reproduces the known ratings, then uses the same dot product to **fill the blanks**.', steps: [
      { do: 'Step to the **one learning step** frame.', notice: 'The error on Asha × Desert Chase nudges both vectors (numbers on the right), and her prediction moves towards 5.' },
      { do: 'Press **▶ Play** through the epochs.', notice: 'Red error cells fade, RMSE falls, and viewers and films separate into an action side and a romance side in the factor map.' },
      { do: 'Read the last frame.', notice: 'Asha gets a low prediction for Wedding Season and a high one for Night Train, learned from people with similar ratings.' },
    ] },
    Playground: { what: 'Change the number of factors, the regularisation and training length. Three known ratings are hidden as a **test**, so you can see whether the model generalises.', steps: [
      { do: 'Set **k = 3** and **λ = 0**, epochs 400.', notice: 'Train RMSE gets close to 0 but the test error grows: the model memorises the few ratings it has (overfitting).' },
      { do: 'Raise **λ** to about 0.1.', notice: 'Training error rises a little, test error usually improves: small factors generalise better.' },
      { do: 'Tick **add a new viewer who rated one film**.', notice: 'Zoya rated only Desert Chase, so her predictions stay close to the average: the cold-start problem.' },
    ] },
  },
};
export default anim;
