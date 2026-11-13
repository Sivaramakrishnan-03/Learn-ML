// Synthetic data with switchable assumption violations, used by the assumption breaker,
// the diagnose-this-model exercises and the coverage simulation.
import { gauss, rng } from '../../lib/datasets';
import * as S from '../../lib/stats';

export type Violation = 'curve' | 'hetero' | 'outlier' | 'autocorr' | 'skew' | 'collinear';
export const VIOLATIONS: { id: Violation; label: string; assumption: string }[] = [
  { id: 'curve', label: 'Curvature', assumption: 'Linearity' },
  { id: 'hetero', label: 'Fanning variance', assumption: 'Equal variance' },
  { id: 'autocorr', label: 'Autocorrelated errors', assumption: 'Independence' },
  { id: 'skew', label: 'Skewed errors', assumption: 'Normality' },
  { id: 'outlier', label: 'Influential outliers', assumption: 'No undue influence' },
  { id: 'collinear', label: 'Collinear 2nd feature', assumption: 'No multicollinearity' },
];

export const TRUE_B0 = 2, TRUE_B1 = 1.5, TRUE_B2 = 0.8;

export interface SimData { x: number[]; x2?: number[]; y: number[]; X: S.Mat; names: string[] }

/** Generate one dataset. `on` = active violations, `sev` = severity 0..1. Rows are in time order. */
export function simulate(on: Set<Violation> | Violation[], sev = 0.7, n = 120, seed = 1): SimData {
  const act = new Set(on);
  const r = rng(seed);
  const x = Array.from({ length: n }, () => r() * 10).sort((a, b) => a - b);
  const rho = act.has('collinear') ? 0.9 + 0.095 * sev : 0;
  const x2 = act.has('collinear') ? x.map((v) => 5 + rho * (v - 5) + Math.sqrt(1 - rho * rho) * 2.887 * gauss(r)) : undefined;
  const phi = act.has('autocorr') ? 0.6 + 0.35 * sev : 0;
  let prev = 0;
  const y = x.map((xi, i) => {
    let z = gauss(r);
    if (act.has('skew')) { const ex = -Math.log(Math.max(r(), 1e-12)) - 1; z = (1 - sev) * z + sev * 1.6 * ex; }
    if (act.has('autocorr')) { z = phi * prev + Math.sqrt(1 - phi * phi) * z; prev = z; }
    const sd = act.has('hetero') ? 0.3 + sev * 0.45 * xi : 1.2;
    let yi = TRUE_B0 + TRUE_B1 * xi + sd * z;
    if (act.has('curve')) yi += sev * 0.35 * (xi - 5) ** 2 - sev * 0.35 * 8.33;
    if (x2) yi += TRUE_B2 * (x2[i] - 5);
    return yi;
  });
  if (act.has('outlier')) {
    const k = 3;
    for (let j = 0; j < k; j++) {
      const i = n - 1 - j * 2;
      y[i] -= 8 + 14 * sev;
    }
    y[5] += 6 + 6 * sev;
  }
  const X = x2 ? S.addConst([x, x2]) : S.addConst([x]);
  return { x, x2, y, X, names: x2 ? ['const', 'x', 'x2'] : ['const', 'x'] };
}

export interface Diagnostics { res: S.OLSResult; tests: { sw: S.TestResult; jb: S.TestResult; bp: S.TestResult; white: S.TestResult; dw: number; reset: S.TestResult; rainbow: S.TestResult }; vif: number[]; maxCook: number }
export function diagnose(X: S.Mat, y: number[], names?: string[]): Diagnostics {
  const res = S.ols(X, y, names);
  const inf = S.influence(X, res);
  return {
    res,
    tests: {
      sw: S.shapiroWilk(res.resid), jb: S.jarqueBera(res.resid), bp: S.breuschPagan(X, res), white: S.white(X, res),
      dw: S.durbinWatson(res.resid), reset: S.reset(X, y, res), rainbow: S.rainbow(X, y, res),
    },
    vif: X[0].length > 2 ? S.vif(X) : [1],
    maxCook: Math.max(...inf.cooks),
  };
}

/** Repeat the experiment many times: how often does the 95% CI for the slope contain the truth? */
export function coverage(on: Violation[], sev: number, reps = 300, n = 60) {
  let hit = 0, est = 0, seSum = 0;
  const ests: number[] = [];
  for (let s = 0; s < reps; s++) {
    const d = simulate(on, sev, n, 1000 + s);
    const res = S.ols(d.X, d.y);
    const b = res.beta[1];
    ests.push(b); est += b; seSum += res.se[1];
    if (res.ciLow[1] <= TRUE_B1 && TRUE_B1 <= res.ciHigh[1]) hit++;
  }
  const m = est / reps;
  const sdTrue = Math.sqrt(ests.reduce((a, v) => a + (v - m) ** 2, 0) / (reps - 1));
  return { coverage: hit / reps, meanEst: m, meanSE: seSum / reps, sdTrue, ests };
}
