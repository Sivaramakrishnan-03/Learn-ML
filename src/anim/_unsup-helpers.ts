// Shared pure helpers for the unsupervised-learning animations (hierarchical, dbscan, gmm, pca, tsne-umap, anomaly-detection).
import { rng, gauss } from '../viz/kit';

export interface Pt { x: number; y: number }

export const clamp = (v: number, lo = 0.2, hi = 9.8) => Math.min(hi, Math.max(lo, v));
export const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
export const mean = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);

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

/* ---------- 2×2 covariance / ellipse maths (GMM, PCA) ---------- */
export interface Cov { a: number; b: number; c: number } // [[a, b], [b, c]]
export function covOf(pts: Pt[], w?: number[]): { mu: Pt; cov: Cov } {
  const ws = w ?? pts.map(() => 1);
  const W = ws.reduce((s, v) => s + v, 0) || 1e-9;
  const mx = pts.reduce((s, p, i) => s + ws[i] * p.x, 0) / W, my = pts.reduce((s, p, i) => s + ws[i] * p.y, 0) / W;
  let a = 0, b = 0, c = 0;
  pts.forEach((p, i) => { const dx = p.x - mx, dy = p.y - my; a += ws[i] * dx * dx; b += ws[i] * dx * dy; c += ws[i] * dy * dy; });
  return { mu: { x: mx, y: my }, cov: { a: a / W, b: b / W, c: c / W } };
}
/** Eigen-decomposition of a symmetric 2×2 matrix: λ1 ≥ λ2 and the angle (radians) of the first eigenvector. */
export function eig2(m: Cov) {
  const tr = m.a + m.c, det = m.a * m.c - m.b * m.b;
  const disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
  const l1 = tr / 2 + disc, l2 = tr / 2 - disc;
  const ang = Math.abs(m.b) < 1e-12 ? (m.a >= m.c ? 0 : Math.PI / 2) : Math.atan2(l1 - m.a, m.b);
  return { l1, l2: Math.max(l2, 0), ang };
}
export function gauss2(p: Pt, mu: Pt, m: Cov) {
  const det = Math.max(m.a * m.c - m.b * m.b, 1e-9);
  const dx = p.x - mu.x, dy = p.y - mu.y;
  const q = (m.c * dx * dx - 2 * m.b * dx * dy + m.a * dy * dy) / det;
  return Math.exp(-q / 2) / (2 * Math.PI * Math.sqrt(det));
}
