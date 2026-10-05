// How much of each attacker spawn can be seen from the building's windows and doors?
// node tools/spawn-exposure.mjs
import { HARBOR } from '../src/siege/data/harbor.js';
import { Sim } from '../src/siege/sim/sim.js';
import { CAST } from '../src/siege/world/grid.js';
const sim = new Sim(HARBOR, { seed: 1 }), w = sim.world, d = HARBOR;
// every opening in the outer walls, at eye height
const spots = [];
for (const [fl, x, z, side, kind, count = 1] of d.openings) {
  if (!['door', 'win', 'open', 'arch'].includes(kind)) continue;
  for (let k = 0; k < count; k++) {
    const outer = (side === 'S' && z === 0) || (side === 'N' && z >= d.bd - 1) || (side === 'W' && x === 0) || (side === 'E' && x >= d.bw - 1);
    if (!outer) continue;
    const cx = x + (side === 'N' || side === 'S' ? k : 0), cz = z + (side === 'E' || side === 'W' ? k : 0);
    const px = d.bx + cx + (side === 'E' ? 1 : side === 'W' ? 0 : 0.5), pz = d.bz + cz + (side === 'N' ? 1 : side === 'S' ? 0 : 0.5);
    // stand one metre inside
    const ix = px + (side === 'E' ? -1 : side === 'W' ? 1 : 0), iz = pz + (side === 'N' ? -1 : side === 'S' ? 1 : 0);
    spots.push({ p: [ix, (fl - 1) * 3 + 1.6, iz], kind, fl, side });
  }
}
let worst = 0;
for (const sp of sim.map.spawns) {
  let seen = 0, total = 0; const by = {};
  for (let x = sp.x0; x <= sp.x1; x += 1) for (let z = sp.z0; z <= sp.z1; z += 1) {
    total++; let hit = null;
    for (const s of spots) {
      const dd = Math.hypot(s.p[0] - x, s.p[2] - z); if (dd > 45) continue;
      if (w.visible(s.p, [x, 1.1, z], CAST.GLASS)) { hit = s; break; }
    }
    if (hit) { seen++; by[`${hit.fl}F ${hit.kind} ${hit.side}`] = (by[`${hit.fl}F ${hit.kind} ${hit.side}`] || 0) + 1; }
  }
  const pct = Math.round((seen / total) * 100); worst = Math.max(worst, pct);
  console.log(`${sp.id.padEnd(10)} ${pct}% of the zone is in view of an opening ${Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => k + ' x' + v).join(', ')}`);
}
console.log(`${spots.length} outer openings checked, worst spawn ${worst}% exposed`);
