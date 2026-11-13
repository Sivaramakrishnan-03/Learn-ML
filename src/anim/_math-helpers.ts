// Topic-specific helpers for the MATH FOUNDATIONS animations (vectors, matrix-ops, eigen, derivatives, gradients, gradient-descent, probability, random-variables).
// The maths (2-D vectors/matrices, eigenpairs, moments, discrete distributions and samplers) lives in src/viz/math.ts.
import type { ScaleLinear } from 'd3';
import { lerp, type M2, type V2 } from '../viz/math';

export const f2 = (v: number, d = 2) => (Math.abs(v) < 0.5 * 10 ** -d ? 0 : v).toFixed(d);

/** Plot height that gives 1 x-unit = 1 y-unit on screen (Plot padding: l52 r16 t14 b42). */
export const equalH = (x: [number, number], y: [number, number], W = 760) => Math.round(((W - 68) * (y[1] - y[0])) / (x[1] - x[0]) + 56);

/** Blend identity → A (used to animate a transformation smoothly). */
export const blendI = (A: M2, t: number): M2 => [[lerp(1, A[0][0], t), lerp(0, A[0][1], t)], [lerp(0, A[1][0], t), lerp(1, A[1][1], t)]];

/* ---------- contour lines (marching squares) ---------- */
export type Seg2 = [number, number, number, number];
export function contours(f: (x: number, y: number) => number, xr: [number, number], yr: [number, number], levels: number[], n = 60): Seg2[][] {
  const nx = n, ny = n;
  const xs = Array.from({ length: nx + 1 }, (_, i) => xr[0] + ((xr[1] - xr[0]) * i) / nx);
  const ys = Array.from({ length: ny + 1 }, (_, j) => yr[0] + ((yr[1] - yr[0]) * j) / ny);
  const g = ys.map((y) => xs.map((x) => f(x, y)));
  return levels.map((L) => {
    const segs: Seg2[] = [];
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const c: [number, number, number][] = [[xs[i], ys[j], g[j][i]], [xs[i + 1], ys[j], g[j][i + 1]], [xs[i + 1], ys[j + 1], g[j + 1][i + 1]], [xs[i], ys[j + 1], g[j + 1][i]]];
      const pts: [number, number][] = [];
      for (let k = 0; k < 4; k++) {
        const p = c[k], q = c[(k + 1) % 4];
        if ((p[2] < L) !== (q[2] < L)) { const t = (L - p[2]) / (q[2] - p[2]); pts.push([lerp(p[0], q[0], t), lerp(p[1], q[1], t)]); }
      }
      if (pts.length >= 2) segs.push([pts[0][0], pts[0][1], pts[1][0], pts[1][1]]);
      if (pts.length === 4) segs.push([pts[2][0], pts[2][1], pts[3][0], pts[3][1]]);
    }
    return segs;
  });
}
type Sc = { sx: ScaleLinear<number, number>; sy: ScaleLinear<number, number> };
export const segPath = (s: Sc, segs: Seg2[]) => segs.map(([a, b, c, d]) => `M${s.sx(a).toFixed(1)},${s.sy(b).toFixed(1)}L${s.sx(c).toFixed(1)},${s.sy(d).toFixed(1)}`).join('');
export const polyPath = (s: Sc, pts: V2[], close = false) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${s.sx(x).toFixed(1)},${s.sy(y).toFixed(1)}`).join('') + (close ? 'Z' : '');
