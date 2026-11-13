import { isAnimated } from '../anim/registry';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { depthMap, TOPICS, TRACKS, TOPIC_BY_ID, withAncestors, TrackId } from '../data/curriculum';
import { isUnlocked, useProgress } from '../lib/progress';

const NW = 168, NH = 34, CW = 200, RH = 44, PADX = 20, PADY = 40;

export default function SkillTree() {
  const s = useProgress();
  const nav = useNavigate();
  const [hover, setHover] = useState<string | null>(null);
  const [track, setTrack] = useState<TrackId | 'all'>('all');
  const trackOrder = Object.keys(TRACKS);

  const pos = useMemo(() => {
    const d = depthMap();
    const cols: Record<number, typeof TOPICS> = {};
    TOPICS.forEach((t) => { (cols[d[t.id]] ||= []).push(t); });
    const p: Record<string, { x: number; y: number }> = {};
    Object.entries(cols).forEach(([c, ts]) => {
      ts.sort((a, b) => trackOrder.indexOf(a.track) - trackOrder.indexOf(b.track));
      ts.forEach((t, i) => { p[t.id] = { x: PADX + +c * CW, y: PADY + i * RH }; });
    });
    return p;
  }, []);
  const width = Math.max(...Object.values(pos).map((p) => p.x)) + NW + PADX;
  const height = Math.max(...Object.values(pos).map((p) => p.y)) + NH + PADY;
  const lit = hover ? withAncestors(hover) : null;
  const shown = (id: string) => track === 'all' || TOPIC_BY_ID[id].track === track;

  return (
    <div>
      <h1>🌳 Skill tree</h1>
      <div className="page-intro"><b>What this is:</b> a map of all 69 topics. Arrows point from a topic to the topics that build on it, so read it <b>left to right</b>: the left column needs nothing, and each column only needs topics to its left.
        <ul className="small"><li><b>Hover</b> a box to light up everything it depends on.</li><li><b>Click</b> a box to open its lesson.</li><li>Use the coloured buttons to show one track at a time. 🔒 = prerequisites not yet completed (you can still open it).</li></ul></div>
      <div className="row" style={{ marginBottom: 12 }}>
        <button type="button" aria-pressed={track === 'all'} className={`btn ${track === 'all' ? 'primary' : ''}`} onClick={() => setTrack('all')}>All</button>
        {(Object.keys(TRACKS) as TrackId[]).map((k) => (
          <button type="button" key={k} aria-pressed={track === k} className={`btn ${track === k ? 'primary' : ''}`} onClick={() => setTrack(k)}>
            <span className="dot" aria-hidden="true" style={{ background: TRACKS[k].color }} />{TRACKS[k].title}
          </button>
        ))}
      </div>
      <div className="legend" style={{ marginBottom: 8 }}>
        <span><span className="dot" aria-hidden="true" style={{ background: '#83c167' }} />✓ = done</span>
        <span><span className="dot" aria-hidden="true" style={{ background: '#9a72ac' }} />T = tested out</span>
        <span><span className="dot" aria-hidden="true" style={{ border: '2px solid var(--text)' }} />unlocked</span>
        <span>🔒 dim = locked</span><span>★ = animated</span>
      </div>
      <p className="small muted tree-hint">Keyboard: Tab through the topics, Enter opens one. On a phone, scroll the map sideways.</p>
      <div className="tree-wrap" tabIndex={-1}>
        <svg width={width} height={height} role="group" aria-label="Skill tree of all topics">
          {TOPICS.flatMap((t) => t.prereqs.map((p) => {
            const a = pos[p], b = pos[t.id];
            const on = lit && lit.has(t.id) && lit.has(p);
            const vis = shown(t.id) || shown(p);
            return (
              <path key={p + t.id} d={`M${a.x + NW},${a.y + NH / 2} C${a.x + NW + 30},${a.y + NH / 2} ${b.x - 30},${b.y + NH / 2} ${b.x},${b.y + NH / 2}`}
                aria-hidden="true" fill="none" stroke={on ? '#ffff00' : '#2a3342'} strokeWidth={on ? 2 : 1} opacity={vis ? 1 : 0.15} />
            );
          }))}
          {TOPICS.map((t) => {
            const p = pos[t.id], m = s[t.id], un = isUnlocked(t.id, s);
            const c = TRACKS[t.track].color;
            const dim = (!shown(t.id) ? 0.15 : 1) * (lit && !lit.has(t.id) ? 0.35 : 1);
            return (
              <g key={t.id} className="node" transform={`translate(${p.x},${p.y})`} style={{ cursor: 'pointer', opacity: dim }}
                role="link" tabIndex={shown(t.id) ? 0 : -1}
                aria-label={`${t.title}, ${TRACKS[t.track].title}${m === 'done' ? ', completed' : m === 'tested' ? ', tested out' : !un ? ', locked' : ''}${isAnimated(t.id) ? ', animated' : ''}`}
                onFocus={() => setHover(t.id)} onBlur={() => setHover(null)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nav(`/topic/${t.id}`); } }}
                onMouseEnter={() => setHover(t.id)} onMouseLeave={() => setHover(null)} onClick={() => nav(`/topic/${t.id}`)}>
                <rect width={NW} height={NH} rx={7} fill={m === 'done' ? '#1d3a24' : m === 'tested' ? '#2c2238' : '#151a22'}
                  stroke={m === 'done' ? '#83c167' : m === 'tested' ? '#9a72ac' : un ? '#5b6576' : '#2a3342'} strokeWidth={1.4} opacity={un || m ? 1 : 0.6} />
                <rect width={4} height={NH} rx={2} fill={c} />
                <text x={12} y={21} fill={un || m ? '#e6e9ef' : '#9aa3b2'} fontSize={11.5}>
                  {isAnimated(t.id) ? '★ ' : ''}{t.title.length > (m ? 20 : 22) ? t.title.slice(0, m ? 19 : 21) + '…' : t.title}
                </text>
                {!un && !m && <text x={NW - 16} y={21} fontSize={10}>🔒</text>}
                {m && <text x={NW - 14} y={22} fontSize={12} fontWeight={700} fill={m === 'done' ? '#83c167' : '#c2a3d6'}>{m === 'done' ? '✓' : 'T'}</text>}
                <title>{t.title}: {t.blurb}</title>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
