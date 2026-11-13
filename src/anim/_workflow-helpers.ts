// Shared pure helpers for the ML workflow & evaluation animations
// (train-test-split, bias-variance, cross-validation, regression-metrics, classification-metrics, hyperparameter-tuning, sklearn-pipelines).
import { rng, gauss } from '../lib/datasets';

export type Pt = { x: number; y: number };

export const mean = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
export const sd = (a: number[]) => { const m = mean(a); return a.length ? Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length) : 0; };
export const median = (a: number[]) => { const b = [...a].sort((p, q) => p - q); const k = b.length; return k ? (k % 2 ? b[(k - 1) / 2] : (b[k / 2 - 1] + b[k / 2]) / 2) : 0; };
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const finite = (v: number, fallback = 0) => (isFinite(v) ? v : fallback);

/** Fisher–Yates permutation of 0..n-1 with a seeded generator. */
export function permutation(n: number, seed: number) {
  const r = rng(seed), a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** Solve A x = b (small dense systems) by Gaussian elimination with partial pivoting. */
function solve(A: number[][], b: number[]) {
  const n = b.length, M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const piv = Math.abs(M[c][c]) < 1e-12 ? 1e-12 : M[c][c];
    for (let r = c + 1; r < n; r++) { const f = M[r][c] / piv; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  const x = Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k]; x[r] = s / (Math.abs(M[r][r]) < 1e-12 ? 1e-12 : M[r][r]); }
  return x;
}

/** Legendre basis on t ∈ [-1, 1] (well conditioned even for degree 15). */
function legendre(t: number, d: number) {
  const P = [1, t];
  for (let k = 2; k <= d; k++) P.push(((2 * k - 1) * t * P[k - 1] - (k - 1) * P[k - 2]) / k);
  return P.slice(0, d + 1);
}

/** Least-squares polynomial of degree d fitted on pts, with x mapped from [lo, hi] to [-1, 1]. Returns f(x). */
export function polyFit(pts: Pt[], d: number, lo: number, hi: number, ridge = 1e-7) {
  const map = (x: number) => (2 * (x - lo)) / (hi - lo) - 1;
  const D = Math.max(0, d), m = D + 1;
  const A = Array.from({ length: m }, () => Array(m).fill(0)), b = Array(m).fill(0);
  pts.forEach((p) => { const B = legendre(map(p.x), D); for (let i = 0; i < m; i++) { b[i] += B[i] * p.y; for (let j = 0; j < m; j++) A[i][j] += B[i] * B[j]; } });
  for (let i = 0; i < m; i++) A[i][i] += ridge * (pts.length || 1);
  const w = pts.length ? solve(A, b) : Array(m).fill(0);
  return (x: number) => { const B = legendre(map(x), D); let s = 0; for (let i = 0; i < m; i++) s += w[i] * B[i]; return s; };
}

export const mse = (pts: Pt[], f: (x: number) => number) => mean(pts.map((p) => (p.y - f(p.x)) ** 2));
export const rmse = (pts: Pt[], f: (x: number) => number) => Math.sqrt(mse(pts, f));

/** Noisy sample from a true curve on [lo, hi]. */
export function sampleCurve(f: (x: number) => number, n: number, lo: number, hi: number, noise: number, seed: number, evenly = false): Pt[] {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const x = evenly ? lo + ((hi - lo) * (i + 0.5)) / n : lo + (hi - lo) * r();
    return { x, y: f(x) + noise * gauss(r) };
  });
}

/** Clip a function to a y-window so wild polynomial tails stay drawable. */
export const clipped = (f: (x: number) => number, lo: number, hi: number) => (x: number) => clamp(finite(f(x), lo), lo - 1, hi + 1);
