import { DeepLesson } from './types';

// ML WORKFLOW & EVALUATION group: train-test-split, bias-variance, cross-validation,
// regression-metrics, classification-metrics, hyperparameter-tuning, sklearn-pipelines.
export const WORKFLOW_DEEP: Record<string, DeepLesson> = {
  'train-test-split': {
    minutes: 19,
    hook: 'A data team proudly reports that their new demand-forecasting model is 99% accurate. Three months after launch, the warehouse is full of the wrong stock. What went wrong? They graded the model on the same data it had learned from, like a teacher who sets the exam using the exact questions the class practised the night before. The **train / test split** is the simple habit that stops this from happening, and it is the first thing any serious reviewer checks.',
    sections: [
      {
        heading: 'The problem: a model that has seen the answers',
        blocks: [
          { p: 'Every machine learning model learns from examples. You show it past loans and whether they were repaid, past months and how much was sold, past emails and whether they were spam. From these examples it builds a rule. The question that matters to the business is not "does the rule fit the past?" but **"will the rule work on cases it has never seen?"**' },
          { term: 'Model', def: 'A rule, learned from data, that turns inputs (income, age, month, price) into a prediction (will repay, units sold). It is the thing we want to judge.' },
          { term: 'Generalisation', def: 'How well a model performs on new data it did not learn from. This is the only performance that matters once the model is in use.' },
          { p: 'Here is the trap. A flexible model can simply **memorise** its examples. Imagine a "model" that is just a lookup table: if it sees a customer it has met before, it repeats that customer\'s answer. On the data it learned from it scores 100%. On a new customer it has nothing useful to say. Scoring a model on its own learning data rewards memory, not understanding.' },
          { p: 'The fix is old and simple: before you do anything else, **set some data aside** and never let the model see it while learning. At the end, you score the model on that hidden data. Because the model has never met these rows, its score is an honest preview of how it will behave in the real world.' },
          { diagram: { kind: 'bars', labels: ['Lookup table (train)', 'Lookup table (test)', 'Sensible model (train)', 'Sensible model (test)'], values: [100, 52, 86, 83], highlight: 1, yLabel: 'accuracy %', caption: 'Illustrative scores. The memorising lookup table looks perfect on the data it learned from and collapses on unseen data. The sensible model scores a little lower in training but almost the same on new data. Only the test bars tell you which model to trust.' } },
        ],
      },
      {
        heading: 'Building the intuition: the exam you have not seen',
        blocks: [
          { p: 'Think about how a good school tests a student. During the term the student works through practice papers, checks their answers and learns from mistakes. On exam day they receive **new questions** on the same topics. If they understood the material, they do well. If they only memorised the practice answers, they are found out.' },
          { steps: [
            '**The practice papers are the training data.** The student (the model) is allowed to study them as much as they like.',
            '**The exam paper is the test data.** It is locked in the head teacher\'s office until exam day.',
            '**Exam questions must be new but similar.** They cover the same syllabus, in the same style, so the score reflects real ability.',
            '**The exam is sat once.** If the student could retake the same paper fifty times and keep the best mark, the mark would mean much less.',
          ], title: 'The school analogy, step by step' },
          { p: 'Each of those four rules has a direct machine learning version. Train on one part of the data, test on another. Make sure the test part looks like the real world the model will face. And look at the test score **only once**, at the very end.' },
          { term: 'Training set', def: 'The rows the model is allowed to learn from. Usually 70–80% of the data.' },
          { term: 'Test set', def: 'Rows kept aside and never used for learning or for choosing between models. Used once, at the end, to estimate real-world performance. Also called the hold-out set.' },
          { think: { q: 'A colleague says: "Our dataset is small, so I trained on all of it and tested on all of it, to make full use of the data." What is wrong?', a: 'The test score now measures how well the model remembers its own examples, not how it handles new ones. It will be optimistic, sometimes wildly so. With small data the right answer is cross-validation (next chapters), not skipping the hold-out.' } },
        ],
      },
      {
        heading: 'How it works, step by step',
        blocks: [
          { diagram: { kind: 'flow', nodes: ['**Collect** and clean the full dataset', '**Split first**: train 80% / test 20%', '**Learn and tune** using the training part only', '**Score once** on the locked test set', '**Report** the test score as the expected real-world performance'], caption: 'The split happens before any learning, scaling or model choice. Everything to the left of "Score once" must ignore the test rows.' } },
          { p: '**Step 1: Decide the split.** Common choices are 80/20 or 70/30. Larger datasets can afford a smaller share for testing: with a million rows, 2% is still 20,000 test rows.' },
          { p: '**Step 2: Shuffle and cut.** For ordinary data, rows are shuffled randomly and then divided. In scikit-learn this is one line: `train_test_split(X, y, test_size=0.2, random_state=42)`. The `random_state` fixes the shuffle so the split is the same every time you run the code.' },
          { p: '**Step 3: Add a validation set if you need to choose.** Most projects try several models or settings. Choosing the best one is itself a kind of learning, so you need a third slice of data, carved out of the training part, to make that choice. The test set stays untouched.' },
          { term: 'Validation set', def: 'A slice of the training data used to compare models or settings while you are still building. Using it keeps the test set clean for the final, honest score.' },
          { p: '**Step 4: Score once.** After you have picked your final model, retrain it on all the training data (train plus validation) and score it on the test set. Write that number down. If you go back and change things because you did not like it, the test set has quietly become a validation set.' },
          { callout: 'Split **before** any preprocessing that learns from data: filling missing values with an average, scaling, choosing features. If those steps see the test rows, information leaks from the exam into the practice papers.', tone: 'warn' },
          { term: 'Data leakage', def: 'Any way that information from the test data (or from the future) sneaks into training. Leakage makes scores look better than they will be in real use.' },
        ],
      },
      {
        heading: 'Under the hood: what the test score really estimates',
        blocks: [
          { p: 'There is no heavy maths in splitting data, but two ideas explain why the rules matter. The first is that a test score is an **estimate** with uncertainty. The second is that the split must imitate the way the model will be used.' },
          { p: 'Suppose your classifier gets 85% of 200 test rows right. If you had drawn a different 200 rows, you might have seen 82% or 88%. The uncertainty of an accuracy measured on n rows is roughly the standard error below.' },
          { tex: '\\text{SE} = \\sqrt{\\frac{p(1-p)}{n}}', plain: 'Take the accuracy p, multiply by (1 − p), divide by the number of test rows, and take the square root. About 95% of the time, the true accuracy lies within roughly 2 standard errors of what you measured.', symbols: [['p', 'measured accuracy as a proportion (0.85 for 85%)'], ['n', 'number of rows in the test set'], ['\\text{SE}', 'standard error: typical size of the random wobble in the score']] },
          { p: 'Why does n sit in the denominator? Because every extra test row is another independent check, and many checks average out luck. Why p(1 − p)? Because a score near 50% is the most uncertain kind of coin, while a score near 0% or 100% has little room to wobble.' },
          { p: 'For 85% on 200 rows, 1.96 × SE is about **±4.9 percentage points**. On 2,000 rows it shrinks to about **±1.6 points**. So two models that score 84% and 86% on 200 test rows are not clearly different at all.' },
          { term: 'Stratified split', def: 'A split that keeps the share of each class (say 2% fraud, 98% genuine) the same in the training and test sets. Essential when one class is rare.' },
          { callout: 'The golden rule: **the test set must look like tomorrow.** For customers, that means new customers. For time series, that means future months. For factories, possibly a different plant. Choose the split that copies how the model will be used.', tone: 'key' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Stratifying a fraud dataset', setup: 'A bank has 10,000 card transactions, of which 200 (2%) are fraud. It wants an 80/20 split.', steps: [
            'Test set size = 20% of 10,000 = 2,000 rows. Training set = 8,000 rows.',
            'If the split were perfectly proportional, the test set would hold 2% of 2,000 = 40 frauds and the training set 160.',
            'With a purely random split, the number of frauds landing in the test set varies. Its average is 40, but its standard deviation is about 5.6, and there is roughly a 9% chance of getting 30 or fewer, or 50 or more.',
            'A test set with only 28 frauds would make recall estimates jumpy: each missed fraud moves recall by more than 3.5 points.',
            'A stratified split (`stratify=y`) forces exactly 40 frauds into the test set and 160 into training.',
          ], result: 'Both sets now carry the true 2% fraud rate, so the test score is not distorted by an unlucky shuffle.' } },
          { example: { title: 'A three-way split for a churn project', setup: 'A telecom operator has 50,000 customers and wants to compare three models before reporting one score to management.', steps: [
            'Hold out a test set of 15%: 7,500 customers, locked away.',
            'From the remaining 42,500, keep 7,500 as a validation set (again about 15% of the original). Training set = 35,000.',
            'Train three models on the 35,000. Validation F1 scores: 0.61, 0.66, 0.64. Pick the second.',
            'Retrain the chosen model on training plus validation (42,500 customers).',
            'Score once on the 7,500 test customers: F1 = 0.65.',
          ], result: 'The test score (0.65) is close to the validation score (0.66), which suggests the choice was not a fluke. The number reported to management is 0.65, the honest one.' } },
          { example: { title: 'Monthly sales: why you must split by time (business case)', setup: 'A two-wheeler dealer in Pune has 36 months of sales, January 2022 to December 2024, and wants to forecast next month\'s demand.', steps: [
            'A random split might put October 2024 in the test set and November 2024 in the training set. The model then "knows" what happened after the month it is predicting.',
            'The festive surge that starts around Navratri and Diwali would be visible on both sides of the split, making the forecast look much better than it can be in real life.',
            'Correct approach: train on months 1–30 (January 2022 to June 2024), test on months 31–36 (July to December 2024).',
            'This copies reality: on the day you use the model, only the past is available.',
          ], result: 'The time-based test error is usually worse than the random-split error, and that worse number is the true one.' } },
          { diagram: { kind: 'table', head: ['Months', 'Period', 'Role'], rows: [['1–30', 'Jan 2022 – Jun 2024', 'Training'], ['31–36', 'Jul 2024 – Dec 2024', 'Test'], ['37', 'Jan 2025', 'The real forecast']], caption: 'A time-based split: the test months always come after the training months, exactly as the real forecast comes after all known data.' } },
          { example: { title: 'Leakage in numbers: scaling before splitting', setup: 'Five monthly incomes in ₹ thousand: 10, 20, 30, 40 (training) and 100 (test). You want to subtract the mean before modelling.', steps: [
            'Wrong way: compute the mean of all five values = (10 + 20 + 30 + 40 + 100) / 5 = 40.',
            'Right way: compute the mean of the training values only = (10 + 20 + 30 + 40) / 4 = 25.',
            'The wrong mean is 15 higher because it "knows" about the large test value.',
            'Every training row is now shifted using information the model should not have had.',
          ], result: 'Always learn preprocessing quantities (means, medians, scales) from the training set only, then apply them to the test set.' } },
        ],
      },
      {
        heading: 'Choosing the right kind of split',
        blocks: [
          { p: 'The default random split is right for many problems, but not all. The question to ask is always: **"What will be different about the data on the day the model is used?"**' },
          { bullets: [
            '**Random split**: rows are independent and the future looks like the past. Example: classifying product photos.',
            '**Stratified split**: classification with a rare class, such as fraud, defects or churn. Keeps class shares equal.',
            '**Time-based split**: anything with dates, such as sales, prices, sensor readings or monthly churn. Train on earlier periods, test on later ones.',
            '**Group split**: several rows belong to the same customer, patient, vehicle or machine. All rows of one group go to the same side, so the model is tested on truly new customers. In scikit-learn, `GroupShuffleSplit`.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'Random split', items: ['Rows shuffled before cutting', 'Fine when rows are independent', 'Test rows come from the same period as training', 'Overstates accuracy for time series'] }, right: { title: 'Time-based split', items: ['Cut at a date: past trains, future tests', 'Required for forecasting and monthly data', 'Mimics the real moment of prediction', 'Usually gives a lower, more honest score'] }, caption: 'Pick the split that copies how predictions will be made. For anything with a calendar, the right-hand column wins.' } },
          { p: '**How big should the test set be?** Big enough that its uncertainty is small compared with the differences you care about. As a rule of thumb, aim for at least a few hundred test rows, and at least 30–50 examples of the rarest class. If you cannot afford that, use cross-validation for model choice and accept a wider error band on the final score.' },
        ],
      },
      {
        heading: 'In the real world',
        blocks: [
          { case: { title: 'A credit model that met new customers (illustrative)', story: 'An Indian NBFC builds a model to approve two-wheeler loans. The first version is split randomly across 2019–2023 applications and scores an AUC of 0.86. A reviewer asks for an out-of-time test: train on 2019–2022, test on 2023. The AUC drops to 0.78. Investigation shows that 2023 brought new dealer partners and a shift towards younger first-time borrowers, which the random split had hidden because every period was mixed into both sides. The team rebuilds features that capture dealer and borrower type, re-tests on 2023, and reaches 0.82. The model goes live with 0.82 as the stated expectation, and monthly monitoring confirms results close to that figure.' } },
          { bullets: [
            '**Manufacturing quality**: models trained on one production line are tested on a different line or a later batch, so drifting machines do not hide behind shuffled data.',
            '**Retail demand**: forecasts are tested on the most recent weeks, including at least one promotion period.',
            '**Healthcare**: models are often tested on patients from a different hospital before anyone trusts them.',
            '**Kaggle-style competitions** keep a private test set the participants never see, for exactly the reasons in this chapter.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Preprocessing before splitting.** Scaling, imputing, or selecting features on the full dataset leaks test information. Use a scikit-learn Pipeline so every step is learned from training data only.',
            '**Peeking at the test set repeatedly.** Each peek followed by a tweak turns the test set into a validation set, and the final score becomes optimistic.',
            '**Random splits on time series.** The model sees the future. Split by date.',
            '**Duplicates across the split.** The same customer or the same product photo on both sides makes the test easy. Remove duplicates or split by group.',
            '**A tiny test set.** 50 rows give a score that can swing by 10 points or more. Use cross-validation for decisions.',
          ] },
          { callout: 'A single split is still a single draw of luck. Cross-validation repeats the split several times and averages, which is the natural next step and the subject of a later chapter.', tone: 'tip' },
        ],
      },
    ],
    faq: [
      { q: 'Is 80/20 always the right ratio?', a: 'No, it is just a common default. With very large data you can test on 1–5%. With small data, use cross-validation for choosing models and keep a modest test set for the final check.' },
      { q: 'Why do I get a different score each time I run my code?', a: 'Because each run shuffles differently. Set `random_state` to a fixed number so the split is reproducible, and remember that the spread across shuffles is a reminder that the score itself is uncertain.' },
      { q: 'What is the difference between validation and test data?', a: 'Validation data helps you choose between models or settings while building. Test data is used once, after every choice is made, to estimate real-world performance.' },
      { q: 'After testing, should I retrain on all the data?', a: 'Often yes. Once the test score is recorded, many teams retrain the final model on training plus test data before deployment, because more data usually helps. The recorded test score remains the stated expectation.' },
      { q: 'Can I split after cleaning the data?', a: 'Simple cleaning that does not learn from the data (fixing typos, removing impossible values, parsing dates) is fine before splitting. Anything that computes a statistic, such as a mean for imputation, must be learned from the training part only.' },
      { q: 'My test score is higher than my training score. Is that a problem?', a: 'It can happen by luck, especially with small test sets or with regularised models. If the gap is large, check for leakage or for a test set that is accidentally easier than training.' },
    ],
  },

  'bias-variance': {
    minutes: 16,
    hook: 'Two analysts forecast quarterly sales for a car-parts supplier. The first draws a straight line through ten years of data and is always a bit wrong, in the same direction, every festive season. The second builds an elaborate model that matches every past wiggle perfectly, then misses the next quarter by a mile. Both have failed, in opposite ways. The **bias–variance trade-off** names these two failures and explains why the best model sits between them.',
    sections: [
      {
        heading: 'The problem: too simple or too clever',
        blocks: [
          { p: 'Every model has a level of **complexity**: how many patterns, bends and exceptions it is allowed to learn. A straight line is simple. A decision tree that asks thirty questions in a row is complex. Picking the right complexity is the single most common decision in machine learning, and it is where most models go wrong.' },
          { term: 'Model complexity', def: 'How flexible a model is: how many shapes it can bend into. More features, deeper trees, higher-degree curves and more neural network layers all mean more complexity.' },
          { p: 'A model that is too simple misses real patterns. It is wrong on the data it learned from and wrong on new data, in a consistent way. A model that is too complex learns the real patterns **and** the accidental noise in its particular training sample. It looks brilliant on the past and disappoints on the future.' },
          { term: 'Underfitting', def: 'The model is too simple to capture the real pattern. Errors are high on training data and on test data alike.' },
          { term: 'Overfitting', def: 'The model has memorised quirks of the training data that do not repeat. Training error is very low, but test error is much higher.' },
          { diagram: { kind: 'scatter', xLabel: 'years of service of a machine', yLabel: 'annual maintenance cost (₹ thousand)', line: { m: 5.47, b: -10.67 }, caption: 'Underfitting in a picture. Maintenance cost rises faster and faster with age (a curve), but a straight line is forced through it. Notice the pattern of misses: the line is too low at both ends and too high in the middle. Misses that follow a pattern are the signature of bias.', points: [[1, 1.2], [2, 2.1], [3, 4.8], [4, 8.3], [5, 12.1], [6, 18.4], [7, 24.2], [8, 32.5], [9, 40.1], [10, 50.6]] } },
        ],
      },
      {
        heading: 'Building the intuition: the tailor and the dartboard',
        blocks: [
          { p: 'Picture a tailor making clothes. One tailor sells a single **one-size-fits-all** shirt. It never fits anyone well: too loose on some, too tight on others, and always wrong in a predictable way. That is **bias**.' },
          { p: 'Another tailor measures you while you stand in one exact pose and makes a suit that fits that pose perfectly. The moment you sit down or raise an arm, it pulls and tears. Measure you on a different day and you get a noticeably different suit. That is **variance**: the result depends too much on the particular moment it was measured.' },
          { p: 'The good tailor makes a suit that fits your shape and still lets you move. It is not perfect in any one pose, but it is good in all of them.' },
          { steps: [
            '**Imagine training the same kind of model many times**, each time on a different random sample of past data.',
            '**Each trained model is one dart** thrown at the bullseye, which is the true answer for some new case.',
            '**Bias** is how far the centre of the cluster of darts is from the bullseye. A biased thrower is consistently off to one side.',
            '**Variance** is how scattered the darts are around their own centre. A high-variance thrower is all over the board, even if they are right on average.',
            '**The best thrower** keeps both small: darts grouped tightly and centred on the bullseye.',
          ], title: 'The dartboard picture' },
          { term: 'Bias', def: 'Error from wrong simplifying assumptions. If you retrained the model on many different samples, bias is how far its average prediction would still be from the truth.' },
          { term: 'Variance', def: 'Error from sensitivity to the particular training sample. It measures how much the model\'s predictions would change if you retrained it on different data.' },
          { think: { q: 'If you collect ten times more training data, which of the two errors do you expect to shrink?', a: 'Mainly variance. With more data, a flexible model has less room to chase accidental noise, so its predictions vary less from sample to sample. Bias does not shrink: a straight line stays a straight line however much data you give it.' } },
        ],
      },
      {
        heading: 'How to diagnose it, step by step',
        blocks: [
          { p: 'You cannot see bias and variance directly, but you can see their fingerprints by comparing two numbers: the error on training data and the error on validation or test data.' },
          { diagram: { kind: 'flow', nodes: ['**Train** the model and measure training error', '**Measure** validation error on unseen rows', '**Both high?** → high bias (underfitting)', '**Train low, validation much higher?** → high variance (overfitting)', '**Both low and close?** → good fit'], caption: 'The standard diagnosis. Two numbers, compared side by side, tell you which way to move.' } },
          { steps: [
            'Decide what "good" error looks like for the business: a human expert\'s error, or the error of the current process. This is your benchmark.',
            'Compute training error. If it is far above the benchmark, the model cannot even fit the past: **bias**.',
            'Compute validation error. If it is far above training error, the model does not transfer: **variance**.',
            'Fix the bigger problem first, then re-check both numbers.',
          ], title: 'Diagnosis in four steps' },
          { diagram: { kind: 'table', head: ['Training error', 'Validation error', 'Diagnosis', 'First things to try'], rows: [['High', 'High (similar)', 'High bias', 'More features, more flexible model, less regularisation'], ['Low', 'Much higher', 'High variance', 'More data, simpler model, more regularisation, ensembles'], ['High', 'Even higher', 'Both', 'Better features first, then control complexity'], ['Low', 'Low (similar)', 'Good fit', 'Confirm once on the test set']], caption: 'Read across a row: the gap between the two errors points to variance; the level of training error points to bias.' } },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { p: 'For squared error there is an exact and beautiful result. Take one new case whose true value is y. Imagine training your model again and again on fresh samples and recording its prediction each time. The average squared error of those predictions splits into three parts.' },
          { tex: '\\mathbb{E}\\big[(y - \\hat f(x))^2\\big] = \\underbrace{\\big(\\mathbb{E}[\\hat f(x)] - f(x)\\big)^2}_{\\text{Bias}^2} + \\underbrace{\\mathbb{E}\\big[(\\hat f(x) - \\mathbb{E}[\\hat f(x)])^2\\big]}_{\\text{Variance}} + \\sigma^2', plain: 'Expected squared error = (how far the average prediction is from the truth)² + (how much predictions scatter around their own average) + noise that no model can remove.', symbols: [['\\mathbb{E}[\\cdot]', 'the average over many imagined training samples'], ['f(x)', 'the true underlying value for input x'], ['\\hat f(x)', 'the model\'s prediction for x'], ['\\sigma^2', 'irreducible noise: randomness in y that no input explains']] },
          { p: 'Why is bias squared? Because errors in either direction are bad, and squaring treats an overestimate of 9 and an underestimate of 9 the same. Why does variance appear at all? Because you only ever get **one** training sample. If your model would give very different answers on a different sample, you are relying on luck.' },
          { p: 'The third term, noise, is a humbling reminder. Two customers with identical recorded details may still behave differently. No model can predict that part, so the error never reaches zero on real data.' },
          { term: 'Irreducible error', def: 'The part of the error caused by randomness or by information you did not record. No model, however clever, can remove it.' },
          { p: 'The **trade-off** is this: making a model more flexible usually lowers bias and raises variance. Total error therefore falls at first, reaches a minimum, and rises again. That minimum is the sweet spot you are looking for.' },
          { diagram: { kind: 'curve', fn: '3*Math.exp(-0.35*x)+0.1', fn2: '3*Math.exp(-0.35*x)+0.2+0.03*x*x', xMin: 0, xMax: 10, marks: [{ x: 4.1, label: 'sweet spot' }], legend: ['training error', 'validation error'], xLabel: 'model complexity', yLabel: 'error', caption: 'Training error keeps falling as complexity grows. Validation error falls, bottoms out (here near complexity 4) and then climbs as the model starts memorising noise. Choose complexity where validation error is lowest, never where training error is lowest.' } },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Bias and variance with real numbers', setup: 'The true maintenance cost of one machine is ₹50 thousand. Three types of model are each trained on five different random samples of history and asked to predict this machine. Their predictions (₹ thousand): Model A 40, 42, 41, 39, 43. Model B 35, 65, 50, 58, 42. Model C 47, 52, 49, 51, 46.', steps: [
            'Model A: average prediction = 205 / 5 = 41. Bias = 41 − 50 = −9, so bias² = 81. Deviations from 41 are −1, 1, 0, −2, 2; variance = (1 + 1 + 0 + 4 + 4) / 5 = 2. Total = 81 + 2 = 83.',
            'Check Model A directly: squared misses are 100, 64, 81, 121, 49, whose average is 415 / 5 = 83. The decomposition matches.',
            'Model B: average = 250 / 5 = 50, so bias² = 0. Deviations are −15, 15, 0, 8, −8; variance = (225 + 225 + 0 + 64 + 64) / 5 = 115.6. Total = 115.6.',
            'Model C: average = 245 / 5 = 49, bias² = 1. Deviations are −2, 3, 0, 2, −3; variance = (4 + 9 + 0 + 4 + 9) / 5 = 5.2. Total = 6.2.',
          ], result: 'A is consistently wrong (high bias), B is right on average but wildly unstable (high variance), C has a little of each and by far the lowest total error. Being unbiased is not enough; stability matters just as much.' } },
          { example: { title: 'Three decision trees on loan data (business case, illustrative)', setup: 'A lender trains decision trees of different depths to predict loan default and measures accuracy on training and validation data.', steps: [
            'Depth 1 (one question): train 70%, validation 69%. Both low and close: **high bias**.',
            'Depth 4: train 86%, validation 83%. Both good, small gap: **good balance**.',
            'Depth 15: train 100%, validation 72%. A 28-point gap: **high variance**. The tree has carved out a rule for almost every individual borrower.',
            'Choose depth 4, the depth with the best validation accuracy.',
          ], result: 'The deepest tree had the best training score and the second-worst validation score. Training accuracy is not a reason to celebrate.' } },
          { example: { title: 'Reading a straight line that underfits', setup: 'Using the machine-age data in the first diagram, a straight line fitted by least squares is cost ≈ 5.47 × age − 10.67.', steps: [
            'At age 1: actual 1.2, line gives 5.47 − 10.67 = −5.2, a miss of +6.4. The line even predicts a negative cost.',
            'At age 5: actual 12.1, line gives 27.35 − 10.67 = 16.68, a miss of −4.6.',
            'At age 10: actual 50.6, line gives 54.7 − 10.67 = 44.03, a miss of about +6.6.',
            'The misses go plus, minus, plus in a smooth wave: the model is systematically wrong in a predictable shape.',
          ], result: 'Patterned misses mean bias. Adding a squared-age feature (a curve) removes most of the pattern. More rows of the same data would not.' } },
        ],
      },
      {
        heading: 'Remedies: moving along the trade-off',
        blocks: [
          { p: 'Once you know which problem you have, the remedies are well known. The important thing is not to apply the wrong one: adding complexity to an overfitting model makes it worse.' },
          { diagram: { kind: 'compare', left: { title: 'To reduce bias (underfitting)', items: ['Add informative features (ratios, seasonality, history)', 'Use a more flexible model (tree ensemble instead of a line)', 'Allow more depth or more polynomial terms', 'Reduce regularisation strength', 'Train longer (neural networks)'] }, right: { title: 'To reduce variance (overfitting)', items: ['Collect more training data', 'Use a simpler model or limit depth', 'Increase regularisation (Ridge, Lasso, dropout)', 'Average many models (bagging, random forests)', 'Remove noisy or irrelevant features'] }, caption: 'Diagnose first, then pick from the matching column. The columns pull in opposite directions.' } },
          { term: 'Regularisation', def: 'A penalty added during training that discourages extreme or overly complicated fits, for example by keeping coefficients small. It deliberately adds a little bias to remove a lot of variance.' },
          { p: 'A useful check is the **learning curve**: plot training and validation error against the number of training rows. If the two curves have already met at a high error, more data will not help and you need a richer model. If there is still a wide gap that narrows as rows are added, more data is likely to pay off.' },
          { callout: 'Ensembles such as random forests are popular because they attack variance directly: averaging many high-variance trees cancels out much of their individual wobble while keeping their low bias.', tone: 'tip' },
        ],
      },
      {
        heading: 'In the real world',
        blocks: [
          { case: { title: 'Forecasting spare-parts demand at an automotive supplier (illustrative)', story: 'A supplier forecasts weekly demand for 4,000 spare parts. The first model, a single average per part, has similar error on past and recent weeks but misses every seasonal peak: classic bias. The team switches to gradient boosting with 200 features and gets a near-perfect fit on history, but recent-week error rises: variance. The final model keeps 35 well-understood features (season, model-year mix of vehicles on the road, recent demand), limits tree depth, and uses early stopping. Its training and validation errors are close and both lower than the simple average. The lesson the team writes in its playbook: compare the two errors every time, and fix the larger gap first.' } },
          { bullets: [
            '**Credit scoring:** regulators prefer simpler, stable models, accepting a little bias for low variance and explainability.',
            '**Image recognition:** very large networks would overfit badly but are kept in check with huge datasets, data augmentation and regularisation.',
            '**Marketing response models:** small campaign datasets push teams towards simpler models because variance is the bigger danger.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Judging by training error.** It always improves with complexity, so it can never tell you when to stop.',
            '**Using the test set to choose complexity.** That leaks the test set into your decisions. Use a validation set or cross-validation.',
            '**Believing more data fixes everything.** It mainly reduces variance. A biased model stays biased.',
            '**Ignoring noise.** If the best possible error is high because outcomes are random, no amount of tuning will reach the target. Set expectations against a sensible benchmark.',
            '**Treating the trade-off as a law for every model.** Very large neural networks sometimes show validation error falling again beyond the classic U-shape (often called "double descent"). The diagnosis by training versus validation error still applies.',
          ] },
          { callout: 'The bias–variance trade-off is a way of thinking, not a single number you compute in practice. Use it to decide which direction to move, and let validation error confirm the move helped.', tone: 'key' },
        ],
      },
    ],
    faq: [
      { q: 'Is overfitting or underfitting more common?', a: 'With modern flexible models (trees, boosting, neural networks) and modest data, overfitting is the more common problem. With very simple models on rich data, underfitting is common.' },
      { q: 'How big a gap between training and validation error is too big?', a: 'There is no universal cut-off. A gap of a point or two is normal. A gap that is large compared with the improvement you are trying to achieve, say 10 points of accuracy, is a strong sign of variance.' },
      { q: 'Can a model have high bias and high variance at the same time?', a: 'Yes. A model with poor features can be both systematically wrong and unstable. Improve the features first, then control complexity.' },
      { q: 'Does regularisation always help?', a: 'No. It reduces variance by adding bias. If the model is already underfitting, more regularisation makes it worse. Tune its strength with cross-validation.' },
      { q: 'Where does noise come from?', a: 'From things you did not or could not measure: a customer\'s mood, a sudden policy change, measurement error. Better data collection can reduce it; better modelling cannot.' },
      { q: 'Why is it called a trade-off?', a: 'Because for a fixed amount of data, the usual ways of reducing bias (more flexibility) increase variance and vice versa. You balance the two to make the total smallest.' },
    ],
  },

  'cross-validation': {
    minutes: 15,
    hook: 'A retail analytics team compares two churn models on one test set. Model A wins by three points, so it goes to production. A month later a colleague reruns the comparison with a different random split, and Model B wins by two points. Which result was real? Neither, on its own. A single split is one roll of the dice. **Cross-validation** rolls the dice several times, in an organised way, so luck averages out.',
    sections: [
      {
        heading: 'The problem: one split is one roll of the dice',
        blocks: [
          { p: 'In the train / test split chapter we held out some data to get an honest score. That idea is right, but it has two weaknesses. First, the score depends on **which** rows happened to land in the test set. An easy set flatters the model; a hard set punishes it. Second, the held-out rows are never used for learning, which hurts when data is scarce.' },
          { p: 'These weaknesses matter most when you are **choosing**: between two algorithms, between ten settings of one algorithm, or between feature sets. If the choice depends on the luck of one split, you may pick the wrong model and never know.' },
          { term: 'Cross-validation (CV)', def: 'A way of estimating how well a model will do on unseen data by splitting the training data several times, training and scoring once per split, and averaging the scores.' },
          { term: 'Fold', def: 'One of the equal-sized chunks the data is cut into for cross-validation. Each fold takes one turn as the validation data.' },
          { diagram: { kind: 'bars', labels: ['Split 1', 'Split 2', 'Split 3', 'Split 4', 'Split 5'], values: [0.82, 0.85, 0.84, 0.86, 0.83], highlight: 3, yLabel: 'accuracy', caption: 'The same model scored on five different validation folds. Reporting only Split 4 would claim 0.86; reporting only Split 1 would claim 0.82. Cross-validation reports the average, 0.84, and the spread.' } },
        ],
      },
      {
        heading: 'Building the intuition: rotating the exam paper',
        blocks: [
          { p: 'Imagine a training institute that wants to know how good its course really is. It has five sets of exam questions. If it always uses set 3 as the final exam, a cohort could do unusually well just because set 3 is easy.' },
          { p: 'So the institute rotates. Cohort 1 practises on sets 2–5 and is examined on set 1. Cohort 2 practises on sets 1, 3, 4, 5 and is examined on set 2. And so on, until every set has been the exam exactly once. The institute then averages the five exam results. No single easy or hard paper can distort the picture, and every set of questions was used both for practice and for examination.' },
          { steps: [
            '**Cut the questions into five equal sets.**',
            '**Pick one set as the exam;** practise on the other four.',
            '**Record the exam score.**',
            '**Rotate** so a different set is the exam, and repeat until each set has had its turn.',
            '**Average the five scores** and note how much they vary.',
          ], title: 'The rotation, in plain words' },
          { think: { q: 'In 5-fold cross-validation, how many times is each row used for validation, and how many times for training?', a: 'Each row is in exactly one fold, so it is used for validation exactly once and for training in the other four rounds. Every row contributes to both learning and judging, just never at the same time.' } },
        ],
      },
      {
        heading: 'How k-fold cross-validation works',
        blocks: [
          { term: 'k-fold cross-validation', def: 'Cut the data into k folds. Train k models; each one learns from k − 1 folds and is scored on the remaining fold. The k scores are averaged. k = 5 or k = 10 are the usual choices.' },
          { diagram: { kind: 'table', head: ['Round', 'Fold 1', 'Fold 2', 'Fold 3', 'Fold 4', 'Fold 5'], rows: [['1', 'Validate', 'Train', 'Train', 'Train', 'Train'], ['2', 'Train', 'Validate', 'Train', 'Train', 'Train'], ['3', 'Train', 'Train', 'Validate', 'Train', 'Train'], ['4', 'Train', 'Train', 'Train', 'Validate', 'Train'], ['5', 'Train', 'Train', 'Train', 'Train', 'Validate']], caption: '5-fold cross-validation. The validation fold moves along the diagonal, so every fold is validated exactly once and five separate models are trained.' } },
          { steps: [
            '**Set the test set aside first.** Cross-validation runs on the training data only; the test set still waits for the final check.',
            '**Shuffle and cut** the training rows into k folds of (almost) equal size. For classification, use stratified folds so each fold has the same class mix.',
            '**Loop over the folds.** In round i, fit a fresh model on all folds except fold i, then score it on fold i.',
            '**Summarise** the k scores by their mean and standard deviation.',
            '**Use the mean to compare** models or settings. Pick the winner, retrain it on all the training data, and score it once on the test set.',
          ], title: 'The procedure' },
          { p: 'In scikit-learn the whole loop is one line: `cross_val_score(model, X, y, cv=5)`. It returns the five scores; you take `.mean()` and `.std()`.' },
          { callout: 'Cross-validation **estimates** performance; it does not produce a final model. The k fold-models are thrown away. After choosing, you fit one model on all the training data.', tone: 'key' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { p: 'The arithmetic is simple averaging, but each piece has a reason. First, the CV estimate itself.' },
          { tex: '\\text{CV}_{(k)} = \\frac{1}{k}\\sum_{i=1}^{k} \\text{Score}_i', plain: 'Add up the score from each of the k rounds and divide by k. This average is your best estimate of performance on new data.', symbols: [['k', 'number of folds'], ['\\text{Score}_i', 'the score of the model trained without fold i, measured on fold i']] },
          { p: 'Why average? Because each fold\'s score contains some luck. Averaging k scores cancels much of that luck, just as the average of five dice rolls is more stable than one roll.' },
          { p: 'Second, the spread. The standard deviation of the fold scores tells you how stable the model is across different slices of data.' },
          { tex: '\\text{SD} = \\sqrt{\\frac{1}{k}\\sum_{i=1}^{k} (\\text{Score}_i - \\text{CV}_{(k)})^2}', plain: 'For each fold, take how far its score is from the average, square it, average those squares, and take the square root. A small SD means the model behaves similarly on every slice of data.', symbols: [['\\text{SD}', 'standard deviation of the fold scores (numpy\'s default divides by k)']] },
          { p: 'Why square the differences? So that folds above and below the average do not cancel each other out, and so that one very different fold stands out. A large SD is a warning: performance depends heavily on which customers or months you happen to look at.' },
          { term: 'Stratified k-fold', def: 'k-fold where each fold keeps the same proportion of each class as the full data. scikit-learn uses it automatically when you pass `cv=5` with a classifier.' },
          { p: 'How to choose k? Larger k means each model trains on more data (with k = 10, on 90% of it), so the estimate is closer to what the final model will achieve, but it costs more training runs. k = 5 is a good default; k = 10 is common when data is small and training is cheap.' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Summarising five fold scores', setup: 'A 5-fold CV of a classifier gives accuracies 0.82, 0.85, 0.84, 0.86, 0.83.', steps: [
            'Mean = (0.82 + 0.85 + 0.84 + 0.86 + 0.83) / 5 = 4.20 / 5 = 0.84.',
            'Differences from the mean: −0.02, +0.01, 0.00, +0.02, −0.01.',
            'Squares: 0.0004, 0.0001, 0, 0.0004, 0.0001. Their sum is 0.0010; divided by 5 that is 0.0002.',
            'SD = √0.0002 ≈ 0.014. (Dividing by k − 1 = 4 instead gives about 0.016; tools differ, so say which you used.)',
          ], result: 'Report "accuracy 0.84 ± 0.014 (5-fold CV)". The spread is small compared with the mean, so the estimate is stable.' } },
          { example: { title: 'How one split can crown the wrong model', setup: 'Two churn models are compared with 5-fold CV on the same folds. Model A scores 0.80, 0.91, 0.78, 0.83, 0.79. Model B scores 0.84, 0.85, 0.83, 0.86, 0.84.', steps: [
            'If you had used only fold 2 as a single test set, A would score 0.91 and B 0.85. A looks six points better.',
            'Mean of A = 4.11 / 5 = 0.822. Mean of B = 4.22 / 5 = 0.844.',
            'SD of A ≈ 0.047. SD of B ≈ 0.010.',
            'B is better on average and far more stable. A\'s single good fold was luck.',
          ], result: 'Choose Model B. Cross-validation reversed a decision that one lucky split would have made.' } },
          { diagram: { kind: 'bars', labels: ['A f1', 'A f2', 'A f3', 'A f4', 'A f5', 'B f1', 'B f2', 'B f3', 'B f4', 'B f5'], values: [0.80, 0.91, 0.78, 0.83, 0.79, 0.84, 0.85, 0.83, 0.86, 0.84], highlight: 1, yLabel: 'accuracy', caption: 'Fold-by-fold scores of the two models. Model A has one spectacular fold (highlighted) and four mediocre ones. Model B is consistently good. Means: A 0.822, B 0.844.' } },
          { example: { title: 'Time-series CV for monthly demand (business case)', setup: 'A cement company has 36 months of regional demand and wants to compare forecasting models. Ordinary k-fold would let models train on future months, so it uses scikit-learn\'s `TimeSeriesSplit(n_splits=3)`.', steps: [
            'Split 1: train on months 1–9, validate on months 10–18.',
            'Split 2: train on months 1–18, validate on months 19–27.',
            'Split 3: train on months 1–27, validate on months 28–36.',
            'The training window grows each time and validation always lies in the future, so no model ever sees the months it is forecasting.',
            'Average the three validation errors to compare models.',
          ], result: 'This is called an expanding-window or rolling-origin backtest. It gives a fair comparison and also shows whether accuracy improves as more history becomes available.' } },
        ],
      },
      {
        heading: 'Choosing the right CV scheme',
        blocks: [
          { p: 'Plain k-fold assumes rows are independent and interchangeable. Real business data often is not. Matching the scheme to the structure of the data matters more than the choice of k.' },
          { bullets: [
            '**StratifiedKFold**: classification, especially with rare classes. With 1,000 rows and 100 positives, 5 stratified folds each hold 200 rows with exactly 20 positives.',
            '**GroupKFold**: several rows per customer, store, patient or vehicle. All rows of one group stay in the same fold, so the model is always validated on new groups.',
            '**TimeSeriesSplit**: dated data. Train on the past, validate on the future, never shuffle.',
            '**Repeated k-fold**: run k-fold several times with different shuffles (for example 10 folds × 3 repeats = 30 fits) to further reduce luck when data is small.',
            '**Leave-one-out**: k equals the number of rows. Very expensive and rarely needed outside tiny datasets.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'Ordinary k-fold is fine when…', items: ['Each row is a separate, independent case', 'There is no time order to respect', 'Classes are reasonably balanced (or you stratify)', 'No customer or machine appears in many rows'] }, right: { title: 'Use a special scheme when…', items: ['Rows have dates → **TimeSeriesSplit**', 'Rows share a customer, store or patient → **GroupKFold**', 'One class is rare → **StratifiedKFold**', 'Data is tiny → **RepeatedStratifiedKFold**'] }, caption: 'The scheme should copy how the model will meet new data: new customers, future months, rare events.' } },
        ],
      },
      {
        heading: 'In the real world',
        blocks: [
          { case: { title: 'A churn model that met the same customers twice (illustrative)', story: 'A broadband provider builds a monthly churn model with one row per customer per month, 12 rows per customer. Ordinary 5-fold CV gives an AUC of 0.93, far better than anything the team had seen. A reviewer notices that each customer\'s rows are spread across all folds, so the model is validated on customers it has already met in training, with nearly identical features. Switching to GroupKFold by customer ID brings the AUC down to 0.81. In the following quarter the live model\'s AUC lands close to 0.81. The 0.93 had been leakage, and cross-validation with the right scheme caught it before it reached the board pack.' } },
          { bullets: [
            '**Model selection:** almost every hyperparameter search (GridSearchCV, RandomizedSearchCV, Optuna) uses cross-validation inside.',
            '**Small datasets:** clinical studies and B2B sales models with a few hundred rows rely on repeated CV for every decision.',
            '**Forecasting:** retailers and utilities run rolling-origin backtests before trusting a new forecasting method.',
            '**Stacking:** ensembles use out-of-fold predictions from CV to train the combining model without leakage.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Preprocessing outside the folds.** Scaling or selecting features on all the data before CV leaks validation information into every fold. Put preprocessing inside a Pipeline so it is refitted in each round.',
            '**Wrong scheme for the data.** Shuffled k-fold on time series or grouped rows gives scores that are too good.',
            '**Reporting the mean without the spread.** 0.84 ± 0.01 and 0.84 ± 0.10 are very different stories.',
            '**Treating the best CV score as the final score.** If you tried many settings and picked the best, its CV score is slightly optimistic. Confirm once on the test set, or use nested CV.',
            '**Cost.** k folds means k trainings. For a model that takes an hour to train, 3-fold or a single validation split may be the practical choice.',
          ] },
          { term: 'Nested cross-validation', def: 'An outer CV loop to estimate performance and an inner CV loop, inside each outer training part, to tune settings. It gives an unbiased score for the whole "tune then train" process.' },
          { callout: 'Cross-validation replaces a single validation set, not the test set. Keep a final hold-out when you can afford it; it is the last line of defence against mistakes in the CV set-up itself.', tone: 'warn' },
        ],
      },
    ],
    faq: [
      { q: 'How many models does 5-fold CV train?', a: 'Five, one per fold. If you also tune 20 settings, that is 20 × 5 = 100 fits, plus one final fit on all the training data.' },
      { q: 'Should I use 5 or 10 folds?', a: 'Five is a sensible default. Ten gives each model more training data and a slightly more reliable estimate when data is small, at twice the cost.' },
      { q: 'Do I still need a test set if I use cross-validation?', a: 'Ideally yes. CV guides your choices; the test set checks the final choice once. With very small data, nested CV can stand in for a separate test set.' },
      { q: 'Which model do I deploy: one of the five fold models?', a: 'None of them. After choosing settings with CV, retrain one model on all the training data and deploy that.' },
      { q: 'Why does `cross_val_score` give a negative number for MSE?', a: 'scikit-learn always treats higher scores as better, so error metrics are returned negated, for example `neg_mean_squared_error`. Multiply by −1 to read them.' },
      { q: 'Is cross-validation slow?', a: 'It multiplies training time by k. For most tabular models that is seconds or minutes. Use `n_jobs=-1` to run folds in parallel.' },
    ],
  },

  'regression-metrics': {
    minutes: 16,
    hook: 'A sales director asks a simple question: "How good is the new demand forecast?" The data scientist replies, "R² of 0.67 and RMSE of 13.8." The director nods politely and understands nothing. A better answer would be: "On average we are off by about 12 units a month, roughly 11%, and the big misses happen in launch months." **Regression metrics** are the different ways of measuring how wrong a numeric prediction is, and choosing and explaining the right one is half of a forecasting project.',
    sections: [
      {
        heading: 'The problem: how wrong is the number?',
        blocks: [
          { p: 'Many business predictions are numbers: next month\'s sales, the price of a flat, the hours a machine will run before it needs service, the rupee value of an insurance claim. A model that predicts a number is a **regression** model, and it is never exactly right. The question is how wrong it is, and in what way.' },
          { term: 'Regression', def: 'Predicting a number on a continuous scale (price, demand, temperature), as opposed to classification, which predicts a category (yes/no, spam/not spam).' },
          { term: 'Error (residual)', def: 'The difference between the actual value and the prediction: actual − predicted. Positive means the model predicted too low; negative means too high.' },
          { p: 'Summarising thousands of errors into one number forces a choice. Do you care about the typical miss or the worst misses? About rupees or percentages? About beating a simple baseline? Each metric answers a slightly different question, and the wrong metric can make a poor model look good.' },
          { diagram: { kind: 'scatter', xLabel: 'actual demand (units)', yLabel: 'forecast demand (units)', line: { m: 1, b: 0 }, caption: 'Five months of forecasts against reality. The diagonal line is "perfect forecast". Each point\'s vertical distance from the line is that month\'s error. The point far above the line (actual 105, forecast 130) is the big miss that some metrics punish much more than others.', points: [[120, 110, 0], [95, 100, 0], [150, 140, 0], [80, 90, 0], [105, 130, 1]] } },
        ],
      },
      {
        heading: 'Building the intuition: judging a weather forecaster',
        blocks: [
          { p: 'Suppose you want to judge a weather forecaster who predicts tomorrow\'s temperature every day for a month. How would you score them?' },
          { steps: [
            '**Look at each day\'s miss.** Forecast 32°C, actual 30°C: 2 degrees off. Ignore the direction for now; 2 too hot is as bad as 2 too cold.',
            '**Average the misses.** "On a typical day she is 1.8 degrees off." That is easy to understand and is the idea behind MAE.',
            '**Decide whether big misses deserve extra blame.** Missing by 10 degrees on the day of a heatwave may cause far more harm than ten 1-degree misses. If so, you should punish large misses more heavily. That is the idea behind RMSE.',
            '**Compare with a lazy forecaster.** Someone who always predicts the monthly average temperature needs no skill. How much better is our forecaster than that? That is the idea behind R².',
            '**Think in percentages if scales differ.** Being 2 degrees off in Shimla in January is a bigger relative miss than in Chennai in May. Percentage errors (MAPE) handle that.',
          ], title: 'Four ways to grade a forecaster' },
          { think: { q: 'Forecaster X is off by 2 degrees every single day. Forecaster Y is perfect on 29 days and off by 60 degrees on one day. Their average miss is the same. Which would you rather employ?', a: 'Most people prefer X: a 60-degree miss is a disaster, and occasional huge misses destroy trust. Average miss (MAE) rates them equally; a squared-error metric (RMSE) would rate X far better. The choice of metric is a choice about which errors hurt.' } },
        ],
      },
      {
        heading: 'How to evaluate a regression model, step by step',
        blocks: [
          { diagram: { kind: 'flow', nodes: ['**Predict** on held-out test data', '**Compute errors**: actual − predicted for every row', '**Summarise** with MAE, RMSE, R² (and MAPE if useful)', '**Compare** with a simple baseline', '**Explain** in business units and inspect the biggest misses'], caption: 'Metrics are always computed on data the model did not learn from, and always compared with a baseline.' } },
          { steps: [
            'Compute predictions on the test set (or out-of-fold predictions from cross-validation).',
            'Compute the error for each row. Plot them: a histogram of errors and a chart of actual versus predicted reveal patterns that no single number shows.',
            'Compute two or three metrics. MAE for communication, RMSE if big misses are costly, R² for comparison with the mean baseline.',
            'Compute the same metrics for a naive baseline: "always predict the average" or, for time series, "predict the same as last month". A model that cannot beat the naive baseline is not ready.',
            'Translate the headline metric into the business\'s language: units, rupees, percentage, hours.',
          ], title: 'The routine' },
          { callout: 'A metric means little on its own. "RMSE = 13.8" is meaningless until you know that demand is around 110 units a month and the naive forecast scores 24.', tone: 'key' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { p: 'Write yᵢ for the actual value of row i, ŷᵢ ("y-hat") for the prediction, and n for the number of rows. Every metric below is built from the errors yᵢ − ŷᵢ.' },
          { term: 'MAE (mean absolute error)', def: 'The average size of the misses, ignoring direction. In the same units as the target: rupees, units, hours.' },
          { tex: '\\text{MAE} = \\frac{1}{n}\\sum_{i=1}^{n} |y_i - \\hat y_i|', plain: 'Take each miss, drop its sign, add them up and divide by the number of rows.', symbols: [['y_i', 'actual value of row i'], ['\\hat y_i', 'predicted value of row i'], ['|\\cdot|', 'absolute value: drop the minus sign']] },
          { p: 'Why drop the sign? Because otherwise a +10 miss and a −10 miss would cancel and the model would look perfect. The average of the signed errors is still useful, but for something else: it shows **bias**, a tendency to predict too high or too low.' },
          { term: 'RMSE (root mean squared error)', def: 'Square each miss, average the squares, take the square root. Also in the target\'s units, but large misses count much more than small ones.' },
          { tex: '\\text{RMSE} = \\sqrt{\\frac{1}{n}\\sum_{i=1}^{n} (y_i - \\hat y_i)^2}', plain: 'Squaring makes every miss positive and makes big misses huge (a miss of 20 counts 400, a miss of 2 counts 4). The square root at the end brings the result back to the original units.' },
          { p: 'The quantity inside the square root is the **MSE** (mean squared error). It is what most regression models minimise during training, because it has smooth mathematical properties. RMSE is always at least as large as MAE; the bigger the gap, the more your errors are dominated by a few large misses.' },
          { tex: 'R^2 = 1 - \\frac{\\sum_i (y_i - \\hat y_i)^2}{\\sum_i (y_i - \\bar y)^2}', plain: 'Compare the model\'s squared errors with the squared errors of a lazy model that always predicts the average ȳ. R² is the share of that lazy error the model removes.', symbols: [['\\bar y', 'the mean of the actual values'], ['R^2', '1 = perfect, 0 = no better than the mean, below 0 = worse than the mean']] },
          { p: 'R² is unit-free, which makes it handy for comparing models on the same data. But it says nothing about the size of errors in business terms, and it can be negative on test data if a model is worse than simply predicting the average.' },
          { tex: '\\text{MAPE} = \\frac{100\\%}{n}\\sum_{i=1}^{n} \\left|\\frac{y_i - \\hat y_i}{y_i}\\right|', plain: 'Each miss is divided by the actual value to make it a percentage, and the percentages are averaged. "We are 11% off on average."' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Three predictions by hand', setup: 'Actual values 10, 20, 30. Predictions 12, 18, 36.', steps: [
            'Errors (actual − predicted): −2, +2, −6. Absolute errors: 2, 2, 6.',
            'MAE = (2 + 2 + 6) / 3 = 10 / 3 ≈ 3.33.',
            'Squared errors: 4, 4, 36. MSE = 44 / 3 ≈ 14.67. RMSE = √14.67 ≈ 3.83.',
            'Mean of actuals = 20. Lazy squared errors: (10 − 20)² + 0 + (30 − 20)² = 200.',
            'R² = 1 − 44 / 200 = 1 − 0.22 = 0.78.',
          ], result: 'MAE 3.33, RMSE 3.83, R² 0.78. RMSE is higher than MAE because the single miss of 6 is punished more heavily than the two misses of 2.' } },
          { example: { title: 'Spare-parts demand at a car dealership (business case)', setup: 'Monthly demand for a brake-pad kit over five months: actual 120, 95, 150, 80, 105 units. Forecast 110, 100, 140, 90, 130.', steps: [
            'Errors: +10, −5, +10, −10, −25. Absolute: 10, 5, 10, 10, 25. MAE = 60 / 5 = 12 units.',
            'Squared: 100, 25, 100, 100, 625. MSE = 950 / 5 = 190. RMSE = √190 ≈ 13.78 units.',
            'Mean actual = 550 / 5 = 110. Lazy squared errors: 100 + 225 + 1,600 + 900 + 25 = 2,850. R² = 1 − 950 / 2,850 ≈ 0.67.',
            'Percentage misses: 8.33%, 5.26%, 6.67%, 12.5%, 23.81%. MAPE ≈ 11.3%.',
            'The last month (miss of 25) supplies 625 of the 950 squared error: about two-thirds of the MSE from one month.',
          ], result: 'For the parts manager: "We are off by about 12 kits a month, roughly 11%, and the fifth month\'s over-forecast is the main problem." Investigating that month (a cancelled fleet order, perhaps) is worth more than any further tuning.' } },
          { diagram: { kind: 'bars', labels: ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5'], values: [10, 5, 10, 10, 25], highlight: 4, yLabel: 'absolute error (units)', caption: 'Absolute errors for the dealership forecast. MAE treats month 5 as one miss among five; RMSE squares it to 625 and lets it dominate. When one bar towers over the rest, RMSE and MAE drift apart.' } },
          { example: { title: 'Same MAE, very different RMSE', setup: 'Two models predict four claims. Model P misses by 5, 5, 5, 5. Model Q misses by 0, 0, 0, 20.', steps: [
            'MAE of P = 20 / 4 = 5. MAE of Q = 20 / 4 = 5. Identical.',
            'RMSE of P = √((25 + 25 + 25 + 25) / 4) = √25 = 5.',
            'RMSE of Q = √((0 + 0 + 0 + 400) / 4) = √100 = 10.',
          ], result: 'MAE cannot tell these models apart; RMSE says Q is twice as bad. Use RMSE when one large miss (an under-reserved insurance claim, a stock-out of a critical part) costs far more than several small ones.' } },
        ],
      },
      {
        heading: 'Choosing the right metric',
        blocks: [
          { p: 'The best metric mirrors how errors cost money. Ask the business owner: "Is a miss of 20 twice as bad as a miss of 10, or much worse? Do we think in units or in percentages? Can actual values be zero?"' },
          { diagram: { kind: 'table', head: ['Metric', 'Units', 'Big misses', 'Best used when'], rows: [['MAE', 'Same as target', 'Counted normally', 'Explaining to stakeholders; costs grow linearly'], ['RMSE', 'Same as target', 'Punished heavily', 'Large errors are especially costly'], ['R²', 'None (0 to 1)', 'Punished heavily', 'Comparing models on the same data'], ['MAPE', 'Percent', 'Relative to actual', 'Comparing items of different sizes, no zeros'], ['WAPE', 'Percent', 'Relative to total', 'Demand forecasting with small or zero values']], caption: 'A quick guide. Most reports show MAE or RMSE in business units plus one relative measure.' } },
          { term: 'WAPE (weighted absolute percentage error)', def: 'Total absolute error divided by total actual value. In the dealership example, 60 / 550 ≈ 10.9%. It avoids MAPE\'s explosion when individual actual values are tiny.' },
          { bullets: [
            '**Asymmetric costs:** if under-forecasting (stock-outs) costs more than over-forecasting (extra stock), consider a quantile or pinball loss, which penalises one direction more.',
            '**Many series of different sizes:** MAPE or WAPE make a 10-unit miss on a slow item and a 1,000-unit miss on a fast item comparable.',
            '**Model training versus reporting:** you can train with MSE and still report MAE; they need not be the same.',
          ] },
        ],
      },
      {
        heading: 'In the real world',
        blocks: [
          { case: { title: 'Choosing a forecast metric for a quick-commerce grocer (illustrative)', story: 'A quick-commerce company forecasts hourly demand for 6,000 products in each dark store. MAPE looked natural until analysts found that many products sell 0 or 1 unit in an hour: a forecast of 2 against an actual of 1 is a 100% error, and actual zeros make MAPE undefined. The team switched to WAPE for the headline number, which weights each product by its volume, and added an RMSE check on the top 200 products, where a stock-out of milk or bread costs most. Reports to store managers say "we are about 18% off in total units", a figure they can relate to their own experience.' } },
          { bullets: [
            '**Real estate:** price models are often reported with MAE in lakh and a median percentage error, because a few luxury properties distort RMSE.',
            '**Energy utilities:** load forecasts use RMSE and MAPE; peak-hour misses are what cause expensive spot purchases.',
            '**Insurance:** claim-severity models are checked with RMSE and with error by claim-size band, because a few large claims dominate cost.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Reporting only R².** A high R² can coexist with errors far too large for the business, and a low R² can be fine when the target is noisy by nature.',
            '**MAPE with zeros or tiny actuals.** Actual 2, forecast 6 is a 200% error. Use WAPE or MAE instead.',
            '**Comparing RMSE across datasets.** RMSE is in the target\'s units; an RMSE of 10 on demand of 100 and on demand of 10,000 are worlds apart.',
            '**Scoring on training data.** All metrics look better on data the model learned from. Use test data or cross-validation.',
            '**Ignoring the direction of errors.** A model can have a decent MAE yet consistently over-forecast. Check the mean signed error too.',
            '**Negative R² surprises.** On test data R² can be negative. Predicting 30, 20, 10 for actuals 10, 20, 30 gives R² = −3: much worse than predicting the average.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'MAE', items: ['Average miss, easy to explain', 'Robust to a few outliers', 'Treats all misses in proportion', 'Minimised by predicting the median'] }, right: { title: 'RMSE', items: ['Square root of the average squared miss', 'Sensitive to large misses', 'Penalises one big miss more than many small ones', 'Minimised by predicting the mean'] }, caption: 'The two most common error metrics. Report both: when RMSE is much larger than MAE, a few large misses deserve investigation.' } },
        ],
      },
    ],
    faq: [
      { q: 'Which metric should I report to management?', a: 'Usually MAE in business units (rupees, units, hours) plus a percentage such as WAPE. Keep R² and RMSE for technical comparisons unless large misses are the main concern.' },
      { q: 'What is a good R²?', a: 'It depends entirely on the problem. Physical processes can reach 0.95; customer behaviour models may be useful at 0.3. Compare with a baseline and with the business need, not with a universal threshold.' },
      { q: 'Why is RMSE always at least as large as MAE?', a: 'Squaring gives extra weight to large errors, and the square root of an average of squares is never smaller than the plain average. They are equal only when every miss is the same size.' },
      { q: 'Can MAPE be more than 100%?', a: 'Yes. If the actual is 10 and the forecast is 35, that miss alone is 250%. Over-forecasting is unbounded, which is one reason MAPE is criticised.' },
      { q: 'Why does scikit-learn show "neg_mean_absolute_error"?', a: 'Its tuning tools always maximise a score, so error metrics are negated. A value of −12 means an MAE of 12.' },
      { q: 'Should I use the same metric for training and evaluation?', a: 'Not necessarily. Many models train on squared error for mathematical convenience. Evaluate with the metric that reflects business cost, and if they differ greatly, look for a model or loss that matches the business metric.' },
    ],
  },

  'classification-metrics': {
    minutes: 17,
    hook: 'A fintech start-up announces that its fraud detector is 98% accurate. An investor asks one question: "What fraction of transactions are fraud?" The answer is 2%. A model that simply says "not fraud" to every transaction would also be 98% accurate, and would catch nothing. **Classification metrics** are the tools that see through this kind of illusion and tell you what a yes/no model really does for the business.',
    sections: [
      {
        heading: 'The problem: accuracy can lie',
        blocks: [
          { p: 'Many business models answer yes/no questions: will this customer churn, is this transaction fraud, is this part defective, will this lead convert? These are **classification** models. The obvious score is accuracy, the share of predictions that are right. But accuracy treats every mistake as equal and is easily fooled when one answer is rare.' },
          { term: 'Classification', def: 'Predicting which category something belongs to. Binary classification has two categories, conventionally called positive (the thing we are looking for: fraud, churn, defect) and negative.' },
          { term: 'Accuracy', def: 'The share of all predictions that are correct. Simple, but misleading when one class is much more common than the other.' },
          { p: 'Mistakes come in two kinds, and they cost very different amounts. Blocking a genuine customer\'s card is annoying and may lose a customer. Letting a fraudulent transaction through loses money directly. Missing a cracked brake disc on a production line may cause a recall. We need metrics that count each kind of mistake separately.' },
          { diagram: { kind: 'bars', labels: ['Accuracy', 'Precision', 'Recall', 'F1'], values: [98, 50, 75, 60], highlight: 0, yLabel: 'percent', caption: 'One fraud model, four metrics (worked out later in this chapter). Accuracy says 98%; the metrics that focus on the rare fraud class say 50–75%. The highlighted bar is the one that misleads.' } },
        ],
      },
      {
        heading: 'Building the intuition: the smoke alarm',
        blocks: [
          { p: 'Think of the smoke alarm in your kitchen. It can be right in two ways and wrong in two ways.' },
          { steps: [
            '**There is a fire and it rings.** Good: a correct alarm.',
            '**There is no fire and it stays quiet.** Good: a correct silence. This happens almost every minute of every day.',
            '**There is no fire but it rings** (you made toast). A false alarm. Irritating; if it happens often, people take the battery out.',
            '**There is a fire but it stays quiet.** A missed fire. Rare, but potentially catastrophic.',
          ], title: 'Four outcomes of an alarm' },
          { p: 'Now notice: an alarm that **never rings** is right almost every minute, because fires are rare. Its accuracy is superb and it is worthless. What we really want to know are two things. When it rings, how often is there really a fire? (That is **precision**.) When there is a fire, how often does it ring? (That is **recall**.)' },
          { p: 'Making the alarm more sensitive catches more fires (recall up) but rings more for toast (precision down). Making it less sensitive does the opposite. There is no setting that is best for every home; it depends on what each kind of mistake costs.' },
          { think: { q: 'For a hospital\'s first-stage cancer screening test, which matters more: precision or recall?', a: 'Recall. A missed cancer (false negative) can cost a life, while a false alarm leads to a follow-up test that clears the patient. Screening tests are therefore tuned to catch nearly every real case, accepting many false alarms that later tests sort out.' } },
        ],
      },
      {
        heading: 'Step by step: from predictions to a confusion matrix',
        blocks: [
          { p: 'Every classification metric starts from one small table that counts the four outcomes.' },
          { term: 'Confusion matrix', def: 'A 2 × 2 table counting true positives, false positives, false negatives and true negatives. It shows exactly where a classifier gets confused.' },
          { term: 'TP, FP, FN, TN', def: 'True positive: predicted yes, really yes. False positive: predicted yes, really no (false alarm). False negative: predicted no, really yes (a miss). True negative: predicted no, really no.' },
          { steps: [
            'Most classifiers output a **probability** for each case, for example "0.82 chance of fraud".',
            'Choose a **threshold** (default 0.5). Cases at or above it are predicted positive; the rest negative.',
            'Compare each prediction with the truth and put a tally in one of the four boxes.',
            'Compute metrics from the four counts.',
            'Change the threshold and repeat to see the trade-off between catching more and raising fewer false alarms.',
          ], title: 'The procedure' },
          { diagram: { kind: 'flow', nodes: ['Model outputs a **probability** per case', 'Apply a **threshold** (e.g. 0.5)', 'Tally **TP, FP, FN, TN**', 'Compute **precision, recall, F1**', 'Move the threshold to match **business costs**'], caption: 'The threshold turns probabilities into decisions. Metrics like precision and recall depend on it; ROC-AUC summarises all thresholds at once.' } },
          { term: 'Threshold', def: 'The probability cut-off above which a case is labelled positive. It is a business decision, not a property of the model.' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { tex: '\\text{Precision} = \\frac{TP}{TP + FP}', plain: 'Of everything the model flagged as positive, what share really was positive? "When the alarm rings, how often is there a fire?"', symbols: [['TP', 'true positives (correct alarms)'], ['FP', 'false positives (false alarms)']] },
          { tex: '\\text{Recall} = \\frac{TP}{TP + FN}', plain: 'Of all the cases that really were positive, what share did the model catch? Also called sensitivity or true positive rate.', symbols: [['FN', 'false negatives (missed cases)']] },
          { p: 'Notice what each formula leaves out. Precision ignores misses entirely; recall ignores false alarms entirely. That is why you must look at both. A model that flags everything has perfect recall and terrible precision; a model that flags only its single most confident case may have perfect precision and terrible recall.' },
          { tex: 'F_1 = \\frac{2 \\cdot \\text{Precision} \\cdot \\text{Recall}}{\\text{Precision} + \\text{Recall}}', plain: 'A single number that balances precision and recall. It is their harmonic mean, which stays low if either one is low.' },
          { p: 'Why the harmonic mean instead of the ordinary average? Take precision 1.0 and recall 0.02. The ordinary average is 0.51, which sounds respectable for a model that misses 98% of cases. The harmonic mean is about 0.04, which tells the truth. F1 rewards balance.' },
          { p: 'Two more rates complete the picture. The **false positive rate** is FP / (FP + TN): of all genuine negatives, the share wrongly flagged. Plotting recall against false positive rate for every possible threshold gives the **ROC curve**. The area under it, **ROC-AUC**, is the probability that the model gives a randomly chosen positive a higher score than a randomly chosen negative.' },
          { diagram: { kind: 'curve', fn: '1-Math.pow(1-x,3)', fn2: 'x', xMin: 0, xMax: 1, legend: ['our model (AUC = 0.75)', 'random guessing (AUC = 0.5)'], xLabel: 'false positive rate', yLabel: 'recall (true positive rate)', caption: 'A ROC curve. Each point is one threshold: lower thresholds move up and to the right (more caught, more false alarms). The further the curve bows towards the top-left corner, the better the model ranks positives above negatives. The diagonal is a coin toss.' } },
          { callout: 'When positives are very rare, ROC-AUC can look flattering because the huge number of true negatives keeps the false positive rate small. The **precision–recall curve** (and its area, PR-AUC or average precision) is usually more informative for fraud, defects and rare diseases.', tone: 'warn' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'The fraud model from the opening', setup: '1,000 transactions, 20 of them fraud. The model flags 30 transactions; 15 of those are real fraud.', steps: [
            'TP = 15 (flagged and fraud). FP = 30 − 15 = 15 (flagged but genuine).',
            'FN = 20 − 15 = 5 (fraud the model missed). TN = 1,000 − 15 − 15 − 5 = 965.',
            'Accuracy = (15 + 965) / 1,000 = 98.0%. A model that never flags anything scores (0 + 980) / 1,000 = 98.0% too.',
            'Precision = 15 / (15 + 15) = 50%. Recall = 15 / (15 + 5) = 75%.',
            'F1 = 2 × 0.5 × 0.75 / (0.5 + 0.75) = 0.75 / 1.25 = 0.60.',
            'False positive rate = 15 / (15 + 965) ≈ 1.5% of genuine customers inconvenienced.',
          ], result: 'The useful summary: "We catch 75% of fraud, half our alerts are real, and about 1.5% of genuine transactions are wrongly flagged." Accuracy alone could not distinguish this model from doing nothing.' } },
          { diagram: { kind: 'table', head: ['', 'Predicted fraud', 'Predicted genuine', 'Total'], rows: [['Actually fraud', 'TP = 15', 'FN = 5', '20'], ['Actually genuine', 'FP = 15', 'TN = 965', '980'], ['Total', '30', '970', '1,000']], caption: 'The confusion matrix for the fraud model. Read along the top row for recall (15 of 20 caught) and down the first column for precision (15 of 30 alerts real).' } },
          { example: { title: 'Moving the threshold', setup: 'Ten customers with predicted churn probabilities and what really happened (1 = churned): 0.95 (1), 0.85 (1), 0.80 (0), 0.70 (1), 0.60 (0), 0.45 (1), 0.40 (0), 0.30 (1), 0.20 (0), 0.10 (0). Five customers really churned.', steps: [
            'Threshold 0.5: flag the five customers at 0.60 or above. Of these, 3 churned (TP = 3) and 2 did not (FP = 2). Churners missed: those at 0.45 and 0.30, so FN = 2. TN = 3.',
            'Precision = 3 / 5 = 60%. Recall = 3 / 5 = 60%. F1 = 0.60. Accuracy = (3 + 3) / 10 = 60%.',
            'Threshold 0.35: also flag 0.45 (churned) and 0.40 (did not). TP = 4, FP = 3, FN = 1, TN = 2.',
            'Precision = 4 / 7 ≈ 57%. Recall = 4 / 5 = 80%. F1 = 2 × 0.571 × 0.8 / 1.371 ≈ 0.67. Accuracy still 60%.',
            'ROC-AUC: of the 5 × 5 = 25 churner/non-churner pairs, the churner has the higher probability in 19. AUC = 19 / 25 = 0.76.',
          ], result: 'Lowering the threshold caught one more churner at the cost of one more false alarm. Accuracy did not move, F1 improved, and AUC (which ignores the threshold) stayed at 0.76.' } },
          { example: { title: 'Choosing a defect detector by cost (business case)', setup: 'An auto-component plant inspects 5,000 castings, 100 of which are defective. A missed defect (FN) leads to a warranty claim costing about ₹20,000. A false alarm (FP) means a manual re-inspection costing ₹500. Model A: TP 70, FP 50, FN 30. Model B: TP 92, FP 400, FN 8.', steps: [
            'Model A: precision = 70 / 120 ≈ 58.3%, recall = 70 / 100 = 70%, F1 ≈ 0.64, accuracy = (70 + 4,850) / 5,000 = 98.4%.',
            'Model B: precision = 92 / 492 ≈ 18.7%, recall = 92%, F1 ≈ 0.31, accuracy = (92 + 4,500) / 5,000 = 91.8%.',
            'Cost of A = 30 × ₹20,000 + 50 × ₹500 = ₹6,00,000 + ₹25,000 = ₹6,25,000.',
            'Cost of B = 8 × ₹20,000 + 400 × ₹500 = ₹1,60,000 + ₹2,00,000 = ₹3,60,000.',
          ], result: 'Model A wins on accuracy and F1, yet Model B saves ₹2.65 lakh per 5,000 castings because misses are 40 times more expensive than false alarms. When costs are known, put them in rupees and let them decide.' } },
        ],
      },
      {
        heading: 'Reading the metrics: which one when?',
        blocks: [
          { bullets: [
            '**Precision first** when false alarms are expensive or annoying: blocking genuine card payments, sending a field engineer, flagging an employee for investigation.',
            '**Recall first** when misses are expensive: disease screening, safety-critical defects, money-laundering alerts that regulators audit.',
            '**F1** when both matter and you need a single number for comparison, especially with imbalanced classes.',
            '**ROC-AUC** to compare how well models rank cases, independent of threshold. Good for balanced or moderately imbalanced data.',
            '**PR-AUC (average precision)** for rare positives, where it is more sensitive to improvements than ROC-AUC.',
            '**Expected cost in rupees** whenever you can estimate the cost of each error type. It is the metric the business actually feels.',
          ] },
          { p: 'In scikit-learn, `classification_report(y_true, y_pred)` prints precision, recall and F1 for each class at once, and `confusion_matrix` gives the four counts. Read the matrix first; it prevents most misunderstandings.' },
          { callout: 'Beware the labels in scikit-learn\'s `confusion_matrix`: rows are actual classes and columns are predicted classes, ordered [0, 1]. So `ravel()` returns TN, FP, FN, TP in that order.', tone: 'tip' },
        ],
      },
      {
        heading: 'In the real world',
        blocks: [
          { case: { title: 'Tuning alerts for a bank\'s fraud team (illustrative)', story: 'A bank\'s fraud operations team can review about 400 alerts a day. The first model, run at the default 0.5 threshold, produces 2,000 alerts a day with 6% precision; analysts are swamped and start ignoring alerts. The data science team keeps the same model but changes the threshold so that only the top 400 scores each day are flagged. Precision rises to about 30% and recall falls, but every alert is now reviewed, so more fraud is actually stopped than before. The team reports precision and recall "at 400 alerts per day" alongside PR-AUC, which matches how the business operates.' } },
          { bullets: [
            '**Churn campaigns:** precision at the top 10% of scores tells marketing how many retention offers reach real churners.',
            '**Medical diagnostics:** regulators look at sensitivity (recall) and specificity (TN / (TN + FP)).',
            '**Spam filters:** very high precision is required, because losing a genuine email hurts more than seeing one spam message.',
            '**Lead scoring:** sales teams care about precision in the leads they actually call.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Accuracy on imbalanced data.** Always compare with the "always predict the majority" baseline.',
            '**Keeping the default 0.5 threshold.** It is arbitrary. Choose it by cost, capacity (alerts per day) or a target recall.',
            '**Reporting one number.** Precision without recall (or the reverse) can be gamed. Report both, or the confusion matrix.',
            '**ROC-AUC alone for rare events.** Add PR-AUC or precision at a fixed alert volume.',
            '**Tuning the threshold on the test set.** Choose it on validation data; otherwise the test score is optimistic.',
            '**Ignoring calibration.** If the business uses the probabilities themselves (expected loss = probability × amount), check that a predicted 20% really means about 20%, using a calibration curve or the Brier score.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'Precision', items: ['Of the alarms raised, how many were real?', 'Hurt by false positives', 'Raise it with a higher threshold', 'Matters when acting on an alarm is costly'] }, right: { title: 'Recall', items: ['Of the real cases, how many raised an alarm?', 'Hurt by false negatives', 'Raise it with a lower threshold', 'Matters when missing a case is costly'] }, caption: 'The central trade-off of classification. Moving the threshold trades one for the other; business costs decide where to stop.' } },
        ],
      },
    ],
    faq: [
      { q: 'What is a good F1 score?', a: 'It depends on the problem and on how rare the positive class is. Always compare with a baseline (for example a simple rule) and translate into business terms: "catch 75%, half the alerts are real".' },
      { q: 'Why not just maximise accuracy?', a: 'Because it weights all errors equally and is dominated by the common class. With 2% fraud, doing nothing scores 98%.' },
      { q: 'What does an AUC of 0.5 mean?', a: 'The model ranks positives and negatives no better than a coin toss. An AUC of 1.0 means every positive is scored above every negative.' },
      { q: 'How do I pick the threshold?', a: 'Use validation data. Either minimise expected cost (FN cost × FN + FP cost × FP), fix a capacity (top 400 alerts a day), or fix a required recall (catch at least 90%) and maximise precision subject to it.' },
      { q: 'What about more than two classes?', a: 'Compute precision and recall for each class (one class versus the rest), then average. "Macro" averaging treats every class equally; "weighted" averaging weights by class size. `classification_report` shows both.' },
      { q: 'Is recall the same as sensitivity?', a: 'Yes. Recall, sensitivity and true positive rate are three names for TP / (TP + FN). Specificity is the matching measure for negatives: TN / (TN + FP).' },
    ],
  },

  'hyperparameter-tuning': {
    minutes: 15,
    hook: 'A new car leaves the factory with sensible default settings, but a rally team does not race it that way. They adjust tyre pressure, suspension stiffness and gear ratios for each track, test a lap, and adjust again. Machine learning models also come with dials that are set before training starts: how deep a tree may grow, how many neighbours to consult, how fast to learn. **Hyperparameter tuning** is the disciplined way of setting those dials without fooling yourself about how well the model will really perform.',
    sections: [
      {
        heading: 'The problem: dials the model cannot set for itself',
        blocks: [
          { p: 'When a model trains, it learns some numbers from the data: the slope of a regression line, the split points of a decision tree, the weights of a neural network. But other choices must be made **before** training begins, and the data cannot make them directly. How deep should the tree be allowed to grow? How strongly should large coefficients be penalised? How many trees should a forest contain?' },
          { term: 'Parameter', def: 'A number the model learns from the training data, such as a regression coefficient or a tree\'s split threshold. You do not set it by hand.' },
          { term: 'Hyperparameter', def: 'A setting chosen before training that controls how the model learns: maximum tree depth, number of neighbours k, learning rate, regularisation strength. In scikit-learn these are the arguments you pass when creating the model, such as `max_depth=4`.' },
          { p: 'Defaults are a reasonable starting point but rarely the best choice for your data. A tree that is too shallow underfits; one that is too deep overfits. The right depth depends on how much data you have and how noisy it is. Tuning finds settings that work well for **your** problem, and it often brings a cheap, meaningful improvement.' },
          { diagram: { kind: 'bars', labels: ['depth 1', 'depth 2', 'depth 4', 'depth 6', 'depth 8', 'no limit'], values: [0.762, 0.86, 0.86, 0.86, 0.833, 0.833], highlight: 1, yLabel: '5-fold CV accuracy', caption: 'Cross-validated accuracy of a decision tree on a 600-point noisy two-class dataset (scikit-learn\'s make_moons, noise 0.35). One hyperparameter, max_depth, moves accuracy from 0.76 to 0.86 and back down to 0.83. Depths 2, 4 and 6 tie; the simplest, depth 2, is highlighted.' } },
        ],
      },
      {
        heading: 'Building the intuition: tuning a guitar',
        blocks: [
          { p: 'Think of tuning a guitar by ear. You cannot calculate the perfect peg position in advance. Instead you follow a loop.' },
          { steps: [
            '**Turn a peg a little.** This is choosing a hyperparameter value.',
            '**Pluck the string and listen.** This is training the model and measuring how good it sounds on data it has not learned from.',
            '**Compare with the reference note.** This is your validation score.',
            '**Adjust and repeat,** keeping the position that sounds best.',
            '**Then play a real song for an audience.** This is the final test set: you do not keep retuning in the middle of the concert.',
          ], title: 'Tune, listen, repeat' },
          { p: 'Two details of the analogy matter. First, you must **listen with a fresh ear**: judge each setting on data the model did not learn from, or every setting will sound perfect. Second, you **do not tune during the concert**: if you adjust settings after looking at the test score, the test score stops being honest.' },
          { think: { q: 'Why can\'t we pick max_depth by choosing the value with the best training accuracy?', a: 'Training accuracy keeps rising as depth increases, reaching 100% with an unlimited tree, because a deep tree can memorise every row. It would always pick the most complex model. Hyperparameters must be judged on held-out data, usually with cross-validation.' } },
        ],
      },
      {
        heading: 'How tuning works, step by step',
        blocks: [
          { diagram: { kind: 'flow', nodes: ['**Lock away** the test set', '**Define a search space** of hyperparameter values', '**For each candidate**, score it with k-fold CV on training data', '**Pick** the candidate with the best mean CV score', '**Refit** on all training data and **test once**'], caption: 'The standard tuning loop. In scikit-learn, GridSearchCV and RandomizedSearchCV run the middle three steps and refit the winner automatically.' } },
          { steps: [
            '**Choose the metric** that reflects the business goal (F1, recall at a given precision, MAE). Tuning optimises whatever you tell it to.',
            '**Choose the hyperparameters that matter** for this model and a sensible range for each. For a random forest: `max_depth`, `min_samples_leaf`, `max_features`, `n_estimators`.',
            '**Choose a search strategy**: grid, random or Bayesian (below).',
            '**Run the search with cross-validation.** Every candidate is trained k times and its k validation scores averaged.',
            '**Inspect the results**, not just the winner. If the best value sits at the edge of your range, widen the range and search again.',
            '**Refit and test once.** Retrain the best configuration on all the training data and score it on the untouched test set.',
          ], title: 'The procedure' },
          { term: 'Search space', def: 'The list or range of values you allow each hyperparameter to take, for example max_depth in {3, 5, 10, None} and learning rate between 0.01 and 0.3.' },
        ],
      },
      {
        heading: 'Under the hood: grid, random and Bayesian search',
        blocks: [
          { p: '**Grid search** tries every combination of the values you list. It is thorough and easy to explain, but the number of combinations multiplies quickly.' },
          { tex: 'N_{\\text{fits}} = k \\times \\prod_{j=1}^{m} v_j', plain: 'The number of model trainings equals the number of folds times the product of how many values you try for each hyperparameter.', symbols: [['k', 'number of cross-validation folds'], ['m', 'number of hyperparameters being tuned'], ['v_j', 'number of values tried for hyperparameter j'], ['\\prod', 'multiply all the terms together']] },
          { p: 'Why multiply? Because a grid tries every value of the first hyperparameter with every value of the second, and so on. Three values of one and four of another is 12 combinations, not 7. Each extra hyperparameter multiplies the cost again.' },
          { term: 'Random search', def: 'Instead of every combination, try a fixed number of combinations drawn at random from the search space. You control the budget directly.' },
          { p: 'Random search sounds careless, but it is usually better for the same budget. In most problems only one or two hyperparameters really matter. A grid wastes many trials repeating the same few values of the important ones while varying unimportant ones. Random search tries a new value of every hyperparameter on every trial. There is also a neat probability argument.' },
          { tex: 'P(\\text{at least one trial in the top } 5\\%) = 1 - 0.95^{\\,n}', plain: 'Each random trial has a 5% chance of landing in the best 5% of the search space. The chance that all n trials miss is 0.95 multiplied by itself n times; one minus that is the chance at least one hits.', symbols: [['n', 'number of random trials']] },
          { p: 'With n = 60, that probability is about 95%. So 60 random trials are very likely to find a configuration in the top 5% of the space, however many hyperparameters there are.' },
          { term: 'Bayesian optimisation', def: 'A search that learns from earlier trials. It builds a rough model of "which settings tend to score well" and chooses the next trial where improvement looks most likely. Libraries such as Optuna and Hyperopt do this.' },
          { diagram: { kind: 'compare', left: { title: 'Grid search', items: ['Tries every listed combination', 'Easy to explain and reproduce', 'Cost multiplies with each hyperparameter', 'Good for 1–2 hyperparameters with few values'] }, right: { title: 'Random and Bayesian search', items: ['Tries a fixed budget of combinations', 'Explores more distinct values of what matters', 'Bayesian versions learn where to look next', 'Standard for boosting models and neural networks'] }, caption: 'Start with random search for most problems; switch to Bayesian optimisation when each training run is expensive.' } },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Counting the cost of a grid', setup: 'A random forest grid: n_estimators in {100, 300, 500}, max_depth in {5, 10, 20, None}, min_samples_leaf in {1, 3, 5}. 5-fold CV. Each fit takes about 20 seconds.', steps: [
            'Combinations = 3 × 4 × 3 = 36.',
            'Fits = 36 × 5 folds = 180.',
            'Time = 180 × 20 s = 3,600 s = 1 hour (plus one final refit).',
            'Adding max_features with 5 values: 36 × 5 = 180 combinations, 900 fits, about 5 hours.',
            'A random search with 60 trials costs 60 × 5 = 300 fits, about 1 hour 40 minutes, and covers all four hyperparameters.',
          ], result: 'Grids explode multiplicatively. Beyond two or three hyperparameters, a random search with a fixed budget is the practical choice.' } },
          { example: { title: 'Tuning tree depth with real numbers', setup: 'A decision tree on 600 noisy points (make_moons, noise 0.35), scored with 5-fold stratified CV. Training accuracy is on all 600 points.', steps: [
            'Depth 1: training 0.785, CV 0.762. Both low: underfitting.',
            'Depth 2: training 0.883, CV 0.860.',
            'Depth 4: training 0.887, CV 0.860. Depth 6: training 0.918, CV 0.860.',
            'Depth 8: training 0.950, CV 0.833. No limit: training 1.000, CV 0.833. The gap widens: overfitting.',
            'Depths 2, 4 and 6 tie on CV. Prefer the simplest, depth 2: easier to explain and less likely to overfit new data.',
          ], result: 'Training accuracy rose steadily to 100% while CV accuracy peaked and fell. Tuning with CV found the sweet spot that training accuracy would have missed.' } },
          { example: { title: 'Tuning a churn model for a telecom operator (business case, illustrative)', setup: 'A gradient-boosting churn model with 80,000 customers. The team holds out 20% as a test set and runs a 50-trial random search over learning rate, number of trees, tree depth and minimum leaf size, scored by 5-fold CV F1.', steps: [
            'Default settings: CV F1 = 0.58.',
            '50 trials × 5 folds = 250 fits, about 40 minutes on a laptop.',
            'Best trial: learning rate 0.05, 400 trees, depth 4, minimum leaf size 50. CV F1 = 0.64.',
            'Refit on all training data and score once on the test set: F1 = 0.63.',
            'At the operator\'s retention economics, the extra six points of F1 mean several hundred more correctly targeted at-risk customers per monthly campaign.',
          ], result: 'Tuning was worth 5–6 F1 points for under an hour of computer time, and the test score (0.63) close to the CV score (0.64) shows the search did not fool itself.' } },
        ],
      },
      {
        heading: 'Which hyperparameters matter?',
        blocks: [
          { p: 'You do not need to tune everything. Each model family has a few dials that do most of the work.' },
          { diagram: { kind: 'table', head: ['Model', 'Tune first', 'Usually fine at default'], rows: [['Ridge / Lasso / logistic', 'Regularisation strength (alpha or C)', 'Solver, tolerance'], ['k-NN', 'k, distance weighting', 'Algorithm, leaf size'], ['Decision tree', 'max_depth, min_samples_leaf', 'Split criterion'], ['Random forest', 'max_features, min_samples_leaf', 'n_estimators (more is safe, just slower)'], ['Gradient boosting', 'learning rate with number of trees, depth', 'Subsample rate (tune later)'], ['SVM (RBF kernel)', 'C and gamma together', 'Cache size']], caption: 'A starting map of where tuning effort pays off. Search wide first on a log scale for strengths and rates (0.001, 0.01, 0.1, 1, 10), then narrow.' } },
          { bullets: [
            '**Use log scales** for anything that spans orders of magnitude, like regularisation strength or learning rate.',
            '**Tune related dials together:** a smaller learning rate needs more trees.',
            '**Use early stopping** for boosting and neural networks instead of tuning the number of rounds by grid.',
            '**Check the edges:** if the best value is the largest you tried, the true optimum may be beyond your range.',
          ] },
        ],
      },
      {
        heading: 'In the real world',
        blocks: [
          { case: { title: 'Demand forecasting with a fixed overnight budget (illustrative)', story: 'A consumer-goods company retrains its LightGBM demand model every week across 1,200 product–region series. A full grid search would take days. The team runs an Optuna search with a budget of 100 trials overnight, scored on a rolling-origin backtest of the last 12 weeks rather than shuffled folds, because the data is a time series. Most weeks the best settings barely change, so the search is warm-started from last week\'s best trials. The weekly report records the chosen settings and the backtest WAPE, so any sudden jump in error can be traced to data or to tuning.' } },
          { bullets: [
            '**Kaggle competitions** routinely use Bayesian optimisation over boosting hyperparameters.',
            '**AutoML tools** (Azure AutoML, AutoGluon, H2O) automate model choice and tuning together.',
            '**Deep learning** teams tune learning rate first; it usually matters more than any other setting.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Tuning on the test set.** The most common and most damaging mistake. Tune with CV on the training data; test once.',
            '**Overfitting the validation process.** Try a thousand configurations and the best CV score will be optimistic, partly through luck. Use nested CV or a final test set to get an honest number.',
            '**Preprocessing outside the CV loop.** Scaling or feature selection on all the data before GridSearchCV leaks information. Put them in a Pipeline and tune the pipeline.',
            '**Huge grids over dials that barely matter.** Spend the budget on the important hyperparameters.',
            '**Chasing tiny differences.** A gain of 0.002 in CV score is usually noise. Prefer the simpler configuration when scores are within one standard deviation.',
            '**Forgetting the seed.** Fix `random_state` so results can be reproduced and compared.',
          ] },
          { callout: 'Tuning rarely rescues a weak model. Better features and cleaner data usually beat clever hyperparameter search. Tune after the features are sensible, not instead of building them.', tone: 'key' },
        ],
      },
    ],
    faq: [
      { q: 'Is the number of trees in a random forest a hyperparameter?', a: 'Yes. More trees rarely hurts accuracy; it mainly costs time. Choose a number where the CV score has stopped improving, often a few hundred.' },
      { q: 'Grid search or random search?', a: 'Grid search for one or two hyperparameters with a handful of values each. Random search (or Bayesian) for anything larger.' },
      { q: 'What does GridSearchCV do after the search?', a: 'With the default `refit=True` it retrains the best configuration on all the data you passed in. `best_params_`, `best_score_` and `best_estimator_` give the winner, its mean CV score and the refitted model.' },
      { q: 'Why is my test score lower than the best CV score?', a: 'Usually a little optimism from picking the best of many candidates, plus ordinary noise. A small drop is normal; a large drop suggests leakage or a test set that differs from training data.' },
      { q: 'How many random-search trials are enough?', a: 'Often 30–100. By the probability argument, 60 trials give about a 95% chance of landing in the top 5% of the search space.' },
      { q: 'Can I tune preprocessing choices too?', a: 'Yes. Put the steps in a Pipeline and name them in the search space, for example `pca__n_components` or the imputer strategy. That is one of the best reasons to use pipelines.' },
    ],
  },

  'sklearn-pipelines': {
    minutes: 15,
    hook: 'A data scientist builds a loan-approval model in a notebook. It fills in missing incomes, scales the numbers, encodes the city, and scores well. Six months later the IT team deploys it and the predictions are strange: someone re-implemented the preprocessing slightly differently, and a new city crashed the encoder. Meanwhile an auditor finds that the impressive validation score was inflated because the scaler had seen the validation rows. **scikit-learn Pipelines** solve all three problems by bolting preprocessing and model together into one object.',
    sections: [
      {
        heading: 'The problem: loose steps that leak and drift',
        blocks: [
          { p: 'Real data is messy. Before a model can learn, you usually fill in missing values, put numeric columns on a common scale, and turn text categories such as city names into numbers. Each of these steps **learns something from the data**: the median income, the average and spread of each column, the list of cities.' },
          { term: 'Preprocessing', def: 'Everything done to the raw data before the model sees it: filling gaps, scaling, encoding categories, creating features.' },
          { term: 'Transformer', def: 'In scikit-learn, an object that learns something from data with `.fit()` and then changes data with `.transform()`. A scaler learns each column\'s mean and standard deviation; an imputer learns the value used to fill gaps.' },
          { p: 'If these steps are run by hand, three things go wrong. First, it is easy to fit them on **all** the data before splitting, which leaks information from validation rows into training. Second, the same steps must be repeated exactly on new data in production, and hand-copied code drifts. Third, every cross-validation fold should refit the preprocessing on its own training part, which is tedious to do by hand and so is often skipped.' },
          { diagram: { kind: 'compare', left: { title: 'Loose steps by hand', items: ['Scaler fitted on all rows, then CV run', 'Preprocessing copied into production code', 'New categories crash the encoder', 'Several objects to save and keep in sync'] }, right: { title: 'One Pipeline object', items: ['Every step refitted inside each CV fold', 'The same fitted object used in production', 'Encoder set to ignore unseen categories', 'One file saved, loaded and versioned'] }, caption: 'The same preprocessing, organised two ways. The right-hand column removes a whole class of bugs without changing the model at all.' } },
        ],
      },
      {
        heading: 'Building the intuition: the assembly line',
        blocks: [
          { p: 'Picture a car assembly line. Every car body passes through the same stations in the same order: welding, painting, engine fitting, inspection. Each station is set up once (calibrated) and then processes every car identically. No car skips the paint shop; no station is re-calibrated halfway through a shift using cars from tomorrow\'s batch.' },
          { steps: [
            '**Design the line once:** list the stations in order. In scikit-learn: imputer, then scaler, then model.',
            '**Calibrate the stations on training cars only:** `.fit()` on training data sets up every station in turn.',
            '**Run new cars down the same line:** `.predict()` on new data passes it through the calibrated stations, untouched by the new data itself.',
            '**Ship the whole line, not individual machines:** save one object and production gets identical processing.',
          ], title: 'The line, station by station' },
          { term: 'Pipeline', def: 'A scikit-learn object that chains several transformers and a final model into a single estimator. Calling `.fit()` fits each step in order; calling `.predict()` applies the fitted steps and then the model.' },
          { think: { q: 'Inside 5-fold cross-validation, how many times is a pipeline\'s scaler fitted, and on what data?', a: 'Five times, once per fold, each time on that fold\'s training part only. The validation fold is transformed with a scaler that has never seen it, exactly as real new data would be.' } },
        ],
      },
      {
        heading: 'How a pipeline works, step by step',
        blocks: [
          { diagram: { kind: 'flow', nodes: ['Raw table: **income, age, city**', '**Impute** missing values (median)', '**Scale** numbers / **one-hot encode** city', '**Model**: logistic regression', '**Prediction**: approve or decline'], caption: 'A typical tabular pipeline. During `.fit()`, each step learns from the training data and passes transformed data to the next; during `.predict()`, the same learned settings are applied to new rows.' } },
          { steps: [
            '**List the steps.** `make_pipeline(SimpleImputer(strategy="median"), StandardScaler(), LogisticRegression())`.',
            '**Fit.** `pipe.fit(X_train, y_train)` calls `fit_transform` on the imputer, passes the result to the scaler\'s `fit_transform`, then calls `fit` on the model.',
            '**Predict.** `pipe.predict(X_new)` calls only `transform` on the imputer and scaler (no re-learning), then `predict` on the model.',
            '**Evaluate correctly.** `cross_val_score(pipe, X, y, cv=5)` clones the whole pipeline for each fold, so every step is refitted per fold.',
            '**Save.** `joblib.dump(pipe, "loan_model.joblib")` stores every fitted step in one file.',
          ], title: 'The procedure in code terms' },
          { p: 'Most real tables mix numeric and categorical columns, which need different treatment. That is the job of the **ColumnTransformer**.' },
          { term: 'ColumnTransformer', def: 'A scikit-learn tool that sends different columns to different preprocessing steps (for example, numbers to imputer + scaler, text categories to a one-hot encoder) and joins the results side by side.' },
          { term: 'One-hot encoding', def: 'Turning a category column into several 0/1 columns, one per category. A row from Pune gets 1 in the "Pune" column and 0 elsewhere.' },
          { diagram: { kind: 'tree', root: { label: 'Pipeline', children: [{ label: 'ColumnTransformer', edge: 'step 1', children: [{ label: 'income, age → impute median → scale', edge: 'numeric' }, { label: 'city → one-hot (ignore unknown)', edge: 'categorical' }] }, { label: 'LogisticRegression', edge: 'step 2' }] }, caption: 'The structure of a typical pipeline. The ColumnTransformer routes each column group to its own mini-pipeline, joins the outputs, and hands them to the model.' } },
        ],
      },
      {
        heading: 'Under the hood: fit, transform and why leakage happens',
        blocks: [
          { p: 'Take standard scaling, the most common transformer. It learns two numbers per column from the training data and then applies a fixed formula.' },
          { tex: 'z = \\frac{x - \\mu_{\\text{train}}}{\\sigma_{\\text{train}}}', plain: 'Subtract the training mean and divide by the training standard deviation. The same μ and σ, learned once from training rows, are used for every later row, including validation, test and production data.', symbols: [['x', 'the original value'], ['\\mu_{\\text{train}}', 'mean of the column in the training data'], ['\\sigma_{\\text{train}}', 'standard deviation in the training data (scikit-learn divides by n)'], ['z', 'the scaled value']] },
          { p: 'Why must μ and σ come from training data only? Because in real use, a new loan application arrives alone. Nobody can compute statistics that include it in advance. If validation rows helped set μ and σ, the model was evaluated in a situation that can never occur in production, and the score is slightly too good. With feature selection, the effect can be enormous, as an example below shows.' },
          { p: 'The pipeline enforces the rule mechanically. `fit` is only ever called on training data; `transform` is used on everything else. You cannot forget, because you never call the steps yourself.' },
          { callout: 'Rule of thumb: any step that computes something from the data (a mean, a median, a vocabulary, a list of selected features, PCA directions) belongs inside the pipeline. Steps that do not learn (parsing dates, fixing typos) can happen before.', tone: 'key' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Tracing a tiny loan pipeline by hand', setup: 'Training data: incomes (₹ thousand per month) 10, 20, missing, 15; cities Pune, Chennai, Pune, Delhi. Numeric pipeline: median imputer then standard scaler. Categorical: one-hot encoder with `handle_unknown="ignore"`.', steps: [
            'Imputer learns the median of the known incomes 10, 20, 15, which is 15. The missing income becomes 15: column = 10, 20, 15, 15.',
            'Scaler learns mean = (10 + 20 + 15 + 15) / 4 = 15 and standard deviation = √((25 + 25 + 0 + 0) / 4) = √12.5 ≈ 3.536.',
            'Scaled incomes: (10 − 15) / 3.536 ≈ −1.414, then +1.414, 0, 0.',
            'Encoder learns the cities, in alphabetical order: Chennai, Delhi, Pune. Pune → (0, 0, 1), Chennai → (1, 0, 0), Delhi → (0, 1, 0).',
            'New applicant: income 18, city Mumbai. Scaled income = (18 − 15) / 3.536 ≈ 0.849. Mumbai was never seen, so it becomes (0, 0, 0) instead of crashing.',
          ], result: 'The new row reaches the model as (0.849, 0, 0, 0), using only settings learned from training data. These are exactly the numbers scikit-learn produces.' } },
          { example: { title: 'Leakage in numbers', setup: 'Same four training rows, plus two validation rows with incomes 60 and 80. Suppose the imputer and scaler are wrongly fitted on all six rows.', steps: [
            'Wrong median of the known incomes 10, 20, 15, 60, 80 = 20, so the missing training income is filled with 20 instead of 15.',
            'Wrong mean of 10, 20, 15, 15, 60, 80 = 200 / 6 ≈ 33.3 instead of 15.',
            'Every training row is now shifted using information from the validation rows, which in real life would not exist yet.',
            'Inside a pipeline, each fold\'s imputer and scaler are fitted only on that fold\'s training rows, so this cannot happen.',
          ], result: 'With scaling the damage is usually small; the principle is what matters. With supervised steps, the next example shows it can be dramatic.' } },
          { example: { title: 'Feature selection on pure noise', setup: 'A simulation: 50 rows, 5,000 columns of random numbers, and a random yes/no label (25 of each). There is nothing to learn; honest accuracy should be about 50%. Pick the 20 columns most related to the label, then run 5-fold CV of logistic regression. Repeat 20 times with different random data.', steps: [
            'Wrong way: select the 20 columns using all 50 rows, then cross-validate. Average CV accuracy = 95.5%.',
            'Right way: put `SelectKBest(k=20)` inside a pipeline, so selection is redone on each fold\'s training rows only. Average CV accuracy = 51%.',
            'The wrong way chose columns that happen, by chance, to match the labels of the validation rows too.',
          ], result: 'A pipeline turned a fake 95.5% into an honest 51%. This classic trap appears in textbooks such as The Elements of Statistical Learning as "the wrong way to do cross-validation".' } },
        ],
      },
      {
        heading: 'Pipelines with tuning and deployment',
        blocks: [
          { p: 'Pipelines combine naturally with hyperparameter search. Each step has a name, and you refer to its settings with a double underscore: `logisticregression__C` or `columntransformer__pipeline__simpleimputer__strategy`. The search then tunes preprocessing and model together, refitting everything correctly in every fold.' },
          { diagram: { kind: 'table', head: ['Call', 'Training data', 'New / validation data'], rows: [['fit', 'Each step learns its settings', 'Never used'], ['transform', 'Applied after fitting', 'Applied with training settings'], ['predict', 'Possible, but scores are optimistic', 'The real use'], ['fit_transform', 'Learn then apply in one go', 'Never used']], caption: 'Which calls touch which data. A pipeline makes sure "fit" only ever sees training rows.' } },
          { bullets: [
            '**Save and load:** `joblib.dump(pipe, path)` and `joblib.load(path)`. Load with the same scikit-learn version you saved with.',
            '**Unknown categories:** set `OneHotEncoder(handle_unknown="ignore")` so new cities or product codes do not crash production.',
            '**Inspect features:** `pipe[:-1].get_feature_names_out()` lists the columns the model actually receives.',
            '**Custom steps:** wrap your own pandas function in `FunctionTransformer`, or write a small class with `fit` and `transform`, so it travels with the pipeline.',
          ] },
        ],
      },
      {
        heading: 'In the real world',
        blocks: [
          { case: { title: 'One artefact from notebook to production (illustrative)', story: 'A motor insurer\'s pricing team used to hand over a notebook and a document describing the preprocessing to the engineering team, which rewrote it in Java. Small differences, such as rounding of vehicle age and handling of blank postcodes, made production prices drift from the validated ones. The team moved to a single scikit-learn Pipeline containing a ColumnTransformer, a gradient-boosting model and a custom transformer for vehicle-age bands. The fitted pipeline is saved, versioned in a model registry and served behind an API. Validation, monitoring and production now run the identical object, and the drift disappeared.' } },
          { bullets: [
            '**MLOps platforms** (Azure ML, MLflow, SageMaker) log and serve fitted pipelines as single models.',
            '**Text classification:** a TfidfVectorizer plus a linear model in one pipeline keeps the vocabulary fitted on training text only.',
            '**AutoML tools** output their best result as a pipeline, preprocessing included.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Preprocessing before the pipeline.** Scaling the whole DataFrame and then building a pipeline with only the model defeats the purpose.',
            '**Row-changing steps.** Standard pipelines cannot drop rows or change the target. Remove duplicates and outliers before splitting, or use the `imbalanced-learn` Pipeline for resampling such as SMOTE so it is applied to training folds only.',
            '**Target leakage is still possible.** A pipeline cannot help if a feature itself contains the answer (for example "days in collections" in a default model). Think about what is known at prediction time.',
            '**Version mismatches.** A pipeline saved with one scikit-learn version may not load in another. Pin versions in production.',
            '**Debugging is harder.** Inspect intermediate outputs with `pipe[:2].transform(X)` or `set_output(transform="pandas")` to see named columns.',
          ] },
          { callout: 'If your preprocessing is in pandas and your model in scikit-learn, move the learned parts into transformers. The small effort pays back every time you cross-validate, tune or deploy.', tone: 'tip' },
        ],
      },
    ],
    faq: [
      { q: 'What is the difference between Pipeline and make_pipeline?', a: '`Pipeline([("scale", StandardScaler()), ("model", LogisticRegression())])` lets you name the steps. `make_pipeline(...)` names them automatically after the class, in lower case, for example `standardscaler`.' },
      { q: 'Does a pipeline make my model more accurate?', a: 'Not directly. It makes the evaluation honest and the deployment consistent. Sometimes the honest score is lower, which is the point.' },
      { q: 'Can I use pandas DataFrames with pipelines?', a: 'Yes. ColumnTransformer accepts column names, and `set_output(transform="pandas")` makes steps return DataFrames with readable column names.' },
      { q: 'Where does scaling go for tree models?', a: 'Trees do not need scaling, so you can leave it out. Imputation and encoding still belong in the pipeline.' },
      { q: 'How do I tune a step inside a pipeline?', a: 'Use the step name, two underscores and the parameter name in the search space, for example `{"logisticregression__C": [0.1, 1, 10]}`, and pass the pipeline to GridSearchCV.' },
      { q: 'What happens to a category seen in production but not in training?', a: 'With `handle_unknown="ignore"`, all its one-hot columns are 0. Without it, `transform` raises an error. Monitor how often unknown categories appear; frequent ones mean it is time to retrain.' },
    ],
  },
};
