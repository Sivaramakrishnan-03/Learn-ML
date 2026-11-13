// Shared numeric toolkit for the topic animations (src/anim/*) and the pilot model pages (src/models/*).
// Pure TypeScript: no React, no DOM, no hidden randomness (every random helper takes a seeded generator or a seed).
//
// One implementation per function family:
//   • basics & descriptive statistics        sum, mean, variance/sd (ddof), quantile, median, corr, ranks …
//   • distributions                           normal, Student t, χ², F (pdf / cdf / sf / quantile), binomial, Poisson
//   • linear algebra & solvers               dot, matmul, solve, lstsq (+ridge), QR least squares, polynomial fit,
//                                            ridge / lasso, 2×2 eigen-decompositions, 2-D covariance
//   • histogram                               counts or densities in equal-width bins
//   • small data generators                   normal samples, permutations, bootstrap resamples, noisy curves
//
// The special functions (log-gamma, regularised incomplete beta / gamma, erf, inverse normal) come from
// src/lib/stats.ts, which is verified against scipy/statsmodels by `npm run verify:stats`. Everything else is built on them
// here, so there is exactly one copy of each in the code base. Unit tests: tests/viz-math.test.ts.
import { rng, gauss } from '../lib/datasets';
import { lgamma, ibeta, igamma, erf, normQuantile } from '../lib/stats';

export { rng, gauss, lgamma, erf };
/** Regularised incomplete beta I_x(a, b). */
export const betaI = (x: number, a: number, b: number) => ibeta(x, a, b);
/** Regularised lower incomplete gamma P(a, x). */
export const gammaP = (a: number, x: number) => igamma(a, x);

/* ================================ basics ================================ */

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Logistic function, with z clamped to ±40 so it never overflows. */
export const sigmoid = (z: number) => 1 / (1 + Math.exp(-clamp(z, -40, 40)));
export const sum = (a: ArrayLike<number>) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i]; return s; };
/** Arithmetic mean (0 for an empty array). */
export const mean = (a: ArrayLike<number>) => (a.length ? sum(a) / a.length : 0);
/** Variance with `ddof` delta degrees of freedom: 0 = population (NumPy default), 1 = sample (pandas default). 0 if n ≤ ddof. */
export function variance(a: ArrayLike<number>, ddof = 0) {
  const n = a.length;
  if (n - ddof <= 0) return 0;
  const m = mean(a);
  let ss = 0;
  for (let i = 0; i < n; i++) ss += (a[i] - m) ** 2;
  return ss / (n - ddof);
}
/** Standard deviation, ddof as in `variance`. */
export const sd = (a: ArrayLike<number>, ddof = 0) => Math.sqrt(variance(a, ddof));
/** Sample standard deviation (divide by n − 1). */
export const sdS = (a: ArrayLike<number>) => sd(a, 1);

/** Quantile of an already sorted array, linear interpolation (NumPy / pandas default, Excel QUARTILE.INC). */
export function quantileSorted(sorted: ArrayLike<number>, q: number) {
  if (!sorted.length) return 0;
  const h = (sorted.length - 1) * q, lo = Math.floor(h), hi = Math.ceil(h);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (h - lo);
}
export const sortAsc = (a: ArrayLike<number>) => Array.from(a).sort((x, y) => x - y);
/** Quantile with linear interpolation (sorts a copy). */
export const quantile = (a: ArrayLike<number>, q: number) => quantileSorted(sortAsc(a), q);
/** Median: middle value, or the average of the two middle values (0 for an empty array). */
export function median(a: ArrayLike<number>) {
  const s = sortAsc(a), n = s.length;
  if (!n) return 0;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}
/** Five-number summary with Tukey fences (1.5 × IQR) and the points outside them. */
export function boxStats(a: number[]) {
  const q1 = quantile(a, 0.25), med = quantile(a, 0.5), q3 = quantile(a, 0.75), iqr = q3 - q1;
  const loF = q1 - 1.5 * iqr, hiF = q3 + 1.5 * iqr;
  const inside = a.filter((v) => v >= loF && v <= hiF);
  return { q1, med, q3, iqr, loF, hiF, wLo: Math.min(...inside), wHi: Math.max(...inside), out: a.filter((v) => v < loF || v > hiF) };
}

/** Pearson correlation (0 if either variable is constant). */
export function corr(xs: ArrayLike<number>, ys: ArrayLike<number>) {
  const mx = mean(xs), my = mean(ys); let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < xs.length; i++) { const a = xs[i] - mx, b = ys[i] - my; sxy += a * b; sxx += a * a; syy += b * b; }
  return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : 0;
}
/** Ranks 1..n, ties get their average rank. */
export function ranks(a: number[]) {
  const idx = a.map((v, i) => [v, i] as [number, number]).sort((p, q) => p[0] - q[0]);
  const r = Array(a.length).fill(0);
  for (let i = 0; i < idx.length;) { let j = i; while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++; const avg = (i + j) / 2 + 1; for (let k = i; k <= j; k++) r[idx[k][1]] = avg; i = j + 1; }
  return r;
}
export const spearman = (xs: number[], ys: number[]) => corr(ranks(xs), ranks(ys));
/** Simple least-squares line y ≈ a + b·x. */
export function olsLine(xs: ArrayLike<number>, ys: ArrayLike<number>) {
  const mx = mean(xs), my = mean(ys); let sxy = 0, sxx = 0;
  for (let i = 0; i < xs.length; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
  const b = sxx > 0 ? sxy / sxx : 0;
  return { a: my - b * mx, b };
}

/* ---------- error metrics (y = actual, yhat = prediction) ---------- */
export const mse = (y: ArrayLike<number>, yhat: ArrayLike<number>) => { const e: number[] = []; for (let i = 0; i < y.length; i++) e.push((y[i] - yhat[i]) ** 2); return mean(e); };
export const rmse = (y: ArrayLike<number>, yhat: ArrayLike<number>) => Math.sqrt(mse(y, yhat));
export const mae = (y: ArrayLike<number>, yhat: ArrayLike<number>) => { const e: number[] = []; for (let i = 0; i < y.length; i++) e.push(Math.abs(y[i] - yhat[i])); return mean(e); };
/** Coefficient of determination 1 − SSres/SStot (0 if y is constant). */
export function r2(y: ArrayLike<number>, yhat: ArrayLike<number>) {
  const m = mean(y); let ssT = 0, ssR = 0;
  for (let i = 0; i < y.length; i++) { ssT += (y[i] - m) ** 2; ssR += (y[i] - yhat[i]) ** 2; }
  return ssT ? 1 - ssR / ssT : 0;
}

/* ================================ histogram ================================ */

/**
 * Equal-width histogram on [lo, hi]. Returns one {x: bin centre, y} per bin.
 * `density`: y = count / (n · width) so the bars have area 1 (otherwise raw counts).
 * `closed`: a value exactly equal to `hi` goes into the last bin (NumPy convention); otherwise it is dropped.
 * Values outside [lo, hi] are ignored.
 */
export function histogram(values: ArrayLike<number>, lo: number, hi: number, bins: number, { density = false, closed = true }: { density?: boolean; closed?: boolean } = {}) {
  const w = (hi - lo) / bins, c: number[] = Array(bins).fill(0);
  for (let k = 0; k < values.length; k++) {
    const v = values[k], i = Math.floor((v - lo) / w);
    if (i >= 0 && i < bins) c[i]++;
    else if (closed && v === hi) c[bins - 1]++;
  }
  const area = Math.max(values.length, 1) * w;
  return c.map((n, i) => ({ x: lo + (i + 0.5) * w, y: density ? n / area : n }));
}

/* ================================ distributions ================================ */

/** Bisection inverse of a non-decreasing cdf on [lo, hi]; `hi` is doubled until it brackets p. */
function invert(cdf: (x: number) => number, p: number, lo: number, hi: number) {
  for (let k = 0; k < 60 && cdf(hi) < p; k++) hi *= 2;
  for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (cdf(mid) < p) lo = mid; else hi = mid; if (hi - lo < 1e-12 * Math.max(1, Math.abs(hi))) break; }
  return (lo + hi) / 2;
}

/* ---------- normal ---------- */
export const normPdf = (x: number, m = 0, s = 1) => Math.exp(-((x - m) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));
export const normCdf = (x: number, m = 0, s = 1) => { const z = (x - m) / s; return z < -8 ? 0 : z > 8 ? 1 : 0.5 * (1 + erf(z / Math.SQRT2)); };
/** Inverse normal cdf (±Infinity at p = 0 / 1). */
export const normInv = (p: number, m = 0, s = 1) => m + s * normQuantile(p);
/** Two-sided p-value for a z statistic. */
export const twoSidedP = (z: number) => 2 * normCdf(-Math.abs(z));

/* ---------- Student t ---------- */
export const tPdf = (x: number, df: number) => Math.exp(lgamma((df + 1) / 2) - lgamma(df / 2) - 0.5 * Math.log(df * Math.PI) - ((df + 1) / 2) * Math.log(1 + (x * x) / df));
export function tCdf(x: number, df: number) {
  const tail = 0.5 * ibeta(df / (df + x * x), df / 2, 0.5);
  return x > 0 ? 1 - tail : tail;
}
export const tInv = (p: number, df: number) => (p <= 0 ? -Infinity : p >= 1 ? Infinity : invert((x) => tCdf(x, df), p, -1e3, 1e3));
/** Two-sided p-value for a t statistic. */
export const tP2 = (t: number, df: number) => ibeta(df / (df + t * t), df / 2, 0.5);

/* ---------- chi-square ---------- */
/** χ²(k) density. At x = 0 it returns ½ for k = 2 and 0 otherwise (the k = 1 spike is left out so plots stay finite). */
export const chi2Pdf = (x: number, k: number) => (x <= 0 ? (x === 0 && k === 2 ? 0.5 : 0) : Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.LN2 - lgamma(k / 2)));
export const chi2Cdf = (x: number, k: number) => (x <= 0 ? 0 : igamma(k / 2, x / 2));
/** Upper tail P(X > x): the χ² test p-value. */
export const chi2Sf = (x: number, k: number) => 1 - chi2Cdf(x, k);
export const chi2Inv = (p: number, k: number) => (p <= 0 ? 0 : p >= 1 ? Infinity : invert((x) => chi2Cdf(x, k), p, 0, Math.max(10, 2 * k)));
/** Critical value with upper-tail area α. */
export const chi2Crit = (alpha: number, k: number) => chi2Inv(1 - alpha, k);

/* ---------- F ---------- */
export const fPdf = (x: number, d1: number, d2: number) => (x <= 0 ? 0 : Math.exp(0.5 * (d1 * Math.log(d1 * x) + d2 * Math.log(d2) - (d1 + d2) * Math.log(d1 * x + d2)) - Math.log(x) - (lgamma(d1 / 2) + lgamma(d2 / 2) - lgamma((d1 + d2) / 2))));
/** Upper tail P(F > x): the F test p-value. */
export const fSf = (x: number, d1: number, d2: number) => (x <= 0 ? 1 : ibeta(d2 / (d2 + d1 * x), d2 / 2, d1 / 2));
export const fCdf = (x: number, d1: number, d2: number) => 1 - fSf(x, d1, d2);
export const fInv = (p: number, d1: number, d2: number) => (p <= 0 ? 0 : p >= 1 ? Infinity : invert((x) => fCdf(x, d1, d2), p, 0, 10));
/** Critical value with upper-tail area α. */
export const fCrit = (alpha: number, d1: number, d2: number) => fInv(1 - alpha, d1, d2);

/* ---------- discrete ---------- */
/** log(k!) by direct summation (exact enough for the small counts used here). */
export function logFact(k: number) { let s = 0; for (let i = 2; i <= k; i++) s += Math.log(i); return s; }
export const binomPmf = (k: number, n: number, p: number) => (k < 0 || k > n ? 0 : Math.exp(lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1) + (k ? k * Math.log(p) : 0) + (n - k ? (n - k) * Math.log(1 - p) : 0)));
/** [P(0), …, P(n)] for Binomial(n, p). */
export const binomPmfs = (n: number, p: number) => Array.from({ length: n + 1 }, (_, k) => binomPmf(k, n, p));
export const poissonPmf = (k: number, lam: number) => (k < 0 ? 0 : Math.exp(k * Math.log(Math.max(lam, 1e-12)) - lam - logFact(k)));
/** [P(0), …, P(kmax)] for Poisson(λ). */
export const poissonPmfs = (lam: number, kmax: number) => Array.from({ length: kmax + 1 }, (_, k) => poissonPmf(k, lam));

/* ================================ linear algebra ================================ */

export type Vec = number[];
export type Mat = number[][];
export const dot = (a: ArrayLike<number>, b: ArrayLike<number>) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
export const transpose = (A: Mat): Mat => A[0].map((_, j) => A.map((r) => r[j]));
export const matvec = (A: Mat, v: Vec): Vec => A.map((r) => dot(r, v));
export const matmul = (A: Mat, B: Mat): Mat => A.map((r) => B[0].map((_, j) => r.reduce((s, a, k) => s + a * B[k][j], 0)));

/** Solve A x = b (small dense systems) by Gaussian elimination with partial pivoting. Near-zero pivots are replaced by 1e-12. */
export function solve(A: Mat, b: Vec): Vec {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
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

/**
 * Least squares X β ≈ y via the normal equations (small problems only).
 * `ridge` adds λ to the diagonal of X'X: to every coefficient except the first (the intercept column) by default,
 * or to all of them with `ridgeFirst = true`.
 */
export function lstsq(X: Mat, y: Vec, ridge = 0, ridgeFirst = false): Vec {
  const p = X[0].length, A: Mat = Array.from({ length: p }, () => Array(p).fill(0)), b: Vec = Array(p).fill(0);
  X.forEach((row, i) => { for (let j = 0; j < p; j++) { b[j] += row[j] * y[i]; for (let k = 0; k < p; k++) A[j][k] += row[j] * row[k]; } });
  for (let j = ridgeFirst ? 0 : 1; j < p; j++) A[j][j] += ridge;
  return solve(A, b);
}

/** Least squares by modified Gram–Schmidt QR with a tiny ridge (numerically stable; used for high-degree polynomials). */
export function qrLstsq(X: Mat, y: Vec, tiny = 1e-9): Vec {
  const p = X[0].length;
  const rows = [...X.map((r) => [...r]), ...Array.from({ length: p }, (_, j) => Array.from({ length: p }, (_, k) => (j === k ? Math.sqrt(tiny) : 0)))];
  const yy = [...y, ...Array(p).fill(0)], n = rows.length;
  const Q = Array.from({ length: p }, (_, j) => rows.map((r) => r[j]));
  const R: Mat = Array.from({ length: p }, () => Array(p).fill(0));
  for (let j = 0; j < p; j++) {
    for (let k = 0; k < j; k++) { let d = 0; for (let i = 0; i < n; i++) d += Q[k][i] * Q[j][i]; R[k][j] = d; for (let i = 0; i < n; i++) Q[j][i] -= d * Q[k][i]; }
    let nr = 0; for (let i = 0; i < n; i++) nr += Q[j][i] ** 2; nr = Math.sqrt(nr) || 1e-12; R[j][j] = nr; for (let i = 0; i < n; i++) Q[j][i] /= nr;
  }
  const qty = Q.map((q) => q.reduce((s, v, i) => s + v * yy[i], 0));
  const beta: Vec = Array(p).fill(0);
  for (let j = p - 1; j >= 0; j--) { let s = qty[j]; for (let k = j + 1; k < p; k++) s -= R[j][k] * beta[k]; beta[j] = s / R[j][j]; }
  return beta;
}

/** Chebyshev basis T0..Tdeg at u ∈ [−1, 1]. */
export function chebyshev(u: number, deg: number): number[] {
  const t = [1, u]; for (let k = 2; k <= deg; k++) t.push(2 * u * t[k - 1] - t[k - 2]);
  return t.slice(0, deg + 1);
}
/** Legendre basis P0..Pdeg at u ∈ [−1, 1]. */
export function legendre(u: number, deg: number): number[] {
  const P = [1, u];
  for (let k = 2; k <= deg; k++) P.push(((2 * k - 1) * u * P[k - 1] - (k - 1) * P[k - 2]) / k);
  return P.slice(0, deg + 1);
}
/** Map x ∈ [lo, hi] onto [−1, 1]. */
export const toUnit = (x: number, lo: number, hi: number) => (2 * (x - lo)) / (hi - lo) - 1;
/** Least-squares polynomial of degree `deg` on [lo, hi], returned as a function. Fitted in a Chebyshev basis by QR,
 *  so it is the same curve as fitting raw powers, just computed stably. */
export function polyFit(xs: number[], ys: number[], deg: number, lo: number, hi: number, ridge = 1e-9) {
  const beta = qrLstsq(xs.map((x) => chebyshev(toUnit(x, lo, hi), deg)), ys, ridge);
  return (x: number) => chebyshev(toUnit(x, lo, hi), deg).reduce((s, v, i) => s + v * beta[i], 0);
}

/** z-score columns (sample SD; constant columns get SD 1). */
export function standardize(cols: number[][]) {
  const mu = cols.map(mean), s = cols.map((c) => sdS(c) || 1);
  return { Z: cols.map((c, j) => c.map((v) => (v - mu[j]) / s[j])), mu, s };
}
/** Ridge on standardised feature COLUMNS Z (p × n) and centred y: minimises (1/2n)‖y − Zᵀβ‖² + (λ/2)‖β‖². */
export function ridgeFit(Z: number[][], y: number[], lam: number): number[] {
  const p = Z.length, n = y.length;
  const A = Array.from({ length: p }, (_, j) => Array.from({ length: p }, (_, k) => Z[j].reduce((s, v, i) => s + v * Z[k][i], 0) / n + (j === k ? lam : 0)));
  const b = Z.map((c) => c.reduce((s, v, i) => s + v * y[i], 0) / n);
  return solve(A, b);
}
const softThreshold = (z: number, g: number) => (z > g ? z - g : z < -g ? z + g : 0);
/** Lasso / elastic net (α = 1 lasso) by coordinate descent on feature COLUMNS: (1/2n)‖y − Zᵀβ‖² + λ(α‖β‖₁ + (1−α)/2‖β‖²). */
export function lassoFit(Z: number[][], y: number[], lam: number, alpha = 1, init?: number[], iters = 300): number[] {
  const p = Z.length, n = y.length, beta = init ? [...init] : Array(p).fill(0);
  const ss = Z.map((c) => c.reduce((s, v) => s + v * v, 0) / n);
  const r = y.map((v, i) => v - Z.reduce((s, c, j) => s + c[i] * beta[j], 0));
  for (let it = 0; it < iters; it++) {
    let maxd = 0;
    for (let j = 0; j < p; j++) {
      let rho = 0; for (let i = 0; i < n; i++) rho += Z[j][i] * (r[i] + Z[j][i] * beta[j]); rho /= n;
      const nb = softThreshold(rho, lam * alpha) / (ss[j] + lam * (1 - alpha));
      const d = nb - beta[j];
      if (d) { for (let i = 0; i < n; i++) r[i] -= Z[j][i] * d; beta[j] = nb; maxd = Math.max(maxd, Math.abs(d)); }
    }
    if (maxd < 1e-7) break;
  }
  return beta;
}

/* ---------- 2-D vectors and matrices ---------- */
export type V2 = [number, number];
export type M2 = [[number, number], [number, number]];
export const mv = (A: M2, v: V2): V2 => [A[0][0] * v[0] + A[0][1] * v[1], A[1][0] * v[0] + A[1][1] * v[1]];
export const norm = (v: V2) => Math.hypot(v[0], v[1]);
export const det = (A: M2) => A[0][0] * A[1][1] - A[0][1] * A[1][0];

/** Real eigenpairs of a general 2×2 matrix (unit eigenvectors), or [] if the eigenvalues are complex. */
export function eig2(A: M2): { lam: number; v: V2 }[] {
  const [[a, b], [c, d]] = A;
  const tr = a + d, dt = a * d - b * c, disc = (tr * tr) / 4 - dt;
  if (disc < -1e-12) return [];
  const r = Math.sqrt(Math.max(0, disc));
  const lams = r < 1e-9 ? [tr / 2] : [tr / 2 + r, tr / 2 - r];
  const out: { lam: number; v: V2 }[] = [];
  lams.forEach((lam) => {
    let v: V2;
    if (Math.abs(b) > 1e-9) v = [b, lam - a];
    else if (Math.abs(c) > 1e-9) v = [lam - d, c];
    else { // diagonal matrix: axes (both if equal eigenvalues)
      if (r < 1e-9) { out.push({ lam, v: [1, 0] }, { lam, v: [0, 1] }); return; }
      v = Math.abs(lam - a) < 1e-9 ? [1, 0] : [0, 1];
    }
    const n = norm(v); out.push({ lam, v: [v[0] / n, v[1] / n] });
  });
  return out;
}

/** Symmetric 2×2 matrix [[a, b], [b, c]], e.g. a covariance. */
export interface Cov { a: number; b: number; c: number }
/** Eigen-decomposition of a symmetric 2×2 matrix: λ1 ≥ λ2 (λ2 floored at 0) and the angle (radians) of the first eigenvector. */
export function eigSym2(m: Cov) {
  const tr = m.a + m.c, dt = m.a * m.c - m.b * m.b;
  const disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - dt));
  const l1 = tr / 2 + disc, l2 = tr / 2 - disc;
  const ang = Math.abs(m.b) < 1e-12 ? (m.a >= m.c ? 0 : Math.PI / 2) : Math.atan2(l1 - m.a, m.b);
  return { l1, l2: Math.max(l2, 0), ang };
}
/** (Weighted) mean and population covariance of 2-D points. */
export function cov2(pts: { x: number; y: number }[], w?: number[]): { mu: { x: number; y: number }; cov: Cov } {
  const ws = w ?? pts.map(() => 1);
  const W = ws.reduce((s, v) => s + v, 0) || 1e-9;
  const mx = pts.reduce((s, p, i) => s + ws[i] * p.x, 0) / W, my = pts.reduce((s, p, i) => s + ws[i] * p.y, 0) / W;
  let a = 0, b = 0, c = 0;
  pts.forEach((p, i) => { const dx = p.x - mx, dy = p.y - my; a += ws[i] * dx * dx; b += ws[i] * dx * dy; c += ws[i] * dy * dy; });
  return { mu: { x: mx, y: my }, cov: { a: a / W, b: b / W, c: c / W } };
}
/** Bivariate normal density at p. */
export function normPdf2(p: { x: number; y: number }, mu: { x: number; y: number }, m: Cov) {
  const dt = Math.max(m.a * m.c - m.b * m.b, 1e-9);
  const dx = p.x - mu.x, dy = p.y - mu.y;
  const q = (m.c * dx * dx - 2 * m.b * dx * dy + m.a * dy * dy) / dt;
  return Math.exp(-q / 2) / (2 * Math.PI * Math.sqrt(dt));
}

/* ================================ small data generators ================================ */

/** n draws from N(m, s²). */
export const normalSample = (r: () => number, n: number, m: number, s: number) => Array.from({ length: n }, () => m + s * gauss(r));
/** Fisher–Yates shuffle in place, driven by r. Returns the same array. */
export function shuffleInPlace<T>(a: T[], r: () => number): T[] {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
/** Seeded random permutation of 0..n−1. */
export const permutation = (n: number, seed: number) => shuffleInPlace(Array.from({ length: n }, (_, i) => i), rng(seed));
/** n row indices drawn with replacement from 0..n−1 (one bootstrap resample). */
export const resampleIdx = (n: number, r: () => number) => Array.from({ length: n }, () => Math.floor(r() * n));
/** How many times each of 0..n−1 appears in idx. */
export const tally = (idx: number[], n: number) => { const c: number[] = Array(n).fill(0); idx.forEach((i) => c[i]++); return c; };
/** One bootstrap resample with its per-row counts. */
export function bootstrap(n: number, r: () => number) { const idx = resampleIdx(n, r); return { idx, counts: tally(idx, n) }; }
/** Noisy sample (x, f(x) + noise·z) on [lo, hi]: uniform random x, or evenly spaced x with `evenly`. */
export function sampleCurve(f: (x: number) => number, n: number, lo: number, hi: number, noise: number, seed: number, evenly = false): { x: number; y: number }[] {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const x = evenly ? lo + ((hi - lo) * (i + 0.5)) / n : lo + (hi - lo) * r();
    return { x, y: f(x) + noise * gauss(r) };
  });
}
/** Draw from a discrete distribution given values and probabilities. */
export function drawDiscrete(vals: number[], probs: number[], r: () => number) {
  const u = r(); let acc = 0;
  for (let i = 0; i < vals.length; i++) { acc += probs[i]; if (u < acc) return vals[i]; }
  return vals[vals.length - 1];
}
/** Poisson draw by inversion (fine for rates below ~60). */
export function poissonDraw(lam: number, r: () => number) {
  const u = r(); let k = 0, p = Math.exp(-lam), c = p;
  while (u > c && k < 2000) { k++; p *= lam / k; c += p; }
  return k;
}
