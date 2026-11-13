// PCA: a rotating axis shows the variance captured at each angle, snaps to PC1, then the points are projected onto it.
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, FnLine, Dots, Caption, Readout, Slider, Toggle, Layout, Legend, Bars, useStepPlayer, PlayerControls, rng, gauss, C, Scales } from '../viz/kit';
import { Pt, covOf, eig2, Cov } from './_unsup-helpers';

/* ---------- pure helpers ---------- */
/** n points with a chosen correlation and SDs, centred on (mx, my). */
function correlated(n: number, rho: number, sx: number, sy: number, mx: number, my: number, seed: number): Pt[] {
  const r = rng(seed);
  return Array.from({ length: n }, () => { const a = gauss(r), b = gauss(r); return { x: mx + sx * a, y: my + sy * (rho * a + Math.sqrt(1 - rho * rho) * b) }; });
}
const varAlong = (m: Cov, th: number) => m.a * Math.cos(th) ** 2 + 2 * m.b * Math.cos(th) * Math.sin(th) + m.c * Math.sin(th) ** 2;
const proj = (p: Pt, mu: Pt, th: number) => { const t = (p.x - mu.x) * Math.cos(th) + (p.y - mu.y) * Math.sin(th); return { t, x: mu.x + t * Math.cos(th), y: mu.y + t * Math.sin(th) }; };
// Plot 600×420 has an inner area of 532×364 px: x-span = ASP × y-span keeps one unit equal on both axes, so right angles look right.
const ASP = 532 / 364;
const deg = (r: number) => ((r * 180) / Math.PI + 360) % 180;

function Axis({ s, mu, th, color, width = 2.5, dash, label }: { s: Scales; mu: Pt; th: number; color: string; width?: number; dash?: string; label?: string }) {
  const L = 30, x1 = mu.x - L * Math.cos(th), y1 = mu.y - L * Math.sin(th), x2 = mu.x + L * Math.cos(th), y2 = mu.y + L * Math.sin(th);
  const lx = mu.x + 2.6 * Math.cos(th), ly = mu.y + 2.6 * Math.sin(th);
  return <g>
    <line x1={s.sx(x1)} y1={s.sy(y1)} x2={s.sx(x2)} y2={s.sy(y2)} stroke={color} strokeWidth={width} strokeDasharray={dash} />
    {label && <text x={s.sx(lx) + 6} y={s.sy(ly) - 6} fill={color} fontSize={13} fontWeight={700}>{label}</text>}
  </g>;
}

/* ---------- Animate ---------- */
// Two survey scores (0–10): satisfaction with the product and likelihood to recommend, correlation ≈ 0.8.
const ANGLES = [0, 20, 40, 60, 80, 100, 120, 140, 160];

function Animate() {
  const raw = useMemo(() => correlated(40, 0.82, 1.5, 1.5, 6.2, 5.6, 4), []);
  const { mu, cov } = useMemo(() => covOf(raw), [raw]);
  const e = eig2(cov);
  const total = cov.a + cov.c;
  type F = { kind: 'raw' | 'centre' | 'rotate' | 'snap' | 'project' | 'pc2' | 'line'; th?: number };
  const frames: F[] = [{ kind: 'raw' }, { kind: 'centre' }, ...ANGLES.map((a) => ({ kind: 'rotate' as const, th: (a * Math.PI) / 180 })),
    { kind: 'snap', th: e.ang }, { kind: 'project', th: e.ang }, { kind: 'pc2', th: e.ang }, { kind: 'line', th: e.ang }];
  const p = useStepPlayer(frames.length, 1300);
  const f = frames[p.i];
  const centred = f.kind !== 'raw';
  const c0 = { x: 0, y: 0 };
  const pts = raw.map((q) => (centred ? { x: q.x - mu.x, y: q.y - mu.y } : q));
  const th = f.th ?? 0;
  const v = varAlong(cov, th), share = v / total;
  const pr = pts.map((q) => proj(q, c0, th));
  const shown = f.kind === 'project' || f.kind === 'pc2' || f.kind === 'line' ? pr.map((q) => ({ x: q.x, y: q.y })) : pts;
  const lineUp = f.kind === 'line';
  const seen = frames.slice(0, p.i + 1).filter((g) => g.kind === 'rotate').map((g) => deg(g.th!));
  const caption =
    f.kind === 'raw' ? <>40 customers rated <b>satisfaction</b> and <b>likelihood to recommend</b> (0–10). The scores rise together (correlation ≈ {(cov.b / Math.sqrt(cov.a * cov.c)).toFixed(2)}), so two columns carry a lot of the <b>same information</b>. Can one number replace both?</>
      : f.kind === 'centre' ? <>Step 1: <b>centre</b> the data by subtracting the means ({mu.x.toFixed(1)}, {mu.y.toFixed(1)}). The cloud slides so its middle (green ✚) sits at the origin. PCA only cares about spread around the centre.</>
        : f.kind === 'rotate' ? <>Try a candidate axis at <b>{deg(th).toFixed(0)}°</b>. Drop every point onto it (red segments) and measure the spread of the yellow shadows: variance <b>{v.toFixed(2)}</b> = <b>{(share * 100).toFixed(0)}%</b> of the total {total.toFixed(2)}. {share > 0.8 ? 'Long shadows: this direction captures most of the cloud.' : share < 0.3 ? 'Short shadows: this direction misses most of the spread.' : 'Keep rotating and watch the curve on the right.'}</>
          : f.kind === 'snap' ? <>The best direction is at <b>{deg(e.ang).toFixed(1)}°</b>: the <b>first principal component (PC1)</b>, the eigenvector of the covariance matrix with the biggest eigenvalue λ₁ = {e.l1.toFixed(2)}. It captures <b>{((e.l1 / total) * 100).toFixed(1)}%</b> of the variance. Notice the red segments are now as short as possible: maximising spread along the axis = minimising squared distance to it.</>
            : f.kind === 'project' ? <>Now <b>project</b>: every point slides along its red segment onto PC1. Each customer is described by a single number, its position along the line (the <b>PC1 score</b>). What is lost is only the small perpendicular wiggle.</>
              : f.kind === 'pc2' ? <>PC2 is perpendicular to PC1 and holds the leftover: λ₂ = {e.l2.toFixed(2)}, only <b>{((e.l2 / total) * 100).toFixed(1)}%</b> of the variance (people who like the product but would not recommend it, or vice versa). The bar chart is a mini <b>scree plot</b>.</>
                : <>Result: a one-number "advocacy score" per customer that keeps <b>{((e.l1 / total) * 100).toFixed(0)}%</b> of the information in two questions. With 50 features, the same recipe finds the few directions that matter.</>;
  const lim = 4.8;
  return (
    <div>
      <Layout
        main={<Plot x={centred ? [-lim * ASP, lim * ASP] : [6 - 5 * ASP, 6 + 5 * ASP]} y={centred ? [-lim, lim] : [0, 10]} width={600} height={420}
          xLabel={centred ? 'satisfaction (centred, points)' : 'satisfaction score (0–10)'} yLabel={centred ? 'recommend (centred, points)' : 'likelihood to recommend (0–10)'}>
          {(s) => <>
            {f.th !== undefined && !lineUp && <Axis s={s} mu={c0} th={th} color={f.kind === 'rotate' ? C.yellow : C.gold} width={f.kind === 'rotate' ? 2 : 3} label={f.kind === 'rotate' ? `${deg(th).toFixed(0)}°` : 'PC1'} />}
            {f.kind === 'pc2' && <Axis s={s} mu={c0} th={e.ang + Math.PI / 2} color={C.purple} width={2} dash="6 4" label="PC2" />}
            {(f.kind === 'rotate' || f.kind === 'snap') && pts.map((q, i) => <line key={'r' + i} x1={s.sx(q.x)} y1={s.sy(q.y)} x2={s.sx(pr[i].x)} y2={s.sy(pr[i].y)} stroke={C.red} strokeWidth={1.3} opacity={0.8} />)}
            {(f.kind === 'rotate' || f.kind === 'snap') && pr.map((q, i) => <circle key={'s' + i} cx={s.sx(q.x)} cy={s.sy(q.y)} r={3} fill={C.yellow} />)}
            {f.kind === 'project' && pts.map((q, i) => <line key={'g' + i} x1={s.sx(q.x)} y1={s.sy(q.y)} x2={s.sx(pr[i].x)} y2={s.sy(pr[i].y)} stroke={C.grey} strokeWidth={1} strokeDasharray="2 3" />)}
            {lineUp && <line x1={s.sx(-lim * ASP)} x2={s.sx(lim * ASP)} y1={s.sy(0)} y2={s.sy(0)} stroke={C.gold} strokeWidth={3} />}
            {lineUp && <text x={s.sx(lim * ASP) - 8} y={s.sy(0) - 10} fill={C.gold} fontSize={13} textAnchor="end">PC1 score (one number per customer)</text>}
            <Dots s={s} pts={lineUp ? pr.map((q) => ({ x: q.t, y: 0 })) : shown} color={f.kind === 'project' || f.kind === 'pc2' || lineUp ? C.gold : C.blue} />
            {centred && <g transform={`translate(${s.sx(0)},${s.sy(0)})`}><path d="M-8,0H8M0,-8V8" stroke={C.green} strokeWidth={3} /></g>}
            {!centred && <g transform={`translate(${s.sx(mu.x)},${s.sy(mu.y)})`}><path d="M-8,0H8M0,-8V8" stroke={C.green} strokeWidth={3} /></g>}
          </>}
        </Plot>}
        side={<>
          <Readout items={[
            ['axis angle', f.th !== undefined ? `${deg(th).toFixed(0)}°` : '–', C.yellow],
            ['variance on axis', f.th !== undefined ? v.toFixed(2) : '–', C.yellow],
            ['% captured', f.th !== undefined ? `${(share * 100).toFixed(0)}%` : '–', C.gold],
            ['total variance', total.toFixed(2)],
          ]} />
          <div className="small muted">Variance captured vs axis angle</div>
          <Plot x={[0, 180]} y={[0, 1]} width={300} height={150} xTicks={4} yTicks={2} fx={(d) => d + '°'} fy={(d) => Math.round(d * 100) + '%'}>
            {(s) => <>
              {(seen.length > 0 || f.kind !== 'raw') && f.kind !== 'centre' && <FnLine s={s} f={(d) => varAlong(cov, (d * Math.PI) / 180) / total} from={0} to={f.kind === 'rotate' ? deg(th) : 180} color={C.yellow} width={2} />}
              {f.kind !== 'rotate' && f.kind !== 'raw' && f.kind !== 'centre' && <circle cx={s.sx(deg(e.ang))} cy={s.sy(e.l1 / total)} r={5} fill={C.gold} />}
              {f.kind === 'rotate' && <circle cx={s.sx(deg(th))} cy={s.sy(share)} r={5} fill={C.yellow} />}
            </>}
          </Plot>
          {(f.kind === 'pc2' || f.kind === 'line') && <>
            <div className="small muted">Scree plot: % variance per component</div>
            <Plot x={[0.4, 2.6]} y={[0, 1]} width={300} height={120} xTicks={2} yTicks={2} fx={(d) => (d === 1 ? 'PC1' : d === 2 ? 'PC2' : '')} fy={(d) => Math.round(d * 100) + '%'} grid={false}>
              {(s) => <Bars s={s} data={[{ x: 1, y: e.l1 / total }, { x: 2, y: e.l2 / total }]} width={0.5} color={(i) => (i ? C.purple : C.gold)} />}
            </Plot>
          </>}
          <Legend items={[['customer', C.blue], ['candidate axis', C.yellow], ['distance to axis', C.red], ['PC1', C.gold], ['mean', C.green]]} />
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caption}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
function Playground() {
  const [rho, setRho] = useState(0.8);
  const [scale, setScale] = useState(1);
  const [std, setStd] = useState(false);
  const [angle, setAngle] = useState(20);
  const pts0 = useMemo(() => correlated(60, rho, 1, 1, 0, 0, 12), [rho]);
  const pts = useMemo(() => {
    const raw = pts0.map((q) => ({ x: q.x * scale, y: q.y }));
    if (!std) return raw;
    const { cov } = covOf(raw);
    return raw.map((q) => ({ x: q.x / Math.sqrt(cov.a), y: q.y / Math.sqrt(cov.c) }));
  }, [pts0, scale, std]);
  const { mu, cov } = covOf(pts);
  const e = eig2(cov), total = cov.a + cov.c;
  const th = (angle * Math.PI) / 180, v = varAlong(cov, th);
  const lim = Math.max(3.2, ...pts.map((q) => Math.max(Math.abs(q.x - mu.x) / ASP, Math.abs(q.y - mu.y)) * 1.05));
  return (
    <Layout
      main={<Plot x={[mu.x - lim * ASP, mu.x + lim * ASP]} y={[mu.y - lim, mu.y + lim]} width={600} height={420} xLabel={`feature 1${scale > 1 && !std ? ` (×${scale.toFixed(1)}, bigger units)` : ''}${std ? ' (standardised)' : ''}`} yLabel={`feature 2${std ? ' (standardised)' : ''}`}>
        {(s) => <>
          {pts.map((q, i) => { const pq = proj(q, mu, th); return <line key={'r' + i} x1={s.sx(q.x)} y1={s.sy(q.y)} x2={s.sx(pq.x)} y2={s.sy(pq.y)} stroke={C.red} strokeWidth={1} opacity={0.6} />; })}
          <Axis s={s} mu={mu} th={e.ang + Math.PI / 2} color={C.purple} width={1.5} dash="6 4" label="PC2" />
          <Axis s={s} mu={mu} th={e.ang} color={C.gold} width={2.5} dash="8 4" label="PC1" />
          <Axis s={s} mu={mu} th={th} color={C.yellow} width={2} label="your axis" />
          {pts.map((q, i) => <circle key={i} cx={s.sx(q.x)} cy={s.sy(q.y)} r={4.5} fill={C.blue} stroke={C.bg} />)}
        </>}
      </Plot>}
      side={<>
        <Slider label="your axis angle" min={0} max={179} value={angle} onChange={setAngle} format={(v) => v + '°'} />
        <Slider label="correlation" min={-0.95} max={0.95} step={0.05} value={rho} onChange={setRho} format={(v) => v.toFixed(2)} />
        <Slider label="feature 1 units ×" min={1} max={5} step={0.5} value={scale} onChange={setScale} format={(v) => v.toFixed(1)} />
        <Toggle label="standardise features first" value={std} onChange={setStd} />
        <button className="btn" onClick={() => setAngle(Math.round(deg(e.ang)) % 180)}>Snap my axis to PC1</button>
        <Readout items={[['your axis', `${((v / total) * 100).toFixed(1)}%`, C.yellow], ['PC1', `${((e.l1 / total) * 100).toFixed(1)}%`, C.gold], ['PC2', `${((e.l2 / total) * 100).toFixed(1)}%`, C.purple], ['PC1 angle', `${deg(e.ang).toFixed(0)}°`]]} />
        <p className="small muted" style={{ margin: 0 }}>No axis beats PC1. Set correlation to 0: PC1 captures only about half, so there is nothing to compress. Then raise "units ×" without standardising: PC1 swings to the big-unit feature just because of its units.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Two correlated survey scores. We **centre** them, then **rotate a candidate axis** and measure how much of the spread its shadows keep, find the best one (**PC1**) and **project** every point onto it.', steps: [
      { do: 'Step through the rotating-axis frames.', notice: 'The yellow shadows stretch and shrink, and the curve on the right traces the % of variance captured at each angle.' },
      { do: 'Stop at the **PC1** frame.', notice: 'It sits at the top of the curve, and the red distances to the line are as short as they can be.' },
      { do: 'Step to the end.', notice: 'Points slide onto PC1 and become one number each; PC2 holds only the small leftover (scree plot).' },
    ] },
    Playground: { what: 'Rotate **your own axis**, change the correlation and the units of feature 1, and compare with PC1.', steps: [
      { do: 'Drag **your axis angle** slowly and watch "your axis %".', notice: 'It peaks exactly when your axis lines up with the dashed gold PC1. Click **Snap** to check.' },
      { do: 'Set **correlation** near 0.', notice: 'PC1 drops to about 50%: when features are unrelated, PCA cannot compress them.' },
      { do: 'Raise **feature 1 units ×** to 5, then tick **standardise**.', notice: 'Without scaling, PC1 lies along feature 1 just because its numbers are bigger. Standardising restores the real relationship.' },
    ] },
  },
};
export default anim;
