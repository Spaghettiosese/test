// Panning: shimmering spots along the water on the beach, harbour and park pond. Needs a panning dish (tool_pan).
// Loot: shells, copper and iron flakes, pyrite, quartz and now and then a gem. The iron dish finds rarer things.
import { register, get, all, features } from '../../core/registry.js';
import { TILE } from '../../world/map.js';
import { SV } from './data.js';
import { mapTiles, pickN, fx, centre } from './util.js';
import { hasTool } from '../hobbies/common.js';

export const PAN_MAPS = { beach: 4, harbour: 3, park: 3 };
const cache = new Map();
function stale(game) {
  const st = SV(game).pan;
  if (st.day !== game.day) { st.day = game.day; st.taken = {}; cache.clear(); }
  return st;
}
export function panSpots(game, mapId) {
  const st = stale(game), ck = `${game.state.seed}:${game.day}:${mapId}`;
  if (!cache.has(ck)) {
    const tiles = mapTiles(mapId).filter((t) => t.nearWater && !t.wet);
    cache.set(ck, pickN(game.rngFor('sv_pan:' + mapId), tiles, PAN_MAPS[mapId] || 3).map((t) => ({ x: t.x, y: t.y, key: `${t.x},${t.y}` })));
  }
  const taken = st.taken[mapId] || [];
  return cache.get(ck).filter((s) => !taken.includes(s.key));
}
const shells = () => all('item').filter((it) => it.cat === 'shell' && it.id.startsWith('shell_') && !it.stub).map((it) => it.id);
export function panLoot(game, tier) {
  const r = game.rng() - (tier >= 2 ? 0.08 : 0), sh = shells();
  if (r < 0.34 && sh.length) return sh[Math.floor(game.rng() * sh.length)];
  if (r < 0.58) return 'ore_copper';
  if (r < 0.7) return 'ore_iron';
  if (r < 0.8) return 'min_pyrite';
  if (r < 0.88) return 'min_quartz';
  if (r < 0.94) return 'min_topaz';
  if (r < 0.98) return 'min_aquamarine';
  return game.rng() < 0.5 ? 'min_amber' : 'min_star_shard';
}
export function pan(game, mapId, spot) {
  if (!hasTool(game, 'tool_pan', 'tool_pan_2') || (!game.has('tool_pan') && !game.has('tool_pan_2'))) return game.toast('You need a panning dish. Kinoko Woodworks sells them.');
  const tier = game.has('tool_pan_2') ? 2 : 1;
  if (!game.useEnergy(tier === 2 ? 1 : 2)) return false;
  const st = stale(game);
  (st.taken[mapId] ||= []).push(spot.key);
  game.advance(10); game.sfx('splash');
  const id = panLoot(game, tier), it = get('item', id);
  game.give(id, 1); st.count++; game.stat('panned');
  game.addXP('mining', 2); game.addXP('foraging', 2);
  if (id.startsWith('min_')) { game.collect('mineral', id); game.stat('mineralsFound'); game.bus.emit('mineralFound', { item: id }); }
  if (id.startsWith('shell_')) { game.collect('shell', id); game.stat('shellsFound'); game.bus.emit('shellFound', { item: id }); }
  game.bus.emit('panned', { item: id });
  const [x, y] = centre(spot.x, spot.y); fx(game, x, y, 8, '#bfe6ff');
  game.toast(`Panning: ${it.name}!`, it.icon);
  return true;
}
register('worldLayer', 'sv_pan', {
  below(g, world, game) {
    if (!PAN_MAPS[world.map.id] || !game.state.sv_explore) return;
    const t = game.clock || 0;
    for (const s of panSpots(game, world.map.id)) {
      world.drawSpr('sv_pan_spot', s.x * TILE - 2, s.y * TILE + 1);
      if (Math.floor(t * 2 + s.x) % 3 === 0) { g.fillStyle = '#ffffff'; g.fillRect(world.sx(s.x * TILE + 9), world.sy(s.y * TILE + 3), 2, 2); }
    }
  },
});
register('targetProvider', 'sv_pan', {
  find(world, game) {
    const id = world.map.id; if (!PAN_MAPS[id] || !game.state.sv_explore) return null;
    let best = null, bd = 20;
    for (const s of panSpots(game, id)) { const d = Math.hypot(s.x * TILE + 8 - world.player.x, s.y * TILE + 10 - world.player.y); if (d < bd) { bd = d; best = s; } }
    return best ? { label: 'Pan for treasure', dist: bd - 6, x: best.x * TILE + 8, y: best.y * TILE + 8, run: (g) => pan(g, id, best) } : null;
  },
});

features('Exploring', [
  'Shimmering pan spots appear every morning along the beach, harbour and park pond; face one and press E to pan',
  'Panning uses a panning dish (Kinoko Woodworks) and finds shells, copper and iron flakes, pyrite, quartz, topaz and rare gems',
  'Rarer finds from panning: aquamarine, amber and star shards, more often with the iron panning dish',
  'Panning earns Mining and Foraging XP and costs 2 energy (1 with the iron dish)',
  'Panned shells and minerals count in your Collections and can be donated at the museum corner',
]);
