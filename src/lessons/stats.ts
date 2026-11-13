import { Lesson } from './types';

export const STATS: Record<string, Lesson> = {
  'descriptive-stats': {
    minutes: 8,
    goals: ['Compute mean, median, mode, variance and standard deviation', 'Choose the right "typical value" for skewed data', 'Use quartiles and the IQR to describe spread'],
    why: 'Every report starts with descriptive statistics. Choosing mean vs median wrongly is how "average salary" headlines mislead whole countries.',
    explain: [
      '**Centre**: the **mean** is the arithmetic average; the **median** is the middle value when sorted; the **mode** is the most frequent value.',
      'The mean is pulled by extreme values; the median is not. For skewed data (salaries, house prices, delivery times) the median is usually the honest "typical" value.',
      '**Spread**: the **standard deviation** (SD) is the typical distance from the mean. The **interquartile range** (IQR = Q3 − Q1) is the width of the middle 50% and, like the median, is robust to outliers.',
      'Always report a centre **and** a spread. "Average delivery 2 days" means something very different with an SD of 0.2 days than with an SD of 3 days.',
    ],
    formula: { tex: '\\bar x = \\frac{1}{n}\\sum x_i, \\qquad s = \\sqrt{\\frac{1}{n-1}\\sum (x_i-\\bar x)^2}', plain: 'Mean = sum ÷ count. Sample SD = square root of the average squared distance from the mean (dividing by n − 1 for a sample).' },
    example: { title: 'Five employees\' monthly bonus (₹ thousand)', steps: ['Data: 2, 3, 3, 4, 100 (the last is the CEO)', 'Mean = 112 / 5 = 22.4', 'Median = 3 (middle value)', 'Mode = 3'], result: 'Saying "the average bonus is ₹22,400" is technically true and completely misleading. The median of ₹3,000 describes a typical employee.' },
    mistakes: ['Using the mean for heavily skewed data.', 'Reporting a centre without any measure of spread.', 'Dividing by n instead of n − 1 for a sample SD (a small difference for large n).'],
    takeaways: ['Mean is sensitive to outliers; median is robust', 'Report centre + spread', 'IQR and box plots summarise skewed data well'],
    use: ['First step of every analysis and dashboard', 'Data quality checks (impossible minimums and maximums)'],
    practice: { code: `import pandas as pd
s = pd.Series([2, 3, 3, 4, 100])
print(s.describe())                 # count, mean, std, min, quartiles, max
print("median", s.median(), "IQR", s.quantile(.75) - s.quantile(.25))` },
    check: [
      { q: 'House prices in a city are right-skewed. Which "typical price" is best?', options: ['Mean', 'Median', 'Maximum', 'Range'], answer: 1, why: 'The median ignores the few very expensive houses.' },
      { q: 'Mean of 4, 6, 8?', options: ['5', '6', '7', '18'], answer: 1, why: '18 / 3 = 6.' },
    ],
  },

  'normal-distribution': {
    minutes: 9,
    goals: ['Describe the bell curve by its mean and SD', 'Apply the 68–95–99.7 rule', 'Convert values to z-scores and percentiles'],
    why: 'Measurement errors, manufacturing tolerances, test scores and averages of many things are approximately normal. Six Sigma quality programmes, control charts and confidence intervals all rely on it.',
    explain: [
      'The **normal distribution** is the symmetric bell curve. It is completely described by two numbers: the **mean** μ (centre) and the **standard deviation** σ (width).',
      '**68–95–99.7 rule**: about 68% of values fall within ±1σ of the mean, 95% within ±2σ and 99.7% within ±3σ.',
      'A **z-score** says how many SDs a value lies from the mean: z = (x − μ) / σ. It lets you compare apples and oranges (an exam score vs a sprint time).',
      'Why is it everywhere? When many small independent effects add up, the total tends to be normal. That is the Central Limit Theorem, covered next.',
    ],
    formula: { tex: 'z = \\frac{x-\\mu}{\\sigma}', plain: 'z-score = distance from the mean in units of standard deviations.' },
    example: { title: 'Bolt diameters on a production line', steps: ['Diameter ~ Normal(mean 10.00 mm, SD 0.02 mm)', 'Tolerance 9.96–10.04 mm = mean ± 2 SD', 'Within ±2 SD ≈ 95% → about 5% of bolts are rejected', 'Tighten the process to SD 0.0133 mm → ±3 SD → only 0.3% rejected'], result: 'Reducing variation, not moving the mean, is what cuts scrap. That is the core idea of Six Sigma.' },
    mistakes: ['Assuming everything is normal: incomes, claim sizes and web traffic are heavily skewed.', 'Using the 68–95–99.7 rule on small samples or skewed data.'],
    takeaways: ['Bell curve defined by μ and σ', '68–95–99.7 within 1, 2, 3 SDs', 'z-scores standardise values'],
    practice: { code: `from scipy.stats import norm
print(norm.cdf(2) - norm.cdf(-2))          # 0.954  share within ±2 SD
print(norm.cdf(184, loc=170, scale=7))     # height 184 cm → 97.7th percentile` },
    check: [
      { q: 'Mean 100, SD 15. What share of values lies between 70 and 130?', options: ['68%', '95%', '99.7%', '50%'], answer: 1, why: '70–130 is ±2 SD.' },
      { q: 'Mean 50, SD 4. The z-score of 44 is…', options: ['−1.5', '1.5', '−6', '0.67'], answer: 0, why: '(44 − 50) / 4 = −1.5.' },
    ],
  },

  distributions: {
    minutes: 10,
    goals: ['Match common distributions to real processes', 'Use binomial and Poisson for counts', 'Know where the t and chi-square distributions appear'],
    why: 'Choosing the right distribution is choosing the right model of reality: call-centre staffing (Poisson), defect rates (binomial), waiting times (exponential). The wrong choice gives wrong risk estimates.',
    explain: [
      '**Binomial**: the number of successes in n yes/no trials with success probability p. Example: how many of 20 leads convert.',
      '**Poisson**: the number of events in a fixed interval when events happen independently at an average rate λ. Example: calls per minute, defects per metre of cable.',
      '**Exponential**: the waiting time between Poisson events. Example: minutes until the next customer arrives.',
      '**Uniform**: every value in a range is equally likely. **t-distribution**: like the normal but with fatter tails, used when estimating a mean from a small sample. **Chi-square**: the distribution of sums of squared normals, used in tests on counts and variances.',
    ],
    example: { title: 'Call-centre staffing', steps: ['Calls arrive at λ = 3 per minute (Poisson)', 'P(0 calls in a minute) = e⁻³ ≈ 0.05', 'P(more than 6 calls) ≈ 0.034 → about 2 minutes in every hour', 'Staff for peaks, not for the average of 3'], result: 'The distribution, not just the average, tells you how often the team will be overwhelmed.' },
    mistakes: ['Modelling counts with a normal distribution when counts are small.', 'Using Poisson when the variance is much larger than the mean (over-dispersion). Try negative binomial instead.'],
    takeaways: ['Binomial = successes out of n', 'Poisson = events per interval; exponential = time between them', 't for small-sample means; chi-square for counts'],
    practice: { code: `from scipy.stats import binom, poisson
print(poisson.pmf(0, 3), 1 - poisson.cdf(6, 3))   # 0.0498, 0.0335
print(binom.pmf(0, 10, 0.1))                     # 0.349: no defects in 10 items at 10% rate` },
    check: [
      { q: 'Number of website sign-ups per hour is best modelled as…', options: ['Uniform', 'Poisson', 'Normal with negative values', 'Exponential'], answer: 1, why: 'A count of independent events per interval.' },
      { q: 'Number of heads in 10 coin flips follows…', options: ['Binomial', 'Poisson', 'Exponential', 't'], answer: 0, why: 'A fixed number of yes/no trials.' },
    ],
  },

  'sampling-clt': {
    minutes: 10,
    goals: ['Distinguish a population from a sample', 'State the Central Limit Theorem in plain English', 'Compute the standard error of a mean'],
    why: 'The CLT is why polls of 1,000 people can describe a nation, and why A/B tests, quality control and confidence intervals work at all.',
    explain: [
      'The **population** is everyone you care about; a **sample** is the subset you actually measure. Sample statistics (like the sample mean) vary from sample to sample.',
      '**Central Limit Theorem**: take many samples of size n and compute each sample\'s mean. Those means form a **normal** distribution, centred on the true mean, **whatever the shape of the original data**, as long as n is reasonably large (often 30+).',
      'The spread of those sample means is the **standard error** (SE) = σ / √n. Quadrupling the sample size halves the uncertainty.',
      'That is why averages are far more predictable than individual values: one customer\'s spend is wild; the average of 1,000 customers\' spends is very stable.',
    ],
    formula: { tex: '\\bar X \\approx \\mathcal{N}\\!\\left(\\mu, \\frac{\\sigma^2}{n}\\right), \\qquad SE = \\frac{\\sigma}{\\sqrt n}', plain: 'Sample means are roughly normal around the true mean, with spread σ / √n.' },
    example: { title: 'Average basket size', steps: ['Individual baskets are skewed: mean ₹500, SD ₹300', 'Sample n = 100 customers → SE = 300 / √100 = ₹30', 'So about 95% of sample means fall within ₹500 ± 2×30 = ₹440–₹560', 'With n = 400: SE = 300 / 20 = ₹15 (half the uncertainty)'], result: 'You need 4× the data for 2× the precision, a key rule for budgeting surveys and experiments.' },
    mistakes: ['Thinking the CLT makes the raw data normal. It is about the distribution of means.', 'Ignoring biased sampling: the CLT cannot fix a non-representative sample.'],
    takeaways: ['Sample means are approximately normal (CLT)', 'SE = σ / √n', '4× data → 2× precision'],
    practice: { code: `import numpy as np
rng = np.random.default_rng(0)
pop = rng.exponential(500, 1_000_000)          # very skewed "basket sizes"
means = [rng.choice(pop, 100).mean() for _ in range(5000)]
print(round(np.mean(means)), round(np.std(means), 1), round(pop.std() / 10, 1))  # SE ≈ σ/√n` },
    check: [
      { q: 'σ = 20, n = 25. Standard error of the mean?', options: ['4', '0.8', '20', '5'], answer: 0, why: '20 / √25 = 4.' },
      { q: 'To halve the standard error you need…', options: ['2× the data', '4× the data', '½ the data', '8× the data'], answer: 1, why: 'SE ∝ 1/√n.' },
    ],
  },

  'confidence-intervals': {
    minutes: 9,
    goals: ['Compute a 95% confidence interval for a mean', 'Interpret a CI correctly', 'Explain how sample size changes the width'],
    why: 'A point estimate without uncertainty is half an answer. "Conversion rose 2%" is very different from "2% ± 3%".',
    explain: [
      'A **confidence interval** gives a range of plausible values for an unknown quantity, such as the true average delivery time.',
      'Recipe for a mean: estimate ± (critical value × standard error). For 95% with a decent sample size the critical value is about **1.96** (≈ 2).',
      'Correct interpretation: if we repeated the sampling many times, **95% of the intervals built this way would contain the true value**. Think of a fishing net: 95% of the nets we throw catch the fish.',
      'Wider intervals come from more variability or smaller samples. More data narrows them.',
    ],
    formula: { tex: '\\bar x \\pm 1.96 \\cdot \\frac{s}{\\sqrt n}', plain: 'Sample mean plus or minus about two standard errors.' },
    example: { title: 'Average delivery time', steps: ['n = 100 deliveries, mean 52 min, SD 10 min', 'SE = 10 / √100 = 1 min', '95% CI = 52 ± 1.96 × 1 = 50.0 to 54.0 min'], result: 'We can promise "about 52 minutes, plausibly between 50 and 54". To halve the width to ±1 minute, deliver 4× the sample (400).' },
    mistakes: ['Saying "there is a 95% probability the true mean is in this interval" (a common but technically wrong reading of a frequentist CI).', 'Confusing a CI for the mean with the range of individual values.'],
    takeaways: ['CI = estimate ± ~2 SE', 'Wider = less certain', 'Always report uncertainty with an estimate'],
    practice: { code: `import numpy as np
from scipy import stats
x = np.random.default_rng(3).normal(52, 10, 100)
print(stats.t.interval(0.95, len(x) - 1, loc=x.mean(), scale=stats.sem(x)))` },
    check: [
      { q: 'Mean 80, SE 2. Approximate 95% CI?', options: ['78–82', '76–84', '79–81', '70–90'], answer: 1, why: '80 ± 1.96 × 2 ≈ 76–84.' },
      { q: 'What makes a CI narrower?', options: ['Smaller sample', 'Larger sample', 'Higher confidence level', 'More variable data'], answer: 1, why: 'More data reduces the standard error.' },
    ],
  },

  'hypothesis-testing': {
    minutes: 12,
    goals: ['Set up null and alternative hypotheses', 'Interpret a p-value correctly', 'Explain Type I and Type II errors and statistical power'],
    why: 'Hypothesis tests decide whether a new process, drug, price or website design really works, or whether the difference is just luck.',
    explain: [
      'Think of a **courtroom**. The **null hypothesis** (H₀) is "innocent": no effect, no difference. The **alternative** (H₁) is what you would like to show. You only reject H₀ if the evidence is strong.',
      'The **p-value** is the probability of seeing data at least this extreme **if H₀ were true**. A small p (below the chosen α, often 0.05) means the data would be surprising under "no effect", so we reject H₀.',
      'A p-value is **not** the probability that H₀ is true, and it says nothing about how large or important the effect is.',
      'Two ways to be wrong: a **Type I error** (false positive: convicting the innocent, probability α) and a **Type II error** (false negative: letting the guilty go). **Power** = 1 − P(Type II) is the chance of detecting a real effect; it grows with sample size.',
    ],
    example: { title: 'Is the coin fair?', steps: ['H₀: p(heads) = 0.5. Observed: 62 heads in 100 flips', 'Under H₀: mean 50, SD = √(100 × 0.5 × 0.5) = 5', 'z = (62 − 50) / 5 = 2.4 → two-sided p ≈ 0.016 (exact binomial test: p ≈ 0.021)', 'p < 0.05 → reject H₀ at the 5% level'], result: 'The evidence suggests the coin is biased. A single test is still only one piece of evidence, so replicate before betting the company.' },
    mistakes: ['"p = 0.03 means a 97% chance the effect is real" (wrong).', 'Treating p = 0.051 and p = 0.049 as completely different worlds.', 'Running many tests and reporting only the significant one (p-hacking).', 'Confusing statistical significance with business importance.'],
    takeaways: ['H₀ = no effect; reject only on strong evidence', 'p-value = how surprising the data is if H₀ were true', 'Always report the effect size and a CI alongside p'],
    practice: { code: `from scipy.stats import binomtest
r = binomtest(62, 100, 0.5)
print(round(r.pvalue, 4), r.proportion_ci())` },
    check: [
      { q: 'A Type I error is…', options: ['Missing a real effect', 'Declaring an effect that is not real', 'Using the wrong test', 'A small sample'], answer: 1, why: 'A false positive: rejecting a true H₀.' },
      { q: 'p = 0.20 means…', options: ['H₀ is true', 'Not enough evidence to reject H₀', 'The effect is 20%', 'The alternative is 80% likely'], answer: 1, why: 'Failing to reject is not proof of no effect.' },
    ],
  },

  't-test': {
    minutes: 9,
    goals: ['Choose between one-sample, two-sample and paired t-tests', 'Read a t-statistic and its p-value', 'Check the assumptions'],
    why: 'The t-test, invented by William Gosset to monitor Guinness beer quality, is still the workhorse for comparing two means: before vs after, plant A vs plant B.',
    explain: [
      'A **t-test** asks whether a difference in means is large compared with the noise. t = difference ÷ standard error of the difference.',
      '**One-sample**: is this mean different from a target (do bottles contain 500 ml)? **Two-sample (Welch)**: do two independent groups differ? **Paired**: the same units measured twice (before/after training).',
      'Paired tests are far more powerful when they apply, because each unit acts as its own control and removes person-to-person variation.',
      'Assumptions: independent observations and roughly normal data (or reasonably large samples). Use Welch\'s version by default; it does not assume equal variances.',
    ],
    formula: { tex: 't = \\frac{\\bar x_1 - \\bar x_2}{SE_{\\text{diff}}}', plain: 't = observed difference divided by its standard error (how many "noise units" apart the means are).' },
    example: { title: 'New fertiliser', steps: ['Plot A (old): mean height 50 cm; plot B (new): 53 cm; 30 plants each', 'Standard error of the difference = 1.25 cm', 't = (53 − 50) / 1.25 = 2.4', 'With ~58 degrees of freedom, p ≈ 0.02'], result: 'A 3 cm difference is unlikely to be pure luck. Next question: is 3 cm worth the extra cost?' },
    mistakes: ['Using an independent t-test on paired data.', 'Running t-tests on many pairs of groups (use ANOVA, or correct for multiple comparisons).'],
    takeaways: ['t = difference / noise', 'Paired data → paired t-test', 'Welch\'s t-test as the default for two groups'],
    use: ['Comparing two means with small to moderate samples'],
    avoid: ['Three or more groups (ANOVA)', 'Strongly skewed small samples (Mann–Whitney U)', 'Proportions with large samples (z-test / chi-square)'],
    practice: { code: `import numpy as np
from scipy import stats
rng = np.random.default_rng(1)
a, b = rng.normal(50, 5, 30), rng.normal(53, 5, 30)
print(stats.ttest_ind(a, b, equal_var=False))      # Welch's t-test
before = rng.normal(70, 8, 20); after = before + rng.normal(2, 2, 20)
print(stats.ttest_rel(before, after))              # paired` },
    check: [
      { q: 'Same 20 employees tested before and after training. Which test?', options: ['Two-sample t-test', 'Paired t-test', 'Chi-square', 'ANOVA'], answer: 1, why: 'Same units measured twice.' },
      { q: 'Difference 4, SE of difference 2. t = ?', options: ['0.5', '2', '8', '6'], answer: 1, why: '4 / 2 = 2.' },
    ],
  },

  'chi-square': {
    minutes: 9,
    goals: ['Test independence between two categorical variables', 'Run a goodness-of-fit test', 'Compute the chi-square statistic from observed and expected counts'],
    why: 'Is churn related to plan type? Are defects related to shift? Are survey answers evenly spread? Categorical questions like these are everywhere in business data.',
    explain: [
      'The chi-square test compares **observed counts** with the counts you would **expect** if there were no relationship.',
      '**Goodness of fit**: does one categorical variable match an expected distribution (is the die fair)?',
      '**Test of independence**: are two categorical variables related (plan type vs churned yes/no)? Expected count for a cell = row total × column total ÷ grand total.',
      'Big gaps between observed and expected give a large χ² and a small p-value. Rule of thumb: expected counts should be at least 5 in each cell.',
    ],
    formula: { tex: '\\chi^2 = \\sum \\frac{(O - E)^2}{E}', plain: 'For each cell: (observed − expected)² ÷ expected. Then add them all up.' },
    example: { title: 'Is the die loaded?', steps: ['60 rolls; expected 10 per face', 'Observed: 5, 8, 9, 8, 10, 20', 'χ² = (25 + 4 + 1 + 4 + 0 + 100) / 10 = 13.4', 'df = 6 − 1 = 5; the 5% critical value is 11.07 → p ≈ 0.02'], result: 'Reject "fair die". The face with 20 sixes drives almost all of the statistic.' },
    mistakes: ['Using percentages instead of counts.', 'Applying it with tiny expected counts (use Fisher\'s exact test instead).', 'Reading "significant" as "strong": with huge samples, tiny relationships become significant. Report Cramér\'s V.'],
    takeaways: ['Compares observed vs expected counts', 'Independence test for two categorical variables', 'Needs expected counts ≥ 5'],
    practice: { code: `from scipy.stats import chisquare, chi2_contingency
print(chisquare([5, 8, 9, 8, 10, 20]))                       # goodness of fit
table = [[120, 30], [80, 70]]                                # plan A/B × stayed/churned
chi2, p, dof, expected = chi2_contingency(table); print(round(chi2, 2), round(p, 5))` },
    check: [
      { q: 'O = 15, E = 10 for one cell. Its contribution to χ²?', options: ['0.5', '2.5', '25', '5'], answer: 1, why: '(15 − 10)² / 10 = 2.5.' },
      { q: 'Which question suits a chi-square independence test?', options: ['Is average salary different by gender?', 'Is churn (yes/no) related to plan type?', 'Does price predict sales?', 'Is height normally distributed?'], answer: 1, why: 'Two categorical variables.' },
    ],
  },

  anova: {
    minutes: 9,
    goals: ['Explain why ANOVA beats multiple t-tests', 'Interpret the F-statistic', 'Follow up with post-hoc tests'],
    why: 'Comparing three suppliers, four ad creatives or five machine settings is common. Running many t-tests inflates false positives; ANOVA handles all groups in one test.',
    explain: [
      'With 5 groups there are 10 pairwise t-tests. At α = 0.05 each, the chance of at least one false positive is about 40%. **ANOVA** (analysis of variance) controls this.',
      'Idea: compare the variation **between** group means with the variation **within** groups. If the groups differ much more than the individuals inside them, the means probably differ.',
      'The **F-statistic** = between-group variance ÷ within-group variance. F near 1 means no evidence of a difference; large F means a small p-value.',
      'ANOVA only tells you that *some* group differs. Use a **post-hoc** test (Tukey HSD) to find which ones.',
    ],
    formula: { tex: 'F = \\frac{\\text{variance between groups}}{\\text{variance within groups}}', plain: 'How spread out the group averages are, relative to the noise inside each group.' },
    example: { title: 'Three call scripts', steps: ['Average sales per agent: Script A 20, B 22, C 27 (10 agents each)', 'Variation between the three means is large relative to agent-to-agent variation', 'Software reports F = 6.1, p = 0.006', 'Tukey HSD: C beats A and B; A vs B is not significant'], result: 'Roll out script C. Without the post-hoc test you would not know which script to choose.' },
    mistakes: ['Stopping at "significant ANOVA" without a post-hoc test.', 'Ignoring very unequal variances (use Welch\'s ANOVA).'],
    takeaways: ['One test for 3+ group means', 'F = between ÷ within variation', 'Post-hoc tests identify which groups differ'],
    practice: { code: `import numpy as np
from scipy.stats import f_oneway
from statsmodels.stats.multicomp import pairwise_tukeyhsd
rng = np.random.default_rng(0)
a, b, c = rng.normal(20, 4, 10), rng.normal(22, 4, 10), rng.normal(27, 4, 10)
print(f_oneway(a, b, c))
print(pairwise_tukeyhsd(np.r_[a, b, c], ["A"]*10 + ["B"]*10 + ["C"]*10))`, note: 'statsmodels may not be available in the in-browser runner; run this locally.' },
    check: [
      { q: 'F ≈ 1 suggests…', options: ['Strong group differences', 'No evidence the group means differ', 'Perfect fit', 'An error'], answer: 1, why: 'Between-group variation is similar to the noise.' },
      { q: 'ANOVA is significant. Next step?', options: ['Done', 'A post-hoc test such as Tukey HSD', 'Delete a group', 'Run a chi-square'], answer: 1, why: 'ANOVA does not say which groups differ.' },
    ],
  },

  correlation: {
    minutes: 8,
    goals: ['Interpret Pearson\'s r from −1 to +1', 'Know when to use Spearman instead', 'Explain why correlation is not causation'],
    why: 'Correlation is the first look at which drivers move together, and the most misused statistic in business decks.',
    explain: [
      '**Pearson\'s r** measures the strength and direction of a **linear** relationship: +1 is a perfect upward line, −1 a perfect downward line, 0 no linear relationship.',
      '**Spearman\'s ρ** correlates the ranks instead of the values. Use it for monotonic but curved relationships, or when there are outliers.',
      'r = 0 does **not** mean "no relationship": a perfect U-shape has r ≈ 0. Always plot the data.',
      '**Correlation is not causation.** Ice-cream sales and drownings are correlated because both rise in summer (a confounder). To claim causation you need an experiment or careful causal methods.',
    ],
    formula: { tex: 'r = \\frac{\\operatorname{Cov}(x,y)}{\\sigma_x \\sigma_y}', plain: 'How much x and y move together, scaled to lie between −1 and +1.' },
    example: { title: 'Marketing spend vs sales', steps: ['12 months of data: r = 0.85 between ad spend and sales', 'Tempting conclusion: "ads cause sales"', 'But the budget is raised every festival season, when sales rise anyway', 'Season is a confounder → run a geo-experiment to measure the real effect'], result: 'Strong correlation is a lead to investigate, not proof of impact.' },
    mistakes: ['Inferring causation from correlation.', 'Using Pearson on curved relationships or with outliers.', 'Ignoring the scatter plot.'],
    takeaways: ['r measures linear association, from −1 to +1', 'Spearman for ranks, curves and outliers', 'Confounders create misleading correlations'],
    practice: { code: `import pandas as pd, numpy as np
rng = np.random.default_rng(0)
df = pd.DataFrame({"spend": rng.uniform(1, 10, 50)})
df["sales"] = 3 * df.spend + rng.normal(0, 3, 50)
print(df.corr(method="pearson").round(2)); print(df.corr(method="spearman").round(2))` },
    check: [
      { q: 'r = −0.9 means…', options: ['No relationship', 'A strong negative linear relationship', 'A weak positive one', 'x causes y to fall'], answer: 1, why: 'Close to −1 is strongly negative; it says nothing about causation.' },
      { q: 'y = x² for x from −5 to 5. Pearson r is about…', options: ['1', '0', '−1', '0.5'], answer: 1, why: 'A symmetric U-shape has no linear trend.' },
    ],
  },

  bootstrap: {
    minutes: 8,
    goals: ['Explain bootstrap resampling', 'Build a bootstrap confidence interval', 'Know when the bootstrap is useful'],
    why: 'The bootstrap gives uncertainty estimates for almost any statistic (median, ratio, model accuracy) without formulas. It is also the "bagging" inside random forests.',
    explain: [
      'You have one sample. Pretend it is the population: draw a new sample of the **same size with replacement** (some rows appear twice, some not at all) and compute your statistic.',
      'Repeat thousands of times. The spread of those statistics approximates the sampling uncertainty.',
      'A **percentile CI**: take the 2.5th and 97.5th percentiles of the bootstrap statistics.',
      'Great for medians, percentiles, ratios and custom business metrics where no simple formula exists.',
    ],
    example: { title: 'Median delivery time', steps: ['50 delivery times; observed median 38 min', 'Resample 50 times with replacement → median 37; again → 39; …', 'Repeat 10,000 times', '2.5th and 97.5th percentiles of the medians: 35 and 41 min'], result: '95% bootstrap CI for the median: 35–41 minutes, with no formula needed.' },
    mistakes: ['Resampling without replacement (that just shuffles the data).', 'Bootstrapping very small samples (fewer than ~20) and trusting the result.', 'Ignoring dependence (time series need a block bootstrap).'],
    takeaways: ['Resample with replacement, recompute, repeat', 'The spread of the results = uncertainty', 'Works for almost any statistic'],
    practice: { code: `import numpy as np
rng = np.random.default_rng(0)
x = rng.gamma(4, 10, 50)
meds = [np.median(rng.choice(x, len(x), replace=True)) for _ in range(10_000)]
print(round(np.median(x), 1), np.percentile(meds, [2.5, 97.5]).round(1))` },
    check: [
      { q: 'Bootstrap samples are drawn…', options: ['Without replacement, half size', 'With replacement, same size', 'From a normal distribution', 'From the test set'], answer: 1, why: 'Same size, with replacement.' },
      { q: 'Which ensemble method is built on the bootstrap?', options: ['Gradient boosting', 'Bagging / random forest', 'k-means', 'PCA'], answer: 1, why: 'Bagging = bootstrap aggregating.' },
    ],
  },

  'ab-testing': {
    minutes: 11,
    goals: ['Design an A/B test with a clear metric and sample size', 'Analyse a conversion-rate test', 'Avoid peeking and other classic pitfalls'],
    why: 'Amazon, Booking.com and Netflix run thousands of experiments a year. A/B testing is how product decisions move from opinion to evidence.',
    explain: [
      'Randomly split users into **control (A)** and **variant (B)**. Randomisation balances everything else, so differences in outcome can be attributed to the change.',
      'Before starting, decide: the **primary metric** (e.g. conversion), the **minimum detectable effect** worth acting on, α and power, and therefore the **sample size**. Then run to that size.',
      'Analyse with a two-proportion z-test (or a t-test for averages) and report the **effect with a confidence interval**, not just a p-value.',
      'Pitfalls: **peeking** and stopping as soon as p < 0.05 (inflates false positives), testing many metrics, novelty effects, and sample-ratio mismatch (the split is not really 50/50).',
    ],
    example: { title: 'New checkout button', steps: ['A: 1,000 visitors, 50 purchases (5.0%)', 'B: 1,000 visitors, 65 purchases (6.5%)', 'Pooled rate 5.75%; SE of difference = √(0.0575 × 0.9425 × 2/1000) ≈ 0.0104', 'z = 0.015 / 0.0104 ≈ 1.44 → p ≈ 0.15'], result: 'A +1.5-point lift looks great but is not statistically convincing with 1,000 per arm. The test was under-powered: detecting this lift with 80% power needs roughly 3,800 visitors per arm.' },
    mistakes: ['No sample-size calculation up front.', 'Peeking daily and stopping early.', 'Declaring victory on a secondary metric after the primary metric failed.'],
    takeaways: ['Randomise, pre-register the metric and sample size', 'Report the lift with a CI', 'No peeking (or use sequential methods)'],
    practice: { code: `from statsmodels.stats.proportion import proportions_ztest, confint_proportions_2indep
from statsmodels.stats.power import NormalIndPower
from statsmodels.stats.proportion import proportion_effectsize
print(proportions_ztest([65, 50], [1000, 1000]))
print(confint_proportions_2indep(65, 1000, 50, 1000))
es = proportion_effectsize(0.065, 0.05)
print(round(NormalIndPower().solve_power(es, alpha=0.05, power=0.8)))   # visitors per arm`, note: 'Uses statsmodels: run locally if the in-browser runner lacks it.' },
    check: [
      { q: 'Why randomise users into A and B?', options: ['To get more traffic', 'To balance all other factors so the change explains the difference', 'It is a legal requirement', 'To reduce cost'], answer: 1, why: 'Randomisation removes confounding.' },
      { q: 'Stopping the test the first time p < 0.05 leads to…', options: ['More power', 'An inflated false-positive rate', 'Exact results', 'Smaller samples, same accuracy'], answer: 1, why: 'Repeated peeking gives many chances to hit significance by luck.' },
    ],
  },

  'bayes-theorem': {
    minutes: 10,
    goals: ['State Bayes\' theorem in words', 'Compute a posterior probability from base rate and test accuracy', 'Explain the base-rate fallacy'],
    why: 'Spam filters, medical diagnosis, fraud alerts and Bayesian A/B testing all update beliefs with evidence. Ignoring base rates leads to badly wrong decisions.',
    explain: [
      'Bayes\' theorem tells you how to **update a belief** when new evidence arrives: **posterior ∝ likelihood × prior**.',
      'The **prior** is what you believed before (1% of transactions are fraud). The **likelihood** is how probable the evidence is under each hypothesis (an alert fires for 99% of frauds but also for 5% of normal transactions).',
      'The **posterior** is the updated belief: given that the alert fired, how likely is fraud?',
      'The famous surprise: when the base rate is low, even an accurate test produces mostly false alarms. That is the **base-rate fallacy**.',
    ],
    formula: { tex: 'P(H\\mid E) = \\frac{P(E\\mid H)\\,P(H)}{P(E)}', plain: 'Belief in H after seeing evidence E = how well H explains E × prior belief in H, normalised.' },
    example: { title: 'A positive medical test', steps: ['Prevalence (prior) 1%; sensitivity 99%; false-positive rate 5%', 'Out of 10,000 people: 100 sick → 99 test positive', '9,900 healthy → 5% = 495 false positives', 'P(sick | positive) = 99 / (99 + 495) ≈ 16.7%'], result: 'A "99% accurate" test gives only a 17% chance of disease after one positive result. Confirmatory tests exist for exactly this reason.' },
    mistakes: ['Ignoring the base rate (prior).', 'Confusing P(positive | sick) with P(sick | positive).'],
    takeaways: ['Posterior ∝ likelihood × prior', 'Low base rates → many false positives', 'Think in natural frequencies (out of 10,000 people)'],
    practice: { code: `prior, sens, fpr = 0.01, 0.99, 0.05
p_pos = sens * prior + fpr * (1 - prior)
print(round(sens * prior / p_pos, 3))      # 0.167` },
    check: [
      { q: 'Base rate 0.1%, test sensitivity 100%, false-positive rate 1%. After a positive test, P(condition) is roughly…', options: ['99%', '50%', '9%', '1%'], answer: 2, why: 'Out of 100,000: 100 true positives vs ~1,000 false positives → about 9%.' },
      { q: 'In Bayes\' theorem the "prior" is…', options: ['The evidence', 'The belief before seeing the evidence', 'The test accuracy', 'The final answer'], answer: 1, why: 'The prior is updated into the posterior.' },
    ],
  },

  mle: {
    minutes: 10,
    goals: ['Explain the idea of likelihood', 'Find a maximum likelihood estimate in a simple case', 'Connect MLE to familiar loss functions'],
    why: 'MLE is the principle behind logistic regression, Poisson regression, GMMs and most statistical models. Log-loss and MSE are likelihoods in disguise.',
    explain: [
      'A model with parameters can say how probable your observed data is. The **likelihood** is that probability, viewed as a function of the parameters.',
      '**Maximum likelihood estimation** picks the parameters that make the observed data most probable: "turn the dials until the machine is most likely to produce what you actually saw."',
      'In practice we maximise the **log-likelihood** (products become sums, which is easier and more numerically stable).',
      'Hidden connections: with normal errors, maximising likelihood = minimising squared error (OLS). For yes/no outcomes it = minimising log-loss (logistic regression).',
    ],
    formula: { tex: '\\hat\\theta = \\arg\\max_\\theta \\prod_i p(x_i \\mid \\theta) = \\arg\\max_\\theta \\sum_i \\log p(x_i\\mid\\theta)', plain: 'Choose the parameter value that gives the highest (log) probability to the observed data.' },
    example: { title: 'Conversion rate from 10 visitors', steps: ['Observed: 7 conversions out of 10', 'Likelihood L(p) = p⁷(1 − p)³', 'Try p = 0.5 → L = 0.00098; p = 0.7 → L = 0.00222; p = 0.9 → L = 0.00048', 'Calculus confirms the maximum at p = 7/10 = 0.7'], result: 'The MLE equals the sample proportion, matching intuition. The likelihood framework then extends to models with many parameters.' },
    mistakes: ['Confusing likelihood with the probability of the parameter (that is Bayesian posterior territory).', 'Overfitting with tiny samples: MLE from 1 conversion out of 1 says p = 100%.'],
    takeaways: ['Likelihood = how probable the data is under given parameters', 'MLE = parameters that maximise it', 'OLS and log-loss are special cases'],
    practice: { code: `import numpy as np
from scipy.optimize import minimize_scalar
nll = lambda p: -(7 * np.log(p) + 3 * np.log(1 - p))     # negative log-likelihood
print(minimize_scalar(nll, bounds=(0.01, 0.99), method="bounded").x)   # ≈ 0.7` },
    check: [
      { q: '3 defects in 100 items. MLE of the defect rate?', options: ['0.3', '0.03', '3', '0.97'], answer: 1, why: 'For binomial data the MLE is successes / trials.' },
      { q: 'With normally distributed errors, MLE for linear regression equals…', options: ['Minimising absolute error', 'Ordinary least squares', 'Maximising R² only', 'Gradient boosting'], answer: 1, why: 'The normal log-likelihood is a negative sum of squared errors (scaled).' },
    ],
  },
};
