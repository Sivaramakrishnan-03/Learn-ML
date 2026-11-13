import { hasAnim, isAnimated, useTopicAnim } from '../anim/registry';
import { minutesOf } from '../lessons/minutes';
import { Suspense, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { TOPICS, TOPIC_BY_ID, TRACKS, linearOrder } from '../data/curriculum';
import { GLOSSARY } from '../data/glossary';
import { LESSONS } from '../lessons';
import { MODELS } from '../models/registry';
import { MODEL_HOWTO } from '../models/howto';
import { isUnlocked, progress, useProgress } from '../lib/progress';
import { Pipeline } from '../components/Pipeline';
import { MathSteps } from '../components/MathSteps';
import { CodeLab } from '../components/CodeLab';
import { Quiz } from '../components/Quiz';
import { CheatSheet } from '../components/CheatSheet';
import { LessonView } from '../components/LessonView';
import { HowTo, GENERIC_HOWTO } from '../components/HowTo';

const TABS = ['Lesson', 'Animate', 'Playground', 'Pipeline', 'Math', 'Code', 'Quiz', 'Cheat sheet', 'Deep dive'] as const;
type Tab = typeof TABS[number];
const LABEL: Record<Tab, string> = {
  Lesson: '📖 Lesson', Animate: '🎬 Animate', Playground: '🕹 Playground', Pipeline: '🔁 Pipeline', Math: '∑ Math',
  Code: '🐍 Code', Quiz: '✅ Quiz', 'Cheat sheet': '📄 Cheat sheet', 'Deep dive': '📘 Deep dive',
};
const JOURNEY: { tab: Tab; text: string }[] = [
  { tab: 'Lesson', text: 'Read the lesson' }, { tab: 'Animate', text: 'Watch it work' },
  { tab: 'Playground', text: 'Try to break it' }, { tab: 'Quiz', text: 'Test yourself' },
];

export default function TopicPage() {
  const { id = '' } = useParams();
  const t = TOPIC_BY_ID[id];
  const s = useProgress();
  const [tab, setTab] = useState<Tab>('Lesson');
  useEffect(() => { setTab('Lesson'); }, [id]);
  const ta = useTopicAnim(id);
  if (!t) return <p>Unknown topic. <Link to="/tree">Back to the skill tree</Link></p>;
  const model = MODELS[id];
  const lesson = LESSONS[id];
  const howto = MODEL_HOWTO[id];
  const unlocks = TOPICS.filter((x) => x.prereqs.includes(id));
  const order = linearOrder();
  const idx = order.findIndex((x) => x.id === id);
  const prev = order[idx - 1], next = order[idx + 1];
  const terms = GLOSSARY.filter((g) => g.topic === id);
  const mark = s[id];
  const complete = () => { if (!progress.get()[id]) progress.toggle(id); };
  const go = (x: Tab) => { setTab(x); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <div key={id}>
      <div className="row" style={{ marginBottom: 6 }}>
        <span className="small muted">Step {idx + 1} of {order.length} in the linear track</span>
        <span className="pill" style={{ borderColor: TRACKS[t.track].color, color: TRACKS[t.track].color }}>{TRACKS[t.track].title}</span>
        <span className="pill">{['', 'beginner', 'practitioner', 'advanced'][t.level]}</span>
        {lesson && <span className="pill">~{minutesOf(id)} min read</span>}
        {isAnimated(id) && <span className="pill full">★ animated</span>}
        <span className="spacer" />
        <button className={`btn ${mark ? 'ok' : ''}`} onClick={() => progress.toggle(id)}>{mark ? '✓ Completed' : 'Mark complete'}</button>
      </div>
      <h1>{t.title}</h1>
      <p style={{ fontSize: '1.08rem', marginBottom: 10 }}>{t.blurb}</p>
      <div className="caption" style={{ marginBottom: 12 }}>💡 <b>Analogy:</b> {t.analogy}</div>

      <details className="prereq-box">
        <summary>
          {t.prereqs.length === 0 ? '✅ No prerequisites: a good starting point.'
            : isUnlocked(id, s) ? `✅ You have completed the ${t.prereqs.length} topic(s) this builds on.`
              : `🔒 This builds on ${t.prereqs.filter((p) => !s[p]).length} topic(s) you haven't completed yet. You can still read it.`}
        </summary>
        <div className="row small" style={{ marginTop: 8 }}>
          <span className="muted">Builds on:</span>
          {t.prereqs.length ? t.prereqs.map((p) => <Link key={p} to={`/topic/${p}`}>{s[p] ? '✓ ' : '○ '}{TOPIC_BY_ID[p].title}</Link>) : <span>nothing</span>}
        </div>
        <div className="row small" style={{ marginTop: 4 }}>
          <span className="muted">Leads to:</span>
          {unlocks.length ? unlocks.map((u) => <Link key={u.id} to={`/topic/${u.id}`}>{u.title}</Link>) : <span>—</span>}
        </div>
      </details>

      {model ? <>
        <div className="journey">
          <span className="small muted">Suggested path:</span>
          {JOURNEY.map((j, i) => (
            <button key={j.tab} className={`journey-step ${tab === j.tab ? 'on' : ''}`} onClick={() => go(j.tab)}>
              <span className="journey-n">{i + 1}</span>{j.text}
            </button>
          ))}
        </div>
        <div className="tabs">
          {TABS.filter((x) => (x !== 'Deep dive' || model.Guide) && (x !== 'Lesson' || lesson)).map((x) => (
            <button key={x} className={`tab ${tab === x ? 'active' : ''}`} onClick={() => setTab(x)}>
              {LABEL[x]}{x === 'Deep dive' ? ' · 20 chapters' : ''}
            </button>
          ))}
        </div>
        {tab === 'Lesson' && lesson && <>
          <LessonView topic={t} lesson={lesson} onPass={complete} />
          <div className="card next-card">
            <b>Next on this page →</b> <button className="btn primary" onClick={() => go('Animate')}>🎬 Watch it work</button>
            {model.Guide && <> <span className="muted small">or, for the full professional treatment,</span> <button className="btn" onClick={() => go('Deep dive')}>📘 Deep dive (20 chapters, ~6 h)</button></>}
          </div>
        </>}
        {tab === 'Animate' && <><HowTo spec={howto?.Animate} /><model.Animate /></>}
        {tab === 'Playground' && <><HowTo spec={howto?.Playground} /><model.Playground /></>}
        {tab === 'Pipeline' && <><HowTo spec={GENERIC_HOWTO.Pipeline} /><Pipeline stages={model.pipeline} /></>}
        {tab === 'Math' && <><HowTo spec={GENERIC_HOWTO.Math} /><MathSteps steps={model.math} /></>}
        {tab === 'Code' && <><HowTo spec={GENERIC_HOWTO.Code} /><CodeLab snippets={model.code} /></>}
        {tab === 'Quiz' && <><HowTo spec={GENERIC_HOWTO.Quiz} /><Quiz items={model.quiz} onPass={complete} /></>}
        {tab === 'Cheat sheet' && <><HowTo spec={GENERIC_HOWTO['Cheat sheet']} /><CheatSheet>{model.cheatsheet}</CheatSheet></>}
        {tab === 'Deep dive' && model.Guide && <>
          <div className="caption" style={{ marginBottom: 12 }}>📘 This is the <b>practitioner-level</b> guide: assumptions, diagnostics, inference, model selection and more. New to the topic? Start with the <button className="link-btn" onClick={() => go('Lesson')}>📖 Lesson</button> first.</div>
          <Suspense fallback={<p className="muted">Loading the guide…</p>}><model.Guide /></Suspense>
        </>}
      </> : hasAnim(id) ? <>
        <div className="journey">
          <span className="small muted">Suggested path:</span>
          {JOURNEY.filter((j) => j.tab !== 'Quiz').map((j, i) => (
            <button key={j.tab} className={`journey-step ${tab === j.tab ? 'on' : ''}`} onClick={() => go(j.tab)}>
              <span className="journey-n">{i + 1}</span>{j.text}
            </button>
          ))}
        </div>
        <div className="tabs">
          {(['Lesson', 'Animate', 'Playground'] as Tab[]).map((x) => (
            <button key={x} className={`tab ${tab === x ? 'active' : ''}`} onClick={() => setTab(x)}>{LABEL[x]}</button>
          ))}
        </div>
        {tab === 'Lesson' && lesson && <>
          <LessonView topic={t} lesson={lesson} onPass={complete} />
          <div className="card next-card"><b>Next on this page →</b> <button className="btn primary" onClick={() => go('Animate')}>🎬 Watch it work</button></div>
        </>}
        {(tab === 'Animate' || tab === 'Playground') && (
          ta.error ? <div className="card">⚠️ This animation failed to load: {ta.error}</div>
            : !ta.anim ? <p className="muted">Loading the animation…</p>
              : tab === 'Animate' ? <><HowTo spec={ta.anim.howto.Animate} /><ta.anim.Animate /></>
                : <><HowTo spec={ta.anim.howto.Playground} /><ta.anim.Playground /></>
        )}
      </> : lesson ? <>
        <LessonView topic={t} lesson={lesson} onPass={complete} />
      </> : null}

      {terms.length > 0 && <div style={{ marginTop: 22 }}>
        <h3>📖 Key terms</h3>
        <div className="grid g2">{terms.map((g) => <div key={g.term} className="small"><b>{g.term}</b>: {g.def}</div>)}</div>
      </div>}

      <div className="row" style={{ marginTop: 28, borderTop: '1px solid #2a3342', paddingTop: 14 }}>
        {prev && <Link className="btn" to={`/topic/${prev.id}`}>← Previous: {prev.title}</Link>}
        <span className="spacer" />
        {next && <Link className="btn primary" to={`/topic/${next.id}`}>Next: {next.title} →</Link>}
      </div>
    </div>
  );
}
