import { ReactNode } from 'react';
import { Tex } from './Tex';
import { useStepPlayer, PlayerControls } from './StepPlayer';

export interface MathStep { tex: string; say: string; visual?: ReactNode }

/** Builds up a derivation one line at a time, with an optional picture per step. */
export function MathSteps({ steps }: { steps: MathStep[] }) {
  const p = useStepPlayer(steps.length, 2600);
  const cur = steps[p.i];
  return (
    <div className="grid g2">
      <div>
        {steps.slice(0, p.i + 1).map((s, i) => (
          <div key={i} className={`math-step ${i === p.i ? 'current' : ''}`} onClick={() => p.setI(i)} style={{ cursor: 'pointer' }}>
            <Tex block>{s.tex}</Tex>
          </div>
        ))}
        <PlayerControls p={p} />
      </div>
      <div>
        <div className="caption" style={{ marginTop: 0, marginBottom: 12 }}>{cur.say}</div>
        {cur.visual}
      </div>
    </div>
  );
}
