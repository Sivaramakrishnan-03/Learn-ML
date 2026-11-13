// Widgets for chapters 1–3: business scatter, least-squares playground, least-squares animation, projection.
import { useMemo, useState } from 'react';
import { Tex } from '../../components/Tex';
import { useStepPlayer, PlayerControls } from '../../components/StepPlayer';
import { AD, AD_COLS, AD_LABEL, AdCol } from '../../lib/advertising';
import { rng, gauss } from '../../lib/datasets';
import * as S from '../../lib/stats';
import { Band, C, Dots, HLine, Path, Plot, Seg, Stat, extent, fmt } from '../ui';

/* ---------- Ch1: the three channels ---------- */
export function ChannelScatter() {
  const [col, setCol] = useState<AdCol>('tv');
  const xs = AD.map((d) => d[col]), ys = AD.map((d) => d.sales);
  const f = S.ols1(xs, ys);
  const dom = extent(xs);
  return (
    <div className="widget">
      <div className="widget-h"><span className="tag">EXPLORE</span> Which channel moves sales?<span className="spacer" />
        <Seg value={col} onChange={setCol} options={AD_COLS.map((c) => ({ v: c, label: AD_LABEL[c] }))} /></div>
      <div className="two">
        <Plot x={dom} y={[0, 30]} xLabel={AD_LABEL[col]} yLabel="sales (k units)">
          {(sx, sy) => <><Dots sx={sx} sy={sy} xs={xs} ys={ys} r={3} />
            <Path sx={sx} sy={sy} pts={dom.map((x) => ({ x, y: f.beta[0] + f.beta[1] * x }))} /></>}
        </Plot>
        <div>
          <div className="stats">
            <Stat label="slope" value={fmt(f.beta[1], 4)} color={C.yellow} />
            <Stat label="R²" value={f.r2.toFixed(3)} color={C.green} />
            <Stat label="p-value" value={S.fmtP(f.p[1])} />
          </div>
          <p className="small">Each extra <b>$1,000</b> on {AD_LABEL[col].split(' ')[0]} goes with about <b style={{ color: C.yellow }}>{(f.beta[1] * 1000).toFixed(0)} more units</b> sold, on its own.</p>
          {col === 'newspaper' && <p className="small" style={{ color: C.gold }}>Newspaper looks significant here. Hold that thought: in Chapter 9 it collapses once radio is in the model, because markets that buy radio also tend to buy newspaper.</p>}
          {col === 'tv' && <p className="small muted">Notice the funnel: sales are more spread out at high TV budgets. That's a heteroscedasticity hint (Chapter 5).</p>}
        </div>
      </div>
    </div>
  );
}

/* ---------- Ch2 + Ch11: drag-points playground ---------- */
type Pt = { x: number; y: number };
const seedPts = (n = 14, seed = 4): Pt[] => {
  const r = rng(seed);
  return Array.from({ length: n }, () => { const x = 0.8 + r() * 8.4; return { x, y: 1.2 + 0.75 * x + gauss(r) * 0.9 }; });
};

export function Playground({ bands = false }: { bands?: boolean }) {
  const [pts, setPts] = useState<Pt[]>(() => seedPts());
  const [drag, setDrag] = useState<number | null>(null);
  const [mode, setMode] = useState<'lines' | 'squares' | 'none'>('squares');
  const [manual, setManual] = useState(false);
  const [m, setM] = useState(0.4), [b, setB] = useState(3);
  const [showCI, setCI] = useState(bands), [showPI, setPI] = useState(bands);
  const ok = pts.length >= 3;
  const res = ok ? S.ols1(pts.map((p) => p.x), pts.map((p) => p.y)) : null;
  const lb = manual || !res ? [b, m] : res.beta;
  const sse = pts.reduce((s, p) => s + (p.y - lb[0] - lb[1] * p.x) ** 2, 0);
  const near = (q: Pt) => pts.findIndex((p) => Math.hypot(p.x - q.x, (p.y - q.y)) < 0.35);
  const grid = Array.from({ length: 41 }, (_, i) => i * 0.25);
  const bandPts = res ? grid.map((x) => ({ x, ...S.intervals(res, [1, x]) })) : [];
  const xm = ok ? S.mean(pts.map((p) => p.x)) : 0, ym = ok ? S.mean(pts.map((p) => p.y)) : 0;
  return (
    <div className="widget">
      <div className="widget-h"><span className="tag">PLAYGROUND</span> Drag the points. Click empty space to add one; double-click a point to delete it.</div>
      <div className="two">
        <div>
          <Plot x={[0, 10]} y={[0, 10]} xLabel="x (e.g. TV budget)" yLabel="y (e.g. sales)" cursor={drag !== null ? 'grabbing' : 'crosshair'}
            onDown={(q, e) => {
              const i = near(q);
              if (e.detail === 2 && i >= 0) { setPts(pts.filter((_, j) => j !== i)); return; }
              if (i >= 0) setDrag(i); else if (q.x > 0 && q.x < 10 && q.y > 0 && q.y < 10) setPts([...pts, q]);
            }}
            onMove={(q) => { if (drag !== null) setPts(pts.map((p, j) => (j === drag ? { x: Math.min(9.9, Math.max(0.1, q.x)), y: Math.min(9.9, Math.max(0.1, q.y)) } : p))); }}
            onUp={() => setDrag(null)}>
            {(sx, sy) => <>
              {res && showPI && <Band sx={sx} sy={sy} pts={bandPts.map((d) => ({ x: d.x, lo: d.pi[0], hi: d.pi[1] }))} color={C.purple} opacity={0.16} />}
              {res && showCI && <Band sx={sx} sy={sy} pts={bandPts.map((d) => ({ x: d.x, lo: d.ci[0], hi: d.ci[1] }))} color={C.yellow} opacity={0.2} />}
              {ok && mode !== 'none' && pts.map((p, i) => {
                const yh = lb[0] + lb[1] * p.x;
                if (mode === 'lines') return <line key={i} x1={sx(p.x)} x2={sx(p.x)} y1={sy(p.y)} y2={sy(yh)} stroke={C.red} strokeDasharray="3 2" />;
                const side = Math.abs(sy(p.y) - sy(yh));
                return <rect key={i} x={sx(p.x)} y={Math.min(sy(p.y), sy(yh))} width={side} height={side} fill={C.red} fillOpacity={0.16} stroke={C.red} strokeWidth={0.8} />;
              })}
              {ok && <Path sx={sx} sy={sy} pts={[{ x: 0, y: lb[0] }, { x: 10, y: lb[0] + lb[1] * 10 }]} color={manual ? C.gold : C.yellow} width={2.5} />}
              {ok && manual && res && <Path sx={sx} sy={sy} pts={[{ x: 0, y: res.beta[0] }, { x: 10, y: res.beta[0] + res.beta[1] * 10 }]} color={C.green} dash="5 4" />}
              {ok && !manual && <circle cx={sx(xm)} cy={sy(ym)} r={6} fill="none" stroke={C.green} strokeWidth={2} />}
              {pts.map((p, i) => <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={drag === i ? 8 : 6} fill={C.blue} stroke="#0b0e13" style={{ cursor: 'grab' }} />)}
            </>}
          </Plot>
          <div className="row small" style={{ marginTop: 8 }}>
            <Seg value={mode} onChange={setMode} options={[{ v: 'squares', label: 'squared errors' }, { v: 'lines', label: 'residuals' }, { v: 'none', label: 'clean' }]} />
            <label className="row" style={{ gap: 4 }}><input type="checkbox" checked={showCI} onChange={(e) => setCI(e.target.checked)} /> 95% CI</label>
            <label className="row" style={{ gap: 4 }}><input type="checkbox" checked={showPI} onChange={(e) => setPI(e.target.checked)} /> 95% PI</label>
          </div>
        </div>
        <div>
          {res ? <>
            <div className="stats">
              <Stat label="intercept b₀" value={fmt(lb[0], 3)} />
              <Stat label="slope b₁" value={fmt(lb[1], 3)} color={C.yellow} />
              <Stat label="SSE (red area)" value={sse.toFixed(2)} color={C.red} />
              <Stat label="R²" value={(1 - sse / res.sst).toFixed(3)} color={C.green} />
            </div>
            {!manual && <div className="stats">
              <Stat label="SE(b₁)" value={fmt(res.se[1], 3)} />
              <Stat label="t" value={res.t[1].toFixed(2)} />
              <Stat label="p-value" value={S.fmtP(res.p[1])} color={res.p[1] < 0.05 ? C.green : C.red} />
              <Stat label="σ̂" value={res.sigma.toFixed(3)} />
            </div>}
            <label className="row small" style={{ gap: 6, marginTop: 8 }}><input type="checkbox" checked={manual} onChange={(e) => setManual(e.target.checked)} /> Fit it myself: can I beat least squares?</label>
            {manual && <div>
              <div className="row small">slope <input type="range" min={-1} max={2.5} step={0.01} value={m} onChange={(e) => setM(+e.target.value)} /> {m.toFixed(2)}</div>
              <div className="row small">intercept <input type="range" min={-3} max={8} step={0.02} value={b} onChange={(e) => setB(+e.target.value)} /> {b.toFixed(2)}</div>
              <p className="small">Best possible SSE: <b>{res.ssr.toFixed(2)}</b>. {sse - res.ssr < 0.05 ? '🎉 You found the least-squares line.' : `You're ${(sse - res.ssr).toFixed(2)} above it.`}</p>
            </div>}
            <p className="small muted" style={{ marginTop: 8 }}>
              Try: drag one point far above the line at the right edge, and watch the slope swing and the p-value move. Delete points until n = 3 and see how wide the bands get.
              {!manual && ' The green ring is (x̄, ȳ): the line always passes through it.'}
            </p>
          </> : <p className="muted small">Add at least 3 points.</p>}
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn" onClick={() => setPts(seedPts(14, Math.floor(Math.random() * 999)))}>New data</button>
            <button className="btn" onClick={() => setPts([])}>Clear</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Ch3: least squares, animated ---------- */
export function LeastSquaresAnim() {
  const pts = useMemo(() => seedPts(12, 21), []);
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const fit = S.ols1(xs, ys);
  const xm = S.mean(xs), ym = S.mean(ys);
  const [b1o] = fit.beta.slice(1);
  const start = { b0: 7.5, b1: -0.25 };
  const sseOf = (b0: number, b1: number) => pts.reduce((s, p) => s + (p.y - b0 - b1 * p.x) ** 2, 0);
  // Phase A (frames 0–14): slide the line until it passes through (x̄, ȳ) — that's ∂SSE/∂b₀ = 0.
  // Phase B (frames 15–39): rotate around (x̄, ȳ) to the optimal slope — that's ∂SSE/∂b₁ = 0.
  const frames = useMemo(() => {
    const out: { b0: number; b1: number; phase: string }[] = [];
    const b0Through = (b1: number) => ym - b1 * xm;
    for (let i = 0; i < 15; i++) { const t = i / 14; out.push({ b1: start.b1, b0: start.b0 + (b0Through(start.b1) - start.b0) * t, phase: 'A' }); }
    for (let i = 1; i <= 25; i++) { const t = 1 - (1 - i / 25) ** 2; const b1 = start.b1 + (b1o - start.b1) * t; out.push({ b1, b0: b0Through(b1), phase: 'B' }); }
    return out;
  }, []);
  const p = useStepPlayer(frames.length, 160);
  const f = frames[p.i];
  const slopes = Array.from({ length: 60 }, (_, i) => -0.4 + (i / 59) * 2);
  const sseCurve = slopes.map((s) => ({ x: s, y: sseOf(ym - s * xm, s) }));
  const narrative = f.phase === 'A'
    ? 'Phase 1, slide: keep the slope, move the line up or down. SSE falls until the line passes through (x̄, ȳ). Setting ∂SSE/∂b₀ = 0 gives exactly this: b₀ = ȳ − b₁x̄.'
    : p.i < frames.length - 1 ? 'Phase 2, rotate: pivot around (x̄, ȳ). SSE as a function of the slope is a parabola (right). We roll down to its bottom, where ∂SSE/∂b₁ = 0.'
      : `Bottom of the bowl: b₁ = Cov(x,y)/Var(x) = ${b1o.toFixed(3)}. No other line has a smaller total red area.`;
  return (
    <div className="widget">
      <div className="widget-h"><span className="tag">ANIMATION</span> Least squares: slide, then rotate</div>
      <div className="two">
        <Plot x={[0, 10]} y={[0, 10]} xLabel="x" yLabel="y">
          {(sx, sy) => <>
            {pts.map((q, i) => { const yh = f.b0 + f.b1 * q.x; const side = Math.abs(sy(q.y) - sy(yh)); return <rect key={i} x={sx(q.x)} y={Math.min(sy(q.y), sy(yh))} width={side} height={side} fill={C.red} fillOpacity={0.15} stroke={C.red} strokeWidth={0.7} />; })}
            <Dots sx={sx} sy={sy} xs={xs} ys={ys} r={5} />
            <Path sx={sx} sy={sy} pts={[{ x: 0, y: f.b0 }, { x: 10, y: f.b0 + f.b1 * 10 }]} width={2.5} />
            <circle cx={sx(xm)} cy={sy(ym)} r={6} fill="none" stroke={C.green} strokeWidth={2} />
          </>}
        </Plot>
        <div>
          <Plot x={[-0.4, 1.6]} y={[0, Math.max(...sseCurve.map((d) => d.y)) * 1.05]} w={380} h={250} xLabel="slope b₁ (line through x̄, ȳ)" yLabel="SSE" title="SSE vs slope">
            {(sx, sy) => <><Path sx={sx} sy={sy} pts={sseCurve} color={C.teal} />
              <line x1={sx(b1o)} x2={sx(b1o)} y1={sy.range()[0]} y2={sy.range()[1]} stroke={C.green} strokeDasharray="3 3" />
              {f.phase === 'B' && <circle cx={sx(f.b1)} cy={sy(sseOf(f.b0, f.b1))} r={6} fill={C.yellow} />}</>}
          </Plot>
          <div className="stats"><Stat label="SSE" value={sseOf(f.b0, f.b1).toFixed(2)} color={C.red} /><Stat label="b₀" value={f.b0.toFixed(2)} /><Stat label="b₁" value={f.b1.toFixed(3)} color={C.yellow} /></div>
        </div>
      </div>
      <PlayerControls p={p} />
      <div className="caption small">{narrative}</div>
    </div>
  );
}

/* ---------- Ch3: geometry of OLS (projection) ---------- */
export function Projection() {
  // A fixed 3D picture: the plane is col(X); ŷ = Hy is the foot of the perpendicular from y.
  const P = (x: number, y: number, z: number) => [200 + x * 120 - y * 70, 230 - z * 120 + y * 40] as const;
  const plane = [P(-1, -1, 0), P(1.4, -1, 0), P(1.4, 1.3, 0), P(-1, 1.3, 0)];
  const O = P(0, 0, 0), Y = P(0.9, 0.5, 1.15), YH = P(0.9, 0.5, 0);
  return (
    <svg viewBox="0 0 470 300" className="canvas" style={{ maxWidth: 480 }}>
      <polygon points={plane.map((p) => p.join(',')).join(' ')} fill="#1d3442" stroke={C.blue} strokeOpacity={0.5} />
      <text x={plane[0][0] + 6} y={plane[0][1] + 18} fill={C.blue} fontSize={12}>column space of X</text>
      <defs><marker id="arr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="context-stroke" /></marker></defs>
      <line x1={O[0]} y1={O[1]} x2={Y[0]} y2={Y[1]} stroke={C.yellow} strokeWidth={2.5} markerEnd="url(#arr)" />
      <line x1={O[0]} y1={O[1]} x2={YH[0]} y2={YH[1]} stroke={C.green} strokeWidth={2.5} markerEnd="url(#arr)" />
      <line x1={YH[0]} y1={YH[1]} x2={Y[0]} y2={Y[1]} stroke={C.red} strokeWidth={2} strokeDasharray="5 3" markerEnd="url(#arr)" />
      <path d={`M${YH[0]},${YH[1] - 14} l10,4 l0,14`} fill="none" stroke={C.muted} transform={`translate(-10 0)`} />
      <text x={Y[0] + 8} y={Y[1]} fill={C.yellow} fontSize={14}>y</text>
      <text x={YH[0] + 8} y={YH[1] + 16} fill={C.green} fontSize={14}>ŷ = Xβ̂ = Hy</text>
      <text x={YH[0] + 10} y={(Y[1] + YH[1]) / 2 + 4} fill={C.red} fontSize={12}>e = y − ŷ</text><text x={YH[0] + 10} y={(Y[1] + YH[1]) / 2 + 20} fill={C.red} fontSize={12}>⟂ col(X)</text>
      <text x={O[0] - 14} y={O[1] + 16} fill={C.muted} fontSize={12}>0</text>
    </svg>
  );
}

/* ---------- Ch3: the closed form, live ---------- */
export function NormalEquationLive() {
  const X = S.addConst([AD.map((d) => d.tv), AD.map((d) => d.radio), AD.map((d) => d.newspaper)]);
  const y = AD.map((d) => d.sales);
  const G = S.gram(X), Xy = S.xty(X, y), Gi = S.inverse(G), b = S.matvec(Gi, Xy);
  const m = (M: number[][], d = 2) => '\\begin{bmatrix}' + M.map((r) => r.map((v) => fmt(v, d)).join(' & ')).join('\\\\') + '\\end{bmatrix}';
  return (
    <div className="eq" style={{ fontSize: '.86rem' }}>
      <Tex block>{`X^\\top X = ${m(G)}\\quad X^\\top y = ${m(Xy.map((v) => [v]))}`}</Tex>
      <Tex block>{`\\hat\\beta = (X^\\top X)^{-1}X^\\top y = ${m(b.map((v) => [v]), 4)} \\begin{matrix}\\leftarrow\\text{const}\\\\ \\leftarrow\\text{TV}\\\\ \\leftarrow\\text{radio}\\\\ \\leftarrow\\text{newspaper}\\end{matrix}`}</Tex>
    </div>
  );
}

