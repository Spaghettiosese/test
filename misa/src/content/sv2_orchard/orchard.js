// Fruit trees, wild trees, tappers, chopping, mushroom logs, crab pots and fish ponds: state logic, overnight growth,
// the world layer that draws and collides with them, and the "use" target that lets Misa interact.
import { register, get } from '../../core/registry.js';
import { TILE, buildMap, passGrid } from '../../world/map.js';
import { seasonOf } from '../../core/time.js';
import { facingTile, isWater, sparkle } from '../hobbies/common.js';
import { inPlot } from '../hobbies/world.js';
import { FISH } from '../hobbies/data.js';
import { PEN } from '../sv_farm/maps.js';
import { addStar, nm, STAR } from '../sv_farm/core.js';
import { SV2, FRUIT, WILD, TREE_MAPS, GROW_DAYS, YEAR_DAYS } from './data.js';

const FISHMAP = Object.fromEntries(FISH.map((f) => [`fish_${f[0]}`, { key: f[0], name: f[1], rarity: f[9], price: f[11] }]));
const INKERS = ['fish_squid', 'fish_octopus'];
export const POND_CAP = 10, POND_GATES = [3, 6, 9];
const REQS = [['ing_kelp', 'ing_nori'], ['ing_shrimp', 'ing_fish_flakes'], ['mat_bait_premium', 'shell_coral']];
const POTS = {
  harbour: [['fish_crab', 30], ['fish_shrimp', 30], ['fish_mussel', 20], ['fish_clam', 10], ['fish_lobster', 5]],
  beach: [['fish_clam', 30], ['fish_mussel', 24], ['fish_shrimp', 20], ['fish_crab', 16], ['fish_lobster', 9]],
};
const TRASH = ['fish_sea_slug', 'fish_raw', 'shell_glass_green'];
export const POT_MAPS = Object.keys(POTS);
const SHAKE = new Map();
const say = (g, text) => g.run([{ t: 'say', who: 'misa', mood: 'neutral', text }]);
const has = (id) => !!get('item', id);
export const wrapMap = (id, key, fn) => {
  const def = get('map', id); if (!def) return;
  const d = Object.getOwnPropertyDescriptor(def, key), base = d && d.get ? () => d.get.call(def) : () => (d && d.value) || [];
  Object.defineProperty(def, key, { get: () => fn(base()), enumerable: true, configurable: true });
};

// ---------------------------------------------------------------- tree facts
export const ageOf = (g, t) => g.day - t.born;
export function stageOf(g, t) {
  const a = ageOf(g, t);
  if (t.kind === 'stump') return 5;
  return FRUIT[t.kind] ? (a < 7 ? 1 : a < 14 ? 2 : a < 21 ? 3 : a < GROW_DAYS ? 4 : 5) : (a < 4 ? 1 : a < 9 ? 2 : a < 15 ? 3 : a < 21 ? 4 : 5);
}
export const bearingIn = (g, k, season) => !!FRUIT[k] && (FRUIT[k].seasons.includes(season) || (k === 'orange' && !!g.flag('upg_greenhouse')));
export const quality = (g, t) => Math.min(3, Math.floor(ageOf(g, t) / YEAR_DAYS));
export const treeName = (t) => (t.kind === 'stump' ? 'Tree stump' : FRUIT[t.kind] ? `${FRUIT[t.kind].name} tree` : `${WILD[t.kind].name} tree`);
export function daysToFruit(g, t) {
  if (!FRUIT[t.kind]) return null;
  if (stageOf(g, t) < 5) return GROW_DAYS - ageOf(g, t);
  if (t.fruit > 0) return 0;
  for (let d = 1; d <= 120; d++) if (bearingIn(g, t.kind, seasonOf(g.day + d)) && g.day + d - t.born >= GROW_DAYS) return d;
  return null;
}
export function toolTier(g) { return g.has('tool_axe_3') ? 3 : g.has('tool_axe_2') ? 2 : g.has('tool_axe') ? 1 : 0; }
export const hitsNeeded = (g, t) => {
  const s = stageOf(g, t), base = t.kind === 'stump' ? 3 : t.static ? 6 : s <= 2 ? 1 : s === 3 ? 3 : 5;
  return Math.max(1, Math.ceil(base * [1, 1, 0.7, 0.5][toolTier(g)]));
};

// ---------------------------------------------------------------- map helpers
export function ensureStatic(g) {
  const S = SV2(g); if (!S) return;
  for (const id of TREE_MAPS) {
    const m = get('map', id); if (!m) continue;
    for (const o of m.objects) {
      if (!o.tree || !WILD[o.tree]) continue;
      const key = `${id}:${o.x},${o.y}`;
      if (S.cut[key] || S.trees.some((t) => t.key === key)) continue;
      S.trees.push({ id: 't' + S.nextT++, kind: o.tree, map: id, x: o.x, y: o.y, born: g.day - 200, fruit: 0, hits: 0, static: true, key });
    }
  }
}
const mapInfo = (g, id) => (g.world && g.world.map.id === id ? { m: g.world.map, grid: g.world.grid } : (() => { const m = buildMap(id); return { m, grid: passGrid(m, g) }; })());
export function occupied(g, id, x, y) {
  const S = SV2(g);
  return S.trees.some((t) => t.map === id && t.x === x && t.y === y) || S.things.some((h) => h.map === id && x >= h.x && x < h.x + (h.w || 1) && y >= h.y && y < h.y + (h.h || 1))
    || ((g.state.sv_farm && g.state.sv_farm.machines) || []).some((mc) => mc.map === id && mc.x === x && mc.y === y);
}
const SOFT = ['grass', 'meadow', 'lawn', 'dirt'];
export function tileBlock(g, info, id, x, y) {
  const { m, grid } = info;
  if (x < 1 || y < 1 || x >= m.w - 1 || y >= m.h - 1 || !grid[y] || !grid[y][x]) return 'There is no room there';
  const t = m.tiles[y][x];
  if (!t || !SOFT.includes(t.ground)) return 'Roots need soft ground';
  if (inPlot(m, x, y)) return 'Not on the garden soil';
  if (id === 'backyard' && x >= PEN.x0 && x <= PEN.x1 && y >= PEN.y0 && y <= PEN.y1) return 'Keep the animal pen clear';
  if ((m.warps || []).some((w) => Math.abs(w.x - x) <= 1 && Math.abs(w.y - y) <= 1)) return 'That would block a doorway';
  if (occupied(g, id, x, y)) return 'Something is already there';
  return null;
}
export function plantBlock(g, info, id, x, y, wild) {
  const why = tileBlock(g, info, id, x, y); if (why) return why;
  const { m } = info;
  if (wild) {
    for (const s of Object.values(m.spawns || {})) if (Math.hypot(s[0] - x, s[1] - y) < 3) return 'too close to a path';
    if ((m.warps || []).some((w) => Math.hypot(w.x - x, w.y - y) < 3)) return 'too close to a door';
    return null;
  }
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (!dx && !dy) continue;
    if (occupied(g, id, x + dx, y + dy) || (m.objects || []).some((o) => o.tree && o.x === x + dx && o.y === y + dy)) return 'Fruit trees need open space on all 8 sides';
  }
  return null;
}
const block = (g, info, x, y) => { if (info.grid[y]) info.grid[y][x] = false; };
const refresh = (g) => { if (g.world && g.world.refreshRects) g.world.refreshRects(); };

export function plantTree(g, id, x, y, kind, info) {
  ensureStatic(g); info ||= mapInfo(g, id);
  const why = plantBlock(g, info, id, x, y, false); if (why) return why;
  const S = SV2(g);
  S.trees.push({ id: 't' + S.nextT++, kind, map: id, x, y, born: g.day, fruit: 0, hits: 0 });
  block(g, info, x, y); refresh(g); g.stat('svPlanted'); g.bus.emit('treePlanted', { kind });
  return null;
}

// ---------------------------------------------------------------- fruit, taps, chopping
export function harvestTree(g, t) {
  const f = FRUIT[t.kind]; if (!f || !(t.fruit > 0)) return 0;
  const n = t.fruit, q0 = quality(g, t); let best = 0;
  g.give(f.item, n);
  for (let i = 0; i < n; i++) { let q = q0; if (q > 0 && g.rng() < 0.25) q--; if (q) { addStar(g, f.item, q, 1); best = Math.max(best, q); } }
  t.fruit = 0;
  if (get('skill', 'foraging')) g.addXP('foraging', 1 + n); else g.addXP('gardening', 1 + n);
  g.stat('svTreeFruit', n); g.bus.emit('treeHarvested', { kind: t.kind, item: f.item, n, q: best }); g.bus.emit('foraged', { item: f.item, n });
  return n;
}
export function canTap(g, t) { return !!WILD[t.kind] && !t.tap && stageOf(g, t) >= 5; }
export function attachTap(g, t) {
  if (!canTap(g, t) || !g.has('mach_tapper')) return false;
  g.take('mach_tapper', 1); t.tap = { out: WILD[t.kind].tap, left: WILD[t.kind].days, ready: false, n: 1 }; g.stat('svTapsPlaced'); return true;
}
export function collectTap(g, t) {
  const tp = t.tap; if (!tp || !tp.ready) return 0;
  g.give(tp.out, tp.n); const out = tp.out, n = tp.n;
  tp.ready = false; tp.left = WILD[t.kind].days; tp.n = 1;
  g.addXP(get('skill', 'foraging') ? 'foraging' : 'crafting', 3); g.stat('svTapped', n); g.bus.emit('tapCollected', { item: out, n });
  return n;
}
export function dropsOf(g, t) {
  const s = stageOf(g, t);
  if (t.kind === 'stump') return { mat_wood: 2, mat_hardwood: 1 };
  if (s <= 2) return { mat_wood: 1 };
  if (s === 3) return { mat_wood: 3 };
  return { mat_wood: 6 + (g.rng() < 0.5 ? 2 : 0), mat_hardwood: 1 + (g.rng() < 0.4 ? 1 : 0) };
}
// Fells a tree (or digs out a stump). Returns false if it can't (no axe, too tired).
export function chopTree(g, t, quiet) {
  const S = SV2(g), s = stageOf(g, t);
  if ((s >= 3 || t.static) && !toolTier(g)) { if (!quiet) g.toast('You need an axe. Kinoko Woodworks sells them.', 'i_exclaim'); return false; }
  const need = hitsNeeded(g, t);
  if (!quiet && !g.useEnergy(need * 2)) { g.toast('Too tired to swing the axe', 'i_zzz'); return false; }
  if (!quiet) g.advance(need * 4);
  const drops = dropsOf(g, t);
  for (const [id, n] of Object.entries(drops)) if (has(id)) g.give(id, n, true);
  if (t.tap) g.give('mach_tapper', 1, true);
  S.trees = S.trees.filter((x) => x !== t);
  const info = g.world && g.world.map.id === t.map ? { m: g.world.map, grid: g.world.grid } : null;
  if (t.kind !== 'stump' && (s >= 3 || t.static)) {
    if (t.static) S.cut[t.key] = true;
    S.trees.push({ id: 't' + S.nextT++, kind: 'stump', map: t.map, x: t.x, y: t.y, born: g.day, fruit: 0, hits: 0 });
  } else if (info && info.grid[t.y]) info.grid[t.y][t.x] = true;
  refresh(g);
  g.addXP(get('skill', 'foraging') ? 'foraging' : 'crafting', 1 + Math.min(4, s));
  g.stat('svChopped'); g.bus.emit('treeChopped', { kind: t.kind, stage: s });
  if (!quiet) g.toast(`Timber! ${Object.entries(drops).map(([id, n]) => `${n} ${nm(id).toLowerCase()}`).join(', ')}`, 'i_leaf');
  return true;
}

// ---------------------------------------------------------------- placeable things (log, pot, pond)
export function addThing(g, kind, id, x, y, extra = {}) {
  const S = SV2(g), h = { id: 'h' + S.nextH++, kind, map: id, x, y, ...extra };
  if (kind === 'pond') Object.assign(h, { w: 2, h: 2, fish: null, pop: 0, out: [], req: null, reqDone: {}, made: 0 });
  if (kind === 'log') Object.assign(h, { born: g.day, stock: 0 });
  if (kind === 'pot') Object.assign(h, { bait: false, out: null });
  S.things.push(h); return h;
}
export function placeThing(g, kind) {
  const world = g.world; ensureStatic(g);
  if (!world) return false;
  const id = world.map.id, [tx, ty] = facingTile(world, 14), info = { m: world.map, grid: world.grid }, S = SV2(g);
  const fail = (t) => { g.toast(t); return false; };
  if (kind === 'tapper') {
    const t = S.trees.find((x) => x.map === id && WILD[x.kind] && Math.abs(x.x - tx) <= 1 && Math.abs(x.y - ty) <= 1);
    if (!t) return fail('Face a mature oak, maple or pine');
    if (t.tap) return fail('That tree is already tapped');
    if (!canTap(g, t)) return fail('Too young to tap');
    if (!attachTap(g, t)) return fail('No tapper');
    g.sfx('pop'); g.toast(`Tapper on the ${treeName(t).toLowerCase()}: ${nm(t.tap.out).toLowerCase()} in ${t.tap.left} days`, get('item', t.tap.out).icon); return true;
  }
  if (kind === 'crab_pot') {
    if (!POT_MAPS.includes(id)) return fail('Set crab pots at the harbour or the beach');
    if (!isWater(world.map.tiles[ty] && world.map.tiles[ty][tx])) return fail('Face open water to drop a pot');
    if (SV2(g).things.some((h) => h.map === id && h.x === tx && h.y === ty)) return fail('There is already a pot there');
    addThing(g, 'pot', id, tx, ty); g.sfx('pop'); g.toast('Crab pot set. Check it tomorrow.', get('item', 'mach_crab_pot').icon); g.stat('svPotsSet'); return true;
  }
  if (!TREE_MAPS.includes(id)) return fail('Place that in the front or back yard');
  if (kind === 'mushroom_log') {
    const why = tileBlock(g, info, id, tx, ty); if (why) return fail(why);
    addThing(g, 'log', id, tx, ty); block(g, info, tx, ty); refresh(g); g.sfx('pop'); g.toast('Mushroom log placed', get('item', 'mach_mushroom_log').icon); return true;
  }
  if (kind === 'fish_pond') {
    if (id !== 'backyard') return fail('Fish ponds go in the back yard');
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const why = tileBlock(g, info, id, tx + dx, ty + dy); if (why) return fail(`A pond needs a clear 2x2 patch (${why.toLowerCase()})`); }
    addThing(g, 'pond', id, tx, ty); for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) block(g, info, tx + dx, ty + dy);
    refresh(g); g.sfx('pour'); g.toast('Fish pond dug! Stock it with fish you caught.', get('item', 'mach_fish_pond').icon); return true;
  }
  return false;
}
function pickUp(g, h) {
  const S = SV2(g); S.things = S.things.filter((x) => x !== h);
  g.give(`mach_${h.kind === 'pot' ? 'crab_pot' : h.kind === 'log' ? 'mushroom_log' : 'fish_pond'}`, 1, true);
  if (g.world && g.world.map.id === h.map) { for (let dy = 0; dy < (h.h || 1); dy++) for (let dx = 0; dx < (h.w || 1); dx++) if (h.kind !== 'pot' && g.world.grid[h.y + dy]) g.world.grid[h.y + dy][h.x + dx] = true; refresh(g); }
  g.sfx('pop');
}

// ---------------------------------------------------------------- logs, pots, ponds
export function collectLog(g, h) {
  if (!(h.stock > 0)) return 0;
  const n = h.stock, age = g.day - h.born, q = age >= 56 ? 2 : age >= 28 ? 1 : 0;
  let id = g.season === 'autumn' ? (g.rng() < 0.3 ? 'ing_maitake' : 'ing_shiitake') : g.season === 'winter' ? 'ing_mushroom' : 'ing_shiitake';
  if (!has(id)) id = 'ing_mushroom';
  g.give(id, n); if (q) addStar(g, id, q, n);
  h.stock = 0; g.addXP(get('skill', 'foraging') ? 'foraging' : 'gardening', 2); g.stat('svMushrooms', n); g.bus.emit('foraged', { item: id, n });
  g.toast(`${n} ${nm(id).toLowerCase()}${q ? ` (${STAR[q].toLowerCase()})` : ''} from the log`, get('item', id).icon);
  return n;
}
export function potRoll(g, h) {
  const r = g.rngFor('sv2pot' + h.id), table = POTS[h.map] || POTS.harbour, bait = h.bait;
  h.bait = false;
  if (g.weather === 'storm') return null;
  if (!bait && r() < 0.3) return TRASH[Math.floor(r() * TRASH.length)];
  const w = table.map(([id, k]) => [id, id === 'fish_lobster' && bait ? k * 3 : k]);
  let x = r() * w.reduce((a, [, k]) => a + k, 0);
  for (const [id, k] of w) { x -= k; if (x <= 0) return id; }
  return w[0][0];
}
export function collectPot(g, h) {
  if (!h.out) return false;
  const id = h.out; h.out = null; g.give(id, 1);
  const junk = TRASH.includes(id);
  if (!junk && g.hasProf && (g.hasProf('trapper') || g.hasProf('mariner')) && g.rng() < 0.25) { g.give(id, 1, true); g.toast('Trapper bonus: one more!', 'i_star'); }
  g.addXP('fishing', junk ? 1 : 3); g.stat('svPotCatch', junk ? 0 : 1); g.bus.emit('potCollected', { item: id, junk });
  g.toast(`${nm(id)} from the crab pot`, get('item', id).icon);
  return true;
}
export const pondLimit = (h) => Math.min(POND_CAP, 3 + 3 * Object.keys(h.reqDone).length);
export function stockPond(g, h, fishId) {
  if (!FISHMAP[fishId] || !g.has(fishId)) return false;
  if (h.fish && h.fish !== fishId) { g.toast('A pond holds only one kind of fish'); return false; }
  if (h.pop >= pondLimit(h)) { g.toast(h.req ? 'The fish are waiting for something first' : 'The pond is full'); return false; }
  g.take(fishId, 1); h.fish = fishId; h.pop++; g.stat('svPondStocked'); g.bus.emit('pondStocked', { item: fishId }); return true;
}
export function giveRequest(g, h) {
  if (!h.req || !g.has(h.req.item)) return false;
  g.take(h.req.item, 1); h.reqDone[h.req.gate] = true; h.req = null; g.stat('svPondRequests'); g.bus.emit('pondRequestDone', {});
  return true;
}
export function pondTick(g, h) {
  if (!h.fish || !h.pop) return;
  const r = g.rngFor('sv2pond' + h.id), F = FISHMAP[h.fish], lim = pondLimit(h);
  if (h.pop >= lim && lim < POND_CAP && !h.req) { const o = REQS[Object.keys(h.reqDone).length] || REQS[2]; h.req = { item: o[Math.floor(r() * o.length)], gate: lim }; }
  else if (h.pop < lim && r() < 0.3 + 0.03 * g.skillLevel('fishing')) h.pop++;
  if (h.out.length >= 6) return;
  if (r() < Math.min(0.9, 0.12 + 0.09 * h.pop)) { h.out.push(`art_roe_${F.key}`); if (h.pop >= 7 && r() < 0.3) h.out.push(`art_roe_${F.key}`); h.made++; }
  if (INKERS.includes(h.fish) && has('mat_ink') && r() < 0.4) h.out.push('mat_ink');
  if (F.rarity >= 4 && h.pop >= 3 && has('shell_pearl') && r() < 0.14) h.out.push('shell_pearl');
}
export function collectPond(g, h) {
  if (!h.out.length) return 0;
  const n = h.out.length; for (const id of h.out) if (has(id)) g.give(id, 1, true);
  h.out = []; g.addXP('fishing', 2 + n); g.stat('svPondHarvest', n); g.bus.emit('pondHarvested', { n });
  return n;
}

// ---------------------------------------------------------------- overnight
function spread(g) {
  if (!['spring', 'summer'].includes(g.season)) return 0;
  const S = SV2(g), r = g.rngFor('sv2spread'); let added = 0;
  const id = 'backyard', pool = () => S.trees.filter((t) => t.map === id && WILD[t.kind]);
  if (pool().length >= 14) return 0;
  const info = mapInfo(g, id);
  for (const t of pool().filter((x) => stageOf(g, x) >= 5)) {
    if (r() > 0.1 || pool().length >= 14) continue;
    const x = t.x + Math.round((r() - 0.5) * 6), y = t.y + Math.round((r() - 0.5) * 6);
    if (plantBlock(g, info, id, x, y, true)) continue;
    S.trees.push({ id: 't' + S.nextT++, kind: t.kind, map: id, x, y, born: g.day, fruit: 0, hits: 0 }); block(g, info, x, y); added++;
  }
  return added;
}
export function overnight(g) {
  const S = SV2(g); if (!S) return {};
  ensureStatic(g);
  const out = { fruit: 0, taps: 0, logs: 0, pots: 0, ponds: 0, grown: 0, seeds: 0 };
  for (const t of S.trees) {
    if (FRUIT[t.kind]) {
      const was = t.fruit || 0;
      if (stageOf(g, t) >= 5) { if (bearingIn(g, t.kind, g.season)) t.fruit = Math.min(3, was + 1); else t.fruit = 0; }
      if (t.fruit > was) out.fruit++;
      if (ageOf(g, t) === GROW_DAYS) out.grown++;
    }
    if (t.tap && !t.tap.ready && --t.tap.left <= 0) { t.tap.left = 0; t.tap.ready = true; t.tap.n = t.kind === 'maple' && g.season === 'spring' ? 2 : 1; out.taps++; }
  }
  for (const h of S.things) {
    if (h.kind === 'log') { const p = g.season === 'winter' ? 0.1 : g.season === 'summer' ? 0.3 : 0.55; if (h.stock < 4 && g.rngFor('sv2log' + h.id)() < p) { h.stock++; out.logs++; } }
    else if (h.kind === 'pot' && !h.out) { const id = potRoll(g, h); if (id) { h.out = id; out.pots++; } }
    else if (h.kind === 'pond') { const n = h.out.length; pondTick(g, h); if (h.out.length > n) out.ponds++; }
  }
  out.seeds = spread(g); refresh(g);
  return out;
}

// ---------------------------------------------------------------- interaction
const menu = (g, prompt, opts) => g.run([{ t: 'choice', prompt, options: [...opts.map(([text, fn]) => ({ text, steps: [{ t: 'call', fn: (gg) => fn(gg) }] })), { text: 'Leave it', steps: [] }] }]);
const shake = (g, t, world) => { SHAKE.set(t.id, g.clock + 0.8); if (world) sparkle(world, t.x * TILE + 8, t.y * TILE - 6, 8, '#9fd37a'); g.sfx('flutter'); };
function treeStatus(g, t) {
  const s = stageOf(g, t);
  if (t.kind === 'stump') return 'An old stump. An axe will clear it.';
  if (FRUIT[t.kind]) {
    if (s < 5) return `${treeName(t)}: ${GROW_DAYS - ageOf(g, t)} days until it matures.`;
    const d = daysToFruit(g, t), q = quality(g, t);
    return `${treeName(t)}, ${Math.floor(ageOf(g, t) / YEAR_DAYS)} years old${q ? ` (${STAR[q].toLowerCase()} fruit)` : ''}. ${t.fruit ? `${t.fruit} ripe.` : d ? `Fruit in ${d} day${d > 1 ? 's' : ''}.` : 'Resting.'}`;
  }
  return `${treeName(t)}${s < 5 ? `, still growing (${Math.max(1, 21 - ageOf(g, t))} days)` : t.tap ? `, tapped: ${t.tap.ready ? 'ready' : `${t.tap.left} days`}` : '. A tapper would fit.'}`;
}
export function labelOf(g, e) {
  if (e.kind === 'log') return e.stock ? 'Collect mushrooms' : 'Mushroom log';
  if (e.kind === 'pot') return e.out ? 'Haul up the crab pot' : 'Crab pot';
  if (e.kind === 'pond') return e.out.length ? 'Collect from the pond' : 'Fish pond';
  if (FRUIT[e.kind] && e.fruit > 0) return `Shake the ${FRUIT[e.kind].name.toLowerCase()} tree`;
  if (e.tap && e.tap.ready) return `Collect ${nm(e.tap.out).toLowerCase()}`;
  return treeName(e);
}
function treeUse(g, t, world) {
  if (FRUIT[t.kind] && t.fruit > 0) { shake(g, t, world); const n = harvestTree(g, t); g.sfx('chime'); g.toast(`${n} ${nm(FRUIT[t.kind].item).toLowerCase()}${n > 1 ? 's' : ''} fell into your basket`, get('item', FRUIT[t.kind].item).icon); return; }
  if (t.tap && t.tap.ready) { const it = get('item', t.tap.out); const n = collectTap(g, t); g.sfx('chime'); g.toast(`${n} ${it.name.toLowerCase()}`, it.icon); return; }
  const s = stageOf(g, t), opts = [['Look closely', (gg) => gg.toast(treeStatus(gg, t), 'i_leaf')]];
  if (WILD[t.kind] && canTap(g, t) && g.has('mach_tapper')) opts.push(['Attach a tapper', (gg) => { if (attachTap(gg, t)) { gg.sfx('pop'); gg.toast(`${nm(t.tap.out)} in ${t.tap.left} days`, get('item', t.tap.out).icon); } }]);
  if (t.tap) opts.push(['Take the tapper off', (gg) => { t.tap = null; gg.give('mach_tapper', 1, true); gg.sfx('pop'); }]);
  const act = t.kind === 'stump' ? 'Dig out the stump' : s <= 2 && !t.static ? 'Pull it up' : 'Chop it down';
  opts.push([`${act} (${hitsNeeded(g, t) * 2} energy)`, (gg) => { if (chopTree(gg, t)) shake(gg, t, world); }]);
  menu(g, treeName(t), opts);
}
function logUse(g, h) {
  if (h.stock) { collectLog(g, h); g.sfx('chime'); return; }
  menu(g, 'Mushroom log', [['How is it going?', (gg) => gg.toast(`Day ${gg.day - h.born} of the log. ${gg.season === 'winter' ? 'Mushrooms rest in winter.' : 'Spring and autumn are best.'}`, 'i_leaf')], ['Pick it up', (gg) => pickUp(gg, h)]]);
}
function potUse(g, h) {
  if (h.out) { collectPot(g, h); g.sfx('chime'); return; }
  const opts = [];
  const baits = Object.keys(g.state.inv).filter((i) => i.startsWith('mat_bait_') && get('item', i));
  if (!h.bait && baits.length) opts.push([`Add bait (${nm(baits[0]).toLowerCase()})`, (gg) => { gg.take(baits[0], 1); h.bait = true; gg.toast('Baited: no junk, better lobster odds', 'i_star'); gg.sfx('pop'); }]);
  opts.push(['Check it', (gg) => gg.toast(h.bait ? 'Baited. Check back tomorrow.' : 'Empty. Bait it for better luck.', 'i_leaf')], ['Pull the pot out', (gg) => pickUp(gg, h)]);
  menu(g, 'Crab pot', opts);
}
function pondUse(g, h) {
  if (h.out.length) { const n = collectPond(g, h); g.sfx('chime'); g.toast(`${n} item${n > 1 ? 's' : ''} from the pond`, get('item', h.out[0] || 'art_roe_carp') ? 'i_star' : 'i_star'); return; }
  const opts = [];
  const fishes = Object.keys(g.state.inv).filter((i) => FISHMAP[i] && (!h.fish || h.fish === i)).sort((a, b) => g.count(b) - g.count(a)).slice(0, 3);
  for (const f of fishes) opts.push([`Add ${nm(f).toLowerCase()} (${g.count(f)})`, (gg) => { if (stockPond(gg, h, f)) { gg.sfx('splash'); gg.toast(`${h.pop} ${nm(f).toLowerCase()} in the pond`, get('item', f).icon); } }]);
  if (h.req && g.has(h.req.item)) opts.unshift([`Give ${nm(h.req.item).toLowerCase()}`, (gg) => { if (giveRequest(gg, h)) { gg.sfx('chime'); gg.toast('The fish are delighted and may grow more', 'i_heart'); } }]);
  opts.push(['Look at the pond', (gg) => gg.toast(pondStatus(h), 'i_leaf')]);
  if (h.pop > 0) opts.push(['Net one fish', (gg) => { h.pop--; gg.give(h.fish, 1); if (!h.pop) h.fish = null; gg.sfx('pop'); }]);
  else opts.push(['Fill the pond in', (gg) => pickUp(gg, h)]);
  menu(g, 'Fish pond', opts.slice(0, 6));
}
export function pondStatus(h) {
  if (!h.fish) return 'Empty. Add a fish you caught.';
  const wants = h.req ? ` The fish want ${nm(h.req.item).toLowerCase().replace(/^(a |an )/, '')}.` : '';
  return `${h.pop} ${FISHMAP[h.fish].name.toLowerCase()} (of ${pondLimit(h)} for now).${wants}`;
}

function entitiesOn(g, id) { const S = SV2(g); return [...S.trees.filter((t) => t.map === id), ...S.things.filter((h) => h.map === id)]; }
register('targetProvider', 'sv2_orchard', {
  find(world, game) {
    const S = game.state.sv2_orchard; if (!S || !TREE_MAPS.concat(POT_MAPS).includes(world.map.id)) return null;
    const p = world.player; let best = null, bd = 30;
    for (const e of entitiesOn(game, world.map.id)) {
      const cx = e.x * TILE + (e.w || 1) * 8, cy = e.y * TILE + (e.h || 1) * 8, d = Math.hypot(p.x - cx, p.y - 4 - cy) - (e.kind === 'pond' ? 10 : 0);
      if (d < bd) { bd = d; best = { e, cx, cy }; }
    }
    if (!best) return null;
    const e = best.e;
    return { label: labelOf(game, e), dist: Math.max(0, bd - 14), x: best.cx, y: best.cy, run: (g) => (e.kind === 'log' ? logUse(g, e) : e.kind === 'pot' ? potUse(g, e) : e.kind === 'pond' ? pondUse(g, e) : treeUse(g, e, world)) };
  },
});

// ---------------------------------------------------------------- drawing
export function bubble(w, wx, wy, icon, tier) {
  w.drawEmote(icon, wx, wy);
  if (!tier) return;
  const g = w.g, x = w.sx(wx) - 8 + 12, y = w.sy(wy) - 10 - 4 + Math.round(Math.sin(w.game.clock * 6)), c = ['', '#d0d6e2', '#f0c840', '#c284f6'][tier];
  g.fillStyle = '#2b1d2e'; g.fillRect(x - 1, y - 1, 9, 9); g.fillStyle = c; g.fillRect(x + 2, y, 3, 7); g.fillRect(x, y + 2, 7, 3); g.fillStyle = '#fff'; g.fillRect(x + 3, y + 3, 1, 1);
}
const FRPOS = { full: [[-9, -24], [7, -27], [0, -16]], young: [[-3, -14], [4, -12], [0, -18]] };
function drawTree(g, w, gm, t) {
  const cx = t.x * TILE + 8, cy = t.y * TILE + 15, s = stageOf(gm, t), sk = SHAKE.get(t.id), off = sk && gm.clock < sk ? Math.round(Math.sin(gm.clock * 50) * 1.5) : 0;
  let name;
  if (t.kind === 'stump') name = 'sv2_stump';
  else if (s === 1) name = 'sv2_t_sprout';
  else if (s === 2) name = 'sv2_t_sapling';
  else if (s <= 4) name = `sv2_t_young_${t.kind}`;
  else name = FRUIT[t.kind] ? `sv2_t_full_${t.kind}` : `town_tree_${t.kind}_s`;
  w.shadow(cx, cy, s >= 5 ? 12 : 6); w.drawFeet(name, cx + off, cy);
  if (FRUIT[t.kind] && t.fruit > 0 && s >= 3) {
    const pos = FRPOS[s >= 5 ? 'full' : 'young'];
    for (let i = 0; i < Math.min(3, t.fruit); i++) w.drawFeet(`sv2_fr_${t.kind}`, cx + pos[i][0] + off, cy + pos[i][1]);
    w.drawEmote(get('item', FRUIT[t.kind].item).icon, cx, cy - (s >= 5 ? 36 : 26) - Math.round(Math.abs(Math.sin(gm.clock * 3)) * 2));
  }
  drawTap(g, w, gm, t, cx, cy);
}
function drawTap(g, w, gm, t, cx, cy) {
  if (!t.tap) return;
  w.drawFeet(t.tap.ready ? 'sv2_tap_1' : 'sv2_tap_0', cx + 5, cy - 4);
  if (t.tap.ready) w.drawEmote(get('item', t.tap.out).icon, cx, cy - 40 - Math.round(Math.abs(Math.sin(gm.clock * 3)) * 2));
}
register('worldLayer', 'sv2_orchard', {
  sprites(world, game) {
    const S = game.state.sv2_orchard; if (!S) return [];
    const out = [];
    for (const t of S.trees) {
      if (t.map !== world.map.id) continue;
      if (t.static) { if (t.tap) out.push({ y: (t.y + 1) * TILE, draw: (g, w, gm) => drawTap(g, w, gm, t, t.x * TILE + 8, t.y * TILE + 15) }); continue; }
      out.push({ y: (t.y + 1) * TILE - 1, draw: (g, w, gm) => drawTree(g, w, gm, t) });
    }
    for (const h of S.things) {
      if (h.map !== world.map.id) continue;
      if (h.kind === 'log') out.push({ y: (h.y + 1) * TILE - 1, draw: (g, w, gm) => { const cx = h.x * TILE + 8, cy = h.y * TILE + 15; w.shadow(cx, cy, 12); w.drawFeet(h.stock ? 'sv2_log_1' : 'sv2_log_0', cx, cy); if (h.stock) w.drawEmote(get('item', 'ing_shiitake').icon, cx, cy - 20 - Math.round(Math.abs(Math.sin(gm.clock * 3)) * 2)); } });
      else if (h.kind === 'pot') out.push({ y: (h.y + 1) * TILE - 1, draw: (g, w, gm) => { const cx = h.x * TILE + 8, cy = h.y * TILE + 14; w.drawFeet(h.out ? 'sv2_pot_ready' : `sv2_pot_${Math.floor(gm.clock * 1.5) % 2}`, cx, cy); if (h.out) w.drawEmote(get('item', h.out).icon, cx, cy - 18 - Math.round(Math.abs(Math.sin(gm.clock * 3)) * 2)); } });
      else out.push({ y: (h.y + 2) * TILE - 1, draw: (g, w, gm) => {
        const cx = (h.x + 1) * TILE, cy = (h.y + 2) * TILE - 2;
        w.drawFeet(`sv2_pond_${Math.floor(gm.clock * 2) % 3}`, cx, cy);
        for (let i = 0; i < Math.min(h.pop, 5); i++) { const a = gm.clock * 0.6 + i * 1.3 + h.x; w.drawFeet(`sv2_pfish_${Math.floor(gm.clock * 4 + i) % 3}`, cx + Math.cos(a) * 11, cy - 11 + Math.sin(a) * 5); }
        if (h.out.length || (h.req && gm.has(h.req.item))) w.drawEmote(get('item', h.out.length ? h.out[0] : h.req.item).icon, cx, cy - 30 - Math.round(Math.abs(Math.sin(gm.clock * 3)) * 2));
      } });
    }
    return out;
  },
  solids(world, game) {
    const S = game.state.sv2_orchard; if (!S) return [];
    const out = [];
    for (const t of S.trees) if (t.map === world.map.id && !t.static) out.push([t.x * TILE + 3, t.y * TILE + 5, 10, 10]);
    for (const h of S.things) if (h.map === world.map.id) { if (h.kind === 'log') out.push([h.x * TILE + 1, h.y * TILE + 6, 14, 9]); else if (h.kind === 'pond') out.push([h.x * TILE, h.y * TILE + 4, 32, 28]); }
    return out;
  },
});

// static trees that were felled disappear from the map (stumps take their place)
for (const id of TREE_MAPS) {
  wrapMap(id, 'objects', (list) => list.map((o) => (o.tree && WILD[o.tree]
    ? { ...o, when: (gm) => !(gm.state.sv2_orchard && gm.state.sv2_orchard.cut[`${id}:${o.x},${o.y}`]) && (o.when ? gm.check(o.when) : true) } : o)));
}
export const orchardSystem = (game) => {
  game.sv2Plant = (kind) => {
    const world = game.world;
    if (!world || !TREE_MAPS.includes(world.map.id)) { game.toast('Plant saplings in the front or back yard'); return false; }
    const [tx, ty] = facingTile(world, 14), why = plantTree(game, world.map.id, tx, ty, kind, { m: world.map, grid: world.grid });
    if (why) { game.toast(why); return false; }
    sparkle(world, tx * TILE + 8, ty * TILE + 8, 8); game.sfx('dig'); game.toast(`${FRUIT[kind].name} sapling planted. Ripe in ${GROW_DAYS} days.`, 'i_leaf'); return true;
  };
  game.sv2Place = (kind) => placeThing(game, kind);
};
void get;
