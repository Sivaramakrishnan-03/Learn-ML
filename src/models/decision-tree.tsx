import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { hierarchy, tree as d3tree } from 'd3';
import { World, sx, sy } from '../components/World';
// default = red, repaid = green (semantic colours for the credit story)
const TC = ['#fc6255', '#83c167'];
import { useStepPlayer, PlayerControls } from '../components/StepPlayer';
import { Tex } from '../components/Tex';
import { loans, P } from '../lib/datasets';
import { accuracy, buildTree, predictTree, split, TreeFrame, TreeNode } from '../lib/ml';
import { ModelContent } from './types';

const AX = { xLabel: 'annual income (₹ lakh)', yLabel: 'credit score', fx: (v: number) => `${v * 3}`, fy: (v: number) => `${300 + v * 60}` };
const LABEL = ['default', 'repaid'];
const fname = (f?: 'x' | 'y') => (f === 'x' ? 'income' : 'credit');
const fval = (f: 'x' | 'y', v: number) => (f === 'x' ? `₹${(v * 3).toFixed(1)}L` : `${Math.round(300 + v * 60)}`);

function Regions({ leaves, highlight }: { leaves: TreeFrame['leaves']; highlight?: number }) {
  return <>{leaves.map((l) => (
    <motion.rect key={l.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} x={sx(l.box.x0)} y={sy(l.box.y1)} width={sx(l.box.x1) - sx(l.box.x0)} height={sy(l.box.y0) - sy(l.box.y1)}
      fill={TC[l.pred]} fillOpacity={0.06 + 0.22 * (1 - 2 * l.gini)} stroke={l.id === highlight ? '#ffff00' : '#0b0e13'} strokeWidth={l.id === highlight ? 2.5 : 1} />
  ))}</>;
}
const Dots = ({ pts }: { pts: P[] }) => <>{pts.map((p, i) => p.label === 1
  ? <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={4.5} fill={TC[1]} stroke="#0b0e13" />
  : <rect key={i} x={sx(p.x) - 4} y={sy(p.y) - 4} width={8} height={8} fill={TC[0]} stroke="#0b0e13" />)}</>;

function SplitLine({ c, box }: { c: NonNullable<TreeFrame['candidate']>; box: TreeNode['box'] }) {
  const props = c.feature === 'x'
    ? { x1: sx(c.threshold), x2: sx(c.threshold), y1: sy(box.y0), y2: sy(box.y1) }
    : { x1: sx(box.x0), x2: sx(box.x1), y1: sy(c.threshold), y2: sy(c.threshold) };
  return <motion.line initial={false} animate={props} transition={{ duration: 0.25 }} stroke={c.best ? '#ffff00' : '#f0ac5f'} strokeWidth={c.best ? 3 : 1.6} strokeDasharray={c.best ? undefined : '6 4'} />;
}

/* ---------- Tree diagram that grows with the frames ---------- */
function TreeDiagram({ root, maxId, active }: { root: TreeNode; maxId: number; active?: number }) {
  const Wd = 420, Hd = 300;
  const layout = useMemo(() => {
    const h = hierarchy<TreeNode>(root, (d) => (d.left && d.right ? [d.left, d.right] : []));
    d3tree<TreeNode>().size([Wd - 60, Hd - 70])(h);
    return h;
  }, [root]);
  const nodes = layout.descendants().filter((d) => d.data.id <= maxId);
  const links = layout.links().filter((l) => l.target.data.id <= maxId);
  return (
    <svg viewBox={`-30 -20 ${Wd} ${Hd}`} className="canvas">
      {links.map((l, i) => (
        <motion.path key={i} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} d={`M${l.source.x},${l.source.y} C${l.source.x},${(l.source.y! + l.target.y!) / 2} ${l.target.x},${(l.source.y! + l.target.y!) / 2} ${l.target.x},${l.target.y}`} fill="none" stroke="#3a4558" strokeWidth={1.5} />
      ))}
      {nodes.map((d) => {
        const n = d.data, isSplit = n.left && n.left.id <= maxId;
        return (
          <g key={n.id} transform={`translate(${d.x},${d.y})`}><motion.g initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}>
            <rect x={-46} y={-17} width={92} height={34} rx={6} fill="#151a22" stroke={n.id === active ? '#ffff00' : isSplit ? '#58c4dd' : TC[n.pred]} strokeWidth={n.id === active ? 2.5 : 1.4} />
            <text y={-3} textAnchor="middle" fill="#e6e9ef" fontSize={9.5}>{isSplit ? `${fname(n.feature)} ≤ ${fval(n.feature!, n.threshold!)}` : `→ ${LABEL[n.pred]}`}</text>
            <text y={10} textAnchor="middle" fill="#8b95a7" fontSize={8.5}>n={n.n} · gini {n.gini.toFixed(2)}</text>
          </motion.g></g>
        );
      })}
      {nodes.length > 1 && <><text x={nodes[0].x! - 60} y={nodes[0].y! + 40} fill="#5b6576" fontSize={9}>yes</text><text x={nodes[0].x! + 50} y={nodes[0].y! + 40} fill="#5b6576" fontSize={9}>no</text></>}
    </svg>
  );
}

function GiniScan({ f }: { f: TreeFrame }) {
  if (f.kind !== 'scan' || !f.scan?.length) return <div style={{ height: 90 }} />;
  const vs = f.scan, max = Math.max(...vs.map((v) => v.gini), 0.01);
  return (
    <svg viewBox="0 0 300 90" className="canvas" style={{ marginTop: 8 }}>
      <text x={6} y={12} fill="#8b95a7" fontSize={9}>weighted Gini for each threshold tried on {fname(vs[0].feature)} (lower = better)</text>
      {vs.map((v, i) => <rect key={i} x={8 + i * (284 / Math.max(vs.length, 20))} y={84 - (v.gini / max) * 62} width={Math.max(2, 284 / Math.max(vs.length, 20) - 1)} height={(v.gini / max) * 62} fill={i === vs.length - 1 ? '#f0ac5f' : '#3a4558'} />)}
    </svg>
  );
}

/* ---------- Animate ---------- */
function Animate() {
  const [depth, setDepth] = useState(3);
  const pts = useMemo(() => loans(80, 5), []);
  const { root, frames } = useMemo(() => buildTree(pts, depth, 2), [pts, depth]);
  const p = useStepPlayer(frames.length, 650);
  const f = frames[p.i];
  const maxId = Math.max(...f.leaves.map((l) => l.id));
  return (
    <div>
      <div className="row" style={{ marginBottom: 10 }}>
        <span className="small muted">max depth:</span>
        {[1, 2, 3, 4].map((v) => <button key={v} className={`btn ${depth === v ? 'primary' : ''}`} onClick={() => { setDepth(v); p.reset(); }}>{v}</button>)}
        <span className="legend" style={{ marginLeft: 12, marginTop: 0 }}>
          <span><span className="dot" style={{ background: TC[1] }} />repaid</span>
          <span><span className="dot" style={{ background: TC[0], borderRadius: 0 }} />defaulted</span>
        </span>
      </div>
      <div className="grid g2">
        <World {...AX}>
          <Regions leaves={f.leaves} highlight={f.kind === 'done' ? undefined : f.node.id} />
          <Dots pts={pts} />
          {f.candidate && <SplitLine c={f.candidate} box={f.node.box} />}
        </World>
        <div>
          <TreeDiagram root={root} maxId={maxId} active={f.kind === 'done' ? undefined : f.node.id} />
          <GiniScan f={f} />
        </div>
      </div>
      <PlayerControls p={p} />
      <div className="caption">{f.text}{f.kind === 'scan' && <span className="muted"> · The tree tries thresholds on every feature and keeps the one that makes the children purest.</span>}</div>
    </div>
  );
}

/* ---------- Playground ---------- */
const fresh = loans(300, 99);
function Playground() {
  const [pts, setPts] = useState<P[]>(() => loans(60, 8));
  const [depth, setDepth] = useState(3);
  const [minLeaf, setMinLeaf] = useState(2);
  const [cls, setCls] = useState(1);
  const { root } = useMemo(() => buildTree(pts, depth, minLeaf), [pts, depth, minLeaf]);
  const grid = useMemo(() => {
    const cells: { x: number; y: number; c: number }[] = [];
    for (let x = 0.125; x < 10; x += 0.25) for (let y = 0.125; y < 10; y += 0.25) cells.push({ x, y, c: predictTree(root, { x, y }) });
    return cells;
  }, [root]);
  const leaves = (function count(n: TreeNode): number { return n.left && n.right ? count(n.left) + count(n.right) : 1; })(root);
  const trainAcc = accuracy(pts, (q) => predictTree(root, q));
  const testAcc = accuracy(fresh, (q) => predictTree(root, q));
  return (
    <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)' }}>
      <div>
        <World {...AX} onAdd={(q, shift) => setPts([...pts, { ...q, label: shift ? 1 - cls : cls }])}>
          {grid.map((g, i) => <rect key={i} x={sx(g.x - 0.125)} y={sy(g.y + 0.125)} width={sx(0.25) - sx(0)} height={sy(0) - sy(0.25)} fill={TC[g.c]} fillOpacity={0.16} />)}
          <Dots pts={pts} />
        </World>
        <p className="small muted" style={{ marginTop: 6 }}>Click to add a <b style={{ color: TC[cls] }}>{LABEL[cls]}</b> applicant (Shift-click adds the other class). Push the depth to 10 and watch the tree draw tiny boxes around single noisy points: that is overfitting.</p>
      </div>
      <div className="card">
        <h3>Controls</h3>
        <div className="row small">Adding: {[1, 0].map((c) => <button key={c} className={`btn ${cls === c ? 'primary' : ''}`} onClick={() => setCls(c)}>{LABEL[c]}</button>)}</div>
        <div className="row small" style={{ marginTop: 8 }}>max_depth <input type="range" min={1} max={10} value={depth} onChange={(e) => setDepth(+e.target.value)} /> <b>{depth}</b></div>
        <div className="row small">min_samples_leaf <input type="range" min={1} max={15} value={minLeaf} onChange={(e) => setMinLeaf(+e.target.value)} /> <b>{minLeaf}</b></div>
        <hr style={{ borderColor: '#2a3342' }} />
        <div className="mono small">
          <div>leaves: {leaves}</div>
          <div>training accuracy: <b style={{ color: '#83c167' }}>{(trainAcc * 100).toFixed(1)}%</b></div>
          <div>accuracy on 300 fresh applicants: <b style={{ color: '#f0ac5f' }}>{(testAcc * 100).toFixed(1)}%</b></div>
        </div>
        <p className="small muted" style={{ marginTop: 8 }}>{trainAcc - testAcc > 0.12 ? '⚠ Big gap between training and fresh accuracy: the tree memorised noise (high variance).' : 'Training and fresh accuracy are close: the tree generalises.'}</p>
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn" onClick={() => setPts([])}>Clear</button>
          <button className="btn" onClick={() => setPts(loans(60, Math.floor(Math.random() * 1000)))}>New sample</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Math visual: a node and its split ---------- */
function GiniBar({ counts, label }: { counts: number[]; label: string }) {
  const n = counts[0] + counts[1] || 1;
  const g = 1 - (counts[0] / n) ** 2 - (counts[1] / n) ** 2;
  return (
    <div style={{ marginBottom: 10 }}>
      <div className="small">{label}: {counts[1]} repaid / {counts[0]} default → Gini <b>{g.toFixed(3)}</b></div>
      <div style={{ display: 'flex', height: 14, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${(counts[1] / n) * 100}%`, background: TC[1] }} />
        <div style={{ width: `${(counts[0] / n) * 100}%`, background: TC[0] }} />
      </div>
    </div>
  );
}
function MathVis({ mode }: { mode: 'pure' | 'split' | 'entropy' }) {
  if (mode === 'pure') return <div className="card"><GiniBar counts={[0, 10]} label="Pure node" /><GiniBar counts={[5, 5]} label="50/50 node" /><GiniBar counts={[2, 8]} label="Mostly repaid" /></div>;
  if (mode === 'entropy') {
    const ps = Array.from({ length: 51 }, (_, i) => i / 50);
    const X = (p: number) => 20 + p * 260, Y = (v: number) => 130 - v * 110;
    const H = (p: number) => (p === 0 || p === 1 ? 0 : -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p)));
    return (
      <svg viewBox="0 0 300 150" className="canvas">
        <polyline points={ps.map((p) => `${X(p)},${Y(2 * p * (1 - p))}`).join(' ')} fill="none" stroke="#f0ac5f" strokeWidth={2} />
        <polyline points={ps.map((p) => `${X(p)},${Y(H(p))}`).join(' ')} fill="none" stroke="#58c4dd" strokeWidth={2} />
        <text x={200} y={30} fill="#58c4dd" fontSize={10}>entropy</text><text x={200} y={70} fill="#f0ac5f" fontSize={10}>Gini</text>
        <text x={150} y={146} fill="#8b95a7" fontSize={9} textAnchor="middle">p (share of "repaid")</text>
      </svg>
    );
  }
  return <div className="card"><GiniBar counts={[20, 20]} label="Parent (40)" /><p className="small muted">split on income ≤ ₹13.5L</p><GiniBar counts={[16, 4]} label="Left (20)" /><GiniBar counts={[4, 16]} label="Right (20)" /><p className="mono small">weighted = ½·0.32 + ½·0.32 = 0.32 → gain 0.18</p></div>;
}

/* ---------- Pipeline ---------- */
const lp = (() => {
  const data = loans(200, 12);
  const { train, test } = split(data, 0.3, 7);
  const results = [1, 2, 3, 4, 6, 10].map((d) => {
    const { root } = buildTree(train, d, 3);
    return { d, tr: accuracy(train, (q) => predictTree(root, q)), te: accuracy(test, (q) => predictTree(root, q)) };
  });
  const best = results.reduce((a, b) => (b.te > a.te ? b : a));
  const { root } = buildTree(train, best.d, 3);
  let tp = 0, fp = 0, fn = 0, tn = 0;
  test.forEach((p) => { const y = predictTree(root, p); if (y === 1 && p.label === 1) tp++; else if (y === 1) fp++; else if (p.label === 1) fn++; else tn++; });
  return { data, train, test, results, best, root, cm: { tp, fp, fn, tn } };
})();

function DecideWidget() {
  const [inc, setInc] = useState(18), [cs, setCs] = useState(650);
  const pred = predictTree(lp.root, { x: inc / 3, y: (cs - 300) / 60 });
  return (
    <div>
      <div className="row small">Income ₹ <input type="range" min={1} max={30} value={inc} onChange={(e) => setInc(+e.target.value)} /> {inc} lakh</div>
      <div className="row small">Credit score <input type="range" min={300} max={900} step={10} value={cs} onChange={(e) => setCs(+e.target.value)} /> {cs}</div>
      <p>Decision: <b style={{ color: TC[pred], fontSize: '1.2rem' }}>{pred ? '✅ approve (likely to repay)' : '⛔ refer to an underwriter'}</b></p>
    </div>
  );
}

export const decisionTree: ModelContent = {
  story: (
    <div className="grid g2">
      <div>
        <h3>🎯 The analogy</h3>
        <p>Remember <b>20 Questions</b>? "Is it alive? Is it bigger than a breadbox?" Good players ask the question that splits the remaining possibilities most evenly. A decision tree does exactly that with your data: at each step it asks the single yes/no question that best separates the classes, then repeats inside each answer.</p>
        <h3>🏢 Where it is used for real</h3>
        <ul>
          <li><b>Credit decisions</b>: banks favour trees because a regulator can read the rules ("income ≥ ₹12L and score ≥ 700 → approve").</li>
          <li><b>Medical triage</b>: the famous Goldman chest-pain decision rules are a small tree.</li>
          <li><b>Customer churn</b>: telecoms use trees to explain who leaves and why.</li>
          <li><b>Foundation of the champions</b>: Random Forest, XGBoost and LightGBM are all built from trees.</li>
        </ul>
      </div>
      <div>
        <h3>✅ Use it when</h3>
        <ul><li>You need rules a human can audit.</li><li>Data mixes numeric and categorical features. No scaling is needed.</li><li>Relationships are non-linear or involve interactions ("only high income AND good score").</li></ul>
        <h3>⛔ Avoid / be careful when</h3>
        <ul><li>A deep tree overfits badly, memorising noise. Limit the depth or prune it.</li><li>It's unstable: a small change in the data can give a different tree (forests fix this).</li><li>Boundaries are axis-aligned staircases, so it's clumsy on diagonal relationships.</li></ul>
        <p className="caption" style={{ marginTop: 0 }}>Ask the question that makes the groups purest. Repeat. Stop before you memorise the data.</p>
      </div>
    </div>
  ),
  Animate,
  Playground,
  pipeline: [
    { name: 'Data', icon: '📥', detail: <p>{lp.data.length} past loan applications: <b>annual income</b>, <b>credit score</b>, and whether the loan was <b>repaid</b> ({lp.data.filter((p) => p.label).length}) or <b>defaulted</b> ({lp.data.filter((p) => !p.label).length}). About 8% of labels are noisy, as in real life.</p> },
    { name: 'Clean', icon: '🧹', detail: <p>Drop duplicate applications, fix impossible credit scores (&lt; 300), and remove features that leak the outcome (for example "collections_flag" is only filled <i>after</i> a default). Leakage is the #1 silent killer of credit models.</p> },
    { name: 'Features', icon: '🧩', detail: <p>Trees need <b>no scaling</b>: they compare one feature at a time against a threshold. Categoricals can be one-hot or ordinal encoded. Useful engineered feature: debt-to-income ratio.</p> },
    { name: 'Split', icon: '✂️', detail: <p>Stratified 70/30: <b>{lp.train.length}</b> train, <b>{lp.test.length}</b> test. Stratifying keeps the repaid/default ratio the same in both sets.</p> },
    { name: 'Train', icon: '🏋️', detail: <><p>Grow trees of different depths and compare train vs test accuracy:</p>
      <table className="mono small"><thead><tr><th>depth</th><th style={{ paddingLeft: 14 }}>train</th><th style={{ paddingLeft: 14 }}>test</th></tr></thead><tbody>
        {lp.results.map((r) => <tr key={r.d} style={{ color: r.d === lp.best.d ? '#ffff00' : undefined }}><td>{r.d}</td><td style={{ paddingLeft: 14 }}>{(r.tr * 100).toFixed(1)}%</td><td style={{ paddingLeft: 14 }}>{(r.te * 100).toFixed(1)}%</td></tr>)}
      </tbody></table><p className="small muted">Training accuracy keeps rising with depth. Test accuracy peaks and then falls. We pick depth {lp.best.d}.</p></> },
    { name: 'Evaluate', icon: '📏', detail: <><p>Confusion matrix on the test set (depth {lp.best.d}):</p>
      <table className="mono small"><tbody>
        <tr><td></td><td style={{ padding: '0 12px' }}>pred repaid</td><td style={{ padding: '0 12px' }}>pred default</td></tr>
        <tr><td>actual repaid</td><td style={{ padding: '0 12px', color: '#83c167' }}>{lp.cm.tp}</td><td style={{ padding: '0 12px', color: '#fc6255' }}>{lp.cm.fn}</td></tr>
        <tr><td>actual default</td><td style={{ padding: '0 12px', color: '#fc6255' }}>{lp.cm.fp}</td><td style={{ padding: '0 12px', color: '#83c167' }}>{lp.cm.tn}</td></tr>
      </tbody></table>
      <p className="small">Precision (of approvals, share that repay) = {(lp.cm.tp / Math.max(1, lp.cm.tp + lp.cm.fp) * 100).toFixed(0)}%. The <b>{lp.cm.fp}</b> false approvals cost the bank real money, so in practice you tune the threshold by business cost, not accuracy.</p></> },
    { name: 'Deploy', icon: '🚀', detail: <><p>The tree compiles to a handful of if/else rules, readable by risk officers and auditors. Try it:</p><DecideWidget /><p className="small muted">Monitor the approval rate and default rate monthly. Check fairness across customer groups.</p></> },
  ],
  math: [
    { tex: 'G(t) = 1 - \\sum_{c} p_c^2', say: 'Gini impurity of a node: the chance two random samples from it have different labels. 0 = pure, 0.5 = a 50/50 mix (for two classes).', visual: <MathVis mode="pure" /> },
    { tex: 'H(t) = -\\sum_c p_c \\log_2 p_c', say: 'Entropy is the alternative impurity measure (from information theory). The two curves have almost the same shape, so in practice they choose nearly the same splits.', visual: <MathVis mode="entropy" /> },
    { tex: 'G_{split} = \\frac{n_L}{n} G(L) + \\frac{n_R}{n} G(R)', say: 'A candidate split creates a left and right child. Its quality is the size-weighted average impurity of the children.', visual: <MathVis mode="split" /> },
    { tex: '\\Delta = G(t) - G_{split} \\quad \\text{(information gain)}', say: 'Gain = how much impurity drops. The algorithm tries every feature × every threshold between sorted values and keeps the largest gain. This greedy search is CART.', visual: <MathVis mode="split" /> },
    { tex: '\\text{stop if } depth = d_{max} \\;\\lor\\; n < n_{min} \\;\\lor\\; G(t)=0', say: 'Without stopping rules the tree keeps going until every leaf is pure, which means it has memorised the training data. Depth, minimum samples and cost-complexity pruning (ccp_alpha) control this.', visual: <MathVis mode="pure" /> },
    { tex: '\\hat{y}(x) = \\arg\\max_c \\; p_c(\\text{leaf}(x)), \\quad \\hat{P}(c\\mid x) = p_c', say: 'To predict, drop the point down the tree to a leaf. The leaf\'s majority class is the prediction, and its class shares are the probability estimates.', visual: <MathVis mode="pure" /> },
  ],
  code: [
    { title: 'From scratch (NumPy)', code: `import numpy as np

rng = np.random.default_rng(5)
X = rng.uniform(0, 10, (120, 2))
y = (((X[:, 0] > 4.5).astype(int) + (X[:, 1] > 5.5)) >= 1).astype(int)

def gini(y):
    if len(y) == 0: return 0.0
    p = np.bincount(y, minlength=2) / len(y)
    return 1 - (p ** 2).sum()

def best_split(X, y):
    best = (None, None, gini(y))
    for f in range(X.shape[1]):
        vals = np.unique(X[:, f])
        for t in (vals[:-1] + vals[1:]) / 2:
            L, R = y[X[:, f] <= t], y[X[:, f] > t]
            g = (len(L) * gini(L) + len(R) * gini(R)) / len(y)
            if g < best[2]:
                best = (f, t, g)
    return best

def grow(X, y, depth=0, max_depth=3):
    f, t, g = best_split(X, y)
    if depth == max_depth or f is None or gini(y) == 0:
        return int(np.bincount(y).argmax())
    print("  " * depth + f"x{f} <= {t:.2f}  (gini {gini(y):.3f} -> {g:.3f}, n={len(y)})")
    m = X[:, f] <= t
    return (f, t, grow(X[m], y[m], depth + 1, max_depth), grow(X[~m], y[~m], depth + 1, max_depth))

def predict(node, x):
    while isinstance(node, tuple):
        f, t, l, r = node
        node = l if x[f] <= t else r
    return node

tree = grow(X, y)
acc = np.mean([predict(tree, x) == t for x, t in zip(X, y)])
print(f"\\ntraining accuracy: {acc:.3f}")
` },
    { title: 'scikit-learn', code: `import numpy as np
from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.model_selection import train_test_split

rng = np.random.default_rng(12)
income = rng.uniform(1, 30, 400)            # ₹ lakh
score = rng.uniform(300, 900, 400)          # credit score
y = (((income > 13.5).astype(int) + (score > 630) + ((income > 21) & (score > 450))) >= 2).astype(int)
flip = rng.random(400) < 0.08; y[flip] = 1 - y[flip]       # label noise
X = np.column_stack([income, score])

X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.3, stratify=y, random_state=7)

for d in [1, 2, 3, 4, 6, 10, None]:
    clf = DecisionTreeClassifier(max_depth=d, random_state=0).fit(X_tr, y_tr)
    print(f"depth={str(d):>4}  train={clf.score(X_tr, y_tr):.3f}  test={clf.score(X_te, y_te):.3f}  leaves={clf.get_n_leaves()}")

clf = DecisionTreeClassifier(max_depth=3, random_state=0).fit(X_tr, y_tr)
print("\\n" + export_text(clf, feature_names=["income", "credit_score"]))
` },
    { title: 'Classic dataset (iris)', code: `from sklearn.datasets import load_iris
from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.model_selection import cross_val_score
import pandas as pd

iris = load_iris()
clf = DecisionTreeClassifier(max_depth=3, random_state=0)
print("5-fold CV accuracy:", cross_val_score(clf, iris.data, iris.target, cv=5).mean().round(3))

clf.fit(iris.data, iris.target)
print(export_text(clf, feature_names=iris.feature_names))
print(pd.Series(clf.feature_importances_, index=iris.feature_names).sort_values(ascending=False).round(3))
` },
  ],
  quiz: [
    { q: 'What is the Gini impurity of a node with 50% of each class?', options: ['0', '0.25', '0.5', '1'], answer: 2, why: '1 − (0.5² + 0.5²) = 0.5, the maximum for two classes.' },
    { q: 'How does a tree choose a split?', options: ['Randomly', 'It tries features and thresholds and keeps the one with the lowest weighted child impurity', 'Always the first feature', 'It uses gradient descent'], answer: 1, why: 'CART greedily evaluates every feature and threshold and keeps the largest impurity reduction.' },
    { q: 'Training accuracy is 100% but test accuracy is 72%. What happened?', options: ['Underfitting', 'Overfitting: the tree memorised noise', 'Data leakage made the test set too hard', 'Perfect model'], answer: 1, why: 'A deep tree can isolate every training point. Limit max_depth or min_samples_leaf, or prune with ccp_alpha.' },
    { q: 'Do decision trees need feature scaling?', options: ['Yes, always', 'No, splits compare one feature to a threshold, so scale does not matter', 'Only for categorical features', 'Only with entropy'], answer: 1, why: 'Monotonic transformations of a feature don\'t change which samples fall on each side of a threshold.' },
    { q: 'Interview: why are random forests usually better than one tree?', options: ['They are easier to read', 'Averaging many decorrelated trees reduces variance', 'They use linear models', 'They never overfit'], answer: 1, why: 'Bagging plus random feature subsets give diverse trees whose errors partly cancel. Variance falls while bias stays similar.', interview: true },
    { q: 'Interview: what is a weakness of impurity-based feature importance?', options: ['None', 'It is biased toward high-cardinality / continuous features', 'It is always negative', 'It needs scaling'], answer: 1, why: 'Features with many possible split points get more chances to look useful. Prefer permutation importance or SHAP.', interview: true },
  ],
  cheatsheet: (
    <div>
      <h2>Decision Tree: cheat sheet</h2>
      <table><tbody>
        <tr><th>Idea</th><td>Recursively split the feature space with yes/no questions so that the children are as pure as possible (CART)</td></tr>
        <tr><th>Impurity</th><td>Gini <Tex>{'1-\\sum p_c^2'}</Tex> · Entropy <Tex>{'-\\sum p_c\\log_2 p_c'}</Tex> · Regression: variance / MSE</td></tr>
        <tr><th>Split score</th><td><Tex>{'\\frac{n_L}{n}G(L)+\\frac{n_R}{n}G(R)'}</Tex>; pick the max gain over all features × thresholds</td></tr>
        <tr><th>Stopping / pruning</th><td><code>max_depth</code>, <code>min_samples_leaf</code>, <code>min_samples_split</code>, <code>ccp_alpha</code></td></tr>
        <tr><th>Strengths</th><td>Interpretable · no scaling needed · handles interactions and non-linearity · fast prediction</td></tr>
        <tr><th>Weaknesses</th><td>Overfits · unstable · axis-aligned boundaries · biased importances</td></tr>
        <tr><th>sklearn</th><td><code>DecisionTreeClassifier(max_depth=3).fit(X, y)</code>; <code>export_text</code>, <code>plot_tree</code></td></tr>
        <tr><th>Next topics</th><td>Bagging → Random Forest → AdaBoost → Gradient Boosting → XGBoost</td></tr>
      </tbody></table>
    </div>
  ),
};
