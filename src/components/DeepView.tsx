import { useState } from 'react';
import { Block, DeepLesson } from '../content/types';
import { Md } from './Md';
import { Tex } from './Tex';
import { DiagramView } from './DiagramView';

function Think({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="think">
      <div><b><span aria-hidden="true">🤔 </span>Pause and think:</b> <Md text={q} /></div>
      {open ? <div className="think-a">💬 <Md text={a} /></div> : <button type="button" className="btn" style={{ marginTop: 8 }} onClick={() => setOpen(true)} aria-expanded={false}>Reveal the answer</button>}
    </div>
  );
}

export function BlockView({ b }: { b: Block }) {
  if ('p' in b) return <p><Md text={b.p} /></p>;
  if ('term' in b) return <div className="term"><span className="term-tag">New term</span><b>{b.term}</b>: <Md text={b.def} /></div>;
  if ('tex' in b) return (
    <div className="formula-block">
      <div className="formula-card"><Tex block>{b.tex}</Tex></div>
      <p className="small" style={{ margin: '6px 0 0' }}><b>In words:</b> <Md text={b.plain} /></p>
      {b.symbols && <div className="symbols">{b.symbols.map(([s, m], i) => <span key={i} className="symbol"><Tex>{s}</Tex> = <Md text={m} /></span>)}</div>}
    </div>
  );
  if ('steps' in b) return <div>{b.title && <p style={{ marginBottom: 4 }}><b><Md text={b.title} /></b></p>}<ol className="steps">{b.steps.map((s, i) => <li key={i}><Md text={s} /></li>)}</ol></div>;
  if ('bullets' in b) return <ul>{b.bullets.map((s, i) => <li key={i}><Md text={s} /></li>)}</ul>;
  if ('diagram' in b) return <DiagramView d={b.diagram} />;
  if ('example' in b) return (
    <div className="example-box">
      <div className="example-title">🧮 Worked example: <Md text={b.example.title} /></div>
      <p><Md text={b.example.setup} /></p>
      <ol className="steps">{b.example.steps.map((s, i) => <li key={i}><Md text={s} /></li>)}</ol>
      <div className="result">✅ <Md text={b.example.result} /></div>
    </div>
  );
  if ('callout' in b) return <div className={`callout ${b.tone}`}>{b.tone === 'tip' ? '💡' : b.tone === 'warn' ? '⚠️' : '🔑'} <Md text={b.callout} /></div>;
  if ('case' in b) return <div className="case-box"><div className="example-title">🏢 Case study: <Md text={b.case.title} /></div><p style={{ margin: 0 }}><Md text={b.case.story} /></p></div>;
  if ('think' in b) return <Think q={b.think.q} a={b.think.a} />;
  return null;
}

/** Renders the textbook chapter: hook, numbered sections with a contents bar, and FAQ. */
export function DeepView({ deep }: { deep: DeepLesson }) {
  return (
    <div className="deep">
      <div className="hook"><Md text={deep.hook} /></div>
      <nav className="toc" aria-label="In this chapter">
        <span className="small muted" aria-hidden="true">In this chapter:</span>
        {deep.sections.map((s, i) => <a key={i} href={`#sec-${i}`} onClick={(e) => { e.preventDefault(); document.getElementById(`sec-${i}`)?.scrollIntoView({ behavior: 'smooth' }); }}>{i + 1}. {s.heading}</a>)}
        <a href="#sec-faq" onClick={(e) => { e.preventDefault(); document.getElementById('sec-faq')?.scrollIntoView({ behavior: 'smooth' }); }}>FAQ</a>
      </nav>
      {deep.sections.map((s, i) => (
        <section key={i} id={`sec-${i}`} className="deep-sec">
          <h2><span className="sec-n">{i + 1}</span>{s.heading}</h2>
          {s.blocks.map((b, j) => <BlockView key={j} b={b} />)}
        </section>
      ))}
      <section id="sec-faq" className="deep-sec">
        <h2><span className="sec-n">?</span>Frequently asked questions</h2>
        {deep.faq.map((f, i) => <details key={i} className="faq"><summary><Md text={f.q} /></summary><p><Md text={f.a} /></p></details>)}
      </section>
    </div>
  );
}
