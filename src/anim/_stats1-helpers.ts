// Shared numeric helpers for the STATISTICS PART 1 animations (descriptive stats, normal, distributions, CIs, tests).
// Pure functions only; accuracy checked against scipy (cdf errors < 1e-6).
import { gauss } from '../lib/datasets';

export const mean = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
/** Sample SD (divide by n − 1). */
export const sdS = (a: number[]) => { if (a.length < 2) return 0; const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1)); };
/** Linear-interpolation quantile (numpy / pandas default). */
export function quantile(a: number[], q: number) {
  const s = [...a].sort((x, y) => x - y); if (!s.length) return 0;
  const pos = (s.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}
export const median = (a: number[]) => quantile(a, 0.5);

/** Histogram as densities (area 1) or as counts. */
export function hist(values: number[], lo: number, hi: number, bins: number, density = true) {
  const w = (hi - lo) / bins, c = Array(bins).fill(0);
  values.forEach((v) => { const i = Math.floor((v - lo) / w); if (i >= 0 && i < bins) c[i]++; });
  return c.map((k, i) => ({ x: lo + (i + 0.5) * w, y: density ? k / (Math.max(values.length, 1) * w) : k }));
}

/* ---------- normal ---------- */
export const normPdf = (x: number, m = 0, s = 1) => Math.exp(-((x - m) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));
function erfc(x: number) { // Numerical Recipes erfcc, fractional error < 1.2e-7
  const z = Math.abs(x), t = 1 / (1 + 0.5 * z);
  const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? r : 2 - r;
}
export const normCdf = (x: number, m = 0, s = 1) => 0.5 * erfc(-(x - m) / (s * Math.SQRT2));
export function normInv(p: number) { // bisection: plenty fast for UI use
  let lo = -10, hi = 10;
  for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (normCdf(mid) < p) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}

/* ---------- gamma / beta / t ---------- */
export function lgamma(x: number): number { // Lanczos
  const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
  x -= 1; let a = c[0]; const t = x + g + 0.5;
  for (let i = 1; i < 9; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}
function betacf(a: number, b: number, x: number) {
  const qab = a + b, qap = a + 1, qam = a - 1; let c = 1, d = 1 - (qab * x) / qap;
  if (Math.abs(d) < 1e-30) d = 1e-30; d = 1 / d; let h = d;
  for (let m = 1; m <= 200; m++) {
    const m2 = 2 * m; let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30; c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30; d = 1 / d; h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30; c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30; d = 1 / d;
    const del = d * c; h *= del; if (Math.abs(del - 1) < 3e-12) break;
  }
  return h;
}
function ibeta(a: number, b: number, x: number) {
  if (x <= 0) return 0; if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
}
export const tPdf = (x: number, df: number) => Math.exp(lgamma((df + 1) / 2) - lgamma(df / 2) - 0.5 * Math.log(df * Math.PI) - ((df + 1) / 2) * Math.log(1 + (x * x) / df));
export function tCdf(x: number, df: number) {
  const p = 0.5 * ibeta(df / 2, 0.5, df / (df + x * x));
  return x >= 0 ? 1 - p : p;
}
export function tInv(p: number, df: number) {
  let lo = -60, hi = 60;
  for (let i = 0; i < 90; i++) { const mid = (lo + hi) / 2; if (tCdf(mid, df) < p) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}
/** Two-sided p-value for a t statistic. */
export const tP2 = (t: number, df: number) => 2 * (1 - tCdf(Math.abs(t), df));

/* ---------- discrete ---------- */
export const binomPmf = (k: number, n: number, p: number) => (k < 0 || k > n ? 0 : Math.exp(lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1) + (k ? k * Math.log(p) : 0) + (n - k ? (n - k) * Math.log(1 - p) : 0)));
export const poisPmf = (k: number, lam: number) => (k < 0 ? 0 : Math.exp(k * Math.log(lam) - lam - lgamma(k + 1)));

/* ---------- formatting / sampling ---------- */
export const pct = (p: number, d = 1) => (100 * p).toFixed(d) + '%';
export function pFmt(p: number) { return p < 0.0001 ? '< 0.0001' : p < 0.001 ? p.toFixed(5) : p.toFixed(p < 0.1 ? 4 : 3); }
export const normalSample = (r: () => number, n: number, m: number, s: number) => Array.from({ length: n }, () => m + s * gauss(r));
/** Stack identical-ish values into a dot plot: returns y levels (1, 2, 3 …) for values falling in the same bin. */
export function stackY(values: number[], binW: number) {
  const seen: Record<number, number> = {};
  return values.map((v) => { const b = Math.round(v / binW); seen[b] = (seen[b] ?? 0) + 1; return seen[b]; });
}
