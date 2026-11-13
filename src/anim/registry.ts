// Lazy registry: each topic's animation loads only when its page is opened.
import { useEffect, useState } from 'react';
import { TopicAnim } from './types';
import { MODELS } from '../models/registry';

const loaders = import.meta.glob('./*.tsx') as Record<string, () => Promise<{ default: TopicAnim }>>;
const key = (id: string) => `./${id}.tsx`;

export const hasAnim = (id: string) => key(id) in loaders;
export const isAnimated = (id: string) => !!MODELS[id] || hasAnim(id);

export function useTopicAnim(id: string) {
  const [state, setState] = useState<{ id: string; anim?: TopicAnim; error?: string }>({ id });
  useEffect(() => {
    let live = true;
    setState({ id });
    const load = loaders[key(id)];
    if (load) load().then((m) => live && setState({ id, anim: m.default })).catch((e) => live && setState({ id, error: String(e?.message ?? e) }));
    return () => { live = false; };
  }, [id]);
  return state.id === id ? state : { id };
}
