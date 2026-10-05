// A human who starts shooting should get company: defenders hear it, go and look, and flank the shooter.
// node tools/player-shot-test.mjs [trials=6]
import { HARBOR } from '../src/siege/data/harbor.js';
import { Sim } from '../src/siege/sim/sim.js';
import { setupRound } from '../src/siege/sim/setup.js';
const N = +(process.argv[2] ?? 6); let came = 0, total = 0, near = 0;
for (let s = 1; s <= N; s++) {
  const level = 2, site = s % HARBOR.sites.length, spawn = HARBOR.spawns[s % HARBOR.spawns.length].id;
  const sim = new Sim(HARBOR, { seed: s * 31337, difficulty: level });
  const g = setupRound(sim, { level, site, spawn, player: { team: 'atk', op: 'spark', primary: 'ak74', secondary: 'magnum', gadget2: 'stun' } });
  const me = sim.actors.find((a) => a.isPlayer);
  // skip the preparation phase
  while (sim.round.phase === 'prep') sim.update(1 / 30);
  for (let t = 0; t < 8; t += 1 / 30) sim.update(1 / 30);
  // put the player outside the building, 18 m from the site, and shoot into the air
  const def = sim.map.def, site0 = sim.round.site.center;
  const dir = [site0[0] - def.bx - def.bw / 2, site0[2] - def.bz - def.bd / 2]; const L = Math.hypot(dir[0], dir[1]) || 1;
  const spot = sim.nav.centre(sim.nav.snap(site0[0] - (dir[0] / L) * 16, 0, site0[2] - (dir[1] / L) * 16));
  me.pos[0] = spot[0]; me.pos[1] = 0; me.pos[2] = spot[2]; me.vel = [0, 0, 0];
  const defs = sim.actors.filter((a) => a.team === 'def' && a.alive);
  const d0 = new Map(defs.map((a) => [a.id, Math.hypot(a.pos[0] - me.pos[0], a.pos[2] - me.pos[2])]));
  let hunters = new Set();
  sim.on('hunt', (e) => { if (e.actor.team === 'def') hunters.add(e.actor.id); });
  me.pitch = 0.3; const t0 = sim.time; const mind = new Map(defs.map((a) => [a.id, 1e9])), kinds = new Map();
  sim.on('hunt', (e) => { if (e.actor.team === 'def') kinds.set(e.actor.name, (kinds.get(e.actor.name) || '') + e.kind[0]); });
  for (let t = 0; t < 20 && me.alive; t += 1 / 30) { me.ctl.fire = (Math.floor(sim.time * 6) % 2) === 0; me.yaw += 0.01; sim.update(1 / 30); for (const a of defs) if (a.alive) mind.set(a.id, Math.min(mind.get(a.id), Math.hypot(a.pos[0] - me.pos[0], a.pos[2] - me.pos[2]))); }
  const closer = defs.filter((a) => mind.get(a.id) < 9).length;
  console.log('   ' + defs.map((a) => `${a.name}(${a.ai.persona.id}) from ${d0.get(a.id).toFixed(0)} to ${mind.get(a.id).toFixed(0)} m [${kinds.get(a.name) || '-'}]${a.alive ? '' : ' dead'}`).join('; '));
  total += defs.length; came += hunters.size; near += closer;
  console.log(`trial ${s}: ${hunters.size}/${defs.length} defenders went to look, ${closer} got within 9 m, player ${me.alive ? 'alive' : 'dead'} after ${(sim.time - t0).toFixed(0)} s`);
}
console.log(`${came} of ${total} defenders investigated the shooting, ${near} pushed towards it`);
if (came < total * 0.3) { console.log('too passive'); process.exitCode = 1; }
