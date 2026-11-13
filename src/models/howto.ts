import { HowToSpec } from '../components/HowTo';

/** Model-specific "how to use this" guidance for the Animate and Playground tabs. */
export const MODEL_HOWTO: Record<string, Record<'Animate' | 'Playground', HowToSpec>> = {
  'linear-regression': {
    Animate: { what: 'Gradient descent fitting a line to flat prices, step by step. **Left:** the data, the current line (yellow) and the errors (red dashes). **Right:** the "loss landscape", a map of how wrong every possible line is. The yellow dot is the current line; the green ring is the best possible line.', steps: [
      { do: 'Keep the learning rate at **0.02 · just right** and press **▶ Play**.', notice: 'The red error lines shrink as the yellow line swings into place, while the dot on the right walks downhill towards the green ring.' },
      { do: 'Watch the numbers in the caption: MSE and the two gradients.', notice: 'The gradients shrink towards 0 as the line improves. Zero slope = bottom of the valley = best line.' },
      { do: 'Switch to **0.035 · too big** and play again.', notice: 'Each step overshoots and the loss explodes. This is the most common training failure in ML.' },
      { do: 'Switch to **0.005 · too small**.', notice: 'It works, but crawls. Choosing the step size is a real trade-off.' },
    ] },
    Playground: { what: 'Your own data. The line is refitted instantly with least squares every time you change something.', steps: [
      { do: '**Click** anywhere on the chart to add a flat sale.', notice: 'The line moves to stay as close to all points as possible.' },
      { do: 'Add one point far above the others (an outlier).', notice: 'One point drags the whole line. Its red error square is huge, and least squares hates big squares.' },
      { do: 'Tick **Fit it myself** and move the sliders to beat the computer.', notice: 'You can match the best MSE but never beat it: least squares is mathematically optimal.' },
      { do: '**Shift-click** to remove the nearest point.', notice: 'Watch R² change: it measures how much better the line is than just predicting the average price.' },
    ] },
  },
  kmeans: {
    Animate: { what: 'K-means grouping 90 shoppers by visits per month and basket size. ✕ marks are the cluster centres; dashed borders show each centre\'s territory.', steps: [
      { do: 'Press **▶ Play** and watch the two alternating moves.', notice: '**Assign:** each customer takes the colour of the nearest ✕. **Update:** each ✕ moves to the middle of its customers. Repeat until nothing changes.' },
      { do: 'Watch the orange bars on the right.', notice: 'Inertia (total distance to the centres) only ever goes down. That is why k-means always stops.' },
      { do: 'With **init: random**, press **🎲 New random start** a few times.', notice: 'Sometimes two centres start in the same group and get stuck: a bad local optimum.' },
      { do: 'Switch to **kmeans++** and repeat.', notice: 'Spreading out the starting centres almost always avoids the bad result.' },
    ] },
    Playground: { what: 'Your own customers. Pick k, add points, and step through the algorithm.', steps: [
      { do: 'Move the **k** slider from 1 to 8 and watch the elbow chart.', notice: 'Inertia always falls as k grows. Look for the bend (elbow) where extra clusters stop helping.' },
      { do: '**Clear**, then click to draw a ring of points around a small blob.', notice: 'K-means cannot separate a ring from its centre: it only makes round, convex groups. (DBSCAN can.)' },
      { do: 'Press **⏮ Re-init** then **Step ▶** repeatedly.', notice: 'You control each assign / update move yourself.' },
    ] },
  },
  'decision-tree': {
    Animate: { what: 'A decision tree learning loan-approval rules. **Left:** each coloured box is a region the tree has carved out (green = predicts repaid, red = predicts default). **Right:** the tree of yes/no questions growing, plus a bar chart of the thresholds it is trying.', steps: [
      { do: 'Press **▶ Play** and watch the orange dashed line sweep across the chart.', notice: 'The tree is trying many possible questions ("income ≤ X?"). The bars show how mixed (impure) the result would be: lower is better.' },
      { do: 'Wait for the solid **yellow** line.', notice: 'That is the winning question, the one that makes the two sides purest. It appears as a new box in the tree diagram.' },
      { do: 'Let it finish, then compare **max depth 1** and **4**.', notice: 'Depth 1 is one simple rule. Depth 4 makes many small boxes, some around just one or two noisy points.' },
    ] },
    Playground: { what: 'Grow your own tree. The shaded background shows what the tree would predict anywhere on the chart.', steps: [
      { do: 'Drag **max_depth** from 3 to 10.', notice: 'Training accuracy climbs towards 100% while accuracy on 300 fresh applicants drops: that is **overfitting**.' },
      { do: 'Raise **min_samples_leaf** to 10.', notice: 'Tiny boxes disappear. Forcing each leaf to hold more people makes the rules simpler and more reliable.' },
      { do: 'Click to add a few "default" points deep inside the green area.', notice: 'A deep tree immediately carves a box around them. A shallow tree treats them as noise.' },
    ] },
  },
};
