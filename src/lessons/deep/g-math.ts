import { DeepLesson } from './types';

// MATH FOUNDATIONS: textbook chapters for vectors, matrices, eigenvectors, calculus, gradient descent and probability.
export const MATH_DEEP: Record<string, DeepLesson> = {
  vectors: {
    minutes: 17,
    hook: 'Open any spreadsheet of customers, cars or invoices and you are already looking at linear algebra. Each row is a list of numbers describing one thing; the whole sheet is a grid of such lists. Machine learning does not see "Priya, Chennai, loyal customer". It sees **[4, 3, 0.8]**. Once you learn to read data as **vectors and matrices**, every algorithm from k-means to neural networks becomes far less mysterious.',
    sections: [
      {
        heading: 'The problem: computers need data as numbers in a fixed order',
        blocks: [
          { p: 'Imagine a property consultancy with 5,000 flats on its books. A human broker describes a flat in words: "spacious, two bedrooms, fairly new". A computer cannot compare two such descriptions. It needs the same facts, measured the same way, in the same order, every time: **area 900 sq ft, 2 bedrooms, 5 years old**.' },
          { p: 'That fixed, ordered list of numbers is called a **vector**. Stack the vectors of all 5,000 flats on top of each other and you get a **matrix**. These two objects are the containers in which all machine learning data lives.' },
          { term: 'Vector', def: 'An ordered list of numbers, such as [900, 2, 5]. Each position always means the same thing (here: area, bedrooms, age). In ML, one vector usually describes one item: one flat, one customer, one transaction.' },
          { term: 'Matrix', def: 'A rectangular table of numbers with rows and columns. In ML, each **row is one item** (a sample) and each **column is one measurement** (a feature). It is a spreadsheet without the headers.' },
          { term: 'Feature', def: 'One measured property of an item, such as area, age or monthly spend. Each feature becomes one position in the vector and one column in the matrix.' },
          { p: 'Why should a business reader care? Because almost every question an analyst asks of data turns into a question about vectors. "Which customers are similar?" becomes "which vectors are close together?" "What does a typical store look like?" becomes "what is the average vector?" "Predict the price" becomes "combine the numbers in this vector with some weights".' },
          { diagram: { kind: 'table', head: ['Flat', 'Area (sq ft)', 'Bedrooms', 'Age (years)'], rows: [['Flat A', '900', '2', '5'], ['Flat B', '1,200', '3', '2'], ['Flat C', '650', '1', '12']], caption: 'Three flats as a 3 × 3 matrix. Read across a row and you get one flat\'s vector, for example Flat A = [900, 2, 5]. Read down a column and you get one feature for every flat.' } },
        ],
      },
      {
        heading: 'Building the intuition: addresses on a map',
        blocks: [
          { p: 'Think of a vector as an address. In a city laid out in a grid, "3 blocks east, 4 blocks north" pins down exactly one spot. Two numbers, in an agreed order, describe a location. Swap the order and you end up somewhere else, which is why order matters in a vector.' },
          { steps: [
            '**Two numbers = a point on a flat map.** A customer described by (visits per month, average basket) is a dot on a two-axis chart.',
            '**Three numbers = a point in a room.** Add "years as a customer" and the dot floats in three-dimensional space: east, north and up.',
            '**Fifty numbers = a point in fifty-dimensional space.** Nobody can picture this, but the arithmetic is identical. Every rule you learn in two dimensions carries over.',
            '**Close dots = similar items.** Two customers whose dots sit near each other behave alike. Far-apart dots behave differently.',
          ], title: 'From a map to many dimensions' },
          { p: 'You can also think of a vector as an **arrow** from the origin (the point where every number is zero) to that address. The arrow has a direction and a length. Both ideas, "point" and "arrow", are useful, and mathematicians switch between them freely.' },
          { term: 'Dimension', def: 'The number of entries in a vector, or equivalently the number of features. A vector with 3 entries lives in 3-dimensional space. "High-dimensional data" just means many features.' },
          { think: { q: 'A customer is described as [visits = 4, basket = ₹3k]. Another is [basket = ₹3k, visits = 4]. Are these the same vector?', a: 'Not as written. A vector is an ordered list, so [4, 3] and [3, 4] are different points. In practice we fix the column order once for the whole dataset so that position 1 always means visits and position 2 always means basket.' } },
          { callout: 'A vector does not "know" what its numbers mean. The meaning lives in your agreed column order. Shuffle the columns of a dataset by accident and every model trained on it becomes nonsense.', tone: 'key' },
        ],
      },
      {
        heading: 'How it works: the basic operations',
        blocks: [
          { p: 'There are only a handful of things you do with vectors, and each one has a plain business meaning. All of them work position by position.' },
          { diagram: { kind: 'flow', nodes: ['**Describe** each item as a vector of features', '**Stack** the vectors into a matrix (rows = items)', '**Combine** vectors: add, average, scale', '**Measure** lengths and distances', '**Use** distances and averages in ML models'], caption: 'The everyday pipeline. Data goes into a matrix, simple vector operations summarise it, and distances feed algorithms such as k-NN and k-means.' } },
          { p: '**Addition.** Add two vectors of the same length by adding matching positions. If Store 1 sold [120, 80, 40] units of three products and Store 2 sold [90, 110, 60], the region sold [210, 190, 100].' },
          { p: '**Scalar multiplication.** Multiply every entry by the same single number. Raising every price by 10% means multiplying the price vector by 1.1.' },
          { term: 'Scalar', def: 'An ordinary single number, as opposed to a list. Multiplying a vector by a scalar stretches or shrinks the arrow without changing its direction (or flips it if the number is negative).' },
          { p: '**Averaging.** Add the vectors and divide by how many there are. The average of all customer vectors is the "typical customer". This is exactly the centroid used by k-means.' },
          { p: '**Length.** How far is the point from zero? For [3, 4] the answer is 5, by Pythagoras.' },
          { p: '**Distance.** Subtract one vector from the other and take the length of the result. This is how algorithms decide which items are similar.' },
          { term: 'Norm', def: 'The length of a vector, written ‖v‖. The usual one, the Euclidean norm, is Pythagoras: square every entry, add, take the square root.' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { p: 'We write a vector in bold or with an arrow and list its entries. A vector with n entries is said to live in ℝⁿ ("R-n"), the space of all lists of n real numbers.' },
          { tex: '\\mathbf{v} = (v_1, v_2, \\dots, v_n)', plain: 'A vector is n numbers in a fixed order. v₁ is the first feature, v₂ the second, and so on.', symbols: [['\\mathbf{v}', 'the whole vector'], ['v_i', 'the i-th entry (feature) of the vector'], ['n', 'the number of entries (the dimension)']] },
          { p: 'Adding and scaling happen entry by entry. There is nothing hidden; the formula just says "do it to every position".' },
          { tex: '\\mathbf{a} + \\mathbf{b} = (a_1 + b_1, \\dots, a_n + b_n), \\qquad c\\,\\mathbf{a} = (c\\,a_1, \\dots, c\\,a_n)', plain: 'Add matching entries; multiply every entry by the number c. Both vectors must have the same length to be added.' },
          { p: 'Length comes from Pythagoras. In two dimensions, the arrow [3, 4] is the long side of a right-angled triangle with sides 3 and 4, so its length is √(9 + 16) = 5. With more entries you simply keep adding squares.' },
          { tex: '\\lVert \\mathbf{v} \\rVert = \\sqrt{v_1^2 + v_2^2 + \\dots + v_n^2}', plain: 'Square every entry, add them up, take the square root. Squaring makes negative entries count as positive distance.', symbols: [['\\lVert \\mathbf{v} \\rVert', 'the length (norm) of v']] },
          { p: 'Distance between two items is the length of their difference. The difference vector says "how far apart are they in each feature"; the norm combines those gaps into one number.' },
          { tex: 'd(\\mathbf{a}, \\mathbf{b}) = \\lVert \\mathbf{a} - \\mathbf{b} \\rVert = \\sqrt{\\sum_{i=1}^{n} (a_i - b_i)^2}', plain: 'For every feature, take the gap between the two items, square it, add all the squared gaps, and take the square root.', symbols: [['d(\\mathbf{a},\\mathbf{b})', 'Euclidean distance between items a and b'], ['\\sum', '"add up", here over all n features']] },
          { p: 'A whole dataset with m items and n features is an m × n matrix, usually called X. Its shape is always quoted as (rows, columns). When scikit-learn reports `X.shape == (1000, 5)`, it means 1,000 items, 5 features each.' },
          { tex: 'X = \\begin{pmatrix} x_{11} & x_{12} & \\cdots & x_{1n} \\\\ \\vdots & & \\ddots & \\vdots \\\\ x_{m1} & x_{m2} & \\cdots & x_{mn} \\end{pmatrix}', plain: 'The entry in row i and column j, xᵢⱼ, is feature j of item i. Row i is the vector for item i.', symbols: [['m', 'number of rows (items, samples)'], ['n', 'number of columns (features)'], ['x_{ij}', 'feature j of item i']] },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Which customer is most similar?', setup: 'Three customers described by (visits per month, average basket in ₹ thousand): A = [4, 3], B = [7, 7], C = [5, 3]. Which of B or C is more like A?', steps: [
            'A − B = [4 − 7, 3 − 7] = [−3, −4]. Distance = √((−3)² + (−4)²) = √(9 + 16) = √25 = 5.',
            'A − C = [4 − 5, 3 − 3] = [−1, 0]. Distance = √(1 + 0) = 1.',
            'C is 1 unit from A; B is 5 units away.',
          ], result: 'C is five times closer to A than B is. A recommender would suggest to A the products that C liked. This is the heart of k-nearest neighbours.' } },
          { diagram: { kind: 'scatter', xLabel: 'visits per month', yLabel: 'basket (₹ thousand)', caption: 'The three customers as points. A (blue) and C sit almost on top of each other; B is far up and to the right. Distance on this chart is exactly the Euclidean distance we computed.', points: [[4, 3, 0], [5, 3, 1], [7, 7, 2]] } },
          { example: { title: 'Regional sales with vector arithmetic', setup: 'A snacks distributor tracks weekly units of [chips, biscuits, juice]. Store 1 sold [120, 80, 40]; Store 2 sold [90, 110, 60]. Next month a festival is expected to lift Store 1 demand by 10%.', steps: [
            'Regional total = [120 + 90, 80 + 110, 40 + 60] = [210, 190, 100].',
            'Average store = [210, 190, 100] ÷ 2 = [105, 95, 50].',
            'Festival forecast for Store 1 = 1.1 × [120, 80, 40] = [132, 88, 44].',
          ], result: 'Three business questions (total, typical store, scenario forecast) answered with addition, averaging and scalar multiplication. Spreadsheets do this column by column; NumPy does it for whole vectors at once.' } },
          { example: { title: 'Why units can wreck a distance', setup: 'Flat A = [900 sq ft, 2 bedrooms, 5 years], Flat B = [1,200, 3, 2], Flat C = [650, 1, 12]. Which flat is closer to A?', steps: [
            'A − B = [−300, −1, 3]. Distance = √(90,000 + 1 + 9) = √90,010 ≈ 300.02.',
            'A − C = [250, 1, −7]. Distance = √(62,500 + 1 + 49) = √62,550 ≈ 250.10.',
            'C wins, but only because its area gap (250) is smaller than B\'s (300). Bedrooms and age changed the answer by a few hundredths.',
            'C is a seven-years-older one-bedroom flat. Most buyers would call B, not C, the closer match to A.',
          ], result: 'Raw distances are dominated by the feature with the biggest numbers. Before using distances, standardise each feature (subtract its mean, divide by its standard deviation) so that every feature gets a fair say.' } },
        ],
      },
      {
        heading: 'Reading shapes: rows, columns and NumPy',
        blocks: [
          { p: 'Most errors beginners hit in ML code are shape errors. Getting fluent at reading shapes saves hours.' },
          { bullets: [
            '`X.shape == (500, 8)`: 500 samples (rows), 8 features (columns). This is the scikit-learn convention everywhere.',
            '`y.shape == (500,)`: one target value per sample, stored as a flat vector.',
            '`X[0]` is the first sample\'s vector; `X[:, 2]` is the third feature for every sample.',
            'An image of 28 × 28 pixels is usually flattened into a vector of 784 numbers before a classic model sees it.',
            'A sentence fed to a language model becomes a list of vectors (embeddings), often with hundreds of entries each.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'A vector', items: ['One list of numbers', 'Shape (n,)', 'Usually one item: one customer, one flat', 'Geometrically a point or an arrow', 'Example: [900, 2, 5]'] }, right: { title: 'A matrix', items: ['A table of numbers', 'Shape (m, n)', 'Usually a whole dataset: m items, n features', 'Geometrically a cloud of m points', 'Example: 5,000 flats × 3 features'] }, caption: 'Vector = one row; matrix = the whole sheet. Keep "rows are samples" in your head and most shape puzzles solve themselves.' } },
          { callout: 'When code fails with a message like "shapes (3,2) and (3,) not aligned", stop and print `.shape` for every array involved. Nine times out of ten, a matrix is the wrong way round.', tone: 'tip' },
        ],
      },
      {
        heading: 'Vectors in the real world',
        blocks: [
          { case: { title: 'Product recommendations from purchase vectors (illustrative)', story: 'An online electronics retailer describes each customer by how much they spent in 20 categories over the last year: a vector with 20 entries. To recommend accessories, the system finds the 50 customers whose vectors are closest to yours and suggests what they bought that you have not. When the team first tried raw rupee amounts, big spenders dominated every neighbourhood. Converting each vector into shares of total spend (so every customer\'s entries add to 1) made "people who shop like you" mean similar taste rather than similar wallet size, and click-through on recommendations improved in an A/B test.' } },
          { bullets: [
            '**Text and search:** modern search engines and chatbots turn every sentence into an embedding vector; "similar meaning" becomes "nearby vectors".',
            '**Manufacturing quality:** each produced part is a vector of sensor readings; parts far from the average vector are flagged for inspection.',
            '**Finance:** a portfolio is a vector of weights across assets; daily returns of many stocks form a matrix.',
            '**Automotive:** a car\'s state at each moment (speed, acceleration, steering angle, battery temperature) is a vector logged many times per second.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and what comes next',
        blocks: [
          { bullets: [
            '**Mixed units:** rupees next to years next to counts means distance is dominated by the largest numbers. Standardise first.',
            '**Categories are not numbers:** coding city as Chennai = 1, Mumbai = 2, Delhi = 3 invents a fake order and fake distances. Use one-hot encoding (one 0/1 column per city).',
            '**Too many dimensions:** with hundreds of features, all points start to look roughly equally far apart (the "curse of dimensionality"). Dimensionality reduction such as PCA helps.',
            '**Rows and columns swapped:** some tools store features as rows. Check the convention before feeding data in.',
          ] },
          { p: 'Vectors and matrices are the nouns of linear algebra. The next chapter introduces the verbs: the dot product, matrix multiplication, transpose and inverse, which are how models actually combine features into predictions.' },
        ],
      },
    ],
    faq: [
      { q: 'Is a vector the same as a Python list?', a: 'Conceptually yes: an ordered list of numbers. In practice we use NumPy arrays, because they support arithmetic on whole vectors at once (`a + b`, `2 * a`) and are far faster than looping over lists.' },
      { q: 'What is the difference between a point and a vector?', a: 'Mathematically the same list of numbers. "Point" emphasises a location (a customer in feature space); "vector" emphasises an arrow with direction and length (a change, a difference between two customers). You can use either picture.' },
      { q: 'Why do people talk about 300-dimensional space? Nobody can imagine that.', a: 'Correct, and nobody tries. You reason in 2D or 3D, and the formulas (distance, average, length) work the same way with 300 entries. Trust the algebra where your imagination stops.' },
      { q: 'Are rows always samples?', a: 'In scikit-learn, pandas and most of applied ML, yes: rows are samples and columns are features. Some maths textbooks and older tools use the opposite convention, so check when reading formulas.' },
      { q: 'Is Euclidean distance the only option?', a: 'No. Manhattan distance adds absolute gaps instead of squares (like walking a city grid). Cosine similarity compares directions rather than positions, which is popular for text. You will meet it in the next chapter.' },
      { q: 'Do I need to compute any of this by hand at work?', a: 'Rarely. NumPy does it in one line, for example `np.linalg.norm(a - b)`. Doing a few by hand is still worth it, because it tells you what the library is doing and when its answer will mislead you.' },
    ],
  },

  'matrix-ops': {
    minutes: 18,
    hook: 'A bank wants to score one lakh loan applications before Monday morning. Each application has a handful of numbers, and the scoring model is a recipe of weights. Scoring them one by one in a loop works; scoring them all in **one matrix multiplication** is hundreds of times faster. That single operation, repeated billions of times on graphics cards, is what powers modern AI. This chapter teaches the four verbs of linear algebra: dot product, matrix multiplication, transpose and inverse.',
    sections: [
      {
        heading: 'The problem: combining many numbers, many times',
        blocks: [
          { p: 'In the previous chapter, data became vectors (one per item) stacked into a matrix (one row per item). Now we want to **do** something with that data. The most common task in all of ML is: take an item\'s features, weight each one by how important it is, and add them up into a single score: a predicted price, a credit score, a probability of churn.' },
          { p: 'Doing this for one item is a **dot product**. Doing it for every item at once is a **matrix–vector multiplication**. Doing it for many models or many layers at once is **matrix–matrix multiplication**. Two more operations, **transpose** and **inverse**, appear whenever we solve for the best weights.' },
          { term: 'Weight', def: 'A number that says how much one feature contributes to a score. A weight of 4 on "area in hundreds of sq ft" means each extra 100 sq ft adds 4 to the predicted price. Learning a model mostly means finding good weights.' },
          { diagram: { kind: 'flow', nodes: ['**Features** of one item (a vector)', '**Weights** of the model (a vector)', '**Dot product**: multiply pairs, add', '**One score** (price, risk, probability)'], caption: 'A linear model in one picture. Every linear regression, logistic regression and neural-network neuron starts with exactly this dot product.' } },
        ],
      },
      {
        heading: 'Building the intuition: the restaurant bill',
        blocks: [
          { p: 'You order 2 dosas, 3 coffees and 1 vada. The menu says dosa ₹80, coffee ₹40, vada ₹30. How do you get the bill? Multiply each quantity by its price and add: 2 × 80 + 3 × 40 + 1 × 30 = 160 + 120 + 30 = ₹310. You have just computed a dot product of the order vector [2, 3, 1] with the price vector [80, 40, 30].' },
          { steps: [
            '**One table, one bill:** order vector · price vector = one number. That is a dot product.',
            '**Ten tables, ten bills:** stack the ten orders as rows of a matrix and multiply by the price vector. You get a vector of ten bills. That is matrix × vector.',
            '**Ten tables, two menus** (normal and festival prices): put the two price lists side by side as columns of a matrix. Multiplying gives a 10 × 2 table of bills. That is matrix × matrix.',
            '**Undoing it:** if you know the bills and the quantities but have lost the menu, can you recover the prices? That is what an inverse does.',
          ], title: 'From one bill to many' },
          { p: 'There is a second, geometric reading of the dot product: it measures **how much two vectors point the same way**. Two customers who spend heavily in the same categories have a large dot product; customers with opposite habits have a small or negative one. A handy way to remember it: the dot product is a "how much do we agree" score.' },
          { term: 'Dot product', def: 'Multiply two equal-length vectors position by position and add the results, giving one number. It is a weighted sum, and it also measures how aligned two vectors are.' },
          { think: { q: 'The dot product of [1, 0] and [0, 1] is 0. What does that say about the two arrows?', a: 'They are at right angles: one points purely east, the other purely north, so they share no direction at all. In general a dot product of zero means the vectors are perpendicular (also called orthogonal).' } },
        ],
      },
      {
        heading: 'How it works, step by step',
        blocks: [
          { steps: [
            '**Dot product:** line up two vectors of equal length, multiply matching entries, add.',
            '**Matrix × vector:** take the dot product of each row of the matrix with the vector. An (m × n) matrix times an n-vector gives an m-vector.',
            '**Matrix × matrix:** entry (i, j) of the result is the dot product of row i of the first matrix with column j of the second. (m × n) times (n × p) gives (m × p).',
            '**Transpose:** turn rows into columns. An (m × n) matrix becomes (n × m).',
            '**Inverse:** for a square matrix A, find the matrix A⁻¹ that undoes it, so that A⁻¹A = I (the identity, which changes nothing).',
          ], title: 'The five operations' },
          { p: 'The one rule that prevents most errors: **inner dimensions must match.** To multiply (m × n) by (n × p), the n\'s must be equal; the answer has the outer dimensions (m × p). A (3 × 2) matrix can multiply a 2-vector but not a 3-vector.' },
          { term: 'Transpose', def: 'Flipping a matrix over its diagonal so rows become columns, written Xᵀ. A 1,000 × 5 data matrix becomes 5 × 1,000.' },
          { term: 'Identity matrix', def: 'A square matrix with 1s on the diagonal and 0s elsewhere, written I. Multiplying by it changes nothing, like multiplying a number by 1.' },
          { term: 'Inverse', def: 'For a square matrix A, the matrix A⁻¹ with A⁻¹A = I. It plays the role of division. Not every matrix has one: if A squashes some direction to zero, the information is lost and cannot be undone.' },
          { diagram: { kind: 'table', head: ['Operation', 'Shapes', 'Result', 'NumPy'], rows: [['Dot product', '(n,) · (n,)', 'one number', 'a @ b'], ['Matrix × vector', '(m, n) @ (n,)', '(m,)', 'X @ w'], ['Matrix × matrix', '(m, n) @ (n, p)', '(m, p)', 'A @ B'], ['Transpose', '(m, n)', '(n, m)', 'X.T'], ['Inverse', '(n, n)', '(n, n)', 'np.linalg.inv(A)']], caption: 'Shapes are the grammar of linear algebra. Check that the inner numbers match before multiplying, and the result takes the outer numbers.' } },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { tex: '\\mathbf{a} \\cdot \\mathbf{b} = \\sum_{i=1}^{n} a_i b_i = a_1 b_1 + a_2 b_2 + \\dots + a_n b_n', plain: 'Multiply matching entries and add. The restaurant bill is order · prices.', symbols: [['a_i, b_i', 'the i-th entries of the two vectors'], ['n', 'their common length']] },
          { p: 'The geometric reading uses the angle between the arrows. If two vectors point the same way, the angle is 0 and cos 0 = 1, so the dot product is as big as it can be. At right angles cos 90° = 0. Pointing opposite ways, cos 180° = −1.' },
          { tex: '\\mathbf{a} \\cdot \\mathbf{b} = \\lVert \\mathbf{a} \\rVert \\, \\lVert \\mathbf{b} \\rVert \\cos\\theta', plain: 'Dot product = length of a × length of b × how aligned they are. Divide by both lengths and you are left with cos θ, the cosine similarity, a pure "same direction" score between −1 and 1.', symbols: [['\\theta', 'the angle between the two arrows'], ['\\cos\\theta', 'cosine similarity: 1 = same direction, 0 = unrelated, −1 = opposite']] },
          { tex: '(AB)_{ij} = \\sum_{k=1}^{n} A_{ik} B_{kj}', plain: 'To fill row i, column j of the answer, walk along row i of A and down column j of B, multiplying pairs and adding. Every entry of a matrix product is one dot product.', symbols: [['A_{ik}', 'row i, column k of A'], ['B_{kj}', 'row k, column j of B']] },
          { p: 'Order matters. In general AB is not equal to BA, unlike ordinary numbers where 3 × 5 = 5 × 3. Often BA is not even allowed because the shapes do not match.' },
          { p: 'Finally, the formula you will see in every regression textbook. It finds the weights β that make a linear model\'s predictions Xβ as close as possible to the actual answers y. You do not need to derive it, but you can now read every piece: transpose, matrix product, inverse.' },
          { tex: '\\hat{\\beta} = (X^\\top X)^{-1} X^\\top y', plain: 'Best weights = (inverse of X-transpose-X) times X-transpose times the targets. It is the matrix version of "divide the covariance of x and y by the variance of x".', symbols: [['X', 'data matrix, one row per item'], ['y', 'vector of actual target values'], ['\\hat{\\beta}', 'the estimated best weights'], ['X^\\top', 'transpose of X']] },
          { callout: 'Libraries rarely compute that inverse literally. It is slow and numerically fragile. scikit-learn\'s LinearRegression solves the same problem with more stable methods (a least-squares solver based on matrix factorisations). The formula is for understanding, not for typing.', tone: 'warn' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Score three loan applicants in one go', setup: 'A simple scoring model uses weights w = [0.5 per ₹ lakh of annual income, 0.01 per credit-score point]. Applicants (rows): [10, 700], [4, 600], [20, 800].', steps: [
            'Applicant 1: 0.5 × 10 + 0.01 × 700 = 5 + 7 = 12.',
            'Applicant 2: 0.5 × 4 + 0.01 × 600 = 2 + 6 = 8.',
            'Applicant 3: 0.5 × 20 + 0.01 × 800 = 10 + 8 = 18.',
            'In matrix form: X is (3 × 2), w is (2,), so X @ w has shape (3,) = [12, 8, 18].',
          ], result: 'One matrix–vector multiplication scored every applicant. For one lakh applicants the code is identical; only the number of rows changes.' } },
          { example: { title: 'Store revenue and cost with a matrix product', setup: 'Weekly units of [chips, biscuits, juice]: Store 1 = [120, 80, 40], Store 2 = [90, 110, 60]. Price per unit ₹50, ₹30, ₹100; cost per unit ₹35, ₹20, ₹60. Put prices and costs as two columns of a (3 × 2) matrix P.', steps: [
            'Sales matrix S is (2 × 3); P is (3 × 2); inner dimensions 3 and 3 match, so S @ P is (2 × 2).',
            'Store 1 revenue = 120 × 50 + 80 × 30 + 40 × 100 = 6,000 + 2,400 + 4,000 = ₹12,400.',
            'Store 1 cost = 120 × 35 + 80 × 20 + 40 × 60 = 4,200 + 1,600 + 2,400 = ₹8,200.',
            'Store 2 revenue = 90 × 50 + 110 × 30 + 60 × 100 = 4,500 + 3,300 + 6,000 = ₹13,800.',
            'Store 2 cost = 90 × 35 + 110 × 20 + 60 × 60 = 3,150 + 2,200 + 3,600 = ₹8,950.',
          ], result: 'S @ P = [[12,400, 8,200], [13,800, 8,950]]. Margins: Store 1 ₹4,200, Store 2 ₹4,850. Four dot products, one operation.' } },
          { diagram: { kind: 'bars', labels: ['S1 revenue', 'S1 cost', 'S2 revenue', 'S2 cost'], values: [12400, 8200, 13800, 8950], highlight: 2, yLabel: '₹ per week', caption: 'The four entries of S @ P. Each bar is one dot product of a store\'s sales row with a price or cost column.' } },
          { example: { title: 'Recover a lost menu with an inverse', setup: 'A bakery remembers only two bills: 2 cakes + 1 bread = ₹500, and 1 cake + 3 breads = ₹600. Find the price of each.', steps: [
            'Write it as A p = b with A = [[2, 1], [1, 3]], p = [cake, bread], b = [500, 600].',
            'For a 2 × 2 matrix [[a, b], [c, d]], the inverse is 1/(ad − bc) × [[d, −b], [−c, a]]. Here ad − bc = 2 × 3 − 1 × 1 = 5.',
            'A⁻¹ = (1/5) × [[3, −1], [−1, 2]].',
            'p = A⁻¹ b: cake = (3 × 500 − 1 × 600)/5 = 900/5 = 180; bread = (−1 × 500 + 2 × 600)/5 = 700/5 = 140.',
            'Check: 2 × 180 + 140 = 500 and 180 + 3 × 140 = 600.',
          ], result: 'Cake ₹180, bread ₹140. Solving for model weights in regression is the same idea with more rows and columns.' } },
          { example: { title: 'Cosine similarity between shoppers', setup: 'Monthly spend in [groceries, toys, home, electronics] (₹ thousand): Asha = [5, 0, 3, 1], Ben = [4, 1, 2, 0], Chitra = [0, 5, 0, 4].', steps: [
            'Asha · Ben = 20 + 0 + 6 + 0 = 26. ‖Asha‖ = √35 ≈ 5.92; ‖Ben‖ = √21 ≈ 4.58. Cosine = 26 / (5.92 × 4.58) ≈ 0.96.',
            'Asha · Chitra = 0 + 0 + 0 + 4 = 4. ‖Chitra‖ = √41 ≈ 6.40. Cosine = 4 / (5.92 × 6.40) ≈ 0.11.',
          ], result: 'Asha and Ben shop almost identically in pattern (0.96); Asha and Chitra barely overlap (0.11). Recommend Ben\'s purchases to Asha, not Chitra\'s.' } },
        ],
      },
      {
        heading: 'Why GPUs love matrix multiplication',
        blocks: [
          { p: 'Each entry of a matrix product can be computed independently of the others. That makes the work perfect for hardware with thousands of small cores working in parallel, which is what a graphics card (GPU) is. A neural-network layer is literally "input matrix @ weight matrix", followed by a simple function.' },
          { diagram: { kind: 'compare', left: { title: 'Python loop over rows', items: ['One applicant at a time', 'Interpreter overhead on every step', 'Easy to read, slow to run', 'Fine for 100 rows'] }, right: { title: 'Vectorised X @ w', items: ['All rows in one call', 'Runs in optimised compiled code (BLAS)', 'Uses CPU vector units or GPU cores', 'Essential for millions of rows'] }, caption: 'Same arithmetic, very different speed. "Vectorise your code" means replace loops with matrix operations.' } },
          { think: { q: 'A neural-network layer takes 64 samples with 512 features each and has a weight matrix of shape (512, 256). What shape is the output?', a: '(64, 512) @ (512, 256) = (64, 256). The inner 512s match and disappear; the outer numbers remain: 64 samples, each now described by 256 new numbers.' } },
        ],
      },
      {
        heading: 'In the real world',
        blocks: [
          { case: { title: 'Credit scoring at batch scale (illustrative)', story: 'A consumer-lending team scores every live account each night to decide credit-limit increases. Their logistic regression model has 40 features, so the core computation is a (number of accounts × 40) matrix times a 40-entry weight vector, followed by a function that turns each score into a probability. Rewriting a row-by-row Python loop as one NumPy matrix multiplication cut the nightly run from hours to minutes, with identical results. The model itself did not change; only the arithmetic was organised better.' } },
          { bullets: [
            '**Recommendation engines:** cosine similarity between user and product vectors ranks what to show next.',
            '**Neural networks and LLMs:** almost all computation is matrix multiplication of activations by weight matrices.',
            '**Supply chain:** a bill-of-materials matrix times a production plan gives the parts needed.',
            '**Image processing:** rotating, scaling or shearing an image multiplies every pixel coordinate by a 2 × 2 matrix.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls and limits',
        blocks: [
          { bullets: [
            '**`*` is not `@`.** In NumPy, `A * B` multiplies element by element; `A @ B` is matrix multiplication. Mixing them gives wrong numbers silently whenever the shapes happen to allow both.',
            '**Order matters:** AB is usually not BA.',
            '**Singular matrices have no inverse.** If two columns carry the same information (for example price in rupees and the same price in dollars), XᵀX cannot be inverted. In regression this is perfect multicollinearity; drop a duplicate column or use regularisation such as Ridge.',
            '**Near-singular is almost as bad:** strongly correlated features make inverses unstable, so tiny data changes swing the weights wildly.',
            '**Dot products depend on scale:** a vector with large entries has large dot products with everything. Use cosine similarity when only direction matters.',
          ] },
          { callout: 'Matrices are not just tables; they are machines that transform vectors. The next chapter asks: which directions does such a machine leave pointing the same way? Those are eigenvectors.', tone: 'key' },
        ],
      },
    ],
    faq: [
      { q: 'What is the difference between a dot product and matrix multiplication?', a: 'A dot product combines two vectors into one number. Matrix multiplication is many dot products at once: every row of the first matrix with every column of the second.' },
      { q: 'Why is it called a "linear" model?', a: 'Because the prediction is a dot product: features multiplied by weights and added. Doubling a feature\'s change doubles its effect on the prediction. No squares, no curves, just straight-line relationships.' },
      { q: 'When would a matrix have no inverse?', a: 'When it squashes some direction down to zero, so two different inputs give the same output and you cannot tell which one you started from. In data terms, this happens when one feature is an exact combination of others.' },
      { q: 'Do I need to multiply matrices by hand?', a: 'Only enough to understand it. In practice `@` in NumPy or PyTorch does it. What you must be able to do by hand is check shapes.' },
      { q: 'Is cosine similarity better than Euclidean distance?', a: 'Neither is better in general. Cosine compares direction (taste, topic) and ignores size; Euclidean compares position and includes size. Text embeddings usually use cosine; physical measurements usually use Euclidean.' },
      { q: 'What does "vectorised code" mean?', a: 'Code that applies operations to whole arrays at once (`X @ w`, `a + b`) instead of looping over elements in Python. It is shorter, and typically tens to hundreds of times faster.' },
    ],
  },
  eigen: {
    minutes: 18,
    hook: 'Spin a globe and every city on it moves, except the points on the axis: they stay on the same line, however fast you spin. Matrices behave the same way. When a matrix transforms space, most directions get twisted, but a few special directions are only stretched or shrunk. These are **eigenvectors**, and the amount of stretch is the **eigenvalue**. They sound abstract, yet they sit underneath PCA, Google\'s original PageRank, and every "what share of the variation does this factor explain?" chart you will see in a consulting deck.',
    sections: [
      {
        heading: 'The problem: finding the directions that matter',
        blocks: [
          { p: 'A car maker\'s quality team records 40 measurements on every gearbox coming off the line. Many of them move together: when one dimension runs large, several related ones do too. The engineers suspect there are really only three or four underlying "ways" a gearbox can vary. Which combinations of measurements are they, and how much of the total variation does each one explain?' },
          { p: 'That question, "what are the main directions in this data, and how important is each?", is exactly what eigenvectors and eigenvalues answer. To get there we first need one idea from the previous chapter: **a matrix is a machine that transforms vectors.** Feed in an arrow, get out a different arrow.' },
          { term: 'Linear transformation', def: 'What a matrix does to vectors when you multiply them by it: stretch, squash, rotate, reflect or shear space, always keeping straight lines straight and the origin fixed.' },
          { p: 'Most arrows come out of the machine pointing in a new direction. Eigenvectors are the rare arrows that come out pointing along the same line as they went in. They reveal the "natural axes" of the transformation, and for data, the natural axes of the cloud of points.' },
        ],
      },
      {
        heading: 'Building the intuition: stretching a rubber sheet',
        blocks: [
          { p: 'Draw some arrows from the centre of a rubber sheet, pin the centre, and stretch the sheet: pull it diagonally, say, from bottom-left to top-right.' },
          { steps: [
            '**Most arrows swing round.** An arrow that pointed due east now points somewhat north-east, because the pull dragged it towards the diagonal.',
            '**The arrow along the pull just gets longer.** It was on the diagonal and it stays on the diagonal. That is an eigenvector, and "how much longer" is its eigenvalue (bigger than 1).',
            '**The arrow at right angles to the pull may just get shorter or stay put.** It also keeps its line. Another eigenvector, with an eigenvalue of 1 or less.',
            '**Every other arrow is a mix** of these two special directions, so you can predict exactly what happens to it once you know the eigenvectors and eigenvalues.',
          ], title: 'What the sheet teaches us' },
          { term: 'Eigenvector', def: 'A non-zero direction that a matrix only stretches, shrinks or flips, without turning it off its line. "Eigen" is German for "own" or "characteristic": these are the matrix\'s own directions.' },
          { term: 'Eigenvalue', def: 'The stretch factor along an eigenvector. 3 means three times longer, 0.5 means halved, 0 means squashed flat, and a negative value means flipped to point the opposite way.' },
          { think: { q: 'A matrix rotates every vector by 90 degrees. Does it have any (real) eigenvectors?', a: 'No. Every direction gets turned, so no arrow stays on its own line. Pure rotations in 2D have no real eigenvectors; their eigenvalues are complex numbers. Fortunately the matrices we meet in data science, covariance matrices, are symmetric and always have real eigenvalues and perpendicular eigenvectors.' } },
          { callout: 'Eigenvectors are about directions, not specific arrows. If v is an eigenvector, so is 2v or −v. Libraries usually report them scaled to length 1, and the sign they choose is arbitrary.', tone: 'key' },
        ],
      },
      {
        heading: 'How it works, step by step',
        blocks: [
          { p: 'For a small matrix you can find eigenvalues and eigenvectors by hand in four steps. For anything bigger, `numpy.linalg.eig` (or `eigh` for symmetric matrices) does it instantly.' },
          { steps: [
            '**Write the eigen-equation:** A v = λ v. We want v (a direction) and λ (a number).',
            '**Rearrange:** (A − λI) v = 0. A non-zero v can only be squashed to zero if A − λI has no inverse.',
            '**Solve for λ:** "no inverse" means the determinant of A − λI is zero. For a 2 × 2 matrix this is a quadratic equation, giving two eigenvalues.',
            '**Find each v:** plug each λ back in and solve (A − λI) v = 0 for the direction.',
          ], title: 'Finding eigenvalues and eigenvectors' },
          { term: 'Determinant', def: 'A single number computed from a square matrix that says how much it scales areas (or volumes). For [[a, b], [c, d]] it is ad − bc. A determinant of zero means the matrix squashes space flat, so it has no inverse.' },
          { p: 'In data science you almost never apply this to a random matrix. You apply it to the **covariance matrix** of your features, because its eigenvectors are the main directions of spread in the data. That recipe is called Principal Component Analysis (PCA).' },
          { term: 'Covariance matrix', def: 'A square table that, for every pair of features, records how much they vary together. Diagonal entries are each feature\'s variance; off-diagonal entries are covariances. For standardised features it is the correlation matrix.' },
          { diagram: { kind: 'flow', nodes: ['**Standardise** each feature', '**Covariance matrix** of the features', '**Eigen-decompose**: eigenvectors and eigenvalues', '**Sort** by eigenvalue, largest first', '**Keep the top few** directions (principal components)'], caption: 'PCA is eigenvectors applied to data. The eigenvalues decide how many directions are worth keeping.' } },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { tex: 'A\\mathbf{v} = \\lambda \\mathbf{v}', plain: 'Multiplying the eigenvector v by the matrix A gives the same vector back, just multiplied by an ordinary number λ. The matrix acts on this direction like simple multiplication.', symbols: [['A', 'a square matrix (the transformation)'], ['\\mathbf{v}', 'an eigenvector (non-zero)'], ['\\lambda', 'its eigenvalue, the stretch factor (Greek letter lambda)']] },
          { p: 'Why is this valuable? Matrix multiplication is complicated: every output entry mixes every input entry. Along an eigenvector, all that complexity collapses into multiplying by one number. If you describe your data using eigenvector directions as the axes, the matrix becomes as simple as a list of stretch factors.' },
          { tex: '\\det(A - \\lambda I) = 0', plain: 'The characteristic equation. Subtract λ from every diagonal entry of A, take the determinant, set it to zero, and solve for λ. The solutions are the eigenvalues.', symbols: [['I', 'identity matrix'], ['\\det', 'determinant']] },
          { p: 'Two handy checks for any square matrix: the eigenvalues add up to the **trace** (the sum of the diagonal entries) and multiply to the determinant. If your hand calculation fails these checks, something went wrong.' },
          { tex: '\\text{share of variance}_k = \\frac{\\lambda_k}{\\lambda_1 + \\lambda_2 + \\dots + \\lambda_n}', plain: 'For a covariance matrix, each eigenvalue is the variance of the data along its eigenvector. Divide by the total to get the share of all variation that direction explains. This is the "explained variance ratio" in scikit-learn\'s PCA.', symbols: [['\\lambda_k', 'the k-th eigenvalue'], ['n', 'number of features']] },
          { p: 'Why does the covariance matrix have this property? Its eigenvector with the largest eigenvalue is the single direction along which the data, projected onto that line, has the greatest variance. The next eigenvector is the best direction perpendicular to the first, and so on. Symmetric matrices like covariance matrices guarantee these directions are at right angles to each other.' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Spotting eigenvectors by testing arrows', setup: 'Take A = [[2, 1], [1, 2]]. Test three arrows: [1, 0], [1, 1] and [1, −1].', steps: [
            'A [1, 0] = [2 × 1 + 1 × 0, 1 × 1 + 2 × 0] = [2, 1]. The arrow pointed east; now it points north-east. Turned, so not an eigenvector.',
            'A [1, 1] = [2 + 1, 1 + 2] = [3, 3] = 3 × [1, 1]. Same direction, three times longer. Eigenvector with eigenvalue 3.',
            'A [1, −1] = [2 − 1, 1 − 2] = [1, −1] = 1 × [1, −1]. Unchanged. Eigenvector with eigenvalue 1.',
          ], result: 'A stretches the diagonal direction by 3 and leaves the anti-diagonal alone. Every other arrow, such as [1, 0], is a mix of the two and gets pulled towards the diagonal.' } },
          { diagram: { kind: 'scatter', xLabel: 'first coordinate', yLabel: 'second coordinate', line: { m: 1, b: 0 }, caption: 'Arrow tips before (blue) and after (orange) multiplying by A. [1, 1] moves out to [3, 3] along the line y = x; [1, −1] stays put; [1, 0] lands at [2, 1], off its original line. The drawn line is the eigenvector direction with eigenvalue 3.', points: [[1, 0, 0], [1, 1, 0], [1, -1, 0], [2, 1, 1], [3, 3, 1], [1, -1, 1]] } },
          { example: { title: 'Eigenvalues by the characteristic equation', setup: 'Find the eigenvalues of the same A = [[2, 1], [1, 2]] without guessing.', steps: [
            'A − λI = [[2 − λ, 1], [1, 2 − λ]].',
            'Determinant = (2 − λ)(2 − λ) − 1 × 1 = λ² − 4λ + 3.',
            'Solve λ² − 4λ + 3 = 0: (λ − 1)(λ − 3) = 0, so λ = 1 or λ = 3.',
            'For λ = 3: (A − 3I)v = [[−1, 1], [1, −1]]v = 0 means v₁ = v₂, the direction [1, 1].',
            'Checks: trace = 2 + 2 = 4 = 1 + 3. Determinant = 4 − 1 = 3 = 1 × 3.',
          ], result: 'The algebra confirms what testing found: eigenvalues 3 and 1, along [1, 1] and [1, −1].' } },
          { example: { title: 'How much does one factor explain? (business PCA)', setup: 'A retailer standardises two store features, weekly footfall and weekly sales. Their correlation is 0.8, so the covariance matrix is [[1, 0.8], [0.8, 1]].', steps: [
            'Characteristic equation: (1 − λ)² − 0.64 = 0, so 1 − λ = ±0.8, giving λ = 1.8 or λ = 0.2.',
            'Eigenvector for 1.8 is [1, 1] (scaled: [0.71, 0.71]), an equal blend of footfall and sales: a "store activity" factor.',
            'Eigenvector for 0.2 is [1, −1]: "sales higher than footfall would suggest", a conversion factor.',
            'Share of variance: 1.8 / (1.8 + 0.2) = 0.9, so 90% for store activity and 10% for conversion.',
          ], result: 'One combined "activity" score keeps 90% of the information in two features. The small 10% direction is not junk, though: it is exactly where the stores that convert unusually well or badly show up.' } },
          { diagram: { kind: 'scatter', xLabel: 'footfall (standardised)', yLabel: 'sales (standardised)', line: { m: 1, b: 0 }, caption: 'Twenty-two stores with correlation about 0.8. The cloud is a tilted ellipse; the line y = x is the top eigenvector (eigenvalue 1.8), running along the long axis. Spread across the line (the second eigenvector) is much smaller.', points: [[-1.2, -2.4], [-0.3, -0.6], [0.4, 0.2], [1.9, 1.4], [-0.3, 1.5], [-0.2, -0.4], [0.4, 0], [1.0, 0.6], [-0.5, -0.5], [-1.0, -0.9], [-0.6, 0.3], [-0.5, -0.6], [-0.1, 0.2], [-1.9, -1.7], [-0.2, 0.4], [0.8, 0.5], [-1.1, -0.6], [-0.4, 0], [2.3, 2.4], [1.4, 0.2], [-0.6, -0.1], [0.7, 0]] } },
          { example: { title: 'Long-run market share as an eigenvector', setup: 'Each month 90% of Brand A\'s customers stay and 10% switch to B; 80% of Brand B\'s stay and 20% switch to A. Transition matrix M = [[0.9, 0.2], [0.1, 0.8]] (columns are "from A", "from B"). Start at 50% / 50%.', steps: [
            'Month 1: A = 0.9 × 0.5 + 0.2 × 0.5 = 0.55; B = 0.45.',
            'Month 2: A = 0.9 × 0.55 + 0.2 × 0.45 = 0.585. Month 3: A = 0.6095.',
            'Look for a share s that M leaves unchanged: M s = 1 × s. Try s = [2/3, 1/3]: A = 0.9 × 2/3 + 0.2 × 1/3 = 0.6 + 0.0667 = 0.6667. Unchanged.',
            'So [2/3, 1/3] is an eigenvector with eigenvalue 1. The other eigenvalue is 0.7: each month the gap to the long-run share shrinks to 70% of what it was.',
          ], result: 'Whatever the starting split, Brand A heads towards about 66.7% of the market. The eigenvalue 0.7 also tells you how fast: roughly 30% of the remaining gap closes each month.' } },
        ],
      },
      {
        heading: 'Reading eigenvalues: how many directions to keep',
        blocks: [
          { p: 'After PCA you get one eigenvalue per feature. Sorting them and plotting their shares (a "scree plot") shows how quickly information runs out. Analysts typically keep enough components to explain 80–95% of the variance, or stop where the bars flatten.' },
          { diagram: { kind: 'bars', labels: ['PC1', 'PC2', 'PC3', 'PC4', 'PC5'], values: [55, 25, 10, 6, 4], highlight: 1, yLabel: '% of variance', caption: 'A typical scree plot (illustrative). The first two components explain 80% of the variation, the third adds 10%, and the rest add little. Keeping two or three components is reasonable.' } },
          { bullets: [
            '**A large eigenvalue** means lots of spread along that direction: a dominant pattern in the data.',
            '**An eigenvalue near zero** means almost no spread: the features are nearly redundant in that direction (multicollinearity).',
            '**Eigenvalues 6, 3 and 1** give shares of 60%, 30% and 10%; the first two together explain 90%.',
            '**Loadings** (the entries of each eigenvector) tell you which original features make up each component, so you can name it, for example "size" or "price sensitivity".',
          ] },
        ],
      },
      {
        heading: 'In the real world',
        blocks: [
          { case: { title: 'PageRank: importance as an eigenvector', story: 'Google\'s original PageRank idea, published by its founders in the late 1990s, ranks a web page as important if important pages link to it. Written as a matrix of "a random surfer moves from page i to page j" probabilities, the ranking is the eigenvector with eigenvalue 1, the same long-run share idea as the two-brand example above, but with billions of pages. It is computed by repeatedly multiplying a starting vector by the matrix until it stops changing (the power method), because solving the characteristic equation at that scale is impossible.' } },
          { bullets: [
            '**PCA for dashboards:** compress dozens of correlated KPIs into a few indices, such as an overall "store health" score.',
            '**Finance:** the top eigenvector of a stock-return correlation matrix is usually a "whole market" factor; risk teams track how much variance it explains.',
            '**Face recognition (eigenfaces):** a classic approach represented faces as combinations of the top eigenvectors of many face images.',
            '**Spectral clustering:** eigenvectors of a similarity graph reveal clusters with odd shapes that k-means misses.',
            '**Engineering:** vibration modes of a car body or bridge are eigenvectors; eigenvalues give the natural frequencies to avoid.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Forgetting to standardise:** a feature measured in rupees has a huge variance and grabs the top eigenvector on its own. Standardise before PCA unless the units are comparable.',
            '**Over-reading signs:** an eigenvector and its negative are the same direction. If a loading flips sign between runs, nothing has changed.',
            '**Naming components too boldly:** components are blends of many features; a neat label like "luxury" may hide important mixed contributions.',
            '**Assuming the big directions matter for prediction:** PCA keeps directions of large variance, not directions that predict your target. A small component can carry the signal.',
            '**Non-symmetric matrices** can have complex eigenvalues and non-perpendicular eigenvectors; the tidy picture applies to covariance matrices.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'Eigen-decomposition', items: ['Square matrices only', 'Covariance matrix → PCA', 'Eigenvectors perpendicular when symmetric', 'Classic textbook route'] }, right: { title: 'Singular Value Decomposition (SVD)', items: ['Works on any rectangular matrix', 'Applied directly to the data matrix X', 'More numerically stable', 'What scikit-learn\'s PCA actually uses'] }, caption: 'SVD is the practical cousin of eigen-decomposition. For PCA they give the same components; libraries prefer SVD for stability.' } },
        ],
      },
    ],
    faq: [
      { q: 'Do I need eigenvectors to use PCA in scikit-learn?', a: 'Not to run it: `PCA(n_components=3).fit(X)` does everything. You need the idea to interpret it: `explained_variance_` are the eigenvalues and `components_` are the eigenvectors (loadings).' },
      { q: 'Why "eigen"?', a: 'It is German for "own" or "characteristic". Eigenvectors are a matrix\'s own characteristic directions.' },
      { q: 'Can an eigenvalue be negative or zero?', a: 'Yes for general matrices: negative flips the direction, zero squashes it flat. Covariance matrices only have eigenvalues of zero or more, because variance cannot be negative.' },
      { q: 'How many eigenvectors does a matrix have?', a: 'An n × n symmetric matrix has n perpendicular eigenvector directions, one per eigenvalue. Each direction can be scaled by any non-zero number and still counts as the same eigenvector.' },
      { q: 'Is the top eigenvector always the most important feature?', a: 'It is not a feature at all but a new direction that blends features. It is the direction of greatest spread, which is not necessarily the most useful for predicting a target.' },
      { q: 'How do computers find eigenvectors of huge matrices?', a: 'With iterative methods. The simplest, the power method, repeatedly multiplies a vector by the matrix; it lines up with the eigenvector of largest eigenvalue. Production libraries use more refined versions of the same idea.' },
    ],
  },

  derivatives: {
    minutes: 15,
    hook: 'Glance at a car\'s speedometer and it says 60 km/h. Nobody drove for exactly one hour; the dial is telling you how fast your position is changing at this very instant. That instant rate of change is a **derivative**. In machine learning, the "position" is the model\'s error and the "road" is a setting such as a weight. The derivative tells the model which way to turn the dial to make the error smaller. Every model that "learns" is following derivatives.',
    sections: [
      {
        heading: 'The problem: which way should I adjust?',
        blocks: [
          { p: 'A chai stall owner wants to set the price of a cup. Charge too little and margins vanish; charge too much and customers walk away. Profit depends on price, and somewhere in the middle there is a best price. If she is at ₹25 today, should she move up or down, and is she close to the peak or far from it?' },
          { p: 'Training an ML model is the same question with different words. A model has settings (weights). Its error depends on those settings. We want to know: **if I nudge this weight a tiny bit, does the error go up or down, and how quickly?** The answer is the derivative.' },
          { term: 'Function', def: 'A rule that turns an input into an output, such as profit(price) or error(weight). Written f(x): put in x, get out f(x).' },
          { term: 'Derivative', def: 'How fast a function\'s output changes as its input changes, at one particular point. Geometrically, the slope of the curve at that point. Written f′(x) or df/dx.' },
          { diagram: { kind: 'curve', fn: '(x-10)*(1000-20*x)', xMin: 12, xMax: 48, marks: [{ x: 25, label: 'today ₹25' }, { x: 30, label: 'peak ₹30' }], xLabel: 'price per cup (₹)', yLabel: 'daily profit (₹)', caption: 'An illustrative profit curve for the chai stall. At ₹25 the curve still slopes upwards (positive derivative), so a higher price helps. At ₹30 it is flat (derivative zero): the peak.' } },
        ],
      },
      {
        heading: 'Building the intuition: the speedometer and the hill',
        blocks: [
          { p: 'Average speed is easy: 120 km in 2 hours is 60 km/h. But that average hides the moments you were stuck in traffic and the moments you raced along the highway. To know the speed **now**, measure distance over a shorter and shorter interval.' },
          { steps: [
            '**Over one hour:** distance ÷ time gives a rough average speed.',
            '**Over one minute:** much closer to what the speedometer shows.',
            '**Over one second:** almost exactly the speedometer reading.',
            '**In the limit of a vanishingly small interval:** the instant speed. That limit is the derivative of position with respect to time.',
          ], title: 'Zooming in on "right now"' },
          { p: 'The same idea in pictures: zoom in far enough on any smooth curve and it looks like a straight line. The slope of that line, how much it rises for each step to the right, is the derivative at that point. The line itself is called the **tangent**.' },
          { term: 'Slope', def: 'Rise over run: how much the output goes up for each one-unit step in the input. Positive slope = uphill to the right, negative = downhill, zero = flat.' },
          { term: 'Tangent line', def: 'The straight line that just touches a curve at one point and has the same slope as the curve there. It is the best straight-line approximation to the curve near that point.' },
          { think: { q: 'You are standing on a hillside in thick fog. You feel the ground slope down to your left. Without seeing anything, which way do you walk to reach the valley?', a: 'Left: downhill. You only need the local slope, not a map of the whole hill. Machine learning uses exactly this: the derivative is the local slope of the error, and we step in the downhill direction.' } },
        ],
      },
      {
        heading: 'How it works, step by step',
        blocks: [
          { steps: [
            '**Pick the point** x where you want the slope.',
            '**Nudge the input** by a small amount h, to x + h.',
            '**Measure the change in output:** f(x + h) − f(x).',
            '**Divide by the nudge:** change in output ÷ h. This is the slope of a short chord.',
            '**Shrink h towards zero.** The chord slopes settle on one value: the derivative.',
          ], title: 'Computing a slope from scratch' },
          { diagram: { kind: 'flow', nodes: ['**Pick x**', '**Nudge** to x + h', '**Rise** = f(x+h) − f(x)', '**Slope** = rise ÷ h', '**Shrink h** → derivative'], caption: 'The definition of a derivative as a procedure. Computers still use this "nudge and measure" idea to double-check derivatives (finite differences).' } },
          { p: 'Doing this limit by hand every time would be tiresome, so mathematicians worked out shortcut rules once and for all. A handful of them cover nearly everything in ML.' },
          { diagram: { kind: 'table', head: ['Function f(x)', 'Derivative f′(x)', 'In words'], rows: [['c (a constant)', '0', 'a flat line has no slope'], ['a·x', 'a', 'a straight line has constant slope'], ['x²', '2x', 'steeper the further from zero'], ['xⁿ', 'n·xⁿ⁻¹', 'the power rule'], ['eˣ', 'eˣ', 'grows at a rate equal to itself'], ['ln x', '1/x', 'used in log-loss'], ['f + g', 'f′ + g′', 'slopes of a sum add up']], caption: 'The derivative rules you will meet again and again. The chain rule, for functions inside functions, gets its own chapter next.' } },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { tex: "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}", plain: 'The derivative at x is the change in output divided by the change in input, as the change in input shrinks towards zero.', symbols: [["f'(x)", 'the derivative of f at x'], ['h', 'a small nudge to the input'], ['\\lim_{h \\to 0}', '"the value this approaches as h gets ever closer to zero"']] },
          { p: 'Why a limit instead of just picking a tiny h? Because any fixed h, however small, still measures an average over a short stretch. The limit is the exact instant value, and for smooth functions it can be found with algebra rather than measurement.' },
          { p: 'Let us see the power rule appear for f(x) = x². Expand (x + h)² = x² + 2xh + h². Subtract x² to get 2xh + h². Divide by h to get 2x + h. As h shrinks to zero, that is just 2x. So the slope of x² at any point is 2x.' },
          { tex: '\\frac{d}{dx}\\,x^n = n\\,x^{n-1}', plain: 'Power rule: bring the power down in front and reduce the power by one. x³ becomes 3x², x² becomes 2x, x becomes 1.', symbols: [['\\frac{d}{dx}', '"the derivative with respect to x of"'], ['n', 'any fixed power']] },
          { p: 'The sign of the derivative is what learning algorithms care about most. Positive: increasing x increases f, so to make f smaller, decrease x. Negative: increasing x decreases f, so increase x. Zero: flat, a candidate for a minimum or a maximum.' },
          { callout: 'A zero derivative only says "flat here". It could be the bottom of a valley (minimum), the top of a hill (maximum), or a flat ledge (saddle). For a curve shaped like a bowl, such as (w − 3)², the flat point is always the minimum.', tone: 'warn' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Watching the slope of x² appear at x = 3', setup: 'f(x) = x². Compute chord slopes from x = 3 with smaller and smaller nudges h.', steps: [
            'h = 1: (f(4) − f(3)) / 1 = (16 − 9) / 1 = 7.',
            'h = 0.1: (f(3.1) − f(3)) / 0.1 = (9.61 − 9) / 0.1 = 6.1.',
            'h = 0.01: (f(3.01) − f(3)) / 0.01 = (9.0601 − 9) / 0.01 = 6.01.',
            'The pattern is 6 + h, heading for 6. The power rule gives f′(3) = 2 × 3 = 6.',
          ], result: 'The slope of x² at x = 3 is 6. The tangent line there is y = 6x − 9: it touches the curve at (3, 9) and rises 6 for every step to the right.' } },
          { diagram: { kind: 'curve', fn: 'x*x', fn2: '6*x-9', xMin: 0, xMax: 5.5, marks: [{ x: 3, label: 'x = 3' }], xLabel: 'x', yLabel: 'f(x)', legend: ['f(x) = x²', 'tangent y = 6x − 9'], caption: 'The curve x² and its tangent at x = 3. Near the touching point the two are almost indistinguishable; that local straightness is what makes derivatives work.' } },
          { example: { title: 'Pricing a cup of chai (business, illustrative)', setup: 'A stall sells 1,000 − 20p cups a day at price ₹p, and each cup costs ₹10 to make. Profit π(p) = (p − 10)(1,000 − 20p).', steps: [
            'Expand: π(p) = 1,000p − 20p² − 10,000 + 200p = −20p² + 1,200p − 10,000.',
            'Derivative: π′(p) = −40p + 1,200.',
            'At today\'s ₹25: π′(25) = −1,000 + 1,200 = +200. Each extra rupee of price adds roughly ₹200 of daily profit, so raise the price.',
            'Set π′(p) = 0: 40p = 1,200, so p = ₹30. At ₹35, π′(35) = −200: too high.',
            'Profit at ₹30 = 20 × (1,000 − 600) = 20 × 400 = ₹8,000 a day, versus ₹7,500 at ₹25.',
          ], result: 'The derivative told her the direction (up), the strength of the effect (about ₹200 per rupee at ₹25) and the best price (₹30, where the slope is zero).' } },
          { example: { title: 'Finding the bottom of an error curve', setup: 'A one-weight model has error E(w) = (w − 3)². Use the derivative to decide which way to move w.', steps: [
            'Derivative: E′(w) = 2(w − 3).',
            'At w = 5: E′ = 2 × 2 = +4. Positive slope, so decrease w.',
            'At w = 1: E′ = 2 × (−2) = −4. Negative slope, so increase w.',
            'At w = 3: E′ = 0. Flat bottom: the minimum error, E = 0.',
          ], result: 'From either side, the sign of the derivative points towards w = 3. Gradient descent turns this into an automatic procedure.' } },
        ],
      },
      {
        heading: 'Derivatives in machine learning',
        blocks: [
          { p: 'In ML we almost always differentiate a **loss function**: a single number that measures how wrong the model is on the training data. The input is a weight (or many weights); the output is the loss. The derivative of the loss with respect to a weight is the "blame" that weight carries for the error.' },
          { term: 'Loss function', def: 'A formula that scores how badly a model\'s predictions match the true answers. Lower is better. Mean squared error is the classic example for predicting numbers.' },
          { bullets: [
            '**Mean squared error** uses squares, so its derivative is simple and proportional to the error itself: big mistakes produce big corrections.',
            '**Log-loss** for classification uses logarithms; the rule d/dx ln x = 1/x is why it punishes confident wrong answers so hard.',
            '**The sigmoid** function used in logistic regression has a famously neat derivative, σ(1 − σ), which keeps training formulas short.',
            '**Automatic differentiation** in PyTorch or TensorFlow applies these rules for you to models with millions of weights.',
          ] },
          { diagram: { kind: 'curve', fn: '(x-3)*(x-3)', xMin: -1, xMax: 7, marks: [{ x: 1, label: 'slope −4' }, { x: 3, label: 'slope 0' }, { x: 5, label: 'slope +4' }], xLabel: 'weight w', yLabel: 'error E(w)', caption: 'The bowl-shaped error E(w) = (w − 3)². Left of the bottom the slope is negative, right of it positive, and at the bottom exactly zero. The size of the slope shrinks as you approach the minimum.' } },
        ],
      },
      {
        heading: 'In the real world',
        blocks: [
          { case: { title: 'Marginal thinking in pricing and operations', story: 'Economists call the derivative of cost or revenue the "marginal" cost or revenue: the effect of one more unit. Profit is maximised where marginal revenue equals marginal cost, which is the same as saying the derivative of profit is zero. A plant manager deciding whether to run an extra shift, or an airline deciding whether to release one more discounted seat, is reasoning with derivatives whether or not anyone writes the symbol. Demand curves in practice are estimated from data, and the derivative is only as good as that estimate.' } },
          { bullets: [
            '**Model training:** every weight update in linear regression, logistic regression and neural networks uses the derivative of the loss.',
            '**Sensitivity analysis:** "how much does the forecast move if interest rates rise by 0.1%?" is a derivative.',
            '**Finance:** an option\'s delta is the derivative of its price with respect to the underlying asset price.',
            '**Engineering:** acceleration is the derivative of speed; jerk, the derivative of acceleration, matters for passenger comfort in cars and lifts.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls and limits',
        blocks: [
          { bullets: [
            '**Value is not slope.** A high error can sit on a nearly flat plateau, so the derivative is tiny and learning stalls even though the model is bad.',
            '**Zero slope is not always a minimum.** Check whether it is a valley, a peak or a ledge.',
            '**Not every function has a derivative everywhere.** The absolute value |x| has a sharp corner at 0. ML handles such corners (for example in Lasso or the ReLU activation) with conventions or "subgradients".',
            '**Local, not global.** A derivative describes the curve near one point. Far away, the curve may bend completely differently.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'What a derivative tells you', items: ['Direction: up or down', 'Local steepness', 'Where the curve is flat', 'Effect of a small change'] }, right: { title: 'What it does not tell you', items: ['Where the overall best point is', 'Whether a flat point is a minimum', 'What happens after a big change', 'Anything at a sharp corner'] }, caption: 'Derivatives are local information. Gradient descent is the art of using local slopes to make good global progress.' } },
        ],
      },
    ],
    faq: [
      { q: 'Do I need to be good at calculus to do machine learning?', a: 'You need the ideas (slope, direction, the chain rule) far more than manual skill. Libraries compute derivatives automatically; understanding them helps you choose learning rates and diagnose training problems.' },
      { q: 'What do f′(x), df/dx and dy/dx mean? Are they different?', a: 'They are different notations for the same thing: the derivative. df/dx reads as "the change in f per change in x".' },
      { q: 'Why is the derivative of a constant zero?', a: 'A constant does not change when the input changes, so its rate of change is zero. On a graph it is a flat horizontal line.' },
      { q: 'How does a computer find derivatives?', a: 'Three ways: symbolically (like SymPy, applying the rules), numerically (nudge and measure, finite differences), and by automatic differentiation (applying the rules step by step through the code), which is what deep-learning libraries use.' },
      { q: 'What is a second derivative?', a: 'The derivative of the derivative: how fast the slope itself changes. It measures curvature. A positive second derivative means a bowl shape, which confirms a minimum.' },
      { q: 'Why does ML care about the sign more than the size?', a: 'The sign gives the direction to move. The size matters too: it sets how big the step is in gradient descent, which is why steep regions produce big updates and flat regions produce small ones.' },
    ],
  },
  gradients: {
    minutes: 16,
    hook: 'Imagine adjusting a mixing desk with a hundred sliders to get the perfect sound. Moving one slider at a time and listening would take all day. What you really want is a single instruction: "nudge these sliders up, those down, and this one a lot". In machine learning, that instruction is the **gradient**. And because models are built as chains of simple steps, a second tool, the **chain rule**, is what lets a computer work out the gradient for millions of sliders at once.',
    sections: [
      {
        heading: 'The problem: many dials, one goal',
        blocks: [
          { p: 'The previous chapter handled one input: one price, one weight. Real models have many. A house-price model might have a weight for area, one for bedrooms, one for age and one for location. A large neural network has billions. The error depends on all of them at the same time.' },
          { p: 'We need to answer, for every weight at once: if I nudge this one, how does the error change? And then combine those answers into one direction to move in. That combined direction is the gradient.' },
          { term: 'Multivariable function', def: 'A function with more than one input, such as error(m, b) or profit(price, advertising). Its graph is a surface (like a landscape) rather than a curve.' },
          { term: 'Parameter', def: 'A number inside a model that training adjusts, such as a weight or an intercept. The error of the model is a function of all its parameters.' },
          { p: 'Picture the error as a landscape. East–west is one parameter, north–south another, and height is the error. Training means finding the lowest valley. The gradient is the compass needle that says which way is steepest uphill, so you know to walk the opposite way.' },
        ],
      },
      {
        heading: 'Building the intuition: the foggy hillside',
        blocks: [
          { p: 'You are on a hillside in thick fog and want the steepest way up. You cannot see, but you can test the ground with your feet.' },
          { steps: [
            '**Test east–west:** take a tiny step east. The ground rises by 2 cm. That is the slope in the east direction.',
            '**Test north–south:** take a tiny step north. The ground rises by 12 cm. That is the slope in the north direction.',
            '**Combine the two:** the steepest way up is mostly north, a little east: the arrow (2, 12). That arrow is the gradient.',
            '**To descend**, walk the opposite way: (−2, −12), mostly south.',
          ], title: 'Finding the steepest direction by feel' },
          { term: 'Partial derivative', def: 'The slope of a multivariable function along one input only, holding all the other inputs fixed. Written ∂f/∂x, read "partial f by partial x".' },
          { term: 'Gradient', def: 'The list (vector) of all the partial derivatives of a function. It points in the direction of steepest increase, and its length says how steep that is. Written ∇f, read "grad f" or "nabla f".' },
          { p: 'The second idea, the **chain rule**, comes from a different everyday situation: chains of rates. If a car covers 40 km per hour, uses 1 litre per 15 km, and fuel costs ₹100 per litre, then fuel spending rises at 40 × (1/15) × 100 ≈ ₹267 per hour. You multiplied the rates along the chain. That is all the chain rule says.' },
          { think: { q: 'The gradient at your position is (0, 0). What does the ground feel like?', a: 'Flat in every direction. You are at a minimum, a maximum or a saddle point. In training, a gradient near zero means the parameters have stopped changing much; hopefully because you have reached a valley.' } },
        ],
      },
      {
        heading: 'How it works, step by step',
        blocks: [
          { steps: [
            '**List the inputs** you care about (for training: every parameter).',
            '**For each input, take the partial derivative:** treat every other input as a fixed number and differentiate as in the previous chapter.',
            '**Stack the partial derivatives** into a vector. That is the gradient.',
            '**Evaluate it at your current point** by plugging in the current values.',
            '**Read it:** each entry says how strongly, and in which direction, that input affects the output right now.',
          ], title: 'Computing a gradient' },
          { p: 'When the function is a chain of steps (input → step 1 → step 2 → output), work out the slope of each step and multiply them, starting from the output end. Neural networks are long chains, and doing this efficiently from the end backwards is called **back-propagation**.' },
          { term: 'Chain rule', def: 'The rule for differentiating a function inside a function: multiply the slope of the outer step by the slope of the inner step. If y depends on u and u depends on x, then dy/dx = (dy/du) × (du/dx).' },
          { term: 'Back-propagation', def: 'The algorithm that applies the chain rule backwards through a neural network, reusing intermediate results, to get the gradient for every weight in one sweep.' },
          { diagram: { kind: 'flow', nodes: ['**Input x**, weight w', '**z = w·x + b** (weighted sum)', '**a = σ(z)** (squash to 0–1)', '**L = (a − y)²** (loss)', '**Backwards:** ∂L/∂w = ∂L/∂a · ∂a/∂z · ∂z/∂w'], caption: 'A single artificial neuron as a chain. The forward pass computes the loss left to right; the chain rule multiplies local slopes right to left to find how the loss depends on the weight.' } },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { tex: '\\nabla f(x_1, \\dots, x_n) = \\left( \\frac{\\partial f}{\\partial x_1}, \\; \\frac{\\partial f}{\\partial x_2}, \\; \\dots, \\; \\frac{\\partial f}{\\partial x_n} \\right)', plain: 'The gradient is the vector of slopes, one per input. Entry i answers: "if I nudge input i alone, how fast does f change?"', symbols: [['\\nabla f', 'the gradient of f'], ['\\partial f / \\partial x_i', 'partial derivative of f with respect to input i']] },
          { p: 'Why does this list of separate slopes point in the steepest direction overall? Close to any point, a smooth surface looks like a tilted flat plane. On a tilted plane, the change for a small step d is simply the dot product ∇f · d. A dot product is largest when the step points the same way as ∇f (the previous chapters showed this). So the gradient direction is steepest uphill, and −∇f is steepest downhill.' },
          { tex: '\\frac{dy}{dx} = \\frac{dy}{du} \\cdot \\frac{du}{dx}', plain: 'Chain rule: the overall rate of change is the product of the rates along the chain. Small change in x causes a change in u, which causes a change in y.', symbols: [['u', 'an intermediate quantity between x and y']] },
          { p: 'A classic trap: for y = (3x + 1)², it is tempting to write dy/dx = 2(3x + 1). That forgets the inner step. The outer step (squaring) has slope 2u with u = 3x + 1, and the inner step has slope 3. Multiply: 2(3x + 1) × 3 = 6(3x + 1).' },
          { p: 'For model training, the most important gradient is that of mean squared error. For a straight-line model ŷ = m·x + b on n data points:' },
          { tex: '\\frac{\\partial L}{\\partial m} = -\\frac{2}{n} \\sum_{i=1}^{n} x_i (y_i - \\hat{y}_i), \\qquad \\frac{\\partial L}{\\partial b} = -\\frac{2}{n} \\sum_{i=1}^{n} (y_i - \\hat{y}_i)', plain: 'The slope for each parameter is built from the errors (y − ŷ). The slope for m weights each error by its x value, because m\'s influence on a prediction is proportional to x. Both come from the chain rule applied to the square.', symbols: [['L', 'mean squared error loss'], ['y_i', 'actual value for point i'], ['\\hat{y}_i', 'predicted value m x_i + b'], ['n', 'number of data points']] },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'A gradient on a two-parameter bowl', setup: 'f(m, b) = m² + 3b². Find the gradient at (m, b) = (1, 2).', steps: [
            '∂f/∂m: treat b as a constant. The 3b² term has slope 0; m² has slope 2m. So ∂f/∂m = 2m.',
            '∂f/∂b: treat m as a constant. ∂f/∂b = 6b.',
            'At (1, 2): ∇f = (2 × 1, 6 × 2) = (2, 12).',
            'Steepness = length of the gradient = √(2² + 12²) = √148 ≈ 12.17.',
          ], result: 'Steepest descent direction is (−2, −12): change b much more than m, because the bowl is six times steeper in the b direction near this point.' } },
          { diagram: { kind: 'curve', fn: 'x*x+12', fn2: '1+3*x*x', xMin: -0.5, xMax: 2.5, marks: [{ x: 1, label: 'm = 1' }, { x: 2, label: 'b = 2' }], xLabel: 'value of the one input being changed', yLabel: 'f', legend: ['vary m, hold b = 2', 'vary b, hold m = 1'], caption: 'Two slices through the surface f(m, b) = m² + 3b². A partial derivative is the slope of a slice: the first curve has slope 2 at m = 1, the second has slope 12 at b = 2. Together they make the gradient (2, 12).' } },
          { example: { title: 'The chain rule on fuel costs (business)', setup: 'A delivery van drives at 40 km per hour, does 15 km per litre, and diesel costs ₹100 per litre. How fast does fuel spending grow per hour of driving?', steps: [
            'Distance per hour: dd/dt = 40 km per hour.',
            'Litres per km: dL/dd = 1/15 litre per km.',
            'Rupees per litre: dC/dL = ₹100 per litre.',
            'Chain rule: dC/dt = 100 × (1/15) × 40 = 4,000 / 15 ≈ ₹266.67 per hour.',
          ], result: 'About ₹267 of fuel per hour of driving. Each link is a simple rate; the chain rule multiplies them. Back-propagation does the same along the layers of a network.' } },
          { example: { title: 'The gradient of a real model\'s error', setup: 'Advertising spend x (₹ lakh) = [1, 2, 3] and sales y (₹ lakh) = [3, 5, 7]. The model ŷ = m·x + b starts at m = 0, b = 0, so every prediction is 0.', steps: [
            'Errors y − ŷ = [3, 5, 7]. Loss L = (9 + 25 + 49) / 3 = 83 / 3 ≈ 27.67.',
            '∂L/∂m = −(2/3) × (1 × 3 + 2 × 5 + 3 × 7) = −(2/3) × 34 ≈ −22.67.',
            '∂L/∂b = −(2/3) × (3 + 5 + 7) = −(2/3) × 15 = −10.',
            'Gradient = (−22.67, −10). Both entries are negative, so increasing m and b lowers the loss, m more strongly.',
          ], result: 'The gradient says "raise the slope a lot, raise the intercept somewhat". The next chapter takes steps in that direction and lands near the true line ŷ = 2x + 1.' } },
          { example: { title: 'Back-propagation through one neuron', setup: 'Input x = 2, weight w = 0.5, bias b = 0, target y = 1. The neuron computes z = w·x + b, then a = σ(z) = 1/(1 + e⁻ᶻ), then loss L = (a − y)².', steps: [
            'Forward: z = 0.5 × 2 + 0 = 1. a = σ(1) ≈ 0.7311. L = (0.7311 − 1)² ≈ 0.0723.',
            'Backward, step 1: ∂L/∂a = 2(a − y) ≈ 2 × (−0.2689) ≈ −0.5379.',
            'Step 2: ∂a/∂z = σ(z)(1 − σ(z)) ≈ 0.7311 × 0.2689 ≈ 0.1966.',
            'Step 3: ∂z/∂w = x = 2.',
            'Multiply: ∂L/∂w ≈ −0.5379 × 0.1966 × 2 ≈ −0.2115. A numerical nudge test gives the same value.',
          ], result: 'The negative sign says "increase w to reduce the loss". A network with millions of weights repeats exactly this multiplication of local slopes, layer by layer.' } },
        ],
      },
      {
        heading: 'Reading a gradient',
        blocks: [
          { bullets: [
            '**Sign of an entry:** positive means increasing that parameter increases the loss; negative means increasing it reduces the loss.',
            '**Size of an entry:** how sensitive the loss is to that parameter right now. Large entries get large updates in gradient descent.',
            '**Length of the whole vector:** overall steepness. It shrinks as you approach a minimum, which is a useful sign of convergence.',
            '**Very unequal entries:** the landscape is a long narrow valley, often because features are on different scales. Standardising features evens this out.',
          ] },
          { diagram: { kind: 'table', head: ['Point (m, b)', '∂f/∂m = 2m', '∂f/∂b = 6b', 'Steepest descent'], rows: [['(1, 2)', '2', '12', '(−2, −12)'], ['(3, 0)', '6', '0', '(−6, 0)'], ['(−1, −1)', '−2', '−6', '(2, 6)'], ['(0, 0)', '0', '0', 'none: at the minimum']], caption: 'The gradient of f(m, b) = m² + 3b² at four points. It always points away from the bottom at (0, 0), and it vanishes exactly there.' } },
          { callout: 'Modern libraries never ask you to derive gradients. PyTorch\'s `loss.backward()` runs back-propagation automatically. Your job is to understand what the numbers mean, so you can spot exploding or vanishing gradients when training goes wrong.', tone: 'tip' },
        ],
      },
      {
        heading: 'In the real world',
        blocks: [
          { case: { title: 'Back-propagation and the deep-learning boom', story: 'Back-propagation was popularised for neural networks by Rumelhart, Hinton and Williams in a well-known 1986 paper. It turned the chain rule into an efficient recipe: one forward pass to compute the loss, one backward pass to get the gradient for every weight, at roughly the cost of a couple of forward passes. Combined with graphics cards and large datasets, this is what made training today\'s image, speech and language models practical. Every time a large language model is trained, the chain rule is applied across billions of parameters, again and again.' } },
          { bullets: [
            '**Marketing mix models:** partial derivatives of sales with respect to each channel\'s spend give the marginal return of TV, digital and print.',
            '**Pricing:** cross-price effects (how one product\'s sales respond to another\'s price) are partial derivatives.',
            '**Engineering design:** gradients of weight or drag with respect to many design dimensions guide optimisation of car parts.',
            '**Explainability:** "saliency maps" show which pixels or words a model\'s output is most sensitive to by looking at gradients with respect to the input.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Moving with the gradient instead of against it** when minimising. Uphill is +∇; downhill is −∇.',
            '**Forgetting the inner derivative** in the chain rule, the single most common hand-calculation error.',
            '**Vanishing gradients:** multiplying many small slopes (such as sigmoid slopes below 0.25) through deep chains gives almost zero, so early layers stop learning. ReLU activations and careful initialisation help.',
            '**Exploding gradients:** multiplying many large slopes gives enormous updates. Gradient clipping caps their size.',
            '**Non-smooth functions:** corners (like |x|) have no single slope; libraries use subgradients.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'Ordinary derivative', items: ['One input', 'One number: the slope', 'Curve on a 2D chart', 'df/dx'] }, right: { title: 'Gradient', items: ['Many inputs', 'A vector of slopes', 'Surface or landscape', '∇f = (∂f/∂x₁, …, ∂f/∂xₙ)'] }, caption: 'A gradient is just many derivatives side by side, one per input, read together as a direction.' } },
        ],
      },
    ],
    faq: [
      { q: 'Why is the symbol ∂ different from d?', a: 'The curly ∂ signals a partial derivative: other inputs are being held fixed. With only one input, d and ∂ mean the same thing.' },
      { q: 'Is the gradient a number or a vector?', a: 'A vector, with one entry per input. For a function of one input it reduces to a single number, the ordinary derivative.' },
      { q: 'Why does the gradient point uphill rather than downhill?', a: 'By definition each entry is the rate of increase. Optimisers that minimise loss simply move in the opposite direction, −∇.' },
      { q: 'Do I need to do back-propagation by hand?', a: 'No. Frameworks compute it automatically. Doing one small example by hand, like the single neuron above, is the best way to understand what `backward()` does.' },
      { q: 'What is a Jacobian or a Hessian?', a: 'The Jacobian collects gradients when there are several outputs. The Hessian is the matrix of second derivatives, describing curvature. Second-order optimisers use it; most deep learning avoids it because it is huge.' },
      { q: 'How can I check a gradient I derived?', a: 'Compare with a numerical estimate: nudge each input by a tiny h (say 0.000001), measure the change in the function, and divide by h. If the two agree to several decimal places, your formula is right.' },
    ],
  },

  'gradient-descent': {
    minutes: 15,
    hook: 'Blindfold someone on a hillside and ask them to reach the valley floor. A sensible strategy: feel the slope under your feet, take a step downhill, feel again, step again. You never see the valley, yet you get there. That is **gradient descent**, and it is arguably the most important algorithm in machine learning. It trains logistic regression, gradient-boosted trees, and every neural network up to today\'s largest language models.',
    sections: [
      {
        heading: 'The problem: finding the best parameters when algebra runs out',
        blocks: [
          { p: 'Every model has parameters and a loss that measures how wrong it is. Training means finding the parameter values that make the loss as small as possible. For simple linear regression there is a direct formula. For almost everything else, such as logistic regression, neural networks and models with millions of parameters, no formula exists, or it is far too slow to compute.' },
          { p: 'So we search. Start somewhere, improve a little, repeat. The previous two chapters gave us the compass: the gradient points uphill, so its negative points downhill. Gradient descent is the walking strategy.' },
          { term: 'Optimisation', def: 'Finding the inputs that make a function as small (or as large) as possible. In ML, minimising the loss over the model\'s parameters.' },
          { term: 'Learning rate', def: 'The step size in gradient descent, usually written α (alpha) or `lr`. It multiplies the gradient to decide how far to move each step. Choosing it well is the most important practical skill with this algorithm.' },
          { diagram: { kind: 'curve', fn: '(x-3)*(x-3)', xMin: -0.5, xMax: 6.5, marks: [{ x: 0, label: 'start' }, { x: 1.5, label: 'step 1' }, { x: 2.25, label: 'step 2' }, { x: 2.625, label: 'step 3' }], xLabel: 'weight w', yLabel: 'loss L(w)', caption: 'Gradient descent on L(w) = (w − 3)² with learning rate 0.25. Steps are large where the curve is steep and shrink automatically as the slope flattens near the bottom at w = 3.' } },
        ],
      },
      {
        heading: 'Building the intuition: the blindfolded walker',
        blocks: [
          { steps: [
            '**Feel the slope.** With your feet, sense which way the ground tilts and how steeply. (Compute the gradient.)',
            '**Step downhill.** Move in the downhill direction, taking a bigger step when the slope is steep and a smaller one when it is gentle. (Subtract learning rate × gradient.)',
            '**Repeat.** Feel again from your new spot.',
            '**Stop** when the ground feels flat or you are barely moving. (Gradient near zero, or loss no longer improving.)',
          ], title: 'The walker\'s routine' },
          { p: 'Notice what the walker controls: **stride length**. Tiny strides are safe but take forever. Huge strides can carry you clean over the valley and up the opposite slope, possibly higher than where you started. A good stride is big enough to make progress and small enough not to overshoot.' },
          { term: 'Iteration', def: 'One round of the loop: compute the gradient, update the parameters. Also called a step. Training typically runs thousands to millions of iterations.' },
          { term: 'Convergence', def: 'When the parameters stop changing meaningfully and the loss stops falling. The algorithm has settled at (or very near) a minimum.' },
          { think: { q: 'Why does the walker take smaller steps automatically near the bottom, even with a fixed learning rate?', a: 'Because the step is learning rate × gradient, and the gradient shrinks as the ground flattens. Near the minimum the slope approaches zero, so the steps approach zero too. That is why gradient descent settles rather than circling forever (when the learning rate is sensible).' } },
        ],
      },
      {
        heading: 'How it works, step by step',
        blocks: [
          { diagram: { kind: 'flow', nodes: ['**Initialise** parameters (zeros or small random values)', '**Predict** and compute the loss', '**Gradient**: slope of the loss for every parameter', '**Update**: θ ← θ − α · gradient', '**Converged?** No → repeat. Yes → stop'], caption: 'The gradient descent loop. Steps 2 to 4 repeat until the loss stops improving or a step limit is reached.' } },
          { steps: [
            '**Initialise.** Pick starting values. For linear models zeros work; neural networks need small random values so that different neurons learn different things.',
            '**Forward pass.** Use the current parameters to predict, and compute the loss on the data.',
            '**Backward pass.** Compute the gradient of the loss with respect to each parameter (by formula or back-propagation).',
            '**Update.** Move every parameter a little against its gradient entry.',
            '**Monitor.** Record the loss. Plotting it against iteration, the loss curve, is the main health check.',
            '**Stop** after a fixed number of steps, when improvement falls below a tolerance, or when a validation score stops improving (early stopping).',
          ], title: 'The algorithm' },
          { term: 'Epoch', def: 'One full pass through the entire training dataset. With mini-batches of 100 rows and 10,000 rows of data, one epoch is 100 iterations.' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { tex: '\\theta_{\\text{new}} = \\theta_{\\text{old}} - \\alpha \\, \\nabla L(\\theta_{\\text{old}})', plain: 'New parameters = old parameters minus learning rate times the gradient of the loss at the old parameters. The minus sign is what makes it descent.', symbols: [['\\theta', 'the vector of all parameters (theta)'], ['\\alpha', 'learning rate (step size)'], ['\\nabla L', 'gradient of the loss']] },
          { p: 'Each piece has a job. The **gradient** supplies the direction and the relative sizes: parameters that matter more right now move more. The **learning rate** turns that into an actual distance. The **minus sign** flips uphill into downhill.' },
          { p: 'Why is the step guaranteed to help when it is small enough? Close to the current point the loss surface is nearly a flat tilted plane, and on that plane moving against the gradient is the fastest way down. A large step leaves the region where the plane is a good approximation, which is exactly when overshooting starts.' },
          { p: 'For the simple bowl L(w) = (w − 3)², the gradient is 2(w − 3), and the update can be rewritten to show the distance to the minimum after each step:' },
          { tex: 'w_{\\text{new}} - 3 = (1 - 2\\alpha)\\,(w_{\\text{old}} - 3)', plain: 'Each step multiplies the remaining gap by (1 − 2α). With α = 0.25 the gap halves every step. With α = 1 it flips sign but keeps its size, so the walker bounces for ever. With α above 1 the gap grows: divergence.', symbols: [['1 - 2\\alpha', 'the factor the gap is multiplied by each step']] },
          { callout: 'Read that formula as a rule of thumb for any problem: there is a band of learning rates that converge, a slower band below it, and a cliff above it where training blows up. Real loss surfaces are not perfect bowls, so you find the band by experiment.', tone: 'key' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Three good steps on a bowl', setup: 'L(w) = (w − 3)², gradient 2(w − 3), start w = 0, learning rate α = 0.25.', steps: [
            'Step 1: gradient = 2 × (0 − 3) = −6. w = 0 − 0.25 × (−6) = 1.5. Loss falls from 9 to 2.25.',
            'Step 2: gradient = 2 × (1.5 − 3) = −3. w = 1.5 + 0.75 = 2.25. Loss 0.5625.',
            'Step 3: gradient = −1.5. w = 2.25 + 0.375 = 2.625. Loss ≈ 0.1406.',
            'Each step halves the gap to 3 (3 → 1.5 → 0.75 → 0.375), exactly as (1 − 2α) = 0.5 predicts.',
          ], result: 'w heads smoothly to 3 and the loss falls by a factor of 4 each step. After 10 steps the gap is under 0.003.' } },
          { example: { title: 'Too small, too big, just right', setup: 'Same bowl, same start w = 0. Compare four steps with α = 0.01, α = 1.0 and α = 1.1.', steps: [
            'α = 0.01: w = 0 → 0.06 → 0.1188 → 0.1764 → 0.2329. Safe but painfully slow: after four steps it has covered under 8% of the distance.',
            'α = 1.0: w = 0 → 6 → 0 → 6 → 0. The walker leaps across the valley and back for ever, never improving.',
            'α = 1.1: w = 0 → 6.6 → −1.32 → 8.184 → −3.2208. Each jump overshoots further; the gap grows by 1.2 times per step. Divergence.',
          ], result: 'On this bowl, any α between 0 and 1 converges and α = 0.5 lands on the minimum in one step. On real problems you test a few values (such as 0.001, 0.01, 0.1) and watch the loss curve.' } },
          { example: { title: 'Fitting a sales line (business)', setup: 'Advertising x (₹ lakh) = [1, 2, 3], sales y (₹ lakh) = [3, 5, 7]. Model ŷ = m·x + b, start m = b = 0, learning rate 0.05. The previous chapter found the starting gradient (−22.67, −10) and loss 27.67.', steps: [
            'Step 1: m = 0 − 0.05 × (−22.67) ≈ 1.133; b = 0 − 0.05 × (−10) = 0.5. Loss ≈ 5.49.',
            'Step 2: m ≈ 1.638, b ≈ 0.723. Loss ≈ 1.09.',
            'Step 3: m ≈ 1.862, b ≈ 0.823. Loss ≈ 0.217.',
            'Step 4: m ≈ 1.962, b ≈ 0.869. Loss ≈ 0.044.',
            'After about 500 steps: m ≈ 2.000, b ≈ 1.000, loss essentially 0.',
          ], result: 'Gradient descent discovers sales ≈ 2 × advertising + 1: each extra ₹1 lakh of advertising goes with about ₹2 lakh of sales in this toy data. The loss fell 99.8% in the first four steps; the remaining steps polish the intercept.' } },
          { diagram: { kind: 'bars', labels: ['start', 'step 1', 'step 2', 'step 3', 'step 4'], values: [27.67, 5.49, 1.09, 0.22, 0.04], highlight: 1, yLabel: 'mean squared error', caption: 'The loss curve for the sales example. A healthy curve falls fast at first and then flattens. A curve that rises or zig-zags upwards means the learning rate is too high.' } },
        ],
      },
      {
        heading: 'Variants: batch, stochastic, mini-batch and Adam',
        blocks: [
          { p: 'Computing the exact gradient needs every row of data. With millions of rows, that is expensive for a single step. The variants differ in how much data they use per step.' },
          { diagram: { kind: 'table', head: ['Variant', 'Rows per step', 'Strength', 'Weakness'], rows: [['Batch GD', 'all', 'smooth, exact gradient', 'slow per step on big data'], ['Stochastic (SGD)', '1', 'very cheap steps, can escape shallow traps', 'noisy, jittery path'], ['Mini-batch', 'e.g. 32–512', 'fast on GPUs, moderately smooth', 'one more setting (batch size)'], ['Momentum', 'any', 'builds speed in consistent directions', 'can overshoot'], ['Adam', 'any', 'adapts step size per parameter', 'may generalise slightly worse in some tasks']], caption: 'Mini-batch with Adam is the default in deep learning. scikit-learn\'s SGDClassifier and SGDRegressor use stochastic updates.' } },
          { bullets: [
            '**Momentum** keeps a running average of past gradients, like a ball rolling downhill that keeps its speed through small bumps.',
            '**Adam** combines momentum with a per-parameter step size, so rarely-updated parameters still move. Its default learning rate of 0.001 works surprisingly often.',
            '**Learning-rate schedules** start larger and shrink over time: fast early progress, careful final approach.',
          ] },
        ],
      },
      {
        heading: 'In the real world',
        blocks: [
          { case: { title: 'Demand forecasting with millions of rows (illustrative)', story: 'A retailer predicts daily demand for 20,000 products across 800 stores. Fitting a regression with the closed-form formula would need the whole multi-gigabyte dataset in memory at once. Instead the team trains with mini-batch stochastic gradient descent: it streams batches of 1,024 rows, updates the weights after each batch, and passes over the data a few times. They standardise every feature first, because before scaling the loss curve zig-zagged for hours: promotional spend in lakhs and a 0/1 holiday flag made the loss landscape a long, narrow valley.' } },
          { bullets: [
            '**Logistic regression** in scikit-learn is fitted with gradient-based solvers such as `lbfgs`, a smarter relative of gradient descent.',
            '**Gradient boosting** (XGBoost, LightGBM) applies the gradient idea in "function space": each new tree is fitted to the negative gradient of the loss.',
            '**Neural networks and LLMs** are trained with mini-batch gradient descent, usually Adam or a variant.',
            '**Recommender systems** learn user and product vectors by SGD on millions of ratings.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Learning rate too high:** the loss rises or explodes (shows as `nan`). Divide the learning rate by 10.',
            '**Learning rate too low:** the loss falls in a straight, slow line. Try 3–10 times larger.',
            '**Unscaled features:** long narrow valleys cause zig-zagging. Standardise features first.',
            '**Local minima and saddle points:** on non-convex surfaces you can get stuck. Random restarts, momentum and the noise in SGD help.',
            '**Stopping too early on a plateau,** or too late and overfitting: use a validation set and early stopping.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'Gradient descent', items: ['Works for any differentiable loss', 'Scales to billions of parameters', 'Streams data in batches', 'Needs a learning rate and monitoring'] }, right: { title: 'Closed-form / other solvers', items: ['Exact answer for linear regression', 'No learning rate to tune', 'Needs all data in memory', 'Impractical for neural networks'] }, caption: 'For small linear problems a direct solver is simpler. For large or non-linear models, gradient descent is the only practical option.' } },
          { term: 'Convex function', def: 'A bowl-shaped function with a single valley and no other dips. Gradient descent with a sensible learning rate is guaranteed to reach its minimum. Linear and logistic regression losses are convex; neural-network losses are not.' },
        ],
      },
    ],
    faq: [
      { q: 'How do I choose the learning rate?', a: 'Try a few values spaced by factors of 10 (0.1, 0.01, 0.001) and plot the loss curves. Pick the largest that decreases smoothly. With Adam, start at 0.001.' },
      { q: 'Does gradient descent always find the best answer?', a: 'For convex losses (linear and logistic regression) it reaches the global minimum with a suitable learning rate. For neural networks it finds a good low point, not necessarily the lowest, which in practice is usually good enough.' },
      { q: 'What is the difference between an epoch and an iteration?', a: 'An iteration is one parameter update. An epoch is one full pass over the training data, which may contain many iterations when you use mini-batches.' },
      { q: 'Why scale features before gradient descent?', a: 'With very different scales, the loss surface becomes a stretched valley: steep in one direction, flat in another. One learning rate cannot suit both, so steps zig-zag. Standardised features make the valley rounder and convergence much faster.' },
      { q: 'Is SGD worse than batch gradient descent because it is noisy?', a: 'Not necessarily. Its steps are far cheaper, so it makes more progress per second on big data, and the noise can help it escape shallow local minima. Mini-batches are a compromise between the two.' },
      { q: 'My loss became nan. What happened?', a: 'Almost always the updates blew up: the learning rate is too high, inputs are unscaled, or a log of zero appeared in the loss. Lower the learning rate, scale inputs, and check the data for extreme values.' },
    ],
  },
  probability: {
    minutes: 15,
    hook: 'A bank\'s fraud system flags your card payment. The system is "90% accurate", so surely there is a 90% chance it is fraud? In a typical setting the real answer is closer to 15%. That gap between what feels right and what is right is why probability matters. Every classifier outputs probabilities, every A/B test is a probability statement, and every risk model prices uncertainty. This chapter builds the rules from scratch, slowly, with pictures and counts instead of jargon.',
    sections: [
      {
        heading: 'The problem: deciding under uncertainty',
        blocks: [
          { p: 'Business decisions rarely come with certainty. Will this customer churn? Will this machine fail this month? Will the new pricing lift sales? We cannot know for sure, but we can **measure how likely** each outcome is and make decisions that come out ahead on average.' },
          { p: 'Probability is the language for that measurement. Machine learning speaks it everywhere: a logistic regression says "73% chance of churn", a spam filter combines word probabilities, and a forecast comes with an interval because tomorrow is uncertain.' },
          { term: 'Experiment', def: 'Any process with an uncertain result: rolling a die, a customer visiting a website, a part coming off a production line.' },
          { term: 'Outcome and sample space', def: 'An outcome is one possible result (the die shows 4). The sample space is the list of all possible outcomes ({1, 2, 3, 4, 5, 6}).' },
          { term: 'Event', def: 'A collection of outcomes you care about, such as "the die shows an even number" = {2, 4, 6}, or "the customer buys something".' },
          { term: 'Probability', def: 'A number between 0 and 1 measuring how likely an event is. 0 = impossible, 1 = certain, 0.25 = happens about one time in four in the long run.' },
        ],
      },
      {
        heading: 'Building the intuition: a budget of belief',
        blocks: [
          { p: 'Think of probability as a budget of 100% that you must spread across everything that could happen. You cannot spend more than 100% and you must spend all of it. A fair die gets 1/6 of the budget on each face. A weather forecaster might put 70% on "rain" and 30% on "no rain".' },
          { steps: [
            '**Count when outcomes are equally likely.** The chance of an even number on a fair die is 3 favourable faces out of 6 = 1/2.',
            '**Use long-run frequencies otherwise.** If 2 out of every 100 parts are defective over a long period, the probability a new part is defective is about 0.02.',
            '**Shrink the world for conditional questions.** "What is the chance of rain, given dark clouds?" means: look only at days with dark clouds and ask what share of those had rain.',
            '**Check your total.** All the probabilities for the full set of outcomes must add to exactly 1.',
          ], title: 'Three ways to get a probability, and one check' },
          { p: 'The most useful trick for beginners is to replace probabilities with **counts of an imaginary crowd**. Instead of "1% of transactions are fraud", imagine 10,000 transactions, of which 100 are fraud. Counts are much harder to get wrong than percentages, as the worked examples will show.' },
          { think: { q: 'A weather app says 30% chance of rain tomorrow. It does not rain. Was the app wrong?', a: 'Not necessarily. A 30% forecast means that on many days like this one, about 3 in 10 have rain. You judge a probability forecast by its long-run calibration: among all the "30%" days, did it rain on roughly 30% of them?' } },
        ],
      },
      {
        heading: 'How it works: the core rules',
        blocks: [
          { steps: [
            '**Complement:** P(not A) = 1 − P(A). If 2% of parts are defective, 98% are fine.',
            '**"Or" (addition rule):** P(A or B) = P(A) + P(B) − P(A and B). Subtract the overlap so you do not count it twice.',
            '**Conditional:** P(A | B) = P(A and B) / P(B). Restrict to cases where B happened, and ask how many of those also have A.',
            '**"And" (multiplication rule):** P(A and B) = P(B) × P(A | B). If A and B are independent, this becomes P(A) × P(B).',
            '**Expected value:** add up each outcome × its probability to get the long-run average.',
          ], title: 'Five rules that cover most of practice' },
          { term: 'Conditional probability', def: 'The probability of A given that B is known to have happened, written P(A | B). The vertical bar reads "given".' },
          { term: 'Independence', def: 'Two events are independent if knowing one happened does not change the probability of the other: P(A | B) = P(A). Two separate coin flips are independent; "rain" and "umbrella sales" are not.' },
          { term: 'Expected value', def: 'The probability-weighted average of the possible outcomes: what you would get on average if you could repeat the situation many times.' },
          { diagram: { kind: 'tree', root: { label: '10,000 transactions', children: [
            { label: 'Fraud: 100', edge: '1%', children: [{ label: 'Flagged: 90', edge: '90%' }, { label: 'Missed: 10', edge: '10%' }] },
            { label: 'Legitimate: 9,900', edge: '99%', children: [{ label: 'Flagged: 495', edge: '5%' }, { label: 'Not flagged: 9,405', edge: '95%' }] },
          ] }, caption: 'A probability tree turned into counts. Multiply along branches to get joint counts. Of the 90 + 495 = 585 flagged transactions, only 90 are fraud: about 15%.' } },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { tex: 'P(A) = \\frac{\\text{number of outcomes in } A}{\\text{total number of outcomes}}', plain: 'When all outcomes are equally likely, probability is counting: favourable cases over all cases.', symbols: [['P(A)', 'probability of event A']] },
          { tex: 'P(A \\cup B) = P(A) + P(B) - P(A \\cap B)', plain: 'Probability of A or B (or both) = add the two, then subtract the overlap, which would otherwise be counted twice.', symbols: [['A \\cup B', 'A or B (union)'], ['A \\cap B', 'A and B (intersection)']] },
          { tex: 'P(A \\mid B) = \\frac{P(A \\cap B)}{P(B)}', plain: 'Given B, the world shrinks to the B cases. Among them, the share where A also happens is the conditional probability.', symbols: [['P(A \\mid B)', 'probability of A given B']] },
          { p: 'Turn the conditional formula around and you get **Bayes\' theorem**, which lets you flip "probability of the evidence given the cause" into "probability of the cause given the evidence". This flip is exactly what the fraud question needs: we know P(flag | fraud) and want P(fraud | flag).' },
          { tex: 'P(A \\mid B) = \\frac{P(B \\mid A)\\, P(A)}{P(B)}', plain: 'Updated belief in A after seeing B = how well A explains B × how common A was to begin with, divided by how common B is overall.', symbols: [['P(A)', 'prior: belief before the evidence'], ['P(B \\mid A)', 'likelihood: chance of the evidence if A is true'], ['P(A \\mid B)', 'posterior: belief after the evidence']] },
          { tex: 'E[X] = \\sum_{\\text{outcomes } x} x \\cdot P(x)', plain: 'Expected value: multiply every possible result by its probability and add up.', symbols: [['E[X]', 'expected value (long-run average) of the quantity X']] },
          { callout: 'P(A | B) and P(B | A) are different numbers, often wildly different. P(flagged | fraud) = 90%, but P(fraud | flagged) ≈ 15%. Mixing them up is called the base-rate fallacy, and it is one of the most common mistakes in business analytics.', tone: 'warn' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Two dice: sums, "and" and "or"', setup: 'Roll two fair dice. There are 6 × 6 = 36 equally likely outcomes.', steps: [
            'P(sum = 7): the pairs (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) are 6 outcomes, so 6/36 = 1/6 ≈ 0.167. No other sum is as likely.',
            'P(both show 6): the dice are independent, so 1/6 × 1/6 = 1/36 ≈ 0.028.',
            'P(at least one 6) by the addition rule: 1/6 + 1/6 − 1/36 = 11/36 ≈ 0.306.',
            'Check with the complement: P(no 6 at all) = 5/6 × 5/6 = 25/36, so P(at least one 6) = 1 − 25/36 = 11/36.',
          ], result: 'Two routes give the same 11/36. Using the complement ("1 minus the chance of none") is often the easiest way to handle "at least one" questions.' } },
          { diagram: { kind: 'bars', labels: ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'], values: [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1], highlight: 5, yLabel: 'ways out of 36', caption: 'Number of ways to get each sum with two dice. Seven is most likely (6 of 36 ways); 2 and 12 are rarest (1 way each). The bars add up to 36, the full budget.' } },
          { example: { title: 'Is the fraud alert really fraud? (Bayes, business)', setup: 'Illustrative numbers: 1% of card transactions are fraud. The model flags 90% of fraud and wrongly flags 5% of legitimate transactions. A transaction is flagged. How likely is fraud?', steps: [
            'Imagine 10,000 transactions: 100 fraud, 9,900 legitimate.',
            'Flagged fraud: 90% of 100 = 90. Flagged legitimate: 5% of 9,900 = 495.',
            'Total flagged = 90 + 495 = 585.',
            'P(fraud | flagged) = 90 / 585 ≈ 0.154, about 15%.',
            'Same with Bayes\' formula: (0.9 × 0.01) / (0.9 × 0.01 + 0.05 × 0.99) = 0.009 / 0.0585 ≈ 0.154.',
          ], result: 'Roughly 85% of alerts are false alarms, because legitimate transactions vastly outnumber fraud. This is why fraud teams care about precision, and why a blocked card should trigger a quick check rather than an accusation.' } },
          { example: { title: 'Do tea and biscuits sell together? (independence)', setup: 'Of 1,000 shopping baskets, 400 contain tea, 300 contain biscuits and 180 contain both.', steps: [
            'P(tea) = 0.4, P(biscuits) = 0.3, P(both) = 0.18.',
            'If independent, P(both) would be 0.4 × 0.3 = 0.12. The actual 0.18 is higher, so they are not independent.',
            'P(biscuits | tea) = 0.18 / 0.4 = 0.45, compared with 0.30 for shoppers overall.',
            'Lift = 0.45 / 0.30 = 1.5: tea buyers are 1.5 times as likely to buy biscuits.',
          ], result: 'A strong association worth acting on: place biscuits near tea or bundle them. This is market-basket analysis in miniature.' } },
          { example: { title: 'Is the coupon worth sending? (expected value)', setup: 'Sending a coupon costs ₹50. 20% of customers redeem it and spend an extra ₹400; the rest change nothing.', steps: [
            'Expected extra spend = 0.2 × ₹400 + 0.8 × ₹0 = ₹80.',
            'Expected net = ₹80 − ₹50 = +₹30 per customer.',
          ], result: 'Positive expected value, so send it, provided the 20% redemption estimate is reliable. (Strictly you should compare margin, not spend, against cost.)' } },
        ],
      },
      {
        heading: 'Probability in machine learning',
        blocks: [
          { bullets: [
            '**Classifier outputs:** `predict_proba` in scikit-learn returns P(class | features). A threshold (often 0.5, but it should be chosen for the business cost) turns it into a decision.',
            '**Naive Bayes:** applies Bayes\' theorem with a simplifying independence assumption between features; still strong for text.',
            '**Calibration:** a model is calibrated if, among cases it scores 0.7, about 70% really are positive. Many models need calibrating before their probabilities can be trusted.',
            '**Evaluation:** precision is P(actually positive | predicted positive); recall is P(predicted positive | actually positive). They are the two directions of a conditional probability.',
            '**Expected cost:** choosing a threshold by multiplying error probabilities by their rupee costs is expected value applied to model deployment.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'P(flagged | fraud) = recall', items: ['Start from the fraud cases', 'Ask: how many did we catch?', '90% in the example', 'Matters for loss prevention'] }, right: { title: 'P(fraud | flagged) = precision', items: ['Start from the alerts', 'Ask: how many were real?', 'About 15% in the example', 'Matters for customer friction and staff time'] }, caption: 'The same two events, conditioned in opposite directions, give two different numbers. Classification metrics are built on this distinction.' } },
        ],
      },
      {
        heading: 'In the real world',
        blocks: [
          { case: { title: 'Insurance pricing as expected value', story: 'An insurer pricing motor cover estimates, for each type of driver, the probability of a claim in a year and the average claim size. The expected annual cost is roughly probability × severity. If 5% of a segment claim, with an average claim of ₹60,000, the expected cost is ₹3,000 per policy, and the premium adds expenses and margin on top. The numbers here are illustrative, but the logic of pricing risk as an expected value is how insurance has worked for centuries, and modern pricing models are machine-learning estimates of those two probabilities and amounts.' } },
          { bullets: [
            '**A/B testing:** "is the uplift real or chance?" is answered with probability models of random variation.',
            '**Predictive maintenance:** P(failure in the next 30 days | sensor readings) drives when to service a machine.',
            '**Credit risk:** probability of default × loss given default × exposure = expected loss, the core of loan pricing.',
            '**Demand planning:** stocking to cover demand with 95% probability rather than to the average.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls and limits',
        blocks: [
          { bullets: [
            '**Base-rate neglect:** forgetting how rare the event is. Rare events produce many false alarms even with good tests.',
            '**Assuming independence:** multiplying probabilities of linked events (failures of two parts sharing a power supply) badly underestimates joint risk.',
            '**Gambler\'s fallacy:** after five reds, black is not "due". Independent events have no memory.',
            '**Small samples:** 3 defects in 20 parts does not reliably mean a 15% defect rate.',
            '**Correlation is not causation:** P(sales up | advert shown) being high does not prove the advert caused it; other factors may drive both.',
          ] },
          { callout: 'When in doubt, convert to counts of an imaginary crowd of 1,000 or 10,000. It turns confusing conditional probabilities into simple division.', tone: 'tip' },
        ],
      },
    ],
    faq: [
      { q: 'What is the difference between probability and odds?', a: 'Probability is favourable ÷ all; odds are favourable ÷ unfavourable. A probability of 0.2 is odds of 0.2/0.8 = 1 to 4. Logistic regression works with the logarithm of the odds.' },
      { q: 'What is the difference between "independent" and "mutually exclusive"?', a: 'Mutually exclusive events cannot happen together (a die shows 2 and 5). Independent events can happen together but do not influence each other. In fact, mutually exclusive events with non-zero probability are strongly dependent: if one happens, the other cannot.' },
      { q: 'Where do probabilities come from in practice?', a: 'From symmetry (fair dice), from historical frequencies (defect rates), or from models fitted to data (a classifier\'s output). Each source has its own risks: biased history, model errors.' },
      { q: 'Can the expected value be an outcome that never happens?', a: 'Yes. The expected value of a die roll is 3.5, which no roll ever gives. It is a long-run average, not a prediction of one result.' },
      { q: 'Why do I need Bayes\' theorem if I can just count?', a: 'Counting an imaginary crowd is Bayes\' theorem in disguise, and is a great way to do it. The formula becomes necessary when you update repeatedly or with many pieces of evidence, as spam filters and medical decision models do.' },
      { q: 'Is a 0.9 from a model a 90% probability?', a: 'Only if the model is calibrated. Many models (random forests, boosted trees, SVMs) produce scores that rank well but are not accurate probabilities. Check a calibration plot, and calibrate if needed.' },
    ],
  },

  'random-variables': {
    minutes: 16,
    hook: 'How many customers will walk into the store tomorrow? How long will the next delivery take? How many defective parts will this batch contain? None of these numbers is known in advance, yet each follows patterns you can describe. A **random variable** is the name for such a number decided by chance. Once you can describe its centre and its spread, you can set safety stock, promise delivery times and design quality limits with confidence instead of guesswork.',
    sections: [
      {
        heading: 'The problem: planning around numbers you cannot know yet',
        blocks: [
          { p: 'A warehouse manager must decide how much stock to hold. Tomorrow\'s demand is not a fixed number; it might be 80 units or 140. Holding too little loses sales; holding too much ties up cash. To decide well, she needs more than a single forecast. She needs to know **which values are likely, how likely, and how much they vary**.' },
          { p: 'The previous chapter assigned probabilities to events. This chapter attaches probabilities to **numbers**, so we can calculate averages, spreads and risks. That is the foundation of statistics and of every ML model that predicts a quantity with uncertainty.' },
          { term: 'Random variable', def: 'A number whose value is determined by the outcome of a chance process. Before the die is rolled, "the number it shows" is a random variable that can be 1 to 6. Usually written with a capital letter, such as X.' },
          { term: 'Distribution', def: 'The full description of a random variable: which values it can take and how likely each is. It is the random variable\'s "profile".' },
        ],
      },
      {
        heading: 'Building the intuition: the daily-orders diary',
        blocks: [
          { p: 'Picture a small online shop that writes down the number of orders every day for a year. Some days 0, many days 1, some days 2. Tally the diary and you get a frequency table. Divide by 365 and you have probabilities. That table **is** the distribution of the random variable "orders tomorrow".' },
          { steps: [
            '**List the possible values:** 0, 1 or 2 orders.',
            '**Attach a probability to each:** say 0.2, 0.5 and 0.3. They must add to 1.',
            '**Find the centre:** the long-run average number of orders per day (the mean).',
            '**Measure the spread:** how far a typical day lands from that average (the variance and standard deviation).',
          ], title: 'Describing a random variable in four moves' },
          { p: 'Two shops can have the same average and very different lives. One gets 10 orders every day without fail; another gets 0 most days and 50 on a few. Same mean, completely different risk. The spread is what captures that difference, which is why we never report a mean on its own.' },
          { term: 'Discrete random variable', def: 'One that takes separate, countable values: number of orders, defects or complaints. Its distribution is a list of probabilities, one per value (a probability mass function).' },
          { term: 'Continuous random variable', def: 'One that can take any value in a range: delivery time, temperature, weight. Individual exact values have zero probability; we ask about ranges instead, using a probability density curve.' },
          { think: { q: 'Is "monthly revenue in rupees" discrete or continuous?', a: 'Strictly discrete (it is counted in paise), but it has so many possible values that analysts treat it as continuous. The distinction is a modelling choice: use whichever description is simpler and accurate enough.' } },
        ],
      },
      {
        heading: 'How it works, step by step',
        blocks: [
          { diagram: { kind: 'flow', nodes: ['**Define** the quantity X (e.g. orders tomorrow)', '**List values** and their probabilities', '**Mean**: probability-weighted average', '**Variance / SD**: probability-weighted spread', '**Use** it: plan stock, set SLAs, price risk'], caption: 'From an uncertain quantity to numbers you can plan with. The same pipeline works for discrete and continuous variables; only sums become areas under a curve.' } },
          { steps: [
            '**Mean (expected value), μ:** multiply each value by its probability and add.',
            '**Variance, σ²:** for each value, take its distance from the mean, square it, multiply by its probability, and add.',
            '**Standard deviation, σ:** the square root of the variance, back in the original units (orders, minutes, rupees).',
            '**Probabilities of ranges:** add the probabilities of the values in the range (discrete) or find the area under the density curve (continuous).',
          ], title: 'The calculations' },
          { term: 'Variance', def: 'The average squared distance of a random variable from its mean. Squaring treats overs and unders alike and weights big misses heavily. Its units are squared (orders²), which is awkward to interpret.' },
          { term: 'Standard deviation', def: 'The square root of the variance, written σ (sigma). It is in the same units as the data and roughly describes a "typical" distance from the mean.' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { tex: '\\mu = E[X] = \\sum_{x} x \\, P(X = x)', plain: 'The mean is the probability-weighted average of the possible values. Values that are more likely pull the mean towards themselves more strongly.', symbols: [['\\mu', 'the mean (Greek mu)'], ['E[X]', 'expected value of X'], ['P(X = x)', 'probability that X takes the value x']] },
          { tex: '\\sigma^2 = \\operatorname{Var}(X) = \\sum_{x} (x - \\mu)^2 \\, P(X = x)', plain: 'Variance: for each value, how far from the mean (squared), weighted by how likely. A large variance means outcomes are often far from the average.', symbols: [['\\sigma^2', 'variance'], ['\\sigma', 'standard deviation, the square root of the variance']] },
          { p: 'Why square the distances rather than just averaging them? Because plain distances above and below the mean cancel out exactly and always average to zero. Squaring makes every distance count positively, and it gives tidy algebra, the same reason least squares uses squares.' },
          { p: 'Two rules make random variables easy to work with in business models. If profit is a straight-line function of a random quantity, you can transform the mean and the standard deviation directly, without redoing the whole distribution.' },
          { tex: 'E[aX + b] = a\\,E[X] + b, \\qquad \\operatorname{SD}(aX + b) = |a|\\,\\operatorname{SD}(X)', plain: 'Scaling by a scales the mean and the spread. Adding a fixed amount b shifts the mean but leaves the spread unchanged, because a fixed cost adds no uncertainty.', symbols: [['a, b', 'fixed numbers, e.g. profit per order and a fixed daily cost']] },
          { p: 'For continuous variables the sums become areas under a curve. The most famous curve is the **normal distribution**, the bell shape. Whatever its mean and standard deviation, about 68% of outcomes land within one standard deviation of the mean and about 95% within two.' },
          { tex: 'f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} \\, e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}', plain: 'The normal (bell-curve) density. You will never need to compute it by hand; what matters is that μ sets the centre and σ sets the width.', symbols: [['f(x)', 'probability density at x (height of the curve)'], ['e', 'the constant 2.718…']] },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Daily orders: mean, variance and SD', setup: 'Orders per day X: 0 with probability 0.2, 1 with 0.5, 2 with 0.3.', steps: [
            'Check: 0.2 + 0.5 + 0.3 = 1. A valid distribution.',
            'Mean μ = 0 × 0.2 + 1 × 0.5 + 2 × 0.3 = 0 + 0.5 + 0.6 = 1.1 orders.',
            'Variance = (0 − 1.1)² × 0.2 + (1 − 1.1)² × 0.5 + (2 − 1.1)² × 0.3 = 1.21 × 0.2 + 0.01 × 0.5 + 0.81 × 0.3 = 0.242 + 0.005 + 0.243 = 0.49.',
            'Standard deviation σ = √0.49 = 0.7 orders.',
            'If each order earns ₹200 and the day has a fixed cost of ₹100, profit = 200X − 100: mean ₹200 × 1.1 − ₹100 = ₹120, SD = ₹200 × 0.7 = ₹140.',
          ], result: 'On average 1.1 orders and ₹120 profit a day, but the SD of ₹140 is larger than the mean profit, so loss-making days are common (every zero-order day loses ₹100).' } },
          { diagram: { kind: 'bars', labels: ['0 orders', '1 order', '2 orders'], values: [0.2, 0.5, 0.3], highlight: 1, yLabel: 'probability', caption: 'The distribution of daily orders. The mean, 1.1, is not even a possible value; it is the balance point of these bars.' } },
          { example: { title: 'Same average, different risk (business)', setup: 'Two suppliers deliver in a random number of days. Supplier A: 4 or 6 days, each with probability 0.5. Supplier B: 2 or 8 days, each with probability 0.5.', steps: [
            'Mean A = 0.5 × 4 + 0.5 × 6 = 5 days. Mean B = 0.5 × 2 + 0.5 × 8 = 5 days.',
            'Variance A = 0.5 × (4 − 5)² + 0.5 × (6 − 5)² = 1, so SD = 1 day.',
            'Variance B = 0.5 × (2 − 5)² + 0.5 × (8 − 5)² = 9, so SD = 3 days.',
            'To be covered every time, you need stock for 6 days with A but 8 days with B.',
          ], result: 'Same 5-day average, but Supplier B forces you to hold two extra days of safety stock. Reliability (low variance) has a rupee value.' } },
          { example: { title: 'Sales calls and the binomial distribution', setup: 'A salesperson makes 10 calls a day, and each independently converts with probability 0.2. X = number of sales. This is a binomial random variable.', steps: [
            'Mean = n × p = 10 × 0.2 = 2 sales. Variance = n × p × (1 − p) = 10 × 0.2 × 0.8 = 1.6, so SD ≈ 1.26.',
            'P(X = 0) = 0.8¹⁰ ≈ 0.107: about one day in nine with no sale at all.',
            'P(at least one sale) = 1 − 0.107 ≈ 0.893.',
            'P(X ≤ 2) ≈ 0.107 + 0.268 + 0.302 = 0.678. P(X ≥ 4) ≈ 0.121.',
          ], result: 'A target of "4 sales a day" would be hit only about 12% of the time by an average performer. Managers who understand the distribution set fairer targets and do not mistake luck for skill.' } },
          { diagram: { kind: 'bars', labels: ['0', '1', '2', '3', '4', '5', '6+'], values: [0.1074, 0.2684, 0.302, 0.2013, 0.0881, 0.0264, 0.0064], highlight: 2, yLabel: 'probability', caption: 'Binomial distribution of daily sales (10 calls, 20% conversion). Two sales is most likely; zero sales happens about 11% of the time; six or more is very rare.' } },
          { example: { title: 'Delivery times and the normal curve', setup: 'Food delivery times are roughly normal with mean 30 minutes and SD 5 minutes.', steps: [
            'Within one SD (25 to 35 minutes): about 68% of deliveries.',
            'Within two SD (20 to 40 minutes): about 95%.',
            'Later than 40 minutes (more than two SD above): about 2.3%, roughly 1 delivery in 44.',
          ], result: 'Promising "within 40 minutes" would be broken about 2–3% of the time. To promise 35 minutes, expect about 16% of orders to be late.' } },
          { diagram: { kind: 'curve', fn: 'Math.exp(-((x-30)**2)/50)/(5*Math.sqrt(2*Math.PI))', xMin: 12, xMax: 48, shade: [25, 35], marks: [{ x: 30, label: 'mean 30' }, { x: 40, label: '+2 SD' }], xLabel: 'delivery time (minutes)', yLabel: 'density', caption: 'Normal distribution of delivery times. The shaded band, 25 to 35 minutes, holds about 68% of the area. Only a thin tail, about 2.3%, lies beyond 40 minutes.' } },
        ],
      },
      {
        heading: 'A field guide to common distributions',
        blocks: [
          { diagram: { kind: 'table', head: ['Distribution', 'Type', 'Typical use', 'Mean'], rows: [['Bernoulli', 'discrete', 'one yes/no event: click, churn', 'p'], ['Binomial', 'discrete', 'successes in n tries: sales from calls', 'n·p'], ['Poisson', 'discrete', 'counts per period: arrivals, defects', 'λ'], ['Uniform', 'continuous', 'every value in a range equally likely', '(a + b)/2'], ['Normal', 'continuous', 'measurements, errors, averages', 'μ'], ['Exponential', 'continuous', 'waiting time between events', '1/λ']], caption: 'Six distributions cover a large share of business modelling. Choosing one is a modelling assumption; always check it against data.' } },
          { callout: 'The normal distribution is popular partly because of the central limit theorem: averages and totals of many small independent effects tend to look normal, even when each effect does not. That is why sampling errors and many measurement errors are bell-shaped.', tone: 'key' },
        ],
      },
      {
        heading: 'In the real world',
        blocks: [
          { case: { title: 'Safety stock in retail replenishment', story: 'Supply-chain teams commonly set safety stock using the spread of demand rather than just its average. A textbook approach: if daily demand has mean 100 units and standard deviation 20, and the restocking lead time is 4 days, then lead-time demand has mean 400 and, assuming independent days, standard deviation 20 × √4 = 40. To cover demand with about 95% probability (one-sided, using a normal approximation), stock is set near 400 + 1.645 × 40 ≈ 466 units. The numbers are illustrative, but this formula, built entirely from means and standard deviations of random variables, underlies many inventory systems.' } },
          { bullets: [
            '**Regression with uncertainty:** a regression prediction is the mean of a random variable; prediction intervals use its standard deviation.',
            '**Quality control:** control charts flag a process when measurements fall more than 3 SD from the mean.',
            '**Finance:** daily returns are modelled as random variables; volatility is their standard deviation.',
            '**Call centres:** arrivals per hour are often modelled as Poisson to plan staffing.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Reporting only the mean:** two plans with the same average can carry very different risk. Always report spread too.',
            '**Treating the mean as the most likely value:** 1.1 orders is not even possible; for skewed variables like income, the mean sits far from the typical value.',
            '**Assuming normality everywhere:** demand spikes, insurance claims and web traffic have heavy tails, so extreme values are far more common than the bell curve suggests.',
            '**Assuming independence:** daily demands often move together (weather, festivals), which makes the √(days) rule understate risk.',
            '**Variance in squared units:** communicate standard deviation to stakeholders, not variance.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'Discrete random variable', items: ['Countable values: 0, 1, 2 …', 'Probability for each value', 'Sum to get means and ranges', 'Examples: orders, defects, clicks'] }, right: { title: 'Continuous random variable', items: ['Any value in a range', 'Density curve; exact values have probability 0', 'Area under the curve for ranges', 'Examples: time, weight, temperature'] }, caption: 'Two kinds of random variable, the same ideas of centre and spread. Sums for discrete become areas for continuous.' } },
        ],
      },
    ],
    faq: [
      { q: 'Why is it called a "variable" if it is a number?', a: 'Because its value varies from one occasion to the next, decided by chance. Once observed (today\'s orders were 2), it is a fixed number, called a realisation.' },
      { q: 'What is the difference between a distribution and a dataset?', a: 'A distribution is the theoretical pattern of all possible outcomes and their probabilities. A dataset is a finite sample drawn from it. Statistics uses datasets to estimate distributions.' },
      { q: 'Why can a continuous variable have probability zero for an exact value?', a: 'There are infinitely many possible values in any range, so the chance of hitting exactly 30.000000 minutes is zero. We ask about ranges instead, like 29.5 to 30.5 minutes, which have positive probability.' },
      { q: 'Should I use variance or standard deviation?', a: 'Use variance in calculations (variances of independent variables add) and standard deviation when communicating, because it is in the original units.' },
      { q: 'What is the difference between this mean and the average of my data?', a: 'The expected value μ belongs to the distribution; the sample average belongs to your data. With enough data, the sample average gets close to μ (the law of large numbers).' },
      { q: 'How do I know which distribution fits my data?', a: 'Start from what the variable is (a count, a time, a yes/no), plot a histogram, and compare with candidate shapes. Checks such as Q–Q plots help, but business sense about the process matters as much as any test.' },
    ],
  },
};
