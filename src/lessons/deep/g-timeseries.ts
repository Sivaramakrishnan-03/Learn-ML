import { DeepLesson } from './types';

// TIME SERIES group: components, exponential smoothing, ARIMA, forecast validation.
export const TIMESERIES_DEEP: Record<string, DeepLesson> = {
  'ts-components': {
    minutes: 19,
    hook: 'Every October, a sweets company in Chennai sees orders jump before Diwali, and every January they slump, while the business also grows steadily. A planner who forecasts next October by averaging the last twelve months will order far too little stock. Before you can forecast any series, you must take it apart and see what it is made of: a slow **trend**, a repeating **seasonal** rhythm and leftover **noise**. That is what this chapter teaches.',
    sections: [
      {
        heading: 'The problem: numbers that arrive in order',
        blocks: [
          { p: 'Most datasets in statistics are a pile of separate observations: 500 customers, 2,000 loans. You could shuffle the rows and nothing would change. Sales by month and electricity demand by hour are different. **Order is the whole point.** This month depends on last month, and October looks like last October.' },
          { term: 'Time series', def: 'A sequence of measurements of the same thing taken at regular, ordered time steps: daily footfall, monthly revenue, hourly temperature. The position in time is part of the information.' },
          { term: 'Forecast', def: 'An estimate of a future value of a time series, made using only information available today. A forecast for next March is made without knowing what March will bring.' },
          { p: 'Why should a business person care? Because almost every planning decision is a forecast in disguise: how much stock to order, how many staff to roster, how many cars to build next quarter. A guess that ignores the structure of the past will be wrong in a predictable, expensive way.' },
          { p: 'In the made-up monthly sales series below, your eye sees two things at once: the line drifts upwards, and it wiggles in a regular yearly wave. Those are the two most important **components** of a time series.' },
          { diagram: { kind: 'curve', fn: '100+2*x+20*Math.sin(2*Math.PI*x/12)', xMin: 0, xMax: 48, xLabel: 'month', yLabel: 'sales (units)', caption: 'Four years of monthly sales. Notice two patterns layered together: a steady climb of about 2 units a month (the trend) and a wave that repeats every 12 months (the seasonality). Real data adds random noise on top.' } },
        ],
      },
      {
        heading: 'Building the intuition: the sea, the tide and the waves',
        blocks: [
          { p: 'Imagine standing on a pier and watching the water level against a marker post. Three different things are moving the water at once, on three different timescales.' },
          { steps: [
            '**The sea level itself rises slowly over decades.** You cannot see it in a day, but over years the average level creeps up. This is the **trend**: the long-run direction.',
            '**The tide goes in and out on a fixed schedule.** You can set your watch by it, and it repeats twice a day, every day. This is **seasonality**: a pattern with a fixed, known period.',
            '**Waves splash up and down unpredictably.** Each one is different, and knowing the last wave tells you little about the next. This is **noise**: what is left when the predictable parts are removed.',
          ], title: 'Three movements in one water level' },
          { p: 'The measured water level is a messy line. Separate the three movements and each is simple: a slow ramp, a regular wave, random splashes. The first two are easy to forecast; the third is impossible, which tells you how accurate you can ever hope to be.' },
          { term: 'Trend', def: 'The long-term direction of a series: rising, falling or flat. It changes slowly, over many periods.' },
          { term: 'Seasonality', def: 'A pattern that repeats at a fixed, known interval: every 7 days, every 12 months, every 24 hours. Weekend peaks, festival peaks and summer air-conditioner demand are all seasonal.' },
          { term: 'Noise (residual)', def: 'The irregular part left over after trend and seasonality are removed. If the decomposition is good, the residual looks random, with no pattern left to exploit.' },
          { callout: 'Seasonality is not the same as a **cycle**. A season has a fixed calendar length (Diwali comes every year). A business cycle (boom and recession) rises and falls with irregular length, so the calendar cannot predict it. Textbooks usually fold cycles into the trend.', tone: 'key' },
          { think: { q: 'A cinema chain sees ticket sales spike every Friday to Sunday, and also whenever a big-star film releases. Which part is seasonality?', a: 'The Friday-to-Sunday spike is seasonality: it repeats every 7 days, on schedule. Big releases are not on a fixed calendar, so they are not seasonal. They are events that should be modelled separately, for example with a "release week" flag.' } },
        ],
      },
      {
        heading: 'How decomposition works, step by step',
        blocks: [
          { p: 'Taking a series apart into its components is called **decomposition**. The classical method, still taught everywhere and available in Python as `seasonal_decompose`, needs only averages and subtraction.' },
          { diagram: { kind: 'flow', nodes: ['**Plot** the series and spot the season length', '**Smooth** it with a moving average to get the trend', '**Remove** the trend (subtract or divide)', '**Average** what is left, season by season', '**Residual** = what remains after trend and season'], caption: 'Classical decomposition in five moves. Each step peels off one component so the next one becomes visible.' } },
          { term: 'Moving average', def: 'The average of a window of neighbouring values, slid along the series one step at a time. Averaging over exactly one full season cancels the seasonal ups and downs, leaving the trend.' },
          { steps: [
            '**Plot first** and find the season length: 12 for monthly data, 7 for daily data with weekday effects, 4 for quarterly.',
            '**Estimate the trend** with a moving average covering exactly one season. A 12-month window contains every month once, so the Diwali high and January low cancel out.',
            '**Remove the trend** by subtracting it (additive model) or dividing by it (multiplicative model).',
            '**Average the detrended values** for each season position: all Januaries together, all Februaries together. Noise tends to cancel.',
            '**Residual** = what is left. It should look like random scatter.',
          ], title: 'The procedure' },
          { p: 'There is one important choice in step 3: does the seasonal swing stay the **same size** as the business grows, or does it **grow with** the business? The picture below shows both.' },
          { diagram: { kind: 'curve', fn: '50+2*x+15*Math.sin(2*Math.PI*x/12)', fn2: '(50+2*x)*(1+0.3*Math.sin(2*Math.PI*x/12))', xMin: 0, xMax: 48, xLabel: 'month', yLabel: 'sales', legend: ['additive: swing stays ±15', 'multiplicative: swing is ±30% of trend'], caption: 'Same trend, two kinds of seasonality. In the additive series the waves keep a constant height. In the multiplicative series the waves get taller as sales grow, because the season is a percentage of the level. Most growing businesses look multiplicative.' } },
          { term: 'Additive vs multiplicative', def: 'Additive: the seasonal effect is a fixed amount (December adds 200 units every year). Multiplicative: the seasonal effect is a percentage (December is 30% above the trend, whatever the trend is).' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { p: 'The two decomposition models are just the pier story written as an equation.' },
          { tex: 'y_t = T_t + S_t + R_t', plain: 'Additive model: the value at time t is the trend plus the seasonal effect plus noise.', symbols: [['y_t', 'the observed value at time t'], ['T_t', 'trend at time t'], ['S_t', 'seasonal effect for the season t falls in'], ['R_t', 'residual (noise) at time t']] },
          { tex: 'y_t = T_t \\times S_t \\times R_t', plain: 'Multiplicative model: the seasonal effect and noise scale the trend up or down by a factor. A seasonal factor of 1.3 means "30% above trend".' },
          { p: 'A useful trick: taking logarithms turns multiplication into addition, so log(y) = log(T) + log(S) + log(R). That is why analysts often take the log of a growing series and then use additive tools.' },
          { p: 'For monthly data, the trend is usually estimated with a "2×12" centred moving average. A 12-month window has no middle month, so we average two neighbouring 12-month windows, which centres the result exactly on month t.' },
          { tex: 'T_t = \\tfrac{1}{24}y_{t-6} + \\tfrac{1}{12}\\left(y_{t-5} + \\dots + y_{t+5}\\right) + \\tfrac{1}{24}y_{t+6}', plain: 'The trend at month t is a weighted average of the 13 months centred on t. The two end months get half weight because together they represent the same calendar month.' },
          { p: 'Notice that this uses six months **into the future** of t. Fine for describing history, but there is no trend value for the last six months, and such values must never be used as forecasting features.' },
          { term: 'Lag', def: 'A shifted copy of the series. Lag 1 of this month\'s sales is last month\'s sales; lag 12 is the same month last year.' },
          { term: 'Autocorrelation (ACF)', def: 'The correlation between a series and its own lagged copy. High autocorrelation at lag 12 means "this month looks like the same month last year". The autocorrelation function (ACF) lists it for lag 1, 2, 3 and so on.' },
          { tex: 'r_k = \\frac{\\sum_{t=k+1}^{n} (y_t - \\bar y)(y_{t-k} - \\bar y)}{\\sum_{t=1}^{n} (y_t - \\bar y)^2}', plain: 'Pair every value with the value k steps earlier. Multiply their deviations from the average and add up. Divide by the total variation so the answer lies between −1 and +1.', symbols: [['r_k', 'autocorrelation at lag k'], ['\\bar y', 'mean of the whole series'], ['n', 'number of observations']] },
          { p: 'Why does this work? If values above average tend to be followed (k steps later) by values above average, the products are mostly positive and r is large. If highs are followed by lows, the products are negative.' },
          { term: 'Stationary', def: 'A series whose average level, spread and autocorrelation pattern do not change over time. A trending series is not stationary (its average keeps moving). Many classical models, such as ARIMA, assume stationarity.' },
          { term: 'Differencing', def: 'Replacing each value by its change from the previous period. It turns a steadily rising series into a roughly flat one, removing the trend.' },
          { tex: '\\Delta y_t = y_t - y_{t-1} \\qquad \\Delta_{12} y_t = y_t - y_{t-12}', plain: 'Ordinary differencing takes the change from last period and removes trend. Seasonal differencing takes the change from the same season last year and removes a stable seasonal pattern.' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Decomposing three years of quarterly sales (₹ lakh)', setup: 'A two-wheeler accessories dealer records quarterly sales. Year 1: 80, 120, 100, 100. Year 2: 90, 130, 110, 110. Year 3: 100, 140, 120, 120. Separate trend and seasonality with a simple additive approach, using yearly averages as a rough trend.', steps: [
            'Yearly averages: Year 1 = 400 / 4 = 100. Year 2 = 440 / 4 = 110. Year 3 = 480 / 4 = 120. Trend: +10 lakh per year.',
            'Subtract each year\'s average from its quarters. Year 1: −20, +20, 0, 0. Year 2: −20, +20, 0, 0. Year 3: −20, +20, 0, 0.',
            'Seasonal effects: Q1 = −20, Q2 = +20, Q3 = 0, Q4 = 0. They add to zero, as additive seasonal effects should.',
            'Residuals: every value equals average + seasonal effect exactly, so the residual is 0 (real data is never this tidy).',
            'Forecast Year 4: trend continues to 130. Q1 = 130 − 20 = 110, Q2 = 130 + 20 = 150, Q3 = 130, Q4 = 130.',
          ], result: 'The dealer should plan for about ₹150 lakh in Q2 of Year 4, not the ₹130 lakh a plain average would suggest. (A real analysis would use a moving-average trend, which also captures growth within each year.)' } },
          { example: { title: 'Multiplicative seasonality for an ice-cream brand', setup: 'Trend sales are ₹50 lakh a month. Seasonal factors: April 1.4, December 0.7. Two years later the trend has doubled to ₹100 lakh.', steps: [
            'April now: 50 × 1.4 = ₹70 lakh (₹20 lakh above trend).',
            'December now: 50 × 0.7 = ₹35 lakh (₹15 lakh below trend).',
            'April in two years: 100 × 1.4 = ₹140 lakh (₹40 lakh above trend).',
            'An additive model fitted today would have predicted only 100 + 20 = ₹120 lakh for that April.',
          ], result: 'When the seasonal swing grows with the business, the multiplicative model is right and the additive one under-forecasts the peak by ₹20 lakh.' } },
          { example: { title: 'Computing autocorrelation by hand', setup: 'A tiny series with a 4-step cycle: 2, 4, 6, 4, 2, 4, 6, 4. Mean = 32 / 8 = 4.', steps: [
            'Deviations from the mean: −2, 0, +2, 0, −2, 0, +2, 0. Sum of squares (denominator) = 4 + 0 + 4 + 0 + 4 + 0 + 4 + 0 = 16.',
            'Lag 2: pair each deviation with the one two steps earlier: (2×−2) + (0×0) + (−2×2) + (0×0) + (2×−2) + (0×0) = −12. r₂ = −12 / 16 = −0.75.',
            'Lag 4: pairs (−2×−2) + (0×0) + (2×2) + (0×0) = 8. r₄ = 8 / 16 = +0.5.',
            'Lag 1 and lag 3: every product contains a zero, so r₁ = r₃ = 0.',
          ], result: 'Lag 2 is strongly negative (half a cycle away: peaks meet troughs) and lag 4 is positive (one full cycle: peaks meet peaks). r₄ is 0.5 rather than 1 only because just four pairs overlap in such a short series.' } },
        ],
      },
      {
        heading: 'Reading ACF plots and checking stationarity',
        blocks: [
          { p: 'The ACF is usually drawn as a bar chart: one bar per lag. You read it like a fingerprint. Below is the ACF of five years of noisy monthly sales with a yearly pattern.' },
          { diagram: { kind: 'bars', labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'], values: [0.76, 0.43, 0.05, -0.36, -0.66, -0.76, -0.66, -0.41, -0.08, 0.3, 0.58, 0.68], highlight: 11, yLabel: 'autocorrelation', caption: 'ACF of monthly sales with yearly seasonality. Values fall to strongly negative at lag 6 (half a year: summer peak versus winter trough) and climb back to +0.68 at lag 12 (same month last year). A wave like this is the signature of seasonality.' } },
          { diagram: { kind: 'bars', labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'], values: [0.48, -0.26, -0.68, -0.66, -0.22, 0.46, 0.82, 0.43, -0.22, -0.65, -0.63, -0.21, 0.44, 0.78], highlight: 6, yLabel: 'autocorrelation', caption: 'ACF of daily store footfall with a weekend peak. The spikes at lags 7 and 14 say "today looks like the same weekday last week". This is how you discover a weekly pattern you had not been told about.' } },
          { bullets: [
            '**Slow, steady decay from a high value** (0.95, 0.92, 0.90 …): a trend is present. The series is not stationary; difference it.',
            '**Regular spikes at multiples of a lag** (7, 14, 21 or 12, 24): seasonality with that period.',
            '**All bars small after lag 0**: little left to predict. The series behaves like noise.',
            '**Bars inside the shaded band** that plotting libraries draw (roughly ±2/√n) are not statistically different from zero.',
          ] },
          { p: 'Formal stationarity checks exist: the **ADF test** starts from "not stationary" (a small p-value suggests stationary) and the **KPSS test** starts from "stationary". In practice, a plot plus the ACF tells you most of what you need.' },
          { callout: 'Run the ACF on the residuals after decomposition too. If clear spikes remain, your decomposition has missed something, such as a weekly pattern hiding inside monthly data or a festival that moves between months.', tone: 'tip' },
        ],
      },
      {
        heading: 'Components in the real world',
        blocks: [
          { case: { title: 'Electricity demand planning (illustrative)', story: 'A state power distributor must buy electricity a day ahead. Hourly demand contains three seasonal patterns at once: a daily one (evening peak when lights and fans come on), a weekly one (lower on Sundays when offices close) and a yearly one (summer air-conditioning). On top sits a trend from new connections. The team decomposes the series with STL, a robust method that lets seasonality change slowly, and studies each layer. The yearly component shows peak summer demand growing faster than average demand, which changes how much peak capacity is contracted. The residuals reveal spikes on cricket-final days, which become an extra model input.' } },
          { bullets: [
            '**Retail and FMCG:** separating festival peaks from underlying growth tells you whether a strong October was real growth or just Diwali falling earlier.',
            '**Automotive:** monthly car registrations have year-end and financial-year-end effects; decomposition stops planners from mistaking a March push for a demand shift.',
            '**Manufacturing:** removing the weekly shift pattern from sensor data makes slow machine drift (a trend) visible early.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Shuffling the rows.** Random splits leak the future into the past. Keep time order (see Forecast Validation).',
            '**Ignoring the calendar.** Months have different numbers of days and weekends, and festivals such as Diwali, Eid and Holi move between months. Add holiday flags and working-day counts.',
            '**Assuming the season never changes.** Classical decomposition forces every January to have the same effect. If shopping habits shift (say, online sales flatten the weekend peak), use STL, which lets seasonality evolve.',
            '**Structural breaks.** A lockdown, a new competitor or a price change can permanently shift the level. Mark the break or model the periods separately.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'Classical decomposition', items: ['Moving-average trend, fixed seasonal pattern', 'Very easy to explain to managers', 'No trend estimate for the first and last half-season', 'Sensitive to outliers', 'Good for a first look'] }, right: { title: 'Better options when…', items: ['Seasonality drifts or outliers exist → **STL**', 'Several seasons (daily + weekly + yearly) → **MSTL** or **Prophet**', 'You want forecasts, not just description → **Holt-Winters / ETS**', 'You need stationarity for modelling → **differencing + ARIMA**'] }, caption: 'Decomposition is a diagnostic tool. Once you know the components, pick the forecasting method that matches them.' } },
          { callout: 'Decomposition describes the past; it does not forecast by itself. Its real value is telling you which forecasting model to choose and what accuracy is realistic given the size of the noise.', tone: 'key' },
        ],
      },
    ],
    faq: [
      { q: 'How do I know the season length?', a: 'Usually from the business calendar: 7 for daily data with weekday effects, 12 for monthly data, 4 for quarterly, 24 for hourly. Confirm it with the ACF, where seasonality shows up as spikes at that lag and its multiples.' },
      { q: 'Additive or multiplicative: how do I choose?', a: 'Plot the series. If the seasonal swings get bigger as the level rises, use multiplicative (or take logs and use additive). If they stay the same size, additive is fine.' },
      { q: 'Does every series have a trend and seasonality?', a: 'No. Some series have neither and look like noise around a constant level. Decomposition will still produce components, so check that the seasonal effects are large compared with the residuals.' },
      { q: 'What does "stationary" mean in everyday words?', a: 'The series behaves the same way throughout its history: it wobbles around a constant average with a constant spread. A growing sales series is not stationary; its month-to-month changes often are.' },
      { q: 'Is differencing the same as decomposition?', a: 'No. Decomposition separates and keeps the components so you can study them. Differencing removes trend (and, with a seasonal difference, seasonality) to produce a stable series for models like ARIMA.' },
      { q: 'Which Python tools should I use?', a: '`statsmodels` offers `seasonal_decompose` (classical), `STL` (robust, evolving seasonality) and `plot_acf`. pandas handles dates, resampling and `.diff()` for differencing.' },
    ],
  },

  'exp-smoothing': {
    minutes: 18,
    hook: 'A retail chain stocks 20,000 products in 300 stores. That is six million series to forecast every week. Nobody can hand-craft a model for each one, and a forecast that takes an hour per series is useless. What the planners need is a method that is cheap, automatic, adapts when demand shifts and ignores random blips. For more than sixty years, the answer in supply chains has been **exponential smoothing**: a weighted average that trusts recent weeks more than old ones.',
    sections: [
      {
        heading: 'The problem: how much should the past count?',
        blocks: [
          { p: 'Suppose you sell a shampoo and want to forecast next week\'s demand. Two very simple ideas come to mind, and both are flawed.' },
          { term: 'Naive forecast', def: 'Forecast that next period will equal the most recent value: "next week will be like this week". It reacts instantly to change but also copies every random blip.' },
          { p: 'The **naive forecast** overreacts. If last week had a one-off bulk order, it predicts the bulk order again. The opposite idea is to **average all history**. That ignores noise beautifully, but if demand truly moved up six months ago, the old weeks keep dragging the forecast down for years.' },
          { p: 'What we want is in between: use all the history, but let recent weeks count more and older weeks fade away gradually. Exponential smoothing does exactly that, and it needs to remember just one number.' },
          { term: 'Level', def: 'The current underlying value of the series once noise is filtered out: "what demand is really running at right now". Simple exponential smoothing tracks only the level.' },
          { diagram: { kind: 'curve', fn: '150-50*Math.pow(0.8,x)', fn2: '150-50*Math.pow(0.2,x)', xMin: 0, xMax: 10, xLabel: 'weeks after demand jumps from 100 to 150', yLabel: 'forecast', legend: ['α = 0.2: smooth but slow', 'α = 0.8: fast but jumpy'], caption: 'Demand steps permanently from 100 to 150. A forecaster with a high smoothing weight (α = 0.8) catches up within two weeks; one with a low weight (α = 0.2) takes many weeks. The price of fast reaction is that random blips also get copied.' } },
        ],
      },
      {
        heading: 'Building the intuition: the experienced store manager',
        blocks: [
          { p: 'Picture a store manager who has run the same shop for years. Each Monday she writes down her gut-feel estimate of weekly demand. Then the week happens. How does a sensible person update her belief?' },
          { steps: [
            '**She starts with her current belief:** "We sell about 100 bottles a week."',
            '**The week comes in at 120.** She was surprised by 20 bottles.',
            '**She does not jump all the way to 120.** Maybe it was a fluke. Nor does she ignore it. She moves part of the way, say 30% of the surprise: 100 + 0.3 × 20 = 106.',
            '**Next week she repeats the process** with 106 as her belief. Over time, old weeks matter less and less because each update dilutes them a little more.',
          ], title: 'Updating a belief, one week at a time' },
          { p: 'That 30% is the single dial of simple exponential smoothing, called **alpha (α)**. A nervous manager uses a big α and chases every number. A stubborn one uses a tiny α and barely moves. A good one picks the α that would have forecast best in the past.' },
          { term: 'Smoothing parameter (α)', def: 'A number between 0 and 1 that says what fraction of each surprise to accept. α near 1: follow the latest data closely. α near 0: change belief very slowly.' },
          { think: { q: 'For which product would you want a higher α: rice (steady staple) or a trendy energy drink whose popularity shifts month to month?', a: 'The energy drink. Its true level really does move, so the forecast must keep up. Rice demand is stable, so most week-to-week movement is noise and a low α filters it out.' } },
        ],
      },
      {
        heading: 'How it works, step by step',
        blocks: [
          { diagram: { kind: 'flow', nodes: ['**Start** with an initial level', '**Forecast** next period = current level', '**Observe** the actual value', '**Error** = actual − forecast', '**Update** level += α × error, then repeat'], caption: 'Simple exponential smoothing is a feedback loop: forecast, observe, measure the surprise, correct partway.' } },
          { steps: [
            '**Initialise the level.** Common choices are the first observation or the average of the first few. Libraries can also estimate it.',
            '**Forecast.** The forecast for next period is simply the current level. For simple smoothing, the forecast for every future period is the same flat line.',
            '**Observe and compute the error** when the actual value arrives.',
            '**Update the level** by adding α times the error.',
            '**Choose α** by trying values on history and keeping the one with the lowest forecast error. Libraries do this automatically.',
          ], title: 'The procedure' },
          { p: 'Simple smoothing assumes there is no trend and no seasonality: demand wanders around a level. Two famous extensions add those components back. **Holt\'s method** adds a trend, and **Holt-Winters** adds a trend and a seasonal pattern. Each new component gets its own smoothing dial.' },
          { term: 'Trend component (b)', def: 'In Holt\'s method, the smoothed estimate of how much the level changes per period, for example "+10 units a week". It is updated with its own parameter β.' },
          { term: 'Seasonal component (s)', def: 'In Holt-Winters, one smoothed adjustment per season position (one for each month, or each weekday), updated with parameter γ.' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { tex: '\\hat y_{t+1} = \\alpha\\, y_t + (1-\\alpha)\\, \\hat y_t', plain: 'Next forecast = α × the latest actual + (1 − α) × the previous forecast. A weighted average of "what just happened" and "what I believed".', symbols: [['\\hat y_{t+1}', 'forecast for the next period'], ['y_t', 'actual value this period'], ['\\hat y_t', 'forecast that had been made for this period'], ['\\alpha', 'smoothing parameter, between 0 and 1']] },
          { tex: '\\hat y_{t+1} = \\hat y_t + \\alpha\\,(y_t - \\hat y_t)', plain: 'The same formula rearranged: new forecast = old forecast + α × the error. This is the store manager\'s "move part of the way" rule.' },
          { p: 'Why is it called "exponential"? Substitute the formula into itself repeatedly and the forecast turns out to be a weighted average of **all** past values, with weights that shrink by a factor (1 − α) each step back.' },
          { tex: '\\hat y_{t+1} = \\alpha y_t + \\alpha(1-\\alpha) y_{t-1} + \\alpha(1-\\alpha)^2 y_{t-2} + \\dots', plain: 'This week gets weight α, last week α(1 − α), the week before α(1 − α)², and so on. Weights decay like an exponential curve and add up to 1.' },
          { p: 'This is the magic: you get a weighted average of the entire history while storing just one number, the latest forecast.' },
          { p: '**Holt\'s method** keeps two numbers: a level ℓ and a trend b. Each is updated like the simple case.' },
          { tex: '\\ell_t = \\alpha y_t + (1-\\alpha)(\\ell_{t-1} + b_{t-1}) \\qquad b_t = \\beta(\\ell_t - \\ell_{t-1}) + (1-\\beta) b_{t-1}', plain: 'New level: blend the actual with where the old level plus trend said we would be. New trend: blend the latest change in level with the old trend.', symbols: [['\\ell_t', 'level at time t'], ['b_t', 'trend (change per period) at time t'], ['\\beta', 'trend smoothing parameter, between 0 and 1']] },
          { tex: '\\hat y_{t+h} = \\ell_t + h\\, b_t', plain: 'Holt forecast h periods ahead: start from today\'s level and add h steps of trend. The forecast is a sloping straight line.', symbols: [['h', 'how many periods ahead']] },
          { tex: '\\hat y_{t+h} = \\ell_t + h\\, b_t + s_{t+h-m}', plain: 'Additive Holt-Winters adds the most recent seasonal adjustment for the season being forecast. In the multiplicative version the seasonal term multiplies instead of adds.', symbols: [['s', 'seasonal adjustment for that season position'], ['m', 'season length, e.g. 12 for months']] },
          { term: 'Damped trend', def: 'A version of Holt\'s method where the trend gradually fades towards zero over the forecast horizon, so long-range forecasts level off instead of climbing forever. It often forecasts better in practice.' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Five weeks of simple smoothing (α = 0.3)', setup: 'Weekly demand for a shampoo SKU. The forecast for week 1 is 100. Actuals for weeks 1 to 5: 120, 110, 95, 130, 105.', steps: [
            'Week 1: error = 120 − 100 = +20. New forecast = 100 + 0.3 × 20 = 106.',
            'Week 2: error = 110 − 106 = +4. New forecast = 106 + 0.3 × 4 = 107.2.',
            'Week 3: error = 95 − 107.2 = −12.2. New forecast = 107.2 − 3.66 = 103.54.',
            'Week 4: error = 130 − 103.54 = +26.46. New forecast = 103.54 + 7.94 ≈ 111.48.',
            'Week 5: error = 105 − 111.48 = −6.48. New forecast ≈ 111.48 − 1.94 ≈ 109.53.',
          ], result: 'Actuals swung between 95 and 130, but the forecast moved calmly between 100 and about 111. The forecast for week 6, and every later week, is about 109.5 units.' } },
          { diagram: { kind: 'table', head: ['Week', 'Actual', 'Forecast', 'Error', 'Next forecast'], rows: [['1', '120', '100.00', '+20.00', '106.00'], ['2', '110', '106.00', '+4.00', '107.20'], ['3', '95', '107.20', '−12.20', '103.54'], ['4', '130', '103.54', '+26.46', '111.48'], ['5', '105', '111.48', '−6.48', '109.53']], caption: 'The same calculation as a table. Each row\'s next forecast becomes the following row\'s forecast. Notice how much less the forecast column moves than the actual column.' } },
          { example: { title: 'Catching up after a demand shift', setup: 'A product moves to a better shelf and demand jumps permanently from 100 to 150 units. Compare α = 0.2 and α = 0.8, starting from a forecast of 100.', steps: [
            'α = 0.8: forecasts after weeks 1 to 4 are 140, 148, 149.6, 149.9.',
            'α = 0.2: forecasts after weeks 1 to 5 are 110, 118, 124.4, 129.5, 133.6.',
            'After 5 weeks the low-α forecast is still 16 units short; each week it closes only 20% of the remaining gap.',
          ], result: 'High α adapts quickly to real changes; low α resists noise. Fitting α on history balances the two automatically.' } },
          { example: { title: 'One Holt update for a growing product', setup: 'An EV charging cable with rising sales. Current level ℓ = 200 units, trend b = +10 per month. α = 0.5, β = 0.3. This month\'s actual = 215.', steps: [
            'Forecast for this month was 200 + 10 = 210. Actual 215 is 5 above.',
            'New level = 0.5 × 215 + 0.5 × 210 = 212.5.',
            'Change in level = 212.5 − 200 = 12.5. New trend = 0.3 × 12.5 + 0.7 × 10 = 3.75 + 7 = 10.75.',
            'Forecasts: 1 month ahead = 212.5 + 10.75 = 223.25; 2 months = 234.0; 3 months = 244.75.',
          ], result: 'Because sales beat the forecast, both the level and the trend were nudged upwards. Simple smoothing would have forecast a flat line and fallen further behind each month.' } },
          { example: { title: 'Holt-Winters forecast for a festive month (illustrative)', setup: 'A sweets maker in July: level = ₹500 lakh a month, trend = +₹4 lakh per month, additive seasonal adjustment for October = +₹80 lakh.', steps: [
            'October is h = 3 months after July.',
            'Forecast = 500 + 3 × 4 + 80 = 500 + 12 + 80 = ₹592 lakh.',
            'The same model for January (h = 6, seasonal −₹40 lakh) gives 500 + 24 − 40 = ₹484 lakh.',
          ], result: 'Holt-Winters combines all three components into one forecast. Raw materials and staffing for October can be planned around ₹592 lakh of sales.' } },
        ],
      },
      {
        heading: 'Choosing α and the right variant',
        blocks: [
          { p: 'How much does the past really count for a given α? The bars below show the weights for α = 0.3. The latest week gets 30%, and weights shrink by 30% each step back.' },
          { diagram: { kind: 'bars', labels: ['this week', '1 back', '2 back', '3 back', '4 back', '5 back'], values: [0.3, 0.21, 0.147, 0.103, 0.072, 0.05], highlight: 0, yLabel: 'weight in forecast', caption: 'Weights for α = 0.3: 0.30, 0.21, 0.147, 0.103, 0.072, 0.050. The last six weeks carry about 88% of the total weight; everything older shares the remaining 12%.' } },
          { p: '**Fitting the parameters.** You do not guess α, β and γ by hand. The library tries values and keeps those that minimise the sum of squared one-step-ahead errors on history. In statsmodels this happens inside `.fit()`.' },
          { p: '**Choosing the variant.** Modern practice uses the **ETS framework** (Error, Trend, Seasonal), which names each model by its components, for example ETS(A,A,M): additive errors, additive trend, multiplicative seasonality. Because ETS models are proper statistical models, they produce **prediction intervals** and can be compared using AIC.' },
          { term: 'Prediction interval', def: 'A range that the future value should fall inside with a stated probability, for example "between 90 and 130 units with 80% probability". It is more useful for stock decisions than a single number.' },
          { diagram: { kind: 'tree', root: { label: 'Does the series have a trend?', children: [
            { label: 'Seasonality?', edge: 'No', children: [{ label: 'Simple ES', edge: 'No' }, { label: 'Seasonal ES, no trend', edge: 'Yes' }] },
            { label: 'Seasonality?', edge: 'Yes', children: [{ label: 'Holt (often damped)', edge: 'No' }, { label: 'Holt-Winters', edge: 'Yes' }] },
          ] }, caption: 'A quick guide to the family. Then ask one more question for Holt-Winters: does the seasonal swing grow with the level (multiplicative) or stay constant (additive)?' } },
          { callout: 'Exponential smoothing extends any trend in a straight line. Over long horizons that can produce absurd forecasts. A **damped trend** is usually the safer default for horizons beyond a few periods.', tone: 'warn' },
        ],
      },
      {
        heading: 'Exponential smoothing in the real world',
        blocks: [
          { case: { title: 'Replenishing thousands of SKUs (illustrative, based on common practice)', story: 'A pharmacy chain forecasts weekly demand for every product in every store. A data scientist could build a sophisticated model per series, but there are far too many series and most sell only a few units a week. The team fits ETS models automatically to every store-product series each weekend: simple smoothing for steady items, Holt-Winters for seasonal ones such as cough syrup and sunscreen, chosen by AIC. The forecasts, plus their prediction intervals, feed a safety-stock formula. Forecasting and stock-ordering run overnight on a modest server. The team then reserves its expensive modelling effort for the few hundred high-value products where promotions and prices matter.' } },
          { p: 'Exponential smoothing has a strong reputation. In the well-known M forecasting competitions run by Spyros Makridakis, simple statistical methods such as exponential smoothing repeatedly proved hard to beat, and the winner of the 2018 M4 competition was a hybrid that combined exponential smoothing with a neural network.' },
          { bullets: [
            '**Supply chains:** weekly demand per SKU, a classic and still dominant use.',
            '**Call centres:** half-hourly call volumes with daily and weekly seasonality for staffing.',
            '**Finance:** smoothing noisy indicators; the exponentially weighted moving average (EWMA) of volatility is the same idea.',
            '**Manufacturing quality control:** EWMA control charts flag small, persistent drifts in a process.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Using simple smoothing on trending or seasonal data.** It always lags behind a trend and flattens every peak. Match the variant to the components you found in decomposition.',
            '**Wrong seasonality type.** Additive seasonality on a growing business under-forecasts peaks. Check whether the swings grow with the level.',
            '**Forgetting external drivers.** Smoothing only looks at the series\' own past. It cannot know about next week\'s promotion, a price cut or a heatwave.',
            '**Intermittent demand.** Items that sell zero most weeks break the method. Croston\'s method is designed for these.',
            '**Over-trusting long horizons.** Trend extrapolation compounds errors; prefer damped trends and always backtest.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'Exponential smoothing shines when…', items: ['Thousands of series need automatic forecasts', 'Short to medium horizons', 'Patterns are mainly level, trend and season', 'You need speed, simplicity and intervals', 'You need a tough baseline to beat'] }, right: { title: 'Consider instead…', items: ['Strong autocorrelation structure → **ARIMA**', 'Promotions, prices, weather matter → **regression or gradient boosting** with lag features', 'Many related series with shared patterns → **global ML models**', 'Mostly zero demand → **Croston**', 'Multiple seasonalities → **TBATS** or **Prophet**'] }, caption: 'Use exponential smoothing as the first model and the benchmark that any fancier model must beat.' } },
          { callout: 'Never deploy a complex forecasting model without comparing it with exponential smoothing on the same backtest. It is surprising how often the simple model wins.', tone: 'key' },
        ],
      },
    ],
    faq: [
      { q: 'Is exponential smoothing the same as a moving average?', a: 'Both average past values, but a simple moving average gives equal weight to the last k values and zero to everything older. Exponential smoothing gives every past value some weight, decaying smoothly, with the most recent counting most.' },
      { q: 'What is a good value for α?', a: 'There is no universal value; let the software fit it. Fitted values between about 0.1 and 0.3 are common for stable demand. A fitted α near 1 suggests the series behaves like a random walk, where the naive forecast is about as good as anything.' },
      { q: 'Why is my simple smoothing forecast a flat line?', a: 'Simple smoothing only estimates the current level, so every future period gets the same forecast. To get slopes or seasonal shapes, use Holt or Holt-Winters.' },
      { q: 'What is the difference between Holt-Winters and ETS?', a: 'Holt-Winters is the original set of updating equations. ETS wraps the same ideas in a statistical model with an explicit error term, which gives likelihoods, AIC-based model selection and prediction intervals.' },
      { q: 'How much history do I need?', a: 'Simple smoothing works with a dozen points. Holt-Winters needs at least two full seasons (two years of monthly data) to estimate the seasonal pattern sensibly; more is better.' },
      { q: 'Which Python library should I use?', a: '`statsmodels`: `SimpleExpSmoothing` and `ExponentialSmoothing` for the classic methods, `ETSModel` for the full statistical version with intervals. The `statsforecast` package offers fast `AutoETS` for many series.' },
    ],
  },

  arima: {
    minutes: 17,
    hook: 'An electricity distributor notices that when demand runs unusually high on a hot Monday, it tends to stay high on Tuesday and then drift back to normal over the week. Yesterday carries information about today, and so do yesterday\'s surprises. **ARIMA** is the classical statistical model built to capture exactly this kind of memory. For decades it has been the standard tool of economists, central banks, energy planners and finance teams, and it remains the reference model every forecaster should understand.',
    sections: [
      {
        heading: 'The problem: series with memory',
        blocks: [
          { p: 'Exponential smoothing describes a series by its level, trend and season. It does not directly ask a sharper question: **how exactly does today depend on the last few days?** In many series that dependence is strong and specific. A heatwave pushes demand up for several days. A one-off delivery delay knocks on into the next week\'s stock, then disappears.' },
          { p: 'If we can measure that dependence, we can forecast with it. And because ARIMA is a full statistical model, it also tells us how uncertain each forecast is, which matters when the forecast drives a ₹100 crore power purchase.' },
          { term: 'White noise', def: 'A series of purely random shocks with average zero, constant spread and no correlation between one value and the next. It is completely unpredictable. A good model\'s leftover errors should look like white noise.' },
          { term: 'Autoregression', def: 'Predicting a series from its own past values, as if running a regression where the inputs are yesterday\'s and the day before\'s values. "Auto" means "self".' },
          { p: 'The name ARIMA bundles three ideas: **AR** (autoregressive: use past values), **I** (integrated: work with differences to remove trend), and **MA** (moving average: use past forecast errors). A model is written ARIMA(p, d, q), where the three numbers say how much of each ingredient to use.' },
          { diagram: { kind: 'curve', fn: '50+20*Math.pow(0.6,x)', xMin: 0, xMax: 10, marks: [{ x: 0, label: 'today: 70' }], xLabel: 'days ahead', yLabel: 'forecast', caption: 'An AR forecast after a shock. Today\'s value is 70, far above the long-run average of 50. The forecast does not jump back to 50 at once; it decays there gradually (62, 57.2, 54.3 …). How fast it decays is learned from the data.' } },
        ],
      },
      {
        heading: 'Building the intuition: a room, a door and a thermostat',
        blocks: [
          { p: 'Think of the temperature in an air-conditioned meeting room, measured every minute. Three ideas explain how it behaves.' },
          { steps: [
            '**Memory (AR).** If the room is 2 degrees too warm now, it will probably still be a bit too warm in a minute, because the air-conditioner pulls it back only gradually. The best guess for the next minute is "most of the current gap remains".',
            '**Reacting to surprises (MA).** Someone opens the door for a moment. Warm air rushes in, a one-off shock. Its effect lingers for a minute or two and then is gone. The model remembers recent **surprises**, not just recent values.',
            '**Looking at changes, not levels (I).** Now imagine the building is slowly heating up all afternoon. The raw temperature keeps climbing, so its average is not stable. But the **minute-to-minute change** is stable. So we model the changes, then add them back up.',
          ], title: 'Three ingredients' },
          { p: 'ARIMA combines these three. It first differences the series until it is stable (I), then explains each value using a few past values (AR) and a few past surprises (MA).' },
          { think: { q: 'A share price is famous for behaving like a "random walk": tomorrow\'s price is today\'s price plus an unpredictable change. Which ARIMA ingredients would describe it?', a: 'One difference (d = 1) and nothing else: ARIMA(0, 1, 0). The changes are white noise, so there is nothing for AR or MA terms to exploit. Its best forecast is simply today\'s price, the naive forecast.' } },
        ],
      },
      {
        heading: 'How it works: the Box-Jenkins steps',
        blocks: [
          { p: 'In the 1970s, the statisticians George Box and Gwilym Jenkins set out a disciplined recipe for building these models. It is still how analysts work today, often with software automating parts of it.' },
          { diagram: { kind: 'flow', nodes: ['**Make stationary**: difference d times', '**Identify** p and q from ACF/PACF or AIC', '**Fit** the coefficients', '**Check** residuals look like white noise', '**Forecast** with intervals'], caption: 'The Box-Jenkins loop. If the residual check fails, go back and try different orders.' } },
          { steps: [
            '**Plot the series and make it stationary.** If it trends, difference once (d = 1). Rarely, a second difference is needed. Seasonal series may need a seasonal difference too.',
            '**Identify candidate orders.** Study the ACF and PACF of the differenced series (explained below), or let an automatic search compare models by AIC.',
            '**Fit the model.** Software estimates the coefficients by maximum likelihood: the values that make the observed data most probable.',
            '**Check the residuals.** Plot them and their ACF and run a Ljung-Box test. Leftover pattern means the model missed something.',
            '**Forecast.** The model produces point forecasts plus prediction intervals that widen with the horizon.',
          ], title: 'The procedure' },
          { term: 'Residuals', def: 'The model\'s one-step-ahead errors on the history: actual minus fitted value. If the model has captured all the predictable structure, residuals are white noise.' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { p: 'Start with the simplest member, the **AR(1)** model: today depends on yesterday only.' },
          { tex: 'y_t = c + \\phi\\, y_{t-1} + \\varepsilon_t', plain: 'Today = a constant + a fraction φ of yesterday + a new random shock.', symbols: [['y_t', 'value today (after any differencing)'], ['c', 'a constant'], ['\\phi', 'phi: how much of yesterday carries over'], ['\\varepsilon_t', 'epsilon: the new white-noise shock today']] },
          { p: 'Why does the forecast settle down? If the series sits at its long-run mean μ, then μ = c + φμ, so the mean is c divided by (1 − φ). For this to make sense φ must lie between −1 and +1; otherwise each shock grows instead of fading and the series explodes.' },
          { tex: '\\mu = \\frac{c}{1-\\phi}, \\qquad |\\phi| < 1', plain: 'The long-run average of an AR(1) series. A φ close to 1 means long memory: shocks fade slowly.' },
          { p: 'The general AR(p) model uses p past values, and the MA(q) model uses q past shocks:' },
          { tex: 'y_t = c + \\phi_1 y_{t-1} + \\dots + \\phi_p y_{t-p} + \\varepsilon_t + \\theta_1 \\varepsilon_{t-1} + \\dots + \\theta_q \\varepsilon_{t-q}', plain: 'An ARMA(p, q) model: today = constant + weighted past values + today\'s shock + weighted past shocks. ARIMA applies this to the series after differencing it d times.', symbols: [['\\phi_i', 'AR coefficients: weights on past values'], ['\\theta_j', 'theta: MA coefficients, weights on past shocks'], ['p, q', 'how many past values and past shocks are used']] },
          { p: 'Why include past shocks at all? Some effects last a fixed, short time. A stock-out last week shifts some demand into this week and then stops. An AR term would make that echo fade forever; an MA(1) term says "last period\'s surprise matters for exactly one period".' },
          { term: 'Partial autocorrelation (PACF)', def: 'The correlation between today and the value k steps back **after removing** the influence of the values in between. It isolates the direct link. For an AR(2) series, the PACF is clearly non-zero at lags 1 and 2 and near zero after.' },
          { term: 'AIC', def: 'Akaike Information Criterion: a score that rewards a model for fitting the data well and penalises it for using more parameters. Lower is better. It helps choose between, say, ARIMA(1,1,1) and ARIMA(2,1,2) without overfitting.' },
          { tex: '\\text{AIC} = 2k - 2\\ln \\hat L', plain: 'k is the number of estimated parameters; L is the likelihood (how probable the data is under the fitted model). Better fit lowers AIC; each extra parameter adds 2.' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'AR(1) forecast of daily demand', setup: 'A regional power grid\'s daily peak demand (in hundreds of MW) follows y_t = 20 + 0.6 × y_{t−1} + shock. Today\'s peak was 70.', steps: [
            'Long-run mean = 20 / (1 − 0.6) = 20 / 0.4 = 50.',
            'Tomorrow: 20 + 0.6 × 70 = 20 + 42 = 62. Future shocks are unknown, so we use their average, zero.',
            'Day 2: 20 + 0.6 × 62 = 57.2.',
            'Day 3: 20 + 0.6 × 57.2 = 54.32. Day 4: 20 + 0.6 × 54.32 ≈ 52.59.',
            'Each day the gap to 50 shrinks by 40%: gaps of 20, 12, 7.2, 4.32, 2.59.',
          ], result: 'The forecast eases from 70 back towards 50 over about a week. The planner should buy extra capacity for the next two or three days, not for the whole month.' } },
          { example: { title: 'ARIMA(1,1,0): forecasting changes, then adding them up', setup: 'Monthly sales of a growing product, in units. The last value is 200 and the last monthly change was +10. The fitted model on the differences is Δy_t = 0.5 × Δy_{t−1} + shock.', steps: [
            'Forecast change for month 1 = 0.5 × 10 = 5. Level = 200 + 5 = 205.',
            'Month 2 change = 0.5 × 5 = 2.5. Level = 205 + 2.5 = 207.5.',
            'Month 3 change = 0.5 × 2.5 = 1.25. Level = 207.5 + 1.25 = 208.75.',
            'The changes keep halving, so the level approaches 200 + 5 + 2.5 + 1.25 + … = 210.',
          ], result: 'The "I" step is just bookkeeping: model the changes, then add them back up ("integrate") to get levels. Momentum in growth fades and sales level off around 210.' } },
          { diagram: { kind: 'table', head: ['Month ahead', 'Forecast change', 'Forecast level'], rows: [['0 (actual)', '+10', '200'], ['1', '+5', '205'], ['2', '+2.5', '207.5'], ['3', '+1.25', '208.75'], ['long run', '→ 0', '→ 210']], caption: 'The ARIMA(1,1,0) forecast in a table. The middle column is the AR(1) model on changes; the right column adds the changes back up. Without a constant, an ARIMA model with d = 1 eventually forecasts a flat line.' } },
          { example: { title: 'MA(1): a surprise that lasts exactly one period', setup: 'Weekly orders at a component supplier follow y_t = 100 + ε_t + 0.4 × ε_{t−1}. Last week\'s shock was zero, so this week\'s forecast was 100. Actual orders this week: 110.', steps: [
            'This week\'s shock ε = 110 − 100 = +10 (a customer pulled an order forward).',
            'Next week: 100 + 0.4 × 10 = 104. Part of the surprise carries over.',
            'The week after: the only shock it could use is next week\'s, which is unknown (average zero). Forecast = 100.',
          ], result: 'An MA(q) model remembers surprises for exactly q periods, then forecasts the mean. That suits one-off effects like pulled-forward orders, unlike AR effects which fade gradually.' } },
        ],
      },
      {
        heading: 'Choosing p, d and q, and checking the fit',
        blocks: [
          { p: '**Choosing d.** Difference until the series looks stationary: the plot wanders around a constant level and the ACF drops quickly. Usually d = 0 or 1. Over-differencing adds noise, so stop as soon as the series is stable.' },
          { p: '**Choosing p and q from the ACF and PACF.** Each simple model leaves a recognisable fingerprint. Below are the ACF and PACF of an AR(1) series with φ = 0.7.' },
          { diagram: { kind: 'bars', labels: ['ACF 1', 'ACF 2', 'ACF 3', 'ACF 4', 'ACF 5', 'PACF 1', 'PACF 2', 'PACF 3', 'PACF 4', 'PACF 5'], values: [0.7, 0.49, 0.343, 0.24, 0.168, 0.7, 0, 0, 0, 0], highlight: 5, yLabel: 'correlation', caption: 'Theoretical fingerprint of AR(1) with φ = 0.7. The ACF decays gradually (0.7, 0.49, 0.34 …, each 0.7 times the last). The PACF has a single spike at lag 1 and then nothing: only yesterday has a direct effect. One PACF spike means p = 1.' } },
          { diagram: { kind: 'table', head: ['Pattern', 'ACF', 'PACF', 'Suggests'], rows: [['AR(p)', 'Decays gradually', 'Cuts off after lag p', 'p from PACF'], ['MA(q)', 'Cuts off after lag q', 'Decays gradually', 'q from ACF'], ['ARMA(p,q)', 'Decays', 'Decays', 'Try small p, q; use AIC'], ['Non-stationary', 'Decays very slowly', 'Large spike at lag 1', 'Difference first']], caption: 'The classic identification table. Real data is noisier than theory, so treat it as a guide and confirm with AIC and residual checks.' } },
          { p: '**Letting the computer search.** Auto-ARIMA tools (`pmdarima.auto_arima`, `statsforecast.AutoARIMA`) test many combinations of p, d and q and keep the one with the lowest AIC. This is the usual practice today, but you should still look at the plots.' },
          { p: '**Checking the residuals.** The **Ljung-Box test** asks whether the residuals\' autocorrelations, taken together over several lags, are larger than chance would produce. A large p-value (say above 0.05) is good news: no evidence of leftover pattern.' },
          { p: '**Seasonality.** **SARIMA** adds seasonal AR, differencing and MA terms at the season lag, written ARIMA(p,d,q)(P,D,Q)m. A popular model for monthly data is ARIMA(0,1,1)(0,1,1)12, the "airline model", named after the airline passenger data Box and Jenkins analysed. **SARIMAX** further adds external inputs such as price, holidays or temperature.' },
          { callout: 'ARIMA prediction intervals widen with the horizon because uncertainty accumulates: each future step adds a new unknown shock. A 1-month-ahead forecast might be ±5%, a 12-month-ahead one ±20%. Report the interval, not just the line.', tone: 'key' },
        ],
      },
      {
        heading: 'ARIMA in the real world',
        blocks: [
          { case: { title: 'Monthly cement demand with SARIMAX (illustrative)', story: 'A cement producer plans kiln schedules and limestone purchases three months ahead. Monthly dispatches trend upwards with infrastructure spending, dip sharply in the monsoon months when construction slows, and rise before the financial year ends in March. The analytics team takes logs (the swings grow with volume), applies one regular and one seasonal difference, and fits a SARIMAX model with a monsoon-rainfall input and a flag for months with long festival holidays. Residual checks pass the Ljung-Box test. Backtests show it beats seasonal naive and Holt-Winters for one-to-three-month horizons, and the prediction intervals help the plant decide how much safety stock of clinker to hold.' } },
          { bullets: [
            '**Economics and central banking:** ARIMA-family models are standard benchmarks for inflation, GDP and interest-rate forecasts.',
            '**Energy:** day-ahead and week-ahead load forecasting, often SARIMAX with temperature as an input.',
            '**Finance:** modelling returns and spreads; GARCH models extend the idea to forecast volatility.',
            '**Operations:** forecasting a handful of important aggregate series, such as total monthly orders, where careful modelling is worth the effort.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Skipping stationarity.** Fitting AR terms to a trending series gives misleading coefficients and forecasts. Difference first.',
            '**Overfitting with large p and q.** ARIMA(5,1,5) can fit history beautifully and forecast badly. Prefer small orders and compare by AIC and backtests.',
            '**Never checking residuals.** If the residual ACF shows spikes, the model is leaving money on the table.',
            '**Expecting it to know about promotions.** Plain ARIMA only sees the series\' own past. Use SARIMAX with inputs, or a machine-learning model.',
            '**Scaling to thousands of series.** Fitting and checking ARIMA per series is slower and more fragile than ETS; automated tools help but need monitoring.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'ARIMA is a good choice when…', items: ['A single important series with clear autocorrelation', 'At least 50 or so observations (more for seasonal models)', 'You need principled prediction intervals', 'External drivers are few and known (SARIMAX)', 'Economists or regulators expect a classical model'] }, right: { title: 'Consider instead…', items: ['Thousands of SKUs → **ETS** or global ML models', 'Many drivers and nonlinear effects → **gradient boosting** with lag features', 'Several seasonalities → **TBATS**, **Prophet**, **MSTL**', 'Volatility is the target → **GARCH**', 'Very short history → **naive** or **simple smoothing**'] }, caption: 'ARIMA is the classical reference model. Use it where its strengths matter, and always benchmark it.' } },
          { callout: 'ARIMA and exponential smoothing overlap more than people think: simple exponential smoothing gives the same forecasts as ARIMA(0,1,1). Neither is always better; backtest both.', tone: 'tip' },
        ],
      },
    ],
    faq: [
      { q: 'What do the three numbers in ARIMA(1,1,1) mean?', a: 'p = 1 past value (AR), d = 1 difference (I), q = 1 past shock (MA). So the model works on month-to-month changes and uses last month\'s change and last month\'s surprise.' },
      { q: 'Why does ARIMA need stationarity?', a: 'The coefficients describe a stable relationship between today and the past. If the average level keeps drifting, that relationship is not stable and the estimates are unreliable. Differencing creates a stable series to model.' },
      { q: 'Why do my long-range ARIMA forecasts become a flat or straight line?', a: 'Far ahead, the AR and MA effects of known values have faded, so the forecast settles at the mean (d = 0), a flat line (d = 1, no constant) or a straight trend line (d = 1 with a constant).' },
      { q: 'Should I use ACF/PACF plots or auto-ARIMA?', a: 'Both. Auto-ARIMA is fast and objective; the plots help you understand the series and spot problems such as outliers or seasonality the search missed.' },
      { q: 'Is the "moving average" in ARIMA the same as a rolling average?', a: 'No, a common confusion. The MA part uses past forecast errors (shocks), not an average of past values. The name is historical.' },
      { q: 'Which Python tools should I use?', a: '`statsmodels.tsa.arima.model.ARIMA` and `SARIMAX` for fitting and diagnostics, `plot_acf` and `plot_pacf` for identification, and `pmdarima` or `statsforecast` for automatic order selection.' },
    ],
  },

  'ts-validation': {
    minutes: 16,
    hook: 'A consulting team presents a demand-forecasting model to a client\'s board: "3% error on test data". Six months after go-live the real error is 25%, warehouses are full of the wrong stock and nobody trusts the model. Nothing was wrong with the algorithm. The test was wrong: it let the model peek at the future. **Forecast validation** is the discipline of testing a forecast exactly as it will be used, so the number you show the board is the number the business will get.',
    sections: [
      {
        heading: 'The problem: you cannot test a forecast like an ordinary model',
        blocks: [
          { p: 'In ordinary machine learning you shuffle the rows, hold out a random 20% and measure accuracy on that. For time series this is a trap. If the test set contains March and the training set contains April, the model has, in effect, seen the future. Patterns from April quietly help it "predict" March, and the error looks far better than it will ever be in real life.' },
          { term: 'Backtest', def: 'Testing a forecasting method on history by pretending to stand at an earlier date, forecasting forward using only data available then, and comparing with what actually happened.' },
          { term: 'Look-ahead leakage', def: 'Any way that information from after the forecast date sneaks into the model or its inputs. It makes test results look better than real-world performance.' },
          { term: 'Forecast horizon', def: 'How far ahead the forecast is made: 1 week ahead, 3 months ahead. Errors usually grow with the horizon, so you must test at the horizon the business actually needs.' },
          { p: 'There is a second problem: a number like "12% error" means nothing on its own. Is that good for this product? You only know by comparing with a simple **baseline** that requires no modelling at all. If your model cannot beat "same as last year", it is not adding value.' },
          { diagram: { kind: 'compare', left: { title: 'Random split (wrong for time series)', items: ['Test months scattered through history', 'Model trains on months after the ones it predicts', 'Rolling features may include future values', 'Error looks optimistically low', 'No link to the real decision horizon'] }, right: { title: 'Time-ordered backtest (right)', items: ['Training data always ends before the test period', 'Repeated at several forecast dates', 'Features built only from past data', 'Error is realistic', 'Tested at the horizon the business uses'] }, caption: 'The single most important rule in forecasting: training data must always come from before the period being forecast.' } },
        ],
      },
      {
        heading: 'Building the intuition: paper trading',
        blocks: [
          { p: 'Imagine an investor who claims a brilliant trading strategy. How would you test it? Not by letting him look at a full year of price charts and then "predicting" points in the middle. You would make him **live through history**: on 1 January he sees only data up to 31 December and writes down his trades. Then you reveal January. Then he decides February, seeing only data to 31 January. And so on.' },
          { steps: [
            '**Freeze the clock** at a past date. Hide everything after it.',
            '**Make the forecast** exactly as you would in real life, at the real horizon.',
            '**Reveal the truth** for the forecast period and record the error.',
            '**Move the clock forward** and repeat, so the result does not depend on one lucky or unlucky period.',
          ], title: 'Living through history' },
          { p: 'That is a **rolling-origin backtest**. The "origin" is the date you pretend to be standing on; it rolls forward through history. Averaging errors across several origins gives a fair, stable estimate of real-world accuracy.' },
          { think: { q: 'Why is one test period not enough, even if it is in the right order?', a: 'One period may be unusual: a festival may fall in it, or a competitor may have run out of stock. Several origins spread across the year show both the typical error and how much it varies, which is what a planner needs to set safety stock.' } },
        ],
      },
      {
        heading: 'How a rolling-origin backtest works',
        blocks: [
          { diagram: { kind: 'flow', nodes: ['**Pick origins**: e.g. every 3 months', '**Train** on data up to the origin only', '**Forecast** the next h periods', '**Score** against actuals and a baseline', '**Roll** the origin forward and average'], caption: 'The backtest loop. Every step uses only information available at the origin date.' } },
          { steps: [
            '**Decide the horizon** the business needs: for example, 3 months ahead for production planning.',
            '**Choose several origins** spread over at least one full season.',
            '**At each origin, train on data up to that date only**, including any feature engineering and parameter tuning.',
            '**Forecast the next h periods**, compute the errors, and do the same for one or two simple baselines.',
            '**Average the errors** across origins, and look at the spread, not just the average.',
          ], title: 'The procedure' },
          { p: 'Two variants exist. In an **expanding window** the training set grows each time (all history up to the origin). In a **sliding window** it keeps a fixed length, which helps when old data no longer reflects the market. scikit-learn\'s `TimeSeriesSplit` implements the expanding version; its `max_train_size` option gives a sliding window, and `gap` leaves a buffer between training and test.' },
          { diagram: { kind: 'table', head: ['Fold', 'Train on months', 'Test on months', 'Train size'], rows: [['1', '0–23', '24–26', '24'], ['2', '0–26', '27–29', '27'], ['3', '0–29', '30–32', '30'], ['4', '0–32', '33–35', '33']], caption: 'Expanding-window folds produced by `TimeSeriesSplit(n_splits=4, test_size=3)` on 36 months of data. Every test block lies after its training block, and the origin rolls forward 3 months each time.' } },
          { term: 'Baseline (naive and seasonal naive)', def: 'Forecasts that need no model. Naive: next value = last value. Seasonal naive: next value = same season last year (next October = last October). A model is only worth deploying if it beats these.' },
        ],
      },
      {
        heading: 'The math: measuring forecast error',
        blocks: [
          { p: 'Every error metric starts from the same ingredient, the forecast error for each period: actual minus forecast. The metrics differ in how they combine the errors, and each choice answers a different business question.' },
          { tex: '\\text{MAE} = \\frac{1}{n}\\sum_{t=1}^{n} |y_t - \\hat y_t|', plain: 'Mean absolute error: the average size of the miss, in the original units (units, ₹). Easy to explain: "on average we are off by 10 units".', symbols: [['y_t', 'actual value'], ['\\hat y_t', 'forecast'], ['n', 'number of forecasts scored']] },
          { tex: '\\text{RMSE} = \\sqrt{\\frac{1}{n}\\sum_{t=1}^{n} (y_t - \\hat y_t)^2}', plain: 'Root mean squared error: squares the misses before averaging, so big misses count much more. Use it when large errors are disproportionately costly.' },
          { tex: '\\text{MAPE} = \\frac{100\\%}{n}\\sum_{t=1}^{n} \\left| \\frac{y_t - \\hat y_t}{y_t} \\right|', plain: 'Mean absolute percentage error: the average percentage miss. Popular, but it explodes when actuals are small and is undefined when an actual is zero.' },
          { tex: '\\text{WAPE} = \\frac{\\sum_t |y_t - \\hat y_t|}{\\sum_t |y_t|}', plain: 'Weighted absolute percentage error: total absolute miss divided by total actual volume. Big-selling items count more, small ones cannot blow it up. A favourite in retail and supply chains.' },
          { term: 'MASE', def: 'Mean absolute scaled error: your model\'s MAE divided by the MAE of a naive forecast on the training data. Below 1 means better than naive; above 1 means worse. It works across products of any size.' },
          { tex: '\\text{MASE} = \\frac{\\text{MAE}_{\\text{model}}}{\\frac{1}{T-m}\\sum_{t=m+1}^{T} |y_t - y_{t-m}|}', plain: 'Divide the model\'s MAE on the test period by the average error a naive (m = 1) or seasonal naive (m = season length) forecast made on the training history.', symbols: [['T', 'length of the training history'], ['m', '1 for naive, or the season length for seasonal naive']] },
          { p: 'Finally, check **bias**: the sum of (forecast − actual) divided by total actuals. A model can have a decent WAPE while consistently under-forecasting, which causes repeated stock-outs.' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'WAPE versus MAPE on four products', setup: 'One week of forecasts for four SKUs. Actuals: 100, 80, 120, 10 units. Forecasts: 90, 88, 108, 20.', steps: [
            'Absolute errors: |100 − 90| = 10, |80 − 88| = 8, |120 − 108| = 12, |10 − 20| = 10. Total = 40. MAE = 40 / 4 = 10 units.',
            'Percentage errors: 10/100 = 10%, 8/80 = 10%, 12/120 = 10%, 10/10 = 100%. MAPE = (10 + 10 + 10 + 100) / 4 = 32.5%.',
            'WAPE = total error / total actual = 40 / 310 ≈ 12.9%.',
            'RMSE = √((100 + 64 + 144 + 100) / 4) = √102 ≈ 10.10 units.',
            'Bias = (306 − 310) / 310 ≈ −1.3%: a slight overall under-forecast.',
          ], result: 'MAPE says 32.5% because one tiny SKU missed by 10 units. WAPE says 12.9%, which reflects the business impact far better. Choose the metric before looking at the results.' } },
          { example: { title: 'MASE: is the model better than naive?', setup: 'Training history (monthly units): 200, 210, 190, 220, 230, 215, 240. Test actuals for the next 3 months: 250, 245, 260. Model forecasts: 242, 250, 251.', steps: [
            'Naive one-step errors on training: |210 − 200| = 10, 20, 30, 10, 15, 25. Average = 110 / 6 ≈ 18.33.',
            'Model errors on test: |250 − 242| = 8, |245 − 250| = 5, |260 − 251| = 9. MAE = 22 / 3 ≈ 7.33.',
            'MASE = 7.33 / 18.33 = 0.40.',
          ], result: 'MASE of 0.40 means the model\'s errors are about 40% of a typical naive one-step error. It is clearly adding value. A MASE above 1 would mean "use the naive forecast instead".' } },
          { example: { title: 'Backtesting a quarterly demand model (illustrative)', setup: 'An auto-parts distributor tests a Holt-Winters model at a 3-month horizon from four origins, scoring WAPE for the model and for seasonal naive.', steps: [
            'Window 1: model 12%, seasonal naive 18%.',
            'Window 2: model 9%, seasonal naive 16%.',
            'Window 3: model 15%, seasonal naive 21% (Diwali fell in a different month from the previous year).',
            'Window 4: model 11%, seasonal naive 17%.',
            'Averages: model (12 + 9 + 15 + 11) / 4 = 11.75%; baseline (18 + 16 + 21 + 17) / 4 = 18%.',
          ], result: 'The model beats the baseline in every window, by about 6 points on average. Window 3 shows that festival timing hurts both methods, so a moving-holiday feature is the next improvement.' } },
          { diagram: { kind: 'bars', labels: ['W1 model', 'W1 naive', 'W2 model', 'W2 naive', 'W3 model', 'W3 naive', 'W4 model', 'W4 naive'], values: [12, 18, 9, 16, 15, 21, 11, 17], highlight: 4, yLabel: 'WAPE (%)', caption: 'Backtest results by window. The model wins every time, but window 3 is worst for both, pointing to a shared cause (festival timing) rather than a model fault. Looking at windows separately reveals what an average hides.' } },
        ],
      },
      {
        heading: 'Choosing metrics and hunting for leakage',
        blocks: [
          { p: '**Choose the metric that matches the decision.** Production planning across many SKUs: WAPE plus bias. Comparing products of very different sizes: MASE. When a big miss is a disaster (hospital beds, power): RMSE or high quantiles. Avoid MAPE when any actuals are small or zero.' },
          { p: '**Hunt for leakage like an auditor.** Leakage rarely looks like cheating; it hides in feature engineering.' },
          { bullets: [
            '**Centred rolling windows.** A 7-day rolling mean centred on today uses the next three days. Use trailing windows only (`rolling(7)` on data shifted by the horizon).',
            '**Revised data.** Economic figures and sales ledgers are often corrected later. Train on values "as known at the time" if you can.',
            '**External forecasts versus actuals.** Using actual temperature as an input is leakage if, in production, you will only have a weather forecast.',
            '**Tuning on the test set.** Choosing parameters by looking at backtest results, then reporting those same results, overstates accuracy. Keep a final hold-out period untouched.',
            '**Scaling on all data.** Fitting a scaler or decomposition on the full history leaks future information into the past.',
          ] },
          { callout: 'A useful test: for every input, ask "Would I have known this value, exactly, at the moment I needed to make the forecast?" If not, it is leakage.', tone: 'key' },
        ],
      },
      {
        heading: 'Validation in the real world',
        blocks: [
          { case: { title: 'Rolling out a new demand model at a consumer-goods firm (illustrative)', story: 'A data team builds a gradient-boosting model to replace the spreadsheet forecasts used by planners. Before any meeting with leadership, they run a backtest over 24 monthly origins at the 1, 2 and 3-month horizons that drive production. They score WAPE and bias against two baselines: seasonal naive and the planners\' historical forecasts. The model wins on WAPE at all horizons but shows a consistent under-forecast for newly launched products, which the planners had handled well. The final process combines both: model forecasts for established products, planner judgement for launches. Because the backtest mirrored real use, accuracy after go-live stays within a point or two of the backtest figure.' } },
          { p: 'Forecasting competitions follow the same principles. The well-known M5 competition (2020), built on Walmart sales data, scored entries on a hidden future period using a scaled error metric related to MASE, precisely so that products of different sizes could be compared fairly.' },
          { bullets: [
            '**Retail and FMCG:** weekly WAPE and bias by category, reviewed in sales-and-operations planning meetings.',
            '**Energy:** day-ahead load forecasts backtested across seasons; errors at peak hours weighted most.',
            '**Finance:** walk-forward testing of trading and risk models, the same idea under another name.',
            '**Automotive:** parts demand backtested by horizon to set supplier lead-time buffers.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and good habits',
        blocks: [
          { bullets: [
            '**Random k-fold on time series.** The classic error. Use time-ordered splits.',
            '**One lucky test window.** Always use several origins and report the spread.',
            '**No baseline.** "12% WAPE" is meaningless until you know seasonal naive scores 18% (good) or 10% (bad).',
            '**Wrong horizon.** A model scored on 1-step forecasts may be poor at 3 months ahead, which is what the factory needs.',
            '**Optimising one metric blindly.** A model with the best MAE can still be biased low. Track bias alongside accuracy.',
            '**Forgetting to monitor after go-live.** Patterns drift. Keep scoring forecasts against actuals every period and alert when error rises.',
          ] },
          { callout: 'The goal of validation is not a flattering number. It is an honest estimate of how wrong the forecast will be, so the business can plan around that uncertainty with safety stock, flexible staffing or prediction intervals.', tone: 'key' },
        ],
      },
    ],
    faq: [
      { q: 'Can I ever use ordinary cross-validation for time series?', a: 'Rarely. For pure autoregressive models with no leakage some research shows it can work, but the safe default is a time-ordered, rolling-origin backtest. It is what reviewers and clients expect.' },
      { q: 'How many backtest windows do I need?', a: 'Enough to cover at least one full season, so every month or festival period appears in a test set. For monthly data, 6 to 12 origins is common; for weekly data, more.' },
      { q: 'Which single metric should I report to management?', a: 'For volume planning, WAPE plus bias is usually clearest ("we miss total volume by 11%, with no systematic under-forecast"). Always show the baseline next to it.' },
      { q: 'What is a good WAPE?', a: 'It depends entirely on the series. Aggregate national monthly sales may reach 5%; a single SKU in a single store, weekly, may be 40% and still be good. Judge it against the baseline and against what the decision needs.' },
      { q: 'What does a MASE of 1.2 mean?', a: 'The model\'s average error is 20% larger than a naive forecast\'s typical error on the history. In plain words: the simple "same as last time" rule would do better.' },
      { q: 'What is the gap parameter in TimeSeriesSplit for?', a: 'It leaves periods out between training and test. Use it when, in real life, data arrives with a delay (for example, last week\'s sales are only final on Wednesday) or when features use recent lags that would otherwise overlap the test period.' },
    ],
  },
};
