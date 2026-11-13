// k-fold cross-validation: rotate the validation fold, score each fold, summarise as mean ± SD,
// and see how much steadier the CV estimate is than a single hold-out split.
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Dots, FnLine, Seg, Label, Caption, Readout, Slider, Choice, Layout, Legend, useStepPlayer, PlayerControls, C, SERIES } from '../viz/kit';
import { Pt, polyFit, rmse, mean, sd, sampleCurve, permutation, clipped } from './_workflow-helpers';

/* ---------- pure helpers ---------- */
const LO = 10, HI = 100, YR: [number, number] = [2, 24];
const truth = (x: number) => 8 + 10 * Math.exp(-(((x - 55) / 25) ** 2)) + 1.5 * Math.sin(x / 7);
const TRAIN = C.blue, VAL = C.purple;

/** fold[i] = which fold row i belongs to (shuffled, as equal as possible). */
function assignFolds(n: number, k: number, seed: number) {
  const fold = Array(n).fill(0);
  permutation(n, seed).forEach((row, pos) => (fold[row] = Math.floor((pos * k) / n)));
  return fold;
}
function cvScores(pts: Pt[], fold: number[], k: number, deg: number) {
  return Array.from({ length: k }, (_, j) => {
    const tr = pts.filter((_, i) => fold[i] !== j), va = pts.filter((_, i) => fold[i] === j);
    return va.length ? rmse(va, polyFit(tr, deg, LO, HI)) : 0;
  });
}

/** The classic k-fold diagram: one row per round, one block per fold; the validation block is purple. */
function FoldGrid({ k, active, scores, upto, height }: { k: number; active?: number; scores?: number[]; upto?: number; height?: number }) {
  const H = height ?? Math.max(120, 30 * k + 40);
  return (
    <Plot x={[-1.1, k + 1.3]} y={[k, 0]} height={H} xTicks={0} yTicks={0} fx={() => ''} fy={() => ''} grid={false}>
      {(s) => <>
        {Array.from({ length: k }, (_, r) => <g key={r} opacity={active === undefined || active === r ? 1 : 0.45}>
          <Label s={s} x={-0.15} y={r + 0.68} anchor="end" size={12} color={active === r ? C.gold : C.muted}>round {r + 1}</Label>
          {Array.from({ length: k }, (_, c) => (
            <rect key={c} x={s.sx(c + 0.04)} y={s.sy(r + 0.12)} width={s.sx(c + 0.96) - s.sx(c + 0.04)} height={Math.abs(s.sy(r + 0.88) - s.sy(r + 0.12))} rx={3}
              fill={c === r ? VAL : TRAIN} fillOpacity={c === r ? 0.9 : 0.35} stroke={active === r ? C.gold : 'none'} strokeWidth={1.5} />
          ))}
          {scores && upto !== undefined && r <= upto && <Label s={s} x={k + 0.12} y={r + 0.68} size={12} color={C.text}>RMSE {scores[r].toFixed(2)}</Label>}
        </g>)}
      </>}
    </Plot>
  );
}

/** Per-fold score bars with a mean line and ± 1 SD band. Bars above `cap` are clipped with a value label. */
function ScoreBars({ series, upto, cap, showMean, height = 210, width = 380 }: { series: { name: string; v: number[]; col: string }[]; upto: number; cap: number; showMean?: boolean; height?: number; width?: number }) {
  const k = series[0].v.length, m = series.length;
  return (
    <Plot x={[0.4, k + 0.6]} y={[0, cap]} height={height} width={width} xLabel="fold" yLabel="validation RMSE" xTicks={k} fx={(v) => (Number.isInteger(v) ? String(v) : '')} yTicks={4}>
      {(s) => <>
        {showMean && series.map((se) => { const mu = mean(se.v), sdv = sd(se.v); return <g key={se.name + 'm'}>
          <rect x={s.sx(0.4)} width={s.sx(k + 0.6) - s.sx(0.4)} y={s.sy(Math.min(cap, mu + sdv))} height={Math.max(0, s.sy(Math.max(0, mu - sdv)) - s.sy(Math.min(cap, mu + sdv)))} fill={se.col} opacity={0.12} />
          <Seg s={s} x1={0.4} x2={k + 0.6} y1={Math.min(mu, cap)} y2={Math.min(mu, cap)} color={se.col} dash="6 4" />
        </g>; })}
        {series.map((se, j) => se.v.map((v, i) => {
          if (i > upto) return null;
          const w = 0.7 / m, x0 = i + 1 - 0.35 + j * w, vv = Math.min(v, cap);
          return <g key={se.name + i}>
            <rect x={s.sx(x0)} width={s.sx(x0 + w * 0.9) - s.sx(x0)} y={s.sy(vv)} height={Math.max(0, s.sy(0) - s.sy(vv))} fill={se.col} rx={2} />
            {v > cap && <Label s={s} x={x0 + w * 0.45} y={cap * 0.9} anchor="middle" size={11} color={C.text}>{v.toFixed(0)}↑</Label>}
          </g>;
        }))}
      </>}
    </Plot>
  );
}

/* ---------- Animate ---------- */
const N = 30, K = 5, DEG = 4, DEG_B = 10;
type Fr = { phase: 'data' | 'folds' | 'pick' | 'score' | 'mean' | 'compare' | 'final'; k?: number };

function Animate() {
  const pts = useMemo(() => sampleCurve(truth, N, LO, HI, 1.5, 3), []);
  const fold = useMemo(() => assignFolds(N, K, 53), []);
  const fits = useMemo(() => Array.from({ length: K }, (_, j) => polyFit(pts.filter((_, i) => fold[i] !== j), DEG, LO, HI)), [pts, fold]);
  const scores = useMemo(() => cvScores(pts, fold, K, DEG), [pts, fold]);
  const scoresB = useMemo(() => cvScores(pts, fold, K, DEG_B), [pts, fold]);
  const full = useMemo(() => polyFit(pts, DEG, LO, HI), [pts]);
  const frames: Fr[] = [
    { phase: 'data' }, { phase: 'folds' },
    ...Array.from({ length: K }, (_, k) => [{ phase: 'pick' as const, k }, { phase: 'score' as const, k }]).flat(),
    { phase: 'mean' }, { phase: 'compare' }, { phase: 'final' },
  ];
  const p = useStepPlayer(frames.length, 1700);
  const f = frames[p.i];
  const mu = mean(scores), s = sd(scores), muB = mean(scoresB), sB = sd(scoresB);
  const kk = f.k ?? -1;
  const doneUpto = f.phase === 'pick' ? kk - 1 : f.phase === 'score' ? kk : f.phase === 'data' || f.phase === 'folds' ? -1 : K - 1;
  const color = (i: number) => {
    if (f.phase === 'data') return C.blue;
    if (f.phase === 'folds' || f.phase === 'mean' || f.phase === 'compare') return SERIES[[0, 2, 3, 4, 5][fold[i]]];
    if (f.phase === 'final') return C.blue;
    return fold[i] === kk ? VAL : TRAIN;
  };
  const fit = f.phase === 'pick' || f.phase === 'score' ? fits[kk] : f.phase === 'final' ? full : undefined;
  const bestB = scoresB.findIndex((v, i) => v < scores[i]);
  const caps: React.ReactNode[] = [
    <>Thirty delivery trips (speed vs fuel efficiency). We want to know how well a <b>degree-{DEG} polynomial</b> will predict new trips. One 80/20 split would give one number, and that number depends on which 6 trips happen to land in the test set. <b>Cross-validation removes the luck.</b></>,
    <>Shuffle the rows and deal them into <b>{K} folds</b> of 6 trips each (the five colours). Every trip belongs to exactly one fold. The grid above shows the plan: {K} rounds, and in each round a different fold is held out.</>,
    ...Array.from({ length: K }, (_, k) => [
      <>Round {k + 1}: fold {k + 1} (purple) is the <b>validation set</b>; the other 24 trips (blue) train the model. The yellow curve is fitted on the blue dots only.</>,
      <>Score round {k + 1} on its 6 purple trips: the red lines are the misses, <b>RMSE = {scores[k].toFixed(2)} km/l</b>. {k === 0 ? 'That bar goes into the chart on the right.' : k < K - 1 ? `Scores so far: ${scores.slice(0, k + 1).map((v) => v.toFixed(2)).join(', ')}. Notice how much they vary from fold to fold.` : 'Every trip has now been used for validation exactly once, and for training four times.'}</>,
    ]).flat(),
    <>Summarise the {K} scores: <b>mean RMSE = {mu.toFixed(2)} ± {s.toFixed(2)}</b> (SD across folds, dashed line and band). The mean is a steadier estimate than any single fold; the SD tells you how much one split could have fooled you.</>,
    <>Now compare a <b>degree-{DEG_B}</b> model on the <b>same folds</b> (gold bars). {bestB >= 0 ? <>On fold {bestB + 1} it beats degree {DEG} ({scoresB[bestB].toFixed(2)} vs {scores[bestB].toFixed(2)}), so a single split could have crowned it. </> : null}Across all folds it scores <b>{muB.toFixed(2)} ± {sB.toFixed(2)}</b>: worse on average and far less stable. <b>Choose degree {DEG}.</b></>,
    <>Finally, refit the chosen degree-{DEG} model on <b>all 30 trips</b> (yellow). CV was only for <i>estimating</i> and <i>choosing</i>; the reported performance is the CV estimate, {mu.toFixed(2)} ± {s.toFixed(2)} km/l.</>,
  ];
  const series = f.phase === 'compare' ? [{ name: 'A', v: scores, col: C.blue }, { name: 'B', v: scoresB, col: C.gold }] : [{ name: 'A', v: scores, col: C.blue }];
  return (
    <div>
      <Layout
        main={<>
          <FoldGrid k={K} active={f.k} scores={scores} upto={doneUpto} height={190} />
          <Plot x={[LO - 2, HI + 2]} y={YR} height={290} xLabel="average speed (km/h)" yLabel="fuel efficiency (km/l)">
            {(s) => <>
              {fit && <FnLine s={s} f={clipped(fit, YR[0], YR[1])} color={C.yellow} width={3} />}
              {f.phase === 'score' && pts.map((q, i) => fold[i] === kk ? <Seg key={i} s={s} x1={q.x} x2={q.x} y1={q.y} y2={Math.max(YR[0] - 1, Math.min(YR[1] + 1, fits[kk](q.x)))} color={C.red} width={2.5} /> : null)}
              <Dots s={s} pts={pts} color={color} r={(f.phase === 'pick' || f.phase === 'score') ? 5.5 : 5} />
            </>}
          </Plot>
        </>}
        side={<>
          <Readout items={[
            ['round', f.k !== undefined ? `${kk + 1} of ${K}` : '–', C.gold],
            ['this fold RMSE', f.phase === 'score' ? scores[kk].toFixed(2) : '–', C.red],
            ['mean RMSE', doneUpto >= 0 ? mean(scores.slice(0, doneUpto + 1)).toFixed(2) : '–', C.blue],
            ['SD across folds', doneUpto >= 1 ? sd(scores.slice(0, doneUpto + 1)).toFixed(2) : '–', C.blue],
          ]} />
          <ScoreBars series={series} upto={doneUpto} cap={6} showMean={f.phase === 'mean' || f.phase === 'compare' || f.phase === 'final'} />
          <Legend items={[['training rows', TRAIN], ['validation fold', VAL], ['model', C.yellow], ['miss', C.red], ...(f.phase === 'compare' ? [[`degree ${DEG_B}`, C.gold] as [string, string]] : [])]} />
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caps[p.i]}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
function Playground() {
  const [k, setK] = useState(5);
  const [deg, setDeg] = useState(4);
  const [n, setN] = useState(40);
  const [seed, setSeed] = useState(1);
  const pts = useMemo(() => sampleCurve(truth, n, LO, HI, 1.5, 7), [n]);
  const fold = useMemo(() => assignFolds(n, k, 300 + seed), [n, k, seed]);
  const scores = useMemo(() => cvScores(pts, fold, k, deg), [pts, fold, k, deg]);
  const curve = useMemo(() => Array.from({ length: 12 }, (_, d) => mean(cvScores(pts, fold, k, d + 1))), [pts, fold, k]);
  // 40 different shuffles: one 80/20 hold-out estimate vs one k-fold estimate each
  const spread = useMemo(() => Array.from({ length: 40 }, (_, r) => {
    const perm = permutation(n, 7000 + r), cut = Math.round(n * 0.8);
    const tr = perm.slice(0, cut).map((i) => pts[i]), te = perm.slice(cut).map((i) => pts[i]);
    return { hold: rmse(te, polyFit(tr, deg, LO, HI)), cv: mean(cvScores(pts, assignFolds(n, k, 8000 + r), k, deg)) };
  }), [pts, n, k, deg]);
  const holdSD = sd(spread.map((q) => q.hold)), cvSD = sd(spread.map((q) => q.cv));
  const capS = Math.max(4, Math.min(10, Math.max(...spread.map((q) => Math.max(q.hold, q.cv))) * 1.05));
  const bestD = curve.indexOf(Math.min(...curve)) + 1;
  const capCurve = Math.min(10, Math.max(3, curve[0] * 1.3));
  return (
    <Layout
      main={<>
        <FoldGrid k={k} height={Math.min(260, 26 * k + 40)} />
        <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 340px', minWidth: 0 }}>
            <ScoreBars series={[{ name: 'A', v: scores, col: C.blue }]} upto={k} cap={Math.max(4, Math.min(12, Math.max(...scores) * 1.15))} showMean height={230} width={420} />
          </div>
          <div style={{ flex: '1 1 340px', minWidth: 0 }}>
            <Plot x={[0.5, 12.5]} y={[0, capCurve]} height={230} width={420} xLabel="polynomial degree" yLabel="mean CV RMSE" xTicks={12}>
              {(s) => <>
                <path d={curve.map((v, i) => `${i ? 'L' : 'M'}${s.sx(i + 1)},${s.sy(Math.min(v, capCurve * 1.02))}`).join('')} fill="none" stroke={C.red} strokeWidth={2.5} />
                <Dots s={s} pts={curve.map((v, i) => ({ x: i + 1, y: Math.min(v, capCurve * 1.02) }))} color={(i) => (i + 1 === deg ? C.gold : C.red)} r={4.5} animate={false} />
                <Seg s={s} x1={deg} x2={deg} y1={0} y2={capCurve} color={C.gold} dash="3 3" />
              </>}
            </Plot>
          </div>
        </div>
        <div className="small muted" style={{ marginTop: 6 }}>The same model evaluated after 40 different shuffles: each dot is one estimate</div>
        <Plot x={[0, capS]} y={[0, 2]} height={130} xLabel="estimated RMSE (km/l)" yTicks={0} fy={() => ''}>
          {(s) => <>
            <Dots s={s} pts={spread.map((q, i) => ({ x: Math.min(q.hold, capS), y: 1.45 + ((i * 7) % 10) * 0.035 }))} color={C.purple} r={4} animate={false} />
            <Dots s={s} pts={spread.map((q, i) => ({ x: Math.min(q.cv, capS), y: 0.45 + ((i * 7) % 10) * 0.035 }))} color={C.blue} r={4} animate={false} />
            <Label s={s} x={capS * 0.98} y={1.78} anchor="end" color={C.purple} size={12}>single 80/20 split (SD {holdSD.toFixed(2)})</Label>
            <Label s={s} x={capS * 0.98} y={0.78} anchor="end" color={C.blue} size={12}>{k}-fold CV (SD {cvSD.toFixed(2)})</Label>
          </>}
        </Plot>
      </>}
      side={<>
        <Slider label="folds k" min={2} max={10} value={k} onChange={setK} />
        <Slider label="polynomial degree" min={1} max={12} value={deg} onChange={setDeg} />
        <Slider label="trips n" min={20} max={120} step={5} value={n} onChange={setN} />
        <button className="btn" onClick={() => setSeed(seed + 1)}>🔀 Reshuffle folds</button>
        <Readout items={[
          ['CV RMSE (mean)', mean(scores).toFixed(2), C.blue],
          ['± SD across folds', sd(scores).toFixed(2), C.blue],
          ['best degree by CV', bestD, C.gold],
          ['fits per CV estimate', k, C.muted],
        ]} />
        <Legend items={[['training folds', TRAIN], ['validation fold', VAL], ['CV error per degree', C.red], ['your degree', C.gold]]} />
        <p className="small muted" style={{ margin: 0 }}>Bottom strip: purple dots are hold-out estimates from 40 shuffles, blue dots are k-fold estimates from 40 shuffles. Tighter = more trustworthy.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Thirty trips are dealt into **5 folds**. Each round holds out one fold (purple), trains on the rest (blue) and scores the held-out trips. The five scores become **mean ± SD**.', steps: [
      { do: 'Step through rounds 1 to 5.', notice: 'The purple block in the grid moves one place each round, and every trip is held out exactly once. The fold scores differ noticeably.' },
      { do: 'Stop at the **mean ± SD** frame.', notice: 'The dashed line is the CV estimate; the shaded band shows how much a single split could have misled you.' },
      { do: 'Step to the comparison with degree 10.', notice: 'The flexible model wins some folds but blows up on another. CV picks the steadier degree-4 model.' },
    ] },
    Playground: { what: 'Change the number of folds, the model\'s flexibility and the data size. See per-fold scores, the CV error for every degree, and how much estimates move when the data are reshuffled.', steps: [
      { do: 'Look at the bottom strip, then click **🔀 Reshuffle folds** a few times.', notice: 'Purple (single split) estimates are spread far wider than blue (k-fold) ones: CV is less dependent on luck.' },
      { do: 'Drag **polynomial degree** to 12.', notice: 'Fold scores become wildly uneven and the SD explodes: an unstable model shows up immediately in CV.' },
      { do: 'Move **folds k** from 2 to 10.', notice: 'More folds = more training data per round and a slightly lower error estimate, at the cost of more model fits.' },
    ] },
  },
};
export default anim;
