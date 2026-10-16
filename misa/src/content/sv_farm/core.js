// Shared helpers: quality stars ledger. Items are plain ids, so starred units are tracked as counts per item
// (state.sv_farm.q[id] = [silver, gold, star]); machines, bins and the shipping box honour them.
import { get } from '../../core/registry.js';
import { SV } from './data.js';

export const STAR = ['', 'Silver', 'Gold', 'Star'];
export const QMUL = [0, 0.25, 0.5, 1];
export function addStar(game, id, q, n = 1) { if (!q || !SV(game)) return; const L = (SV(game).q[id] ||= [0, 0, 0]); L[q - 1] += n; }
export function takeStar(game, id) {
  const L = SV(game).q[id]; if (!L) return 0;
  for (let i = 2; i >= 0; i--) if (L[i] > 0) { L[i]--; return i + 1; }
  return 0;
}
// Bonus coins for n units of an item that sell at unit price p (consumes the ledger).
export function starBonus(game, id, n, unit) {
  const L = SV(game).q[id]; let b = 0;
  if (L) for (let i = 2; i >= 0 && n > 0; i--) { const k = Math.min(L[i], n); L[i] -= k; n -= k; b += k * unit * QMUL[i + 1]; }
  return Math.round(b);
}
export function pruneStars(game, keep = {}) {
  const Q = SV(game).q;
  for (const [id, L] of Object.entries(Q)) {
    let cap = game.count(id) + (keep[id] || 0);
    for (let i = 2; i >= 0; i--) { L[i] = Math.min(L[i], cap); cap -= L[i]; }
    if (!L[0] && !L[1] && !L[2]) delete Q[id];
  }
}
export const starTotal = (game) => Object.values(SV(game).q).reduce((a, L) => a + L[0] + L[1] + L[2], 0);
export const nm = (id) => (get('item', id) || { name: id }).name;
export const isArtisan = (id) => id.startsWith('art_') && ((get('item', id) || {}).tags || []).includes('artisan');
