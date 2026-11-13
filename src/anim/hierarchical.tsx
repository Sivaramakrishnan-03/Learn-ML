// Hierarchical (agglomerative) clustering: points merge pair by pair while a dendrogram grows beside them; cut the tree to get clusters.
import { useMemo, useState } from 'react';
import { polygonHull } from 'd3';
import { TopicAnim } from './types';
import { Plot, Label, Caption, Readout, Slider, Choice, Layout, Legend, useStepPlayer, PlayerControls, C, Scales, fmt } from '../viz/kit';
import { Pt, dist, blobs, moons } from './_unsup-helpers';

/* ---------- pure helpers ---------- */
type Linkage = 'single' | 'complete' | 'average' | 'ward';
const LINK_TEXT: Record<Linkage, string> = {
  single: 'single linkage: distance between the two **closest** members',
  complete: 'complete linkage: distance between the two **farthest** members',
  average: 'average linkage: the **average** of all cross-pair distances',
  ward: 'Ward: how much the within-cluster spread **grows** if they merge',
};
interface Merge { a: number; b: number; h: number; id: number; members: number[]; pair: [number, number] }

function clusterDist(pts: Pt[], A: number[], B: number[], link: Linkage): { d: number; pair: [number, number] } {
  if (link === 'ward') {
    const ca = { x: A.reduce((s, i) => s + pts[i].x, 0) / A.length, y: A.reduce((s, i) => s + pts[i].y, 0) / A.length };
    const cb = { x: B.reduce((s, i) => s + pts[i].x, 0) / B.length, y: B.reduce((s, i) => s + pts[i].y, 0) / B.length };
    const cost = ((A.length * B.length) / (A.length + B.length)) * dist(ca, cb) ** 2;
    let best: [number, number] = [A[0], B[0]], bd = Infinity;
    A.forEach((i) => B.forEach((j) => { const d = dist(pts[i], pts[j]); if (d < bd) { bd = d; best = [i, j]; } }));
    return { d: Math.sqrt(2 * cost), pair: best }; // same height convention as SciPy
  }
  let sum = 0, best: [number, number] = [A[0], B[0]], bd = link === 'complete' ? -1 : Infinity;
  A.forEach((i) => B.forEach((j) => {
    const d = dist(pts[i], pts[j]); sum += d;
    if (link === 'complete' ? d > bd : d < bd) { bd = d; best = [i, j]; }
  }));
  return { d: link === 'average' ? sum / (A.length * B.length) : bd, pair: best };
}

/** Agglomerative clustering. Leaves are 0..n-1, merge k creates cluster n+k. */
function agglomerate(pts: Pt[], link: Linkage): Merge[] {
  const n = pts.length;
  const members = new Map<number, number[]>(pts.map((_, i) => [i, [i]]));
  const cache = new Map<string, { d: number; pair: [number, number] }>();
  const key = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  const merges: Merge[] = [];
  for (let k = 0; k < n - 1; k++) {
    const ids = [...members.keys()];
    let ba = -1, bb = -1, bd = Infinity, bp: [number, number] = [0, 0];
    for (let x = 0; x < ids.length; x++) for (let y = x + 1; y < ids.length; y++) {
      const kk = key(ids[x], ids[y]);
      let v = cache.get(kk);
      if (!v) { v = clusterDist(pts, members.get(ids[x])!, members.get(ids[y])!, link); cache.set(kk, v); }
      if (v.d < bd - 1e-12) { bd = v.d; ba = ids[x]; bb = ids[y]; bp = v.pair; }
    }
    const m = [...members.get(ba)!, ...members.get(bb)!];
    members.delete(ba); members.delete(bb); members.set(n + k, m);
    merges.push({ a: ba, b: bb, h: bd, id: n + k, members: m, pair: bp });
  }
  return merges;
}

/** Leaf order for drawing (children left to right) and x position of every node. */
function layout(n: number, merges: Merge[]) {
  const order: number[] = [];
  const walk = (id: number) => { if (id < n) order.push(id); else { const m = merges[id - n]; walk(m.a); walk(m.b); } };
  if (n === 1) order.push(0); else if (merges.length) walk(merges[merges.length - 1].id);
  const xs = new Map<number, number>(); order.forEach((leaf, i) => xs.set(leaf, i));
  const hs = new Map<number, number>(order.map((l) => [l, 0]));
  merges.forEach((m) => { xs.set(m.id, (xs.get(m.a)! + xs.get(m.b)!) / 2); hs.set(m.id, m.h); });
  return { order, xs, hs };
}

/** Flat clusters after the first `upto` merges (or all merges at height ≤ cut). Labels numbered in leaf order. */
function flatLabels(n: number, merges: Merge[], upto: number, order: number[]) {
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  merges.slice(0, upto).forEach((m) => { const r = m.members.map(find); r.forEach((x) => { parent[x] = r[0]; }); });
  const ids = new Map<number, number>(); const lab = Array(n).fill(0);
  order.forEach((leaf) => { const r = find(leaf); if (!ids.has(r)) ids.set(r, ids.size); lab[leaf] = ids.get(r)!; });
  return { labels: lab, k: ids.size };
}
const mergesBelow = (merges: Merge[], cut: number) => merges.filter((m) => m.h <= cut).length;

/* ---------- drawing pieces ---------- */
const CL = [C.blue, C.pink, C.green, C.purple, C.teal, C.red, C.gold, C.yellow];
function Blob({ s, pts, color, opacity = 0.18 }: { s: Scales; pts: Pt[]; color: string; opacity?: number }) {
  if (pts.length < 2) return null;
  const xy = pts.map((p) => [s.sx(p.x), s.sy(p.y)] as [number, number]);
  const hull = xy.length >= 3 ? polygonHull(xy) : null;
  const poly = hull ?? xy;
  const d = 'M' + poly.map((q) => q.join(',')).join('L') + (hull ? 'Z' : '');
  return <path d={d} fill={color} fillOpacity={opacity} stroke={color} strokeOpacity={opacity} strokeWidth={24} strokeLinejoin="round" strokeLinecap="round" />;
}

function Dendro({ n, merges, upto, cut, colorOf, names, highlight, height = 360, width = 440, onCut }: {
  n: number; merges: Merge[]; upto: number; cut?: number; colorOf?: (leaf: number) => string; names?: string[]; highlight?: number;
  height?: number; width?: number; onCut?: (h: number) => void;
}) {
  const { order, xs, hs } = useMemo(() => layout(n, merges), [n, merges]);
  const hmax = Math.max(merges.length ? merges[merges.length - 1].h : 1, 0.1) * 1.1;
  return (
    <Plot x={[-0.8, n - 0.2]} y={[-hmax * 0.09, hmax]} width={width} height={height} yLabel="merge height (distance)" xLabel={names ? 'stores (leaf order)' : 'points (leaf order)'}
      fx={() => ''} fy={(v) => (v < 0 ? '' : fmt(v))} xTicks={2} onClick={onCut ? (q) => onCut(Math.max(0, q.y)) : undefined}>
      {(s) => <>
        {merges.slice(0, upto).map((m, k) => {
          const xa = xs.get(m.a)!, xb = xs.get(m.b)!, ha = hs.get(m.a)!, hb = hs.get(m.b)!;
          const below = cut !== undefined && m.h <= cut;
          const col = k === highlight ? C.gold : below && colorOf ? colorOf(m.members[0]) : cut !== undefined ? C.grey : C.blue;
          const d = `M${s.sx(xa)},${s.sy(ha)}L${s.sx(xa)},${s.sy(m.h)}L${s.sx(xb)},${s.sy(m.h)}L${s.sx(xb)},${s.sy(hb)}`;
          return <path key={k} d={d} fill="none" stroke={col} strokeWidth={k === highlight ? 3.5 : 2} />;
        })}
        {order.map((leaf, i) => <g key={leaf}>
          <circle cx={s.sx(i)} cy={s.sy(0)} r={n > 30 ? 2.5 : 4} fill={cut !== undefined && colorOf ? colorOf(leaf) : C.blue} />
          {names && <Label s={s} x={i} y={-hmax * 0.065} size={11} anchor="middle" color={C.muted}>{names[leaf]}</Label>}
        </g>)}
        {cut !== undefined && <>
          <line x1={s.pad.l} x2={s.W - s.pad.r} y1={s.sy(cut)} y2={s.sy(cut)} stroke={C.red} strokeWidth={2} strokeDasharray="7 4" />
          <Label s={s} x={n - 0.4} y={cut + hmax * 0.025} anchor="end" color={C.red} size={12}>cut at {cut.toFixed(2)}</Label>
        </>}
      </>}
    </Plot>
  );
}

/* ---------- Animate ---------- */
// Ten stores: (weekday sales, weekend sales) in ₹ lakh/week. S1–S5 are the lesson's worked example.
const STORES: Pt[] = [
  { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 3, y: 5 }, { x: 8, y: 7 }, { x: 9, y: 8 },
  { x: 2.2, y: 4.3 }, { x: 8.6, y: 5.5 }, { x: 5.2, y: 8.4 }, { x: 6.3, y: 9.2 }, { x: 4.4, y: 9.3 },
];
const NAMES = STORES.map((_, i) => `S${i + 1}`);

function Animate() {
  const merges = useMemo(() => agglomerate(STORES, 'complete'), []);
  const n = STORES.length;
  const { order } = useMemo(() => layout(n, merges), [n, merges]);
  const gaps = merges.slice(1).map((m, i) => m.h - merges[i].h);
  const gi = gaps.indexOf(Math.max(...gaps)); // largest jump is between merge gi and gi+1
  const cutGood = (merges[gi].h + merges[gi + 1].h) / 2;
  const cutLow = (merges[gi - 2].h + merges[gi - 1].h) / 2;
  type F = { upto: number; cut?: number; kind: 'start' | 'merge' | 'gap' | 'cut' | 'low' };
  const frames: F[] = [{ upto: 0, kind: 'start' }, ...merges.map((_, k) => ({ upto: k + 1, kind: 'merge' as const })),
    { upto: n - 1, kind: 'gap' }, { upto: n - 1, cut: cutGood, kind: 'cut' }, { upto: n - 1, cut: cutLow, kind: 'low' }];
  const p = useStepPlayer(frames.length, 1500);
  const f = frames[p.i];
  const flat = flatLabels(n, merges, f.cut !== undefined ? mergesBelow(merges, f.cut) : f.upto, order);
  const last = f.kind === 'merge' ? merges[f.upto - 1] : undefined;
  const nameSet = (ids: number[]) => '{' + ids.map((i) => NAMES[i]).sort((a, b) => +a.slice(1) - +b.slice(1)).join(', ') + '}';
  const membersOf = (id: number) => (id < n ? [id] : merges[id - n].members);
  const colorOf = (leaf: number) => CL[flat.labels[leaf] % CL.length];
  const caption =
    f.kind === 'start' ? <>Ten stores, described by weekday and weekend sales. Agglomerative clustering starts with <b>every store as its own cluster</b> (10 clusters). At each step it merges the <b>two closest clusters</b>. Here "closest" uses complete linkage: the distance between the two <b>farthest</b> members.</>
      : f.kind === 'merge' && last ? <>Merge {f.upto}: {nameSet(membersOf(last.a))} + {nameSet(membersOf(last.b))} at height <b>{last.h.toFixed(2)}</b>{membersOf(last.a).length + membersOf(last.b).length > 2 ? <> (the gold dashed line is the farthest pair, {NAMES[last.pair[0]]}–{NAMES[last.pair[1]]}, which defines the distance)</> : <> (the closest pair of stores left)</>}. The dendrogram gets a new <b>gold bracket</b> at that height. {n - f.upto} cluster{n - f.upto > 1 ? 's' : ''} remain.
        {f.upto === n - 1 && <> Everything is now one cluster: the tree is complete.</>}</>
        : f.kind === 'gap' ? <>Read the tree from the top. Merge heights were {merges.map((m) => m.h.toFixed(1)).join(', ')}. The <b>biggest jump</b> is from {merges[gi].h.toFixed(2)} to {merges[gi + 1].h.toFixed(2)}: those last merges glued together groups that were far apart. That gap is where to cut.</>
          : f.kind === 'cut' ? <>Cut the tree at height {f.cut!.toFixed(2)} (red line). Every branch hanging below the line becomes one cluster: <b>{flat.k} store types</b>. Notice we never had to choose k in advance; the tree shows every possible k at once.</>
            : <>Cut lower, at {f.cut!.toFixed(2)}, and you get <b>{flat.k} smaller groups</b>: the same tree, more detail. Hierarchical clustering gives a whole family of answers; you pick the level that is useful for the business.</>;
  const groups = Array.from({ length: flat.k }, (_, c) => STORES.filter((_, i) => flat.labels[i] === c));
  return (
    <div>
      <Layout
        main={<div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 8 }}>
          <Plot x={[0, 10]} y={[0, 10]} width={440} height={360} xLabel="weekday sales (₹ lakh/week)" yLabel="weekend sales (₹ lakh/week)">
            {(s) => <>
              {groups.map((g, c) => {
                const isNew = last && g.length === last.members.length && last.members.every((i) => flat.labels[i] === c);
                return <Blob key={c} s={s} pts={g} color={isNew ? C.gold : f.cut !== undefined ? CL[c % CL.length] : C.teal} opacity={isNew ? 0.28 : 0.15} />;
              })}
              {last && <line x1={s.sx(STORES[last.pair[0]].x)} y1={s.sy(STORES[last.pair[0]].y)} x2={s.sx(STORES[last.pair[1]].x)} y2={s.sy(STORES[last.pair[1]].y)} stroke={C.gold} strokeWidth={2} strokeDasharray="5 4" />}
              {STORES.map((q, i) => <g key={i}>
                <circle cx={s.sx(q.x)} cy={s.sy(q.y)} r={6} fill={f.cut !== undefined ? colorOf(i) : last?.members.includes(i) ? C.gold : C.blue} stroke={C.bg} />
                <text x={s.sx(q.x) + 9} y={s.sy(q.y) - 7} fill={C.text} fontSize={12}>{NAMES[i]}</text>
              </g>)}
            </>}
          </Plot>
          <Dendro n={n} merges={merges} upto={f.upto} cut={f.cut} colorOf={colorOf} names={NAMES} highlight={last ? f.upto - 1 : undefined} />
        </div>}
        side={<>
          <Readout items={[
            ['clusters now', flat.k, C.blue],
            ['merges done', `${f.upto} / ${n - 1}`],
            ['last height', last ? last.h.toFixed(2) : '–', C.gold],
            ['cut height', f.cut !== undefined ? f.cut.toFixed(2) : '–', C.red],
          ]} />
          <Legend items={[['store', C.blue], ['just merged', C.gold], ['cut line', C.red]]} />
          <p className="small muted" style={{ margin: 0 }}>The height of each bracket in the dendrogram is the distance at which those two groups were joined. Tall brackets = groups that are genuinely different.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caption}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
type DataKind = 'blobs' | 'chain' | 'moons';
function dataset(kind: DataKind): Pt[] {
  if (kind === 'blobs') return blobs([{ x: 2.6, y: 3, sd: 0.7, n: 14 }, { x: 7.6, y: 7, sd: 0.7, n: 14 }, { x: 5.3, y: 8.6, sd: 0.55, n: 10 }], 21);
  if (kind === 'chain') {
    const a = blobs([{ x: 2.3, y: 7.5, sd: 0.55, n: 14 }, { x: 7.7, y: 7.5, sd: 0.55, n: 14 }], 5);
    const bridge = Array.from({ length: 9 }, (_, i) => ({ x: 3.0 + i * 0.6, y: 7.4 + Math.sin(i) * 0.15 }));
    return [...a, ...bridge, ...blobs([{ x: 5, y: 2.6, sd: 0.6, n: 10 }], 8)];
  }
  return moons(70, 0.15, 7);
}

function Playground() {
  const [kind, setKind] = useState<DataKind>('blobs');
  const [link, setLink] = useState<Linkage>('complete');
  const pts = useMemo(() => dataset(kind), [kind]);
  const merges = useMemo(() => agglomerate(pts, link), [pts, link]);
  const n = pts.length;
  const hmax = merges[merges.length - 1].h;
  const [cutFrac, setCutFrac] = useState(0.4);
  const cut = cutFrac * hmax;
  const { order } = useMemo(() => layout(n, merges), [n, merges]);
  const flat = flatLabels(n, merges, mergesBelow(merges, cut), order);
  const colorOf = (leaf: number) => CL[flat.labels[leaf] % CL.length];
  const sizes = Array.from({ length: flat.k }, (_, c) => flat.labels.filter((l) => l === c).length).sort((a, b) => b - a);
  return (
    <Layout
      main={<div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 8 }}>
        <Plot x={[0, 10]} y={[0, 10]} width={440} height={360} xLabel="feature 1 (standardised units)" yLabel="feature 2 (standardised units)">
          {(s) => <>{pts.map((q, i) => <circle key={i} cx={s.sx(q.x)} cy={s.sy(q.y)} r={5} fill={colorOf(i)} stroke={C.bg} />)}</>}
        </Plot>
        <Dendro n={n} merges={merges} upto={n - 1} cut={cut} colorOf={colorOf} onCut={(h) => setCutFrac(Math.min(1, h / hmax))} />
      </div>}
      side={<>
        <Choice label="Data" value={kind} onChange={setKind} options={[{ value: 'blobs', label: '3 blobs' }, { value: 'chain', label: 'Bridge' }, { value: 'moons', label: 'Moons' }]} />
        <Choice label="Linkage" value={link} onChange={setLink} options={(['single', 'complete', 'average', 'ward'] as Linkage[]).map((v) => ({ value: v, label: v }))} />
        <Slider label="cut height" min={0} max={1} step={0.01} value={cutFrac} onChange={setCutFrac} format={() => cut.toFixed(2)} />
        <Readout items={[['clusters', flat.k, C.blue], ['largest sizes', sizes.slice(0, 3).join(' · ')], ['tree height', hmax.toFixed(2)]]} />
        <p className="small muted" style={{ margin: 0 }}>Click anywhere on the dendrogram to move the cut there. Using {LINK_TEXT[link].replace(/\*\*/g, '')}.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Ten stores (weekday vs weekend sales) are merged **two clusters at a time**, closest first. Each merge adds a bracket to the **dendrogram** on the right at the height (distance) where it happened.', steps: [
      { do: 'Press **▶ Step** a few times.', notice: 'The gold dashed line shows the pair that defines the distance (complete linkage = farthest pair), and a gold bracket appears at that height in the tree.' },
      { do: 'Keep stepping until the tree is complete.', notice: 'Early merges are low (similar stores); the last two merges are much taller.' },
      { do: 'Step to the **cut** frames at the end.', notice: 'A red line cuts the tree: each branch below it is a cluster. Cutting lower gives more, smaller clusters.' },
    ] },
    Playground: { what: 'Choose a dataset and a **linkage rule**, then drag the **cut height** (or click on the dendrogram) to choose how many clusters you get.', steps: [
      { do: 'With **3 blobs**, drag the cut slider from high to low.', notice: 'There is a wide range of heights that gives exactly 3 clusters: a sign the grouping is real.' },
      { do: 'Switch to **Bridge** and compare **single** with **ward**.', notice: 'Single linkage "chains" along the bridge and glues the two top groups together early; Ward keeps compact groups apart.' },
      { do: 'Try **Moons** with **single** linkage.', notice: 'Single linkage follows the crescents (like DBSCAN), while complete and Ward cut them into round pieces.' },
    ] },
  },
};
export default anim;
