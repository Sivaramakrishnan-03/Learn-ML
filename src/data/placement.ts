// Adaptive placement quiz. Each item tests one topic; passing it "tests out" the topic and its prerequisites.
export interface PItem { topic: string; level: 1 | 2 | 3; q: string; options: string[]; answer: number }

export const PLACEMENT: PItem[] = [
  { topic: 'descriptive-stats', level: 1, q: 'Data: 2, 3, 3, 4, 100. Which summary best represents a "typical" value?', options: ['Mean', 'Median', 'Maximum', 'Range'], answer: 1 },
  { topic: 'ml-overview', level: 1, q: 'Predicting a house price from its features is…', options: ['Clustering', 'Regression', 'Classification', 'Dimensionality reduction'], answer: 1 },
  { topic: 'train-test-split', level: 1, q: 'Why keep a test set aside?', options: ['To train faster', 'To estimate performance on unseen data', 'To increase accuracy', 'Because scikit-learn requires it'], answer: 1 },
  { topic: 'correlation', level: 1, q: 'A Pearson correlation of −0.9 means…', options: ['No relationship', 'A strong negative linear relationship', 'x causes y to fall', 'A weak positive relationship'], answer: 1 },
  { topic: 'normal-distribution', level: 1, q: 'In a normal distribution, roughly what share of values lies within ±2 standard deviations?', options: ['50%', '68%', '95%', '99.9%'], answer: 2 },
  { topic: 'linear-regression', level: 2, q: 'Ordinary least squares minimises…', options: ['The sum of absolute errors', 'The sum of squared residuals', 'The number of misclassifications', 'The R²'], answer: 1 },
  { topic: 'bias-variance', level: 2, q: 'Train accuracy 99%, test accuracy 70%. This is…', options: ['High bias', 'High variance (overfitting)', 'Perfect fit', 'Data too simple'], answer: 1 },
  { topic: 'hypothesis-testing', level: 2, q: 'p = 0.03 with α = 0.05 means…', options: ['3% chance the null is true', 'Reject the null hypothesis', 'Accept the alternative with 97% certainty', 'The effect is large'], answer: 1 },
  { topic: 'gradient-descent', level: 2, q: 'Your loss oscillates and grows each iteration. First fix?', options: ['Raise the learning rate', 'Lower the learning rate', 'Add more features', 'Remove the intercept'], answer: 1 },
  { topic: 'decision-tree', level: 2, q: 'A node contains 50% of each class. Its Gini impurity is…', options: ['0', '0.25', '0.5', '1'], answer: 2 },
  { topic: 'kmeans', level: 2, q: 'Why scale features before k-means?', options: ['It speeds up convergence only', 'Distance would be dominated by large-unit features', 'k-means requires integers', 'It is not needed'], answer: 1 },
  { topic: 'classification-metrics', level: 2, q: 'Fraud is 1% of transactions. A model predicting "never fraud" has 99% accuracy. Better metric?', options: ['Accuracy', 'Recall / PR-AUC', 'R²', 'MSE'], answer: 1 },
  { topic: 'ridge-lasso', level: 3, q: 'Which penalty can shrink coefficients exactly to zero?', options: ['L2 (Ridge)', 'L1 (Lasso)', 'Neither', 'Both equally'], answer: 1 },
  { topic: 'random-forest', level: 3, q: 'Random forests add what on top of bagging?', options: ['Boosting weights', 'A random subset of features at each split', 'Linear leaves', 'Pruning'], answer: 1 },
  { topic: 'pca', level: 3, q: 'The first principal component is the direction of…', options: ['Minimum variance', 'Maximum variance', 'The target', 'Zero correlation'], answer: 1 },
  { topic: 'gradient-boosting', level: 3, q: 'Each new tree in gradient boosting is trained on…', options: ['A bootstrap sample', 'The residual errors (negative gradient) of the current ensemble', 'Only misclassified points, re-weighted', 'Random labels'], answer: 1 },
];
