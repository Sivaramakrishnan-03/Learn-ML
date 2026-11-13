// Probability: long-run frequency (coin flips settle on 1/2), two dice sums settle on the 36-outcome pattern,
// and a natural-frequency tree for the fraud-alert Bayes example.
import { ReactNode, useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Bars, Dots, Seg, Label, Region, Caption, Readout, Slider, Choice, Layout, Legend, useStepPlayer, PlayerControls, rng, C, Scales } from '../viz/kit';
import { V2, polyPath, f2 } from './_math-helpers';

/* ---------- pure helpers ---------- */
function flips(n: number, p: number, seed: number) { const r = rng(seed); return Array.from({ length: n }, () => (r() < p ? 1 : 0)); }
function running(xs: number[]) { let s = 0; return xs.map((x, i) => (s += x) / (i + 1)); }
function diceSums(n: number, seed: number) { const r = rng(seed); return Array.from({ length: n }, () => 2 + Math.floor(r() * 6) + Math.floor(r() * 6)); }
const WAYS = [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
const lg = (n: number) => Math.log10(n);
const fxPow = (v: number) => (Number.isInteger(v) ? String(10 ** v) : '');

/** Box with a title and a big number (tree diagrams). */
function Box({ s, x, y, w = 2.5, title, value, color = C.blue, hl }: { s: Scales; x: number; y: number; w?: number; title: string; value: string; color?: string; hl?: boolean }) {
  const h = 1.3;
  return <g>
    <rect x={s.sx(x - w / 2)} y={s.sy(y + h / 2)} width={s.sx(w) - s.sx(0)} height={s.sy(0) - s.sy(h)} rx={8} fill={C.bg} stroke={hl ? C.gold : color} strokeWidth={hl ? 3 : 1.6} />
    <text x={s.sx(x)} y={s.sy(y + 0.15)} fill={C.muted} fontSize={12} textAnchor="middle">{title}</text>
    <text x={s.sx(x)} y={s.sy(y - 0.4)} fill={color} fontSize={17} fontWeight={700} textAnchor="middle">{value}</text>
  </g>;
}
function Edge({ s, x1, y1, x2, y2, label }: { s: Scales; x1: number; y1: number; x2: number; y2: number; label: string }) {
  return <g><Seg s={s} x1={x1} y1={y1} x2={x2} y2={y2} color={C.muted} width={1.5} /><Label s={s} x={(x1 + x2) / 2} y={(y1 + y2) / 2 + 0.35} anchor="middle" size={12} color={C.muted}>{label}</Label></g>;
}

/* ---------- Animate ---------- */
const COIN_N = [1, 2, 3, 5, 10, 20, 50, 100, 300, 1000, 5000];
const DICE_N = [36, 360, 3600];
type Frame = { kind: 'coin' | 'dice' | 'tree'; n?: number; stage?: number; cap: ReactNode; read: [string, ReactNode, string?][] };

function Animate() {
  const coin = useMemo(() => flips(5000, 0.5, 11), []);
  const run = useMemo(() => running(coin), [coin]);
  const dice = useMemo(() => diceSums(3600, 5), []);
  const frames = useMemo<Frame[]>(() => {
    const fr: Frame[] = COIN_N.map((n) => {
      const h = Math.round(run[n - 1] * n), pr = run[n - 1];
      return { kind: 'coin', n, cap: n === 1 ? <>What does "P(heads) = ½" actually mean? Flip a fair coin once: it came up <b>{coin[0] ? 'heads' : 'tails'}</b>, so the share of heads so far is {pr}. One flip tells you almost nothing.</>
        : n <= 10 ? <>{n} flips, {h} heads: share <b>{f2(pr)}</b>. With few flips the share jumps around wildly. Streaks are normal.</>
          : n < 1000 ? <>{n} flips, {h} heads: share <b>{f2(pr, 3)}</b>. The wobbles are shrinking. The green funnel shows the typical range ½ ± 1/√n: it narrows like 1/√n.</>
            : <>{n.toLocaleString()} flips, {h.toLocaleString()} heads: share <b>{f2(pr, 3)}</b>. <b>Probability is the long-run share</b>: individual flips stay unpredictable, but the proportion settles on ½ (the law of large numbers).</>,
        read: [['flips', n.toLocaleString()], ['heads', h.toLocaleString(), C.gold], ['share of heads', f2(pr, 3), C.blue], ['true P(heads)', '0.5', C.green]] };
    });
    DICE_N.forEach((n) => {
      const c7 = dice.slice(0, n).filter((v) => v === 7).length;
      fr.push({ kind: 'dice', n, cap: n === 36 ? <>Two dice have <b>6 × 6 = 36</b> equally likely outcomes. Six of them sum to 7 ((1,6), (2,5), … (6,1)), only one sums to 2. The green marks are those exact chances. Roll 36 times: the blue bars are rough.</>
        : n === 360 ? <>360 rolls: the bars start to take the tent shape. Seven came up {c7} times = {f2(c7 / n, 3)} (true 6/36 = 0.167).</>
          : <>3,600 rolls: the bars match the green marks closely. Counting outcomes (6/36) and long-run frequency ({f2(c7 / n, 3)}) agree. <b>P(at least one 6)</b> = 1 − (5/6)² = 11/36 ≈ 0.306 by the complement rule.</>,
        read: [['rolls', n.toLocaleString()], ['share of 7s', f2(c7 / n, 3), C.blue], ['P(sum = 7)', '6/36 = 0.167', C.green]] });
    });
    const tc: ReactNode[] = [
      <>Now the hook from the chapter: a card payment is <b>flagged as fraud</b>. The model catches 90% of fraud and wrongly flags 5% of good payments. Is it 90% likely to be fraud? Picture <b>10,000 transactions</b>.</>,
      <>Only <b>1%</b> are fraud: <b>100</b> fraud, <b>9,900</b> legitimate. This "base rate" is the piece intuition forgets.</>,
      <>The model flags 90% of the fraud: <b>90 flagged</b>, 10 slip through. So P(flag | fraud) = 0.9.</>,
      <>It also flags 5% of legitimate payments: 5% of 9,900 = <b>495 false alarms</b>. A small rate times a big group is a big number.</>,
      <>Among all flagged payments: 90 fraud + 495 legitimate = <b>585 flags</b>. Conditioning on "flagged" means we now look <b>only</b> at these gold boxes.</>,
      <><b>P(fraud | flagged) = 90 / 585 ≈ 15.4%</b>, not 90%. Bayes' rule says the same: (0.9 × 0.01) / (0.9 × 0.01 + 0.05 × 0.99) = 0.154. P(A | B) and P(B | A) are different questions; the base rate decides the answer.</>,
    ];
    tc.forEach((cap, stage) => fr.push({ kind: 'tree', stage, cap, read: [
      ['transactions', '10,000'], ...(stage >= 1 ? [['fraud (1%)', '100', C.red]] as [string, string, string][] : []),
      ...(stage >= 4 ? [['all flagged', '585', C.gold]] as [string, string, string][] : []), ...(stage >= 5 ? [['P(fraud | flag)', '15.4%', C.gold]] as [string, string, string][] : []),
    ] }));
    return fr;
  }, [coin, run, dice]);
  const p = useStepPlayer(frames.length, 1700);
  const f = frames[p.i];
  let main: ReactNode;
  if (f.kind === 'coin') {
    const n = f.n!, pts: V2[] = [];
    for (let i = 1; i <= n; i += Math.max(1, Math.floor(n / 600))) pts.push([lg(i), run[i - 1]]);
    pts.push([lg(n), run[n - 1]]);
    const recent = coin.slice(Math.max(0, n - 40), n);
    main = <>
      <Plot x={[0, lg(5000)]} y={[0, 1]} height={330} xLabel="number of flips (log scale)" yLabel="share of heads" fx={fxPow} xTicks={4}>
        {(s) => <>
          <path d={polyPath(s, Array.from({ length: 60 }, (_, i) => { const x = (lg(5000) * i) / 59; return [x, Math.min(1, 0.5 + 1 / Math.sqrt(10 ** x))] as V2; }))} fill="none" stroke={C.green} strokeOpacity={0.5} strokeDasharray="4 4" />
          <path d={polyPath(s, Array.from({ length: 60 }, (_, i) => { const x = (lg(5000) * i) / 59; return [x, Math.max(0, 0.5 - 1 / Math.sqrt(10 ** x))] as V2; }))} fill="none" stroke={C.green} strokeOpacity={0.5} strokeDasharray="4 4" />
          <Seg s={s} x1={0} y1={0.5} x2={lg(5000)} y2={0.5} color={C.green} width={2} />
          <path d={polyPath(s, pts)} fill="none" stroke={C.blue} strokeWidth={2.2} />
          <Dots s={s} pts={[{ x: lg(n), y: run[n - 1] }]} color={C.gold} r={6} />
        </>}
      </Plot>
      <div className="small muted" style={{ marginTop: 6 }}>Latest flips: <span className="mono" style={{ letterSpacing: 2 }}>{recent.map((v, i) => <span key={i} style={{ color: v ? C.gold : C.blue }}>{v ? 'H' : 'T'}</span>)}</span></div>
    </>;
  } else if (f.kind === 'dice') {
    const n = f.n!, cnt = Array(11).fill(0);
    dice.slice(0, n).forEach((v) => cnt[v - 2]++);
    main = <Plot x={[1.4, 12.6]} y={[0, 0.24]} height={360} xLabel="sum of two dice" yLabel="share of rolls" xTicks={11}>
      {(s) => <>
        <Bars s={s} data={cnt.map((c, i) => ({ x: i + 2, y: c / n }))} width={0.7} highlight={(i) => i === 5} />
        {WAYS.map((w, i) => <Seg key={i} s={s} x1={i + 2 - 0.42} y1={w / 36} x2={i + 2 + 0.42} y2={w / 36} color={C.green} width={3} />)}
        {WAYS.map((w, i) => <Label key={'l' + i} s={s} x={i + 2} y={0.228} anchor="middle" size={11} color={C.green}>{w}/36</Label>)}
      </>}
    </Plot>;
  } else {
    const st = f.stage!;
    main = <Plot x={[-1.5, 12.5]} y={[-4.6, 4.6]} height={380} grid={false} xTicks={0} yTicks={0}>
      {(s) => <>
        <Box s={s} x={0} y={0} title="all payments" value="10,000" color={C.text} />
        {st >= 1 && <><Edge s={s} x1={1.1} y1={0.3} x2={3.9} y2={2.4} label="1% fraud" /><Edge s={s} x1={1.1} y1={-0.3} x2={3.9} y2={-2.4} label="99% legit" />
          <Box s={s} x={5} y={2.6} title="fraud" value="100" color={C.red} /><Box s={s} x={5} y={-2.6} title="legitimate" value="9,900" color={C.blue} /></>}
        {st >= 2 && <><Edge s={s} x1={6.1} y1={2.9} x2={8.9} y2={3.6} label="90% flagged" /><Edge s={s} x1={6.1} y1={2.3} x2={8.9} y2={1.6} label="10% missed" />
          <Box s={s} x={10} y={3.6} title="fraud, flagged" value="90" color={C.red} hl={st >= 4} /><Box s={s} x={10} y={1.4} title="fraud, missed" value="10" color={C.muted} /></>}
        {st >= 3 && <><Edge s={s} x1={6.1} y1={-2.3} x2={8.9} y2={-1.6} label="5% flagged" /><Edge s={s} x1={6.1} y1={-2.9} x2={8.9} y2={-3.6} label="95% not" />
          <Box s={s} x={10} y={-1.4} title="legit, flagged" value="495" color={C.gold} hl={st >= 4} /><Box s={s} x={10} y={-3.6} title="legit, not flagged" value="9,405" color={C.muted} /></>}
        {st >= 4 && <Region s={s} x0={8.7} x1={11.3} y0={-2.2} y1={4.4} color={C.gold} opacity={0.08} stroke={C.gold} />}
        {st >= 5 && <Label s={s} x={5} y={0.1} anchor="middle" size={16} color={C.gold}>90 / (90 + 495) = 15.4%</Label>}
      </>}
    </Plot>;
  }
  return (
    <div>
      <Layout
        main={main}
        side={<>
          <Readout items={f.read} />
          <Legend items={f.kind === 'coin' ? [['running share of heads', C.blue], ['true probability ½', C.green], ['typical range ±1/√n', C.green]] : f.kind === 'dice' ? [['observed share', C.blue], ['exact chance (ways/36)', C.green], ['sum = 7', C.gold]] : [['fraud', C.red], ['legitimate', C.blue], ['flagged (the condition)', C.gold]]} />
          <p className="small muted" style={{ margin: 0 }}>{f.kind === 'tree' ? 'Natural frequencies (counts out of 10,000) make conditional probability easy: restrict to the condition, then count.' : 'Two views of probability: count equally likely outcomes, or watch the long-run share. They agree.'}</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{f.cap}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
const BASE = [0.001, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5];

function Playground() {
  const [mode, setMode] = useState<'bayes' | 'coin'>('bayes');
  const [bi, setBi] = useState(2);
  const [sens, setSens] = useState(90);
  const [fpr, setFpr] = useState(5);
  const [pc, setPc] = useState(0.5);
  const [nf, setNf] = useState(500);
  const [seed, setSeed] = useState(1);
  const base = BASE[bi];
  // Bayes: 1,000 people as a 40 × 25 grid of squares
  const N = 1000, nF = Math.round(base * N), tp = Math.round(nF * sens / 100), fn = nF - tp, fp = Math.round((N - nF) * fpr / 100), tn = N - nF - fp;
  const post = (base * sens / 100) / (base * sens / 100 + (1 - base) * fpr / 100);
  const cats = [...Array(tp).fill(0), ...Array(fn).fill(1), ...Array(fp).fill(2), ...Array(tn).fill(3)];
  const CAT_COL = [C.red, C.pink, C.gold, C.grey];
  const xs = useMemo(() => flips(10000, pc, seed), [pc, seed]);
  const run = useMemo(() => running(xs.slice(0, nf)), [xs, nf]);
  return (
    <Layout
      main={mode === 'bayes'
        ? <Plot x={[0, 40]} y={[0, 25]} height={500} grid={false} xTicks={0} yTicks={0}>
          {(s) => <>{cats.map((c, i) => { const x = i % 40, y = 24 - Math.floor(i / 40); return <rect key={i} x={s.sx(x + 0.08)} y={s.sy(y + 0.92)} width={s.sx(0.84) - s.sx(0)} height={s.sy(0) - s.sy(0.84)} fill={CAT_COL[c]} fillOpacity={c === 3 ? 0.35 : 1} rx={1.5} />; })}</>}
        </Plot>
        : <Plot x={[0, lg(Math.max(nf, 10))]} y={[0, 1]} height={360} xLabel="number of flips (log scale)" yLabel="share of heads" fx={fxPow} xTicks={4}>
          {(s) => {
            const pts: V2[] = []; for (let i = 1; i <= nf; i += Math.max(1, Math.floor(nf / 600))) pts.push([lg(i), run[i - 1]]);
            return <>
              <Seg s={s} x1={0} y1={pc} x2={lg(Math.max(nf, 10))} y2={pc} color={C.green} width={2} />
              <path d={polyPath(s, pts)} fill="none" stroke={C.blue} strokeWidth={2} />
            </>;
          }}
        </Plot>}
      side={<>
        <Choice value={mode} onChange={setMode} options={[{ value: 'bayes', label: 'Fraud alert (Bayes)' }, { value: 'coin', label: 'Coin flips' }]} />
        {mode === 'bayes' ? <>
          <Slider label="fraud rate (base rate)" min={0} max={BASE.length - 1} value={bi} onChange={setBi} format={() => `${base * 100}%`} />
          <Slider label="catches fraud (sensitivity)" min={50} max={99} value={sens} onChange={setSens} format={(v) => `${v}%`} />
          <Slider label="false alarm rate" min={1} max={30} value={fpr} onChange={setFpr} format={(v) => `${v}%`} />
          <Legend items={[['fraud, flagged', C.red], ['fraud, missed', C.pink], ['legit, flagged (false alarm)', C.gold], ['legit, not flagged', C.grey]]} />
          <Readout items={[['flagged (of 1,000)', String(tp + fp), C.gold], ['real fraud among them', String(tp), C.red], ['P(fraud | flagged)', `${(post * 100).toFixed(1)}%`, C.green]]} />
          <p className="small muted" style={{ margin: 0 }}>Each square is one of 1,000 payments. Among the flagged squares (red + gold), what share is red? That share is P(fraud | flagged). Push the fraud rate down and the gold false alarms swamp the red.</p>
        </> : <>
          <Slider label="true P(heads)" min={0.05} max={0.95} step={0.05} value={pc} onChange={setPc} format={(v) => v.toFixed(2)} />
          <Slider label="flips" min={10} max={10000} step={10} value={nf} onChange={setNf} format={(v) => v.toLocaleString()} />
          <button className="btn" onClick={() => setSeed(seed + 1)}>🎲 Flip again</button>
          <Readout items={[['observed share', f2(run[run.length - 1], 3), C.blue], ['true probability', f2(pc), C.green], ['gap', f2(Math.abs(run[run.length - 1] - pc), 3), C.red]]} />
          <p className="small muted" style={{ margin: 0 }}>Flip again several times: the first few dozen flips look different every time, the end of the line barely moves. The gap shrinks roughly like 1/√flips.</p>
        </>}
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Three pictures of probability: a coin\'s share of heads settling on ½, two dice settling on the 36-outcome pattern, and a tree of 10,000 card payments that answers "if the fraud alert fires, how likely is fraud?".', steps: [
      { do: 'Step through the coin frames.', notice: 'Early on the share of heads swings wildly; by 5,000 flips it hugs 0.5 inside the narrowing green funnel.' },
      { do: 'Watch the dice frames.', notice: 'The blue bars grow into the tent shape of the green marks; 7 is the most likely sum (6 of 36 ways).' },
      { do: 'Step through the tree to the end.', notice: 'Only **90 of the 585** flagged payments are fraud: **15.4%**, because legitimate payments outnumber fraud 99 to 1.' },
    ] },
    Playground: { what: 'Two experiments. **Fraud alert**: 1,000 payments as squares, coloured by the truth and by the alert. **Coin flips**: a biased coin and its running share of heads.', steps: [
      { do: 'In Fraud alert, drag **fraud rate** down to 0.1%, then up to 20%.', notice: 'With rare fraud almost every flag is a false alarm (gold); with common fraud most flags are real. Same model, very different meaning.' },
      { do: 'Set the false alarm rate to 1%.', notice: 'P(fraud | flagged) jumps: lowering false alarms matters more than catching a few more frauds when fraud is rare.' },
      { do: 'Switch to **Coin flips**, set flips to 10, then press **🎲 Flip again** a few times; repeat with 10,000.', notice: 'Ten flips can land far from the truth; ten thousand barely move. That is the law of large numbers.' },
    ] },
  },
};
export default anim;
