/** Lighten a #rrggbb colour by mixing it with white, so coloured labels stay readable (4.5:1) on the dark cards. */
export function readable(hex: string | undefined, mix = 0.28): string | undefined {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (255 - v) * mix));
  return '#' + ch.map((v) => v.toString(16).padStart(2, '0')).join('');
}
