// Feature scaling: age (years) and income (rupees) on wildly different scales. Distances before and after
// standardisation / min-max / robust scaling, and how k-NN neighbours change. An outlier breaks min-max.
import { ReactNode, useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Dots, Seg, Label, FnLine, Caption, Readout, Slider, Choice, Toggle, Layout, Legend, useStepPlayer, PlayerControls, rng, C, Scales } from '../viz/kit';
import { inr, mean, median, quantile, sd } from './_dataprep-helpers';

/* ---------- pure helpers ---------- */
interface Cu { age: number; inc: number; name?: string } // inc in rupees
const LAKH = 100000;
function customers(seed = 6): Cu[] {
  const r = rng(seed);
  const out: Cu[] = Array.from({ length: 28 }, () => ({ age: Math.round(20 + r() * 45), inc: Math.round((3 + r() * 12) * 10) / 10 * LAKH }));
  out.push({ age: 60, inc: 6.5 * LAKH, name: 'B' }, { age: 27, inc: 12 * LAKH, name: 'C' });
  return out;
}
const A: Cu = { age: 25, inc: 6 * LAKH, name: 'A' };
const RICH: Cu = { age: 45, inc: 200 * LAKH, name: 'crorepati' };
type Scaler = 'none' | 'standard' | 'minmax' | 'robust';
function makeScaler(kind: Scaler, data: Cu[]) {
  const ages = data.map((d) => d.age), incs = data.map((d) => d.inc);
  const p = (a: number[]) => kind === 'standard' ? { c: mean(a), s: sd(a) } : kind === 'minmax' ? { c: Math.min(...a), s: Math.max(...a) - Math.min(...a) } : kind === 'robust' ? { c: median(a), s: quantile(a, 0.75) - quantile(a, 0.25) } : { c: 0, s: 1 };
  const pa = p(ages), pi = p(incs);
  return { f: (d: Cu) => ({ x: (d.age - pa.c) / (pa.s || 1), y: (d.inc - pi.c) / (pi.s || 1) }), pa, pi };
}
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
function knn(data: Cu[], q: Cu, k: number, f: (d: Cu) => { x: number; y: number }) {
  const fq = f(q);
  return data.map((d, i) => ({ i, d: dist(f(d), fq) })).sort((a, b) => a.d - b.d).slice(0, k).map((o) => o.i);
}
function Circle({ s, cx, cy, r, color = C.gold }: { s: Scales; cx: number; cy: number; r: number; color?: string }) {
  const h = (x: number) => Math.sqrt(Math.max(0, r * r - (x - cx) ** 2));
  return <><FnLine s={s} f={(x) => cy + h(x)} from={cx - r} to={cx + r} color={color} width={1.5} dash="4 3" /><FnLine s={s} f={(x) => cy - h(x)} from={cx - r} to={cx + r} color={color} width={1.5} dash="4 3" /></>;
}

/* ---------- Animate ---------- */
type View = 'natural' | 'rupees' | 'centred' | 'z' | 'minmax' | 'minmaxRich' | 'robustRich';
interface Frame { view: View; nn: boolean; dists: boolean; caption: ReactNode }
function Animate() {
  const data = useMemo(() => customers(), []);
  const B = data[data.length - 2], Cc = data[data.length - 1];
  const std = makeScaler('standard', data), mm = makeScaler('minmax', data);
  const withRich = [...data, RICH], mmR = makeScaler('minmax', withRich), rbR = makeScaler('robust', withRich);
  const raw = (d: Cu) => ({ x: d.age, y: d.inc });
  const dRaw = (a: Cu, b: Cu) => dist(raw(a), raw(b));
  const nnRaw = knn(data, A, 3, raw), nnStd = knn(data, A, 3, std.f), nnMM = knn(data, A, 3, mm.f), nnMMR = knn(withRich, A, 3, mmR.f), nnRbR = knn(withRich, A, 3, rbR.f);
  const zAB = dist(std.f(A), std.f(B)), zAC = dist(std.f(A), std.f(Cc));
  const frames: Frame[] = [
    { view: 'natural', nn: false, dists: false, caption: <>A recommender wants the customers <b>most similar</b> to <b style={{ color: C.gold }}>A</b>: 25 years old, earning ₹6 lakh. Two candidates: <b>B</b> (60 years, ₹6.5 lakh) and <b>C</b> (27 years, ₹12 lakh). On this chart C looks about as close as B, but the chart's axes were stretched to fit. The distance formula never sees the chart.</> },
    { view: 'rupees', nn: false, dists: false, caption: <>This is what a distance calculation actually "sees": <b>one year of age counts the same as one rupee</b>. Drawn with equal units on both axes, the ages (20 to 65) collapse into a <b>single vertical line</b>; all the spread is income, from ₹3,00,000 to ₹15,00,000.</> },
    { view: 'rupees', nn: false, dists: true, caption: <>Distance A–B = √(35² + 50,000²) ≈ <b>{inr(dRaw(A, B))}</b>. Distance A–C = √(2² + 6,00,000²) ≈ <b>{inr(dRaw(A, Cc))}</b>. B looks <b>{(dRaw(A, Cc) / dRaw(A, B)).toFixed(0)}× closer</b>, purely because income is measured in big numbers. A 35-year age gap counts for 35 rupees.</> },
    { view: 'natural', nn: true, dists: false, caption: <>So k-nearest-neighbours (k = 3) picks the customers with the <b>closest income</b>, whatever their age: a horizontal band (gold lines), ages {nnRaw.map((i) => data[i].age).join(', ')}. <b>Age has been silently ignored.</b></> },
    { view: 'centred', nn: false, dists: false, caption: <><b>Standardisation, step 1</b>: subtract each column's mean (age {std.pa.c.toFixed(1)} years, income ₹{(std.pi.c / LAKH).toFixed(1)} lakh). The cloud slides so the average customer sits at (0, 0). Shape unchanged, units still years and rupees.</> },
    { view: 'z', nn: false, dists: false, caption: <><b>Step 2</b>: divide by each column's standard deviation (age {std.pa.s.toFixed(1)} years, income ₹{(std.pi.s / LAKH).toFixed(2)} lakh). Now <b>one unit = one typical spread</b> on both axes, drawn here with equal units. z = (x − μ) / σ. Age is visible again.</> },
    { view: 'z', nn: false, dists: true, caption: <>Distances in standard units: A–B = <b>{zAB.toFixed(2)}</b>, A–C = <b>{zAC.toFixed(2)}</b>. Now <b>C is the nearer neighbour</b>: a 35-year age gap is about {(35 / std.pa.s).toFixed(1)} spreads, a ₹6 lakh income gap is about {(6 * LAKH / std.pi.s).toFixed(1)}. Same people, opposite answer.</> },
    { view: 'z', nn: true, dists: false, caption: <>k = 3 neighbours after scaling sit inside the gold circle: ages {nnStd.map((i) => data[i].age).join(', ')}, incomes ₹{nnStd.map((i) => (data[i].inc / LAKH).toFixed(1)).join(', ₹')} lakh. <b>Similar in both age and income.</b> {nnStd.filter((i) => !nnRaw.includes(i)).length} of the 3 neighbours changed.</> },
    { view: 'minmax', nn: true, dists: false, caption: <><b>Min-max scaling</b> is the other common choice: (x − min) / (max − min) squeezes each column into 0…1. Here it agrees with standardisation: neighbours ages {nnMM.map((i) => data[i].age).join(', ')}. Both put the features on an equal footing.</> },
    { view: 'minmaxRich', nn: true, dists: false, caption: <>But add <b>one crorepati</b> earning ₹200 lakh. Min-max divides income by the range ₹197 lakh, so everybody else is <b>crammed between 0 and 0.06</b> (the flat strip at the bottom). Income differences vanish again and neighbours are chosen almost by age alone: ages {nnMMR.map((i) => withRich[i].age).join(', ')}.{nnMMR.includes(data.length - 1) ? <> <b>C</b>, who earns twice as much as A, is back in the neighbour list.</> : null}</> },
    { view: 'robustRich', nn: true, dists: false, caption: <><b>Robust scaling</b> uses the median and IQR instead, which one extreme value cannot drag. Ordinary customers spread out properly again (the crorepati sits far off the chart) and the neighbours are sensible: ages {nnRbR.map((i) => withRich[i].age).join(', ')}. <b>Lesson:</b> distance-based models (k-NN, k-means, SVM, PCA, regularised regression) need scaling; with outliers, prefer robust scaling or a log transform. Fit the scaler on <b>training data only</b>.</> },
  ];
  const p = useStepPlayer(frames.length, 2800);
  const f = frames[p.i];
  const pts = f.view === 'minmaxRich' || f.view === 'robustRich' ? withRich : data;
  const map = (d: Cu) => {
    switch (f.view) {
      case 'natural': return { x: d.age, y: d.inc / LAKH };
      case 'rupees': return { x: d.age, y: d.inc };
      case 'centred': return { x: d.age - std.pa.c, y: d.inc - std.pi.c };
      case 'z': return std.f(d);
      case 'minmax': return mm.f(d);
      case 'minmaxRich': return mmR.f(d);
      default: return rbR.f(d);
    }
  };
  const nn = f.view === 'natural' ? nnRaw : f.view === 'z' ? nnStd : f.view === 'minmax' ? nnMM : f.view === 'minmaxRich' ? nnMMR : f.view === 'robustRich' ? nnRbR : [];
  // plot domains (equal-aspect for the scaled views: plot area is ~692 × 364 px, ratio 1.9)
  const dom: Record<View, { x: [number, number]; y: [number, number]; xl: string; yl: string; fx?: (v: number) => string; fy?: (v: number) => string }> = {
    natural: { x: [15, 70], y: [0, 17], xl: 'age (years)', yl: 'income (₹ lakh)' },
    rupees: { x: [-1.5e6, 1.54e6], y: [0, 1.6e6], xl: 'age, in the same units as income (1 year = ₹1)', yl: 'income (₹)', fx: (v) => (v === 0 ? '0' : `${(v / LAKH).toFixed(0)}L`), fy: (v) => `${(v / LAKH).toFixed(0)}L` },
    centred: { x: [-30, 35], y: [-8 * LAKH, 9 * LAKH], xl: 'age − mean (years)', yl: 'income − mean (₹)', fy: (v) => `${(v / LAKH).toFixed(0)}L` },
    z: { x: [-4.6, 4.6], y: [-2.4, 2.4], xl: 'age (z-score)', yl: 'income (z-score)' },
    minmax: { x: [-0.45, 1.45], y: [-0.0, 1.0], xl: 'age (min-max, 0–1)', yl: 'income (0–1)' },
    minmaxRich: { x: [-0.45, 1.45], y: [-0.0, 1.0], xl: 'age (min-max, 0–1)', yl: 'income (0–1, with crorepati)' },
    robustRich: { x: [-3.2, 3.2], y: [-1.6, 1.8], xl: 'age (robust: (x − median) / IQR)', yl: 'income (robust)' },
  };
  const D = dom[f.view], qa = map(A), qB = map(B), qC = map(Cc);
  const radius = nn.length ? Math.max(...nn.map((i) => dist(map(pts[i]), qa))) : 0;
  const equal = ['z', 'minmax', 'minmaxRich', 'robustRich'].includes(f.view);
  return (
    <div>
      <Layout
        main={<Plot x={D.x} y={D.y} height={420} xLabel={D.xl} yLabel={D.yl} fx={D.fx} fy={D.fy}>
          {(s) => <>
            {f.nn && nn.map((i) => <Seg key={i} s={s} x1={qa.x} y1={qa.y} x2={map(pts[i]).x} y2={map(pts[i]).y} color={C.gold} width={1.5} />)}
            {f.nn && equal && <Circle s={s} cx={qa.x} cy={qa.y} r={radius} />}
            {f.dists && <><Seg s={s} x1={qa.x} y1={qa.y} x2={qB.x} y2={qB.y} color={C.red} width={2.5} /><Seg s={s} x1={qa.x} y1={qa.y} x2={qC.x} y2={qC.y} color={C.green} width={2.5} /></>}
            <Dots s={s} pts={pts.map(map)} r={5} color={(i) => (f.nn && nn.includes(i) ? C.gold : pts[i].name ? C.purple : C.blue)} />
            <Dots s={s} pts={[qa]} r={8} color={C.gold} />
            <Label s={s} x={qa.x} y={qa.y} color={C.gold} size={14}>{'   A'}</Label>
            <Label s={s} x={qB.x} y={qB.y} color={C.purple} size={14}>{'   B'}</Label>
            <Label s={s} x={qC.x} y={qC.y} color={C.purple} size={14}>{'   C'}</Label>
            {f.view === 'minmaxRich' && <Label s={s} x={map(RICH).x} y={map(RICH).y - 0.05} color={C.red} size={12}>{'  crorepati (₹200 L)'}</Label>}
          </>}
        </Plot>}
        side={<>
          <Readout items={[
            ['A–B distance', f.view === 'rupees' || f.view === 'natural' || f.view === 'centred' ? inr(dRaw(A, B)) : dist(qa, qB).toFixed(2), C.red],
            ['A–C distance', f.view === 'rupees' || f.view === 'natural' || f.view === 'centred' ? inr(dRaw(A, Cc)) : dist(qa, qC).toFixed(2), C.green],
            ['nearer to A', (f.view === 'rupees' || f.view === 'natural' || f.view === 'centred' ? dRaw(A, B) < dRaw(A, Cc) : dist(qa, qB) < dist(qa, qC)) ? 'B (60 yrs)' : 'C (27 yrs)', C.gold],
            ['scaling', { natural: 'none', rupees: 'none', centred: 'centred', z: 'standard', minmax: 'min-max', minmaxRich: 'min-max', robustRich: 'robust' }[f.view]],
          ]} />
          <Legend items={[['customers', C.blue], ['query A / neighbours', C.gold], ['B and C', C.purple], ['A–B', C.red], ['A–C', C.green]]} />
          <p className="small muted" style={{ margin: 0 }}>Distance = √(Δage² + Δincome²). Whichever feature has the bigger numbers wins, unless you scale.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{f.caption}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
function Playground() {
  const [scaler, setScaler] = useState<Scaler>('standard');
  const [k, setK] = useState(4);
  const [rich, setRich] = useState(false);
  const [q, setQ] = useState<Cu>(A);
  const base = useMemo(() => customers(), []);
  const data = rich ? [...base, RICH] : base;
  const sc = makeScaler(scaler, data), ref = makeScaler('standard', base);
  const nn = knn(data, q, k, sc.f), nnRef = knn(base, q, k, ref.f);
  const shared = nn.filter((i) => nnRef.includes(i)).length;
  const fq = sc.f(q);
  const vis = (d: Cu) => d.inc <= 17 * LAKH;
  return (
    <Layout
      main={<>
        <div className="small muted">Click anywhere to move the query customer (gold). Gold lines = its {k} nearest neighbours under the chosen scaling.</div>
        <Plot x={[15, 70]} y={[0, 17]} height={380} xLabel="age (years)" yLabel="income (₹ lakh)" onClick={(pt) => setQ({ age: Math.round(pt.x), inc: Math.round(pt.y * 10) / 10 * LAKH })}>
          {(s) => <>
            {nn.filter((i) => vis(data[i])).map((i) => <Seg key={i} s={s} x1={q.age} y1={q.inc / LAKH} x2={data[i].age} y2={data[i].inc / LAKH} color={C.gold} width={1.5} />)}
            <Dots s={s} pts={data.filter(vis).map((d) => ({ x: d.age, y: d.inc / LAKH }))} r={5} color={(i) => (nn.includes(data.indexOf(data.filter(vis)[i])) ? C.gold : C.blue)} animate={false} />
            <Dots s={s} pts={[{ x: q.age, y: q.inc / LAKH }]} r={8} color={C.gold} animate={false} />
            {rich && <Label s={s} x={RICH.age} y={16.2} anchor="middle" color={C.red} size={12}>↑ crorepati at ₹200 L</Label>}
          </>}
        </Plot>
      </>}
      side={<>
        <Choice label="Scaling" value={scaler} onChange={setScaler} options={[{ value: 'none', label: 'None' }, { value: 'standard', label: 'Standard' }, { value: 'minmax', label: 'Min-max' }, { value: 'robust', label: 'Robust' }]} />
        <Slider label="neighbours k" min={1} max={8} value={k} onChange={setK} />
        <Toggle label="add a ₹200 lakh crorepati" value={rich} onChange={setRich} />
        <Readout items={[
          ['query', `${q.age} yrs, ₹${(q.inc / LAKH).toFixed(1)} L`, C.gold],
          ['neighbours\' ages', nn.map((i) => data[i].age).join(', ')],
          ['neighbours\' incomes', nn.map((i) => (data[i].inc / LAKH).toFixed(0)).join(', ')],
          ['same as standard (no outlier)', `${shared} of ${k}`, shared === k ? C.green : C.red],
          ['query, scaled', `(${fq.x.toFixed(2)}, ${fq.y.toFixed(2)})`],
        ]} />
        <p className="small muted" style={{ margin: 0 }}>{scaler === 'none' ? 'Unscaled: the neighbours form a horizontal band. Only income matters.' : scaler === 'minmax' && rich ? 'Min-max with an outlier: incomes are squashed together, so neighbours line up by age (a vertical band).' : 'Scaled: neighbours are close in both age and income.'}</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Which customer is most similar to **A** (25 years, ₹6 lakh)? We compute distances with raw units, then after **standardisation**, **min-max** and **robust** scaling, and watch the k-nearest neighbours change.', steps: [
      { do: 'Step to the frame with the vertical line of dots.', notice: 'In raw units one year counts as one rupee, so all ages collapse together and only income matters.' },
      { do: 'Keep stepping through the two standardisation frames.', notice: 'The cloud is centred, then rescaled; the readout flips from "B is nearer" to "C is nearer".' },
      { do: 'Watch the crorepati frames at the end.', notice: 'One outlier squashes min-max incomes into a thin strip; robust scaling spreads them out again.' },
    ] },
    Playground: { what: 'Click to place a customer and see its k nearest neighbours under different scalings, with or without an extreme earner in the data.', steps: [
      { do: 'Choose **None**, then **Standard**.', notice: 'Unscaled neighbours form a horizontal band (same income, any age); scaled neighbours cluster around the gold point.' },
      { do: 'Tick **add a ₹200 lakh crorepati** and choose **Min-max**.', notice: 'Neighbours now form a vertical band: income stopped counting. The "same as standard" readout turns red.' },
      { do: 'Switch to **Robust** with the crorepati still there.', notice: 'Neighbours look sensible again: median and IQR ignore the extreme value.' },
    ] },
  },
};
export default anim;
