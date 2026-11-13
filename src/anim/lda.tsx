// LDA: project the data onto a rotating line; Fisher's ratio (between-class separation ÷ within-class spread) peaks at LDA's direction, not PCA's.
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Bars, Dots, Seg, Label, Caption, Readout, Slider, Toggle, Layout, Legend, useStepPlayer, PlayerControls, Tex, C, Scales, rng, gauss } from '../viz/kit';
import { LP, equalH } from './_clf-helpers';

/* ---------- pure helpers ---------- */
const CL = [C.blue, C.red];
const X: [number, number] = [-4.5, 4.5], Y: [number, number] = [-3, 3];
const HGT = equalH(X, Y);
const DEG = Math.PI / 180;

/** Two parallel cigar-shaped classes: long axis at angle `tilt`, centres `sep` apart across it. */
function cigars(n: number, sep: number, long: number, short: number, tilt: number, seed: number): LP[] {
  const r = rng(seed), u = [Math.cos(tilt), Math.sin(tilt)], v = [-u[1], u[0]];
  return Array.from({ length: n }, (_, i) => {
    const c = (i % 2) as 0 | 1, a = long * gauss(r), b = short * gauss(r) + (c ? sep / 2 : -sep / 2);
    return { x: a * u[0] + b * v[0], y: a * u[1] + b * v[1], c };
  });
}
const meanOf = (a: number[]) => a.reduce((s, v) => s + v, 0) / Math.max(a.length, 1);
function stats(pts: LP[]) {
  const g = [0, 1].map((c) => pts.filter((p) => p.c === c));
  const m = g.map((q) => [meanOf(q.map((p) => p.x)), meanOf(q.map((p) => p.y))]);
  // pooled within-class scatter S_W and total covariance
  let a = 0, b = 0, d = 0;
  g.forEach((q, c) => q.forEach((p) => { const dx = p.x - m[c][0], dy = p.y - m[c][1]; a += dx * dx; b += dx * dy; d += dy * dy; }));
  const det = a * d - b * b || 1e-9, diff = [m[1][0] - m[0][0], m[1][1] - m[0][1]];
  const wl = [(d * diff[0] - b * diff[1]) / det, (-b * diff[0] + a * diff[1]) / det];
  const mx = meanOf(pts.map((p) => p.x)), my = meanOf(pts.map((p) => p.y));
  let sxx = 0, sxy = 0, syy = 0; pts.forEach((p) => { sxx += (p.x - mx) ** 2; sxy += (p.x - mx) * (p.y - my); syy += (p.y - my) ** 2; });
  const thPCA = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const norm = (t: number) => ((t % Math.PI) + Math.PI) % Math.PI;
  return { thLDA: norm(Math.atan2(wl[1], wl[0])), thPCA: norm(thPCA) };
}
/** Projection of every point onto the unit direction at angle th, and Fisher's ratio along it. */
function project(pts: LP[], th: number) {
  const d = [Math.cos(th), Math.sin(th)];
  const z = pts.map((p) => p.x * d[0] + p.y * d[1]);
  const z0 = z.filter((_, i) => pts[i].c === 0), z1 = z.filter((_, i) => pts[i].c === 1);
  const m0 = meanOf(z0), m1 = meanOf(z1);
  const v0 = meanOf(z0.map((v) => (v - m0) ** 2)), v1 = meanOf(z1.map((v) => (v - m1) ** 2));
  const J = (m1 - m0) ** 2 / (v0 + v1 || 1e-9);
  const cut = (m0 + m1) / 2, sgn = m1 >= m0 ? 1 : -1;
  const errors = z.filter((v, i) => ((sgn * (v - cut) > 0 ? 1 : 0) !== pts[i].c)).length;
  return { d, z, m0, m1, v0, v1, J, cut, errors };
}
function hist(vals: number[], lo: number, hi: number, bins: number) {
  const w = (hi - lo) / bins, c = Array(bins).fill(0);
  vals.forEach((v) => { const i = Math.floor((v - lo) / w); if (i >= 0 && i < bins) c[i]++; });
  return c.map((k, i) => ({ x: lo + (i + 0.5) * w, y: k }));
}

/** The 2-D scene: projection line through the origin, feet of the perpendiculars, faint connectors. */
function Scene({ s, pts, th, showLines = true, extra }: { s: Scales; pts: LP[]; th: number; showLines?: boolean; extra?: { th: number; color: string; label: string }[] }) {
  const pr = project(pts, th), L = 7;
  return <>
    {extra?.map((e) => <g key={e.label}>
      <Seg s={s} x1={-L * Math.cos(e.th)} y1={-L * Math.sin(e.th)} x2={L * Math.cos(e.th)} y2={L * Math.sin(e.th)} color={e.color} width={1.8} dash="7 5" />
      <Label s={s} x={2.6 * Math.cos(e.th) + 0.12} y={2.6 * Math.sin(e.th) + 0.15} color={e.color} size={12}>{e.label}</Label>
    </g>)}
    {showLines && pts.map((p, i) => <line key={i} x1={s.sx(p.x)} y1={s.sy(p.y)} x2={s.sx(pr.z[i] * pr.d[0])} y2={s.sy(pr.z[i] * pr.d[1])} stroke={CL[p.c]} strokeOpacity={0.18} />)}
    <Seg s={s} x1={-L * pr.d[0]} y1={-L * pr.d[1]} x2={L * pr.d[0]} y2={L * pr.d[1]} color={C.yellow} width={2.5} />
    <Dots s={s} pts={pts} color={(i) => CL[pts[i].c]} r={4.5} animate={false} opacity={0.85} />
    <Dots s={s} pts={pr.z.map((v) => ({ x: v * pr.d[0], y: v * pr.d[1] }))} color={(i) => CL[pts[i].c]} r={3} animate={false} />
  </>;
}
function Strip({ pts, th, height = 150 }: { pts: LP[]; th: number; height?: number }) {
  const pr = project(pts, th);
  const h0 = hist(pr.z.filter((_, i) => pts[i].c === 0), -4.5, 4.5, 36), h1 = hist(pr.z.filter((_, i) => pts[i].c === 1), -4.5, 4.5, 36);
  const top = Math.max(4, ...h0.map((d) => d.y), ...h1.map((d) => d.y)) * 1.15;
  return <Plot x={[-4.5, 4.5]} y={[0, top]} height={height} xLabel="position along the yellow line" fy={() => ''} yTicks={2}>
    {(s) => <>
      <Bars s={s} data={h0} width={0.24} color={C.blue + 'bb'} />
      <Bars s={s} data={h1} width={0.24} color={C.red + 'bb'} />
      <Seg s={s} x1={pr.m0} x2={pr.m0} y1={0} y2={top} color={C.blue} dash="4 3" />
      <Seg s={s} x1={pr.m1} x2={pr.m1} y1={0} y2={top} color={C.red} dash="4 3" />
    </>}
  </Plot>;
}

/* ---------- Animate ---------- */
const DATA = cigars(80, 1.7, 1.45, 0.32, 30 * DEG, 11);

function Animate() {
  const st = useMemo(() => stats(DATA), []);
  const curve = useMemo(() => Array.from({ length: 181 }, (_, k) => ({ x: k, y: project(DATA, k * DEG).J })), []);
  const frames = useMemo(() => {
    const sweep: { th: number; tag?: 'PCA' | 'LDA' }[] = Array.from({ length: 12 }, (_, k) => ({ th: k * 15 * DEG }));
    sweep.push({ th: st.thPCA, tag: 'PCA' }, { th: st.thLDA, tag: 'LDA' });
    sweep.sort((a, b) => a.th - b.th);
    return [{ kind: 'data' as const, th: 0 }, ...sweep.map((q) => ({ kind: 'sweep' as const, ...q })), { kind: 'compare' as const, th: st.thLDA }, { kind: 'classify' as const, th: st.thLDA }];
  }, [st]);
  const p = useStepPlayer(frames.length, 1500);
  const f = frames[p.i];
  const pr = project(DATA, f.th);
  const prP = project(DATA, st.thPCA), prL = project(DATA, st.thLDA);
  const thDeg = Math.round(f.th / DEG);
  const Jmax = Math.max(...curve.map((c) => c.y));
  const seen = f.kind === 'data' ? [] : f.kind === 'sweep' ? curve.slice(0, thDeg + 1) : curve;
  const caption = (() => {
    if (f.kind === 'data') return <>Two kinds of wine (blue and red) measured on two standardised features. Each class is a long, thin cloud. LDA's question: <b>onto which single line should we project the points so the two classes overlap as little as possible?</b></>;
    if (f.kind === 'compare') return <>Side by side: <b style={{ color: C.purple }}>PCA's direction</b> (J = {prP.J.toFixed(2)}, {prP.errors} errors) follows the long axis where the data is most spread out, and it mixes the classes. <b style={{ color: C.yellow }}>LDA's direction</b> (J = {prL.J.toFixed(2)}, {prL.errors} errors) cuts across the clouds. <b>PCA ignores the labels; LDA uses them.</b></>;
    if (f.kind === 'classify') return <>To classify, LDA projects a new wine onto its line and compares it with the midpoint between the projected class means ({pr.cut.toFixed(2)}, green tick). That threshold is the green line across the plot: a <b>straight decision boundary</b>, perpendicular to the LDA direction. Errors on this data: <b>{pr.errors} of {DATA.length}</b>.</>;
    const base = <>Line at <b>{thDeg}°</b>. Each point drops perpendicularly onto it (faint lines), giving the 1-D histograms below. Separation of the means ÷ spread within classes: <b>J = {pr.J.toFixed(2)}</b>.</>;
    if (f.tag === 'PCA') return <><b style={{ color: C.purple }}>This is PCA's direction ({thDeg}°)</b>: the line along which all the points together are most spread out. But the two histograms sit almost on top of each other: J = <b>{pr.J.toFixed(2)}</b>. Big spread is not the same as good separation.</>;
    if (f.tag === 'LDA') return <><b style={{ color: C.yellow }}>This is LDA's direction ({thDeg}°)</b>: the means are pushed apart and each class is squeezed tight. Fisher's ratio is at its <b>peak, J = {pr.J.toFixed(2)}</b>, the top of the curve on the right.</>;
    return base;
  })();
  return (
    <div>
      <Layout
        main={<>
          <Plot x={X} y={Y} height={HGT} xLabel="feature 1 (standardised)" yLabel="feature 2 (standardised)">
            {(s) => <>
              {f.kind === 'compare' && <Scene s={s} pts={DATA} th={st.thLDA} showLines={false} extra={[{ th: st.thPCA, color: C.purple, label: 'PCA' }]} />}
              {f.kind !== 'compare' && <Scene s={s} pts={DATA} th={f.th} showLines={f.kind !== 'data'} />}
              {f.kind === 'classify' && (() => {
                const d = pr.d, c = pr.cut, n = [-d[1], d[0]];
                return <><Seg s={s} x1={c * d[0] - 6 * n[0]} y1={c * d[1] - 6 * n[1]} x2={c * d[0] + 6 * n[0]} y2={c * d[1] + 6 * n[1]} color={C.green} width={2.5} />
                  <circle cx={s.sx(c * d[0])} cy={s.sy(c * d[1])} r={6} fill={C.green} /></>;
              })()}
            </>}
          </Plot>
          <div className="small muted" style={{ marginTop: 6 }}>{f.kind === 'compare' ? 'Projected onto PCA\'s direction (top) and LDA\'s direction (bottom)' : 'The points after projection onto the yellow line'}</div>
          {f.kind === 'compare' ? <><Strip pts={DATA} th={st.thPCA} height={120} /><Strip pts={DATA} th={st.thLDA} height={120} /></> : <Strip pts={DATA} th={f.th} />}
        </>}
        side={<>
          <div className="small muted">Fisher's ratio J for every angle</div>
          <Plot x={[0, 180]} y={[0, Jmax * 1.15]} width={320} height={190} xLabel="line angle (degrees)" xTicks={6} yTicks={4}>
            {(s) => <>
              <path d={seen.map((c, i) => `${i ? 'L' : 'M'}${s.sx(c.x)},${s.sy(c.y)}`).join('')} fill="none" stroke={C.yellow} strokeWidth={2} />
              {f.kind !== 'data' && <>
                {(f.kind !== 'sweep' || f.th >= st.thPCA - 1e-9) && <><Seg s={s} x1={st.thPCA / DEG} x2={st.thPCA / DEG} y1={0} y2={Jmax * 1.15} color={C.purple} dash="4 3" /><Label s={s} x={st.thPCA / DEG + 2} y={Jmax * 1.03} color={C.purple} size={11}>PCA</Label></>}
                {(f.kind !== 'sweep' || f.th >= st.thLDA - 1e-9) && <><Seg s={s} x1={st.thLDA / DEG} x2={st.thLDA / DEG} y1={0} y2={Jmax * 1.15} color={C.yellow} dash="4 3" /><Label s={s} x={st.thLDA / DEG + 2} y={Jmax * 1.03} color={C.yellow} size={11}>LDA</Label></>}
                <circle cx={s.sx(thDeg)} cy={s.sy(pr.J)} r={5} fill={C.gold} />
              </>}
            </>}
          </Plot>
          <Readout items={[
            ['angle', `${thDeg}°`, C.yellow], ['gap between means', Math.abs(pr.m1 - pr.m0).toFixed(2)],
            ['spread within', Math.sqrt((pr.v0 + pr.v1) / 2).toFixed(2)], ['Fisher J', pr.J.toFixed(2), C.gold],
            ['errors at midpoint', `${pr.errors} / ${DATA.length}`],
          ]} />
          <Tex block>{'J(w)=\\dfrac{(\\bar z_1-\\bar z_0)^2}{s_0^2+s_1^2},\\quad w^\\ast\\propto S_W^{-1}(\\mu_1-\\mu_0)'}</Tex>
          <Legend items={[['cultivar A', C.blue], ['cultivar B', C.red], ['projection line', C.yellow], ['PCA direction', C.purple]]} />
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caption}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
function Playground() {
  const [ang, setAng] = useState(60);
  const [sep, setSep] = useState(1.7);
  const [long, setLong] = useState(1.45);
  const [guides, setGuides] = useState(true);
  const pts = useMemo(() => cigars(80, sep, long, 0.32, 30 * DEG, 11), [sep, long]);
  const st = useMemo(() => stats(pts), [pts]);
  const pr = project(pts, ang * DEG), prL = project(pts, st.thLDA), prP = project(pts, st.thPCA);
  return (
    <Layout
      main={<>
        <Plot x={X} y={Y} height={HGT} xLabel="feature 1 (standardised)" yLabel="feature 2 (standardised)">
          {(s) => <Scene s={s} pts={pts} th={ang * DEG} extra={guides ? [{ th: st.thPCA, color: C.purple, label: 'PCA' }, { th: st.thLDA, color: C.green, label: 'LDA' }] : undefined} />}
        </Plot>
        <Strip pts={pts} th={ang * DEG} />
      </>}
      side={<>
        <Slider label="projection angle" min={0} max={179} value={ang} onChange={setAng} format={(v) => `${v}°`} />
        <Slider label="distance between classes" min={0.4} max={3} step={0.1} value={sep} onChange={setSep} format={(v) => v.toFixed(1)} />
        <Slider label="cloud length (elongation)" min={0.35} max={2} step={0.05} value={long} onChange={setLong} format={(v) => v.toFixed(2)} />
        <Toggle label="show PCA and LDA directions" value={guides} onChange={setGuides} />
        <button className="btn" onClick={() => setAng(Math.round(st.thLDA / DEG))}>Snap to LDA</button>
        <Readout items={[
          ['your J', pr.J.toFixed(2), C.yellow], ['LDA J (best)', prL.J.toFixed(2), C.green], ['PCA J', prP.J.toFixed(2), C.purple],
          ['your errors', `${pr.errors}`], ['PCA angle', `${Math.round(st.thPCA / DEG)}°`, C.purple], ['LDA angle', `${Math.round(st.thLDA / DEG)}°`, C.green],
        ]} />
        <p className="small muted" style={{ margin: 0 }}>Try to beat LDA's J by hand: you can't. Then shrink the cloud length until the clouds are round: PCA and LDA start to point the same way.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'We rotate a line through two long, thin classes and **project every point onto it**. Fisher\'s ratio J (gap between class means ÷ spread within classes) is traced for each angle; LDA picks the peak, PCA picks the direction of greatest overall spread.', steps: [
      { do: 'Press **▶ Play** and watch the histograms under the plot.', notice: 'At some angles the blue and red histograms sit on top of each other; at others they split apart.' },
      { do: 'Pause on the frame labelled **PCA**.', notice: 'Huge spread, but the classes are mixed: J is low.' },
      { do: 'Continue to **LDA** and the comparison frame.', notice: 'J peaks at LDA\'s angle, and the final frame turns that direction into a straight decision boundary.' },
    ] },
    Playground: { what: 'Rotate the projection line yourself, move the classes apart and change how elongated they are. Compare your J with LDA\'s and PCA\'s.', steps: [
      { do: 'Drag the **projection angle** slowly through all angles.', notice: 'J and the histogram overlap change together; nothing beats the green LDA direction.' },
      { do: 'Reduce **cloud length** to its minimum.', notice: 'With round clouds, the direction of most spread is the direction between the classes, so PCA and LDA nearly agree.' },
      { do: 'Make the clouds long and **distance** small.', notice: 'PCA\'s direction becomes useless for classification while LDA still separates the classes well.' },
    ] },
  },
};
export default anim;
