// Long-form, chapter-based guide with a sticky chapter navigator and per-browser reading progress.
import { ComponentType, useEffect, useRef, useState, useSyncExternalStore } from 'react';

export interface Chapter { id: string; title: string; part: string; minutes: number; level: 1 | 2 | 3; Body: ComponentType }

const store = (key: string) => {
  const listeners = new Set<() => void>();
  let cache: { read: string[]; at: string } | null = null;
  const get = () => {
    if (!cache) { try { cache = JSON.parse(localStorage.getItem(key) || 'null'); } catch { /* ignore */ } cache ??= { read: [], at: '' }; }
    return cache;
  };
  const set = (v: { read: string[]; at: string }) => {
    cache = v; try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ }
    listeners.forEach((l) => l());
  };
  return { get, set, sub: (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; } };
};
const stores: Record<string, ReturnType<typeof store>> = {};

const LEVEL = ['', 'core', 'practitioner', 'advanced'];

export function Guide({ id, chapters, title }: { id: string; chapters: Chapter[]; title: string }) {
  const st = (stores[id] ??= store(`learnpath-ml:guide:${id}:v1`));
  const s = useSyncExternalStore(st.sub, st.get, st.get);
  const [cur, setCur] = useState(() => Math.max(0, chapters.findIndex((c) => c.id === s.at)));
  const top = useRef<HTMLDivElement>(null);
  const ch = chapters[cur];
  const go = (i: number) => {
    setCur(i);
    st.set({ ...st.get(), at: chapters[i].id });
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const toggleRead = (cid: string) => {
    const r = new Set(st.get().read);
    r.has(cid) ? r.delete(cid) : r.add(cid);
    st.set({ ...st.get(), read: [...r] });
  };
  const done = () => {
    const r = new Set(st.get().read); r.add(ch.id);
    st.set({ ...st.get(), read: [...r] });
    if (cur < chapters.length - 1) go(cur + 1);
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input,textarea,select')) return;
      if (e.altKey && e.key === 'ArrowRight' && cur < chapters.length - 1) go(cur + 1);
      if (e.altKey && e.key === 'ArrowLeft' && cur > 0) go(cur - 1);
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  });
  const parts = [...new Set(chapters.map((c) => c.part))];
  const readN = chapters.filter((c) => s.read.includes(c.id)).length;
  const mins = chapters.reduce((a, c) => a + c.minutes, 0);

  return (
    <div className="guide" ref={top}>
      <nav className="guide-nav">
        <div className="small muted">{title}</div>
        <div className="small" style={{ margin: '4px 0 2px' }}><b>{readN}</b> / {chapters.length} chapters · ~{Math.round(mins / 60 * 10) / 10} h</div>
        <div className="bar"><div style={{ width: `${(readN / chapters.length) * 100}%` }} /></div>
        {parts.map((p) => (
          <div key={p}>
            <div className="guide-part">{p}</div>
            {chapters.map((c, i) => c.part === p && (
              <button key={c.id} className={`guide-link ${i === cur ? 'on' : ''}`} onClick={() => go(i)}>
                <span className={`check sm ${s.read.includes(c.id) ? 'on' : ''}`}>{s.read.includes(c.id) ? '✓' : ''}</span>
                <span>{i + 1}. {c.title}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>
      <article className="guide-body">
        <div className="row small muted" style={{ marginBottom: 4 }}>
          <span>Chapter {cur + 1} of {chapters.length} · {ch.part}</span>
          <span className="pill">{LEVEL[ch.level]}</span>
          <span className="pill">~{ch.minutes} min</span>
          <span className="spacer" />
          <label className="row small" style={{ gap: 6 }}><input type="checkbox" checked={s.read.includes(ch.id)} onChange={() => toggleRead(ch.id)} /> read</label>
        </div>
        <h2 className="guide-h">{ch.title}</h2>
        <div className="guide-content" key={ch.id}><ch.Body /></div>
        <div className="row guide-foot">
          {cur > 0 && <button className="btn" onClick={() => go(cur - 1)}>← {chapters[cur - 1].title}</button>}
          <span className="spacer" />
          <button className="btn ok" onClick={done}>{cur < chapters.length - 1 ? `Done · next: ${chapters[cur + 1].title} →` : '✓ Finish guide'}</button>
        </div>
        <div className="small muted" style={{ textAlign: 'right', marginTop: 6 }}>Tip: Alt + ← / → switches chapters.</div>
      </article>
    </div>
  );
}
