import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { TOPICS, TRACKS, TOPIC_BY_ID } from '../data/curriculum';
import { GLOSSARY } from '../data/glossary';
import { LESSONS, loadAllChapters, DeepLesson, Block } from '../content';

function blockText(b: Block): string {
  if ('p' in b) return b.p; if ('term' in b) return `${b.term}: ${b.def}`; if ('tex' in b) return b.plain;
  if ('steps' in b) return b.steps.join(' '); if ('bullets' in b) return b.bullets.join(' ');
  if ('diagram' in b) return b.diagram.caption; if ('example' in b) return [b.example.title, b.example.setup, ...b.example.steps, b.example.result].join(' ');
  if ('callout' in b) return b.callout; if ('case' in b) return b.case.title + ' ' + b.case.story; if ('think' in b) return b.think.q + ' ' + b.think.a;
  return '';
}
const strip = (s: string) => s.replace(/\*\*|`/g, '');

/** Full-text search across topics, lessons, textbook chapters and the glossary. */
export default function Search() {
  const [params] = useSearchParams();
  const raw = params.get('q') || '';
  const words = raw.toLowerCase().split(/\s+/).filter(Boolean);
  const [chapters, setChapters] = useState<Record<string, DeepLesson> | null>(null);
  useEffect(() => { loadAllChapters().then(setChapters); }, []);
  const hit = (s: string) => { const l = s.toLowerCase(); return words.every((w) => l.includes(w)); };
  const topics = TOPICS.filter((t) => hit(`${t.title} ${t.blurb} ${t.analogy} ${TRACKS[t.track].title} ${LESSONS[t.id]?.why ?? ''} ${(LESSONS[t.id]?.explain ?? []).join(' ')}`));
  const terms = GLOSSARY.filter((g) => hit(`${g.term} ${g.def}`));
  const passages = useMemo(() => {
    if (!chapters || !words.length) return [];
    const out: { id: string; section: string; text: string }[] = [];
    for (const [id, ch] of Object.entries(chapters)) for (const s of ch.sections) for (const b of s.blocks) {
      const t = strip(blockText(b));
      if (t && hit(t)) out.push({ id, section: s.heading, text: t });
    }
    return out.slice(0, 60);
  }, [chapters, raw]);
  const snippet = (t: string) => {
    const l = t.toLowerCase(), i = Math.max(0, l.indexOf(words[0]) - 80);
    const s = (i ? '…' : '') + t.slice(i, i + 260) + (t.length > i + 260 ? '…' : '');
    const re = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    return s.split(re).map((p, k) => (k % 2 ? <mark key={k}>{p}</mark> : p));
  };
  return (
    <div className="reading">
      <h1>Search: "{raw}"</h1>
      <h2 className="h3">Topics ({topics.length})</h2>
      <div className="card" style={{ padding: 0, marginBottom: 18 }}>
        {topics.map((t) => <Link key={t.id} className="topic-row" to={`/topic/${t.id}`}><span className="dot" aria-hidden="true" style={{ background: TRACKS[t.track].color }} />{t.title}<span className="muted small">{t.blurb}</span></Link>)}
        {!topics.length && <p className="muted" style={{ padding: 14 }}>No topics found.</p>}
      </div>
      <h2 className="h3">Inside the textbook chapters ({chapters ? passages.length + (passages.length === 60 ? '+' : '') : 'searching…'})</h2>
      <div className="card" style={{ padding: 0, marginBottom: 18 }}>
        {passages.map((p, i) => <Link key={i} className="topic-row search-hit" to={`/topic/${p.id}`} style={{ display: 'block' }}>
          <b>{TOPIC_BY_ID[p.id]?.title}</b> <span className="muted small">· {p.section}</span><div className="small">{snippet(p.text)}</div>
        </Link>)}
        {chapters && !passages.length && <p className="muted" style={{ padding: 14 }}>No passages found.</p>}
      </div>
      <h2 className="h3">Glossary ({terms.length})</h2>
      <div className="card" style={{ padding: 0 }}>
        {terms.map((g) => <div key={g.term} className="topic-row"><b>{g.term}</b><span className="small">{g.def}</span>{g.topic && <Link className="small" to={`/topic/${g.topic}`} aria-label={`Open the lesson for ${g.term}`}>→</Link>}</div>)}
        {!terms.length && <p className="muted" style={{ padding: 14 }}>No terms found.</p>}
      </div>
    </div>
  );
}
