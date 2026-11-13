import { APP_VERSION, REPO_URL } from '../config';
import { BOOKS } from '../data/references';

export default function About() {
  return (
    <div className="reading">
      <h1>ℹ️ About LearnPath ML</h1>
      <p>Version {APP_VERSION}. A learning path for statistics and machine learning: 69 topics, each with a lesson in three depths, an animation, a playground, a quiz and a cheat sheet, plus track exams and hands-on projects.</p>
      <section className="lesson-sec warn"><h3>⚠️ How this content was made</h3>
        <p>The lessons, chapters, quizzes and animations were written with the help of AI (Anthropic's Claude) and checked with automated tests: arithmetic in worked examples was verified in Python, chapters were validated for structure and formulas, and every animation was tested in a browser. <b>Not every page has been reviewed by a subject-matter expert yet.</b> Treat it as a study aid, cross-check important points with the textbooks below, and use <b>🐞 Report a mistake</b> on any page if something looks wrong.</p>
      </section>
      <section className="lesson-sec"><h3>📚 Sources</h3>
        <p className="small muted">Animations and examples follow the teaching approach of these books; visuals and data are original. Each lesson's Practitioner toolkit lists the matching chapters.</p>
        <ul className="refs">{Object.values(BOOKS).map((b) => <li key={b.title}><b>{b.title}</b>: {b.authors} ({b.edition}){b.free && <span className="small muted"> · free online: {b.free}</span>}</li>)}</ul>
      </section>
      <section className="lesson-sec"><h3>📝 Contributing</h3>
        <p>All teaching content is plain JSON in the <code className="inline">content/</code> folder of the repository (<a href={REPO_URL} target="_blank" rel="noreferrer">{REPO_URL}</a>): one folder per topic with <code className="inline">lesson.json</code> and <code className="inline">chapter.json</code>, plus <code className="inline">content/quizzes</code> and <code className="inline">content/projects</code>. Editors like VS Code validate them against the schemas in <code className="inline">content/schema</code>. See <code className="inline">CONTRIBUTING.md</code>.</p>
      </section>
      <section className="lesson-sec"><h3>⚖️ Licence and privacy</h3>
        <p>Copyright © 2026 Sivaramakrishnan Venkatesan. All rights reserved unless stated otherwise in the repository's LICENSE file. Book titles are cited for reference only; no book content is reproduced.</p>
        <p>The app has no server and no tracking. Your progress, quiz scores and settings stay in this browser (use ⚙️ Settings to back them up).</p>
      </section>
    </div>
  );
}
