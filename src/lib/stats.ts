/**
 * stats.ts: a small, dependency-free regression statistics engine.
 *
 * Everything the Linear Regression guide shows live (coefficients, standard errors, t/F tests,
 * diagnostics, influence measures, VIF, information criteria, intervals) is computed here, in the
 * browser, so the widgets react instantly. Every function is checked against statsmodels / scipy by
 * scripts/verify-stats (see docs/SPEC.md §10).
 *
 * Conventions: X is n × k and INCLUDES the intercept column of 1s when the model has one.
 */

export type Vec = number[];
export type Mat = number[][];

/* ============================== linear algebra ============================== */

export const transpose = (A: Mat): Mat => A[0].map((_, j) => A.map((r) => r[j]));
export function matmul(A: Mat, B: Mat): Mat {
  const n = A.length, m = B[0].length, k = B.length;
  const C: Mat = Array.from({ length: n }, () => new Array(m).fill(0));
  for (let i = 0; i < n; i++) for (let t = 0; t < k; t++) {
    const a = A[i][t]; if (a === 0) continue;
    const Bt = B[t];
    for (let j = 0; j < m; j++) C[i][j] += a * Bt[j];
  }
  return C;
}
export const matvec = (A: Mat, v: Vec): Vec => A.map((r) => r.reduce((s, a, j) => s + a * v[j], 0));
export const dot = (a: Vec, b: Vec) => a.reduce((s, v, i) => s + v * b[i], 0);
export const sum = (a: Vec) => a.reduce((s, v) => s + v, 0);
export const mean = (a: Vec) => sum(a) / a.length;

/** X'X and X'y without materialising X'. */
export function gram(X: Mat): Mat {
  const k = X[0].length;
  const G: Mat = Array.from({ length: k }, () => new Array(k).fill(0));
  for (const r of X) for (let i = 0; i < k; i++) { const ri = r[i]; for (let j = i; j < k; j++) G[i][j] += ri * r[j]; }
  for (let i = 0; i < k; i++) for (let j = 0; j < i; j++) G[i][j] = G[j][i];
  return G;
}
export const xty = (X: Mat, y: Vec): Vec => X[0].map((_, j) => X.reduce((s, r, i) => s + r[j] * y[i], 0));

/**
 * Matrix inverse. Matrices with a positive diagonal (like X'X) are first equilibrated,
 * A⁻¹ = S (S A S)⁻¹ S with S = diag(1/√aᵢᵢ), so badly scaled columns (TV² next to an intercept)
 * don't trip the singularity check. Throws on a (numerically) singular matrix.
 */
export function inverse(A: Mat): Mat {
  if (A.every((r, i) => r[i] > 0)) {
    const s = A.map((r, i) => 1 / Math.sqrt(r[i]));
    const B = gaussJordan(A.map((r, i) => r.map((v, j) => v * s[i] * s[j])));
    return B.map((r, i) => r.map((v, j) => v * s[i] * s[j]));
  }
  return gaussJordan(A);
}

/** Gauss–Jordan inverse with partial pivoting. */
function gaussJordan(A: Mat): Mat {
  const n = A.length;
  const M = A.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  const scale = Math.max(...A.map((r) => Math.max(...r.map(Math.abs)))) || 1;
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-12 * scale) throw new Error('singular matrix (perfect multicollinearity)');
    [M[c], M[p]] = [M[p], M[c]];
    const piv = M[c][c];
    for (let j = 0; j < 2 * n; j++) M[c][j] /= piv;
    for (let r = 0; r < n; r++) if (r !== c) {
      const f = M[r][c]; if (f === 0) continue;
      for (let j = 0; j < 2 * n; j++) M[r][j] -= f * M[c][j];
    }
  }
  return M.map((r) => r.slice(n));
}

/** Eigenvalues of a symmetric matrix (cyclic Jacobi). Returned in descending order. */
export function symEigenvalues(S: Mat): Vec {
  const n = S.length, A = S.map((r) => [...r]);
  for (let sweep = 0; sweep < 100; sweep++) {
    let off = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += A[i][j] ** 2;
    if (off < 1e-22) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(A[p][q]) < 1e-300) continue;
      const theta = (A[q][q] - A[p][p]) / (2 * A[p][q]);
      const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
      const c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) {
        const akp = A[k][p], akq = A[k][q];
        A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq;
      }
      for (let k = 0; k < n; k++) {
        const apk = A[p][k], aqk = A[q][k];
        A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk;
      }
    }
  }
  return A.map((r, i) => r[i]).sort((a, b) => b - a);
}

/* ============================== distributions ============================== */

const LANCZOS = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
  12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
export function lgamma(x: number): number {
  if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
  x -= 1;
  let a = 0.99999999999980993;
  const t = x + 7.5;
  for (let i = 0; i < 8; i++) a += LANCZOS[i] / (x + i + 1);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

function betacf(a: number, b: number, x: number): number {
  const FPMIN = 1e-300;
  let c = 1, d = 1 - ((a + b) * x) / (a + 1);
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d; let h = d;
  for (let m = 1; m <= 300; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((a - 1 + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; h *= d * c;
    aa = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + 1 + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c; h *= del;
    if (Math.abs(del - 1) < 3e-16) break;
  }
  return h;
}
/** Regularised incomplete beta I_x(a, b). */
export function ibeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
}
/** Regularised lower incomplete gamma P(a, x). */
export function igamma(a: number, x: number): number {
  if (x <= 0) return 0;
  const gln = lgamma(a);
  if (x < a + 1) {
    let ap = a, s = 1 / a, del = s;
    for (let n = 0; n < 1000; n++) { ap += 1; del *= x / ap; s += del; if (Math.abs(del) < Math.abs(s) * 1e-16) break; }
    return s * Math.exp(-x + a * Math.log(x) - gln);
  }
  let b = x + 1 - a, c = 1e300, d = 1 / b, h = d;
  for (let i = 1; i < 1000; i++) {
    const an = -i * (i - a); b += 2;
    d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300;
    c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
    d = 1 / d; const del = d * c; h *= del;
    if (Math.abs(del - 1) < 1e-16) break;
  }
  return 1 - Math.exp(-x + a * Math.log(x) - gln) * h;
}

export function erf(x: number): number {
  // High-precision erf via the incomplete gamma function.
  const v = igamma(0.5, x * x);
  return x >= 0 ? v : -v;
}
export const normCdf = (z: number) => (z < -8 ? 0 : z > 8 ? 1 : 0.5 * (1 + erf(z / Math.SQRT2)));
export const normPdf = (z: number) => Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);

/** Inverse standard normal CDF (Acklam, refined with one Halley step: ~1e-15). */
export function normQuantile(p: number): number {
  if (p <= 0) return -Infinity; if (p >= 1) return Infinity;
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425;
  let x: number;
  if (p < pl) { const q = Math.sqrt(-2 * Math.log(p)); x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  else if (p <= 1 - pl) { const q = p - 0.5, r = q * q; x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
  else { const q = Math.sqrt(-2 * Math.log(1 - p)); x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  const e = normCdf(x) - p, u = e * Math.sqrt(2 * Math.PI) * Math.exp((x * x) / 2);
  return x - u / (1 + (x * u) / 2);
}

export function tCdf(t: number, df: number): number {
  const x = df / (df + t * t);
  const tail = 0.5 * ibeta(x, df / 2, 0.5);
  return t > 0 ? 1 - tail : tail;
}
/** Two-sided p-value for a t statistic. */
export const tPvalue = (t: number, df: number) => ibeta(df / (df + t * t), df / 2, 0.5);
export function tQuantile(p: number, df: number): number {
  // Bisection on a monotone CDF, started from the normal quantile.
  let lo = -1e3, hi = 1e3;
  for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (tCdf(mid, df) < p) lo = mid; else hi = mid; if (hi - lo < 1e-12) break; }
  return (lo + hi) / 2;
}
/** Upper-tail p-value of F(d1, d2). */
export const fPvalue = (f: number, d1: number, d2: number) => (f <= 0 ? 1 : ibeta(d2 / (d2 + d1 * f), d2 / 2, d1 / 2));
/** Upper-tail p-value of χ²(df). */
export const chi2Pvalue = (x: number, df: number) => (x <= 0 ? 1 : 1 - igamma(df / 2, x / 2));

/* ============================== OLS ============================== */

export interface OLSResult {
  n: number; k: number; dfResid: number; dfModel: number;
  beta: Vec; se: Vec; t: Vec; p: Vec; ciLow: Vec; ciHigh: Vec;
  fitted: Vec; resid: Vec; ssr: number; sst: number; ess: number;
  sigma2: number; sigma: number; r2: number; adjR2: number;
  F: number; Fp: number; llf: number; aic: number; bic: number;
  XtXinv: Mat; hasConst: boolean; names: string[];
}

export const addConst = (cols: Vec[]): Mat => cols[0].map((_, i) => [1, ...cols.map((c) => c[i])]);

/** Ordinary least squares. X should include a column of 1s for the intercept. */
export function ols(X: Mat, y: Vec, names?: string[], alpha = 0.05): OLSResult {
  const n = X.length, k = X[0].length;
  const XtXinv = inverse(gram(X));
  const beta = matvec(XtXinv, xty(X, y));
  const fitted = X.map((r) => dot(r, beta));
  const resid = y.map((v, i) => v - fitted[i]);
  const ssr = dot(resid, resid);
  const hasConst = X.every((r) => r[0] === 1);
  const ybar = mean(y);
  const sst = hasConst ? y.reduce((s, v) => s + (v - ybar) ** 2, 0) : dot(y, y);
  const dfResid = n - k, dfModel = k - (hasConst ? 1 : 0);
  const sigma2 = ssr / dfResid;
  const se = XtXinv.map((r, i) => Math.sqrt(sigma2 * r[i]));
  const t = beta.map((b, i) => b / se[i]);
  const p = t.map((v) => tPvalue(v, dfResid));
  const tc = tQuantile(1 - alpha / 2, dfResid);
  const r2 = 1 - ssr / sst;
  const adjR2 = 1 - ((1 - r2) * (n - (hasConst ? 1 : 0))) / dfResid;
  const ess = sst - ssr;
  const F = dfModel > 0 ? (ess / dfModel) / sigma2 : NaN;
  const llf = (-n / 2) * (Math.log(2 * Math.PI) + Math.log(ssr / n) + 1);
  return {
    n, k, dfResid, dfModel, beta, se, t, p,
    ciLow: beta.map((b, i) => b - tc * se[i]), ciHigh: beta.map((b, i) => b + tc * se[i]),
    fitted, resid, ssr, sst, ess, sigma2, sigma: Math.sqrt(sigma2), r2, adjR2,
    F, Fp: dfModel > 0 ? fPvalue(F, dfModel, dfResid) : NaN,
    llf, aic: -2 * llf + 2 * k, bic: -2 * llf + k * Math.log(n),
    XtXinv, hasConst, names: names ?? X[0].map((_, j) => (j === 0 && hasConst ? 'const' : `x${j}`)),
  };
}

/** Simple regression convenience: y on one x (with intercept). */
export const ols1 = (x: Vec, y: Vec) => ols(addConst([x]), y, ['const', 'x']);

/** Weighted least squares: minimise Σ wᵢ eᵢ². */
export function wls(X: Mat, y: Vec, w: Vec, names?: string[]) {
  const sw = w.map(Math.sqrt);
  return ols(X.map((r, i) => r.map((v) => v * sw[i])), y.map((v, i) => v * sw[i]), names);
}

/** Heteroscedasticity-consistent standard errors (HC0, HC1, HC3). */
export function robustSE(X: Mat, res: OLSResult, type: 'HC0' | 'HC1' | 'HC3' = 'HC3'): Vec {
  const h = hatValues(X, res.XtXinv);
  const k = X[0].length;
  const meat: Mat = Array.from({ length: k }, () => new Array(k).fill(0));
  X.forEach((r, i) => {
    let w = res.resid[i] ** 2;
    if (type === 'HC3') w /= (1 - h[i]) ** 2;
    for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) meat[a][b] += w * r[a] * r[b];
  });
  const cov = matmul(matmul(res.XtXinv, meat), res.XtXinv);
  const adj = type === 'HC1' ? res.n / res.dfResid : 1;
  return cov.map((r, i) => Math.sqrt(r[i] * adj));
}

/** Confidence interval for the mean response and prediction interval for a new observation at x0. */
export function intervals(res: OLSResult, x0: Vec, alpha = 0.05) {
  const yhat = dot(x0, res.beta);
  const q = dot(x0, matvec(res.XtXinv, x0));
  const tc = tQuantile(1 - alpha / 2, res.dfResid);
  const seMean = res.sigma * Math.sqrt(q), sePred = res.sigma * Math.sqrt(1 + q);
  return { yhat, seMean, sePred, ci: [yhat - tc * seMean, yhat + tc * seMean], pi: [yhat - tc * sePred, yhat + tc * sePred] };
}

/** Partial F-test: does the full model beat the nested (restricted) one? */
export function nestedF(restricted: OLSResult, full: OLSResult) {
  const q = full.k - restricted.k;
  const F = ((restricted.ssr - full.ssr) / q) / (full.ssr / full.dfResid);
  return { F, df1: q, df2: full.dfResid, p: fPvalue(F, q, full.dfResid) };
}

/** Mallows' Cp of a sub-model, using σ² from the full model. */
export const mallowsCp = (sub: OLSResult, full: OLSResult) => sub.ssr / full.sigma2 - sub.n + 2 * sub.k;

/* ============================== influence ============================== */

export const hatValues = (X: Mat, XtXinv: Mat): Vec => X.map((r) => dot(r, matvec(XtXinv, r)));

export function influence(X: Mat, res: OLSResult) {
  const h = hatValues(X, res.XtXinv);
  const { n, k, sigma } = res;
  const stud = res.resid.map((e, i) => e / (sigma * Math.sqrt(1 - h[i])));            // internally studentized
  const ext = stud.map((r) => r * Math.sqrt((n - k - 1) / (n - k - r * r)));        // externally studentized
  const cooks = stud.map((r, i) => (r * r * h[i]) / (k * (1 - h[i])));
  const dffits = ext.map((t, i) => t * Math.sqrt(h[i] / (1 - h[i])));
  return {
    h, stud, ext, cooks, dffits,
    thresholds: { leverage: (2 * k) / n, cooks: 4 / n, dffits: 2 * Math.sqrt(k / n), stud: 3 },
  };
}

/* ============================== multicollinearity ============================== */

/** VIF for every non-constant column of X (X includes the constant in column 0). */
export function vif(X: Mat): Vec {
  const k = X[0].length;
  const out: Vec = [];
  for (let j = 1; j < k; j++) {
    const yj = X.map((r) => r[j]);
    const Xo = X.map((r) => r.filter((_, c) => c !== j));
    const r2 = ols(Xo, yj).r2;
    out.push(1 / (1 - r2));
  }
  return out;
}
/** Condition number of X (as statsmodels reports it): sqrt(λmax / λmin) of X'X. */
export function conditionNumber(X: Mat): number {
  const ev = symEigenvalues(gram(X));
  return Math.sqrt(ev[0] / ev[ev.length - 1]);
}
export function corr(a: Vec, b: Vec): number {
  const ma = mean(a), mb = mean(b);
  let sab = 0, saa = 0, sbb = 0;
  for (let i = 0; i < a.length; i++) { const da = a[i] - ma, db = b[i] - mb; sab += da * db; saa += da * da; sbb += db * db; }
  return sab / Math.sqrt(saa * sbb);
}

/* ============================== assumption tests ============================== */

export interface TestResult { stat: number; p: number; df?: number | [number, number]; extra?: Record<string, number> }

/** Breusch–Pagan (Koenker's studentised version, statsmodels default): n·R² of e² on X. */
export function breuschPagan(X: Mat, res: OLSResult): TestResult {
  const aux = ols(X, res.resid.map((e) => e * e));
  const stat = res.n * aux.r2, df = X[0].length - 1;
  return { stat, df, p: chi2Pvalue(stat, df), extra: { F: aux.F, Fp: aux.Fp } };
}

/** White's test: n·R² of e² on X, squares and cross-products. */
export function white(X: Mat, res: OLSResult): TestResult {
  const k = X[0].length;
  const cols: Vec[] = [];
  const keys = new Set<string>();
  const push = (c: Vec) => {
    const key = c.map((v) => v.toPrecision(10)).join(',');
    if (keys.has(key) || c.every((v) => v === c[0])) return;
    keys.add(key); cols.push(c);
  };
  for (let a = 1; a < k; a++) push(X.map((r) => r[a]));
  for (let a = 1; a < k; a++) for (let b = a; b < k; b++) push(X.map((r) => r[a] * r[b]));
  const aux = ols(addConst(cols), res.resid.map((e) => e * e));
  const stat = res.n * aux.r2, df = cols.length;
  return { stat, df, p: chi2Pvalue(stat, df) };
}

export function durbinWatson(e: Vec): number {
  let num = 0;
  for (let i = 1; i < e.length; i++) num += (e[i] - e[i - 1]) ** 2;
  return num / dot(e, e);
}

export function skewKurt(e: Vec) {
  const n = e.length, m = mean(e);
  let m2 = 0, m3 = 0, m4 = 0;
  for (const v of e) { const d = v - m; m2 += d * d; m3 += d ** 3; m4 += d ** 4; }
  m2 /= n; m3 /= n; m4 /= n;
  return { skew: m3 / m2 ** 1.5, kurtosis: m4 / (m2 * m2) };
}

export function jarqueBera(e: Vec): TestResult {
  const { skew, kurtosis } = skewKurt(e);
  const stat = (e.length / 6) * (skew * skew + ((kurtosis - 3) ** 2) / 4);
  return { stat, df: 2, p: chi2Pvalue(stat, 2), extra: { skew, kurtosis } };
}

/** Shapiro–Wilk W test, Royston (1995) algorithm AS R94, valid for 3 ≤ n ≤ 5000. */
export function shapiroWilk(data: Vec): TestResult {
  const x = [...data].sort((a, b) => a - b);
  const n = x.length;
  if (n < 3) return { stat: NaN, p: NaN };
  const poly = (c: number[], v: number) => c.reduceRight((acc, ci) => acc * v + ci, 0);
  const nn2 = Math.floor(n / 2);
  const a = new Array(nn2 + 1).fill(0); // 1-based
  if (n === 3) a[1] = Math.SQRT1_2;
  else {
    const m: Vec = [0];
    let summ2 = 0;
    for (let i = 1; i <= nn2; i++) { m[i] = normQuantile((i - 0.375) / (n + 0.25)); summ2 += m[i] * m[i]; }
    summ2 *= 2;
    const ssumm2 = Math.sqrt(summ2), rsn = 1 / Math.sqrt(n);
    const a1 = poly([0, 0.221157, -0.147981, -2.07119, 4.434685, -2.706056], rsn) - m[1] / ssumm2;
    let i1: number, fac: number;
    if (n > 5) {
      i1 = 3;
      const a2 = -m[2] / ssumm2 + poly([0, 0.042981, -0.293762, -1.752461, 5.682633, -3.582633], rsn);
      fac = Math.sqrt((summ2 - 2 * m[1] ** 2 - 2 * m[2] ** 2) / (1 - 2 * a1 ** 2 - 2 * a2 ** 2));
      a[2] = a2;
    } else {
      i1 = 2;
      fac = Math.sqrt((summ2 - 2 * m[1] ** 2) / (1 - 2 * a1 ** 2));
    }
    a[1] = a1;
    for (let i = i1; i <= nn2; i++) a[i] = -m[i] / fac;
  }
  let num = 0;
  for (let i = 1; i <= nn2; i++) num += a[i] * (x[n - i] - x[i - 1]);
  const xm = mean(x);
  const W = Math.min(1, (num * num) / x.reduce((s, v) => s + (v - xm) ** 2, 0));
  let p: number;
  if (n === 3) {
    p = Math.max(0, (6 / Math.PI) * (Math.asin(Math.sqrt(W)) - Math.PI / 3));
  } else {
    const w1 = Math.log(1 - W);
    let y: number, mu: number, sd: number;
    if (n <= 11) {
      const gamma = poly([-2.273, 0.459], n);
      if (w1 >= gamma) return { stat: W, p: 1e-99 };
      y = -Math.log(gamma - w1);
      mu = poly([0.544, -0.39978, 0.025054, -6.714e-4], n);
      sd = Math.exp(poly([1.3822, -0.77857, 0.062767, -0.0020322], n));
    } else {
      const ln = Math.log(n);
      y = w1;
      mu = poly([-1.5861, -0.31082, -0.083751, 0.0038915], ln);
      sd = Math.exp(poly([-0.4803, -0.082676, 0.0030302], ln));
    }
    p = 1 - normCdf((y - mu) / sd);
  }
  return { stat: W, p };
}

/** Ramsey RESET (F version): add ŷ², …, ŷ^power and test them jointly. */
export function reset(X: Mat, y: Vec, res: OLSResult, power = 3): TestResult {
  // Scale ŷ before powering for numerical stability (does not change the test).
  const s = Math.max(...res.fitted.map(Math.abs)) || 1;
  const Xa = X.map((r, i) => { const f = res.fitted[i] / s; const extra: number[] = []; for (let p = 2; p <= power; p++) extra.push(f ** p); return [...r, ...extra]; });
  const nf = nestedF(res, ols(Xa, y));
  return { stat: nf.F, df: [nf.df1, nf.df2], p: nf.p };
}

/** Utts' Rainbow test: refit on the central `frac` of observations (smallest leverage). */
export function rainbow(X: Mat, y: Vec, res: OLSResult, frac = 0.5): TestResult {
  const h = hatValues(X, res.XtXinv);
  const idx = h.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]).slice(0, Math.floor(frac * res.n)).map((d) => d[1]);
  const sub = ols(idx.map((i) => X[i]), idx.map((i) => y[i]));
  const d1 = res.n - sub.n, d2 = sub.dfResid;
  const F = ((res.ssr - sub.ssr) / d1) / (sub.ssr / d2);
  return { stat: F, df: [d1, d2], p: fPvalue(F, d1, d2) };
}

/** Normal Q-Q coordinates: theoretical quantiles vs sorted standardised residuals. */
export function qq(e: Vec) {
  const n = e.length, m = mean(e);
  const s = Math.sqrt(e.reduce((acc, v) => acc + (v - m) ** 2, 0) / (n - 1));
  const sorted = e.map((v) => (v - m) / s).sort((a, b) => a - b);
  return sorted.map((v, i) => ({ theo: normQuantile((i + 1 - 0.375) / (n + 0.25)), obs: v }));
}

/* ============================== transformations ============================== */

export const boxcoxTransform = (y: Vec, lam: number) => y.map((v) => (Math.abs(lam) < 1e-10 ? Math.log(v) : (v ** lam - 1) / lam));
export function boxcoxLLF(y: Vec, lam: number) {
  const z = boxcoxTransform(y, lam), n = y.length, mz = mean(z);
  const v = z.reduce((s, q) => s + (q - mz) ** 2, 0) / n;
  return (-n / 2) * Math.log(v) + (lam - 1) * sum(y.map(Math.log));
}
/** Maximum-likelihood Box–Cox λ (golden-section search on [-3, 3]). */
export function boxcoxLambda(y: Vec): number {
  let a = -3, b = 3;
  const g = (Math.sqrt(5) - 1) / 2;
  let c = b - g * (b - a), d = a + g * (b - a);
  for (let i = 0; i < 200; i++) {
    if (boxcoxLLF(y, c) > boxcoxLLF(y, d)) b = d; else a = c;
    c = b - g * (b - a); d = a + g * (b - a);
    if (b - a < 1e-10) break;
  }
  return (a + b) / 2;
}

/* ============================== formatting helpers ============================== */

export const fmtP = (p: number) => (!isFinite(p) ? '—' : p < 1e-4 ? '<0.0001' : p.toFixed(4));
export const stars = (p: number) => (p < 0.001 ? '***' : p < 0.01 ? '**' : p < 0.05 ? '*' : p < 0.1 ? '.' : '');

/* ============================== regularisation & validation ============================== */

/** Standardise columns (population sd, as scikit-learn's StandardScaler). Returns Z plus the scaling used. */
export function standardize(cols: Vec[]) {
  const mu = cols.map(mean);
  const sd = cols.map((c, j) => Math.sqrt(c.reduce((s, v) => s + (v - mu[j]) ** 2, 0) / c.length) || 1);
  const Z: Mat = cols[0].map((_, i) => cols.map((c, j) => (c[i] - mu[j]) / sd[j]));
  return { Z, mu, sd };
}

/** Ridge on (already standardised) Z with unpenalised intercept: min ||y − b0 − Zb||² + α||b||² (sklearn `Ridge`). */
export function ridge(Z: Mat, y: Vec, alpha: number) {
  const k = Z[0].length, ym = mean(y);
  const zm = Z[0].map((_, j) => mean(Z.map((r) => r[j])));
  const Zc = Z.map((r) => r.map((v, j) => v - zm[j]));
  const G = gram(Zc);
  for (let j = 0; j < k; j++) G[j][j] += alpha;
  const b = matvec(inverse(G), xty(Zc, y.map((v) => v - ym)));
  return { intercept: ym - dot(zm, b), coef: b };
}

/**
 * Elastic Net by cyclic coordinate descent, sklearn's objective:
 *   (1/2n)||y − b0 − Zb||² + α·l1·||b||₁ + α(1−l1)/2·||b||²     (l1 = 1 → Lasso)
 */
export function elasticNet(Z: Mat, y: Vec, alpha: number, l1 = 1, iters = 5000, tol = 1e-10, warm?: Vec) {
  const n = Z.length, k = Z[0].length, ym = mean(y);
  const zm = Z[0].map((_, j) => mean(Z.map((r) => r[j])));
  const Zc = Z.map((r) => r.map((v, j) => v - zm[j]));
  const zz = Zc[0].map((_, j) => Zc.reduce((s, r) => s + r[j] * r[j], 0) / n);
  const b = warm ? [...warm] : new Array(k).fill(0);
  const res = y.map((v, i) => v - ym - dot(Zc[i], b));
  const soft = (v: number, g: number) => (v > g ? v - g : v < -g ? v + g : 0);
  for (let it = 0; it < iters; it++) {
    let maxd = 0;
    for (let j = 0; j < k; j++) {
      let rho = 0;
      for (let i = 0; i < n; i++) rho += Zc[i][j] * (res[i] + Zc[i][j] * b[j]);
      rho /= n;
      const nb = soft(rho, alpha * l1) / (zz[j] + alpha * (1 - l1));
      const d = nb - b[j];
      if (d !== 0) { for (let i = 0; i < n; i++) res[i] -= Zc[i][j] * d; b[j] = nb; }
      maxd = Math.max(maxd, Math.abs(d));
    }
    if (maxd < tol) break;
  }
  return { intercept: ym - dot(zm, b), coef: b };
}

/** Deterministic k-fold indices (seeded shuffle). */
export function kfold(n: number, k: number, seed = 1): number[][] {
  let a = seed >>> 0;
  const r = () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; };
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return Array.from({ length: k }, (_, f) => idx.filter((_, i) => i % k === f));
}

/** k-fold cross-validated RMSE and R² for an arbitrary fit/predict pair. */
export function crossVal(X: Mat, y: Vec, k: number, fit: (X: Mat, y: Vec) => (x: Vec) => number, seed = 1) {
  const folds = kfold(X.length, k, seed);
  const rm: number[] = [], r2s: number[] = [];
  for (const test of folds) {
    const ts = new Set(test);
    const tr = X.map((_, i) => i).filter((i) => !ts.has(i));
    const pred = fit(tr.map((i) => X[i]), tr.map((i) => y[i]));
    const yt = test.map((i) => y[i]), yp = test.map((i) => pred(X[i]));
    const sse = yt.reduce((s, v, i) => s + (v - yp[i]) ** 2, 0), m = mean(yt);
    rm.push(Math.sqrt(sse / yt.length));
    r2s.push(1 - sse / yt.reduce((s, v) => s + (v - m) ** 2, 0));
  }
  return { rmse: mean(rm), r2: mean(r2s), foldRmse: rm };
}

export const olsFit = (X: Mat, y: Vec) => { const b = matvec(inverse(gram(X)), xty(X, y)); return (x: Vec) => dot(x, b); };

export function regMetrics(y: Vec, yhat: Vec) {
  const n = y.length, m = mean(y);
  const e = y.map((v, i) => v - yhat[i]);
  const sse = dot(e, e);
  return {
    rmse: Math.sqrt(sse / n), mae: mean(e.map(Math.abs)),
    mape: 100 * mean(e.map((v, i) => Math.abs(v / y[i]))), r2: 1 - sse / y.reduce((s, v) => s + (v - m) ** 2, 0),
  };
}

/** LOWESS smoother (local linear, tricube weights, no robustness passes); returns points sorted by x. */
export function lowess(x: Vec, y: Vec, frac = 2 / 3, grid = 40) {
  const pts = x.map((v, i) => [v, y[i]]).sort((a, b) => a[0] - b[0]);
  const n = pts.length, r = Math.max(3, Math.ceil(frac * n));
  const lo = pts[0][0], hi = pts[n - 1][0];
  const out: { x: number; y: number }[] = [];
  for (let g = 0; g < grid; g++) {
    const x0 = lo + ((hi - lo) * g) / (grid - 1);
    const d = pts.map((p) => Math.abs(p[0] - x0)).sort((a, b) => a - b);
    const hmax = d[Math.min(r, n) - 1] || 1e-9;
    let sw = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (const [xi, yi] of pts) {
      const u = Math.abs(xi - x0) / hmax; if (u >= 1) continue;
      const w = (1 - u ** 3) ** 3;
      sw += w; sx += w * xi; sy += w * yi; sxx += w * xi * xi; sxy += w * xi * yi;
    }
    const den = sw * sxx - sx * sx;
    const b = Math.abs(den) < 1e-12 ? 0 : (sw * sxy - sx * sy) / den;
    out.push({ x: x0, y: (sy - b * sx) / sw + b * x0 });
  }
  return out;
}
