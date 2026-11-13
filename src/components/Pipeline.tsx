import { ReactNode } from 'react';
import { useStepPlayer, PlayerControls } from './StepPlayer';

export interface Stage { name: string; icon: string; detail: ReactNode }

/** Animated end-to-end pipeline: data → clean → features → split → train → evaluate → deploy. */
export function Pipeline({ stages }: { stages: Stage[] }) {
  const p = useStepPlayer(stages.length, 1800);
  return (
    <div>
      <div className="pipe">
        {stages.map((s, i) => (
          <div key={s.name} className={`stage ${i === p.i ? 'on' : i < p.i ? 'done' : ''}`}
            onClick={() => p.setI(i)} style={{ cursor: 'pointer' }}>
            <div style={{ fontSize: '1.3rem' }}>{s.icon}</div>{s.name}
          </div>
        ))}
      </div>
      <PlayerControls p={p} />
      <div className="card" style={{ marginTop: 12, minHeight: 200 }}>
        <h3>{stages[p.i].icon} {stages[p.i].name}</h3>
        {stages[p.i].detail}
      </div>
    </div>
  );
}
