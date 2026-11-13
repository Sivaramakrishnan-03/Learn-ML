import { NavLink, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { TOPICS } from './data/curriculum';
import { useProgress } from './lib/progress';
import Home from './pages/Home';
import SkillTree from './pages/SkillTree';
import Track from './pages/Track';
import Roles from './pages/Roles';
import Placement from './pages/Placement';
import TopicPage from './pages/Topic';
import Compare from './pages/Compare';
import Chooser from './pages/Chooser';
import Glossary from './pages/Glossary';
import Search from './pages/Search';
import Playbook from './pages/Playbook';

export default function App() {
  const prog = useProgress();
  const done = TOPICS.filter((t) => prog[t.id]).length;
  const nav = useNavigate();
  const loc = useLocation();
  const [q, setQ] = useState('');
  useEffect(() => { window.scrollTo(0, 0); }, [loc.pathname]);
  return (
    <div className="app">
      <aside className="side">
        <NavLink to="/" className="brand" style={{ textDecoration: 'none' }}>◆ LearnPath <span>ML</span></NavLink>
        <div className="tagline">The ML & statistics playbook: lessons, animations, practice.</div>
        <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) nav(`/search?q=${encodeURIComponent(q.trim())}`); }}>
          <input type="search" placeholder="Search topics & terms…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: '100%' }} />
        </form>
        <nav className="nav">
          <div className="sec">Learn</div>
          <NavLink to="/" end>🏠 Home</NavLink>
          <NavLink to="/tree">🌳 Skill tree</NavLink>
          <NavLink to="/track">🛤 Linear track</NavLink>
          <NavLink to="/roles">🎭 Role tracks</NavLink>
          <NavLink to="/placement">🧭 Placement quiz</NavLink>
          <NavLink to="/playbook">📚 The Playbook</NavLink>
          <div className="sec">Featured animations</div>
          <NavLink to="/topic/linear-regression">📈 Linear Regression</NavLink>
          <NavLink to="/topic/kmeans">🍕 K-Means</NavLink>
          <NavLink to="/topic/decision-tree">🎯 Decision Tree</NavLink>
          <div className="sec">Tools</div>
          <NavLink to="/compare">⚖️ Compare models</NavLink>
          <NavLink to="/chooser">🔀 Which model?</NavLink>
          <NavLink to="/glossary">📖 Glossary</NavLink>
        </nav>
        <div className="progress-mini">
          Progress: <b>{done}</b> / {TOPICS.length} topics
          <div className="bar"><div style={{ width: `${(done / TOPICS.length) * 100}%` }} /></div>
        </div>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tree" element={<SkillTree />} />
          <Route path="/track" element={<Track />} />
          <Route path="/roles" element={<Roles />} />
          <Route path="/placement" element={<Placement />} />
          <Route path="/topic/:id" element={<TopicPage />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/chooser" element={<Chooser />} />
          <Route path="/glossary" element={<Glossary />} />
          <Route path="/search" element={<Search />} />
          <Route path="/playbook" element={<Playbook />} />
          <Route path="*" element={<p>Page not found. <NavLink to="/">Go home</NavLink></p>} />
        </Routes>
      </main>
    </div>
  );
}
