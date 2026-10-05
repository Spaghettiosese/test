// Nobody can be shot during preparation, and attackers are protected in their spawn when the action
// phase starts (until they fire, leave it, or 20 s pass).  node tools/test-safety.mjs
import { HARBOR } from '../src/siege/data/harbor.js';
import { Sim } from '../src/siege/sim/sim.js';
import { setupRound } from '../src/siege/sim/setup.js';
let fail = 0; const ok = (c, m) => { if (!c) fail++; console.log((c ? 'ok   ' : 'FAIL ') + m); };
const sim = new Sim(HARBOR, { seed: 5, difficulty: 2 });
setupRound(sim, { level: 2, site: 0, spawn: 'south' });
const atk = sim.actors.find((a) => a.team === 'atk'), def = sim.actors.find((a) => a.team === 'def');
sim.passive = { atk: true, def: true }; // we drive the shooting ourselves
// put the defender 10 m from the attacker in the open yard, looking at him
const place = () => { atk.pos = [28, 0, 6]; def.pos = [28, 0, 16 - 3]; def.pos = [28, 0, 6 + 8]; def.yaw = Math.PI; def.pitch = 0; atk.hp = atk.maxHp; };
const shoot = (shooter, at) => { const e = shooter.eye(), c = at.chestPos(); const d = [c[0] - e[0], c[1] - e[1], c[2] - e[2]], l = Math.hypot(...d); shooter.yaw = Math.atan2(d[0], d[2]); shooter.pitch = Math.asin(d[1] / l); const g = shooter.gun; g.mag = 30; g.cd = 0; g.draw = 0; sim.fire(shooter, g, false); };
place();
ok(sim.round.inPrep(), 'the round starts in preparation');
shoot(def, atk); ok(atk.hp === atk.maxHp, `a bullet in preparation does no damage (hp ${atk.hp}/${atk.maxHp})`);
atk.hurt(80, { src: def, region: 'torso' }); ok(atk.hp === atk.maxHp, 'direct damage from another player in preparation is ignored');
// run to the action phase
while (sim.round.inPrep()) sim.update(1 / 30);
place(); sim.passive = { atk: true, def: true };
ok(atk.spawnProtected, 'attackers are protected when the action phase starts');
shoot(def, atk); ok(atk.hp === atk.maxHp, `a bullet at a protected attacker does nothing (hp ${atk.hp})`);
const d0 = def.hp; atk.hurt(80, { src: def, region: 'torso' }); ok(atk.hp === atk.maxHp, 'damage is ignored while protected');
// AI defenders do not see or chase them
sim.passive = { atk: true }; for (let t = 0; t < 2; t += 1 / 30) sim.update(1 / 30);
ok(def.hp === d0 && atk.hp === atk.maxHp, 'defender AI does not kill a protected attacker either');
ok(!def.ai.sense.mem.has(atk.id) || !def.ai.sense.mem.get(atk.id).seen, 'a protected attacker is not a target for the AI');
// firing ends the protection
sim.passive = { atk: true, def: true }; place(); atk.startSpawnShield(20); atk.lastShotT = sim.time; atk.updateSpawnShield();
ok(!atk.spawnProtected, 'firing a weapon ends the protection');
atk.startSpawnShield(20); atk.pos = [28, 0, 30]; atk.updateSpawnShield(); ok(!atk.spawnProtected, 'leaving the spawn ends the protection');
atk.startSpawnShield(1); for (let t = 0; t < 1.2; t += 1 / 30) sim.update(1 / 30); ok(!atk.spawnProtected, 'the protection times out');
place(); atk.hurt(30, { src: def, region: 'torso' }); ok(atk.hp < atk.maxHp, 'afterwards a shot hurts');
process.exit(fail ? 1 : 0);
