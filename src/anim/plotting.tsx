// Plotting & EDA: one dataset of delivery times seen as a histogram, a box plot and a scatter plot.
// Each chart reveals something the others hide; one anomaly is visible only in the scatter.
import { ReactNode, useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Bars, Dots, Seg, Label, Region, FnLine, Caption, Readout, Slider, Choice, Toggle, Layout, Legend, useStepPlayer, PlayerControls, rng, gauss, C } from '../viz/kit';
import { boxStats, histogram, lstsq, mean, median } from '../viz/math';

/* ---------- pure helpers ---------- */
interface Pt { d: number; t: number }
const FAR = 40, ODD = 41; // indices of the long trip and of the hidden anomaly
function deliveries(seed = 5, farD = 18.5): Pt[] {
  const r = rng(seed), pts: Pt[] = [];
  for (let i = 0; i < 40; i++) { const d = 1 + r() * 8; pts.push({ d, t: 14 + 3 * d + gauss(r) * 2.5 }); }
  pts.push({ d: farD, t: 72 });   // a long trip: extreme time, but explained by distance
  pts.push({ d: 1.6, t: 38 });    // ordinary time, ordinary distance, wrong combination
  return pts;
}
function twoKitchens(seed = 9): Pt[] {
  const r = rng(seed), pts: Pt[] = [];
  for (let i = 0; i < 42; i++) { const slow = i % 2 === 1, d = 1 + r() * 8; pts.push({ d, t: (slow ? 38 : 14) + 1.2 * d + gauss(r) * 2 }); }
  return pts;
}
function fitLine(pts: Pt[]) { const [b0, b1] = lstsq(pts.map((p) => [1, p.d]), pts.map((p) => p.t), 1e-8, true); return { b0, b1, f: (d: number) => b0 + b1 * d }; }
function anomalies(pts: Pt[]) {
  const L = fitLine(pts), res = pts.map((p) => p.t - L.f(p.d));
  const s = median(res.map(Math.abs)) * 1.4826 || 1;
  return { L, res, flag: res.map((e) => Math.abs(e) > 3.5 * s), s };
}
const T: [number, number] = [10, 80];

/* ---------- three linked charts ---------- */
function Charts({ pts, show, bins = 14, hlIdx, strip }: { pts: Pt[]; show: { hist: boolean; box: number; scatter: number; mean?: boolean }; bins?: number; hlIdx?: number[]; strip?: boolean }) {
  const ts = pts.map((p) => p.t), b = boxStats(ts), h = histogram(ts, T[0], T[1], bins), w = (T[1] - T[0]) / bins;
  const yMax = Math.max(6, ...h.map((d) => d.y)) * 1.15;
  const an = anomalies(pts);
  const hl = new Set(hlIdx ?? []);
  const outIdx = ts.map((t, i) => (t < b.loF || t > b.hiF ? i : -1)).filter((i) => i >= 0);
  return <>
    <div className="small muted">① Histogram: how are delivery times distributed?</div>
    <Plot x={T} y={[0, yMax]} height={180} xLabel="delivery time (minutes)" yLabel="orders">
      {(s) => <>
        {show.hist && <Bars s={s} data={h} width={w * 0.92} color={C.blue} />}
        {strip && <Dots s={s} pts={ts.map((t, i) => ({ x: t, y: yMax * (0.1 + ((i * 7) % 10) * 0.07) }))} color={C.blue} r={4} animate={false} />}
        {[...hl].map((i) => <Seg key={i} s={s} x1={ts[i]} x2={ts[i]} y1={0} y2={yMax} color={C.gold} width={2.5} dash="4 3" />)}
        {show.mean && <Seg s={s} x1={mean(ts)} x2={mean(ts)} y1={0} y2={yMax} color={C.green} dash="6 4" />}
      </>}
    </Plot>
    <div className="small muted" style={{ marginTop: 6 }}>② Box plot: where is the middle, how wide, what is unusual?</div>
    <Plot x={T} y={[0, 1]} height={110} xLabel="delivery time (minutes)" fy={() => ''} yTicks={1}>
      {(s) => <>
        {show.box >= 2 && <Region s={s} x0={b.q1} x1={b.q3} y0={0.25} y1={0.75} color={C.blue} opacity={0.3} stroke={C.blue} />}
        {show.box >= 1 && <Seg s={s} x1={b.med} x2={b.med} y1={0.2} y2={0.8} color={C.text} width={3} />}
        {show.box >= 3 && <>
          <Seg s={s} x1={b.wLo} x2={b.q1} y1={0.5} y2={0.5} color={C.blue} /><Seg s={s} x1={b.q3} x2={b.wHi} y1={0.5} y2={0.5} color={C.blue} />
          <Seg s={s} x1={b.wLo} x2={b.wLo} y1={0.35} y2={0.65} color={C.blue} /><Seg s={s} x1={b.wHi} x2={b.wHi} y1={0.35} y2={0.65} color={C.blue} />
          <Seg s={s} x1={b.hiF} x2={b.hiF} y1={0.05} y2={0.95} color={C.muted} dash="3 3" />
          <Dots s={s} pts={outIdx.map((i) => ({ x: ts[i], y: 0.5 }))} color={C.red} r={6} animate={false} />
          {b.hiF < 76 && <Label s={s} x={b.hiF + 0.6} y={0.85} size={11} color={C.muted}>fence</Label>}
        </>}
        {show.mean && <Seg s={s} x1={mean(ts)} x2={mean(ts)} y1={0.1} y2={0.9} color={C.green} dash="6 4" width={2.5} />}
        {[...hl].map((i) => <Dots key={i} s={s} pts={[{ x: ts[i], y: 0.5 }]} color={C.gold} r={7} animate={false} />)}
      </>}
    </Plot>
    {show.scatter > 0 && <>
      <div className="small muted" style={{ marginTop: 6 }}>③ Scatter: does time depend on distance?</div>
      <Plot x={[0, 20]} y={T} height={270} xLabel="distance (km)" yLabel="minutes">
        {(s) => <>
          {show.scatter >= 2 && <FnLine s={s} f={an.L.f} color={C.yellow} width={2} />}
          {show.scatter >= 3 && an.flag.map((fl, i) => fl ? <Seg key={i} s={s} x1={pts[i].d} x2={pts[i].d} y1={an.L.f(pts[i].d)} y2={pts[i].t} color={C.red} width={2.5} /> : null)}
          <Dots s={s} pts={pts.map((p) => ({ x: p.d, y: p.t }))} r={5} color={(i) => (hl.has(i) ? C.gold : show.scatter >= 3 && an.flag[i] ? C.red : C.blue)} />
        </>}
      </Plot>
    </>}
  </>;
}

/* ---------- Animate ---------- */
interface Frame { show: { hist: boolean; box: number; scatter: number; mean?: boolean }; strip?: boolean; hl?: number[]; caption: ReactNode }
function Animate() {
  const pts = useMemo(() => deliveries(), []);
  const ts = pts.map((p) => p.t), b = boxStats(ts), an = anomalies(pts);
  const exp = an.L.f(pts[ODD].d);
  const frames: Frame[] = [
    { show: { hist: false, box: 0, scatter: 0 }, strip: true, caption: <>Here are <b>{pts.length} food-delivery times</b> as dots on a line (stacked a little so they do not overlap). As a list of numbers this is just a column in a spreadsheet. Can you see the pattern yet? Let's draw it three ways.</> },
    { show: { hist: true, box: 0, scatter: 0 }, caption: <>A <b>histogram</b> counts orders in 5-minute bins. Now the <b>shape</b> appears: most deliveries take 20–40 minutes, the pile is fairly symmetric, and one lonely bar sits far to the right at <b>72 minutes</b>.</> },
    { show: { hist: true, box: 0, scatter: 0 }, hl: [FAR], caption: <>The histogram's strength is <b>shape</b>: peaks, skew, gaps, a second hump. Its weakness: it tells you nothing about <i>why</i> the 72-minute order (gold) is slow. And the picture changes with the bin width (try it in the Playground).</> },
    { show: { hist: true, box: 1, scatter: 0 }, caption: <>A <b>box plot</b> summarises the same numbers with five markers. First the <b>median</b> (white line): half the orders took less than <b>{b.med.toFixed(1)} min</b>, half took more.</> },
    { show: { hist: true, box: 2, scatter: 0 }, caption: <>The <b>box</b> spans the middle half of the orders, from Q1 = {b.q1.toFixed(1)} to Q3 = {b.q3.toFixed(1)} min. Its width is the <b>IQR = {b.iqr.toFixed(1)} min</b>: the typical spread, not dragged by extremes.</> },
    { show: { hist: true, box: 3, scatter: 0 }, caption: <>Whiskers reach the furthest points inside the <b>fences</b> (1.5 × IQR beyond the box, here up to {b.hiF.toFixed(1)} min). Anything beyond is drawn as a dot: the 72-minute order is flagged as an <b style={{ color: C.red }}>outlier</b>. The box plot's strength: <b>outliers and spread at a glance</b>.</> },
    { show: { hist: true, box: 3, scatter: 0, mean: true }, caption: <>The green dashed line is the <b>mean</b>, {mean(ts).toFixed(1)} min, a little above the median {b.med.toFixed(1)} because the one slow order pulls it right. Box plot verdict: "typical ≈ {b.med.toFixed(0)} minutes, one extreme case to investigate".</> },
    { show: { hist: true, box: 3, scatter: 1 }, caption: <>Now a <b>scatter plot</b>: each order is a dot at (distance, time). Both histogram and box plot looked at time <b>alone</b>; the scatter shows the <b>relationship</b> between two columns.</> },
    { show: { hist: true, box: 3, scatter: 2 }, caption: <>A clear trend (yellow line): every extra km adds about <b>{an.L.b1.toFixed(1)} minutes</b>. Distance explains most of the variation in delivery time.</> },
    { show: { hist: true, box: 3, scatter: 2 }, hl: [FAR], caption: <>The "outlier" from the box plot (gold) sits <b>right on the trend</b>: it was an {pts[FAR].d.toFixed(1)} km trip. Not an error, not suspicious, just far. The box plot was right that it is extreme, but only the scatter explains it.</> },
    { show: { hist: true, box: 3, scatter: 3 }, caption: <>And the scatter exposes something the other two missed: an order only <b>{pts[ODD].d.toFixed(1)} km</b> away that took <b>{pts[ODD].t} min</b>. The trend predicts about {exp.toFixed(0)} min, so it is <b style={{ color: C.red }}>{(pts[ODD].t - exp).toFixed(0)} minutes too slow</b> (red residual). A lost rider? A kitchen delay? Worth a phone call.</> },
    { show: { hist: true, box: 3, scatter: 3 }, hl: [ODD], caption: <>Find that order (gold) in the histogram and box plot: it looks <b>completely ordinary</b>, {pts[ODD].t} min is inside the box's whiskers. The time is normal and the distance is normal; only the <b>combination</b> is odd. <b>Histogram → shape. Box plot → centre, spread, extremes. Scatter → relationships and contextual anomalies.</b> Always look at more than one.</> },
  ];
  const p = useStepPlayer(frames.length, 2600);
  const f = frames[p.i];
  return (
    <div>
      <Layout
        main={<Charts pts={pts} show={f.show} hlIdx={f.hl} strip={f.strip} />}
        side={<>
          <Readout items={[
            ['orders', pts.length], ['median', `${b.med.toFixed(1)} min`], ['mean', `${mean(ts).toFixed(1)} min`, C.green],
            ['IQR', `${b.iqr.toFixed(1)} min`, C.blue], ['box-plot outliers', b.out.length, C.red],
            ['scatter anomalies', f.show.scatter >= 3 ? an.flag.filter(Boolean).length : '?', C.red],
          ]} />
          <Legend items={[['orders (data)', C.blue], ['trend (model)', C.yellow], ['mean', C.green], ['outlier / residual', C.red], ['order in focus', C.gold]]} />
          <div className="small">
            <div><b style={{ color: C.blue }}>Histogram</b>: shape, skew, humps</div>
            <div><b style={{ color: C.blue }}>Box plot</b>: median, IQR, outliers</div>
            <div><b style={{ color: C.blue }}>Scatter</b>: relationships, odd combinations</div>
          </div>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{f.caption}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
type DS = 'deliveries' | 'kitchens';
function Playground() {
  const [ds, setDs] = useState<DS>('deliveries');
  const [bins, setBins] = useState(14);
  const [farD, setFarD] = useState(18.5);
  const [showMean, setShowMean] = useState(true);
  const pts = useMemo(() => (ds === 'deliveries' ? deliveries(5, farD) : twoKitchens()), [ds, farD]);
  const ts = pts.map((p) => p.t), b = boxStats(ts), an = anomalies(pts);
  return (
    <Layout
      main={<Charts pts={pts} show={{ hist: true, box: 3, scatter: 3, mean: showMean }} bins={bins} hlIdx={ds === 'deliveries' ? [FAR] : []} />}
      side={<>
        <Choice label="Dataset" value={ds} onChange={setDs} options={[{ value: 'deliveries', label: 'One restaurant' }, { value: 'kitchens', label: 'Two kitchens' }]} />
        <Slider label="histogram bins" min={3} max={35} value={bins} onChange={setBins} />
        {ds === 'deliveries' && <Slider label="72-min order: distance" min={1} max={19} step={0.5} value={farD} onChange={setFarD} format={(v) => `${v} km`} />}
        <Toggle label="show the mean (green)" value={showMean} onChange={setShowMean} />
        <Readout items={[
          ['median', `${b.med.toFixed(1)} min`], ['mean', `${mean(ts).toFixed(1)} min`, C.green],
          ['box-plot outliers', b.out.length, C.red], ['scatter anomalies', an.flag.filter(Boolean).length, C.red],
        ]} />
        <p className="small muted" style={{ margin: 0 }}>
          {ds === 'kitchens'
            ? 'Two kitchens, one fast and one slow. The histogram shows two humps (with enough bins); the box plot shows one fat box and hides them completely.'
            : farD < 12 ? 'Now the 72-minute order is a short trip: the scatter flags it as a real anomaly, while the histogram and box plot look exactly the same as before.'
              : 'The gold 72-minute order is far away, so the scatter says it is explained. Drag its distance down and watch only the scatter change its verdict.'}
        </p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Forty-two delivery times drawn three ways: **histogram**, **box plot** and **scatter** against distance. Each chart answers a different question, and one odd order shows up in only one of them.', steps: [
      { do: 'Press **▶ Play** and watch the histogram and box plot build.', notice: 'Both flag the 72-minute order as extreme; the box plot marks it with a red dot beyond the fence.' },
      { do: 'Keep going to the scatter frames.', notice: 'The 72-minute order lies on the trend (a long trip), while a 38-minute order at 1.6 km gets a red residual.' },
      { do: 'Look at the last frame.', notice: 'The gold order looks ordinary in the histogram and box plot: only the scatter can see a strange **combination**.' },
    ] },
    Playground: { what: 'Change the data and the chart settings and see which chart notices what.', steps: [
      { do: 'Drag **histogram bins** from 3 to 35.', notice: 'Too few bins hide detail; too many make noise. The data never changed.' },
      { do: 'Drag **72-min order: distance** down to 3 km.', notice: 'Histogram and box plot do not move at all; the scatter now flags that order as an anomaly.' },
      { do: 'Switch to **Two kitchens** and set about 15–20 bins.', notice: 'The histogram shows two humps; the box plot shows a single box and hides the two groups.' },
    ] },
  },
};
export default anim;
