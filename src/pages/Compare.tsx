import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { World, sx, sy, CLASS_COLORS } from '../components/World';
import { blobs2, circles, loans, moons, P } from '../lib/datasets';
import { accuracy, buildTree, knnFit, logisticFit, predictTree, split } from '../lib/ml';

const DATASETS: Record<string, { name: string; make: () => P[] }> = {
  blobs: { name: 'Two blobs (linear)', make: () => blobs2(160, 9) },
  moons: { name: 'Moons (curved)', make: () => moons(200, 3) },
  circles: { name: 'Circles (nested)', make: () => circles(200, 4) },
  loans: { name: 'Loan approvals (business)', make: () => loans(200, 12) },
};

function Panel({ title, link, f, train, test, note }: { title: string; link?: string; f: (q: { x: number; y: number }) => number; train: P[]; test: P[]; note: string }) {
  const grid = useMemo(() => {
    const g: { x: number; y: number; c: number }[] = [];
    for (let x = 0.1; x < 10; x += 0.2) for (let y = 0.1; y < 10; y += 0.2) g.push({ x, y, c: f({ x, y }) });
    return g;
  }, [f]);
  const tr = accuracy(train, f), te = accuracy(test, f);
  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="row"><h2 className="h3" style={{ margin: 0 }}>{link ? <Link to={link}>{title}</Link> : title}</h2></div>
      <World width={360} height={260} ariaLabel={`${title} decision regions: train accuracy ${(tr * 100).toFixed(0)}%, test accuracy ${(te * 100).toFixed(0)}%`}>
        {grid.map((g, i) => <rect key={i} x={sx(g.x - 0.1)} y={sy(g.y + 0.1)} width={sx(0.2) - sx(0) + 0.5} height={sy(0) - sy(0.2) + 0.5} fill={CLASS_COLORS[g.c]} fillOpacity={0.17} />)}
        {train.map((p, i) => <circle key={'a' + i} cx={sx(p.x)} cy={sy(p.y)} r={3.2} fill={CLASS_COLORS[p.label!]} />)}
        {test.map((p, i) => <circle key={'b' + i} cx={sx(p.x)} cy={sy(p.y)} r={3.6} fill="none" stroke={CLASS_COLORS[p.label!]} strokeWidth={1.5} />)}
      </World>
      <div className="mono small" style={{ marginTop: 6 }}>train {(tr * 100).toFixed(0)}% · <b style={{ color: 'var(--gold-text)' }}>test {(te * 100).toFixed(0)}%</b></div>
      <p className="small muted" style={{ margin: '4px 0 0' }}>{note}</p>
    </div>
  );
}

export default function Compare() {
  const [ds, setDs] = useState('moons');
  const [k, setK] = useState(7);
  const [depth, setDepth] = useState(4);
  const data = useMemo(() => DATASETS[ds].make(), [ds]);
  const { train, test } = useMemo(() => split(data, 0.3, 1), [data]);
  const fLog = useMemo(() => logisticFit(train), [train]);
  const fKnn = useMemo(() => knnFit(train, k), [train, k]);
  const fTree = useMemo(() => { const { root } = buildTree(train, depth, 2); return (q: { x: number; y: number }) => predictTree(root, q); }, [train, depth]);
  return (
    <div>
      <h1>⚖️ Compare models</h1>
      <div className="page-intro"><b>What this shows:</b> three classifiers trained on the same data. The shaded background is what each model would predict anywhere on the chart, its "decision boundary".
        <ul className="small"><li>Pick a dataset with the buttons. Start with <b>Two blobs</b>, then try <b>Circles</b>.</li><li>Move the sliders for k-NN and tree depth and watch the boundaries change.</li><li>Compare <b>train</b> vs <b>test</b> accuracy: a big gap means the model memorised the training data (overfitting).</li></ul></div>
      <p className="muted">Same data, same train/test split, three very different ideas of a "boundary". Filled dots = training data, hollow dots = test data.</p>
      <div className="row" style={{ marginBottom: 12 }}>
        {Object.entries(DATASETS).map(([key, d]) => <button key={key} type="button" aria-pressed={ds === key} className={`btn ${ds === key ? 'primary' : ''}`} onClick={() => setDs(key)}>{d.name}</button>)}
      </div>
      <div className="row small" style={{ marginBottom: 12 }}>
        <label className="row small">k-NN k <input type="range" min={1} max={31} step={2} value={k} onChange={(e) => setK(+e.target.value)} /> <b>{k}</b></label>
        <span style={{ width: 20 }} />
        <label className="row small">tree depth <input type="range" min={1} max={10} value={depth} onChange={(e) => setDepth(+e.target.value)} /> <b>{depth}</b></label>
      </div>
      <div className="grid g3">
        <Panel title="Logistic Regression" link="/topic/logistic-regression" f={fLog} train={train} test={test} note="Always a straight line. Great when the classes really are linearly separable, helpless on circles." />
        <Panel title={`k-NN (k=${k})`} link="/topic/knn" f={fKnn} train={train} test={test} note="Smooth, any shape. k=1 memorises the data; a large k blurs everything." />
        <Panel title={`Decision Tree (depth ${depth})`} link="/topic/decision-tree" f={fTree} train={train} test={test} note="Axis-aligned staircase. A deep tree carves out islands around noise." />
      </div>
      <div className="caption" style={{ marginTop: 14 }}>Try: <b>Circles</b> → logistic regression drops to about 50% (coin-flip). <b>Moons</b> + k = 1 → 100% train but lower test. That is overfitting in one picture.</div>
    </div>
  );
}
