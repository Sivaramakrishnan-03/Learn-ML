// Widgets for chapters 17–20: regularisation, end-to-end pipeline, model card, diagnose-this-model.
import { useMemo, useState } from 'react';
import { contours, geoPath } from 'd3';
import { AD } from '../../lib/advertising';
import { rng, gauss } from '../../lib/datasets';
import * as S from '../../lib/stats';
import { C, CoefTable, DiagPlots, Dots, Path, Plot, Sc, Seg, Slider, Stat, TestTable, downloadText, extent, fmt } from '../ui';
import { CANDS } from './widgets4';
import { Violation, simulate } from './sim';

const y = AD.map((d) => d.sales);
const n = y.length;

/* ---------- Ch17: regularisation ---------- */
type Pen = 'ridge' | 'lasso' | 'enet';
const ALPHAS = Array.from({ length: 36 }, (_, i) => 10 ** (-3 + (i * 4.5) / 35));
const NOISE = (() => { const r = rng(11); return Array.from({ length: 10 }, () => AD.map(() => gauss(r))); })();
const FEATS = [...CANDS, ...NOISE.map((v, j) => ({ name: `noise${j}`, v }))];
const FCOL = [C.blue, C.gold, C.purple, C.green, C.red];

function fitPen(Z: S.Mat, yy: number[], pen: Pen, a: number, warm?: number[]) {
  if (pen === 'ridge') return S.ridge(Z, yy, a * Z.length);                    // same α scale as sklearn's Lasso/ElasticNet objective
  return S.elasticNet(Z, yy, a, pen === 'lasso' ? 1 : 0.5, 3000, 1e-8, warm);
}

export function RegLab() {
  const [pen, setPen] = useState<Pen>('lasso');
  const [ai, setAi] = useState(18);
  const Z = useMemo(() => S.standardize(FEATS.map((f) => f.v)).Z, []);
  const path = useMemo(() => {
    let warm: number[] | undefined;
    return [...ALPHAS].reverse().map((a) => { const f = fitPen(Z, y, pen, a, warm); warm = f.coef; return f; }).reverse();
  }, [pen]);
  const cv = useMemo(() => {
    const folds = S.kfold(n, 5, 2);
    return ALPHAS.map((a) => {
      const errs = folds.map((te) => {
        const ts = new Set(te), tr = Z.map((_, i) => i).filter((i) => !ts.has(i));
        const f = fitPen(tr.map((i) => Z[i]), tr.map((i) => y[i]), pen, a);
        return S.mean(te.map((i) => (y[i] - f.intercept - S.dot(Z[i], f.coef)) ** 2));
      });
      const m = S.mean(errs), se = Math.sqrt(errs.reduce((s, e) => s + (e - m) ** 2, 0) / (errs.length - 1)) / Math.sqrt(errs.length);
      return { m, se };
    });
  }, [pen]);
  const iMin = cv.reduce((b, c, i) => (c.m < cv[b].m ? i : b), 0);
  let i1se = iMin;
  cv.forEach((c, i) => { if (i > i1se && c.m <= cv[iMin].m + cv[iMin].se) i1se = i; });
  const cur = path[ai];
  const nz = cur.coef.filter((c) => Math.abs(c) > 1e-6).length;
  const la = (i: number) => Math.log10(ALPHAS[i]);
  const cmax = Math.max(...path[0].coef.map(Math.abs)) * 1.05;
  return (
    <div className="widget">
      <div className="widget-h"><span className="tag">LAB</span> 5 real features + 10 pure-noise features, all standardised<span className="spacer" />
        <Seg value={pen} onChange={setPen} options={[{ v: 'ridge', label: 'Ridge (L2)' }, { v: 'lasso', label: 'Lasso (L1)' }, { v: 'enet', label: 'Elastic Net (50/50)' }]} /></div>
      <Slider label="log₁₀ α" value={ai} min={0} max={ALPHAS.length - 1} step={1} onChange={setAi} fmt={(i) => la(i).toFixed(2)} />
      <button className="btn" onClick={() => setAi(iMin)}>jump to min-CV α</button> <button className="btn" onClick={() => setAi(i1se)}>jump to 1-SE α</button>
      <div className="two" style={{ marginTop: 10 }}>
        <Plot x={[-3, 1.5]} y={[-cmax, cmax]} xLabel="log₁₀ α  (→ stronger penalty)" yLabel="coefficient (per SD)" title="Coefficient path">
          {(sx, sy) => <>
            {FEATS.map((f, j) => <Path key={f.name} sx={sx} sy={sy} pts={path.map((p, i) => ({ x: la(i), y: p.coef[j] }))} color={j < 5 ? FCOL[j] : '#556070'} width={j < 5 ? 2.2 : 1} />)}
            <line x1={sx(la(ai))} x2={sx(la(ai))} y1={sy.range()[0]} y2={sy.range()[1]} stroke={C.yellow} strokeDasharray="3 3" />
          </>}
        </Plot>
        <div>
          <Plot x={[-3, 1.5]} y={[Math.sqrt(Math.min(...cv.map((c) => c.m))) * 0.95, Math.min(Math.sqrt(Math.max(...cv.map((c) => c.m))) * 1.02, 6)]} w={380} h={220} xLabel="log₁₀ α" yLabel="CV RMSE" title="5-fold cross-validation">
            {(sx, sy) => <>
              {cv.map((c, i) => <line key={i} x1={sx(la(i))} x2={sx(la(i))} y1={sy(Math.sqrt(Math.max(0, c.m - c.se)))} y2={sy(Math.sqrt(c.m + c.se))} stroke="#3a4558" />)}
              <Path sx={sx} sy={sy} pts={cv.map((c, i) => ({ x: la(i), y: Math.sqrt(c.m) }))} color={C.red} />
              <line x1={sx(la(iMin))} x2={sx(la(iMin))} y1={sy.range()[0]} y2={sy.range()[1]} stroke={C.green} strokeDasharray="4 3" />
              <line x1={sx(la(i1se))} x2={sx(la(i1se))} y1={sy.range()[0]} y2={sy.range()[1]} stroke={C.teal} strokeDasharray="2 3" />
              <circle cx={sx(la(ai))} cy={sy(Math.sqrt(cv[ai].m))} r={5} fill={C.yellow} />
            </>}
          </Plot>
          <div className="legend">{CANDS.map((c, j) => <span key={c.name}><span className="dot" style={{ background: FCOL[j] }} />{c.name}</span>)}<span><span className="dot" style={{ background: '#556070' }} />noise</span></div>
          <div className="stats">
            <Stat label="non-zero coefs" value={`${nz} / ${FEATS.length}`} color={pen === 'ridge' ? undefined : C.yellow} />
            <Stat label="CV RMSE" value={Math.sqrt(cv[ai].m).toFixed(3)} />
          </div>
        </div>
      </div>
      <p className="small">{pen === 'ridge' ? 'Ridge shrinks every coefficient smoothly towards zero, but none reaches exactly zero. It is great for collinear features, useless for selection.' : pen === 'lasso' ? 'Lasso drives coefficients to exactly zero one by one: built-in feature selection. Noise goes first. Watch which real feature survives longest.' : 'Elastic Net mixes both: it selects like the Lasso but keeps groups of correlated features together like Ridge.'} Green dashed = minimum CV error; teal = the <b>1-SE rule</b> (the simplest model within one standard error of the best).</p>
      <GeometryPanel pen={pen} a={ALPHAS[ai]} />
    </div>
  );
}

function ContourLayer({ sx, sy, f, xr, yr, nx = 60 }: { sx: Sc; sy: Sc; f: (a: number, b: number) => number; xr: [number, number]; yr: [number, number]; nx?: number }) {
  const vals: number[] = [];
  for (let j = 0; j < nx; j++) for (let i = 0; i < nx; i++) vals.push(Math.log(f(xr[0] + (i / (nx - 1)) * (xr[1] - xr[0]), yr[1] - (j / (nx - 1)) * (yr[1] - yr[0]))));
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const th = Array.from({ length: 12 }, (_, k) => lo + ((hi - lo) * (k + 0.3)) / 12);
  const kx = (sx(xr[1]) - sx(xr[0])) / (nx - 1), ky = (sy(yr[0]) - sy(yr[1])) / (nx - 1);
  return <g transform={`translate(${sx(xr[0])},${sy(yr[1])}) scale(${kx},${ky}) translate(-0.5,-0.5)`}>
    {contours().size([nx, nx]).thresholds(th)(vals).map((c, k) => <path key={k} d={geoPath()(c as any) || ''} fill="none" stroke={`hsl(${200 - k * 12} 60% ${35 + k * 3}%)`} strokeWidth={1} vectorEffect="non-scaling-stroke" />)}
  </g>;
}

/** Boundary of {b : 0.5·|b|₁ + 0.25·|b|² ≤ T}, the 50/50 elastic-net budget, traced by angle. */
function enetBoundary(T: number) {
  return Array.from({ length: 145 }, (_, i) => {
    const th = (i / 144) * 2 * Math.PI, c = Math.cos(th), s = Math.sin(th), A = 0.5 * (Math.abs(c) + Math.abs(s));
    const r = (-A + Math.sqrt(A * A + T)) / 0.5;
    return [r * c, r * s];
  });
}

function GeometryPanel({ pen, a }: { pen: Pen; a: number }) {
  const Z = useMemo(() => S.standardize([AD.map((d) => d.tv), AD.map((d) => d.radio)]).Z, []);
  const ols = S.matvec(S.inverse(S.gram(Z)), S.xty(Z, y.map((v) => v - S.mean(y))));
  const sol = fitPen(Z, y, pen, a).coef;
  const ym = S.mean(y);
  const rss = (b1: number, b2: number) => Z.reduce((s, r, i) => s + (y[i] - ym - r[0] * b1 - r[1] * b2) ** 2, 0) + 1;
  const t1 = Math.abs(sol[0]) + Math.abs(sol[1]), t2 = Math.hypot(sol[0], sol[1]);
  const xr: [number, number] = [-1, 6], yr: [number, number] = [-1, 4];
  return (
    <div className="two" style={{ marginTop: 12 }}>
      <Plot x={xr} y={yr} w={460} h={330} xLabel="β_TV (standardised)" yLabel="β_radio (standardised)" title="Why the Lasso hits zero: RSS ellipses meet the constraint">
        {(sx, sy) => <>
          <ContourLayer sx={sx} sy={sy} f={rss} xr={xr} yr={yr} />
          <line x1={sx(0)} x2={sx(0)} y1={sy.range()[0]} y2={sy.range()[1]} stroke="#3a4558" />
          <line x1={sx.range()[0]} x2={sx.range()[1]} y1={sy(0)} y2={sy(0)} stroke="#3a4558" />
          {pen === 'ridge' ? <circle cx={sx(0)} cy={sy(0)} r={sx(t2) - sx(0)} fill={C.blue} fillOpacity={0.18} stroke={C.blue} />
            : pen === 'lasso' ? <polygon points={[[t1, 0], [0, t1], [-t1, 0], [0, -t1]].map(([u, v]) => `${sx(u)},${sy(v)}`).join(' ')} fill={C.gold} fillOpacity={0.18} stroke={C.gold} />
              : <path d={enetBoundary(0.5 * t1 + 0.25 * t2 * t2).map(([u, v], i) => `${i ? 'L' : 'M'}${sx(u)},${sy(v)}`).join('') + 'Z'} fill={C.purple} fillOpacity={0.18} stroke={C.purple} />}
          <circle cx={sx(ols[0])} cy={sy(ols[1])} r={5} fill={C.green} />
          <circle cx={sx(sol[0])} cy={sy(sol[1])} r={6} fill={C.yellow} stroke="#0b0e13" />
        </>}
      </Plot>
      <div className="small">
        <p>Penalised regression = least squares <b>inside a budget</b> for the coefficients. The solution (yellow) is where the smallest RSS ellipse touches the budget region. The green dot is unconstrained OLS.</p>
        <p><b style={{ color: C.blue }}>Ridge</b>: the region is a circle, with no corners. The touch point is almost never on an axis, so coefficients shrink but stay non-zero.</p>
        <p><b style={{ color: C.gold }}>Lasso</b>: the region is a diamond with corners <i>on the axes</i>. Ellipses usually hit a corner first, and a corner means a coefficient is exactly 0. Raise α to watch β_radio snap to 0.</p>
        <p className="mono">β = ({sol[0].toFixed(3)}, {sol[1].toFixed(3)})</p>
      </div>
    </div>
  );
}

/* ---------- Ch18: end-to-end pipeline ---------- */
const STAGES = ['EDA', 'Baseline', 'Diagnose', 'Fix', 'Select', 'Validate', 'Report'] as const;
export function PipelineStepper() {
  const [st, setSt] = useState(0);
  const P = useMemo(() => {
    const idx = S.kfold(n, 4, 9); const test = new Set(idx[0]);
    const tr = AD.map((_, i) => i).filter((i) => !test.has(i)), te = [...test];
    const mk = (rows: number[], spec: 'base' | 'tvr' | 'final') => rows.map((i) => {
      const d = AD[i];
      return spec === 'base' ? [1, d.tv, d.radio, d.newspaper] : spec === 'tvr' ? [1, d.tv, d.radio] : [1, d.tv, d.radio, d.tv * d.tv, d.tv * d.radio];
    });
    const ytr = tr.map((i) => y[i]), yte = te.map((i) => y[i]);
    const names = { base: ['const', 'TV', 'radio', 'newspaper'], tvr: ['const', 'TV', 'radio'], final: ['const', 'TV', 'radio', 'TV²', 'TV×radio'] };
    const fits = (['base', 'tvr', 'final'] as const).map((s) => {
      const X = mk(tr, s), res = S.ols(X, ytr, names[s]);
      const pred = mk(te, s).map((r) => S.dot(r, res.beta));
      return { s, X, res, pred, test: S.regMetrics(yte, pred), cv: S.crossVal(X, ytr, 5, S.olsFit, 1) };
    });
    const [b, , f] = fits;
    return { tr, te, ytr, yte, fits, b, f, bp: S.breuschPagan(b.X, b.res), reset: S.reset(b.X, ytr, b.res), bpF: S.breuschPagan(f.X, f.res), resetF: S.reset(f.X, ytr, f.res), hc3: S.robustSE(f.X, f.res, 'HC3') };
  }, []);
  const { b, f } = P;
  const fb = f.res.beta;
  const slope = (r: number) => fb[1] + 2 * fb[3] * 150 + fb[4] * r;
  return (
    <div className="widget">
      <div className="widget-h"><span className="tag">PIPELINE</span> From raw data to a defensible model ({P.tr.length} train / {P.te.length} test markets)</div>
      <div className="pipe" style={{ marginBottom: 14 }}>
        {STAGES.map((s, i) => <button key={s} className={`stage ${i === st ? 'on' : i < st ? 'done' : ''}`} onClick={() => setSt(i)}>{i + 1}. {s}</button>)}
      </div>
      {st === 0 && <div className="two">
        <Plot x={[0, 300]} y={[0, 30]} xLabel="TV ($k)" yLabel="sales" title="TV vs sales, coloured by radio budget">
          {(sx, sy) => <Dots sx={sx} sy={sy} xs={P.tr.map((i) => AD[i].tv)} ys={P.ytr} r={3} color={(k) => `hsl(${200 - AD[P.tr[k]].radio * 3.6} 70% 60%)`} />}
        </Plot>
        <div className="small"><p><b>Questions first:</b> which channels drive sales, by how much, and how should we split next quarter's budget?</p>
          <ul><li>TV: strong, slightly bending relationship; spread grows with TV (funnel).</li><li>Radio: the colour gradient shows that markets with more radio sit higher <i>for the same TV</i>, a hint of synergy.</li><li>Newspaper correlates 0.45 with radio, so expect confounding.</li><li>No missing values, no impossible budgets. The test set is locked away <b>now</b>, before any modelling.</li></ul></div>
      </div>}
      {st === 1 && <div><CoefTable res={b.res} caption="Baseline: sales ~ TV + radio + newspaper (training data)" /><p className="small">A respectable R², but don't stop here. Newspaper is not significant. Before believing any p-value, check the assumptions.</p></div>}
      {st === 2 && <div className="two"><DiagPlots X={b.X} res={b.res} compact only={['rvf', 'sl']} />
        <div><TestTable rows={[
          { name: 'RESET', checks: 'functional form', stat: P.reset.stat, p: P.reset.p, verdict: P.reset.p < 0.05 ? 'bad' : 'ok' },
          { name: 'Breusch–Pagan', checks: 'constant variance', stat: P.bp.stat, p: P.bp.p, verdict: P.bp.p < 0.05 ? 'bad' : 'ok' },
        ]} /><p className="small">The U-shaped residual curve plus RESET say a term is missing: curvature or an interaction. The rising scale-location line plus Breusch–Pagan say the variance grows with the fitted value.</p></div></div>}
      {st === 3 && <div><CoefTable res={f.res} robust={P.hc3} caption="Fixed: sales ~ TV + radio + TV² + TV×radio, with HC3 robust SEs (newspaper dropped)" />
        <p className="small">Theory-driven fixes: <b>TV²</b> for diminishing returns, <b>TV×radio</b> for synergy, newspaper dropped (partial F p &gt; 0.5), and HC3 standard errors because the funnel remains (BP p = {S.fmtP(P.bpF.p)}). RESET p is now {S.fmtP(P.resetF.p)}.</p></div>}
      {st === 4 && <div className="tbl-wrap"><table className="tbl mono">
        <thead><tr><th>model</th><th>p</th><th>adj R²</th><th>AIC</th><th>BIC</th><th>5-fold CV RMSE</th></tr></thead>
        <tbody>{P.fits.map((q) => <tr key={q.s} className={q.s === 'final' ? 'hl' : ''}><td>{q.res.names.slice(1).join(' + ')}</td><td>{q.res.k - 1}</td><td>{q.res.adjR2.toFixed(3)}</td><td>{q.res.aic.toFixed(1)}</td><td>{q.res.bic.toFixed(1)}</td><td>{q.cv.rmse.toFixed(3)}</td></tr>)}</tbody>
      </table><p className="small">All four criteria agree. That's reassuring, because when AIC, BIC and CV disagree, the data can't separate the models and you should pick the simpler or the more interpretable one.</p></div>}
      {st === 5 && <div className="two">
        <Plot x={[0, 30]} y={[0, 30]} xLabel="predicted sales" yLabel="actual sales" title="Test set: predicted vs actual (final model)">
          {(sx, sy) => <><Path sx={sx} sy={sy} pts={[{ x: 0, y: 0 }, { x: 30, y: 30 }]} color={C.muted} dash="4 4" /><Dots sx={sx} sy={sy} xs={f.pred} ys={P.yte} r={3.5} color={C.green} /></>}
        </Plot>
        <div><div className="stats"><Stat label="baseline test RMSE" value={b.test.rmse.toFixed(3)} /><Stat label="final test RMSE" value={f.test.rmse.toFixed(3)} color={C.green} /></div>
          <div className="stats"><Stat label="baseline MAE" value={b.test.mae.toFixed(3)} /><Stat label="final MAE" value={f.test.mae.toFixed(3)} color={C.green} /><Stat label="final test R²" value={f.test.r2.toFixed(3)} /></div>
          <p className="small">The test set is used <b>once</b>, at the very end. Error falls by {((1 - f.test.rmse / b.test.rmse) * 100).toFixed(0)}%. The CV estimate ({f.cv.rmse.toFixed(2)}) was a good guide to the true test error ({f.test.rmse.toFixed(2)}).</p></div>
      </div>}
      {st === 6 && <div className="small">
        <div className="eq mono">sales = {fb[0].toFixed(3)} + {fb[1].toFixed(4)}·TV + {fb[2].toFixed(4)}·radio {fb[3] < 0 ? '−' : '+'} {Math.abs(fb[3]).toExponential(2)}·TV² + {fb[4].toFixed(5)}·TV·radio</div>
        <ul>
          <li><b>TV has diminishing returns and is amplified by radio.</b> At TV = $150k, one more $1k of TV adds {(slope(5) * 1000).toFixed(0)} units when radio = $5k, but {(slope(45) * 1000).toFixed(0)} units when radio = $45k.</li>
          <li><b>Newspaper adds nothing</b> once TV and radio are known. Its apparent effect was radio's.</li>
          <li><b>Accuracy:</b> typical error ±{f.test.mae.toFixed(1)}k units (MAE) on unseen markets. Use prediction intervals, not point forecasts, for campaign planning.</li>
          <li><b>Caveats:</b> observational data (budgets weren't randomised), so these are associations; the funnel is handled with robust SEs; valid only inside the observed budget ranges.</li>
        </ul>
        <p className="muted">Chapter 19 turns this into a model documentation template.</p>
      </div>}
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn" disabled={st === 0} onClick={() => setSt(st - 1)}>← back</button>
        <button className="btn primary" disabled={st === STAGES.length - 1} onClick={() => setSt(st + 1)}>next stage →</button>
      </div>
    </div>
  );
}

/* ---------- Ch19: model card ---------- */
export function ModelCard() {
  const doc = useMemo(() => {
    const X = AD.map((d) => [1, d.tv, d.radio, d.tv * d.tv, d.tv * d.radio]);
    const names = ['Intercept', 'TV', 'radio', 'TV²', 'TV×radio'];
    const res = S.ols(X, y, names); const hc = S.robustSE(X, res, 'HC3');
    const inf = S.influence(X, res);
    const sw = S.shapiroWilk(res.resid), bp = S.breuschPagan(X, res), rs = S.reset(X, y, res), dw = S.durbinWatson(res.resid);
    const cv = S.crossVal(X, y, 10, S.olsFit, 1);
    const vif = S.vif(X.map((r) => [1, r[1], r[2]]));
    const tc = S.tQuantile(0.975, res.dfResid);
    const coefRows = names.map((nm, i) => `| ${nm} | ${fmt(res.beta[i], 6)} | ${fmt(hc[i], 6)} | ${fmt(res.beta[i] - tc * hc[i], 6)} – ${fmt(res.beta[i] + tc * hc[i], 6)} | ${S.fmtP(S.tPvalue(res.beta[i] / hc[i], res.dfResid))} |`).join('\n');
    const ok = (b: boolean) => (b ? '✅' : '⚠️');
    return { res, md: `# Model card: Sales response model (Advertising)

**Version** 1.0 · **Date** ${new Date().toISOString().slice(0, 10)} · **Owner** <name / team> · **Reviewer** <name> · **Status** draft

## 1. Purpose and intended use
- **Business question:** how do TV, radio and newspaper budgets relate to unit sales, and how should next quarter's budget be split?
- **Intended use:** budget scenario planning inside the observed ranges (TV $0–296k, radio $0–50k).
- **Not intended for:** causal claims without experiments; extrapolation beyond observed budgets; individual-store forecasts.

## 2. Data
- **Source:** synthetic replica of the ISLR Advertising data (200 markets), one row per market.
- **Target:** sales (thousand units). **Features:** TV, radio, newspaper budgets ($k).
- **Quality checks:** no missing values; no impossible budgets; ${inf.cooks.filter((c) => c > 4 / n).length} points above Cook's D 4/n, none above 0.5. Removing them does not change conclusions.

## 3. Model specification
- **Method:** ordinary least squares with HC3 heteroscedasticity-robust standard errors.
- **Equation:** sales = β0 + β1·TV + β2·radio + β3·TV² + β4·TV·radio + ε
- **Why this form:** RESET rejected the purely additive model; TV² captures diminishing returns; TV×radio captures cross-channel synergy (hierarchy principle respected). Newspaper dropped: partial F-test p > 0.5.
- **Alternatives considered:** additive OLS (AIC higher), all 31 subsets by AIC/BIC/CV, Lasso (1-SE rule picks the same core terms).

## 4. Results
| Term | Estimate | Robust SE (HC3) | 95% CI | p |
|---|---|---|---|---|
${coefRows}

- n = ${res.n}, R² = ${res.r2.toFixed(3)}, adj. R² = ${res.adjR2.toFixed(3)}, σ̂ = ${res.sigma.toFixed(3)}, AIC = ${res.aic.toFixed(1)}, BIC = ${res.bic.toFixed(1)}
- **10-fold CV:** RMSE = ${cv.rmse.toFixed(3)}, R² = ${cv.r2.toFixed(3)}

## 5. Assumption checks
| Assumption | Evidence | Result |
|---|---|---|
| Linearity / functional form | Residual-vs-fitted plot; RESET F p = ${S.fmtP(rs.p)} | ${ok(rs.p > 0.05)} |
| Independence | Durbin–Watson = ${dw.toFixed(2)}; cross-sectional markets | ${ok(dw > 1.5 && dw < 2.5)} |
| Constant variance | Scale-location plot; Breusch–Pagan p = ${S.fmtP(bp.p)} | ${ok(bp.p > 0.05)} ${bp.p <= 0.05 ? '→ handled with HC3 SEs' : ''} |
| Normality of errors | Q-Q plot; Shapiro–Wilk p = ${S.fmtP(sw.p)} | ${ok(sw.p > 0.05)} |
| Multicollinearity | VIF (main effects) = ${vif.map((v) => v.toFixed(2)).join(', ')}; polynomial terms are collinear by construction | ${ok(Math.max(...vif) < 5)} |
| Influential points | Max Cook's D = ${Math.max(...inf.cooks).toFixed(3)} | ${ok(Math.max(...inf.cooks) < 0.5)} |

## 6. Interpretation for stakeholders
- TV has diminishing returns and is **amplified by radio**: the marginal effect of TV rises with the radio budget.
- Newspaper spend shows no incremental association with sales once TV and radio are known.
- Typical forecast error: about ±${(cv.rmse).toFixed(1)}k units (RMSE). Plan with 95% prediction intervals, not point forecasts.

## 7. Limitations and risks
- Observational data: budgets were not randomised, so confounding (e.g. bigger markets get bigger budgets) is possible.
- Valid only within the observed budget ranges; saturation beyond TV ≈ $300k is unknown.
- Time effects, seasonality and competitor activity are not modelled.

## 8. Monitoring and maintenance
- Track monthly MAE against actuals; retrain if MAE exceeds ${(cv.rmse * 1.25).toFixed(2)} for two consecutive months.
- Re-run the assumption checks (Section 5) at every retrain. Log the data version and the code commit.

## 9. Reproducibility
- Code: \`statsmodels.formula.api.ols("sales ~ TV + radio + I(TV**2) + TV:radio", data).fit(cov_type="HC3")\`
- Random seeds: train/test split 9, CV folds 1. Environment: Python ≥ 3.10, statsmodels ≥ 0.14.
` };
  }, []);
  const [copied, setCopied] = useState(false);
  return (
    <div className="widget">
      <div className="widget-h"><span className="tag">TEMPLATE</span> Auto-filled model card for the final model<span className="spacer" />
        <button className="btn" onClick={() => { navigator.clipboard?.writeText(doc.md).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {}); }}>{copied ? '✓ Copied' : '📋 Copy Markdown'}</button>
        <button className="btn primary" onClick={() => downloadText('model-card-sales-response.md', doc.md, 'text/markdown')}>⬇ Download .md</button></div>
      <div className="md-out">{doc.md}</div>
    </div>
  );
}

/* ---------- Ch20: diagnose this model ---------- */
const CASES: { on: Violation[]; answer: string; why: string; seed: number; sev?: number }[] = [
  { on: ['curve'], answer: 'Missing curvature', seed: 31, why: 'A U-shaped (or arch-shaped) LOWESS line in residuals vs fitted means the mean structure is wrong. Add a polynomial term or transform x. RESET would reject.' },
  { on: ['hetero'], answer: 'Heteroscedasticity', seed: 32, why: 'Residual spread fans out as ŷ grows, and the scale-location line rises. Use HC3 robust SEs, WLS, or a log/Box-Cox transform of y.' },
  { on: ['autocorr'], answer: 'Autocorrelated errors', seed: 33, sev: 0.45, why: 'In the row-order plot, residuals come in runs: neighbours resemble each other, so positive follows positive. That is not a smooth U (curvature); it is clustering in time. Durbin–Watson is far below 2. Use HAC (Newey–West) SEs or model the time structure (ARIMA errors, lags).' },
  { on: ['skew'], answer: 'Non-normal (skewed) errors', seed: 34, why: 'The Q-Q plot bends away from the line at one end. With large n this mostly affects prediction intervals, not slopes. Consider transforming y or a GLM.' },
  { on: ['outlier'], answer: 'Influential outliers', seed: 35, why: "A few points sit beyond the Cook's distance contours in the leverage plot and drag the fit. Investigate them; refit with and without; consider robust regression (Huber)." },
  { on: [], answer: 'Healthy model', seed: 36, why: 'No pattern in any panel: flat LOWESS lines, points on the Q-Q line, nothing near the Cook contours. Ship it, and document the checks.' },
];
const OPTS = CASES.map((c) => c.answer);
export function DiagnoseExercises() {
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [score, setScore] = useState({ right: 0, done: 0 });
  const order = useMemo(() => [2, 0, 5, 1, 4, 3], []);
  const c = CASES[order[i]];
  const d = useMemo(() => simulate(c.on, c.sev ?? 0.85, 120, c.seed), [i]);
  const res = useMemo(() => S.ols(d.X, d.y), [d]);
  return (
    <div className="widget">
      <div className="widget-h"><span className="tag">EXERCISE</span> Diagnose this model ({i + 1}/{CASES.length}) · score {score.right}/{score.done}</div>
      <DiagPlots X={d.X} res={res} compact withOrder />
      <p className="small mono">Durbin–Watson = {S.durbinWatson(res.resid).toFixed(2)} (rows are in time order)</p>
      <div className="grid g3" style={{ marginTop: 8 }}>
        {OPTS.map((o) => <button key={o} disabled={pick !== null} className={`opt ${pick === null ? '' : o === c.answer ? 'right' : o === pick ? 'wrong' : ''}`}
          onClick={() => { setPick(o); setScore((s) => ({ right: s.right + (o === c.answer ? 1 : 0), done: s.done + 1 })); }}>{o}</button>)}
      </div>
      {pick && <div className="caption small">{pick === c.answer ? '✅ ' : `❌ It's "${c.answer}". `}{c.why}</div>}
      <div className="row" style={{ marginTop: 10 }}>
        {pick && i < CASES.length - 1 && <button className="btn primary" onClick={() => { setI(i + 1); setPick(null); }}>Next case →</button>}
        {pick && i === CASES.length - 1 && <button className="btn" onClick={() => { setI(0); setPick(null); setScore({ right: 0, done: 0 }); }}>Restart</button>}
      </div>
    </div>
  );
}

