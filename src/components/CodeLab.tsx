import { useState } from 'react';

// Pyodide = CPython compiled to WebAssembly. Loaded lazily (≈10 MB, needs internet the first time).
const PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
declare global { interface Window { loadPyodide?: (o: { indexURL: string }) => Promise<any> } }
let pyPromise: Promise<any> | null = null;

function getPy(log: (s: string) => void) {
  if (!pyPromise) {
    pyPromise = new Promise<void>((res, rej) => {
      if (window.loadPyodide) return res();
      const s = document.createElement('script');
      s.src = PYODIDE + 'pyodide.js'; s.onload = () => res(); s.onerror = () => rej(new Error('Could not load Pyodide (offline?)'));
      document.head.appendChild(s);
    }).then(async () => {
      log('Starting Python…');
      const py = await window.loadPyodide!({ indexURL: PYODIDE });
      log('Loading numpy, pandas, scikit-learn (first time only)…');
      await py.loadPackage(['numpy', 'pandas', 'scikit-learn']);
      return py;
    });
    pyPromise.catch(() => { pyPromise = null; });
  }
  return pyPromise;
}

const loaded = new Set<string>();
async function ensurePackages(py: any, pkgs: string[], log: (s: string) => void) {
  const need = pkgs.filter((p) => !loaded.has(p));
  if (!need.length) return;
  log(`Loading ${need.join(', ')} (first time only)…`);
  await py.loadPackage(need);
  need.forEach((p) => loaded.add(p));
}

/** `globals` are injected as Python variables before the run (e.g. a dataset as CSV text). */
export interface Snippet { title: string; code: string; packages?: string[]; globals?: Record<string, string> }

export function CodeLab({ snippets, rows = 18 }: { snippets: Snippet[]; rows?: number }) {
  const [sel, setSel] = useState(0);
  const [code, setCode] = useState(snippets.map((s) => s.code));
  const [out, setOut] = useState('Press ▶ Run to execute real Python in your browser.');
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true); setOut('');
    const lines: string[] = [];
    const log = (s: string) => { lines.push(s); setOut(lines.join('\n')); };
    try {
      const py = await getPy(log);
      await ensurePackages(py, snippets[sel].packages ?? [], log);
      // Auto-load any other Pyodide package the code imports (scipy, statsmodels, matplotlib, sympy…)
      try { await py.loadPackagesFromImports(code[sel], { messageCallback: () => {} }); } catch { /* package not in Pyodide: the import error below explains */ }
      Object.entries(snippets[sel].globals ?? {}).forEach(([k, v]) => py.globals.set(k, v));
      lines.length = 0; setOut('');
      py.setStdout({ batched: (s: string) => log(s) });
      py.setStderr({ batched: (s: string) => log('⚠ ' + s) });
      await py.runPythonAsync(code[sel]);
      if (!lines.length) log('(finished, no output)');
    } catch (e: any) {
      log('❌ ' + String(e.message || e).split('\n').slice(-4).join('\n'));
    } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="row" style={{ marginBottom: 10 }}>
        {snippets.map((s, i) => (
          <button key={i} className={`btn ${i === sel ? 'primary' : ''}`} onClick={() => setSel(i)}>{s.title}</button>
        ))}
        <span className="spacer" />
        <button className="btn" onClick={() => setCode((c) => c.map((v, i) => (i === sel ? snippets[i].code : v)))}>Reset code</button>
        <button className="btn ok" onClick={run} disabled={busy}>{busy ? 'Running…' : '▶ Run'}</button>
      </div>
      <textarea className="code" spellCheck={false} value={code[sel]} style={{ minHeight: rows * 19 }}
        onChange={(e) => setCode((c) => c.map((v, i) => (i === sel ? e.target.value : v)))} />
      <div className="small muted" style={{ margin: '8px 0 4px' }}>Output</div>
      <div className="out mono">{out}</div>
    </div>
  );
}
