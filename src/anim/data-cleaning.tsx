// Data cleaning: a messy loan-applicant table gets duplicates removed, missing incomes imputed (mean vs median vs indicator)
// and outliers investigated (one typo, one genuine), with the effect on summary statistics at every step.
import { ReactNode, useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Bars, Dots, Seg, Label, MatrixView, Caption, Readout, Slider, Choice, Toggle, Layout, Legend, useStepPlayer, PlayerControls, rng, gauss, C } from '../viz/kit';
import { boxStats, histogram, mean, median, sd } from '../viz/math';
import { alpha } from './_dataprep-helpers';

/* ---------- pure helpers ---------- */
interface Row { id: string; age: number; income: number | null; city: string; imputed?: boolean; flag?: number }
const RAW: Row[] = [
  { id: 'A101', age: 34, income: 6, city: 'Chennai' },
  { id: 'A102', age: 29, income: 8, city: 'Pune' },
  { id: 'A103', age: 41, income: null, city: 'Chennai' },
  { id: 'A102', age: 29, income: 8, city: 'Pune' },
  { id: 'A104', age: 250, income: 9, city: 'Kochi' },
  { id: 'A105', age: 38, income: 12, city: 'Pune' },
  { id: 'A106', age: 45, income: null, city: 'Chennai' },
  { id: 'A107', age: 52, income: 95, city: 'Chennai' },
];
const obs = (rows: Row[]) => rows.filter((r) => r.income !== null).map((r) => r.income as number);
const f1 = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

type Hl = 'dup' | 'na' | 'imp' | 'flag' | 'age' | 'inc' | 'fixed' | null;
interface Frame { rows: Row[]; showFlag: boolean; hl: Hl; plot: 'income' | 'age'; code: string; caption: ReactNode; fence?: number }

function buildFrames(): Frame[] {
  const dedup = RAW.filter((_, i) => i !== 3);
  const o = obs(dedup), mI = mean(o), mdI = median(o);
  const fill = (v: number, flag = false) => dedup.map((r) => (r.income === null ? { ...r, income: v, imputed: true, flag: flag ? 1 : undefined } : { ...r, flag: flag ? 0 : undefined }));
  const meanFill = fill(mI), medFill = fill(mdI), withFlag = fill(mdI, true);
  const ages = dedup.map((r) => r.age), ab = boxStats(ages);
  const fixed = withFlag.map((r) => (r.id === 'A104' ? { ...r, age: 25 } : r));
  const ib = boxStats(o);
  return [
    { rows: RAW, showFlag: false, hl: null, plot: 'income', code: 'df = pd.read_csv("applicants.csv")\ndf.head(8)', caption: <>Eight loan applicants straight from the form system: id, age, annual income (₹ lakh) and city. At a glance it looks fine. A model would happily train on it. Let's <b>wash the vegetables</b> first, and watch what each step does to the <b>average income</b> (green line below).</> },
    { rows: RAW, showFlag: false, hl: 'dup', plot: 'income', code: 'df.duplicated().sum()   # 1', caption: <><b>Duplicates.</b> Applicant A102 appears twice (a re-submitted form). Counted twice, they get double weight in every statistic and the model sees them twice.</> },
    { rows: dedup, showFlag: false, hl: null, plot: 'income', code: 'df = df.drop_duplicates()', caption: <>Dropped: <b>7 applicants</b> remain. The known incomes are now 6, 8, 9, 12 and 95: mean <b>₹{f1(mI)} lakh</b>, median <b>₹{f1(mdI)} lakh</b>. That big gap is a clue we will come back to.</> },
    { rows: dedup, showFlag: false, hl: 'na', plot: 'income', code: 'df["income"].isna().mean()   # 0.29', caption: <><b>Missing values.</b> Two incomes are blank (NaN, red): a missing rate of 2 / 7 = <b>29%</b>. Most models refuse NaN, and deleting the rows would throw away 29% of our applicants. So we <b>impute</b>: fill the gap with a sensible guess.</> },
    { rows: meanFill, showFlag: false, hl: 'imp', plot: 'income', code: 'df["income"].fillna(df["income"].mean())   # 26', caption: <>Option 1, <b>fill with the mean</b>: both blanks become ₹{f1(mI)} lakh (yellow). That claims they earn more than <b>four of the five</b> known applicants. The one high earner (₹95 lakh) dragged the mean up. The median of the filled column jumps from {f1(mdI)} to {f1(median(obs(meanFill)))}.</> },
    { rows: medFill, showFlag: false, hl: 'imp', plot: 'income', code: 'df["income"].fillna(df["income"].median())   # 9', caption: <>Option 2, <b>fill with the median</b>: ₹{f1(mdI)} lakh, a typical value. The median is the middle of the sorted values, so one extreme earner cannot drag it. For skewed money columns, <b>median is the safer fill</b>. The filled mean is now ₹{f1(mean(obs(medFill)))} lakh.</> },
    { rows: withFlag, showFlag: true, hl: 'flag', plot: 'income', code: 'df["income_missing"] = df["income"].isna().astype(int)\ndf["income"] = df["income"].fillna(df["income"].median())', caption: <>Option 3, <b>fill + indicator</b>: keep the median fill and add a 0/1 column <b>income_missing</b>. Blank incomes are often <b>not random</b> (self-employed applicants skip the field), and the flag lets the model learn whether "did not say" itself predicts risk. Do this before filling, so you remember which values were guessed.</> },
    { rows: withFlag, showFlag: true, hl: 'age', plot: 'age', fence: ab.hiF, code: 'q1, q3 = df.age.quantile([.25, .75])\nupper = q3 + 1.5 * (q3 - q1)   # 67.25', caption: <><b>Outliers.</b> The IQR rule on age: Q1 = {f1(ab.q1)}, Q3 = {f1(ab.q3)}, fence = Q3 + 1.5 × IQR = <b>{ab.hiF.toFixed(2)}</b>. Applicant A104's age of <b>250</b> is far beyond it, and it inflates the mean age to <b>{f1(mean(ages))}</b> years.</> },
    { rows: fixed, showFlag: true, hl: 'fixed', plot: 'age', fence: ab.hiF, code: 'df.loc[df.id == "A104", "age"] = 25   # form says 25', caption: <>An outlier is a reason to <b>investigate</b>, not to delete. The scanned form shows "25": a typing slip added a 0. Fixed. Mean age drops from {f1(mean(ages))} to <b>{f1(mean(fixed.map((r) => r.age)))}</b> years; one keystroke had nearly doubled it.</> },
    { rows: fixed, showFlag: true, hl: 'inc', plot: 'income', fence: ib.hiF, code: '# income fence = 12 + 1.5 × 4 = 18\n# A107 = 95 → flagged, but verified', caption: <>The income fence is {ib.q3} + 1.5 × {ib.iqr} = <b>{ib.hiF}</b>, so A107's ₹95 lakh is flagged too. Investigation: a <b>verified business owner</b>. This one is <b>real</b>, so it stays. Instead we protect ourselves from it: median fills, robust summaries, maybe a log transform later.</> },
    { rows: fixed, showFlag: true, hl: null, plot: 'income', code: 'df.describe()   # clean, documented, repeatable', caption: <><b>Clean.</b> 8 rows → 7, one typo fixed, one genuine outlier kept, two gaps filled with the median plus a flag. Every step is a line of code, so it reruns identically next month. The same table now reports a typical income of <b>₹9 lakh</b> instead of a misleading ₹23 lakh, and a mean age of 37.7 instead of 64.8.</> },
  ];
}

function StripPlot({ rows, which, fence }: { rows: Row[]; which: 'income' | 'age'; fence?: number }) {
  const vals = rows.map((r) => (which === 'income' ? r.income : r.age));
  const known = vals.filter((v): v is number => v !== null);
  const max = which === 'income' ? 100 : 260;
  const m = mean(known), md = median(known);
  return <Plot x={[0, max]} y={[0, 1]} height={150} xLabel={which === 'income' ? 'annual income (₹ lakh)' : 'age (years)'} fy={() => ''} yTicks={1}>
    {(s) => <>
      {fence !== undefined && <Seg s={s} x1={fence} x2={fence} y1={0} y2={1} color={C.muted} dash="3 3" />}
      {fence !== undefined && <Label s={s} x={fence - max * 0.01} y={0.9} size={11} anchor="end" color={C.muted}>IQR fence</Label>}
      <Seg s={s} x1={m} x2={m} y1={0.05} y2={0.95} color={C.green} dash="6 4" width={2.5} />
      <Seg s={s} x1={md} x2={md} y1={0.05} y2={0.95} color={C.text} width={2} />
      <Label s={s} x={m + max * 0.01} y={0.12} size={11} color={C.green}>{`mean ${f1(m)}`}</Label>
      <Label s={s} x={md + max * 0.01} y={0.75} size={11} color={C.text}>{`median ${f1(md)}`}</Label>
      <Dots s={s} pts={rows.map((r, i) => ({ x: (which === 'income' ? r.income : r.age) ?? 0, y: 0.3 + (i % 4) * 0.12 }))} r={7}
        color={(i) => (vals[i] === null ? 'transparent' : rows[i].imputed && which === 'income' ? C.yellow : fence !== undefined && (vals[i] as number) > fence ? C.red : C.blue)} />
    </>}
  </Plot>;
}

/* ---------- Animate ---------- */
function Animate() {
  const frames = useMemo(buildFrames, []);
  const p = useStepPlayer(frames.length, 2800);
  const f = frames[p.i];
  const cols = ['id', 'age', 'income', 'city', ...(f.showFlag ? ['income_missing'] : [])];
  const data = f.rows.map((r) => [r.id, r.age, r.income === null ? 'NaN' : r.income, r.city, ...(f.showFlag ? [r.flag ?? 0] : [])]);
  const color = (r: number, c: number): string | undefined => {
    const row = f.rows[r];
    if (f.hl === 'dup' && row.id === 'A102') return alpha(C.red, r === 3 ? 0.4 : 0.15);
    if (row.income === null && c === 2) return alpha(C.red, 0.4);
    if (row.imputed && c === 2) return alpha(C.yellow, f.hl === 'imp' || f.hl === 'flag' ? 0.4 : 0.2);
    if (c === 4) return alpha(row.flag ? C.gold : C.grey, f.hl === 'flag' ? 0.45 : 0.15);
    if (c === 1 && row.id === 'A104') return alpha(f.hl === 'age' ? C.red : f.hl === 'fixed' ? C.green : C.grey, f.hl === 'age' || f.hl === 'fixed' ? 0.4 : 0);
    if (c === 2 && row.id === 'A107' && f.hl === 'inc') return alpha(C.gold, 0.4);
    return undefined;
  };
  const inc = obs(f.rows), ages = f.rows.map((r) => r.age);
  return (
    <div>
      <Layout
        main={<>
          <MatrixView title="applicants" colLabels={cols} data={data} cellColor={color} />
          <div style={{ height: 8 }} />
          <div className="small muted">{f.plot === 'income' ? 'Incomes (yellow = imputed)' : 'Ages'}</div>
          <StripPlot rows={f.rows} which={f.plot} fence={f.fence} />
        </>}
        side={<>
          <pre style={{ margin: 0, padding: '8px 10px', background: 'var(--bg-3)', borderRadius: 8, whiteSpace: 'pre-wrap' }}>{f.code}</pre>
          <Readout items={[
            ['rows', f.rows.length], ['missing incomes', f.rows.filter((r) => r.income === null).length, C.red],
            ['mean income', `₹${f1(mean(inc))} L`, C.green], ['median income', `₹${f1(median(inc))} L`],
            ['SD income', f1(sd(inc, 1))], ['mean age', f1(mean(ages)), C.green],
          ]} />
          <Legend items={[['problem', C.red], ['imputed', C.yellow], ['flag / investigated', C.gold], ['mean', C.green], ['median', C.text]]} />
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{f.caption}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
type Mech = 'random' | 'rich';
type Fill = 'drop' | 'mean' | 'median';
function population(n = 200, seed = 12) { const r = rng(seed); return Array.from({ length: n }, () => Math.exp(Math.log(9) + 0.5 * gauss(r))); }
function Playground() {
  const [rate, setRate] = useState(30);
  const [mech, setMech] = useState<Mech>('random');
  const [fill, setFill] = useState<Fill>('mean');
  const [big, setBig] = useState(false);
  const truth = useMemo(() => { const p = population(); if (big) p[0] = 500; return p; }, [big]);
  const missing = useMemo(() => {
    const r = rng(77), order = truth.map((v, i) => ({ i, key: mech === 'random' ? r() : -Math.log(v) + 0.25 * gauss(r) }));
    order.sort((a, b) => a.key - b.key);
    const m = new Set(order.slice(0, Math.round((rate / 100) * truth.length)).map((o) => o.i));
    if (big) m.delete(0); // the verified high earner always reports income
    return m;
  }, [truth, mech, rate, big]);
  const known = truth.filter((_, i) => !missing.has(i));
  const fv = fill === 'mean' ? mean(known) : median(known);
  const filled = fill === 'drop' ? known : truth.map((v, i) => (missing.has(i) ? fv : v));
  const lo = 0, hi = 40, bins = 20, w = (hi - lo) / bins;
  const cap = (a: number[]) => a.map((v) => Math.min(v, hi - 0.01));
  const hObs = histogram(cap(known), lo, hi, bins);
  const hImp = histogram(cap(fill === 'drop' ? [] : truth.filter((_, i) => missing.has(i)).map(() => fv)), lo, hi, bins);
  const hTot = hObs.map((d, i) => ({ x: d.x, y: d.y + hImp[i].y }));
  const yMax = Math.max(10, ...hTot.map((d) => d.y)) * 1.12;
  const tM = mean(truth), eM = mean(filled), tS = sd(truth, 1), eS = sd(filled, 1);
  return (
    <Layout
      main={<>
        <Plot x={[lo, hi]} y={[0, yMax]} height={330} xLabel="annual income (₹ lakh; values above 40 piled in the last bar)" yLabel="applicants">
          {(s) => <>
            <Bars s={s} data={hTot} width={w * 0.9} color={C.yellow} />
            <Bars s={s} data={hObs} width={w * 0.9} color={C.blue} />
            <Seg s={s} x1={tM} x2={tM} y1={0} y2={yMax} color={C.green} dash="6 4" width={2.5} />
            <Seg s={s} x1={Math.min(eM, hi)} x2={Math.min(eM, hi)} y1={0} y2={yMax} color={C.gold} width={2.5} />
            <Label s={s} x={hi - 0.5} y={yMax * 0.92} anchor="end" color={C.green} size={12}>{`– – true mean ${tM.toFixed(1)}`}</Label>
            <Label s={s} x={hi - 0.5} y={yMax * 0.84} anchor="end" color={C.gold} size={12}>{`—— mean after cleaning ${eM.toFixed(1)}`}</Label>
            {big && <Label s={s} x={hi - 0.5} y={yMax * 0.68} anchor="end" color={C.red} size={12}>one verified earner at ₹500 L →</Label>}
          </>}
        </Plot>
      </>}
      side={<>
        <Slider label="missing incomes" min={0} max={60} value={rate} onChange={setRate} format={(v) => `${v}%`} />
        <Choice label="Why missing?" value={mech} onChange={setMech} options={[{ value: 'random', label: 'At random' }, { value: 'rich', label: 'High earners skip it' }]} />
        <Choice label="Fix" value={fill} onChange={setFill} options={[{ value: 'drop', label: 'Drop rows' }, { value: 'mean', label: 'Fill mean' }, { value: 'median', label: 'Fill median' }]} />
        <Toggle label="include one verified ₹500 lakh earner" value={big} onChange={setBig} />
        <Readout items={[
          ['true mean', `₹${tM.toFixed(1)} L`, C.green], ['after cleaning', `₹${eM.toFixed(1)} L`, C.gold],
          ['true SD', tS.toFixed(1), C.green], ['SD after', eS.toFixed(1), C.gold],
          ['fill value', fill === 'drop' ? '–' : `₹${fv.toFixed(1)} L`, C.yellow], ['rows left', filled.length],
        ]} />
        <p className="small muted" style={{ margin: 0 }}>We secretly know every true income (green). Yellow bars are guesses: notice the <b>spike</b> at the fill value and the shrinking SD. When high earners hide their income, <b>no</b> fill recovers the truth; a missing-flag at least lets the model see the pattern.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'A messy table of loan applicants is cleaned step by step: **duplicates** removed, **missing incomes** filled three ways, and two **outliers** investigated. The readouts show how each step moves the mean and median.', steps: [
      { do: 'Step through the first three frames.', notice: 'The duplicate row (red) disappears and the row count drops from 8 to 7.' },
      { do: 'Compare the **mean fill** and **median fill** frames.', notice: 'Mean fill puts both blanks at ₹26 lakh (above most applicants); median fill uses a typical ₹9 lakh.' },
      { do: 'Watch the two outlier frames.', notice: 'Age 250 is a typo and gets fixed; income 95 is real and stays. Outliers are investigated, not automatically deleted.' },
    ] },
    Playground: { what: 'A column of 200 incomes where we secretly know the truth. Hide some values, choose why they go missing and how to fix them, and compare the cleaned statistics with the truth.', steps: [
      { do: 'With **At random**, drag **missing incomes** to 50% and switch between the three fixes.', notice: 'Fills create a yellow spike and shrink the SD; the mean stays close to the truth.' },
      { do: 'Switch to **High earners skip it**.', notice: 'Every fix now underestimates the mean: the data that would correct it is exactly what is missing.' },
      { do: 'Tick the **₹500 lakh earner** with **Fill mean**.', notice: 'The fill value jumps; with **Fill median** it barely moves.' },
    ] },
  },
};
export default anim;
