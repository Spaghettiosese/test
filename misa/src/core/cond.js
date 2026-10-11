// Conditions as data, so the content validator can check every reference.
//   Cond = string | string[] (AND) | { any: Cond[] } | { not: Cond } | (game) => boolean
// Atoms: [!]kind[:arg][op value]
//   flag:x  var:x>=3  stat:fishCaught>=10  skill:cooking>=3  item:tea>=2 (bare item:tea = has one)  money>=100
//   friend:nori>=4 (hearts)  quest:id=active|done|none  quest:id>=2 (stage)  time>=17:00  time<09:00
//   day:sat|sun  weekday | weekend  date:spring-12  season:winter|spring  weather:rain|storm  map:cafe
//   chapter>=2  hearts... (alias of friend)  energy>=10  year>=2  met:hana  school (a school day)
import { parseHM, seasonOf, dateOf, weekdayOf, isWeekend, WEEKDAYS } from './time.js';

const ATOM = /^(!?)([a-z]+)(?::([\w.\-|]+))?(?:(>=|<=|!=|=|>|<)([\w.:\-|]+))?$/;
const OPS = { '>=': (a, b) => a >= b, '<=': (a, b) => a <= b, '>': (a, b) => a > b, '<': (a, b) => a < b, '=': (a, b) => a == b, '!=': (a, b) => a != b }; // eslint-disable-line eqeqeq
const DAYS = WEEKDAYS.map((d) => d.toLowerCase());

const READERS = {
  flag: (g, a) => g.state.flags[a],
  var: (g, a) => g.state.flags[a] || 0,
  stat: (g, a) => g.state.stats[a] || 0,
  skill: (g, a) => g.skillLevel(a),
  item: (g, a) => g.count(a),
  money: (g) => g.state.money,
  energy: (g) => g.state.energy,
  friend: (g, a) => g.hearts(a),
  hearts: (g, a) => g.hearts(a),
  met: (g, a) => !!g.state.seen['met:' + a],
  quest: (g, a) => { const q = g.state.quests[a]; return q ? (q.done ? 'done' : 'active') : 'none'; },
  stage: (g, a) => { const q = g.state.quests[a]; return q ? (q.done ? 999 : q.stage) : -1; },
  time: (g) => g.state.time.minutes,
  day: (g) => DAYS[weekdayOf(g.state.time.day)],
  weekday: (g) => !isWeekend(g.state.time.day) && !g.state.flags.holiday,
  weekend: (g) => isWeekend(g.state.time.day) || !!g.state.flags.holiday,
  school: (g) => !isWeekend(g.state.time.day) && !g.state.flags.holiday && !g.state.flags.noSchool && seasonOf(g.state.time.day) !== 'summer',
  date: (g) => `${seasonOf(g.state.time.day)}-${dateOf(g.state.time.day)}`,
  season: (g) => seasonOf(g.state.time.day),
  weather: (g) => g.state.weather,
  map: (g) => (g.world && g.world.map ? g.world.map.id : g.state.map),
  chapter: (g) => g.state.story.chapter,
  year: (g) => Math.floor((g.state.time.day - 1) / 112) + 1,
  dayn: (g) => g.state.time.day,
};
export const COND_KINDS = Object.keys(READERS);
// Systems can add condition kinds: addCondKind('tide', (game, arg) => game.state.tide)
export function addCondKind(kind, reader) { if (READERS[kind]) throw new Error(`condition kind ${kind} exists`); READERS[kind] = reader; COND_KINDS.push(kind); }

function compileAtom(src) {
  const m = src.trim().match(ATOM);
  if (!m) throw new Error(`bad condition "${src}"`);
  const [, neg, kind, arg, op, val] = m;
  const rd = READERS[kind];
  if (!rd) throw new Error(`unknown condition kind "${kind}" in "${src}"`);
  let test;
  if (kind === 'quest' && op && /^\d+$/.test(val)) test = (g) => OPS[op](READERS.stage(g, arg), +val);
  else if (op) {
    const vals = val.split('|').map((v) => (kind === 'time' ? parseHM(v) : /^-?\d+(\.\d+)?$/.test(v) ? +v : v));
    test = op === '=' ? (g) => vals.includes(rd(g, arg)) : op === '!=' ? (g) => !vals.includes(rd(g, arg)) : (g) => OPS[op](rd(g, arg), vals[0]);
  } else if (arg && ['day', 'season', 'weather', 'map', 'date'].includes(kind)) {
    const vals = arg.split('|');
    test = (g) => vals.includes(rd(g));
  } else if (kind === 'item') test = (g) => rd(g, arg) >= 1;
  else test = (g) => !!rd(g, arg);
  return neg ? (g) => !test(g) : test;
}

export function compileCond(c) {
  if (c === undefined || c === null || c === true) return () => true;
  if (c === false) return () => false;
  if (typeof c === 'function') return c;
  if (typeof c === 'string') return c.includes('&') ? compileCond(c.split('&')) : compileAtom(c);
  if (Array.isArray(c)) { const fs = c.map(compileCond); return (g) => fs.every((f) => f(g)); }
  if (c.any) { const fs = c.any.map(compileCond); return (g) => fs.some((f) => f(g)); }
  if (c.not) { const f = compileCond(c.not); return (g) => !f(g); }
  throw new Error(`bad condition ${JSON.stringify(c)}`);
}
const cache = new WeakMap(), scache = new Map();
// Evaluate a condition (compiled lazily and cached).
export function check(c, game) {
  if (c === undefined || c === null) return true;
  if (typeof c === 'function') return !!c(game);
  let f;
  if (typeof c === 'string') { f = scache.get(c); if (!f) scache.set(c, (f = compileCond(c))); }
  else { f = cache.get(c); if (!f) cache.set(c, (f = compileCond(c))); }
  return !!f(game);
}
// All [kind, id] references in a condition (for the validator).
export function condRefs(c, out = []) {
  if (!c || typeof c === 'function' || c === true) return out;
  if (typeof c === 'string') { for (const part of c.split('&')) { const m = part.trim().match(ATOM); if (m && m[3]) out.push([m[2], m[3]]); } return out; }
  if (Array.isArray(c)) { c.forEach((x) => condRefs(x, out)); return out; }
  if (c.any) c.any.forEach((x) => condRefs(x, out));
  if (c.not) condRefs(c.not, out);
  return out;
}
