// Widgets for chapters 13–16: model selection, validation, feature engineering, gradient descent.
import { useMemo, useState } from 'react';
import { contours, geoPath } from 'd3';
import { AD } from '../../lib/advertising';
import { rng, gauss } from '../../lib/datasets';
import * as S from '../../lib/stats';
import { useStepPlayer, PlayerControls } from '../../components/StepPlayer';
import { C, Dots, Path, Plot, Seg, Slider, Stat, extent, fmt } from '../ui';

const y = AD.map((d) => d.sales);
const tv = AD.map((d) => d.tv), radio = AD.map((d) => d.radio), news = AD.map((d) => d.newspaper);
export const CANDS: { name: string; v: number[] }[] = [
  { name: 'TV', v: tv }, { name: 'radio', v: radio }, { name: 'newspaper', v: news },
  { name: 'TV²', v: tv.map((x) => x * x) }, { name: 'TV×radio', v: tv.map((x, i) => x * radio[i]) },
];

/* ---------- Ch13: best subset ---------- */
type Crit = 'bic' | 'aic' | 'cp' | 'adjR2' | 'cv';
export function SubsetTable() {
  const [crit, setCrit] = useState<Crit>('bic');
  const rows = useMemo(() => {
    const full = S.ols(S.addConst(CANDS.map((c) => c.v)), y);
    const out: { names: string[]; k: number; aic: number; bic: number; cp: number; adjR2: number; cv: number; hier: boolean }[] = [];
    for (let mask = 1; mask < 32; mask++) {
      const sel = CANDS.filter((_, j) => mask & (1 << j));
      const X = S.addConst(sel.map((c) => c.v));
      const r = S.ols(X, y);
      const nm = sel.map((c) => c.name);
      const hier = (nm.includes('TV×radio') && !(nm.includes('TV') && nm.includes('radio'))) || (nm.includes('TV²') && !nm.includes('TV'));
      out.push({ names: nm, k: sel.length, aic: r.aic, bic: r.bic, cp: S.mallowsCp(r, full), adjR2: r.adjR2, cv: S.crossVal(X, y, 5, S.olsFit, 1).rmse, hier });
    }
    return out;
  }, []);
  const better = (a: number, b: number) => (crit === 'adjR2' ? b - a : a - b);
  const sorted = [...rows].sort((a, b) => better(a[crit], b[crit]));
  const bestBySize = [1, 2, 3, 4, 5].map((k) => rows.filter((r) => r.k === k).sort((a, b) => better(a[crit], b[crit]))[0]);
  const lab = { bic: 'BIC', aic: 'AIC', cp: "Mallows' Cp", adjR2: 'adj. R²', cv: '5-fold CV RMSE' }[crit];
  return (
    <div className="widget">
      <div className="widget-h"><span className="tag">REAL CASE</span> All 31 subsets of {'{'}TV, radio, newspaper, TV², TV×radio{'}'}<span className="spacer" />
        <Seg value={crit} onChange={setCrit} options={[{ v: 'bic', label: 'BIC' }, { v: 'aic', label: 'AIC' }, { v: 'cp', label: 'Cp' }, { v: 'adjR2', label: 'adj R²' }, { v: 'cv', label: 'CV RMSE' }]} /></div>
      <div className="two">
        <div className="tbl-wrap" style={{ maxHeight: 340, overflowY: 'auto' }}><table className="tbl mono">
          <thead><tr><th>#</th><th>model</th><th>p</th><th>{lab}</th></tr></thead>
          <tbody>{sorted.slice(0, 12).map((r, i) => <tr key={r.names.join()} className={i === 0 ? 'hl' : ''}>
            <td>{i + 1}</td><td>{r.names.join(' + ')}{r.hier && <span title="violates the hierarchy principle" style={{ color: C.red }}> ⚑</span>}</td><td>{r.k}</td>
            <td>{crit === 'adjR2' ? r[crit].toFixed(4) : r[crit].toFixed(crit === 'cv' ? 4 : 1)}</td></tr>)}</tbody>
        </table></div>
        <Plot x={[0.5, 5.5]} y={extent(bestBySize.map((r) => r[crit]), 0.15)} h={260} xLabel="number of predictors" yLabel={lab} xTicks={5} title="Best model of each size">
          {(sx, sy) => <><Path sx={sx} sy={sy} pts={bestBySize.map((r) => ({ x: r.k, y: r[crit] }))} color={C.teal} />
            <Dots sx={sx} sy={sy} xs={bestBySize.map((r) => r.k)} ys={bestBySize.map((r) => r[crit])} r={5} color={C.yellow} /></>}
        </Plot>
      </div>
      <p className="small">⚑ = breaks the <b>hierarchy principle</b>: it uses TV×radio without both main effects, or TV² without TV. BIC's favourite drops the radio main effect, which is statistically "optimal" but makes the interaction hard to interpret and depends on where radio's zero is. Keep the main effects: <b>TV + radio + TV² + TV×radio</b>.</p>
      <p className="small muted">BIC (penalty ln(n)·p) chooses smaller models than AIC (penalty 2p). Cp is AIC's cousin for OLS. CV estimates the out-of-sample error directly, without assumptions.</p>
    </div>
  );
}

/* ---------- Ch13: stepwise on noise ---------- */
export function StepwiseNoise() {
  const [ran, setRan] = useState<null | { runs: number; withNoise: number; sigNoise: number; total: number }>(null);
  const run = () => {
    let withNoise = 0, sigNoise = 0, total = 0; const runs = 40;
    for (let s = 0; s < runs; s++) {
      const r = rng(100 + s);
      const pool = [...CANDS.map((c) => ({ ...c, noise: false })), ...Array.from({ length: 15 }, (_, j) => ({ name: `noise${j}`, v: AD.map(() => gauss(r)), noise: true }))];
      let chosen: typeof pool = [], best = Infinity;
      for (;;) {
        let pick = -1, pa = Infinity;
        pool.forEach((c, j) => { if (chosen.includes(c)) return; const a = S.ols(S.addConst([...chosen, c].map((q) => q.v)), y).aic; if (a < pa) { pa = a; pick = j; } });
        if (pick < 0 || pa >= best) break;
        chosen = [...chosen, pool[pick]]; best = pa;
      }
      const fin = S.ols(S.addConst(chosen.map((q) => q.v)), y);
      const nz = chosen.map((c, j) => ({ c, p: fin.p[j + 1] })).filter((d) => d.c.noise);
      if (nz.length) withNoise++;
      total += nz.length; sigNoise += nz.filter((d) => d.p < 0.05).length;
    }
    setRan({ runs, withNoise, sigNoise, total });
  };
  return (
    <div className="widget">
      <div className="widget-h"><span className="tag">EXPERIMENT</span> Forward stepwise (AIC) with 15 pure-noise columns added</div>
      <button className="btn primary" onClick={run}>▶ Run 40 experiments</button>
      {ran && <><div className="stats" style={{ marginTop: 10 }}>
        <Stat label="runs that selected ≥1 noise column" value={`${ran.withNoise}/${ran.runs}`} color={C.red} />
        <Stat label="noise columns selected" value={ran.total} />
        <Stat label="…of those with p < 0.05" value={ran.sigNoise} color={C.red} />
      </div>
        <p className="small">The final model reports p-values <b>as if the variables had been chosen in advance</b>. Selection already picked the noise columns that happened to correlate with sales, so their p-values look far better than they deserve. Use stepwise for exploration at most, never for inference. Prefer theory-driven models, cross-validation, or the Lasso.</p></>}
    </div>
  );
}

/* ---------- Ch14: cross-validation & bias–variance ---------- */
const truth = (x: number) => 3 + 2.2 * Math.sin(x / 1.6) + 0.15 * x;
const polyRow = (x: number, d: number) => { const z = (x - 5) / 5; return Array.from({ length: d + 1 }, (_, p) => z ** p); };
function polyFit(xs: number[], ys: number[], d: number) {
  const X = xs.map((x) => polyRow(x, d));
  const G = S.gram(X); G.forEach((r, i) => { if (i) r[i] += 1e-9; });
  const b = S.matvec(S.inverse(G), S.xty(X, ys));
  return (x: number) => S.dot(polyRow(x, d), b);
}
export function CVWidget() {
  const [deg, setDeg] = useState(3);
  const [k, setK] = useState(5);
  const data = useMemo(() => { const r = rng(42); return Array.from({ length: 40 }, () => { const x = r() * 10; return { x, y: truth(x) + gauss(r) * 0.8 }; }); }, []);
  const valid = useMemo(() => { const r = rng(43); return Array.from({ length: 600 }, () => { const x = r() * 10; return { x, y: truth(x) + gauss(r) * 0.8 }; }); }, []);
  const xs = data.map((d) => d.x), ys = data.map((d) => d.y);
  const curves = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const d = i + 1; const f = polyFit(xs, ys, d);
    const tr = Math.sqrt(S.mean(data.map((p) => (p.y - f(p.x)) ** 2)));
    const cv = S.crossVal(xs.map((x) => [x]), ys, k, (X, Y) => { const g = polyFit(X.map((r) => r[0]), Y, d); return (row) => g(row[0]); }, 7).rmse;
    const te = Math.sqrt(S.mean(valid.map((p) => (p.y - f(p.x)) ** 2)));
    return { d, tr, cv, te };
  }), [k]);
  const f = polyFit(xs, ys, deg);
  const grid = Array.from({ length: 200 }, (_, i) => 0.05 + i * 0.0495);
  const folds = S.kfold(40, k, 7);
  const foldOf = new Array(40).fill(0); folds.forEach((fo, j) => fo.forEach((i) => (foldOf[i] = j)));
  const FC = [C.blue, C.gold, C.green, C.purple, C.red, C.teal, C.pink, C.yellow, '#aaa', '#6af'];
  return (
    <div className="widget">
      <div className="widget-h"><span className="tag">LAB</span> Polynomial degree vs error: bias–variance in one picture</div>
      <div className="row"><Slider label="degree" value={deg} min={1} max={12} step={1} onChange={setDeg} fmt={(v) => v.toFixed(0)} />
        <span className="small muted">folds:</span><Seg value={k} onChange={setK} options={[3, 5, 10].map((v) => ({ v, label: `k = ${v}` }))} /></div>
      <div className="two" style={{ marginTop: 10 }}>
        <Plot x={[0, 10]} y={[-1, 8]} xLabel="x" yLabel="y" title="points coloured by CV fold">
          {(sx, sy) => <>
            <Path sx={sx} sy={sy} pts={grid.map((x) => ({ x, y: truth(x) }))} color={C.green} dash="5 4" />
            <Path sx={sx} sy={sy} pts={grid.map((x) => ({ x, y: Math.max(-5, Math.min(12, f(x))) }))} width={2.5} />
            <Dots sx={sx} sy={sy} xs={xs} ys={ys} r={4} color={(i) => FC[foldOf[i] % FC.length]} />
          </>}
        </Plot>
        <Plot x={[0.5, 12.5]} y={[0, 2.6]} xLabel="polynomial degree" yLabel="RMSE" xTicks={12}>
          {(sx, sy) => <>
            <Path sx={sx} sy={sy} pts={curves.map((c) => ({ x: c.d, y: c.tr }))} color={C.blue} />
            <Path sx={sx} sy={sy} pts={curves.map((c) => ({ x: c.d, y: Math.min(2.6, c.cv) }))} color={C.gold} width={2.5} />
            <Path sx={sx} sy={sy} pts={curves.map((c) => ({ x: c.d, y: Math.min(2.6, c.te) }))} color={C.red} dash="4 3" />
            <line x1={sx(deg)} x2={sx(deg)} y1={sy(0)} y2={sy(2.6)} stroke={C.yellow} strokeDasharray="3 3" />
          </>}
        </Plot>
      </div>
      <div className="legend"><span><span className="dot" style={{ background: C.blue }} />training RMSE (always falls)</span><span><span className="dot" style={{ background: C.gold }} />{k}-fold CV RMSE</span><span><span className="dot" style={{ background: C.red }} />true test RMSE (600 fresh points)</span><span><span className="dot" style={{ background: C.green }} />true curve</span></div>
      <div className="stats">
        <Stat label="train RMSE" value={curves[deg - 1].tr.toFixed(3)} color={C.blue} />
        <Stat label="CV RMSE" value={curves[deg - 1].cv.toFixed(3)} color={C.gold} />
        <Stat label="test RMSE" value={curves[deg - 1].te.toFixed(3)} color={C.red} />
      </div>
      <p className="small">{deg <= 2 ? 'Underfit (high bias): the line is too stiff to follow the wave. Training and test error are both high.' : deg <= 6 ? 'Sweet spot: CV error is near its minimum and close to the true test error.' : 'Overfit (high variance): the curve chases noise between points. Training error keeps falling while CV and test error climb.'}</p>
    </div>
  );
}

/* ---------- Ch15: interaction & dummies ---------- */
export function InteractionPlot() {
  const [m, setM] = useState<'add' | 'int'>('int');
  const X = m === 'add' ? S.addConst([tv, radio]) : S.addConst([tv, radio, tv.map((v, i) => v * radio[i])]);
  const res = S.ols(X, y);
  const levels = [5, 25, 45];
  const cols = [C.blue, C.gold, C.red];
  const pred = (t: number, r: number) => res.beta[0] + res.beta[1] * t + res.beta[2] * r + (m === 'int' ? res.beta[3] * t * r : 0);
  return (
    <div className="widget">
      <div className="widget-h"><span className="tag">VISUAL</span> Synergy: does TV work better when radio is also running?<span className="spacer" />
        <Seg value={m} onChange={setM} options={[{ v: 'add', label: 'additive' }, { v: 'int', label: '+ TV × radio' }]} /></div>
      <div className="two">
        <Plot x={[0, 300]} y={[0, 30]} xLabel="TV ($k)" yLabel="sales (k units)">
          {(sx, sy) => <>
            <Dots sx={sx} sy={sy} xs={tv} ys={y} r={2.6} opacity={0.5} color={(i) => cols[radio[i] < 15 ? 0 : radio[i] < 35 ? 1 : 2]} />
            {levels.map((r, j) => <Path key={r} sx={sx} sy={sy} pts={[0, 300].map((t) => ({ x: t, y: pred(t, r) }))} color={cols[j]} width={2.5} />)}
          </>}
        </Plot>
        <div>
          <div className="legend">{levels.map((r, j) => <span key={r}><span className="dot" style={{ background: cols[j] }} />radio = {r}</span>)}</div>
          <div className="stats"><Stat label="R²" value={res.r2.toFixed(3)} color={C.green} /><Stat label="σ̂" value={res.sigma.toFixed(3)} />{m === 'int' && <Stat label="p(TV×radio)" value={S.fmtP(res.p[3])} />}</div>
          {m === 'add' ? <p className="small">Additive model: parallel lines. Each extra $1k of TV adds the same {fmt(res.beta[1], 4)}k units whatever radio does. Look at the dots: the high-radio markets (red) climb faster.</p>
            : <p className="small">With the interaction, the TV slope depends on radio: <b>∂sales/∂TV = {fmt(res.beta[1], 4)} + {fmt(res.beta[3], 5)} × radio</b>. That's {fmt(res.beta[1] + res.beta[3] * 5, 4)} at radio = 5 and {fmt(res.beta[1] + res.beta[3] * 45, 4)} at radio = 45. The main-effect coefficients now mean "the slope when the other variable is 0", so centre your variables if 0 is not meaningful.</p>}
        </div>
      </div>
    </div>
  );
}

export function DummyTrap() {
  const [all, setAll] = useState(false);
  const region = useMemo(() => { const r = rng(3); return AD.map(() => ['North', 'South', 'West'][Math.floor(r() * 3)]); }, []);
  const yy = y.map((v, i) => v + ({ North: 0, South: 0.8, West: -0.5 } as Record<string, number>)[region[i]]);
  const dum = (lv: string) => region.map((g) => (g === lv ? 1 : 0));
  const cols = all ? [tv, radio, dum('North'), dum('South'), dum('West')] : [tv, radio, dum('South'), dum('West')];
  const names = all ? ['const', 'TV', 'radio', 'North', 'South', 'West'] : ['const', 'TV', 'radio', 'South', 'West'];
  let res: S.OLSResult | null = null, err = '';
  try { res = S.ols(S.addConst(cols), yy, names); } catch (e) { err = String((e as Error).message); }
  return (
    <div className="widget">
      <div className="widget-h"><span className="tag">LAB</span> One-hot encoding a region with 3 levels</div>
      <label className="row small" style={{ gap: 6 }}><input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} /> include a dummy for <b>every</b> level (plus the intercept)</label>
      {err ? <div className="caption small" style={{ borderLeftColor: C.red }}>💥 X'X is singular ({err}). North + South + West = 1 = the intercept column, so one column is an exact copy of others. That's the <b>dummy variable trap</b>. Drop one level (the baseline) or drop the intercept.</div>
        : res && <><div className="tbl-wrap"><table className="tbl mono"><tbody>{res.names.map((n, i) => <tr key={n}><td>{n}</td><td>{fmt(res!.beta[i])}</td><td>p {S.fmtP(res!.p[i])}</td></tr>)}</tbody></table></div>
          <p className="small">North is the baseline (absorbed into the intercept). <b>South = {fmt(res.beta[3], 3)}</b> means "South sells ~{res.beta[3].toFixed(2)}k more units than North at the same budgets". pandas: <span className="kbd">pd.get_dummies(df, drop_first=True)</span>; statsmodels formula: <span className="kbd">C(region)</span>.</p></>}
    </div>
  );
}

/* ---------- Ch16: gradient descent ---------- */
type Algo = 'batch' | 'mini' | 'sgd';
export function GDLab() {
  const [scale, setScale] = useState<'raw' | 'std'>('std');
  const [algo, setAlgo] = useState<Algo>('batch');
  const [frac, setFrac] = useState(0.5);
  const setup = useMemo(() => {
    const cols = [tv, radio];
    const mu = cols.map(S.mean), sd = cols.map((c, j) => Math.sqrt(S.mean(c.map((v) => (v - mu[j]) ** 2))));
    const X = AD.map((_, i) => cols.map((c, j) => (scale === 'std' ? (c[i] - mu[j]) / sd[j] : c[i] - mu[j])));
    const ym = S.mean(y), yc = y.map((v) => v - ym);
    const H = S.gram(X).map((r) => r.map((v) => (2 * v) / X.length));
    const ev = S.symEigenvalues(H);
    const opt = S.matvec(S.inverse(S.gram(X)), S.xty(X, yc));
    return { X, yc, lmax: ev[0], lmin: ev[1], opt };
  }, [scale]);
  const lr = (frac * 2) / setup.lmax;
  const loss = (w: number[]) => S.mean(setup.X.map((r, i) => (S.dot(r, w) - setup.yc[i]) ** 2));
  const frames = useMemo(() => {
    const out = [{ w: [0, 0], l: loss([0, 0]) }];
    let w = [0, 0]; const r = rng(5); const n = setup.X.length;
    for (let it = 1; it <= 150; it++) {
      const idx = algo === 'batch' ? null : Array.from({ length: algo === 'sgd' ? 1 : 16 }, () => Math.floor(r() * n));
      const rows = idx ? idx : setup.X.map((_, i) => i);
      const g = [0, 0];
      rows.forEach((i) => { const e = S.dot(setup.X[i], w) - setup.yc[i]; g[0] += (2 * e * setup.X[i][0]) / rows.length; g[1] += (2 * e * setup.X[i][1]) / rows.length; });
      const step = algo === 'batch' ? lr : lr / (1 + it / 30);
      w = [w[0] - step * g[0], w[1] - step * g[1]];
      if (!w.every(isFinite) || Math.abs(w[0]) > 1e6) break;
      out.push({ w, l: loss(w) });
    }
    return out;
  }, [setup, algo, frac]);
  const p = useStepPlayer(frames.length, 70);
  const f = frames[Math.min(p.i, frames.length - 1)];
  const o = setup.opt;
  // Equal pixels per unit on both axes, so the true shape of the bowl is visible.
  const span = scale === 'std' ? [[-1.5, 6.5], [-1.4, 3.5]] : [[-0.12, 0.42], [-0.07, 0.26]];
  const cont = useMemo(() => {
    const nx = 70, ny = 70, vals: number[] = [];
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const w1 = span[0][0] + (i / (nx - 1)) * (span[0][1] - span[0][0]);
      const w2 = span[1][1] - (j / (ny - 1)) * (span[1][1] - span[1][0]);
      vals.push(Math.log(loss([w1, w2]) + 1e-6));
    }
    const lo = Math.min(...vals), hi = Math.max(...vals);
    const th = Array.from({ length: 16 }, (_, k) => lo + ((hi - lo) * (k + 0.4)) / 16);
    return { polys: contours().size([nx, ny]).thresholds(th)(vals), nx, ny };
  }, [setup]);
  const cond = setup.lmax / setup.lmin;
  return (
    <div className="widget">
      <div className="widget-h"><span className="tag">ANIMATION</span> Gradient descent on sales ~ TV + radio</div>
      <div className="row">
        <Seg value={scale} onChange={(v) => { setScale(v); p.reset(); }} options={[{ v: 'raw', label: 'raw features' }, { v: 'std', label: 'standardised' }]} />
        <Seg value={algo} onChange={(v) => { setAlgo(v); p.reset(); }} options={[{ v: 'batch', label: 'batch GD' }, { v: 'mini', label: 'mini-batch (16)' }, { v: 'sgd', label: 'SGD (1 row)' }]} />
        <Slider label="learning rate (× max stable)" value={frac} min={0.05} max={1.05} step={0.05} onChange={(v) => { setFrac(v); p.reset(); }} />
      </div>
      <div className="two" style={{ marginTop: 10 }}>
        <Plot x={span[0] as [number, number]} y={span[1] as [number, number]} xLabel={scale === 'std' ? 'w_TV (per SD)' : 'w_TV (per $k)'} yLabel={scale === 'std' ? 'w_radio (per SD)' : 'w_radio (per $k)'} fx={(v) => +v.toPrecision(3) + ''}>
          {(sx, sy) => {
            const sYScale = (sy.range()[0] - sy.range()[1]) / (cont.ny - 1), sXScale = (sx.range()[1] - sx.range()[0]) / (cont.nx - 1);
            return <>
              <g transform={`translate(${sx.range()[0]},${sy.range()[1]}) scale(${sXScale},${sYScale}) translate(-0.5,-0.5)`}>
                {cont.polys.map((c, k) => <path key={k} d={geoPath()(c as any) || ''} fill="none" stroke={`hsl(${200 - k * 10} 70% ${32 + k * 3}%)`} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />)}
              </g>
              <Path sx={sx} sy={sy} pts={frames.slice(0, p.i + 1).map((q) => ({ x: q.w[0], y: q.w[1] }))} color={C.yellow} width={1.6} />
              <circle cx={sx(o[0])} cy={sy(o[1])} r={6} fill="none" stroke={C.green} strokeWidth={2} />
              <circle cx={sx(f.w[0])} cy={sy(f.w[1])} r={5} fill={C.yellow} />
            </>;
          }}
        </Plot>
        <div>
          <Plot x={[0, 150]} y={[Math.log10(Math.max(0.1, loss(o) * 0.9)), Math.log10(Math.max(...frames.map((q) => q.l).filter(isFinite).slice(0, 3), loss([0, 0])) * 1.2)]} w={380} h={220} xLabel="iteration" yLabel="log₁₀ MSE" title="loss curve">
            {(sx, sy) => <><Path sx={sx} sy={sy} pts={frames.slice(0, p.i + 1).map((q, i) => ({ x: i, y: Math.log10(q.l) }))} color={C.red} />
              <line x1={sx(0)} x2={sx(150)} y1={sy(Math.log10(loss(o)))} y2={sy(Math.log10(loss(o)))} stroke={C.green} strokeDasharray="4 4" /></>}
          </Plot>
          <div className="stats">
            <Stat label="iteration" value={p.i} />
            <Stat label="MSE" value={isFinite(f.l) ? f.l.toFixed(3) : '∞'} />
            <Stat label="optimum MSE" value={loss(o).toFixed(3)} color={C.green} />
            <Stat label="condition κ" value={cond.toFixed(cond > 100 ? 0 : 1)} color={cond > 20 ? C.red : C.green} hint="λmax / λmin of the Hessian" />
          </div>
        </div>
      </div>
      <PlayerControls p={p} />
      <div className="caption small">{scale === 'raw' ? `Raw features: the bowl is a long, narrow valley (κ = ${cond.toFixed(0)}). The step size must be tiny to avoid blowing up along the steep TV direction, so progress along the shallow radio direction crawls.` : 'Standardised: the bowl is nearly round, so every step points close to the minimum. Same data, same model, far fewer iterations.'} {frac > 1 && algo === 'batch' ? ' Above 1× the maximum stable rate the iterates oscillate and diverge.' : ''} {algo !== 'batch' ? ' Stochastic updates are noisy but cheap: one row (or 16) per step instead of all 200. With a decaying step size they settle near the optimum.' : ''}</div>
    </div>
  );
}
