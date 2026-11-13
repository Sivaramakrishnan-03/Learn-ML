// Gaussian Mixture Models: EM iterations with rotated covariance ellipses and soft responsibility colours.
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Caption, Readout, Slider, Choice, Layout, Legend, useStepPlayer, PlayerControls, rng, gauss, C, Scales, Bars } from '../viz/kit';
import { Cov, eigSym2, normPdf2 } from '../viz/math';
import { Pt, clamp } from './_unsup-helpers';

/* ---------- pure helpers ---------- */
const CL = [C.teal, C.pink, C.purple, C.green, C.blue];
type CovType = 'full' | 'diag' | 'spherical';
interface Comp { w: number; mu: Pt; cov: Cov }
interface EMState { comps: Comp[]; resp: number[][]; ll: number }

/** Telecom customers: x = monthly spend (₹ hundred), y = mobile data (GB/month); three overlapping, tilted personas. */
function customers(seed = 5): Pt[] {
  const r = rng(seed);
  const spec = [
    { mx: 3.0, my: 2.6, sx: 0.85, sy: 0.6, rho: 0.2, n: 55 },   // light users
    { mx: 5.3, my: 6.2, sx: 1.3, sy: 0.75, rho: 0.75, n: 60 }, // data streamers: long tilted ellipse
    { mx: 6.9, my: 3.9, sx: 0.6, sy: 1.2, rho: -0.3, n: 45 }, // international callers: tall
  ];
  const out: Pt[] = [];
  spec.forEach((c) => { for (let i = 0; i < c.n; i++) { const a = gauss(r), b = gauss(r); out.push({ x: clamp(c.mx + c.sx * a), y: clamp(c.my + c.sy * (c.rho * a + Math.sqrt(1 - c.rho * c.rho) * b)) }); } });
  return out;
}

function eStep(pts: Pt[], comps: Comp[]) {
  let ll = 0;
  const resp = pts.map((p) => {
    const w = comps.map((c) => c.w * normPdf2(p, c.mu, c.cov));
    const tot = w.reduce((s, v) => s + v, 0) || 1e-300;
    ll += Math.log(tot);
    return w.map((v) => v / tot);
  });
  return { resp, ll };
}
function mStep(pts: Pt[], resp: number[][], K: number, type: CovType): Comp[] {
  const comps: Comp[] = [];
  for (let k = 0; k < K; k++) {
    const nk = resp.reduce((s, r) => s + r[k], 0) + 1e-9;
    const mx = pts.reduce((s, p, i) => s + resp[i][k] * p.x, 0) / nk, my = pts.reduce((s, p, i) => s + resp[i][k] * p.y, 0) / nk;
    let a = 0, b = 0, c = 0;
    pts.forEach((p, i) => { const dx = p.x - mx, dy = p.y - my, g = resp[i][k]; a += g * dx * dx; b += g * dx * dy; c += g * dy * dy; });
    a = a / nk + 0.02; b = b / nk; c = c / nk + 0.02; // small ridge keeps covariances invertible
    if (type === 'diag') b = 0;
    if (type === 'spherical') { const v = (a + c) / 2; a = v; c = v; b = 0; }
    comps.push({ w: nk / pts.length, mu: { x: mx, y: my }, cov: { a, b, c } });
  }
  return comps;
}
function initComps(pts: Pt[], K: number, seed: number): Comp[] {
  const r = rng(seed);
  return Array.from({ length: K }, () => { const p = pts[Math.floor(r() * pts.length)]; return { w: 1 / K, mu: { x: p.x, y: p.y }, cov: { a: 1.5, b: 0, c: 1.5 } }; });
}
/** Full EM history: states[t] = parameters after t M-steps, with responsibilities computed from them. */
function runEM(pts: Pt[], K: number, seed: number, type: CovType, iters: number): EMState[] {
  let comps = initComps(pts, K, seed);
  const out: EMState[] = [];
  for (let t = 0; t <= iters; t++) {
    const { resp, ll } = eStep(pts, comps);
    out.push({ comps, resp, ll });
    comps = mStep(pts, resp, K, type);
  }
  return out;
}
const nParams = (K: number, type: CovType) => K * 2 + (K - 1) + K * (type === 'full' ? 3 : type === 'diag' ? 2 : 1);

/** Blend component colours by responsibility: the soft-assignment colour of a point. */
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function blend(resp: number[]) {
  const rgb = [0, 0, 0];
  resp.forEach((g, k) => { const c = hex(CL[k % CL.length]); rgb.forEach((_, j) => { rgb[j] += g * c[j]; }); });
  return `rgb(${rgb.map((v) => Math.round(v)).join(',')})`;
}

function Ellipse({ s, c, color, k = 2, width = 2, dash }: { s: Scales; c: Comp; color: string; k?: number; width?: number; dash?: string }) {
  const { l1, l2, ang } = eigSym2(c.cov);
  const A = k * Math.sqrt(l1), B = k * Math.sqrt(l2);
  const d = Array.from({ length: 65 }, (_, i) => {
    const t = (i / 64) * 2 * Math.PI, ex = A * Math.cos(t), ey = B * Math.sin(t);
    const x = c.mu.x + ex * Math.cos(ang) - ey * Math.sin(ang), y = c.mu.y + ex * Math.sin(ang) + ey * Math.cos(ang);
    return `${i ? 'L' : 'M'}${s.sx(x).toFixed(1)},${s.sy(y).toFixed(1)}`;
  }).join('') + 'Z';
  return <path d={d} fill={color} fillOpacity={k === 1 ? 0.1 : 0} stroke={color} strokeWidth={width} strokeDasharray={dash} />;
}
function MeanMark({ s, c, color }: { s: Scales; c: Comp; color: string }) {
  return <g transform={`translate(${s.sx(c.mu.x)},${s.sy(c.mu.y)})`}><circle r={9} fill={C.bg} stroke={color} strokeWidth={3} /><path d="M-4,-4L4,4M4,-4L-4,4" stroke={color} strokeWidth={2.5} /></g>;
}

/* ---------- Animate ---------- */
const AX = { xLabel: 'monthly spend (₹ hundred)', yLabel: 'mobile data (GB / month)' };
const ITERS = 12;
const NAMES = ['A', 'B', 'C'];

function Animate() {
  const pts = useMemo(() => customers(5), []);
  const hist = useMemo(() => runEM(pts, 3, 9, 'full', 40), [pts]);
  // frames: raw, init, then (E, M) pairs, then final
  type F = { t: number; phase: 'raw' | 'init' | 'E' | 'M' | 'final' };
  const frames: F[] = [{ t: 0, phase: 'raw' }, { t: 0, phase: 'init' }];
  for (let t = 0; t < ITERS; t++) { frames.push({ t, phase: 'E' }); frames.push({ t: t + 1, phase: 'M' }); }
  frames.push({ t: 40, phase: 'final' });
  const p = useStepPlayer(frames.length, 1100);
  const f = frames[p.i];
  const st = hist[f.t];
  const showResp = f.phase === 'E' || f.phase === 'final';
  const resp = f.phase === 'M' ? hist[f.t - 1].resp : st.resp; // after an M-step the colours are still last E-step's
  const prev = f.phase === 'M' ? hist[f.t - 1].comps : undefined;
  // the most "torn" customer at the end, used as a running example
  const torn = useMemo(() => {
    const fin = hist[40].resp; let bi = 0, be = -1;
    fin.forEach((r, i) => { const e = -r.reduce((s, g) => s + (g > 0 ? g * Math.log(g) : 0), 0); if (e > be) { be = e; bi = i; } });
    return bi;
  }, [hist]);
  const tr = resp[torn];
  const lls = hist.slice(0, ITERS + 1).map((h) => h.ll);
  const caption =
    f.phase === 'raw' ? <>{pts.length} telecom customers: monthly spend vs mobile data. The groups <b>overlap</b> and are <b>stretched and tilted</b>, not round. A GMM models the data as a <b>mix of 3 bell-shaped blobs</b> (Gaussians), each with its own centre, shape and share.</>
      : f.phase === 'init' ? <>Start with a guess: three round Gaussians (ellipses show 1 and 2 standard deviations) placed on random customers. All points are still grey: nobody has been given credit yet.</>
        : f.phase === 'E' ? <><b>E-step {f.t + 1}</b>: for every customer, ask each blob "how likely are you to have produced this point?" and normalise into <b>responsibilities</b> that add to 1. Colours are now <b>blends</b>: a purple-pink point is partly B, partly C. The ringed customer is {tr.map((g, k) => `${(g * 100).toFixed(0)}% ${NAMES[k]}`).join(', ')}.</>
          : f.phase === 'M' ? <><b>M-step {f.t}</b>: refit each blob from its <b>weighted</b> customers: new centre = responsibility-weighted mean, new ellipse = weighted covariance, new share = average responsibility. The dashed ellipses show where the blobs were. Log-likelihood: <b>{hist[f.t - 1].ll.toFixed(1)} → {st.ll.toFixed(1)}</b> (it never goes down).</>
            : <>After {40} iterations EM has converged: three tilted ellipses matching the three personas, shares {st.comps.map((c) => (c.w * 100).toFixed(0) + '%').join(' / ')}. Unlike k-means, every customer keeps <b>probabilities</b>, not a hard label: the ringed one is {tr.map((g, k) => `${(g * 100).toFixed(0)}% ${NAMES[k]}`).join(', ')}.</>;
  return (
    <div>
      <Layout
        main={<Plot x={[0, 10]} y={[0, 10]} height={420} {...AX}>
          {(s) => <>
            {f.phase !== 'raw' && st.comps.map((c, k) => <g key={k}><Ellipse s={s} c={c} color={CL[k]} k={1} width={1.5} /><Ellipse s={s} c={c} color={CL[k]} k={2} /></g>)}
            {prev && prev.map((c, k) => <Ellipse key={'p' + k} s={s} c={c} color={CL[k]} k={2} width={1.2} dash="4 4" />)}
            {pts.map((q, i) => <circle key={i} cx={s.sx(q.x)} cy={s.sy(q.y)} r={4.5} fill={f.phase === 'raw' ? C.blue : f.phase === 'init' ? C.grey : blend(resp[i])} stroke={C.bg} />)}
            {f.phase !== 'raw' && f.phase !== 'init' && <circle cx={s.sx(pts[torn].x)} cy={s.sy(pts[torn].y)} r={10} fill="none" stroke={C.gold} strokeWidth={2.5} />}
            {f.phase !== 'raw' && st.comps.map((c, k) => <MeanMark key={'m' + k} s={s} c={c} color={CL[k]} />)}
            {f.phase !== 'raw' && st.comps.map((c, k) => <text key={'t' + k} x={s.sx(c.mu.x) + 12} y={s.sy(c.mu.y) - 10} fill={CL[k]} fontSize={13} fontWeight={700}>{NAMES[k]}</text>)}
          </>}
        </Plot>}
        side={<>
          <Readout items={[
            ['iteration', f.phase === 'raw' || f.phase === 'init' ? 0 : f.t, C.text],
            ['phase', f.phase === 'E' ? 'E (credit)' : f.phase === 'M' ? 'M (refit)' : f.phase],
            ['log-likelihood', f.phase === 'raw' ? '–' : st.ll.toFixed(1), C.yellow],
            ['shares', f.phase === 'raw' ? '–' : st.comps.map((c) => (c.w * 100).toFixed(0)).join('/') + '%'],
          ]} />
          <div className="small muted">Ringed customer's responsibilities</div>
          <Plot x={[-0.6, 2.6]} y={[0, 1]} width={300} height={130} fx={(v) => NAMES[Math.round(v)] ?? ''} xTicks={3} yTicks={2} grid={false}>
            {(s) => <Bars s={s} data={(showResp || f.phase === 'M' ? tr : [0, 0, 0]).map((g, k) => ({ x: k, y: g }))} width={0.6} color={(k) => CL[k]} />}
          </Plot>
          <div className="small muted">Log-likelihood by iteration</div>
          <Plot x={[0, ITERS]} y={[Math.min(...lls) - 5, Math.max(...lls) + 5]} width={300} height={120} xTicks={4} yTicks={3}>
            {(s) => <>
              <path d={lls.slice(0, (f.phase === 'raw' || f.phase === 'init' ? 0 : f.t) + 1).map((v, i) => `${i ? 'L' : 'M'}${s.sx(i)},${s.sy(v)}`).join('')} fill="none" stroke={C.yellow} strokeWidth={2} />
              {lls.slice(0, (f.phase === 'raw' || f.phase === 'init' ? 0 : f.t) + 1).map((v, i) => <circle key={i} cx={s.sx(i)} cy={s.sy(v)} r={2.5} fill={C.yellow} />)}
            </>}
          </Plot>
          <Legend items={[['blob A', CL[0]], ['blob B', CL[1]], ['blob C', CL[2]], ['tracked customer', C.gold]]} />
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caption}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
function Playground() {
  const pts = useMemo(() => customers(5), []);
  const [K, setK] = useState(3);
  const [type, setType] = useState<CovType>('full');
  const [seed, setSeed] = useState(2);
  const [iter, setIter] = useState(30);
  const hist = useMemo(() => runEM(pts, K, seed, type, 40), [pts, K, seed, type]);
  const st = hist[iter];
  const bic = nParams(K, type) * Math.log(pts.length) - 2 * hist[40].ll;
  const bics = useMemo(() => [1, 2, 3, 4, 5].map((k) => {
    const best = Math.max(...[1, 2, 3].map((sd) => runEM(pts, k, sd * 7 + 1, type, 40)[40].ll));
    return nParams(k, type) * Math.log(pts.length) - 2 * best;
  }), [pts, type]);
  const lo = Math.min(...bics), hi = Math.max(...bics);
  const uncertain = st.resp.filter((r) => Math.max(...r) < 0.8).length;
  return (
    <Layout
      main={<Plot x={[0, 10]} y={[0, 10]} height={420} {...AX}>
        {(s) => <>
          {st.comps.map((c, k) => <g key={k}><Ellipse s={s} c={c} color={CL[k]} k={1} width={1.5} /><Ellipse s={s} c={c} color={CL[k]} k={2} /></g>)}
          {pts.map((q, i) => <circle key={i} cx={s.sx(q.x)} cy={s.sy(q.y)} r={4.5} fill={blend(st.resp[i])} stroke={Math.max(...st.resp[i]) < 0.8 ? C.gold : C.bg} strokeWidth={Math.max(...st.resp[i]) < 0.8 ? 2 : 1} />)}
          {st.comps.map((c, k) => <MeanMark key={'m' + k} s={s} c={c} color={CL[k]} />)}
        </>}
      </Plot>}
      side={<>
        <Slider label="components K" min={1} max={5} value={K} onChange={setK} />
        <Choice label="Shape" value={type} onChange={setType} options={[{ value: 'full', label: 'full (tilted)' }, { value: 'diag', label: 'diagonal' }, { value: 'spherical', label: 'round' }]} />
        <Slider label="EM iteration" min={0} max={40} value={iter} onChange={setIter} />
        <button className="btn" onClick={() => setSeed(seed + 1)}>🎲 New random start</button>
        <Readout items={[['log-likelihood', st.ll.toFixed(1), C.yellow], ['BIC (K=' + K + ')', bic.toFixed(0)], ['uncertain pts (<80%)', uncertain, C.gold]]} />
        <div className="small muted">BIC for K = 1…5 (lower is better)</div>
        <Plot x={[0.4, 5.6]} y={[0, 1]} width={300} height={120} xTicks={5} yTicks={2} fy={() => ''} grid={false}>
          {(s) => <Bars s={s} data={bics.map((b, i) => ({ x: i + 1, y: 0.15 + 0.85 * (hi - b) / Math.max(hi - lo, 1e-9) }))} width={0.6} color={(i) => (i + 1 === K ? C.yellow : C.blue)} highlight={(i) => bics[i] === lo} />}
        </Plot>
        <p className="small muted" style={{ margin: 0 }}>Bar height = how much better than the worst K (taller = lower BIC); gold = best K. Gold-ringed points are customers the model is unsure about.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Watch the **EM algorithm** fit three Gaussian blobs to overlapping, tilted customer groups. The **E-step** colours each point by its probabilities (blended colours); the **M-step** moves and reshapes each ellipse.', steps: [
      { do: 'Step through the first E-step and M-step.', notice: 'E: colours become blends of the blob colours. M: ellipses jump to new centres and tilt (dashed = old position).' },
      { do: 'Watch the **log-likelihood** chart while you press **▶ Play**.', notice: 'It rises every iteration and then flattens: EM never makes the fit worse.' },
      { do: 'Follow the **gold-ringed customer** and its bars.', notice: 'It sits in the overlap, so it keeps a split probability even at the end. k-means would force one label.' },
    ] },
    Playground: { what: 'Change the number of components, the allowed ellipse **shape**, the EM iteration and the random start. BIC (bottom right) tells you which K the data supports.', steps: [
      { do: 'Switch Shape to **round**.', notice: 'Round blobs cannot follow the tilted "data streamers" group, so the fit gets worse (lower log-likelihood). Round + hard labels is basically k-means.' },
      { do: 'Drag **components K** from 1 to 5 and watch the BIC bars.', notice: 'Log-likelihood always improves with more blobs, but BIC penalises extra parameters and is best at K = 3.' },
      { do: 'Set iteration to 0, then click **New random start** a few times and drag the iteration slider.', notice: 'Different starts can end in different solutions (local optima), which is why libraries use several starts (n_init).' },
    ] },
  },
};
export default anim;
