import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lesson, useChapter } from '../content';
import { Topic, TOPICS } from '../data/curriculum';
import { Md } from './Md';
import { Tex } from './Tex';
import { CodeLab } from './CodeLab';
import { Quiz } from './Quiz';
import { DeepView } from './DeepView';
import { BOOKS, REFERENCES } from '../data/references';
import { TabList, TabPanel } from './Tabs';

function Section({ icon, title, children, tone }: { icon: string; title: string; children: React.ReactNode; tone?: string }) {
  return (
    <section className={`lesson-sec ${tone ?? ''}`}>
      <h3><span className="lesson-ico" aria-hidden="true">{icon}</span>{title}</h3>
      {children}
    </section>
  );
}

function CopyBlock({ code, note }: { code: string; note?: string }) {
  const [run, setRun] = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked */ }
  };
  return (
    <div>
      {!run ? <>
        <pre className="code">{code}</pre>
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn" onClick={copy}>{copied ? '✓ Copied' : '📋 Copy'}</button>
          <button className="btn ok" onClick={() => setRun(true)}>▶ Try it in the browser</button>
          {note && <span className="small muted">ℹ️ {note}</span>}
        </div>
      </> : <CodeLab snippets={[{ title: 'Practice', code }]} />}
    </div>
  );
}

type Layer = 'core' | 'chapter' | 'toolkit';
const LAYER_KEY = 'learnpath-ml:lesson-layer';
const readLayer = (): Layer => { try { return (localStorage.getItem(LAYER_KEY) as Layer) || 'core'; } catch { return 'core'; } };

/** The lesson every topic page opens with, in three layers: a 5-minute core, the full chapter, and a practitioner toolkit. */
export function LessonView({ topic, lesson, onPass }: { topic: Topic; lesson: Lesson & { chapterMinutes?: number }; onPass: () => void }) {
  const unlocks = TOPICS.filter((x) => x.prereqs.includes(topic.id));
  const [layer, setLayerState] = useState<Layer>(readLayer);
  const setLayer = (l: Layer) => { setLayerState(l); try { localStorage.setItem(LAYER_KEY, l); } catch { /* ignore */ } };
  const chapter = useChapter(topic.id);
  const LAYERS: { id: Layer; label: string; hint: string }[] = [
    { id: 'core', label: `⚡ 5-minute core`, hint: `~${lesson.minutes} min · the essentials` },
    { id: 'chapter', label: `📖 Full chapter`, hint: `~${lesson.chapterMinutes ?? '?'} min · step by step, diagrams, examples` },
    { id: 'toolkit', label: `🧰 Practitioner toolkit`, hint: 'when to use it, mistakes, Python, interviews, books' },
  ];
  return (
    <div className="lesson">
      <TabList label="Lesson depth" prefix="layer" value={layer} onChange={setLayer} className="layer-switch" tabClass="layer-btn" activeClass="on"
        items={LAYERS.map((l) => ({ id: l.id, label: l.label }))}
        renderTab={(it) => { const l = LAYERS.find((x) => x.id === it.id)!; const [ico, ...rest] = l.label.split(' ');
          return <><b><span aria-hidden="true">{ico}</span> {rest.join(' ')}</b><span className="small muted">{l.hint}</span></>; }} />

      <TabPanel prefix="layer" value={layer}>
      <Section icon="🎯" title="By the end of this lesson you will be able to:" tone="goals">
        <ul className="ticks">{lesson.goals.map((g, i) => <li key={i}><Md text={g} /></li>)}</ul>
      </Section>

      {layer === 'core' && <div className="reading">
        <Section icon="💼" title="Why it matters"><p><Md text={lesson.why} /></p></Section>
        <Section icon="💡" title="The idea in plain English">{lesson.explain.map((p, i) => <p key={i}><Md text={p} /></p>)}</Section>
        {lesson.formula && (
          <Section icon="∑" title="The formula, read out loud">
            <div className="formula-card"><Tex block>{lesson.formula.tex}</Tex></div>
            <p className="small"><b>In words:</b> <Md text={lesson.formula.plain} /></p>
          </Section>
        )}
        <Section icon="🧮" title={`Worked example: ${lesson.example.title}`} tone="example">
          <ol className="steps">{lesson.example.steps.map((s, i) => <li key={i}><Md text={s} /></li>)}</ol>
          <div className="result"><span aria-hidden="true">✅ </span><Md text={lesson.example.result} /></div>
        </Section>
        <div className="card next-card">Want the full explanation with diagrams and more examples? <button className="btn primary" onClick={() => { setLayer('chapter'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>📖 Read the full chapter</button></div>
      </div>}

      {layer === 'chapter' && (chapter.ch ? <DeepView deep={chapter.ch} /> : <p className="muted">{chapter.done ? 'No chapter for this topic yet.' : 'Loading the chapter…'}</p>)}

      {layer === 'toolkit' && <div className="reading">
        {(lesson.use || lesson.avoid) && (
          <Section icon="📋" title="Playbook: when to use it">
            <div className="grid g2">
              {lesson.use && <div className="card use"><b>✅ Use it when</b><ul>{lesson.use.map((u, i) => <li key={i}><Md text={u} /></li>)}</ul></div>}
              {lesson.avoid && <div className="card avoid"><b>⛔ Avoid it / be careful when</b><ul>{lesson.avoid.map((u, i) => <li key={i}><Md text={u} /></li>)}</ul></div>}
            </div>
          </Section>
        )}
        <Section icon="⚠️" title="Common mistakes" tone="warn"><ul>{lesson.mistakes.map((m, i) => <li key={i}><Md text={m} /></li>)}</ul></Section>
        {lesson.practice && <Section icon="🐍" title="Do it in Python"><CopyBlock code={lesson.practice.code} note={lesson.practice.note} /></Section>}
        {lesson.interview && <Section icon="🎤" title="Interview questions you should be able to answer"><ul>{lesson.interview.map((q, i) => <li key={i}>{q}</li>)}</ul></Section>}
        {REFERENCES[topic.id]?.length > 0 && (
          <Section icon="📚" title="Further reading from well-known textbooks">
            <ul className="refs">{REFERENCES[topic.id].map((r, i) => {
              const b = BOOKS[r.book];
              return <li key={i}><b>{b.title}</b> ({b.authors}, {b.edition}): {r.where}{b.free && <span className="small muted"> · free online: {b.free}</span>}</li>;
            })}</ul>
          </Section>
        )}
      </div>}
      </TabPanel>

      <div className="reading">
        <Section icon="📌" title="Key takeaways" tone="takeaways"><ul className="ticks">{lesson.takeaways.map((t, i) => <li key={i}><Md text={t} /></li>)}</ul></Section>
        <Section icon="✅" title="Quick check"><Quiz items={lesson.check} onPass={onPass} /></Section>
        {unlocks.length > 0 && (
          <Section icon="➡️" title="Where to go next">
            <p className="small muted">This topic unlocks:</p>
            <div className="row">{unlocks.map((u) => <Link key={u.id} className="btn" to={`/topic/${u.id}`}>{u.title} →</Link>)}</div>
          </Section>
        )}
      </div>
    </div>
  );
}
