import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Delaunay } from 'd3';
import { World, sx, sy, CLASS_COLORS } from '../components/World';
import { useStepPlayer, PlayerControls } from '../components/StepPlayer';
import { Tex } from '../components/Tex';
import { customers, P } from '../lib/datasets';
import { elbow, kmeans, KFrame } from '../lib/ml';
import { ModelContent } from './types';

const AX = { xLabel: 'store visits per month', yLabel: 'average basket (₹ ×1000)' };
const col = (j: number) => (j < 0 ? '#5b6576' : CLASS_COLORS[j % CLASS_COLORS.length]);

function Voronoi({ cs }: { cs: { x: number; y: number }[] }) {
  if (cs.length < 2) return null;
  const v = Delaunay.from(cs.map((c) => [c.x, c.y])).voronoi([0, 0, 10, 10]);
  return <>{cs.map((_, j) => {
    const poly = v.cellPolygon(j);
    if (!poly) return null;
    return <polygon key={j} points={poly.map(([x, y]) => `${sx(x)},${sy(y)}`).join(' ')} fill={col(j)} fillOpacity={0.07} stroke={col(j)} strokeOpacity={0.35} strokeDasharray="4 3" />;
  })}</>;
}

function Centroid({ c, j }: { c: { x: number; y: number }; j: number }) {
  return (
    <motion.g initial={false} animate={{ x: sx(c.x), y: sy(c.y) }} transition={{ duration: 0.6, ease: 'easeInOut' }}>
      <circle r={11} fill="#0b0e13" stroke={col(j)} strokeWidth={3} />
      <path d="M-5,-5L5,5M5,-5L-5,5" stroke={col(j)} strokeWidth={3} />
    </motion.g>
  );
}

function Scene({ pts, f, links = true }: { pts: P[]; f: KFrame; links?: boolean }) {
  return <>
    {f.phase !== 'init' && <Voronoi cs={f.centroids} />}
    {links && f.phase === 'assign' && pts.map((p, i) => f.assign[i] >= 0 && (
      <line key={'l' + i} x1={sx(p.x)} y1={sy(p.y)} x2={sx(f.centroids[f.assign[i]].x)} y2={sy(f.centroids[f.assign[i]].y)} stroke={col(f.assign[i])} strokeOpacity={0.25} />
    ))}
    {f.phase === 'update' && f.moved?.map((mv, j) => (
      <line key={'m' + j} x1={sx(mv.from.x)} y1={sy(mv.from.y)} x2={sx(mv.to.x)} y2={sy(mv.to.y)} stroke={col(j)} strokeDasharray="3 3" strokeWidth={1.5} />
    ))}
    {pts.map((p, i) => <motion.circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={4.5} initial={false} animate={{ fill: col(f.assign[i]) }} transition={{ duration: 0.4 }} stroke="#0b0e13" />)}
    {f.centroids.map((c, j) => <Centroid key={j} c={c} j={j} />)}
  </>;
}

function InertiaBars({ frames, cur }: { frames: KFrame[]; cur: number }) {
  const pts = frames.slice(1).filter((f) => f.phase === 'update' || f.phase === 'converged').map((f) => f.inertia);
  const max = Math.max(...pts, 1);
  const shown = frames.slice(1, cur + 1).filter((f) => f.phase === 'update' || f.phase === 'converged').length;
  return (
    <svg viewBox="0 0 220 120" className="canvas" style={{ maxWidth: 300 }}>
      <text x={8} y={14} fill="#8b95a7" fontSize={10}>inertia (total squared distance)</text>
      {pts.map((v, i) => (
        <rect key={i} x={10 + i * (200 / pts.length)} width={Math.max(4, 200 / pts.length - 4)} y={110 - (v / max) * 85} height={(v / max) * 85}
          fill={i < shown ? '#f0ac5f' : '#2a3342'} />
      ))}
    </svg>
  );
}

const PHASE_TEXT: Record<KFrame['phase'], string> = {
  init: 'Step 0: drop k centroids (✕) on random customers.',
  assign: 'Assign step: every customer joins its nearest centroid. Dashed borders show each centroid\'s territory (a Voronoi diagram).',
  update: 'Update step: each centroid moves to the average position (mean) of its members. Hence "k-means".',
  converged: 'Converged: no customer changed cluster, so the centroids won\'t move again.',
};

/* ---------- Animate ---------- */
function Animate() {
  const [k, setK] = useState(3);
  const [seed, setSeed] = useState(4);
  const [init, setInit] = useState<'random' | 'kmeans++'>('random');
  const pts = useMemo(() => customers(90, 3, 11), []);
  const frames = useMemo(() => kmeans(pts, k, seed, init), [pts, k, seed, init]);
  const p = useStepPlayer(frames.length, 1100);
  const f = frames[p.i];
  return (
    <div>
      <div className="row" style={{ marginBottom: 10 }}>
        <span className="small muted">k =</span>
        {[2, 3, 4, 5].map((v) => <button key={v} className={`btn ${k === v ? 'primary' : ''}`} onClick={() => { setK(v); p.reset(); }}>{v}</button>)}
        <span className="small muted" style={{ marginLeft: 12 }}>init:</span>
        {(['random', 'kmeans++'] as const).map((v) => <button key={v} className={`btn ${init === v ? 'primary' : ''}`} onClick={() => { setInit(v); p.reset(); }}>{v}</button>)}
        <span className="spacer" />
        <button className="btn" onClick={() => { setSeed((s) => s + 1); p.reset(); }}>🎲 New random start</button>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)' }}>
        <World {...AX}><Scene pts={pts} f={f} /></World>
        <div>
          <InertiaBars frames={frames} cur={p.i} />
          <p className="small muted" style={{ marginTop: 10 }}>Inertia can only go down or stay flat: each step is guaranteed to improve the objective. But it can get stuck in a <b>local</b> minimum. Click "New random start" a few times with k = 3 and random init to catch a bad one, then switch to k-means++.</p>
          <div className="mono small">iteration {f.iter} · inertia {f.inertia.toFixed(1)}</div>
        </div>
      </div>
      <PlayerControls p={p} />
      <div className="caption">{PHASE_TEXT[f.phase]}</div>
    </div>
  );
}

/* ---------- Playground ---------- */
function Elbow({ pts, k }: { pts: P[]; k: number }) {
  const data = useMemo(() => (pts.length >= 8 ? elbow(pts, 8) : []), [pts]);
  if (!data.length) return <p className="small muted">Add at least 8 points to see the elbow curve.</p>;
  const max = data[0].inertia || 1;
  const X = (kk: number) => 20 + (kk - 1) * 26, Y = (v: number) => 100 - (v / max) * 80;
  return (
    <svg viewBox="0 0 220 120" className="canvas" style={{ maxWidth: 300 }}>
      <text x={8} y={14} fill="#8b95a7" fontSize={10}>elbow: inertia vs k</text>
      <polyline points={data.map((d) => `${X(d.k)},${Y(d.inertia)}`).join(' ')} fill="none" stroke="#58c4dd" strokeWidth={2} />
      {data.map((d) => <g key={d.k}><circle cx={X(d.k)} cy={Y(d.inertia)} r={d.k === k ? 5 : 3} fill={d.k === k ? '#ffff00' : '#58c4dd'} /><text x={X(d.k)} y={114} fill="#5b6576" fontSize={9} textAnchor="middle">{d.k}</text></g>)}
    </svg>
  );
}

function Playground() {
  const [pts, setPts] = useState<P[]>(() => customers(45, 4, 23));
  const [k, setK] = useState(3);
  const [seed, setSeed] = useState(1);
  const frames = useMemo(() => (pts.length >= k ? kmeans(pts, k, seed, 'kmeans++', 30) : []), [pts, k, seed]);
  const [step, setStep] = useState(0);
  const i = Math.min(step, Math.max(frames.length - 1, 0));
  const f = frames[i];
  return (
    <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)' }}>
      <div>
        <World {...AX} onAdd={(q) => { setPts([...pts, q]); setStep(999); }}>
          {f ? <Scene pts={pts} f={f} links={false} /> : pts.map((p, j) => <circle key={j} cx={sx(p.x)} cy={sy(p.y)} r={4.5} fill="#5b6576" />)}
        </World>
        <p className="small muted" style={{ marginTop: 6 }}>Click to add customers. Try drawing a ring or two long thin strips: k-means assumes round, similar-sized blobs and fails on those shapes. DBSCAN handles them.</p>
      </div>
      <div className="card">
        <h3>Controls</h3>
        <div className="row small">k <input type="range" min={1} max={8} value={k} onChange={(e) => { setK(+e.target.value); setStep(999); }} /> <b>{k}</b></div>
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn" onClick={() => setStep(0)}>⏮ Re-init</button>
          <button className="btn" onClick={() => setStep(i + 1)} disabled={!f || i >= frames.length - 1}>Step ▶</button>
          <button className="btn primary" onClick={() => setStep(999)}>Run to end</button>
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn" onClick={() => { setSeed(seed + 1); setStep(999); }}>🎲 Other start</button>
          <button className="btn" onClick={() => { setPts([]); setStep(0); }}>Clear</button>
        </div>
        {f && <p className="mono small" style={{ marginTop: 10 }}>{f.phase} · iteration {f.iter} · inertia {f.inertia.toFixed(1)}</p>}
        <Elbow pts={pts} k={k} />
        <p className="small muted" style={{ marginTop: 8 }}>Look for the "elbow", the k after which adding clusters stops buying much.</p>
      </div>
    </div>
  );
}

/* ---------- Math visual ---------- */
function MathVis({ stage }: { stage: number }) {
  const pts = useMemo(() => customers(45, 3, 31), []);
  const frames = useMemo(() => kmeans(pts, 3, 6, 'random'), [pts]);
  const f = frames[Math.min(stage, frames.length - 1)];
  return <World {...AX} width={420} height={300}><Scene pts={pts} f={f} /></World>;
}

/* ---------- Pipeline data ---------- */
const segName = (c: { x: number; y: number }) =>
  c.x > 5 && c.y > 5 ? 'VIP regulars' : c.x > 5 ? 'Frequent small-basket' : c.y > 5 ? 'Big-basket occasionals' : 'Low-engagement';
const pipePts = customers(90, 3, 11);
const pipeFrames = kmeans(pipePts, 3, 2, 'kmeans++', 30);
const pipeFinal = pipeFrames[pipeFrames.length - 1];
function silhouette(pts: P[], assign: number[]) {
  const d = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y);
  const k = Math.max(...assign) + 1;
  const s = pts.map((p, i) => {
    const own = pts.filter((_, j) => assign[j] === assign[i] && j !== i);
    if (!own.length) return 0;
    const a = own.reduce((t, q) => t + d(p, q), 0) / own.length;
    let b = Infinity;
    for (let c = 0; c < k; c++) if (c !== assign[i]) {
      const o = pts.filter((_, j) => assign[j] === c);
      if (o.length) b = Math.min(b, o.reduce((t, q) => t + d(p, q), 0) / o.length);
    }
    return (b - a) / Math.max(a, b);
  });
  return s.reduce((a, b) => a + b, 0) / s.length;
}
const pipeSil = silhouette(pipePts, pipeFinal.assign);

function AssignWidget() {
  const [v, setV] = useState(6), [bk, setBk] = useState(7);
  const cs = pipeFinal.centroids;
  let j = 0; cs.forEach((c, i) => { if ((c.x - v) ** 2 + (c.y - bk) ** 2 < (cs[j].x - v) ** 2 + (cs[j].y - bk) ** 2) j = i; });
  return (
    <div>
      <div className="row small">Visits/month <input type="range" min={0} max={10} step={0.5} value={v} onChange={(e) => setV(+e.target.value)} /> {v}</div>
      <div className="row small">Avg basket ₹ <input type="range" min={0} max={10} step={0.5} value={bk} onChange={(e) => setBk(+e.target.value)} /> {bk * 1000}</div>
      <p>New customer → segment <b style={{ color: col(j) }}>#{j + 1} · {segName(cs[j])}</b></p>
    </div>
  );
}

export const kmeansModel: ModelContent = {
  story: (
    <div className="grid g2">
      <div>
        <h3>🍕 The analogy</h3>
        <p>You're opening <b>k pizza outlets</b> in a city. Drop k shops anywhere. Every house orders from its nearest shop. Then each shop relocates to the middle of its customers. Repeat until nobody switches shops. The shops end up at the centres of natural neighbourhoods. <b>That is k-means.</b></p>
        <h3>🏢 Where it is used for real</h3>
        <ul>
          <li><b>Customer segmentation</b>: retailers like Tesco and Big Bazaar group shoppers by frequency and spend to target offers.</li>
          <li><b>Image compression</b>: cluster pixel colours into k colours (colour quantisation).</li>
          <li><b>Logistics</b>: placing warehouses or EV chargers near demand clusters.</li>
          <li><b>Automotive</b>: clustering driving-cycle telemetry into usage profiles (city, highway, aggressive).</li>
        </ul>
      </div>
      <div>
        <h3>✅ Use it when</h3>
        <ul><li>You have no labels and want natural groups.</li><li>Clusters are roughly round and similar in size.</li><li>You need something fast and simple that scales to millions of rows.</li></ul>
        <h3>⛔ Avoid / be careful when</h3>
        <ul><li>Clusters are elongated, nested or of very different density (use DBSCAN or a GMM).</li><li>Features are on different scales: always <b>standardise</b> first, or the rupee column dominates.</li><li>You don't know k: use the elbow method, silhouette score or domain knowledge.</li><li>There are outliers: means get dragged around (k-medoids is more robust).</li></ul>
        <p className="caption" style={{ marginTop: 0 }}>Two moves on repeat: <b>assign</b> to the nearest centre, <b>update</b> the centre to the mean.</p>
      </div>
    </div>
  ),
  Animate,
  Playground,
  pipeline: [
    { name: 'Data', icon: '📥', detail: <p>{pipePts.length} loyalty-card customers with two behaviours: <b>store visits per month</b> and <b>average basket value</b>. No labels: nobody has told us what the segments are.</p> },
    { name: 'Clean', icon: '🧹', detail: <p>Remove test accounts and staff cards, cap extreme baskets (a ₹5 lakh wedding order would drag a centroid), and fill missing visits with 0 for inactive customers.</p> },
    { name: 'Features', icon: '🧩', detail: <><p><b>Standardise</b> every feature (z-score). k-means uses Euclidean distance, so a feature measured in thousands of rupees would otherwise overpower visits measured in single digits.</p><Tex block>{'z = \\frac{x - \\mu}{\\sigma}'}</Tex></> },
    { name: 'Choose k', icon: '🔢', detail: <><p>Run k = 1…8 and plot inertia. The elbow appears at k = 3. Business sense check: can marketing actually act on 3 segments? Yes.</p><Elbow pts={pipePts} k={3} /></> },
    { name: 'Train', icon: '🏋️', detail: <><p>k-means++ initialisation, converged in {pipeFinal.iter} iterations.</p><World {...AX} width={380} height={270}><Scene pts={pipePts} f={pipeFinal} links={false} /></World></> },
    { name: 'Evaluate', icon: '📏', detail: <><p>With no labels there's no accuracy to measure. We use:</p><ul><li><b>Silhouette score</b> = {pipeSil.toFixed(2)} (range −1 to 1; above 0.5 means well-separated)</li><li><b>Profile each cluster</b>: {pipeFinal.centroids.map((c, j) => <span key={j} style={{ color: col(j) }}> #{j + 1} {segName(c)} </span>)}</li><li><b>Stability</b>: rerun with different seeds and check the segments stay the same</li></ul></> },
    { name: 'Deploy', icon: '🚀', detail: <><p>Save the centroids (and the scaler!). New customers are assigned to the nearest centroid:</p><AssignWidget /><p className="small muted">Re-cluster every quarter, because customer behaviour drifts.</p></> },
  ],
  math: [
    { tex: 'J = \\sum_{j=1}^{k} \\sum_{x_i \\in C_j} \\lVert x_i - \\mu_j \\rVert^2', say: 'The objective (inertia): the total squared distance from each point to its cluster centre. Smaller means tighter clusters.', visual: <MathVis stage={0} /> },
    { tex: 'c_i = \\arg\\min_j \\lVert x_i - \\mu_j \\rVert^2', say: 'Assign step: with the centres frozen, the best move for every point is to join its nearest centre. This can only lower J.', visual: <MathVis stage={1} /> },
    { tex: '\\mu_j = \\frac{1}{|C_j|} \\sum_{x_i \\in C_j} x_i', say: 'Update step: with the assignments frozen, the point minimising the sum of squared distances to a group is its mean. Moving the centre there can only lower J.', visual: <MathVis stage={2} /> },
    { tex: 'J^{(t+1)} \\le J^{(t)} \\;\\Rightarrow\\; \\text{convergence (to a local minimum)}', say: 'Both steps never increase J, and there are finitely many ways to partition the points, so k-means always stops. But it may stop in a local minimum, which is why we restart several times (n_init in scikit-learn).', visual: <MathVis stage={9} /> },
    { tex: 'P(x \\text{ chosen as next centre}) = \\frac{D(x)^2}{\\sum_{x\'} D(x\')^2}', say: 'k-means++: choose each new starting centre with probability proportional to its squared distance from the existing centres. This spreads the starts out and usually avoids bad local minima.', visual: <MathVis stage={0} /> },
    { tex: 's(i) = \\frac{b(i) - a(i)}{\\max(a(i), b(i))}', say: 'Silhouette: a = mean distance to your own cluster, b = mean distance to the nearest other cluster. Close to 1 means the point is clearly in the right cluster.', visual: <MathVis stage={9} /> },
  ],
  code: [
    { title: 'From scratch (NumPy)', code: `import numpy as np

rng = np.random.default_rng(0)
centres = np.array([[2.5, 7.5], [7.5, 7.0], [5.0, 2.5]])
X = np.vstack([c + rng.normal(0, 0.9, (30, 2)) for c in centres])

def kmeans(X, k, iters=20, seed=1):
    r = np.random.default_rng(seed)
    mu = X[r.choice(len(X), k, replace=False)]          # init: k random points
    for t in range(iters):
        d = ((X[:, None, :] - mu[None, :, :]) ** 2).sum(-1)  # n × k distances
        c = d.argmin(1)                                    # ASSIGN
        new_mu = np.array([X[c == j].mean(0) if (c == j).any() else mu[j] for j in range(k)])
        J = d[np.arange(len(X)), c].sum()
        print(f"iter {t}: inertia = {J:.2f}")
        if np.allclose(new_mu, mu):
            print("converged ✔")
            break
        mu = new_mu                                        # UPDATE
    return mu, c

mu, labels = kmeans(X, 3)
print("centroids:\\n", mu.round(2))
print("cluster sizes:", np.bincount(labels))
` },
    { title: 'scikit-learn', code: `import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score

rng = np.random.default_rng(11)
visits = np.concatenate([rng.normal(2.5, .9, 30), rng.normal(7.5, .9, 30), rng.normal(5, .9, 30)])
basket = np.concatenate([rng.normal(7500, 900, 30), rng.normal(7000, 900, 30), rng.normal(2500, 900, 30)])
X = np.column_stack([visits, basket])

Xs = StandardScaler().fit_transform(X)     # crucial: rupees would dominate otherwise

for k in range(2, 7):
    km = KMeans(n_clusters=k, n_init=10, random_state=0).fit(Xs)
    print(f"k={k}  inertia={km.inertia_:7.1f}  silhouette={silhouette_score(Xs, km.labels_):.3f}")

km = KMeans(n_clusters=3, n_init=10, random_state=0).fit(Xs)
for j in range(3):
    m = X[km.labels_ == j].mean(0)
    print(f"segment {j}: {np.sum(km.labels_ == j)} customers, {m[0]:.1f} visits, ₹{m[1]:,.0f} basket")
` },
    { title: 'Classic dataset (iris)', code: `from sklearn.datasets import load_iris
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import adjusted_rand_score
import pandas as pd

iris = load_iris()
Xs = StandardScaler().fit_transform(iris.data)
km = KMeans(n_clusters=3, n_init=10, random_state=42).fit(Xs)

# We secretly know the species, so we can check how "natural" the clusters are
print("Adjusted Rand Index vs true species:", round(adjusted_rand_score(iris.target, km.labels_), 3))
print(pd.crosstab(pd.Series(iris.target_names[iris.target], name="species"),
                  pd.Series(km.labels_, name="cluster")))
` },
  ],
  quiz: [
    { q: 'What does the update step do?', options: ['Moves each point to the nearest centre', 'Moves each centre to the mean of its assigned points', 'Adds a new cluster', 'Removes outliers'], answer: 1, why: 'The mean minimises the sum of squared distances to a set of points. That is the "means" in k-means.' },
    { q: 'Why must you scale features before k-means?', options: ['It is faster', 'Euclidean distance lets large-unit features dominate', 'scikit-learn requires it', 'It guarantees k = 3'], answer: 1, why: 'Distances mix the units. ₹ in thousands would swamp visits per month, so the clusters would be cut along the rupee axis only.' },
    { q: 'Two runs give different clusters. Why?', options: ['A bug', 'Random initialisation leads to different local minima', 'The data changed', 'k-means is supervised'], answer: 1, why: 'k-means converges to a local optimum that depends on the start. Use k-means++ and several restarts (n_init).' },
    { q: 'Which shape will k-means struggle with most?', options: ['Three round blobs', 'Two concentric rings', 'Well-separated clusters', 'Equal-size groups'], answer: 1, why: 'k-means carves space into convex Voronoi cells, so it cannot represent a ring inside a ring. Use DBSCAN or spectral clustering.' },
    { q: 'Interview: how do you choose k?', options: ['Always 3', 'Elbow on inertia, silhouette score, gap statistic, and business usefulness', 'Highest k possible', 'Use accuracy'], answer: 1, why: 'Inertia always drops as k grows, so look for diminishing returns and check whether the segments are actionable.', interview: true },
    { q: 'Interview: k-means vs GMM?', options: ['Identical', 'k-means gives hard assignments with spherical clusters; a GMM gives soft probabilities with elliptical clusters', 'A GMM is supervised', 'k-means handles any shape'], answer: 1, why: 'k-means is a limiting case of a GMM with equal spherical covariances and hard assignments.', interview: true },
  ],
  cheatsheet: (
    <div>
      <h2>K-Means Clustering: cheat sheet</h2>
      <table><tbody>
        <tr><th>Goal</th><td>Partition n points into k clusters minimising <Tex>{'J=\\sum_j\\sum_{x\\in C_j}\\lVert x-\\mu_j\\rVert^2'}</Tex></td></tr>
        <tr><th>Algorithm</th><td>Init k centres → repeat: <b>assign</b> each point to its nearest centre; <b>update</b> each centre to its members' mean → until no change</td></tr>
        <tr><th>Init</th><td>k-means++ (spread out), plus several restarts (<code>n_init</code>)</td></tr>
        <tr><th>Choose k</th><td>Elbow · silhouette · gap statistic · business sense</td></tr>
        <tr><th>Complexity</th><td>O(n·k·d·iterations): fast. MiniBatchKMeans for big data.</td></tr>
        <tr><th>Assumptions</th><td>Round, similar-size, similar-density clusters; scaled features</td></tr>
        <tr><th>Fails on</th><td>Rings, moons, very different densities, heavy outliers</td></tr>
        <tr><th>sklearn</th><td><code>KMeans(n_clusters=k, n_init=10).fit(StandardScaler().fit_transform(X))</code></td></tr>
        <tr><th>Next topics</th><td>Hierarchical · DBSCAN · Gaussian Mixture Models · PCA</td></tr>
      </tbody></table>
    </div>
  ),
};
