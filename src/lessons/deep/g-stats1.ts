import { DeepLesson } from './types';

// STATISTICS PART 1 — textbook chapters. All numbers verified with Python (numpy / scipy).
const NORM = "Math.exp(-x*x/2)/Math.sqrt(2*Math.PI)";

export const STATS1_DEEP: Record<string, DeepLesson> = {
  // =====================================================================
  'descriptive-stats': {
    minutes: 19,
    hook: "Your manager forwards a spreadsheet with 12,000 rows of delivery times and asks one question: “So, are we fast or not?” Nobody can read 12,000 numbers. You need to squeeze them into two or three numbers that tell the truth, without hiding the bad days. That squeezing is **descriptive statistics**, and doing it well (or badly) is the difference between an honest dashboard and a misleading one.",
    sections: [
      {
        heading: 'The problem: too many numbers, not enough understanding',
        blocks: [
          { p: "Every business collects lists of numbers: sales per store, salaries per employee, minutes per delivery, defects per shift. A list on its own is almost useless to a decision-maker. What they want is a short, faithful summary: what is typical, how much things vary, and whether anything strange is going on." },
          { term: 'Dataset', def: "A collection of measurements, usually arranged as a table. Each row is one thing measured (a delivery, a customer, a machine) and each column is one measurement about it (minutes, rupees, temperature)." },
          { term: 'Descriptive statistics', def: "Numbers and pictures that summarise a dataset you already have: its typical value, its spread and its shape. They describe; they do not, by themselves, predict or prove anything." },
          { p: "There are three questions every summary should answer. **Where is the centre?** (What does a typical value look like?) **How spread out is it?** (Are the values all close together or all over the place?) **What shape does it have?** (Is it symmetric, or does it have a long tail of extreme values?)" },
          { term: 'Distribution', def: "The pattern of how often each value (or range of values) occurs in the data. A picture of the distribution shows at a glance where values pile up and where they thin out." },
        ],
      },
      {
        heading: 'Building the intuition: describing a city’s weather to a friend',
        blocks: [
          { p: "Imagine a friend is moving to your city and asks, “What is the weather like?” You would not read out every day’s temperature for the last year. You would say something like: “It’s usually around 30 degrees. It rarely drops below 22 or goes above 38. And every summer there are a few brutal days over 42.”" },
          { p: "Look at what you just did. You gave a **typical value** (around 30). You gave a **range where most days fall** (22 to 38). And you warned about **unusual days** (the 42-degree heatwaves). That is descriptive statistics, done by instinct." },
          { steps: [
            "**Say what is typical.** One number that represents an ordinary day.",
            "**Say how much it varies.** A friend moving from a city where every day is 25 degrees needs to know your city swings a lot.",
            "**Mention the shape.** Are hot days and cold days equally common, or is there a long tail on one side?",
            "**Flag the oddities.** The rare extreme days matter for planning (buy an air conditioner).",
          ], title: 'What a good summary always contains' },
          { p: "Now a trap. Ask about **house prices** instead: most homes sell for ₹60 to ₹90 lakh, but a handful of sea-facing bungalows sell for ₹40 crore. Add up all prices and divide by the count, and those bungalows drag the answer far above what an ordinary buyer pays. The “typical” number depends on how you calculate it." },
          { think: { q: "Ten people sit in a café, each earning about ₹50,000 a month. A billionaire walks in. What happens to the average income in the room, and to the income of the person in the middle?", a: "The average (add up and divide) shoots up to crores per person, even though nobody else got richer. The income of the middle person, if you line everyone up from poorest to richest, barely moves. This is exactly the difference between the mean and the median, which we define next." } },
        ],
      },
      {
        heading: 'How to summarise a dataset, step by step',
        blocks: [
          { diagram: { kind: 'flow', nodes: ['**Look** at the data: plot a histogram', '**Centre**: mean and median', '**Spread**: standard deviation and IQR', '**Shape**: symmetric or skewed?', '**Outliers**: check, explain, report'], caption: "The routine an experienced analyst follows before any modelling. The picture comes first, because a single number can hide a lot." } },
          { p: "**Step 1: Look.** Draw a histogram: split the range of values into equal-width bins and count how many values fall into each." },
          { term: 'Histogram', def: "A bar chart of counts. The horizontal axis is divided into equal bins (for example ₹0–20k, ₹20–40k …) and each bar’s height is how many values fall in that bin." },
          { p: "**Step 2: Centre.** Compute the **mean** and the **median**. A big gap between them is the first sign of a long tail." },
          { term: 'Mean, median and mode', def: "The **mean** is the ordinary average: add all values and divide by how many there are. The **median** is the middle value after sorting (half the values are below it, half above). The **mode** is the value that occurs most often." },
          { p: "**Step 3: Spread.** Compute the **standard deviation** (the typical distance of a value from the mean) and the **interquartile range** (the width of the middle half of the data)." },
          { p: "**Step 4: Shape.** Is the histogram symmetric like a bell, or **skewed** with a tail stretching to one side?" },
          { term: 'Skewed', def: "Lopsided. A right-skewed (positively skewed) distribution has most values bunched on the left and a long tail of large values stretching to the right. A left-skewed one is the mirror image." },
          { p: "**Step 5: Outliers.** Look for values far from the rest. Some are data errors (a delivery time of −5 minutes), some are real and important (a fraud transaction). Never delete them silently: investigate, then decide." },
          { term: 'Outlier', def: "A value that is unusually far from the bulk of the data. A common rule of thumb flags anything more than 1.5 IQRs below the first quartile or above the third quartile." },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { p: "We use the letter n for the number of values and x₁, x₂, …, xₙ for the values themselves. The mean is written x̄ (“x-bar”)." },
          { tex: '\\bar x = \\frac{1}{n}\\sum_{i=1}^{n} x_i', plain: "Add up all n values and divide by n. Every value contributes equally, which is exactly why one huge value can move the mean a lot.", symbols: [['\\bar x', 'the sample mean'], ['n', 'number of values'], ['x_i', 'the i-th value'], ['\\sum', 'add up everything that follows']] },
          { p: "Now spread. A natural idea is: how far is each value from the mean, on average? The trouble is that distances above the mean are positive and below are negative, and they always cancel out to exactly zero. So we **square** each distance first (making every term positive), average them, and then take the square root to get back to the original units." },
          { term: 'Variance and standard deviation', def: "The **variance** is the average squared distance from the mean. The **standard deviation** (SD) is its square root, which puts it back in the original units (minutes, rupees). Read the SD as “the typical distance of a value from the mean”." },
          { tex: 's = \\sqrt{\\frac{1}{n-1}\\sum_{i=1}^{n} (x_i - \\bar x)^2}', plain: "For each value, measure its distance from the mean and square it. Add these up, divide by n − 1, and take the square root.", symbols: [['s', 'sample standard deviation'], ['s^2', 'sample variance'], ['x_i - \\bar x', 'deviation of value i from the mean']] },
          { p: "Why divide by n − 1 and not n? Because the sample mean is calculated from the same data, it sits a little closer to the data than the true population mean would. The squared distances therefore come out slightly too small on average. Dividing by n − 1 instead of n makes the variance correct on average." },
          { callout: "Software differs here. pandas `Series.std()` divides by n − 1 by default; NumPy `np.std()` divides by n unless you pass `ddof=1`. If two tools disagree slightly, this is usually why.", tone: 'warn' },
          { p: "Finally, **quartiles**. Sort the data. The first quartile Q1 is the value with a quarter of the data below it; the median is Q2; the third quartile Q3 has three-quarters below it. The interquartile range IQR = Q3 − Q1 is the width of the middle 50%." },
          { term: 'Quartiles and IQR', def: "Quartiles cut sorted data into four equal-sized parts. Q1 is the 25th percentile, Q3 the 75th percentile. The **interquartile range** (IQR = Q3 − Q1) measures spread while ignoring the most extreme quarter on each side, so outliers cannot distort it." },
          { tex: '\\text{IQR} = Q_3 - Q_1, \\qquad \\text{outlier if } x < Q_1 - 1.5\\,\\text{IQR} \\;\\text{ or }\\; x > Q_3 + 1.5\\,\\text{IQR}', plain: "The middle half of the data spans Q1 to Q3. Anything more than one and a half middle-halves beyond either edge is flagged for a closer look.", symbols: [['Q_1, Q_3', 'first and third quartiles']] },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'The CEO bonus problem (mean vs median)', setup: "Five employees receive monthly bonuses (₹ thousand): 2, 3, 3, 4, 100. The last one is the CEO. What is the typical bonus?", steps: [
            "Mean = (2 + 3 + 3 + 4 + 100) / 5 = 112 / 5 = 22.4, so ₹22,400.",
            "Median: the values are already sorted; the middle (3rd) value is 3, so ₹3,000.",
            "Mode: 3 appears twice, every other value once, so the mode is also ₹3,000.",
            "Four of the five people received ₹4,000 or less, yet the mean claims ₹22,400.",
            "Remove the CEO and the mean drops to (2 + 3 + 3 + 4) / 4 = 3.0, while the median moves only from 3 to 3.0.",
          ], result: "“Average bonus ₹22,400” is arithmetically correct and practically misleading. For skewed data like pay, report the median, or both." } },
          { example: { title: 'Two couriers with the same average', setup: "Delivery delays (days late) for five recent orders. Courier A: 4, 6, 8, 10, 12. Courier B: 7, 8, 8, 8, 9. Which courier is more reliable?", steps: [
            "Both means are 8: A gives 40 / 5 = 8 and B gives 40 / 5 = 8. On the mean alone they look identical.",
            "Courier A deviations from 8: −4, −2, 0, 2, 4. Squared: 16, 4, 0, 4, 16. Sum = 40.",
            "Variance A = 40 / (5 − 1) = 10. SD A = √10 ≈ 3.16 days.",
            "Courier B deviations: −1, 0, 0, 0, 1. Squared: 1, 0, 0, 0, 1. Sum = 2.",
            "Variance B = 2 / 4 = 0.5. SD B = √0.5 ≈ 0.71 days.",
          ], result: "Same average, very different reliability. Courier B is predictable to within about a day; Courier A swings by about three days. If your customers hate surprises, B wins. Always report a spread alongside a centre." } },
          { example: { title: 'Machine downtime on a production line', setup: "Minutes of unplanned downtime on 10 shifts at an auto-parts plant: 12, 15, 17, 18, 20, 22, 25, 27, 30, 95. Summarise and check for outliers.", steps: [
            "Mean = 281 / 10 = 28.1 minutes. Median = average of 5th and 6th values = (20 + 22) / 2 = 21 minutes.",
            "Q1 (pandas default method): position 0.25 × (10 − 1) = 2.25 in the sorted list counting from 0, so 17 + 0.25 × (18 − 17) = 17.25.",
            "Q3: position 0.75 × 9 = 6.75, so 25 + 0.75 × (27 − 25) = 26.5. IQR = 26.5 − 17.25 = 9.25.",
            "Upper fence = 26.5 + 1.5 × 9.25 = 40.375. Lower fence = 17.25 − 13.875 = 3.375.",
            "95 is above 40.375, so it is flagged as an outlier. Without it, the mean is 186 / 9 ≈ 20.7 and the median is 20.",
            "SD with the outlier ≈ 24.1 minutes; without it ≈ 5.9 minutes. One shift quadruples the apparent variability.",
          ], result: "The typical shift loses about 20 minutes. The 95-minute shift is not “noise to be deleted”: it is the most important row in the table. Find out what broke." } },
        ],
      },
      {
        heading: 'Choosing the right summary for the shape of your data',
        blocks: [
          { p: "For symmetric data, the mean and the median almost coincide, and the mean with the standard deviation is the classic summary. For skewed data they separate, and you need to choose deliberately." },
          { diagram: { kind: 'curve', fn: "x>0 ? Math.exp(-Math.pow(Math.log(x/10),2)/(2*0.36))/(x*0.6*Math.sqrt(2*Math.PI)) : 0", xMin: 0, xMax: 40, marks: [{ x: 7.0, label: 'mode ≈ 7.0' }, { x: 10, label: 'median 10' }, { x: 12.0, label: 'mean ≈ 12.0' }], xLabel: 'annual salary (₹ lakh)', yLabel: 'density', caption: "A right-skewed salary distribution. The peak (mode) is at about ₹7 lakh, half of employees earn under ₹10 lakh (median), but the long right tail drags the mean up to about ₹12 lakh. In right-skewed data the order is almost always mode < median < mean." } },
          { diagram: { kind: 'bars', labels: ['0–20k', '20–40k', '40–60k', '60–80k', '80–100k', '100–120k', '120k+'], values: [30, 70, 45, 25, 15, 8, 7], highlight: 1, yLabel: 'employees', caption: "Histogram of monthly salaries at a 200-person firm (illustrative). The tallest bar (₹20–40k) is where most people are, and the tail to the right is why the mean sits above the median." } },
          { bullets: [
            "**Roughly symmetric, no extreme values** (heights, machine tolerances, exam scores): report mean and standard deviation.",
            "**Skewed or with outliers** (salaries, house prices, delivery times, claim sizes): report median and IQR, and consider adding the mean so readers see the tail’s effect.",
            "**Categories** (favourite brand, car colour): only the mode makes sense; there is no average of “red” and “blue”.",
            "**Totals matter** (budgeting total fuel cost): use the mean, because mean × count = total.",
          ] },
          { think: { q: "A ride-hailing app reports “average wait time 4 minutes”. Riders complain that waits are terrible. Can both be true?", a: "Yes. Wait times are right-skewed: most rides arrive in 2 to 3 minutes, but a minority take 15 to 20. The mean can be modest while one rider in ten has an awful experience. A percentile such as “90% of riders wait under 9 minutes” describes the pain far better than the mean." } },
          { callout: "Percentiles generalise quartiles. The 90th percentile (P90) is the value 90% of observations fall below. Operations teams set service-level targets on P90 or P95, not on the mean, because customers remember the bad days.", tone: 'key' },
        ],
      },
      {
        heading: 'Descriptive statistics in the real world',
        blocks: [
          { case: { title: 'Delivery-time dashboard at an e-commerce company (illustrative)', story: "An online retailer’s weekly dashboard showed one number: mean delivery time, steady at 2.1 days for months. Customer complaints, however, were rising. An analyst replaced the single number with a small table per city: median, P90 and the share of orders over 5 days. The median was indeed stable at about 1.8 days, but in three tier-2 cities the P90 had crept from 4 to 7 days because one courier partner was struggling. The mean had barely moved because big metro volumes, which were fine, dominated it. Switching partners in those cities cut complaints within a month. Nothing clever was needed: just the right summary." } },
          { bullets: [
            "**Finance:** reporting median and IQR of invoice-to-payment days to spot customers who pay late.",
            "**Manufacturing:** tracking mean and SD of a part’s diameter on every shift; a rising SD warns of tool wear before parts go out of tolerance.",
          ] },
          { diagram: { kind: 'table', head: ['Statistic', 'Downtime with outlier', 'Without outlier', 'Robust to outliers?'], rows: [['Mean', '28.1 min', '20.7 min', 'No'], ['Median', '21.0 min', '20.0 min', 'Yes'], ['Standard deviation', '24.1 min', '5.9 min', 'No'], ['IQR (pandas default)', '9.25 min', '8.0 min', 'Mostly'], ['Max', '95 min', '30 min', 'No']], caption: "The downtime example in one table. The median and IQR barely move when the extreme shift is removed; the mean, SD and maximum change dramatically." } },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            "**Reporting a centre with no spread.** “Average return 12%” means little without knowing it ranged from −30% to +50%.",
            "**Using the mean for skewed data.** It describes nobody in particular. Use the median, or report both.",
            "**Deleting outliers to make charts look neat.** The outlier may be the fraud, the breakdown or the data-entry bug you most need to find.",
            "**Trusting a summary without a plot.** Very different datasets can share the same mean and SD (a famous demonstration is Anscombe’s quartet). Always look at the histogram.",
          ] },
          { diagram: { kind: 'compare', left: { title: 'Mean and standard deviation', items: ['Use every value', 'Easy maths: mean × n = total', 'Ideal for symmetric data', 'Pulled strongly by outliers', 'Foundation for later tools (z-scores, t-tests)'] }, right: { title: 'Median and IQR', items: ['Depend on the order of values, not their size', 'Cannot give totals', 'Ideal for skewed data', 'Barely affected by outliers', 'Natural partner of box plots and percentiles'] }, caption: "Neither pair is “better”. Choose the pair that matches the shape of your data and the decision you need to make, and say which one you used." } },
          { callout: "Descriptive statistics summarise the data you have. They do not tell you whether a difference between two groups is real or just luck. That needs inferential statistics: sampling, confidence intervals and hypothesis tests, which later chapters build on top of these ideas.", tone: 'key' },
        ],
      },
    ],
    faq: [
      { q: "When should I use the median instead of the mean?", a: "Whenever the data is skewed or has outliers: incomes, prices, delivery times, claim sizes, website session lengths. If the mean and median differ a lot, that gap is itself worth reporting." },
      { q: "Why is standard deviation used more than the simpler average distance from the mean?", a: "The average absolute distance (called the mean absolute deviation) is perfectly sensible and more robust. The SD wins mainly because squared distances have neat mathematical properties: variances of independent quantities add up, and the SD is the natural width parameter of the normal distribution, which much of statistics is built on." },
      { q: "Should I divide by n or n − 1?", a: "Divide by n − 1 when your data is a sample and you want to estimate the spread of the larger population (the usual case). Divide by n only if your data is the entire population and you just want to describe it. For large n the difference is tiny." },
      { q: "What is a ‘good’ standard deviation?", a: "There is no universal good value; it depends on the units and the context. A useful trick is the coefficient of variation, SD ÷ mean, which expresses spread as a percentage of the typical value and lets you compare, for example, the variability of ₹ sales and of unit sales." },
      { q: "What does `df.describe()` in pandas give me?", a: "For each numeric column: count, mean, standard deviation (divided by n − 1), minimum, 25th percentile, median (50%), 75th percentile and maximum. It is the fastest first look at a new dataset." },
    ],
  },

  // =====================================================================
  'normal-distribution': {
    minutes: 18,
    hook: "A plant in Pune makes 50,000 bolts a day. Each should be 10.00 mm across, but no machine is perfect: some come out at 9.98, some at 10.03. The quality head needs to know, before the customer complains, how many bolts will fall outside the tolerance. She does not measure all 50,000. She uses one shape, the **normal distribution**, and two numbers, and gets an answer accurate enough to run the business on.",
    sections: [
      {
        heading: 'The problem: predicting how often the unusual happens',
        blocks: [
          { p: "Descriptive statistics tell you the centre and spread of data you have already collected. Businesses usually need more: **how often will something happen in the future?** How many bolts will be rejected next month? What share of customers are taller than a car seat was designed for? How long a warranty can we offer before too many batteries fail?" },
          { p: "To answer such questions you need a **model** of the variation: a mathematical description of how likely each value is. Among all such models, one shape turns up so often in nature and industry that it got the name “normal”." },
          { term: 'Probability distribution', def: "A rule that says how likely each possible value (or range of values) is. For measurements such as length or time, it is drawn as a smooth curve, and the **area under the curve** over a range is the probability of landing in that range." },
          { term: 'Normal distribution', def: "The symmetric bell-shaped distribution. It is fully described by two numbers: its mean μ (where the centre is) and its standard deviation σ (how wide it is). Also called the Gaussian distribution, after the mathematician Carl Friedrich Gauss." },
          { diagram: { kind: 'curve', fn: NORM, xMin: -4, xMax: 4, shade: [-1, 1], marks: [{ x: -1, label: 'μ − σ' }, { x: 0, label: 'μ' }, { x: 1, label: 'μ + σ' }], xLabel: 'distance from the mean (in standard deviations)', yLabel: 'density', caption: "The standard normal curve. The shaded area between one SD below and one SD above the mean is about 0.68: roughly two-thirds of all values land there. The curve never quite touches zero, but beyond ±3 SD it is very close." } },
        ],
      },
      {
        heading: 'Building the intuition: the bean machine',
        blocks: [
          { p: "Picture a tall board with rows of pins, the kind you may have seen at a science museum (it is called a Galton board, after Francis Galton). Balls are dropped in at the top centre. At every pin, a ball bounces left or right with equal chance. At the bottom, they land in slots." },
          { steps: [
            "**One ball, many small pushes.** Each ball meets, say, 12 pins. Its final slot depends on how many times it went left versus right.",
            "**Extreme slots need extreme luck.** To land in the far-right slot, a ball must bounce right at all 12 pins. That is rare, like flipping 12 heads in a row.",
            "**The middle is easy to reach.** There are many different paths with 6 lefts and 6 rights, so the middle slots fill up fastest.",
            "**The pile takes a shape.** After a few thousand balls, the slots form a smooth hill: tall in the middle, falling away evenly on both sides. A bell.",
          ], title: 'Watching a bell appear' },
          { p: "This is the deep reason the normal shape is everywhere. **Whenever a quantity is the sum of many small, independent nudges, it tends to be normal.** A person’s height is the result of many genes and many nutritional influences. A bolt’s diameter is the result of tiny vibrations, temperature changes and tool wear all adding up. Measurement error is the sum of many small slips." },
          { think: { q: "Would you expect the number of rupees each customer spends in a supermarket to follow a normal distribution?", a: "Probably not. Spending cannot go below zero, most baskets are small, and a few are huge, so the distribution is right-skewed. The normal curve is symmetric and allows negative values. The average of many customers’ spends, however, will be close to normal, which is the Central Limit Theorem covered in a later chapter." } },
          { callout: "The normal is a model, not a law of nature. Many things are approximately normal in the middle but have more extreme values in the tails than the bell predicts. Use it, but check it.", tone: 'warn' },
        ],
      },
      {
        heading: 'How to answer a question with the normal curve',
        blocks: [
          { diagram: { kind: 'flow', nodes: ['**Translate** the business question into a range of values', '**Standardise**: convert to z-scores', '**Look up** the area (scipy `norm.cdf`)', '**Translate back** into a share or a count'], caption: "Every normal-distribution question follows the same four moves. The z-score is the bridge that lets one table (or one function) serve every bell curve." } },
          { p: "**Step 1: Translate.** “What share of bolts are too thick?” becomes “What is the probability a diameter exceeds 10.04 mm?”" },
          { p: "**Step 2: Standardise.** Every normal curve, whatever its mean and SD, is the same shape stretched and shifted. So we measure distance from the mean in units of standard deviations. That distance is called a z-score." },
          { term: 'z-score', def: "How many standard deviations a value lies above (positive) or below (negative) the mean. A z-score of 2 means “two SDs above average”. It turns any normal into the **standard normal**, which has mean 0 and SD 1." },
          { p: "**Step 3: Look up the area.** The area to the left of a z-score is given by the cumulative distribution function. In the past people used printed tables; today you call `scipy.stats.norm.cdf(z)` or `NORM.S.DIST(z, TRUE)` in Excel." },
          { term: 'Cumulative distribution function (CDF)', def: "For any value, the probability of getting that value or less. It equals the area under the curve to the left of that point. The area to the right is 1 minus the CDF." },
          { p: "**Step 4: Translate back.** A probability of 0.0228 means about 2.3% of items, or about 1,140 out of 50,000 bolts." },
          { term: 'Percentile', def: "The value below which a given percentage of observations fall. The 90th percentile of heights is the height that 90% of people are shorter than. With a normal model, percentiles come from the inverse of the CDF (scipy `norm.ppf`)." },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { p: "The bell curve has a formula. You will rarely compute it by hand, but each piece has a meaning worth understanding." },
          { tex: 'f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} \\exp\\!\\left( -\\frac{(x-\\mu)^2}{2\\sigma^2} \\right)', plain: "The height of the curve at x. It depends only on how far x is from the mean, measured in SDs, and it falls off very quickly as that distance grows.", symbols: [['\\mu', 'the mean: centre of the bell'], ['\\sigma', 'the standard deviation: width of the bell'], ['(x-\\mu)^2', 'squared distance from the centre, so left and right are treated alike (symmetry)'], ['\\exp(\\cdot)', 'e raised to that power; a negative exponent makes the curve shrink towards zero'], ['\\tfrac{1}{\\sigma\\sqrt{2\\pi}}', 'a scaling factor that makes the total area exactly 1']] },
          { p: "Why squared distance inside an exponential? The square makes the curve symmetric, and the exponential of a negative square makes the tails thin out extremely fast: being 2 SDs away is much less likely than 1 SD, and 4 SDs is almost unheard of. The first factor simply makes sure the total area is 1, because the probabilities of all outcomes must add up to 100%." },
          { callout: "The height f(x) is a **density**, not a probability. The probability of a bolt being exactly 10.000000 mm is zero. Probabilities come from **areas** over ranges, such as “between 9.98 and 10.02 mm”.", tone: 'key' },
          { tex: 'z = \\frac{x - \\mu}{\\sigma}', plain: "Subtract the mean (shift the centre to zero), then divide by the SD (rescale so one unit = one SD). Going back is x = μ + z·σ.", symbols: [['z', 'standardised value'], ['x', 'original value in its own units']] },
          { p: "Once standardised, a few areas are worth memorising. They form the famous **68–95–99.7 rule**: about 68.3% of values lie within ±1 SD of the mean, 95.4% within ±2 SD and 99.7% within ±3 SD. Two more you will meet constantly: 95% of values lie within ±1.96 SD, and 90% within ±1.645 SD." },
          { diagram: { kind: 'curve', fn: NORM, xMin: -4, xMax: 4, shade: [-1.96, 1.96], marks: [{ x: -1.96, label: '−1.96' }, { x: 1.96, label: '+1.96' }], xLabel: 'z', yLabel: 'density', caption: "Exactly 95% of the area lies between z = −1.96 and z = +1.96, leaving 2.5% in each tail. This pair of numbers will reappear in confidence intervals and hypothesis tests." } },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'How many people are taller than a car door?', setup: "Adult male heights in a population are roughly normal with mean 170 cm and SD 7 cm. A car designer wants to know what share of men are taller than 184 cm.", steps: [
            "Translate: we need P(height > 184).",
            "Standardise: z = (184 − 170) / 7 = 14 / 7 = 2.0.",
            "Look up: `norm.cdf(2.0)` = 0.9772, so 97.72% are shorter than 184 cm.",
            "Area to the right = 1 − 0.9772 = 0.0228.",
            "Bonus: the share between 163 and 177 cm is the area between z = −1 and z = +1, which is 0.6827.",
          ], result: "About 2.3% of men are taller than 184 cm, roughly 1 in 44. Designing headroom for this group is a deliberate business choice, not an afterthought." } },
          { diagram: { kind: 'curve', fn: "Math.exp(-Math.pow((x-170)/7,2)/2)/(7*Math.sqrt(2*Math.PI))", xMin: 145, xMax: 195, shade: [184, 195], marks: [{ x: 170, label: 'mean 170' }, { x: 184, label: '184 cm (z = 2)' }], xLabel: 'height (cm)', yLabel: 'density', caption: "Heights with mean 170 cm and SD 7 cm. The thin shaded tail to the right of 184 cm holds only about 2.3% of the area." } },
          { example: { title: 'Bolt rejects and the logic of Six Sigma', setup: "Bolt diameters are normal with mean 10.00 mm and SD 0.02 mm. The customer accepts 9.96 to 10.04 mm. What share is rejected, and what if the process SD were cut to 0.0133 mm?", steps: [
            "The limits are 0.04 mm from the mean. z = 0.04 / 0.02 = 2, so the limits are at ±2 SD.",
            "Share inside ±2 SD = 0.9545, so the share rejected = 1 − 0.9545 = 0.0455 (both tails together).",
            "On 50,000 bolts a day that is about 2,275 rejects.",
            "New SD 0.0133 mm: z = 0.04 / 0.0133 ≈ 3.0, so the limits sit at about ±3 SD.",
            "Share outside ±3 SD ≈ 0.0027 (0.26% with the exact SD), about 130 bolts a day.",
          ], result: "The mean did not change at all. Cutting variation by a third reduced rejects from about 4.6% to about 0.3%, a seventeen-fold improvement. This is the central idea of Six Sigma: quality comes from reducing spread." } },
          { diagram: { kind: 'curve', fn: "Math.exp(-Math.pow((x-10)/0.02,2)/2)/(0.02*Math.sqrt(2*Math.PI))", fn2: "Math.exp(-Math.pow((x-10)/0.01333,2)/2)/(0.01333*Math.sqrt(2*Math.PI))", xMin: 9.92, xMax: 10.08, marks: [{ x: 9.96, label: 'lower limit' }, { x: 10.04, label: 'upper limit' }], xLabel: 'diameter (mm)', yLabel: 'density', legend: ['SD 0.02 mm: 4.6% rejected', 'SD 0.0133 mm: 0.3% rejected'], caption: "Same mean, two levels of variation. The narrower, taller curve has almost no area beyond the tolerance limits. Tightening the process is far more powerful than nudging the mean." } },
          { example: { title: 'Setting a battery warranty (working backwards)', setup: "An EV battery pack’s life is roughly normal with mean 6 years and SD 1 year. Finance will accept warranty claims on at most 2% of packs. How long can the warranty be?", steps: [
            "We need the value with only 2% of lives below it: the 2nd percentile.",
            "Inverse lookup: `norm.ppf(0.02)` = −2.054, so the 2nd percentile is 2.054 SDs below the mean.",
            "Translate back: 6 + (−2.054) × 1 = 3.95 years.",
            "Check: a 4-year warranty gives z = (4 − 6) / 1 = −2, and `norm.cdf(−2)` = 0.0228, i.e. 2.3% of packs, slightly over budget.",
          ], result: "A warranty of just under 4 years keeps claims within 2%. A round 4-year warranty costs about 2.3% in claims, which finance can now price consciously." } },
        ],
      },
      {
        heading: 'Is my data normal? Checking the assumption',
        blocks: [
          { p: "Every calculation above assumed the data really is normal. Before trusting a tail probability, check. Three quick checks catch most problems." },
          { bullets: [
            "**Histogram:** does it look like a single, roughly symmetric hump? Two humps (for example, heights of men and women mixed together) or a long tail are warning signs.",
            "**Mean vs median:** for normal data they are nearly equal. A big gap means skew.",
            "**Q-Q plot:** plots your sorted data against what a perfect normal would give. Points on a straight line mean normal; a curve bending away at the ends means heavier or lighter tails than normal. In Python: `scipy.stats.probplot(x, plot=plt)`.",
          ] },
          { term: 'Q-Q plot', def: "Quantile-quantile plot. Each sorted data value is plotted against the value a normal distribution would predict at the same rank. A straight diagonal line means the data matches the normal shape." },
          { p: "Formal tests such as Shapiro–Wilk exist, but use them with care. With huge datasets they reject normality for trivial deviations; with tiny ones they cannot detect anything. The picture usually tells you more." },
          { diagram: { kind: 'table', head: ['Usually close to normal', 'Usually NOT normal'], rows: [['Heights and weights of adults (one sex)', 'Incomes and wealth (right-skewed)'], ['Manufacturing dimensions', 'Insurance claim sizes (heavy right tail)'], ['Measurement errors', 'Daily stock returns (fat tails)'], ['Exam scores on well-designed tests', 'Waiting times (cannot be negative, skewed)'], ['Averages of many observations', 'Counts of rare events (use Poisson)']], caption: "A rough guide. The left column involves many small independent effects adding up; the right column involves multiplication, hard floors at zero, or rare big shocks." } },
        ],
      },
      {
        heading: 'The normal distribution in the real world',
        blocks: [
          { case: { title: 'Six Sigma and control charts in manufacturing', story: "Six Sigma, popularised by Motorola in the 1980s and later by General Electric, is built on normal-distribution thinking: measure a process’s mean and SD, compare them with the customer’s limits, and reduce variation until the limits sit many SDs from the mean. On the shop floor this shows up as a control chart, an idea from Walter Shewhart in the 1920s: plot each hour’s measurement with lines at the mean ± 3 SD. If the process is stable, only about 3 points in 1,000 should cross a line by chance, so a point outside the lines is a strong signal to stop and investigate the machine." } },
          { bullets: [
            "**Standardised testing:** scores are often scaled to a normal shape so that a z-score translates directly into a percentile rank.",
            "**Finance:** classic Value-at-Risk models assume normal returns (with known weaknesses in the tails, see below).",
            "**Retail inventory:** safety stock is often set as z × SD of demand during the resupply lead time, choosing z = 1.645 for a 95% service level.",
            "**Machine learning:** standardising features (z-scores) before training, and many models assume normally distributed errors.",
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            "**Assuming normality by default.** Incomes, claims, web traffic and returns are not normal. Normal-based tail probabilities can be wildly optimistic for them.",
            "**Fat tails.** In markets, moves of 5 or more SDs happen far more often than the normal model says. Relying on normal tails contributed to risk being underestimated before the 2008 financial crisis.",
            "**Mixing groups.** A combined dataset of two normal groups (two machines, two shifts) can be flat or two-humped. Analyse groups separately.",
            "**Negative values.** A normal model of delivery time with mean 3 days and SD 2 days predicts that about 7% of parcels arrive before they were sent. A sign the model is wrong.",
            "**Rounding a z-score table lookup.** Always compute with software; small z errors become large errors far in the tail.",
          ] },
          { diagram: { kind: 'compare', left: { title: 'Normal model is reasonable', items: ['Many small independent causes add up', 'Single symmetric hump', 'Mean ≈ median', 'Straight line on a Q-Q plot', 'You care about the middle, not extreme tails'] }, right: { title: 'Use something else', items: ['Right-skewed, positive values → **log-normal** or **gamma**', 'Counts of events → **Poisson** or **binomial**', 'Small-sample means → **t-distribution**', 'Extreme tail risk → **heavy-tailed** or extreme-value models', 'Time until an event → **exponential** or **Weibull**'] }, caption: "The normal is the default starting point, not the universal answer. The next chapter introduces the other common shapes." } },
          { callout: "A useful trick for right-skewed positive data: take the logarithm. Incomes and prices are often roughly normal on a log scale, which is what a log-normal distribution means.", tone: 'tip' },
        ],
      },
    ],
    faq: [
      { q: "Why is it called “normal”?", a: "Historical accident. In the 19th century it appeared so often that people treated it as the normal state of affairs for errors and measurements. It does not mean other distributions are abnormal." },
      { q: "What is the difference between a normal and a standard normal distribution?", a: "A standard normal has mean 0 and SD 1. Any normal can be converted to it with the z-score, which is why one function (`norm.cdf`) or one printed table works for every bell curve." },
      { q: "Can the curve’s height be more than 1?", a: "Yes. The height is a density, not a probability. A very narrow normal (like the bolt with SD 0.0133 mm) has a tall peak, about 30, but its total area is still exactly 1." },
      { q: "Do I need my data to be normal to use machine learning?", a: "Usually not for the inputs. Tree models do not care at all. Linear regression assumes the errors (residuals) are roughly normal for its p-values and intervals, not the raw features. Standardising features to z-scores helps many algorithms, but that does not make them normal." },
      { q: "How do I compute normal probabilities in Excel and Python?", a: "Excel: `NORM.DIST(x, mean, sd, TRUE)` for the area to the left, `NORM.INV(p, mean, sd)` for percentiles. Python: `scipy.stats.norm.cdf(x, loc=mean, scale=sd)` and `norm.ppf(p, loc=mean, scale=sd)`." },
      { q: "Is 68–95–99.7 exact?", a: "It is rounded. The exact shares are about 68.27%, 95.45% and 99.73%. If you need exactly 95%, use ±1.96 SD." },
    ],
  },

  // =====================================================================
  distributions: {
    minutes: 19,
    hook: "A bank’s call-centre manager knows that, on average, 3 customers call every minute. So she staffs for 3 calls a minute, and the phone lines are jammed several times an hour. The average was right; the plan was wrong. What she needed was not the average but the **whole shape of the randomness**: how often 5, 7 or 9 calls arrive in the same minute. Different processes produce different shapes, and this chapter is a field guide to the six you will meet most.",
    sections: [
      {
        heading: 'The problem: one bell curve does not fit everything',
        blocks: [
          { p: "The normal distribution is a beautiful model for heights and bolt diameters. But try using it for “number of customers who call in a minute” and it breaks: calls come in whole numbers, can never be negative, and with a small average the shape is lopsided. Try it for “minutes until the next customer walks in” and it breaks again: short waits are most common, long waits are rare but possible." },
          { term: 'Discrete vs continuous', def: "A **discrete** quantity takes separate, countable values: 0, 1, 2, 3 calls. A **continuous** quantity can take any value in a range: 2.37 minutes, 10.004 mm. Discrete distributions give a probability to each value; continuous ones use areas under a curve." },
          { p: "Statisticians have built a small toolkit of standard shapes, each matching a particular kind of process. Picking the right one is like a doctor picking the right test: it turns a vague worry (“will we be overwhelmed?”) into a number (“3.4% of minutes”)." },
          { term: 'Parameter', def: "A number that pins down the exact version of a distribution. The normal has two (mean and SD). The Poisson has one (the average rate λ). Change the parameter and you change the shape, but the family stays the same." },
          { term: 'Probability mass function (PMF)', def: "For a discrete distribution, the rule giving the probability of each exact value, such as P(exactly 2 calls). All the probabilities add up to 1. It is the counting cousin of the density curve." },
        ],
      },
      {
        heading: 'Building the intuition: every distribution tells a story',
        blocks: [
          { p: "The secret to choosing a distribution is to stop thinking about formulas and start thinking about **the story of how the numbers were produced**. Each standard distribution is the answer to a short story." },
          { steps: [
            "**Binomial: “Count the yeses.”** You make a fixed number of independent tries, each with the same chance of success, and count the successes. Twenty sales calls, each with a 10% chance of closing: how many deals?",
            "**Poisson: “Count the arrivals.”** Events happen one at a time, independently, at a steady average rate, and you count how many land in a fixed window. Calls per minute, defects per metre of cable, claims per day.",
            "**Exponential: “Wait for the next one.”** Same story as Poisson, but instead of counting events you measure the gap between them. Minutes until the next customer.",
            "**Uniform: “No favourites.”** Every value in a range is equally likely. You arrive at a bus stop at a random moment; buses come every 20 minutes; your wait is anything from 0 to 20 minutes.",
            "**t: “The bell, when you are unsure of the spread.”** The distribution of a standardised average when the SD itself had to be estimated from a small sample.",
            "**Chi-square: “Add up squared surprises.”** The distribution of a sum of squared standard-normal values, used to judge whether observed counts differ from expected counts.",
          ], title: 'Six stories, six shapes' },
          { think: { q: "A factory checks 50 bottles from each batch and counts how many are underfilled. A website counts how many sign-ups it gets per hour. Which story fits each?", a: "The bottles are binomial: a fixed number of tries (50) and a yes/no outcome for each. The sign-ups are Poisson: no fixed number of tries, just arrivals at an average rate in a time window." } },
          { callout: "The first question to ask is: am I counting out of a fixed total (binomial), counting arrivals with no upper limit (Poisson), or measuring a time or amount (continuous)?", tone: 'key' },
        ],
      },
      {
        heading: 'How to choose a distribution, step by step',
        blocks: [
          { diagram: { kind: 'tree', root: { label: 'What are you modelling?', children: [
            { label: 'A count', edge: 'whole numbers', children: [
              { label: '**Binomial**', edge: 'successes out of a fixed n' },
              { label: '**Poisson**', edge: 'events in a time or space window' },
            ] },
            { label: 'A measurement', edge: 'any value in a range', children: [
              { label: '**Exponential**', edge: 'waiting time between events' },
              { label: '**Uniform**', edge: 'all values equally likely' },
              { label: '**Normal**', edge: 'many small effects added up' },
            ] },
            { label: 'A test statistic', edge: 'used in inference', children: [
              { label: '**t**', edge: 'small-sample mean' },
              { label: '**Chi-square**', edge: 'counts vs expected, variances' },
            ] },
          ] }, caption: "A decision tree for picking a distribution. Start from the story of how the data were produced, not from which curve looks prettiest." } },
          { steps: [
            "**Describe the process in one sentence.** “Each of 200 invoices is either paid late or not.”",
            "**Decide discrete or continuous.** Counts are discrete; times, weights and money are treated as continuous.",
            "**Match the story** using the tree above.",
            "**Estimate the parameters** from data: p = share of successes, λ = average count per window, mean waiting time, and so on.",
            "**Check the fit.** Compare the model’s predicted frequencies with what you actually observed. For Poisson, check that the variance is close to the mean.",
            "**Use it** to answer the business question: probabilities of extremes, staffing levels, safety stock.",
          ], title: 'The procedure' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { p: "**Binomial.** n independent tries, each succeeding with probability p. The chance of exactly k successes is:" },
          { tex: 'P(X = k) = \\binom{n}{k} \\, p^{k} (1-p)^{\\,n-k}', plain: "p to the power k is the chance of k particular successes; (1 − p) to the power n − k is the chance the rest fail; the binomial coefficient counts how many different orders those successes could come in.", symbols: [['n', 'number of tries'], ['p', 'chance of success on each try'], ['k', 'number of successes we ask about'], ['\\binom{n}{k}', '“n choose k”: the number of ways to pick which k tries succeed']] },
          { p: "Its mean is n × p and its SD is √(n × p × (1 − p)). Twenty calls at 10% gives a mean of 2 deals and an SD of about 1.34." },
          { p: "**Poisson.** Events arrive independently at an average rate λ per window. The chance of exactly k events is:" },
          { tex: 'P(X = k) = \\frac{\\lambda^{k} e^{-\\lambda}}{k!}', plain: "λ to the power k grows with more events, k! (k factorial) shrinks it because there are many orderings, and e to the minus λ makes all the probabilities add up to 1.", symbols: [['\\lambda', 'average number of events per window (also its variance)'], ['k!', 'k factorial: k × (k − 1) × … × 1'], ['e', 'the constant 2.718…']] },
          { callout: "A Poisson distribution has **mean = variance = λ**. If your counts have a variance much larger than their mean, the data is “over-dispersed” and a negative binomial model will fit better.", tone: 'tip' },
          { p: "**Exponential.** If events follow a Poisson process, the waiting time T until the next event has an exponential distribution. Its key formula is the chance you are still waiting after time t:" },
          { tex: 'P(T > t) = e^{-t/\\beta}', plain: "The chance of still waiting falls off exponentially. If the average gap is β minutes, the chance of waiting more than t minutes is e raised to minus t over β.", symbols: [['\\beta', 'mean waiting time (equal to 1/λ)'], ['t', 'how long you have already waited']] },
          { term: 'Memoryless property', def: "For an exponential wait, the time you have already waited tells you nothing about how much longer you will wait. If no customer has arrived in the last 5 minutes, the next one is not “due”. This is true for random arrivals, but not for things that wear out, such as tyres." },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Binomial: how lucky is a good week in sales?', setup: "A salesperson closes 10% of qualified leads. This week she has 20 leads. What is the chance of exactly 2 deals, of zero deals, and of 4 or more?", steps: [
            "Story: fixed number of tries (20), yes/no outcome, same p = 0.1 each time, so binomial.",
            "P(0 deals) = 0.9²⁰ = 0.1216. About one week in eight she closes nothing, purely by chance.",
            "P(exactly 2) = (20 choose 2) × 0.1² × 0.9¹⁸ = 190 × 0.01 × 0.1501 = 0.2852.",
            "P(0, 1, 2 or 3) = 0.1216 + 0.2702 + 0.2852 + 0.1901 = 0.8670 (computed precisely: 0.8670).",
            "P(4 or more) = 1 − 0.8670 = 0.1330.",
          ], result: "Even an average performer has a “great week” of 4+ deals about 13% of the time and a zero week about 12% of the time. Judging people on one week of results mostly rewards and punishes luck." } },
          { diagram: { kind: 'bars', labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8'], values: [0.1216, 0.2702, 0.2852, 0.1901, 0.0898, 0.0319, 0.0089, 0.002, 0.0004], highlight: 2, yLabel: 'probability', caption: "Binomial distribution of deals from 20 leads at a 10% close rate. The most likely result is 2 deals, but 0 or 4+ are far from rare. Note the shape is lopsided because p is small." } },
          { example: { title: 'Poisson: staffing the bank call centre', setup: "Calls arrive at an average of λ = 3 per minute. The team can handle 6 calls in a minute. How often are they overwhelmed, and what capacity would keep it under 1% of minutes?", steps: [
            "Story: arrivals in a fixed time window, independently, at a steady rate, so Poisson with λ = 3.",
            "P(0 calls) = e⁻³ = 0.0498. P(exactly 2) = 3² × e⁻³ / 2! = 9 × 0.0498 / 2 = 0.2240.",
            "P(6 or fewer) = 0.9665, so P(more than 6) = 0.0335.",
            "Over a 60-minute hour that is about 60 × 0.0335 ≈ 2 overloaded minutes per hour.",
            "Capacity 7: P(more than 7) = 0.0119, still just over 1%. Capacity 8: P(more than 8) = 0.0038.",
          ], result: "To keep overloads under 1% of minutes, plan for 8 calls a minute, well over double the average of 3. Planning for the average guarantees trouble." } },
          { diagram: { kind: 'bars', labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], values: [0.0498, 0.1494, 0.224, 0.224, 0.168, 0.1008, 0.0504, 0.0216, 0.0081, 0.0027, 0.0008], highlight: 7, yLabel: 'probability', caption: "Poisson distribution with λ = 3 calls per minute. The bars to the right of 6 (starting with the highlighted 7) add up to 3.4%: about two minutes every hour when a 6-call team is swamped." } },
          { example: { title: 'Exponential: the fuel-station forecourt', setup: "Cars arrive at a highway fuel station as a Poisson process with an average gap of 2 minutes. What is the chance the attendant waits more than 3 minutes for the next car? What is the typical (median) wait?", steps: [
            "Story: waiting time between random arrivals, so exponential with mean β = 2 minutes.",
            "P(wait > 3) = e^(−3/2) = e^(−1.5) = 0.2231.",
            "P(wait under 1 minute) = 1 − e^(−0.5) = 0.3935.",
            "Median wait: solve e^(−t/2) = 0.5, giving t = 2 × ln 2 ≈ 1.39 minutes.",
            "Memoryless: if no car has come for 5 minutes, the chance of waiting 3 more minutes is still 0.2231.",
          ], result: "Most gaps are short (median about 1.4 minutes, below the mean of 2) but about 1 gap in 4.5 exceeds 3 minutes. The mean is pulled up by occasional long lulls, the same right skew we saw with salaries." } },
          { diagram: { kind: 'curve', fn: "x>=0 ? 0.5*Math.exp(-x/2) : 0", xMin: 0, xMax: 12, shade: [3, 12], marks: [{ x: 1.39, label: 'median 1.39' }, { x: 2, label: 'mean 2' }], xLabel: 'minutes until the next car', yLabel: 'density', caption: "Exponential waiting times with a mean of 2 minutes. The curve is highest at zero (very short gaps are most common) and the shaded tail beyond 3 minutes holds 22% of the area." } },
        ],
      },
      {
        heading: 'Uniform, t and chi-square: three more shapes you will meet',
        blocks: [
          { p: "**Uniform.** If a bus comes every 20 minutes and you arrive at a random moment, your wait is equally likely to be anything from 0 to 20 minutes. The average wait is 10 minutes and the chance of waiting more than 15 minutes is 5 / 20 = 0.25. Uniform distributions also power random number generators and simulations." },
          { p: "**t-distribution.** When we standardise a sample mean using an SD that was itself estimated from a small sample, we add extra uncertainty. The result is bell-shaped but with **fatter tails** than the normal. How fat depends on the **degrees of freedom**, roughly the sample size minus one." },
          { term: 'Degrees of freedom', def: "The number of independent pieces of information left for estimating variability. For a sample of n values used to estimate one mean, it is n − 1. More degrees of freedom means more information and a distribution closer to the normal." },
          { diagram: { kind: 'curve', fn: NORM, fn2: "0.36755*Math.pow(1+x*x/3,-2)", xMin: -5, xMax: 5, marks: [{ x: -2, label: '−2' }, { x: 2, label: '+2' }], xLabel: 'standardised value', yLabel: 'density', legend: ['standard normal', 't with 3 degrees of freedom'], caption: "The t-distribution with 3 degrees of freedom is lower in the middle and fatter in the tails. Beyond ±2, the normal has 4.6% of its area; this t has 13.9%. With small samples, extreme-looking values happen more often by chance." } },
          { p: "**Chi-square.** Take several standard-normal values, square each one and add them up. The total follows a chi-square distribution, with degrees of freedom equal to the number of squares. It is always positive and right-skewed. Its main job is in the chi-square test, which asks whether observed counts (customers per plan, defects per shift) differ from what we expected." },
          { diagram: { kind: 'curve', fn: "x>0 ? 0.13298*Math.pow(x,1.5)*Math.exp(-x/2) : 0", xMin: 0, xMax: 20, shade: [11.07, 20], marks: [{ x: 5, label: 'mean 5' }, { x: 11.07, label: '11.07' }], xLabel: 'chi-square value', yLabel: 'density', caption: "Chi-square distribution with 5 degrees of freedom. Its mean equals its degrees of freedom (5). Only 5% of the area lies beyond 11.07, so a test statistic above that is surprising if nothing unusual is going on." } },
          { callout: "You will rarely use t and chi-square to model raw business data. They are the reference shapes for test statistics in confidence intervals and hypothesis tests, which is why they appear in later chapters.", tone: 'key' },
        ],
      },
      {
        heading: 'Distributions in the real world',
        blocks: [
          { case: { title: 'Erlang and the telephone exchange', story: "In the early 1900s the Danish engineer Agner Krarup Erlang, working for the Copenhagen Telephone Company, studied how many lines and operators an exchange needed. He modelled call arrivals as a Poisson process and call durations with exponential distributions, and derived formulas for the chance that a caller finds every line busy. His work founded queueing theory, and the unit of telephone traffic is named the erlang after him. Call centres, hospital emergency departments and cloud servers are still sized with descendants of his formulas." } },
          { bullets: [
            "**Quality control:** binomial models for the number of defective items in a sample of 50; acceptance sampling plans are built on them.",
            "**Insurance:** Poisson (or negative binomial) for the number of claims per policy per year; heavy-tailed distributions for claim sizes.",
            "**Reliability:** exponential for random electronic failures; Weibull when the failure rate rises with age, as with bearings and tyres.",
            "**Retail:** Poisson demand models for slow-moving spare parts, where most days sell zero units.",
            "**Experiments:** t for comparing average order values in an A/B test; chi-square for comparing conversion counts.",
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            "**Ignoring dependence.** Binomial and Poisson assume independent events. Calls after a TV advert or a service outage arrive in bursts, so a plain Poisson model underestimates peaks.",
            "**Changing rates.** λ at 10 a.m. is not λ at 3 a.m. Model each hour separately rather than using one daily average.",
            "**Over-dispersion.** Real counts often vary more than Poisson allows (variance much bigger than mean). Use a negative binomial.",
            "**Exponential for wear-out.** Machines that age do not have memoryless lifetimes. Use Weibull or gamma distributions.",
            "**Using the normal for small counts.** With an average of 2 defects, a normal model gives probability to negative defects. Use the Poisson or binomial directly.",
          ] },
          { diagram: { kind: 'compare', left: { title: 'Binomial', items: ['Fixed number of tries n', 'Each try: yes or no', 'Counts cannot exceed n', 'Parameters: n and p', 'Mean n·p, variance n·p·(1 − p)'] }, right: { title: 'Poisson', items: ['No fixed number of tries', 'Events arrive in a time or space window', 'Counts have no upper limit', 'Parameter: rate λ', 'Mean and variance both equal λ'] }, caption: "The two count distributions side by side. When n is large and p is small, they nearly agree: 1,000 items with a 0.2% defect rate gives P(0 defects) = 0.1351 under binomial and 0.1353 under Poisson with λ = 2." } },
        ],
      },
    ],
    faq: [
      { q: "How do I know which distribution my data follows?", a: "Start with the story of how the data were generated, then check: plot a histogram, compare it with the model’s predicted frequencies, and for counts compare the mean with the variance. Real data rarely fits perfectly; you need a model that is good enough for the decision." },
      { q: "What is the difference between a PMF and a PDF?", a: "A PMF (probability mass function) gives actual probabilities for each exact value of a discrete variable. A PDF (probability density function) gives the height of a curve for a continuous variable; probabilities are areas under it." },
      { q: "Can I use the normal distribution instead of binomial for large samples?", a: "Often, yes. When n × p and n × (1 − p) are both at least about 10, the binomial is close to a normal with mean n·p and SD √(n·p·(1 − p)). For small counts, use the binomial directly; software makes this easy." },
      { q: "Why is the t-distribution named “t”?", a: "It was published in 1908 by William Sealy Gosset, a chemist at the Guinness brewery, under the pen name “Student”. The letter t was popularised later, which is why it is often called Student’s t." },
      { q: "How do I compute these in Python?", a: "Everything is in `scipy.stats`: `binom.pmf(k, n, p)`, `poisson.pmf(k, lam)`, `expon.sf(t, scale=mean)`, `uniform`, `t` and `chi2`. Each has `.pmf` or `.pdf`, `.cdf`, `.sf` (the right tail) and `.ppf` (percentiles)." },
    ],
  },

  // =====================================================================
  'sampling-clt': {
    minutes: 18,
    hook: "Before an Indian general election, a polling agency interviews a few thousand people and predicts how roughly 900 million voters will behave. A carmaker crash-tests a handful of cars, not every car off the line. A retailer surveys 400 customers and changes its pricing for millions. How can a small sample possibly speak for a huge population? The answer is one of the most important results in all of statistics: the **Central Limit Theorem**.",
    sections: [
      {
        heading: 'The problem: we can almost never measure everyone',
        blocks: [
          { p: "Measuring everything is usually impossible, too slow or too expensive. You cannot interview every customer, test every battery to destruction, or wait a year to see every transaction. So we measure a subset and use it to say something about the whole." },
          { term: 'Population and sample', def: "The **population** is the entire group you care about: all customers, all bolts made this month, all voters. A **sample** is the subset you actually measure. The goal is to learn about the population from the sample." },
          { term: 'Parameter and statistic', def: "A **parameter** is a number describing the population, usually unknown (the true average basket size of all customers, written μ). A **statistic** is the matching number calculated from a sample (the average basket of the 400 customers you surveyed, written x̄). We use statistics to estimate parameters." },
          { p: "Here is the catch. Survey 400 different customers and you will get a slightly different average. Every sample gives a different answer. So the real question is not “what did my sample say?” but **“how much could my sample’s answer differ from the truth, just by the luck of who got picked?”**" },
          { diagram: { kind: 'flow', nodes: ['**Population** (true mean μ, unknown)', 'Draw a **random sample** of n', 'Compute the **sample mean** x̄', 'Imagine repeating many times: the x̄ values form a **sampling distribution**', 'Its spread (the **standard error**) tells us how far x̄ can stray from μ'], caption: "The logic of sampling. We only ever see one sample, but statistics reasons about all the samples we could have drawn." } },
        ],
      },
      {
        heading: 'Building the intuition: averaging dice',
        blocks: [
          { p: "Take one ordinary die. Each face 1 to 6 is equally likely, so a bar chart of outcomes is perfectly flat. Nothing bell-shaped about it." },
          { steps: [
            "**Roll two dice and average them.** Now an average of 1 needs both dice to show 1 (one way out of 36). An average of 3.5 can happen six ways (1+6, 2+5, 3+4 and their reverses). The middle becomes more likely than the edges, and the shape becomes a triangle.",
            "**Roll five dice and average them.** To get an average near 1 or 6, all five must cooperate. Very unlikely. Most averages land between 2.5 and 4.5. The triangle has rounded into a hump.",
            "**Roll thirty dice and average them.** The averages cluster tightly around 3.5 and form an almost perfect bell curve.",
          ], title: 'From flat to bell' },
          { diagram: { kind: 'bars', labels: ['1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5.5', '6'], values: [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1], highlight: 5, yLabel: 'ways out of 36', caption: "Average of two dice. A single die is flat, but averaging just two already makes the middle value (3.5) six times as likely as the extremes. Average more dice and the triangle becomes a bell." } },
          { p: "Two things happened at once. The **shape** turned into a bell, even though one die is flat. And the bell got **narrower** as we averaged more dice: extremes cancel out. These two facts, stated precisely, are the Central Limit Theorem." },
          { think: { q: "Individual customer spends at a café are very skewed: most people buy a ₹150 coffee, a few spend ₹2,000 on a catering order. Will the average spend of 50 random customers also be skewed?", a: "Much less. The occasional big order gets diluted by 49 ordinary ones, and different samples get different numbers of big orders, which smooths things out. The distribution of 50-customer averages will be close to a bell, centred on the true average spend. That is the Central Limit Theorem at work." } },
        ],
      },
      {
        heading: 'How the Central Limit Theorem works, step by step',
        blocks: [
          { term: 'Sampling distribution', def: "The distribution of a statistic (such as the sample mean) over all the different samples you could have drawn. You never see it directly, but theory tells you its shape and spread." },
          { term: 'Central Limit Theorem (CLT)', def: "If you take random samples of size n from almost any population and compute each sample’s mean, those means follow approximately a normal distribution centred on the true population mean, and the approximation gets better as n grows." },
          { steps: [
            "**Start with any population**, skewed, flat or lumpy, as long as its spread is finite. Call its mean μ and SD σ.",
            "**Draw a random sample of n items** and compute the sample mean.",
            "**The sample mean is centred on the truth.** On average, across all possible samples, x̄ equals μ. It has no systematic tendency to be too high or too low.",
            "**Its spread shrinks with n.** The SD of the sample means is σ / √n, called the standard error.",
            "**Its shape becomes normal.** For moderately skewed data, n of about 30 is often enough. For very skewed data (insurance claims, viral social media posts) you may need hundreds.",
            "**So you can use normal-curve tools** (z-scores, the 95% ±1.96 rule) on averages even when the raw data is not normal at all.",
          ], title: 'What the CLT promises' },
          { diagram: { kind: 'curve', fn: "x>=0 ? Math.exp(-x/500)/500 : 0", fn2: "Math.exp(-Math.pow((x-500)/91.29,2)/2)/(91.29*Math.sqrt(2*Math.PI))", xMin: 0, xMax: 1500, marks: [{ x: 500, label: 'true mean ₹500' }], xLabel: 'basket value (₹)', yLabel: 'density', legend: ['individual baskets (very skewed)', 'averages of 30 baskets (≈ normal)'], caption: "Individual basket values follow a steeply skewed curve (most are small, a few are large). Averages of 30 baskets form a narrow, nearly symmetric bell centred on the same ₹500, with a standard error of 500 / √30 ≈ ₹91." } },
          { callout: "The CLT is about the **distribution of averages**, not about the raw data. Collecting more data does not make individual salaries normal; it makes your estimate of the average salary more precise and more predictable.", tone: 'key' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { p: "The CLT can be written in one line." },
          { tex: '\\bar X \;\\approx\; \\mathcal{N}\\!\\left(\\mu,\; \\frac{\\sigma^2}{n}\\right)', plain: "The sample mean is approximately normally distributed, centred on the population mean μ, with variance σ² / n (so its SD is σ / √n).", symbols: [['\\bar X', 'the sample mean, thought of as a random quantity that changes from sample to sample'], ['\\mathcal{N}(a, b)', 'a normal distribution with mean a and variance b'], ['\\sigma^2', 'variance of the individual values in the population'], ['n', 'sample size']] },
          { term: 'Standard error (SE)', def: "The standard deviation of a statistic across repeated samples. For a mean it is σ / √n. Think of it as the typical size of the error in your estimate due to random sampling alone. In practice σ is unknown, so we plug in the sample SD s." },
          { tex: 'SE(\\bar x) = \\frac{\\sigma}{\\sqrt{n}} \;\\approx\; \\frac{s}{\\sqrt{n}}', plain: "Divide the spread of individual values by the square root of the sample size.", symbols: [['s', 'sample standard deviation, used in place of the unknown σ']] },
          { p: "Why the **square root** of n and not n itself? Because errors partly cancel. If you average 100 values, some are too high and some too low, and they cancel out a lot, but not perfectly. Variances of independent values add up, so the variance of a sum of n values is n × σ², and dividing the sum by n to get an average divides the variance by n². That leaves σ² / n, whose square root is σ / √n." },
          { p: "The practical consequence is a law every survey and experiment budget obeys: **to halve your uncertainty, you need four times as much data.** To cut it to a tenth, you need a hundred times as much." },
          { diagram: { kind: 'table', head: ['Sample size n', '√n', 'Standard error (σ = ₹300)', 'Cost of the sample'], rows: [['1', '1', '₹300', '1×'], ['4', '2', '₹150', '4×'], ['25', '5', '₹60', '25×'], ['100', '10', '₹30', '100×'], ['400', '20', '₹15', '400×'], ['2,500', '50', '₹6', '2,500×']], caption: "Precision grows only with the square root of the sample size. Going from 100 to 400 customers halves the standard error from ₹30 to ₹15, but quadruples the cost. Diminishing returns are built into sampling." } },
          { callout: "For a **proportion** (share of customers who would recommend you), the same logic gives SE = √(p(1 − p) / n). With p = 0.5 and n = 1,000, SE ≈ 0.0158, which is where the famous “±3 percentage points” margin of polls comes from (1.96 × 0.0158 ≈ 0.031).", tone: 'tip' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'How precise is a 100-customer basket survey?', setup: "A supermarket’s individual basket values have mean ₹500 and SD ₹300 (heavily skewed). A manager samples 100 random receipts. How far is the sample mean likely to be from ₹500?", steps: [
            "SE = σ / √n = 300 / √100 = 300 / 10 = ₹30.",
            "By the CLT, sample means are approximately normal with mean ₹500 and SD ₹30.",
            "About 95% of sample means fall within 500 ± 1.96 × 30 = 500 ± 58.8, i.e. ₹441.2 to ₹558.8.",
            "With n = 400: SE = 300 / 20 = ₹15, and the 95% range shrinks to about ₹470.6 to ₹529.4.",
          ], result: "A 100-receipt sample will usually land within about ₹60 of the truth. Quadrupling the effort to 400 receipts halves that to about ₹30. Whether that is worth it is a business decision, not a statistical one." } },
          { example: { title: 'The average of 30 dice', setup: "A die has mean 3.5 and SD 1.708. You roll 30 dice and average them. What is the chance the average exceeds 4?", steps: [
            "SE = 1.708 / √30 = 1.708 / 5.477 = 0.312.",
            "z = (4 − 3.5) / 0.312 = 1.60.",
            "Normal approximation: P(z > 1.60) = 0.054.",
            "The exact answer, by counting all outcomes of 30 dice with a computer, is 0.049. The CLT approximation is close.",
          ], result: "An average above 4 happens only about one time in twenty, even though a single die exceeds 4 one time in three. Averages are far more stable than individual outcomes." } },
          { example: { title: 'Sizing a customer-satisfaction survey', setup: "A telecom company wants to estimate the share of customers who would recommend it, to within about ±3 percentage points with 95% confidence. How many responses are needed? What about 250 responses?", steps: [
            "The worst case (largest SE) is when the true share is 50%, so plan with p = 0.5.",
            "n = 1,000: SE = √(0.5 × 0.5 / 1,000) = 0.0158; margin = 1.96 × 0.0158 = 0.031, about ±3.1 points.",
            "n = 250: SE = √(0.25 / 250) = 0.0316; margin = 1.96 × 0.0316 = 0.062, about ±6.2 points.",
            "n = 4,000: margin ≈ ±1.5 points.",
          ], result: "About 1,000 random responses give ±3 points, whether the customer base is 1 lakh or 10 crore. Precision depends on the sample size, not on the population size (as long as the population is much bigger than the sample)." } },
        ],
      },
      {
        heading: 'Random sampling and bias: what the CLT cannot fix',
        blocks: [
          { p: "Every promise above depends on one word: **random**. The CLT tells you how far a random sample’s average can stray by luck. It says nothing about a sample that is systematically unrepresentative." },
          { term: 'Simple random sample', def: "A sample chosen so that every member of the population has the same chance of being picked, independently of the others. Drawing names from a well-shuffled hat is the classic picture." },
          { term: 'Sampling bias', def: "A systematic difference between the sample and the population caused by how the sample was collected, for example only surveying customers who visit the app, or only testing cars from the morning shift. More data does not reduce it." },
          { case: { title: 'The 1936 Literary Digest poll', story: "Before the 1936 US presidential election, the Literary Digest magazine mailed questionnaires to millions of people drawn largely from its own subscribers, telephone directories and car registrations, and received over two million replies. It predicted a clear win for Alf Landon. Franklin Roosevelt won in a landslide. In the Depression, people with phones and cars were wealthier than average, and those who chose to reply differed from those who did not. George Gallup, using a far smaller but more carefully chosen sample, called the result correctly. A huge biased sample lost to a small representative one." } },
          { bullets: [
            "**Self-selection:** online reviews come mostly from the delighted and the furious.",
            "**Survivorship:** studying only companies that still exist hides the strategies that led others to fail.",
            "**Convenience:** surveying shoppers at a single mall in Bengaluru tells you about that mall, not about India.",
            "**Non-response:** if busy customers ignore your survey, your results describe customers with free time.",
          ] },
          { callout: "Standard error measures random error only. Bias does not shrink with n. A biased sample of a million is still wrong, just very precisely wrong.", tone: 'warn' },
        ],
      },
      {
        heading: 'Sampling in the real world',
        blocks: [
          { bullets: [
            "**Quality control:** test a random sample of 50 parts per batch; the CLT tells you how precisely the batch average is known and when a shift is real.",
            "**Audit:** auditors sample invoices rather than checking every one, and size the sample to hit a required precision.",
            "**A/B testing:** the difference between two groups’ average order values is approximately normal by the CLT, which makes the standard tests valid even for skewed revenue data with enough users.",
            "**Opinion polling and market research:** margins of error are standard errors in disguise.",
            "**Machine learning:** cross-validation scores are averages over folds, and bootstrap methods resample the data to estimate standard errors when formulas are hard.",
          ] },
          { term: 'Bootstrap', def: "A computer method for estimating a standard error: repeatedly resample your own data with replacement, recompute the statistic each time, and look at how much it varies. Useful when no simple formula exists, for example for a median." },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            "**Thinking the CLT makes raw data normal.** It is about averages (and sums). Individual values keep their original shape.",
            "**Using n = 30 as a magic number.** For heavily skewed or heavy-tailed data (claim sizes, revenue per user in a game where a few “whales” spend lakhs) the sample mean can need hundreds or thousands of observations to behave.",
            "**Ignoring dependence.** The σ / √n formula assumes independent observations. Daily sales in consecutive days, or customers from the same household, are correlated, and the true SE is larger.",
            "**Confusing SD and SE.** SD describes how much individual values vary; SE describes how much your estimate of the average would vary. Reporting an SE as if it were an SD makes data look far less variable than it is.",
          ] },
          { diagram: { kind: 'compare', left: { title: 'Standard deviation (SD)', items: ['Describes individual values', 'Does not shrink with more data', 'Answers: how different are customers from each other?', 'Used for tolerances, ranges, outlier checks'] }, right: { title: 'Standard error (SE)', items: ['Describes an estimate (e.g. the mean)', 'Shrinks as σ / √n', 'Answers: how precisely do we know the average?', 'Used for confidence intervals and tests'] }, caption: "The most common confusion in applied statistics. With 10,000 customers the SE of the mean basket can be tiny while the SD of baskets stays large." } },
        ],
      },
    ],
    faq: [
      { q: "Does the CLT work for any population?", a: "For almost any population with a finite variance. Extremely heavy-tailed distributions (where the variance is infinite) break it, and very skewed ones need large samples before the approximation is good." },
      { q: "Why does the population size not matter for the margin of error?", a: "Because the SE depends on the spread of values and the sample size, not on how many people exist in total. A spoonful of well-stirred soup tells you its saltiness whether the pot holds 2 litres or 200. (A small correction applies only when the sample is a sizeable fraction, say over 5 to 10%, of the population.)" },
      { q: "Is 30 really enough?", a: "It is a rough rule for moderately skewed data. Simulate if in doubt: draw many samples of your size from data shaped like yours and look at the histogram of their means." },
      { q: "What is the difference between the standard error and the margin of error?", a: "The margin of error is the standard error multiplied by a critical value, usually 1.96 for 95% confidence. With SE = 1.58 points, the margin of error is about ±3.1 points." },
      { q: "Does the CLT apply to medians and other statistics?", a: "Versions of it apply to many statistics, including proportions (which are means of 0/1 values), but the formulas differ. For awkward statistics like medians or percentiles, the bootstrap is the practical tool." },
    ],
  },

  // =====================================================================
  'confidence-intervals': {
    minutes: 16,
    hook: "A logistics head presents: “Our average delivery time is 52 minutes.” The CFO asks the right question: “How sure are you? Is it 52 give or take 1 minute, or give or take 15?” A single number without its uncertainty is half an answer. A **confidence interval** is the other half: a range, built from the sample, that comes with a stated reliability.",
    sections: [
      {
        heading: 'The problem: a point estimate hides its own uncertainty',
        blocks: [
          { p: "From the previous chapter you know that every sample gives a slightly different average, and the standard error measures how much. A confidence interval packages that knowledge into something a manager can use: a lower and an upper value." },
          { term: 'Point estimate', def: "A single best guess for an unknown population value, such as a sample mean of 52 minutes used to estimate the true average delivery time." },
          { term: 'Confidence interval (CI)', def: "A range of values, calculated from sample data, produced by a method that captures the true population value in a stated percentage of repeated samples (for example 95%). Reported as “52 minutes, 95% CI 50.0 to 54.0”." },
          { p: "Compare two headlines: “Conversion rose by 2 percentage points” and “Conversion rose by 2 points (95% CI −1 to +5)”. The first sounds like a win. The second admits the truth: the data are consistent with a small fall, no change or a solid rise. Decisions should be made on the second." },
        ],
      },
      {
        heading: 'Building the intuition: throwing a net for a fish you cannot see',
        blocks: [
          { p: "Imagine a fish resting at a fixed spot under murky water. You cannot see it. You can only throw a net, and the net lands somewhere around the fish, sometimes a little left, sometimes a little right." },
          { steps: [
            "**The fish is the true value.** It does not move. It is the real average delivery time across all deliveries.",
            "**Each throw is one sample.** Where the net lands depends on the luck of the sample.",
            "**The net’s width is chosen in advance.** A wider net catches the fish more often; a narrower net is more precise but misses more.",
            "**A 95% net** is a width chosen so that, over many throws, 95% of nets land around the fish.",
            "**After one throw**, you cannot see whether this net caught the fish. You only know the method catches it 95% of the time.",
          ], title: 'The net analogy' },
          { p: "This is exactly what “95% confidence” means. The confidence is in the **method**, not in any one particular interval. Once your interval is calculated, the true value is either inside it or not; you simply do not know which." },
          { diagram: { kind: 'table', head: ['Sample', 'Sample mean (min)', '95% CI (min)', 'Contains true 52?'], rows: [['1', '54.5', '49.9 to 59.1', 'Yes'], ['2', '53.2', '49.5 to 56.9', 'Yes'], ['3', '50.8', '47.2 to 54.4', 'Yes'], ['4', '50.6', '46.9 to 54.3', 'Yes'], ['5', '49.9', '44.9 to 54.9', 'Yes'], ['6', '53.3', '49.4 to 57.2', 'Yes'], ['7', '52.8', '48.1 to 57.5', 'Yes'], ['8', '56.9', '53.5 to 60.3', 'No']], caption: "Eight simulated samples of 25 deliveries from a process whose true mean is 52 minutes (SD 10). Each sample gives a different interval; seven contain 52 and one misses. Over 10,000 such samples, 94.9% of intervals contained 52, as a 95% method should." } },
          { think: { q: "A colleague says: “Our 95% CI is 50 to 54, so there is a 95% probability the true mean is between 50 and 54.” What is wrong?", a: "In standard (frequentist) statistics the true mean is a fixed number, not a random one, so it is either between 50 and 54 or it is not. The 95% describes how often the method succeeds over many samples. The safe phrasing is: “We are 95% confident, meaning this interval comes from a procedure that captures the true mean 95% of the time.” (A Bayesian credible interval does allow a direct probability statement, but it is built differently and needs a prior.)" } },
        ],
      },
      {
        heading: 'How to build a confidence interval, step by step',
        blocks: [
          { diagram: { kind: 'flow', nodes: ['**Collect** a random sample: n, x̄, s', '**Standard error**: SE = s / √n', '**Critical value** for the confidence level (t or z)', '**Margin of error** = critical value × SE', '**Interval** = x̄ ± margin'], caption: "Every classic confidence interval follows this recipe: estimate plus or minus a multiple of its standard error." } },
          { steps: [
            "**Compute the estimate** from your sample (mean, proportion or difference).",
            "**Compute its standard error.** For a mean: s / √n. For a proportion: √(p̂(1 − p̂) / n).",
            "**Choose a confidence level**, usually 95%. Higher confidence means a wider interval.",
            "**Find the critical value.** For a proportion with a large sample, use the normal: 1.96 for 95%. For a mean with the SD estimated from the data, use the t-distribution with n − 1 degrees of freedom (2.064 for n = 25, 1.984 for n = 100).",
            "**Multiply** the critical value by the SE to get the margin of error.",
            "**Add and subtract** the margin from the estimate, and report the interval with its confidence level.",
          ], title: 'The recipe' },
          { term: 'Margin of error', def: "The half-width of the confidence interval: critical value × standard error. “±3 percentage points” in a poll is a margin of error." },
          { term: 'Critical value', def: "The number of standard errors needed on each side to achieve the chosen confidence. For 95% with the normal distribution it is 1.96, because 95% of a normal curve lies within ±1.96 SDs of the centre." },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { p: "From the CLT, the sample mean is approximately normal around the true mean μ with SD equal to the standard error. So 95% of sample means land within 1.96 SEs of μ. Turn that sentence around: in 95% of samples, μ lies within 1.96 SEs of the sample mean. That reversal is the whole idea." },
          { tex: '\\bar x \;\\pm\; z_{0.975} \\cdot \\frac{\\sigma}{\\sqrt{n}}, \\qquad z_{0.975} = 1.96', plain: "Sample mean plus or minus 1.96 standard errors. This version assumes we know the population SD σ, which is rare.", symbols: [['\\bar x', 'sample mean'], ['z_{0.975}', 'the point with 97.5% of the normal curve below it, leaving 2.5% in each tail'], ['\\sigma / \\sqrt{n}', 'standard error of the mean']] },
          { p: "In practice σ is unknown and we plug in the sample SD s. That adds extra uncertainty, especially with small samples, so we replace 1.96 with a slightly larger number from the t-distribution, whose fatter tails account for not knowing σ." },
          { tex: '\\bar x \;\\pm\; t_{0.975,\\,n-1} \\cdot \\frac{s}{\\sqrt{n}}', plain: "The practical CI for a mean. The t critical value depends on the degrees of freedom n − 1: it is 2.776 for n = 5, 2.262 for n = 10, 2.045 for n = 30 and approaches 1.96 as n grows.", symbols: [['t_{0.975,\\,n-1}', 't critical value with n − 1 degrees of freedom'], ['s', 'sample standard deviation']] },
          { diagram: { kind: 'curve', fn: NORM, xMin: -4, xMax: 4, shade: [-1.96, 1.96], marks: [{ x: -1.96, label: 'μ − 1.96 SE' }, { x: 0, label: 'true μ' }, { x: 1.96, label: 'μ + 1.96 SE' }], xLabel: 'sample mean (in standard errors from the truth)', yLabel: 'density', caption: "The sampling distribution of the mean. In 95% of samples, x̄ lands in the shaded zone, and whenever it does, the interval x̄ ± 1.96 SE reaches back to cover μ. In the 5% of samples that land in the tails, the interval misses." } },
          { tex: '\\hat p \;\\pm\; 1.96\\sqrt{\\frac{\\hat p(1-\\hat p)}{n}}', plain: "The large-sample CI for a proportion: observed share plus or minus 1.96 times its standard error. For small samples or shares near 0% or 100%, use the Wilson interval instead.", symbols: [['\\hat p', 'observed proportion in the sample']] },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Average delivery time (large sample)', setup: "A food-delivery company samples 100 deliveries: mean 52 minutes, SD 10 minutes. Build a 95% CI for the true mean.", steps: [
            "SE = 10 / √100 = 1.0 minute.",
            "Degrees of freedom = 99; t critical value = 1.984 (close to 1.96).",
            "Margin = 1.984 × 1.0 = 1.98 minutes.",
            "95% CI = 52 ± 1.98 = 50.02 to 53.98 minutes.",
            "For comparison: 90% CI uses 1.660 → 50.34 to 53.66; 99% CI uses 2.626 → 49.37 to 54.63.",
          ], result: "“About 52 minutes, 95% CI roughly 50 to 54.” More confidence costs width: the 99% interval is about a third wider than the 95% one." } },
          { example: { title: 'EV range from a small test fleet', setup: "An automotive team measures the real-world range of 12 test cars: mean 412 km, SD 18 km. Build a 95% CI for the model’s average range.", steps: [
            "SE = 18 / √12 = 18 / 3.464 = 5.196 km.",
            "Degrees of freedom = 11; t critical value = 2.201 (noticeably more than 1.96).",
            "Margin = 2.201 × 5.196 = 11.44 km.",
            "95% CI = 412 ± 11.44 = 400.6 to 423.4 km.",
            "Using 1.96 by mistake would give ±10.18 km, an interval that is too narrow and over-confident.",
          ], result: "Marketing can claim “around 410 km” with evidence that the average is very likely above 400 km. Claiming 420 km would be ahead of the data. With small samples, always use the t value." } },
          { example: { title: 'Share of customers who would recommend (proportion)', setup: "A survey of 1,000 random customers finds 420 would recommend the brand. Build a 95% CI for the true share.", steps: [
            "p̂ = 420 / 1,000 = 0.42.",
            "SE = √(0.42 × 0.58 / 1,000) = √0.0002436 = 0.0156.",
            "Margin = 1.96 × 0.0156 = 0.0306.",
            "95% CI = 0.42 ± 0.0306 = 0.389 to 0.451.",
          ], result: "Between about 39% and 45% of customers would recommend the brand. If last year’s figure was 40%, this survey alone cannot show a real improvement, because 40% sits inside the interval." } },
          { example: { title: 'Planning the sample size in advance', setup: "Before collecting data, the delivery team wants a 95% CI no wider than ±2 minutes. From past data, the SD is about 10 minutes. How many deliveries should they sample?", steps: [
            "Margin = 1.96 × s / √n. Set it to 2: 1.96 × 10 / √n = 2.",
            "√n = 19.6 / 2 = 9.8, so n = 96.04.",
            "Round up: n = 97 deliveries.",
            "For ±1 minute: n = (19.6)² = 384.2 → 385 deliveries, four times as many.",
          ], result: "Decide the precision you need, then compute n. This avoids both wasted effort and inconclusive studies." } },
        ],
      },
      {
        heading: 'What controls the width, and how to read an interval',
        blocks: [
          { p: "Three levers decide how wide an interval is: **variability** (bigger s, wider interval), **sample size** (bigger n, narrower, but only by √n) and **confidence level** (99% is wider than 95%, which is wider than 90%)." },
          { diagram: { kind: 'bars', labels: ['n = 25', 'n = 100', 'n = 400', 'n = 1,600'], values: [4.13, 1.98, 0.98, 0.49], highlight: 1, yLabel: '95% margin of error (minutes)', caption: "Margin of error for a mean when the SD is 10 minutes. Each quadrupling of the sample halves the margin (n = 25 is slightly more than double n = 100 because its t value is larger)." } },
          { bullets: [
            "**Does the interval include a meaningful threshold?** If a CI for a price change’s effect on revenue is −₹2 lakh to +₹8 lakh, the data cannot rule out a loss.",
            "**Compare width with what matters.** A CI of 50 to 54 minutes is decision-ready if the SLA is 60 minutes; useless if the SLA is 52.",
            "**Overlap is a rough guide only.** Two intervals that overlap slightly can still come from significantly different groups. Compute a CI for the difference itself.",
            "**A CI is not a range for individual values.** 95% of single deliveries do not fall between 50 and 54 minutes; with SD 10, individual times range roughly from 32 to 72. That wider range is a prediction interval.",
          ] },
          { diagram: { kind: 'compare', left: { title: 'Correct readings', items: ['95% of intervals built this way capture the true mean', 'We are 95% confident the true mean is between 50 and 54', 'Values inside are plausible given the data', 'A narrower interval means a more precise estimate'] }, right: { title: 'Common mistakes', items: ['There is a 95% probability μ is in this specific interval', '95% of individual deliveries fall in this range', 'Values outside the interval are impossible', 'Values near the centre are much more “true” than values at the edges'] }, caption: "Precise language matters in front of a CFO. The 95% belongs to the method, not to one calculated interval." } },
        ],
      },
      {
        heading: 'Confidence intervals in the real world',
        blocks: [
          { case: { title: 'Reporting an A/B test result (illustrative)', story: "An Indian travel website tested a new checkout page. Of 20,000 visitors on the old page, 4.0% booked; of 20,000 on the new page, 4.5% booked. Instead of only saying “significant, p < 0.05”, the analyst reported the lift as 0.5 percentage points with a 95% CI of about 0.1 to 0.9 points. Finance could then translate both ends into rupees: at the low end the change barely paid for itself; at the high end it was worth a sizeable sum annually. Management rolled out the page but kept monitoring, because the interval showed the true gain might be small. The interval, not the p-value, drove a sensible decision." } },
          { bullets: [
            "**Clinical trials** report treatment effects with 95% CIs; regulators look at whether the whole interval shows a meaningful benefit.",
            "**Opinion polls** publish a margin of error, the half-width of a CI.",
            "**Forecasting** reports prediction intervals (for individual future values) around point forecasts so planners can hold safety stock.",
            "**Machine learning** reports a model’s accuracy with a CI from cross-validation or the bootstrap, so a 0.3% “improvement” is not mistaken for progress.",
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            "**Misreading the 95%.** It describes the long-run success rate of the procedure.",
            "**Forgetting bias.** A CI only covers random sampling error. A biased sample produces a narrow interval around the wrong value.",
            "**Using z instead of t with small samples.** The interval is too narrow and you will miss the truth more often than 5% of the time.",
            "**Ignoring dependence or clustering.** Customers from the same store or repeated measures on the same machine are not independent; the true SE is larger.",
            "**Skewed data with small n.** The formula relies on the CLT. For small skewed samples, use a bootstrap interval or transform the data (for example with logarithms).",
            "**Proportions near 0 or 1.** The simple formula can give intervals below 0% or above 100%. Use the Wilson interval (statsmodels `proportion_confint(method='wilson')`).",
          ] },
          { callout: "Always report an estimate with its interval. Good practice in many journals and analytics teams is: effect size, 95% CI, and only then the p-value.", tone: 'key' },
        ],
      },
    ],
    faq: [
      { q: "Why 95% and not 100%?", a: "A 100% interval would have to include every conceivable value, which is useless. 95% is a convention balancing reliability and precision. Use 90% when decisions are low-stakes and 99% when errors are costly." },
      { q: "When do I use t instead of z?", a: "Use t for means when the SD is estimated from the sample, which is almost always. For large n the two give nearly the same answer. Use z for proportions with large samples." },
      { q: "If two confidence intervals overlap, is there no significant difference?", a: "Not necessarily. Two 95% intervals can overlap a little while the difference is still significant at 5%. To compare groups, build a confidence interval for the difference, or run a test." },
      { q: "How is a confidence interval related to a hypothesis test?", a: "Closely. A two-sided test at the 5% level rejects a hypothesised value exactly when that value lies outside the 95% CI (for the matching test and interval). The interval tells you more, because it shows every value that would not be rejected." },
      { q: "How do I compute a CI in Python?", a: "For a mean: `scipy.stats.t.interval(0.95, n-1, loc=x.mean(), scale=scipy.stats.sem(x))`. For a proportion: `statsmodels.stats.proportion.proportion_confint(count, n, method='wilson')`. For anything else: bootstrap." },
    ],
  },

  // =====================================================================
  'hypothesis-testing': {
    minutes: 17,
    hook: "An e-commerce team launches a new checkout button. Next week, conversion is 5.0% instead of the usual 4.0%. The product manager wants to celebrate. The data scientist asks a less exciting question: “If the button did nothing at all, how often would we see a jump this big just by chance?” That question, made precise, is a **hypothesis test**, and its answer is the famous and much-misunderstood **p-value**.",
    sections: [
      {
        heading: 'The problem: was it real, or was it luck?',
        blocks: [
          { p: "Business data is noisy. Sales go up and down every week, conversion rates wobble, and two production lines never give exactly the same defect rate. So whenever we see a difference, we face the same question: is this a real effect we can act on, or just random variation that will vanish next week?" },
          { p: "Acting on noise is expensive. You roll out a “winning” website design that was never better, retrain staff on a process that did not help, or scrap a supplier who just had an unlucky month. Hypothesis testing is a disciplined way to separate signal from noise before spending money." },
          { term: 'Hypothesis test', def: "A procedure for deciding whether data provide enough evidence against a default assumption of “no effect”. It measures how surprising the observed data would be if that default were true." },
          { term: 'Null and alternative hypotheses', def: "The **null hypothesis** (H₀) is the boring default: no effect, no difference (the new button converts at the same rate as the old). The **alternative hypothesis** (H₁) is what you suspect: there is a difference. We test H₀, not H₁." },
        ],
      },
      {
        heading: 'Building the intuition: the courtroom',
        blocks: [
          { p: "A criminal trial is a hypothesis test in disguise. The defendant is presumed innocent. The prosecution presents evidence. The jury asks: “If this person were innocent, how likely is it that all this evidence would turn up?” Only if the evidence would be very unlikely under innocence does the jury convict." },
          { steps: [
            "**Presumption of innocence = the null hypothesis.** We assume “no effect” until the data convince us otherwise.",
            "**Evidence = the data.** The conversion jump, the difference in defect rates.",
            "**Beyond reasonable doubt = the significance level.** We decide in advance how surprising evidence must be before we reject “no effect”, commonly a 5% threshold.",
            "**Guilty verdict = reject H₀.** The data would be too surprising if there were no effect.",
            "**Not guilty is not innocent.** A jury that acquits is saying “not proven”, not “definitely innocent”. Likewise, failing to reject H₀ does not prove there is no effect; the evidence may simply be too thin.",
          ], title: 'The trial, step by step' },
          { p: "The courtroom also shows that there are **two ways to be wrong**: convicting an innocent person, or letting a guilty one go free. Making one error rarer usually makes the other more common. Statistics gives both errors names and lets you control them." },
          { think: { q: "A test of a new marketing campaign gives “not significant”. The CMO concludes the campaign has no effect and cancels it. What is the flaw?", a: "Absence of evidence is not evidence of absence. With a small test or a noisy metric, a real effect can easily fail to reach significance. Before concluding “no effect”, check the confidence interval: if it runs from, say, −1% to +6%, the test simply could not tell, and a large benefit is still plausible." } },
        ],
      },
      {
        heading: 'How a hypothesis test works, step by step',
        blocks: [
          { diagram: { kind: 'flow', nodes: ['**State H₀ and H₁** and choose α (e.g. 0.05)', '**Collect data** and compute a test statistic', '**Find the p-value**: how surprising is this under H₀?', '**Decide**: p ≤ α → reject H₀; p > α → do not reject', '**Report** the effect size and its confidence interval'], caption: "The five steps of every classical hypothesis test. Choosing α before looking at the data is what keeps the procedure honest." } },
          { term: 'Test statistic', def: "A single number summarising how far the data are from what H₀ predicts, measured in standard errors. A z-statistic of 2.4 means the observed result is 2.4 standard errors away from the “no effect” value." },
          { term: 'Significance level (α)', def: "The threshold for “surprising enough”, chosen before seeing the data. α = 0.05 means you accept a 5% chance of rejecting H₀ when it is actually true. It is a policy choice, not a law of nature." },
          { term: 'p-value', def: "The probability, assuming H₀ is true, of getting a result at least as extreme as the one observed. Small p-values mean the data would be surprising if there were no effect." },
          { p: "Read that last definition twice. The p-value is calculated **in a world where H₀ is true**. It answers: “If nothing were going on, how often would I see something this extreme?” It does **not** answer: “What is the chance nothing is going on?”" },
          { callout: "A p-value is **not** the probability that H₀ is true, **not** the probability that the result is due to chance, and **not** a measure of how big or important the effect is. p = 0.03 means: if there were no effect, data this extreme would turn up about 3% of the time.", tone: 'warn' },
          { term: 'One-sided vs two-sided', def: "A **two-sided** test counts surprises in both directions (the new button could be better or worse). A **one-sided** test counts only one direction. Two-sided is the safe default; choose one-sided only if the other direction truly does not matter, and decide before seeing data." },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { p: "Most tests share one skeleton: compare what you observed with what H₀ predicts, and scale the gap by the standard error, the typical size of random variation." },
          { tex: 'z = \\frac{\\text{observed} - \\text{expected under } H_0}{\\text{standard error}}', plain: "How many standard errors the result is from the “no effect” value. By the Central Limit Theorem this is approximately standard normal when H₀ is true.", symbols: [['z', 'test statistic'], ['H_0', 'null hypothesis']] },
          { tex: 'p = P\\big(|Z| \\ge |z_{\\text{obs}}| \;\\big|\; H_0\\big) = 2\\,\\big(1 - \\Phi(|z_{\\text{obs}}|)\\big)', plain: "The two-sided p-value is the area in both tails of the standard normal beyond the observed statistic.", symbols: [['z_{\\text{obs}}', 'the test statistic you calculated'], ['\\Phi', 'the standard normal CDF (`norm.cdf`)'], ['\\mid H_0', '“assuming H₀ is true”']] },
          { diagram: { kind: 'curve', fn: NORM, xMin: -4, xMax: 4, shade: [2.4, 4], marks: [{ x: -2.4, label: '−2.4' }, { x: 0, label: 'H₀: no effect' }, { x: 2.4, label: 'observed z = 2.4' }], xLabel: 'test statistic under H₀', yLabel: 'density', caption: "If H₀ is true, z follows this standard normal curve. The shaded right tail beyond 2.4 holds 0.82% of the area; the matching left tail beyond −2.4 holds another 0.82%. Together they give the two-sided p-value of 0.016." } },
          { p: "For comparing two proportions, such as conversion rates in an A/B test, the standard error under H₀ uses the pooled rate p̄ (both groups combined), because H₀ says the two groups share one true rate:" },
          { tex: 'z = \\frac{\\hat p_B - \\hat p_A}{\\sqrt{\\bar p (1-\\bar p)\\left(\\frac{1}{n_A} + \\frac{1}{n_B}\\right)}}', plain: "Difference in observed conversion rates divided by its standard error under “no difference”.", symbols: [['\\hat p_A, \\hat p_B', 'observed rates in groups A and B'], ['\\bar p', 'pooled rate: total conversions ÷ total visitors'], ['n_A, n_B', 'group sizes']] },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Is the coin fair?', setup: "A coin is tossed 100 times and lands heads 62 times. Test H₀: the coin is fair (p = 0.5), two-sided, at α = 0.05.", steps: [
            "Under H₀ the expected number of heads is 100 × 0.5 = 50, with SD √(100 × 0.5 × 0.5) = 5.",
            "z = (62 − 50) / 5 = 2.4.",
            "Two-sided p-value (normal approximation) = 2 × (1 − 0.9918) = 0.016.",
            "The exact binomial test (`scipy.stats.binomtest(62, 100)`) gives p = 0.021. Both are below 0.05.",
            "Decision: reject H₀.",
          ], result: "If the coin were fair, 62 or more heads (or 38 or fewer) would happen only about 2% of the time. That is strong evidence of bias. It is not a 98% probability that the coin is biased." } },
          { example: { title: 'A/B test on a checkout button', setup: "Old button: 200 purchases from 5,000 visitors (4.0%). New button: 250 from 5,000 (5.0%). Is the difference significant at α = 0.05?", steps: [
            "H₀: both buttons have the same true conversion rate. H₁: the rates differ.",
            "Pooled rate p̄ = (200 + 250) / 10,000 = 0.045.",
            "SE = √(0.045 × 0.955 × (1/5,000 + 1/5,000)) = 0.00415.",
            "z = (0.050 − 0.040) / 0.00415 = 2.41. Two-sided p = 0.016.",
            "95% CI for the lift: 0.19 to 1.81 percentage points.",
          ], result: "Reject H₀: a gap this large would occur only about 1.6% of the time if the buttons were equivalent. The interval shows the true lift could be as small as 0.2 points or as large as 1.8 points, which is what finance needs to value the change." } },
          { example: { title: 'Why “significant” results are often false (base rates)', setup: "A company tests 1,000 product ideas. Suppose only 100 truly work. Each test uses α = 0.05 and has 80% power to detect a real effect. Of the ideas declared significant, how many are real?", steps: [
            "Real ideas detected: 80% of 100 = 80 true positives.",
            "Useless ideas wrongly declared significant: 5% of 900 = 45 false positives.",
            "Total significant results: 80 + 45 = 125.",
            "Share of significant results that are false: 45 / 125 = 36%.",
          ], result: "Every individual test used α = 5%, yet over a third of the “winners” are duds. This is why p < 0.05 is not “95% sure the effect is real”: that probability depends on how many tested ideas were good in the first place." } },
          { diagram: { kind: 'bars', labels: ['True positives', 'False positives', 'Missed real ideas', 'Correct nulls'], values: [80, 45, 20, 855], highlight: 1, yLabel: 'ideas (out of 1,000)', caption: "Outcomes of 1,000 tests when 10% of ideas are real. The 45 false positives are 36% of all 125 significant results, even with a 5% significance level." } },
        ],
      },
      {
        heading: 'Two kinds of error, and statistical power',
        blocks: [
          { diagram: { kind: 'table', head: ['', 'H₀ actually true (no effect)', 'H₀ actually false (real effect)'], rows: [['Reject H₀', '**Type I error** (false positive), probability α', 'Correct: real effect detected, probability = power'], ['Do not reject H₀', 'Correct: no false alarm', '**Type II error** (false negative), probability β']], caption: "The four possible outcomes of a test. You control α directly. You control β, and therefore power, mainly through sample size." } },
          { term: 'Type I and Type II errors', def: "A **Type I error** is a false positive: declaring an effect that is not there (convicting the innocent). A **Type II error** is a false negative: missing an effect that is there (acquitting the guilty)." },
          { term: 'Power', def: "The probability that a test detects a real effect of a given size, equal to 1 − β. Conventional targets are 80% or 90%. Power rises with larger samples, larger true effects, less noisy data and a less strict α." },
          { diagram: { kind: 'curve', fn: NORM, fn2: "Math.exp(-Math.pow(x-2.8,2)/2)/Math.sqrt(2*Math.PI)", xMin: -4, xMax: 7, shade: [1.96, 7], marks: [{ x: 1.96, label: 'reject if z > 1.96' }], xLabel: 'test statistic', yLabel: 'density', legend: ['if H₀ is true (no effect)', 'if the real effect is 2.8 SE'], caption: "The left curve is the world with no effect; the right curve is a world with a real effect. Everything beyond 1.96 is rejected. Under the right curve, about 80% of the area lies beyond 1.96: that is the power. The part of the right curve below 1.96 (20%) is the Type II error." } },
          { p: "**Plan power before you test.** To detect a lift from 4.0% to 4.5% conversion with 80% power at α = 0.05 (two-sided), you need about 25,550 visitors per group. With 2,000 per group the test is very likely to miss a real half-point lift and report “not significant”." },
          { callout: "An underpowered test wastes everyone’s time: it is likely to miss real effects, and the “significant” results it does produce tend to exaggerate the true effect size. Compute the sample size first (statsmodels `NormalIndPower` or `TTestIndPower`).", tone: 'tip' },
        ],
      },
      {
        heading: 'Hypothesis testing in the real world',
        blocks: [
          { case: { title: 'The p-value debate in science', story: "In 2016 the American Statistical Association took the unusual step of publishing a formal statement on p-values. Among its principles: a p-value does not measure the probability that the studied hypothesis is true; scientific and business decisions should not be based only on whether a p-value passes a threshold; and a p-value does not measure the size or importance of an effect. The statement responded to widespread misuse across fields, including a “replication crisis” in which many published significant findings failed to hold up when repeated. The lesson for analysts is the same as for scientists: report effect sizes and confidence intervals, plan sample sizes, and be wary of a single p < 0.05." } },
          { bullets: [
            "**Product and marketing:** A/B tests on prices, page designs, email subject lines.",
            "**Manufacturing:** does a new supplier’s material change the defect rate? Has the line drifted from its target?",
            "**Finance:** is a trading strategy’s return different from zero, or is it data-mined luck?",
            "**Pharma and healthcare:** clinical trials, where the significance level and sample size are fixed in advance by protocol.",
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            "**Multiple testing.** Run 20 independent tests on pure noise at α = 0.05 and the chance of at least one false positive is 1 − 0.95²⁰ = 64%. Correct with Bonferroni (divide α by the number of tests) or control the false discovery rate (Benjamini–Hochberg).",
            "**p-hacking.** Trying many metrics, segments or stopping points until something is significant. Pre-register the metric and sample size.",
            "**Peeking.** Checking an A/B test daily and stopping the moment p < 0.05 inflates false positives far above 5%. Fix the sample size or use sequential methods built for peeking.",
            "**Significant but trivial.** With millions of users, a 0.01% lift can be highly significant and worth nothing. Always look at the effect size.",
            "**Not significant is not “no effect”.** Look at the confidence interval and the power.",
            "**Treating 0.049 and 0.051 as opposites.** The evidence is almost identical; the threshold is a convention.",
          ] },
          { diagram: { kind: 'compare', left: { title: 'What a p-value tells you', items: ['How surprising the data are if H₀ were true', 'Small p = data hard to explain by chance alone', 'Depends on effect size AND sample size', 'One input to a decision'] }, right: { title: 'What it does NOT tell you', items: ['The probability H₀ is true', 'The probability the result is a fluke', 'How large or valuable the effect is', 'Whether the study design was sound'] }, caption: "Keep this table nearby when reading any report that says “statistically significant”." } },
          { callout: "Better practice: report the estimated effect, its 95% confidence interval, and the p-value, and judge the business value of both ends of the interval. Bayesian A/B testing, which gives direct probabilities like “P(new button is better) = 0.97”, is a popular alternative when its assumptions are stated clearly.", tone: 'key' },
        ],
      },
    ],
    faq: [
      { q: "Why 0.05?", a: "Convention, popularised by the statistician Ronald Fisher in the 1920s as a convenient rule of thumb. Nothing magical happens at 0.05. High-stakes fields use stricter thresholds; particle physics famously requires about 5 standard deviations (p ≈ 3 in 10 million, one-sided) to claim a discovery." },
      { q: "If p = 0.03, is there a 97% chance my effect is real?", a: "No. The p-value assumes H₀ is true and asks how surprising the data are. The probability that the effect is real depends also on how plausible it was beforehand and on the test’s power, as the 1,000-ideas example showed." },
      { q: "What does “fail to reject H₀” mean?", a: "The data were not surprising enough to rule out “no effect”. It does not mean H₀ is true. The effect may be zero, or the test may have been too small to detect it." },
      { q: "Can I switch to a one-sided test to get a smaller p-value?", a: "Only if you decided before seeing the data that one direction is irrelevant. Switching after seeing the result halves the p-value dishonestly and doubles your false-positive rate in that direction." },
      { q: "How do hypothesis tests relate to confidence intervals?", a: "A two-sided test at level α rejects H₀ exactly when the H₀ value lies outside the matching (1 − α) confidence interval. The interval is usually more informative because it shows the size of the effect." },
      { q: "Which test should I use?", a: "It depends on the data: t-tests for comparing means, z or chi-square tests for proportions and counts, ANOVA for three or more group means, and non-parametric tests (Mann–Whitney, Wilcoxon) when assumptions fail. The next chapter covers t-tests in detail." },
    ],
  },

  // =====================================================================
  't-test': {
    minutes: 16,
    hook: "In the early 1900s a young chemist at the Guinness brewery in Dublin had a problem. He needed to judge the quality of barley and hops from only a handful of samples, and the statistics of his day assumed you had hundreds. William Sealy Gosset worked out what happens to averages from small samples, published it in 1908 under the pen name “Student”, and gave the world the **t-test**. More than a century later it is still the everyday tool for asking: are these two averages really different?",
    sections: [
      {
        heading: 'The problem: comparing averages with small, noisy samples',
        blocks: [
          { p: "Plant A’s assembly takes 43 minutes on average, Plant B’s takes 38.5. Training raised test scores from 65.5 to 69. A filling machine averages 497.5 ml against a 500 ml target. Each of these is a difference in means, and each time the question is the same: is the gap bigger than the natural wobble in the data?" },
          { p: "The previous chapter tested proportions using the normal distribution. For means there is one extra complication: we do not know the population SD, so we estimate it from the sample. With small samples that estimate is itself shaky, and the t-test is designed to account for exactly that." },
          { term: 't-test', def: "A hypothesis test for means. It compares a difference in means with its standard error, and judges the result against the t-distribution rather than the normal, to allow for the SD being estimated from the data." },
          { term: 't-statistic', def: "The observed difference divided by its estimated standard error: how many “noise units” the result is from what H₀ predicts. Values far from 0 (roughly beyond ±2 for moderate samples) are evidence against H₀." },
        ],
      },
      {
        heading: 'Building the intuition: signal versus noise',
        blocks: [
          { p: "Imagine trying to hear a friend in a café. Whether you can make out the words depends on two things: how loudly they speak (the **signal**) and how noisy the café is (the **noise**). A whisper in a library is clear; a shout at a cricket match may be lost." },
          { steps: [
            "**The signal is the difference in means.** Plant B is 4.9 minutes faster.",
            "**The noise is the variability**, scaled by sample size: how much the averages would wobble if we re-ran the comparison with different shifts.",
            "**The t-statistic is signal ÷ noise.** A ratio of 3.8 means the difference is almost four times bigger than its typical random wobble.",
            "**More data lowers the noise.** Averaging over more shifts makes the background quieter, so a smaller difference becomes audible.",
            "**Small samples get a stricter judge.** Because the noise estimate itself is uncertain with few observations, the t-distribution demands a bigger ratio before declaring significance.",
          ], title: 'The café analogy' },
          { diagram: { kind: 'curve', fn: NORM, fn2: "0.375*Math.pow(1+x*x/4,-2.5)", xMin: -5, xMax: 5, marks: [{ x: -1.96, label: '±1.96 (normal)' }, { x: 2.776, label: '2.776 (t, 4 df)' }], xLabel: 't value', yLabel: 'density', legend: ['standard normal', 't with 4 degrees of freedom (n = 5)'], caption: "With only 5 observations, the t-distribution has fatter tails than the normal, so the cut-off for a two-sided 5% test moves from 1.96 out to 2.776. Small samples must show a bigger signal-to-noise ratio to count as significant." } },
          { think: { q: "Two teams each report a 3-point improvement in average customer satisfaction. Team A surveyed 10 customers, Team B surveyed 1,000. Whose 3 points do you trust more, and why?", a: "Team B’s. With 1,000 customers the standard error is about ten times smaller (√100 = 10), so the same 3-point signal gives a t-statistic roughly ten times larger. With 10 customers, a 3-point shift could easily be the luck of who answered." } },
        ],
      },
      {
        heading: 'Choosing the right t-test, step by step',
        blocks: [
          { diagram: { kind: 'tree', root: { label: 'What are you comparing?', children: [
            { label: '**One-sample t-test**', edge: 'one group vs a fixed target' },
            { label: 'Two groups', edge: 'two means', children: [
              { label: '**Paired t-test**', edge: 'same units measured twice' },
              { label: '**Welch two-sample t-test**', edge: 'different, independent units' },
            ] },
            { label: '**ANOVA**', edge: 'three or more groups' },
          ] }, caption: "Picking a t-test. The key question for two groups is whether each measurement in one group has a natural partner in the other (the same employee, the same machine, the same store)." } },
          { steps: [
            "**State the question as means.** “Is the mean fill volume different from 500 ml?”",
            "**Pick the test** using the tree: one-sample, paired or two-sample.",
            "**Check assumptions:** independent observations; data roughly normal, or a sample large enough for the CLT; no extreme outliers dominating.",
            "**Compute t** = difference ÷ standard error, and its degrees of freedom.",
            "**Get the p-value** from the t-distribution (`scipy.stats.ttest_1samp`, `ttest_rel`, `ttest_ind(..., equal_var=False)`).",
            "**Report** the difference, its 95% CI, the p-value and an effect size.",
          ], title: 'The procedure' },
          { term: 'Paired data', def: "Two measurements that belong together because they come from the same unit: the same employee before and after training, the same car on two fuel blends. Analysing the differences within each pair removes unit-to-unit variation." },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { p: "**One-sample t-test.** Compare a sample mean with a target value μ₀:" },
          { tex: 't = \\frac{\\bar x - \\mu_0}{s / \\sqrt{n}}, \\qquad df = n - 1', plain: "How many standard errors the sample mean is from the target.", symbols: [['\\bar x', 'sample mean'], ['\\mu_0', 'target value under H₀'], ['s / \\sqrt n', 'estimated standard error of the mean'], ['df', 'degrees of freedom']] },
          { p: "**Paired t-test.** Compute the difference for each pair (after − before) and run a one-sample t-test on those differences against 0. That is all it is." },
          { tex: 't = \\frac{\\bar d}{s_d / \\sqrt{n}}, \\qquad df = n - 1', plain: "Mean of the within-pair differences divided by its standard error.", symbols: [['\\bar d', 'mean of the pairwise differences'], ['s_d', 'SD of the differences'], ['n', 'number of pairs']] },
          { p: "**Welch two-sample t-test.** For two independent groups, the standard error of the difference combines both groups’ uncertainty. Variances add, so we add the squared standard errors and take the root:" },
          { tex: 't = \\frac{\\bar x_1 - \\bar x_2}{\\sqrt{\\dfrac{s_1^2}{n_1} + \\dfrac{s_2^2}{n_2}}}', plain: "Difference between the two sample means divided by the standard error of that difference. Welch’s version does not assume the two groups have equal variances, and uses an adjusted (often non-whole) number of degrees of freedom.", symbols: [['s_1^2, s_2^2', 'sample variances of the two groups'], ['n_1, n_2', 'group sizes']] },
          { callout: "Use Welch’s test as your default for two independent groups (`equal_var=False` in scipy). The older “Student” pooled version assumes equal variances; when that is true, Welch loses almost nothing, and when it is false, Welch protects you.", tone: 'tip' },
          { term: 'Effect size (Cohen’s d)', def: "The difference in means divided by a standard deviation of the data (not the standard error). It says how big the effect is in units of natural variation, independently of sample size. Rough guide: 0.2 small, 0.5 medium, 0.8 large." },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'One-sample: is the filling machine on target?', setup: "A beverage plant samples 10 bottles labelled 500 ml: 498, 497, 501, 495, 499, 496, 500, 497, 498, 494. Is the machine’s mean fill different from 500 ml (α = 0.05, two-sided)?", steps: [
            "Mean = 4,975 / 10 = 497.5 ml.",
            "Sum of squared deviations from 497.5 = 42.5, so s = √(42.5 / 9) = 2.173 ml.",
            "SE = 2.173 / √10 = 0.687 ml.",
            "t = (497.5 − 500) / 0.687 = −3.64, with 9 degrees of freedom.",
            "Two-sided p-value = 0.0054. The 95% CI for the mean is 497.5 ± 2.262 × 0.687 = 495.9 to 499.1 ml.",
          ], result: "Reject H₀. The machine is underfilling by about 2.5 ml on average, and the whole interval lies below 500. Recalibrate it: underfilling risks regulatory trouble, and the fix is cheap." } },
          { diagram: { kind: 'curve', fn: "0.38803*Math.pow(1+x*x/9,-5)", xMin: -5, xMax: 5, shade: [-5, -3.64], marks: [{ x: -3.64, label: 't = −3.64' }, { x: -2.262, label: '−2.262' }, { x: 2.262, label: '+2.262' }], xLabel: 't (9 degrees of freedom)', yLabel: 'density', caption: "The t-distribution with 9 degrees of freedom. Values beyond ±2.262 are significant at 5%. The observed t = −3.64 sits deep in the left tail; that tail plus its mirror image on the right give p = 0.0054." } },
          { example: { title: 'Welch two-sample: does the new plant layout cut cycle time?', setup: "Assembly cycle times (minutes) on 8 shifts at each plant. Plant A (old layout): 42, 45, 39, 47, 44, 41, 46, 43. Plant B (new layout): 38, 40, 36, 41, 39, 35, 42, 37.", steps: [
            "Means: A = 43.375, B = 38.5. Difference = 4.875 minutes.",
            "Sample variances: A = 7.125, B = 6.0.",
            "SE of the difference = √(7.125/8 + 6.0/8) = √1.6406 = 1.281.",
            "t = 4.875 / 1.281 = 3.81. Welch degrees of freedom ≈ 13.9.",
            "Two-sided p = 0.0020. Cohen’s d = 4.875 / √((7.125 + 6.0)/2) = 4.875 / 2.562 = 1.90.",
          ], result: "Strong evidence that the new layout is faster, by almost 5 minutes per cycle, a very large effect relative to shift-to-shift variation. Caveat: the plants differ in more than layout (staff, products), so this is evidence of a difference between plants, not proof the layout caused it." } },
          { example: { title: 'Paired: did the training work?', setup: "Eight sales staff take a product-knowledge test before and after a training course. Before: 62, 70, 55, 68, 74, 59, 65, 71. After: 66, 73, 57, 73, 77, 64, 67, 75.", steps: [
            "Differences (after − before): 4, 3, 2, 5, 3, 5, 2, 4. Mean difference = 28 / 8 = 3.5 points.",
            "SD of the differences = 1.195. SE = 1.195 / √8 = 0.423.",
            "t = 3.5 / 0.423 = 8.28 with 7 degrees of freedom. p = 0.00007.",
            "95% CI for the mean gain: 3.5 ± 2.365 × 0.423 = 2.5 to 4.5 points.",
            "Wrong analysis for comparison: treating the groups as independent (Welch) gives t = 1.06, p = 0.31, “not significant”.",
          ], result: "Every single person improved, and the paired test sees it clearly. The independent test drowns the 3.5-point gain in the much larger differences between people (SDs of about 6.5 points in each group). Using the wrong test would have cancelled a training programme that works." } },
          { diagram: { kind: 'table', head: ['Employee', 'Before', 'After', 'Gain'], rows: [['1', '62', '66', '+4'], ['2', '70', '73', '+3'], ['3', '55', '57', '+2'], ['4', '68', '73', '+5'], ['5', '74', '77', '+3'], ['6', '59', '64', '+5'], ['7', '65', '67', '+2'], ['8', '71', '75', '+4']], caption: "Scores range from 55 to 77 between people, but the gains only range from +2 to +5. The paired test analyses the narrow Gain column, which is why it is so much more powerful here." } },
        ],
      },
      {
        heading: 'Assumptions and how to check them',
        blocks: [
          { bullets: [
            "**Independence.** Each observation (or each pair) must be independent of the others. Ten readings from the same bottle are not ten bottles. This is the assumption that matters most and cannot be fixed by any formula.",
            "**Approximate normality.** The t-test assumes the data (or the paired differences) come from a roughly normal population. With small samples, check a histogram or Q-Q plot. With 30+ per group, the CLT makes the test robust to moderate skew.",
            "**No dominant outliers.** One extreme value can swing both the mean and the SD. Investigate it before testing.",
            "**Equal variances?** Not needed if you use Welch’s test.",
          ] },
          { p: "When the assumptions fail badly, use a **non-parametric** alternative that works on ranks instead of raw values: the Mann–Whitney U test instead of the two-sample t-test, and the Wilcoxon signed-rank test instead of the paired t-test. They are less sensitive to outliers and skew, at a small cost in power when data really are normal." },
          { diagram: { kind: 'compare', left: { title: 'Paired t-test', items: ['Same units measured twice', 'Analyses within-unit differences', 'Removes person-to-person variation', 'Often far more powerful', 'Needs a natural one-to-one pairing'] }, right: { title: 'Independent (Welch) t-test', items: ['Two separate groups of units', 'Compares group means directly', 'Between-unit variation stays in the noise', 'Needs larger samples for the same power', 'Group sizes can differ'] }, caption: "Choose by the design of the data, not by which gives the smaller p-value. If the data are paired, an independent test is not “conservative”; it is wrong." } },
        ],
      },
      {
        heading: 't-tests in the real world',
        blocks: [
          { case: { title: 'Guinness and the birth of the t-test', story: "Gosset’s job at Guinness involved comparing small batches: barley varieties, growing conditions, hop qualities, often with only a few measurements each. Existing methods treated the sample SD as if it were the true SD, which made small experiments look more certain than they were. Gosset derived the correct distribution for a mean standardised by an estimated SD, the t-distribution, and published it in 1908 in the journal Biometrika as “Student”, reportedly because Guinness preferred staff not to publish under their own names. The statistician Ronald Fisher later recognised its importance and built it into the framework of experimental design that farms, factories and laboratories still use." } },
          { bullets: [
            "**Manufacturing:** one-sample tests that a process mean matches its specification; two-sample tests comparing suppliers or machines.",
            "**Automotive testing:** paired tests of fuel economy or braking distance on the same cars under two conditions.",
            "**HR and training:** paired before-and-after assessments.",
            "**A/B testing of continuous metrics:** average order value or session length, usually with Welch’s test and large samples.",
            "**Model evaluation:** paired t-tests (with care) to compare two models’ scores on the same cross-validation folds.",
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            "**Independent test on paired data.** As the training example showed, this can hide a strong effect completely.",
            "**Many pairwise t-tests.** Comparing 5 groups two at a time means 10 tests, and false positives multiply. Use ANOVA followed by corrected post-hoc comparisons.",
            "**Tiny skewed samples.** Revenue per customer with 8 observations and one big spender breaks the normality assumption. Use Mann–Whitney or a bootstrap.",
            "**Significance without size.** With 50,000 users per arm, a ₹2 difference in average order value can be significant. Report the CI and judge whether ₹2 matters.",
            "**Correlation is not causation.** A t-test between two plants or two regions shows a difference, not its cause. Only randomised experiments support causal claims.",
          ] },
          { callout: "A complete t-test report reads like this: “Training raised scores by 3.5 points on average (95% CI 2.5 to 4.5; paired t(7) = 8.28, p < 0.001).” Effect, interval, test, p-value: in that order of importance.", tone: 'key' },
        ],
      },
    ],
    faq: [
      { q: "What is the difference between a t-test and a z-test?", a: "A z-test assumes the population SD is known (or uses proportions with large samples) and compares against the normal distribution. A t-test estimates the SD from the data and uses the t-distribution. For means, the t-test is almost always the right choice; with large samples the two agree." },
      { q: "How small a sample can a t-test handle?", a: "Technically as few as 2 per group, but power will be very low and the normality assumption cannot be checked. With fewer than about 10 per group, results should be treated as tentative." },
      { q: "Should I use Student’s or Welch’s two-sample t-test?", a: "Welch’s, by default. It performs nearly as well as Student’s when variances are equal and much better when they are not. In scipy, pass `equal_var=False`." },
      { q: "Can I use a t-test on percentages or ratings from 1 to 5?", a: "For averages of ratings over many respondents, a t-test is commonly used and usually fine. For yes/no outcomes summarised as percentages, a test for proportions (z-test or chi-square) is more natural." },
      { q: "What does “t(7) = 8.28” mean in a report?", a: "A t-statistic of 8.28 with 7 degrees of freedom. The degrees of freedom tell the reader which t-distribution was used to compute the p-value." },
    ],
  },
};
