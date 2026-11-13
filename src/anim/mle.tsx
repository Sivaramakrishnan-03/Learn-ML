// Maximum likelihood: the likelihood curve over the parameter reshapes as data arrive and peaks at the estimate; log-likelihood, sharper hills with more data, and a Poisson example.
import { ReactNode, useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Bars, Dots, FnLine, Seg, Label, Region, Caption, Readout, Slider, Choice, Layout, Legend, useStepPlayer, PlayerControls, rng, C } from '../viz/kit';
import { lgamma, sum, poissonPmf } from '../viz/math';

/* ---------- pure helpers ---------- */
const SEQ = [1, 1, 0, 1, 1, 1, 0, 1, 0, 1]; // 7 conversions in 10 visitors (g-stats2)
const CALLS = [2, 3, 1, 4, 0, 2]; // help-desk calls per hour (g-stats2)
const xlogy = (x: number, y: number) => (x === 0 ? 0 : x * Math.log(y));
/** Binomial (sequence) log-likelihood. */
const binLL = (k: number, n: number) => (p: number) => xlogy(k, p) + xlogy(n - k, 1 - p);
/** Likelihood relative to its maximum (1 at the MLE). */
const binRel = (k: number, n: number) => { const best = n ? binLL(k, n)(k / n) : 0; return (p: number) => Math.exp(binLL(k, n)(p) - best); };
/** Poisson log-likelihood including the −Σ log x! constant. */
const poisLL = (xs: number[]) => { const S = sum(xs), c = sum(xs.map((x) => lgamma(x + 1))); return (l: number) => S * Math.log(l) - xs.length * l - c; };
/** Likelihood interval: parameter values whose log-likelihood is within 1.92 of the maximum (≈ 95%). */
function llInterval(ll: (t: number) => number, best: number, lo: number, hi: number) {
  const top = ll(best), cut = top - 1.92;
  const find = (a: number, b: number) => { for (let i = 0; i < 60; i++) { const m = (a + b) / 2; if ((ll(m) > cut) === (ll(a) > cut)) a = m; else b = m; } return (a + b) / 2; };
  return [ll(lo) > cut ? lo : find(lo, best), ll(hi) > cut ? hi : find(best, hi)];
}

/* ---------- Animate ---------- */
type Stage = 'intro' | 'obs' | 'values' | 'log' | 'more' | 'pois' | 'poisFit';
type Fr = { stage: Stage; n: number };
const FRAMES: Fr[] = [{ stage: 'intro', n: 0 }, ...SEQ.map((_, i) => ({ stage: 'obs' as Stage, n: i + 1 })), { stage: 'values', n: 10 }, { stage: 'log', n: 10 }, { stage: 'more', n: 10 }, { stage: 'pois', n: 10 }, { stage: 'poisFit', n: 10 }];
const PS = [0.5, 0.6, 0.7, 0.8, 0.9];

function Animate() {
  const p = useStepPlayer(FRAMES.length, 1600);
  const f = FRAMES[p.i];
  const k = sum(SEQ.slice(0, f.n)), n = f.n, phat = n ? k / n : NaN;
  const prevK = sum(SEQ.slice(0, Math.max(0, n - 1))), prevN = Math.max(0, n - 1);
  const L10 = (q: number) => Math.exp(binLL(7, 10)(q));
  const ll10 = binLL(7, 10), pll = poisLL(CALLS);
  const isPois = f.stage === 'pois' || f.stage === 'poisFit';
  const last = n ? SEQ[n - 1] : -1;
  const cap: Record<Stage, ReactNode> = {
    intro: <>A landing page gets visitors; each one either converts or not. What conversion rate <b>p</b> best explains what we see? Maximum likelihood tries every possible p and asks: <b>how probable would our exact data be if p were the truth?</b> With no data yet, every p is equally plausible (flat line).</>,
    obs: <>Visitor {n} {last ? <b>converts</b> : <b>does not convert</b>}: so far {k} of {n}. The curve is the likelihood p<sup>{k}</sup>(1 − p)<sup>{n - k}</sup>, scaled so its peak is 1. {last ? 'A conversion pushes the hill to the right' : 'A non-conversion pushes the hill to the left'} and every observation makes it a little narrower. The peak sits at <b>p̂ = {k}/{n} = {phat.toFixed(2)}</b>.</>,
    values: <>The actual likelihood values are tiny (they are probabilities of one exact sequence of 10 outcomes): L(0.5) = 0.000977, L(0.7) = <b>0.002224</b>, L(0.9) = 0.000478. Only their <b>relative</b> sizes matter, and p = 0.7 wins.</>,
    log: <>In practice we maximise the <b>log-likelihood</b> ℓ(p) = 7 log p + 3 log(1 − p): sums are easier than products, and the peak is in the same place. At the top the slope is zero: 7/p − 3/(1 − p) = 0 gives <b>p̂ = 0.7</b>, the sample proportion.</>,
    more: <>Same rate, ten times the data: 70 conversions in 100 visitors (yellow) vs 7 in 10 (grey). Same peak, much <b>sharper hill</b>: far fewer values of p are plausible. The hill's width is the estimate's uncertainty.</>,
    pois: <>A different model, same idea. A help desk logs calls per hour: 2, 3, 1, 4, 0, 2. For a Poisson rate λ, ℓ(λ) = 12 log λ − 6λ − log 576. The hill peaks at <b>λ = 12 ÷ 6 = 2 calls per hour</b> (the MLE): ℓ(1.5) = −10.49, ℓ(2) = −10.04, ℓ(2.5) = −10.36, ℓ(3) = −11.17.</>,
    poisFit: <>With the MLE λ = 2 the fitted Poisson model (yellow) predicts how many of the 6 hours should have 0, 1, 2, … calls; the blue bars are what happened. Now the model can answer staffing questions, e.g. P(5 or more calls in an hour) = <b>{(100 * (1 - [0, 1, 2, 3, 4].reduce((a, j) => a + poissonPmf(j, 2), 0))).toFixed(1)}%</b>.</>,
  };
  const poisFreq = [0, 1, 2, 3, 4, 5].map((j) => CALLS.filter((x) => x === j).length);
  return (
    <div>
      <Layout
        main={<>
          {!isPois && <div className="small muted">Visitors 1–10 (✓ converted, ✗ did not)</div>}
          {!isPois && <Plot x={[0.3, 10.7]} y={[0, 1]} height={100} fx={() => ''} fy={() => ''} grid={false} xTicks={1} yTicks={1}>
            {(s) => <>
              {SEQ.map((v, i) => <g key={i}>
                <circle cx={s.sx(i + 1)} cy={s.sy(0.5)} r={15} fill={i >= n ? 'none' : v ? C.blue : C.grey} stroke={i === n - 1 ? C.gold : C.grid} strokeWidth={i === n - 1 ? 3 : 1.5} />
                {i < n && <text x={s.sx(i + 1)} y={s.sy(0.5) + 5} fill={C.bg} fontSize={15} fontWeight={700} textAnchor="middle">{v ? '✓' : '✗'}</text>}
              </g>)}
            </>}
          </Plot>}
          {(f.stage === 'intro' || f.stage === 'obs' || f.stage === 'more') && (
            <Plot x={[0, 1]} y={[0, 1.12]} height={380} xLabel="conversion rate p (candidate value)" yLabel="likelihood (relative to its peak)" fx={(v) => v.toFixed(1)}>
              {(s) => <>
                {f.stage === 'obs' && n > 1 && <FnLine s={s} f={binRel(prevK, prevN)} color={C.grey} width={1.5} dash="5 4" />}
                {f.stage === 'more' && <FnLine s={s} f={binRel(7, 10)} color={C.grey} width={2} dash="5 4" />}
                <FnLine s={s} f={f.stage === 'more' ? binRel(70, 100) : binRel(k, n)} color={C.yellow} width={3} n={300} />
                {n > 0 && <><Seg s={s} x1={phat} x2={phat} y1={0} y2={1} color={C.gold} width={2} dash="4 3" /><Label s={s} x={Math.min(phat + 0.015, 0.83)} y={1.05} color={C.gold}>p̂ = {f.stage === 'more' ? '70/100' : `${k}/${n}`} = {phat.toFixed(2)}</Label></>}
                {f.stage === 'more' && <><Label s={s} x={0.36} y={0.55} color={C.grey} size={12}>7 of 10</Label><Label s={s} x={0.6} y={0.3} anchor="end" color={C.yellow} size={12}>70 of 100</Label></>}
              </>}
            </Plot>
          )}
          {f.stage === 'values' && (
            <Plot x={[0, 1]} y={[0, 0.0026]} height={380} xLabel="conversion rate p" yLabel="likelihood L(p) = p⁷(1 − p)³" fx={(v) => v.toFixed(1)} fy={(v) => v.toFixed(4)}>
              {(s) => <>
                <FnLine s={s} f={L10} color={C.yellow} width={3} />
                {PS.map((q) => <Seg key={q} s={s} x1={q} x2={q} y1={0} y2={L10(q)} color={C.blue} width={2} />)}
                <Dots s={s} pts={PS.map((q) => ({ x: q, y: L10(q) }))} r={6} color={(i) => (i === 2 ? C.gold : C.blue)} animate={false} />
                {PS.map((q, i) => <Label key={'l' + q} s={s} x={q + (i === 4 ? 0.01 : 0)} y={L10(q) + 0.0001} anchor="middle" size={12} color={i === 2 ? C.gold : C.text}>{L10(q).toFixed(6)}</Label>)}
              </>}
            </Plot>
          )}
          {f.stage === 'log' && (
            <Plot x={[0.3, 1]} y={[-12, -5]} height={380} xLabel="conversion rate p" yLabel="log-likelihood ℓ(p)" fx={(v) => v.toFixed(1)}>
              {(s) => <>
                <FnLine s={s} f={ll10} from={0.3} to={0.995} color={C.yellow} width={3} />
                <Seg s={s} x1={0.6} x2={0.8} y1={ll10(0.7)} y2={ll10(0.7)} color={C.green} width={3} />
                <Label s={s} x={0.7} y={ll10(0.7) + 0.35} anchor="middle" color={C.green} size={12}>slope = 0 at the peak</Label>
                <Dots s={s} pts={PS.map((q) => ({ x: q, y: ll10(q) }))} r={6} color={(i) => (i === 2 ? C.gold : C.blue)} animate={false} />
                {PS.map((q, i) => i !== 2 && <Label key={q} s={s} x={q + (i > 2 ? 0.025 : 0.012)} y={ll10(q) - 0.45} size={12}>{ll10(q).toFixed(2)}</Label>)}
                <Label s={s} x={0.712} y={ll10(0.7) - 0.45} color={C.gold} size={12}>{ll10(0.7).toFixed(2)}</Label>
              </>}
            </Plot>
          )}
          {f.stage === 'pois' && (
            <Plot x={[0.5, 4]} y={[-16, -9]} height={470} xLabel="rate λ (calls per hour)" yLabel="log-likelihood ℓ(λ)">
              {(s) => <>
                <FnLine s={s} f={pll} from={0.5} to={4} color={C.yellow} width={3} />
                <Seg s={s} x1={2} x2={2} y1={-16} y2={pll(2)} color={C.gold} dash="4 3" />
                <Dots s={s} pts={[1.5, 2, 2.5, 3].map((l) => ({ x: l, y: pll(l) }))} r={6} color={(i) => (i === 1 ? C.gold : C.blue)} animate={false} />
                {[1.5, 2, 2.5, 3].map((l) => <Label key={l} s={s} x={l} y={pll(l) + 0.35} anchor="middle" size={12} color={l === 2 ? C.gold : C.text}>{pll(l).toFixed(2)}</Label>)}
                <Label s={s} x={2.05} y={-15.5} color={C.gold}>MLE: λ = 2</Label>
              </>}
            </Plot>
          )}
          {f.stage === 'poisFit' && (
            <Plot x={[-0.6, 6.6]} y={[0, 2.6]} height={470} xLabel="calls in an hour" yLabel="number of hours (out of 6)" xTicks={7}>
              {(s) => <>
                <Bars s={s} data={poisFreq.map((y, x) => ({ x, y }))} width={0.55} color={C.blue} />
                <Dots s={s} pts={[0, 1, 2, 3, 4, 5, 6].map((x) => ({ x, y: 6 * poissonPmf(x, 2) }))} r={7} color={C.yellow} animate={false} />
                {[0, 1, 2, 3, 4, 5, 6].map((x) => <Label key={x} s={s} x={x + 0.12} y={6 * poissonPmf(x, 2) + 0.1} size={11} color={C.yellow}>{(6 * poissonPmf(x, 2)).toFixed(2)}</Label>)}
              </>}
            </Plot>
          )}
        </>}
        side={<>
          <Readout items={isPois ? [['data', '2, 3, 1, 4, 0, 2'], ['total calls', 12], ['hours', 6], ['MLE of λ = mean', '2.00', C.gold], ['ℓ at the MLE', pll(2).toFixed(2), C.yellow]] : [
            ['visitors so far', f.stage === 'more' ? 100 : n],
            ['conversions', f.stage === 'more' ? 70 : k, C.blue],
            ['MLE p̂', n ? (f.stage === 'more' ? '0.70' : phat.toFixed(2)) : '–', C.gold],
            ['log-likelihood at p̂', n ? (f.stage === 'more' ? binLL(70, 100)(0.7) : binLL(k, n)(phat)).toFixed(2) : '–', C.yellow],
          ]} />
          <Legend items={f.stage === 'poisFit' ? [['Poisson(2) prediction', C.yellow], ['observed hours', C.blue]] : isPois ? [['log-likelihood', C.yellow], ['MLE', C.gold]] : [['converted', C.blue], ['did not convert', C.grey], ['likelihood curve', C.yellow], ['previous curve', C.grey], ['MLE p̂', C.gold]]} />
          <p className="small muted" style={{ margin: 0 }}>MLE = the parameter value under which the observed data would have been most probable. For a proportion it is the sample proportion; for a Poisson rate, the sample mean.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{cap[f.stage]}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
type Model = 'binom' | 'pois';
function Playground() {
  const [model, setModel] = useState<Model>('binom');
  const [truth, setTruth] = useState(0.3);
  const [n, setN] = useState(20);
  const [guess, setGuess] = useState(0.5);
  const [seed, setSeed] = useState(1);
  const isB = model === 'binom';
  const tTrue = isB ? Math.min(truth, 0.95) : truth * 10; // slider 0.05–0.95 → λ 0.5–9.5
  const data = useMemo(() => {
    const r = rng(seed * 17 + n + (isB ? 0 : 999));
    if (isB) return Array.from({ length: n }, () => (r() < tTrue ? 1 : 0));
    return Array.from({ length: n }, () => { let k = 0, pr = Math.exp(-tTrue), cdf = pr; const u = r(); while (u > cdf && k < 60) { k++; pr *= tTrue / k; cdf += pr; } return k; });
  }, [seed, n, isB, tTrue]);
  const S = sum(data), mle = S / n;
  const ll = isB ? binLL(S, n) : poisLL(data);
  const range: [number, number] = isB ? [0.001, 0.999] : [0.05, 12];
  const g = isB ? guess : guess * 10 + 0.05;
  const best = isB ? Math.min(Math.max(mle, 0.001), 0.999) : Math.max(mle, 0.05);
  const top = ll(best), [ciLo, ciHi] = llInterval(ll, best, range[0], range[1]);
  const yLo = top - 12;
  const diff = top - ll(g);
  const maxCount = isB ? 1 : Math.max(...data, 6);
  const freq = isB ? [n - S, S] : Array.from({ length: maxCount + 1 }, (_, j) => data.filter((x) => x === j).length);
  const pred = (theta: number) => (isB ? [n * (1 - theta), n * theta] : freq.map((_, j) => n * poissonPmf(j, theta)));
  const yMax = Math.max(...freq, ...pred(g), ...pred(best)) * 1.15 + 0.5;
  return (
    <Layout
      main={<>
        <Plot x={[-0.6, freq.length - 0.4]} y={[0, yMax]} height={200} xLabel={isB ? 'outcome (0 = no conversion, 1 = conversion)' : 'calls in an hour'} yLabel="count" xTicks={Math.min(freq.length, 12)}>
          {(s) => <>
            <Bars s={s} data={freq.map((y, x) => ({ x, y }))} width={0.5} color={C.blue} />
            <Dots s={s} pts={pred(g).map((y, x) => ({ x: x - 0.12, y }))} r={6} color={C.gold} animate={false} />
            <Dots s={s} pts={pred(best).map((y, x) => ({ x: x + 0.12, y }))} r={6} color={C.green} animate={false} />
          </>}
        </Plot>
        <Plot x={range} y={[yLo, top + 1.2]} height={260} xLabel={isB ? 'conversion rate p' : 'rate λ'} yLabel="log-likelihood" fx={(v) => (isB ? v.toFixed(1) : String(+v.toFixed(1)))}>
          {(s) => <>
            <Region s={s} x0={ciLo} x1={ciHi} color={C.green} opacity={0.12} />
            <FnLine s={s} f={(t) => Math.max(yLo - 1, ll(t))} color={C.yellow} width={3} n={400} />
            <Seg s={s} x1={best} x2={best} y1={yLo} y2={top} color={C.green} width={2} />
            <Seg s={s} x1={g} x2={g} y1={yLo} y2={top + 1.2} color={C.gold} width={2} dash="4 3" />
            {ll(g) > yLo && <Dots s={s} pts={[{ x: g, y: ll(g) }]} r={6} color={C.gold} animate={false} />}
            <Label s={s} x={g + (g > best ? 1 : -1) * (range[1] - range[0]) * 0.01} y={top + 0.45} anchor={g > best ? 'start' : 'end'} color={C.gold} size={12}>guess</Label>
            <Seg s={s} x1={tTrue} x2={tTrue} y1={top + 0.3} y2={top + 1.1} color={C.purple} width={4} />
            <Label s={s} x={best + (g > best ? -1 : 1) * (range[1] - range[0]) * 0.01} y={top + 0.45} anchor={g > best ? 'end' : 'start'} color={C.green} size={12}>MLE {mle.toFixed(2)}</Label>
          </>}
        </Plot>
      </>}
      side={<>
        <Choice label="Model" value={model} onChange={(m) => { setModel(m); setGuess(0.5); }} options={[{ value: 'binom', label: 'Conversions (binomial)' }, { value: 'pois', label: 'Calls (Poisson)' }]} />
        <Slider label={isB ? 'true p' : 'true λ'} min={0.05} max={0.95} step={0.05} value={truth} onChange={setTruth} format={(v) => (isB ? v.toFixed(2) : (v * 10).toFixed(1))} />
        <Slider label="sample size n" min={3} max={500} value={n} onChange={setN} />
        <Slider label={isB ? 'your guess for p' : 'your guess for λ'} min={0} max={isB ? 0.99 : 1.1} step={0.01} value={guess} onChange={setGuess} format={(v) => (isB ? v.toFixed(2) : (v * 10 + 0.05).toFixed(2))} />
        <button className="btn" onClick={() => setSeed(seed + 1)}>🎲 New data</button>
        <Readout items={[['MLE', mle.toFixed(3), C.green], ['ℓ at MLE', top.toFixed(2), C.green], ['ℓ at your guess', isFinite(ll(g)) ? ll(g).toFixed(2) : '−∞', C.gold], ['data are this many × more likely under MLE', isFinite(diff) ? (diff > 50 ? '> 10²¹' : Math.exp(diff).toPrecision(3)) : '∞'], ['95% likelihood interval', `${ciLo.toFixed(2)} – ${ciHi.toFixed(2)}`, C.green]]} />
        <p className="small muted" style={{ margin: 0 }}>Gold = your guess, green = MLE, purple tick = the truth that generated the data. Bars are the data; dots are what each parameter value predicts. Increase n and the hill (and green interval) narrows around the truth.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Ten visitors arrive one by one (7 convert). After each, the **likelihood curve** shows how well every candidate conversion rate p explains the data so far; its peak is the **maximum likelihood estimate**. Then the log-likelihood, more data, and a Poisson example.', steps: [
      { do: 'Step through visitors 1–10.', notice: 'Each ✓ shifts the hill right, each ✗ left; the hill narrows. It ends peaked at **p̂ = 0.7**.' },
      { do: 'Continue to the "values" and "log" frames.', notice: 'Raw likelihoods are tiny (L(0.7) = 0.0022) but the log turns them into a smooth hill whose slope is zero at 0.7.' },
      { do: 'Play to the end.', notice: '70/100 gives the same peak but a sharper hill. For call counts the Poisson log-likelihood peaks at **λ = 2**, the sample mean.' },
    ] },
    Playground: { what: 'Generate data from a true parameter, then play **trial and error**: move your guess and compare its log-likelihood with the MLE\'s.', steps: [
      { do: 'Drag **your guess** across the range.', notice: 'The gold line slides down the hill; the predicted dots stop matching the bars, and the "× more likely" number explodes.' },
      { do: 'Set **n = 5**, then **n = 500**.', notice: 'With 5 points the hill is flat and the green interval wide; with 500 it is sharp and sits close to the purple truth.' },
      { do: 'Switch to **Calls (Poisson)**.', notice: 'Same logic, different model: the MLE is the mean count.' },
    ] },
  },
};
export default anim;
