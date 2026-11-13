// Shared building blocks for long-form guides: plots, callouts, deep-dive boxes, stat tables.
import { ReactNode, useRef, useState, PointerEvent as RPE } from 'react';
import { scaleLinear, ScaleLinear } from 'd3';
import * as S from '../lib/stats';

export const C = {
  blue: '#58c4dd', yellow: '#ffff00', red: '#fc6255', green: '#83c167', gold: '#f0ac5f',
  purple: '#9a72ac', teal: '#5cd0b3', muted: '#8b95a7', grid: '#1b2230', pink: '#c55f73',
};

/* ---------------- text blocks ---------------- */

export function Deep({ title, children, open = false }: { title: string; children: ReactNode; open?: boolean }) {
  return (
    <details className="deep" open={open}>
      <summary>🔬 Deep dive: {title}</summary>
      <div className="deep-body">{children}</div>
    </details>
  );
}

const CALLOUT = {
  key: { icon: '🔑', label: 'Key idea', color: C.yellow },
  tip: { icon: '💡', label: 'Practitioner tip', color: C.green },
  warn: { icon: '⚠️', label: 'Common mistake', color: C.red },
  biz: { icon: '🏢', label: 'Business view', color: C.gold },
  story: { icon: '📜', label: 'Story', color: C.purple },
};
export function Callout({ kind = 'key', title, children }: { kind?: keyof typeof CALLOUT; title?: string; children: ReactNode }) {
  const c = CALLOUT[kind];
  return (
    <div className="callout" style={{ borderLeftColor: c.color }}>
      <div className="callout-h" style={{ color: c.color }}>{c.icon} {title ?? c.label}</div>
      <div>{children}</div>
    </div>
  );
}

export const Stat = ({ label, value, color, hint }: { label: string; value: ReactNode; color?: string; hint?: string }) => (
  <div className="stat" title={hint}>
    <div className="stat-l">{label}</div>
    <div className="stat-v" style={{ color }}>{value}</div>
  </div>
);

export function Seg<T extends string | number>({ value, options, onChange }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="seg">
      {options.map((o) => <button key={String(o.v)} className={o.v === value ? 'on' : ''} onClick={() => onChange(o.v)}>{o.label}</button>)}
    </div>
  );
}

export function Slider({ label, value, min, max, step, onChange, fmt = (v: number) => v.toFixed(2) }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt?: (v: number) => string;
}) {
  return (
    <label className="slider">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} />
      <b className="mono">{fmt(value)}</b>
    </label>
  );
}

/* ---------------- plotting ---------------- */

export type Sc = ScaleLinear<number, number>;
export interface PlotProps {
  x: [number, number]; y: [number, number]; w?: number; h?: number;
  xLabel?: string; yLabel?: string; title?: string; xTicks?: number; yTicks?: number;
  fx?: (v: number) => string; fy?: (v: number) => string;
  children: (sx: Sc, sy: Sc) => ReactNode;
  onDown?: (p: { x: number; y: number }, e: RPE<SVGSVGElement>) => void;
  onMove?: (p: { x: number; y: number }, e: RPE<SVGSVGElement>) => void;
  onUp?: () => void;
  cursor?: string; maxW?: number;
}
const M = { l: 48, r: 12, t: 22, b: 36 };

export function Plot({ x, y, w = 520, h = 340, xLabel, yLabel, title, xTicks = 6, yTicks = 5, fx, fy, children, onDown, onMove, onUp, cursor, maxW }: PlotProps) {
  const ref = useRef<SVGSVGElement>(null);
  const sx = scaleLinear().domain(x).range([M.l, w - M.r]);
  const sy = scaleLinear().domain(y).range([h - M.b, M.t]);
  const fmtx = fx ?? sx.tickFormat(xTicks), fmty = fy ?? sy.tickFormat(yTicks);
  const toData = (e: RPE<SVGSVGElement>) => {
    const svg = ref.current!; const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: sx.invert(p.x), y: sy.invert(p.y) };
  };
  const clipId = useRef('clip' + Math.random().toString(36).slice(2)).current;
  return (
    <svg ref={ref} viewBox={`0 0 ${w} ${h}`} className="canvas plot" style={{ cursor, maxWidth: maxW, touchAction: onDown ? 'none' : undefined }}
      onPointerDown={onDown && ((e) => { (e.target as Element).setPointerCapture?.(e.pointerId); onDown(toData(e), e); })}
      onPointerMove={onMove && ((e) => onMove(toData(e), e))}
      onPointerUp={onUp} onPointerLeave={onUp}>
      {title && <text x={M.l} y={14} fill="#c9d1dd" fontSize={12} fontWeight={600}>{title}</text>}
      {sx.ticks(xTicks).map((t) => (
        <g key={'x' + t}>
          <line x1={sx(t)} x2={sx(t)} y1={M.t} y2={h - M.b} stroke={C.grid} />
          <text x={sx(t)} y={h - M.b + 14} fill="#5b6576" fontSize={10} textAnchor="middle">{fmtx(t)}</text>
        </g>
      ))}
      {sy.ticks(yTicks).map((t) => (
        <g key={'y' + t}>
          <line x1={M.l} x2={w - M.r} y1={sy(t)} y2={sy(t)} stroke={C.grid} />
          <text x={M.l - 6} y={sy(t) + 3} fill="#5b6576" fontSize={10} textAnchor="end">{fmty(t)}</text>
        </g>
      ))}
      {xLabel && <text x={(w + M.l) / 2} y={h - 4} fill={C.muted} fontSize={11} textAnchor="middle">{xLabel}</text>}
      {yLabel && <text x={12} y={(h - M.b + M.t) / 2} fill={C.muted} fontSize={11} textAnchor="middle" transform={`rotate(-90 12 ${(h - M.b + M.t) / 2})`}>{yLabel}</text>}
      <defs><clipPath id={clipId}><rect x={M.l} y={M.t} width={w - M.l - M.r} height={h - M.t - M.b} /></clipPath></defs>
      <g clipPath={`url(#${clipId})`}>{children(sx, sy)}</g>
    </svg>
  );
}

export const extent = (v: number[], pad = 0.06): [number, number] => {
  let lo = Math.min(...v), hi = Math.max(...v);
  if (lo === hi) { lo -= 1; hi += 1; }
  const d = (hi - lo) * pad;
  return [lo - d, hi + d];
};

export const Dots = ({ sx, sy, xs, ys, color = C.blue, r = 3.6, opacity = 0.85, hl }: { sx: Sc; sy: Sc; xs: number[]; ys: number[]; color?: string | ((i: number) => string); r?: number; opacity?: number; hl?: (i: number) => boolean }) => (
  <>{xs.map((x, i) => <circle key={i} cx={sx(x)} cy={sy(ys[i])} r={hl?.(i) ? r * 1.7 : r} fill={typeof color === 'function' ? color(i) : color} fillOpacity={opacity} stroke="#0b0e13" strokeWidth={0.6} />)}</>
);

export const Path = ({ sx, sy, pts, color = C.yellow, width = 2, dash, opacity = 1 }: { sx: Sc; sy: Sc; pts: { x: number; y: number }[]; color?: string; width?: number; dash?: string; opacity?: number }) => (
  <path d={pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x)},${sy(p.y)}`).join('')} fill="none" stroke={color} strokeWidth={width} strokeDasharray={dash} opacity={opacity} />
);

export const HLine = ({ sx, sy, y, color = C.muted, dash = '4 4' }: { sx: Sc; sy: Sc; y: number; color?: string; dash?: string }) => (
  <line x1={sx.range()[0]} x2={sx.range()[1]} y1={sy(y)} y2={sy(y)} stroke={color} strokeDasharray={dash} />
);

export const Band = ({ sx, sy, pts, color = C.yellow, opacity = 0.15 }: { sx: Sc; sy: Sc; pts: { x: number; lo: number; hi: number }[]; color?: string; opacity?: number }) => (
  <path d={pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x)},${sy(p.hi)}`).join('') + [...pts].reverse().map((p) => `L${sx(p.x)},${sy(p.lo)}`).join('') + 'Z'} fill={color} fillOpacity={opacity} stroke="none" />
);

/* ---------------- tables ---------------- */

export function CoefTable({ res, robust, caption, compact = false }: { res: S.OLSResult; robust?: number[]; caption?: string; compact?: boolean }) {
  return (
    <div className="tbl-wrap">
      {caption && <div className="small muted" style={{ marginBottom: 4 }}>{caption}</div>}
      <table className="tbl mono">
        <thead><tr><th></th><th>coef</th><th>std err{robust ? ' (HC3)' : ''}</th><th>t</th><th>P&gt;|t|</th>{!compact && <><th>[0.025</th><th>0.975]</th></>}<th></th></tr></thead>
        <tbody>{res.beta.map((b, i) => {
          const se = robust ? robust[i] : res.se[i];
          const t = b / se, p = S.tPvalue(t, res.dfResid), tc = S.tQuantile(0.975, res.dfResid);
          return <tr key={i} className={p < 0.05 ? 'sig' : 'nsig'}>
            <td>{res.names[i]}</td><td>{fmt(b)}</td><td>{fmt(se)}</td><td>{t.toFixed(2)}</td><td>{S.fmtP(p)}</td>
            {!compact && <><td>{fmt(b - tc * se)}</td><td>{fmt(b + tc * se)}</td></>}<td style={{ color: C.gold }}>{S.stars(p)}</td>
          </tr>;
        })}</tbody>
      </table>
      <div className="small muted mono" style={{ marginTop: 4 }}>
        n = {res.n} · R² = {res.r2.toFixed(3)} · adj. R² = {res.adjR2.toFixed(3)} · F = {res.F.toFixed(1)} (p {S.fmtP(res.Fp)}) · σ̂ = {res.sigma.toFixed(3)} · AIC = {res.aic.toFixed(1)} · BIC = {res.bic.toFixed(1)}
      </div>
    </div>
  );
}

export const fmt = (v: number, d = 4) => {
  if (!isFinite(v)) return '—';
  const a = Math.abs(v);
  return a !== 0 && (a < 1e-3 || a >= 1e5) ? v.toExponential(2) : v.toFixed(a >= 100 ? 1 : d);
};

export interface TestRow { name: string; checks: string; stat: number; p?: number; verdict: 'ok' | 'bad' | 'warn'; note?: string; statLabel?: string }
export function TestTable({ rows }: { rows: TestRow[] }) {
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead><tr><th>Test</th><th>Checks</th><th>Statistic</th><th>p-value</th><th>Verdict</th></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.name}>
            <td><b>{r.name}</b></td><td className="small">{r.checks}</td>
            <td className="mono">{r.statLabel ?? ''}{fmt(r.stat, 3)}</td>
            <td className="mono">{r.p === undefined ? '—' : S.fmtP(r.p)}</td>
            <td><span className={`verdict ${r.verdict}`}>{r.verdict === 'ok' ? '✓ fine' : r.verdict === 'warn' ? '△ borderline' : '✗ violated'}</span>{r.note && <div className="small muted">{r.note}</div>}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

export function Bars({ items, max, threshold, fmtv = (v: number) => v.toFixed(2), thresholdLabel }: { items: { label: string; value: number; color?: string }[]; max?: number; threshold?: number; fmtv?: (v: number) => string; thresholdLabel?: string }) {
  const mx = max ?? Math.max(...items.map((i) => Math.abs(i.value)), threshold ?? 0) * 1.1;
  return (
    <div className="bars">
      {items.map((it) => (
        <div key={it.label} className="bar-row">
          <span className="bar-l mono small">{it.label}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(Math.min(Math.abs(it.value), mx) / mx) * 100}%`, background: it.color ?? (threshold !== undefined && it.value > threshold ? C.red : C.blue) }} />
            {threshold !== undefined && <div className="bar-th" style={{ left: `${(threshold / mx) * 100}%` }} title={thresholdLabel} />}
          </div>
          <span className="mono small" style={{ width: 70, textAlign: 'right' }}>{fmtv(it.value)}</span>
        </div>
      ))}
      {thresholdLabel && <div className="small muted">┆ {thresholdLabel}</div>}
    </div>
  );
}

export function Heatmap({ labels, M: mat }: { labels: string[]; M: number[][] }) {
  const n = labels.length, cs = 54;
  const col = (v: number) => (v >= 0 ? `rgba(88,196,221,${Math.abs(v)})` : `rgba(252,98,85,${Math.abs(v)})`);
  return (
    <svg viewBox={`0 0 ${90 + n * cs} ${30 + n * cs}`} className="canvas" style={{ maxWidth: 90 + n * cs + 40 }}>
      {labels.map((l, i) => <text key={'c' + i} x={90 + i * cs + cs / 2} y={20} fill={C.muted} fontSize={11} textAnchor="middle">{l}</text>)}
      {labels.map((l, i) => <text key={'r' + i} x={84} y={30 + i * cs + cs / 2 + 4} fill={C.muted} fontSize={11} textAnchor="end">{l}</text>)}
      {mat.map((row, i) => row.map((v, j) => (
        <g key={i + '-' + j}>
          <rect x={90 + j * cs + 1} y={30 + i * cs + 1} width={cs - 2} height={cs - 2} rx={4} fill={col(v)} />
          <text x={90 + j * cs + cs / 2} y={30 + i * cs + cs / 2 + 4} fill={Math.abs(v) > 0.55 ? '#0b0e13' : '#e6e9ef'} fontSize={12} textAnchor="middle">{v.toFixed(2)}</text>
        </g>
      )))}
    </svg>
  );
}

/* ---------------- residual diagnostics (the classic 4-panel) ---------------- */

export function DiagPlots({ X, res, compact = false, only, withOrder = false }: { X: S.Mat; res: S.OLSResult; compact?: boolean; only?: ('rvf' | 'qq' | 'sl' | 'lev')[]; withOrder?: boolean }) {
  const inf = S.influence(X, res);
  const w = compact ? 300 : 360, h = compact ? 220 : 250;
  const show = (k: 'rvf' | 'qq' | 'sl' | 'lev') => !only || only.includes(k);
  const fv = res.fitted, e = res.resid;
  const q = S.qq(e);
  const sq = inf.stud.map((r) => Math.sqrt(Math.abs(r)));
  const k = res.k;
  const levMax = Math.max(...inf.h) * 1.1;
  const cookCurve = (D: number, sign: number) => Array.from({ length: 40 }, (_, i) => {
    const hh = 0.001 + (levMax * i) / 39;
    return { x: hh, y: sign * Math.sqrt((D * k * (1 - hh)) / hh) };
  });
  const top = (arr: number[], m = 3) => arr.map((v, i) => [Math.abs(v), i]).sort((a, b) => b[0] - a[0]).slice(0, m).map((d) => d[1]);
  const flagged = new Set(top(inf.cooks));
  return (
    <div className={`grid ${compact ? 'g2' : 'g2'}`}>
      {show('rvf') && <Plot title="Residuals vs fitted" x={extent(fv)} y={extent(e)} w={w} h={h} xLabel="fitted ŷ" yLabel="residual">
        {(sx, sy) => <><HLine sx={sx} sy={sy} y={0} /><Dots sx={sx} sy={sy} xs={fv} ys={e} r={2.8} color={(i) => (flagged.has(i) ? C.red : C.blue)} /><Path sx={sx} sy={sy} pts={S.lowess(fv, e)} color={C.red} /></>}
      </Plot>}
      {show('qq') && <Plot title="Normal Q-Q" x={extent(q.map((d) => d.theo))} y={extent(q.map((d) => d.obs))} w={w} h={h} xLabel="theoretical quantile" yLabel="standardised residual">
        {(sx, sy) => <><Path sx={sx} sy={sy} pts={[{ x: -4, y: -4 }, { x: 4, y: 4 }]} color={C.muted} dash="4 4" /><Dots sx={sx} sy={sy} xs={q.map((d) => d.theo)} ys={q.map((d) => d.obs)} r={2.6} /></>}
      </Plot>}
      {show('sl') && <Plot title="Scale-location" x={extent(fv)} y={[0, Math.max(...sq) * 1.08]} w={w} h={h} xLabel="fitted ŷ" yLabel="√|studentised residual|">
        {(sx, sy) => <><Dots sx={sx} sy={sy} xs={fv} ys={sq} r={2.8} color={C.teal} /><Path sx={sx} sy={sy} pts={S.lowess(fv, sq)} color={C.red} /></>}
      </Plot>}
      {show('lev') && <Plot title="Residuals vs leverage (Cook's distance)" x={[0, levMax]} y={extent([...inf.stud, 3, -3])} w={w} h={h} xLabel="leverage hᵢᵢ" yLabel="studentised residual">
        {(sx, sy) => <>
          <HLine sx={sx} sy={sy} y={0} />
          {[0.5, 1].map((D) => [1, -1].map((sg) => <Path key={D + '' + sg} sx={sx} sy={sy} pts={cookCurve(D, sg)} color={D === 1 ? C.red : C.gold} dash="3 3" width={1.2} />))}
          <line x1={sx(inf.thresholds.leverage)} x2={sx(inf.thresholds.leverage)} y1={sy.range()[0]} y2={sy.range()[1]} stroke={C.purple} strokeDasharray="2 3" />
          <Dots sx={sx} sy={sy} xs={inf.h} ys={inf.stud} r={2.8} color={(i) => (inf.cooks[i] > 0.5 ? C.red : inf.cooks[i] > inf.thresholds.cooks ? C.gold : C.blue)} />
        </>}
      </Plot>}
      {withOrder && <div style={{ gridColumn: '1 / -1' }}><Plot title="Residuals vs row order (time)" x={[0, e.length - 1]} y={extent(e)} w={w * 2 + 14} h={compact ? 170 : 190} xLabel="observation index" yLabel="residual">
        {(sx, sy) => <><HLine sx={sx} sy={sy} y={0} /><Path sx={sx} sy={sy} pts={e.map((v, i) => ({ x: i, y: v }))} color={C.blue} width={1} opacity={0.6} /><Dots sx={sx} sy={sy} xs={e.map((_, i) => i)} ys={e} r={2.2} /></>}
      </Plot></div>}
    </div>
  );
}

/* ---------------- misc ---------------- */

export function useToggle(init = false): [boolean, () => void] {
  const [v, set] = useState(init);
  return [v, () => set((x) => !x)];
}

export function downloadText(name: string, text: string, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
