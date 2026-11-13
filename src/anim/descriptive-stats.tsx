// Descriptive statistics: mean as balance point vs median as middle value, an outlier dragging the mean,
// SD as typical distance, and a box plot built from the sorted data. Running example: downtime on 10 shifts (g-stats1).
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Dots, Seg, Label, Region, Caption, Readout, Slider, Choice, Toggle, Layout, Legend, useStepPlayer, PlayerControls, C } from '../viz/kit';
import { mean, sdS, quantile, median } from '../viz/math';
import { stackY } from './_stats1-helpers';

/* ---------- pure helpers ---------- */
const DOWNTIME = [12, 15, 17, 18, 20, 22, 25, 27, 30, 95];
function summary(a: number[]) {
  const q1 = quantile(a, 0.25), q3 = quantile(a, 0.75), iqr = q3 - q1;
  const lo = q1 - 1.5 * iqr, hi = q3 + 1.5 * iqr;
  const inside = a.filter((v) => v >= lo && v <= hi);
  return { m: mean(a), med: median(a), sd: sdS(a), q1, q3, iqr, lo, hi, wLo: Math.min(...inside), wHi: Math.max(...inside), out: a.filter((v) => v < lo || v > hi) };
}
type Show = { mean?: boolean; beam?: boolean; tilt?: boolean; dev?: boolean; sd?: boolean; med?: boolean; box?: boolean; fence?: boolean };
interface Frame { n: number; show: Show; meanAt?: number; cap: JSX.Element }

const DOT_Y = 1.4;
const BOX = [3.0, 4.2] as const;

function makeFrames(): Frame[] {
  const s9 = summary(DOWNTIME.slice(0, 9)), s10 = summary(DOWNTIME);
  const devL = DOWNTIME.slice(0, 9).filter((v) => v < s9.m).reduce((s, v) => s + (s9.m - v), 0);
  return [
    { n: 9, show: {}, cap: <>Each dot is one shift at an auto-parts plant: <b>minutes of unplanned downtime</b>. Nine shifts, from 12 to 30 minutes. Nobody can stare at a list and "see" it, so we want a few honest summary numbers.</> },
    { n: 9, show: { med: true }, cap: <>Sorted, the values are already in order from left to right. The <b>median</b> is simply the <b>middle value</b>: the 5th of 9, which is <b>{s9.med} minutes</b>. Four shifts are below it, four above.</> },
    { n: 9, show: { med: true, mean: true, beam: true }, cap: <>The <b>mean</b> is a different idea: imagine the dots as equal weights on a see-saw. The mean is the spot where the board <b>balances</b>: (12 + 15 + … + 30) / 9 = <b>{s9.m.toFixed(1)} minutes</b>.</> },
    { n: 9, show: { mean: true, beam: true, dev: true }, cap: <>Why does it balance there? The red sticks are each shift's <b>distance from the mean</b>. The ones on the left add up to {devL.toFixed(1)}, the ones on the right also add up to {devL.toFixed(1)}. <b>Deviations from the mean always sum to zero.</b></> },
    { n: 9, show: { mean: true, dev: true, sd: true }, cap: <>The <b>standard deviation</b> squares those distances, averages them (dividing by n − 1 = 8) and takes the square root: <b>SD = {s9.sd.toFixed(1)} minutes</b>. Read it as the <b>typical distance</b> of a shift from the mean (green band).</> },
    { n: 10, show: { mean: true, beam: true, tilt: true }, meanAt: s9.m, cap: <>We zoom out, because the 10th shift arrives: <b>95 minutes</b> (red). A single heavy weight far out on the right <b>tips the see-saw</b>. The old balance point of {s9.m.toFixed(1)} no longer works.</> },
    { n: 10, show: { mean: true, beam: true }, cap: <>To balance again, the fulcrum must slide right to the new mean, <b>{s10.m.toFixed(1)} minutes</b> (281 / 10). Yet 9 of the 10 shifts lost less than that. <b>One outlier dragged the mean</b> up by {(s10.m - s9.m).toFixed(1)} minutes.</> },
    { n: 10, show: { mean: true, med: true }, cap: <>The median now sits between the 5th and 6th values: (20 + 22) / 2 = <b>{s10.med} minutes</b>. It moved by just 1 minute. The median only cares about <b>order</b>, not how far away the 95 is: it is <b>robust</b>.</> },
    { n: 10, show: { mean: true, dev: true }, cap: <>Look at the distances from the new mean. The 95-minute shift is {(95 - s10.m).toFixed(1)} minutes away; squaring that makes it {((95 - s10.m) ** 2).toFixed(0)}, more than all the other squared distances combined.</> },
    { n: 10, show: { mean: true, dev: true, sd: true }, cap: <>So the SD explodes from {s9.sd.toFixed(1)} to <b>{s10.sd.toFixed(1)} minutes</b>: one shift <b>quadruples</b> the apparent variability. Mean and SD are both <b>sensitive to outliers</b>.</> },
    { n: 10, show: { med: true, box: true }, cap: <>A <b>box plot</b> uses order instead. Q1 = <b>{s10.q1}</b> (a quarter of shifts below), median = {s10.med}, Q3 = <b>{s10.q3}</b> (three quarters below). The box is the <b>middle half</b>; its width is the IQR = {s10.iqr.toFixed(2)} minutes.</> },
    { n: 10, show: { med: true, box: true, fence: true }, cap: <>The outlier rule: anything beyond Q3 + 1.5 × IQR = {s10.q3} + 1.5 × {s10.iqr.toFixed(2)} = <b>{s10.hi.toFixed(1)}</b> is flagged. The whiskers stretch only to the most extreme values <b>inside</b> the fences: {s10.wLo} and {s10.wHi}.</> },
    { n: 10, show: { med: true, box: true, fence: true, mean: true }, cap: <><b>Summary:</b> the typical shift loses about <b>{s10.med} minutes</b> (median), the middle half span {s10.q1}–{s10.q3}. The 95 is flagged, not deleted: it is the most important row in the table. <b>For skewed data, report median and IQR (or both).</b></> },
  ];
}

function DotStage({ data, f, xMax = 100, height = 320 }: { data: number[]; f: { show: Show; meanAt?: number }; xMax?: number; height?: number }) {
  const sorted = [...data].sort((a, b) => a - b);
  const S = summary(sorted);
  const m = f.meanAt ?? S.m;
  const odd = sorted.length % 2 === 1, mid = Math.floor(sorted.length / 2);
  const isMed = (i: number) => (odd ? i === mid : i === mid || i === mid - 1);
  const ys = stackY(sorted, xMax / 140);
  const tilt = f.show.tilt ? 0.35 : 0;
  const x0 = 2, x1 = xMax - 2;
  const beamY = (x: number) => 1.0 - tilt * ((x - m) / (x1 - x0)) * 2;
  return (
    <Plot x={[0, xMax]} y={[0, 6.4]} height={height} xLabel="downtime per shift (minutes)" fy={() => ''} yTicks={0}>
      {(s) => <>
        {f.show.sd && <Region s={s} x0={m - S.sd} x1={m + S.sd} y0={0.4} y1={2.4} color={C.green} opacity={0.14} stroke={C.green} />}
        {f.show.sd && <Label s={s} x={m} y={0.15} color={C.green} size={12} anchor="middle">mean ± 1 SD ({(m - S.sd).toFixed(1)} to {(m + S.sd).toFixed(1)})</Label>}
        {f.show.beam && <>
          <Seg s={s} x1={x0} y1={beamY(x0)} x2={x1} y2={beamY(x1)} color={C.muted} width={3} />
          <Seg s={s} x1={m} y1={1.0} x2={m - xMax * 0.015} y2={0.35} color={C.green} width={2.5} />
          <Seg s={s} x1={m} y1={1.0} x2={m + xMax * 0.015} y2={0.35} color={C.green} width={2.5} />
          <Seg s={s} x1={m - xMax * 0.015} y1={0.35} x2={m + xMax * 0.015} y2={0.35} color={C.green} width={2.5} />
        </>}
        {f.show.mean && <Seg s={s} x1={m} x2={m} y1={0.35} y2={f.show.box ? 2.6 : 6.3} color={C.green} dash="6 4" />}
        {f.show.mean && <Label s={s} x={m + xMax * 0.008} y={f.show.box ? 2.45 : 6.0} color={C.green} size={12}>mean {m.toFixed(1)}</Label>}
        {f.show.med && !f.show.box && <Label s={s} x={S.med} y={2.62} color={C.gold} size={12} anchor="middle">median {S.med}</Label>}
        {f.show.dev && sorted.map((v, i) => {
          const y = 2.75 + i * (3.0 / sorted.length);
          return <g key={'d' + i}>
            <Seg s={s} x1={m} x2={v} y1={y} y2={y} color={C.red} width={3} />
            <Label s={s} x={v + (v >= m ? 1 : -1) * xMax * 0.008} y={y - 0.08} color={C.red} size={11} anchor={v >= m ? 'start' : 'end'}>{(v - m >= 0 ? '+' : '') + (v - m).toFixed(1)}</Label>
          </g>;
        })}
        {f.show.box && <>
          <Region s={s} x0={S.q1} x1={S.q3} y0={BOX[0]} y1={BOX[1]} color={C.blue} opacity={0.25} stroke={C.blue} />
          <Seg s={s} x1={S.med} x2={S.med} y1={BOX[0]} y2={BOX[1]} color={C.gold} width={3} />
          <Seg s={s} x1={S.wLo} x2={S.q1} y1={3.6} y2={3.6} color={C.blue} />
          <Seg s={s} x1={S.q3} x2={S.wHi} y1={3.6} y2={3.6} color={C.blue} />
          <Seg s={s} x1={S.wLo} x2={S.wLo} y1={3.3} y2={3.9} color={C.blue} />
          <Seg s={s} x1={S.wHi} x2={S.wHi} y1={3.3} y2={3.9} color={C.blue} />
          <Label s={s} x={S.q1} y={4.45} color={C.blue} size={11} anchor="end">Q1 {+S.q1.toFixed(2)}</Label>
          <Label s={s} x={S.q3} y={4.45} color={C.blue} size={11}>Q3 {+S.q3.toFixed(2)}</Label>
          <Label s={s} x={S.med} y={4.85} color={C.gold} size={11} anchor="middle">median {+S.med.toFixed(2)}</Label>
          {sorted.map((v, i) => <Seg key={'g' + i} s={s} x1={v} x2={v} y1={DOT_Y + 0.25} y2={BOX[0] - 0.1} color={C.grid} width={1} />)}
        </>}
        {f.show.fence && <>
          <Seg s={s} x1={S.hi} x2={S.hi} y1={0.3} y2={5.4} color={C.red} dash="4 4" />
          <Label s={s} x={S.hi + xMax * 0.008} y={5.1} color={C.red} size={11}>fence Q3 + 1.5·IQR = {S.hi.toFixed(1)}</Label>
          {S.out.map((v, i) => <Label key={"o" + i} s={s} x={v} y={2.75} color={C.red} size={12} anchor="middle">outlier!</Label>)}
        </>}
        <Dots s={s} pts={sorted.map((v, i) => ({ x: v, y: DOT_Y + (ys[i] - 1) * 0.35 }))} r={xMax > 50 ? 5.5 : 7} color={(i) => (f.show.med && isMed(i) ? C.gold : S.out.includes(sorted[i]) || sorted[i] === 95 ? C.red : C.blue)} />
        {sorted.length <= 12 && sorted.map((v, i) => <Label key={'v' + i} s={s} x={v} y={DOT_Y + (xMax > 50 && i % 2 ? 0.75 : 0.42)} size={11} color={C.muted} anchor="middle">{v}</Label>)}
      </>}
    </Plot>
  );
}

/* ---------- Animate ---------- */
function Animate() {
  const frames = useMemo(makeFrames, []);
  const p = useStepPlayer(frames.length, 2600);
  const f = frames[p.i];
  const data = DOWNTIME.slice(0, f.n);
  const S = summary(data);
  return (
    <div>
      <Layout
        main={<DotStage data={data} f={f} xMax={f.n === 9 ? 40 : 100} />}
        side={<>
          <Readout items={[
            ['shifts n', f.n],
            ['mean', S.m.toFixed(1), C.green],
            ['median', String(S.med), C.gold],
            ['SD', S.sd.toFixed(1), C.red],
            ['IQR', S.iqr.toFixed(2), C.blue],
            ['max', String(Math.max(...data))],
          ]} />
          <Legend items={[['shift', C.blue], ['mean (balance point)', C.green], ['median (middle value)', C.gold], ['distance / outlier', C.red], ['box = middle half', C.blue]]} />
          <p className="small muted" style={{ margin: 0 }}>Watch which numbers jump when the 95-minute shift arrives (step 6) and which barely move.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{f.cap}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
type DS = 'downtime' | 'bonus' | 'sym';
const SETS: Record<DS, { label: string; base: number[]; max: number; unit: string }> = {
  downtime: { label: 'Downtime (10 shifts)', base: [12, 15, 17, 18, 20, 22, 25, 27, 30], max: 200, unit: 'minutes' },
  bonus: { label: 'Bonuses (5 staff)', base: [2, 3, 3, 4], max: 200, unit: '₹ thousand' },
  sym: { label: 'Symmetric (15 values)', base: [32, 36, 38, 40, 42, 44, 45, 46, 47, 48, 50, 52, 54, 58], max: 200, unit: 'units' },
};

function Playground() {
  const [ds, setDs] = useState<DS>('downtime');
  const [big, setBig] = useState(95);
  const [added, setAdded] = useState<number[]>([]);
  const [showBox, setShowBox] = useState(true);
  const [showSd, setShowSd] = useState(true);
  const set = SETS[ds];
  const lowest = Math.max(...set.base);
  const data = [...set.base, Math.max(big, lowest), ...added];
  const S = summary(data);
  const xMax = [40, 60, 100, 150, 220].find((v) => v >= Math.max(...data) * 1.08) ?? 220;
  const choose = (d: DS) => { setDs(d); setAdded([]); setBig(d === 'bonus' ? 100 : d === 'downtime' ? 95 : 60); };
  return (
    <Layout
      main={<>
        <Plot x={[0, xMax]} y={[0, 6.4]} height={330} xLabel={`value (${set.unit}) · click to add a point`} fy={() => ''} yTicks={0}
          onClick={(pt) => setAdded((a) => (a.length < 30 ? [...a, Math.round(pt.x * 10) / 10] : a))}>
          {(s) => {
            const sorted = [...data].sort((a, b) => a - b), ys = stackY(sorted, xMax / 110);
            return <>
              {showSd && <Region s={s} x0={S.m - S.sd} x1={S.m + S.sd} y0={0.4} y1={2.6} color={C.green} opacity={0.14} stroke={C.green} />}
              {showBox && <>
                <Region s={s} x0={S.q1} x1={S.q3} y0={3.6} y1={4.8} color={C.blue} opacity={0.25} stroke={C.blue} />
                <Seg s={s} x1={S.wLo} x2={S.q1} y1={4.2} y2={4.2} color={C.blue} />
                <Seg s={s} x1={S.q3} x2={S.wHi} y1={4.2} y2={4.2} color={C.blue} />
                <Seg s={s} x1={S.hi} x2={S.hi} y1={3.3} y2={5.2} color={C.red} dash="4 4" />
              </>}
              <Seg s={s} x1={S.med} x2={S.med} y1={0.4} y2={5.6} color={C.gold} width={2.5} />
              <Seg s={s} x1={S.m} x2={S.m} y1={0.4} y2={6.2} color={C.green} width={2.5} dash="6 4" />
              <Label s={s} x={S.m + xMax * 0.01} y={5.95} color={C.green} size={12}>mean {S.m.toFixed(1)}</Label>
              <Label s={s} x={S.med - xMax * 0.01} y={5.3} color={C.gold} size={12} anchor="end">median {+S.med.toFixed(1)}</Label>
              <Dots s={s} pts={sorted.map((v, i) => ({ x: v, y: 1.2 + (ys[i] - 1) * 0.35 }))} r={6} animate={false} color={(i) => (S.out.includes(sorted[i]) ? C.red : C.blue)} />
            </>;
          }}
        </Plot>
        <Legend items={[['data', C.blue], ['mean (band = ± 1 SD)', C.green], ['median', C.gold], ['flagged outlier / fence', C.red], ['box: Q1–Q3', C.blue]]} />
      </>}
      side={<>
        <Choice label="Dataset" value={ds} onChange={choose} options={(Object.keys(SETS) as DS[]).map((v) => ({ value: v, label: SETS[v].label }))} />
        <Slider label="largest value" min={lowest} max={set.max} value={Math.max(big, lowest)} onChange={setBig} />
        <Toggle label="show mean ± 1 SD band" value={showSd} onChange={setShowSd} />
        <Toggle label="show box plot" value={showBox} onChange={setShowBox} />
        <button className="btn" onClick={() => setAdded([])}>Clear added points ({added.length})</button>
        <Readout items={[['n', data.length], ['mean', S.m.toFixed(1), C.green], ['median', S.med.toFixed(1), C.gold], ['mean − median', (S.m - S.med).toFixed(1)], ['SD', S.sd.toFixed(1), C.red], ['IQR', S.iqr.toFixed(1), C.blue]]} />
        <p className="small muted" style={{ margin: 0 }}>Drag the largest value far to the right: mean and SD chase it, median and IQR hardly move.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Downtime on shifts at a plant, shown as dots on a line. We find the **median** (middle value) and the **mean** (balance point), measure spread with the **SD**, then watch one 95-minute shift distort them, and finish with a **box plot**.', steps: [
      { do: 'Step through the first five frames.', notice: 'The mean is where the see-saw balances; the red distances on each side add up to the same total. The SD is the typical length of those red sticks.' },
      { do: 'Step to frame 6 and 7, when the 95-minute shift arrives.', notice: 'The see-saw tips, and the mean slides from 20.7 to 28.1. The median moves only from 20 to 21.' },
      { do: 'Watch frames 10 to 13 (the box plot).', notice: 'The box covers the middle half (Q1 17.25 to Q3 26.5); the fence at 40.4 flags 95 as an outlier.' },
    ] },
    Playground: { what: 'A dot plot with live **mean, median, SD band and box plot**. Move the largest value or click to add your own points.', steps: [
      { do: 'Drag **largest value** from about 30 up to 200.', notice: 'The green mean line and SD band follow the outlier; the gold median line and the blue box barely move.' },
      { do: 'Switch to **Bonuses** (2, 3, 3, 4 and the CEO).', notice: 'With 100 for the CEO, the mean is 22.4 while the median is 3: the "average bonus" describes nobody.' },
      { do: 'Choose **Symmetric** and click a few points on both sides.', notice: 'For balanced data mean and median agree; adding points on one side only pulls the mean away.' },
    ] },
  },
};
export default anim;
