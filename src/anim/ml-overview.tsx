// What is machine learning? Rules vs learning from examples, then the three families:
// supervised (labelled points learn a boundary), unsupervised (unlabelled points form groups), reinforcement (rewards spread through a grid).
import { ReactNode, useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Dots, FnLine, Region, Label, MatrixView, Caption, Readout, Slider, Choice, Layout, Legend, useStepPlayer, PlayerControls, rng, gauss, C, SERIES, Scales } from '../viz/kit';
import { mean, sd, sigmoid } from '../viz/math';
import { alpha } from './_dataprep-helpers';

/* ---------- pure helpers ---------- */
interface Loan { s: number; u: number; y: number } // salary ₹k/month, credit utilisation %, y = 1 repaid / 0 defaulted
function loans(n: number, seed: number): Loan[] {
  const r = rng(seed);
  return Array.from({ length: n }, () => { const s = 20 + r() * 100, u = r() * 100; return { s, u, y: (s - 60) / 22 - (u - 50) / 22 + gauss(r) * 0.55 > 0 ? 1 : 0 }; });
}
type W = [number, number, number];
function trainLogit(data: Loan[], iters: number[], w0: W = [0.3, -0.6, 0.9], lr = 0.5) {
  const ms = mean(data.map((d) => d.s)), ss = sd(data.map((d) => d.s)) || 1, mu = mean(data.map((d) => d.u)), su = sd(data.map((d) => d.u)) || 1;
  const X = data.map((d) => [1, (d.s - ms) / ss, (d.u - mu) / su]);
  let w = [...w0] as W; const snaps: { it: number; w: W }[] = []; let it = 0;
  const want = new Set(iters), last = Math.max(...iters);
  if (want.has(0)) snaps.push({ it: 0, w: [...w] as W });
  while (it < last) {
    const g = [0, 0, 0];
    X.forEach((x, i) => { const e = sigmoid(w[0] * x[0] + w[1] * x[1] + w[2] * x[2]) - data[i].y; for (let j = 0; j < 3; j++) g[j] += e * x[j]; });
    for (let j = 0; j < 3; j++) w[j] -= (lr * g[j]) / X.length;
    it++;
    if (want.has(it)) snaps.push({ it, w: [...w] as W });
  }
  // a classifier in raw units: predict "repay" when z > 0
  const z = (w: W, s: number, u: number) => w[0] + (w[1] * (s - ms)) / ss + (w[2] * (u - mu)) / su;
  const line = (w: W) => (s: number) => mu - (su * (w[0] + (w[1] * (s - ms)) / ss)) / (w[2] || 1e-9); // the u where z = 0
  return { snaps, z, line };
}
function logLoss(data: Loan[], p: (d: Loan) => number) { return -mean(data.map((d) => { const q = Math.min(1 - 1e-9, Math.max(1e-9, p(d))); return d.y ? Math.log(q) : Math.log(1 - q); })); }

interface Cust { x: number; y: number }
function customers(seed = 4): Cust[] {
  const r = rng(seed), centres = [[25, 3], [70, 4.5], [50, 12]];
  return Array.from({ length: 60 }, (_, i) => { const c = centres[i % 3]; return { x: c[0] + gauss(r) * 7, y: Math.max(0.5, c[1] + gauss(r) * 1.4) }; });
}
// k-means on (spend/10, visits) so both axes matter roughly equally
function kmeansSteps(pts: Cust[], init: Cust[], rounds: number) {
  const d2 = (p: Cust, c: Cust) => ((p.x - c.x) / 10) ** 2 + (p.y - c.y) ** 2;
  const out: { cents: Cust[]; assign: number[] | null }[] = [{ cents: init, assign: null }];
  let cents = init;
  for (let k = 0; k < rounds; k++) {
    const assign = pts.map((p) => cents.reduce((b, c, j) => (d2(p, c) < d2(p, cents[b]) ? j : b), 0));
    out.push({ cents, assign });
    cents = cents.map((c, j) => { const m = pts.filter((_, i) => assign[i] === j); return m.length ? { x: mean(m.map((p) => p.x)), y: mean(m.map((p) => p.y)) } : c; });
    out.push({ cents, assign });
  }
  const inertia = (a: number[], cs: Cust[]) => pts.reduce((s, p, i) => s + d2(p, cs[a[i]]), 0);
  return { out, inertia };
}

// grid world for reinforcement learning: value iteration sweeps (each sweep ~ many practice runs)
const GRID = 5, GOAL = [0, 4], WALLS = new Set(['1,1', '1,2', '3,2', '3,3']), PIT = '2,4';
function valueSweeps(n: number) {
  let V = Array.from({ length: GRID }, () => Array(GRID).fill(0));
  const snaps = [V.map((r) => [...r])];
  const moves = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (let k = 0; k < n; k++) {
    const nv = V.map((r) => [...r]);
    for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) {
      if ((r === GOAL[0] && c === GOAL[1]) || WALLS.has(`${r},${c}`) || `${r},${c}` === PIT) continue;
      nv[r][c] = Math.max(...moves.map(([dr, dc]) => {
        const R = r + dr, Cc = c + dc;
        if (R < 0 || R >= GRID || Cc < 0 || Cc >= GRID || WALLS.has(`${R},${Cc}`)) return 0.9 * V[r][c];
        const reward = R === GOAL[0] && Cc === GOAL[1] ? 10 : `${R},${Cc}` === PIT ? -10 : 0;
        return reward + (reward === 0 ? 0.9 * V[R][Cc] : 0);
      }));
    }
    V = nv; snaps.push(V.map((r) => [...r]));
  }
  return snaps;
}
function policyArrow(V: number[][], r: number, c: number) {
  if (r === GOAL[0] && c === GOAL[1]) return '★ +10';
  if (`${r},${c}` === PIT) return '✖ −10';
  if (WALLS.has(`${r},${c}`)) return '▓';
  const opts: [string, number, number][] = [['↑', r - 1, c], ['↓', r + 1, c], ['←', r, c - 1], ['→', r, c + 1]];
  let best = '·', bv = -Infinity;
  for (const [a, R, Cc] of opts) {
    if (R < 0 || R >= GRID || Cc < 0 || Cc >= GRID || WALLS.has(`${R},${Cc}`)) continue;
    const v = R === GOAL[0] && Cc === GOAL[1] ? 10 : `${R},${Cc}` === PIT ? -10 : 0.9 * V[R][Cc];
    if (v > bv + 1e-9) { bv = v; best = a; }
  }
  return V[r][c] <= 0 ? '·' : `${best} ${V[r][c].toFixed(1)}`;
}

/** Hollow red rings around misclassified points. */
function Rings({ s, pts }: { s: Scales; pts: { x: number; y: number }[] }) {
  return <>{pts.map((p, i) => <circle key={i} cx={s.sx(p.x)} cy={s.sy(p.y)} r={9} fill="none" stroke={C.red} strokeWidth={2} />)}</>;
}

/* ---------- Animate ---------- */
type Scene = { kind: 'loans'; rule?: 'one' | 'two'; w?: W; it?: number; newApp?: boolean } | { kind: 'cust'; step: number } | { kind: 'grid'; sweep: number } | { kind: 'summary' };
const ITERS = [0, 3, 15, 60, 300];
function Animate() {
  const data = useMemo(() => loans(70, 21), []);
  const model = useMemo(() => trainLogit(data, ITERS), [data]);
  const cust = useMemo(() => customers(), []);
  const km = useMemo(() => kmeansSteps(cust, [{ x: 15, y: 15 }, { x: 50, y: 16 }, { x: 88, y: 15 }], 3), [cust]);
  const sweeps = useMemo(() => valueSweeps(12), []);
  const ruleErr = (rule: 'one' | 'two') => data.filter((d) => ((rule === 'one' ? d.s > 50 : d.s > 50 && d.u < 60) ? 1 : 0) !== d.y).length;
  const modelErr = (w: W) => data.filter((d) => (model.z(w, d.s, d.u) > 0 ? 1 : 0) !== d.y).length;
  const newApp = { s: 85, u: 70 };
  const scenes: { sc: Scene; caption: ReactNode }[] = [
    { sc: { kind: 'loans' }, caption: <>A bank's <b>past loans</b>: each dot is an applicant, placed by monthly salary and how much of their credit limit they use. <b style={{ color: C.blue }}>Blue repaid</b>, <b style={{ color: C.purple }}>purple defaulted</b>. The bank wants a way to decide <b>new</b> applications.</> },
    { sc: { kind: 'loans', rule: 'one' }, caption: <>The old way: a person <b>writes a rule</b>. "Approve if salary &gt; ₹50k" (shaded yellow). Red rings are mistakes: <b>{ruleErr('one')} of {data.length}</b> applicants misjudged, mostly high earners who max out their cards.</> },
    { sc: { kind: 'loans', rule: 'two' }, caption: <>Patch it: "…<b>and</b> utilisation &lt; 60%". Now {ruleErr('two')} mistakes. Better, but every patch is a guess, real banks end up with hundreds of contradicting exceptions, and the true boundary here is a <b>slanted line</b> no simple rule draws.</> },
    ...model.snaps.map((sn, k) => ({ sc: { kind: 'loans', w: sn.w, it: sn.it } as Scene, caption: k === 0
      ? <><b>Machine learning</b> flips the job: give the computer the examples <i>with their answers</i> and let it find the rule. It starts with a <b>random line</b> (yellow): {modelErr(sn.w)} mistakes.</>
      : k < model.snaps.length - 1 ? <>Training step {sn.it}: the algorithm measures its error on the labelled examples and <b>nudges the line</b> to reduce it. Mistakes: <b>{modelErr(sn.w)}</b>.</>
        : <>After {sn.it} small nudges the line has settled: only <b>{modelErr(sn.w)} mistakes</b>, fewer than the hand-written rules, and nobody typed a threshold. <b>Learning = searching for the parameters with the smallest error.</b></> })),
    { sc: { kind: 'loans', w: model.snaps[model.snaps.length - 1].w, newApp: true }, caption: <>The point of it all: a <b>new applicant</b> (gold) earning ₹85k with 70% utilisation. Rule 2 would reject (utilisation ≥ 60%); the learned model says <b>{model.z(model.snaps[model.snaps.length - 1].w, newApp.s, newApp.u) > 0 ? 'approve' : 'decline'}</b>, because high salary offsets high usage. This is <b>supervised learning</b>: learning from labelled answers.</> },
    ...km.out.map((st, k) => ({ sc: { kind: 'cust', step: k } as Scene, caption: k === 0
      ? <>A different situation: a shop's customers by monthly spend and visits, but <b>no answer column</b>. Nobody has labelled them. This is <b>unsupervised learning</b>: find structure on your own. Three starting centres (✚) are dropped in arbitrary spots along the top.</>
      : k % 2 === 1 ? <>Each customer joins its <b>nearest centre</b> (colour). Round {(k + 1) / 2}.</>
        : k < km.out.length - 1 ? <>Each centre moves to the <b>middle of its customers</b>. The groups sharpen.</>
          : <>Settled: three <b>segments</b> appear (occasional low spenders, big-basket monthly shoppers, frequent mid spenders). The algorithm found groups, but <b>naming them, and deciding there are 3, is still your job</b>.</> })),
    ...[0, 1, 2, 4, 12].map((n) => ({ sc: { kind: 'grid', sweep: n } as Scene, caption: n === 0
      ? <>Third family, <b>reinforcement learning</b>: no examples at all. A warehouse robot learns by <b>trying moves</b> and getting rewards: +10 at the ★ shelf, −10 in the ✖ spill, and a reward that arrives one step later is worth 10% less (time costs money). Walls are ▓. It knows nothing yet.</>
      : n < 12 ? <>After {n === 1 ? 'one round' : `${n} rounds`} of practice, the reward <b>spreads back</b> from the goal: cells near ★ learn they are valuable (numbers = expected future reward, arrows = best move).</>
        : <>After 12 rounds every cell knows its best move: arrows trace the <b>shortest safe path</b> around walls and away from the spill. Nobody showed the robot the route; it learned from <b>trial, error and reward</b>.</> })),
    { sc: { kind: 'summary' }, caption: <><b>The three families.</b> Have labelled answers? → <b>supervised</b> (number = regression, category = classification). Only raw data? → <b>unsupervised</b> (clustering, compression). Learning by acting with rewards? → <b>reinforcement</b>. The question decides the family, and the family decides the model, the loss and how you test it.</> },
  ];
  const p = useStepPlayer(scenes.length, 2600);
  const { sc, caption } = scenes[p.i];
  let main: ReactNode = null, side: ReactNode = null;
  if (sc.kind === 'loans') {
    const err = (d: Loan) => sc.rule ? ((sc.rule === 'one' ? d.s > 50 : d.s > 50 && d.u < 60) ? 1 : 0) !== d.y : sc.w ? (model.z(sc.w, d.s, d.u) > 0 ? 1 : 0) !== d.y : false;
    const wrong = data.filter(err);
    main = <Plot x={[20, 120]} y={[0, 100]} height={400} xLabel="monthly salary (₹ thousand)" yLabel="credit utilisation (%)">
      {(s) => <>
        {sc.rule && <Region s={s} x0={50} x1={120} y0={0} y1={sc.rule === 'one' ? 100 : 60} color={C.yellow} opacity={0.12} stroke={C.yellow} />}
        {sc.rule && <Label s={s} x={52} y={sc.rule === 'one' ? 95 : 56} color={C.yellow}>{sc.rule === 'one' ? 'APPROVE: salary > 50' : 'APPROVE: salary > 50 and use < 60'}</Label>}
        {sc.w && <FnLine s={s} f={model.line(sc.w)} color={C.yellow} width={3} />}
        <Dots s={s} pts={data.map((d) => ({ x: d.s, y: d.u }))} r={5} color={(i) => (data[i].y ? C.blue : C.purple)} animate={false} />
        {sc.newApp && <><Dots s={s} pts={[newApp].map((d) => ({ x: d.s, y: d.u }))} r={9} color={C.gold} animate={false} /><Label s={s} x={newApp.s + 3} y={newApp.u + 3} color={C.gold}>new applicant</Label></>}
        <Rings s={s} pts={wrong.map((d) => ({ x: d.s, y: d.u }))} />
        {sc.w && <><Label s={s} x={117} y={4} anchor="end" color={C.yellow} size={12}>{model.z(sc.w, 117, 4) > 0 ? 'model says APPROVE' : 'model says DECLINE'}</Label>
          <Label s={s} x={23} y={94} color={C.yellow} size={12}>{model.z(sc.w, 23, 94) > 0 ? 'model says APPROVE' : 'model says DECLINE'}</Label></>}
      </>}
    </Plot>;
    side = <>
      <Readout items={[
        ['approach', sc.rule ? 'hand-written rule' : sc.w ? 'learned from data' : '–', sc.w ? C.yellow : undefined],
        ['mistakes', sc.rule || sc.w ? `${wrong.length} / ${data.length}` : '–', C.red],
        ['training step', sc.it ?? '–'],
        ['log-loss', sc.w ? logLoss(data, (d) => sigmoid(model.z(sc.w!, d.s, d.u))).toFixed(3) : '–'],
      ]} />
      <Legend items={[['repaid', C.blue], ['defaulted', C.purple], ['rule / model', C.yellow], ['mistake', C.red]]} />
    </>;
  } else if (sc.kind === 'cust') {
    const st = km.out[sc.step];
    main = <Plot x={[0, 100]} y={[0, 17]} height={400} xLabel="monthly spend (₹ hundred)" yLabel="visits per month">
      {(s) => <>
        <Dots s={s} pts={cust} r={5} color={(i) => (st.assign ? SERIES[[0, 3, 5][st.assign[i]]] : C.grey)} />
        {st.cents.map((c, j) => <Label key={j} s={s} x={c.x} y={c.y - 0.35} anchor="middle" size={22} color={st.assign ? SERIES[[0, 3, 5][j]] : C.text}>✚</Label>)}
      </>}
    </Plot>;
    side = <>
      <Readout items={[['labels available', 'none', C.red], ['groups (k)', 3], ['round', Math.ceil(sc.step / 2)], ['within-group spread', st.assign ? km.inertia(st.assign, st.cents).toFixed(0) : '–']]} />
      <Legend items={[['unlabelled customer', C.grey], ['group 1', SERIES[0]], ['group 2', SERIES[3]], ['group 3', SERIES[5]]]} />
    </>;
  } else if (sc.kind === 'grid') {
    const V = sweeps[sc.sweep];
    main = <div style={{ minHeight: 300, display: 'flex', alignItems: 'center' }}><MatrixView title="Warehouse floor: expected future reward and best move in each cell" data={V.map((row, r) => row.map((_, c) => policyArrow(V, r, c)))}
      cellColor={(r, c) => (r === GOAL[0] && c === GOAL[1] ? alpha(C.green, 0.5) : `${r},${c}` === PIT ? alpha(C.red, 0.45) : WALLS.has(`${r},${c}`) ? alpha(C.grey, 0.6) : V[r][c] > 0 ? alpha(C.yellow, 0.08 + V[r][c] / 14) : V[r][c] < 0 ? alpha(C.red, Math.min(0.4, -V[r][c] / 20)) : undefined)} /></div>;
    side = <>
      <Readout items={[['practice rounds', sc.sweep], ['goal reward', '+10', C.green], ['spill', '−10', C.red], ['delay discount', '× 0.9 per step']]} />
      <Legend items={[['goal', C.green], ['danger', C.red], ['learned value', C.yellow], ['wall', C.grey]]} />
    </>;
  } else {
    main = <MatrixView title="Three ways a machine can learn" colLabels={['Supervised', 'Unsupervised', 'Reinforcement']} rowLabels={['data', 'learns', 'business example', 'in this animation']}
      data={[['examples + answers', 'examples only', 'actions + rewards'], ['a mapping x → y', 'structure / groups', 'a policy (what to do)'], ['loan default, demand', 'customer segments', 'robots, bidding'], ['slanted boundary', 'three segments', 'path to ★']]}
      cellColor={(_, c) => alpha([C.yellow, C.teal, C.green][c], 0.15)} />;
    side = <Legend items={[['supervised', C.yellow], ['unsupervised', C.teal], ['reinforcement', C.green]]} />;
  }
  return (
    <div>
      <Layout main={main} side={side} />
      <PlayerControls p={p} />
      <Caption>{caption}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
const GROUPC = [C.blue, C.gold, C.teal, C.purple, C.pink, C.green];
type Mode = 'rule' | 'learn' | 'cluster';
function Playground() {
  const [mode, setMode] = useState<Mode>('rule');
  const [sT, setST] = useState(50);
  const [uT, setUT] = useState(100);
  const [n, setN] = useState(40);
  const [k, setK] = useState(3);
  const test = useMemo(() => loans(400, 99), []);
  const train = useMemo(() => loans(n, 21), [n]);
  const model = useMemo(() => trainLogit(train, [400]), [train]);
  const w = model.snaps[0].w;
  const cust = useMemo(() => customers(), []);
  const km = useMemo(() => {
    const init = Array.from({ length: k }, (_, j) => cust[(j * 17 + 5) % cust.length]);
    const r = kmeansSteps(cust, init, 8); const last = r.out[r.out.length - 1];
    return { ...last, inertia: r.inertia(last.assign!, last.cents) };
  }, [cust, k]);
  const acc = (pred: (d: Loan) => number, set: Loan[]) => (100 * set.filter((d) => pred(d) === d.y).length) / set.length;
  const rule = (d: Loan) => (d.s > sT && d.u < uT ? 1 : 0), learned = (d: Loan) => (model.z(w, d.s, d.u) > 0 ? 1 : 0);
  const base70 = useMemo(() => loans(70, 21), []);
  const refAcc = useMemo(() => { const m = trainLogit(base70, [400]); return (100 * test.filter((d) => (m.z(m.snaps[0].w, d.s, d.u) > 0 ? 1 : 0) === d.y).length) / test.length; }, [base70, test]);
  const shown = mode === 'rule' ? base70 : train;
  return (
    <Layout
      main={mode === 'cluster'
        ? <Plot x={[0, 100]} y={[0, 17]} height={400} xLabel="monthly spend (₹ hundred)" yLabel="visits per month">
          {(s) => <>
            <Dots s={s} pts={cust} r={5} color={(i) => GROUPC[km.assign![i] % GROUPC.length]} />
            {km.cents.map((c, j) => <Label key={j} s={s} x={c.x} y={c.y - 0.35} anchor="middle" size={22} color={GROUPC[j % GROUPC.length]}>✚</Label>)}
          </>}
        </Plot>
        : <Plot x={[20, 120]} y={[0, 100]} height={400} xLabel="monthly salary (₹ thousand)" yLabel="credit utilisation (%)">
          {(s) => <>
            {mode === 'rule' && <Region s={s} x0={sT} x1={120} y0={0} y1={uT} color={C.yellow} opacity={0.12} stroke={C.yellow} />}
            {mode === 'learn' && <FnLine s={s} f={model.line(w)} color={C.yellow} width={3} />}
            <Dots s={s} pts={shown.map((d) => ({ x: d.s, y: d.u }))} r={5} color={(i) => (shown[i].y ? C.blue : C.purple)} animate={false} />
            <Rings s={s} pts={shown.filter((d) => (mode === 'rule' ? rule(d) : learned(d)) !== d.y).map((d) => ({ x: d.s, y: d.u }))} />
          </>}
        </Plot>}
      side={<>
        <Choice label="Approach" value={mode} onChange={setMode} options={[{ value: 'rule', label: '✍ Write a rule' }, { value: 'learn', label: '🧠 Learn from data' }, { value: 'cluster', label: '🔍 No labels' }]} />
        {mode === 'rule' && <>
          <Slider label="approve if salary >" min={20} max={120} value={sT} onChange={setST} format={(v) => `₹${v}k`} />
          <Slider label="and utilisation <" min={0} max={100} value={uT} onChange={setUT} format={(v) => `${v}%`} />
          <Readout items={[['accuracy on these 70', `${acc(rule, base70).toFixed(0)}%`], ['accuracy on 400 new', `${acc(rule, test).toFixed(0)}%`, C.green], ['learned model (new)', `${refAcc.toFixed(0)}%`, C.yellow]]} />
          <p className="small muted" style={{ margin: 0 }}>Try to beat the learned model with two thresholds. A rectangle can never follow the slanted boundary.</p>
        </>}
        {mode === 'learn' && <>
          <Slider label="labelled examples" min={6} max={300} value={n} onChange={setN} />
          <Readout items={[['training accuracy', `${acc(learned, train).toFixed(0)}%`], ['accuracy on 400 new', `${acc(learned, test).toFixed(0)}%`, C.green], ['examples', n]]} />
          <p className="small muted" style={{ margin: 0 }}>With 6–10 examples the line can fit them perfectly yet do worse on new applicants. More labelled data → a line that generalises.</p>
        </>}
        {mode === 'cluster' && <>
          <Slider label="number of groups k" min={1} max={6} value={k} onChange={setK} />
          <Readout items={[['labels', 'none', C.red], ['groups', k], ['within-group spread', km.inertia.toFixed(0)]]} />
          <p className="small muted" style={{ margin: 0 }}>Spread always falls as k grows, so "smallest spread" cannot choose k for you. There is no answer key: you judge which grouping is useful.</p>
        </>}
        <Legend items={mode === 'cluster' ? km.cents.map((_, j) => [`group ${j + 1}`, GROUPC[j % GROUPC.length]] as [string, string]) : [['repaid', C.blue], ['defaulted', C.purple], ['rule / model', C.yellow], ['mistake', C.red]]} />
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'A bank first **writes rules** by hand, then lets an algorithm **learn** a boundary from labelled past loans. Then the two other families: **unsupervised** grouping of unlabelled customers and **reinforcement** learning by reward.', steps: [
      { do: 'Step through the first three frames.', notice: 'Hand-written rules leave many red-ringed mistakes because the real boundary is slanted.' },
      { do: 'Keep stepping through the training frames.', notice: 'The yellow line rotates step by step and the mistake count falls: learning is error reduction.' },
      { do: 'Continue to the grey customers and the grid.', notice: 'Without labels the algorithm forms groups; with only rewards the robot\'s arrows learn a path to ★.' },
    ] },
    Playground: { what: 'Compete with the algorithm: write your own rule, train a model on more or fewer examples, or group unlabelled data.', steps: [
      { do: 'In **Write a rule**, move both sliders to get the highest accuracy you can.', notice: 'Compare "accuracy on 400 new" with the learned model\'s score below it; a rectangle cannot match a slanted line.' },
      { do: 'In **Learn from data**, drag **labelled examples** down to 6, then up to 300.', notice: 'With few examples training accuracy is high but accuracy on new applicants is unstable; more data fixes it.' },
      { do: 'In **No labels**, change k from 1 to 6.', notice: 'Every k gives an answer and spread always shrinks; choosing the useful grouping is a human judgement.' },
    ] },
  },
};
export default anim;
