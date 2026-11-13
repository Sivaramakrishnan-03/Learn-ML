// Multiple regression: partial effects ("holding area fixed") and multicollinearity making coefficients unstable.
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Dots, Seg, Label, Caption, Readout, Slider, Layout, Legend, useStepPlayer, PlayerControls, rng, gauss, C } from '../viz/kit';
import { lstsq, mean, corr, clamp } from '../viz/math';

/* ---------- pure helpers ---------- */
// Chennai flats: area in hundreds of sq ft, bedrooms 1–4, price in ₹ lakh. True model: price = 5 + 3.9·area + 1.5·bedrooms + noise.
interface Flat { area: number; bed: number; price: number }
const TRUE = { b0: 5, area: 3.9, bed: 1.5 };
function makeFlats(n: number, seed: number, rho = 0.9, bedEffect = TRUE.bed, noise = 3): Flat[] {
  const r = rng(seed);
  return Array.from({ length: n }, () => {
    const z = gauss(r);
    const area = clamp(10.5 + 2.8 * z, 5, 16);
    const latent = rho * z + Math.sqrt(Math.max(0, 1 - rho * rho)) * gauss(r);
    const bed = clamp(Math.round(2.5 + 1.05 * latent), 1, 4);
    return { area, bed, price: TRUE.b0 + TRUE.area * area + bedEffect * bed + noise * gauss(r) };
  });
}
function fitBoth(d: Flat[]) {
  const [b0, bA, bB] = lstsq(d.map((f) => [1, f.area, f.bed]), d.map((f) => f.price));
  const [s0, sB] = lstsq(d.map((f) => [1, f.bed]), d.map((f) => f.price));
  const rho = corr(d.map((f) => f.area), d.map((f) => f.bed));
  return { b0, bA, bB, s0, sB, rho, vif: 1 / Math.max(1e-6, 1 - rho * rho), mA: mean(d.map((f) => f.area)) };
}
const jit = (i: number) => (((i * 7919) % 101) / 101 - 0.5) * 0.34; // deterministic jitter so 1–4 bedrooms do not stack
const BANDS = [
  { name: 'small (< 900 sq ft)', lo: 0, hi: 9, col: C.teal },
  { name: 'medium (900–1,250)', lo: 9, hi: 12.5, col: C.purple },
  { name: 'large (> 1,250 sq ft)', lo: 12.5, hi: 99, col: C.pink },
];
const band = (a: number) => BANDS.findIndex((b) => a >= b.lo && a < b.hi);
const lak = (v: number) => `₹${v.toFixed(1)}L`;

/* ---------- Animate ---------- */
type Frame = { kind: 'raw' | 'simple' | 'color' | 'band' | 'adjust' | 'eq' | 'refit' | 'contrast'; b?: number; t?: number; k?: number };
const REFITS = 8;

function Animate() {
  const data = useMemo(() => makeFlats(40, 22, 0.98), []);
  const fit = useMemo(() => fitBoth(data), [data]);
  const refits = useMemo(() => Array.from({ length: REFITS }, (_, k) => { const d = makeFlats(40, 100 + k, 0.98); return { d, f: fitBoth(d) }; }), []);
  const indep = useMemo(() => Array.from({ length: REFITS }, (_, k) => fitBoth(makeFlats(40, 300 + k, 0))), []);
  const frames: Frame[] = [
    { kind: 'raw' }, { kind: 'simple' }, { kind: 'color' },
    { kind: 'band', b: 0 }, { kind: 'band', b: 1 }, { kind: 'band', b: 2 },
    { kind: 'adjust', t: 0.5 }, { kind: 'adjust', t: 1 }, { kind: 'eq' },
    ...Array.from({ length: REFITS }, (_, k) => ({ kind: 'refit' as const, k })), { kind: 'contrast' },
  ];
  const p = useStepPlayer(frames.length, 1700);
  const f = frames[p.i];
  const isRefit = f.kind === 'refit' || f.kind === 'contrast';
  const cur = f.kind === 'refit' ? refits[f.k!] : f.kind === 'contrast' ? refits[REFITS - 1] : { d: data, f: fit };
  const D = cur.d, F = cur.f;
  const t = f.kind === 'adjust' ? f.t! : f.kind === 'eq' || isRefit ? 1 : 0;
  // vertical move: price adjusted to the average area (Frisch–Waugh view of "holding area fixed")
  const pts = D.map((d, i) => ({ x: d.bed + jit(i), y: d.price - t * F.bA * (d.area - F.mA) }));
  const lineFit = lstsq(pts.map((q) => [1, q.x]), pts.map((q) => q.y));
  const coloured = ['color', 'band', 'adjust', 'eq'].includes(f.kind);
  const colorOf = (i: number) => (coloured ? BANDS[band(D[i].area)].col : C.blue);
  const shownRefits = f.kind === 'refit' ? refits.slice(0, f.k! + 1) : f.kind === 'contrast' ? refits : [];
  const partialLine = (a: number) => (x: number) => F.b0 + F.bA * a + F.bB * x;
  const bandMean = (b: number) => mean(D.filter((d) => band(d.area) === b).map((d) => d.area));

  const caption = (() => {
    switch (f.kind) {
      case 'raw': return <>Forty Chennai flats. Across the bottom: number of <b>bedrooms</b>; up the side: <b>price</b>. More bedrooms clearly go with higher prices. The question every buyer asks: <b>what is one extra bedroom worth?</b></>;
      case 'simple': return <>A simple regression of price on bedrooms alone (yellow) says each extra bedroom adds <b>{lak(fit.sB)}</b>. A builder might now squeeze a third bedroom into a 1,000 sq ft flat. Hold on.</>;
      case 'color': return <>Colour each flat by its <b>floor area</b>. Bedrooms and area travel together (correlation <b>{fit.rho.toFixed(2)}</b>): the 4-bedroom flats are also the big ones. So the ₹{fit.sB.toFixed(1)}L "bedroom premium" is partly a <b>size premium</b> in disguise.</>;
      case 'band': { const b = f.b!; return <>Look only at the <b style={{ color: BANDS[b].col }}>{BANDS[b].name}</b> flats, i.e. compare flats of about the <b>same size</b>. The multiple-regression line for this size is much flatter: an extra bedroom adds only <b>{lak(fit.bB)}</b>, not {lak(fit.sB)}.</>; }
      case 'adjust': return f.t! < 1
        ? <>Now <b>hold area fixed</b> for everyone: slide each flat up or down by what its extra (or missing) area is worth, {lak(fit.bA)} per 100 sq ft, as if every flat had the average area of {(fit.mA * 100).toFixed(0)} sq ft. Watch the cloud flatten.</>
        : <>Done: every flat is now "average-sized". The yellow line through this adjusted cloud has slope <b>{lak(lineFit[1])}</b> per bedroom. That is exactly the <b>multiple-regression coefficient</b>: the bedroom effect with area held constant.</>;
      case 'eq': return <>Fitting all features together gives <b>price = {fit.b0.toFixed(1)} + {fit.bA.toFixed(2)}·area + {fit.bB.toFixed(2)}·bedrooms</b>. Each coefficient is read "holding the other fixed". The simple slope ({lak(fit.sB)}) answered a different question.</>;
      case 'refit': return f.k === 0
        ? <>But how much should we trust {lak(F.bB)}? Imagine collecting <b>another 40 flats</b> from the same market and refitting. Each refit is one dot in the coefficient map on the right (green ✚ = the true values).</>
        : <>Refit #{f.k! + 1} on fresh flats: area {lak(F.bA)}, bedrooms <b>{lak(F.bB)}</b>. The dots slide along a <b>diagonal ridge</b>: when the model gives more credit to area it gives less to bedrooms. With a correlation of {F.rho.toFixed(2)} (VIF ≈ {F.vif.toFixed(0)}) the data cannot separate them well.</>;
      case 'contrast': return <>Grey dots: the same experiment where bedrooms are <b>unrelated</b> to area. The coefficients stay tight. <b>Multicollinearity does not hurt predictions, it makes the individual coefficients unstable.</b> Fixes: drop one feature, collect more varied data, or use ridge regression.</>;
    }
  })();

  return (
    <div>
      <Layout
        main={<>
          <Plot x={[0.5, 4.5]} y={[15, 90]} height={400} xLabel="bedrooms (jittered so dots don't overlap)" yLabel={t > 0 ? 'price adjusted to average area (₹ lakh)' : 'price (₹ lakh)'} xTicks={4} fx={(v) => (Number.isInteger(v) ? String(v) : '')}>
            {(s) => <>
              {f.kind === 'band' && <Dots s={s} pts={pts.filter((_, i) => band(D[i].area) !== f.b)} color={C.grey} opacity={0.35} animate={false} />}
              {f.kind === 'band'
                ? <Dots s={s} pts={pts.filter((_, i) => band(D[i].area) === f.b)} color={BANDS[f.b!].col} r={6} animate={false} />
                : <Dots s={s} pts={pts} color={colorOf} />}
              {['simple', 'color', 'band'].includes(f.kind) && <Seg s={s} x1={0.5} x2={4.5} y1={fit.s0 + fit.sB * 0.5} y2={fit.s0 + fit.sB * 4.5} color={C.yellow} dash={f.kind === 'simple' ? undefined : '6 4'} />}
              {f.kind === 'band' && <Seg s={s} x1={0.5} x2={4.5} y1={partialLine(bandMean(f.b!))(0.5)} y2={partialLine(bandMean(f.b!))(4.5)} color={BANDS[f.b!].col} width={3} />}
              {(f.kind === 'adjust' || f.kind === 'eq' || isRefit) && <Seg s={s} x1={0.5} x2={4.5} y1={isRefit ? partialLine(F.mA)(0.5) : lineFit[0] + lineFit[1] * 0.5} y2={isRefit ? partialLine(F.mA)(4.5) : lineFit[0] + lineFit[1] * 4.5} color={C.yellow} width={3} />}
              {(f.kind === 'adjust' || f.kind === 'eq') && <Seg s={s} x1={0.5} x2={4.5} y1={fit.s0 + fit.sB * 0.5} y2={fit.s0 + fit.sB * 4.5} color={C.yellow} dash="6 4" width={1.2} />}
              {['simple', 'color', 'band'].includes(f.kind) && <Label s={s} x={3.55} y={fit.s0 + fit.sB * 4.2 + 4} color={C.yellow} size={12} anchor="end">bedrooms only: +{fit.sB.toFixed(1)} per bedroom</Label>}
              {(f.kind === 'adjust' || f.kind === 'eq') && <Label s={s} x={4.4} y={lineFit[0] + lineFit[1] * 4.4 - 4} color={C.yellow} size={12} anchor="end">holding area fixed: +{lineFit[1].toFixed(1)} per bedroom</Label>}
              {isRefit && <Label s={s} x={0.6} y={86} color={C.muted} size={12}>sample #{f.kind === 'refit' ? f.k! + 1 : REFITS} of 40 flats · line = bedroom effect at average area</Label>}
            </>}
          </Plot>
          {coloured && <Legend items={BANDS.map((b) => [b.name, b.col] as [string, string])} />}
        </>}
        side={<>
          <Readout items={[
            ['slope, bedrooms only', lak(F.sB) + '/bed', C.yellow],
            ['b(bedrooms) | area fixed', ['eq', 'adjust', 'band'].includes(f.kind) || isRefit ? lak(F.bB) + '/bed' : '–', C.yellow],
            ['b(area) | bedrooms fixed', ['eq', 'adjust', 'band'].includes(f.kind) || isRefit ? lak(F.bA) + '/100 sq ft' : '–', C.yellow],
            ['corr(area, bedrooms)', F.rho.toFixed(2)],
            ['VIF = 1/(1−r²)', F.vif.toFixed(1), F.vif > 5 ? C.red : C.green],
          ]} />
          <div className="small muted">Coefficient map: one dot per fit</div>
          <Plot x={[2, 6]} y={[-5, 8]} width={340} height={260} xLabel="b(area), ₹L per 100 sq ft" yLabel="b(bedrooms), ₹L" xTicks={4} yTicks={5}>
            {(s) => <>
              <Seg s={s} x1={TRUE.area - 0.15} x2={TRUE.area + 0.15} y1={TRUE.bed} y2={TRUE.bed} color={C.green} width={3} />
              <Seg s={s} x1={TRUE.area} x2={TRUE.area} y1={TRUE.bed - 0.5} y2={TRUE.bed + 0.5} color={C.green} width={3} />
              {f.kind === 'contrast' && <Dots s={s} pts={indep.map((q) => ({ x: q.bA, y: q.bB }))} color={C.muted} r={5} animate={false} />}
              <Dots s={s} pts={shownRefits.map((q) => ({ x: q.f.bA, y: q.f.bB }))} color={(i) => (i === shownRefits.length - 1 && f.kind === 'refit' ? C.gold : C.yellow)} r={5} animate={false} />
              {(f.kind === 'eq' || f.kind === 'adjust') && <Dots s={s} pts={[{ x: fit.bA, y: fit.bB }]} color={C.gold} r={6} animate={false} />}
            </>}
          </Plot>
          <Legend items={[['fitted coefficients', C.yellow], ['true values', C.green], ...(f.kind === 'contrast' ? [['uncorrelated features', C.muted] as [string, string]] : [])]} />
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caption}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
function Playground() {
  const [rho, setRho] = useState(0.9);
  const [n, setN] = useState(40);
  const [bed, setBed] = useState(1.5);
  const [seed, setSeed] = useState(5);
  const data = useMemo(() => makeFlats(n, seed, rho, bed), [n, seed, rho, bed]);
  const F = fitBoth(data);
  const cloud = useMemo(() => Array.from({ length: 40 }, (_, k) => fitBoth(makeFlats(n, 1000 + seed * 50 + k, rho, bed))), [n, seed, rho, bed]);
  const sdB = Math.sqrt(mean(cloud.map((c) => (c.bB - mean(cloud.map((q) => q.bB))) ** 2)));
  const wrongSign = cloud.filter((c) => c.bB < 0).length;
  return (
    <Layout
      main={<>
        <Plot x={[0.5, 4.5]} y={[15, 95]} height={300} xLabel="bedrooms (jittered)" yLabel="price (₹ lakh)" xTicks={4} fx={(v) => (Number.isInteger(v) ? String(v) : '')}>
          {(s) => <>
            <Dots s={s} pts={data.map((d, i) => ({ x: d.bed + jit(i), y: d.price }))} r={4} animate={false} />
            <Seg s={s} x1={0.5} x2={4.5} y1={F.s0 + F.sB * 0.5} y2={F.s0 + F.sB * 4.5} color={C.yellow} dash="6 4" />
            <Seg s={s} x1={0.5} x2={4.5} y1={F.b0 + F.bA * F.mA + F.bB * 0.5} y2={F.b0 + F.bA * F.mA + F.bB * 4.5} color={C.yellow} width={3} />
          </>}
        </Plot>
        <Legend items={[['flats', C.blue], ['dashed: bedrooms only · solid: holding area fixed', C.yellow]]} />
        <Plot x={[1, 7]} y={[-8, 11]} height={250} xLabel="b(area), ₹ lakh per 100 sq ft" yLabel="b(bedrooms), ₹ lakh">
          {(s) => <>
            <Seg s={s} x1={1} x2={7} y1={0} y2={0} color={C.grey} />
            <Dots s={s} pts={cloud.map((c) => ({ x: c.bA, y: c.bB }))} color={C.yellow} r={3.5} opacity={0.7} animate={false} />
            <Dots s={s} pts={[{ x: F.bA, y: F.bB }]} color={C.gold} r={6} animate={false} />
            <Dots s={s} pts={[{ x: TRUE.area, y: bed }]} color={C.green} r={6} animate={false} />
            <Label s={s} x={1.15} y={10} color={C.muted} size={12}>40 refits on fresh samples of {n} flats (gold = your sample, green = truth)</Label>
          </>}
        </Plot>
      </>}
      side={<>
        <Slider label="corr(area, bedrooms)" min={0} max={0.99} step={0.01} value={rho} onChange={setRho} format={(v) => v.toFixed(2)} />
        <Slider label="flats in sample" min={12} max={300} value={n} onChange={setN} />
        <Slider label="true bedroom value (₹ lakh)" min={0} max={6} step={0.5} value={bed} onChange={setBed} format={(v) => v.toFixed(1)} />
        <button className="btn" onClick={() => setSeed(seed + 1)}>🎲 New sample</button>
        <Readout items={[
          ['actual correlation', F.rho.toFixed(2)],
          ['VIF', F.vif.toFixed(1), F.vif > 5 ? C.red : C.green],
          ['bedrooms-only slope', lak(F.sB), C.yellow],
          ['b(bedrooms) | area', lak(F.bB), C.gold],
          ['b(area) | bedrooms', lak(F.bA), C.gold],
          ['spread of b(bedrooms) over refits', '±' + sdB.toFixed(2), sdB > 2 ? C.red : C.text],
          ['refits with wrong sign', `${wrongSign} / 40`, wrongSign ? C.red : C.text],
        ]} />
        <p className="small muted" style={{ margin: 0 }}>Push the correlation towards 0.99 with few flats: the cloud stretches into a long diagonal and some refits even say bedrooms <i>lower</i> the price.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Forty flats priced by **area** and **bedrooms**. We compare the naive "bedrooms only" slope with the multiple-regression effect **holding area fixed**, then refit on new samples to see **multicollinearity** shake the coefficients.', steps: [
      { do: 'Step through the first **three frames**.', notice: 'The bedrooms-only line is steep, but the colours show that big flats have more bedrooms: two effects are mixed.' },
      { do: 'Keep stepping through the **size bands** and the **adjustment** frames.', notice: 'Among flats of the same size the bedroom line is far flatter; sliding every flat to the average area gives exactly the multiple-regression slope.' },
      { do: 'Play the **refit** frames to the end and watch the coefficient map on the right.', notice: 'The dots spread along a diagonal ridge; with uncorrelated features (grey) they stay tight.' },
    ] },
    Playground: { what: 'Control how strongly bedrooms track area, the sample size and the true bedroom value; see one fit and the spread of 40 refits.', steps: [
      { do: 'Set **corr = 0** then drag it to **0.99**.', notice: 'The yellow refit cloud stretches into a long diagonal and the VIF turns red.' },
      { do: 'At corr 0.99, raise **flats in sample** from 12 to 300.', notice: 'More data narrows the cloud: collinearity can be beaten with more (and more varied) data.' },
      { do: 'Set **true bedroom value = 0**.', notice: 'The dashed bedrooms-only line still slopes up steeply, while the solid "area fixed" line goes flat.' },
    ] },
  },
};
export default anim;
