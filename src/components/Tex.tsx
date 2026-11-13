import katex from 'katex';
import 'katex/dist/katex.min.css';
import { useMemo } from 'react';

export function Tex({ children, block = false }: { children: string; block?: boolean }) {
  const html = useMemo(
    () => katex.renderToString(children, { displayMode: block, throwOnError: false }),
    [children, block],
  );
  return block ? <div dangerouslySetInnerHTML={{ __html: html }} /> : <span dangerouslySetInnerHTML={{ __html: html }} />;
}
