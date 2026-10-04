// Bots play a few full matches headlessly: the round must end, state must stay finite, payload must move.
import { Sim } from '../src/sim.js';
let failed = 0;
for (const [seed, diff] of [[3, 0], [8, 1], [21, 2]]) {
  const sim = new Sim({ headless: true, autoPlayer: true, seed, difficulty: diff });
  let bad = 0, kills = 0;
  for (let i = 0; i < 60 * 900 && sim.state !== 'over'; i++) {
    sim.step(1 / 60);
    for (const e of sim.events) if (e.type === 'kill') kills++;
    for (const u of sim.units) if (!u.deploy && ![u.pos[0], u.pos[1], u.pos[2], u.hp, u.ult].every(Number.isFinite)) bad++;
  }
  const ok = sim.state === 'over' && bad === 0 && kills > 5 && sim.payload.dist > 20;
  console.log(`seed ${seed} diff ${diff}: ${sim.state}, winner ${sim.winner} (${sim.why}), ${kills} kills, payload ${sim.payload.dist.toFixed(0)} m`, ok ? 'ok' : 'FAIL');
  if (!ok) failed++;
}
process.exit(failed ? 1 : 0);
