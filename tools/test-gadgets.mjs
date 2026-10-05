// Every operator's gadgets, used by a player-controlled actor in a live round, must not throw and
// must leave the simulation healthy: node tools/test-gadgets.mjs
import { HARBOR } from '../src/siege/data/harbor.js';
import { OPERATORS } from '../src/siege/data/operators.js';
import { GADGETS } from '../src/siege/data/gadgets.js';
import { Sim } from '../src/siege/sim/sim.js';
import { setupRound } from '../src/siege/sim/setup.js';
let fail = 0, used = 0;
for (const op of OPERATORS) {
  const sim = new Sim(HARBOR, { seed: 11, difficulty: 2 });
  setupRound(sim, { level: 2, site: 0, player: { team: op.side, op: op.id, primary: op.primary[0], secondary: op.secondary[0], gadget2: op.gadgets[0] } });
  sim.round.phase = 'action'; sim.round.t = 170;
  const a = sim.actors.find((x) => x.isPlayer); a.pos = [28.5, 0, 22.5]; a.yaw = 0; a.pitch = 0.05;
  try {
    for (const g of a.gadgets) {
      const def = GADGETS[g.id]; if (!def) throw new Error('missing gadget def ' + g.id);
      for (let k = 0; k < 2; k++) { a.busy = null; sim.devices.use(a, g.id, { dir: a.look() }); used++; for (let i = 0; i < 20; i++) sim.update(1 / 30); }
      sim.devices.detonateOwned(a);
      for (let i = 0; i < 40; i++) sim.update(1 / 30);
    }
    sim.devices.melee(a); a.ctl.use = true;
    for (let i = 0; i < 120; i++) sim.update(1 / 30);
    if (!Number.isFinite(a.pos[0]) || !Number.isFinite(a.hp)) throw new Error('non-finite state');
    console.log(`ok   ${op.name.padEnd(9)} ${a.gadgets.map((g) => g.id).join(', ')}`);
  } catch (e) { fail++; console.log(`FAIL ${op.name}: ${e.message}\n   ${(e.stack || '').split('\n').slice(1, 4).join('\n   ')}`); }
}
console.log(`${used} gadget uses across ${OPERATORS.length} operators, ${fail} failures`);
if (fail) process.exitCode = 1;
