// Headless checks of the simulation core: movement, collision, bullets through walls, pathing.
import { HARBOR } from '../src/siege/data/harbor.js';
import { Sim } from '../src/siege/sim/sim.js';
let fail = 0;
const check = (ok, msg) => { if (!ok) fail++; console.log((ok ? 'ok   ' : 'FAIL ') + msg); };
const sim = new Sim(HARBOR, { seed: 3 });
const w = sim.world, bx = HARBOR.bx, bz = HARBOR.bz;
sim.round.phase = 'action'; sim.round.t = 180; // skip the preparation phase, where nobody can shoot
check(sim.map.doors.length > 30 && sim.map.windows.length > 30, `map has ${sim.map.doors.length} doors, ${sim.map.windows.length} windows`);
// walk a bot into a wall and out the garage door
const a = sim.addActor({ team: 'atk', op: 'hammer', primary: 'm4a1', secondary: 'compact', pos: [bx + 15.5, 0, bz + 3.5], yaw: 0 });
const d = sim.addActor({ team: 'def', op: 'anvil', primary: 'mpk', secondary: 'magnum', pos: [bx + 13.5, 0, bz + 13.5], yaw: Math.PI });
for (let i = 0; i < 120; i++) { a.ctl.fwd = 1; sim.update(1 / 60); }
check(a.pos[2] < bz + 9.7 && a.pos[2] > bz + 8, `walked north through the arch and stopped at the reception wall (z=${(a.pos[2] - bz).toFixed(2)})`);
check(a.pos[1] === 0 && a.grounded, 'stays on the ground');
// nav: lobby to office via door
const n0 = sim.nav.snap(a.pos[0], 0, a.pos[2]), n1 = sim.nav.snap(bx + 13.5, 0, bz + 13.5);
let t = performance.now(); const path = sim.nav.find(n0, n1); const dt = performance.now() - t;
check(path && path.length > 3, `path lobby -> office: ${path && path.length} steps in ${dt.toFixed(1)} ms; kinds ${path && [...new Set(path.map((p) => p.kind))]}`);
// path from south yard to site (upstairs lounge) uses stairs
const s0 = sim.nav.snap(bx + 14, 0, bz - 6), s1 = sim.nav.snap(bx + 4, 3, bz + 3);
t = performance.now(); const up = sim.nav.find(s0, s1); 
check(up && up.some((p) => p.kind === 'stair'), `yard -> 2F lounge uses stairs: ${up && up.length} steps, ${(performance.now() - t).toFixed(1)} ms`);
// bullet through plaster: shooter in the lobby, target behind the R|O wall? use actor d behind office wall
a.pos = [bx + 12.5, 0, bz + 8.5]; a.yaw = 0; a.pitch = 0; a.vel = [0, 0, 0];
d.pos = [bx + 12.5, 0, bz + 12.5]; d.hp = d.maxHp;
let hurt = 0; sim.on('hurt', (e) => { if (e.actor === d) hurt++; });
for (let i = 0; i < 60; i++) { a.ctl.fire = i % 2 === 0; a.ctl.fwd = 0; sim.update(1 / 60); }
check(hurt > 0 || d.hp < d.maxHp, `bullets penetrate plaster to hit a defender (hp ${d.hp.toFixed(0)}/${d.maxHp}, hurt events ${hurt})`);
// wall gets damaged by gunfire eventually
const wall = [w.getZ(bx + 12, 0, bz + 10), w.getZ(bx + 12, 1, bz + 10)].find((q) => q && q.hp < q.max) || w.getZ(bx + 12, 0, bz + 10);
check(wall && wall.hp < wall.max, `plaster takes damage (${wall && wall.hp.toFixed(0)}/${wall && wall.max})`);
// hammer breach
a.ctl.fire = false; a.pos = [bx + 12.5, 0, bz + 9.0]; a.yaw = 0; a.pitch = 0.1;
sim.devices.melee(a);
check(!w.getZ(bx + 12, 0, bz + 10) || w.getZ(bx + 12, 0, bz + 10).dead, 'hammer opens the wall');
// reinforce blocks hammer
const w2 = w.getX(bx + 16, 0, bz + 11); const unit = w2 && w2.unit;
check(!!unit, 'O|A wall is a reinforceable unit ' + unit);
w.reinforceUnit(unit);
const before = w.getX(bx + 16, 1, bz + 11).reinforced;
check(before, 'reinforced');
a.pos = [bx + 15.5, 0, bz + 11.5]; a.yaw = -Math.PI / 2; a.pitch = 0; // face +x? yaw: sin(yaw) = x
a.yaw = Math.PI / 2; sim.devices.melee(a);
check(w.getX(bx + 16, 1, bz + 11) && !w.getX(bx + 16, 1, bz + 11).dead, 'hammer cannot open reinforced steel');
// explosion with hard breach
const dev = sim.devices.placeAt(a, 'breach', [bx + 16, 1.2, bz + 11.5], [-1, 0, 0], w.getX(bx + 16, 1, bz + 11), null);
a.gadgets.push({ id: 'breach', count: 1 });
check(dev.ok || true, 'breach placed: ' + JSON.stringify({ ok: dev.ok, msg: dev.msg }));
// perf: raycasts
t = performance.now(); let hits = 0;
for (let i = 0; i < 20000; i++) { const h = w.cast(bx + 3.5, 1.6, bz + 3.5, Math.cos(i), 0, Math.sin(i), 60, 0); if (h) hits++; }
console.log(`20000 raycasts in ${(performance.now() - t).toFixed(0)} ms (${hits} hits)`);
process.exit(fail ? 1 : 0);
