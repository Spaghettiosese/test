// Town Life (Stardew-style meta systems): shared state, helpers, the daily luck value.
// Save data: state.svlife = { luck:{day,base,bonus}, cart:{}, orders:{...}, secrets:{...}, evals:{year:{...}}, seen:{kind:{id:1}}, mailQ:[], sent:{} }
// Condition kind added: luck>=60 (0..100 daily luck). Bus events emitted: svOrderDone, svNoteFound, svEvaluation.
import { register, get, all } from '../../core/registry.js';
import { addCondKind } from '../../core/cond.js';
import { yearOf, seasonOf, dateOf } from '../../core/time.js';

register('stateSlice', 'svlife', { default: () => ({
  luck: { day: 0, base: 50, bonus: 0, read: 0 },
  cart: { bought: {} }, orders: { offers: [], active: [], done: {}, week: -1, seq: 1, doneCount: 0 },
  secrets: { found: {}, maps: {}, dug: {}, claimed: {} }, evals: {}, seen: {}, mailQ: [], sent: {}, boatSeen: 0,
}) });
export const S = (g) => (g.state.svlife ||= { luck: { day: 0, base: 50, bonus: 0, read: 0 }, cart: { bought: {} }, orders: { offers: [], active: [], done: {}, week: -1, seq: 1, doneCount: 0 }, secrets: { found: {}, maps: {}, dug: {}, claimed: {} }, evals: {}, seen: {}, mailQ: [], sent: {}, boatSeen: 0 });

export const say = (who, mood, text) => ({ t: 'say', who, mood, text });
export const N = (text) => ({ t: 'say', who: null, mood: null, text });
export const call = (fn) => ({ t: 'call', fn });
export const pick = (r, a) => a[Math.floor(r() * a.length)];
export const nameOf = (id) => (get('npc', id) || { name: id }).name;
export const has = (id) => !!get('item', id);
export const people = () => all('npc').filter((n) => !n.hidden && n.gifts);
// Give an item if it exists, else coins. Returns a short text for toasts.
export function giveOr(g, id, coins = 50) {
  if (id && has(id)) { g.give(id, 1); return get('item', id).name; }
  g.addMoney(coins); return `${coins} coins`;
}
export function stickers(g, n, why) { if (n > 0 && has('star_sticker')) { g.give('star_sticker', n, true); g.stat('starStickers', n); g.toast(`+${n} Star Sticker${n > 1 ? 's' : ''}${why ? ': ' + why : ''}`, get('item', 'star_sticker').icon); } }
export const idle = (g) => !!(g.world && g.scenes.top === g.world && !g.world.busy);

// ---------------------------------------------------------------- daily luck
export const LUCK_TIERS = [[15, 'Awful'], [35, 'Poor'], [62, 'Okay'], [82, 'Good'], [101, 'Great']];
export function luckBase(g) {
  const s = S(g).luck;
  if (s.day !== g.day) {
    const r = g.rngFor('svluck'), a = r(), b = r();
    s.day = g.day; s.base = Math.round(18 + (a + b) * 32 + (g.weather === 'sunny' ? 6 : g.weather === 'storm' ? -6 : 0)); s.bonus = 0; s.read = 0;
    s.base = Math.max(3, Math.min(97, s.base));
  }
  return s.base;
}
export function luckValue(g) {
  luckBase(g);
  const s = S(g).luck, lucky = g.flag('lucky_today') ? 18 : 0, shrine = g.state.coast && g.state.coast.luckyDay === g.day ? 12 : 0;
  return Math.max(0, Math.min(100, s.base + s.bonus + lucky + shrine));
}
export const luckTier = (v) => LUCK_TIERS.find(([m]) => v < m)[1];
export function addLuck(g, n) { luckBase(g); S(g).luck.bonus += n; }
addCondKind('luck', (g) => luckValue(g));
export const yr = (g) => yearOf(g.day);
export const isYearEnd = (g) => seasonOf(g.day) === 'winter' && dateOf(g.day) === 28;
