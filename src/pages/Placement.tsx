import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { linearOrder, Topic, TRACKS, TrackId, TOPIC_BY_ID } from '../data/curriculum';
import { QUIZZES, LESSONS, CheckQ } from '../content';
import { isUnlocked, progress, testOut } from '../lib/progress';
import { Md } from '../components/Md';

// Adaptive placement across ALL topics: per track, binary-search the furthest topic you can answer (2 questions per track).
const PER_TRACK = 2;
function question(t: Topic): CheckQ | undefined {
  const bank = QUIZZES[t.id]?.questions;
  const easy = bank?.filter((q) => q.level <= 2) ?? [];
  return easy[0] ?? bank?.[0] ?? LESSONS[t.id]?.check[0];
}
interface Step { track: TrackId; lo: number; hi: number; asked: number; best: number }

export default function Placement() {
  const tracks = useMemo(() => {
    const order = linearOrder();
    return (Object.keys(TRACKS) as TrackId[]).map((k) => ({ k, topics: order.filter((t) => t.track === k) })).filter((x) => x.topics.length);
  }, []);
  const [ti, setTi] = useState(0);
  const [step, setStep] = useState<Step>(() => ({ track: tracks[0].k, lo: 0, hi: tracks[0].topics.length - 1, asked: 0, best: -1 }));
  const [found, setFound] = useState<Record<string, number>>({}); // track -> index of furthest known topic
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [applied, setApplied] = useState(false);
  const total = tracks.length * PER_TRACK;
  const answeredSoFar = ti * PER_TRACK + step.asked;
  const cur = tracks[ti];
  const mid = Math.floor((step.lo + step.hi) / 2);
  const topic = cur?.topics[mid];
  const q = topic ? question(topic) : undefined;

  const next = () => {
    const ok = picked === q!.answer;
    let { lo, hi, best } = step;
    if (ok) { best = Math.max(best, mid); lo = mid + 1; } else hi = mid - 1;
    const asked = step.asked + 1;
    setPicked(null);
    if (asked < PER_TRACK && lo <= hi) { setStep({ ...step, lo, hi, best, asked }); return; }
    const f = { ...found, [cur.k]: best }; setFound(f);
    if (ti + 1 >= tracks.length) { setDone(true); return; }
    const n = tracks[ti + 1]; setTi(ti + 1);
    setStep({ track: n.k, lo: 0, hi: n.topics.length - 1, asked: 0, best: -1 });
  };

  if (done) {
    const known = tracks.flatMap(({ k, topics }) => topics.slice(0, (found[k] ?? -1) + 1));
    const apply = () => { known.forEach((t) => testOut(t.id)); setApplied(true); };
    const s = progress.get();
    const rec = linearOrder().filter((t) => !s[t.id] && isUnlocked(t.id, s)).slice(0, 6);
    return (
      <div className="reading">
        <h1>🧭 Your placement</h1>
        <div className="card" style={{ marginBottom: 14 }}>
          {tracks.map(({ k, topics }) => <div key={k} className="row small" style={{ marginBottom: 4 }}>
            <span className="dot" style={{ background: TRACKS[k].color }} /><b style={{ minWidth: 170 }}>{TRACKS[k].title}</b>
            <span className="muted">{(found[k] ?? -1) + 1} of {topics.length} topics known{found[k] >= 0 ? ` (up to "${topics[found[k]].title}")` : ''}</span>
          </div>)}
        </div>
        {!applied ? <div className="row">
          <button className="btn ok" onClick={apply} disabled={!known.length}>Mark {known.length} topics (and their prerequisites) as tested out</button>
          <button className="btn" onClick={() => location.reload()}>Retake</button>
        </div> : <>
          <p>Done. Start with:</p>
          <div className="card">{rec.map((t) => <div key={t.id}><Link to={`/topic/${t.id}`}>{t.title}</Link> <span className="muted small">· {t.blurb}</span></div>)}</div>
        </>}
      </div>
    );
  }
  return (
    <div className="reading">
      <h1>🧭 Placement quiz</h1>
      <div className="page-intro">{total} adaptive questions covering <b>all {linearOrder().length} topics</b>: for each of the {tracks.length} tracks you get {PER_TRACK} questions, and each answer moves you to a harder or easier topic in that track. Unsure? Pick your best guess.</div>
      <div className="row small muted" style={{ marginBottom: 6 }}>Question {answeredSoFar + 1} of {total} · {TRACKS[cur.k].title} · topic: {TOPIC_BY_ID[topic!.id].title}</div>
      <div className="bar" style={{ marginBottom: 16 }}><div style={{ width: `${(answeredSoFar / total) * 100}%` }} /></div>
      {q ? <div className="card">
        <h3><Md text={q.q} /></h3>
        {q.options.map((o, i) => <button key={i} className={`opt ${picked === null ? '' : i === q.answer ? 'right' : i === picked ? 'wrong' : ''}`} onClick={() => picked === null && setPicked(i)} disabled={picked !== null}><Md text={o} /></button>)}
        {picked !== null && <div className="row" style={{ marginTop: 8 }}>
          <span className="small">{picked === q.answer ? '✅ Correct' : '❌ Not quite'}</span><span className="spacer" />
          <button className="btn primary" onClick={next}>Next →</button>
        </div>}
      </div> : <p>No question available for this topic.</p>}
    </div>
  );
}
