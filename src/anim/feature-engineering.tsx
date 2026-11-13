// Feature engineering: raw district columns become a ratio, one-hot region columns and an age-from-date feature,
// and a linear model's predicted-vs-actual cloud tightens onto the diagonal as each feature is added.
import { ReactNode, useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Bars, Dots, Seg, Label, MatrixView, Caption, Readout, Choice, Toggle, Layout, Legend, useStepPlayer, PlayerControls, rng, gauss, C } from '../viz/kit';
import { dot, lstsq, mean, r2 } from '../viz/math';
import { alpha } from './_dataprep-helpers';

/* ---------- pure helpers ---------- */
const REGIONS = ['Coastal', 'Inland', 'Metro'] as const;
type Region = (typeof REGIONS)[number];
const BASE: Record<Region, number> = { Coastal: 55, Inland: 25, Metro: 62 };
interface District { rooms: number; hh: number; region: Region; built: string; year: number; value: number }
const SURVEY = 2025;
function districts(n = 120, seed = 8): District[] {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const hh = Math.round(100 * Math.exp(r() * Math.log(40))), rph = 3 + r() * 5, region = REGIONS[i % 3];
    const year = 1975 + Math.floor(r() * 46), month = 1 + Math.floor(r() * 12), day = 1 + Math.floor(r() * 28);
    const age = SURVEY - year;
    return { rooms: Math.round(hh * rph), hh, region, year, built: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`, value: Math.max(5, BASE[region] + 16 * rph - 0.6 * age + gauss(r) * 6) };
  });
}
type Enc = 'none' | 'code' | 'onehot';
interface Feat { raw: boolean; ratio: boolean; region: Enc; age: boolean }
function design(d: District, f: Feat) {
  const x = [1];
  if (f.raw) x.push(d.rooms / 1000, d.hh / 1000);
  if (f.ratio) x.push(d.rooms / d.hh);
  if (f.region === 'code') x.push(REGIONS.indexOf(d.region) + 1);
  if (f.region === 'onehot') x.push(d.region === 'Inland' ? 1 : 0, d.region === 'Metro' ? 1 : 0); // Coastal = baseline (drop first)
  if (f.age) x.push(SURVEY - d.year);
  return x;
}
function fit(train: District[], test: District[], f: Feat) {
  const b = lstsq(train.map((d) => design(d, f)), train.map((d) => d.value), 1e-8, true);
  const pred = (d: District) => dot(b, design(d, f));
  return { b, pred, r2Train: r2(train.map((d) => d.value), train.map(pred)), r2Test: r2(test.map((d) => d.value), test.map(pred)) };
}
const featCount = (f: Feat) => (f.raw ? 2 : 0) + (f.ratio ? 1 : 0) + (f.region === 'code' ? 1 : f.region === 'onehot' ? 2 : 0) + (f.age ? 1 : 0);

/* ---------- shared visuals ---------- */
function PredActual({ data, pred }: { data: District[]; pred: (d: District) => number }) {
  return <Plot x={[0, 200]} y={[0, 200]} height={300} width={380} xLabel="actual value (₹ lakh)" yLabel="predicted (₹ lakh)" xTicks={5} yTicks={5}>
    {(s) => <>
      <Seg s={s} x1={0} y1={0} x2={200} y2={200} color={C.green} dash="5 4" />
      <Dots s={s} pts={data.map((d) => ({ x: d.value, y: Math.max(0, Math.min(200, pred(d))) }))} r={3.5} color={C.yellow} />
      <Label s={s} x={135} y={185} color={C.green} size={11}>perfect</Label>
    </>}
  </Plot>;
}
type Lens = 'rooms' | 'ratio' | 'region' | 'age';
function FeatureLens({ data, lens }: { data: District[]; lens: Lens }) {
  const col = (d: District) => (d.region === 'Coastal' ? C.blue : d.region === 'Inland' ? C.purple : C.teal);
  const cfg = {
    rooms: { x: [0, 34] as [number, number], xl: 'total_rooms (thousands)', f: (d: District) => d.rooms / 1000 },
    ratio: { x: [2.5, 8.5] as [number, number], xl: 'rooms per household', f: (d: District) => d.rooms / d.hh },
    region: { x: [-0.5, 2.5] as [number, number], xl: 'region', f: (d: District, i: number) => REGIONS.indexOf(d.region) + ((i * 37) % 21 - 10) / 40 },
    age: { x: [0, 52] as [number, number], xl: 'building age (years) = 2025 − built year', f: (d: District) => SURVEY - d.year },
  }[lens];
  return <Plot x={cfg.x} y={[0, 200]} height={300} width={380} xLabel={cfg.xl} yLabel="value (₹ lakh)" xTicks={lens === 'region' ? 3 : 6} yTicks={5}
    fx={lens === 'region' ? (v) => (Number.isInteger(v) ? REGIONS[v] ?? '' : '') : undefined}>
    {(s) => <Dots s={s} pts={data.map((d, i) => ({ x: cfg.f(d, i), y: d.value }))} r={3.5} color={(i) => col(data[i])} animate={false} />}
  </Plot>;
}

/* ---------- Animate ---------- */
interface Frame { f: Feat | null; lens: Lens; cols: string[]; newCols: string[]; code: string; caption: (r2: number) => ReactNode }
const F0: Feat = { raw: false, ratio: false, region: 'none', age: false };
function Animate() {
  const all = useMemo(() => districts(), []);
  const train = all.slice(0, 90), test = all.slice(90);
  const sample = all.slice(0, 5);
  const FR: Feat = { ...F0, raw: true }, FRR: Feat = { ...FR, ratio: true }, FC: Feat = { ...FRR, region: 'code' }, FO: Feat = { ...FRR, region: 'onehot' }, FA: Feat = { ...FO, age: true };
  const fits = useMemo(() => [F0, FR, FRR, FC, FO, FA].map((f) => fit(train, test, f)), [train, test]);
  const rawCols = ['total_rooms', 'households', 'region', 'built_on', 'value'];
  const frames: (Frame & { k: number })[] = [
    { k: 0, f: F0, lens: 'rooms', cols: rawCols, newCols: [], code: 'df.head()   # 120 districts', caption: () => <>120 housing districts with <b>raw columns</b>: total rooms, households, region (text) and the date the buildings went up (text). Target: median home value. With <b>no features</b>, the best a model can do is predict the average for everyone: a flat row of yellow dots. R² = 0.</> },
    { k: 1, f: FR, lens: 'rooms', cols: rawCols, newCols: [], code: 'X = df[["total_rooms", "households"]]\nLinearRegression().fit(X, y)', caption: (r) => <>Fit a linear model on the two raw numbers. Test R² = <b>{r.toFixed(2)}</b>: weak, and the predictions barely spread out. The left chart shows why: total rooms mostly measures <b>how big the district is</b>, not how nice the homes are. Big cheap districts and small expensive ones overlap.</> },
    { k: 1, f: FR, lens: 'ratio', cols: [...rawCols, 'rooms_per_hh'], newCols: ['rooms_per_hh'], code: 'df["rooms_per_hh"] = df.total_rooms / df.households', caption: () => <><b>Ratio feature</b>: divide rooms by households. Size cancels out and what is left is <b>home size</b>: 3 rooms per home vs 8. The left chart now shows a clear upward trend. The raw columns had this signal all along; it only appeared when combined.</> },
    { k: 2, f: FRR, lens: 'ratio', cols: [...rawCols, 'rooms_per_hh'], newCols: [], code: 'X = df[[..., "rooms_per_hh"]]', caption: (r) => <>Refit with the ratio: test R² jumps to <b>{r.toFixed(2)}</b>. The yellow cloud starts leaning along the green diagonal. One division, no new data.</> },
    { k: 2, f: FRR, lens: 'region', cols: [...rawCols.slice(0, 2), 'region', 'region_code', 'value', 'rooms_per_hh'], newCols: ['region_code'], code: 'df["region_code"] = df.region.map(\n    {"Coastal": 1, "Inland": 2, "Metro": 3})', caption: () => <>Region is text, and models need numbers. The left chart shows big level differences: Metro &gt; Coastal &gt; Inland. A tempting shortcut is a <b>number code</b> 1, 2, 3. But that tells a linear model Inland sits <b>between</b> Coastal and Metro, and the steps are equal. Neither is true.</> },
    { k: 3, f: FC, lens: 'region', cols: [...rawCols.slice(0, 2), 'region', 'region_code', 'value', 'rooms_per_hh'], newCols: [], code: 'X = df[[..., "region_code"]]   # wrong encoding', caption: (r) => <>With the code, test R² = <b>{r.toFixed(2)}</b>, barely better. The model can only draw one straight slope through 1 → 2 → 3, but values go <b>down then up</b> (Inland lowest, Coastal in the middle, Metro highest, so the order 1-2-3 is wrong). The encoding invented an order.</> },
    { k: 3, f: FC, lens: 'region', cols: [...rawCols.slice(0, 2), 'region', 'Inland', 'Metro', 'value', 'rooms_per_hh'], newCols: ['Inland', 'Metro'], code: 'pd.get_dummies(df, columns=["region"],\n               drop_first=True)', caption: () => <><b>One-hot encoding</b>: one 0/1 column per region. Coastal is the baseline (both 0), so we drop its column, the other two imply it. Now the model can learn a <b>separate shift for each region</b>, in any order.</> },
    { k: 4, f: FO, lens: 'region', cols: [...rawCols.slice(0, 2), 'region', 'Inland', 'Metro', 'value', 'rooms_per_hh'], newCols: [], code: 'X = df[[..., "Inland", "Metro"]]', caption: (r) => <>Refit: test R² = <b>{r.toFixed(2)}</b>. The cloud hugs the diagonal much more tightly. Same information as the region code, encoded honestly.</> },
    { k: 4, f: FO, lens: 'age', cols: ['built_on', 'age', 'value', 'rooms_per_hh', 'Inland', 'Metro'], newCols: ['age'], code: 'built = pd.to_datetime(df.built_on)\ndf["age"] = 2025 - built.dt.year', caption: () => <><b>Date feature</b>: "2014-03-12" is a string a model cannot use. Parse it and compute <b>building age</b> at survey time. The left chart: older districts are worth less, roughly 0.6 lakh per year.</> },
    { k: 5, f: FA, lens: 'age', cols: ['built_on', 'age', 'value', 'rooms_per_hh', 'Inland', 'Metro'], newCols: [], code: 'X = df[["rooms_per_hh", "Inland", "Metro", "age", ...]]', caption: (r) => <>Final fit: test R² = <b>{r.toFixed(2)}</b>. Most of the remaining scatter is genuine noise. <b>Same rows, same algorithm, same data source</b>: only the features changed.</> },
    { k: 5, f: null, lens: 'age', cols: [], newCols: [], code: '# R² on 30 held-out districts', caption: () => <>The ladder: raw columns {fits[1].r2Test.toFixed(2)} → + ratio {fits[2].r2Test.toFixed(2)} → + region code {fits[3].r2Test.toFixed(2)} → one-hot instead {fits[4].r2Test.toFixed(2)} → + age {fits[5].r2Test.toFixed(2)}. <b>Good features usually beat a fancier model.</b> They come from understanding the business: what makes a home valuable?</> },
  ];
  const p = useStepPlayer(frames.length, 2800);
  const fr = frames[p.i];
  const ft = fits[fr.k];
  const cell = (d: District, c: string): string | number => ({
    total_rooms: d.rooms, households: d.hh, region: d.region, built_on: d.built, value: +d.value.toFixed(0), rooms_per_hh: +(d.rooms / d.hh).toFixed(2),
    region_code: REGIONS.indexOf(d.region) + 1, Inland: d.region === 'Inland' ? 1 : 0, Metro: d.region === 'Metro' ? 1 : 0, age: SURVEY - d.year,
  } as Record<string, string | number>)[c];
  const ladder = [1, 2, 3, 4, 5].map((k, i) => ({ x: i, y: Math.max(0, fits[k].r2Test) }));
  return (
    <div>
      <Layout
        main={<>
          {fr.cols.length > 0 && <div style={{ overflowX: 'auto' }}><MatrixView title="first 5 districts (new columns highlighted)" colLabels={fr.cols} data={sample.map((d) => fr.cols.map((c) => cell(d, c)))}
            cellColor={(_, c) => (fr.newCols.includes(fr.cols[c]) ? alpha(C.gold, 0.35) : fr.cols[c] === 'value' ? alpha(C.green, 0.15) : undefined)} /></div>}
          {fr.f ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            <div style={{ flex: '1 1 300px' }}><div className="small muted">Feature vs target</div><FeatureLens data={all} lens={fr.lens} /></div>
            <div style={{ flex: '1 1 300px' }}><div className="small muted">Model: predicted vs actual (test districts)</div><PredActual data={test} pred={ft.pred} /></div>
          </div>
            : <Plot x={[-0.6, 4.6]} y={[0, 1.1]} height={340} xTicks={5} fx={(v) => (['raw', '+ ratio', '+ code', 'one-hot', '+ age'][v] ?? '')} yLabel="test R²">
              {(s) => <>
                <Bars s={s} data={ladder} width={0.55} color={(i) => (i === 2 ? C.red : C.yellow)} />
                {ladder.map((d) => <Label key={d.x} s={s} x={d.x} y={d.y + 0.04} anchor="middle" size={13}>{d.y.toFixed(2)}</Label>)}
              </>}
            </Plot>}
        </>}
        side={<>
          <pre style={{ margin: 0, padding: '8px 10px', background: 'var(--bg-3)', borderRadius: 8, whiteSpace: 'pre-wrap' }}>{fr.code}</pre>
          <Readout items={[['features in model', featCount([F0, FR, FRR, FC, FO, FA][fr.k])], ['train R²', ft.r2Train.toFixed(2)], ['test R²', ft.r2Test.toFixed(2), C.yellow], ['typical error', `₹${Math.sqrt(mean(test.map((d) => (d.value - ft.pred(d)) ** 2))).toFixed(0)} L`, C.red]]} />
          <Legend items={[['Coastal', C.blue], ['Inland', C.purple], ['Metro', C.teal], ['prediction', C.yellow], ['perfect / target', C.green], ['new feature', C.gold]]} />
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{fr.caption(ft.r2Test)}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
function Playground() {
  const [raw, setRaw] = useState(true);
  const [ratio, setRatio] = useState(false);
  const [region, setRegion] = useState<Enc>('none');
  const [age, setAge] = useState(false);
  const all = useMemo(() => districts(), []);
  const train = all.slice(0, 90), test = all.slice(90);
  const f: Feat = { raw, ratio, region, age };
  const m = useMemo(() => fit(train, test, f), [train, test, raw, ratio, region, age]); // eslint-disable-line react-hooks/exhaustive-deps
  const lens: Lens = age ? 'age' : region !== 'none' ? 'region' : ratio ? 'ratio' : 'rooms';
  return (
    <Layout
      main={<div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ flex: '1 1 300px' }}><div className="small muted">Newest feature vs target</div><FeatureLens data={all} lens={lens} /></div>
        <div style={{ flex: '1 1 300px' }}><div className="small muted">Predicted vs actual on 30 held-out districts</div><PredActual data={test} pred={m.pred} /></div>
      </div>}
      side={<>
        <Toggle label="raw: total_rooms, households" value={raw} onChange={setRaw} />
        <Toggle label="ratio: rooms_per_hh" value={ratio} onChange={setRatio} />
        <Choice label="region as" value={region} onChange={setRegion} options={[{ value: 'none', label: 'left out' }, { value: 'code', label: 'code 1/2/3' }, { value: 'onehot', label: 'one-hot' }]} />
        <Toggle label="date → building age" value={age} onChange={setAge} />
        <Readout items={[['features', featCount(f)], ['train R²', m.r2Train.toFixed(2)], ['test R²', m.r2Test.toFixed(2), C.yellow], ['typical error', `₹${Math.sqrt(mean(test.map((d) => (d.value - m.pred(d)) ** 2))).toFixed(0)} L`, C.red]]} />
        <p className="small muted" style={{ margin: 0 }}>Try to reach the highest <b>test</b> R² with the fewest features. Does the ratio alone beat both raw columns? Does a number code for region help as much as one-hot?</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Raw district columns are turned into better features (a **ratio**, **one-hot** region columns, an **age** from a date) and a linear model is refitted after each one. Right chart: predictions vs actual values; the closer to the green diagonal, the better.', steps: [
      { do: 'Step through the first four frames.', notice: 'Raw total rooms gives a shapeless cloud; rooms per household shows a trend, and test R² jumps.' },
      { do: 'Watch the region frames.', notice: 'A 1/2/3 code barely helps because values go down then up; one-hot lets each region have its own shift.' },
      { do: 'Go to the last frame.', notice: 'The R² ladder: same data and algorithm, much better model, just from features.' },
    ] },
    Playground: { what: 'Switch features on and off and watch the held-out predictions tighten or scatter.', steps: [
      { do: 'Turn off **raw** and turn on only **ratio**.', notice: 'One engineered column beats the two raw ones.' },
      { do: 'Set **region as code 1/2/3**, then **one-hot**.', notice: 'The code gives a small gain; one-hot gives a big one. Encoding matters.' },
      { do: 'Add **date → building age**.', notice: 'Test R² rises again and the yellow dots hug the diagonal.' },
    ] },
  },
};
export default anim;
