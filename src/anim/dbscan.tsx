// DBSCAN: eps-circles reveal core / border / noise points; clusters spread through dense regions (moons that k-means fails on).
import { useMemo, useState } from 'react';
import { TopicAnim } from './types';
import { Plot, Caption, Readout, Slider, Choice, Toggle, Layout, Legend, useStepPlayer, PlayerControls, C, Scales } from '../viz/kit';
import { Pt, dist, moons, rings, blobs, kmeansLabels } from './_unsup-helpers';

/* ---------- pure helpers ---------- */
type Kind = 'core' | 'border' | 'noise';
const CL = [C.teal, C.pink, C.purple, C.blue, C.green, C.gold, C.red, C.yellow];

function neighbours(pts: Pt[], eps: number) {
  return pts.map((p) => pts.map((q, j) => (dist(p, q) <= eps ? j : -1)).filter((j) => j >= 0)); // includes the point itself
}
/** DBSCAN that also records the order in which each cluster spreads (BFS layers). */
function dbscan(pts: Pt[], eps: number, minPts: number) {
  const nb = neighbours(pts, eps);
  const isCore = nb.map((l) => l.length >= minPts);
  const label = pts.map(() => -1);
  const layers: number[][][] = []; // layers[cluster][wave] = point indices reached in that wave
  let c = 0;
  pts.forEach((_, i) => {
    if (label[i] !== -1 || !isCore[i]) return;
    label[i] = c;
    const waves: number[][] = [[i]];
    let front = [i];
    while (front.length) {
      const next: number[] = [];
      front.forEach((j) => { if (isCore[j]) nb[j].forEach((k) => { if (label[k] === -1) { label[k] = c; next.push(k); } }); });
      if (next.length) waves.push(next);
      front = next;
    }
    layers.push(waves); c++;
  });
  const kind: Kind[] = pts.map((_, i) => (isCore[i] ? 'core' : label[i] >= 0 ? 'border' : 'noise'));
  return { nb, kind, label, layers, k: c };
}

function EpsCircle({ s, p, eps, color, dash, opacity = 1, fill }: { s: Scales; p: Pt; eps: number; color: string; dash?: string; opacity?: number; fill?: string }) {
  const r = Math.abs(s.sx(eps) - s.sx(0));
  return <circle cx={s.sx(p.x)} cy={s.sy(p.y)} r={r} fill={fill ?? 'none'} fillOpacity={0.08} stroke={color} strokeOpacity={opacity} strokeWidth={1.5} strokeDasharray={dash} />;
}
function Point({ s, p, kind, color, ring }: { s: Scales; p: Pt; kind: Kind | 'raw'; color: string; ring?: string }) {
  const x = s.sx(p.x), y = s.sy(p.y);
  return <g>
    {ring && <circle cx={x} cy={y} r={9} fill="none" stroke={ring} strokeWidth={2.5} />}
    {kind === 'noise' ? <path d={`M${x - 4},${y - 4}L${x + 4},${y + 4}M${x + 4},${y - 4}L${x - 4},${y + 4}`} stroke={color} strokeWidth={2.2} />
      : kind === 'border' ? <circle cx={x} cy={y} r={4} fill={C.bg} stroke={color} strokeWidth={2.2} />
        : <circle cx={x} cy={y} r={5} fill={color} stroke={C.bg} />}
  </g>;
}

/* ---------- Animate ---------- */
const EPS = 0.75, MINPTS = 5;
const AX = { xLabel: 'east–west position (km)', yLabel: 'north–south position (km)' };

function Animate() {
  const pts = useMemo(() => [...moons(100, 0.17, 4), { x: 1.2, y: 1.6 }, { x: 8.8, y: 8.6 }, { x: 5.0, y: 8.9 }, { x: 8.9, y: 1.3 }], []);
  const res = useMemo(() => dbscan(pts, EPS, MINPTS), [pts]);
  const km = useMemo(() => kmeansLabels(pts, 2), [pts]);
  // example points for the three roles
  const exCore = res.kind.findIndex((k, i) => k === 'core' && res.nb[i].length >= MINPTS + 2);
  const exBorder = res.kind.findIndex((k) => k === 'border');
  const exNoise = res.kind.findIndex((k) => k === 'noise');
  type F = { kind: 'raw' | 'kmeans' | 'role' | 'cores' | 'grow' | 'done'; who?: number; cl?: number; wave?: number };
  const frames: F[] = [{ kind: 'raw' }, { kind: 'kmeans' }];
  [exCore, exBorder, exNoise].forEach((w) => { if (w >= 0) frames.push({ kind: 'role', who: w }); });
  frames.push({ kind: 'cores' });
  res.layers.forEach((waves, cl) => {
    const steps = Math.min(6, waves.length);
    for (let t = 1; t <= steps; t++) frames.push({ kind: 'grow', cl, wave: Math.round((t / steps) * waves.length) - 1 });
  });
  frames.push({ kind: 'done' });
  const p = useStepPlayer(frames.length, 1300);
  const f = frames[p.i];

  // which points are coloured so far
  const reached = pts.map(() => -1);
  let frontier: number[] = [];
  if (f.kind === 'grow' || f.kind === 'done') {
    res.layers.forEach((waves, cl) => {
      const upto = f.kind === 'done' || cl < f.cl! ? waves.length - 1 : cl === f.cl ? f.wave! : -1;
      waves.slice(0, upto + 1).forEach((w) => w.forEach((i) => { reached[i] = cl; }));
      if (f.kind === 'grow' && cl === f.cl) frontier = waves[f.wave!];
    });
  }
  const nCore = res.kind.filter((k) => k === 'core').length, nBorder = res.kind.filter((k) => k === 'border').length, nNoise = res.kind.filter((k) => k === 'noise').length;
  const role = f.who !== undefined ? res.kind[f.who] : undefined;
  const cnt = f.who !== undefined ? res.nb[f.who].length : 0;
  const coreNear = f.who !== undefined ? res.nb[f.who].find((j) => j !== f.who && res.kind[j] === 'core') : undefined;
  const reachedCount = reached.filter((r) => r >= 0).length;

  const caption =
    f.kind === 'raw' ? <>Delivery drop-offs on a city map: two curved neighbourhoods (crescents) and a few one-off orders far from everything. We want the algorithm to find the <b>two crescents</b> and to <b>leave the strays out</b>.</>
      : f.kind === 'kmeans' ? <>First, k-means with k = 2. It splits the map with a <b>straight boundary</b> between two centres (✚), so each colour grabs half of both crescents, and the strays are forced into a cluster too. <b>Distance to a centre is the wrong idea of "together" here.</b></>
        : f.kind === 'role' && role === 'core' ? <>DBSCAN thinks locally. Draw a circle of radius <b>eps = {EPS} km</b> around a point and count who is inside (including itself): <b>{cnt} points ≥ min_samples = {MINPTS}</b>. This point sits in a dense area, so it is a <b>core point</b>.</>
          : f.kind === 'role' && role === 'border' ? <>This point has only <b>{cnt} point{cnt > 1 ? 's' : ''}</b> within eps (fewer than {MINPTS}), so it is not core. But it lies inside the circle of a core point (gold ring), so it is a <b>border point</b>: on the edge of a cluster, allowed to join but not to spread it.</>
            : f.kind === 'role' ? <>This stray order has <b>{cnt === 1 ? 'nobody' : cnt - 1 + ' point(s)'}</b> within eps and is not near any core point. It is <b>noise</b> (label −1). DBSCAN is allowed to say "this belongs nowhere"; k-means is not.</>
              : f.kind === 'cores' ? <>Do this for every point: <b>{nCore} core</b> (filled), <b>{nBorder} border</b> (hollow) and <b>{nNoise} noise</b> (✕). The faint circles are the eps-neighbourhoods of the core points. Overlapping circles form chains of density.</>
                : f.kind === 'grow' ? <>Cluster {f.cl! + 1} spreads: starting from one core point, it repeatedly adds everything inside the circles of its <b>core</b> members (gold circles = the current wave). Wave {f.wave! + 1} of {res.layers[f.cl!].length}. <b>{reachedCount} points</b> are now in a cluster. Notice how it follows the curve.</>
                  : <>Done. DBSCAN found <b>{res.k} clusters by itself</b> (we never said k = 2), each following its crescent, and labelled <b>{nNoise} stray orders as noise</b>. Its two knobs are eps (how close is "near") and min_samples (how many neighbours make "dense").</>;

  return (
    <div>
      <Layout
        main={<Plot x={[0, 10]} y={[0, 10]} height={420} {...AX}>
          {(s) => <>
            {f.kind === 'kmeans' && km.centres.length === 2 && (() => {
              const [a, b] = km.centres, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = -(b.y - a.y), dy = b.x - a.x, L = 20 / Math.hypot(dx, dy);
              return <line x1={s.sx(mx - dx * L)} y1={s.sy(my - dy * L)} x2={s.sx(mx + dx * L)} y2={s.sy(my + dy * L)} stroke={C.yellow} strokeWidth={2} strokeDasharray="7 5" />;
            })()}
            {f.kind === 'cores' && pts.map((q, i) => res.kind[i] === 'core' && <EpsCircle key={'c' + i} s={s} p={q} eps={EPS} color={C.teal} opacity={0.25} />)}
            {f.kind === 'grow' && frontier.map((i) => res.kind[i] === 'core' && <EpsCircle key={'g' + i} s={s} p={pts[i]} eps={EPS} color={C.gold} fill={C.gold} />)}
            {f.kind === 'role' && f.who !== undefined && <>
              <EpsCircle s={s} p={pts[f.who]} eps={EPS} color={C.yellow} fill={C.yellow} />
              {role === 'border' && coreNear !== undefined && <EpsCircle s={s} p={pts[coreNear]} eps={EPS} color={C.gold} dash="5 4" />}
            </>}
            {pts.map((q, i) => {
              if (f.kind === 'raw') return <Point key={i} s={s} p={q} kind="raw" color={C.blue} />;
              if (f.kind === 'kmeans') return <Point key={i} s={s} p={q} kind="raw" color={CL[km.labels[i] + 1]} />;
              if (f.kind === 'role') {
                const inside = f.who !== undefined && res.nb[f.who].includes(i);
                return <Point key={i} s={s} p={q} kind="raw" color={i === f.who ? C.yellow : inside ? C.gold : C.blue} ring={i === coreNear && role === 'border' ? C.gold : undefined} />;
              }
              const k = res.kind[i];
              const col = reached[i] >= 0 ? CL[reached[i]] : k === 'noise' ? C.muted : C.grey;
              return <Point key={i} s={s} p={q} kind={k} color={f.kind === 'cores' && k !== 'noise' ? C.blue : col} ring={frontier.includes(i) ? C.gold : undefined} />;
            })}
            {f.kind === 'kmeans' && km.centres.map((c, j) => <g key={j} transform={`translate(${s.sx(c.x)},${s.sy(c.y)})`}>
              <circle r={11} fill={C.bg} stroke={CL[j + 1]} strokeWidth={3} /><path d="M-6,0H6M0,-6V6" stroke={CL[j + 1]} strokeWidth={3} />
            </g>)}
          </>}
        </Plot>}
        side={<>
          <Readout items={[
            ['eps', `${EPS} km`, C.yellow], ['min_samples', MINPTS],
            ['core', f.kind === 'cores' || f.kind === 'grow' || f.kind === 'done' ? nCore : '–'], ['border', f.kind === 'cores' || f.kind === 'grow' || f.kind === 'done' ? nBorder : '–'],
            ['noise', f.kind === 'cores' || f.kind === 'grow' || f.kind === 'done' ? nNoise : '–', C.muted],
            ['clustered', f.kind === 'grow' || f.kind === 'done' ? `${reachedCount}/${pts.length}` : '–', C.teal],
          ]} />
          <Legend items={[['core (filled)', C.blue], ['border (hollow)', C.blue], ['noise ✕', C.muted], ['eps circle', C.yellow], ['current wave', C.gold]]} />
          <p className="small muted" style={{ margin: 0 }}>Rule of the game: a cluster is a chain of <b>core points</b> whose eps-circles overlap, plus the border points they touch.</p>
        </>}
      />
      <PlayerControls p={p} />
      <Caption>{caption}</Caption>
    </div>
  );
}

/* ---------- Playground ---------- */
type Data = 'moons' | 'rings' | 'density';
function dataset(d: Data): Pt[] {
  if (d === 'moons') return [...moons(110, 0.2, 5), { x: 1.1, y: 1.4 }, { x: 8.8, y: 8.7 }, { x: 8.9, y: 1.5 }];
  if (d === 'rings') return rings(150, 6);
  return blobs([{ x: 3, y: 6.5, sd: 0.35, n: 40 }, { x: 7, y: 4, sd: 1.3, n: 40 }], 9); // one tight, one loose cluster
}

function Playground() {
  const [data, setData] = useState<Data>('moons');
  const [added, setAdded] = useState<Pt[]>([]);
  const [eps, setEps] = useState(0.8);
  const [minPts, setMinPts] = useState(5);
  const [circles, setCircles] = useState(false);
  const [view, setView] = useState<'dbscan' | 'kmeans'>('dbscan');
  const pts = useMemo(() => [...dataset(data), ...added], [data, added]);
  const res = useMemo(() => dbscan(pts, eps, minPts), [pts, eps, minPts]);
  const km = useMemo(() => kmeansLabels(pts, Math.max(2, Math.min(6, res.k || 2))), [pts, res.k]);
  const nNoise = res.kind.filter((k) => k === 'noise').length;
  return (
    <Layout
      main={<>
        <Plot x={[0, 10]} y={[0, 10]} height={420} {...AX} onClick={(q) => setAdded([...added, q])}>
          {(s) => <>
            {circles && view === 'dbscan' && pts.map((q, i) => res.kind[i] === 'core' && <EpsCircle key={'c' + i} s={s} p={q} eps={eps} color={CL[res.label[i] % CL.length]} opacity={0.3} />)}
            {pts.map((q, i) => view === 'kmeans'
              ? <Point key={i} s={s} p={q} kind="raw" color={CL[km.labels[i] % CL.length]} />
              : <Point key={i} s={s} p={q} kind={res.kind[i]} color={res.label[i] >= 0 ? CL[res.label[i] % CL.length] : C.muted} />)}
          </>}
        </Plot>
        <p className="small muted" style={{ marginTop: 4 }}>Click on the map to add drop-offs. Add a line of points between the two crescents and watch DBSCAN merge them.</p>
      </>}
      side={<>
        <Choice label="Data" value={data} onChange={(d) => { setData(d); setAdded([]); }} options={[{ value: 'moons', label: 'Moons' }, { value: 'rings', label: 'Rings' }, { value: 'density', label: 'Mixed density' }]} />
        <Slider label="eps (km)" min={0.2} max={2} step={0.05} value={eps} onChange={setEps} format={(v) => v.toFixed(2)} />
        <Slider label="min_samples" min={2} max={12} value={minPts} onChange={setMinPts} />
        <Toggle label="show eps circles of core points" value={circles} onChange={setCircles} />
        <Choice label="Colour by" value={view} onChange={setView} options={[{ value: 'dbscan', label: 'DBSCAN' }, { value: 'kmeans', label: `k-means (k=${Math.max(2, Math.min(6, res.k || 2))})` }]} />
        <Readout items={[['clusters', res.k, C.teal], ['noise points', nNoise, C.muted], ['core', res.kind.filter((k) => k === 'core').length], ['border', res.kind.filter((k) => k === 'border').length]]} />
        <p className="small muted" style={{ margin: 0 }}>Too small an eps: everything is noise. Too large: everything merges into one blob. "Mixed density" has no single eps that suits both clusters.</p>
      </>}
    />
  );
}

const anim: TopicAnim = {
  Animate,
  Playground,
  howto: {
    Animate: { what: 'Delivery drop-offs form **two crescents** plus a few strays. We see k-means fail, then watch DBSCAN label each point **core**, **border** or **noise** with an eps-circle, and grow clusters through dense regions.', steps: [
      { do: 'Step to frame 2.', notice: 'k-means draws a straight split and mixes the two crescents.' },
      { do: 'Step through the three yellow circles.', notice: 'Count the points inside each circle: ≥ 5 means core; fewer but next to a core point means border; isolated means noise.' },
      { do: 'Press **▶ Play** through the growing frames.', notice: 'Each cluster spreads wave by wave through overlapping circles, following the curve. The strays stay grey ✕.' },
    ] },
    Playground: { what: 'Change **eps** and **min_samples** and see the clusters, border points and noise update instantly. Click to add points; compare with k-means.', steps: [
      { do: 'On **Moons**, drag eps down to 0.3, then up to 1.6.', notice: 'Small eps: most points become noise. Large eps: the two crescents merge into one cluster.' },
      { do: 'Switch **Colour by** to k-means, then to **Rings**.', notice: 'k-means slices rings and moons into wedges; DBSCAN (with a good eps) keeps each ring whole.' },
      { do: 'Choose **Mixed density** and try to find one eps that works.', notice: 'An eps small enough for the tight cluster turns the loose cluster into noise: DBSCAN\'s main weakness (HDBSCAN fixes it).' },
    ] },
  },
};
export default anim;
