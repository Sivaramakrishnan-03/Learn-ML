// Shared pure helpers for the CLASSIFIERS & NEURAL NETS animations (naive-bayes, svm, kernel-svm, lda, perceptron, mlp).
// Everything here is plain TypeScript: datasets, an SMO solver for (kernel) SVMs, a tiny MLP trainer, a perceptron,
// plus one small React component (DecisionHeat) built with createElement so this file can stay a .ts module.
import { createElement as h } from 'react';
import { rng, gauss, clamp, sigmoid } from '../viz/math';
import type { Scales } from '../viz/kit';
export { equalH } from './_math-helpers';

export interface LP { x: number; y: number; c: 0 | 1 }

/* ---------- formatting ---------- */
export const f2 = (v: number, d = 2) => (Math.abs(v) < 5e-13 ? 0 : v).toFixed(d);

/* ---------- datasets (seeded) ---------- */
export function blobs(n: number, m0: [number, number], m1: [number, number], sd: number, seed: number): LP[] {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const c = (i % 2) as 0 | 1, m = c ? m1 : m0;
    return { x: m[0] + sd * gauss(r), y: m[1] + sd * gauss(r), c };
  });
}
export function rings(n: number, noise: number, seed: number): LP[] {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const c = (i % 2) as 0 | 1, rad = (c ? 0.9 : 2.3) + noise * gauss(r), a = r() * 2 * Math.PI;
    return { x: rad * Math.cos(a), y: rad * Math.sin(a), c };
  });
}
export function moons(n: number, noise: number, seed: number): LP[] {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const c = (i % 2) as 0 | 1, t = r() * Math.PI;
    const x = c ? 1 - Math.cos(t) : Math.cos(t), y = c ? 0.5 - Math.sin(t) : Math.sin(t);
    return { x: (x - 0.5) * 2 + noise * gauss(r), y: (y - 0.25) * 2 + noise * gauss(r), c };
  });
}
export function xorPts(n: number, noise: number, seed: number): LP[] {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const qx = i % 2, qy = Math.floor(i / 2) % 2;
    const c = (qx ^ qy) as 0 | 1;
    return { x: (qx ? 1.2 : -1.2) + noise * gauss(r), y: (qy ? 1.2 : -1.2) + noise * gauss(r), c };
  });
}

/* ---------- SVM via SMO (maximal-violating-pair selection, deterministic) ---------- */
export type Kernel = (a: LP, b: LP) => number;
export const linearK: Kernel = (a, b) => a.x * b.x + a.y * b.y;
export const polyK = (deg = 2, c0 = 1): Kernel => (a, b) => (a.x * b.x + a.y * b.y + c0) ** deg;
export const rbfK = (gamma: number): Kernel => (a, b) => Math.exp(-gamma * ((a.x - b.x) ** 2 + (a.y - b.y) ** 2));

export interface SVMFit { alpha: number[]; b: number; y: number[]; pts: LP[]; K: Kernel; C: number; sv: boolean[]; f: (p: { x: number; y: number }) => number; w?: [number, number] }

export function trainSVM(pts: LP[], K: Kernel, Cc: number, eps = 1e-4, maxIter = 40000): SVMFit {
  const n = pts.length, y = pts.map((p) => (p.c ? 1 : -1));
  const Km = pts.map((a) => pts.map((b) => K(a, b)));
  const a = new Array(n).fill(0);
  const F = y.map((v) => -v); // F_k = Σ a_l y_l K_lk − y_k  (prediction error without bias)
  const up = (t: number) => (y[t] > 0 ? a[t] < Cc - 1e-12 : a[t] > 1e-12);
  const low = (t: number) => (y[t] > 0 ? a[t] > 1e-12 : a[t] < Cc - 1e-12);
  for (let it = 0; it < maxIter; it++) {
    let i = -1, j = -1, mx = -Infinity, mn = Infinity;
    for (let t = 0; t < n; t++) {
      if (up(t) && -F[t] > mx) { mx = -F[t]; i = t; }
      if (low(t) && -F[t] < mn) { mn = -F[t]; j = t; }
    }
    if (i < 0 || j < 0 || mx - mn < eps) break;
    const eta = Math.max(Km[i][i] + Km[j][j] - 2 * Km[i][j], 1e-12);
    let L: number, H: number;
    if (y[i] !== y[j]) { L = Math.max(0, a[j] - a[i]); H = Math.min(Cc, Cc + a[j] - a[i]); }
    else { L = Math.max(0, a[i] + a[j] - Cc); H = Math.min(Cc, a[i] + a[j]); }
    const ajOld = a[j], aiOld = a[i];
    const aj = clamp(ajOld + (y[j] * (F[i] - F[j])) / eta, L, H);
    const ai = aiOld + y[i] * y[j] * (ajOld - aj);
    const di = ai - aiOld, dj = aj - ajOld;
    if (Math.abs(di) + Math.abs(dj) < 1e-14) break;
    a[i] = ai; a[j] = aj;
    for (let k = 0; k < n; k++) F[k] += di * y[i] * Km[i][k] + dj * y[j] * Km[j][k];
  }
  let bs = 0, nf = 0;
  for (let k = 0; k < n; k++) if (a[k] > 1e-8 && a[k] < Cc - 1e-8) { bs += -F[k]; nf++; }
  let b: number;
  if (nf) b = bs / nf;
  else {
    let mx = -Infinity, mn = Infinity;
    for (let t = 0; t < n; t++) { if (up(t)) mx = Math.max(mx, -F[t]); if (low(t)) mn = Math.min(mn, -F[t]); }
    b = isFinite(mx) && isFinite(mn) ? (mx + mn) / 2 : 0;
  }
  const sv = a.map((v) => v > 1e-8);
  const idx = sv.map((s, k) => (s ? k : -1)).filter((k) => k >= 0);
  const f = (p: { x: number; y: number }) => { let s = b; const q = p as LP; for (const k of idx) s += a[k] * y[k] * K(pts[k], q); return s; };
  let w: [number, number] | undefined;
  if (K === linearK) { w = [0, 0]; for (const k of idx) { w[0] += a[k] * y[k] * pts[k].x; w[1] += a[k] * y[k] * pts[k].y; } }
  return { alpha: a, b, y, pts, K, C: Cc, sv, f, w };
}

/* ---------- perceptron ---------- */
export interface PercStep { idx: number; z: number; pred: 0 | 1; wrong: boolean; w: [number, number]; b: number; wBefore: [number, number]; bBefore: number; epoch: number }
/** Classic perceptron (predict 1 if z > 0), presenting points in the given order every epoch. Returns every presentation. */
export function runPerceptron(pts: LP[], epochs: number, eta = 1, w0: [number, number] = [0, 0], b0 = 0, order?: (e: number) => number[]): PercStep[] {
  let w: [number, number] = [...w0] as [number, number], b = b0;
  const out: PercStep[] = [];
  for (let e = 0; e < epochs; e++) {
    const ord = order ? order(e) : pts.map((_, i) => i);
    for (const i of ord) {
      const p = pts[i], z = w[0] * p.x + w[1] * p.y + b, pred = (z > 0 ? 1 : 0) as 0 | 1, wrong = pred !== p.c;
      const wb: [number, number] = [w[0], w[1]], bb = b;
      if (wrong) { const s = p.c - pred; w = [w[0] + eta * s * p.x, w[1] + eta * s * p.y]; b += eta * s; }
      out.push({ idx: i, z, pred, wrong, w: [w[0], w[1]], b, wBefore: wb, bBefore: bb, epoch: e });
    }
  }
  return out;
}

/* ---------- tiny MLP: 2 → H (tanh) → 1 (sigmoid), full-batch Adam on log loss ---------- */
export interface MLPW { W: [number, number][]; bh: number[]; v: number[]; bo: number }
export function mlpForward(m: MLPW, x: number, y: number) {
  const hh = m.W.map((w, j) => Math.tanh(w[0] * x + w[1] * y + m.bh[j]));
  const z = hh.reduce((s, hv, j) => s + m.v[j] * hv, m.bo);
  return { h: hh, z, p: sigmoid(z) };
}
export const cloneMLP = (m: MLPW): MLPW => ({ W: m.W.map((w) => [w[0], w[1]] as [number, number]), bh: [...m.bh], v: [...m.v], bo: m.bo });
export function initMLP(H: number, seed: number): MLPW {
  const r = rng(seed);
  return { W: Array.from({ length: H }, () => [gauss(r) * 0.9, gauss(r) * 0.9] as [number, number]), bh: Array.from({ length: H }, () => gauss(r) * 0.3), v: Array.from({ length: H }, () => gauss(r) * 0.5), bo: 0 };
}
export function mlpLoss(m: MLPW, pts: LP[]) {
  let L = 0, acc = 0;
  for (const p of pts) { const { p: q } = mlpForward(m, p.x, p.y); L -= p.c ? Math.log(Math.max(q, 1e-12)) : Math.log(Math.max(1 - q, 1e-12)); if ((q > 0.5 ? 1 : 0) === p.c) acc++; }
  return { loss: L / pts.length, acc: acc / pts.length };
}
/** Train and return snapshots at the requested epochs (sorted ascending, may include 0). */
export function trainMLP(pts: LP[], H: number, epochs: number[], lr = 0.05, seed = 1) {
  const m = initMLP(H, seed);
  const P = 3 * H + H + 1; // W (2H) + bh (H) + v (H) + bo (1)
  const mom = new Array(P).fill(0), vel = new Array(P).fill(0);
  const snaps: { epoch: number; m: MLPW; loss: number; acc: number }[] = [];
  const last = epochs[epochs.length - 1];
  let k = 0;
  for (let e = 0; e <= last; e++) {
    while (k < epochs.length && epochs[k] === e) { const s = mlpLoss(m, pts); snaps.push({ epoch: e, m: cloneMLP(m), ...s }); k++; }
    if (e === last) break;
    const g = new Array(P).fill(0);
    for (const p of pts) {
      const { h: hh, p: q } = mlpForward(m, p.x, p.y), d = (q - p.c) / pts.length;
      for (let j = 0; j < H; j++) {
        g[3 * H + j] += d * hh[j];
        const dh = d * m.v[j] * (1 - hh[j] * hh[j]);
        g[2 * j] += dh * p.x; g[2 * j + 1] += dh * p.y; g[2 * H + j] += dh;
      }
      g[4 * H] += d;
    }
    const t = e + 1;
    for (let q = 0; q < P; q++) {
      mom[q] = 0.9 * mom[q] + 0.1 * g[q]; vel[q] = 0.999 * vel[q] + 0.001 * g[q] * g[q];
      const step = (lr * (mom[q] / (1 - 0.9 ** t))) / (Math.sqrt(vel[q] / (1 - 0.999 ** t)) + 1e-8);
      if (q < 2 * H) m.W[q >> 1][q & 1] -= step;
      else if (q < 3 * H) m.bh[q - 2 * H] -= step;
      else if (q < 4 * H) m.v[q - 3 * H] -= step;
      else m.bo -= step;
    }
  }
  return snaps;
}

/* ---------- drawing helper: shaded decision regions ---------- */
const BG = [0x0b, 0x0e, 0x13];
function mix(hex: string, a: number) {
  const n = parseInt(hex.slice(1, 7), 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return '#' + c.map((v, k) => Math.round(BG[k] + (v - BG[k]) * clamp(a, 0, 1)).toString(16).padStart(2, '0')).join('');
}
/** Colours a grid of cells by a score function. `score` returns a probability-like value in [0,1] (0 → c0 colour, 1 → c1 colour). */
export function DecisionHeat({ s, score, nx = 60, ny = 34, c0, c1, strength = 0.35 }: { s: Scales; score: (x: number, y: number) => number; nx?: number; ny?: number; c0: string; c1: string; strength?: number }) {
  const [x0, x1] = s.sx.domain(), [ya, yb] = s.sy.domain(), y0 = Math.min(ya, yb), y1 = Math.max(ya, yb);
  const dx = (x1 - x0) / nx, dy = (y1 - y0) / ny;
  const cells = [];
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const cx = x0 + (i + 0.5) * dx, cy = y0 + (j + 0.5) * dy;
    let v = score(cx, cy); if (!isFinite(v)) v = 0.5;
    const X = s.sx(x0 + i * dx), Y = s.sy(y0 + (j + 1) * dy);
    // colours are pre-blended with the background so overlapping cells leave no seams
    cells.push(h('rect', { key: i * ny + j, x: X, y: Y, width: s.sx(x0 + (i + 1) * dx) - X + 0.7, height: s.sy(y0 + j * dy) - Y + 0.7, fill: mix(v >= 0.5 ? c1 : c0, strength * Math.min(1, Math.abs(v - 0.5) * 2.4) + 0.04) }));
  }
  return h('g', null, cells);
}

/** Line {(x,y): w·(x,y) + b = c} clipped to the plot's x-range (or drawn vertical). Returns endpoints in data coords. */
export function lineEnds(s: Scales, w: [number, number], b: number, c = 0): [number, number, number, number] | null {
  const [x0, x1] = s.sx.domain(), [ya, yb] = s.sy.domain();
  if (Math.abs(w[0]) < 1e-12 && Math.abs(w[1]) < 1e-12) return null;
  if (Math.abs(w[1]) > Math.abs(w[0]) * 1e-3) return [x0, (c - b - w[0] * x0) / w[1], x1, (c - b - w[0] * x1) / w[1]];
  const xv = (c - b) / w[0];
  return [xv, ya, xv, yb];
}
