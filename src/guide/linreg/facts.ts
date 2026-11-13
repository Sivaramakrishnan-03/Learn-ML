// Key numbers quoted in the chapter text, computed once from the data so prose and widgets always agree.
import { AD } from '../../lib/advertising';
import * as S from '../../lib/stats';

const y = AD.map((d) => d.sales);
const tv = AD.map((d) => d.tv), radio = AD.map((d) => d.radio), news = AD.map((d) => d.newspaper);
const Xfull = S.addConst([tv, radio, news]);
const full = S.ols(Xfull, y, ['const', 'TV', 'radio', 'newspaper']);
const Xtr = S.addConst([tv, radio]);
const tr = S.ols(Xtr, y, ['const', 'TV', 'radio']);
const Xfin = S.addConst([tv, radio, tv.map((v) => v * v), tv.map((v, i) => v * radio[i])]);
const fin = S.ols(Xfin, y, ['const', 'TV', 'radio', 'TV²', 'TV×radio']);

export const F = {
  n: AD.length,
  full, tr, fin,
  simpleNews: S.ols1(news, y),
  simpleTV: S.ols1(tv, y),
  corrRN: S.corr(radio, news),
  bp: S.breuschPagan(Xfull, full), white: S.white(Xfull, full), reset: S.reset(Xfull, y, full), rainbow: S.rainbow(Xfull, y, full),
  sw: S.shapiroWilk(full.resid), jb: S.jarqueBera(full.resid), dw: S.durbinWatson(full.resid),
  vif: S.vif(Xfull), cond: S.conditionNumber(Xfull),
  nested: S.nestedF(tr, full),
  boxcox: S.boxcoxLambda(y),
  hc3tr: S.robustSE(Xtr, tr, 'HC3'),
};
export const p = S.fmtP;
export const f3 = (v: number) => v.toFixed(3);
export const f4 = (v: number) => v.toFixed(4);
