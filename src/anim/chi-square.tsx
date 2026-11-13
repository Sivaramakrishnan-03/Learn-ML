// Chi-square test: observed vs expected bars, (O − E)²/E contributions stacking up into χ², and χ² landing on the chi-square curve.
import { ReactNode, useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Bars, FnLine, Seg, Arrow, Label, Region, Caption, Readout, Slider, Toggle, Layout, Legend, useStepPlayer, PlayerControls, rng, C } from '../viz/kit';
import { chi2pdf, chi2sf, chi2crit, histCounts, fmtP } from './_stats2-helpers';

/* ---------- pure helpers ---------- */
const FACES = [1, 2, 3, 4, 5, 6];
const DIE_OBS = [5, 8, 9, 8, 10, 20]; // g-stats2 worked example: 60 rolls
const contrib = (o: number[], e: number[]) => o.map((v, i) => (e[i] > 0 ? (v - e[i]) ** 2 / e[i] : 0));
const total = (a: number[]) => a.reduce((s, v) => s + v, 0);
/** Roll a die n times with P(six) = p6 (other faces share the rest equally). */
function rollDie(n: number, p6: number, r: () => number) {
  const c = [0, 0, 0, 0, 0, 0], pOther = (1 - p6) / 5;
  for (let i = 0; i < n; i++) { const u = r(); const f = u >= 1 - p6 ? 5 : Math.min(4, Math.floor(u / pOther)); c[f]++; }
  return c;
}
/** χ² scores of many fair dice: the null distribution, built by brute force. */
function nullScores(n: number, sims: number, seed: number) {
  const r = rng(seed), e = Array(6).fill(n / 6);
  return Array.from({ length: sims }, () => total(contrib(rollDie(n, 1 / 6, r), e)));
}
const SEG = [C.red, C.pink];

/* ---------- Animate ---------- */
type Stage = 'E' | 'O' | 'gap' | 'face' | 'total' | 'sim' | 'curve' | 'cut' | 'land' | 'verdict';
interface Frame { stage: Stage; k: number }

function Animate() {
  const E = Array(6).fill(10);
  const parts = contrib(DIE_OBS, E);
  const chi = total(parts), df = 5, crit = chi2crit(0.05, df), pval = chi2sf(chi, df);
  const sims = useMemo(() => nullScores(60, 2000, 11), []);
  const simH = useMemo(() => histCounts(sims, 0, 20, 40).map((d) => ({ x: d.x, y: d.y / (sims.length * 0.5) })), [sims]);
  const simOver = sims.filter((v) => v >= chi).length / sims.length;
  const frames: Frame[] = [
    { stage: 'E', k: 0 }, { stage: 'O', k: 0 }, { stage: 'gap', k: 0 },
    ...FACES.map((k) => ({ stage: 'face' as Stage, k })),
    { stage: 'total', k: 6 }, { stage: 'sim', k: 6 }, { stage: 'curve', k: 6 }, { stage: 'cut', k: 6 }, { stage: 'land', k: 6 }, { stage: 'verdict', k: 6 },
  ];
  const p = useStepPlayer(frames.length, 1700);
  const f = frames[p.i];
  const at = (s: Stage) => frames.findIndex((fr) => fr.stage === s) <= p.i;
  const showO = at('O'), showGap = at('gap'), k = f.k, run = total(parts.slice(0, k));
  const cur = f.stage === 'face' ? k - 1 : -1;
  const lowerMode = at('sim');
  let x0 = 0;
  const segs = parts.map((v, i) => { const s = { x0, x1: x0 + v, i }; x0 += v; return s; });

  const caption: Record<Stage, ReactNode> = {
    E: <>Is this die fair? We roll it <b>60 times</b>. If it is fair, each face should come up about <b>60 ÷ 6 = 10 times</b>. The dashed green lines are these <b>expected counts (E)</b>.</>,
    O: <>Here are the <b>observed counts (O)</b>: 5, 8, 9, 8, 10 and <b>20 sixes</b>. Some wobble around 10 is normal even for a fair die. The question is whether this much wobble is normal.</>,
    gap: <>The red lines are the <b>gaps O − E</b>: −5, −2, −1, −2, 0, +10. Positive and negative gaps would cancel if we just added them, so the chi-square test <b>squares</b> each gap first.</>,
    face: cur >= 0 ? <>Face {cur + 1}: (O − E)² ÷ E = ({DIE_OBS[cur]} − 10)² ÷ 10 = <b>{parts[cur].toFixed(1)}</b>. Dividing by E puts the gap on a "surprise" scale: a gap of 5 is a big deal when you expected 10, small if you expected 1,000. The bar below grows to <b>χ² = {run.toFixed(1)}</b> so far.</> : <></>,
    total: <>Add the six contributions: 2.5 + 0.4 + 0.1 + 0.4 + 0 + 10.0 = <b>χ² = {chi.toFixed(1)}</b>. Notice the sixes alone supply <b>10.0</b> of it. But is 13.4 big? We need to know what scores a <b>fair</b> die produces.</>,
    sim: <>So we simulate <b>2,000 perfectly fair dice</b>, each rolled 60 times, and compute χ² for each (blue histogram). Fair dice usually score between about 1 and 10, because chance alone creates small gaps.</>,
    curve: <>The yellow curve is the <b>chi-square distribution with df = 6 − 1 = 5</b>. It matches the simulation, so in practice we use the curve instead of simulating. Only 5 of the 6 gaps are free: once five counts are known, the sixth is fixed by the total of 60.</>,
    cut: <>(The histogram is hidden so the tail is visible.) The red zone holds the <b>top 5%</b> of fair-die scores: χ² above <b>{crit.toFixed(2)}</b>. A fair die lands there only 1 time in 20.</>,
    land: <>Our score of <b>{chi.toFixed(1)}</b> lands inside the red zone. The gold tail area beyond it is the <b>p-value = {pval.toFixed(3)}</b>: only about 2% of fair dice would look this lopsided. (In the simulation, {(simOver * 100).toFixed(1)}% did.)</>,
    verdict: <><b>Reject "the die is fair"</b> at the 5% level. And the contributions tell you <b>why</b>: face 6 gives 10.0 of the 13.4. Always look at which cells drive χ², not just the p-value.</>,
  };

  return (
    <div>
      <Layout
        main={<>
          <div className="small muted">Counts per face: observed (blue) vs expected if fair (dashed green)</div>
          <Plot x={[0.4, 6.6]} y={[0, 27]} height={230} xLabel="die face" yLabel="count" xTicks={6} fx={(v) => (Number.isInteger(v) ? String(v) : '')}>
            {(s) => <>
              {showO && <Bars s={s} data={FACES.map((x, i) => ({ x, y: DIE_OBS[i] }))} width={0.55} color={(i) => (i === cur ? C.gold : C.blue)} />}
              {FACES.map((x) => <Seg key={x} s={s} x1={x - 0.36} x2={x + 0.36} y1={10} y2={10} color={C.green} width={2.5} dash="6 4" />)}
              {showGap && FACES.map((x, i) => DIE_OBS[i] !== 10 && <Seg key={'g' + x} s={s} x1={x + 0.33} x2={x + 0.33} y1={10} y2={DIE_OBS[i]} color={C.red} width={3} />)}
              {showO && FACES.map((x, i) => <Label key={'o' + x} s={s} x={x} y={DIE_OBS[i] - 1.6} anchor="middle" color={C.bg} size={12}>{DIE_OBS[i]}</Label>)}
              {showGap && FACES.map((x, i) => <Label key={'d' + x} s={s} x={x + 0.38} y={(10 + DIE_OBS[i]) / 2} color={C.red} size={11}>{DIE_OBS[i] - 10 > 0 ? '+' : ''}{DIE_OBS[i] - 10 || ''}</Label>)}
              {k > 0 && FACES.slice(0, k).map((x, i) => <Label key={'c' + x} s={s} x={x} y={25} anchor="middle" color={i === cur ? C.gold : C.red} size={12}>+{parts[i].toFixed(1)}</Label>)}
            </>}
          </Plot>
          <div className="small muted" style={{ marginTop: 8 }}>{lowerMode ? 'Where does χ² = 13.4 fall among fair dice?' : 'χ² builds up, one face at a time'}</div>
          <Plot x={[0, 20]} y={[-0.045, 0.19]} height={230} xLabel="χ² value" fy={() => ''} yTicks={4}>
            {(s) => <>
              {lowerMode && !at('cut') && <Bars s={s} data={simH} width={0.45} color={C.blue} />}
              {at('cut') && <Region s={s} x0={crit} x1={20} y0={0} y1={0.006} color={C.red} opacity={0.6} />}
              {at('land') && <Region s={s} x0={chi} x1={20} y0={0} y1={0.006} color={C.gold} opacity={0.9} />}
              {at('land') && <Label s={s} x={16.5} y={0.035} anchor="middle" color={C.gold} size={12}>gold tail = p = {pval.toFixed(3)}</Label>}
              {at('curve') && <FnLine s={s} f={chi2pdf(df)} from={0.01} color={C.yellow} width={3} />}
              {at('cut') && <FnLine s={s} f={chi2pdf(df)} from={crit} to={20} color={C.red} width={0.1} fill={C.red} />}
              {at('land') && <FnLine s={s} f={chi2pdf(df)} from={chi} to={20} color={C.gold} width={0.1} fill={C.gold} />}
              {at('cut') && <><Seg s={s} x1={crit} x2={crit} y1={0} y2={0.13} color={C.red} dash="4 3" /><Label s={s} x={crit - 0.2} y={0.14} anchor="end" color={C.red} size={12}>5% cut-off {crit.toFixed(2)}</Label></>}
              {segs.slice(0, k).map((g) => g.x1 > g.x0 && <Region key={g.i} s={s} x0={g.x0} x1={g.x1} y0={-0.035} y1={-0.01} color={g.i === cur ? C.gold : SEG[g.i % 2]} opacity={0.85} />)}
              {segs.slice(0, k).map((g) => g.x1 - g.x0 > 0.9 && <Label key={'l' + g.i} s={s} x={(g.x0 + g.x1) / 2} y={-0.028} anchor="middle" color={C.bg} size={11}>{g.i + 1}</Label>)}
              {k > 0 && <Label s={s} x={run + 0.25} y={-0.028} color={C.text} size={12}>χ² = {run.toFixed(1)}</Label>}
              {at('land') && <><Seg s={s} x1={chi} x2={chi} y1={-0.01} y2={0.12} color={C.gold} width={3} /><Label s={s} x={chi + 0.25} y={0.1} color={C.gold} size={13}>our die: {chi.toFixed(1)}</Label></>}
            </>}
          </Plot>
        </>}
        side={<>
          <Readout items={[
            ['face', cur >= 0 ? cur + 1 : '–', C.gold],
            ['(O − E)² ÷ E', cur >= 0 ? parts[cur].toFixed(1) : '–', C.red],
            ['χ² so far', k ? run.toFixed(1) : '–', C.red],
            ['degrees of freedom', at('curve') ? df : '–'],
            ['5% cut-off', at('cut') ? crit.toFixed(2) : '–'],
            ['p-value', at('land') ? pval.toFixed(3) : '–', C.gold],
          ]} />
          <Legend items={[['observed O', C.blue], ['expected E', C.green], ['gap / contribution', C.red], ['chi-square curve', C.yellow], ['our statistic', C.gold]]} />
          <p className="small muted" style={{ margin: 0 }}>χ² = Σ (O − E)² ÷ E. Each face adds its own "surprise"; the total is compared with what fair dice produce.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caption[f.stage]}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
function Playground() {
  const [p6, setP6] = useState(0.25);
  const [n, setN] = useState(60);
  const [seed, setSeed] = useState(1);
  const [showNull, setShowNull] = useState(false);
  const obs = useMemo(() => rollDie(n, p6, rng(seed * 7919 + n)), [n, p6, seed]);
  const E = Array(6).fill(n / 6);
  const parts = contrib(obs, E), chi = total(parts), pval = chi2sf(chi, 5), crit = chi2crit(0.05, 5);
  const sims = useMemo(() => (showNull ? nullScores(n, 1000, seed + 99) : []), [showNull, n, seed]);
  const xMax = 30, off = chi > xMax - 1, chiX = off ? xMax - 1.5 : chi;
  const simH = sims.length ? histCounts(sims, 0, xMax, 40).map((d) => ({ x: d.x, y: d.y / (sims.length * (xMax / 40)) })) : [];
  const yTop = Math.max(...obs, n / 6) * 1.25;
  const worst = parts.indexOf(Math.max(...parts));
  return (
    <Layout
      main={<>
        <Plot x={[0.4, 6.6]} y={[0, yTop]} height={220} xLabel="die face" yLabel="count" xTicks={6} fx={(v) => (Number.isInteger(v) ? String(v) : '')}>
          {(s) => <>
            <Bars s={s} data={FACES.map((x, i) => ({ x, y: obs[i] }))} width={0.55} color={(i) => (i === worst ? C.gold : C.blue)} />
            {FACES.map((x) => <Seg key={x} s={s} x1={x - 0.36} x2={x + 0.36} y1={n / 6} y2={n / 6} color={C.green} width={2.5} dash="6 4" />)}
            {FACES.map((x, i) => <Label key={'c' + x} s={s} x={x} y={yTop * 0.93} anchor="middle" color={i === worst ? C.gold : C.red} size={12}>+{parts[i].toFixed(1)}</Label>)}
          </>}
        </Plot>
        <Plot x={[0, xMax]} y={[0, 0.19]} height={230} xLabel="χ² value (df = 5)" fy={() => ''} yTicks={4}>
          {(s) => <>
            {simH.length > 0 && <Bars s={s} data={simH} width={(xMax / 40) * 0.9} color={C.blue} />}
            <FnLine s={s} f={chi2pdf(5)} from={0.01} color={C.yellow} width={3} />
            <Region s={s} x0={crit} x1={xMax} y0={0} y1={0.006} color={C.red} opacity={0.6} />
            <Label s={s} x={crit + 4} y={0.02} color={C.red} size={11}>top 5% of fair dice</Label>
            {!off && <Seg s={s} x1={chiX} x2={chiX} y1={0} y2={0.15} color={C.gold} width={3} />}
            {off && <Arrow s={s} x1={xMax - 6} y1={0.12} x2={xMax - 0.3} y2={0.12} color={C.gold} />}
            <Label s={s} x={off ? xMax - 0.5 : Math.min(chiX + 0.3, xMax - 6)} y={0.16} anchor={off ? 'end' : 'start'} color={C.gold}>χ² = {chi.toFixed(1)}{off ? ' (off the chart →)' : ''}</Label>
          </>}
        </Plot>
      </>}
      side={<>
        <Slider label="P(six)" min={0.1} max={0.45} step={0.01} value={p6} onChange={setP6} format={(v) => v.toFixed(2) + (Math.abs(v - 1 / 6) < 0.006 ? ' (fair)' : '')} />
        <Slider label="number of rolls" min={30} max={1200} step={30} value={n} onChange={setN} />
        <Toggle label="Show 1,000 fair-die χ² scores" value={showNull} onChange={setShowNull} />
        <button className="btn" onClick={() => setSeed(seed + 1)}>🎲 Roll again</button>
        <Readout items={[['χ²', chi.toFixed(2), C.gold], ['p-value', fmtP(pval), pval < 0.05 ? C.red : C.green], ['verdict', pval < 0.05 ? 'loaded?' : 'looks fair', pval < 0.05 ? C.red : C.green], ['biggest cell', `face ${worst + 1}`, C.gold]]} />
        <p className="small muted" style={{ margin: 0 }}>Set P(six) to 0.17 (fair) and roll again a few times: about 1 roll in 20 still lands in the red zone. That is the 5% false-alarm rate. A slightly loaded die (0.22) is hard to catch with 60 rolls but obvious with 1,200.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'A die is rolled **60 times**. We compare **observed** counts with the **expected** 10 per face, turn each gap into a contribution **(O − E)² ÷ E**, add them into **χ²**, and see where χ² lands on the chi-square curve.', steps: [
      { do: 'Step through the first three frames.', notice: 'Expected counts (green) vs observed (blue), then the red gaps. Face 6 is far off.' },
      { do: 'Keep stepping through faces 1 to 6.', notice: 'The bar at the bottom grows with each face\'s contribution; face 6 adds **10.0** of the final **13.4**.' },
      { do: 'Play to the end.', notice: 'Simulated fair dice match the yellow chi-square curve (df = 5); 13.4 lands past the 5% cut-off (11.07), **p ≈ 0.020**.' },
    ] },
    Playground: { what: 'Roll a die you can **load** and watch χ² and the p-value respond.', steps: [
      { do: 'Set **P(six) ≈ 0.17** (fair) and press **Roll again** ten times.', notice: 'χ² usually sits in the hump; now and then it lands in the red zone by pure chance (a false alarm).' },
      { do: 'Set P(six) = 0.22 and compare **60** with **1,200 rolls**.', notice: 'With 60 rolls the slight bias is usually missed; with 1,200 rolls χ² is huge. More data detects smaller effects.' },
      { do: 'Tick **Show 1,000 fair-die χ² scores**.', notice: 'The blue histogram of simulated fair dice follows the yellow curve: the curve *is* the "fair die" world.' },
    ] },
  },
};
export default anim;
