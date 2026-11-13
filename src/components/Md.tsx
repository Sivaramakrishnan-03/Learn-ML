import { Fragment } from 'react';

function code(text: string, keyBase: string) {
  return text.split(/(`[^`]+`)/g).map((p, i) => p.startsWith('`') && p.endsWith('`') && p.length > 1
    ? <code key={keyBase + i} className="inline">{p.slice(1, -1)}</code> : <Fragment key={keyBase + i}>{p}</Fragment>);
}

/** Tiny inline formatter: **bold** (may contain `code`) and `code`. Lesson text stays plain strings. */
export function Md({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return <span>{parts.map((p, i) => p.startsWith('**') && p.endsWith('**') && p.length > 4
    ? <strong key={i}>{code(p.slice(2, -2), `b${i}-`)}</strong> : <Fragment key={i}>{code(p, `t${i}-`)}</Fragment>)}</span>;
}
