// Builds a round: picks the spawn and site, creates the ten actors with their loadouts, and
// wires bots to a director per team. The human (if any) gets an actor without a brain.
import { Reactions } from '../ai/reactions.js';
import { OPERATORS, OPS_BY_ID, attackers, defenders } from '../data/operators.js';
import { Brain } from '../ai/brain.js';
import { AttackDirector, DefendDirector } from '../ai/director.js';
import { STOREY } from '../world/grid.js';
import { yawOf } from './util.js';
import { makePersona, drawCallsigns } from '../ai/persona.js';

export function randomLoadout(sim, opId) {
  const op = OPS_BY_ID[opId], r = sim.rand;
  return { primary: r.pick(op.primary), secondary: r.pick(op.secondary), gadget2: r.pick(op.gadgets) };
}

// cfg: { site, spawn, level, atk: [opIds], def: [opIds], player: { team, op, primary, secondary, gadget2 } | null,
//        names: { atk: [5 callsigns], def: [5] } (kept for a whole match), slots: { atk: [5 keys], def: [5] } for the match
//        scoreboard, memory: a MatchMemory with what the bots learned in earlier rounds }
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
  sim.memory = cfg.memory || null; if (sim.memory && sim.memory.attach) sim.memory.attach(sim);
  const atkNames = (cfg.names && cfg.names.atk) || drawCallsigns(r, 5);
  const names = { atk: atkNames, def: (cfg.names && cfg.names.def) || drawCallsigns(r, 5, atkNames) };
  const persona = (side, id, i) => makePersona(r, OPS_BY_ID[id], side, names[side][i]);
  const atkPos = round.spawnPositions('atk', spawn, 5);
  const face = yawOf(map.def.bx + map.def.bw / 2 - spawn.cx, map.def.bz + map.def.bd / 2 - spawn.cz);
  const actors = { atk: [], def: [] };
  atkOps.forEach((id, i) => {
    const isP = P && P.team === 'atk' && P.op === id, lo = isP ? P : randomLoadout(sim, id);
    const a = sim.addActor({ team: 'atk', op: id, isPlayer: !!isP, ...lo, pos: atkPos[i], yaw: face, name: isP ? undefined : names.atk[i] });
    if (!isP) a.persona = persona('atk', id, i);
    a.slot = cfg.slots ? cfg.slots.atk[i] : null; if (a.persona && sim.memory) sim.memory.restoreMood(a.persona);
    actors.atk.push(a);
  });
  // defenders start in or near the site rooms
  const an = round.siteCells || (round.siteCells = siteSpawnCells(sim, round.site));
  const used = new Set();
  defOps.forEach((id, i) => {
    const isP = P && P.team === 'def' && P.op === id, lo = isP ? P : randomLoadout(sim, id);
    let c = an[(i * 7 + r.int(an.length)) % an.length];
    // the human may have chosen which room of the site to start in
    if (isP && cfg.start !== undefined && cfg.start !== 'spread') {
      const letter = round.site.rooms[+cfg.start], nm = letter && map.def.rooms[round.site.f][letter] && map.def.rooms[round.site.f][letter][0];
      const mine = nm ? an.filter((q) => sim.world.roomName(q[0], q[1], q[2]) === nm) : [];
      if (mine.length) c = mine[r.int(mine.length)];
    }
    for (let k = 0; k < 12 && used.has(c.join()); k++) c = an[r.int(an.length)];
    used.add(c.join());
    const a = sim.addActor({ team: 'def', op: id, isPlayer: !!isP, ...lo, pos: [c[0], c[1], c[2]], yaw: r() * 6.28, name: isP ? undefined : names.def[i] });
    if (!isP) a.persona = persona('def', id, i);
    a.slot = cfg.slots ? cfg.slots.def[i] : null; if (a.persona && sim.memory) sim.memory.restoreMood(a.persona);
    actors.def.push(a);
  });
  // doors start the round the way they were left: most inside ones open, the outside ones shut
  for (const d of sim.world.doors) { if (d.dead || d.barricade > 0) continue; const open = !d.ext && r() < 0.7; d.open = d.target = open ? 1 : 0; }
  sim.worldVer++;
  // brains and directors
  const dirs = { atk: new AttackDirector(sim, 'atk', level), def: new DefendDirector(sim, 'def', level) };
  for (const team of ['atk', 'def']) for (const a of actors[team]) if (!a.isPlayer) dirs[team].add(new Brain(a, dirs[team], level));
  sim.directors = [dirs.atk, dirs.def];
  for (const d of sim.directors) d.init();
  sim.dirs = dirs; sim.teams = actors; sim.reactions = new Reactions(sim);
  // what the bots remember from earlier rounds, shown to the human on the HUD
  sim.notes = [];
  if (sim.memory && sim.memory.rounds) {
    if (dirs.def.learned) sim.notes.push(dirs.def.learned.replace(/^./, (c) => 'Defenders ' + c));
    if (dirs.atk.learnedNote) sim.notes.push('Attackers ' + dirs.atk.learnedNote);
  }
  return { actors, dirs, spawn };
}
// walkable cells in and around the site rooms for defender starts
function siteSpawnCells(sim, site) {
  const nav = sim.nav, f = site.f, out = [];
  const cx = Math.floor(site.center[0]), cz = Math.floor(site.center[2]);
  const open = new Map(); // cell -> size of the area it belongs to (capped), so sealed pockets are skipped
  const room = (n) => {
    if (open.has(n)) return open.get(n);
    const seen = new Set([n]), q = [n];
    while (q.length && seen.size < 260) { const m = q.pop(); nav.each(m, (k) => { if (!seen.has(k)) { seen.add(k); q.push(k); } }, false); }
    for (const m of seen) open.set(m, seen.size);
    return seen.size;
  };
  for (let dz = -9; dz <= 9; dz++) for (let dx = -9; dx <= 9; dx++) {
    const x = cx + dx, z = cz + dz;
    if (!nav.walkable(x, z, f) || nav.partial[nav.node(x, z, f)] || sim.world.roomAt(x + 0.5, f * STOREY, z + 0.5) < 0) continue;
    if (!nav.fits(nav.node(x, z, f)) || room(nav.node(x, z, f)) < 260) continue;
    const [sx, sz] = nav.standXZ(nav.node(x, z, f));
    out.push([sx, f * STOREY, sz]);
  }
  return out;
}
void OPERATORS;
