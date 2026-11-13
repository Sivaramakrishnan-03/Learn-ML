// Shared pure helpers for the ML workflow & evaluation animations
// (train-test-split, bias-variance, cross-validation, regression-metrics, classification-metrics, hyperparameter-tuning, sklearn-pipelines).
import { clamp, legendre, toUnit, lstsq, mse as mseOf } from '../viz/math';

export type Pt = { x: number; y: number };

export const finite = (v: number, fallback = 0) => (isFinite(v) ? v : fallback);

/** Least-squares polynomial of degree d fitted on pts, with x mapped from [lo, hi] to [-1, 1] (Legendre basis, well conditioned
 *  even for degree 15) and a small ridge (ridge·n on the diagonal) that tames the wildest fits. Returns f(x). */
export function polyFit(pts: Pt[], d: number, lo: number, hi: number, ridge = 1e-7) {
  const D = Math.max(0, d), m = D + 1;
  const w = pts.length ? lstsq(pts.map((p) => legendre(toUnit(p.x, lo, hi), D)), pts.map((p) => p.y), ridge * pts.length, true) : Array(m).fill(0);
  return (x: number) => { const B = legendre(toUnit(x, lo, hi), D); let s = 0; for (let i = 0; i < m; i++) s += w[i] * B[i]; return s; };
}

/** Mean squared error of f on the points. */
export const mse = (pts: Pt[], f: (x: number) => number) => mseOf(pts.map((p) => p.y), pts.map((p) => f(p.x)));
export const rmse = (pts: Pt[], f: (x: number) => number) => Math.sqrt(mse(pts, f));

/** Clip a function to a y-window so wild polynomial tails stay drawable. */
export const clipped = (f: (x: number) => number, lo: number, hi: number) => (x: number) => clamp(finite(f(x), lo), lo - 1, hi + 1);
