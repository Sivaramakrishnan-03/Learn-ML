import { useRef, useState } from 'react';
import { DEFAULT_PYODIDE, settings, useSettings } from '../lib/settings';
import { exportBackup, importBackup } from '../lib/backup';
import { progress, useProgress } from '../lib/progress';
import { results } from '../lib/results';
import { Choice } from '../viz/kit';

export default function Settings() {
  const s = useSettings();
  const p = useProgress();
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const [py, setPy] = useState(s.pythonUrl);
  const [diag, setDiag] = useState('');
  const testPython = async () => {
    setDiag('Testing…');
    const u = (py.endsWith('/') ? py : py + '/') + 'pyodide.js';
    try { const r = await fetch(u, { method: 'GET', cache: 'no-store' }); setDiag(r.ok ? `✅ Reachable (${u})` : `❌ HTTP ${r.status} from ${u}`); }
    catch { setDiag(`❌ Not reachable: ${u}. A firewall or proxy is blocking it, or you are offline.`); }
  };
  return (
    <div className="reading">
      <h1>⚙️ Settings</h1>
      <section className="lesson-sec"><h2 className="h3">Reading</h2>
        <Choice label="Theme" value={s.theme} onChange={(v) => settings.set({ theme: v })} options={[{ value: 'dark', label: '🌙 Dark' }, { value: 'light', label: '☀️ Light' }]} />
        <div style={{ height: 8 }} />
        <Choice label="Text width" value={s.width} onChange={(v) => settings.set({ width: v })} options={[{ value: 'comfortable', label: 'Comfortable (easier to read)' }, { value: 'full', label: 'Full width' }]} />
        <p className="small muted">Animations and diagrams always use the full width. Animation canvases stay dark in both themes for contrast.</p>
      </section>
      <section className="lesson-sec"><h2 className="h3">Your progress ({Object.keys(p).length} topics)</h2>
        <p className="small muted">Progress is stored only in this browser. Back it up to move it to another computer or browser.</p>
        <div className="row">
          <button className="btn primary" onClick={exportBackup}>⬇️ Download backup</button>
          <button className="btn" onClick={() => file.current?.click()}>⬆️ Restore from backup</button>
          <input ref={file} type="file" accept="application/json" hidden aria-label="Backup file" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { setMsg('✅ ' + await importBackup(f)); } catch (err: any) { setMsg('❌ ' + err.message); } e.target.value = ''; }} />
          <button className="btn" onClick={() => { if (confirmReset()) { progress.reset(); results.reset(); setMsg('Progress cleared.'); } }}>🗑 Reset progress</button>
        </div>
        <p className="small" style={{ marginTop: 8 }} role="status">{msg}</p>
      </section>
      <section className="lesson-sec"><h2 className="h3">Python runtime (for the ▶ Run buttons)</h2>
        <p className="small muted">Code runs in your browser with Pyodide, downloaded once from the address below. If your company network blocks it, ask IT to host Pyodide internally and paste that address here.</p>
        <div className="row"><input type="url" value={py} onChange={(e) => setPy(e.target.value)} style={{ flex: 1, minWidth: 'min(260px, 100%)' }} aria-label="Pyodide address" />
          <button className="btn" onClick={() => settings.set({ pythonUrl: py })}>Save</button>
          <button className="btn" onClick={() => { setPy(DEFAULT_PYODIDE); settings.set({ pythonUrl: DEFAULT_PYODIDE }); }}>Default</button>
          <button className="btn ok" onClick={testPython}>Test connection</button></div>
        <p className="small" style={{ marginTop: 8 }} role="status">{diag}</p>
      </section>
    </div>
  );
}
// Inline confirm without browser dialogs (they can block automation); a second click within 4 s confirms.
let armed = 0;
function confirmReset() { const now = Date.now(); if (now - armed < 4000) { armed = 0; return true; } armed = now; alertOnce(); return false; }
function alertOnce() { const el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = 'Click "Reset progress" again within 4 seconds to confirm.'; document.body.appendChild(el); setTimeout(() => el.remove(), 4000); }
