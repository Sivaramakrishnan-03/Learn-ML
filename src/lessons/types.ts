// A plain-English lesson. Every one of the 69 topics has one, so no page is ever empty.
// Inline formatting: **bold** and `code`. Math uses KaTeX in `formula.tex`.
export interface CheckQ { q: string; options: string[]; answer: number; why: string }
export interface Lesson {
  goals: string[];                       // "By the end you will be able to…"
  why: string;                           // why it matters, with a real-world use
  explain: string[];                     // the lesson itself, short paragraphs
  formula?: { tex: string; plain: string }; // optional, always read out in words
  example: { title: string; steps: string[]; result: string }; // worked example with numbers
  mistakes: string[];                    // common mistakes / misconceptions
  takeaways: string[];                   // key points to remember
  check: CheckQ[];                       // quick self-check
  use?: string[];                        // playbook: when to use it
  avoid?: string[];                      // playbook: when not to / watch-outs
  practice?: { code: string; note?: string }; // playbook: how you actually do it in Python
  interview?: string[];                  // playbook: questions you should be able to answer
  minutes: number;
}
