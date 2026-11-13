// Chapters 5–8: visual diagnostics, formal tests, multicollinearity, influence.
import { Tex } from '../../components/Tex';
import { CodeLab } from '../../components/CodeLab';
import { Callout, Deep } from '../ui';
import { CODE } from './code';
import { F, f3, p } from './facts';
import { AdCollinearity, AdDiagnostics, AdInfluenceTable, AdTests, Breaker, CollinearityLab, InfluenceLab } from './widgets2';

export function Ch5() {
  return <>
    <Callout kind="story" title="Analogy: the doctor's X-ray">
      <p>A blood test gives a number; an X-ray shows you <i>where</i> the problem is. Formal tests (Chapter 6) are the blood test. The four diagnostic plots are the X-ray: they tell you not only <i>that</i> something is wrong but <i>what</i> and <i>how to fix it</i>. Experienced modellers look at the plots first, every time.</p>
    </Callout>
    <h3>The four plots and what to look for</h3>
    <div className="tbl-wrap"><table className="tbl">
      <thead><tr><th>Plot</th><th>Healthy</th><th>Problem patterns</th></tr></thead>
      <tbody>
        <tr><td><b>Residuals vs fitted</b></td><td>Random band around 0, flat red LOWESS line</td><td>U or arch → missing curvature / interaction. Funnel → heteroscedasticity.</td></tr>
        <tr><td><b>Normal Q-Q</b></td><td>Points on the 45° line</td><td>S-shape → heavy or light tails. One end bending → skew. A few far points → outliers.</td></tr>
        <tr><td><b>Scale-location</b></td><td>Flat line, even spread</td><td>Rising line → variance grows with the mean (the classic funnel, made easier to see).</td></tr>
        <tr><td><b>Residuals vs leverage</b></td><td>Everything inside the Cook's contours</td><td>Points beyond the 0.5 / 1 contours → influential observations.</td></tr>
      </tbody>
    </table></div>
    <AdDiagnostics />
    <h3>Reading our Advertising model</h3>
    <ul>
      <li><b>Residuals vs fitted:</b> a clear <b>U-shape</b>. The model under-predicts at low and high sales and over-predicts in the middle. Something structural is missing (it'll turn out to be the TV × radio synergy and the TV curvature).</li>
      <li><b>Scale-location:</b> the line <b>rises</b>, so the error spread grows with the level of sales. Heteroscedasticity.</li>
      <li><b>Q-Q:</b> close to the line, with slightly heavy tails. Normality is the least of our worries.</li>
      <li><b>Leverage:</b> nothing near Cook's D = 0.5. No single market dominates.</li>
    </ul>
    <Callout kind="tip">
      <p>Also plot residuals against <b>each feature</b> (including ones not in the model) and against <b>time / row order</b>. A pattern against a feature points to the term to transform; a pattern against an <i>excluded</i> variable means it belongs in the model; a pattern against time means autocorrelation.</p>
    </Callout>
    <h3>Build your eye: the pattern gallery</h3>
    <p>Switch on one violation at a time and learn its fingerprint. Then try two at once: real data rarely has just one problem.</p>
    <Breaker view="diag" initial={['curve']} />
    <Deep title="Why studentised residuals, not raw residuals?">
      <p>Even when the errors have equal variance, the <i>residuals</i> don't: <Tex>{'\\operatorname{Var}(e_i) = \\sigma^2(1 - h_{ii})'}</Tex>. High-leverage points pull the line towards themselves, so their residuals are artificially small. Studentising divides this out:</p>
      <div className="eq"><Tex block>{'r_i = \\frac{e_i}{\\hat\\sigma\\sqrt{1-h_{ii}}}\\ (\\text{internal}), \\qquad t_i = r_i\\sqrt{\\frac{n-k-1}{n-k-r_i^2}}\\ (\\text{external, leave-one-out } \\hat\\sigma_{(i)})'}</Tex></div>
      <p>External studentised residuals follow a <Tex>{'t_{n-k-1}'}</Tex> distribution under the model, so |t| &gt; 3 is genuinely unusual.</p>
    </Deep>
  </>;
}

export function Ch6() {
  return <>
    <Callout kind="story" title="Analogy: the smoke alarm">
      <p>A smoke alarm that never goes off is useless, and one that screams at toast is ignored. Formal assumption tests behave the same way with sample size: <b>with small n they miss real problems, and with huge n they flag harmless ones</b>. Use them to confirm what the plots show, never instead of the plots.</p>
    </Callout>
    <p>Every test below has the same structure: a <b>null hypothesis</b> that the assumption holds, a statistic, and a p-value. A small p-value means "evidence the assumption is violated". A large p-value does <i>not</i> prove it holds.</p>
    <h3>Normality</h3>
    <ul>
      <li><b>Shapiro–Wilk</b>: correlates the sorted residuals with the expected normal order statistics. W close to 1 means normal. The most powerful general test for n up to a few thousand.</li>
      <li><b>Jarque–Bera</b>: <Tex>{'JB = \\tfrac{n}{6}\\left(S^2 + \\tfrac{(K-3)^2}{4}\\right) \\sim \\chi^2_2'}</Tex>, combining skewness S and kurtosis K. Asymptotic, so it needs large n.</li>
    </ul>
    <h3>Constant variance</h3>
    <ul>
      <li><b>Breusch–Pagan</b>: regress <Tex>{'e_i^2'}</Tex> on the features. If they explain the squared residuals, the variance depends on X. LM = n·R²<sub>aux</sub> ~ χ²<sub>k−1</sub> (Koenker's robust version, the statsmodels default).</li>
      <li><b>White</b>: the same, but the auxiliary regression adds squares and cross-products, so it catches non-linear variance patterns too. More general, less powerful.</li>
    </ul>
    <h3>Independence</h3>
    <ul>
      <li><b>Durbin–Watson</b>: <Tex>{'d = \\sum_{t=2}^n (e_t - e_{t-1})^2 / \\sum e_t^2 \\approx 2(1-\\hat\\rho_1)'}</Tex>. d ≈ 2: no lag-1 autocorrelation. d &lt; 1.5: positive autocorrelation (the usual problem). Only meaningful if the row order means something (time, space). For higher lags use Breusch–Godfrey or Ljung–Box.</li>
    </ul>
    <h3>Functional form</h3>
    <ul>
      <li><b>Ramsey RESET</b>: add <Tex>{'\\hat y^2, \\hat y^3'}</Tex> to the model and F-test them. If powers of the prediction help, the model is missing non-linearity.</li>
      <li><b>Rainbow (Utts)</b>: fit only the central half of the data (lowest leverage) and compare with the full fit. If the full data fits much worse, the relationship bends at the edges.</li>
    </ul>
    <AdTests />
    <p>Our model: RESET (p {p(F.reset.p)}) and Rainbow (p {p(F.rainbow.p)}) both reject linearity; Breusch–Pagan (p {p(F.bp.p)}) and White (p {p(F.white.p)}) reject constant variance. Shapiro–Wilk (p {p(F.sw.p)}) and Jarque–Bera (p {p(F.jb.p)}) are fine, and Durbin–Watson = {F.dw.toFixed(2)} is fine (and irrelevant anyway: the rows are markets, not time). That's <b>exactly what the plots told us</b>.</p>
    <Breaker view="tests" initial={['autocorr']} />
    <Callout kind="warn" title="Three traps with assumption tests">
      <ol style={{ marginBottom: 0 }}>
        <li><b>Big n:</b> with 100,000 rows, Shapiro–Wilk rejects for trivial deviations that don't affect anything. Look at the effect size (the Q-Q plot), not the p-value.</li>
        <li><b>Testing the wrong thing:</b> test the <i>residuals</i>, never y or x.</li>
        <li><b>Pre-testing:</b> "if BP rejects, use robust SEs, otherwise not" distorts your final p-values. Many practitioners simply use robust SEs by default for cross-sectional data.</li>
      </ol>
    </Callout>
    <CodeLab snippets={CODE.tests} />
  </>;
}

export function Ch7() {
  return <>
    <Callout kind="story" title="Business story: the two salespeople">
      <p>Priya and Arjun always visit clients together. Sales are excellent. Management asks: "Who deserves the bonus?" There's no way to tell. They're never apart, so the data can't separate their contributions. The team's total effect is crystal clear; the split is pure guesswork. That's multicollinearity, and it's why "the model says radio doesn't matter" can be false when radio always moves together with TV.</p>
    </Callout>
    <h3>What it does (and doesn't do)</h3>
    <ul>
      <li>It does <b>not</b> bias the coefficients, and it does <b>not</b> hurt predictions (as long as the features stay correlated the same way in new data).</li>
      <li>It <b>inflates the standard errors</b>, so individually insignificant coefficients can be jointly highly significant.</li>
      <li>Coefficients become <b>unstable</b>: they swing, even flip sign, when you add a few rows or a feature.</li>
    </ul>
    <CollinearityLab />
    <h3>Measuring it</h3>
    <div className="eq"><Tex block>{'\\text{VIF}_j = \\frac{1}{1 - R_j^2}, \\qquad \\operatorname{Var}(\\hat\\beta_j) = \\frac{\\sigma^2}{(n-1)\\,s_{x_j}^2}\\cdot \\text{VIF}_j'}</Tex></div>
    <p><Tex>{'R_j^2'}</Tex> is the R² from regressing <Tex>{'x_j'}</Tex> on all the other features. VIF tells you how many times larger the coefficient's variance is than it would be with uncorrelated features. Rules of thumb: <b>VIF &gt; 5</b> look closer, <b>VIF &gt; 10</b> serious.</p>
    <p>The <b>condition number</b> <Tex>{'\\kappa = \\sqrt{\\lambda_{\\max}/\\lambda_{\\min}}'}</Tex> of X'X captures collinearity among <i>groups</i> of features, which pairwise correlations can miss. Compute it on standardised features, otherwise it mostly measures differences in units.</p>
    <AdCollinearity />
    <h3>Remedies, in order of preference</h3>
    <ol>
      <li><b>Ask whether it matters.</b> If you only predict, or the collinear features are just controls, do nothing.</li>
      <li><b>Combine</b> collinear features into one meaningful index (total budget, an average score) or use PCA.</li>
      <li><b>Drop</b> one of a redundant pair, if theory allows. Beware: dropping a real confounder causes omitted-variable bias (Chapter 4).</li>
      <li><b>Centre</b> variables before making interactions or polynomials. This removes the structural collinearity between x and x².</li>
      <li><b>Ridge regression</b> (Chapter 17) stabilises the estimates by accepting a little bias.</li>
      <li><b>Collect more data</b>, ideally with independent variation (e.g. run a test where TV changes but radio doesn't).</li>
    </ol>
    <Deep title="Why does VIF = 1/(1 − R²ⱼ)? A derivation">
      <p>By Frisch–Waugh–Lovell, <Tex>{'\\hat\\beta_j'}</Tex> is the slope of y on <Tex>{'\\tilde x_j'}</Tex>, the residual of <Tex>{'x_j'}</Tex> after regressing it on the other features. A simple regression slope has variance <Tex>{'\\sigma^2/\\sum \\tilde x_{ij}^2'}</Tex>, and <Tex>{'\\sum \\tilde x_{ij}^2 = (1 - R_j^2)\\sum (x_{ij}-\\bar x_j)^2'}</Tex>. Only the part of <Tex>{'x_j'}</Tex> not explained by the others carries information about <Tex>{'\\beta_j'}</Tex>. Divide the two variances and you get 1/(1 − R²ⱼ).</p>
    </Deep>
    <CodeLab snippets={CODE.vif} />
  </>;
}

export function Ch8() {
  return <>
    <Callout kind="story" title="Business story: the billionaire walks into the bar">
      <p>Ten people in a bar earn ₹8 lakh a year on average. A billionaire walks in, and the average jumps to ₹100 crore. Nobody got richer. One point dominated a statistic built on squares and means. OLS is equally fragile: a single mistyped row ("₹96 lakh for a 400 sq ft flat") or one unusual market can rotate the whole line.</p>
    </Callout>
    <h3>Three different ideas that people confuse</h3>
    <div className="tbl-wrap"><table className="tbl">
      <thead><tr><th>Concept</th><th>Question</th><th>Measure</th><th>Rule of thumb</th></tr></thead>
      <tbody>
        <tr><td><b>Outlier</b></td><td>Is y unusual given x?</td><td>External studentised residual <Tex>{'t_i'}</Tex></td><td>|t| &gt; 3 (or Bonferroni test)</td></tr>
        <tr><td><b>Leverage</b></td><td>Is x unusual (far from the centre of the data)?</td><td>Hat value <Tex>{'h_{ii}'}</Tex></td><td>&gt; 2k/n (or 3k/n)</td></tr>
        <tr><td><b>Influence</b></td><td>Does removing the point change the fit?</td><td>Cook's D, DFFITS, DFBETAS</td><td>D &gt; 4/n look, &gt; 0.5 serious, &gt; 1 dominant</td></tr>
      </tbody>
    </table></div>
    <div className="eq"><Tex block>{"D_i = \\frac{r_i^2}{k}\\cdot\\frac{h_{ii}}{1-h_{ii}} = \\underbrace{\\text{outlyingness}^2}_{\\text{residual}}\\times\\underbrace{\\text{leverage factor}}_{\\text{position}}, \\qquad \\text{DFFITS}_i = t_i\\sqrt{\\frac{h_{ii}}{1-h_{ii}}}"}</Tex></div>
    <p>Influence needs <b>both</b>: an unusual y at an unusual x. Feel it:</p>
    <InfluenceLab />
    <h3>On the Advertising data</h3>
    <AdInfluenceTable />
    <h3>A decision procedure for unusual points</h3>
    <ol>
      <li><b>Investigate before you delete.</b> Is it a data-entry error, a different population (a flagship store), or a real but rare event?</li>
      <li><b>Errors</b>: fix or remove them, and document it.</li>
      <li><b>Different population</b>: model it explicitly (add an indicator) or restrict the scope of the model, and say so.</li>
      <li><b>Real and relevant</b>: keep it. Report the results with and without, use robust regression (Huber, RANSAC) or quantile regression, or transform y.</li>
      <li><b>Never</b> delete points just because they hurt R². That's how models fail silently in production.</li>
    </ol>
    <Deep title="Leverage is the diagonal of the hat matrix">
      <p><Tex>{'h_{ii} = x_i^\\top(X^\\top X)^{-1}x_i'}</Tex>, with <Tex>{'0 \\le h_{ii} \\le 1'}</Tex> and <Tex>{'\\sum_i h_{ii} = k'}</Tex>, so the average is k/n. It's a Mahalanobis-type distance of <Tex>{'x_i'}</Tex> from the centre of the data. Since <Tex>{'\\partial\\hat y_i / \\partial y_i = h_{ii}'}</Tex>, a point with h = 0.9 predicts mostly itself. Removing point i changes the coefficients by <Tex>{'\\hat\\beta - \\hat\\beta_{(i)} = (X^\\top X)^{-1}x_i\\,e_i/(1-h_{ii})'}</Tex>, which is how Cook's D is computed without refitting n times.</p>
      <p className="small muted">For our model the average leverage is k/n = {f3(F.full.k / F.n)}.</p>
    </Deep>
    <CodeLab snippets={CODE.influence} />
  </>;
}
