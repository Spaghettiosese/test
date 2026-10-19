// Seasons & Meta: shared state. Save data: state.sv5 = { stamps, plays, gold, yearly, badges, ceremony, grand, dex, tips, snaps, chal, wish, rec, cfg }
// Bus events emitted: sv5Activity {id, stars, season}, sv5Badge {season}, sv5Ceremony {kind}, sv5Snap {id}, sv5Wish {stars}, sv5Challenge {id}.
import { register } from '../../core/registry.js';
export { say, N, call, has, giveOr, stickers, idle, nameOf } from '../sv_life/state.js';

const DEF = () => ({
  stamps: {}, plays: {}, gold: {}, yearly: {}, badges: {}, ceremony: {}, grand: 0, decorGot: {},
  dex: { item: {}, npc: {}, map: {}, recipe: {}, wild: {} }, dexSeen: {},
  tips: { shown: {}, order: [], off: 0 }, snaps: [], snapSeq: 0,
  chal: { week: -1, list: [], claimed: {}, done: 0 }, wish: { day: 0, goal: null, base: 0, done: 0, stars: 0, streak: 0, best: 0, last: 0, rewards: 0 },
  rec: { maxMoney: 0, bestDayActs: 0, dayActs: { day: 0, n: 0 }, scores: {} }, cfg: {},
});
register('stateSlice', 'sv5', { default: DEF });
export const S = (g) => { const s = (g.state.sv5 ||= DEF()); for (const [k, v] of Object.entries(DEF())) if (s[k] === undefined) s[k] = v; return s; };
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function title(g, t) { (g.state.titles ||= []).includes(t) || g.state.titles.push(t); g.toast(`New title: ${t}`, 'i_star'); }
