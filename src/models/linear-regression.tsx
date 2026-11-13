import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { contours, geoIdentity, geoPath, scaleLinear, line as d3line } from 'd3';
import { World, sx, sy } from '../components/World';
import { useStepPlayer, PlayerControls } from '../components/StepPlayer';
import { Tex } from '../components/Tex';
import { flats, P } from '../lib/datasets';
import { linregGD, mse, ols, r2, split } from '../lib/ml';
import { lazy } from 'react';
import { ModelContent } from './types';

const LinearRegressionGuide = lazy(() => import('../guide/linreg').then((m) => ({ default: m.LinearRegressionGuide })));

// Units for the business story: x = area in 200 sq ft, y = price in ₹10 lakh.
const fx = (v: number) => `${v * 200}`;
const fy = (v: number) => `₹${v * 10}L`;
const AX = { xLabel: 'area (sq ft)', yLabel: 'price (₹ lakh)', fx, fy };

const Line = ({ m, b, color = '#ffff00', dash }: { m: number; b: number; color?: string; dash?: string }) => (
  <motion.line initial={false} animate={{ x1: sx(-1), y1: sy(m * -1 + b), x2: sx(11), y2: sy(m * 11 + b) }}
    transition={{ duration: 0.35 }} stroke={color} strokeWidth={2.5} strokeDasharray={dash} />
);
const Dots = ({ pts }: { pts: P[] }) => <>{pts.map((p, i) => <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={4.5} fill="#58c4dd" stroke="#0b0e13" />)}</>;
const Residuals = ({ pts, m, b, squares = false }: { pts: P[]; m: number; b: number; squares?: boolean }) => (
  <>{pts.map((p, i) => {
    const yh = m * p.x + b;
    if (squares) {
      const side = Math.abs(sy(p.y) - sy(yh));
      return <rect key={i} x={sx(p.x)} y={Math.min(sy(p.y), sy(yh))} width={side} height={side} fill="#fc6255" fillOpacity={0.18} stroke="#fc6255" strokeWidth={0.8} />;
    }
    return <line key={i} x1={sx(p.x)} x2={sx(p.x)} y1={sy(p.y)} y2={sy(yh)} stroke="#fc6255" strokeWidth={1.2} strokeDasharray="3 2" />;
  })}</>
);

/* ---------- Loss landscape (MSE over m, b) with the gradient-descent path ---------- */
const LW = 300, LH = 300, M_RANGE: [number, number] = [-1, 2.5], B_RANGE: [number, number] = [-3, 9];
function LossLandscape({ pts, path, cur }: { pts: P[]; path: { m: number; b: number }[]; cur: number }) {
  const nx = 60, ny = 60;
  const sm = scaleLinear().domain(M_RANGE).range([0, LW]);
  const sb = scaleLinear().domain(B_RANGE).range([LH, 0]);
  const paths = useMemo(() => {
    const vals: number[] = [];
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const m = M_RANGE[0] + (i / (nx - 1)) * (M_RANGE[1] - M_RANGE[0]);
      const b = B_RANGE[1] - (j / (ny - 1)) * (B_RANGE[1] - B_RANGE[0]);
      vals.push(Math.log(mse(pts, m, b) + 1e-3));
    }
    const lo = Math.min(...vals), hi = Math.max(...vals);
    const th = Array.from({ length: 14 }, (_, k) => lo + ((hi - lo) * (k + 0.5)) / 14);
    const gp = geoPath(geoIdentity().scale(LW / (nx - 1)) as any);
    return contours().size([nx, ny]).thresholds(th)(vals).map((c, k) => ({ d: gp(c as any) || '', k }));
  }, [pts]);
  const vis = path.slice(0, cur + 1).filter((p) => isFinite(p.m) && Math.abs(p.m) < 50 && Math.abs(p.b) < 100);
  const lineGen = d3line<{ m: number; b: number }>().x((d) => sm(d.m)).y((d) => sb(d.b));
  const last = vis[vis.length - 1];
  const best = ols(pts);
  return (
    <svg viewBox={`-30 -6 ${LW + 40} ${LH + 36}`} className="canvas" style={{ maxWidth: 380 }}>
      <defs><clipPath id="lossclip"><rect width={LW} height={LH} /></clipPath></defs>
      <g clipPath="url(#lossclip)">
        {paths.map((c) => <path key={c.k} d={c.d} fill="none" stroke={`hsl(${200 - c.k * 12} 70% ${30 + c.k * 3}%)`} strokeWidth={1.2} />)}
        <circle cx={sm(best.m)} cy={sb(best.b)} r={5} fill="none" stroke="#83c167" strokeWidth={2} />
        {vis.length > 1 && <path d={lineGen(vis) || ''} fill="none" stroke="#ffff00" strokeWidth={1.6} />}
        {last && <motion.circle initial={false} animate={{ cx: sm(last.m), cy: sb(last.b) }} r={5} fill="#ffff00" />}
      </g>
      <text x={LW / 2} y={LH + 24} fill="#8b95a7" fontSize={11} textAnchor="middle">slope m</text>
      <text x={-18} y={LH / 2} fill="#8b95a7" fontSize={11} textAnchor="middle" transform={`rotate(-90 -18 ${LH / 2})`}>intercept b</text>
      {[-1, 0, 1, 2].map((v) => <text key={v} x={sm(v)} y={LH + 12} fill="#5b6576" fontSize={9} textAnchor="middle">{v}</text>)}
    </svg>
  );
}

/* ---------- Animate: gradient descent fitting the line ---------- */
function Animate() {
  const [lr, setLr] = useState(0.02);
  const [seed, setSeed] = useState(7);
  const pts = useMemo(() => flats(30, seed), [seed]);
  const frames = useMemo(() => linregGD(pts, lr, 2000), [pts, lr]);
  const p = useStepPlayer(frames.length, 450);
  const f = frames[p.i];
  const diverged = !isFinite(f.loss) || f.loss > 1e4;
  return (
    <div>
      <div className="row" style={{ marginBottom: 10 }}>
        <span className="small muted">Learning rate:</span>
        {[[0.005, 'too small'], [0.02, 'just right'], [0.035, 'too big']].map(([v, l]) => (
          <button key={v} className={`btn ${lr === v ? 'primary' : ''}`} onClick={() => { setLr(v as number); p.reset(); }}>{v} · {l}</button>
        ))}
        <span className="spacer" />
        <button className="btn" onClick={() => { setSeed((s) => s + 1); p.reset(); }}>🔀 Reshuffle data</button>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)' }}>
        <World {...AX}>
          <Residuals pts={pts} m={f.m} b={f.b} />
          <Dots pts={pts} />
          <Line m={f.m} b={f.b} />
        </World>
        <div>
          <LossLandscape pts={pts} path={frames} cur={p.i} />
          <div className="legend"><span><span className="dot" style={{ background: '#ffff00' }} />current (m, b)</span><span><span className="dot" style={{ border: '2px solid #83c167' }} />true minimum</span></div>
        </div>
      </div>
      <PlayerControls p={p} />
      <div className="caption mono small">
        {diverged ? <>💥 Iteration {f.iter}: loss exploded. The learning rate is so big that every step overshoots the valley and lands higher up the other side.</> : <>
          iter {f.iter} · ŷ = {f.m.toFixed(3)}·x + {f.b.toFixed(3)} · MSE = {f.loss.toFixed(3)} · ∂L/∂m = {f.dm.toFixed(3)} · ∂L/∂b = {f.db.toFixed(3)}
          <br /><span style={{ fontFamily: 'Inter' }}>{p.i === 0 ? 'We start with a deliberately bad line. Red dashes are the errors (residuals).' : p.i < 15 ? 'Each step moves m and b a little against the gradient, downhill on the loss landscape on the right.' : f.iter < 400 ? 'Notice the path: it races down the steep walls, then crawls along the long flat valley floor. That is why scaling features matters.' : 'Steps shrink as the slope flattens near the bottom of the valley.'}</span></>}
      </div>
    </div>
  );
}

/* ---------- Playground ---------- */
function Playground() {
  const [pts, setPts] = useState<P[]>(() => flats(12, 3));
  const [manual, setManual] = useState(false);
  const [squares, setSquares] = useState(true);
  const [mm, setM] = useState(0.5), [bb, setB] = useState(3);
  const fit = ols(pts);
  const m = manual ? mm : fit.m, b = manual ? bb : fit.b;
  const add = (q: { x: number; y: number }, shift: boolean) => {
    if (shift) {
      if (!pts.length) return;
      let j = 0; pts.forEach((p, i) => { if ((p.x - q.x) ** 2 + (p.y - q.y) ** 2 < (pts[j].x - q.x) ** 2 + (pts[j].y - q.y) ** 2) j = i; });
      setPts(pts.filter((_, i) => i !== j));
    } else setPts([...pts, q]);
  };
  return (
    <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)' }}>
      <div>
        <World {...AX} onAdd={add}>
          {pts.length > 1 && <Residuals pts={pts} m={m} b={b} squares={squares} />}
          <Dots pts={pts} />
          {pts.length > 1 && <Line m={m} b={b} color={manual ? '#f0ac5f' : '#ffff00'} />}
          {manual && pts.length > 1 && <Line m={fit.m} b={fit.b} color="#83c167" dash="5 4" />}
        </World>
        <p className="small muted" style={{ marginTop: 6 }}>Click to add a flat · Shift-click to remove the nearest · Try adding one wild outlier far above the line.</p>
      </div>
      <div className="card">
        <h3>Controls</h3>
        <label className="row small"><input type="checkbox" checked={squares} onChange={(e) => setSquares(e.target.checked)} /> Show squared errors as actual squares</label>
        <label className="row small"><input type="checkbox" checked={manual} onChange={(e) => setManual(e.target.checked)} /> Fit it myself (beat the computer)</label>
        {manual && <>
          <div className="row small">m <input type="range" min={-1} max={2.5} step={0.01} value={mm} onChange={(e) => setM(+e.target.value)} /> {mm.toFixed(2)}</div>
          <div className="row small">b <input type="range" min={-3} max={9} step={0.05} value={bb} onChange={(e) => setB(+e.target.value)} /> {bb.toFixed(2)}</div>
        </>}
        <hr style={{ borderColor: '#2a3342' }} />
        {pts.length > 1 ? <div className="mono small">
          <div>points: {pts.length}</div>
          <div>your line: ŷ = {m.toFixed(2)}x + {b.toFixed(2)}</div>
          <div>MSE: <b style={{ color: '#fc6255' }}>{mse(pts, m, b).toFixed(3)}</b></div>
          <div>R²: <b style={{ color: '#83c167' }}>{r2(pts, m, b).toFixed(3)}</b></div>
          {manual && <div style={{ marginTop: 6 }}>best possible MSE: {mse(pts, fit.m, fit.b).toFixed(3)} {mse(pts, m, b) - mse(pts, fit.m, fit.b) < 0.01 ? '🎉 you matched OLS!' : ''}</div>}
        </div> : <p className="muted small">Add at least two points.</p>}
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn" onClick={() => setPts([])}>Clear</button>
          <button className="btn" onClick={() => setPts(flats(12, Math.floor(Math.random() * 1000)))}>Random data</button>
        </div>
        <p className="small muted" style={{ marginTop: 12 }}>"Least squares" literally means: make the total red area as small as possible.</p>
      </div>
    </div>
  );
}

/* ---------- Math visual ---------- */
function MathVis({ mode }: { mode: 'data' | 'line' | 'res' | 'sq' | 'center' | 'gd' }) {
  const pts = useMemo(() => flats(14, 21), []);
  const f = ols(pts);
  return (
    <World {...AX} width={420} height={300}>
      {mode === 'res' && <Residuals pts={pts} m={f.m} b={f.b} />}
      {mode === 'sq' && <Residuals pts={pts} m={f.m} b={f.b} squares />}
      <Dots pts={pts} />
      {mode !== 'data' && <Line m={mode === 'gd' ? f.m * 0.6 : f.m} b={mode === 'gd' ? f.b + 1.6 : f.b} />}
      {mode === 'center' && <><circle cx={sx(f.mx!)} cy={sy(f.my!)} r={8} fill="#83c167" /><text x={sx(f.mx!) + 12} y={sy(f.my!) - 10} fill="#83c167" fontSize={13}>(x̄, ȳ)</text></>}
      {mode === 'gd' && <Line m={f.m} b={f.b} color="#83c167" dash="5 4" />}
    </World>
  );
}

/* ---------- Pipeline ---------- */
function computeFlatsPipeline() {
  const raw = flats(40, 17);
  const withOutlier = [...raw, { x: 2, y: 9.6 }];
  const clean = raw;
  const { train, test } = split(clean, 0.3, 4);
  const fit = ols(train);
  const rmse = Math.sqrt(mse(test, fit.m, fit.b));
  return { raw: withOutlier, clean, train, test, fit, rmse, r2t: r2(test, fit.m, fit.b) };
}
function DeployWidget({ m, b }: { m: number; b: number }) {
  const [area, setArea] = useState(1000);
  const price = (m * (area / 200) + b) * 10;
  return (
    <div className="row" style={{ marginTop: 10 }}>
      <span>Area</span><input type="range" min={300} max={1800} step={50} value={area} onChange={(e) => setArea(+e.target.value)} />
      <b>{area} sq ft</b><span>→ predicted price</span><b style={{ color: '#ffff00', fontSize: '1.3rem' }}>₹{price.toFixed(1)} lakh</b>
    </div>
  );
}
const pl = computeFlatsPipeline();

export const linearRegression: ModelContent = {
  Guide: LinearRegressionGuide,
  story: (
    <div className="grid g2">
      <div>
        <h3>🏠 The analogy</h3>
        <p>You're a property agent in Chennai. A client asks: <i>"What should a 1,000 sq ft flat in Velachery cost?"</i> You pull up the last 30 sales, plot area against price, and lay a ruler across the cloud of points so that it passes as close to all of them as it can. Read the price off the ruler at 1,000 sq ft. <b>That ruler is linear regression.</b></p>
        <h3>🏢 Where it is used for real</h3>
        <ul>
          <li><b>Zillow's "Zestimate"</b> started life as regression on home features before growing into ensembles.</li>
          <li><b>Retail demand planning</b>: sales vs price, promotion and season, the first model every analyst builds.</li>
          <li><b>Automotive</b>: fuel consumption vs vehicle mass, or battery range vs temperature (a typical P3/OEM question).</li>
          <li><b>Finance</b>: CAPM beta is literally the slope of a stock's returns regressed on the market's.</li>
        </ul>
      </div>
      <div>
        <h3>✅ Use it when</h3>
        <ul><li>The relationship looks roughly straight.</li><li>You need to explain the answer ("each extra 100 sq ft adds about ₹4.3 lakh").</li><li>You want a baseline before trying anything fancy.</li></ul>
        <h3>⛔ Avoid / be careful when</h3>
        <ul><li>The relationship is curved (try polynomial features or trees).</li><li>There are big outliers. Squared error lets one point drag the whole line (try it in the Playground).</li><li>You extrapolate far beyond the data: the ruler doesn't know the market stops at some point.</li></ul>
        <h3>🧠 One-line intuition</h3>
        <p className="caption" style={{ marginTop: 0 }}>Find the line that makes the total area of the "error squares" as small as possible.</p>
      </div>
    </div>
  ),
  Animate,
  Playground,
  pipeline: [
    { name: 'Data', icon: '📥', detail: <><p>{pl.raw.length} recent flat sales: area (sq ft) → price (₹ lakh).</p><table className="mono small"><tbody>{pl.raw.slice(0, 5).map((p, i) => <tr key={i}><td>{(p.x * 200).toFixed(0)} sq ft</td><td style={{ paddingLeft: 20 }}>₹{(p.y * 10).toFixed(1)} L</td></tr>)}<tr><td>…</td></tr></tbody></table></> },
    { name: 'Clean', icon: '🧹', detail: <><p>One sale is 400 sq ft for ₹96 lakh, almost certainly a data-entry error (or a penthouse with the wrong area). Plotting first catches it, and we remove it.</p><p className="muted small">Lesson: squared error punishes big misses heavily, so a single outlier can tilt the whole line.</p></> },
    { name: 'Features', icon: '🧩', detail: <p>One feature: <b>area</b>. In multiple regression we'd add floor, age, distance to the metro, and so on. No scaling is needed for OLS, but gradient descent converges much faster with scaled features.</p> },
    { name: 'Split', icon: '✂️', detail: <p>Random 70/30 split → <b>{pl.train.length}</b> training sales, <b>{pl.test.length}</b> held-out test sales. The model never sees the test set during training.</p> },
    { name: 'Train', icon: '🏋️', detail: <><p>Ordinary least squares on the training set:</p><Tex block>{`\\hat{y} = ${pl.fit.m.toFixed(3)}\\,x + ${pl.fit.b.toFixed(3)}`}</Tex><p>In business terms, every extra 100 sq ft adds about <b>₹{(pl.fit.m * 5).toFixed(1)} lakh</b>.</p></> },
    { name: 'Evaluate', icon: '📏', detail: <><p>On the unseen test flats:</p><p className="mono">R² = {pl.r2t.toFixed(3)} · RMSE = ₹{(pl.rmse * 10).toFixed(1)} lakh</p><p className="small muted">RMSE in rupees is what the client cares about: "my estimate is usually within about ₹{(pl.rmse * 10).toFixed(0)} lakh."</p></> },
    { name: 'Deploy', icon: '🚀', detail: <><p>Wrap the formula in an API or a spreadsheet cell. Try it:</p><DeployWidget m={pl.fit.m} b={pl.fit.b} /><p className="small muted" style={{ marginTop: 10 }}>Monitor it: when the market shifts, residuals drift. Retrain on fresh sales every quarter.</p></> },
  ],
  math: [
    { tex: '\\hat{y} = m\\,x + b', say: 'The model: a predicted price ŷ is a slope m times the area x, plus an intercept b.', visual: <MathVis mode="line" /> },
    { tex: 'e_i = y_i - \\hat{y}_i', say: 'Each residual e is the vertical gap between the real price and the line.', visual: <MathVis mode="res" /> },
    { tex: 'L(m,b) = \\frac{1}{n}\\sum_{i=1}^{n} (y_i - m x_i - b)^2', say: 'Square each gap (so negatives don\'t cancel and big misses hurt more) and average them. This is the Mean Squared Error: literally the mean area of the red squares.', visual: <MathVis mode="sq" /> },
    { tex: '\\frac{\\partial L}{\\partial b} = -\\frac{2}{n}\\sum (y_i - m x_i - b) = 0 \\;\\Rightarrow\\; b = \\bar{y} - m\\bar{x}', say: 'At the minimum, the slope of L with respect to b is zero. Solving shows the best line always passes through the centre of mass of the data, (x̄, ȳ).', visual: <MathVis mode="center" /> },
    { tex: '\\frac{\\partial L}{\\partial m} = 0 \\;\\Rightarrow\\; m = \\frac{\\sum (x_i-\\bar{x})(y_i-\\bar{y})}{\\sum (x_i-\\bar{x})^2} = \\frac{\\operatorname{Cov}(x,y)}{\\operatorname{Var}(x)}', say: 'Doing the same for m gives the closed-form slope: how much x and y move together, divided by how much x moves on its own.', visual: <MathVis mode="center" /> },
    { tex: 'm \\leftarrow m - \\alpha \\frac{\\partial L}{\\partial m}, \\quad b \\leftarrow b - \\alpha \\frac{\\partial L}{\\partial b}', say: 'With millions of rows or features, we don\'t solve the equations directly. We walk downhill with gradient descent at learning rate α. This is the same idea that trains neural networks.', visual: <MathVis mode="gd" /> },
    { tex: 'R^2 = 1 - \\frac{\\sum (y_i-\\hat{y}_i)^2}{\\sum (y_i-\\bar{y})^2}', say: 'R² compares our red squares with those of the laziest model (always predicting the mean ȳ). 1 = perfect, 0 = no better than the mean.', visual: <MathVis mode="sq" /> },
  ],
  code: [
    { title: 'From scratch (NumPy)', code: `import numpy as np

rng = np.random.default_rng(7)
area = rng.uniform(200, 1800, 30)                 # sq ft
price = 8 + 0.0425 * area + rng.normal(0, 8, 30)  # ₹ lakh

# Scale x so gradient descent behaves (try removing this!)
x = (area - area.mean()) / area.std()
y = price

m, b, lr = 0.0, 0.0, 0.1
for i in range(201):
    y_hat = m * x + b
    err = y_hat - y
    dm = 2 * np.mean(err * x)
    db = 2 * np.mean(err)
    m -= lr * dm
    b -= lr * db
    if i % 40 == 0:
        print(f"iter {i:3d}  MSE={np.mean(err**2):8.2f}  m={m:6.2f}  b={b:6.2f}")

# Closed form for comparison
m_ols = np.cov(x, y, bias=True)[0, 1] / np.var(x)
b_ols = y.mean() - m_ols * x.mean()
print(f"\\nGradient descent: m={m:.3f}, b={b:.3f}")
print(f"Closed form OLS : m={m_ols:.3f}, b={b_ols:.3f}")
` },
    { title: 'scikit-learn', code: `import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error

rng = np.random.default_rng(17)
area = rng.uniform(200, 1800, 120).reshape(-1, 1)
price = 8 + 0.0425 * area[:, 0] + rng.normal(0, 8, 120)

X_tr, X_te, y_tr, y_te = train_test_split(area, price, test_size=0.3, random_state=4)
model = LinearRegression().fit(X_tr, y_tr)

pred = model.predict(X_te)
print(f"slope  : ₹{model.coef_[0]*100:.2f} lakh per 100 sq ft")
print(f"interc.: ₹{model.intercept_:.2f} lakh")
print(f"R² test: {r2_score(y_te, pred):.3f}")
print(f"RMSE   : ₹{mean_squared_error(y_te, pred) ** 0.5:.2f} lakh")
print(f"1000 sq ft → ₹{model.predict([[1000]])[0]:.1f} lakh")
` },
    { title: 'Classic dataset (diabetes)', code: `from sklearn.datasets import load_diabetes
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import cross_val_score
import pandas as pd

X, y = load_diabetes(return_X_y=True, as_frame=True)
print(X.head(3), "\\n")

# Simple regression on one feature (BMI) vs multiple regression on all ten
for cols in (["bmi"], list(X.columns)):
    r2 = cross_val_score(LinearRegression(), X[cols], y, cv=5, scoring="r2").mean()
    print(f"{len(cols):2d} feature(s): mean CV R² = {r2:.3f}")

coef = pd.Series(LinearRegression().fit(X, y).coef_, index=X.columns).sort_values()
print("\\nCoefficients (features are pre-scaled):\\n", coef.round(1))
` },
  ],
  quiz: [
    { q: 'Why do we square the residuals instead of just adding them?', options: ['Squares are faster to compute', 'Positive and negative errors would cancel out, and big misses should hurt more', 'It makes the line pass through the origin', 'It removes outliers'], answer: 1, why: 'Raw residuals sum to zero for the OLS line. Squaring makes every error count and penalises large errors disproportionately.' },
    { q: 'The OLS line always passes through which point?', options: ['(0, 0)', '(x̄, ȳ), the mean of the data', 'The largest y value', 'The median point'], answer: 1, why: 'Setting ∂L/∂b = 0 gives b = ȳ − m·x̄, so the point (x̄, ȳ) lies on the line.' },
    { q: 'Gradient descent\'s loss shoots up to infinity. Most likely cause?', options: ['Learning rate too small', 'Learning rate too large', 'Too much data', 'R² is negative'], answer: 1, why: 'A step size that is too large overshoots the valley every time and climbs out of it. Try 0.035 in the Animate tab.' },
    { q: 'A model has R² = 0 on the test set. What does that mean?', options: ['Perfect predictions', 'It is no better than always predicting the mean', 'It is impossible', 'The slope is zero by definition'], answer: 1, why: 'R² compares against the mean-only baseline. Test R² can even go negative if the model is worse than that baseline.' },
    { q: 'Interview: what are the key assumptions of linear regression?', options: ['Linearity, independent errors, constant error variance, (roughly) normal errors, no perfect multicollinearity', 'Features must be categorical', 'The target must be binary', 'There are no assumptions'], answer: 0, why: 'Often summarised as LINE: Linearity, Independence, Normality of errors, Equal variance (homoscedasticity), plus no perfect multicollinearity among features.', interview: true },
    { q: 'Interview: a single outlier pulls your regression line. What can you do?', options: ['Nothing, it is mathematics', 'Investigate it; use robust loss (Huber), transform the target, or remove it if it is an error', 'Increase the learning rate', 'Add more features'], answer: 1, why: 'Always check whether it is an error first. Robust regression (Huber, RANSAC) or a log transform reduces sensitivity to outliers.', interview: true },
  ],
  cheatsheet: (
    <div>
      <h2>Linear Regression: cheat sheet</h2>
      <table><tbody>
        <tr><th>Model</th><td><Tex>{'\\hat y = mx + b'}</Tex> (many features: <Tex>{'\\hat y = X\\beta'}</Tex>)</td></tr>
        <tr><th>Loss</th><td>MSE <Tex>{'\\frac1n\\sum(y-\\hat y)^2'}</Tex></td></tr>
        <tr><th>Closed form</th><td><Tex>{'m=\\frac{\\mathrm{Cov}(x,y)}{\\mathrm{Var}(x)},\\ b=\\bar y-m\\bar x'}</Tex>; matrix form <Tex>{'\\beta=(X^TX)^{-1}X^Ty'}</Tex></td></tr>
        <tr><th>Gradient descent</th><td><Tex>{'\\theta \\leftarrow \\theta - \\alpha\\nabla L'}</Tex>. Scale features first.</td></tr>
        <tr><th>Metrics</th><td>R², RMSE (same units as y), MAE (robust)</td></tr>
        <tr><th>Assumptions</th><td>Linearity · independent errors · equal variance · normal errors · no perfect multicollinearity</td></tr>
        <tr><th>Watch out for</th><td>Outliers · extrapolation · curved relationships · leakage</td></tr>
        <tr><th>sklearn</th><td><code>LinearRegression().fit(X, y)</code>; regularised: <code>Ridge</code>, <code>Lasso</code></td></tr>
        <tr><th>Next topics</th><td>Multiple regression → Polynomial → Ridge/Lasso → Logistic regression</td></tr>
      </tbody></table>
    </div>
  ),
};
