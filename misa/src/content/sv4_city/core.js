// Kitaminato (sv4_city): shared state, helpers, the 40-stamp book and the map registration wrapper.
// Save data: state.kita = { stamps:{id:day}, pass:{day}, ride:{...}, q:{step,...}, photo:{on,found:{}}, films:{id:day}, quizBest, exhibits:{}, ...}
// Stats: kcRides, kcStamps, kcFilms, kcPhotos, kcShifts.  Flags: kc_visited, kc_pass (Train Pass owned), kc_quest_done.
// Bus events emitted: kcRide { dir, minutes }, kcStamp { id }, kcFerris {}, kcFilm { id }.
import { register, get, all } from '../../core/registry.js';
import { townMap } from '../town/lib.js';
import { TOWN_MAPS } from '../town/ambience.js';
import { RAMPS } from '../../gfx/palette.js';
import { drawText, measure } from '../../font.js';

export const CITY_MAPS = [];
export const DEFAULT = () => ({ stamps: {}, pass: { day: 0 }, ride: { dir: 'city', start: 0 }, q: { step: 0, day: 0, done: false }, photo: { on: false, found: {}, done: false },
  films: {}, quizBest: 0, exhibits: {}, openDay: {}, cats: 0, rides: 0, shifts: 0, hotel: 0, lastTrainHome: 0, lantern: 0, spree: 0 });
register('stateSlice', 'kita', { default: DEFAULT });
export const S = (g) => { const s = (g.state.kita ||= DEFAULT()); for (const [k, v] of Object.entries(DEFAULT())) if (s[k] === undefined) s[k] = v; return s; };

export const say = (who, mood, text) => ({ t: 'say', who, mood, text });
export const N = (text) => ({ t: 'say', who: null, mood: null, text });
export const call = (fn) => ({ t: 'call', fn });
export const has = (id) => !!get('item', id);
export const pick = (r, a) => a[Math.floor(r() * a.length) % a.length];
export const nameOf = (id) => (get('npc', id) || { name: id }).name;
export const here = (g) => (g.world && g.world.map ? g.world.map.id : g.state.map);
export const inCity = (g) => CITY_MAPS.includes(here(g)) || here(g) === 'station';
export function giveOr(g, id, coins = 60) { if (id && has(id)) { g.give(id, 1); return get('item', id).name; } g.addMoney(coins); return `${coins} coins`; }
export const warpStep = (map, spawn) => { const d = get('map', map), p = d && d.spawns && (d.spawns[spawn] || d.spawns.default); return { t: 'warp', map, x: p[0], y: p[1], dir: p[2] || 'down' }; };

// ---------------------------------------------------------------- the stamp book (40 stamps)
const MAPSTAMPS = [['station', 'Hoshimori Station'], ['kita_station_plaza', 'Kitaminato Station Plaza'], ['kita_arcade', 'Hikari Arcade'], ['kita_harbourwalk', 'Harbour Walk'], ['kita_oldtown', 'Old Town'], ['kita_uni', 'University Campus'],
  ['kita_department', 'Department Store 1F'], ['kita_department_2f', 'Department Store 2F'], ['kita_department_roof', 'Rooftop Garden'], ['kita_aquarium', 'Aquarium'], ['kita_cinema', 'Cinema'], ['kita_museum', 'Museum'],
  ['kita_ramen_street', 'Ramen Street'], ['kita_bookstore', 'Bookstore'], ['kita_game_centre', 'Game Centre'], ['kita_capsule_hotel', 'Capsule Hotel']];
const ACTSTAMPS = [['ride', 'First train ride'], ['daypass', 'City Day Pass'], ['subway', 'Subway ride'], ['ferris', 'Ferris wheel'], ['show', 'Feeding show'], ['film', 'Saw a film'], ['quiz', 'Perfect film quiz'], ['exhibit', 'Museum exhibit'],
  ['openday', 'Open campus'], ['claw', 'Claw machine prize'], ['spree', 'Shopping spree'], ['flash', 'Flash mob'], ['photo', 'Photo hunt'], ['cats', 'Alley cat colony'], ['temple', 'Temple visit'], ['tea', 'Tea house'],
  ['ramen', 'Bowl of ramen'], ['shift', 'Bookshop shift'], ['boutique', 'Boutique outfit'], ['shopping', 'City shopping'], ['quest', 'City quest chain'], ['lantern', 'Lantern Night'], ['fireworks', 'Summer fireworks'], ['busker', 'Street musician']];
export const STAMPS = [...MAPSTAMPS.map(([m, n]) => ({ id: 'map_' + m, name: n, map: m })), ...ACTSTAMPS.map(([id, n]) => ({ id, name: n }))];
export function stamp(g, id) {
  const s = S(g);
  if (s.stamps[id] || !STAMPS.some((x) => x.id === id)) return false;
  s.stamps[id] = g.day; g.stat('kcStamps'); g.collect && g.collect('kita_stamp', id);
  const n = Object.keys(s.stamps).length, nm = STAMPS.find((x) => x.id === id).name;
  g.toast(`Kitaminato stamp: ${nm} (${n}/${STAMPS.length})`, 'i_star'); g.bus.emit('kcStamp', { id });
  if (n === 10 && has('city_stamp_charm')) g.give('city_stamp_charm', 1);
  if (n === STAMPS.length && !g.flag('kc_all_stamps')) { g.setFlag('kc_all_stamps'); if (g.giveStickers) g.giveStickers(5, 'all Kitaminato stamps'); if (has('gift_city_golden_ticket')) g.give('gift_city_golden_ticket', 1); }
  return true;
}
export const stampCount = (g) => Object.keys(S(g).stamps).length;

// ---------------------------------------------------------------- maps
// cmap(id, def): a town-style map that lists itself as part of the city and draws the city banner.
export function cmap(id, def) {
  const m = townMap(id, { noBanner: true, music: 'town', ...def });
  CITY_MAPS.push(id);
  if (!def.indoor) TOWN_MAPS.add(id);
  return m;
}
// Add warps/objects/spawns to a registered map def from outside its file (getter wrapping, as sv_farm and sv_community do).
export function wrapMap(id, { warps = [], objects = [], spawns = {}, spots = {} }) {
  const d = get('map', id);
  if (!d) return false;
  const wrap = (key, extra) => { if (!extra.length) return; const pd = Object.getOwnPropertyDescriptor(d, key); const base = pd && pd.get ? pd.get : () => d[key] || []; Object.defineProperty(d, key, { enumerable: true, configurable: true, get: () => [...base.call(d), ...extra] }); };
  wrap('warps', warps); wrap('objects', objects);
  Object.assign(d.spawns, spawns); d.spots && Object.assign(d.spots, spots);
  return true;
}

// ---------------------------------------------------------------- city banner + visit stamps
const banner = { name: '', sub: '', t: -9 };
register('hud', 'kc_banner', {
  draw(g, game) {
    const dt = game.clock - banner.t;
    if (!banner.name || dt > 3.2 || dt < 0) return;
    const ease = dt < 0.35 ? dt / 0.35 : dt > 2.8 ? Math.max(0, (3.2 - dt) / 0.4) : 1;
    const w = Math.max(measure(banner.name), measure(banner.sub)) + 28, x = Math.round(160 - w / 2), y = Math.round(-30 + ease * 64);
    g.fillStyle = RAMPS.ink[1]; g.fillRect(x, y, w, 26); g.fillStyle = '#1f2a44'; g.fillRect(x + 1, y + 1, w - 2, 24);
    g.fillStyle = RAMPS.sky[3]; g.fillRect(x + 1, y + 1, w - 2, 1); g.fillStyle = RAMPS.coral[2]; g.fillRect(x + 8, y + 15, w - 16, 1);
    drawText(g, banner.name, Math.round(160 - measure(banner.name) / 2), y + 5, RAMPS.butter[3]);
    drawText(g, banner.sub, Math.round(160 - measure(banner.sub) / 2), y + 18, RAMPS.sky[4]);
  },
});
register('system', 'kc_core', {
  init(game) {
    game.bus.on('mapEnter', ({ map }) => {
      const def = get('map', map);
      if (!def || !CITY_MAPS.includes(map)) return;
      S(game); game.setFlag('kc_visited');
      Object.assign(banner, { name: def.name, sub: map.startsWith('kita_') ? 'Kitaminato' : 'Hoshimori Bay', t: game.clock });
      stamp(game, 'map_' + map);
    });
    game.kcStampCount = () => stampCount(game);
  },
});
export { all };
