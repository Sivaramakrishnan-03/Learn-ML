// The Linear Regression guide: 20 chapters, assembled for the <Guide> shell.
import { Chapter, Guide } from '../Guide';
import { Ch1, Ch2, Ch3, Ch4 } from './chapters1';
import { Ch5, Ch6, Ch7, Ch8 } from './chapters2';
import { Ch9, Ch10, Ch11, Ch12 } from './chapters3';
import { Ch13, Ch14, Ch15, Ch16, Ch17 } from './chapters4';
import { Ch18, Ch19, Ch20 } from './chapters5';

const P1 = 'I · Foundations', P2 = 'II · Assumptions & diagnostics', P3 = 'III · Inference',
  P4 = 'IV · Evaluation & selection', P5 = 'V · Extensions', P6 = 'VI · Practice';

export const LINREG_CHAPTERS: Chapter[] = [
  { id: 'story', title: 'The business story', part: P1, minutes: 10, level: 1, Body: Ch1 },
  { id: 'intuition', title: 'Intuition: the best line', part: P1, minutes: 15, level: 1, Body: Ch2 },
  { id: 'math', title: 'The math of OLS', part: P1, minutes: 35, level: 2, Body: Ch3 },
  { id: 'assumptions', title: 'Assumptions (LINE+)', part: P2, minutes: 20, level: 1, Body: Ch4 },
  { id: 'visual', title: 'Visual diagnostics', part: P2, minutes: 15, level: 1, Body: Ch5 },
  { id: 'tests', title: 'Formal assumption tests', part: P2, minutes: 20, level: 2, Body: Ch6 },
  { id: 'collinearity', title: 'Multicollinearity', part: P2, minutes: 15, level: 2, Body: Ch7 },
  { id: 'influence', title: 'Outliers, leverage & influence', part: P2, minutes: 15, level: 2, Body: Ch8 },
  { id: 'inference', title: 'Inference: t, F, ANOVA', part: P3, minutes: 25, level: 2, Body: Ch9 },
  { id: 'remedies', title: 'Remedies: robust SE, WLS, transforms', part: P3, minutes: 20, level: 3, Body: Ch10 },
  { id: 'prediction', title: 'Confidence vs prediction intervals', part: P3, minutes: 10, level: 2, Body: Ch11 },
  { id: 'metrics', title: 'Evaluation metrics', part: P4, minutes: 10, level: 1, Body: Ch12 },
  { id: 'selection', title: 'Model selection: AIC, BIC, subsets', part: P4, minutes: 20, level: 2, Body: Ch13 },
  { id: 'validation', title: 'Validation & bias–variance', part: P4, minutes: 20, level: 2, Body: Ch14 },
  { id: 'features', title: 'Feature engineering', part: P5, minutes: 15, level: 2, Body: Ch15 },
  { id: 'gd', title: 'Gradient descent', part: P5, minutes: 20, level: 2, Body: Ch16 },
  { id: 'regularisation', title: 'Ridge, Lasso, Elastic Net', part: P5, minutes: 25, level: 3, Body: Ch17 },
  { id: 'pipeline', title: 'End-to-end pipeline', part: P6, minutes: 20, level: 2, Body: Ch18 },
  { id: 'documentation', title: 'Model documentation', part: P6, minutes: 15, level: 2, Body: Ch19 },
  { id: 'assessment', title: 'Assessment & cheat sheet', part: P6, minutes: 30, level: 1, Body: Ch20 },
];

export function LinearRegressionGuide() {
  return <Guide id="linear-regression" title="Linear Regression · the full guide" chapters={LINREG_CHAPTERS} />;
}
