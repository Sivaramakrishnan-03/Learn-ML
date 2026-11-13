import { createContext, useContext, useId, useMemo } from 'react';
import { scaleLinear, extent, hierarchy, tree as d3tree } from 'd3';
import { Diagram, TreeNodeSpec } from '../content/types';
import { Md } from './Md';

const COLORS = ['#58c4dd', '#fc6255', '#83c167', '#f0ac5f', '#9a72ac', '#5cd0b3'];
const W = 640, H = 300, P = { l: 48, r: 16, t: 16, b: 40 };
/** Accessible name for the diagram's SVG (the caption, in plain text). */
const NameCtx = createContext('Diagram');
const plain = (md: string) => md.replace(/\*\*|__|`|\$/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').trim();
function useSvgA11y() { return { role: 'img' as const, 'aria-label': useContext(NameCtx) }; }

function Axes({ x, y, xLabel, yLabel }: { x: any; y: any; xLabel?: string; yLabel?: string }) {
  return <>
    {x.ticks(6).map((t: number) => <g key={'x' + t}><line x1={x(t)} x2={x(t)} y1={P.t} y2={H - P.b} stroke="#1b2230" /><text x={x(t)} y={H - P.b + 14} fill="#8b95a7" fontSize={10} textAnchor="middle">{+t.toFixed(3)}</text></g>)}
    {y.ticks(5).map((t: number) => <g key={'y' + t}><line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} stroke="#1b2230" /><text x={P.l - 6} y={y(t) + 3} fill="#8b95a7" fontSize={10} textAnchor="end">{+t.toFixed(3)}</text></g>)}
    {xLabel && <text x={(W + P.l) / 2} y={H - 6} fill="#8b95a7" fontSize={11} textAnchor="middle">{xLabel}</text>}
    {yLabel && <text x={12} y={H / 2} fill="#8b95a7" fontSize={11} textAnchor="middle" transform={`rotate(-90 12 ${H / 2})`}>{yLabel}</text>}
  </>;
}

function safeFn(src: string): (x: number) => number {
  try { const f = new Function('x', `"use strict"; return (${src});`) as (x: number) => number; f(0.5); return f; } catch { return () => NaN; }
}

function Curve({ d }: { d: Extract<Diagram, { kind: 'curve' }> }) {
  const a11y = useSvgA11y();
  const f1 = useMemo(() => safeFn(d.fn), [d.fn]);
  const f2 = useMemo(() => (d.fn2 ? safeFn(d.fn2) : null), [d.fn2]);
  const xs = Array.from({ length: 241 }, (_, i) => d.xMin + ((d.xMax - d.xMin) * i) / 240);
  const ys = [...xs.map(f1), ...(f2 ? xs.map(f2) : [])].filter((v) => isFinite(v));
  const [lo, hi] = extent(ys) as [number, number];
  const pad = (hi - lo) * 0.08 || 1;
  const x = scaleLinear().domain([d.xMin, d.xMax]).range([P.l, W - P.r]);
  const y = scaleLinear().domain([Math.min(0, lo) === 0 && lo >= 0 ? 0 : lo - pad, hi + pad]).range([H - P.b, P.t]).nice();
  const path = (f: (x: number) => number) => xs.map((v, i) => { const yy = f(v); return isFinite(yy) ? `${i ? 'L' : 'M'}${x(v)},${y(yy)}` : ''; }).join('');
  const shade = d.shade ? `M${x(d.shade[0])},${y(y.domain()[0])}` + xs.filter((v) => v >= d.shade![0] && v <= d.shade![1]).map((v) => `L${x(v)},${y(f1(v))}`).join('') + `L${x(d.shade[1])},${y(y.domain()[0])}Z` : '';
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="canvas diagram-svg" {...a11y}>
      <Axes x={x} y={y} xLabel={d.xLabel} yLabel={d.yLabel} />
      {shade && <path d={shade} fill="#58c4dd" fillOpacity={0.22} />}
      <path d={path(f1)} fill="none" stroke="#58c4dd" strokeWidth={2.5} />
      {f2 && <path d={path(f2)} fill="none" stroke="#f0ac5f" strokeWidth={2.5} strokeDasharray="6 4" />}
      {d.marks?.map((m, i) => <g key={i}><line x1={x(m.x)} x2={x(m.x)} y1={P.t} y2={H - P.b} stroke="#ffff00" strokeDasharray="4 3" /><text x={x(m.x) + 4} y={P.t + 12 + (i % 3) * 13} fill="#ffff00" fontSize={11}>{m.label}</text></g>)}
      {d.legend && <g><rect x={W - 190} y={P.t} width={10} height={3} fill="#58c4dd" /><text x={W - 175} y={P.t + 5} fill="#c9d1dd" fontSize={11}>{d.legend[0]}</text>
        <rect x={W - 190} y={P.t + 16} width={10} height={3} fill="#f0ac5f" /><text x={W - 175} y={P.t + 21} fill="#c9d1dd" fontSize={11}>{d.legend[1]}</text></g>}
    </svg>
  );
}

function Scatter({ d }: { d: Extract<Diagram, { kind: 'scatter' }> }) {
  const clip = 'dclip' + useId().replace(/:/g, '');
  const a11y = useSvgA11y();
  const xs = d.points.map((p) => p[0]).concat(d.centers?.map((c) => c[0]) ?? []);
  const ys = d.points.map((p) => p[1]).concat(d.centers?.map((c) => c[1]) ?? []);
  const [x0, x1] = extent(xs) as [number, number], [y0, y1] = extent(ys) as [number, number];
  const px = (x1 - x0) * 0.08 || 1, py = (y1 - y0) * 0.1 || 1;
  const x = scaleLinear().domain([x0 - px, x1 + px]).range([P.l, W - P.r]).nice();
  const y = scaleLinear().domain([y0 - py, y1 + py]).range([H - P.b, P.t]).nice();
  const [dx0, dx1] = x.domain();
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="canvas diagram-svg" {...a11y}>
      <Axes x={x} y={y} xLabel={d.xLabel} yLabel={d.yLabel} />
      <defs><clipPath id={clip}><rect x={P.l} y={P.t} width={W - P.l - P.r} height={H - P.t - P.b} /></clipPath></defs>
      <g clipPath={`url(#${clip})`}>
        {d.line && <line x1={x(dx0)} y1={y(d.line.m * dx0 + d.line.b)} x2={x(dx1)} y2={y(d.line.m * dx1 + d.line.b)} stroke="#ffff00" strokeWidth={2.5} />}
        {d.points.map((p, i) => <circle key={i} cx={x(p[0])} cy={y(p[1])} r={5} fill={COLORS[(p[2] ?? 0) % COLORS.length]} stroke="#0b0e13" />)}
        {d.centers?.map((c, i) => <g key={i} transform={`translate(${x(c[0])},${y(c[1])})`}><circle r={10} fill="#0b0e13" stroke={COLORS[i % COLORS.length]} strokeWidth={3} /><path d="M-4,-4L4,4M4,-4L-4,4" stroke={COLORS[i % COLORS.length]} strokeWidth={2.5} /></g>)}
      </g>
    </svg>
  );
}

function Bars({ d }: { d: Extract<Diagram, { kind: 'bars' }> }) {
  const a11y = useSvgA11y();
  const max = Math.max(...d.values, 0), min = Math.min(...d.values, 0);
  const y = scaleLinear().domain([min, max * 1.1 || 1]).range([H - P.b, P.t]).nice();
  const bw = (W - P.l - P.r) / d.values.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="canvas diagram-svg" {...a11y}>
      {y.ticks(5).map((t) => <g key={t}><line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} stroke="#1b2230" /><text x={P.l - 6} y={y(t) + 3} fill="#8b95a7" fontSize={10} textAnchor="end">{+t.toFixed(3)}</text></g>)}
      {d.values.map((v, i) => <g key={i}>
        <rect x={P.l + i * bw + bw * 0.15} width={bw * 0.7} y={y(Math.max(v, 0))} height={Math.abs(y(v) - y(0))} rx={3} fill={d.highlight === i ? '#f0ac5f' : '#58c4dd'} />
        <text x={P.l + i * bw + bw / 2} y={y(Math.max(v, 0)) - 5} fill="#c9d1dd" fontSize={11} textAnchor="middle">{+v.toFixed(3)}</text>
        <text x={P.l + i * bw + bw / 2} y={H - P.b + 15} fill="#8b95a7" fontSize={10.5} textAnchor="middle">{d.labels[i]}</text>
      </g>)}
      {d.yLabel && <text x={12} y={H / 2} fill="#8b95a7" fontSize={11} textAnchor="middle" transform={`rotate(-90 12 ${H / 2})`}>{d.yLabel}</text>}
    </svg>
  );
}

function Flow({ d }: { d: Extract<Diagram, { kind: 'flow' }> }) {
  return (
    <div className="flow">
      {d.nodes.map((n, i) => <div key={i} className="flow-item"><div className="flow-node"><span className="flow-n">{i + 1}</span><span><Md text={n} /></span></div>{i < d.nodes.length - 1 && <div className="flow-arrow" aria-hidden="true">→</div>}</div>)}
    </div>
  );
}

function TreeD({ d }: { d: Extract<Diagram, { kind: 'tree' }> }) {
  const a11y = useSvgA11y();
  const h = useMemo(() => { const r = hierarchy<TreeNodeSpec>(d.root, (n) => n.children); d3tree<TreeNodeSpec>().nodeSize([150, 90])(r); return r; }, [d.root]);
  const nodes = h.descendants();
  const minX = Math.min(...nodes.map((n) => n.x!)) - 80, maxX = Math.max(...nodes.map((n) => n.x!)) + 80;
  const maxY = Math.max(...nodes.map((n) => n.y!)) + 40;
  return (
    <svg viewBox={`${minX} -30 ${maxX - minX} ${maxY + 40}`} className="canvas diagram-svg" style={{ maxHeight: 360 }} {...a11y}>
      {h.links().map((l, i) => <g key={i}>
        <line x1={l.source.x} y1={l.source.y} x2={l.target.x} y2={l.target.y} stroke="#3a4558" strokeWidth={1.5} />
        {l.target.data.edge && <text x={(l.source.x! + l.target.x!) / 2 + (l.target.x! < l.source.x! ? -8 : 8)} y={(l.source.y! + l.target.y!) / 2} fill="#8b95a7" fontSize={11} textAnchor={l.target.x! < l.source.x! ? 'end' : 'start'}>{l.target.data.edge}</text>}
      </g>)}
      {nodes.map((n, i) => <g key={i} transform={`translate(${n.x},${n.y})`}>
        <rect x={-68} y={-18} width={136} height={36} rx={7} fill="#151a22" stroke={n.children ? '#58c4dd' : '#83c167'} strokeWidth={1.5} />
        <text y={4} fill="#e6e9ef" fontSize={11} textAnchor="middle">{n.data.label.length > 22 ? n.data.label.slice(0, 21) + '…' : n.data.label}</text>
      </g>)}
    </svg>
  );
}

export function DiagramView({ d }: { d: Diagram }) {
  let body: React.ReactNode = null;
  if (d.kind === 'curve') body = <Curve d={d} />;
  else if (d.kind === 'scatter') body = <Scatter d={d} />;
  else if (d.kind === 'bars') body = <Bars d={d} />;
  else if (d.kind === 'flow') body = <Flow d={d} />;
  else if (d.kind === 'tree') body = <TreeD d={d} />;
  else if (d.kind === 'table') body = (
    <div className="tbl-scroll" tabIndex={0} role="region" aria-label="Table (scrolls sideways)"><table className="dtable"><thead><tr>{d.head.map((h, i) => <th key={i}><Md text={h} /></th>)}</tr></thead>
      <tbody>{d.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}><Md text={c} /></td>)}</tr>)}</tbody></table></div>);
  else if (d.kind === 'compare') body = (
    <div className="grid g2">
      {[d.left, d.right].map((s, i) => <div key={i} className={`card ${i ? 'avoid' : 'use'}`}><b>{s.title}</b><ul>{s.items.map((it, j) => <li key={j}><Md text={it} /></li>)}</ul></div>)}
    </div>);
  return <figure className="diagram"><NameCtx.Provider value={plain(d.caption) || 'Diagram'}>{body}</NameCtx.Provider><figcaption><span aria-hidden="true">📊 </span><Md text={d.caption} /></figcaption></figure>;
}
