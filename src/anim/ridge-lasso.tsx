// Ridge & Lasso: the constraint-region picture (circle vs diamond touching the loss contours) and coefficient paths shrinking as λ grows.
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Dots, Seg, Label, Caption, Readout, Slider, Choice, Layout, Legend, useStepPlayer, PlayerControls, rng, gauss, Scales, C, SERIES } from '../viz/kit';
import { standardize, ridgeFit, lassoFit, mean, rmse, corr } from './_regression-helpers';

/* ---------- pure helpers ---------- */
// Simulated Chennai flats. Seven candidate features; price really depends on four of them. Carpet area is ~98% the same as built-up area.
const FEATS = ['built-up area', 'carpet area', 'age', 'floor', 'metro distance', 'random A', 'random B'];
const TRUE_RAW = [2.0, 0, -1.0, 0.5, -0.7, 0, 0];
function flats(n: number, seed: number) {
  const r = rng(seed);
  const rows = Array.from({ length: n }, () => {
    const a = gauss(r), carpet = 0.98 * a + 0.2 * gauss(r);
    const x = [a, carpet, gauss(r), gauss(r), gauss(r), gauss(r), gauss(r)];
    return { x, y: x.reduce((s, v, j) => s + v * TRUE_RAW[j], 0) + 1.6 * gauss(r) };
  });
  return { cols: FEATS.map((_, j) => rows.map((q) => q.x[j])), y: rows.map((q) => q.y) };
}
/** Standardise train (and apply the same transform to test); y is centred and scaled to SD 1 so λ means the same thing for every dataset. */
function prepare(train: ReturnType<typeof flats>, test?: ReturnType<typeof flats>) {
  const { Z, mu, s } = standardize(train.cols);
  const my = mean(train.y), sy = Math.sqrt(mean(train.y.map((v) => (v - my) ** 2))) || 1;
  const y = train.y.map((v) => (v - my) / sy);
  const Zt = test ? test.cols.map((c, j) => c.map((v) => (v - mu[j]) / s[j])) : [];
  const yt = test ? test.y.map((v) => (v - my) / sy) : [];
  const trueStd = TRUE_RAW.map((b, j) => (b * s[j]) / sy);
  return { Z, y, Zt, yt, trueStd };
}
type Method = 'ridge' | 'lasso' | 'enet';
const fitM = (m: Method, Z: number[][], y: number[], lam: number, init?: number[]) =>
  m === 'ridge' ? ridgeFit(Z, y, lam) : lassoFit(Z, y, lam, m === 'lasso' ? 1 : 0.5, init);
/** Coefficient path over a λ grid (largest λ first so lasso can warm-start). */
function path(m: Method, Z: number[][], y: number[], lams: number[]) {
  const out: number[][] = Array(lams.length); let prev: number[] | undefined;
  for (let k = lams.length - 1; k >= 0; k--) { prev = fitM(m, Z, y, lams[k], prev); out[k] = prev; }
  return out;
}
const predict = (Z: number[][], b: number[]) => Z[0].map((_, i) => Z.reduce((s, c, j) => s + c[i] * b[j], 0));

// Two-feature version for the geometry picture: area and bedrooms (correlated 0.6).
function twoFeature() {
  const r = rng(12), n = 60;
  const rows = Array.from({ length: n }, () => { const a = gauss(r), b = 0.6 * a + 0.8 * gauss(r); return { a, b, y: 0.62 * a + 0.2 * b + 0.55 * gauss(r) }; });
  const { Z } = standardize([rows.map((q) => q.a), rows.map((q) => q.b)]);
  const my = mean(rows.map((q) => q.y)), y = rows.map((q) => q.y - my);
  const S = [[1, 0], [0, 1]].map((_, j) => [0, 1].map((k) => Z[j].reduce((s, v, i) => s + v * Z[k][i], 0) / n));
  const ols = ridgeFit(Z, y, 0);
  return { Z, y, S, ols, rho: corr(Z[0], Z[1]) };
}
/** Points on the loss contour ½(β−β̂)ᵀS(β−β̂) = c (an ellipse). */
function ellipse(S: number[][], c0: number[], level: number, n = 90) {
  const a = S[0][0], b = S[0][1], d = S[1][1], tr = a + d, det = a * d - b * b, h = Math.sqrt(Math.max(0, tr * tr / 4 - det));
  const l1 = tr / 2 + h, l2 = tr / 2 - h;
  let v = Math.abs(b) > 1e-9 ? [b, l1 - a] : [1, 0]; const nv = Math.hypot(v[0], v[1]); v = [v[0] / nv, v[1] / nv];
  const w = [-v[1], v[0]], k = Math.sqrt(2 * Math.max(level, 0));
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = (2 * Math.PI * i) / n, p = (k * Math.cos(t)) / Math.sqrt(l1), q = (k * Math.sin(t)) / Math.sqrt(Math.max(l2, 1e-6));
    return { x: c0[0] + p * v[0] + q * w[0], y: c0[1] + p * v[1] + q * w[1] };
  });
}
const lossAt = (S: number[][], c0: number[], b: number[]) => { const d = [b[0] - c0[0], b[1] - c0[1]]; return 0.5 * (d[0] * (S[0][0] * d[0] + S[0][1] * d[1]) + d[1] * (S[1][0] * d[0] + S[1][1] * d[1])); };
const poly = (s: Scales, pts: { x: number; y: number }[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${s.sx(p.x)},${s.sy(p.y)}`).join('') + 'Z';

const fmtLam = (l: number) => (l < 0.01 ? l.toFixed(4) : l < 1 ? l.toFixed(3) : l.toFixed(1));
const norm = (m: 'ridge' | 'lasso', b: number[]) => (m === 'ridge' ? Math.hypot(...b) : b.reduce((t, v) => t + Math.abs(v), 0));
/** Constraint form: find the λ whose solution uses exactly a fraction `frac` of the least-squares budget (bisection on log λ). */
function atBudget(m: 'ridge' | 'lasso', Z: number[][], y: number[], frac: number) {
  const ols = ridgeFit(Z, y, 1e-9), full = norm(m, ols);
  if (frac >= 0.999) return { b: ols, lam: 0 };
  if (frac <= 0.001) return { b: ols.map(() => 0), lam: Infinity };
  let lo = -6, hi = 4;
  for (let it = 0; it < 40; it++) { const mid = (lo + hi) / 2, b = fitM(m, Z, y, 10 ** mid); if (norm(m, b) > frac * full) lo = mid; else hi = mid; }
  return { b: fitM(m, Z, y, 10 ** hi), lam: 10 ** hi };
}
/** Path as (budget fraction s, coefficients) over a fine λ grid. */
function budgetPath(m: 'ridge' | 'lasso', Z: number[][], y: number[]) {
  const lams = Array.from({ length: 140 }, (_, k) => 10 ** (-5 + (7 * k) / 139));
  const ps = path(m, Z, y, lams), full = norm(m, ridgeFit(Z, y, 1e-9));
  return ps.map((b, k) => ({ s: Math.min(1, norm(m, b) / full), b, lam: lams[k] }));
}

function Geometry({ geo, m, beta, show }: { geo: ReturnType<typeof twoFeature>; m: 'ridge' | 'lasso'; beta: number[]; show: boolean }) {
  const D: [number, number] = [-0.45, 0.95];
  const level = lossAt(geo.S, geo.ols, beta);
  const r2 = Math.hypot(beta[0], beta[1]), r1 = Math.abs(beta[0]) + Math.abs(beta[1]);
  const region = m === 'ridge'
    ? Array.from({ length: 73 }, (_, i) => ({ x: r2 * Math.cos((i * Math.PI) / 36), y: r2 * Math.sin((i * Math.PI) / 36) }))
    : [{ x: r1, y: 0 }, { x: 0, y: r1 }, { x: -r1, y: 0 }, { x: 0, y: -r1 }];
  return (
    <Plot x={D} y={D} width={380} height={372} xLabel="β₁ (area)" yLabel="β₂ (bedrooms)" xTicks={5} yTicks={5}>
      {(s) => <>
        <Seg s={s} x1={D[0]} x2={D[1]} y1={0} y2={0} color={C.grey} width={1} />
        <Seg s={s} x1={0} x2={0} y1={D[0]} y2={D[1]} color={C.grey} width={1} />
        {[0.004, 0.015, 0.035, 0.065, 0.11].map((l) => <path key={l} d={poly(s, ellipse(geo.S, geo.ols, l))} fill="none" stroke={C.red} strokeOpacity={0.3} strokeWidth={1} />)}
        {show && <path d={poly(s, region)} fill={C.teal} fillOpacity={0.25} stroke={C.teal} strokeWidth={2} />}
        {show && level > 1e-6 && <path d={poly(s, ellipse(geo.S, geo.ols, level))} fill="none" stroke={C.red} strokeWidth={2.2} />}
        <Dots s={s} pts={[{ x: geo.ols[0], y: geo.ols[1] }]} color={C.red} r={5} animate={false} />
        <Label s={s} x={geo.ols[0] + 0.02} y={geo.ols[1] - 0.09} color={C.red} size={12} anchor="middle">β̂ (least squares)</Label>
        {show && <Dots s={s} pts={[{ x: beta[0], y: beta[1] }]} color={C.yellow} r={6} />}
        <Label s={s} x={D[0] + 0.04} y={D[1] - 0.09} color={C.text} size={14}>{m === 'ridge' ? 'Ridge: β₁² + β₂² ≤ t' : 'Lasso: |β₁| + |β₂| ≤ t'}</Label>
      </>}
    </Plot>
  );
}

function PathPlot({ lams, paths, upto, cursor, xr, yr, title, trueB, width = 380, height = 240 }: {
  lams: number[]; paths: number[][]; upto: number; cursor: number; xr: [number, number]; yr: [number, number]; title: string; trueB?: number[]; width?: number; height?: number;
}) {
  return (
    <Plot x={xr} y={yr} width={width} height={height} xLabel="log₁₀ λ  (stronger penalty →)" yLabel="coefficient (standardised)" xTicks={5} yTicks={5}>
      {(s) => <>
        <Seg s={s} x1={xr[0]} x2={xr[1]} y1={0} y2={0} color={C.grey} width={1} />
        {FEATS.map((_, j) => {
          const d = lams.slice(0, upto + 1).map((l, k) => `${k ? 'L' : 'M'}${s.sx(Math.log10(l))},${s.sy(paths[k][j])}`).join('');
          return <path key={j} d={d} fill="none" stroke={SERIES[j]} strokeWidth={2.2} />;
        })}
        {trueB && trueB.map((b, j) => <Seg key={'t' + j} s={s} x1={xr[0]} x2={xr[0] + (xr[1] - xr[0]) * 0.03} y1={b} y2={b} color={SERIES[j]} width={4} />)}
        <Seg s={s} x1={cursor} x2={cursor} y1={yr[0]} y2={yr[1]} color={C.gold} dash="4 4" />
        <Label s={s} x={xr[0] + (xr[1] - xr[0]) * 0.06} y={yr[1] - (yr[1] - yr[0]) * 0.08} color={C.text} size={13}>{title}</Label>
      </>}
    </Plot>
  );
}

/* ---------- Animate ---------- */
function BudgetPaths({ bp, cur, yr, title }: { bp: ReturnType<typeof budgetPath>; cur: number; yr: [number, number]; title: string }) {
  const shown = bp.filter((q) => q.s >= cur - 1e-9);
  return (
    <Plot x={[1, 0]} y={yr} width={380} height={240} xLabel="budget used  ‖β‖ / ‖β_LS‖  (stronger penalty →)" yLabel="coefficient (standardised)" xTicks={5} yTicks={5}>
      {(s) => <>
        <Seg s={s} x1={1} x2={0} y1={0} y2={0} color={C.grey} width={1} />
        {FEATS.map((_, j) => <path key={j} d={shown.map((q, k) => `${k ? 'L' : 'M'}${s.sx(q.s)},${s.sy(q.b[j])}`).join('')} fill="none" stroke={SERIES[j]} strokeWidth={2.2} />)}
        <Seg s={s} x1={cur} x2={cur} y1={yr[0]} y2={yr[1]} color={C.gold} dash="4 4" />
        <Label s={s} x={0.02} y={yr[1] - (yr[1] - yr[0]) * 0.08} color={C.text} size={13} anchor="end">{title}</Label>
      </>}
    </Plot>
  );
}

function Animate() {
  const geo = useMemo(twoFeature, []);
  const data = useMemo(() => prepare(flats(40, 3)), []);
  const bpR = useMemo(() => budgetPath('ridge', data.Z, data.y), [data]);
  const bpL = useMemo(() => budgetPath('lasso', data.Z, data.y), [data]);
  const fr = [1, 1, 0.92, 0.84, 0.76, 0.68, 0.6, 0.52, 0.44, 0.36, 0.28, 0.2, 0.12, 0.05, 0, 0];
  const p = useStepPlayer(fr.length, 1600);
  const frac = fr[p.i];
  const R = useMemo(() => atBudget('ridge', geo.Z, geo.y, frac), [geo, frac]);
  const L = useMemo(() => atBudget('lasso', geo.Z, geo.y, frac), [geo, frac]);
  const bR = R.b, bL = L.b;
  const near = (bp: ReturnType<typeof budgetPath>) => bp.reduce((a, q) => (Math.abs(q.s - frac) < Math.abs(a.s - frac) ? q : a));
  const big7 = near(bpL), nzL = big7.b.filter((v) => Math.abs(v) > 1e-6).length;
  const yAll = [...bpR.flatMap((q) => q.b), ...bpL.flatMap((q) => q.b)], yr: [number, number] = [Math.min(...yAll) - 0.08, Math.max(...yAll) + 0.12];
  const show = p.i > 0;
  const off = FEATS.filter((_, j) => Math.abs(big7.b[j]) < 1e-6);
  const caption = (() => {
    if (p.i === 0) return <>Two standardised features, area and bedrooms (correlation {geo.rho.toFixed(2)}). Each red oval is a <b>contour of the squared-error loss</b>: every (β₁, β₂) on one oval fits the data equally well. Plain least squares picks the centre, <b>β̂ = ({geo.ols[0].toFixed(2)}, {geo.ols[1].toFixed(2)})</b>.</>;
    if (p.i === 1) return <>Regularisation puts a <b>budget</b> on coefficient size. Ridge's budget is a <b>circle</b> (β₁² + β₂² ≤ t), Lasso's a <b>diamond</b> (|β₁| + |β₂| ≤ t). The answer is the point inside the budget with the lowest loss: where the teal region <b>first touches</b> an oval. With the full budget that is still β̂.</>;
    if (p.i === fr.length - 1) return <><b>Summary.</b> Ridge (circle) shrinks every coefficient smoothly and keeps them all, sharing credit between the twin area features. Lasso (diamond) has <b>corners on the axes</b>, so the touching point often lands on a corner: coefficients become <b>exactly zero</b> and the model selects features. A bigger λ means a smaller budget; choose it by cross-validation.</>;
    if (frac === 0) return <>Zero budget (λ → ∞): both models set every coefficient to 0 and simply predict the average price.</>;
    const bed0 = Math.abs(bL[1]) < 1e-6;
    if (bed0) return <>Budget {Math.round(frac * 100)}%: the diamond's <b>corner</b> on the β₁ axis is where it touches the oval, so Lasso sets <b>β₂ (bedrooms) = 0 exactly</b>. Ridge's circle has no corners: it keeps β₂ = {bR[1].toFixed(3)}. Below, Lasso has switched off {off.length} of 7 features{off.length ? ` (${off.join(', ')})` : ''}.</>;
    return <>Budget cut to <b>{Math.round(frac * 100)}%</b> of least squares (λ: ridge {fmtLam(R.lam)}, lasso {fmtLam(L.lam)}). The teal region shrinks, so the touching point (yellow) slides to a worse oval, closer to the origin. In the 7-feature paths below, coefficients fan in towards zero{off.length ? <>; Lasso has already zeroed <b>{off.join(', ')}</b></> : ''}.</>;
  })();
  const half = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 8 } as const;
  return (
    <div>
      <Layout
        main={<>
          <div style={half}>
            <Geometry geo={geo} m="ridge" beta={show ? bR : geo.ols} show={show} />
            <Geometry geo={geo} m="lasso" beta={show ? bL : geo.ols} show={show} />
          </div>
          <div className="small muted" style={{ margin: '6px 0 2px' }}>Coefficient paths on 40 flats with 7 candidate features (drawn up to the current budget)</div>
          <div style={half}>
            <BudgetPaths bp={bpR} cur={frac} yr={yr} title="Ridge" />
            <BudgetPaths bp={bpL} cur={frac} yr={yr} title="Lasso" />
          </div>
          <Legend items={FEATS.map((f, j) => [f, SERIES[j]] as [string, string])} />
        </>}
        side={<>
          <Readout items={[
            ['budget left', `${Math.round(frac * 100)}%`, C.teal],
            ['ridge λ', show ? (isFinite(R.lam) ? fmtLam(R.lam) : '∞') : '0'],
            ['lasso λ', show ? (isFinite(L.lam) ? fmtLam(L.lam) : '∞') : '0'],
            ['ridge (β₁, β₂)', (show ? bR : geo.ols).map((v) => v.toFixed(2)).join(', '), C.yellow],
            ['lasso (β₁, β₂)', (show ? bL : geo.ols).map((v) => v.toFixed(2)).join(', '), C.yellow],
            ['lasso: features kept', `${show ? nzL : 7} / 7`, show && nzL < 7 ? C.gold : C.text],
            ['ridge: features kept', frac === 0 ? '0 / 7' : '7 / 7'],
          ]} />
          <Legend items={[['loss contours', C.red], ['budget region', C.teal], ['chosen coefficients', C.yellow]]} />
          <p className="small muted" style={{ margin: 0 }}>"Budget" and "λ" are two views of the same thing: every λ corresponds to a budget t, and a bigger λ means a smaller t.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caption}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
const PG = 40, PLAMS = Array.from({ length: PG }, (_, k) => 10 ** (-3 + (4.5 * k) / (PG - 1)));

function Playground() {
  const [m, setM] = useState<Method>('lasso');
  const [logLam, setLogLam] = useState(-1.2);
  const [n, setN] = useState(15);
  const [seed, setSeed] = useState(5);
  const d = useMemo(() => prepare(flats(n, seed), flats(400, 900 + seed)), [n, seed]);
  const paths = useMemo(() => path(m, d.Z, d.y, PLAMS), [m, d]);
  const errs = useMemo(() => paths.map((b) => ({ tr: rmse(predict(d.Z, b), d.y), te: rmse(predict(d.Zt, b), d.yt) })), [paths, d]);
  const lam = 10 ** logLam;
  const beta = fitM(m, d.Z, d.y, lam);
  const tr = rmse(predict(d.Z, beta), d.y), te = rmse(predict(d.Zt, beta), d.yt);
  const ols = ridgeFit(d.Z, d.y, 1e-9), teOls = rmse(predict(d.Zt, ols), d.yt);
  const bestK = errs.reduce((a, e, k) => (e.te < errs[a].te ? k : a), 0);
  const eMax = Math.max(1.2, ...errs.map((e) => e.te)) * 1.05;
  const yAll = [...paths.flat(), ...d.trueStd], yr: [number, number] = [Math.min(...yAll) - 0.1, Math.max(...yAll) + 0.1];
  return (
    <Layout
      main={<>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 8 }}>
          <Plot x={[-0.6, 6.6]} y={yr} width={380} height={280} xLabel="feature" yLabel="coefficient (standardised)" xTicks={7} fx={(v) => (Number.isInteger(v) && v >= 0 && v < 7 ? 'ABCDEFG'[v] : '')}>
            {(s) => <>
              <Seg s={s} x1={-0.6} x2={6.6} y1={0} y2={0} color={C.grey} width={1} />
              {beta.map((b, j) => <rect key={j} x={s.sx(j - 0.3)} width={s.sx(j + 0.3) - s.sx(j - 0.3)} y={Math.min(s.sy(b), s.sy(0))} height={Math.abs(s.sy(b) - s.sy(0))} fill={SERIES[j]} rx={2} />)}
              {d.trueStd.map((b, j) => <Seg key={j} s={s} x1={j - 0.42} x2={j + 0.42} y1={b} y2={b} color={C.green} width={2.5} dash="5 3" />)}
              {ols.map((b, j) => <Seg key={'o' + j} s={s} x1={j - 0.42} x2={j + 0.42} y1={b} y2={b} color={C.red} width={1.5} />)}
            </>}
          </Plot>
          <PathPlot lams={PLAMS} paths={paths} upto={PG - 1} cursor={logLam} xr={[-3, 1.5]} yr={yr} title={m === 'ridge' ? 'Ridge path' : m === 'lasso' ? 'Lasso path' : 'Elastic-net path'} height={280} />
        </div>
        <div className="small muted">Bars: A built-up area · B carpet area · C age · D floor · E metro distance · F, G pure noise. Green dashes = true effect, red = plain least squares.</div>
        <Plot x={[-3, 1.5]} y={[0, eMax]} height={200} xLabel="log₁₀ λ" yLabel="RMSE (price SDs)" xTicks={5} yTicks={4}>
          {(s) => <>
            <path d={errs.map((e, k) => `${k ? 'L' : 'M'}${s.sx(Math.log10(PLAMS[k]))},${s.sy(e.tr)}`).join('')} fill="none" stroke={C.blue} strokeWidth={2.2} />
            <path d={errs.map((e, k) => `${k ? 'L' : 'M'}${s.sx(Math.log10(PLAMS[k]))},${s.sy(e.te)}`).join('')} fill="none" stroke={C.purple} strokeWidth={2.2} />
            <Dots s={s} pts={[{ x: Math.log10(PLAMS[bestK]), y: errs[bestK].te }]} color={C.green} r={6} animate={false} />
            <Seg s={s} x1={logLam} x2={logLam} y1={0} y2={eMax} color={C.gold} dash="4 4" />
            <Label s={s} x={-2.9} y={eMax * 0.9} color={C.muted} size={12}>blue = training error · purple = error on 400 new flats · green = best λ</Label>
          </>}
        </Plot>
      </>}
      side={<>
        <Choice label="Penalty" value={m} onChange={setM} options={[{ value: 'ridge', label: 'Ridge (L2)' }, { value: 'lasso', label: 'Lasso (L1)' }, { value: 'enet', label: 'Elastic net' }]} />
        <Slider label="log₁₀ λ" min={-3} max={1.5} step={0.05} value={logLam} onChange={setLogLam} format={(v) => `${v.toFixed(2)} (λ=${fmtLam(10 ** v)})`} />
        <Slider label="training flats" min={12} max={200} value={n} onChange={setN} />
        <button className="btn" onClick={() => setSeed(seed + 1)}>🎲 New sample</button>
        <Readout items={[
          ['features kept', `${beta.filter((b) => Math.abs(b) > 1e-6).length} / 7`, C.gold],
          ['train RMSE', tr.toFixed(3), C.blue],
          ['test RMSE', te.toFixed(3), C.purple],
          ['least-squares test RMSE', teOls.toFixed(3), C.red],
          ['best λ (test)', fmtLam(PLAMS[bestK]), C.green],
        ]} />
        <p className="small muted" style={{ margin: 0 }}>With only ~15 flats, least squares gives the twin area features huge opposite-signed coefficients. A little penalty fixes that and lowers test error.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Top: the classic picture of **Ridge (circle)** and **Lasso (diamond)** budgets touching the red loss contours for two features. Bottom: the **coefficient paths** of a 7-feature flat-price model as the penalty λ grows.', steps: [
      { do: 'Read the first two frames.', notice: 'Least squares sits at the centre of the ovals; the penalty forces the answer inside the teal budget.' },
      { do: 'Press **▶ Play** and watch the yellow dots.', notice: 'Both move towards the origin; the lasso dot snaps onto the β₁ axis (a corner), making β₂ exactly 0.' },
      { do: 'Watch the two path charts fill in.', notice: 'Ridge curves glide towards zero together; lasso lines hit zero one by one (the noise features first).' },
    ] },
    Playground: { what: 'Choose a penalty and λ for the 7-feature flat-price model; see coefficients, their full path and train/test error across all λ.', steps: [
      { do: 'Set **training flats** to about 15 and **log₁₀ λ** to −3 (almost no penalty).', notice: 'Red least-squares marks for carpet vs built-up area are big and opposite in sign; test error is high.' },
      { do: 'Slide **log₁₀ λ** to the green best point.', notice: 'Test error (purple) dips: a bit of bias buys a large cut in variance.' },
      { do: 'Switch between **Ridge** and **Lasso** at the same λ.', notice: 'Lasso zeroes the noise features (F, G) and one of the twin area features; ridge keeps all seven, small but non-zero.' },
    ] },
  },
};
export default anim;
