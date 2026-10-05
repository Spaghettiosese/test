// Checks the map: every doorway, arch and opening needs a clear approach on both sides (a body
// must be able to stand there), and every bomb spot must be reachable: node tools/map-lint.mjs
import { HARBOR } from '../src/siege/data/harbor.js';
import { Sim } from '../src/siege/sim/sim.js';
const sim = new Sim(HARBOR, { seed: 1 }); const w = sim.world, d = HARBOR, nav = sim.nav;
const R = 0.34;
const hits = (px, pz, f) => w.props.filter((p) => p.solid && !p.walk && p.kind !== 'rail' && !p.stair && p.max[1] > f * 3 + 0.3 && p.min[1] < f * 3 + 1.7 && Math.max(p.min[0] - px, 0, px - p.max[0]) ** 2 + Math.max(p.min[2] - pz, 0, pz - p.max[2]) ** 2 < R * R);
let bad = 0;
for (const [fl, x, z, side, kind, count = 1] of d.openings) {
  if (!['door', 'open', 'arch'].includes(kind)) continue;
  const f = fl - 1;
  for (let k = 0; k < count; k++) {
    const dx = side === 'E' ? 1 : side === 'W' ? -1 : 0, dz = side === 'N' ? 1 : side === 'S' ? -1 : 0;
    const cx = x + (dz ? k : 0), cz = z + (dx ? k : 0);
    // the doorway line: cell centres on both sides
    const a = [d.bx + cx + 0.5, d.bz + cz + 0.5], b = [a[0] + dx, a[1] + dz];
    for (const [px, pz] of [a, b, [a[0] + dx * 0.5, a[1] + dz * 0.5], [a[0] - dx * 0.5, a[1] - dz * 0.5], [b[0] + dx * 0.5, b[1] + dz * 0.5]]) {
      const h = hits(px, pz, f);
      if (h.length) { bad++; console.log(`floor ${fl} ${kind} at rel (${cx},${cz}) ${side}: ${h.map((p) => p.kind + ' [' + p.min.map((v) => v.toFixed(1)) + ']-[' + p.max.map((v) => v.toFixed(1)) + ']').join(' ; ')}`); break; }
    }
  }
}
console.log(`${bad} blocked doorway approaches`); if (bad) process.exitCode = 1;
// reachability of the bomb spots from every attacker spawn
const seenFrom = (sx, sz) => { const s = nav.snap(sx, 0, sz), seen = new Set([s]), q = [s]; while (q.length) { const n = q.pop(); nav.each(n, (m) => { if (!seen.has(m)) { seen.add(m); q.push(m); } }, false); } return seen; };
for (const sp of sim.map.spawns) {
  const seen = seenFrom(sp.cx, sp.cz);
  for (const s of sim.map.sites) for (const [label, p] of [['A', s.a], ['B', s.b], ['centre', s.center]]) if (!seen.has(nav.snap(p[0], p[1], p[2]))) { process.exitCode = 1; console.log(`UNREACHABLE from ${sp.id}: ${s.name} ${label}`); }
}

// no route should be absurdly longer than the straight line (a doorway plugged by furniture sends bots round the block)
{
  const len = (path, from) => { let d = 0, px = from[0], pz = from[1]; for (const st of path) { const [x, z] = nav.standXZ(st.node); d += Math.hypot(x - px, z - pz); px = x; pz = z; } return d; };
  let worst = 0, wname = '';
  for (const sp of sim.map.spawns) for (const s of sim.map.sites) {
    const from = nav.snap(sp.cx, 0, sp.cz), to = nav.snap(s.center[0], s.center[1], s.center[2]);
    const path = nav.find(from, to); if (!path) continue;
    const sx = nav.standXZ(from), straight = Math.hypot(s.center[0] - sx[0], s.center[2] - sx[1]) + (s.f ? 10 : 0), ratio = len(path, sx) / Math.max(10, straight);
    if (ratio > worst) { worst = ratio; wname = `${sp.id} -> ${s.name} (${len(path, sx).toFixed(0)} m for ${straight.toFixed(0)} m)`; }
    if (ratio > 3.6) { process.exitCode = 1; console.log(`LONG ROUTE ${sp.id} -> ${s.name}: ${len(path, sx).toFixed(0)} m for ${straight.toFixed(0)} m straight`); }
  }
  console.log(`worst route ratio ${worst.toFixed(2)}: ${wname}`);
}
