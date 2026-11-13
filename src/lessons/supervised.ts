import { Lesson } from './types';

export const SUPERVISED: Record<string, Lesson> = {
  'linear-regression': {
    minutes: 12,
    goals: ['Explain what the best-fit line is and how it is chosen', 'Interpret slope and intercept in business terms', 'Evaluate a regression with R² and RMSE and spot its limits'],
    why: 'Linear regression is the first model to try for any numeric prediction: prices, demand, costs, fuel consumption. It is fast, explainable, and the baseline every fancier model must beat.',
    explain: [
      'Plot area against price for recent flat sales and you see an upward cloud. Linear regression draws the **one straight line** that passes as close as possible to all the points: **price = slope × area + intercept**.',
      '"As close as possible" has a precise meaning: for each flat, the vertical gap between the real price and the line is the **residual** (the error). The line chosen is the one with the **smallest sum of squared residuals**. That is why it is called **least squares**.',
      'The **slope** is the business insight: "each extra 100 sq ft adds about ₹4 lakh". The **intercept** is the predicted price at zero area. It often has no real meaning; it simply positions the line.',
      'With many features (area, floor, age) it becomes **multiple regression**: one coefficient per feature, each read as "holding the others constant".',
      'Judge it with **R²** (share of variation explained) and **RMSE** (typical error in rupees), always on **test data** it has not seen.',
    ],
    formula: { tex: '\\hat y = m x + b, \\qquad \\min_{m,b} \\sum_i (y_i - \\hat y_i)^2', plain: 'Prediction = slope × input + intercept; choose slope and intercept to make the total squared error as small as possible.' },
    example: { title: 'Price a flat from three past sales', steps: ['Sales (area in 100 sq ft → price ₹L): (5 → 30), (8 → 42), (11 → 54)', 'Each extra 300 sq ft adds ₹12L → slope = 12 / 3 = ₹4L per 100 sq ft', 'Intercept: 30 = 4 × 5 + b → b = 10', 'Model: price = 4 × area + 10 → a 1,000 sq ft flat (area 10) → ₹50L'], result: 'Real data never sits perfectly on a line, so least squares finds the slope and intercept that balance all the errors. The interpretation stays the same.' },
    mistakes: ['Extrapolating far beyond the data range.', 'Letting one outlier drag the line (squared errors magnify it).', 'Reading coefficients causally ("adding a bedroom causes +₹5L") when features are correlated.', 'Fitting a straight line to a clearly curved relationship.'],
    takeaways: ['The best line minimises the squared residuals', 'Slope = change in y per unit of x', 'Check residual plots, and evaluate on test data with RMSE and R²'],
    use: ['A numeric target with roughly linear relationships', 'You need to explain the drivers', 'As the baseline before trying trees or boosting'],
    avoid: ['Strongly non-linear patterns (try polynomial terms or trees)', 'Heavy outliers (try robust regression)', 'Binary targets (use logistic regression)'],
    interview: ['What are the assumptions of linear regression (LINE)?', 'What does R² measure, and why can it mislead?', 'How do you handle multicollinearity?', 'OLS closed form vs gradient descent: when would you use each?'],
    practice: { code: `from sklearn.linear_model import LinearRegression
import numpy as np
X = np.array([[5], [8], [11]]); y = np.array([30, 42, 54])
m = LinearRegression().fit(X, y)
print(m.coef_, m.intercept_, m.predict([[10]]))     # [4.] 10.0 [50.]` },
    check: [
      { q: 'Slope = 2.5 (₹ lakh per 100 sq ft). What does it mean?', options: ['Price at zero area', 'Each extra 100 sq ft adds about ₹2.5 lakh', 'R² is 2.5', 'There are 2.5 errors'], answer: 1, why: 'The slope is the change in y per unit change in x.' },
      { q: 'Least squares minimises…', options: ['The number of points off the line', 'The sum of squared vertical errors', 'The slope', 'The largest error only'], answer: 1, why: 'The sum of squared residuals.' },
    ],
  },

  'multiple-regression': {
    minutes: 10,
    goals: ['Fit and interpret a regression with several features', 'Explain "holding other variables constant"', 'Detect multicollinearity with VIF'],
    why: 'Real outcomes have many drivers. Multiple regression separates their effects, for example how much of a price premium comes from location versus size.',
    explain: [
      'The model becomes **ŷ = b₀ + b₁x₁ + b₂x₂ + …**. Each coefficient is the expected change in y for a one-unit change in that feature **with all other features held fixed**.',
      'That "holding fixed" is the superpower: simple regression of price on bedrooms mixes up bedrooms and size; multiple regression separates them.',
      '**Multicollinearity**: when features are highly correlated (area and number of rooms), coefficients become unstable and can even flip sign. Check the **VIF** (variance inflation factor); above 5–10 is a warning.',
      'Use **adjusted R²** or cross-validation to compare models. Plain R² always rises when you add a feature, even a useless one.',
    ],
    formula: { tex: '\\hat y = \\beta_0 + \\beta_1 x_1 + \\dots + \\beta_p x_p, \\qquad \\hat\\beta = (X^TX)^{-1}X^Ty', plain: 'A weighted sum of features; the weights are found by least squares (matrix form on the right).' },
    example: { title: 'Flat price model', steps: ['price = 5 + 3.8 × area(100 sq ft) − 0.4 × age(years) + 9 × near_metro(0/1)', 'Flat: 1,000 sq ft, 8 years old, near the metro', '5 + 38 − 3.2 + 9 = ₹48.8L', 'Reading: being near the metro is worth about ₹9L at the same size and age'], result: 'Each coefficient answers a separate business question, provided the features are not strongly collinear.' },
    mistakes: ['Interpreting coefficients of collinear features.', 'Comparing raw coefficient sizes across features with different units (standardise first).', 'Adding features until R² looks great (overfitting).'],
    takeaways: ['Coefficients = effect holding others fixed', 'Watch for multicollinearity (VIF)', 'Compare models with adjusted R² or CV'],
    use: ['Explaining drivers with several inputs', 'Pricing, cost and demand models'],
    avoid: ['Highly collinear inputs without regularisation', 'More features than rows'],
    interview: ['What is multicollinearity and how do you detect it?', 'Why does R² always increase when you add features?'],
    practice: { code: `from sklearn.datasets import load_diabetes
from sklearn.linear_model import LinearRegression
import pandas as pd
X, y = load_diabetes(return_X_y=True, as_frame=True)
m = LinearRegression().fit(X, y)
print(pd.Series(m.coef_, index=X.columns).round(1).sort_values())` },
    check: [
      { q: 'Coefficient for "age" = −0.4. Interpretation?', options: ['Older flats always cost less', 'Each extra year lowers the price by ₹0.4L, holding other features fixed', 'Age explains 40%', 'Age is not significant'], answer: 1, why: 'Partial effect, other variables held constant.' },
      { q: 'VIF of 15 for a feature suggests…', options: ['A strong predictor', 'Serious multicollinearity', 'A missing value', 'Perfect fit'], answer: 1, why: 'VIF above 10 signals that the feature is largely explained by the others.' },
    ],
  },

  'polynomial-regression': {
    minutes: 8,
    goals: ['Model curved relationships with polynomial terms', 'Choose the degree with validation', 'Recognise polynomial overfitting'],
    why: 'Many relationships curve: fuel use vs speed, yield vs fertiliser, sales vs price. Polynomial terms let a linear model bend while staying simple and interpretable.',
    explain: [
      'Add new features x², x³ … and fit an ordinary linear regression on them. The model is still "linear in the coefficients", so the same least-squares machinery works.',
      'Degree 2 gives one bend (a U or an inverted U); degree 3 gives two bends.',
      'High degrees overfit dramatically: a degree-15 polynomial threads through every training point and swings wildly in between and at the edges.',
      'Choose the degree by cross-validation, scale the features first, and consider splines as a smoother alternative.',
    ],
    example: { title: 'Fuel consumption vs speed', steps: ['Litres per 100 km at 40, 60, 80, 100, 120 km/h: 7.5, 6.0, 5.6, 6.2, 7.8', 'A straight line misses the U-shape badly', 'Degree 2 fit: L ≈ 0.00129v² − 0.202v + 13.5', 'Minimum at v = 0.202 / (2 × 0.00129) ≈ 78 km/h'], result: 'The quadratic captures the "sweet spot" speed, which no straight line can.' },
    mistakes: ['Picking a high degree because the training R² is higher.', 'Extrapolating a polynomial (it explodes outside the data range).'],
    takeaways: ['Add powers of x to model curves', 'Choose the degree by validation', 'High degree = overfitting'],
    use: ['Smooth curved relationships with a known shape (one peak or trough)'],
    avoid: ['Extrapolation', 'Many features (the number of terms explodes): use trees or GAMs'],
    practice: { code: `import numpy as np
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression
v = np.array([40, 60, 80, 100, 120]).reshape(-1, 1); L = np.array([7.5, 6.0, 5.6, 6.2, 7.8])
m = make_pipeline(PolynomialFeatures(2), LinearRegression()).fit(v, L)
print(m.predict([[70], [90]]).round(2))` },
    check: [
      { q: 'Polynomial regression is still "linear" because…', options: ['The curve is straight', 'It is linear in the coefficients', 'It only uses x', 'It uses gradient descent'], answer: 1, why: 'The model is a weighted sum of (transformed) features.' },
      { q: 'Training R² rises from degree 3 to 12, but CV error rises too. Choose…', options: ['Degree 12', 'Degree 3 (or whichever has the lowest CV error)', 'Degree 1', 'Always the highest'], answer: 1, why: 'Choose by validation error, not training fit.' },
    ],
  },

  'ridge-lasso': {
    minutes: 10,
    goals: ['Explain how regularisation reduces overfitting', 'Contrast Ridge (L2), Lasso (L1) and Elastic Net', 'Tune the penalty strength with CV'],
    why: 'With many correlated features, ordinary regression overfits and gives unstable coefficients. Regularised regression is the standard fix in finance, marketing-mix models and genomics.',
    explain: [
      'Add a **penalty** for large coefficients to the loss. The model must now balance fitting the data against keeping the coefficients small. Think of it as a **budget** on coefficient size.',
      '**Ridge (L2)** penalises squared coefficients: it shrinks all of them smoothly towards zero but rarely to exactly zero. It is great with many correlated features.',
      '**Lasso (L1)** penalises absolute values: it can push coefficients **exactly to zero**, so it performs automatic feature selection.',
      '**Elastic Net** mixes the two. The penalty strength **α (lambda)** is tuned by cross-validation. **Always scale features first**, otherwise the penalty treats units unfairly.',
    ],
    formula: { tex: '\\min_\\beta \\; \\sum (y - X\\beta)^2 + \\lambda \\sum \\beta_j^2 \\;\\; (\\text{Ridge}) \\quad \\text{or} \\quad + \\lambda \\sum |\\beta_j| \\;\\; (\\text{Lasso})', plain: 'Least squares + a penalty on coefficient size: squared for Ridge, absolute for Lasso.' },
    example: { title: '50 marketing features, 200 weeks of data', steps: ['OLS: train R² 0.95, CV R² 0.41 (overfitting)', 'Ridge (α tuned by CV): CV R² 0.68', 'Lasso: CV R² 0.66, keeps only 9 of 50 features', 'Business prefers Lasso: 9 drivers are explainable'], result: 'Regularisation trades a little training fit for much better generalisation, and Lasso adds simplicity.' },
    mistakes: ['Forgetting to standardise features.', 'Choosing α by training error.', 'Over-trusting Lasso\'s pick among highly correlated features (it chooses somewhat arbitrarily).'],
    takeaways: ['A penalty on coefficients fights overfitting', 'Ridge shrinks; Lasso selects', 'Scale features; tune α with CV'],
    use: ['Many features relative to rows', 'Correlated predictors', 'You want a sparse, interpretable model (Lasso)'],
    avoid: ['Unscaled features', 'When you need unbiased coefficient estimates for inference'],
    interview: ['Why does L1 produce exact zeros but L2 does not?', 'What happens as λ → 0 and λ → ∞?'],
    practice: { code: `from sklearn.datasets import load_diabetes
from sklearn.linear_model import RidgeCV, LassoCV
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
X, y = load_diabetes(return_X_y=True)
lasso = make_pipeline(StandardScaler(), LassoCV(cv=5)).fit(X, y)
print("non-zero coefs:", (lasso[-1].coef_ != 0).sum(), "of", X.shape[1])
print("ridge alpha:", make_pipeline(StandardScaler(), RidgeCV(alphas=[0.1, 1, 10, 100])).fit(X, y)[-1].alpha_)` },
    check: [
      { q: 'Which penalty can set coefficients exactly to zero?', options: ['Ridge', 'Lasso', 'Neither', 'OLS'], answer: 1, why: 'The L1 penalty has corners at zero.' },
      { q: 'As λ grows very large, Ridge coefficients…', options: ['Grow', 'Shrink towards zero', 'Stay the same', 'Become random'], answer: 1, why: 'The penalty dominates the loss.' },
    ],
  },

  'poisson-regression': {
    minutes: 9,
    goals: ['Recognise when the target is a count', 'Fit a Poisson regression and interpret coefficients as rate ratios', 'Know the GLM family idea'],
    why: 'Insurance claim counts, website visits, defects and footfall are counts. OLS can predict negative counts and gets the variance wrong; Poisson regression handles both.',
    explain: [
      'Counts are whole numbers ≥ 0 and their variance usually grows with the mean. A **Poisson regression** models the **log of the expected count** as a linear function of the features.',
      'Because of the log, coefficients are **multiplicative**: e^β is a **rate ratio**. β = 0.2 → e^0.2 ≈ 1.22 → a 22% higher expected count per unit increase.',
      'It belongs to the **GLM** (generalised linear model) family: pick a distribution (normal, binomial, Poisson, gamma) and a link function (identity, logit, log). Logistic regression is the binomial GLM.',
      'If the variance is much larger than the mean (**over-dispersion**), use negative binomial regression. Use an **exposure/offset** when the observation windows differ (claims per policy-year).',
    ],
    formula: { tex: '\\log E[y] = \\beta_0 + \\beta_1 x_1 + \\dots', plain: 'The log of the expected count is a weighted sum of the features.' },
    example: { title: 'Car insurance claims', steps: ['Model: log(expected claims per year) = −2.3 + 0.4 × young_driver + 0.1 × (km driven / 10,000)', 'Base rate: e^−2.3 ≈ 0.10 claims per year', 'Young driver: × e^0.4 ≈ 1.49 → 49% more claims', 'A young driver doing 20,000 km: 0.10 × 1.49 × e^0.2 ≈ 0.18 claims per year'], result: 'Actuaries price premiums directly from such rate ratios.' },
    mistakes: ['Using OLS for small counts.', 'Ignoring over-dispersion.', 'Forgetting the exposure offset.'],
    takeaways: ['Count target → Poisson / negative binomial', 'e^β = rate ratio', 'GLM = distribution + link function'],
    use: ['Non-negative count targets', 'Rates per exposure (claims per policy-year)'],
    avoid: ['Variance ≫ mean (use negative binomial)', 'Many structural zeros (use zero-inflated models)'],
    practice: { code: `import numpy as np
from sklearn.linear_model import PoissonRegressor
rng = np.random.default_rng(0)
young = rng.integers(0, 2, 2000); km = rng.uniform(0.5, 3, 2000)
claims = rng.poisson(np.exp(-2.3 + 0.4 * young + 0.1 * km))
m = PoissonRegressor(alpha=0).fit(np.c_[young, km], claims)
print(np.exp(m.coef_).round(2))      # rate ratios ≈ [1.49, 1.11]` },
    check: [
      { q: 'Poisson coefficient β = 0.7. The rate ratio is about…', options: ['0.7', '2.0', '1.07', '0.5'], answer: 1, why: 'e^0.7 ≈ 2.01, so the count roughly doubles.' },
      { q: 'Logistic regression is a GLM with which distribution?', options: ['Poisson', 'Binomial', 'Gamma', 'Normal'], answer: 1, why: 'Binomial with a logit link.' },
    ],
  },

  'logistic-regression': {
    minutes: 11,
    goals: ['Explain how a sigmoid turns a score into a probability', 'Interpret coefficients as odds ratios', 'Choose a decision threshold'],
    why: 'Logistic regression is the industry standard for credit scoring, churn and medical risk: fast, well calibrated and explainable to regulators.',
    explain: [
      'Despite its name, it is a **classifier**. It computes a linear score (like linear regression), then squashes it through the **sigmoid** S-curve into a probability between 0 and 1.',
      'Score 0 → probability 0.5; large positive → close to 1; large negative → close to 0. The boundary between the classes is a straight line (a plane in higher dimensions).',
      'It is trained by minimising **log-loss** (cross-entropy), which heavily punishes confident wrong answers. There is no closed form, so it uses an iterative optimiser.',
      'Coefficients act on the **log-odds**. e^β is an **odds ratio**: β = 0.69 → e^0.69 ≈ 2, so the odds double per unit increase. The final decision uses a **threshold** (0.5 by default) that should reflect business costs.',
    ],
    formula: { tex: 'p = \\sigma(z) = \\frac{1}{1+e^{-z}}, \\qquad z = \\beta_0 + \\beta_1 x_1 + \\dots', plain: 'Probability = sigmoid of a weighted sum of features.' },
    example: { title: 'Loan default probability', steps: ['z = −4 + 0.8 × (debt-to-income in tenths)', 'Applicant with DTI 0.5 → z = −4 + 0.8 × 5 = 0', 'p = 1 / (1 + e⁰) = 0.5', 'DTI 0.7 → z = 1.6 → p = 1 / (1 + e^−1.6) ≈ 0.83'], result: 'Each +0.1 of DTI multiplies the odds of default by e^0.8 ≈ 2.2. That is a clear, explainable risk driver.' },
    mistakes: ['Using accuracy on imbalanced data.', 'Not scaling features when using regularisation (scikit-learn regularises by default).', 'Assuming a linear boundary when the classes curve (add interactions or use trees).'],
    takeaways: ['Linear score → sigmoid → probability', 'e^β = odds ratio', 'Choose the threshold by business cost'],
    use: ['Binary outcomes needing probabilities and explanations', 'Strong baseline for any classification problem'],
    avoid: ['Highly non-linear boundaries without feature engineering', 'Perfectly separable data (coefficients blow up without regularisation)'],
    interview: ['Why not use linear regression for a binary target?', 'Interpret a coefficient of 0.5.', 'What is log-loss and why is it used?'],
    practice: { code: `from sklearn.datasets import load_breast_cancer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score
X, y = load_breast_cancer(return_X_y=True)
m = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))
print(cross_val_score(m, X, y, cv=5, scoring="roc_auc").mean().round(3))` },
    check: [
      { q: 'z = 0 gives probability…', options: ['0', '0.5', '1', '0.73'], answer: 1, why: '1 / (1 + 1) = 0.5.' },
      { q: 'β = 0.69 for a feature. Its odds ratio is about…', options: ['0.69', '2', '1.69', '0.5'], answer: 1, why: 'e^0.69 ≈ 2: the odds double.' },
    ],
  },

  knn: {
    minutes: 8,
    goals: ['Explain how k-NN classifies by neighbour vote', 'Choose k and see the bias–variance effect', 'Know why scaling is essential'],
    why: 'k-NN is the simplest "learn from similar cases" model: recommendations, case-based reasoning and quick baselines. Its idea of similarity also underlies vector search in RAG systems.',
    explain: [
      'To classify a new point, find the **k closest** training points and take a **majority vote** (or average them for regression). There is no training step; the data is the model.',
      '**Small k** (1) follows every quirk of the data: low bias, high variance, noisy boundaries. **Large k** smooths the boundary: higher bias, lower variance. Choose k by cross-validation.',
      'Distances are meaningless without **scaling**: always standardise features.',
      'Weaknesses: prediction is slow on large data (it compares with every point unless you use indexes), and it suffers in high dimensions, where all points look equally far apart.',
    ],
    example: { title: 'Will this customer churn? (k = 5)', steps: ['Find the 5 most similar past customers by tenure, usage and complaints', 'Their outcomes: churn, churn, stay, churn, stay', 'Vote: 3 churn vs 2 stay → predict churn', 'Probability estimate = 3/5 = 0.6'], result: 'Easy to explain: "customers most like this one usually left".' },
    mistakes: ['Not scaling features.', 'k = 1 on noisy data.', 'Using it on millions of rows without approximate nearest-neighbour indexes.'],
    takeaways: ['Predict by the vote of the k nearest points', 'k controls the bias–variance trade-off', 'Scaling is mandatory'],
    use: ['Small to medium datasets, irregular boundaries', 'Recommendation and similarity search'],
    avoid: ['High-dimensional data', 'Very large datasets needing fast predictions', 'Unscaled features'],
    practice: { code: `from sklearn.datasets import load_wine
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score
X, y = load_wine(return_X_y=True)
for k in [1, 5, 15, 45]:
    print(k, cross_val_score(make_pipeline(StandardScaler(), KNeighborsClassifier(k)), X, y, cv=5).mean().round(3))` },
    check: [
      { q: 'Increasing k generally…', options: ['Increases variance', 'Smooths the boundary (more bias, less variance)', 'Has no effect', 'Requires retraining'], answer: 1, why: 'More neighbours average out noise.' },
      { q: 'k-NN "training" consists of…', options: ['Gradient descent', 'Storing the data', 'Building a tree', 'Computing eigenvectors'], answer: 1, why: 'It is a lazy learner.' },
    ],
  },

  'naive-bayes': {
    minutes: 8,
    goals: ['Explain the naive independence assumption', 'Apply Naive Bayes to text classification', 'Know when it works well despite the assumption'],
    why: 'Naive Bayes powered early spam filters and remains a strong, very fast baseline for text classification: support tickets, reviews, intent detection.',
    explain: [
      'Use **Bayes\' theorem** to compute P(class | features). The "naive" part assumes features are **independent given the class**, so the likelihood becomes a simple product of per-feature probabilities.',
      'In text, each word is a feature. P(spam | "free", "winner") ∝ P(spam) × P("free" | spam) × P("winner" | spam).',
      'The independence assumption is obviously false (words co-occur), yet the **ranking** of classes is often right, so classification works well.',
      'Variants: **Multinomial** (word counts), **Bernoulli** (word present/absent), **Gaussian** (continuous features). Use **Laplace smoothing** so that an unseen word does not zero out the whole product.',
    ],
    example: { title: 'Is this email spam?', steps: ['Prior: P(spam) = 0.4, P(ham) = 0.6', 'P("free" | spam) = 0.30, P("free" | ham) = 0.02', 'Spam score: 0.4 × 0.30 = 0.120; ham score: 0.6 × 0.02 = 0.012', 'Normalise: P(spam | "free") = 0.120 / 0.132 ≈ 0.91'], result: 'One word shifts the belief from 40% to 91% spam. More words multiply in more evidence.' },
    mistakes: ['Forgetting smoothing (zero probabilities).', 'Trusting its probabilities as calibrated: they tend to be extreme.'],
    takeaways: ['Bayes\' theorem + independence assumption', 'Excellent fast baseline for text', 'Good rankings, poorly calibrated probabilities'],
    use: ['Text classification baselines', 'Very small training sets', 'When speed matters'],
    avoid: ['When calibrated probabilities matter', 'Strongly interacting features'],
    practice: { code: `from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline
texts = ["free prize winner", "meeting at 10", "claim your free reward", "project update attached"]
labels = ["spam", "ham", "spam", "ham"]
m = make_pipeline(CountVectorizer(), MultinomialNB()).fit(texts, labels)
print(m.predict(["free meeting reward"]), m.predict_proba(["free meeting reward"]).round(2))` },
    check: [
      { q: 'What is "naive" about Naive Bayes?', options: ['It uses no data', 'It assumes features are independent given the class', 'It ignores the prior', 'It only works for two classes'], answer: 1, why: 'The conditional independence assumption.' },
      { q: 'Why use Laplace smoothing?', options: ['To speed up training', 'To avoid zero probabilities for unseen words', 'To scale features', 'To remove stop words'], answer: 1, why: 'One zero would wipe out the whole product.' },
    ],
  },

  'decision-tree': {
    minutes: 11,
    goals: ['Explain how a tree chooses its yes/no questions', 'Compute Gini impurity for a node', 'Control overfitting with depth and leaf size'],
    why: 'Trees produce rules people can read, which is why banks and hospitals like them. They are also the building block of random forests and gradient boosting, the strongest models for tabular data.',
    explain: [
      'A decision tree plays **20 Questions** with your data. At each step it asks the single yes/no question (for example "income ≤ ₹13 lakh?") that best separates the classes.',
      '"Best" means the children become as **pure** as possible. Purity is measured by **Gini impurity**: 0 when a node contains one class only, 0.5 for a 50/50 mix of two classes.',
      'The tree tries **every feature and every threshold**, keeps the split with the largest drop in impurity, and repeats inside each branch.',
      'Left alone, it keeps splitting until every leaf is pure, which means it memorises noise. Limit **max_depth** and **min_samples_leaf**, or prune it.',
      'To predict, drop a new case down the branches to a leaf: the leaf\'s majority class is the prediction, and its class mix is the probability.',
    ],
    formula: { tex: 'G = 1 - \\sum_c p_c^2', plain: 'Gini = 1 minus the sum of squared class shares. 0 = pure, higher = more mixed.' },
    example: { title: 'First split for loan approvals', steps: ['Root: 20 repaid, 20 defaulted → Gini = 1 − (0.5² + 0.5²) = 0.5', 'Candidate "income ≤ ₹13.5L": left 4 repaid / 16 defaulted, right 16 / 4', 'Each child: Gini = 1 − (0.2² + 0.8²) = 0.32 → weighted = 0.32', 'Impurity drop 0.5 → 0.32 = gain 0.18; if no other split beats it, this becomes the root question'], result: 'The tree\'s first rule: income ≤ ₹13.5L → mostly default. It then repeats inside each branch.' },
    mistakes: ['Growing deep trees without limits (overfitting).', 'Trusting impurity-based feature importance (biased towards features with many values).', 'Expecting smooth or diagonal boundaries (trees make staircases).'],
    takeaways: ['Greedy yes/no splits that maximise purity', 'Gini 0 = pure, 0.5 = 50/50', 'Limit depth or leaf size to avoid overfitting'],
    use: ['Explainable rules', 'Mixed numeric and categorical data, no scaling needed', 'Non-linear effects and interactions'],
    avoid: ['When you need top accuracy (use forests or boosting)', 'Smooth or diagonal relationships', 'Very small, unstable datasets'],
    interview: ['How does a tree choose a split?', 'Gini vs entropy?', 'How do you prevent overfitting in trees?', 'Why are trees unstable?'],
    practice: { code: `from sklearn.datasets import load_iris
from sklearn.tree import DecisionTreeClassifier, export_text
X, y = load_iris(return_X_y=True)
t = DecisionTreeClassifier(max_depth=2, random_state=0).fit(X, y)
print(export_text(t, feature_names=["sepal_len", "sepal_wid", "petal_len", "petal_wid"]))` },
    check: [
      { q: 'A node has 9 of class A and 1 of class B. Gini?', options: ['0.18', '0.5', '0.9', '0.1'], answer: 0, why: '1 − (0.9² + 0.1²) = 1 − 0.82 = 0.18.' },
      { q: 'Train accuracy 100%, test 70%. Fix?', options: ['Deeper tree', 'Limit max_depth / min_samples_leaf', 'Remove the test set', 'Scale features'], answer: 1, why: 'The tree is overfitting.' },
    ],
  },

  svm: {
    minutes: 9,
    goals: ['Explain the maximum-margin idea', 'Identify support vectors', 'Tune C to trade margin width against errors'],
    why: 'SVMs were the state of the art before deep learning, and remain strong for small to medium datasets with many features, such as text, bioinformatics and image descriptors.',
    explain: [
      'Many lines can separate two classes. An SVM picks the one with the **widest street** (margin) between them, like placing a road as far as possible from both villages.',
      'Only the points on the edge of the street, the **support vectors**, define the boundary. Move any other point and nothing changes.',
      'Real data overlaps, so the **soft margin** allows some violations. **C** controls the trade-off: large C means few violations and a narrow street (risk of overfitting); small C means a wider street that tolerates errors.',
      'SVMs need **scaled features**. For non-linear boundaries, use the **kernel trick** (next topic).',
    ],
    example: { title: 'Effect of C on a noisy dataset', steps: ['C = 0.01: wide margin, 12% training errors, CV accuracy 85%', 'C = 1: balanced margin, 6% training errors, CV accuracy 91%', 'C = 1,000: narrow margin bending around noise, 1% training errors, CV accuracy 84%'], result: 'C = 1 wins. As always, choose by validation, not training error.' },
    mistakes: ['Not scaling features.', 'Expecting probabilities (they need extra calibration).', 'Using it on millions of rows (training scales poorly).'],
    takeaways: ['Maximise the margin', 'Support vectors define the boundary', 'C trades margin width against training errors'],
    use: ['Small to medium datasets with many features', 'Clear margin of separation', 'Text classification (linear SVM)'],
    avoid: ['Very large datasets', 'When probabilities or interpretability are required'],
    practice: { code: `from sklearn.datasets import load_breast_cancer
from sklearn.svm import SVC
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score
X, y = load_breast_cancer(return_X_y=True)
for C in [0.01, 1, 100]:
    print(C, cross_val_score(make_pipeline(StandardScaler(), SVC(kernel="linear", C=C)), X, y, cv=5).mean().round(3))` },
    check: [
      { q: 'Support vectors are…', options: ['All training points', 'The points on or inside the margin that define the boundary', 'Outliers removed before training', 'The cluster centres'], answer: 1, why: 'Only they determine the separating hyperplane.' },
      { q: 'Very large C tends to…', options: ['Widen the margin', 'Narrow the margin and risk overfitting', 'Remove support vectors', 'Make it unsupervised'], answer: 1, why: 'It strongly penalises any violation.' },
    ],
  },

  'kernel-svm': {
    minutes: 9,
    goals: ['Explain the kernel trick intuitively', 'Use an RBF kernel and tune gamma and C', 'Recognise when kernels help'],
    why: 'Kernels let a linear method draw curved boundaries without explicitly creating thousands of features. The same idea appears in Gaussian processes and kernel PCA.',
    explain: [
      'Some data cannot be separated by a straight line, such as one class in a ring around another. Map the points into a **higher dimension** (add z = x² + y²) and a flat plane separates them.',
      'The **kernel trick** computes similarities as if the data were in that higher space, **without ever building it**. That is cheap even for infinite-dimensional mappings.',
      'The **RBF (Gaussian) kernel** is the default. Its **gamma** sets how far each point\'s influence reaches: large gamma gives very local, wiggly boundaries (overfitting); small gamma gives smooth boundaries.',
      'Tune **C and gamma together** with a grid search on a log scale (0.001, 0.01, 0.1 …).',
    ],
    formula: { tex: 'K(x, x\') = \\exp\\left(-\\gamma \\lVert x - x\' \\rVert^2\\right)', plain: 'RBF similarity: 1 for identical points, falling towards 0 with distance; gamma controls how fast it falls.' },
    example: { title: 'Concentric circles', steps: ['Linear SVM accuracy: about 50% (a coin flip)', 'Add feature r² = x² + y²: inner ring has small r², outer ring large', 'A single threshold on r² separates them perfectly', 'RBF SVM finds this boundary automatically: about 99% accuracy'], result: 'The kernel did the feature engineering implicitly.' },
    mistakes: ['Large gamma + large C → memorising the data.', 'Forgetting to scale features.', 'Using kernel SVMs on very large data (quadratic memory).'],
    takeaways: ['Kernels = implicit high-dimensional features', 'RBF is the default; tune C and gamma together', 'Powerful on small to medium non-linear problems'],
    use: ['Non-linear boundaries on small to medium datasets'],
    avoid: ['Large datasets (>100k rows)', 'When interpretability matters'],
    practice: { code: `from sklearn.datasets import make_circles
from sklearn.svm import SVC
from sklearn.model_selection import GridSearchCV
X, y = make_circles(400, noise=0.1, factor=0.4, random_state=0)
print(SVC(kernel="linear").fit(X, y).score(X, y))
g = GridSearchCV(SVC(kernel="rbf"), {"C": [0.1, 1, 10], "gamma": [0.1, 1, 10]}, cv=5).fit(X, y)
print(g.best_params_, round(g.best_score_, 3))` },
    check: [
      { q: 'The kernel trick lets an SVM…', options: ['Skip training', 'Fit non-linear boundaries without explicitly creating the high-dimensional features', 'Become a tree', 'Avoid scaling'], answer: 1, why: 'It computes inner products in the implicit space.' },
      { q: 'A very large gamma in RBF leads to…', options: ['Very smooth boundaries', 'Very local, wiggly boundaries (overfitting)', 'A linear model', 'No support vectors'], answer: 1, why: 'Each point influences only a tiny neighbourhood.' },
    ],
  },

  lda: {
    minutes: 8,
    goals: ['Explain LDA as a projection that separates classes', 'Contrast LDA with PCA', 'Know LDA\'s assumptions'],
    why: 'LDA is a fast, stable classifier and a supervised dimensionality-reduction tool, used in face recognition (Fisherfaces), credit scoring and marketing.',
    explain: [
      '**Linear Discriminant Analysis** finds the direction (camera angle) where the class means are **far apart** relative to the spread **within** each class.',
      'Unlike **PCA**, which ignores labels and keeps the directions of maximum total variance, LDA uses the labels to keep the directions that best **separate** the classes.',
      'As a classifier it models each class as a normal distribution with a **shared covariance**, which gives linear boundaries. QDA allows separate covariances (curved boundaries).',
      'With k classes, LDA can reduce the data to at most **k − 1** dimensions, ideal for 2-D plots of 3-class problems.',
    ],
    example: { title: 'Two wine types, two chemical features', steps: ['PCA\'s first direction follows the overall spread, but both classes overlap along it', 'LDA\'s direction cuts across, where the class means differ most relative to their spread', 'Projected onto LDA\'s axis: two well-separated bumps', 'Classification accuracy: about 95% with one dimension'], result: 'With labels available, LDA often gives a far more useful 1-D or 2-D view than PCA.' },
    mistakes: ['Using it with strongly non-normal or very unequal class covariances (try QDA or logistic regression).', 'Expecting more than k − 1 components.'],
    takeaways: ['Maximise between-class vs within-class spread', 'Supervised, unlike PCA', 'At most k − 1 components'],
    use: ['Small datasets, roughly normal features', 'Supervised dimensionality reduction for visualisation'],
    avoid: ['Strongly non-linear class structure', 'Heavy outliers'],
    practice: { code: `from sklearn.datasets import load_wine
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
from sklearn.model_selection import cross_val_score
X, y = load_wine(return_X_y=True)
lda = LinearDiscriminantAnalysis(n_components=2)
print(cross_val_score(lda, X, y, cv=5).mean().round(3), lda.fit_transform(X, y).shape)` },
    check: [
      { q: 'Main difference between LDA and PCA?', options: ['LDA uses class labels', 'PCA uses class labels', 'They are identical', 'LDA is non-linear'], answer: 0, why: 'LDA is supervised.' },
      { q: 'With 4 classes, LDA gives at most…', options: ['4 components', '3 components', '2 components', 'Any number'], answer: 1, why: 'k − 1 = 3.' },
    ],
  },
};
