import { useId, useState } from 'react';
import { Md } from './Md';

export interface HowToStep { do: string; notice: string }
export interface HowToSpec { what: string; steps: HowToStep[] }

/** "How to use this" box shown above every interactive tab: what it shows, what to try, what to notice. */
export function HowTo({ spec }: { spec?: HowToSpec }) {
  const [open, setOpenState] = useState(() => { try { return localStorage.getItem('learnpath-ml:howto') !== 'hidden'; } catch { return true; } });
  const setOpen = (v: boolean) => { setOpenState(v); try { localStorage.setItem('learnpath-ml:howto', v ? 'shown' : 'hidden'); } catch { /* ignore */ } };
  const id = 'howto' + useId().replace(/:/g, '');
  if (!spec) return null;
  return (
    <div className="howto">
      <button type="button" className="howto-head" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls={id}>
        <span><span aria-hidden="true">🧭 </span>How to use this</span><span className="muted small" aria-hidden="true">{open ? 'hide ▲' : 'show ▼'}</span>
      </button>
      {open && <div className="howto-body" id={id}>
        <p style={{ marginBottom: 8 }}><Md text={spec.what} /></p>
        <ol>
          {spec.steps.map((s, i) => (
            <li key={i}><b>Try:</b> <Md text={s.do} /><br /><span className="notice"><span aria-hidden="true">👀 </span><b>Notice:</b> <Md text={s.notice} /></span></li>
          ))}
        </ol>
      </div>}
    </div>
  );
}

/** Generic guidance for tabs that work the same way on every model page. */
export const GENERIC_HOWTO: Record<string, HowToSpec> = {
  Pipeline: { what: 'The same model, followed from raw data to a deployed prediction, the way a real project runs.', steps: [
    { do: 'Press **▶ Play** or click each stage box in order.', notice: 'Each stage has one job. Most project time goes into Data, Clean and Features, not Train.' },
    { do: 'At **Evaluate**, read the metric in business units.', notice: 'Stakeholders care about "₹ off" or "customers caught", not abstract scores.' },
    { do: 'At **Deploy**, move the sliders.', notice: 'This is exactly what the model does in production: take inputs, return a prediction.' },
  ] },
  Math: { what: 'The formulas, built up one line at a time, with a picture for each step. Every line is explained in plain English on the right.', steps: [
    { do: 'Press **▶ Play**, or click **▶** to step at your own pace.', notice: 'Read the yellow explanation first, then look at the formula. The formula is just a compact way of writing that sentence.' },
    { do: 'Click any earlier line to jump back to it.', notice: 'Each step builds on the previous one. If a step is confusing, the line before it is usually the missing piece.' },
  ] },
  Code: { what: 'Real Python that runs inside your browser. No installation needed (it needs internet the first time to download Python).', steps: [
    { do: 'Pick a snippet tab, then press **▶ Run**.', notice: 'The first run takes 10–30 seconds while Python downloads. Later runs are instant.' },
    { do: 'Change a number in the code (e.g. a learning rate or k) and run again.', notice: 'Breaking things on purpose is the fastest way to learn. **Reset code** restores the original.' },
  ] },
  Quiz: { what: 'Check your understanding. Each answer comes with an explanation, and questions marked "interview" are typical job-interview questions.', steps: [
    { do: 'Answer every question.', notice: 'Read the explanation even when you are right: it often adds a detail.' },
    { do: 'Score 70% or more to mark the topic complete.', notice: 'Your progress is saved in this browser and unlocks the next topics in the skill tree.' },
  ] },
  'Cheat sheet': { what: 'Everything important about this model on one printable page.', steps: [
    { do: 'Press **Print / Save PDF** and choose "Save as PDF".', notice: 'Keep it for revision or interviews: it is designed to fit on one page.' },
  ] },
};
