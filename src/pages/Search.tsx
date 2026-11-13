import { Link, useSearchParams } from 'react-router-dom';
import { TOPICS, TRACKS } from '../data/curriculum';
import { GLOSSARY } from '../data/glossary';

export default function Search() {
  const [params] = useSearchParams();
  const q = (params.get('q') || '').toLowerCase();
  const words = q.split(/\s+/).filter(Boolean);
  const hit = (s: string) => words.every((w) => s.toLowerCase().includes(w));
  const topics = TOPICS.filter((t) => hit(`${t.title} ${t.blurb} ${t.analogy} ${TRACKS[t.track].title}`));
  const terms = GLOSSARY.filter((g) => hit(`${g.term} ${g.def}`));
  return (
    <div style={{ maxWidth: 860 }}>
      <h1>Search: "{params.get('q')}"</h1>
      <h3>Topics ({topics.length})</h3>
      <div className="card" style={{ padding: 0, marginBottom: 18 }}>
        {topics.map((t) => <Link key={t.id} className="topic-row" to={`/topic/${t.id}`}><span className="dot" style={{ background: TRACKS[t.track].color }} />{t.title}<span className="muted small">{t.blurb}</span></Link>)}
        {!topics.length && <p className="muted" style={{ padding: 14 }}>No topics found.</p>}
      </div>
      <h3>Glossary ({terms.length})</h3>
      <div className="card" style={{ padding: 0 }}>
        {terms.map((g) => <div key={g.term} className="topic-row"><b>{g.term}</b><span className="small">{g.def}</span>{g.topic && <Link className="small" to={`/topic/${g.topic}`}>→</Link>}</div>)}
        {!terms.length && <p className="muted" style={{ padding: 14 }}>No terms found.</p>}
      </div>
    </div>
  );
}
