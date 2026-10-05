// Furniture, lamps and walls under fire: props take damage and break (all the boxes of a piece at once), the
// cells they filled open up for walking, sight and bullets, explosions clear what is in reach but not what is
// behind a wall, and a bullet that goes through a wall leaves an exit hole.  node tools/test-destruction.mjs
import { HARBOR } from '../src/siege/data/harbor.js';
import { Sim } from '../src/siege/sim/sim.js';
import { setupRound } from '../src/siege/sim/setup.js';
import { DURABILITY } from '../src/siege/world/props.js';
let fail = 0; const ok = (c, m) => { if (!c) fail++; console.log((c ? 'ok   ' : 'FAIL ') + m); };
const sim = new Sim(HARBOR, { seed: 5, difficulty: 2 });
setupRound(sim, { level: 2, site: 0, spawn: 'south' });
sim.passive = { atk: true, def: true }; sim.round.phase = 'action'; sim.round.t = 180;
const w = sim.world, nav = sim.nav, atk = sim.actors.find((a) => a.team === 'atk');
const shooterAt = (p, tgt) => { atk.pos = [p[0], p[1], p[2]]; atk.vel = [0, 0, 0]; const e = atk.eye(); const d = [tgt[0] - e[0], tgt[1] - e[1], tgt[2] - e[2]], l = Math.hypot(...d); atk.yaw = Math.atan2(d[0], d[2]); atk.pitch = Math.asin(d[1] / l); };
const fire = (tgt) => { const g = atk.gun; g.mag = 30; g.cd = 0; g.draw = 0; sim.fire(atk, g, false); };
const pieces = (kind) => { const seen = new Set(); return w.props.filter((p) => p.kind === kind && p.pid && !seen.has(p.pid) && seen.add(p.pid)); };

// ---------------------------------------------------------------- 1. durability table is wired to the map
const breakables = new Set(w.props.filter((p) => p.hp < Infinity && p.pid && p.kind !== 'lamp').map((p) => p.kind));
ok(breakables.size >= 12, `the map has ${breakables.size} kinds of breakable furniture (${[...breakables].slice(0, 8).join(', ')}...)`);
ok(!w.props.some((p) => p.kind === 'container' && p.hp < Infinity), 'containers and barriers stay as scenery');
ok(Object.keys(DURABILITY).every((k) => DURABILITY[k].hp > 0 && DURABILITY[k].mat), 'every durability entry has hit points and a material');
const lamps = w.props.filter((p) => p.kind === 'lamp');
ok(lamps.length >= 20 && lamps.every((l) => sim.map.lights[l.light]), `${lamps.length} ceiling lamps can be shot out, each tied to its light`);

// ---------------------------------------------------------------- 2. shooting a desk
{
  const d = w.props.find((p) => p.kind === 'desk' && p.pid && p.max[1] < 1.2);
  const c = [(d.min[0] + d.max[0]) / 2, (d.min[1] + d.max[1]) / 2, (d.min[2] + d.max[2]) / 2];
  // a spot 4 m away with a clear shot
  let from = null;
  for (let r = 2; r <= 5 && !from; r += 0.5) for (let k = 0; k < 16 && !from; k++) {
    const a = (k / 16) * Math.PI * 2, q = [c[0] + Math.sin(a) * r, d.min[1], c[2] + Math.cos(a) * r], e = [q[0], q[1] + 1.6, q[2]];
    const dir = [c[0] - e[0], c[1] - e[1], c[2] - e[2]], l = Math.hypot(...dir), h = w.cast(e[0], e[1], e[2], dir[0] / l, dir[1] / l, dir[2] / l, l + 1, 0);
    if (h && h.prop === d && nav.walkable(Math.floor(q[0]), Math.floor(q[2]), 0)) from = q;
  }
  ok(!!from, 'there is a firing spot with a clear line to the desk');
  const hp0 = d.hp; let broke = false, damaged = 0, shots = 0;
  w.on('propbreak', (e) => { if (e.prop === d) broke = true; }); w.on('propdamage', (e) => { if (e.prop === d) damaged++; });
  while (!broke && shots < 120) { shooterAt(from, c); fire(c); shots++; sim.update(1 / 30); }
  ok(damaged > 0 && d.hp < hp0, `bullets wear the desk down (${damaged} hits, hp ${hp0} -> ${Math.max(0, d.hp).toFixed(0)})`);
  ok(broke && d.dead, `and it breaks after ${shots} rounds`);
  ok(!w.props.includes(d) && !w.props.some((p) => p.pid === d.pid), 'all of its boxes leave the world together');
  shooterAt(from, c); const e = atk.eye();
  ok(w.visible(e, [c[0], d.max[1] + 0.1, c[2]], 1), 'the line of sight across the desk is open');
}

// ---------------------------------------------------------------- 3. a broken crate frees its cells for walking
{
  const cr = w.props.find((p) => p.kind === 'crate' && p.pid && p.max[0] - p.min[0] > 0.8 && p.min[1] < 0.1);
  const x = Math.floor((cr.min[0] + cr.max[0]) / 2), z = Math.floor((cr.min[2] + cr.max[2]) / 2), n = nav.node(x, z, 0);
  const wasBlocked = nav.blocked[n] === 1 || nav.partial[n] === 1;
  w.breakProp(cr, {});
  ok(wasBlocked ? nav.blocked[n] === 0 : true, `the cell under a crate opens for the pathfinder (was blocked: ${wasBlocked})`);
  ok(sim.noises.some((q) => q.kind === 'prop'), 'breaking furniture makes a noise the bots can hear');
}

// ---------------------------------------------------------------- 4. a lamp
{
  const l = lamps[0], li = sim.map.lights[l.light];
  let evt = null; w.on('propbreak', (e) => { if (e.prop === l) evt = e; });
  const tgt = [(l.min[0] + l.max[0]) / 2, (l.min[1] + l.max[1]) / 2, (l.min[2] + l.max[2]) / 2];
  const from = [tgt[0], l.min[1] - 2.7, tgt[2] - 3]; // inside the same room, below and to the side
  // shoot straight up at it from the floor under it so the ray is certain to cross it
  shooterAt([tgt[0], l.min[1] - 2.75, tgt[2]], [tgt[0], tgt[1], tgt[2] + 0.01]); atk.pitch = 1.45; atk.yaw = 0; fire(); sim.update(1 / 30);
  void from;
  ok(!!evt && evt.prop.light === sim.map.lights.indexOf(li), 'a bullet through a ceiling lamp breaks it and names its light');
}
{
  // an explosion clears every lamp in its reach
  const room = lamps.filter((l) => !l.dead)[0]; const cen = [(room.min[0] + room.max[0]) / 2, room.min[1] - 1.2, (room.min[2] + room.max[2]) / 2];
  const near = w.props.filter((p) => !p.dead && p.hp < Infinity && Math.hypot((p.min[0] + p.max[0]) / 2 - cen[0], (p.min[2] + p.max[2]) / 2 - cen[2]) < 3 && Math.abs((p.min[1] + p.max[1]) / 2 - cen[1]) < 3);
  let n = 0; w.on('propbreak', () => n++);
  sim.explode(cen, { radius: 4.6, dmg: 150, power: 140, src: atk, kind: 'frag' });
  ok(near.length === 0 || n >= 1, `a frag breaks the furniture and lamps around it (${n} of ${near.length} in range went)`);
}

// ---------------------------------------------------------------- 5. an explosion does not reach through a wall
{
  const sim2 = new Sim(HARBOR, { seed: 5, difficulty: 2 }); setupRound(sim2, { level: 2, site: 0, spawn: 'south' });
  const w2 = sim2.world;
  // a desk and a point on the other side of a wall from it
  let pair = null;
  for (const d of w2.props.filter((p) => p.kind === 'desk' && p.pid)) {
    const c = [(d.min[0] + d.max[0]) / 2, 1.0, (d.min[2] + d.max[2]) / 2];
    for (const [dx, dz] of [[3.5, 0], [-3.5, 0], [0, 3.5], [0, -3.5]]) { const q = [c[0] + dx, 1.0, c[2] + dz]; const h = w2.cast(q[0], q[1], q[2], -dx / 3.5, 0, -dz / 3.5, 3.3, 3); if (h && h.panel) { pair = { d, q }; break; } }
    if (pair) break;
  }
  if (pair) { const hp0 = pair.d.hp; sim2.explode(pair.q, { radius: 5, dmg: 150, power: 140, src: sim2.actors[0], kind: 'frag' }); ok(pair.d.hp === hp0, 'a wall shields furniture from a blast'); }
  else console.log('(no desk behind a wall found; skipped)');
}

// ---------------------------------------------------------------- 6. a bullet through a wall leaves an exit hole
{
  const sim3 = new Sim(HARBOR, { seed: 5, difficulty: 2 }); const w3 = sim3.world; setupRound(sim3, { level: 2, site: 0, spawn: 'south' });
  sim3.passive = { atk: true, def: true }; sim3.round.phase = 'action';
  const a3 = sim3.actors.find((a) => a.team === 'atk');
  // find an interior plaster panel with open space either side
  let done = false, exit = null, entry = null;
  sim3.on('impact', (e) => { if (e.kind === 'exit') exit = e; else if (e.kind === 'wall' && !entry) entry = e; });
  for (let ix = 15; ix < 40 && !done; ix++) for (let iz = 15; iz < 30 && !done; iz++) {
    const p = w3.getX(ix, 0, iz); if (!p || p.dead || p.mat !== 'plaster' || p.ext || p.door) continue;
    const from = [ix - 2, 1.4, iz + 0.5], to = [ix + 2, 1.4, iz + 0.5];
    if (w3.cast(from[0], from[1], from[2], 1, 0, 0, 1.9, 0) || w3.cast(ix + 0.2, 1.4, iz + 0.5, 1, 0, 0, 1.8, 0)) continue;
    a3.pos = [from[0], 0, from[2]]; a3.yaw = Math.PI / 2; a3.pitch = 0; const g = a3.gun; g.mag = 30; g.cd = 0; g.draw = 0;
    exit = null; entry = null; sim3.fire(a3, g, false); if (exit) done = true; void to;
  }
  ok(!!exit && Math.abs(exit.normal[0]) > 0.9, 'a round through drywall leaves an exit hole on the far face');
  ok(!!exit && exit.pos[0] > (entry ? entry.pos[0] : -1), 'and it is behind the entry hole');
}

// ---------------------------------------------------------------- 7. the hammer breaks furniture
{
  const t = w.props.find((p) => p.kind === 'plant' && p.pid && !p.dead);
  if (t) {
    const c = [(t.min[0] + t.max[0]) / 2, 1.0, (t.min[2] + t.max[2]) / 2]; atk.pos = [c[0] - 1.2, t.min[1], c[2]]; atk.vel = [0, 0, 0]; atk.yaw = Math.PI / 2; atk.pitch = Math.atan2(t.min[1] + 0.6 - atk.eye()[1], 1.2);
    for (let i = 0; i < 4 && !t.dead; i++) sim.devices.melee(atk, { hammer: true });
    ok(t.dead, 'a plant pot does not survive a swing');
  }
}
process.exit(fail ? 1 : 0);
