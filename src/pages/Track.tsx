import { linearOrder, TOPICS } from '../data/curriculum';
import { TopicRow } from '../components/TopicRow';
import { useProgress } from '../lib/progress';

export default function Track() {
  const order = linearOrder();
  const s = useProgress();
  const done = TOPICS.filter((t) => s[t.id]).length;
  return (
    <div>
      <h1>🛤 Linear track</h1>
      <div className="page-intro"><b>How to use it:</b> work down the list from the top. Open a topic, read the lesson, take its quick check, then come back and continue. Tick the circle on the left (or score 70%+ on the quick check) to mark a topic complete.</div>
      <p className="muted">All {order.length} topics in one prerequisite-safe order: you never meet a topic before the things it depends on. At one topic a day it is about a {Math.ceil(order.length / 7)}-week course. {done} done so far.</p>
      <div className="card" style={{ padding: 0 }}>{order.map((t, i) => <TopicRow key={t.id} t={t} index={i} />)}</div>
    </div>
  );
}
