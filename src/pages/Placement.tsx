import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PLACEMENT, PItem } from '../data/placement';
import { linearOrder, TOPIC_BY_ID } from '../data/curriculum';
import { isUnlocked, progress, testOut } from '../lib/progress';

const TOTAL = 8;

/** Adaptive: a correct answer moves you up a level, a miss moves you down. */
function pickNext(level: number, asked: Set<number>) {
  for (const l of [level, level - 1, level + 1, 1, 2, 3]) {
    const i = PLACEMENT.findIndex((q, idx) => q.level === l && !asked.has(idx));
    if (i >= 0) return i;
  }
  return -1;
}

export default function Placement() {
  const [level, setLevel] = useState(1);
  const [asked, setAsked] = useState<Set<number>>(new Set());
  const [cur, setCur] = useState<number>(() => pickNext(1, new Set()));
  const [results, setResults] = useState<{ item: PItem; ok: boolean }[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [applied, setApplied] = useState(false);
  const finished = results.length >= TOTAL || cur < 0;

  const answer = (oi: number) => {
    if (picked !== null) return;
    setPicked(oi);
  };
  const next = () => {
    const item = PLACEMENT[cur];
    const ok = picked === item.answer;
    const nr = [...results, { item, ok }];
    const na = new Set(asked).add(cur);
    const nl = Math.max(1, Math.min(3, level + (ok ? 1 : -1)));
    setResults(nr); setAsked(na); setLevel(nl); setPicked(null);
    setCur(nr.length >= TOTAL ? -1 : pickNext(nl, na));
  };

  if (finished) {
    const passed = results.filter((r) => r.ok).map((r) => r.item.topic);
    const score = passed.length;
    const apply = () => { passed.forEach(testOut); setApplied(true); };
    const s = progress.get();
    const rec = linearOrder().filter((t) => !s[t.id] && isUnlocked(t.id, s)).slice(0, 5);
    return (
      <div>
        <h1>🧭 Your placement</h1>
        <p>You answered <b>{score}/{results.length}</b> correctly. Highest level reached: <b>{['', 'Beginner', 'Practitioner', 'Advanced'][level]}</b>.</p>
        <div className="card" style={{ marginBottom: 14 }}>
          {results.map((r, i) => <div key={i} className="small">{r.ok ? '✅' : '❌'} {TOPIC_BY_ID[r.item.topic].title} <span className="muted">(level {r.item.level})</span></div>)}
        </div>
        {!applied ? <div className="row">
          <button className="btn ok" onClick={apply} disabled={!passed.length}>Test out of {passed.length} topic(s) and their prerequisites</button>
          <button className="btn" onClick={() => window.location.reload()}>Retake</button>
        </div> : <>
          <p>Done. Passed topics and their prerequisites are now marked <span style={{ color: '#9a72ac' }}>tested out</span>. Start with:</p>
          <div className="card">{rec.map((t) => <div key={t.id}><Link to={`/topic/${t.id}`}>{t.title}</Link> <span className="muted small">· {t.blurb}</span></div>)}</div>
        </>}
      </div>
    );
  }
  const item = PLACEMENT[cur];
  return (
    <div style={{ maxWidth: 720 }}>
      <h1>🧭 Placement quiz</h1>
      <p className="muted">{TOTAL} adaptive questions. Get one right and the next is harder; miss one and it eases off. Unsure? Pick your best guess; nothing is recorded until the end.</p>
      <div className="row small muted" style={{ marginBottom: 6 }}>Question {results.length + 1} of {TOTAL} · level {['', 'beginner', 'practitioner', 'advanced'][item.level]}</div>
      <div className="bar" style={{ marginBottom: 16 }}><div style={{ width: `${(results.length / TOTAL) * 100}%` }} /></div>
      <div className="card">
        <h3>{item.q}</h3>
        {item.options.map((o, i) => (
          <button key={i} className={`opt ${picked === null ? '' : i === item.answer ? 'right' : i === picked ? 'wrong' : ''}`} onClick={() => answer(i)} disabled={picked !== null}>{o}</button>
        ))}
        {picked !== null && <div className="row" style={{ marginTop: 8 }}>
          <span className="small">{picked === item.answer ? '✅ Correct' : '❌ Not quite'}. Topic: <Link to={`/topic/${item.topic}`}>{TOPIC_BY_ID[item.topic].title}</Link></span>
          <span className="spacer" /><button className="btn primary" onClick={next}>Next →</button>
        </div>}
      </div>
    </div>
  );
}
