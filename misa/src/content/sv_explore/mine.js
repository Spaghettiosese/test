// Hoshi Mine: a 30-floor cozy cave dungeon below the tide-pool cave. One reusable map ('hoshi_mine') whose rows, walls and
// spawns are generated per day and floor (game.rngFor), rocks/ore/ladders/dust live in a worldLayer + targetProvider.
//
// Floor 0 is the entrance room (elevator, sign, ladder to floor 1, door back to the cave). Floors 1-30 are generated:
// five to seven connected caverns, one rock hides the ladder down, ore and gems depend on depth, dust sprites drift about.
// Mining: pickaxe tiers 1-3 (3/2/1 energy a swing), hardness per rock, gated ores (silver needs tier 2, star-gold tier 3).
// Safety: running out of energy never kills; you wake at the entrance with a little less money.
// Cave integration (done at runtime, no edit to coast files): cave.spawns.from_mine plus a warp tile at (3,6).
import { register, get, features } from '../../core/registry.js';
import { TILE } from '../../world/map.js';
import { mulberry32 } from '../../rng.js';
import { grid } from '../coast/util.js';
import { hash } from '../../gfx/noise.js';
import { drawText } from '../../font.js';
import { SV, clamp } from './data.js';
import { hasProf } from './prof.js';
import { fx } from './util.js';
import { inWorld, facingTile } from '../hobbies/common.js';

export const W = 32, H = 22, MAX_FLOOR = 30;
let GAME = null;
export const setMineGame = (g) => { GAME = g; FL.clear(); };
const curFloor = () => (GAME && GAME.state.sv_explore ? SV(GAME).mine.floor : 0);
const FL = new Map();

// ---------------------------------------------------------------- generation
const LOBBY_ROWS = ['################', '#..............#', '#..............#', '#..............#', '#..............#', '#..............#', '#..............#', '#..............#', '#######..#######', '################'];
export const KIND_WEIGHTS = (f) => {
  const t = Math.min(5, Math.floor(f / 5));
  return [['stone', 55], ['coal', 6 + t * 2], ['copper', f < 15 ? 16 : 6], ['iron', f >= 4 ? (f < 20 ? 13 : 8) : 0], ['silver', f >= 9 ? (f < 25 ? 10 : 7) : 0], ['stargold', f >= 17 ? (f >= 25 ? 9 : 5) : 0], ['geode', 7], ['gem', f >= 2 ? 4 + t : 0], ['crystal', f >= 3 ? 4 : 0]];
};
export function genFloor(f, rng) {
  if (f === 0) return { floor: 0, rows: LOBBY_ROWS, up: [7, 2], spawn: [7, 7], down: [7, 2], rocks: [], dust: [], props: [{ kind: 'sign', x: 3, y: 2, solid: true }, { kind: 'ladder_down', x: 7, y: 2 }, { kind: 'elevator', x: 11, y: 2, solid: true }] };
  const G = grid(W, H, '#'), rooms = [], corr = new Set(), n = 5 + Math.floor(rng() * 3);
  for (let i = 0; i < n; i++) {
    const rx = 3 + Math.floor(rng() * 3), ry = 2 + Math.floor(rng() * 2);
    const cx = clamp(Math.round(2 + rx + (i * (W - 6 - 2 * rx)) / (n - 1)) + Math.floor(rng() * 3) - 1, rx + 2, W - rx - 3), cy = clamp(4 + Math.floor(rng() * (H - 8)), ry + 2, H - ry - 3);
    rooms.push({ cx, cy, rx, ry }); G.blob(cx, cy, rx, ry, '.');
  }
  const carve = (a, b) => {
    let x = a.cx, y = a.cy;
    const step = () => { for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) if (x + dx > 0 && y + dy > 0 && x + dx < W - 1 && y + dy < H - 1 && G.get(x + dx, y + dy) === '#') { G.set(x + dx, y + dy, '.'); corr.add(`${x + dx},${y + dy}`); } };
    while (x !== b.cx) { x += Math.sign(b.cx - x); step(); }
    while (y !== b.cy) { y += Math.sign(b.cy - y); step(); }
  };
  for (let i = 0; i < n - 1; i++) { carve(rooms[i], rooms[i + 1]); if (i + 2 < n && rng() < 0.4) carve(rooms[i], rooms[i + 2]); }
  for (let x = 0; x < W; x++) { G.set(x, 0, '#'); G.set(x, H - 1, '#'); }
  for (let y = 0; y < H; y++) { G.set(0, y, '#'); G.set(W - 1, y, '#'); }
  const up = [rooms[0].cx, rooms[0].cy], props = [{ kind: 'ladder_up', x: up[0], y: up[1] }];
  if (f % 5 === 0) props.push({ kind: 'elevator', x: up[0] + 2, y: up[1], solid: true });
  const taken = new Set(props.map((p) => `${p.x},${p.y}`)), cand = [];
  G.each((x, y, c) => { if (c === '.' && !corr.has(`${x},${y}`) && Math.hypot(x - up[0], y - up[1]) >= 3 && !taken.has(`${x},${y}`)) cand.push([x, y]); });
  const want = 14 + Math.floor(f / 4) + Math.floor(rng() * 6), rocks = [];
  const wts = KIND_WEIGHTS(f), tot = wts.reduce((a, [, w]) => a + w, 0);
  for (let i = 0; i < want && cand.length; i++) {
    const [x, y] = cand.splice(Math.floor(rng() * cand.length), 1)[0];
    let r = rng() * tot, kind = 'stone';
    for (const [k, w] of wts) if ((r -= w) < 0) { kind = k; break; }
    rocks.push({ x, y, kind });
  }
  let down = null;
  if (f < MAX_FLOOR && rocks.length) {
    const far = rocks.slice().sort((a, b) => Math.hypot(b.x - up[0], b.y - up[1]) - Math.hypot(a.x - up[0], a.y - up[1]));
    const r = far[Math.floor(rng() * Math.min(3, far.length))];
    r.kind = 'stone'; r.ladder = true; down = [r.x, r.y];
  }
  const spots = []; G.each((x, y, c) => { if (c === '.' && Math.hypot(x - up[0], y - up[1]) >= 7 && !rocks.some((r) => r.x === x && r.y === y)) spots.push([x, y]); });
  const dust = [], dn = f < 2 ? 0 : Math.min(4, 1 + Math.floor(f / 8) + (rng() < 0.5 ? 1 : 0));
  for (let i = 0; i < dn && spots.length; i++) { const [x, y] = spots.splice(Math.floor(rng() * spots.length), 1)[0]; dust.push({ id: i, x: x * TILE + 8, y: y * TILE + 8 }); }
  return { floor: f, rows: G.rows(), up, spawn: [up[0], up[1] + 1], down, rocks, dust, props };
}
export function floorData(f) {
  const day = GAME ? GAME.day : 1, key = `${GAME ? GAME.state.seed : 1}:${day}:${f}`;
  if (GAME && GAME.state.sv_explore) { const st = SV(GAME).mine; if (st.day !== day) { st.day = day; st.broken = {}; st.ladders = {}; st.gone = {}; } }
  let fd = FL.get(key);
  if (!fd) {
    fd = genFloor(f, GAME ? GAME.rngFor('sv_mine' + f, day) : mulberry32(f * 977 + 13));
    fd.dmg = {}; fd.shake = {};
    fd.dustRt = fd.dust.map((d) => ({ ...d, tx: d.x, ty: d.y, cd: 0, t: d.id * 1.7 }));
    FL.set(key, fd);
  }
  return fd;
}
const rkey = (f, r) => `${f}:${r.x},${r.y}`;
const mineSt = () => SV(GAME).mine;
export const broken = (f, r) => !!mineSt().broken[rkey(f, r)];
export const ladderOpen = (f) => f === 0 || !!mineSt().ladders[f];

// ---------------------------------------------------------------- the map
const wallCache = new Map();
function wallObjects(rows) {
  if (wallCache.has(rows)) return wallCache.get(rows);
  const out = [];
  rows.forEach((row, y) => [...row].forEach((c, x) => {
    if (c !== '#') return;
    const below = rows[y + 1] && rows[y + 1][x], v = Math.floor(hash(x, y, 3) * 3);
    out.push({ spr: below && below !== '#' ? `coast_cave_face_${v}` : `coast_cave_top_${v}`, x, y, wall: true, solid: false });
  }));
  if (wallCache.size > 12) wallCache.clear();
  wallCache.set(rows, out);
  return out;
}
const mapDef = register('map', 'hoshi_mine', {
  name: 'Hoshi Mine', indoor: true, music: 'night', bg: '#141220',
  legend: { '#': 'coast_cavewall', '.': 'dirt' },
  rows: LOBBY_ROWS, objects: [], warps: [], spawns: { default: [7, 7, 'up'], from_cave: [7, 7, 'up'] }, spots: { entrance: [7, 7] },
  onEnter(game) { if (!game.flag('sv_mine_intro')) { game.setFlag('sv_mine_intro'); game.toast('Hoshi Mine: swing a pickaxe at rocks. One of them hides the ladder down.'); } },
});
const lazy = (name, fn) => Object.defineProperty(mapDef, name, { enumerable: true, configurable: true, get: fn });
lazy('rows', () => floorData(curFloor()).rows);
lazy('objects', () => wallObjects(floorData(curFloor()).rows));
lazy('warps', () => (curFloor() === 0 ? [{ x: 7, y: 8, w: 2, enter: 'down', to: 'cave:from_mine' }] : []));
lazy('spawns', () => { const fd = floorData(curFloor()); return { default: [fd.spawn[0], fd.spawn[1], 'down'], from_cave: [7, 7, 'up'] }; });
lazy('spots', () => ({ entrance: floorData(curFloor()).spawn }));

// The way in: a door sprite drawn on the cave's west wall (see sprites() below); the warp itself is one line in coast/maps.js.

// ---------------------------------------------------------------- mining rules
export const HARD = { stone: 1, coal: 1, copper: 1, iron: 2, silver: 2, stargold: 3, geode: 2, gem: 2, crystal: 2 };
export const MIN_TIER = { silver: 2, stargold: 3 };
export const XPV = { stone: 1, coal: 2, copper: 3, iron: 5, silver: 8, stargold: 12, geode: 5, gem: 8, crystal: 6 };
const SWING = { 1: 3, 2: 2, 3: 1 };
const LABEL = { stone: 'Break the rock', coal: 'Mine the coal', copper: 'Mine the copper vein', iron: 'Mine the iron vein', silver: 'Mine the silver vein', stargold: 'Mine the star-gold vein', geode: 'Crack the geode node', gem: 'Mine the gem node', crystal: 'Mine the crystal cluster' };
export const pickTier = (game) => (game.has('tool_pickaxe_3') ? 3 : game.has('tool_pickaxe_2') ? 2 : game.has('tool_pickaxe') ? 1 : 0);
export const swingCost = (game, tier = pickTier(game)) => Math.max(1, (SWING[tier] || 3) - (hasProf(game, 'minerSwing') ? 1 : 0));
export const hitsNeeded = (kind, tier) => Math.max(1, HARD[kind] - (tier - 1));
const geodeFor = (f) => (f < 10 ? 'min_geode' : f < 20 ? 'ore_frozen_geode' : 'ore_star_geode');
export function gemFor(game, f) {
  const r = game.rng();
  if (f < 5) return 'min_topaz';
  if (f < 10) return r < 0.5 ? 'min_topaz' : 'min_aquamarine';
  if (f < 15) return r < 0.4 ? 'min_aquamarine' : r < 0.7 ? 'min_ruby' : 'min_emerald';
  if (f < 20) return r < 0.3 ? 'min_ruby' : r < 0.6 ? 'min_emerald' : r < 0.8 ? 'min_aquamarine' : 'min_diamond';
  return r < 0.4 ? 'min_diamond' : r < 0.55 ? 'min_star_shard' : r < 0.8 ? 'min_ruby' : 'min_emerald';
}
export function rollDrops(game, f, kind) {
  const r = () => game.rng(), pro = hasProf(game, 'prospector') ? 1 : 0, out = {};
  const add = (id, n) => { out[id] = (out[id] || 0) + n; };
  if (kind === 'stone') { add('ore_stone', 1 + (r() < 0.5 ? 1 : 0)); if (r() < 0.06) add('ore_coal', 1); }
  else if (kind === 'coal') add('ore_coal', 1 + (r() < 0.4 ? 1 : 0));
  else if (kind === 'copper') add('ore_copper', 1 + (r() < 0.5 ? 1 : 0) + pro);
  else if (kind === 'iron') add('ore_iron', 1 + (r() < 0.35 ? 1 : 0) + pro);
  else if (kind === 'silver') add('ore_silver', 1 + (r() < 0.25 ? 1 : 0) + pro);
  else if (kind === 'stargold') add('ore_star_gold', 1 + (r() < 0.15 ? 1 : 0) + pro);
  else if (kind === 'geode') add(geodeFor(f), hasProf(game, 'excavator') ? 2 : 1);
  else if (kind === 'gem') { add(gemFor(game, f), 1); if (hasProf(game, 'geo') && r() < 0.3) add(gemFor(game, f), 1); }
  else if (kind === 'crystal') { add('min_quartz', 1); if (r() < 0.25) add('min_amethyst', 1); if (f >= 15 && r() < 0.2) add('min_moonstone', 1); }
  if (kind !== 'gem' && kind !== 'crystal' && hasProf(game, 'geo') && r() < 0.06 * (1 + f / 10)) add(gemFor(game, f), 1);
  return out;
}
export function giveDrops(game, drops, kind) {
  for (const [id, n] of Object.entries(drops)) {
    game.give(id, n);
    const st = mineSt();
    if (!st.ores[id]) { st.ores[id] = 1; if (get('item', id).tags && get('item', id).tags.includes('ore') && id !== 'ore_stone') game.toast(`First ${get('item', id).name.toLowerCase()}! Tobias can smelt ore into bars.`, get('item', id).icon); }
    if (id.startsWith('min_')) { game.collect('mineral', id); game.stat('mineralsFound'); game.bus.emit('mineralFound', { item: id }); }
    game.stat('oreMined', n);
    game.bus.emit('mined', { item: id, kind, n });
  }
}
// One pickaxe swing at a rock. Returns 'broke' | 'hit' | 'blocked' | 'tired'.
export function mineSwing(game, rock) {
  const f = mineSt().floor, tier = pickTier(game);
  if (!tier) { game.toast('You need a pickaxe. Kinoko Woodworks sells them.'); return 'blocked'; }
  if ((MIN_TIER[rock.kind] || 1) > tier) { game.toast(rock.kind === 'silver' ? 'Too hard for this pickaxe. Ask Tobias for a copper upgrade.' : 'Too hard for this pickaxe. Ask Tobias for the star upgrade.'); return 'blocked'; }
  const cost = swingCost(game, tier);
  if (game.energy < cost) { if (game.energy < 2) { faint(game); } else game.toast('Too tired to swing. Eat something or head back up.'); return 'tired'; }
  game.useEnergy(cost); game.advance(1); game.sfx('dig'); mineSt().swings++;
  const fd = floorData(f), k = rkey(f, rock);
  fd.dmg[k] = (fd.dmg[k] || 0) + 1; fd.shake[k] = 0.25;
  if (game.world) fx(game, rock.x * TILE + 8, rock.y * TILE + 10, 4, '#b9b2c4');
  if (fd.dmg[k] < hitsNeeded(rock.kind, tier)) { if (game.energy <= 0) faint(game); return 'hit'; }
  mineSt().broken[k] = true;
  game.sfx('pop'); game.stat('rocksBroken');
  if (rock.ladder) { mineSt().ladders[f] = true; game.toast('A ladder down!', 'i_star'); game.sfx('star'); }
  giveDrops(game, rollDrops(game, f, rock.kind), rock.kind);
  game.addXP('mining', XPV[rock.kind]);
  if (game.world) { fx(game, rock.x * TILE + 8, rock.y * TILE + 8, 8, '#d9d4e2'); game.world.refreshRects(); }
  if (game.energy <= 0) faint(game);
  return 'broke';
}

// ---------------------------------------------------------------- floors, elevator, rewards, fainting
const REWARDS = {
  5: { coins: 300, items: { mat_bar_copper: 4 }, stickers: 0, text: 'Floor 5! Tobias left a lunchbox and a note: "Nice digging. Copper bars on me."' },
  10: { coins: 700, items: { mat_bar_iron: 4 }, stickers: 1, text: 'Floor 10! A tin of iron bars was tucked behind a lantern, plus a Star Sticker.' },
  15: { coins: 1200, items: { mat_bar_silver: 3, min_aquamarine: 1 }, stickers: 2, text: 'Floor 15! The air smells of silver. Someone left a prize here for the first to arrive.' },
  20: { coins: 2000, items: { mat_bar_star_gold: 3, min_diamond: 1 }, stickers: 3, text: 'Floor 20! A little shrine of stacked stones holds star-gold bars and a diamond.' },
  25: { coins: 3000, items: { mat_bar_star_gold: 4, min_star_shard: 1 }, stickers: 3, text: 'Floor 25! The stars are almost close enough to touch. A star shard glitters on the ground.' },
  30: { coins: 5000, items: { mat_bar_star_gold: 6, min_star_shard: 2, min_diamond: 2 }, stickers: 5, text: 'Floor 30, the bottom of Hoshi Mine! The walls glow with a thousand little stars.' },
};
export const REWARD_FLOORS = Object.keys(REWARDS).map(Number);
export function applyReward(game, f) {
  const rw = REWARDS[f], st = mineSt();
  if (!rw || st.rewards[f]) return null;
  st.rewards[f] = game.day;
  game.addMoney(rw.coins, true);
  for (const [id, n] of Object.entries(rw.items)) { game.give(id, n, true); if (id.startsWith('min_')) { game.collect('mineral', id); game.bus.emit('mineralFound', { item: id }); } }
  if (rw.stickers && game.giveStickers) game.giveStickers(rw.stickers, `mine floor ${f}`);
  game.setFlag('sv_mine_f' + f);
  return rw;
}
export function faintEffects(game) {
  const st = mineSt(); st.faints++;
  const loss = Math.min(game.money, clamp(Math.round(game.money * 0.05), 10, 200));
  game.addMoney(-loss, true);
  if (game.energy < 30) game.addEnergy(30 - game.energy);
  st.floor = 0; game.advance(60);
  return loss;
}
export function faint(game) {
  if (GAME !== game) return Promise.resolve();
  let loss = 0;
  return game.run([
    { t: 'say', who: null, text: 'Your arms turn to jelly and the lantern light swims... everything goes dark.' },
    { t: 'call', fn: async (g) => { loss = faintEffects(g); await g.warp('hoshi_mine', 7, 7, 'up'); } },
    { t: 'say', who: 'misa', mood: 'sleepy', text: `Ugh... somebody must have carried me back to the entrance. I lost ${loss} coins on the way, but I'm fine.` },
  ]);
}
export async function goFloor(game, f, from = 'up') {
  const st = mineSt(), prev = st.floor;
  st.floor = f;
  if (f > st.best) { st.best = f; game.state.stats.mineDepth = f; }
  if (f >= 5) st.elev = Math.max(st.elev, f - (f % 5));
  game.bus.emit('mineFloor', { floor: f, best: st.best });
  const fd = floorData(f);
  let pos = fd.spawn;
  if (from === 'down') {
    if (f === 0) pos = [7, 3];
    else { st.ladders[f] = true; if (fd.down) st.broken[rkey(f, { x: fd.down[0], y: fd.down[1] })] = true; pos = fd.down || fd.spawn; }
  }
  if (REWARDS[f] && !st.rewards[f]) game.svMine.reward = f;
  void prev;
  await game.warp('hoshi_mine', pos[0], pos[1], 'down');
}
function elevatorMenu(game) {
  const st = mineSt(), opts = [{ text: 'Entrance', steps: [{ t: 'call', fn: (g) => goFloor(g, 0, 'down') }] }];
  for (let f = 5; f <= st.elev; f += 5) opts.push({ text: `Floor ${f}`, steps: [{ t: 'call', fn: (g) => goFloor(g, f, 'up') }] });
  opts.push({ text: 'Stay here', steps: [] });
  if (st.elev < 5) return game.say(null, 'neutral', 'The elevator is dead. Its lamp lights up once you have reached floor 5.');
  return game.run([{ t: 'sfx', name: 'bell' }, { t: 'choice', prompt: 'Elevator: which floor?', options: opts }]);
}
function startDust(game, d) {
  const sys = game.svMine; if (sys.busy) return;
  sys.busy = true; d.cd = 30;
  const f = mineSt().floor;
  game.toast('A dust sprite pounces!', 'i_exclaim');
  game.minigame('sv_dust_shoo', { size: 1 + Math.floor(f / 10), tier: pickTier(game) || 1 }).then((r) => {
    sys.busy = false;
    const won = r && r.data && r.data.shooed;
    if (won) {
      mineSt().gone[`${f}:${d.id}`] = true; mineSt().shooed++;
      game.give('mat_stardust', 1 + (game.rng() < 0.4 ? 1 : 0)); game.addXP('mining', 4); game.stat('dustShooed'); game.addMood(2);
      game.bus.emit('dustShooed', { floor: f });
    } else {
      game.addEnergy(-4); d.cd = 25; d.tx = d.x + (game.rng() - 0.5) * 120; d.ty = d.y + (game.rng() - 0.5) * 80;
      game.toast('The dust sprite tickled you silly. -4 energy', 'i_sweat');
      if (game.energy <= 0) faint(game);
    }
  });
}

// ---------------------------------------------------------------- the world layer
const PROP_SOLID = (p) => !!p.solid;
register('worldLayer', 'sv_mine', {
  solids(world, game) {
    if (world.map.id !== 'hoshi_mine' || !GAME) return [];
    const f = mineSt().floor, fd = floorData(f), out = [];
    for (const r of fd.rocks) if (!broken(f, r)) out.push([r.x * TILE, r.y * TILE, TILE, TILE]);
    for (const p of fd.props) if (PROP_SOLID(p)) out.push([p.x * TILE, p.y * TILE, TILE, TILE]);
    void game; return out;
  },
  below(g, world, game) {
    if (!GAME || world.map.id !== 'hoshi_mine') return;
    const f = mineSt().floor, fd = floorData(f);
    for (const p of fd.props) {
      if (p.kind === 'ladder_up') world.drawSpr('sv_ladder_up', p.x * TILE + 0.5, p.y * TILE - 1);
      if (p.kind === 'ladder_down' && ladderOpen(f)) world.drawSpr('sv_ladder_down', p.x * TILE + 0.5, p.y * TILE + 3);
    }
    if (f > 0 && fd.down && ladderOpen(f)) world.drawSpr('sv_ladder_down', fd.down[0] * TILE + 0.5, fd.down[1] * TILE + 3);
  },
  sprites(world, game) {
    const out = [];
    if (world.map.id === 'cave' && game.state.sv_explore) out.push({ y: 7 * TILE, draw: (g, w) => w.drawSpr('sv_mine_door', 32.5, 93) });
    if (!GAME || world.map.id !== 'hoshi_mine') return out;
    const f = mineSt().floor, fd = floorData(f);
    for (const r of fd.rocks) {
      if (broken(f, r)) continue;
      out.push({ y: (r.y + 1) * TILE, draw: (g, w) => { const sh = fd.shake[rkey(f, r)] || 0; w.drawFeet('sv_rock_' + r.kind, r.x * TILE + 8 + (sh > 0 ? Math.round(Math.sin(sh * 90)) * 0.5 : 0), (r.y + 1) * TILE - 1); } });
    }
    for (const p of fd.props) {
      if (p.kind === 'elevator') out.push({ y: (p.y + 1) * TILE, draw: (g, w) => w.drawFeet('sv_elevator', p.x * TILE + 8, (p.y + 1) * TILE - 1) });
      if (p.kind === 'sign') out.push({ y: (p.y + 1) * TILE, draw: (g, w) => w.drawFeet('sv_mine_sign', p.x * TILE + 8, (p.y + 1) * TILE - 1) });
    }
    for (const d of fd.dustRt) {
      if (mineSt().gone[`${f}:${d.id}`]) continue;
      out.push({ y: d.y, draw: (g, w) => { w.shadow(d.x, d.y + 5, 5); w.drawFeet('sv_dust_' + (Math.floor(d.t * 3) % 2), d.x, d.y + 4 + Math.round(Math.sin(d.t * 3))); } });
    }
    return out;
  },
});
register('worldTick', 'sv_mine', {
  update(dt, world, game) {
    if (!GAME || world.map.id !== 'hoshi_mine') return;
    const st = mineSt(), f = st.floor, fd = floorData(f), p = world.player;
    for (const k of Object.keys(fd.shake)) { fd.shake[k] -= dt; if (fd.shake[k] <= 0) delete fd.shake[k]; }
    for (const d of fd.dustRt) {
      if (st.gone[`${f}:${d.id}`]) continue;
      d.t += dt; d.cd = Math.max(0, d.cd - dt);
      if (Math.hypot(d.tx - d.x, d.ty - d.y) < 3 || hash(Math.floor(d.t), d.id, 5) > 0.97) { d.tx = clamp(d.x + (hash(Math.floor(d.t * 2), d.id, 6) - 0.5) * 110, 24, W * TILE - 24); d.ty = clamp(d.y + (hash(Math.floor(d.t * 2), d.id, 7) - 0.5) * 80, 24, H * TILE - 24); }
      const a = Math.atan2(d.ty - d.y, d.tx - d.x), nx = d.x + Math.cos(a) * 14 * dt, ny = d.y + Math.sin(a) * 14 * dt;
      const tx = Math.floor(nx / TILE), ty = Math.floor(ny / TILE);
      if (fd.rows[ty] && fd.rows[ty][tx] === '.') { d.x = nx; d.y = ny; } else { d.tx = d.x; d.ty = d.y; }
      if (d.cd <= 0 && inWorld(game) && !world.busy && Math.hypot(d.x - p.x, d.y - (p.y - 4)) < 11) startDust(game, d);
    }
    if (game.svMine.reward != null && inWorld(game) && !world.busy) {
      const rf = game.svMine.reward; game.svMine.reward = null;
      const rw = applyReward(game, rf);
      if (rw) game.run([{ t: 'sfx', name: 'star' }, { t: 'say', who: null, text: `${rw.text} (+${rw.coins} coins${rw.stickers ? `, ${rw.stickers} Star Sticker${rw.stickers > 1 ? 's' : ''}` : ''})` }]);
    }
  },
});
register('targetProvider', 'sv_mine', {
  find(world, game) {
    if (!GAME || world.map.id !== 'hoshi_mine' || !game.state.sv_explore) return null;
    const st = mineSt(), f = st.floor, fd = floorData(f), p = world.player, fxp = p.x, fyp = p.y - 3, [ftx, fty] = facingTile(world, 13);
    let best = null, bs = 99;
    const consider = (cx, cy, label, run, bias = 0) => { const d = Math.hypot(cx - fxp, cy - fyp), s = d - bias; if (d < 24 && s < bs) { bs = s; best = { label, dist: Math.max(0, d - 10), x: cx, y: cy, run }; } };
    for (const r of fd.rocks) {
      if (broken(f, r)) continue;
      const tier = pickTier(game), gated = (MIN_TIER[r.kind] || 1) > tier && tier > 0;
      consider(r.x * TILE + 8, r.y * TILE + 8, gated ? `${LABEL[r.kind]} (needs a better pickaxe)` : LABEL[r.kind], (g) => mineSwing(g, r), r.x === ftx && r.y === fty ? 9 : 0);
    }
    for (const q of fd.props) {
      const cx = q.x * TILE + 8, cy = q.y * TILE + 8;
      if (q.kind === 'ladder_up') consider(cx, cy, f === 1 ? 'Climb up to the entrance' : `Climb up to floor ${f - 1}`, (g) => goFloor(g, f - 1, 'down'), 4);
      else if (q.kind === 'ladder_down') consider(cx, cy, 'Climb down to floor 1', (g) => goFloor(g, 1, 'up'), 4);
      else if (q.kind === 'elevator') consider(cx, cy, 'Use the elevator', (g) => elevatorMenu(g));
      else if (q.kind === 'sign') consider(cx, cy, 'Read the sign', (g) => g.say(null, 'neutral', `HOSHI MINE. Deepest floor reached: ${st.best}. The elevator stops at every fifth floor you have reached (now floor ${st.elev || 0}).`));
    }
    if (f > 0 && fd.down && ladderOpen(f)) consider(fd.down[0] * TILE + 8, fd.down[1] * TILE + 8, f >= MAX_FLOOR ? 'The bottom' : `Climb down to floor ${f + 1}`, (g) => goFloor(g, f + 1, 'up'), 4);
    for (const d of fd.dustRt) if (!st.gone[`${f}:${d.id}`]) consider(d.x, d.y, 'Shoo the dust sprite', (g) => startDust(g, d), 2);
    return best;
  },
});
register('hud', 'sv_mine', {
  draw(g, game) {
    if (!GAME || !game.world || game.hideHud || !game.world.map || game.world.map.id !== 'hoshi_mine') return;
    const st = mineSt(), t = st.floor ? `FLOOR ${st.floor}   BEST ${st.best}   PICKAXE ${pickTier(game) ? 'T' + pickTier(game) : 'NONE'}` : `MINE ENTRANCE   BEST ${st.best}`;
    g.fillStyle = '#2b1d2ed0'; g.fillRect(4, 206, t.length * 4 + 8, 12); drawText(g, t, 8, 210, '#fff6c0', 1, null);
  },
});

export function mineSystem(game) {
  game.svMine = { reward: null, busy: false };
  setMineGame(game);
  game.bus.on('dayStart', () => { const st = SV(game).mine; st.floor = 0; st.day = game.day; st.broken = {}; st.ladders = {}; st.gone = {}; FL.clear(); });
  game.bus.on('gameLoaded', () => { game.svMine.busy = false; FL.clear(); setMineGame(game); });
  game.bus.on('newGame', () => { game.svMine.busy = false; FL.clear(); });
  game.mineDepth = () => SV(game).mine.best;
}

features('Exploring', [
  'Hoshi Mine: a wooden door in the west wall of the tide-pool cave leads down into a 30-floor mine',
  'Every floor is generated fresh each day from a seed: connected caverns, rocks, ore veins, gem nodes and geode nodes',
  'The mine entrance room has an elevator panel, a sign with your depth record and the ladder to floor 1',
  'Pickaxe (Kinoko Woodworks, 600 coins): face a rock and press E to swing; each swing costs energy and a minute',
  'Pickaxe tiers 1 to 3 cost 3, 2 and 1 energy a swing and need fewer hits on hard rock',
  'One rock on every floor hides the ladder down; breaking it reveals the ladder and you can climb on',
  'Ore depends on depth: copper and coal early, iron from floor 4, silver from 9, star-gold from 17',
  'Silver veins need the copper pickaxe and star-gold needs the star pickaxe, so tool upgrades open deeper loot',
  'Geode nodes drop geodes: plain geodes early, frozen geodes from floor 10 and star geodes from floor 20',
  'Gem nodes give topaz, aquamarine, ruby, emerald, diamond and star shards depending on depth; crystal clusters give quartz, amethyst and moonstone',
  'Mine drops count towards Collections and can be donated at the library museum corner (gems)',
  'Elevator every 5 floors: reach floor 5, 10, 15... and the elevator panel remembers them all',
  'Mine depth record shown on the sign and the mine HUD (stat mineDepth)',
  'Floor 5, 10, 15, 20, 25 and 30 each give a first-time reward of coins, bars, gems and Star Stickers',
  'Dust sprites drift around from floor 2: touch one and a shooing minigame starts (or avoid them)',
  'Shoo a dust sprite with the broom to get soft fluff; fail and you only lose a little energy',
  'Out of energy in the mine: you faint, wake at the entrance with a little less money and some energy back, never worse',
  'The mine resets every morning: broken rocks return and the floors are laid out differently each day',
  'Ladders work both ways: climb up from any floor to the previous floor\'s ladder, or back to the entrance from floor 1',
  'A mine HUD tag shows your floor, record and pickaxe tier',
  'Mining skill XP for every rock, with higher XP for rarer ore',
  'Miner, Geologist, Blacksmith, Prospector, Excavator and Gemologist professions change swing cost, gem luck, ore yield, geodes and bar prices',
]);
