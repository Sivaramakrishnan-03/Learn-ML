import { describe, it, expect } from 'vitest';
import * as M from '../src/viz/math';

describe('basics and descriptive statistics', () => {
  const a = [2, 4, 4, 4, 5, 5, 7, 9];
  it('mean, variance and sd with ddof', () => {
    expect(M.mean(a)).toBe(5);
    expect(M.mean([])).toBe(0);
    expect(M.variance(a)).toBe(4);
    expect(M.sd(a)).toBe(2);
    expect(M.sd(a, 1)).toBeCloseTo(2.138089935, 9);
    expect(M.sdS(a)).toBeCloseTo(2.138089935, 9);
    expect(M.sdS([3])).toBe(0);
    expect(M.sd([])).toBe(0);
  });
  it('quantiles match numpy linear interpolation, median averages the middle pair', () => {
    expect(M.quantile([1, 2, 3, 4], 0.25)).toBeCloseTo(1.75);
    expect(M.quantile([4, 1, 3, 2], 0.75)).toBeCloseTo(3.25);
    expect(M.quantileSorted([10, 20, 30], 0.5)).toBe(20);
    expect(M.median([5, 1, 3])).toBe(3);
    expect(M.median([4, 1, 3, 2])).toBe(2.5);
    expect(M.median([])).toBe(0);
    const b = M.boxStats([1, 2, 3, 4, 5, 6, 7, 8, 100]);
    expect(b.q1).toBe(3); expect(b.q3).toBe(7); expect(b.out).toEqual([100]); expect(b.wHi).toBe(8);
  });
  it('correlation, ranks, spearman, simple OLS line', () => {
    const x = [1, 2, 3, 4, 5];
    expect(M.corr(x, x.map((v) => 3 * v - 1))).toBeCloseTo(1, 12);
    expect(M.corr(x, x.map((v) => -v))).toBeCloseTo(-1, 12);
    expect(M.corr(x, [1, 1, 1, 1, 1])).toBe(0);
    expect(M.ranks([10, 30, 20, 20])).toEqual([1, 4, 2.5, 2.5]);
    expect(M.spearman(x, x.map((v) => v ** 3))).toBeCloseTo(1, 12);
    const l = M.olsLine(x, x.map((v) => 2 * v + 1));
    expect(l.a).toBeCloseTo(1, 12); expect(l.b).toBeCloseTo(2, 12);
  });
  it('error metrics', () => {
    expect(M.mse([1, 2, 3], [1, 2, 5])).toBeCloseTo(4 / 3);
    expect(M.rmse([0, 0], [3, 4])).toBeCloseTo(Math.sqrt(12.5));
    expect(M.mae([1, 2, 3], [2, 2, 1])).toBe(1);
    expect(M.r2([1, 2, 3], [1, 2, 3])).toBe(1);
    expect(M.r2([1, 2, 3], [2, 2, 2])).toBe(0);
  });
  it('sigmoid is clamped and symmetric', () => {
    expect(M.sigmoid(0)).toBe(0.5);
    expect(M.sigmoid(2) + M.sigmoid(-2)).toBeCloseTo(1, 15);
    expect(Number.isFinite(M.sigmoid(-1e6))).toBe(true);
  });
});

describe('histogram', () => {
  it('counts with a closed last bin', () => {
    const h = M.histogram([0, 0.5, 1, 1.5, 2], 0, 2, 2);
    expect(h).toEqual([{ x: 0.5, y: 2 }, { x: 1.5, y: 3 }]);
  });
  it('half-open bins drop the upper edge', () => {
    expect(M.histogram([0, 2], 0, 2, 2, { closed: false }).map((d) => d.y)).toEqual([1, 0]);
  });
  it('densities integrate to 1', () => {
    const r = M.rng(3), v = M.normalSample(r, 5000, 0, 1).filter((x) => Math.abs(x) < 5);
    const h = M.histogram(v, -5, 5, 50, { density: true });
    expect(h.reduce((s, d) => s + d.y * 0.2, 0)).toBeCloseTo(1, 10);
  });
});

describe('distributions (reference values from scipy.stats)', () => {
  it('normal', () => {
    expect(M.normCdf(1.96)).toBeCloseTo(0.9750021048517795, 9);
    expect(M.normCdf(0)).toBe(0.5);
    expect(M.normCdf(-1)).toBeCloseTo(0.15865525393145707, 9);
    expect(M.normCdf(110, 100, 10)).toBeCloseTo(0.8413447460685429, 9);
    expect(M.normPdf(0)).toBeCloseTo(0.3989422804014327, 12);
    expect(M.normPdf(12, 10, 2)).toBeCloseTo(0.12098536225957168, 12);
    expect(M.normInv(0.975)).toBeCloseTo(1.959963984540054, 9);
    expect(M.normInv(0.05, 50, 5)).toBeCloseTo(50 - 5 * 1.6448536269514722, 8);
    expect(M.twoSidedP(1.96)).toBeCloseTo(0.04999579029644087, 9);
  });
  it('Student t', () => {
    expect(M.tCdf(2.228138851986273, 10)).toBeCloseTo(0.975, 9);
    expect(M.tCdf(-1, 5)).toBeCloseTo(0.18160873382456127, 9);
    expect(M.tInv(0.975, 10)).toBeCloseTo(2.228138851986273, 8);
    expect(M.tInv(0.975, 1)).toBeCloseTo(12.706204736174707, 7);
    expect(M.tInv(0.95, 29)).toBeCloseTo(1.6991270265334977, 8);
    expect(M.tInv(0.025, 4)).toBeCloseTo(-2.7764451051977987, 8);
    expect(M.tPdf(0, 3)).toBeCloseTo(0.36755259694786135, 10);
    expect(M.tP2(2.0, 20)).toBeCloseTo(0.05926553544657044, 9);
  });
  it('chi-square', () => {
    expect(M.chi2Cdf(3.841458820694124, 1)).toBeCloseTo(0.95, 9);
    expect(M.chi2Sf(11.070497693516351, 5)).toBeCloseTo(0.05, 9);
    expect(M.chi2Cdf(2, 2)).toBeCloseTo(1 - Math.exp(-1), 12);
    expect(M.chi2Crit(0.05, 5)).toBeCloseTo(11.070497693516351, 7);
    expect(M.chi2Crit(0.01, 10)).toBeCloseTo(23.209251158954356, 7);
    expect(M.chi2Pdf(3, 4)).toBeCloseTo(0.16734762011132237, 10);
    expect(M.chi2Pdf(0, 2)).toBe(0.5);
    expect(M.chi2Pdf(0, 1)).toBe(0);
  });
  it('F', () => {
    expect(M.fSf(5.143252849784718, 2, 6)).toBeCloseTo(0.05, 9);
    expect(M.fCrit(0.05, 2, 6)).toBeCloseTo(5.143252849784718, 7);
    expect(M.fCrit(0.05, 3, 20)).toBeCloseTo(3.0983912121407795, 7);
    expect(M.fPdf(1, 5, 10)).toBeCloseTo(0.4954797834866395, 9);
    expect(M.fCdf(1, 5, 10)).toBeCloseTo(0.5348805734621996, 9);
  });
  it('discrete', () => {
    expect(M.binomPmf(2, 20, 0.1)).toBeCloseTo(0.28517980706429, 12);
    expect(M.binomPmfs(10, 0.3).reduce((s, v) => s + v, 0)).toBeCloseTo(1, 12);
    expect(M.poissonPmf(3, 2)).toBeCloseTo(0.18044704431548356, 12);
    expect(M.poissonPmfs(4, 60).reduce((s, v) => s + v, 0)).toBeCloseTo(1, 12);
    expect(M.poissonPmf(0, 0)).toBe(1);
    expect(M.logFact(5)).toBeCloseTo(Math.log(120), 12);
    expect(M.lgamma(10)).toBeCloseTo(Math.log(362880), 10);
  });
  it('special functions', () => {
    expect(M.erf(1)).toBeCloseTo(0.8427007929497149, 12);
    expect(M.gammaP(1, 1)).toBeCloseTo(1 - Math.exp(-1), 12);
    expect(M.betaI(0.5, 2, 2)).toBeCloseTo(0.5, 12);
  });
});

describe('linear algebra and solvers', () => {
  it('solve recovers x', () => {
    const A = [[2, 1, -1], [-3, -1, 2], [-2, 1, 2]], b = [8, -11, -3];
    M.solve(A, b).forEach((v, i) => expect(v).toBeCloseTo([2, 3, -1][i], 12));
  });
  it('OLS on exact data recovers the coefficients', () => {
    const rows = [[1, 1, 2], [1, 2, 1], [1, 3, 5], [1, 4, 3], [1, 5, 8]];
    const y = rows.map((r) => 1.5 + 2 * r[1] - 0.5 * r[2]);
    M.lstsq(rows, y).forEach((v, i) => expect(v).toBeCloseTo([1.5, 2, -0.5][i], 10));
    M.qrLstsq(rows, y, 1e-14).forEach((v, i) => expect(v).toBeCloseTo([1.5, 2, -0.5][i], 8));
  });
  it('ridge leaves the intercept alone unless asked', () => {
    const X = [[1, -1], [1, 0], [1, 1]], y = [0, 1, 2];
    const [b0, b1] = M.lstsq(X, y, 2);
    expect(b0).toBeCloseTo(1, 12); expect(b1).toBeCloseTo(0.5, 12); // slope 2/(2+2)
    expect(M.lstsq(X, y, 3, true)[0]).toBeCloseTo(0.5, 12); // 3/(3+3)
  });
  it('polyFit reproduces a cubic exactly', () => {
    const xs = [0, 1, 2, 3, 4, 5, 6], f = (x: number) => 1 - x + 0.5 * x * x - 0.1 * x ** 3;
    const g = M.polyFit(xs, xs.map(f), 3, 0, 6, 1e-14);
    [0.5, 2.5, 5.5].forEach((x) => expect(g(x)).toBeCloseTo(f(x), 8));
    expect(M.legendre(0.5, 2)).toEqual([1, 0.5, -0.125]);
    expect(M.chebyshev(0.5, 3)).toEqual([1, 0.5, -0.5, -1]);
  });
  it('ridge and lasso agree with OLS at λ = 0 and shrink otherwise', () => {
    const r = M.rng(7), n = 60;
    const x1 = M.normalSample(r, n, 0, 1), x2 = M.normalSample(r, n, 0, 1);
    const y = x1.map((v, i) => 3 * v - 2 * x2[i] + 0.1 * M.gauss(r));
    const { Z } = M.standardize([x1, x2]), yc = y.map((v) => v - M.mean(y));
    const ols = M.ridgeFit(Z, yc, 0), lasso0 = M.lassoFit(Z, yc, 0, 1, undefined, 2000);
    ols.forEach((v, i) => expect(lasso0[i]).toBeCloseTo(v, 5));
    const rid = M.ridgeFit(Z, yc, 1);
    expect(Math.hypot(...rid)).toBeLessThan(Math.hypot(...ols));
    expect(M.lassoFit(Z, yc, 100)).toEqual([0, 0]);
  });
  it('matrix helpers', () => {
    expect(M.matmul([[1, 2], [3, 4]], [[5, 6], [7, 8]])).toEqual([[19, 22], [43, 50]]);
    expect(M.transpose([[1, 2, 3]])).toEqual([[1], [2], [3]]);
    expect(M.matvec([[1, 2], [3, 4]], [1, 1])).toEqual([3, 7]);
    expect(M.det([[2, 1], [1, 3]])).toBe(5);
    expect(M.mv([[0, -1], [1, 0]], [1, 0])).toEqual([0, 1]);
  });
  it('2×2 eigen-decompositions', () => {
    const e = M.eig2([[2, 1], [1, 2]]);
    expect(e.map((d) => d.lam)).toEqual([3, 1]);
    expect(Math.abs(e[0].v[0])).toBeCloseTo(Math.SQRT1_2, 12);
    expect(M.eig2([[0, -1], [1, 0]])).toEqual([]);
    const s = M.eigSym2({ a: 2, b: 1, c: 2 });
    expect(s.l1).toBeCloseTo(3, 12); expect(s.l2).toBeCloseTo(1, 12); expect(s.ang).toBeCloseTo(Math.PI / 4, 12);
  });
  it('2-D covariance and bivariate normal', () => {
    const { mu, cov } = M.cov2([{ x: 0, y: 0 }, { x: 2, y: 2 }]);
    expect(mu).toEqual({ x: 1, y: 1 }); expect(cov).toEqual({ a: 1, b: 1, c: 1 });
    expect(M.normPdf2({ x: 0, y: 0 }, { x: 0, y: 0 }, { a: 1, b: 0, c: 1 })).toBeCloseTo(1 / (2 * Math.PI), 12);
  });
});

describe('small data generators', () => {
  it('are deterministic for a seed', () => {
    expect(M.permutation(10, 3)).toEqual(M.permutation(10, 3));
    expect([...M.permutation(10, 3)].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(M.sampleCurve((x) => x, 5, 0, 1, 0.1, 4)).toEqual(M.sampleCurve((x) => x, 5, 0, 1, 0.1, 4));
  });
  it('bootstrap counts add up to n', () => {
    const b = M.bootstrap(20, M.rng(1));
    expect(b.counts.reduce((s, v) => s + v, 0)).toBe(20);
    expect(M.tally(b.idx, 20)).toEqual(b.counts);
  });
  it('normal and Poisson samples have the right moments', () => {
    const r = M.rng(11), v = M.normalSample(r, 20000, 5, 2);
    expect(M.mean(v)).toBeCloseTo(5, 1); expect(M.sd(v)).toBeCloseTo(2, 1);
    const p = Array.from({ length: 20000 }, () => M.poissonDraw(3, r));
    expect(M.mean(p)).toBeCloseTo(3, 1);
    const d = Array.from({ length: 20000 }, () => M.drawDiscrete([0, 1], [0.25, 0.75], r));
    expect(M.mean(d)).toBeCloseTo(0.75, 1);
  });
});
