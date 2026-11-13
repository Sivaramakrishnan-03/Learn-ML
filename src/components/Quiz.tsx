import { useState } from 'react';

export interface QuizItem { q: string; options: string[]; answer: number; why: string; interview?: boolean }

export function Quiz({ items, onPass }: { items: QuizItem[]; onPass?: () => void }) {
  const [picked, setPicked] = useState<(number | null)[]>(items.map(() => null));
  const score = picked.filter((p, i) => p === items[i].answer).length;
  const answered = picked.filter((p) => p !== null).length;
  return (
    <div>
      {items.map((it, qi) => (
        <div key={qi} className="card" style={{ marginBottom: 12 }}>
          <div className="row" style={{ marginBottom: 8 }}>
            <strong>Q{qi + 1}. {it.q}</strong>
            {it.interview && <span className="pill">interview</span>}
          </div>
          {it.options.map((o, oi) => {
            const p = picked[qi];
            const cls = p === null ? '' : oi === it.answer ? 'right' : oi === p ? 'wrong' : '';
            return (
              <button key={oi} className={`opt ${cls}`} disabled={p !== null}
                onClick={() => setPicked((s) => s.map((v, i) => (i === qi ? oi : v)))}>{o}</button>
            );
          })}
          {picked[qi] !== null && <p className="small" style={{ marginTop: 6 }}>{picked[qi] === it.answer ? '✅ ' : '❌ '}{it.why}</p>}
        </div>
      ))}
      <div className="row">
        <strong>Score: {score}/{items.length}</strong>
        <button className="btn" onClick={() => setPicked(items.map(() => null))}>Retry</button>
        {answered === items.length && score / items.length >= 0.7 && onPass && (
          <button className="btn ok" onClick={onPass}>Mark topic complete</button>
        )}
      </div>
    </div>
  );
}
