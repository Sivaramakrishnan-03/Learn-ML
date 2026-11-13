// Dumps stats.ts results on the Advertising data as JSON; scripts/verify_stats.py compares with statsmodels.
import { AD } from '../src/lib/advertising';
import * as S from '../src/lib/stats';
const y = AD.map((d) => d.sales);
const X = S.addConst([AD.map((d) => d.tv), AD.map((d) => d.radio), AD.map((d) => d.newspaper)]);
const res = S.ols(X, y);
const inf = S.influence(X, res);
const small = S.ols(S.addConst([AD.map((d) => d.tv), AD.map((d) => d.radio)]), y);
const out: Record<string, unknown> = {
  data: AD,
  beta: res.beta, se: res.se, t: res.t, p: res.p, ciLow: res.ciLow, ciHigh: res.ciHigh,
  r2: res.r2, adjR2: res.adjR2, F: res.F, Fp: res.Fp, llf: res.llf, aic: res.aic, bic: res.bic,
  hc3: S.robustSE(X, res, 'HC3'), hc1: S.robustSE(X, res, 'HC1'), hc0: S.robustSE(X, res, 'HC0'),
  bp: S.breuschPagan(X, res), white: S.white(X, res), dw: S.durbinWatson(res.resid),
  jb: S.jarqueBera(res.resid), sw: S.shapiroWilk(res.resid), sw20: S.shapiroWilk(res.resid.slice(0, 20)), sw7: S.shapiroWilk(res.resid.slice(0, 7)),
  reset: S.reset(X, y, res, 3), rainbow: S.rainbow(X, y, res),
  vif: S.vif(X), cond: S.conditionNumber(X),
  h: inf.h.slice(0, 5), stud: inf.stud.slice(0, 5), ext: inf.ext.slice(0, 5), cooks: inf.cooks.slice(0, 5), dffits: inf.dffits.slice(0, 5),
  interval: S.intervals(res, [1, 100, 20, 30]),
  nested: S.nestedF(small, res), cp: S.mallowsCp(small, res),
  boxcox: S.boxcoxLambda(y),
  wls: S.wls(X, y, AD.map((d) => 1 / (0.25 + 0.0075 * d.tv) ** 2)).beta,
  tq: S.tQuantile(0.975, 7), nq: S.normQuantile(0.01), chi: S.chi2Pvalue(7.3, 3), fp: S.fPvalue(2.5, 3, 40),
};
const Zs = S.standardize([AD.map((d) => d.tv), AD.map((d) => d.radio), AD.map((d) => d.newspaper)]);
Object.assign(out, { ridge: S.ridge(Zs.Z, y, 10), lasso: S.elasticNet(Zs.Z, y, 0.3, 1), enet: S.elasticNet(Zs.Z, y, 0.3, 0.5),
  cv: S.crossVal(X, y, 5, S.olsFit, 1).rmse, folds: S.kfold(200, 5, 1) });
console.log(JSON.stringify(out));
