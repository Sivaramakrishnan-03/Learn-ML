import { scaleLinear } from 'd3';
import { ReactNode, useRef } from 'react';

export const W = 560, H = 400, PAD = 34;
export const sx = scaleLinear().domain([0, 10]).range([PAD, W - 12]);
export const sy = scaleLinear().domain([0, 10]).range([H - PAD, 12]);
export const CLASS_COLORS = ['#58c4dd', '#fc6255', '#83c167', '#f0ac5f', '#9a72ac', '#5cd0b3', '#ffff00', '#c55f73'];

/** Shared 0..10 × 0..10 coordinate canvas with grid, axes and optional click-to-add. */
export function World({ children, xLabel = 'feature 1', yLabel = 'feature 2', onAdd, width = W, height = H, fx = String, fy = String }: {
  children: ReactNode; xLabel?: string; yLabel?: string; fx?: (v: number) => string; fy?: (v: number) => string;
  onAdd?: (pt: { x: number; y: number }, shift: boolean) => void; width?: number; height?: number;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const ticks = [0, 2, 4, 6, 8, 10];
  const click = (e: React.MouseEvent) => {
    if (!onAdd || !ref.current) return;
    const pt = ref.current.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const loc = pt.matrixTransform(ref.current.getScreenCTM()!.inverse());
    const x = sx.invert(loc.x), y = sy.invert(loc.y);
    if (x < 0 || x > 10 || y < 0 || y > 10) return;
    onAdd({ x, y }, e.shiftKey);
  };
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width={width} height={height} className="canvas"
      onClick={click} style={{ cursor: onAdd ? 'crosshair' : 'default', maxWidth: '100%' }}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={sx(t)} x2={sx(t)} y1={sy(0)} y2={sy(10)} stroke="#1b2230" />
          <line x1={sx(0)} x2={sx(10)} y1={sy(t)} y2={sy(t)} stroke="#1b2230" />
          <text x={sx(t)} y={H - 16} fill="#5b6576" fontSize={10} textAnchor="middle">{fx(t)}</text>
          <text x={PAD - 8} y={sy(t) + 3} fill="#5b6576" fontSize={10} textAnchor="end">{fy(t)}</text>
        </g>
      ))}
      <text x={(W + PAD) / 2} y={H - 2} fill="#8b95a7" fontSize={11} textAnchor="middle">{xLabel}</text>
      <text x={10} y={H / 2} fill="#8b95a7" fontSize={11} textAnchor="middle" transform={`rotate(-90 10 ${H / 2})`}>{yLabel}</text>
      <defs><clipPath id="plotclip"><rect x={sx(0)} y={sy(10)} width={sx(10) - sx(0)} height={sy(0) - sy(10)} /></clipPath></defs>
      <g clipPath="url(#plotclip)">{children}</g>
    </svg>
  );
}
