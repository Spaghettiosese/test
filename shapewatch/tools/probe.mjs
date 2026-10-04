// Headless soak test: bots on both sides (player included) play a match; print what happened.
import { Sim } from '../src/sim.js';
const diff = +process.argv[3] || 1, seed = +process.argv[2] || 7, minutes = +process.argv[4] || 4;
const sim = new Sim({ headless: true, autoPlayer: true, seed, difficulty: diff });
const counts = {}; let bad = 0;
const t0 = Date.now();
for (let i = 0; i < 60 * (22 + 60 * minutes) && sim.state !== 'over'; i++) {
  sim.step(1 / 60);
  for (const e of sim.events) counts[e.type] = (counts[e.type] || 0) + 1;
  for (const u of sim.units) if (!u.deploy && (!isFinite(u.pos[0] + u.pos[1] + u.pos[2]) || !isFinite(u.hp))) bad++;
}
console.log('state', sim.state, 'winner', sim.winner, sim.why, 'time', sim.time.toFixed(0), 'payload', sim.payload.dist.toFixed(1), 'cp', sim.payload.cp, 'timer', sim.timer.toFixed(0));
console.log('wall ms', Date.now() - t0, 'NaN frames', bad);
console.log(counts);
for (const u of sim.units) if (!u.deploy) console.log(u.team, u.hero.padEnd(8), 'E', u.stats.elims, 'D', u.stats.deaths, 'dmg', Math.round(u.stats.dmg), 'heal', Math.round(u.stats.heal), 'ults', u.stats.ults, 'pos', u.pos.map((v) => v.toFixed(0)).join(','), u.alive ? '' : 'dead');
