// Shared pure helpers for the unsupervised-learning animations (hierarchical, dbscan, gmm, pca, tsne-umap, anomaly-detection).
// 2-D covariance, symmetric eigen-decomposition and the bivariate normal density live in src/viz/math.ts (cov2, eigSym2, normPdf2).
import { rng, gauss } from '../viz/kit';
import { clamp as clampTo, mean } from '../viz/math';

export interface Pt { x: number; y: number }

/** Keep a coordinate inside the 0..10 world (with a small margin). */
export const clamp = (v: number, lo = 0.2, hi = 9.8) => clampTo(v, lo, hi);
export const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

/** Gaussian blobs: centres with their own spread and count. */
export function blobs(spec: { x: number; y: number; sd: number; n: number }[], seed = 1): Pt[] {
  const r = rng(seed);
  const out: Pt[] = [];
  spec.forEach((c) => { for (let i = 0; i < c.n; i++) out.push({ x: clamp(c.x + gauss(r) * c.sd), y: clamp(c.y + gauss(r) * c.sd) }); });
  return out;
}

/** Two interleaved crescents inside the 0..10 world (+ optional scattered noise). */
export function moons(n = 70, noise = 0.28, seed = 3, extra = 0): Pt[] {
  const r = rng(seed);
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const lab = i % 2, half = Math.ceil(n / 2), a = ((Math.floor(i / 2) + 0.5) / half) * Math.PI + (r() - 0.5) * 0.12;
    const x = lab === 0 ? Math.cos(a) : 1 - Math.cos(a);
    const y = lab === 0 ? Math.sin(a) : 0.5 - Math.sin(a);
    out.push({ x: clamp(1.3 + (x + 1) * 2.45 + gauss(r) * noise), y: clamp(2.5 + (y + 0.5) * 3.7 + gauss(r) * noise) });
  }
  for (let i = 0; i < extra; i++) out.push({ x: 0.6 + r() * 8.8, y: 0.6 + r() * 8.8 });
  return out;
}

/** Concentric rings; points are shared in proportion to circumference so both rings have similar density. */
export function rings(n = 80, seed = 4): Pt[] {
  const r = rng(seed), rin = 1.5, rout = 3.5, nIn = Math.round((n * rin) / (rin + rout));
  return Array.from({ length: n }, (_, i) => {
    const inner = i < nIn, j = inner ? i : i - nIn, m = inner ? nIn : n - nIn;
    const a = ((j + r() * 0.6) / m) * 2 * Math.PI, rad = (inner ? rin : rout) + gauss(r) * 0.18; // evenly spread angles, small jitter
    return { x: clamp(5 + rad * Math.cos(a)), y: clamp(5 + rad * Math.sin(a)) };
  });
}

/** Plain k-means (k-means++-like deterministic farthest-point start) returning labels and centres. */
export function kmeansLabels(pts: Pt[], k: number, iters = 25): { labels: number[]; centres: Pt[] } {
  if (!pts.length) return { labels: [], centres: [] };
  const centres: Pt[] = [{ ...pts[0] }];
  while (centres.length < Math.min(k, pts.length)) {
    let best = 0, bd = -1;
    pts.forEach((p, i) => { const d = Math.min(...centres.map((c) => dist(p, c))); if (d > bd) { bd = d; best = i; } });
    centres.push({ ...pts[best] });
  }
  let labels = pts.map(() => 0);
  for (let t = 0; t < iters; t++) {
    labels = pts.map((p) => { let j = 0; centres.forEach((c, i) => { if (dist(p, c) < dist(p, centres[j])) j = i; }); return j; });
    centres.forEach((c, j) => { const m = pts.filter((_, i) => labels[i] === j); if (m.length) { c.x = mean(m.map((q) => q.x)); c.y = mean(m.map((q) => q.y)); } });
  }
  return { labels, centres };
}
