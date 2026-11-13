// Kernel SVM: lift ring data with z = x² + y² so a flat plane separates it; then the RBF kernel and its gamma.
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Dots, Seg, Label, Caption, Readout, Slider, Choice, Layout, Legend, useStepPlayer, PlayerControls, Tex, C, Scales } from '../viz/kit';
import { LP, rings, moons, xorPts, trainSVM, linearK, polyK, rbfK, sigmoid, DecisionHeat, lineEnds, SVMFit } from './_clf-helpers';

/* ---------- pure helpers ---------- */
const CL = [C.blue, C.red];
const R2 = 3.4;
const DATA = rings(60, 0.2, 3);
const z2 = (p: { x: number; y: number }) => p.x * p.x + p.y * p.y;

function circlePath(s: Scales, r: number) {
  return Array.from({ length: 121 }, (_, i) => { const a = (i / 120) * 2 * Math.PI; return `${i ? 'L' : 'M'}${s.sx(r * Math.cos(a))},${s.sy(r * Math.sin(a))}`; }).join('') + 'Z';
}
const Rings = ({ s, pts, on }: { s: Scales; pts: LP[]; on: boolean[] }) =>
  <>{pts.map((p, i) => on[i] && <circle key={i} cx={s.sx(p.x)} cy={s.sy(p.y)} r={8.5} fill="none" stroke={C.gold} strokeWidth={1.8} />)}</>;
const acc = (f: SVMFit, pts: LP[]) => pts.filter((p) => (f.f(p) > 0 ? 1 : 0) === p.c).length / pts.length;

/* ---------- Animate ---------- */
type KF = { kind: 'data' | 'linear' | 'lift' | 'plane' | 'back' | 'trick' | 'rbf'; t?: number; gamma?: number };
const GAMMAS = [0.05, 0.5, 5, 50];

function Animate() {
  const fits = useMemo(() => ({
    lin: trainSVM(DATA, linearK, 1),
    poly: trainSVM(DATA, polyK(2), 1),
    rbf: GAMMAS.map((g) => trainSVM(DATA, rbfK(g), 1)),
    test: rings(200, 0.2, 99),
  }), []);
  const zIn = Math.max(...DATA.filter((p) => p.c).map(z2)), zOut = Math.min(...DATA.filter((p) => !p.c).map(z2));
  const cut = (zIn + zOut) / 2;
  const frames: KF[] = [{ kind: 'data' }, { kind: 'linear' }, ...[0, 0.25, 0.5, 0.75, 1].map((t) => ({ kind: 'lift' as const, t })), { kind: 'plane' }, { kind: 'back' }, { kind: 'trick' }, ...GAMMAS.map((g) => ({ kind: 'rbf' as const, gamma: g }))];
  const p = useStepPlayer(frames.length, 1700);
  const f = frames[p.i];
  const t = f.kind === 'lift' ? f.t! : f.kind === 'data' || f.kind === 'linear' ? -1 : 1;
  const gi = f.gamma !== undefined ? GAMMAS.indexOf(f.gamma) : -1;
  const fit = f.kind === 'linear' ? fits.lin : f.kind === 'trick' ? fits.poly : gi >= 0 ? fits.rbf[gi] : null;
  const trainAcc = fit ? acc(fit, DATA) : f.kind === 'back' || f.kind === 'plane' ? 1 : undefined;
  const testAcc = fit ? acc(fit, fits.test) : f.kind === 'back' || f.kind === 'plane' ? fits.test.filter((q) => (z2(q) < cut ? 1 : 0) === q.c).length / fits.test.length : undefined;
  const caption = (() => {
    switch (f.kind) {
      case 'data': return <>Parts from a machine: the <b style={{ color: C.red }}>good parts</b> sit near the target (centre), <b style={{ color: C.blue }}>faulty parts</b> form a ring around them. Try to imagine one straight line that separates red from blue. <b>There isn't one.</b></>;
      case 'linear': return <>A linear SVM does its best anyway: train accuracy only <b>{(trainAcc! * 100).toFixed(0)}%</b>, barely better than guessing. The problem is not the SVM, it is that the boundary we need is a <b>circle</b>.</>;
      case 'lift': return t === 0
        ? <>The idea: add a third feature, <b>z = x² + y²</b> (squared distance from the centre). The right panel is a <b>side view</b>: horizontal is x, vertical is z. Right now every point still sits at z = 0, so red and blue overlap completely.</>
        : t < 1 ? <>Lifting… each point rises to {(t * 100).toFixed(0)}% of its height z = x² + y². <b>Outer (blue) points rise much higher</b> than inner (red) ones, because they are farther from the centre.</>
          : <>Fully lifted. In the side view, the red points are all low (z ≤ {zIn.toFixed(1)}) and the blue ones all high (z ≥ {zOut.toFixed(1)}). <b>The classes have come apart vertically.</b></>;
      case 'plane': return <>Now a <b>flat plane</b> works: z = {cut.toFixed(2)} (yellow line in the side view) puts every red point below and every blue point above. In 3-D, the data is <b>linearly separable</b>.</>;
      case 'back': return <>Drop the plane back to the original picture: z = {cut.toFixed(2)} means x² + y² = {cut.toFixed(2)}, a <b>circle of radius {Math.sqrt(cut).toFixed(2)}</b>. A straight cut in the lifted space is a curved boundary in the original space. Training accuracy <b>100%</b>.</>;
      case 'trick': return <>The <b>kernel trick</b>: the SVM only ever needs dot products between points, and K(a, b) = (a·b + 1)² equals the dot product after a lift that includes x², y² and xy. So the SVM gets the curved boundary <b>without ever building the new features</b>. Shaded: the trained degree-2 kernel SVM; gold rings: {fit!.sv.filter(Boolean).length} support vectors.</>;
      default: return f.gamma! <= 0.05
        ? <>The most popular kernel is <b>RBF</b>: K(a, b) = exp(−γ‖a − b‖²), a similarity that fades with distance. With a tiny <b>γ = {f.gamma}</b> each support vector's influence reaches far, so the boundary is very smooth (train {(trainAcc! * 100).toFixed(0)}%, new data {(testAcc! * 100).toFixed(0)}%).</>
        : f.gamma! <= 0.5 ? <><b>γ = {f.gamma}</b>: influence reaches a moderate distance and the boundary is a clean, roundish curve. Train {(trainAcc! * 100).toFixed(0)}%, <b>new data {(testAcc! * 100).toFixed(0)}%</b>. This is the sweet spot.</>
          : f.gamma! <= 5 ? <><b>γ = {f.gamma}</b>: each point's influence is now local and the boundary starts to wiggle around individual points. Train {(trainAcc! * 100).toFixed(0)}%, new data {(testAcc! * 100).toFixed(0)}%.</>
            : <><b>γ = {f.gamma}</b>: influence is so local that the SVM draws <b>tiny islands around each training point</b> ({fit!.sv.filter(Boolean).length} of {DATA.length} are support vectors). (rings hidden so you can see the islands). Train {(trainAcc! * 100).toFixed(0)}% but new data only <b>{(testAcc! * 100).toFixed(0)}%</b>: classic <b>overfitting</b>. Tune γ and C together by cross-validation.</>;
    }
  })();
  const lifted = DATA.map((q) => ({ x: q.x, y: Math.max(t, 0) * z2(q) }));
  return (
    <div>
      <Layout
        main={<div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 10 }}>
          <div>
            <div className="small muted">Original data (x, y)</div>
            <Plot x={[-R2, R2]} y={[-R2, R2]} width={400} height={400} xLabel="x (mm from target)" yLabel="y (mm from target)" xTicks={6} yTicks={6}>
              {(s) => <>
                {fit && <DecisionHeat s={s} nx={84} ny={84} strength={0.5} c0={C.blue} c1={C.red} score={(x, y) => sigmoid(6 * fit.f({ x, y }))} />}
                {fit && fit === fits.lin && fit.w && (() => { const e = lineEnds(s, fit.w, fit.b); return e && <Seg s={s} x1={e[0]} y1={e[1]} x2={e[2]} y2={e[3]} color={C.yellow} width={2.5} />; })()}
                {(f.kind === 'back') && <path d={circlePath(s, Math.sqrt(cut))} fill={C.red} fillOpacity={0.12} stroke={C.yellow} strokeWidth={2.8} />}
                <Dots s={s} pts={DATA} color={(i) => CL[DATA[i].c]} r={f.gamma && f.gamma >= 5 ? 3.5 : 5} animate={false} />
                {fit && fit !== fits.lin && !(f.gamma && f.gamma >= 5) && <Rings s={s} pts={DATA} on={fit.sv} />}
              </>}
            </Plot>
          </div>
          <div style={{ opacity: t < 0 ? 0.35 : 1, transition: 'opacity .4s' }}>
            <div className="small muted">Side view after lifting: (x, z = x² + y²)</div>
            <Plot x={[-R2, R2]} y={[0, 8.5]} width={400} height={400} xLabel="x (mm from target)" yLabel="z = x² + y²" xTicks={6} yTicks={6}>
              {(s) => <>
                {(f.kind === 'plane' || f.kind === 'back' || f.kind === 'trick' || f.kind === 'rbf') && <>
                  <rect x={s.sx(-R2)} y={s.sy(cut)} width={s.sx(R2) - s.sx(-R2)} height={s.sy(0) - s.sy(cut)} fill={C.red} fillOpacity={0.1} />
                  <Seg s={s} x1={-R2} x2={R2} y1={cut} y2={cut} color={C.yellow} width={2.8} />
                  <Label s={s} x={R2 - 0.1} y={cut + 0.25} anchor="end" color={C.yellow} size={12}>flat plane z = {cut.toFixed(2)}</Label>
                </>}
                <path d={Array.from({ length: 81 }, (_, i) => { const x = -R2 + (2 * R2 * i) / 80; return `${i ? 'L' : 'M'}${s.sx(x)},${s.sy(Math.max(t, 0) * x * x)}`; }).join('')} fill="none" stroke={C.grey} strokeDasharray="4 4" />
                <Dots s={s} pts={lifted} color={(i) => CL[DATA[i].c]} r={5} />
              </>}
            </Plot>
          </div>
        </div>}
        side={<>
          <Readout items={[
            ['train accuracy', trainAcc !== undefined ? `${(trainAcc * 100).toFixed(0)}%` : '–'],
            ['new-data accuracy', testAcc !== undefined ? `${(testAcc * 100).toFixed(0)}%` : '–', C.green],
            ['kernel', f.kind === 'linear' ? 'linear' : f.kind === 'trick' ? 'poly, degree 2' : gi >= 0 ? 'RBF' : f.kind === 'data' ? '–' : 'explicit lift'],
            ['γ (gamma)', f.gamma ?? '–', C.gold],
            ['support vectors', fit && fit !== fits.lin ? fit.sv.filter(Boolean).length : '–', C.gold],
          ]} />
          {gi >= 0 ? <Tex block>{'K(a,b)=e^{-\\gamma\\lVert a-b\\rVert^2}'}</Tex> : f.kind === 'trick' ? <Tex block>{'K(a,b)=(a\\cdot b+1)^2'}</Tex> : <Tex block>{'\\phi(x,y)=(x,\\;y,\\;x^2+y^2)'}</Tex>}
          <Legend items={[['faulty (ring)', C.blue], ['good (centre)', C.red], ['boundary / plane', C.yellow], ['support vector', C.gold]]} />
          <p className="small muted" style={{ margin: 0 }}>The dashed grey bowl in the side view is z = x² (the height of a point lying on the x-axis). Points off the axis rise even higher.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caption}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
type DS = 'rings' | 'moons' | 'xor';
type KN = 'linear' | 'poly' | 'rbf';
const GEN: Record<DS, (n: number, seed: number) => LP[]> = {
  rings: (n, s) => rings(n, 0.25, s), moons: (n, s) => moons(n, 0.28, s), xor: (n, s) => xorPts(n, 0.55, s),
};

function Playground() {
  const [ds, setDs] = useState<DS>('moons');
  const [kn, setKn] = useState<KN>('rbf');
  const [lg, setLg] = useState(0);
  const [lc, setLc] = useState(0);
  const gamma = 10 ** lg, Cc = 10 ** lc;
  const train = useMemo(() => GEN[ds](80, 5), [ds]);
  const test = useMemo(() => GEN[ds](300, 77), [ds]);
  const fit = useMemo(() => trainSVM(train, kn === 'linear' ? linearK : kn === 'poly' ? polyK(2) : rbfK(gamma), Cc, 1e-3, 20000), [train, kn, gamma, Cc]);
  const tr = acc(fit, train), te = acc(fit, test);
  return (
    <Layout
      main={<Plot x={[-R2, R2]} y={[-R2, R2]} height={560} xLabel="feature 1" yLabel="feature 2">
        {(s) => <>
          <DecisionHeat s={s} nx={56} ny={44} c0={C.blue} c1={C.red} score={(x, y) => sigmoid(3 * fit.f({ x, y }))} />
          <Dots s={s} pts={train} color={(i) => CL[train[i].c]} r={5} animate={false} />
          <Rings s={s} pts={train} on={fit.sv} />
        </>}
      </Plot>}
      side={<>
        <Choice label="Data" value={ds} onChange={setDs} options={[{ value: 'rings', label: 'Rings' }, { value: 'moons', label: 'Moons' }, { value: 'xor', label: 'XOR' }]} />
        <Choice label="Kernel" value={kn} onChange={setKn} options={[{ value: 'linear', label: 'Linear' }, { value: 'poly', label: 'Poly 2' }, { value: 'rbf', label: 'RBF' }]} />
        <Slider label="γ (RBF reach⁻¹)" min={-2} max={2.5} step={0.25} value={lg} onChange={setLg} format={(v) => (10 ** v).toFixed(10 ** v < 1 ? 2 : 0)} />
        <Slider label="C (violation cost)" min={-1} max={3} step={0.25} value={lc} onChange={setLc} format={(v) => (10 ** v).toFixed(10 ** v < 1 ? 2 : 0)} />
        <Readout items={[
          ['train accuracy', `${(tr * 100).toFixed(0)}%`], ['new-data accuracy', `${(te * 100).toFixed(0)}%`, te < tr - 0.08 ? C.red : C.green],
          ['support vectors', `${fit.sv.filter(Boolean).length} / ${train.length}`, C.gold], ['gap', `${((tr - te) * 100).toFixed(0)} pts`, tr - te > 0.08 ? C.red : C.muted],
        ]} />
        <Legend items={[['class A', C.blue], ['class B', C.red], ['support vector', C.gold]]} />
        <p className="small muted" style={{ margin: 0 }}>"New-data accuracy" scores the boundary on 300 fresh points from the same shape. γ only affects the RBF kernel.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Ring-shaped data cannot be split by a line. We **lift** each point to a third coordinate z = x² + y², where a **flat plane** separates the classes, then see how kernels (including RBF and its **γ**) do this implicitly.', steps: [
      { do: 'Step through frames 3 to 7 and watch the right-hand side view.', notice: 'Outer blue points rise far higher than the inner red ones, so the classes come apart vertically.' },
      { do: 'Step to the "flat plane" and the next frame.', notice: 'A horizontal cut in the side view becomes a **circle** in the original picture: linear in the lifted space, curved in the original.' },
      { do: 'Play the last four frames (γ = 0.05 → 50).', notice: 'Small γ: smooth boundary. Large γ: islands around each point, perfect training accuracy but worse on new data.' },
    ] },
    Playground: { what: 'Train a kernel SVM on rings, moons or XOR. Change the kernel, **γ** and **C**, and compare training accuracy with accuracy on fresh data.', steps: [
      { do: 'On **Moons**, switch between Linear, Poly 2 and RBF.', notice: 'Linear cannot bend; RBF follows the moons\' curves.' },
      { do: 'With RBF, drag **γ** all the way right.', notice: 'Training accuracy hits 100% while new-data accuracy drops and almost every point becomes a support vector: overfitting.' },
      { do: 'Set a large γ, then lower **C**.', notice: 'Lower C smooths the boundary a little, but γ dominates. Real tuning searches γ and C together.' },
    ] },
  },
};
export default anim;
