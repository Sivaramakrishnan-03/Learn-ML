// Shared animation toolkit. Every topic animation is built from these pieces so all pages look and behave alike.
// Rule of thumb: compute frames with pure functions, render them with these components, narrate every frame.
import { ReactNode, useEffect, useRef } from 'react';
import { scaleLinear, ScaleLinear } from 'd3';
import { motion } from 'framer-motion';
export { useStepPlayer, PlayerControls } from '../components/StepPlayer';
export { rng, gauss } from '../lib/datasets';
export { Tex } from '../components/Tex';
export { Md } from '../components/Md';

/** Theme colours (3Blue1Brown-like). Use these, never hard-code new ones. */
export const C = {
  blue: '#58c4dd', red: '#fc6255', green: '#83c167', yellow: '#ffff00', gold: '#f0ac5f',
  purple: '#9a72ac', teal: '#5cd0b3', pink: '#c55f73', grey: '#5b6576', text: '#e6e9ef', muted: '#8b95a7', grid: '#1b2230', bg: '#0b0e13',
};
export const SERIES = [C.blue, C.red, C.green, C.gold, C.purple, C.teal, C.pink, C.yellow];

export interface Scales { sx: ScaleLinear<number, number>; sy: ScaleLinear<number, number>; W: number; H: number; pad: { l: number; r: number; t: number; b: number } }

/** A 2-D plotting area with grid, axes and labels. Children get the scales: `{(s) => <Dots s={s} … />}`. */
export function Plot({ x, y, width = 760, height = 380, xLabel, yLabel, fx = fmt, fy = fmt, xTicks = 8, yTicks = 6, onClick, grid = true, title, ariaLabel, children }: {
  x: [number, number]; y: [number, number]; width?: number; height?: number; xLabel?: string; yLabel?: string;
  fx?: (v: number) => string; fy?: (v: number) => string; xTicks?: number; yTicks?: number; grid?: boolean;
  onClick?: (pt: { x: number; y: number }, e: React.MouseEvent) => void; children: (s: Scales) => ReactNode;
  /** Short visible-to-assistive-tech title (rendered as an SVG <title>, also shown as a tooltip). */
  title?: string;
  /** Accessible name for screen readers. Defaults to `title`, else a name built from the axis labels. */
  ariaLabel?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const pad = { l: 52, r: 16, t: 14, b: 42 };
  const sx = scaleLinear().domain(x).range([pad.l, width - pad.r]);
  const sy = scaleLinear().domain(y).range([height - pad.b, pad.t]);
  const id = `clip${width}${height}${x.join('')}${y.join('')}`.replace(/[^a-z0-9]/gi, '');
  const click = (e: React.MouseEvent) => {
    if (!onClick || !ref.current) return;
    const p = ref.current.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    const l = p.matrixTransform(ref.current.getScreenCTM()!.inverse());
    const X = sx.invert(l.x), Y = sy.invert(l.y);
    if (X >= x[0] && X <= x[1] && Y >= Math.min(...y) && Y <= Math.max(...y)) onClick({ x: X, y: Y }, e);
  };
  const name = ariaLabel ?? title ?? plotName(xLabel, yLabel, x, y);
  return (
    <svg ref={ref} viewBox={`0 0 ${width} ${height}`} className="canvas viz" onClick={click} style={{ cursor: onClick ? 'crosshair' : 'default' }}
      role="img" aria-label={name}>
      {title && <title>{title}</title>}
      {grid && sx.ticks(xTicks).map((t) => <line key={'gx' + t} x1={sx(t)} x2={sx(t)} y1={pad.t} y2={height - pad.b} stroke={C.grid} />)}
      {grid && sy.ticks(yTicks).map((t) => <line key={'gy' + t} x1={pad.l} x2={width - pad.r} y1={sy(t)} y2={sy(t)} stroke={C.grid} />)}
      {sx.ticks(xTicks).map((t) => <text key={'tx' + t} x={sx(t)} y={height - pad.b + 15} fill={C.muted} fontSize={11} textAnchor="middle">{fx(t)}</text>)}
      {sy.ticks(yTicks).map((t) => <text key={'ty' + t} x={pad.l - 7} y={sy(t) + 4} fill={C.muted} fontSize={11} textAnchor="end">{fy(t)}</text>)}
      {xLabel && <text x={(width + pad.l) / 2} y={height - 6} fill={C.muted} fontSize={12} textAnchor="middle">{xLabel}</text>}
      {yLabel && <text x={13} y={(height - pad.b + pad.t) / 2} fill={C.muted} fontSize={12} textAnchor="middle" transform={`rotate(-90 13 ${(height - pad.b + pad.t) / 2})`}>{yLabel}</text>}
      <defs><clipPath id={id}><rect x={pad.l} y={pad.t} width={width - pad.l - pad.r} height={height - pad.t - pad.b} /></clipPath></defs>
      <g clipPath={`url(#${id})`}>{children({ sx, sy, W: width, H: height, pad })}</g>
    </svg>
  );
}

/** Default accessible name for a chart, e.g. "Chart of error rate against k (number of neighbours)". */
export function plotName(xLabel?: string, yLabel?: string, x?: [number, number], y?: [number, number]) {
  const clean = (l?: string) => l?.replace(/[→←↑↓]/g, '').replace(/\s+/g, ' ').trim();
  const xl = clean(xLabel), yl = clean(yLabel);
  if (xl && yl) return `Chart of ${yl} against ${xl}`;
  if (xl || yl) return `Chart of ${xl || yl}`;
  return x && y ? `Chart, x from ${fmt(x[0])} to ${fmt(x[1])}, y from ${fmt(Math.min(...y))} to ${fmt(Math.max(...y))}` : 'Chart';
}

export function fmt(v: number) {
  const a = Math.abs(v);
  if (a >= 1e6) return (v / 1e6).toFixed(1) + 'M';
  if (a >= 1e4) return (v / 1e3).toFixed(0) + 'k';
  return String(+v.toFixed(a < 1 ? 2 : a < 10 ? 1 : 0));
}

/** Points. `color` may be a function of the point index. Animates position changes smoothly. */
export function Dots({ s, pts, r = 5, color = C.blue, animate = true, opacity = 1 }: {
  s: Scales; pts: { x: number; y: number }[]; r?: number; color?: string | ((i: number) => string); animate?: boolean; opacity?: number;
}) {
  return <>{pts.map((p, i) => {
    const fill = typeof color === 'function' ? color(i) : color;
    return animate
      ? <motion.circle key={i} initial={false} animate={{ cx: s.sx(p.x), cy: s.sy(p.y), fill }} transition={{ duration: 0.4 }} r={r} stroke={C.bg} strokeWidth={1} opacity={opacity} />
      : <circle key={i} cx={s.sx(p.x)} cy={s.sy(p.y)} r={r} fill={fill} stroke={C.bg} strokeWidth={1} opacity={opacity} />;
  })}</>;
}

/** Plot y = f(x) over the visible x-range (or [from, to]). */
export function FnLine({ s, f, from, to, color = C.yellow, width = 2.5, dash, n = 200, fill }: {
  s: Scales; f: (x: number) => number; from?: number; to?: number; color?: string; width?: number; dash?: string; n?: number; fill?: string;
}) {
  const [a, b] = [from ?? s.sx.domain()[0], to ?? s.sx.domain()[1]];
  const xs = Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);
  const d = xs.map((x, i) => { const y = f(x); return isFinite(y) ? `${i ? 'L' : 'M'}${s.sx(x)},${s.sy(y)}` : ''; }).join('');
  const base = s.sy(Math.max(s.sy.domain()[0], Math.min(0, s.sy.domain()[1])));
  return <>
    {fill && <path d={`${d}L${s.sx(b)},${base}L${s.sx(a)},${base}Z`} fill={fill} opacity={0.25} />}
    <path d={d} fill="none" stroke={color} strokeWidth={width} strokeDasharray={dash} />
  </>;
}

/** Straight segment in data coordinates; animates when endpoints change. */
export function Seg({ s, x1, y1, x2, y2, color = C.yellow, width = 2, dash }: { s: Scales; x1: number; y1: number; x2: number; y2: number; color?: string; width?: number; dash?: string }) {
  return <motion.line initial={false} animate={{ x1: s.sx(x1), y1: s.sy(y1), x2: s.sx(x2), y2: s.sy(y2) }} transition={{ duration: 0.4 }} stroke={color} strokeWidth={width} strokeDasharray={dash} />;
}

/** Arrow in data coordinates (vectors, gradients, steps). */
export function Arrow({ s, x1, y1, x2, y2, color = C.gold, width = 2.5, label }: { s: Scales; x1: number; y1: number; x2: number; y2: number; color?: string; width?: number; label?: string }) {
  const X1 = s.sx(x1), Y1 = s.sy(y1), X2 = s.sx(x2), Y2 = s.sy(y2);
  const ang = Math.atan2(Y2 - Y1, X2 - X1), h = 10;
  const p1 = `${X2 - h * Math.cos(ang - 0.4)},${Y2 - h * Math.sin(ang - 0.4)}`, p2 = `${X2 - h * Math.cos(ang + 0.4)},${Y2 - h * Math.sin(ang + 0.4)}`;
  return <g>
    <line x1={X1} y1={Y1} x2={X2} y2={Y2} stroke={color} strokeWidth={width} />
    <polygon points={`${X2},${Y2} ${p1} ${p2}`} fill={color} />
    {label && <text x={X2 + 6} y={Y2 - 6} fill={color} fontSize={13}>{label}</text>}
  </g>;
}

/** Text label in data coordinates. */
export function Label({ s, x, y, children, color = C.text, size = 13, anchor = 'start' }: { s: Scales; x: number; y: number; children: ReactNode; color?: string; size?: number; anchor?: 'start' | 'middle' | 'end' }) {
  return <text x={s.sx(x)} y={s.sy(y)} fill={color} fontSize={size} textAnchor={anchor}>{children}</text>;
}

/** Shaded rectangle in data coordinates (regions, intervals, highlighted windows). */
export function Region({ s, x0, x1, y0, y1, color = C.blue, opacity = 0.15, stroke }: { s: Scales; x0: number; x1: number; y0?: number; y1?: number; color?: string; opacity?: number; stroke?: string }) {
  const [d0, d1] = s.sy.domain();
  const top = s.sy(y1 ?? Math.max(d0, d1)), bot = s.sy(y0 ?? Math.min(d0, d1));
  return <motion.rect initial={false} animate={{ x: s.sx(Math.min(x0, x1)), width: Math.abs(s.sx(x1) - s.sx(x0)), y: Math.min(top, bot), height: Math.abs(bot - top) }} fill={color} fillOpacity={opacity} stroke={stroke} />;
}

/** Vertical bars inside a Plot (histograms, probability mass functions). x = bar centre. */
export function Bars({ s, data, width = 0.8, color = C.blue, highlight }: { s: Scales; data: { x: number; y: number }[]; width?: number; color?: string | ((i: number) => string); highlight?: (i: number) => boolean }) {
  const y0 = Math.max(s.sy.domain()[0], 0);
  return <>{data.map((d, i) => {
    const fill = highlight?.(i) ? C.gold : typeof color === 'function' ? color(i) : color;
    const x = s.sx(d.x - width / 2), w = s.sx(d.x + width / 2) - x;
    return <motion.rect key={i} initial={false} animate={{ y: Math.min(s.sy(d.y), s.sy(y0)), height: Math.abs(s.sy(y0) - s.sy(d.y)) }} transition={{ duration: 0.35 }} x={x} width={Math.max(1, w)} fill={fill} rx={2} />;
  })}</>;
}

/** A table / matrix with optional highlighted cells, e.g. matrix multiplication, confusion matrix, DataFrame. */
export function MatrixView({ data, rowLabels, colLabels, highlight, cellColor, title }: {
  data: (string | number)[][]; rowLabels?: string[]; colLabels?: string[]; title?: string;
  highlight?: (r: number, c: number) => boolean; cellColor?: (r: number, c: number) => string | undefined;
}) {
  return (
    <div className="matrix-view">
      {title && <div className="small muted" style={{ marginBottom: 4 }}>{title}</div>}
      <table>
        {colLabels && <thead><tr>{rowLabels && <th />}{colLabels.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>}
        <tbody>{data.map((row, r) => <tr key={r}>
          {rowLabels && <th>{rowLabels[r]}</th>}
          {row.map((v, c) => <motion.td key={c} initial={false} animate={{ backgroundColor: highlight?.(r, c) ? 'rgba(240,172,95,0.35)' : cellColor?.(r, c) ?? 'rgba(0,0,0,0)' }}>{typeof v === 'number' ? fmtNum(v) : v}</motion.td>)}
        </tr>)}</tbody>
      </table>
    </div>
  );
}
export const fmtNum = (v: number, d = 2) => (Number.isInteger(v) ? String(v) : v.toFixed(d));

/** Narration under an animation. Say what is happening and what to notice.
 *  Step players already announce the caption with each step; pass `live` for captions that change without a player (e.g. playground readouts). */
export function Caption({ children, live = false }: { children: ReactNode; live?: boolean }) {
  return <div className="caption" aria-live={live ? 'polite' : undefined}>{children}</div>;
}

/** Live numbers panel. */
export function Readout({ items }: { items: [string, ReactNode, string?][] }) {
  return <div className="readout">{items.map(([k, v, col], i) => <div key={i}><span className="muted small">{k}</span><b style={{ color: col }}>{v}</b></div>)}</div>;
}

export function Slider({ label, min, max, step = 1, value, onChange, format = (v: number) => String(v) }: {
  label: string; min: number; max: number; step?: number; value: number; onChange: (v: number) => void; format?: (v: number) => string;
}) {
  return <label className="slider"><span>{label}</span><input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} aria-valuetext={format(value)} /><b aria-hidden="true">{format(value)}</b></label>;
}

export function Choice<T extends string | number>({ label, options, value, onChange }: { label?: string; options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return <div className="row choice" role="group" aria-label={label}>{label && <span className="small muted" aria-hidden="true">{label}</span>}{options.map((o) => <button type="button" key={String(o.value)} className={`btn ${o.value === value ? 'primary' : ''}`} aria-pressed={o.value === value} onClick={() => onChange(o.value)}>{o.label}</button>)}</div>;
}

export function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return <label className="row small toggle"><input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} /> {label}</label>;
}

export function Legend({ items }: { items: [string, string][] }) {
  return <div className="legend">{items.map(([l, c]) => <span key={l}><span className="dot" aria-hidden="true" style={{ background: c }} />{l}</span>)}</div>;
}

/** Standard layout: visual on the left (wider), controls/readouts on the right. Stacks on small screens. */
export function Layout({ main, side }: { main: ReactNode; side?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current) labelCharts(ref.current); });
  return side
    ? <div className="viz-layout" ref={ref}><div className="viz-main">{main}</div><div className="viz-side" role="group" aria-label="Controls and readouts">{side}</div></div>
    : <div ref={ref}>{main}</div>;
}

/** Give hand-drawn chart SVGs (not built with Plot) an image role and a name, so screen readers don't read every tick label.
 *  Also names bare sliders/selects that sit next to a text label instead of inside a <label> (prefer `Slider`). */
export function labelCharts(root: HTMLElement) {
  root.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input:not([aria-label]):not([aria-labelledby]), select:not([aria-label]):not([aria-labelledby])').forEach((el) => {
    if (el.labels?.length || el.type === 'hidden') return;
    let txt = '';
    for (let n = el.previousSibling; n && !txt; n = n.previousSibling) if (n.nodeType === 3 || (n as HTMLElement).tagName === 'SPAN') txt = (n.textContent ?? '').trim();
    if (txt) el.setAttribute('aria-label', txt);
  });
  root.querySelectorAll<SVGSVGElement>('svg.canvas:not([role])').forEach((svg) => {
    const t = svg.querySelector(':scope > title')?.textContent?.trim();
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', t || 'Animated diagram; the caption describes what it shows');
  });
}
