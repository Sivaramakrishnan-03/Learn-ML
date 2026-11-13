// Shared pure helpers for the TIME SERIES animations (ts-components, exp-smoothing, arima, ts-validation).
// No JSX here (the registry treats every .tsx in src/anim as a topic). All randomness goes through the seeded rng.
// Generic maths (sum, mean, sd, …) lives in src/viz/math.ts.
import { rng, gauss, sum, mean } from '../viz/math';

export type Pt = { x: number; y: number };
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** Month index t (0 = Jan 2022) → "Oct 23" style label. */
export const monthLabel = (t: number) => `${MONTHS[((Math.round(t) % 12) + 12) % 12]} ${String(22 + Math.floor(Math.round(t) / 12)).padStart(2, '0')}`;

/** SVG path through points, given the plot's scale functions. Non-finite points break the line. */
export function pathD(sx: (v: number) => number, sy: (v: number) => number, pts: Pt[]) {
  let d = '', pen = false;
  for (const p of pts) {
    if (!isFinite(p.x) || !isFinite(p.y)) { pen = false; continue; }
    d += `${pen ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`; pen = true;
  }
  return d;
}
/** Closed polygon for a band between lo and hi curves (prediction intervals). */
export function bandD(sx: (v: number) => number, sy: (v: number) => number, xs: number[], lo: number[], hi: number[]) {
  if (!xs.length) return '';
  const up = xs.map((x, i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(hi[i]).toFixed(1)}`).join('');
  const dn = xs.map((_, j) => { const i = xs.length - 1 - j; return `L${sx(xs[i]).toFixed(1)},${sy(lo[i]).toFixed(1)}`; }).join('');
  return up + dn + 'Z';
}
export const toPts = (ys: number[], x0 = 0) => ys.map((y, i) => ({ x: x0 + i, y }));

/** Sample autocorrelation r_k for k = 1..maxLag. */
export function acf(y: number[], maxLag: number) {
  const n = y.length, m = mean(y);
  const den = sum(y.map((v) => (v - m) ** 2)) || 1;
  return Array.from({ length: maxLag }, (_, j) => {
    const k = j + 1; let s = 0;
    for (let t = k; t < n; t++) s += (y[t] - m) * (y[t - k] - m);
    return s / den;
  });
}

/** Additive seasonal pattern for a sweets maker (₹ lakh): Diwali peak in Oct/Nov, slump in Jan/Feb. Sums to 0. */
export const SWEETS_SEASON = [-12, -15, -6, -2, 0, -4, -6, 2, 8, 22, 18, -5];

/** Monthly series = level + slope·t + amp·season + noise. Returns the parts separately. */
export function monthlySeries({ n = 48, level = 100, slope = 1.2, amp = 1, noise = 4, seed = 11 }: { n?: number; level?: number; slope?: number; amp?: number; noise?: number; seed?: number }) {
  const r = rng(seed);
  const z = Array.from({ length: n }, () => gauss(r));
  const trend = Array.from({ length: n }, (_, t) => level + slope * t);
  const season = Array.from({ length: n }, (_, t) => amp * SWEETS_SEASON[t % 12]);
  const rem = z.map((v) => v * noise);
  const y = trend.map((v, t) => v + season[t] + rem[t]);
  return { trend, season, rem, y };
}

/** Classical additive decomposition with a centred 2×12 moving average. */
export function decompose(y: number[], m = 12) {
  const n = y.length, h = m / 2;
  const trend = y.map((_, t) => {
    if (t < h || t >= n - h) return NaN;
    let s = 0.5 * y[t - h] + 0.5 * y[t + h];
    for (let k = -h + 1; k < h; k++) s += y[t + k];
    return s / m;
  });
  const detr = y.map((v, t) => v - trend[t]);
  const raw = Array.from({ length: m }, (_, j) => mean(detr.filter((v, t) => t % m === j && isFinite(v))));
  const adj = mean(raw);
  const seasIdx = raw.map((v) => v - adj);
  const season = y.map((_, t) => seasIdx[t % m]);
  const rem = y.map((v, t) => v - trend[t] - season[t]);
  return { trend, detr, seasIdx, season, rem };
}

/** Simple exponential smoothing. f[t] = forecast for y[t] made at t−1; f[n] = forecast for every future step. */
export function ses(y: number[], alpha: number, l0 = y[0]) {
  const f: number[] = [l0]; let l = l0;
  for (const v of y) { l = l + alpha * (v - l); f.push(l); }
  return f;
}
/** Holt's linear trend. Returns one-step forecasts f (length n) and future forecasts for h = 1..H. */
export function holt(y: number[], alpha: number, beta: number, H = 0, l0 = y[0], b0 = y[1] - y[0]) {
  let l = l0, b = b0; const f: number[] = [], L: number[] = [], B: number[] = [];
  for (const v of y) {
    f.push(l + b);
    const ln = alpha * v + (1 - alpha) * (l + b);
    b = beta * (ln - l) + (1 - beta) * b; l = ln; L.push(l); B.push(b);
  }
  return { f, fut: Array.from({ length: H }, (_, h) => l + (h + 1) * b), L, B };
}
/** Additive Holt-Winters with period m, initialised from the first two seasons. Forecasts start at t = m. */
export function holtWinters(y: number[], alpha: number, beta: number, gamma: number, m = 12, H = 0) {
  const n = y.length;
  const s1 = mean(y.slice(0, m)), s2 = n >= 2 * m ? mean(y.slice(m, 2 * m)) : s1;
  let l = s1, b = (s2 - s1) / m;
  const s = y.slice(0, m).map((v, j) => v - (s1 + (j - (m - 1) / 2) * b));
  l = s1 + ((m - 1) / 2) * b; // level at the end of the first season
  const f: number[] = Array(m).fill(NaN);
  for (let t = m; t < n; t++) {
    const si = s[t % m];
    f.push(l + b + si);
    const ln = alpha * (y[t] - si) + (1 - alpha) * (l + b);
    const bn = beta * (ln - l) + (1 - beta) * b;
    s[t % m] = gamma * (y[t] - ln) + (1 - gamma) * si;
    l = ln; b = bn;
  }
  return { f, fut: Array.from({ length: H }, (_, h) => l + (h + 1) * b + s[(n + h) % m]) };
}

/* forecast-error metrics on error vectors that may contain NaN gaps (periods without a forecast) */
export const rmse = (e: number[]) => { const v = e.filter(isFinite); return v.length ? Math.sqrt(mean(v.map((x) => x * x))) : 0; };
export const mae = (e: number[]) => { const v = e.filter(isFinite); return v.length ? mean(v.map(Math.abs)) : 0; };
export const wape = (act: number[], fc: number[]) => 100 * sum(act.map((a, i) => Math.abs(a - fc[i]))) / Math.max(1e-9, sum(act.map(Math.abs)));
