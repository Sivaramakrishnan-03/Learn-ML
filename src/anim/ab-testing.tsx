// A/B testing: two conversion streams accumulate visitors day by day, the CI for the lift narrows, and an A/A simulation shows why peeking inflates false positives.
import { ReactNode, useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Seg, Label, Region, Caption, Readout, Slider, Toggle, Layout, Legend, useStepPlayer, PlayerControls, rng, gauss, C, Scales } from '../viz/kit';
import { twoSidedP, shuffleInPlace } from '../viz/math';
import { fmtP } from './_stats2-helpers';

/* ---------- pure helpers ---------- */
const DAYS = 14, PER_DAY = 750; // g-stats2: 10,500 visitors per arm over two weeks
const A_TOTAL = 420, B_TOTAL = 504; // 4.0% and 4.8%
/** A shuffled stream of 0/1 outcomes with an exact number of conversions. */
function stream(n: number, k: number, r: () => number) {
  const a: number[] = Array.from({ length: n }, (_, i) => (i < k ? 1 : 0));
  return shuffleInPlace(a, r);
}
function cumByDay(s: number[], perDay: number, days: number) { const out: number[] = []; let c = 0; for (let d = 0; d < days; d++) { for (let i = d * perDay; i < (d + 1) * perDay; i++) c += s[i]; out.push(c); } return out; }
interface Look { day: number; nA: number; nB: number; cA: number; cB: number; pA: number; pB: number; lift: number; lo: number; hi: number; z: number; p: number }
function analyse(day: number, nA: number, cA: number, nB: number, cB: number): Look {
  const pA = cA / nA, pB = cB / nB, lift = pB - pA;
  const se = Math.sqrt((pA * (1 - pA)) / nA + (pB * (1 - pB)) / nB) || 1e-9; // unpooled SE for the interval
  const pp = (cA + cB) / (nA + nB), se0 = Math.sqrt(pp * (1 - pp) * (1 / nA + 1 / nB)) || 1e-9; // pooled SE for the test
  const z = lift / se0;
  return { day, nA, nB, cA, cB, pA, pB, lift, lo: lift - 1.96 * se, hi: lift + 1.96 * se, z, p: twoSidedP(z) };
}
/** Daily conversions by normal approximation to the binomial (fast enough for thousands of simulated tests). */
function simTest(pA: number, pB: number, perDay: number, days: number, r: () => number) {
  let cA = 0, cB = 0; const looks: Look[] = [];
  const draw = (p: number) => Math.max(0, Math.round(perDay * p + Math.sqrt(perDay * p * (1 - p)) * gauss(r)));
  for (let d = 1; d <= days; d++) { cA += draw(pA); cB += draw(pB); looks.push(analyse(d, d * perDay, cA, d * perDay, cB)); }
  return looks;
}
/** Polyline in data coordinates. */
function Path({ s, pts, color, width = 2.5, dash, opacity = 1 }: { s: Scales; pts: { x: number; y: number }[]; color: string; width?: number; dash?: string; opacity?: number }) {
  if (pts.length < 2) return null;
  return <path d={pts.map((q, i) => `${i ? 'L' : 'M'}${s.sx(q.x)},${s.sy(q.y)}`).join('')} fill="none" stroke={color} strokeWidth={width} strokeDasharray={dash} opacity={opacity} />;
}
const pts1 = (v: number, d = 1) => (100 * v).toFixed(d);

/* ---------- Animate ---------- */
type Fr = { stage: 'plan' | 'day' | 'aa1' | 'aa20' | 'aaSum'; day: number };
const FRAMES: Fr[] = [{ stage: 'plan', day: 0 }, ...Array.from({ length: DAYS }, (_, i) => ({ stage: 'day' as const, day: i + 1 })), { stage: 'aa1', day: DAYS }, { stage: 'aa20', day: DAYS }, { stage: 'aaSum', day: DAYS }];

function Animate() {
  const looks = useMemo(() => {
    const r = rng(77), a = cumByDay(stream(DAYS * PER_DAY, A_TOTAL, r), PER_DAY, DAYS), b = cumByDay(stream(DAYS * PER_DAY, B_TOTAL, r), PER_DAY, DAYS);
    return a.map((cA, i) => analyse(i + 1, (i + 1) * PER_DAY, cA, (i + 1) * PER_DAY, b[i]));
  }, []);
  const aa = useMemo(() => { const r = rng(5); return Array.from({ length: 2000 }, () => simTest(0.04, 0.04, PER_DAY, DAYS, r)); }, []);
  const everCross = aa.filter((t) => t.some((l) => Math.abs(l.z) > 1.96)).length / aa.length;
  const endCross = aa.filter((t) => Math.abs(t[DAYS - 1].z) > 1.96).length / aa.length;
  const p = useStepPlayer(FRAMES.length, 1500);
  const f = FRAMES[p.i];
  const shown = looks.slice(0, f.day), L = shown[shown.length - 1];
  const earlySig = looks.findIndex((l) => l.p < 0.05) + 1;
  const isAA = f.stage.startsWith('aa');
  const nPaths = f.stage === 'aa1' ? 1 : 20;
  const crossed = aa.slice(0, 20).filter((t) => t.some((l) => Math.abs(l.z) > 1.96)).length;
  let cap: ReactNode;
  if (f.stage === 'plan') cap = <>An electronics retailer tests a new checkout page (<b>B</b>) against the current one (<b>A</b>, 4.0% conversion). The power calculation said <b>about 10,300 visitors per arm</b>, so the plan is 14 days × 750 visitors per arm per day, analysed <b>once</b>, at the end.</>;
  else if (f.stage === 'day' && L) {
    const base = <>Day {L.day}: A {L.cA}/{L.nA.toLocaleString('en-IN')} = {pts1(L.pA, 2)}%, B {L.cB}/{L.nB.toLocaleString('en-IN')} = {pts1(L.pB, 2)}%. Lift = <b>{L.lift >= 0 ? '+' : ''}{pts1(L.lift, 2)} points</b>, 95% CI {pts1(L.lo, 2)} to {pts1(L.hi, 2)}. </>;
    if (L.day === 1) cap = <>{base}The interval is <b>huge</b>: after one day the truth could be anything from B much worse to B much better.</>;
    else if (L.day < DAYS && L.p < 0.05) cap = <>{base}p = {L.p.toFixed(3)} is already below 0.05. <b>Tempting to stop and celebrate, but the plan says 14 days.</b> Early "wins" often shrink, and stopping on a good day inflates false positives (see the end).</>;
    else if (L.day < DAYS) cap = <>{base}Each day adds data, so the band <b>narrows roughly like 1/√n</b>. p = {L.p.toFixed(2)}. Keep going: the decision waits for the planned sample size.</>;
    else cap = <>{base}<b>Planned end: z = {L.z.toFixed(2)}, p = {L.p.toFixed(4)}.</b> The whole interval sits above zero, and even its low end (+{pts1(L.lo, 2)} points) is worth money. <b>Ship B.</b></>;
  } else if (f.stage === 'aa1') cap = <>Now the danger of <b>peeking</b>. Imagine an <b>A/A test</b>: both pages are identical (4.0%). The line is the z-score you would see if you checked every day. Outside the red band (|z| &gt; 1.96) a naive analyst would declare a "winner".</>;
  else if (f.stage === 'aa20') cap = <>Twenty A/A tests. <b>{crossed} of 20</b> wander outside the band on <i>some</i> day (red lines), even though nothing is different. If you stop the first time p &lt; 0.05, each of those becomes a false "win".</>;
  else cap = <>Out of 2,000 simulated A/A tests: looking <b>once</b> at day 14 gives a false alarm <b>{pts1(endCross)}%</b> of the time (the promised 5%). Peeking every day and stopping at the first p &lt; 0.05 gives <b>{pts1(everCross)}%</b>. <b>Fix the sample size in advance</b>, or use a sequential method designed for peeking.</>;

  return (
    <div>
      <Layout
        main={isAA ? <>
          <div className="small muted">A/A tests (no real difference): z-score if you peeked every day</div>
          <Plot x={[0, DAYS]} y={[-4, 4]} height={f.stage === 'aaSum' ? 300 : 470} xLabel="day of the test" yLabel="z-score of B − A" xTicks={14}>
            {(s) => <>
              <Region s={s} x0={0} x1={DAYS} y0={1.96} y1={4} color={C.red} opacity={0.12} />
              <Region s={s} x0={0} x1={DAYS} y0={-4} y1={-1.96} color={C.red} opacity={0.12} />
              <Seg s={s} x1={0} x2={DAYS} y1={0} y2={0} color={C.grey} />
              {aa.slice(0, nPaths).map((t, k) => { const bad = t.some((l) => Math.abs(l.z) > 1.96); return <Path key={k} s={s} pts={[{ x: 0, y: 0 }, ...t.map((l) => ({ x: l.day, y: l.z }))]} color={f.stage === 'aa1' ? C.blue : bad ? C.red : C.blue} width={f.stage === 'aa1' ? 3 : 1.6} opacity={f.stage === 'aa1' ? 1 : 0.85} />; })}
              <Label s={s} x={0.2} y={3.5} color={C.red} size={12}>"B wins" zone (p &lt; 0.05)</Label>
              <Label s={s} x={0.2} y={-3.7} color={C.red} size={12}>"B loses" zone</Label>
            </>}
          </Plot>
          {f.stage === 'aaSum' && <>
            <div className="small muted" style={{ marginTop: 6 }}>False "winners" among 2,000 A/A tests</div>
            <Plot x={[0, 30]} y={[0, 3]} height={150} xLabel="false-alarm rate (%)" fy={() => ''} yTicks={1}>
              {(s) => <>
                <Region s={s} x0={0} x1={100 * endCross} y0={1.75} y1={2.6} color={C.green} opacity={0.8} />
                <Region s={s} x0={0} x1={100 * everCross} y0={0.4} y1={1.25} color={C.red} opacity={0.8} />
                <Label s={s} x={100 * endCross + 0.4} y={2.05} color={C.green} size={13}>one look at day 14: {pts1(endCross)}%</Label>
                <Label s={s} x={100 * everCross + 0.4} y={0.7} color={C.red} size={13}>peek daily: {pts1(everCross)}%</Label>
                <Seg s={s} x1={5} x2={5} y1={0} y2={3} color={C.muted} dash="4 3" />
              </>}
            </Plot>
          </>}
        </> : <>
          <div className="small muted">Cumulative conversion rate per arm</div>
          <Plot x={[0, DAYS]} y={[2, 7]} height={220} xLabel="day of the test" yLabel="conversion (%)" xTicks={14}>
            {(s) => <>
              <Path s={s} pts={shown.map((l) => ({ x: l.day, y: 100 * l.pA }))} color={C.blue} />
              <Path s={s} pts={shown.map((l) => ({ x: l.day, y: 100 * l.pB }))} color={C.gold} />
              {L && <><Label s={s} x={Math.min(L.day + 0.2, 12.8)} y={100 * L.pA - 0.35} color={C.blue} size={12}>A {pts1(L.pA, 2)}%</Label><Label s={s} x={Math.min(L.day + 0.2, 12.8)} y={100 * L.pB + 0.25} color={C.gold} size={12}>B {pts1(L.pB, 2)}%</Label></>}
            </>}
          </Plot>
          <div className="small muted" style={{ marginTop: 6 }}>Lift (B − A) with its 95% confidence interval, after each day</div>
          <Plot x={[0, DAYS]} y={[-3, 3.5]} height={240} xLabel="day of the test" yLabel="lift (percentage points)" xTicks={14}>
            {(s) => <>
              <Seg s={s} x1={0} x2={DAYS} y1={0} y2={0} color={C.red} width={2} dash="6 4" />
              <Label s={s} x={0.15} y={-0.3} color={C.red} size={12}>no difference</Label>
              {shown.map((l) => <Region key={l.day} s={s} x0={l.day - 0.3} x1={l.day + 0.3} y0={Math.max(-3, 100 * l.lo)} y1={Math.min(3.5, 100 * l.hi)} color={l.lo > 0 ? C.green : C.gold} opacity={l.day === f.day ? 0.55 : 0.22} />)}
              <Path s={s} pts={shown.map((l) => ({ x: l.day, y: 100 * l.lift }))} color={C.yellow} width={2} />
              {L && <Label s={s} x={Math.min(L.day + 0.4, 12.2)} y={Math.min(3.1, 100 * L.hi + 0.2)} color={C.text} size={12}>{pts1(L.lo, 2)} to {pts1(L.hi, 2)}</Label>}
            </>}
          </Plot>
        </>}
        side={<>
          {isAA ? <Readout items={[['A/A tests simulated', '2,000'], ['false alarms, one look', pts1(endCross) + '%', C.green], ['false alarms, daily peeking', pts1(everCross) + '%', C.red], ['shown here crossing', f.stage === 'aa1' ? '–' : `${crossed} / 20`, C.red]]} />
            : <Readout items={[
              ['visitors per arm', L ? L.nA.toLocaleString('en-IN') : '0'],
              ['A conversion', L ? pts1(L.pA, 2) + '%' : '–', C.blue],
              ['B conversion', L ? pts1(L.pB, 2) + '%' : '–', C.gold],
              ['lift (points)', L ? (L.lift >= 0 ? '+' : '') + pts1(L.lift, 2) : '–', C.yellow],
              ['95% CI', L ? `${pts1(L.lo, 2)} to ${pts1(L.hi, 2)}` : '–'],
              ['p-value', L ? fmtP(L.p) : '–', L && L.p < 0.05 ? C.green : undefined],
            ]} />}
          {isAA ? <Legend items={[['never crossed', C.blue], ['crossed on some day', C.red]]} /> : <Legend items={[['A (current page)', C.blue], ['B (new page)', C.gold], ['lift estimate', C.yellow], ['CI includes 0', C.gold], ['CI above 0', C.green]]} />}
          <p className="small muted" style={{ margin: 0 }}>{earlySig > 0 && earlySig < DAYS && !isAA ? `In this run p first dipped below 0.05 on day ${earlySig}. ` : ''}The planned test analyses once, at day 14, with about 10,500 visitors per arm.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{cap}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
function Playground() {
  const [liftPts, setLift] = useState(0.8);
  const [perDay, setPerDay] = useState(750);
  const [days, setDays] = useState(14);
  const [peek, setPeek] = useState(false);
  const [seed, setSeed] = useState(1);
  const pA = 0.04, pB = 0.04 + liftPts / 100;
  const looks = useMemo(() => simTest(pA, pB, perDay, days, rng(seed * 13 + 7)), [pB, perDay, days, seed]);
  const stopIdx = peek ? looks.findIndex((l) => l.p < 0.05) : -1;
  const final = stopIdx >= 0 ? looks[stopIdx] : looks[looks.length - 1];
  const winRate = useMemo(() => {
    const r = rng(seed + 991); let once = 0, any = 0; const S = 600;
    for (let k = 0; k < S; k++) { const t = simTest(pA, pB, perDay, days, r); if (t[t.length - 1].p < 0.05) once++; if (t.some((l) => l.p < 0.05)) any++; }
    return { once: once / S, any: any / S };
  }, [pB, perDay, days, seed]);
  const shown = stopIdx >= 0 ? looks.slice(0, stopIdx + 1) : looks;
  const yLo = -3, yHi = 4, zHi = Math.max(6, Math.ceil(Math.max(...looks.map((l) => l.z)) + 0.5)), zLo = Math.min(-4, Math.floor(Math.min(...looks.map((l) => l.z)) - 0.5));
  return (
    <Layout
      main={<>
        <Plot x={[0, days]} y={[zLo, zHi]} height={230} xLabel="day" yLabel="z-score of B − A" xTicks={Math.min(days, 14)}>
          {(s) => <>
            <Region s={s} x0={0} x1={days} y0={1.96} y1={zHi} color={C.green} opacity={0.1} />
            <Region s={s} x0={0} x1={days} y0={zLo} y1={-1.96} color={C.red} opacity={0.1} />
            <Seg s={s} x1={0} x2={days} y1={0} y2={0} color={C.grey} />
            <Path s={s} pts={[{ x: 0, y: 0 }, ...looks.map((l) => ({ x: l.day, y: l.z }))]} color={C.blue} width={1.5} opacity={0.35} />
            <Path s={s} pts={[{ x: 0, y: 0 }, ...shown.map((l) => ({ x: l.day, y: l.z }))]} color={C.blue} width={2.5} />
            {stopIdx >= 0 && <><Seg s={s} x1={final.day} x2={final.day} y1={zLo} y2={zHi} color={C.gold} dash="4 3" /><Label s={s} x={final.day + 0.15} y={zHi - 0.8} color={C.gold} size={12}>stopped on day {final.day}</Label></>}
          </>}
        </Plot>
        <Plot x={[0, days]} y={[yLo, yHi]} height={230} xLabel="day" yLabel="lift (points) with 95% CI" xTicks={Math.min(days, 14)}>
          {(s) => <>
            <Seg s={s} x1={0} x2={days} y1={0} y2={0} color={C.red} dash="6 4" />
            <Seg s={s} x1={0} x2={days} y1={liftPts} y2={liftPts} color={C.green} dash="3 3" />
            <Label s={s} x={days - 0.1} y={liftPts + 0.2} anchor="end" color={C.green} size={11}>true lift</Label>
            {shown.map((l) => <Region key={l.day} s={s} x0={l.day - 0.3} x1={l.day + 0.3} y0={Math.max(yLo, 100 * l.lo)} y1={Math.min(yHi, 100 * l.hi)} color={l.lo > 0 ? C.green : l.hi < 0 ? C.red : C.gold} opacity={0.35} />)}
            <Path s={s} pts={shown.map((l) => ({ x: l.day, y: 100 * l.lift }))} color={C.yellow} width={2} />
          </>}
        </Plot>
      </>}
      side={<>
        <Slider label="true lift of B (points)" min={0} max={1.5} step={0.1} value={liftPts} onChange={setLift} format={(v) => `+${v.toFixed(1)} (${(4 + v).toFixed(1)}%)`} />
        <Slider label="visitors per arm per day" min={100} max={2000} step={50} value={perDay} onChange={setPerDay} />
        <Slider label="test length (days)" min={7} max={28} value={days} onChange={setDays} />
        <Toggle label="Peek daily and stop at the first p < 0.05" value={peek} onChange={setPeek} />
        <button className="btn" onClick={() => setSeed(seed + 1)}>🎲 Run a new experiment</button>
        <Readout items={[
          ['lift found', `${pts1(final.lift, 2)} pts`, C.yellow], ['95% CI', `${pts1(final.lo, 2)} to ${pts1(final.hi, 2)}`], ['p-value', fmtP(final.p), final.p < 0.05 ? C.green : undefined],
          [liftPts === 0 ? 'false alarms, one look' : 'power, one look', pts1(winRate.once) + '%', C.green], [liftPts === 0 ? 'false alarms, peeking' : '"wins", peeking', pts1(winRate.any) + '%', C.red],
        ]} />
        <p className="small muted" style={{ margin: 0 }}>Baseline A converts 4.0%. The last two numbers come from 600 simulated experiments with your settings. Set the true lift to 0: one look gives about 5% false wins, daily peeking several times more.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'The chapter\'s planned checkout test: **A converts 4.0%, B 4.8%**, 750 visitors per arm per day for 14 days. Watch the estimated lift and its **95% confidence interval** after each day, then see why **peeking** at an A/A test produces false winners.', steps: [
      { do: 'Step through days 1 to 5.', notice: 'The interval (vertical bars) is wide at first and the estimated lift jumps around.' },
      { do: 'Play to day 14.', notice: 'The interval narrows and ends at about **+0.25 to +1.35 points**, entirely above zero (p ≈ 0.005).' },
      { do: 'Continue to the A/A frames.', notice: 'With no real difference, daily peeking crosses p < 0.05 at some point in about **1 test in 5**, not 1 in 20.' },
    ] },
    Playground: { what: 'Run your own A/B tests: choose the true lift, traffic and duration, and decide whether to peek.', steps: [
      { do: 'With lift +0.8, set visitors per day to **150**, and run several experiments.', notice: 'The CI stays wide and the power (one look) is low: too little traffic to detect a real lift.' },
      { do: 'Set the **true lift to 0** and tick **Peek daily**.', notice: 'Compare "false alarms, one look" (≈5%) with "peeking" (much higher).' },
      { do: 'Untick peeking and increase **test length** to 28 days.', notice: 'Power rises and the final interval narrows: more visitors, more precision.' },
    ] },
  },
};
export default anim;
