// Topic-specific helpers for the Statistics part 2 animations (chi-square, anova, correlation, bootstrap, ab-testing, bayes-theorem, mle).
// The maths (moments, quantiles, χ² / F / normal distributions, correlation, least squares) lives in src/viz/math.ts.

export const pct = (v: number, d = 1) => (100 * v).toFixed(d) + '%';
export const fmtP = (p: number) => (p < 0.0001 ? '< 0.0001' : p < 0.01 ? p.toFixed(4) : p.toFixed(3));
