import { DeepLesson } from './types';

// Textbook chapters for the CLASSIFICATION MODELS group.
export const CLASSIFICATION_DEEP: Record<string, DeepLesson> = {
  knn: {
    minutes: 17,
    hook: 'A new customer walks into a car showroom in Pune. The salesperson has never met her, yet within two minutes has a good guess about which model she will buy. How? She looks like a few hundred customers the salesperson has served before: similar age, similar budget, arrived with a family, asked about boot space. "People like her usually buy the SUV." That everyday habit of judging a new case by the most similar past cases is exactly what **k-Nearest Neighbours** does, with a calculator instead of a hunch.',
    sections: [
      {
        heading: 'The problem: predicting a label from similar past cases',
        blocks: [
          { p: 'Many business questions have the same shape. We have a history of past cases, each described by a few numbers and each with a known outcome. Now a new case arrives and we want to predict its outcome before it happens. Will this telecom customer leave next month? Will this loan applicant repay? Is this transaction fraud?' },
          { term: 'Classification', def: 'Predicting which category (class) something belongs to, such as "churn" or "stay", "fraud" or "genuine". The answer is a label, not a number.' },
          { term: 'Feature', def: 'One measurable description of a case, such as monthly bill, age or number of complaints. A case is described by a list of features.' },
          { term: 'Training data', def: 'The past cases where we already know the correct label. The model learns from them.' },
          { p: 'Most classifiers try to boil the training data down into a formula or a set of rules. k-Nearest Neighbours (k-NN for short) refuses to do that. It keeps every past case and, when a new one arrives, simply asks: **which past cases are most similar to this one, and what happened to them?**' },
          { p: 'This makes k-NN the most intuitive classifier there is. It is also a useful baseline: if a fancy model cannot beat "look at similar customers", something is wrong with the fancy model.' },
          { diagram: { kind: 'scatter', xLabel: 'satisfaction score (0–10)', yLabel: 'monthly bill (₹ hundred)', caption: 'Past telecom customers: blue churned, red stayed. The churners cluster on the left (low satisfaction). A new customer landing among them would, by k-NN logic, probably churn too.', points: [[2, 8, 0], [3, 6, 0], [5, 5, 0], [1.5, 4, 0], [2.5, 3, 0], [3.5, 7.5, 0], [7, 2, 1], [8, 3, 1], [6, 7, 1], [4, 9, 1], [8.5, 6, 1], [7.5, 8, 1], [9, 4.5, 1], [6.5, 4, 1]] } },
        ],
      },
      {
        heading: 'Building the intuition: ask the neighbours',
        blocks: [
          { p: 'Imagine you have just moved to a new city and want to know whether a restaurant is any good. You do not build a statistical model of restaurants. You ask the five people whose taste is closest to yours and go with the majority. If four of them loved it, you will probably love it too.' },
          { steps: [
            '**Remember everyone.** You know many people and what they thought of many restaurants.',
            '**Find the people most like you.** Similar taste, similar budget, similar love of spice.',
            '**Choose how many to ask.** Ask one friend and you are at the mercy of their odd moods. Ask fifty and you are back to the general public\'s opinion.',
            '**Take a vote.** The majority opinion among your closest matches is your prediction.',
          ], title: 'The neighbour-vote recipe' },
          { p: 'That is the whole algorithm. The "people like you" are the nearest neighbours, "how many to ask" is the number **k**, and "most like you" is measured by a distance between feature lists.' },
          { term: 'Nearest neighbours', def: 'The training cases closest to the new case when we measure distance using their features.' },
          { think: { q: 'Why might asking only your single most similar friend (k = 1) give you a worse answer than asking five?', a: 'Any single person can be unusual: maybe they had one bad night at that restaurant. Asking five averages out these one-off quirks. Asking too many, though, brings in people whose taste is nothing like yours. That tension is the heart of choosing k.' } },
          { callout: 'k-NN has no training step. It just stores the data. All the work happens at prediction time, which is why it is called a **lazy learner**.', tone: 'key' },
        ],
      },
      {
        heading: 'How it works, step by step',
        blocks: [
          { diagram: { kind: 'flow', nodes: ['**Store** all training cases (after scaling)', 'New case arrives: **measure distance** to every stored case', '**Sort** by distance and keep the k closest', '**Vote**: majority label wins', 'Report label and **vote share** as a probability'], caption: 'The k-NN prediction loop. Nothing is learned in advance; every prediction compares the new case with the stored history.' } },
          { p: '**Step 1: Scale the features.** Put every feature on a comparable scale, usually by **standardising** it. We will see in a worked example why skipping this ruins everything.' },
          { term: 'Standardising', def: 'Rescaling a feature by subtracting its average and dividing by its standard deviation, so every feature has average 0 and a typical spread of 1. Income in rupees and age in years then become comparable.' },
          { p: '**Step 2: Measure distance.** For the new case, compute its distance to every training case. The usual choice is the ordinary straight-line (Euclidean) distance, the one you would measure with a ruler on a chart.' },
          { p: '**Step 3: Pick the k closest.** Sort the distances from smallest to largest and keep the first k cases.' },
          { p: '**Step 4: Vote.** Count the labels among those k neighbours. The most common label is the prediction. The share of votes (say 3 out of 5) doubles as a rough probability. For predicting a number instead of a label, average the neighbours\' values instead of voting.' },
          { p: 'A popular refinement is the **distance-weighted vote**: closer neighbours count more than farther ones, typically with weight 1 ÷ distance. In scikit-learn this is `weights="distance"`.' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { p: 'There are only two formulas in k-NN: one for distance, one for the vote.' },
          { tex: 'd(x, z) = \\sqrt{\\sum_{j=1}^{p} (x_j - z_j)^2}', plain: 'For each feature, take the difference between the two cases, square it, add all the squares up, then take the square root. With two features this is Pythagoras\' theorem.', symbols: [['x, z', 'the two cases being compared'], ['p', 'the number of features'], ['x_j', 'the value of feature j for case x']] },
          { p: 'Why square the differences? Squaring makes every difference positive (being ₹200 below or above counts the same) and lets a large gap in one feature count heavily. The square root at the end brings the result back to the original units.' },
          { term: 'Euclidean distance', def: 'The straight-line distance between two points, computed with the formula above. Other options exist, such as Manhattan distance (add absolute differences, like walking city blocks).' },
          { tex: '\\hat{y} = \\arg\\max_{c} \\sum_{i \\in N_k(x)} \\mathbf{1}[y_i = c]', plain: 'Look at the k nearest neighbours of x. For each class c, count how many of them have that label. Predict the class with the biggest count.', symbols: [['\\hat{y}', 'the predicted label'], ['N_k(x)', 'the set of the k nearest training cases to x'], ['\\mathbf{1}[y_i = c]', '1 if neighbour i has label c, otherwise 0'], ['\\arg\\max_c', '"the class c that makes this largest"']] },
          { tex: 'P(c \\mid x) \\approx \\frac{1}{k} \\sum_{i \\in N_k(x)} \\mathbf{1}[y_i = c]', plain: 'The estimated probability of class c is just the fraction of the k neighbours that belong to c.' },
          { callout: 'With k = 5 the only possible probabilities are 0, 0.2, 0.4, 0.6, 0.8 and 1. k-NN probabilities are coarse, which matters if you need to rank customers finely.', tone: 'warn' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Will this telecom customer churn?', setup: 'Seven past customers, described by satisfaction score (0–10) and monthly bill (₹ hundred). Both features already sit on similar 0–10 scales. A (2, 8) churned, B (3, 6) churned, C (7, 2) stayed, D (8, 3) stayed, E (5, 5) churned, F (6, 7) stayed, G (4, 9) stayed. New customer Q = (4, 6).', steps: [
            'Distance to B: √((3−4)² + (6−6)²) = √1 = 1.00.',
            'Distance to E: √((5−4)² + (5−6)²) = √2 ≈ 1.41. To F: √(2² + 1²) = √5 ≈ 2.24. To A: √(2² + 2²) = √8 ≈ 2.83. To G: √(0² + 3²) = 3.00. To C and D: √25 = 5.00 each.',
            'Sorted: B (churn), E (churn), F (stay), A (churn), G (stay), then C and D (stay).',
            'k = 1: only B votes → predict churn.',
            'k = 3: B, E churn; F stays → 2 votes to 1 → churn, probability 2/3 ≈ 0.67.',
            'k = 5: B, E, A churn; F, G stay → 3 to 2 → churn, probability 0.6.',
            'k = 7 (everyone): 3 churn, 4 stay → predict stay.',
          ], result: 'For sensible k the answer is churn, but with k = 7 the far-away loyal customers outvote the close churners. Too large a k drowns local evidence in the overall majority.' } },
          { diagram: { kind: 'scatter', xLabel: 'satisfaction score', yLabel: 'monthly bill (₹ hundred)', caption: 'The worked example. Blue churned, red stayed, green is the new customer Q at (4, 6). Its three nearest neighbours are B, E and F; two of the three churned.', points: [[2, 8, 0], [3, 6, 0], [7, 2, 1], [8, 3, 1], [5, 5, 0], [6, 7, 1], [4, 9, 1], [4, 6, 2]] } },
          { example: { title: 'A distance-weighted vote', setup: 'Same customer Q with k = 5, but each neighbour now votes with weight 1 ÷ distance.', steps: [
            'Churn weights: B = 1/1.00 = 1.000, E = 1/1.41 ≈ 0.707, A = 1/2.83 ≈ 0.354. Total ≈ 2.061.',
            'Stay weights: F = 1/2.24 ≈ 0.447, G = 1/3.00 ≈ 0.333. Total ≈ 0.781.',
            'Weighted churn share = 2.061 / (2.061 + 0.781) ≈ 0.73.',
          ], result: 'The plain vote said 0.6; the weighted vote says about 0.73, because the two closest neighbours both churned. Weighting rewards closeness and makes the answer less sensitive to the exact choice of k.' } },
          { example: { title: 'Why scaling is mandatory: a bank cross-sell (illustrative)', setup: 'A bank predicts whether a customer will accept a credit-card offer from annual income (₹) and number of products already held. New customer: ₹6,00,000 income, 1 product. Neighbour X: ₹6,10,000, 5 products. Neighbour Y: ₹6,60,000, 1 product.', steps: [
            'Unscaled distance to X: √(10,000² + 4²) ≈ 10,000.0008. To Y: √(60,000² + 0²) = 60,000.',
            'So X looks six times closer, even though X holds five products and our customer holds one. The 4-product gap adds only 0.0008 to the distance.',
            'Standardise with income SD ₹2,00,000 and products SD 1.5. X: income gap 10,000/2,00,000 = 0.05, products gap 4/1.5 ≈ 2.67, distance ≈ 2.67.',
            'Y: income gap 60,000/2,00,000 = 0.30, products gap 0, distance 0.30.',
          ], result: 'After scaling, Y is clearly the closer, more relevant neighbour. Without scaling, whichever feature has the biggest numbers silently decides everything.' } },
        ],
      },
      {
        heading: 'Choosing k and other settings',
        blocks: [
          { p: 'k is the one setting that matters most. It controls a trade-off you will meet in every model: following the data closely versus smoothing out noise.' },
          { term: 'Bias–variance trade-off', def: 'A flexible model follows every wiggle in the training data (low bias, high variance: it changes a lot with new data). A rigid model is stable but misses real patterns (high bias, low variance). Good models sit in between.' },
          { bullets: [
            '**Small k (1–3):** the boundary between classes is jagged and bends around single noisy points. Training accuracy looks wonderful; test accuracy disappoints.',
            '**Large k:** the boundary becomes smooth. Too large, and the model just predicts the majority class everywhere.',
            '**Odd k for two classes** avoids tied votes.',
            '**Choose k by cross-validation:** try k = 1, 3, 5 … 51, measure accuracy on held-out data, and pick the best.',
          ] },
          { diagram: { kind: 'bars', labels: ['k=1', 'k=3', 'k=5', 'k=9', 'k=15', 'k=31', 'k=61'], values: [84, 88, 90, 91, 90, 87, 82], highlight: 3, yLabel: 'validation accuracy %', caption: 'A typical validation curve (illustrative). Accuracy rises as k grows from 1 because noise is averaged out, peaks around k = 9, then falls as distant, irrelevant neighbours join the vote.' } },
          { p: 'Two other choices matter. The **distance measure**: Euclidean is the default; Manhattan can be more robust when some features have occasional large jumps. And the **weighting**: uniform votes or distance-weighted votes. Both can be tuned by cross-validation together with k.' },
        ],
      },
      {
        heading: 'k-NN in the real world',
        blocks: [
          { case: { title: 'Similar-customer churn alerts at a telecom operator (illustrative)', story: 'A mobile operator in India wants its retention team to call customers at risk of leaving. Each customer is described by standardised features: tenure, data usage trend, recharge gaps, dropped-call complaints and plan price. For each active customer, k-NN with k = 15 finds the most similar customers from last year and reports the share who left. Customers with a churn share above 0.6 go on the call list, and the agent sees the reason in plain language: "11 of the 15 most similar customers left within two months". Agents trust the list because it is explainable. The team later moves to gradient boosting for accuracy but keeps k-NN\'s "similar customers" view as an explanation screen.' } },
          { bullets: [
            '**Recommendations:** "customers similar to you bought…" is a nearest-neighbour idea at heart.',
            '**Vector search in AI assistants:** retrieval systems find the stored text chunks whose embeddings are nearest to a question. That is k-NN on embeddings.',
            '**Manufacturing quality:** compare a new batch\'s sensor profile with past batches; if its nearest neighbours were rejects, inspect it.',
            '**Missing-value filling:** `KNNImputer` fills a gap with the average of the most similar rows.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Forgetting to scale.** The single most common k-NN bug, as the bank example showed.',
            '**Slow predictions on big data.** Each prediction compares with every stored case: one million customers × 20 features is 20 million calculations per prediction. Tree indexes (`algorithm="kd_tree"`) or approximate search libraries help.',
            '**The curse of dimensionality.** With hundreds of features, every point ends up roughly equally far from every other, so "nearest" stops meaning "similar". Reduce features first (feature selection or PCA).',
            '**Irrelevant features add noise.** A random column like customer ID number still adds to distances. k-NN cannot ignore it; you must remove it.',
            '**Imbalanced classes.** If 95% of cases are "genuine", most neighbourhoods are dominated by them and rare fraud gets outvoted. Use distance weighting, resampling or a different model.',
          ] },
          { term: 'Curse of dimensionality', def: 'The collection of problems that appear when data has many features: space becomes so vast that points are sparse and distances lose their meaning.' },
          { diagram: { kind: 'compare', left: { title: 'k-NN works well when…', items: ['Few features (roughly under 20), all relevant', 'Features are numeric and scaled', 'Dataset is small to medium', 'Boundaries are irregular and local', 'You want "similar cases" explanations'] }, right: { title: 'Choose something else when…', items: ['Many features or text → **logistic regression** or **Naive Bayes**', 'Need fast predictions on millions of rows → **trees** or **linear models**', 'Need top tabular accuracy → **gradient boosting**', 'Need readable rules → **decision tree**', 'Heavy class imbalance → weighted models'] }, caption: 'k-NN is a great first baseline and explanation tool, rarely the final production model for large data.' } },
        ],
      },
    ],
    faq: [
      { q: 'Does k-NN learn anything during training?', a: 'Not really. Training just stores the (scaled) data. All the work is done when you ask for a prediction, which is why it is called a lazy learner.' },
      { q: 'How do I choose k?', a: 'By cross-validation. Try a range of odd values, measure held-out accuracy, and pick the best. A common starting guess is around the square root of the number of training rows, but always validate.' },
      { q: 'Can k-NN handle categorical features like city?', a: 'Not directly, because distance needs numbers. You can one-hot encode categories, but they then add equal-sized jumps to distances, which may not reflect real similarity. Trees often handle such data more naturally.' },
      { q: 'Is k-NN the same as k-means?', a: 'No. They only share the letter k. k-NN is supervised classification where k is the number of neighbours that vote. K-means is unsupervised clustering where k is the number of groups.' },
      { q: 'Can k-NN predict numbers, such as a house price?', a: 'Yes. `KNeighborsRegressor` averages the neighbours\' values instead of voting. The same advice about scaling and choosing k applies.' },
      { q: 'Why is my k = 1 model 100% accurate on training data?', a: 'Because each training point\'s nearest neighbour is itself. That number is meaningless; always judge k-NN on data it has not seen.' },
    ],
  },

  'naive-bayes': {
    minutes: 16,
    hook: 'In the early 2000s, email inboxes were drowning in spam. The fix that turned the tide was surprisingly humble: count which words appear in spam and which in normal mail, then let each word in a new email nudge the odds one way or the other. "Free" nudges towards spam, "invoice attached" nudges away. Multiply the nudges together and you have **Naive Bayes**, a classifier so simple it fits on a postcard and so fast it can sort millions of messages a second.',
    sections: [
      {
        heading: 'The problem: weighing many small clues',
        blocks: [
          { p: 'A customer-support team receives 5,000 tickets a day. Each must go to the right queue: billing, technical, delivery or cancellation. A human reads a ticket and spots clue words: "refund" suggests billing, "error code" suggests technical. No single word decides, but together they point clearly in one direction.' },
          { p: 'We want a machine to do the same: combine many weak clues into a confident decision, learn the strength of each clue from past labelled tickets, and do it fast enough for thousands of tickets an hour. That is precisely what Naive Bayes was built for.' },
          { term: 'Probability', def: 'A number from 0 to 1 saying how likely something is. 0 means impossible, 1 means certain, 0.25 means it happens about one time in four.' },
          { term: 'Conditional probability', def: 'The probability of something given that we already know something else. P(refund | billing) reads "the probability the word refund appears, given that the ticket is about billing".' },
          { p: 'Naive Bayes is built on **Bayes\' theorem**, an 18th-century rule for updating a belief when new evidence arrives. The "naive" part is a bold simplifying assumption that makes the arithmetic trivial. We will meet both slowly.' },
          { diagram: { kind: 'table', head: ['Word', 'Share of spam emails containing it', 'Share of normal emails containing it', 'Points towards'], rows: [['free', '30%', '2%', 'spam (15× more common)'], ['winner', '12%', '0.5%', 'spam'], ['meeting', '5%', '20%', 'normal'], ['invoice', '3%', '9%', 'normal'], ['hello', '40%', '42%', 'neither (no clue)']], caption: 'Each word is a clue whose strength is the ratio of how often it appears in each class. "Hello" appears equally in both, so it carries no information. Numbers are illustrative.' } },
        ],
      },
      {
        heading: 'Building the intuition: the detective\'s notebook',
        blocks: [
          { p: 'Think of a detective deciding whether a suspect was at the scene. She starts with a **starting belief**: from experience, say 40% of suspects in such cases turn out to be involved. Then evidence arrives one piece at a time.' },
          { steps: [
            '**Start with the base rate.** Before looking at evidence, 40% of suspects are involved.',
            '**Weigh the first clue.** Mud on the shoes. Involved people have such mud far more often than uninvolved people. Belief goes up.',
            '**Weigh the next clue.** A train ticket from another city. Uninvolved people have these more often. Belief goes down a bit.',
            '**Keep going.** Each clue multiplies the odds up or down according to how much more common it is under one explanation than the other.',
            '**Decide.** Whichever explanation ends with the higher score wins.',
          ], title: 'Updating a belief clue by clue' },
          { p: 'The naive part: our detective treats each clue as if it were **independent** of the others once she knows the truth. In reality mud and wet trousers tend to come together, so counting both partly double-counts. She accepts that imperfection in exchange for an extremely simple method.' },
          { term: 'Prior', def: 'Your belief before seeing the evidence, usually the base rate in the data. If 40% of past emails were spam, the prior probability of spam is 0.4.' },
          { term: 'Likelihood', def: 'How probable the evidence is under a given explanation. P("free" | spam) = 0.30 means 30% of spam emails contain the word "free".' },
          { term: 'Posterior', def: 'Your updated belief after combining the prior with the evidence. This is what we ultimately want: P(spam | the words in this email).' },
          { think: { q: 'The word "hello" appears in 40% of spam and 42% of normal emails. How much should it change your belief?', a: 'Almost not at all. Evidence only moves a belief when it is much more common under one explanation than the other. A word equally common in both classes is like a witness who says the same thing whatever happened.' } },
        ],
      },
      {
        heading: 'How it works, step by step',
        blocks: [
          { diagram: { kind: 'flow', nodes: ['**Count** class frequencies → priors', '**Count** each feature within each class → likelihoods', 'New case: **multiply** prior × likelihoods for each class', '**Compare** the class scores', '**Normalise** scores to probabilities and pick the largest'], caption: 'Training is just counting. Prediction is just multiplying. That is why Naive Bayes is one of the fastest classifiers that exists.' } },
          { p: '**Training, part 1: priors.** Count what share of training cases belong to each class. If 600 of 1,000 tickets are billing, P(billing) = 0.6.' },
          { p: '**Training, part 2: likelihoods.** For each class, work out how often each feature value appears. For text, that means counting how often each word appears in billing tickets, in technical tickets, and so on.' },
          { p: '**Prediction.** For a new case, compute for each class: prior × likelihood of feature 1 × likelihood of feature 2 × … The class with the biggest product wins.' },
          { p: '**Normalising.** The products are not yet probabilities (they do not add up to 1). Divide each by their total to turn them into probabilities.' },
          { callout: 'With hundreds of words, multiplying hundreds of small numbers gives values like 10⁻³⁰⁰, which computers round to zero. Real implementations add **logarithms** instead of multiplying probabilities. The winner is the same; the arithmetic is safe.', tone: 'tip' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { p: 'Start with Bayes\' theorem. It turns a probability we can count easily (how often words appear in spam) into the one we actually want (how likely an email is spam given its words).' },
          { tex: 'P(c \\mid x) = \\frac{P(x \\mid c)\\, P(c)}{P(x)}', plain: 'The probability of class c given evidence x equals the probability of the evidence if the class were c, times the prior for c, divided by the overall probability of the evidence.', symbols: [['c', 'a class, e.g. spam'], ['x', 'the evidence, e.g. the words in the email'], ['P(c)', 'the prior'], ['P(x \\mid c)', 'the likelihood'], ['P(c \\mid x)', 'the posterior']] },
          { p: 'The bottom line, P(x), is the same for every class, so when we only want to know which class wins we can ignore it and compare the tops. The problem is the likelihood P(x | c) when x contains many features: we would need to know how often every exact combination of words appears in spam. No dataset is big enough for that.' },
          { term: 'Conditional independence', def: 'Two features are independent given the class if, once you know the class, knowing one feature tells you nothing more about the other. Naive Bayes assumes this for all features.' },
          { tex: 'P(c \\mid x_1, \\dots, x_p) \\propto P(c) \\prod_{j=1}^{p} P(x_j \\mid c)', plain: 'Under the naive assumption, the posterior is proportional to the prior times the product of one likelihood per feature. Each feature is counted separately, which needs very little data.', symbols: [['\\propto', '"is proportional to": equal up to a constant we can ignore'], ['\\prod', 'multiply all the terms together'], ['x_j', 'feature j of the case']] },
          { p: 'For word counts there is one more ingredient. If a word never appeared in billing tickets during training, its likelihood would be 0, and one zero in a product wipes out everything else. **Laplace smoothing** pretends every word was seen once more than it actually was.' },
          { tex: 'P(w \\mid c) = \\frac{\\text{count}(w, c) + 1}{\\text{total words in } c + V}', plain: 'Add 1 to every word count and add the vocabulary size V to the total, so no word ever has probability zero and the probabilities still add up to 1.', symbols: [['\\text{count}(w, c)', 'how many times word w appears in class c'], ['V', 'number of distinct words in the vocabulary']] },
          { p: 'For continuous features like temperature, **Gaussian Naive Bayes** assumes each feature follows a bell curve (normal distribution) within each class and uses the height of that curve as the likelihood.' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'A two-word spam check', setup: 'Priors: P(spam) = 0.4, P(normal) = 0.6. Likelihoods: P(free | spam) = 0.30, P(free | normal) = 0.02, P(meeting | spam) = 0.05, P(meeting | normal) = 0.20. An email contains both "free" and "meeting".', steps: [
            'Spam score = 0.4 × 0.30 × 0.05 = 0.0060.',
            'Normal score = 0.6 × 0.02 × 0.20 = 0.0024.',
            'Total = 0.0060 + 0.0024 = 0.0084.',
            'P(spam | email) = 0.0060 / 0.0084 ≈ 0.714. P(normal | email) ≈ 0.286.',
            'For comparison, "free" alone would give 0.4 × 0.30 = 0.120 vs 0.6 × 0.02 = 0.012, so P(spam) ≈ 0.91. The word "meeting" pulled it back down.',
          ], result: 'Predict spam with about 71% probability. Each word multiplied the odds: "free" pushed strongly towards spam, "meeting" pushed back towards normal.' } },
          { example: { title: 'Routing support tickets with Laplace smoothing (illustrative)', setup: 'Training: 6 billing tickets and 4 technical tickets, so priors 0.6 and 0.4. Billing tickets contain 50 words in total, technical tickets 40, and the vocabulary has V = 20 distinct words. "refund" appears 6 times in billing and 0 times in technical. "error" appears once in billing and 5 times in technical. New ticket: "refund error".', steps: [
            'Without smoothing: P(refund | technical) = 0/40 = 0, so the technical score is 0 regardless of "error". That is clearly too extreme.',
            'Smoothed billing likelihoods: P(refund | billing) = (6+1)/(50+20) = 7/70 = 0.100; P(error | billing) = (1+1)/70 ≈ 0.0286.',
            'Smoothed technical likelihoods: P(refund | technical) = (0+1)/(40+20) = 1/60 ≈ 0.0167; P(error | technical) = (5+1)/60 = 0.100.',
            'Billing score = 0.6 × 0.100 × 0.0286 ≈ 0.001714. Technical score = 0.4 × 0.0167 × 0.100 ≈ 0.000667.',
            'P(billing) = 0.001714 / (0.001714 + 0.000667) = 0.72.',
          ], result: 'Route to billing with 72% confidence, while technical keeps a fair 28% instead of being ruled out by a single unseen word.' } },
          { example: { title: 'Gaussian Naive Bayes on a car-parts line (illustrative)', setup: 'An automotive plant classifies wheel bearings as healthy or worn. From history, 10% are worn. Vibration: healthy average 2.0 mm/s (SD 0.5), worn average 4.0 (SD 1.0). Temperature: healthy average 60 °C (SD 5), worn average 70 °C (SD 5). A bearing reads 3.0 mm/s and 68 °C.', steps: [
            'Vibration likelihoods (bell-curve heights at 3.0): healthy ≈ 0.1080, worn ≈ 0.2420.',
            'Vibration only: healthy 0.9 × 0.1080 ≈ 0.0972; worn 0.1 × 0.2420 ≈ 0.0242; P(worn) ≈ 0.199.',
            'Temperature likelihoods at 68 °C: healthy ≈ 0.0222, worn ≈ 0.0737.',
            'Both features: healthy 0.9 × 0.1080 × 0.0222 ≈ 0.00216; worn 0.1 × 0.2420 × 0.0737 ≈ 0.00178.',
            'P(worn) = 0.00178 / (0.00216 + 0.00178) ≈ 0.45.',
          ], result: 'One clue raised the worn probability from the 10% base rate to 20%; the second raised it to 45%. Not quite a majority, but well above the level at which a plant would pull a part for inspection.' } },
          { diagram: { kind: 'curve', fn: 'Math.exp(-Math.pow(x-2,2)/(2*0.25))/(0.5*Math.sqrt(2*Math.PI))', fn2: 'Math.exp(-Math.pow(x-4,2)/2)/Math.sqrt(2*Math.PI)', xMin: 0, xMax: 8, marks: [{ x: 3, label: 'reading 3.0' }], xLabel: 'vibration (mm/s)', yLabel: 'likelihood', legend: ['healthy', 'worn'], caption: 'The two bell curves Gaussian Naive Bayes uses for vibration. At 3.0 mm/s the worn curve (0.242) is more than twice as high as the healthy curve (0.108). That ratio is the strength of the clue before the 10% prior is applied.' } },
        ],
      },
      {
        heading: 'Variants, and why "naive" still works',
        blocks: [
          { diagram: { kind: 'table', head: ['Variant', 'Feature type', 'Typical use', 'scikit-learn'], rows: [['Multinomial', 'Word counts', 'Text, ticket routing', '`MultinomialNB`'], ['Bernoulli', 'Present / absent', 'Short texts, yes/no flags', '`BernoulliNB`'], ['Gaussian', 'Continuous numbers', 'Sensor readings, measurements', '`GaussianNB`'], ['Complement', 'Word counts, imbalanced classes', 'Text with rare classes', '`ComplementNB`']], caption: 'Pick the variant that matches what your features look like. The Bayes logic is identical; only the likelihood formula changes.' } },
          { p: 'The independence assumption is almost always false. Words like "credit" and "card" co-occur; temperature and vibration rise together. So why does Naive Bayes classify well?' },
          { p: 'Because classification only needs the **right winner**, not exact probabilities. Double-counting correlated clues inflates the scores of the winning class, but usually inflates them in the same direction, so the ranking survives. The price is paid in the probabilities themselves, which are pushed towards 0 or 1 and should not be trusted as accurate percentages.' },
          { callout: 'Use Naive Bayes for **deciding**, not for **quoting odds**. If you need trustworthy probabilities (for pricing risk, say), calibrate them with `CalibratedClassifierCV` or use logistic regression.', tone: 'warn' },
        ],
      },
      {
        heading: 'Naive Bayes in the real world',
        blocks: [
          { case: { title: 'Spam filtering', story: 'Paul Graham\'s widely read 2002 essay "A Plan for Spam" popularised Bayesian word-counting filters, and the approach was soon built into many spam filters of that era. Each user\'s own "this is spam" clicks retrained the counts, so the filter adapted to what that person received. Modern providers now combine many signals and more complex models, but word-level Bayesian scoring remains a teaching classic and a strong baseline for any new text-filtering problem.' } },
          { bullets: [
            '**Ticket and email routing:** a first model for sending messages to the right team, often trained in seconds on a laptop.',
            '**Sentiment analysis:** positive versus negative product reviews from word counts.',
            '**Document categorisation:** news topics, legal document types, invoice versus purchase order.',
            '**Medical screening aids:** combining several test results, each with known rates in sick and healthy patients.',
            '**Baselines:** before training a large language model classifier, check how far Naive Bayes gets you. Sometimes it is enough.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Zero probabilities.** Forgetting smoothing lets one unseen word veto a class. scikit-learn\'s `alpha=1.0` default is Laplace smoothing.',
            '**Overconfident probabilities.** Outputs of 0.999 are common and rarely mean what they say.',
            '**Strongly correlated features.** Ten near-copies of the same clue get counted ten times. Remove duplicates before training.',
            '**Interactions.** If a clue only matters in combination ("discount" is fine, "discount" plus "wire transfer" is suspicious), Naive Bayes cannot see it.',
            '**Gaussian assumption.** Skewed features such as income break the bell-curve assumption; transform them (for example with a log) first.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'Naive Bayes shines when…', items: ['Features are words or counts', 'Training data is small', 'You need training in seconds and instant predictions', 'Many features each carry a little evidence', 'You need a quick baseline'] }, right: { title: 'Prefer something else when…', items: ['You need calibrated probabilities → **logistic regression**', 'Features interact strongly → **trees** or **boosting**', 'Highest text accuracy matters → **linear SVM** or **transformer** models', 'Numeric features are far from normal → transform them or use **trees**'] }, caption: 'Naive Bayes trades accuracy at the top end for speed, simplicity and robustness on small data.' } },
        ],
      },
    ],
    faq: [
      { q: 'Why is it called "naive"?', a: 'Because it assumes every feature is independent of the others once the class is known. That is rarely true, which is the naive part, but the method works well anyway for ranking classes.' },
      { q: 'Do I need a lot of data?', a: 'No. Because each feature is counted separately, Naive Bayes needs far less data than most classifiers. It is a good choice when you have only a few hundred labelled examples.' },
      { q: 'Should I trust its probabilities?', a: 'Treat them as scores, not true percentages. They tend to be too extreme. Calibrate them if exact probabilities matter.' },
      { q: 'What does Laplace smoothing actually do?', a: 'It adds one imaginary occurrence of every word to every class, so no word has zero probability. That stops a single unseen word from ruling a class out entirely.' },
      { q: 'Does Naive Bayes need feature scaling?', a: 'No. Multinomial and Bernoulli work on counts and flags, and Gaussian Naive Bayes estimates a separate mean and spread for each feature, so the units do not matter.' },
      { q: 'How is Bayes\' theorem different from Naive Bayes?', a: 'Bayes\' theorem is an exact rule of probability. Naive Bayes is a classifier that applies that rule plus the simplifying independence assumption, so the likelihood can be computed one feature at a time.' },
    ],
  },

  'decision-tree': {
    minutes: 18,
    hook: 'A loan officer at a bank in Chennai explains her decisions like this: "If income is below ₹13.5 lakh, I look hard at the credit score. Above 750, I approve; otherwise I decline. If income is higher, I only decline when the score is really poor." That is a **decision tree**: a short chain of yes/no questions leading to a decision. The machine-learning version builds the same kind of flowchart automatically, by finding the questions that best separate good loans from bad ones in thousands of past applications.',
    sections: [
      {
        heading: 'The problem: rules people can read',
        blocks: [
          { p: 'Banks, insurers and hospitals often face a dilemma. Accurate models can be hard to explain, yet regulators, customers and managers want to know **why** a decision was made. "The model said no" is not an acceptable answer to a rejected loan applicant.' },
          { p: 'A decision tree resolves this by producing rules that look exactly like the ones a human expert would write. You can print it on one page, walk a customer through it and check it against common sense. And because it learns those rules from data, it can find thresholds no human would have guessed.' },
          { term: 'Decision tree', def: 'A model that makes predictions by asking a sequence of yes/no questions about the features, like a flowchart. Each answer sends you down a branch until you reach a final answer.' },
          { term: 'Node, branch and leaf', def: 'A node is a point in the tree where a question is asked. Branches are the yes/no paths out of it. A leaf is an end point with no more questions; it holds the prediction. The top node is called the root.' },
          { p: 'Our running example throughout the app: predicting whether a loan applicant will **repay** or **default** from two features, annual income and credit score. We have 40 past applicants: 20 repaid and 20 defaulted.' },
          { diagram: { kind: 'tree', root: { label: 'Income ≤ ₹13.5 lakh?', children: [
            { label: 'Credit score ≥ 750?', edge: 'yes (4 repaid / 16 defaulted)', children: [
              { label: 'Approve (3 repaid / 1 defaulted)', edge: 'yes' },
              { label: 'Decline (1 repaid / 15 defaulted)', edge: 'no' },
            ] },
            { label: 'Credit score < 650?', edge: 'no (16 repaid / 4 defaulted)', children: [
              { label: 'Decline (1 repaid / 3 defaulted)', edge: 'yes' },
              { label: 'Approve (15 repaid / 1 defaulted)', edge: 'no' },
            ] },
          ] }, caption: 'The finished tree for our 40 loan applicants. Every leaf is far purer than the 20/20 starting mix. Notice the tree asks a different credit-score question on each side: it learned that lower-income applicants need a higher score.' } },
        ],
      },
      {
        heading: 'Building the intuition: 20 Questions',
        blocks: [
          { p: 'You have probably played 20 Questions. Someone thinks of an animal and you may ask only yes/no questions. Good players never open with "Is it a hedgehog?". They ask "Does it live in water?", because whatever the answer, it cuts the possibilities roughly in half.' },
          { steps: [
            '**Look at everything that is still possible.** At the start, every animal.',
            '**Find the question that splits the possibilities most usefully.** One that leaves each side as uniform as possible.',
            '**Ask it and follow the answer.** You now face a smaller, more focused set.',
            '**Repeat inside that smaller set** with a new best question.',
            '**Stop** when you are confident or have run out of questions.',
          ], title: 'How a good player thinks' },
          { p: 'A decision tree plays this game against the data. At each node it looks at the cases that reached it and searches for the question that best separates the classes. "Best" means the groups on each side become as **pure** as possible: ideally all repaid on one side and all defaulted on the other.' },
          { term: 'Purity', def: 'How uniform a group is. A node with 10 repaid and 0 defaulted is perfectly pure. A node with 5 of each is as mixed (impure) as it can be.' },
          { think: { q: 'Which first question is more useful: one that splits 40 applicants into 20 and 20 with a 10/10 mix on each side, or one that splits them into 30 and 10 where the 10 are all defaulters?', a: 'The second. The first question produced two groups exactly as mixed as before, so it taught us nothing. The second created one perfectly pure group. Splitting evenly is not the goal; creating pure groups is.' } },
        ],
      },
      {
        heading: 'How a tree is grown, step by step',
        blocks: [
          { diagram: { kind: 'flow', nodes: ['Start with **all cases** at the root', 'Try **every feature** and **every threshold**', 'Keep the split with the **biggest impurity drop**', 'Repeat **inside each child** node', '**Stop** at max depth, small nodes or pure leaves'], caption: 'Tree growing is greedy: at each node it takes the best split available right now and never revisits earlier choices.' } },
          { p: '**Step 1: Candidate questions.** For a numeric feature such as income, sort the values and try a threshold halfway between each pair of neighbouring values. For six applicants with six different incomes there are five candidate thresholds per feature.' },
          { p: '**Step 2: Score each candidate.** Split the cases by the question and measure how impure each side is. Combine the two sides into one weighted score, weighting each side by how many cases it holds.' },
          { p: '**Step 3: Keep the winner.** The question with the lowest weighted impurity (equivalently, the biggest drop from the parent) becomes this node\'s question.' },
          { p: '**Step 4: Recurse.** Apply the same procedure separately to the cases in each child. The left branch might pick a completely different feature from the right branch.' },
          { p: '**Step 5: Stop.** Growth stops when a node is pure, when it has too few cases to split, or when the tree reaches a depth limit you set.' },
          { term: 'Greedy algorithm', def: 'A method that makes the best-looking choice at each step without planning ahead. Fast and usually good, but not guaranteed to find the best possible tree overall.' },
          { p: 'To **predict**, drop a new applicant down the tree, answering each question, until you reach a leaf. The leaf\'s majority class is the prediction, and its class mix gives a probability: a leaf with 15 repaid and 1 defaulted says "repay, about 94%".' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { p: 'We need a number for "how mixed is this node". The default in scikit-learn is Gini impurity.' },
          { term: 'Gini impurity', def: 'The chance that two cases picked at random (with replacement) from a node have different labels. 0 for a pure node; 0.5 for a 50/50 mix of two classes.' },
          { tex: 'G = 1 - \\sum_{c} p_c^{\\,2}', plain: 'Square the share of each class, add those squares, and subtract from 1. If one class has everything, its share is 1, the square is 1, and G = 0.', symbols: [['G', 'Gini impurity of the node'], ['p_c', 'share of cases in the node that belong to class c']] },
          { p: 'Why squares? p² is the chance of drawing two cases of class c in a row. Adding over classes gives the chance two random draws match; 1 minus that is the chance they differ, which is exactly "mixedness".' },
          { tex: 'G_{\\text{split}} = \\frac{n_L}{n} G_L + \\frac{n_R}{n} G_R', plain: 'The quality of a split is the average of the two children\'s impurities, weighted by how many cases went each way. A tiny pure child cannot make up for a huge messy one.', symbols: [['n_L, n_R', 'number of cases in the left and right child'], ['n', 'number of cases in the parent'], ['G_L, G_R', 'Gini impurity of each child']] },
          { p: 'An alternative measure, **entropy**, comes from information theory. It behaves very similarly: 0 for pure nodes and largest for an even mix (1 bit for two classes). The drop in entropy is called **information gain**.' },
          { tex: 'H = -\\sum_{c} p_c \\log_2 p_c', plain: 'Entropy: for each class, multiply its share by the logarithm of its share, add up and flip the sign. It measures how many yes/no questions you would need, on average, to pin down the label.', symbols: [['H', 'entropy of the node, in bits'], ['\\log_2', 'logarithm base 2']] },
          { callout: 'Gini and entropy pick the same split in the vast majority of cases. Gini is slightly faster to compute, which is why it is the default. Do not spend time agonising over the choice.', tone: 'tip' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Choosing the root question for the loan tree', setup: '40 applicants: 20 repaid, 20 defaulted. Candidate A: "income ≤ ₹13.5 lakh?" sends 4 repaid + 16 defaulted left and 16 repaid + 4 defaulted right. Candidate B: "credit score < 650?" sends 3 repaid + 12 defaulted left (15 people) and 17 repaid + 8 defaulted right (25 people).', steps: [
            'Root Gini = 1 − (0.5² + 0.5²) = 1 − 0.5 = 0.50.',
            'Candidate A, left: shares 4/20 = 0.2 and 16/20 = 0.8 → Gini = 1 − (0.04 + 0.64) = 0.32. Right is the mirror image → 0.32.',
            'Candidate A weighted: (20/40) × 0.32 + (20/40) × 0.32 = 0.32. Drop from root = 0.18.',
            'Candidate B, left: 3/15 = 0.2 and 12/15 = 0.8 → Gini = 0.32. Right: 17/25 = 0.68 and 8/25 = 0.32 → Gini = 1 − (0.4624 + 0.1024) = 0.4352.',
            'Candidate B weighted: (15/40) × 0.32 + (25/40) × 0.4352 = 0.12 + 0.272 = 0.392. Drop = 0.108.',
          ], result: 'Income wins (0.32 beats 0.392), so "income ≤ ₹13.5 lakh?" becomes the root question. Credit score is not discarded; it will be tried again inside each branch.' } },
          { example: { title: 'Finding the best income threshold', setup: 'Six applicants with incomes (₹ lakh) 8, 10, 12, 15, 18, 22 and outcomes default, default, default, repaid, repaid, default. Which threshold should the tree use?', steps: [
            'Parent: 2 repaid, 4 defaulted → Gini = 1 − ((1/3)² + (2/3)²) ≈ 0.444.',
            'Candidate thresholds are midpoints: 9, 11, 13.5, 16.5 and 20.',
            '≤ 9: left {D} Gini 0; right 2R/3D Gini 0.48 → weighted (1×0 + 5×0.48)/6 = 0.400.',
            '≤ 11: left {D, D} Gini 0; right 2R/2D Gini 0.5 → weighted 0.333.',
            '≤ 13.5: left {D, D, D} Gini 0; right 2R/1D Gini ≈ 0.444 → weighted 0.222.',
            '≤ 16.5: left 1R/3D Gini 0.375; right 1R/1D Gini 0.5 → weighted 0.417. ≤ 20: left 2R/3D Gini 0.48; right {D} 0 → weighted 0.400.',
          ], result: 'Threshold 13.5 gives the lowest weighted Gini (0.222), so the tree asks "income ≤ ₹13.5 lakh?". Notice the high-income defaulter at ₹22 lakh: a deeper tree would add a question just to isolate this one person. That is overfitting in action.' } },
          { example: { title: 'Second level and a prediction', setup: 'Inside the high-income branch (16 repaid, 4 defaulted), the tree tests "credit score < 650?": 1 repaid + 3 defaulted go left, 15 repaid + 1 defaulted go right. Then a new applicant earns ₹11 lakh with a credit score of 780.', steps: [
            'Branch Gini before splitting: 1 − (0.8² + 0.2²) = 0.32.',
            'Left child: 1 − (0.25² + 0.75²) = 0.375. Right child: 1 − ((15/16)² + (1/16)²) ≈ 0.117.',
            'Weighted: (4/20) × 0.375 + (16/20) × 0.117 ≈ 0.075 + 0.094 = 0.169. Drop ≈ 0.151, a strong split.',
            'Entropy check on the root split: root entropy = 1 bit; each child (0.2/0.8) has entropy ≈ 0.722 bits; information gain ≈ 0.278 bits. Entropy agrees with Gini that income is a strong first question.',
            'New applicant: income ₹11 lakh ≤ 13.5 → yes, go left. Credit score 780 ≥ 750 → yes. Leaf: 3 repaid / 1 defaulted.',
          ], result: 'Predict "repay" with an estimated probability of 3/4 = 75%, and the explanation writes itself: "income below ₹13.5 lakh, but credit score above 750".' } },
          { diagram: { kind: 'scatter', xLabel: 'annual income (₹ lakh)', yLabel: 'credit score', caption: 'Applicants plotted by income and credit score: blue repaid, red defaulted. The tree cuts this space with vertical and horizontal lines only (income = 13.5, then score = 750 on the left and 650 on the right), producing rectangular "staircase" regions.', points: [[8, 780, 0], [11, 790, 0], [12, 760, 0], [9, 700, 1], [7, 640, 1], [10, 680, 1], [12, 720, 1], [6, 600, 1], [16, 700, 0], [20, 760, 0], [18, 680, 0], [25, 720, 0], [15, 810, 0], [17, 620, 1], [22, 600, 1], [19, 630, 1], [14, 660, 0], [23, 790, 0]] } },
        ],
      },
      {
        heading: 'Controlling overfitting: depth, leaves and pruning',
        blocks: [
          { p: 'Left alone, a tree keeps splitting until every leaf is pure. On real data that means building leaves for single unusual applicants, like our ₹22 lakh defaulter. The tree then memorises the training data and performs worse on new applicants.' },
          { term: 'Overfitting', def: 'When a model learns the noise and quirks of its training data instead of the general pattern, so it scores brilliantly on training data and poorly on new data.' },
          { bullets: [
            '**`max_depth`:** limit how many questions can be asked in a row. Depth 3–6 is common for readable trees.',
            '**`min_samples_leaf`:** every leaf must hold at least this many cases (say 20), so no rule is built on one person.',
            '**`min_samples_split`:** do not split a node smaller than this.',
            '**Cost-complexity pruning (`ccp_alpha`):** grow a big tree, then cut back branches whose accuracy gain does not justify the extra complexity.',
            '**Choose these settings by cross-validation**, not by training accuracy.',
          ] },
          { diagram: { kind: 'bars', labels: ['depth 1', 'depth 2', 'depth 3', 'depth 4', 'depth 6', 'depth 10', 'no limit'], values: [70, 78, 82, 83, 80, 75, 72], highlight: 3, yLabel: 'test accuracy %', caption: 'A typical pattern (illustrative): test accuracy improves with depth up to about 3–4 questions, then falls as the tree starts memorising noise. Training accuracy, not shown, would keep rising towards 100%.' } },
          { p: 'Trees are also **unstable**: change a handful of training rows and the root question may change, reshaping the whole tree. This weakness is exactly what random forests and gradient boosting fix, by combining many trees.' },
        ],
      },
      {
        heading: 'Decision trees in the real world',
        blocks: [
          { case: { title: 'Explainable credit pre-screening (illustrative)', story: 'A consumer-lending company wants a fast pre-screen for personal-loan applications that its credit committee can review line by line. A tree limited to depth 4 and at least 200 applicants per leaf is trained on three years of outcomes, using income, credit score, existing EMIs as a share of income, employment type and years at current employer. The result is 11 leaves, each a readable rule. The committee spots one rule that relies on a postcode-like feature and removes it on fairness grounds before retraining. The final tree approves clear cases instantly and sends borderline leaves, those with default rates between 8% and 20%, to human underwriters.' } },
          { bullets: [
            '**Medical triage:** checklists such as "chest pain → age over 60 → abnormal ECG → urgent" mirror tree logic and are easy for staff to follow.',
            '**Manufacturing root cause:** a tree trained on line settings can show that defects concentrate where temperature > 210 °C and line speed > 1.2 m/s.',
            '**Customer service scripts:** routing rules derived from a tree trained on resolved tickets.',
            '**Building blocks:** random forests, XGBoost and LightGBM, the most accurate models for tabular business data, are all made of decision trees.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Overfitting** if depth and leaf size are not limited.',
            '**Instability:** small data changes can produce a very different tree, so do not over-interpret a single tree\'s structure.',
            '**Staircase boundaries:** trees split on one feature at a time, so a simple diagonal rule such as "approve when income + score is high" needs many small steps.',
            '**Biased feature importance:** impurity-based importance favours features with many distinct values, such as IDs. Use permutation importance instead.',
            '**Greedy choices:** the best first question is not always part of the best overall tree.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'A single tree is right when…', items: ['Rules must be read and audited', 'Features mix numbers and categories', 'You do not want to scale data', 'Interactions matter (income changes what score is needed)', 'You need a quick, transparent baseline'] }, right: { title: 'Move to something else when…', items: ['You need top accuracy → **random forest** or **gradient boosting**', 'Boundaries are smooth or diagonal → **logistic regression** or **SVM**', 'Data is tiny and noisy → simpler linear models', 'Stability across retrains matters → ensembles'] }, caption: 'One tree is the most explainable model you have; many trees are among the most accurate.' } },
        ],
      },
    ],
    faq: [
      { q: 'Do I need to scale features for a decision tree?', a: 'No. Trees only compare a feature with a threshold, so its units do not matter. Income in rupees and credit score in points can be used as they are.' },
      { q: 'Gini or entropy?', a: 'They nearly always choose the same splits. Use the default (Gini) unless you have a specific reason to change it.' },
      { q: 'How deep should my tree be?', a: 'Choose by cross-validation. For readable trees, depth 3 to 5 with a sensible minimum leaf size is common. Deeper trees are usually only worth it inside an ensemble.' },
      { q: 'Can trees predict numbers as well as classes?', a: 'Yes. A regression tree predicts the average value in each leaf and chooses splits that reduce the squared error rather than Gini impurity.' },
      { q: 'Why did my tree change completely when I added a little data?', a: 'Trees are unstable: a small shift can change the root question, and everything below changes with it. Random forests average many trees precisely to fix this.' },
      { q: 'How does a tree handle categorical features like employment type?', a: 'Conceptually it asks questions such as "employment type is salaried?". In scikit-learn you usually one-hot encode categories first; some libraries like LightGBM handle categories natively.' },
    ],
  },

  svm: {
    minutes: 16,
    hook: 'Two villages sit on either side of a valley and the government wants to build a road between them. Many routes would technically separate the villages, but the sensible planner chooses the one that stays as far as possible from the nearest houses on both sides, leaving room for growth and mistakes. A **Support Vector Machine** draws the boundary between two classes with the same philosophy: not just any line that separates them, but the one with the **widest street**.',
    sections: [
      {
        heading: 'The problem: many lines separate, which one is best?',
        blocks: [
          { p: 'Suppose a lender has two features for past applicants and the repaid and defaulted groups do not overlap on the chart. You could draw dozens of straight lines that put every repaid applicant on one side and every defaulter on the other. All of them score 100% on the training data. Which should you trust for tomorrow\'s applicants?' },
          { p: 'A line that just grazes some training points is risky: a new applicant slightly different from those points could land on the wrong side. A line with plenty of room on both sides is more forgiving. The SVM turns that intuition into an exact optimisation.' },
          { term: 'Decision boundary', def: 'The line (or, with more features, the flat surface) that separates the region where the model predicts one class from the region where it predicts the other.' },
          { term: 'Hyperplane', def: 'The general name for a flat boundary: a line in 2 dimensions, a flat plane in 3, and its equivalent in more dimensions, which we cannot draw but can compute.' },
          { diagram: { kind: 'scatter', xLabel: 'feature 1 (scaled)', yLabel: 'feature 2 (scaled)', line: { m: -1, b: 6 }, caption: 'Seven applicants, blue for class −1 and red for class +1. The line x₁ + x₂ = 6 is the maximum-margin boundary. The four points closest to it, (2, 3), (3, 2), (4, 3) and (3, 4), sit exactly on the edges of the street; they are the support vectors.', points: [[2, 3, 0], [3, 2, 0], [1, 1, 0], [2, 2, 0], [4, 3, 1], [3, 4, 1], [5, 5, 1]] } },
        ],
      },
      {
        heading: 'Building the intuition: the widest street',
        blocks: [
          { p: 'Picture the chart as a map with red houses on one side and blue houses on the other. You must lay a straight road with a centre line and two kerbs. The rule: no house may stand on the road. Your goal: make the road as wide as possible.' },
          { steps: [
            '**Start with any road** that separates the colours.',
            '**Widen it** until a kerb touches a house on one side or the other.',
            '**Rotate and shift** the road to see whether it can be made wider while still touching no house.',
            '**Stop** when the road cannot be widened any further. The houses touching the kerbs are now holding the road in place.',
          ], title: 'Laying the widest road' },
          { p: 'Those houses touching the kerbs are the **support vectors**: they "support" the road like tent pegs. Every other house could be moved around, or removed entirely, and the road would not change. That is a striking property: the final model depends on only a handful of the training points.' },
          { term: 'Margin', def: 'The width of the street: the distance between the boundary and the closest points of each class, counted on both sides.' },
          { term: 'Support vectors', def: 'The training points that lie on the edge of the margin (or inside it, when errors are allowed). They alone determine where the boundary goes.' },
          { think: { q: 'You delete a training point that sits far away from the boundary, deep in its own class territory. What happens to the SVM\'s boundary?', a: 'Nothing. Only support vectors affect the boundary. Points far from the street play no part in the final answer. Logistic regression, by contrast, uses every point, so its line would shift slightly.' } },
        ],
      },
      {
        heading: 'How it works, step by step',
        blocks: [
          { diagram: { kind: 'flow', nodes: ['**Scale** the features', 'Choose **C** (tolerance for violations)', '**Solve** for the widest street allowing paid violations', 'Keep only the **support vectors**', 'Predict by the **side of the line** a new point falls on'], caption: 'Training an SVM is a single optimisation problem with one best answer; no random restarts needed.' } },
          { p: '**Step 1: Scale.** Like k-NN, an SVM measures distances, so every feature must be standardised first.' },
          { p: '**Step 2: Choose C.** Real data almost never separates perfectly; a few repaid applicants look like defaulters. The **soft-margin** SVM allows points inside the street or even on the wrong side, but charges a penalty for each. The setting **C** says how expensive each violation is.' },
          { term: 'Soft margin', def: 'A version of the SVM that tolerates some points inside the margin or on the wrong side, paying a penalty for each, so it can handle overlapping classes.' },
          { p: '**Step 3: Solve.** A numerical optimiser finds the line that best balances a wide street against the total penalty. This problem is **convex**, meaning it has a single best answer and the solver always finds it.' },
          { p: '**Step 4: Predict.** For a new point, compute a score from the line\'s equation. Positive score: class +1. Negative: class −1. The size of the score says how far the point is from the boundary, a rough measure of confidence.' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { p: 'A straight boundary can be written as a weighted sum of features plus a constant. Points where this sum is zero lie on the boundary.' },
          { tex: 'f(x) = w \\cdot x + b = w_1 x_1 + w_2 x_2 + \\dots + b', plain: 'Multiply each feature by its weight, add them up, add b. If f(x) is positive predict +1, if negative predict −1. The boundary is where f(x) = 0.', symbols: [['w', 'the weights, one per feature; they set the direction of the boundary'], ['b', 'the bias or offset; it shifts the boundary'], ['x', 'the features of a case']] },
          { p: 'SVMs fix the scale of w by insisting that the closest points on each side have f(x) = +1 or −1 exactly. The street edges are then the lines f(x) = +1 and f(x) = −1, and geometry tells us the street\'s width.' },
          { tex: '\\text{margin width} = \\frac{2}{\\lVert w \\rVert}', plain: 'The width of the street is 2 divided by the length of the weight vector. Smaller weights mean a wider street.', symbols: [['\\lVert w \\rVert', 'the length of w: the square root of the sum of squared weights']] },
          { p: 'So making the street wide is the same as making w small. The soft-margin SVM balances that against penalties for violations.' },
          { tex: '\\min_{w,\\,b} \\; \\frac{1}{2}\\lVert w \\rVert^2 + C \\sum_{i=1}^{n} \\max\\big(0,\\; 1 - y_i f(x_i)\\big)', plain: 'Minimise two things together: the first term keeps the street wide; the second adds up a penalty for every training point that is inside the street or on the wrong side. C sets how much the penalties matter compared with the width.', symbols: [['y_i', 'the true label of case i, either +1 or −1'], ['y_i f(x_i)', 'positive and at least 1 if the point is correctly outside the street'], ['C', 'the price of each unit of violation']] },
          { term: 'Hinge loss', def: 'The penalty max(0, 1 − y·f(x)). Zero for points safely outside the street on the correct side, growing in a straight line as a point moves into the street and across to the wrong side.' },
          { callout: '**Large C** says "violations are very expensive": a narrow street that bends to classify every training point, risking overfitting. **Small C** says "a few violations are fine": a wide, calm street that may ignore some points. Tune C by cross-validation.', tone: 'key' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Reading a trained SVM', setup: 'On the seven scaled points in the first diagram, a linear SVM (with very large C, so no violations allowed) finds w = (1, 1) and b = −6. Check its properties.', steps: [
            'Boundary: x₁ + x₂ − 6 = 0, that is x₁ + x₂ = 6.',
            'Point (2, 3), class −1: f = 2 + 3 − 6 = −1. Exactly on its kerb → support vector. Same for (3, 2).',
            'Point (4, 3), class +1: f = 4 + 3 − 6 = +1 → support vector. Same for (3, 4).',
            'Point (1, 1), class −1: f = −4. Well inside its own territory, not a support vector. Its distance to the boundary is |−4| / √2 ≈ 2.83.',
            'Margin width = 2 / ‖w‖ = 2 / √(1² + 1²) = 2 / √2 ≈ 1.41. Each support vector is 1 / √2 ≈ 0.71 from the centre line.',
            'New point (4, 4): f = 4 + 4 − 6 = +2 → predict +1, comfortably outside the street.',
          ], result: 'Four support vectors define everything. Delete (1, 1), (2, 2) or (5, 5) and retraining gives exactly the same line.' } },
          { example: { title: 'Hinge loss for four applicants', setup: 'A soft-margin SVM gives these values of y·f(x): applicant P = 2.0, Q = 1.0, R = 0.5, S = −0.3.', steps: [
            'P: max(0, 1 − 2.0) = 0. Correct side, outside the street, no penalty.',
            'Q: max(0, 1 − 1.0) = 0. Exactly on the kerb, still no penalty.',
            'R: max(0, 1 − 0.5) = 0.5. Correct side but inside the street: partial penalty.',
            'S: max(0, 1 − (−0.3)) = 1.3. On the wrong side: the biggest penalty.',
            'Total violation = 0 + 0 + 0.5 + 1.3 = 1.8. With C = 1 this adds 1.8 to the objective; with C = 100 it adds 180, which would push the solver hard to fix R and S at the cost of a narrower street.',
          ], result: 'The hinge loss ignores well-classified points entirely and charges more the deeper a point sits on the wrong side. C decides how loudly those charges speak.' } },
          { example: { title: 'Tuning C on a real medical dataset', setup: 'The public Wisconsin breast-cancer dataset in scikit-learn has 569 tumour samples with 30 measurements each. A scaled linear SVM is scored with 5-fold cross-validation for several values of C.', steps: [
            'C = 0.001: accuracy 93.7%, with 252 of 569 points as support vectors. The street is very wide and many points fall inside it.',
            'C = 0.01: 96.8%, 118 support vectors.',
            'C = 0.1: 97.4%, 60 support vectors. The best of the values tried.',
            'C = 1: 97.2%, 40 support vectors.',
            'C = 100: 96.0%, 31 support vectors. Training accuracy is 99.6%, but held-out accuracy has dropped.',
          ], result: 'Moderate C wins. Larger C keeps shrinking the street and the number of support vectors while training accuracy climbs, but performance on unseen data falls. Always choose C on held-out data.' } },
          { diagram: { kind: 'bars', labels: ['C=0.001', 'C=0.01', 'C=0.1', 'C=1', 'C=10', 'C=100'], values: [93.7, 96.8, 97.4, 97.2, 96.8, 96.0], highlight: 2, yLabel: 'cross-validated accuracy %', caption: 'Results of the breast-cancer run above (scikit-learn, linear kernel, 5-fold CV). Accuracy peaks at C = 0.1 and drifts down as C grows and the street narrows around individual points.' } },
        ],
      },
      {
        heading: 'Reading SVM output and getting probabilities',
        blocks: [
          { p: 'A trained scikit-learn SVM exposes useful attributes. `support_vectors_` lists the points holding the street in place; `n_support_` counts them per class. For a linear kernel, `coef_` holds w: larger absolute weights mean the feature matters more to the boundary (as long as features were scaled).' },
          { p: '`decision_function(x)` returns f(x), the signed score. Its sign gives the class and its size gives the distance from the boundary in units of half the street width. It is **not** a probability.' },
          { term: 'Calibration', def: 'Converting a model\'s raw scores into probabilities that match reality, so that among cases labelled "70% likely", about 70% really are positive.' },
          { p: 'If you need probabilities, set `probability=True` (scikit-learn then fits a calibration curve using internal cross-validation, which slows training) or wrap the model in `CalibratedClassifierCV`. For multi-class problems, scikit-learn\'s `SVC` trains one SVM per pair of classes and combines their votes automatically.' },
          { callout: 'A growing share of support vectors is a warning sign. If most of your training points are support vectors, the classes overlap heavily or C is too small, and the model is close to guessing near the boundary.', tone: 'warn' },
        ],
      },
      {
        heading: 'SVMs in the real world',
        blocks: [
          { case: { title: 'Text categorisation', story: 'Thorsten Joachims\' 1998 study of text categorisation, using the Reuters news collection, showed linear SVMs performing very well on documents represented by thousands of word features. Text suits SVMs: there are many features, each document uses only a few of them, and the classes are often close to linearly separable in that high-dimensional space. Linear SVMs became a standard tool for news tagging, spam detection and sentiment analysis, and `LinearSVC` remains a strong, fast baseline for text classification today.' } },
          { bullets: [
            '**Bioinformatics:** classifying tissue samples from thousands of gene-expression measurements with only a few hundred patients.',
            '**Image descriptors:** before deep learning, SVMs on hand-crafted image features were a common approach to detecting pedestrians and faces.',
            '**Quality inspection (illustrative):** separating good and faulty welds from a dozen sensor readings, with only a few hundred labelled examples.',
            '**Fraud screening:** a linear SVM on transaction features, with C tuned to control false alarms.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Unscaled features** distort the street. Always use a `StandardScaler` in a pipeline.',
            '**Slow on large datasets.** Kernel `SVC` training time grows roughly with the square of the number of rows or worse; beyond about 100,000 rows use `LinearSVC` or `SGDClassifier`.',
            '**No native probabilities.** Calibration adds cost and complexity.',
            '**Less interpretable than trees** once kernels are involved.',
            '**Imbalanced classes:** the street can be pushed against the rare class. Use `class_weight="balanced"`.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'SVM', items: ['Uses only the boundary points (support vectors)', 'Maximises the margin; robust to far-away points', 'Scores are distances, not probabilities', 'Shines with many features and few rows', 'Curved boundaries via kernels'] }, right: { title: 'Logistic regression', items: ['Uses every point', 'Maximises likelihood of the labels', 'Gives well-calibrated probabilities', 'Scales easily to millions of rows', 'Coefficients are easy to explain as odds'] }, caption: 'Linear SVMs and logistic regression often reach similar accuracy. Choose logistic regression when you need probabilities and explanations; try an SVM when features are many and data is modest.' } },
        ],
      },
    ],
    faq: [
      { q: 'Why is it called a "machine" and what are "support vectors"?', a: 'The name is historical; "machine" just means a learning algorithm. Support vectors are the training points that sit on or inside the margin and hold the boundary in place.' },
      { q: 'Is a bigger C better?', a: 'No. Bigger C means fewer training errors but a narrower street, which often overfits. Choose C by cross-validation, typically trying values like 0.01, 0.1, 1, 10 and 100.' },
      { q: 'Can SVMs handle more than two classes?', a: 'Yes. scikit-learn\'s `SVC` trains one SVM for every pair of classes and lets them vote; `LinearSVC` trains one class against the rest. You do not need to do anything special.' },
      { q: 'Do SVMs output probabilities?', a: 'Not directly. They output signed distances. Use `probability=True` or `CalibratedClassifierCV` if you need probabilities.' },
      { q: 'What if my classes cannot be separated by a straight line?', a: 'Use the kernel trick, covered in the next chapter, which lets an SVM draw curved boundaries.' },
      { q: 'Does an SVM need scaled data?', a: 'Yes. The margin is a distance, and a feature measured in large units would dominate it. Put a scaler in the pipeline.' },
    ],
  },

  'kernel-svm': {
    minutes: 17,
    hook: 'Spread a tablecloth on a table and scatter red crumbs in the middle and blue crumbs around the edge. No straight cut through the cloth separates them. Now flick the cloth upwards from the centre: the red crumbs fly high and the blue ones barely lift. For an instant, a flat sheet of glass held at the right height would separate them perfectly. The **kernel trick** gives an SVM that flick: it lifts data into extra dimensions where a flat boundary works, and it does so without ever computing those dimensions.',
    sections: [
      {
        heading: 'The problem: when no straight line will do',
        blocks: [
          { p: 'The previous chapter\'s SVM draws the widest possible straight street between two classes. Plenty of real problems are not like that. A machine runs well inside a comfortable band of temperature and pressure and fails when either is too low **or** too high. Good customers sit in a middle band of spending, with both "dormant" and "overextended" customers outside it. The healthy region is an island, not a half of the chart.' },
          { term: 'Linearly separable', def: 'Data where a single straight line (or flat hyperplane, with more features) can put all of one class on one side and all of the other class on the other.' },
          { p: 'A linear SVM on island-shaped data is hopeless: on the classic "ring around a core" dataset it does no better than tossing a coin. We need curved boundaries, but we would like to keep everything good about SVMs: the widest street, the single best solution, the reliance on a few support vectors.' },
          { diagram: { kind: 'scatter', xLabel: 'temperature deviation (scaled)', yLabel: 'pressure deviation (scaled)', caption: 'Machine readings: blue normal operation near the centre, red faults all around it. Any straight line leaves normal and faulty points mixed on both sides. The true boundary is a circle.', points: [[0.76, 0.24, 0], [0.37, 0.71, 0], [-0.24, 0.76, 0], [-0.71, 0.37, 0], [-0.76, -0.24, 0], [-0.37, -0.71, 0], [0.24, -0.76, 0], [0.71, -0.37, 0], [0.1, 0.1, 0], [2.0, 0.0, 1], [1.91, 1.1, 1], [1.2, 2.08, 1], [0.0, 2.0, 1], [-1.1, 1.91, 1], [-2.08, 1.2, 1], [-2.0, 0.0, 1], [-1.91, -1.1, 1], [-1.2, -2.08, 1], [0.0, -2.0, 1], [1.1, -1.91, 1], [2.08, -1.2, 1]] } },
        ],
      },
      {
        heading: 'Building the intuition: lifting the data',
        blocks: [
          { p: 'Here is the key idea, with no formulas. If the data cannot be separated where it is, **add a new feature** that pulls the classes apart, and separate them in the bigger space.' },
          { steps: [
            '**Notice the pattern.** Normal readings are close to the centre; faults are far from it.',
            '**Invent a feature that measures it.** "Distance from the centre, squared" is small for normal readings and large for faults.',
            '**Add it as a third axis.** Picture each point lifted to a height equal to that new feature. The normal points stay low; the faults rise high.',
            '**Separate with something flat.** A horizontal sheet at the right height now separates the classes perfectly.',
            '**Look back down.** Where the flat sheet slices the lifted cloud, seen from above, is a circle. A flat boundary up there is a curved boundary down here.',
          ], title: 'The tablecloth flick, step by step' },
          { term: 'Feature map', def: 'A rule that turns the original features into a new, usually bigger, set of features (for example adding squares and products) so that a straight boundary in the new space becomes a curved one in the original.' },
          { p: 'The catch: for realistic problems we do not know which new features to invent, and the useful set may be enormous. With 100 original features, all products of pairs give 5,050 new features; all products of triples give 171,700. Building those columns is slow and memory-hungry.' },
          { think: { q: 'Why does adding the squared distance from the centre help, when it is computed only from the two features we already had?', a: 'Because a straight line can only combine features by weighting and adding them. It can never compute "x squared plus y squared" by itself. Giving it that quantity as a ready-made column lets a straight rule ("new feature below 1.5 means normal") express a circle.' } },
        ],
      },
      {
        heading: 'How the trick works, step by step',
        blocks: [
          { p: 'Here is the surprise that makes kernels practical. When an SVM is solved, the data only ever enters through **dot products** between pairs of points: one number per pair saying how aligned or similar they are. The individual coordinates are never needed on their own.' },
          { term: 'Dot product', def: 'Multiply two lists of numbers position by position and add the results. For (1, 2) and (3, 1): 1×3 + 2×1 = 5. Large when the two points point the same way; it acts as a similarity score.' },
          { term: 'Kernel', def: 'A function that takes two original data points and returns, directly and cheaply, the dot product they would have in some bigger feature space, without ever building that space.' },
          { diagram: { kind: 'flow', nodes: ['**Scale** the original features', 'Pick a **kernel** (RBF is the default)', 'Compute **kernel similarity** between pairs of points', '**Solve the SVM** using similarities only', 'Predict from **similarity to support vectors**'], caption: 'A kernel SVM never builds the big feature space. Every step works with pairwise similarities computed from the original features.' } },
          { p: '**Step 1: Scale** the features, as always with SVMs.' },
          { p: '**Step 2: Choose a kernel.** The RBF (Gaussian) kernel is the usual first choice; polynomial kernels are an alternative when you expect interactions of a fixed order.' },
          { p: '**Step 3: Solve.** The same widest-street optimisation runs, but every dot product is replaced by the kernel. The result is a set of support vectors, each with a weight.' },
          { p: '**Step 4: Predict.** For a new point, compute its kernel similarity to each support vector, weight these by the support vectors\' labels and weights, add them up and look at the sign.' },
          { callout: 'The kernel trick is the substitution itself: wherever the algorithm needs a dot product in the big space, plug in a cheap kernel calculation on the original features instead.', tone: 'key' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { tex: 'K(x, z) = \\varphi(x) \\cdot \\varphi(z)', plain: 'A kernel K gives the same number as first mapping both points into the bigger space with φ and then taking their dot product, but it skips the mapping.', symbols: [['K(x, z)', 'the kernel: a similarity between points x and z'], ['\\varphi(x)', 'the (possibly huge) feature map of x']] },
          { tex: 'K_{\\text{poly}}(x, z) = (x \\cdot z)^2', plain: 'The degree-2 polynomial kernel: take the ordinary dot product and square it. This equals the dot product after mapping each point to all its squares and pairwise products.' },
          { p: 'The workhorse is the **RBF kernel**, short for radial basis function. It measures similarity by distance: identical points score 1, and the score falls smoothly towards 0 as points move apart.' },
          { tex: 'K_{\\text{RBF}}(x, z) = \\exp\\left(-\\gamma \\lVert x - z \\rVert^2\\right)', plain: 'Square the distance between the two points, multiply by γ, flip the sign and take the exponential. Close points give values near 1, far points near 0.', symbols: [['\\gamma', 'gamma: how quickly similarity fades with distance'], ['\\lVert x - z \\rVert^2', 'squared straight-line distance between x and z'], ['\\exp', 'the exponential function, e raised to a power']] },
          { p: 'Remarkably, the feature space behind the RBF kernel has **infinitely many** dimensions, yet each kernel value costs one distance and one exponential.' },
          { tex: 'f(x) = \\sum_{i \\in SV} \\alpha_i \\, y_i \\, K(x_i, x) + b', plain: 'To score a new point x, add up its similarity to every support vector, each multiplied by that support vector\'s label (+1 or −1) and its learned weight α, then add b. Positive means class +1.', symbols: [['SV', 'the set of support vectors'], ['\\alpha_i', 'the learned weight of support vector i'], ['y_i', 'its label, +1 or −1']] },
          { p: 'Read that last formula as a vote. Each support vector pulls the new point towards its own class, with strength depending on how similar they are. Nearby support vectors shout; distant ones whisper. **Gamma** decides how quickly the voices fade.' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Lifting one-dimensional data', setup: 'Seven parts measured by deviation from target size (mm): −3, −2, −1, 0, 1, 2, 3. Parts within ±1 mm pass; the rest fail. Can a single threshold on x separate pass from fail?', steps: [
            'On the x line, failures sit on both sides of the passes. Any single cut leaves failures on the pass side. No threshold works.',
            'Add a feature: x². The values become 9, 4, 1, 0, 1, 4, 9.',
            'Passing parts have x² of 0 or 1; failing parts have 4 or 9.',
            'A single threshold on the new feature, x² = 2.5, separates them perfectly. A wide street runs between 1 and 4.',
            'Back in the original units, x² < 2.5 means −1.58 < x < 1.58: a two-sided rule from one flat cut.',
          ], result: 'Adding one curved feature turned an impossible straight-line problem into an easy one. Kernels do this automatically, for many features at once.' } },
          { diagram: { kind: 'scatter', xLabel: 'deviation x (mm)', yLabel: 'new feature x²', line: { m: 0, b: 2.5 }, caption: 'The seven parts lifted onto the curve y = x². Passes (blue) stay low, failures (red) rise high, and the flat line at 2.5 separates them. Straight in the lifted space; two cut-offs in the original.', points: [[-3, 9, 1], [-2, 4, 1], [-1, 1, 0], [0, 0, 0], [1, 1, 0], [2, 4, 1], [3, 9, 1]] } },
          { example: { title: 'Checking the trick with real numbers', setup: 'Two points x = (1, 2) and z = (3, 1). The degree-2 feature map is φ(a, b) = (a², √2·a·b, b²). Compare the long way and the kernel way.', steps: [
            'Long way: φ(x) = (1, 2√2, 4) ≈ (1, 2.83, 4). φ(z) = (9, 3√2, 1) ≈ (9, 4.24, 1).',
            'Dot product: 1×9 + (2√2)(3√2) + 4×1 = 9 + 12 + 4 = 25.',
            'Kernel way: x · z = 1×3 + 2×1 = 5. Square it: 5² = 25.',
            'Same answer. The kernel needed two multiplications and a square; the long way needed us to build three new features for each point first.',
            'With 100 original features the long way builds 5,050 features per point; the kernel still needs about 100 multiplications and a square.',
          ], result: 'The kernel computes similarity in the big space while staying in the small one. That is the whole trick.' } },
          { example: { title: 'How gamma changes an RBF vote', setup: 'A new point has squared distance 1 to support vector A (class +1) and squared distance 4 to support vector B (class −1). Both have weight α = 1 and b = 0. Compare γ = 0.5 and γ = 2.', steps: [
            'γ = 0.5: K(A) = e^(−0.5) ≈ 0.607; K(B) = e^(−2) ≈ 0.135. Score = 0.607 − 0.135 ≈ 0.471 → class +1.',
            'γ = 2: K(A) = e^(−2) ≈ 0.135; K(B) = e^(−8) ≈ 0.0003. Score ≈ 0.135 → still +1, but now B has essentially no say at all.',
            'For a point at squared distance 9: similarity is e^(−4.5) ≈ 0.011 with γ = 0.5, and e^(−18), about 0.00000002, with γ = 2.',
          ], result: 'Large gamma makes each support vector\'s influence very local, so the boundary can wrap tightly around individual points. Small gamma lets influence spread, giving smoother boundaries.' } },
          { diagram: { kind: 'curve', fn: 'Math.exp(-0.5*x*x)', fn2: 'Math.exp(-2*x*x)', xMin: 0, xMax: 4, xLabel: 'distance between points', yLabel: 'RBF similarity', legend: ['γ = 0.5', 'γ = 2'], caption: 'RBF similarity against distance. With γ = 2 similarity collapses to almost zero by distance 1.5; with γ = 0.5 points still influence each other at distance 2.5. Gamma is the reach of each support vector.' } },
        ],
      },
      {
        heading: 'Tuning C and gamma together',
        blocks: [
          { p: 'An RBF SVM has two settings that interact. **C**, as before, is the price of violations. **Gamma** is the reach of each point. Both control flexibility, so they must be tuned together, usually by a grid search on a log scale (0.001, 0.01, 0.1, 1, 10, 100) with cross-validation.' },
          { term: 'Grid search', def: 'Trying every combination of a few candidate values for each setting, scoring each combination by cross-validation, and keeping the best. In scikit-learn: `GridSearchCV`.' },
          { diagram: { kind: 'bars', labels: ['linear', 'γ=0.01', 'γ=0.1', 'γ=1', 'γ=10', 'γ=100', 'γ=1000'], values: [54.8, 60.2, 84.7, 89.2, 88.2, 88.2, 75.5], highlight: 3, yLabel: 'cross-validated accuracy %', caption: 'A real run on scikit-learn\'s noisy two-rings data (400 points, C = 1, 5-fold CV). Linear: a coin flip. Tiny gamma: too smooth to bend round the ring. γ = 1: best. γ = 1000: training accuracy hits 100% with 398 of 400 points as support vectors, but held-out accuracy falls to 75.5%. Pure memorisation.' } },
          { bullets: [
            '**Small gamma, small C:** very smooth boundary, close to linear. May underfit.',
            '**Large gamma, large C:** a boundary that wraps tiny islands around individual points. Overfits.',
            '**Sensible defaults:** scikit-learn\'s `gamma="scale"` sets gamma from the data\'s spread, a good starting point; then search around it.',
            '**Warning sign:** if nearly every training point is a support vector, gamma is probably too large.',
          ] },
        ],
      },
      {
        heading: 'Kernel SVMs in the real world',
        blocks: [
          { case: { title: 'Handwritten digit recognition', story: 'In the late 1990s, kernel SVMs were among the most accurate methods on the MNIST benchmark of handwritten digits, competitive with the neural networks of the day, as shown in published comparisons of that period. Each 28 × 28 pixel image is a point with 784 features; polynomial and RBF kernels captured the curved, non-linear differences between a 4 and a 9 without anyone designing those features by hand. Deep convolutional networks later overtook them on images, but the episode established kernel methods as a serious, principled tool.' } },
          { bullets: [
            '**Process monitoring (illustrative):** an RBF SVM learns the curved region of "healthy" combinations of temperature, pressure and flow on a paint line, flagging readings outside it.',
            '**Bioinformatics:** specialised kernels compare protein or DNA sequences directly, without turning them into tables.',
            '**Small-data classification:** with a few hundred to a few thousand labelled examples and curved boundaries, an RBF SVM is often among the best off-the-shelf choices.',
            '**One-class SVM:** a kernel variant trained only on normal data, used for anomaly detection.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Scaling is mandatory.** RBF similarity is built on distance; an unscaled rupee column makes every other feature irrelevant.',
            '**Poor scaling to big data.** The kernel needs a similarity for every pair of points: 100,000 rows means 10 billion pairs. Beyond tens of thousands of rows, use gradient boosting, a linear model with approximate kernel features (`Nystroem`, `RBFSampler`), or a neural network.',
            '**Overfitting via gamma.** Large gamma with large C memorises the training set.',
            '**Hard to explain.** The model is a weighted sum of similarities to support vectors, not a set of readable coefficients.',
            '**Choosing the kernel** is itself a modelling decision; start with RBF and only switch with a reason.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'Kernel SVM fits when…', items: ['Boundaries are curved', 'Rows: hundreds to tens of thousands', 'Features are numeric and scaled', 'You can afford a C × gamma grid search', 'Accuracy matters more than explanation'] }, right: { title: 'Prefer instead…', items: ['Large tabular data → **gradient boosting**', 'Need readable rules → **decision tree**', 'Need calibrated probabilities → **logistic regression** with engineered features', 'Images, audio, text at scale → **neural networks**', 'Mostly linear data → **linear SVM**'] }, caption: 'Kernels are a powerful idea; a kernel SVM is one specific tool with a sweet spot of small-to-medium, curved problems.' } },
        ],
      },
    ],
    faq: [
      { q: 'Does the kernel trick actually create new features?', a: 'No, and that is the point. It computes the similarities those features would produce, directly from the original features. The big space is never built.' },
      { q: 'Which kernel should I start with?', a: 'RBF. It handles a wide range of curved boundaries. Use linear when you have many features (such as text) and polynomial when you expect interactions of a known order.' },
      { q: 'What do C and gamma do, in one line each?', a: 'C is the price of training errors: higher means a tighter fit. Gamma is each point\'s reach: higher means more local, wigglier boundaries.' },
      { q: 'Why is my RBF SVM 100% accurate on training data but poor on test data?', a: 'Gamma (and possibly C) is too large, so the model has wrapped a tiny island around each training point. Lower them and choose by cross-validation.' },
      { q: 'Is the kernel trick only for SVMs?', a: 'No. Any method that uses data only through dot products can be "kernelised", including kernel PCA, kernel ridge regression and Gaussian processes.' },
      { q: 'How many rows is too many?', a: 'As a rule of thumb, kernel `SVC` becomes slow somewhere in the tens of thousands of rows and impractical beyond a few hundred thousand. Use approximate kernels or other models there.' },
    ],
  },

  lda: {
    minutes: 16,
    hook: 'A photographer is asked to capture two crowds, supporters of rival cricket teams, in one picture so that viewers can instantly tell them apart. From some angles the crowds overlap into one blur. From the right angle they appear as two distinct groups with a clear gap between them. **Linear Discriminant Analysis** finds that best camera angle for data: the direction along which the classes look furthest apart compared with how spread out each one is. Then it classifies new points by which side of the gap they fall on.',
    sections: [
      {
        heading: 'The problem: separating classes, and seeing them',
        blocks: [
          { p: 'LDA answers two business needs at once. First, **classification**: is this company likely to go bankrupt, is this applicant likely to default? Second, **simplification**: we have 13 chemical measurements of wine samples, or 30 financial ratios per company, and we want a 1- or 2-dimensional view in which the groups are clearly visible on a chart for a management presentation.' },
          { p: 'The method goes back to the statistician Ronald Fisher, who in 1936 used it to tell iris species apart from flower measurements. It remains a fast, stable, well-understood classifier, especially when data is limited.' },
          { term: 'Projection', def: 'Squashing data onto a line (or a plane) by recording only the position of each point\'s "shadow" along that line. A 2-feature point becomes a single number.' },
          { term: 'Discriminant', def: 'A score computed from the features whose job is to discriminate, that is, to tell the classes apart. LDA\'s discriminant is a weighted sum of features.' },
          { diagram: { kind: 'scatter', xLabel: 'feature 1', yLabel: 'feature 2', line: { m: 1.25, b: -1.25 }, caption: 'Two classes of three points each (blue and red). Projected straight down onto feature 1 alone, both classes contain the value 3, so they overlap. LDA finds a better direction, and its boundary (the line) separates them cleanly.', points: [[1, 2, 0], [2, 4, 0], [3, 3, 0], [3, 1, 1], [4, 3, 1], [5, 2, 1]] } },
        ],
      },
      {
        heading: 'Building the intuition: the best camera angle',
        blocks: [
          { p: 'Imagine two clouds of points as two crowds standing in a field, viewed from a drone. You may photograph them only from the side, so the picture squashes everyone onto one horizontal line. Which side should you shoot from?' },
          { steps: [
            '**Walk around the field.** From each angle, note where each crowd\'s centre appears in the photo.',
            '**Look for distance between centres.** You want the two centres far apart in the photo.',
            '**But also look at width.** If each crowd is smeared widely across the photo, even far-apart centres leave the crowds overlapping.',
            '**Pick the angle with the best ratio:** big gap between centres, compared with how wide each crowd looks.',
            '**Draw a cut** in the middle of the gap. Anyone left of the cut belongs to crowd A, right of it to crowd B.',
          ], title: 'Choosing the camera angle' },
          { term: 'Between-class spread', def: 'How far apart the class centres (averages) are. LDA wants this large.' },
          { term: 'Within-class spread', def: 'How scattered the points of each class are around their own centre. LDA wants this small, once projected.' },
          { think: { q: 'Why not simply choose the direction where the two class centres are furthest apart?', a: 'Because the crowds might be long and thin, stretched along that very direction. Centres far apart mean little if each crowd is even more spread out along the same line. LDA considers the spread too, and can prefer an angle where centres are a bit closer but each crowd looks much narrower.' } },
          { callout: 'PCA, which you may meet elsewhere, picks the angle where the **whole** dataset looks most spread out, ignoring labels. LDA uses the labels and picks the angle where the **classes** look most separated. Different goals, often very different answers.', tone: 'key' },
        ],
      },
      {
        heading: 'How it works, step by step',
        blocks: [
          { diagram: { kind: 'flow', nodes: ['Compute each **class mean**', 'Measure **within-class spread** (pooled covariance)', 'Find the **direction** maximising gap ÷ spread', '**Project** data onto it', '**Classify** by nearest class, adjusted for priors'], caption: 'LDA training is a few averages and one matrix calculation; no iterative search is needed, so it is very fast.' } },
          { p: '**Step 1: Class means.** For each class, average every feature. This gives one centre point per class.' },
          { p: '**Step 2: Within-class spread.** For each class, measure how its points scatter around its own mean, including how features move together. LDA assumes every class has the same shape of scatter, so these are pooled into one shared measure.' },
          { term: 'Covariance', def: 'A measure of how two features move together. Positive if they tend to rise together, negative if one rises as the other falls. A covariance matrix lists this for every pair of features, plus each feature\'s own variance.' },
          { p: '**Step 3: Best direction.** Solve for the direction that maximises the ratio of between-class spread to within-class spread. There is a neat formula, shown in the next section.' },
          { p: '**Step 4: Project.** Each point gets one number: its position along the best direction. With more than two classes, LDA finds up to (number of classes − 1) directions.' },
          { p: '**Step 5: Classify.** Assign a new point to the class whose projected centre it is closest to, nudged towards classes that are more common (the prior). Equivalently, LDA computes the probability of each class assuming bell-curve shaped classes and picks the highest.' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { p: 'Fisher\'s idea is a single ratio. For a candidate direction w, project the data; measure the squared gap between projected class means; divide by the projected within-class spread.' },
          { tex: 'J(w) = \\frac{\\big(w^{\\top}(\\mu_A - \\mu_B)\\big)^2}{w^{\\top} S_W \\, w}', plain: 'Top: the squared distance between the two class centres after projecting onto w. Bottom: the total spread within the classes after projecting. LDA picks the w that makes this ratio as large as possible.', symbols: [['w', 'the direction we project onto'], ['\\mu_A, \\mu_B', 'the mean feature vectors of classes A and B'], ['S_W', 'the within-class scatter matrix: pooled spread of each class around its own mean'], ['w^{\\top}', 'w written as a row, used to take dot products']] },
          { p: 'Calculus gives a closed-form answer: no search required.' },
          { tex: 'w \\propto S_W^{-1} (\\mu_A - \\mu_B)', plain: 'Start from the arrow joining the two class means, then correct it by "dividing" by the within-class spread. The correction turns the direction away from axes along which the classes are widely spread.', symbols: [['S_W^{-1}', 'the inverse of the scatter matrix, the matrix version of dividing'], ['\\propto', 'proportional to: only the direction matters, not the length']] },
          { p: 'For classification, LDA takes a probability view. It assumes each class follows a normal (bell-curve) distribution with its own mean but a **shared** spread. With one feature x, the score for class k is:' },
          { tex: '\\delta_k(x) = \\frac{x\\,\\mu_k}{\\sigma^2} - \\frac{\\mu_k^2}{2\\sigma^2} + \\ln \\pi_k', plain: 'Each class gets a score that is a straight-line function of x, plus a bonus for being common (the log of its prior). Predict the class with the highest score. Because the scores are linear in x, the boundaries are straight: hence "linear" discriminant analysis.', symbols: [['\\mu_k', 'mean of class k'], ['\\sigma^2', 'the shared variance'], ['\\pi_k', 'prior probability (share) of class k'], ['\\ln', 'natural logarithm']] },
          { tex: 'x^{*} = \\frac{\\mu_1 + \\mu_2}{2} + \\frac{\\sigma^2 \\ln(\\pi_2 / \\pi_1)}{\\mu_1 - \\mu_2}', plain: 'The cut-off between two classes is the midpoint of their means, shifted towards the rarer class. With equal priors the log term is zero and the cut is exactly in the middle.' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Credit default by debt-to-income ratio (illustrative)', setup: 'A lender uses one feature: debt-to-income ratio (DTI, %). Repaid customers average 30%, defaulters 50%, both with SD 10 percentage points. 80% of customers repay. An applicant has DTI 44%.', steps: [
            'Equal priors: cut-off = (30 + 50) / 2 = 40%. The applicant (44%) is above it → predict default.',
            'With equal priors, the default probability at 44% works out to about 0.69.',
            'Real priors: π(repaid) = 0.8, π(default) = 0.2. Shift = 10² × ln(0.2 / 0.8) / (30 − 50) = 100 × (−1.386) / (−20) ≈ +6.93.',
            'New cut-off ≈ 40 + 6.93 = 46.93%. The applicant (44%) is now below it → predict repaid.',
            'With real priors the default probability at 44% is about 0.36.',
          ], result: 'Because defaults are rare, LDA demands stronger evidence before calling one: the cut-off moves from 40% to about 46.9%. If a missed default costs far more than a lost good customer, the lender can still set a lower decision threshold on the probability.' } },
          { diagram: { kind: 'curve', fn: 'Math.exp(-Math.pow(x-30,2)/200)', fn2: 'Math.exp(-Math.pow(x-50,2)/200)', xMin: 0, xMax: 80, marks: [{ x: 40, label: 'equal priors 40%' }, { x: 46.93, label: 'with priors 46.9%' }], xLabel: 'debt-to-income ratio (%)', yLabel: 'relative likelihood', legend: ['repaid', 'defaulted'], caption: 'The two bell curves LDA assumes for repaid and defaulted customers, with the same width. Equal priors cut where the curves cross (40%); taking into account that 80% repay pushes the cut towards the rarer defaulters.' } },
          { example: { title: 'Finding Fisher\'s direction by hand', setup: 'Class A: (1, 2), (2, 4), (3, 3). Class B: (3, 1), (4, 3), (5, 2). These are the six points in the first diagram.', steps: [
            'Means: μA = (2, 3), μB = (4, 2). Difference μA − μB = (−2, 1).',
            'Within-class scatter: each class has deviations (−1, −1), (0, 1), (1, 0) from its mean, giving the matrix [[2, 1], [1, 2]] per class. Pooled: S_W = [[4, 2], [2, 4]].',
            'Inverse: S_W⁻¹ = (1/12) × [[4, −2], [−2, 4]]. Then w = (1/12) × (4×(−2) − 2×1, −2×(−2) + 4×1) = (1/12) × (−10, 8). Any multiple works; use w = (−5, 4).',
            'Project (score = −5 × feature 1 + 4 × feature 2). Class A: 3, 6, −3. Class B: −11, −8, −17.',
            'Projected means: A = 2, B = −12. Cut-off at the midpoint, −5. Every A point is above −5 and every B point below it.',
            'Compare: projected onto feature 1 alone, A = {1, 2, 3} and B = {3, 4, 5} overlap at 3. Fisher\'s ratio is 1.0 along feature 1 and about 2.33 along (−5, 4).',
          ], result: 'LDA\'s direction separates the classes perfectly where either original feature alone fails. The boundary −5x₁ + 4x₂ = −5 is the line drawn in the first diagram.' } },
          { example: { title: 'Reducing 13 wine measurements to a 2-D chart', setup: 'scikit-learn\'s wine dataset has 178 wines from 3 cultivars, each with 13 chemical measurements. How many LDA directions can we get, and what do we see?', steps: [
            'With 3 classes, LDA finds at most 3 − 1 = 2 directions, whatever the number of features.',
            '`LinearDiscriminantAnalysis(n_components=2).fit_transform(X, y)` turns the 178 × 13 table into 178 × 2.',
            'Plotted on those two axes, the three cultivars form three clearly separated clouds.',
            'As a classifier on all 13 features, LDA scores about 97% accuracy in 5-fold cross-validation on this dataset.',
          ], result: 'Thirteen numbers per wine become two, chosen specifically to keep the cultivars apart: ideal for a one-slide visual summary.' } },
        ],
      },
      {
        heading: 'Assumptions, and how LDA relates to its cousins',
        blocks: [
          { p: 'LDA is a **generative** classifier: it models what each class\'s data looks like (a bell curve with a shared shape) and then uses Bayes\' theorem to classify. Its accuracy depends on these assumptions being roughly true.' },
          { bullets: [
            '**Roughly normal features within each class.** Check histograms per class; transform skewed features such as income with a log.',
            '**Similar spread in every class.** If one class is far more scattered, the shared-covariance assumption breaks.',
            '**No extreme outliers.** Means and covariances are sensitive to them.',
            '**Features not perfect copies of each other.** Perfect duplicates make S_W impossible to invert; use `solver="lsqr", shrinkage="auto"` to stabilise.',
          ] },
          { diagram: { kind: 'table', head: ['Method', 'Uses labels?', 'Boundary', 'Main assumption', 'Best for'], rows: [['PCA', 'No', 'None (not a classifier)', 'High variance = important', 'Compression, visualisation'], ['LDA', 'Yes', 'Straight', 'Normal classes, shared spread', 'Small data, class-separating views'], ['QDA', 'Yes', 'Curved', 'Normal classes, own spread', 'Classes with different shapes'], ['Logistic regression', 'Yes', 'Straight', 'Log-odds linear in features', 'Calibrated probabilities, larger data']], caption: 'LDA sits between PCA (unsupervised) and logistic regression (no distribution assumptions). QDA relaxes the shared-spread assumption at the cost of many more parameters.' } },
          { callout: 'LDA and logistic regression both draw straight boundaries. LDA is more efficient with small samples when its normality assumptions hold; logistic regression is safer when they do not.', tone: 'tip' },
        ],
      },
      {
        heading: 'LDA in the real world',
        blocks: [
          { case: { title: 'Predicting corporate bankruptcy', story: 'In 1968 Edward Altman published the Z-score, built with multiple discriminant analysis, the family of methods LDA belongs to. It combines five financial ratios of a company, including working capital to total assets, retained earnings to total assets and earnings before interest and taxes to total assets, into a single weighted score. Firms below one cut-off were flagged as likely to fail, firms above another as safe, with a grey zone in between. The Z-score became one of the best-known tools in credit analysis and is still taught and quoted today, a direct example of a discriminant score used for business decisions.' } },
          { bullets: [
            '**Face recognition:** "Fisherfaces" (1997) applied LDA to face images so that differences between people were emphasised over differences in lighting.',
            '**Marketing:** projecting survey answers onto discriminant axes that separate brand-loyal and switching customers.',
            '**Quality control (illustrative):** separating three grades of steel from a dozen composition measurements, and plotting batches on two discriminant axes.',
            '**Preprocessing:** reducing many features to (classes − 1) before k-NN or other classifiers.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**At most (classes − 1) components.** A two-class problem gives exactly one LDA direction, however many features you have.',
            '**Straight boundaries only.** Ring-shaped or island-shaped classes need QDA, kernel methods or trees.',
            '**Sensitive to outliers and skewed features.** Clean and transform first.',
            '**Many features, few rows** make the covariance unreliable; use shrinkage.',
            '**Probabilities can be overconfident** when the normality assumption is badly wrong.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'LDA', items: ['Supervised: uses class labels', 'Maximises separation between classes', 'At most (classes − 1) components', 'Also a classifier', 'Best view for telling classes apart'] }, right: { title: 'PCA', items: ['Unsupervised: ignores labels', 'Maximises total variance', 'Up to (number of features) components', 'Not a classifier', 'Best view for overall structure and compression'] }, caption: 'Both find directions to project onto. Ask yourself: do I want to see the classes apart (LDA) or the data\'s main variation (PCA)?' } },
        ],
      },
    ],
    faq: [
      { q: 'Is this the same LDA as topic modelling?', a: 'No. Latent Dirichlet Allocation, used to find topics in text, shares the initials but is a completely different method. In classification, LDA means Linear Discriminant Analysis.' },
      { q: 'How many dimensions can LDA reduce to?', a: 'At most the number of classes minus one. Two classes give one direction; three classes give two.' },
      { q: 'Does LDA need scaled features?', a: 'Its classifications do not change with scaling, because it accounts for each feature\'s spread. Scaling still helps when you want to compare the size of the discriminant weights.' },
      { q: 'When should I choose LDA over logistic regression?', a: 'When data is small and features are roughly normal with similar spread in each class, LDA is often a little more accurate and very stable. With larger or clearly non-normal data, logistic regression is the safer default.' },
      { q: 'What is QDA?', a: 'Quadratic Discriminant Analysis. It lets each class have its own spread, which produces curved boundaries. It needs more data, because it estimates a separate covariance matrix per class.' },
      { q: 'Why is LDA called "generative"?', a: 'Because it models how each class generates its data (a bell curve) and then uses Bayes\' theorem to classify. Logistic regression is "discriminative": it models the class probability directly without describing the data.' },
    ],
  },
};
