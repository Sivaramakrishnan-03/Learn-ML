import { DeepLesson } from './types';

// STATISTICS PART 2: chi-square, ANOVA, correlation, bootstrap, A/B testing, Bayes' theorem, MLE.
// Every number in the worked examples was checked with python3 + scipy.
export const STATS2_DEEP: Record<string, DeepLesson> = {
  'chi-square': {
    minutes: 18,
    hook: 'A telecom company notices that customers on its cheapest plan seem to leave more often. A plant manager suspects the night shift produces more defective parts. A board-game shop owner thinks one of her dice lands on six too often. All three are asking the same kind of question: **are these counts what we would expect by chance, or is something real going on?** The chi-square test (pronounced "kai-square") is the standard tool for answering it.',
    sections: [
      {
        heading: 'The problem: questions about counts, not averages',
        blocks: [
          { p: 'Much of statistics is about averages: average salary, average delivery time, average sales. But a huge amount of business data is not measured on a scale at all. It is sorted into **boxes**: plan type (Basic, Standard, Premium), churned or stayed, shift (morning, evening, night), defective or fine, region, product colour, survey answer.' },
          { term: 'Categorical variable', def: 'A variable whose values are labels or groups rather than measurements, such as city, plan type or yes/no. You can count how many items fall in each group, but you cannot take a meaningful average of the labels.' },
          { p: 'With categorical data the only thing you can do is **count**: 60 Basic customers churned, 240 Standard customers stayed, 33 night-shift parts were defective. The natural question is whether those counts are surprising. Night shift has more defects than morning shift, but is the gap big enough to act on, or would a gap like that turn up by luck anyway?' },
          { p: 'You cannot answer that with a t-test, because there are no averages to compare. You need a test built for counts. The chi-square test does exactly one thing: it measures how far the counts you **observed** are from the counts you would **expect** if nothing interesting were happening, and tells you how unusual that distance is.' },
          { term: 'Observed and expected counts', def: 'Observed counts are what actually happened in your data. Expected counts are what you would see, on average, if the "nothing is going on" assumption were true (a fair die, or churn unrelated to plan).' },
          { diagram: { kind: 'bars', labels: ['Face 1', 'Face 2', 'Face 3', 'Face 4', 'Face 5', 'Face 6'], values: [5, 8, 9, 8, 10, 20], highlight: 5, yLabel: 'times rolled (out of 60)', caption: 'Sixty rolls of a suspect die. A fair die should give about 10 of each face. Faces 1 to 5 wobble around 10 as you would expect, but face 6 came up 20 times. The chi-square test turns "that looks odd" into a number.' } },
        ],
      },
      {
        heading: 'Building the intuition: the sweet-jar inspector',
        blocks: [
          { p: 'Imagine a sweet factory that promises each jar contains equal numbers of red, green and yellow sweets. You are the inspector. You open a jar of 30 sweets and count: 12 red, 10 green, 8 yellow. Is the factory cheating?' },
          { steps: [
            '**Write down what a fair jar would look like.** Equal colours means 10, 10, 10. These are your expected counts.',
            '**Look at the gaps.** Red is 2 over, green is spot on, yellow is 2 under.',
            '**Remember that random jars are never perfect.** Even an honest machine will rarely give exactly 10, 10, 10. Small gaps are normal.',
            '**Ask how big the gaps are compared with what luck usually produces.** Gaps of 2 in a jar of 30 are very ordinary. Gaps of 15 would be alarming.',
            '**Only accuse the factory if the gaps are bigger than luck can comfortably explain.**',
          ], title: 'How a sensible inspector thinks' },
          { p: 'That is the whole idea of chi-square. It adds up all the gaps into one "surprise score". A small score says "this is what luck looks like". A large score says "luck rarely does this; something is probably going on".' },
          { think: { q: 'Why does the inspector care about the size of a gap relative to the expected count, and not just the raw gap?', a: 'A gap of 5 is huge if you expected 10 (half as much again), but trivial if you expected 1,000. So the test divides each squared gap by the expected count. That puts gaps from big and small boxes on a fair footing.' } },
          { callout: 'Chi-square starts by assuming nothing is going on (a fair die, no link between plan and churn). That starting assumption is called the **null hypothesis**. The test then asks how embarrassing the data is for that assumption.', tone: 'key' },
          { term: 'Null hypothesis', def: 'The "boring" default assumption that there is no effect or no relationship. A test tries to find evidence against it. If the evidence is strong, we reject the null.' },
        ],
      },
      {
        heading: 'How the test works, step by step',
        blocks: [
          { p: 'There are two flavours of chi-square test. They use the same formula and differ only in how you work out the expected counts.' },
          { bullets: [
            '**Goodness of fit**: one categorical variable compared against a claimed pattern. Is the die fair? Do website visits split across weekdays the way the marketing team assumed?',
            '**Test of independence**: two categorical variables in a table. Is churn related to plan type? Are defects related to shift?',
          ] },
          { term: 'Contingency table', def: 'A table of counts with one categorical variable down the rows and another across the columns, for example plan type by churned/stayed. Each cell counts the items that have both labels.' },
          { term: 'Independent', def: 'Two variables are independent if knowing one tells you nothing about the other. If churn is independent of plan, every plan has the same churn rate.' },
          { diagram: { kind: 'flow', nodes: ['**State the null**: no relationship / claimed pattern holds', '**Compute expected counts** for every cell', '**Add up** (O − E)² ÷ E across all cells', '**Find df** and look up the p-value', '**Decide** and measure the size of the effect'], caption: 'The chi-square procedure. Steps 2 and 3 are the heart of it; step 5 reminds you that "significant" is not the same as "important".' } },
          { p: '**Expected counts for independence.** If plan and churn were unrelated, every plan would churn at the overall rate. So the expected count for a cell is its row total times its column total, divided by the grand total. This is just "overall rate × group size" written compactly.' },
          { p: '**Degrees of freedom** tell the test which reference curve to use. For goodness of fit with k categories, df = k − 1. For a table with r rows and c columns, df = (r − 1) × (c − 1).' },
          { term: 'Degrees of freedom (df)', def: 'The number of counts that are free to vary once the totals are fixed. If six die faces must add up to 60, you can choose five freely and the sixth is forced, so df = 5.' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { tex: '\\chi^2 = \\sum_{\\text{cells}} \\frac{(O - E)^2}{E}', plain: 'For every cell, take the gap between observed and expected, square it, divide by the expected count, then add all cells together.', symbols: [['\\chi^2', 'the chi-square statistic, our surprise score'], ['O', 'observed count in a cell'], ['E', 'expected count in that cell if the null were true']] },
          { p: 'Why each piece is there: the **gap** (O − E) measures surprise. **Squaring** stops positive and negative gaps from cancelling out (too many sixes and too few ones are both evidence of a loaded die). **Dividing by E** scales each gap by what was expected, so a gap of 10 counts for more in a small cell than in a big one.' },
          { tex: 'E_{ij} = \\frac{(\\text{row } i \\text{ total}) \\times (\\text{column } j \\text{ total})}{\\text{grand total}}', plain: 'The expected count in row i and column j, assuming the two variables are unrelated.' },
          { p: 'If the null is true, the χ² score follows a known shape called the **chi-square distribution**. Its shape depends only on the degrees of freedom. The p-value is the area of that curve beyond your score: the probability of a score at least this big if nothing were going on.' },
          { term: 'p-value', def: 'If the null hypothesis were true, the probability of getting data at least as surprising as yours. A small p-value (commonly below 0.05) means your data would be rare under the null, so you doubt the null.' },
          { diagram: { kind: 'curve', fn: 'Math.pow(x,1.5)*Math.exp(-x/2)/7.5199', xMin: 0, xMax: 20, shade: [11.07, 20], marks: [{ x: 11.07, label: '5% cut-off 11.07' }, { x: 13.4, label: 'die: 13.4' }], xLabel: 'χ² value (df = 5)', yLabel: 'density', caption: 'The chi-square curve for 5 degrees of freedom. Most fair dice give scores between about 1 and 10. Only 5% of fair dice score above 11.07 (shaded). Our die scored 13.4, inside the rare zone.' } },
          { tex: 'V = \\sqrt{\\frac{\\chi^2}{n\\,(\\min(r, c) - 1)}}', plain: 'Cramér\'s V rescales χ² to lie between 0 (no association) and 1 (perfect association), so you can judge how strong a relationship is, not just whether it exists.', symbols: [['n', 'total number of items'], ['r, c', 'number of rows and columns']] },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Is the die loaded? (goodness of fit)', setup: '60 rolls. Observed counts for faces 1 to 6: 5, 8, 9, 8, 10, 20. Null: the die is fair, so each face is expected 60 ÷ 6 = 10 times.', steps: [
            'Gaps (O − E): −5, −2, −1, −2, 0, +10.',
            'Squared gaps: 25, 4, 1, 4, 0, 100.',
            'Divide each by E = 10: 2.5, 0.4, 0.1, 0.4, 0, 10.0.',
            'Add them: χ² = 2.5 + 0.4 + 0.1 + 0.4 + 0 + 10.0 = 13.4.',
            'Degrees of freedom = 6 − 1 = 5. The 5% cut-off for df = 5 is 11.07. 13.4 is beyond it.',
            'Exact p-value (from `scipy.stats.chisquare`) = 0.020.',
          ], result: 'Reject "fair die" at the 5% level. Notice that face 6 alone contributes 10.0 of the 13.4: the test result is driven almost entirely by the sixes.' } },
          { example: { title: 'Is churn related to plan type? (independence, business case, illustrative)', setup: 'A telecom provider follows 600 new customers for a year. Basic: 200 customers, 60 churned. Standard: 300 customers, 60 churned. Premium: 100 customers, 10 churned. Churn rates: 30%, 20%, 10%.', steps: [
            'Overall churn = 130 ÷ 600 = 21.67%. Under the null, every plan churns at 21.67%.',
            'Expected churners: Basic 200 × 130 ÷ 600 = 43.33; Standard 300 × 130 ÷ 600 = 65.00; Premium 100 × 130 ÷ 600 = 21.67. Expected stayers are the group sizes minus these: 156.67, 235.00, 78.33.',
            'Contributions (O − E)² ÷ E: Basic churned (60 − 43.33)² ÷ 43.33 = 6.41; Basic stayed 1.77; Standard churned 0.38; Standard stayed 0.11; Premium churned 6.28; Premium stayed 1.74.',
            'χ² = 6.41 + 1.77 + 0.38 + 0.11 + 6.28 + 1.74 = 16.69.',
            'df = (3 − 1) × (2 − 1) = 2. The 5% cut-off for df = 2 is 5.99. p = 0.00024.',
            'Cramér\'s V = √(16.69 ÷ (600 × 1)) = 0.17, a modest but real association.',
          ], result: 'Churn clearly depends on plan. The biggest contributions come from Basic (too many churners) and Premium (too few), which tells the retention team where to look.' } },
          { diagram: { kind: 'table', head: ['Plan', 'Churned (O)', 'Churned (E)', 'Stayed (O)', 'Stayed (E)', 'Contribution'], rows: [['Basic', '60', '43.33', '140', '156.67', '8.18'], ['Standard', '60', '65.00', '240', '235.00', '0.49'], ['Premium', '10', '21.67', '90', '78.33', '8.02'], ['Total', '130', '130', '470', '470', 'χ² = 16.69']], caption: 'Observed versus expected for the churn example. Standard behaves almost exactly as expected; the surprise lives in the Basic and Premium rows.' } },
          { example: { title: 'Defects by shift in a component plant (illustrative)', setup: 'An automotive supplier inspects 400 brake brackets from each shift. Defective: morning 12, evening 15, night 33. Total defects 60 out of 1,200 (5%).', steps: [
            'Expected defects per shift = 400 × 60 ÷ 1,200 = 20. Expected good parts = 380.',
            'Defect cells: morning (12 − 20)² ÷ 20 = 3.20; evening (15 − 20)² ÷ 20 = 1.25; night (33 − 20)² ÷ 20 = 8.45.',
            'Good-part cells: 64 ÷ 380 = 0.17; 25 ÷ 380 = 0.07; 169 ÷ 380 = 0.44.',
            'χ² = 3.20 + 1.25 + 8.45 + 0.17 + 0.07 + 0.44 = 13.58. df = 2, p = 0.0011.',
          ], result: 'Defect rates differ by shift, and the night shift is the main source of the difference. The next step is a root-cause visit (lighting, fatigue, a worn tool), not more statistics.' } },
        ],
      },
      {
        heading: 'Assumptions and how to check them',
        blocks: [
          { bullets: [
            '**Use raw counts, never percentages.** "30% vs 20%" could be 3 of 10 vs 2 of 10 or 3,000 of 10,000 vs 2,000 of 10,000. The test needs the counts to know how much evidence you have.',
            '**Each item counted once.** A customer cannot appear in two cells. Repeated measurements of the same person break the test (use McNemar\'s test for before/after pairs).',
            '**Expected counts at least 5** in (almost) every cell. With smaller expected counts the chi-square curve is a poor approximation. Merge sparse categories or use **Fisher\'s exact test**.',
            '**Independent observations.** Items should not influence each other. Parts from the same faulty batch are not independent.',
          ] },
          { callout: 'For 2 × 2 tables, `scipy.stats.chi2_contingency` applies **Yates\' continuity correction** by default, which makes the test slightly more cautious. Pass `correction=False` if you want the textbook formula you computed by hand.', tone: 'tip' },
          { think: { q: 'A colleague reports χ² = 9.9, p = 0.002 comparing click rates of 10.3% and 10.0% with 200,000 users per group. Should the marketing team celebrate?', a: 'Probably not. The result is statistically significant because the sample is enormous, but Cramér\'s V is about 0.005, almost zero. A 0.3-point difference may or may not matter commercially; that is a business question. Always report the size of the effect next to the p-value.' } },
        ],
      },
      {
        heading: 'Chi-square in the real world',
        blocks: [
          { case: { title: 'Survey analysis at a consumer brand (illustrative)', story: 'A consumer-goods company surveys 2,000 shoppers across four regions on whether they prefer a new pack design. Region-by-preference counts go into a 4 × 2 contingency table. The chi-square test gives p < 0.001, and the cell contributions show the South region prefers the old design far more than expected. Instead of one national launch, the brand team runs a regional test in the South first. The statistic did not make the decision; it pointed the team at the cell that deserved attention.' } },
          { bullets: [
            '**Quality control:** defects by machine, shift, supplier or raw-material batch.',
            '**Marketing:** response rate by channel, or conversion by device type.',
            '**HR analytics:** attrition by department, or promotion rate by office.',
            '**Feature screening in ML:** `sklearn.feature_selection.chi2` ranks categorical (or count) features by how strongly they relate to the target.',
            '**Checking randomisation in A/B tests:** a goodness-of-fit test confirms that a planned 50/50 split really came out close to 50/50.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Significant does not mean strong.** With large samples, trivial associations become significant. Report Cramér\'s V or the actual rate differences.',
            '**It does not say which cells differ.** Look at the cell contributions or standardised residuals to find where the surprise is.',
            '**Association is not causation.** Basic customers may churn more because they are price-sensitive people, not because of the plan itself.',
            '**Ordered categories lose information.** If categories have a natural order (low, medium, high), a trend test or ordinal model uses that order; chi-square ignores it.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'Use chi-square when…', items: ['Both variables are categorical', 'You have raw counts', 'Expected counts are 5 or more', 'Each item appears in exactly one cell', 'You want a quick test of "is there any relationship?"'] }, right: { title: 'Use something else when…', items: ['Expected counts are tiny → **Fisher\'s exact test**', 'Same people measured twice → **McNemar\'s test**', 'Outcome is a measurement → **t-test or ANOVA**', 'You want effects of several factors at once → **logistic regression**', 'Categories are ordered → **trend test / ordinal regression**'] }, caption: 'Chi-square is the workhorse for count tables, but each limitation has a well-known replacement.' } },
        ],
      },
    ],
    faq: [
      { q: 'What is the difference between goodness of fit and the test of independence?', a: 'Goodness of fit compares one variable with a claimed pattern (a fair die). Independence compares two variables in a table (plan type versus churn). The formula is the same; only the expected counts are calculated differently.' },
      { q: 'Can I use percentages in a chi-square test?', a: 'No. Always use raw counts. Percentages hide how many items you observed, and the amount of evidence depends on that.' },
      { q: 'My table has some expected counts below 5. What now?', a: 'Merge small categories if that makes business sense, or use Fisher\'s exact test, which does not rely on the approximation. `scipy.stats.fisher_exact` handles 2 × 2 tables.' },
      { q: 'Does a significant result tell me which group is different?', a: 'No. It says the table as a whole departs from "no relationship". Look at the individual (O − E)² ÷ E contributions, or standardised residuals, to see which cells drive it.' },
      { q: 'Is chi-square a one-tailed or two-tailed test?', a: 'The statistic only grows with any departure from the null, so you always look at the upper tail of the curve. It detects differences in any direction.' },
      { q: 'How do I run it in Python?', a: 'For goodness of fit, `scipy.stats.chisquare(observed, expected)`. For a table, `chi2, p, dof, expected = scipy.stats.chi2_contingency(table)`. In pandas, `pd.crosstab(df.plan, df.churned)` builds the table for you.' },
    ],
  },

  anova: {
    minutes: 15,
    hook: 'A sales director is testing three new call scripts with her team, and the averages come back as 20, 23 and 29 sales a week. Is script C really better, or did it happen to land the best agents? With two scripts she could run a t-test. With three, four or ten options she needs a referee who can judge the whole tournament at once without being fooled by luck. That referee is **ANOVA**, the analysis of variance.',
    sections: [
      {
        heading: 'The problem: comparing more than two groups',
        blocks: [
          { p: 'Businesses constantly compare several options: three suppliers, four ad creatives, five machine settings, six store layouts. The question is always the same: **do the averages really differ, or are the differences just noise?**' },
          { p: 'The obvious approach is to run a t-test on every pair. With 3 groups that is 3 tests; with 5 groups, 10 tests; with 10 groups, 45 tests. The trouble is that every test has a small chance of a false alarm, and those chances pile up.' },
          { term: 'False positive (Type I error)', def: 'Declaring a difference when none really exists. With the usual 5% threshold, each test has a 5% chance of this when the groups are truly identical.' },
          { p: 'If each of 10 tests has a 5% false-alarm rate, the chance that at least one of them fires by luck is 1 − 0.95¹⁰ ≈ 40%. With 45 tests it is about 90%. Run enough pairwise tests and you will almost certainly "discover" a winner that does not exist.' },
          { diagram: { kind: 'bars', labels: ['3 groups (3 tests)', '5 groups (10 tests)', '10 groups (45 tests)'], values: [14, 40, 90], highlight: 2, yLabel: 'chance of ≥1 false alarm (%)', caption: 'The risk of at least one false positive when every pair is tested at 5% and all groups are actually identical. It climbs from 14% to 90%. ANOVA asks one question first and keeps the risk at 5%.' } },
          { term: 'ANOVA (analysis of variance)', def: 'A test of whether the averages of three or more groups are all equal. Despite the name, it compares means; it does so by comparing two kinds of variation.' },
        ],
      },
      {
        heading: 'Building the intuition: signal versus noise in a classroom',
        blocks: [
          { p: 'Picture three school classes that sat the same exam. Class A averaged 60, class B 62 and class C 75. Did class C have a better teacher?' },
          { steps: [
            '**Look at how far apart the class averages are.** 60, 62 and 75 are fairly spread out. This is the **between-group** variation: the signal.',
            '**Now look inside each class.** If marks inside every class range from 20 to 100, a few points between averages are tiny compared with how much students differ. This is the **within-group** variation: the noise.',
            '**Compare the two.** If class averages differ a lot while students inside each class are tightly bunched, the classes are clearly different. If students vary wildly, differences in averages could easily be luck in who ended up in which class.',
            '**Make one ratio: signal ÷ noise.** That ratio is the F-statistic.',
          ], title: 'How to judge whether classes differ' },
          { p: 'The key insight is that **you cannot judge a gap between averages on its own**. A 5-point gap is huge if everyone in each group scores within 1 point of their average, and meaningless if individuals swing by 30 points.' },
          { think: { q: 'Two experiments both show group averages of 20, 23 and 29. In experiment 1, individuals in each group vary by about ±2. In experiment 2, they vary by about ±15. Which one gives stronger evidence of real differences?', a: 'Experiment 1. The between-group spread is the same, but the within-group noise is far smaller, so the signal-to-noise ratio (F) is much larger. The same averages can be convincing or meaningless depending on the noise.' } },
          { callout: 'ANOVA is "analysis of variance" because it splits the total variation in the data into two parts: the part explained by which group you are in, and the leftover part caused by individual differences.', tone: 'key' },
        ],
      },
      {
        heading: 'How ANOVA works, step by step',
        blocks: [
          { diagram: { kind: 'flow', nodes: ['**Compute each group mean** and the grand mean', '**Between-group** spread: how far group means sit from the grand mean', '**Within-group** spread: how far individuals sit from their own group mean', '**F = between ÷ within** (each per degree of freedom)', '**p-value**; if small, run a **post-hoc test**'], caption: 'The one-way ANOVA pipeline. ANOVA answers "is anything different?"; the post-hoc test answers "what exactly?"' } },
          { p: '**Step 1.** Compute the mean of each group and the **grand mean**, the average of all observations together.' },
          { term: 'Grand mean', def: 'The average of every observation in the study, ignoring which group it came from.' },
          { p: '**Step 2. Between-group sum of squares (SSB).** For each group, square the gap between its mean and the grand mean, multiply by the group size, and add up. Big when group means are spread out.' },
          { p: '**Step 3. Within-group sum of squares (SSW).** For each individual, square the gap from its own group mean, and add up across everyone. Big when individuals are noisy.' },
          { term: 'Sum of squares', def: 'Add up squared gaps from an average. It is the raw material for measuring spread, the same building block used in variance.' },
          { p: '**Step 4.** Turn each sum of squares into an average by dividing by its degrees of freedom: these are called **mean squares**. Then F = mean square between ÷ mean square within.' },
          { p: '**Step 5.** Compare F with the F-distribution to get a p-value. If p is small, at least one group mean differs. Then run a post-hoc test such as **Tukey HSD** to find which pairs differ, with the false-alarm risk kept under control.' },
          { term: 'Post-hoc test', def: 'A follow-up test run after a significant ANOVA to compare specific pairs of groups, adjusted so that the overall false-positive rate stays at 5%. Tukey\'s HSD (honestly significant difference) is the most common.' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { tex: 'SS_B = \\sum_{j=1}^{k} n_j\\,(\\bar{x}_j - \\bar{x})^2', plain: 'For each group, how far its mean sits from the grand mean, squared, weighted by how many observations the group has.', symbols: [['k', 'number of groups'], ['n_j', 'size of group j'], ['\\bar{x}_j', 'mean of group j'], ['\\bar{x}', 'grand mean']] },
          { tex: 'SS_W = \\sum_{j=1}^{k} \\sum_{i \\in j} (x_i - \\bar{x}_j)^2', plain: 'For every individual, how far it sits from its own group mean, squared and added up.' },
          { p: 'A neat fact: SSB + SSW equals the total sum of squares around the grand mean. Every bit of variation is either "explained by group" or "left over".' },
          { tex: 'F = \\frac{SS_B / (k-1)}{SS_W / (N-k)} = \\frac{MS_B}{MS_W}', plain: 'Average between-group variation divided by average within-group variation. If the groups are truly the same, both estimate the same noise and F is about 1. Real differences push F up.', symbols: [['N', 'total number of observations'], ['k-1', 'between-group degrees of freedom'], ['N-k', 'within-group degrees of freedom'], ['MS', 'mean square, a sum of squares divided by its df']] },
          { p: 'Why divide by degrees of freedom? Because sums of squares grow simply by having more terms. Dividing turns them into fair averages that can be compared.' },
          { diagram: { kind: 'curve', fn: 'Math.pow(1+x/3,-4)', xMin: 0, xMax: 18, shade: [5.14, 18], marks: [{ x: 5.14, label: '5% cut-off 5.14' }, { x: 15.75, label: 'scripts: 15.75' }], xLabel: 'F value (df 2 and 6)', yLabel: 'density', caption: 'The F-distribution for 3 groups of 3. If the scripts made no difference, F would usually be near 1 and exceed 5.14 only 5% of the time. Our F of 15.75 sits far out in the tail.' } },
          { tex: '\\eta^2 = \\frac{SS_B}{SS_B + SS_W}', plain: 'Eta-squared: the share of total variation explained by group membership. It is the effect size that goes with ANOVA.' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Three call scripts (business case, illustrative)', setup: 'Weekly sales for three agents on each script. Script A: 18, 20, 22. Script B: 21, 23, 25. Script C: 27, 29, 31.', steps: [
            'Group means: A = 20, B = 23, C = 29. Grand mean = (60 + 69 + 87) ÷ 9 = 216 ÷ 9 = 24.',
            'SSB = 3 × (20 − 24)² + 3 × (23 − 24)² + 3 × (29 − 24)² = 3 × 16 + 3 × 1 + 3 × 25 = 126.',
            'SSW: each group has gaps −2, 0, +2 from its mean, so each contributes 4 + 0 + 4 = 8. SSW = 3 × 8 = 24.',
            'df between = 3 − 1 = 2; df within = 9 − 3 = 6.',
            'MSB = 126 ÷ 2 = 63. MSW = 24 ÷ 6 = 4. F = 63 ÷ 4 = 15.75.',
            'p-value (`scipy.stats.f_oneway`) = 0.0041. η² = 126 ÷ 150 = 0.84: script explains 84% of the variation.',
          ], result: 'Strong evidence that the scripts differ. But which ones? That needs the post-hoc test below.' } },
          { example: { title: 'Following up with Tukey HSD', setup: 'Same data. Tukey compares every pair while keeping the overall false-alarm risk at 5%.', steps: [
            'The Tukey yardstick here is about 5.0 sales: any pair of means further apart than that is significant.',
            'C − A = 9 → significant (adjusted p = 0.004).',
            'C − B = 6 → significant (adjusted p = 0.024).',
            'B − A = 3 → not significant (adjusted p = 0.24).',
          ], result: 'Script C beats both others. A and B cannot be told apart with this much data. Roll out C; do not waste time choosing between A and B.' } },
          { diagram: { kind: 'scatter', xLabel: 'script (1 = A, 2 = B, 3 = C)', yLabel: 'weekly sales', caption: 'Each dot is one agent. The groups barely overlap and the spread inside each group (±2) is small compared with the gaps between them. That picture is what a large F looks like.', points: [[1, 18, 0], [1, 20, 0], [1, 22, 0], [2, 21, 1], [2, 23, 1], [2, 25, 1], [3, 27, 2], [3, 29, 2], [3, 31, 2]], centers: [[1, 20], [2, 23], [3, 29]] } },
          { example: { title: 'Three steel suppliers: no real difference', setup: 'Tensile strength scores (in arbitrary units) of five sample bars from each supplier. X: 52, 48, 50, 55, 45. Y: 51, 47, 53, 49, 55. Z: 54, 50, 46, 52, 48.', steps: [
            'Means: X = 50, Y = 51, Z = 50. Grand mean = 755 ÷ 15 = 50.33.',
            'SSB = 5 × (0.33² + 0.67² + 0.33²) = 3.33. Tiny: the means are almost identical.',
            'SSW = 58 + 40 + 40 = 138. Individual bars vary a lot.',
            'F = (3.33 ÷ 2) ÷ (138 ÷ 12) = 1.67 ÷ 11.5 = 0.145. p = 0.87.',
          ], result: 'No evidence that suppliers differ in strength. Procurement can choose on price and delivery reliability instead. Note F is below 1: the between-group spread is even smaller than noise would typically produce.' } },
        ],
      },
      {
        heading: 'Assumptions and variants',
        blocks: [
          { bullets: [
            '**Independent observations.** Each agent, bar or customer is measured once and does not influence others.',
            '**Roughly normal data within each group,** or large enough groups (about 20 or more each) for this to matter little.',
            '**Similar spreads across groups.** Check with a box plot or Levene\'s test (`scipy.stats.levene`). If spreads differ a lot, use **Welch\'s ANOVA**, which does not assume equal variances.',
          ] },
          { diagram: { kind: 'table', head: ['Situation', 'Use'], rows: [['3+ groups, one factor', 'One-way ANOVA'], ['Unequal spreads across groups', 'Welch\'s ANOVA'], ['Two factors (script and region)', 'Two-way ANOVA'], ['Same people measured several times', 'Repeated-measures ANOVA'], ['Skewed data or ranks', 'Kruskal–Wallis test'], ['Only two groups', 't-test (F = t²)']], caption: 'The ANOVA family. Pick the variant that matches how your data was collected.' } },
          { callout: 'With exactly two groups, one-way ANOVA and the equal-variance t-test give the same p-value: F equals t squared. ANOVA is the natural generalisation of the t-test.', tone: 'tip' },
        ],
      },
      {
        heading: 'ANOVA in the real world',
        blocks: [
          { case: { title: 'Process tuning in manufacturing (illustrative)', story: 'A plastics moulding plant tests four barrel temperatures, running 12 parts at each, and measures shrinkage. One-way ANOVA gives p < 0.01, and Tukey HSD shows the two hottest settings shrink significantly less than the two coolest, with no difference within each pair. Engineers pick the cooler of the two good settings to save energy. This style of experiment, often extended to two-way ANOVA for temperature and pressure together, is the core of **design of experiments (DoE)** in quality programmes such as Six Sigma.' } },
          { bullets: [
            '**Marketing:** compare average order value across four campaign creatives.',
            '**Retail:** compare weekly sales across store layouts, with region as a second factor.',
            '**Agriculture and pharma:** the method was developed by Ronald Fisher for crop trials, and remains standard in clinical and field experiments.',
            '**Regression link:** ANOVA is linear regression with dummy variables for groups; statsmodels prints an ANOVA table for any fitted linear model.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Stopping at "significant".** ANOVA only says some group differs. Always follow up with a post-hoc test.',
            '**Running post-hoc tests after a non-significant ANOVA** to fish for a difference. That defeats the purpose.',
            '**Ignoring effect size.** With thousands of observations, trivial differences become significant. Report η² and the actual mean differences.',
            '**Non-random groups.** If the best agents chose script C, ANOVA cannot separate the script from the agents. Randomise who gets what.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'Many pairwise t-tests', items: ['Simple to explain', 'False-alarm risk grows with every pair', '10 groups → 45 tests → ~90% chance of a fluke', 'No overall answer'] }, right: { title: 'ANOVA + Tukey HSD', items: ['One overall test at 5%', 'Then pairwise comparisons, adjusted', 'Uses all groups to estimate noise, so more power', 'Standard in experiments and reports'] }, caption: 'Why analysts use ANOVA instead of a pile of t-tests.' } },
        ],
      },
    ],
    faq: [
      { q: 'Why is it called analysis of variance if it compares means?', a: 'Because it decides whether means differ by comparing two variances: the spread of the group means and the spread inside the groups.' },
      { q: 'What does an F of about 1 mean?', a: 'The group means are about as spread out as random noise would make them. There is no evidence of a real difference.' },
      { q: 'Can I use ANOVA with only two groups?', a: 'Yes. It gives the same answer as an equal-variance t-test, with F equal to t squared. Most people just use the t-test.' },
      { q: 'My ANOVA is significant. Which group is best?', a: 'ANOVA does not say. Run Tukey HSD (`scipy.stats.tukey_hsd` or statsmodels `pairwise_tukeyhsd`) to compare pairs with proper adjustment.' },
      { q: 'What if my data is heavily skewed, such as revenue per customer?', a: 'Try a log transform, use Welch\'s ANOVA if spreads differ, or switch to the Kruskal–Wallis test, which works on ranks.' },
      { q: 'Do the groups need to be the same size?', a: 'No, one-way ANOVA handles unequal sizes. Balanced groups make the test more robust to unequal variances, so aim for similar sizes when you design the study.' },
    ],
  },
  correlation: {
    minutes: 15,
    hook: 'Every summer, ice-cream sales and drowning accidents rise together. Put the two on a chart and they look tightly linked. Nobody sensible believes ice cream causes drowning; hot weather drives both. Business decks are full of the same trap: "stores with more staff sell more", "customers who use the app spend more". **Correlation** measures how strongly two numbers move together. This chapter teaches you to compute it, read it, and not be fooled by it.',
    sections: [
      {
        heading: 'The problem: do these two things move together?',
        blocks: [
          { p: 'Managers constantly ask whether two quantities are related. Does advertising spend go with sales? Does machine temperature go with defect rate? Does delivery time go with customer ratings? Before building any model, you want a quick, single number that says how strongly two variables travel together and in which direction.' },
          { p: 'That number is the **correlation coefficient**. It is one of the most used and most abused statistics in business. Used well, it is a fast first look at which drivers deserve attention. Used badly, it produces confident claims about causes that the data never supported.' },
          { term: 'Variable', def: 'Any quantity you measure that can change from one item to the next: monthly sales, price, temperature, age.' },
          { term: 'Correlation coefficient (r)', def: 'A number between −1 and +1 that measures how closely two variables follow a straight-line relationship. +1 is a perfect rising line, −1 a perfect falling line, 0 no straight-line pattern at all.' },
          { diagram: { kind: 'scatter', xLabel: 'ad spend (₹ lakh)', yLabel: 'sales (₹ lakh)', caption: 'Five months of ad spend and sales. The points climb together, close to a straight line. The correlation is r = 0.95, which we will calculate by hand later.', points: [[1, 10], [2, 14], [3, 13], [4, 18], [5, 20]], line: { m: 2.4, b: 7.8 } } },
        ],
      },
      {
        heading: 'Building the intuition: the dance partners',
        blocks: [
          { p: 'Imagine watching two dancers on a stage. You do not care where they stand on average; you care whether they **move together**.' },
          { steps: [
            '**Mark the centre of the stage for each dancer**: their average position.',
            '**Each moment, ask: is dancer X to the right of her centre or the left? Is dancer Y?**',
            '**If both are on the same side at the same time**, they are moving together. Score a plus.',
            '**If they are on opposite sides**, they are moving against each other. Score a minus.',
            '**Add up the scores over the whole dance.** Mostly pluses means they move together; mostly minuses means they mirror each other; a mix means no pattern.',
          ], title: 'Scoring how two dancers move' },
          { p: 'That running total is **covariance**. It has one annoying flaw: its size depends on the units. Measure the stage in centimetres instead of metres and the number grows a hundredfold, even though the dance is identical. Correlation fixes this by dividing out each dancer\'s typical range of movement, so the answer always lands between −1 and +1.' },
          { term: 'Covariance', def: 'The average of (how far x is from its mean) × (how far y is from its mean). Positive when the two tend to be above or below average together; negative when one is high while the other is low. Its size depends on the units.' },
          { think: { q: 'You convert sales from ₹ lakh to rupees (multiply by 1,00,000). What happens to the covariance and to the correlation?', a: 'The covariance is multiplied by 1,00,000, because every y-deviation is. The correlation does not change at all, because it divides by the standard deviation of y, which grows by the same factor. That is exactly why we prefer correlation for describing strength.' } },
        ],
      },
      {
        heading: 'How to compute it, step by step',
        blocks: [
          { diagram: { kind: 'flow', nodes: ['**Plot** the scatter first', 'Subtract each **mean**: get deviations', '**Multiply** paired deviations and add: covariance', '**Divide** by both standard deviations: r', '**Interpret** strength, direction and causes'], caption: 'Computing Pearson\'s r. The first box matters most: a picture catches problems a single number hides.' } },
          { steps: [
            'Draw a scatter plot. Check the pattern looks roughly like a straight line and look for odd points.',
            'Compute the mean of x and the mean of y.',
            'For each pair, compute the deviations (x − mean of x) and (y − mean of y) and multiply them.',
            'Add the products and divide by n − 1. That is the sample covariance.',
            'Divide the covariance by (standard deviation of x × standard deviation of y). That is r.',
          ] },
          { term: 'Standard deviation', def: 'The typical distance of values from their average. Small means values are bunched together; large means they are spread out.' },
          { p: 'In pandas the whole thing is one line: `df[["spend", "sales"]].corr()`. In scipy, `scipy.stats.pearsonr(x, y)` also returns a p-value testing whether the true correlation could be zero.' },
          { p: 'There is a second, very useful kind of correlation. **Spearman\'s rank correlation** first replaces each value by its rank (1st, 2nd, 3rd…) and then computes Pearson\'s r on the ranks. It asks a looser question: "when x goes up, does y tend to go up?", without needing a straight line.' },
          { term: 'Spearman\'s rank correlation (ρ)', def: 'Correlation computed on ranks instead of raw values. It measures any consistently rising or falling (monotonic) relationship and is far less affected by extreme values.' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { tex: '\\operatorname{Cov}(x, y) = \\frac{1}{n-1} \\sum_{i=1}^{n} (x_i - \\bar{x})(y_i - \\bar{y})', plain: 'Average the products of paired deviations. Pairs on the same side of their means add; pairs on opposite sides subtract.', symbols: [['x_i, y_i', 'the i-th pair of values'], ['\\bar{x}, \\bar{y}', 'the two means'], ['n', 'number of pairs']] },
          { p: 'Why n − 1 rather than n? Because we measure deviations from the sample mean, which is itself fitted to the data, the deviations are slightly too small on average. Dividing by n − 1 corrects for that. For correlation it does not matter, because the same factor appears top and bottom and cancels.' },
          { tex: 'r = \\frac{\\operatorname{Cov}(x, y)}{s_x \\, s_y}', plain: 'Covariance divided by both standard deviations. This removes the units and squeezes the answer between −1 and +1.', symbols: [['s_x, s_y', 'sample standard deviations of x and y']] },
          { tex: 'r^2 = \\text{share of the variation in } y \\text{ explained by a straight line in } x', plain: 'Squaring r gives the fraction of y\'s ups and downs that a straight-line fit on x accounts for. r = 0.95 gives r² = 0.90, or 90%.' },
          { p: 'A rough guide many analysts use: |r| below 0.3 is weak, 0.3 to 0.7 moderate, above 0.7 strong. These are conventions, not laws. In noisy fields such as marketing, r = 0.3 can be valuable; in physics, r = 0.9 might signal a problem with the instrument.' },
          { diagram: { kind: 'bars', labels: ['−1.0', '−0.7', '−0.3', '0', '+0.3', '+0.7', '+1.0'], values: [100, 49, 9, 0, 9, 49, 100], highlight: 5, yLabel: 'r² (% of variation explained)', caption: 'The same r values expressed as r². A "moderate" r of 0.3 explains only 9% of the variation, while r = 0.7 explains about half. Strength grows much faster near the ends of the scale.' } },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Ad spend and sales by hand (business case, illustrative)', setup: 'Five months for a regional FMCG distributor. Ad spend (₹ lakh): 1, 2, 3, 4, 5. Sales (₹ lakh): 10, 14, 13, 18, 20.', steps: [
            'Means: spend = 15 ÷ 5 = 3; sales = 75 ÷ 5 = 15.',
            'Spend deviations: −2, −1, 0, 1, 2. Sales deviations: −5, −1, −2, 3, 5.',
            'Products: 10, 1, 0, 3, 10. Sum = 24. Covariance = 24 ÷ 4 = 6.',
            'Squared spend deviations sum to 10, so s(spend) = √(10 ÷ 4) = 1.58. Squared sales deviations sum to 64, so s(sales) = √(64 ÷ 4) = 4.',
            'r = 6 ÷ (1.58 × 4) = 0.95. r² = 0.90.',
            'With only five points, `pearsonr` gives p = 0.014: unlikely to be pure chance.',
          ], result: 'A strong positive relationship. Every extra ₹1 lakh of spend comes with about ₹2.4 lakh more sales on the fitted line. But this does not prove the ads caused the sales (see the case below).' } },
          { example: { title: 'One typo destroys Pearson, not Spearman', setup: 'Eight stores: daily footfall (hundreds) 10, 12, 14, 16, 18, 20, 22, 24 and sales (₹ thousand) 20, 23, 27, 30, 35, 38, 41, 45.', steps: [
            'Clean data: Pearson r = 0.999, Spearman ρ = 1.00. Almost a perfect line.',
            'Now someone types the last store\'s sales as 5 instead of 45.',
            'Pearson r collapses to 0.06: it now reports "no relationship".',
            'Spearman ρ falls to 0.33. Still hurt, but far less, because a wrong value can only move one rank.',
          ], result: 'A single bad point can wipe out Pearson\'s r. Always plot, check for data-entry errors, and compare Pearson with Spearman. A big gap between them is a warning sign.' } },
          { example: { title: 'Zero correlation, perfect relationship', setup: 'x = −2, −1, 0, 1, 2 and y = x², so y = 4, 1, 0, 1, 4.', steps: [
            'Mean of x = 0, mean of y = 2.',
            'Products of deviations: (−2)(2) + (−1)(−1) + (0)(−2) + (1)(−1) + (2)(2) = −4 + 1 + 0 − 1 + 4 = 0.',
            'So the covariance and r are exactly 0.',
          ], result: 'y is completely determined by x, yet r = 0. Correlation only detects straight-line patterns. A U-shape (such as stress versus performance, or price versus profit) is invisible to it.' } },
          { diagram: { kind: 'scatter', xLabel: 'x', yLabel: 'y', caption: 'The U-shape from the third example. The left half falls and the right half rises; the two cancel exactly, giving r = 0. Plot before you trust r.', points: [[-2, 4], [-1.5, 2.25], [-1, 1], [-0.5, 0.25], [0, 0], [0.5, 0.25], [1, 1], [1.5, 2.25], [2, 4]] } },
        ],
      },
      {
        heading: 'Correlation is not causation',
        blocks: [
          { p: 'This is the most important idea in the chapter. When x and y are correlated, there are at least four possible explanations, and only one of them is "x causes y".' },
          { diagram: { kind: 'tree', root: { label: 'x and y are correlated', children: [{ label: 'x causes y', edge: 'possible' }, { label: 'y causes x', edge: 'reverse' }, { label: 'z causes both', edge: 'confounder' }, { label: 'pure coincidence', edge: 'chance' }] }, caption: 'Four explanations for a correlation. Data alone usually cannot tell them apart; an experiment or careful causal reasoning can.' } },
          { term: 'Confounder', def: 'A third variable that influences both x and y, creating a correlation between them even if neither affects the other. Hot weather is the confounder behind ice cream and drownings.' },
          { bullets: [
            '**Reverse causation:** cities with more police have more crime. Police do not cause crime; high crime leads cities to hire more police.',
            '**Confounding:** customers who use the app spend more. Perhaps loyal, high-income customers are the ones who install the app.',
            '**Coincidence:** with enough variables, some will correlate by pure chance. Search through thousands of metrics and you will find "significant" nonsense.',
          ] },
          { callout: 'To claim that x causes y, the gold standard is a randomised experiment (an A/B test). When experiments are impossible, use causal methods such as difference-in-differences, and state your assumptions.', tone: 'warn' },
        ],
      },
      {
        heading: 'In the real world',
        blocks: [
          { case: { title: 'Festival season fools the marketing dashboard (illustrative)', story: 'A consumer-electronics retailer finds r = 0.85 between monthly ad spend and sales over two years, and the marketing team asks for a bigger budget. An analyst notices that the budget is always raised for Diwali and year-end sales, exactly when customers buy anyway. Season is a confounder. The company runs a geo-experiment: ads are increased in half the cities and held flat in the others for the same weeks. The measured lift is real but less than half of what the correlation implied. The budget decision is now based on the experiment.' } },
          { bullets: [
            '**Feature screening:** a correlation matrix (`df.corr()`) shows which inputs relate to the target and which inputs duplicate each other.',
            '**Multicollinearity checks:** highly correlated inputs (r above about 0.9) make regression coefficients unstable.',
            '**Portfolio risk:** finance teams use correlations between asset returns; assets that are weakly correlated reduce overall risk when combined.',
            '**Sensor monitoring:** in a car or a plant, two sensors that normally correlate strongly suddenly drifting apart can signal a fault.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Not plotting.** Very different datasets can share the same r. Always look at the scatter plot.',
            '**Outliers.** One extreme point can create or destroy a correlation. Compare with Spearman.',
            '**Curves.** Pearson misses U-shapes and saturating curves. Use Spearman for monotonic curves, or plot.',
            '**Restricted range.** Correlating test scores with job performance only among hired staff (all high scorers) weakens r artificially.',
            '**Aggregation.** Correlations between averages (by city or month) are usually much stronger than between individuals.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'Pearson r', items: ['Measures straight-line relationships', 'Uses the actual values', 'Sensitive to outliers', 'r² links directly to linear regression', 'Best for roughly linear, clean numeric data'] }, right: { title: 'Spearman ρ', items: ['Measures any rising or falling pattern', 'Uses ranks only', 'Robust to outliers', 'Works for ordinal data such as ratings', 'Best for curves, skewed data or ranked scores'] }, caption: 'Report both when in doubt. If they disagree a lot, the plot will tell you why.' } },
        ],
      },
    ],
    faq: [
      { q: 'What counts as a "strong" correlation?', a: 'A common rule of thumb is |r| above 0.7 strong, 0.3 to 0.7 moderate, below 0.3 weak. But the context matters: in customer behaviour data, 0.3 can be useful.' },
      { q: 'Does r = 0 mean the variables are unrelated?', a: 'No. It means there is no straight-line relationship. There could be a strong curved one, like the U-shape example.' },
      { q: 'What is the difference between covariance and correlation?', a: 'Covariance measures joint movement in the original units, so its size is hard to interpret. Correlation divides by both standard deviations so it always lies between −1 and +1.' },
      { q: 'When should I use Spearman instead of Pearson?', a: 'When the relationship is curved but consistently rising or falling, when there are outliers, or when the data are ranks or ratings such as 1–5 survey scores.' },
      { q: 'Is a significant correlation an important one?', a: 'Not necessarily. With 10,000 rows, even r = 0.03 is statistically significant but explains less than 0.1% of the variation. Look at r and r², not just the p-value.' },
      { q: 'Can correlation ever prove causation?', a: 'On its own, no. A randomised experiment can establish causation; observational data needs causal methods and assumptions you can defend.' },
    ],
  },

  bootstrap: {
    minutes: 14,
    hook: 'Your delivery team has timed 12 orders and the median is 34 minutes. The operations head asks a reasonable question: "How sure are you? Could the true median be 30? Or 45?" For an average there is a textbook formula. For a median, a ratio or a model\'s accuracy, there often is not. In 1979 the statistician Bradley Efron proposed a startlingly simple answer: **reuse the data you already have, thousands of times**. He called it the bootstrap.',
    sections: [
      {
        heading: 'The problem: how uncertain is my number?',
        blocks: [
          { p: 'Every number computed from a sample is a little bit wrong. If you had timed a different 12 orders, the median would have come out slightly different. A responsible analyst reports not just the number but **how much it could plausibly move**.' },
          { term: 'Sampling variability', def: 'The natural wobble in a statistic caused by which items happened to land in your sample. A different sample from the same population gives a different answer.' },
          { term: 'Confidence interval', def: 'A range around your estimate that is built to capture the true value most of the time. A 95% interval method captures the true value in about 95 out of 100 repeated studies.' },
          { p: 'For a mean, statistics offers a neat formula: mean ± about 2 standard errors. But many business metrics have no simple formula: the median delivery time, the 90th percentile of wait time, revenue per visit, the ratio of returns to sales, the accuracy of a churn model. Deriving a formula for each would need a mathematician and a week.' },
          { p: 'The bootstrap replaces the formula with computing power. It works for almost any statistic you can calculate, which is why it is one of the most practical tools in an analyst\'s kit.' },
          { diagram: { kind: 'table', head: ['Statistic', 'Simple formula for its uncertainty?', 'Bootstrap works?'], rows: [['Mean', 'Yes (standard error)', 'Yes'], ['Proportion', 'Yes', 'Yes'], ['Median', 'Not a simple one', 'Yes'], ['90th percentile', 'Not a simple one', 'Yes (with care)'], ['Ratio, e.g. returns ÷ sales', 'Messy', 'Yes'], ['Model accuracy or AUC', 'Messy', 'Yes']], caption: 'Formulas cover only the simplest statistics. The bootstrap uses one recipe for all of them.' } },
        ],
      },
      {
        heading: 'Building the intuition: the photocopied jar',
        blocks: [
          { p: 'Imagine a giant jar holding millions of marbles, each with a delivery time written on it. That jar is the **population**. You were allowed to pull out only 12 marbles: your **sample**. If you could go back to the giant jar again and again, drawing new samples of 12, you would see directly how much the median wobbles. But you cannot; the jar is locked.' },
          { steps: [
            '**Build a small replica jar** from your 12 marbles. Your sample is your best picture of what the big jar contains.',
            '**Draw 12 marbles from the replica, putting each one back after you read it.** Some marbles get drawn twice, some not at all.',
            '**Compute the median of this new handful.** It will differ a bit from 34.',
            '**Repeat thousands of times.** You get thousands of medians.',
            '**Look at how spread out those medians are.** That spread imitates how much the real median would wobble across real samples.',
          ], title: 'The bootstrap as a thought experiment' },
          { term: 'Resampling with replacement', def: 'Drawing items one at a time from your data and putting each back before the next draw, so the same item can be chosen more than once. A resample is the same size as the original data.' },
          { think: { q: 'Why must you put each marble back? What would happen if you drew all 12 without replacement?', a: 'Without replacement you would get exactly the same 12 marbles every time, just in a different order, so the median would never change and you would learn nothing about uncertainty. Replacement is what creates variety between resamples.' } },
          { callout: 'The name comes from the phrase "pulling yourself up by your own bootstraps": the method seems to get something from nothing by reusing the same data. It works because your sample is a reasonable stand-in for the population.', tone: 'key' },
        ],
      },
      {
        heading: 'How the bootstrap works, step by step',
        blocks: [
          { diagram: { kind: 'flow', nodes: ['**Original sample** of size n', '**Resample** n items with replacement', '**Compute the statistic** on the resample', '**Repeat** B times (e.g. 10,000)', '**Use the spread**: SE and percentile interval'], caption: 'The bootstrap loop. It needs no formula, only a way to compute your statistic and a computer to repeat it.' } },
          { steps: [
            'Compute your statistic on the original data (for example, median = 34).',
            'Draw a bootstrap sample: n random picks from the data, with replacement.',
            'Compute the same statistic on that bootstrap sample and store it.',
            'Repeat steps 2 and 3 B times. 1,000 is enough for a standard error; 10,000 is a good default for intervals.',
            'The standard deviation of the B stored values is the **bootstrap standard error**.',
            'The 2.5th and 97.5th percentiles of the stored values form a **95% percentile interval**.',
          ] },
          { term: 'Standard error', def: 'The standard deviation of a statistic across repeated samples: a measure of how much the statistic itself wobbles, as opposed to how much individual data points vary.' },
          { term: 'Percentile', def: 'The value below which a given percentage of observations fall. The 2.5th percentile has 2.5% of values below it.' },
          { p: 'In Python, `scipy.stats.bootstrap((data,), np.median, method="percentile")` does all of this. Its default method, **BCa** (bias-corrected and accelerated), adjusts the percentiles for skew and bias and is usually a little more accurate.' },
        ],
      },
      {
        heading: 'Under the hood: why reusing data works',
        blocks: [
          { p: 'The bootstrap rests on one substitution. We want the distribution of a statistic across samples from the true population F. We cannot sample from F, so we sample from the **empirical distribution** of our data, which gives each of the n observed values probability 1/n.' },
          { term: 'Empirical distribution', def: 'The distribution that treats your sample as the whole population: each observed value is equally likely, with probability 1/n.' },
          { tex: '\\hat{\\theta}^{*}_{b} = s(x^{*}_{b}), \\quad b = 1, \\dots, B', plain: 'Each bootstrap sample x* gives a bootstrap version of the statistic, θ̂*. We collect B of them.', symbols: [['s(\\cdot)', 'the recipe for your statistic, e.g. the median'], ['x^{*}_{b}', 'the b-th bootstrap sample'], ['B', 'number of bootstrap repetitions']] },
          { tex: '\\widehat{SE} = \\sqrt{\\frac{1}{B-1} \\sum_{b=1}^{B} \\left(\\hat{\\theta}^{*}_{b} - \\bar{\\theta}^{*}\\right)^2}', plain: 'The bootstrap standard error is just the ordinary standard deviation of the B bootstrap statistics.', symbols: [['\\bar{\\theta}^{*}', 'the average of the bootstrap statistics']] },
          { tex: '1 - \\left(1 - \\tfrac{1}{n}\\right)^{n} \\approx 1 - e^{-1} \\approx 0.632', plain: 'The chance that a given observation appears at least once in a bootstrap sample. For large n, each resample contains about 63% of the distinct original rows; the remaining 37% are "out of bag".' },
          { p: 'That 63% figure reappears in machine learning: random forests train each tree on a bootstrap sample and use the left-out 37% (the **out-of-bag** rows) as a free test set.' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Three bootstrap samples by hand', setup: 'A tiny dataset of three call durations: 3, 5 and 8 minutes. Mean = 5.33.', steps: [
            'Draw 3 with replacement: 3, 3, 8 → mean 4.67.',
            'Draw again: 5, 8, 8 → mean 7.00.',
            'Draw again: 3, 5, 5 → mean 4.33.',
            'There are 3³ = 27 possible ordered draws; a computer would sample thousands at random.',
          ], result: 'Even three resamples show the mean could plausibly sit anywhere from about 4 to 7. With n = 3 this is far too little data to trust, but the mechanics are exactly the same for 3 or 3 million rows.' } },
          { example: { title: 'Median delivery time (business case, illustrative)', setup: 'A quick-commerce startup times 12 deliveries (minutes): 22, 25, 28, 30, 31, 33, 35, 36, 38, 41, 52, 75. Median = 34; mean = 37.2.', steps: [
            'Draw 10,000 bootstrap samples of size 12 and compute each median.',
            'Bootstrap standard error of the median ≈ 2.9 minutes.',
            '2.5th percentile of the 10,000 medians = 29; 97.5th percentile = 39.5.',
            'For comparison, a bootstrap 95% interval for the mean is about 30.5 to 46.0, and the textbook t-interval is 28.1 to 46.2.',
          ], result: '95% bootstrap interval for the median: about 29 to 39.5 minutes. The mean\'s interval is wider and lopsided upwards because of the 75-minute outlier; the bootstrap captures that skew automatically. Exact numbers vary slightly with the random seed.' } },
          { diagram: { kind: 'bars', labels: ['<29', '29–31', '31–33', '33–35', '35–37', '37–39', '39–41', '41+'], values: [169, 1173, 1837, 2749, 2663, 1029, 203, 177], highlight: 3, yLabel: 'number of bootstrap medians', caption: 'Ten thousand bootstrap medians of the delivery data. Most fall between 29 and 39 minutes, and the middle 95% gives the interval. This histogram is the bootstrap\'s picture of sampling uncertainty.' } },
          { example: { title: 'How sure is the model\'s accuracy?', setup: 'A churn model gets 172 of 200 test customers right: accuracy 86%.', steps: [
            'Resample the 200 test predictions with replacement 10,000 times and recompute accuracy each time.',
            '95% percentile interval ≈ 81.0% to 90.5%.',
            'The normal-approximation formula gives 81.2% to 90.8%: nearly identical, as it should be for a simple proportion.',
          ], result: 'Report "86% (95% CI 81–91%)", not just "86%". If a rival model scores 88% on the same 200 customers, that gap sits well inside the uncertainty, so you would need a paired comparison (or more test data) before declaring a winner.' } },
        ],
      },
      {
        heading: 'Variants and when to use them',
        blocks: [
          { bullets: [
            '**Percentile interval:** simplest; take the 2.5th and 97.5th percentiles. Good for roughly symmetric statistics.',
            '**BCa interval:** corrects for bias and skew; the default in `scipy.stats.bootstrap` and a sensible choice for most work.',
            '**Paired bootstrap:** to compare two models on the same test set, resample rows and recompute the difference in accuracy each time.',
            '**Two-sample bootstrap:** to compare groups (as in an A/B test on revenue), resample each group separately and recompute the difference in medians or means.',
            '**Block bootstrap:** for time series, resample consecutive blocks (such as whole weeks) so that day-to-day dependence is preserved.',
          ] },
          { callout: 'Always resample the unit that was independently sampled. If you sampled stores and measured many transactions per store, resample stores, not transactions. Otherwise your interval will be far too narrow.', tone: 'warn' },
        ],
      },
      {
        heading: 'The bootstrap in the real world',
        blocks: [
          { case: { title: 'Bagging and random forests', story: 'Leo Breiman\'s **bagging** (bootstrap aggregating) trains many models, each on a different bootstrap sample, and averages their predictions. Averaging many slightly different models cancels out much of their individual noise. Random forests, still among the most used models on tabular business data, are bagging applied to decision trees with an extra twist of random feature selection. In scikit-learn, `RandomForestClassifier(bootstrap=True, oob_score=True)` even reports accuracy on the out-of-bag rows without a separate test set.' } },
          { bullets: [
            '**A/B testing on skewed metrics:** revenue per user is dominated by a few big spenders; bootstrapping the difference gives honest intervals.',
            '**Model evaluation:** confidence intervals for accuracy, AUC or RMSE on a test set.',
            '**Finance:** resampling historical returns to estimate the uncertainty of risk measures such as Value at Risk.',
            '**Operations:** intervals for percentile service levels (for example, 90th-percentile delivery time) that contracts often specify.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Tiny samples.** With fewer than about 20 observations, your sample is a poor replica of the population and the intervals are unreliable.',
            '**Extremes.** The bootstrap cannot invent values it has never seen. It works poorly for the maximum, minimum or very extreme percentiles.',
            '**Dependent data.** Ordinary resampling destroys time order and clustering. Use block or cluster bootstrap.',
            '**Biased samples.** If your sample came only from metro customers, the bootstrap faithfully reproduces that bias. It quantifies random error, not bad sampling.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'Formula-based intervals', items: ['Instant to compute', 'Exact under their assumptions', 'Available only for simple statistics', 'Can mislead when data are skewed', 'Easy to explain in a report'] }, right: { title: 'Bootstrap intervals', items: ['Needs thousands of recomputations', 'Few assumptions about the data\'s shape', 'Works for medians, ratios, model scores', 'Captures skew automatically', 'Weak for tiny samples and extremes'] }, caption: 'Use a formula when one exists and its assumptions hold; reach for the bootstrap otherwise.' } },
        ],
      },
    ],
    faq: [
      { q: 'How many bootstrap samples do I need?', a: 'About 1,000 for a standard error and 10,000 for a 95% interval. Computing is cheap, so more is fine; the answer stops changing once B is large.' },
      { q: 'Does the bootstrap give me more data?', a: 'No. It creates no new information. It only uses your existing data to estimate how much your statistic would vary across samples.' },
      { q: 'Why is the resample the same size as the original?', a: 'Because the uncertainty of a statistic depends on sample size. To imitate the wobble of a median of 12 observations, each resample must also have 12.' },
      { q: 'Can I bootstrap with only 10 data points?', a: 'You can run it, but the interval will usually be too narrow and unreliable. Collect more data or use methods designed for small samples.' },
      { q: 'What is the link to random forests?', a: 'Each tree in a random forest is trained on a bootstrap sample of the training rows. Averaging the trees is called bagging, short for bootstrap aggregating.' },
      { q: 'Will I get the same interval every time?', a: 'Not exactly, because resampling is random. Fix the random seed (`random_state` in scipy) for reproducible results; with 10,000 resamples the differences are small.' },
    ],
  },
  'ab-testing': {
    minutes: 15,
    hook: 'An e-commerce team redesigns its checkout button. The week after launch, sales rise 8%, and the designer is a hero. But that week also had a festival sale, a competitor\'s outage and a payday. Did the button do anything? Nobody can say. Companies such as Amazon, Booking.com and Netflix are well known for settling questions like this differently: they show the old and new versions to randomly chosen customers **at the same time** and compare. That is an **A/B test**, and it is how product decisions move from opinion to evidence.',
    sections: [
      {
        heading: 'The problem: before-and-after comparisons lie',
        blocks: [
          { p: 'The most natural way to judge a change is to compare "before" with "after". It is also one of the least reliable. Sales move for dozens of reasons every week: seasons, holidays, prices, marketing, weather, competitors. A before-and-after comparison mixes the effect of your change with all of these.' },
          { p: 'What you really want is a parallel universe: the same customers, the same week, with and without your change. You cannot have that. But you can get very close by splitting customers **at random** into two groups and treating them differently at the same time.' },
          { term: 'A/B test (randomised controlled experiment)', def: 'An experiment where users are randomly assigned to see version A (the current one, called the control) or version B (the change, called the variant), and an outcome is compared between the groups.' },
          { term: 'Randomisation', def: 'Assigning each user to a group by chance, like a coin flip. Because chance decides, the groups end up similar in every respect (age, device, mood, payday) except the change you are testing.' },
          { p: 'Randomisation is the magic ingredient. Festival shoppers, bargain hunters and mobile users all land in both groups in roughly equal shares. So if group B buys more, the only systematic difference left to explain it is the change itself.' },
          { diagram: { kind: 'flow', nodes: ['**All visitors**', '**Random split** 50 / 50', '**A: old checkout** and **B: new checkout**, same days', '**Measure** conversion in each group', '**Compare** with a statistical test'], caption: 'An A/B test. Because the split is random and simultaneous, outside events hit both groups equally and cancel out of the comparison.' } },
        ],
      },
      {
        heading: 'Building the intuition: the twin restaurants',
        blocks: [
          { p: 'Imagine a restaurant owner who wants to know whether a new menu sells more desserts. She owns two identical branches on the same street.' },
          { steps: [
            '**Bad plan:** change the menu in both branches next month and compare with this month. If next month has a cricket final or a heatwave, the comparison is ruined.',
            '**Better plan:** this month, branch 1 keeps the old menu and branch 2 gets the new one. But perhaps branch 2 has a better waiter.',
            '**Best plan:** every arriving guest is handed a menu at random, old or new, by a coin flip. Same evenings, same waiters, same weather.',
            '**After enough guests,** compare the dessert rate between old-menu and new-menu tables.',
            '**Ask whether the gap is bigger than luck** would produce with that many guests.',
          ], title: 'From a bad plan to a fair test' },
          { p: 'The last step matters. Even with two identical menus, the dessert rates will never match exactly, just as two fair coins tossed 100 times rarely give exactly the same number of heads. The statistics tell you whether the gap is real or noise.' },
          { think: { q: 'Why not just let guests choose which menu they want?', a: 'Because the guests who choose the new menu may be different people: more adventurous, or hungrier. Any difference in desserts could come from who chose, not from the menu. Only random assignment removes this self-selection.' } },
          { callout: 'Randomisation turns "these two things happened together" (correlation) into "this change caused that difference" (causation). It is the one tool that reliably makes that leap.', tone: 'key' },
        ],
      },
      {
        heading: 'How to run an A/B test, step by step',
        blocks: [
          { steps: [
            '**Write down the hypothesis.** "The new checkout button increases purchase conversion."',
            '**Choose one primary metric** before you start, such as conversion rate (purchases ÷ visitors). Secondary metrics can be monitored but do not decide the test.',
            '**Choose the minimum detectable effect (MDE):** the smallest lift worth acting on, for example from 4.0% to 4.8%.',
            '**Calculate the sample size** for that MDE, with a 5% significance level and 80% power.',
            '**Randomise** users (not page views) into A and B, and check the split came out as planned.',
            '**Run until the planned sample size is reached,** covering full weeks to include weekday and weekend behaviour.',
            '**Analyse once:** compute the difference, its confidence interval and the p-value. Then decide.',
          ], title: 'The A/B testing playbook' },
          { term: 'Minimum detectable effect (MDE)', def: 'The smallest improvement you care about detecting. Smaller effects need much larger samples, so this is a business decision as much as a statistical one.' },
          { term: 'Statistical power', def: 'The probability that the test detects a real effect of at least the MDE. 80% power means that if the true lift is as big as the MDE, the test will call it significant 8 times out of 10.' },
          { term: 'Significance level (α)', def: 'The false-alarm rate you accept: the chance of declaring a winner when the change actually does nothing. Usually 5%.' },
          { p: 'Why decide all of this in advance? Because every decision made after seeing the data (which metric, when to stop, which segment) gives luck another chance to fool you.' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { p: 'For conversion rates, the standard analysis is the **two-proportion z-test**. It asks: how many standard errors apart are the two rates?' },
          { tex: 'z = \\frac{\\hat{p}_B - \\hat{p}_A}{\\sqrt{\\hat{p}\\,(1-\\hat{p})\\left(\\frac{1}{n_A} + \\frac{1}{n_B}\\right)}}', plain: 'The observed difference in conversion rates divided by how much difference you would expect from noise alone. Big |z| (above about 1.96) means p < 0.05.', symbols: [['\\hat{p}_A, \\hat{p}_B', 'observed conversion rates in A and B'], ['\\hat{p}', 'pooled rate: all conversions ÷ all visitors'], ['n_A, n_B', 'visitors in each group']] },
          { p: 'The bottom of the fraction is the **standard error of the difference**. It shrinks as samples grow, which is why bigger tests can detect smaller effects. The pooled rate is used because, under the null hypothesis, both groups share one true rate.' },
          { tex: 'n \\approx \\frac{(z_{1-\\alpha/2} + z_{1-\\beta})^2 \\, \\left[p_A(1-p_A) + p_B(1-p_B)\\right]}{(p_B - p_A)^2}', plain: 'Visitors needed per group. The top grows with how confident and powerful you want to be; the bottom is the squared effect size. Halving the MDE roughly quadruples the sample size.', symbols: [['z_{1-\\alpha/2}', '1.96 for a 5% two-sided test'], ['z_{1-\\beta}', '0.84 for 80% power'], ['p_B - p_A', 'the minimum detectable effect']] },
          { tex: '(\\hat{p}_B - \\hat{p}_A) \\pm 1.96 \\sqrt{\\frac{\\hat{p}_A(1-\\hat{p}_A)}{n_A} + \\frac{\\hat{p}_B(1-\\hat{p}_B)}{n_B}}', plain: 'A 95% confidence interval for the lift. Report this, not just the p-value: it shows the range of plausible effects, which is what the business needs for a decision.' },
          { diagram: { kind: 'bars', labels: ['4% → 6%', '4% → 5%', '4% → 4.8%', '4% → 4.4%'], values: [1860, 6742, 10313, 39472], highlight: 3, yLabel: 'visitors needed per arm', caption: 'Sample size per group at a 4% baseline, 5% significance and 80% power. Detecting a 0.4-point lift needs about 39,500 visitors per arm, almost four times the 10,300 needed for 0.8 points, and over twenty times the 1,900 needed for 2 points. Small effects are expensive to detect.' } },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'An under-powered test', setup: 'A: 1,000 visitors, 50 purchases (5.0%). B: 1,000 visitors, 65 purchases (6.5%). The team is excited about a 30% relative lift.', steps: [
            'Pooled rate = 115 ÷ 2,000 = 5.75%.',
            'Standard error = √(0.0575 × 0.9425 × (1/1,000 + 1/1,000)) = 0.0104, i.e. 1.04 points.',
            'z = (0.065 − 0.050) ÷ 0.0104 = 1.44. Two-sided p = 0.15.',
            '95% CI for the lift: −0.5 to +3.5 points. It includes zero.',
            'Sample size needed to detect 5.0% → 6.5% with 80% power: about 3,800 per arm.',
          ], result: 'Not significant. The test is not evidence that B fails; it is evidence that 1,000 visitors per arm was too few. The interval says the truth could be anything from slightly worse to much better.' } },
          { example: { title: 'Planning the sample size (business case, illustrative)', setup: 'An online electronics retailer converts 4.0% of checkout visitors. A lift to 4.8% (a 20% relative improvement) would justify the redesign. Use α = 5%, power = 80%.', steps: [
            '(1.96 + 0.84)² = 7.85.',
            'Variance part: 0.04 × 0.96 + 0.048 × 0.952 = 0.0384 + 0.0457 = 0.0841.',
            'Effect squared: (0.008)² = 0.000064.',
            'n = 7.85 × 0.0841 ÷ 0.000064 ≈ 10,300 visitors per arm.',
            'With 1,500 checkout visitors a day split 50/50, 2 × 10,300 visitors takes about 14 days, conveniently two full weekly cycles.',
          ], result: 'Plan for at least 10,300 visitors per arm, decided before launch, and do not stop early.' } },
          { example: { title: 'Analysing the planned test', setup: 'After two weeks: A has 10,500 visitors and 420 purchases (4.0%); B has 10,500 visitors and 504 purchases (4.8%).', steps: [
            'Pooled rate = 924 ÷ 21,000 = 4.4%.',
            'Standard error = √(0.044 × 0.956 × 2 ÷ 10,500) = 0.00283, i.e. 0.28 points.',
            'z = 0.008 ÷ 0.00283 = 2.83. p = 0.0047.',
            '95% CI for the lift: +0.25 to +1.35 points.',
            'If the average order is ₹4,000 and 1,500 visitors a day reach checkout, an extra 0.8 points is about 12 more orders, roughly ₹48,000 of extra revenue per day; the cautious end of the interval (0.25 points) is still about ₹15,000 a day.',
          ], result: 'Ship B. The decision rests on the whole interval being above zero and even its low end being worth the effort.' } },
          { diagram: { kind: 'table', head: ['Test', 'Visitors per arm', 'A rate', 'B rate', 'z', 'p-value', '95% CI for lift'], rows: [['Under-powered', '1,000', '5.0%', '6.5%', '1.44', '0.15', '−0.5 to +3.5 pts'], ['Planned', '10,500', '4.0%', '4.8%', '2.83', '0.005', '+0.25 to +1.35 pts']], caption: 'Two tests side by side. A bigger raw lift with too few visitors proves nothing; a planned test with enough visitors gives a narrow interval clear of zero.' } },
        ],
      },
      {
        heading: 'Guardrails: peeking, many metrics and broken splits',
        blocks: [
          { p: '**Peeking.** It is tempting to check results every day and stop as soon as p dips below 0.05. But p-values wander up and down by chance during a test. Each look is another chance for a fluke.' },
          { diagram: { kind: 'bars', labels: ['Look once at the end', 'Peek 10 times, stop at first p < 0.05'], values: [5, 20], highlight: 1, yLabel: 'false-positive rate (%)', caption: 'Simulated A/A tests (two identical versions). Looking once keeps false winners at 5%. Peeking ten times and stopping at the first "significant" result declares a false winner about 20% of the time.' } },
          { bullets: [
            '**Many metrics:** test 20 metrics and about one will be "significant" by luck. Fix one primary metric in advance, or correct for multiple comparisons.',
            '**Sample ratio mismatch (SRM):** a planned 50/50 split that came out 10,300 vs 9,700 has a chi-square p of about 0.00002. Something is broken (a redirect bug, bots, a tracking failure). Fix it before trusting any result.',
            '**Novelty effect:** users click a new design because it is new. Run long enough for that to fade.',
            '**Wrong unit:** randomise users, not page views, or the same person sees both versions.',
          ] },
          { callout: 'If you need to monitor continuously, use methods designed for it: **sequential testing** with adjusted thresholds, or a Bayesian analysis with a pre-agreed decision rule.', tone: 'tip' },
        ],
      },
      {
        heading: 'A/B testing in the real world',
        blocks: [
          { case: { title: 'Experimentation at scale', story: 'Large online companies such as Microsoft (Bing), Booking.com, Amazon and Netflix have publicly described running thousands of controlled experiments a year. A widely shared lesson from their published experience is humbling: most ideas, even ones experts were confident about, produce no measurable improvement, and some make things worse. The value of the experimentation culture is not that each test wins; it is that losing ideas are caught cheaply before a full launch, and decisions stop depending on who argues most confidently in the meeting.' } },
          { bullets: [
            '**Pricing and offers:** compare discount levels or free-delivery thresholds (with care for fairness and regulations).',
            '**Email and push campaigns:** subject lines, send times, creative.',
            '**Banking and insurance apps:** onboarding flows, form length, nudges to complete KYC.',
            '**Offline:** store layouts or shelf placements, randomised across stores rather than users.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Statistically significant is not commercially significant.** A 0.05-point lift may be real and still not worth the engineering cost.',
            '**Interference:** in marketplaces (riders and drivers, buyers and sellers), treating some users changes conditions for others. Use geographic or time-based splits.',
            '**Long-term effects:** a pushy pop-up may lift this week\'s sign-ups and hurt next quarter\'s retention.',
            '**Ethics:** tests that affect prices, credit or health need review and transparency.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'Classic A/B test', items: ['One planned analysis at a fixed sample size', 'Clear false-positive control', 'Simple, auditable, widely trusted', 'Wastes traffic on a losing variant until the end'] }, right: { title: 'Alternatives', items: ['**Sequential tests**: safe early stopping', '**Bayesian A/B**: "probability B beats A" statements', '**Multi-armed bandits**: shift traffic to winners, good for short campaigns', '**Geo-experiments / diff-in-diff**: when users cannot be split'] }, caption: 'The classic test is the default. Choose an alternative when you need early stopping, adaptive traffic, or cannot randomise individuals.' } },
        ],
      },
    ],
    faq: [
      { q: 'How long should an A/B test run?', a: 'Until the pre-calculated sample size is reached, and at least one or two full weeks so weekday and weekend behaviour are both included.' },
      { q: 'What if the result is not significant?', a: 'Report the confidence interval. If it is narrow around zero, the change probably does little. If it is wide, the test was too small to tell; do not claim "B is no better".' },
      { q: 'Can I test more than two versions?', a: 'Yes (A/B/C/n tests), but each comparison needs enough traffic and you should adjust for multiple comparisons, for example with a Bonferroni correction.' },
      { q: 'Should I use a one-sided test because I only care if B is better?', a: 'Most teams use two-sided tests. A change can hurt as well as help, and you want to detect that too.' },
      { q: 'What tools do I need?', a: 'For analysis, `statsmodels.stats.proportion.proportions_ztest` and `confint_proportions_2indep`; for planning, `NormalIndPower().solve_power`. Experimentation platforms handle assignment and logging.' },
      { q: 'What about metrics like revenue per user, which are very skewed?', a: 'Use a t-test with large samples, or bootstrap the difference in means. Consider capping extreme values (winsorising) agreed in advance.' },
    ],
  },

  'bayes-theorem': {
    minutes: 14,
    hook: 'A bank\'s fraud system flags your card payment. The system catches 95% of fraud and wrongly flags only 2% of honest payments. So there is a 95% chance this payment is fraud, right? Not even close: the answer is under 9%. The gap between those two numbers trips up doctors, judges, managers and data scientists alike. **Bayes\' theorem** is the simple rule that gets it right, by combining what you knew before with what the evidence says.',
    sections: [
      {
        heading: 'The problem: updating beliefs with evidence',
        blocks: [
          { p: 'Decisions rarely start from nothing. A credit analyst knows roughly what share of applicants default. A plant manager knows which line usually causes defects. Then new evidence arrives: a test result, an alert, a customer complaint. The question is always: **how much should this evidence change my mind?**' },
          { p: 'People are bad at this by instinct. We tend to focus on how accurate the evidence sounds ("95% of frauds are caught") and forget how rare the thing we are looking for was to begin with. Bayes\' theorem is the arithmetic of combining the two correctly.' },
          { term: 'Conditional probability', def: 'The probability of one thing given that another is known to be true, written P(A | B) and read "probability of A given B". For example, P(alert | fraud) is the chance of an alert when the payment really is fraud.' },
          { term: 'Base rate', def: 'How common something is before you look at any specific evidence. If 0.2% of payments are fraudulent, the base rate of fraud is 0.2%.' },
          { p: 'The heart of the confusion is that **P(alert | fraud) is not the same as P(fraud | alert)**. The first is how good the detector is. The second is what you actually want to know after an alert. Bayes\' theorem converts one into the other.' },
          { diagram: { kind: 'bars', labels: ['P(alert | fraud)', 'P(fraud | alert)'], values: [95, 8.7], highlight: 1, yLabel: 'probability (%)', caption: 'Two probabilities that sound alike and are wildly different. The detector catches 95% of fraud, yet only 8.7% of alerts are fraud, because fraud is so rare. We will derive this number below.' } },
        ],
      },
      {
        heading: 'Building the intuition: count people, not percentages',
        blocks: [
          { p: 'The easiest way to think like Bayes is to stop using percentages and imagine a crowd. Take a disease that affects 1% of people, and a test that is positive for 99% of sick people and, wrongly, for 5% of healthy people. You test positive. How worried should you be?' },
          { steps: [
            '**Imagine 10,000 people.** At 1%, 100 are sick and 9,900 are healthy.',
            '**Of the 100 sick,** the test catches 99. These are true positives.',
            '**Of the 9,900 healthy,** 5% test positive anyway: 495 false positives.',
            '**Everyone who tested positive** is in a room: 99 + 495 = 594 people.',
            '**Only 99 of those 594 are sick.** 99 ÷ 594 is about 16.7%.',
          ], title: 'The crowd method' },
          { diagram: { kind: 'tree', root: { label: '10,000 people', children: [{ label: '100 sick', edge: '1%', children: [{ label: '99 test positive', edge: '99%' }, { label: '1 tests negative', edge: '1%' }] }, { label: '9,900 healthy', edge: '99%', children: [{ label: '495 test positive', edge: '5%' }, { label: '9,405 test negative', edge: '95%' }] }] }, caption: 'Natural frequencies for the medical test. The positives come from two branches: 99 sick people and 495 healthy ones. False alarms outnumber true cases five to one because healthy people are 99 times more common.' } },
          { term: 'False positive', def: 'A test or alert that says "yes" when the true answer is "no", such as a healthy person testing positive or an honest payment being flagged.' },
          { think: { q: 'If the disease affected 20% of people instead of 1%, would a positive result be more or less worrying, with the same test?', a: 'Much more worrying. Out of 10,000: 2,000 sick give 1,980 true positives, and 8,000 healthy give 400 false positives. P(sick | positive) = 1,980 ÷ 2,380 ≈ 83%. The test is identical; only the base rate changed.' } },
          { callout: 'When the thing you are looking for is rare, even an accurate test produces mostly false alarms. Forgetting this is called the **base-rate fallacy**.', tone: 'key' },
        ],
      },
      {
        heading: 'How Bayesian updating works, step by step',
        blocks: [
          { diagram: { kind: 'flow', nodes: ['**Prior**: what you believe before the evidence', '**Likelihood**: how probable the evidence is under each possibility', '**Multiply** prior × likelihood for each possibility', '**Normalise** so the results add to 1', '**Posterior**: updated belief, the next prior'], caption: 'The Bayesian update. The last box loops back: today\'s posterior becomes tomorrow\'s prior when more evidence arrives.' } },
          { term: 'Prior', def: 'Your probability for a hypothesis before seeing the new evidence. Often a base rate from historical data.' },
          { term: 'Likelihood', def: 'How probable the observed evidence is if a given hypothesis were true. P(positive test | sick) = 99% is a likelihood.' },
          { term: 'Posterior', def: 'Your updated probability for the hypothesis after taking the evidence into account. It is what Bayes\' theorem calculates.' },
          { steps: [
            'List the possibilities (sick or healthy; fraud or honest; plant A, B or C).',
            'Write down the prior for each.',
            'Write down the likelihood of the evidence under each.',
            'Multiply prior × likelihood for each possibility.',
            'Divide each product by their total. Those are the posteriors.',
          ] },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { tex: 'P(H \\mid E) = \\frac{P(E \\mid H)\\; P(H)}{P(E)}', plain: 'The probability of the hypothesis given the evidence equals how well the hypothesis explains the evidence, times how believable the hypothesis was beforehand, divided by how common the evidence is overall.', symbols: [['H', 'hypothesis (e.g. the person is sick)'], ['E', 'evidence (e.g. a positive test)'], ['P(H)', 'prior'], ['P(E \\mid H)', 'likelihood'], ['P(H \\mid E)', 'posterior'], ['P(E)', 'total probability of the evidence']] },
          { p: 'Where does P(E) come from? The evidence can arise in several ways (from sick people or from healthy people), so add up all of them. This is exactly "everyone in the positive room" from the crowd method.' },
          { tex: 'P(E) = P(E \\mid H)\\,P(H) + P(E \\mid \\text{not } H)\\,P(\\text{not } H)', plain: 'Total chance of a positive = true positives from the sick + false positives from the healthy.' },
          { p: 'Why does the theorem have this shape? The top, P(E | H) × P(H), is the share of all people who are both sick and positive (99 out of 10,000). The bottom is the share who are positive at all (594 out of 10,000). Their ratio is the share of positives who are sick.' },
          { tex: '\\underbrace{\\frac{P(H \\mid E)}{P(\\text{not } H \\mid E)}}_{\\text{posterior odds}} = \\underbrace{\\frac{P(E \\mid H)}{P(E \\mid \\text{not } H)}}_{\\text{likelihood ratio}} \\times \\underbrace{\\frac{P(H)}{P(\\text{not } H)}}_{\\text{prior odds}}', plain: 'The odds version: multiply your prior odds by the likelihood ratio (how many times more likely the evidence is under H). For the medical test: prior odds 1 : 99, likelihood ratio 0.99 ÷ 0.05 = 19.8, posterior odds 0.2, which is a probability of 1/6 ≈ 16.7%.' },
          { p: 'The odds form is handy in practice. Each new, independent piece of evidence simply multiplies the odds by its own likelihood ratio.' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Fraud alerts at a card issuer (business case, illustrative)', setup: '0.2% of card payments are fraudulent. The model flags 95% of fraud and 2% of honest payments. What share of alerts are real fraud?', steps: [
            'Take 1,00,000 payments: 200 fraudulent, 99,800 honest.',
            'True alerts: 95% of 200 = 190.',
            'False alerts: 2% of 99,800 = 1,996.',
            'Total alerts = 190 + 1,996 = 2,186.',
            'P(fraud | alert) = 190 ÷ 2,186 = 8.7%.',
          ], result: 'More than 9 out of 10 alerts are honest customers. That shapes operations: a quick SMS confirmation is a better first response than blocking the card, and investigators should be sized for about 2,200 alerts per lakh payments, not 200.' } },
          { example: { title: 'A second test changes everything', setup: 'Back to the medical test. After one positive, P(sick) = 16.7%. The person takes a second, independent test with the same accuracy, and it is also positive.', steps: [
            'New prior = 0.167 (yesterday\'s posterior).',
            'Top: 0.99 × 0.167 = 0.165.',
            'Bottom: 0.165 + 0.05 × 0.833 = 0.165 + 0.042 = 0.207.',
            'Posterior = 0.165 ÷ 0.207 ≈ 0.80.',
          ], result: 'Two positives raise the probability from 1% to 16.7% to about 80%. This is why doctors confirm screening results with a second test, and why a single alert should trigger a check rather than a final verdict.' } },
          { diagram: { kind: 'bars', labels: ['Before any test', 'After 1 positive', 'After 2 positives'], values: [1, 16.7, 79.8], highlight: 2, yLabel: 'P(sick) (%)', caption: 'Sequential updating. Each positive result multiplies the odds by about 20, so belief climbs fast once evidence accumulates.' } },
          { example: { title: 'Which plant made the faulty part?', setup: 'An automotive supplier sources a component from three plants. Plant A makes 50% of parts with a 1% defect rate, plant B 30% with 2%, plant C 20% with 5%. A customer returns a defective part. Which plant most likely made it?', steps: [
            'Prior × likelihood: A 0.50 × 0.01 = 0.005; B 0.30 × 0.02 = 0.006; C 0.20 × 0.05 = 0.010.',
            'Total = 0.021 (2.1% of all parts are defective).',
            'Posteriors: A 0.005 ÷ 0.021 = 23.8%; B 28.6%; C 47.6%.',
          ], result: 'Plant C makes only a fifth of the parts but is the likeliest source of a defect, at almost 48%. Start the quality audit there.' } },
          { diagram: { kind: 'table', head: ['Plant', 'Prior (share made)', 'Defect rate', 'Prior × likelihood', 'Posterior'], rows: [['A', '50%', '1%', '0.005', '23.8%'], ['B', '30%', '2%', '0.006', '28.6%'], ['C', '20%', '5%', '0.010', '47.6%'], ['Total', '100%', '', '0.021', '100%']], caption: 'Bayes in a table. Multiply across, add down, divide. The posterior ranking differs from the prior ranking because the evidence (a defect) is far more likely to come from plant C.' } },
        ],
      },
      {
        heading: 'Bayes in machine learning and decision-making',
        blocks: [
          { bullets: [
            '**Naive Bayes classifiers:** spam filters compute P(spam | words) from how often each word appears in spam and normal mail, assuming words are independent. Simple, fast, and still a strong baseline for text.',
            '**Bayesian A/B testing:** instead of a p-value, report "the probability that B beats A is 97%", which managers find easier to act on.',
            '**Bayesian inference:** treat model parameters themselves as uncertain, with a prior and a posterior distribution, giving full uncertainty rather than a single estimate.',
            '**Threshold setting:** posterior probabilities combined with costs (a missed fraud versus an annoyed customer) tell you where to set alert thresholds.',
          ] },
          { think: { q: 'A rival vendor offers a fraud model that flags 99% of fraud with a 2% false-alarm rate, versus your 95%. Will this fix the problem that most alerts are false?', a: 'Barely. Out of 1,00,000 payments it would give 198 true alerts and still 1,996 false ones, so P(fraud | alert) rises only from 8.7% to about 9.0%. With a rare event, the false-positive rate matters far more than catching a few more frauds.' } },
        ],
      },
      {
        heading: 'In the real world',
        blocks: [
          { case: { title: 'Medical screening programmes', story: 'Public-health screening (for example, mammography for breast cancer) is the classic real-world Bayes problem, widely discussed in medical statistics. Because most screened people do not have the disease, a large share of positive screens turn out to be false alarms, even with a good test. That is why screening positives are followed by more specific diagnostic tests, and why health agencies weigh the anxiety and cost of false positives when deciding who should be screened and how often. Restricting screening to higher-risk groups raises the prior, and so raises the value of each positive result.' } },
          { bullets: [
            '**Credit risk:** updating a borrower\'s default probability as repayment behaviour comes in.',
            '**Predictive maintenance:** combining a machine\'s age (prior) with a vibration alarm (evidence).',
            '**Search and rescue:** Bayesian search theory updates the probability map of where a lost object is after each area is searched.',
            '**Recommendation and ranking:** shrinking a new product\'s 5-star average from 2 reviews towards the category average is a Bayesian idea.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Confusing the inverse:** P(evidence | guilty) is not P(guilty | evidence). This error even has a name in law: the prosecutor\'s fallacy.',
            '**Ignoring the base rate:** always ask "how common was this to begin with?"',
            '**Bad priors:** a prior from the wrong population (all customers instead of new customers) gives a wrong posterior.',
            '**Assuming independence:** two tests that share the same flaw are not independent; the second positive adds less than the formula suggests.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'Frequentist view', items: ['Probability = long-run frequency', 'Parameters are fixed, unknown numbers', 'Reports p-values and confidence intervals', 'No prior needed'] }, right: { title: 'Bayesian view', items: ['Probability = degree of belief', 'Parameters have probability distributions', 'Reports posterior probabilities and credible intervals', 'Requires a prior, which must be justified'] }, caption: 'Bayes\' theorem itself is uncontroversial arithmetic. The two schools differ on whether to apply it to unknown parameters. Both are used widely in industry.' } },
        ],
      },
    ],
    faq: [
      { q: 'In one sentence, what does Bayes\' theorem do?', a: 'It updates the probability of a hypothesis by combining your prior belief with how well the hypothesis explains new evidence: posterior ∝ likelihood × prior.' },
      { q: 'Where do priors come from?', a: 'Usually from historical data (base rates), from earlier studies, or from expert judgement. When unsure, use a weak prior that lets the data dominate, and check how sensitive the answer is.' },
      { q: 'Why is a "99% accurate" test often wrong when it says positive?', a: 'Because when the condition is rare, the small false-positive rate applies to a huge number of healthy people and produces more false alarms than true cases.' },
      { q: 'What is the difference between likelihood and probability?', a: 'Probability asks how likely the evidence is. Likelihood is that same number viewed as a measure of how well each hypothesis explains the evidence you already have. Bayes uses it to weigh hypotheses.' },
      { q: 'Is Naive Bayes the same as Bayes\' theorem?', a: 'Naive Bayes is a classifier built on Bayes\' theorem plus the "naive" simplifying assumption that features are independent given the class.' },
      { q: 'How do I compute it in Python?', a: 'For a simple case it is one line: `post = lik * prior / (lik * prior + fpr * (1 - prior))`. For classifiers, `sklearn.naive_bayes`; for full Bayesian models, libraries such as PyMC.' },
    ],
  },

  mle: {
    minutes: 15,
    hook: 'You run a website and 7 of the first 10 visitors buy something. What is your best guess for the true conversion rate? Almost everyone says 70%, without being able to say why. **Maximum likelihood estimation** is the "why". It is the principle that hides inside logistic regression, linear regression, Poisson models and most of statistics: choose the settings of your model that make the data you actually saw as probable as possible.',
    sections: [
      {
        heading: 'The problem: turning data into parameter values',
        blocks: [
          { p: 'Statistical models come with dials. A model of conversions has a dial for the conversion rate. A model of calls arriving at a help desk has a dial for the average number of calls per hour. A model of part diameters has dials for the average and the spread. Until the dials are set, the model is useless.' },
          { term: 'Parameter', def: 'A number inside a model that controls its behaviour, such as a conversion rate, an average or a regression coefficient. Fitting a model means choosing its parameter values.' },
          { term: 'Estimate', def: 'A value for a parameter calculated from data. Estimates are written with a hat: p̂ is the estimate of the true rate p.' },
          { p: 'For simple cases intuition works: the average of the data is a fine guess for the average. But what about a logistic regression with 30 coefficients, or a model of failure times? We need one general principle that tells us how to set any dial on any model. Maximum likelihood is that principle, and it is the most widely used one in statistics and machine learning.' },
          { diagram: { kind: 'curve', fn: 'Math.pow(x,7)*Math.pow(1-x,3)*1000', xMin: 0, xMax: 1, marks: [{ x: 0.7, label: 'peak at p = 0.7' }], xLabel: 'conversion rate p', yLabel: 'likelihood (× 1,000)', caption: 'For 7 conversions in 10 visits, the likelihood of each candidate rate p. Rates near 0 or 1 make the data almost impossible; the curve peaks at exactly p = 0.7. That peak is the maximum likelihood estimate.' } },
        ],
      },
      {
        heading: 'Building the intuition: the detective and the dice',
        blocks: [
          { p: 'A detective finds a gambler\'s die that rolled six on 8 of 10 throws. Three dice are in evidence: a fair one (sixes 1/6 of the time), a slightly loaded one (sixes 1/3 of the time), and a heavily loaded one (sixes 3/4 of the time). Which die was used?' },
          { steps: [
            '**For each suspect die, ask: if this die were used, how probable is what we saw?**',
            '**Fair die:** 8 sixes in 10 rolls would be astonishingly rare.',
            '**Slightly loaded:** still very unusual.',
            '**Heavily loaded:** 8 out of 10 is quite typical.',
            '**Pick the suspect that makes the evidence least surprising.** That is the heavily loaded die.',
          ], title: 'Choosing the suspect that best explains the evidence' },
          { p: 'Maximum likelihood does exactly this, except that instead of three suspects there is a whole dial of possible values, and we turn the dial until the evidence is as probable as it can be.' },
          { term: 'Likelihood', def: 'The probability of the observed data, viewed as a function of the parameter values. It answers "how well does this parameter value explain what we saw?" It is not the probability that the parameter is correct.' },
          { think: { q: 'Why does the detective not simply ask "which die is most probable?"', a: 'That question needs a prior: how likely was each die to be used before the evidence (perhaps loaded dice are rare). That is Bayes\' theorem. Maximum likelihood deliberately uses only the evidence. With lots of data the two answers usually agree.' } },
          { callout: 'Maximum likelihood: among all possible parameter values, pick the one under which the observed data would have been most probable.', tone: 'key' },
        ],
      },
      {
        heading: 'How MLE works, step by step',
        blocks: [
          { diagram: { kind: 'flow', nodes: ['**Choose a model** (binomial, Poisson, normal…)', '**Write the likelihood**: probability of all data as a function of the parameters', '**Take the log**: products become sums', '**Maximise**: calculus or a numerical optimiser', '**Check** the fit and the uncertainty'], caption: 'The MLE recipe. The same five steps fit a coin, a help-desk queue or a logistic regression with hundreds of coefficients.' } },
          { steps: [
            '**Pick a probability model** that could have produced data like yours. Yes/no outcomes suggest a binomial model; counts per hour suggest Poisson; measurements suggest normal.',
            '**Write the likelihood.** If observations are independent, the probability of all of them is the product of their individual probabilities.',
            '**Take the logarithm.** The log turns a product into a sum and does not move the peak, because the log always increases when its input does.',
            '**Find the peak.** For simple models, set the derivative to zero and solve. For complex models, let an optimiser (such as gradient descent) climb to the top.',
            '**Assess.** Check that the model fits, and use the curvature of the log-likelihood at the peak to get standard errors.',
          ] },
          { term: 'Log-likelihood', def: 'The natural logarithm of the likelihood. It peaks at the same parameter value but is much easier to work with, because it is a sum rather than a product of many tiny numbers.' },
          { p: 'Why does the product of tiny numbers matter? With 10,000 observations, each with probability around 0.1, the likelihood is about 10 to the power −10,000, far too small for a computer to store. Its log is about −23,000, which is no problem at all.' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { tex: 'L(\\theta) = \\prod_{i=1}^{n} p(x_i \\mid \\theta)', plain: 'The likelihood of parameter θ is the product of the probabilities of each observation under θ, assuming the observations are independent.', symbols: [['\\theta', 'the parameter(s) we want to estimate'], ['x_i', 'the i-th observation'], ['p(x_i \\mid \\theta)', 'probability of that observation if θ were the true value']] },
          { tex: '\\ell(\\theta) = \\log L(\\theta) = \\sum_{i=1}^{n} \\log p(x_i \\mid \\theta), \\qquad \\hat{\\theta} = \\arg\\max_{\\theta} \\ell(\\theta)', plain: 'Take the log to turn the product into a sum, then choose the θ that makes this sum as large as possible. "arg max" means "the value of θ at which the maximum happens".' },
          { p: 'For the conversion example with k conversions in n visits, the binomial likelihood is proportional to p to the power k times (1 − p) to the power n − k. Watch the calculus do its work.' },
          { tex: '\\ell(p) = k \\log p + (n-k)\\log(1-p), \\qquad \\frac{d\\ell}{dp} = \\frac{k}{p} - \\frac{n-k}{1-p} = 0 \\;\\Rightarrow\\; \\hat{p} = \\frac{k}{n}', plain: 'Set the slope of the log-likelihood to zero (the top of a hill is flat) and solve. The answer is the sample proportion: 7 ÷ 10 = 0.7. Intuition confirmed.', symbols: [['k', 'number of successes'], ['n', 'number of trials']] },
          { p: 'The same steps give other familiar answers. For a Poisson model of counts, the MLE of the average rate is the sample mean. For a normal model, the MLE of the mean is the sample mean, and the MLE of the variance is the average squared deviation, dividing by n (not n − 1, so it is very slightly too small for small samples).' },
          { callout: 'Hidden connection: if a regression\'s errors are normal, maximising the likelihood is exactly the same as minimising the sum of squared errors. If outcomes are yes/no, maximising the likelihood is the same as minimising **log-loss**. Ordinary least squares and logistic regression are both maximum likelihood in disguise.', tone: 'key' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Conversion rate by trial and error', setup: '7 conversions out of 10 visitors. Likelihood L(p) = p⁷ (1 − p)³.', steps: [
            'p = 0.5: L = 0.5⁷ × 0.5³ = 0.000977; log-likelihood = −6.93.',
            'p = 0.6: L = 0.001792; log-likelihood = −6.32.',
            'p = 0.7: L = 0.002224; log-likelihood = −6.11.',
            'p = 0.8: L = 0.001678; log-likelihood = −6.39.',
            'p = 0.9: L = 0.000478; log-likelihood = −7.65.',
          ], result: 'The likelihood is highest at p = 0.7, matching the calculus. The values are tiny because they are probabilities of one exact sequence; only their relative sizes matter.' } },
          { example: { title: 'Calls to a help desk (business case, illustrative)', setup: 'An IT service desk in Bengaluru counts calls in six one-hour slots: 2, 3, 1, 4, 0, 2. Model the counts as Poisson with average rate λ calls per hour.', steps: [
            'Poisson log-likelihood: ℓ(λ) = (sum of counts) × log λ − n × λ − (a constant). Here the sum is 12 and n = 6.',
            'Slope: 12 ÷ λ − 6 = 0, so λ̂ = 12 ÷ 6 = 2 calls per hour, the sample mean.',
            'Check numerically: ℓ(1.5) = −10.49, ℓ(2) = −10.04, ℓ(2.5) = −10.36, ℓ(3) = −11.17.',
          ], result: 'λ̂ = 2 calls per hour. The fitted Poisson model then answers staffing questions such as "how often will we get 5 or more calls in an hour?", which is the real business value of fitting a distribution.' } },
          { diagram: { kind: 'curve', fn: '12*Math.log(x) - 6*x - Math.log(576)', xMin: 0.5, xMax: 4, marks: [{ x: 2, label: 'λ̂ = 2' }], xLabel: 'rate λ (calls per hour)', yLabel: 'log-likelihood', caption: 'Log-likelihood of the help-desk data for different call rates. The hill peaks at λ = 2. The flatter the hill near its top, the more uncertain the estimate; more data makes the hill sharper.' } },
          { example: { title: 'Normal model for part diameters', setup: 'Five machined shafts measure 10.2, 9.8, 10.1, 9.9 and 10.0 mm. Fit a normal distribution by maximum likelihood.', steps: [
            'MLE of the mean = sample mean = 50.0 ÷ 5 = 10.0 mm.',
            'Squared deviations: 0.04, 0.04, 0.01, 0.01, 0. Sum = 0.10.',
            'MLE of the variance = 0.10 ÷ 5 = 0.020 (standard deviation 0.141 mm).',
            'The usual unbiased sample variance divides by n − 1: 0.10 ÷ 4 = 0.025.',
          ], result: 'MLE gives mean 10.0 mm and variance 0.020. With five points the n versus n − 1 difference is noticeable; with 500 it disappears.' } },
          { diagram: { kind: 'table', head: ['Model', 'Data type', 'MLE of the parameter', 'Familiar as'], rows: [['Binomial', 'Yes/no outcomes', 'p̂ = successes ÷ trials', 'Sample proportion'], ['Poisson', 'Counts per interval', 'λ̂ = mean count', 'Sample mean'], ['Normal', 'Measurements', 'μ̂ = mean, σ̂² = Σ(x − x̄)² ÷ n', 'Mean and (biased) variance'], ['Linear regression, normal errors', 'Numeric target', 'Coefficients minimising squared error', 'Ordinary least squares'], ['Logistic regression', 'Yes/no target', 'Coefficients minimising log-loss', 'Fitted by an optimiser']], caption: 'Maximum likelihood rediscovers the estimates you already know, and extends the same logic to models where no one could guess the answer.' } },
        ],
      },
      {
        heading: 'Properties, uncertainty and model comparison',
        blocks: [
          { bullets: [
            '**Consistent:** with more and more data, the MLE homes in on the true value (if the model is right).',
            '**Efficient:** for large samples, no reasonable estimator has smaller variance.',
            '**Approximately normal:** for large samples the MLE is roughly normally distributed, so you can build confidence intervals from its standard error.',
            '**Invariant:** the MLE of any function of a parameter is that function of the MLE. If λ̂ = 2 calls per hour, the MLE of the average gap between calls is 1/2 hour.',
          ] },
          { term: 'Information criteria (AIC, BIC)', def: 'Scores that compare models using the maximised log-likelihood minus a penalty for the number of parameters. Lower AIC or BIC is better. They stop you from simply picking the most complicated model.' },
          { p: 'statsmodels reports the log-likelihood, AIC and BIC for every fitted model, and scikit-learn\'s `LogisticRegression` fits its coefficients by maximising a (regularised) likelihood.' },
        ],
      },
      {
        heading: 'In the real world',
        blocks: [
          { case: { title: 'Warranty and reliability analysis (illustrative)', story: 'An automotive component maker wants to predict warranty claims for a new pump. It records failure times for units that failed and, for units still running, only the fact that they have survived so far. Maximum likelihood handles this naturally: failed units contribute the probability of failing at their time, survivors contribute the probability of surviving at least that long. Fitting a Weibull distribution this way gives the expected failure rate by year, which the finance team uses to set the warranty provision in the accounts. A naive average of failure times, which ignores the survivors, would badly understate the pump\'s life.' } },
          { bullets: [
            '**Every logistic regression** used for credit scoring or churn prediction is fitted by maximum likelihood.',
            '**Poisson and negative binomial models** for footfall, insurance claim counts and call volumes.',
            '**Gaussian mixture models** for soft clustering, fitted with the EM algorithm, a method for maximising likelihood with hidden labels.',
            '**Neural network classifiers** trained with cross-entropy loss are maximising a likelihood.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Wrong model, wrong answer.** MLE finds the best parameters for the model you chose. If the data are not Poisson, the "best Poisson" can still be bad.',
            '**Small samples overfit.** One conversion in one visit gives p̂ = 100%. Priors (Bayesian estimates) or regularisation pull such estimates back towards sensible values.',
            '**Multiple peaks.** Complex likelihoods (mixtures, neural networks) can have several hills, and an optimiser may stop on a lower one. Try several starting points.',
            '**Perfect separation.** In logistic regression, if one feature perfectly splits yes from no, the likelihood keeps rising as the coefficient grows towards infinity. Regularisation fixes this.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'Maximum likelihood', items: ['Uses only the data', 'Gives a single best value', 'Standard in most software', 'Can be extreme with little data', 'Uncertainty from standard errors'] }, right: { title: 'Bayesian / MAP estimation', items: ['Combines data with a prior', 'Gives a full posterior distribution (or its peak, MAP)', 'Needs a prior to be chosen', 'Stable with little data', 'L2 regularisation = MLE plus a normal prior'] }, caption: 'MLE and Bayesian estimation agree when data are plentiful. With scarce data, priors or regularisation keep estimates sensible.' } },
        ],
      },
    ],
    faq: [
      { q: 'Is the likelihood the probability that the parameter is correct?', a: 'No. It is the probability of the data given the parameter. To get a probability for the parameter itself you need Bayes\' theorem and a prior.' },
      { q: 'Why maximise the log-likelihood instead of the likelihood?', a: 'The log turns products into sums, avoids numbers too tiny for a computer, and makes the calculus easier. Because the log always increases, the peak is in the same place.' },
      { q: 'How is MLE related to loss functions in machine learning?', a: 'Minimising a loss is often maximising a likelihood. Squared error corresponds to normal errors, log-loss (cross-entropy) to yes/no outcomes, and Poisson deviance to counts.' },
      { q: 'Does MLE always have a neat formula?', a: 'Only for simple models. For logistic regression, neural networks and most real models, a numerical optimiser climbs the log-likelihood instead.' },
      { q: 'Why does the MLE of the variance divide by n, not n − 1?', a: 'Because the MLE simply maximises the likelihood, without correcting for the fact that the mean was estimated from the same data. It is slightly biased in small samples; dividing by n − 1 removes that bias.' },
      { q: 'How do I compute an MLE in Python?', a: 'Many scipy distributions have `.fit(data)` (for example `scipy.stats.norm.fit`). For custom models, write the negative log-likelihood and minimise it with `scipy.optimize.minimize`. statsmodels fits GLMs by maximum likelihood.' },
    ],
  },
};
