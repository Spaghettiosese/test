// Artisan machines, sprinklers and scarecrows placed in the yards: placing, loading, the working animation and
// ready bubble, overnight processing, bee boxes that read nearby flowers, and picking things back up.
import { register, get, all } from '../../core/registry.js';
import { TILE } from '../../world/map.js';
import { SV } from './data.js';
import { addStar, takeStar, nm } from './core.js';
import { facingTile, tileOf, sparkle } from '../hobbies/common.js';
import { inPlot } from '../hobbies/world.js';

export const MAPS = ['yard', 'backyard'];
export const def = (k) => get('svMachine', k);
export const onMap = (game, mapId) => SV(game).machines.filter((m) => m.map === mapId);
export const stateOf = (m) => (m.ready ? 'ready' : m.left > 0 ? 'work' : 'idle');
const say = (game, text) => game.run([{ t: 'say', who: 'misa', mood: 'neutral', text }]);

function sprName(game, m) {
  const d = def(m.kind);
  if (d.sprinkler) return `sv_m_sprinkler_${d.sprinkler}_${Math.floor(game.clock * 1.5) % 3}`;
  if (d.scare) return `sv_m_${m.kind}_idle`;
  const s = stateOf(m);
  return `sv_m_${m.kind}_${s === 'work' ? 'work' + (Math.floor(game.clock * 3) % 2) : s}`;
}
export function placeMachine(game, kind) {
  const world = game.world;
  if (!world || !MAPS.includes(world.map.id)) { game.toast('Place machines in the front or back yard'); return false; }
  const [tx, ty] = facingTile(world, 14), S = SV(game), d = def(kind);
  if (!tileOf(world, tx, ty) || !(world.grid[ty] && world.grid[ty][tx])) { game.toast('No room there'); return false; }
  if (inPlot(world.map, tx, ty)) { game.toast('Not on the garden soil'); return false; }
  if (S.machines.some((m) => m.map === world.map.id && m.x === tx && m.y === ty)) { game.toast('Something is already there'); return false; }
  if ((world.map.warps || []).some((w) => tx >= w.x && tx < w.x + (w.w || 1) && ty >= w.y && ty < w.y + (w.h || 1))) { game.toast('That is a doorway'); return false; }
  S.machines.push({ id: 'm' + S.nextM++, kind, map: world.map.id, x: tx, y: ty, out: null, n: 1, left: d.auto ? d.days : 0, q: 0, ready: false });
  world.grid[ty][tx] = false; world.refreshRects(); sparkle(world, tx * TILE + 8, ty * TILE + 10, 6);
  game.sfx('pop'); game.stat('svPlaced'); game.toast(`${d.name} placed`, get('item', 'mach_' + kind).icon);
  game.bus.emit('machinePlaced', { kind });
  return true;
}
function pickUp(game, m) {
  const S = SV(game);
  S.machines = S.machines.filter((x) => x !== m);
  if (game.world && game.world.map.id === m.map) { game.world.grid[m.y][m.x] = true; game.world.refreshRects(); }
  game.give('mach_' + m.kind, 1); game.sfx('pop');
}
function beeOutput(game, m) {
  const P = (game.state.hobbies.plots || {})[m.map] || {}, count = {};
  for (const [k, p] of Object.entries(P)) {
    if (!p.crop || p.dead) continue;
    const cr = get('crop', p.crop); if (!cr || !cr.flower) continue;
    const [x, y] = k.split(',').map(Number);
    if (Math.hypot(x - m.x, y - m.y) <= 6 && p.age >= cr.days * 0.75) count[p.crop] = (count[p.crop] || 0) + 1;
  }
  const best = Object.entries(count).sort((a, b) => b[1] - a[1])[0], id = best ? 'art_honey_' + best[0].slice(5) : 'art_honey_wild';
  return get('item', id) ? id : 'art_honey_wild';
}
export function tickMachines(game) {
  const dry = ['rain', 'storm', 'snow'].includes(game.weather);
  for (const m of SV(game).machines) {
    const d = def(m.kind); if (!d || m.ready) continue;
    if (d.auto) { if (game.season === 'winter' || dry) continue; m.left--; if (m.left <= 0) { m.out = beeOutput(game, m); m.n = 1 + (game.season === 'summer' ? 1 : 0); m.ready = true; m.left = 0; } }
    else if (m.left > 0) { m.left--; if (m.left <= 0) { m.left = 0; m.ready = true; } }
  }
}
function collect(game, m) {
  const d = def(m.kind); let n = m.n;
  if (game.skillLevel('crafting') >= 5 && game.rng() < 0.2) { n *= 2; game.toast('A bumper batch!', 'i_star'); }
  game.give(m.out, n); addStar(game, m.out, m.q, n); game.addXP('crafting', 3 + Math.min(6, Math.round((get('item', m.out).price || 0) / 100)));
  game.collect('artisan', m.out); game.stat('svArtisan', n); game.sfx('chime');
  game.bus.emit('artisanMade', { kind: m.kind, item: m.out, n });
  Object.assign(m, { ready: false, out: null, q: 0, left: d.auto ? d.days : 0 });
}
function start(game, m, id, r) {
  const d = def(m.kind), need = d.need || 1;
  if (need > 1) {
    const left = need; let k = left;
    const ids = Object.keys(game.state.inv).filter((i) => d.rec(i)).sort((a, b) => (get('item', a).price || 0) - (get('item', b).price || 0));
    for (const i of ids) { const t = Math.min(k, game.count(i)); game.take(i, t); k -= t; if (!k) break; }
    m.q = 0;
  } else { game.take(id, 1); m.q = takeStar(game, id); }
  Object.assign(m, { out: r.out, n: r.n || 1, left: r.days || d.days, ready: false });
  game.advance(5); game.sfx('dig'); game.addXP('crafting', 1);
  game.toast(`${d.name}: ${nm(r.out)} in ${m.left} day${m.left === 1 ? '' : 's'}`, get('item', r.out).icon);
}
function load(game, m) {
  const d = def(m.kind), need = d.need || 1;
  if (need > 1) {
    const total = Object.keys(game.state.inv).filter((i) => d.rec(i)).reduce((a, i) => a + game.count(i), 0);
    if (total < need) return say(game, d.empty);
    return start(game, m, null, d.rec(Object.keys(game.state.inv).find((i) => d.rec(i))));
  }
  const cands = Object.keys(game.state.inv).filter((i) => d.rec(i) && get('item', i)).sort((a, b) => (get('item', b).price || 0) - (get('item', a).price || 0));
  if (!cands.length) return say(game, d.empty);
  return game.run([{ t: 'choice', prompt: `${d.name}: load what?`, options: [...cands.slice(0, 5).map((i) => ({ text: `${nm(i)} x${game.count(i)}`, steps: [{ t: 'call', fn: (g) => start(g, m, i, d.rec(i)) }] })), { text: 'Never mind', steps: [] }] }]);
}
function interact(game, m) {
  const d = def(m.kind);
  if (m.ready) return collect(game, m);
  const idle = !m.left, opts = [];
  if (!d.sprinkler && !d.scare && !d.auto && idle) opts.push({ text: 'Load it', steps: [{ t: 'call', fn: (g) => load(g, m) }] });
  if (d.auto && m.left) opts.push({ text: game.season === 'winter' ? 'The bees are sleeping for winter' : 'Check on the bees', steps: [{ t: 'call', fn: (g) => g.toast(`Honey in about ${m.left} day${m.left === 1 ? '' : 's'}${['rain', 'storm', 'snow'].includes(g.weather) ? ' (bees rest in bad weather)' : ''}`, 'i_leaf') }] });
  if (!d.sprinkler && !d.scare && !d.auto && !idle) opts.push({ text: 'See how it is going', steps: [{ t: 'call', fn: (g) => g.toast(`${nm(m.out)}: ${m.left} day${m.left === 1 ? '' : 's'} to go`, get('item', m.out).icon) }] });
  if (idle || d.auto || d.sprinkler || d.scare) opts.push({ text: 'Pick it up', steps: [{ t: 'call', fn: (g) => pickUp(g, m) }] });
  opts.push({ text: 'Leave it', steps: [] });
  return game.run([{ t: 'choice', prompt: d.name + (d.sprinkler ? ` (waters ${[0, 4, 8, 24][d.sprinkler]} tiles)` : d.scare ? ` (scares crows within ${d.scare} tiles)` : ''), options: opts }]);
}

register('worldLayer', 'sv_machines', {
  sprites(world, game) {
    if (!MAPS.includes(world.map.id)) return [];
    return onMap(game, world.map.id).map((m) => ({
      y: (m.y + 1) * TILE - 1,
      draw: (g, w, gm) => {
        const cx = m.x * TILE + 8, cy = m.y * TILE + 15, name = sprName(gm, m);
        w.shadow(cx, cy, 9); w.drawFeet(name, cx, cy);
        if (m.ready) { const it = get('item', m.out); if (it) w.drawEmote(it.icon, cx, cy - 26 - Math.round(Math.abs(Math.sin(gm.clock * 3)) * 2)); }
      },
    }));
  },
  solids(world, game) { return game.state.sv_farm && MAPS.includes(world.map.id) ? onMap(game, world.map.id).map((m) => [m.x * TILE + 1, m.y * TILE + 3, TILE - 2, TILE - 3]) : []; },
});
register('targetProvider', 'sv_machines', {
  find(world, game) {
    if (!MAPS.includes(world.map.id)) return null;
    const p = world.player; let best = null, bd = 30;
    for (const m of onMap(game, world.map.id)) {
      const d = Math.hypot(p.x - (m.x * TILE + 8), p.y - 4 - (m.y * TILE + 8)); if (d < bd) { bd = d; best = m; }
    }
    if (!best) return null;
    const d = def(best.kind), label = best.ready ? `Collect ${nm(best.out)}` : d.name;
    return { label, dist: Math.max(0, bd - 14), x: best.x * TILE + 8, y: best.y * TILE + 8, run: (g) => interact(g, best) };
  },
});
export const machineSystem = (game) => { game.svPlace = (kind) => placeMachine(game, kind); };
void all;
