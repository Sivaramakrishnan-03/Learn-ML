import { KeyboardEvent, ReactNode, useRef } from 'react';

export interface TabItem<T extends string> { id: T; label: ReactNode }

export const tabId = (prefix: string, id: string) => `${prefix}-tab-${id.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
export const panelId = (prefix: string) => `${prefix}-panel`;

/** WAI-ARIA tab list: roving tabindex, ←/→ (and ↑/↓) move and select, Home/End jump to the ends. */
export function TabList<T extends string>({ items, value, onChange, label, prefix, className = 'tabs', tabClass = 'tab', activeClass = 'active', renderTab }: {
  items: TabItem<T>[]; value: T; onChange: (v: T) => void; label: string; prefix: string;
  className?: string; tabClass?: string; activeClass?: string; renderTab?: (item: TabItem<T>, selected: boolean) => ReactNode;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    const n = items.length;
    let j = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % n;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + n) % n;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = n - 1;
    if (j < 0) return;
    e.preventDefault();
    onChange(items[j].id);
    refs.current[j]?.focus();
  };
  return (
    <div className={className} role="tablist" aria-label={label}>
      {items.map((it, i) => {
        const sel = it.id === value;
        return (
          <button key={it.id} ref={(el) => { refs.current[i] = el; }} type="button" role="tab" id={tabId(prefix, it.id)}
            aria-selected={sel} aria-controls={panelId(prefix)} tabIndex={sel ? 0 : -1}
            className={`${tabClass} ${sel ? activeClass : ''}`} onClick={() => onChange(it.id)} onKeyDown={(e) => onKey(e, i)}>
            {renderTab ? renderTab(it, sel) : it.label}
          </button>
        );
      })}
    </div>
  );
}

/** The panel controlled by a TabList with the same prefix. */
export function TabPanel({ prefix, value, children, className, heading }: { prefix: string; value: string; children: ReactNode; className?: string; heading?: string }) {
  return <div role="tabpanel" id={panelId(prefix)} aria-labelledby={tabId(prefix, value)} className={className}>
    {heading && <h2 className="sr-only">{heading}</h2>}
    {children}
  </div>;
}
