// Topic-specific helpers for the STATISTICS PART 1 animations (descriptive stats, normal, distributions, CIs, tests).
// The maths (moments, quantiles, histograms, normal / t / binomial / Poisson) lives in src/viz/math.ts.

/* ---------- formatting / dot plots ---------- */
export const pct = (p: number, d = 1) => (100 * p).toFixed(d) + '%';
export function pFmt(p: number) { return p < 0.0001 ? '< 0.0001' : p < 0.001 ? p.toFixed(5) : p.toFixed(p < 0.1 ? 4 : 3); }
/** Stack identical-ish values into a dot plot: returns y levels (1, 2, 3 …) for values falling in the same bin. */
export function stackY(values: number[], binW: number) {
  const seen: Record<number, number> = {};
  return values.map((v) => { const b = Math.round(v / binW); seen[b] = (seen[b] ?? 0) + 1; return seen[b]; });
}
