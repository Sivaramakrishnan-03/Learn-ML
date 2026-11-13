import { useSyncExternalStore } from 'react';

// Quiz and exam scores (this browser only). Used for "best score" badges and the progress backup.
export interface Score { best: number; last: number; total: number; at: string }
type State = { quiz: Record<string, Score>; exam: Record<string, Score> };
const KEY = 'learnpath-ml:results:v1';
let state: State = load();
const subs = new Set<() => void>();
function load(): State { try { return { quiz: {}, exam: {}, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { quiz: {}, exam: {} }; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ } subs.forEach((f) => f()); }
function rec(map: Record<string, Score>, id: string, score: number, total: number) {
  const prev = map[id];
  return { ...map, [id]: { best: Math.max(prev?.best ?? 0, score), last: score, total, at: new Date().toISOString() } };
}
export const results = {
  get: () => state,
  subscribe(f: () => void) { subs.add(f); return () => { subs.delete(f); }; },
  quiz(id: string, score: number, total: number) { state = { ...state, quiz: rec(state.quiz, id, score, total) }; save(); },
  exam(track: string, score: number, total: number) { state = { ...state, exam: rec(state.exam, track, score, total) }; save(); },
  replace(s: Partial<State>) { state = { quiz: s.quiz ?? {}, exam: s.exam ?? {} }; save(); },
  reset() { state = { quiz: {}, exam: {} }; save(); },
};
export const useResults = () => useSyncExternalStore(results.subscribe, results.get, results.get);
