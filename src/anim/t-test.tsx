// t-test: signal (difference in means) ÷ noise (standard error), built visually; the t-distribution vs the normal;
// small samples; and paired vs independent designs. Examples: Plant A vs B cycle times, training before/after (g-stats1).
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Dots, FnLine, Seg, Label, Arrow, Region, Caption, Readout, Slider, Choice, Layout, Legend, useStepPlayer, PlayerControls, rng, gauss, C } from '../viz/kit';
import { mean, sdS, normPdf, tPdf, tInv, tP2 } from '../viz/math';
import { pFmt } from './_stats1-helpers';

/* ---------- pure helpers ---------- */
const PLANT_A = [42, 45, 39, 47, 44, 41, 46, 43];
const PLANT_B = [38, 40, 36, 41, 39, 35, 42, 37];
const BEFORE = [62, 70, 55, 68, 74, 59, 65, 71];
const AFTER = [66, 73, 57, 73, 77, 64, 67, 75];
interface TT { diff: number; se: number; t: number; df: number; p: number; sA: number; sB: number }
function welch(A: number[], B: number[]): TT {
  const sA = sdS(A), sB = sdS(B), a = (sA * sA) / A.length, b = (sB * sB) / B.length;
  const se = Math.sqrt(a + b), diff = mean(A) - mean(B), t = diff / se;
  const df = (a + b) ** 2 / (a * a / (A.length - 1) + b * b / (B.length - 1));
  return { diff, se, t, df, p: tP2(t, df), sA, sB };
}
function paired(after: number[], before: number[]): TT {
  const d = after.map((v, i) => v - before[i]), s = sdS(d), se = s / Math.sqrt(d.length), t = mean(d) / se;
  return { diff: mean(d), se, t, df: d.length - 1, p: tP2(t, d.length - 1), sA: s, sB: s };
}

/** Bottom panel: the t-distribution with the observed statistic and its two-sided tail area. */
function TDist({ tt, xMax = 6, normal = false, height = 220, label }: { tt: TT; xMax?: number; normal?: boolean; height?: number; label?: string }) {
  const tc = tInv(0.975, tt.df), to = Math.abs(tt.t);
  const f = (x: number) => tPdf(x, tt.df);
  return (
    <Plot x={[-xMax, xMax]} y={[0, 0.45]} height={height} xLabel={label ?? `t statistic (t-distribution with ${tt.df.toFixed(1)} degrees of freedom)`} fy={() => ''} yTicks={0}>
      {(s) => <>
        {[0, 1].map((j) => <g key={j}>
          <FnLine s={s} f={f} from={Math.min(to, xMax)} to={xMax} color={C.red} width={0} fill={C.red} />
          <FnLine s={s} f={f} from={-xMax} to={-Math.min(to, xMax)} color={C.red} width={0} fill={C.red} />
        </g>)}
        {normal && <FnLine s={s} f={(x) => normPdf(x)} color={C.muted} width={2} dash="6 4" />}
        <FnLine s={s} f={f} color={C.yellow} width={3} />
        {[-tc, tc].map((c, i) => <Seg key={i} s={s} x1={c} x2={c} y1={0} y2={0.24} color={C.red} dash="4 3" />)}
        <Label s={s} x={tc + 0.1} y={0.2} color={C.red} size={11}>5% cut-off ±{tc.toFixed(2)}</Label>
        {normal && <Label s={s} x={-xMax + 0.2} y={0.41} color={C.muted} size={11}>grey dashed: normal (cut-off ±1.96)</Label>}
        <Seg s={s} x1={Math.min(tt.t, xMax * 0.98)} x2={Math.min(tt.t, xMax * 0.98)} y1={0} y2={0.4} color={C.gold} width={3} />
        <Label s={s} x={Math.min(tt.t, xMax * 0.98) + (tt.t > xMax * 0.6 ? -0.15 : 0.15)} y={0.37} color={C.gold} size={12} anchor={tt.t > xMax * 0.6 ? 'end' : 'start'}>t = {tt.t.toFixed(2)}, {tt.p < 0.0001 ? 'p < 0.0001' : `p = ${pFmt(tt.p)}`}</Label>
      </>}
    </Plot>
  );
}

/* ---------- Animate ---------- */
type Stage = 'plants' | 'plants3' | 'indep' | 'pairs';
interface Frame { stage: Stage; means?: boolean; signal?: boolean; noise?: boolean; seRuler?: boolean; rulers?: boolean; bottom?: 'none' | 't' | 'tn' | 'gains' | 'tp'; cap: JSX.Element }
const W = welch(PLANT_A, PLANT_B), W3 = welch(PLANT_A.slice(0, 3), PLANT_B.slice(0, 3));
const WI = welch(AFTER, BEFORE), PP = paired(AFTER, BEFORE);
const FRAMES: Frame[] = [
  { stage: 'plants', cap: <>Assembly cycle times on <b>8 shifts</b> at each plant. Plant A (old layout, top) vs Plant B (new layout, bottom). B looks faster, but shifts vary a lot. Is the gap real or luck?</> },
  { stage: 'plants', means: true, signal: true, cap: <>The <b>signal</b> is the difference in means: {mean(PLANT_A).toFixed(3)} − {mean(PLANT_B).toFixed(1)} = <b>{W.diff.toFixed(3)} minutes</b> (gold arrow). On its own it means nothing: 4.9 minutes is huge for a stopwatch and tiny for a calendar.</> },
  { stage: 'plants', means: true, signal: true, noise: true, cap: <>The <b>noise</b> is how much shifts wobble within each plant: SD {W.sA.toFixed(2)} min for A and {W.sB.toFixed(2)} min for B (red bars, ±1 SD around each mean).</> },
  { stage: 'plants', means: true, signal: true, seRuler: true, cap: <>Averages wobble less than single shifts. The <b>standard error of the difference</b> combines both: √({(W.sA ** 2).toFixed(3)}/8 + {(W.sB ** 2).toFixed(1)}/8) = <b>{W.se.toFixed(3)} min</b>. That red ruler is the typical size of a difference produced by luck alone.</> },
  { stage: 'plants', means: true, signal: true, seRuler: true, rulers: true, cap: <><b>t = signal ÷ noise</b> = {W.diff.toFixed(3)} / {W.se.toFixed(3)} = <b>{W.t.toFixed(2)}</b>. The gap is almost four noise-rulers long. Luck rarely produces more than about two.</> },
  { stage: 'plants', means: true, signal: true, bottom: 't', cap: <>If the plants were really identical, t would follow the <b>t-distribution</b> (bottom, df ≈ {W.df.toFixed(1)}, Welch). Our t = {W.t.toFixed(2)} sits deep in the tail: both shaded tails together give <b>p = {W.p.toFixed(4)}</b>. Strong evidence the new layout is faster.</> },
  { stage: 'plants', means: true, signal: true, bottom: 'tn', cap: <>The t curve (yellow) has <b>fatter tails</b> than the normal (grey) because the SDs were estimated from only 8 shifts each. So the 5% cut-off is ±{tInv(0.975, W.df).toFixed(2)} instead of ±1.96. Smaller samples demand a bigger ratio.</> },
  { stage: 'plants3', means: true, signal: true, bottom: 'tn', cap: <>Same plants, but suppose we had timed only the <b>first 3 shifts</b> each. The gap is still about 4 minutes, but SE = {W3.se.toFixed(2)}, t = <b>{W3.t.toFixed(2)}</b> and df ≈ {W3.df.toFixed(1)}, whose tails are very fat: p = <b>{W3.p.toFixed(2)}</b>, not significant. Too little data to tell signal from noise.</> },
  { stage: 'indep', means: true, signal: true, bottom: 't', cap: <>New question: 8 sales staff take a test <b>before</b> and <b>after</b> training. Treated as two separate groups: gain {WI.diff.toFixed(1)} points, but people differ by ±6.5 points, so SE = {WI.se.toFixed(2)}, t = {WI.t.toFixed(2)}, p = <b>{WI.p.toFixed(2)}</b>. "Not significant"?</> },
  { stage: 'pairs', means: true, bottom: 't', cap: <>But these are the <b>same 8 people</b>. Connect each person's two scores: <b>every single line slopes the same way</b>. The big differences <i>between</i> people were hiding a consistent gain <i>within</i> each person.</> },
  { stage: 'pairs', bottom: 'gains', cap: <><b>Paired t-test</b>: work with each person's gain (after − before): 4, 3, 2, 5, 3, 5, 2, 4. Mean gain {PP.diff.toFixed(1)}, SD only {PP.sA.toFixed(3)}, so SE = {PP.sA.toFixed(3)}/√8 = <b>{PP.se.toFixed(3)}</b>.</> },
  { stage: 'pairs', bottom: 'tp', cap: <>t = {PP.diff.toFixed(1)} / {PP.se.toFixed(3)} = <b>{PP.t.toFixed(2)}</b> with 7 df: p ≈ <b>{PP.p.toFixed(5)}</b>. Same data, opposite conclusion. <b>Match the test to the design</b>: the wrong test would have cancelled a training programme that works.</> },
  { stage: 'plants', means: true, signal: true, seRuler: true, rulers: true, bottom: 't', cap: <><b>Takeaway:</b> every t-test is <b>difference ÷ standard error</b>, compared with a t-distribution. Report it fully: "B is 4.9 min faster (Welch t({W.df.toFixed(1)}) = {W.t.toFixed(2)}, p = {W.p.toFixed(3)})", and use the paired version whenever the same units are measured twice.</> },
];

function Animate() {
  const p = useStepPlayer(FRAMES.length, 2900);
  const f = FRAMES[p.i];
  const isPlants = f.stage === 'plants' || f.stage === 'plants3';
  const A = isPlants ? (f.stage === 'plants3' ? PLANT_A.slice(0, 3) : PLANT_A) : AFTER;
  const B = isPlants ? (f.stage === 'plants3' ? PLANT_B.slice(0, 3) : PLANT_B) : BEFORE;
  const tt = f.stage === 'plants3' ? W3 : isPlants ? W : f.bottom === 'tp' || f.bottom === 'gains' ? PP : WI;
  const mA = mean(A), mB = mean(B);
  const X: [number, number] = isPlants ? [32, 50] : [50, 80];
  // rows: A (old plant / after) at y = 3, B (new plant / before) at y = 1
  const yA = isPlants ? 3 : 1, yB = isPlants ? 1 : 3;
  const gains = AFTER.map((v, i) => v - BEFORE[i]);
  return (
    <div>
      <Layout
        main={<>
          <Plot x={X} y={[0, 4]} height={230} xLabel={isPlants ? 'assembly cycle time (minutes)' : 'test score (points)'} fy={() => ''} yTicks={0}>
            {(s) => <>
              <Label s={s} x={X[0] + 0.2} y={yA + 0.55} color={C.muted} size={12}>{isPlants ? 'Plant A (old layout)' : 'after training'}</Label>
              <Label s={s} x={X[0] + 0.2} y={yB + 0.55} color={C.muted} size={12}>{isPlants ? 'Plant B (new layout)' : 'before training'}</Label>
              {f.stage === 'pairs' && BEFORE.map((b, i) => <Seg key={'l' + i} s={s} x1={b} y1={yB} x2={AFTER[i]} y2={yA} color={C.gold} width={1.5} />)}
              {f.noise && <>
                <Region s={s} x0={mA - tt.sA} x1={mA + tt.sA} y0={yA - 0.3} y1={yA + 0.3} color={C.red} opacity={0.18} stroke={C.red} />
                <Region s={s} x0={mB - tt.sB} x1={mB + tt.sB} y0={yB - 0.3} y1={yB + 0.3} color={C.red} opacity={0.18} stroke={C.red} />
              </>}
              <Dots s={s} pts={[...A.map((v) => ({ x: v, y: yA })), ...B.map((v) => ({ x: v, y: yB }))]} r={7} color={(i) => (i < A.length ? C.blue : C.teal)} />
              {f.means && <>
                <Seg s={s} x1={mA} x2={mA} y1={yA - 0.45} y2={yA + 0.45} color={C.green} width={3} />
                <Seg s={s} x1={mB} x2={mB} y1={yB - 0.45} y2={yB + 0.45} color={C.green} width={3} />
                <Label s={s} x={mA} y={yA > 2 ? yA + 0.55 : yA - 0.75} color={C.green} size={12} anchor="middle">mean {+mA.toFixed(3)}</Label>
                <Label s={s} x={mB} y={yB > 2 ? yB + 0.55 : yB - 0.75} color={C.green} size={12} anchor="middle">mean {+mB.toFixed(3)}</Label>
              </>}
              {f.signal && <Arrow s={s} x1={Math.min(mA, mB)} y1={2} x2={Math.max(mA, mB)} y2={2} color={C.gold} label={`${Math.abs(mA - mB).toFixed(2)}`} />}
              {f.seRuler && !f.rulers && <Seg s={s} x1={Math.min(mA, mB)} x2={Math.min(mA, mB) + tt.se} y1={1.7} y2={1.7} color={C.red} width={6} />}
              {f.rulers && Array.from({ length: Math.ceil(tt.t) }, (_, i) => <Seg key={'r' + i} s={s} x1={Math.min(mA, mB) + i * tt.se + 0.04} x2={Math.min(Math.min(mA, mB) + (i + 1) * tt.se, Math.max(mA, mB)) - 0.04} y1={1.7} y2={1.7} color={i % 2 ? C.pink : C.red} width={6} />)}
              {f.rulers && <Label s={s} x={Math.min(mA, mB) + tt.t * tt.se + 0.2} y={1.55} color={C.red} size={12}>{tt.t.toFixed(2)} SE-rulers</Label>}
            </>}
          </Plot>
          {(f.bottom === 't' || f.bottom === 'tn') && <TDist tt={tt} normal={f.bottom === 'tn'} />}
          {f.bottom === 'tp' && <TDist tt={tt} xMax={10} />}
          {f.bottom === 'gains' && (
            <Plot x={[-2, 8]} y={[0, 3]} height={220} xLabel="gain per person, after − before (points)" fy={() => ''} yTicks={0}>
              {(s) => {
                const lv: Record<number, number> = {};
                return <>
                  <Seg s={s} x1={0} x2={0} y1={0} y2={3} color={C.muted} dash="4 4" />
                  <Label s={s} x={0.1} y={2.7} color={C.muted} size={11}>no change</Label>
                  <Region s={s} x0={PP.diff - PP.se} x1={PP.diff + PP.se} y0={0.2} y1={2.6} color={C.red} opacity={0.15} stroke={C.red} />
                  <Dots s={s} pts={gains.map((g) => { lv[g] = (lv[g] ?? 0) + 1; return { x: g, y: 0.5 + (lv[g] - 1) * 0.45 }; })} r={8} color={C.gold} />
                  <Seg s={s} x1={PP.diff} x2={PP.diff} y1={0.2} y2={2.6} color={C.green} width={3} />
                  <Label s={s} x={PP.diff + 0.1} y={2.75} color={C.green} size={12}>mean gain 3.5 ± SE {PP.se.toFixed(3)} (red band)</Label>
                  <Arrow s={s} x1={0} y1={2.3} x2={PP.diff} y2={2.3} color={C.gold} />
                </>;
              }}
            </Plot>
          )}
        </>}
        side={<>
          <Readout items={[
            ['signal (difference)', tt.diff.toFixed(3), C.gold],
            ['noise (SE)', tt.se.toFixed(3), C.red],
            ['t = signal / SE', tt.t.toFixed(2)],
            ['degrees of freedom', tt.df.toFixed(1)],
            ['p (two-sided)', pFmt(tt.p)],
            ['test', f.bottom === 'tp' || f.bottom === 'gains' ? 'paired' : 'Welch (independent)'],
          ]} />
          <Legend items={[[isPlants ? 'Plant A shifts' : 'after scores', C.blue], [isPlants ? 'Plant B shifts' : 'before scores', C.teal], ['group means', C.green], ['signal (difference)', C.gold], ['noise (SD / SE)', C.red], ['t-distribution', C.yellow]]} />
          <p className="small muted" style={{ margin: 0 }}>t counts how many noise-rulers fit inside the signal.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{f.cap}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
type Design = 'indep' | 'paired' | 'wrong';
function Playground() {
  const [delta, setDelta] = useState(3);
  const [noise, setNoise] = useState(3);
  const [n, setN] = useState(8);
  const [design, setDesign] = useState<Design>('indep');
  const [seed, setSeed] = useState(1);
  const PERSON = 6; // between-person SD (only shared within a pair in the paired design)
  const data = useMemo(() => {
    const r = rng(seed * 31 + n);
    if (design === 'indep') {
      const A = Array.from({ length: n }, () => 60 + PERSON * gauss(r) + noise * gauss(r));
      const B = Array.from({ length: n }, () => 60 + delta + PERSON * gauss(r) + noise * gauss(r));
      return { A, B };
    }
    const u = Array.from({ length: n }, () => PERSON * gauss(r));
    return { A: u.map((v) => 60 + v + noise * gauss(r)), B: u.map((v) => 60 + delta + v + noise * gauss(r)) };
  }, [delta, noise, n, design, seed]);
  const tt = design === 'paired' ? paired(data.B, data.A) : welch(data.B, data.A);
  const all = [...data.A, ...data.B];
  const lo = Math.floor(Math.min(...all) - 2), hi = Math.ceil(Math.max(...all) + 2);
  const sig = tt.p <= 0.05;
  return (
    <Layout
      main={<>
        <Plot x={[lo, hi]} y={[0, 4]} height={220} xLabel="measurement" fy={() => ''} yTicks={0}>
          {(s) => <>
            <Label s={s} x={lo + 0.3} y={3.55} color={C.muted} size={12}>{design === 'indep' ? 'group B' : 'after (same people)'}</Label>
            <Label s={s} x={lo + 0.3} y={1.55} color={C.muted} size={12}>{design === 'indep' ? 'group A' : 'before'}</Label>
            {design !== 'indep' && data.A.map((a, i) => <Seg key={i} s={s} x1={a} y1={1} x2={data.B[i]} y2={3} color={data.B[i] >= a ? C.gold : C.red} width={1.2} />)}
            <Dots s={s} pts={[...data.A.map((v) => ({ x: v, y: 1 })), ...data.B.map((v) => ({ x: v, y: 3 }))]} r={n > 30 ? 4 : 6} color={(i) => (i < n ? C.teal : C.blue)} animate={false} />
            <Seg s={s} x1={mean(data.A)} x2={mean(data.A)} y1={0.5} y2={1.5} color={C.green} width={3} />
            <Seg s={s} x1={mean(data.B)} x2={mean(data.B)} y1={2.5} y2={3.5} color={C.green} width={3} />
          </>}
        </Plot>
        <TDist tt={tt} xMax={Math.max(6, Math.min(12, Math.abs(tt.t) + 1.5))} normal height={240} />
        <Legend items={[['group A / before', C.teal], ['group B / after', C.blue], ['means', C.green], ['observed t and tails', C.gold], ['t-distribution', C.yellow]]} />
      </>}
      side={<>
        <Choice label="Design" value={design} onChange={setDesign} options={[{ value: 'indep', label: 'Independent groups' }, { value: 'paired', label: 'Paired, paired test' }, { value: 'wrong', label: 'Paired, wrong (independent) test' }]} />
        <Slider label="true difference" min={0} max={8} step={0.5} value={delta} onChange={setDelta} />
        <Slider label="measurement noise SD" min={0.5} max={10} step={0.5} value={noise} onChange={setNoise} />
        <Slider label="n per group" min={3} max={60} value={n} onChange={setN} />
        <button className="btn" onClick={() => setSeed(seed + 1)}>🎲 New data</button>
        <Readout items={[
          ['signal', tt.diff.toFixed(2), C.gold], ['noise (SE)', tt.se.toFixed(2), C.red],
          ['t', tt.t.toFixed(2)], ['df', tt.df.toFixed(1)],
          ['p-value', pFmt(tt.p), sig ? C.green : C.muted], ['verdict', sig ? 'significant' : 'not significant', sig ? C.green : C.muted],
        ]} />
        <p className="small muted" style={{ margin: 0 }}>People also differ from each other (SD 6). Only the paired test removes that from the noise.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'We build a t-test piece by piece: the **signal** (gap between two means), the **noise** (standard error), their ratio **t**, and the tail area under the **t-distribution**. Then we compare a paired and an independent analysis of the same training data.', steps: [
      { do: 'Step through frames 1 to 5.', notice: 'The gold arrow (4.875 min) holds about 3.8 red SE-rulers (1.281 min each): t = 3.81.' },
      { do: 'Continue to frames 6 to 8.', notice: 'p = 0.002 with 8 shifts each; the t curve has fatter tails than the normal; with only 3 shifts each the same gap is not significant (p = 0.14).' },
      { do: 'Watch frames 9 to 12 (training).', notice: 'As two groups: t = 1.06, p = 0.31. As pairs: every line slopes up, t = 8.28, p = 0.00007.' },
    ] },
    Playground: { what: 'Simulate two groups with a chosen true difference, noise and sample size, and see the t statistic, its t-distribution and the p-value update instantly.', steps: [
      { do: 'Set true difference = 0 and press **New data** several times.', notice: 'Usually not significant, but about 1 time in 20 you get p ≤ 0.05 anyway: a false alarm.' },
      { do: 'With difference = 3, drag **n per group** from 3 to 60.', notice: 'The SE shrinks, t grows and the t curve approaches the grey normal curve.' },
      { do: 'Switch between **Paired, paired test** and **Paired, wrong test**.', notice: 'Same data: the paired test removes between-person variation and gives a much larger t.' },
    ] },
  },
};
export default anim;
