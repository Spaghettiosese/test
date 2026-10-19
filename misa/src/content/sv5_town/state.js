// Town Growth (sv5): shared state and helpers. Save slice `sv5t`. Flags: tp_<project>_site / _done / _cut, tp_in_<npc> (a family has moved in),
// tp_shop_<id>_open, tp_stall_permit, tp_cafe_open, tp_idea_<id>. Bus events emitted: tpProjectStart, tpProjectDone, tpArrival, tpShopOpen,
// tpStall, tpCafe, tpAuction, tpLottery, tpVolunteer, tpIdea, tpIssue, tpAward.
import { register, get } from '../../core/registry.js';
import { queueMail } from '../social/mail.js';
export { sc, ch, open, leave, flag, mark, time, mood, giveOr, backdrop, npc } from '../social/util.js';

export const DEF = () => ({
  proj: {}, donated: 0, award: {}, vol: { pts: 0, days: {}, trips: 0 },
  arrived: {}, shopOpen: {}, seenVan: {},
  stall: { permit: 0, rep: 0, sales: 0, earned: 0, spent: 0, sessions: 0, ups: { awning: 0, sign: 0, till: 0 }, log: [], best: 0, last: 0, featured: 0 },
  cafe: { open: 0, menu: [], staff: [], sessions: 0, earned: 0, rep: 0, log: [], last: 0 },
  bank: { bal: 0, interest: 0, lastInt: 0, goal: 'bike', pots: { bike: 0, boat: 0, house: 0 }, loan: 0, borrowed: 0, repaid: 0, reached: {} },
  shares: { n: 0, price: 100, cost: 0, hist: [100], news: '', day: 0, divs: 0 },
  lotto: { tickets: [], stubs: 0, wins: 0, won: 0, lastDraw: 0, result: '' },
  auction: { last: 0, wins: 0, spent: 0, value: 0, sessions: 0 },
  news: { issues: [], events: [], last: 0 },
  sugg: { list: [], last: 0 },
  census: { happy: 60 },
  shift: {}, seen: {},
});
register('stateSlice', 'sv5t', { default: DEF });
const fill = (d, c) => { for (const [k, v] of Object.entries(d)) { if (c[k] === undefined) c[k] = v; else if (v && typeof v === 'object' && !Array.isArray(v)) fill(v, c[k]); } return c; };
export const S = (g) => fill(DEF(), (g.state.sv5t ||= {}));
export const pick = (r, a) => a[Math.floor(r() * a.length)];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const has = (id) => !!get('item', id);
export const idle = (g) => !!(g.world && g.scenes.top === g.world && !g.world.busy);
export const mailSafe = (g, m) => { try { queueMail(g, m); } catch (e) { g.mail(m.id, m.from, m.text); } };
export const nameOf = (id) => (get('npc', id) || { name: id }).name;
export const N = (text) => ({ t: 'say', who: null, mood: null, text });
export const say = (who, mood, text) => ({ t: 'say', who, mood, text });
export const call = (fn) => ({ t: 'call', fn });
export const once = (g, key) => { const f = g.state.flags; if (f[key] === g.day) return false; f[key] = g.day; return true; };
export const money = (n) => `${n}c`;
export const tpStat = (g, k, n = 1) => g.stat(k, n);

// Wrap a registered map's `objects` getter (and optionally remove base props). Returns false if the map does not exist yet.
const PATCH = {};
export function mapPatch(id, { objects, remove, edit, spots } = {}) {
  const m = get('map', id); if (!m) return false;
  let rec = PATCH[id];
  if (!rec) {
    rec = PATCH[id] = { objs: [], remove: [], edit: [] };
    const od = Object.getOwnPropertyDescriptor(m, 'objects'), base = od && od.get ? od.get : () => (od ? od.value : []);
    Object.defineProperty(m, 'objects', { get: () => { let l = base(); for (const f of rec.edit) l = l.map(f); if (rec.remove.length) l = l.filter((o) => !rec.remove.some((f) => f(o))); return [...l, ...rec.objs.flatMap((f) => (typeof f === 'function' ? f() : f))]; }, enumerable: true, configurable: true });
  }
  if (objects) rec.objs.push(objects);
  if (remove) rec.remove.push(remove);
  if (edit) rec.edit.push(edit);
  if (spots) Object.assign(m.spots ||= {}, spots);
  return true;
}
// Props with a footprint and an optional interaction; `at` helper for non-solid interaction tiles.
export const prop = (spr, x, y, o = {}) => ({ spr, x, y, w: 1, h: 1, shadow: 8, ...o });
export const tile = (x, y, o) => ({ x, y, w: 1, h: 1, solid: false, ...o });
export const tpFlag = (g, k) => !!g.state.flags[k];
