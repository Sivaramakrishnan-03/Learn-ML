// Chapters 1–4: story, intuition, math of OLS, assumptions.
import { Tex } from '../../components/Tex';
import { CodeLab } from '../../components/CodeLab';
import { AD, adCsv } from '../../lib/advertising';
import { Callout, Deep, downloadText } from '../ui';
import { CODE } from './code';
import { F, f3, f4, p } from './facts';
import { ChannelScatter, LeastSquaresAnim, NormalEquationLive, Playground, Projection } from './widgets1';
import { Breaker } from './widgets2';

export function Ch1() {
  return <>
    <Callout kind="story" title="Where the word 'regression' comes from">
      <p>In 1886 Sir Francis Galton measured the heights of 928 adult children and their parents. Tall parents had tall children, but <i>less</i> tall than themselves. Short parents had short children, but less short. Heights "regressed towards mediocrity". The line he drew through that cloud of points gave the method its name, and the effect (now called <b>regression to the mean</b>) still catches out managers who reward last year's top performers and then wonder why they "slipped".</p>
    </Callout>
    <h3>The business problem we'll solve, end to end</h3>
    <p>You're the analytics lead for a consumer-goods company. The CMO hands you data from <b>{AD.length} markets</b>: how much was spent on <b>TV</b>, <b>radio</b> and <b>newspaper</b> advertising (in $1,000s), and how many units were sold (in 1,000s). Her questions are the questions behind most regression projects:</p>
    <ol>
      <li><b>Is there a relationship</b> between advertising and sales at all?</li>
      <li><b>Which channels</b> contribute, and by how much?</li>
      <li><b>How accurately</b> can we predict sales for a planned budget?</li>
      <li>Is the relationship <b>linear</b>? Is there <b>synergy</b> between channels?</li>
    </ol>
    <p>Each chapter answers a piece of this, and by Chapter 18 you'll have a defensible model and a documented recommendation.</p>
    <ChannelScatter />
    <Callout kind="key">
      <p>Linear regression models the <b>average</b> of a target as a weighted sum of inputs: <Tex>{'\\mathbb{E}[\\text{sales}\\mid\\text{budgets}] = \\beta_0 + \\beta_1\\text{TV} + \\beta_2\\text{radio} + \\beta_3\\text{newspaper}'}</Tex>. Each β answers a business question: "holding the other channels fixed, what does one more $1,000 here go with?"</p>
    </Callout>
    <h3>Why it's still the first model every data scientist reaches for</h3>
    <ul>
      <li><b>Interpretable:</b> every coefficient is a sentence you can say to a CFO.</li>
      <li><b>Inferential:</b> it comes with standard errors, confidence intervals and tests, so you know how sure you are.</li>
      <li><b>A baseline:</b> if a gradient-boosting model can't beat a well-specified regression, you didn't need it.</li>
      <li><b>A foundation:</b> logistic regression, GLMs, ridge/lasso, neural networks and even attention layers are built from the same pieces.</li>
    </ul>
    <h3>The roadmap</h3>
    <div className="flow small">
      {['Intuition', 'OLS math', 'Assumptions', 'Diagnostics', 'Tests', 'Collinearity', 'Influence', 'Inference', 'Remedies', 'Prediction', 'Metrics', 'Selection', 'Validation', 'Features', 'Gradient descent', 'Regularisation', 'Pipeline', 'Documentation'].map((s, i, a) => <span key={s} className="row" style={{ gap: 6 }}><span className="node">{s}</span>{i < a.length - 1 && <span className="arr">→</span>}</span>)}
    </div>
    <Deep title="About the dataset">
      <p>The data is a <b>synthetic replica</b> of the classic Advertising dataset from <i>An Introduction to Statistical Learning</i> (James, Witten, Hastie, Tibshirani). It is generated in code with a fixed seed, so everyone sees the same numbers and there is no licensing question. It was built to reproduce the textbook lessons: newspaper looks useful on its own but not next to radio, there is a TV × radio synergy and a diminishing return on TV, and the error spread grows with TV.</p>
      <button className="btn" onClick={() => downloadText('advertising.csv', adCsv(), 'text/csv')}>⬇ Download advertising.csv</button> <span className="small muted">to follow along in your own Jupyter notebook.</span>
    </Deep>
    <CodeLab snippets={CODE.explore} rows={12} />
  </>;
}

export function Ch2() {
  return <>
    <Callout kind="story" title="Analogy: the tailor's ruler">
      <p>A tailor has pinned 14 dots on a board and must lay one straight ruler across them so it is "closest" to all of them. Closest how? She could minimise the biggest miss, or the sum of the misses. Gauss and Legendre (around 1805, arguing over who was first) chose to minimise the <b>sum of squared vertical misses</b>. It gives a unique answer, has a closed-form solution, and, as we'll see, is the best possible linear estimate under mild conditions.</p>
    </Callout>
    <h3>Residuals: the errors we minimise</h3>
    <p>For each observation <Tex>{'i'}</Tex> the model predicts <Tex>{'\\hat y_i = b_0 + b_1 x_i'}</Tex>. The <b>residual</b> <Tex>{'e_i = y_i - \\hat y_i'}</Tex> is the vertical gap. Least squares picks the line that makes the total <b>red area</b> (the sum of squared residuals) as small as possible:</p>
    <div className="eq"><Tex block>{'\\min_{b_0, b_1}\\; \\text{SSE} = \\sum_{i=1}^{n}\\left(y_i - b_0 - b_1 x_i\\right)^2'}</Tex></div>
    <Playground />
    <h3>Why squares?</h3>
    <ul>
      <li><b>Signs don't cancel:</b> +3 and −3 don't sum to "perfect".</li>
      <li><b>Big misses cost more:</b> one miss of 4 costs as much as sixteen misses of 1. That's good when big errors are expensive, and bad when your data has outliers (try dragging one point far away).</li>
      <li><b>Calculus works:</b> SSE is a smooth bowl in (b₀, b₁), so setting derivatives to zero gives a formula (Chapter 3).</li>
      <li><b>Statistics works:</b> if errors are normal, least squares = maximum likelihood.</li>
    </ul>
    <Callout kind="warn">
      <p><b>Vertical, not perpendicular.</b> OLS minimises vertical distances because it treats x as known and y as noisy. Regressing x on y gives a <i>different</i> line. If both are noisy (for example two lab instruments), look at total least squares or Deming regression.</p>
    </Callout>
    <h3>What the numbers mean</h3>
    <ul>
      <li><b>Slope b₁:</b> the change in the <i>average</i> y for a one-unit increase in x. In the TV-only model, b₁ = {f4(F.simpleTV.beta[1])}: each extra $1k of TV goes with ~{(F.simpleTV.beta[1] * 1000).toFixed(0)} more units.</li>
      <li><b>Intercept b₀:</b> the predicted y at x = 0. It's only meaningful if x = 0 is realistic (zero TV spend is; zero house size isn't).</li>
      <li><b>R²:</b> the share of y's variance the line explains: 1 − SSE/SST.</li>
    </ul>
    <Deep title="Simple vs multiple regression: what 'holding the others fixed' really means">
      <p>In a multiple regression, <Tex>{'\\beta_j'}</Tex> is the effect of <Tex>{'x_j'}</Tex> after removing from both y and <Tex>{'x_j'}</Tex> everything the other features explain. This is the <b>Frisch–Waugh–Lovell theorem</b>: regress y on the other features and keep the residuals; regress <Tex>{'x_j'}</Tex> on the other features and keep those residuals; the slope between the two sets of residuals is exactly <Tex>{'\\hat\\beta_j'}</Tex>.</p>
      <p>That's why newspaper's simple slope ({f4(F.simpleNews.beta[1])}, p {p(F.simpleNews.p[1])}) and its multiple-regression slope ({f4(F.full.beta[3])}, p {p(F.full.p[3])}) disagree: once radio's influence is removed, nothing is left.</p>
    </Deep>
  </>;
}

export function Ch3() {
  return <>
    <Callout kind="story" title="Analogy: the shadow on the floor">
      <p>Shine a light straight down onto a table and a pencil held above it casts a shadow. The shadow is the closest point on the table to the pencil tip, and the line from tip to shadow is <i>perpendicular</i> to the table. OLS does exactly this in n-dimensional space: <b>ŷ is the shadow of y on the space spanned by your features</b>, and the residual is perpendicular to every feature.</p>
    </Callout>
    <h3>Level 1: simple regression by calculus</h3>
    <p>SSE is a bowl-shaped function of the intercept and slope. At the bottom of the bowl both partial derivatives are zero:</p>
    <div className="eq">
      <Tex block>{'\\frac{\\partial \\text{SSE}}{\\partial b_0} = -2\\sum (y_i - b_0 - b_1x_i) = 0 \\;\\Rightarrow\\; \\boxed{b_0 = \\bar y - b_1\\bar x}'}</Tex>
      <Tex block>{'\\frac{\\partial \\text{SSE}}{\\partial b_1} = -2\\sum x_i(y_i - b_0 - b_1x_i) = 0 \\;\\Rightarrow\\; \\boxed{b_1 = \\frac{\\sum (x_i-\\bar x)(y_i-\\bar y)}{\\sum (x_i-\\bar x)^2} = r_{xy}\\frac{s_y}{s_x}}'}</Tex>
    </div>
    <p>Two facts fall out: the line always passes through <Tex>{'(\\bar x, \\bar y)'}</Tex>, and the slope is the correlation rescaled into y-units per x-unit. The animation shows both steps.</p>
    <LeastSquaresAnim />
    <h3>Level 2: any number of features, in matrix form</h3>
    <p>Stack the n observations: <Tex>{'y'}</Tex> is n×1, <Tex>{'X'}</Tex> is n×k (a column of 1s plus one column per feature), <Tex>{'\\beta'}</Tex> is k×1. The model and the loss are:</p>
    <div className="eq">
      <Tex block>{'y = X\\beta + \\varepsilon, \\qquad \\text{SSE}(\\beta) = (y - X\\beta)^\\top(y - X\\beta)'}</Tex>
      <Tex block>{'\\nabla_\\beta\\,\\text{SSE} = -2X^\\top(y - X\\beta) = 0 \\;\\Rightarrow\\; \\underbrace{X^\\top X\\,\\hat\\beta = X^\\top y}_{\\text{normal equations}} \\;\\Rightarrow\\; \\boxed{\\hat\\beta = (X^\\top X)^{-1}X^\\top y}'}</Tex>
    </div>
    <p>Here it is, computed live on the Advertising data:</p>
    <NormalEquationLive />
    <div className="two">
      <div>
        <h4>The geometry</h4>
        <p>The normal equations say <Tex>{'X^\\top(y - X\\hat\\beta) = X^\\top e = 0'}</Tex>: the residual is <b>orthogonal to every column of X</b>. So ŷ is the orthogonal projection of y onto the column space of X:</p>
        <div className="eq"><Tex block>{'\\hat y = X\\hat\\beta = \\underbrace{X(X^\\top X)^{-1}X^\\top}_{H\\ (\\text{hat matrix})}\\,y'}</Tex></div>
        <p className="small">The diagonal of H, <Tex>{'h_{ii}'}</Tex>, is each point's <b>leverage</b>, which comes back in Chapter 8. Consequences of orthogonality: residuals sum to zero (when there's an intercept), and they're uncorrelated with every feature and with ŷ.</p>
      </div>
      <Projection />
    </div>
    <h3>Level 3: the statistical properties</h3>
    <p>Treat <Tex>{'\\hat\\beta'}</Tex> as a random variable: a new sample of markets would give slightly different estimates. Substituting <Tex>{'y = X\\beta + \\varepsilon'}</Tex>:</p>
    <div className="eq">
      <Tex block>{'\\hat\\beta = \\beta + (X^\\top X)^{-1}X^\\top\\varepsilon \\;\\Rightarrow\\; \\mathbb{E}[\\hat\\beta] = \\beta \\quad(\\text{if } \\mathbb{E}[\\varepsilon\\mid X]=0)'}</Tex>
      <Tex block>{'\\operatorname{Var}(\\hat\\beta\\mid X) = (X^\\top X)^{-1}X^\\top\\,\\underbrace{\\operatorname{Var}(\\varepsilon)}_{\\sigma^2 I}\\,X(X^\\top X)^{-1} = \\sigma^2 (X^\\top X)^{-1}'}</Tex>
      <Tex block>{'\\hat\\sigma^2 = \\frac{\\text{SSE}}{n-k}, \\qquad \\text{SE}(\\hat\\beta_j) = \\hat\\sigma\\sqrt{[(X^\\top X)^{-1}]_{jj}}'}</Tex>
    </div>
    <p>Every standard error, t-test and confidence interval in this guide comes from that one formula. Read it carefully: it <b>assumes</b> <Tex>{'\\operatorname{Var}(\\varepsilon) = \\sigma^2 I'}</Tex> (equal variance, no correlation). When that's false, the coefficients are still fine but the SEs are wrong. That's what Chapters 4–10 are about.</p>
    <Deep title="Gauss–Markov theorem: why OLS is 'BLUE'">
      <p><b>Claim:</b> if <Tex>{'\\mathbb{E}[\\varepsilon\\mid X] = 0'}</Tex> and <Tex>{'\\operatorname{Var}(\\varepsilon\\mid X) = \\sigma^2 I'}</Tex>, then among all <b>linear unbiased</b> estimators, OLS has the smallest variance: it's the <b>B</b>est <b>L</b>inear <b>U</b>nbiased <b>E</b>stimator. Normality is <i>not</i> required.</p>
      <p><b>Proof sketch.</b> Any linear estimator can be written <Tex>{'\\tilde\\beta = Cy'}</Tex> with <Tex>{'C = (X^\\top X)^{-1}X^\\top + D'}</Tex>. Unbiasedness for every β forces <Tex>{'DX = 0'}</Tex>. Then</p>
      <div className="eq"><Tex block>{'\\operatorname{Var}(\\tilde\\beta) = \\sigma^2 CC^\\top = \\sigma^2(X^\\top X)^{-1} + \\sigma^2 DD^\\top + \\underbrace{\\sigma^2[(X^\\top X)^{-1}X^\\top D^\\top + DX(X^\\top X)^{-1}]}_{=\\,0\\ \\text{since}\\ DX=0}'}</Tex></div>
      <p>Since <Tex>{'DD^\\top'}</Tex> is positive semi-definite, <Tex>{'\\operatorname{Var}(\\tilde\\beta) - \\operatorname{Var}(\\hat\\beta) \\succeq 0'}</Tex>. ∎</p>
      <p className="small muted">Fine print: "best among linear unbiased" leaves room for <i>biased</i> estimators with lower mean squared error. Ridge regression (Chapter 17) deliberately accepts some bias to cut variance.</p>
    </Deep>
    <Deep title="Distribution of β̂ and why t-tests use the t distribution">
      <p>Add normality, <Tex>{'\\varepsilon \\sim N(0, \\sigma^2 I)'}</Tex>. Then <Tex>{'\\hat\\beta \\sim N(\\beta, \\sigma^2(X^\\top X)^{-1})'}</Tex> exactly, and <Tex>{'(n-k)\\hat\\sigma^2/\\sigma^2 \\sim \\chi^2_{n-k}'}</Tex>, independent of <Tex>{'\\hat\\beta'}</Tex> (because the residuals live in the orthogonal complement of col(X)). Dividing a standard normal by the square root of an independent χ²/df gives a t distribution:</p>
      <div className="eq"><Tex block>{'t_j = \\frac{\\hat\\beta_j - \\beta_j}{\\text{SE}(\\hat\\beta_j)} \\sim t_{n-k}'}</Tex></div>
      <p>Without normality, the central limit theorem makes this approximately true for large n, which is why normality matters least of all the assumptions once n is in the hundreds.</p>
    </Deep>
    <Deep title="Maximum likelihood view">
      <p>With normal errors, the log-likelihood is <Tex>{'\\ell(\\beta,\\sigma^2) = -\\tfrac{n}{2}\\log(2\\pi\\sigma^2) - \\tfrac{1}{2\\sigma^2}\\lVert y - X\\beta\\rVert^2'}</Tex>. For any σ², maximising over β means minimising <Tex>{'\\lVert y - X\\beta\\rVert^2'}</Tex>: OLS. The ML variance estimate is SSE/n (biased); we use SSE/(n−k). Plugging back gives <Tex>{'\\ell_{\\max} = -\\tfrac{n}{2}[\\log(2\\pi\\,\\text{SSE}/n) + 1]'}</Tex>, the basis of AIC and BIC (Chapter 13).</p>
    </Deep>
    <Callout kind="tip" title="Never invert X'X in production">
      <p>The formula <Tex>{'(X^\\top X)^{-1}X^\\top y'}</Tex> is for understanding. Forming <Tex>{'X^\\top X'}</Tex> squares the condition number, so you lose twice the digits of precision. Libraries solve via <b>QR</b> (<Tex>{'X = QR \\Rightarrow R\\hat\\beta = Q^\\top y'}</Tex>) or the SVD. The code below shows it.</p>
    </Callout>
    <CodeLab snippets={[...CODE.scratch, ...CODE.qr]} />
  </>;
}

const ASSUME = [
  { a: 'Linearity (correct functional form)', m: 'E[ε | X] = 0: the mean of y really is Xβ', broken: 'Biased coefficients and biased predictions. The worst violation.', see: 'Curve in residuals vs fitted; RESET, Rainbow' },
  { a: 'Independence of errors', m: 'Cov(εᵢ, εⱼ) = 0 for i ≠ j', broken: 'Unbiased β, but SEs too small → false discoveries', see: 'Waves in residuals vs time; Durbin–Watson' },
  { a: 'Homoscedasticity (equal variance)', m: 'Var(εᵢ) = σ² for every i', broken: 'Unbiased β, SEs wrong (usually too small), not efficient', see: 'Funnel; scale-location; Breusch–Pagan, White' },
  { a: 'Normality of errors', m: 'ε ~ N(0, σ²)', broken: 'Small n: t/F tests and prediction intervals unreliable. Large n: mostly fine (CLT)', see: 'Q-Q plot; Shapiro–Wilk, Jarque–Bera' },
  { a: 'No perfect multicollinearity', m: 'X has full column rank', broken: "Perfect: X'X can't be inverted. Near: huge, unstable SEs", see: 'VIF, condition number' },
  { a: 'Exogeneity / no omitted confounders', m: 'Features uncorrelated with ε', broken: 'Biased, causally meaningless coefficients', see: 'Domain knowledge; can\'t be tested from residuals' },
];

export function Ch4() {
  return <>
    <Callout kind="story" title="Analogy: the warranty card">
      <p>A new car comes with a warranty, valid only if you use the right fuel and service it on schedule. OLS is the same. The <b>coefficients</b> are the car and work fairly robustly. The <b>standard errors, p-values and intervals</b> are the warranty, and they're only valid if the assumptions hold. Most real-world regression failures aren't wrong coefficients. They're confident claims that were never covered by the warranty.</p>
    </Callout>
    <p>Memorise <b>LINE</b>: <b>L</b>inearity, <b>I</b>ndependence, <b>N</b>ormality, <b>E</b>qual variance. Add no multicollinearity and exogeneity, and know which ones affect what:</p>
    <div className="tbl-wrap"><table className="tbl">
      <thead><tr><th>Assumption</th><th>Formally</th><th>If broken…</th><th>How to detect</th></tr></thead>
      <tbody>{ASSUME.map((r) => <tr key={r.a}><td><b>{r.a}</b></td><td className="small mono">{r.m}</td><td className="small">{r.broken}</td><td className="small">{r.see}</td></tr>)}</tbody>
    </table></div>
    <Callout kind="key" title="Which assumptions does each use require?">
      <ul style={{ marginBottom: 0 }}>
        <li><b>Unbiased coefficients</b> need linearity + exogeneity + no perfect collinearity.</li>
        <li><b>Correct SEs, p-values, CIs</b> also need independence + equal variance.</li>
        <li><b>Exact small-sample tests and prediction intervals</b> also need normality.</li>
        <li><b>Pure prediction</b> (you only care about RMSE) needs very little: validate out of sample and move on.</li>
      </ul>
    </Callout>
    <p>Note what's <b>not</b> on the list: the features don't need to be normal, and y itself doesn't need to be normal. Only the <i>errors</i> (estimated by residuals) matter. Asking "is my target normally distributed?" is one of the most common mistakes in interviews.</p>
    <Breaker initial={['hetero']} />
    <h3>What each violation does, in one line each</h3>
    <ul>
      <li><b>Curvature:</b> the line is systematically wrong at the ends and in the middle. The fix is in the model (terms or transforms), not in the SEs.</li>
      <li><b>Fanning variance:</b> slopes are fine. Open the "Does inference break?" tab: coverage drops below 95% because the classical SE pretends every point is equally reliable.</li>
      <li><b>Autocorrelation:</b> 120 correlated observations carry far less information than 120 independent ones, but OLS doesn't know that, so the SEs come out too small.</li>
      <li><b>Skewed errors:</b> with n = 120, inference on the slope barely changes (CLT). The damage shows up in prediction intervals, which assume a symmetric spread.</li>
      <li><b>Outliers:</b> a handful of points can rotate the line. Squared loss gives them outsized power.</li>
      <li><b>Collinearity:</b> unbiased but wildly unstable. Click "New sample" repeatedly and watch the coefficients of x and x2 swing.</li>
    </ul>
    <Deep title="Exogeneity, endogeneity and why regression ≠ causation">
      <p>If a feature is correlated with the error, through an omitted variable, reverse causality or measurement error, then <Tex>{'\\mathbb{E}[\\hat\\beta] \\neq \\beta'}</Tex>, and no amount of data fixes it. Omitted-variable bias has a formula: if the true model is <Tex>{'y = \\beta_1x_1 + \\beta_2x_2 + \\varepsilon'}</Tex> but you omit <Tex>{'x_2'}</Tex>, then</p>
      <div className="eq"><Tex block>{'\\mathbb{E}[\\tilde\\beta_1] = \\beta_1 + \\beta_2\\,\\delta, \\qquad \\delta = \\text{slope of } x_2 \\text{ on } x_1'}</Tex></div>
      <p>That's newspaper's story: omit radio (β₂ &gt; 0) and newspaper picks up radio's effect via their correlation (δ &gt; 0). In marketing, a classic endogeneity trap is that budgets are set <i>because</i> a market is expected to sell well. For causal claims you need experiments (geo-lift tests), instrumental variables, or difference-in-differences.</p>
    </Deep>
  </>;
}
