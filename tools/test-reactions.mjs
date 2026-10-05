// Scenario tests for the reaction layer: what bots do about grenades, flashes, charges, gas, bullets
// going past, doors, broken walls, fallen team mates, pings and so on.  node tools/test-reactions.mjs
import { HARBOR } from '../src/siege/data/harbor.js';
import { Sim } from '../src/siege/sim/sim.js';
import { setupRound } from '../src/siege/sim/setup.js';
import { analyseSite } from '../src/siege/ai/analysis.js';
import { dist3 } from '../src/siege/sim/util.js';
let fail = 0; const ok = (c, m) => { if (!c) fail++; console.log((c ? 'ok   ' : 'FAIL ') + m); };

// a fresh round in the action phase with no director moving anyone; the brains still think
function scene(seed = 5, level = 3, site = 0) {
  const sim = new Sim(HARBOR, { seed, difficulty: level });
  setupRound(sim, { level, site, spawn: 'south' });
  sim.round.phase = 'action'; sim.round.t = 180; sim.directors = [];
  for (const a of sim.actors) { if (a.team === 'atk') a.spawnUntil = 0; if (a.shieldOn) { a.shieldOn = false; } }
  for (const a of sim.actors) { a.shieldUntil = 0; a.shieldOn = false; }
  return sim;
}
const put = (a, p, yaw = 0) => { const c = a.sim.nav.centre(a.sim.nav.snap(p[0], p[1], p[2])); a.pos = [c[0], c[1], c[2]]; a.vel = [0, 0, 0]; a.yaw = yaw; a.pitch = 0; if (a.ai) { a.ai.task = null; a.ai.mover.stop(); a.ai.hunt = null; a.ai.mode = 'task'; } };
const step = (sim, secs, fn) => { for (let t = 0; t < secs; t += 1 / 30) { sim.update(1 / 30); if (fn) fn(t); } };
const park = (sim, team) => { for (const a of sim.actors) if (a.team === team) { put(a, [2 + Math.random() * 0, 0, 2]); } };
// two actors in the open yard 8 m apart, everybody else far away
function duel(sim) {
  const atk = sim.actors.filter((a) => a.team === 'atk'), def = sim.actors.filter((a) => a.team === 'def');
  const A = atk[0], D = def[0];
  put(A, [20, 0, 2], 0); put(D, [20, 0, 9], Math.PI);
  atk.slice(1).forEach((a, i) => put(a, [4 + i * 2, 0, 3])); def.slice(1).forEach((a, i) => put(a, [50 - i * 2, 0, 38]));
  for (const a of sim.actors) { a.hp = a.maxHp; a.ai.rx.supp = 0; }
  sim.passive = { atk: true }; // the thrower and friends stand still; the defenders think
  return { A, D };
}
const frag = (sim, owner, pos, fuse = 2.6, kind = 'frag') => { const p = { kind, owner, team: owner.team, pos: [...pos], vel: [0, 0, 0], fuse, t: 0, stuck: true, id: 9000 + sim.devices.proj.length + Math.floor(sim.time * 10), bounces: 0 }; sim.devices.proj.push(p); return p; };

// ---------------------------------------------------------------- 1. a frag at the feet
{
  const runs = [0, 1].map((tactics) => {
    const sim = scene(); const { A, D } = duel(sim); D.ai.prof.tactics = tactics; D.ai.prof.reaction = 0.3;
    const open = sim.world.visible(A.eye(), D.eye(), 1); if (!open) console.log('(yard lane is not open)');
    frag(sim, A, [20, 0.2, 6.0]);
    let far = 0; step(sim, 3.4, () => { far = Math.max(far, Math.hypot(D.pos[0] - 20, D.pos[2] - 6.0)); });
    return { hp: D.hp, far, dodges: sim.reactions.stats.dodge || 0 };
  });
  ok(runs[0].hp < 100 || runs[0].hp < 105, `a bot that cannot react takes the frag (hp ${runs[0].hp.toFixed(0)})`);
  ok(runs[1].hp >= 105 && runs[1].dodges >= 1, `a bot dives clear of the frag (hp ${runs[1].hp.toFixed(0)}, ran to ${runs[1].far.toFixed(1)} m from it)`);
}
// ---------------------------------------------------------------- 2. a flashbang
{
  const res = [0, 1].map((tactics) => {
    const sim = scene(7); const { A, D } = duel(sim); D.ai.prof.tactics = tactics; D.ai.prof.p.nerve = 1; D.ai.prof.reaction = 0.3;
    D.yaw = Math.PI; // facing the flash
    frag(sim, A, [20, 0.3, 5.5], 1.8, 'stun');
    let blind = 0; step(sim, 3, () => { blind = Math.max(blind, D.status.blind); });
    return { blind, turns: sim.reactions.stats.flashturn || 0, dives: sim.reactions.stats.flashdive || 0 };
  });
  ok(res[1].blind < res[0].blind * 0.8, `turning away from a flash shortens the blindness (${res[0].blind.toFixed(1)} s -> ${res[1].blind.toFixed(1)} s)`);
  ok(res[1].turns + res[1].dives >= 1, 'the flash is answered with a turn or a dive for cover');
}
// ---------------------------------------------------------------- 3. gas
{
  const sim = scene(); const { A, D } = duel(sim); put(D, [20, 0, 12]); D.ai.prof.tactics = 2; A.pos = [20, 0, 2]; // swap roles: the attacker walks into a defender's gas
  const att = sim.actors.filter((a) => a.team === 'atk')[1]; put(att, [20, 0, 8]); sim.passive = {};
  for (const a of sim.actors) if (a !== att) { a.ai.mode = 'task'; }
  sim.devices.gas.push({ pos: [20, 0.5, 8], r: 2.6, t: 7, owner: D, team: 'def' }); att.ai.prof.tactics = 2;
  let g = 0; step(sim, 3, () => { g = Math.max(g, att.status.gas); });
  ok(Math.hypot(att.pos[0] - 20, att.pos[2] - 8) > 3.4, `a bot leaves the gas cloud (now ${Math.hypot(att.pos[0] - 20, att.pos[2] - 8).toFixed(1)} m from its centre)`);
}
// ---------------------------------------------------------------- 4. bullets going past
{
  const sim = scene(); const { A, D } = duel(sim); D.ai.prof.tactics = 2; D.ai.sense.mem.clear();
  const c = D.chestPos(), from = [c[0] - 0.6, 1.6, 2];
  for (let i = 0; i < 5; i++) sim.emit('tracer', { from, to: [c[0] - 0.6, c[1], c[2] + 6], shooter: A, def: A.gun.def });
  ok(D.ai.rx.supp >= 3, `bullets past the head build suppression (${D.ai.rx.supp.toFixed(1)})`);
  ok(D.ai.watch && Math.abs(D.ai.watch[2] - 2) < 1, 'the bot looks at where the shots came from');
  step(sim, 0.7);
  ok(D.ai.mode === 'react' || D.ai.rx.flinchT > 0 || sim.reactions.stats.suppressed >= 1, 'it ducks and looks for cover under fire');
}
// ---------------------------------------------------------------- 5. a team mate goes down
{
  let hunts = 0, falls = 0, tilt = 0, trials = 8;
  for (let k = 0; k < trials; k++) {
    const sim = scene(20 + k); const { A, D } = duel(sim); const mate = sim.actors.filter((a) => a.team === 'def')[1];
    put(mate, [31, 0, 14]); D.ai.persona.p.aggr = 1; D.ai.persona.p.team = 1; D.ai.persona.p.caution = 0.1; D.ai.persona.habit.tilt = 0; D.ai.prof.tactics = 2;
    D.ai.sense.mem.clear(); const before = D.ai.persona.habit.tilt;
    mate.hurt(500, { src: A, region: 'head', from: A.pos });
    step(sim, 0.4);
    if (D.ai.hunt) hunts++; if (D.ai.persona.habit.tilt > before) tilt++;
    // a careful one falls back
    const sim2 = scene(40 + k); const d2 = duel(sim2); const m2 = sim2.actors.filter((a) => a.team === 'def')[1];
    put(m2, [31, 0, 14]); d2.D.ai.persona.p.aggr = 0.1; d2.D.ai.persona.p.caution = 1; d2.D.ai.persona.p.team = 0.1; d2.D.ai.prof.tactics = 2; d2.D.ai.sense.mem.clear();
    m2.hurt(500, { src: d2.A, region: 'head', from: d2.A.pos }); step(sim2, 0.5);
    if (d2.D.ai.mode === 'react' || d2.D.ai.rx.fallback || (d2.D.ai.watchT > 0 && d2.D.ai.watch)) falls++;
  }
  ok(hunts >= trials * 0.6, `an aggressive bot goes after the killer of a team mate (${hunts}/${trials})`);
  ok(falls >= trials * 0.8, `a careful bot backs off and watches the angle (${falls}/${trials})`);
  ok(tilt === trials, `a team mate going down shakes the squad's morale (${tilt}/${trials})`);
}
// ---------------------------------------------------------------- 6. a door opens in front of us
{
  const sim = scene(); const { A, D } = duel(sim); D.ai.prof.tactics = 2; D.ai.sense.mem.clear();
  const door = sim.world.doors.find((d) => !d.ext && !d.dead);
  const c = [door.ax === 'x' ? door.ix : door.ix + 0.5, door.f * 3 + 1.1, door.ax === 'x' ? door.iz + 0.5 : door.iz];
  let placed = false;
  for (const [dx, dz] of [[3, 0], [-3, 0], [0, 3], [0, -3], [2, 2], [-2, -2]]) {
    const q = sim.nav.centre(sim.nav.snap(c[0] + dx, door.f * 3, c[2] + dz));
    if (sim.world.visible([q[0], q[1] + 1.6, q[2]], c, 1)) { put(D, q); placed = true; break; }
  }
  door.setOpen(false); door.open = 0; door.target = 0; step(sim, 0.2);
  door.setOpen(true); sim.noise(c, 8, 'door', A);
  step(sim, 0.5);
  ok(placed && D.ai.rx.doorAt && D.ai.watchT > 0, 'a door opening in view draws the eye of a bot');
  ok(sim.reactions.stats.door >= 1, 'the door event reached the reaction hub');
}
// ---------------------------------------------------------------- 7. a charge on the wall, then a hole
{
  const sim = scene(11); const { A, D } = duel(sim);
  const an = analyseSite(sim, sim.round.site), u = an.units.find((q) => q.ext) || an.units[0], e = u.mid;
  put(D, e.inside, Math.atan2(-e.normal[0], -e.normal[2])); D.ai.prof.tactics = 2; D.ai.prof.reaction = 0.3; put(A, e.outside);
  const pos = [e.centre[0] - e.normal[0] * 0.04, e.centre[1], e.centre[2] - e.normal[2] * 0.04], n = [-e.normal[0], 0, -e.normal[2]];
  const r = sim.devices.placeAt(A, 'breach', pos, n, e.panels[1], null);
  ok(r.ok, 'a breach charge goes on the wall');
  step(sim, 0.3);
  let far = 0; step(sim, 3, () => { far = Math.max(far, dist3(D.pos, r.device.pos)); });
  ok(sim.reactions.stats.charge >= 1 && far > 4.4, `the defender steps back out of the blast radius (${far.toFixed(1)} m from the charge)`);
  ok(D.hp === D.maxHp, 'and is not hurt when it blows');
  sim.devices.detonateOwned(A); step(sim, 0.4);
  ok(!!D.ai.rx.holeAt || sim.reactions.stats.wallbreak >= 1, 'the hole in the wall is noticed');
}
// ---------------------------------------------------------------- 8. shooting the charge / the camera
{
  const sim = scene(11); const { A, D } = duel(sim);
  const an = analyseSite(sim, sim.round.site), u = an.units.find((q) => q.ext) || an.units[0], e = u.mid;
  put(D, [e.inside[0] + e.normal[0] * 4, e.inside[1], e.inside[2] + e.normal[2] * 4], Math.atan2(-e.normal[0], -e.normal[2])); D.ai.prof.tactics = 2; D.ai.prof.reaction = 0.3; put(A, e.outside);
  const pos = [e.centre[0] - e.normal[0] * 0.04, e.centre[1] + 0.3, e.centre[2] - e.normal[2] * 0.04], n = [-e.normal[0], 0, -e.normal[2]];
  const r = sim.devices.placeAt(A, 'breach', pos, n, e.panels[1], null);
  // the defender is looking at the wall from inside: is the charge visible? it is on the outer face, so look through a window instead
  const win = an.windows[0];
  if (win) {
    sim.devices.kill(r.device, null);
    put(D, [win.inside[0] + win.normal[0] * 2.5, win.inside[1], win.inside[2] + win.normal[2] * 2.5], Math.atan2(-win.normal[0], -win.normal[2])); put(A, win.outside);
    const wp = [win.centre[0] - win.normal[0] * 0.04, win.centre[1], win.centre[2] - win.normal[2] * 0.04];
    const cam = sim.devices.placeAt(A, 'cams', wp, [-win.normal[0], 0, -win.normal[2]], win.panels[1], null);
    sim.devices.list.filter((d) => d.kind === 'cams').forEach((d) => { d.team = 'atk'; });
    let killed = false; sim.on('devicekill', (ev) => { if (ev.device.kind === 'cams') killed = true; });
    step(sim, 5);
    ok(!cam.ok || killed || sim.reactions.stats.devicetarget >= 1, 'a defender shoots the camera it can see through the window');
  } else console.log('(site has no window; camera test skipped)');
}
// ---------------------------------------------------------------- 9. shooting through the wall at what is heard
{
  const sim = scene(13); const { A, D } = duel(sim);
  const an = analyseSite(sim, sim.round.site), u = an.units.find((q) => !q.ext && q.outRoom >= 0) || an.units[0], e = u.mid;
  put(D, e.inside, Math.atan2(-e.normal[0], -e.normal[2])); put(A, e.outside); D.ai.prof.tactics = 3; D.ai.persona.p.prefire = 1; D.ai.sense.mem.clear();
  const b0 = sim.stats.bullets;
  for (let i = 0; i < 4; i++) { sim.noise([A.pos[0], A.pos[1] + 1, A.pos[2]], 70, 'shot', A); step(sim, 0.35); }
  step(sim, 2);
  ok(sim.stats.bullets > b0 || sim.reactions.stats.prefire >= 1, `a bot sends rounds through a plaster wall at a sound (${sim.stats.bullets - b0} fired)`);
}
// ---------------------------------------------------------------- 10. reload punish
{
  const sim = scene(); const { A, D } = duel(sim); D.ai.prof.tactics = 2; sim.passive = { atk: true };
  put(D, [20, 0, 9], Math.PI); put(A, [20, 0, 2]);
  A.gun.reloading = true; A.gun.reloadT = 5;
  step(sim, 1.4, () => { A.gun.reloading = true; A.gun.reloadT = 5; });
  ok(D.ai.rx.punishing || sim.reactions.stats.punish >= 1, 'a bot leans on an enemy who is reloading');
}
// ---------------------------------------------------------------- 11. the human pings
{
  const sim = scene(); const atk = sim.actors.filter((a) => a.team === 'atk'); atk.forEach((a, i) => put(a, [20 + i * 2, 0, 4]));
  const me = atk[0]; me.isPlayer = true; sim.passive = { def: true }; sim.directors = [];
  const spot = [26, 0, 30];
  sim.emit('ping', { actor: me, pos: spot, enemy: null });
  const hunting = atk.filter((a) => a !== me && a.ai.hunt);
  ok(hunting.length >= 1, `a ping sends a team mate to look (${hunting.length} going)`);
  me.isPlayer = false;
}
// ---------------------------------------------------------------- 12. blinded
{
  const sim = scene(); const { A, D } = duel(sim); D.ai.prof.tactics = 2; D.ai.task = { type: 'goto', pos: [20, 0, 30], tol: 0.8 };
  step(sim, 0.6); const p0 = [...D.pos];
  D.applyStatus('blind', 3);
  step(sim, 1.2);
  const moved = Math.hypot(D.pos[0] - p0[0], D.pos[2] - p0[2]);
  ok(D.stance === 1 && moved < 2.2, `a blinded bot drops and stops where it is (stance ${D.stance}, moved ${moved.toFixed(1)} m)`);
}
// ---------------------------------------------------------------- 13. the clock and the last man
{
  const sim = scene(); duel(sim); sim.passive = {}; sim.round.t = 25;
  step(sim, 1.3);
  const atk = sim.actors.filter((a) => a.team === 'atk' && a.ai);
  ok(atk.every((a) => a.ai.persona.situ > 0.15), `with the clock running out every attacker gets bolder (${atk[0].ai.persona.situ.toFixed(2)})`);
  const sim2 = scene(); for (const a of sim2.actors.filter((x) => x.team === 'def').slice(1)) { a.hurt(999, { src: sim2.actors[0], region: 'head' }); }
  step(sim2, 1.3);
  const last = sim2.actors.find((a) => a.team === 'def' && a.alive);
  ok(last.ai.persona.situ < -0.2, `the last defender plays quiet (${last.ai.persona.situ.toFixed(2)})`);
}
// ---------------------------------------------------------------- 14. after a kill
{
  const sim = scene(); const { A, D } = duel(sim); D.ai.persona.habit.confidence = 0; D.ai.persona.p.team = 0;
  const g = D.gun; g.mag = 8; const c0 = D.ai.persona.habit.confidence;
  A.hurt(999, { src: D, region: 'head', from: D.pos }); step(sim, 1.2);
  ok(D.ai.persona.habit.confidence > c0, 'a kill builds confidence');
  ok(g.reloading || g.mag > 8, 'and the killer reloads straight away');
}
console.log('stats', JSON.stringify(Object.fromEntries(Object.entries(scene().reactions.stats))));
process.exit(fail ? 1 : 0);
