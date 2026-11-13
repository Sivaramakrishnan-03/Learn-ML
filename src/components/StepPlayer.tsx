import { useEffect, useRef, useState } from 'react';

/** Play / pause / step / scrub over a list of precomputed frames. */
export function useStepPlayer(n: number, baseMs = 700) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef<number>();

  useEffect(() => { setI((v) => Math.min(v, Math.max(n - 1, 0))); }, [n]);
  useEffect(() => {
    if (!playing) return;
    timer.current = window.setTimeout(() => {
      setI((v) => {
        if (v >= n - 1) { setPlaying(false); return v; }
        return v + 1;
      });
    }, baseMs / speed);
    return () => window.clearTimeout(timer.current);
  }, [playing, i, n, baseMs, speed]);

  return {
    i, setI, playing, speed, setSpeed,
    toggle: () => { if (i >= n - 1) setI(0); setPlaying((p) => !p); },
    reset: () => { setPlaying(false); setI(0); },
    next: () => { setPlaying(false); setI((v) => Math.min(n - 1, v + 1)); },
    prev: () => { setPlaying(false); setI((v) => Math.max(0, v - 1)); },
    n,
  };
}

const KEY_HELP = 'Keyboard: Space plays or pauses, Left and Right arrows step, Home restarts.';
const INTERACTIVE = 'button, input, select, textarea, a[href], [role=button], [role=tab], [contenteditable=true]';

/** The element that counts as "the player area": the animation layout around the controls (or their parent). */
function playerArea(el: HTMLElement): HTMLElement {
  const layout = el.closest<HTMLElement>('.viz-layout');
  if (layout && !layout.dataset.playerKeys) return layout;
  return el.parentElement ?? el;
}

export function PlayerControls({ p }: { p: ReturnType<typeof useStepPlayer> }) {
  const ref = useRef<HTMLDivElement>(null);
  const area = useRef<HTMLElement | null>(null);
  const live = useRef<HTMLDivElement>(null);
  const pRef = useRef(p); pRef.current = p;

  // Keyboard shortcuts while the player area (or one of its non-text controls) has focus.
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const a = playerArea(el); area.current = a;
    if (a.dataset.playerKeys) return; // another player already owns this area
    a.dataset.playerKeys = '1';
    const addedTab = !a.hasAttribute('tabindex');
    if (addedTab) a.setAttribute('tabindex', '0');
    const hadLabel = a.hasAttribute('aria-label');
    if (!hadLabel) a.setAttribute('aria-label', `Animation player. ${KEY_HELP}`);
    a.setAttribute('aria-keyshortcuts', 'Space ArrowLeft ArrowRight Home');
    a.classList.add('player-area');
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target as HTMLElement;
      const onControl = t !== a && t.closest(INTERACTIVE);
      const q = pRef.current;
      if (e.key === ' ' || e.key === 'Spacebar') { if (onControl) return; e.preventDefault(); q.toggle(); }
      else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        // Sliders and selects use the arrow keys themselves.
        if (onControl && t.closest('input, select, textarea, [role=tab]')) return;
        e.preventDefault(); if (e.key === 'ArrowRight') q.next(); else q.prev();
      } else if (e.key === 'Home') { if (onControl && t.closest('input, select, textarea')) return; e.preventDefault(); q.reset(); }
    };
    a.addEventListener('keydown', onKey);
    return () => {
      a.removeEventListener('keydown', onKey);
      delete a.dataset.playerKeys;
      if (addedTab) a.removeAttribute('tabindex');
      if (!hadLabel) a.removeAttribute('aria-label');
      a.removeAttribute('aria-keyshortcuts');
      a.classList.remove('player-area');
    };
  }, []);

  // Announce "Step i of n" plus the narration caption (read after the frame has rendered).
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    const id = window.setTimeout(() => {
      const a = area.current, region = live.current; if (!region) return;
      let box: HTMLElement | null = a, cap = '';
      for (let k = 0; box && k < 4 && !cap; k++, box = box.parentElement) cap = box.querySelector('.caption')?.textContent?.trim() ?? '';
      region.textContent = `Step ${p.i + 1} of ${p.n}.${cap ? ' ' + cap : ''}`;
    }, p.playing ? 120 : 60);
    return () => window.clearTimeout(id);
  }, [p.i, p.n]);

  return (
    <div className="player" ref={ref} role="group" aria-label="Animation controls">
      <button type="button" className="btn" onClick={p.reset} title="Restart" aria-label="Restart (Home)"><span aria-hidden="true">⏮</span></button>
      <button type="button" className="btn" onClick={p.prev} title="Step back" aria-label="Step back (Left arrow)"><span aria-hidden="true">◀</span></button>
      <button type="button" className="btn primary" onClick={p.toggle} style={{ minWidth: 74 }} aria-label={p.playing ? 'Pause (Space)' : 'Play (Space)'}>
        <span aria-hidden="true">{p.playing ? '❚❚ Pause' : '▶ Play'}</span>
      </button>
      <button type="button" className="btn" onClick={p.next} title="Step forward" aria-label="Step forward (Right arrow)"><span aria-hidden="true">▶</span></button>
      <input type="range" min={0} max={Math.max(p.n - 1, 0)} value={p.i} onChange={(e) => p.setI(+e.target.value)}
        aria-label="Animation step" aria-valuetext={`Step ${p.i + 1} of ${p.n}`} />
      <span className="mono muted small" aria-hidden="true">{p.i + 1}/{p.n}</span>
      <select value={p.speed} onChange={(e) => p.setSpeed(+e.target.value)} aria-label="Playback speed">
        <option value={0.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option><option value={4}>4×</option>
      </select>
      <div className="sr-only" aria-live="polite" aria-atomic="true" ref={live} />
    </div>
  );
}
