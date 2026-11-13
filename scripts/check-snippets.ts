// Runs every Python snippet in the content (lesson practice code + project starter code) with python3.
// Usage: npx tsx scripts/check-snippets.ts [topicId ...]
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';

const only = process.argv.slice(2);
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'lp-snippets-'));
const jobs: { name: string; code: string }[] = [];
for (const id of fs.readdirSync('content/topics')) {
  if (only.length && !only.includes(id)) continue;
  const L = JSON.parse(fs.readFileSync(`content/topics/${id}/lesson.json`, 'utf8'));
  if (L.practice?.code) jobs.push({ name: `lesson:${id}`, code: L.practice.code });
}
if (fs.existsSync('content/projects') && !only.length) for (const f of fs.readdirSync('content/projects').filter((f) => f.endsWith('.json'))) {
  const P = JSON.parse(fs.readFileSync(`content/projects/${f}`, 'utf8'));
  // project steps build on each other: run them in order as one script
  const code = P.steps.filter((s: any) => s.code).map((s: any) => s.code).join('\n\n');
  if (code) jobs.push({ name: `project:${P.id}`, code });
}
let fails = 0;
for (const j of jobs) {
  const file = path.join(work, `s_${j.name.replace(/\W/g, '_')}.py`); // prefix avoids shadowing library names
  fs.writeFileSync(file, j.code);
  const r = spawnSync('python3', ['-W', 'ignore', file], { cwd: work, encoding: 'utf8', timeout: 180000, env: { ...process.env, MPLBACKEND: 'Agg' } });
  const ok = r.status === 0;
  if (!ok) fails++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${j.name}${ok ? '' : '\n     ' + (r.stderr || r.error?.message || '').trim().split('\n').slice(-3).join('\n     ')}`);
}
console.log(fails ? `\n${fails} snippet(s) failed` : `\nAll ${jobs.length} snippets ran.`);
process.exit(fails ? 1 : 0);
