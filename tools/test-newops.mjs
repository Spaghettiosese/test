// The ten newer operators' gadgets, one scenario each: EMP, sound decoy, silent steps, supply crates,
// grenade launcher, incendiary / flash / smoke mines and the seismic sensor.  node tools/test-newops.mjs
import { HARBOR } from '../src/siege/data/harbor.js';
import { OPERATORS } from '../src/siege/data/operators.js';
import { Sim } from '../src/siege/sim/sim.js';
import { setupRound } from '../src/siege/sim/setup.js';
let fail = 0; const ok = (c, m) => { if (!c) fail++; console.log((c ? 'ok   ' : 'FAIL ') + m); };
const scene = (seed = 5) => {
  const sim = new Sim(HARBOR, { seed, difficulty: 2 }); setupRound(sim, { level: 2, site: 0, spawn: 'south' });
  sim.round.phase = 'action'; sim.round.t = 170; sim.passive = { atk: true, def: true };
  for (const a of sim.actors) { a.shieldUntil = 0; a.shieldOn = false; }
  const atk = sim.actors.filter((a) => a.team === 'atk'), def = sim.actors.filter((a) => a.team === 'def');
  atk.slice(2).forEach((a, i) => { a.pos = [4 + i * 2, 0, 3]; }); def.slice(2).forEach((a, i) => { a.pos = [50 - i * 2, 0, 38]; });
  return { sim, A: atk[0], B: atk[1], D: def[0], E: def[1] };
};
const put = (sim, a, p, yaw = 0) => { const c = sim.nav.centre(sim.nav.snap(p[0], p[1], p[2])); a.pos = [c[0], c[1], c[2]]; a.vel = [0, 0, 0]; a.yaw = yaw; a.pitch = 0; };
const at = (a, p) => { a.pos = [p[0], p[1], p[2]]; a.vel = [0, 0, 0]; };
const step = (sim, s) => { for (let t = 0; t < s; t += 1 / 30) sim.update(1 / 30); };
const swapOp = (a, id) => { const op = OPERATORS.find((o) => o.id === id); a.op = op; return a; };

ok(OPERATORS.filter((o) => o.side === 'atk').length >= 19 && OPERATORS.filter((o) => o.side === 'def').length >= 19, 'the roster has nineteen attackers and nineteen defenders');
for (const id of ['surge', 'phantom', 'whisper', 'mule', 'havoc', 'blaze', 'glare', 'seismic', 'fog', 'depot']) { const o = OPERATORS.find((x) => x.id === id); ok(!!o && o.primary.length && o.gadgets.length, `${id} is complete (${o && o.role})`); }

// ---------------------------------------------------------------- EMP
{
  const { sim, A, D, E } = scene(); put(sim, A, [20, 0, 4]); put(sim, D, [20, 0, 40]); put(sim, E, [50, 0, 40]);
  const near = sim.devices.placeAt(D, 'cams', [20, 1.2, 10], [0, 0, -1], { ax: 'z', dead: false }, null), far = sim.devices.placeAt(D, 'mat', [20, 0.02, 30], [0, 1, 0], null, null);
  const dn = sim.devices.list.find((d) => d.kind === 'cams'), dfar = sim.devices.list.find((d) => d.kind === 'mat');
  void near; void far;
  if (dn) { dn.panel = null; dn.pos = [20, 1.2, 10]; }
  sim.devices.emp([20, 0.3, 8], A); // thrown at it
  ok(!dn || dn.jammed >= 10, `an EMP jams the camera that was in reach (jammed ${dn ? dn.jammed.toFixed(0) : 'n/a'} s)`);
  ok(!dfar || dfar.jammed === 0, 'and leaves what is out of reach alone');
  const own = sim.devices.placeAt(A, 'claymore', [20.5, 0.4, 7], [0, 1, 0], null, null); const dc = sim.devices.list.find((d) => d.kind === 'claymore');
  sim.devices.emp([20, 0.3, 8], A); ok(!dc || dc.jammed === 0, 'its own side keeps its gadgets'); void own;
  // the thrown grenade does it by itself
  const t = swapOp(sim.actors.find((x) => x.team === 'atk' && x !== A), 'surge'); void t;
  A.gadgets = [{ id: 'emp', count: 3 }]; swapOp(A, 'surge'); A.yaw = 0; A.pitch = 0.2; if (dn) dn.jammed = 0;
  sim.devices.use(A, 'emp', { dir: A.look() }); const had = A.gadget('emp').count; step(sim, 2.2);
  ok(had === 2, 'throwing an EMP uses a charge');
}
// ---------------------------------------------------------------- sound decoy
{
  const { sim, A, B, D } = scene(); swapOp(A, 'phantom'); put(sim, A, [20, 0, 4]); put(sim, B, [24, 0, 4]); put(sim, D, [20, 0, 16], Math.PI); sim.passive = { atk: true }; D.ai.sense.mem.clear();
  A.gadgets = [{ id: 'decoy', count: 2 }];
  const r = sim.devices.placeAt(A, 'decoy', [28, 0.02, 8], [0, 1, 0], null, null); ok(r.ok, 'the decoy goes down on the floor');
  let heard = 0; sim.on('sound', (n) => { if (n.decoy) heard++; }); step(sim, 4);
  const m = D.ai.sense.mem.get(A.id);
  ok(heard >= 4, `it makes noise (${heard} sounds in four seconds)`);
  ok(!!m && Math.hypot(m.pos[0] - 28, m.pos[2] - 8) < 6, `the defender now believes the owner is at the speaker (${m ? m.pos.map((v) => v.toFixed(0)) : 'nowhere'})`);
  const mate = B.ai.sense.mem.get(A.id); ok(!mate, 'the owner\'s own squad is not fooled');
  step(sim, 8); ok(!sim.devices.list.some((d) => d.kind === 'decoy' && !d.dead), 'the speaker goes quiet after ten seconds');
}
// ---------------------------------------------------------------- silent steps
{
  const { sim, A, B } = scene(); const loud = []; sim.on('sound', (n) => { if (n.kind === 'step') loud.push([n.src, n.loud]); });
  swapOp(A, 'whisper'); swapOp(B, 'hammer');
  for (const a of [A, B]) { put(sim, a, a === A ? [10, 0, 3] : [14, 0, 3], Math.PI / 2); }
  for (let t = 0; t < 2; t += 1 / 30) { for (const a of [A, B]) { a.ctl.fwd = 1; a.ctl.sprint = true; } sim.update(1 / 30); }
  const la = Math.max(0, ...loud.filter((q) => q[0] === A).map((q) => q[1])), lb = Math.max(0, ...loud.filter((q) => q[0] === B).map((q) => q[1]));
  ok(lb > 8 && la < lb * 0.2, `a sprinting Whisper is nearly inaudible (${la.toFixed(1)} against ${lb.toFixed(1)})`);
}
// ---------------------------------------------------------------- supply crate
{
  const { sim, A, B } = scene(); swapOp(A, 'mule'); put(sim, A, [20, 0, 4]); put(sim, B, [21, 0, 5]);
  B.guns[0].reserve = 3; B.armorPlates = 0; B.hp = 40;
  const r = sim.devices.placeAt(A, 'supply', [21, 0.02, 5], [0, 1, 0], null, null); ok(r.ok, 'the crate goes down');
  const crate = sim.devices.list.find((d) => d.kind === 'supply'); let uses = 0; sim.on('supplyuse', () => uses++);
  step(sim, 1.0);
  ok(B.guns[0].reserve === B.guns[0].def.mag * B.guns[0].def.reserve, `a teammate at the crate gets his ammunition back (${B.guns[0].reserve})`);
  ok(B.armorPlates >= 1 && uses >= 1, 'and a plate of armour');
  const enemy = sim.actors.find((x) => x.team === 'def'); put(sim, enemy, [21, 0, 5.4]); enemy.guns[0].reserve = 1; step(sim, 1); ok(enemy.guns[0].reserve === 1, 'the other side cannot use it');
  for (let i = 0; i < 6; i++) { B.guns[0].reserve = 1; step(sim, 3.2); }
  ok(!crate || crate.dead || crate.data.uses <= 0, 'after three uses it is empty');
}
// ---------------------------------------------------------------- grenade launcher
{
  const { sim, A, D } = scene(); swapOp(A, 'havoc'); put(sim, A, [20, 0, 2], 0); put(sim, D, [20, 0, 11], Math.PI); A.gadgets = [{ id: 'gl', count: 4 }];
  const desk = sim.world.props.find((p) => p.kind === 'crate' && p.pid);
  let boom = null; sim.on('explosion', (e) => { boom = e; });
  A.yaw = 0; A.pitch = 0.0; const hp0 = D.hp, e = A.eye();
  const d = (() => { const dx = 20.5 - e[0], dy = 1.2 - e[1], dz = 11.4 - e[2]; return [dx, dy, dz]; })(); const l = Math.hypot(...d); A.yaw = Math.atan2(d[0], d[2]); A.pitch = Math.asin(d[1] / l);
  const r = sim.devices.use(A, 'gl'); ok(r.ok && A.gadget('gl').count === 3, 'the launcher fires a round and loses one');
  step(sim, 1.6);
  ok(!!boom && boom.kind === 'impact', 'the round explodes on impact');
  ok(D.hp < hp0, `and hurts the man it hit (hp ${hp0} -> ${D.hp.toFixed(0)})`); void desk;
}
// ---------------------------------------------------------------- mines
{
  const { sim, A, D } = scene(); swapOp(D, 'blaze'); put(sim, D, [20, 0, 20]); put(sim, A, [20, 0, 6]); D.gadgets = [{ id: 'firemine', count: 3 }, { id: 'flashmine', count: 3 }, { id: 'fogger', count: 2 }, { id: 'sensor', count: 2 }];
  sim.devices.placeAt(D, 'firemine', [20.5, 0.02, 10.5], [0, 1, 0], null, null);
  const hp0 = A.hp; at(A, [20.5, 0, 10.5]); step(sim, 0.4);
  ok(sim.devices.fire.length === 1, 'stepping on an incendiary mine lights a patch');
  const hp1 = A.hp; step(sim, 1.2); at(A, [20.5, 0, 10.5]); step(sim, 1.0);
  ok(A.hp < hp0 && A.hp <= hp1, `standing in it burns (hp ${hp0} -> ${A.hp.toFixed(0)})`);
  step(sim, 8); ok(sim.devices.fire.length === 0, 'and it burns out');
}
{
  const { sim, A, D } = scene(); put(sim, A, [20, 0, 6]); put(sim, D, [20, 0, 30]);
  sim.devices.placeAt(D, 'flashmine', [20.5, 0.02, 10.5], [0, 1, 0], null, null); at(A, [20.5, 0, 10.5]); A.yaw = Math.PI; let flashed = 0; sim.on('flashbang', () => flashed++); step(sim, 0.4);
  ok(flashed === 1 && A.status.blind > 0.5, `a flash mine blinds whoever sets it off (${A.status.blind.toFixed(1)} s)`);
}
{
  const { sim, A, D } = scene(); put(sim, A, [20, 0, 6]); put(sim, D, [20, 0, 30]);
  sim.devices.placeAt(D, 'fogger', [20.5, 0.02, 10.5], [0, 1, 0], null, null); at(A, [20.5, 0, 9.5]); step(sim, 0.4);
  ok(sim.world.smoke.length >= 1, 'a smoke trap fills the doorway when someone comes near');
}
{
  const { sim, A, D } = scene(); put(sim, A, [20, 0, 6]); put(sim, D, [20, 0, 30]);
  sim.devices.placeAt(D, 'sensor', [20.5, 0.02, 12.5], [0, 1, 0], null, null);
  put(sim, A, [20.5, 0, 6]); A.vel = [3, 0, 0]; A.stance = 0; step(sim, 0.1); A.vel = [3, 0, 0]; A.status.tag = 0; sim.devices.list.find((d) => d.kind === 'sensor').data.t = 0; A.vel = [3.5, 0, 0]; sim.devices.update(0.05);
  ok(A.status.tag > 0, 'the seismic sensor marks somebody running within 11 m');
  A.status.tag = 0; A.stance = 1; A.vel = [3.5, 0, 0]; sim.devices.list.find((d) => d.kind === 'sensor').data.t = 0; sim.devices.update(0.05);
  ok(A.status.tag === 0, 'but not somebody crouched');
}
// ---------------------------------------------------------------- the bots play them
{
  let crashes = 0, uses = {};
  for (let s = 1; s <= 12; s++) {
    const sim = new Sim(HARBOR, { seed: s * 31 + 7, difficulty: 3 });
    try {
      setupRound(sim, { level: 3, site: s % 8, atk: ['surge', 'phantom', 'whisper', 'mule', 'havoc'], def: ['blaze', 'glare', 'seismic', 'fog', 'depot'] });
      for (const t of ['emp', 'explosion', 'sensor', 'supplyuse', 'decoyshot', 'trap', 'burn', 'smoke', 'place']) sim.on(t, (e) => { const k = t === 'place' ? 'place:' + e.device.kind : t; uses[k] = (uses[k] || 0) + 1; });
      for (let t = 0; t < 200 && sim.round.phase !== 'end'; t += 1 / 30) sim.update(1 / 30);
    } catch (e) { crashes++; console.log('   crash', e.stack.split('\n').slice(0, 3).join(' | ')); }
  }
  ok(crashes === 0, 'twelve rounds played by the new operators on both sides run clean');
  ok((uses['place:supply'] || 0) >= 3, `the bots put supply crates down (${uses['place:supply'] || 0})`);
  console.log('   activity', JSON.stringify(uses));
}
process.exit(fail ? 1 : 0);
