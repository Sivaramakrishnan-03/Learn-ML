import { isAnimated } from '../anim/registry';
import { minutesOf } from '../lessons/minutes';
import { Link } from 'react-router-dom';
import { Topic, TRACKS } from '../data/curriculum';
import { isUnlocked, progress, useProgress } from '../lib/progress';

export function TopicRow({ t, index }: { t: Topic; index?: number }) {
  const s = useProgress();
  const mark = s[t.id];
  const unlocked = isUnlocked(t.id, s);
  return (
    <div className="topic-row" style={{ opacity: unlocked || mark ? 1 : 0.55 }}>
      <button className={`check ${mark === 'done' ? 'on' : mark === 'tested' ? 'tested' : ''}`} title={mark ? 'Mark as not done' : 'Mark as done'}
        onClick={() => progress.toggle(t.id)} style={{ background: undefined }}>{mark ? '✓' : ''}</button>
      {index !== undefined && <span className="mono muted small" style={{ width: 54 }}>Day {index + 1}</span>}
      <Link to={`/topic/${t.id}`} style={{ color: 'inherit', flex: 1 }}>
        <span className="dot" style={{ background: TRACKS[t.track].color }} />{t.title}
        <span className="muted small"> · {t.blurb}</span>
      </Link>
      {isAnimated(t.id) && <span className="pill full">★ animated</span>}<span className="pill">{minutesOf(t.id) ?? '–'} min</span>
      {!unlocked && !mark && <span title="Prerequisites not complete">🔒</span>}
    </div>
  );
}
