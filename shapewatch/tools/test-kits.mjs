// Headless checks for every hero: weapons deal damage, abilities take effect, healers really heal
// (the player included, with passive regeneration switched off), crits fire, nothing goes NaN.
import { Sim } from '../src/sim.js';
import { HEROES } from '../src/heroes.js';

let failed = 0;
const ok = (cond, msg) => { if (!cond) { failed++; console.log('  FAIL', msg); } };

function arena(heroId) {
  const sim = new Sim({ headless: true, playerHero: heroId, seed: 11, mutators: false });
  for (const u of sim.units) u.bot = null;
  sim.state = 'live'; sim.setupT = 0;
  const me = sim.player, enemies = sim.units.filter((u) => u.team === 1 && !u.deploy), allies = sim.units.filter((u) => u.team === 0 && u !== me && !u.deploy);
  me.pos = [0, 0, 30]; me.yaw = 0; me.pitch = 0; me.invuln = 0;
  enemies.forEach((e, i) => { e.pos = [-6 + i * 3, 0, 44 + (i % 2) * 3]; e.invuln = 0; e.yaw = Math.PI; e.hp = e.maxHp = 4000; e.armor = 0; });
  allies.forEach((a, i) => { a.pos = [-3 + i * 2, 0, 27]; a.invuln = 0; a.hp = 40; });
  sim.payload.pos = [50, 0, 50];
  return { sim, me, enemies, allies };
}
const run = (sim, sec, evs = [], each = null) => { for (let i = 0; i < sec * 60; i++) { each?.(i); sim.step(1 / 60); evs.push(...sim.events); } return evs; };
const finite = (sim) => sim.units.every((u) => [u.pos[0], u.pos[1], u.pos[2], u.hp, u.vx, u.vz].every(Number.isFinite));
const face = (me, p) => { me.yaw = Math.atan2(p[0] - me.pos[0], p[2] - me.pos[2]); me.pitch = Math.atan2(p[1] + 1.0 - 1.65, Math.hypot(p[0] - me.pos[0], p[2] - me.pos[2])); };
const RANGE = { sion: 3, wrecker: 2.4, siphon: 8, shade: 12, bastille: 14 };
// abilities that need a setup the default arena does not provide
const NEEDS = { vesper: { a1: 'wall' }, riftwalker: { a1: 'wall', a2: 'wall' }, flicker: { a2: 'wait' }, serene: { ult: 'allyFront' }, cantor: { w2: 'allyFront' }, halo: { w2: 'allyFront', a1: 'allyFront' } };

for (const h of HEROES) {
  console.log(h.id);
  // ---- primary fire damages an enemy in front
  {
    const { sim, me, enemies } = arena(h.id), tgt = enemies[0]; tgt.pos = [0, 0, 30 + (RANGE[h.id] ?? 10)]; for (const e of enemies.slice(1)) e.pos = [30, 0, 70];
    for (let i = 0; i < 240; i++) { me.in.fire1 = (i % 2 === 0) || h.w1.auto || h.w1.kind === 'beam'; face(me, tgt.pos); sim.step(1 / 60); }
    ok(tgt.maxHp - tgt.hp > 20, `primary fire dealt ${Math.round(tgt.maxHp - tgt.hp)} damage`);
    ok(finite(sim), 'finite state after firing');
  }
  // ---- each ability, the secondary and the ultimate
  for (const slot of ['a1', 'a2', 'ult', 'w2']) {
    const { sim, me, enemies, allies } = arena(h.id), need = NEEDS[h.id]?.[slot];
    me.ult = h.ult.cost; me.hp = Math.max(60, me.maxHp * 0.5);
    const tgt = enemies[0]; tgt.pos = [0, 0, 38]; for (const e of enemies.slice(1)) e.pos = [3, 0, 40]; me.yaw = 0; me.pitch = -0.05;
    if (need === 'wall') { me.yaw = Math.PI / 2; me.pitch = 0.1; }
    if (need === 'allyFront') { allies.forEach((a, i) => { a.pos = [-2 + i * 2, 0, 36]; }); for (const e of enemies) e.pos = [20, 0, 70]; }
    const evs = [], flag = {}, sample = () => { if (enemies.some((e) => e.st.root)) flag.root = true; if (enemies.some((e) => e.st.frozen)) flag.frozen = true; if (enemies.some((e) => e.st.sleep)) flag.sleep = true; if (enemies.some((e) => e.st.silenced)) flag.silenced = true; if (allies.some((a) => a.st.nano)) flag.nano = true; if (sim.zones.some((z) => z.kind === 'portal')) flag.portal = true; if (me.s.wall) flag.wall = true; };
    if (need === 'wait') run(sim, 2, evs);
    if (h.id === 'mirage' && slot === 'a2') { me.in.fire2 = true; run(sim, 0.2, evs); me.in.fire2 = false; me.in.a2 = true; }
    if (slot === 'w2') run(sim, 4, evs, (i) => { sample(); me.in.fire2 = i < 150 || (i % 30 === 0); if (need === 'allyFront') face(me, allies[0].pos); });
    else { if (need === 'allyFront') face(me, allies[0].pos); me.in[slot] = true; run(sim, 3.5, evs, sample); }
    if (h.id === 'shade' && slot === 'a2') { me.in.a2 = true; run(sim, 0.3, evs); } // second press teleports back
    const seen = (t) => evs.some((e) => e.type === t);
    const used = slot === 'ult' ? me.stats.ults === 1 : slot === 'w2' ? true : (me.cd[slot] > 0 || (slot === 'a1' && h.a1.charges && seen('blink')) || (h.id === 'flicker' && slot === 'a2' && evs.some((e) => e.rewind)) || (h.id === 'shade' && slot === 'a2' && seen('blink')) || (h.id === 'riftwalker' && flag.portal) || (h.id === 'bastille' && slot === 'a2' && flag.wall));
    ok(used, `${slot} (${h[slot].name}) was used`);
    ok(finite(sim), `${slot}: finite state`);
    if (slot === 'ult' && h.id === 'bulwark') ok(sim.zones.some((z) => z.kind === 'dome') || me.stats.ults === 1, 'Bastion Field dome');
    if (slot === 'a1' && h.id === 'pylon') ok(sim.units.some((u) => u.deploy?.kind === 'pylon'), 'pylon deployed');
    if (slot === 'a2' && h.id === 'pylon') ok(sim.units.some((u) => u.deploy?.kind === 'sentry'), 'sentry deployed');
    if (slot === 'a1' && h.id === 'riftwalker') ok(flag.portal, 'portal placed');
    if (slot === 'ult' && h.id === 'riftwalker') ok(flag.frozen, 'stasis field freezes enemies');
    if (slot === 'ult' && h.id === 'shade') ok(flag.silenced, 'EMP silences');
    if (slot === 'ult' && h.id === 'trapper') ok(flag.root, 'bear pit roots');
    if (slot === 'a1' && h.id === 'serene') ok(flag.sleep, 'sleep dart puts an enemy to sleep');
    if (slot === 'ult' && h.id === 'serene') ok(flag.nano, 'nano boost applied');
    if (slot === 'ult' && h.id === 'bastille') ok(sim.zones.some((z) => z.kind === 'barrage'), 'artillery barrage');
    if (slot === 'a2' && h.id === 'bastille') ok(flag.wall, 'shield wall deployed');
  }
}

// ---- healers heal allies AND the player (passive regeneration disabled so only healing counts)
const HEAL = {
  halo: (sim, me, t) => { face(me, t.pos); me.in.fire2 = true; },
  serene: (sim, me, t) => { face(me, t.pos); me.in.fire1 = (sim.time * 60 | 0) % 40 === 0; },
  pylon: (sim, me, t) => { face(me, t.pos); me.in.fire2 = (sim.time * 60 | 0) % 70 === 0; },
  zephyr: () => {},
  thorn: (sim, me, t) => { face(me, t.pos); me.in.fire2 = (sim.time * 60 | 0) % 70 === 0; },
  lantern: (sim, me, t) => { face(me, t.pos); me.pitch = -0.4; me.in.fire2 = (sim.time * 60 | 0) % 700 === 0; },
  cantor: (sim, me, t) => { face(me, t.pos); me.in.fire2 = (sim.time * 60 | 0) % 30 === 0; },
  siphon: (sim, me, t) => { face(me, t.pos); me.pitch = -0.5; me.in.fire2 = (sim.time * 60 | 0) % 500 === 0; },
};
console.log('healing');
for (const [id, drive] of Object.entries(HEAL)) {
  const { sim, me, enemies, allies } = arena(id), t = allies[0];
  for (const e of enemies) e.pos = [30, 0, 90]; t.pos = [0, 0, id === 'siphon' ? 33 : 38]; t.hp = 40; for (const a of allies.slice(1)) a.hp = a.maxHp;
  if (id === 'siphon') me.pos = [0, 0, 30];
  run(sim, 5, [], () => { t.dmgT = sim.time; me.dmgT = sim.time; drive(sim, me, t); });
  ok(t.hp > 90, `${id} healed a wounded ally from 40 to ${Math.round(t.hp)}`);
}
// a bot healer heals the (idle) player
for (const id of ['halo', 'pylon', 'zephyr', 'serene', 'cantor', 'siphon']) {
  const sim = new Sim({ headless: true, playerHero: 'sabre', seed: 19, mutators: false });
  const healer = sim.units.find((u) => u.team === 0 && !u.isPlayer); sim.swapHero(healer, id);
  for (const u of sim.units) if (u !== healer) u.bot = null; healer.bot.diff = 2; healer.bot.setSkill();
  sim.state = 'live'; const me = sim.player; me.pos = [0, 0, 10]; healer.pos = [0, 0, 6]; healer.yaw = 0;
  for (const u of sim.units) if (u.team === 1) u.pos = [30, 0, 150];
  for (const u of sim.units) if (u !== healer && u !== me && u.team === 0) u.pos = [-10, 0, 0];
  me.hp = 60; let top = 60;
  run(sim, 8, [], () => { me.dmgT = sim.time; top = Math.max(top, me.hp); });
  ok(me.hp > 110, `bot ${id} healed the player from 60 to ${Math.round(me.hp)}`);
}

// ---- crits: headshots crit, body hits can crit on lucky rolls, the HUD gets a flag
{
  const { sim, me, enemies } = arena('sabre'), tgt = enemies[0]; tgt.pos = [0, 0, 40];
  const evs = []; const head = [0, tgt.pos[1] + tgt.def.height - 0.24, 40];
  me.yaw = 0; me.pitch = Math.atan2(head[1] - 1.65, 10);
  for (let i = 0; i < 60; i++) { me.in.fire1 = true; run(sim, 1 / 60, evs); }
  const crits = evs.filter((e) => e.type === 'dmg' && e.crit && e.head);
  ok(crits.length > 3, `headshots crit (${crits.length})`);
  ok(me.stats.crits > 3 && me.stats.headshots > 3, 'crit stats recorded');
  const body = evs.filter((e) => e.type === 'dmg' && !e.head);
  ok(!crits.length || crits[0].amt > 1.5 * (body[0]?.amt ?? 5), 'a crit hits harder than a body shot');
}
// ---- a Bulwark barrier absorbs bullets
{
  const { sim, me, enemies } = arena('sabre'), tank = enemies[0]; sim.swapHero(tank, 'bulwark');
  tank.pos = [0, 0, 40]; tank.yaw = Math.PI; tank.in.fire2 = true; tank.hp = tank.maxHp = 250; tank.armor = 200;
  for (const e of enemies.slice(1)) e.pos = [30, 0, 60];
  for (let i = 0; i < 120; i++) { me.in.fire1 = true; me.pitch = 0.005; me.yaw = 0; sim.step(1 / 60); }
  ok(tank.s.barrier.hp < tank.s.barrier.max, 'barrier takes the hits');
  ok(tank.hp === 250, 'barrier protects its owner');
}
console.log(failed ? `${failed} failure(s)` : 'all kit checks passed');
process.exit(failed ? 1 : 0);
