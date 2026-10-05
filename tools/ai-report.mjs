// What does the AI actually do? Plays rounds and counts the behaviours the squads are meant to show:
// node tools/ai-report.mjs [rounds=6] [level=2]
import { HARBOR } from '../src/siege/data/harbor.js';
import { Sim } from '../src/siege/sim/sim.js';
import { setupRound } from '../src/siege/sim/setup.js';
const N = +(process.argv[2] ?? 6), level = +(process.argv[3] ?? 2);
const tot = { hunts: {}, arrive: 0, arriveT: 0, shut: 0, opened: 0, revives: 0, downs: 0, droneSpots: 0, roamKm: 0, roamers: 0, rounds: 0, memHeat: 0, kills: 0, assists: 0 };
const arch = {};
for (let s = 1; s <= N; s++) {
  const site = s % HARBOR.sites.length, spawn = HARBOR.spawns[s % HARBOR.spawns.length].id;
  const sim = new Sim(HARBOR, { seed: s * 4999, difficulty: level });
  setupRound(sim, { level, site, spawn });
  sim.on('hunt', (e) => { tot.hunts[e.kind] = (tot.hunts[e.kind] || 0) + 1; });
  sim.on('huntarrive', (e) => { tot.arrive++; tot.arriveT += e.t; });
  sim.on('doorshut', () => tot.shut++);
  sim.on('door', (e) => { if (e.open) tot.opened++; });
  sim.on('revive', (e) => { if (e.by && e.by.ai) tot.revives++; });
  sim.on('down', () => tot.downs++);
  sim.on('dronespot', () => tot.droneSpots++);
  const last = new Map(), roamers = new Set();
  for (let t = 0; t < 260 && sim.round.phase !== 'end'; t += 1 / 30) {
    sim.update(1 / 30);
    for (const a of sim.actors) {
      if (!a.ai || !a.alive) continue;
      if (a.ai.task && a.ai.task.type === 'roam') { roamers.add(a.id); const l = last.get(a.id); if (l) tot.roamKm += Math.hypot(a.pos[0] - l[0], a.pos[2] - l[1]) / 1000; last.set(a.id, [a.pos[0], a.pos[2]]); }
    }
  }
  tot.rounds++; tot.roamers += roamers.size;
  for (const a of sim.actors) if (a.ai && a.ai.persona) { const k = `${a.team}:${a.ai.persona.id}`; arch[k] = (arch[k] || 0) + 1; tot.kills += a.stats ? a.stats.kills : 0; tot.assists += a.stats ? a.stats.assists || 0 : 0; }
}
const hs = Object.entries(tot.hunts).map(([k, v]) => `${k} ${v}`).join(', ');
console.log(`${tot.rounds} rounds at level ${level}`);
console.log(`  hunts started: ${hs || 'none'}; reached the spot: ${tot.arrive} (avg ${(tot.arriveT / Math.max(1, tot.arrive)).toFixed(1)} s)`);
console.log(`  doors opened ${tot.opened}, shut by defenders ${tot.shut}, downs ${tot.downs}, revived by bots ${tot.revives}, drone sightings ${tot.droneSpots}`);
console.log(`  roamers: ${tot.roamers} bots walked ${(tot.roamKm * 1000).toFixed(0)} m in total; kills ${tot.kills}`);
console.log('  archetypes: ' + Object.entries(arch).sort().map(([k, v]) => `${k} ${v}`).join(', '));
if (!tot.shut || !tot.revives || !Object.keys(tot.hunts).length) process.exitCode = 1;
