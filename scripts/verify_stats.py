"""Compare src/lib/stats.ts against statsmodels/scipy. Usage: node <bundled verify-stats.js> | python verify_stats.py"""
import json, sys
import numpy as np, pandas as pd, statsmodels.api as sm
from scipy import stats
from statsmodels.stats import diagnostic as dg, outliers_influence as oi, stattools as st
J = json.load(sys.stdin); df = pd.DataFrame(J['data'])
X = sm.add_constant(df[['tv', 'radio', 'newspaper']]); y = df.sales
r = sm.OLS(y, X).fit(); inf = r.get_influence()
bad = 0
def chk(name, a, b, tol=1e-6):
    global bad
    a, b = np.atleast_1d(np.asarray(a, float)), np.atleast_1d(np.asarray(b, float))
    err = np.max(np.abs(a - b) / np.maximum(1, np.abs(b)))
    ok = err < tol; bad += not ok
    print(f"{'OK ' if ok else 'BAD'} {name:12s} max rel err {err:.2e}")
chk('beta', J['beta'], r.params); chk('se', J['se'], r.bse); chk('t', J['t'], r.tvalues); chk('p', J['p'], r.pvalues)
ci = r.conf_int(); chk('ciLow', J['ciLow'], ci[0]); chk('ciHigh', J['ciHigh'], ci[1])
chk('r2', J['r2'], r.rsquared); chk('adjR2', J['adjR2'], r.rsquared_adj); chk('F', J['F'], r.fvalue); chk('Fp', J['Fp'], r.f_pvalue, 1e-9)
chk('llf', J['llf'], r.llf); chk('aic', J['aic'], r.aic); chk('bic', J['bic'], r.bic)
for t in ['HC0', 'HC1', 'HC3']: chk(t, J[t.lower()], r.get_robustcov_results(t).bse)
bp = dg.het_breuschpagan(r.resid, X); chk('BP', [J['bp']['stat'], J['bp']['p']], bp[:2])
w = dg.het_white(r.resid, X); chk('White', [J['white']['stat'], J['white']['p']], w[:2])
chk('DW', J['dw'], st.durbin_watson(r.resid))
jb = st.jarque_bera(r.resid); chk('JB', [J['jb']['stat'], J['jb']['p']], jb[:2])
for key, n in [('sw', 200), ('sw20', 20), ('sw7', 7)]:
    s = stats.shapiro(np.asarray(r.resid)[:n]); chk('SW n=%d' % n, [J[key]['stat'], J[key]['p']], [s.statistic, s.pvalue], 1e-4)
rs = dg.linear_reset(r, power=3, use_f=True); chk('RESET', [J['reset']['stat'], J['reset']['p']], [rs.fvalue, rs.pvalue])
h = inf.hat_matrix_diag; idx = np.argsort(h, kind='stable')[:100]
sub = sm.OLS(y.values[idx], X.values[idx]).fit()
Frb = (r.ssr - sub.ssr) / 100 / (sub.ssr / sub.df_resid); chk('Rainbow', [J['rainbow']['stat'], J['rainbow']['p']], [Frb, stats.f.sf(Frb, 100, sub.df_resid)])
chk('VIF', J['vif'], [oi.variance_inflation_factor(X.values, i) for i in range(1, 4)]); chk('cond', J['cond'], r.condition_number)
chk('hat', J['h'], h[:5]); chk('stud', J['stud'], inf.resid_studentized_internal[:5]); chk('ext', J['ext'], inf.resid_studentized_external[:5])
chk('cooks', J['cooks'], inf.cooks_distance[0][:5]); chk('dffits', J['dffits'], inf.dffits[0][:5])
pr = r.get_prediction(np.array([[1, 100, 20, 30]])).summary_frame(alpha=0.05)
chk('CI', J['interval']['ci'], pr[['mean_ci_lower', 'mean_ci_upper']].values[0]); chk('PI', J['interval']['pi'], pr[['obs_ci_lower', 'obs_ci_upper']].values[0])
small = sm.OLS(y, sm.add_constant(df[['tv', 'radio']])).fit(); ft = r.compare_f_test(small)
chk('nestedF', [J['nested']['F'], J['nested']['p']], ft[:2]); chk('Cp', J['cp'], small.ssr / r.scale - len(y) + 2 * 3)
chk('boxcox', J['boxcox'], stats.boxcox(y)[1], 1e-4)
wr = sm.WLS(y, X, weights=1 / (0.25 + 0.0075 * df.tv) ** 2).fit(); chk('WLS', J['wls'], wr.params)
chk('tq', J['tq'], stats.t.ppf(0.975, 7)); chk('nq', J['nq'], stats.norm.ppf(0.01)); chk('chi2p', J['chi'], stats.chi2.sf(7.3, 3)); chk('Fp2', J['fp'], stats.f.sf(2.5, 3, 40))
from sklearn.linear_model import Ridge, Lasso, ElasticNet, LinearRegression
from sklearn.preprocessing import StandardScaler
Z = StandardScaler().fit_transform(df[['tv', 'radio', 'newspaper']])
for name, m in [('ridge', Ridge(alpha=10)), ('lasso', Lasso(alpha=0.3, tol=1e-12, max_iter=100000)), ('enet', ElasticNet(alpha=0.3, l1_ratio=0.5, tol=1e-12, max_iter=100000))]:
    m.fit(Z, y); chk(name, np.r_[J[name]['intercept'], J[name]['coef']], np.r_[m.intercept_, m.coef_], 1e-8)
rm = []
for te in J['folds']:
    tr = np.setdiff1d(np.arange(len(y)), te); lr = LinearRegression().fit(X.values[tr], y.values[tr]); rm.append(np.sqrt(np.mean((y.values[te] - lr.predict(X.values[te])) ** 2)))
chk('5-fold CV', J['cv'], np.mean(rm))
print('\n--- model summary (for content) ---'); print(r.summary().tables[1]); print('R2', r.rsquared, 'BP p', bp[1], 'RESET p', rs.pvalue, 'SW p', J['sw']['p'], 'DW', J['dw'])
ri = sm.OLS(y, sm.add_constant(pd.DataFrame({'tv': df.tv, 'radio': df.radio, 'tvxr': df.tv * df.radio}))).fit(); print('interaction R2', ri.rsquared, ri.pvalues.values)
print('corr\n', df.corr().round(3))
sys.exit(1 if bad else 0)
