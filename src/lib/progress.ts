import { useSyncExternalStore } from 'react';
import { TOPIC_BY_ID, withAncestors } from '../data/curriculum';

// Progress lives only in this browser. Wrapped in try/catch: private windows can block storage.
export type Mark = 'done' | 'tested';
type State = Record<string, Mark>;
const KEY = 'learnpath-ml:progress:v1';

let state: State = load();
const listeners = new Set<() => void>();

function load(): State {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

export const progress = {
  get: () => state,
  subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); },
  toggle(id: string) {
    state = { ...state };
    if (state[id]) delete state[id]; else state[id] = 'done';
    save();
  },
  markTested(ids: string[]) {
    state = { ...state };
    ids.forEach((id) => { if (!state[id]) state[id] = 'tested'; });
    save();
  },
  reset() { state = {}; save(); },
};

export function useProgress() {
  return useSyncExternalStore(progress.subscribe, progress.get, progress.get);
}

export function isUnlocked(id: string, s: State) {
  return TOPIC_BY_ID[id].prereqs.every((p) => !!s[p]);
}

export function testOut(id: string) {
  progress.markTested([...withAncestors(id)]);
}
