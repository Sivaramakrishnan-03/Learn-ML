import { Link, useParams } from 'react-router-dom';
import { PROJECTS } from '../content';
import { TOPIC_BY_ID, TRACKS, TrackId } from '../data/curriculum';
import { Md } from '../components/Md';
import { CodeLab } from '../components/CodeLab';

export function ProjectList() {
  return (
    <div>
      <h1>🛠 Hands-on projects</h1>
      <div className="page-intro">End-to-end projects that tie topics together the way real work does: a business question, a dataset, step-by-step tasks with starter code, deliverables and a self-assessment rubric. Do them in Jupyter, VS Code or Colab.</div>
      {!PROJECTS.length && <p className="muted">No projects yet.</p>}
      <div className="grid g3">
        {PROJECTS.map((p) => (
          <Link key={p.id} to={`/project/${p.id}`} className="card mode-card">
            <span className="pill" style={{ borderColor: TRACKS[p.track as TrackId]?.color, color: TRACKS[p.track as TrackId]?.color }}>{TRACKS[p.track as TrackId]?.title ?? p.track}</span>
            <h3 style={{ marginTop: 8 }}>{p.title}</h3>
            <p className="small" style={{ margin: '0 0 6px' }}>{p.summary}</p>
            <p className="small muted" style={{ margin: 0 }}>{['', 'beginner', 'practitioner', 'advanced'][p.level]} · ~{p.hours} h · {p.topics.length} topics</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ProjectPage() {
  const { id } = useParams();
  const p = PROJECTS.find((x) => x.id === id);
  if (!p) return <p>Unknown project. <Link to="/projects">All projects</Link></p>;
  return (
    <div className="reading">
      <h1>🛠 {p.title}</h1>
      <p style={{ fontSize: '1.05rem' }}>{p.summary}</p>
      <div className="caption" style={{ marginBottom: 14 }}>💼 <b>Business question:</b> <Md text={p.business} /></div>
      <div className="row small" style={{ marginBottom: 14 }}>
        <span className="pill">{['', 'beginner', 'practitioner', 'advanced'][p.level]}</span><span className="pill">~{p.hours} h</span>
        <span className="muted">Uses:</span>{p.topics.map((t) => TOPIC_BY_ID[t] && <Link key={t} to={`/topic/${t}`}>{TOPIC_BY_ID[t].title}</Link>)}
      </div>
      <section className="lesson-sec"><h3>📦 Dataset</h3><p><b>{p.dataset.name}</b>: <Md text={p.dataset.how} /></p></section>
      <section className="lesson-sec"><h3>🪜 Steps</h3>
        {p.steps.map((s, i) => (
          <div key={i} className="example-box">
            <div className="example-title">Step {i + 1}: <Md text={s.title} /></div>
            <p><Md text={s.detail} /></p>
            {s.code && <CodeLab snippets={[{ title: 'Starter code', code: s.code }]} />}
          </div>
        ))}
      </section>
      <section className="lesson-sec"><h3>📤 Deliverables</h3><ul>{p.deliverables.map((d, i) => <li key={i}><Md text={d} /></li>)}</ul></section>
      <section className="lesson-sec"><h3>✅ Self-assessment rubric</h3>
        <table className="dtable"><thead><tr><th>Criterion</th><th>What good looks like</th></tr></thead>
          <tbody>{p.rubric.map((r, i) => <tr key={i}><td><Md text={r.criterion} /></td><td><Md text={r.good} /></td></tr>)}</tbody></table>
      </section>
      <section className="lesson-sec"><h3>🚀 Stretch goals</h3><ul>{p.extensions.map((d, i) => <li key={i}><Md text={d} /></li>)}</ul></section>
    </div>
  );
}
