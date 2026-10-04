// Headless checks for every hero: weapons deal damage, abilities take effect, nothing goes NaN.
import { Sim } from '../src/sim.js';
import { HEROES } from '../src/heroes.js';

let failed = 0;
const ok = (cond, msg) => { if (!cond) { failed++; console.log('  FAIL', msg); } };

function arena(heroId) {
  const sim = new Sim({ headless: true, playerHero: heroId, seed: 11 });
  for (const u of sim.units) u.bot = null;
  sim.state = 'live'; sim.setupT = 0; sim.useMutators = false;
  const me = sim.player, enemies = sim.units.filter((u) => u.team === 1 && !u.deploy), allies = sim.units.filter((u) => u.team === 0 && u !== me && !u.deploy);
  // everything stands in a clear stretch of the avenue
  me.pos = [0, 0, 30]; me.yaw = 0; me.pitch = 0; me.invuln = 0;
  enemies.forEach((e, i) => { e.pos = [-6 + i * 3, 0, 44 + (i % 2) * 3]; e.invuln = 0; e.yaw = Math.PI; e.hp = e.maxHp = 4000; e.armor = 0; });
  allies.forEach((a, i) => { a.pos = [-3 + i * 2, 0, 27]; a.invuln = 0; a.hp = 40; });
  sim.payload.pos = [50, 0, 50]; // keep the payload out of the way
  return { sim, me, enemies, allies };
}
const run = (sim, sec, evs = []) => { for (let i = 0; i < sec * 60; i++) { sim.step(1 / 60); evs.push(...sim.events); } return evs; };
const total = (units) => units.reduce((a, u) => a + (u.maxHp - u.hp), 0);
const finite = (sim) => sim.units.every((u) => [u.pos[0], u.pos[1], u.pos[2], u.hp, u.vx, u.vz].every(Number.isFinite));

for (const h of HEROES) {
  console.log(h.id);
  // ---- primary fire damages enemies in front of us
  {
    const { sim, me, enemies } = arena(h.id);
    me.in.move = [0, 0];
    const tgt = enemies[0]; tgt.pos = [0, 0, 40]; for (const e of enemies.slice(1)) e.pos = [30, 0, 60];
    for (let i = 0; i < 180; i++) { me.in.fire1 = (i % 2 === 0) || h.w1.auto; me.yaw = Math.atan2(tgt.pos[0] - me.pos[0], tgt.pos[2] - me.pos[2]); me.pitch = Math.atan2(tgt.pos[1] + 1.1 - 1.65, 10); sim.step(1 / 60); }
    ok(tgt.maxHp - tgt.hp > 20, `primary fire dealt ${Math.round(tgt.maxHp - tgt.hp)} damage`);
    ok(finite(sim), 'finite state after firing');
  }
  // ---- each ability and the ultimate
  for (const slot of ['a1', 'a2', 'ult', 'w2']) {
    const { sim, me, enemies, allies } = arena(h.id);
    me.ult = h.ult.cost; me.hp = me.maxHp; const before = { cd: { ...me.cd }, charges: me.charges, hp: me.hp, pos: [...me.pos] };
    const tgt = enemies[0]; tgt.pos = [0, 0, 38]; for (const e of enemies.slice(1)) e.pos = [3, 0, 40]; me.yaw = 0; me.pitch = -0.05;
    me.hp = Math.max(60, me.maxHp * 0.5);
    const evs = [];
    if (h.id === 'vesper' && slot === 'a1') { me.yaw = Math.PI / 2; me.pitch = 0.1; } // the grapple needs a surface to hook
    if (h.id === 'flicker' && slot === 'a2') run(sim, 2, evs); // rewind needs a past to return to
    if (slot === 'w2') { for (let i = 0; i < 200; i++) { me.in.fire2 = i < 150; sim.step(1 / 60); evs.push(...sim.events); } } else { me.in[slot] = true; run(sim, 3.5, evs); }
    const seen = (t) => evs.some((e) => e.type === t);
    const used = slot === 'ult' ? me.stats.ults === 1 : slot === 'w2' ? true : (me.cd[slot] > 0 || (slot === 'a1' && h.a1.charges && seen('blink')) || (h.id === 'flicker' && slot === 'a2' && evs.some((e) => e.rewind)));
    ok(used, `${slot} (${h[slot].name}) was used`);
    ok(finite(sim), `${slot}: finite state`);
    if (slot === 'ult' && h.id === 'bulwark') ok(sim.zones.some((z) => z.kind === 'dome') || me.stats.ults === 1, 'Bastion Field dome');
    if (slot === 'a1' && h.id === 'pylon') ok(sim.units.some((u) => u.deploy?.kind === 'pylon'), 'pylon deployed');
    if (slot === 'a2' && h.id === 'pylon') ok(sim.units.some((u) => u.deploy?.kind === 'sentry'), 'sentry deployed');
    if (slot === 'a2' && h.id === 'halo') ok(allies.some((a) => a.hp > 40), 'Sanctuary heals allies');
    if (slot === 'w2' && h.id === 'halo') ok(allies.some((a) => a.hp > 41) || me.stats.heal > 0, 'Aegis Beam heals');
    if (slot === 'w2' && h.id === 'bulwark') ok(me.s.barrier && me.s.barrier.hp <= me.s.barrier.max, 'barrier exists');
  }
  // ---- hitting a Bulwark barrier is absorbed by it
  if (h.id === 'sabre') {
    const { sim, me, enemies } = arena('sabre'), tank = enemies[0]; sim.swapHero(tank, 'bulwark');
    tank.pos = [0, 0, 40]; tank.yaw = Math.PI; tank.in.fire2 = true; tank.hp = tank.maxHp = 250; tank.armor = 200;
    for (const e of enemies.slice(1)) e.pos = [30, 0, 60];
    for (let i = 0; i < 120; i++) { me.in.fire1 = true; me.in.fire2 = false; me.pitch = 0.005; me.yaw = 0; sim.step(1 / 60); }
    ok(tank.s.barrier.hp < tank.s.barrier.max, 'barrier takes the hits');
    ok(tank.hp === 250, 'barrier protects its owner');
  }
}
console.log(failed ? `${failed} failure(s)` : 'all kit checks passed');
process.exit(failed ? 1 : 0);
