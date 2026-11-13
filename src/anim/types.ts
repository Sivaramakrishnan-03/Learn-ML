import { ComponentType } from 'react';
import { HowToSpec } from '../components/HowTo';

/** One file per topic: src/anim/<topic-id>.tsx with `export default { Animate, Playground, howto } satisfies TopicAnim`. */
export interface TopicAnim {
  Animate: ComponentType;     // narrated, step-by-step animation (play / step / scrub)
  Playground: ComponentType;  // free interaction: sliders, clicks, live recomputation
  howto: { Animate: HowToSpec; Playground: HowToSpec };
}
