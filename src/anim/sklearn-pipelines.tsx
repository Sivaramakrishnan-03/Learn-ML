// scikit-learn Pipelines: data flows through impute → scale → model; every step is FIT on training rows only and merely
// APPLIED to validation rows. Contrast with leakage (fitting on all rows), including the classic feature-selection trap.
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Dots, Arrow, Label, Seg, Caption, Readout, Slider, Layout, Legend, MatrixView, useStepPlayer, PlayerControls, rng, gauss, C, Scales } from '../viz/kit';
import { mean, median, permutation } from './_workflow-helpers';

/* ---------- pure helpers ---------- */
const TRAIN = C.blue, VAL = C.purple, LEAK = C.red;
const sdPop = (a: number[]) => { const m = mean(a); return Math.sqrt(mean(a.map((v) => (v - m) ** 2))); };

/** "Feature selection on pure noise": n rows, p random columns, random 50/50 labels. Select the k columns most related to
 *  the label either on ALL rows (leaky) or inside each CV fold (pipeline), then 5-fold CV of a nearest-centroid classifier. */
function noiseCV(n: number, p: number, k: number, inside: boolean, seed: number) {
  const r = rng(seed), X = new Float64Array(n * p);
  for (let i = 0; i < n * p; i++) X[i] = gauss(r);
  const y = permutation(n, seed + 1).map((v) => (v < n / 2 ? 1 : 0));
  const select = (rows: number[]) => {
    const score = new Float64Array(p);
    let n1 = 0; rows.forEach((i) => (n1 += y[i]));
    const n0 = rows.length - n1;
    for (const i of rows) { const w = y[i] ? 1 / n1 : -1 / n0, off = i * p; for (let j = 0; j < p; j++) score[j] += w * X[off + j]; }
    return Array.from({ length: p }, (_, j) => j).sort((a, b) => Math.abs(score[b]) - Math.abs(score[a])).slice(0, k);
  };
  const fold = Array(n).fill(0); permutation(n, seed + 2).forEach((row, pos) => (fold[row] = pos % 5));
  const all = Array.from({ length: n }, (_, i) => i), leakySel = inside ? [] : select(all);
  let correct = 0;
  for (let f = 0; f < 5; f++) {
    const tr = all.filter((i) => fold[i] !== f), te = all.filter((i) => fold[i] === f);
    const sel = inside ? select(tr) : leakySel;
    const c = [0, 1].map((cls) => { const rows = tr.filter((i) => y[i] === cls); return sel.map((j) => mean(rows.map((i) => X[i * p + j]))); });
    te.forEach((i) => {
      const d = c.map((cent) => sel.reduce((s, j, q) => s + (X[i * p + j] - cent[q]) ** 2, 0));
      if ((d[1] < d[0] ? 1 : 0) === y[i]) correct++;
    });
  }
  return correct / n;
}
function noiseStudy(n: number, p: number, k: number, reps: number) {
  return Array.from({ length: reps }, (_, s) => ({ wrong: noiseCV(n, p, k, false, 100 + 7 * s), right: noiseCV(n, p, k, true, 100 + 7 * s) }));
}

/* ---------- the tiny loan pipeline from the lesson ---------- */
const ROWS = [
  { id: 'A', inc: 10, set: 'train' }, { id: 'B', inc: 20, set: 'train' }, { id: 'C', inc: NaN, set: 'train' }, { id: 'D', inc: 15, set: 'train' },
  { id: 'E', inc: 60, set: 'val' }, { id: 'F', inc: 80, set: 'val' },
] as const;
const trainInc = ROWS.filter((r) => r.set === 'train').map((r) => r.inc);
const MED = median(trainInc.filter((v) => !isNaN(v)));               // 15
const filledTrain = trainInc.map((v) => (isNaN(v) ? MED : v));       // 10 20 15 15
const MU = mean(filledTrain), SD = sdPop(filledTrain);                // 15, 3.536
const allKnown = ROWS.map((r) => r.inc).filter((v) => !isNaN(v));
const MED_L = median(allKnown);                                        // 20 (leaky)
const filledAll = ROWS.map((r) => (isNaN(r.inc) ? MED_L : r.inc));
const MU_L = mean(filledAll), SD_L = sdPop(filledAll);                // 34.2, 26.4 (leaky)

const STAGE_X = [1.1, 3.75, 6.35, 8.9];
const BOX = [{ t: 'raw rows', x: 1.1 }, { t: 'SimpleImputer', x: 3.75 }, { t: 'StandardScaler', x: 6.35 }, { t: 'LogisticRegression', x: 8.9 }];

type Fr = { stage: number; vStage: number; fit: number; filled: number; leak?: boolean; cv?: boolean; noise?: boolean; showVal: boolean };

function Diagram({ f }: { f: Fr }) {
  const params = [
    '',
    f.fit >= 1 ? (f.leak ? `median = ${MED_L}  ✗` : `median = ${MED}`) : 'not fitted',
    f.fit >= 2 ? (f.leak ? `μ = ${MU_L.toFixed(1)}, σ = ${SD_L.toFixed(1)}  ✗` : `μ = ${MU}, σ = ${SD.toFixed(2)}`) : 'not fitted',
    f.fit >= 3 ? 'weights learned' : 'not fitted',
  ];
  const start = f.leak ? -0.75 : -0.45;
  const trainPts = [0, 1, 2, 3].map((i) => ({ x: STAGE_X[f.stage] + start + i * 0.3, y: 2.12 }));
  const valPts = [0, 1].map((i) => (f.leak ? { x: STAGE_X[f.vStage] + start + (4 + i) * 0.3, y: 2.12 } : { x: STAGE_X[f.vStage] - 0.15 + i * 0.3, y: 0.55 }));
  return (
    <Plot x={[-0.35, 10.2]} y={[0.2, 3]} height={200} xTicks={0} yTicks={0} fx={() => ''} fy={() => ''} grid={false}>
      {(s: Scales) => <>
        {BOX.map((b, i) => <g key={b.t}>
          <rect x={s.sx(b.x - 1.15)} y={s.sy(2.85)} width={s.sx(b.x + 1.15) - s.sx(b.x - 1.15)} height={s.sy(1.45) - s.sy(2.85)} rx={8} fill={C.grid}
            stroke={i > 0 && f.fit === i ? (f.leak ? LEAK : C.gold) : '#2a3344'} strokeWidth={i > 0 && f.fit === i ? 2.5 : 1} />
          <Label s={s} x={b.x} y={2.6} anchor="middle" size={13} color={C.text}>{b.t}</Label>
          {i > 0 && <Label s={s} x={b.x} y={1.62} anchor="middle" size={11} color={f.fit >= i ? (f.leak ? LEAK : C.yellow) : C.muted}>{params[i]}</Label>}
          {i < 3 && <Arrow s={s} x1={b.x + 1.17} y1={2.15} x2={BOX[i + 1].x - 1.2} y2={2.15} color={C.muted} width={1.5} />}
        </g>)}
        <Label s={s} x={0.05} y={0.95} size={11} color={C.muted}>{f.leak ? 'validation rows mixed into fit ✗' : 'validation rows: transform only'}</Label>
        <Seg s={s} x1={0} x2={10} y1={1.15} y2={1.15} color="#2a3344" dash="3 4" />
        <Dots s={s} pts={trainPts} color={TRAIN} r={7} />
        {f.showVal && <Dots s={s} pts={valPts} color={f.leak ? LEAK : VAL} r={7} />}
      </>}
    </Plot>
  );
}

function Animate() {
  const noise = useMemo(() => noiseStudy(50, 1000, 20, 12), []);
  const wrong = mean(noise.map((q) => q.wrong)), right = mean(noise.map((q) => q.right));
  const frames: Fr[] = [
    { stage: 0, vStage: 0, fit: 0, filled: 0, showVal: false },
    { stage: 0, vStage: 0, fit: 0, filled: 0, showVal: true },
    { stage: 1, vStage: 0, fit: 1, filled: 0, showVal: true },
    { stage: 1, vStage: 0, fit: 1, filled: 1, showVal: true },
    { stage: 2, vStage: 0, fit: 2, filled: 1, showVal: true },
    { stage: 2, vStage: 0, fit: 2, filled: 2, showVal: true },
    { stage: 3, vStage: 0, fit: 3, filled: 2, showVal: true },
    { stage: 3, vStage: 1, fit: 3, filled: 3, showVal: true },
    { stage: 3, vStage: 3, fit: 3, filled: 4, showVal: true },
    { stage: 2, vStage: 2, fit: 2, filled: 5, leak: true, showVal: true },
    { stage: 3, vStage: 3, fit: 3, filled: 4, cv: true, showVal: true },
    { stage: 3, vStage: 3, fit: 3, filled: 4, noise: true, showVal: true },
  ];
  const p = useStepPlayer(frames.length, 2200);
  const f = frames[p.i];
  const fmt = (v: number) => (isNaN(v) ? 'missing' : Number.isInteger(v) ? String(v) : v.toFixed(2));
  const imp = (v: number, leak = false) => (isNaN(v) ? (leak ? MED_L : MED) : v);
  const table = ROWS.map((r, i) => {
    const isT = r.set === 'train';
    const showImp = f.leak || (isT ? f.filled >= 1 : f.filled >= 4);
    const showSc = f.leak || (isT ? f.filled >= 2 : f.filled >= 4);
    const z = f.leak ? (imp(r.inc, true) - MU_L) / SD_L : (imp(r.inc) - MU) / SD;
    return [r.id + (isT ? ' (train)' : ' (valid.)'), fmt(r.inc), showImp ? fmt(imp(r.inc, f.leak)) : '·', showSc ? z.toFixed(2) : '·', i];
  });
  const caps: React.ReactNode[] = [
    <>A tiny loan dataset: monthly income (₹ thousand) for four applicants, one of them <b>missing</b>. The pipeline has three steps: fill gaps (<code>SimpleImputer</code>, median), standardise (<code>StandardScaler</code>), then a model. Each step must <b>learn</b> something (a median, a mean and SD, weights) before it can transform data.</>,
    <>Two <b style={{ color: VAL }}>validation rows</b> (incomes 60 and 80) sit in a separate lane. In real life these are tomorrow's applicants: they do not exist yet when the pipeline is trained, so they must not influence anything it learns.</>,
    <><code>imputer.fit</code> on the <b>training rows only</b>: the median of 10, 20, 15 is <b>{MED}</b>. That number is now stored inside the imputer.</>,
    <><code>imputer.transform</code>: the missing income of applicant C becomes {MED}. Training column is now 10, 20, 15, 15.</>,
    <><code>scaler.fit</code> on the imputed training rows: mean μ = {MU}, SD σ = √12.5 ≈ <b>{SD.toFixed(3)}</b>. Again stored inside the step.</>,
    <><code>scaler.transform</code>: z = (income − 15) / 3.536 gives −1.41, +1.41, 0, 0. The scaled column has mean 0 and SD 1 <i>on the training data</i>.</>,
    <><code>model.fit</code> on the scaled training rows. Calling <code>pipe.fit(X_train, y_train)</code> did all of this in order: fit, transform, fit, transform, fit.</>,
    <>Now the validation rows flow through: the imputer <b>only transforms</b> (nothing missing, so 60 and 80 pass unchanged). It does <b>not</b> re-learn its median.</>,
    <>The scaler also only transforms, with the <b>training</b> μ and σ: (60 − 15)/3.536 = <b>12.73</b> and (80 − 15)/3.536 = <b>18.38</b>. Huge z-scores are honest: these applicants really are far outside what training saw. Then the model predicts. That is <code>pipe.predict(X_valid)</code>.</>,
    <><b style={{ color: LEAK }}>The leaky way</b>: fit the imputer and scaler on all six rows. The median becomes <b>{MED_L}</b> (so C is filled with {MED_L}, not {MED}) and μ becomes <b>{MU_L.toFixed(1)}</b>, not {MU}. Every training row is now transformed with information from rows that "do not exist yet", and the validation score will be slightly too good.</>,
    <>Inside <b>cross-validation</b> the pipeline is cloned and refitted in every fold, so each fold's imputer and scaler only ever see that fold's training rows. Pass the whole pipeline to <code>cross_val_score</code> or <code>GridSearchCV</code>, never pre-transformed data.</>,
    <>Scaling leaks a little; supervised steps leak a lot. {noise.length} simulated datasets of <b>pure noise</b> (50 rows, 1,000 random columns, coin-flip labels), choosing the 20 "best" columns: selected on all rows then cross-validated, accuracy = <b style={{ color: LEAK }}>{(wrong * 100).toFixed(0)}%</b>. Selection inside the pipeline: <b style={{ color: C.green }}>{(right * 100).toFixed(0)}%</b>, the honest coin-flip.</>,
  ];
  return (
    <div>
      <Layout
        main={<>
          <Diagram f={f} />
          {!f.noise && !f.cv && <MatrixView title={f.leak ? 'Leaky transform (fitted on all 6 rows)' : 'Data as it leaves each step'} colLabels={['row', 'income', 'after imputer', 'after scaler']}
            data={table.map((r) => r.slice(0, 4) as (string | number)[])}
            cellColor={(r, c) => (c === 0 ? (ROWS[r].set === 'train' ? 'rgba(88,196,221,0.18)' : 'rgba(154,114,172,0.25)') : f.leak && c >= 2 ? 'rgba(252,98,85,0.18)' : undefined)}
            highlight={(r, c) => !f.leak && ((f.filled === 1 && c === 2 && r < 4) || (f.filled === 2 && c === 3 && r < 4) || (f.filled === 4 && c >= 2 && r >= 4))} />}
          {f.cv && <MatrixView title="Each CV fold refits the whole pipeline on its own training rows" colLabels={['fold', 'training rows', 'imputer median', 'scaler μ', 'scaler σ']}
            data={[0, 1, 2, 3].map((k) => {
              const tr = ROWS.filter((r, i) => r.set === 'train' && i !== k).map((r) => r.inc);
              const md = median(tr.filter((v) => !isNaN(v))), filled = tr.map((v) => (isNaN(v) ? md : v));
              return [`${k + 1} (hold out ${ROWS[k].id})`, ROWS.filter((r, i) => r.set === 'train' && i !== k).map((r) => r.id).join(', '), md, mean(filled).toFixed(2), sdPop(filled).toFixed(2)];
            })} />}
          {f.noise && <Plot x={[0, 3]} y={[0, 1]} height={250} xTicks={0} fx={() => ''} yLabel="5-fold CV accuracy" fy={(v) => (v * 100).toFixed(0) + '%'} yTicks={5}>
            {(s) => <>
              <Seg s={s} x1={0} x2={3} y1={0.5} y2={0.5} color={C.green} dash="6 4" />
              <Label s={s} x={2.95} y={0.53} anchor="end" color={C.green} size={12}>coin flip (the truth)</Label>
              {[{ x: 0.85, v: wrong, col: LEAK, t: 'select, then CV (leaky)' }, { x: 2.15, v: right, col: C.green, t: 'pipeline: select inside CV' }].map((b) => <g key={b.t}>
                <rect x={s.sx(b.x - 0.4)} width={s.sx(b.x + 0.4) - s.sx(b.x - 0.4)} y={s.sy(b.v)} height={s.sy(0) - s.sy(b.v)} fill={b.col} opacity={0.8} rx={4} />
                <Label s={s} x={b.x} y={0.13} anchor="middle" size={18} color={C.bg}>{(b.v * 100).toFixed(0)}%</Label>
                <Label s={s} x={b.x} y={0.04} anchor="middle" size={12} color={C.bg}>{b.t}</Label>
              </g>)}
              <Dots s={s} pts={noise.map((q, i) => ({ x: 0.6 + (i / noise.length) * 0.5, y: q.wrong }))} color={C.text} r={3} animate={false} />
              <Dots s={s} pts={noise.map((q, i) => ({ x: 1.9 + (i / noise.length) * 0.5, y: q.right }))} color={C.text} r={3} animate={false} />
            </>}
          </Plot>}
        </>}
        side={<>
          <Readout items={[
            ['imputer median', f.fit >= 1 ? (f.leak ? MED_L : MED) : '–', f.leak ? LEAK : C.yellow],
            ['scaler μ', f.fit >= 2 ? (f.leak ? MU_L.toFixed(1) : MU) : '–', f.leak ? LEAK : C.yellow],
            ['scaler σ', f.fit >= 2 ? (f.leak ? SD_L.toFixed(2) : SD.toFixed(3)) : '–', f.leak ? LEAK : C.yellow],
            ['learned from', f.leak ? 'all 6 rows ✗' : f.fit ? 'training rows only' : '–', f.leak ? LEAK : C.green],
          ]} />
          <Legend items={[['training rows', TRAIN], ['validation rows', VAL], ['step being fitted', C.gold], ['leakage', LEAK]]} />
          <pre className="small" style={{ margin: 0, whiteSpace: 'pre-wrap', color: C.muted }}>{`pipe = make_pipeline(
  SimpleImputer(strategy="median"),
  StandardScaler(),
  LogisticRegression())
pipe.fit(X_train, y_train)   # fit on train
pipe.predict(X_valid)        # transform only
cross_val_score(pipe, X, y)  # refit per fold`}</pre>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caps[p.i]}</Caption>
    </div>
  );
}

/* ---------- Playground: the feature-selection leakage simulator ---------- */
function Playground() {
  const [p, setP] = useState(1000);
  const [k, setK] = useState(20);
  const [n, setN] = useState(50);
  const reps = 10;
  const res = useMemo(() => noiseStudy(n, p, Math.min(k, p), reps), [n, p, k]);
  const wrong = mean(res.map((q) => q.wrong)), right = mean(res.map((q) => q.right));
  return (
    <Layout
      main={<>
        <div className="small muted">Each dot = one simulated dataset of pure noise, scored by 5-fold CV. The truth is 50%.</div>
        <Plot x={[0, 1]} y={[0, 2]} height={260} xLabel="cross-validated accuracy" fx={(v) => (v * 100).toFixed(0) + '%'} yTicks={0} fy={() => ''} xTicks={10}>
          {(s) => <>
            <Seg s={s} x1={0.5} x2={0.5} y1={0} y2={2} color={C.green} dash="6 4" />
            <Dots s={s} pts={res.map((q, i) => ({ x: q.wrong, y: 1.35 + (i % 5) * 0.07 }))} color={LEAK} r={6} />
            <Dots s={s} pts={res.map((q, i) => ({ x: q.right, y: 0.35 + (i % 5) * 0.07 }))} color={C.green} r={6} />
            <Seg s={s} x1={wrong} x2={wrong} y1={1.2} y2={1.8} color={LEAK} width={3} />
            <Seg s={s} x1={right} x2={right} y1={0.2} y2={0.8} color={C.green} width={3} />
            <Label s={s} x={0.02} y={1.85} color={LEAK} size={13}>select on all rows, then CV (leaky): mean {(wrong * 100).toFixed(0)}%</Label>
            <Label s={s} x={0.02} y={0.85} color={C.green} size={13}>Pipeline(SelectKBest, model) inside CV: mean {(right * 100).toFixed(0)}%</Label>
          </>}
        </Plot>
      </>}
      side={<>
        <Slider label="noise columns p" min={20} max={3000} step={20} value={p} onChange={setP} />
        <Slider label="columns selected k" min={1} max={50} value={k} onChange={setK} />
        <Slider label="rows n" min={20} max={200} step={10} value={n} onChange={setN} />
        <Readout items={[['leaky CV accuracy', (wrong * 100).toFixed(1) + '%', LEAK], ['pipeline CV accuracy', (right * 100).toFixed(1) + '%', C.green], ['optimism from leakage', '+' + ((wrong - right) * 100).toFixed(0) + ' pts', C.gold], ['datasets simulated', reps]]} />
        <Legend items={[['leaky (selection before CV)', LEAK], ['pipeline (selection inside each fold)', C.green], ['truth: 50%', C.green]]} />
        <p className="small muted" style={{ margin: 0 }}>Labels are coin flips, so no method can truly beat 50%. Any score above it is leakage. Classifier: nearest centroid on the k selected columns.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Rows flow through **impute → scale → model**. Each step is **fitted on training rows only** (gold border), then validation rows are merely **transformed**. Then the leaky alternative is shown, with real numbers.', steps: [
      { do: 'Step through the first seven frames.', notice: 'Each box first learns a number (median 15, μ 15, σ 3.54), then the table column below fills in.' },
      { do: 'Watch the purple validation rows move through.', notice: 'They use the training median and scale: their z-scores (12.7, 18.4) are large, and that is honest.' },
      { do: 'Continue to the red "leaky" frame and the final bar chart.', notice: 'Fitting on all rows changes the median and mean; with feature selection, leakage turns a coin-flip into an impressive-looking score.' },
    ] },
    Playground: { what: 'A simulator of the classic **feature-selection leak**: pure-noise data, select the k "best" columns either before cross-validation or inside a pipeline, and compare the scores.', steps: [
      { do: 'Drag **noise columns p** from 20 up to 3000.', notice: 'The leaky (red) accuracy climbs towards 90%+ while the pipeline (green) stays near 50%: more columns = more chance correlations to exploit.' },
      { do: 'Raise **rows n** to 200.', notice: 'Leakage shrinks but does not disappear: more data makes accidental correlations weaker.' },
      { do: 'Set **columns selected k** to 1, then 50.', notice: 'The green dots never systematically beat 50%, whatever you do. That is what an honest estimate looks like.' },
    ] },
  },
};
export default anim;
