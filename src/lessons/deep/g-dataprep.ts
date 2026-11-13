import { DeepLesson } from './types';

// PYTHON & DATA PREPARATION group: numpy, pandas, plotting, ml-overview, data-cleaning, feature-engineering, scaling.
export const DATAPREP_DEEP: Record<string, DeepLesson> = {
  numpy: {
    minutes: 19,
    hook: 'A pricing analyst has one million product prices and needs to add 18% GST to every one of them. Written the obvious way, Python visits each price one at a time, like a clerk carrying boxes up the stairs by hand. **NumPy** brings a forklift: one line, `prices * 1.18`, and the whole million moves at once. Almost every data tool you will use later, pandas and scikit-learn included, is built on top of this forklift.',
    sections: [
      {
        heading: 'The problem: Python is flexible, but slow with millions of numbers',
        blocks: [
          { p: 'Python is popular because it is easy to read and write. Its basic container for a collection of things is the **list**: `[40, 120, 75]`. A list can hold anything, numbers, text, even other lists, all mixed together. That flexibility has a price.' },
          { term: 'List', def: 'Python\'s built-in container for an ordered collection of items, written with square brackets. Each item can be of any type, so Python must check every item individually when it works on them.' },
          { p: 'When you ask Python to multiply every item in a list by 1.18, it has to go item by item: "Is this a number? What kind? Fine, multiply it. Next item. Is this a number?..." For three prices nobody notices. For a million rows of sales data, or ten million sensor readings from a factory line, those checks add up to real waiting time.' },
          { term: 'NumPy', def: 'Short for Numerical Python. A free Python library that stores numbers in compact, fixed-type blocks called arrays and performs maths on whole arrays at once, using fast code written in C.' },
          { term: 'Array', def: 'NumPy\'s container: a grid of numbers that all share the same type (all whole numbers, or all decimals). It can be one row (1-D), a table (2-D) or a stack of tables (3-D and beyond).' },
          { p: 'NumPy solves the speed problem with one promise: **every item in an array has the same type**. Because of that promise, NumPy can skip the per-item checks and hand the whole job to pre-compiled, highly optimised code. On a typical laptop, adding GST to a million prices is roughly ten times faster with NumPy than with a list comprehension, and for heavier maths the gap often grows to 50 or 100 times.' },
          { diagram: { kind: 'compare', left: { title: 'Python list', items: ['Can mix numbers, text and objects', 'Each item stored separately in memory', 'Maths needs an explicit loop', 'Slow for millions of numbers', 'Good for small, mixed collections'] }, right: { title: 'NumPy array', items: ['One type for every item (e.g. all decimals)', 'Items packed side by side in one block', 'Maths applies to the whole array at once', 'Fast for millions of numbers', 'Foundation of pandas and scikit-learn'] }, caption: 'The single trade-off that makes NumPy fast: give up mixing types, gain speed and compact storage.' } },
        ],
      },
      {
        heading: 'Building the intuition: the egg tray and the forklift',
        blocks: [
          { p: 'Picture two ways of storing eggs. In the first, every egg sits in its own little box, scattered around a warehouse, each box with a label saying "this is an egg, size large". In the second, the eggs sit in a **tray**: identical slots in neat rows. You know every slot holds one egg of the same size, so you never read labels.' },
          { p: 'A Python list is the scattered boxes. A NumPy array is the egg tray. Because the tray is uniform, you can do things to the whole tray in one go: pick it up with a forklift, wash all eggs at once, stamp all of them with a date.' },
          { steps: [
            '**Uniform slots.** Every number takes exactly the same amount of space, so finding the 500th number is simple arithmetic: start of the tray plus 499 slots.',
            '**No labels to read.** The type is written once, on the tray, not on every egg.',
            '**One instruction for everyone.** "Multiply by 1.18" is given once and applied to every slot by fast machine code.',
            '**Rows and columns.** A tray can have rows and columns, which is exactly what a sales table looks like: stores down the side, weeks across the top.',
          ], title: 'What the tray gives you' },
          { think: { q: 'Why would putting a single word, say "missing", into a NumPy array of prices be a problem?', a: 'The tray promise is that every slot has the same type. A word is not a number, so NumPy would have to switch the whole array to a general "object" type, losing the speed and compactness. NumPy instead uses a special decimal value called NaN ("not a number") to mark missing numbers.' } },
          { callout: 'Think of NumPy as the engine room. You will often drive pandas or scikit-learn instead, but when something is slow or a shape error appears, the explanation is almost always down here in the arrays.', tone: 'key' },
        ],
      },
      {
        heading: 'How you work with arrays, step by step',
        blocks: [
          { diagram: { kind: 'flow', nodes: ['**Create** an array from a list or a file', '**Inspect** its shape and type', '**Compute** with whole-array maths', '**Summarise** along rows or columns', '**Filter** with true/false masks'], caption: 'The everyday NumPy routine. Nearly every analysis is some mix of these five moves.' } },
          { p: '**Step 1: Create.** `import numpy as np` loads the library under its conventional short name. `prices = np.array([40, 120, 75])` turns a list into an array. For a table, pass a list of rows: `np.array([[120, 135], [80, 95]])`.' },
          { p: '**Step 2: Inspect.** Always check `.shape` (how many rows and columns) and `.dtype` (the type of the numbers). Most beginner errors are shape surprises.' },
          { term: 'Shape', def: 'The size of an array along each direction, written as a tuple. (3,) means a single row of 3 numbers; (3, 4) means 3 rows and 4 columns.' },
          { term: 'dtype', def: 'Data type: the one type shared by every item in an array, such as int64 (whole numbers stored in 8 bytes) or float64 (decimals stored in 8 bytes).' },
          { p: '**Step 3: Compute.** Write maths as if the array were one number: `prices * 1.18`, `revenue - cost`, `np.log(sales)`. NumPy applies it to every item. This is called vectorisation.' },
          { term: 'Vectorisation', def: 'Writing an operation once for a whole array instead of looping through items yourself. The loop still happens, but inside NumPy\'s fast compiled code.' },
          { p: '**Step 4: Summarise.** `.sum()`, `.mean()`, `.max()` collapse an array to a single number. Add `axis=0` to summarise down each column, or `axis=1` to summarise across each row.' },
          { p: '**Step 5: Filter.** A comparison such as `prices > 80` gives an array of True/False values, one per item. Putting that inside square brackets keeps only the True items: `prices[prices > 80]`.' },
          { term: 'Boolean mask', def: 'An array of True/False values of the same shape as your data, used to pick out the items where the answer is True. "Boolean" simply means true-or-false.' },
        ],
      },
      {
        heading: 'Under the hood: memory, strides and broadcasting',
        blocks: [
          { p: 'You do not need to know how an engine works to drive, but it helps when the car makes a strange noise. Three ideas explain almost all NumPy behaviour.' },
          { p: '**1. One contiguous block of memory.** An array of a million float64 numbers is a single block of bytes, each number taking exactly 8 bytes, sitting side by side. The size is easy to predict.' },
          { tex: '\\text{bytes} = n \\times \\text{itemsize} = 1{,}000{,}000 \\times 8 = 8{,}000{,}000', plain: 'Memory used equals the number of items times the bytes per item. One million decimals take about 8 MB. A Python list of the same million decimals needs roughly four times as much, because every number is a separate object with its own label plus a pointer to find it.', symbols: [['n', 'number of items in the array'], ['\\text{itemsize}', 'bytes per item: 8 for float64 and int64']] },
          { p: '**2. Shape plus strides.** A 2-D table is still one flat line of bytes in memory. NumPy pretends it is a grid by remembering two **strides**: how many bytes to jump to move one row down, and how many to move one column right.' },
          { tex: '\\text{address}(i, j) = \\text{start} + i \\times s_{\\text{row}} + j \\times s_{\\text{col}}', plain: 'To find the item in row i and column j, start at the beginning and jump i rows and j columns. For a 3 × 4 table of int64 numbers, a row is 4 × 8 = 32 bytes long, so the strides are 32 and 8.', symbols: [['i, j', 'row and column position, counted from 0'], ['s_{\\text{row}}', 'bytes to skip to go down one row'], ['s_{\\text{col}}', 'bytes to skip to go right one column']] },
          { p: 'This is why transposing a table (`S.T`, swapping rows and columns) or taking a slice (`S[:, 1:3]`) is instant: NumPy only changes the strides and the start, without copying a single number. Such a result is called a **view**. It also explains a classic surprise: changing a view changes the original array too.' },
          { term: 'View', def: 'A new array object that looks at the same memory as an existing array. Edits through the view change the original. Use `.copy()` when you need an independent array.' },
          { p: '**3. Broadcasting.** Suppose you have a table of units sold (3 stores × 3 products) and one row of 3 prices. `units * prices` works even though the shapes differ: NumPy stretches the price row down all three store rows, without making copies in memory.' },
          { term: 'Broadcasting', def: 'NumPy\'s rule for combining arrays of different shapes. Compare shapes from the right; two sizes are compatible if they are equal or one of them is 1. Size-1 directions are stretched to match.' },
          { tex: '(3, 3) \\;\\text{with}\\; (3,) \\;\\to\\; (3, 3) \\qquad (3, 1) \\;\\text{with}\\; (1, 4) \\;\\to\\; (3, 4)', plain: 'A row of 3 prices combines with a 3 × 3 table by being reused for every row. A column of 3 numbers combined with a row of 4 numbers produces a full 3 × 4 grid of every pairing.' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Add GST and find expensive items', setup: 'Three product prices in rupees: 40, 120 and 75. Add 18% GST, then keep only items above ₹80.', steps: [
            '`prices = np.array([40, 120, 75])` creates an array of shape (3,).',
            '`with_gst = prices * 1.18` gives 40 × 1.18 = 47.2, 120 × 1.18 = 141.6, 75 × 1.18 = 88.5.',
            '`mask = with_gst > 80` gives [False, True, True].',
            '`with_gst[mask]` keeps the True positions: [141.6, 88.5].',
          ], result: 'Two lines, no loop, and the identical code works for a million prices.' } },
          { diagram: { kind: 'table', head: ['Store', 'Week 1', 'Week 2', 'Week 3', 'Week 4', 'Row sum (axis=1)'], rows: [['Chennai', '120', '135', '150', '140', '545'], ['Pune', '80', '95', '90', '100', '365'], ['Kochi', '60', '55', '70', '65', '250'], ['Column sum (axis=0)', '260', '285', '310', '305', '1160']], caption: 'A 3 × 4 array of units sold. `axis=1` collapses across the columns, giving one total per store. `axis=0` collapses down the rows, giving one total per week. The grand total is 1,160 either way.' } },
          { example: { title: 'Weekly sales: summarising along an axis', setup: 'A tea distributor records units sold in three stores over four weeks (the table above). `S = np.array([[120, 135, 150, 140], [80, 95, 90, 100], [60, 55, 70, 65]])`.', steps: [
            '`S.shape` is (3, 4): 3 rows (stores), 4 columns (weeks).',
            '`S.sum(axis=1)` adds across each row: Chennai 120 + 135 + 150 + 140 = 545; Pune 365; Kochi 250.',
            '`S.sum(axis=0)` adds down each column: Week 1 = 120 + 80 + 60 = 260; then 285, 310, 305.',
            '`S.mean(axis=1)` gives average weekly units per store: 545 / 4 = 136.25, 365 / 4 = 91.25, 250 / 4 = 62.5.',
            '`S.argmax(axis=1)` gives the position of each store\'s best week: [2, 3, 2], meaning Week 3, Week 4 and Week 3 (positions count from 0).',
          ], result: 'One array, one line per question. The trick is remembering that the axis you name is the one that disappears.' } },
          { diagram: { kind: 'bars', labels: ['Chennai', 'Pune', 'Kochi'], values: [545, 365, 250], highlight: 0, yLabel: 'units in 4 weeks', caption: 'The result of `S.sum(axis=1)`. Chennai sells more than twice as many units as Kochi over the same four weeks.' } },
          { example: { title: 'Broadcasting: revenue for every store and product', setup: 'Units sold (rows = 3 stores, columns = tea, coffee, biscuits): [[10, 4, 20], [6, 8, 15], [12, 2, 30]]. Prices per unit: ₹50, ₹120, ₹30.', steps: [
            '`units` has shape (3, 3); `prices = np.array([50, 120, 30])` has shape (3,). Compare from the right: 3 and 3 match, so broadcasting applies.',
            'Store 1: 10 × 50 = 500, 4 × 120 = 480, 20 × 30 = 600.',
            'Store 2: 6 × 50 = 300, 8 × 120 = 960, 15 × 30 = 450.',
            'Store 3: 12 × 50 = 600, 2 × 120 = 240, 30 × 30 = 900.',
            '`(units * prices).sum(axis=1)` gives store revenues ₹1,580, ₹1,710 and ₹1,740; the grand total is ₹5,030.',
          ], result: 'The price row was reused for every store automatically. In a loop you would have written two nested loops and nine multiplications.' } },
        ],
      },
      {
        heading: 'Shapes and axes: where most errors come from',
        blocks: [
          { p: 'The most common NumPy error message is some version of "operands could not be broadcast together with shapes...". It almost always means you and NumPy disagree about the shape of something.' },
          { bullets: [
            '**(3,) is not (3, 1).** `np.array([1, 2, 3])` has shape (3,): a flat line with one axis. `np.array([[1], [2], [3]])` has shape (3, 1): a column with two axes. scikit-learn expects features as a 2-D table, which is why you often see `x.reshape(-1, 1)`, meaning "make this a single column, work out the number of rows yourself".',
            '**The named axis disappears.** For a table of shape (rows, columns), `axis=0` summarises down the rows and leaves one value per column; `axis=1` summarises across the columns and leaves one value per row.',
            '**Read shapes from the right when broadcasting.** (1000, 5) with (5,) works: one value per column. (1000, 5) with (1000,) fails, because 5 and 1000 do not match; reshape to (1000, 1) to apply one value per row.',
          ] },
          { diagram: { kind: 'table', head: ['Shape A', 'Shape B', 'Result', 'Why'], rows: [['(3, 3)', '(3,)', '(3, 3)', 'Row reused for every row'], ['(3, 1)', '(1, 4)', '(3, 4)', 'Both size-1 axes stretch'], ['(1000, 5)', '(5,)', '(1000, 5)', 'One value per column'], ['(1000, 5)', '(1000,)', 'Error', '5 and 1000 do not match'], ['(1000, 5)', '(1000, 1)', '(1000, 5)', 'One value per row']], caption: 'Broadcasting at a glance. Line up the shapes on the right; each pair must be equal or contain a 1.' } },
          { think: { q: 'You have a (1000, 5) array X and want to subtract each column\'s average from that column. Which axis do you average over, and will the subtraction broadcast?', a: '`X.mean(axis=0)` averages down the rows and returns shape (5,), one mean per column. Then `X - X.mean(axis=0)` broadcasts (1000, 5) with (5,), subtracting the right mean from every row. This "centering" is the first half of standardisation.' } },
        ],
      },
      {
        heading: 'NumPy in the real world',
        blocks: [
          { case: { title: 'Vibration monitoring on a stamping press (illustrative)', story: 'An automotive supplier fits an accelerometer to a sheet-metal press that samples vibration 10,000 times per second. One eight-hour shift produces 288 million readings. The engineering team loads each minute of data into a NumPy array of shape (600,000,), reshapes it to (600, 1000) so each row is one tenth of a second, and computes `np.sqrt((X ** 2).mean(axis=1))`, the root-mean-square vibration for every row, in a fraction of a second. A boolean mask flags rows above a threshold, and those time stamps are sent to maintenance. Previously, slow loops meant only samples were checked; now every second of every shift is.' } },
          { bullets: [
            '**pandas:** every numeric pandas column is a NumPy array underneath, which is why `df["price"] * 1.18` is fast.',
            '**scikit-learn:** models take a 2-D feature array X of shape (samples, features) and a 1-D target y.',
            '**Finance:** daily returns of 500 stocks over 10 years form a (2520, 500) array; portfolio returns are one matrix multiplication, `returns @ weights`.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Writing loops anyway.** If you see `for i in range(len(arr))`, there is usually a vectorised version that is shorter and faster.',
            '**Missing values spread.** Any calculation involving NaN gives NaN: the mean of [1, 2, NaN] is NaN. Use `np.nanmean`, `np.nansum` and friends, or handle missing values first.',
            '**Views changing your original.** `sub = S[:, :2]; sub[0, 0] = 0` also changes S. Call `.copy()` when in doubt.',
            '**Integer surprises.** An array created from whole numbers has an integer dtype. Assigning 2.7 into it stores 2. Create it with `dtype=float` if decimals will appear.',
            '**Decimal rounding.** `0.1 + 0.2` gives 0.30000000000000004, in NumPy and in plain Python. Compare decimals with `np.isclose`, never with `==`.',
            '**No column names.** A NumPy table only knows positions. Mixing up column 3 and column 4 is easy. For labelled business tables, use pandas.',
          ] },
          { callout: 'Rule of thumb: use NumPy for pure numeric grids (images, sensor streams, simulations, model inputs) and pandas for business tables with names, dates and text. Under the bonnet, pandas is using NumPy anyway.', tone: 'key' },
        ],
      },
    ],
    faq: [
      { q: 'Do I need NumPy if I am going to use pandas anyway?', a: 'You will use it less directly, but you need the ideas: shapes, vectorisation, masks and NaN all come from NumPy. scikit-learn also returns NumPy arrays, so you will meet them constantly.' },
      { q: 'Why is it called "np"?', a: 'Only a convention. `import numpy as np` saves typing, and because everybody uses it, examples you find online will match your code.' },
      { q: 'What is the difference between a 1-D array and a list?', a: 'They look alike when printed, but the array has one fixed type, a compact memory layout and supports whole-array maths. `[1, 2] * 2` repeats a list to [1, 2, 1, 2]; `np.array([1, 2]) * 2` doubles it to [2, 4].' },
      { q: 'What does reshape(-1, 1) mean?', a: 'Turn the data into one column and let NumPy work out how many rows that needs (the -1). It converts shape (n,) into (n, 1), which scikit-learn expects for a single feature.' },
      { q: 'Is NumPy only for scientists?', a: 'No. Any work with lots of numbers benefits: pricing, forecasting, risk simulation, quality control. Most business users meet it through pandas.' },
      { q: 'How big an array can I handle?', a: 'As large as your computer\'s memory allows. Estimate it as items × 8 bytes for float64: 100 million decimals need about 800 MB. Beyond that, use float32, process in chunks, or switch to Dask or Spark.' },
    ],
  },

  pandas: {
    minutes: 15,
    hook: 'Every Monday, a regional sales manager opens last week\'s order export in Excel, deletes the junk rows, adds a revenue column, builds a pivot table by city and pastes the result into an email. It takes two hours, and if a number looks wrong nobody can retrace exactly what was clicked. **pandas** does the same work in ten lines of Python that run again next Monday in two seconds, and every step is written down for anyone to check.',
    sections: [
      {
        heading: 'The problem: spreadsheets do not scale or remember',
        blocks: [
          { p: 'Spreadsheets are wonderful for looking at a few thousand rows. They struggle when files reach millions of rows, when the same cleaning must be repeated every week, or when an auditor asks, "How exactly did you get this number?" Clicks leave no trail.' },
          { term: 'pandas', def: 'A free Python library for working with tables of data: loading files, filtering rows, adding columns, grouping, joining and reshaping. Its name comes from "panel data", an economics term for tables observed over time.' },
          { term: 'DataFrame', def: 'pandas\' name for a table: rows and named columns, where each column has one data type (numbers, text, dates). Think of one Excel sheet with tidy headers.' },
          { term: 'Series', def: 'A single column of a DataFrame: a list of values plus a label for each row. Selecting `df["price"]` gives you a Series.' },
          { p: 'pandas gives you the familiar spreadsheet ideas, filters, formulas, pivot tables and VLOOKUPs, as short commands. Because they are commands in a script, they can be rerun on next week\'s file, reviewed by a colleague, and scaled to tens of millions of rows on an ordinary laptop.' },
          { diagram: { kind: 'table', head: ['Excel habit', 'pandas command', 'What it does'], rows: [['Open a file', '`pd.read_csv("orders.csv")`', 'Load the table'], ['Look at the top', '`df.head()`', 'First 5 rows'], ['AutoFilter', '`df[df["city"] == "Chennai"]`', 'Keep matching rows'], ['New formula column', '`df["revenue"] = df.units * df.price`', 'Row-by-row calculation'], ['Pivot table', '`df.groupby("city")["revenue"].sum()`', 'Summarise by group'], ['VLOOKUP', '`df.merge(targets, on="city")`', 'Bring in columns from another table']], caption: 'If you know Excel, you already know what pandas does. Only the way you ask changes, and every request is recorded.' } },
        ],
      },
      {
        heading: 'Building the intuition: Excel with a memory',
        blocks: [
          { p: 'Imagine an assistant who does exactly what you ask in a spreadsheet, but writes every instruction in a notebook: "Open the orders file. Remove rows where units is blank. Add revenue = units × price. Total revenue by city." Next week you hand them a new file and the same notebook. They repeat everything perfectly, in seconds.' },
          { p: 'That notebook is your pandas script. Three habits make the assistant reliable:' },
          { steps: [
            '**Columns have one type.** A "units" column holds numbers only. If someone typed "ten" in one cell, pandas will treat the whole column as text until you fix it, which is a useful warning.',
            '**Every row has a label.** pandas keeps an **index** (by default 0, 1, 2 ...) so it can line rows up correctly when tables are combined.',
            '**Most operations return a new table.** Filtering does not delete rows from the original; it hands you a filtered copy. Your raw data stays safe.',
          ], title: 'How the assistant thinks' },
          { term: 'Index', def: 'The row labels of a DataFrame. They can be plain numbers, dates or IDs. pandas uses them to match rows when combining tables or doing arithmetic between columns.' },
          { think: { q: 'Your colleague says, "I filtered the DataFrame to Chennai, but the original still has all cities. Is pandas broken?"', a: 'No. Filtering returns a new DataFrame. To keep it, assign it: `chennai = df[df["city"] == "Chennai"]`. The original is untouched by design, so you can never lose raw data by accident.' } },
        ],
      },
      {
        heading: 'How a pandas analysis works, step by step',
        blocks: [
          { diagram: { kind: 'flow', nodes: ['**Load** a file into a DataFrame', '**Inspect** with head, info, describe', '**Clean and filter** rows and columns', '**Create** new columns', '**Group, join, reshape** and report'], caption: 'The shape of almost every pandas analysis. Inspection comes before anything else.' } },
          { p: '**Step 1: Load.** `import pandas as pd` then `df = pd.read_csv("orders.csv")`. There are matching functions for Excel (`read_excel`), databases (`read_sql`) and Parquet files.' },
          { p: '**Step 2: Inspect.** Run three commands every time. `df.head()` shows the first rows. `df.info()` lists every column, its type and how many values are not missing. `df.describe()` gives count, mean, standard deviation, minimum, quartiles and maximum for numeric columns.' },
          { p: '**Step 3: Clean and filter.** Select columns with `df[["city", "units"]]`. Keep rows with a condition, `df[df["units"] > 5]`. For conditions plus assignment, use `.loc`: `df.loc[df["units"] < 0, "units"] = 0`.' },
          { term: '.loc', def: 'pandas\' main tool for selecting by label: `df.loc[rows, columns]`. The rows part can be a True/False condition. Using it for assignment guarantees you change the original table.' },
          { p: '**Step 4: Create columns.** Arithmetic on columns is vectorised, exactly like NumPy: `df["revenue"] = df["units"] * df["price"]` computes every row at once.' },
          { p: '**Step 5: Group, join, reshape.** `groupby` summarises by category, `merge` combines tables on a shared key, and `pivot_table` turns long lists into cross-tables. These three cover most reporting work.' },
        ],
      },
      {
        heading: 'Under the hood: columns, alignment and split-apply-combine',
        blocks: [
          { p: '**Columns are NumPy arrays.** A DataFrame is essentially a set of NumPy arrays, one per column, sharing one index. That is why column arithmetic is fast and why each column must have one type. A column that mixes numbers and text falls back to the slow "object" type, which `df.info()` will reveal.' },
          { p: '**Alignment by label.** When you add two Series, pandas matches rows by their index labels, not by position. If a label exists in only one of them, the result for that label is NaN (missing). This protects you from silently adding Chennai\'s numbers to Pune\'s, but surprises people who expect position-by-position maths.' },
          { p: '**Split-apply-combine.** This is the idea behind `groupby`, and behind every pivot table you have ever made.' },
          { term: 'Split-apply-combine', def: 'A three-step pattern: split the rows into groups by a key (such as city), apply a calculation to each group separately (sum, mean, count), then combine the results into one new table with one row per group.' },
          { tex: '\\bar{x}_g = \\frac{1}{n_g} \\sum_{i \\,:\\, \\text{group}(i) = g} x_i', plain: 'The mean for group g adds up the values of only those rows that belong to g, then divides by how many such rows there are. `groupby("city")["revenue"].mean()` computes this once per city.', symbols: [['\\bar{x}_g', 'the mean of group g'], ['n_g', 'number of rows in group g'], ['x_i', 'the value in row i']] },
          { p: 'Internally, pandas does not physically cut your table into pieces. It computes a group number for each row, then runs one fast pass that accumulates sums and counts per group. That is why a groupby on ten million rows usually finishes in about a second.' },
          { term: 'Join (merge)', def: 'Combining two tables by matching values in a shared column, called the key. A left join keeps every row of the left table and fills in matches from the right, like VLOOKUP.' },
          { callout: 'Before any join, check that the key is unique on the lookup side. If the targets table lists Chennai twice, every Chennai order is duplicated after the merge and your revenue doubles without warning. `merge(..., validate="many_to_one")` makes pandas check this for you.', tone: 'warn' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { diagram: { kind: 'table', head: ['order_id', 'city', 'product', 'units', 'price', 'revenue'], rows: [['1', 'Chennai', 'Tea', '10', '50', '500'], ['2', 'Pune', 'Coffee', '4', '120', '480'], ['3', 'Chennai', 'Coffee', '6', '120', '720'], ['4', 'Kochi', 'Tea', '12', '50', '600'], ['5', 'Pune', 'Tea', '8', '50', '400'], ['6', 'Chennai', 'Tea', '5', '50', '250']], caption: 'Six orders from a beverage distributor (illustrative). The revenue column was created with one line, `df["revenue"] = df.units * df.price`.' } },
          { example: { title: 'Filter and create a column', setup: 'Load the six orders above (without the revenue column). Add revenue and find Chennai orders.', steps: [
            '`df["revenue"] = df["units"] * df["price"]` computes 10 × 50 = 500, 4 × 120 = 480, 6 × 120 = 720, 12 × 50 = 600, 8 × 50 = 400 and 5 × 50 = 250.',
            '`df["revenue"].sum()` = 2,950 in total.',
            '`df[df["city"] == "Chennai"]` keeps orders 1, 3 and 6.',
            'Their revenues are 500 + 720 + 250 = ₹1,470.',
          ], result: 'Two lines replaced a formula column and an AutoFilter, and they will work identically on next week\'s file of 60,000 orders.' } },
          { example: { title: 'Split-apply-combine by city', setup: 'Find total revenue, average order value and number of orders per city.', steps: [
            'Split by city: Chennai {500, 720, 250}, Kochi {600}, Pune {480, 400}.',
            'Apply sum: 1,470, 600, 880. Apply mean: 1,470 / 3 = 490; 600 / 1 = 600; 880 / 2 = 440. Apply count: 3, 1, 2.',
            'Combine: `df.groupby("city")["revenue"].agg(["sum", "mean", "count"])` returns one row per city, sorted alphabetically: Chennai, Kochi, Pune.',
          ], result: 'Kochi has the highest average order (₹600) but only one order, so that average deserves little trust. Always show the count next to a mean.' } },
          { diagram: { kind: 'bars', labels: ['Chennai', 'Kochi', 'Pune'], values: [1470, 600, 880], highlight: 0, yLabel: 'revenue (₹)', caption: 'Total revenue by city from the groupby. Chennai leads, but the next example asks the more useful business question: how does each city compare with its target?' } },
          { example: { title: 'Joining targets: the VLOOKUP replacement', setup: 'A second table holds monthly targets: Chennai ₹1,500, Pune ₹800, Kochi ₹700. Compute achievement percentage per city.', steps: [
            '`totals = df.groupby("city", as_index=False)["revenue"].sum()` gives a small table with columns city and revenue.',
            '`report = totals.merge(targets, on="city", validate="one_to_one")` attaches each city\'s target.',
            '`report["pct"] = (report.revenue / report.target * 100).round(1)`.',
            'Chennai: 1,470 / 1,500 × 100 = 98.0%. Kochi: 600 / 700 × 100 = 85.7%. Pune: 880 / 800 × 100 = 110.0%.',
          ], result: 'The city with the lowest revenue, Pune, is the only one that beat its target. Joining context onto raw totals often reverses the story.' } },
        ],
      },
      {
        heading: 'Reading what pandas tells you',
        blocks: [
          { p: 'pandas is chatty, and its output is full of clues. Learning to read three outputs saves hours.' },
          { bullets: [
            '**df.info()**: if "Non-Null Count" is lower than the number of rows, that column has missing values. If a numeric-looking column shows type `object`, some cells contain text (often "N/A", a comma in "1,200", or a stray space).',
            '**df.describe()**: compare mean and median (the 50% row). A mean far above the median signals a few very large values. A minimum of -1 for "units" or a maximum of 999 for "age" signals data-entry codes or errors.',
            '**value_counts()**: `df["city"].value_counts()` lists every category and its frequency. "Chennai", "chennai" and "Chennai " appearing separately tell you text needs tidying before any groupby.',
            '**SettingWithCopyWarning**: this warning means you tried to assign into something that might be a temporary copy, as in `df[df.units > 5]["price"] = 0`. Rewrite it as `df.loc[df.units > 5, "price"] = 0`.',
          ] },
          { think: { q: 'Two cities both have an average flat price of ₹70 lakh: Chennai from 60 and 80, Pune from 50, 70 and 90. Are the markets the same?', a: 'No. `agg(["mean", "std", "count"])` shows Chennai has a standard deviation of about 14.1 lakh over 2 flats, Pune 20.0 lakh over 3. Same centre, different spread and sample size. A single mean hides both.' } },
        ],
      },
      {
        heading: 'pandas in the real world',
        blocks: [
          { case: { title: 'Automating a weekly dealer report (illustrative)', story: 'A two-wheeler manufacturer receives weekly sales files from 400 dealers in slightly different formats. An analyst used to spend most of Monday merging them by hand. A 60-line pandas script now reads every file in the folder with `read_excel`, standardises column names, fixes dealer codes with `str.strip().str.upper()`, removes duplicate invoices with `drop_duplicates`, joins a dealer master table for region and target, and writes a pivot of units by region and model to a new workbook. The report is ready by 9 a.m., and when a regional head questions a number, the analyst can point to the exact line of code that produced it.' } },
          { bullets: [
            '**Finance:** reconciling ledger extracts between two systems with `merge(..., indicator=True)` to find rows present in only one.',
            '**Retail:** turning raw till transactions into customer-level features (visits, average basket, days since last visit) with groupby.',
            '**Operations:** resampling machine logs from per-second to per-hour averages with `resample("h").mean()` on a date index.',
            '**Machine learning:** nearly every scikit-learn project starts by preparing features in a DataFrame.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Chained assignment.** `df[cond]["col"] = value` may change a temporary copy and nothing else. Always use `.loc[cond, "col"]`.',
            '**Duplicated join keys.** An unexpected many-to-many merge multiplies rows. Check row counts before and after every merge.',
            '**Numbers stored as text.** "1,200" sorts and sums as text. Convert with `pd.to_numeric(df["units"].str.replace(",", ""), errors="coerce")`.',
            '**Dates stored as text.** Convert with `pd.to_datetime` before sorting or computing durations, or "10/02" may be read as October instead of February.',
            '**Looping over rows.** `for i, row in df.iterrows()` is slow. Vectorised column maths or groupby is nearly always possible.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'pandas is a great fit when…', items: ['Data fits in your computer\'s memory (up to a few GB)', 'You need repeatable cleaning and reporting', 'Tables have named columns, dates and text', 'You are preparing features for scikit-learn'] }, right: { title: 'Consider something else when…', items: ['Data is tens of GB or more → **PySpark** or Databricks', 'You need faster single-machine speed → **Polars** or DuckDB', 'Data lives in a warehouse → push work into **SQL** first', 'Pure numeric grids → plain **NumPy**'] }, caption: 'pandas is the everyday workhorse. Bigger data needs tools that share its ideas but spread the work.' } },
          { callout: 'The habit that matters most: after every step, check the row count and look at a few rows. Most pandas bugs are silent; they produce a table that looks fine and is wrong.', tone: 'key' },
        ],
      },
    ],
    faq: [
      { q: 'Is pandas a replacement for Excel?', a: 'For repeated, large or auditable work, yes. For quick looks and sharing with non-technical colleagues, Excel is still handy. Many teams prepare data in pandas and export to Excel with `df.to_excel()`.' },
      { q: 'What is the difference between df["col"] and df[["col"]]?', a: 'Single brackets return a Series (one column). Double brackets, a list of names inside, return a DataFrame, even if the list has only one name. scikit-learn usually wants the DataFrame form for features.' },
      { q: 'What does NaN mean?', a: '"Not a Number": pandas\' marker for a missing value. Most summaries skip it by default (`mean()` ignores NaN), but arithmetic between columns produces NaN wherever either side is missing.' },
      { q: 'Why does groupby return the cities in alphabetical order?', a: 'By default `groupby` sorts the keys. Pass `sort=False` to keep the order of first appearance, or sort the result by a value with `sort_values`.' },
      { q: 'How large a file can pandas handle?', a: 'A useful rule is that pandas needs several times the file\'s size in memory. A 1 GB CSV is fine on a 16 GB laptop; 30 GB is not. Read only the columns you need with `usecols`, or move to Polars, DuckDB or PySpark.' },
      { q: 'Should I use inplace=True?', a: 'Generally no. It rarely saves memory and makes code harder to follow. Assign the result instead: `df = df.drop_duplicates()`.' },
    ],
  },

  plotting: {
    minutes: 17,
    hook: 'In 1973 the statistician Francis Anscombe published four small datasets. All four have the same averages, the same spread, the same correlation and the same best-fit line. Printed as summary statistics they are identical; drawn as pictures they could not be more different. Before a surgeon operates, they look at the X-ray. Before you model data, you plot it. That habit is called **exploratory data analysis**.',
    sections: [
      {
        heading: 'The problem: numbers alone can lie to you',
        blocks: [
          { p: 'A summary statistic squeezes many values into one number. That is useful, but squeezing throws information away. An average delivery time of 34 minutes could mean everyone waits about 34 minutes, or that most wait 30 and a few wait over an hour. These are different businesses with different problems.' },
          { term: 'Exploratory data analysis (EDA)', def: 'Looking at data, mostly through charts and simple summaries, before building any model, to understand its shape, spot errors and form questions worth testing.' },
          { p: 'Anscombe\'s quartet makes the point unforgettable. In each of his four datasets, x has mean 9 and variance 11, y has mean 7.50 and variance about 4.12, the correlation is about 0.816 and the best-fit line is y = 3.00 + 0.500x. Yet one dataset is a cloud around a line, one is a smooth curve, one is a perfect line with a single outlier, and one is a vertical stack with one far-away point that creates the entire "trend".' },
          { diagram: { kind: 'scatter', xLabel: 'x', yLabel: 'y', line: { m: 0.5, b: 3 }, caption: 'Two of Anscombe\'s four datasets drawn together, with the best-fit line y = 3 + 0.5x that they share. Points from dataset I (blue) scatter loosely around the line; points from dataset II (red) follow a clear curve that a straight line describes badly. Identical statistics, different stories.', points: [[10, 8.04, 0], [8, 6.95, 0], [13, 7.58, 0], [9, 8.81, 0], [11, 8.33, 0], [14, 9.96, 0], [6, 7.24, 0], [4, 4.26, 0], [12, 10.84, 0], [7, 4.82, 0], [5, 5.68, 0], [10, 9.14, 1], [8, 8.14, 1], [13, 8.74, 1], [9, 8.77, 1], [11, 9.26, 1], [14, 8.1, 1], [6, 6.13, 1], [4, 3.1, 1], [12, 9.13, 1], [7, 7.26, 1], [5, 4.74, 1]] } },
          { p: 'In business, the same trap appears every day: a model trained on data containing a typo, a dashboard average dragged by a few huge orders, a "trend" created by one unusual month. A few minutes of plotting catch most of these.' },
        ],
      },
      {
        heading: 'Building the intuition: the doctor\'s X-ray',
        blocks: [
          { p: 'A good doctor does not prescribe from a single number like body temperature. They look at the patient, order an X-ray, and compare with what healthy looks like. Each test answers a different question.' },
          { steps: [
            '**What does one variable look like on its own?** Like checking one organ: is it normal size, swollen, oddly shaped? This is a **histogram** or box plot.',
            '**How do groups compare?** Like comparing a patient\'s results with others of the same age. This is a box plot or bar chart by category.',
            '**Do two things move together?** Like noticing blood pressure rises with weight. This is a **scatter plot**.',
            '**How does something change over time?** Like a temperature chart through a hospital stay. This is a line chart.',
          ], title: 'Four questions, four kinds of picture' },
          { p: 'EDA is not about pretty pictures for a board meeting. It is fast, rough, private looking: dozens of quick charts, most of which you throw away, until the data has no more surprises for you.' },
          { think: { q: 'A colleague reports, "Average order value rose 12% this quarter." What single chart would you ask to see first, and why?', a: 'A histogram (or box plot) of order values for both quarters. A 12% rise in the mean could come from every order growing slightly or from a handful of very large orders. Only the distribution tells you which, and the business response is completely different.' } },
        ],
      },
      {
        heading: 'How to do EDA, step by step',
        blocks: [
          { diagram: { kind: 'flow', nodes: ['**Profile** the table: rows, types, missing values', '**One variable at a time**: histograms and counts', '**Pairs**: scatter plots and grouped box plots', '**Over time**: line charts of key measures', '**Write down** surprises and questions'], caption: 'A practical EDA routine. Each stage answers a different kind of question, and the last step matters most.' } },
          { p: '**Step 1: Profile.** `df.info()` and `df.describe()` tell you what you are dealing with before you draw anything.' },
          { p: '**Step 2: One variable at a time.** For each numeric column, `df["price"].plot.hist(bins=20)`. For each category, `df["city"].value_counts().plot.bar()`. You are looking for the distribution\'s shape and for impossible values.' },
          { term: 'Distribution', def: 'How the values of a variable are spread out: where most of them sit, how wide the spread is, and whether there are long tails or several peaks.' },
          { term: 'Histogram', def: 'A chart that cuts the range of a number into equal-width intervals, called bins, and draws a bar for how many values fall in each bin. It shows the shape of a distribution.' },
          { p: '**Step 3: Pairs.** Plot the target you care about against each important feature: `df.plot.scatter(x="area", y="price")`. Compare groups with `df.boxplot(column="price", by="city")`. The seaborn library adds one-liners such as `sns.pairplot(df)` that draw every pair at once.' },
          { term: 'Scatter plot', def: 'A chart with one dot per row, placed by two numeric variables: one on the horizontal axis, one on the vertical. It reveals relationships, curves, clusters and outliers.' },
          { p: '**Step 4: Over time.** If there is a date column, plot key measures by week or month. Seasonality, sudden jumps (a system change, a price change) and missing periods jump out immediately.' },
          { p: '**Step 5: Write down what you saw.** "Price has one value at ₹960 lakh", "Kochi has only 12 rows", "sales dropped to zero in the first week of April". These notes drive the cleaning and modelling that follow.' },
        ],
      },
      {
        heading: 'Under the hood: choosing and reading charts',
        blocks: [
          { p: 'The most important skill is matching the chart to the question. The table below covers most EDA needs.' },
          { diagram: { kind: 'table', head: ['Question', 'Data types', 'Chart', 'pandas / seaborn'], rows: [['Shape of one number?', '1 numeric', 'Histogram', '`df.x.plot.hist()`'], ['Outliers, spread?', '1 numeric', 'Box plot', '`df.boxplot(column="x")`'], ['Compare groups?', 'numeric + category', 'Box plot by group', '`sns.boxplot(x="g", y="x", data=df)`'], ['How many per category?', '1 category', 'Bar chart', '`df.g.value_counts().plot.bar()`'], ['Relationship?', '2 numeric', 'Scatter plot', '`df.plot.scatter(x="a", y="b")`'], ['Change over time?', 'date + numeric', 'Line chart', '`df.set_index("date").x.plot()`']], caption: 'Start from the question, then the data types, then the chart. Pie charts are missing on purpose: bar charts compare amounts more accurately.' } },
          { p: '**Reading a box plot.** A box plot is built from quartiles, the values that cut sorted data into four equal parts. The box runs from the first quartile (Q1) to the third (Q3), with a line at the median. The whiskers reach out to the furthest points that are not too far away, and anything beyond is drawn as a separate dot.' },
          { term: 'Quartiles and IQR', def: 'Q1 is the value with 25% of the data below it, the median has 50% below, and Q3 has 75% below. The interquartile range (IQR) is Q3 − Q1: the width of the middle half of the data.' },
          { tex: '\\text{lower fence} = Q_1 - 1.5 \\times \\text{IQR}, \\qquad \\text{upper fence} = Q_3 + 1.5 \\times \\text{IQR}', plain: 'Points beyond these fences are drawn individually as possible outliers. The factor 1.5 is a convention from the statistician John Tukey, and it is matplotlib\'s default: wide enough that normal data rarely crosses it, narrow enough to flag the strange ones.', symbols: [['Q_1, Q_3', 'first and third quartiles'], ['\\text{IQR}', 'interquartile range, Q3 − Q1']] },
          { p: '**Reading a histogram.** The bin width changes what you see. Too few bins hide detail; too many make noise look like structure. Try two or three settings, such as 10, 20 and 50 bins, before concluding anything.' },
          { tex: '\\text{bin width} = \\frac{\\max - \\min}{\\text{number of bins}}', plain: 'Each bin covers an equal slice of the range. With prices from ₹20 lakh to ₹140 lakh and 6 bins, each bin is 20 lakh wide.' },
          { term: 'Skew', def: 'A lopsided distribution. Right-skewed (positive skew) data has a long tail of large values, as with incomes, house prices and order values. In such data the mean sits above the median.' },
          { diagram: { kind: 'curve', fn: 'Math.exp(-Math.pow(Math.log(x), 2) / 0.5) / x', xMin: 0.05, xMax: 5, marks: [{ x: 1, label: 'median' }, { x: 1.13, label: 'mean' }], xLabel: 'order value (₹ thousand)', yLabel: 'share of orders', caption: 'A right-skewed distribution, typical of order values and incomes. The long tail on the right pulls the mean above the median, so "average order" overstates what a typical customer spends.' } },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'A box plot by hand: delivery times', setup: 'Ten food-delivery times in minutes, already sorted: 22, 25, 27, 28, 30, 31, 33, 35, 38, 75.', steps: [
            'Median: the middle of 10 values is the average of the 5th and 6th, (30 + 31) / 2 = 30.5.',
            'Quartiles (NumPy\'s default method, which matches Excel\'s QUARTILE.INC): Q1 = 27.25, Q3 = 34.5.',
            'IQR = 34.5 − 27.25 = 7.25.',
            'Lower fence = 27.25 − 1.5 × 7.25 = 16.375. Upper fence = 34.5 + 1.5 × 7.25 = 45.375.',
            '75 is above 45.375, so it is drawn as an outlier dot. Every other value lies inside the fences.',
            'The mean is 344 / 10 = 34.4 minutes, almost 4 minutes above the median, purely because of that one order.',
          ], result: 'The typical delivery takes about 30 minutes; one delivery took 75. A box plot shows both facts at a glance, while the mean alone blends them into a misleading 34.4.' } },
          { example: { title: 'Building a histogram of flat prices', setup: 'Sixteen flat prices in ₹ lakh: 28, 35, 42, 45, 48, 52, 55, 58, 61, 63, 67, 72, 78, 85, 96, 120. Use 6 bins of width 20 from 20 to 140.', steps: [
            '20 to under 40: 28, 35 → 2 flats.',
            '40 to under 60: 42, 45, 48, 52, 55, 58 → 6 flats.',
            '60 to under 80: 61, 63, 67, 72, 78 → 5 flats.',
            '80 to under 100: 85, 96 → 2 flats. 100 to under 120: none. 120 to 140: 120 → 1 flat.',
            'Mean = 1,005 / 16 ≈ 62.8 lakh; median = (58 + 61) / 2 = 59.5 lakh.',
          ], result: 'Most flats cluster between ₹40 and ₹80 lakh, with a thin tail to the right: a mildly right-skewed market, which is why the mean is above the median.' } },
          { diagram: { kind: 'bars', labels: ['20–40', '40–60', '60–80', '80–100', '100–120', '120–140'], values: [2, 6, 5, 2, 0, 1], highlight: 1, yLabel: 'number of flats', caption: 'The histogram from the example. The peak is ₹40–60 lakh; the empty bin and the lone flat at ₹120 lakh form the right tail. Check that single flat before trusting any average.' } },
          { example: { title: 'Catching a typo before it ruins a model', setup: 'A property portal is building a price model. The price histogram shows almost everything between ₹20 and ₹140 lakh, plus one bar at ₹960 lakh.', steps: [
            'Scatter price against area: the ₹960 lakh flat has only 400 sq ft, while flats of that size elsewhere cost ₹25–35 lakh.',
            'Open the original listing: the agent typed 960 instead of 96.',
            'Effect on a linear regression: a single point that far from the rest pulls the fitted line towards it and distorts every prediction.',
            'Fix the value (or remove the row if the true price cannot be confirmed), then re-plot.',
          ], result: 'Two charts and five minutes protected the model from a single keystroke. This is the most common payoff of EDA.' } },
        ],
      },
      {
        heading: 'Making charts that tell the truth',
        blocks: [
          { p: 'Once EDA turns into charts for other people, a few rules keep them honest and readable.' },
          { bullets: [
            '**Start bar charts at zero.** Bar length encodes the amount. A y-axis starting at 90 makes 95 look twice as big as 92.',
            '**Label axes with units.** "Revenue (₹ lakh)" not "rev". A chart without units invites wrong conclusions.',
            '**Prefer bars to pies.** People compare lengths far more accurately than angles, especially with more than three or four slices.',
            '**Use colour for meaning.** Highlight the one bar that matters; keep the rest grey.',
            '**Show the spread, not only the average.** A box plot or individual dots reveal what a bar of means hides.',
          ] },
          { think: { q: 'A bar chart shows Branch A at 96% customer satisfaction and Branch B at 92%, with the y-axis running from 90% to 100%. B\'s bar looks one third as tall as A\'s. What is wrong?', a: 'The truncated axis exaggerates the gap. Measured from 90, the bars are 6 and 2 units, a 3-to-1 ratio, when the real difference is 4 percentage points. Start the axis at zero or use a dot plot.' } },
        ],
      },
      {
        heading: 'EDA in the real world',
        blocks: [
          { case: { title: 'Warranty claims at a component supplier (illustrative)', story: 'An automotive parts supplier wants to predict warranty claims for a pump. Before modelling, an analyst plots claims per month for each production plant. One plant shows a sharp step up starting in a single month. A histogram of the "hours in service" column reveals a spike at exactly 0 hours: one dealer system recorded unknown values as zero. A scatter of claim cost against vehicle age shows two clear bands, which turn out to be two pump variants that had been merged under one part number. None of these issues would have triggered an error message, and each would have quietly corrupted the model.' } },
          { bullets: [
            '**Retail:** line charts of daily sales reveal festival peaks (Diwali, Onam, Pongal) that a forecasting model must account for.',
            '**Finance:** histograms of transaction amounts show round-number spikes (₹10,000, ₹50,000) that matter for fraud rules.',
            '**HR analytics:** box plots of salary by grade expose outliers and possible pay-equity questions.',
            '**Model checking:** after training, a scatter of predicted against actual values shows where the model fails.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Skipping EDA.** The most common and most expensive mistake. It costs minutes to plot and weeks to debug a model built on bad data.',
            '**Overplotting.** A scatter of a million points becomes a solid blob. Use transparency (`alpha=0.1`), sample the data, or use a hexbin or 2-D density plot.',
            '**Seeing patterns in noise.** Plot enough charts and something will look interesting by chance. Treat EDA findings as questions to test, not conclusions.',
            '**Looking at the test set.** Explore the training data; peeking at test data lets your choices leak into the evaluation.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'Quick EDA tools', items: ['**pandas .plot**: one-line charts from a DataFrame', '**seaborn**: grouped box plots, pair plots, heatmaps', '**matplotlib**: full control, the engine under both'] }, right: { title: 'When you need more', items: ['**Plotly**: interactive, zoomable charts', '**Power BI / Tableau**: shareable dashboards', '**ydata-profiling**: automatic EDA report for a whole table'] }, caption: 'Use the quick tools while exploring; move to interactive or dashboard tools only when the audience is someone else.' } },
          { callout: 'EDA is finished when the data has stopped surprising you, not when you have produced a fixed number of charts.', tone: 'key' },
        ],
      },
    ],
    faq: [
      { q: 'matplotlib, seaborn or pandas plotting: which should I learn?', a: 'Start with pandas `.plot` for speed, add seaborn for grouped and statistical charts, and learn just enough matplotlib to set titles, labels and figure size. All three work together.' },
      { q: 'How many bins should a histogram have?', a: 'There is no single right answer. Defaults (often 10) are a start; try 20 and 50 too. Libraries also offer rules, such as `bins="auto"` in NumPy and matplotlib, which adapts to the data.' },
      { q: 'Is a dot outside the whiskers an error?', a: 'Not necessarily. It is unusual relative to the middle half of the data. It might be a typo, or a real and important case such as a fraud. Investigate before you remove anything.' },
      { q: 'Why not just compute correlations instead of drawing scatter plots?', a: 'Because correlation only measures straight-line relationships and is sensitive to outliers. Anscombe\'s quartet has the same correlation, about 0.816, for a line, a curve and two outlier-driven shapes.' },
      { q: 'How long should EDA take?', a: 'On a new dataset, often a few hours to a day. It feels slow, but it is where you discover the problems that would otherwise surface as a mysteriously bad model weeks later.' },
      { q: 'Can I automate EDA?', a: 'Partly. Profiling tools produce a report with histograms, missing values and correlations for every column. They are a good start, but they cannot judge what is surprising for your business.' },
    ],
  },

  'ml-overview': {
    minutes: 17,
    hook: 'A bank\'s credit team once wrote its loan rules by hand: "approve if salary is above ₹50,000 and no missed payments". The rules grew to hundreds of exceptions, contradicted each other, and still missed obvious risks. Meanwhile the bank had files on a hundred thousand past loans, each showing what the applicant looked like and whether the loan was repaid. **Machine learning** is the idea of letting a computer study those past examples and work out the rules itself.',
    sections: [
      {
        heading: 'The problem: some rules are too complicated to write down',
        blocks: [
          { p: 'Ordinary software follows rules a programmer typed in: if the cart total is above ₹500, delivery is free. That works when the rules are known and few. But try writing rules for "is this email spam?" or "will this customer cancel next month?" Every rule you write has exceptions, and the world keeps changing.' },
          { term: 'Machine learning (ML)', def: 'A way of building software in which the computer learns a pattern from examples instead of being given explicit rules. You supply data with the answers; the algorithm produces the rules.' },
          { p: 'The shift is easiest to see side by side. In traditional programming, **rules plus data produce answers**. In machine learning, **data plus answers produce rules**. Those learned rules are then applied to new data to produce new answers.' },
          { diagram: { kind: 'compare', left: { title: 'Traditional programming', items: ['A person writes the rules', 'Input: rules + data', 'Output: answers', 'Easy to explain, hard to scale to messy problems', 'Example: GST calculation, free-delivery threshold'] }, right: { title: 'Machine learning', items: ['The computer learns the rules from examples', 'Input: data + past answers', 'Output: a model (the learned rules)', 'Handles messy patterns, needs good data', 'Example: spam filter, demand forecast, credit scoring'] }, caption: 'Machine learning flips the direction: instead of writing rules to get answers, you give answers to get rules.' } },
          { p: 'Machine learning is worth the effort when three things are true: the decision is repeated many times, there is a lot of historical data with known outcomes, and the pattern is too complicated or too changeable for hand-written rules. If any one of these is missing, simpler approaches usually win.' },
        ],
      },
      {
        heading: 'Building the intuition: how a new credit officer learns',
        blocks: [
          { p: 'Think about how a new credit officer becomes good at the job. Nobody hands them a perfect rulebook. Instead, a senior colleague sits with them and goes through old files: "This one paid back. This one defaulted. See how her EMIs already ate half her salary?"' },
          { steps: [
            '**Study examples with known outcomes.** Hundreds of past files, each with an applicant description and a final result.',
            '**Notice patterns.** High existing debt relative to income seems to go with defaults; long job tenure seems to go with repayment.',
            '**Form a mental rule.** Not a single "if", but a weighing of many signals together.',
            '**Get tested on new files.** The senior colleague hands over files the trainee has never seen and checks the decisions.',
            '**Keep learning.** As the economy changes, old patterns fade and the officer updates their judgement.',
          ], title: 'From trainee to expert' },
          { p: 'A machine learning project follows the same five steps. The applicant details are **features**, the outcome is the **label**, the trainee\'s judgement is the **model**, studying files is **training**, and deciding on new files is **inference** (or prediction).' },
          { term: 'Feature', def: 'One input piece of information about each example, such as income, age or city. Features are usually arranged as columns in a table, collectively called X.' },
          { term: 'Label (target)', def: 'The answer you want to predict for each example, such as "defaulted: yes or no" or "sale price". Collectively called y.' },
          { term: 'Model', def: 'The learned rule that turns features into a prediction. It can be as simple as a straight line or as complex as a neural network with millions of numbers.' },
          { think: { q: 'Why does the senior colleague test the trainee on files they have never seen, instead of the files they studied?', a: 'Because getting studied files right could just mean remembering them. Only unseen files show whether the trainee learned the pattern. ML does exactly the same with a held-back **test set**.' } },
        ],
      },
      {
        heading: 'How a machine learning project works, step by step',
        blocks: [
          { diagram: { kind: 'flow', nodes: ['**Frame** the question and how success is measured', '**Collect and prepare** data: features and labels', '**Split** into training and test sets', '**Train** models on the training set', '**Evaluate** on the test set, then deploy and monitor'], caption: 'The life of an ML project. Framing and data preparation usually take far more time than training.' } },
          { p: '**Step 1: Frame the problem.** What exactly will be predicted, for whom, when, and what decision will it change? "Predict which customers will cancel their subscription in the next 30 days, so retention can call the top 500 each week" is a usable frame. "Use AI on our customer data" is not.' },
          { p: '**Step 2: Prepare data.** Gather past examples, build features, clean errors and attach the correct label. This is the topic of the next few chapters, and it is where most project time goes.' },
          { p: '**Step 3: Split.** Set aside part of the data, often 20%, as a test set that the model never sees during training.' },
          { p: '**Step 4: Train.** Fit one or more models on the training set. In scikit-learn every model follows the same pattern: `model.fit(X_train, y_train)`.' },
          { term: 'Training', def: 'The process of adjusting a model\'s internal numbers so that its predictions on the training examples come as close as possible to the true labels.' },
          { p: '**Step 5: Evaluate, deploy, monitor.** Score the model on the test set with `model.predict(X_test)` and compare with a simple baseline. If it is good enough, put it into use, and keep checking it, because customer behaviour, prices and products change.' },
          { term: 'Generalisation', def: 'A model\'s ability to make good predictions on new data it has never seen. It is the whole point of ML; doing well on training data alone proves nothing.' },
        ],
      },
      {
        heading: 'The math, explained slowly: learning means reducing error',
        blocks: [
          { p: 'Underneath the jargon, almost every supervised model is a **function** with some adjustable numbers, called parameters. Learning means choosing those numbers so the predictions are as close as possible to the real answers.' },
          { tex: '\\hat{y} = f(x; \\theta)', plain: 'The prediction ŷ ("y-hat") is what the model f produces from the features x, using its current parameter settings θ ("theta"). Different θ values give different predictions.', symbols: [['\\hat{y}', 'the model\'s prediction'], ['x', 'the features of one example'], ['\\theta', 'the model\'s adjustable numbers (parameters)'], ['f', 'the type of model, e.g. a straight line']] },
          { p: 'The simplest example is a straight line for flat prices: predicted price = w × area + b. Here θ is just the two numbers w (slope) and b (intercept). Training is choosing w and b.' },
          { p: 'To choose, we need a score for how wrong a candidate model is. A common choice for numeric targets is the **mean squared error**.' },
          { term: 'Loss function', def: 'A formula that turns the gap between predictions and true answers into a single number measuring "how wrong". Training searches for the parameters that make it smallest.' },
          { tex: '\\text{MSE} = \\frac{1}{n} \\sum_{i=1}^{n} \\left( y_i - \\hat{y}_i \\right)^2', plain: 'For each example, take the error (true value minus prediction), square it, then average over all n examples. Squaring makes every error positive and punishes big misses much more than small ones.', symbols: [['n', 'number of training examples'], ['y_i', 'true answer for example i'], ['\\hat{y}_i', 'model prediction for example i']] },
          { p: 'That is the heart of machine learning: **pick a model shape, pick a loss, search for the parameters with the lowest loss on the training data, then check the result on unseen data.** Different algorithms differ in the model shape (lines, trees, networks) and in how cleverly they search, but the logic is the same.' },
          { callout: 'For classification (yes/no targets), the loss is different, usually log loss, which punishes confident wrong answers, but the idea of "search for the parameters that make the loss smallest" is unchanged.', tone: 'tip' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Framing four business questions', setup: 'A consulting team is asked four questions by a client. Which type of machine learning fits each?', steps: [
            '"What price will this flat sell for?" The answer is a number and past sale prices exist → **supervised regression**.',
            '"Will this customer cancel next month?" The answer is yes/no and past cancellations are recorded → **supervised classification**.',
            '"What natural groups of customers do we have?" There is no answer column at all → **unsupervised clustering**.',
            '"How should the warehouse robot move to pick parts fastest?" It learns by trying moves and receiving rewards → **reinforcement learning**.',
          ], result: 'The type of question decides the family of models, the loss, the metrics and how you validate. Framing comes before any algorithm.' } },
          { example: { title: 'Choosing between two lines by their error', setup: 'Four flats: area (hundreds of sq ft) 8, 10, 12, 15; price (₹ lakh) 52, 61, 70, 83. Compare line A: price = 4 × area + 20, and line B: price = 5 × area + 10.', steps: [
            'Line A predicts 52, 60, 68, 80. Errors: 0, 1, 2, 3. Squared: 0, 1, 4, 9. MSE = 14 / 4 = 3.5.',
            'Line B predicts 50, 60, 70, 85. Errors: 2, 1, 0, −2. Squared: 4, 1, 0, 4. MSE = 9 / 4 = 2.25.',
            'Line B has lower loss, so a learning algorithm would prefer it over line A.',
            'Searching every possible slope and intercept (which linear regression does with a formula) finds price ≈ 4.43 × area + 16.66, with MSE of only about 0.014.',
            'Prediction for a new 1,100 sq ft flat: 4.43 × 11 + 16.66 ≈ ₹65.4 lakh.',
          ], result: 'Training is nothing mysterious: it is a systematic search for the parameters with the smallest error, followed by using them on new cases.' } },
          { diagram: { kind: 'scatter', xLabel: 'area (hundreds of sq ft)', yLabel: 'price (₹ lakh)', line: { m: 4.43, b: 16.66 }, caption: 'The four flats and the best-fit line found by minimising mean squared error. The points lie almost exactly on it, which is why its error is so small.', points: [[8, 52], [10, 61], [12, 70], [15, 83]] } },
          { example: { title: 'Is 85% accuracy good? A churn model (illustrative)', setup: 'A telecom operator tests a churn model on 200 customers it never saw in training. 40 of them actually cancelled (20%). The model gets 170 of the 200 right.', steps: [
            'Accuracy = 170 / 200 = 85%.',
            'Baseline: a "model" that predicts "nobody cancels" is right for the 160 who stayed: 160 / 200 = 80%.',
            'So the real gain over doing nothing is 5 percentage points, not 85.',
            'Look closer: the model flagged 40 customers, of whom 25 truly cancelled, and it missed 15 of the 40 cancellers.',
            'For the retention team, that means calling 40 people to reach 25 real risks, far better than calling at random, where only about 8 of 40 calls would reach a canceller.',
          ], result: 'Always compare with a simple baseline and translate the score into the business action. Accuracy alone hid both the weakness and the value.' } },
        ],
      },
      {
        heading: 'The main types of machine learning',
        blocks: [
          { diagram: { kind: 'tree', root: { label: 'Machine learning', children: [
            { label: 'Supervised (labels)', edge: 'answers known', children: [{ label: 'Regression: number' }, { label: 'Classification: category' }] },
            { label: 'Unsupervised (no labels)', edge: 'find structure', children: [{ label: 'Clustering' }, { label: 'Dimensionality reduction' }] },
            { label: 'Reinforcement', edge: 'trial and reward', children: [{ label: 'Games, robots, bidding' }] },
          ] }, caption: 'The family tree. First ask whether you have labelled answers; then ask whether the answer is a number or a category.' } },
          { term: 'Supervised learning', def: 'Learning from examples that include the correct answer (the label). Regression predicts a number, such as next month\'s demand; classification predicts a category, such as fraud or not fraud.' },
          { term: 'Unsupervised learning', def: 'Finding structure in data that has no answer column, such as grouping customers into segments or compressing 50 columns into a few summary scores.' },
          { term: 'Reinforcement learning', def: 'Learning by acting, receiving rewards or penalties, and gradually preferring actions that earn more reward. Used for game-playing, robotics and some pricing and bidding systems.' },
          { p: 'Most business ML is supervised: forecasting, scoring, classifying. Unsupervised methods are often used earlier, to explore and segment. Reinforcement learning is powerful but needs a safe way to try many actions, so it appears less often in everyday business settings.' },
        ],
      },
      {
        heading: 'Machine learning in the real world',
        blocks: [
          { case: { title: 'The Netflix Prize', story: 'Netflix famously offered a $1 million prize to anyone who could improve its film-recommendation predictions by 10%. Thousands of teams worked on the same dataset of customer ratings, and the prize was awarded in 2009 to a team that blended many different models. The competition popularised ideas still used today, such as matrix factorisation and model ensembles. It also taught a business lesson: Netflix later explained that it did not put the full winning blend into production, because the extra accuracy did not justify the engineering effort. A model is only valuable if the improvement matters for the decision.' } },
          { bullets: [
            '**Retail and FMCG:** forecasting demand per store and product so the right stock reaches shelves.',
            '**Banking:** credit scoring, fraud detection on card transactions, anti-money-laundering alerts.',
            '**Manufacturing and automotive:** predicting machine failures from sensor data, spotting defects in camera images on the line.',
            '**Marketing:** churn prediction, customer segmentation, recommending the next product.',
            '**Language:** chatbots, document search and summarisation use large language models, which are also learned from examples.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Overfitting.** A model that memorises training data, noise included, scores brilliantly in training and poorly on new data. The test set exists to catch this.',
            '**Garbage in, garbage out.** Wrong labels, biased history or missing groups teach the model the wrong lessons. A model trained on past approvals learns past biases too.',
            '**Leakage.** Using information that would not be available at prediction time makes a model look excellent in testing and fail in use.',
            '**No baseline.** Without comparing to a simple rule, you cannot tell whether ML adds anything.',
            '**Forgetting the world changes.** Patterns drift; a model needs monitoring and retraining.',
          ] },
          { term: 'Overfitting', def: 'When a model learns the quirks and noise of its training data so closely that it performs worse on new data. Like a student who memorised past papers and fails when the questions change.' },
          { diagram: { kind: 'compare', left: { title: 'Machine learning fits when…', items: ['The decision repeats thousands of times', 'Lots of history with reliable outcomes', 'Patterns are complex or change over time', 'Some errors are acceptable'] }, right: { title: 'Prefer rules, SQL or analysis when…', items: ['A simple rule already works well', 'Little data, or labels you cannot trust', 'Every decision must be fully explained by law', 'The question is one-off: a chart answers it'] }, caption: 'Machine learning is a tool, not a goal. Many valuable projects end with "a good rule is enough".' } },
        ],
      },
    ],
    faq: [
      { q: 'Is machine learning the same as AI?', a: 'Artificial intelligence is the broad goal of machines doing tasks that seem intelligent. Machine learning is the main way modern AI is built: learning from data rather than hand-coded rules. Deep learning is a subset of ML that uses large neural networks.' },
      { q: 'Do I need advanced maths to use machine learning?', a: 'To use standard tools well, school algebra, averages and some probability are enough to start. Deeper maths helps when you need to understand why a model behaves oddly, and later chapters build it up slowly.' },
      { q: 'How much data do I need?', a: 'It depends on how complex the pattern is. Simple models can work with a few hundred labelled examples; image or language models need far more. More important than size is whether the data is representative and the labels are correct.' },
      { q: 'What is the difference between a model and an algorithm?', a: 'The algorithm is the recipe for learning (for example, "find the line with the smallest squared error"). The model is the result of running it on your data (the specific line, price = 4.43 × area + 16.66).' },
      { q: 'Why do we need a separate test set?', a: 'Because a model can memorise training data. Only performance on data it never saw tells you how it will behave on next month\'s customers.' },
      { q: 'Which algorithm should I start with?', a: 'A simple one: linear or logistic regression, or a decision tree. They are fast, explainable, and give you a baseline. Move to random forests or gradient boosting only if they clearly improve on it.' },
    ],
  },

  'data-cleaning': {
    minutes: 16,
    hook: 'A lending team builds a default-prediction model and celebrates: 99% accuracy on the test set. Three months after launch it performs no better than guessing. The post-mortem finds the culprit in the data, not the algorithm: one column was only filled in after a loan had already gone bad. **Data cleaning** is the unglamorous work of finding such problems, along with gaps, duplicates and typos, before they silently ruin a model.',
    sections: [
      {
        heading: 'The problem: real data is messy',
        blocks: [
          { p: 'Data collected by real systems and real people is never tidy. Forms are left blank, the same customer is entered twice, someone types 250 into the age field, a sensor reports -999 when it loses power, and a column that looks useful turns out to be recorded after the event you want to predict.' },
          { term: 'Data cleaning', def: 'Finding and fixing problems in a dataset (missing values, duplicates, impossible values, inconsistent formats, leaked information) so that analysis and models reflect reality.' },
          { p: 'Models cannot tell a typo from a fact. They learn whatever is in the table. That is why the saying "garbage in, garbage out" is repeated so often, and why practitioners commonly report that preparing data takes more of a project than modelling does.' },
          { diagram: { kind: 'table', head: ['cust_id', 'age', 'city', 'income (₹ L)', 'Problem'], rows: [['101', '34', 'Chennai', '12', 'Clean'], ['102', '', 'Pune', '9', 'Missing age'], ['103', '250', 'Mumbai', '15', 'Impossible age'], ['104', '41', 'chennai ', '-999', 'Inconsistent text; code for unknown'], ['101', '34', 'Chennai', '12', 'Duplicate of first row']], caption: 'Five rows, five kinds of trouble. Each one would silently distort averages and models if left untreated.' } },
        ],
      },
      {
        heading: 'Building the intuition: washing vegetables',
        blocks: [
          { p: 'A good cook does not throw vegetables straight from the market into the pot. They wash off the soil, pick out the bruised pieces, check nothing foreign is mixed in, and make sure they have the right quantities. Skip that step and no recipe, however clever, will save the dish.' },
          { steps: [
            '**Look before you cut.** Inspect what arrived: how much, what condition. In data: profile every column.',
            '**Remove what does not belong.** A stone in the lentils. In data: duplicates and impossible values.',
            '**Decide what to do with the imperfect.** A slightly bruised tomato can be trimmed; a rotten one goes. In data: fill some gaps, flag others, drop a few rows.',
            '**Check the ingredient is the right one.** Coriander, not parsley. In data: make sure every feature would truly be known at the moment of prediction.',
          ], title: 'The kitchen routine' },
          { callout: 'Cleaning is not about making data look perfect. It is about making it **honest**: every fix should move the table closer to the real world, and every fix should be written down.', tone: 'key' },
        ],
      },
      {
        heading: 'How to clean data, step by step',
        blocks: [
          { diagram: { kind: 'flow', nodes: ['**Profile**: types, missing counts, ranges', '**Fix formats**: numbers, dates, text', '**Remove duplicates** on business keys', '**Treat missing values and outliers**', '**Check for leakage**, then split and fit'], caption: 'A dependable cleaning order. Fitting any statistic, such as a median for filling gaps, happens on training data only.' } },
          { p: '**Step 1: Profile.** `df.info()`, `df.describe()` and `df.isna().sum()` show types, ranges and gaps. `value_counts()` on text columns reveals spelling variants.' },
          { p: '**Step 2: Fix formats.** Convert text to numbers (`pd.to_numeric`), parse dates (`pd.to_datetime`), and standardise text (`str.strip().str.title()` turns "chennai " into "Chennai"). Replace special codes like -999 or 9999 with proper missing values.' },
          { p: '**Step 3: Duplicates.** `df.duplicated(subset="cust_id").sum()` counts repeats of a business key. Decide which copy to keep (often the latest) and drop the rest.' },
          { p: '**Step 4: Missing values and outliers.** Decide column by column, using the rules in the next sections.' },
          { term: 'Missing value', def: 'A cell with no recorded value. pandas shows it as NaN (or NaT for dates). It may mean "unknown", "not applicable" or "zero", and those are very different.' },
          { term: 'Imputation', def: 'Filling a missing value with a sensible estimate, such as the column\'s median or most frequent value, so the row can still be used.' },
          { p: '**Step 5: Leakage check, then split.** For every column ask, "Would I know this value at the moment I make the prediction?" Then split into training and test sets, and fit any imputer on the training set only.' },
          { term: 'Data leakage', def: 'When information that would not be available at prediction time sneaks into the training data, making test results look far better than real-world performance.' },
        ],
      },
      {
        heading: 'The math, explained slowly: medians, fences and z-scores',
        blocks: [
          { p: 'Three small formulas do most of the numeric work in cleaning. Each has a reason for being there.' },
          { tex: '\\text{missing rate} = \\frac{\\text{number of missing cells in a column}}{\\text{number of rows}}', plain: 'The share of a column that is empty. A rough guide: under 5% is usually safe to impute; 5–40% needs thought and often a "was missing" flag; above that, ask whether the column is usable at all.' },
          { p: '**Why the median for filling gaps?** The median is the middle value when the data is sorted, so a few extreme values cannot drag it. The mean adds every value, so one billionaire moves it a lot. For skewed columns like income, the median is the safer fill.' },
          { term: 'Outlier', def: 'A value far from most of the others. It can be an error (age 250), a code (-999), or a real and important rare case (a fraudulent transaction). It is a reason to investigate, not automatically to delete.' },
          { term: 'Quartiles and IQR', def: 'Sort the values and cut them into four equal parts. Q1 has 25% of values below it, Q3 has 75% below it. The interquartile range (IQR) is Q3 − Q1, the width of the middle half of the data.' },
          { tex: 'x < Q_1 - 1.5\\,\\text{IQR} \\quad \\text{or} \\quad x > Q_3 + 1.5\\,\\text{IQR}', plain: 'The IQR rule flags values that sit far outside the middle half of the data. Because quartiles, like the median, are not dragged by extremes, the rule still works when the outliers themselves are large.', symbols: [['Q_1, Q_3', 'the 25th and 75th percentiles'], ['\\text{IQR}', 'Q3 − Q1, the width of the middle half']] },
          { term: 'Standard deviation and z-score', def: 'The standard deviation measures the typical distance of values from their mean. A z-score expresses one value as "how many standard deviations above or below the mean" it sits.' },
          { tex: 'z = \\frac{x - \\bar{x}}{s}', plain: 'The z-score measures how many standard deviations a value is from the mean. A common rule flags |z| > 3. But the mean and standard deviation are themselves inflated by outliers, so in small samples this rule can miss the very value it should catch, as the second worked example shows.', symbols: [['\\bar{x}', 'the column mean'], ['s', 'the column standard deviation']] },
          { think: { q: 'Why might "was this value missing?" be a useful feature in itself?', a: 'Because missingness often carries information. Applicants who leave income blank may be self-employed; patients with no recorded test may be the healthy ones who were never tested. A 0/1 "was missing" flag lets the model use that signal.' } },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Mean or median? Filling missing incomes', setup: 'Seven loan applicants\' annual incomes in ₹ lakh: 6, 8, missing, 9, 12, missing, 95. The 95 belongs to a business owner and has been verified.', steps: [
            'Observed values: 6, 8, 9, 12, 95 (five values).',
            'Mean = (6 + 8 + 9 + 12 + 95) / 5 = 130 / 5 = ₹26 lakh.',
            'Median = middle of the sorted five = ₹9 lakh.',
            'Filling with the mean claims both unknown applicants earn ₹26 lakh, more than four of the five known applicants. Filling with the median gives ₹9 lakh, a typical value.',
            'Also add a column income_missing = 1 for those two rows, 0 otherwise, so the model can learn whether missing income itself predicts risk.',
          ], result: 'Use the median for skewed money columns, and keep a missing-flag. One verified high earner made the mean almost three times the median.' } },
          { example: { title: 'Spotting a faulty sensor reading', setup: 'Ten spindle temperatures (°C) from a CNC machine: 62, 63, 64, 64, 65, 66, 67, 68, 71, 140.', steps: [
            'Quartiles: Q1 = 64, median = 65.5, Q3 = 67.75. IQR = 3.75.',
            'Upper fence = 67.75 + 1.5 × 3.75 = 73.375. The reading 140 is far above it → flagged.',
            'z-score check: mean = 73.0, standard deviation (pandas default) ≈ 23.7. z for 140 = (140 − 73) / 23.7 ≈ 2.83, below the usual cut-off of 3 → not flagged!',
            'Why: the 140 itself inflated the standard deviation from under 3 to 23.7, hiding itself. With only ten values, no point can even reach z = 3 under this formula.',
            'Investigation: the maintenance log shows a sensor reconnection at that moment. Replace 140 with missing and impute or interpolate.',
          ], result: 'Quartile-based rules are robust to the outliers they are hunting; mean-based z-scores can be fooled, especially in small samples.' } },
          { diagram: { kind: 'bars', labels: ['62', '63', '64', '64', '65', '66', '67', '68', '71', '140'], values: [62, 63, 64, 64, 65, 66, 67, 68, 71, 140], highlight: 9, yLabel: '°C', caption: 'The ten temperature readings. Nine sit between 62 and 71 °C; the last is roughly double. The IQR fence at 73.4 °C catches it; a z > 3 rule does not.' } },
          { example: { title: 'Cleaning a loan file before modelling (illustrative)', setup: 'An NBFC has 10,000 past personal-loan applications with a default label. Profiling shows: income missing in 600 rows, 150 repeated application IDs, and a column "days_past_due".', steps: [
            'Missing rate for income = 600 / 10,000 = 6%. Most blanks are self-employed applicants, so the gaps are not random: add income_missing and impute the median (fitted on training rows only).',
            'Duplicates: 150 repeated IDs come from re-submitted forms. Keep the latest of each: 10,000 − 150 = 9,850 rows remain.',
            'Leakage: days_past_due is only filled after repayments begin, that is, after the outcome starts. It must be removed.',
            'Re-train: test accuracy falls from a suspicious 99% to a believable 82%.',
          ], result: 'The lower score is good news: it is an honest estimate of how the model will perform on new applicants.' } },
        ],
      },
      {
        heading: 'Why is it missing? Leakage and other judgement calls',
        blocks: [
          { p: 'Before filling a gap, ask why it exists. Statisticians distinguish three situations, and the right treatment depends on which one you face.' },
          { diagram: { kind: 'table', head: ['Type', 'Meaning', 'Example', 'Typical treatment'], rows: [['Completely at random', 'Gaps unrelated to anything', 'A form page lost in scanning', 'Simple imputation or drop rows'], ['At random (given other columns)', 'Gaps explained by recorded data', 'Older customers skip the email field', 'Impute using other columns'], ['Not at random', 'Gaps depend on the missing value itself', 'High earners decline to state income', 'Add a missing flag; get better data']], caption: 'The three kinds of missingness, from easiest to hardest. The last is common in business data and cannot be fixed by imputation alone.' } },
          { p: '**Leakage hunting.** Leakage rarely looks suspicious; it looks helpful. Warning signs: a single feature that predicts almost perfectly, test scores far above what experts expected, or a column whose name mentions an outcome ("collections", "discharge", "refund_status"). Ask for every column when, in the real process, its value becomes known.' },
          { bullets: [
            '**Target leakage:** the feature is a consequence of the outcome, such as days past due in a default model.',
            '**Train-test contamination:** statistics such as the median or scaling parameters computed on all data, including the test rows. Fix it by splitting first and using scikit-learn pipelines.',
            '**Time leakage:** using future information, like next month\'s price, to predict this month\'s demand.',
          ] },
        ],
      },
      {
        heading: 'Data cleaning in the real world',
        blocks: [
          { case: { title: 'Merging plant data at a component maker (illustrative)', story: 'A manufacturer with three plants wants one model for scrap rate. Plant A logs temperature in Celsius, plant B in Fahrenheit; plant C records shift as "1/2/3" while the others use "Morning/Evening/Night". Plant B\'s machine IDs have a trailing space, so a join to the machine master silently drops many of its rows. Each plant also uses 0 to mean "sensor offline". After converting units, mapping shift codes, stripping IDs and turning the zeros into missing values with a flag, the merged table recovers the lost rows, and the scrap model\'s errors are no longer concentrated in plant B.' } },
          { bullets: [
            '**Retail:** returns recorded as negative quantities must be separated from sales before forecasting demand.',
            '**Banking:** the same customer under slightly different names across branches needs record matching before any customer-level model.',
            '**Healthcare:** lab values in different units (mg/dL vs mmol/L) must be converted before comparison.',
            '**Surveys:** "prefer not to say" should become its own category, not a missing value.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { diagram: { kind: 'compare', left: { title: 'Dropping rows or columns', items: ['Simple and transparent', 'Fine when gaps are few and random', 'Loses information; can shrink data fast', 'Biased if missingness is not random'] }, right: { title: 'Imputing values', items: ['Keeps every row', 'Median or most-frequent is a solid default', 'KNNImputer or IterativeImputer use other columns', 'Must be fitted on training data only'] }, caption: 'Neither choice is always right. Dropping every row with any blank can quietly throw away half a dataset; imputing without a flag can hide a useful signal.' } },
          { bullets: [
            '**Cleaning before splitting.** Computing medians or caps on all data leaks test information. Split first; put imputers inside a pipeline.',
            '**Deleting real outliers.** In fraud or failure prediction, the extreme cases are the whole point.',
            '**Undocumented fixes.** Every change should live in code, so it can be reviewed and rerun on new data.',
            '**Cleaning data the model will never see clean.** If production data will contain -999, the same cleaning code must run in production too.',
          ] },
          { callout: 'The best cleaning is upstream: a drop-down list instead of free text, a mandatory field, a unit stated on the form. Feed issues back to the data owners so next month\'s file is cleaner.', tone: 'tip' },
        ],
      },
    ],
    faq: [
      { q: 'Should I just drop rows with missing values?', a: 'Only if few rows are affected and the gaps look random. `df.dropna()` drops a row if any column is blank, which can remove a large share of data across many columns. Imputing with a missing-flag is often better.' },
      { q: 'Mean, median or mode for filling gaps?', a: 'Median for numeric columns, especially skewed ones like income or price. Mean only for symmetric data without outliers. Most frequent value (mode) for categories, or a new "Unknown" category.' },
      { q: 'How do I know if an outlier is an error?', a: 'Check whether it is physically possible, look at the original record or source system, and ask the people who produce the data. Impossible values are errors; rare but possible values usually stay.' },
      { q: 'What is the simplest way to avoid leakage?', a: 'Two habits: for every feature, confirm it is known at prediction time; and split the data before any fitting, doing all imputation and scaling inside a scikit-learn Pipeline.' },
      { q: 'Can tree models handle missing values on their own?', a: 'Some can. scikit-learn\'s HistGradientBoosting models, XGBoost and LightGBM accept NaN directly and learn which branch missing values should follow. Many other models, such as linear regression, raise an error.' },
      { q: 'How clean is clean enough?', a: 'When remaining problems no longer change your conclusions or model scores in a meaningful way. Perfect data does not exist; honest, documented data does.' },
    ],
  },

  'feature-engineering': {
    minutes: 15,
    hook: 'Two loan applicants. One earns ₹10 lakh a year and already pays ₹4 lakh in EMIs. The other earns ₹30 lakh and pays ₹6 lakh. Look only at the EMI column and the second applicant seems riskier; look at the ratio and the first is spending 40% of income on debt against the second\'s 20%. The raw columns were there all along; the useful signal appeared only when someone combined them. That act of turning raw data into informative inputs is **feature engineering**.',
    sections: [
      {
        heading: 'The problem: raw columns rarely speak the model\'s language',
        blocks: [
          { p: 'Data arrives in the shape that suited the system that recorded it: a transaction log, a timestamp, a city name, a product code. A model, however, only sees numbers, and it only finds patterns that those numbers make visible. A timestamp like "2026-03-14 19:42" hides the facts that matter: it was a Saturday, in the evening, two weeks before the financial year end.' },
          { term: 'Feature engineering', def: 'Creating new input columns, or transforming existing ones, so that the patterns a model needs are easier to see. It includes ratios, date parts, aggregates, transformations and converting categories into numbers.' },
          { term: 'Categorical variable', def: 'A column whose values are labels rather than quantities, such as city, product type or payment method. Models need these converted into numbers, which is called encoding.' },
          { p: 'Experienced practitioners repeat one lesson: **better features usually beat fancier algorithms**. A simple model with a well-chosen debt-to-income ratio often outperforms a complex model fed raw income and EMI columns, and it is far easier to explain to a credit committee.' },
          { diagram: { kind: 'table', head: ['Raw column', 'Engineered feature', 'Why it helps'], rows: [['income, emi', 'emi / income', 'Debt burden, comparable across salaries'], ['order timestamp', 'weekday, hour, is_month_end', 'Exposes weekly and payday patterns'], ['last_purchase_date', 'days_since_last_purchase', 'Recency predicts churn'], ['transactions log', 'avg spend, last 90 days', 'Summarises behaviour per customer'], ['city', 'is_chennai, is_pune, ...', 'Text turned into usable numbers']], caption: 'Typical transformations. Each engineered column states a business idea in a form a model can use.' } },
        ],
      },
      {
        heading: 'Building the intuition: the detective and the clues',
        blocks: [
          { p: 'A detective arrives at a scene full of raw facts: a train ticket, a muddy shoe, a receipt timed at 9:14 p.m. None of these alone solves the case. The skill lies in turning them into meaningful statements: "the suspect was in Chennai that evening", "the receipt contradicts the alibi". Those derived statements, not the raw objects, point to the answer.' },
          { steps: [
            '**Know the story.** What usually causes the outcome? Debt burden causes default; long gaps between visits precede churn.',
            '**Look for relationships between clues.** Ratios and differences often matter more than raw amounts.',
            '**Put time in context.** "When" becomes weekday, season, festival, days since an event.',
            '**Summarise histories.** A thousand transactions become a handful of numbers: count, average, trend.',
            '**Translate labels into numbers** without inventing false meaning.',
          ], title: 'How a detective builds a case' },
          { think: { q: 'A churn model gets "date of last purchase" as a raw date. Why might "days since last purchase" work far better?', a: 'A raw date is just a large number that keeps increasing over calendar time, so its meaning drifts. "Days since last purchase", measured at the prediction date, directly expresses recency, the classic warning sign of churn, and means the same thing every month.' } },
        ],
      },
      {
        heading: 'How to engineer features, step by step',
        blocks: [
          { diagram: { kind: 'flow', nodes: ['**Understand** the business process and outcome', '**Create** ratios, dates, aggregates', '**Encode** categories as numbers', '**Transform** skewed numbers', '**Validate** on held-out data; drop what does not help'], caption: 'Feature engineering is a loop: create, test, keep what improves held-out performance, discard the rest.' } },
          { p: '**Step 1: Understand.** Talk to the people who run the process. A credit officer will tell you that debt burden and job stability matter; a plant engineer will tell you that temperature drift matters more than temperature.' },
          { p: '**Step 2: Create.** Ratios (`df.emi / df.income`), differences (`(df.as_of - df.last_purchase).dt.days`), date parts (`df.date.dt.weekday`), flags (`df.amount > 50000`) and per-customer aggregates with groupby.' },
          { p: '**Step 3: Encode categories.** Choose one-hot, ordinal or target encoding depending on whether the categories have an order and how many there are (see the dedicated section below).' },
          { term: 'One-hot encoding', def: 'Turning a category with k possible values into k columns of 0s and 1s, one per value. A row gets a 1 in the column for its own value and 0 elsewhere.' },
          { term: 'Ordinal encoding', def: 'Replacing ordered categories with ordered numbers, such as small = 1, medium = 2, large = 3. Appropriate only when the order is real.' },
          { p: '**Step 4: Transform.** Very skewed amounts such as income or order value are often logged so that a jump from ₹1 lakh to ₹10 lakh counts as much as one from ₹10 lakh to ₹1 crore.' },
          { p: '**Step 5: Validate.** Add features one group at a time and check performance on held-out data. A feature that helps on training data but not on validation data is noise.' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { p: 'Most feature engineering is simple arithmetic, but three formulas deserve a closer look because each solves a specific problem.' },
          { tex: '\\text{DTI} = \\frac{\\text{annual EMI payments}}{\\text{annual income}}', plain: 'Debt-to-income expresses debt as a share of what someone earns, so applicants on very different salaries become comparable. A ratio removes the effect of size and keeps the effect of burden.' },
          { tex: 'x\' = \\log(1 + x)', plain: 'The log transform squashes large values and spreads out small ones. With base-10 logs, ₹1,000, ₹10,000 and ₹1,00,000 become about 3, 4 and 5: equal steps for each tenfold increase. Adding 1 first keeps zero amounts valid, since log(0) is undefined. In NumPy this is `np.log1p`.', symbols: [['x', 'the original amount'], ["x'", 'the transformed value']] },
          { term: 'Target encoding', def: 'Replacing each category with the average value of the target for that category, for example each city with its historical churn rate. Powerful for categories with many values, but it must be computed on training data only.' },
          { term: 'Cardinality', def: 'The number of distinct values a categorical column has. "Gender" might have 3; "product ID" might have 50,000. High cardinality makes one-hot encoding impractical.' },
          { p: 'Plain target encoding has a weakness: a category seen only five times gets an average from five rows, which is mostly luck. **Smoothing** blends each category\'s average with the overall average, trusting the category more the more rows it has.' },
          { tex: '\\text{enc}(c) = \\frac{n_c \\, \\bar{y}_c + m \\, \\bar{y}}{n_c + m}', plain: 'A weighted average of the category\'s own mean and the global mean. With many rows (large n_c), the category\'s own mean dominates; with few rows, the result is pulled towards the global mean.', symbols: [['n_c', 'number of training rows in category c'], ['\\bar{y}_c', 'average target in category c'], ['\\bar{y}', 'average target over all training rows'], ['m', 'smoothing strength: how many rows it takes to trust a category']] },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Debt-to-income separates two applicants', setup: 'Applicant A: income ₹10 lakh a year, EMIs ₹4 lakh a year. Applicant B: income ₹30 lakh, EMIs ₹6 lakh.', steps: [
            'On raw EMIs alone, B (₹6 lakh) looks more indebted than A (₹4 lakh).',
            'DTI for A = 4 / 10 = 0.40, so 40% of income already goes to EMIs.',
            'DTI for B = 6 / 30 = 0.20, so 20% goes to EMIs.',
            'Many lenders treat a burden around 40% or more as a warning sign, though thresholds vary by lender and product.',
          ], result: 'The engineered ratio reverses the raw conclusion: A carries twice the debt burden of B. One division created the most informative feature in the table.' } },
          { diagram: { kind: 'table', head: ['customer', 'city', 'city_Chennai', 'city_Mumbai', 'city_Pune'], rows: [['C1', 'Chennai', '1', '0', '0'], ['C2', 'Pune', '0', '0', '1'], ['C3', 'Mumbai', '0', '1', '0'], ['C4', 'Pune', '0', '0', '1']], caption: 'One-hot encoding of city with `pd.get_dummies(df, columns=["city"])`. Each row has exactly one 1. No city is "bigger" than another, which is the point.' } },
          { example: { title: 'One-hot versus a wrong ordinal code', setup: 'Four customers from Chennai, Pune, Mumbai and Pune. A beginner codes Chennai = 1, Mumbai = 2, Pune = 3 and feeds this to a linear regression.', steps: [
            'The linear model multiplies the code by one weight, so it assumes Pune\'s effect is exactly three times Chennai\'s and Mumbai sits precisely halfway. Nothing in reality says so.',
            'Renaming the codes alphabetically or by size would give a different model: a sign the encoding carries invented information.',
            'One-hot encoding creates three 0/1 columns (table above), letting the model learn a separate effect for each city.',
            'For a linear model without regularisation, drop one column (`drop="first"`): the remaining two already imply the third, and the dropped city becomes the baseline.',
          ], result: 'Use one-hot for unordered categories. Keep ordinal codes for real orders such as education level or T-shirt size.' } },
          { example: { title: 'Smoothed target encoding for city churn (illustrative)', setup: 'A broadband provider\'s training data: overall churn 20%. Chennai: 400 customers, 100 churned (25%). Kochi: 5 customers, 3 churned (60%). Smoothing strength m = 20.', steps: [
            'Chennai: (400 × 0.25 + 20 × 0.20) / (400 + 20) = (100 + 4) / 420 ≈ 0.248, barely changed from 25%.',
            'Kochi: (5 × 0.60 + 20 × 0.20) / (5 + 20) = (3 + 4) / 25 = 0.28.',
            'Kochi\'s raw 60% came from just five customers; smoothing pulls it most of the way back towards the 20% average.',
            'Compute these encodings inside each cross-validation fold so a row\'s own outcome never feeds its own feature.',
          ], result: 'Well-supported categories keep their own rate; thin ones are treated cautiously. scikit-learn\'s `TargetEncoder` does this smoothing and the cross-fitting for you.' } },
        ],
      },
      {
        heading: 'Choosing an encoding',
        blocks: [
          { diagram: { kind: 'tree', root: { label: 'Categorical column', children: [
            { label: 'Ordinal encoding', edge: 'real order (S < M < L)' },
            { label: 'No order', edge: 'unordered', children: [
              { label: 'One-hot', edge: 'few values (< ~20)' },
              { label: 'Target or frequency encoding', edge: 'many values' },
            ] },
          ] }, caption: 'A quick decision tree. Order first, then cardinality. Tree-based models are more forgiving, but linear and distance-based models need this done properly.' } },
          { bullets: [
            '**Frequency encoding:** replace each category with how often it appears. Simple, leak-free, useful for very high cardinality.',
            '**Group rare values:** merge categories with fewer than, say, 1% of rows into "Other" before one-hot encoding.',
            '**Unknown categories:** a new city will appear in production. `OneHotEncoder(handle_unknown="ignore")` turns it into all zeros instead of crashing.',
            '**Tree models:** gradient-boosting libraries such as LightGBM and CatBoost can handle categories natively.',
          ] },
        ],
      },
      {
        heading: 'Feature engineering in the real world',
        blocks: [
          { case: { title: 'Demand forecasting for a grocery chain (illustrative)', story: 'A retailer forecasts daily sales of 5,000 products in 300 stores. Raw data is a table of date, store, product and units. The team adds lag features (units sold 7 and 14 days ago), rolling averages (mean of the last 28 days), calendar features (weekday, month, payday week), a festival flag for Diwali, Pongal and Eid with "days until festival", promotion indicators and the product\'s price relative to its usual price. With the same gradient-boosting model, forecast error drops markedly compared with the raw columns alone, and the largest gains come from the lag and festival features, the ones that encode what store managers already knew.' } },
          { bullets: [
            '**Fraud:** number of transactions in the last hour, distance from the customer\'s usual location, amount relative to their typical spend.',
            '**Predictive maintenance:** rolling standard deviation of vibration, temperature change over the last 30 minutes, hours since last service.',
            '**Marketing:** recency, frequency and monetary value (RFM) per customer.',
            '**Text:** word counts or embeddings turn free-text complaints into numeric features.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Using the future.** A "total purchases this year" feature computed on the full year leaks future behaviour into a mid-year prediction. Always compute features as of the prediction date.',
            '**Target encoding on all data.** Each row\'s own label leaks into its feature, inflating scores. Fit encoders on training folds only.',
            '**One-hot explosion.** 50,000 product IDs become 50,000 mostly-zero columns. Group rare values or use target or frequency encoding.',
            '**Too many features.** Hundreds of weak features add noise and slow everything down. Keep what improves validation performance.',
            '**Features the business cannot supply.** A brilliant feature that is unavailable in real time at the point of decision is useless in production.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'Hand-crafted features', items: ['Use domain knowledge directly', 'Explainable to stakeholders', 'Work well with simple models', 'Take human time and thought'] }, right: { title: 'Learned features', items: ['Deep learning learns them from raw images, text or audio', 'Embeddings capture similarity between categories', 'Need much more data and compute', 'Harder to explain'] }, caption: 'For tabular business data, hand-crafted features plus gradient boosting remain hard to beat. For images and text, learned features dominate.' } },
          { callout: 'Fit every encoder and transformer inside a scikit-learn Pipeline with a ColumnTransformer. The same code then runs identically in cross-validation and in production, which removes a whole class of leakage bugs.', tone: 'key' },
        ],
      },
    ],
    faq: [
      { q: 'Do tree models need feature engineering?', a: 'Less encoding care, since trees split on thresholds and do not need scaling. But they still benefit enormously from ratios, aggregates and date features, which they cannot easily invent on their own.' },
      { q: 'What is the dummy variable trap?', a: 'With all k one-hot columns plus an intercept in an unregularised linear regression, the columns always add up to 1, so the model cannot separate their effects. Dropping one column fixes it. Regularised and tree models do not need this.' },
      { q: 'How do I know if a new feature helps?', a: 'Compare cross-validated performance with and without it. Feature importance plots are a hint, but held-out performance is the real test.' },
      { q: 'Should I log-transform every skewed column?', a: 'For linear models and neural networks it often helps. Tree models are unaffected by monotonic transformations like logs, because the order of values is unchanged.' },
      { q: 'Is target encoding the same as leakage?', a: 'Not if done properly. It becomes leakage when a row\'s own label is used to compute its encoding. Computing it on training folds only, with smoothing, avoids this.' },
      { q: 'Can feature engineering be automated?', a: 'Partly. Tools can generate many aggregates and date features automatically, and deep learning learns features for images and text. Domain knowledge still produces the features that matter most in business data.' },
    ],
  },

  scaling: {
    minutes: 14,
    hook: 'Ask a computer which customer is most similar to a 25-year-old earning ₹6 lakh, and give it two candidates: a 60-year-old earning ₹6.5 lakh and a 27-year-old earning ₹12 lakh. Measured naively, the 60-year-old wins easily, because ₹50,000 is a smaller number than ₹6,00,000, and a 35-year age gap is just "35". The computer is not wrong; it was asked an unfair question. **Feature scaling** makes the question fair by putting every feature on a comparable scale.',
    sections: [
      {
        heading: 'The problem: features measured in different units',
        blocks: [
          { p: 'Business data mixes units freely: income in rupees, age in years, tenure in months, a satisfaction score from 1 to 5. Many algorithms combine features by adding up differences or weighted values. When one feature is measured in lakhs and another in single digits, the large-unit feature dominates purely because of its units.' },
          { term: 'Feature scaling', def: 'Transforming numeric features so they share a comparable range or spread, so that no feature dominates a model simply because of the units it happens to be measured in.' },
          { p: 'Which models care? Any model that measures **distances** (k-nearest neighbours, k-means, support vector machines), any that **penalises large weights** (ridge and lasso regression), dimension-reduction methods like PCA, and anything trained by **gradient descent** (logistic regression solvers, neural networks). Tree-based models do not care, because they split on one feature at a time.' },
          { term: 'Gradient descent', def: 'A training method that improves a model by repeatedly taking small steps downhill on the error. When features have very different scales, the downhill path zig-zags and training becomes slow or unstable.' },
          { diagram: { kind: 'bars', labels: ['income gap (₹)', 'age gap (years)'], values: [50000, 35], highlight: 1, yLabel: 'raw difference', caption: 'The raw differences between the 25-year-old and the 60-year-old. The age gap of 35 years is so small next to ₹50,000 that its bar is invisible. Unscaled, a distance calculation sees exactly this picture.' } },
        ],
      },
      {
        heading: 'Building the intuition: marks out of different totals',
        blocks: [
          { p: 'A student scores 45 in Maths, marked out of 50, and 70 in English, marked out of 100. Which is the better performance? Adding the raw marks would give English more influence just because its paper had a bigger total. Every teacher instinctively converts to a common scale first: 90% and 70%.' },
          { steps: [
            '**Notice the units differ.** Marks out of 50 and out of 100 cannot be compared or added directly.',
            '**Choose a common yardstick.** Percentages (a range-based yardstick) or "how far above the class average" (a spread-based yardstick).',
            '**Convert every subject the same way.** Use each subject\'s own total or average.',
            '**Now compare or combine fairly.** Each subject contributes according to performance, not paper size.',
          ], title: 'How a teacher makes marks comparable' },
          { p: 'Converting to percentages is **min-max normalisation**. Asking "how many standard deviations above the class average?" is **standardisation**. Both are feature scaling.' },
          { think: { q: 'In the hook, which customer is "really" more similar to the 25-year-old earning ₹6 lakh?', a: 'It depends on the business purpose, and that is the point. Without scaling, the answer is decided by accident of units (income wins). After scaling, both features get a fair say, and you can then deliberately weight one more if the business wants. Scaling replaces an accident with a decision.' } },
        ],
      },
      {
        heading: 'How to scale correctly, step by step',
        blocks: [
          { diagram: { kind: 'flow', nodes: ['**Split** data into train and test', '**Fit** the scaler on training data only', '**Transform** the training data', '**Transform** test and future data with the same numbers', '**Train and predict** with the model'], caption: 'The scaler learns its means and spreads from the training data alone, then applies those same numbers everywhere else.' } },
          { p: '**Step 1: Split first.** The test set stands in for future data you have never seen, so it must not influence any preparation step.' },
          { p: '**Step 2: Fit on training data.** `scaler = StandardScaler().fit(X_train)` computes each column\'s mean and standard deviation from training rows only.' },
          { p: '**Step 3 and 4: Transform.** `scaler.transform(X_train)` and `scaler.transform(X_test)` apply the same training means and spreads to both. A test value may come out above 3 or below 0; that is expected and correct.' },
          { p: '**Step 5: Model.** In practice, wrap everything in a pipeline: `make_pipeline(StandardScaler(), KNeighborsClassifier())`. The pipeline does the fitting and transforming in the right order automatically, including inside cross-validation.' },
          { callout: 'Fitting the scaler on all data before splitting is a quiet form of leakage: the test set\'s mean and spread seep into training. The effect is often small, but it makes your evaluation slightly optimistic, and in time series it can be large.', tone: 'warn' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { term: 'Standard deviation', def: 'A measure of spread: roughly, the typical distance of values from their mean. Small when values cluster tightly, large when they are spread out.' },
          { term: 'Standardisation (z-score)', def: 'Rescaling a feature so it has mean 0 and standard deviation 1, by subtracting the mean and dividing by the standard deviation. The default choice for most models.' },
          { tex: 'z = \\frac{x - \\mu}{\\sigma}', plain: 'Subtract the training mean so the centre becomes 0, then divide by the training standard deviation so one unit means "one typical spread". A z of 1.5 means "1.5 standard deviations above average", whether the feature was rupees or years.', symbols: [['x', 'original value'], ['\\mu', 'mean of the feature in the training data'], ['\\sigma', 'standard deviation of the feature in the training data']] },
          { term: 'Min-max normalisation', def: 'Rescaling a feature to a fixed range, usually 0 to 1, using its smallest and largest training values.' },
          { tex: "x' = \\frac{x - x_{\\min}}{x_{\\max} - x_{\\min}}", plain: 'Shift so the minimum becomes 0, then divide by the range so the maximum becomes 1. Useful when a model or a display needs bounded inputs, such as pixel intensities or some neural networks.', symbols: [['x_{\\min}, x_{\\max}', 'smallest and largest training values']] },
          { tex: "x' = \\frac{x - \\text{median}}{Q_3 - Q_1}", plain: 'Robust scaling uses the median and the interquartile range (the width of the middle half of the data). Because neither is dragged by extreme values, outliers do not squash everyone else together.', symbols: [['Q_3 - Q_1', 'interquartile range: 75th minus 25th percentile']] },
          { p: 'Notice what scaling does **not** do: it does not change the shape of the distribution. A skewed income column stays skewed after standardisation; only the axis labels change. To change the shape, use a transformation such as a log (see the feature engineering chapter).' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Standardising a new customer with StandardScaler', setup: 'Training data, (age, income in ₹): (30, 4,00,000), (40, 9,00,000), (50, 15,00,000). Scale a new customer aged 55 earning ₹6,00,000.', steps: [
            'Age: mean = (30 + 40 + 50) / 3 = 40. StandardScaler divides by n (not n − 1), giving standard deviation √((100 + 0 + 100) / 3) ≈ 8.165.',
            'Age z = (55 − 40) / 8.165 ≈ 1.84.',
            'Income: mean = 28,00,000 / 3 ≈ ₹9,33,333; standard deviation ≈ ₹4,49,691.',
            'Income z = (6,00,000 − 9,33,333) / 4,49,691 ≈ −0.74.',
            'The new customer becomes (1.84, −0.74): well above average age, somewhat below average income, both in the same "standard deviation" units.',
          ], result: 'Two features with units differing by a factor of tens of thousands now sit on the same scale. Note that 1.84 lies outside the training range of ±1.22, which is fine.' } },
          { example: { title: 'Scaling changes who your nearest neighbour is', setup: 'Target customer A: age 25, income ₹6 lakh. Candidates: B (60, ₹6.5 lakh) and C (27, ₹12 lakh). Suppose the training standard deviations are 12 years for age and ₹3 lakh for income.', steps: [
            'Unscaled distance A–B = √(35² + 50,000²) ≈ 50,000. Unscaled A–C = √(2² + 6,00,000²) ≈ 6,00,000. B looks twelve times closer.',
            'Scaled differences A–B: age 35 / 12 ≈ 2.92, income 0.5 / 3 ≈ 0.17. Distance ≈ √(2.92² + 0.17²) ≈ 2.92.',
            'Scaled differences A–C: age 2 / 12 ≈ 0.17, income 6 / 3 = 2.0. Distance ≈ √(0.17² + 2.0²) ≈ 2.01.',
            'After scaling, C is the nearer neighbour.',
          ], result: 'A k-nearest-neighbours recommender or a k-means segmentation would give opposite answers depending on whether the data was scaled. Unscaled, age was effectively ignored.' } },
          { example: { title: 'One crorepati and min-max scaling', setup: 'Six incomes in ₹ lakh: 5, 8, 10, 12, 15, 200.', steps: [
            'Min-max: (x − 5) / (200 − 5) = (x − 5) / 195. Results: 0, 0.015, 0.026, 0.036, 0.051, 1.',
            'Five of the six customers are crammed between 0 and 0.05; the model can barely tell them apart.',
            'Robust scaling: median = 11, IQR = 14.25 − 8.5 = 5.75. Results: −1.04, −0.52, −0.17, 0.17, 0.70, 32.87.',
            'Now the ordinary customers are spread across about −1 to 0.7, and the outlier stands clearly apart.',
          ], result: 'Min-max lets one extreme value squash everyone else. With outliers, prefer robust scaling, a log transform, or both.' } },
          { diagram: { kind: 'scatter', xLabel: 'customer', yLabel: 'scaled income', caption: 'The same five ordinary incomes after min-max scaling (blue, all near 0) and robust scaling (red, spread from about −1 to 0.7). The outlier, at 1 and 32.9 respectively, is left off the chart.', points: [[1, 0], [2, 0.015], [3, 0.026], [4, 0.036], [5, 0.051], [1, -1.04, 1], [2, -0.52, 1], [3, -0.17, 1], [4, 0.17, 1], [5, 0.7, 1]] } },
        ],
      },
      {
        heading: 'Which models need scaling?',
        blocks: [
          { diagram: { kind: 'table', head: ['Model', 'Needs scaling?', 'Why'], rows: [['k-NN, k-means', 'Yes', 'Built on distances'], ['SVM', 'Yes', 'Distances and margins'], ['PCA', 'Yes', 'Finds directions of largest variance'], ['Ridge, lasso, elastic net', 'Yes', 'Penalty treats all weights equally'], ['Neural networks', 'Yes', 'Gradient descent trains faster and more stably'], ['Plain linear regression', 'Not for accuracy', 'Coefficients rescale; helps interpretation'], ['Decision trees, random forests, boosting', 'No', 'Split one feature at a time on thresholds']], caption: 'A quick reference. When unsure, scaling inside a pipeline rarely hurts.' } },
          { bullets: [
            '**One-hot columns:** they are already 0/1. Standardising them is allowed but usually unnecessary; many pipelines scale only the numeric columns via a ColumnTransformer.',
            '**The target:** you normally do not need to scale y for most models. Neural network regressions sometimes benefit; scikit-learn\'s TransformedTargetRegressor handles the conversion back.',
            '**Sparse data:** for mostly-zero data such as word counts, subtracting the mean would fill every zero. Use `MaxAbsScaler` or `StandardScaler(with_mean=False)`.',
          ] },
        ],
      },
      {
        heading: 'Scaling in the real world',
        blocks: [
          { case: { title: 'Segmenting dealers for an automotive OEM (illustrative)', story: 'An analytics team clusters 600 dealerships using annual sales (in crore), service bays (5 to 40), customer satisfaction (1 to 5) and years in operation. The first k-means run produces segments that are simply "big", "medium" and "small" by sales, because sales in rupees swamps everything else. After standardising all four features inside a pipeline, the segments change completely: "high-volume but low-satisfaction", "small but loyal", "new and growing". Those segments lead to different support programmes, which the size-only segmentation could never have suggested.' } },
          { bullets: [
            '**Credit scoring with logistic regression:** standardised features make the regularisation penalty fair and coefficients comparable.',
            '**Sensor analytics:** temperature, pressure and vibration in different units are standardised before PCA or anomaly detection.',
            '**Recommendation systems:** similarity between customers or products is meaningless unless features share a scale.',
            '**Deep learning:** image pixels are typically scaled from 0–255 to 0–1 before training.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Fitting on all data.** Fit on training data only; a pipeline enforces it.',
            '**Forgetting to scale in production.** The saved model must be paired with the saved, already-fitted scaler. Saving the whole pipeline avoids mismatches.',
            '**Min-max with outliers.** One extreme value compresses everyone else. Use robust scaling or transform first.',
            '**Expecting scaling to fix skew.** It does not change the distribution\'s shape. Use log or power transforms for that.',
            '**Scaling for trees.** Harmless but wasted effort.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'StandardScaler (z-score)', items: ['Mean 0, standard deviation 1', 'Default for most models', 'Affected by outliers, but less than min-max', 'No fixed range: values can exceed ±3'] }, right: { title: 'Alternatives', items: ['**MinMaxScaler**: fixed 0–1 range; outlier-sensitive', '**RobustScaler**: median and IQR; outlier-resistant', '**MaxAbsScaler**: keeps zeros; for sparse data', '**PowerTransformer**: reshapes skewed data towards a bell curve'] }, caption: 'Start with StandardScaler. Switch when outliers, sparsity or a required range tell you to.' } },
          { callout: 'Scaling is cheap, fast and easy to get right inside a pipeline, and forgetting it can quietly ruin distance-based models. Make it a habit.', tone: 'key' },
        ],
      },
    ],
    faq: [
      { q: 'Normalisation or standardisation: which should I use?', a: 'Standardisation is the safer default. Use min-max normalisation when you need a fixed range, such as image pixels, and the data has no extreme outliers.' },
      { q: 'Why does StandardScaler give slightly different numbers from my Excel calculation?', a: 'StandardScaler divides by n (population standard deviation); Excel\'s STDEV.S and pandas\' `.std()` divide by n − 1. The difference shrinks as the dataset grows.' },
      { q: 'Should I scale before or after splitting the data?', a: 'After. Fit the scaler on the training data, then use it to transform both training and test data. A pipeline does this automatically.' },
      { q: 'Do I need to scale for random forests or XGBoost?', a: 'No. Tree splits depend only on the order of values within each feature, which scaling does not change.' },
      { q: 'Can a scaled value be greater than 1 or less than 0?', a: 'Yes. Standardised values are often between −3 and 3 but have no hard limits. Even min-max values for test data can fall outside 0–1 if they exceed the training range.' },
      { q: 'Does scaling change the relationships in my data?', a: 'No. Correlations and the order of values within each column stay the same. Only the units change, which is why it is safe to do.' },
    ],
  },
};
