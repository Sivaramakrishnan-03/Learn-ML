// Synthetic "Advertising" dataset, modelled on the classic ISLR example: 200 markets, ad budgets
// (in $1000s) for TV, radio and newspaper, and product sales (in 1000s of units).
// Generated in code (seeded), so there is no licensing question and every learner sees the same numbers.
// It is built to reproduce the textbook findings:
//   • TV and radio matter; newspaper adds nothing once radio is in the model (it's correlated with radio).
//   • TV × radio synergy (an interaction term), a mild curvature in TV, and error spread that grows with TV.
import { gauss, rng } from './datasets';

export interface AdRow { tv: number; radio: number; newspaper: number; sales: number }

export function advertising(n = 200, seed = 13): AdRow[] {
  const r = rng(seed);
  const rows: AdRow[] = [];
  for (let i = 0; i < n; i++) {
    const tv = +(0.7 + r() * 295.7).toFixed(1);
    const radio = +(r() * 49.6).toFixed(1);
    const newspaper = +Math.min(114, Math.max(0.3, 4 + 0.4 * radio + Math.exp(2.7 + 0.6 * gauss(r)))).toFixed(1);
    const mu = 3.4 + 0.052 * tv - 0.000085 * tv * tv + 0.042 * radio + 0.00095 * tv * radio;
    const sd = 0.25 + 0.0075 * tv;
    const sales = +Math.max(1.2, mu + sd * gauss(r)).toFixed(1);
    rows.push({ tv, radio, newspaper, sales });
  }
  return rows;
}

export const AD = advertising();
export const AD_COLS = ['tv', 'radio', 'newspaper'] as const;
export type AdCol = typeof AD_COLS[number];
export const AD_LABEL: Record<AdCol | 'sales', string> = { tv: 'TV ($k)', radio: 'Radio ($k)', newspaper: 'Newspaper ($k)', sales: 'Sales (k units)' };

/** CSV text, so the same data can be pasted into Python (used by the in-browser code labs). */
export const adCsv = (rows: AdRow[] = AD) => 'TV,radio,newspaper,sales\n' + rows.map((d) => `${d.tv},${d.radio},${d.newspaper},${d.sales}`).join('\n');
