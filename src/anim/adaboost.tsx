// AdaBoost: stumps added round by round; misclassified points grow (weights); the weighted vote builds a staircase boundary.
import { ReactNode, useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, FnLine, Seg, Label, Bars, Caption, Readout, Slider, Choice, Toggle, Layout, Legend, useStepPlayer, PlayerControls, C } from '../viz/kit';
import { credit, diagonal, ring, boundary, Field, Boundary, ClassDots, CLS, CP, G, cellCentres, mean } from './_ensembles-helpers';

/* ---------- pure helpers ---------- */
interface Stump { f: number; t: number; pol: number; eps: number; alpha: number } // h(x) = pol if x_f > t else −pol
const hS = (s: Stump, x: number[]) => (x[s.f] > s.t ? s.pol : -s.pol);
const sgn = (p: CP) => (p.label === 1 ? 1 : -1);
/** The stump with the smallest weighted error (exhaustive over both features, thresholds and directions). */
function bestStump(pts: CP[], w: number[]): Stump {
  let best: Stump = { f: 0, t: 5, pol: 1, eps: 1, alpha: 0 };
  [0, 1].forEach((f) => {
    const vals = [...new Set(pts.map((p) => (f ? p.y : p.x)))].sort((a, b) => a - b);
    const ths = [vals[0] - 0.05, ...vals.slice(0, -1).map((v, i) => (v + vals[i + 1]) / 2)];
    ths.forEach((t) => [1, -1].forEach((pol) => {
      let e = 0; pts.forEach((p, i) => { if (hS({ f, t, pol, eps: 0, alpha: 0 }, [p.x, p.y]) !== sgn(p)) e += w[i]; });
      if (e < best.eps - 1e-12) best = { f, t, pol, eps: e, alpha: 0 };
    }));
  });
  const e = Math.min(Math.max(best.eps, 1e-6), 1 - 1e-6);
  return { ...best, alpha: 0.5 * Math.log((1 - e) / e) };
}
interface Round { stump: Stump; wBefore: number[]; wAfter: number[]; wrong: boolean[]; trainErr: number }
function adaboost(pts: CP[], M: number): Round[] {
  let w = pts.map(() => 1 / pts.length);
  const F = pts.map(() => 0), out: Round[] = [];
  for (let m = 0; m < M; m++) {
    const s = bestStump(pts, w);
    const wrong = pts.map((p) => hS(s, [p.x, p.y]) !== sgn(p));
    const nw = w.map((v, i) => v * Math.exp(s.alpha * (wrong[i] ? 1 : -1)));
    const Z = nw.reduce((a, b) => a + b, 0);
    pts.forEach((p, i) => { F[i] += s.alpha * hS(s, [p.x, p.y]); });
    out.push({ stump: s, wBefore: w, wAfter: nw.map((v) => v / Z), wrong, trainErr: mean(pts.map((p, i) => ((F[i] > 0 ? 1 : -1) !== sgn(p) ? 1 : 0))) });
    w = nw.map((v) => v / Z);
  }
  return out;
}
const score = (rounds: Round[], m: number, x: number[]) => { let F = 0; for (let k = 0; k < m; k++) F += rounds[k].stump.alpha * hS(rounds[k].stump, x); return F; };
/** Field as P(repaid) via AdaBoost's logistic link 1/(1+e^(−2F)). */
const fieldOf = (rounds: Round[], m: number) => Float32Array.from(cellCentres.map((c) => 1 / (1 + Math.exp(-2 * score(rounds, m, c)))));
const errOn = (rounds: Round[], m: number, pts: CP[]) => mean(pts.map((p) => ((score(rounds, m, [p.x, p.y]) > 0 ? 1 : -1) !== sgn(p) ? 1 : 0)));
const radius = (w: number, n: number) => Math.min(24, 2.5 + 4.5 * Math.sqrt(w * n));
const AXA = { xLabel: 'feature 1: transaction amount (₹ thousand)', yLabel: 'feature 2: risk score', fx: (v: number) => `${Math.round(v * 5)}`, fy: (v: number) => `${Math.round(v * 10)}` };
const NAME = ['fraud', 'genuine']; // label 0 = fraud (pink squares), 1 = genuine (blue circles)

function StumpLine({ s, st }: { s: Parameters<typeof Field>[0]['s']; st: Stump }) {
  const hi = st.pol > 0 ? 1 : 0; // class predicted on the "> t" side
  const r1 = st.f === 0 ? { x0: st.t, x1: 10, y0: 0, y1: 10 } : { x0: 0, x1: 10, y0: st.t, y1: 10 };
  const r0 = st.f === 0 ? { x0: 0, x1: st.t, y0: 0, y1: 10 } : { x0: 0, x1: 10, y0: 0, y1: st.t };
  const R = (r: typeof r1, c: number) => <rect x={s.sx(r.x0)} y={s.sy(r.y1)} width={s.sx(r.x1) - s.sx(r.x0)} height={s.sy(r.y0) - s.sy(r.y1)} fill={CLS[c]} fillOpacity={0.16} />;
  return <>{R(r1, hi)}{R(r0, 1 - hi)}
    {st.f === 0 ? <line x1={s.sx(st.t)} x2={s.sx(st.t)} y1={s.sy(0)} y2={s.sy(10)} stroke={C.gold} strokeWidth={3} /> : <line x1={s.sx(0)} x2={s.sx(10)} y1={s.sy(st.t)} y2={s.sy(st.t)} stroke={C.gold} strokeWidth={3} />}
  </>;
}
const stumpText = (st: Stump) => `${st.f === 0 ? 'amount' : 'risk score'} > ${st.f === 0 ? `₹${Math.round(st.t * 5)}k` : (st.t * 10).toFixed(0)} → ${NAME[st.pol > 0 ? 1 : 0]}`;

/* ---------- Animate ---------- */
const N = 50;
function Animate() {
  const pts = useMemo(() => diagonal(N, 3, 0).map((p) => ({ ...p, label: 1 - p.label })), []); // high amount + high risk → fraud
  const rounds = useMemo(() => adaboost(pts, 50), [pts]);
  type F = { kind: 'data' | 'fit' | 'weigh' | 'many'; m: number };
  const frames: F[] = [{ kind: 'data', m: 0 }];
  for (let m = 1; m <= 6; m++) frames.push({ kind: 'fit', m }, { kind: 'weigh', m });
  [10, 20, 50].forEach((m) => frames.push({ kind: 'many', m }));
  const fields = useMemo(() => frames.map((f) => (f.kind === 'weigh' || f.kind === 'many' ? fieldOf(rounds, f.m) : f.kind === 'fit' && f.m > 1 ? fieldOf(rounds, f.m - 1) : null)), [rounds]); // eslint-disable-line react-hooks/exhaustive-deps
  const p = useStepPlayer(frames.length, 1600);
  const f = frames[p.i];
  const R = f.m ? rounds[f.m - 1] : null;
  const w = f.kind === 'data' ? pts.map(() => 1 / N) : f.kind === 'fit' ? R!.wBefore : R!.wAfter;
  const field = fields[p.i];
  const ensM = f.kind === 'fit' ? f.m - 1 : f.m;
  const wrongIdx = R ? R.wrong.map((b, i) => (b ? i : -1)).filter((i) => i >= 0) : [];
  const wrongShare = R ? wrongIdx.reduce((a, i) => a + R.wAfter[i], 0) : 0;
  let caption: ReactNode;
  if (f.kind === 'data') caption = <>50 card transactions: <b style={{ color: CLS[0] }}>squares are fraud</b>, <b style={{ color: CLS[1] }}>circles genuine</b>. Every row starts with the same weight 1/50 = 0.02 (all dots the same size). AdaBoost's weak learner is a <b>stump</b>: one yes/no question on one feature.</>;
  else if (f.kind === 'fit') caption = <>Round {f.m}: the best stump on the <b>current weights</b> is “{stumpText(R!.stump)}”. It misclassifies {wrongIdx.length} row{wrongIdx.length === 1 ? '' : 's'} (red rings), whose weights add up to <b>ε = {R!.stump.eps.toFixed(3)}</b>. Its say in the final vote is <b>α = ½ ln((1−ε)/ε) = {R!.stump.alpha.toFixed(2)}</b>{f.m > 1 ? <>. Notice it is drawn towards the <b>big dots</b> the last stumps got wrong.</> : '.'}</>;
  else if (f.kind === 'weigh') caption = <>Re-weight: each wrong row is multiplied by e^α = {Math.exp(R!.stump.alpha).toFixed(2)}, each right row by e^−α = {Math.exp(-R!.stump.alpha).toFixed(2)}, then all are rescaled to sum to 1. The misclassified rows now hold <b>{(wrongShare * 100).toFixed(0)}% of the weight</b> (always half). The shading is the <b>weighted vote of {f.m} stump{f.m > 1 ? 's' : ''}</b>; training error {(R!.trainErr * 100).toFixed(0)}%.</>;
  else caption = <><b>{f.m} stumps.</b> Each one alone is a single straight cut, yet their weighted vote draws a <b>staircase that hugs the true diagonal boundary</b> (green dashed). Training error {(R!.trainErr * 100).toFixed(0)}%. The dots that stay large are the hard cases right next to the boundary, which AdaBoost keeps fighting over.</>;
  return (
    <div>
      <Layout
        main={<Plot x={[0, 10]} y={[0, 10]} height={460} {...AXA}>
          {(s) => <>
            {field && <Field s={s} field={field} />}
            {f.kind === 'fit' && <StumpLine s={s} st={R!.stump} />}
            {field && ensM > 0 && <Boundary s={s} segs={boundary(field)} color={C.yellow} width={2.5} opacity={f.kind === 'fit' ? 0.45 : 1} />}
            <FnLine s={s} f={(x) => (9 - x) / 0.8} color={C.green} width={1.5} dash="6 5" />
            <ClassDots s={s} pts={pts} r={(i) => radius(w[i], N)} op={() => 0.92} ring={(i) => f.kind === 'fit' && !!R?.wrong[i]} />
          </>}
        </Plot>}
        side={<>
          <Readout items={[
            ['round', f.m || '–'],
            ['weighted error ε', R ? R.stump.eps.toFixed(3) : '–', C.red],
            ['stump say α', R ? R.stump.alpha.toFixed(2) : '–', C.gold],
            ['ensemble training error', ensM ? `${(rounds[ensM - 1].trainErr * 100).toFixed(0)}%` : '–', C.yellow],
          ]} />
          <div className="small muted">α of each stump so far (bigger = more say in the vote)</div>
          <Plot x={[0, Math.max(6.5, Math.min(f.m, 20) + 0.5)]} y={[0, 2]} width={340} height={170} xLabel="stump #" xTicks={6} yTicks={4}>
            {(s) => <Bars s={s} data={rounds.slice(0, Math.min(f.m, 20)).map((r, k) => ({ x: k + 1, y: Math.min(2, r.stump.alpha) }))} width={0.7} color={C.gold} highlight={(k) => k === f.m - 1 && f.kind !== 'many'} />}
          </Plot>
          <div className="small muted">training error of the weighted vote</div>
          <Plot x={[1, 50]} y={[0, 0.5]} width={340} height={150} xLabel="rounds" fy={(v) => `${Math.round(v * 100)}%`} xTicks={5} yTicks={3}>
            {(s) => ensM > 1 ? <FnLine s={s} f={(x) => rounds[Math.round(x) - 1].trainErr} from={1} to={ensM} n={Math.max(2, ensM - 1)} color={C.yellow} /> : <Label s={s} x={25} y={0.25} color={C.muted} size={11} anchor="middle">builds as stumps are added</Label>}
          </Plot>
          <Legend items={[['genuine', CLS[1]], ['fraud', CLS[0]], ['current stump', C.gold], ['misclassified', C.red], ['weighted vote boundary', C.yellow], ['true boundary', C.green]]} />
          <p className="small muted" style={{ margin: 0 }}>Dot size ∝ √weight.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caption}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
type DS = 'diagonal' | 'ring' | 'blocks';
const GEN: Record<DS, (n: number, s: number, noise: number) => CP[]> = { diagonal: (n, s, z) => diagonal(n, s, z), ring: (n, s, z) => ring(n, s, z), blocks: (n, s, z) => credit(n, s, z) };
function Playground() {
  const [ds, setDs] = useState<DS>('ring');
  const [M, setM] = useState(30);
  const [noise, setNoise] = useState(0.05);
  const [showW, setShowW] = useState(true);
  const pts = useMemo(() => GEN[ds](60, 4, noise), [ds, noise]);
  const fresh = useMemo(() => GEN[ds](400, 77, noise), [ds, noise]);
  const rounds = useMemo(() => adaboost(pts, 150), [pts]);
  const curves = useMemo(() => { const tr: number[] = [], te: number[] = []; for (let m = 1; m <= 150; m += 1) { tr.push(rounds[m - 1].trainErr); te.push(errOn(rounds, m, fresh)); } return { tr, te }; }, [rounds, fresh]);
  const field = useMemo(() => fieldOf(rounds, M), [rounds, M]);
  const w = rounds[M - 1].wAfter, maxW = Math.max(...w);
  return (
    <Layout
      main={<Plot x={[0, 10]} y={[0, 10]} height={460} {...AXA}>
        {(s) => <>
          <Field s={s} field={field} />
          <Boundary s={s} segs={boundary(field)} color={C.yellow} width={2.5} />
          <ClassDots s={s} pts={pts} r={(i) => (showW ? radius(w[i], pts.length) : 5)} op={() => 0.9} />
        </>}
      </Plot>}
      side={<>
        <Choice label="data" value={ds} onChange={setDs} options={[{ value: 'diagonal', label: 'Diagonal' }, { value: 'ring', label: 'Ring' }, { value: 'blocks', label: 'Blocks' }]} />
        <Slider label="rounds (stumps)" min={1} max={150} value={M} onChange={setM} />
        <Slider label="label noise" min={0} max={0.3} step={0.01} value={noise} onChange={setNoise} format={(v) => `${Math.round(v * 100)}%`} />
        <Toggle label="size dots by weight" value={showW} onChange={setShowW} />
        <Readout items={[
          ['training error', `${(curves.tr[M - 1] * 100).toFixed(1)}%`, C.yellow],
          ['fresh-data error', `${(curves.te[M - 1] * 100).toFixed(1)}%`, C.green],
          ['heaviest row holds', `${(maxW * 100).toFixed(0)}%`, C.red],
        ]} />
        <Plot x={[1, 150]} y={[0, 0.5]} width={340} height={170} xLabel="rounds" fy={(v) => `${Math.round(v * 100)}%`} xTicks={5} yTicks={3}>
          {(s) => <>
            <FnLine s={s} f={(x) => curves.tr[Math.round(x) - 1]} from={1} to={150} n={149} color={C.yellow} />
            <FnLine s={s} f={(x) => curves.te[Math.round(x) - 1]} from={1} to={150} n={149} color={C.green} />
            <Seg s={s} x1={M} x2={M} y1={0} y2={0.5} color={C.gold} width={1} dash="3 3" />
          </>}
        </Plot>
        <Legend items={[['training error', C.yellow], ['fresh-data error', C.green]]} />
        <p className="small muted" style={{ margin: 0 }}>Push label noise to 20–30%: a few mislabelled rows swell to huge weights and the boundary bends to grab them. AdaBoost's exponential loss makes it <b>sensitive to noise and outliers</b>.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'AdaBoost adds one **stump** per round. After each round, the rows it got wrong **grow** (more weight), so the next stump concentrates on them. The final model is a **weighted vote** of all stumps.', steps: [
      { do: 'Press **▶ Step** twice: fit stump 1, then re-weight.', notice: 'The red-ringed rows grow and the correct ones shrink; the wrong rows now hold exactly half the weight.' },
      { do: 'Keep stepping through rounds 2–6.', notice: 'Each new stump goes after the big dots. The α bars show that more accurate stumps get a bigger say.' },
      { do: 'Play to the end (50 stumps).', notice: 'Straight single cuts add up to a staircase that follows the diagonal boundary, and training error falls.' },
    ] },
    Playground: { what: 'Choose a dataset, the number of boosting rounds and the amount of label noise; watch the weights, the boundary and the training vs fresh error.', steps: [
      { do: 'On **Ring**, slide rounds from 1 to 150.', notice: 'Stumps can only cut straight, yet together they carve out a box around the disc.' },
      { do: 'Set **label noise** to 25%.', notice: 'Training error keeps falling while fresh-data error stalls or rises; the heaviest row can hold a big share of all weight.' },
      { do: 'Turn off **size dots by weight** and compare.', notice: 'Without sizes it is hard to see why the boundary bends; the weights are the whole story.' },
    ] },
  },
};
export default anim;
