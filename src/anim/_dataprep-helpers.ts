// Shared pure helpers for the PYTHON & DATA PREP animations (numpy, pandas, plotting, ml-overview, data-cleaning, feature-engineering, scaling).

export const sum = (a: number[]) => a.reduce((s, v) => s + v, 0);
export const mean = (a: number[]) => (a.length ? sum(a) / a.length : 0);
/** Standard deviation. ddof=0 like NumPy / StandardScaler, ddof=1 like pandas. */
export const sd = (a: number[], ddof = 0) => {
  if (a.length - ddof <= 0) return 0;
  const m = mean(a);
  return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - ddof));
};
/** Quantile with linear interpolation (NumPy's default, Excel QUARTILE.INC). */
export function quantile(a: number[], q: number) {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  const h = (s.length - 1) * q, lo = Math.floor(h), hi = Math.ceil(h);
  return s[lo] + (s[hi] - s[lo]) * (h - lo);
}
export const median = (a: number[]) => quantile(a, 0.5);
export function boxStats(a: number[]) {
  const q1 = quantile(a, 0.25), med = quantile(a, 0.5), q3 = quantile(a, 0.75), iqr = q3 - q1;
  const loF = q1 - 1.5 * iqr, hiF = q3 + 1.5 * iqr;
  const inside = a.filter((v) => v >= loF && v <= hiF);
  return { q1, med, q3, iqr, loF, hiF, wLo: Math.min(...inside), wHi: Math.max(...inside), out: a.filter((v) => v < loF || v > hiF) };
}
/** Histogram counts; bar centres in x. */
export function histCounts(values: number[], lo: number, hi: number, bins: number) {
  const w = (hi - lo) / bins, c = Array(bins).fill(0);
  values.forEach((v) => { let i = Math.floor((v - lo) / w); if (i === bins && v === hi) i--; if (i >= 0 && i < bins) c[i]++; });
  return c.map((k, i) => ({ x: lo + (i + 0.5) * w, y: k }));
}

/** Hex colour to rgba string, for MatrixView cell colours. */
export function alpha(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
}
/** A cell tint whose strength grows with the value (a "heat" grid). */
export const heat = (hex: string, v: number, max: number) => alpha(hex, 0.12 + 0.5 * Math.min(1, Math.abs(v) / (max || 1)));

/** Solve the least-squares problem X b ≈ y via the normal equations (small problems only). */
export function lstsq(X: number[][], y: number[], ridge = 1e-8): number[] {
  const p = X[0].length;
  const A = Array.from({ length: p }, (_, i) => Array.from({ length: p + 1 }, (_, j) => (j < p ? X.reduce((s, r) => s + r[i] * r[j], 0) + (i === j ? ridge : 0) : X.reduce((s, r, k) => s + r[i] * y[k], 0))));
  for (let c = 0; c < p; c++) {
    let piv = c;
    for (let r = c + 1; r < p; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
    [A[c], A[piv]] = [A[piv], A[c]];
    const d = A[c][c] || 1e-12;
    for (let r = 0; r < p; r++) if (r !== c) { const f = A[r][c] / d; for (let j = c; j <= p; j++) A[r][j] -= f * A[c][j]; }
  }
  return A.map((row, i) => row[p] / (row[i] || 1e-12));
}
export const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);
export function r2(y: number[], yhat: number[]) {
  const m = mean(y), ssT = y.reduce((s, v) => s + (v - m) ** 2, 0), ssR = y.reduce((s, v, i) => s + (v - yhat[i]) ** 2, 0);
  return ssT ? 1 - ssR / ssT : 0;
}

/** Indian-style rupee formatting: 600000 -> "6,00,000". */
export function inr(v: number) {
  const s = Math.round(Math.abs(v)).toString();
  const last3 = s.slice(-3), rest = s.slice(0, -3);
  return (v < 0 ? '−' : '') + (rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' : '') + last3;
}
export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
