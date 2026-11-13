// Shared numeric helpers for the regression-family animations (multiple, polynomial, ridge/lasso, Poisson, logistic, k-NN).
// Pure functions only: no React, no randomness except through the seeded rng passed in.

export const mean = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
export const sd = (a: number[]) => { const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / Math.max(1, a.length - 1)); };
export const corr = (a: number[], b: number[]) => {
  const ma = mean(a), mb = mean(b); let sab = 0, saa = 0, sbb = 0;
  a.forEach((v, i) => { sab += (v - ma) * (b[i] - mb); saa += (v - ma) ** 2; sbb += (b[i] - mb) ** 2; });
  return saa && sbb ? sab / Math.sqrt(saa * sbb) : 0;
};
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const sigmoid = (z: number) => 1 / (1 + Math.exp(-clamp(z, -40, 40)));
export const rmse = (a: number[], b: number[]) => Math.sqrt(mean(a.map((v, i) => (v - b[i]) ** 2)));

/** Solve A x = b by Gaussian elimination with partial pivoting. */
export function solve(A: number[][], b: number[]): number[] {
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

/** Least squares via normal equations. Rows of X should include a leading 1 for the intercept. `ridge` adds λ to every diagonal except the intercept. */
export function lstsq(X: number[][], y: number[], ridge = 0): number[] {
  const p = X[0].length, A = Array.from({ length: p }, () => Array(p).fill(0)), b = Array(p).fill(0);
  X.forEach((row, i) => { for (let j = 0; j < p; j++) { b[j] += row[j] * y[i]; for (let k = 0; k < p; k++) A[j][k] += row[j] * row[k]; } });
  for (let j = 1; j < p; j++) A[j][j] += ridge;
  return solve(A, b);
}

/** Least squares by modified Gram–Schmidt QR (numerically stable; used for high-degree polynomials). */
export function qrLstsq(X: number[][], y: number[], tiny = 1e-9): number[] {
  const p = X[0].length;
  const rows = [...X.map((r) => [...r]), ...Array.from({ length: p }, (_, j) => Array.from({ length: p }, (_, k) => (j === k ? Math.sqrt(tiny) : 0)))];
  const yy = [...y, ...Array(p).fill(0)], n = rows.length;
  const Q = Array.from({ length: p }, (_, j) => rows.map((r) => r[j]));
  const R = Array.from({ length: p }, () => Array(p).fill(0));
  for (let j = 0; j < p; j++) {
    for (let k = 0; k < j; k++) { let d = 0; for (let i = 0; i < n; i++) d += Q[k][i] * Q[j][i]; R[k][j] = d; for (let i = 0; i < n; i++) Q[j][i] -= d * Q[k][i]; }
    let nr = 0; for (let i = 0; i < n; i++) nr += Q[j][i] ** 2; nr = Math.sqrt(nr) || 1e-12; R[j][j] = nr; for (let i = 0; i < n; i++) Q[j][i] /= nr;
  }
  const qty = Q.map((q) => q.reduce((s, v, i) => s + v * yy[i], 0));
  const beta = Array(p).fill(0);
  for (let j = p - 1; j >= 0; j--) { let s = qty[j]; for (let k = j + 1; k < p; k++) s -= R[j][k] * beta[k]; beta[j] = s / R[j][j]; }
  return beta;
}

/** Chebyshev basis T0..Tdeg at u ∈ [-1, 1] (well conditioned, unlike raw powers). */
export function cheb(u: number, deg: number): number[] {
  const t = [1, u]; for (let k = 2; k <= deg; k++) t.push(2 * u * t[k - 1] - t[k - 2]);
  return t.slice(0, deg + 1);
}
/** Fit a degree-`deg` polynomial on [lo, hi] and return it as a function. Same curve as fitting raw powers, just computed stably. */
export function polyFit(xs: number[], ys: number[], deg: number, lo: number, hi: number, ridge = 1e-9) {
  const u = (x: number) => (2 * (x - lo)) / (hi - lo) - 1;
  const beta = qrLstsq(xs.map((x) => cheb(u(x), deg)), ys, ridge);
  return (x: number) => cheb(u(x), deg).reduce((s, v, i) => s + v * beta[i], 0);
}

/** Standardise columns: returns z-scored columns plus their means and SDs. */
export function standardize(cols: number[][]) {
  const mu = cols.map(mean), s = cols.map((c) => sd(c) || 1);
  return { Z: cols.map((c, j) => c.map((v) => (v - mu[j]) / s[j])), mu, s };
}

/** Ridge on standardised features (columns), centred y: minimises (1/2n)‖y − Zβ‖² + (λ/2)‖β‖². */
export function ridgeFit(Z: number[][], y: number[], lam: number): number[] {
  const p = Z.length, n = y.length;
  const A = Array.from({ length: p }, (_, j) => Array.from({ length: p }, (_, k) => Z[j].reduce((s, v, i) => s + v * Z[k][i], 0) / n + (j === k ? lam : 0)));
  const b = Z.map((c) => c.reduce((s, v, i) => s + v * y[i], 0) / n);
  return solve(A, b);
}
const soft = (z: number, g: number) => (z > g ? z - g : z < -g ? z + g : 0);
/** Lasso (with optional elastic-net mix α: 1 = lasso) by coordinate descent: (1/2n)‖y − Zβ‖² + λ(α‖β‖₁ + (1−α)/2‖β‖²). */
export function lassoFit(Z: number[][], y: number[], lam: number, alpha = 1, init?: number[], iters = 300): number[] {
  const p = Z.length, n = y.length, beta = init ? [...init] : Array(p).fill(0);
  const ss = Z.map((c) => c.reduce((s, v) => s + v * v, 0) / n);
  const r = y.map((v, i) => v - Z.reduce((s, c, j) => s + c[i] * beta[j], 0));
  for (let it = 0; it < iters; it++) {
    let maxd = 0;
    for (let j = 0; j < p; j++) {
      let rho = 0; for (let i = 0; i < n; i++) rho += Z[j][i] * (r[i] + Z[j][i] * beta[j]); rho /= n;
      const nb = soft(rho, lam * alpha) / (ss[j] + lam * (1 - alpha));
      const d = nb - beta[j];
      if (d) { for (let i = 0; i < n; i++) r[i] -= Z[j][i] * d; beta[j] = nb; maxd = Math.max(maxd, Math.abs(d)); }
    }
    if (maxd < 1e-7) break;
  }
  return beta;
}

/** log(k!) for small k, for Poisson likelihoods. */
export function logFact(k: number) { let s = 0; for (let i = 2; i <= k; i++) s += Math.log(i); return s; }
export const poissonPmf = (k: number, lam: number) => Math.exp(k * Math.log(Math.max(lam, 1e-12)) - lam - logFact(k));
/** Poisson draw by inversion (fine for rates below ~60). */
export function poissonDraw(lam: number, r: () => number) {
  const u = r(); let k = 0, p = Math.exp(-lam), c = p;
  while (u > c && k < 2000) { k++; p *= lam / k; c += p; }
  return k;
}
