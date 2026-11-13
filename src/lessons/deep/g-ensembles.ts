import { DeepLesson } from './types';

// ENSEMBLES & NEURAL NETWORKS: bagging, random-forest, adaboost, gradient-boosting, xgboost, stacking, perceptron, mlp.
// All worked-example arithmetic verified with Python.
export const ENSEMBLES_DEEP: Record<string, DeepLesson> = {
  bagging: {
    minutes: 17,
    hook: 'In 1906 the scientist Francis Galton visited a country fair where about 800 people paid to guess the weight of an ox. Individual guesses were all over the place, but the middle of the crowd\'s guesses landed remarkably close to the true weight. No single villager was an expert; the crowd was. **Bagging** applies the same trick to machine learning: train many slightly different models and let them vote.',
    sections: [
      {
        heading: 'The problem: models that change their mind too easily',
        blocks: [
          { p: 'Imagine a retail analytics team building a **decision tree** to predict next week\'s demand at each store. They train it on last year\'s data and it looks brilliant. Then a colleague retrains it after removing just 20 rows out of 10,000, and the tree looks completely different: a different first question, different branches, different forecasts. Which tree should the business trust?' },
          { term: 'Decision tree', def: 'A model that makes a prediction by asking a sequence of yes/no questions about the input ("Is the store in a metro city? Is it a festival week?") and reading off the answer at the end of the path.' },
          { p: 'This jumpiness has a name: **high variance**. A high-variance model is very sensitive to the exact training rows it happened to see. Deep decision trees are the classic example. They can memorise small quirks of the data, so small changes in the data produce big changes in the model.' },
          { term: 'Variance (of a model)', def: 'How much a model\'s predictions would change if you trained it on a different sample of data from the same source. High variance means the model is unstable and tends to overfit.' },
          { term: 'Overfitting', def: 'When a model learns the noise and accidents of its training data rather than the real pattern, so it looks excellent on old data and disappoints on new data.' },
          { p: 'In 1996 the statistician Leo Breiman proposed a simple fix. If one tree is unstable, build **many** trees, each on a slightly different version of the data, and **average** them. The individual wobbles point in different directions and largely cancel out. He called the method **bagging**, short for **b**ootstrap **agg**regat**ing**.' },
          { diagram: { kind: 'scatter', xLabel: 'week number', yLabel: 'forecast (units)', caption: 'Forecasts for the same store from three trees trained on slightly different samples (colours 0, 1, 2) jump around a lot. Their average (orange) is much smoother. That smoothing is the whole point of bagging.', points: [[1, 108, 0], [2, 125, 0], [3, 98, 0], [4, 131, 0], [1, 92, 1], [2, 110, 1], [3, 121, 1], [4, 104, 1], [1, 115, 2], [2, 101, 2], [3, 112, 2], [4, 122, 2], [1, 105, 3], [2, 112, 3], [3, 110, 3], [4, 119, 3]] } },
        ],
      },
      {
        heading: 'Building the intuition: many reporters, one story',
        blocks: [
          { p: 'Picture a newspaper editor who wants an accurate account of a busy street festival. She could send one reporter, but that reporter only sees the corner where they happen to stand. Instead she sends twenty reporters, each to a slightly different set of spots, some overlapping. Each report is incomplete and a little biased by where that reporter stood.' },
          { steps: [
            '**Each reporter sees a random slice of the festival.** Some spots are visited by several reporters, some by none.',
            '**Each writes an honest but partial story.** Every story has its own mistakes.',
            '**The editor combines them.** Where most reporters agree, she is confident. Where one reporter says something odd that nobody else saw, it gets outvoted.',
            '**The final story is more reliable than any single report,** even though no new reporter was smarter than the others.',
          ], title: 'How the editor gets a reliable story' },
          { p: 'In bagging, each reporter is a model, each "slice of the festival" is a random resample of the training data, and the editor is a simple average (for numbers) or a majority vote (for categories).' },
          { think: { q: 'If all twenty reporters stood at exactly the same corner, would combining their stories help?', a: 'Hardly at all. They would all make the same mistakes, so averaging would not cancel anything. Combining only helps when the individual errors are different. Bagging creates that difference by giving each model a different random sample.' } },
          { callout: 'Averaging only cancels errors that point in different directions. Bagging\'s job is to make the models different enough that their errors disagree.', tone: 'key' },
        ],
      },
      {
        heading: 'How bagging works, step by step',
        blocks: [
          { p: 'The key ingredient is the **bootstrap sample**, a way to manufacture many "new" datasets from the one you have.' },
          { term: 'Bootstrap sample', def: 'A new dataset of the same size as the original, made by picking rows at random **with replacement**. Some rows get picked twice or more, and some are not picked at all.' },
          { term: 'With replacement', def: 'After picking a row, you put it back before picking again, so the same row can be picked several times. Like drawing a raffle ticket, noting the number, and dropping it back in the bowl.' },
          { steps: [
            '**Choose B**, the number of models (for example 100).',
            '**Draw a bootstrap sample** of n rows from your n training rows.',
            '**Train one model** (usually a deep, unpruned decision tree) on that sample.',
            '**Repeat steps 2 and 3** until you have B models.',
            '**Predict** for a new case by asking all B models and combining: average for regression, majority vote (or average probability) for classification.',
          ], title: 'The bagging procedure' },
          { diagram: { kind: 'flow', nodes: ['**Original data** (n rows)', '**B bootstrap samples**, each n rows drawn with replacement', '**Train B models** independently (can run in parallel)', '**Each model predicts** the new case', '**Average or vote** → final prediction'], caption: 'Bagging in one picture. Because each model is trained independently, the B models can be built at the same time on different processor cores.' } },
          { p: 'Notice that the models never talk to each other. That makes bagging **embarrassingly parallel**: with 8 processor cores you can train 8 trees at once. In scikit-learn, `n_jobs=-1` uses every core.' },
          { p: 'A pleasant side effect: every bootstrap sample leaves out roughly a third of the rows. Those left-out rows are called **out-of-bag** rows, and they give you a free test set for each model.' },
          { term: 'Out-of-bag (OOB) rows', def: 'The training rows that a particular bootstrap sample did not include. The model trained on that sample has never seen them, so they can be used to test it fairly.' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { p: 'Two questions deserve a formula. How many rows does a bootstrap sample leave out? And exactly how much does averaging reduce variance?' },
          { p: '**Left-out rows.** On a single draw, the chance a particular row is not picked is (1 − 1/n). We draw n times independently, so the chance it is never picked is that number multiplied by itself n times.' },
          { tex: 'P(\\text{row never picked}) = \\left(1 - \\frac{1}{n}\\right)^{n} \\approx e^{-1} \\approx 0.368', plain: 'For a reasonably large dataset, about 36.8% of rows are left out of each bootstrap sample, and about 63.2% appear at least once.', symbols: [['n', 'number of rows in the training data'], ['e', 'the constant 2.718…, which appears naturally in repeated-chance problems']] },
          { p: '**Variance reduction.** Suppose each model\'s prediction has variance σ², and any two models\' errors have correlation ρ (rho), a number between 0 (completely unrelated errors) and 1 (identical errors). Averaging B such models gives this variance:' },
          { term: 'Correlation (between models)', def: 'A number from −1 to 1 measuring how much two models tend to make the same mistakes. Near 1: when one is too high, so is the other. Near 0: their mistakes are unrelated.' },
          { tex: '\\operatorname{Var}(\\bar{f}) = \\rho\\,\\sigma^2 + \\frac{1 - \\rho}{B}\\,\\sigma^2', plain: 'The variance of the average has two parts. The first part, ρσ², is shared error that no amount of averaging can remove. The second part shrinks as you add more models B.', symbols: [['\\bar{f}', 'the averaged (bagged) prediction'], ['\\sigma^2', 'variance of one model'], ['\\rho', 'correlation between two models\' errors'], ['B', 'number of models averaged']] },
          { p: 'Read this formula slowly, because it explains the whole family of methods in this chapter group. Adding models (bigger B) kills the second term, but the first term stays. **To go further you must lower ρ, the correlation between models.** Random forests, which you will meet next, exist precisely to push ρ down.' },
          { callout: 'Bagging reduces **variance**, not **bias**. If every tree is systematically wrong in the same way (say, too simple to capture the pattern), averaging 1,000 of them is still wrong in that way.', tone: 'warn' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'A bootstrap sample by hand', setup: 'Five weekly sales figures (units): A = 10, B = 12, C = 14, D = 30, E = 16. Draw one bootstrap sample of size 5.', steps: [
            'Roll a five-sided die five times. Suppose the rolls pick rows B, D, D, A, E.',
            'The bootstrap sample is {12, 30, 30, 10, 16}. Row D appears twice; row C is missing.',
            'Row C is out-of-bag for this sample. The model trained on it can be tested on C.',
            'Chance that a given row is left out with n = 5: (4/5)⁵ = 0.32768, about 33%. For n = 1,000 it is (0.999)¹⁰⁰⁰ ≈ 0.368.',
          ], result: 'Each bootstrap sample is a slightly distorted copy of the data: some rows count double, some vanish. That distortion is what makes each model different.' } },
          { example: { title: 'How much does averaging help?', setup: 'Each deep tree has prediction variance σ² = 100 (units²). Two trees\' errors have correlation ρ = 0.3. Compare 1, 10, 50 and 100 trees.', steps: [
            'B = 1: 0.3 × 100 + 0.7 × 100 / 1 = 30 + 70 = 100.',
            'B = 10: 30 + 70 / 10 = 30 + 7 = 37.',
            'B = 50: 30 + 70 / 50 = 30 + 1.4 = 31.4.',
            'B = 100: 30 + 70 / 100 = 30.7.',
            'If the trees were completely uncorrelated (ρ = 0), 50 trees would give 0 + 100 / 50 = 2.',
          ], result: 'Going from 1 to 50 trees cuts variance from 100 to 31.4, a 69% drop, but it can never fall below 30 while ρ = 0.3. Lower correlation is the next lever.' } },
          { diagram: { kind: 'bars', labels: ['1 tree', '10 trees', '50 trees', '100 trees', 'ρ = 0, 50 trees'], values: [100, 37, 31.4, 30.7, 2], highlight: 2, yLabel: 'variance of prediction', caption: 'Most of the benefit arrives with the first few dozen models. After that the floor ρσ² = 30 dominates. Only decorrelating the models (last bar) breaks through it.' } },
          { example: { title: 'Business case: festival demand at a sweet shop chain (illustrative)', setup: 'A chain of sweet shops forecasts Diwali-week demand for kaju katli at one outlet. Three bagged trees predict 120 kg, 95 kg and 110 kg. A second question asks whether the outlet will run out of stock: five classification trees vote Yes, No, Yes, Yes, No.', steps: [
            'Regression: average = (120 + 95 + 110) / 3 = 325 / 3 ≈ 108.3 kg.',
            'Classification: 3 votes Yes, 2 votes No → majority says Yes, stock-out likely.',
            'Probability-style answer: 3 / 5 = 0.6, a 60% estimated chance of stock-out.',
            'Decision: the planner orders about 110 kg plus a safety buffer, because a stock-out during Diwali costs more than leftover sweets.',
          ], result: 'The bagged forecast of about 108 kg is less exposed to any single tree\'s quirk than a lone tree that might have said 95 or 120.' } },
        ],
      },
      {
        heading: 'Out-of-bag error: a free validation set',
        blocks: [
          { p: 'Normally you must hold back part of the data to test a model. Bagging gives you a cleverer option. For each training row, about a third of the trees never saw it. Ask only those trees to predict that row, and compare with the truth. Do this for every row and you get the **OOB error**, an honest estimate of performance on new data without sacrificing any rows.' },
          { diagram: { kind: 'table', head: ['Row', 'Trees that saw it', 'Trees that did not (OOB)', 'OOB prediction', 'Actual'], rows: [['Store 1', '63', '37', 'avg of 37 trees = 104', '100'], ['Store 2', '61', '39', 'avg of 39 trees = 87', '92'], ['Store 3', '66', '34', 'avg of 34 trees = 140', '151']], caption: 'With 100 trees, each row is out-of-bag for roughly 37 of them. Their combined prediction is a fair test because those trees never trained on that row. Numbers are illustrative.' } },
          { p: 'In scikit-learn you switch this on with `oob_score=True` in `BaggingRegressor`, `BaggingClassifier` or the random forest classes, then read `model.oob_score_` after fitting.' },
          { callout: 'OOB error is usually close to a cross-validation estimate and costs almost nothing extra. Use it for quick tuning, but still keep a final untouched test set, especially when rows are ordered in time.', tone: 'tip' },
        ],
      },
      {
        heading: 'Bagging in the real world',
        blocks: [
          { case: { title: 'Credit risk scoring at a lender (illustrative, based on common practice)', story: 'A non-banking finance company predicts which two-wheeler loan applicants will miss three EMIs in a row. A single decision tree kept changing its top rules every month as new applications arrived, which made the credit policy team nervous. Switching to a bagged ensemble of 200 trees made the scores stable from month to month: the same applicant received nearly the same score even when the training data was refreshed. Accuracy improved modestly, but the bigger win was trust. Risk officers could explain that the score was the average opinion of 200 models, and the OOB error gave them a performance number without setting aside scarce default cases.' } },
          { bullets: [
            '**Random forests**, the most popular bagging method, are used everywhere from churn prediction to sensor-based fault detection.',
            '**Bagging other models:** you can bag k-nearest neighbours or neural networks too, though trees benefit most because they are so unstable.',
            '**Uncertainty estimates:** the spread of the B individual predictions gives a rough sense of how confident the ensemble is for a particular case.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**It does not fix bias.** Bagging shallow, too-simple models gives a stable but still poor model. Bag deep, flexible trees instead.',
            '**It helps stable models very little.** Linear regression barely changes between bootstrap samples, so bagging it adds computation without much gain.',
            '**It loses easy interpretability.** One tree can be drawn on a slide; 200 trees cannot. Use feature importance or SHAP values to explain the ensemble.',
            '**Correlated trees limit the gain.** If one feature is very strong, every tree splits on it first and the trees look alike. Random forests address this.',
            '**Memory and speed.** Storing and querying hundreds of deep trees takes more memory and prediction time than one tree.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'Bagging is a good choice when…', items: ['Your base model is unstable (deep trees)', 'You want a quick variance fix with almost no tuning', 'You have many cores and want parallel training', 'You want a free OOB performance estimate'] }, right: { title: 'Look elsewhere when…', items: ['Trees are too correlated → **Random forest**', 'The model is too simple (high bias) → **Boosting**', 'You need one readable rule set → a single pruned tree', 'The base model is already stable → skip bagging'] }, caption: 'Bagging is the foundation; random forests and boosting each fix one of its limits.' } },
        ],
      },
    ],
    faq: [
      { q: 'Does bagging make a model more accurate or just more stable?', a: 'Both, through the same route. Lower variance means fewer wild predictions on new data, which usually shows up as better test accuracy. It does not make the model smarter about patterns it was too simple to learn.' },
      { q: 'How many models should I bag?', a: 'Start with 100 to 500. Accuracy improves quickly at first and then levels off. Adding more models never causes overfitting in bagging; it only costs time and memory.' },
      { q: 'Why sample with replacement instead of just splitting the data into chunks?', a: 'Sampling with replacement keeps every model\'s training set as large as the original, so each model is as strong as possible, while still making the samples different. Splitting into chunks would give each model far less data.' },
      { q: 'Is bagging the same as a random forest?', a: 'A random forest is bagging of decision trees plus one extra trick: each split may only consider a random subset of features. That makes the trees less alike and the average better.' },
      { q: 'Can I use bagging for classification?', a: 'Yes. Each model votes for a class, and the majority wins. scikit-learn actually averages the predicted probabilities (soft voting) when the base model provides them, which tends to work slightly better.' },
      { q: 'Should I prune the trees inside a bagging ensemble?', a: 'Usually not. Deep, unpruned trees have low bias and high variance, and bagging is excellent at removing variance. Pruning would add bias that bagging cannot remove.' },
    ],
  },

  'random-forest': {
    minutes: 15,
    hook: 'A telecom company asks 500 analysts to predict which customers will leave next month. If every analyst reads the same single report first, they all reach the same conclusion and make the same mistakes. Now give each analyst a random handful of reports at every decision. Their opinions become more varied, and the group verdict becomes sharper. That small twist on bagging is the **random forest**, one of the most reliable models in all of machine learning.',
    sections: [
      {
        heading: 'The problem: bagged trees that think alike',
        blocks: [
          { p: 'In the bagging chapter you learned that averaging many trees reduces variance, but only down to a floor set by how **correlated** the trees are. If the trees all make similar mistakes, averaging cannot cancel them.' },
          { p: 'Why would bagged trees be similar? Imagine predicting customer churn with 30 features, one of which, "days since last app login", is far stronger than the rest. Every bootstrap sample still contains that pattern, so almost every tree asks about logins first. The trees end up with the same top branches and therefore similar errors.' },
          { term: 'Churn', def: 'When a customer stops doing business with a company, for example cancelling a mobile plan or a subscription. Predicting churn lets the company try to keep the customer first.' },
          { term: 'Feature', def: 'One input column that describes each row, such as age, monthly bill or days since last login. Also called a variable or predictor.' },
          { p: 'In 2001 Leo Breiman, the same statistician who proposed bagging, added one extra rule: **at every split, each tree may only choose from a random subset of the features**. Sometimes the star feature is not on the menu, so the tree has to find the next-best question. The trees become more diverse, their errors less correlated, and the average more accurate.' },
          { diagram: { kind: 'tree', root: { label: 'Days since last login > 20?', children: [ { label: 'Monthly bill > ₹800?', edge: 'yes', children: [ { label: 'Churn 72%', edge: 'yes' }, { label: 'Churn 41%', edge: 'no' } ] }, { label: 'Complaints in 90 days ≥ 2?', edge: 'no', children: [ { label: 'Churn 35%', edge: 'yes' }, { label: 'Churn 6%', edge: 'no' } ] } ] }, caption: 'One tree in a churn forest. In plain bagging, nearly every tree would start with the login question. In a random forest, many trees are forced to start with something else, such as complaints or contract type.' } },
        ],
      },
      {
        heading: 'Building the intuition: a committee with blinkers',
        blocks: [
          { p: 'Think of a hiring committee of 100 interviewers deciding whether to hire a candidate. If they all read the same CV highlight first ("went to a famous college"), they anchor on it and their judgements cluster together. Now imagine each interviewer, at every stage of their thinking, is handed only a random few pages of the application.' },
          { steps: [
            '**Interviewer 1** sees the college and the coding test at the first stage, and asks about the coding test.',
            '**Interviewer 2** sees work history and references, and asks about work history.',
            '**Interviewer 3** sees the college and the references, and asks about references.',
            'Each interviewer still forms a sensible opinion, but **from different angles**.',
            'When the committee votes, idiosyncratic mistakes cancel and the shared truth survives.',
          ], title: 'Why blinkers help a committee' },
          { p: 'Each individual interviewer is slightly worse than one who sees everything. Yet the committee is better. That trade, slightly weaker members in exchange for much more independence, is the heart of the random forest.' },
          { think: { q: 'If you let each split see only 1 random feature, the trees become extremely diverse. Why is that not ideal?', a: 'Each tree becomes too weak: often the single feature offered is useless for that split. Diversity helps only while each tree stays reasonably good. The number of features per split balances individual strength against independence.' } },
          { callout: 'Random forest = bagging (random rows for each tree) + random features at each split. Two sources of randomness, one goal: trees that disagree in useful ways.', tone: 'key' },
        ],
      },
      {
        heading: 'How a random forest is built, step by step',
        blocks: [
          { steps: [
            '**Choose the number of trees** (`n_estimators`, e.g. 300) and the number of features to consider per split (`max_features`, written m).',
            '**For each tree, draw a bootstrap sample** of the rows, exactly as in bagging.',
            '**Grow the tree.** At every node, pick m features at random, find the best split among only those m, and split.',
            '**Keep growing** until leaves are pure or very small. Random forest trees are usually left deep and unpruned.',
            '**Predict** by averaging the trees (regression) or averaging their class probabilities and picking the most likely class (classification).',
          ], title: 'The random forest recipe' },
          { diagram: { kind: 'flow', nodes: ['**Bootstrap sample** of rows for each tree', 'At each node, **pick m random features**', '**Best split** among those m only', 'Grow deep trees, **repeat** for all trees', '**Average / vote** across trees'], caption: 'The only difference from bagging is the second box: a fresh random subset of features at every single split, not once per tree.' } },
          { term: 'max_features (m)', def: 'How many randomly chosen features a tree may look at when choosing each split. Smaller m means more diverse but individually weaker trees.' },
          { p: 'Common defaults: for classification, m = √p (the square root of the number of features p). For regression the textbook suggestion is about p/3. Be aware that scikit-learn\'s `RandomForestRegressor` now defaults to `max_features=1.0`, meaning all features, which is plain bagging; it is worth trying smaller values yourself.' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { p: 'The variance formula from the bagging chapter is the reason random forests exist, so here it is again.' },
          { tex: '\\operatorname{Var}(\\bar{f}) = \\rho\\,\\sigma^2 + \\frac{1 - \\rho}{B}\\,\\sigma^2', plain: 'More trees (B) removes the second term. The first term, ρσ², stays. Random feature selection lowers ρ, the correlation between trees, which lowers the floor itself.', symbols: [['\\rho', 'correlation between trees\' errors'], ['\\sigma^2', 'variance of a single tree'], ['B', 'number of trees']] },
          { p: 'How often is the star feature hidden from a split? If there are p features and a split sees m of them chosen at random, the chance that one particular feature is **not** among them is:' },
          { tex: 'P(\\text{feature excluded}) = \\frac{p - m}{p}', plain: 'Out of p features, m are allowed. The share of splits where any given feature is left out is the number not chosen divided by the total.', symbols: [['p', 'total number of features'], ['m', 'features considered at each split']] },
          { p: 'For classification, each tree\'s prediction is often turned into a probability by looking at the share of training rows of each class in the leaf. The forest averages these across trees:' },
          { tex: '\\hat{p}(\\text{class } c \\mid x) = \\frac{1}{B} \\sum_{b=1}^{B} \\hat{p}_b(c \\mid x)', plain: 'The forest\'s probability for class c is the average of every tree\'s probability for class c.', symbols: [['\\hat{p}_b', 'probability given by tree b'], ['x', 'the new case being predicted']] },
          { term: 'Gini impurity', def: 'A score for how mixed the classes are in a node: 0 means every row is the same class; higher means more mixing. Trees pick splits that reduce impurity the most.' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'How often is the star feature off the menu?', setup: 'A churn dataset has p = 16 features. With the classification default m = √16 = 4, how often can a split not use "days since last login"?', steps: [
            'Features not offered at a split: 16 − 4 = 12.',
            'Chance the login feature is excluded: 12 / 16 = 0.75.',
            'So in about 75% of splits, including the very first split of most trees, the tree must use some other feature.',
            'With p = 100 and m = 10, the exclusion chance is 90 / 100 = 0.90.',
          ], result: 'Even a dominant feature is unavailable most of the time, which forces trees to discover other useful patterns and makes them less alike.' } },
          { example: { title: 'Lowering correlation beats adding trees', setup: 'Single-tree variance σ² = 100. Plain bagged trees have correlation ρ = 0.6. A random forest on the same data has ρ = 0.2. Both use B = 500 trees.', steps: [
            'Bagging: 0.6 × 100 + 0.4 × 100 / 500 = 60 + 0.08 = 60.08.',
            'Random forest: 0.2 × 100 + 0.8 × 100 / 500 = 20 + 0.16 = 20.16.',
            'Adding even a million more bagged trees could only bring bagging down to 60.',
          ], result: 'The forest\'s variance is about one third of bagging\'s, achieved not by more trees but by more independent trees.' } },
          { diagram: { kind: 'bars', labels: ['Single tree', 'Bagging (ρ = 0.6)', 'Random forest (ρ = 0.2)'], values: [100, 60.08, 20.16], highlight: 2, yLabel: 'prediction variance', caption: 'Same number of trees, very different result. Decorrelating trees attacks the floor that bagging cannot get below.' } },
          { example: { title: 'Business case: should we call this customer? (illustrative)', setup: 'A broadband provider\'s forest has 500 trees. For one customer, 350 trees (on average across their leaf probabilities) point to churn. A retention call plus discount costs ₹500. The customer is worth ₹6,000 in future profit, and past campaigns save about 30% of customers who were going to leave.', steps: [
            'Churn probability ≈ 350 / 500 = 0.70.',
            'Expected value saved by calling = 0.70 × ₹6,000 × 0.30 = ₹1,260.',
            'Cost of calling = ₹500.',
            'Expected net benefit = ₹1,260 − ₹500 = ₹760 > 0, so call.',
          ], result: 'The forest\'s probability, not just its yes/no label, turns into a rupee decision. A customer with probability 0.2 would give 0.2 × 6,000 × 0.3 = ₹360, below the cost, so no call.' } },
        ],
      },
      {
        heading: 'Tuning and reading a forest',
        blocks: [
          { p: 'Random forests are famous for working well with little tuning. These are the settings that matter most:' },
          { diagram: { kind: 'table', head: ['Setting', 'What it controls', 'Typical starting point'], rows: [['n_estimators', 'Number of trees', '300–500; more never overfits, only slows'], ['max_features', 'Features tried per split', '√p (classification), p/3 to p (regression)'], ['max_depth / min_samples_leaf', 'How deep trees grow', 'Unlimited depth; leaf size 1–5'], ['class_weight', 'Extra weight for rare classes', '"balanced" for rare events like fraud'], ['oob_score', 'Free validation estimate', 'True']], caption: 'A short list of knobs. Defaults are a good first model; tune max_features and leaf size first.' } },
          { p: '**Feature importance.** A forest can tell you which features it relied on. The built-in version (`feature_importances_`) adds up how much each feature reduced impurity across all splits and trees.' },
          { term: 'Feature importance', def: 'A score saying how much a model relied on each feature. It shows what the model uses, not necessarily what causes the outcome.' },
          { diagram: { kind: 'bars', labels: ['Days since login', 'Complaints', 'Contract type', 'Monthly bill', 'Tenure', 'Customer ID'], values: [0.31, 0.22, 0.17, 0.14, 0.12, 0.04], highlight: 0, yLabel: 'importance', caption: 'Illustrative importances from a churn forest. Note that a meaningless high-cardinality column like Customer ID can still earn some impurity importance; drop such columns, and prefer permutation importance for a fairer check.' } },
          { callout: 'Impurity-based importance is biased towards features with many distinct values (IDs, exact timestamps). Permutation importance, which measures how much accuracy drops when a column is shuffled, is more trustworthy. scikit-learn provides it as `sklearn.inspection.permutation_importance`.', tone: 'warn' },
        ],
      },
      {
        heading: 'Random forests in the real world',
        blocks: [
          { case: { title: 'Body-part recognition in Microsoft Kinect', story: 'Microsoft\'s Kinect motion sensor for the Xbox needed to recognise, in real time, which body part each pixel of a depth image belonged to. The published research behind it (Shotton and colleagues, 2011) used randomised decision forests trained on a very large set of synthetic depth images. Forests suited the job because each tree is fast to evaluate, trees can run in parallel on a graphics chip, and averaging many trees made the per-pixel predictions robust to the huge variety of body shapes and poses.' } },
          { bullets: [
            '**Banking and lending:** credit scoring and fraud flags, often as a strong benchmark before trying boosting.',
            '**Manufacturing:** predicting machine failure from vibration, temperature and current sensors.',
            '**Healthcare research:** ranking risk factors in patient data, using importance as a starting point for investigation.',
            '**Remote sensing:** classifying land use (crops, forest, water) from satellite image bands.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { p: 'Random forests are hard to break, but they have blind spots worth knowing before you put one in production.' },
          { bullets: [
            '**They cannot extrapolate.** A tree predicts an average of training rows in a leaf, so a forest can never predict beyond the range of targets it saw. If prices rise above anything in history, the forest stays stuck at the old maximum.',
            '**Large and slower to predict.** Hundreds of deep trees can take hundreds of megabytes and add milliseconds per prediction.',
            '**Probabilities can be poorly calibrated.** Forest probabilities tend to avoid 0 and 1. If you need precise probabilities, calibrate them (`CalibratedClassifierCV`).',
            '**Usually beaten by tuned boosting on tabular data.** Gradient boosting libraries often edge out forests when carefully tuned, at the cost of more tuning effort.',
          ] },
          { diagram: { kind: 'scatter', xLabel: 'advertising spend (₹ lakh)', yLabel: 'sales (₹ lakh)', caption: 'Training data (blue) lies between spend 1 and 6. The forest\'s predictions (red) follow the trend inside that range, then go flat beyond spend 6. A linear model would continue the trend; a forest cannot.', points: [[1, 12, 0], [2, 15, 0], [3, 19, 0], [4, 22, 0], [5, 26, 0], [6, 29, 0], [1, 12.5, 1], [2, 15.5, 1], [3, 18.5, 1], [4, 22.5, 1], [5, 25.5, 1], [6, 28.5, 1], [7, 28.5, 1], [8, 28.5, 1], [9, 28.5, 1]] } },
          { diagram: { kind: 'compare', left: { title: 'Random forest shines when…', items: ['You want a strong model with little tuning', 'Data is tabular with mixed feature types', 'You want OOB error and feature importance', 'Robustness matters more than the last 1% of accuracy'] }, right: { title: 'Consider instead…', items: ['Maximum tabular accuracy → **gradient boosting / XGBoost / LightGBM**', 'Need to extrapolate trends → **linear or time-series models**', 'Need a tiny, fast model → **a single tree or logistic regression**', 'Images, text, audio → **neural networks**'] }, caption: 'The random forest is the dependable all-rounder: rarely the very best, rarely bad.' } },
        ],
      },
    ],
    faq: [
      { q: 'Can a random forest overfit?', a: 'Adding trees does not cause overfitting; it only stabilises the average. Individual trees do overfit, and with very noisy data a forest of extremely deep trees can still fit noise. Increasing `min_samples_leaf` is the usual remedy.' },
      { q: 'Do I need to scale features for a random forest?', a: 'No. Trees split on thresholds such as "bill > ₹800", and rescaling a column does not change which threshold separates the rows. That is one reason forests are so convenient.' },
      { q: 'How is a random forest different from bagging?', a: 'Bagging randomises only the rows each tree sees. A random forest also randomises the features available at every split, which makes the trees less correlated and the average better.' },
      { q: 'Does a random forest handle missing values?', a: 'Recent scikit-learn versions support missing values in random forests natively, but many tools and older versions do not. A simple, safe approach is to impute missing values and add a "was missing" indicator column.' },
      { q: 'Is feature importance the same as cause?', a: 'No. It tells you what the model found useful for prediction. A feature can be important because it is correlated with the real cause. Causal questions need experiments or causal-inference methods.' },
      { q: 'Random forest or gradient boosting: which should I try first?', a: 'Try a random forest first as a fast, robust baseline. Then try gradient boosting; if it wins clearly after tuning, use it. If the difference is small, the forest\'s simplicity and robustness may be worth more.' },
    ],
  },

  adaboost: {
    minutes: 15,
    hook: 'A good maths tutor does not make you redo the questions you already get right. After each test she looks at what you got wrong and sets the next practice sheet around exactly those questions. Over many rounds, your weak spots get the most attention. **AdaBoost** trains models the same way: each new model concentrates on the examples the previous ones got wrong, and the final answer is a weighted vote of them all.',
    sections: [
      {
        heading: 'The problem: can weak rules add up to a strong one?',
        blocks: [
          { p: 'In the late 1980s, computer scientists asked a theoretical question. Suppose you have a way to produce rules that are only **slightly better than guessing**, say 55% accurate on a yes/no question. Can you combine such weak rules into one that is extremely accurate?' },
          { term: 'Weak learner', def: 'A very simple model that does only a little better than random guessing. The classic example is a decision stump.' },
          { term: 'Decision stump', def: 'A decision tree with just one question and two leaves, for example "Is the transaction amount above ₹20,000? If yes, say fraud; if no, say genuine."' },
          { p: 'Yoav Freund and Robert Schapire answered yes, and in the mid-1990s published a practical method: **AdaBoost**, short for **Ada**ptive **Boost**ing. Their work later won the Gödel Prize, one of the top awards in theoretical computer science. AdaBoost became famous in practice through the Viola–Jones face detector (2001), which used boosted simple image features to find faces fast enough for early digital cameras.' },
          { term: 'Boosting', def: 'A family of methods that build models **one after another**, each new model trying to fix the mistakes of the ones before it. Contrast with bagging, where models are built independently.' },
          { diagram: { kind: 'compare', left: { title: 'Bagging', items: ['Models built **in parallel**, independently', 'Every row equally important', 'Simple average or majority vote', 'Mainly reduces **variance**', 'Uses strong, deep trees'] }, right: { title: 'Boosting (AdaBoost)', items: ['Models built **in sequence**', 'Hard rows gain weight each round', 'Weighted vote: better models count more', 'Mainly reduces **bias**', 'Uses weak learners such as stumps'] }, caption: 'Both are ensembles, but they attack different problems. Bagging steadies unstable models; boosting makes simple models smarter.' } },
        ],
      },
      {
        heading: 'Building the intuition: the tutor and the practice sheets',
        blocks: [
          { p: 'Follow the tutor through a few rounds, with no formulas.' },
          { steps: [
            '**Round 1.** All 20 questions on the sheet are equally important. The student (a weak learner) answers, and gets questions 4, 9 and 15 wrong.',
            '**The tutor re-weights.** Questions 4, 9 and 15 are now marked "important"; the others are marked "less important".',
            '**Round 2.** A new student is told to focus on the important questions. They get those right but slip on questions 2 and 11.',
            '**Re-weight again.** Questions 2 and 11 become important; questions this student got right lose importance.',
            '**Final exam.** All the students vote on each question. Students who did well on their weighted practice sheets get a louder voice.',
          ], title: 'Round by round' },
          { p: 'No single student is impressive. But because each covers a different weakness, the panel together gets almost everything right. That is boosting.' },
          { think: { q: 'Why should a student who scored well on their practice sheet get a louder vote than one who barely beat guessing?', a: 'Because their opinion is more reliable. A student who is 90% accurate on what they were asked deserves more trust than one who is 52% accurate. AdaBoost turns each learner\'s weighted accuracy directly into its voting weight.' } },
          { callout: 'Two kinds of weight appear in AdaBoost. **Row weights** say how much each training example matters in the next round. **Model weights (α)** say how loudly each learner votes at the end.', tone: 'key' },
        ],
      },
      {
        heading: 'How AdaBoost works, step by step',
        blocks: [
          { p: 'AdaBoost is usually described for two classes coded as +1 and −1 (for example +1 = fraud, −1 = genuine).' },
          { steps: [
            '**Start with equal row weights.** With n rows, every row gets weight 1/n.',
            '**Train a weak learner** (a stump) that minimises weighted error, meaning mistakes on heavy rows cost more.',
            '**Measure its weighted error ε:** the total weight of the rows it got wrong.',
            '**Give it a vote α** based on ε: low error → big vote; error near 0.5 → vote near zero.',
            '**Re-weight the rows:** multiply wrong rows\' weights up and right rows\' weights down, then rescale so all weights add to 1.',
            '**Repeat** for the chosen number of rounds, then predict with the weighted vote of all learners.',
          ], title: 'The AdaBoost loop' },
          { diagram: { kind: 'flow', nodes: ['**Equal weights** 1/n on all rows', '**Fit a stump** to the weighted data', '**Weighted error ε** and vote α', '**Up-weight mistakes**, down-weight successes', 'Repeat; final = **sign of Σ α·h(x)**'], caption: 'Each round passes a re-weighted dataset to the next learner. The final model adds up the learners\' votes, each scaled by its α.' } },
          { term: 'Weighted error (ε)', def: 'The sum of the weights of the rows a learner got wrong. If the weights add to 1, ε is between 0 and 1; ε = 0.5 means no better than a coin toss.' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { p: 'Three formulas run the whole algorithm. Each one has a clear job.' },
          { tex: '\\alpha_t = \\tfrac{1}{2} \\ln\\!\\left( \\frac{1 - \\varepsilon_t}{\\varepsilon_t} \\right)', plain: 'The vote of learner t depends on the odds of it being right. If it is right far more often than wrong, the odds are large and so is its vote. At ε = 0.5 the odds are 1 and ln(1) = 0: a coin-flip learner gets no vote.', symbols: [['\\alpha_t', 'voting weight of learner t'], ['\\varepsilon_t', 'weighted error of learner t'], ['\\ln', 'natural logarithm']] },
          { diagram: { kind: 'curve', fn: '0.5*Math.log((1-x)/x)', xMin: 0.03, xMax: 0.97, marks: [{ x: 0.5, label: 'coin flip: α = 0' }, { x: 0.2, label: 'ε = 0.2: α ≈ 0.69' }], xLabel: 'weighted error ε', yLabel: 'vote α', caption: 'Accurate learners (left) get large positive votes. A learner at ε = 0.5 gets zero. A learner worse than chance (right) gets a negative vote: AdaBoost simply flips its answers.' } },
          { tex: 'w_i \\leftarrow w_i \\, e^{-\\alpha_t \\, y_i \\, h_t(x_i)}', plain: 'If the learner got row i right, y and h(x) have the same sign, the exponent is negative, and the weight shrinks. If it got row i wrong, the exponent is positive and the weight grows. Afterwards, divide every weight by the total so they add to 1 again.', symbols: [['w_i', 'weight of row i'], ['y_i', 'true label of row i, +1 or −1'], ['h_t(x_i)', 'learner t\'s prediction for row i, +1 or −1']] },
          { tex: 'H(x) = \\operatorname{sign}\\!\\left( \\sum_{t=1}^{T} \\alpha_t \\, h_t(x) \\right)', plain: 'To classify a new case, add up every learner\'s vote (+1 or −1) times its α. If the total is positive, predict +1; if negative, predict −1.', symbols: [['H(x)', 'final AdaBoost prediction'], ['T', 'number of rounds (learners)']] },
          { p: 'A neat property falls out of these formulas: right after re-weighting, the rows the last learner got wrong hold **exactly half** of the total weight. So the next learner is forced to take those mistakes seriously, since ignoring them would make it no better than chance.' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Two rounds of row re-weighting', setup: 'Five transactions, all starting with weight 0.2. Stump 1 gets transaction 1 wrong and the other four right.', steps: [
            'ε₁ = 0.2 (the weight of the one wrong row).',
            'α₁ = ½ ln(0.8 / 0.2) = ½ ln 4 ≈ 0.693.',
            'Wrong row: 0.2 × e^0.693 = 0.2 × 2 = 0.4. Right rows: 0.2 × e^−0.693 = 0.2 × 0.5 = 0.1 each.',
            'Total = 0.4 + 4 × 0.1 = 0.8. Rescale: row 1 = 0.4 / 0.8 = 0.5; rows 2–5 = 0.1 / 0.8 = 0.125 each.',
            'Stump 2 gets rows 2 and 3 wrong: ε₂ = 0.125 + 0.125 = 0.25, so α₂ = ½ ln(0.75 / 0.25) = ½ ln 3 ≈ 0.549.',
            'Re-weight and rescale: row 1 ≈ 0.333, rows 2 and 3 = 0.25 each, rows 4 and 5 ≈ 0.083 each.',
          ], result: 'After each round, the rows just misclassified hold half the weight (0.5 after round 1; 0.25 + 0.25 = 0.5 after round 2). The algorithm keeps pointing the next learner at the current weak spots.' } },
          { diagram: { kind: 'table', head: ['Row', 'Start', 'After stump 1', 'After stump 2'], rows: [['1', '0.200', '0.500', '0.333'], ['2', '0.200', '0.125', '0.250'], ['3', '0.200', '0.125', '0.250'], ['4', '0.200', '0.125', '0.083'], ['5', '0.200', '0.125', '0.083']], caption: 'Row weights over two rounds. Row 1 jumps after stump 1 misses it; rows 2 and 3 jump after stump 2 misses them. Weights always add to 1.' } },
          { example: { title: 'Three weak stumps, zero training mistakes', setup: 'Continue: stump 3 gets rows 4 and 5 wrong, so ε₃ = 0.083 + 0.083 ≈ 0.167 (exactly 1/6). Now combine all three.', steps: [
            'α₃ = ½ ln((5/6) / (1/6)) = ½ ln 5 ≈ 0.805.',
            'Row 1 (only stump 1 wrong): score = −0.693 + 0.549 + 0.805 = +0.661 → correct.',
            'Rows 2 and 3 (only stump 2 wrong): +0.693 − 0.549 + 0.805 = +0.949 → correct.',
            'Rows 4 and 5 (only stump 3 wrong): +0.693 + 0.549 − 0.805 = +0.437 → correct.',
          ], result: 'Each stump alone gets one or two rows wrong, yet the weighted vote gets all five right, because the stumps\' mistakes fall on different rows and are always outvoted.' } },
          { example: { title: 'Business case: scoring a new card transaction (illustrative)', setup: 'A bank\'s fraud model is the three stumps above. Stump 1 asks "amount > ₹20,000?", stump 2 asks "new device?", stump 3 asks "merchant category is high risk?". For a new transaction, stumps 1 and 3 say fraud (+1), stump 2 says genuine (−1).', steps: [
            'Score = 0.693 × (+1) + 0.549 × (−1) + 0.805 × (+1).',
            '= 0.693 − 0.549 + 0.805 = 0.949.',
            'Positive → flag as likely fraud and send a one-time password check.',
            'If instead only stump 1 said fraud: 0.693 − 0.549 − 0.805 = −0.661 → let it through.',
          ], result: 'A big score in either direction means the stumps largely agree. Scores near zero are the borderline cases where a bank might choose a softer check.' } },
        ],
      },
      {
        heading: 'Settings and variants',
        blocks: [
          { p: 'In scikit-learn, `AdaBoostClassifier` uses depth-1 trees (stumps) by default, with `n_estimators=50` and `learning_rate=1.0`. A smaller learning rate shrinks every α, so each learner counts for less and you usually need more rounds, but the result is often more robust.' },
          { term: 'Learning rate (shrinkage)', def: 'A multiplier between 0 and 1 applied to each new model\'s contribution. Smaller values make learning slower and steadier, which usually generalises better.' },
          { bullets: [
            '**Multi-class problems:** scikit-learn uses the SAMME algorithm, which extends the α formula to more than two classes. For two classes it gives the same predictions as the classic version.',
            '**Regression:** `AdaBoostRegressor` (the AdaBoost.R2 method) re-weights rows by the size of their errors.',
            '**Base learner depth:** stumps are classic, but depth-2 or depth-3 trees can capture feature interactions.',
            '**Stopping:** watch performance on a validation set as rounds increase (`staged_predict` gives predictions after each round).',
          ] },
          { diagram: { kind: 'curve', fn: '0.30*Math.exp(-x/15)+0.05', fn2: '0.32*Math.exp(-x/18)+0.08+0.0009*x', xMin: 0, xMax: 150, legend: ['training error', 'validation error'], xLabel: 'boosting rounds', yLabel: 'error rate', caption: 'A typical (illustrative) pattern: training error keeps falling while validation error bottoms out and then creeps up when the model starts chasing noisy rows. Pick the round where validation error is lowest.' } },
        ],
      },
      {
        heading: 'AdaBoost in the real world',
        blocks: [
          { case: { title: 'Fast face detection (Viola and Jones, 2001)', story: 'Paul Viola and Michael Jones built a face detector that could scan images in real time on ordinary hardware of the early 2000s. They computed thousands of very simple rectangle features (for example, "the eye region is darker than the cheek region") and used AdaBoost both to select the most useful few and to weight them. They then arranged boosted classifiers into a cascade, so that most non-face regions were rejected by the first cheap stages. Descendants of this approach powered face-finding boxes in many digital cameras of that era.' } },
          { bullets: [
            '**Teaching boosting:** AdaBoost is the clearest way to understand the idea behind gradient boosting and XGBoost.',
            '**Small, clean tabular datasets:** it can be competitive with little tuning.',
            '**Feature selection:** boosted stumps reveal which single features best separate the classes.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Sensitive to noisy labels and outliers.** A mislabelled row is "wrong" every round, so its weight keeps growing until later learners twist themselves around it. Clean labels matter more for AdaBoost than for random forests.',
            '**Sequential, so slower to train.** Each round depends on the previous one; you cannot build the learners in parallel as with bagging.',
            '**Largely superseded in practice.** Gradient boosting generalises AdaBoost\'s idea to any loss function and, with modern libraries, usually wins on accuracy.',
            '**Weak learners must beat chance.** If no stump can get weighted error below 0.5, AdaBoost stalls.',
          ] },
          { callout: 'AdaBoost can be shown to be gradient boosting with a particular loss, the exponential loss, which punishes confident mistakes very harshly. That harshness is exactly why noisy labels hurt it.', tone: 'key' },
        ],
      },
    ],
    faq: [
      { q: 'Why are stumps used instead of full trees?', a: 'Boosting needs weak, high-bias learners that it can improve step by step. A deep tree would fit the weighted data almost perfectly in one go, leaving nothing for later rounds and overfitting quickly.' },
      { q: 'Does AdaBoost overfit?', a: 'Surprisingly slowly on clean data; test error often keeps improving long after training error reaches zero. On noisy data it can overfit, so use a validation set to choose the number of rounds and a learning rate below 1.' },
      { q: 'What happens if a learner has error above 0.5?', a: 'Its α becomes negative, so its votes are flipped. A learner that is reliably wrong is useful information. In practice, implementations usually stop or discard a learner whose error reaches 0.5.' },
      { q: 'Do I need to scale features?', a: 'Not with tree-based weak learners such as stumps, which only compare a feature with a threshold.' },
      { q: 'Why does scikit-learn\'s α look twice as big as the textbook formula?', a: 'Its SAMME version drops the ½. Doubling every α does not change which side of zero the final score falls, and after rescaling the row weights come out the same, so predictions are identical for two classes.' },
      { q: 'Is AdaBoost still worth learning?', a: 'Yes, as a concept. Re-weighting hard cases and combining weighted votes is the cleanest introduction to boosting, and it makes gradient boosting much easier to understand.' },
    ],
  },

  'gradient-boosting': {
    minutes: 16,
    hook: 'A golfer rarely sinks the ball in one shot. The first drive gets it roughly towards the hole; each shot after that only has to fix what is left: a long iron, a chip, a short putt. Nobody expects the first shot to be perfect. **Gradient boosting** builds a prediction the same way: a rough first guess, then a series of small models, each correcting the error that remains.',
    sections: [
      {
        heading: 'The problem: fixing errors one step at a time',
        blocks: [
          { p: 'A consumer-goods company wants to forecast monthly sales for 4,000 stores using features like store size, city tier, footfall and local festivals. A single decision tree is too crude, and a random forest is good but plateaus. The team wants a model that keeps getting better by looking directly at **where it is still wrong**.' },
          { p: 'AdaBoost showed that building models in sequence, each focusing on earlier mistakes, is powerful. But AdaBoost was designed for yes/no classification with one particular way of scoring mistakes. Business problems need more: forecasting rupee amounts, predicting probabilities, predicting delivery times where being late is worse than being early.' },
          { p: 'In 1999–2001 the statistician Jerome Friedman generalised the idea into **gradient boosting**: fit each new tree to the remaining errors, measured with **any** sensible loss function. It is now one of the most successful methods for tabular data, the rows-and-columns data that fills most company databases.' },
          { term: 'Residual', def: 'The error left over for one row: actual value minus predicted value. A residual of +5 means the model predicted 5 too low.' },
          { term: 'Loss function', def: 'A formula that scores how bad a prediction is. Squared error, (actual − predicted)², is the most common for numbers; log loss is the most common for probabilities.' },
          { diagram: { kind: 'bars', labels: ['Start (mean)', 'After tree 1', 'After tree 2', 'After tree 3', 'After tree 4', 'After tree 5'], values: [46, 19, 6.75, 3.08, 1.03, 0.51], highlight: 0, yLabel: 'mean squared error', caption: 'Error on four stores (worked example below) as trees are added with learning rate 0.5. Each tree removes a large share of what is left, just like the golfer\'s shots getting shorter.' } },
        ],
      },
      {
        heading: 'Building the intuition: a team of correctors',
        blocks: [
          { p: 'Imagine forecasting next month\'s sales for four shops, with a team of junior analysts who each may only make a very simple statement.' },
          { steps: [
            '**The first analyst** says: "Every shop will sell the average, ₹18 lakh." Simple, and wrong for every shop.',
            '**You write down the misses:** shop 1 actually sold ₹8 lakh less than that, shop 4 sold ₹10 lakh more.',
            '**The second analyst** does not forecast sales at all. She looks only at the misses and says: "Small shops are being overestimated and big shops underestimated."',
            '**You apply half of her correction** (to stay cautious), and write down the new, smaller misses.',
            '**The third analyst** studies those smaller misses, and so on. The final forecast is the first guess plus every correction added together.',
          ], title: 'Each analyst fixes what the last one missed' },
          { p: 'Every analyst is weak on their own. The power comes from the fact that **each one studies exactly the errors that remain**, so effort always goes where it is needed.' },
          { think: { q: 'Why apply only half of each analyst\'s correction instead of all of it?', a: 'Each correction is learned from limited, noisy data, so it is partly right and partly chasing noise. Taking small steps lets later analysts average out the noise. This is the learning rate, and smaller steps with more analysts almost always generalise better.' } },
          { callout: 'Bagging asks many models the same question and averages. Boosting asks each new model a different question: "What is still wrong?" and adds the answers up.', tone: 'key' },
        ],
      },
      {
        heading: 'How gradient boosting works, step by step',
        blocks: [
          { steps: [
            '**Start with a constant prediction** F₀ for everyone: the mean of the target for squared error.',
            '**Compute the residuals** (more generally, the pseudo-residuals) for every row.',
            '**Fit a small regression tree** (depth 2–6) that predicts those residuals from the features.',
            '**Update the model:** add the tree\'s prediction, multiplied by a learning rate η (for example 0.1), to every row\'s current prediction.',
            '**Repeat steps 2–4** for M rounds, or until a validation score stops improving.',
            '**Predict** a new case by adding F₀ and every tree\'s scaled output.',
          ], title: 'The gradient boosting loop' },
          { diagram: { kind: 'flow', nodes: ['**F₀ = mean** of target', 'Compute **residuals** y − F', 'Fit a **small tree** to residuals', '**F ← F + η × tree**', 'Repeat M times; **sum of all trees**'], caption: 'The core loop. Notice the tree in step 3 predicts errors, not sales. The model is a sum: starting guess plus many small corrections.' } },
          { term: 'Learning rate (η, eta)', def: 'A number between 0 and 1 that scales each tree\'s contribution. Smaller values mean smaller, more cautious steps; you then need more trees.' },
          { term: 'Regression tree', def: 'A decision tree that predicts a number. Each leaf outputs the average target value of the training rows that land in it.' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { p: 'The model after m rounds is the previous model plus a scaled new tree:' },
          { tex: 'F_m(x) = F_{m-1}(x) + \\eta \\, h_m(x)', plain: 'Today\'s prediction equals yesterday\'s prediction plus a small step in the direction the new tree suggests.', symbols: [['F_m(x)', 'model prediction after m trees'], ['h_m(x)', 'the m-th tree, fitted to current errors'], ['\\eta', 'learning rate']] },
          { p: 'Where does the word **gradient** come in? For squared-error loss, the residual is exactly the direction that reduces the loss fastest. Take the loss for one row and ask how it changes as the prediction F changes:' },
          { term: 'Gradient', def: 'The slope of the loss with respect to the prediction: which direction, and how steeply, the loss rises if you nudge the prediction. Moving against the gradient reduces the loss.' },
          { tex: 'L = \\tfrac{1}{2}(y - F)^2 \\quad\\Rightarrow\\quad -\\frac{\\partial L}{\\partial F} = y - F', plain: 'The negative slope of the squared-error loss is simply the residual. So "fit a tree to the residuals" is the same as "take a step downhill on the loss". The ½ is only there to make the derivative tidy.', symbols: [['y', 'actual value'], ['F', 'current prediction'], ['\\partial L / \\partial F', 'how the loss changes when F changes']] },
          { p: 'For any other loss, you compute this negative slope for every row and call it the **pseudo-residual**. The tree is fitted to pseudo-residuals, and everything else stays the same. That is why gradient boosting works for regression, classification, ranking and more: you only swap the loss.' },
          { tex: 'r_i = y_i - p_i \\quad \\text{(log loss, with } p_i = \\text{current predicted probability)}', plain: 'For yes/no problems with log loss, the pseudo-residual is the actual label (1 or 0) minus the current probability. A churner currently given 30% has pseudo-residual 1 − 0.3 = 0.7: push this one up.', symbols: [['r_i', 'pseudo-residual for row i'], ['p_i', 'current predicted probability for row i']] },
          { callout: 'This is gradient descent, the same idea used to train neural networks, but the steps are taken in the space of predictions and each step is a tree.', tone: 'key' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Two rounds by hand on four stores', setup: 'Monthly sales (₹ lakh) for stores 1–4: 10, 14, 20, 28. Stores 1 and 2 are small, 3 and 4 large. Learning rate η = 0.5. Trees have one split.', steps: [
            'F₀ = mean = (10 + 14 + 20 + 28) / 4 = 18. Residuals: −8, −4, +2, +10. Mean squared error (MSE) = (64 + 16 + 4 + 100) / 4 = 46.',
            'Tree 1 splits {1, 2} vs {3, 4}. Leaf values are the average residuals: (−8 − 4) / 2 = −6 and (2 + 10) / 2 = +6.',
            'Update: stores 1, 2 → 18 + 0.5 × (−6) = 15. Stores 3, 4 → 18 + 0.5 × 6 = 21. New residuals: −5, −1, −1, +7. MSE = (25 + 1 + 1 + 49) / 4 = 19.',
            'Tree 2 finds the best split is {1, 2, 3} vs {4}. Leaf values: (−5 − 1 − 1) / 3 ≈ −2.333 and +7.',
            'Update: stores 1–3 subtract 0.5 × 2.333 ≈ 1.167 → 13.833, 13.833, 19.833. Store 4 adds 3.5 → 24.5.',
            'New residuals ≈ −3.833, +0.167, +0.167, +3.5. MSE = 6.75.',
          ], result: 'Error fell from 46 to 19 to 6.75 in two tiny trees. Each tree looked only at what was left over, not at the original sales.' } },
          { example: { title: 'Reading a prediction as a sum', setup: 'Using the model above, what does it predict for store 4, and why?', steps: [
            'Start: 18 (the average store).',
            'Tree 1: store 4 is "large" → + 0.5 × 6 = +3.',
            'Tree 2: store 4 is "the very largest" → + 0.5 × 7 = +3.5.',
            'Total: 18 + 3 + 3.5 = 24.5 (actual 28; later trees would close the gap).',
          ], result: 'A boosted model is a story told in instalments: a baseline plus a list of adjustments, each tied to a simple rule. Tools like SHAP build on this additive structure to explain individual predictions.' } },
          { example: { title: 'Business case: churn probabilities with log loss (illustrative)', setup: 'A subscription video app has a 30% churn rate. Model the log-odds of churn with gradient boosting, η = 0.1.', steps: [
            'Start in log-odds: F₀ = ln(0.3 / 0.7) ≈ −0.847, which converts back to probability 0.30 for everyone.',
            'Pseudo-residuals: a customer who churned gets 1 − 0.30 = 0.70; one who stayed gets 0 − 0.30 = −0.30.',
            'Suppose tree 1 places a churner in a leaf with value +2.5. New log-odds: −0.847 + 0.1 × 2.5 = −0.597.',
            'Convert back: probability = 1 / (1 + e^0.597) ≈ 0.355. The model has nudged this customer from 30% to about 35.5%.',
          ], result: 'For classification, gradient boosting works in log-odds (where adding is natural) and converts to a probability at the end, exactly like logistic regression does.' } },
        ],
      },
      {
        heading: 'Tuning: learning rate, trees and early stopping',
        blocks: [
          { p: 'Gradient boosting has more knobs than a random forest, and they interact. The most important relationship is between the learning rate and the number of trees.' },
          { diagram: { kind: 'curve', fn: '0.35*Math.exp(-x/25)+0.10+0.0006*x', fn2: '0.35*Math.exp(-x/120)+0.09+0.00005*x', xMin: 0, xMax: 600, legend: ['validation error, η = 0.3', 'validation error, η = 0.05'], xLabel: 'number of trees', yLabel: 'validation error', caption: 'Illustrative curves. A big learning rate reaches its best quickly and then overfits as trees keep being added. A small learning rate needs many more trees but usually reaches a slightly lower minimum and degrades more gently.' } },
          { bullets: [
            '**n_estimators and learning_rate:** set a small learning rate (0.03–0.1) and let **early stopping** choose the number of trees.',
            '**max_depth:** 3–6 is typical. Depth controls how many features can interact inside one tree.',
            '**subsample:** training each tree on a random 50–80% of rows (stochastic gradient boosting) adds randomness that often improves generalisation.',
            '**min_samples_leaf:** stops trees from creating leaves for one or two odd rows.',
          ] },
          { term: 'Early stopping', def: 'Watching performance on a validation set after each new tree and stopping once it has not improved for a set number of rounds. It picks the number of trees automatically.' },
          { p: 'scikit-learn offers `GradientBoostingRegressor` and `GradientBoostingClassifier` (defaults: 100 trees, learning rate 0.1, depth 3), and the much faster `HistGradientBoostingRegressor` / `HistGradientBoostingClassifier`, which bin features into histograms, handle missing values natively, and switch on early stopping automatically for datasets larger than 10,000 rows.' },
        ],
      },
      {
        heading: 'Gradient boosting in the real world',
        blocks: [
          { case: { title: 'Store-level demand forecasting for a consumer brand (illustrative, based on common practice)', story: 'A packaged-foods company forecasts weekly demand for 300 products across 4,000 retail outlets to plan production and truck loading. The team turns time into features (week of year, festival flags, price discounts, last four weeks\' sales, rainfall) and trains a gradient-boosted model on two years of history, using the final 12 weeks as a time-ordered validation set with early stopping. Compared with the previous moving-average method, planners see fewer stock-outs before festivals. They also use quantile loss to produce a "90th percentile" forecast for safety stock, something an averaging model cannot give directly.' } },
          { bullets: [
            '**Search ranking:** boosted trees with ranking losses (such as LambdaMART) have long been used to order search results.',
            '**Credit and insurance pricing:** probability of default, claim frequency and claim severity models.',
            '**Machine-learning competitions:** gradient boosting libraries are a staple of winning solutions on tabular data.',
            '**Logistics:** estimating delivery times, often with losses that penalise late more than early.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**It can overfit.** Unlike a random forest, adding trees eventually makes test error worse. Always use a validation set and early stopping.',
            '**It is sequential.** Trees must be built one after another, so training is slower than a forest of the same size (modern libraries parallelise within each tree).',
            '**More tuning.** Learning rate, depth, subsampling and regularisation interact. Poorly tuned boosting can lose to an untuned forest.',
            '**No extrapolation.** Like every tree method, it cannot predict values beyond the range of its training targets.',
            '**Leakage is punished hard.** Boosting will greedily exploit any feature that secretly contains the answer, such as a "refund issued" column when predicting complaints.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'Random forest', items: ['Trees built independently, in parallel', 'Deep trees, averaged', 'More trees never hurts', 'Few settings; strong defaults', 'Reduces variance'] }, right: { title: 'Gradient boosting', items: ['Trees built in sequence', 'Shallow trees, added up', 'Too many trees overfits: use early stopping', 'More settings; rewards tuning', 'Reduces bias (and variance with subsampling)'] }, caption: 'The two great tree ensembles. Boosting usually wins on accuracy when tuned; the forest wins on ease and robustness.' } },
        ],
      },
    ],
    faq: [
      { q: 'Why use small trees instead of deep ones?', a: 'Each tree only needs to make a modest correction. Deep trees would fit the current residuals, including noise, too aggressively. Shallow trees plus many rounds learn the pattern gradually and generalise better.' },
      { q: 'What learning rate should I use?', a: 'A common starting point is 0.05 or 0.1 with early stopping. Smaller rates need more trees and more time but rarely hurt accuracy. Very large rates (0.5 and above) tend to overfit quickly.' },
      { q: 'How is gradient boosting related to AdaBoost?', a: 'AdaBoost is a special case: gradient boosting with the exponential loss. Gradient boosting replaces re-weighting rows with fitting trees to pseudo-residuals, which works for any differentiable loss.' },
      { q: 'Do I need to scale or one-hot encode features?', a: 'Scaling is unnecessary for trees. Categorical columns must be numbers for scikit-learn\'s classic version; HistGradientBoosting and libraries like LightGBM and CatBoost can handle categories natively.' },
      { q: 'Should I use scikit-learn or XGBoost/LightGBM?', a: 'For small and medium data, scikit-learn\'s HistGradientBoosting is fast and capable. XGBoost, LightGBM and CatBoost add more regularisation options, GPU training, and categorical-feature tricks, and are covered in the next chapter.' },
      { q: 'Can gradient boosting give prediction intervals?', a: 'Yes, indirectly. Train separate models with quantile loss, for example at the 10th and 90th percentiles, to get a range. scikit-learn supports `loss="quantile"` with an `alpha` setting.' },
    ],
  },

  xgboost: {
    minutes: 15,
    hook: 'Gradient boosting was a brilliant idea that, in its original form, was slow on big data and easy to overfit. In 2014 a PhD student, Tianqi Chen, released **XGBoost**, an engineered version with built-in regularisation and serious speed tricks, and it quickly became a favourite in machine-learning competitions. Microsoft\'s **LightGBM** and Yandex\'s **CatBoost** followed. Same engine as gradient boosting, but with a turbocharger and a pit crew.',
    sections: [
      {
        heading: 'The problem: boosting at industrial scale',
        blocks: [
          { p: 'A bank wants to score 50 million card transactions a day for fraud, using 300 features, many of them with missing values, and several categorical columns like merchant category and city. Classic gradient boosting can do this in principle. In practice it hits four walls.' },
          { bullets: [
            '**Speed:** finding the best split means sorting every feature at every node, which is slow on millions of rows.',
            '**Overfitting:** the classic algorithm has no direct penalty on how complex each tree is.',
            '**Missing values:** real data has gaps, and filling them by hand is tedious and can distort patterns.',
            '**Categorical features:** one-hot encoding thousands of merchant codes creates huge, sparse tables.',
          ] },
          { p: 'XGBoost, LightGBM and CatBoost are three open-source libraries that each solve these problems, with different design choices. Learning them is less about new theory and more about knowing what they add and when each shines.' },
          { term: 'Regularisation', def: 'Any penalty that discourages a model from becoming too complex, trading a little training accuracy for better performance on new data.' },
          { term: 'Hyperparameter', def: 'A setting you choose before training (such as tree depth or learning rate), as opposed to the values the model learns from data.' },
        ],
      },
      {
        heading: 'Building the intuition: the same car, a racing team',
        blocks: [
          { p: 'Think of gradient boosting as a well-designed car. XGBoost, LightGBM and CatBoost do not change how the car drives; each tree still corrects the errors of the ones before. What they change is everything around it.' },
          { steps: [
            '**A better steering rule (second-order information).** Instead of only knowing which direction is downhill, the driver also knows how sharply the road curves, so each step can be sized better.',
            '**Speed limits on complexity (regularisation).** Each new tree pays a penalty for every leaf and for extreme leaf values, so it only adds detail that earns its keep.',
            '**A faster map (histograms).** Rather than checking every possible split point, values are grouped into a few hundred buckets and only bucket edges are tried.',
            '**A plan for gaps (missing values).** At each split, the library learns which side rows with a missing value should go.',
            '**Special handling for categories.** LightGBM and CatBoost can split on categorical columns directly, without giant one-hot tables.',
          ], title: 'What the pit crew adds' },
          { think: { q: 'If XGBoost uses the same basic boosting loop, why does regularisation matter so much?', a: 'Because boosting is greedy: every round it will happily add a leaf that explains a few training rows perfectly, even if that leaf is noise. A penalty for each leaf and for large leaf values makes the algorithm ask "Is this improvement big enough to justify the extra complexity?" before adding detail.' } },
        ],
      },
      {
        heading: 'How XGBoost grows each tree, step by step',
        blocks: [
          { steps: [
            '**Compute, for every row, two numbers** from the loss: the gradient g (slope) and the hessian h (curvature).',
            '**Bucket each feature** into histogram bins (the default `tree_method="hist"` in recent versions).',
            '**For each candidate split,** add up g and h on the left and right, and compute a **gain** score that includes the regularisation penalties.',
            '**Take the best split if its gain beats γ** (the minimum gain required); otherwise make this node a leaf.',
            '**Set each leaf\'s value** with a formula that uses the summed g and h and the penalty λ.',
            '**Add the tree** to the model with learning rate η and recompute g and h for the next round.',
          ], title: 'Inside one boosting round' },
          { diagram: { kind: 'flow', nodes: ['Per-row **gradient g** and **hessian h**', '**Histogram bins** per feature', '**Gain** for each split, with λ and γ', '**Split or stop**; leaf weight = −G/(H + λ)', '**Add tree × η**, next round'], caption: 'XGBoost\'s tree builder. Every decision (whether to split, what each leaf predicts) comes from sums of g and h, which is what makes it both fast and regularised.' } },
          { term: 'Hessian', def: 'The second derivative of the loss: how fast the slope itself changes. It tells the algorithm how confident a step can be. For squared error it equals 1 for every row.' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { p: 'XGBoost writes down one objective that combines fit and simplicity:' },
          { tex: '\\text{Obj} = \\sum_{i} L(y_i, \\hat{y}_i) + \\sum_{k} \\Big( \\gamma T_k + \\tfrac{1}{2} \\lambda \\sum_{j} w_{kj}^2 \\Big)', plain: 'Total badness = how wrong the predictions are, plus a charge of γ for every leaf in every tree, plus a charge for large leaf values. Smaller is better.', symbols: [['L', 'loss for one row'], ['T_k', 'number of leaves in tree k'], ['w_{kj}', 'value (weight) of leaf j in tree k'], ['\\gamma', 'cost per leaf (gamma)'], ['\\lambda', 'penalty on large leaf values (lambda)']] },
          { p: 'Using the per-row gradients and hessians, the best value for a leaf has a simple closed form. G and H are the sums of g and h over the rows in that leaf.' },
          { tex: 'w^{*} = -\\frac{G}{H + \\lambda}', plain: 'The leaf\'s prediction is the (negative) total slope divided by the total curvature plus λ. Without λ, for squared error, this is just the average residual. λ shrinks it towards zero, especially for leaves with few rows.', symbols: [['G', 'sum of gradients in the leaf'], ['H', 'sum of hessians in the leaf']] },
          { tex: '\\text{Gain} = \\tfrac{1}{2} \\left[ \\frac{G_L^2}{H_L + \\lambda} + \\frac{G_R^2}{H_R + \\lambda} - \\frac{(G_L + G_R)^2}{H_L + H_R + \\lambda} \\right] - \\gamma', plain: 'How much better the objective gets if we split a node into left and right children: score of left + score of right − score of not splitting, minus the leaf cost γ. Split only if the gain is positive.', symbols: [['G_L, H_L', 'sums for rows going left'], ['G_R, H_R', 'sums for rows going right']] },
          { callout: 'For squared error, g = prediction − actual (the negative residual) and h = 1. So G is minus the sum of residuals and H is simply the number of rows. That makes these formulas easy to check by hand.', tone: 'tip' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Leaf values with and without λ', setup: 'Reuse the four stores from the gradient boosting chapter: sales 10, 14, 20, 28 (₹ lakh), starting prediction 18. With squared error, g = prediction − actual = 8, 4, −2, −10, and h = 1 for every store. Split {1, 2} vs {3, 4}.', steps: [
            'Left leaf: G = 8 + 4 = 12, H = 2. Right leaf: G = −2 − 10 = −12, H = 2.',
            'With λ = 0: w = −12 / 2 = −6 and +12 / 2 = +6 (the plain average residuals).',
            'With λ = 1 (XGBoost\'s default): w = −12 / 3 = −4 and +12 / 3 = +4.',
            'Gain with λ = 1, γ = 0: ½ × [144/3 + 144/3 − 0²/5] = ½ × 96 = 48.',
          ], result: 'λ pulls leaf values towards zero, so each tree makes a more cautious correction. Leaves backed by only a handful of rows are shrunk the most.' } },
          { example: { title: 'Choosing between two splits', setup: 'Same data, λ = 1. Compare the split {1, 2} | {3, 4} with {1, 2, 3} | {4}.', steps: [
            'Split A ({1, 2} | {3, 4}): gain = 48 (from above).',
            'Split B: left G = 8 + 4 − 2 = 10, H = 3; right G = −10, H = 1.',
            'Gain B = ½ × [10²/4 + 10²/2 − 0²/5] = ½ × (25 + 50) = 37.5.',
            '48 > 37.5, so XGBoost chooses split A.',
          ], result: 'The gain formula ranks splits the same way a human would ("separate small from large stores first"), but it already includes the regularisation penalty.' } },
          { example: { title: 'Regularisation refuses a split', setup: 'Should XGBoost split further? Try splitting the right leaf {3, 4} (g = −2 and −10) and the left leaf {1, 2} (g = 8 and 4), each into single stores.', steps: [
            'Right leaf, λ = 1: ½ × [(−2)²/2 + (−10)²/2 − (−12)²/3] = ½ × (2 + 50 − 48) = 2.',
            'With γ = 0 the gain is +2, so split. With γ = 5 the gain is 2 − 5 = −3, so do not split.',
            'Left leaf, λ = 1: ½ × [8²/2 + 4²/2 − 12²/3] = ½ × (32 + 8 − 48) = −4. Refused even with γ = 0.',
            'The same left split with λ = 0 would have gain ½ × (64 + 16 − 72) = +4 and be accepted.',
          ], result: 'λ and γ are guards against splitting hairs. Splits that only separate one or two rows by a little need to clear a bar before they are allowed.' } },
        ],
      },
      {
        heading: 'XGBoost vs LightGBM vs CatBoost',
        blocks: [
          { p: 'All three implement regularised gradient boosting with histograms, missing-value handling, early stopping and optional GPU training. Their main differences are in how they grow trees and how they treat categorical features.' },
          { diagram: { kind: 'table', head: ['', 'XGBoost', 'LightGBM', 'CatBoost'], rows: [['Origin', 'Tianqi Chen; open source, paper 2016', 'Microsoft; open source, paper 2017', 'Yandex; open source since 2017'], ['Tree growth', 'Level-wise by default (depth limit)', 'Leaf-wise (grows the best leaf)', 'Symmetric (oblivious) trees'], ['Main size knob', 'max_depth (default 6)', 'num_leaves (default 31)', 'depth (default 6)'], ['Categoricals', 'Supported natively in recent versions (enable_categorical)', 'Native categorical splits', 'Ordered target statistics, its signature feature'], ['Signature tricks', 'Second-order gain, sparsity-aware missing handling', 'GOSS row sampling, exclusive feature bundling', 'Ordered boosting to reduce target leakage']], caption: 'A feature-level comparison. Which library is fastest or most accurate depends on the dataset and tuning; published benchmarks disagree, so try two on your own data.' } },
          { term: 'Leaf-wise growth', def: 'Growing a tree by always splitting whichever leaf gives the biggest gain, wherever it is. This can make deep, lopsided trees that fit quickly but overfit small data unless num_leaves or min_data_in_leaf is limited.' },
          { term: 'Target statistic (target encoding)', def: 'Replacing a category (for example a city) with a number computed from the target, such as the average claim rate in that city. Done naively it leaks the answer; CatBoost computes it only from rows that come "before" each row in a random order.' },
          { diagram: { kind: 'tree', root: { label: 'Level 1: city tier = 1?', children: [ { label: 'Level 2: amount > ₹5,000?', edge: 'yes', children: [ { label: 'leaf A', edge: 'yes' }, { label: 'leaf B', edge: 'no' } ] }, { label: 'Level 2: amount > ₹5,000?', edge: 'no', children: [ { label: 'leaf C', edge: 'yes' }, { label: 'leaf D', edge: 'no' } ] } ] }, caption: 'A CatBoost-style symmetric tree: every node at the same level asks the same question. This is restrictive but acts as regularisation and makes prediction very fast.' } },
          { bullets: [
            '**XGBoost:** a mature, widely deployed default with many language bindings and a large community.',
            '**LightGBM:** often very fast on large datasets thanks to leaf-wise growth and its sampling tricks; watch for overfitting on small data.',
            '**CatBoost:** strong when there are many categorical columns, and its defaults tend to need less tuning.',
            '**scikit-learn HistGradientBoosting:** a LightGBM-inspired implementation built into scikit-learn; a good choice if you want no extra dependency.',
          ] },
        ],
      },
      {
        heading: 'These libraries in the real world',
        blocks: [
          { case: { title: 'Motor insurance claim prediction (illustrative)', story: 'An insurer prices motor policies using vehicle make and model, RTO region, driver age, no-claim bonus, add-ons and past claims. Several of these are categorical with hundreds of levels. The data science team compares CatBoost, LightGBM and XGBoost using the same five-fold, time-respecting validation and the same early stopping rule. CatBoost handles the high-cardinality columns without manual encoding and gives the best validation log loss for claim frequency, while LightGBM trains fastest for a separate claim-severity model. The team keeps both, documents the comparison, and uses SHAP values to explain premium drivers to the pricing committee and regulators.' } },
          { bullets: [
            '**Fraud and risk:** real-time scoring of payments and loan applications.',
            '**Marketing:** propensity-to-buy and uplift models on large customer tables.',
            '**Operations:** predicting delivery delays, equipment failure and demand.',
            '**Competitions:** these libraries are a common backbone of winning tabular solutions, often in blends.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Overfitting with too little data.** Leaf-wise trees and high learning rates can memorise small datasets. Use early stopping, smaller num_leaves or depth, and larger minimum leaf sizes.',
            '**Tuning rabbit holes.** Dozens of hyperparameters invite endless searching. Tune a few that matter (learning rate, depth or leaves, minimum leaf size, row and column subsampling, λ) with cross-validation.',
            '**Different names for similar things.** `eta` vs `learning_rate`, `lambda` vs `reg_lambda`, `colsample_bytree` vs `feature_fraction`. Read each library\'s docs before copying settings across.',
            '**Not for images, audio or free text.** Neural networks dominate there. Boosted trees shine on tabular data.',
            '**Explanations need care.** Use SHAP values or permutation importance rather than default "split count" importances.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'Level-wise (XGBoost default)', items: ['Splits every node at a depth before going deeper', 'Balanced trees, depth-limited', 'More predictable, safer on small data', 'May spend splits on low-gain nodes'] }, right: { title: 'Leaf-wise (LightGBM)', items: ['Always splits the single best leaf', 'Lopsided trees, leaf-count limited', 'Often reaches lower loss with fewer leaves', 'Needs limits to avoid overfitting'] }, caption: 'Two strategies for growing the same kind of tree. XGBoost can also grow leaf-wise with grow_policy="lossguide".' } },
        ],
      },
    ],
    faq: [
      { q: 'Which library should I learn first?', a: 'Any one of them; the concepts transfer. XGBoost has the longest history and most examples. If your data has many categorical columns, try CatBoost early. If it is very large, try LightGBM.' },
      { q: 'Are these libraries always better than a random forest?', a: 'Not always. On many tabular problems a well-tuned boosting library edges out a forest, but the margin varies and sometimes vanishes. Always compare on a validation set that mimics real use.' },
      { q: 'What does early stopping need?', a: 'A validation set passed to the training call and a patience value, for example stop if no improvement in 50 rounds. The library then keeps the best number of trees.' },
      { q: 'Do I need to impute missing values?', a: 'Usually not. All three learn a default direction for missing values at each split. Still check why data is missing; sometimes "missing" carries meaning you should keep as a feature.' },
      { q: 'Can I use them inside scikit-learn pipelines?', a: 'Yes. Each provides scikit-learn-style classes (`XGBClassifier`, `LGBMClassifier`, `CatBoostClassifier`) that work with pipelines, cross-validation and grid search.' },
      { q: 'What are λ and γ in plain words?', a: 'λ shrinks leaf values towards zero so no single leaf makes a dramatic correction. γ is a fee for adding a leaf; a split must improve the objective by more than γ to be made.' },
    ],
  },

  stacking: {
    minutes: 15,
    hook: 'A head of strategy has three analysts. One is brilliant on consumer trends but overreacts to fads; one is a careful number-cruncher who misses turning points; one is average at everything. Over time she learns whom to trust, and how much, for which kind of question. Her combined judgement beats any single analyst. **Stacking** trains a model to play her role: a "manager" model that learns how best to combine the predictions of other models.',
    sections: [
      {
        heading: 'The problem: several good models, one decision',
        blocks: [
          { p: 'By now you might have a random forest, a gradient-boosted model and a regularised linear regression, all trained to predict the same thing. They score similarly on validation data, but they make **different mistakes**: the forest is cautious near extremes, the boosted model sometimes overshoots, the linear model misses interactions. Picking one throws away what the others know.' },
          { p: 'A simple average often helps, as you saw with bagging. But a simple average treats all models as equally trustworthy. What if one model deserves 60% of the say and another deserves almost none? What if a model is reliable only for certain kinds of rows? Learning those weights from data is the idea of **stacking**, introduced by David Wolpert in 1992 as "stacked generalisation".' },
          { term: 'Base model', def: 'One of the first-level models whose predictions are being combined, such as a random forest or a gradient-boosted model. Also called a level-0 model.' },
          { term: 'Meta-model', def: 'A second-level model that takes the base models\' predictions as its inputs and produces the final prediction. Also called a level-1 model or blender.' },
          { diagram: { kind: 'flow', nodes: ['**Training data**', '**Base models**: forest, boosting, linear', '**Out-of-fold predictions** become new features', '**Meta-model** learns how to combine them', '**Final prediction**'], caption: 'Stacking in one line: the base models\' predictions become the inputs for one more model. The crucial detail is that those predictions must be made on data each base model did not train on.' } },
        ],
      },
      {
        heading: 'Building the intuition: the manager and her analysts',
        blocks: [
          { p: 'Let us follow the strategy head as she learns whom to trust, with no formulas.' },
          { steps: [
            '**Collect forecasts made in advance.** For last year\'s 24 monthly forecasts, she writes down what each analyst predicted before the results came in.',
            '**Compare with what happened.** She notices the trend analyst is usually too high and the number-cruncher too low, by similar amounts.',
            '**Learn a rule.** "Take roughly half of each of those two; ignore the third." Their errors cancel.',
            '**Apply the rule to new forecasts.** Next month she combines the analysts\' fresh forecasts using her learned rule.',
          ], title: 'How a manager learns to combine opinions' },
          { p: 'The essential point is in step 1: she judged the analysts on forecasts they made **before** seeing the answer. If she had judged them on how well they "explained" last year after the fact, the analyst best at rationalising the past would look best, and her rule would be useless.' },
          { think: { q: 'Why would judging analysts on hindsight explanations mislead the manager?', a: 'Hindsight explanations can fit the past perfectly without any forecasting skill. A model that memorises its training data does the same. If the meta-model sees such in-sample predictions, it will over-trust the memoriser and perform badly on new data.' } },
          { callout: 'The meta-model must only ever see predictions the base models made on rows they were not trained on. Everything clever about stacking follows from this one rule.', tone: 'key' },
        ],
      },
      {
        heading: 'How stacking works, step by step',
        blocks: [
          { p: 'The standard way to get honest predictions for every training row is **k-fold cross-validation**, used here to manufacture **out-of-fold predictions**.' },
          { term: 'Cross-validation (k-fold)', def: 'Splitting the data into k equal parts (folds), then training k times, each time holding out one fold for testing and training on the rest.' },
          { term: 'Out-of-fold (OOF) prediction', def: 'A prediction for a row made by a model that was trained without that row. Every row gets exactly one OOF prediction per base model.' },
          { steps: [
            '**Split the training data into k folds** (often 5).',
            '**For each base model and each fold,** train on the other k − 1 folds and predict the held-out fold. After k rounds every row has one honest OOF prediction from each base model.',
            '**Build a new table** whose columns are the base models\' OOF predictions (optionally plus the original features).',
            '**Train the meta-model** on this table to predict the true target. Simple meta-models, like linear or logistic regression, work best.',
            '**Refit each base model on all the training data** so it is as strong as possible for future use.',
            '**Predict new cases:** run them through the refitted base models, feed those predictions to the meta-model, and read off the final answer.',
          ], title: 'Stacking with out-of-fold predictions' },
          { diagram: { kind: 'table', head: ['Row', 'Fold', 'Forest OOF', 'Boosting OOF', 'Linear OOF', 'Actual'], rows: [['1', '1', '54', '47', '58', '50'], ['2', '1', '60', '66', '58', '62'], ['3', '2', '50', '42', '52', '45'], ['4', '2', '74', '85', '70', '80'], ['5', '3', '72', '66', '64', '70'], ['6', '3', '52', '58', '60', '55']], caption: 'The meta-model\'s training table. Each prediction for a row in fold 1 came from base models trained on folds 2 and 3 only. The meta-model learns to map the three prediction columns to the actual column.' } },
          { term: 'Blending', def: 'A simpler cousin of stacking: hold back a single validation set, train base models on the rest, and fit the meta-model on their predictions for the held-back set. Easier to code, but the meta-model learns from fewer rows.' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { p: 'The most common meta-model is a weighted sum of the base predictions, sometimes with an intercept:' },
          { tex: '\\hat{y} = w_0 + \\sum_{k=1}^{K} w_k \\, \\hat{f}_k(x)', plain: 'The final prediction is a constant plus each base model\'s prediction times its learned weight. A simple average is the special case where every weight is 1/K and the constant is zero.', symbols: [['\\hat{f}_k(x)', 'prediction of base model k'], ['w_k', 'weight learned for model k'], ['K', 'number of base models']] },
          { p: 'The weights are learned by fitting the meta-model on the out-of-fold predictions, never on in-sample ones. Written carefully:' },
          { tex: 'z_{ik} = \\hat{f}_k^{(-j(i))}(x_i)', plain: 'The meta-model\'s input for row i from model k is the prediction made by a copy of model k trained without fold j(i), the fold that contains row i.', symbols: [['z_{ik}', 'meta-feature for row i from model k'], ['j(i)', 'the fold that contains row i'], ['\\hat{f}_k^{(-j)}', 'model k trained on all folds except j']] },
          { p: 'Why keep the meta-model simple? Its inputs are a handful of highly correlated columns (all models are trying to predict the same thing). A flexible meta-model would overfit those correlations. Linear regression with non-negative weights, or ridge regression, gives stable, interpretable weights. For classification, logistic regression on predicted probabilities is standard.' },
          { callout: 'In scikit-learn, `StackingRegressor` and `StackingClassifier` do all of this for you: by default they build 5-fold OOF predictions, use `RidgeCV` (regression) or `LogisticRegression` (classification) as the meta-model, and refit the base models on all data. Set `passthrough=True` to give the meta-model the original features too.', tone: 'tip' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Why a learned combination beats each model', setup: 'Use the six rows in the table above (monthly sales in ₹ lakh). Forest errors (prediction − actual): +4, −2, +5, −6, +2, −3. Boosting errors: −3, +4, −3, +5, −4, +3. Linear errors: +8, −4, +7, −10, −6, +5.', steps: [
            'Mean absolute error (MAE): forest = (4 + 2 + 5 + 6 + 2 + 3) / 6 ≈ 3.67. Boosting = (3 + 4 + 3 + 5 + 4 + 3) / 6 ≈ 3.67. Linear = 40 / 6 ≈ 6.67.',
            'Simple average of all three: predictions 53, 61.33, 48, 76.33, 67.33, 56.67 → MAE ≈ 2.44.',
            'A meta-model with non-negative weights fitted to these OOF predictions learns roughly 0.48 × forest + 0.52 × boosting + 0 × linear.',
            'Rounding to 0.5 and 0.5: predictions 50.5, 63, 46, 79.5, 69, 55 → errors +0.5, +1, +1, −0.5, −1, 0 → MAE ≈ 0.67.',
          ], result: 'The forest and boosting err in opposite directions, so an even split cancels most of their error, and the weaker linear model is switched off. (On six rows this is a demonstration; in practice judge the stack on a separate test set.)' } },
          { diagram: { kind: 'bars', labels: ['Forest', 'Boosting', 'Linear', 'Simple average', 'Stacked (0.5 / 0.5 / 0)'], values: [3.67, 3.67, 6.67, 2.44, 0.67], highlight: 4, yLabel: 'MAE (₹ lakh)', caption: 'The gain from combining comes from models making different mistakes. A learned weighting can also mute a weak model that a simple average would let drag the result down.' } },
          { example: { title: 'Counting the work: how many models get trained?', setup: 'Three base models, 5-fold stacking, 1,000 training rows.', steps: [
            'Each fold holds 1,000 / 5 = 200 rows; each OOF fit trains on 800 rows and predicts 200.',
            'OOF fits: 3 models × 5 folds = 15 fits, producing 1,000 OOF predictions per model.',
            'Final refits on all 1,000 rows: 3 more fits. Plus 1 meta-model fit.',
            'Total: 15 + 3 + 1 = 19 training runs instead of 3.',
          ], result: 'Stacking costs roughly k + 1 times the training effort of the base models. That is fine for a competition or a high-value model, but worth questioning for a quick internal report.' } },
          { example: { title: 'Business case: the leaky stack (illustrative)', setup: 'A retailer stacks a 1-nearest-neighbour model (which predicts each row by copying the most similar training row) with a gradient-boosted model to forecast store returns. A junior analyst fits the meta-model on in-sample predictions instead of OOF ones.', steps: [
            'In-sample, the nearest-neighbour model finds each row\'s own copy, so its MAE is 0: a "perfect" model.',
            'The meta-model learns to put almost all its weight on the nearest-neighbour model.',
            'Measured properly with OOF predictions, the nearest-neighbour model\'s MAE is, say, ₹6 lakh versus ₹3.5 lakh for boosting.',
            'In production the stack performs close to the weak nearest-neighbour model, worse than boosting alone.',
          ], result: 'Using in-sample predictions to train the meta-model is the classic stacking bug. OOF predictions would have revealed the true ranking and given boosting most of the weight.' } },
        ],
      },
      {
        heading: 'Stacking, blending or just averaging?',
        blocks: [
          { p: 'Combining models is a spectrum from very simple to quite elaborate. Choose the lightest option that captures most of the benefit.' },
          { diagram: { kind: 'compare', left: { title: 'Simple averaging / voting', items: ['No extra training', 'Hard to overfit', 'Works well when models are similarly good', 'scikit-learn: `VotingClassifier`, `VotingRegressor`'] }, right: { title: 'Stacking with a meta-model', items: ['Learns weights (or more) from OOF predictions', 'Can switch off weak models', 'Needs careful cross-validation', 'scikit-learn: `StackingClassifier`, `StackingRegressor`'] }, caption: 'Start with averaging. Move to stacking when base models differ clearly in quality or style and you have enough data to learn weights reliably.' } },
          { bullets: [
            '**Diversity matters more than count.** Three different model families (trees, linear, k-NN or neural network) usually help more than five slightly different forests.',
            '**Blending** (a single hold-out set) is quicker to build and avoids some leakage traps but wastes data.',
            '**Multi-level stacks** (meta-models of meta-models) exist in competitions; they rarely justify their complexity in business settings.',
            '**Classification:** feed predicted probabilities, not hard labels, to the meta-model; they carry much more information.',
          ] },
        ],
      },
      {
        heading: 'Stacking in the real world',
        blocks: [
          { case: { title: 'The Netflix Prize', story: 'From 2006 to 2009 Netflix ran a public competition offering $1 million to anyone who could improve its movie-rating predictions by 10%. The winning team, BellKor\'s Pragmatic Chaos, was itself a merger of competing teams, and its final submission blended predictions from a very large number of different models: matrix factorisation variants, neighbourhood methods and others. The lesson that stuck with the industry was twofold: blending diverse models can squeeze out extra accuracy, and that accuracy can come with engineering complexity that a company may not want to run in production.' } },
          { bullets: [
            '**Kaggle and other competitions:** top tabular solutions commonly stack boosted trees, neural networks and linear models.',
            '**Credit scoring:** a simple stack of a scorecard (logistic regression) and a boosted model can keep interpretability while adding accuracy.',
            '**Demand forecasting:** combining a statistical time-series model with a machine-learning model often beats either alone.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Leakage through in-sample predictions** (the worked example above). Always use out-of-fold predictions.',
            '**Leakage through time.** For time-ordered data, ordinary k-fold lets a model "see the future". Use time-series splits so OOF predictions are always made forward in time.',
            '**Complexity and maintenance.** A stack is several models plus a meta-model, each needing monitoring, retraining and explanation.',
            '**Small or no gains.** If base models are similar, they make the same mistakes and stacking adds little. Check the gain on a true test set before shipping.',
            '**Over-flexible meta-models.** A deep tree or boosted meta-model on a few correlated columns overfits easily. Keep it linear unless you have lots of data.',
          ] },
          { callout: 'Ask whether a 1–2% gain is worth doubling the system\'s complexity. In competitions it always is; in a bank\'s production stack, often it is not.', tone: 'warn' },
        ],
      },
    ],
    faq: [
      { q: 'What is the difference between stacking and blending?', a: 'Stacking builds out-of-fold predictions for every training row using cross-validation. Blending uses one held-out validation set. Stacking uses data more efficiently; blending is simpler and faster.' },
      { q: 'Which meta-model should I use?', a: 'Start with linear regression with non-negative weights or ridge regression for numbers, and logistic regression for classes. These rarely overfit and their weights are easy to read.' },
      { q: 'How many base models should I stack?', a: 'Usually 2 to 5 diverse ones. Adding near-duplicate models adds cost but little benefit.' },
      { q: 'Is stacking the same as bagging or boosting?', a: 'No. Bagging and boosting combine many copies of one model type in fixed ways (average or sequential sum). Stacking combines different model types and learns the combination.' },
      { q: 'Can I give the meta-model the original features as well?', a: 'Yes; in scikit-learn set `passthrough=True`. It lets the meta-model learn, for example, that boosting is more reliable for large stores. It also raises the risk of overfitting, so validate carefully.' },
      { q: 'Why refit base models on all data at the end?', a: 'The OOF copies were each trained on only part of the data. For predicting new cases you want the strongest version of each model, trained on everything.' },
    ],
  },

  perceptron: {
    minutes: 16,
    hook: 'A nightclub bouncer decides in seconds: dress code met? On the guest list? Arrived with a group of ten? Each reason pushes him towards yes or no, some more strongly than others, and if the total crosses his line, you are in. In 1958 the psychologist Frank Rosenblatt built a machine that made decisions exactly like this, and that could **learn** how much each reason should count. He called it the **perceptron**. Every neural network today, including the ones behind chatbots, is built from descendants of this one idea.',
    sections: [
      {
        heading: 'The problem: can a machine learn a rule from examples?',
        blocks: [
          { p: 'In the 1950s computers followed hand-written instructions. If you wanted a machine to tell a "good" loan application from a "bad" one, someone had to write the rule: "approve if income is above X and existing debt below Y". Rosenblatt asked a bolder question: could a machine **discover the rule itself** just by seeing labelled examples and correcting its own mistakes?' },
          { p: 'His inspiration was the brain. A biological neuron receives signals from other neurons; some excite it and some inhibit it. If the combined signal is strong enough, the neuron "fires". Earlier, in 1943, Warren McCulloch and Walter Pitts had described a simple mathematical neuron. Rosenblatt added the missing piece: a **learning rule** that adjusts the strength of each input.' },
          { term: 'Artificial neuron', def: 'A tiny calculation: multiply each input by a weight, add them up with a bias, and pass the total through an activation function to produce an output.' },
          { term: 'Weight', def: 'A number saying how much one input matters and in which direction. A large positive weight pushes the decision towards yes; a negative weight pushes it towards no.' },
          { term: 'Bias', def: 'An extra number added to the weighted sum that shifts the decision line. It sets how easy or hard it is to say yes when all inputs are zero, like the bouncer\'s strictness on a given night.' },
          { diagram: { kind: 'flow', nodes: ['**Inputs** x₁, x₂, … (e.g. income, debt)', '**Multiply by weights** w₁, w₂, …', '**Add up + bias**: z = w·x + b', '**Step activation**: 1 if z > 0, else 0', '**Decision**: approve / decline'], caption: 'One perceptron. Information flows left to right: weighted inputs are summed and a threshold turns the sum into a yes/no answer.' } },
        ],
      },
      {
        heading: 'Building the intuition: the bouncer who learns',
        blocks: [
          { p: 'Imagine a new bouncer with no idea which reasons matter. He starts with every reason counting zero, and the club manager tells him after each decision whether he got it right.' },
          { steps: [
            '**He makes a call** using his current sense of how much each reason counts.',
            '**If he was right, he changes nothing.** No need to fix what works.',
            '**If he wrongly turned someone away,** he slightly increases the importance of the reasons that guest had going for them.',
            '**If he wrongly let someone in,** he slightly decreases the importance of the reasons that guest had.',
            '**Over many nights,** the importance he gives each reason settles at values that sort guests correctly, if such values exist.',
          ], title: 'Learning from mistakes only' },
          { p: 'This "only change when wrong, and nudge towards the right answer" rule is the perceptron learning rule. It is simple enough to do with a pencil, which you will do shortly.' },
          { think: { q: 'If a guest wrongly turned away had "on guest list = 0" and "dress code met = 1", which importance should the bouncer increase?', a: 'Only the dress-code importance (and the overall leniency, the bias). The guest-list input was 0, so it played no part in this decision and should not be credited or blamed. In the update rule, a weight changes in proportion to its input, so an input of 0 means no change.' } },
          { callout: 'A perceptron draws a single straight line (or flat surface, in more dimensions) between yes and no. Everything it can and cannot do follows from that.', tone: 'key' },
        ],
      },
      {
        heading: 'How the perceptron learns, step by step',
        blocks: [
          { steps: [
            '**Start** with all weights and the bias at zero (or small random numbers). Choose a learning rate η, for example 1.',
            '**Take one training example** with inputs x and correct label t (1 or 0).',
            '**Compute the output:** z = w·x + b; output o = 1 if z > 0, otherwise 0.',
            '**Compute the error:** e = t − o. It is +1 (should have said yes), −1 (should have said no) or 0 (correct).',
            '**Update:** each weight wⱼ ← wⱼ + η × e × xⱼ, and the bias b ← b + η × e.',
            '**Loop through all examples** repeatedly. One full pass is an epoch. Stop when an entire epoch has no mistakes.',
          ], title: 'The perceptron learning algorithm' },
          { term: 'Epoch', def: 'One complete pass through all the training examples. Training usually takes many epochs.' },
          { term: 'Linearly separable', def: 'Data where a single straight line (or flat plane) can separate the two classes perfectly.' },
          { p: 'A reassuring result, the **perceptron convergence theorem** (proved in the early 1960s), says: if the data is linearly separable, this procedure is guaranteed to find a separating line in a finite number of updates. If the data is not separable, it never settles and keeps flipping forever.' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { tex: 'z = w_1 x_1 + w_2 x_2 + \\dots + w_n x_n + b = \\mathbf{w} \\cdot \\mathbf{x} + b', plain: 'The neuron\'s score is each input times its weight, all added up, plus the bias. The dot notation w·x is just shorthand for that sum of products.', symbols: [['x_j', 'input j (a feature)'], ['w_j', 'weight on input j'], ['b', 'bias'], ['z', 'the weighted sum, before activation']] },
          { tex: 'o = \\begin{cases} 1 & \\text{if } z > 0 \\\\ 0 & \\text{otherwise} \\end{cases}', plain: 'The step activation: if the score is above zero, say yes; otherwise say no. There is no "maybe"; the output jumps from 0 to 1.', symbols: [['o', 'output (prediction)']] },
          { term: 'Activation function', def: 'The function applied to the weighted sum to produce the neuron\'s output. The perceptron uses a hard step; modern networks use smooth functions such as sigmoid or ReLU.' },
          { tex: 'w_j \\leftarrow w_j + \\eta\\,(t - o)\\,x_j, \\qquad b \\leftarrow b + \\eta\\,(t - o)', plain: 'If the prediction was right, t − o = 0 and nothing changes. If the neuron said 0 but should have said 1, add a bit of each input to its weight, making the score bigger next time for similar inputs. If it said 1 but should have said 0, subtract.', symbols: [['t', 'true label (1 or 0)'], ['\\eta', 'learning rate'], ['t - o', 'the error: +1, 0 or −1']] },
          { p: 'Geometrically, the equation w·x + b = 0 is a straight line in the space of inputs. Points on one side get score above zero (yes), points on the other side below zero (no). Each update tilts and shifts that line towards classifying the misclassified point correctly.' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Teaching a perceptron the AND rule', setup: 'Inputs (x₁, x₂) are 0 or 1; target is 1 only for (1, 1). Start with w = [0, 0], b = 0, η = 1. Present (0,0), (0,1), (1,0), (1,1) in that order each epoch.', steps: [
            'Epoch 1: (0,0), (0,1), (1,0) all give z = 0 → output 0, correct. (1,1): z = 0 → output 0, target 1, error +1 → w = [1, 1], b = 1.',
            'Epoch 2: (0,0): z = 1 → output 1, target 0, error −1 → w stays [1, 1] (inputs are 0), b = 0.',
            '(0,1): z = 1 → output 1, error −1 → w = [1, 0], b = −1. (1,0): z = 0 → output 0, correct.',
            '(1,1): z = 1 + 0 − 1 = 0 → output 0, error +1 → w = [2, 1], b = 0.',
            'Epochs 3 to 5 make four more corrections. Epoch 6 makes no mistakes, ending with w = [2, 1], b = −2.',
            'Check: (0,0) → −2, (0,1) → −1, (1,0) → 0, (1,1) → +1. Only (1,1) is above zero.',
          ], result: 'After 10 updates over 5 epochs, the perceptron has found a line that implements AND. The point (1,0) sits exactly on the line (z = 0) and is classified 0 by the "z > 0" rule.' } },
          { diagram: { kind: 'table', head: ['Step', 'Input', 'Target', 'z', 'Output', 'New w, b'], rows: [['1', '(1,1)', '1', '0', '0', '[1,1], 1'], ['2', '(0,0)', '0', '1', '1', '[1,1], 0'], ['3', '(0,1)', '0', '1', '1', '[1,0], −1'], ['4', '(1,1)', '1', '0', '0', '[2,1], 0'], ['…', '…', '…', '…', '…', '…'], ['10', '(0,1)', '0', '1', '1', '[2,1], −2']], caption: 'Only the mistakes are listed, because correct answers change nothing. Each row nudges the weights towards fixing that one error.' } },
          { example: { title: 'Business case: a loan-screening neuron (illustrative)', setup: 'A lender scores applicants with two scaled inputs: x₁ = monthly income in ₹ lakh, x₂ = existing EMIs as a share of income. Current weights: w₁ = 0.8, w₂ = −2.0, bias b = −0.5. Learning rate η = 0.1.', steps: [
            'Applicant A: income 1.5, EMI share 0.3 → z = 0.8 × 1.5 − 2.0 × 0.3 − 0.5 = 1.2 − 0.6 − 0.5 = 0.1 > 0 → approve.',
            'Applicant B: income 1.0, EMI share 0.4 → z = 0.8 − 0.8 − 0.5 = −0.5 → decline.',
            'Suppose evidence later shows applicants like B repay (target 1). Error = 1 − 0 = +1.',
            'Update: w₁ = 0.8 + 0.1 × 1 × 1.0 = 0.9; w₂ = −2.0 + 0.1 × 1 × 0.4 = −1.96; b = −0.5 + 0.1 = −0.4.',
            'New score for B: 0.9 − 1.96 × 0.4 − 0.4 = 0.9 − 0.784 − 0.4 = −0.284. Still declined, but closer to the line.',
          ], result: 'The negative weight on EMI share encodes "more existing debt, less likely to approve". One correction moves the boundary a little; repeated corrections would approve B if the data supports it.' } },
          { example: { title: 'The XOR wall', setup: 'XOR outputs 1 when exactly one input is 1: (0,0) → 0, (0,1) → 1, (1,0) → 1, (1,1) → 0. Can any line separate the 1s from the 0s?', steps: [
            'For (0,0) → 0 we need b ≤ 0.',
            'For (0,1) → 1 we need w₂ + b > 0, and for (1,0) → 1 we need w₁ + b > 0.',
            'Adding these two: w₁ + w₂ + 2b > 0, so w₁ + w₂ + b > −b ≥ 0.',
            'But (1,1) → 0 needs w₁ + w₂ + b ≤ 0. Contradiction.',
          ], result: 'No weights work. A single perceptron cannot represent XOR, and its learning rule cycles forever on this data.' } },
          { diagram: { kind: 'scatter', xLabel: 'x₁', yLabel: 'x₂', caption: 'XOR: the two 1s (red) sit on one diagonal, the two 0s (blue) on the other. No single straight line puts both 1s on one side and both 0s on the other.', points: [[0, 0, 0], [1, 1, 0], [0, 1, 1], [1, 0, 1]] } },
        ],
      },
      {
        heading: 'Limits, history and what came next',
        blocks: [
          { p: 'In 1969 Marvin Minsky and Seymour Papert published the book "Perceptrons", which analysed carefully what single-layer perceptrons cannot compute, XOR being the famous example. The book is often cited as one reason enthusiasm and funding for neural-network research cooled for years.' },
          { p: 'The way out was known in principle: stack perceptrons in layers, so that hidden neurons create new features that make the problem separable. What was missing was a practical way to train the hidden layers. That arrived with **backpropagation**, popularised in 1986, and with smooth activation functions that make gradients possible. The next chapter, on multilayer perceptrons, picks up exactly there.' },
          { diagram: { kind: 'compare', left: { title: 'Perceptron', items: ['Step activation: output 0 or 1', 'Updates only on mistakes', 'No probabilities', 'Never settles if data is not separable'] }, right: { title: 'Logistic regression', items: ['Sigmoid activation: output between 0 and 1', 'Updates on every example, by how wrong it is', 'Gives probabilities', 'Always settles at a best compromise'] }, caption: 'Both draw a straight decision line. Logistic regression is the smooth, probabilistic cousin and is far more used in practice.' } },
        ],
      },
      {
        heading: 'The perceptron in the real world',
        blocks: [
          { case: { title: 'The Mark I Perceptron', story: 'Rosenblatt\'s ideas were built into hardware at the Cornell Aeronautical Laboratory: the Mark I Perceptron, a room-sized machine that took input from a grid of light sensors and adjusted its weights using motor-driven potentiometers. It could learn to distinguish simple shapes and marks after training. Newspaper coverage at the time was wildly optimistic about thinking machines. The real legacy was more modest and more lasting: the weighted sum plus activation, and learning by correcting errors, remain the building blocks of modern deep learning.' } },
          { bullets: [
            '**As a building block:** every neuron in a modern network is a perceptron with a smoother activation.',
            '**Fast linear classifiers on huge, sparse data:** perceptron-style updates are still used for text classification and online learning, where data arrives as a stream.',
            '**scikit-learn:** `sklearn.linear_model.Perceptron` implements it; it is equivalent to `SGDClassifier` with the perceptron loss.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls and practical advice',
        blocks: [
          { bullets: [
            '**Only straight-line boundaries.** If the classes are not linearly separable, use a multilayer network, a kernel method, or trees.',
            '**No probabilities or confidence.** For business decisions that need a probability (expected loss, pricing), use logistic regression instead.',
            '**Scale your inputs.** Large-valued features dominate the weighted sum and the updates. Standardise features first.',
            '**Order matters on noisy data.** The final weights depend on the order of examples. Shuffle each epoch, and consider the averaged perceptron, which averages weights across updates for stability.',
          ] },
          { callout: 'Treat the perceptron as a concept you must understand rather than a model you will often deploy. It makes every later neural-network idea easier.', tone: 'tip' },
        ],
      },
    ],
    faq: [
      { q: 'Is a perceptron the same as a neuron in a neural network?', a: 'Almost. A modern neuron computes the same weighted sum plus bias, but uses a smooth activation such as ReLU or sigmoid instead of a hard step, so it can be trained with gradients.' },
      { q: 'What is the difference between a perceptron and logistic regression?', a: 'Both use a weighted sum and a straight decision boundary. The perceptron outputs a hard 0 or 1 and learns only from mistakes; logistic regression outputs a probability and learns from every example by how wrong it was.' },
      { q: 'Why is there a bias term?', a: 'Without a bias, the decision line must pass through the origin (all inputs zero). The bias lets the line shift so it can sit wherever the data needs it.' },
      { q: 'What learning rate should I use?', a: 'For the classic perceptron with zero starting weights, the learning rate only rescales the weights and does not change the sequence of decisions, so η = 1 is common. With random starting weights, it does matter.' },
      { q: 'Does the perceptron always find the best line?', a: 'No. If the data is separable it finds some separating line, not necessarily the one with the widest gap. Support vector machines look for the widest-margin line.' },
      { q: 'Why learn this if nobody uses it directly?', a: 'Because weighted sums, activations, learning rates, epochs and updating by error all start here. Understanding one neuron makes multilayer networks and deep learning far less mysterious.' },
    ],
  },

  mlp: {
    minutes: 16,
    hook: 'A relay team loses a race by half a second. The coach does not just blame the last runner. She works backwards: the anchor lost 0.2 seconds, partly because the third runner\'s handover was late, which happened partly because the second runner started slowly. Each runner gets exactly their share of the blame and trains on it. A **multilayer perceptron** learns the same way: errors are passed backwards through its layers, and every connection adjusts by its share. That procedure, **backpropagation**, is how almost every neural network is trained.',
    sections: [
      {
        heading: 'The problem: patterns a straight line cannot capture',
        blocks: [
          { p: 'The perceptron chapter ended at a wall: a single neuron can only draw a straight line, so it cannot even learn XOR. Real business problems are full of such bends. Credit risk might be low for young applicants with stable jobs and for older applicants with assets, but high for some combinations in between. A straight line cannot carve out those regions.' },
          { p: 'The fix is to **stack neurons in layers**. The first layer of neurons turns raw inputs into new intermediate features; the next layer combines those features; and so on. With enough neurons, such a network can approximate almost any smooth relationship. The challenge is how to train the middle layers, which have no "correct answer" of their own.' },
          { term: 'Layer', def: 'A group of neurons that all receive the same inputs and pass their outputs on together. Networks have an input layer (the features), one or more hidden layers, and an output layer.' },
          { term: 'Hidden layer', def: 'A layer between input and output. It is "hidden" because we never see or set its correct values; the network invents useful intermediate features there.' },
          { term: 'Multilayer perceptron (MLP)', def: 'A neural network made of fully connected layers: every neuron in one layer feeds every neuron in the next. Also called a feed-forward neural network.' },
          { diagram: { kind: 'flow', nodes: ['**Input layer**: income, utilisation, age…', '**Hidden layer 1**: weighted sums + ReLU', '**Hidden layer 2**: combinations of features', '**Output layer**: sigmoid → probability', '**Loss**: compare with actual outcome'], caption: 'An MLP processes inputs left to right (the forward pass). Training then sends error information right to left (the backward pass) to adjust every weight.' } },
        ],
      },
      {
        heading: 'Building the intuition: a factory of specialists',
        blocks: [
          { p: 'Think of a loan-approval office organised in two floors.' },
          { steps: [
            '**Ground floor clerks** each look at the raw application and compute one judgement: one rates "income stability", another "debt pressure", another "credit history depth". Each is a neuron.',
            '**The first-floor manager** never reads applications. She only reads the clerks\' judgements and combines them into a final probability of repayment.',
            '**A loan goes bad.** The manager adjusts how much she trusts each clerk, and passes back a note to each clerk saying how much their judgement contributed to the mistake.',
            '**Each clerk adjusts** how they weigh the raw inputs, in proportion to the blame they received.',
            '**Over thousands of applications,** clerks become specialists in whatever intermediate judgements are most useful. Nobody told them what to specialise in.',
          ], title: 'Learning in a two-floor office' },
          { p: 'The striking part is the last step: hidden neurons **invent their own features**. In image networks, early neurons end up detecting edges and later ones detect shapes, without anyone designing them.' },
          { think: { q: 'If a clerk\'s judgement was not used by the manager at all (weight zero), how much blame should the clerk receive?', a: 'None. Blame flows back in proportion to the connection strength. A clerk whose output is ignored did not influence the mistake, so their weights get no update from it. This is exactly what the chain rule calculates.' } },
          { callout: 'Backpropagation is simply a careful, efficient way of assigning blame: it computes, for every weight, how much a tiny change in that weight would change the error.', tone: 'key' },
        ],
      },
      {
        heading: 'How an MLP is trained, step by step',
        blocks: [
          { steps: [
            '**Initialise** all weights with small random numbers (not zeros, or all neurons in a layer would stay identical).',
            '**Forward pass:** feed a batch of examples through the network, layer by layer, to get predictions.',
            '**Compute the loss:** compare predictions with actual values (log loss for classification, squared error for regression).',
            '**Backward pass (backpropagation):** starting from the loss, work backwards through the layers using the chain rule to get the gradient of the loss for every weight.',
            '**Update** every weight a small step against its gradient: w ← w − η × gradient.',
            '**Repeat** over many batches and epochs, checking a validation set to know when to stop.',
          ], title: 'The training loop' },
          { term: 'Activation function', def: 'A non-linear function applied to each neuron\'s weighted sum. Without it, stacked layers would collapse into one straight-line model. Common choices: ReLU in hidden layers, sigmoid or softmax at the output.' },
          { term: 'ReLU', def: 'Rectified Linear Unit: output the input if it is positive, otherwise 0. Written max(0, z). Simple, fast and the default in most modern networks.' },
          { diagram: { kind: 'curve', fn: 'Math.max(0, x)/4', fn2: '1/(1+Math.exp(-x))', xMin: -6, xMax: 6, legend: ['ReLU (scaled ÷4 to fit)', 'sigmoid'], xLabel: 'weighted sum z', yLabel: 'neuron output', caption: 'Two activation functions. ReLU is zero for negative inputs and rises in a straight line for positive ones (drawn at quarter height to share the axis). Sigmoid squashes any number into 0–1, which is ideal for an output probability.' } },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { p: 'Each layer does the perceptron calculation for many neurons at once, then applies an activation:' },
          { tex: '\\mathbf{h} = \\operatorname{ReLU}(W_1 \\mathbf{x} + \\mathbf{b}_1), \\qquad p = \\sigma(\\mathbf{v} \\cdot \\mathbf{h} + c)', plain: 'Hidden neurons: weighted sums of the inputs plus biases, passed through ReLU. Output: a weighted sum of the hidden neurons plus a bias, passed through the sigmoid to give a probability.', symbols: [['\\mathbf{x}', 'input features'], ['W_1, \\mathbf{b}_1', 'hidden-layer weights and biases'], ['\\mathbf{h}', 'hidden-layer outputs'], ['\\mathbf{v}, c', 'output weights and bias'], ['\\sigma', 'sigmoid function, 1 / (1 + e^{−z})']] },
          { tex: 'L = -\\big[\\, y \\ln p + (1 - y) \\ln(1 - p) \\,\\big]', plain: 'Log loss: if the true answer is 1, the loss is −ln p, small when p is near 1 and huge when p is near 0. It punishes confident wrong answers heavily.', symbols: [['y', 'actual label, 1 or 0'], ['p', 'predicted probability']] },
          { term: 'Chain rule', def: 'A calculus rule for chains of calculations: if A affects B and B affects C, then the effect of A on C is (effect of A on B) × (effect of B on C).' },
          { tex: '\\frac{\\partial L}{\\partial w_{11}} = \\underbrace{(p - y)}_{\\partial L/\\partial z} \\cdot \\underbrace{v_1}_{\\partial z/\\partial h_1} \\cdot \\underbrace{\\mathbb{1}[a_1 > 0]}_{\\partial h_1/\\partial a_1} \\cdot \\underbrace{x_1}_{\\partial a_1/\\partial w_{11}}', plain: 'The blame for a first-layer weight is a product of links along the path from that weight to the loss: the output error (p − y), how strongly hidden neuron 1 feeds the output (v₁), whether that neuron was active (1 if its sum was positive, else 0), and the input the weight multiplies (x₁).', symbols: [['a_1', 'hidden neuron 1\'s weighted sum before ReLU'], ['z', 'output neuron\'s weighted sum before sigmoid'], ['\\mathbb{1}[a_1>0]', '1 if the neuron was active, else 0']] },
          { p: 'The beautiful shortcut: for sigmoid plus log loss, the error at the output simplifies to just p − y. Backpropagation reuses each layer\'s blame to compute the previous layer\'s, so the cost of computing all gradients is roughly the same as one extra forward pass, even for millions of weights.' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Solving XOR with two hidden neurons', setup: 'Use ReLU hidden neurons with hand-picked weights: h₁ = max(0, x₁ + x₂), h₂ = max(0, x₁ + x₂ − 1). Output = h₁ − 2h₂.', steps: [
            '(0,0): h₁ = 0, h₂ = max(0, −1) = 0 → output 0 − 0 = 0.',
            '(0,1): h₁ = 1, h₂ = max(0, 0) = 0 → output 1.',
            '(1,0): h₁ = 1, h₂ = 0 → output 1.',
            '(1,1): h₁ = 2, h₂ = 1 → output 2 − 2 = 0.',
          ], result: 'Exactly XOR. Hidden neuron h₁ counts how many inputs are on; h₂ fires only when both are. The output subtracts the "both" case. A network trained by backpropagation discovers weights like these by itself.' } },
          { example: { title: 'Business case: a forward pass for a loan applicant (illustrative)', setup: 'Inputs (scaled): x₁ = income score 1.0, x₂ = credit utilisation 0.5. Hidden neuron 1: a₁ = 0.5x₁ + 0.3x₂ + 0.1. Hidden neuron 2: a₂ = −0.2x₁ + 0.8x₂ + 0. Output: z = 1.2h₁ − 0.7h₂ − 0.2, p = sigmoid(z). The applicant actually repaid (y = 1).', steps: [
            'a₁ = 0.5 × 1.0 + 0.3 × 0.5 + 0.1 = 0.5 + 0.15 + 0.1 = 0.75 → h₁ = ReLU(0.75) = 0.75.',
            'a₂ = −0.2 × 1.0 + 0.8 × 0.5 = −0.2 + 0.4 = 0.2 → h₂ = 0.2.',
            'z = 1.2 × 0.75 − 0.7 × 0.2 − 0.2 = 0.9 − 0.14 − 0.2 = 0.56.',
            'p = 1 / (1 + e^−0.56) ≈ 0.636: a 63.6% predicted chance of repayment.',
            'Loss = −ln(0.636) ≈ 0.452.',
          ], result: 'The network leans towards "will repay" but not confidently. Hidden neuron 1 behaves like an "income strength" detector (positive weight to output); neuron 2, driven by utilisation, pulls the probability down.' } },
          { diagram: { kind: 'table', head: ['Quantity', 'Calculation', 'Value'], rows: [['a₁, h₁', '0.5(1.0) + 0.3(0.5) + 0.1', '0.75'], ['a₂, h₂', '−0.2(1.0) + 0.8(0.5)', '0.20'], ['z', '1.2(0.75) − 0.7(0.20) − 0.2', '0.56'], ['p', 'sigmoid(0.56)', '0.636'], ['Loss', '−ln(0.636)', '0.452']], caption: 'The forward pass, line by line. Every number on the right is reused in the backward pass, which is why networks store these values during training.' } },
          { example: { title: 'One step of backpropagation', setup: 'Continue the same applicant, learning rate η = 0.5. Compute gradients for the output weight v₁ (= 1.2) and the first-layer weight w₁₁ (= 0.5, linking x₁ to hidden neuron 1).', steps: [
            'Output error: ∂L/∂z = p − y = 0.636 − 1 = −0.364.',
            'Output weight: ∂L/∂v₁ = (p − y) × h₁ = −0.364 × 0.75 ≈ −0.273.',
            'First-layer weight: ∂L/∂w₁₁ = (p − y) × v₁ × 1 × x₁ = −0.364 × 1.2 × 1 × 1.0 ≈ −0.436 (neuron 1 was active, so the ReLU link is 1).',
            'Updates: v₁ ← 1.2 − 0.5 × (−0.273) ≈ 1.336; w₁₁ ← 0.5 − 0.5 × (−0.436) ≈ 0.718.',
            'Updating all nine weights and biases the same way and re-running the forward pass gives p ≈ 0.838 and loss ≈ 0.177.',
          ], result: 'Negative gradients mean "increase this weight to reduce the loss". One step raised the predicted repayment probability from 0.636 to 0.838 for this applicant. Training repeats this over thousands of applicants, so no single one dominates.' } },
        ],
      },
      {
        heading: 'Design choices and training in practice',
        blocks: [
          { p: 'An MLP has architectural choices (how many layers and neurons) and training choices (optimiser, learning rate, regularisation). Sensible defaults go a long way.' },
          { diagram: { kind: 'table', head: ['Choice', 'Typical starting point', 'Why'], rows: [['Hidden layers', '1–3', 'More layers capture more complex interactions but need more data'], ['Neurons per layer', '32–256', 'Too few underfits; too many overfits without regularisation'], ['Hidden activation', 'ReLU', 'Fast and avoids vanishing gradients'], ['Optimiser', 'Adam', 'Adapts step size per weight; robust default'], ['Regularisation', 'L2 penalty, dropout, early stopping', 'Prevents memorising the training set'], ['Input scaling', 'Standardise every feature', 'Unscaled inputs make training slow and unstable']], caption: 'Defaults that work for most tabular MLPs. scikit-learn\'s MLPClassifier defaults to one hidden layer of 100 ReLU neurons trained with Adam.' } },
          { term: 'Optimiser', def: 'The rule that turns gradients into weight updates. Plain gradient descent takes a fixed-size step; Adam adapts the step for each weight based on recent gradients.' },
          { diagram: { kind: 'curve', fn: '0.7*Math.exp(-x/8)+0.08', fn2: '0.7*Math.exp(-x/10)+0.16+0.004*x', xMin: 0, xMax: 60, marks: [{ x: 18, label: 'stop here' }], legend: ['training loss', 'validation loss'], xLabel: 'epoch', yLabel: 'log loss', caption: 'Illustrative training curves. Training loss keeps falling, but validation loss reaches its lowest point and then rises as the network starts memorising. Early stopping keeps the weights from around the best epoch.' } },
          { p: 'Networks are trained with **mini-batches**: the gradient is averaged over, say, 32 or 256 examples before each update. This is faster than one example at a time and less noisy, and it is the "stochastic" in stochastic gradient descent.' },
        ],
      },
      {
        heading: 'MLPs in the real world',
        blocks: [
          { case: { title: 'Backpropagation becomes mainstream (1986)', story: 'In 1986 David Rumelhart, Geoffrey Hinton and Ronald Williams published a short paper in Nature showing that backpropagation could train networks with hidden layers to learn useful internal representations. The method had earlier roots, but this paper made it widely known. Decades later, larger networks, far more data and graphics processors turned the same training recipe into modern deep learning. Hinton later shared the 2018 Turing Award for this line of work. Convolutional networks, recurrent networks and transformers all keep the MLP\'s core: layers of weighted sums and activations, trained by backpropagation.' } },
          { bullets: [
            '**Inside larger models:** every transformer block, the architecture behind large language models, contains an MLP sub-layer.',
            '**Tabular prediction:** churn, demand and credit models, especially when combined with learned embeddings for categorical features.',
            '**Sensor and signal data:** quality inspection and predictive maintenance from engineered sensor features.',
            '**Recommendation systems:** MLPs combine user and item embeddings into a relevance score.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Data hungry.** With a few thousand rows of tabular data, gradient-boosted trees usually beat an MLP with far less tuning.',
            '**Sensitive to scaling and settings.** Forgetting to standardise inputs, or a learning rate that is too high, can stop training altogether.',
            '**Overfitting.** Many weights can memorise small datasets. Use validation-based early stopping, L2 regularisation or dropout.',
            '**Hard to explain.** Weights do not translate into business rules. Use SHAP or partial-dependence plots, and consider simpler models where regulators need clear reasons.',
            '**Local minima and randomness.** Different random starts give different networks. Fix seeds for reproducibility and compare several runs.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'MLP / neural networks shine for…', items: ['Images, audio, text (with specialised layers)', 'Very large datasets', 'Learning embeddings for IDs and categories', 'Problems where one model must handle many tasks'] }, right: { title: 'Boosted trees often win for…', items: ['Small to medium tabular data', 'Mixed numeric and categorical columns', 'Fast iteration with little tuning', 'Easier explanation with SHAP and importance'] }, caption: 'A practical rule for business data: start with gradient boosting on tables; reach for neural networks when data is unstructured or very large.' } },
        ],
      },
    ],
    faq: [
      { q: 'Why do we need activation functions at all?', a: 'Without them, each layer is a weighted sum, and a weighted sum of weighted sums is still just a weighted sum. The whole network would collapse into one linear model and could not learn XOR.' },
      { q: 'How many hidden layers and neurons should I use?', a: 'For tabular data, start with one or two hidden layers of 64–128 neurons, then adjust using validation results. Bigger is not automatically better; it needs more data and regularisation.' },
      { q: 'Why not start all weights at zero?', a: 'Then every neuron in a layer computes the same thing and receives the same update, so they stay identical forever. Small random starting values break this symmetry.' },
      { q: 'What is the difference between an MLP and deep learning?', a: 'An MLP with several hidden layers is a deep network. "Deep learning" usually also includes specialised architectures such as convolutional networks for images and transformers for text, all trained by backpropagation.' },
      { q: 'What does "vanishing gradient" mean?', a: 'In deep networks with sigmoid activations, the chain-rule products of many small slopes become tiny, so early layers barely learn. ReLU activations and careful initialisation largely fixed this.' },
      { q: 'Can I build an MLP in scikit-learn?', a: 'Yes: `MLPClassifier` and `MLPRegressor` are fine for small to medium tabular problems. For larger networks or GPUs, use PyTorch or TensorFlow/Keras.' },
    ],
  },
};
