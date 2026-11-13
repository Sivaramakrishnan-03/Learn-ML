import { ComponentType, ReactNode } from "react";
import { QuizItem } from '../components/Quiz';
import { Snippet } from '../components/CodeLab';
import { Stage } from '../components/Pipeline';
import { MathStep } from '../components/MathSteps';

/** Everything an animated model page needs. Add a model = implement this + register it. */
export interface ModelContent {
  story: ReactNode;
  Animate: ComponentType;       // step-by-step algorithm animation
  Playground: ComponentType;    // interactive sandbox
  pipeline: Stage[];
  math: MathStep[];
  code: Snippet[];
  quiz: QuizItem[];
  cheatsheet: ReactNode;
  /** Optional long-form, chapter-based guide shown as the first tab. */
  Guide?: ComponentType;
}
