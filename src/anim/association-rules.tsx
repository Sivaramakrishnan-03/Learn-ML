// Association rules: a baskets table with support / confidence / lift computed live, and Apriori pruning of rare itemsets.
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Bars, Label, MatrixView, Caption, Readout, Slider, Layout, Legend, Tex, useStepPlayer, PlayerControls, C } from '../viz/kit';

/* ---------- pure helpers ---------- */
const ITEMS = ['bread', 'butter', 'milk', 'jam', 'tea', 'biscuits'];
// The ten bills from the lesson (T1–T10).
const BILLS: string[][] = [
  ['bread', 'butter', 'milk'], ['bread', 'butter'], ['bread', 'jam'], ['milk', 'tea'], ['bread', 'butter', 'jam'],
  ['milk', 'bread'], ['tea', 'biscuits'], ['bread', 'butter', 'milk'], ['milk', 'tea', 'biscuits'], ['bread', 'milk'],
];
type Basket = boolean[]; // one flag per item
const toBaskets = (bills: string[][]): Basket[] => bills.map((b) => ITEMS.map((it) => b.includes(it)));
const has = (b: Basket, set: number[]) => set.every((i) => b[i]);
const count = (bs: Basket[], set: number[]) => bs.filter((b) => has(b, set)).length;
const name = (set: number[]) => '{' + set.map((i) => ITEMS[i]).join(', ') + '}';
const pct = (v: number) => `${Math.round(v * 100)}%`;

interface Level { size: number; candidates: { set: number[]; n: number; keep: boolean; prunedBy?: number[] }[] }
/** Apriori: level k candidates are built only from frequent (k−1)-itemsets; any candidate with an infrequent subset is pruned unseen. */
function apriori(bs: Basket[], minCount: number): Level[] {
  const levels: Level[] = [];
  let frequent: number[][] = [];
  const singles = ITEMS.map((_, i) => ({ set: [i], n: count(bs, [i]), keep: count(bs, [i]) >= minCount }));
  levels.push({ size: 1, candidates: singles });
  frequent = singles.filter((c) => c.keep).map((c) => c.set);
  for (let k = 2; k <= 3 && frequent.length; k++) {
    const seen = new Set<string>(), cands: Level['candidates'] = [];
    const items = [...new Set(frequent.flat())].sort((a, b) => a - b);
    const combos = (start: number, acc: number[]): number[][] => (acc.length === k ? [acc] : items.filter((i) => i > (acc[acc.length - 1] ?? -1)).flatMap((i) => combos(start, [...acc, i])));
    combos(0, []).forEach((set) => {
      const key = set.join(','); if (seen.has(key)) return; seen.add(key);
      const subs = set.map((_, j) => set.filter((__, m) => m !== j));
      const bad = subs.find((s) => !frequent.some((f) => f.join(',') === s.join(',')));
      if (bad) { if (k > 2) cands.push({ set, n: -1, keep: false, prunedBy: bad }); return; }
      const n = count(bs, set); cands.push({ set, n, keep: n >= minCount });
    });
    levels.push({ size: k, candidates: cands });
    frequent = cands.filter((c) => c.keep).map((c) => c.set);
  }
  return levels;
}
function rule(bs: Basket[], A: number[], B: number[]) {
  const N = bs.length, nA = count(bs, A), nB = count(bs, B), nAB = count(bs, [...A, ...B]);
  const support = nAB / N, confidence = nA ? nAB / nA : 0, lift = nB && nA ? confidence / (nB / N) : 0;
  return { nA, nB, nAB, support, confidence, lift };
}

function BasketTable({ bs, hl, dimCols, onToggle }: { bs: Basket[]; hl?: (r: number) => boolean; dimCols?: number[]; onToggle?: (r: number, c: number) => void }) {
  const cell = { padding: '4px 7px', fontSize: '0.82rem' };
  const bg = (r: number, c: number) => (dimCols?.includes(c) ? 'rgba(91,101,118,0.3)' : hl?.(r) && bs[r][c] ? 'rgba(240,172,95,0.45)' : hl?.(r) ? 'rgba(240,172,95,0.12)' : bs[r][c] && onToggle ? 'rgba(88,196,221,0.18)' : undefined);
  return (
    <div className="matrix-view">
      <div className="small muted" style={{ marginBottom: 4 }}>{onToggle ? 'Bills: click a cell to add or remove an item' : 'Bills (✓ = item bought)'}</div>
      <table><thead><tr><th style={cell} />{ITEMS.map((it, c) => <th key={it} style={{ ...cell, opacity: dimCols?.includes(c) ? 0.45 : 1 }}>{it}</th>)}</tr></thead>
        <tbody>{bs.map((b, r) => <tr key={r}><th style={cell}>T{r + 1}</th>{b.map((v, c) => <td key={c} onClick={onToggle ? () => onToggle(r, c) : undefined}
          style={{ ...cell, cursor: onToggle ? 'pointer' : 'default', background: bg(r, c), transition: 'background 0.3s' }}>{v ? '✓' : ''}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

/* ---------- Animate ---------- */
const MIN = 3; // minimum support 30% of 10 bills

function Animate() {
  const bs = useMemo(() => toBaskets(BILLS), []);
  const levels = useMemo(() => apriori(bs, MIN), [bs]);
  const pairs = levels[1].candidates, triples = levels[2]?.candidates ?? [];
  const RULES: [number[], number[], string][] = [[[1], [0], 'butter → bread'], [[2], [0], 'milk → bread'], [[4], [5], 'tea → biscuits']];
  type F = { kind: 'table' | 'singles' | 'prune' | 'pair' | 'pairs' | 'triple' | 'rule' | 'lift'; j?: number };
  const frames: F[] = [{ kind: 'table' }, { kind: 'singles' }, { kind: 'prune' }, ...pairs.map((_, j) => ({ kind: 'pair' as const, j })), { kind: 'pairs' }, { kind: 'triple' },
    ...RULES.map((_, j) => ({ kind: 'rule' as const, j })), { kind: 'lift' }];
  const p = useStepPlayer(frames.length, 1700);
  const f = frames[p.i];
  const singles = levels[0].candidates;
  const rare = singles.filter((c) => !c.keep).map((c) => c.set[0]);
  const showPairs = f.kind === 'pair' || f.kind === 'pairs' || f.kind === 'triple';
  const curPair = f.kind === 'pair' ? pairs[f.j!] : undefined;
  const R = f.kind === 'rule' ? RULES[f.j!] : undefined;
  const r = R ? rule(bs, R[0], R[1]) : undefined;
  const hl = curPair ? (row: number) => has(bs[row], curPair.set) : R ? (row: number) => has(bs[row], [...R[0], ...R[1]]) : f.kind === 'singles' ? (row: number) => bs[row][0] : undefined;
  const allRules: [number[], number[], string][] = [[[4], [5], 'tea→biscuits'], [[1], [0], 'butter→bread'], [[3], [0], 'jam→bread'], [[2], [4], 'milk→tea'], [[2], [0], 'milk→bread'], [[1], [2], 'butter→milk']];
  const lifts = allRules.map(([a, b]) => rule(bs, a, b).lift);
  // chart data for the current stage
  const chart = f.kind === 'lift' ? null : showPairs
    ? pairs.map((c, i) => ({ x: i, y: c.n / 10, label: c.set.map((k) => ITEMS[k]).join('+'), on: c === curPair || f.kind !== 'pair' || pairs.indexOf(c) < f.j! }))
    : singles.map((c, i) => ({ x: i, y: f.kind === 'table' ? 0 : c.n / 10, label: ITEMS[c.set[0]], on: true }));
  const caption =
    f.kind === 'table' ? <>Ten bills from a small grocery store. Market-basket analysis looks for items that are <b>bought together more often than chance</b>. Three numbers do the work: <b>support</b> (how common), <b>confidence</b> (how reliable) and <b>lift</b> (better than chance?).</>
      : f.kind === 'singles' ? <><b>Support</b> of each item = share of bills containing it. Bread is in 7 of 10 bills (highlighted rows), so support = 70%. The red line is our <b>minimum support of 30%</b> (at least 3 bills).</>
        : f.kind === 'prune' ? <><b>Apriori's trick</b>: jam and biscuits appear in only 2 bills, below 30%. Any pair containing them can only be rarer, so we <b>never count those pairs at all</b> (greyed columns). That is what makes Apriori fast on millions of bills.</>
          : f.kind === 'pair' ? <>Candidate pair {f.j! + 1}/{pairs.length}: <b>{name(curPair!.set)}</b> appears together in <b>{curPair!.n} bills</b> (highlighted), support {pct(curPair!.n / 10)}. {curPair!.keep ? 'Above 30%: keep it.' : 'Below 30%: drop it.'}</>
            : f.kind === 'pairs' ? <>Only <b>{pairs.filter((c) => c.keep).map((c) => name(c.set)).join(' and ')}</b> survive. We counted {pairs.length} pairs instead of all {(6 * 5) / 2} possible ones.</>
              : f.kind === 'triple' ? <>Could {triples.length ? name(triples[0].set) : '{bread, butter, milk}'} be frequent? It needs every pair inside it to be frequent, but <b>{triples[0]?.prunedBy ? name(triples[0].prunedBy) : '{butter, milk}'}</b> is not (only 2 bills). So it is <b>pruned without counting</b>. Apriori stops: no larger itemsets possible.</>
                : f.kind === 'rule' && r && R ? <>Rule <b>{R[2]}</b>: of the {r.nA} bills with {name(R[0])}, {r.nAB} also have {name(R[1])}. Confidence = {r.nAB}/{r.nA} = <b>{pct(r.confidence)}</b>. But {name(R[1])} is in {pct(r.nB / 10)} of all bills anyway, so lift = {r.confidence.toFixed(2)} / {(r.nB / 10).toFixed(2)} = <b>{r.lift.toFixed(2)}</b>. {r.lift > 1.5 ? 'A strong real association.' : r.lift > 1 ? 'A mild positive association.' : 'Below 1: milk buyers are slightly LESS likely than average to buy bread, despite the high confidence.'}{f.j === 2 && ' Note: it was pruned at 30% support, so the threshold controls what you can discover.'}</>
                  : <>Lift for six rules. <b>Above 1 = bought together more than chance.</b> Tea → biscuits is the strongest pairing even though it is rare; milk → bread falls below 1 even though both are popular. Always check lift, not just confidence.</>;
  return (
    <div>
      <Layout
        main={<div style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0,1fr)', gap: 12, alignItems: 'start' }}>
          <BasketTable bs={bs} hl={hl} dimCols={f.kind === 'prune' || showPairs ? rare : undefined} />
          {chart ? <Plot x={[-0.6, chart.length - 0.4]} y={[0, 0.8]} width={440} height={330} xTicks={chart.length} fx={() => ''} fy={(v) => pct(v)} yLabel="support (share of bills)">
            {(s) => <>
              <Bars s={s} data={chart.map((d) => ({ x: d.x, y: d.on ? d.y : 0 }))} width={0.6}
                color={(i) => (showPairs ? (pairs[i].keep ? C.blue : C.grey) : f.kind === 'prune' && rare.includes(i) ? C.grey : C.blue)} highlight={(i) => (curPair ? pairs[i] === curPair : f.kind === 'singles' && i === 0)} />
              <line x1={s.pad.l} x2={s.W - s.pad.r} y1={s.sy(0.3)} y2={s.sy(0.3)} stroke={C.red} strokeDasharray="6 4" strokeWidth={2} />
              <Label s={s} x={chart.length - 0.45} y={0.76} anchor="end" color={C.red} size={12}>red dashed line = min support 30%</Label>
              {chart.map((d) => { const parts = d.label.split('+');
                const top = s.sy(d.on ? d.y : 0) - 10 - parts.length * 13;
                return <text key={'t' + d.x} x={s.sx(d.x)} y={top} fill={C.text} fontSize={11} textAnchor="middle">
                  {parts.map((t, k) => <tspan key={k} x={s.sx(d.x)} dy={k ? 13 : 0}>{t}{k < parts.length - 1 ? ' +' : ''}</tspan>)}
                  <tspan x={s.sx(d.x)} dy={13} fill={C.muted}>{d.on ? pct(d.y) : ''}</tspan>
                </text>; })}
            </>}
          </Plot> : <Plot x={[-0.6, 5.6]} y={[0, 3.6]} width={440} height={330} xTicks={6} fx={() => ''} yLabel="lift">
            {(s) => <>
              <Bars s={s} data={lifts.map((v, i) => ({ x: i, y: v }))} width={0.6} color={(i) => (lifts[i] >= 1 ? C.green : C.red)} />
              <line x1={s.pad.l} x2={s.W - s.pad.r} y1={s.sy(1)} y2={s.sy(1)} stroke={C.text} strokeDasharray="5 4" />
              <Label s={s} x={5.5} y={1.7} anchor="end" color={C.text} size={12}>dashed line: lift = 1 (chance)</Label>
              {lifts.map((v, i) => <Label key={i} s={s} x={i} y={v + 0.08} anchor="middle" size={12}>{v.toFixed(2)}</Label>)}
              {allRules.map(([, , n], i) => <text key={'n' + i} x={s.sx(i)} y={s.sy(0) - 8} fill={C.bg} fontSize={11} fontWeight={700} textAnchor="middle">{i + 1}</text>)}
            </>}
          </Plot>}
          {!chart && <div />}
          {!chart && <div className="small muted" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>{allRules.map(([, , n], i) => <span key={i}>{i + 1}. {n}</span>)}</div>}
        </div>}
        side={<>
          <Readout items={r ? [['support', pct(r.support), C.blue], ['confidence', pct(r.confidence), C.yellow], ['lift', r.lift.toFixed(2), r.lift >= 1 ? C.green : C.red], ['bills', `${r.nAB} of ${r.nA}`]]
            : [['bills N', 10], ['min support', '30% (3 bills)', C.red], ['frequent items', f.kind === 'table' ? '–' : singles.filter((c) => c.keep).length], ['frequent pairs', f.kind === 'pairs' || f.kind === 'triple' || f.kind === 'lift' ? pairs.filter((c) => c.keep).length : '–']]} />
          <div className="small"><Tex>{'\\text{support}(A\\Rightarrow B)=\\frac{\\#(A\\cap B)}{N}'}</Tex></div>
          <div className="small"><Tex>{'\\text{confidence}=\\frac{\\#(A\\cap B)}{\\#A}'}</Tex></div>
          <div className="small"><Tex>{'\\text{lift}=\\frac{\\text{confidence}}{\\text{support}(B)}'}</Tex></div>
          <Legend items={[['counted / kept', C.blue], ['current', C.gold], ['pruned', C.grey], ['threshold', C.red]]} />
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caption}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
function Playground() {
  const [bs, setBs] = useState<Basket[]>(() => toBaskets(BILLS));
  const [minSup, setMinSup] = useState(0.3);
  const [minConf, setMinConf] = useState(0.5);
  const N = bs.length, minCount = Math.max(1, Math.ceil(minSup * N - 1e-9));
  const levels = useMemo(() => apriori(bs, minCount), [bs, minCount]);
  const frequent = levels.flatMap((l) => l.candidates.filter((c) => c.keep && c.set.length >= 2));
  const counted = levels.reduce((s, l) => s + l.candidates.filter((c) => c.n >= 0).length, 0);
  const rules = frequent.flatMap((c) => c.set.map((cons) => { const A = c.set.filter((i) => i !== cons); return { A, B: [cons], ...rule(bs, A, [cons]) }; }))
    .filter((x) => x.confidence >= minConf).sort((a, b) => b.lift - a.lift);
  const toggle = (r: number, c: number) => setBs(bs.map((b, i) => (i === r ? b.map((v, j) => (j === c ? !v : v)) : b)));
  return (
    <Layout
      main={<div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' }}>
        <BasketTable bs={bs} onToggle={toggle} />
        <MatrixView title={`Rules with support ≥ ${pct(minSup)} and confidence ≥ ${pct(minConf)} (sorted by lift)`}
          colLabels={['rule', 'support', 'conf.', 'lift']}
          data={rules.length ? rules.slice(0, 10).map((x) => [`${x.A.map((i) => ITEMS[i]).join('+')} → ${ITEMS[x.B[0]]}`, pct(x.support), pct(x.confidence), x.lift.toFixed(2)]) : [['no rules pass the filters', '', '', '']]}
          cellColor={(row, c) => (c === 3 && rules[row] ? (rules[row].lift >= 1 ? 'rgba(131,193,103,0.25)' : 'rgba(252,98,85,0.25)') : undefined)} />
      </div>}
      side={<>
        <Slider label="min support" min={0.1} max={0.6} step={0.1} value={minSup} onChange={setMinSup} format={pct} />
        <Slider label="min confidence" min={0} max={1} step={0.05} value={minConf} onChange={setMinConf} format={pct} />
        <div className="row"><button className="btn" onClick={() => setBs([...bs, ITEMS.map((it) => it === 'tea' || it === 'biscuits')])}>+ tea & biscuits bill</button>
          <button className="btn" onClick={() => setBs(toBaskets(BILLS))}>Reset bills</button></div>
        <Readout items={[['bills', N], ['frequent itemsets (2+)', frequent.length, C.blue], ['rules shown', rules.length, C.yellow], ['itemsets counted', `${counted} of 63`, C.gold]]} />
        <p className="small muted" style={{ margin: 0 }}>Green lift = bought together more than chance; red = less. "Itemsets counted" shows Apriori's saving: it only counts candidates whose subsets are all frequent (63 = every non-empty combination of 6 items).</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Ten grocery bills. Watch **Apriori** count item and pair **support**, prune anything below 30%, and then score rules with **confidence** and **lift**.', steps: [
      { do: 'Step to the **pruning** frame.', notice: 'Jam and biscuits fall below the red 30% line, so no pair containing them is ever counted (grey columns).' },
      { do: 'Step through the candidate pairs.', notice: 'The highlighted rows are the bills containing both items; only two pairs reach 3 bills.' },
      { do: 'Compare the rules **milk → bread** and **tea → biscuits**.', notice: 'Same 67% confidence, but lift 0.95 vs 3.33: confidence alone can mislead when the consequent is popular.' },
    ] },
    Playground: { what: 'Edit the bills by clicking cells, set the **minimum support** and **confidence**, and see which rules survive, sorted by lift.', steps: [
      { do: 'Lower **min support** to 20%.', notice: 'Tea → biscuits (lift 3.33) appears: a low threshold finds rare but strong pairings, at the cost of more rules.' },
      { do: 'Click **+ tea & biscuits bill** a few times.', notice: 'Support, confidence and lift of tea → biscuits all rise and it passes the 30% threshold.' },
      { do: 'Set **min confidence** to 0% and look at the lift column.', notice: 'Some rules have lift below 1 (red): they are frequent only because the items are popular.' },
    ] },
  },
};
export default anim;
