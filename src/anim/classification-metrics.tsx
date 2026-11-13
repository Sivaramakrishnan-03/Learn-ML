// Classification metrics: a probability threshold slides down over sorted scores; the confusion matrix, precision/recall
// and the ROC curve update point by point. Playground: two score distributions, prevalence and threshold.
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Dots, Seg, Label, Caption, Readout, Slider, Layout, Legend, MatrixView, useStepPlayer, PlayerControls, rng, gauss, C, Scales } from '../viz/kit';
import { histogram } from '../viz/math';

/* ---------- pure helpers ---------- */
const POS = C.purple, NEG = C.blue; // actual churned / actually stayed
type Case = { p: number; y: 0 | 1 };
function confusion(cases: Case[], t: number) {
  let tp = 0, fp = 0, fn = 0, tn = 0;
  cases.forEach((c) => { const flag = c.p >= t; if (flag && c.y) tp++; else if (flag) fp++; else if (c.y) fn++; else tn++; });
  const P = tp + fn, N = fp + tn;
  const precision = tp + fp ? tp / (tp + fp) : NaN, recall = P ? tp / P : 0, fpr = N ? fp / N : 0;
  const f1 = isFinite(precision) && precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  return { tp, fp, fn, tn, precision, recall, fpr, f1, acc: (tp + tn) / cases.length };
}
/** ROC points from the highest threshold to the lowest (one step per distinct score). */
function roc(cases: Case[]) {
  const sorted = [...cases].sort((a, b) => b.p - a.p);
  const P = cases.filter((c) => c.y).length || 1, N = cases.length - P || 1;
  const out = [{ x: 0, y: 0, t: Infinity }];
  let tp = 0, fp = 0;
  sorted.forEach((c, i) => { if (c.y) tp++; else fp++; if (i === sorted.length - 1 || sorted[i + 1].p !== c.p) out.push({ x: fp / N, y: tp / P, t: c.p }); });
  return out;
}
const auc = (pts: { x: number; y: number }[]) => pts.slice(1).reduce((s, q, i) => s + (q.x - pts[i].x) * (q.y + pts[i].y) / 2, 0);
const pct = (v: number) => (isFinite(v) ? (v * 100).toFixed(0) + '%' : '–');

function Confusion({ m }: { m: ReturnType<typeof confusion> }) {
  return <MatrixView title="Confusion matrix (rows = what really happened)"
    data={[[`TP ${m.tp}`, `FN ${m.fn}`], [`FP ${m.fp}`, `TN ${m.tn}`]]} rowLabels={['actual: yes', 'actual: no']} colLabels={['flagged', 'not flagged']}
    cellColor={(r, c) => (r === c ? 'rgba(131,193,103,0.25)' : 'rgba(252,98,85,0.25)')} />;
}
function RocPlot({ pts, upto, cur, shade, height = 300, width = 380 }: { pts: { x: number; y: number }[]; upto: number; cur?: { x: number; y: number }; shade?: boolean; height?: number; width?: number }) {
  const shown = pts.slice(0, upto + 1);
  const d = (s: Scales) => shown.map((q, i) => `${i ? 'L' : 'M'}${s.sx(q.x)},${s.sy(q.y)}`).join('');
  return (
    <Plot x={[0, 1]} y={[0, 1]} height={height} width={width} xLabel="false positive rate (FPR)" yLabel="true positive rate (recall)" xTicks={5} yTicks={5}>
      {(s) => <>
        <Seg s={s} x1={0} y1={0} x2={1} y2={1} color={C.grey} dash="5 5" />
        {shade && shown.length > 1 && <path d={`${d(s)}L${s.sx(shown[shown.length - 1].x)},${s.sy(0)}L${s.sx(0)},${s.sy(0)}Z`} fill={C.green} opacity={0.2} />}
        {shown.length > 1 && <path d={d(s)} fill="none" stroke={C.yellow} strokeWidth={2.5} />}
        {shown.length < 40 && <Dots s={s} pts={shown} color={C.yellow} r={3.5} animate={false} />}
        {cur && <circle cx={s.sx(cur.x)} cy={s.sy(cur.y)} r={7} fill="none" stroke={C.gold} strokeWidth={2.5} />}
      </>}
    </Plot>
  );
}

/* ---------- Animate (ten churn customers from the lesson) ---------- */
const CUST: Case[] = [[0.95, 1], [0.85, 1], [0.8, 0], [0.7, 1], [0.6, 0], [0.45, 1], [0.4, 0], [0.3, 1], [0.2, 0], [0.1, 0]].map(([p, y]) => ({ p, y: y as 0 | 1 }));
const THRESH = [1.0, 0.9, 0.82, 0.75, 0.65, 0.5, 0.42, 0.35, 0.25, 0.15, 0.05];

function Animate() {
  const curve = useMemo(() => roc(CUST), []);
  const A = auc(curve);
  const frames = [{ t: 1.0, intro: true }, ...THRESH.map((t) => ({ t, intro: false })), { t: 0.05, intro: false, auc: true }];
  const p = useStepPlayer(frames.length, 1700);
  const f = frames[p.i] as { t: number; intro: boolean; auc?: boolean };
  const m = confusion(CUST, f.t);
  const step = THRESH.indexOf(f.t); // ROC point index = number of customers flagged
  const last = step > 0 ? CUST[step - 1] : undefined;
  const tag = (c: Case) => (c.p >= f.t ? (c.y ? 'TP' : 'FP') : c.y ? 'FN' : 'TN');
  const tagCol = (c: Case) => ({ TP: C.green, TN: C.green, FP: C.red, FN: C.red }[tag(c)]);
  let cap: React.ReactNode;
  if (f.intro) cap = <>Ten customers, each with the model's <b>predicted probability of churning</b> (x-axis). Top row: the 5 who <b style={{ color: POS }}>really churned</b>; bottom row: the 5 who <b style={{ color: NEG }}>stayed</b>. A classifier needs a <b>threshold</b>: flag everyone at or above it. We start at 1.0, flagging nobody.</>;
  else if (f.auc) cap = <>The finished ROC curve. The <b style={{ color: C.green }}>shaded area, AUC = {A.toFixed(2)}</b>, is the chance that a random churner gets a higher score than a random stayer (19 of 25 pairs). AUC judges the <i>ranking</i> and ignores the threshold; precision and recall depend on where you put it.</>;
  else if (step === 0) cap = <>Threshold 1.0: nobody flagged. TP = 0, so recall = 0, and FPR = 0. Accuracy is already <b>{pct(m.acc)}</b> just by saying "no" to everyone. The ROC curve starts at the bottom-left corner.</>;
  else if (f.t === 0.5) cap = <>The usual default, <b>threshold 0.5</b>: five flagged, 3 churners caught (TP) and 2 false alarms (FP); 2 churners missed (FN). <b>Precision = 3/5 = 60%, recall = 3/5 = 60%</b>, F1 = 0.60, accuracy 60%.</>;
  else if (f.t === 0.35) cap = <>Lower to <b>0.35</b>: also flag 0.45 (churned ✓) and 0.40 (stayed ✗). TP = 4, FP = 3, FN = 1. Precision drops to <b>{pct(m.precision)}</b>, recall rises to <b>{pct(m.recall)}</b>, F1 = {m.f1.toFixed(2)}. Accuracy is still 60%: it cannot see this trade.</>;
  else if (step === THRESH.length - 1) cap = <>Threshold 0.05: everyone flagged. Recall = 100%, but FPR = 100% too, and precision falls to the base rate, <b>50%</b>. The ROC curve ends at the top-right corner.</>;
  else cap = <>Threshold {f.t.toFixed(2)}: the line passes the customer at <b>{last!.p.toFixed(2)}</b>, who {last!.y ? <><b style={{ color: POS }}>churned</b>, so TP rises: the ROC curve steps <b>up</b></> : <><b style={{ color: NEG }}>stayed</b>, so FP rises: the ROC curve steps <b>right</b></>}. Precision {pct(m.precision)}, recall {pct(m.recall)}.</>;
  return (
    <div>
      <Layout
        main={<>
          <Plot x={[0, 1.02]} y={[-0.15, 2.1]} height={230} xLabel="predicted probability of churn" yTicks={0} fy={() => ''} xTicks={10}>
            {(s) => <>
              <rect x={s.sx(Math.min(1.02, f.t))} y={s.sy(2.1)} width={Math.max(0, s.sx(1.02) - s.sx(Math.min(1.02, f.t)))} height={s.sy(-0.15) - s.sy(2.1)} fill={C.yellow} opacity={0.08} />
              <Seg s={s} x1={f.t} x2={f.t} y1={-0.15} y2={2.1} color={C.yellow} width={2.5} />
              <Label s={s} x={Math.min(f.t, 0.97) + 0.012} y={1.95} color={C.yellow} size={12}>flag ≥ {f.t.toFixed(2)} →</Label>
              <Label s={s} x={0.01} y={1.5} color={POS} size={12}>churned</Label>
              <Label s={s} x={0.01} y={0.4} color={NEG} size={12}>stayed</Label>
              <Dots s={s} pts={CUST.map((c) => ({ x: c.p, y: c.y ? 1.2 : 0.2 }))} color={(i) => (CUST[i].y ? POS : NEG)} r={9} />
              {CUST.map((c, i) => <Label key={i} s={s} x={c.p} y={c.y ? 1.55 : 0.55} anchor="middle" size={11} color={C.muted}>{c.p.toFixed(2)}</Label>)}
              {!f.intro && CUST.map((c, i) => <Label key={'t' + i} s={s} x={c.p} y={c.y ? 0.82 : -0.1} anchor="middle" size={12} color={tagCol(c)}>{tag(c)}</Label>)}
            </>}
          </Plot>
          <div className="row" style={{ gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ flex: '1 1 300px', minWidth: 0 }}><RocPlot pts={curve} upto={f.intro ? 0 : Math.max(0, step)} cur={f.intro ? undefined : curve[Math.max(0, step)]} shade={f.auc} height={290} /></div>
            <div style={{ flex: '1 1 260px', minWidth: 0, paddingTop: 8 }}>
              <Confusion m={m} />
              <p className="small muted" style={{ marginTop: 8 }}>Green cells are correct decisions, red cells are mistakes. Precision reads down the "flagged" column; recall reads along the "actual: yes" row.</p>
            </div>
          </div>
        </>}
        side={<>
          <Readout items={[
            ['threshold', f.t.toFixed(2), C.yellow],
            ['precision TP/(TP+FP)', pct(m.precision), C.gold],
            ['recall TP/(TP+FN)', pct(m.recall), C.green],
            ['FPR FP/(FP+TN)', pct(m.fpr), C.red],
            ['F1', m.f1.toFixed(2)],
            ['accuracy', pct(m.acc)],
            ['AUC', f.auc ? A.toFixed(2) : '–', C.green],
          ]} />
          <Legend items={[['actually churned', POS], ['actually stayed', NEG], ['threshold / ROC', C.yellow], ['correct (TP, TN)', C.green], ['mistake (FP, FN)', C.red]]} />
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{cap}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
const NCASE = 2000;
function makeCases(sep: number, prev: number, seed: number): Case[] {
  const r = rng(seed);
  return Array.from({ length: NCASE }, (_, i) => {
    const y = (i < Math.round(NCASE * prev) ? 1 : 0) as 0 | 1;
    const z = gauss(r) + (y ? sep / 2 : -sep / 2);
    return { p: 1 / (1 + Math.exp(-1.3 * z)), y };
  });
}
const hist = (vals: number[], bins: number) => histogram(vals, 0, 1, bins).map((d) => d.y);

function Playground() {
  const [sep, setSep] = useState(2);
  const [prev, setPrev] = useState(0.2);
  const [t, setT] = useState(0.5);
  const cases = useMemo(() => makeCases(sep, prev, 11), [sep, prev]);
  const curve = useMemo(() => { const c = roc(cases); const step = Math.max(1, Math.floor(c.length / 300)); return c.filter((_, i) => i % step === 0 || i === c.length - 1); }, [cases]);
  const A = auc(curve);
  const m = confusion(cases, t);
  const BINS = 40;
  const hp = hist(cases.filter((c) => c.y).map((c) => c.p), BINS), hn = hist(cases.filter((c) => !c.y).map((c) => c.p), BINS);
  const ymax = Math.max(5, ...hp, ...hn) * 1.1;
  const nobody = 1 - prev;
  return (
    <Layout
      main={<>
        <Plot x={[0, 1]} y={[0, ymax]} height={250} xLabel="predicted probability" yLabel="number of cases" xTicks={10}>
          {(s) => <>
            <rect x={s.sx(t)} y={s.sy(ymax)} width={Math.max(0, s.sx(1) - s.sx(t))} height={s.sy(0) - s.sy(ymax)} fill={C.yellow} opacity={0.07} />
            {hn.map((v, i) => <rect key={'n' + i} x={s.sx(i / BINS)} width={s.sx(1 / BINS) - s.sx(0) - 1} y={s.sy(v)} height={s.sy(0) - s.sy(v)} fill={NEG} opacity={0.55} />)}
            {hp.map((v, i) => <rect key={'p' + i} x={s.sx(i / BINS)} width={s.sx(1 / BINS) - s.sx(0) - 1} y={s.sy(v)} height={s.sy(0) - s.sy(v)} fill={POS} opacity={0.7} />)}
            <Seg s={s} x1={t} x2={t} y1={0} y2={ymax} color={C.yellow} width={2.5} />
            <Label s={s} x={Math.min(t, 0.8) + 0.01} y={ymax * 0.9} color={C.yellow} size={12}>flag ≥ {t.toFixed(2)} →</Label>
          </>}
        </Plot>
        <div className="row" style={{ gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 300px', minWidth: 0 }}><RocPlot pts={curve} upto={curve.length} cur={{ x: m.fpr, y: m.recall }} shade height={280} /></div>
          <div style={{ flex: '1 1 260px', minWidth: 0, paddingTop: 8 }}><Confusion m={m} /></div>
        </div>
      </>}
      side={<>
        <Slider label="threshold" min={0.01} max={0.99} step={0.01} value={t} onChange={setT} format={(v) => v.toFixed(2)} />
        <Slider label="class separation" min={0} max={4} step={0.1} value={sep} onChange={setSep} format={(v) => v.toFixed(1)} />
        <Slider label="positives (prevalence)" min={0.01} max={0.5} step={0.01} value={prev} onChange={setPrev} format={(v) => (v * 100).toFixed(0) + '%'} />
        <Readout items={[
          ['precision', pct(m.precision), C.gold], ['recall', pct(m.recall), C.green],
          ['FPR', pct(m.fpr), C.red], ['F1', m.f1.toFixed(2)],
          ['accuracy', pct(m.acc)], ['"flag nobody" accuracy', pct(nobody), C.muted],
          ['AUC', A.toFixed(3), C.green],
        ]} />
        <Legend items={[['positives', POS], ['negatives', NEG], ['threshold / ROC', C.yellow]]} />
        <p className="small muted" style={{ margin: 0 }}>{NCASE.toLocaleString()} simulated cases. The gold ring on the ROC curve is your current threshold.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Ten customers sorted by predicted churn probability. A **threshold** slides from 1.0 down to 0; everyone to its right is flagged. The confusion matrix, precision/recall and the **ROC curve** update one customer at a time.', steps: [
      { do: 'Step slowly and watch the ROC chart.', notice: 'Each time the threshold passes a churner the curve steps **up**; each time it passes a stayer it steps **right**.' },
      { do: 'Stop at threshold **0.5**, then at **0.35**.', notice: 'Recall rises from 60% to 80% and precision falls from 60% to 57%, while accuracy stays at 60%.' },
      { do: 'Go to the last frame.', notice: 'AUC = 0.76: the share of churner/stayer pairs ranked correctly. It does not depend on the threshold.' },
    ] },
    Playground: { what: '2,000 simulated cases: positives (purple) and negatives (blue) with overlapping score distributions. Move the threshold, the separation between classes and how rare positives are.', steps: [
      { do: 'Drag the **threshold** from 0.9 to 0.1.', notice: 'The gold ring slides along the ROC curve; precision falls as recall rises.' },
      { do: 'Set **prevalence** to 2% and the threshold to 0.99.', notice: 'Accuracy is about 98% while the model catches almost nothing: accuracy is useless for rare classes.' },
      { do: 'Drag **class separation** to 0, then to 4.', notice: 'At 0 the ROC curve hugs the diagonal (AUC ≈ 0.5, coin-flip); at 4 it hugs the top-left corner (AUC near 1).' },
    ] },
  },
};
export default anim;
