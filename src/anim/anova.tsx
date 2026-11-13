// One-way ANOVA: between-group spread (group means around the grand mean) vs within-group spread (points around their group mean); F is their ratio.
import { ReactNode, useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Dots, FnLine, Seg, Label, Region, Caption, Readout, Slider, Layout, Legend, useStepPlayer, PlayerControls, rng, gauss, C } from '../viz/kit';
import { fSf, fCrit, mean, sum, fPdf } from '../viz/math';
import { fmtP } from './_stats2-helpers';

/* ---------- pure helpers ---------- */
const NAMES = ['A', 'B', 'C'];
const BOOK = [[18, 20, 22], [21, 23, 25], [27, 29, 31]]; // g-stats2: weekly sales per agent, three call scripts
function anova(groups: number[][]) {
  const all = groups.flat(), grand = mean(all), means = groups.map(mean);
  const ssbParts = groups.map((g, i) => g.length * (means[i] - grand) ** 2);
  const ssb = sum(ssbParts), ssw = sum(groups.map((g, i) => sum(g.map((v) => (v - means[i]) ** 2))));
  const dfb = groups.length - 1, dfw = all.length - groups.length;
  const msb = ssb / dfb, msw = ssw / dfw, F = msw > 0 ? msb / msw : 0;
  return { grand, means, ssbParts, ssb, ssw, dfb, dfw, msb, msw, F, p: fSf(F, dfb, dfw), eta: ssb + ssw > 0 ? ssb / (ssb + ssw) : 0 };
}
/** Spread each group around its own mean by a factor (means unchanged). */
const stretch = (groups: number[][], k: number) => groups.map((g) => { const m = mean(g); return g.map((v) => m + (v - m) * k); });
const xPos = (g: number, j: number, n: number) => g + 1 + (n > 1 ? (j - (n - 1) / 2) * Math.min(0.09, 0.5 / (n - 1)) : 0);

/** Strip plot used by both tabs. */
function Strip({ groups, a, show, y, height = 290 }: { groups: number[][]; a: ReturnType<typeof anova>; show: { grand: boolean; means: boolean; between: number; within: boolean; labels?: boolean }; y: [number, number]; height?: number }) {
  const pts = groups.flatMap((g, gi) => g.map((v, j) => ({ x: xPos(gi, j, g.length), y: v })));
  const gOf = groups.flatMap((g, gi) => g.map(() => gi));
  return (
    <Plot x={[0, 3.6]} y={y} height={height} xLabel="call script" yLabel="weekly sales" xTicks={3} fx={(v) => (Number.isInteger(v) && v >= 1 && v <= 3 ? `Script ${NAMES[v - 1]}` : '')}>
      {(s) => <>
        {show.within && groups.map((g, gi) => g.map((v, j) => <Seg key={`w${gi}-${j}`} s={s} x1={xPos(gi, j, g.length)} x2={xPos(gi, j, g.length)} y1={a.means[gi]} y2={v} color={C.red} width={2} />))}
        {show.grand && <Seg s={s} x1={0} x2={3.6} y1={a.grand} y2={a.grand} color={C.green} dash="6 4" width={2} />}
        {show.grand && <Label s={s} x={0.04} y={a.grand + (y[1] - y[0]) * 0.025} color={C.green} size={12}>grand mean {a.grand.toFixed(1)}</Label>}
        {show.means && a.means.map((m, gi) => <Seg key={'m' + gi} s={s} x1={gi + 0.7} x2={gi + 1.3} y1={m} y2={m} color={C.yellow} width={3} />)}
        {show.means && a.means.map((m, gi) => <Label key={'ml' + gi} s={s} x={gi + 1.32} y={m + (y[1] - y[0]) * 0.012} color={C.yellow} size={12}>{m.toFixed(1)}</Label>)}
        {a.means.slice(0, show.between).map((m, gi) => <g key={'b' + gi}>
          <Seg s={s} x1={gi + 0.66} x2={gi + 0.66} y1={a.grand} y2={m} color={C.gold} width={5} />
          {show.labels && <Label s={s} x={gi + 0.63} y={(a.grand + m) / 2 - (y[1] - y[0]) * 0.015} anchor="end" color={C.gold} size={11}>{groups[gi].length}×{Math.abs(m - a.grand).toFixed(groups[gi].length > 3 ? 1 : 0)}²</Label>}
        </g>)}
        <Dots s={s} pts={pts} r={groups[0].length > 10 ? 4 : 7} color={(i) => (show.within ? C.blue : [C.blue, C.blue, C.blue][gOf[i]])} />
      </>}
    </Plot>
  );
}

/** Horizontal split of total variation into between (gold) and within (red). */
function SSBar({ ssb, ssw, max }: { ssb: number; ssw: number; max: number }) {
  return (
    <Plot x={[0, max]} y={[0, 1]} height={92} xLabel="sum of squares (variation)" fy={() => ''} yTicks={1} grid={false}>
      {(s) => <>
        <Region s={s} x0={0} x1={ssb} y0={0.25} y1={0.8} color={C.gold} opacity={0.85} />
        <Region s={s} x0={ssb} x1={ssb + ssw} y0={0.25} y1={0.8} color={C.red} opacity={0.85} />
        {ssb > max * 0.12 && <Label s={s} x={ssb / 2} y={0.43} anchor="middle" color={C.bg} size={12}>between {ssb.toFixed(0)}</Label>}
        {ssw > max * 0.12 && <Label s={s} x={ssb + ssw / 2} y={0.43} anchor="middle" color={C.bg} size={12}>within {ssw.toFixed(0)}</Label>}
        {ssw > 0 && ssw <= max * 0.12 && <Label s={s} x={ssb + ssw + max * 0.01} y={0.43} color={C.red} size={12}>within {ssw.toFixed(0)}</Label>}
      </>}
    </Plot>
  );
}

/* ---------- Animate ---------- */
type Stage = 'dots' | 'grand' | 'means' | 'b1' | 'b2' | 'b3' | 'msb' | 'within' | 'msw' | 'F' | 'curve' | 'noisy' | 'noisyF' | 'eta';
const STAGES: Stage[] = ['dots', 'grand', 'means', 'b1', 'b2', 'b3', 'msb', 'within', 'msw', 'F', 'curve', 'noisy', 'noisyF', 'eta'];

function Animate() {
  const p = useStepPlayer(STAGES.length, 1800);
  const st = STAGES[p.i];
  const at = (x: Stage) => STAGES.indexOf(x) <= p.i;
  const noisy = at('noisy') && st !== 'eta';
  const groups = noisy ? stretch(BOOK, 4) : BOOK;
  const a = anova(groups), base = anova(BOOK), wide = anova(stretch(BOOK, 4));
  const crit = fCrit(0.05, 2, 6);
  const between = st === 'b1' ? 1 : st === 'b2' ? 2 : at('b3') ? 3 : 0;
  const show = { grand: at('grand'), means: at('means'), between, within: at('within'), labels: true };
  const ssbSoFar = sum(a.ssbParts.slice(0, between));
  const Fshown = at('F') ? a.F : 0;
  const cap: Record<Stage, ReactNode> = {
    dots: <>Nine sales agents, three per <b>call script</b>. Each dot is one agent's weekly sales. Do the scripts really differ, or are we seeing ordinary agent-to-agent variation?</>,
    grand: <>The dashed green line is the <b>grand mean</b> of all nine agents: 216 ÷ 9 = <b>24</b> sales. If scripts made no difference, every group should sit near it.</>,
    means: <>The yellow bars are the <b>group means</b>: A = 20, B = 23, C = 29. They differ. ANOVA asks: are these differences bigger than the noise inside each group would produce?</>,
    b1: <><b>Between-group spread</b>, script A: its mean is 4 below the grand mean. Each of its 3 agents counts, so it adds 3 × 4² = <b>48</b>.</>,
    b2: <>Script B is only 1 below: 3 × 1² = <b>3</b>. Running total of between-group variation: 51.</>,
    b3: <>Script C is 5 above: 3 × 5² = <b>75</b>. Between-group sum of squares <b>SSB = 48 + 3 + 75 = 126</b> (gold bar below).</>,
    msb: <>With 3 groups, 3 − 1 = <b>2</b> degrees of freedom. Mean square between: <b>MSB = 126 ÷ 2 = 63</b>. This is the "signal": how far apart the scripts' averages are.</>,
    within: <>Now the <b>within-group spread</b> (red lines): every agent is −2, 0 or +2 from their own group mean. SSW = 3 groups × (4 + 0 + 4) = <b>24</b>. This is the noise that has nothing to do with scripts.</>,
    msw: <>9 agents − 3 groups = <b>6</b> degrees of freedom. Mean square within: <b>MSW = 24 ÷ 6 = 4</b>.</>,
    F: <><b>F = MSB ÷ MSW = 63 ÷ 4 = 15.75.</b> The group means are spread about 16 times more than the noise would suggest. If scripts made no difference, F would hover around 1.</>,
    curve: <>Under "no difference", F follows the <b>F-distribution with (2, 6) df</b> (yellow). Only 5% of the time does it exceed <b>{crit.toFixed(2)}</b> (red). Our 15.75 is far beyond: <b>p = {base.p.toFixed(4)}</b>. The scripts differ.</>,
    noisy: <>Now a thought experiment: keep the <b>same group means</b> (20, 23, 29) but make agents within each group <b>4× more variable</b> (−8, 0, +8). The between-group bar is unchanged; the red within-group bar balloons to 384.</>,
    noisyF: <>MSW = 384 ÷ 6 = 64, so <b>F = 63 ÷ 64 = {wide.F.toFixed(2)}</b>, p = {wide.p.toFixed(2)}. Same means, no evidence! <b>A difference in means only counts relative to the noise.</b></>,
    eta: <>Back to the real data. <b>η² = SSB ÷ (SSB + SSW) = 126 ÷ 150 = {base.eta.toFixed(2)}</b>: script explains 84% of the variation in sales. ANOVA says <i>some</i> script differs; a follow-up test (Tukey HSD) says which: C beats A and B.</>,
  };
  return (
    <div>
      <Layout
        main={<>
          <Strip groups={groups} a={a} show={show} y={noisy ? [8, 40] : [14, 34]} height={280} />
          <div className="small muted" style={{ marginTop: 6 }}>Total variation split into between-group (gold) and within-group (red)</div>
          <SSBar ssb={at('b1') ? ssbSoFar : 0} ssw={at('within') ? a.ssw : 0} max={520} />
          <div className="small muted" style={{ marginTop: 6 }}>F = between ÷ within, compared with the F-distribution (2 and 6 df)</div>
          <Plot x={[0, 18]} y={[0, 1.05]} height={180} xLabel="F value" fy={() => ''} yTicks={3}>
            {(s) => <>
              {at('curve') && <FnLine s={s} f={(x: number) => fPdf(x, 2, 6)} from={0.001} color={C.yellow} width={3} />}
              {at('curve') && <><Region s={s} x0={crit} x1={18} y0={0} y1={0.03} color={C.red} opacity={0.6} /><Label s={s} x={crit + 0.2} y={0.1} color={C.red} size={12}>top 5%: F &gt; {crit.toFixed(2)}</Label></>}
              {at('F') && <><Seg s={s} x1={Fshown} x2={Fshown} y1={0} y2={0.7} color={C.gold} width={3} /><Label s={s} x={Math.min(Fshown, 15.5)} y={0.78} anchor="middle" color={C.gold}>F = {Fshown.toFixed(2)}</Label></>}
            </>}
          </Plot>
        </>}
        side={<>
          <Readout items={[
            ['SSB (between)', at('b1') ? ssbSoFar.toFixed(0) : '–', C.gold],
            ['SSW (within)', at('within') ? a.ssw.toFixed(0) : '–', C.red],
            ['MSB = SSB ÷ 2', at('msb') ? a.msb.toFixed(1) : '–', C.gold],
            ['MSW = SSW ÷ 6', at('msw') ? a.msw.toFixed(1) : '–', C.red],
            ['F = MSB ÷ MSW', at('F') ? a.F.toFixed(2) : '–'],
            ['p-value', at('curve') ? a.p.toFixed(4) : '–'],
          ]} />
          <Legend items={[['agent', C.blue], ['grand mean', C.green], ['group mean', C.yellow], ['between spread', C.gold], ['within spread', C.red]]} />
          <p className="small muted" style={{ margin: 0 }}>F is a signal-to-noise ratio: how spread out the group means are, divided by how spread out individuals are inside groups.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{cap[st]}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
function Playground() {
  const [gap, setGap] = useState(1);
  const [noise, setNoise] = useState(2);
  const [n, setN] = useState(5);
  const [seed, setSeed] = useState(1);
  const groups = useMemo(() => {
    const r = rng(seed * 31 + n), shift = [-4, -1, 5];
    return shift.map((d) => Array.from({ length: n }, () => 24 + gap * d + noise * gauss(r)));
  }, [gap, noise, n, seed]);
  const a = anova(groups), crit = fCrit(0.05, a.dfb, a.dfw);
  const all = groups.flat(), lo = Math.min(...all, 14), hi = Math.max(...all, 34), padY = (hi - lo) * 0.08;
  const fMax = 12, off = a.F > fMax - 0.5;
  const pdf = (x: number) => fPdf(x, a.dfb, a.dfw), yTop = Math.min(1.05, Math.max(0.8, pdf(0.3) * 1.1));
  return (
    <Layout
      main={<>
        <Strip groups={groups} a={a} show={{ grand: true, means: true, between: 3, within: true }} y={[lo - padY, hi + padY]} height={280} />
        <SSBar ssb={a.ssb} ssw={a.ssw} max={Math.max(a.ssb + a.ssw, 1) * 1.02} />
        <Plot x={[0, fMax]} y={[0, yTop]} height={170} xLabel={`F value (df ${a.dfb} and ${a.dfw})`} fy={() => ''} yTicks={3}>
          {(s) => <>
            <FnLine s={s} f={pdf} from={0.001} color={C.yellow} width={3} />
            <Region s={s} x0={crit} x1={fMax} y0={0} y1={yTop * 0.03} color={C.red} opacity={0.6} />
            <Seg s={s} x1={off ? fMax - 0.3 : a.F} x2={off ? fMax - 0.3 : a.F} y1={0} y2={yTop * 0.7} color={C.gold} width={3} />
            <Label s={s} x={off ? fMax - 0.5 : Math.min(a.F + 0.2, fMax - 3)} y={yTop * 0.75} anchor={off ? 'end' : 'start'} color={C.gold}>F = {a.F.toFixed(2)}{off ? ' →' : ''}</Label>
          </>}
        </Plot>
      </>}
      side={<>
        <Slider label="gap between scripts" min={0} max={2} step={0.1} value={gap} onChange={setGap} format={(v) => `${v.toFixed(1)}×`} />
        <Slider label="agent-to-agent noise (SD)" min={0.5} max={10} step={0.5} value={noise} onChange={setNoise} />
        <Slider label="agents per script" min={3} max={30} value={n} onChange={setN} />
        <button className="btn" onClick={() => setSeed(seed + 1)}>🎲 New agents</button>
        <Readout items={[['MSB', a.msb.toFixed(1), C.gold], ['MSW', a.msw.toFixed(1), C.red], ['F', a.F.toFixed(2)], ['p-value', fmtP(a.p), a.p < 0.05 ? C.red : C.green], ['η²', a.eta.toFixed(2)], ['5% cut-off', crit.toFixed(2)]]} />
        <p className="small muted" style={{ margin: 0 }}>Gap 1× uses the book's script means (20, 23, 29). Set the gap to 0 and press New agents repeatedly: F hovers around 1 and is significant only about 1 time in 20.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Three call scripts, three agents each (the lesson\'s example). We measure how far the **group means** spread around the grand mean (between) and how far **agents** spread around their own group mean (within). **F** is the ratio.', steps: [
      { do: 'Step through frames 1 to 7.', notice: 'The gold bars measure between-group spread; they add up to **SSB = 126**.' },
      { do: 'Continue to frame 10.', notice: 'Red lines show the within-group noise (**SSW = 24**). F = (126 ÷ 2) ÷ (24 ÷ 6) = **15.75**, far into the F-curve\'s tail (p ≈ 0.004).' },
      { do: 'Step on to the "4× more variable" frames.', notice: 'Same group means, but F drops to about **1**: differences in means only matter relative to noise.' },
    ] },
    Playground: { what: 'Simulate agents under three scripts. Control how far apart the scripts truly are, how noisy agents are, and how many agents you test.', steps: [
      { do: 'Raise **noise** from 2 to 8 with the gap at 1×.', notice: 'The red (within) part of the bar grows, F shrinks and the p-value rises above 0.05.' },
      { do: 'Keep noise at 8 and raise **agents per script** to 30.', notice: 'F climbs back: more data per group makes the means more precise, so the same gap becomes detectable.' },
      { do: 'Set the **gap to 0** and press **New agents** several times.', notice: 'F wobbles around 1; now and then it crosses the red cut-off by chance (a false alarm).' },
    ] },
  },
};
export default anim;
