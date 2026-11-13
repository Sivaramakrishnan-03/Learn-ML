import { Link } from 'react-router-dom';
import { linearOrder, TOPICS, TRACKS } from '../data/curriculum';
import { isUnlocked, useProgress } from '../lib/progress';

const MODES = [
  { to: '/track', icon: '🛤', title: 'Linear track', best: 'Best if you want to be told what to do next.', text: 'All 69 topics in a safe order, Day 1 → Day 69.' },
  { to: '/roles', icon: '🎭', title: 'Role tracks', best: 'Best if you have a specific job goal.', text: 'Only the topics an Analyst, Data Scientist, ML Engineer or AI Consultant needs.' },
  { to: '/tree', icon: '🌳', title: 'Skill tree', best: 'Best if you like to explore.', text: 'A map of every topic and what it builds on.' },
  { to: '/playbook', icon: '📚', title: 'The Playbook', best: 'Best as a reference.', text: 'Every topic on one page: what it is and when to use it.' },
];

export default function Home() {
  const s = useProgress();
  const order = linearOrder();
  const next = order.find((t) => !s[t.id] && isUnlocked(t.id, s));
  const done = TOPICS.filter((t) => s[t.id]).length;
  return (
    <div>
      <div className="hero">
        <h1>The <span>ML & Statistics</span> Playbook</h1>
        <p style={{ maxWidth: 760, fontSize: '1.05rem' }}>{TOPICS.length} topics, from averages and p-values to random forests and neural networks. Every topic has a <b>plain-English lesson</b>, a <b>worked example with real numbers</b>, <b>when to use it</b>, <b>Python you can run</b>, and a <b>quick quiz</b>. <b>Every topic is animated</b>: watch it work step by step, then experiment in a playground.</p>
        <div className="row" style={{ marginTop: 14 }}>
          {next && <Link className="btn primary" to={`/topic/${next.id}`}>{done ? `▶ Continue: ${next.title}` : `▶ Start Day 1: ${next.title}`}</Link>}
          {!done && <Link className="btn" to="/placement">🧭 Not a beginner? Take the 2-minute placement quiz</Link>}
          {done > 0 && <span className="muted small">{done} of {TOPICS.length} topics complete</span>}
        </div>
      </div>

      <h2>How it works</h2>
      <div className="start-steps" style={{ marginBottom: 26 }}>
        <div className="card start-step"><h3>Find your starting point</h3><p className="small muted" style={{ margin: 0 }}>Beginners start at Day 1. If you already know some statistics, the <Link to="/placement">placement quiz</Link> skips what you know.</p></div>
        <div className="card start-step"><h3>Open one topic at a time</h3><p className="small muted" style={{ margin: 0 }}>Each topic page starts with a 5–12 minute lesson: goals, the idea in plain English, a worked example, mistakes to avoid, Python, and a quick check.</p></div>
        <div className="card start-step"><h3>Watch, try, test</h3><p className="small muted" style={{ margin: 0 }}>On animated topics, follow the path <b>Lesson → Watch → Try → Quiz</b>. Every interactive tab has a "How to use this" guide.</p></div>
      </div>

      <h2>Pick how you want to move through it</h2>
      <div className="grid g4" style={{ marginBottom: 26 }}>
        {MODES.map((m) => (
          <Link key={m.to} to={m.to} className="card mode-card">
            <div className="icon">{m.icon}</div><h3>{m.title}</h3>
            <p className="small" style={{ margin: '0 0 6px' }}>{m.text}</p>
            <p className="small muted" style={{ margin: 0 }}>{m.best}</p>
          </Link>
        ))}
      </div>

      <h2>Featured animations</h2>
      <div className="grid g3" style={{ marginBottom: 26 }}>
        {TOPICS.filter((t) => t.status === 'full').map((t) => (
          <Link key={t.id} to={`/topic/${t.id}`} className="card mode-card">
            <span className="pill" style={{ borderColor: TRACKS[t.track].color, color: TRACKS[t.track].color }}>{TRACKS[t.track].title}</span>
            <h3 style={{ marginTop: 8 }}>★ {t.title}</h3>
            <p className="small" style={{ margin: 0 }}>{t.analogy}</p>
          </Link>
        ))}
      </div>

      <h2>Tools for real projects</h2>
      <div className="grid g3">
        <Link to="/chooser" className="card mode-card"><div className="icon">🔀</div><h3>Which model should I use?</h3><p className="muted small" style={{ margin: 0 }}>Answer 2–3 questions about your problem and get a recommended model with reasons.</p></Link>
        <Link to="/compare" className="card mode-card"><div className="icon">⚖️</div><h3>Compare models</h3><p className="muted small" style={{ margin: 0 }}>See how three classifiers draw different boundaries on the same data.</p></Link>
        <Link to="/exams" className="card mode-card"><div className="icon">🎓</div><h3>Track exams</h3><p className="muted small" style={{ margin: 0 }}>15-question exams per track, drawn from a bank of hundreds of questions.</p></Link>
        <Link to="/projects" className="card mode-card"><div className="icon">🛠</div><h3>Hands-on projects</h3><p className="muted small" style={{ margin: 0 }}>End-to-end projects with data, starter code and a rubric.</p></Link>
        <Link to="/settings" className="card mode-card"><div className="icon">⚙️</div><h3>Settings & backup</h3><p className="muted small" style={{ margin: 0 }}>Light theme, reading width, and saving your progress to a file.</p></Link>
        <Link to="/glossary" className="card mode-card"><div className="icon">📖</div><h3>Glossary</h3><p className="muted small" style={{ margin: 0 }}>Every term defined in one line, linked to the lesson that teaches it.</p></Link>
      </div>
    </div>
  );
}
