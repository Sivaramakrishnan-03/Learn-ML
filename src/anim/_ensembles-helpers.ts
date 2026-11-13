// Shared pure helpers for the ensemble animations (bagging, random-forest, adaboost, gradient-boosting, xgboost, stacking).
// A small, fast weighted CART (sorted sweep), bootstrap, decision fields and two tiny SVG renderers (createElement, no JSX).
import { createElement as h, ReactNode } from 'react';
import { rng, gauss, C, Scales } from '../viz/kit';

/* ---------------- data ---------------- */
export interface CP { x: number; y: number; label: number } // label 1 = repaid, 0 = default
/** Credit applicants (same story as the decision-tree page): x = income (₹ lakh / 3), y = credit score ((s − 300) / 60). */
export function credit(n = 70, seed = 5, noise = 0.08): CP[] {
  const r = rng(seed);
  return Array.from({ length: n }, () => {
    const x = 0.5 + r() * 9, y = 0.5 + r() * 9;
    const score = (x > 4.5 ? 1 : 0) + (y > 5.5 ? 1 : 0) + (x > 7 && y > 2.5 ? 1 : 0);
    let label = score >= 2 ? 1 : 0;
    if (r() < noise) label = 1 - label;
    return { x, y, label };
  });
}
/** Diagonal boundary (hard for axis-aligned stumps one at a time). */
export function diagonal(n = 60, seed = 3, noise = 0.05): CP[] {
  const r = rng(seed);
  return Array.from({ length: n }, () => {
    const x = 0.5 + r() * 9, y = 0.5 + r() * 9;
    let label = x + 0.8 * y > 9 ? 1 : 0;
    if (r() < noise) label = 1 - label;
    return { x, y, label };
  });
}
/** A disc of repaid inside a ring of defaults. */
export function ring(n = 70, seed = 4, noise = 0.04): CP[] {
  const r = rng(seed);
  return Array.from({ length: n }, () => {
    const x = 0.5 + r() * 9, y = 0.5 + r() * 9;
    let label = Math.hypot(x - 5, y - 5) < 2.9 ? 1 : 0;
    if (r() < noise) label = 1 - label;
    return { x, y, label };
  });
}
export interface RP { x: number; y: number }
/** 1-D regression: store floor area (×1000 sq ft) → monthly sales (₹ lakh). A wavy trend + noise. */
export const storeTrend = (x: number) => 4 + 1.0 * x + 1.6 * Math.sin(1.1 * x);
export function stores(n = 40, seed = 11, sd = 1.1): RP[] {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const x = 0.3 + (9.4 * (i + r() * 0.8)) / n;
    return { x, y: storeTrend(x) + gauss(r) * sd };
  });
}

/* ---------------- weighted CART (classification via 0/1 targets = Gini, or regression = squared error) ---------------- */
export interface TNode { id: number; depth: number; n: number; w: number; v: number; f?: number; t?: number; l?: TNode; r?: TNode; box: [number, number][]; menu?: number[]; gain?: number }
export interface SplitLog { node: TNode; menu: number[]; f: number; t: number; gain: number; alt?: { f: number; t: number; gain: number } }
export interface TreeOpts { maxDepth?: number; minLeaf?: number; mtry?: number; r?: () => number; bounds?: [number, number][] }

function bestSplit(X: number[][], y: number[], w: number[], idx: number[], f: number, minLeaf: number) {
  const s = [...idx].sort((a, b) => X[a][f] - X[b][f]);
  let W = 0, S = 0, Q = 0;
  s.forEach((i) => { W += w[i]; S += w[i] * y[i]; Q += w[i] * y[i] * y[i]; });
  const parent = W > 0 ? Q - (S * S) / W : 0;
  let wl = 0, sl = 0, ql = 0, best = { gain: 0, t: NaN };
  for (let k = 0; k < s.length - 1; k++) {
    const i = s[k];
    wl += w[i]; sl += w[i] * y[i]; ql += w[i] * y[i] * y[i];
    if (k + 1 < minLeaf || s.length - k - 1 < minLeaf) continue;
    const a = X[i][f], b = X[s[k + 1]][f];
    if (b - a < 1e-12) continue;
    const wr = W - wl, sr = S - sl, qr = Q - ql;
    if (wl <= 1e-12 || wr <= 1e-12) continue;
    const cost = ql - (sl * sl) / wl + qr - (sr * sr) / wr;
    const gain = parent - cost;
    if (gain > best.gain + 1e-12) best = { gain, t: (a + b) / 2 };
  }
  return best;
}

/** Grow a CART tree breadth-first. Leaf value v = weighted mean of y (for 0/1 labels: share of class 1). */
export function growTree(X: number[][], y: number[], w: number[], o: TreeOpts = {}, idx0?: number[]): { root: TNode; log: SplitLog[] } {
  const p = X[0]?.length ?? 1, maxDepth = o.maxDepth ?? 6, minLeaf = o.minLeaf ?? 1, mtry = Math.min(o.mtry ?? p, p);
  const bounds = o.bounds ?? Array.from({ length: p }, () => [0, 10] as [number, number]);
  let id = 0;
  const log: SplitLog[] = [];
  const mk = (idx: number[], depth: number, box: [number, number][]): TNode => {
    let W = 0, S = 0; idx.forEach((i) => { W += w[i]; S += w[i] * y[i]; });
    return { id: id++, depth, n: idx.length, w: W, v: W > 0 ? S / W : 0, box };
  };
  const all = idx0 ?? X.map((_, i) => i);
  const root = mk(all, 0, bounds);
  const q: { node: TNode; idx: number[] }[] = [{ node: root, idx: all }];
  while (q.length) {
    const { node, idx } = q.shift()!;
    if (node.depth >= maxDepth || idx.length < 2 * minLeaf) continue;
    let menu = Array.from({ length: p }, (_, k) => k);
    if (mtry < p && o.r) { const r = o.r; menu = menu.map((k) => ({ k, u: r() })).sort((a, b) => a.u - b.u).slice(0, mtry).map((d) => d.k).sort(); }
    let best = { gain: 0, t: NaN, f: -1 };
    menu.forEach((f) => { const b = bestSplit(X, y, w, idx, f, minLeaf); if (b.gain > best.gain + 1e-12) best = { ...b, f }; });
    node.menu = menu;
    let alt: SplitLog['alt'];
    if (menu.length < p) { let a = { gain: 0, t: NaN, f: -1 }; for (let f = 0; f < p; f++) { const b = bestSplit(X, y, w, idx, f, minLeaf); if (b.gain > a.gain + 1e-12) a = { ...b, f }; } if (a.f >= 0) alt = a; }
    if (best.f < 0) continue;
    node.f = best.f; node.t = best.t; node.gain = best.gain;
    const L = idx.filter((i) => X[i][best.f] <= best.t), R = idx.filter((i) => X[i][best.f] > best.t);
    const bl = node.box.map((b) => [...b] as [number, number]), br = node.box.map((b) => [...b] as [number, number]);
    bl[best.f][1] = best.t; br[best.f][0] = best.t;
    node.l = mk(L, node.depth + 1, bl); node.r = mk(R, node.depth + 1, br);
    log.push({ node, menu, f: best.f, t: best.t, gain: best.gain, alt });
    q.push({ node: node.l, idx: L }, { node: node.r, idx: R });
  }
  return { root, log };
}
export function predict(n: TNode, x: number[]): number {
  while (n.l && n.r && n.f !== undefined) n = x[n.f] <= n.t! ? n.l : n.r;
  return n.v;
}
export function leaves(n: TNode): TNode[] { return n.l && n.r ? [...leaves(n.l), ...leaves(n.r)] : [n]; }

/* ---------------- bootstrap ---------------- */
export function bootstrap(n: number, r: () => number) {
  const counts = Array(n).fill(0); const idx: number[] = [];
  for (let k = 0; k < n; k++) { const i = Math.floor(r() * n); idx.push(i); counts[i]++; }
  return { idx, counts };
}

/* ---------------- decision fields ---------------- */
export const G = 40; // grid resolution for 0..10 × 0..10 decision fields
export const cellCentres = (() => { const out: number[][] = []; for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) out.push([(i + 0.5) * 10 / G, (j + 0.5) * 10 / G]); return out; })();
/** Hard 0/1 class of a tree on every cell. */
export const treeGrid = (t: TNode) => Uint8Array.from(cellCentres.map((c) => (predict(t, c) > 0.5 ? 1 : 0)));

/** Boundary segments (data coords) between cells whose value is on different sides of 0.5. */
export function boundary(field: ArrayLike<number>): [number, number, number, number][] {
  const segs: [number, number, number, number][] = []; const d = 10 / G;
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
    const a = field[j * G + i] > 0.5;
    if (i < G - 1 && a !== field[j * G + i + 1] > 0.5) segs.push([(i + 1) * d, j * d, (i + 1) * d, (j + 1) * d]);
    if (j < G - 1 && a !== field[(j + 1) * G + i] > 0.5) segs.push([i * d, (j + 1) * d, (i + 1) * d, (j + 1) * d]);
  }
  return segs;
}

/* ---------------- renderers ---------------- */
export const CLS = [C.pink, C.blue]; // 0 = default, 1 = repaid
export const CLS_NAME = ['default', 'repaid'];

/** Shaded probability field: colour = majority class, opacity = how lopsided the vote is. */
export function Field({ s, field, strength = 1 }: { s: Scales; field: ArrayLike<number>; strength?: number }): ReactNode {
  const d = 10 / G, wpx = s.sx(d) - s.sx(0), hpx = s.sy(0) - s.sy(d), out: ReactNode[] = [];
  for (let k = 0; k < G * G; k++) {
    const v = field[k], i = k % G, j = Math.floor(k / G);
    out.push(h('rect', { key: k, x: s.sx(i * d), y: s.sy((j + 1) * d), width: wpx, height: hpx, fill: v > 0.5 ? CLS[1] : CLS[0], fillOpacity: (0.05 + 0.3 * Math.abs(2 * v - 1)) * strength }));
  }
  return h('g', { shapeRendering: 'crispEdges' }, out);
}
export function Boundary({ s, segs, color = C.yellow, width = 2.5, opacity = 1 }: { s: Scales; segs: [number, number, number, number][]; color?: string; width?: number; opacity?: number }): ReactNode {
  const dd = segs.map(([a, b, c, e]) => `M${s.sx(a).toFixed(1)},${s.sy(b).toFixed(1)}L${s.sx(c).toFixed(1)},${s.sy(e).toFixed(1)}`).join('');
  return h('path', { d: dd || 'M0,0', stroke: color, strokeWidth: width, opacity, fill: 'none', strokeLinecap: 'round' });
}
/** Class points: circles = repaid, squares = default. Optional per-point radius, opacity and red ring. */
export function ClassDots({ s, pts, r = () => 5, op = () => 1, ring: ringF, label }: { s: Scales; pts: CP[]; r?: (i: number) => number; op?: (i: number) => number; ring?: (i: number) => boolean; label?: (i: number) => string | null }): ReactNode {
  return h('g', null, pts.map((p, i) => {
    const R = r(i), X = s.sx(p.x), Y = s.sy(p.y), o = op(i), L = label?.(i);
    if (R <= 0) return null;
    const shape = p.label === 1
      ? h('circle', { cx: X, cy: Y, r: R, fill: CLS[1], stroke: C.bg, strokeWidth: 1, opacity: o })
      : h('rect', { x: X - R * 0.9, y: Y - R * 0.9, width: R * 1.8, height: R * 1.8, fill: CLS[0], stroke: C.bg, strokeWidth: 1, opacity: o });
    return h('g', { key: i }, shape,
      ringF?.(i) ? h('circle', { cx: X, cy: Y, r: R + 4, fill: 'none', stroke: C.red, strokeWidth: 2 }) : null,
      L ? h('text', { x: X + R + 3, y: Y - R, fill: C.gold, fontSize: 11 }, L) : null);
  }));
}

/* ---------------- small stats ---------------- */
export const mean = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
export const mse = (a: number[], b: number[]) => mean(a.map((v, i) => (v - b[i]) ** 2));
export const acc = (pred: number[], y: number[]) => mean(pred.map((v, i) => ((v > 0.5 ? 1 : 0) === y[i] ? 1 : 0)));
export const AX = { xLabel: 'annual income (₹ lakh)', yLabel: 'credit score', fx: (v: number) => `${Math.round(v * 3)}`, fy: (v: number) => `${Math.round(300 + v * 60)}` };
