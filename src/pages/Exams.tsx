import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { linearOrder, TRACKS, TrackId, TOPIC_BY_ID } from '../data/curriculum';
import { QUIZZES, LESSONS, QuizQuestion } from '../content';
import { progress } from '../lib/progress';
import { results, useResults } from '../lib/results';
import { rng } from '../lib/datasets';
import { Md } from '../components/Md';

const PASS = 0.7, PER_EXAM = 15;
type Q = QuizQuestion & { topic: string };

function bankFor(track: TrackId): Q[] {
  return linearOrder().filter((t) => t.track === track).flatMap((t) => {
    const qs = QUIZZES[t.id]?.questions ?? (LESSONS[t.id]?.check ?? []).map((c) => ({ ...c, level: 1 as const, kind: 'concept' as const }));
    return qs.map((q) => ({ ...q, topic: t.id }));
  });
}
/** Up to 2 questions per topic, mixed levels, deterministic per attempt seed. */
function draw(track: TrackId, seed: number): Q[] {
  const r = rng(seed);
  const byTopic: Record<string, Q[]> = {};
  bankFor(track).forEach((q) => (byTopic[q.topic] ||= []).push(q));
  const picks: Q[] = [];
  Object.values(byTopic).forEach((qs) => { const sh = [...qs].sort(() => r() - 0.5); picks.push(...sh.slice(0, 2)); });
  return picks.sort(() => r() - 0.5).slice(0, PER_EXAM).sort((a, b) => a.level - b.level);
}

export function ExamList() {
  const res = useResults().exam;
  return (
    <div>
      <h1>🎓 Track exams</h1>
      <div className="page-intro">Each exam draws <b>{PER_EXAM} questions</b> from across a track (up to 2 per topic, easy to hard). You only see the answers after you submit. Score <b>70%+</b> to pass; passing marks the track's topics as "tested out". A new attempt draws different questions.</div>
      <div className="grid g3">
        {(Object.keys(TRACKS) as TrackId[]).map((k) => {
          const n = bankFor(k).length, r = res[k];
          return (
            <Link key={k} to={`/exam/${k}`} className="card mode-card">
              <h3><span className="dot" style={{ background: TRACKS[k].color }} />{TRACKS[k].title}</h3>
              <p className="small muted" style={{ margin: 0 }}>{n} questions in the bank</p>
              {r && <p className="small" style={{ margin: '6px 0 0' }}>{r.best / r.total >= PASS ? '✅ passed' : '❌ not yet passed'} · best {r.best}/{r.total}</p>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function Exam() {
  const track = (useParams().track ?? '') as TrackId;
  const [seed, setSeed] = useState(() => Date.now() % 100000);
  const qs = useMemo(() => (TRACKS[track] ? draw(track, seed) : []), [track, seed]);
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  if (!TRACKS[track]) return <p>Unknown track. <Link to="/exams">All exams</Link></p>;
  const score = qs.filter((q, i) => picked[i] === q.answer).length;
  const submit = () => {
    setSubmitted(true);
    results.exam(track, score, qs.length);
    if (score / qs.length >= PASS) progress.markTested(linearOrder().filter((t) => t.track === track).map((t) => t.id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const restart = () => { setSeed(seed + 1); setPicked({}); setSubmitted(false); };
  const wrongTopics = [...new Set(qs.filter((q, i) => picked[i] !== q.answer).map((q) => q.topic))];
  return (
    <div className="reading">
      <h1>🎓 {TRACKS[track].title} exam</h1>
      {submitted && <div className={`card ${score / qs.length >= PASS ? 'use' : 'avoid'}`} style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>{score} / {qs.length} ({Math.round((score / qs.length) * 100)}%) · {score / qs.length >= PASS ? '✅ Passed' : '❌ Not yet'}</h2>
        {wrongTopics.length > 0 && <p style={{ margin: '8px 0 0' }}>Revise: {wrongTopics.map((t) => <Link key={t} to={`/topic/${t}`} style={{ marginRight: 10 }}>{TOPIC_BY_ID[t].title}</Link>)}</p>}
        <button className="btn" style={{ marginTop: 10 }} onClick={restart}>↺ New attempt (different questions)</button>
      </div>}
      {!submitted && <p className="muted">{qs.length} questions · answered {Object.keys(picked).length}</p>}
      {qs.map((q, i) => (
        <div key={i} className="card" style={{ marginBottom: 12 }}>
          <div className="small muted">Q{i + 1} · {TOPIC_BY_ID[q.topic].title} · level {q.level}</div>
          <p style={{ margin: '4px 0 8px' }}><b><Md text={q.q} /></b></p>
          {q.options.map((o, oi) => {
            const cls = !submitted ? (picked[i] === oi ? 'chosen' : '') : oi === q.answer ? 'right' : picked[i] === oi ? 'wrong' : '';
            return <button key={oi} className={`opt ${cls}`} disabled={submitted} onClick={() => setPicked({ ...picked, [i]: oi })} aria-pressed={picked[i] === oi}><Md text={o} /></button>;
          })}
          {submitted && <p className="small" style={{ marginTop: 6 }}>{picked[i] === q.answer ? '✅' : '❌'} <Md text={q.why} /></p>}
        </div>
      ))}
      {!submitted && <button className="btn primary" disabled={Object.keys(picked).length < qs.length} onClick={submit}>Submit exam</button>}
    </div>
  );
}
