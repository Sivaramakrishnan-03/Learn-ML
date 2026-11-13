// Runnable Python for the Linear Regression guide. Every snippet is executed by scripts/verify_snippets.py.
// In the browser, AD_CSV (the Advertising data as CSV text) is injected by CodeLab before running.
import { Snippet } from '../../components/CodeLab';
import { adCsv } from '../../lib/advertising';

const LOAD = `import io
import numpy as np
import pandas as pd
df = pd.read_csv(io.StringIO(AD_CSV))   # locally: df = pd.read_csv("advertising.csv")
`;
const g = () => ({ AD_CSV: adCsv() });
const mk = (title: string, body: string, packages: string[] = []): Snippet => ({ title, code: LOAD + body, packages, globals: g() });
const SM = ['statsmodels', 'scipy'];

export const CODE: Record<string, Snippet[]> = {
  explore: [mk('First look (pandas)', `
print(df.shape)
print(df.head())
print()
print(df.describe().round(1))
print()
print("Correlation with sales:")
print(df.corr()["sales"].round(3).sort_values(ascending=False))
`)],

  scratch: [mk('OLS from scratch (NumPy)', `
from scipy import stats

X = np.column_stack([np.ones(len(df)), df[["TV", "radio", "newspaper"]].to_numpy()])
y = df["sales"].to_numpy()
n, k = X.shape

# 1) Normal equations: (X'X) b = X'y   (solve, never invert explicitly in production)
beta = np.linalg.solve(X.T @ X, X.T @ y)

# 2) Residuals and the unbiased error variance  s^2 = SSR / (n - k)
resid = y - X @ beta
s2 = resid @ resid / (n - k)

# 3) Var(beta_hat) = s^2 (X'X)^-1  ->  standard errors, t statistics, p-values
cov = s2 * np.linalg.inv(X.T @ X)
se = np.sqrt(np.diag(cov))
t = beta / se
p = 2 * stats.t.sf(np.abs(t), df=n - k)

for name, b, s, tt, pp in zip(["const", "TV", "radio", "newspaper"], beta, se, t, p):
    print(f"{name:10s} coef={b:8.4f}  se={s:.4f}  t={tt:7.2f}  p={pp:.4f}")
r2 = 1 - resid @ resid / np.sum((y - y.mean()) ** 2)
print(f"R^2 = {r2:.4f}")
`, ['scipy']),
  mk('Same thing with statsmodels', `
import statsmodels.formula.api as smf
res = smf.ols("sales ~ TV + radio + newspaper", data=df).fit()
print(res.summary())
`, SM)],

  qr: [mk('Why solvers use QR, not (X\'X)^-1', `
X = np.column_stack([np.ones(len(df)), df[["TV", "radio", "newspaper"]].to_numpy()])
y = df["sales"].to_numpy()

Q, R = np.linalg.qr(X)                 # X = QR, Q orthonormal, R upper-triangular
beta_qr = np.linalg.solve(R, Q.T @ y)  # R b = Q'y : no X'X, so the condition number is not squared
beta_ne = np.linalg.solve(X.T @ X, X.T @ y)
print("QR      :", beta_qr.round(6))
print("normal  :", beta_ne.round(6))
print("cond(X)   =", round(np.linalg.cond(X), 1))
print("cond(X'X) =", round(np.linalg.cond(X.T @ X), 1), " <- squared!")
`)],

  tests: [mk('All assumption tests', `
import statsmodels.formula.api as smf
from statsmodels.stats import diagnostic as dg, stattools as st
from scipy import stats

res = smf.ols("sales ~ TV + radio + newspaper", data=df).fit()
e, X = res.resid, res.model.exog

print("Normality")
print("  Shapiro-Wilk  W=%.4f  p=%.4f" % stats.shapiro(e))
jb, jbp, skew, kurt = st.jarque_bera(e)
print("  Jarque-Bera  JB=%.3f  p=%.4f  (skew %.2f, kurtosis %.2f)" % (jb, jbp, skew, kurt))

print("Constant variance")
lm, lmp, _, _ = dg.het_breuschpagan(e, X)
print("  Breusch-Pagan LM=%.3f  p=%.4f" % (lm, lmp))
lm, lmp, _, _ = dg.het_white(e, X)
print("  White         LM=%.3f  p=%.4f" % (lm, lmp))

print("Independence")
print("  Durbin-Watson d=%.3f  (2 = no autocorrelation)" % st.durbin_watson(e))

print("Functional form (linearity)")
r = dg.linear_reset(res, power=3, use_f=True)
print("  Ramsey RESET  F=%.3f  p=%.6f" % (r.fvalue, r.pvalue))

# Utts' Rainbow test: refit on the central half of the data (lowest leverage)
h = res.get_influence().hat_matrix_diag
mid = np.argsort(h)[: len(df) // 2]
sub = smf.ols("sales ~ TV + radio + newspaper", data=df.iloc[mid]).fit()
d1, d2 = len(df) - len(mid), sub.df_resid
F = ((res.ssr - sub.ssr) / d1) / (sub.ssr / d2)
print("  Rainbow       F=%.3f  p=%.4f" % (F, stats.f.sf(F, d1, d2)))
`, SM)],

  vif: [mk('Correlation, VIF, condition number', `
import statsmodels.api as sm
from statsmodels.stats.outliers_influence import variance_inflation_factor

feats = df[["TV", "radio", "newspaper"]]
print(feats.corr().round(3))
X = sm.add_constant(feats)            # VIF must be computed WITH the constant
vif = pd.Series([variance_inflation_factor(X.values, i) for i in range(1, X.shape[1])], index=feats.columns)
print()
print("VIF:")
print(vif.round(2))
print("Condition number:", round(np.linalg.cond(X), 1))

# Now create real collinearity: a near-copy of radio
df2 = feats.assign(radio_copy=feats.radio * 1.02 + np.random.default_rng(0).normal(0, 1, len(df)))
X2 = sm.add_constant(df2)
print()
print("With a near-duplicate column:")
print(pd.Series([variance_inflation_factor(X2.values, i) for i in range(1, X2.shape[1])], index=df2.columns).round(1))
`, SM)],

  influence: [mk('Leverage, Cook\'s D, DFFITS', `
import statsmodels.formula.api as smf

res = smf.ols("sales ~ TV + radio + newspaper", data=df).fit()
inf = res.get_influence()
n, k = len(df), int(res.df_model) + 1
tab = pd.DataFrame({
    "leverage": inf.hat_matrix_diag,
    "student_resid": inf.resid_studentized_external,
    "cooks_d": inf.cooks_distance[0],
    "dffits": inf.dffits[0],
})
print("Rules of thumb: leverage > %.3f, |t| > 3, Cook's D > %.3f, |DFFITS| > %.3f" % (2 * k / n, 4 / n, 2 * np.sqrt(k / n)))
print(tab.sort_values("cooks_d", ascending=False).head(6).round(3))

# Does the conclusion change without the top 3 influential points?
drop = tab.cooks_d.nlargest(3).index
res2 = smf.ols("sales ~ TV + radio + newspaper", data=df.drop(drop)).fit()
print()
print(pd.DataFrame({"all": res.params, "without top-3": res2.params}).round(4))
`, SM)],

  inference: [mk('Tests, ANOVA, nested models', `
import statsmodels.formula.api as smf
from statsmodels.stats.anova import anova_lm

full = smf.ols("sales ~ TV + radio + newspaper", data=df).fit()
small = smf.ols("sales ~ TV + radio", data=df).fit()

print(full.summary().tables[1])
print()
print("Overall F = %.1f, p = %.3g" % (full.fvalue, full.f_pvalue))
print()
print("ANOVA (Type I, sequential):")
print(anova_lm(full).round(4))
print()
F, p, dfd = full.compare_f_test(small)
print("Partial F (does newspaper add anything?): F=%.3f p=%.4f" % (F, p))
print("Joint test radio = newspaper = 0:")
print(full.f_test("radio = 0, newspaper = 0"))
`, SM)],

  remedies: [mk('Robust SEs, WLS, Box-Cox', `
import statsmodels.formula.api as smf
from scipy import stats

ols = smf.ols("sales ~ TV + radio", data=df).fit()
hc3 = smf.ols("sales ~ TV + radio", data=df).fit(cov_type="HC3")
print(pd.DataFrame({"coef": ols.params, "se_classic": ols.bse, "se_HC3": hc3.bse}).round(4))

# WLS: estimate how the spread grows with TV, weight each point by 1/variance
aux = smf.ols("np.abs(resid) ~ TV", data=df.assign(resid=ols.resid)).fit()
w = 1 / aux.fittedvalues.clip(lower=0.05) ** 2
wls = smf.wls("sales ~ TV + radio", data=df, weights=w).fit()
print()
print("WLS:")
print(wls.params.round(4))

lam = stats.boxcox(df.sales)[1]
print()
print("Box-Cox lambda (MLE) = %.3f   (1 = no transform, 0.5 = sqrt, 0 = log)" % lam)
`, SM)],

  predict: [mk('Confidence vs prediction intervals', `
import statsmodels.formula.api as smf

res = smf.ols("sales ~ TV + radio", data=df).fit()
plan = pd.DataFrame({"TV": [50, 150, 250], "radio": [10, 25, 40]})
pred = res.get_prediction(plan).summary_frame(alpha=0.05)
print(pd.concat([plan, pred[["mean", "mean_ci_lower", "mean_ci_upper", "obs_ci_lower", "obs_ci_upper"]].round(2)], axis=1))
print()
print("CI = where the AVERAGE sales of all markets with this budget lie.")
print("PI = where ONE new market's sales will lie (always wider).")
`, SM)],

  metrics: [mk('Metrics (scikit-learn)', `
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error, mean_absolute_percentage_error

X, y = df[["TV", "radio", "newspaper"]], df["sales"]
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, random_state=42)
m = LinearRegression().fit(Xtr, ytr)
p = m.predict(Xte)
n, k = len(yte), X.shape[1]
r2 = r2_score(yte, p)
print("R2     %.3f" % r2)
print("adj R2 %.3f" % (1 - (1 - r2) * (n - 1) / (n - k - 1)))
print("RMSE   %.3f (k units)" % mean_squared_error(yte, p) ** 0.5)
print("MAE    %.3f (k units)" % mean_absolute_error(yte, p))
print("MAPE   %.1f %%" % (100 * mean_absolute_percentage_error(yte, p)))
`)],

  selection: [mk('Best subset by AIC / BIC', `
import itertools
import statsmodels.formula.api as smf

d = df.assign(TV2=df.TV ** 2, TVxradio=df.TV * df.radio)
cands = ["TV", "radio", "newspaper", "TV2", "TVxradio"]
rows = []
for r in range(1, len(cands) + 1):
    for combo in itertools.combinations(cands, r):
        m = smf.ols("sales ~ " + " + ".join(combo), data=d).fit()
        rows.append({"model": " + ".join(combo), "k": r, "adjR2": m.rsquared_adj, "AIC": m.aic, "BIC": m.bic})
tab = pd.DataFrame(rows)
print(tab.sort_values("BIC").head(8).round(3).to_string(index=False))
`, SM),
  mk('Forward stepwise (and why to be careful)', `
import statsmodels.formula.api as smf

d = df.assign(TV2=df.TV ** 2, TVxradio=df.TV * df.radio)
rng = np.random.default_rng(1)
for j in range(10):                     # 10 pure-noise columns
    d[f"noise{j}"] = rng.normal(size=len(d))
pool = [c for c in d.columns if c != "sales"]
chosen, best = [], np.inf
while pool:
    scores = {c: smf.ols("sales ~ " + " + ".join(chosen + [c]), data=d).fit().aic for c in pool}
    c, a = min(scores.items(), key=lambda kv: kv[1])
    if a >= best: break
    chosen.append(c); pool.remove(c); best = a
    print(f"add {c:10s} AIC={a:8.2f}")
print("selected:", chosen)
print("Noise columns that slipped in:", [c for c in chosen if c.startswith("noise")])
`, SM)],

  cv: [mk('Cross-validation & learning curve', `
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import KFold, cross_val_score, learning_curve
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import PolynomialFeatures

X, y = df[["TV", "radio"]], df["sales"]
cv = KFold(n_splits=5, shuffle=True, random_state=1)
for deg in [1, 2, 3, 5, 8]:
    model = make_pipeline(PolynomialFeatures(deg), LinearRegression())
    rmse = -cross_val_score(model, X, y, cv=cv, scoring="neg_root_mean_squared_error")
    print(f"degree {deg}: CV RMSE = {rmse.mean():.3f} +/- {rmse.std():.3f}")

sizes, tr, va = learning_curve(make_pipeline(PolynomialFeatures(2), LinearRegression()), X, y, cv=cv,
                               train_sizes=[0.1, 0.25, 0.5, 0.75, 1.0], scoring="neg_root_mean_squared_error")
print()
for s, a, b in zip(sizes, -tr.mean(1), -va.mean(1)):
    print(f"n_train={s:3d}  train RMSE={a:.3f}  validation RMSE={b:.3f}")
`)],

  features: [mk('Dummies, interactions, polynomials', `
import statsmodels.formula.api as smf

# A categorical feature: region (made up for the demo)
rng = np.random.default_rng(3)
d = df.assign(region=rng.choice(["North", "South", "West"], size=len(df)))
d["sales"] = d.sales + d.region.map({"North": 0.0, "South": 0.8, "West": -0.5})

m1 = smf.ols("sales ~ TV + radio + C(region)", data=d).fit()   # drops one level = baseline
print(m1.params.round(3))
print()
m2 = smf.ols("sales ~ TV * radio", data=df).fit()               # TV + radio + TV:radio
print("Interaction model R2 = %.3f" % m2.rsquared)
print(m2.params.round(5))
print()
m3 = smf.ols("sales ~ TV + I(TV**2) + radio + TV:radio", data=df).fit()
print("+ curvature R2 = %.3f, adj R2 = %.3f" % (m3.rsquared, m3.rsquared_adj))
`, SM)],

  gd: [mk('Batch GD, SGD vs closed form', `
X = df[["TV", "radio"]].to_numpy()
y = df["sales"].to_numpy()
Xs = (X - X.mean(0)) / X.std(0)            # scaling makes the loss bowl round
A = np.column_stack([np.ones(len(y)), Xs])

closed = np.linalg.lstsq(A, y, rcond=None)[0]

w, lr = np.zeros(3), 0.1                   # batch gradient descent
for it in range(500):
    grad = 2 / len(y) * A.T @ (A @ w - y)
    w -= lr * grad
print("closed form:", closed.round(4))
print("batch GD   :", w.round(4))

rng = np.random.default_rng(0)             # stochastic gradient descent (one row at a time)
w = np.zeros(3)
for epoch in range(30):
    for i in rng.permutation(len(y)):
        g = 2 * A[i] * (A[i] @ w - y[i])
        w -= 0.01 / (1 + epoch) * g
print("SGD        :", w.round(4))
`)],

  regularization: [mk('RidgeCV, LassoCV, ElasticNetCV', `
from sklearn.linear_model import RidgeCV, LassoCV, ElasticNetCV, LinearRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import KFold, cross_val_score

rng = np.random.default_rng(7)
X = df[["TV", "radio", "newspaper"]].assign(TV2=df.TV ** 2, TVxradio=df.TV * df.radio)
for j in range(10):
    X[f"noise{j}"] = rng.normal(size=len(df))
y = df.sales
cv = KFold(5, shuffle=True, random_state=0)
alphas = np.logspace(-3, 2, 60)
models = {
    "OLS": LinearRegression(),
    "Ridge": RidgeCV(alphas=alphas),
    "Lasso": LassoCV(alphas=alphas, max_iter=50000),
    "ElasticNet": ElasticNetCV(alphas=alphas, l1_ratio=[0.2, 0.5, 0.8], max_iter=50000),
}
for name, m in models.items():
    pipe = make_pipeline(StandardScaler(), m)
    rmse = -cross_val_score(pipe, X, y, cv=cv, scoring="neg_root_mean_squared_error").mean()
    pipe.fit(X, y)
    est = pipe[-1]
    extra = f"alpha={est.alpha_:.4f}" if hasattr(est, "alpha_") else ""
    nz = int(np.sum(np.abs(est.coef_) > 1e-6))
    print(f"{name:10s} CV RMSE={rmse:.3f}  non-zero coefs={nz:2d}/{X.shape[1]}  {extra}")
lasso = make_pipeline(StandardScaler(), LassoCV(alphas=alphas, cv=cv, max_iter=50000)).fit(X, y)[-1]
print()
print("Lasso at min-CV alpha keeps:", list(X.columns[np.abs(lasso.coef_) > 1e-6]))

# The "1-SE rule": the simplest model whose CV error is within one standard error of the best
mse = lasso.mse_path_.mean(1)
se = lasso.mse_path_.std(1) / np.sqrt(lasso.mse_path_.shape[1])
a1se = lasso.alphas_[np.where(mse <= mse.min() + se[mse.argmin()])[0].min()]
from sklearn.linear_model import Lasso
l1se = make_pipeline(StandardScaler(), Lasso(alpha=a1se, max_iter=50000)).fit(X, y)[-1]
print("Lasso at 1-SE alpha=%.3f keeps:" % a1se, list(X.columns[np.abs(l1se.coef_) > 1e-6]))
`)],

  pipeline: [mk('End-to-end pipeline', `
import statsmodels.formula.api as smf
from statsmodels.stats import diagnostic as dg
from sklearn.model_selection import train_test_split

train, test = train_test_split(df, test_size=0.25, random_state=7)

# 1. Baseline
m0 = smf.ols("sales ~ TV + radio + newspaper", data=train).fit()
print("baseline adjR2=%.3f  newspaper p=%.3f" % (m0.rsquared_adj, m0.pvalues["newspaper"]))
# 2. Diagnose
print("RESET p=%.2g  Breusch-Pagan p=%.2g" % (dg.linear_reset(m0, power=3, use_f=True).pvalue, dg.het_breuschpagan(m0.resid, m0.model.exog)[1]))
# 3. Fix functional form + drop newspaper, robust SEs for heteroscedasticity
m1 = smf.ols("sales ~ TV + I(TV**2) + radio + TV:radio", data=train).fit(cov_type="HC3")
print("final adjR2=%.3f  AIC %.1f -> %.1f" % (m1.rsquared_adj, m0.aic, m1.aic))
print(m1.summary().tables[1])
# 4. Validate on untouched test data
for name, m in [("baseline", m0), ("final", m1)]:
    err = test.sales - m.predict(test)
    print("%-8s test RMSE=%.3f  MAE=%.3f" % (name, np.sqrt(np.mean(err ** 2)), np.mean(np.abs(err))))
`, SM)],
};
