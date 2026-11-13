// Naive Bayes: word-by-word evidence multiplies the prior odds into a posterior (spam filter).
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Bars, Dots, Seg, Label, Caption, Readout, Slider, Toggle, Layout, Legend, useStepPlayer, PlayerControls, Tex, C } from '../viz/kit';

/* ---------- pure helpers ---------- */
const SPAM = C.red, NORM = C.blue;
interface Word { w: string; ps: number; pn: number }
// First two words use the chapter's numbers (P(free|spam)=0.30 …); the rest extend the same email.
const EMAIL_WORDS: Word[] = [
  { w: 'free', ps: 0.30, pn: 0.02 },
  { w: 'meeting', ps: 0.05, pn: 0.20 },
  { w: 'winner', ps: 0.20, pn: 0.01 },
  { w: 'report', ps: 0.04, pn: 0.16 },
];
const EMAIL = ['Get your', 'FREE', 'seat at the', 'MEETING', '… every', 'WINNER', 'receives a full', 'REPORT', 'by mail.'];
const PRIOR = 0.4;

interface NBFrame { k: number; phase: 'prior' | 'look' | 'mult' | 'decide' | 'naive'; s: number; n: number }
function nbFrames(): NBFrame[] {
  const out: NBFrame[] = [{ k: -1, phase: 'prior', s: PRIOR, n: 1 - PRIOR }];
  let s = PRIOR, n = 1 - PRIOR;
  EMAIL_WORDS.forEach((wd, k) => {
    out.push({ k, phase: 'look', s, n });
    s *= wd.ps; n *= wd.pn;
    out.push({ k, phase: 'mult', s, n });
  });
  out.push({ k: 3, phase: 'decide', s, n }, { k: 3, phase: 'naive', s, n });
  return out;
}
const post = (s: number, n: number) => s / (s + n);
const sci = (v: number) => (v === 0 ? '0' : v >= 0.01 ? v.toFixed(v >= 0.1 ? 2 : 3) : v.toExponential(1).replace(/e-(\d+)/, (_, d: string) => '×10⁻' + [...d].map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]).join('')));

/* ---------- Animate ---------- */
function Animate() {
  const frames = useMemo(nbFrames, []);
  const p = useStepPlayer(frames.length, 1700);
  const f = frames[p.i];
  const P = post(f.s, f.n);
  // posterior after each processed word (index 0 = prior only)
  const traj = useMemo(() => {
    const t = [PRIOR]; let s = PRIOR, n = 1 - PRIOR;
    EMAIL_WORDS.forEach((w) => { s *= w.ps; n *= w.pn; t.push(post(s, n)); });
    return t;
  }, []);
  const done = f.phase === 'prior' ? 0 : f.phase === 'look' ? f.k : f.k + 1;
  const cur = f.k >= 0 ? EMAIL_WORDS[f.k] : undefined;
  const lr = cur ? cur.ps / cur.pn : 1;
  const bars = EMAIL_WORDS.flatMap((w, i) => [{ x: i - 0.18, y: w.ps }, { x: i + 0.18, y: w.pn }]);
  const caption = (() => {
    if (f.phase === 'prior') return <>Before reading a single word, all we know is that <b>40% of email is spam</b>. That is the <b>prior</b>: spam score 0.40, normal score 0.60, so P(spam) = 0.40. Each word we read will multiply these scores.</>;
    if (f.phase === 'look') return <>Next word: <b>"{cur!.w}"</b>. In past spam it appeared with probability <b style={{ color: SPAM }}>{cur!.ps.toFixed(2)}</b>, in normal email <b style={{ color: NORM }}>{cur!.pn.toFixed(2)}</b> (gold-outlined bars). So it is <b>{lr >= 1 ? `${lr.toFixed(0)}× more typical of spam` : `${(1 / lr).toFixed(0)}× more typical of normal mail`}</b>.</>;
    if (f.phase === 'mult') return <>Multiply each class's score by its likelihood for "{cur!.w}": spam {sci(f.s / cur!.ps)} × {cur!.ps} = <b style={{ color: SPAM }}>{sci(f.s)}</b>, normal {sci(f.n / cur!.pn)} × {cur!.pn} = <b style={{ color: NORM }}>{sci(f.n)}</b>. Rescaled to add to 1: <b>P(spam) = {P.toFixed(3)}</b>. {lr >= 1 ? 'The evidence pushed towards spam.' : 'This word pulled back towards normal.'}</>;
    if (f.phase === 'decide') return <>All four words read. The scores are tiny numbers, but only their <b>ratio</b> matters: P(spam) = {sci(f.s)} ÷ ({sci(f.s)} + {sci(f.n)}) = <b>{P.toFixed(3)}</b>. Above 0.5, so the filter files it as <b style={{ color: SPAM }}>spam</b>. Notice how "meeting" and "report" pulled the needle down, but "free" and "winner" were much stronger evidence.</>;
    return <>Why <b>"naive"</b>? We simply multiplied the word probabilities, as if each word appeared independently of the others. In real spam "free" and "winner" travel together, so their evidence is partly counted twice and the {(P * 100).toFixed(0)}% is <b>over-confident</b>. The ranking (spam vs normal) is usually still right, which is why naive Bayes works so well for text.</>;
  })();
  return (
    <div>
      <div className="small" style={{ padding: '8px 12px', background: 'var(--bg-3)', borderRadius: 8, marginBottom: 8, lineHeight: 1.9 }}>
        <span className="muted">Email: </span>
        {EMAIL.map((t, i) => {
          const wi = (i - 1) / 2; const isW = i % 2 === 1;
          if (!isW) return <span key={i}> {t} </span>;
          const read = wi < done, now = wi === f.k && f.phase !== 'prior';
          const wd = EMAIL_WORDS[wi];
          return <b key={i} style={{ padding: '1px 6px', borderRadius: 4, border: `2px solid ${now ? C.gold : 'transparent'}`, background: read ? (wd.ps > wd.pn ? 'rgba(252,98,85,0.3)' : 'rgba(88,196,221,0.3)') : 'transparent' }}>{t}</b>;
        })}
      </div>
      <Layout
        main={<>
          <div className="small muted">How often each word appears in past spam (red) and normal email (blue)</div>
          <Plot x={[-0.6, 3.6]} y={[0, 0.34]} height={200} xTicks={4} fx={(v) => (Number.isInteger(v) && EMAIL_WORDS[v] ? `"${EMAIL_WORDS[v].w}"` : '')} yLabel="P(word | class)">
            {(s) => <>
              <Bars s={s} data={bars} width={0.32} color={(i) => (i % 2 ? NORM : SPAM)} />
              {cur && <rect x={s.sx(f.k - 0.4)} y={s.sy(0.335)} width={s.sx(0.8) - s.sx(0)} height={s.sy(0) - s.sy(0.335)} fill="none" stroke={C.gold} strokeWidth={2} rx={4} />}
              {EMAIL_WORDS.map((w, i) => <Label key={i} s={s} x={i} y={Math.max(w.ps, w.pn) + 0.02} anchor="middle" size={12} color={w.ps > w.pn ? SPAM : NORM}>{w.ps > w.pn ? `${(w.ps / w.pn).toFixed(0)}× spam` : `${(w.pn / w.ps).toFixed(0)}× normal`}</Label>)}
            </>}
          </Plot>
          <div className="small muted" style={{ marginTop: 8 }}>P(spam) after reading each word</div>
          <Plot x={[-0.3, 4.3]} y={[0, 1]} height={210} xTicks={5} fx={(v) => (v === 0 ? 'prior' : Number.isInteger(v) && EMAIL_WORDS[v - 1] ? `+"${EMAIL_WORDS[v - 1].w}"` : '')} yLabel="P(spam)">
            {(s) => <>
              <Seg s={s} x1={-0.3} x2={4.3} y1={0.5} y2={0.5} color={C.muted} dash="5 4" width={1.5} />
              <Label s={s} x={4.25} y={0.53} anchor="end" color={C.muted} size={11}>decision line 0.5</Label>
              {traj.slice(0, done + 1).map((v, i) => i > 0 && <Seg key={i} s={s} x1={i - 1} y1={traj[i - 1]} x2={i} y2={v} color={C.yellow} width={2.5} />)}
              <Dots s={s} pts={traj.slice(0, done + 1).map((v, i) => ({ x: i, y: v }))} color={(i) => (i === done ? C.gold : C.yellow)} r={6} animate={false} />
              <Label s={s} x={done === 4 ? done - 0.12 : done + 0.12} y={traj[done] - 0.08} anchor={done === 4 ? 'end' : 'start'} color={C.gold}>{traj[done].toFixed(3)}</Label>
            </>}
          </Plot>
        </>}
        side={<>
          <Readout items={[
            ['spam score', sci(f.s), SPAM],
            ['normal score', sci(f.n), NORM],
            ['this word\'s ratio', cur ? `${lr >= 1 ? lr.toFixed(0) : lr.toFixed(2)}×` : '–', C.gold],
            ['P(spam)', P.toFixed(3), C.yellow],
          ]} />
          <div>
            <div className="small muted">share of the evidence</div>
            <div style={{ display: 'flex', height: 22, borderRadius: 6, overflow: 'hidden', marginTop: 4 }}>
              <div style={{ width: `${P * 100}%`, background: SPAM, transition: 'width .4s' }} />
              <div style={{ flex: 1, background: NORM }} />
            </div>
          </div>
          <Tex block>{'P(\\text{spam}\\mid \\text{words}) \\propto P(\\text{spam})\\prod_i P(w_i\\mid\\text{spam})'}</Tex>
          <Legend items={[['spam', SPAM], ['normal', NORM], ['posterior P(spam)', C.yellow], ['current word', C.gold]]} />
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caption}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
// Training counts: how many of 40 spam / 60 normal emails contain each word.
const VOCAB = [
  { w: 'free', s: 12, n: 1 }, { w: 'winner', s: 8, n: 0 }, { w: 'click', s: 14, n: 3 }, { w: 'offer', s: 10, n: 4 },
  { w: 'meeting', s: 2, n: 12 }, { w: 'report', s: 0, n: 9 }, { w: 'lunch', s: 1, n: 6 },
];
const NS = 40, NN = 60;

function Playground() {
  const [on, setOn] = useState<boolean[]>([true, false, true, false, true, false, false]);
  const [alpha, setAlpha] = useState(1);
  const [prior, setPrior] = useState(0.4);
  const lik = VOCAB.map((v) => ({ ps: (v.s + alpha) / (NS + 2 * alpha), pn: (v.n + alpha) / (NN + 2 * alpha) }));
  let s = prior, n = 1 - prior;
  on.forEach((o, i) => { if (o) { s *= lik[i].ps; n *= lik[i].pn; } });
  const undef = s + n === 0;
  const P = undef ? NaN : s / (s + n);
  const bars = VOCAB.flatMap((_, i) => [{ x: i - 0.18, y: lik[i].ps }, { x: i + 0.18, y: lik[i].pn }]);
  const LIM = 2.5;
  const contrib = VOCAB.map((_, i) => {
    const r = lik[i].ps === 0 ? -Infinity : lik[i].pn === 0 ? Infinity : Math.log10(lik[i].ps / lik[i].pn);
    return { x: i, y: on[i] ? Math.max(-LIM, Math.min(LIM, r)) : 0, inf: on[i] && !isFinite(r) };
  });
  const yMaxL = Math.max(0.4, ...lik.map((l) => Math.max(l.ps, l.pn))) * 1.1;
  const fx = (v: number) => (Number.isInteger(v) && VOCAB[v] ? VOCAB[v].w : '');
  return (
    <Layout
      main={<>
        <div className="small muted">Smoothed likelihoods P(word | class) = (count + α) / (emails + 2α)</div>
        <Plot x={[-0.6, 6.6]} y={[0, yMaxL]} height={190} xTicks={7} fx={fx} yLabel="P(word | class)">
          {(s2) => <>
            <Bars s={s2} data={bars} width={0.32} color={(i) => (i % 2 ? NORM : SPAM)} />
            {VOCAB.map((v, i) => (alpha === 0 && (v.s === 0 || v.n === 0)) && <Label key={i} s={s2} x={i} y={yMaxL * 0.85} anchor="middle" color={C.red} size={12}>zero!</Label>)}
          </>}
        </Plot>
        <div className="small muted" style={{ marginTop: 8 }}>Evidence from each word in the email: log₁₀(P(w|spam) / P(w|normal)). Up = towards spam.</div>
        <Plot x={[-0.6, 6.6]} y={[-LIM, LIM]} height={210} xTicks={7} fx={fx} yLabel="log₁₀ ratio">
          {(s2) => <>
            <Seg s={s2} x1={-0.6} x2={6.6} y1={0} y2={0} color={C.muted} width={1} />
            <Bars s={s2} data={contrib} width={0.5} color={(i) => (contrib[i].y >= 0 ? SPAM : NORM)} />
            {contrib.map((c, i) => c.inf && <Label key={i} s={s2} x={i} y={c.y > 0 ? LIM - 0.45 : -LIM + 0.2} anchor="middle" size={14} color={C.gold}>∞</Label>)}
          </>}
        </Plot>
      </>}
      side={<>
        <div className="small muted">Words in the email:</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          {VOCAB.map((v, i) => <Toggle key={v.w} label={`${v.w} (${v.s}/${v.n})`} value={on[i]} onChange={(b) => setOn(on.map((o, j) => (j === i ? b : o)))} />)}
        </div>
        <Slider label="smoothing α" min={0} max={5} step={0.5} value={alpha} onChange={setAlpha} />
        <Slider label="prior P(spam)" min={0.05} max={0.95} step={0.05} value={prior} onChange={setPrior} format={(v) => v.toFixed(2)} />
        <Readout items={[
          ['spam score', sci(s), SPAM], ['normal score', sci(n), NORM],
          ['P(spam)', undef ? '0 ÷ 0 ?!' : P.toFixed(3), C.yellow], ['verdict', undef ? 'undefined' : P > 0.5 ? 'spam' : 'normal', undef ? C.gold : P > 0.5 ? SPAM : NORM],
        ]} />
        <p className="small muted" style={{ margin: 0 }}>Counts in brackets: emails containing the word out of 40 spam / 60 normal. Set α = 0 and tick <b>winner</b> (never seen in normal mail) or <b>report</b> (never seen in spam): one word overrides all the others. Tick both and the maths breaks.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'A spam filter reads an email **word by word**. Each word multiplies the spam and normal scores by how typical it is of each class, turning the **prior** (40% spam) into a **posterior**.', steps: [
      { do: 'Press **▶ Step** twice.', notice: 'The gold box picks out "free": 0.30 in spam vs 0.02 in normal, so the posterior jumps from 0.40 to about 0.91.' },
      { do: 'Keep stepping through "meeting" and "report".', notice: 'Words typical of normal email pull the yellow line **down**: evidence can push either way.' },
      { do: 'Read the last two frames.', notice: 'Only the **ratio** of the two tiny scores matters, and the "naive" independence assumption makes the final number over-confident.' },
    ] },
    Playground: { what: 'Build your own email from seven words, change the prior and the **Laplace smoothing α**, and watch each word\'s evidence and the verdict.', steps: [
      { do: 'Tick and untick words like **meeting** and **lunch**.', notice: 'Each word adds a bar: red bars push towards spam, blue bars towards normal. The verdict follows the total.' },
      { do: 'Set **α = 0**, then tick **winner**.', notice: 'Because "winner" never appeared in normal training mail, P(winner|normal) = 0 and the email is spam with certainty, no matter what else it says (the ∞ bar).' },
      { do: 'Now tick **report** too, then raise α back to 1.', notice: 'With α = 0 you get 0 ÷ 0. Smoothing adds a pseudo-count so no word is ever "impossible", and the result is sensible again.' },
    ] },
  },
};
export default anim;
