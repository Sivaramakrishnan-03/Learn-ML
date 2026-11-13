import { Lesson } from './types';

export const ADVANCED: Record<string, Lesson> = {
  bagging: {
    minutes: 8,
    goals: ['Explain bootstrap aggregating', 'See why averaging reduces variance', 'Use out-of-bag error'],
    why: 'Bagging turns unstable models (deep trees) into stable, accurate ones. It is the first half of the random forest recipe.',
    explain: [
      'Francis Galton\'s ox-weighing contest: individual guesses were all over the place, but the **average** of about 800 guesses was within 1% of the true weight. Averaging cancels independent errors.',
      '**Bagging** applies this to models: draw many **bootstrap samples** (same size, with replacement), train one model on each, and **average** their predictions (or take a majority vote).',
      'It helps most with **high-variance** models like deep decision trees. It does little for stable models like linear regression.',
      'Each bootstrap sample leaves out about 37% of the rows. Those **out-of-bag (OOB)** rows act as a free validation set.',
    ],
    example: { title: 'Ten deep trees vs one', steps: ['One deep tree: test accuracy 78% (it varies a lot with the sample)', 'Bag of 100 deep trees: test accuracy 86%', 'OOB estimate: 85.5%, close to the test score with no separate validation set needed'], result: 'Same base model, much better generalisation, purely from averaging.' },
    mistakes: ['Bagging low-variance models and expecting big gains.', 'Thinking more trees cause overfitting (they do not; returns just diminish).'],
    takeaways: ['Bootstrap + aggregate = bagging', 'Reduces variance, not bias', 'OOB error = free validation'],
    use: ['Unstable, high-variance base models'],
    avoid: ['When the base model is already stable or underfits'],
    practice: { code: `from sklearn.datasets import load_breast_cancer
from sklearn.ensemble import BaggingClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import cross_val_score
X, y = load_breast_cancer(return_X_y=True)
print(cross_val_score(DecisionTreeClassifier(random_state=0), X, y, cv=5).mean().round(3))
bag = BaggingClassifier(DecisionTreeClassifier(), n_estimators=100, oob_score=True, random_state=0)
print(cross_val_score(bag, X, y, cv=5).mean().round(3), round(bag.fit(X, y).oob_score_, 3))` },
    check: [
      { q: 'Bagging mainly reduces…', options: ['Bias', 'Variance', 'Training time', 'Number of features'], answer: 1, why: 'Averaging many unstable models cancels their fluctuations.' },
      { q: 'Roughly what share of rows is out-of-bag for each bootstrap sample?', options: ['5%', '37%', '50%', '63%'], answer: 1, why: '(1 − 1/n)^n → e⁻¹ ≈ 0.37.' },
    ],
  },

  'random-forest': {
    minutes: 9,
    goals: ['Explain how random forests decorrelate trees', 'Tune the key hyperparameters', 'Interpret feature importance safely'],
    why: 'Random forest is the most reliable "first serious model" for tabular data: strong accuracy with little tuning, no scaling, robust to outliers.',
    explain: [
      'A random forest is **bagging with decision trees + one extra twist**: at every split, each tree may only consider a **random subset of features**.',
      'Why? If one feature is very strong, every bagged tree splits on it first and the trees look alike. Averaging similar trees helps little. Random feature subsets make the trees **diverse**, and diverse errors cancel better.',
      'A committee of varied experts beats a committee of clones. That is the whole idea.',
      'Key hyperparameters: **n_estimators** (more is better, up to cost), **max_features** (√p for classification is the classic default), and **min_samples_leaf** / **max_depth** for smoothing. Use **permutation importance** or SHAP rather than default impurity importance.',
    ],
    example: { title: 'Churn model comparison (CV AUC)', steps: ['Logistic regression: 0.78', 'Single decision tree (depth 6): 0.76', 'Random forest, 500 trees, default settings: 0.86', 'Tuned min_samples_leaf = 5: 0.87'], result: 'Big jump with almost no effort. That is why random forest is the default benchmark.' },
    mistakes: ['Relying on impurity-based importances.', 'Expecting it to extrapolate beyond the training range (trees predict flat beyond the data).', 'Huge forests on huge data without considering memory.'],
    takeaways: ['Bagged trees + random feature subsets', 'Diversity makes averaging work', 'Strong default, little tuning needed'],
    use: ['Tabular data baseline', 'Mixed feature types, outliers, non-linearity'],
    avoid: ['Extrapolation tasks (trends beyond the data)', 'When the smallest, fastest or most interpretable model is required'],
    interview: ['How does a random forest differ from bagging?', 'Why does it rarely overfit as trees are added?'],
    practice: { code: `from sklearn.datasets import load_breast_cancer
from sklearn.ensemble import RandomForestClassifier
from sklearn.inspection import permutation_importance
from sklearn.model_selection import train_test_split
X, y = load_breast_cancer(return_X_y=True, as_frame=True)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
rf = RandomForestClassifier(500, random_state=0).fit(X_tr, y_tr)
print(round(rf.score(X_te, y_te), 3))
imp = permutation_importance(rf, X_te, y_te, n_repeats=5, random_state=0)
print(sorted(zip(imp.importances_mean.round(3), X.columns), reverse=True)[:5])` },
    check: [
      { q: 'What does a random forest add on top of bagging?', options: ['Boosting weights', 'A random feature subset at each split', 'Linear leaves', 'Pruning'], answer: 1, why: 'This decorrelates the trees.' },
      { q: 'Does a random forest need feature scaling?', options: ['Yes', 'No', 'Only for regression', 'Only with many trees'], answer: 1, why: 'Tree splits are unaffected by scale.' },
    ],
  },

  adaboost: {
    minutes: 8,
    goals: ['Explain sequential re-weighting of hard examples', 'Describe weak learners (stumps)', 'Know AdaBoost\'s sensitivity to noise'],
    why: 'AdaBoost (1995) introduced boosting: combining many weak models into a strong one. It powered the famous Viola–Jones real-time face detector in early digital cameras.',
    explain: [
      'Train a **weak learner** (often a one-split tree, a "stump") that is only a bit better than guessing.',
      '**Increase the weight** of the examples it got wrong and train the next stump on the re-weighted data, so it focuses on the hard cases. Repeat.',
      'The final model is a **weighted vote**: more accurate stumps get a bigger say.',
      'Like a teacher who spends more time on the questions you got wrong. But if some "wrong" answers are really **label noise**, AdaBoost keeps chasing them and overfits.',
    ],
    example: { title: 'Three rounds of boosting', steps: ['Round 1 stump: 30% error → weight α₁ = ½ ln(0.7/0.3) ≈ 0.42', 'Misclassified points get heavier weights', 'Round 2 stump focuses on them: 25% weighted error → α₂ ≈ 0.55', 'Final prediction = sign(0.42·h₁ + 0.55·h₂ + …)'], result: 'Each new stump patches the previous mistakes; together they form a complex boundary.' },
    mistakes: ['Using it on noisy labels without regularisation (lower the learning rate, fewer rounds).'],
    takeaways: ['Sequential: focus on previous errors', 'Weighted vote of weak learners', 'Sensitive to label noise'],
    use: ['Clean data, simple weak learners'],
    avoid: ['Noisy labels, many outliers (prefer gradient boosting with regularisation)'],
    practice: { code: `from sklearn.datasets import load_breast_cancer
from sklearn.ensemble import AdaBoostClassifier
from sklearn.model_selection import cross_val_score
X, y = load_breast_cancer(return_X_y=True)
print(cross_val_score(AdaBoostClassifier(n_estimators=200, learning_rate=0.5, random_state=0), X, y, cv=5).mean().round(3))` },
    check: [
      { q: 'After each round, AdaBoost…', options: ['Removes misclassified points', 'Increases the weight of misclassified points', 'Randomly resamples', 'Adds features'], answer: 1, why: 'The next learner focuses on the hard cases.' },
      { q: 'A typical AdaBoost weak learner is…', options: ['A deep tree', 'A decision stump', 'A neural network', 'k-means'], answer: 1, why: 'One-split trees are weak but fast.' },
    ],
  },

  'gradient-boosting': {
    minutes: 10,
    goals: ['Explain boosting as fitting residuals', 'Tune learning rate, number of trees and depth', 'Use early stopping'],
    why: 'Gradient boosting is the most accurate general-purpose method for tabular data. It drives credit risk, ranking, pricing and most tabular competition wins.',
    explain: [
      'Start with a simple prediction (the average). Compute the **residuals**: what is still wrong. Fit a small tree to predict those residuals, add a **fraction** of it to the model, and repeat.',
      'Like a golfer: the first shot gets near the hole; every next shot corrects what is left.',
      'It is called "gradient" because the residuals are the negative gradient of the loss. Swap the loss and the same method does regression, classification (log-loss) or ranking.',
      'Key knobs: **learning_rate** (shrinkage, e.g. 0.05), **n_estimators**, **max_depth** (3–8) and subsampling. A small learning rate with many trees plus **early stopping** on a validation set is the standard recipe.',
    ],
    example: { title: 'Predict a house price of ₹60L', steps: ['Start: predict the average, ₹45L → residual +15', 'Tree 1 predicts +12; learning rate 0.5 → add 6 → ₹51L, residual +9', 'Tree 2 predicts +8 → add 4 → ₹55L, residual +5', 'Tree 3 predicts +5 → add 2.5 → ₹57.5L …'], result: 'Each small tree chips away at the remaining error. The learning rate prevents any single tree from over-correcting.' },
    mistakes: ['A large learning rate with many trees (overfitting).', 'No early stopping.', 'Leaking the target through features. Boosting will find any leak.'],
    takeaways: ['Each tree fits the remaining error', 'Small learning rate + many trees + early stopping', 'State of the art for tabular data'],
    use: ['Maximum accuracy on tabular data', 'Custom losses (ranking, quantiles)'],
    avoid: ['Tiny datasets (overfits)', 'When a simple explainable model is required'],
    interview: ['Bagging vs boosting?', 'What does the learning rate do in boosting?', 'Why can boosting overfit while random forests rarely do?'],
    practice: { code: `from sklearn.datasets import load_breast_cancer
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.model_selection import cross_val_score
X, y = load_breast_cancer(return_X_y=True)
gb = HistGradientBoostingClassifier(learning_rate=0.05, max_iter=500, early_stopping=True, random_state=0)
print(cross_val_score(gb, X, y, cv=5, scoring="roc_auc").mean().round(4))` },
    check: [
      { q: 'Each new tree in gradient boosting is trained to predict…', options: ['The original target', 'The current residuals (negative gradient)', 'Random noise', 'A bootstrap sample'], answer: 1, why: 'It corrects what the ensemble still gets wrong.' },
      { q: 'Lowering the learning rate usually requires…', options: ['Fewer trees', 'More trees', 'Deeper trees only', 'No change'], answer: 1, why: 'Smaller steps need more of them.' },
    ],
  },

  xgboost: {
    minutes: 9,
    goals: ['Know what XGBoost, LightGBM and CatBoost add', 'Pick one for a given dataset', 'Apply a sensible tuning recipe'],
    why: 'These libraries are the industrial standard for tabular ML at banks, insurers, e-commerce and ride-hailing companies, and a fixture of competition leaderboards.',
    explain: [
      '**XGBoost** adds regularisation to boosting (penalties on leaf weights), efficient handling of missing values, and parallel tree building.',
      '**LightGBM** grows trees leaf-wise using histograms: very fast on large data. **CatBoost** handles categorical features natively with ordered target statistics, which needs little preprocessing and is robust against leakage.',
      'All support early stopping, GPU training, monotonic constraints (for example "risk must not fall as debt rises", important for regulators) and SHAP explanations.',
      'Tuning recipe: fix learning rate 0.05 → find n_estimators with early stopping → tune depth / num_leaves and min_child_weight → tune subsample and colsample → lower the learning rate and retrain.',
    ],
    example: { title: 'Choosing a library', steps: ['10M rows, mostly numeric, speed matters → LightGBM', 'Many high-cardinality categories (merchant ID, city) → CatBoost', 'Medium data, mature ecosystem, monotonic constraints → XGBoost', 'Always compare against a tuned random forest and logistic regression baseline'], result: 'The differences are usually small. Data quality and features matter more than the library choice.' },
    mistakes: ['Tuning dozens of parameters before getting the features right.', 'Skipping early stopping.', 'Ignoring calibration when probabilities are used for pricing.'],
    takeaways: ['Regularised, fast, production-grade boosting', 'LightGBM = speed; CatBoost = categories; XGBoost = all-rounder', 'Early stopping + SHAP are standard practice'],
    use: ['Tabular data where accuracy matters'],
    avoid: ['Images, audio, free text (deep learning)', 'Very small data'],
    practice: { code: `# pip install xgboost lightgbm catboost  (run locally)
import xgboost as xgb
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
X, y = load_breast_cancer(return_X_y=True)
X_tr, X_va, y_tr, y_va = train_test_split(X, y, random_state=0)
m = xgb.XGBClassifier(n_estimators=2000, learning_rate=0.05, max_depth=4, early_stopping_rounds=50, eval_metric="auc")
m.fit(X_tr, y_tr, eval_set=[(X_va, y_va)], verbose=False)
print(m.best_iteration, m.best_score)`, note: 'Needs the xgboost package: run locally.' },
    check: [
      { q: 'Which library handles high-cardinality categorical features natively and robustly?', options: ['XGBoost (older versions)', 'CatBoost', 'scikit-learn trees', 'k-means'], answer: 1, why: 'CatBoost uses ordered target statistics.' },
      { q: 'A "monotonic constraint" is useful when…', options: ['Data is missing', 'Business logic requires the prediction to only increase with a feature', 'Training is slow', 'There are many classes'], answer: 1, why: 'For example, risk must not decrease as debt increases.' },
    ],
  },

  stacking: {
    minutes: 8,
    goals: ['Explain stacking with a meta-model', 'Build out-of-fold predictions correctly', 'Judge when stacking is worth the complexity'],
    why: 'Stacking squeezes out the last bit of accuracy by combining different model types. It is common in competitions, rarer in production because of its complexity.',
    explain: [
      'Train several **diverse base models** (logistic regression, random forest, gradient boosting, k-NN).',
      'Use their predictions as features for a **meta-model** (often logistic or ridge regression) that learns **which model to trust when**.',
      'The base-model predictions used for training the meta-model must be **out-of-fold** (made on data each base model did not see). Otherwise the meta-model learns from overfit predictions.',
      '**Blending** is a simpler variant using one hold-out set. Gains are typically small (0.5–2%), so weigh them against maintenance cost.',
    ],
    example: { title: 'Credit default ensemble (AUC)', steps: ['Logistic regression 0.80, random forest 0.84, LightGBM 0.86', 'Simple average of the three: 0.865', 'Stacked with a logistic meta-model: 0.871', 'Production decision: keep LightGBM alone (0.86) for simplicity'], result: 'Stacking won, but by too little to justify three models in production. A judgement call worth making explicitly.' },
    mistakes: ['Training the meta-model on in-sample predictions (leakage).', 'Stacking very similar models (no diversity, no gain).'],
    takeaways: ['A meta-model combines diverse base models', 'Out-of-fold predictions are essential', 'Small gains, higher complexity'],
    use: ['Competitions, high-value predictions where every 0.1% matters'],
    avoid: ['When latency, maintainability or explainability matter more'],
    practice: { code: `from sklearn.datasets import load_breast_cancer
from sklearn.ensemble import StackingClassifier, RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score
X, y = load_breast_cancer(return_X_y=True)
st = StackingClassifier([("lr", make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))),
                         ("rf", RandomForestClassifier(200, random_state=0)),
                         ("gb", HistGradientBoostingClassifier(random_state=0))],
                        final_estimator=LogisticRegression(), cv=5)
print(cross_val_score(st, X, y, cv=5, scoring="roc_auc").mean().round(4))` },
    check: [
      { q: 'Why must the meta-model be trained on out-of-fold predictions?', options: ['Speed', 'To avoid learning from overfit in-sample predictions', 'To reduce features', 'It is optional'], answer: 1, why: 'In-sample predictions look unrealistically good.' },
      { q: 'Stacking works best when base models are…', options: ['Identical', 'Diverse', 'All linear', 'Untrained'], answer: 1, why: 'Different models make different errors.' },
    ],
  },

  kmeans: {
    minutes: 10,
    goals: ['Describe the assign-and-update loop of k-means', 'Choose k with the elbow and silhouette methods', 'Recognise where k-means fails'],
    why: 'K-means is the go-to method for customer segmentation, store clustering and image colour compression: fast, simple, and it scales to millions of rows.',
    explain: [
      'Imagine opening **k pizza shops**. Drop them anywhere. Every house orders from its **nearest** shop. Then move each shop to the **middle** of its customers. Repeat until nobody switches. The shops settle at the centres of natural neighbourhoods.',
      'Formally: (1) pick k starting centroids; (2) **assign** each point to its nearest centroid; (3) **update** each centroid to the mean of its points; repeat (2)–(3) until assignments stop changing.',
      'Each step can only reduce the total squared distance (**inertia**), so it always converges, but possibly to a **local** optimum. Use **k-means++** initialisation and several restarts.',
      'You must choose **k**. Look for the "elbow" in inertia vs k and check the **silhouette score**, then ask whether the segments are actionable for the business.',
      '**Always scale features first.** K-means uses distances.',
    ],
    formula: { tex: 'J = \\sum_{j=1}^k \\sum_{x \\in C_j} \\lVert x - \\mu_j \\rVert^2', plain: 'Total squared distance from each point to its cluster centre. K-means makes this as small as it can.' },
    example: { title: 'One update step', steps: ['Cluster A currently holds points (1, 2), (2, 1), (3, 3)', 'New centroid = mean = ((1 + 2 + 3)/3, (2 + 1 + 3)/3) = (2, 2)', 'A point at (2.6, 2.4) is now nearer to A\'s new centre than to B\'s, so it switches to A', 'Repeat until no point switches'], result: 'Two simple moves on repeat (assign, update) carve the data into compact groups.' },
    mistakes: ['Forgetting to scale.', 'Assuming the clusters are "true" categories: they depend on k and the features chosen.', 'Using it for rings, moons or clusters of very different density.'],
    takeaways: ['Assign to the nearest centre → move centres to means → repeat', 'Choose k with elbow + silhouette + business sense', 'Assumes round, similar-size clusters'],
    use: ['Segmentation with numeric features', 'Large datasets needing fast clustering'],
    avoid: ['Non-spherical clusters (DBSCAN)', 'Categorical data (k-modes)', 'Strong outliers (k-medoids)'],
    interview: ['How do you choose k?', 'Why might two runs give different clusters?', 'k-means vs DBSCAN vs GMM?'],
    practice: { code: `from sklearn.datasets import make_blobs
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
X, _ = make_blobs(500, centers=4, random_state=0); Xs = StandardScaler().fit_transform(X)
for k in range(2, 7):
    km = KMeans(k, n_init=10, random_state=0).fit(Xs)
    print(k, round(km.inertia_, 1), round(silhouette_score(Xs, km.labels_), 3))` },
    check: [
      { q: 'The update step moves each centroid to…', options: ['A random point', 'The mean of its assigned points', 'The farthest point', 'The origin'], answer: 1, why: 'The mean minimises the squared distances.' },
      { q: 'Why scale before k-means?', options: ['Speed', 'Otherwise large-unit features dominate the distances', 'It is required by Python', 'To choose k'], answer: 1, why: 'Distances mix units.' },
    ],
  },

  hierarchical: {
    minutes: 8,
    goals: ['Explain agglomerative clustering and dendrograms', 'Choose a linkage method', 'Cut a dendrogram to get clusters'],
    why: 'When you do not know the number of groups and want to see the structure at every level (product taxonomies, gene families, store hierarchies), a dendrogram tells the story.',
    explain: [
      '**Agglomerative** clustering starts with every point as its own cluster and repeatedly **merges the two closest clusters** until one remains.',
      'The merge history is drawn as a **dendrogram**, a family tree in which the height of each join shows how far apart the merged clusters were.',
      '**Linkage** defines the distance between clusters: **Ward** (minimises within-cluster variance, the usual default), **complete** (farthest points), **average**, **single** (nearest points, which can produce long chains).',
      '**Cut** the tree at a chosen height to get clusters. Large vertical gaps in the dendrogram suggest a natural number of groups.',
    ],
    example: { title: 'Grouping 6 stores by sales profile', steps: ['Merge the two most similar stores first (S1 + S4 at height 0.8)', 'Then S2 + S5 (1.1), then S3 + S6 (1.3)', 'Then {S1, S4} + {S2, S5} at 3.0', 'The final merge at 7.5 is a big jump → cut below it → 2 clusters'], result: 'The dendrogram shows both the 2-group and the 3-group view, and lets the business choose the level it can act on.' },
    mistakes: ['Running it on very large data: it needs pairwise distances (memory ~ n²).', 'Using single linkage on noisy data (chaining).'],
    takeaways: ['Merge the closest clusters repeatedly', 'Dendrogram shows structure at every level', 'Ward linkage is the usual default'],
    use: ['Small to medium data (up to ~10k rows)', 'When a hierarchy or taxonomy is the goal'],
    avoid: ['Very large datasets'],
    practice: { code: `import numpy as np
from scipy.cluster.hierarchy import linkage, fcluster
X = np.random.default_rng(0).normal(size=(30, 2)); X[:15] += 4
Z = linkage(X, method="ward")
print(fcluster(Z, t=2, criterion="maxclust"))
# scipy.cluster.hierarchy.dendrogram(Z) draws the tree (needs matplotlib)` },
    check: [
      { q: 'Agglomerative clustering starts with…', options: ['One cluster of all points', 'Each point as its own cluster', 'k random centres', 'A density threshold'], answer: 1, why: 'Bottom-up merging.' },
      { q: 'The height of a merge in a dendrogram shows…', options: ['Cluster size', 'The distance between the merged clusters', 'The number of features', 'Time'], answer: 1, why: 'Higher joins = less similar groups.' },
    ],
  },

  dbscan: {
    minutes: 8,
    goals: ['Explain density-based clustering', 'Tune eps and min_samples', 'Use DBSCAN to label noise and outliers'],
    why: 'DBSCAN finds clusters of any shape and marks outliers automatically: GPS hotspots, fraud rings, sensor anomalies. No need to choose k.',
    explain: [
      'A point is a **core point** if at least **min_samples** points lie within radius **eps** of it. Core points that are close to each other join the same cluster, so clusters grow through dense regions.',
      'Points near a cluster but not dense themselves are **border** points. Everything else is **noise** (label −1).',
      'Like crowds at a festival: dense groups form clusters, scattered wanderers are noise.',
      'Tuning: set min_samples ≈ 2 × the number of features; pick eps from the "knee" of a k-distance plot. It struggles when clusters have very different densities (try HDBSCAN).',
    ],
    example: { title: 'Delivery hotspots from GPS points', steps: ['eps = 300 m, min_samples = 20', 'Dense areas such as markets and tech parks → clusters of any shape, even along roads', 'Isolated one-off deliveries → noise', 'Result: 7 hotspots, 4% of points labelled noise'], result: 'K-means would have forced every point into a round cluster, including the outliers.' },
    mistakes: ['Not scaling features.', 'A single eps for clusters of very different density.', 'Treating noise points as errors when they may be the interesting anomalies.'],
    takeaways: ['Clusters = dense connected regions', 'No k needed; finds any shape', 'Noise points are labelled −1'],
    use: ['Arbitrary shapes, outlier detection, spatial data'],
    avoid: ['Varying densities (HDBSCAN)', 'High-dimensional data'],
    practice: { code: `from sklearn.datasets import make_moons
from sklearn.cluster import DBSCAN, KMeans
X, _ = make_moons(400, noise=0.06, random_state=0)
print("DBSCAN labels:", set(DBSCAN(eps=0.2, min_samples=8).fit(X).labels_))
print("k-means splits the moons badly:", KMeans(2, n_init=10, random_state=0).fit(X).labels_[:10])` },
    check: [
      { q: 'DBSCAN labels outliers as…', options: ['0', '−1', 'The nearest cluster', 'They are dropped'], answer: 1, why: 'Noise points get the label −1.' },
      { q: 'Which shape suits DBSCAN better than k-means?', options: ['Three round blobs', 'Two interleaved moons', 'Equal-size squares', 'One cluster'], answer: 1, why: 'Density connectivity follows curved shapes.' },
    ],
  },

  gmm: {
    minutes: 9,
    goals: ['Explain soft clustering with Gaussian components', 'Describe the EM algorithm', 'Choose the number of components with BIC'],
    why: 'GMMs give probabilities of cluster membership and elliptical clusters: customer personas that overlap, speaker identification, anomaly scores.',
    explain: [
      'A **Gaussian Mixture Model** assumes the data comes from a mix of several bell-shaped (Gaussian) clusters, each with its own centre, shape (covariance) and weight.',
      'Unlike k-means\' hard assignment, each point gets a **probability** of belonging to each cluster: "70% persona A, 30% persona B". It is k-means that admits it is not 100% sure.',
      'It is fitted by **EM**: the **E-step** computes membership probabilities given the current clusters; the **M-step** updates each cluster\'s mean, covariance and weight using those probabilities. Repeat until stable.',
      'Choose the number of components with **BIC** (lower is better), which balances fit against complexity.',
    ],
    example: { title: 'Two overlapping customer personas', steps: ['Component 1: mean spend ₹2k, weight 60%; component 2: mean ₹6k, weight 40%', 'A customer spending ₹4k sits between them', 'GMM says 55% component 1, 45% component 2', 'Marketing sends a blended offer instead of forcing one label'], result: 'Soft assignments keep the uncertainty that k-means throws away.' },
    mistakes: ['Too many components (overfits): use BIC.', 'Full covariance matrices with many features and few rows (unstable).'],
    takeaways: ['A mixture of Gaussians = soft, elliptical clusters', 'Fitted with EM', 'Choose components with BIC'],
    use: ['Overlapping clusters, membership probabilities, density estimation'],
    avoid: ['Non-Gaussian, oddly shaped clusters', 'Very high dimensions with few rows'],
    practice: { code: `from sklearn.datasets import make_blobs
from sklearn.mixture import GaussianMixture
X, _ = make_blobs(500, centers=3, cluster_std=[1, 2, 0.5], random_state=0)
for k in range(1, 6):
    print(k, round(GaussianMixture(k, random_state=0).fit(X).bic(X)))
g = GaussianMixture(3, random_state=0).fit(X); print(g.predict_proba(X[:3]).round(2))` },
    check: [
      { q: 'Key difference between a GMM and k-means?', options: ['A GMM is supervised', 'A GMM gives soft probabilistic assignments with elliptical clusters', 'k-means uses EM', 'A GMM needs no k'], answer: 1, why: 'k-means is a hard, spherical special case.' },
      { q: 'The E-step of EM computes…', options: ['New means', 'Membership probabilities for each point', 'The number of clusters', 'Gradients'], answer: 1, why: 'The M-step then updates the parameters.' },
    ],
  },

  pca: {
    minutes: 10,
    goals: ['Explain PCA as finding directions of maximum variance', 'Choose the number of components with explained variance', 'Use PCA for compression and visualisation'],
    why: 'PCA compresses many correlated features into a few, which speeds up models, removes noise and lets you plot high-dimensional data. It is used in finance (yield-curve factors), genomics and image processing.',
    explain: [
      'Photographing a teapot: some angles show its shape far better than others. PCA finds the **angle that shows the most variation** in your data, then the next best angle at right angles to it, and so on.',
      'Each new axis is a **principal component**: a weighted combination of the original features. The first holds the most variance, the second the next most, and they are uncorrelated.',
      'Keep enough components to explain, say, **90–95% of the variance** (check the cumulative explained-variance curve), and drop the rest as noise.',
      '**Scale features first**, otherwise the feature with the biggest units dominates. Components are harder to interpret than the original features, so inspect the loadings to name them.',
    ],
    example: { title: 'Compressing 20 survey questions', steps: ['20 correlated satisfaction questions, 2,000 respondents', 'Explained variance: PC1 48%, PC2 21%, PC3 9% → 78% in three', 'PC1 loads on all questions → "overall satisfaction"', 'PC2 contrasts price questions vs service questions → "value vs service"'], result: 'Three interpretable scores replace 20 columns, ready for clustering or regression.' },
    mistakes: ['Not scaling.', 'Fitting PCA on all data before the split (leakage).', 'Assuming high-variance directions are the most predictive (not guaranteed).'],
    takeaways: ['Rotate to the directions of maximum variance', 'Keep components up to ~90–95% explained variance', 'Scale first; components are combinations of features'],
    use: ['Many correlated numeric features', 'Visualising high-dimensional data in 2-D', 'Denoising and speed-ups'],
    avoid: ['When interpretability of the original features is required', 'Non-linear structure (t-SNE / UMAP for visualisation)'],
    interview: ['What do the eigenvalues represent in PCA?', 'Why scale before PCA?', 'PCA vs LDA?'],
    practice: { code: `from sklearn.datasets import load_breast_cancer
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
import numpy as np
X, _ = load_breast_cancer(return_X_y=True)
p = PCA().fit(StandardScaler().fit_transform(X))
cum = np.cumsum(p.explained_variance_ratio_)
print(cum[:6].round(3), "components for 95%:", int(np.argmax(cum >= 0.95)) + 1)` },
    check: [
      { q: 'The first principal component is the direction of…', options: ['Minimum variance', 'Maximum variance', 'The target', 'The mean'], answer: 1, why: 'By construction.' },
      { q: 'Explained variance: 50%, 30%, 10%, 10%. How many components for at least 90%?', options: ['1', '2', '3', '4'], answer: 2, why: '50 + 30 + 10 = 90.' },
    ],
  },

  'tsne-umap': {
    minutes: 8,
    goals: ['Explain what t-SNE and UMAP preserve', 'Read their plots without over-interpreting them', 'Know when to use each'],
    why: 't-SNE and UMAP produce the striking 2-D maps of embeddings, single-cell data and customer behaviour that reveal clusters PCA cannot show.',
    explain: [
      'Both are **non-linear** methods that place similar points close together in 2-D, preserving **neighbourhoods** rather than global distances. Think of flattening a crumpled map without tearing neighbourhoods apart.',
      '**t-SNE** is excellent for revealing local clusters. It is slow on large data and its key setting is **perplexity** (roughly, the number of neighbours considered).',
      '**UMAP** is faster, preserves more global structure, and can transform new data. Key settings: n_neighbors and min_dist.',
      '**Reading rules:** cluster **sizes** and the **distances between clusters** are often meaningless; different runs can look different. Use the plots for exploration, not as proof.',
    ],
    example: { title: 'Visualising 10,000 product embeddings', steps: ['Embeddings have 384 dimensions', 'PCA to 2-D: one overlapping blob', 'UMAP to 2-D: clear islands for electronics, apparel, grocery…', 'Colour by category to sanity-check, and inspect the points that sit in the "wrong" island'], result: 'UMAP reveals the structure; the follow-up investigation provides the insight.' },
    mistakes: ['Interpreting distances between clusters.', 'Training a model on t-SNE coordinates.', 'Judging from a single run or perplexity setting.'],
    takeaways: ['Non-linear, neighbourhood-preserving 2-D maps', 'UMAP is faster and more global; t-SNE is good for local detail', 'Explore with them; do not prove with them'],
    use: ['Exploring high-dimensional data and embeddings'],
    avoid: ['Feature engineering for models (prefer PCA)', 'Drawing quantitative conclusions from distances'],
    practice: { code: `from sklearn.datasets import load_digits
from sklearn.manifold import TSNE
X, y = load_digits(return_X_y=True)
emb = TSNE(n_components=2, perplexity=30, random_state=0).fit_transform(X)
print(emb.shape)   # plot emb coloured by y to see the 10 digit islands
# UMAP: pip install umap-learn → umap.UMAP(n_neighbors=15).fit_transform(X)` },
    check: [
      { q: 'In a t-SNE plot, what is most reliable?', options: ['Distances between clusters', 'Which points are near each other locally', 'Cluster sizes', 'The axes\' meaning'], answer: 1, why: 't-SNE preserves local neighbourhoods.' },
      { q: 'Main practical advantage of UMAP over t-SNE?', options: ['It is linear', 'It is faster and can transform new data', 'It needs labels', 'It has no parameters'], answer: 1, why: 'Speed and a reusable transform.' },
    ],
  },

  'anomaly-detection': {
    minutes: 9,
    goals: ['Choose between statistical, distance and tree-based detectors', 'Explain Isolation Forest', 'Evaluate detectors when labels are rare'],
    why: 'Fraud, machine failures, cyber intrusions and data-quality errors are rare events. Anomaly detection finds them without needing many labelled examples.',
    explain: [
      '**Statistical**: flag values more than 3 SD from the mean (z-score) or beyond 1.5 × IQR. Simple, and good for single metrics.',
      '**Isolation Forest**: build random trees that split the data at random. Anomalies are few and different, so they get **isolated in very few splits**. A short average path length means a high anomaly score.',
      '**Local Outlier Factor (LOF)**: compares a point\'s local density with its neighbours\' density, which catches points that are odd *for their neighbourhood*.',
      'Evaluation is hard: use the few known incidents to measure **precision at top-k** ("of our 100 highest scores, how many were real?") and involve domain experts in reviewing alerts.',
    ],
    example: { title: 'Card transactions', steps: ['A customer usually spends ₹500–₹3,000, in Chennai, in the daytime', 'New transaction: ₹48,000 at 3 a.m. abroad', 'Isolation Forest isolates it in 3 splits vs a typical 11 → anomaly score 0.82', 'Rule: score > 0.7 → send an OTP challenge'], result: 'An unsupervised score triggers a lightweight check instead of a blanket block.' },
    mistakes: ['Setting "contamination" without any idea of the real anomaly rate.', 'Ignoring seasonality (a Diwali spike is not an anomaly).', 'No feedback loop from investigated alerts.'],
    takeaways: ['z-score / IQR for single metrics', 'Isolation Forest: anomalies isolate quickly', 'Evaluate with precision at top-k and expert review'],
    use: ['Rare events with few labels', 'Monitoring and data-quality checks'],
    avoid: ['When plenty of labelled fraud exists (train a supervised classifier)'],
    practice: { code: `import numpy as np
from sklearn.ensemble import IsolationForest
rng = np.random.default_rng(0)
X = np.r_[rng.normal(2000, 600, (995, 1)), [[48000], [30000], [25000], [40], [52000]]]
iso = IsolationForest(contamination=0.005, random_state=0).fit(X)
print(X[iso.predict(X) == -1].ravel())` },
    check: [
      { q: 'Why are anomalies isolated quickly in an Isolation Forest?', options: ['They are labelled', 'They are few and different, so random splits separate them early', 'They have missing values', 'They are scaled'], answer: 1, why: 'Normal points sit in dense regions needing many splits.' },
      { q: 'A good evaluation when only 20 frauds are known?', options: ['Accuracy', 'Precision among the top-k scored transactions', 'R²', 'Silhouette'], answer: 1, why: 'It reflects how useful the alert queue is.' },
    ],
  },

  'association-rules': {
    minutes: 8,
    goals: ['Compute support, confidence and lift', 'Explain the Apriori idea', 'Turn rules into business actions'],
    why: 'Market-basket analysis drives cross-selling, store layout and "frequently bought together" recommendations in retail and e-commerce.',
    explain: [
      'A rule looks like **{bread} → {butter}**: customers who buy bread also buy butter.',
      '**Support** = how often the itemset appears in all baskets. **Confidence** = P(butter | bread). **Lift** = confidence ÷ P(butter): how much more likely butter is when bread is bought than in general.',
      '**Lift > 1** means a real positive association; lift ≈ 1 means independence; lift < 1 means the items substitute for each other.',
      '**Apriori** speeds up the search: if an itemset is rare, every bigger itemset containing it is rare too, so it can be pruned. FP-Growth is a faster alternative.',
    ],
    formula: { tex: '\\text{lift}(A\\to B) = \\frac{P(B \\mid A)}{P(B)}', plain: 'How much buying A raises the chance of buying B, compared with B\'s normal rate.' },
    example: { title: '1,000 supermarket baskets', steps: ['Bread in 200 baskets; butter in 150; both in 90', 'Support(bread & butter) = 90 / 1000 = 9%', 'Confidence(bread → butter) = 90 / 200 = 45%', 'Lift = 0.45 / 0.15 = 3.0'], result: 'Bread buyers are 3× as likely to buy butter. Place them near each other, or bundle a promotion.' },
    mistakes: ['Ranking rules by confidence alone (popular items get high confidence by default; check lift).', 'Mining with a very low support threshold (thousands of meaningless rules).'],
    takeaways: ['Support = frequency, confidence = conditional probability, lift = association strength', 'Lift > 1 → complementary items', 'Apriori prunes rare itemsets'],
    use: ['Transaction data, cross-sell, store layout'],
    avoid: ['Personalised recommendations at scale (use collaborative filtering)'],
    practice: { code: `# pip install mlxtend  (run locally)
import pandas as pd
from mlxtend.frequent_patterns import apriori, association_rules
baskets = pd.DataFrame([[1,1,0],[1,1,1],[1,0,0],[0,1,1],[1,1,0]], columns=["bread","butter","jam"]).astype(bool)
fi = apriori(baskets, min_support=0.4, use_colnames=True)
print(association_rules(fi, metric="lift", min_threshold=1)[["antecedents","consequents","support","confidence","lift"]])`, note: 'Needs mlxtend: run locally.' },
    check: [
      { q: 'Lift = 0.8 means the items are…', options: ['Strongly complementary', 'Slightly less likely to be bought together than by chance', 'Always bought together', 'Independent'], answer: 1, why: 'Lift < 1 indicates a negative association.' },
      { q: 'A in 100 baskets, B in 50, both in 20, out of 500. Confidence(A → B)?', options: ['20%', '40%', '10%', '4%'], answer: 0, why: '20 / 100 = 0.2.' },
    ],
  },

  'collaborative-filtering': {
    minutes: 9,
    goals: ['Explain user-based and item-based collaborative filtering', 'Describe matrix factorisation', 'Handle cold start and evaluation'],
    why: 'Recommenders drive a large share of viewing on Netflix and of sales on Amazon. They are among the highest-ROI ML systems in business.',
    explain: [
      'Build a **user × item matrix** of ratings or interactions. Most cells are empty: nobody has seen everything.',
      '**User-based**: find users with similar tastes and recommend what they liked. **Item-based**: "people who liked this item also liked…" (more stable, and Amazon\'s classic approach).',
      '**Matrix factorisation** learns a short vector of hidden "taste factors" for each user and item (for example "action-ness", "romance-ness"). The predicted rating is their dot product. This won the Netflix Prize.',
      '**Cold start**: new users or items have no history, so blend with content features or popularity. Evaluate with **ranking metrics** (precision@k, NDCG) on a time-based hold-out, and confirm with A/B tests.',
    ],
    example: { title: 'Predict a rating with factors', steps: ['User Priya: [action 0.9, romance 0.2]', 'Movie "Fast Chase": [action 0.95, romance 0.1]', 'Predicted affinity = 0.9×0.95 + 0.2×0.1 = 0.875 (high)', 'Movie "Love Letters": [0.1, 0.9] → 0.09 + 0.18 = 0.27 (low)'], result: 'Recommend "Fast Chase". The factors were learned purely from viewing behaviour.' },
    mistakes: ['Evaluating with random splits instead of time-based ones (leaks the future).', 'Optimising RMSE on ratings when the business cares about the ranking of the top 10.', 'Ignoring popularity bias and feedback loops.'],
    takeaways: ['Learn from the behaviour of similar users or items', 'Matrix factorisation = latent taste vectors', 'Plan for cold start; evaluate the ranking'],
    use: ['Many users and items with interaction history'],
    avoid: ['Brand-new catalogues with no interactions (content-based first)'],
    practice: { code: `import numpy as np
R = np.array([[5, 4, 0, 1], [4, 5, 1, 0], [1, 0, 5, 4], [0, 1, 4, 5]], float)   # users × items, 0 = unknown
U, s, Vt = np.linalg.svd(R, full_matrices=False)
k = 2; approx = U[:, :k] @ np.diag(s[:k]) @ Vt[:k]
print(approx.round(1))     # filled-in scores for unseen items
# Production: implicit, LightFM, or two-tower neural models` },
    check: [
      { q: '"Customers who bought this also bought…" is…', options: ['User-based CF', 'Item-based CF', 'k-means', 'Regression'], answer: 1, why: 'It relates items through co-interaction.' },
      { q: 'The cold-start problem refers to…', options: ['Slow servers', 'New users or items without interaction history', 'Too many ratings', 'Overfitting'], answer: 1, why: 'Collaborative signals need history.' },
    ],
  },

  'ts-components': {
    minutes: 9,
    goals: ['Decompose a series into trend, seasonality and noise', 'Explain stationarity', 'Read autocorrelation (ACF) plots'],
    why: 'Every forecasting project (demand, energy load, footfall, cash flow) starts by understanding the series\' structure. Skipping this step is how forecasts miss Diwali.',
    explain: [
      'A time series usually combines a **trend** (long-term direction), **seasonality** (repeating patterns: weekly, yearly), and **noise** (random fluctuation). Decomposition separates them.',
      'Chennai temperatures: a yearly rhythm (seasonality), a slow warming (trend), and day-to-day noise.',
      'A series is **stationary** if its mean and variance do not drift over time. Many classical models (ARIMA) require it, which is achieved by **differencing** (modelling the change from one period to the next).',
      '**Autocorrelation** measures how related a value is to its own past values (lags). Spikes at lag 7 in daily data mean weekly seasonality.',
    ],
    example: { title: 'Monthly ice-cream sales', steps: ['Decomposition: trend rising about 2% per year', 'Seasonality: +40% in April–May, −30% in December–January', 'Residual noise: ±5%', 'ACF: strong spike at lag 12 → yearly seasonality'], result: 'Now you know a model needs a trend term and a 12-month seasonal component, and that ±5% is the noise floor.' },
    mistakes: ['Random train/test splits.', 'Ignoring calendar effects (holidays, number of weekdays in the month).', 'Modelling non-stationary series with methods that assume stationarity.'],
    takeaways: ['Series = trend + seasonality + noise', 'Stationary = stable mean and variance; difference to achieve it', 'ACF spikes reveal seasonality'],
    practice: { code: `import numpy as np, pandas as pd
from statsmodels.tsa.seasonal import seasonal_decompose
idx = pd.date_range("2020-01", periods=60, freq="MS")
y = pd.Series(100 * 1.02 ** (np.arange(60) / 12) * (1 + 0.35 * np.sin(2 * np.pi * (np.arange(60) - 1) / 12)), index=idx)
d = seasonal_decompose(y, model="multiplicative", period=12)
print(d.seasonal[:12].round(2).values)`, note: 'Uses statsmodels: run locally if the in-browser runner lacks it.' },
    check: [
      { q: 'A spike at lag 7 in the ACF of daily sales indicates…', options: ['A trend', 'Weekly seasonality', 'Noise', 'Stationarity'], answer: 1, why: 'Values correlate with the same weekday last week.' },
      { q: 'Differencing a series helps to…', options: ['Add seasonality', 'Remove trend and make it stationary', 'Increase noise', 'Scale it'], answer: 1, why: 'Modelling changes removes a drifting mean.' },
    ],
  },

  'exp-smoothing': {
    minutes: 8,
    goals: ['Explain exponentially weighted averages', 'Use Holt (trend) and Holt-Winters (seasonality)', 'Tune the smoothing parameters'],
    why: 'Exponential smoothing is a robust, fast forecasting workhorse in retail replenishment and supply chains, and a tough baseline to beat.',
    explain: [
      '**Simple exponential smoothing**: the forecast is a weighted average of past values, with weights shrinking exponentially into the past. Recent data counts more, like your memory of a friend\'s mood.',
      'The smoothing parameter **α** (0–1) sets how fast it reacts: high α follows recent changes quickly but is jumpy; low α is smooth but slow.',
      '**Holt** adds a trend component (β); **Holt-Winters** adds seasonality (γ), either additive or multiplicative.',
      'The parameters are fitted automatically by minimising forecast error. The ETS framework adds proper prediction intervals.',
    ],
    formula: { tex: '\\hat y_{t+1} = \\alpha y_t + (1-\\alpha)\\hat y_t', plain: 'Next forecast = α × the latest actual + (1 − α) × the previous forecast.' },
    example: { title: 'Weekly demand, α = 0.3', steps: ['Previous forecast 100 units; actual this week 120', 'New forecast = 0.3 × 120 + 0.7 × 100 = 106', 'Next week actual 110 → forecast = 0.3 × 110 + 0.7 × 106 = 107.2'], result: 'The forecast moves part of the way towards each new actual, filtering noise while adapting.' },
    mistakes: ['Simple smoothing on trending or seasonal data (it lags behind).', 'Not checking whether additive or multiplicative seasonality fits.'],
    takeaways: ['A weighted average that favours recent data', 'Holt = + trend; Holt-Winters = + seasonality', 'A strong, cheap baseline'],
    use: ['Many series to forecast quickly (thousands of SKUs)', 'Short-term operational forecasts'],
    avoid: ['When external drivers (price, promotions, weather) matter (use regression or ML)'],
    practice: { code: `import numpy as np, pandas as pd
from statsmodels.tsa.holtwinters import ExponentialSmoothing
t = np.arange(48); y = pd.Series(200 + 2 * t + 30 * np.sin(2 * np.pi * t / 12) + np.random.default_rng(0).normal(0, 5, 48))
m = ExponentialSmoothing(y, trend="add", seasonal="add", seasonal_periods=12).fit()
print(m.forecast(6).round(1).values)`, note: 'Uses statsmodels: run locally if needed.' },
    check: [
      { q: 'α = 0.5, previous forecast 80, actual 100. New forecast?', options: ['80', '90', '100', '85'], answer: 1, why: '0.5 × 100 + 0.5 × 80 = 90.' },
      { q: 'Which method handles both trend and seasonality?', options: ['Simple exponential smoothing', 'Holt', 'Holt-Winters', 'Moving average'], answer: 2, why: 'Holt-Winters has level, trend and seasonal components.' },
    ],
  },

  arima: {
    minutes: 10,
    goals: ['Explain the AR, I and MA parts', 'Choose orders using ACF/PACF or auto-ARIMA', 'Check the residuals'],
    why: 'ARIMA is the classical statistical forecasting model in economics, finance and energy, and gives principled prediction intervals.',
    explain: [
      '**AR (autoregressive, p)**: predict from past values ("tomorrow resembles yesterday and the day before").',
      '**I (integrated, d)**: difference the series d times to make it stationary.',
      '**MA (moving average, q)**: correct using past forecast errors ("adjust for recent surprises").',
      '**SARIMA** adds seasonal terms; **SARIMAX** adds external regressors such as price or holidays. Choose orders with ACF/PACF plots or automatically by AIC (auto-ARIMA), then check that the residuals look like white noise.',
    ],
    formula: { tex: 'y\'_t = c + \\phi_1 y\'_{t-1} + \\dots + \\phi_p y\'_{t-p} + \\theta_1 \\varepsilon_{t-1} + \\dots + \\varepsilon_t', plain: 'The (differenced) value = constant + weighted past values + weighted past errors + new noise.' },
    example: { title: 'AR(1) forecast of daily electricity load deviation', steps: ['Model: y_t = 0.7 × y_{t−1} + noise (y = deviation from normal, in MW)', 'Today the deviation is +100 MW', 'Tomorrow\'s forecast: 0.7 × 100 = +70 MW; the day after: 0.7 × 70 = +49 MW', 'The forecast decays back to normal (0)'], result: 'AR models capture persistence: shocks fade gradually, at a rate set by φ.' },
    mistakes: ['Fitting without making the series stationary.', 'Over-large p and q (overfitting).', 'Never checking residual autocorrelation (Ljung–Box test).'],
    takeaways: ['AR = past values, I = differencing, MA = past errors', 'Select orders by AIC or ACF/PACF', 'Residuals should be white noise'],
    use: ['Single series with autocorrelation and enough history', 'When prediction intervals matter'],
    avoid: ['Thousands of series needing automation (ETS or global ML models)', 'Strong external drivers without SARIMAX'],
    practice: { code: `import numpy as np
from statsmodels.tsa.arima.model import ARIMA
rng = np.random.default_rng(0); y = np.zeros(300)
for t in range(1, 300): y[t] = 0.7 * y[t - 1] + rng.normal()
m = ARIMA(y, order=(1, 0, 0)).fit()
print(m.params.round(2)); print(m.forecast(3).round(2))`, note: 'Uses statsmodels: run locally if needed.' },
    check: [
      { q: 'In ARIMA(p, d, q), d is…', options: ['The number of lagged errors', 'The number of differences', 'The seasonal period', 'The number of AR terms'], answer: 1, why: 'The "I" (integrated) part.' },
      { q: 'AR(1) with φ = 0.5; today = 10. Forecast two steps ahead?', options: ['5', '2.5', '10', '0'], answer: 1, why: '0.5 × 0.5 × 10 = 2.5.' },
    ],
  },

  'ts-validation': {
    minutes: 8,
    goals: ['Run rolling-origin backtests', 'Choose forecast error metrics', 'Avoid look-ahead leakage'],
    why: 'A forecast that looks great on shuffled data can fail badly in production. Backtesting is how you prove a forecast works before it drives inventory or staffing.',
    explain: [
      '**Never shuffle time.** You cannot use tomorrow\'s newspaper to predict today. Train on the past, test on the future.',
      '**Rolling-origin backtest**: train up to month 24, forecast months 25–27; then train up to 27, forecast 28–30; and so on. Average the errors across windows.',
      'Watch out for **look-ahead leakage** in features: rolling means must only use past values, and external data must be "as known at the time".',
      'Metrics: MAE and RMSE in units; **MAPE** or **WAPE** for percentages; **MASE** compares against a naive forecast. **Always compare against a naive baseline** (last value, or same period last year).',
    ],
    example: { title: 'Backtesting a demand model (3-month horizon)', steps: ['Window 1: train Jan 2022–Dec 2023 → forecast Jan–Mar 2024: WAPE 12%', 'Window 2: train to Mar 2024 → Apr–Jun: WAPE 9%', 'Window 3: train to Jun 2024 → Jul–Sep: WAPE 15% (festival shift)', 'Average WAPE 12% vs seasonal-naive baseline 18%'], result: 'The model beats the baseline by 6 points, and window 3 flags festival dates as a feature to add.' },
    mistakes: ['Random k-fold on time series.', 'Features computed with future data (centred rolling windows).', 'Reporting a single lucky test window.'],
    takeaways: ['Train on the past, test on the future, roll forward', 'Beat a naive baseline', 'Check every feature for look-ahead'],
    use: ['Every forecasting model before deployment'],
    practice: { code: `import numpy as np
from sklearn.model_selection import TimeSeriesSplit
y = np.arange(36)
for tr, te in TimeSeriesSplit(n_splits=4, test_size=3).split(y):
    print("train up to", tr[-1], "→ test", te)` },
    check: [
      { q: 'Valid validation for a monthly forecast?', options: ['Random 80/20', 'Rolling-origin backtest', 'Stratified k-fold', 'Leave-one-out with shuffling'], answer: 1, why: 'It respects time order.' },
      { q: 'A naive forecast is used to…', options: ['Replace the model', 'Provide a baseline the model must beat', 'Compute features', 'Remove seasonality'], answer: 1, why: 'Without a baseline a "12% error" means little.' },
    ],
  },

  perceptron: {
    minutes: 8,
    goals: ['Describe the artificial neuron', 'Explain the perceptron learning rule', 'Know its limitation (XOR)'],
    why: 'The perceptron (1958) is the ancestor of every neural network, including today\'s large language models. Understanding one neuron makes deep learning far less mysterious.',
    explain: [
      'An artificial neuron computes a **weighted sum** of its inputs plus a bias, then applies an **activation**. In the original perceptron that is a step: output 1 if the sum > 0, else 0.',
      'Like a bouncer adding up reasons to let you in (dress code +2, on the list +5, rowdy −4): if the total passes a threshold, you are in.',
      '**Learning rule**: when it makes a mistake, nudge the weights towards the correct answer (w ← w + learning_rate × error × input). It converges if the classes are linearly separable.',
      'A single neuron draws only a **straight line**, so it cannot solve XOR. This limitation stalled the field until multi-layer networks with back-propagation.',
    ],
    formula: { tex: '\\hat y = \\text{step}(w \\cdot x + b)', plain: 'Output 1 if the weighted sum plus bias is positive, else 0.' },
    example: { title: 'Learning an AND gate', steps: ['Start w = [0, 0], b = 0, learning rate 1', 'Input (1, 1), target 1, output 0 → error +1 → w = [1, 1], b = 1', 'Input (0, 0), target 0, output 1 → error −1 → b = 0', 'After a few passes the weights settle so only (1, 1) gives a positive sum, e.g. w = [1, 1], b = −1.5'], result: 'AND is linearly separable, so the perceptron learns it. XOR is not, and it never converges.' },
    mistakes: ['Thinking modern networks use step activations (they use smooth ones such as ReLU, so gradients exist).'],
    takeaways: ['Neuron = weighted sum + activation', 'Learns linear boundaries only', 'Stacking neurons in layers removes the limitation'],
    practice: { code: `from sklearn.linear_model import Perceptron
import numpy as np
X = np.array([[0,0],[0,1],[1,0],[1,1]])
print(Perceptron(random_state=0).fit(X, [0,0,0,1]).predict(X))   # AND → learns
print(Perceptron(random_state=0).fit(X, [0,1,1,0]).predict(X))   # XOR → fails` },
    check: [
      { q: 'Which function can a single perceptron NOT learn?', options: ['AND', 'OR', 'XOR', 'NOT'], answer: 2, why: 'XOR is not linearly separable.' },
      { q: 'A perceptron computes…', options: ['A decision tree', 'A weighted sum followed by an activation', 'A cluster centre', 'A moving average'], answer: 1, why: 'That is the artificial neuron.' },
    ],
  },

  mlp: {
    minutes: 11,
    goals: ['Describe layers, activations and forward passes', 'Explain back-propagation as the chain rule', 'Train an MLP sensibly (scaling, early stopping)'],
    why: 'Multi-layer perceptrons are the foundation of deep learning. CNNs, RNNs and transformers are specialised versions of the same layers-plus-back-propagation idea.',
    explain: [
      'Stack neurons in **layers**: input → hidden layer(s) → output. Each hidden neuron learns a feature; deeper layers combine features into more abstract ones.',
      'Non-linear **activations** (ReLU = max(0, x)) are essential. Without them, any number of layers collapses into one linear model.',
      '**Forward pass**: compute the prediction. **Loss**: measure the error. **Back-propagation**: use the chain rule to send the error backwards and compute each weight\'s gradient, like a relay team passing feedback backwards so every runner improves. Then a gradient-descent optimiser (Adam) updates the weights.',
      'Practical tips: **scale inputs**, start small (one or two hidden layers), use **early stopping** and regularisation (weight decay, dropout). For tabular data, boosting usually wins; MLPs shine on images, text and audio.',
    ],
    example: { title: 'Solving XOR with one hidden layer', steps: ['Hidden neuron h₁ ≈ OR(x₁, x₂); hidden neuron h₂ ≈ AND(x₁, x₂)', 'Output = h₁ AND NOT h₂', '(0, 0) → 0; (1, 0) → 1; (0, 1) → 1; (1, 1) → 0', 'Back-propagation discovers such hidden features automatically'], result: 'One hidden layer creates the non-linear boundary a single perceptron could not.' },
    mistakes: ['No input scaling (training stalls).', 'A huge network on small tabular data (overfits; boosting is better).', 'Ignoring the validation loss curve.'],
    takeaways: ['Layers + non-linear activations = flexible functions', 'Back-propagation = the chain rule, applied backwards', 'Scale inputs; use early stopping'],
    use: ['Images, text, audio, large datasets', 'Complex non-linear patterns'],
    avoid: ['Small tabular data (use gradient boosting)', 'When interpretability is essential'],
    interview: ['Why do we need non-linear activations?', 'Explain back-propagation in one minute.', 'What are vanishing gradients?'],
    practice: { code: `from sklearn.datasets import make_moons
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score
X, y = make_moons(800, noise=0.25, random_state=0)
mlp = make_pipeline(StandardScaler(), MLPClassifier((16, 16), early_stopping=True, max_iter=2000, random_state=0))
print(cross_val_score(mlp, X, y, cv=5).mean().round(3))` },
    check: [
      { q: 'Without non-linear activations, a 10-layer network is equivalent to…', options: ['A decision tree', 'A single linear model', 'k-means', 'An SVM with an RBF kernel'], answer: 1, why: 'A composition of linear maps is linear.' },
      { q: 'Back-propagation computes gradients using…', options: ['Bayes\' theorem', 'The chain rule', 'Bootstrapping', 'Eigenvectors'], answer: 1, why: 'The error is propagated layer by layer with the chain rule.' },
    ],
  },
};
