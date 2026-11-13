import { useId, useState } from 'react';

export interface QuizItem { q: string; options: string[]; answer: number; why: string; interview?: boolean; kind?: string; level?: number }

export function Quiz({ items, onPass, onComplete }: { items: QuizItem[]; onPass?: () => void; onComplete?: (score: number, total: number) => void }) {
  const [picked, setPickedState] = useState<(number | null)[]>(items.map(() => null));
  const setPicked = (f: (s: (number | null)[]) => (number | null)[]) => setPickedState((s) => {
    const n = f(s);
    if (onComplete && n.every((v) => v !== null) && s.some((v) => v === null)) onComplete(n.filter((p, i) => p === items[i].answer).length, items.length);
    return n;
  });
  const score = picked.filter((p, i) => p === items[i].answer).length;
  const answered = picked.filter((p) => p !== null).length;
  const uid = useId().replace(/:/g, '');
  return (
    <div>
      {items.map((it, qi) => (
        <div key={qi} className="card" style={{ marginBottom: 12 }}>
          <div className="row" style={{ marginBottom: 8 }} id={`${uid}-q${qi}`}>
            <strong>Q{qi + 1}. {it.q}</strong>
            {(it.interview || it.kind === 'interview') && <span className="pill">interview</span>}{it.kind && it.kind !== 'interview' && <span className="pill">{it.kind}</span>}
          </div>
          <div role="group" aria-labelledby={`${uid}-q${qi}`}>
          {it.options.map((o, oi) => {
            const p = picked[qi];
            const cls = p === null ? '' : oi === it.answer ? 'right' : oi === p ? 'wrong' : '';
            return (
              <button key={oi} type="button" className={`opt ${cls}`} aria-disabled={p !== null} aria-pressed={p === oi}
                onClick={() => { if (p === null) setPicked((s) => s.map((v, i) => (i === qi ? oi : v))); }}>
                <OptMark cls={cls} />{o}
              </button>
            );
          })}
          </div>
          <div role="status" aria-live="polite">
            {picked[qi] !== null && <p className="small" style={{ marginTop: 6 }}>
              <b>{picked[qi] === it.answer ? '✅ Correct. ' : `❌ Not quite. The answer is: ${it.options[it.answer]}. `}</b>{it.why}</p>}
          </div>
        </div>
      ))}
      <div className="row">
        <strong role="status">Score: {score}/{items.length}</strong>
        <button className="btn" onClick={() => setPickedState(items.map(() => null))}>Retry</button>
        {answered === items.length && score / items.length >= 0.7 && onPass && (
          <button className="btn ok" onClick={onPass}>Mark topic complete</button>
        )}
      </div>
    </div>
  );
}

/** Text marker so right/wrong answers don't rely on colour alone. */
export function OptMark({ cls }: { cls: string }) {
  if (cls === 'right') return <span className="opt-mark" aria-label="Correct answer: ">✓</span>;
  if (cls === 'wrong') return <span className="opt-mark" aria-label="Your answer, wrong: ">✗</span>;
  return null;
}
