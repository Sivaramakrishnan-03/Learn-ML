import { ModelContent } from './types';
import { linearRegression } from './linear-regression';
import { kmeansModel } from './kmeans';
import { decisionTree } from './decision-tree';

export const MODELS: Record<string, ModelContent> = {
  'linear-regression': linearRegression,
  'kmeans': kmeansModel,
  'decision-tree': decisionTree,
};
