// Every mode on every map it supports: bots play to a result (or a time cap) with sane state.
import { Sim } from '../src/sim.js';
import { MAPS } from '../src/maps.js';
const quick = process.argv[2] === 'quick';
let failed = 0;
const combos = [];
for (const m of Object.values(MAPS)) for (const mode of m.modes) combos.push([mode, m.id]);
for (const [mode, map] of combos) {
  if (quick && !['escort:sunscar', 'hybrid:junction', 'control:lumen', 'tdm:foundry', 'ffa:lumen', 'training:foundry'].includes(mode + ':' + map)) continue;
  const t0 = Date.now(), sim = new Sim({ headless: true, autoPlayer: true, seed: 5, difficulty: 2, mode, map }); let bad = 0, kills = 0;
  const cap = mode === 'training' ? 60 * 60 : 60 * 60 * 14;
  for (let i = 0; i < cap && sim.state !== 'over'; i++) {
    sim.step(1 / 60); for (const e of sim.events) if (e.type === 'kill') kills++;
    for (const u of sim.units) if (!u.deploy && ![u.pos[0], u.pos[1], u.pos[2], u.hp].every(Number.isFinite)) bad++;
  }
  const finished = sim.state === 'over', ok = bad === 0 && (mode === 'training' || (kills > 3 && finished));
  console.log(`${mode.padEnd(8)} ${map.padEnd(10)} ${finished ? 'won by team ' + sim.winner + ' (' + sim.why + ')' : 'unfinished at ' + sim.time.toFixed(0) + 's'} · ${kills} kills · ${((Date.now() - t0) / 1000).toFixed(1)}s ${ok ? 'ok' : 'FAIL'}`);
  if (!ok) failed++;
}
process.exit(failed ? 1 : 0);
