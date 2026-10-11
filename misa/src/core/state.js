// The whole save file. Everything the player can change lives here (and nothing else is saved).
// Systems add their own save data with register('stateSlice', id, { default: () => ({...}) }); it lives at state[id].
import { all } from './registry.js';
export const SAVE_VERSION = 1;

export function newState(seed = (Date.now() ^ 0x5bd1e995) >>> 0) {
  return {
    v: SAVE_VERSION, seed, created: Date.now(), playMs: 0,
    name: 'Misa',
    time: { day: 1, minutes: 7 * 60 },
    weather: 'sunny', tomorrowWeather: 'sunny',
    map: 'home', pos: { x: 72, y: 168, dir: 'down' },
    money: 300, energy: 100, maxEnergy: 100, mood: 60,
    inv: {}, bagSize: 24,
    outfit: 'hoodie', outfits: ['hoodie'],
    flags: {}, quests: {}, friends: {}, skills: {}, grades: {}, attendance: { present: 0, absent: 0, late: 0 },
    collections: {}, achievements: {}, mail: [], seen: {},
    garden: { plots: [] },
    decor: { owned: [], placed: [] },
    mochi: { affection: 20, fedDay: 0, pettedDay: 0, gifts: 0 },
    homeTasks: { day: 0, list: [] },
    stats: {},
    story: { chapter: 0 },
    storage: {},
    log: [],
    ...Object.fromEntries(all('stateSlice').map((sl) => [sl.id, sl.default()])),
  };
}

// Small helpers so content code reads naturally.
export const flag = (s, k) => s.flags[k];
export const setFlag = (s, k, v = true) => { s.flags[k] = v; };
export const inc = (s, k, n = 1) => { s.flags[k] = (s.flags[k] || 0) + n; return s.flags[k]; };
export const stat = (s, k, n = 1) => { s.stats[k] = (s.stats[k] || 0) + n; return s.stats[k]; };

// Upgrade older saves in place. Add a case per version bump.
const MIGRATIONS = {}; // { 1: (s) => {...} } upgrades a v1 save to v2, etc.
const plain = (o) => o && typeof o === 'object' && !Array.isArray(o);
// Fill missing keys at every depth of plain objects (arrays and maps keyed by ids are left alone).
function fillDefaults(dst, src, depth = 0) {
  for (const [k, v] of Object.entries(src)) {
    if (dst[k] === undefined) dst[k] = v;
    else if (plain(v) && plain(dst[k]) && depth < 2 && Object.keys(v).length) fillDefaults(dst[k], v, depth + 1);
  }
}
export function migrate(s) {
  if (!plain(s)) throw new Error('not a save file');
  if ((s.v || 1) > SAVE_VERSION) throw new Error('this save is from a newer version of the game');
  for (let v = s.v || 1; v < SAVE_VERSION; v++) if (MIGRATIONS[v]) MIGRATIONS[v](s);
  fillDefaults(s, newState(s.seed));
  s.v = SAVE_VERSION;
  return s;
}
