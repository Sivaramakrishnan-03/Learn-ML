import { Lesson } from './types';
import { MATH } from './math';
import { PYTHON_WORKFLOW } from './python-workflow';
import { STATS } from './stats';
import { SUPERVISED } from './supervised';
import { ADVANCED } from './advanced';

export const LESSONS: Record<string, Lesson> = { ...MATH, ...PYTHON_WORKFLOW, ...STATS, ...SUPERVISED, ...ADVANCED };
export type { Lesson } from './types';
