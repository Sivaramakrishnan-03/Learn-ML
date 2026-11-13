import { DeepLesson } from './types';

// Textbook chapters for the unsupervised-learning group (everything except k-means, which lives in g-kmeans.ts).
export const UNSUPERVISED_DEEP: Record<string, DeepLesson> = {
  // ─────────────────────────────────────────────────────────────── HIERARCHICAL CLUSTERING
  hierarchical: {
    minutes: 19,
    hook: 'A retail chain with 60 stores asks a simple question: "How many kinds of store do we have?" The regional director wants two answers (big-city and small-town), the marketing team wants five, and the supply-chain team wants twelve. With k-means you would run the analysis three times and get three unrelated answers. **Hierarchical clustering** builds one family tree of all 60 stores, and every team can read off the level of detail it needs from the same picture.',
    sections: [
      {
        heading: 'The problem: groups inside groups',
        blocks: [
          { p: 'In the k-means chapter you chose the number of groups k up front and the algorithm found k centres. That works when you know roughly how many segments you want. Often you do not. Worse, real groupings are frequently **nested**: "premium stores" might split into "premium malls" and "premium high streets", which might split again by region.' },
          { term: 'Hierarchical clustering', def: 'A clustering method that builds a whole tree of groups, from every item on its own at the bottom to one big group at the top. You decide afterwards how many groups to use by choosing a level of the tree.' },
          { p: 'Businesses think in hierarchies all the time: product categories (Grocery → Dairy → Milk), organisation charts, geographic regions. Hierarchical clustering lets the data suggest such a hierarchy instead of someone inventing it in a meeting room.' },
          { term: 'Dendrogram', def: 'The tree diagram produced by hierarchical clustering. Items sit at the bottom; lines join them where they merge. The height of each join shows how different the two merged groups were.' },
          { diagram: { kind: 'tree', root: { label: 'All 60 stores', children: [{ label: 'Big-city (24)', edge: 'split 1', children: [{ label: 'Mall stores (14)' }, { label: 'High-street (10)' }] }, { label: 'Small-town (36)', edge: 'split 1', children: [{ label: 'Highway (9)' }, { label: 'Market town (27)' }] }] }, caption: 'One tree, several answers (illustrative). Read it at the top level and you get 2 groups for the regional director; read one level lower and you get 4 groups for marketing. Nothing has to be re-run.' } },
        ],
      },
      {
        heading: 'Building the intuition: forming teams at an offsite',
        blocks: [
          { p: 'Imagine 20 colleagues at a company offsite who must organise themselves into teams, and nobody knows how many teams there should be. Here is a natural way to do it, with no formulas at all.' },
          { steps: [
            '**Everyone starts alone.** Twenty "teams" of one person each.',
            '**The two people who get along best pair up.** Now there are 19 teams.',
            '**Look again for the two closest teams** (a pair might join a third person, or two singles might pair up) and merge them.',
            '**Keep merging the two most similar teams**, one merge at a time, writing down how similar they were at the moment they joined.',
            '**Stop when everyone is in one big team.** You now have the full history of who joined whom, and when.',
          ], title: 'Merging, one step at a time' },
          { p: 'If the facilitator later says "we need four teams", you simply rewind the history to the moment when exactly four teams existed. If she says "make it two", you rewind to that point instead. The history contains every possible answer.' },
          { think: { q: 'Early merges happen between very similar people. What does it tell you if, near the end, two teams only join after a very long wait (a very large difference)?', a: 'It tells you those two teams are really different groups. Forcing them together is a big compromise. A long wait before a merge is the clearest sign of a natural boundary, and it is exactly where you should "cut" the tree.' } },
          { callout: 'This bottom-up merging is called **agglomerative** clustering and it is what almost everyone means by hierarchical clustering. The opposite, top-down splitting, exists but is rarely used.', tone: 'key' },
        ],
      },
      {
        heading: 'How the algorithm works, step by step',
        blocks: [
          { term: 'Agglomerative', def: 'Bottom-up: start with every item as its own cluster and repeatedly merge. (The top-down alternative, which starts with one cluster and repeatedly splits, is called divisive.)' },
          { term: 'Distance matrix', def: 'A table giving the distance between every pair of items. With n items it has n × n cells, although only about half are needed because the distance from A to B equals the distance from B to A.' },
          { diagram: { kind: 'flow', nodes: ['**Scale** features and compute the distance matrix', 'Treat every item as its own cluster', '**Merge** the two closest clusters; record the height', 'Update distances from the new cluster to the rest', 'Repeat until one cluster remains, then **cut** the tree'], caption: 'Agglomerative clustering. With n items there are always exactly n − 1 merges, and the recorded heights become the dendrogram.' } },
          { p: '**Step 1: Prepare.** As with k-means, distances are only meaningful if features are on comparable scales, so standardise first. Then compute the distance between every pair of items, usually the ordinary straight-line (Euclidean) distance.' },
          { p: '**Step 2: Merge.** Find the two clusters with the smallest distance between them and join them. Write down that distance: it is the **height** of the join in the dendrogram.' },
          { p: '**Step 3: Update.** The new, bigger cluster needs a distance to every other cluster. How you define "distance between two groups" is the single most important choice in the method, and it is called the **linkage**. We look at it in the next section.' },
          { p: '**Step 4: Repeat** until one cluster is left. **Step 5: Cut** the tree at a chosen height (or ask for a chosen number of clusters) to get your final groups.' },
          { callout: 'There is no randomness anywhere in this procedure. Unlike k-means, running it twice on the same data gives exactly the same tree.', tone: 'tip' },
        ],
      },
      {
        heading: 'The math, explained slowly: what does "distance between two groups" mean?',
        blocks: [
          { p: 'Distance between two single points is easy. Distance between two **groups** of points is a choice, and different choices produce different trees. The rule you choose is the linkage.' },
          { term: 'Linkage', def: 'The rule for measuring the distance between two clusters, built from the distances between their members. Common choices: single, complete, average and Ward.' },
          { tex: 'd_{\\text{single}}(A,B) = \\min_{a \\in A,\\, b \\in B} d(a,b)', plain: 'Single linkage: the distance between the two closest members, one from each group. Two groups are "close" if any pair of their members is close.', symbols: [['A, B', 'the two clusters'], ['d(a,b)', 'distance between point a and point b']] },
          { tex: 'd_{\\text{complete}}(A,B) = \\max_{a \\in A,\\, b \\in B} d(a,b)', plain: 'Complete linkage: the distance between the two farthest members. Two groups are "close" only if every pair of their members is close, which favours compact groups.' },
          { tex: 'd_{\\text{average}}(A,B) = \\frac{1}{|A|\\,|B|} \\sum_{a \\in A} \\sum_{b \\in B} d(a,b)', plain: 'Average linkage: work out the distance for every pair (one member from each group) and take the average. A compromise between the two extremes.', symbols: [['|A|', 'number of points in cluster A']] },
          { tex: '\\Delta(A,B) = \\frac{|A|\\,|B|}{|A|+|B|} \\, \\lVert \\mu_A - \\mu_B \\rVert^2', plain: 'Ward linkage: merge the pair of clusters whose merger increases the total within-cluster sum of squares (the inertia from the k-means chapter) by the smallest amount. The increase depends on how far apart the two centres are and how big the clusters are.', symbols: [['\\Delta', 'increase in total within-cluster sum of squares'], ['\\mu_A', 'centre (mean) of cluster A']] },
          { p: 'Why do these matter? Single linkage only needs one close pair, so it happily follows a long thin chain of points, which is good for snake-like shapes but dangerous with noise (one stray point can bridge two real groups). Complete linkage refuses to merge groups that have any far-apart members, so it produces tight, ball-shaped clusters. Ward behaves most like k-means because it minimises the same quantity, which is why it is the usual default (`linkage="ward"` in scikit-learn\'s `AgglomerativeClustering`).' },
          { callout: 'Ward linkage only makes sense with Euclidean distance. If you need a different distance (for example for text or yes/no features), use average or complete linkage instead.', tone: 'warn' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Single linkage on five numbers', setup: 'Average daily orders (in hundreds) for five small outlets: A = 1, B = 2, C = 4, D = 10, E = 11. Build the tree with single linkage.', steps: [
            'Pairwise distances that matter: A–B = 1, D–E = 1, B–C = 2, A–C = 3, C–D = 6.',
            'Merge 1: A and B are 1 apart (the smallest distance; D–E ties at 1, and the order of ties does not change the tree). Join {A, B} at height 1.',
            'Merge 2: D and E, also 1 apart. Join {D, E} at height 1.',
            'Merge 3: distance from {A, B} to C under single linkage = the closest pair = min(3, 2) = 2. Distance from C to {D, E} = min(6, 7) = 6. So C joins {A, B} at height 2.',
            'Merge 4: distance from {A, B, C} to {D, E} = closest pair = C to D = 10 − 4 = 6. Final join at height 6.',
          ], result: 'Merge heights 1, 1, 2, 6. The jump from 2 to 6 is large, so the natural answer is two groups: small outlets {A, B, C} and big outlets {D, E}.' } },
          { example: { title: 'Same numbers, different linkage', setup: 'Redo merges 3 and 4 with complete and average linkage. The first two merges are identical because single points have only one distance.', steps: [
            'Complete linkage, merge 3: {A, B} to C = farthest pair = max(3, 2) = 3. C to {D, E} = max(6, 7) = 7. C joins {A, B} at height 3.',
            'Complete linkage, merge 4: farthest pair between {1, 2, 4} and {10, 11} is 1 to 11 = 10. Final height 10.',
            'Average linkage, merge 3: {A, B} to C = (3 + 2) / 2 = 2.5.',
            'Average linkage, merge 4: the six cross distances are 9, 10, 8, 9, 6, 7. Their sum is 49, so the average is 49 / 6 ≈ 8.17.',
            'Ward, merge 3: increase in sum of squares = (2 × 1 / 3) × (1.5 − 4)² = (2/3) × 6.25 ≈ 4.17. Joining C to {D, E} instead would cost (2/3) × (10.5 − 4)² ≈ 28.17, so C joins {A, B}.',
          ], result: 'The grouping is the same, but the heights differ by linkage. Heights are only comparable within one tree, never across linkages.' } },
          { diagram: { kind: 'table', head: ['Merge', 'Clusters joined', 'Single', 'Complete', 'Average'], rows: [['1', 'A + B', '1', '1', '1'], ['2', 'D + E', '1', '1', '1'], ['3', '{A,B} + C', '2', '3', '2.5'], ['4', '{A,B,C} + {D,E}', '6', '10', '8.17']], caption: 'Merge heights for the five outlets under three linkages (checked with SciPy). The order of merges is the same here, but the last jump is biggest under complete linkage, which always uses the worst-case pair.' } },
          { example: { title: 'Five stores in two dimensions (complete linkage)', setup: 'Five stores described by (weekday sales, weekend sales) in ₹ lakh per week, already on the same scale: S1 (2, 3), S2 (3, 3), S3 (3, 5), S4 (8, 7), S5 (9, 8).', steps: [
            'Distances: S1–S2 = 1; S2–S3 = 2; S1–S3 = √(1² + 2²) ≈ 2.24; S4–S5 = √(1² + 1²) ≈ 1.41; S3–S4 = √(5² + 2²) ≈ 5.39; S1–S5 = √(7² + 5²) ≈ 8.60.',
            'Merge 1: S1 + S2 at height 1 (the smallest distance in the table).',
            'Merge 2: S4 + S5 at height 1.41.',
            'Merge 3: complete-linkage distance from {S1, S2} to S3 = max(2.24, 2) = 2.24. This is smaller than anything involving {S4, S5}, so S3 joins at 2.24.',
            'Merge 4: farthest pair between {S1, S2, S3} and {S4, S5} is S1–S5 = 8.60.',
          ], result: 'Heights 1, 1.41, 2.24, 8.60. Cutting anywhere between 2.24 and 8.60 gives two clear store types: "low-volume" {S1, S2, S3} and "high-volume, weekend-heavy" {S4, S5}.' } },
        ],
      },
      {
        heading: 'Reading the dendrogram and choosing where to cut',
        blocks: [
          { p: 'A dendrogram is read from the bottom up. Items that join low down are very similar. Items that only meet near the top are very different. The vertical axis is the merge height, so the **length of the vertical lines** is what carries information, not the left-to-right order of the leaves (which is just for drawing).' },
          { term: 'Cutting the tree', def: 'Drawing a horizontal line across the dendrogram at some height. Every branch the line crosses becomes one cluster. A higher cut gives fewer, larger clusters.' },
          { diagram: { kind: 'bars', labels: ['merge 1', 'merge 2', 'merge 3', 'merge 4'], values: [1, 1.41, 2.24, 8.6], highlight: 3, yLabel: 'merge height', caption: 'Merge heights for the five stores. The first three merges are cheap; the last one costs almost four times as much as the one before. Cutting just below the big jump (say at height 5) gives two clusters.' } },
          { p: 'Three practical ways to choose the cut:' },
          { bullets: [
            '**Look for the biggest gap** between successive merge heights. This is the dendrogram version of the elbow method from k-means.',
            '**Ask for a number of clusters.** In SciPy, `fcluster(Z, t=3, criterion="maxclust")`; in scikit-learn, `AgglomerativeClustering(n_clusters=3)`.',
            '**Set a distance threshold** that has business meaning, for example "stores more than 5 lakh apart in weekly sales profile should not share a format" (`distance_threshold=5, n_clusters=None`).',
          ] },
          { think: { q: 'Two leaves sit right next to each other at the bottom of a dendrogram but only join at the very top. Are they similar?', a: 'No. Horizontal position in a dendrogram is arbitrary; any branch can be flipped left-to-right without changing the tree. Similarity is read only from the height at which two items first join.' } },
          { callout: 'You can also judge a cut with the silhouette score from the k-means chapter: compute it for cuts giving 2, 3, 4 … clusters and compare.', tone: 'tip' },
        ],
      },
      {
        heading: 'Hierarchical clustering in the real world',
        blocks: [
          { case: { title: 'Building a product taxonomy from sales data (illustrative)', story: 'An online grocer has 400 product lines with inconsistent categories entered by different buyers over the years. The analytics team describes each product by its weekly sales pattern, typical basket partners and price band, standardises the features and runs Ward hierarchical clustering. The dendrogram shows two clear top-level branches (daily essentials and occasional purchases), six mid-level branches that category managers recognise and name, and about 30 low-level groups. The team cuts the tree at the six-branch level to restructure the website menu, and at the 30-group level to plan which products should be stocked together in the warehouse. One tree served two decisions.' } },
          { bullets: [
            '**Biology:** grouping genes with similar expression patterns; the dendrograms beside heatmaps in genetics papers come from this method.',
            '**Finance:** grouping stocks by the correlation of their returns, so a portfolio does not unknowingly hold ten versions of the same bet.',
            '**Manufacturing:** grouping machine sensor profiles to find families of similar faults.',
            '**Text:** grouping documents or support tickets into topics and sub-topics.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**It does not scale to big data.** It needs the distance between every pair of items. With 50,000 customers that is about 1.25 billion distances, roughly 10 GB of memory at 8 bytes each, and the run time grows even faster. Use it on samples, on aggregated data (stores, products) or switch to k-means.',
            '**Merges are never undone.** The algorithm is greedy: once two items are joined they stay together, even if a later view shows that was a mistake.',
            '**Single linkage chains.** A thin line of noise points can join two real groups into one long snake.',
            '**Scaling still matters.** Unscaled rupee columns dominate the distances, just as in k-means.',
            '**Different linkages give different trees.** Try at least Ward and average linkage and check whether the main groups survive.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'Hierarchical clustering', items: ['No need to choose k in advance', 'Shows structure at every level', 'Deterministic: same answer every run', 'Memory grows with n², so up to roughly 10,000–20,000 items', 'Greedy merges cannot be revised'] }, right: { title: 'K-means', items: ['Must choose k up front', 'One flat set of groups', 'Depends on random start (use several runs)', 'Handles millions of rows', 'Keeps improving the grouping until it settles'] }, caption: 'A common combination: run k-means to compress a huge dataset into a few hundred small clusters, then run hierarchical clustering on those centroids to see the big picture.' } },
          { callout: 'If you need clusters of strange shapes with noise points left out, look at DBSCAN (next chapter). If you need probabilities of belonging, look at Gaussian Mixture Models.', tone: 'key' },
        ],
      },
    ],
    faq: [
      { q: 'Do I need to choose the number of clusters?', a: 'Not to build the tree. You choose it afterwards, by cutting the dendrogram at a height or asking for a number of clusters, and you can try several cuts without re-running anything.' },
      { q: 'Which linkage should I use?', a: 'Start with Ward when your features are numeric and you use Euclidean distance; it gives compact, k-means-like groups. Use average or complete linkage for other distances, and single linkage only when you expect long, chain-like clusters and have little noise.' },
      { q: 'Why does my dendrogram look different in another tool?', a: 'Usually the linkage, the distance measure or the scaling differ. Also, SciPy reports Ward heights on a different scale from the raw increase in sum of squares, so absolute heights vary between tools while the shape of the tree stays the same.' },
      { q: 'Can I assign a new customer to an existing hierarchical clustering?', a: 'Not directly; there is no `predict` method. Common practice is to compute the centroid of each final cluster and assign new items to the nearest centroid, or train a simple classifier on the cluster labels.' },
      { q: 'How many items is too many?', a: 'Tens of thousands is usually the practical ceiling on a normal laptop because of the pairwise distance matrix. Beyond that, sample, aggregate, or use k-means first.' },
      { q: 'Is the order of leaves along the bottom meaningful?', a: 'No. Each join can be flipped left-to-right. Only the heights of the joins carry meaning.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────── DBSCAN
  dbscan: {
    minutes: 17,
    hook: 'A food-delivery company plots a month of drop-off locations across Chennai. The dense patches follow roads, wrap around tech parks and stretch along the beach: none of them are neat round blobs. There are also a few hundred lonely drop-offs far from anything. K-means would force every point, lonely ones included, into one of k round groups. **DBSCAN** instead says: "a cluster is wherever points are crowded together, whatever its shape, and points in empty space are just noise."',
    sections: [
      {
        heading: 'The problem: clusters with odd shapes, plus noise',
        blocks: [
          { p: 'K-means makes two quiet assumptions: clusters are roughly round, and every point belongs to some cluster. Real data often breaks both. Delivery hotspots follow streets. Fraud rings form tight knots inside a sea of normal customers. Sensor readings contain glitches that belong nowhere.' },
          { term: 'Density', def: 'How crowded a region is: how many data points lie within a small distance of a given spot. A busy market has high density of shoppers; an empty field has low density.' },
          { term: 'Noise point (outlier)', def: 'A point that does not belong to any cluster because it sits in a sparse region. DBSCAN gives these the label −1 instead of forcing them into a group.' },
          { p: '**DBSCAN** stands for Density-Based Spatial Clustering of Applications with Noise. The idea fits in one sentence: **clusters are dense regions separated by sparse regions.** You never tell it how many clusters to find; the number falls out of the data.' },
          { diagram: { kind: 'scatter', xLabel: 'feature 1', yLabel: 'feature 2', caption: 'Two interlocking crescents plus four stray points. DBSCAN finds the two crescents (blue and orange) and labels the strays as noise (green). K-means with k = 2 would slice straight across both crescents, because its boundaries are always straight lines.', points: [[3.3, 3.3, 1], [5.4, 1.6, 1], [1.2, 5.5, 0], [4.3, 2.2, 1], [0.1, 3.1, 0], [4.7, 1.8, 1], [8.5, 2.9, 1], [5.2, 5.1, 0], [7.2, 1.7, 1], [6.1, 1.4, 1], [6.6, 1.6, 1], [5.1, 5.5, 0], [5.6, 4.0, 0], [7.7, 2.1, 1], [3.5, 5.9, 0], [3.8, 2.4, 1], [0.4, 3.8, 0], [3.0, 5.8, 0], [8.7, 3.3, 1], [6.2, 3.7, 0], [3.1, 4.0, 1], [6.1, 3.0, 0], [3.1, 4.2, 1], [8.8, 4.7, 1], [9.2, 4.0, 1], [1.8, 5.6, 0], [2.1, 6.1, 0], [0.2, 4.5, 0], [0.7, 4.9, 0], [4.3, 5.7, 0], [0.5, 7.5, 2], [8.6, 7.2, 2], [9.2, 0.8, 2], [0.8, 1.0, 2]] } },
        ],
      },
      {
        heading: 'Building the intuition: crowds at a festival',
        blocks: [
          { p: 'Picture a drone photo of a music festival. You want to mark "crowds" on the photo. A sensible rule: **a person is in the thick of a crowd if at least four other people stand within arm\'s reach.**' },
          { steps: [
            '**Find the people in the thick of it.** Anyone with enough people within arm\'s reach is a crowd member at its heart.',
            '**Let crowds spread.** If two heart-of-the-crowd people are within arm\'s reach of each other, they belong to the same crowd. Chains of such people link up, so a crowd can snake along a food-stall lane or curve around the stage.',
            '**Add the people on the edge.** Someone who does not have four neighbours themselves, but stands within arm\'s reach of a heart-of-the-crowd person, is on the edge of that crowd.',
            '**Everyone else is a wanderer.** People alone in open space belong to no crowd.',
          ], title: 'The festival rule' },
          { p: 'Notice what you never had to decide: how many crowds there are, or what shape they should be. Two settings did all the work: the size of "arm\'s reach" and the minimum number of neighbours.' },
          { think: { q: 'If you make "arm\'s reach" much larger, what happens to the crowds?', a: 'More people count as being in the thick of it, crowds spread further and separate crowds start to merge, eventually into one giant crowd. Make arm\'s reach too small and almost everyone becomes a wanderer. Choosing this distance well is the main tuning job in DBSCAN.' } },
        ],
      },
      {
        heading: 'How the algorithm works, step by step',
        blocks: [
          { term: 'eps (ε)', def: 'The neighbourhood radius: how close two points must be to count as neighbours. It is "arm\'s reach" in the festival story. In scikit-learn the parameter is `eps`.' },
          { term: 'min_samples', def: 'The minimum number of points (in scikit-learn, counting the point itself) that must lie within eps for a point to be in a dense region.' },
          { term: 'Core, border and noise points', def: 'A core point has at least min_samples points within eps. A border point is not core itself but lies within eps of a core point. A noise point is neither.' },
          { diagram: { kind: 'flow', nodes: ['Choose **eps** and **min_samples**; scale features', 'Count neighbours within eps for every point', 'Mark **core points** (count ≥ min_samples)', 'Link core points within eps into clusters; attach **border** points', 'Label the rest **noise (−1)**'], caption: 'DBSCAN in five moves. There is no repeated loop as in k-means: one pass through the neighbourhoods is enough.' } },
          { steps: [
            'Standardise the features so that "within eps" means the same thing in every direction.',
            'For every point, find all points within distance eps (its neighbourhood).',
            'Points whose neighbourhood has at least min_samples members become core points.',
            'Start a cluster from any unvisited core point. Add every point in its neighbourhood. Whenever one of those added points is itself core, add its neighbourhood too. Keep expanding until nothing new is reachable. That is one cluster.',
            'Repeat from the next unvisited core point to grow the next cluster.',
            'Any point never reached from a core point is noise.',
          ] },
          { callout: 'Clusters grow only **through** core points. A border point can be pulled into a cluster, but it cannot pass the cluster on to its own neighbours. This is what stops two crowds from merging through a single person standing between them.', tone: 'key' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { p: 'DBSCAN has very little algebra. Its maths is a pair of precise definitions that turn the festival rule into something a computer can check.' },
          { tex: 'N_{\\varepsilon}(p) = \\{\\, q : d(p, q) \\le \\varepsilon \\,\\}', plain: 'The eps-neighbourhood of a point p is the set of all points q whose distance from p is at most eps. It includes p itself, because the distance from p to p is zero.', symbols: [['N_{\\varepsilon}(p)', 'neighbourhood of point p'], ['d(p,q)', 'distance between p and q (usually Euclidean)'], ['\\varepsilon', 'the radius eps']] },
          { tex: '|N_{\\varepsilon}(p)| \\ge \\text{minPts} \\;\\Rightarrow\\; p \\text{ is a core point}', plain: 'If the neighbourhood of p contains at least minPts points (min_samples in scikit-learn), p is a core point. The vertical bars mean "count the members".', symbols: [['|N_{\\varepsilon}(p)|', 'number of points in the neighbourhood'], ['\\text{minPts}', 'the min_samples setting']] },
          { term: 'Density-reachable', def: 'Point q is density-reachable from core point p if you can walk from p to q in hops of at most eps, where every stepping stone except possibly the last is a core point. A cluster is everything density-reachable from its core points.' },
          { p: 'Why define it this way? The chain of core points lets a cluster bend and stretch to any shape, because each hop only needs local crowding. The rule that only core points can extend the chain stops thin bridges of sparse points from gluing separate clusters together.' },
          { p: 'How much work is it? The expensive part is finding neighbours. Done naively, every point is compared with every other point, so the effort grows with the square of the number of points. With spatial index structures (scikit-learn uses KD-trees or ball trees where it can) it is much faster in low dimensions.' },
          { callout: 'In scikit-learn, `min_samples` counts the point itself. Some textbooks and other libraries count only the other points, so the same number can mean slightly different things. Check the documentation of the tool you use.', tone: 'warn' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Delivery drop-offs on a city grid', setup: 'Nine drop-off points on a map, in km: A (1, 1), B (2, 1), C (1, 2), D (2, 2), E (3.2, 2), F (6, 5), G (7, 5), H (6.5, 6), N (8, 1). Use eps = 1.5 km and min_samples = 3 (counting the point itself).', steps: [
            'A: within 1.5 km are B (1.0), C (1.0) and D (√2 ≈ 1.41). Neighbourhood = A, B, C, D = 4 points ≥ 3 → **core**.',
            'B, C: each also has three neighbours among A, B, C, D → **core**. D: has A, B, C and also E (1.2 km away) → **core**.',
            'E: only D is within 1.5 km (B is √(1.2² + 1²) ≈ 1.56 km, just outside). Neighbourhood = E, D = 2 points < 3 → not core. But E is within eps of core point D → **border**.',
            'F, G, H: F–G = 1.0, F–H = G–H ≈ 1.12. Each has 3 points in its neighbourhood → all **core**, forming a second cluster.',
            'N: nothing within 1.5 km → **noise**.',
          ], result: 'Two hotspots: cluster 1 = {A, B, C, D, E} with E on its edge, cluster 2 = {F, G, H}, and N is a one-off drop-off labelled −1. scikit-learn\'s DBSCAN returns exactly these labels.' } },
          { diagram: { kind: 'table', head: ['Point', 'Neighbours within 1.5 km', 'Count (incl. itself)', 'Type', 'Label'], rows: [['A, B, C', 'each other + D', '4', 'core', '0'], ['D', 'A, B, C, E', '5', 'core', '0'], ['E', 'D', '2', 'border', '0'], ['F, G, H', 'each other', '3', 'core', '1'], ['N', 'none', '1', 'noise', '−1']], caption: 'The neighbour counts decide everything. E has too few neighbours to be core, but it touches core point D, so it joins cluster 0 as a border point.' } },
          { example: { title: 'The same map with a different eps', setup: 'Keep min_samples = 3 and try eps = 1.0 km, then eps = 4.5 km.', steps: [
            'eps = 1.0: A still has B and C at exactly 1.0 km, so A, B, C and D remain core and form a cluster. E (1.2 km from D) is now outside every neighbourhood → noise.',
            'eps = 1.0: F has only G within 1.0 km (H is 1.12 away). Count = 2 → not core. G likewise; H has nobody. No core points there, so F, G and H all become noise.',
            'eps = 4.5: N is now about 4.47 km from G, every point has plenty of neighbours, and everything links up into one single cluster.',
          ], result: 'eps = 1.0 gives 1 cluster and 5 noise points; eps = 1.5 gives 2 clusters and 1 noise point; eps = 4.5 gives 1 giant cluster. The answer depends heavily on eps, which is why choosing it carefully matters.' } },
          { example: { title: 'Choosing eps with a k-distance list', setup: 'For each of the nine points, find the distance to its 2nd-nearest other point (min_samples − 1 = 2). Sort these distances.', steps: [
            'A, B, C, D: their 2nd-nearest neighbour is 1.0 km away.',
            'F, G, H: 1.12 km. E: 1.56 km. N: 4.47 km.',
            'Sorted: 1.0, 1.0, 1.0, 1.0, 1.12, 1.12, 1.12, 1.56, 4.47.',
            'The values creep up slowly and then jump from 1.56 to 4.47. That jump is the "knee".',
          ], result: 'A good eps sits just around the knee, roughly 1.5 to 2 km here: large enough to keep most points in clusters, small enough to leave N as noise.' } },
        ],
      },
      {
        heading: 'Choosing eps and min_samples in practice',
        blocks: [
          { p: 'The k-distance idea from the last example is the standard recipe. Compute each point\'s distance to its k-th nearest neighbour (k = min_samples − 1 in scikit-learn\'s counting), sort, plot, and pick eps where the curve bends sharply upwards.' },
          { diagram: { kind: 'bars', labels: ['A', 'B', 'C', 'D', 'F', 'G', 'H', 'E', 'N'], values: [1, 1, 1, 1, 1.12, 1.12, 1.12, 1.56, 4.47], highlight: 8, yLabel: 'distance to 2nd neighbour (km)', caption: 'The sorted k-distance plot for the delivery example. Points inside clusters have small values; the noise point N stands out at 4.47. Put eps just before the sharp rise.' } },
          { bullets: [
            '**min_samples:** a common rule of thumb is at least the number of features plus one, and about twice the number of features for noisy data. Larger values make the algorithm stricter about what counts as dense.',
            '**eps:** read it off the k-distance knee, then sanity-check by looking at the share of points labelled noise. If 40% of your customers are "noise", eps is probably too small.',
            '**Scale first.** eps is a single distance applied in every direction, so features must be on comparable scales. For latitude and longitude, use the haversine distance (`metric="haversine"`, with coordinates in radians) so eps is a real distance on the Earth.',
            '**When densities vary,** one eps cannot fit all clusters. **HDBSCAN** (in scikit-learn since version 1.3) effectively tries many eps values and keeps the most stable clusters.',
          ] },
          { think: { q: 'A city centre has very dense drop-offs and the suburbs have sparse ones. Why might a single eps fail?', a: 'An eps small enough to separate neighbouring city-centre hotspots will treat most suburban drop-offs as noise. An eps large enough to capture suburban hotspots will merge the city-centre ones into one blob. This is the main weakness of DBSCAN and the reason HDBSCAN exists.' } },
        ],
      },
      {
        heading: 'DBSCAN in the real world',
        blocks: [
          { case: { title: 'Finding dark-store locations from order data (illustrative)', story: 'A quick-commerce company wants to place small warehouses so most orders can be delivered within 15 minutes. Analysts take three months of order coordinates, run DBSCAN with the haversine distance, eps of about 400 m and a min_samples chosen so that a cluster represents meaningful daily demand. The result is a set of irregular hotspots that follow residential streets and office parks, plus about 6% of orders labelled noise. The hotspots guide where to rent space; the noise orders are served from the nearest hotspot at a longer promised delivery time rather than distorting the warehouse plan. K-means had earlier placed one centroid in the middle of a lake between two neighbourhoods, which is the classic failure DBSCAN avoids.' } },
          { bullets: [
            '**Fraud and security:** a tight knot of accounts sharing devices and addresses forms a dense cluster in an otherwise sparse space.',
            '**Manufacturing:** clusters of defect locations on a wafer or a car body panel reveal a faulty tool; scattered single defects are noise.',
            '**Geospatial analysis:** accident hotspots, popular pickup points for ride-hailing, crowded areas from mobile data.',
            '**Data cleaning:** points labelled noise are candidates for manual review before training other models.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Varying densities:** one eps cannot serve both dense and sparse clusters. Use HDBSCAN or OPTICS.',
            '**High dimensions:** in many dimensions all points look roughly equally far apart, so "within eps" loses meaning. Reduce dimensions first (PCA) or use a more suitable distance.',
            '**Sensitive to eps:** small changes can merge or split clusters, as the worked example showed.',
            '**Border points can be ambiguous:** a border point within eps of core points from two clusters is given to whichever cluster reaches it first, so it can change with data order.',
            '**No centroids:** clusters have no centre to describe them, and there is no `predict` for new points. Assign new points by checking whether they fall within eps of an existing core point.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'DBSCAN', items: ['Finds the number of clusters itself', 'Any shape: crescents, rings, streets', 'Labels noise as −1', 'Struggles when densities differ', 'Two settings: eps and min_samples'] }, right: { title: 'K-means', items: ['You must choose k', 'Round clusters with straight boundaries', 'Forces every point into a cluster', 'Handles different densities, but assumes similar sizes', 'One main setting: k'] }, caption: 'Choose DBSCAN for spatial data, odd shapes and outlier-heavy data; choose k-means for compact segments on large datasets.' } },
          { callout: 'Noise points are not rubbish. In fraud or quality work the points DBSCAN rejects are often the most interesting ones; the anomaly-detection chapter builds on exactly this idea.', tone: 'tip' },
        ],
      },
    ],
    faq: [
      { q: 'Do I have to tell DBSCAN how many clusters I want?', a: 'No. The number of clusters comes out of eps and min_samples. That is a key difference from k-means.' },
      { q: 'What does the label −1 mean?', a: 'Noise: the point is not within eps of any core point, so it belongs to no cluster.' },
      { q: 'Why do I get one giant cluster?', a: 'eps is too large (or features are unscaled so one feature dominates). Use the k-distance plot to pick eps and standardise your features.' },
      { q: 'Why is almost everything noise?', a: 'eps is too small or min_samples too large for your data\'s density. Increase eps a little at a time and watch the noise share.' },
      { q: 'Can DBSCAN handle millions of points?', a: 'Often yes in low dimensions thanks to spatial indexes, but memory can grow quickly if eps is large and neighbourhoods are huge. HDBSCAN and sampling help for very large data.' },
      { q: 'What is the difference between DBSCAN and HDBSCAN?', a: 'HDBSCAN removes the need for a single eps by examining clusters across many density levels and keeping the stable ones. It handles clusters of different densities much better and is usually the stronger default today.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────── GAUSSIAN MIXTURE MODELS
  gmm: {
    minutes: 17,
    hook: 'A telecom operator segments its mobile customers by monthly spend. Most budget users spend around ₹200 and most premium users around ₹600, but a customer spending ₹400 sits right between them. K-means must call her "budget" or "premium", full stop. A **Gaussian Mixture Model** says something more realistic: "about 43% budget-like, 57% premium-like." That one change, from hard labels to probabilities, makes many marketing and risk decisions better.',
    sections: [
      {
        heading: 'The problem: groups that overlap',
        blocks: [
          { p: 'In the k-means chapter every point belonged to exactly one cluster. That is fine when groups are well separated. When groups overlap, a hard label throws away useful information: the customer on the boundary is treated exactly like the customer at the heart of the segment.' },
          { term: 'Soft clustering', def: 'Clustering in which each item gets a probability of belonging to each cluster (for example 70% A, 30% B) instead of a single label.' },
          { term: 'Gaussian (normal) distribution', def: 'The familiar bell curve. It is described by a centre (the mean) and a spread (the standard deviation, or in several dimensions the covariance). Most values sit near the centre; very far values are rare.' },
          { p: 'A Gaussian Mixture Model (GMM) assumes the data was produced by **several bell curves added together**, each representing one hidden group. Each bell has its own centre, its own width and its own share of the population. Fitting a GMM means working out those centres, widths and shares from the data alone.' },
          { diagram: { kind: 'curve', fn: '0.6*Math.exp(-(x-2)*(x-2)/2)/Math.sqrt(2*Math.PI)', fn2: '0.4*Math.exp(-(x-6)*(x-6)/4.5)/(1.5*Math.sqrt(2*Math.PI))', xMin: -1, xMax: 11, marks: [{ x: 4, label: '₹400' }], xLabel: 'monthly spend (₹ hundred)', yLabel: 'density', legend: ['budget: 60% share, centre ₹200', 'premium: 40% share, centre ₹600'], caption: 'Two overlapping bell curves. The budget group is larger and narrower; the premium group is smaller and wider. At ₹400 both curves have some height, so a customer there could plausibly belong to either group.' } },
        ],
      },
      {
        heading: 'Building the intuition: two orchards, one truck',
        blocks: [
          { p: 'A fruit trader receives one truck of mangoes mixed from two orchards. Orchard A grows smaller mangoes, orchard B larger ones, but sizes overlap. Nobody labelled the fruit. Can she work out the typical size from each orchard, and the share from each, just by weighing mangoes?' },
          { steps: [
            '**Make a rough guess.** "Orchard A mangoes weigh about 200 g, orchard B about 350 g, and the truck is half and half."',
            '**Give each mango partial credit.** A 210 g mango is very likely from A, so give it, say, 95% to A and 5% to B. A 280 g mango is ambiguous: perhaps 50/50.',
            '**Update the guesses using the partial credit.** The new typical size for A is the average weight of all mangoes, weighted by how much each one was credited to A. The share of A is the total credit A received divided by the number of mangoes.',
            '**Repeat.** With better orchard descriptions, the partial credits improve, which improves the descriptions again.',
            '**Stop when nothing changes much.**',
          ], title: 'Guess, credit, update, repeat' },
          { p: 'This loop is called **Expectation–Maximisation (EM)**. If it reminds you of k-means, it should: k-means is the same loop with "full credit to the nearest centre only" instead of partial credit.' },
          { think: { q: 'In k-means, a point on the border between two clusters pulls one centroid fully towards it. What does it do in a GMM?', a: 'It pulls both centres a little, in proportion to its partial credit. A 50/50 point contributes half its weight to each group. Ambiguous points therefore have less influence on any single group, which makes the estimates smoother and more stable.' } },
        ],
      },
      {
        heading: 'How the algorithm works, step by step',
        blocks: [
          { term: 'Responsibility', def: 'The partial credit: the probability that a given point came from a given component, according to the current model. Each point\'s responsibilities add up to 1.' },
          { term: 'Covariance', def: 'In several dimensions, the description of a bell\'s shape: how wide it is along each feature and whether it is tilted (features rising together). It lets GMM clusters be stretched ellipses rather than circles.' },
          { diagram: { kind: 'flow', nodes: ['**Initialise** K components (often from a k-means run)', '**E-step:** compute each point\'s responsibilities', '**M-step:** update shares, means and covariances using the responsibilities', 'Did the log-likelihood stop improving? **No → repeat**', '**Yes → stop.** Report probabilities and parameters'], caption: 'The EM loop for a Gaussian Mixture Model. "E" (expectation) assigns partial credit; "M" (maximisation) refits the bells to that credit.' } },
          { p: '**Step 1: Initialise.** Choose the number of components K and starting values. scikit-learn\'s `GaussianMixture` starts from a k-means result by default, which is usually a good starting point.' },
          { p: '**Step 2: E-step.** For every point and every component, ask: "How likely is this point under this bell, times this bell\'s share?" Then divide by the total across bells so the answers add to 1. These are the responsibilities.' },
          { p: '**Step 3: M-step.** Refit each bell as if the responsibilities were fractional memberships: new share = average responsibility; new mean = responsibility-weighted average; new spread = responsibility-weighted spread around the new mean.' },
          { p: '**Step 4: Check.** Compute the log-likelihood, a single score of how well the whole mixture explains the data. EM is guaranteed never to make it worse. When the improvement becomes tiny, stop.' },
          { term: 'Log-likelihood', def: 'A score for how probable the observed data is under the model, on a logarithmic scale. Higher (less negative) means the model explains the data better. Logarithms turn long products of small probabilities into manageable sums.' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { p: 'We will stay in one dimension (one feature) so the formulas are readable. The many-feature version replaces the variance with a covariance matrix but keeps exactly the same structure.' },
          { tex: 'p(x) = \\sum_{k=1}^{K} \\pi_k \\, \\mathcal{N}(x \\mid \\mu_k, \\sigma_k^2)', plain: 'The chance of seeing value x is a weighted sum of K bell curves. Each bell is weighted by its share of the population.', symbols: [['\\pi_k', 'share (weight) of component k; the shares add to 1'], ['\\mathcal{N}(x \\mid \\mu_k, \\sigma_k^2)', 'height of bell k at x'], ['\\mu_k', 'centre of bell k'], ['\\sigma_k', 'standard deviation (width) of bell k']] },
          { tex: '\\mathcal{N}(x \\mid \\mu, \\sigma^2) = \\frac{1}{\\sigma\\sqrt{2\\pi}} \\, e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}', plain: 'The bell-curve formula. The further x is from the centre, measured in units of the width, the smaller the height. Dividing by σ keeps the area under every bell equal to 1, so wide bells are lower.' },
          { tex: 'r_{ik} = \\frac{\\pi_k \\, \\mathcal{N}(x_i \\mid \\mu_k, \\sigma_k^2)}{\\sum_{j=1}^{K} \\pi_j \\, \\mathcal{N}(x_i \\mid \\mu_j, \\sigma_j^2)}', plain: 'E-step. The responsibility of component k for point i is that component\'s weighted height at the point, divided by the total weighted height of all components. This is Bayes\' rule: share is the prior, bell height is the evidence.', symbols: [['r_{ik}', 'responsibility of component k for point i'], ['x_i', 'the i-th data point']] },
          { tex: 'N_k = \\sum_i r_{ik}, \\quad \\pi_k = \\frac{N_k}{n}, \\quad \\mu_k = \\frac{1}{N_k}\\sum_i r_{ik}\\, x_i, \\quad \\sigma_k^2 = \\frac{1}{N_k}\\sum_i r_{ik}\\,(x_i - \\mu_k)^2', plain: 'M-step. N_k is the "effective number of points" in component k (the sum of its partial credits). The share is that number divided by the total; the mean and variance are ordinary averages, but every point is weighted by its responsibility.', symbols: [['N_k', 'effective count of points in component k'], ['n', 'total number of points']] },
          { p: 'Why does this work? Directly maximising the likelihood of a mixture is hard because we do not know which bell each point came from. EM breaks the problem into two easy halves: if we knew the memberships, fitting bells is just weighted averaging; if we knew the bells, memberships follow from Bayes\' rule. Alternating between the halves climbs steadily uphill.' },
          { callout: 'Like k-means, EM climbs to a local optimum, not necessarily the best one. Use several starts (`n_init` in scikit-learn) and keep the run with the highest likelihood.', tone: 'warn' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'E-step: the ₹400 customer', setup: 'Two components for monthly spend in ₹ hundred. Budget: share 0.6, mean 2, SD 1. Premium: share 0.4, mean 6, SD 1.5. Compute responsibilities for a customer at x = 4 (₹400).', steps: [
            'Budget bell height at 4: the point is 2 SDs from the mean, so height = e^(−2) / √(2π) ≈ 0.0540.',
            'Premium bell height at 4: the point is 2 / 1.5 ≈ 1.33 SDs away, height ≈ 0.1093 (lower peak because the bell is wider, but the point is relatively closer).',
            'Weighted heights: budget 0.6 × 0.0540 ≈ 0.0324; premium 0.4 × 0.1093 ≈ 0.0437. Total ≈ 0.0761.',
            'Responsibilities: budget = 0.0324 / 0.0761 ≈ 0.43; premium = 0.0437 / 0.0761 ≈ 0.57.',
          ], result: 'Although ₹400 is exactly halfway between the centres and the budget group is bigger, the customer is 57% premium. The premium bell is wider, so ₹400 is less unusual for it. K-means, which only looks at distance to centres, would call this a coin toss.' } },
          { diagram: { kind: 'table', head: ['Spend (₹)', 'Budget weighted height', 'Premium weighted height', 'P(budget)', 'P(premium)'], rows: [['250', '0.2112', '0.0070', '0.97', '0.03'], ['300', '0.1452', '0.0144', '0.91', '0.09'], ['400', '0.0324', '0.0437', '0.43', '0.57'], ['500', '0.0027', '0.0852', '0.03', '0.97']], caption: 'Responsibilities change smoothly as spend rises. Only customers near the overlap (around ₹350–₹450) get truly mixed probabilities; the rest are almost certainly in one group.' } },
          { example: { title: 'M-step: refitting from partial credit', setup: 'Four customers spend 1, 2, 5 and 6 (₹ hundred). After an E-step their responsibilities for the budget component are 0.95, 0.80, 0.15 and 0.05 (so 0.05, 0.20, 0.85 and 0.95 for premium).', steps: [
            'Effective count, budget: 0.95 + 0.80 + 0.15 + 0.05 = 1.95. Premium: 4 − 1.95 = 2.05.',
            'New shares: budget 1.95 / 4 ≈ 0.49, premium 2.05 / 4 ≈ 0.51.',
            'New budget mean: (0.95×1 + 0.80×2 + 0.15×5 + 0.05×6) / 1.95 = 3.60 / 1.95 ≈ 1.85.',
            'New premium mean: (0.05×1 + 0.20×2 + 0.85×5 + 0.95×6) / 2.05 = 10.40 / 2.05 ≈ 5.07.',
            'New SDs (responsibility-weighted spread around each new mean): budget ≈ 1.25, premium ≈ 1.31.',
          ], result: 'Every customer contributed to both components in proportion to its credit. The next E-step uses these new values, and the loop continues until the numbers stop moving.' } },
          { example: { title: 'Choosing the number of components with BIC', setup: 'A GMM is fitted to 1,000 customers\' spend (one feature) with K = 1 to 4 components. A 1-D mixture with K components has 3K − 1 free parameters (K means, K variances, K − 1 independent shares). Illustrative log-likelihoods: −2,100, −1,980, −1,972, −1,968.', steps: [
            'BIC = (number of parameters) × ln(n) − 2 × log-likelihood, with ln(1000) ≈ 6.91.',
            'K = 1: 2 × 6.91 + 4,200 ≈ 4,213.8.',
            'K = 2: 5 × 6.91 + 3,960 ≈ 3,994.5.',
            'K = 3: 8 × 6.91 + 3,944 ≈ 3,999.3.',
            'K = 4: 11 × 6.91 + 3,936 ≈ 4,012.0.',
          ], result: 'Lowest BIC is at K = 2. Going from 2 to 3 components improves the fit by only 8 log-likelihood units, not enough to pay for 3 extra parameters.' } },
        ],
      },
      {
        heading: 'Choosing K and the shape of the clusters',
        blocks: [
          { term: 'BIC (Bayesian Information Criterion)', def: 'A score that rewards fitting the data well but charges a penalty for every extra parameter. Lower is better. It helps choose how many components a model should have without overfitting.' },
          { tex: '\\text{BIC} = p \\ln(n) - 2 \\ln \\hat{L}', plain: 'BIC adds a complexity penalty (number of parameters times the log of the sample size) to a misfit term (minus twice the log-likelihood). Adding components always improves the likelihood, so the penalty is what stops you adding components forever.', symbols: [['p', 'number of free parameters'], ['n', 'number of data points'], ['\\hat{L}', 'maximised likelihood']] },
          { diagram: { kind: 'bars', labels: ['K=1', 'K=2', 'K=3', 'K=4'], values: [4213.8, 3994.5, 3999.3, 4012.0], highlight: 1, yLabel: 'BIC (lower is better)', caption: 'BIC from the worked example. It falls sharply from one to two components, then rises again as extra components add parameters faster than they improve the fit.' } },
          { p: 'In more than one dimension you also choose how flexible each bell\'s shape may be. scikit-learn offers four `covariance_type` options:' },
          { bullets: [
            '**full:** each component can be any tilted ellipse. Most flexible, most parameters.',
            '**tied:** all components share the same ellipse shape.',
            '**diag:** ellipses aligned with the feature axes (no tilt).',
            '**spherical:** circles, each with its own size. This is closest to k-means.',
          ] },
          { callout: 'K-means is a limiting case of a GMM: give every component the same tiny circular spread and the responsibilities become all-or-nothing, which is exactly hard assignment to the nearest centre.', tone: 'key' },
        ],
      },
      {
        heading: 'Gaussian mixtures in the real world',
        blocks: [
          { case: { title: 'Persona-weighted offers at a telecom operator (illustrative)', story: 'A telecom operator describes each customer by monthly spend, data usage and international calling minutes. After standardising, a full-covariance GMM with four components (chosen by BIC) finds personas the team names "light users", "data streamers", "family plans" and "international callers". Instead of one label per customer, the CRM stores all four probabilities. Customers who are clearly one persona get that persona\'s offer. Customers split between "data streamers" and "family plans" get a combined pack. Customers whose overall likelihood under the model is very low are flagged as unusual accounts for a separate review. Results are measured by an A/B test of offer take-up against the previous hard-segment approach.' } },
          { bullets: [
            '**Speech technology:** GMMs were for many years the standard way to model the sound patterns of individual speakers in speaker-recognition systems.',
            '**Video:** classic background-subtraction methods (such as OpenCV\'s MOG2) model each pixel\'s colour over time as a mixture of Gaussians to separate moving objects from the background.',
            '**Anomaly detection:** points with very low probability under the fitted mixture are unusual.',
            '**Density estimation:** a GMM gives a smooth estimate of the full distribution, useful for simulation and synthetic data.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Bell-shaped assumption:** clusters shaped like crescents or rings are not mixtures of a few Gaussians. DBSCAN suits those better.',
            '**Too many parameters:** a full covariance with 50 features needs 1,275 numbers per component. With few rows this is unstable; use diag or tied covariance, or reduce dimensions first.',
            '**Collapsing components:** a component can shrink onto one or two points and its variance heads to zero. scikit-learn adds a small `reg_covar` to prevent this.',
            '**Local optima:** different starts can give different answers; use `n_init` greater than 1.',
            '**Scaling:** with diag or spherical covariances, unscaled features still distort the result, so standardise as usual.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'Gaussian Mixture Model', items: ['Soft: probabilities of membership', 'Elliptical clusters of different sizes and tilts', 'Gives a full probability model of the data', 'Choose K with BIC', 'Slower; more parameters'] }, right: { title: 'K-means', items: ['Hard: one label per point', 'Round clusters with straight boundaries', 'No probability model', 'Choose k with elbow or silhouette', 'Very fast and simple'] }, caption: 'Use a GMM when overlap matters or you need probabilities; start with k-means when you just need fast, simple segments.' } },
          { callout: 'A probability of 0.57 is only as trustworthy as the model behind it. If the real groups are not bell-shaped, the probabilities can be confidently wrong. Check the fit, for example by comparing the fitted mixture to a histogram of each feature.', tone: 'warn' },
        ],
      },
    ],
    faq: [
      { q: 'Is a GMM just a better k-means?', a: 'It is a more flexible relative. It gives probabilities and elliptical clusters, but it has more parameters, needs more data and runs more slowly. On large, well-separated data, k-means is often good enough.' },
      { q: 'What does `predict_proba` return?', a: 'For each row, the responsibilities: one probability per component, adding up to 1. `predict` simply returns the component with the highest probability.' },
      { q: 'What do E and M stand for?', a: 'Expectation (compute the expected memberships, i.e. the responsibilities, under the current model) and Maximisation (choose parameters that maximise the likelihood given those memberships).' },
      { q: 'How do I choose the number of components?', a: 'Fit several values of K and compare BIC (lower is better). Then check that the components make business sense.' },
      { q: 'Does my data have to be normally distributed?', a: 'Each cluster is modelled as a bell curve, so the closer the true groups are to bell shapes, the better. Skewed features (like income) often benefit from a log transform first.' },
      { q: 'Can a GMM detect outliers?', a: 'Yes. `score_samples` gives each point\'s log-probability under the model; the lowest-scoring points are candidates for anomalies.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────── PCA
  pca: {
    minutes: 16,
    hook: 'An electric-vehicle test team logs dozens of readings on every drive: motor temperature, battery temperature, current draw, speed, vibration, outside temperature and more. Many of them move together: when the car works hard, motor heat, battery heat and current all rise at once. Forty columns may really be describing three or four underlying stories. **Principal Component Analysis (PCA)** finds those few stories and lets you work with them instead of the forty raw columns.',
    sections: [
      {
        heading: 'The problem: too many columns that say the same thing',
        blocks: [
          { p: 'Modern datasets are wide. A customer table can have 200 behavioural features, a factory sensor feed 500 signals, a survey 30 questions. Wide data is hard to plot, slow to model, and full of **redundancy**: columns that largely repeat each other.' },
          { term: 'Dimension', def: 'In data science, simply a feature or column. A dataset with 40 features is called 40-dimensional, because each row is a point in a 40-axis space.' },
          { term: 'Dimensionality reduction', def: 'Replacing many features with a smaller number of new features while keeping as much of the useful information as possible.' },
          { p: 'PCA is the oldest and most widely used dimensionality-reduction method. It creates new features, called **principal components**, that are combinations of the old ones. The first component captures as much of the variation in the data as any single direction can. The second captures as much of what remains as possible, and so on. Often a handful of components capture most of the information.' },
          { diagram: { kind: 'scatter', xLabel: 'feature 1', yLabel: 'feature 2', line: { m: 1.04, b: 0.68 }, caption: 'Five points that rise together. The line is the first principal component: the direction along which the points are most spread out. Describing each point by its position along this line alone keeps about 98% of the variation (worked example 2).', points: [[1, 2, 0], [2, 3, 0], [3, 3, 0], [4, 5, 0], [5, 6, 0]] } },
        ],
      },
      {
        heading: 'Building the intuition: photographing a teapot',
        blocks: [
          { p: 'You must sell a teapot online with a single photograph. Shoot it from directly above and you see a circle: it could be a plate. Shoot it from the side and you see the spout, the handle and the lid: almost everything that makes it a teapot. A good angle keeps the most information in a flat picture.' },
          { steps: [
            '**Walk around the object** and look at it from every possible angle.',
            '**Pick the angle that shows the most variety** (spout to handle is the widest view). That is your first photograph.',
            '**For the second photo, turn exactly 90 degrees** so it shows only new information, nothing repeated from the first.',
            '**Stop when extra photos add little.** Two or three good angles describe the teapot almost completely.',
          ], title: 'Choosing the best views' },
          { p: 'PCA does the same with data. Each row is a point in many dimensions. PCA looks at the cloud of points from every direction, picks the direction where the points are most spread out, then the next best direction at right angles to the first, and so on.' },
          { term: 'Variance', def: 'How spread out values are around their average: the average squared distance from the mean. In PCA, more variance along a direction means more information about how the points differ from each other.' },
          { think: { q: 'Why would PCA insist that the second direction is at right angles to the first?', a: 'So that it carries no repeated information. Directions at right angles give uncorrelated components: knowing a point\'s score on component 1 tells you nothing about its score on component 2. Each new component adds something new.' } },
        ],
      },
      {
        heading: 'How PCA works, step by step',
        blocks: [
          { term: 'Principal component', def: 'A new axis that is a weighted combination of the original features, chosen to capture as much variance as possible while being at right angles to the earlier components.' },
          { term: 'Loadings', def: 'The weights that say how much each original feature contributes to a component. Large positive or negative loadings tell you what a component "means".' },
          { diagram: { kind: 'flow', nodes: ['**Standardise** every feature (mean 0, SD 1)', 'Compute the **covariance** (here correlation) matrix', 'Find its **eigenvectors** and **eigenvalues**', 'Sort by eigenvalue; keep the top k', '**Project** each row onto the k components'], caption: 'The PCA recipe. Directions come from the eigenvectors; the amount of variance each direction carries comes from the eigenvalues.' } },
          { steps: [
            '**Standardise.** Subtract each feature\'s mean and divide by its standard deviation, so a feature measured in rupees does not dominate one measured in percentages.',
            '**Measure how features move together** with the covariance matrix: a table showing, for every pair of features, whether they rise and fall together.',
            '**Find the special directions** of that matrix (eigenvectors) and how much variance lies along each (eigenvalues).',
            '**Rank the directions** from most to least variance and decide how many to keep.',
            '**Convert each row** into its scores on the kept components. These scores are your new, shorter set of features.',
          ] },
          { callout: 'In scikit-learn this is three lines: `StandardScaler`, then `PCA(n_components=0.95)` (keep enough components for 95% of the variance), then `fit_transform`. The attribute `explained_variance_ratio_` tells you how much each component holds.', tone: 'tip' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { term: 'Covariance', def: 'A number measuring whether two features move together: positive if they tend to be above average at the same time, negative if one is high when the other is low, near zero if unrelated. For standardised features it equals the correlation.' },
          { tex: '\\Sigma = \\frac{1}{n-1} X_c^{\\top} X_c', plain: 'The covariance matrix. Centre the data (subtract each column\'s mean), multiply the centred table by itself in a particular way, and divide by n − 1. The result has the variance of each feature on its diagonal and the covariance of each pair off the diagonal.', symbols: [['\\Sigma', 'covariance matrix (features × features)'], ['X_c', 'the centred data table (rows × features)'], ['n', 'number of rows']] },
          { tex: '\\Sigma \\, v = \\lambda \\, v', plain: 'The eigenvector equation. An eigenvector v is a direction that the covariance matrix only stretches, never turns. The stretch factor λ (the eigenvalue) equals the variance of the data along that direction.', symbols: [['v', 'eigenvector: a direction, the loadings of one component'], ['\\lambda', 'eigenvalue: variance along that direction']] },
          { term: 'Eigenvector and eigenvalue', def: 'For a covariance matrix, the eigenvectors are the principal directions of the data cloud and each eigenvalue is how much variance lies along its eigenvector. There are as many as there are features.' },
          { tex: '\\text{explained variance ratio}_k = \\frac{\\lambda_k}{\\lambda_1 + \\lambda_2 + \\dots + \\lambda_p}', plain: 'The share of all the variation that component k captures: its eigenvalue divided by the sum of all eigenvalues. For standardised data the sum equals the number of features.', symbols: [['p', 'number of original features']] },
          { tex: 'z_{ik} = (x_i - \\mu) \\cdot v_k', plain: 'The score of row i on component k: centre the row, then take the weighted sum of its features using the loadings of component k as weights.', symbols: [['z_{ik}', 'score of row i on component k'], ['\\mu', 'the vector of feature means']] },
          { p: 'Why eigenvectors? We want the direction v that maximises the variance of the projected scores. That variance works out to vᵀΣv. Maximising it over directions of length one leads, by a standard calculus argument, exactly to the eigenvector equation, and the maximum variance achieved is the largest eigenvalue. Each later component solves the same problem while staying at right angles to the earlier ones.' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Two standardised features with correlation 0.8', setup: 'Two survey scores, already standardised: "satisfaction with product" and "likelihood to recommend". Their correlation is 0.8, so the covariance matrix is [[1, 0.8], [0.8, 1]].', steps: [
            'For a 2 × 2 matrix of this form, the eigenvalues are 1 + 0.8 = 1.8 and 1 − 0.8 = 0.2.',
            'Eigenvectors: (0.707, 0.707) for 1.8, i.e. "both scores together"; and (0.707, −0.707) for 0.2, i.e. "the difference between them".',
            'Explained variance: 1.8 / 2 = 90% for PC1 and 0.2 / 2 = 10% for PC2.',
            'A respondent with scores (1.2, 0.8): PC1 score = 0.707 × 1.2 + 0.707 × 0.8 ≈ 1.41; PC2 score = 0.707 × 1.2 − 0.707 × 0.8 ≈ 0.28.',
            'Keeping only PC1 and mapping back: 1.41 × (0.707, 0.707) ≈ (1.0, 1.0), close to the original (1.2, 0.8).',
          ], result: 'One number, an "overall advocacy" score, keeps 90% of the information in two questions. The small PC2 captures the rare cases where people like the product but would not recommend it.' } },
          { example: { title: 'PCA by hand on five raw points', setup: 'Five points (x, y): (1, 2), (2, 3), (3, 3), (4, 5), (5, 6). We keep the original units this time to see each calculation.', steps: [
            'Means: x̄ = 3, ȳ = 3.8. Centred x: −2, −1, 0, 1, 2. Centred y: −1.8, −0.8, −0.8, 1.2, 2.2.',
            'Variance of x = (4 + 1 + 0 + 1 + 4) / 4 = 2.5. Variance of y = (3.24 + 0.64 + 0.64 + 1.44 + 4.84) / 4 = 2.7. Covariance = (3.6 + 0.8 + 0 + 1.2 + 4.4) / 4 = 2.5.',
            'Eigenvalues of [[2.5, 2.5], [2.5, 2.7]]: 2.6 ± √(0.1² + 2.5²) = 2.6 ± 2.502, giving 5.102 and 0.098.',
            'Explained variance: 5.102 / 5.2 ≈ 98.1% for PC1, 1.9% for PC2. The PC1 direction is about (0.693, 0.721).',
            'Score of the first point on PC1: (−2) × 0.693 + (−1.8) × 0.721 ≈ −2.68.',
          ], result: 'Two columns compress into one with almost no loss. The scatter plot in the first section shows this PC1 line running through the cloud.' } },
          { example: { title: 'How many components for an EV sensor dataset?', setup: 'Six standardised sensor readings from EV test drives. The eigenvalues of their correlation matrix are 3.1, 1.5, 0.7, 0.4, 0.2 and 0.1 (illustrative). They add to 6, the number of features.', steps: [
            'Explained variance: 3.1/6 ≈ 51.7%, 1.5/6 = 25.0%, 0.7/6 ≈ 11.7%, 0.4/6 ≈ 6.7%, 0.2/6 ≈ 3.3%, 0.1/6 ≈ 1.7%.',
            'Cumulative: 51.7%, 76.7%, 88.3%, 95.0%, 98.3%, 100%.',
            'Rule "keep 95%": four components. Rule "keep eigenvalues above 1" (the Kaiser rule): two components.',
          ], result: 'The team keeps four components for an anomaly model, where small details matter, and two for dashboards, where a simple 2-D map is enough.' } },
        ],
      },
      {
        heading: 'Reading the output: explained variance and loadings',
        blocks: [
          { diagram: { kind: 'bars', labels: ['PC1', 'PC2', 'PC3', 'PC4', 'PC5', 'PC6'], values: [51.7, 25.0, 11.7, 6.7, 3.3, 1.7], highlight: 0, yLabel: '% of variance explained', caption: 'A scree plot for the EV example. The bars fall quickly and flatten after PC3 or PC4. As with the k-means elbow, the bend suggests how many components are worth keeping.' } },
          { p: 'Once you know how many components to keep, you want to know what they mean. The loadings tell you. Look for the features with the largest weights (positive or negative) on each component and ask what they have in common.' },
          { diagram: { kind: 'table', head: ['Sensor', 'PC1 loading', 'PC2 loading'], rows: [['Motor temperature', '0.48', '−0.29'], ['Battery temperature', '0.47', '−0.23'], ['Current draw', '0.45', '0.04'], ['Speed', '0.42', '0.22'], ['Vibration', '0.38', '−0.04'], ['Outside temperature', '0.17', '0.90']], caption: 'Illustrative loadings. PC1 weights the work-related sensors almost equally, so it reads as "how hard the car is working". PC2 is dominated by outside temperature, so it reads as "weather conditions".' } },
          { bullets: [
            '**Signs are arbitrary.** A component and its mirror image (all loadings multiplied by −1) are equally valid; different software may flip them.',
            '**Scores are new features.** Use them in regression, clustering or charts like any other column.',
            '**Choosing k:** a cumulative target (90–95%) for modelling; 2 or 3 for visualisation; or the scree-plot bend.',
          ] },
          { callout: 'High variance is not the same as importance for your prediction. A low-variance component can carry the signal that predicts failures. If you use PCA before a supervised model, choose k by validation performance, not only by explained variance.', tone: 'warn' },
        ],
      },
      {
        heading: 'PCA in the real world',
        blocks: [
          { case: { title: 'Level, slope and curvature of the yield curve', story: 'Interest rates for many maturities (3 months, 1 year, 5 years, 10 years, 30 years) move largely together. A classic and widely replicated finding in finance is that PCA on daily changes in these rates gives three components that explain most of the movement: a **level** component (all rates up or down together), a **slope** component (short rates moving against long rates) and a **curvature** component (the middle moving against the ends). Risk teams therefore describe a bond portfolio\'s exposure with three numbers instead of dozens, and stress-test it by shocking those three factors.' } },
          { bullets: [
            '**Surveys:** compress 20 correlated satisfaction questions into a few indices such as "overall satisfaction" and "value versus service".',
            '**Images:** the classic "eigenfaces" method represents face images by a few dozen components instead of thousands of pixels.',
            '**Genomics:** PCA of genetic data famously separates populations by geography on a 2-D plot.',
            '**Pre-processing:** speed up models and reduce noise before clustering or regression; also remove multicollinearity, since components are uncorrelated.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Forgetting to scale.** Without standardising, a feature with large units (salary in rupees) takes over PC1 simply because its numbers are big.',
            '**Leakage.** Fit the scaler and PCA on training data only, then apply them to test data, ideally inside a scikit-learn `Pipeline`.',
            '**Only straight-line structure.** PCA finds flat directions. Data lying on a curved surface (a spiral, a ring) needs non-linear methods such as t-SNE or UMAP (next chapter) or kernel PCA.',
            '**Outliers.** A few extreme points can tilt the components, because variance squares distances.',
            '**Harder to explain.** "PC3 increased" means little to a plant manager until you translate it through the loadings.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'PCA', items: ['Linear: rotates and drops axes', 'Fast and deterministic', 'Preserves global structure and large distances', 'Can transform new data', 'Good for modelling and compression'] }, right: { title: 't-SNE / UMAP', items: ['Non-linear: bends and stretches', 'Slower; results vary between runs', 'Preserves local neighbourhoods', 't-SNE cannot transform new data; UMAP can', 'Good for 2-D visual exploration'] }, caption: 'Use PCA for features you feed into models; use t-SNE or UMAP for pictures you look at. A common pipeline runs PCA to about 50 dimensions first, then t-SNE or UMAP to 2.' } },
          { callout: 'If you have labels and want directions that separate classes rather than directions of maximum spread, look at Linear Discriminant Analysis (LDA), the supervised cousin of PCA.', tone: 'key' },
        ],
      },
    ],
    faq: [
      { q: 'Is PCA a feature-selection method?', a: 'No. Feature selection keeps some original columns and drops others. PCA builds new columns that mix all the original ones.' },
      { q: 'Do I always need to standardise?', a: 'Almost always, when features have different units. Only skip it if all features share the same units and you want larger-variance features to count more.' },
      { q: 'How many components should I keep?', a: 'Common rules: enough for 90–95% cumulative explained variance, the bend in the scree plot, or simply 2–3 for plotting. For a predictive model, tune k by validation.' },
      { q: 'Can PCA handle categorical data?', a: 'Not directly; it needs numbers. One-hot encoded data can be used with care, but methods such as multiple correspondence analysis are designed for categories.' },
      { q: 'Why do my component signs differ from a colleague\'s?', a: 'Eigenvectors are only defined up to a sign flip. Both versions describe the same axis; interpret the pattern of loadings, not the sign.' },
      { q: 'Does PCA lose information?', a: 'Yes, whatever lies in the dropped components. Keeping all components loses nothing but also reduces nothing. The explained-variance ratio tells you exactly how much you keep.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────── t-SNE & UMAP
  'tsne-umap': {
    minutes: 16,
    hook: 'An e-commerce company turns each of its 50,000 product descriptions into a list of 384 numbers using a language model. Similar products get similar lists, but nobody can look at 384 dimensions. A PCA plot shows one big smudge. A **UMAP** plot of the same data shows tidy islands: phones here, phone cases next to them, sarees far away, a small odd island of products that turn out to be mislabelled. **t-SNE** and **UMAP** are the tools behind such maps, and they are wonderful for exploring, as long as you know how to read them.',
    sections: [
      {
        heading: 'The problem: seeing data that has hundreds of dimensions',
        blocks: [
          { p: 'People understand data by looking at it, and we can only look in two or three dimensions. PCA (previous chapter) gives a 2-D view by keeping the two directions of greatest spread. That works when the important structure is flat. Often it is not: the groups twist and curl through the high-dimensional space, and a flat shadow piles them on top of each other.' },
          { term: 'Embedding', def: 'A list of numbers (a vector) that represents an item such as a product, a sentence or a customer, produced so that similar items get similar vectors. "A 384-dimensional embedding" is a list of 384 numbers.' },
          { term: 'Non-linear dimensionality reduction', def: 'Reducing dimensions by bending and stretching the space, not just rotating and dropping axes as PCA does. It can unroll curved structures but gives up some global accuracy.' },
          { p: 't-SNE (t-distributed Stochastic Neighbour Embedding, 2008) and UMAP (Uniform Manifold Approximation and Projection, 2018) both follow one principle: **keep neighbours together.** If two points are close in the original space, they should be close on the 2-D map. Distances between far-apart points matter much less.' },
          { diagram: { kind: 'scatter', xLabel: 'map axis 1 (no units)', yLabel: 'map axis 2 (no units)', caption: 'An illustrative UMAP-style map of product embeddings. Each colour is a product category. Notice what is reliable (points within an island are similar products) and what is not (the gaps between islands and the axis values carry little meaning).', points: [[1, 1, 0], [1.5, 1.3, 0], [1.2, 0.6, 0], [0.7, 1.1, 0], [1.6, 0.8, 0], [5, 1.2, 1], [5.4, 1.6, 1], [4.7, 1.7, 1], [5.2, 0.9, 1], [4.9, 1.4, 1], [3, 5, 2], [3.4, 5.3, 2], [2.7, 5.5, 2], [3.2, 4.6, 2], [3.6, 4.9, 2], [8, 5, 3], [8.3, 5.4, 3], [7.7, 4.7, 3], [8.4, 4.6, 3], [6.5, 3, 4], [6.6, 3.2, 4]] } },
        ],
      },
      {
        heading: 'Building the intuition: a wedding seating plan',
        blocks: [
          { p: 'You are seating 300 wedding guests in one hall. Each guest knows some others well, some slightly, most not at all. You cannot keep every relationship exactly right on a flat floor, so you decide what matters most: **people who know each other well should sit near each other.** Whether the bride\'s college friends sit 10 metres or 20 metres from the groom\'s office colleagues matters much less.' },
          { steps: [
            '**List the close friends** of each guest, with a strength for each friendship.',
            '**Seat everyone at random** to start.',
            '**Look at the seating.** Close friends sitting far apart? Pull them together. Strangers squeezed next to each other? Push them apart a little.',
            '**Repeat many small adjustments** until friendship groups sit at their own tables.',
          ], title: 'The seating method' },
          { p: 'That is the essence of t-SNE and UMAP. They first describe who is near whom in the original space, then arrange points in 2-D, nudging them over and over until the 2-D neighbourhoods match the original ones as well as possible.' },
          { think: { q: 'After the wedding, a guest notices the "college friends" table is twice as far from the "office" table as from the "cousins" table. Does that prove college friends are closer to cousins than to office colleagues?', a: 'No. The seating method cared about keeping friends together, not about getting distances between tables right. The same is true of t-SNE and UMAP maps: gaps between clusters are not reliable evidence of how different the clusters are.' } },
        ],
      },
      {
        heading: 'How the algorithms work, step by step',
        blocks: [
          { term: 'Perplexity (t-SNE)', def: 'A setting that roughly controls how many neighbours each point pays attention to. Typical values are 5 to 50; scikit-learn uses 30 by default. Small values focus on very local detail, larger values on broader structure.' },
          { term: 'n_neighbors and min_dist (UMAP)', def: 'n_neighbors (default 15) plays a role like perplexity: how many neighbours define each point\'s local area. min_dist (default 0.1) controls how tightly points may be packed together on the map.' },
          { diagram: { kind: 'flow', nodes: ['High-dimensional data (often PCA-reduced to ~50)', 'Measure **neighbour similarities** for every point', 'Place points randomly or from PCA in 2-D', '**Nudge** points so 2-D neighbours match original neighbours', 'Read the map: islands = groups of similar items'], caption: 'The shared recipe of t-SNE and UMAP. They differ mainly in how similarities are defined and in how the nudging is done, which makes UMAP considerably faster on large datasets.' } },
          { steps: [
            '**Similarities in the original space.** For each point, turn distances to other points into similarity scores: nearby points score high, distant ones almost zero. Each point gets its own "neighbourhood size", tuned so it has about the number of meaningful neighbours set by perplexity (t-SNE) or n_neighbors (UMAP).',
            '**Initial layout.** Put the points somewhere in 2-D. Modern defaults start from a PCA layout (t-SNE in scikit-learn) or a spectral layout (UMAP), which gives more stable results than pure randomness.',
            '**Similarities on the map.** Compute similarities between the 2-D positions in the same spirit.',
            '**Improve the layout.** Move points a little to reduce the mismatch between the two sets of similarities, using gradient descent. Repeat for hundreds of iterations.',
          ] },
          { callout: 'UMAP learns a reusable mapping, so new points can be placed on an existing map with `transform`. scikit-learn\'s t-SNE has no `transform`: adding new points means re-running everything.', tone: 'tip' },
        ],
      },
      {
        heading: 'The math, explained slowly (t-SNE)',
        blocks: [
          { p: 'UMAP\'s maths comes from topology and is heavier, so we follow t-SNE, whose three formulas show the ideas clearly. UMAP follows the same spirit.' },
          { tex: 'p_{j|i} = \\frac{\\exp\\!\\left(-\\lVert x_i - x_j \\rVert^2 / 2\\sigma_i^2\\right)}{\\sum_{k \\ne i} \\exp\\!\\left(-\\lVert x_i - x_k \\rVert^2 / 2\\sigma_i^2\\right)}', plain: 'How much point i "picks" point j as a neighbour in the original space. A bell curve centred on i gives high scores to close points and almost zero to far ones; dividing by the total makes the scores add to 1. The width σᵢ is tuned per point to match the perplexity.', symbols: [['p_{j|i}', 'similarity of j from i\'s point of view'], ['x_i', 'point i in the original space'], ['\\sigma_i', 'width of i\'s neighbourhood (set by perplexity)']] },
          { tex: 'q_{ij} = \\frac{\\left(1 + \\lVert y_i - y_j \\rVert^2\\right)^{-1}}{\\sum_{k \\ne l} \\left(1 + \\lVert y_k - y_l \\rVert^2\\right)^{-1}}', plain: 'Similarity of i and j on the 2-D map. Instead of a bell curve it uses a Student t-curve (this is the "t" in t-SNE), which falls off much more slowly at long distances.', symbols: [['y_i', 'position of point i on the 2-D map'], ['q_{ij}', 'similarity on the map']] },
          { term: 'KL divergence', def: 'Kullback–Leibler divergence: a measure of how different two sets of probabilities are. It is zero when they match exactly. t-SNE moves points to make it as small as possible.' },
          { tex: 'C = \\sum_{i \\ne j} p_{ij} \\log \\frac{p_{ij}}{q_{ij}}', plain: 't-SNE\'s cost. For each pair, compare the original similarity with the map similarity. Pairs that were close originally (large p) but far on the map (small q) are punished heavily; pairs that were far originally barely count. (The original similarities are symmetrised: pᵢⱼ averages p of j given i and p of i given j, divided by the number of points.)', symbols: [['C', 'cost to minimise'], ['p_{ij}', 'symmetrised original similarity']] },
          { p: 'Why the heavy-tailed t-curve on the map? There is far less room in 2-D than in 384-D. A point can have dozens of moderately close neighbours in high dimensions but cannot fit them all at moderate distance on a flat page, a difficulty known as the **crowding problem**. The heavy tail lets moderately distant points sit further apart on the map without much penalty, which opens clear gaps between groups.' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Turning distances into neighbour scores', setup: 'Point i has three other points at distances 1, 2 and 4 in the original space. Use a neighbourhood width σ = 1.', steps: [
            'Bell-curve score = e^(−distance² / 2). Distance 1: e^(−0.5) ≈ 0.607. Distance 2: e^(−2) ≈ 0.135. Distance 4: e^(−8) ≈ 0.0003.',
            'Total ≈ 0.607 + 0.135 + 0.0003 ≈ 0.743.',
            'Normalised: 0.607 / 0.743 ≈ 0.817; 0.135 / 0.743 ≈ 0.182; 0.0003 / 0.743 ≈ 0.000.',
          ], result: 'The nearest point gets 82% of i\'s attention, the second 18%, and the far point effectively nothing. Neighbourhoods, not global distances, are what t-SNE keeps.' } },
          { example: { title: 'Why the t-curve opens gaps', setup: 'Compare the bell-curve score e^(−d²/2) with the t-curve score 1 / (1 + d²) at several distances d.', steps: [
            'd = 1: bell 0.607, t-curve 0.500.',
            'd = 2: bell 0.135, t-curve 0.200.',
            'd = 3: bell 0.011, t-curve 0.100, about nine times the bell value.',
            'd = 5: bell about 0.000004, t-curve 0.038.',
          ], result: 'On the map, the t-curve still gives sizeable similarity at moderate distances. To make the map similarity of two dissimilar points as small as the original, t-SNE must push them much further apart, which creates the well-separated islands people see.' } },
          { diagram: { kind: 'curve', fn: 'Math.exp(-x*x/2)', fn2: '1/(1+x*x)', xMin: 0, xMax: 5, marks: [{ x: 3, label: 'd = 3' }], xLabel: 'distance d', yLabel: 'similarity score', legend: ['bell curve (original space)', 't-curve (2-D map)'], caption: 'The bell curve drops to almost zero by distance 3; the t-curve still sits at 0.1. This heavy tail is the trick that lets t-SNE separate groups clearly on a crowded 2-D page.' } },
          { example: { title: 'Why t-SNE cares more about friends than strangers', setup: 'Two pairs contribute to the cost C = p × log(p / q). Pair 1: close originally (p = 0.5) but far on the map (q = 0.05). Pair 2: far originally (p = 0.05) but close on the map (q = 0.5).', steps: [
            'Pair 1: 0.5 × ln(0.5 / 0.05) = 0.5 × ln(10) ≈ 1.15.',
            'Pair 2: 0.05 × ln(0.05 / 0.5) = 0.05 × ln(0.1) ≈ −0.12.',
          ], result: 'Splitting up true neighbours costs about ten times more (and in the opposite direction) than squeezing strangers together. That is why t-SNE preserves local neighbourhoods faithfully but makes no promise about global layout.' } },
          { example: { title: 'Checking a map of a product catalogue', setup: 'A retailer wants to know whether a 2-D map is trustworthy before showing it to category managers. For one product, list its 10 nearest neighbours in the original 384-D embedding, then its 10 nearest on each 2-D map (illustrative counts).', steps: [
            'UMAP map: 8 of the 10 original neighbours are still among the 10 nearest on the map → 8 / 10 = 80% preserved.',
            'PCA map: only 4 of 10 remain → 40% preserved.',
            'Averaging this check over 1,000 random products gives a simple "neighbour preservation" score for each map.',
          ], result: 'The UMAP map keeps local similarity far better, so it is the right picture for spotting mislabelled products. The PCA map is still better for statements about overall spread.' } },
        ],
      },
      {
        heading: 'Reading the maps safely',
        blocks: [
          { p: 'These maps are persuasive pictures, and persuasive pictures are easy to over-read. Use these rules every time.' },
          { bullets: [
            '**Trust local neighbourhoods.** Points next to each other are probably similar in the original space.',
            '**Do not trust cluster sizes.** t-SNE in particular tends to expand dense clusters and shrink sparse ones, so a big island does not mean a widely spread group.',
            '**Do not trust distances between clusters.** Gaps are partly an artefact of the heavy tail and of the settings.',
            '**Axes have no meaning.** "Axis 1 = 12" is not interpretable, and maps can be rotated or mirrored freely.',
            '**Try several settings and seeds.** Structure that appears under perplexity 15, 30 and 50, and across random seeds, is real. Structure that appears only once is suspect.',
            '**Random noise can look clustered** at very low perplexity. Always sanity-check by colouring points with known labels.',
          ] },
          { diagram: { kind: 'table', head: ['Setting', 'Too small', 'Too large'], rows: [['t-SNE perplexity', 'Many tiny, fake clusters', 'Groups blur together; slower'], ['UMAP n_neighbors', 'Fragmented, very local map', 'Smoother, more global, finer detail lost'], ['UMAP min_dist', 'Tight, dense clumps', 'Points spread evenly, clusters less distinct']], caption: 'How the main settings change the picture. Defaults (perplexity 30; n_neighbors 15, min_dist 0.1) are sensible starting points, not final answers.' } },
          { callout: 'Do not feed t-SNE coordinates into a predictive model, and be cautious about clustering them: they distort densities and cannot place new data. UMAP output is sometimes used before HDBSCAN for clustering text embeddings, but validate any such clusters in the original space.', tone: 'warn' },
        ],
      },
      {
        heading: 't-SNE and UMAP in the real world',
        blocks: [
          { case: { title: 'Single-cell biology', story: 'In single-cell RNA sequencing, each of tens of thousands of cells is described by the activity of thousands of genes. t-SNE and later UMAP became standard ways to draw these cells as 2-D maps, where islands correspond to cell types such as different immune cells. Researchers use the maps to spot unexpected groups and then confirm them with statistical tests in the original gene space. The same field has also published cautions that distances and sizes on these maps should not be over-interpreted, which is exactly the reading rule above.' } },
          { bullets: [
            '**Language-model embeddings:** map support tickets, product descriptions or survey answers to see themes and outliers.',
            '**Model debugging:** map the internal features of an image or text classifier, coloured by true label, to see which classes it confuses.',
            '**Customer behaviour:** map customers described by many behavioural features to give marketing a visual feel for segments before formal clustering.',
            '**Fraud review:** analysts browse a UMAP map of transactions and inspect small isolated islands.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Slow on very large data:** exact t-SNE does not scale; the Barnes–Hut approximation (scikit-learn\'s default) helps, and UMAP is usually much faster.',
            '**Different runs, different pictures:** set `random_state` and compare several runs.',
            '**Not for features:** use PCA when you need inputs for a model.',
            '**Distances are distorted:** never quote "cluster A is twice as far from B as from C" from these maps.',
            '**Pre-reduce first:** running PCA to about 50 dimensions before t-SNE or UMAP removes noise and speeds things up.',
          ] },
          { diagram: { kind: 'compare', left: { title: 't-SNE', items: ['Excellent local detail', 'Slower on large datasets', 'No transform for new points (scikit-learn)', 'Key setting: perplexity', 'Global layout weakly preserved'] }, right: { title: 'UMAP', items: ['Similar local quality', 'Faster; scales to millions of points', 'Can transform new points', 'Key settings: n_neighbors, min_dist', 'Often keeps more global structure (still not exact)'] }, caption: 'UMAP is usually the practical default today; t-SNE remains a strong choice for detailed views of moderate-sized data. Both are for looking, not for measuring.' } },
        ],
      },
    ],
    faq: [
      { q: 'Should I use PCA, t-SNE or UMAP?', a: 'PCA for model inputs, compression and faithful global structure. UMAP (or t-SNE) for 2-D pictures that reveal local groups. Often you use PCA first, then UMAP on the PCA output.' },
      { q: 'Why does my t-SNE plot change every time?', a: 'The optimisation starts from a random or PCA layout and settles in one of many good arrangements. Fix `random_state` for reproducibility and check that the main structure is stable across seeds.' },
      { q: 'What perplexity should I use?', a: 'Start with 30, then try values such as 5, 15 and 50. Perplexity must be smaller than the number of points. Trust structure that holds across several values.' },
      { q: 'Can I say two clusters are very different because they are far apart on the map?', a: 'Not reliably. Check the difference in the original space, for example by comparing average feature values or distances between cluster centres there.' },
      { q: 'Is UMAP in scikit-learn?', a: 'No. Install the separate `umap-learn` package; its interface follows scikit-learn (`fit`, `transform`, `fit_transform`).' },
      { q: 'Do these methods find clusters?', a: 'They draw maps on which clusters may become visible. Formal cluster labels still come from a clustering algorithm, ideally checked in the original space.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────── ANOMALY DETECTION
  'anomaly-detection': {
    minutes: 16,
    hook: 'A customer in Chennai usually spends ₹800 to ₹2,000 per card transaction, in the daytime, at local shops. At 3 a.m. a ₹48,000 charge arrives from an overseas website. No rule says "₹48,000 is fraud", and the bank has very few confirmed fraud cases to learn from. Yet anyone looking at her history can see this one does not fit. **Anomaly detection** turns "this does not fit" into a number a computer can calculate for millions of transactions a second.',
    sections: [
      {
        heading: 'The problem: finding the rare and the strange',
        blocks: [
          { p: 'Many of the most valuable events in business are rare: fraudulent payments, a machine about to fail, a cyber intrusion, a data-entry error that corrupts a monthly report. They are rare, so there are few labelled examples to learn from, and new kinds keep appearing. Supervised learning, which needs many labelled examples of each class, struggles here.' },
          { term: 'Anomaly (outlier)', def: 'A data point that differs markedly from the bulk of the data, enough to suspect it was produced by a different process: fraud instead of normal spending, a fault instead of normal operation.' },
          { term: 'Anomaly score', def: 'A number given to each point saying how unusual it is. Higher usually means more unusual. A threshold on the score turns it into a yes/no alert.' },
          { p: 'Anomaly detection flips the problem around. Instead of learning what fraud looks like, it learns **what normal looks like** and flags whatever departs from it. Anomalies come in three flavours:' },
          { bullets: [
            '**Point anomalies:** one value is extreme on its own (a ₹48,000 charge from a ₹1,000-a-day customer).',
            '**Contextual anomalies:** a value is normal in one context but not another (high electricity use is normal in May in Chennai, odd in January).',
            '**Collective anomalies:** each point looks normal, but a group together is odd (fifty small transfers to the same new account in an hour).',
          ] },
          { diagram: { kind: 'scatter', xLabel: 'transaction amount (₹ thousand)', yLabel: 'hour of day', caption: 'Normal transactions (blue) form a dense cloud of small daytime amounts. The orange points sit far from that cloud: a huge night-time charge, a large daytime one and a small 3 a.m. one. The last is not extreme in amount, only in combination, which is why methods that look at several features together matter.', points: [[1.2, 11, 0], [0.8, 13, 0], [1.5, 15, 0], [2.0, 18, 0], [0.9, 10, 0], [1.1, 12, 0], [1.7, 19, 0], [1.3, 14, 0], [0.95, 16, 0], [1.4, 17, 0], [1.6, 12, 0], [1.0, 20, 0], [48, 3, 1], [25, 14, 1], [1.2, 3, 1]] } },
        ],
      },
      {
        heading: 'Building the intuition: the game of twenty questions',
        blocks: [
          { p: 'Imagine a game in which you must single out one person from a crowd of 200 office workers by asking yes/no questions such as "Is the person taller than 1.7 m?" or "Is the person wearing a tie?".' },
          { steps: [
            'For an ordinary person (average height, office clothes, usual age) you need many questions, because many others share each answer.',
            'For the one person in a full astronaut suit, a single question ("wearing a helmet?") isolates them immediately.',
            'Play the game many times with random questions and average the number of questions needed for each person.',
            'People who are consistently isolated in very few questions are the unusual ones.',
          ], title: 'Isolating people with random questions' },
          { p: 'This is exactly the idea behind **Isolation Forest**, one of the most popular anomaly detectors. Other methods use different intuitions: "how many standard deviations from average is this?" (z-scores) or "is this point in a much emptier neighbourhood than its neighbours are?" (Local Outlier Factor). All of them try to put a number on "does not fit".' },
          { think: { q: 'Why does the twenty-questions idea not need any labelled examples of anomalies?', a: 'Because it only uses how easy each point is to separate from the rest. Being "few and different" is enough to be isolated quickly. Nobody has to say in advance what the astronaut looks like.' } },
        ],
      },
      {
        heading: 'How anomaly detection works, step by step',
        blocks: [
          { diagram: { kind: 'flow', nodes: ['Define **normal** and choose features (amount, time, location…)', 'Fit a detector on mostly normal data', 'Score every new point', 'Apply a **threshold**: alert or not', 'Experts review alerts; feedback improves features and threshold'], caption: 'The anomaly-detection loop. The algorithm is only one box; choosing features and closing the feedback loop usually matter more.' } },
          { steps: [
            '**Decide what "normal" means.** Normal for this customer? For this machine type? For this hour of the week? Context often lives in the features.',
            '**Engineer features** that expose oddness: amount relative to the customer\'s usual amount, distance from home, time since the last transaction.',
            '**Fit a detector** on historical data that is mostly normal. A small amount of hidden contamination is acceptable for most methods.',
            '**Score** each new point with the anomaly score.',
            '**Set a threshold** based on capacity and cost: how many alerts can the review team handle per day?',
            '**Review and learn.** Confirmed cases become labels, which can later train a supervised model.',
          ] },
          { term: 'Contamination', def: 'In scikit-learn\'s detectors, your estimate of the share of anomalies in the training data. It sets the threshold so that roughly that share of points is flagged. It does not change how the scores are calculated.' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { p: '**Statistical rules for one number at a time.** The simplest detector asks how many standard deviations a value lies from the mean.' },
          { tex: 'z = \\frac{x - \\bar{x}}{s}', plain: 'The z-score: distance from the average, measured in standard deviations. A common rule flags |z| > 3, i.e. more than three standard deviations away.', symbols: [['x', 'the value being checked'], ['\\bar{x}', 'mean of the normal history'], ['s', 'standard deviation of the history']] },
          { tex: 'z_{\\text{robust}} = \\frac{x - \\text{median}}{1.4826 \\times \\text{MAD}}', plain: 'A robust z-score uses the median and the median absolute deviation (MAD), which extreme values cannot drag around. The factor 1.4826 makes it comparable to an ordinary z-score for bell-shaped data.', symbols: [['\\text{MAD}', 'median of the absolute distances from the median']] },
          { tex: '\\text{flag if } x < Q_1 - 1.5\\,\\text{IQR} \\;\\text{ or }\\; x > Q_3 + 1.5\\,\\text{IQR}', plain: 'The IQR rule (the whiskers of a box plot). Q1 and Q3 are the 25th and 75th percentiles; the interquartile range IQR = Q3 − Q1 is the width of the middle half of the data.', symbols: [['Q_1, Q_3', 'first and third quartiles'], ['\\text{IQR}', 'interquartile range, Q_3 − Q_1']] },
          { p: '**Isolation Forest for many features.** It builds many random trees. Each tree repeatedly picks a random feature and a random split value until every point sits alone. The number of splits needed to isolate a point is its path length. Short average path length means easy to isolate, which means anomalous.' },
          { term: 'Path length', def: 'In an Isolation Forest, the number of random splits needed to separate a point from all the others in a tree. Averaged over many trees, it is the basis of the anomaly score.' },
          { tex: 's(x) = 2^{-\\,E[h(x)] / c(n)}', plain: 'The Isolation Forest score from the original paper. E[h(x)] is the average path length over the trees; c(n) is the average path length you would expect for a typical point in a sample of n points, used to normalise. Scores near 1 mean anomalies, around 0.5 or below mean normal.', symbols: [['E[h(x)]', 'average path length of x across trees'], ['c(n)', 'expected path length for a sample of size n (about 10.24 for n = 256)']] },
          { p: '**Local Outlier Factor (LOF)** compares the density around a point with the density around its neighbours. A LOF near 1 means "as crowded as my neighbours"; well above 1 means "much emptier than my neighbours", which catches points that are odd for their local area even if they would look ordinary somewhere else in the data.' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'z-scores and the IQR rule on card spend', setup: 'A customer\'s last ten transactions (₹): 1,200; 800; 1,500; 2,000; 950; 1,100; 1,700; 1,300; 900; 1,400. Check new transactions of ₹48,000 and ₹2,600.', steps: [
            'Mean = 12,850 / 10 = ₹1,285. Sample standard deviation ≈ ₹377.',
            '₹48,000: z = (48,000 − 1,285) / 377 ≈ 124. Wildly unusual.',
            '₹2,600: z = (2,600 − 1,285) / 377 ≈ 3.5. Just over the |z| > 3 rule.',
            'IQR rule (quartiles by the standard interpolation method): Q1 = 987.5, Q3 = 1,475, IQR = 487.5. Upper fence = 1,475 + 1.5 × 487.5 = 2,206.25.',
            'Both ₹48,000 and ₹2,600 are above the upper fence of about ₹2,206.',
          ], result: 'Both rules flag both amounts. But ₹2,600 for a festival gift is hardly suspicious, so a bank would combine the amount score with other features such as time, merchant and location instead of blocking on amount alone.' } },
          { example: { title: 'Masking: when the outlier hides itself', setup: 'Now suppose the ₹48,000 transaction is accidentally included in the history used to compute the mean and standard deviation (11 values).', steps: [
            'New mean ≈ ₹5,532. New standard deviation ≈ ₹14,090. The single outlier has inflated both.',
            'z of ₹48,000 = (48,000 − 5,532) / 14,090 ≈ 3.01. It barely passes the rule. (With 11 values, no z-score can exceed about 3.02, whatever the amount.)',
            'Robust version: median = ₹1,300, MAD = ₹350. Robust z = (48,000 − 1,300) / (1.4826 × 350) ≈ 90.',
          ], result: 'Ordinary z-scores can be "masked" by the very outliers they are meant to find. The median and MAD are not fooled. Use robust statistics, or compute baselines only from data known to be clean.' } },
          { diagram: { kind: 'curve', fn: 'Math.pow(2, -x/10.24)', xMin: 1, xMax: 20, marks: [{ x: 3, label: 'h = 3' }, { x: 11, label: 'h = 11' }], xLabel: 'average path length h', yLabel: 'anomaly score s', caption: 'The Isolation Forest score for samples of 256 points. A point isolated in 3 splits on average scores about 0.82; a typical point needing about 10 to 11 splits scores around 0.5 or a little below.' } },
          { example: { title: 'Isolation Forest scores and alert quality at a bank', setup: 'An Isolation Forest is trained with sub-samples of 256 transactions (the default), so c(256) ≈ 10.24. Transaction X has an average path length of 3; transaction Y has 11. The bank then reviews the 100 highest-scoring transactions of the day; 23 turn out to be confirmed fraud (illustrative). The overall fraud rate is about 0.1%.', steps: [
            'Score of X = 2^(−3 / 10.24) ≈ 0.82 → strongly anomalous.',
            'Score of Y = 2^(−11 / 10.24) ≈ 0.48 → normal.',
            'Precision at top 100 = 23 / 100 = 23%.',
            'If 100 transactions were picked at random, about 100 × 0.001 = 0.1 would be fraud. The detector\'s queue is about 230 times richer in fraud than random checking.',
          ], result: 'X goes to the review queue (or triggers an OTP challenge); Y passes. Precision at the top of the list, not overall accuracy, is the number that tells the bank whether its analysts\' time is well spent.' } },
        ],
      },
      {
        heading: 'Choosing a method and judging it',
        blocks: [
          { diagram: { kind: 'table', head: ['Method', 'Good for', 'Watch out for'], rows: [['z-score / IQR', 'One metric at a time; dashboards', 'Masking; skewed data; ignores context'], ['Robust z (median, MAD)', 'One metric with existing outliers', 'Still one feature at a time'], ['Isolation Forest', 'Many features, large data, fast', 'Needs a threshold; weak on local oddities'], ['Local Outlier Factor', 'Points odd for their neighbourhood', 'Slower; sensitive to scaling and n_neighbors'], ['DBSCAN noise / GMM low likelihood', 'When you are clustering anyway', 'Parameter-sensitive']], caption: 'A short menu of detectors. In practice teams often start with robust statistics on key metrics plus an Isolation Forest on the full feature set.' } },
          { p: '**How do you know if it works?** Accuracy is useless: if 0.1% of transactions are fraud, a model that never raises an alert is 99.9% accurate. Use measures that reflect the work of reviewing alerts.' },
          { bullets: [
            '**Precision at k:** of the top k alerts, how many were real? Choose k to match the team\'s daily capacity.',
            '**Recall on known cases:** of the past incidents you do know about, how many would the detector have caught?',
            '**Expert review:** domain experts label a sample of alerts; their feedback is the ground truth you are missing.',
            '**Cost view:** an alert costs analyst time (say ₹150 per review); a missed fraud costs the loss. Choose the threshold that balances the two.',
          ] },
          { callout: 'Seasonality creates false alarms. Sales spikes during Diwali or the end of a financial year are expected, not anomalous. Include calendar features, or compare each value with the same period last year.', tone: 'warn' },
        ],
      },
      {
        heading: 'Anomaly detection in the real world',
        blocks: [
          { case: { title: 'Predictive maintenance on a press line (illustrative)', story: 'An automotive supplier records vibration, motor current and temperature from 40 stamping presses every second. Failures are rare and varied, so there are almost no labelled examples. The data team builds features per minute (average and peak vibration, current relative to the press\'s own normal, temperature trend) and trains an Isolation Forest per press type. Alerts with a score above a threshold go to maintenance planners, who log what they found. Over the first months the planners confirm several early-stage bearing problems that were fixed in planned downtime instead of causing an unplanned stoppage. Their feedback is used to retire features that caused false alarms, and the confirmed cases begin to form a labelled dataset for a supervised model.' } },
          { bullets: [
            '**Finance:** card fraud, insider trading surveillance, unusual journal entries in audits.',
            '**Cyber security:** unusual logins, data transfers or process behaviour on servers.',
            '**Data quality:** catching broken pipelines, unit mistakes (lakh entered as crore) or duplicated loads before reports go out.',
            '**Operations:** sudden drops in website conversion, call-centre volume spikes, supply delays.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Unusual is not the same as bad.** A big wedding purchase is unusual but legitimate. Anomaly scores need business context and human review.',
            '**Guessing contamination.** Setting `contamination=0.05` when the true rate is 0.1% floods the team with false alerts. Prefer thresholds chosen from review capacity.',
            '**Unscaled features** distort distance-based methods such as LOF.',
            '**Drifting normal.** Customer behaviour changes over months; retrain regularly or normal behaviour will start to look anomalous.',
            '**Adversaries adapt.** Fraudsters learn to look normal; combine anomaly scores with rules, supervised models and network analysis.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'Unsupervised anomaly detection', items: ['Few or no labels needed', 'Can catch new, never-seen patterns', 'Flags "unusual", which is not always "bad"', 'Threshold set by capacity and cost', 'Best at the start of a programme'] }, right: { title: 'Supervised classification', items: ['Needs many labelled cases', 'Excellent on known patterns', 'Learns what "bad" looks like directly', 'Threshold tuned with precision and recall', 'Best once confirmed cases accumulate'] }, caption: 'Mature fraud and maintenance systems usually run both: an unsupervised detector for novel patterns and a supervised model for known ones.' } },
        ],
      },
    ],
    faq: [
      { q: 'What is the difference between an outlier and an anomaly?', a: 'They are often used interchangeably. Some people use "outlier" for any extreme value and "anomaly" for one that signals a real event of interest such as fraud or a fault.' },
      { q: 'Which detector should I try first?', a: 'For a single metric, a robust z-score or the IQR rule. For many features, Isolation Forest: it is fast, needs little tuning and handles large data.' },
      { q: 'Do I need labels at all?', a: 'Not to train most detectors, but you need at least a few known cases or expert reviews to judge whether the alerts are useful and to set the threshold.' },
      { q: 'What does the `contamination` parameter do?', a: 'It sets the score threshold so that roughly that fraction of training points is flagged. It does not change the scores themselves.' },
      { q: 'Why does scikit-learn\'s Isolation Forest give negative scores?', a: 'Its `score_samples` returns the negative of the paper\'s score, so lower means more abnormal, and `decision_function` shifts it so that negative values are outliers. The ranking of points is the same.' },
      { q: 'How do I handle seasonality?', a: 'Add calendar features (day of week, month, festival flags), detect anomalies on residuals after removing the seasonal pattern, or compare each value with the same period in previous years.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────── ASSOCIATION RULES
  'association-rules': {
    minutes: 15,
    hook: 'A neighbourhood supermarket owner notices that customers who pick up tea often reach for biscuits too, so she moves the biscuit shelf next to the tea. That is market-basket analysis done by eye. A chain with 500 stores, 20,000 products and millions of bills cannot do it by eye. **Association rules** scan every receipt, find combinations that occur together far more often than chance, and score each one with three simple numbers: support, confidence and lift.',
    sections: [
      {
        heading: 'The problem: what gets bought together?',
        blocks: [
          { p: 'Retailers want to know which products go together so they can place them near each other, bundle them, cross-sell them online and plan promotions. The data is simple: a list of bills, each one a set of products. There is no target column to predict, which makes this an unsupervised problem.' },
          { term: 'Transaction (basket)', def: 'One purchase event: the set of items bought together on a single bill or order. Quantities and prices are usually ignored; only which items were present matters.' },
          { term: 'Itemset', def: 'Any set of items, such as {bread} or {bread, butter, milk}. A frequent itemset is one that appears in at least a chosen share of baskets.' },
          { term: 'Association rule', def: 'A statement of the form {A} → {B}: "baskets containing A also tend to contain B". A is the antecedent (if-part) and B the consequent (then-part).' },
          { diagram: { kind: 'table', head: ['Bill', 'Items', 'Bill', 'Items'], rows: [['T1', 'bread, butter, milk', 'T6', 'milk, bread'], ['T2', 'bread, butter', 'T7', 'tea, biscuits'], ['T3', 'bread, jam', 'T8', 'bread, butter, milk'], ['T4', 'milk, tea', 'T9', 'milk, tea, biscuits'], ['T5', 'bread, butter, jam', 'T10', 'bread, milk']], caption: 'Ten bills from a small grocery store, used in every worked example below. Bread appears in 7, milk in 6, butter in 4, tea in 3, jam and biscuits in 2 each.' } },
        ],
      },
      {
        heading: 'Building the intuition: the shopkeeper who corrects for popularity',
        blocks: [
          { p: 'Think about how an experienced shopkeeper reasons. She notices patterns, but she also knows which items are simply popular.' },
          { steps: [
            '**How common is the combination?** If tea and biscuits appear together on only two bills a year, it does not matter how strong the link is: it will not pay for a shelf move.',
            '**How reliable is the "if… then"?** Of the customers who buy tea, what share also buy biscuits?',
            '**Is it more than popularity?** Almost everyone buys bread. "Customers who buy milk also buy bread" sounds impressive, but if 70% of all customers buy bread anyway, the milk buyers may be no different from everyone else.',
          ], title: 'Three questions a good shopkeeper asks' },
          { p: 'These three questions map exactly onto **support** (how common), **confidence** (how reliable) and **lift** (how much more than chance). The third question is the one beginners forget, and the one that separates real insight from noise.' },
          { think: { q: 'A rule says "customers who buy anything also buy a carry bag, with 95% confidence". Is that a useful cross-selling insight?', a: 'No. Carry bags are in almost every basket, so a high confidence is guaranteed whatever the antecedent is. The lift would be close to 1, revealing that buying the first item does not change the chance of buying a bag at all.' } },
        ],
      },
      {
        heading: 'How the Apriori algorithm works, step by step',
        blocks: [
          { p: 'The difficulty is the number of possible combinations. With just 100 products there are about 4,950 pairs and 161,700 triples. With 20,000 products, counting every combination is hopeless. The **Apriori** algorithm uses one simple fact to skip most of them.' },
          { term: 'Apriori principle', def: 'If an itemset is rare, every bigger itemset that contains it is at least as rare. So if {jam} appears in only 2% of baskets, {jam, cheese} cannot appear in more than 2%, and need never be counted when 2% is below the threshold.' },
          { diagram: { kind: 'flow', nodes: ['Set **minimum support** (e.g. 1% of baskets)', 'Count single items; keep the frequent ones', 'Build pairs only from frequent items; count; keep frequent pairs', 'Build triples only from frequent pairs; repeat until none survive', 'Turn frequent itemsets into rules; filter by **confidence** and **lift**'], caption: 'Apriori grows itemsets level by level and prunes anything containing a rare subset, which is what makes the search feasible.' } },
          { steps: [
            'Choose a minimum support (and later a minimum confidence and lift).',
            'Count how often each single item appears; drop items below minimum support.',
            'Form candidate pairs using only surviving items. Count them and drop rare pairs.',
            'Form candidate triples only if every pair inside them survived. Count, drop, and continue to bigger sets.',
            'For each frequent itemset, generate rules by splitting it into an if-part and a then-part, and compute confidence and lift.',
          ] },
          { callout: 'FP-Growth is a faster alternative that finds the same frequent itemsets without generating candidates explicitly. The `mlxtend` Python library offers both `apriori` and `fpgrowth`, plus `association_rules` to compute the metrics.', tone: 'tip' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { p: 'All three measures are simple proportions. Write N for the total number of baskets.' },
          { tex: '\\text{support}(A) = \\frac{\\text{number of baskets containing } A}{N}', plain: 'Support is how common an itemset is: the share of all baskets that contain it. Support of a rule A → B is the support of A and B together.', symbols: [['A', 'an itemset'], ['N', 'total number of baskets']] },
          { tex: '\\text{confidence}(A \\to B) = \\frac{\\text{support}(A \\cup B)}{\\text{support}(A)} = P(B \\mid A)', plain: 'Confidence: among baskets that contain A, the share that also contain B. It is the conditional probability of B given A. Notice it depends on direction: confidence of A → B usually differs from B → A.', symbols: [['A \\cup B', 'baskets containing both A and B'], ['P(B \\mid A)', 'probability of B given A']] },
          { tex: '\\text{lift}(A \\to B) = \\frac{\\text{confidence}(A \\to B)}{\\text{support}(B)} = \\frac{\\text{support}(A \\cup B)}{\\text{support}(A)\\,\\text{support}(B)}', plain: 'Lift: how much more often A and B appear together than they would if they were unrelated. If the items were independent, together-support would equal the product of the two supports, and lift would be 1.' },
          { term: 'Lift', def: 'Observed co-occurrence divided by the co-occurrence expected by chance. Lift above 1 means the items go together more than chance (complements); about 1 means no relationship; below 1 means they appear together less than chance (often substitutes).' },
          { p: 'Why divide by support(B)? Because confidence alone rewards popular consequents. If B is in 70% of all baskets, any rule ending in B will show confidence near 70% even when A has nothing to do with it. Dividing by 70% asks the right question: does knowing A **raise** the chance of B above its normal level? Lift is also symmetric: lift of A → B equals lift of B → A.' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'Scoring three rules on the ten bills', setup: 'Use the ten bills in the table above (N = 10).', steps: [
            '{butter} → {bread}: butter is in 4 bills and all 4 also contain bread. Support = 4/10 = 0.4. Confidence = 4/4 = 1.0. Lift = 1.0 / 0.7 ≈ 1.43.',
            '{tea} → {biscuits}: tea in 3 bills, both in 2 (T7, T9). Support = 0.2. Confidence = 2/3 ≈ 0.67. Biscuits alone have support 0.2, so lift = 0.67 / 0.2 ≈ 3.33.',
            '{milk} → {bread}: milk in 6 bills, both in 4. Support = 0.4. Confidence = 4/6 ≈ 0.67. Lift = 0.67 / 0.7 ≈ 0.95.',
          ], result: 'Milk → bread has the same confidence as tea → biscuits, but its lift is below 1: milk buyers are slightly less likely than average to buy bread. Tea → biscuits is the strongest real association, even though it is less frequent.' } },
          { example: { title: 'Apriori pruning with minimum support 30%', setup: 'Same ten bills; keep only itemsets in at least 3 bills.', steps: [
            'Single items: bread 0.7, milk 0.6, butter 0.4, tea 0.3 survive. Jam (0.2) and biscuits (0.2) are dropped.',
            'Candidate pairs, built only from survivors: {bread, butter} 0.4 kept, {bread, milk} 0.4 kept, {butter, milk} 0.2 dropped, {milk, tea} 0.2 dropped, {bread, tea} 0 dropped, {butter, tea} 0 dropped.',
            'Pairs involving jam or biscuits are never counted at all, which is the saving.',
            'Candidate triple {bread, butter, milk} would need {butter, milk} to be frequent. It is not, so the triple is pruned without counting.',
          ], result: 'Only two frequent pairs survive. Note that the high-lift rule tea → biscuits was lost because biscuits were too rare at this threshold: the support threshold controls what you can discover.' } },
          { diagram: { kind: 'bars', labels: ['tea→biscuits', 'butter→bread', 'jam→bread', 'milk→tea', 'milk→bread', 'butter→milk'], values: [3.33, 1.43, 1.43, 1.11, 0.95, 0.83], highlight: 0, yLabel: 'lift', caption: 'Lift for six rules from the ten bills. Anything above 1 is a positive association; milk → bread and butter → milk fall below 1 despite involving the two most popular items.' } },
          { example: { title: 'Cross-selling at an electronics website', setup: 'An online store has 50,000 orders in a month: 2,000 contain a phone case, 1,500 a screen protector, and 600 both (illustrative).', steps: [
            'Support(case and protector) = 600 / 50,000 = 1.2%.',
            'Confidence(case → protector) = 600 / 2,000 = 30%.',
            'Support(protector) = 1,500 / 50,000 = 3%. Lift = 30% / 3% = 10.',
            'Case buyers without a protector: 2,000 − 600 = 1,400. If a "frequently bought together" prompt converts 5% of them at ₹300 each, that is 70 extra sales worth ₹21,000 a month.',
          ], result: 'A rule with tiny support (1.2%) can still be very valuable because its lift is 10. The revenue estimate is only a hypothesis until an A/B test confirms the prompt really causes the extra sales.' } },
        ],
      },
      {
        heading: 'Reading and choosing rules',
        blocks: [
          { p: 'A real mining run can produce thousands of rules. Sorting them well matters more than the algorithm.' },
          { bullets: [
            '**Start with support** high enough that rules are actionable (a rule about 3 baskets a year will not justify a shelf move) but low enough not to miss niche, high-lift pairs.',
            '**Filter by lift above 1**, often well above (1.5 or 2) for action.',
            '**Then look at confidence** for the specific direction you will act on: "show protectors to case buyers" needs case → protector, not the reverse.',
            '**Sense-check with a person** who knows the category. Many strong rules are obvious (left shoe → right shoe) or driven by an existing promotion.',
            '**Test before you trust.** Rules show co-occurrence, not cause. Moving biscuits next to tea may or may not raise sales; only an experiment can tell.',
          ] },
          { diagram: { kind: 'table', head: ['Rule', 'Support', 'Confidence', 'Lift', 'Verdict'], rows: [['tea → biscuits', '0.20', '0.67', '3.33', 'Strong; worth testing'], ['butter → bread', '0.40', '1.00', '1.43', 'Frequent, mild link'], ['milk → bread', '0.40', '0.67', '0.95', 'Popularity only; ignore'], ['biscuits → tea', '0.20', '1.00', '3.33', 'Same lift, other direction']], caption: 'Reading rules together. Lift is the same in both directions, but confidence is not: every biscuit buyer bought tea, while only two-thirds of tea buyers bought biscuits.' } },
          { think: { q: 'Rule X has confidence 90% and lift 1.0. Rule Y has confidence 25% and lift 4.0. Which is more useful for cross-selling?', a: 'Usually Y. X\'s consequent is bought by 90% of everyone anyway, so promoting it to A-buyers adds nothing. Y\'s consequent is normally bought by about 6% of customers (25% / 4), and A-buyers buy it four times as often, which is a real opportunity.' } },
        ],
      },
      {
        heading: 'Association rules in the real world',
        blocks: [
          { case: { title: 'The beer-and-nappies story, and what it teaches', story: 'The most retold example in data mining claims that a retailer found young fathers buying beer and nappies together on Friday evenings, and placed the two side by side. The story has circulated since the 1990s and its details are disputed; it may be partly or wholly a myth. It survives because it captures the promise of basket analysis: a surprising, high-lift pair that nobody would have guessed. The lesson for practitioners is the opposite of the legend: surprising rules must be checked against the raw data, explained by someone who knows the customers, and tested before any shelves are moved.' } },
          { case: { title: 'Festival bundles at a supermarket chain (illustrative)', story: 'Before Diwali, a chain mines last year\'s festival-season bills by region. Rules such as {ghee, besan} → {sugar} (high lift) and {diyas} → {rangoli colours} guide bundle offers and end-of-aisle displays. Rules with lift near 1 are discarded even when confidence is high, because they only reflect popular staples. Two bundles are trialled in a sample of stores first, and sales are compared with similar stores without the display.' } },
          { bullets: [
            '**E-commerce:** "frequently bought together" widgets and checkout add-ons.',
            '**Banking:** which products tend to be held together (salary account, credit card, insurance) to plan cross-sell offers.',
            '**Healthcare:** combinations of diagnoses or prescriptions that co-occur, as a starting point for clinical review.',
            '**Manufacturing:** fault codes that tend to appear together, pointing to a shared root cause.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Ranking by confidence alone** promotes popular items; always check lift.',
            '**Support too low** creates thousands of noisy rules from coincidences; too high hides valuable niche pairs.',
            '**Many rules, many coincidences.** Testing thousands of rules guarantees some impressive-looking ones by chance. Validate on a later time period.',
            '**No quantities, prices or order.** Basic rules ignore how much was bought, margin, and sequence (for "bought A, then B next month" use sequential pattern mining).',
            '**Not personalised.** A rule applies to everyone who buys A. For recommendations tailored to each customer, use collaborative filtering.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'Association rules', items: ['Works on baskets (what is bought together)', 'Same rule for every customer', 'Easy to explain: support, confidence, lift', 'Great for layout, bundles, promotions', 'No customer history needed'] }, right: { title: 'Collaborative filtering', items: ['Works on user × item histories', 'Personalised per customer', 'Harder to explain (similarities, factors)', 'Great for "recommended for you"', 'Needs history for each user'] }, caption: 'Many retailers use both: rules for store-level and bundle decisions, collaborative filtering for personalised recommendations.' } },
        ],
      },
    ],
    faq: [
      { q: 'What is a good lift value?', a: 'Above 1 means a positive association. In practice teams often look for 1.5 or more, together with enough support to matter. Very high lifts on tiny supports are often coincidences.' },
      { q: 'Is lift the same in both directions?', a: 'Yes. Lift of A → B equals lift of B → A. Confidence, however, depends on direction.' },
      { q: 'Does a strong rule mean A causes people to buy B?', a: 'No. It shows the items appear together. A third factor (a festival, a promotion, a type of customer) may drive both. Test changes with an experiment.' },
      { q: 'What minimum support should I start with?', a: 'There is no universal value. Start so that a rule represents enough baskets to act on (for example several hundred a month), inspect the number of rules, and adjust.' },
      { q: 'Apriori or FP-Growth?', a: 'They find the same frequent itemsets. FP-Growth is usually faster on large data; Apriori is simpler to explain. In `mlxtend` you can swap one for the other.' },
      { q: 'Can I use association rules for online recommendations?', a: 'Yes, for "frequently bought together" on a product page. For a personalised homepage, collaborative filtering usually performs better.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────── COLLABORATIVE FILTERING
  'collaborative-filtering': {
    minutes: 16,
    hook: 'A streaming app in India has 20,000 titles and a user who will scroll through perhaps 30 before giving up. Showing her the most popular titles is a waste: she has already seen most of them, or they are not her taste. Yet the app knows something powerful: millions of other people\'s viewing histories, some of whom watch just like her. **Collaborative filtering** turns those shared tastes into a personal shortlist for every user, and it powers the recommendations on most large streaming and shopping platforms.',
    sections: [
      {
        heading: 'The problem: too many choices, too little attention',
        blocks: [
          { p: 'Online catalogues are enormous and attention is short. A good recommendation system increases what people watch, buy or read, and helps them find items they would never have searched for. The question is how to guess what a particular person will like when they have interacted with only a tiny fraction of the catalogue.' },
          { term: 'User–item matrix', def: 'A table with one row per user and one column per item, where each cell holds a rating or an interaction (watched, bought, clicked). Most cells are empty because each user has seen only a few items.' },
          { term: 'Sparsity', def: 'The share of empty cells in the user–item matrix. With 1 million users and 50,000 items there are 50 billion cells; even 100 million ratings fill only 0.2% of them.' },
          { p: 'Collaborative filtering fills in the empty cells using only the pattern of who liked what. It needs no information about the items themselves (no genres, no descriptions). The name says it all: users **collaborate**, without knowing it, to **filter** the catalogue for each other.' },
          { diagram: { kind: 'table', head: ['User', 'Desert Chase', 'Highway Heist', 'Monsoon Letters', 'Wedding Season'], rows: [['Asha', '5', '4', '1', '?'], ['Ravi', '5', '5', '1', '2'], ['Meera', '1', '2', '5', '5'], ['Kabir', '4', '4', '2', '1']], caption: 'A tiny user–item matrix of ratings from 1 to 5 (fictional titles: two action films, two romances). The question mark is what we want to predict: would Asha enjoy "Wedding Season"?' } },
        ],
      },
      {
        heading: 'Building the intuition: asking friends with the same taste',
        blocks: [
          { p: 'How do you choose a film to watch? Probably by asking friends, but not just any friends. You ask the ones whose taste has matched yours before.' },
          { steps: [
            '**Remember past agreements.** Ravi loved the same three films you loved and disliked the ones you disliked. Meera has the opposite taste.',
            '**Ask the like-minded.** "Ravi, Kabir, what did you think of Wedding Season?" Both found it dull.',
            '**Weight their opinions** by how often they have agreed with you before.',
            '**Turn it around for items.** You can also reason about films: "people who liked Desert Chase also liked Highway Heist", so if you liked one you will probably like the other.',
          ], title: 'Recommendations by trusted taste' },
          { p: 'The first approach is **user-based** collaborative filtering, the second **item-based**. A third approach, **matrix factorisation**, goes deeper: it discovers hidden "taste dimensions" such as how much a person likes action or romance, without anyone defining those dimensions.' },
          { think: { q: 'Why might a platform prefer item-based over user-based similarity in practice?', a: 'Items are usually more stable than users. A film\'s audience profile changes slowly, while a user\'s taste history keeps growing and changing. There are also often fewer items than users, so item similarities can be computed in advance and reused. Amazon described exactly this item-to-item approach in a well-known 2003 paper.' } },
        ],
      },
      {
        heading: 'How it works, step by step',
        blocks: [
          { term: 'Cosine similarity', def: 'A measure of how alike two lists of numbers are, based on the angle between them when seen as arrows. 1 means pointing the same way, 0 means unrelated, −1 means opposite.' },
          { term: 'Latent factor', def: 'A hidden dimension of taste learned from data, such as "action-ness" or "family-friendliness". Each user and each item gets a short list of factor values, and they are not named by anyone in advance.' },
          { diagram: { kind: 'flow', nodes: ['Collect interactions into a **user–item matrix**', 'Measure **similarity** (users or items) or learn **latent factors**', 'Predict scores for items the user has not seen', 'Rank, filter (already seen, out of stock) and show the **top N**', 'Measure clicks and watches; retrain regularly'], caption: 'A recommendation pipeline. The prediction step is the machine-learning core; ranking, business filters and feedback turn it into a product.' } },
          { steps: [
            '**Neighbourhood methods (user- or item-based):** compute similarities between rows (users) or columns (items) of the matrix, then predict a missing cell as a similarity-weighted average of the known ratings from the most similar neighbours.',
            '**Matrix factorisation:** give every user a vector of k factor values and every item a vector of k factor values, and learn them so that their dot product reproduces the known ratings. Missing cells are then predicted by the same dot product.',
            '**Ranking:** sort the predicted scores for each user, remove items already consumed, apply business rules, and show the top few.',
          ] },
          { term: 'Implicit feedback', def: 'Interactions that suggest preference without a rating: views, clicks, purchases, watch time. Most real systems rely on implicit data because few people bother to rate.' },
        ],
      },
      {
        heading: 'The math, explained slowly',
        blocks: [
          { tex: '\\text{sim}(u, v) = \\frac{\\sum_{i} r_{ui}\\, r_{vi}}{\\sqrt{\\sum_{i} r_{ui}^2}\\; \\sqrt{\\sum_{i} r_{vi}^2}}', plain: 'Cosine similarity between users u and v over the items both have rated: multiply their ratings item by item and add up, then divide by the "length" of each user\'s rating list.', symbols: [['r_{ui}', 'rating of user u for item i'], ['\\text{sim}(u,v)', 'similarity of users u and v']] },
          { tex: '\\hat{r}_{ui} = \\frac{\\sum_{v \\in N(u)} \\text{sim}(u,v)\\, r_{vi}}{\\sum_{v \\in N(u)} |\\text{sim}(u,v)|}', plain: 'Predicted rating of user u for item i: take the neighbours who rated item i, weight each neighbour\'s rating by their similarity to u, and divide by the total weight. Very similar neighbours count most.', symbols: [['\\hat{r}_{ui}', 'predicted rating'], ['N(u)', 'the most similar users who rated item i']] },
          { tex: '\\hat{r}_{ui} = \\mu + b_u + b_i + p_u \\cdot q_i', plain: 'Matrix factorisation prediction: the overall average rating, plus a user bias (some people rate everything high), plus an item bias (some films are liked by everyone), plus the dot product of the user\'s and item\'s factor vectors, which captures personal taste match.', symbols: [['\\mu', 'global average rating'], ['b_u, b_i', 'user and item biases'], ['p_u', 'factor vector of user u'], ['q_i', 'factor vector of item i']] },
          { tex: '\\min \\sum_{(u,i)\\,\\text{known}} \\left(r_{ui} - \\hat{r}_{ui}\\right)^2 + \\lambda \\left(\\lVert p_u \\rVert^2 + \\lVert q_i \\rVert^2 + b_u^2 + b_i^2\\right)', plain: 'Training objective: make predictions close to the known ratings (squared errors), while a penalty λ keeps the factors small so the model does not memorise noise. Only known cells are used; empty cells are not treated as zeros.', symbols: [['\\lambda', 'regularisation strength']] },
          { p: 'The factors are usually learned by stochastic gradient descent: go through known ratings one by one, compute the error, and nudge the user\'s and item\'s vectors in the direction that reduces it. Alternating least squares (ALS) is a popular alternative that scales well on Spark.' },
          { callout: 'Raw cosine on 1-to-5 ratings is misleading because all ratings are positive. In the example below Meera, whose taste is exactly opposite to Asha\'s, still gets a cosine of 0.51. Subtracting each user\'s average rating first (Pearson correlation) fixes this: their correlation is −1.', tone: 'warn' },
        ],
      },
      {
        heading: 'Worked examples',
        blocks: [
          { example: { title: 'User-based prediction for Asha', setup: 'Use the matrix above. Compare users on the three films Asha has rated: Asha (5, 4, 1), Ravi (5, 5, 1), Meera (1, 2, 5), Kabir (4, 4, 2). Predict Asha\'s rating for "Wedding Season".', steps: [
            'Asha–Ravi: dot product = 5×5 + 4×5 + 1×1 = 46. Lengths: √(25 + 16 + 1) = √42 ≈ 6.48 and √(25 + 25 + 1) = √51 ≈ 7.14. Cosine = 46 / (6.48 × 7.14) ≈ 0.994.',
            'Asha–Kabir: dot = 20 + 16 + 2 = 38. Kabir\'s length = √36 = 6. Cosine = 38 / (6.48 × 6) ≈ 0.977.',
            'Asha–Meera: dot = 5 + 8 + 5 = 18, length √30 ≈ 5.48, cosine ≈ 0.51, but the Pearson correlation is −1 (perfectly opposite taste), so we leave Meera out.',
            'Use the two nearest neighbours: Ravi rated Wedding Season 2, Kabir rated it 1.',
            'Prediction = (0.994 × 2 + 0.977 × 1) / (0.994 + 0.977) ≈ 2.965 / 1.971 ≈ 1.50.',
          ], result: 'Predicted rating about 1.5 out of 5: do not recommend "Wedding Season" to Asha. Her neighbours are action fans who disliked it.' } },
          { example: { title: 'Taste factors for an OTT recommendation', setup: 'Matrix factorisation has learned two factors (action, romance). User Priya = (0.9, 0.2). Film "Fast Chase" = (0.95, 0.1). Film "Love Letters" = (0.1, 0.9).', steps: [
            'Priya · Fast Chase = 0.9 × 0.95 + 0.2 × 0.1 = 0.855 + 0.02 = 0.875.',
            'Priya · Love Letters = 0.9 × 0.1 + 0.2 × 0.9 = 0.09 + 0.18 = 0.27.',
            'Rank: Fast Chase first.',
          ], result: 'High dot product means a good taste match. Nobody told the model that these factors mean action and romance; the names are our interpretation after inspecting which films score high on each factor.' } },
          { diagram: { kind: 'scatter', xLabel: 'factor 1 ("action")', yLabel: 'factor 2 ("romance")', caption: 'Users (blue) and films (orange) placed in the same two-factor taste space. Priya sits near Fast Chase, so their dot product is large. In real systems there are typically tens to hundreds of factors rather than two.', points: [[0.9, 0.2, 0], [0.3, 0.85, 0], [0.6, 0.6, 0], [0.95, 0.1, 1], [0.1, 0.9, 1], [0.7, 0.5, 1], [0.8, 0.3, 1]] } },
          { example: { title: 'One learning step of matrix factorisation', setup: 'Global average μ = 3.5 (ignore biases for simplicity). User vector p = (1.2, 0.3), item vector q = (0.8, −0.5). The user actually rated the item 5. Learning rate 0.1, no regularisation in this step.', steps: [
            'Prediction = 3.5 + (1.2 × 0.8 + 0.3 × (−0.5)) = 3.5 + (0.96 − 0.15) = 4.31.',
            'Error = 5 − 4.31 = 0.69.',
            'Update user: p + 0.1 × 0.69 × q = (1.2 + 0.0552, 0.3 − 0.0345) ≈ (1.255, 0.266).',
            'Update item (using the old p): q + 0.1 × 0.69 × p = (0.8 + 0.0828, −0.5 + 0.0207) ≈ (0.883, −0.479).',
            'New prediction = 3.5 + (1.255 × 0.883 + 0.266 × (−0.479)) ≈ 4.48.',
          ], result: 'One step moved the prediction from 4.31 towards the true 5. Repeating this over millions of known ratings, many times, shapes the factor vectors of every user and item.' } },
        ],
      },
      {
        heading: 'Cold start and evaluating recommenders',
        blocks: [
          { term: 'Cold start', def: 'The problem of recommending for a new user with no history, or recommending a new item nobody has interacted with yet. Collaborative filtering has nothing to work with in either case.' },
          { diagram: { kind: 'table', head: ['Situation', 'Common remedy'], rows: [['New user', 'Popular or trending items; ask for a few preferences at sign-up'], ['New item', 'Content-based similarity (genre, cast, description embeddings)'], ['Little data overall', 'Start content-based; add collaborative signals as data grows'], ['Some history', 'Hybrid model blending collaborative and content features']], caption: 'Cold-start strategies. Most production recommenders are hybrids for exactly this reason.' } },
          { p: '**Evaluating offline.** Hide each user\'s most recent interactions (a time-based split, so the model never sees the future), generate recommendations from the earlier data and check how many hidden items appear in the list.' },
          { bullets: [
            '**Precision@k:** of the top k recommendations, the share the user actually engaged with. If 2 of the top 5 were watched, precision@5 = 2 / 5 = 40%.',
            '**Recall@k:** of all the items the user engaged with in the hidden period, the share that appeared in the top k.',
            '**Ranking-aware metrics** such as NDCG give more credit when hits appear near the top of the list.',
            '**Online A/B tests** decide in the end: watch time, conversion and retention, not offline scores.',
          ] },
          { callout: 'Optimising the average error on ratings (RMSE) is not the same as producing a good top-10 list. Users only see the top of the ranking, so evaluate the ranking.', tone: 'key' },
        ],
      },
      {
        heading: 'Recommenders in the real world',
        blocks: [
          { case: { title: 'The Netflix Prize', story: 'Netflix famously ran a public competition, announced in 2006, offering $1 million to any team that could improve the accuracy of its film-rating predictions by 10%. The prize was awarded in 2009 to a team that blended many models. Matrix factorisation methods with user and item biases were among the most important ingredients and became widely known through the competition. A lasting lesson was also practical: the winning blend was very complex, and later public accounts from Netflix explained that the business had shifted towards streaming and ranking, so improving rating prediction alone was not the whole goal.' } },
          { bullets: [
            '**E-commerce:** "customers who bought this also bought" (item-based) and personalised homepages.',
            '**Music and video:** playlists and "because you watched" rows built from implicit listening and viewing data.',
            '**Food delivery and quick commerce:** reorder suggestions and restaurant rankings tailored to each user.',
            '**B2B:** recommending spare parts to workshops based on what similar workshops order, or articles to consultants based on what colleagues with similar projects read.',
          ] },
        ],
      },
      {
        heading: 'Pitfalls, limits and alternatives',
        blocks: [
          { bullets: [
            '**Popularity bias:** popular items get recommended more, so they get more interactions, so they get recommended even more. Niche items never get a chance unless you deliberately add diversity or exploration.',
            '**Feedback loops:** the model trains on data that its own recommendations created. Keep some randomised traffic to measure true preferences.',
            '**Leakage in evaluation:** random splits let the model learn from a user\'s future behaviour. Use time-based splits.',
            '**Treating empty cells as dislikes:** "not watched" usually means "not seen", not "disliked". Implicit-feedback methods weight missing cells carefully.',
            '**Filter bubbles:** pure similarity can trap users in narrow tastes. Many platforms add diversity and freshness rules.',
          ] },
          { diagram: { kind: 'compare', left: { title: 'Collaborative filtering', items: ['Uses behaviour of many users', 'No item descriptions needed', 'Finds surprising cross-genre matches', 'Suffers from cold start', 'Gets better with more users'] }, right: { title: 'Content-based filtering', items: ['Uses item features (genre, text, price)', 'Works for brand-new items', 'Recommends "more of the same"', 'Needs good item descriptions', 'Works with one user\'s history alone'] }, caption: 'Hybrid systems combine both: content features cover cold start, collaborative signals add serendipity. Modern "two-tower" neural recommenders learn user and item vectors from both kinds of input.' } },
        ],
      },
    ],
    faq: [
      { q: 'Is collaborative filtering supervised or unsupervised?', a: 'It sits in between. There is no separate label column; the model learns structure from the interaction matrix itself. Matrix factorisation does fit the known ratings, so its training looks like supervised learning, but the "answers" are just the observed cells of the same matrix.' },
      { q: 'User-based or item-based?', a: 'Item-based is usually more stable and scales better when there are many more users than items. User-based can capture fast-changing personal taste. Matrix factorisation typically beats both on accuracy at scale.' },
      { q: 'How many latent factors should I use?', a: 'Commonly tens to a few hundred. Tune it on a time-based validation set: too few underfits, too many overfits unless regularisation is strong.' },
      { q: 'What if users never give ratings?', a: 'Use implicit feedback: views, clicks, purchases, watch time. Libraries such as `implicit` (ALS for implicit data) and LightFM are designed for this.' },
      { q: 'How do I recommend to a brand-new user?', a: 'Start with popular or trending items, ask a few preference questions, use context (location, device, time of day) and switch to personalised recommendations after a few interactions.' },
      { q: 'Which Python tools should I try?', a: '`surprise` for classic rating-based algorithms, `implicit` and LightFM for implicit feedback, Spark MLlib\'s ALS for very large data, and TensorFlow Recommenders or PyTorch for neural two-tower models.' },
    ],
  },
};
