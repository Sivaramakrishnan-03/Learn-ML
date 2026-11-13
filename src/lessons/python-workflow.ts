import { Lesson } from './types';

export const PYTHON_WORKFLOW: Record<string, Lesson> = {
  numpy: {
    minutes: 8,
    goals: ['Create NumPy arrays and check their shape', 'Use vectorised operations instead of loops', 'Use boolean masks to filter data'],
    why: 'pandas, scikit-learn, SciPy and PyTorch are all built on NumPy arrays. Vectorised NumPy code is often 50–100× faster than a Python loop.',
    explain: [
      'A NumPy **array** is a grid of numbers of the same type. `np.array([1, 2, 3])` is 1-D; a table is 2-D with a `.shape` like (rows, columns).',
      '**Vectorisation** means applying an operation to the whole array at once: `prices * 1.18` adds GST to a million prices in one line, without writing a loop.',
      '**Broadcasting** lets arrays of different shapes combine sensibly: subtracting a row of column-means from a whole table centres every column.',
      '**Boolean masks** filter data: `prices[prices > 50]` keeps only the values above 50. This idea carries straight over to pandas.',
    ],
    example: { title: 'Add GST and find expensive items', steps: ['prices = np.array([40, 120, 75])', 'with_gst = prices * 1.18 → [47.2, 141.6, 88.5]', 'mask = with_gst > 80 → [False, True, True]', 'with_gst[mask] → [141.6, 88.5]'], result: 'No loops: one line per step, and it scales to millions of rows.' },
    mistakes: ['Writing Python for-loops over arrays.', 'Confusing shape (3,) with (3, 1): many "shape mismatch" errors come from this.'],
    takeaways: ['Arrays + vectorised maths = fast', 'Always check `.shape`', 'Boolean masks filter'],
    practice: { code: `import numpy as np
prices = np.array([40, 120, 75])
with_gst = prices * 1.18
print(with_gst[with_gst > 80])          # [141.6  88.5]
X = np.random.default_rng(0).normal(size=(1000, 3))
print(X.shape, X.mean(axis=0).round(2))  # column means` },
    check: [
      { q: 'np.array([[1, 2, 3], [4, 5, 6]]).shape is…', options: ['(3, 2)', '(2, 3)', '(6,)', '(2,)'], answer: 1, why: '2 rows, 3 columns.' },
      { q: 'Fastest way to double every element of a NumPy array a?', options: ['A for-loop', 'a * 2', 'list comprehension', 'map()'], answer: 1, why: 'Vectorised arithmetic runs in optimised C.' },
    ],
  },

  pandas: {
    minutes: 10,
    goals: ['Load a CSV into a DataFrame and inspect it', 'Filter rows, select columns and create new columns', 'Summarise data with groupby'],
    why: 'pandas is the everyday tool for data preparation. Most of a data scientist\'s time goes into cleaning and shaping data here, before any model is trained.',
    explain: [
      'A **DataFrame** is a table with named columns, like an Excel sheet that remembers every step you took. A single column is a **Series**.',
      'Start every analysis with `df.head()`, `df.info()` (types and missing values) and `df.describe()` (summary statistics).',
      'Select with `df["col"]`, filter with a condition `df[df["city"] == "Chennai"]`, and create columns with `df["price_per_sqft"] = df.price / df.area`.',
      '`groupby` is the pivot table of pandas: "split by category, apply a summary, combine". `df.groupby("city")["price"].mean()` gives the average price per city.',
    ],
    example: { title: 'Average price per city', steps: ['Rows: Chennai ₹60L, Chennai ₹80L, Pune ₹50L, Pune ₹70L, Pune ₹90L', 'groupby("city")["price"].mean()', 'Chennai → (60 + 80) / 2 = ₹70L', 'Pune → (50 + 70 + 90) / 3 = ₹70L'], result: 'Same average, but Pune has a wider spread. Add .agg(["mean", "std", "count"]) to see it.' },
    mistakes: ['Chained assignment (`df[df.a > 1]["b"] = 0`) silently fails. Use `df.loc[df.a > 1, "b"] = 0`.', 'Forgetting that most operations return a new DataFrame rather than changing the original.'],
    takeaways: ['head / info / describe first', 'loc for filtering and assigning', 'groupby = split → apply → combine'],
    practice: { code: `import pandas as pd
df = pd.DataFrame({"city": ["Chennai", "Chennai", "Pune", "Pune", "Pune"],
                   "price": [60, 80, 50, 70, 90], "area": [900, 1200, 800, 1000, 1400]})
df["price_per_100sqft"] = df.price / df.area * 100
print(df.groupby("city")["price"].agg(["mean", "std", "count"]))` },
    check: [
      { q: 'Which shows column types and missing counts?', options: ['df.head()', 'df.info()', 'df.plot()', 'df.T'], answer: 1, why: '`info()` lists dtypes and non-null counts.' },
      { q: 'Safest way to set column b to 0 where a > 1?', options: ['df[df.a > 1]["b"] = 0', 'df.loc[df.a > 1, "b"] = 0', 'df.b = 0', 'df.where(a > 1)'], answer: 1, why: '`.loc` assigns on the original DataFrame.' },
    ],
  },

  plotting: {
    minutes: 8,
    goals: ['Choose the right chart for a question', 'Use histograms, box plots and scatter plots for EDA', 'Spot outliers, skew and relationships visually'],
    why: 'Exploratory data analysis (EDA) catches data errors, outliers and leakage before they ruin a model. Anscombe\'s quartet shows four datasets with identical statistics but completely different pictures.',
    explain: [
      '**Histogram**: the shape of one numeric variable. Is it symmetric, skewed, or does it have two peaks?',
      '**Box plot**: median, quartiles and outliers. Great for comparing a number across groups (salary by department).',
      '**Scatter plot**: the relationship between two numbers. Look for trends, curves, clusters and outliers.',
      '**Bar chart** for counts per category; **line chart** for values over time. Always label axes with units.',
    ],
    example: { title: 'A suspicious flat price', steps: ['Histogram of prices: most between ₹20–90L', 'One bar at ₹960L', 'Scatter of price vs area: that point has only 400 sq ft', 'Investigate: an extra zero was typed (₹96L)'], result: 'One plot saved the regression model from being dragged by a typo.' },
    mistakes: ['Computing statistics without ever looking at the data.', 'Pie charts with many slices; truncated y-axes on bar charts.'],
    takeaways: ['Plot before you model', 'Histogram = distribution, box = groups and outliers, scatter = relationships', 'Label axes and units'],
    practice: { code: `import pandas as pd, matplotlib.pyplot as plt
df = pd.DataFrame({"area": [900, 1200, 400, 1000], "price": [60, 80, 960, 70]})
df.plot.scatter(x="area", y="price"); plt.show()
df["price"].plot.hist(bins=20); plt.show()
df.boxplot(column="price"); plt.show()`, note: 'Charts need a plotting backend, so run this in Jupyter or VS Code rather than in the in-browser runner.' },
    check: [
      { q: 'Best chart to compare salary distributions across five departments?', options: ['Pie chart', 'Box plot', 'Line chart', 'Single histogram'], answer: 1, why: 'Box plots compare medians, spread and outliers side by side.' },
      { q: 'Best chart to see if price rises with area?', options: ['Scatter plot', 'Pie chart', 'Bar chart of counts', 'Histogram of area'], answer: 0, why: 'Scatter plots show the relationship between two numeric variables.' },
    ],
  },

  'ml-overview': {
    minutes: 8,
    goals: ['Explain what machine learning is in one sentence', 'Distinguish supervised, unsupervised and reinforcement learning', 'Tell regression from classification'],
    why: 'Framing the problem correctly is the first decision in every ML project. Picking "classification" when you really need "ranking" or "forecasting" wastes months.',
    explain: [
      'Traditional programming: **rules + data → answers**. Machine learning: **data + answers → rules**. You show examples and the algorithm learns the pattern.',
      '**Supervised learning** has labelled examples: past loans with "repaid / defaulted". It predicts the label for new cases. If the label is a number it is **regression**; if it is a category it is **classification**.',
      '**Unsupervised learning** has no labels: it finds structure, such as customer segments (clustering) or a compact summary of many columns (dimensionality reduction).',
      '**Reinforcement learning** learns by trial and error with rewards: game-playing agents, robot control, ad bidding.',
      'Vocabulary: **features** (inputs, X), **target / label** (output, y), **model** (the learned function), **training** (fitting it), **inference** (using it on new data).',
    ],
    example: { title: 'Frame four business questions', steps: ['"What price will this flat sell for?" → supervised regression', '"Will this customer churn next month?" → supervised classification', '"What natural groups of customers do we have?" → unsupervised clustering', '"How should a robot arm move to pick a part?" → reinforcement learning'], result: 'The question type decides the family of models, metrics and validation you will use.' },
    mistakes: ['Jumping to algorithms before defining the target and how success is measured.', 'Using ML where simple rules or a SQL query would do.'],
    takeaways: ['ML learns rules from examples', 'Supervised = labels (regression / classification); unsupervised = no labels', 'Features in, target out'],
    use: ['There is a repeatable decision with lots of historical data', 'The rules are too complex to write by hand'],
    avoid: ['A simple rule already works', 'There is no data, or the labels are unreliable', 'Decisions must be 100% explainable and the stakes are high (use simple models)'],
    practice: { code: `# The universal scikit-learn pattern — works for almost every model
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
X, y = load_iris(return_X_y=True)                 # features, target
X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
model = DecisionTreeClassifier().fit(X_tr, y_tr)  # training
print(model.score(X_te, y_te))                    # evaluation on unseen data` },
    check: [
      { q: 'Predicting tomorrow\'s demand in units is…', options: ['Classification', 'Regression', 'Clustering', 'Reinforcement learning'], answer: 1, why: 'The target is a number.' },
      { q: 'Grouping customers without any labels is…', options: ['Supervised', 'Unsupervised', 'Regression', 'Reinforcement'], answer: 1, why: 'No labels → unsupervised (clustering).' },
    ],
  },

  'data-cleaning': {
    minutes: 10,
    goals: ['Find and treat missing values, duplicates and outliers', 'Choose between dropping and imputing', 'Recognise data leakage'],
    why: '"Garbage in, garbage out." Practitioners routinely spend most of a project on data preparation. One leaked column can make a useless model look 99% accurate.',
    explain: [
      '**Missing values**: first ask *why* they are missing. Random gaps can be filled (**imputed**) with the median or most frequent value. Gaps that carry meaning ("no income reported") deserve their own indicator column.',
      '**Duplicates**: the same record entered twice inflates its weight. Use `drop_duplicates()` and check business keys such as customer ID.',
      '**Outliers**: some are errors (age = 250); some are real and important (a fraud transaction). Never delete outliers blindly. Investigate them first.',
      '**Leakage**: a feature that would not be known at prediction time, such as "collections_flag" in a default model or "discharge_date" when predicting length of stay. Leakage gives fantastic test scores and a useless model in production.',
    ],
    example: { title: 'Cleaning a loan file', steps: ['10,000 rows; income missing in 600 (6%)', 'Missing incomes are mostly self-employed applicants → add an income_missing flag and impute the median', '150 duplicate application IDs → drop them', '"days_past_due" is only filled after a default → remove it (leakage)'], result: 'A clean, honest dataset. Accuracy may drop from a suspicious 99% to a believable 82%, and that is good news.' },
    mistakes: ['Imputing before the train/test split, so test information leaks into training.', 'Dropping every row with any missing value and losing half the data.', 'Removing outliers that are the very thing you want to detect.'],
    takeaways: ['Ask why data is missing before filling it', 'Investigate outliers; do not auto-delete them', 'Every feature must be available at prediction time'],
    practice: { code: `import pandas as pd, numpy as np
from sklearn.impute import SimpleImputer
df = pd.DataFrame({"income": [12, np.nan, 30, 8, np.nan], "id": [1, 2, 3, 3, 4]})
df = df.drop_duplicates(subset="id")
df["income_missing"] = df.income.isna().astype(int)
df["income"] = SimpleImputer(strategy="median").fit_transform(df[["income"]])
print(df)` },
    check: [
      { q: 'Which feature is leakage when predicting loan default at application time?', options: ['Applicant income', 'Credit score at application', 'Number of missed payments after the loan started', 'Loan amount requested'], answer: 2, why: 'Missed payments only exist after the outcome begins.' },
      { q: 'When should the imputer be fitted?', options: ['On all data', 'On training data only', 'On test data only', 'It does not matter'], answer: 1, why: 'Fitting on all data leaks test information into training.' },
    ],
  },

  'feature-engineering': {
    minutes: 10,
    goals: ['Create useful features from raw columns', 'Encode categorical variables correctly', 'Know when each encoding is appropriate'],
    why: 'Better features usually beat fancier algorithms. Many Kaggle winners credit feature engineering, not model choice, for their edge.',
    explain: [
      'Models only see numbers. **Feature engineering** turns raw data into numbers that expose the pattern: ratios (debt ÷ income), differences (days since last purchase), date parts (month, weekday) and aggregates (average spend over the last 90 days).',
      '**One-hot encoding** turns a category with k values into k columns of 0/1. Use it for unordered categories such as city.',
      '**Ordinal encoding** maps ordered categories to numbers (small = 1, medium = 2, large = 3). Do **not** use it for unordered categories: it would imply Chennai < Mumbai < Pune.',
      '**Target encoding** replaces a category with the average target for that category. It is powerful for high-cardinality columns (10,000 product IDs) but must be computed inside cross-validation to avoid leakage.',
    ],
    example: { title: 'Credit features', steps: ['Raw: income ₹10L, existing EMIs ₹4L per year', 'Engineered: debt-to-income = 4 / 10 = 0.40', 'City = Pune → one-hot: is_chennai 0, is_pune 1, is_mumbai 0', 'Application date → month = 3, is_weekend = 0'], result: 'Debt-to-income is often a far stronger predictor than income or EMIs alone.' },
    mistakes: ['Ordinal-encoding unordered categories.', 'Target encoding on the full dataset (leakage).', 'Creating features that use future information.'],
    takeaways: ['Ratios, differences, dates and aggregates expose patterns', 'One-hot for unordered categories, ordinal for ordered ones', 'Domain knowledge is the best feature generator'],
    practice: { code: `import pandas as pd
df = pd.DataFrame({"income": [10, 20], "emi": [4, 2], "city": ["Pune", "Chennai"],
                   "applied": pd.to_datetime(["2026-03-14", "2026-03-15"])})
df["dti"] = df.emi / df.income
df["weekday"] = df.applied.dt.weekday
df = pd.get_dummies(df, columns=["city"])
print(df)` },
    check: [
      { q: 'Best encoding for "city" (no natural order) in a linear model?', options: ['Ordinal 1, 2, 3', 'One-hot', 'Leave as text', 'Alphabetical rank'], answer: 1, why: 'One-hot avoids implying an order.' },
      { q: 'Income ₹8L, EMIs ₹2L per year. Debt-to-income ratio?', options: ['0.25', '4', '0.4', '10'], answer: 0, why: '2 / 8 = 0.25.' },
    ],
  },

  scaling: {
    minutes: 7,
    goals: ['Explain why feature scaling matters', 'Apply standardisation and min-max normalisation', 'Know which models need scaling'],
    why: 'Distance-based and gradient-based models give wrong or slow results when one feature is measured in lakhs and another in single digits.',
    explain: [
      'Imagine comparing customers by income (₹2,00,000–₹50,00,000) and age (20–70). In a distance calculation, income differences are thousands of times larger, so age is effectively ignored.',
      '**Standardisation** (z-score) rescales each feature to mean 0 and standard deviation 1. It is the default choice.',
      '**Min-max normalisation** rescales to the range 0–1. It is useful when you need bounded inputs, but it is sensitive to outliers.',
      '**Need scaling**: k-NN, k-means, SVM, PCA, regularised regression, neural networks, anything trained with gradient descent. **Do not need it**: decision trees, random forests and gradient boosting, because they split one feature at a time.',
    ],
    formula: { tex: 'z = \\frac{x - \\mu}{\\sigma}', plain: 'Subtract the mean, divide by the standard deviation: "how many SDs from average".' },
    example: { title: 'Standardise an age', steps: ['Ages in training data: mean 40, SD 10', 'Customer aged 55 → z = (55 − 40) / 10 = 1.5', 'Customer aged 30 → z = (30 − 40) / 10 = −1.0'], result: 'Every feature now speaks the same "SD units", so no feature dominates by accident.' },
    mistakes: ['Fitting the scaler on all data, including the test set (leakage). Fit on training data only.', 'Scaling for tree models: harmless, but wasted effort.'],
    takeaways: ['Distance and gradient methods need scaling', 'Standardise by default', 'Fit the scaler on training data only, inside a pipeline'],
    practice: { code: `from sklearn.preprocessing import StandardScaler
import numpy as np
X_train = np.array([[30, 400000], [40, 900000], [50, 1500000]])
sc = StandardScaler().fit(X_train)
print(sc.transform([[55, 600000]]).round(2))   # same "SD units" for both columns` },
    check: [
      { q: 'Which model does NOT need feature scaling?', options: ['k-NN', 'SVM', 'Random forest', 'k-means'], answer: 2, why: 'Tree splits compare a single feature with a threshold.' },
      { q: 'Mean 50, SD 5. The z-score of 60 is…', options: ['1', '2', '10', '0.5'], answer: 1, why: '(60 − 50) / 5 = 2.' },
    ],
  },

  'train-test-split': {
    minutes: 7,
    goals: ['Explain why we hold out test data', 'Split data correctly, including stratified and time-based splits', 'Use a validation set for tuning'],
    why: 'A model scored on the data it learned from always looks better than it really is. The test set is your only honest preview of real-world performance.',
    explain: [
      'If students are graded on the exact questions they practised, a high score proves memory, not understanding. Models are the same.',
      'Split once at the start: typically 70–80% **train**, 20–30% **test**. Lock the test set away and use it **once**, at the very end.',
      'To tune settings (hyperparameters), carve a **validation** set out of the training data, or better, use cross-validation. Tuning on the test set quietly turns it into training data.',
      '**Stratify** classification splits so that class proportions match (important when only 2% of rows are fraud). For time series, split **by time**: train on the past, test on the future. Never shuffle time.',
    ],
    example: { title: 'Fraud dataset split', steps: ['10,000 transactions, 200 frauds (2%)', 'Random 80/20 split might put only 25 frauds in the test set by chance', 'Stratified split: test = 2,000 rows with exactly 40 frauds (2%)', 'Train = 8,000 rows with 160 frauds'], result: 'Both sets now represent reality, so the test score is trustworthy.' },
    mistakes: ['Preprocessing (scaling, imputing) before splitting.', 'Peeking at the test score repeatedly while tuning.', 'Random splits on time-series data.'],
    takeaways: ['Train on one part, judge on another', 'Use the test set once', 'Stratify for imbalanced classes; split by time for time series'],
    practice: { code: `from sklearn.model_selection import train_test_split
import numpy as np
y = np.array([0] * 9800 + [1] * 200); X = np.arange(len(y)).reshape(-1, 1)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
print(y_te.mean(), y_tr.mean())     # both 0.02` },
    check: [
      { q: 'You tuned 50 models and picked the best test score. The problem?', options: ['None', 'The test set has been used for selection, so the score is optimistic', 'Too few models', 'You should have used accuracy'], answer: 1, why: 'Choosing on the test set leaks it into model selection. Use validation or cross-validation.' },
      { q: 'Correct split for monthly sales forecasting?', options: ['Random 80/20', 'Train on earlier months, test on later months', 'Stratified by product', 'No split'], answer: 1, why: 'The future must never inform the past.' },
    ],
  },

  'bias-variance': {
    minutes: 10,
    goals: ['Define underfitting and overfitting', 'Diagnose them from training vs test error', 'Pick remedies for each'],
    why: 'Every modelling decision (depth, number of features, regularisation, more data) is a move along the bias–variance trade-off. It is the most useful mental model in ML.',
    explain: [
      '**Bias** is error from being too simple: a straight line through a curved relationship. The model is wrong in the same way on training and test data. That is **underfitting**.',
      '**Variance** is error from being too sensitive to the specific training sample: a wiggly curve through every point. It scores brilliantly on training data and poorly on new data. That is **overfitting**.',
      'A tailor analogy: a one-size-fits-all T-shirt (high bias) fits nobody well; a suit tailored to one exact pose (high variance) fits only that pose. You want a good fit that still allows movement.',
      'Diagnose: **high train error + high test error** = bias. **Low train error + much higher test error** = variance. Remedies for bias: more features, a more flexible model. Remedies for variance: more data, regularisation, a simpler model, ensembles.',
    ],
    formula: { tex: '\\text{Expected error} = \\text{Bias}^2 + \\text{Variance} + \\text{Noise}', plain: 'Total error = being systematically wrong + being unstable + randomness you can never remove.' },
    example: { title: 'Three trees on the same loan data', steps: ['Depth 1: train 70%, test 69% → both low = high bias', 'Depth 4: train 86%, test 83% → good balance', 'Depth 15: train 100%, test 72% → big gap = high variance'], result: 'Depth 4 wins. The "sweet spot" is where test error is lowest, not where training error is lowest.' },
    mistakes: ['Celebrating training accuracy.', 'Adding complexity to fix a variance problem (it makes it worse).', 'Assuming more data always helps: it reduces variance, not bias.'],
    takeaways: ['Underfit = too simple; overfit = memorised noise', 'Compare train vs test error to diagnose', 'Choose complexity by validation error'],
    practice: { code: `from sklearn.datasets import make_moons
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
X, y = make_moons(600, noise=0.35, random_state=0)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
for d in [1, 3, 5, 10, None]:
    m = DecisionTreeClassifier(max_depth=d, random_state=0).fit(X_tr, y_tr)
    print(d, round(m.score(X_tr, y_tr), 3), round(m.score(X_te, y_te), 3))` },
    check: [
      { q: 'Train error 2%, test error 25%. The problem is…', options: ['High bias', 'High variance', 'Too much regularisation', 'Too little data cleaning'], answer: 1, why: 'A large train–test gap signals overfitting.' },
      { q: 'Which fix targets high bias?', options: ['More regularisation', 'A more flexible model or better features', 'Fewer features', 'Early stopping'], answer: 1, why: 'Bias means the model is too simple.' },
    ],
  },

  'cross-validation': {
    minutes: 8,
    goals: ['Explain k-fold cross-validation', 'Use stratified and time-series CV appropriately', 'Interpret the mean and spread of CV scores'],
    why: 'A single train/test split can be lucky or unlucky. Cross-validation gives a more reliable estimate and is the standard way to compare models and tune hyperparameters.',
    explain: [
      '**k-fold CV**: cut the training data into k equal folds (often 5). Train on 4 folds, validate on the 5th. Rotate until every fold has been the validation fold once. Average the 5 scores.',
      'Every row is used for both training and validation (in different rounds), so the estimate uses your data efficiently.',
      'Report the **mean and standard deviation**: "0.84 ± 0.02" is stable; "0.84 ± 0.10" means the result depends heavily on which rows you happen to use.',
      'Use **stratified k-fold** for classification, **group k-fold** when several rows belong to the same customer (so a customer is never in both train and validation), and **time-series split** for temporal data.',
    ],
    example: { title: '5-fold CV scores', steps: ['Fold accuracies: 0.82, 0.85, 0.84, 0.86, 0.83', 'Mean = (0.82 + 0.85 + 0.84 + 0.86 + 0.83) / 5 = 0.84', 'Spread is about ±0.015 → stable'], result: 'Report "accuracy 0.84 ± 0.015 (5-fold CV)". Then confirm once on the untouched test set.' },
    mistakes: ['Scaling or selecting features before CV (leakage). Put the preprocessing inside a Pipeline.', 'Ordinary k-fold on time series or grouped data.'],
    takeaways: ['Rotate the validation fold; average the scores', 'Report mean ± SD', 'Match the CV scheme to the data structure'],
    practice: { code: `from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.ensemble import RandomForestClassifier
X, y = load_breast_cancer(return_X_y=True)
s = cross_val_score(RandomForestClassifier(random_state=0), X, y, cv=StratifiedKFold(5, shuffle=True, random_state=0))
print(s.round(3), f"{s.mean():.3f} ± {s.std():.3f}")` },
    check: [
      { q: 'In 5-fold CV, how many models are trained?', options: ['1', '4', '5', '25'], answer: 2, why: 'One per fold.' },
      { q: 'Each customer has 10 rows. Which CV should you use?', options: ['KFold', 'GroupKFold by customer', 'LeaveOneOut', 'No CV'], answer: 1, why: 'Otherwise the same customer appears in train and validation and inflates the score.' },
    ],
  },

  'regression-metrics': {
    minutes: 8,
    goals: ['Compute MAE, MSE, RMSE and R²', 'Choose the metric that matches the business cost', 'Explain R² to a stakeholder'],
    why: 'The metric defines what "good" means. A demand forecast judged by RMSE behaves differently from one judged by MAPE, and stakeholders care about errors in rupees or units, not abstract scores.',
    explain: [
      '**MAE** (mean absolute error): the average size of the miss, in the target\'s units. Easy to explain: "we are off by ₹3 lakh on average".',
      '**MSE** squares each error before averaging, so big misses count far more. **RMSE** = √MSE brings it back to the original units. Use it when large errors are especially costly.',
      '**R²**: the share of variation explained, compared with always predicting the average. 1 = perfect, 0 = no better than the average, negative = worse than the average.',
      '**MAPE** (mean absolute percentage error) is popular in forecasting ("8% off") but explodes when actual values are near zero.',
    ],
    formula: { tex: '\\text{MAE} = \\tfrac{1}{n}\\sum|y-\\hat y|, \\quad \\text{RMSE} = \\sqrt{\\tfrac{1}{n}\\sum(y-\\hat y)^2}', plain: 'MAE averages the absolute misses; RMSE averages the squared misses, then takes the square root.' },
    example: { title: 'Three predictions', steps: ['Actual: 10, 20, 30; predicted: 12, 18, 36', 'Errors: −2, +2, −6 → absolute 2, 2, 6', 'MAE = (2 + 2 + 6) / 3 = 3.33', 'MSE = (4 + 4 + 36) / 3 = 14.67 → RMSE = 3.83'], result: 'RMSE > MAE because the single big miss (6) is punished more. A big gap between them signals occasional large errors.' },
    mistakes: ['Reporting only R², which says nothing about error size in business units.', 'Using MAPE when actual values can be zero.', 'Comparing RMSE across datasets with different scales.'],
    takeaways: ['MAE = typical miss; RMSE punishes big misses', 'R² is relative to the mean baseline', 'Pick the metric that mirrors business cost'],
    practice: { code: `from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
y, p = [10, 20, 30], [12, 18, 36]
print(mean_absolute_error(y, p), mean_squared_error(y, p) ** 0.5, r2_score(y, p))` },
    check: [
      { q: 'Errors 1, 1, 1, 9. Which metric is most affected by the 9?', options: ['MAE', 'RMSE', 'Both equally', 'Neither'], answer: 1, why: 'Squaring makes the 9 contribute 81.' },
      { q: 'R² = 0 means…', options: ['Perfect model', 'No better than predicting the mean', 'Impossible', 'All predictions are zero'], answer: 1, why: 'R² compares with the mean-only baseline.' },
    ],
  },

  'classification-metrics': {
    minutes: 10,
    goals: ['Read a confusion matrix', 'Compute precision, recall and F1', 'Choose metrics for imbalanced problems'],
    why: 'In fraud, medical screening or churn, accuracy is misleading. A model that never flags fraud is 99% "accurate" and completely useless.',
    explain: [
      'The **confusion matrix** counts four outcomes: true positives (caught fraud), false positives (false alarms), false negatives (missed fraud) and true negatives.',
      '**Precision** = of everything flagged, how much was really positive? It matters when false alarms are costly (blocking a genuine customer\'s card).',
      '**Recall** = of all real positives, how many did we catch? It matters when misses are costly (missing a cancer).',
      '**F1** balances the two. **ROC-AUC** measures ranking quality across all thresholds; **PR-AUC** is more informative when positives are rare. Most classifiers output probabilities; the **threshold** (default 0.5) is a business decision.',
    ],
    formula: { tex: '\\text{Precision} = \\frac{TP}{TP+FP}, \\quad \\text{Recall} = \\frac{TP}{TP+FN}', plain: 'Precision: share of alarms that were real. Recall: share of real cases that raised an alarm.' },
    example: { title: 'Fraud model on 1,000 transactions (20 frauds)', steps: ['Model flags 30: 15 real frauds (TP), 15 false alarms (FP)', 'Missed frauds FN = 20 − 15 = 5', 'Precision = 15 / 30 = 50%', 'Recall = 15 / 20 = 75%', 'Accuracy = (15 + 965) / 1000 = 98%, impressive-looking but uninformative'], result: 'The useful story: "we catch 75% of fraud, and half of our alerts are real".' },
    mistakes: ['Using accuracy on imbalanced data.', 'Keeping the 0.5 threshold without checking business costs.', 'Reporting ROC-AUC alone for very rare events.'],
    takeaways: ['Confusion matrix first', 'Precision = trust in alarms; recall = coverage of real cases', 'Choose the threshold by the cost of errors'],
    practice: { code: `from sklearn.metrics import confusion_matrix, classification_report
y_true = [1]*20 + [0]*980
y_pred = [1]*15 + [0]*5 + [1]*15 + [0]*965
print(confusion_matrix(y_true, y_pred))
print(classification_report(y_true, y_pred, digits=3))` },
    check: [
      { q: 'TP = 40, FP = 10, FN = 40. Precision?', options: ['50%', '80%', '40%', '20%'], answer: 1, why: '40 / (40 + 10) = 0.8.' },
      { q: 'Cancer screening: which metric matters most?', options: ['Precision', 'Recall', 'Accuracy', 'R²'], answer: 1, why: 'Missing a real case (false negative) is the costly error.' },
    ],
  },

  'hyperparameter-tuning': {
    minutes: 8,
    goals: ['Distinguish parameters from hyperparameters', 'Use grid search and random search with cross-validation', 'Avoid overfitting the validation process'],
    why: 'Default settings are rarely optimal. Sensible tuning of, say, tree depth or learning rate is often a cheap accuracy gain, and a badly tuned model can look worse than it is.',
    explain: [
      '**Parameters** are learned from data (regression coefficients, split thresholds). **Hyperparameters** are chosen by you before training (max_depth, k in k-NN, learning rate).',
      '**Grid search** tries every combination from a list. It is thorough but explodes combinatorially: 5 values × 5 values × 5 values = 125 models × 5 folds.',
      '**Random search** samples combinations at random. With the same budget it usually finds equally good settings, because only a few hyperparameters really matter.',
      '**Bayesian optimisation** (Optuna, Hyperopt) learns from previous trials which regions look promising. It is the standard for expensive models like XGBoost.',
    ],
    example: { title: 'Tuning a random forest', steps: ['Grid: n_estimators {100, 300} × max_depth {5, 10, None} = 6 combinations', '5-fold CV → 30 fits', 'Best: 300 trees, depth 10, CV F1 = 0.81', 'Retrain on the full training set, report test F1 once = 0.80'], result: 'Test ≈ CV confirms the tuning did not overfit the validation folds.' },
    mistakes: ['Tuning on the test set.', 'Huge grids over hyperparameters that barely matter.', 'Forgetting to fix random seeds when comparing.'],
    takeaways: ['Hyperparameters are set by you; parameters are learned', 'Random search before grid search', 'Always tune with cross-validation, and test once'],
    practice: { code: `from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import RandomizedSearchCV
from sklearn.ensemble import RandomForestClassifier
X, y = load_breast_cancer(return_X_y=True)
search = RandomizedSearchCV(RandomForestClassifier(random_state=0),
    {"n_estimators": [100, 200, 400], "max_depth": [3, 5, 10, None], "min_samples_leaf": [1, 3, 5]},
    n_iter=8, cv=5, scoring="f1", random_state=0).fit(X, y)
print(search.best_params_, round(search.best_score_, 3))` },
    check: [
      { q: 'Which is a hyperparameter?', options: ['A regression coefficient', 'max_depth of a tree', 'A learned split threshold', 'A neural network weight'], answer: 1, why: 'Set before training; the others are learned.' },
      { q: 'With a fixed budget, random search often beats grid search because…', options: ['It is exhaustive', 'It explores more distinct values of the hyperparameters that matter', 'It needs no CV', 'It never overfits'], answer: 1, why: 'Grids waste trials repeating values of unimportant hyperparameters.' },
    ],
  },

  'sklearn-pipelines': {
    minutes: 8,
    goals: ['Chain preprocessing and a model in one Pipeline', 'Use ColumnTransformer for mixed numeric/categorical data', 'Explain how pipelines prevent leakage'],
    why: 'Pipelines are how professional teams make models reproducible and leak-free: the same steps run identically in CV, testing and production.',
    explain: [
      'A **Pipeline** is an assembly line: impute → scale → encode → model. Calling `.fit()` runs every step on the training data; `.predict()` applies the same fitted steps to new data.',
      'Inside cross-validation, each fold refits the scaler and imputer on that fold\'s training part only. That removes a whole class of subtle **leakage** bugs.',
      '**ColumnTransformer** applies different steps to different columns: scale the numeric ones, one-hot encode the categorical ones.',
      'You save one object (`joblib.dump(pipe)`) and production gets exactly the same preprocessing. No more "it worked in the notebook".',
    ],
    example: { title: 'Loan model pipeline', steps: ['Numeric [income, age] → SimpleImputer(median) → StandardScaler', 'Categorical [city] → OneHotEncoder(handle_unknown="ignore")', 'Model → LogisticRegression', 'cross_val_score(pipe, X, y, cv=5) runs all of it correctly per fold'], result: 'One object, no leakage, deployable as a single file.' },
    mistakes: ['Scaling the whole dataset before CV.', 'Forgetting handle_unknown="ignore" and crashing on a new category in production.'],
    takeaways: ['Pipeline = preprocessing + model as one object', 'ColumnTransformer for mixed column types', 'Fit once, deploy the same object'],
    practice: { code: `import pandas as pd, numpy as np
from sklearn.pipeline import make_pipeline
from sklearn.compose import make_column_transformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
X = pd.DataFrame({"income": [10, 20, np.nan, 15], "city": ["Pune", "Chennai", "Pune", "Delhi"]}); y = [0, 1, 0, 1]
pre = make_column_transformer((make_pipeline(SimpleImputer(strategy="median"), StandardScaler()), ["income"]),
                              (OneHotEncoder(handle_unknown="ignore"), ["city"]))
pipe = make_pipeline(pre, LogisticRegression()).fit(X, y)
print(pipe.predict(pd.DataFrame({"income": [18], "city": ["Mumbai"]})))` },
    check: [
      { q: 'Main benefit of putting the scaler inside a Pipeline during CV?', options: ['Faster training', 'Each fold\'s scaler is fitted on its training part only (no leakage)', 'Better plots', 'Fewer features'], answer: 1, why: 'The pipeline refits preprocessing per fold.' },
      { q: 'Which tool applies different preprocessing to different columns?', options: ['GridSearchCV', 'ColumnTransformer', 'KFold', 'LabelEncoder'], answer: 1, why: 'ColumnTransformer routes columns to their own transformers.' },
    ],
  },
};
