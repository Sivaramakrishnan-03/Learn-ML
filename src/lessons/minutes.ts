import { DEEP } from './deep';
import { LESSONS } from './index';
export const minutesOf = (id: string) => DEEP[id]?.minutes ?? LESSONS[id]?.minutes;
