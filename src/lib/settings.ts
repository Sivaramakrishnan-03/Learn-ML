import { useSyncExternalStore } from 'react';

// Per-viewer reading preferences, kept in this browser only.
export interface Settings { theme: 'dark' | 'light'; width: 'comfortable' | 'full'; pythonUrl: string }
export const DEFAULT_PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
const KEY = 'learnpath-ml:settings:v1';
const DEFAULTS: Settings = { theme: 'dark', width: 'comfortable', pythonUrl: DEFAULT_PYODIDE };

let state: Settings = load();
const subs = new Set<() => void>();
function load(): Settings { try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return DEFAULTS; } }
function apply() {
  const el = document.documentElement;
  el.dataset.theme = state.theme;
  el.dataset.width = state.width;
}
export const settings = {
  get: () => state,
  set(patch: Partial<Settings>) {
    state = { ...state, ...patch };
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
    apply(); subs.forEach((f) => f());
  },
  subscribe(f: () => void) { subs.add(f); return () => { subs.delete(f); }; },
  apply,
};
export const useSettings = () => useSyncExternalStore(settings.subscribe, settings.get, settings.get);
