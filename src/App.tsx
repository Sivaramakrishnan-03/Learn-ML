import { NavLink, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { MotionConfig } from 'framer-motion';
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
import { ExamList, Exam } from './pages/Exams';
import { ProjectList, ProjectPage } from './pages/Projects';
import Settings from './pages/Settings';
import About from './pages/About';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const prog = useProgress();
  const done = TOPICS.filter((t) => prog[t.id]).length;
  const nav = useNavigate();
  const loc = useLocation();
  const [q, setQ] = useState('');
  const [menu, setMenu] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const lastPath = useRef(loc.pathname);
  useEffect(() => {
    window.scrollTo(0, 0); setMenu(false);
    // Move focus to the new page so keyboard and screen-reader users start at its top (not on the first load).
    if (lastPath.current === loc.pathname) return;
    lastPath.current = loc.pathname;
    mainRef.current?.focus({ preventScroll: true });
  }, [loc.pathname]);
  useEffect(() => {
    if (!menu) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMenu(false); document.getElementById('menu-btn')?.focus(); } };
    window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc);
  }, [menu]);
  const skip = (e: React.MouseEvent) => { e.preventDefault(); mainRef.current?.focus(); mainRef.current?.scrollIntoView(); };
  return (
    <MotionConfig reducedMotion="user">
    <div className={`app ${menu ? 'menu-open' : ''}`}>
      <a href="#main" className="skip-link" onClick={skip}>Skip to content</a>
      <header className="topbar">
        <NavLink to="/" className="brand"><span aria-hidden="true">◆</span> LearnPath <span>ML</span></NavLink>
        <button id="menu-btn" className="btn menu-btn" aria-expanded={menu} aria-controls="sidebar" onClick={() => setMenu(!menu)}>
          <span aria-hidden="true">{menu ? '✕' : '☰'}</span> {menu ? 'Close' : 'Menu'}
        </button>
      </header>
      <aside className="side" id="sidebar" aria-label="Site">
        <NavLink to="/" className="brand side-brand"><span aria-hidden="true">◆</span> LearnPath <span>ML</span></NavLink>
        <div className="tagline">The ML & statistics playbook: lessons, animations, practice.</div>
        <form role="search" onSubmit={(e) => { e.preventDefault(); if (q.trim()) { nav(`/search?q=${encodeURIComponent(q.trim())}`); setMenu(false); } }}>
          <label htmlFor="site-search" className="sr-only">Search topics and terms</label>
          <input id="site-search" type="search" placeholder="Search topics & terms…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: '100%' }} />
        </form>
        <nav className="nav" aria-label="Main">
          <div className="sec">Learn</div>
          <NavLink to="/" end><span aria-hidden="true" className="nav-ico">🏠</span> Home</NavLink>
          <NavLink to="/tree"><span aria-hidden="true" className="nav-ico">🌳</span> Skill tree</NavLink>
          <NavLink to="/track"><span aria-hidden="true" className="nav-ico">🛤</span> Linear track</NavLink>
          <NavLink to="/roles"><span aria-hidden="true" className="nav-ico">🎭</span> Role tracks</NavLink>
          <NavLink to="/placement"><span aria-hidden="true" className="nav-ico">🧭</span> Placement quiz</NavLink>
          <NavLink to="/playbook"><span aria-hidden="true" className="nav-ico">📚</span> The Playbook</NavLink>
          <NavLink to="/exams"><span aria-hidden="true" className="nav-ico">🎓</span> Track exams</NavLink>
          <NavLink to="/projects"><span aria-hidden="true" className="nav-ico">🛠</span> Projects</NavLink>
          <div className="sec">Featured animations</div>
          <NavLink to="/topic/linear-regression"><span aria-hidden="true" className="nav-ico">📈</span> Linear Regression</NavLink>
          <NavLink to="/topic/kmeans"><span aria-hidden="true" className="nav-ico">🍕</span> K-Means</NavLink>
          <NavLink to="/topic/decision-tree"><span aria-hidden="true" className="nav-ico">🎯</span> Decision Tree</NavLink>
          <div className="sec">Tools</div>
          <NavLink to="/compare"><span aria-hidden="true" className="nav-ico">⚖️</span> Compare models</NavLink>
          <NavLink to="/chooser"><span aria-hidden="true" className="nav-ico">🔀</span> Which model?</NavLink>
          <NavLink to="/glossary"><span aria-hidden="true" className="nav-ico">📖</span> Glossary</NavLink>
          <NavLink to="/settings"><span aria-hidden="true" className="nav-ico">⚙️</span> Settings</NavLink>
          <NavLink to="/about"><span aria-hidden="true" className="nav-ico">ℹ️</span> About</NavLink>
        </nav>
        <div className="progress-mini">
          Progress: <b>{done}</b> / {TOPICS.length} topics
          <div className="bar" role="progressbar" aria-label="Topics completed" aria-valuemin={0} aria-valuemax={TOPICS.length} aria-valuenow={done}><div style={{ width: `${(done / TOPICS.length) * 100}%` }} /></div>
        </div>
      </aside>
      <main className="main" id="main" ref={mainRef} tabIndex={-1}>
        <ErrorBoundary resetKey={loc.pathname}>
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
          <Route path="/exams" element={<ExamList />} />
          <Route path="/exam/:track" element={<Exam />} />
          <Route path="/projects" element={<ProjectList />} />
          <Route path="/project/:id" element={<ProjectPage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<p>Page not found. <NavLink to="/"><span aria-hidden="true" className="nav-ico">Go</span> home</NavLink></p>} />
        </Routes>
        </ErrorBoundary>
      </main>
    </div>
    </MotionConfig>
  );
}
