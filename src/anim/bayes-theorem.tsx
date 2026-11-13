// Bayes' theorem: a natural-frequency grid of 10,000 people splitting into true/false positives (base-rate fallacy), sequential updating, and prior × likelihood → posterior.
import { ReactNode, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Bars, Label, Region, Seg, Caption, Readout, Slider, Choice, Layout, Legend, useStepPlayer, PlayerControls, C, Scales } from '../viz/kit';
import { pct } from './_stats2-helpers';

/* ---------- pure helpers ---------- */
// g-stats2 medical test: prevalence 1%, sensitivity 99%, false-positive rate 5%.
type Cat = 'tp' | 'fn' | 'fp' | 'tn' | 'sick' | 'healthy' | 'all';
const COLS = 125, ROWS = 80; // 10,000 people
interface Counts { sick: number; tp: number; fn: number; fp: number; tn: number }
function crowd(N: number, prev: number, sens: number, fpr: number): Counts {
  const sick = Math.round(N * prev), tp = Math.round(sick * sens), healthy = N - sick, fp = Math.round(healthy * fpr);
  return { sick, tp, fn: sick - tp, fp, tn: healthy - fp };
}
/** Posterior after one positive test. */
const post = (prior: number, sens: number, fpr: number) => (sens * prior) / (sens * prior + fpr * (1 - prior));
/** Category of cell i (column-major) for a given stage: sick people first, then false positives, then the rest. */
function catOf(i: number, c: Counts, stage: 'all' | 'sick' | 'tested'): Cat {
  if (stage === 'all') return 'all';
  if (i < c.sick) return stage === 'sick' ? 'sick' : i < c.tp ? 'tp' : 'fn';
  if (stage === 'sick') return 'healthy';
  return i < c.sick + c.fp ? 'fp' : 'tn';
}
const FILL: Record<Cat, string> = { all: C.grey, sick: C.red, healthy: '#2a3140', tp: C.red, fn: '#7a3a36', fp: C.gold, tn: '#2a3140' };
/** One SVG path per colour: cheap way to draw thousands of cells. */
function Grid({ s, n, cols, cat, x0 = 0, y0 = 0, w, h }: { s: Scales; n: number; cols: number; cat: (i: number) => Cat; x0?: number; y0?: number; w: number; h: number }) {
  const rows = Math.ceil(n / cols), cw = w / cols, ch = h / rows, paths: Record<string, string> = {};
  const pxW = Math.abs(s.sx(cw) - s.sx(0)), pxH = Math.abs(s.sy(ch) - s.sy(0)), gap = Math.min(1, pxW * 0.25);
  for (let i = 0; i < n; i++) {
    const col = Math.floor(i / rows), row = i % rows, fill = FILL[cat(i)];
    const X = s.sx(x0 + col * cw), Y = s.sy(y0 + h - row * ch);
    paths[fill] = (paths[fill] ?? '') + `M${X.toFixed(1)},${Y.toFixed(1)}h${(pxW - gap).toFixed(2)}v${(pxH - gap).toFixed(2)}h${(-(pxW - gap)).toFixed(2)}z`;
  }
  return <>{Object.entries(paths).map(([fill, d]) => <path key={fill} d={d} fill={fill} />)}</>;
}

/* ---------- Animate ---------- */
type Stage = 'crowd' | 'sick' | 'testSick' | 'testHealthy' | 'room' | 'formula' | 'second' | 'climb' | 'rate10' | 'plantPrior' | 'plantLik' | 'plantPost';
const STAGES: Stage[] = ['crowd', 'sick', 'testSick', 'testHealthy', 'room', 'formula', 'second', 'climb', 'rate10', 'plantPrior', 'plantLik', 'plantPost'];
const PLANTS = ['A', 'B', 'C'], PRIOR = [0.5, 0.3, 0.2], DEFECT = [0.01, 0.02, 0.05];

function Animate() {
  const p = useStepPlayer(STAGES.length, 2000);
  const st = STAGES[p.i];
  const at = (x: Stage) => STAGES.indexOf(x) <= p.i;
  const c = crowd(10000, 0.01, 0.99, 0.05), pos = c.tp + c.fp, P1 = c.tp / pos;
  const P2 = post(P1, 0.99, 0.05), P3 = post(P2, 0.99, 0.05);
  const c10 = crowd(10000, 0.1, 0.99, 0.05), P10 = c10.tp / (c10.tp + c10.fp);
  const joint = PRIOR.map((q, i) => q * DEFECT[i]), tot = joint.reduce((a, b) => a + b, 0), postPl = joint.map((j) => j / tot);
  const gridStage: 'all' | 'sick' | 'tested' = st === 'crowd' ? 'all' : st === 'sick' ? 'sick' : 'tested';
  const showHealthyTest = at('testHealthy');
  const cc = st === 'rate10' ? c10 : c;
  const cat = (i: number): Cat => { const k = catOf(i, cc, gridStage); if (!showHealthyTest && k === 'tn') return 'healthy'; return k; };
  const isPlant = st.startsWith('plant'), isClimb = st === 'climb';
  // second test: of the 594 positives, ~98 sick and ~25 healthy test positive again
  const tp2 = Math.round(c.tp * 0.99), fp2 = Math.round(c.fp * 0.05);
  const cap: Record<Stage, ReactNode> = {
    crowd: <>A disease affects <b>1%</b> of people. A test catches <b>99%</b> of sick people but also flags <b>5%</b> of healthy people. You test positive. How likely are you to be sick? Most people guess about 95%. Let's count, with <b>10,000 people</b> (each square is one person).</>,
    sick: <><b>1% are sick: 100 people</b> (red column on the left). The other <b>9,900</b> are healthy. That imbalance is the <b>base rate</b>, and it will decide everything.</>,
    testSick: <>Test the 100 sick people: <b>99 test positive</b> (bright red, true positives) and 1 is missed (dark red, a false negative).</>,
    testHealthy: <>Test the 9,900 healthy people: 5% of them, <b>495 people, test positive anyway</b> (gold, false positives). A small error rate applied to a huge group makes a big number.</>,
    room: <>Put everyone who tested positive in one room (lower chart): <b>99 sick + 495 healthy = 594</b>. Only 99 of the 594 are sick: <b>P(sick | positive) = 99 ÷ 594 = {pct(P1)}</b>. Not 95%!</>,
    formula: <>That count <i>is</i> Bayes' theorem: P(sick | +) = P(+ | sick) × P(sick) ÷ P(+) = 0.99 × 0.01 ÷ (0.99 × 0.01 + 0.05 × 0.99) = <b>{pct(P1)}</b>. Numerator = the 99 true positives, denominator = all 594 positives.</>,
    second: <>Everyone in the positive room takes a <b>second, independent test</b>. About {tp2} of the 99 sick test positive again, but only about {fp2} of the 495 healthy do. New answer: {tp2} ÷ {tp2 + fp2} ≈ <b>{pct(P2)}</b>. Yesterday's posterior was today's prior.</>,
    climb: <>Belief climbs with each positive result: <b>1% → {pct(P1)} → {pct(P2)} → {pct(P3)}</b>. Each positive multiplies the odds by the likelihood ratio 0.99 ÷ 0.05 = 19.8.</>,
    rate10: <>Change only the base rate: if <b>10%</b> of people were sick (1,000 red), there are 990 true and 450 false positives, so one positive gives <b>{pct(P10)}</b>. <b>Same test, very different meaning.</b> Ignoring this is the base-rate fallacy.</>,
    plantPrior: <>Same logic with three causes. A part comes from plant A (50% of parts), B (30%) or C (20%). These shares are the <b>prior</b>: before looking at the part, A is most likely.</>,
    plantLik: <>Evidence: the part is <b>defective</b>. Defect rates (likelihoods) are 1%, 2% and 5%. Multiply prior × likelihood for each plant: 0.005, 0.006, 0.010 (gold). Plant C's bar is now the tallest. These add to 0.021, the overall defect rate.</>,
    plantPost: <>Divide by the total (0.021) so the bars add to 1: <b>posterior A {pct(postPl[0])}, B {pct(postPl[1])}, C {pct(postPl[2])}</b>. Plant C makes only a fifth of the parts but is the likeliest source of this defect.</>,
  };
  const roomCols = 33;
  return (
    <div>
      <Layout
        main={isPlant || isClimb ? (
          <Plot x={isClimb ? [0.4, 4.6] : [0.4, 3.6]} y={[0, isClimb ? 1.08 : st === 'plantLik' ? 0.012 : 0.6]} height={460} xTicks={isClimb ? 4 : 3} yLabel={isClimb ? 'P(sick)' : st === 'plantLik' ? 'prior × likelihood' : 'probability'}
            fx={(v) => (Number.isInteger(v) ? (isClimb ? ['', 'before test', '1 positive', '2 positives', '3 positives'][v] ?? '' : `plant ${PLANTS[v - 1] ?? ''}`) : '')} fy={(v) => (st === 'plantLik' ? v.toFixed(3) : pct(v, 0))}>
            {(s) => isClimb ? <>
              <Bars s={s} data={[0.01, P1, P2, P3].map((v, i) => ({ x: i + 1, y: v }))} width={0.55} color={(i) => (i === 0 ? C.grey : C.red)} />
              {[0.01, P1, P2, P3].map((v, i) => <Label key={i} s={s} x={i + 1} y={v + 0.03} anchor="middle" color={C.text} size={14}>{pct(v)}</Label>)}
            </> : <>
              {st === 'plantPrior' && <Bars s={s} data={PRIOR.map((v, i) => ({ x: i + 1, y: v }))} width={0.5} color={C.blue} />}
              {st === 'plantPrior' && PRIOR.map((v, i) => <Label key={i} s={s} x={i + 1} y={v + 0.02} anchor="middle" size={14}>prior {pct(v, 0)}</Label>)}
              {st === 'plantLik' && <>
                <Bars s={s} data={joint.map((v, i) => ({ x: i + 1, y: v }))} width={0.5} color={C.gold} />
                {joint.map((v, i) => <Label key={'b' + i} s={s} x={i + 1} y={v + 0.0004} anchor="middle" size={13} color={C.gold}>{pct(PRIOR[i], 0)} × {pct(DEFECT[i], 0)} = {v.toFixed(3)}</Label>)}
              </>}
              {st === 'plantPost' && <>
                <Bars s={s} data={PRIOR.map((v, i) => ({ x: i + 0.82, y: v }))} width={0.32} color={C.blue} />
                <Bars s={s} data={postPl.map((v, i) => ({ x: i + 1.18, y: v }))} width={0.32} color={C.green} />
                {PRIOR.map((v, i) => <Label key={'a' + i} s={s} x={i + 0.82} y={v + 0.02} anchor="middle" size={12} color={C.blue}>{pct(v, 0)}</Label>)}
                {postPl.map((v, i) => <Label key={'b' + i} s={s} x={i + 1.18} y={v + 0.02} anchor="middle" size={13} color={C.green}>{pct(v)}</Label>)}
              </>}
            </>}
          </Plot>
        ) : <>
          <div className="small muted">{st === 'rate10' ? '10,000 people if 10% were sick' : '10,000 people, one square each'}</div>
          <Plot x={[0, COLS]} y={[0, ROWS]} height={300} fx={() => ''} fy={() => ''} grid={false} xTicks={2} yTicks={2}>
            {(s) => <Grid s={s} n={10000} cols={COLS} cat={cat} w={COLS} h={ROWS} />}
          </Plot>
          <div className="small muted" style={{ marginTop: 6 }}>{at('room') ? (st === 'second' ? 'The positive room after a second test (bright = positive again)' : 'The "positive room": everyone who tested positive') : 'The positive room fills once everyone is tested'}</div>
          <Plot x={[0, 100]} y={[0, 20]} height={170} fx={() => ''} fy={() => ''} grid={false} xTicks={2} yTicks={2}>
            {(s) => at('room') ? <>
              {(() => { const pp = st === 'rate10' ? c10.tp + c10.fp : pos, tpN = st === 'rate10' ? c10.tp : c.tp, cols = st === 'rate10' ? 60 : roomCols, wPx = st === 'rate10' ? 72 : 60;
                const catR = (i: number): Cat => (st === 'second' ? (i < tpN ? (i < tp2 ? 'tp' : 'fn') : (i - tpN < fp2 ? 'fp' : 'tn')) : i < tpN ? 'tp' : 'fp');
                return <><Grid s={s} n={pp} cols={cols} cat={catR} w={wPx} h={18} x0={1} y0={1} />
                  <Label s={s} x={wPx + 3} y={13} color={C.red} size={14}>{st === 'second' ? `${tp2} sick` : `${tpN} sick`}</Label>
                  <Label s={s} x={wPx + 3} y={8} color={C.gold} size={14}>{st === 'second' ? `${fp2} healthy` : `${pp - tpN} healthy`}</Label>
                  <Label s={s} x={wPx + 3} y={3} color={C.text} size={14}>→ {pct(st === 'second' ? P2 : st === 'rate10' ? P10 : P1)} sick</Label></>; })()}
            </> : <Label s={s} x={50} y={10} anchor="middle" color={C.muted} size={13}>(empty for now)</Label>}
          </Plot>
        </>}
        side={<>
          <Readout items={isPlant ? [
            ['prior A / B / C', '50 / 30 / 20%', C.blue],
            ['defect rates', '1 / 2 / 5%'],
            ['P(defect)', at('plantLik') ? tot.toFixed(3) : '–'],
            ['posterior A / B / C', st === 'plantPost' ? postPl.map((v) => (100 * v).toFixed(1)).join(' / ') + '%' : '–', C.green],
          ] : [
            ['sick (prior)', st === 'rate10' ? '1,000 (10%)' : '100 (1%)', C.red],
            ['true positives', at('testSick') ? cc.tp : '–', C.red],
            ['false positives', at('testHealthy') ? cc.fp.toLocaleString('en-IN') : '–', C.gold],
            ['all positives', at('room') ? (cc.tp + cc.fp).toLocaleString('en-IN') : '–'],
            ['P(sick | +)', at('room') ? pct(st === 'rate10' ? P10 : P1) : '–', C.green],
            ['after 2nd positive', at('second') && st !== 'rate10' ? pct(P2) : '–', C.green],
          ]} />
          {isPlant ? <Legend items={[['prior', C.blue], ['prior × likelihood', C.gold], ['posterior', C.green]]} /> : <Legend items={[['sick, test + (true positive)', C.red], ['sick, test − (missed)', '#7a3a36'], ['healthy, test + (false positive)', C.gold], ['healthy, test −', '#2a3140']]} />}
          <p className="small muted" style={{ margin: 0 }}>Posterior ∝ likelihood × prior. Counting people (natural frequencies) makes the theorem obvious: of all the ways to see the evidence, what share come from the hypothesis?</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{cap[st]}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
const PREVS = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.3, 0.5];
function Playground() {
  const [pi, setPi] = useState(3);
  const [sens, setSens] = useState(0.99);
  const [fpr, setFpr] = useState(0.05);
  const [tests, setTests] = useState<1 | 2 | 3>(1);
  const prev = PREVS[pi];
  const c = crowd(10000, prev, sens, fpr);
  let P = prev; for (let k = 0; k < tests; k++) P = post(P, sens, fpr);
  const P1 = post(prev, sens, fpr);
  const npv = (c.tn) / (c.tn + c.fn || 1);
  const curve = (x: number) => post(x, sens, fpr);
  return (
    <Layout
      main={<>
        <div className="small muted">10,000 people: red = sick &amp; positive, dark red = sick &amp; missed, gold = healthy but positive</div>
        <Plot x={[0, COLS]} y={[0, ROWS]} height={280} fx={() => ''} fy={() => ''} grid={false} xTicks={2} yTicks={2}>
          {(s) => <Grid s={s} n={10000} cols={COLS} cat={(i) => catOf(i, c, 'tested')} w={COLS} h={ROWS} />}
        </Plot>
        <Plot x={[0, 0.5]} y={[0, 1]} height={210} xLabel="prevalence (base rate)" yLabel="P(sick | one positive)" fx={(v) => pct(v, 0)} fy={(v) => pct(v, 0)}>
          {(s) => <>
            <path d={Array.from({ length: 201 }, (_, i) => { const x = (0.5 * i) / 200; return `${i ? 'L' : 'M'}${s.sx(x)},${s.sy(curve(x))}`; }).join('')} fill="none" stroke={C.yellow} strokeWidth={2.5} />
            <Seg s={s} x1={prev} x2={prev} y1={0} y2={P1} color={C.green} dash="4 3" />
            <Region s={s} x0={prev - 0.003} x1={prev + 0.003} y0={P1 - 0.02} y1={P1 + 0.02} color={C.green} opacity={1} />
            <Label s={s} x={Math.min(prev + 0.01, 0.4)} y={Math.max(0.08, P1 - 0.08)} color={C.green} size={12}>{pct(prev, prev < 0.01 ? 1 : 0)} → {pct(P1)}</Label>
          </>}
        </Plot>
      </>}
      side={<>
        <Slider label="prevalence" min={0} max={PREVS.length - 1} value={pi} onChange={setPi} format={(i) => pct(PREVS[i], PREVS[i] < 0.01 ? 1 : 0)} />
        <Slider label="sensitivity P(+ | sick)" min={0.5} max={1} step={0.01} value={sens} onChange={setSens} format={(v) => pct(v, 0)} />
        <Slider label="false-positive rate P(+ | healthy)" min={0.005} max={0.2} step={0.005} value={fpr} onChange={setFpr} format={(v) => pct(v)} />
        <Choice label="Positive tests in a row" value={tests} onChange={setTests} options={[{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '3' }]} />
        <Readout items={[['sick people', c.sick.toLocaleString('en-IN'), C.red], ['true positives', c.tp.toLocaleString('en-IN'), C.red], ['false positives', c.fp.toLocaleString('en-IN'), C.gold], [`P(sick | ${tests} positive${tests > 1 ? 's' : ''})`, pct(P), C.green], ['P(healthy | negative)', pct(npv, 2)], ['likelihood ratio', (sens / fpr).toFixed(1)]]} />
        <p className="small muted" style={{ margin: 0 }}>The yellow curve shows how the meaning of one positive depends on the base rate. Rare conditions make even good tests produce mostly false alarms; a second positive fixes much of it.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'The medical test from the chapter (1% prevalence, 99% sensitivity, 5% false positives) shown as **10,000 people**. We split them into true and false positives, then update beliefs with a second test and with the three-plant defect example.', steps: [
      { do: 'Step through the first five frames.', notice: '100 sick → 99 true positives; 9,900 healthy → **495 false positives**. In the positive room only 99 of 594 are sick: **16.7%**.' },
      { do: 'Continue through "second test" and the climbing bars.', notice: 'Posterior becomes the next prior: 1% → 16.7% → 79.8% → 98.8%.' },
      { do: 'Watch the plant frames.', notice: 'Prior (blue) × likelihood gives gold bars; normalising gives the posterior (green): plant C rises from 20% to **47.6%**.' },
    ] },
    Playground: { what: 'Change the base rate and the test\'s accuracy and watch the crowd and **P(sick | positive)** respond.', steps: [
      { do: 'Drag **prevalence** down to 0.1%.', notice: 'Gold false positives swamp the red true positives; P(sick | +) falls to about 2%.' },
      { do: 'Lower the **false-positive rate** to 0.5%.', notice: 'Far fewer gold squares: specificity matters most when the condition is rare.' },
      { do: 'Choose **2** or **3** positive tests in a row.', notice: 'Repeated independent evidence lifts the posterior quickly.' },
    ] },
  },
};
export default anim;
