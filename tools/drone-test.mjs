// Fly the AI drones through the preparation phase and report where they went and what they saw:
// node tools/drone-test.mjs [rounds=8]
import { HARBOR } from '../src/siege/data/harbor.js';
import { Sim } from '../src/siege/sim/sim.js';
import { setupRound } from '../src/siege/sim/setup.js';
// physics: a drone driven straight up a staircase, and one that has to hop a 50 cm ledge
{
  const sim = new Sim(HARBOR, { seed: 3, difficulty: 1 });
  const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
  const owner = { team: 'atk', id: 999, name: 'Test' }, dr = sim.devices.spawnDrone(owner, [24.5, 0, 23.2], 0);
  dr.ctl.fwd = 1;
  for (let t = 0; t < 12 && dr.pos[1] < 2.9; t += 1 / 30) sim.update(1 / 30);
  ok(dr.pos[1] > 2.5, `drone drives up the stairs (reached y ${dr.pos[1].toFixed(2)} at z ${dr.pos[2].toFixed(1)})`);
  sim.devices.killDrone(dr, null); sim.update(1 / 30);
  const ledge = { kind: 'crate', min: [24, 0, 4], max: [26, 0.5, 6], solid: true };
  const d2 = sim.devices.spawnDrone(owner, [22, 0, 5], Math.PI / 2); sim.world.addProp(ledge);
  d2.ctl.fwd = 1; let y = 0, hopped = false;
  for (let t = 0; t < 4; t += 1 / 30) { if (d2.stuckT > 0.2 && d2.grounded) d2.ctl.jump = true; sim.update(1 / 30); y = Math.max(y, d2.pos[1]); if (d2.pos[0] > 24.5) hopped = true; }
  ok(hopped && y > 0.45, `drone hops onto a 50 cm ledge (x ${d2.pos[0].toFixed(1)}, y ${d2.pos[1].toFixed(2)})`);
  sim.devices.killDrone(d2, null);
}
const N = +(process.argv[2] ?? 8); let fail = 0, spots = 0, killed = 0, climbed = 0, jumps = 0, rounds = 0, maxY = 0;
for (let s = 1; s <= N; s++) {
  const level = 1 + (s % 4), site = s % HARBOR.sites.length, spawn = HARBOR.spawns[s % HARBOR.spawns.length].id;
  const sim = new Sim(HARBOR, { seed: s * 7919, difficulty: level });
  setupRound(sim, { level, site, spawn });
  const ages = []; let spotted = 0, died = 0, hops = 0, top = 0, dist = 0, last = new Map(), stuckMax = 0;
  sim.on('dronespot', () => spotted++); sim.on("dronekill", (e) => { if (sim.round.inPrep()) { died++; ages.push(((e.drone.age) || 0).toFixed(0)); } }); sim.on('dronejump', () => hops++);
  for (let t = 0; t < 44; t += 1 / 30) {
    sim.update(1 / 30);
    for (const d of sim.devices.drones) { top = Math.max(top, d.pos[1]); const l = last.get(d.id); if (l) dist += Math.hypot(d.pos[0] - l[0], d.pos[2] - l[1]); last.set(d.id, [d.pos[0], d.pos[2]]); stuckMax = Math.max(stuckMax, d.stuckT); }
  }
  rounds++; spots += spotted; killed += died; jumps += hops; if (top > 2) climbed++; maxY = Math.max(maxY, top);
  console.log(`seed ${s} L${level}: drones ${last.size} travelled ${dist.toFixed(0)} m, top ${top.toFixed(1)} m, hops ${hops}, spotted ${spotted}, shot down ${died} (after ${ages.join(",")}s), worst stuck ${stuckMax.toFixed(1)}s`);
  if (dist < 20 * last.size) fail++;
}
console.log(`${rounds} rounds: ${spots} sightings, ${killed} drones shot down, ${climbed} rounds a drone reached an upper floor, ${jumps} hops`);
if (fail > rounds / 3) { console.log('drones are not getting anywhere'); process.exitCode = 1; }
