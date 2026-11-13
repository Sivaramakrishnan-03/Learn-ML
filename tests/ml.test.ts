import { describe, it, expect } from 'vitest';
import { ols, mse, r2, giniOf, kmeans, buildTree, predictTree, accuracy, linregGD } from '../src/lib/ml';
import { flats, customers, loans } from '../src/lib/datasets';

describe('ml helpers', () => {
  it('OLS recovers an exact line', () => {
    const pts = [1, 2, 3, 4].map((x) => ({ x, y: 2 * x + 1 }));
    const f = ols(pts);
    expect(f.m).toBeCloseTo(2); expect(f.b).toBeCloseTo(1);
    expect(mse(pts, f.m, f.b)).toBeCloseTo(0); expect(r2(pts, f.m, f.b)).toBeCloseTo(1);
  });
  it('gradient descent approaches OLS', () => {
    const pts = flats(30, 7), f = ols(pts), fr = linregGD(pts, 0.02, 2000);
    const last = fr[fr.length - 1];
    expect(Math.abs(last.m - f.m)).toBeLessThan(0.05);
  });
  it('Gini impurity', () => {
    expect(giniOf([10, 0])).toBe(0); expect(giniOf([5, 5])).toBeCloseTo(0.5); expect(giniOf([9, 1])).toBeCloseTo(0.18);
  });
  it('k-means inertia never increases across update steps', () => {
    const fr = kmeans(customers(90, 3, 11), 3, 4, 'random').filter((f) => f.phase === 'update');
    for (let i = 1; i < fr.length; i++) expect(fr[i].inertia).toBeLessThanOrEqual(fr[i - 1].inertia + 1e-9);
  });
  it('decision tree fits training data better as depth grows', () => {
    const pts = loans(80, 5);
    const acc = (d: number) => { const { root } = buildTree(pts, d, 1); return accuracy(pts, (q) => predictTree(root, q)); };
    expect(acc(4)).toBeGreaterThanOrEqual(acc(1));
  });
});
