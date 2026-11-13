import { DeepLesson } from './types';

// REGRESSION MODELS group: linear, multiple, polynomial, ridge/lasso, Poisson/GLMs, logistic.
// Every number in the worked examples was checked with numpy / scikit-learn / statsmodels.
export const REGRESSION_DEEP: Record<string, DeepLesson> = {
  'linear-regression': {
    minutes: 19,
    hook: 'A young couple in Chennai are looking at a 1,100 sq ft flat in Velachery listed at ₹62 lakh. Is that fair? The broker says "market rate", the seller says "bargain", and the couple have no idea. What they really want is a rule built from recent sales: "for flats like this, each extra 100 sq ft costs about this much". Drawing the best straight line through past sales gives exactly that rule. That line is **linear regression**, the first and most widely used model in all of data science.',
    sections: [
      {
        heading: 'The problem: turning past sales into a pricing rule',
        blocks: [
          { p: 'Businesses constantly need to predict a **number**: next month’s sales, a machine’s running cost, the price a flat will fetch. In each case there is something we know (the size of the flat) and something we want to estimate (its price).' },
          { term: 'Target', def: 'The number you want to predict, such as the price of a flat. Also called the dependent variable, the response or simply y.' },
          { term: 'Feature', def: 'A piece of information you use to make the prediction, such as the floor area. Also called an input, a predictor, an independent variable or x.' },
          { p: 'If you plot area against price for recent sales in one neighbourhood, you usually see an upward-sloping cloud of dots. Bigger flats cost more, but not perfectly: two flats of the same size can differ by a few lakh because of the view, the floor or how hard the seller bargained.' },
          { diagram: { kind: 'scatter', xLabel: 'area (hundreds of sq ft)', yLabel: 'price (₹ lakh)', line: { m: 4.3, b: 9 }, caption: 'Five recent sales in one Chennai neighbourhood and the best straight line through them: price ≈ 4.3 × area + 9. The dots sit close to the line but not exactly on it. Those small gaps are the errors the method tries to keep small.', points: [[6, 35], [8, 44], [10, 50], [12, 62], [14, 69]] } },
          { p: 'Linear regression answers one question: **which straight line best summarises the relationship between the feature and the target?** Once we have that line we can do two useful things. We can **predict** (a 1,100 sq ft flat should cost about ₹56 lakh), and we can **explain** (each extra 100 sq ft adds about ₹4.3 lakh).' },
          { term: 'Regression', def: 'Any method that predicts a number, as opposed to a category such as "spam / not spam".' },
        ],
      },
      {
        heading: 'Building the intuition: a ruler on a pinboard',
        blocks: [
          { p: 'Imagine the sales are pins stuck in a cork board. You hold a long ruler over them and try to place it so it runs "through the middle" of the pins. No position touches every pin, so you need a fair way to decide which position is best.' },
          { steps: [
            '**Place the ruler anywhere.** Some pins are above it, some below.',
            '**Measure each pin’s vertical gap to the ruler.** A pin 2 cm above and a pin 2 cm below are equally badly served.',
            '**Square each gap and add them up.** Squaring makes every gap positive and punishes big misses much more than small ones: a 4 cm miss counts four times as much as a 2 cm miss, not twice.',
            '**Tilt and slide the ruler** to make that total as small as possible.',
            '**The winning position is the regression line.** Its tilt is the slope; where it crosses the left edge is the intercept.',
          ], title: 'Finding the fairest ruler position' },
          { term: 'Residual', def: 'The vertical gap between an actual data point and the line: actual value minus predicted value. Positive means the line under-predicted; negative means it over-predicted.' },
          { think: { q: 'Why not simply add up the gaps without squaring them?', a: 'Positive and negative gaps would cancel. A terrible line that is 10 above one point and 10 below another would score a perfect zero. Squaring stops the cancelling and also makes the maths give a single clean answer.' } },
          { callout: 'Linear regression does not "understand" flats. It finds the straight line that keeps the squared gaps smallest. Deciding whether a straight line is sensible, and what the slope means for the business, is your job.', tone: 'key' },
        ],
      },
      {
        heading: 'How it works, step by step',
        blocks: [
          { diagram: { kind: 'flow', nodes: ['**Collect** pairs of (feature, target)', '**Plot** them and check the cloud looks roughly straight', '**Fit** the line that minimises squared residuals', '**Check** residuals, R² and RMSE on new data', '**Use** the slope to explain and the line to predict'], caption: 'The everyday workflow. The fitting step takes milliseconds; the checking steps are where the real thinking happens.' } },
          { p: '**Steps 1 and 2: Collect and look.** You need examples where both feature and target are known, say 200 recent sales. Plot them first: if the cloud bends, or one point sits miles from the rest, a straight line may be the wrong tool.' },
          { p: '**Step 3: Fit.** The computer finds the slope and intercept that minimise the sum of squared residuals. For a single feature there is an exact formula (next section); for millions of rows and many features it uses fast matrix algebra or an iterative method called gradient descent.' },
          { term: 'Least squares', def: 'The rule "choose the line that makes the sum of squared residuals as small as possible". Linear regression fitted this way is often called OLS, for ordinary least squares.' },
          { p: '**Steps 4 and 5: Check and use.** Measure the typical error on flats the model has not seen and look at the residuals for patterns. Then read the slope as a business fact ("₹4.3 lakh per 100 sq ft here") and price new listings, remembering the typical error.' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { p: 'A straight line needs just two numbers: how steep it is and where it starts. Everything in this section is about finding those two numbers and then judging how good the line is.' },
          { tex: '\\hat{y} = b_0 + b_1 x', plain: 'Predicted price = starting value + slope × area. The little hat on y means "predicted", to keep it separate from the real price.', symbols: [['\\hat{y}', 'the predicted target (price)'], ['x', 'the feature (area)'], ['b_1', 'slope: change in prediction per one-unit increase in x'], ['b_0', 'intercept: the prediction when x = 0']] },
          { tex: 'SSE = \\sum_{i=1}^{n} (y_i - \\hat{y}_i)^2', plain: 'For every one of the n data points, take the residual (actual minus predicted), square it, and add them all up. Least squares picks the b₀ and b₁ that make this total smallest.', symbols: [['SSE', 'sum of squared errors'], ['y_i', 'actual value of point i'], ['\\hat{y}_i', 'predicted value of point i'], ['n', 'number of data points']] },
          { p: 'Using a little calculus (setting the slope of SSE to zero), the best line has a neat formula. You never need to derive it, but it is worth reading in words because it shows what the slope really measures.' },
          { tex: 'b_1 = \\frac{\\sum (x_i - \\bar{x})(y_i - \\bar{y})}{\\sum (x_i - \\bar{x})^2}, \\qquad b_0 = \\bar{y} - b_1 \\bar{x}', plain: 'The slope compares how x and y move together (top) with how much x moves on its own (bottom). The intercept is then chosen so the line passes exactly through the average point (x̄, ȳ).', symbols: [['\\bar{x}', 'average of the feature'], ['\\bar{y}', 'average of the target']] },
          { p: 'Read the top of the fraction carefully. For a flat that is bigger than average (x − x̄ positive) and also pricier than average (y − ȳ positive), the product is positive. If big flats are usually expensive flats, these products pile up and the slope is positive. If size and price had nothing to do with each other, the positives and negatives would cancel and the slope would be near zero.' },
          { term: 'RMSE', def: 'Root mean squared error: square the residuals, average them, then take the square root. It is a "typical size of error" in the same units as the target, e.g. ₹1.1 lakh.' },
          { tex: 'R^2 = 1 - \\frac{\\sum (y_i - \\hat{y}_i)^2}{\\sum (y_i - \\bar{y})^2}', plain: 'Compare the errors of your line (top) with the errors of the laziest possible prediction, which is always guessing the average price (bottom). R² is the share of that variation your line removes.', symbols: [['R^2', 'coefficient of determination, between 0 and 1 on training data']] },
          { p: 'R² = 0.9 means the line explains 90% of the variation in price; R² = 0 means it is no better than guessing the average. RMSE says how wrong you will typically be in rupees, which business people usually care about more.' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Fitting the flat-price line by hand', setup: 'Five sales: area (hundreds of sq ft) 6, 8, 10, 12, 14 and price (₹ lakh) 35, 44, 50, 62, 69. Find the least-squares line.', steps: [
            'Averages: x̄ = (6 + 8 + 10 + 12 + 14) / 5 = 10. ȳ = (35 + 44 + 50 + 62 + 69) / 5 = 52.',
            'Deviations of x from 10: −4, −2, 0, 2, 4. Deviations of y from 52: −17, −8, −2, 10, 17.',
            'Products: (−4)(−17) = 68, (−2)(−8) = 16, 0 × (−2) = 0, 2 × 10 = 20, 4 × 17 = 68. Sum = 172.',
            'Squared x deviations: 16 + 4 + 0 + 4 + 16 = 40.',
            'Slope b₁ = 172 / 40 = 4.3. Intercept b₀ = 52 − 4.3 × 10 = 9.',
            'Line: price = 9 + 4.3 × area. Predictions: 34.8, 43.4, 52.0, 60.6, 69.2. Residuals: 0.2, 0.6, −2.0, 1.4, −0.2.',
          ], result: 'Each extra 100 sq ft adds about ₹4.3 lakh. The couple’s 1,100 sq ft flat (area 11) should cost about 9 + 4.3 × 11 = ₹56.3 lakh, so the ₹62 lakh asking price is roughly ₹6 lakh above the line.' } },
          { diagram: { kind: 'table', head: ['Area x', 'Price y', 'Predicted ŷ', 'Residual', 'Residual²'], rows: [['6', '35', '34.8', '0.2', '0.04'], ['8', '44', '43.4', '0.6', '0.36'], ['10', '50', '52.0', '−2.0', '4.00'], ['12', '62', '60.6', '1.4', '1.96'], ['14', '69', '69.2', '−0.2', '0.04'], ['Total', '', '', '0.0', '6.40']], caption: 'The residuals of a least-squares line always add up to zero, and the sum of squared residuals (6.40) is the smallest any straight line can achieve on these five points.' } },
          { example: { title: 'How good is the line? R² and RMSE', setup: 'Using the same five flats, judge the fit.', steps: [
            'Sum of squared residuals (from the table) = 6.40.',
            'Errors of the lazy "always guess ₹52 lakh" model: 17² + 8² + 2² + 10² + 17² = 289 + 64 + 4 + 100 + 289 = 746.',
            'R² = 1 − 6.40 / 746 = 1 − 0.0086 ≈ 0.991.',
            'RMSE = √(6.40 / 5) = √1.28 ≈ 1.13, i.e. about ₹1.1 lakh.',
          ], result: 'The line removes about 99% of the variation, and predictions are typically within about ₹1.1 lakh on these flats. Real data is messier, and this is measured on the training flats, which flatters the model.' } },
          { example: { title: 'Business case: fixed and variable cost of a factory', setup: 'A component plant in Hosur records monthly output (thousand units) and total monthly cost (₹ lakh): (1, 22), (2, 27), (3, 35), (4, 38), (5, 43). Management wants to split cost into fixed and variable parts.', steps: [
            'x̄ = 3, ȳ = 33. Deviations of x: −2, −1, 0, 1, 2. Deviations of y: −11, −6, 2, 5, 10.',
            'Sum of products = 22 + 6 + 0 + 5 + 20 = 53. Sum of squared x deviations = 4 + 1 + 0 + 1 + 4 = 10.',
            'Slope = 53 / 10 = 5.3 (₹ lakh per thousand units), i.e. about ₹530 per extra unit.',
            'Intercept = 33 − 5.3 × 3 = 17.1 (₹ lakh), the estimated cost of running the plant even at zero output.',
            'R² ≈ 0.98. Forecast for 6,000 units: 17.1 + 5.3 × 6 = ₹48.9 lakh.',
          ], result: 'Here, unlike the flat example, the intercept has a real meaning: about ₹17 lakh per month of fixed cost (rent, salaries, standing charges). The slope is the variable cost per unit, which feeds directly into pricing and break-even calculations.' } },
        ],
      },
      {
        heading: 'Assumptions and how to check them',
        blocks: [
          { p: 'The line can always be computed. Whether you should trust it depends on four assumptions, often remembered as **LINE**. You check them mostly by looking at the residuals.' },
          { bullets: [
            '**L – Linear:** the true relationship is roughly a straight line. Check: the scatter plot, and a residual plot with no curve in it.',
            '**I – Independent:** one data point’s error tells you nothing about the next. Monthly sales that drift together over time break this.',
            '**N – Normal errors:** residuals roughly follow a bell curve. This matters mainly for confidence intervals and p-values, much less for prediction.',
            '**E – Equal spread:** residuals are about as spread out for small flats as for big ones. A funnel shape (bigger errors for bigger flats) breaks this.',
          ] },
          { term: 'Residual plot', def: 'A chart of residuals (vertical) against predicted values or the feature (horizontal). A good model leaves a shapeless band around zero; any pattern means the model is missing something.' },
          { diagram: { kind: 'scatter', xLabel: 'speed (km/h)', yLabel: 'residual (litres per 100 km)', line: { m: 0, b: 0 }, caption: 'Residuals from forcing a straight line through fuel-use data. They go positive, negative, then positive again: a clear U-shape. The data curves, so a straight line is the wrong model. Polynomial regression (a later chapter) fixes this.', points: [[40, 1.04], [60, -0.54], [80, -1.02], [100, -0.5], [120, 1.02]] } },
          { callout: 'For pure prediction, focus on test-set RMSE and the residual plot. For confidence intervals on the slope, all four assumptions matter.', tone: 'tip' },
        ],
      },
      {
        heading: 'In the real world',
        blocks: [
          { case: { title: 'A property portal’s price guide (illustrative)', story: 'A property portal wants to show "Is this listing fairly priced?" next to each flat. Analysts start with linear regression of price on area, separately for each locality, because it is fast, transparent and easy to explain to sellers. In a locality like Velachery the slope might come out around ₹4–5 lakh per 100 sq ft. Listings far above the line are flagged "priced high"; those far below are checked for errors or fraud. Over time the team adds more features (age, floor, metro distance), which is multiple regression, and compares fancier models against this baseline. The simple line stays on the page because sellers trust what they can understand.' } },
          { bullets: [
            '**Finance:** estimating a stock’s beta by regressing its returns on the market’s returns. The slope is the beta.',
            '**Manufacturing:** cost splitting into fixed and variable parts, as in the Hosur example.',
            '**Automotive:** relating vehicle weight to fuel consumption or battery range during early design.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { example: { title: 'One bad data point drags the line', setup: 'Add a sixth "sale" to the five flats: 900 sq ft at ₹90 lakh (perhaps a typing error for ₹40 lakh). Refit.', steps: [
            'Without the outlier: slope 4.3, intercept 9.',
            'With the outlier: slope ≈ 3.44, intercept ≈ 24.5.',
            'One point out of six cut the price-per-100-sq-ft estimate by a fifth and shifted every prediction.',
          ], result: 'Because errors are squared, a single far-away point has an outsized pull. Always plot the data and investigate extreme points before trusting the line.' } },
          { bullets: [
            '**Extrapolation:** a line fitted on 600–1,400 sq ft flats says nothing reliable about a 5,000 sq ft villa.',
            '**Correlation is not causation:** a slope says the two move together in this data, not that changing one will change the other.',
            '**Curved relationships:** fuel versus speed, sales versus discount. Use polynomial terms or tree-based models.',
            '**One feature is rarely enough:** price also depends on locality, age and floor. Leaving them out can bias the slope. Use multiple regression.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'Linear regression shines when…', items: ['The target is a number', 'The scatter looks roughly straight', 'You need to explain the effect in one sentence', 'You want a fast, transparent baseline', 'Data is small or medium sized'] }, right: { title: 'Reach for something else when…', items: ['The pattern curves → **polynomial regression** or trees', 'Many correlated features → **ridge / lasso**', 'Target is yes/no → **logistic regression**', 'Target is a count → **Poisson regression**', 'Heavy outliers → **robust (Huber) regression**'] }, caption: 'Linear regression is the starting point of the whole regression family. Each later chapter in this group fixes one of its limits.' } },
        ],
      },
    ],
    faq: [
      { q: 'Is linear regression really machine learning? It feels like school statistics.', a: 'Both. It learns its numbers from data and predicts new cases, which is what machine learning means. It is also the baseline every fancier model must beat.' },
      { q: 'What is a good R²?', a: 'It depends on the field. Physical processes can give 0.95 or more; human behaviour (sales, prices) often gives 0.3 to 0.8 and is still useful. Judge a model by its error in business units (RMSE in rupees) on unseen data, and by whether it beats the simple alternatives.' },
      { q: 'The intercept is negative. Did something go wrong?', a: 'Usually not. The intercept is the prediction at x = 0, which is often far outside your data (a 0 sq ft flat). It simply positions the line. Only interpret it when x = 0 is meaningful, as with zero output in the factory example.' },
      { q: 'How many data points do I need?', a: 'Two points define a line but tell you nothing about its reliability. Aim for at least 20 to 30 for one feature, and hold some back for testing.' },
      { q: 'Should I use the formula or gradient descent?', a: 'Libraries such as scikit-learn’s `LinearRegression` use exact linear algebra, which is perfect for typical business datasets. Gradient descent is used for enormous datasets or when the same idea is extended into neural networks.' },
      { q: 'Can linear regression handle categories like "near metro: yes / no"?', a: 'Yes. Code them as 0/1 columns (called dummy variables) and use multiple regression. The coefficient then reads as the price difference between the two groups, holding everything else fixed.' },
    ],
  },

  'multiple-regression': {
    minutes: 17,
    hook: 'A buyer notices that 3-bedroom flats in Chennai sell for about ₹12 lakh more per extra bedroom than smaller ones and concludes that adding a bedroom is a great investment. A builder notices the same number and wonders whether to squeeze a third bedroom into the same 1,000 sq ft. Both are about to be misled. Flats with more bedrooms are also **bigger**, so the ₹12 lakh mixes two effects together. **Multiple regression** is the tool that pulls them apart.',
    sections: [
      {
        heading: 'The problem: many things drive one number',
        blocks: [
          { p: 'In the previous chapter one feature (area) predicted one target (price). Real prices depend on many things at once: area, age, floor, locality, distance to the metro, parking. Using only one of them leaves useful information on the table and, worse, can give a misleading answer about the one you did use.' },
          { p: 'Multiple regression keeps the simple idea of a straight-line model but lets it use **several features together**. Each feature gets its own number, called a coefficient, that says how much the prediction moves when that feature changes.' },
          { term: 'Coefficient', def: 'The number multiplying a feature in the model. In multiple regression it is the expected change in the target for a one-unit increase in that feature, with all the other features held at the same values.' },
          { p: 'That last phrase, "with all the other features held at the same values", is the whole point. It lets us ask questions that a simple chart cannot answer, such as: **how much more does a flat near the metro cost than an identical flat of the same size and age far from it?**' },
          { diagram: { kind: 'table', head: ['Flat', 'Area (100 sq ft)', 'Bedrooms', 'Age (yrs)', 'Near metro', 'Price (₹ L)'], rows: [['A', '6', '1', '4', '0', '27.5'], ['B', '8', '2', '15', '1', '37.1'], ['C', '9', '2', '6', '0', '38.3'], ['D', '10', '2', '3', '1', '51.0'], ['E', '11', '3', '18', '0', '40.4'], ['F', '12', '3', '9', '1', '56.7'], ['G', '14', '3', '12', '0', '54.4'], ['H', '15', '4', '7', '1', '69.6']], caption: 'Eight flats described by four features. Notice flat E: bigger than D but cheaper, because it is 18 years old and far from the metro. Only a model that looks at all columns together can make sense of that.' } },
        ],
      },
      {
        heading: 'Building the intuition: comparing like with like',
        blocks: [
          { p: 'Think of how an experienced broker values a flat. She does not just say "1,000 sq ft, so ₹45 lakh". She starts from a base price for the size, then adjusts: "knock off a bit because it is 15 years old, add a premium because the metro station is a five-minute walk". Each adjustment is made **as if everything else were the same**.' },
          { steps: [
            '**Start with a base value** for a flat of a given size.',
            '**Adjust for age**: so many lakh less per year, comparing flats of the same size and location.',
            '**Adjust for location**: a fixed premium for being near the metro, comparing flats of the same size and age.',
            '**Add up the adjustments** to get the final estimate.',
          ], title: 'How the broker reasons' },
          { p: 'Multiple regression learns those adjustments from data. It finds the set of coefficients that, used together, make the predictions as close as possible to the real prices, using exactly the same least-squares rule as before.' },
          { term: 'Holding other features constant', def: 'Comparing cases that differ in only one feature. A coefficient in multiple regression estimates the effect of that one feature after the model has accounted for the others it can see.' },
          { think: { q: 'In the hook, why was "₹12 lakh per bedroom" misleading?', a: 'Because bedrooms and area travel together: flats with more bedrooms are usually bigger. The ₹12 lakh includes the value of the extra space. Once the model also sees area, it can ask what an extra bedroom is worth in a flat of the same size, and the answer is much smaller.' } },
          { callout: 'A coefficient only "holds constant" the features that are in the model. If something important is left out (say, sea view), its effect leaks into whichever included features are correlated with it.', tone: 'warn' },
        ],
      },
      {
        heading: 'How it works, step by step',
        blocks: [
          { diagram: { kind: 'flow', nodes: ['**Choose features** that plausibly drive the target', '**Encode** categories as 0/1 columns', '**Fit** all coefficients together by least squares', '**Diagnose**: adjusted R², residuals, VIF', '**Interpret** each coefficient "holding others fixed"'], caption: 'The multiple-regression workflow. Fitting is one line of code; choosing features and diagnosing problems take the time.' } },
          { p: '**Step 1: Choose features.** Use business knowledge. Each feature should have a plausible reason to affect the target and be known at the time you want to predict (do not use the final negotiated discount to predict the listed price).' },
          { p: '**Step 2: Encode categories.** A column such as "near metro: yes / no" becomes 1 or 0. A column with several categories (locality: Adyar, Velachery, Tambaram) becomes several 0/1 columns, leaving one category out as the reference.' },
          { term: 'Dummy variable', def: 'A 0/1 column that represents a category, such as near_metro = 1 for yes and 0 for no. Its coefficient is the average difference between the two groups, holding the other features fixed.' },
          { p: '**Step 3: Fit.** The computer solves for all coefficients at once. Fitting them one at a time would give different, wrong answers, because each feature’s effect depends on what the others are already explaining.' },
          { p: '**Step 4: Diagnose.** Check the fit on new data, look at residual plots and check whether any features are so strongly related to each other that their coefficients cannot be trusted (multicollinearity, below).' },
          { p: '**Step 5: Interpret.** Read each coefficient in business units with the phrase "holding the other features fixed".' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { tex: '\\hat{y} = b_0 + b_1 x_1 + b_2 x_2 + \\dots + b_p x_p', plain: 'The prediction is a starting value plus a weighted sum of the features. With two features this is a flat sheet (a plane) through a 3-D cloud of points instead of a line through a 2-D cloud.', symbols: [['x_1, \\dots, x_p', 'the p features (area, age, near_metro …)'], ['b_1, \\dots, b_p', 'their coefficients'], ['b_0', 'intercept: the prediction when every feature is 0'], ['p', 'number of features']] },
          { p: 'The fitting rule is unchanged: choose all the b’s together so that the sum of squared residuals is as small as possible. With many features, writing this out term by term gets messy, so statisticians pack the data into a table of numbers called a matrix.' },
          { tex: '\\hat{b} = (X^{\\top} X)^{-1} X^{\\top} y', plain: 'This compact formula gives all the least-squares coefficients in one go. X is the table of features (one row per flat, plus a column of 1s for the intercept), and y is the column of prices. You will never compute it by hand; the software does.', symbols: [['X', 'the feature matrix, n rows by (p + 1) columns'], ['y', 'the column of actual targets'], ['X^{\\top}', 'X flipped so rows become columns (the transpose)'], ['(\\cdot)^{-1}', 'matrix inverse, the matrix version of dividing']] },
          { p: 'One warning sign hides inside that formula. If two features carry almost the same information (area and number of bedrooms), the matrix X⊤X is close to impossible to invert, and the coefficients become wildly sensitive to tiny changes in the data. That is **multicollinearity**.' },
          { term: 'Multicollinearity', def: 'When two or more features are strongly related to each other, so the model cannot tell which one deserves the credit. Predictions can still be fine, but individual coefficients become unstable and hard to interpret.' },
          { tex: '\\text{VIF}_j = \\frac{1}{1 - R_j^2}', plain: 'To measure multicollinearity for feature j, predict it from all the other features and record that R². If the others explain feature j almost perfectly (R² near 1), the VIF explodes. A VIF above about 5 to 10 is a warning.', symbols: [['\\text{VIF}_j', 'variance inflation factor of feature j'], ['R_j^2', 'R² from predicting feature j using the other features']] },
          { p: 'Finally, plain R² has a flaw here: adding any feature, even random noise, can only raise it on training data. **Adjusted R²** charges a small fee for each feature, so it rises only if the new feature helps more than chance would.' },
          { tex: 'R^2_{adj} = 1 - (1 - R^2)\\,\\frac{n-1}{n-p-1}', plain: 'Take the unexplained share (1 − R²) and inflate it a little for every feature used. More features with the same R² means a lower adjusted R².', symbols: [['n', 'number of rows'], ['p', 'number of features']] },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Pricing a flat with three features', setup: 'Fitting price on area, age and near_metro for the eight flats in the table gives: price = 5.5 + 3.97 × area − 0.51 × age + 7.72 × near_metro (price in ₹ lakh, area in hundreds of sq ft). Price a 1,000 sq ft flat, 8 years old, near the metro.', steps: [
            'Start: 5.5.',
            'Area: 3.97 × 10 = 39.7 → running total 45.2.',
            'Age: −0.51 × 8 = −4.08 → running total 41.12.',
            'Metro: 7.72 × 1 = 7.72 → total 48.84.',
          ], result: 'About ₹48.8 lakh. Reading the coefficients: each extra 100 sq ft adds about ₹4 lakh, each year of age takes off about ₹51,000, and being near the metro is worth about ₹7.7 lakh, each holding the other two fixed.' } },
          { example: { title: 'The bedroom illusion, in numbers', setup: 'Same eight flats. Compare the bedroom coefficient with and without area in the model.', steps: [
            'Price on bedrooms alone: about ₹12.6 lakh per extra bedroom.',
            'Correlation between bedrooms and area in this data: 0.94. Bigger flats have more bedrooms.',
            'Price on area, bedrooms, age and metro together: the bedroom coefficient drops to about ₹1.6 lakh.',
            'VIFs: area ≈ 13.6 and bedrooms ≈ 16.2, both above 10. The model struggles to separate them.',
          ], result: 'Most of the "bedroom premium" was really a size premium. And because area and bedrooms are so collinear, even the ₹1.6 lakh is unreliable: a couple of different flats in the data could change it a lot. The practical choice is to keep area and drop bedrooms, or use regularisation (see the ridge and lasso chapter).' } },
          { diagram: { kind: 'bars', labels: ['Bedrooms alone', 'With area, age, metro'], values: [12.6, 1.6], highlight: 1, yLabel: '₹ lakh per extra bedroom', caption: 'The same data gives very different answers to "what is a bedroom worth?" depending on what else the model can see. The right-hand bar compares flats of the same size, age and location.' } },
          { example: { title: 'Business case: does a new feature earn its place?', setup: 'A retail chain models weekly store sales with 50 weeks of data. With 4 features (footfall, promotions, rainfall, a festival flag) R² = 0.800. Adding a fifth feature, the local cricket score, lifts R² to 0.801.', steps: [
            'Adjusted R² with 4 features: 1 − 0.200 × 49 / 45 = 1 − 0.2178 ≈ 0.782.',
            'Adjusted R² with 5 features: 1 − 0.199 × 49 / 44 = 1 − 0.2216 ≈ 0.778.',
            'Plain R² went up; adjusted R² went down.',
          ], result: 'The cricket score did not add enough to justify itself. In practice, compare models by cross-validated error, but adjusted R² is a quick first filter.' } },
        ],
      },
      {
        heading: 'Interpreting coefficients well',
        blocks: [
          { p: 'Coefficients are what make multiple regression valuable to a business, and also where most mistakes happen. A few rules keep you safe.' },
          { bullets: [
            '**Always say the units.** "−0.51" means nothing; "about ₹51,000 less per year of age" is a business fact.',
            '**Always add "holding the others fixed".** The metro premium is for flats of the same area and age.',
            '**Do not compare raw sizes across features.** A coefficient of 7.7 for a 0/1 metro flag and 4 for area per 100 sq ft are in different units. To rank importance, standardise the features first (convert each to "standard deviations from its average").',
            '**Watch the signs.** A coefficient with a sign that contradicts common sense (older flats cost more?) often signals multicollinearity or a missing feature.',
            '**Association, not causation.** The metro premium may partly reflect other things near metro stations, such as shops and schools, that the model cannot see.',
          ] },
          { term: 'Omitted variable bias', def: 'When an important feature is left out of the model, and it is correlated with included features, their coefficients absorb part of its effect and become misleading.' },
          { diagram: { kind: 'scatter', xLabel: 'area (hundreds of sq ft)', yLabel: 'bedrooms', caption: 'Area against bedrooms for the eight flats. They rise together almost in lock-step (correlation 0.94). When two features move like this, the model cannot tell which one deserves credit for higher prices: classic multicollinearity.', points: [[6, 1], [8, 2], [9, 2], [10, 2], [11, 3], [12, 3], [14, 3], [15, 4]] } },
          { callout: 'If the goal is only prediction, multicollinearity is often harmless: the combined effect is estimated well. It matters when you want to explain or act on individual coefficients.', tone: 'key' },
        ],
      },
      {
        heading: 'In the real world',
        blocks: [
          { case: { title: 'Marketing mix modelling (illustrative)', story: 'A consumer-goods company wants to know what its TV, digital and in-store promotions each contribute to weekly sales. Analysts build a multiple regression of sales on spend in each channel, price, seasonality dummies and a festival flag (Diwali, Pongal). The coefficient on digital spend estimates the extra sales per extra ₹1 lakh of digital spend, holding TV, price and season fixed. TV and digital budgets often rise together before festivals, so the team checks VIFs and uses ridge regression when they are high. The results guide next year’s budget split, and the team validates them with controlled experiments in a few cities rather than trusting the coefficients alone.' } },
          { bullets: [
            '**Real estate:** hedonic pricing models value each attribute of a property (area, age, floor, amenities).',
            '**Human resources:** pay-equity reviews compare salaries holding role, grade and experience fixed.',
            '**Automotive:** estimating how weight, engine size and aerodynamics each affect fuel economy.',
            '**Energy:** predicting electricity demand from temperature, hour of day and day of week.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Too many features for the rows:** with 40 features and 50 rows the model memorises noise. Keep at least 10 to 20 rows per feature, or use ridge / lasso.',
            '**Collinear features:** unstable, sign-flipping coefficients. Drop or combine features, or regularise.',
            '**Hidden curves and interactions:** the metro premium might be larger for big flats. Add an interaction term (area × near_metro) or a polynomial term.',
            '**Leakage:** a feature that secretly contains the answer (the final sale price in another currency) gives a perfect but useless model.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'Multiple regression is right when…', items: ['Several features plausibly affect a numeric target', 'Effects are roughly additive and straight-line', 'You need explainable, per-feature effects', 'Features are not strongly collinear', 'Rows comfortably outnumber features'] }, right: { title: 'Consider instead…', items: ['Strong collinearity or many features → **ridge / lasso**', 'Curved effects → **polynomial terms** or splines', 'Complex interactions → **random forest / gradient boosting**', 'Count target → **Poisson regression**', 'Yes/no target → **logistic regression**'] }, caption: 'Multiple regression is the workhorse for explaining drivers. Its limits point directly to the next chapters.' } },
        ],
      },
    ],
    faq: [
      { q: 'What is the difference between simple and multiple regression?', a: 'Simple regression uses one feature; multiple regression uses several at once. The fitting rule (least squares) is the same. The big gain is that each coefficient becomes an effect "holding the others fixed".' },
      { q: 'How do I include a category with many levels, like locality?', a: 'Create one 0/1 column per locality and leave one out as the reference (pandas `get_dummies(drop_first=True)` does this). Each coefficient is then the price difference from the reference locality.' },
      { q: 'Should I remove features with high VIF?', a: 'If you care about interpreting coefficients, yes: drop one of the collinear pair or combine them. If you only care about prediction, you can keep them, ideally with ridge regression to stabilise the coefficients.' },
      { q: 'Do I need to scale features for multiple regression?', a: 'Not for plain least squares: predictions are identical either way. Scale when you want to compare coefficient sizes, and always scale before ridge or lasso.' },
      { q: 'Why does R² go up when I add a useless feature?', a: 'Because least squares can always use an extra column to fit the training data a tiny bit better, even if the column is noise. Adjusted R² and cross-validation correct for this.' },
      { q: 'Can I say that being near the metro causes a ₹7.7 lakh premium?', a: 'Not from this model alone. It shows the premium among flats of the same size and age in this data. Other things near metro stations could be responsible. Causal claims need experiments or careful causal-inference methods.' },
    ],
  },
  'polynomial-regression': {
    minutes: 16,
    hook: 'A logistics company runs a fleet of company cars between Chennai and Bengaluru and wants to tell its drivers the most fuel-efficient cruising speed. Test-track data shows that fuel use is high at 40 km/h, drops to a low around 80 km/h, then climbs again at 120 km/h. A straight line through that data says speed hardly matters, which is plainly wrong. **Polynomial regression** lets the line bend, finds the sweet spot, and still uses everything you learned about linear regression.',
    sections: [
      {
        heading: 'The problem: when the relationship curves',
        blocks: [
          { p: 'Linear regression assumes that each extra unit of x changes y by the same amount. Many business relationships do not behave like that. Fuel use first falls and then rises with speed. Sales rise with discount, but each extra percentage point brings less than the one before. Crop yield rises with fertiliser up to a point and then falls as the soil is overloaded.' },
          { p: 'Forcing a straight line through such data gives a model that is wrong in a systematic way: too high in the middle, too low at both ends, or the reverse. The residual plot shows a clear U or arch instead of a shapeless band.' },
          { diagram: { kind: 'curve', fn: '0.0012857*x*x - 0.20171*x + 13.5', fn2: '0.004*x + 6.3', xMin: 30, xMax: 130, marks: [{ x: 78.4, label: 'best speed ≈ 78 km/h' }], xLabel: 'speed (km/h)', yLabel: 'litres per 100 km', legend: ['quadratic fit', 'straight-line fit'], caption: 'Two models fitted to the same five test-track readings (7.5, 6.0, 5.6, 6.2, 7.8 litres at 40 to 120 km/h). The straight line is almost flat (R² ≈ 0.02) and says speed barely matters. The curved quadratic (R² ≈ 0.9997) captures the U-shape and its minimum near 78 km/h.' } },
          { term: 'Polynomial', def: 'An expression built from powers of a variable, such as 13.5 − 0.2x + 0.0013x². The highest power is called the degree: degree 1 is a straight line, degree 2 a single bend (a U or an arch), degree 3 can bend twice.' },
          { p: 'Polynomial regression answers the question: **can we capture this curve while keeping the simplicity and interpretability of linear regression?** The answer is yes, with one clever trick.' },
        ],
      },
      {
        heading: 'Building the intuition: bending the ruler',
        blocks: [
          { p: 'Go back to the ruler on the pinboard from the linear regression chapter. A wooden ruler cannot follow a U-shaped row of pins. Now swap it for a flexible plastic strip. You can bend it into a gentle U and lay it through the pins much more closely.' },
          { steps: [
            '**A stiff ruler (degree 1)** can only tilt. It misses any curve.',
            '**A slightly flexible strip (degree 2)** can bend once. Good for one valley or one peak.',
            '**A more flexible strip (degree 3 or 4)** can bend two or three times.',
            '**A strip as floppy as cooked noodles (degree 15)** can be pushed through every single pin, wiggling wildly in between.',
          ], title: 'More flexibility, closer fit, more danger' },
          { p: 'The last case is the trap. A noodle that passes through every pin has learned the exact position of each pin, including the random wobble in the measurements. Put in a new pin and the noodle is likely to be far from it. That is **overfitting**.' },
          { term: 'Overfitting', def: 'When a model fits the training data so closely that it learns the random noise as well as the real pattern, and so predicts new data badly. The opposite, a model too simple to capture the pattern, is underfitting.' },
          { think: { q: 'If a degree-4 polynomial passes exactly through all five fuel readings (zero training error), why not use it?', a: 'Because five points are only five noisy measurements. A curve that matches them perfectly has also matched the noise, so it will usually predict a sixth reading worse than a smoother curve. Zero training error is a warning sign, not a goal.' } },
          { callout: 'The goal is the gentlest bend that captures the real shape. Flexibility is a dial to be set by testing on new data, not turned to maximum.', tone: 'key' },
        ],
      },
      {
        heading: 'How it works, step by step',
        blocks: [
          { p: 'Here is the clever trick. Instead of inventing a new algorithm for curves, we invent **new columns**. Alongside speed we add speed² (and perhaps speed³). Then we run ordinary multiple regression on those columns. The model is still a weighted sum, so all the least-squares machinery works unchanged.' },
          { term: 'Feature engineering', def: 'Creating new input columns from existing ones (squares, ratios, logs, date parts) so that a simple model can capture a more complex pattern.' },
          { diagram: { kind: 'flow', nodes: ['**Start** with feature x', '**Add columns** x², x³ … up to degree d', '**Scale** the columns', '**Fit** ordinary least squares on all columns', '**Pick d** with the lowest cross-validated error'], caption: 'Polynomial regression is multiple regression on powers of x. In scikit-learn this is `PolynomialFeatures` followed by `LinearRegression`.' } },
          { p: '**Step 1: Create the powers.** For speed 80, the new row is (80, 6,400) for degree 2, or (80, 6,400, 512,000) for degree 3.' },
          { p: '**Step 2: Scale.** Powers grow fast: 120¹⁰ is about 6 × 10²⁰. Columns of such different sizes make the computer’s arithmetic unstable. Standardising before (or after) creating powers keeps the numbers tame.' },
          { p: '**Step 3: Fit.** Ordinary least squares chooses one coefficient per column.' },
          { p: '**Step 4: Choose the degree.** Try degrees 1, 2, 3 … and compare their error on data the model did not train on, using cross-validation. Choose the lowest degree whose validation error is (nearly) the best.' },
          { term: 'Cross-validation', def: 'Splitting the data into, say, 5 parts; training on 4 and testing on the fifth; repeating so each part is tested once; and averaging the 5 test errors. It estimates how a model will do on new data.' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { tex: '\\hat{y} = b_0 + b_1 x + b_2 x^2 + \\dots + b_d x^d', plain: 'The prediction is a starting value plus a weighted sum of x, x squared, and so on up to x to the power d. The weights b are found by least squares, exactly as in multiple regression.', symbols: [['d', 'the degree, the highest power used'], ['b_0, \\dots, b_d', 'coefficients chosen by least squares']] },
          { p: 'Why is this still called **linear** regression when the curve is obviously bent? Because "linear" refers to the **coefficients**, not to x. Each b simply multiplies a column and the results are added. Whether a column holds x or x² makes no difference to the fitting method. Statisticians say the model is **linear in the parameters**.' },
          { p: 'Degree 2 deserves special attention because it is by far the most useful. A quadratic has exactly one turning point, and school algebra tells you where it is.' },
          { tex: 'x^{*} = -\\frac{b_1}{2\\,b_2}', plain: 'The turning point of a quadratic is at minus b₁ divided by twice b₂. If b₂ is positive the curve is a U and this is the minimum; if b₂ is negative it is an arch and this is the maximum.', symbols: [['x^{*}', 'the x-value of the minimum or maximum'], ['b_1', 'coefficient of x'], ['b_2', 'coefficient of x²']] },
          { p: 'This little formula is why quadratic models are popular in business: they turn data into an answer to "what is the best speed, price, dose or temperature?"' },
          { p: 'One more consequence of the trick: the coefficients of a polynomial are hard to read individually. In the fuel model, "−0.2017 per km/h" is not the effect of speed, because changing speed also changes speed². Interpret the curve as a whole, by its shape, turning point and predictions, not coefficient by coefficient.' },
          { callout: 'With several features the number of polynomial columns explodes. Ten features at degree 3, including all the cross terms such as x₁·x₂, give 286 columns. Polynomial regression works best with one to three features.', tone: 'warn' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Finding the most economical speed', setup: 'Test-track readings: speed 40, 60, 80, 100, 120 km/h; fuel 7.5, 6.0, 5.6, 6.2, 7.8 litres per 100 km. Fit a degree-2 polynomial.', steps: [
            'Straight-line fit: fuel = 6.3 + 0.004 × speed, R² ≈ 0.02. It says speed hardly matters.',
            'Quadratic fit (least squares on speed and speed²): fuel ≈ 13.5 − 0.2017 × speed + 0.001286 × speed², R² ≈ 0.9997.',
            'b₂ = 0.001286 is positive, so the curve is a U with a minimum.',
            'Best speed = 0.2017 / (2 × 0.001286) ≈ 78.4 km/h.',
            'Predicted fuel there ≈ 5.59 litres per 100 km. At 70 km/h the model predicts 5.68 and at 90 km/h 5.76.',
          ], result: 'Advise drivers to cruise at about 75 to 80 km/h. The straight line could never have given this answer.' } },
          { example: { title: 'Business case: the revenue-maximising price', setup: 'A D2C brand tests prices for a kitchen gadget across five comparable weeks: ₹200, ₹250, ₹300, ₹350, ₹400 per unit, selling 1,000, 880, 740, 610 and 480 units. Revenue (₹ thousand) = price × units / 1,000 = 200, 220, 222, 213.5, 192.', steps: [
            'Revenue rises and then falls: a straight line cannot find the peak.',
            'Quadratic fit: revenue ≈ −4.07 + 1.5579 × price − 0.0026714 × price².',
            'b₂ is negative, so the curve is an arch with a maximum.',
            'Best price = 1.5579 / (2 × 0.0026714) ≈ ₹292.',
            'Predicted revenue at ₹292 ≈ ₹223 thousand per week, only slightly above the ₹222 thousand observed at ₹300, which tells the team the peak is flat.',
          ], result: 'Price around ₹290 to ₹300. The flat top is itself useful: small price changes near the peak barely move revenue, so the team can choose ₹299 for marketing reasons at almost no cost. (Revenue also ignores costs; maximising profit would shift the best price upwards.)' } },
          { example: { title: 'Choosing the degree with cross-validation', setup: 'Thirty noisy fuel readings between 30 and 130 km/h are simulated from a true U-shaped curve. Polynomials of degree 1, 2, 3, 6 and 10 are fitted and checked with 5-fold cross-validation (RMSE in litres per 100 km).', steps: [
            'Degree 1: training RMSE 1.03, cross-validated RMSE 1.05. Underfits badly.',
            'Degree 2: training 0.29, cross-validated 0.31. Big improvement.',
            'Degree 3: training 0.28, cross-validated 0.34.',
            'Degree 6: training 0.28, cross-validated 0.39.',
            'Degree 10: training 0.26, cross-validated 0.43.',
          ], result: 'Training error keeps falling as the degree rises, but cross-validated error is lowest at degree 2 and then climbs. Degree 2 is the right choice, and it happens to match the true shape.' } },
        ],
      },
      {
        heading: 'Choosing the degree: the bias-variance balance',
        blocks: [
          { diagram: { kind: 'table', head: ['Degree', 'Training RMSE', 'Cross-validated RMSE', 'Verdict'], rows: [['1', '1.03', '1.05', 'Underfits'], ['2', '0.29', '0.31', 'Best'], ['3', '0.28', '0.34', 'Slightly worse'], ['6', '0.28', '0.39', 'Overfitting'], ['10', '0.26', '0.43', 'Overfitting']], caption: 'Training error always falls with degree, so it cannot choose the degree. Cross-validated error has a sweet spot.' } },
          { p: 'The pattern in that table appears all over machine learning. Too simple a model is consistently wrong in the same direction; statisticians call that **bias**. Too flexible a model chases noise and changes a lot if you give it slightly different data; that is **variance**. The best degree balances the two.' },
          { term: 'Bias and variance', def: 'Bias: error from a model being too simple to capture the real pattern. Variance: error from a model being so flexible that it reacts to random noise in the particular training data. Raising flexibility lowers bias but raises variance.' },
          { diagram: { kind: 'bars', labels: ['d=1', 'd=2', 'd=3', 'd=6', 'd=10'], values: [1.05, 0.31, 0.34, 0.39, 0.43], highlight: 1, yLabel: 'cross-validated RMSE', caption: 'Cross-validated error by degree. It drops sharply from degree 1 to 2, then creeps up as extra flexibility starts fitting noise.' } },
          { bullets: [
            '**Start with degree 2.** Most real business curves have one bend.',
            '**Go to degree 3 only with evidence** (an S-shape, or a clear cross-validation gain).',
            '**Rarely go beyond 3 or 4.** If you need more, a spline or a tree-based model is usually better.',
            '**Use domain knowledge.** Physics says air resistance grows with the square of speed, so a quadratic term for speed is natural.',
          ] },
        ],
      },
      {
        heading: 'In the real world',
        blocks: [
          { case: { title: 'Machine wear in a press shop (illustrative)', story: 'An automotive supplier runs stamping presses whose die wear depends on press speed. Too slow wastes capacity; too fast heats the die and wear accelerates sharply. Engineers log wear per 10,000 strokes at several speeds and fit a degree-2 polynomial of wear on speed. Combined with the cost of downtime and the value of extra output, the quadratic gives a recommended operating speed. They deliberately stay inside the tested speed range, refit monthly as new logs arrive, and compare the quadratic with a simple tree-based model to make sure the curve is not hiding anything.' } },
          { bullets: [
            '**Pricing:** finding revenue- or profit-maximising prices from test data.',
            '**Agriculture:** yield against fertiliser or irrigation, which typically peaks and then falls.',
            '**Marketing:** diminishing returns to advertising spend (often a square-root or log term works too).',
            '**Engineering:** calibration curves for sensors, battery capacity against temperature.',
            '**Economics:** wages rising with experience and flattening later in a career (an experience² term).',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { p: 'Polynomials behave beautifully inside the data range and badly outside it. The fuel quadratic predicts about 9.0 litres at 130 km/h and 14.1 litres at 160 km/h, purely because a U-curve keeps rising. It never saw a speed above 120. High-degree polynomials are worse: at the edges they can shoot to absurd values.' },
          { bullets: [
            '**Extrapolation:** never trust a polynomial outside the range of the training data.',
            '**Choosing degree by training fit:** always use cross-validation.',
            '**Unscaled powers:** large numbers to high powers cause numerical problems; standardise.',
            '**Too many features:** the number of terms explodes; use regularisation (next chapter) or trees.',
            '**Reading single coefficients:** interpret the curve, not the individual b’s.',
          ] },
          { term: 'Spline', def: 'A curve built from several low-degree polynomial pieces joined smoothly at chosen points (knots). It can follow complex shapes without the wild edge behaviour of one high-degree polynomial.' },
          { diagram: { kind: 'compare', left: { title: 'Polynomial regression fits when…', items: ['One or two features with a smooth curve', 'The shape has one or two bends', 'You want a turning point (best price, best speed)', 'You predict inside the observed range', 'You want a simple, explainable formula'] }, right: { title: 'Prefer instead…', items: ['Complex wiggly shapes → **splines / GAMs**', 'Many features with interactions → **gradient boosting**', 'High degree needed → **ridge-regularised polynomials**', 'Diminishing returns → **log or square-root transform**', 'Predictions far outside the data → none are safe; collect data'] }, caption: 'A quadratic term is one of the most useful tools in applied regression. Higher degrees are rarely the answer.' } },
        ],
      },
    ],
    faq: [
      { q: 'Is polynomial regression linear or non-linear?', a: 'The curve is non-linear in x, but the model is linear in its coefficients, so it is fitted with ordinary least squares. That is why it counts as a member of the linear regression family.' },
      { q: 'How do I know I need a polynomial term?', a: 'Plot the data and the residuals of a straight-line fit. A U or arch in the residuals is the classic sign. Then check that adding x² improves cross-validated error, not just training R².' },
      { q: 'What degree should I use?', a: 'Usually 2, sometimes 3. Pick the degree with the best cross-validated error, and prefer the lower degree when two are close.' },
      { q: 'Do I need to keep the x term if I add x²?', a: 'Yes. Dropping x forces the turning point to sit at x = 0, which is rarely sensible. Keep all lower powers when you include a higher one.' },
      { q: 'How do I do this in scikit-learn?', a: '`make_pipeline(StandardScaler(), PolynomialFeatures(degree=2), LinearRegression())`. Tune the degree with `GridSearchCV` or by comparing `cross_val_score` for each degree.' },
      { q: 'Why does my high-degree curve explode at the edges?', a: 'High powers grow very fast, and near the ends of the data there are few points to hold the curve down. This is called Runge’s phenomenon. Use a lower degree, splines, or a ridge penalty.' },
    ],
  },

  'ridge-lasso': {
    minutes: 16,
    hook: 'A marketing team has 80 weeks of sales data and 40 candidate drivers: spend in every channel, prices, competitor activity, weather, festivals. Ordinary multiple regression fits the past beautifully, with R² = 0.87, then predicts new weeks barely better than guessing the average. Several coefficients have absurd signs. The fix is surprisingly simple: **charge the model a fee for large coefficients**. That idea gives three famous methods, **Ridge, Lasso and Elastic Net**.',
    sections: [
      {
        heading: 'The problem: too many features, too little data',
        blocks: [
          { p: 'Multiple regression works well when you have many more rows than features and the features are not strongly related to each other. Business data often breaks both conditions. You have dozens of candidate drivers, many of them overlapping (TV and digital spend both rise before Diwali), and only a couple of years of weekly data.' },
          { p: 'In that situation least squares does what it is told: it finds the coefficients that fit the training data best. With so much freedom it uses some features to fit noise, and gives correlated features huge coefficients of opposite signs that happen to cancel on the training data. On new data the cancelling fails and predictions swing wildly.' },
          { diagram: { kind: 'bars', labels: ['OLS (train)', 'OLS (CV)', 'Ridge (CV)', 'Lasso (CV)'], values: [0.87, 0.18, 0.44, 0.59], highlight: 3, yLabel: 'R²', caption: 'Simulated weekly data: 80 rows, 40 candidate features, of which only 6 truly matter. Ordinary least squares looks excellent on its training data (0.87) but scores only 0.18 under cross-validation. Ridge and Lasso trade a little training fit for much better performance on unseen weeks.' } },
          { term: 'Overfitting', def: 'When a model fits its training data so closely that it learns random noise as well as the real pattern, so it predicts new data badly. Cross-validation (testing on held-out parts of the data) is how you detect it.' },
          { term: 'Regularisation', def: 'Adding a penalty to the model’s objective that discourages complexity, usually large coefficients. It deliberately makes the training fit slightly worse to make predictions on new data better.' },
          { p: 'The penalty is the whole idea. Instead of asking only "how well do you fit?", we ask "how well do you fit, **and** how big are your coefficients?" A model that wants a big coefficient must earn it by reducing the error a lot.' },
        ],
      },
      {
        heading: 'Building the intuition: a budget for coefficients',
        blocks: [
          { p: 'Imagine a manager building a project team from 40 freelancers. Each freelancer is a feature, and the money paid to each is their coefficient. With an unlimited budget the manager would pay everyone something, including people who add little or who duplicate each other’s work. Now introduce a cost of spending.' },
          { steps: [
            '**Ridge is like a tax that rises steeply with each payment.** Paying one person a fortune is heavily taxed, so the manager spreads money across people and pays everyone a bit less. Nobody is fired, but nobody is overpaid.',
            '**Lasso is like a tax on every rupee paid, at the same rate.** For weak contributors the tax outweighs their value, so the manager pays them exactly nothing. The team shrinks to the people who really matter.',
            '**Elastic Net mixes both taxes.** Weak contributors are dropped, and among similar strong contributors the money is shared rather than given to one at random.',
            '**The tax rate (λ) is the dial.** Zero tax gives ordinary regression; a huge tax pays everyone nothing and predicts the average for every case.',
          ], title: 'Three tax policies' },
          { term: 'Shrinkage', def: 'Pulling coefficients towards zero compared with ordinary least squares. Shrunk coefficients are slightly biased but much more stable from one sample of data to another.' },
          { think: { q: 'Why might a model with smaller coefficients predict new data better, even though it fits the training data worse?', a: 'Large coefficients make predictions very sensitive to small changes in the inputs, including noise. Shrinking them reduces that sensitivity. You accept a little bias in exchange for a big cut in variance, and on new data the trade is usually worth it.' } },
          { callout: 'Regularisation is the formal version of a manager’s scepticism: a feature has to prove its worth before it gets a big say in the prediction.', tone: 'key' },
        ],
      },
      {
        heading: 'How it works, step by step',
        blocks: [
          { diagram: { kind: 'flow', nodes: ['**Standardise** every feature', '**Choose** Ridge, Lasso or Elastic Net', '**Try a grid** of penalty strengths λ', '**Cross-validate** and pick the best λ', '**Refit** on all training data and interpret'], caption: 'The workflow. In scikit-learn, `RidgeCV`, `LassoCV` and `ElasticNetCV` perform steps 3 and 4 for you.' } },
          { p: '**Step 1: Standardise.** The penalty looks at the size of coefficients, and size depends on units. Area in square feet would get a tiny coefficient and area in hundreds of square feet a large one, so the penalty would treat the same feature differently. Converting every feature to "standard deviations from its mean" puts them on equal footing.' },
          { term: 'Standardise', def: 'Transform a feature by subtracting its average and dividing by its standard deviation, so it has mean 0 and spread 1. Also called z-scoring. In scikit-learn: `StandardScaler`.' },
          { p: '**Step 2: Choose the penalty.** Ridge when you believe many features each contribute a little; Lasso when you believe only a few matter and want a short list; Elastic Net when features come in correlated groups.' },
          { p: '**Step 3 and 4: Tune λ.** Try values on a log scale (0.01, 0.1, 1, 10, 100 …), estimate the cross-validated error of each, and choose the best. Never choose λ by training error: the training error is always lowest at λ = 0.' },
          { p: '**Step 5: Refit and interpret.** Fit with the chosen λ on all the training data. For Lasso, the features with non-zero coefficients are the selected drivers.' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { tex: '\\text{Ridge:}\\quad \\min_{b} \\; \\sum_{i} (y_i - \\hat{y}_i)^2 + \\lambda \\sum_{j} b_j^2', plain: 'Minimise the usual sum of squared errors plus λ times the sum of squared coefficients. The intercept is not penalised.', symbols: [['\\lambda', 'penalty strength, chosen by cross-validation (called `alpha` in scikit-learn)'], ['b_j', 'coefficient of feature j'], ['\\sum_j b_j^2', 'the L2 penalty: sum of squared coefficients']] },
          { tex: '\\text{Lasso:}\\quad \\min_{b} \\; \\sum_{i} (y_i - \\hat{y}_i)^2 + \\lambda \\sum_{j} |b_j|', plain: 'Same idea, but the penalty is the sum of the absolute values of the coefficients (their sizes ignoring sign).', symbols: [['|b_j|', 'absolute value of b_j'], ['\\sum_j |b_j|', 'the L1 penalty']] },
          { p: 'Why does this small change, squares versus absolute values, make Lasso set coefficients to exactly zero while Ridge does not? Look at how each penalty grows near zero.' },
          { diagram: { kind: 'curve', fn: 'Math.abs(x)', fn2: 'x*x', xMin: -2, xMax: 2, xLabel: 'coefficient value b', yLabel: 'penalty', legend: ['Lasso |b|', 'Ridge b²'], caption: 'Near zero the Ridge penalty (b²) is almost flat: shrinking a coefficient from 0.1 to 0 saves almost nothing (0.01), so Ridge rarely bothers. The Lasso penalty keeps a constant slope with a sharp corner at zero: every last bit of shrinkage saves the same amount, so weak coefficients get pushed all the way to zero.' } },
          { p: 'For a single centred feature, both methods have tidy formulas that make the difference visible. Ordinary least squares gives slope = Sxy / Sxx, where Sxy is the sum of products of deviations and Sxx the sum of squared x deviations, exactly as in the linear regression chapter.' },
          { tex: 'b_{\\text{ridge}} = \\frac{S_{xy}}{S_{xx} + \\lambda}, \\qquad b_{\\text{lasso}} = \\frac{\\max\\left(S_{xy} - \\tfrac{\\lambda}{2},\\, 0\\right)}{S_{xx}}', plain: 'Ridge adds λ to the denominator, so the slope shrinks smoothly but never reaches zero. Lasso subtracts a fixed amount from the numerator, and once that amount exceeds Sxy the slope is exactly zero. (The Lasso formula is shown for a positive Sxy.)', symbols: [['S_{xy}', 'sum of (x − x̄)(y − ȳ)'], ['S_{xx}', 'sum of (x − x̄)²']] },
          { tex: '\\text{Elastic Net:}\\quad \\min_{b} \\; \\sum_{i} (y_i - \\hat{y}_i)^2 + \\lambda_1 \\sum_{j} |b_j| + \\lambda_2 \\sum_{j} b_j^2', plain: 'Use both penalties at once. In scikit-learn you set an overall strength `alpha` and a mixing share `l1_ratio` (1 = pure Lasso, 0 = pure Ridge).' },
          { callout: 'Libraries scale the formulas differently. scikit-learn’s `Ridge` uses exactly the Ridge formula above, but its `Lasso` divides the squared-error part by 2n, so its `alpha` is not the same number as λ here. The behaviour is identical; only the scale of the dial differs.', tone: 'tip' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Ridge by hand on the five flats', setup: 'From the linear regression chapter: area deviations −4, −2, 0, 2, 4 and price deviations −17, −8, −2, 10, 17, so Sxy = 172 and Sxx = 40. Ordinary slope = 172 / 40 = 4.3 (₹ lakh per 100 sq ft).', steps: [
            'λ = 10: slope = 172 / (40 + 10) = 172 / 50 = 3.44.',
            'λ = 40: slope = 172 / 80 = 2.15.',
            'λ = 400: slope = 172 / 440 ≈ 0.39.',
            'The intercept is recalculated each time so the line still passes through the average flat (10, 52).',
          ], result: 'The slope shrinks steadily as λ grows, but it never becomes exactly zero. (These values match scikit-learn’s `Ridge(alpha=λ)`.)' } },
          { example: { title: 'Lasso by hand: watching a coefficient switch off', setup: 'Same flats, Sxy = 172, Sxx = 40. Apply the Lasso formula slope = (172 − λ/2) / 40, floored at zero.', steps: [
            'λ = 100: (172 − 50) / 40 = 122 / 40 = 3.05.',
            'λ = 200: (172 − 100) / 40 = 72 / 40 = 1.8.',
            'λ = 344: (172 − 172) / 40 = 0.',
            'λ = 400: 172 − 200 is negative, so the slope stays at exactly 0.',
          ], result: 'Once λ/2 reaches Sxy, area is dropped from the model altogether. With many features, the weak ones hit zero first, which is how Lasso performs feature selection.' } },
          { diagram: { kind: 'curve', fn: '172/(40+x)', fn2: 'Math.max(0,(172-x/2)/40)', xMin: 0, xMax: 450, marks: [{ x: 344, label: 'Lasso hits 0 at λ = 344' }], xLabel: 'penalty strength λ', yLabel: 'slope (₹ lakh per 100 sq ft)', legend: ['Ridge', 'Lasso'], caption: 'The flat-price slope as the penalty grows. Ridge glides towards zero but never arrives. Lasso falls in a straight line and stops dead at zero.' } },
          { example: { title: 'Business case: two features that say the same thing', setup: 'Twelve simulated Chennai flats with four standardised features: built-up area, carpet area (about 80% of built-up, correlation 0.998), age, and a pure-noise column. True model: price depends on built-up area and age only.', steps: [
            'OLS coefficients: built-up +18.0, carpet −9.5, age −2.1, noise +0.6. A bigger carpet area "lowers" price? The two area columns are fighting each other.',
            'Ridge (alpha = 1): built-up +4.4, carpet +3.8, age −1.9, noise +0.5. The credit is shared sensibly between the twins.',
            'Lasso (alpha = 0.3): built-up +8.3, carpet 0, age −1.7, noise +0.15. One twin is dropped.',
            'Lasso (alpha = 1.0): built-up +7.6, carpet 0, age −0.9, noise 0. Stronger penalty also removes the noise column.',
          ], result: 'OLS gave nonsense signs; Ridge stabilised them; Lasso produced a short, readable model. Which twin Lasso keeps can be somewhat arbitrary, so do not read its choice as proof that one twin matters and the other does not.' } },
          { diagram: { kind: 'table', head: ['Feature', 'OLS', 'Ridge (α=1)', 'Lasso (α=0.3)', 'Lasso (α=1)'], rows: [['Built-up area', '18.0', '4.4', '8.3', '7.6'], ['Carpet area', '−9.5', '3.8', '0', '0'], ['Age', '−2.1', '−1.9', '−1.7', '−0.9'], ['Noise column', '0.6', '0.5', '0.15', '0']], caption: 'Standardised coefficients (₹ lakh per standard deviation) from the twelve-flat example. Watch the carpet-area row: wrong sign under OLS, shared under Ridge, zero under Lasso.' } },
        ],
      },
      {
        heading: 'Choosing between Ridge, Lasso and Elastic Net',
        blocks: [
          { bullets: [
            '**Ridge** when you expect many small effects, when features are strongly correlated, or when you care mostly about prediction accuracy. It keeps every feature.',
            '**Lasso** when you expect only a handful of features to matter and want a short, explainable list of drivers.',
            '**Elastic Net** when features come in correlated groups (several digital-channel metrics, several weather measures) and you still want selection. It is often the safest default for wide data.',
            '**Plain OLS** when you have many more rows than features, little collinearity, and need classical p-values and confidence intervals.',
          ] },
          { p: 'In practice, try more than one and let cross-validation decide. In the marketing simulation, Lasso scored best (cross-validated R² 0.59 versus 0.44 for Ridge) and kept 20 of the 40 features, including all 6 true drivers. It still kept 14 noise features, a reminder that Lasso’s selection is helpful but not perfect.' },
          { term: 'Sparse model', def: 'A model in which most coefficients are exactly zero, so only a few features are used. Lasso and Elastic Net produce sparse models; Ridge does not.' },
        ],
      },
      {
        heading: 'In the real world',
        blocks: [
          { case: { title: 'Credit risk scorecards with many bureau variables (illustrative)', story: 'A lender in India has hundreds of candidate variables from credit-bureau reports and its own records: utilisation ratios, enquiry counts, delinquency flags over 3, 6 and 12 months, many of them highly correlated. Regulators and credit committees expect a short, explainable model. The analytics team uses an L1-penalised (Lasso-style) logistic regression to shortlist about 15 variables, checks that their signs make business sense, then fits the final scorecard and validates it on a later time period. The same penalty idea used here for regression works for classification too.' } },
          { bullets: [
            '**Genomics:** thousands of genes, a few hundred patients. Lasso and Elastic Net were made for this.',
            '**Marketing mix models:** Ridge stabilises the effects of channels that are always run together.',
            '**Finance:** shrinkage of return forecasts and risk-model coefficients to avoid over-trading on noise.',
            '**Text models:** thousands of word features; L1 or L2 penalties keep models from memorising rare words.',
            '**Neural networks:** "weight decay" is the Ridge penalty applied to network weights.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Forgetting to standardise:** the penalty then depends on arbitrary units. Put `StandardScaler` in a pipeline so it is fitted only on training folds.',
            '**Choosing λ on training error:** always use cross-validation.',
            '**Over-reading Lasso’s choices:** among correlated features it picks almost at random; rerun on bootstrap samples to see how stable the selection is.',
            '**Expecting p-values:** penalised coefficients are deliberately biased, so classical p-values and confidence intervals do not apply directly.',
            '**Penalising dummies blindly:** a categorical feature split into several 0/1 columns may be half-selected by Lasso; group-aware methods exist if that matters.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'Ridge (L2)', items: ['Shrinks all coefficients smoothly', 'Never exactly zero: keeps every feature', 'Shares credit among correlated features', 'Always has a unique, stable solution', 'Best for many small effects'] }, right: { title: 'Lasso (L1)', items: ['Shrinks and sets weak ones to exactly zero', 'Performs automatic feature selection', 'Picks one of a correlated group, somewhat arbitrarily', 'Gives short, explainable models', 'Best when few features really matter'] }, caption: 'Elastic Net sits between the two. All three reduce to ordinary least squares when λ = 0.' } },
        ],
      },
    ],
    faq: [
      { q: 'What happens when λ is 0 or very large?', a: 'At λ = 0 you get ordinary least squares. As λ grows very large every coefficient is squeezed to zero and the model predicts the average target for everyone. The best λ lies in between and is found by cross-validation.' },
      { q: 'Why is the intercept not penalised?', a: 'The intercept just sets the overall level of predictions (the average price). Shrinking it towards zero would bias every prediction for no benefit, so libraries leave it free.' },
      { q: 'Is it called alpha or lambda?', a: 'Both, for the same idea. Textbooks usually write λ; scikit-learn calls the penalty strength `alpha`, and in `ElasticNet` uses `l1_ratio` for the L1/L2 mix.' },
      { q: 'Do I still need to remove correlated features myself?', a: 'Less so. Ridge and Elastic Net handle correlated features gracefully. You may still drop obvious duplicates to keep the model easy to explain.' },
      { q: 'Can I use these penalties with logistic regression?', a: 'Yes. scikit-learn’s `LogisticRegression` uses an L2 penalty by default (strength set by `C`, where smaller C means a stronger penalty), and supports L1 and Elastic Net too.' },
      { q: 'Does regularisation help if I have millions of rows and ten features?', a: 'Usually very little. Overfitting is mainly a problem when features are many relative to rows or strongly correlated. With abundant data, λ chosen by cross-validation will simply come out small.' },
    ],
  },
  'poisson-regression': {
    minutes: 17,
    hook: 'A highway operator needs to decide how many toll lanes to open at each hour. On a quiet afternoon about three cars arrive per minute; at the Friday evening rush, many more. The number of arrivals in a minute is a **count**: 0, 1, 2, 3 … never 2.7 and never negative. Ordinary regression ignores those facts and can predict "−1.6 cars". **Poisson regression**, and the wider family of **generalised linear models (GLMs)** it belongs to, is built for exactly this kind of target.',
    sections: [
      {
        heading: 'The problem: predicting counts',
        blocks: [
          { p: 'Many business targets are counts of events in a window of time or space: insurance claims per policy per year, defects per shift, customer complaints per branch per month, website sign-ups per day, vehicles arriving per minute. They share three features that ordinary least squares handles badly.' },
          { bullets: [
            '**They cannot be negative.** A straight line can easily dip below zero for some inputs.',
            '**They are whole numbers, often small.** Many zeros, a few ones and twos, the occasional large value.',
            '**Their spread grows with their size.** A branch that averages 2 complaints a month varies by a couple either way; one that averages 50 varies by much more. Ordinary regression assumes equal spread everywhere.',
          ] },
          { term: 'Count data', def: 'A target that records how many times something happened: 0, 1, 2, 3 and so on. It is never negative and never fractional.' },
          { diagram: { kind: 'curve', fn: 'Math.exp(0.2 + 0.35*x)', fn2: '2.108*x - 1.645', xMin: 0, xMax: 8, xLabel: 'feature x (e.g. hour-of-day demand index)', yLabel: 'expected count', legend: ['Poisson (log link) mean', 'straight line fitted to it'], caption: 'Expected counts often grow multiplicatively, curving upwards. A straight line fitted to that curve (illustrative) predicts about −1.6 events at x = 0, which is impossible, and misses at both ends. The Poisson model’s curve can never go below zero.' } },
          { p: 'Poisson regression fixes all three problems by changing two things about linear regression: the **distribution** we assume for the target and the **link** between the features and the average.' },
        ],
      },
      {
        heading: 'Building the intuition: the toll booth',
        blocks: [
          { p: 'Stand at a toll booth and count cars each minute for an hour. You might see 3, 1, 4, 3, 0, 2, 5, 3 … The average is about 3, but individual minutes vary because cars arrive independently and at random. That randomness has a very particular shape, named after the French mathematician Siméon Denis Poisson.' },
          { term: 'Poisson distribution', def: 'The probability pattern for the number of independent random events in a fixed window when they happen at a steady average rate. It has one number, the rate λ, which is both its average and its variance.' },
          { diagram: { kind: 'bars', labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8'], values: [0.05, 0.149, 0.224, 0.224, 0.168, 0.101, 0.05, 0.022, 0.008], highlight: 3, yLabel: 'probability', caption: 'Cars per minute when the average rate is 3. Two or three cars are most likely (22% each), a completely empty minute happens 5% of the time, and 7 or more is rare. Notice the shape is lopsided: it cannot go below zero but has a tail to the right.' } },
          { p: 'Now imagine the rate changes with conditions. Friday evening doubles the traffic; heavy rain cuts it by a fifth; a holiday weekend raises it by half. These effects naturally **multiply**: rush hour in the rain is 2 × 0.8 = 1.6 times the base rate. They do not add a fixed number of cars.' },
          { steps: [
            '**Start from a base rate** for ordinary conditions, say 3 cars per minute.',
            '**Multiply by a factor for each condition**: × 2 for rush hour, × 0.8 for rain.',
            '**The result is the expected rate** for that minute: 3 × 2 × 0.8 = 4.8 cars.',
            '**Actual counts scatter randomly around that rate** following the Poisson pattern.',
          ], title: 'How Poisson regression thinks' },
          { think: { q: 'Why do multiplicative effects suit counts better than additive ones?', a: 'An additive effect such as "rain removes 2 cars a minute" would give negative counts on a quiet night with 1 car a minute. A multiplicative effect such as "rain cuts traffic by 20%" works at any level and can never push the rate below zero.' } },
        ],
      },
      {
        heading: 'How it works, step by step',
        blocks: [
          { diagram: { kind: 'flow', nodes: ['**Linear score** b₀ + b₁x₁ + …', '**Exponentiate** to get a positive rate', '**Assume Poisson** scatter around that rate', '**Fit** by maximum likelihood', '**Read** e^b as rate ratios'], caption: 'Poisson regression in one line: a linear score, turned into a positive expected count by the exponential function, with Poisson randomness around it.' } },
          { p: '**Step 1: Build a linear score** from the features, just like multiple regression.' },
          { p: '**Step 2: Turn the score into a rate** by exponentiating it. Whatever the score, e raised to that score is positive, so the predicted count can never be negative. Taking logs of both sides gives the usual way of writing the model: the **log of the expected count** is linear in the features. The log is called the **link function**.' },
          { term: 'Link function', def: 'The transformation that connects the average of the target to the linear score. For Poisson regression it is the log: log(expected count) = linear score.' },
          { p: '**Step 3: Assume Poisson randomness** around that rate, which automatically means bigger expected counts come with bigger spread.' },
          { p: '**Step 4: Fit.** There is no simple "least squares" here. Instead, the computer finds the coefficients under which the observed counts would have been most probable. This is called maximum likelihood, and it is how almost all GLMs are fitted.' },
          { term: 'Maximum likelihood', def: 'A fitting principle: choose the parameter values that make the data you actually observed as probable as possible. For ordinary regression with bell-shaped errors it gives the same answer as least squares.' },
          { p: '**Step 5: Interpret.** Exponentiate each coefficient to get a multiplier on the rate.' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { tex: 'P(Y = k) = \\frac{\\lambda^k e^{-\\lambda}}{k!}', plain: 'The probability of seeing exactly k events when the average rate is λ. For λ = 3 and k = 0 this is e⁻³ ≈ 0.050: about one minute in twenty has no cars.', symbols: [['k', 'a possible count: 0, 1, 2, …'], ['\\lambda', 'the rate (average count) in the window'], ['k!', 'k factorial: 1 × 2 × … × k (and 0! = 1)']] },
          { tex: '\\log \\mu = b_0 + b_1 x_1 + \\dots + b_p x_p \\quad\\Longleftrightarrow\\quad \\mu = e^{b_0} \\cdot e^{b_1 x_1} \\cdots e^{b_p x_p}', plain: 'Left: the log of the expected count is a weighted sum of the features. Right: the same thing un-logged, showing that each feature multiplies the expected count by its own factor.', symbols: [['\\mu', 'expected count (the model’s λ for that row)'], ['e^{b_0}', 'base rate when all features are 0'], ['e^{b_j}', 'rate ratio for a one-unit increase in feature j']] },
          { term: 'Rate ratio', def: 'e raised to a Poisson coefficient. It is the factor by which the expected count is multiplied when that feature rises by one unit, holding others fixed. A rate ratio of 1.25 means 25% more events.' },
          { p: 'Often the observation windows differ in size: one policy was held for a full year, another for three months; one branch has 200 customers, another 5,000. More exposure naturally means more events, and the model must not credit that to the features. The fix is an **offset**: add the log of the exposure to the score with its coefficient fixed at 1.' },
          { tex: '\\log \\mu_i = \\log(\\text{exposure}_i) + b_0 + b_1 x_{i1} + \\dots', plain: 'The expected count equals exposure times a rate. The features explain the rate per unit of exposure (claims per policy-year), not the raw count.', symbols: [['\\text{exposure}_i', 'size of the observation window for row i (years, customers, km)']] },
          { callout: 'Poisson regression is one member of the GLM family. Every GLM has three parts: a distribution for the target, a link function, and a linear score. Change the first two and you get a different model for a different kind of target.', tone: 'key' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Staffing a toll booth', setup: 'On weekday afternoons cars arrive at an average of 3 per minute. One lane can process 5 cars per minute. How often will the lane be overloaded?', steps: [
            'P(0) = e⁻³ ≈ 0.050. P(1) = 3e⁻³ ≈ 0.149. P(2) = 9e⁻³ / 2 ≈ 0.224.',
            'P(3) = 27e⁻³ / 6 ≈ 0.224. P(4) ≈ 0.168. P(5) ≈ 0.101.',
            'P(5 or fewer) = 0.050 + 0.149 + 0.224 + 0.224 + 0.168 + 0.101 ≈ 0.916.',
            'P(more than 5) ≈ 1 − 0.916 = 0.084.',
          ], result: 'About 8% of minutes will see more cars than one lane can handle, so queues will build regularly. A Poisson regression of arrivals on hour, day and weather lets the operator compute this for every hour of the week and staff lanes accordingly.' } },
          { example: { title: 'Day shift versus night shift defects, by hand', setup: 'A plant records defects per shift. Eight day shifts: 0, 1, 2, 2, 3, 3, 4, 5. Eight night shifts: 2, 3, 3, 4, 5, 5, 6, 8. Fit log(expected defects) = b₀ + b₁ × night.', steps: [
            'With a single 0/1 feature, the Poisson fit simply matches each group’s average.',
            'Day average = 20 / 8 = 2.5, so e^b₀ = 2.5 and b₀ = ln 2.5 ≈ 0.916.',
            'Night average = 36 / 8 = 4.5, so e^(b₀ + b₁) = 4.5 and the rate ratio e^b₁ = 4.5 / 2.5 = 1.8.',
            'b₁ = ln 1.8 ≈ 0.588. (statsmodels gives exactly these values.)',
            'Sanity check on the Poisson assumption: day variance ≈ 2.6 against mean 2.5; night variance ≈ 3.7 against mean 4.5. Close enough.',
          ], result: 'Night shifts produce about 80% more defects than day shifts. That is a clear, quotable number for the plant manager, and the starting point for asking why (fatigue, lighting, staffing).' } },
          { example: { title: 'Business case: pricing car insurance with exposure', setup: 'An insurer’s model: log(expected claims per policy-year) = −2.3 + 0.4 × young_driver + 0.1 × (km driven per year ÷ 10,000).', steps: [
            'Base rate: e^−2.3 ≈ 0.100 claims per policy-year (an older driver with near-zero mileage).',
            'Young driver: rate ratio e^0.4 ≈ 1.49, i.e. about 49% more claims.',
            'Each extra 10,000 km: rate ratio e^0.1 ≈ 1.105, about 10.5% more.',
            'Young driver doing 20,000 km: 0.100 × 1.49 × e^0.2 = 0.100 × 1.49 × 1.22 ≈ 0.18 claims per year.',
            'If that policy is held for only 6 months (exposure 0.5), expected claims ≈ 0.18 × 0.5 ≈ 0.09.',
          ], result: 'Multiply the expected claim count by the average claim cost and you have the core of the risk premium. Rate ratios translate directly into loadings: "young drivers pay about 49% more".' } },
          { callout: 'Exposure changes conclusions. Branch A has 30 claims over 200 policy-years (0.15 per year); branch B has 45 claims over 500 policy-years (0.09 per year). B has more claims, but A is the riskier book.', tone: 'warn' },
        ],
      },
      {
        heading: 'The GLM family and over-dispersion',
        blocks: [
          { p: 'Once you see Poisson regression as "distribution + link + linear score", a whole family opens up. You have already met two members: linear regression and, in the next chapter, logistic regression.' },
          { diagram: { kind: 'table', head: ['Target type', 'Example', 'Distribution', 'Link', 'Model name'], rows: [['Any real number', 'Flat price', 'Normal', 'Identity', 'Linear regression'], ['Yes / no', 'Loan default', 'Binomial', 'Logit', 'Logistic regression'], ['Count', 'Claims per year', 'Poisson', 'Log', 'Poisson regression'], ['Over-dispersed count', 'Complaints per branch', 'Negative binomial', 'Log', 'Negative binomial regression'], ['Positive, skewed amount', 'Claim size in ₹', 'Gamma', 'Log', 'Gamma regression']], caption: 'Five common GLMs. Pick the row that matches your target. Insurers often combine a Poisson model for claim counts with a gamma model for claim sizes.' } },
          { term: 'Generalised linear model (GLM)', def: 'A model that predicts the average of a target as a transformed linear score, with a distribution chosen to match the target (normal, binomial, Poisson, gamma …). Linear, logistic and Poisson regression are all GLMs.' },
          { p: 'The Poisson distribution makes a strong promise: **variance equals mean**. Real counts often vary more than that, because of things the model cannot see (some customers are simply more accident-prone). This is called **over-dispersion**.' },
          { term: 'Over-dispersion', def: 'When count data vary more than the Poisson model allows, i.e. the variance is clearly larger than the mean. Coefficients stay roughly right, but standard errors are too small, so the model looks more certain than it is.' },
          { bullets: [
            '**Check it:** compare the variance of the counts with their mean within groups, or look at the Pearson chi-square divided by the residual degrees of freedom. Values well above 1 signal over-dispersion.',
            '**If the ratio is about 3**, Poisson standard errors are too small by a factor of about √3 ≈ 1.7, so many effects will look significant when they are not.',
            '**Fix it** with negative binomial regression, or a quasi-Poisson model that inflates standard errors.',
            '**Too many zeros** (most customers never complain, a few complain often) may need a zero-inflated or hurdle model.',
          ] },
        ],
      },
      {
        heading: 'In the real world',
        blocks: [
          { case: { title: 'Motor insurance pricing', story: 'GLMs are a long-established standard tool in general insurance pricing, particularly motor. A typical approach models claim frequency with a Poisson GLM (log link, policy-years as the exposure offset) on rating factors such as driver age band, vehicle group, region and no-claim discount, and models claim severity separately with a gamma GLM. The pure premium is expected frequency × expected severity. Because effects are multiplicative, the rate ratios become the relativities in the rating tables that underwriters and regulators review, which is one reason the approach has lasted even as machine-learning models are added alongside it.' } },
          { bullets: [
            '**Manufacturing:** defects per batch against line speed, shift and supplier.',
            '**Retail:** footfall or transactions per hour for staffing rosters.',
            '**Public health:** disease cases per district, with population as exposure.',
            '**Web analytics:** sign-ups or clicks per day against campaigns and seasonality.',
            '**Reliability engineering:** failures per 1,000 operating hours for components.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Using OLS on small counts:** negative predictions and wrong uncertainty. Use Poisson.',
            '**Ignoring exposure:** comparing raw counts across windows of different size misleads. Use an offset.',
            '**Ignoring over-dispersion:** overconfident conclusions. Check variance against mean; use negative binomial.',
            '**Reading coefficients additively:** a coefficient of 0.4 means × 1.49, not +0.4 events.',
            '**Forgetting that counts can depend on each other:** contagious events (one complaint triggering others) break the independence assumption.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'Poisson regression fits when…', items: ['Target is a non-negative count', 'Variance is roughly equal to the mean', 'Effects plausibly multiply the rate', 'Windows of different size can be handled with an offset', 'You need explainable rate ratios'] }, right: { title: 'Consider instead…', items: ['Variance ≫ mean → **negative binomial**', 'Excess zeros → **zero-inflated / hurdle models**', 'Large counts in the thousands → OLS on log counts may be fine', 'Complex interactions → **gradient boosting with Poisson loss**', 'Rare yes/no events → **logistic regression**'] }, caption: 'Poisson regression is the natural first model for counts; know when to upgrade it.' } },
          { callout: 'scikit-learn offers `PoissonRegressor` (which applies a small L2 penalty by default; set `alpha=0` for a plain fit) and gradient boosting with `loss="poisson"`. For p-values and an offset, statsmodels’ `GLM` with `family=Poisson()` is convenient.', tone: 'tip' },
        ],
      },
    ],
    faq: [
      { q: 'Why not just take the log of the counts and use ordinary regression?', a: 'The log of zero is undefined, and small counts often include many zeros. Adding 1 before logging is a crude patch that distorts results. Poisson regression models the log of the expected count, which is always fine.' },
      { q: 'How do I interpret a coefficient of −0.22?', a: 'Exponentiate it: e^−0.22 ≈ 0.80. Each one-unit increase in that feature multiplies the expected count by 0.80, i.e. about 20% fewer events, holding other features fixed.' },
      { q: 'What is the difference between Poisson regression and a GLM?', a: 'GLM is the family name; Poisson regression is one member. Choosing a binomial distribution with a logit link gives logistic regression; a normal distribution with identity link gives ordinary linear regression.' },
      { q: 'When should I use negative binomial instead?', a: 'When the variance of the counts is clearly larger than the mean, after accounting for the features. Negative binomial adds an extra parameter that lets the variance grow faster than the mean.' },
      { q: 'What is an offset, in plain words?', a: 'A way of telling the model "this row had twice as much opportunity for events", so it predicts rates per unit of exposure rather than raw counts. You add log(exposure) to the model with its coefficient fixed at 1.' },
      { q: 'Can the target be a rate such as 0.15 claims per year instead of a count?', a: 'Model the count with log(exposure) as an offset; that is equivalent and keeps the Poisson assumptions valid. scikit-learn’s alternative is to use the rate as the target with the exposure as `sample_weight`.' },
    ],
  },

  'logistic-regression': {
    minutes: 16,
    hook: 'A bank receives 5,000 personal-loan applications a week. For each one a credit officer must decide: approve or decline. What the officer really wants is not a yes/no verdict from a machine, but a number: "this applicant has an 11% chance of defaulting; that one, 56%". With such probabilities the bank can approve, decline, ask for a guarantor or adjust the interest rate. **Logistic regression** produces exactly those probabilities, and has been the backbone of credit scoring for decades.',
    sections: [
      {
        heading: 'The problem: predicting yes or no',
        blocks: [
          { p: 'Many business questions have two possible answers. Will this customer default? Will this subscriber cancel next month? Is this transaction fraud? Will this machine fail within a week? The target is a category with two values, usually coded 1 (the event happens) and 0 (it does not).' },
          { term: 'Classification', def: 'Predicting which category something belongs to (default / no default, spam / not spam) rather than a number. With two categories it is called binary classification.' },
          { p: 'Why not use linear regression on the 0/1 target? Try it on twelve past loan applicants, with the feature being debt-to-income ratio (DTI: monthly debt payments divided by monthly income).' },
          { diagram: { kind: 'scatter', xLabel: 'debt-to-income ratio (tenths: 3 = 0.3)', yLabel: 'defaulted (1) or repaid (0)', line: { m: 0.1797, b: -0.3394 }, caption: 'Twelve applicants: dots at 1 defaulted, dots at 0 repaid. A straight line fitted by least squares predicts −0.16 "probability" at DTI 0.1 and 1.28 at DTI 0.9. Probabilities must stay between 0 and 1, so a straight line is the wrong shape.', points: [[1, 0], [2, 0], [2.5, 0], [3, 0], [3.5, 1], [4, 0], [4.5, 0], [5, 1], [5.5, 0], [6, 1], [6.5, 1], [7, 1]] } },
          { p: 'Logistic regression keeps the useful part of linear regression, a weighted sum of features, and fixes the shape problem by bending that sum through an S-shaped curve that always lies between 0 and 1.' },
          { callout: 'Despite the name, logistic regression is a classification method. "Regression" refers to the linear score inside it.', tone: 'key' },
        ],
      },
      {
        heading: 'Building the intuition: points, then a conversion chart',
        blocks: [
          { p: 'Think of an old-fashioned credit scorecard. The officer adds up points: high debt-to-income adds risk points, a long job history removes some, previous late payments add more. The total is a **risk score** that can be any number, positive or negative.' },
          { steps: [
            '**Add up the evidence** into one score. Higher score means more risk.',
            '**Look up the score on a conversion chart** that turns it into a probability.',
            '**The chart is S-shaped.** Very negative scores give probabilities near 0; very positive scores give probabilities near 1; a score of 0 gives exactly 50%.',
            '**In the middle the chart is steep**: a few extra points change the probability a lot. At the extremes it is flat: an already-hopeless or already-safe applicant barely moves.',
          ], title: 'How logistic regression reasons' },
          { p: 'That S-shaped conversion chart is called the **sigmoid** or logistic function. Logistic regression learns the points (the coefficients) from past data, and the sigmoid does the conversion.' },
          { term: 'Sigmoid function', def: 'An S-shaped curve that turns any number into a value between 0 and 1. Input 0 gives 0.5; large positive inputs approach 1; large negative inputs approach 0.' },
          { diagram: { kind: 'curve', fn: '1/(1+Math.exp(-x))', xMin: -6, xMax: 6, marks: [{ x: 0, label: 'score 0 → 50%' }, { x: 2, label: 'score 2 → 88%' }], xLabel: 'risk score z', yLabel: 'probability', caption: 'The sigmoid. It never goes below 0 or above 1. A score of 2 gives 88%, a score of −2 gives 12%. The curve is steepest at 50%, where the evidence is most finely balanced.' } },
          { think: { q: 'Two applicants have scores of 0 and 1; two others have 5 and 6. Which pair differs more in probability?', a: 'The first pair. Moving from 0 to 1 raises the probability from 50% to 73%. Moving from 5 to 6 raises it from 99.3% to 99.8%. The same extra evidence matters most when the case is borderline.' } },
        ],
      },
      {
        heading: 'How it works, step by step',
        blocks: [
          { diagram: { kind: 'flow', nodes: ['**Score** z = b₀ + b₁x₁ + …', '**Squash** p = sigmoid(z)', '**Train** by minimising log-loss', '**Choose a threshold** from business costs', '**Decide**: approve, review or decline'], caption: 'From features to a decision. The model outputs probabilities; the threshold that turns them into actions is a business choice.' } },
          { p: '**Step 1: Score.** Compute a weighted sum of the features, exactly as in multiple regression.' },
          { p: '**Step 2: Squash.** Pass the score through the sigmoid to get a probability.' },
          { p: '**Step 3: Train.** Find the coefficients that make the predicted probabilities match the past outcomes as well as possible. The measure used is log-loss (next section). There is no one-line formula, so the computer improves the coefficients step by step until they stop changing.' },
          { p: '**Step 4: Choose a threshold.** A probability is not yet a decision. If declining a good customer costs little but approving a defaulter costs a lot, you decline at a fairly low probability. The default threshold of 0.5 is rarely the right business answer.' },
          { term: 'Decision threshold', def: 'The probability above which you act as if the event will happen (decline the loan, flag the transaction). Default 0.5, but it should be set from the costs of each kind of mistake.' },
          { p: '**Step 5: Decide and monitor.** Apply the threshold, perhaps with a "grey zone" sent to a human reviewer, and check over time that predicted probabilities still match actual default rates.' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { tex: 'p = \\sigma(z) = \\frac{1}{1 + e^{-z}}, \\qquad z = b_0 + b_1 x_1 + \\dots + b_p x_p', plain: 'Compute the score z as a weighted sum of the features, then convert it to a probability with the sigmoid. When z = 0, e⁰ = 1 and p = 1/2.', symbols: [['p', 'predicted probability that the event happens (y = 1)'], ['z', 'the linear score, also called the log-odds'], ['\\sigma', 'the sigmoid function'], ['e', 'Euler’s number, about 2.718']] },
          { p: 'To interpret the coefficients we need the idea of **odds**, familiar from betting. If the probability of default is 0.8, the odds are 0.8 / 0.2 = 4, "four to one on". If the probability is 0.5, the odds are 1.' },
          { term: 'Odds', def: 'Probability that something happens divided by probability that it does not: p / (1 − p). Probability 0.75 means odds of 3; probability 0.2 means odds of 0.25.' },
          { tex: '\\log\\frac{p}{1-p} = b_0 + b_1 x_1 + \\dots + b_p x_p', plain: 'Rearranging the sigmoid shows that the log of the odds is exactly the linear score. So each coefficient adds to the log-odds, which means e raised to that coefficient multiplies the odds.', symbols: [['\\frac{p}{1-p}', 'the odds'], ['e^{b_j}', 'odds ratio: the factor by which the odds multiply when feature j rises by one unit']] },
          { term: 'Odds ratio', def: 'e raised to a logistic coefficient. An odds ratio of 3.2 means each one-unit increase in that feature multiplies the odds of the event by 3.2, holding the other features fixed.' },
          { p: 'Finally, how does training judge a set of coefficients? It uses **log-loss**, which rewards confident correct predictions and punishes confident wrong ones very harshly.' },
          { tex: '\\text{log-loss} = -\\frac{1}{n} \\sum_{i=1}^{n} \\left[ y_i \\log p_i + (1 - y_i) \\log (1 - p_i) \\right]', plain: 'For a customer who defaulted (y = 1) the cost is −log p: small if you predicted a high probability, huge if you predicted a tiny one. For a customer who repaid (y = 0) the cost is −log(1 − p). Average over all customers.', symbols: [['y_i', 'actual outcome, 1 or 0'], ['p_i', 'predicted probability of 1'], ['\\log', 'natural logarithm']] },
          { diagram: { kind: 'curve', fn: '-Math.log(x)', xMin: 0.01, xMax: 1, marks: [{ x: 0.1, label: 'p = 0.1 → cost 2.30' }, { x: 0.9, label: 'p = 0.9 → cost 0.11' }], xLabel: 'predicted probability for what actually happened', yLabel: 'log-loss for that case', caption: 'Log-loss for a single case. Predicting 90% for something that happened costs 0.11; predicting 10% costs 2.30; predicting 1% costs 4.61. Being confidently wrong is punished far more than being unsure.' } },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Fitting a default model on twelve applicants', setup: 'The twelve applicants in the scatter plot (DTI from 0.1 to 0.7, five defaults). Fitting logistic regression without a penalty, with DTI measured in tenths, gives z = −5.54 + 1.16 × DTI.', steps: [
            'Applicant with DTI 0.3: z = −5.54 + 1.16 × 3 = −2.06. p = 1 / (1 + e^2.06) ≈ 0.11.',
            'Applicant with DTI 0.5: z = −5.54 + 5.80 = 0.26. p = 1 / (1 + e^−0.26) ≈ 0.56.',
            'Applicant with DTI 0.7: z = −5.54 + 8.12 = 2.58. p ≈ 0.93.',
            'The 50% point is where z = 0: DTI = 5.54 / 1.16 ≈ 4.78 tenths, i.e. a DTI of about 0.48.',
            'Odds ratio = e^1.16 ≈ 3.19.',
          ], result: 'Each extra 0.1 of debt-to-income multiplies the odds of default by about 3.2. With only twelve applicants this is a toy, but the reading is exactly how a real scorecard is explained to a credit committee.' } },
          { diagram: { kind: 'curve', fn: '1/(1+Math.exp(-(-5.54+1.16*x)))', xMin: 0, xMax: 10, marks: [{ x: 4.78, label: '50% at DTI ≈ 0.48' }], xLabel: 'debt-to-income ratio (tenths)', yLabel: 'probability of default', caption: 'The fitted model. Unlike the straight line, it stays between 0 and 1, rising steeply between DTI 0.3 and 0.7 where the data shows the change from mostly-repaid to mostly-defaulted.' } },
          { example: { title: 'Scoring predictions with log-loss', setup: 'Four customers all defaulted (y = 1). Model A predicted 0.9, 0.6, 0.1 and 0.01 for them respectively. Compute each case’s log-loss.', steps: [
            'p = 0.9: −ln 0.9 ≈ 0.105.',
            'p = 0.6: −ln 0.6 ≈ 0.511.',
            'p = 0.1: −ln 0.1 ≈ 2.303.',
            'p = 0.01: −ln 0.01 ≈ 4.605.',
            'Average = (0.105 + 0.511 + 2.303 + 4.605) / 4 ≈ 1.88.',
          ], result: 'The single badly wrong prediction (1%) contributes more than half of the total. Training pushes hard to avoid confident mistakes, which is why logistic regression tends to give well-calibrated probabilities.' } },
          { example: { title: 'Business case: setting the approval threshold', setup: 'Approving a customer who later defaults costs the bank about ₹2,00,000. Declining a customer who would have repaid loses about ₹20,000 of profit. Out of 1,000 applicants, 100 will default. Compare two thresholds (illustrative counts).', steps: [
            'Break-even threshold, if probabilities are well calibrated: decline when p > 20,000 / (20,000 + 2,00,000) ≈ 0.09.',
            'Threshold 0.5: catches 55 defaulters, misses 45, wrongly declines 30 good customers. Cost = 45 × ₹2L + 30 × ₹0.2L = ₹90L + ₹6L = ₹96 lakh.',
            'Threshold 0.2: catches 80, misses 20, wrongly declines 150. Cost = 20 × ₹2L + 150 × ₹0.2L = ₹40L + ₹30L = ₹70 lakh.',
          ], result: 'Lowering the threshold saves about ₹26 lakh per 1,000 applicants, even though it turns away more good customers. The right threshold comes from costs, not from the default 0.5.' } },
        ],
      },
      {
        heading: 'Reading the output: errors, metrics and calibration',
        blocks: [
          { p: 'Once a threshold is set, each prediction falls into one of four boxes. Laying them out as a table, called a **confusion matrix**, makes the trade-offs visible.' },
          { diagram: { kind: 'table', head: ['', 'Predicted default', 'Predicted repay', 'Total'], rows: [['Actually defaulted', '80 (caught)', '20 (missed)', '100'], ['Actually repaid', '150 (false alarm)', '750 (correct)', '900'], ['Total', '230', '770', '1,000']], caption: 'Confusion matrix for the 0.2 threshold in the business example. Recall = 80 / 100 = 80% of defaulters caught; precision = 80 / 230 ≈ 35% of declined applicants would really have defaulted. Accuracy = 830 / 1,000 = 83%, lower than the 90% you would get by approving everyone, yet far cheaper.' } },
          { term: 'Precision and recall', def: 'Recall: of all actual positives (defaulters), the share the model caught. Precision: of all cases the model flagged, the share that really were positive. Raising the threshold usually raises precision and lowers recall.' },
          { bullets: [
            '**Do not judge by accuracy on imbalanced data.** Approving everyone is 90% accurate here and catches no defaulters.',
            '**Use ROC-AUC** to measure how well the model ranks risky above safe applicants, independent of threshold.',
            '**Check calibration:** among applicants scored around 20%, about 20% should actually default. Logistic regression is usually well calibrated if the model is sensible.',
            '**Read coefficients as odds ratios**, after standardising features if you want to compare their importance.',
          ] },
        ],
      },
      {
        heading: 'In the real world',
        blocks: [
          { case: { title: 'Credit scorecards', story: 'Logistic regression has long been the standard technique behind application credit scorecards at banks and lenders worldwide. A typical build bins each variable (age band, income band, utilisation band), transforms the bins into "weight of evidence" values, fits a logistic regression, and converts the coefficients into points so that, for example, every 20 extra points halves the odds of default. The appeal is explainability: lenders must be able to tell a declined applicant the main reasons, and regulators and model-risk teams can inspect every coefficient. More complex models are increasingly used alongside, but they are usually compared against a logistic baseline.' } },
          { bullets: [
            '**Telecom and subscriptions:** churn probability next month, to target retention offers.',
            '**Marketing:** probability a customer responds to a campaign, to rank whom to contact.',
            '**Healthcare:** risk scores for conditions such as heart disease from age, blood pressure and cholesterol.',
            '**Manufacturing:** probability a part fails inspection given process settings.',
            '**Payments:** a fast first-layer fraud score before heavier models run.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Straight-line boundary:** the model separates classes with a straight line (a flat plane in more dimensions) in feature space. Curved boundaries need polynomial or interaction features, or trees.',
            '**Perfect separation:** if one feature splits the classes perfectly, coefficients grow without limit. Regularisation (on by default in scikit-learn) fixes this.',
            '**Forgetting scaling with regularisation:** scikit-learn’s `LogisticRegression` applies an L2 penalty by default (`C=1.0`), so unscaled features are penalised unevenly.',
            '**Class imbalance:** with 1% fraud, use precision, recall and AUC, and consider `class_weight="balanced"` or threshold tuning.',
            '**Correlated features:** odds ratios become unstable, just as in multiple regression.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'Logistic regression is ideal when…', items: ['Target is yes / no', 'You need probabilities, not just labels', 'Decisions must be explained (credit, health)', 'Relationships are roughly monotonic', 'You want a fast, strong baseline'] }, right: { title: 'Consider instead…', items: ['Complex interactions → **gradient boosting, random forest**', 'More than two classes → **multinomial logistic regression**', 'Very many features → **L1-penalised logistic regression**', 'Images, text, audio → **neural networks**', 'Counts rather than yes/no → **Poisson regression**'] }, caption: 'Logistic regression is the first model to try for any binary prediction, and often the one that ships.' } },
        ],
      },
    ],
    faq: [
      { q: 'Why is it called regression if it classifies?', a: 'Because inside it is a linear regression on the log-odds. The classification only happens when you apply a threshold to the probability it outputs.' },
      { q: 'How do I explain a coefficient of 0.5 to a manager?', a: 'Exponentiate it: e^0.5 ≈ 1.65. "Each one-unit increase in this feature multiplies the odds of the event by about 1.65, holding everything else fixed", i.e. 65% higher odds.' },
      { q: 'Is 0.5 the right threshold?', a: 'Only if both kinds of mistake cost the same and classes are balanced. Otherwise compute the threshold from costs (decline when p exceeds cost of a false alarm ÷ total cost of both errors) or pick it from a precision-recall curve.' },
      { q: 'Can it handle more than two classes?', a: 'Yes. Multinomial logistic regression (also called softmax regression) gives a probability for each class. scikit-learn’s `LogisticRegression` handles this automatically.' },
      { q: 'What does C mean in scikit-learn?', a: 'C is the inverse of regularisation strength. Smaller C means a stronger penalty and smaller coefficients. The default is 1.0; tune it by cross-validation and scale features first.' },
      { q: 'Odds versus probability: what is the difference?', a: 'Probability is chances out of all cases (0.8 = 80%). Odds compare happening with not happening (0.8 / 0.2 = 4). Logistic coefficients act on the log of the odds, which is why they multiply the odds rather than add to the probability.' },
    ],
  },
};
