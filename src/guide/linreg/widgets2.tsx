// Widgets for chapters 4–8: assumption breaker, test tables, collinearity lab, influence lab.
import { useMemo, useState } from 'react';
import { AD } from '../../lib/advertising';
import { rng, gauss } from '../../lib/datasets';
import * as S from '../../lib/stats';
import { Bars, C, CoefTable, DiagPlots, Dots, Heatmap, HLine, Path, Plot, Seg, Slider, Stat, TestRow, TestTable, extent, fmt } from '../ui';
import { Violation, VIOLATIONS, coverage, diagnose, simulate, TRUE_B1 } from './sim';

export const adModel = (cols: ('tv' | 'radio' | 'newspaper')[] = ['tv', 'radio', 'newspaper']) => {
  const X = S.addConst(cols.map((c) => AD.map((d) => d[c])));
  const y = AD.map((d) => d.sales);
  return { X, y, res: S.ols(X, y, ['const', ...cols]) };
};

const v = (p: number, a = 0.05): 'ok' | 'warn' | 'bad' => (p < a ? 'bad' : p < 2 * a ? 'warn' : 'ok');

export function testRows(d: ReturnType<typeof diagnose>, withVif = true): TestRow[] {
  const t = d.tests;
  const rows: TestRow[] = [
    { name: 'Shapiro–Wilk', checks: 'Normality of residuals (H₀: normal)', stat: t.sw.stat, statLabel: 'W = ', p: t.sw.p, verdict: v(t.sw.p) },
    { name: 'Jarque–Bera', checks: 'Skewness & kurtosis (H₀: normal)', stat: t.jb.stat, p: t.jb.p, verdict: v(t.jb.p), note: `skew ${t.jb.extra!.skew.toFixed(2)}, kurt ${t.jb.extra!.kurtosis.toFixed(2)}` },
    { name: 'Breusch–Pagan', checks: 'Variance depends on X? (H₀: constant)', stat: t.bp.stat, statLabel: 'LM = ', p: t.bp.p, verdict: v(t.bp.p) },
    { name: 'White', checks: 'Any variance pattern, incl. squares & cross-terms', stat: t.white.stat, statLabel: 'LM = ', p: t.white.p, verdict: v(t.white.p) },
    { name: 'Durbin–Watson', checks: 'Lag-1 autocorrelation (≈2 is good)', stat: t.dw, statLabel: 'd = ', verdict: t.dw < 1.5 || t.dw > 2.5 ? 'bad' : t.dw < 1.7 || t.dw > 2.3 ? 'warn' : 'ok' },
    { name: 'Ramsey RESET', checks: 'Missing curvature (adds ŷ², ŷ³)', stat: t.reset.stat, statLabel: 'F = ', p: t.reset.p, verdict: v(t.reset.p) },
    { name: 'Rainbow', checks: 'Fit on central half ≈ fit on all? (H₀: linear)', stat: t.rainbow.stat, statLabel: 'F = ', p: t.rainbow.p, verdict: v(t.rainbow.p) },
  ];
  if (withVif && d.vif.length > 1) {
    const mx = Math.max(...d.vif);
    rows.push({ name: 'Max VIF', checks: 'Multicollinearity (>5 caution, >10 serious)', stat: mx, verdict: mx > 10 ? 'bad' : mx > 5 ? 'warn' : 'ok' });
  }
  rows.push({ name: "Max Cook's D", checks: 'Single point dominating the fit (>0.5 look, >1 serious)', stat: d.maxCook, verdict: d.maxCook > 1 ? 'bad' : d.maxCook > 0.5 ? 'warn' : 'ok' });
  return rows;
}

/* ---------- Assumption breaker ---------- */
export function Breaker({ view = 'all', initial = [] as Violation[] }: { view?: 'scatter' | 'diag' | 'tests' | 'all'; initial?: Violation[] }) {
  const [on, setOn] = useState<Set<Violation>>(new Set(initial));
  const [sev, setSev] = useState(0.7);
  const [seed, setSeed] = useState(3);
  const [tab, setTab] = useState<'scatter' | 'diag' | 'tests' | 'sim'>(view === 'all' ? 'scatter' : view);
  const data = useMemo(() => simulate(on, sev, 120, seed), [on, sev, seed]);
  const d = useMemo(() => diagnose(data.X, data.y, data.names), [data]);
  const sim = useMemo(() => (tab === 'sim' ? coverage([...on], sev) : null), [tab, on, sev]);
  const toggle = (id: Violation) => { const s = new Set(on); s.has(id) ? s.delete(id) : s.add(id); setOn(s); };
  const res = d.res;
  return (
    <div className="widget">
      <div className="widget-h"><span className="tag">ASSUMPTION BREAKER</span> Turn on a violation and watch the diagnostics react</div>
      <div className="row" style={{ marginBottom: 10 }}>
        {VIOLATIONS.map((o) => (
          <button key={o.id} className={`btn ${on.has(o.id) ? 'primary' : ''}`} onClick={() => toggle(o.id)} title={`Breaks: ${o.assumption}`}>{o.label}</button>
        ))}
        <button className="btn" onClick={() => setOn(new Set())}>All clean</button>
      </div>
      <div className="row" style={{ marginBottom: 10 }}>
        <Slider label="severity" value={sev} min={0} max={1} step={0.05} onChange={setSev} />
        <button className="btn" onClick={() => setSeed((s) => s + 1)}>🔀 New sample</button>
        <span className="spacer" />
        <Seg value={tab} onChange={setTab} options={[{ v: 'scatter', label: 'Data & fit' }, { v: 'diag', label: 'Diagnostic plots' }, { v: 'tests', label: 'Formal tests' }, { v: 'sim', label: 'Does inference break?' }]} />
      </div>
      {tab === 'scatter' && <div className="two">
        <Plot x={[0, 10]} y={extent(data.y)} xLabel="x (time-ordered)" yLabel="y">
          {(sx, sy) => <><Dots sx={sx} sy={sy} xs={data.x} ys={data.y} r={3} />
            {!data.x2 && <Path sx={sx} sy={sy} pts={[0, 10].map((x) => ({ x, y: res.beta[0] + res.beta[1] * x }))} />}
            <Path sx={sx} sy={sy} pts={[0, 10].map((x) => ({ x, y: 2 + TRUE_B1 * x }))} color={C.green} dash="5 4" /></>}
        </Plot>
        <div>
          <CoefTable res={res} compact />
          <p className="small muted">Green dashed = the true line (slope {TRUE_B1}). {data.x2 ? 'With a collinear x2, the true slope of x is still 1.5, but watch how unstable its estimate and SE become across new samples.' : ''}</p>
          {on.size === 0 && <p className="small">All assumptions hold. Every test should pass (about 1 in 20 will fail by chance: that's what α = 0.05 means).</p>}
        </div>
      </div>}
      {tab === 'diag' && <DiagPlots X={data.X} res={res} compact withOrder />}
      {tab === 'tests' && <TestTable rows={testRows(d)} />}
      {tab === 'sim' && sim && <div className="two">
        <Plot x={extent(sim.ests)} y={[0, 1]} h={240} xLabel="estimated slope across 300 repeated samples (n = 60)" yLabel="" yTicks={0}>
          {(sx, sy) => {
            const [lo, hi] = sx.domain(); const nb = 30, w = (hi - lo) / nb;
            const counts = new Array(nb).fill(0); sim.ests.forEach((e) => counts[Math.min(nb - 1, Math.floor((e - lo) / w))]++);
            const mx = Math.max(...counts);
            return <>{counts.map((c, i) => <rect key={i} x={sx(lo + i * w)} y={sy(c / mx * 0.9)} width={sx(lo + w) - sx(lo) - 1} height={sy(0) - sy(c / mx * 0.9)} fill={C.blue} fillOpacity={0.7} />)}
              <line x1={sx(TRUE_B1)} x2={sx(TRUE_B1)} y1={sy(0)} y2={sy(1)} stroke={C.green} strokeWidth={2} /></>;
          }}
        </Plot>
        <div>
          <div className="stats">
            <Stat label="95% CI coverage" value={`${(sim.coverage * 100).toFixed(0)}%`} color={sim.coverage < 0.9 ? C.red : C.green} hint="Should be ~95%" />
            <Stat label="mean estimate" value={sim.meanEst.toFixed(3)} hint={`truth = ${TRUE_B1}`} />
          </div>
          <div className="stats">
            <Stat label="avg reported SE" value={sim.meanSE.toFixed(3)} />
            <Stat label="actual spread (SD)" value={sim.sdTrue.toFixed(3)} color={sim.meanSE < 0.85 * sim.sdTrue ? C.red : undefined} />
          </div>
          <p className="small">If the CIs were honest, 95% of them would contain the true slope. When the <b>reported SE is smaller than the actual spread</b>, your CIs are too narrow and your p-values too small: you'll "find" effects that aren't there.</p>
          <p className="small muted">Try fanning variance or autocorrelated errors: the estimate stays centred (unbiased) but coverage falls. Collinearity keeps coverage but blows up the spread.</p>
        </div>
      </div>}
    </div>
  );
}

/* ---------- Advertising: diagnostics & tests ---------- */
export function AdDiagnostics({ only }: { only?: ('rvf' | 'qq' | 'sl' | 'lev')[] }) {
  const { X, res } = useMemo(() => adModel(), []);
  return <div className="widget"><div className="widget-h"><span className="tag">REAL CASE</span> sales ~ TV + radio + newspaper: diagnostic plots</div><DiagPlots X={X} res={res} only={only} /></div>;
}
export function AdTests() {
  const d = useMemo(() => { const { X, y } = adModel(); return diagnose(X, y, ['const', 'tv', 'radio', 'newspaper']); }, []);
  return <div className="widget"><div className="widget-h"><span className="tag">REAL CASE</span> sales ~ TV + radio + newspaper: formal tests</div><TestTable rows={testRows(d)} /></div>;
}

/* ---------- Ch7: collinearity ---------- */
export function CollinearityLab() {
  const [rho, setRho] = useState(0.5);
  const sims = useMemo(() => {
    const out: { b1: number; b2: number }[] = [];
    let seSum = 0, vifv = 0, flips = 0;
    for (let s = 0; s < 250; s++) {
      const r = rng(500 + s);
      const x1: number[] = [], x2: number[] = [], y: number[] = [];
      for (let i = 0; i < 50; i++) {
        const a = gauss(r), b = rho * a + Math.sqrt(1 - rho * rho) * gauss(r);
        x1.push(a); x2.push(b); y.push(1 + 1 * a + 1 * b + 1.5 * gauss(r));
      }
      const X = S.addConst([x1, x2]);
      const res = S.ols(X, y);
      out.push({ b1: res.beta[1], b2: res.beta[2] });
      seSum += res.se[1]; if (s === 0) vifv = S.vif(X)[0];
      if (res.beta[1] < 0 || res.beta[2] < 0) flips++;
    }
    return { out, se: seSum / 250, vif: vifv, flips };
  }, [rho]);
  return (
    <div className="widget">
      <div className="widget-h"><span className="tag">LAB</span> Two features, both truly worth +1. How sure can we be?</div>
      <Slider label="correlation between x₁ and x₂" value={rho} min={0} max={0.99} step={0.01} onChange={setRho} />
      <div className="two" style={{ marginTop: 10 }}>
        <Plot x={[-2.5, 4.5]} y={[-2.5, 4.5]} xLabel="estimated β₁" yLabel="estimated β₂" title="250 repeated samples (n = 50)">
          {(sx, sy) => <>
            <HLine sx={sx} sy={sy} y={0} />
            <line x1={sx(0)} x2={sx(0)} y1={sy.range()[0]} y2={sy.range()[1]} stroke={C.muted} strokeDasharray="4 4" />
            <Dots sx={sx} sy={sy} xs={sims.out.map((d) => d.b1)} ys={sims.out.map((d) => d.b2)} r={2.6} opacity={0.6} />
            <circle cx={sx(1)} cy={sy(1)} r={7} fill="none" stroke={C.green} strokeWidth={2} />
          </>}
        </Plot>
        <div>
          <div className="stats">
            <Stat label="VIF" value={sims.vif.toFixed(1)} color={sims.vif > 10 ? C.red : sims.vif > 5 ? C.gold : C.green} />
            <Stat label="avg SE(β₁)" value={sims.se.toFixed(3)} />
            <Stat label="samples with a wrong sign" value={`${((sims.flips / 250) * 100).toFixed(0)}%`} color={sims.flips > 12 ? C.red : undefined} />
          </div>
          <p className="small">As the correlation rises, the cloud stretches along the line β₁ + β₂ = 2. The data can tell you the <b>sum</b> of the two effects very precisely, but not how to <b>split</b> it between them. That's multicollinearity.</p>
          <p className="small muted">SE grows like √VIF = 1/√(1 − ρ²). At ρ = 0.95, VIF ≈ 10 and the SE is about 3.2× larger than with uncorrelated features.</p>
        </div>
      </div>
    </div>
  );
}

export function AdCollinearity() {
  const cols = ['tv', 'radio', 'newspaper'] as const;
  const M = cols.map((a) => cols.map((b) => S.corr(AD.map((d) => d[a]), AD.map((d) => d[b]))));
  const { X } = adModel();
  const vifs = S.vif(X);
  const condStd = S.conditionNumber([...S.standardize(cols.map((c) => AD.map((d) => d[c]))).Z].map((r) => [1, ...r]));
  return (
    <div className="widget">
      <div className="widget-h"><span className="tag">REAL CASE</span> Advertising: correlation and VIF</div>
      <div className="two">
        <Heatmap labels={['TV', 'radio', 'news']} M={M} />
        <div>
          <Bars items={cols.map((c, i) => ({ label: c, value: vifs[i] }))} threshold={5} max={12} thresholdLabel="VIF = 5 caution line" />
          <p className="small" style={{ marginTop: 10 }}>Condition number: <b className="mono">{S.conditionNumber(X).toFixed(0)}</b>. statsmodels warns above ~1000, but this one is large mostly because the features are on different scales, not because of collinearity. Standardise and it drops to <b className="mono">{condStd.toFixed(1)}</b>.</p>
          <p className="small muted">Radio and newspaper correlate at 0.45: a mild overlap, VIF ≈ 1.3. That's harmless for the standard errors, but it is exactly why newspaper looks useful on its own and useless next to radio.</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Ch8: influence ---------- */
export function InfluenceLab() {
  const base = useMemo(() => { const r = rng(77); return Array.from({ length: 20 }, () => { const x = 1.5 + r() * 5; return { x, y: 2 + 0.6 * x + gauss(r) * 0.6 }; }); }, []);
  const [pt, setPt] = useState({ x: 9, y: 2.5 });
  const [drag, setDrag] = useState(false);
  const all = [...base, pt];
  const X = S.addConst([all.map((p) => p.x)]), y = all.map((p) => p.y);
  const res = S.ols(X, y), res0 = S.ols1(base.map((p) => p.x), base.map((p) => p.y));
  const inf = S.influence(X, res); const i = all.length - 1;
  const th = inf.thresholds;
  const highLev = inf.h[i] > th.leverage, outl = Math.abs(inf.ext[i]) > 2.5, infl = inf.cooks[i] > 0.5;
  const verdict = infl ? 'INFLUENTIAL: it single-handedly moves the line.' : highLev && !outl ? 'High leverage but in line with the trend: a "good" leverage point (it even shrinks the SE).' : outl && !highLev ? 'Outlier in y, but near the centre of x: it inflates σ̂ but barely tilts the line.' : 'Ordinary point.';
  return (
    <div className="widget">
      <div className="widget-h"><span className="tag">LAB</span> Drag the red point. Outlier? Leverage? Influence?</div>
      <div className="two">
        <Plot x={[0, 10]} y={[0, 10]} xLabel="x" yLabel="y" cursor={drag ? 'grabbing' : 'grab'}
          onDown={(q) => { if (Math.hypot(q.x - pt.x, q.y - pt.y) < 0.6) setDrag(true); }}
          onMove={(q) => drag && setPt({ x: Math.min(9.9, Math.max(0.1, q.x)), y: Math.min(9.9, Math.max(0.1, q.y)) })}
          onUp={() => setDrag(false)}>
          {(sx, sy) => <>
            <Path sx={sx} sy={sy} pts={[0, 10].map((x) => ({ x, y: res0.beta[0] + res0.beta[1] * x }))} color={C.green} dash="5 4" />
            <Path sx={sx} sy={sy} pts={[0, 10].map((x) => ({ x, y: res.beta[0] + res.beta[1] * x }))} />
            <Dots sx={sx} sy={sy} xs={base.map((p) => p.x)} ys={base.map((p) => p.y)} r={4.5} />
            <circle cx={sx(pt.x)} cy={sy(pt.y)} r={9} fill={C.red} stroke="#fff" strokeWidth={1.5} />
          </>}
        </Plot>
        <div>
          <div className="stats">
            <Stat label="leverage h" value={inf.h[i].toFixed(3)} color={highLev ? C.red : C.green} hint={`threshold 2k/n = ${th.leverage.toFixed(3)}`} />
            <Stat label="ext. stud. resid" value={inf.ext[i].toFixed(2)} color={outl ? C.red : C.green} hint="|t| > 2.5–3 is unusual" />
          </div>
          <div className="stats">
            <Stat label="Cook's D" value={inf.cooks[i].toFixed(3)} color={infl ? C.red : inf.cooks[i] > th.cooks ? C.gold : C.green} hint="> 4/n look, > 0.5 serious, > 1 dominant" />
            <Stat label="DFFITS" value={inf.dffits[i].toFixed(2)} color={Math.abs(inf.dffits[i]) > th.dffits ? C.gold : C.green} hint={`threshold 2√(k/n) = ${th.dffits.toFixed(2)}`} />
          </div>
          <div className="stats"><Stat label="slope with" value={res.beta[1].toFixed(3)} color={C.yellow} /><Stat label="slope without" value={res0.beta[1].toFixed(3)} color={C.green} /></div>
          <div className="caption small">{verdict}</div>
          <p className="small muted">Cook's D ≈ (outlyingness)² × leverage. You need both to be influential. Try: (1) far right but on the green line, (2) middle but far up, (3) far right and far down.</p>
        </div>
      </div>
    </div>
  );
}

export function AdInfluenceTable() {
  const { X, res } = adModel();
  const inf = S.influence(X, res);
  const idx = inf.cooks.map((c, i) => [c, i]).sort((a, b) => b[0] - a[0]).slice(0, 6).map((d) => d[1]);
  const keep = AD.map((_, i) => i).filter((i) => !idx.slice(0, 3).includes(i));
  const res2 = S.ols(keep.map((i) => X[i]), keep.map((i) => AD[i].sales), res.names);
  return (
    <div className="widget">
      <div className="widget-h"><span className="tag">REAL CASE</span> The most influential markets</div>
      <div className="tbl-wrap"><table className="tbl mono">
        <thead><tr><th>row</th><th>TV</th><th>radio</th><th>sales</th><th>leverage</th><th>stud. resid</th><th>Cook's D</th><th>DFFITS</th></tr></thead>
        <tbody>{idx.map((i) => <tr key={i}><td>{i}</td><td>{AD[i].tv}</td><td>{AD[i].radio}</td><td>{AD[i].sales}</td><td>{inf.h[i].toFixed(3)}</td>
          <td style={{ color: Math.abs(inf.ext[i]) > 3 ? C.red : undefined }}>{inf.ext[i].toFixed(2)}</td><td>{inf.cooks[i].toFixed(3)}</td><td>{inf.dffits[i].toFixed(3)}</td></tr>)}</tbody>
      </table></div>
      <p className="small">Thresholds: leverage &gt; {inf.thresholds.leverage.toFixed(3)}, Cook's D &gt; {inf.thresholds.cooks.toFixed(3)} (4/n), |DFFITS| &gt; {inf.thresholds.dffits.toFixed(3)}. Several markets cross the 4/n line, but none comes near Cook's D = 0.5.</p>
      <p className="small">Refit without the top 3: TV slope {fmt(res.beta[1])} → {fmt(res2.beta[1])}, radio {fmt(res.beta[2])} → {fmt(res2.beta[2])}. <b>The conclusions don't move</b>, so we keep the points and report that we checked.</p>
    </div>
  );
}
