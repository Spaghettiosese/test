// Hoshi Woods: the secret forest behind the shrine's forest path (36x28). Dense seasonal trees, hardwood stumps, rare forage, a hidden
// fishing pond, woodland creatures (deer, tanuki, owls), fireflies, a ruined shrine with a lantern-order riddle and a one-time reward,
// mist and dappled light. The way in is one wrapped warp on the shrine map (no edit to coast files).
import { register, get, R, features } from '../../core/registry.js';
import { townMap, grid, prop, LEGEND } from '../town/lib.js';
import { TILE } from '../../world/map.js';
import { Critter, tileCenter } from '../mochi/actor.js';
import { hash } from '../../gfx/noise.js';
import { FORAGE } from '../sv_explore/data.js';
import { mapTiles, GRASSY, pickN, fx, centre } from '../sv_explore/util.js';
import { hasProf } from '../sv_explore/prof.js';
import { W2, seeIt, clamp, WOODS_FORAGE } from './data.js';
import './art.js';
import { RUIN_KINDS } from './art.js';

const MW = 36, MH = 28, ORDER = ['moon', 'star', 'wind', 'tide'];
const NAMES = { moon: 'moon', star: 'star', wind: 'wind', tide: 'tide' };
const night = (g) => g.minutes >= 19 * 60 || g.minutes < 5 * 60;

// ---------------------------------------------------------------- layout
const G = grid(MW, MH, 'T');
G.fill(2, 2, 32, 24, '.');
G.fill(0, 22, 10, 2, ':').fill(8, 14, 2, 10, ':').fill(8, 14, 12, 2, ':').fill(8, 10, 2, 5, ':');
G.blob(8, 6, 4, 3, '~');
G.blob(14, 11, 5, 3, ',').blob(26, 20, 5, 4, ',');
G.fill(19, 8, 2, 8, ':').fill(19, 8, 10, 2, ':').fill(24, 3, 10, 8, 'g');
G.fill(19, 15, 2, 7, ':').fill(19, 20, 9, 2, ':');
G.fill(30, 15, 2, 1, ':'); // little offshoot nobody needs
const ROWS = G.rows();
const STUMPS = [[4, 18], [12, 19], [15, 19], [23, 13], [16, 5], [30, 13]];
const STONES = [[21, 6, 'The first stone is carved in worn letters: THE MOON WALKS FIRST, BEFORE THE STARS HAVE WOKEN.'], [22, 11, 'The second stone: THE STARS WAKE NEXT. THE WIND ONLY STIRS ONCE THEY ARE UP.'], [23, 7, 'The third stone, half buried in moss: THE TIDE ARRIVES LAST, CARRIED IN ON THE WIND. FOUR LIGHTS, ONE WAY.']];
const LANTERNS = { moon: [25, 6], star: [27, 7], wind: [31, 7], tide: [33, 6] };
const reserved = new Set();
const reserve = (x, y, w = 1, h = 1) => { for (let j = y - 1; j <= y + h; j++) for (let i = x - 1; i <= x + w; i++) reserved.add(`${i},${j}`); };
STUMPS.forEach(([x, y]) => reserve(x, y)); STONES.forEach(([x, y]) => reserve(x, y)); Object.values(LANTERNS).forEach(([x, y]) => reserve(x, y)); reserve(28, 4, 2, 1); reserve(26, 17, 4, 3); reserve(11, 11, 3, 1); reserve(26, 3); reserve(31, 3);
const near = (x, y, r, f) => { for (let j = y - r; j <= y + r; j++) for (let i = x - r; i <= x + r; i++) if (ROWS[j] && ROWS[j][i] && f(ROWS[j][i])) return true; return false; };
const TREES = ['maple', 'pine', 'pine_b', 'pine_s', 'maple_s', 'oak'];
const trees = [];
for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
  const ch = ROWS[y][x], k = TREES[Math.floor(hash(x, y, 21) * TREES.length)];
  if (ch === 'T') { if (hash(x, y, 5) < 0.85) trees.push(prop(`town_tree_${k}`, x, y, { solid: false })); }
  else if (ch === '.' && !reserved.has(`${x},${y}`) && !near(x, y, 1, (c) => c === ':' || c === '~' || c === 'g' || c === ',') && hash(x, y, 11) < 0.27) trees.push(prop(`town_tree_${k}`, x, y, { shadow: 12 }));
}
const wState = (g) => W2(g).woods;
const lit = (kind) => (g) => wState(g).solved || wState(g).lit.includes(kind);
const say = (text, who = null) => (g) => g.say(who, who ? 'neutral' : null, text);

// ---------------------------------------------------------------- stumps: hardwood
export function chopStump(game, key) {
  const st = wState(game);
  if (st.stumps[key] === game.day) { game.toast('This stump has been cleared for today.'); return false; }
  const axe = !!get('item', 'tool_axe') && game.has('tool_axe');
  if (!game.useEnergy(axe ? 4 : 1)) { game.toast('Too tired right now.'); return false; }
  st.stumps[key] = game.day; st.chopped++; game.advance(axe ? 20 : 10); game.sfx(axe ? 'dig' : 'pop');
  if (axe) { game.give('mat_wood', 2); game.give('mat_hardwood', 1 + (game.rng() < 0.3 ? 1 : 0)); game.toast('Chop chop! Hardwood and wood.', get('item', 'mat_hardwood').icon); }
  else { st.hops++; game.give('mat_wood', 2); if (game.rng() < 0.2 + (game.skillLevel('foraging') * 0.02)) { game.give('mat_hardwood', 1); game.toast('You hopped along the logs and a hardwood branch snapped off!', get('item', 'mat_hardwood').icon); } else game.toast('Hop, hop, hop! You gathered some fallen wood.'); }
  game.stat('woodsChopped'); game.addXP('foraging', 3); game.addMood(1);
  return true;
}

// ---------------------------------------------------------------- forage
function stale(game) { const st = wState(game); if (st.day !== game.day) { st.day = game.day; st.taken = {}; cache.clear(); } return st; }
const cache = new Map();
const rare = (id) => (get('item', id) || {}).rarity || 1;
export function woodsPool(game) {
  const season = game.season, ids = [];
  for (const f of FORAGE) if (f[2].includes(season) && f[3] === 'wood') ids.push('forage_' + f[0]);
  for (const w of WOODS_FORAGE) if (w[2].includes(season) && w[0] !== 'moon_herb' && w[0] !== 'wild_ginseng') ids.push('forage_' + w[0]);
  return ids;
}
export function woodsNodes(game) {
  const st = stale(game), lv = game.skillLevel('foraging'), nightNow = night(game);
  const ck = `${game.state.seed}:${game.day}:${lv}:${nightNow}:${game.weather}:${st.solved}`;
  if (!cache.has(ck)) {
    const rng = game.rngFor('sw_woods'), pool = woodsPool(game), list = [], used = new Set();
    const tiles = mapTiles('hoshi_woods').filter((t) => GRASSY.includes(t.ground));
    const n = 9 + Math.floor(lv / 3) + (['rain', 'storm'].includes(game.weather) ? 2 : 0) + (game.hasBuff && game.hasBuff('night_sight') && nightNow ? 2 : 0);
    for (const t of pickN(rng, tiles, n)) {
      let id;
      if (rng() < 0.04 + (hasProf(game, 'tracker') ? 0.03 : 0)) id = 'forage_wild_ginseng';
      else if (nightNow && rng() < 0.4) id = 'forage_moon_herb';
      else { let r = rng() * pool.reduce((a, p) => a + 1 / Math.pow(rare(p), 1.2), 0); id = pool[pool.length - 1]; for (const p of pool) if ((r -= 1 / Math.pow(rare(p), 1.2)) < 0) { id = p; break; } }
      if (id) { list.push({ x: t.x, y: t.y, id, key: `${t.x},${t.y}` }); used.add(`${t.x},${t.y}`); }
    }
    if (st.solved) for (const t of pickN(rng, mapTiles('hoshi_woods').filter((q) => q.ground === 'gravel'), 2)) list.push({ x: t.x, y: t.y, id: 'forage_ruin_blossom', key: `${t.x},${t.y}` });
    cache.set(ck, list);
  }
  const taken = st.taken.w || [];
  return cache.get(ck).filter((q) => !taken.includes(q.key));
}
export function pickWoods(game, node) {
  const st = stale(game), it = get('item', node.id);
  if (!game.useEnergy(1)) return false;
  const lv = game.skillLevel('foraging');
  const n = 1 + (game.rng() < clamp(lv * 0.03, 0, 0.3) ? 1 : 0);
  (st.taken.w ||= []).push(node.key);
  game.give(node.id, n); game.advance(3); game.sfx('pop');
  game.stat('foraged', n); game.stat('woodsForage', n); st.found += n;
  game.addXP('foraging', 3 + rare(node.id) * 2);
  game.collect('forage', node.id);
  game.bus.emit('foraged', { item: node.id, n });
  if (game.world) { const [x, y] = centre(node.x, node.y); fx(game, x, y, rare(node.id) >= 4 ? 12 : 6); }
  if (rare(node.id) >= 4) game.toast(`A rare find: ${it.name}!`, it.icon);
  return true;
}
register('worldLayer', 'sw_woods', {
  below(g, world, game) {
    if (world.map.id !== 'hoshi_woods' || !game.state.sv2_wild) return;
    const t = game.clock || 0;
    for (const n of woodsNodes(game)) {
      const x = n.x * TILE + 8, y = n.y * TILE + 14;
      world.drawFeet(get('item', n.id).icon, x, y);
      if (Math.floor(t * 3 + n.x * 3 + n.y) % 8 < 1) world.drawFeet('sw_glint', x + 6, y - 10);
    }
  },
});
register('targetProvider', 'sw_woods', {
  find(world, game) {
    if (world.map.id !== 'hoshi_woods' || !game.state.sv2_wild) return null;
    let best = null, bd = 18;
    for (const n of woodsNodes(game)) { const d = Math.hypot(n.x * TILE + 8 - world.player.x, n.y * TILE + 10 - world.player.y); if (d < bd) { bd = d; best = n; } }
    if (!best) return null;
    return { label: `Pick ${get('item', best.id).name.toLowerCase()}`, dist: bd - 6, x: best.x * TILE + 8, y: best.y * TILE + 8, run: (g) => pickWoods(g, best) };
  },
});

// ---------------------------------------------------------------- the ruined shrine puzzle
export function lightLantern(game, kind) {
  const st = wState(game);
  if (st.solved) { game.toast('The lantern burns with a steady blue-gold light.'); return 'done'; }
  if (kind === ORDER[st.lit.length]) {
    st.lit.push(kind); game.sfx('chime'); game.toast(`The ${NAMES[kind]} lantern lights.`, 'i_star');
    if (st.lit.length === ORDER.length) { solveRuins(game); return 'solved'; }
    return 'ok';
  }
  st.lit = []; game.sfx('thud'); game.toast('A cold wind blows through the ruins and every lantern goes dark. Wrong order.', 'i_cloud');
  game.stat('ruinsFails');
  return 'wrong';
}
export function solveRuins(game) {
  const st = wState(game); st.solved = true; game.setFlag('sw_ruins_solved'); game.setFlag('sw_cottage_path');
  game.bus.emit('ruinsSolved', {}); game.stat('ruinsSolved');
  if (game.world) game.world.refreshRects();
}
const REWARD_STEPS = [
  { t: 'sfx', name: 'star' },
  { t: 'say', who: null, text: 'All four lanterns burn at once. The altar stone slides aside with a soft grinding sound.' },
  { t: 'say', who: null, text: 'Inside lies a velvet pouch: 800 coins, a star shard, two ruin blossoms and three Star Stickers. The old shrine keeps its promises.' },
  { t: 'call', fn: (g) => { if (g.flag('sw_ruins_paid')) return; g.setFlag('sw_ruins_paid'); g.addMoney(800, true); g.give('min_star_shard', 1, true); g.collect('mineral', 'min_star_shard'); g.give('forage_ruin_blossom', 2, true); if (g.giveStickers) g.giveStickers(3, 'the ruined shrine'); } },
  { t: 'say', who: null, text: 'Far off to the south-east, little blue-gold lanterns wink on one by one through the trees, tracing a path to somewhere new.' },
];
const altar = {
  spr: 'sw_altar', sprFn: (g) => (wState(g).solved ? 'sw_altar_open' : 'sw_altar'), x: 28, y: 4, w: 2, h: 1, shadow: 24,
  light: { kind: 'shrine', when: (g) => wState(g).solved },
  interact: { label: (g) => (wState(g).solved ? 'Look at the altar' : 'Examine the altar'), run: (g) => {
    const st = wState(g);
    if (st.solved) return g.say(null, null, 'The altar is open and empty now, except for a pale blossom growing in the crack.');
    return g.say(null, null, `A mossy altar with four lantern posts around it. ${st.lit.length ? `${st.lit.length} of 4 lanterns are lit.` : 'Nothing is lit.'} The stones along the path might say how to wake them.`);
  } },
};

// ---------------------------------------------------------------- the map
const objects = [
  ...trees,
  ...STUMPS.map(([x, y]) => ({ spr: 'sw_stump', x, y, shadow: 13, interact: { label: (g) => (g.has('tool_axe') ? 'Chop the stump' : 'Hop on the stump'), run: (g) => chopStump(g, `${x},${y}`) } })),
  prop('sw_log', 11, 11, { w: 2, shadow: 14, solid: true, interact: { label: 'Sit on the log', run: (g) => { g.advance(10); g.addEnergy(3); g.addMood(2); return g.say(null, null, 'You sit on the mossy log. Somewhere a bird repeats the same three notes, patiently.'); } } }),
  ...STONES.map(([x, y, text], i) => ({ spr: 'sw_stone_riddle', x, y, shadow: 11, interact: { label: `Read stone ${i + 1}`, run: (g) => g.say(null, null, text) } })),
  prop('sw_pillar', 26, 3, { shadow: 10 }), prop('sw_pillar', 31, 3, { shadow: 10 }),
  altar,
  ...RUIN_KINDS.map((k) => ({ spr: `sw_rl_${k}_0`, sprFn: (g) => `sw_rl_${k}_${lit(k)(g) ? 1 : 0}`, x: LANTERNS[k][0], y: LANTERNS[k][1], shadow: 10, dx: -4, light: { kind: 'lantern', when: lit(k), y: -24 }, interact: { label: `Light the ${k} lantern`, run: (g) => lightLantern(g, k) } })),
  { spr: 'sw_cottage', x: 26, y: 17, w: 4, h: 3, shadow: 0, when: 'flag:sw_cottage_path', light: { kind: 'window' }, interact: { label: 'Look at the cottage', run: say('A crooked little cottage with a purple roof, shuttered windows and a very welcoming door.') } },
  ...[[18, 17], [21, 17], [18, 20], [21, 22], [23, 19], [24, 21]].map(([x, y]) => ({ spr: 'sw_path_lantern', x, y, solid: false, when: 'flag:sw_cottage_path', light: { kind: 'lantern', y: -18 } })),
];
const m = townMap('hoshi_woods', {
  name: 'Hoshi Woods', music: 'shrine', bg: '#10201a',
  legend: { ...LEGEND, 'T': 'coast_wood' },
  rows: ROWS, objects,
  warps: [
    { x: 0, y: 22, h: 2, to: 'shrine:from_woods' },
    { x: 27, y: 20, w: 2, to: 'witch_cottage:from_woods', when: 'flag:sw_cottage_path', enter: 'up' },
  ],
  spawns: { default: [3, 22, 'right'], from_shrine: [2, 22, 'right'], from_witch_cottage: [28, 21, 'down'] },
  spots: { entrance: [3, 23], pond: [9, 11], clearing: [14, 12], ruins: [28, 6], altar: [28, 5], cottage: [28, 21] },
  onEnter(game) {
    if (!game.state.sv2_wild) return;
    game.stat('woodsVisits');
    if (!game.flag('sw_woods_open')) {
      game.setFlag('sw_woods_open');
      game.run([
        { t: 'wait', dur: 0.4 },
        { t: 'say', who: null, text: 'The forest path squeezes between two old cedars and the shrine bells fall quiet behind you. Ferns brush your knees.' },
        { t: 'say', who: 'kiko', mood: 'neutral', text: '(far behind you, on the steps) The woods are polite to polite visitors, Misa. Greet them. Do not take more than you need.' },
        { t: 'say', who: 'misa', mood: 'surprised', text: 'Wait, how did she know I...? ...Okay. Hello, woods! I am borrowing a little forest. Thank you in advance!' },
        { t: 'say', who: null, text: 'A deer lifts its head across the clearing, chewing slowly, and decides you are fine. Somewhere deeper, water laps against stones.' },
        { t: 'call', fn: (g) => g.toast('Hoshi Woods: forage, stumps, a hidden pond, ruins and creatures. Mist rolls in on rainy mornings.') },
      ]);
    }
  },
});
void m;

// ---------------------------------------------------------------- wrapped warp on the shrine map
// coastMap() defines non-configurable accessors, so swap the registry entry for a descriptor-level copy with an extra warp.
{
  const old = get('map', 'shrine');
  if (old && !old.__sv2) {
    const ds = Object.getOwnPropertyDescriptors(old); for (const d of Object.values(ds)) d.configurable = true;
    const copy = Object.defineProperties({}, ds);
    const wd = Object.getOwnPropertyDescriptor(old, 'warps'), base = wd && wd.get ? wd.get : () => old.warps || [];
    Object.defineProperty(copy, 'warps', { get: () => [...base.call(old), { x: 1, y: 16, to: 'hoshi_woods:from_shrine' }], enumerable: true, configurable: true });
    Object.defineProperty(copy, '__sv2', { value: true, enumerable: false });
    old.spawns.from_woods = [2, 16, 'right'];
    R.map.shrine = copy;
  }
}

// ---------------------------------------------------------------- creatures
const CRITTERS = {
  deer: { name: 'Deer', label: 'Greet the deer', speed: 17, sprite: 'sw_deer', shadow: 11 },
  tanuki: { name: 'Tanuki', label: 'Greet the tanuki', speed: 21, sprite: 'sw_tanuki', shadow: 9 },
  owl: { name: 'Owl', label: 'Greet the owl', speed: 0, sprite: 'sw_owl', shadow: 6 },
};
const PERCH = [[6, 12], [13, 8], [24, 14], [32, 12]];
const FEED_DEER = ['forage_wild_berry', 'forage_fiddlehead', 'forage_star_berry', 'forage_wild_grape', 'forage_bamboo_shoot', 'forage_chestnut'];
const FEED_TANUKI = ['forage_wild_mushroom', 'forage_glow_cap', 'forage_matsutake'];
function talkCritter(game, a) {
  const sp = a.sp, ws = W2(game);
  seeIt(game, 'critter_' + sp);
  const opts = [{ text: sp === 'owl' ? 'Listen' : 'Pet', steps: [{ t: 'call', fn: (g) => {
    g.addMood(2); a.say('heart', 1.8); g.stat('critterPets'); g.sfx(sp === 'owl' ? 'chime' : 'pop');
    g.toast(sp === 'deer' ? 'The deer leans into your hand.' : sp === 'tanuki' ? 'The tanuki wiggles and pretends it is a bush.' : 'Hoo. Hoo-hoo. The owl approves.');
  } }] }];
  const feed = (sp === 'deer' ? FEED_DEER : sp === 'tanuki' ? FEED_TANUKI : ['forage_moon_herb']).find((id) => game.has(id));
  if (feed) opts.push({ text: `Offer ${get('item', feed).name.toLowerCase()}`, steps: [{ t: 'call', fn: (g) => {
    g.take(feed, 1); a.say('i_music', 2); g.sfx('eat'); g.stat('critterFed');
    const k = 'fed_' + sp; ws.seen[k] = (ws.seen[k] || 0) + 1; g.addMood(3);
    if (sp === 'tanuki' && ws.seen.tanukiDay !== g.day) { ws.seen.tanukiDay = g.day; g.give('mat_tanuki_leaf', 1); g.toast('The tanuki leaves a leaf hat on your shoe.', get('item', 'mat_tanuki_leaf').icon); }
    else if (sp === 'owl' && ws.seen.owlDay !== g.day) { ws.seen.owlDay = g.day; g.give('mat_owl_feather', 1); g.toast('The owl drops a feather in your hand.', get('item', 'mat_owl_feather').icon); }
    else if (sp === 'deer' && ws.seen[k] === 5) { g.give('forage_wild_ginseng', 1); g.toast('The deer noses a gnarled root toward you: wild ginseng!', get('item', 'forage_wild_ginseng').icon); }
    else g.toast('It eats happily.');
  } }] });
  opts.push({ text: 'Leave it be', steps: [] });
  return game.run([{ t: 'choice', prompt: CRITTERS[sp].name, options: opts }]);
}
class WoodCreature extends Critter {
  constructor(sp, i, perch) {
    super(`sw_${sp}${i}`, { label: CRITTERS[sp].label, speed: CRITTERS[sp].speed, state: 'idle', t: 1 + Math.random() * 3 });
    this.sp = sp; this.map = 'hoshi_woods'; this.perch = perch; this.i = i;
  }
  update(dt, game, world) {
    this.tickBase(dt, world);
    if (Math.hypot(this.x - world.player.x, this.y - world.player.y) < 56) seeIt(game, 'critter_' + this.sp);
    if (this.sp === 'owl') { if (this.anim % 9 < dt && Math.random() < 0.5) { this.say('i_music', 1.2); game.sfx('chime'); } return; }
    this.t -= dt;
    const near = Math.hypot(this.x - world.player.x, this.y - world.player.y) < 26;
    this.lift = this.state === 'walk' ? Math.abs(Math.sin(this.anim * 7)) * 1.2 : 0;
    if (this.state === 'walk') { if (this.stepPath(dt, near && this.sp === 'deer' ? this.speed * 0.5 : this.speed)) { this.state = 'idle'; this.t = 2 + Math.random() * 5; } return; }
    if (this.t > 0) return;
    const [tx, ty] = [Math.floor(this.x / TILE), Math.floor((this.y - 1) / TILE)];
    for (let k = 0; k < 8; k++) {
      const nx = clamp(tx + Math.floor(Math.random() * 11) - 5, 2, MW - 3), ny = clamp(ty + Math.floor(Math.random() * 9) - 4, 2, MH - 3);
      if ((world.grid[ny] || [])[nx] && this.pathTo(world, nx, ny)) { this.state = 'walk'; return; }
    }
    this.t = 1.5;
  }
  draw(g, world) { this.drawSprite(world, CRITTERS[this.sp].sprite, this.sp === 'owl' ? this.i % 2 === 0 : this.dir < 0, CRITTERS[this.sp].shadow); }
  interact(game) { return talkCritter(game, this); }
}
const pool = {};
function wanted(game) {
  const h = game.minutes / 60, rain = ['rain', 'storm'].includes(game.weather), out = [];
  if (!night(game) && game.weather !== 'storm') out.push(['deer', 0], ['deer', 1]);
  if (rain || h >= 17 || h < 6) out.push(['tanuki', 0]);
  if (night(game)) out.push(['owl', 0], ['owl', 1]);
  return out;
}
register('worldTick', 'sw_critters', {
  update(dt, world, game) {
    if (!game.state.sv2_wild) return;
    const on = world.map.id === 'hoshi_woods';
    if (!on) { world.pets = world.pets.filter((p) => !(p instanceof WoodCreature)); for (const k of Object.keys(pool)) delete pool[k]; return; }
    const want = wanted(game), keys = new Set(want.map(([sp, i]) => sp + i));
    for (const [sp, i] of want) {
      const key = sp + i;
      if (pool[key]) continue;
      let tx, ty;
      if (sp === 'owl') { [tx, ty] = PERCH[(i + game.day) % PERCH.length]; } else { const tiles = mapTiles('hoshi_woods'); const t = tiles[Math.floor(Math.random() * tiles.length)]; tx = t ? t.x : 14; ty = t ? t.y : 12; }
      const a = new WoodCreature(sp, i, sp === 'owl'); const [x, y] = tileCenter(tx, ty); a.x = x; a.y = y; a.game = game;
      pool[key] = a; world.pets.push(a);
    }
    for (const key of Object.keys(pool)) if (!keys.has(key)) { world.pets = world.pets.filter((p) => p !== pool[key]); delete pool[key]; }
  },
});

// ---------------------------------------------------------------- atmosphere: mist, dappled light, fireflies, night-sight glow
register('worldLayer', 'sw_ambience', {
  overlay(g, world, game) {
    if (world.map.id !== 'hoshi_woods' || !game.state.sv2_wild) return;
    const t = game.clock || 0, h = game.minutes / 60, rain = ['rain', 'storm', 'snow'].includes(game.weather);
    const mist = 0.05 + (h < 9 ? 0.07 : 0) + (rain ? 0.06 : 0);
    g.save();
    g.fillStyle = '#dfeee6';
    for (let i = 0; i < 6; i++) {
      const cx = ((i * 97 + t * (6 + i * 1.5)) % 420) - 50, cy = 30 + ((i * 53) % 170), w = 90 + (i % 3) * 30;
      for (let r = -4; r <= 4; r++) { g.globalAlpha = mist * (1 - Math.abs(r) / 5); g.fillRect(Math.round(cx - w * Math.sqrt(1 - (r * r) / 25)), cy + r * 3, Math.round(w * 2 * Math.sqrt(1 - (r * r) / 25)), 3); }
    }
    if (h >= 7 && h < 17 && !rain) {
      g.fillStyle = '#fff3b8';
      for (let i = 0; i < 12; i++) {
        const x = Math.floor(hash(i, 3, 9) * 330 + Math.sin(t * 0.3 + i) * 8) % 320, y = Math.floor(hash(i, 8, 2) * 210 + Math.cos(t * 0.25 + i) * 6) % 220, s = 10 + Math.floor(hash(i, 1, 4) * 14);
        g.globalAlpha = 0.045 + 0.02 * Math.sin(t * 0.8 + i); g.fillRect(x, y, s, s - 3); g.fillRect(x + 3, y - 3, s - 6, 3);
      }
    }
    if (game.season === 'summer' && (night(game) || h < 5.5)) {
      for (let i = 0; i < 26; i++) {
        const x = (hash(i, 1, 12) * 330 + Math.sin(t * 0.7 + i * 2) * 14 + 330) % 320, y = (hash(i, 2, 12) * 200 + Math.cos(t * 0.6 + i) * 10 + 20) % 210 + 6;
        const a = Math.max(0, Math.sin(t * 1.7 + i * 1.3)); g.globalAlpha = 0.25 + a * 0.75; g.fillStyle = '#d6ff7a'; g.fillRect(Math.round(x), Math.round(y), 2, 2); g.globalAlpha = 0.18 * a; g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 4, 4);
      }
      if (world.fireflyT === undefined) world.fireflyT = 0;
      world.fireflyT += 1 / 60; if (world.fireflyT > 4) seeIt(game, 'critter_firefly');
    }
    if (game.hasBuff && game.hasBuff('night_sight') && night(game)) { g.globalAlpha = 0.11; g.fillStyle = '#ffe9a8'; g.fillRect(0, 0, 320, 224); }
    g.restore();
  },
});

features('Wild Places', [
  'Hoshi Woods: a 36x28 secret forest reached by the shrine\'s forest path (west edge of the shrine, down the dirt trail), with a short first-visit scene',
  'Dense woods with seasonal trees that turn with the year, a mossy log to sit on and winding dirt paths between clearings',
  'Hardwood stumps: hop along the logs for wood and the odd hardwood branch (or chop them if you own an axe); each stump is good once a day',
  'Woodland forage: spring fiddleheads, summer star berries, autumn glow caps and winter frost ferns appear in new spots every morning',
  'Moon herb only opens at night, wild ginseng turns up rarely, and ruin blossoms sprout between the old shrine stones after the puzzle',
  'A hidden pond deep in the woods with its own rare fish: moss carp, amber loach, night-time lantern trout and the rainy-day spirit koi',
  'Friendly deer wander the clearings by day: pet them, feed them berries, and a fifth treat earns you a gift',
  'A shy tanuki comes out on rainy days and at dusk and trades a leaf hat for a mushroom',
  'Owls roost in the trees at night and hand over a feather when you share a moon herb',
  'Summer nights fill the woods with drifting fireflies',
  'Mist drifts through the trees, thicker in the morning and in the rain',
  'Dappled sunlight patches slide across the forest floor on bright days',
  'Rain adds two extra forage nodes to the woods each morning',
  'Sit on the mossy log to rest: a little energy and mood come back',
  'Every woods pick gives Foraging XP scaled by rarity and counts towards guild bounties and the Field Guide',
  'A ruined shrine with four lantern posts and three riddle stones: light moon, star, wind and tide in the right order',
  'Solving the ruin riddle opens the altar once for a pouch of coins, a star shard, ruin blossoms and Star Stickers, and lights a lantern path to the Moon Witch',
]);
