// NumPy: arrays as coloured grids. Vectorised arithmetic, boolean masks, broadcasting and axis sums.
import { ReactNode, useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { MatrixView, Caption, Readout, Slider, Choice, Layout, Legend, useStepPlayer, PlayerControls, C } from '../viz/kit';
import { alpha, heat } from './_dataprep-helpers';

/* ---------- pure helpers ---------- */
type Cell = number | string;
type Panel = { title: string; data: Cell[][]; color?: (r: number, c: number) => string | undefined; rows?: string[]; cols?: string[]; hl?: (r: number, c: number) => boolean } | { op: string };
interface Frame { code: string; caption: ReactNode; panels: Panel[]; read: [string, ReactNode, string?][] }

const PRICES = [40, 120, 75];
const GST = PRICES.map((p) => +(p * 1.18).toFixed(1)); // 47.2, 141.6, 88.5
const UNITS = [[10, 4, 20], [6, 8, 15], [12, 2, 30]];
const UPRICE = [50, 120, 30];
const REV = UNITS.map((r) => r.map((u, j) => u * UPRICE[j]));
const STORES = ['Store 1', 'Store 2', 'Store 3'];
const PRODS = ['tea', 'coffee', 'biscuits'];
const S = [[120, 135, 150, 140], [80, 95, 90, 100], [60, 55, 70, 65]];
const CITIES = ['Chennai', 'Pune', 'Kochi'];
const WEEKS = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'];
const blue = (max: number) => (v: Cell) => (typeof v === 'number' ? heat(C.blue, v, max) : undefined);
const ghost = alpha(C.purple, 0.08);

function buildFrames(): Frame[] {
  const f: Frame[] = [];
  const pricesPanel: Panel = { title: 'prices  shape (3,)', data: [PRICES], color: (_, c) => blue(120)(PRICES[c]) };
  f.push({ code: 'prices = np.array([40, 120, 75])', panels: [pricesPanel], read: [['shape', '(3,)'], ['dtype', 'int64'], ['bytes', '3 × 8 = 24']],
    caption: <>This is a NumPy <b>array</b>: three prices (₹) packed side by side in one block of memory, <b>all of the same type</b>. Darker blue = bigger number. That one promise, "every item has the same type", is what makes NumPy fast.</> });
  for (let i = 0; i < 3; i++) {
    const out = GST.map((g, j) => (j <= i ? g : '?'));
    f.push({ code: 'out = []\nfor p in prices:          # the slow way\n    out.append(p * 1.18)', read: [['loop step', `${i + 1} of 3`], ['Python checks', i + 1]],
      panels: [{ ...pricesPanel, hl: (_, c) => c === i }, { op: '→' }, { title: 'out (a Python list)', data: [out], color: (_, c) => (c <= i ? alpha(C.yellow, 0.25) : undefined), hl: (_, c) => c === i }],
      caption: i === 0 ? <>The <b>loop way</b>: Python visits one price at a time. Item 1: "is this a number? what kind? fine": 40 × 1.18 = <b>47.2</b>.</>
        : i === 1 ? <>Item 2: check the type again, then 120 × 1.18 = <b>141.6</b>. Every single item pays this checking cost.</>
          : <>Item 3: 75 × 1.18 = <b>88.5</b>. Three trips for three prices. For <b>a million prices, a million trips</b>, each with its own type check. That is the clerk carrying boxes up the stairs.</> });
  }
  f.push({ code: 'with_gst = prices * 1.18     # vectorised', read: [['shape', '(3,)'], ['Python checks', 1], ['speed-up (1M items)', '≈ 10×+', C.green]],
    panels: [pricesPanel, { op: '×' }, { title: '1.18 (a scalar, stretched)', data: [['1.18', '↔1.18', '↔1.18']], color: (_, c) => (c === 0 ? alpha(C.purple, 0.4) : ghost) }, { op: '=' }, { title: 'with_gst', data: [GST], color: (_, c) => heat(C.yellow, GST[c], 150) }],
    caption: <>The <b>vectorised</b> way: one line, no loop. NumPy checks the type <b>once</b> and hands the whole block to fast compiled code. The single number 1.18 is <b>stretched</b> to match the array (faint purple copies are virtual, never stored). This is the forklift.</> });
  const mask = GST.map((g) => g > 80);
  const maskPanel: Panel = { title: 'mask = with_gst > 80', data: [mask.map((m) => (m ? 'True' : 'False'))], color: (_, c) => alpha(mask[c] ? C.green : C.red, 0.35) };
  f.push({ code: 'mask = with_gst > 80', read: [['mask', '[F, T, T]'], ['True count', 2, C.green]],
    panels: [{ title: 'with_gst', data: [GST], color: (_, c) => heat(C.yellow, GST[c], 150) }, { op: '> 80 →' }, maskPanel],
    caption: <>A comparison is also vectorised. <Cm>with_gst &gt; 80</Cm> gives a <b>boolean mask</b>, one True/False per item: 47.2 fails (red), 141.6 and 88.5 pass (green).</> });
  f.push({ code: 'with_gst[mask]', read: [['kept', '2 of 3', C.green], ['result', '[141.6, 88.5]']],
    panels: [maskPanel, { op: '→' }, { title: 'with_gst[mask]', data: [GST.filter((_, i) => mask[i])], color: () => alpha(C.green, 0.35) }],
    caption: <>Put the mask inside square brackets and NumPy <b>keeps only the True positions</b>: [141.6, 88.5]. No loop, no if-statement. This is exactly how pandas filters rows later.</> });
  const unitsPanel = (hl?: (r: number, c: number) => boolean): Panel => ({ title: 'units  shape (3, 3)', data: UNITS, rows: STORES, cols: PRODS, color: (r, c) => heat(C.blue, UNITS[r][c], 30), hl });
  f.push({ code: 'units  = np.array([[10, 4, 20],\n                   [ 6, 8, 15],\n                   [12, 2, 30]])\nprices = np.array([50, 120, 30])', read: [['units.shape', '(3, 3)'], ['prices.shape', '(3,)', C.purple]],
    panels: [unitsPanel(), { op: '×' }, { title: 'prices  shape (3,)', data: [UPRICE], cols: PRODS, color: () => alpha(C.purple, 0.4) }],
    caption: <>New question: <b>revenue</b> for 3 stores × 3 products. Units sold is a 3 × 3 table; prices (₹50 tea, ₹120 coffee, ₹30 biscuits) is a single row of 3. The shapes differ. Can we multiply them?</> });
  f.push({ code: '# compare shapes from the RIGHT\n#   units  (3, 3)\n#   prices    (3,)\n#   3 == 3 ✓   missing → treated as 1 ✓', read: [['rule', 'equal, or one is 1'], ['result shape', '(3, 3)', C.green]],
    panels: [unitsPanel(), { op: '×' }, { title: 'prices as (1, 3)', data: [UPRICE, ['', '', ''], ['', '', '']], cols: PRODS, color: (r) => (r === 0 ? alpha(C.purple, 0.4) : undefined) }],
    caption: <>The <b>broadcasting rule</b>: line the shapes up from the right. Last sizes: 3 and 3, equal ✓. Prices has no first size, so it counts as 1 ✓. A size-1 direction can be <b>stretched</b>. The result will be 3 × 3.</> });
  const stretched: Panel = { title: 'prices stretched to (3, 3)', data: [UPRICE, UPRICE.map((v) => '↓' + v), UPRICE.map((v) => '↓' + v)], cols: PRODS, color: (r) => (r === 0 ? alpha(C.purple, 0.4) : ghost) };
  f.push({ code: '# NumPy reuses the price row for every store\n# (no copies are made in memory)', read: [['extra memory', '0 bytes', C.green]],
    panels: [unitsPanel(), { op: '×' }, stretched],
    caption: <>NumPy <b>reuses the price row for every store</b> (faint ↓ copies). Nothing is actually copied in memory; it just reads the same three prices again. Now every unit count has a matching price.</> });
  for (let i = 0; i < 3; i++) {
    const res = REV.map((row, r) => row.map((v) => (r <= i ? v : '')));
    f.push({ code: 'revenue = units * prices', read: [['rows done', `${i + 1} of 3`], [`${STORES[i]}`, REV[i].join(' + '), C.yellow]],
      panels: [unitsPanel((r) => r === i), { op: '×' }, { ...stretched, hl: (r) => r === i }, { op: '=' }, { title: 'revenue (₹)', data: res, rows: STORES, cols: PRODS, color: (r, c) => (r <= i ? heat(C.yellow, REV[r][c], 960) : undefined) }],
      caption: <>{STORES[i]}: {UNITS[i].map((u, j) => `${u} × ${UPRICE[j]} = ${REV[i][j]}`).join(', ')}. {i < 2 ? 'Element by element, matching positions.' : <>All nine products done <b>in one line</b>. With loops you would write two nested loops and nine multiplications.</>}</> });
  }
  const tot = REV.map((r) => r.reduce((a, b) => a + b, 0));
  f.push({ code: 'revenue.sum(axis=1)\n# → [1580, 1710, 1740]', read: [['store totals', tot.join(', '), C.yellow], ['grand total', '₹5,030', C.green]],
    panels: [{ title: 'revenue (₹)', data: REV, rows: STORES, cols: PRODS, color: (r, c) => heat(C.yellow, REV[r][c], 960) }, { op: 'sum →' }, { title: '.sum(axis=1)', data: tot.map((t) => [t]), rows: STORES, color: () => alpha(C.green, 0.35) }],
    caption: <><Cm>sum(axis=1)</Cm> adds <b>across</b> each row, one total per store: ₹{tot.join(', ₹')}. Grand total ₹5,030. Store 3 sells the fewest coffees but earns the most, thanks to biscuits.</> });
  f.push({ code: 'units * np.array([50, 120])\n# ValueError: operands could not be\n# broadcast together with shapes (3,3) (2,)', read: [['shapes', '(3, 3) vs (2,)'], ['3 vs 2', '✗ mismatch', C.red]],
    panels: [unitsPanel(), { op: '×' }, { title: 'only 2 prices  shape (2,)', data: [[50, 120]], color: () => alpha(C.red, 0.35) }, { op: '= ✗' }],
    caption: <>Breaking the rule: with only <b>2 prices</b>, the right-hand sizes are 3 and 2. Not equal, and neither is 1, so NumPy <b>refuses</b> with a ValueError. Good: it will not guess which product is missing. Most NumPy errors are shape errors like this.</> });
  const sPanel = (hl?: (r: number, c: number) => boolean): Panel => ({ title: 'S  shape (3, 4): units sold', data: S, rows: CITIES, cols: WEEKS, color: (r, c) => heat(C.blue, S[r][c], 150), hl });
  f.push({ code: 'S = np.array([[120, 135, 150, 140],\n              [ 80,  95,  90, 100],\n              [ 60,  55,  70,  65]])', read: [['S.shape', '(3, 4)'], ['axis 0', 'rows (stores)'], ['axis 1', 'columns (weeks)']],
    panels: [sPanel()], caption: <>Last idea: <b>axes</b>. A tea distributor's units sold, 3 stores × 4 weeks. Axis 0 runs <b>down</b> the rows, axis 1 runs <b>across</b> the columns.</> });
  const rs = S.map((r) => r.reduce((a, b) => a + b, 0)), cs = S[0].map((_, j) => S.reduce((a, r) => a + r[j], 0));
  f.push({ code: 'S.sum(axis=1)   # → [545, 365, 250]', read: [['result shape', '(3,)'], ['Chennai', 545, C.green]],
    panels: [sPanel(), { op: 'axis=1 →' }, { title: 'one total per store', data: rs.map((v) => [v]), rows: CITIES, color: () => alpha(C.green, 0.35) }],
    caption: <><Cm>axis=1</Cm> collapses the <b>columns</b> (weeks): Chennai 120 + 135 + 150 + 140 = <b>545</b>, Pune 365, Kochi 250. Shape (3, 4) becomes (3,): the axis you name is the one that <b>disappears</b>.</> });
  f.push({ code: 'S.sum(axis=0)   # → [260, 285, 310, 305]', read: [['result shape', '(4,)'], ['grand total', '1,160', C.green]],
    panels: [sPanel(), { op: 'axis=0 ↓' }, { title: 'one total per week', data: [cs], cols: WEEKS, color: () => alpha(C.green, 0.35) }],
    caption: <><Cm>axis=0</Cm> collapses the <b>rows</b> (stores): Week 1 = 120 + 80 + 60 = <b>260</b>, then 285, 310, 305. Shape (3, 4) becomes (4,). Either way the grand total is 1,160. <b>Arrays, masks, broadcasting and axes</b>: that is most of NumPy.</> });
  return f;
}

function Cm({ children }: { children: ReactNode }) { return <code style={{ color: C.gold }}>{children}</code>; }
function Panels({ panels }: { panels: Panel[] }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, minHeight: 200 }}>
    {panels.map((p, i) => 'op' in p
      ? <div key={i} style={{ fontSize: '1.5rem', color: C.gold, fontWeight: 700 }}>{p.op}</div>
      : <MatrixView key={i} title={p.title} data={p.data} rowLabels={p.rows} colLabels={p.cols} cellColor={p.color} highlight={p.hl} />)}
  </div>;
}
function Code({ children }: { children: string }) {
  return <pre style={{ margin: 0, padding: '8px 10px', background: 'var(--bg-3)', borderRadius: 8, whiteSpace: 'pre-wrap', color: C.text }}>{children}</pre>;
}

/* ---------- Animate ---------- */
function Animate() {
  const frames = useMemo(buildFrames, []);
  const p = useStepPlayer(frames.length, 2200);
  const f = frames[p.i];
  return (
    <div>
      <Layout
        main={<Panels panels={f.panels} />}
        side={<>
          <Code>{f.code}</Code>
          <Readout items={f.read} />
          <Legend items={[['input data', C.blue], ['stretched (virtual copy)', C.purple], ['result', C.yellow], ['True / kept', C.green], ['False', C.red], ['current step', C.gold]]} />
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{f.caption}</Caption>
    </div>
  );
}

/* ---------- Playground: a broadcasting lab ---------- */
type Opt = 'm34' | 'c31' | 'r14' | 'v4' | 'v3' | 'sc';
const OPTS: Record<Opt, { label: string; shape: number[]; data: number[][] }> = {
  m34: { label: '(3, 4) table', shape: [3, 4], data: S },
  c31: { label: '(3, 1) column', shape: [3, 1], data: [[1], [2], [3]] },
  r14: { label: '(1, 4) row', shape: [1, 4], data: [[10, 20, 30, 40]] },
  v4: { label: '(4,) 1-D', shape: [4], data: [[5, 10, 15, 20]] },
  v3: { label: '(3,) 1-D', shape: [3], data: [[100, 200, 300]] },
  sc: { label: 'scalar', shape: [], data: [[2]] },
};
type Op = '+' | '×' | '−';
const OPF: Record<Op, (a: number, b: number) => number> = { '+': (a, b) => a + b, '×': (a, b) => a * b, '−': (a, b) => a - b };
const shapeStr = (s: number[]) => (s.length === 0 ? '()' : s.length === 1 ? `(${s[0]},)` : `(${s.join(', ')})`);
function as2(s: number[]) { return s.length === 0 ? [1, 1] : s.length === 1 ? [1, s[0]] : s; }
function broadcast(a: number[], b: number[]) {
  const A = as2(a), B = as2(b), out: number[] = [], ok: boolean[] = [];
  for (let d = 0; d < 2; d++) { const good = A[d] === B[d] || A[d] === 1 || B[d] === 1; ok.push(good); out.push(Math.max(A[d], B[d])); }
  return { ok: ok.every(Boolean), dims: ok, shape: out, A, B };
}
function stretch(o: (typeof OPTS)[Opt], R: number, Cc: number) {
  const [r0, c0] = as2(o.shape);
  return Array.from({ length: R }, (_, r) => Array.from({ length: Cc }, (_, c) => ({ v: o.data[r0 === 1 ? 0 : r][c0 === 1 ? 0 : c], real: (r0 === 1 ? r === 0 : true) && (c0 === 1 ? c === 0 : true), down: r0 === 1 && r > 0 })));
}

function Playground() {
  const [a, setA] = useState<Opt>('m34');
  const [b, setB] = useState<Opt>('r14');
  const [op, setOp] = useState<Op>('+');
  const [thr, setThr] = useState(100);
  const bc = broadcast(OPTS[a].shape, OPTS[b].shape);
  const [R, Cc] = bc.shape;
  const sa = bc.ok ? stretch(OPTS[a], R, Cc) : [], sb = bc.ok ? stretch(OPTS[b], R, Cc) : [];
  const res = bc.ok ? sa.map((row, r) => row.map((x, c) => OPF[op](x.v, sb[r][c].v))) : [];
  const flat = res.flat();
  const kept = flat.filter((v) => v > thr);
  const nd = Math.max(OPTS[a].shape.length, OPTS[b].shape.length);
  const realShape = bc.shape.slice(2 - nd);
  const cell = (m: ReturnType<typeof stretch>, col: string) => ({ data: m.map((row) => row.map((x) => (x.real ? x.v : (x.down ? "↓" : "→") + x.v))), cellColor: (r: number, c: number) => (m[r][c].real ? alpha(col, 0.38) : alpha(col, 0.08)) });
  const optList = (Object.keys(OPTS) as Opt[]).map((k) => ({ value: k, label: OPTS[k].label }));
  const rule = [
    ['A', ...as2(OPTS[a].shape).map(String)],
    ['B', ...as2(OPTS[b].shape).map(String)],
    ['check', ...bc.dims.map((d) => (d ? '✓' : '✗'))],
    ['result', ...(bc.ok ? bc.shape.map(String) : ['–', '–'])],
  ];
  return (
    <Layout
      main={<>
        <MatrixView title="Broadcasting rule (shapes padded with 1 on the left, compared column by column)" data={rule.map((r) => r.slice(1))} rowLabels={rule.map((r) => r[0])} colLabels={['rows', 'columns']}
          cellColor={(r, c) => (r === 2 ? alpha(bc.dims[c] ? C.green : C.red, 0.35) : undefined)} />
        <div style={{ height: 12 }} />
        {bc.ok ? <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
          <MatrixView title={`A ${shapeStr(OPTS[a].shape)}`} {...cell(sa, C.blue)} />
          <div style={{ fontSize: '1.5rem', color: C.gold, fontWeight: 700 }}>{op}</div>
          <MatrixView title={`B ${shapeStr(OPTS[b].shape)}`} {...cell(sb, C.purple)} />
          <div style={{ fontSize: '1.5rem', color: C.gold, fontWeight: 700 }}>=</div>
          <MatrixView title={`result ${shapeStr(realShape)} (gold = mask True, grey = False)`} data={res} cellColor={(r, c) => (res[r][c] > thr ? undefined : alpha(C.grey, 0.25))} highlight={(r, c) => res[r][c] > thr} />
        </div>
          : <div className="caption" style={{ borderLeftColor: C.red }}><b style={{ color: C.red }}>ValueError:</b> operands could not be broadcast together with shapes {shapeStr(OPTS[a].shape)} {shapeStr(OPTS[b].shape)}. A size pair is neither equal nor 1 (the red ✗ above), so NumPy refuses to guess how to line them up.</div>}
      </>}
      side={<>
        <Choice label="A" value={a} onChange={setA} options={optList} />
        <Choice label="operation" value={op} onChange={setOp} options={(['+', '−', '×'] as Op[]).map((o) => ({ value: o, label: o }))} />
        <Choice label="B" value={b} onChange={setB} options={optList} />
        <Slider label="mask: result >" min={0} max={400} step={5} value={thr} onChange={setThr} />
        <Readout items={[
          ['A shape', shapeStr(OPTS[a].shape), C.blue], ['B shape', shapeStr(OPTS[b].shape), C.purple],
          ['result shape', bc.ok ? shapeStr(realShape) : 'error', bc.ok ? C.green : C.red],
          ['virtual copies', bc.ok ? sa.flat().filter((x) => !x.real).length + sb.flat().filter((x) => !x.real).length : '–'],
          ['result[mask]', bc.ok ? `${kept.length} of ${flat.length}` : '–', C.gold],
        ]} />
        <p className="small muted" style={{ margin: 0 }}>Faint cells marked ↓ or → are <b>stretched copies</b> NumPy pretends exist. Try the (3,4) table with the (3,) vector: it fails. Make it a (3,1) column and it works.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'NumPy arrays drawn as **coloured grids**: darker means a bigger number. We add GST to prices (loop vs vectorised), filter with a **boolean mask**, **broadcast** a price row across a sales table, and sum along an **axis**.', steps: [
      { do: 'Press **▶ Step** through the first five frames.', notice: 'The loop fills one cell per step; the vectorised line fills all three at once.' },
      { do: 'Keep stepping to the broadcasting frames (units × prices).', notice: 'The one price row is reused for every store (faint ↓ copies), and the revenue grid fills row by row.' },
      { do: 'Watch the **ValueError** frame, then the last two frames.', notice: 'Shapes must match from the right. `axis=1` gives one number per row; `axis=0` one per column.' },
    ] },
    Playground: { what: 'A broadcasting lab: pick two array shapes and an operation, and see which cells NumPy stretches, the result, or the error.', steps: [
      { do: 'Choose A = **(3, 4) table** and B = **(1, 4) row**, then B = **(3, 1) column**.', notice: 'A row is copied down (↓); a column is copied across (→).' },
      { do: 'Choose A = **(3, 1) column** and B = **(1, 4) row**.', notice: 'Both stretch: a 3 × 4 grid of every pairing appears from 7 numbers.' },
      { do: 'Choose A = **(3, 4) table** and B = **(3,) 1-D**.', notice: 'The rule table shows 4 vs 3 ✗ and NumPy raises a ValueError. Then drag the **mask** slider on a valid pair and watch gold cells (kept values) change.' },
    ] },
  },
};
export default anim;
