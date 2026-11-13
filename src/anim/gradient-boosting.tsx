// Gradient boosting (squared error, 1-D): each small tree fits the current residuals; the ensemble curve creeps towards the data.
import { ReactNode, useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Dots, FnLine, Seg, Label, Caption, Readout, Slider, Choice, Toggle, Layout, Legend, useStepPlayer, PlayerControls, C } from '../viz/kit';
import { stores, storeTrend, growTree, predict, TNode, RP, mean } from './_ensembles-helpers';

/* ---------- pure helpers ---------- */
interface Boost { f0: number; trees: TNode[]; eta: number; trainMse: number[] }
function boost(pts: RP[], M: number, eta: number, depth: number): Boost {
  const X = pts.map((p) => [p.x]), f0 = mean(pts.map((p) => p.y));
  const F = pts.map(() => f0), trees: TNode[] = [], trainMse = [mean(pts.map((p) => (p.y - f0) ** 2))];
  for (let m = 0; m < M; m++) {
    const r = pts.map((p, i) => p.y - F[i]);
    const t = growTree(X, r, pts.map(() => 1), { maxDepth: depth, minLeaf: 4, bounds: [[0, 10]] }).root;
    trees.push(t);
    pts.forEach((p, i) => { F[i] += eta * predict(t, [p.x]); });
    trainMse.push(mean(pts.map((p, i) => (p.y - F[i]) ** 2)));
  }
  return { f0, trees, eta, trainMse };
}
const ens = (b: Boost, m: number) => (x: number) => { let v = b.f0; for (let k = 0; k < m; k++) v += b.eta * predict(b.trees[k], [x]); return v; };
const mseOn = (b: Boost, m: number, pts: RP[]) => { const f = ens(b, m); return mean(pts.map((p) => (p.y - f(p.x)) ** 2)); };
const AXG = { xLabel: 'store floor area (×1000 sq ft)', yLabel: 'monthly sales (₹ lakh)' };

/* ---------- Animate ---------- */
function Animate() {
  const [eta, setEta] = useState(0.1);
  const pts = useMemo(() => stores(40, 11), []);
  const b = useMemo(() => boost(pts, 100, eta, 2), [pts, eta]);
  const val = useMemo(() => stores(60, 77), []);
  const valMse = useMemo(() => Array.from({ length: 101 }, (_, m) => mseOn(b, m, val)), [b, val]);
  const best = valMse.reduce((bi, v, i) => (v < valMse[bi] ? i : bi), 0);
  type F = { kind: 'data' | 'resid' | 'add' | 'many'; m: number };
  const frames: F[] = [{ kind: 'data', m: 0 }];
  for (let m = 1; m <= 5; m++) frames.push({ kind: 'resid', m }, { kind: 'add', m });
  [10, 25, 50, 100].forEach((m) => frames.push({ kind: 'many', m }));
  const p = useStepPlayer(frames.length, 1600);
  const f = frames[p.i];
  const before = f.kind === 'resid' || f.kind === 'add' ? f.m - 1 : f.m; // trees in the model before this step
  const after = f.kind === 'resid' ? f.m - 1 : f.m;
  const Fb = ens(b, before), Fa = ens(b, after);
  const tree = f.m && f.kind !== 'many' && f.kind !== 'data' ? b.trees[f.m - 1] : null;
  const res = pts.map((q) => ({ x: q.x, y: q.y - Fb(q.x) }));
  const rMax = Math.max(...pts.map((q) => Math.abs(q.y - b.f0))) * 1.1;
  const leafVals = tree ? [...new Set(pts.map((q) => +predict(tree, [q.x]).toFixed(3)))] : [];
  let caption: ReactNode;
  if (f.kind === 'data') caption = <>40 stores: floor area vs monthly sales. Gradient boosting starts with the dumbest model, a flat line at the <b>average sales F₀ = {b.f0.toFixed(1)}</b>. Training MSE = {b.trainMse[0].toFixed(2)}. We also keep 60 other stores aside to check the model on data it never saw.</>;
  else if (f.kind === 'resid') caption = <>Round {f.m}: compute the <b>residuals</b> (red): actual − current prediction. The lower chart shows them alone. A small tree (depth 2, at most 4 leaves, ≥ 4 stores each) is fitted <b>to the residuals, not to sales</b>: its yellow steps are the average leftover error in each region ({leafVals.map((v) => (v > 0 ? '+' : '') + v.toFixed(1)).join(', ')}).</>;
  else if (f.kind === 'add') caption = <>Add the tree, shrunk by the <b>learning rate η = {eta}</b>: new prediction = old (dashed) + {eta} × tree. The curve moves a {eta < 0.5 ? 'small ' : ''}step towards the data. Training MSE {b.trainMse[f.m - 1].toFixed(2)} → <b>{b.trainMse[f.m].toFixed(2)}</b>.</>;
  else if (f.m < best) caption = <><b>{f.m} trees.</b> Each tree only nudged the curve, yet together they start to trace the wave in the data. Training MSE {b.trainMse[f.m].toFixed(2)}, and on 60 <b>new stores</b> (validation) {valMse[f.m].toFixed(2)}: both still falling. The residuals still show a pattern, so there is more to learn.</>;
  else if (f.m === best) caption = <><b>{f.m} trees: the sweet spot.</b> Validation MSE on new stores is at its lowest, {valMse[f.m].toFixed(2)}, close to the noise variance (≈ 1.2) that no model can beat. The curve follows the wave without chasing single stores. Training MSE is {b.trainMse[f.m].toFixed(2)}.</>;
  else caption = <><b>{f.m} trees.</b> Training MSE is {b.trainMse[f.m].toFixed(2)}, <b>below the noise variance (≈ 1.2)</b>: the curve starts bending towards individual stores, memorising noise. On new stores the error was lowest at <b>{best} trees ({valMse[best].toFixed(2)})</b> and is {valMse[f.m].toFixed(2)} now. That is why boosting needs <b>early stopping</b> (or a smaller η).</>;
  return (
    <div>
      <Choice label="learning rate η (restarts):" value={eta} onChange={(v) => { setEta(v); p.reset(); }} options={[0.1, 0.3, 1].map((v) => ({ value: v, label: String(v) }))} />
      <Layout
        main={<>
          <Plot x={[0, 10]} y={[0, 18]} height={300} {...AXG}>
            {(s) => <>
              {(f.kind === 'resid' || f.kind === 'data') && pts.map((q, i) => <Seg key={i} s={s} x1={q.x} x2={q.x} y1={q.y} y2={Fb(q.x)} color={C.red} width={1.5} />)}
              {f.kind === 'add' && <FnLine s={s} f={Fb} color={C.yellow} width={1.5} dash="5 4" n={400} />}
              <FnLine s={s} f={Fa} color={C.yellow} width={3} n={400} />
              <Dots s={s} pts={pts} r={4.5} animate={false} />
            </>}
          </Plot>
          <div className="small muted" style={{ marginTop: 6 }}>residuals the next tree must explain{tree ? ' (yellow = the tree fitted to them)' : ''}</div>
          <Plot x={[0, 10]} y={[-rMax, rMax]} height={190} xLabel="store floor area (×1000 sq ft)" yLabel="residual (₹ lakh)" yTicks={4}>
            {(s) => <>
              <Seg s={s} x1={0} x2={10} y1={0} y2={0} color={C.muted} width={1} />
              {res.map((q, i) => <Seg key={i} s={s} x1={q.x} x2={q.x} y1={0} y2={q.y} color={C.red} width={1} />)}
              <Dots s={s} pts={res} r={3.5} color={C.red} animate={false} />
              {tree && f.kind === 'resid' && <FnLine s={s} f={(x) => predict(tree, [x])} color={C.yellow} width={2.5} n={400} />}
              {tree && f.kind === 'add' && <FnLine s={s} f={(x) => eta * predict(tree, [x])} color={C.gold} width={2} dash="4 3" n={400} />}
            </>}
          </Plot>
        </>}
        side={<>
          <Readout items={[
            ['trees', after],
            ['learning rate η', eta, C.gold],
            ['training MSE', b.trainMse[after].toFixed(2), C.red],
            ['validation MSE', valMse[after].toFixed(2), C.green],
          ]} />
          <div className="small muted">MSE vs number of trees: training (red) and 60 new stores (green)</div>
          <Plot x={[0, 100]} y={[0, Math.ceil(b.trainMse[0])]} width={340} height={190} xLabel="trees" xTicks={5} yTicks={4}>
            {(s) => <>
              {after > 0 && <FnLine s={s} f={(x) => b.trainMse[Math.round(x)]} from={0} to={after} n={Math.max(2, after)} color={C.red} />}
              {after > 0 && <FnLine s={s} f={(x) => valMse[Math.round(x)]} from={0} to={after} n={Math.max(2, after)} color={C.green} />}
              <Seg s={s} x1={after} x2={after} y1={0} y2={Math.ceil(b.trainMse[0])} color={C.gold} width={1} dash="3 3" />
            </>}
          </Plot>
          <Legend items={[['stores', C.blue], ['ensemble prediction', C.yellow], ['residuals / training error', C.red], ['validation error', C.green]]} />
          <p className="small muted" style={{ margin: 0 }}>Try η = 1: the first trees take big jumps. η = 0.1 creeps; it needs more trees but each correction is cautious.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caption}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
function Playground() {
  const [eta, setEta] = useState(0.1);
  const [M, setM] = useState(40);
  const [depth, setDepth] = useState(2);
  const [truth, setTruth] = useState(true);
  const pts = useMemo(() => stores(40, 11), []);
  const val = useMemo(() => stores(60, 77), []);
  const b = useMemo(() => boost(pts, 300, eta, depth), [pts, eta, depth]);
  const valCurve = useMemo(() => { const out: number[] = []; const F = val.map(() => b.f0); out.push(mean(val.map((q, i) => (q.y - F[i]) ** 2))); b.trees.forEach((t) => { val.forEach((q, i) => { F[i] += b.eta * predict(t, [q.x]); }); out.push(mean(val.map((q, i) => (q.y - F[i]) ** 2))); }); return out; }, [b, val]);
  const best = valCurve.reduce((bi, v, i) => (v < valCurve[bi] ? i : bi), 0);
  const yMax = Math.max(3, Math.ceil(2 * valCurve[best])); // early values are clipped so the overfitting zone is visible
  return (
    <Layout
      main={<Plot x={[0, 10]} y={[0, 18]} height={440} {...AXG}>
        {(s) => <>
          {truth && <FnLine s={s} f={storeTrend} color={C.green} width={2} dash="6 4" />}
          <Dots s={s} pts={val} r={3} color={C.muted} animate={false} opacity={0.6} />
          <FnLine s={s} f={ens(b, M)} color={C.yellow} width={3} n={500} />
          <Dots s={s} pts={pts} r={4.5} animate={false} />
        </>}
      </Plot>}
      side={<>
        <Slider label="learning rate η" min={0.01} max={1} step={0.01} value={eta} onChange={setEta} />
        <Slider label="trees" min={0} max={300} value={M} onChange={setM} />
        <Slider label="tree depth" min={1} max={4} value={depth} onChange={setDepth} />
        <Toggle label="show true trend (green)" value={truth} onChange={setTruth} />
        <Readout items={[
          ['training MSE', b.trainMse[M].toFixed(2), C.red],
          ['validation MSE', valCurve[M].toFixed(2), C.green],
          ['best # trees (val.)', best, C.gold],
        ]} />
        <Plot x={[0, 300]} y={[0, yMax]} width={340} height={180} xLabel="trees" xTicks={4} yTicks={4}>
          {(s) => <>
            <FnLine s={s} f={(x) => b.trainMse[Math.round(x)]} from={0} to={300} n={300} color={C.red} />
            <FnLine s={s} f={(x) => valCurve[Math.round(x)]} from={0} to={300} n={300} color={C.green} />
            <Seg s={s} x1={M} x2={M} y1={0} y2={yMax} color={C.gold} width={1} dash="3 3" />
            <Seg s={s} x1={best} x2={best} y1={0} y2={yMax} color={C.green} width={1} dash="2 4" />
          </>}
        </Plot>
        <Legend items={[['training MSE', C.red], ['validation MSE (grey dots)', C.green]]} />
        <p className="small muted" style={{ margin: 0 }}>Set η = 1, depth 4, 300 trees: training error goes to almost zero while validation error climbs, and the curve zig-zags through single stores. Small η + more trees + early stopping is the standard recipe.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Gradient boosting builds a prediction **in instalments**: start at the average, then add small trees one at a time, each trained on the **residuals** (what is still wrong).', steps: [
      { do: 'Press **▶ Step**: first the residuals, then the tree is added.', notice: 'The tree in the lower chart is fitted to the red residuals, and the top curve moves only η × tree towards the data.' },
      { do: 'Play to 100 trees.', notice: 'The yellow curve traces the wave and the residuals shrink into a flat, patternless band.' },
      { do: 'Switch the **learning rate** to 1, then to 0.1, and replay.', notice: 'η = 1 jumps fast (and can overshoot); η = 0.1 takes many more trees to get there.' },
    ] },
    Playground: { what: 'Tune learning rate, number of trees and tree depth. Grey dots are 60 validation stores the model never trains on.', steps: [
      { do: 'Slide **trees** from 0 to 300 with the defaults.', notice: 'Training MSE (red) keeps falling; validation MSE (green) bottoms out and then slowly rises. The green dashed line marks the best number of trees.' },
      { do: 'Set **η = 1** and **depth = 4**.', notice: 'The best number of trees drops to a handful and the curve gets jagged: overfitting arrives fast.' },
      { do: 'Set **η = 0.05**.', notice: 'Now you need many more trees, but the curve is smooth and close to the green true trend.' },
    ] },
  },
};
export default anim;
