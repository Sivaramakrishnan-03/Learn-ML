import { isAnimated } from '../anim/registry';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TOPICS, TRACKS, TrackId } from '../data/curriculum';
import { LESSONS, minutesOf } from '../content';
import { useProgress } from '../lib/progress';

export default function Playbook() {
  const [q, setQ] = useState('');
  const s = useProgress();
  const hit = (txt: string) => txt.toLowerCase().includes(q.toLowerCase());
  return (
    <div>
      <h1>📚 The Playbook</h1>
      <div className="page-intro">
        Every topic on one page, grouped by track. Use it as a reference: scan the <b>Key point</b> column ("Use when…" for models and tests) to find the right tool for a problem, then open the lesson.
        <ul className="small"><li>✓ marks topics you have completed.</li><li>Type in the box to filter by any word (e.g. "outlier", "forecast", "probability").</li></ul>
      </div>
      <input type="search" placeholder="Filter the playbook…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: '100%', marginBottom: 18 }} />
      {(Object.keys(TRACKS) as TrackId[]).map((tr) => {
        const list = TOPICS.filter((t) => t.track === tr).filter((t) => {
          const l = LESSONS[t.id];
          return !q || hit(`${t.title} ${t.blurb} ${l?.why ?? ''} ${(l?.use ?? []).join(' ')}`);
        });
        if (!list.length) return null;
        return (
          <div key={tr} className="playbook-track">
            <h2><span className="dot" style={{ background: TRACKS[tr].color }} />{TRACKS[tr].title}</h2>
            <div className="card" style={{ padding: 0 }}>
              <div className="playbook-row small muted" style={{ fontWeight: 600 }}><span>Topic</span><span>What it is</span><span>Key point</span><span>Time</span></div>
              {list.map((t) => {
                const l = LESSONS[t.id];
                return (
                  <Link key={t.id} to={`/topic/${t.id}`} className="playbook-row">
                    <span><b>{s[t.id] ? '✓ ' : ''}{t.title}</b>{isAnimated(t.id) && <span className="pill full" style={{ marginLeft: 6 }}>★</span>}</span>
                    <span className="small">{t.blurb}</span>
                    <span className="small muted">{l?.use?.[0] ? <><b>Use when:</b> {l.use[0]}</> : l?.takeaways[0] ?? ''}</span>
                    <span className="small muted">{minutesOf(t.id) ?? '–'} min</span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
