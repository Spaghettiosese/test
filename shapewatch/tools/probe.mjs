// Headless soak test: bots on both sides (player included) play a match; print what happened.
import { Sim } from '../src/sim.js';
const seed = +process.argv[2] || 7, diff = +process.argv[3] || 1, mode = process.argv[4] || 'escort', map = process.argv[5] || 'frostgate', minutes = +process.argv[6] || 6;
const sim = new Sim({ headless: true, autoPlayer: true, seed, difficulty: diff, mode, map });
const counts = {}; let bad = 0; const t0 = Date.now();
for (let i = 0; i < 60 * (22 + 60 * minutes) && sim.state !== 'over'; i++) {
  sim.step(1 / 60);
  for (const e of sim.events) counts[e.type] = (counts[e.type] || 0) + 1;
  for (const u of sim.units) if (!u.deploy && (!isFinite(u.pos[0] + u.pos[1] + u.pos[2]) || !isFinite(u.hp))) bad++;
}
console.log(mode, map, 'state', sim.state, 'winner', sim.winner, sim.why, 'time', sim.time.toFixed(0), 'payload', sim.payload?.dist?.toFixed(1), 'score', sim.score, 'wins', sim.wins);
console.log('wall ms', Date.now() - t0, 'NaN frames', bad);
console.log(JSON.stringify(counts));
for (const u of sim.units) if (!u.deploy) console.log(u.team, u.hero.padEnd(10), 'E', u.stats.elims, 'D', u.stats.deaths, 'dmg', Math.round(u.stats.dmg), 'heal', Math.round(u.stats.heal), 'ults', u.stats.ults, 'crit', u.stats.crits, 'acc', u.stats.shots ? Math.round(100 * u.stats.hits / u.stats.shots) + '%' : '-', u.alive ? '' : 'dead');
