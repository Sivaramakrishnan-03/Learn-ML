import { useMemo, useState } from 'react';
import { QUIZZES, Lesson } from '../content';
import { Quiz, QuizItem } from './Quiz';
import { results, useResults } from '../lib/results';

/** Full topic quiz from the question bank (falls back to the lesson's quick check). */
export function TopicQuiz({ id, lesson, extra = [], onPass }: { id: string; lesson: Lesson; extra?: QuizItem[]; onPass: () => void }) {
  const r = useResults().quiz[id];
  const [round, setRound] = useState(0);
  const items: QuizItem[] = useMemo(() => {
    const bank = QUIZZES[id]?.questions ?? [];
    const seen = new Set<string>();
    return [...bank, ...extra, ...lesson.check].filter((q) => (seen.has(q.q) ? false : (seen.add(q.q), true)));
  }, [id, lesson, extra]);
  return (
    <div className="reading">
      <div className="row" style={{ marginBottom: 12 }}>
        <span className="muted">{items.length} questions: concepts, calculations, interpretation and interview-style. Score 70%+ to complete the topic.</span>
        <span className="spacer" />
        {r && <span className="pill full">best {r.best}/{r.total}</span>}
      </div>
      <Quiz key={round} items={items} onPass={onPass} onComplete={(s, t) => results.quiz(id, s, t)} />
      <button className="btn" style={{ marginTop: 10 }} onClick={() => setRound(round + 1)}>↺ New attempt</button>
    </div>
  );
}
