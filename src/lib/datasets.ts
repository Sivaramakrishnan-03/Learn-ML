// Seeded synthetic datasets. All live in a 0..10 × 0..10 "world" so every canvas can share scales.

export interface P { x: number; y: number; label?: number }

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gauss(r: () => number) {
  const u = Math.max(r(), 1e-9), v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const clamp = (v: number) => Math.min(9.8, Math.max(0.2, v));

/** Business case: Chennai flats — x = area (×100 sq ft), y = price (×10 lakh). */
export function flats(n = 30, seed = 7): P[] {
  const r = rng(seed);
  return Array.from({ length: n }, () => {
    const x = 1 + r() * 8;
    return { x, y: clamp(0.8 + 0.85 * x + gauss(r) * 0.8) };
  });
}

/** Business case: customer segmentation — x = visits/month, y = avg basket (₹ ×1000). */
export function customers(n = 90, k = 3, seed = 11): P[] {
  const r = rng(seed);
  const centres = [
    { x: 2.5, y: 7.5 }, { x: 7.5, y: 7 }, { x: 5, y: 2.5 }, { x: 2, y: 2.5 }, { x: 8, y: 2.5 },
  ].slice(0, Math.max(k, 3));
  return Array.from({ length: n }, (_, i) => {
    const c = centres[i % centres.length];
    return { x: clamp(c.x + gauss(r) * 0.9), y: clamp(c.y + gauss(r) * 0.9), label: i % centres.length };
  });
}

/** Business case: loan approval — x = income, y = credit score; label 1 = repaid. Non-linear-ish boundary. */
export function loans(n = 80, seed = 5): P[] {
  const r = rng(seed);
  return Array.from({ length: n }, () => {
    const x = 0.5 + r() * 9, y = 0.5 + r() * 9;
    const score = (x > 4.5 ? 1 : 0) + (y > 5.5 ? 1 : 0) + (x > 7 && y > 2.5 ? 1 : 0);
    let label = score >= 2 ? 1 : 0;
    if (r() < 0.08) label = 1 - label; // label noise
    return { x, y, label };
  });
}

/** Two interleaved moons (for the compare view). */
export function moons(n = 120, seed = 3): P[] {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const lab = i % 2;
    const a = r() * Math.PI;
    const x = lab === 0 ? Math.cos(a) : 1 - Math.cos(a);
    const y = lab === 0 ? Math.sin(a) : 0.5 - Math.sin(a);
    return { x: clamp(2 + x * 3 + gauss(r) * 0.3), y: clamp(4.2 + y * 3.2 + gauss(r) * 0.3), label: lab };
  });
}

/** Linearly separable-ish blobs with two classes. */
export function blobs2(n = 100, seed = 9): P[] {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const lab = i % 2;
    return { x: clamp((lab ? 6.5 : 3.5) + gauss(r) * 1.3), y: clamp((lab ? 6.2 : 3.8) + gauss(r) * 1.3), label: lab };
  });
}

/** Concentric circles. */
export function circles(n = 120, seed = 4): P[] {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const lab = i % 2;
    const a = r() * 2 * Math.PI;
    const rad = (lab ? 1.3 : 3.5) + gauss(r) * 0.35;
    return { x: clamp(5 + rad * Math.cos(a)), y: clamp(5 + rad * Math.sin(a)), label: lab };
  });
}
