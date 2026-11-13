import { Lesson } from './types';

export const MATH: Record<string, Lesson> = {
  vectors: {
    minutes: 8,
    goals: ['Explain what a vector and a matrix are in data terms', 'Read a dataset as a matrix of rows (samples) and columns (features)', 'Compute the length of a vector and the distance between two points'],
    why: 'Every ML library stores data as vectors and matrices. When scikit-learn says `X` has shape (1000, 5), it means 1,000 customers described by 5 numbers each. Distances between vectors power k-NN, k-means and recommendation systems.',
    explain: [
      'A **vector** is just an ordered list of numbers. A flat described by (area = 900 sq ft, bedrooms = 2, age = 5 years) is the vector **[900, 2, 5]**. Each position always means the same thing.',
      'A **matrix** is a table of numbers: a stack of vectors. In ML, each **row is one sample** (a flat, a customer, an email) and each **column is one feature**. That is exactly a spreadsheet without the headers.',
      'Geometrically, a vector with 2 numbers is an arrow or a point on a 2D plane. With 3 numbers it is a point in 3D space. With 50 features it is a point in 50-dimensional space. You cannot picture it, but the maths works the same way.',
      'The **length** (norm) of a vector is its distance from zero. The **distance** between two points is the length of their difference. This simple idea lets algorithms decide which customers are "similar".',
    ],
    formula: { tex: '\\lVert a - b \\rVert = \\sqrt{(a_1-b_1)^2 + (a_2-b_2)^2 + \\dots}', plain: 'Distance between two points = square root of the sum of the squared differences in each feature (Pythagoras, extended to many dimensions).' },
    example: {
      title: 'How similar are two customers?',
      steps: ['Customer A = [visits 4, basket ₹3k] → [4, 3]', 'Customer B = [visits 7, basket ₹7k] → [7, 7]', 'Difference = [7−4, 7−3] = [3, 4]', 'Distance = √(3² + 4²) = √(9 + 16) = √25 = 5'],
      result: 'A and B are 5 units apart. A customer C at [5, 3] is only √(1² + 0²) = 1 unit from A, so C is far more similar to A than B is.',
    },
    mistakes: ['Mixing units: if one feature is in rupees (thousands) and another in years (single digits), distances are dominated by rupees. Scale features first.', 'Confusing rows and columns: in scikit-learn, rows are always samples.'],
    takeaways: ['Vector = list of numbers = one data point', 'Matrix = table = whole dataset (rows = samples, columns = features)', 'Distance between vectors measures similarity'],
    check: [
      { q: 'A dataset has shape (500, 8). What does it contain?', options: ['8 samples with 500 features', '500 samples with 8 features each', '4,000 samples', '500 features and 8 targets'], answer: 1, why: 'Rows are samples and columns are features: 500 rows × 8 columns.' },
      { q: 'Distance between [1, 1] and [4, 5]?', options: ['3', '4', '5', '7'], answer: 2, why: '√(3² + 4²) = √25 = 5.' },
    ],
  },

  'matrix-ops': {
    minutes: 10,
    goals: ['Compute a dot product and explain what it measures', 'Multiply a matrix by a vector to make many predictions at once', 'Know what transpose and inverse are used for'],
    why: 'A linear model\'s prediction is a dot product. Predicting for a million rows at once is one matrix multiplication, which is why NumPy and GPUs are so fast at ML.',
    explain: [
      'The **dot product** of two vectors multiplies them position by position and adds the results. If a = [2, 3] and b = [4, 1], then a·b = 2×4 + 3×1 = 11.',
      'Why care? A linear model is a dot product: **price = weights · features**. With weights [₹4 lakh per 100 sq ft, ₹2 lakh per bedroom] and a flat [9, 2], the price is 4×9 + 2×2 = ₹40 lakh.',
      '**Matrix × vector** does a dot product for every row. Put 1,000 flats in a matrix X and the weights in a vector w: `X @ w` gives all 1,000 prices in one operation.',
      'The **transpose** (Xᵀ) flips rows and columns. The **inverse** (X⁻¹) "undoes" a matrix, like dividing. Linear regression\'s exact formula uses both: β = (XᵀX)⁻¹Xᵀy. You will rarely compute them by hand; libraries do it, but you should recognise them.',
    ],
    formula: { tex: 'a \\cdot b = \\sum_i a_i b_i', plain: 'Dot product: multiply matching positions and add everything up.' },
    example: {
      title: 'Score three loan applicants at once',
      steps: ['Weights w = [0.5 per ₹lakh income, 0.01 per credit point]', 'Applicants (rows): [10, 700], [4, 600], [20, 800]', 'Row 1: 0.5×10 + 0.01×700 = 5 + 7 = 12', 'Row 2: 0.5×4 + 0.01×600 = 2 + 6 = 8', 'Row 3: 0.5×20 + 0.01×800 = 10 + 8 = 18'],
      result: 'X @ w = [12, 8, 18]. One matrix multiplication scored every applicant.',
    },
    mistakes: ['Shape mismatch errors: (n × d) @ (d,) works, but (n × d) @ (n,) does not. Check `.shape` first.', 'Thinking matrix multiplication is element-wise: `*` multiplies element by element, `@` is matrix multiplication in NumPy.'],
    takeaways: ['Dot product = weighted sum = how a linear model predicts', 'X @ w makes predictions for all rows at once', 'Inner dimensions must match when multiplying'],
    check: [
      { q: '[1, 2, 3] · [4, 0, 2] = ?', options: ['10', '6', '12', '0'], answer: 0, why: '1×4 + 2×0 + 3×2 = 4 + 0 + 6 = 10.' },
      { q: 'In NumPy, which operator multiplies matrices?', options: ['*', '@', '**', '//'], answer: 1, why: '`@` (or np.dot) is matrix multiplication. `*` is element-wise.' },
    ],
  },

  eigen: {
    minutes: 12,
    goals: ['Describe an eigenvector as a direction that only gets stretched', 'Connect eigenvectors of a covariance matrix to PCA', 'Interpret eigenvalues as "how much variance" lies along a direction'],
    why: 'Eigenvectors are the engine of PCA, Google\'s original PageRank, and spectral clustering. Whenever you hear "principal components", eigenvectors are underneath.',
    explain: [
      'A matrix transforms vectors: it rotates, stretches or squashes them. Most vectors change direction. A few special directions only get **stretched or shrunk, never turned**. Those are the **eigenvectors**.',
      'The amount of stretching is the **eigenvalue**. Eigenvalue 3 means "this direction gets three times longer"; 0.5 means it is halved.',
      'In data science the key matrix is the **covariance matrix** of your features. Its eigenvectors point along the directions where the data spreads out most, and the eigenvalues say how much spread (variance) there is in each direction.',
      'PCA keeps the eigenvectors with the largest eigenvalues and drops the rest. That compresses 50 correlated features into, say, 5 directions that hold most of the information.',
    ],
    formula: { tex: 'A v = \\lambda v', plain: 'Applying matrix A to eigenvector v gives the same direction v, just scaled by the number λ (the eigenvalue).' },
    example: {
      title: 'Height and weight of employees',
      steps: ['Height and weight are strongly correlated: the data forms a tilted ellipse', 'Covariance matrix eigenvectors: one along the ellipse\'s long axis (a "body size" direction), one across it', 'Suppose the eigenvalues are 9.5 and 0.5', 'Share of variance on the first direction = 9.5 / (9.5 + 0.5) = 95%'],
      result: 'One number ("body size") captures 95% of the information in two. That is PCA reducing 2 features to 1.',
    },
    mistakes: ['Forgetting to scale features before PCA: a feature with big units dominates the covariance matrix.', 'Thinking eigenvectors are features. They are new directions made from combinations of the original features.'],
    takeaways: ['Eigenvector = direction that is only stretched', 'Eigenvalue = how much it is stretched (variance along it, for a covariance matrix)', 'PCA = keep the top eigenvectors'],
    check: [
      { q: 'An eigenvalue of 0 means the direction…', options: ['Is stretched infinitely', 'Is squashed to nothing (no variance along it)', 'Is rotated 90°', 'Has the most variance'], answer: 1, why: 'λ = 0 collapses that direction. For a covariance matrix, there is no spread along it.' },
      { q: 'Eigenvalues are 6, 3 and 1. What share of variance does the first component hold?', options: ['50%', '60%', '30%', '10%'], answer: 1, why: '6 / (6 + 3 + 1) = 0.6.' },
    ],
  },

  derivatives: {
    minutes: 8,
    goals: ['Explain a derivative as a slope / rate of change', 'Compute simple derivatives such as of x² and 3x', 'Use the sign of a derivative to know which way is downhill'],
    why: 'Training almost any ML model means "change the parameters to reduce the error". Derivatives tell you which direction reduces it, and by how much.',
    explain: [
      'A **derivative** answers: if I nudge the input a tiny bit, how much does the output change? It is the **slope** of the curve at that point.',
      'Your car\'s speedometer is a derivative: it shows how fast your position changes right now. Distance is the function; speed is its derivative.',
      'A few rules cover most of ML: the derivative of a constant is 0; of 3x it is 3; of x² it is 2x; of xⁿ it is n·xⁿ⁻¹.',
      'The **sign** is what matters for learning. A positive derivative means the function goes up if you increase x, so to go down you decrease x. A negative derivative means increase x. At a minimum, the derivative is **zero**: the curve is flat.',
    ],
    formula: { tex: "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}", plain: 'Slope = change in output ÷ change in input, as the change becomes tiny.' },
    example: {
      title: 'Find the bottom of an error curve',
      steps: ['Error E(w) = (w − 3)²: how wrong a model is for weight w', 'Derivative E\'(w) = 2(w − 3)', 'At w = 5: E\' = 2×2 = +4 → positive, so decrease w', 'At w = 1: E\' = 2×(−2) = −4 → negative, so increase w', 'At w = 3: E\' = 0 → flat, the minimum'],
      result: 'The derivative pointed us to w = 3 from either side. Gradient descent automates exactly this.',
    },
    mistakes: ['Confusing the value of a function with its slope: a high error can have a small slope (a flat plateau).', 'Thinking derivative = 0 always means minimum. It can also be a maximum or a saddle point.'],
    takeaways: ['Derivative = slope = rate of change', 'Positive slope → move left to go down; negative slope → move right', 'Slope zero → flat point (often the minimum we want)'],
    check: [
      { q: 'Derivative of f(x) = x² at x = 4?', options: ['4', '8', '16', '2'], answer: 1, why: "f'(x) = 2x, so 2×4 = 8." },
      { q: 'At the current weight the derivative of the error is −2. To reduce the error you should…', options: ['Decrease the weight', 'Increase the weight', 'Stop training', 'Square the weight'], answer: 1, why: 'Negative slope means the error falls as the weight increases.' },
    ],
  },

  gradients: {
    minutes: 10,
    goals: ['Extend derivatives to functions of many variables', 'Explain the gradient as the direction of steepest increase', 'Apply the chain rule to a nested function'],
    why: 'Real models have thousands to billions of parameters. The gradient gives the uphill direction for all of them at once, and the chain rule (back-propagation) is how neural networks compute it.',
    explain: [
      'With two or more inputs, take a **partial derivative** for each one: change one input, hold the others fixed, and measure the slope.',
      'Stack the partial derivatives into a vector: that is the **gradient**, written ∇f. It points in the direction where the function rises fastest. Its negative points steepest downhill.',
      'Picture standing on a foggy hillside. You cannot see the valley, but you can feel the slope under your feet in every direction. The gradient is the steepest uphill direction; walk the opposite way to descend.',
      'The **chain rule** handles functions inside functions: if y depends on u and u depends on x, then dy/dx = (dy/du) × (du/dx). Neural networks are long chains, so this rule is applied layer by layer, backwards. That is back-propagation.',
    ],
    formula: { tex: '\\nabla f = \\left( \\frac{\\partial f}{\\partial x_1}, \\frac{\\partial f}{\\partial x_2}, \\dots \\right)', plain: 'The gradient is the list of slopes, one per input variable.' },
    example: {
      title: 'Gradient of a two-parameter error',
      steps: ['f(m, b) = m² + 3b²', '∂f/∂m = 2m, ∂f/∂b = 6b', 'At (m, b) = (1, 2): gradient = (2×1, 6×2) = (2, 12)', 'Steepest descent direction = −(2, 12) = (−2, −12)'],
      result: 'To reduce f fastest, decrease b much more than m: b is the steeper direction here.',
    },
    mistakes: ['Moving in the direction of the gradient when minimising. You move against it.', 'Forgetting the inner derivative in the chain rule, e.g. d/dx (3x + 1)² = 2(3x + 1) × 3, not just 2(3x + 1).'],
    takeaways: ['Partial derivative = slope along one input', 'Gradient = vector of all partial derivatives = steepest uphill', 'Chain rule = multiply slopes along a chain (back-propagation)'],
    check: [
      { q: 'f(x, y) = 4x + y². The gradient at (1, 3) is…', options: ['(4, 6)', '(4, 3)', '(1, 6)', '(4, 9)'], answer: 0, why: '∂f/∂x = 4, ∂f/∂y = 2y = 6.' },
      { q: 'd/dx (2x + 1)² = ?', options: ['2(2x + 1)', '4(2x + 1)', '(2x + 1)', '4x'], answer: 1, why: 'Chain rule: 2(2x + 1) × 2 = 4(2x + 1).' },
    ],
  },

  'gradient-descent': {
    minutes: 10,
    goals: ['Describe the gradient descent update rule in words', 'Explain how the learning rate affects training', 'Recognise divergence and slow convergence from a loss curve'],
    why: 'Gradient descent trains linear regression at scale, logistic regression, gradient boosting and every neural network, including large language models. It is the most important algorithm in ML.',
    explain: [
      'Start with any guess for the parameters. Measure the **loss** (how wrong the model is). Compute the **gradient** (which way is uphill). Take a small step **downhill**. Repeat until the loss stops falling.',
      'The **learning rate** (α) is the step size. Too small and training crawls: thousands of tiny steps. Too large and you overshoot the valley, bounce to the other side, and the loss can explode.',
      'Variants: **batch** gradient descent uses all the data per step; **stochastic** (SGD) uses one row; **mini-batch** uses, say, 64 rows. That is noisier but much faster, and is what deep learning uses. **Adam** adapts the step size per parameter.',
      'Scaling your features matters: if one feature is in thousands and another in single digits, the loss surface becomes a long narrow valley and gradient descent zig-zags slowly.',
    ],
    formula: { tex: '\\theta \\leftarrow \\theta - \\alpha \\, \\nabla L(\\theta)', plain: 'New parameters = old parameters minus learning rate times the gradient of the loss.' },
    example: {
      title: 'Three steps on L(w) = (w − 3)²',
      steps: ['Start w = 0, learning rate α = 0.25, gradient = 2(w − 3)', 'Step 1: gradient = −6 → w = 0 − 0.25×(−6) = 1.5', 'Step 2: gradient = −3 → w = 1.5 + 0.75 = 2.25', 'Step 3: gradient = −1.5 → w = 2.25 + 0.375 = 2.625'],
      result: 'w moves 0 → 1.5 → 2.25 → 2.625 → … towards 3, and each step is smaller because the slope flattens. With α = 1.1 the steps would overshoot and grow: divergence.',
    },
    mistakes: ['Not scaling features, which causes very slow zig-zagging convergence.', 'Picking a learning rate once and never checking the loss curve.', 'Stopping too early because the loss is falling slowly on a plateau.'],
    takeaways: ['Repeat: compute gradient → step against it', 'Learning rate too small = slow; too large = diverges', 'Mini-batch SGD and Adam are the practical defaults'],
    check: [
      { q: 'Your loss goes 10 → 25 → 80 → 400. Most likely cause?', options: ['Learning rate too small', 'Learning rate too large', 'Too few features', 'Perfect training'], answer: 1, why: 'Growing loss means each step overshoots further: reduce the learning rate.' },
      { q: 'w = 4, gradient = 2, α = 0.1. The new w is…', options: ['4.2', '3.8', '3.6', '2'], answer: 1, why: '4 − 0.1 × 2 = 3.8.' },
    ],
  },

  probability: {
    minutes: 9,
    goals: ['Define probability, conditional probability and independence', 'Compute the probability of "A and B" and "A or B"', 'Calculate an expected value'],
    why: 'Classifiers output probabilities, A/B tests are probability statements, and risk models price uncertainty. Misreading conditional probability is one of the most common analytics mistakes.',
    explain: [
      'A **probability** is a number from 0 (impossible) to 1 (certain). Think of it as a budget of 100% belief spread across everything that could happen.',
      '**Conditional probability** P(A | B) is the probability of A **given** that B happened. It shrinks your world to the cases where B is true. P(rain | dark clouds) is much higher than P(rain).',
      'Events are **independent** if knowing one tells you nothing about the other (two coin flips). Then P(A and B) = P(A) × P(B). For "or", add and subtract the overlap: P(A or B) = P(A) + P(B) − P(A and B).',
      'The **expected value** is the long-run average: multiply each outcome by its probability and add. Insurers and casinos run entirely on expected value.',
    ],
    formula: { tex: 'P(A \\mid B) = \\frac{P(A \\cap B)}{P(B)}', plain: 'Probability of A given B = probability of both, divided by probability of B.' },
    example: {
      title: 'Is a promotion worth it?',
      steps: ['A coupon costs ₹50 to send', '20% of customers redeem it and spend an extra ₹400', '80% ignore it (extra spend ₹0)', 'Expected extra spend = 0.2 × 400 + 0.8 × 0 = ₹80'],
      result: 'Expected gain ₹80 vs cost ₹50: positive expected value of ₹30 per customer, so send it (if the 20% estimate is reliable).',
    },
    mistakes: ['Confusing P(A | B) with P(B | A): P(positive test | disease) is not P(disease | positive test).', 'Multiplying probabilities of events that are not independent.'],
    takeaways: ['Probability is between 0 and 1', 'Conditioning restricts attention to cases where B is true', 'Expected value = Σ outcome × probability'],
    check: [
      { q: 'Two fair dice. P(both show 6)?', options: ['1/6', '1/12', '1/36', '2/6'], answer: 2, why: 'Independent: 1/6 × 1/6 = 1/36.' },
      { q: 'A bet pays ₹100 with probability 0.3, else ₹0. Expected value?', options: ['₹30', '₹70', '₹100', '₹3'], answer: 0, why: '0.3 × 100 = 30.' },
    ],
  },

  'random-variables': {
    minutes: 8,
    goals: ['Explain what a random variable is', 'Distinguish discrete and continuous random variables', 'Compute the mean and variance of a simple random variable'],
    why: 'Daily sales, delivery times and the number of defects per batch are random variables. Modelling them properly is how you set safety stock, SLAs and quality limits.',
    explain: [
      'A **random variable** is a number decided by chance. Before you roll a die, its result is a random variable that can take values 1–6.',
      '**Discrete** random variables take countable values (number of customers today: 0, 1, 2 …). **Continuous** ones can take any value in a range (delivery time: 2.37 hours).',
      'Its **distribution** lists how likely each value is. The **mean** (expected value, μ) is the centre of gravity. The **variance** (σ²) measures spread: the average squared distance from the mean. The **standard deviation** σ is its square root, in the original units.',
      'Two random variables can have the same mean but very different risk. That difference is exactly what variance captures.',
    ],
    formula: { tex: '\\mu = \\sum x\\,P(x), \\qquad \\sigma^2 = \\sum (x-\\mu)^2 P(x)', plain: 'Mean = probability-weighted average. Variance = probability-weighted average squared distance from the mean.' },
    example: {
      title: 'Daily orders at a small shop',
      steps: ['Orders: 0 (prob 0.2), 1 (0.5), 2 (0.3)', 'Mean = 0×0.2 + 1×0.5 + 2×0.3 = 1.1 orders', 'Variance = (0−1.1)²×0.2 + (1−1.1)²×0.5 + (2−1.1)²×0.3 = 0.242 + 0.005 + 0.243 = 0.49', 'Standard deviation = √0.49 = 0.7 orders'],
      result: 'On average 1.1 orders per day, typically varying by about ±0.7.',
    },
    mistakes: ['Reporting variance in squared units: use the standard deviation when talking to stakeholders.', 'Treating the mean as the most likely value. It may not even be a possible value (1.1 orders).'],
    takeaways: ['A random variable is a number decided by chance', 'Mean = centre, variance/SD = spread', 'Same mean, different variance = different risk'],
    check: [
      { q: 'Which is continuous?', options: ['Number of complaints', 'Delivery time in hours', 'Dice roll', 'Number of cars sold'], answer: 1, why: 'Time can take any value in a range.' },
      { q: 'Variance is 16. The standard deviation is…', options: ['16', '8', '4', '256'], answer: 2, why: '√16 = 4.' },
    ],
  },
};

// Playbook: how you actually do it in Python
const P: Record<string, string> = {
  vectors: `import numpy as np
a, b = np.array([4, 3]), np.array([7, 7])
print(np.linalg.norm(a - b))      # 5.0  (Euclidean distance)
X = np.array([[900, 2, 5], [1200, 3, 2]])
print(X.shape)                    # (2, 3) → 2 samples, 3 features`,
  'matrix-ops': `import numpy as np
X = np.array([[10, 700], [4, 600], [20, 800]])
w = np.array([0.5, 0.01])
print(X @ w)                      # [12.  8. 18.]
print(X.T.shape, np.linalg.inv(X.T @ X).shape)`,
  eigen: `import numpy as np
X = np.random.default_rng(0).multivariate_normal([0, 0], [[3, 2.5], [2.5, 3]], 500)
vals, vecs = np.linalg.eigh(np.cov(X.T))
print(vals / vals.sum())          # share of variance per direction
print(vecs)                       # the directions (columns)`,
  derivatives: `import sympy as sp                # symbolic maths
w = sp.symbols('w')
E = (w - 3)**2
print(sp.diff(E, w))              # 2*w - 6`,
  gradients: `import numpy as np
f = lambda v: v[0]**2 + 3 * v[1]**2
def num_grad(f, v, h=1e-6):          # finite differences: nudge each input
    return np.array([(f(v + h*e) - f(v - h*e)) / (2*h) for e in np.eye(len(v))])
print(num_grad(f, np.array([1.0, 2.0])))   # [ 2. 12.]
# Deep learning libraries (PyTorch, TensorFlow) do this exactly with autograd.`,
  'gradient-descent': `w, lr = 0.0, 0.25
for step in range(10):
    grad = 2 * (w - 3)
    w -= lr * grad
    print(step, round(w, 4))
# In practice: sklearn.linear_model.SGDRegressor / torch.optim.Adam`,
  probability: `import numpy as np
rng = np.random.default_rng(1)
rolls = rng.integers(1, 7, size=(100_000, 2))
print(np.mean((rolls == 6).all(axis=1)))   # ≈ 1/36 = 0.0278`,
  'random-variables': `import numpy as np
x, p = np.array([0, 1, 2]), np.array([0.2, 0.5, 0.3])
mu = (x * p).sum(); var = ((x - mu)**2 * p).sum()
print(mu, var, var**0.5)          # 1.1 0.49 0.7`,
};
Object.entries(P).forEach(([k, code]) => { MATH[k].practice = { code }; });
