import { describe, it, expect } from 'vitest';
import fs from 'fs';
import { TOPICS, TOPIC_BY_ID, linearOrder, roleTrack, ROLES, RoleId } from '../src/data/curriculum';
import { REFERENCES, BOOKS } from '../src/data/references';

describe('curriculum', () => {
  it('has unique ids and known prerequisites', () => {
    expect(new Set(TOPICS.map((t) => t.id)).size).toBe(TOPICS.length);
    TOPICS.forEach((t) => t.prereqs.forEach((p) => expect(TOPIC_BY_ID[p], `${t.id} -> ${p}`).toBeTruthy()));
  });
  it('is a DAG: the linear track contains every topic, prerequisites first', () => {
    const order = linearOrder();
    expect(order.length).toBe(TOPICS.length);
    const pos = Object.fromEntries(order.map((t, i) => [t.id, i]));
    TOPICS.forEach((t) => t.prereqs.forEach((p) => expect(pos[p]).toBeLessThan(pos[t.id])));
  });
  it('role tracks are closed under prerequisites', () => {
    (Object.keys(ROLES) as RoleId[]).forEach((r) => {
      const ids = new Set(roleTrack(r).map((t) => t.id));
      ids.forEach((id) => TOPIC_BY_ID[id].prereqs.forEach((p) => expect(ids.has(p), `${r}: ${id} needs ${p}`).toBe(true)));
    });
  });
});

describe('every topic has complete content', () => {
  for (const t of TOPICS) {
    it(t.id, () => {
      expect(fs.existsSync(`content/topics/${t.id}/lesson.json`), 'lesson.json').toBe(true);
      expect(fs.existsSync(`content/topics/${t.id}/chapter.json`), 'chapter.json').toBe(true);
      const animated = fs.existsSync(`src/anim/${t.id}.tsx`) || ['linear-regression', 'kmeans', 'decision-tree'].includes(t.id);
      expect(animated, 'animation').toBe(true);
      expect(REFERENCES[t.id]?.length, 'book references').toBeGreaterThan(0);
      REFERENCES[t.id].forEach((r) => expect(BOOKS[r.book]).toBeTruthy());
    });
  }
});
