import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GLOSSARY } from '../data/glossary';
import { TOPIC_BY_ID } from '../data/curriculum';

export default function Glossary() {
  const [q, setQ] = useState('');
  const list = GLOSSARY.filter((g) => (g.term + ' ' + g.def).toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{ maxWidth: 860 }}>
      <h1>📖 Glossary</h1>
      <div className="page-intro">Every term in one plain sentence. Type to filter; click a topic name to open the lesson that explains the term properly.</div>
      <input type="search" placeholder="Filter terms…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: '100%', marginBottom: 14 }} />
      <div className="card" style={{ padding: 0 }}>
        {list.map((g) => (
          <div key={g.term} className="topic-row" style={{ alignItems: 'baseline' }}>
            <b style={{ minWidth: 170 }}>{g.term}</b>
            <span style={{ flex: 1 }}>{g.def}</span>
            {g.topic && <Link className="small" to={`/topic/${g.topic}`}>{TOPIC_BY_ID[g.topic]?.title} →</Link>}
          </div>
        ))}
        {!list.length && <p className="muted" style={{ padding: 14 }}>No matching terms.</p>}
      </div>
    </div>
  );
}
