// All teaching content lives in /content as JSON so non-developers can edit it.
// Lessons and quizzes are small and loaded eagerly; chapters are large and loaded per topic.
import { useEffect, useState } from 'react';
import type { DeepLesson, LessonFile, QuizBank, Project } from './types';
export type * from './types';

const lessonMods = import.meta.glob('/content/topics/*/lesson.json', { eager: true, import: 'default' }) as Record<string, LessonFile>;
const chapterMods = import.meta.glob('/content/topics/*/chapter.json', { import: 'default' }) as Record<string, () => Promise<DeepLesson>>;
const quizMods = import.meta.glob('/content/quizzes/*.json', { eager: true, import: 'default' }) as Record<string, QuizBank>;
const projectMods = import.meta.glob('/content/projects/*.json', { eager: true, import: 'default' }) as Record<string, Project>;

const idOf = (p: string, re: RegExp) => p.match(re)![1];
export const LESSONS: Record<string, LessonFile> = Object.fromEntries(Object.entries(lessonMods).map(([p, v]) => [idOf(p, /topics\/([^/]+)\//), v]));
export const QUIZZES: Record<string, QuizBank> = Object.fromEntries(Object.entries(quizMods).map(([p, v]) => [idOf(p, /quizzes\/([^/]+)\.json$/), v]));
export const PROJECTS: Project[] = Object.values(projectMods).sort((a, b) => a.level - b.level || a.title.localeCompare(b.title));

export const minutesOf = (id: string) => LESSONS[id]?.chapterMinutes ?? LESSONS[id]?.minutes;

const chapterCache: Record<string, DeepLesson> = {};
export async function loadChapter(id: string): Promise<DeepLesson | undefined> {
  if (chapterCache[id]) return chapterCache[id];
  const load = chapterMods[`/content/topics/${id}/chapter.json`];
  if (!load) return undefined;
  return (chapterCache[id] = await load());
}
export async function loadAllChapters(): Promise<Record<string, DeepLesson>> {
  const ids = Object.keys(LESSONS);
  const all = await Promise.all(ids.map((id) => loadChapter(id)));
  return Object.fromEntries(ids.map((id, i) => [id, all[i]!]).filter(([, v]) => v));
}
export function useChapter(id: string) {
  const [s, set] = useState<{ id: string; ch?: DeepLesson; done: boolean }>({ id, ch: chapterCache[id], done: !!chapterCache[id] });
  useEffect(() => {
    let live = true;
    if (chapterCache[id]) { set({ id, ch: chapterCache[id], done: true }); return; }
    set({ id, done: false });
    loadChapter(id).then((ch) => live && set({ id, ch, done: true }));
    return () => { live = false; };
  }, [id]);
  return s.id === id ? s : { id, done: false };
}
