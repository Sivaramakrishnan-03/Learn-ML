// Correlation: how r is built from deviation products, how a cloud's shape changes r, "same r, different picture", and a confounder.
import { ReactNode, useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Dots, FnLine, Seg, Label, Region, Caption, Readout, Slider, Toggle, Layout, Legend, useStepPlayer, PlayerControls, rng, gauss, C } from '../viz/kit';
import { mean, corr, spearman, olsLine, sum, sd } from '../viz/math';

/* ---------- pure helpers ---------- */
type Pt = { x: number; y: number };
const AD_X = [1, 2, 3, 4, 5], AD_Y = [10, 14, 13, 18, 20]; // g-stats2: ad spend vs sales (₹ lakh)
const rOf = (p: Pt[]) => corr(p.map((q) => q.x), p.map((q) => q.y));
/** Standardised z-scores of a vector. */
function zs(a: number[]) { const m = mean(a), s = sd(a) || 1; return a.map((v) => (v - m) / s); }
/** Two orthonormal noise vectors (sample correlation exactly 0), so any target r can be hit exactly. */
function baseNoise(n: number, seed: number) {
  const r = rng(seed); const a = zs(Array.from({ length: n }, () => gauss(r))); let b = Array.from({ length: n }, () => gauss(r));
  const proj = sum(a.map((v, i) => v * b[i])) / n; b = zs(b.map((v, i) => v - proj * a[i])); return [a, b];
}
/** A cloud with sample correlation exactly `r` (n ≥ 3). */
function cloud(n: number, r: number, seed: number, cx = 50, cy = 50, sx = 15, sy = 15): Pt[] {
  const [a, b] = baseNoise(n, seed), k = Math.sqrt(Math.max(0, 1 - r * r));
  return a.map((v, i) => ({ x: cx + sx * v, y: cy + sy * (r * v + k * b[i]) }));
}
/** Bisection on a parameter so the shape has correlation `target` (assumes r is monotone in t). */
function tune(make: (t: number) => Pt[], target: number, lo: number, hi: number) {
  const dir = rOf(make(lo)) > rOf(make(hi)) ? 1 : -1;
  for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if ((rOf(make(m)) - target) * dir > 0) lo = m; else hi = m; }
  return make((lo + hi) / 2);
}
/** Affine rescale of y into [1, 15] (does not change r). */
function fitY(p: Pt[]) { const ys = p.map((q) => q.y), lo = Math.min(...ys), hi = Math.max(...ys); return p.map((q) => ({ x: q.x, y: 1.5 + ((q.y - lo) / (hi - lo || 1)) * 13 })); }
/** Four 12-point datasets, all with r = 0.80, that look nothing alike. */
function quartet(target = 0.8) {
  const xs = Array.from({ length: 12 }, (_, i) => 2 + i);
  const [e] = baseNoise(12, 5); const ex = zs(xs); const pr = sum(e.map((v, i) => v * ex[i])) / 12; const noise = zs(e.map((v, i) => v - pr * ex[i]));
  const line = tune((k) => xs.map((x, i) => ({ x, y: 3 + 0.7 * x + k * noise[i] })), target, 0, 20);
  const curve = tune((t) => xs.map((x) => ({ x, y: 2 + 1.6 * x - t * x * x })), target, 0, 0.1);
  const outlier = tune((d) => xs.map((x, i) => ({ x, y: 3 + 0.5 * x + (i === 9 ? -d : 0) })), target, 0, 40);
  const spread = [-1.6, -1.2, -0.8, -0.4, 0, 0.4, 0.8, 1.2, 1.6, -0.2, 0.2];
  const lever = tune((Y) => [...spread.map((v) => ({ x: 4.5, y: 6 + 2 * v })), { x: 14.5, y: Y }], target, 6.01, 80);
  return [line, curve, outlier, lever].map(fitY).map((p) => [...p].sort((a, b) => a.x - b.x));
}
/** Three years of monthly data in three seasons: temperature drives both ice-cream sales and drownings. */
function confounded(seed = 21) {
  const r = rng(seed), base = [20, 26, 32, 26]; // cool, mild, hot, mild (3-month seasons)
  return Array.from({ length: 36 }, (_, m) => {
    const T = base[Math.floor((m % 12) / 3)] + 1.2 * gauss(r);
    return { T, ice: 10 + 2.2 * T + 5 * gauss(r), drown: Math.max(0, 0.6 * T - 8 + 1.6 * gauss(r)) };
  });
}
const residuals = (y: number[], x: number[]) => { const { a, b } = olsLine(x, y); return y.map((v, i) => v - a - b * x[i]); };

/* ---------- Animate ---------- */
type Stage = 'ad' | 'means' | 'rects' | 'r' | 'm1' | 'm2' | 'm3' | 'm4' | 'q1' | 'q2' | 'q3' | 'q4' | 'c1' | 'c2' | 'c3';
const STAGES: Stage[] = ['ad', 'means', 'rects', 'r', 'm1', 'm2', 'm3', 'm4', 'q1', 'q2', 'q3', 'q4', 'c1', 'c2', 'c3'];
const MORPH: Record<string, number> = { m1: 0.95, m2: 0.6, m3: 0, m4: -0.7 };
const SEASON = [C.blue, C.teal, C.gold];

function Animate() {
  const p = useStepPlayer(STAGES.length, 1900);
  const st = STAGES[p.i];
  const quad = useMemo(() => quartet(0.8), []);
  const conf = useMemo(() => confounded(), []);
  const adPts = AD_X.map((x, i) => ({ x, y: AD_Y[i] }));
  const adR = rOf(adPts), adFit = olsLine(AD_X, AD_Y);
  const part = st in MORPH ? 'morph' : /^q\d$/.test(st) ? 'quartet' : /^c\d$/.test(st) ? 'conf' : 'ad';

  let pts: Pt[] = adPts, x: [number, number] = [0, 6], y: [number, number] = [6, 24], xl = 'ad spend (₹ lakh)', yl = 'sales (₹ lakh)';
  let colorFn: (i: number) => string = () => C.blue, r = adR, fit: { a: number; b: number } | null = null;
  if (part === 'morph') { pts = cloud(60, MORPH[st], 3, 8, 8, 2.2, 2.2); x = [0, 16]; y = [0, 16]; xl = 'x'; yl = 'y'; r = MORPH[st]; fit = olsLine(pts.map((q) => q.x), pts.map((q) => q.y)); }
  if (part === 'quartet') { const k = +st[1] - 1; pts = quad[k]; x = [0, 16]; y = [0, 16]; xl = 'x'; yl = 'y'; r = rOf(pts); fit = olsLine(pts.map((q) => q.x), pts.map((q) => q.y)); }
  const T = conf.map((c) => c.T), ice = conf.map((c) => c.ice), drown = conf.map((c) => c.drown);
  const band = (t: number) => (t < 23 ? 0 : t < 29 ? 1 : 2);
  const confR = corr(ice, drown), partialR = corr(residuals(ice, T), residuals(drown, T));
  const bandR = [0, 1, 2].map((b) => { const idx = conf.map((c, i) => (band(c.T) === b ? i : -1)).filter((i) => i >= 0); return idx.length > 2 ? corr(idx.map((i) => ice[i]), idx.map((i) => drown[i])) : 0; });
  if (part === 'conf') {
    pts = conf.map((c) => ({ x: c.ice, y: c.drown })); x = [35, 105];
    if (st === 'c3') { const ri = residuals(ice, T), rd = residuals(drown, T), mi = mean(ice), md = mean(drown); pts = conf.map((_, i) => ({ x: mi + ri[i], y: md + rd[i] })); fit = olsLine(pts.map((q) => q.x), pts.map((q) => q.y)); } y = [-1, 22]; xl = 'ice-cream sales (₹ thousand / month)'; yl = 'drownings per month'; r = confR;
    if (st !== 'c1') colorFn = (i) => SEASON[band(conf[i].T)];
    if (st === 'c3') { xl = 'ice-cream sales not explained by temperature'; yl = 'drownings not explained by temperature'; }
    if (st === 'c1') fit = olsLine(ice, drown);
  }
  if (st === 'r') fit = adFit;
  const mx = mean(pts.map((q) => q.x)), my = mean(pts.map((q) => q.y));
  const showMeans = part === 'ad' && st !== 'ad', showRects = st === 'rects' || st === 'r';
  const prods = AD_X.map((v, i) => (v - 3) * (AD_Y[i] - 15));
  const quadNames = ['a straight line with honest scatter', 'a smooth curve', 'a perfect line spoiled by one outlier', 'no relationship at all, plus one extreme point'];
  const cap: Record<Stage, ReactNode> = {
    ad: <>Five months of a distributor's <b>ad spend and sales</b>. As spend goes up, sales tend to go up. Correlation puts a single number on how tightly the points follow a straight line.</>,
    means: <>Draw the two <b>means</b> (green): spend 3, sales 15. They split the chart into four quadrants. Points in the top-right or bottom-left move <b>together</b>; points in the other two move in opposite directions.</>,
    rects: <>For each point, multiply its distance from the mean of x by its distance from the mean of y. Gold rectangles are <b>positive products</b> (10, 1, 0, 3, 10); a red one would be negative. They sum to <b>24</b>.</>,
    r: <>Scale away the units: r = 24 ÷ √(10 × 64) = <b>{adR.toFixed(2)}</b>. Nearly all the area is gold, so r is close to +1. The fitted yellow line rises ₹{adFit.b.toFixed(1)} lakh of sales per ₹1 lakh of spend.</>,
    m1: <>Now 60 points with <b>r = 0.95</b>: a tight cigar along a rising line.</>,
    m2: <>Same points, loosened to <b>r = 0.60</b>. Still a rising trend, but individual points stray far from the line. This is typical of real business data.</>,
    m3: <><b>r = 0</b>: a round blob. Knowing x tells you nothing (in a straight-line sense) about y.</>,
    m4: <><b>r = −0.70</b>: the cloud tilts downward. The sign tells the direction, the size tells how tightly points hug a line. r says nothing about the <b>slope</b> itself.</>,
    q1: <>Dataset 1: {quadNames[0]}. <b>r = {rOf(quad[0]).toFixed(2)}</b>. This is the picture people imagine when they hear "r = 0.8".</>,
    q2: <>Dataset 2: {quadNames[1]}. <b>r = {rOf(quad[1]).toFixed(2)}</b> again! The relationship is perfect but not straight, so a line is the wrong model.</>,
    q3: <>Dataset 3: {quadNames[2]}. <b>Still r = {rOf(quad[2]).toFixed(2)}</b>. Eleven points sit exactly on a line; one bad point drags r down from 1.</>,
    q4: <>Dataset 4: {quadNames[3]}. <b>r = {rOf(quad[3]).toFixed(2)}</b>, created by a single point. Four pictures, one r. <b>Always plot the data.</b></>,
    c1: <>Three years of monthly data: <b>ice-cream sales vs drownings</b>. r = <b>{confR.toFixed(2)}</b>. Should the city ban ice cream?</>,
    c2: <>Colour each month by <b>season</b>: cool (blue), mild (teal), hot (gold). Hot months have both more ice cream and more swimming. <b>Within</b> a season there is no consistent link (r = {bandR.map((v) => v.toFixed(2)).join(', ')}, just noise from 9–18 months each): the big overall r comes from comparing seasons.</>,
    c3: <>Now subtract from each variable the part explained by temperature, and plot what is left (points slide to the middle). The leftover link: <b>r = {partialR.toFixed(2)}</b>. Temperature is a <b>confounder</b>: the correlation is real, but ice cream does not cause drownings.</>,
  };
  return (
    <div>
      <Layout
        main={<Plot x={x} y={y} height={430} xLabel={xl} yLabel={yl}>
          {(s) => <>
            {showRects && pts.map((q, i) => <Region key={'r' + i} s={s} x0={mx} x1={q.x} y0={Math.min(my, q.y)} y1={Math.max(my, q.y)} color={prods[i] >= 0 ? C.gold : C.red} opacity={0.3} stroke={prods[i] >= 0 ? C.gold : C.red} />)}
            {showMeans && <><Seg s={s} x1={mx} x2={mx} y1={y[0]} y2={y[1]} color={C.green} dash="6 4" /><Seg s={s} x1={x[0]} x2={x[1]} y1={my} y2={my} color={C.green} dash="6 4" /></>}
            {showMeans && <><Label s={s} x={5.5} y={23} anchor="end" color={C.gold} size={12}>both above mean: +</Label><Label s={s} x={0.3} y={7} color={C.gold} size={12}>both below mean: +</Label><Label s={s} x={0.3} y={23} color={C.red} size={12}>opposite: −</Label></>}
            {showRects && pts.map((q, i) => prods[i] !== 0 && <Label key={'pl' + i} s={s} x={q.x + 0.08} y={q.y + 0.5} color={C.gold} size={12}>{prods[i]}</Label>)}
            {fit && <FnLine s={s} f={(v) => fit!.a + fit!.b * v} color={C.yellow} width={2} />}
            {st === 'c2' && [0, 1, 2].map((b) => {
              const idx = conf.map((c, i) => (band(c.T) === b ? i : -1)).filter((i) => i >= 0); if (idx.length < 3) return null;
              const xs = idx.map((i) => ice[i]), f = olsLine(xs, idx.map((i) => drown[i]));
              return <FnLine key={'bf' + b} s={s} f={(v) => f.a + f.b * v} from={Math.min(...xs)} to={Math.max(...xs)} color={SEASON[b]} width={2.5} dash="5 3" />;
            })}
            <Dots s={s} pts={pts} r={part === 'ad' ? 8 : 6} color={colorFn} />
            <Label s={s} x={x[0] + (x[1] - x[0]) * 0.03} y={y[1] - (y[1] - y[0]) * 0.07} color={C.yellow} size={16}>{st === 'c3' ? `after removing temperature: r = ${partialR.toFixed(2)}` : part === 'ad' && st !== 'r' ? '' : `r = ${r.toFixed(2)}`}</Label>
          </>}
        </Plot>}
        side={<>
          <Readout items={[
            ['Pearson r', (part === 'ad' && st !== 'r') ? '–' : r.toFixed(2), C.yellow],
            ['r²', (part === 'ad' && st !== 'r') ? '–' : (r * r).toFixed(2)],
            ['points', pts.length],
            ...(part === 'ad' ? [['Σ products', showRects ? '24' : '–', C.gold] as [string, ReactNode, string]] : []),
            ...(part === 'conf' ? [['r within each season', bandR.map((v) => v.toFixed(2)).join(' / ')] as [string, ReactNode], ['r after removing temperature', st === 'c3' ? partialR.toFixed(2) : '–', C.green] as [string, ReactNode, string]] : []),
          ]} />
          {part === 'conf' ? <Legend items={[['cool season (~20 °C)', C.blue], ['mild (~26 °C)', C.teal], ['hot (~32 °C)', C.gold]]} /> : <Legend items={[['data', C.blue], ['means', C.green], ['positive product', C.gold], ['negative product', C.red], ['fitted line', C.yellow]]} />}
          <p className="small muted" style={{ margin: 0 }}>r = Σ (x − x̄)(y − ȳ) ÷ √(Σ(x − x̄)² · Σ(y − ȳ)²). It lives between −1 and +1 and has no units.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{cap[st]}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
function Playground() {
  const [target, setTarget] = useState(0.7);
  const [n, setN] = useState(30);
  const [seed, setSeed] = useState(1);
  const [extra, setExtra] = useState<Pt[]>([]);
  const [rects, setRects] = useState(false);
  const base = useMemo(() => cloud(n, target, seed), [n, target, seed]);
  const pts = [...base, ...extra];
  const xs = pts.map((q) => q.x), ys = pts.map((q) => q.y);
  const r = corr(xs, ys), rho = spearman(xs, ys), f = olsLine(xs, ys), mx = mean(xs), my = mean(ys);
  const rBase = corr(base.map((q) => q.x), base.map((q) => q.y));
  return (
    <Layout
      main={<Plot x={[0, 100]} y={[0, 100]} height={440} xLabel="x (click to add a point)" yLabel="y" onClick={(q) => setExtra([...extra, q])}>
        {(s) => <>
          {rects && pts.map((q, i) => { const pr = (q.x - mx) * (q.y - my); return <Region key={'r' + i} s={s} x0={mx} x1={q.x} y0={Math.min(my, q.y)} y1={Math.max(my, q.y)} color={pr >= 0 ? C.gold : C.red} opacity={0.12} />; })}
          <Seg s={s} x1={mx} x2={mx} y1={0} y2={100} color={C.green} dash="6 4" width={1.5} />
          <Seg s={s} x1={0} x2={100} y1={my} y2={my} color={C.green} dash="6 4" width={1.5} />
          <FnLine s={s} f={(v) => f.a + f.b * v} color={C.yellow} width={2.5} />
          <Dots s={s} pts={base} r={5} color={C.blue} animate={false} />
          <Dots s={s} pts={extra} r={7} color={C.red} animate={false} />
        </>}
      </Plot>}
      side={<>
        <Slider label="strength of the cloud (r)" min={-1} max={1} step={0.05} value={target} onChange={setTarget} format={(v) => v.toFixed(2)} />
        <Slider label="number of points" min={5} max={200} value={n} onChange={setN} />
        <Toggle label="Show deviation rectangles" value={rects} onChange={setRects} />
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => setExtra([])}>Remove added points</button>
          <button className="btn" onClick={() => setSeed(seed + 1)}>🎲 New cloud</button>
        </div>
        <Readout items={[['Pearson r', r.toFixed(2), C.yellow], ['Spearman ρ', rho.toFixed(2), C.teal], ['r²', (r * r).toFixed(2)], ['r before your points', rBase.toFixed(2)], ['slope', f.b.toFixed(2)], ['added points', extra.length, C.red]]} />
        <p className="small muted" style={{ margin: 0 }}>Click the chart to add points (red). One point far from the cloud can flip Pearson's r while Spearman's rank-based ρ barely moves. With 5 points, r jumps around; with 200 it is steady.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Four short stories about **Pearson\'s r**: how it is computed from deviation rectangles, how the cloud\'s shape changes it, why the same r can hide very different pictures, and how a **confounder** creates correlation without causation.', steps: [
      { do: 'Step through the first four frames (ad spend vs sales).', notice: 'Each point makes a rectangle from the means; their signed areas sum to 24, giving **r = 0.95**.' },
      { do: 'Keep stepping through frames 5–8.', notice: 'The same 60 points morph from r = 0.95 to −0.70: r measures how tightly they hug a line, and its sign the direction.' },
      { do: 'Watch frames 9–12, then the ice-cream frames.', notice: 'Four totally different pictures all have **r = 0.80**. Then temperature explains the ice-cream/drowning link: r drops to about 0 once it is removed.' },
    ] },
    Playground: { what: 'Generate a cloud with any correlation, then add your own points by clicking and watch **Pearson r** and **Spearman ρ** react.', steps: [
      { do: 'Set strength to **0.9**, then click once far away in the bottom-right corner.', notice: 'One red point drags Pearson r down sharply; Spearman ρ falls far less.' },
      { do: 'Press **Remove added points**, set **number of points = 5**, and click once far from the cloud. Then repeat with **200** points.', notice: 'With 5 points a single click changes r drastically; with 200 points it barely moves. Correlations from small samples are fragile.' },
      { do: 'Tick **Show deviation rectangles**.', notice: 'Gold (positive) vs red (negative) areas: r is their balance, scaled to lie between −1 and 1.' },
    ] },
  },
};
export default anim;
