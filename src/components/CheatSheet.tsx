import { ReactNode } from 'react';

export function CheatSheet({ children }: { children: ReactNode }) {
  return (
    <div>
      <div className="row" style={{ marginBottom: 12 }}>
        <span className="muted small">One page, print-ready. Use your browser's "Save as PDF".</span>
        <span className="spacer" />
        <button className="btn primary" onClick={() => window.print()}>🖨 Print / Save PDF</button>
      </div>
      <div className="sheet">{children}</div>
    </div>
  );
}
