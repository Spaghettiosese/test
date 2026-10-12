// Hobbies area: shared state, helpers, buffs and cross-area references.
//
// Save data lives at game.state.hobbies (stateSlice 'hobbies').
// Services added to `game` (by the 'hobbies' system): learnRecipe(id), knowsRecipe(id), openCooking(), openCrafting(),
//   addBuff(id, minutes), hasBuff(id), hobbyLuck().
// Bus events emitted (past tense, for achievements/quests): fishCaught { item, size, record }, bugCaught { item, kept },
//   cooked { recipe, item, stars }, harvested { crop, item, n }, crafted { recipe, item }, donated { kind, item, n },
//   shellFound { item }, mineralFound { item }, starLogged { id }, recipeLearned { id }, planted { crop }.
// Stats (game.stat): fishCaught, bugsCaught, bugsReleased, cooked, harvested, planted, watered, crafted, donated,
//   shellsFound, mineralsFound, constellations, recipesLearned, biggestFish (via flags), museumRewards.
import { register, get, features } from '../../core/registry.js';
import { itemIcon } from '../../gfx/icons.js';
import { TILE } from '../../world/map.js';
import { measure, drawText } from '../../font.js';
import { sprite } from '../../artcache.js';
import { SPRITES, defineSprite } from '../../art.js';

// ---------------------------------------------------------------- save slice
register('stateSlice', 'hobbies', {
  default: () => ({
    recipes: {},        // id -> day learned
    cooked: {},         // recipe id -> times cooked
    plots: {},          // mapId -> { 'x,y': { till, crop, age, wat, dry, wilt, dead } }
    can: 0,             // water left in the watering can
    seed: null,         // seed chosen for planting
    fish: {},           // fish id -> { n, best }
    bugs: {},           // bug id -> { n, released }
    gone: {},           // 'map:epoch' -> [critter keys caught or scared away]
    finds: { day: 0, list: [] },   // today's beach finds and dig spots [{ map, x, y, item, kind }]
    rocks: {},          // 'map:x,y' -> day tapped
    donated: { fish: {}, bug: {}, shell: {}, mineral: {} },
    rewards: {},        // 'fish:25' -> day
    stars: {},          // constellation id -> day logged
    crafted: {},        // craft recipe id -> times
    buffs: {},          // buff id -> absolute minute it ends
    lastDad: 0,         // week number of the last recipe from Dad
    taught: {},         // npc id -> recipe taught
  }),
});
export const HS = (game) => game.state.hobbies;

// ---------------------------------------------------------------- cross-area references
// Ingredients, tools and materials belong to other areas (economy). If one is missing when this module loads
// (areas earlier in src/content/index.js are already registered), a plain stand-in item is registered so recipes
// stay valid; MISSING lists them for the integration report.
export const MISSING = [];
const nice = (id) => { const s = id.replace(/^[a-z]+_/, '').replace(/_/g, ' '); return s[0].toUpperCase() + s.slice(1); };
export function needItem(id, def = {}) {
  if (get('item', id)) return id;
  register('item', id, { name: nice(id), desc: def.desc || 'Useful for hobbies.', cat: def.cat || 'misc', price: def.price ?? 10, icon: def.icon || itemIcon('box'), tags: def.tags || [], ...def, stub: true });
  MISSING.push(id);
  return id;
}
// Fish/bug defs list maps by name; maps that don't exist (yet) are skipped at validation and spawn time.
export const liveMaps = (list) => (list || []).filter((m) => !!get('map', m));

// ---------------------------------------------------------------- tiny helpers
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const absMin = (game) => game.day * 1440 + game.minutes;
export const hour = (game) => (game.minutes / 60) % 24;
export function weighted(rng, list, w) {
  const tot = list.reduce((a, x) => a + w(x), 0);
  if (!tot) return null;
  let r = rng() * tot;
  for (const x of list) if ((r -= w(x)) < 0) return x;
  return list[list.length - 1];
}
// Time windows used by fish and bugs.
export const TIMES = { any: [[0, 24]], day: [[6, 18]], morning: [[5, 11]], evening: [[16, 21]], night: [[18, 24], [0, 5]], dusk: [[17, 20]] };
export function inTimes(times, h) { return (Array.isArray(times) ? times : TIMES[times || 'any'] || TIMES.any).some(([a, b]) => h >= a && h < b); }
export function weatherOk(w, weather) {
  if (!w || w === 'any') return true;
  if (w === 'rain') return weather === 'rain' || weather === 'storm';
  if (w === 'clear') return weather === 'sunny' || weather === 'cloudy' || weather === 'windy';
  return String(w).split('|').includes(weather);
}

// Word wrap by pixel width (works with the 3x5 font today and the proportional font later).
export function wrapPx(text, maxW) {
  const out = []; let line = '';
  for (const w of String(text).split(' ')) {
    const t = line ? line + ' ' + w : w;
    if (measure(t) > maxW && line) { out.push(line); line = w; } else line = t;
  }
  if (line) out.push(line);
  return out;
}
export const fit = (text, maxW) => { let s = String(text); if (measure(s) <= maxW) return s; while (s.length > 1 && measure(s + '.') > maxW) s = s.slice(0, -1); return s + '.'; };

// Draw an item icon centred at (cx, cy); unknown entries show as a dark silhouette.
const silCache = new Map();
export function drawIcon(g, name, cx, cy, sil = false) {
  if (!name || !SPRITES[name]) return;
  let img = sprite(name);
  if (sil) {
    let c = silCache.get(name);
    if (!c) {
      c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#4a3348'; x.fillRect(0, 0, c.width, c.height);
      silCache.set(name, c);
    }
    img = c;
  }
  g.drawImage(img, Math.round(cx - img.width / 2), Math.round(cy - img.height / 2));
}

// ---------------------------------------------------------------- world helpers
export const tileOf = (world, tx, ty) => { const m = world.map; return tx < 0 || ty < 0 || tx >= m.w || ty >= m.h ? null : m.tiles[ty][tx]; };
export const isWater = (t) => !!t && (t.ground === 'water' || t.ground === 'ocean');
export const DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
// The tile Misa is facing (one step ahead of her feet).
export function facingTile(world, reach = 12) {
  const p = world.player, [dx, dy] = DIRV[p.dir] || [0, 1];
  return [Math.floor((p.x + dx * reach) / TILE), Math.floor((p.y - 4 + dy * reach) / TILE)];
}
export const tileCentre = (tx, ty) => [tx * TILE + 8, ty * TILE + 8];
export const distTo = (world, x, y) => Math.hypot(world.player.x - x, world.player.y - 6 - y);
export const sparkle = (world, x, y, n = 6, c = '#fff6a0') => { for (let i = 0; i < n; i++) world.particles.push({ c, x: x + (Math.random() - 0.5) * 10, y: y - Math.random() * 8, vx: (Math.random() - 0.5) * 30, vy: -20 - Math.random() * 30, life: 0.5 + Math.random() * 0.4, s: 2 }); };

// Is the player's game standing in the overworld (no menu/cutscene on top)?
export const inWorld = (game) => !!game.world && game.scenes.top === game.world;

// Tool checks: tools are economy items; if a tool isn't registered at all, the hobby still works.
export const hasTool = (game, ...ids) => ids.some((id) => !get('item', id) || game.has(id));

// ---------------------------------------------------------------- buffs (timed food effects)
export const BUFFS = {
  focus: { name: 'Focused', desc: '+10% Study XP', icon: 'i_book', xp: { study: 1.1 } },
  chef: { name: 'Chef mode', desc: '+20% Cooking XP', icon: 'hob_buff_chef', xp: { cooking: 1.2 } },
  green: { name: 'Green thumb', desc: '+25% Gardening XP', icon: 'i_leaf', xp: { gardening: 1.25 } },
  crafty: { name: 'Handy', desc: '+20% Crafting XP', icon: 'hob_buff_craft', xp: { crafting: 1.2 } },
  calm: { name: 'Calm hands', desc: 'Wider fishing catch bar', icon: 'i_fishicon' },
  lucky: { name: 'Lucky', desc: 'Rare fish and bugs show up more', icon: 'i_star' },
  swift: { name: 'Light feet', desc: 'Walk a little faster', icon: 'i_energy' },
  cozy: { name: 'Toasty', desc: 'Mood slowly rises', icon: 'heart' },
};
defineSprite('hob_buff_chef', 10, 10, (R) => { R(1, 3, 8, 6, '#fffaf0'); R.e(3, 3, 2, 2, '#fffaf0'); R.e(7, 3, 2, 2, '#fffaf0'); R.e(5, 2, 2, 2, '#fffaf0'); R(1, 7, 8, 2, '#c9b8a2'); }, { hd: true, outline: 'selective' });
defineSprite('hob_buff_craft', 10, 10, (R) => { R(4, 4, 2, 6, '#a67548'); R(1, 1, 8, 3, '#8a9aab'); R(1, 1, 8, 1, '#b9c6d2'); }, { hd: true, outline: 'selective' });

export function buffLeft(game, id) { const end = HS(game).buffs[id]; return end ? Math.max(0, end - absMin(game)) : 0; }
export function luck(game) { return 1 + (buffLeft(game, 'lucky') ? 0.6 : 0); }

// Feature lines for the shared bits live with the code above.
features('Wellbeing', [
  'Food buffs: some dishes give a timed buff (Focused, Chef mode, Green thumb, Handy, Calm hands, Lucky, Light feet, Toasty)',
  'Active food buffs show as icons with their minutes left under the coin panel',
]);

export function hobbySystem(game) {
  game.addBuff = (id, minutes) => {
    const b = BUFFS[id];
    if (!b) return;
    const st = HS(game).buffs;
    st[id] = Math.max(st[id] || 0, absMin(game)) + minutes;
    if (id === 'swift') game.setFlag('speedBoost', true);
    game.toast(`${b.name}: ${b.desc}`, b.icon);
  };
  game.hasBuff = (id) => buffLeft(game, id) > 0;
  game.hobbyLuck = () => luck(game);
  // XP multipliers from buffs (wraps the core service once).
  const addXP = game.addXP.bind(game);
  game.addXP = (id, n) => {
    let k = 1;
    for (const [bid, end] of Object.entries(HS(game).buffs)) if (end > absMin(game) && BUFFS[bid] && BUFFS[bid].xp && BUFFS[bid].xp[id]) k *= BUFFS[bid].xp[id];
    return addXP(id, Math.max(1, Math.round(n * k)));
  };
  const expire = () => {
    const st = HS(game).buffs, now = absMin(game);
    for (const [id, end] of Object.entries(st)) if (end <= now) { delete st[id]; if (id === 'swift') game.setFlag('speedBoost', false); }
    if (st.cozy) game.addMood(2);
  };
  game.bus.on('hour', expire);
  game.bus.on('dayStart', expire);
}

register('hud', 'hobby_buffs', {
  draw(g, game) {
    if (!game.world || game.hideHud || !game.state.hobbies) return;
    const st = HS(game).buffs, now = absMin(game);
    let x = 318 - 46, y = 27;
    for (const [id, end] of Object.entries(st)) {
      const b = BUFFS[id]; if (!b || end <= now) continue;
      g.fillStyle = '#2b1d2ed0'; g.fillRect(x, y, 44, 12);
      if (SPRITES[b.icon]) { const s = SPRITES[b.icon]; g.drawImage(sprite(b.icon), x + 7 - Math.round(s.w / 2), y + 6 - Math.round(s.h / 2)); }
      const left = end - now, txt = left >= 60 ? `${Math.floor(left / 60)}H${String(left % 60).padStart(2, '0')}` : `${left}M`;
      drawSmall(g, txt, x + 15, y + 4);
      y += 13;
    }
  },
});
const drawSmall = (g, t, x, y) => drawText(g, t, x, y, '#fff6c0', 1, null);
