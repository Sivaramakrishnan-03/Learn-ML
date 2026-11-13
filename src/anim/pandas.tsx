// pandas: a DataFrame being given a new column, filtered, and grouped (split -> apply -> combine), then joined to targets.
import { ReactNode, useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Bars, Seg, Label, MatrixView, Caption, Readout, Slider, Choice, Toggle, Layout, Legend, useStepPlayer, PlayerControls, C } from '../viz/kit';
import { mean, sum } from '../viz/math';
import { alpha } from './_dataprep-helpers';

/* ---------- pure helpers ---------- */
interface Order { id: number; city: string; product: string; units: number; price: number }
const ORDERS: Order[] = [
  { id: 1, city: 'Chennai', product: 'Tea', units: 10, price: 50 },
  { id: 2, city: 'Pune', product: 'Coffee', units: 4, price: 120 },
  { id: 3, city: 'Chennai', product: 'Coffee', units: 6, price: 120 },
  { id: 4, city: 'Kochi', product: 'Tea', units: 12, price: 50 },
  { id: 5, city: 'Pune', product: 'Tea', units: 8, price: 50 },
  { id: 6, city: 'Chennai', product: 'Tea', units: 5, price: 50 },
];
const EXTRA: Order[] = [
  { id: 7, city: 'Kochi', product: 'Coffee', units: 3, price: 120 },
  { id: 8, city: 'Pune', product: 'Coffee', units: 7, price: 120 },
  { id: 9, city: 'Kochi', product: 'Biscuits', units: 25, price: 30 },
  { id: 10, city: 'Chennai', product: 'Biscuits', units: 20, price: 30 },
];
const TARGET: Record<string, number> = { Chennai: 1500, Kochi: 700, Pune: 800 };
const KEYC: Record<string, string> = { Chennai: C.blue, Kochi: C.pink, Pune: C.purple, Tea: C.teal, Coffee: C.gold, Biscuits: C.purple };
const rev = (o: Order) => o.units * o.price;
const BASE_COLS = ['order_id', 'city', 'product', 'units', 'price'];
const rowOf = (o: Order) => [o.id, o.city, o.product, o.units, o.price];
const CITIES = ['Chennai', 'Kochi', 'Pune'];

type View = { kind: 'df'; title: string; cols: string[]; rows: (string | number)[][]; color?: (r: number, c: number) => string | undefined; hl?: (r: number, c: number) => boolean }
  | { kind: 'groups'; agg: ('sum' | 'mean' | 'count')[] }
  | { kind: 'result'; showTarget: boolean };
interface Frame { code: string; caption: ReactNode; views: View[]; read: [string, ReactNode, string?][] }

function groups() { return CITIES.map((c) => ({ city: c, rows: ORDERS.filter((o) => o.city === c) })); }
const fmtR = (v: number) => '₹' + Math.round(v).toLocaleString('en-IN');

function buildFrames(): Frame[] {
  const f: Frame[] = [];
  const total = sum(ORDERS.map(rev));
  const cityCol = (o: Order, a = 0.3) => alpha(KEYC[o.city], a);
  f.push({ code: 'df = pd.read_csv("orders.csv")\ndf.head()', read: [['rows', 6], ['columns', 5]],
    views: [{ kind: 'df', title: 'df: six orders from a beverage distributor', cols: BASE_COLS, rows: ORDERS.map(rowOf), color: (_, c) => (c >= 3 ? alpha(C.blue, 0.15) : undefined) }],
    caption: <>A <b>DataFrame</b> is a table where every column has a name and one type. Here: six orders with city, product, units and unit price (₹). Think of it as an Excel sheet that remembers every step you take.</> });
  f.push({ code: 'df["revenue"] = df["units"] * df["price"]', read: [['rows', 6], ['columns', 6, C.yellow], ['total revenue', fmtR(total), C.yellow]],
    views: [{ kind: 'df', title: 'a new column, computed for every row at once', cols: [...BASE_COLS, 'revenue'], rows: ORDERS.map((o) => [...rowOf(o), rev(o)]), color: (_, c) => (c === 5 ? alpha(C.yellow, 0.28) : c >= 3 ? alpha(C.blue, 0.15) : undefined) }],
    caption: <><b>New column</b> in one line: units × price for all rows at once (it is NumPy underneath): 10 × 50 = 500, 4 × 120 = 480, … Total revenue <b>{fmtR(total)}</b>. No formula dragged down a column.</> });
  const isC = ORDERS.map((o) => o.city === 'Chennai');
  f.push({ code: 'mask = df["city"] == "Chennai"', read: [['True rows', 3, C.green], ['False rows', 3, C.red]],
    views: [{ kind: 'df', title: 'a boolean mask, one True/False per row', cols: [...BASE_COLS, 'revenue', 'mask'], rows: ORDERS.map((o, i) => [...rowOf(o), rev(o), isC[i] ? 'True' : 'False']), color: (r, c) => (c === 6 ? alpha(isC[r] ? C.green : C.red, 0.35) : c === 1 && isC[r] ? alpha(C.green, 0.2) : undefined) }],
    caption: <><b>Filtering, step 1</b>: compare the city column with "Chennai". The result is a mask: True for orders 1, 3 and 6, False for the rest. Same idea as a NumPy boolean mask.</> });
  const ch = ORDERS.filter((o) => o.city === 'Chennai');
  f.push({ code: 'chennai = df[mask]\nchennai["revenue"].sum()   # 1470', read: [['rows kept', '3 of 6', C.green], ['Chennai revenue', fmtR(sum(ch.map(rev))), C.yellow]],
    views: [{ kind: 'df', title: 'df[mask]: only the True rows survive', cols: [...BASE_COLS, 'revenue'], rows: ch.map((o) => [...rowOf(o), rev(o)]), color: (_, c) => (c === 5 ? alpha(C.yellow, 0.28) : undefined) }],
    caption: <><b>Filtering, step 2</b>: <code>df[mask]</code> keeps orders 1, 3 and 6. Their revenue: 500 + 720 + 250 = <b>₹1,470</b>. Two lines replaced an AutoFilter and a SUM, and they rerun next Monday on 60,000 rows.</> });
  f.push({ code: 'df.groupby("city")   # step 1: SPLIT', read: [['groups', 3], ['Chennai rows', 3, C.blue], ['Kochi rows', 1, C.pink], ['Pune rows', 2, C.purple]],
    views: [{ kind: 'df', title: 'colour each row by its key (city)', cols: [...BASE_COLS, 'revenue'], rows: ORDERS.map((o) => [...rowOf(o), rev(o)]), color: (r) => cityCol(ORDERS[r]) }],
    caption: <>Now <b>groupby</b>, the engine behind every pivot table. Step 1, <b>split</b>: each row gets a group label from its city. Blue = Chennai, pink = Kochi, purple = Pune. Rows are still in their original order.</> });
  f.push({ code: '# SPLIT: rows sorted into one pile per city', read: [['groups', 3]], views: [{ kind: 'groups', agg: [] }],
    caption: <>The rows are sorted into <b>one pile per city</b>: Chennai {'{500, 720, 250}'}, Kochi {'{600}'}, Pune {'{480, 400}'}. (Internally pandas does not copy anything; it just tags each row with a group number.)</> });
  f.push({ code: 'df.groupby("city")["revenue"].sum()   # APPLY', read: [['Chennai', fmtR(1470), C.blue], ['Kochi', fmtR(600), C.pink], ['Pune', fmtR(880), C.purple]], views: [{ kind: 'groups', agg: ['sum'] }],
    caption: <>Step 2, <b>apply</b>: run the same calculation <b>on each pile separately</b>. Sum: Chennai 1,470, Kochi 600, Pune 880.</> });
  f.push({ code: '.agg(["sum", "mean", "count"])   # APPLY', read: [['Chennai mean', fmtR(490), C.blue], ['Kochi mean', fmtR(600), C.pink], ['Pune mean', fmtR(440), C.purple]], views: [{ kind: 'groups', agg: ['sum', 'mean', 'count'] }],
    caption: <>Apply more than one function: <b>mean</b> = sum ÷ count: 1,470 / 3 = 490, 600 / 1 = 600, 880 / 2 = 440, plus the <b>count</b> of orders in each pile.</> });
  f.push({ code: 'res = df.groupby("city")["revenue"]\\\n        .agg(["sum", "mean", "count"])   # COMBINE', read: [['result rows', '3 (one per city)'], ['highest mean', 'Kochi ₹600', C.pink], ['…from', '1 order', C.red]], views: [{ kind: 'result', showTarget: false }],
    caption: <>Step 3, <b>combine</b>: the per-pile answers are glued into a <b>new table, one row per city</b>. Notice Kochi has the highest average order (₹600) but from <b>only one order</b>. Always show the count next to a mean.</> });
  f.push({ code: 'report = res.merge(targets, on="city")\nreport["pct"] = report["sum"] / report["target"] * 100', read: [['Chennai', '98.0%', C.blue], ['Kochi', '85.7%', C.pink], ['Pune', '110.0%', C.green]], views: [{ kind: 'result', showTarget: true }],
    caption: <>Finally <b>merge</b> (pandas' VLOOKUP) a targets table on the city key and compute % of target. Chennai 1,470 / 1,500 = 98%, Kochi 86%, Pune 880 / 800 = <b>110%</b>. The city with the lowest revenue is the <b>only one that beat its target</b>. Filter, new column, split-apply-combine, join: a whole Monday report in six lines.</> });
  return f;
}

function GroupPiles({ agg }: { agg: ('sum' | 'mean' | 'count')[] }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
    {groups().map((g) => {
      const vals = g.rows.map(rev);
      const extra = agg.map((a) => [a, '', '', a === 'sum' ? sum(vals) : a === 'mean' ? +mean(vals).toFixed(0) : vals.length]);
      return <MatrixView key={g.city} title={`city == "${g.city}"`} colLabels={['order_id', 'product', 'units', 'revenue']}
        data={[...g.rows.map((o) => [o.id, o.product, o.units, rev(o)]), ...extra]}
        cellColor={(r) => (r < g.rows.length ? alpha(KEYC[g.city], 0.3) : alpha(C.yellow, 0.22))} />;
    })}
  </div>;
}
function ResultView({ showTarget }: { showTarget: boolean }) {
  const rows = groups().map((g) => { const v = g.rows.map(rev); return { city: g.city, s: sum(v), m: mean(v), n: v.length }; });
  const data = rows.map((r) => showTarget ? [r.s, +r.m.toFixed(0), r.n, TARGET[r.city], (r.s / TARGET[r.city] * 100).toFixed(1) + '%'] : [r.s, +r.m.toFixed(0), r.n]);
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'center' }}>
    <MatrixView title={showTarget ? 'report = res.merge(targets)' : 'res: one row per group'} rowLabels={rows.map((r) => r.city)} colLabels={showTarget ? ['sum', 'mean', 'count', 'target', 'pct'] : ['sum', 'mean', 'count']} data={data}
      cellColor={(r, c) => (c === 4 ? alpha(rows[r].s >= TARGET[rows[r].city] ? C.green : C.red, 0.3) : c === 3 ? alpha(C.green, 0.15) : alpha(KEYC[rows[r].city], 0.25))}
      highlight={(r, c) => !showTarget && rows[r].n === 1 && (c === 1 || c === 2)} />
    <div style={{ flex: '1 1 300px', minWidth: 260 }}>
      <Plot x={[-0.6, 2.6]} y={[0, 1700]} height={230} width={420} xTicks={3} fx={(v) => (Number.isInteger(v) ? CITIES[v] ?? '' : '')} yLabel="revenue (₹)">
        {(s) => <>
          <Bars s={s} data={rows.map((r, i) => ({ x: i, y: r.s }))} width={0.5} color={(i) => KEYC[rows[i].city]} />
          {showTarget && rows.map((r, i) => <Seg key={i} s={s} x1={i - 0.35} x2={i + 0.35} y1={TARGET[r.city]} y2={TARGET[r.city]} color={C.green} width={3} dash="6 3" />)}
          {showTarget && <Label s={s} x={1.55} y={1600} color={C.green} size={12}>– – target</Label>}
        </>}
      </Plot>
    </div>
  </div>;
}

/* ---------- Animate ---------- */
function Animate() {
  const frames = useMemo(buildFrames, []);
  const p = useStepPlayer(frames.length, 2600);
  const f = frames[p.i];
  return (
    <div>
      <Layout
        main={<div style={{ minHeight: 260 }}>{f.views.map((v, i) => v.kind === 'df'
          ? <MatrixView key={i} title={v.title} colLabels={v.cols} data={v.rows} cellColor={v.color} highlight={v.hl} />
          : v.kind === 'groups' ? <GroupPiles key={i} agg={v.agg} /> : <ResultView key={i} showTarget={v.showTarget} />)}</div>}
        side={<>
          <pre style={{ margin: 0, padding: '8px 10px', background: 'var(--bg-3)', borderRadius: 8, whiteSpace: 'pre-wrap' }}>{f.code}</pre>
          <Readout items={f.read} />
          <Legend items={[['Chennai', C.blue], ['Kochi', C.pink], ['Pune', C.purple], ['computed / aggregated', C.yellow], ['True / target', C.green], ['False / missed', C.red]]} />
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{f.caption}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
type Key = 'city' | 'product';
type Agg = 'sum' | 'mean' | 'count' | 'max';
function Playground() {
  const [key, setKey] = useState<Key>('city');
  const [agg, setAgg] = useState<Agg>('mean');
  const [minU, setMinU] = useState(0);
  const [more, setMore] = useState(false);
  const data = more ? [...ORDERS, ...EXTRA] : ORDERS;
  const keep = data.map((o) => o.units >= minU);
  const kept = data.filter((_, i) => keep[i]);
  const keys = [...new Set(data.map((o) => o[key]))].sort();
  const res = keys.map((k) => {
    const v = kept.filter((o) => o[key] === k).map(rev);
    const val = !v.length ? 0 : agg === 'sum' ? sum(v) : agg === 'mean' ? mean(v) : agg === 'count' ? v.length : Math.max(...v);
    return { k, n: v.length, val };
  });
  const yMax = Math.max(1, ...res.map((r) => r.val)) * 1.2;
  return (
    <Layout
      main={<>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
          <MatrixView title={`df[df.units >= ${minU}]  (grey rows are filtered out)`} colLabels={[...BASE_COLS, 'revenue']} data={data.map((o) => [...rowOf(o), rev(o)])}
            cellColor={(r) => (keep[r] ? alpha(KEYC[data[r][key]], 0.3) : alpha(C.grey, 0.12))} />
          <MatrixView title={`df.groupby("${key}")["revenue"].${agg}()`} rowLabels={res.map((r) => r.k)} colLabels={[agg, 'count']} data={res.map((r) => [r.n ? +r.val.toFixed(0) : 'NaN', r.n])}
            cellColor={(r, c) => (c === 1 && res[r].n <= 1 ? alpha(C.red, 0.3) : alpha(KEYC[res[r].k], 0.3))} />
        </div>
        <Plot x={[-0.6, keys.length - 0.4]} y={[0, yMax]} height={240} xTicks={keys.length} fx={(v) => (Number.isInteger(v) ? keys[v] ?? '' : '')} yLabel={`${agg} of revenue${agg === 'count' ? ' (orders)' : ' (₹)'}`}>
          {(s) => <>
            <Bars s={s} data={res.map((r, i) => ({ x: i, y: r.val }))} width={0.5} color={(i) => KEYC[res[i].k]} />
            {res.map((r, i) => <Label key={i} s={s} x={i} y={r.val + yMax * 0.04} anchor="middle" size={12} color={r.n <= 1 ? C.red : C.muted}>{`n = ${r.n}`}</Label>)}
          </>}
        </Plot>
      </>}
      side={<>
        <Choice label="group by" value={key} onChange={setKey} options={[{ value: 'city', label: 'city' }, { value: 'product', label: 'product' }]} />
        <Choice label="apply" value={agg} onChange={setAgg} options={(['sum', 'mean', 'count', 'max'] as Agg[]).map((a) => ({ value: a, label: a }))} />
        <Slider label="filter: units ≥" min={0} max={12} value={minU} onChange={setMinU} />
        <Toggle label="add 4 more orders from the next day" value={more} onChange={setMore} />
        <Readout items={[['rows kept', `${kept.length} of ${data.length}`], ['groups', keys.length], ['revenue kept', fmtR(sum(kept.map(rev))), C.yellow], ['thin groups (n ≤ 1)', res.filter((r) => r.n <= 1).length, C.red]]} />
        <p className="small muted" style={{ margin: 0 }}>Red <b>n</b> labels warn that a group's number rests on one order (or none: NaN). A mean from one row is luck, not a pattern.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Six orders in a pandas **DataFrame**. We add a revenue column, filter Chennai orders with a mask, then run **groupby** as split → apply → combine and join a targets table.', steps: [
      { do: 'Press **▶ Step** through the first four frames.', notice: 'The new column appears in one line; the mask column decides which rows survive the filter.' },
      { do: 'Keep stepping through the coloured frames.', notice: '**Split** colours rows by city and sorts them into piles; **apply** adds a sum/mean/count row to each pile; **combine** glues them into one row per city.' },
      { do: 'Look at the last frame.', notice: 'After merging targets, the smallest city (Pune) is the only one above 100%. Context can reverse the story.' },
    ] },
    Playground: { what: 'Build your own groupby: choose the key and the aggregation, filter rows first, and see the result table and chart update instantly.', steps: [
      { do: 'Set **apply = mean**, group by **city**.', notice: 'Kochi tops the chart, but its red **n = 1** label says it is a single order.' },
      { do: 'Drag **units ≥** up to about 9.', notice: 'Filtering happens before grouping: groups shrink, and some become NaN (no rows left).' },
      { do: 'Switch to **group by product** and tick **add 4 more orders**.', notice: 'The same three-step pattern answers a new question without rewriting anything.' },
    ] },
  },
};
export default anim;
