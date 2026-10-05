// Builds a round: picks the spawn and site, creates the ten actors with their loadouts, and
// wires bots to a director per team. The human (if any) gets an actor without a brain.
import { OPERATORS, OPS_BY_ID, attackers, defenders } from '../data/operators.js';
import { Brain } from '../ai/brain.js';
import { AttackDirector, DefendDirector } from '../ai/director.js';
import { STOREY } from '../world/grid.js';
import { yawOf } from './util.js';

export function randomLoadout(sim, opId) {
  const op = OPS_BY_ID[opId], r = sim.rand;
  return { primary: r.pick(op.primary), secondary: r.pick(op.secondary), gadget2: r.pick(op.gadgets) };
}

// cfg: { site, spawn, level, atk: [opIds], def: [opIds], player: { team, op, primary, secondary, gadget2 } | null }
export function setupRound(sim, cfg) {
  const r = sim.rand, map = sim.map, round = sim.round;
  round.setSite(cfg.site ?? r.int(map.sites.length));
  const spawn = map.spawns.find((s) => s.id === cfg.spawn) || r.pick(map.spawns);
  round.spawn = spawn;
  const level = cfg.level ?? sim.difficulty;
  const pick = (side, n, forced) => {
    const pool = (side === 'atk' ? attackers : defenders).map((o) => o.id);
    const out = [];
    if (forced) out.push(forced);
    const bag = pool.filter((id) => !out.includes(id)).sort(() => r() - 0.5);
    const want = cfg[side] || [];
    for (const id of want) if (!out.includes(id)) out.push(id);
    while (out.length < n) { const id = bag.shift(); if (!out.includes(id)) out.push(id); }
    return out.slice(0, n);
  };
  const P = cfg.player;
  const atkOps = pick('atk', 5, P && P.team === 'atk' ? P.op : null), defOps = pick('def', 5, P && P.team === 'def' ? P.op : null);
  const atkPos = round.spawnPositions('atk', spawn, 5);
  const face = yawOf(map.def.bx + map.def.bw / 2 - spawn.cx, map.def.bz + map.def.bd / 2 - spawn.cz);
  const actors = { atk: [], def: [] };
  atkOps.forEach((id, i) => {
    const isP = P && P.team === 'atk' && P.op === id, lo = isP ? P : randomLoadout(sim, id);
    actors.atk.push(sim.addActor({ team: 'atk', op: id, isPlayer: !!isP, ...lo, pos: atkPos[i], yaw: face }));
  });
  // defenders start in or near the site rooms
  const an = round.siteCells || (round.siteCells = siteSpawnCells(sim, round.site));
  const used = new Set();
  defOps.forEach((id, i) => {
    const isP = P && P.team === 'def' && P.op === id, lo = isP ? P : randomLoadout(sim, id);
    let c = an[(i * 7 + r.int(an.length)) % an.length];
    for (let k = 0; k < 12 && used.has(c.join()); k++) c = an[r.int(an.length)];
    used.add(c.join());
    actors.def.push(sim.addActor({ team: 'def', op: id, isPlayer: !!isP, ...lo, pos: [c[0], c[1], c[2]], yaw: r() * 6.28 }));
  });
  // brains and directors
  const dirs = { atk: new AttackDirector(sim, 'atk', level), def: new DefendDirector(sim, 'def', level) };
  for (const team of ['atk', 'def']) for (const a of actors[team]) if (!a.isPlayer) dirs[team].add(new Brain(a, dirs[team], level));
  sim.directors = [dirs.atk, dirs.def];
  for (const d of sim.directors) d.init();
  sim.dirs = dirs; sim.teams = actors;
  return { actors, dirs, spawn };
}
// walkable cells in and around the site rooms for defender starts
function siteSpawnCells(sim, site) {
  const nav = sim.nav, f = site.f, out = [];
  const cx = Math.floor(site.center[0]), cz = Math.floor(site.center[2]);
  for (let dz = -9; dz <= 9; dz++) for (let dx = -9; dx <= 9; dx++) {
    const x = cx + dx, z = cz + dz;
    if (!nav.walkable(x, z, f) || nav.partial[nav.node(x, z, f)] || sim.world.roomAt(x + 0.5, f * STOREY, z + 0.5) < 0) continue;
    out.push([x + 0.5, f * STOREY, z + 0.5]);
  }
  return out;
}
void OPERATORS;
