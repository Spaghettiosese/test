// Foraging: seasonal wild finds on town, park, shrine, lane, school grounds and the beach (worldLayer + targetProvider),
// a daily respawn, the Foraging skill and a rare shrine-forest truffle.
import { register, get, features } from '../../core/registry.js';
import { TILE } from '../../world/map.js';
import { SV, FORAGE, clamp } from './data.js';
import { mapTiles, GRASSY, pickN, fx, centre } from './util.js';
import { hasProf } from './prof.js';

export const FORAGE_MAPS = { town: 4, park: 6, lane: 4, shrine: 6, school_grounds: 4, beach: 5 };
const cache = new Map();
const rare = (it) => it.rarity || 1;

function stale(game) {
  const st = SV(game).forage;
  if (st.day !== game.day) { st.day = game.day; st.taken = {}; cache.clear(); }
  return st;
}
function poolFor(game, mapId) {
  const habs = mapId === 'beach' ? ['sand'] : mapId === 'shrine' || mapId === 'park' ? ['wood', 'field'] : ['field'];
  let pool = FORAGE.filter((f) => f[2].includes(game.season) && habs.includes(f[3]));
  if (!pool.length) pool = FORAGE.filter((f) => f[2].includes(game.season) && f[3] === 'field');
  return pool;
}
// Today's forage nodes on a map: [{ x, y, id, key }]. Deterministic per day, minus what was picked.
export function forageNodes(game, mapId) {
  const st = stale(game);
  const ck = `${game.state.seed}:${game.day}:${mapId}:${game.skillLevel("foraging")}`;
  if (!cache.has(ck)) {
    const rng = game.rngFor('sv_forage:' + mapId), pool = poolFor(game, mapId), list = [];
    const want = mapId === 'beach' ? (t) => t.ground === 'sand' && !t.nearWater : (t) => GRASSY.includes(t.ground);
    const tiles = mapTiles(mapId).filter(want);
    const n = (FORAGE_MAPS[mapId] || 4) + Math.floor(game.skillLevel('foraging') / 3) + (['rain', 'storm'].includes(game.weather) ? 2 : 0) + (game.season === 'winter' ? -1 : 0);
    for (const t of pickN(rng, tiles, n)) {
      let r = rng() * pool.reduce((a, f) => a + 1 / Math.pow(rare(get('item', 'forage_' + f[0])), 1.5), 0), f = pool[pool.length - 1];
      for (const p of pool) if ((r -= 1 / Math.pow(rare(get('item', 'forage_' + p[0])), 1.5)) < 0) { f = p; break; }
      if (!f || !pool.length) continue;
      list.push({ x: t.x, y: t.y, id: 'forage_' + f[0], key: `${t.x},${t.y}` });
    }
    // The rare shrine-forest truffle: a mound near the forest path, not every day.
    if (mapId === 'shrine') {
      const chance = hasProf(game, 'truffle') ? 0.9 : hasProf(game, 'tracker') ? 0.5 : 0.3;
      const m = get('map', 'shrine'), fp = (m.spots && m.spots.forest_path) || [14, 30];
      const near = mapTiles('shrine').filter((t) => GRASSY.includes(t.ground) && Math.hypot(t.x - fp[0], t.y - fp[1]) < 9 && !list.some((l) => l.key === `${t.x},${t.y}`));
      if (near.length && rng() < chance) { const t = near[Math.floor(rng() * near.length)]; list.push({ x: t.x, y: t.y, id: 'forage_hoshi_truffle', key: `${t.x},${t.y}` }); }
    }
    cache.set(ck, list);
  }
  const taken = st.taken[mapId] || [];
  return cache.get(ck).filter((n) => !taken.includes(n.key));
}
export function pickForage(game, mapId, node) {
  const st = stale(game), it = get('item', node.id);
  if (!game.useEnergy(1)) return false;
  const lv = game.skillLevel('foraging');
  let n = 1 + (game.rng() < clamp(lv * 0.03, 0, 0.3) ? 1 : 0);
  (st.taken[mapId] ||= []).push(node.key);
  game.give(node.id, n); game.advance(3); game.sfx('pop');
  game.stat('foraged', n); st.found += n; if (node.id === 'forage_hoshi_truffle') { st.truffles++; game.stat('trufflesFound'); }
  game.addXP('foraging', node.id === 'forage_hoshi_truffle' ? 25 : 2 + rare(it) * 2);
  game.collect('forage', node.id);
  game.bus.emit('foraged', { item: node.id, n });
  const [x, y] = centre(node.x, node.y); fx(game, x, y, node.id === 'forage_hoshi_truffle' ? 14 : 6);
  if (!game.flag('sv_forage_tip')) { game.setFlag('sv_forage_tip'); game.toast('Wild finds respawn every morning. Foraging levels bring more of them.'); }
  if (node.id === 'forage_hoshi_truffle') game.toast('A Hoshi truffle! The forest is generous today.', it.icon);
  return true;
}

register('worldLayer', 'sv_forage', {
  below(g, world, game) {
    if (!game.state.sv_explore || !FORAGE_MAPS[world.map.id]) return;
    const tr = hasProf(game, 'tracker'), t = game.clock || 0;
    for (const n of forageNodes(game, world.map.id)) {
      const x = n.x * TILE + 8, y = n.y * TILE + 14;
      world.drawFeet(n.id === 'forage_hoshi_truffle' ? 'sv_truffle_mound' : 'sv_fg_' + n.id.slice(7), x, y);
      const tw = Math.floor(t * 3 + n.x * 3 + n.y) % 8;
      if (tw < (tr ? 3 : 1)) { const sx = world.sx(x) + 6, sy = world.sy(y) - 20; g.fillStyle = '#fffaf0'; g.fillRect(sx - tw - 1, sy, tw * 2 + 3, 1); g.fillRect(sx, sy - tw - 1, 1, tw * 2 + 3); }
    }
  },
});
register('targetProvider', 'sv_forage', {
  find(world, game) {
    const id = world.map.id; if (!FORAGE_MAPS[id] || !game.state.sv_explore) return null;
    let best = null, bd = 18;
    for (const n of forageNodes(game, id)) { const d = Math.hypot(n.x * TILE + 8 - world.player.x, n.y * TILE + 10 - world.player.y); if (d < bd) { bd = d; best = n; } }
    if (!best) return null;
    const it = get('item', best.id), truf = best.id === 'forage_hoshi_truffle';
    return { label: truf ? 'Dig up the strange mound' : `Pick ${it.name.toLowerCase()}`, dist: bd - 6, x: best.x * TILE + 8, y: best.y * TILE + 8, run: (g) => pickForage(g, id, best) };
  },
});

features('Exploring', [
  'Seasonal forage appears around town, the park, the lane, the school grounds, the shrine and the beach: leeks, dandelions, wild berries and bamboo shoots in spring',
  'Summer forage: wild grapes, shiso, hibiscus and pretty seashells on the beach sand',
  'Autumn forage: chestnuts, wild mushrooms, ginkgo nuts and the pricey matsutake',
  'Winter forage: crocus, snow yams, holly and camellia pushing through the snow',
  'Forage twinkles on the ground; face it and press E to pick it (1 energy, a few minutes)',
  'Forage respawns fresh every morning in new spots, with more of it after rain',
  'Rare Hoshi truffle: some mornings a strange mound appears in the shrine forest, worth 300 coins',
  'Foraging skill: every level adds to your odds of a double pick, and every third level adds more nodes to each map',
  'Forage items are food: eat them for energy or sell them (Forager, Botanist, Naturalist and Truffle Hunter professions boost them)',
  'Tracker makes forage sparkle brighter and truffles likelier; Truffle Hunter finds one almost every day',
]);
