// Random forest: bagging + a random menu of features at every split → more diverse trees, a sharper vote, OOB error for free.
import { ReactNode, useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, FnLine, Seg, Label, Caption, Readout, Slider, Choice, Layout, Legend, useStepPlayer, PlayerControls, rng, C } from '../viz/kit';
import { mean, bootstrap } from '../viz/math';
import { credit, growTree, predict, treeGrid, boundary, Field, Boundary, ClassDots, CLS, AX, CP, TNode, SplitLog, G } from './_ensembles-helpers';

/* ---------- pure helpers ---------- */
const FEAT = ['income', 'credit score'];
const fval = (f: number, v: number) => (f === 0 ? `₹${(v * 3).toFixed(1)}L` : `${Math.round(300 + v * 60)}`);
interface Forest { trees: TNode[]; logs: SplitLog[][]; counts: number[][]; grids: Uint8Array[]; cum: Float32Array[]; oobErr: number[] }
function forest(pts: CP[], B: number, mtry: number, depth: number, seed: number): Forest {
  const r = rng(seed), X = pts.map((p) => [p.x, p.y]), y = pts.map((p) => p.label);
  const out: Forest = { trees: [], logs: [], counts: [], grids: [], cum: [], oobErr: [] };
  const acc = new Float32Array(G * G), ov = pts.map(() => 0), on = pts.map(() => 0);
  for (let b = 0; b < B; b++) {
    const bs = bootstrap(pts.length, r);
    const { root, log } = growTree(X, y, bs.counts, { maxDepth: depth, minLeaf: 1, mtry, r }, [...new Set(bs.idx)]);
    out.trees.push(root); out.logs.push(log); out.counts.push(bs.counts);
    const g = treeGrid(root); out.grids.push(g);
    for (let k = 0; k < G * G; k++) acc[k] += g[k];
    out.cum.push(Float32Array.from(acc, (v) => v / (b + 1)));
    pts.forEach((p, i) => { if (bs.counts[i] === 0) { ov[i] += predict(root, X[i]) > 0.5 ? 1 : 0; on[i]++; } });
    let wrong = 0, n = 0;
    pts.forEach((p, i) => { if (on[i]) { n++; if ((ov[i] / on[i] >= 0.5 ? 1 : 0) !== p.label) wrong++; } });
    out.oobErr.push(n ? wrong / n : 0.5);
  }
  return out;
}
/** Average share of grid cells on which two trees agree (over all pairs of the first k trees). */
function agreement(grids: Uint8Array[], k = 40) {
  let s = 0, n = 0;
  for (let a = 0; a < Math.min(k, grids.length); a++) for (let b = a + 1; b < Math.min(k, grids.length); b++) {
    let same = 0; for (let c = 0; c < G * G; c++) if (grids[a][c] === grids[b][c]) same++;
    s += same / (G * G); n++;
  }
  return n ? s / n : 1;
}
const freshErr = (fr: Forest, test: CP[], B: number) => mean(test.map((p) => ((mean(fr.trees.slice(0, B).map((t) => (predict(t, [p.x, p.y]) > 0.5 ? 1 : 0))) >= 0.5 ? 1 : 0) !== p.label ? 1 : 0)));
const PROBE = [4.7, 5.8];

/** Split lines of the first k logged splits, each clipped to its node's box. */
function SplitLines({ s, log, k }: { s: Parameters<typeof Field>[0]['s']; log: SplitLog[]; k: number }) {
  return <>{log.slice(0, k + 1).map((L, j) => {
    const b = L.node.box, cur = j === k;
    const [x1, x2, y1, y2] = L.f === 0 ? [L.t, L.t, b[1][0], b[1][1]] : [b[0][0], b[0][1], L.t, L.t];
    return <line key={j} x1={s.sx(x1)} x2={s.sx(x2)} y1={s.sy(y1)} y2={s.sy(y2)} stroke={cur ? C.gold : C.muted} strokeWidth={cur ? 3 : 1.5} />;
  })}</>;
}
/** Leaves of the partial tree after the first k+1 logged splits, shaded by their majority class. */
function Partition({ s, root, log, k }: { s: Parameters<typeof Field>[0]['s']; root: TNode; log: SplitLog[]; k: number }) {
  let leafs: TNode[] = [root];
  log.slice(0, k + 1).forEach((L) => { leafs = leafs.flatMap((n) => (n === L.node ? [n.l!, n.r!] : [n])); });
  return <>{leafs.map((n) => <rect key={n.id} x={s.sx(n.box[0][0])} y={s.sy(n.box[1][1])} width={s.sx(n.box[0][1]) - s.sx(n.box[0][0])} height={s.sy(n.box[1][0]) - s.sy(n.box[1][1])} fill={n.v > 0.5 ? CLS[1] : CLS[0]} fillOpacity={0.06 + 0.22 * Math.abs(2 * n.v - 1)} />)}</>;
}
function Menu({ menu }: { menu?: number[] }) {
  return <div className="row" style={{ gap: 6 }}>{FEAT.map((f, k) => {
    const on = menu?.includes(k);
    return <span key={f} className="small" style={{ padding: '3px 8px', borderRadius: 6, border: `1px solid ${on ? C.gold : C.grey}`, color: on ? C.gold : C.muted, textDecoration: on || !menu ? 'none' : 'line-through' }}>{f}</span>;
  })}</div>;
}

/* ---------- Animate ---------- */
const N = 80;
const WALK = 6;
function Animate() {
  const pts = useMemo(() => credit(N, 5, 0.1), []);
  const test = useMemo(() => credit(500, 99, 0.1), []);
  const rf = useMemo(() => forest(pts, 200, 1, 8, 21), [pts]);
  const bg = useMemo(() => forest(pts, 200, 2, 8, 21), [pts]);
  const agreeRF = useMemo(() => agreement(rf.grids), [rf]), agreeBG = useMemo(() => agreement(bg.grids), [bg]);
  const errRF = useMemo(() => freshErr(rf, test, 200), [rf, test]), errBG = useMemo(() => freshErr(bg, test, 200), [bg, test]);
  type F = { kind: 'data' | 'split' | 'tree' | 'multi' | 'vote' | 'end'; k: number };
  const log = rf.logs[0];
  const frames: F[] = [{ kind: 'data', k: 0 }, ...Array.from({ length: Math.min(WALK, log.length) }, (_, k) => ({ kind: 'split' as const, k })), { kind: 'tree', k: 1 }, { kind: 'multi', k: 4 }];
  [5, 25, 100, 200].forEach((k) => frames.push({ kind: 'vote', k }));
  frames.push({ kind: 'end', k: 200 });
  const p = useStepPlayer(frames.length, 1600);
  const f = frames[p.i];
  const B = f.kind === 'vote' || f.kind === 'end' ? f.k : f.kind === 'tree' ? 1 : 0;
  const L = f.kind === 'split' ? log[f.k] : null;
  const cnt = f.kind === 'split' || f.kind === 'tree' ? rf.counts[0] : null;
  const field = B ? rf.cum[B - 1] : null;
  const votes = B ? rf.trees.slice(0, B).filter((t) => predict(t, PROBE) > 0.5).length : 0;
  const showCurve = f.kind === 'vote' || f.kind === 'end';
  let caption: ReactNode;
  if (f.kind === 'data') caption = <>80 loan applicants (<b style={{ color: CLS[1] }}>circles repaid</b>, <b style={{ color: CLS[0] }}>squares defaulted</b>). A random forest starts exactly like bagging: each tree gets its own <b>bootstrap sample</b>. The twist comes at every split.</>;
  else if (L) {
    const forced = L.alt && (L.alt.f !== L.f || Math.abs(L.alt.t - L.t) > 1e-9);
    caption = <>Split {f.k + 1} (inside the highlighted box, {L.node.n} rows): a coin flip puts only <b>{FEAT[L.f]}</b> on the menu. The best cut on it is <b>{FEAT[L.f]} ≤ {fval(L.f, L.t)}</b>. {forced ? <>With both features allowed the tree would have cut <b>{FEAT[L.alt!.f]} ≤ {fval(L.alt!.f, L.alt!.t)}</b> instead: the random menu <b>forces a different tree</b>.</> : <>Here the menu happened to contain the best feature anyway.</>}</>;
  } else if (f.kind === 'tree') caption = <>Tree #1 keeps splitting until its leaves are pure. Its boundary (yellow) is jagged, like any deep tree. Faded points were <b>out-of-bag</b> for this tree, so they can later grade it honestly.</>;
  else if (f.kind === 'multi') caption = <>Four forest trees, each with its own bootstrap sample and its own random menus. They <b>disagree</b> on many regions: on average two forest trees agree on {(agreeRF * 100).toFixed(0)}% of the map, versus {(agreeBG * 100).toFixed(0)}% for plain bagged trees. Less agreement = <b>less correlated errors</b> for the vote to cancel.</>;
  else if (f.kind === 'vote') caption = <><b>{f.k} trees vote.</b> Shading shows the vote share in each region; the yellow line is where the vote is 50/50. At the gold ✚ applicant, <b>{votes} of {f.k}</b> trees say "repaid". Right panel: the <b>out-of-bag error</b> (each row graded only by trees that never saw it) settles as trees are added.</>;
  else caption = <>With 200 trees the OOB error is {(rf.oobErr[199] * 100).toFixed(1)}% for the forest vs {(bg.oobErr[199] * 100).toFixed(1)}% for plain bagging (fresh-data error {(errRF * 100).toFixed(1)}% vs {(errBG * 100).toFixed(1)}%). With only two features the difference is small (on 80 rows OOB numbers wobble by a few points); with dozens of features, where one star feature would dominate every bagged tree, <b>decorrelation matters much more</b>. OOB error gives this verdict <b>without a test set</b>.</>;
  const Mini = ({ t, title }: { t: number; title: string }) => (
    <div><div className="small muted">{title}</div>
      <Plot x={[0, 10]} y={[0, 10]} width={380} height={300} {...AX} xLabel="income" yLabel="credit" xTicks={4} yTicks={4}>
        {(s) => <><Field s={s} field={rf.grids[t]} /><Boundary s={s} segs={boundary(rf.grids[t])} color={C.yellow} width={2} /><ClassDots s={s} pts={pts} r={() => 3} op={(i) => (rf.counts[t][i] ? 1 : 0.2)} /></>}
      </Plot></div>
  );
  return (
    <div>
      <Layout
        main={f.kind === 'multi'
          ? <div className="grid g2" style={{ gap: 8 }}>{[0, 1, 2, 3].map((t) => <Mini key={t} t={t} title={`tree #${t + 1}: first split on ${FEAT[rf.logs[t][0]?.f ?? 0]}`} />)}</div>
          : <Plot x={[0, 10]} y={[0, 10]} height={460} {...AX}>
            {(s) => <>
              {field && <Field s={s} field={field} />}
              {f.kind === 'tree' && <Boundary s={s} segs={boundary(rf.grids[0])} color={C.yellow} width={2.5} />}
              {B > 1 && <Boundary s={s} segs={boundary(field!)} color={C.yellow} width={3} />}
              {L && <Partition s={s} root={rf.trees[0]} log={log} k={f.k} />}
              {L && <rect x={s.sx(L.node.box[0][0])} y={s.sy(L.node.box[1][1])} width={s.sx(L.node.box[0][1]) - s.sx(L.node.box[0][0])} height={s.sy(L.node.box[1][0]) - s.sy(L.node.box[1][1])} fill={C.gold} fillOpacity={0.08} stroke={C.gold} strokeDasharray="4 3" />}
              {L && <SplitLines s={s} log={log} k={f.k} />}
              <ClassDots s={s} pts={pts} r={(i) => (cnt ? (cnt[i] ? 4 + 1.6 * (cnt[i] - 1) : 4) : 5)} op={(i) => (cnt && !cnt[i] ? 0.2 : 1)} />
              {B > 0 && <Label s={s} x={PROBE[0]} y={PROBE[1]} color={C.gold} size={20} anchor="middle">✚</Label>}
            </>}
          </Plot>}
        side={<>
          <div className="small muted">features on the menu at this split</div>
          <Menu menu={L ? L.menu : undefined} />
          <Readout items={[
            ['trees voting', B || '–'],
            ['votes "repaid" at ✚', B ? `${votes} / ${B}` : '–', C.gold],
            ['tree agreement: forest', `${(agreeRF * 100).toFixed(0)}%`, C.yellow],
            ['tree agreement: bagging', `${(agreeBG * 100).toFixed(0)}%`, C.muted],
          ]} />
          <div className="small muted">out-of-bag error vs number of trees</div>
          <Plot x={[1, 200]} y={[0, 0.4]} width={340} height={200} xLabel="trees" fy={(v) => `${Math.round(v * 100)}%`} xTicks={4} yTicks={4}>
            {(s) => showCurve ? <>
              <FnLine s={s} f={(x) => bg.oobErr[Math.round(x) - 1]} from={1} to={B} n={Math.max(2, B - 1)} color={C.muted} width={1.5} />
              <FnLine s={s} f={(x) => rf.oobErr[Math.round(x) - 1]} from={1} to={B} n={Math.max(2, B - 1)} color={C.yellow} />
              <Seg s={s} x1={B} x2={B} y1={0} y2={0.4} color={C.gold} width={1} dash="3 3" />
              <Label s={s} x={110} y={0.35} color={C.yellow} size={11}>forest (1 of 2 features)</Label>
              <Label s={s} x={110} y={0.3} color={C.muted} size={11}>bagging (2 of 2)</Label>
            </> : <Label s={s} x={100} y={0.2} color={C.muted} size={12} anchor="middle">appears once trees vote</Label>}
          </Plot>
          <Legend items={[['repaid', CLS[1]], ['default', CLS[0]], ['current split', C.gold], ['vote boundary', C.yellow]]} />
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caption}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
function Playground() {
  const [B, setB] = useState(50);
  const [mtry, setMtry] = useState(1);
  const [depth, setDepth] = useState(8);
  const [seed, setSeed] = useState(5);
  const pts = useMemo(() => credit(N, seed, 0.1), [seed]);
  const test = useMemo(() => credit(500, 99, 0.1), []);
  const rf = useMemo(() => forest(pts, 200, 1, depth, seed + 9), [pts, depth, seed]);
  const bg = useMemo(() => forest(pts, 200, 2, depth, seed + 9), [pts, depth, seed]);
  const cur = mtry === 1 ? rf : bg;
  const agree = useMemo(() => agreement(cur.grids, 30), [cur]);
  const fe = useMemo(() => freshErr(cur, test, B), [cur, test, B]);
  return (
    <Layout
      main={<Plot x={[0, 10]} y={[0, 10]} height={460} {...AX}>
        {(s) => <>
          <Field s={s} field={cur.cum[B - 1]} />
          <Boundary s={s} segs={boundary(cur.cum[B - 1])} color={C.yellow} width={3} />
          <ClassDots s={s} pts={pts} />
        </>}
      </Plot>}
      side={<>
        <Choice label="features per split" value={mtry} onChange={setMtry} options={[{ value: 1, label: '1 of 2 (forest)' }, { value: 2, label: '2 of 2 (bagging)' }]} />
        <Slider label="trees" min={1} max={200} value={B} onChange={setB} />
        <Slider label="max depth" min={1} max={10} value={depth} onChange={setDepth} />
        <button className="btn" onClick={() => setSeed(seed + 1)}>🎲 New training sample</button>
        <Readout items={[
          ['OOB error', `${(cur.oobErr[B - 1] * 100).toFixed(1)}%`, C.yellow],
          ['fresh-data error', `${(fe * 100).toFixed(1)}%`, C.green],
          ['tree agreement', `${(agree * 100).toFixed(0)}%`],
        ]} />
        <Plot x={[1, 200]} y={[0, 0.45]} width={340} height={180} xLabel="trees" fy={(v) => `${Math.round(v * 100)}%`} xTicks={4} yTicks={3}>
          {(s) => <>
            <FnLine s={s} f={(x) => (mtry === 1 ? bg : rf).oobErr[Math.round(x) - 1]} from={1} to={200} n={199} color={C.muted} width={1.5} />
            <FnLine s={s} f={(x) => cur.oobErr[Math.round(x) - 1]} from={1} to={200} n={199} color={C.yellow} />
            <Seg s={s} x1={B} x2={B} y1={0} y2={0.45} color={C.gold} width={1} dash="3 3" />
          </>}
        </Plot>
        <p className="small muted" style={{ margin: 0 }}>Yellow = OOB error of the current setting, grey = the other setting. OOB error is computed from rows each tree never saw, so it tracks the fresh-data error without a test set. Adding trees does not overfit: the curve just flattens.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'We grow a **random forest** on 80 loan applicants: bootstrap samples as in bagging, plus a **random menu of features at every split**. Then the trees vote, and out-of-bag rows grade the forest.', steps: [
      { do: 'Step through the six **split** frames and watch the menu chips on the right.', notice: 'Only one feature is allowed per split. Sometimes the caption shows the tree was forced away from the cut it would normally pick.' },
      { do: 'Stop on the **four mini trees** frame.', notice: 'The trees look different from each other, and the agreement readout is lower for the forest than for bagging.' },
      { do: 'Play to the end and watch the OOB error chart.', notice: 'The error drops quickly in the first 25 trees, then flattens: more trees never hurt.' },
    ] },
    Playground: { what: 'Switch between a random forest (1 feature per split) and bagging (both features), change the number of trees and depth, and compare OOB and fresh-data error.', steps: [
      { do: 'Slide **trees** from 1 to 200.', notice: 'The boundary smooths and the OOB error falls, then levels off.' },
      { do: 'Toggle **features per split** between the two options.', notice: 'Forest trees agree less with each other (lower agreement %), which is exactly what makes their average better.' },
      { do: 'Press **New training sample** a few times and compare OOB error with fresh-data error.', notice: 'They move together: OOB error is an honest built-in test score.' },
    ] },
  },
};
export default anim;
