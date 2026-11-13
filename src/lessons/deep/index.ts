// Collects every textbook chapter. Each group file exports a Record<topicId, DeepLesson>.
import { DeepLesson } from './types';
const modules = import.meta.glob('./g-*.ts', { eager: true }) as Record<string, Record<string, Record<string, DeepLesson>>>;
export const DEEP: Record<string, DeepLesson> = Object.assign({}, ...Object.values(modules).flatMap((m) => Object.values(m)));
