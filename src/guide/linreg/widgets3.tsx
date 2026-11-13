// Widgets for chapters 9–12: inference, remedies, intervals, metrics.
import { useMemo, useState } from 'react';
import { AD } from '../../lib/advertising';
import { rng, gauss } from '../../lib/datasets';
import * as S from '../../lib/stats';
import { Band, C, CoefTable, DiagPlots, Dots, HLine, Path, Plot, Seg, Slider, Stat, TestTable, extent, fmt } from '../ui';
import { adModel } from './widgets2';

const y = AD.map((d) => d.sales);
const col = (k: 'tv' | 'radio' | 'newspaper') => AD.map((d) => d[k]);

/* ---------- Ch9: t-test picture ---------- */
export function TTestWidget() {
  const { res } = useMemo(() => adModel(), []);
  const [j, setJ] = useState(3);
  const t = res.t[j], df = res.dfResid;
  const lim = Math.max(4.5, Math.min(Math.abs(t) * 1.15, 40));
  const dens = (x: number) => Math.exp(S.lgamma((df + 1) / 2) - S.lgamma(df / 2)) / Math.sqrt(df * Math.PI) * (1 + (x * x) / df) ** (-(df + 1) / 2);
  const xs = Array.from({ length: 241 }, (_, i) => -lim + (2 * lim * i) / 240);
  const tc = S.tQuantile(0.975, df);
  const tail = (sgn: number) => { const a = Math.abs(t); const pts = xs.filter((x) => sgn * x >= a); return pts; };
  return (
    <div className="widget">
      <div className="widget-h"><span className="tag">VISUAL</span> What a p-value is, coefficient by coefficient<span className="spacer" />
        <Seg value={j} onChange={setJ} options={res.names.map((n, i) => ({ v: i, label: n }))} /></div>
      <div className="two">
        <Plot x={[-lim, lim]} y={[0, 0.42]} h={260} xLabel={`t statistic under H₀: β = 0   (df = ${df})`} yLabel="density">
          {(sx, sy) => <>
            {[-1, 1].map((sg) => { const p = tail(sg); return p.length > 1 && <path key={sg} d={`M${sx(p[0])},${sy(0)}` + p.map((x) => `L${sx(x)},${sy(dens(x))}`).join('') + `L${sx(p[p.length - 1])},${sy(0)}Z`} fill={C.red} fillOpacity={0.5} />; })}
            <Path sx={sx} sy={sy} pts={xs.map((x) => ({ x, y: dens(x) }))} color={C.blue} />
            {[-tc, tc].map((c) => <line key={c} x1={sx(c)} x2={sx(c)} y1={sy(0)} y2={sy(0.4)} stroke={C.gold} strokeDasharray="3 3" />)}
            {Math.abs(t) < lim && <line x1={sx(t)} x2={sx(t)} y1={sy(0)} y2={sy(0.41)} stroke={C.yellow} strokeWidth={2.5} />}
          </>}
        </Plot>
        <div>
          <div className="stats">
            <Stat label="β̂" value={fmt(res.beta[j])} />
            <Stat label="SE" value={fmt(res.se[j])} />
            <Stat label="t = β̂ / SE" value={t.toFixed(2)} color={C.yellow} />
            <Stat label="p-value" value={S.fmtP(res.p[j])} color={res.p[j] < 0.05 ? C.green : C.red} />
          </div>
          <p className="small">The blue curve is how t would be distributed <b>if the true coefficient were zero</b>. The red area is the p-value: the probability of seeing a t at least this extreme by pure chance. Gold lines: ±{tc.toFixed(2)}, the 5% cut-offs.</p>
          {j === 3 ? <p className="small" style={{ color: C.gold }}>Newspaper's t sits right in the middle of the null distribution. Nothing to distinguish it from zero, once TV and radio are in the model.</p>
            : Math.abs(t) > lim ? <p className="small muted">t = {t.toFixed(1)} is far off the chart. The p-value is astronomically small.</p> : null}
        </div>
      </div>
    </div>
  );
}

/* ---------- Ch9: ANOVA + nested F ---------- */
export function AnovaWidget() {
  const cols = ['tv', 'radio', 'newspaper'] as const;
  const fits = [S.ols(AD.map(() => [1]), y), ...cols.map((_, i) => S.ols(S.addConst(cols.slice(0, i + 1).map(col)), y))];
  const full = fits[3];
  const rows = cols.map((c, i) => { const ss = fits[i].ssr - fits[i + 1].ssr; const F = ss / full.sigma2; return { c, ss, F, p: S.fPvalue(F, 1, full.dfResid) }; });
  const nf = S.nestedF(fits[2], full);
  return (
    <div className="widget">
      <div className="widget-h"><span className="tag">REAL CASE</span> ANOVA table (Type I, sequential) and the partial F-test</div>
      <div className="tbl-wrap"><table className="tbl mono">
        <thead><tr><th>source</th><th>df</th><th>sum sq</th><th>mean sq</th><th>F</th><th>p</th></tr></thead>
        <tbody>
          {rows.map((r) => <tr key={r.c} className={r.p < 0.05 ? 'sig' : 'nsig'}><td>{r.c}</td><td>1</td><td>{r.ss.toFixed(2)}</td><td>{r.ss.toFixed(2)}</td><td>{r.F.toFixed(2)}</td><td>{S.fmtP(r.p)}</td></tr>)}
          <tr><td>residual</td><td>{full.dfResid}</td><td>{full.ssr.toFixed(2)}</td><td>{full.sigma2.toFixed(3)}</td><td></td><td></td></tr>
          <tr><td><b>total</b></td><td>{full.n - 1}</td><td>{full.sst.toFixed(2)}</td><td></td><td></td><td></td></tr>
        </tbody>
      </table></div>
      <p className="small">Read it top-down: TV explains {(rows[0].ss / full.sst * 100).toFixed(0)}% of the variation in sales. Radio, <i>added after TV</i>, explains another {(rows[1].ss / full.sst * 100).toFixed(0)}%. Newspaper, added last, explains {(rows[2].ss / full.sst * 100).toFixed(2)}%. Type I sums of squares depend on the order of the terms. Type II/III (each term "added last") don't.</p>
      <div className="stats">
        <Stat label="overall F (all slopes = 0?)" value={full.F.toFixed(1)} color={C.green} />
        <Stat label="partial F: newspaper" value={nf.F.toFixed(3)} />
        <Stat label="p" value={S.fmtP(nf.p)} color={C.red} />
      </div>
      <p className="small muted">With one restriction, partial F = t² ({full.t[3].toFixed(3)}² = {(full.t[3] ** 2).toFixed(3)}). The F-test shines when you test several coefficients at once, e.g. "do all 4 regional dummies matter?"</p>
    </div>
  );
}

/* ---------- Ch10: remedies ---------- */
type Remedy = 'none' | 'hc3' | 'wls' | 'log' | 'boxcox' | 'terms';
export function RemedyLab() {
  const [r, setR] = useState<Remedy>('none');
  const out = useMemo(() => {
    const tv = col('tv'), radio = col('radio');
    const X = S.addConst([tv, radio]);
    const base = S.ols(X, y, ['const', 'tv', 'radio']);
    let Xf = X, yf = y, res = base, robust: number[] | undefined, note = '';
    if (r === 'hc3') { robust = S.robustSE(X, base, 'HC3'); note = 'Same coefficients, honest standard errors. Note the TV SE grows: the classical SE was too optimistic.'; }
    if (r === 'wls') {
      const aux = S.ols(S.addConst([tv]), base.resid.map(Math.abs));
      const w = aux.fitted.map((f) => 1 / Math.max(0.05, f) ** 2);
      res = S.wls(X, y, w, ['const', 'tv', 'radio']);
      note = 'Weights = 1/σ̂ᵢ², with σ̂ᵢ modelled from |residual| ~ TV. Noisy markets count less. Efficient, but only if the variance model is right.';
      Xf = X.map((row, i) => row.map((v) => v * Math.sqrt(w[i]))); yf = y.map((v, i) => v * Math.sqrt(w[i]));
    }
    if (r === 'log' || r === 'boxcox') {
      const lam = r === 'log' ? 0 : S.boxcoxLambda(y);
      yf = S.boxcoxTransform(y, lam); res = S.ols(X, yf, ['const', 'tv', 'radio']);
      note = r === 'log' ? 'log(sales): the coefficients are now ≈ % changes. TV: +1 ($k) ≈ +' + (res.beta[1] * 100).toFixed(2) + '% sales.' : `MLE λ = ${lam.toFixed(3)}. Box-Cox stabilises the variance, but the coefficients lose their business meaning.`;
    }
    if (r === 'terms') {
      Xf = S.addConst([tv, radio, tv.map((v) => v * v), tv.map((v, i) => v * radio[i])]);
      res = S.ols(Xf, y, ['const', 'tv', 'radio', 'tv²', 'tv×radio']);
      note = 'Fix the cause, not the symptom: adding the curvature and the TV × radio synergy removes most of the residual pattern. The funnel is still there, so combine with HC3.';
    }
    const bp = S.breuschPagan(Xf, res), rs = S.reset(Xf, yf, res);
    return { res, Xf, robust, note, bp, rs };
  }, [r]);
  return (
    <div className="widget">
      <div className="widget-h"><span className="tag">LAB</span> sales ~ TV + radio has a funnel and a curve. Pick a remedy.</div>
      <Seg value={r} onChange={setR} options={[{ v: 'none', label: 'Plain OLS' }, { v: 'hc3', label: 'Robust SE (HC3)' }, { v: 'wls', label: 'WLS' }, { v: 'log', label: 'log(y)' }, { v: 'boxcox', label: 'Box-Cox' }, { v: 'terms', label: 'Add TV² + TV×radio' }]} />
      <div className="two" style={{ marginTop: 12 }}>
        <div>
          <DiagPlots X={out.Xf} res={out.res} compact only={['rvf', 'sl']} />
          <TestTable rows={[
            { name: 'Breusch–Pagan', checks: 'constant variance', stat: out.bp.stat, p: out.bp.p, verdict: out.bp.p < 0.05 ? 'bad' : 'ok' },
            { name: 'RESET', checks: 'functional form', stat: out.rs.stat, p: out.rs.p, verdict: out.rs.p < 0.05 ? 'bad' : 'ok' },
          ]} />
        </div>
        <div>
          <CoefTable res={out.res} robust={out.robust} compact />
          {out.note && <div className="caption small">{out.note}</div>}
          {r === 'wls' && <p className="small muted">WLS diagnostics are shown on the weighted scale, where the variance should look constant.</p>}
        </div>
      </div>
    </div>
  );
}

export function BoxCoxProfile() {
  const lams = Array.from({ length: 81 }, (_, i) => -1 + i * 0.03);
  const ll = lams.map((l) => S.boxcoxLLF(y, l));
  const best = S.boxcoxLambda(y), bestLL = S.boxcoxLLF(y, best);
  const cut = bestLL - 1.92;
  return (
    <Plot x={[-1, 1.4]} y={[Math.min(...ll), bestLL + 3]} w={460} h={240} xLabel="λ" yLabel="profile log-likelihood" title={`Box–Cox for sales: λ̂ = ${best.toFixed(2)} (95% CI where the curve is above the dashed line)`}>
      {(sx, sy) => <>
        <HLine sx={sx} sy={sy} y={cut} color={C.gold} />
        <Path sx={sx} sy={sy} pts={lams.map((l, i) => ({ x: l, y: ll[i] }))} color={C.teal} />
        {[0, 0.5, 1].map((l) => <g key={l}><line x1={sx(l)} x2={sx(l)} y1={sy.range()[0]} y2={sy.range()[1]} stroke={C.muted} strokeDasharray="2 4" /><text x={sx(l) + 3} y={sy.range()[1] + 12} fill={C.muted} fontSize={10}>{l === 0 ? 'log' : l === 0.5 ? '√' : 'none'}</text></g>)}
        <circle cx={sx(best)} cy={sy(bestLL)} r={5} fill={C.yellow} />
      </>}
    </Plot>
  );
}

/* ---------- Ch11: prediction calculator ---------- */
export function PredictCalc() {
  const [tv, setTv] = useState(150), [radio, setRadio] = useState(25);
  const { res } = useMemo(() => adModel(['tv', 'radio']), []);
  const iv = S.intervals(res, [1, tv, radio]);
  const lo = 0, hi = 32, W = 100;
  const pc = (v: number) => `${((v - lo) / (hi - lo)) * W}%`;
  const extrap = tv > 296 || radio > 49.6;
  return (
    <div className="widget">
      <div className="widget-h"><span className="tag">CALCULATOR</span> Plan a campaign: what will sales be?</div>
      <Slider label="TV $k" value={tv} min={0} max={400} step={5} onChange={setTv} fmt={(v) => v.toFixed(0)} />
      <Slider label="radio $k" value={radio} min={0} max={70} step={1} onChange={setRadio} fmt={(v) => v.toFixed(0)} />
      <div style={{ position: 'relative', height: 70, margin: '18px 0 8px', background: '#0b0e13', border: '1px solid #2a3342', borderRadius: 8 }}>
        <div style={{ position: 'absolute', left: pc(iv.pi[0]), width: `calc(${pc(iv.pi[1])} - ${pc(iv.pi[0])})`, top: 14, height: 40, background: C.purple, opacity: 0.35, borderRadius: 6 }} />
        <div style={{ position: 'absolute', left: pc(iv.ci[0]), width: `calc(${pc(iv.ci[1])} - ${pc(iv.ci[0])})`, top: 24, height: 20, background: C.yellow, opacity: 0.7, borderRadius: 4 }} />
        <div style={{ position: 'absolute', left: pc(iv.yhat), top: 8, bottom: 8, borderLeft: '2px solid #fff' }} />
        {[0, 5, 10, 15, 20, 25, 30].map((t) => <span key={t} className="small muted" style={{ position: 'absolute', left: pc(t), bottom: -18, transform: 'translateX(-50%)' }}>{t}</span>)}
      </div>
      <div className="stats" style={{ marginTop: 22 }}>
        <Stat label="point forecast" value={iv.yhat.toFixed(2)} />
        <Stat label="95% CI (mean)" value={`${iv.ci[0].toFixed(2)} – ${iv.ci[1].toFixed(2)}`} color={C.yellow} />
        <Stat label="95% PI (one market)" value={`${iv.pi[0].toFixed(2)} – ${iv.pi[1].toFixed(2)}`} color={C.purple} />
      </div>
      <p className="small"><b style={{ color: C.yellow }}>CI</b>: "across all markets with this budget, average sales are between {iv.ci[0].toFixed(1)}k and {iv.ci[1].toFixed(1)}k units." <b style={{ color: C.purple }}>PI</b>: "this <i>one</i> market will sell between {iv.pi[0].toFixed(1)}k and {iv.pi[1].toFixed(1)}k." Budget a single campaign with the PI.</p>
      {extrap && <p className="small" style={{ color: C.red }}>⚠ Extrapolation: the data only covers TV ≤ 296 and radio ≤ 50. The intervals assume the straight line continues out here. They're mathematically valid but practically fiction.</p>}
    </div>
  );
}

/* ---------- Ch12: metrics ---------- */
export function MetricsLab() {
  const [junk, setJunk] = useState(0);
  const [outl, setOutl] = useState(false);
  const out = useMemo(() => {
    const r = rng(9);
    const extra = Array.from({ length: junk }, () => AD.map(() => gauss(r)));
    const X = S.addConst([col('tv'), col('radio'), ...extra]);
    const res = S.ols(X, y);
    const yy = [...y], yh = [...res.fitted];
    if (outl) { yy[0] = yy[0] + 25; }
    const m = S.regMetrics(yy, yh);
    const cv = S.crossVal(X, y, 5, S.olsFit, 3);
    return { res, m, cv };
  }, [junk, outl]);
  return (
    <div className="widget">
      <div className="widget-h"><span className="tag">LAB</span> Game the metrics</div>
      <div className="row">
        <Slider label="pure-noise features added" value={junk} min={0} max={60} step={1} onChange={setJunk} fmt={(v) => v.toFixed(0)} />
        <label className="row small" style={{ gap: 6 }}><input type="checkbox" checked={outl} onChange={(e) => setOutl(e.target.checked)} /> one gross error in the evaluation data (+25k units)</label>
      </div>
      <div className="stats" style={{ marginTop: 10 }}>
        <Stat label="R² (train)" value={out.res.r2.toFixed(4)} color={C.green} />
        <Stat label="adj. R²" value={out.res.adjR2.toFixed(4)} color={junk > 0 && out.res.adjR2 < 0.9 ? C.red : undefined} />
        <Stat label="5-fold CV RMSE" value={out.cv.rmse.toFixed(3)} />
        <Stat label="AIC" value={out.res.aic.toFixed(1)} />
        <Stat label="BIC" value={out.res.bic.toFixed(1)} />
      </div>
      <div className="stats">
        <Stat label="RMSE" value={out.m.rmse.toFixed(3)} color={outl ? C.red : undefined} />
        <Stat label="MAE" value={out.m.mae.toFixed(3)} />
        <Stat label="MAPE" value={`${out.m.mape.toFixed(1)}%`} />
      </div>
      <p className="small">Add noise features: <b>R² can only go up</b>, never down. Adjusted R², AIC, BIC and CV RMSE all penalise the junk. Tick the gross error: RMSE jumps far more than MAE, because squaring makes a single big miss dominate.</p>
    </div>
  );
}

