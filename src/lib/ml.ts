// Pure, deterministic algorithm implementations that emit animation frames.
// The UI never runs algorithm logic itself — it only renders frames. This keeps animations testable.
import { P, rng } from './datasets';

/* ======================= Linear regression ======================= */
export interface LinFrame { m: number; b: number; loss: number; dm: number; db: number; iter: number }

export const mse = (pts: P[], m: number, b: number) =>
  pts.reduce((s, p) => s + (p.y - (m * p.x + b)) ** 2, 0) / Math.max(pts.length, 1);

export function ols(pts: P[]) {
  const n = pts.length;
  if (n < 2) return { m: 0, b: n ? pts[0].y : 5 };
  const mx = pts.reduce((s, p) => s + p.x, 0) / n;
  const my = pts.reduce((s, p) => s + p.y, 0) / n;
  let sxy = 0, sxx = 0;
  pts.forEach((p) => { sxy += (p.x - mx) * (p.y - my); sxx += (p.x - mx) ** 2; });
  const m = sxx ? sxy / sxx : 0;
  return { m, b: my - m * mx, mx, my };
}

export function r2(pts: P[], m: number, b: number) {
  const my = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  const ssTot = pts.reduce((s, p) => s + (p.y - my) ** 2, 0);
  const ssRes = pts.reduce((s, p) => s + (p.y - (m * p.x + b)) ** 2, 0);
  return ssTot ? 1 - ssRes / ssTot : 0;
}

/** Gradient descent on MSE. Records frames on a log-ish schedule so early (dramatic) steps are all visible. */
export function linregGD(pts: P[], lr = 0.02, iters = 2000, m0 = -0.5, b0 = 8): LinFrame[] {
  let m = m0, b = b0;
  const n = pts.length;
  const frames: LinFrame[] = [];
  for (let i = 0; i <= iters; i++) {
    let dm = 0, db = 0;
    pts.forEach((p) => { const e = m * p.x + b - p.y; dm += (2 / n) * e * p.x; db += (2 / n) * e; });
    if (i < 15 || (i < 100 && i % 5 === 0) || i % 50 === 0 || i === iters) frames.push({ m, b, loss: mse(pts, m, b), dm, db, iter: i });
    m -= lr * dm; b -= lr * db;
    if (!isFinite(m) || Math.abs(m) > 1e6) { frames.push({ m, b, loss: Infinity, dm, db, iter: i + 1 }); break; }
  }
  return frames;
}

/* ======================= K-Means ======================= */
export interface KFrame {
  centroids: { x: number; y: number }[];
  assign: number[];            // -1 = unassigned
  phase: 'init' | 'assign' | 'update' | 'converged';
  iter: number;
  inertia: number;
  moved?: { from: { x: number; y: number }; to: { x: number; y: number } }[];
}

const d2 = (a: { x: number; y: number }, b: { x: number; y: number }) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

export function inertia(pts: P[], cs: { x: number; y: number }[], assign: number[]) {
  return pts.reduce((s, p, i) => s + (assign[i] >= 0 ? d2(p, cs[assign[i]]) : 0), 0);
}

/** init: 'random' picks k random points (can be bad on purpose), 'kmeans++' spreads them out. */
export function kmeans(pts: P[], k: number, seed = 1, init: 'random' | 'kmeans++' = 'random', maxIter = 15): KFrame[] {
  const r = rng(seed);
  let cs: { x: number; y: number }[] = [];
  if (init === 'random' || pts.length === 0) {
    const idx = new Set<number>();
    while (idx.size < Math.min(k, pts.length)) idx.add(Math.floor(r() * pts.length));
    cs = [...idx].map((i) => ({ x: pts[i].x, y: pts[i].y }));
  } else {
    cs.push({ ...pts[Math.floor(r() * pts.length)] });
    while (cs.length < k) {
      const ds = pts.map((p) => Math.min(...cs.map((c) => d2(p, c))));
      const tot = ds.reduce((a, b) => a + b, 0);
      let pick = r() * tot, j = 0;
      while (pick > ds[j] && j < ds.length - 1) { pick -= ds[j]; j++; }
      cs.push({ x: pts[j].x, y: pts[j].y });
    }
  }
  while (cs.length < k) cs.push({ x: 1 + r() * 8, y: 1 + r() * 8 });

  const frames: KFrame[] = [];
  let assign = pts.map(() => -1);
  frames.push({ centroids: cs.map((c) => ({ ...c })), assign: [...assign], phase: 'init', iter: 0, inertia: 0 });
  for (let it = 1; it <= maxIter; it++) {
    const next = pts.map((p) => { let best = 0; cs.forEach((c, j) => { if (d2(p, c) < d2(p, cs[best])) best = j; }); return best; });
    const changed = next.some((a, i) => a !== assign[i]);
    assign = next;
    frames.push({ centroids: cs.map((c) => ({ ...c })), assign: [...assign], phase: 'assign', iter: it, inertia: inertia(pts, cs, assign) });
    if (!changed && it > 1) { frames.push({ ...frames[frames.length - 1], phase: 'converged' }); break; }
    const newCs = cs.map((c, j) => {
      const mem = pts.filter((_, i) => assign[i] === j);
      return mem.length ? { x: mem.reduce((s, p) => s + p.x, 0) / mem.length, y: mem.reduce((s, p) => s + p.y, 0) / mem.length } : { ...c };
    });
    const moved = cs.map((c, j) => ({ from: { ...c }, to: { ...newCs[j] } }));
    cs = newCs;
    frames.push({ centroids: cs.map((c) => ({ ...c })), assign: [...assign], phase: 'update', iter: it, inertia: inertia(pts, cs, assign), moved });
  }
  if (frames[frames.length - 1].phase !== 'converged') frames.push({ ...frames[frames.length - 1], phase: 'converged' });
  return frames;
}

/** Elbow curve: final inertia for k = 1..kMax (k-means++ for stability). */
export function elbow(pts: P[], kMax = 8, seed = 2) {
  return Array.from({ length: kMax }, (_, i) => {
    const f = kmeans(pts, i + 1, seed, 'kmeans++', 30);
    return { k: i + 1, inertia: f[f.length - 1].inertia };
  });
}

/* ======================= Decision tree (CART, Gini) ======================= */
export interface Box { x0: number; x1: number; y0: number; y1: number }
export interface TreeNode {
  id: number; depth: number; box: Box; n: number; counts: number[]; gini: number; pred: number;
  feature?: 'x' | 'y'; threshold?: number; left?: TreeNode; right?: TreeNode;
}
export interface TreeFrame {
  kind: 'node' | 'scan' | 'split' | 'leaf' | 'done';
  node: TreeNode;          // node being processed
  leaves: { id: number; box: Box; pred: number; gini: number; n: number }[]; // current partition
  candidate?: { feature: 'x' | 'y'; threshold: number; gini: number; best: boolean };
  scan?: { feature: 'x' | 'y'; threshold: number; gini: number }[];
  text: string;
}

export function giniOf(counts: number[]) {
  const n = counts.reduce((a, b) => a + b, 0);
  return n ? 1 - counts.reduce((s, c) => s + (c / n) ** 2, 0) : 0;
}

const countsOf = (pts: P[], K: number) => {
  const c = Array(K).fill(0); pts.forEach((p) => c[p.label ?? 0]++); return c;
};
const argmax = (a: number[]) => a.reduce((bi, v, i) => (v > a[bi] ? i : bi), 0);

function bestSplit(pts: P[], K: number) {
  type Cand = { feature: 'x' | 'y'; threshold: number; gini: number };
  let best = null as Cand | null;
  const all: { feature: 'x' | 'y'; threshold: number; gini: number }[] = [];
  (['x', 'y'] as const).forEach((f) => {
    const vals = [...new Set(pts.map((p) => p[f]))].sort((a, b) => a - b);
    for (let i = 0; i < vals.length - 1; i++) {
      const th = (vals[i] + vals[i + 1]) / 2;
      const L = pts.filter((p) => p[f] <= th), R = pts.filter((p) => p[f] > th);
      const g = (L.length * giniOf(countsOf(L, K)) + R.length * giniOf(countsOf(R, K))) / pts.length;
      all.push({ feature: f, threshold: th, gini: g });
      if (!best || g < best.gini - 1e-12) best = { feature: f, threshold: th, gini: g };
    }
  });
  return { best, all };
}

export function buildTree(pts: P[], maxDepth = 3, minLeaf = 2, K = 2): { root: TreeNode; frames: TreeFrame[] } {
  let nid = 0;
  const frames: TreeFrame[] = [];
  const world: Box = { x0: 0, x1: 10, y0: 0, y1: 10 };
  const mk = (sub: P[], depth: number, box: Box): TreeNode => {
    const counts = countsOf(sub, K);
    return { id: nid++, depth, box, n: sub.length, counts, gini: giniOf(counts), pred: argmax(counts) };
  };
  const root = mk(pts, 0, world);
  // leaf registry for drawing partitions
  const leafMap = new Map<number, TreeNode>([[root.id, root]]);
  const snapshot = () => [...leafMap.values()].map((l) => ({ id: l.id, box: l.box, pred: l.pred, gini: l.gini, n: l.n }));

  // BFS so the animation grows the tree level by level
  const queue: { node: TreeNode; sub: P[] }[] = [{ node: root, sub: pts }];
  while (queue.length) {
    const { node, sub } = queue.shift()!;
    frames.push({ kind: 'node', node, leaves: snapshot(), text: `Node with ${node.n} samples, Gini impurity ${node.gini.toFixed(3)}.` });
    if (node.depth >= maxDepth || node.gini === 0 || sub.length < 2 * minLeaf) {
      frames.push({ kind: 'leaf', node, leaves: snapshot(),
        text: node.gini === 0 ? 'Pure node — stop. It becomes a leaf.' : node.depth >= maxDepth ? 'Max depth reached — stop. Leaf predicts the majority class.' : 'Too few samples to split — leaf.' });
      continue;
    }
    const { best, all } = bestSplit(sub, K);
    if (!best || best.gini >= node.gini - 1e-9) {
      frames.push({ kind: 'leaf', node, leaves: snapshot(), text: 'No split reduces impurity — leaf.' });
      continue;
    }
    // A handful of scan frames per feature: show the search, not every candidate
    (['x', 'y'] as const).forEach((f) => {
      const fc = all.filter((c) => c.feature === f);
      const stepN = Math.max(1, Math.floor(fc.length / 5));
      for (let i = 0; i < fc.length; i += stepN) {
        frames.push({ kind: 'scan', node, leaves: snapshot(), candidate: { ...fc[i], best: false },
          scan: fc.slice(0, i + 1),
          text: `Try ${f === 'x' ? 'feature 1' : 'feature 2'} ≤ ${fc[i].threshold.toFixed(2)} → weighted Gini ${fc[i].gini.toFixed(3)}` });
      }
    });
    node.feature = best.feature; node.threshold = best.threshold;
    const b = node.box;
    const lBox: Box = best.feature === 'x' ? { ...b, x1: best.threshold } : { ...b, y1: best.threshold };
    const rBox: Box = best.feature === 'x' ? { ...b, x0: best.threshold } : { ...b, y0: best.threshold };
    const L = sub.filter((p) => p[best!.feature] <= best!.threshold), R = sub.filter((p) => p[best!.feature] > best!.threshold);
    node.left = mk(L, node.depth + 1, lBox); node.right = mk(R, node.depth + 1, rBox);
    leafMap.delete(node.id); leafMap.set(node.left.id, node.left); leafMap.set(node.right.id, node.right);
    frames.push({ kind: 'split', node, leaves: snapshot(), candidate: { ...best, best: true },
      text: `Best split: ${best.feature === 'x' ? 'feature 1' : 'feature 2'} ≤ ${best.threshold.toFixed(2)}. Impurity drops ${node.gini.toFixed(3)} → ${best.gini.toFixed(3)}.` });
    queue.push({ node: node.left, sub: L }, { node: node.right, sub: R });
  }
  frames.push({ kind: 'done', node: root, leaves: snapshot(), text: `Done. ${leafMap.size} leaves. Every region predicts its majority class.` });
  return { root, frames };
}

export function predictTree(n: TreeNode, p: { x: number; y: number }): number {
  while (n.feature && n.left && n.right) n = p[n.feature] <= n.threshold! ? n.left : n.right;
  return n.pred;
}

export function treeNodes(n: TreeNode, acc: TreeNode[] = []): TreeNode[] {
  acc.push(n); if (n.left) treeNodes(n.left, acc); if (n.right) treeNodes(n.right, acc); return acc;
}

/* ======================= Classifiers for Compare view ======================= */
export function logisticFit(pts: P[], iters = 800, lr = 0.3) {
  // features standardised internally around the world centre
  let w1 = 0, w2 = 0, b = 0;
  const n = pts.length;
  for (let i = 0; i < iters; i++) {
    let g1 = 0, g2 = 0, gb = 0;
    pts.forEach((p) => {
      const x1 = (p.x - 5) / 3, x2 = (p.y - 5) / 3;
      const s = 1 / (1 + Math.exp(-(w1 * x1 + w2 * x2 + b)));
      const e = s - (p.label ?? 0);
      g1 += e * x1; g2 += e * x2; gb += e;
    });
    w1 -= (lr * g1) / n; w2 -= (lr * g2) / n; b -= (lr * gb) / n;
  }
  return (q: { x: number; y: number }) => {
    const s = 1 / (1 + Math.exp(-(w1 * (q.x - 5) / 3 + w2 * (q.y - 5) / 3 + b)));
    return s > 0.5 ? 1 : 0;
  };
}

export function knnFit(pts: P[], k = 7) {
  return (q: { x: number; y: number }) => {
    const near = [...pts].sort((a, b) => d2(a, q) - d2(b, q)).slice(0, k);
    const ones = near.filter((p) => p.label === 1).length;
    return ones * 2 > near.length ? 1 : 0;
  };
}

export function accuracy(pts: P[], f: (q: { x: number; y: number }) => number) {
  return pts.filter((p) => f(p) === p.label).length / Math.max(pts.length, 1);
}

/** Deterministic train/test split. */
export function split(pts: P[], testFrac = 0.3, seed = 42) {
  const r = rng(seed);
  const train: P[] = [], test: P[] = [];
  pts.forEach((p) => (r() < testFrac ? test : train).push(p));
  return { train, test };
}
