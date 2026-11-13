import { Lesson } from '../content';
import { Topic, TRACKS } from '../data/curriculum';
import { BOOKS, REFERENCES } from '../data/references';
import { CheatSheet } from './CheatSheet';
import { Md } from './Md';
import { Tex } from './Tex';

/** One-page printable summary generated from the topic's lesson, for every topic. */
export function TopicCheatSheet({ topic, lesson }: { topic: Topic; lesson: Lesson }) {
  return (
    <CheatSheet>
      <h2 style={{ marginBottom: 2 }}>{topic.title}: cheat sheet</h2>
      <p style={{ color: '#555', margin: '0 0 10px' }}>{TRACKS[topic.track].title} · {topic.blurb}</p>
      <table><tbody>
        <tr><th style={{ width: 150 }}>In one line</th><td>{topic.analogy}</td></tr>
        {lesson.formula && <tr><th>Key formula</th><td><Tex>{lesson.formula.tex}</Tex><br /><span style={{ color: '#555' }}><Md text={lesson.formula.plain} /></span></td></tr>}
        <tr><th>Remember</th><td><ul style={{ margin: 0, paddingLeft: 18 }}>{lesson.takeaways.map((t, i) => <li key={i}><Md text={t} /></li>)}</ul></td></tr>
        {lesson.use && <tr><th>Use it when</th><td><ul style={{ margin: 0, paddingLeft: 18 }}>{lesson.use.map((t, i) => <li key={i}><Md text={t} /></li>)}</ul></td></tr>}
        {lesson.avoid && <tr><th>Avoid when</th><td><ul style={{ margin: 0, paddingLeft: 18 }}>{lesson.avoid.map((t, i) => <li key={i}><Md text={t} /></li>)}</ul></td></tr>}
        <tr><th>Common mistakes</th><td><ul style={{ margin: 0, paddingLeft: 18 }}>{lesson.mistakes.map((t, i) => <li key={i}><Md text={t} /></li>)}</ul></td></tr>
        {lesson.practice && <tr><th>Python</th><td><pre style={{ margin: 0, fontSize: '.75rem', whiteSpace: 'pre-wrap', color: '#111' }}>{lesson.practice.code.split('\n').slice(0, 12).join('\n')}</pre></td></tr>}
        {lesson.interview && <tr><th>Interview</th><td><ul style={{ margin: 0, paddingLeft: 18 }}>{lesson.interview.map((t, i) => <li key={i}>{t}</li>)}</ul></td></tr>}
        {REFERENCES[topic.id] && <tr><th>Read more</th><td>{REFERENCES[topic.id].map((r, i) => <div key={i}>{BOOKS[r.book].title}: {r.where}</div>)}</td></tr>}
      </tbody></table>
    </CheatSheet>
  );
}
