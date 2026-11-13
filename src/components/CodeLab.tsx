import { useState } from 'react';

// Pyodide = CPython compiled to WebAssembly. Loaded lazily (≈10 MB, needs internet the first time).
import { settings } from '../lib/settings';
const pyodideUrl = () => { const u = settings.get().pythonUrl.trim(); return u.endsWith('/') ? u : u + '/'; };
declare global { interface Window { loadPyodide?: (o: { indexURL: string }) => Promise<any> } }
let pyPromise: Promise<any> | null = null;

function getPy(log: (s: string) => void) {
  if (!pyPromise) {
    pyPromise = new Promise<void>((res, rej) => {
      if (window.loadPyodide) return res();
      const s = document.createElement('script');
      s.src = pyodideUrl() + 'pyodide.js'; s.onload = () => res(); s.onerror = () => rej(new Error('PYODIDE_UNREACHABLE'));
      document.head.appendChild(s);
    }).then(async () => {
      log('Starting Python…');
      const py = await window.loadPyodide!({ indexURL: pyodideUrl() });
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
  const [offline, setOffline] = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(code[sel]); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* blocked */ } };

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
      const msg = String(e?.message || e);
      if (msg.includes('PYODIDE_UNREACHABLE') || /Failed to fetch|NetworkError/i.test(msg)) {
        setOffline(true);
        log('❌ The in-browser Python runtime could not be downloaded from ' + settings.get().pythonUrl);
      } else log('❌ ' + msg.split('\n').slice(-4).join('\n'));
    } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="row" style={{ marginBottom: 10 }}>
        {snippets.map((s, i) => (
          <button key={i} type="button" aria-pressed={i === sel} className={`btn ${i === sel ? 'primary' : ''}`} onClick={() => setSel(i)}>{s.title}</button>
        ))}
        <span className="spacer" />
        <button className="btn" onClick={copy}>{copied ? '✓ Copied' : '📋 Copy'}</button>
        <button className="btn" onClick={() => setCode((c) => c.map((v, i) => (i === sel ? snippets[i].code : v)))}>Reset code</button>
        <button className="btn ok" onClick={run} disabled={busy}>{busy ? 'Running…' : '▶ Run'}</button>
      </div>
      <textarea className="code" spellCheck={false} value={code[sel]} style={{ minHeight: rows * 19 }} aria-label={`Python code: ${snippets[sel].title}`}
        onChange={(e) => setCode((c) => c.map((v, i) => (i === sel ? e.target.value : v)))} />
      <div className="small muted" style={{ margin: '8px 0 4px' }} id="codelab-out-label">Output</div>
      <div className="out mono" role="log" aria-live="polite" aria-labelledby="codelab-out-label" tabIndex={0}>{out}</div>
      {offline && <div className="callout warn" style={{ marginTop: 10 }}>
        <b>Python can't run in the browser on this network.</b> This usually means a firewall blocks <code className="inline">cdn.jsdelivr.net</code> or you are offline. You can still:
        <ol style={{ margin: '6px 0 0' }}>
          <li>Press <b>📋 Copy</b> and run the code in Jupyter, VS Code or Google Colab (needs <code className="inline">pip install numpy pandas scikit-learn scipy</code>).</li>
          <li>Ask IT to allow <code className="inline">cdn.jsdelivr.net</code>, or host Pyodide internally and set its address under <b>⚙️ Settings → Python runtime</b>.</li>
        </ol>
      </div>}
    </div>
  );
}
