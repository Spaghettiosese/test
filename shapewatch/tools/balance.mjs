import { Sim } from '../src/sim.js';
const diff = +process.argv[2] || 1, n = +process.argv[3] || 8;
let w = [0, 0], dur = 0, kills = 0, ot = 0;
for (let s = 1; s <= n; s++) {
  const sim = new Sim({ headless: true, autoPlayer: true, seed: s * 31, difficulty: diff });
  for (let i = 0; i < 60 * 900 && sim.state !== 'over'; i++) { sim.step(1 / 60); for (const e of sim.events) { if (e.type === 'kill') kills++; if (e.type === 'overtime') ot++; } }
  w[sim.winner]++; dur += sim.time;
  console.log('seed', s, 'winner', sim.winner, sim.why, 'time', sim.time.toFixed(0), 'dist', sim.payload.dist.toFixed(0), sim.units.filter(u=>!u.deploy&&u.team===0).map(u=>u.hero).join('/'), 'vs', sim.units.filter(u=>!u.deploy&&u.team===1).map(u=>u.hero).join('/'));
}
console.log('wins attackers/defenders', w, 'avg time', (dur / n).toFixed(0), 'kills/match', (kills / n).toFixed(1), 'overtimes', ot);
