// Chapters 13–17: model selection, validation, feature engineering, gradient descent, regularisation.
import { Tex } from '../../components/Tex';
import { CodeLab } from '../../components/CodeLab';
import { Callout, Deep } from '../ui';
import { CODE } from './code';
import { F } from './facts';
import { CVWidget, DummyTrap, GDLab, InteractionPlot, StepwiseNoise, SubsetTable } from './widgets4';
import { RegLab } from './widgets5';

export function Ch13() {
  return <>
    <Callout kind="story" title="Analogy: packing for a trip">
      <p>Pack too little and you're cold; pack everything and you can't lift the bag. Each feature you add makes the model fit the training data a little better and makes it a little heavier: more variance, more chance of fitting noise. Model selection criteria put a price on luggage.</p>
    </Callout>
    <h3>Information criteria: fit minus a complexity penalty</h3>
    <div className="eq">
      <Tex block>{'\\text{AIC} = -2\\ell_{\\max} + 2k, \\qquad \\text{BIC} = -2\\ell_{\\max} + k\\ln n, \\qquad C_p = \\frac{\\text{SSE}_p}{\\hat\\sigma^2_{\\text{full}}} - n + 2p'}</Tex>
    </div>
    <ul>
      <li><b>AIC</b> (Akaike, 1973) estimates out-of-sample prediction error (expected KL divergence). It tends to pick slightly larger models. Best for prediction.</li>
      <li><b>BIC</b> (Schwarz, 1978) approximates the posterior probability of the model. Its penalty ln(n) &gt; 2 once n ≥ 8, so it picks smaller models and is <i>consistent</i> (finds the true model as n → ∞, if it's among the candidates). Best for explanation.</li>
      <li><b>Mallows' Cp</b> ≈ AIC for OLS. A good model has Cp ≈ p.</li>
      <li>Lower is better. Only differences matter: ΔAIC &lt; 2 is "equivalent", &gt; 10 is decisive. Compare only models fitted to <b>the same rows of the same y</b> (no log y vs y!).</li>
    </ul>
    <SubsetTable />
    <h3>Search strategies</h3>
    <ul>
      <li><b>Best subset</b>: try all 2<sup>p</sup> models. Exact, but infeasible beyond ~30 features (mixed-integer solvers push this further).</li>
      <li><b>Forward / backward / stepwise</b>: greedy. Add (or drop) the feature that improves AIC most until nothing helps. Fast, but path-dependent and unstable.</li>
      <li><b>Regularisation</b> (Lasso, Chapter 17): selection by continuous shrinkage, with a CV-tuned penalty. The modern default.</li>
      <li><b>Domain knowledge</b>: a causal diagram (DAG) beats any algorithm for explanatory models. Decide what must be controlled for <i>before</i> looking at p-values.</li>
    </ul>
    <StepwiseNoise />
    <Callout kind="warn" title="Why statisticians distrust stepwise">
      <p>After data-driven selection, the reported SEs are too small, p-values too small, R² too high, and coefficients biased away from zero (only the "lucky" estimates survive), and the selected set changes with small data perturbations. If you must use it: validate on held-out data, bootstrap the selection to see how stable it is, and never present the post-selection p-values as confirmatory.</p>
    </Callout>
    <Deep title="Hierarchy principle and interpretability">
      <p>If an interaction <Tex>{'x_1x_2'}</Tex> is in the model, keep both main effects. If <Tex>{'x^2'}</Tex> is in, keep x. Otherwise the model changes when you merely shift a variable's origin (e.g. measuring budgets from $10k instead of $0), which is unacceptable for an explanatory model. Criteria don't know this rule, so enforce it yourself.</p>
    </Deep>
    <CodeLab snippets={CODE.selection} />
  </>;
}

export function Ch14() {
  return <>
    <Callout kind="story" title="Analogy: the exam you've seen before">
      <p>A student who memorised last year's paper scores 100% on it and fails the real exam. Training error is last year's paper. <b>Validation error is the real exam</b>, and it's the only number that tells you how the model will behave on next quarter's markets.</p>
    </Callout>
    <h3>Bias–variance decomposition</h3>
    <div className="eq"><Tex block>{'\\mathbb{E}\\big[(y_0 - \\hat f(x_0))^2\\big] = \\underbrace{\\big(f(x_0) - \\mathbb{E}\\hat f(x_0)\\big)^2}_{\\text{bias}^2\\ (\\text{too simple})} + \\underbrace{\\operatorname{Var}\\big(\\hat f(x_0)\\big)}_{\\text{variance}\\ (\\text{too flexible})} + \\underbrace{\\sigma^2}_{\\text{irreducible}}'}</Tex></div>
    <CVWidget />
    <h3>Validation schemes</h3>
    <div className="tbl-wrap"><table className="tbl">
      <thead><tr><th>Scheme</th><th>How</th><th>Use when</th></tr></thead>
      <tbody>
        <tr><td><b>Train / test split</b></td><td>Hold out 20–30% once</td><td>Lots of data; final sign-off on a locked model</td></tr>
        <tr><td><b>k-fold CV</b></td><td>Split into k folds; each fold is the test set once; average</td><td>The default for model selection (k = 5 or 10)</td></tr>
        <tr><td><b>Repeated k-fold</b></td><td>k-fold with several shuffles</td><td>Small data; you need stable estimates</td></tr>
        <tr><td><b>LOOCV</b></td><td>k = n. For OLS it's free: <Tex>{'\\text{PRESS} = \\sum (e_i/(1-h_{ii}))^2'}</Tex></td><td>Small n, linear models</td></tr>
        <tr><td><b>Time-series CV</b></td><td>Expanding window: train on the past, test on the next block</td><td>Any time-ordered data: <b>never</b> shuffle</td></tr>
        <tr><td><b>Group k-fold</b></td><td>Keep all rows of a store / customer in the same fold</td><td>Repeated measures; prevents leakage across groups</td></tr>
        <tr><td><b>Nested CV</b></td><td>Inner loop tunes, outer loop evaluates</td><td>Honest error estimates when you also tune hyperparameters</td></tr>
      </tbody>
    </table></div>
    <Callout kind="warn" title="Data leakage: the silent killer">
      <p>Anything learned from the data (scaling means, imputation values, selected features, target encodings) must be learned <b>inside</b> each training fold. Scale the whole dataset first and then cross-validate, and the test folds have leaked into training. Use sklearn <span className="kbd">Pipeline</span> so the preprocessing is refitted per fold automatically.</p>
    </Callout>
    <Deep title="Learning curves: more data or a better model?">
      <p>Plot training and validation error against training-set size. <b>Both high and close together</b>: high bias, so more data won't help; add features or flexibility. <b>Big gap, validation still falling</b>: high variance, so more data or regularisation will help. The code below prints the curve for a degree-2 model on the Advertising data: the gap closes by about 120 markets.</p>
    </Deep>
    <CodeLab snippets={CODE.cv} />
  </>;
}

export function Ch15() {
  return <>
    <Callout kind="story" title="Analogy: the chef's mise en place">
      <p>A great chef spends more time preparing ingredients than cooking. In regression, <b>feature engineering is the preparation</b>: "linear" means linear in the <i>coefficients</i>, not in x. So log(TV), TV², TV × radio and region dummies are all fair game, and that's how a straight-line model captures curves, synergies and categories.</p>
    </Callout>
    <h3>Categorical features: dummy (one-hot) encoding</h3>
    <p>A category with L levels becomes L − 1 indicator columns. The omitted level is the <b>baseline</b>, absorbed into the intercept, and each dummy's coefficient is the difference from it.</p>
    <DummyTrap />
    <h3>Interactions: when one feature changes another's effect</h3>
    <div className="eq"><Tex block>{'\\text{sales} = \\beta_0 + \\beta_1\\text{TV} + \\beta_2\\text{radio} + \\beta_3\\,\\text{TV}\\times\\text{radio} \\quad\\Rightarrow\\quad \\frac{\\partial\\,\\text{sales}}{\\partial\\,\\text{TV}} = \\beta_1 + \\beta_3\\,\\text{radio}'}</Tex></div>
    <InteractionPlot />
    <h3>Polynomials, logs and splines: bending the line</h3>
    <ul>
      <li><b>Polynomial</b> <Tex>{'x, x^2, x^3'}</Tex>: simple, but wild at the edges for high degrees. Centre x first to reduce collinearity between x and x².</li>
      <li><b>Log</b> <Tex>{'\\log x'}</Tex>: diminishing returns ("each doubling of TV adds a constant amount"). Log-log models give elasticities: β = % change in y per 1% change in x.</li>
      <li><b>Splines</b> (natural cubic, B-splines): flexible curves with local control, and behave far better than high-degree polynomials. <span className="kbd">SplineTransformer</span> in sklearn, <span className="kbd">bs(x, df=4)</span> in patsy formulas.</li>
      <li><b>Binning</b>: easy to explain, but throws away information and creates artificial jumps. Use it sparingly.</li>
    </ul>
    <p>On the Advertising data, TV + radio + TV² + TV×radio lifts R² from {F.tr.r2.toFixed(3)} to <b>{F.fin.r2.toFixed(3)}</b> and removes the U-shape from the residuals.</p>
    <h3>Scaling</h3>
    <p>OLS predictions don't depend on feature scales: rescaling x by 1000 rescales β by 1/1000. Scaling <b>does</b> matter for (1) gradient descent speed (Chapter 16), (2) regularisation (penalties must treat features equally, Chapter 17), and (3) comparing coefficient sizes. Standardised coefficients ("β per standard deviation") are a quick importance ranking, but not a causal one.</p>
    <Callout kind="tip" title="Interpretation cheat-codes">
      <ul style={{ marginBottom: 0 }}>
        <li>y ~ x: +1 unit of x → +β units of y</li>
        <li>log y ~ x: +1 unit of x → ×e<sup>β</sup> (≈ +100β %)</li>
        <li>y ~ log x: +1% in x → +β/100 units of y</li>
        <li>log y ~ log x: +1% in x → +β % in y (elasticity)</li>
      </ul>
    </Callout>
    <CodeLab snippets={CODE.features} />
  </>;
}

export function Ch16() {
  return <>
    <Callout kind="story" title="Analogy: walking down a foggy hill">
      <p>You're on a hillside in thick fog and want the valley floor. You can't see it, but you can feel the slope under your feet. So you take a step downhill, feel again, and repeat. That's gradient descent. The step length is the <b>learning rate</b>: too short and you'll be walking all night, too long and you leap over the valley and up the other side.</p>
    </Callout>
    <h3>Why bother when a formula exists?</h3>
    <ul>
      <li>The closed form costs <Tex>{'O(nk^2 + k^3)'}</Tex>. With k = 100,000 features (text, one-hot IDs), forming and factorising X'X is impossible. Each gradient step costs only <Tex>{'O(nk)'}</Tex>.</li>
      <li>With data that doesn't fit in memory, or arrives as a stream, <b>stochastic</b> gradient descent learns from one row (or mini-batch) at a time.</li>
      <li>It's the same algorithm that trains logistic regression and every neural network, so this is the place to build intuition.</li>
    </ul>
    <div className="eq">
      <Tex block>{'L(\\beta) = \\tfrac1n\\lVert y - X\\beta\\rVert^2, \\qquad \\nabla L = -\\tfrac2n X^\\top(y - X\\beta), \\qquad \\beta \\leftarrow \\beta - \\eta\\,\\nabla L'}</Tex>
    </div>
    <GDLab />
    <h3>The three flavours</h3>
    <div className="tbl-wrap"><table className="tbl">
      <thead><tr><th>Variant</th><th>Gradient from</th><th>Pros</th><th>Cons</th></tr></thead>
      <tbody>
        <tr><td><b>Batch</b></td><td>All n rows</td><td>Smooth, deterministic, converges to the exact optimum</td><td>Every step touches all the data</td></tr>
        <tr><td><b>Mini-batch</b></td><td>b rows (32–1024)</td><td>Vectorised on GPUs; the de facto standard</td><td>Needs a learning-rate schedule</td></tr>
        <tr><td><b>Stochastic</b></td><td>1 row</td><td>Cheapest step; works on streams; the noise helps escape bad regions in non-convex problems</td><td>Noisy; needs a decaying η to converge</td></tr>
      </tbody>
    </table></div>
    <Deep title="Convergence: why scaling and the learning rate matter">
      <p>The loss is a quadratic bowl with Hessian <Tex>{'H = \\tfrac2n X^\\top X'}</Tex>, eigenvalues <Tex>{'\\lambda_{\\min} \\le \\dots \\le \\lambda_{\\max}'}</Tex>. Batch GD converges if and only if <Tex>{'0 < \\eta < 2/\\lambda_{\\max}'}</Tex>, and the error shrinks per step by at most a factor <Tex>{'\\max|1 - \\eta\\lambda|'}</Tex>. With the best fixed η, that's <Tex>{'(\\kappa - 1)/(\\kappa + 1)'}</Tex> where <Tex>{'\\kappa = \\lambda_{\\max}/\\lambda_{\\min}'}</Tex>. Raw TV ($k, variance ≈ 6,400) and radio (variance ≈ 200) give a large κ, a narrow valley and slow progress. Standardising makes <Tex>{'\\kappa = (1+|r|)/(1-|r|)'}</Tex>, where r is the TV–radio correlation (r ≈ 0.12, so κ ≈ 1.3): a nearly round bowl and fast convergence. Momentum, Adam and Newton's method are all ways of fighting a bad κ.</p>
    </Deep>
    <CodeLab snippets={CODE.gd} />
  </>;
}

export function Ch17() {
  return <>
    <Callout kind="story" title="Analogy: a budget for your coefficients">
      <p>Give a new manager unlimited budget and they'll fund every pet project, including the useless ones. Give them a fixed budget and they fund only what matters most. Regularisation gives the coefficients a <b>budget</b>. Ridge makes everyone take a proportional cut. Lasso shuts whole projects down.</p>
    </Callout>
    <div className="eq">
      <Tex block>{'\\textbf{Ridge:}\\ \\min_\\beta \\tfrac{1}{2n}\\lVert y - X\\beta\\rVert^2 + \\tfrac{\\alpha}{2}\\lVert\\beta\\rVert_2^2 \\;\\Rightarrow\\; \\hat\\beta = (X^\\top X + n\\alpha I)^{-1}X^\\top y'}</Tex>
      <Tex block>{'\\textbf{Lasso:}\\ \\min_\\beta \\tfrac{1}{2n}\\lVert y - X\\beta\\rVert^2 + \\alpha\\lVert\\beta\\rVert_1 \\qquad \\textbf{Elastic Net:}\\ \\ldots + \\alpha\\big(\\rho\\lVert\\beta\\rVert_1 + \\tfrac{1-\\rho}{2}\\lVert\\beta\\rVert_2^2\\big)'}</Tex>
    </div>
    <p>The intercept is never penalised, and features <b>must be standardised</b> first: otherwise the penalty punishes features just for being measured in small units.</p>
    <RegLab />
    <h3>Choosing between them</h3>
    <div className="tbl-wrap"><table className="tbl">
      <thead><tr><th></th><th>Ridge (L2)</th><th>Lasso (L1)</th><th>Elastic Net</th></tr></thead>
      <tbody>
        <tr><td>Exact zeros / selection</td><td>No</td><td>Yes</td><td>Yes</td></tr>
        <tr><td>Correlated features</td><td>Shares the weight among them (stable)</td><td>Picks one arbitrarily (unstable)</td><td>Keeps the group together</td></tr>
        <tr><td>p &gt; n</td><td>Works</td><td>Selects at most n features</td><td>Works</td></tr>
        <tr><td>Closed form</td><td>Yes</td><td>No (coordinate descent)</td><td>No</td></tr>
        <tr><td>Bayesian view</td><td>Gaussian prior on β</td><td>Laplace prior on β</td><td>Mixture</td></tr>
        <tr><td>Reach for it when</td><td>Many small effects, collinearity</td><td>A few big effects, you want a sparse, explainable model</td><td>Groups of correlated features, p ≫ n (genomics, text)</td></tr>
      </tbody>
    </table></div>
    <Callout kind="warn" title="Regularised coefficients are biased by design">
      <p>Don't read Lasso or Ridge coefficients as effect sizes, and don't put classical p-values on them. They're shrunk towards zero on purpose. For inference after Lasso selection you need specialised methods (post-selection inference, the debiased Lasso), or refit OLS on the selected features <b>using new data</b>.</p>
    </Callout>
    <Deep title="Why the Lasso solution is a soft-threshold">
      <p>With standardised, uncorrelated features, coordinate-wise optimality gives <Tex>{'\\hat\\beta_j^{\\text{lasso}} = S(\\hat\\beta_j^{\\text{OLS}}, \\alpha) = \\operatorname{sign}(\\hat\\beta_j)\\,\\max(|\\hat\\beta_j| - \\alpha, 0)'}</Tex>, while <Tex>{'\\hat\\beta_j^{\\text{ridge}} = \\hat\\beta_j^{\\text{OLS}}/(1 + \\alpha)'}</Tex>. Ridge scales everything down; Lasso subtracts a constant and clips at zero. With correlated features the coordinate-descent algorithm in this page (and in sklearn) cycles that update until convergence: <Tex>{'\\beta_j \\leftarrow S\\big(\\tfrac1n x_j^\\top r_{(j)},\\ \\alpha\\rho\\big) / \\big(1 + \\alpha(1-\\rho)\\big)'}</Tex>.</p>
    </Deep>
    <CodeLab snippets={CODE.regularization} />
  </>;
}
