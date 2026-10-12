// Home decorating: furniture placed on a grid in `home` and `attic`, stored in an unlimited decor box, wallpaper and
// floor swaps per room, a home comfort score (small daily energy bonus), Aunt Nori's seasonal home magazine and
// house upgrades (game.homeUpgrades, listed by the economy area's Kinoko Woodworks shop).
// Save data: game.state.homeDecor (stateSlice). Placed pieces: { uid, id, map, x, y, rot } in tiles.
import { register, registerMany, get, features } from '../../core/registry.js';
import { TILE, passGrid, footprint, activeObjects } from '../../world/map.js';
import { SPRITES } from '../../art.js';
import { sprite } from '../../artcache.js';
import { drawText } from '../../font.js';
import { itemIcon } from '../../gfx/icons.js';
import { RAMPS as C } from '../../gfx/palette.js';
import { CATALOG, STARTER_PAPERS, STARTER_FLOORS, THEMES } from './catalog.js';
import { PAPERS, FLOORS, setStyleResolver, roomAt, faceAt } from './rooms.js';
import { drawClock } from './maps.js';

export const DECOR_MAPS = ['home', 'attic'];
let GAME = null;
const st = (game = GAME) => game.state.homeDecor;
const P = (uid, id, map, x, y, rot = 0) => ({ uid, id, map, x, y, rot });

register('stateSlice', 'homeDecor', {
  default: () => ({
    placed: [P(1, 'furn_poster_sea', 'home', 1, 8), P(2, 'furn_bunting', 'home', 13, 8), P(3, 'furn_lamp_floor', 'home', 22, 13), P(4, 'furn_plushie_cat', 'home', 6, 13),
      P(5, 'furn_cactus', 'home', 7, 6), P(6, 'furn_fern', 'home', 16, 9), P(7, 'furn_zabuton', 'home', 14, 4), P(8, 'furn_lamp_floor', 'attic', 2, 6), P(9, 'furn_rug_round', 'attic', 5, 4)],
    box: { furn_chair_wood: 1, furn_photo_frame: 1, furn_candles: 1, furn_cat_box: 1 },
    styles: {}, papers: STARTER_PAPERS.slice(), floors: STARTER_FLOORS.slice(), off: {}, uid: 50, bathDay: 0, bonusDay: 0, magDay: 0, actDay: {},
  }),
});

// ---------- geometry ----------
const def = (it) => CATALOG[it.id];
const sprOf = (it) => { const f = def(it); return f.vars ? f.vars[it.rot % f.vars.length] : f.spr; };
const flipOf = (it) => { const f = def(it); return !f.vars && it.rot % 2 === 1; };
const solidOf = (f) => f.kind === 'floor' && f.solid !== false;
const tilesOf = (it) => { const f = def(it), out = []; for (let j = 0; j < (f.kind === 'wall' ? 1 : f.h); j++) for (let i = 0; i < f.w; i++) out.push([it.x + i, it.y + j]); return out; };
const placedIn = (mapId) => st().placed.filter((p) => p.map === mapId && CATALOG[p.id]);
function spriteBox(world, it) { // screen-map px rect where the sprite is drawn
  const f = def(it), name = sprOf(it), d = SPRITES[name]; if (!d) return null;
  const pad = d.pad || 0, sw = d.w - pad * 2, sh = d.h - pad * 2;
  const x = it.x * 32 + Math.floor((f.w * 32 - sw) / 2);
  const bottom = f.kind === 'wall' ? (it.y + 1) * 32 - 14 : (it.y + f.h) * 32 - (f.kind === 'rug' ? Math.max(0, Math.floor((f.h * 32 - sh) / 2)) : 0);
  return { x, y: bottom - sh, w: sw, h: sh, pad, name };
}
function drawPiece(g, world, it, alpha = 1) {
  const b = spriteBox(world, it); if (!b) return;
  const img = world.img(b.name, flipOf(it)); if (!img) return;
  const cx = Math.round(world.cam.x), cy = Math.round(world.cam.y);
  if (alpha < 1) g.globalAlpha = alpha;
  g.drawImage(img, b.x - b.pad - cx, b.y - b.pad - cy);
  if (def(it).clock) drawClock(g, b.x + 11, b.y + 11, 7, world.game.minutes, cx, cy);
  if (alpha < 1) g.globalAlpha = 1;
}
const isOn = (it) => !st().off[it.uid];

// ---------- world layer: draw placed furniture, collide with it ----------
register('worldLayer', 'interiors_decor', {
  sprites(world, game) {
    if (!DECOR_MAPS.includes(world.map.id) || !game.state.homeDecor) return [];
    const scene = game.scenes.find('decorate'), hidden = scene && scene.held && scene.held.from ? scene.held.from.uid : null;
    return placedIn(world.map.id).filter((it) => it.uid !== hidden).map((it, i) => {
      const f = def(it);
      const y = f.kind === 'wall' ? -3e9 + i : f.kind === 'rug' ? -2e9 + i : (it.y + f.h) * TILE - 0.5;
      return { y, draw: (g) => { if (solidOf(f)) world.shadow((it.x + f.w / 2) * TILE, (it.y + f.h) * TILE, Math.min(26, f.w * 12)); drawPiece(g, world, it); } };
    });
  },
  solids(world, game) {
    if (!DECOR_MAPS.includes(world.map.id) || !game.state.homeDecor) return [];
    return placedIn(world.map.id).filter((it) => solidOf(def(it))).map((it) => [it.x * TILE, it.y * TILE, def(it).w * TILE, def(it).h * TILE]);
  },
});
// lamps placed by the player light the room at night
export function decorLights(mapId) {
  if (!GAME || !GAME.state.homeDecor) return [];
  return placedIn(mapId).filter((it) => def(it).light && isOn(it)).map((it) => {
    const f = def(it), d = SPRITES[sprOf(it)], h = d ? d.h - (d.pad || 0) * 2 : 32;
    const cx = (it.x + f.w / 2) * TILE, top = f.kind === 'wall' ? (it.y + 1) * TILE - 7 - h / 2 : (it.y + f.h) * TILE - h / 2 + 4;
    return { x: cx / TILE - 0.5, y: (top - h / 4) / TILE - 0.5, kind: f.id === 'furn_candles' ? 'candle' : 'lamp' };
  });
}
for (const id of DECOR_MAPS) { const m = get('map', id); const base = m.lights || []; Object.defineProperty(m, 'lights', { configurable: true, get: () => base.concat(decorLights(id)) }); }

// ---------- room styles (wallpaper + floor) ----------
setStyleResolver((mapId, roomId) => (GAME && GAME.state.homeDecor && (GAME.state.homeDecor.styles[mapId] || {})[roomId]) || null);
export function applyStyles(world) {
  const m = world.map, d = m.def, styles = (st().styles || {})[m.id] || {};
  let changed = false;
  for (const room of d.rooms || []) {
    const fk = (styles[room.id] || {}).floor || room.floor, tile = FLOORS[fk] && get('tile', FLOORS[fk].tile);
    if (!tile || !room.char) continue;
    for (let y = room.y; y < room.y + room.h; y++) for (let x = room.x; x < room.x + room.w; x++) if (d.rows[y][x] === room.char && m.tiles[y][x] !== tile) { m.tiles[y][x] = tile; changed = true; }
  }
  if (changed) world.static = null;
}

// ---------- comfort score ----------
export function homeComfort(game) {
  const s = game.state.homeDecor, list = s.placed.filter((p) => DECOR_MAPS.includes(p.map) && CATALOG[p.id]), parts = [];
  let base = 0;
  for (const p of list) { const f = CATALOG[p.id]; base += f.comfort * (f.season && f.season === game.season ? 2 : 1); }
  parts.push(['Furniture', Math.min(40, base)]);
  parts.push(['Variety', Math.min(15, new Set(list.map((p) => p.id)).size)]);
  parts.push(['Lights', Math.min(8, 2 * list.filter((p) => CATALOG[p.id].light).length)]);
  parts.push(['Plants', Math.min(8, 2 * list.filter((p) => CATALOG[p.id].plant).length)]);
  const sets = themeSets(game);
  parts.push(['Theme sets', Math.min(16, sets.length * 8)]);
  let styled = 0; for (const [mapId, rooms] of Object.entries(s.styles)) for (const [rid, v] of Object.entries(rooms)) { const r = (get('map', mapId).rooms || []).find((x) => x.id === rid); if (r && ((v.paper && v.paper !== r.paper) || (v.floor && v.floor !== r.floor))) styled++; }
  parts.push(['Room styles', Math.min(8, styled * 2)]);
  parts.push(['Upgrades', 4 * UPGRADES.filter((u) => game.flag(u.flag)).length]);
  const score = Math.min(100, parts.reduce((a, [, v]) => a + v, 0));
  return { score, parts, rank: score >= 80 ? 'Dreamy' : score >= 60 ? 'Snug' : score >= 40 ? 'Cozy' : score >= 20 ? 'Homey' : 'Bare', bonus: Math.floor(score / 10), sets };
}
export function themeSets(game) {
  const out = [];
  for (const mapId of DECOR_MAPS) {
    const mdef = get('map', mapId), count = {};
    for (const p of game.state.homeDecor.placed.filter((q) => q.map === mapId && CATALOG[q.id])) {
      const f = CATALOG[p.id], room = roomAt(mdef, p.x, f.kind === 'wall' ? p.y + 1 : p.y);
      if (!room || f.theme === 'season') continue;
      const k = room.id + '|' + f.theme; (count[k] ||= []).push(p);
    }
    for (const [k, ps] of Object.entries(count)) if (ps.length >= 5) out.push({ map: mapId, room: k.split('|')[0], theme: k.split('|')[1], pieces: ps });
  }
  return out;
}

// ---------- upgrades (Kinoko Woodworks) ----------
const UPGRADES = [
  { id: 'kitchen', flag: 'upg_kitchen', name: 'Big kitchen counter', price: 1200, desc: 'A long stone counter with a spice rack for the kitchen. Cook from it, and it adds comfort.' },
  { id: 'nook', flag: 'upg_nook', name: 'Reading nook', price: 900, desc: 'A cushioned window seat with built-in shelves in the sunroom. Read there for cozy and study.' },
  { id: 'bath', flag: 'upg_bath', name: 'Cypress bathtub', price: 1500, desc: 'Swap the bathtub for a fragrant hinoki tub. Baths restore twice as much.' },
  { id: 'skylight', flag: 'upg_skylight', name: 'Attic skylight', price: 2000, desc: 'A skylight and a little telescope in the attic for stargazing from home.' },
  { id: 'attic_bed', flag: 'upg_attic_bed', name: 'Attic bedroom', price: 1800, desc: 'A cozy bed under the attic beams. Sleep up there among the stars.' },
  { id: 'shed', flag: 'upg_shed', name: 'Garden shed shelves', price: 800, desc: 'Sturdy shelves in the garden shed for tools and gear: 4 more bag slots.' },
];
function buildUpgrades(game) {
  return UPGRADES.map((u) => ({
    id: u.id, name: u.name, price: u.price, desc: u.desc,
    owned: (g = game) => !!g.flag(u.flag),
    buy(g = game) {
      if (g.flag(u.flag)) { g.toast('Already built!'); return false; }
      if (!g.spend(u.price)) return false;
      g.setFlag(u.flag, true); if (u.id === 'shed') g.state.bagSize += 4;
      g.toast(`${u.name} built at home!`, 'i_star'); g.sfx('levelup'); g.stat('homeUpgrades'); g.bus.emit('homeUpgraded', { id: u.id });
      if (g.world && DECOR_MAPS.includes(g.world.map.id)) g.world.refreshRects();
      return true;
    },
  }));
}

// ---------- using furniture ----------
const once = (game, it, key) => { const s = st(game), k = key + it.uid; if (s.actDay[k] === game.day) return false; s.actDay[k] = game.day; return true; };
const SONGS = ['Moonlight on the Pier', 'Sakura Swing', 'Rainy Day Blues', 'The Lighthouse Waltz'];
const ACTS = {
  sit: { label: 'Sit', run(g, it) { g.advance(10); if (once(g, it, 'sit')) g.addMood(2); g.say('misa', 'happy', 'A nice little sit. My feet say thank you.'); } },
  lamp: { label: (g, it) => (isOn(it) ? 'Switch off' : 'Switch on'), run(g, it) { const s = st(g); if (isOn(it)) s.off[it.uid] = true; else delete s.off[it.uid]; g.sfx('blip'); } },
  read: { label: 'Read a book', run(g, it) { g.advance(30); g.sfx('page'); if (once(g, it, 'read')) { g.addMood(4); if (get('skill', 'study')) g.addXP('study', 2); } g.say('misa', 'happy', 'Just one more chapter... okay, two.'); } },
  nap: { label: 'Take a nap', run(g) { if (g.minutes >= 21 * 60) return g.sleepPrompt(); g.advance(60); g.addEnergy(12); g.run([{ t: 'fade', to: 1, dur: 0.4 }, { t: 'wait', dur: 0.5 }, { t: 'fade', to: 0, dur: 0.4 }, { t: 'say', who: 'misa', mood: 'sleepy', text: 'A perfect little nap. Refreshed!' }]); } },
  plant: { label: 'Admire', run(g, it) { if (once(g, it, 'plant')) g.addMood(1); g.say('misa', 'happy', 'Growing nicely. Plants make a house feel alive.'); } },
  hug: { label: 'Hug', run(g, it) { if (once(g, it, 'hug')) g.addMood(3); g.emote && g.emote('heart'); g.say('misa', 'happy', 'So soft! Don\'t tell Mochi.'); } },
  fish: { label: 'Watch the fish', run(g, it) { g.advance(10); if (once(g, it, 'fish')) g.addMood(3); g.say('misa', 'happy', 'Sushi is chasing Tempura again. They\'re best friends, really.'); } },
  music: { label: 'Play a record', run(g, it) { g.sfx('chime'); if (once(g, it, 'music')) g.addMood(4); g.toast(`Now playing: ${SONGS[Math.floor(g.rng() * SONGS.length) % SONGS.length]}`, 'i_music'); } },
  musicbox: { label: 'Wind the music box', run(g, it) { [0, 1, 2].forEach((i) => setTimeout(() => g.sfx('chime'), i * 500)); if (once(g, it, 'mbox')) g.addMood(5); g.say('misa', 'sleepy', 'That tune... Grandma used to hum it while she cooked.'); } },
  spin: { label: 'Spin the globe', run(g) { const P2 = ['Iceland', 'Peru', 'Kenya', 'Norway', 'New Zealand', 'Mongolia', 'Portugal']; g.say('misa', 'happy', `Spin... stop! One day I'll visit ${P2[Math.floor(g.rng() * P2.length) % P2.length]}.`); } },
  piano: { label: 'Play the piano', run(g) { get('interaction', 'int_piano').run(g); } },
  fan: { label: 'Sit by the fan', run(g, it) { if (g.season === 'summer' && once(g, it, 'fan')) g.addEnergy(4); g.say('misa', 'happy', 'Ahhhhh. Weeee are rooobots.'); } },
  tea: { label: 'Have tea', run(g, it) { if (!once(g, it, 'tea')) return g.say('misa', 'neutral', 'I already had my tea today. Any more and I\'ll float away.'); g.advance(20); g.addEnergy(8); g.addMood(4); g.sfx('pour'); g.say('misa', 'happy', 'Tea and a biscuit. A tiny celebration.'); } },
  kotatsu: { label: 'Sit in the kotatsu', run(g, it) { g.advance(30); const w = g.season === 'winter'; if (once(g, it, 'kot')) { g.addMood(w ? 10 : 3); g.addEnergy(w ? 6 : 2); } g.say('misa', 'sleepy', w ? 'Toasty legs, sleepy head. I may never leave.' : 'Cozy, even without the heater on.'); } },
  study: { label: 'Study', run(g) { if (g.studyAtDesk) g.studyAtDesk(); else g.say('misa', 'neutral', 'A tidy desk for homework. The star lamp helps me think.'); } },
  photo: { label: 'Look at the photo', run(g) { g.say('misa', 'happy', 'Mum, Dad and me at the aquarium. I miss them... but they\'ll call soon.'); } },
  chime: { label: 'Ring the chime', run(g) { g.sfx('bell'); g.say('misa', 'happy', 'Riiin... that sound means summer.'); } },
  mochi: { label: 'Look', run(g) { g.say('misa', 'happy', 'Mochi\'s favourite spot. There\'s fur all over it.'); } },
};
register('targetProvider', 'interiors_furniture', {
  find(world, game) {
    if (!DECOR_MAPS.includes(world.map.id) || !game.state.homeDecor) return null;
    const p = world.player; let best = null;
    for (const it of placedIn(world.map.id)) {
      const f = def(it), a = f.act && ACTS[f.act]; if (!a) continue;
      const r = f.kind === 'wall' ? [it.x * TILE, it.y * TILE, f.w * TILE, TILE] : [it.x * TILE, it.y * TILE, f.w * TILE, f.h * TILE];
      const cx = Math.max(r[0], Math.min(p.x, r[0] + r[2])), cy = Math.max(r[1], Math.min(p.y - 3, r[1] + r[3])), d = Math.hypot(p.x - cx, p.y - 3 - cy);
      if (d < 13 && (!best || d < best.dist)) best = { dist: d + 1, label: typeof a.label === 'function' ? a.label(game, it) : a.label, run: (g) => { g.stat('furnitureUsed'); a.run(g, it); }, x: r[0] + r[2] / 2, y: r[1] + r[3] / 2 };
    }
    return best;
  },
});

// ---------- the decorate scene ----------
const deep = (o) => JSON.parse(JSON.stringify(o));
function unpackBag(game) {
  let n = 0;
  for (const [id, c] of Object.entries(game.state.inv)) if (CATALOG[id] && c > 0) { st(game).box[id] = (st(game).box[id] || 0) + c; game.take(id, c); n += c; }
  if (n) game.toast(`Unpacked ${n} piece${n > 1 ? 's' : ''} into the decor box`, 'i_star');
}
class DecorateScene {
  constructor(game) {
    this.name = 'decorate'; this.opaque = false; this.pausesTime = true; this.game = game; this.world = game.world;
    const p = this.world.player; this.cur = { x: Math.floor(p.x / TILE), y: Math.floor((p.y - 2) / TILE) };
    this.held = null; this.sel = 0; this.undo = []; this.mode = 'place'; this.styleTab = 0; this.styleSel = 0; this.t = 0; this.msg = ''; this.msgT = 0;
  }
  enter(game) { unpackBag(game); game.sfx('select'); }
  say(m) { this.msg = m; this.msgT = 2.2; }
  get map() { return this.world.map; }
  boxList() { return Object.entries(st(this.game).box).filter(([id, n]) => n > 0 && CATALOG[id]).sort((a, b) => CATALOG[a[0]].name.localeCompare(CATALOG[b[0]].name)); }
  snapshot() { this.undo.push({ placed: deep(st(this.game).placed), box: deep(st(this.game).box) }); if (this.undo.length > 10) this.undo.shift(); }
  pieceAt(x, y) {
    const list = placedIn(this.map.id), f = (it) => def(it);
    const hits = list.filter((it) => tilesOf(it).some(([tx, ty]) => tx === x && ty === y) || (f(it).kind === 'wall' && it.y === y + 0 && x >= it.x && x < it.x + f(it).w));
    return hits.find((it) => f(it).kind === 'floor') || hits.find((it) => f(it).kind === 'wall') || hits[0] || null;
  }
  reserved() {
    const m = this.map, d = m.def, out = new Set(), add = (x, y) => out.add(x + ',' + y);
    for (const v of Object.values(d.spawns || {})) add(v[0], v[1]);
    for (const v of Object.values(d.spots || {})) add(v[0], v[1]);
    for (const w of d.warps || []) { add(w.x, w.y); add(w.x, w.y - 1); add(w.x, w.y + 1); }
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.tiles[y][x].door) add(x, y);
    return out;
  }
  // Can `it` (id, x, y, rot) go here? Returns '' if fine, else the reason.
  check(it, ignoreUid) {
    const m = this.map, f = def(it), game = this.game, others = placedIn(m.id).filter((p) => p.uid !== ignoreUid);
    if (f.kind === 'wall') {
      for (let i = 0; i < f.w; i++) if (!faceAt(m, it.x + i, it.y)) return 'Wall pieces hang on a wall';
      if (others.some((p) => def(p).kind === 'wall' && p.y === it.y && p.x < it.x + f.w && p.x + def(p).w > it.x)) return 'Something already hangs there';
      if (activeObjects(m, game).some((o) => o.flat && o.y === it.y && o.x < it.x + f.w && o.x + (o.w || 1) > it.x)) return 'Something already hangs there';
      if ((m.def.windows || []).some((w) => !w.side && w.y === it.y && w.x < it.x + f.w && w.x + (w.w || 1) > it.x)) return 'That would cover a window';
      return '';
    }
    const res = this.reserved(), tiles = tilesOf(it), room = roomAt(m.def, it.x, it.y);
    for (const [x, y] of tiles) {
      const t = x >= 0 && y >= 0 && x < m.w && y < m.h ? m.tiles[y][x] : null;
      if (!t || t.solid || t.wall) return 'It doesn\'t fit there';
      if (roomAt(m.def, x, y) !== room || !room) return 'Keep it inside one room';
      if (f.kind === 'floor' && f.solid !== false && res.has(x + ',' + y)) return 'That spot needs to stay clear';
    }
    const overlap = (r) => tiles.some(([x, y]) => x * TILE < r[0] + r[2] && x * TILE + TILE > r[0] && y * TILE < r[1] + r[3] && y * TILE + TILE > r[1]);
    if (f.kind === 'rug') { if (others.some((p) => def(p).kind === 'rug' && tilesOf(p).some(([a, b]) => tiles.some(([x, y]) => x === a && y === b)))) return 'Rugs can\'t overlap'; return ''; }
    if (activeObjects(m, game).some((o) => !o.flat && (o.solid || o.interact) && overlap(footprint(o)))) return 'Something is in the way';
    if (others.some((p) => def(p).kind === 'floor' && tilesOf(p).some(([a, b]) => tiles.some(([x, y]) => x === a && y === b)))) return 'Something is in the way';
    const pl = this.world.player, ptx = Math.floor(pl.x / TILE), pty = Math.floor((pl.y - 2) / TILE);
    if (solidOf(f) && tiles.some(([x, y]) => x === ptx && y === pty)) return 'Misa is standing there';
    if (solidOf(f) && !this.reachable(tiles, others)) return 'That would block the way';
    return '';
  }
  reachable(extra, others) {
    const m = this.map, grid = passGrid(m, this.game), block = (x, y) => { if (grid[y] && grid[y][x] !== undefined) grid[y][x] = false; };
    for (const p of others) if (solidOf(def(p))) tilesOf(p).forEach(([x, y]) => block(x, y));
    extra.forEach(([x, y]) => block(x, y));
    const [sx, sy] = m.def.spawns.default, seen = new Set([sx + ',' + sy]), q = [[sx, sy]];
    while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (!seen.has(k) && grid[ny] && grid[ny][nx]) { seen.add(k); q.push([nx, ny]); } } }
    const near = (x0, y0, w, h) => { for (let y = y0 - 1; y <= y0 + h; y++) for (let x = x0 - 1; x <= x0 + w; x++) if (seen.has(x + ',' + y)) return true; return false; };
    for (const [name, v] of Object.entries({ ...m.def.spawns, ...m.def.spots })) if (name !== 'cushion' && !seen.has(v[0] + ',' + v[1])) return false;
    for (const o of activeObjects(m, this.game)) if (o.interact && !near(Math.floor(o.x), Math.floor(o.y), Math.ceil(o.w || 1), Math.ceil(o.h || 1))) return false;
    return true;
  }
  act() {
    const s = st(this.game), game = this.game;
    if (this.held) {
      const it = { ...this.held, x: this.cur.x, y: this.cur.y }, why = this.check(it, this.held.from && this.held.from.uid);
      if (why) { this.say(why); game.sfx('wrong'); return; }
      this.snapshot();
      if (this.held.from) Object.assign(this.held.from, { x: it.x, y: it.y, rot: it.rot });
      else { s.box[it.id]--; s.placed.push(P(++s.uid, it.id, this.map.id, it.x, it.y, it.rot)); }
      this.held = null; game.sfx('pop'); game.stat('decorPlaced'); this.world.refreshRects();
      return;
    }
    const at = this.pieceAt(this.cur.x, this.cur.y);
    if (at) { this.held = { id: at.id, rot: at.rot, from: at, ox: at.x, oy: at.y }; game.sfx('blip'); return; }
    const list = this.boxList();
    if (!list.length) { this.say('The decor box is empty'); return; }
    const [id] = list[Math.min(this.sel, list.length - 1)];
    this.held = { id, rot: 0, from: null }; game.sfx('blip');
  }
  store() {
    const s = st(this.game);
    const target = this.held ? this.held.from : this.pieceAt(this.cur.x, this.cur.y);
    if (!target) { if (this.held) { this.held = null; this.game.sfx('back'); } return; }
    this.snapshot();
    s.placed = s.placed.filter((p) => p !== target); s.box[target.id] = (s.box[target.id] || 0) + 1; delete s.off[target.uid];
    this.held = null; this.game.sfx('back'); this.say(`${CATALOG[target.id].name} went back in the box`); this.world.refreshRects();
  }
  rotate() {
    const target = this.held || this.pieceAt(this.cur.x, this.cur.y); if (!target) return;
    const f = CATALOG[target.id]; if (f.kind === 'wall') return;
    if (!this.held) this.snapshot();
    target.rot = (target.rot + 1) % (f.vars ? f.vars.length : 2); this.game.sfx('blip');
  }
  update(dt, input, game) {
    this.t += dt; if (this.msgT > 0) this.msgT -= dt;
    const k = input.pressed, m = this.map;
    if (this.mode === 'style') return this.updateStyle(input, game);
    const mv = (dx, dy) => { this.cur.x = Math.max(0, Math.min(m.w - 1, this.cur.x + dx)); this.cur.y = Math.max(0, Math.min(m.h - 1, this.cur.y + dy)); };
    if (k.has('arrowleft') || k.has('a')) mv(-1, 0); if (k.has('arrowright') || k.has('d')) mv(1, 0);
    if (k.has('arrowup') || k.has('w')) mv(0, -1); if (k.has('arrowdown') || k.has('s')) mv(0, 1);
    if (input.moved && input.my < 182) { this.cur.x = Math.max(0, Math.min(m.w - 1, Math.floor((input.mx + this.world.cam.x) / 32))); this.cur.y = Math.max(0, Math.min(m.h - 1, Math.floor((input.my + this.world.cam.y) / 32))); }
    const n = this.boxList().length;
    if (!this.held && n && (k.has('tab') || k.has(']'))) { this.sel = (this.sel + 1) % n; game.sfx('blip'); }
    if (!this.held && n && (k.has('q') || k.has('['))) { this.sel = (this.sel + n - 1) % n; game.sfx('blip'); }
    if (k.has('r')) this.rotate();
    if (k.has('x') || k.has('delete') || k.has('backspace')) this.store();
    if (k.has('z') && this.undo.length) { const u = this.undo.pop(); st(game).placed = u.placed; st(game).box = u.box; this.held = null; game.sfx('back'); this.say('Undone'); this.world.refreshRects(); }
    if (k.has('p') && !this.held) { this.mode = 'style'; this.styleSel = 0; game.sfx('select'); return; }
    if (k.has('enter') || k.has(' ') || k.has('e') || (input.justDown && input.my < 182)) this.act();
    if (k.has('escape')) {
      if (this.held) { this.held = null; game.sfx('back'); }
      else { game.scenes.pop(this); game.sfx('back'); this.world.refreshRects(); return; }
    }
    // camera follows the cursor
    const w = this.world, tx = m.pw * 2 <= 320 ? (m.pw * 2 - 320) / 2 : Math.max(0, Math.min(m.pw * 2 - 320, this.cur.x * 32 + 16 - 160));
    const ty = m.ph * 2 <= 182 ? (m.ph * 2 - 182) / 2 : Math.max(0, Math.min(m.ph * 2 - 182, this.cur.y * 32 + 16 - 91));
    w.cam.x += (tx - w.cam.x) * Math.min(1, dt * 12); w.cam.y += (ty - w.cam.y) * Math.min(1, dt * 12);
  }
  styleRoom() { const d = this.map.def; return roomAt(d, this.cur.x, this.cur.y) || roomAt(d, this.cur.x, this.cur.y + 1); }
  styleLists() { const s = st(this.game); return [s.papers.filter((k) => PAPERS[k]), s.floors.filter((k) => FLOORS[k])]; }
  updateStyle(input, game) {
    const k = input.pressed, room = this.styleRoom(), lists = this.styleLists(), list = lists[this.styleTab];
    if (k.has('escape') || k.has('p') || !room) { this.mode = 'place'; game.sfx('back'); if (!room) this.say('Point at a room first'); return; }
    if (k.has('arrowleft') || k.has('arrowright') || k.has('a') || k.has('d') || k.has('tab')) { this.styleTab = 1 - this.styleTab; this.styleSel = 0; game.sfx('blip'); }
    if (k.has('arrowdown') || k.has('s')) this.styleSel = (this.styleSel + 1) % list.length;
    if (k.has('arrowup') || k.has('w')) this.styleSel = (this.styleSel + list.length - 1) % list.length;
    if (k.has('enter') || k.has(' ') || k.has('e')) {
      const s = st(game), rs = ((s.styles[this.map.id] ||= {})[room.id] ||= {});
      if (this.styleTab === 0) rs.paper = list[this.styleSel]; else rs.floor = list[this.styleSel];
      applyStyles(this.world); game.sfx('pop'); game.stat('roomRestyled');
    }
  }
  draw(g, game) {
    const w = this.world, m = this.map, cx = Math.round(w.cam.x), cy = Math.round(w.cam.y);
    const R = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), ww, hh); };
    // grid dots on floor tiles
    for (let ty = Math.floor(cy / 32); ty <= Math.floor((cy + 182) / 32); ty++) for (let tx = Math.floor(cx / 32); tx <= Math.floor((cx + 320) / 32); tx++) {
      const t = ty >= 0 && tx >= 0 && ty < m.h && tx < m.w ? m.tiles[ty][tx] : null;
      if (!t || t.solid || !roomAt(m.def, tx, ty)) continue;
      R(tx * 32 - cx, ty * 32 - cy, 2, 1, 'rgba(255,250,240,0.55)'); R(tx * 32 - cx, ty * 32 - cy, 1, 2, 'rgba(255,250,240,0.55)');
    }
    const box = (x, y, ww, hh, c) => { R(x, y, ww, 1, c); R(x, y + hh - 1, ww, 1, c); R(x, y, 1, hh, c); R(x + ww - 1, y, 1, hh, c); };
    if (this.held) {
      const it = { ...this.held, x: this.cur.x, y: this.cur.y }, f = def(it), why = this.check(it, this.held.from && this.held.from.uid);
      g.fillStyle = why ? 'rgba(224,112,122,0.28)' : 'rgba(134,205,176,0.28)';
      const rh = f.kind === 'wall' ? 1 : f.h;
      g.fillRect(it.x * 32 - cx, it.y * 32 - cy, f.w * 32, rh * 32);
      drawPiece(g, w, it, 0.8);
      box(it.x * 32 - cx, it.y * 32 - cy, f.w * 32, rh * 32, why ? C.coral[2] : C.mint[2]);
    } else {
      const at = this.pieceAt(this.cur.x, this.cur.y);
      if (at) { const b = spriteBox(w, at); if (b) box(b.x - cx - 2, b.y - cy - 2, b.w + 4, b.h + 4, C.butter[2]); }
      const pulse = Math.floor(this.t * 4) % 2 ? C.butter[3] : C.butter[2];
      box(this.cur.x * 32 - cx, this.cur.y * 32 - cy, 32, 32, pulse); box(this.cur.x * 32 - cx + 1, this.cur.y * 32 - cy + 1, 30, 30, 'rgba(42,26,34,0.5)');
    }
    // bottom panel
    R(0, 182, 320, 42, C.ink[1]); R(1, 183, 318, 40, C.paper[3]); R(1, 183, 318, 1, C.paper[4]); R(1, 221, 318, 2, C.paper[2]);
    const cf = homeComfort(game);
    if (this.mode === 'style') return this.drawStyle(g, R);
    const list = this.boxList(), heldF = this.held && CATALOG[this.held.id];
    const show = heldF ? [this.held.id, 0] : list[Math.min(this.sel, list.length - 1)];
    if (show) {
      const f = CATALOG[show[0]], ic = get('item', show[0]).icon; R(6, 188, 20, 20, C.paper[2]); if (SPRITES[ic]) g.drawImage(sprite(ic), 8, 190);
      drawText(g, f.name, 30, 188, C.ink[1], 1, null);
      drawText(g, heldF ? (this.held.from ? 'Moving' : 'Placing') + ` - ${THEMES[f.theme]}` : `In box: ${show[1]}  (${this.sel + 1}/${list.length})  ${THEMES[f.theme]}`, 30, 196, C.ink[3], 1, null);
    } else drawText(g, 'Decor box is empty', 30, 190, C.ink[3], 1, null);
    drawText(g, `Cozy ${cf.score} ${cf.rank}`, 246, 188, C.coral[1], 1, null);
    drawText(g, this.held ? 'E: place  R: turn  X: store  Esc: cancel' : 'E: pick up/take out  Q/Tab: box  R: turn  X: store', 6, 206, C.ink[2], 1, null);
    drawText(g, 'P: wallpaper and floors   Z: undo   Esc: done', 6, 214, C.ink[2], 1, null);
    if (this.msgT > 0) { const tw = this.msg.length * 4 + 8; R(160 - tw / 2, 4, tw, 11, C.ink[1]); drawText(g, this.msg, 164 - tw / 2, 7, C.paper[4], 1, null); }
    else { R(96, 4, 128, 11, 'rgba(30,22,36,0.7)'); drawText(g, 'Decorating', 140, 7, C.butter[3], 1, null); }
  }
  drawStyle(g, R) {
    const room = this.styleRoom(), lists = this.styleLists(), list = lists[this.styleTab];
    R(180, 20, 134, 160, C.ink[1]); R(181, 21, 132, 158, C.paper[3]);
    drawText(g, room ? room.name : '', 186, 25, C.coral[1], 1, null);
    ['Wallpaper', 'Floor'].forEach((t, i) => { R(186 + i * 62, 34, 58, 10, i === this.styleTab ? C.butter[3] : C.paper[2]); drawText(g, t, 190 + i * 62, 37, C.ink[1], 1, null); });
    const top = Math.max(0, Math.min(this.styleSel - 6, list.length - 13));
    const s = st(this.game), cur = room && ((s.styles[this.map.id] || {})[room.id] || {});
    list.slice(top, top + 13).forEach((k, i) => {
      const idx = top + i, y = 48 + i * 10, name = this.styleTab === 0 ? PAPERS[k].name : FLOORS[k].name;
      const active = this.styleTab === 0 ? (cur.paper || room.paper) === k : (cur.floor || room.floor) === k;
      if (idx === this.styleSel) R(184, y - 2, 126, 10, C.butter[3]);
      drawText(g, (active ? '* ' : '  ') + name, 188, y, C.ink[1], 1, null);
    });
    drawText(g, 'Up/down: choose  Left/right: wallpaper or floor', 6, 192, C.ink[2], 1, null);
    drawText(g, 'E: apply to this room   Esc: back', 6, 202, C.ink[2], 1, null);
    drawText(g, 'Find more patterns at Kinoko Woodworks', 6, 212, C.ink[3], 1, null);
  }
}
register('scene', 'decorate', { make: (game) => new DecorateScene(game) });
export function openDecorate(game) {
  if (!game.world || !DECOR_MAPS.includes(game.world.map.id)) { game.toast('Decorate mode works at home'); return false; }
  game.open('decorate'); return true;
}

registerMany('interaction', {
  decor_box: { label: 'Decor box', run: (g) => { unpackBag(g); openDecorate(g); } },
});

// ---------- phone app ----------
const homeIcon = itemIcon('furniture', { c: '#e0707a' });
register('phoneApp', 'home_decor', {
  name: 'Home', icon: homeIcon, order: 60,
  update(dt, input, game, app) {
    const k = input.pressed;
    if ((k.has('enter') || k.has('e') || k.has(' ')) && game.world && DECOR_MAPS.includes(game.world.map.id)) { app.scene.close(); openDecorate(game); }
  },
  draw(g, game, app) {
    const { x, y, w } = app.area, R = (a, b, c, d, col) => { g.fillStyle = col; g.fillRect(a, b, c, d); };
    const cf = homeComfort(game);
    drawText(g, `Home comfort: ${cf.score}/100  (${cf.rank})`, x + 6, y + 6, C.ink[1], 1, null);
    R(x + 6, y + 15, 120, 6, C.ink[1]); R(x + 7, y + 16, 118, 4, C.paper[2]); R(x + 7, y + 16, Math.round(118 * cf.score / 100), 4, C.coral[2]);
    drawText(g, `Morning energy bonus: +${cf.bonus}`, x + 134, y + 15, C.forest[1], 1, null);
    cf.parts.forEach(([n, v], i) => drawText(g, `${n}: ${v}`, x + 6 + (i % 2) * 100, y + 28 + Math.floor(i / 2) * 9, C.ink[2], 1, null));
    if (cf.sets.length) drawText(g, `Theme sets: ${cf.sets.map((s2) => THEMES[s2.theme]).join(', ')}`, x + 6, y + 66, C.coral[1], 1, null);
    drawText(g, 'House upgrades (Kinoko Woodworks):', x + 6, y + 80, C.ink[1], 1, null);
    (game.homeUpgrades || []).forEach((u, i) => drawText(g, `${u.owned(game) ? '[x]' : '[ ]'} ${u.name}  ${u.owned(game) ? 'built' : u.price + ' coins'}`, x + 10, y + 90 + i * 9, u.owned(game) ? C.forest[1] : C.ink[2], 1, null));
    const n = Object.values(st(game).box).reduce((a, b) => a + b, 0);
    drawText(g, `Decor box: ${n} piece${n === 1 ? '' : 's'}   Placed: ${st(game).placed.length}`, x + 6, y + 148, C.ink[2], 1, null);
    drawText(g, game.world && DECOR_MAPS.includes(game.world.map.id) ? 'Press E to decorate' : 'Go home to decorate', x + w - 90, y + 160, C.coral[1], 1, null);
  },
});

// ---------- system: styles on entry, daily comfort bonus, magazine, sparkles ----------
let pendingBonus = false, sparkT = 0;
register('system', 'interiorsDecor', {
  init(game) {
    GAME = game;
    game.homeUpgrades = buildUpgrades(game);
    game.homeComfort = () => homeComfort(game);
    game.decorate = () => openDecorate(game);
    game.bus.on('dayStart', () => {
      pendingBonus = true;
      const dos = ((game.day - 1) % 28) + 1;
      if (dos === 28 && st(game).magDay !== game.day) {
        st(game).magDay = game.day;
        const cf = homeComfort(game), grade = cf.score >= 80 ? 'S' : cf.score >= 60 ? 'A' : cf.score >= 40 ? 'B' : cf.score >= 20 ? 'C' : 'D';
        let prize = '';
        if ('SAB'.includes(grade)) { const ids = Object.keys(CATALOG), r = game.rngFor('homeMag'), pick = ids[Math.floor(r() * ids.length)]; st(game).box[pick] = (st(game).box[pick] || 0) + 1; prize = ` I sent you a ${CATALOG[pick].name.toLowerCase()} as a prize. It's in your decor box!`; }
        game.mail('home_mag_' + game.day, 'Aunt Nori', `Home Magazine, ${game.season} issue! Your home scored ${cf.score} (grade ${grade}, "${cf.rank}").${prize} ${grade === 'D' || grade === 'C' ? 'Try a rug, a lamp and a plant or two!' : 'Grandma would be so proud.'}`);
      }
    });
    game.bus.on('mapEnter', ({ map }) => {
      if (DECOR_MAPS.includes(map) && game.world) applyStyles(game.world);
      if (pendingBonus && map === 'home' && st(game).bonusDay !== game.day) {
        pendingBonus = false; st(game).bonusDay = game.day;
        const cf = homeComfort(game);
        if (cf.bonus > 0) { game.addEnergy(cf.bonus); game.toast(`A ${cf.rank.toLowerCase()} home: +${cf.bonus} energy`, 'i_star'); }
      }
    });
  },
});
register('worldTick', 'interiors_sparkle', {
  update(dt, world, game) {
    if (!DECOR_MAPS.includes(world.map.id) || !game.state.homeDecor || (sparkT -= dt) > 0) return;
    sparkT = 0.35;
    const sets = themeSets(game).filter((s) => s.map === world.map.id); if (!sets.length) return;
    const s = sets[Math.floor(Math.random() * sets.length)], p = s.pieces[Math.floor(Math.random() * s.pieces.length)], f = CATALOG[p.id];
    world.particles.push({ c: Math.random() < 0.5 ? '#fffbe0' : '#ffd76a', x: (p.x + Math.random() * f.w) * TILE, y: (p.y + (f.kind === 'wall' ? 0.3 : 0)) * TILE - Math.random() * 10, vy: -10, life: 0.9, s: 2 });
  },
});

features('Home & decorating', [
  'Decorate mode: move a cursor over the house, pick up, move and place furniture on a grid with a ghost preview',
  'Placement checks collisions, keeps doors, beds and paths clear, and refuses spots that would block the way',
  'Turn furniture with R: chairs and sofas face forward or away, other pieces flip left or right',
  'Store pieces in the unlimited decor box, then take them out again any time',
  'Undo the last 10 decorating moves with Z',
  'Decorate the attic as well as the house',
  'Open decorate mode from the decor box in the bedroom or from the Home phone app',
  'Furniture bought or found goes into the decor box automatically when you decorate (or use it from the bag)',
  'Starts with Grandma\'s old decor already placed: poster, bunting, cactus, lamp, plushie, fern and cushions',
  'Furniture catalogue of 72 pieces in seven themes: cozy wood, ocean, retro, starry, forest, cafe and seasonal',
  'Rugs lie under furniture and can be layered across rooms',
  'Wall pieces hang on wall faces: posters, paintings, a star chart, bunting, wall clocks, a ship\'s wheel and a neon sign',
  'Wallpapers per room: 18 patterns from cream plaster to night-sky stars, painted procedurally',
  'Floors per room: 16 floorings (planks, tatami, check tiles, mosaics, carpets, linoleum, slate)',
  'Wallpaper rolls and flooring bundles unlock new styles when used',
  'Home comfort score from furniture, variety, lights, plants, matching themes, room styles and upgrades',
  'A cozier home gives a small energy bonus every morning (up to +10)',
  'Theme set bonus: five pieces of one theme in a room add comfort and make the room sparkle',
  'Seasonal pieces count double while their season is on (kotatsu, fan, sunflower, wind chime, carp streamer, Starry Eve tree)',
  'Placed lamps, candles and lanterns light the room at night and can be switched on and off',
  'Interactive furniture: sit on chairs and sofas, nap on beds and futons, read from bookshelves, have tea from the trolley',
  'Record player and jukebox play a named song; the music box plays Grandma\'s lullaby',
  'Fish tank, desk globe, cat plushie, electric fan, wind chime and photo frame each have their own little moment',
  'Wall clocks you place show the real time',
  'Aunt Nori\'s Home Magazine grades your house at the end of every season and sends a prize piece for a good grade',
  'Home phone app: comfort score with a breakdown, theme sets, upgrades and a shortcut into decorate mode',
  'House upgrades from Kinoko Woodworks: a big kitchen counter, a reading nook, a cypress bathtub, an attic skylight, an attic bedroom and garden shed shelves',
  'The attic skylight upgrade adds a telescope for stargazing from home',
  'The attic bedroom upgrade adds a bed you can sleep in under the beams',
  'Garden shed shelves add 4 bag slots',
  'Read in the reading nook for cozy and a little study progress',
]);
