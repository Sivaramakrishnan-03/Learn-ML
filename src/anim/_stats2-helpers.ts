// Shared numeric helpers for the Statistics part 2 animations (chi-square, anova, correlation, bootstrap, ab-testing, bayes-theorem, mle).
// Pure functions only; all randomness goes through the seeded rng from the kit.

export const sum = (a: number[]) => a.reduce((s, v) => s + v, 0);
export const mean = (a: number[]) => (a.length ? sum(a) / a.length : 0);
/** Sample SD (n − 1). */
export const sdS = (a: number[]) => { if (a.length < 2) return 0; const m = mean(a); return Math.sqrt(sum(a.map((v) => (v - m) ** 2)) / (a.length - 1)); };
export const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
/** Percentile with linear interpolation (numpy default). */
export function quantile(sorted: number[], q: number) {
  if (!sorted.length) return 0;
  const h = (sorted.length - 1) * q, lo = Math.floor(h), hi = Math.ceil(h);
  return sorted[lo] + (h - lo) * (sorted[hi] - sorted[lo]);
}
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/* ---------- special functions ---------- */
const LG = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
export function lgamma(x: number): number {
  if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
  x -= 1; let a = 0.99999999999980993; const t = x + 7.5;
  for (let i = 0; i < 8; i++) a += LG[i] / (x + i + 1);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}
/** Regularised lower incomplete gamma P(a, x). */
export function gammaP(a: number, x: number): number {
  if (x <= 0) return 0;
  if (x < a + 1) { let s = 1 / a, t = s; for (let n = 1; n < 500; n++) { t *= x / (a + n); s += t; if (Math.abs(t) < 1e-14 * Math.abs(s)) break; } return s * Math.exp(-x + a * Math.log(x) - lgamma(a)); }
  // continued fraction for Q
  let b = x + 1 - a, c = 1e300, d = 1 / b, h = d;
  for (let i = 1; i < 500; i++) { const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300; c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-14) break; }
  return 1 - Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
}
/** Regularised incomplete beta I_x(a, b). */
export function betaI(x: number, a: number, b: number): number {
  if (x <= 0) return 0; if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  const cf = (x: number, a: number, b: number) => {
    let c = 1, d = 1 - ((a + b) * x) / (a + 1); if (Math.abs(d) < 1e-300) d = 1e-300; d = 1 / d; let h = d;
    for (let m = 1; m < 300; m++) {
      const m2 = 2 * m; let aa = (m * (b - m) * x) / ((a + m2 - 1) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300; c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; h *= d * c;
      aa = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + m2 + 1));
      d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300; c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; h *= del;
      if (Math.abs(del - 1) < 1e-13) break;
    }
    return h;
  };
  return x < (a + 1) / (a + b + 2) ? (bt * cf(x, a, b)) / a : 1 - (bt * cf(1 - x, b, a)) / b;
}

/* ---------- distributions ---------- */
export const chi2pdf = (k: number) => (x: number) => (x <= 0 ? (k === 2 ? 0.5 : 0) : Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.log(2) - lgamma(k / 2)));
export const chi2sf = (x: number, k: number) => 1 - gammaP(k / 2, x / 2);
/** Upper-tail critical value by bisection. */
export function chi2crit(alpha: number, k: number) { let lo = 0, hi = 200; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (chi2sf(m, k) > alpha) lo = m; else hi = m; } return (lo + hi) / 2; }
export const fpdf = (d1: number, d2: number) => (x: number) => (x <= 0 ? 0 : Math.exp(0.5 * (d1 * Math.log(d1 * x) + d2 * Math.log(d2) - (d1 + d2) * Math.log(d1 * x + d2)) - Math.log(x) - (lgamma(d1 / 2) + lgamma(d2 / 2) - lgamma((d1 + d2) / 2))));
export const fsf = (x: number, d1: number, d2: number) => (x <= 0 ? 1 : 1 - betaI((d1 * x) / (d1 * x + d2), d1 / 2, d2 / 2));
export function fcrit(alpha: number, d1: number, d2: number) { let lo = 0, hi = 100; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (fsf(m, d1, d2) > alpha) lo = m; else hi = m; } return (lo + hi) / 2; }
export const normpdf = (m: number, s: number) => (x: number) => Math.exp(-((x - m) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));
export function erf(x: number) { // Abramowitz–Stegun 7.1.26 (|err| < 1.5e-7)
  const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
}
export const normcdf = (z: number) => 0.5 * (1 + erf(z / Math.SQRT2));
export const twoSidedP = (z: number) => 2 * (1 - normcdf(Math.abs(z)));

/* ---------- small data helpers ---------- */
/** Counts in equal-width bins (raw counts, not density). */
export function histCounts(values: number[], lo: number, hi: number, bins: number) {
  const w = (hi - lo) / bins, c = Array(bins).fill(0);
  values.forEach((v) => { const i = Math.floor((v - lo) / w); if (i >= 0 && i < bins) c[i]++; else if (v === hi) c[bins - 1]++; });
  return c.map((k, i) => ({ x: lo + (i + 0.5) * w, y: k }));
}
export function pearson(xs: number[], ys: number[]) {
  const mx = mean(xs), my = mean(ys); let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < xs.length; i++) { const a = xs[i] - mx, b = ys[i] - my; sxy += a * b; sxx += a * a; syy += b * b; }
  return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : 0;
}
export function ranks(a: number[]) {
  const idx = a.map((v, i) => [v, i] as [number, number]).sort((p, q) => p[0] - q[0]);
  const r = Array(a.length).fill(0);
  for (let i = 0; i < idx.length;) { let j = i; while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++; const avg = (i + j) / 2 + 1; for (let k = i; k <= j; k++) r[idx[k][1]] = avg; i = j + 1; }
  return r;
}
export const spearman = (xs: number[], ys: number[]) => pearson(ranks(xs), ranks(ys));
/** Least-squares line. */
export function ols(xs: number[], ys: number[]) {
  const mx = mean(xs), my = mean(ys); let sxy = 0, sxx = 0;
  for (let i = 0; i < xs.length; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
  const b = sxx > 0 ? sxy / sxx : 0; return { a: my - b * mx, b };
}
export const pct = (v: number, d = 1) => (100 * v).toFixed(d) + '%';
export const fmtP = (p: number) => (p < 0.0001 ? '< 0.0001' : p < 0.01 ? p.toFixed(4) : p.toFixed(3));
