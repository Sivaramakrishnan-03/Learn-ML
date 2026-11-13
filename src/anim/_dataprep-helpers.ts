// Topic-specific helpers for the PYTHON & DATA PREP animations (numpy, pandas, plotting, ml-overview, data-cleaning, feature-engineering, scaling).
// The maths (mean / sd / quantiles, box stats, histograms, least squares, R²) lives in src/viz/math.ts.

/** Hex colour to rgba string, for MatrixView cell colours. */
export function alpha(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
}
/** A cell tint whose strength grows with the value (a "heat" grid). */
export const heat = (hex: string, v: number, max: number) => alpha(hex, 0.12 + 0.5 * Math.min(1, Math.abs(v) / (max || 1)));

/** Indian-style rupee formatting: 600000 -> "6,00,000". */
export function inr(v: number) {
  const s = Math.round(Math.abs(v)).toString();
  const last3 = s.slice(-3), rest = s.slice(0, -3);
  return (v < 0 ? '−' : '') + (rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' : '') + last3;
}
