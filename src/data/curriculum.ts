// Single source of truth for the LearnPath ML curriculum.
// Every path mode (skill tree, linear track, role tracks, placement quiz) is derived from this file.

export type TrackId =
  | 'math' | 'python' | 'workflow' | 'stats' | 'regression'
  | 'classification' | 'ensembles' | 'unsupervised' | 'timeseries' | 'neural';

export type RoleId = 'analyst' | 'data-scientist' | 'ml-engineer' | 'consultant';

export interface Topic {
  id: string;
  title: string;
  track: TrackId;
  prereqs: string[];
  roles: RoleId[];
  level: 1 | 2 | 3;          // 1 = beginner, 2 = practitioner, 3 = advanced
  blurb: string;              // one-line "what is it"
  analogy: string;            // intuition-first hook
  status: 'full' | 'planned'; // 'full' = animated pilot page available
  phase: 1 | 2 | 3 | 4;       // roadmap phase in which the full page ships
}

export const TRACKS: Record<TrackId, { title: string; color: string }> = {
  math:           { title: 'Math Foundations',     color: '#58c4dd' },
  python:         { title: 'Python & pandas',      color: '#83c167' },
  workflow:       { title: 'ML Workflow',          color: '#f0ac5f' },
  stats:          { title: 'Statistics',           color: '#9a72ac' },
  regression:     { title: 'Regression Models',    color: '#fc6255' },
  classification: { title: 'Classification',       color: '#ffff00' },
  ensembles:      { title: 'Ensembles',            color: '#e07a5f' },
  unsupervised:   { title: 'Unsupervised',         color: '#5cd0b3' },
  timeseries:     { title: 'Time Series',          color: '#c55f73' },
  neural:         { title: 'Neural Networks',      color: '#a6cf8c' },
};

export const ROLES: Record<RoleId, { title: string; goal: string }> = {
  'analyst':        { title: 'Data Analyst',     goal: 'Describe, test and explain data with sound statistics.' },
  'data-scientist': { title: 'Data Scientist',   goal: 'Build, evaluate and interpret predictive models end to end.' },
  'ml-engineer':    { title: 'ML Engineer',      goal: 'Train, tune and ship robust models in pipelines.' },
  'consultant':     { title: 'AI Consultant',    goal: 'Know which model fits which business problem, and why.' },
};

const A: RoleId[] = ['analyst', 'data-scientist', 'ml-engineer', 'consultant'];
const DS: RoleId[] = ['data-scientist', 'ml-engineer'];
const DSC: RoleId[] = ['data-scientist', 'ml-engineer', 'consultant'];
const AN: RoleId[] = ['analyst', 'data-scientist', 'consultant'];

const t = (
  id: string, title: string, track: TrackId, prereqs: string[], roles: RoleId[],
  level: 1 | 2 | 3, phase: 1 | 2 | 3 | 4, blurb: string, analogy: string,
): Topic => ({ id, title, track, prereqs, roles, level, phase, blurb, analogy, status: 'planned' });

export const TOPICS: Topic[] = [
  // ---------- Math foundations ----------
  t('vectors', 'Vectors & Matrices', 'math', [], A, 1, 2,
    'Lists of numbers that represent data points, features and transformations.',
    'A spreadsheet row is a vector; the whole sheet is a matrix.'),
  t('matrix-ops', 'Matrix Operations', 'math', ['vectors'], DSC, 1, 2,
    'Dot products, multiplication, transpose and inverse — the verbs of linear algebra.',
    'A dot product is a "how much do we agree" score between two lists.'),
  t('eigen', 'Eigenvectors & Eigenvalues', 'math', ['matrix-ops'], DS, 3, 3,
    'Directions a transformation only stretches, never rotates.',
    'Spin a globe: the axis is the one line that stays put.'),
  t('derivatives', 'Derivatives', 'math', [], A, 1, 2,
    'The instantaneous rate of change of a function — the slope of its tangent.',
    'A car speedometer shows the derivative of your position.'),
  t('gradients', 'Gradients & Chain Rule', 'math', ['derivatives', 'vectors'], DSC, 2, 2,
    'The vector of partial derivatives; points uphill. The chain rule links nested functions.',
    'Standing on a hill in fog, the gradient is the steepest way up underfoot.'),
  t('gradient-descent', 'Gradient Descent', 'math', ['gradients'], DSC, 2, 1,
    'Repeatedly step against the gradient to minimise a loss function.',
    'Walking downhill blindfolded by feeling the slope with your feet.'),
  t('probability', 'Probability Basics', 'math', [], A, 1, 2,
    'Events, conditional probability, independence and expectation.',
    'Probability is a budget of 100% belief spread across possible outcomes.'),
  t('random-variables', 'Random Variables', 'math', ['probability'], A, 1, 2,
    'Numbers whose value is decided by chance, with a distribution, mean and variance.',
    'A dice roll before it lands is a random variable.'),

  // ---------- Python ----------
  t('numpy', 'NumPy Essentials', 'python', [], A, 1, 2,
    'Fast vectorised arrays — the engine under pandas and scikit-learn.',
    'NumPy is a forklift; Python loops are carrying boxes by hand.'),
  t('pandas', 'pandas DataFrames', 'python', ['numpy'], A, 1, 2,
    'Load, filter, group, join and reshape tabular data.',
    'Excel with superpowers and a memory for every step you did.'),
  t('plotting', 'Plotting & EDA', 'python', ['pandas'], A, 1, 2,
    'Exploratory data analysis with matplotlib / seaborn.',
    'Before a doctor operates, they look at the X-ray.'),

  // ---------- ML workflow ----------
  t('ml-overview', 'What is Machine Learning?', 'workflow', [], A, 1, 1,
    'Supervised, unsupervised and reinforcement learning; features, labels, models.',
    'Teaching by examples instead of writing every rule.'),
  t('data-cleaning', 'Data Cleaning & Missing Values', 'workflow', ['pandas'], A, 1, 2,
    'Detect and treat missing values, outliers, duplicates and leakage.',
    'Washing vegetables before cooking: skip it and the dish is ruined.'),
  t('feature-engineering', 'Feature Engineering & Encoding', 'workflow', ['data-cleaning'], DSC, 2, 2,
    'Create informative features; one-hot, target and ordinal encoding.',
    'A detective turning raw clues into a motive.'),
  t('scaling', 'Feature Scaling', 'workflow', ['data-cleaning'], DS, 1, 2,
    'Standardisation and normalisation so features speak the same units.',
    'Comparing salaries in rupees with ages in years is unfair to age.'),
  t('train-test-split', 'Train / Test Split', 'workflow', ['ml-overview'], A, 1, 1,
    'Hold out unseen data to estimate real-world performance.',
    'Don\'t grade a student with the exact questions they practised.'),
  t('bias-variance', 'Bias–Variance & Overfitting', 'workflow', ['train-test-split'], A, 2, 1,
    'Underfitting vs overfitting and the trade-off between them.',
    'A tailor: one-size-fits-all (bias) vs a suit that fits only one pose (variance).'),
  t('cross-validation', 'Cross-Validation', 'workflow', ['train-test-split'], DSC, 2, 2,
    'k-fold, stratified and time-based validation for reliable estimates.',
    'Rotating which exam paper is the "final" so luck averages out.'),
  t('regression-metrics', 'Regression Metrics', 'workflow', ['train-test-split'], A, 1, 1,
    'MAE, MSE, RMSE, R² and MAPE — how wrong is the number?',
    'A weather forecaster judged on how many degrees off they were.'),
  t('classification-metrics', 'Classification Metrics', 'workflow', ['train-test-split'], A, 2, 2,
    'Confusion matrix, precision, recall, F1, ROC-AUC, PR curves.',
    'A smoke alarm: missing a fire (recall) vs false alarms (precision).'),
  t('hyperparameter-tuning', 'Hyperparameter Tuning', 'workflow', ['cross-validation'], DS, 2, 3,
    'Grid, random and Bayesian search over model settings.',
    'Tuning a guitar: adjust pegs, listen, repeat.'),
  t('sklearn-pipelines', 'scikit-learn Pipelines', 'workflow', ['feature-engineering', 'scaling', 'cross-validation'], DS, 2, 3,
    'Chain preprocessing and models so nothing leaks between folds.',
    'An assembly line: every car goes through the same stations in order.'),

  // ---------- Statistics ----------
  t('descriptive-stats', 'Descriptive Statistics', 'stats', ['random-variables'], A, 1, 1,
    'Mean, median, mode, variance, standard deviation, quantiles.',
    'The "back of the box" summary of a dataset.'),
  t('normal-distribution', 'Normal Distribution', 'stats', ['descriptive-stats'], A, 1, 1,
    'The bell curve, z-scores and the 68-95-99.7 rule.',
    'Heights of people in a city pile up in a bell shape.'),
  t('distributions', 'Common Distributions', 'stats', ['normal-distribution'], A, 2, 2,
    'Binomial, Poisson, exponential, uniform, t, chi-square.',
    'Different "shapes of randomness" for different processes.'),
  t('sampling-clt', 'Sampling & Central Limit Theorem', 'stats', ['normal-distribution'], A, 2, 1,
    'Averages of samples become normal, whatever the population.',
    'Average many dice rolls and the averages always form a bell.'),
  t('confidence-intervals', 'Confidence Intervals', 'stats', ['sampling-clt'], A, 2, 2,
    'A range that captures the true parameter with a stated reliability.',
    'A fishing net: 95% of the nets we throw catch the fish.'),
  t('hypothesis-testing', 'Hypothesis Testing & p-values', 'stats', ['sampling-clt'], A, 2, 1,
    'Null vs alternative, p-values, Type I/II errors, power.',
    'A courtroom: innocent until the evidence is overwhelming.'),
  t('t-test', 't-tests', 'stats', ['hypothesis-testing'], AN, 2, 2,
    'Compare one or two means with small samples.',
    'Did the new fertiliser really grow taller plants, or was it luck?'),
  t('chi-square', 'Chi-Square Tests', 'stats', ['hypothesis-testing', 'distributions'], AN, 2, 3,
    'Test independence and goodness-of-fit for categorical data.',
    'Is the dice loaded? Compare observed counts with expected counts.'),
  t('anova', 'ANOVA', 'stats', ['t-test'], AN, 2, 3,
    'Compare means across three or more groups.',
    'A t-test that can referee a tournament, not just a duel.'),
  t('correlation', 'Correlation & Covariance', 'stats', ['descriptive-stats'], A, 1, 1,
    'Pearson, Spearman; correlation is not causation.',
    'Ice-cream sales and drownings rise together — because of summer.'),
  t('bootstrap', 'Bootstrapping', 'stats', ['confidence-intervals'], AN, 2, 3,
    'Resample your data with replacement to estimate uncertainty.',
    'Pulling yourself up by your own data.'),
  t('ab-testing', 'A/B Testing', 'stats', ['hypothesis-testing'], AN, 2, 2,
    'Design, run and analyse controlled experiments.',
    'Booking.com runs thousands of these to pick button colours.'),
  t('bayes-theorem', 'Bayes\' Theorem', 'stats', ['probability'], A, 2, 2,
    'Update beliefs with evidence: posterior ∝ likelihood × prior.',
    'A doctor revising a diagnosis after each test result.'),
  t('mle', 'Maximum Likelihood Estimation', 'stats', ['distributions', 'derivatives'], DS, 3, 3,
    'Choose parameters that make the observed data most probable.',
    'Adjust the dials until the machine is most likely to produce what you saw.'),

  // ---------- Regression ----------
  t('linear-regression', 'Linear Regression', 'regression',
    ['correlation', 'gradient-descent', 'regression-metrics'], A, 1, 1,
    'Fit the straight line that minimises squared errors.',
    'Pricing a flat in Chennai from its square footage with a ruler and a pencil.'),
  t('multiple-regression', 'Multiple Regression', 'regression', ['linear-regression', 'matrix-ops'], A, 2, 2,
    'Many features, one target; coefficients, multicollinearity, diagnostics.',
    'Price depends on size, floor, age and locality — all at once.'),
  t('polynomial-regression', 'Polynomial Regression', 'regression', ['multiple-regression', 'bias-variance'], DS, 2, 2,
    'Fit curves by adding powers of features.',
    'Bending the ruler — carefully, before it snaps into overfitting.'),
  t('ridge-lasso', 'Ridge, Lasso & Elastic Net', 'regression', ['polynomial-regression', 'scaling'], DS, 2, 2,
    'Penalise large coefficients to fight overfitting; Lasso selects features.',
    'A budget on coefficient size: spend it only where it matters.'),
  t('poisson-regression', 'Poisson & GLMs', 'regression', ['multiple-regression', 'distributions', 'mle'], DS, 3, 4,
    'Generalised linear models for counts, rates and other non-normal targets.',
    'Predicting how many cars arrive at a toll booth per minute.'),

  // ---------- Classification ----------
  t('logistic-regression', 'Logistic Regression', 'classification',
    ['linear-regression', 'probability', 'classification-metrics'], A, 1, 2,
    'Squash a linear score through a sigmoid to get a probability.',
    'A bank scoring how likely you are to repay a loan.'),
  t('knn', 'k-Nearest Neighbours', 'classification', ['scaling', 'classification-metrics'], A, 1, 2,
    'Classify by majority vote of the closest training points.',
    'You are the average of your five closest friends.'),
  t('naive-bayes', 'Naive Bayes', 'classification', ['bayes-theorem', 'classification-metrics'], AN, 2, 3,
    'Bayes\' theorem with a bold independence assumption; great for text.',
    'Early Gmail spam filters counted suspicious words.'),
  t('decision-tree', 'Decision Tree', 'classification',
    ['ml-overview', 'bias-variance', 'classification-metrics'], A, 1, 1,
    'Ask the yes/no question that best separates the classes, then repeat.',
    'A game of 20 Questions played against your data.'),
  t('svm', 'Support Vector Machines', 'classification', ['logistic-regression', 'vectors'], DS, 2, 3,
    'Find the widest street between two classes.',
    'Placing a road between two villages so it is as far as possible from both.'),
  t('kernel-svm', 'Kernel Trick', 'classification', ['svm'], DS, 3, 4,
    'Separate non-linear data by implicitly mapping it to higher dimensions.',
    'Flick a tablecloth so the red and blue crumbs fly to different heights.'),
  t('lda', 'Linear Discriminant Analysis', 'classification', ['logistic-regression', 'normal-distribution'], DS, 3, 4,
    'Project data to maximise class separation; a generative classifier.',
    'Finding the camera angle where two crowds look furthest apart.'),

  // ---------- Ensembles ----------
  t('bagging', 'Bagging', 'ensembles', ['decision-tree', 'bootstrap'], DSC, 2, 2,
    'Train many models on bootstrap samples and average them.',
    'Ask 100 people to guess the weight of an ox — the average is uncanny.'),
  t('random-forest', 'Random Forest', 'ensembles', ['bagging'], A, 2, 2,
    'Bagged trees that also sample features; robust default model.',
    'A committee of diverse experts outvotes any single loud one.'),
  t('adaboost', 'AdaBoost', 'ensembles', ['decision-tree'], DS, 2, 3,
    'Sequentially re-weight hard examples; combine weak learners.',
    'A teacher who spends more time on the questions you got wrong.'),
  t('gradient-boosting', 'Gradient Boosting', 'ensembles', ['adaboost', 'gradient-descent'], DSC, 3, 3,
    'Each new tree fits the residual errors of the ensemble so far.',
    'A golfer: every new shot corrects what is left from the last.'),
  t('xgboost', 'XGBoost / LightGBM / CatBoost', 'ensembles', ['gradient-boosting', 'hyperparameter-tuning'], DSC, 3, 3,
    'Industrial-strength boosting libraries that win tabular competitions.',
    'Gradient boosting with a turbocharger and a pit crew.'),
  t('stacking', 'Stacking & Blending', 'ensembles', ['random-forest', 'gradient-boosting', 'cross-validation'], DS, 3, 4,
    'A meta-model learns how to combine base models\' predictions.',
    'A manager who learns which analyst to trust for which question.'),

  // ---------- Unsupervised ----------
  t('kmeans', 'K-Means Clustering', 'unsupervised', ['ml-overview', 'scaling', 'descriptive-stats'], A, 1, 1,
    'Alternate between assigning points to the nearest centre and moving centres.',
    'Placing k pizza shops so every house is close to one.'),
  t('hierarchical', 'Hierarchical Clustering', 'unsupervised', ['kmeans'], AN, 2, 3,
    'Build a tree (dendrogram) of nested clusters.',
    'A family tree for data points.'),
  t('dbscan', 'DBSCAN', 'unsupervised', ['kmeans'], DS, 2, 3,
    'Density-based clusters of any shape; labels outliers as noise.',
    'Crowds at a festival: dense groups are clusters, wanderers are noise.'),
  t('gmm', 'Gaussian Mixture Models', 'unsupervised', ['kmeans', 'normal-distribution', 'mle'], DS, 3, 4,
    'Soft clustering with overlapping bell curves, fit by EM.',
    'K-means that admits it is not 100% sure.'),
  t('pca', 'Principal Component Analysis', 'unsupervised', ['eigen', 'scaling', 'correlation'], A, 2, 2,
    'Rotate to the directions of maximum variance; reduce dimensions.',
    'Photographing a teapot from the angle that shows the most shape.'),
  t('tsne-umap', 't-SNE & UMAP', 'unsupervised', ['pca'], DS, 3, 4,
    'Non-linear embeddings that preserve neighbourhoods for visualisation.',
    'Flattening a crumpled map without tearing neighbourhoods apart.'),
  t('anomaly-detection', 'Anomaly Detection', 'unsupervised', ['dbscan', 'decision-tree'], DSC, 2, 3,
    'Isolation Forest, LOF and z-scores for spotting the unusual.',
    'Card fraud teams flag the one transaction that doesn\'t fit your habits.'),
  t('association-rules', 'Association Rules', 'unsupervised', ['probability'], AN, 2, 4,
    'Apriori, support, confidence and lift for market-basket analysis.',
    'The (possibly mythical) beer-and-diapers supermarket story.'),
  t('collaborative-filtering', 'Recommender Systems', 'unsupervised', ['matrix-ops', 'knn'], DSC, 3, 4,
    'User-item matrices, similarity and matrix factorisation.',
    'Netflix guessing your next show from people who watch like you.'),

  // ---------- Time series ----------
  t('ts-components', 'Time Series Components', 'timeseries', ['descriptive-stats', 'plotting'], A, 1, 3,
    'Trend, seasonality, noise, stationarity and autocorrelation.',
    'Chennai temperatures: a yearly rhythm, a slow warming trend, daily noise.'),
  t('exp-smoothing', 'Exponential Smoothing', 'timeseries', ['ts-components'], AN, 2, 3,
    'Weighted averages that trust recent data more (Holt-Winters).',
    'Your memory of a friend\'s mood: last week counts more than last year.'),
  t('arima', 'ARIMA', 'timeseries', ['ts-components', 'multiple-regression'], DS, 3, 4,
    'Autoregression + differencing + moving-average errors.',
    'Predicting tomorrow from yesterday, the day before, and past surprises.'),
  t('ts-validation', 'Forecast Validation', 'timeseries', ['exp-smoothing', 'cross-validation'], DSC, 2, 4,
    'Rolling-origin backtests; never shuffle time.',
    'You can\'t use tomorrow\'s newspaper to predict today.'),

  // ---------- Neural ----------
  t('perceptron', 'Perceptron', 'neural', ['logistic-regression', 'gradient-descent'], DSC, 2, 3,
    'The single artificial neuron: weighted sum + activation.',
    'A bouncer who adds up reasons to let you in.'),
  t('mlp', 'Multilayer Perceptron & Backprop', 'neural', ['perceptron', 'gradients'], DSC, 3, 3,
    'Stacked neurons trained by back-propagating errors with the chain rule.',
    'A relay team passing blame backwards so every runner improves.'),
];

// Mark pilots as fully built.
const FULL = new Set(['linear-regression', 'kmeans', 'decision-tree']);
TOPICS.forEach((tp) => { if (FULL.has(tp.id)) tp.status = 'full'; });

export const TOPIC_BY_ID: Record<string, Topic> = Object.fromEntries(TOPICS.map((x) => [x.id, x]));

/** Topological order (Kahn), tie-broken by level then track order: the fixed linear track. */
export function linearOrder(topics: Topic[] = TOPICS): Topic[] {
  const trackOrder = Object.keys(TRACKS);
  const ids = new Set(topics.map((x) => x.id));
  const indeg: Record<string, number> = {};
  const out: Record<string, string[]> = {};
  topics.forEach((x) => { indeg[x.id] = 0; out[x.id] = []; });
  topics.forEach((x) => x.prereqs.filter((p) => ids.has(p)).forEach((p) => { indeg[x.id]++; out[p].push(x.id); }));
  const key = (x: Topic) => x.level * 100 + trackOrder.indexOf(x.track);
  let ready = topics.filter((x) => indeg[x.id] === 0);
  const res: Topic[] = [];
  while (ready.length) {
    ready.sort((a, b) => key(a) - key(b));
    const n = ready.shift()!;
    res.push(n);
    out[n.id].forEach((m) => { if (--indeg[m] === 0) ready.push(TOPIC_BY_ID[m]); });
  }
  return res;
}

/** All transitive prerequisites of a topic (inclusive). */
export function withAncestors(id: string, acc = new Set<string>()): Set<string> {
  if (acc.has(id)) return acc;
  acc.add(id);
  TOPIC_BY_ID[id]?.prereqs.forEach((p) => withAncestors(p, acc));
  return acc;
}

/** Role track = every topic tagged for the role plus everything those topics depend on, in linear order. */
export function roleTrack(role: RoleId): Topic[] {
  const s = new Set<string>();
  TOPICS.filter((x) => x.roles.includes(role)).forEach((x) => withAncestors(x.id, s));
  return linearOrder(TOPICS.filter((x) => s.has(x.id)));
}

/** Depth in the prerequisite DAG (longest path from a root). Used for skill-tree columns. */
export function depthMap(): Record<string, number> {
  const memo: Record<string, number> = {};
  const d = (id: string): number => {
    if (memo[id] !== undefined) return memo[id];
    const ps = TOPIC_BY_ID[id].prereqs;
    return (memo[id] = ps.length ? 1 + Math.max(...ps.map(d)) : 0);
  };
  TOPICS.forEach((x) => d(x.id));
  return memo;
}
