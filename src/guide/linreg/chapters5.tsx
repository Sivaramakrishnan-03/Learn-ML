// Chapters 18–20: end-to-end pipeline, documentation, assessment (quiz, interview, diagnose, cheat sheet).
import { Tex } from '../../components/Tex';
import { CodeLab } from '../../components/CodeLab';
import { Quiz, QuizItem } from '../../components/Quiz';
import { CheatSheet } from '../../components/CheatSheet';
import { progress } from '../../lib/progress';
import { Callout, Deep } from '../ui';
import { CODE } from './code';
import { DiagnoseExercises, ModelCard, PipelineStepper } from './widgets5';

export function Ch18() {
  return <>
    <Callout kind="story" title="Business story: the model that passed every test and still failed">
      <p>A retailer's demand model had R² = 0.95 in development and was off by 40% in its first month live. The cause: the target was scaled with statistics from the <i>whole</i> dataset, and a promotion flag was only filled in after the fact. Both leaked the future into training. Process, not cleverness, is what separates a notebook from a model a business can rely on.</p>
    </Callout>
    <h3>The workflow</h3>
    <div className="flow small" style={{ marginBottom: 12 }}>
      {['Frame the question', 'Lock a test set', 'EDA', 'Baseline', 'Diagnose', 'Fix (theory first)', 'Select', 'Validate once', 'Interpret', 'Document', 'Monitor'].map((s, i, a) => <span key={s} className="row" style={{ gap: 6 }}><span className="node">{s}</span>{i < a.length - 1 && <span className="arr">→</span>}</span>)}
    </div>
    <PipelineStepper />
    <h3>Checklist you can reuse on any regression project</h3>
    <ol>
      <li><b>Question</b>: prediction or explanation? This decides how much the assumptions matter.</li>
      <li><b>Split first</b>: train/test (or time-based) before any exploration that informs modelling choices.</li>
      <li><b>EDA</b>: distributions, missing values, impossible values, scatter plots of y against each x, the correlation matrix.</li>
      <li><b>Baseline</b>: the simplest sensible model. Record its CV error.</li>
      <li><b>Diagnose</b>: 4 plots + RESET/BP/SW/DW + VIF + Cook's D.</li>
      <li><b>Fix</b>: functional form first (terms, transforms), then the variance (robust SEs/WLS), then influence.</li>
      <li><b>Select</b>: theory + AIC/BIC/CV. Respect hierarchy. Prefer the simpler model when the criteria tie.</li>
      <li><b>Validate</b>: on the untouched test set, once. Compare with the naive baseline.</li>
      <li><b>Interpret</b>: marginal effects in business units, CIs, caveats.</li>
      <li><b>Document &amp; monitor</b>: model card (Chapter 19), drift checks, retraining triggers.</li>
    </ol>
    <CodeLab snippets={CODE.pipeline} />
  </>;
}

export function Ch19() {
  return <>
    <Callout kind="story" title="Why documentation is part of the model">
      <p>After the 2008 crisis, the US Federal Reserve's <b>SR 11-7</b> guidance made "effective challenge" of models mandatory at banks. A model that can't be independently understood, reproduced and challenged is a risk, however accurate. Google's <b>Model Cards</b> (Mitchell et al., 2019) brought the same idea to ML. Whether or not you're regulated, the document is what lets the next analyst, auditor or future-you trust the numbers.</p>
    </Callout>
    <h3>What a regression model document must contain</h3>
    <div className="tbl-wrap"><table className="tbl">
      <thead><tr><th>Section</th><th>Answers</th></tr></thead>
      <tbody>
        <tr><td><b>Purpose &amp; scope</b></td><td>Business question; intended and <i>out-of-scope</i> uses; decision it supports</td></tr>
        <tr><td><b>Data</b></td><td>Source, period, unit of observation, target definition, cleaning, exclusions and why</td></tr>
        <tr><td><b>Specification</b></td><td>Equation, transformations, why this form, alternatives considered</td></tr>
        <tr><td><b>Results</b></td><td>Coefficient table with (robust) SEs and CIs; fit and CV metrics vs baseline</td></tr>
        <tr><td><b>Assumption checks</b></td><td>Each assumption → evidence (plot/test) → verdict → mitigation</td></tr>
        <tr><td><b>Interpretation</b></td><td>Effects in business language; uncertainty; what the model does <i>not</i> say (causality)</td></tr>
        <tr><td><b>Limitations &amp; risks</b></td><td>Extrapolation range, confounding, data gaps, sensitivity analyses</td></tr>
        <tr><td><b>Monitoring</b></td><td>Metrics, thresholds, retraining triggers, owner</td></tr>
        <tr><td><b>Reproducibility</b></td><td>Code version, data version, seeds, environment</td></tr>
      </tbody>
    </table></div>
    <p>Below is the complete card for our final model, generated from the live statistics in this page. Download it and use it as the template for your own projects.</p>
    <ModelCard />
    <Callout kind="biz" title="Writing for stakeholders">
      <ul style={{ marginBottom: 0 }}>
        <li>Lead with the decision, not the method: "Shift newspaper budget to radio" before "β₃ was insignificant".</li>
        <li>Translate coefficients into the units leadership uses (units, ₹, %), and show ranges, not points.</li>
        <li>State the causal caveat plainly, and propose the experiment that would confirm it.</li>
      </ul>
    </Callout>
  </>;
}

export const QUIZ: QuizItem[] = [
  { q: 'Which assumption is about the residuals, not the features or the target?', options: ['The features must be normally distributed', 'y must be normally distributed', 'The errors should be normally distributed (for exact small-sample inference)', 'All variables must be standardised'], answer: 2, why: 'Only the error distribution matters for inference. Features can have any distribution, and y is normal only conditionally on X.' },
  { q: 'Heteroscedasticity in an OLS model primarily causes…', options: ['Biased coefficients', 'Incorrect standard errors and p-values', 'A lower R²', 'Perfect multicollinearity'], answer: 1, why: 'β̂ stays unbiased, but the formula σ²(X\'X)⁻¹ is wrong, so SEs (and everything built on them) are unreliable. Use HC robust SEs or WLS.' },
  { q: 'A U-shaped LOWESS line in the residuals-vs-fitted plot suggests…', options: ['Heteroscedasticity', 'A missing non-linear term or interaction', 'Autocorrelation', 'Normal errors'], answer: 1, why: 'Systematic curvature means E[ε|X] ≠ 0: the mean structure is wrong. RESET would confirm it.' },
  { q: 'VIF for a feature is 10. What does that mean?', options: ['The feature explains 10% of y', 'Its coefficient variance is 10× what it would be with uncorrelated features', 'It has 10 outliers', 'Its coefficient is 10× too big'], answer: 1, why: 'VIF = 1/(1−R²ⱼ). VIF = 10 means 90% of xⱼ is explained by the other features, and the SE is inflated by √10 ≈ 3.2.' },
  { q: "A point has high leverage but lies exactly on the regression line. Its Cook's distance is…", options: ['Large', 'Small', 'Undefined', 'Always 1'], answer: 1, why: "Cook's D needs both leverage and a large residual. A high-leverage point on the trend is a 'good' leverage point and actually reduces SEs." },
  { q: 'Durbin–Watson = 0.6 on time-ordered data. Most likely?', options: ['No autocorrelation', 'Strong positive autocorrelation', 'Strong negative autocorrelation', 'Heteroscedasticity'], answer: 1, why: 'd ≈ 2(1 − ρ̂). d = 0.6 means ρ̂ ≈ 0.7: neighbouring errors are similar. Use HAC SEs or model the dynamics.' },
  { q: 'You add 20 random-noise features. What happens to R² and adjusted R²?', options: ['Both fall', 'R² rises or stays the same; adjusted R² usually falls', 'Both rise', 'R² falls; adjusted R² rises'], answer: 1, why: 'In-sample R² can never decrease when features are added. Adjusted R² penalises the lost degrees of freedom.' },
  { q: 'BIC tends to choose ___ models than AIC when n ≥ 8.', options: ['larger', 'smaller', 'identical', 'random'], answer: 1, why: 'The BIC penalty per parameter is ln(n) > 2 once n ≥ 8.' },
  { q: 'For a new single market, which interval should a planner use?', options: ['Confidence interval of the mean', 'Prediction interval', "The coefficient's CI", 'The standard error'], answer: 1, why: 'The PI adds the irreducible noise of one observation (the "1 +" term). The CI only covers the average.' },
  { q: 'Why must features be standardised before Lasso/Ridge?', options: ['To make OLS unbiased', 'Because the penalty treats all coefficients equally, so scale would decide which ones get shrunk', 'To remove outliers', 'It is not necessary'], answer: 1, why: 'A feature in small units needs a large coefficient and would be penalised more, purely because of its units.' },
  { q: 'Which method can set coefficients exactly to zero?', options: ['Ridge', 'Lasso', 'OLS', 'WLS'], answer: 1, why: "The L1 diamond's corners lie on the axes, so solutions often land at a coefficient of exactly zero. Ridge's circle has no corners." },
  { q: 'Gradient descent diverges. The most likely fix?', options: ['Increase the learning rate', 'Decrease the learning rate and/or standardise features', 'Add more features', 'Use fewer iterations'], answer: 1, why: 'Batch GD needs η < 2/λmax. Scaling lowers λmax and the condition number.' },
  { q: 'Newspaper is significant alone but not alongside radio. The best explanation?', options: ['A bug in the software', 'Newspaper is correlated with radio and was picking up its effect (omitted-variable bias)', 'Newspaper has outliers', 'The F-test failed'], answer: 1, why: 'With radio omitted, newspaper absorbs radio\'s effect via their correlation (0.45). Controlling for radio removes it.' },
  { q: 'You model log(sales). The coefficient on TV is 0.004. Interpretation?', options: ['+0.004 units per $1k', '≈ +0.4% sales per extra $1k TV', '+4% per $1k', '+0.004%'], answer: 1, why: 'In a log-level model, 100·β ≈ % change in y per unit of x for small β.' },
  { q: 'Which is NOT a remedy for heteroscedasticity?', options: ['HC3 robust standard errors', 'Weighted least squares', 'Log-transforming y', 'Adding more noise features'], answer: 3, why: 'The first three are standard remedies. Adding noise features does nothing for the variance structure.' },
  { q: 'What does the Gauss–Markov theorem guarantee?', options: ['OLS is unbiased under any conditions', 'OLS has the lowest variance among linear unbiased estimators, if errors have zero mean, equal variance and no correlation', 'OLS errors are normal', 'OLS has the lowest MSE of all estimators'], answer: 1, why: 'BLUE: best linear unbiased. Normality is not required. Biased estimators (Ridge) can beat it on MSE.' },
];

export const INTERVIEW: QuizItem[] = [
  { interview: true, q: 'Interview: walk me through how you would validate a linear regression model.', options: ['Check R² > 0.8', 'Hold out data; check residual plots, RESET/BP/DW, VIF and influence; compare CV error with a baseline; test once on held-out data', 'Look at the p-values only', 'Train on all data and report training error'], answer: 1, why: 'A strong answer covers assumptions (plots and tests), stability (VIF, influence), out-of-sample performance (CV/test vs a baseline) and business sense of the coefficients.' },
  { interview: true, q: 'Interview: your p-values look great but residuals fan out. What do you do?', options: ['Ignore it', 'Report HC3 robust SEs (or WLS / a log transform) and re-check significance', 'Remove the largest residuals', 'Switch to a decision tree'], answer: 1, why: 'Heteroscedasticity invalidates the classical SEs. Robust SEs fix the inference without changing the coefficients. A log transform may also fix the cause.' },
  { interview: true, q: 'Interview: what is the difference between R² and adjusted R²?', options: ['There is none', 'Adjusted R² penalises the number of predictors and can fall when a useless feature is added', 'Adjusted R² is always higher', 'R² is for test data only'], answer: 1, why: 'Adj R² = 1 − (1−R²)(n−1)/(n−k). Use it (or AIC/BIC/CV) to compare models with different k.' },
  { interview: true, q: 'Interview: how do you handle multicollinearity?', options: ['Always drop the feature with the highest VIF', 'First ask if it matters (prediction vs inference); then combine, drop with care, centre interactions, use Ridge, or collect better data', 'Standardise the features; that removes it', 'It cannot be handled'], answer: 1, why: 'Standardising does not remove collinearity among different features. The remedy depends on the goal; dropping a confounder can introduce bias.' },
  { interview: true, q: 'Interview: Ridge vs Lasso, when would you use each?', options: ['They are identical', 'Ridge for many small or correlated effects (stable, no selection); Lasso for sparse, interpretable models with built-in selection; Elastic Net for correlated groups', 'Lasso always wins', 'Ridge only for classification'], answer: 1, why: 'L2 shrinks smoothly and shares weight among correlated features; L1 zeros coefficients but picks arbitrarily among correlated ones.' },
  { interview: true, q: 'Interview: can linear regression model non-linear relationships?', options: ['No, never', 'Yes: "linear" refers to the coefficients, so polynomials, logs, splines and interactions are fine', 'Only with neural networks', 'Only if y is binary'], answer: 1, why: 'Any model of the form y = Σβⱼ·fⱼ(x) is linear in β and fits with OLS.' },
  { interview: true, q: 'Interview: what is the hat matrix and why does it matter?', options: ['A matrix of hats', 'H = X(X\'X)⁻¹X\' maps y to ŷ; its diagonal gives leverage, used for influence and studentised residuals', 'The covariance of y', 'The inverse of X'], answer: 1, why: 'H is the projection onto col(X). hᵢᵢ ∈ [0, 1], Σhᵢᵢ = k, and Var(eᵢ) = σ²(1 − hᵢᵢ).' },
  { interview: true, q: 'Interview: a stakeholder asks "does TV advertising cause sales?" based on your regression. Your answer?', options: ['Yes, the p-value is tiny', 'The data show a strong association holding the other channels fixed; causality needs an experiment or a quasi-experimental design because budgets may be set based on expected sales', 'No, regression can never say anything', 'Only if R² > 0.9'], answer: 1, why: 'Observational coefficients are causal only if there is no confounding (exogeneity). Recommend a geo-lift test or a similar design.' },
  { interview: true, q: 'Interview: how do you choose k in k-fold cross-validation, and when would you not shuffle?', options: ['k = 2 always', 'k = 5 or 10 balances bias and variance of the estimate; never shuffle time series: use forward-chaining splits', 'k = n is always best', 'Shuffling never matters'], answer: 1, why: 'Shuffling time-ordered data leaks the future into training. Use TimeSeriesSplit or expanding windows.' },
  { interview: true, q: 'Interview: why might you prefer MAE over RMSE for reporting?', options: ['MAE is always smaller', 'MAE is robust to outliers and matches linear error costs; RMSE emphasises large errors', 'RMSE cannot be computed for regression', 'They are identical'], answer: 1, why: 'Choose the metric whose loss shape matches the business cost of errors.' },
];

export function Ch20() {
  return <>
    <p>Four ways to lock in what you've learned. Scoring 70% or more on the concept quiz marks the Linear Regression topic as complete on your learning path.</p>
    <h3>1 · Diagnose this model</h3>
    <p>Each case is a freshly simulated dataset with one problem (or none). Read the four plots and name it.</p>
    <DiagnoseExercises />
    <h3>2 · Concept quiz</h3>
    <Quiz items={QUIZ} onPass={() => { if (!progress.get()['linear-regression']) progress.toggle('linear-regression'); }} />
    <h3>3 · Interview questions</h3>
    <p className="small muted">Pick the best answer, then read the model answer. In a real interview, say the reasoning out loud.</p>
    <Quiz items={INTERVIEW} />
    <Deep title="Open-ended interview questions to practise out loud">
      <ol>
        <li>Derive the OLS estimator. What happens if X'X is not invertible?</li>
        <li>Explain the bias–variance trade-off using regularisation as the example.</li>
        <li>Your model works in validation but fails in production. List 5 possible causes. (Leakage, drift, extrapolation, a broken feature pipeline, a target definition change…)</li>
        <li>How would you explain a confidence interval to a non-technical manager?</li>
        <li>When would you prefer a well-specified linear model over gradient boosting?</li>
        <li>How do you test whether the effect of TV differs between regions?</li>
      </ol>
    </Deep>
    <h3>4 · Cheat sheet</h3>
    <CheatSheet>{SHEET}</CheatSheet>
  </>;
}

const SHEET = (
  <div>
    <h2>Linear Regression: complete cheat sheet</h2>
    <table><tbody>
      <tr><th>Model</th><td><Tex>{'y = X\\beta + \\varepsilon'}</Tex> · OLS <Tex>{'\\hat\\beta = (X^\\top X)^{-1}X^\\top y'}</Tex> · <Tex>{'\\hat\\sigma^2 = \\text{SSE}/(n-k)'}</Tex> · <Tex>{'\\text{Var}(\\hat\\beta) = \\sigma^2(X^\\top X)^{-1}'}</Tex></td></tr>
      <tr><th>Simple</th><td><Tex>{'b_1 = \\text{Cov}(x,y)/\\text{Var}(x) = r\\,s_y/s_x'}</Tex>, <Tex>{'b_0 = \\bar y - b_1\\bar x'}</Tex></td></tr>
      <tr><th>Assumptions</th><td><b>LINE</b>: Linearity · Independence · Normality of errors · Equal variance; + no perfect collinearity, exogeneity. Gauss–Markov ⇒ BLUE (no normality needed)</td></tr>
      <tr><th>Plots</th><td>Resid vs fitted (curve/funnel) · Q-Q (tails) · Scale-location (variance) · Resid vs leverage (Cook)</td></tr>
      <tr><th>Tests (H₀ = OK)</th><td>Shapiro–Wilk, Jarque–Bera (normality) · Breusch–Pagan, White (variance) · Durbin–Watson ≈ 2 (independence) · RESET, Rainbow (linearity)</td></tr>
      <tr><th>Collinearity</th><td><Tex>{'\\text{VIF}_j = 1/(1-R_j^2)'}</Tex>: &gt; 5 caution, &gt; 10 serious · condition number (standardised) &gt; 30</td></tr>
      <tr><th>Influence</th><td>Leverage <Tex>{'h_{ii}'}</Tex> &gt; 2k/n · |ext. stud. resid| &gt; 3 · Cook's D &gt; 4/n look, &gt; 0.5–1 serious · |DFFITS| &gt; 2√(k/n)</td></tr>
      <tr><th>Inference</th><td><Tex>{'t = \\hat\\beta/\\text{SE} \\sim t_{n-k}'}</Tex> · CI <Tex>{'\\hat\\beta \\pm t\\cdot\\text{SE}'}</Tex> · overall F · partial F <Tex>{'\\frac{(\\text{SSE}_R-\\text{SSE}_F)/q}{\\text{SSE}_F/(n-k)}'}</Tex></td></tr>
      <tr><th>Remedies</th><td>Curve → terms/transforms · Funnel → HC3 / WLS / log y · Autocorr → HAC / dynamics · Outliers → investigate / Huber · Collinearity → combine / Ridge</td></tr>
      <tr><th>Intervals</th><td>CI mean: <Tex>{'\\hat\\sigma\\sqrt{x_0^\\top(X^\\top X)^{-1}x_0}'}</Tex> · PI new obs: <Tex>{'\\hat\\sigma\\sqrt{1+x_0^\\top(X^\\top X)^{-1}x_0}'}</Tex></td></tr>
      <tr><th>Metrics</th><td>R², adj R² · RMSE (big errors) · MAE (robust) · MAPE (%; avoid near 0) · always out-of-sample vs baseline</td></tr>
      <tr><th>Selection</th><td>AIC = −2ℓ + 2k · BIC = −2ℓ + k ln n (smaller models) · Cp ≈ p · CV · keep hierarchy · stepwise = exploration only</td></tr>
      <tr><th>Validation</th><td>k-fold (5/10) · time-series split (no shuffle) · group k-fold · nested CV for tuning · Pipeline to avoid leakage</td></tr>
      <tr><th>Features</th><td>Dummies (L−1) · interactions <Tex>{'\\partial y/\\partial x_1 = \\beta_1 + \\beta_3x_2'}</Tex> · polynomials (centre first) · logs (elasticities) · splines</td></tr>
      <tr><th>Gradient descent</th><td><Tex>{'\\beta \\leftarrow \\beta - \\eta\\tfrac2nX^\\top(X\\beta-y)'}</Tex> · stable if <Tex>{'\\eta < 2/\\lambda_{\\max}'}</Tex> · standardise · batch / mini-batch / SGD</td></tr>
      <tr><th>Regularisation</th><td>Ridge L2 (shrink, no zeros, collinearity) · Lasso L1 (zeros, selection) · Elastic Net (groups) · standardise · tune α by CV (1-SE rule)</td></tr>
      <tr><th>Python</th><td><code>smf.ols("y ~ x1 + x2", df).fit(cov_type="HC3")</code> · <code>het_breuschpagan</code> · <code>linear_reset</code> · <code>variance_inflation_factor</code> · <code>get_influence()</code> · <code>RidgeCV / LassoCV</code></td></tr>
    </tbody></table>
  </div>
);
