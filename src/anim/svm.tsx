// Linear SVM: the widest street between two classes; support vectors; C trades margin width against violations.
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Dots, Seg, Label, Caption, Readout, Slider, Choice, Toggle, Layout, Legend, useStepPlayer, PlayerControls, Tex, C, Scales } from '../viz/kit';
import { LP, blobs, trainSVM, linearK, lineEnds, equalH, f2 } from './_clf-helpers';

/* ---------- pure helpers ---------- */
const CL = [C.blue, C.red];
const X: [number, number] = [0, 11], Y: [number, number] = [0, 7];
const HGT = equalH(X, Y);

/** Best street for a fixed direction θ of the normal vector: kerbs touch the closest point of each class. */
function streetAt(pts: LP[], theta: number) {
  const n: [number, number] = [Math.cos(theta), Math.sin(theta)];
  const proj = pts.map((p) => n[0] * p.x + n[1] * p.y);
  const minPos = Math.min(...proj.filter((_, i) => pts[i].c === 1)), maxNeg = Math.max(...proj.filter((_, i) => pts[i].c === 0));
  const half = (minPos - maxNeg) / 2, mid = (minPos + maxNeg) / 2;
  const m = Math.max(Math.abs(half), 0.05);
  const touch = pts.map((_, i) => Math.abs(proj[i] - (pts[i].c ? minPos : maxNeg)) < 1e-9);
  return { w: [n[0] / m, n[1] / m] as [number, number], b: -mid / m, width: 2 * half, touch };
}

function Street({ s, w, b, showStreet = true }: { s: Scales; w: [number, number]; b: number; showStreet?: boolean }) {
  const lo = lineEnds(s, w, b, -1), hi = lineEnds(s, w, b, 1), mid = lineEnds(s, w, b, 0);
  if (!lo || !hi || !mid) return null;
  const d = `M${s.sx(lo[0])},${s.sy(lo[1])}L${s.sx(lo[2])},${s.sy(lo[3])}L${s.sx(hi[2])},${s.sy(hi[3])}L${s.sx(hi[0])},${s.sy(hi[1])}Z`;
  return <>
    {showStreet && <path d={d} fill={C.yellow} fillOpacity={0.09} />}
    {showStreet && <Seg s={s} x1={lo[0]} y1={lo[1]} x2={lo[2]} y2={lo[3]} color={C.yellow} width={1.3} dash="6 5" />}
    {showStreet && <Seg s={s} x1={hi[0]} y1={hi[1]} x2={hi[2]} y2={hi[3]} color={C.yellow} width={1.3} dash="6 5" />}
    <Seg s={s} x1={mid[0]} y1={mid[1]} x2={mid[2]} y2={mid[3]} color={C.yellow} width={2.8} />
  </>;
}
const Rings = ({ s, pts, on, color = C.gold }: { s: Scales; pts: LP[]; on: boolean[]; color?: string }) =>
  <>{pts.map((p, i) => on[i] && <circle key={i} cx={s.sx(p.x)} cy={s.sy(p.y)} r={10} fill="none" stroke={color} strokeWidth={2.2} />)}</>;
/** Slack: dashed segment from a violating point back to its own kerb. */
function Slack({ s, pts, w, b }: { s: Scales; pts: LP[]; w: [number, number]; b: number }) {
  const nn = w[0] * w[0] + w[1] * w[1];
  return <>{pts.map((p, i) => {
    const yv = p.c ? 1 : -1, fx = w[0] * p.x + w[1] * p.y + b;
    if (yv * fx >= 1 - 1e-6) return null;
    const t = (yv - fx) / nn; // move along w until f = y
    return <Seg key={i} s={s} x1={p.x} y1={p.y} x2={p.x + t * w[0]} y2={p.y + t * w[1]} color={C.gold} width={2} dash="3 3" />;
  })}</>;
}

/* ---------- Animate ---------- */
const BASE = blobs(24, [3.2, 2.6], [7.4, 4.8], 0.85, 1);
const EXTRA: LP[] = [{ x: 4.6, y: 3.6, c: 1 }, { x: 6.6, y: 3.3, c: 0 }];
const OFFS = [-40, -28, -16, -7, 22, 12, 5]; // degrees away from the SVM's direction, scanned in this order
const CS = [100, 3, 0.3, 0.05];

interface SVMFrame { kind: 'data' | 'scan' | 'best' | 'sv' | 'remove' | 'outlier' | 'soft'; pts: LP[]; w?: [number, number]; b?: number; width?: number; touch?: boolean[]; off?: number; C?: number; viol?: number; nsv?: number; errs?: number; scanSoFar: { x: number; y: number }[]; removed?: LP }
function svmFrames(): SVMFrame[] {
  const hard = trainSVM(BASE, linearK, 1e4);
  const th = Math.atan2(hard.w![1], hard.w![0]);
  const out: SVMFrame[] = [{ kind: 'data', pts: BASE, scanSoFar: [] }];
  const scan: { x: number; y: number }[] = [];
  for (const o of OFFS) {
    const st = streetAt(BASE, th + (o * Math.PI) / 180);
    scan.push({ x: o, y: Math.max(st.width, 0) });
    out.push({ kind: 'scan', pts: BASE, ...st, off: o, scanSoFar: [...scan].sort((a, b) => a.x - b.x) });
  }
  const best = streetAt(BASE, th);
  scan.push({ x: 0, y: best.width });
  const sorted = [...scan].sort((a, b) => a.x - b.x);
  const svm = { w: hard.w!, b: hard.b, width: 2 / Math.hypot(...hard.w!), touch: hard.sv };
  out.push({ kind: 'best', pts: BASE, ...svm, off: 0, scanSoFar: sorted });
  out.push({ kind: 'sv', pts: BASE, ...svm, nsv: hard.sv.filter(Boolean).length, scanSoFar: sorted });
  // remove the point farthest from the boundary: refit gives the same street
  let far = 0, fd = -1; BASE.forEach((p, i) => { const d = Math.abs(hard.f(p)); if (d > fd) { fd = d; far = i; } });
  const without = BASE.filter((_, i) => i !== far);
  const refit = trainSVM(without, linearK, 1e4);
  out.push({ kind: 'remove', pts: without, w: refit.w!, b: refit.b, width: 2 / Math.hypot(...refit.w!), touch: refit.sv, removed: BASE[far], scanSoFar: sorted });
  const noisy = [...BASE, ...EXTRA];
  out.push({ kind: 'outlier', pts: noisy, ...svm, touch: undefined, scanSoFar: sorted });
  for (const Cc of CS) {
    const fit = trainSVM(noisy, linearK, Cc);
    const viol = noisy.filter((p, i) => fit.y[i] * fit.f(p) < 1 - 1e-6).length;
    const errs = noisy.filter((p, i) => fit.y[i] * fit.f(p) < 0).length;
    out.push({ kind: 'soft', pts: noisy, w: fit.w!, b: fit.b, width: 2 / Math.hypot(...fit.w!), touch: fit.sv, C: Cc, viol, errs, nsv: fit.sv.filter(Boolean).length, scanSoFar: sorted });
  }
  return out;
}

function Animate() {
  const frames = useMemo(svmFrames, []);
  const p = useStepPlayer(frames.length, 1700);
  const f = frames[p.i];
  const maxW = Math.max(...frames.filter((g) => g.kind === 'best').map((g) => g.width!));
  const caption = (() => {
    switch (f.kind) {
      case 'data': return <>Two classes of loan applicants on two scaled features: <b style={{ color: C.blue }}>defaulted</b> and <b style={{ color: C.red }}>repaid</b>. Infinitely many straight lines separate them. <b>Which one should we trust?</b> The SVM's answer: the one with the <b>widest street</b> around it.</>;
      case 'scan': return f.width! > 0
        ? <>Try a line tilted <b>{f.off! > 0 ? '+' : ''}{f.off}°</b> from the eventual answer, and widen its street (shaded) until it touches the nearest point of each class. Street width: <b>{f.width!.toFixed(2)}</b>. The chart on the right records every tilt we try.</>
        : <>At a tilt of <b>{f.off}°</b> no street fits at all: the classes overlap along this direction (width {f.width!.toFixed(2)} &lt; 0). Tilting too far makes things worse.</>;
      case 'best': return <>This tilt gives the <b>widest possible street: {f.width!.toFixed(2)}</b> units, the peak of the curve on the right. This is the <b>maximum-margin line</b> an SVM finds, by solving one convex optimisation instead of trying tilts by hand.</>;
      case 'sv': return <>Only the <b>{f.nsv} gold-ringed points</b> touch the kerbs. These are the <b>support vectors</b>: they alone hold the street in place. In the maths, the street width equals 2 / ‖w‖ = <b>{f.width!.toFixed(2)}</b>, so maximising the width means making w small.</>;
      case 'remove': return <>Delete the point farthest from the street (faded cross) and retrain: the street does not move at all (width still <b>{f.width!.toFixed(2)}</b>). <b>Points away from the street have no influence</b>, unlike in logistic regression where every point pulls a little.</>;
      case 'outlier': return <>Real data is messier. Add one repaid applicant deep in default territory and one defaulter near the repaid group. <b>No street can now be empty</b>; a hard-margin SVM has no solution. We must allow some points inside the street, at a price set by <b>C</b>.</>;
      default: return f.C! >= 50
        ? <><b>C = {f.C}</b>: violations are very expensive. The street shrinks to width <b>{f.width!.toFixed(2)}</b> to keep as many points as possible outside it. Gold dashes show each violator's distance back to its own kerb (the "slack"). {f.viol} points violate, {f.errs} are misclassified.</>
        : f.C! >= 1
          ? <><b>C = {f.C}</b>: cheaper violations. The street widens to <b>{f.width!.toFixed(2)}</b> and accepts {f.viol} points inside it. {f.nsv} support vectors now share the job of holding it.</>
          : <><b>C = {f.C}</b>: violations are cheap, so the street becomes <b>wide ({f.width!.toFixed(2)})</b> and calm, with {f.viol} points inside and {f.nsv} support vectors. <b>Small C = wide, tolerant street (more bias); large C = narrow, fussy street (more variance).</b> Pick C by cross-validation.</>;
    }
  })();
  return (
    <div>
      <Layout
        main={<Plot x={X} y={Y} height={HGT} xLabel="feature 1 (scaled)" yLabel="feature 2 (scaled)">
          {(s) => <>
            {f.w && <Street s={s} w={f.w} b={f.b!} />}
            {f.kind === 'soft' && <Slack s={s} pts={f.pts} w={f.w!} b={f.b!} />}
            <Dots s={s} pts={f.pts} color={(i) => CL[f.pts[i].c]} r={6} animate={false} />
            {f.kind === 'outlier' && EXTRA.map((q, i) => <circle key={i} cx={s.sx(q.x)} cy={s.sy(q.y)} r={11} fill="none" stroke={C.gold} strokeWidth={2} strokeDasharray="3 3" />)}
            {f.touch && f.kind !== 'scan' && f.kind !== 'best' && <Rings s={s} pts={f.pts} on={f.touch} />}
            {f.touch && (f.kind === 'scan' || f.kind === 'best') && <Rings s={s} pts={f.pts} on={f.touch} color={C.muted} />}
            {f.removed && <><Label s={s} x={f.removed.x} y={f.removed.y - 0.12} anchor="middle" size={20} color={C.muted}>×</Label><Label s={s} x={f.removed.x + 0.25} y={f.removed.y + 0.25} size={12} color={C.muted}>deleted</Label></>}
          </>}
        </Plot>}
        side={<>
          <div className="small muted">Street width for each tilt tried</div>
          <Plot x={[-45, 28]} y={[0, maxW * 1.25]} width={320} height={190} xLabel="tilt from best (degrees)" xTicks={5} yTicks={4}>
            {(s) => <>
              {f.scanSoFar.map((q, i) => i > 0 && <Seg key={i} s={s} x1={f.scanSoFar[i - 1].x} y1={f.scanSoFar[i - 1].y} x2={q.x} y2={q.y} color={C.yellow} width={2} />)}
              <Dots s={s} pts={f.scanSoFar} r={4.5} color={(i) => (f.scanSoFar[i].x === (f.off ?? 99) ? C.gold : C.yellow)} animate={false} />
            </>}
          </Plot>
          <Readout items={[
            ['street width', f.width !== undefined ? f2(Math.max(f.width, 0)) : '–', C.yellow],
            ['support vectors', f.touch && f.kind !== 'scan' ? f.touch.filter(Boolean).length : '–', C.gold],
            ['C', f.C ?? (f.kind === 'scan' || f.kind === 'data' ? '–' : '∞ (hard)')],
            ['violations', f.viol ?? (f.kind === 'outlier' ? '?' : 0), C.gold],
          ]} />
          <Tex block>{'\\min_{w,b}\\ \\tfrac12\\lVert w\\rVert^2 + C\\sum_i \\max(0,\\,1-y_i f(x_i))'}</Tex>
          <Legend items={[['defaulted', C.blue], ['repaid', C.red], ['boundary & street', C.yellow], ['support vector / slack', C.gold]]} />
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caption}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
const START = [...blobs(30, [3.6, 2.8], [6.8, 4.4], 1.05, 4)];

function Playground() {
  const [pts, setPts] = useState<LP[]>(START);
  const [logC, setLogC] = useState(0);
  const [cls, setCls] = useState<0 | 1>(1);
  const [street, setStreet] = useState(true);
  const Cc = 10 ** logC;
  const both = pts.some((q) => q.c === 0) && pts.some((q) => q.c === 1);
  const fit = useMemo(() => (both ? trainSVM(pts, linearK, Cc) : null), [pts, Cc, both]);
  const viol = fit ? pts.filter((q, i) => fit.y[i] * fit.f(q) < 1 - 1e-6).length : 0;
  const acc = fit ? pts.filter((q, i) => fit.y[i] * fit.f(q) > 0).length / pts.length : 0;
  const width = fit && fit.w ? 2 / Math.max(Math.hypot(...fit.w), 1e-9) : 0;
  return (
    <Layout
      main={<Plot x={X} y={Y} height={HGT} xLabel="feature 1 (scaled)  ·  click to add a point" yLabel="feature 2 (scaled)" onClick={(q) => setPts([...pts, { x: q.x, y: q.y, c: cls }])}>
        {(s) => <>
          {fit && fit.w && <Street s={s} w={fit.w} b={fit.b} showStreet={street} />}
          {fit && fit.w && street && <Slack s={s} pts={pts} w={fit.w} b={fit.b} />}
          <Dots s={s} pts={pts} color={(i) => CL[pts[i].c]} r={6} animate={false} />
          {fit && <Rings s={s} pts={pts} on={fit.sv} />}
        </>}
      </Plot>}
      side={<>
        <Slider label="C (cost of a violation)" min={-2} max={3} step={0.25} value={logC} onChange={setLogC} format={(v) => (10 ** v >= 10 ? (10 ** v).toFixed(0) : (10 ** v).toFixed(2))} />
        <Choice label="Click adds" value={cls} onChange={setCls} options={[{ value: 0, label: 'defaulted (blue)' }, { value: 1, label: 'repaid (red)' }]} />
        <Toggle label="show street and slack" value={street} onChange={setStreet} />
        <Readout items={[
          ['street width', fit ? width.toFixed(2) : '–', C.yellow], ['support vectors', fit ? fit.sv.filter(Boolean).length : '–', C.gold],
          ['inside street', viol, C.gold], ['train accuracy', fit ? `${(acc * 100).toFixed(0)}%` : '–'],
        ]} />
        <div className="row" style={{ gap: 8 }}>
          <button className="btn" onClick={() => setPts(pts.slice(0, -1))} disabled={pts.length <= 2}>↶ Undo point</button>
          <button className="btn" onClick={() => setPts(START)}>Reset data</button>
        </div>
        <Legend items={[['defaulted', C.blue], ['repaid', C.red], ['support vectors', C.gold]]} />
        <p className="small muted" style={{ margin: 0 }}>Click far from the street: nothing changes. Click inside the street or on the wrong side: the street reacts, and how much depends on C.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'An SVM looks for the line with the **widest empty street** between two classes. We try several tilts, find the widest, meet the **support vectors**, then let C decide how many points may sit inside the street.', steps: [
      { do: 'Step through the first eight frames.', notice: 'Each tilt gets its widest possible street; the small chart traces street width against tilt and peaks at the SVM\'s line.' },
      { do: 'Stop at the gold rings, then step once more.', notice: 'Only the ringed **support vectors** touch the kerbs. Deleting a far-away point leaves the street exactly where it was.' },
      { do: 'Play the last four frames (C = 100 → 0.05).', notice: 'As C falls, the street widens and more points sit inside it (gold slack dashes): margin width traded for violations.' },
    ] },
    Playground: { what: 'Overlapping classes, a live linear SVM and a **C** slider. Click on the chart to add points of the chosen class.', steps: [
      { do: 'Drag **C** from the far left to the far right.', notice: 'Small C: wide street, many support vectors. Large C: narrow street that bends to avoid violations.' },
      { do: 'Add a few **repaid** points far in the top-right corner.', notice: 'Nothing moves. Points outside the street are not support vectors and have no say.' },
      { do: 'Now add one **repaid** point deep among the defaulters, with C large.', notice: 'A single outlier can swing a large-C street. With small C the street mostly ignores it: C is also robustness to noise.' },
    ] },
  },
};
export default anim;
