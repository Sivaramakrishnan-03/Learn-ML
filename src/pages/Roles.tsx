import { useState } from 'react';
import { roleTrack, ROLES, RoleId } from '../data/curriculum';
import { TopicRow } from '../components/TopicRow';
import { useProgress } from '../lib/progress';

export default function Roles() {
  const [role, setRole] = useState<RoleId>('data-scientist');
  const list = roleTrack(role);
  const s = useProgress();
  const done = list.filter((t) => s[t.id]).length;
  return (
    <div>
      <h1>🎭 Role tracks</h1>
      <div className="page-intro"><b>How to use it:</b> pick the role closest to your goal. The list below shows only the topics that role needs, plus everything they depend on, in a safe order. Work top to bottom.</div>
      <div className="grid g4" style={{ marginBottom: 16 }}>
        {(Object.keys(ROLES) as RoleId[]).map((r) => (
          <button key={r} type="button" className={`card mode-card ${role === r ? 'selected' : ''}`} aria-pressed={role === r} onClick={() => setRole(r)} style={{ textAlign: 'left', color: 'inherit' }}>
            <h2 className="h3">{ROLES[r].title}</h2><p className="small muted" style={{ margin: 0 }}>{ROLES[r].goal}</p>
            <p className="small" style={{ margin: '6px 0 0' }}>{roleTrack(r).length} topics</p>
          </button>
        ))}
      </div>
      <div className="row" style={{ marginBottom: 8 }}><h2 style={{ margin: 0 }}>{ROLES[role].title}</h2><span className="muted">{done}/{list.length} complete</span></div>
      <div className="bar" style={{ marginBottom: 12 }} role="progressbar" aria-label={`${ROLES[role].title} progress`} aria-valuemin={0} aria-valuemax={list.length} aria-valuenow={done}><div style={{ width: `${(done / list.length) * 100}%` }} /></div>
      <div className="card" style={{ padding: 0 }}>{list.map((t, i) => <TopicRow key={t.id} t={t} index={i} />)}</div>
    </div>
  );
}
