// Chapters 9–12: inference, remedies, prediction, metrics.
import { Tex } from '../../components/Tex';
import { CodeLab } from '../../components/CodeLab';
import { Callout, CoefTable, Deep } from '../ui';
import { CODE } from './code';
import { F, f3, f4, p } from './facts';
import { Playground } from './widgets1';
import { AnovaWidget, BoxCoxProfile, MetricsLab, PredictCalc, RemedyLab, TTestWidget } from './widgets3';

export function Ch9() {
  return <>
    <Callout kind="story" title="Analogy: the courtroom">
      <p>A hypothesis test is a trial. The defendant (the coefficient) is presumed innocent, meaning <Tex>{'H_0: \\beta_j = 0'}</Tex>, "this feature does nothing". The data is the evidence. The p-value answers: <i>if the defendant were innocent, how surprising would this evidence be?</i> A tiny p-value means a conviction ("statistically significant"). A large one means acquittal, which is <b>not</b> a declaration of innocence. Absence of evidence isn't evidence of absence.</p>
    </Callout>
    <h3>The output every analyst must be able to read</h3>
    <CoefTable res={F.full} caption="statsmodels-style summary: sales ~ TV + radio + newspaper" />
    <ul>
      <li><b>coef</b>: the estimate. Radio: each extra $1k goes with {f3(F.full.beta[2])}k more units, <i>holding TV and newspaper fixed</i>.</li>
      <li><b>std err</b>: the estimate's uncertainty (Chapter 3's formula).</li>
      <li><b>t = coef / SE</b>: how many standard errors the estimate is from zero.</li>
      <li><b>P&gt;|t|</b>: two-sided p-value from the <Tex>{'t_{n-k}'}</Tex> distribution.</li>
      <li><b>[0.025, 0.975]</b>: the 95% confidence interval <Tex>{'\\hat\\beta_j \\pm t_{0.975,\\,n-k}\\cdot \\text{SE}'}</Tex>. If it excludes 0, p &lt; 0.05.</li>
    </ul>
    <TTestWidget />
    <h3>The overall F-test</h3>
    <p>"Does the model explain anything at all?" tests all slopes = 0 jointly:</p>
    <div className="eq"><Tex block>{'F = \\frac{(\\text{SST} - \\text{SSE})/(k-1)}{\\text{SSE}/(n-k)} = \\frac{R^2/(k-1)}{(1-R^2)/(n-k)} \\sim F_{k-1,\\,n-k}'}</Tex></div>
    <p>Here F = {F.full.F.toFixed(1)}, p ≈ {F.full.Fp.toExponential(1)}. Advertising clearly relates to sales. That answers the CMO's question 1.</p>
    <h3>Partial F-tests and ANOVA</h3>
    <p>To test a <i>group</i> of coefficients (all region dummies, or newspaper and radio together), compare a restricted model against the full one:</p>
    <div className="eq"><Tex block>{'F = \\frac{(\\text{SSE}_R - \\text{SSE}_F)/q}{\\text{SSE}_F/(n-k_F)} \\sim F_{q,\\,n-k_F}'}</Tex></div>
    <AnovaWidget />
    <Callout kind="biz" title="The newspaper paradox, solved">
      <p>On its own, newspaper is "significant" (simple-regression p = {p(F.simpleNews.p[1])}). In the multiple regression it isn't (p = {p(F.full.p[3])}). Newspaper spend correlates {f3(F.corrRN)} with radio spend: markets that buy radio also buy newspaper. Alone, newspaper takes credit for radio's work. Recommendation for the CMO: <b>newspaper shows no incremental association with sales</b>, so it's a candidate for budget reallocation, ideally confirmed by an experiment.</p>
    </Callout>
    <Callout kind="warn" title="p-value hygiene">
      <ul style={{ marginBottom: 0 }}>
        <li>A p-value is <b>not</b> the probability that H₀ is true, and not the probability the result is due to chance.</li>
        <li><b>Statistical ≠ practical significance.</b> With n = 1 million, a coefficient worth 0.0001 units is "significant". Report effect sizes and CIs.</li>
        <li><b>Multiple testing:</b> test 20 useless features at α = 0.05 and expect one "discovery". Use Bonferroni or Benjamini–Hochberg, or pre-register the hypotheses.</li>
        <li>The tests assume the model was <b>specified before looking at the data</b> (see stepwise, Chapter 13).</li>
      </ul>
    </Callout>
    <Deep title="Confidence intervals for linear combinations and joint confidence regions">
      <p>For any contrast <Tex>{'c^\\top\\beta'}</Tex>, for example "effect of shifting $10k from newspaper to radio" with <Tex>{'c = (0, 0, 10, -10)'}</Tex>, the estimate is <Tex>{'c^\\top\\hat\\beta'}</Tex> with <Tex>{'\\text{SE} = \\hat\\sigma\\sqrt{c^\\top(X^\\top X)^{-1}c}'}</Tex>. Individual 95% CIs don't give 95% joint coverage. The joint region for several coefficients is an ellipse, <Tex>{'(\\hat\\beta-\\beta)^\\top X^\\top X(\\hat\\beta-\\beta) \\le k\\hat\\sigma^2F_{k,n-k,0.95}'}</Tex>, tilted when the features are correlated (you saw it as the cloud in Chapter 7).</p>
    </Deep>
    <CodeLab snippets={CODE.inference} />
  </>;
}

export function Ch10() {
  return <>
    <Callout kind="story" title="Analogy: treat the disease, not the fever">
      <p>Robust standard errors are paracetamol: they make the fever (wrong SEs) go away, whatever the cause. Adding the right terms to the model cures the infection. Good modellers first ask <b>why</b> an assumption failed. A funnel often means the effect is multiplicative (use logs). A curve means a missing term. Only then do they reach for the generic fixes.</p>
    </Callout>
    <h3>The remedy menu</h3>
    <div className="tbl-wrap"><table className="tbl">
      <thead><tr><th>Problem</th><th>Remedies</th><th>Trade-off</th></tr></thead>
      <tbody>
        <tr><td>Non-linearity</td><td>Polynomial / spline terms, interactions, log(x), GAMs</td><td>More parameters; interpret marginal effects, not raw coefficients</td></tr>
        <tr><td>Heteroscedasticity</td><td><b>HC robust SEs</b> (HC0–HC3), <b>WLS</b>, log or Box–Cox on y</td><td>HC: same β, honest SEs, no efficiency gain. WLS: efficient if the weights are right. Transform: changes what β means.</td></tr>
        <tr><td>Autocorrelation</td><td><b>HAC (Newey–West)</b> SEs, lagged terms, GLS / ARIMA errors</td><td>HAC needs a bandwidth; modelling the dynamics is better</td></tr>
        <tr><td>Non-normal errors</td><td>Often nothing (large n); transform y; GLMs (Poisson, Gamma); bootstrap CIs</td><td>Transforms change the scale of interpretation</td></tr>
        <tr><td>Outliers</td><td>Investigate; Huber / RANSAC robust regression; quantile regression</td><td>Robust fits are less efficient when the data is clean</td></tr>
      </tbody>
    </table></div>
    <RemedyLab />
    <h3>Heteroscedasticity-consistent (sandwich) standard errors</h3>
    <div className="eq"><Tex block>{'\\widehat{\\operatorname{Var}}_{HC}(\\hat\\beta) = \\underbrace{(X^\\top X)^{-1}}_{\\text{bread}}\\;\\underbrace{X^\\top \\operatorname{diag}(\\omega_i)\\,X}_{\\text{meat}}\\;\\underbrace{(X^\\top X)^{-1}}_{\\text{bread}}, \\qquad \\omega_i = \\begin{cases} e_i^2 & \\text{HC0 (White)}\\\\ \\tfrac{n}{n-k}e_i^2 & \\text{HC1 (Stata default)}\\\\ e_i^2/(1-h_{ii})^2 & \\text{HC3 (best for small n)}\\end{cases}'}</Tex></div>
    <p>Instead of assuming a common σ², each observation contributes its own squared residual. For sales ~ TV + radio, the TV standard error goes from {f4(F.tr.se[1])} (classical) to {f4(F.hc3tr[1])} (HC3), about {((F.hc3tr[1] / F.tr.se[1] - 1) * 100).toFixed(0)}% wider. The classical SE was overconfident.</p>
    <h3>Weighted least squares</h3>
    <p>If you know (or can model) how the variance changes, <Tex>{'\\operatorname{Var}(\\varepsilon_i) = \\sigma^2/w_i'}</Tex>, minimise <Tex>{'\\sum w_i e_i^2'}</Tex>: <Tex>{'\\hat\\beta_{WLS} = (X^\\top WX)^{-1}X^\\top Wy'}</Tex>. Noisy observations get less say. This is BLUE again, when the weights are right. Typical weights: 1/(group size) for averages, 1/(fitted variance) from an auxiliary regression.</p>
    <h3>Transforming y: log and Box–Cox</h3>
    <p>When the noise is proportional to the level (common for sales, prices, incomes), <b>log(y)</b> stabilises the variance and turns effects into percentages: <Tex>{'\\log y = \\beta_0 + \\beta_1x \\Rightarrow'}</Tex> one unit of x multiplies y by <Tex>{'e^{\\beta_1}'}</Tex> (≈ 100·β₁ % for small β₁). Box–Cox searches the family <Tex>{'y^{(\\lambda)} = (y^\\lambda - 1)/\\lambda'}</Tex> (λ = 0 means log) for the λ that makes the residuals most normal and homoscedastic:</p>
    <BoxCoxProfile />
    <p className="small">For sales, λ̂ = {F.boxcox.toFixed(2)}: somewhere between a log and a square root. In practice, round to an interpretable λ (0 or 0.5) if it's inside the CI.</p>
    <Callout kind="warn" title="Back-transforming predictions">
      <p>If you model log(y), then <Tex>{'\\exp(\\widehat{\\log y})'}</Tex> estimates the <b>median</b> of y, not the mean. For the mean, multiply by a smearing factor: <Tex>{'\\exp(\\hat\\sigma^2/2)'}</Tex> under normality, or Duan's <Tex>{'\\tfrac1n\\sum e^{e_i}'}</Tex>. Forgetting this systematically under-forecasts revenue.</p>
    </Callout>
    <CodeLab snippets={CODE.remedies} />
  </>;
}

export function Ch11() {
  return <>
    <Callout kind="story" title="Analogy: the weather forecast">
      <p>"The average July day in Chennai is 37 °C ± 0.3 °C" is a statement about the <b>mean</b>: very precise after decades of data. "Tomorrow will be 37 °C ± 0.3 °C" would be absurd. Any single day varies by several degrees. The first is a <b>confidence interval</b>; the second needs a <b>prediction interval</b>. Mixing them up is one of the most expensive mistakes in forecasting.</p>
    </Callout>
    <div className="eq">
      <Tex block>{'\\text{CI (mean response):}\\quad \\hat y_0 \\pm t_{n-k}\\,\\hat\\sigma\\sqrt{x_0^\\top(X^\\top X)^{-1}x_0}'}</Tex>
      <Tex block>{'\\text{PI (new observation):}\\quad \\hat y_0 \\pm t_{n-k}\\,\\hat\\sigma\\sqrt{1 + x_0^\\top(X^\\top X)^{-1}x_0}'}</Tex>
    </div>
    <p>The "1 +" is the irreducible noise of a single observation. As n grows, the CI shrinks towards zero width; the PI never gets narrower than about ±1.96σ. Both widen as you move away from the centre of the data (x̄): <b>uncertainty grows with extrapolation</b>.</p>
    <Playground bands />
    <PredictCalc />
    <Callout kind="warn" title="When prediction intervals lie">
      <ul style={{ marginBottom: 0 }}>
        <li><b>Heteroscedasticity:</b> the PI is too wide where the noise is low and too narrow where it's high. Our TV funnel makes high-budget PIs overconfident. Fix with WLS, a log model, or quantile regression.</li>
        <li><b>Non-normal errors:</b> PIs rely on normality <i>even with large n</i> (the CLT helps β̂, not individual errors). Use empirical residual quantiles or conformal prediction.</li>
        <li><b>Extrapolation:</b> the formula can't know the relationship changes outside your data.</li>
      </ul>
    </Callout>
    <Deep title="Conformal prediction: distribution-free intervals">
      <p>Split the data; fit on part A; compute absolute residuals on part B; take their <Tex>{'\\lceil (1-\\alpha)(n_B+1)\\rceil'}</Tex>-th smallest value q. Then <Tex>{'\\hat y_0 \\pm q'}</Tex> has at least 1 − α coverage for exchangeable data, with no normality and no correct model needed. Libraries: MAPIE, crepes. It's increasingly the standard for production ML forecasts.</p>
    </Deep>
    <CodeLab snippets={CODE.predict} />
  </>;
}

export function Ch12() {
  return <>
    <Callout kind="story" title="Business story: the KPI that got gamed">
      <p>A call centre measured agents on "average call time". Agents started hanging up on difficult customers. Metrics shape behaviour, and in modelling the "agent" is you. Optimise in-sample R² and you'll add features until it's meaningless. Choose the metric that matches the <b>business cost of an error</b>, and measure it on data the model hasn't seen.</p>
    </Callout>
    <div className="tbl-wrap"><table className="tbl">
      <thead><tr><th>Metric</th><th>Formula</th><th>Use when</th><th>Watch out</th></tr></thead>
      <tbody>
        <tr><td><b>R²</b></td><td><Tex>{'1 - \\text{SSE}/\\text{SST}'}</Tex></td><td>Communicating the share of variance explained</td><td>Never decreases when you add features; depends on the spread of y; can be negative out of sample</td></tr>
        <tr><td><b>Adjusted R²</b></td><td><Tex>{'1 - (1-R^2)\\frac{n-1}{n-k}'}</Tex></td><td>Comparing models with different k on the same data</td><td>A mild penalty; not a test-set metric</td></tr>
        <tr><td><b>RMSE</b></td><td><Tex>{'\\sqrt{\\tfrac1n\\sum e_i^2}'}</Tex></td><td>Big errors are disproportionately costly; same units as y</td><td>Sensitive to outliers</td></tr>
        <tr><td><b>MAE</b></td><td><Tex>{'\\tfrac1n\\sum |e_i|'}</Tex></td><td>Cost is linear in the error; robust reporting</td><td>OLS doesn't minimise it (median regression does)</td></tr>
        <tr><td><b>MAPE</b></td><td><Tex>{'\\tfrac{100}{n}\\sum |e_i/y_i|'}</Tex></td><td>Business audiences who think in %</td><td>Explodes near y = 0; penalises over-forecasts more → use sMAPE or WAPE</td></tr>
      </tbody>
    </table></div>
    <MetricsLab />
    <Callout kind="tip" title="What to report">
      <p>Report an <b>out-of-sample</b> error in business units ("typical error ±1.1k units") plus R² for context, and compare with a <b>naive baseline</b> (predicting the mean, or last period's value). A model is only useful relative to the simplest thing you could have done instead.</p>
    </Callout>
    <Deep title="R² identities and their limits">
      <p>For OLS with an intercept: SST = SSR + SSE (ANOVA decomposition), and R² = corr(y, ŷ)². In simple regression, R² = r²<sub>xy</sub>. None of this holds without an intercept or out of sample. That's why sklearn's <span className="kbd">r2_score</span> on a test set can be negative: the model is worse than predicting the mean.</p>
      <p>A low R² isn't necessarily bad. In noisy domains (behavioural data, stock returns) R² = 0.1 with stable, significant coefficients can be very valuable. A high R² isn't necessarily good either: regressing a trending series on another trending series gives R² ≈ 0.9 for unrelated variables (spurious regression).</p>
    </Deep>
    <CodeLab snippets={CODE.metrics} />
  </>;
}
