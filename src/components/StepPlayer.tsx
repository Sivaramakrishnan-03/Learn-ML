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

export function PlayerControls({ p }: { p: ReturnType<typeof useStepPlayer> }) {
  return (
    <div className="player">
      <button className="btn" onClick={p.reset} title="Restart">⏮</button>
      <button className="btn" onClick={p.prev} title="Step back">◀</button>
      <button className="btn primary" onClick={p.toggle} style={{ minWidth: 74 }}>{p.playing ? '❚❚ Pause' : '▶ Play'}</button>
      <button className="btn" onClick={p.next} title="Step forward">▶</button>
      <input type="range" min={0} max={Math.max(p.n - 1, 0)} value={p.i} onChange={(e) => p.setI(+e.target.value)} aria-label="Scrub" />
      <span className="mono muted small">{p.i + 1}/{p.n}</span>
      <select value={p.speed} onChange={(e) => p.setSpeed(+e.target.value)} aria-label="Speed">
        <option value={0.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option><option value={4}>4×</option>
      </select>
    </div>
  );
}
