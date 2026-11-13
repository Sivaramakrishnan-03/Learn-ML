import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CHOOSER } from '../data/chooser';
import { TOPIC_BY_ID } from '../data/curriculum';

export default function Chooser() {
  const [path, setPath] = useState<{ node: string; answer?: string }[]>([{ node: 'start' }]);
  const cur = CHOOSER[path[path.length - 1].node];
  const go = (label: string, next: string) => {
    const p = [...path]; p[p.length - 1] = { ...p[p.length - 1], answer: label }; p.push({ node: next }); setPath(p);
  };
  return (
    <div style={{ maxWidth: 820 }}>
      <h1>🔀 Which model should I use?</h1>
      <p className="muted">Answer a few questions about your problem. This is a starting point, not a law: always compare against a simple baseline.</p>
      <div className="row small" style={{ marginBottom: 16 }}>
        {path.slice(0, -1).map((p, i) => (
          <button key={i} type="button" className="btn" aria-label={`Change answer: ${p.answer}`} onClick={() => setPath(path.slice(0, i + 1).map((x, j) => (j === i ? { node: x.node } : x)))}>{p.answer} <span aria-hidden="true">✕</span></button>
        ))}
      </div>
      {cur.q && <div className="card">
        <div className="chooser-q">{cur.q}</div>
        {cur.options!.map((o) => <button key={o.label} className="opt" onClick={() => go(o.label, o.next)}>{o.label}</button>)}
      </div>}
      {cur.result && <div className="card" style={{ borderColor: '#83c167' }}>
        <div className="muted small">Recommended</div>
        <h2 style={{ color: 'var(--green-text)' }}>{cur.result.title}</h2>
        <p>{cur.result.why}</p>
        <div className="row">{cur.result.topics.map((t) => <Link key={t} className="btn" to={`/topic/${t}`}>{TOPIC_BY_ID[t]?.title} →</Link>)}</div>
        <button className="btn" style={{ marginTop: 14 }} onClick={() => setPath([{ node: 'start' }])}>↺ Start over</button>
      </div>}
    </div>
  );
}
