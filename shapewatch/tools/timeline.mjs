// Print where each bot is every few seconds: z position, role, mode, target, hp.
import { Sim } from '../src/sim.js';
const sim = new Sim({ headless: true, autoPlayer: true, seed: +process.argv[2] || 5, difficulty: 1 });
const every = +process.argv[3] || 15;
for (let i = 0; i < 60 * 200 && sim.state !== 'over'; i++) {
  sim.step(1 / 60);
  if (sim.state === 'live' && i % (60 * every) === 0) {
    console.log(`\n--- t=${sim.time.toFixed(0)}s payload z=${sim.payload.pos[2].toFixed(0)} pushers=${sim.payload.pushers} def=${sim.payload.defenders} timer=${sim.timer.toFixed(0)}`);
    for (const u of sim.units) if (!u.deploy) console.log(`  ${u.team ? 'D' : 'A'} ${u.hero.padEnd(8)} z=${u.pos[2].toFixed(0).padStart(4)} x=${u.pos[0].toFixed(0).padStart(3)} y=${u.pos[1].toFixed(1)} hp=${Math.round(u.hp + u.armor)}${u.alive ? '' : ' DEAD'} mode=${u.bot.mode} tgt=${u.bot.target ? u.bot.target.e.hero + '@' + u.bot.target.d.toFixed(0) : '-'} ult=${Math.round(u.ult / u.def.ult.cost * 100)}%`);
  }
}
console.log('\nover:', sim.winner, sim.why, sim.time.toFixed(0));
