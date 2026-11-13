import { progress } from './progress';
import { results } from './results';

/** Export / import everything a learner has done, so progress survives a new laptop or a cleared browser. */
export function exportBackup() {
  const data = { app: 'learnpath-ml', version: 1, exportedAt: new Date().toISOString(), progress: progress.get(), results: results.get() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `learnpath-ml-progress-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
export async function importBackup(file: File): Promise<string> {
  const data = JSON.parse(await file.text());
  if (data?.app !== 'learnpath-ml' || typeof data.progress !== 'object') throw new Error('This file is not a LearnPath ML progress backup.');
  progress.replace(data.progress);
  if (data.results) results.replace(data.results);
  return `Restored ${Object.keys(data.progress).length} completed topics.`;
}
