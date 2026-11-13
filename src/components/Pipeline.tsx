import { ReactNode } from 'react';
import { useStepPlayer, PlayerControls } from './StepPlayer';

export interface Stage { name: string; icon: string; detail: ReactNode }

/** Animated end-to-end pipeline: data → clean → features → split → train → evaluate → deploy. */
export function Pipeline({ stages }: { stages: Stage[] }) {
  const p = useStepPlayer(stages.length, 1800);
  return (
    <div>
      <div className="pipe" role="group" aria-label="Pipeline stages">
        {stages.map((s, i) => (
          <button type="button" key={s.name} className={`stage ${i === p.i ? 'on' : i < p.i ? 'done' : ''}`}
            onClick={() => p.setI(i)} aria-current={i === p.i ? 'step' : undefined}>
            <div style={{ fontSize: '1.3rem' }} aria-hidden="true">{s.icon}</div>{s.name}{i < p.i && <span className="sr-only"> (done)</span>}
          </button>
        ))}
      </div>
      <PlayerControls p={p} />
      <div className="card" style={{ marginTop: 12, minHeight: 200 }}>
        <h3><span aria-hidden="true">{stages[p.i].icon}</span> {stages[p.i].name}</h3>
        {stages[p.i].detail}
      </div>
    </div>
  );
}
