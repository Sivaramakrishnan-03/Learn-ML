// Bootstrap: resample the data with replacement (points light up, repeats counted), recompute the median each time, and read a percentile CI off the pile.
import { ReactNode, useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Bars, Dots, Seg, Label, Region, Caption, Readout, Slider, Choice, Layout, Legend, useStepPlayer, PlayerControls, rng, C } from '../viz/kit';
import { mean, median, quantileSorted, sdS, histogram, resampleIdx, tally } from '../viz/math';

/* ---------- pure helpers ---------- */
const DELIV = [22, 25, 28, 30, 31, 33, 35, 36, 38, 41, 52, 75]; // g-stats2: 12 delivery times (minutes)
type Stat = 'median' | 'mean' | 'p90';
const STATS: Record<Stat, { label: string; f: (a: number[]) => number }> = {
  median: { label: 'Median', f: median },
  mean: { label: 'Mean', f: mean },
  p90: { label: '90th percentile', f: (a) => quantileSorted([...a].sort((x, y) => x - y), 0.9) },
};
/** B bootstrap resamples, stored as index arrays so we can show which original points were drawn. */
function resamples(n: number, B: number, seed: number) { const r = rng(seed); return Array.from({ length: B }, () => resampleIdx(n, r)); }
/** Dots of a resample on a number line, stacking repeated values. */
function stackRow(vals: number[], y0: number, dy: number) { const seen: Record<number, number> = {}; return [...vals].sort((a, b) => a - b).map((v) => { const k = (seen[v] = (seen[v] ?? -1) + 1); return { x: v, y: y0 + k * dy }; }); }

/* ---------- Animate ---------- */
const B = 10000;
type Fr = { stage: 'data' | 'draw' | 'med' | 'many' | 'ci' | 'mean'; s: number; draws: number; k: number };
const FRAMES: Fr[] = [
  { stage: 'data', s: 0, draws: 0, k: 0 },
  { stage: 'draw', s: 0, draws: 4, k: 0 }, { stage: 'draw', s: 0, draws: 8, k: 0 }, { stage: 'draw', s: 0, draws: 12, k: 0 },
  { stage: 'med', s: 0, draws: 12, k: 1 }, { stage: 'med', s: 1, draws: 12, k: 2 }, { stage: 'med', s: 2, draws: 12, k: 3 },
  { stage: 'many', s: 19, draws: 12, k: 20 }, { stage: 'many', s: 99, draws: 12, k: 100 }, { stage: 'many', s: 999, draws: 12, k: 1000 }, { stage: 'many', s: B - 1, draws: 12, k: B },
  { stage: 'ci', s: B - 1, draws: 12, k: B }, { stage: 'mean', s: B - 1, draws: 12, k: B },
];

function Animate() {
  const idx = useMemo(() => resamples(12, B, 2024), []);
  const meds = useMemo(() => idx.map((ix) => median(ix.map((i) => DELIV[i]))), [idx]);
  const means = useMemo(() => idx.map((ix) => mean(ix.map((i) => DELIV[i]))), [idx]);
  const sortedMed = useMemo(() => [...meds].sort((a, b) => a - b), [meds]);
  const sortedMean = useMemo(() => [...means].sort((a, b) => a - b), [means]);
  const p = useStepPlayer(FRAMES.length, 1700);
  const f = FRAMES[p.i];
  const useMean = f.stage === 'mean';
  const cur = idx[f.s].slice(0, f.draws);
  const cnt = tally(cur, 12);
  const curVals = cur.map((i) => DELIV[i]);
  const curMed = f.draws === 12 ? median(curVals) : NaN;
  const oob = cnt.filter((c) => c === 0).length;
  const shown = (useMean ? means : meds).slice(0, f.k);
  const h = histogram(shown, 21.75, 56.25, 69);
  const yMax = Math.max(3, ...h.map((d) => d.y)) * 1.15;
  const sorted = useMean ? sortedMean : sortedMed;
  const lo = quantileSorted(sorted, 0.025), hi = quantileSorted(sorted, 0.975);
  const se = sdS(meds), seMean = sdS(means);
  const medLo = quantileSorted(sortedMed, 0.025), medHi = quantileSorted(sortedMed, 0.975);
  const showCI = f.stage === 'ci' || f.stage === 'mean';
  const rep = cnt.map((c, i) => ({ c, i })).filter((d) => d.c > 1);
  const cap: Record<Fr['stage'], ReactNode> = {
    data: <>A quick-commerce startup timed <b>12 deliveries</b>. The median is <b>34 minutes</b> (green). But how sure are we? We cannot go back and time 12 new deliveries thousands of times... so we let the data stand in for the population.</>,
    draw: <>Bootstrap sample #1: draw 12 times <b>with replacement</b> from the 12 values, like pulling numbered balls from a bag and putting each one back. So far {f.draws} draws. {rep.length ? <>Some values are drawn more than once ({rep.map((d) => `${DELIV[d.i]} min ×${d.c}`).join(', ')}).</> : 'No repeats yet.'}</>,
    med: f.k === 1 ? <>Sample #1 is complete. <b>{oob} of the 12</b> original deliveries were never drawn (grey); others were drawn twice or more. Its median is <b>{curMed}</b> min (yellow), the first block in the lower chart.</> : <>Sample #{f.k}: a different mix of repeats and omissions, median <b>{curMed}</b> min. Each resample is a plausible "other dataset we might have collected".</>,
    many: <><b>{f.k.toLocaleString('en-IN')} bootstrap medians.</b> {f.k >= 1000 ? <>The pile shows how much the median would wobble from sample to sample: its spread (bootstrap SE) is <b>{se.toFixed(1)} min</b>.</> : <>A shape is emerging around 34. The gaps appear because medians of 12 values can only be whole or half minutes.</>}</>,
    ci: <>Cut off the lowest 2.5% and highest 2.5% of the 10,000 medians. What remains is the <b>95% percentile interval: {medLo} to {medHi} minutes</b>. No formula and no normal assumption needed: just resampling.</>,
    mean: <>Same trick for the <b>mean</b> (37.2 min): its interval is <b>{lo.toFixed(1)} to {hi.toFixed(1)}</b>, wider and stretched to the right because of the 75-minute outlier (SE {seMean.toFixed(1)} vs {se.toFixed(1)} for the median). The bootstrap captures that skew automatically.</>,
  };
  const orig = DELIV.map((v) => ({ x: v, y: 2.3 }));
  return (
    <div>
      <Layout
        main={<>
          <Plot x={[15, 80]} y={[0, 3.25]} height={220} xLabel="delivery time (minutes)" fy={() => ''} yTicks={1}>
            {(s) => <>
              <Label s={s} x={15.5} y={3.0} color={C.muted} size={12}>original 12 deliveries (the "bag")</Label>
              {f.stage !== 'data' && <Label s={s} x={15.5} y={1.25} color={C.muted} size={12}>{f.k > 3 ? `latest: bootstrap sample #${f.k.toLocaleString('en-IN')}` : `bootstrap sample #${Math.max(1, f.k)}`}</Label>}
              <Seg s={s} x1={34} x2={34} y1={1.95} y2={2.6} color={C.green} width={2.5} dash="4 3" />
              <Dots s={s} pts={orig} r={9} animate={false} color={(i) => (f.stage === 'data' ? C.blue : cnt[i] > 0 ? C.gold : C.grey)} />
              {f.stage !== 'data' && DELIV.map((v, i) => cnt[i] > 1 && <Label key={'c' + i} s={s} x={v} y={2.62} anchor="middle" color={C.gold} size={12}>×{cnt[i]}</Label>)}
              {f.stage !== 'data' && <Dots s={s} pts={stackRow(curVals, 0.35, 0.28)} r={7} color={C.gold} animate={false} />}
              {f.draws === 12 && <><Seg s={s} x1={curMed} x2={curMed} y1={0.15} y2={1.15} color={C.yellow} width={3} /><Label s={s} x={curMed + 0.6} y={1.0} color={C.yellow} size={12}>median {curMed}</Label></>}
            </>}
          </Plot>
          <div className="small muted" style={{ marginTop: 6 }}>{useMean ? 'Bootstrap means' : 'Bootstrap medians'}: one block per resample ({f.k.toLocaleString('en-IN')} so far)</div>
          <Plot x={[22, 56]} y={[0, yMax]} height={240} xLabel={useMean ? 'mean of a bootstrap sample (minutes)' : 'median of a bootstrap sample (minutes)'} fy={(v) => (Number.isInteger(v) ? String(v) : '')} yLabel="count">
            {(s) => <>
              {showCI && <Region s={s} x0={lo} x1={hi} color={C.gold} opacity={0.15} />}
              <Bars s={s} data={h} width={0.42} color={C.blue} />
              <Seg s={s} x1={useMean ? mean(DELIV) : 34} x2={useMean ? mean(DELIV) : 34} y1={0} y2={yMax} color={C.green} dash="5 4" />
              {showCI && <><Seg s={s} x1={lo} x2={lo} y1={0} y2={yMax} color={C.gold} width={2.5} /><Seg s={s} x1={hi} x2={hi} y1={0} y2={yMax} color={C.gold} width={2.5} />
                <Label s={s} x={lo - 0.3} y={yMax * 0.9} anchor="end" color={C.gold} size={12}>2.5%: {useMean ? lo.toFixed(1) : lo}</Label>
                <Label s={s} x={hi + 0.3} y={yMax * 0.9} color={C.gold} size={12}>97.5%: {useMean ? hi.toFixed(1) : hi}</Label></>}
              {useMean && <><Region s={s} x0={medLo} x1={medHi} y0={yMax * 0.72} y1={yMax * 0.78} color={C.teal} opacity={0.8} /><Label s={s} x={medHi + 0.4} y={yMax * 0.735} color={C.teal} size={12}>median's interval</Label></>}
            </>}
          </Plot>
        </>}
        side={<>
          <Readout items={[
            ['resamples', f.k.toLocaleString('en-IN')],
            ['this sample\'s median', f.draws === 12 ? curMed : '–', C.yellow],
            ['never drawn', f.stage === 'data' ? '–' : `${oob} of 12`, C.muted],
            ['original median', 34, C.green],
            ['bootstrap SE', f.k >= 1000 ? (useMean ? seMean : se).toFixed(1) : '–', C.blue],
            ['95% interval', showCI ? (useMean ? `${lo.toFixed(1)} – ${hi.toFixed(1)}` : `${lo} – ${hi}`) : '–', C.gold],
          ]} />
          <Legend items={[['drawn into this sample', C.gold], ['not drawn this time', C.grey], ['original median', C.green], ['bootstrap statistics', C.blue], ['95% interval', C.gold]]} />
          <p className="small muted" style={{ margin: 0 }}>On average a bootstrap sample leaves out about 1 − (11/12)¹² ≈ 35% of the original points and repeats others. That variety is what mimics drawing a fresh sample.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{cap[f.stage]}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
function Playground() {
  const [data, setData] = useState<number[]>(DELIV);
  const [stat, setStat] = useState<Stat>('median');
  const [conf, setConf] = useState(95);
  const [nB, setNB] = useState(2000);
  const [seed, setSeed] = useState(1);
  const fn = STATS[stat].f;
  const boot = useMemo(() => { const r = rng(seed * 101 + data.length); const n = data.length; return Array.from({ length: nB }, () => fn(resampleIdx(n, r).map((i) => data[i]))).sort((a, b) => a - b); }, [data, fn, nB, seed]);
  const est = fn(data), a = (100 - conf) / 200, lo = quantileSorted(boot, a), hi = quantileSorted(boot, 1 - a), se = sdS(boot);
  const dMax = Math.max(160, ...data) + 5;
  const bLo = boot[0], bHi = boot[boot.length - 1], bPad = Math.max(1.5, (bHi - bLo) * 0.08);
  const xMin = Math.floor(bLo - bPad), xMax = Math.ceil(bHi + bPad);
  const bins = 60, w = (xMax - xMin) / bins, h = histogram(boot, xMin, xMax, bins);
  const yMax = Math.max(...h.map((d) => d.y), 1) * 1.15;
  return (
    <Layout
      main={<>
        <Plot x={[10, dMax]} y={[0, 1]} height={140} xLabel="delivery time (minutes); click to add a delivery" fy={() => ''} yTicks={1} onClick={(q) => setData([...data, Math.round(q.x)])}>
          {(s) => <>
            <Dots s={s} pts={stackRow(data, 0.3, 0.14)} r={7} color={C.blue} animate={false} />
            <Seg s={s} x1={est} x2={est} y1={0.05} y2={0.95} color={C.green} width={2.5} dash="4 3" />
            <Label s={s} x={est + 0.5} y={0.85} color={C.green} size={12}>{STATS[stat].label.toLowerCase()} = {est.toFixed(1)}</Label>
          </>}
        </Plot>
        <Plot x={[xMin, xMax]} y={[0, yMax]} height={280} xLabel={`bootstrap ${STATS[stat].label.toLowerCase()} (minutes)`} yLabel="count">
          {(s) => <>
            <Region s={s} x0={lo} x1={hi} color={C.gold} opacity={0.15} />
            <Bars s={s} data={h} width={w * 0.9} color={C.blue} />
            <Seg s={s} x1={lo} x2={lo} y1={0} y2={yMax} color={C.gold} width={2.5} />
            <Seg s={s} x1={hi} x2={hi} y1={0} y2={yMax} color={C.gold} width={2.5} />
            <Seg s={s} x1={est} x2={est} y1={0} y2={yMax} color={C.green} dash="5 4" />
            <Label s={s} x={(lo + hi) / 2} y={yMax * 0.93} anchor="middle" color={C.gold} size={12}>{conf}% interval: {lo.toFixed(1)} – {hi.toFixed(1)}</Label>
          </>}
        </Plot>
      </>}
      side={<>
        <Choice label="Statistic" value={stat} onChange={setStat} options={(Object.keys(STATS) as Stat[]).map((k) => ({ value: k, label: STATS[k].label }))} />
        <Slider label="confidence level" min={80} max={99} value={conf} onChange={setConf} format={(v) => v + '%'} />
        <Slider label="resamples" min={200} max={10000} step={200} value={nB} onChange={setNB} />
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => setData(DELIV)}>Reset to 12 deliveries</button>
          <button className="btn" onClick={() => setSeed(seed + 1)}>🎲 Resample again</button>
        </div>
        <Readout items={[['data points', data.length], ['estimate', est.toFixed(1), C.green], ['bootstrap SE', se.toFixed(2), C.blue], ['interval', `${lo.toFixed(1)} – ${hi.toFixed(1)}`, C.gold], ['width', (hi - lo).toFixed(1), C.gold]]} />
        <p className="small muted" style={{ margin: 0 }}>Click the top strip to add deliveries. Add a 150-minute disaster: the mean's interval balloons, the median's barely moves. Add many typical deliveries: every interval shrinks.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Twelve delivery times from the lesson. We **resample them with replacement**, compute the median of each resample, and pile up thousands of medians to see how uncertain the original median (34 min) is.', steps: [
      { do: 'Step through frames 2–4 slowly.', notice: 'Each draw lights up one original delivery (gold). Some get **×2 or ×3**, some stay grey: that is "with replacement".' },
      { do: 'Continue through the 20, 100, 1,000 and 10,000 resample frames.', notice: 'The pile of medians takes shape around 34; its spread is the **bootstrap standard error** (about 3 min).' },
      { do: 'Go to the last two frames.', notice: 'The middle 95% of medians gives the interval (about **29 to 39.5 min**). For the mean the interval is wider and skewed right because of the 75-minute outlier.' },
    ] },
    Playground: { what: 'Bootstrap any of three statistics on data you can edit by clicking, and read off its percentile interval.', steps: [
      { do: 'Switch between **Median**, **Mean** and **90th percentile**.', notice: 'Each statistic has its own uncertainty. The 90th percentile is very unstable with 12 points.' },
      { do: 'Click far right on the top strip to add a **150-minute** delivery, with Mean selected; then switch to Median.', notice: 'One extreme value stretches the mean\'s interval a lot; the median barely reacts.' },
      { do: 'Move **confidence level** from 80% to 99%.', notice: 'The gold band widens: more confidence costs a wider interval.' },
    ] },
  },
};
export default anim;
