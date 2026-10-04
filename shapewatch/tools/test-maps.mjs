// Every map: spawns reach each other, the objective, every health pack, and most roofs.
import { MAPS, makeLevel, buildNav, floodNav, nodeAt, snapNav } from '../src/maps.js';
let failed = 0;
const bad = (m) => { failed++; console.log('  FAIL', m); };
for (const id of Object.keys(MAPS)) {
  const t0 = Date.now(), level = makeLevel(id, MAPS[id].modes[0]), nav = buildNav(level), seen = floodNav(nav, level.spawns[0][2]);
  const reach = (p) => { const n = nodeAt(nav, snapNav(nav, p)); return n >= 0 && seen[n]; };
  console.log(id.padEnd(10), 'boxes', level.boxes.length, 'nav', nav.W + 'x' + nav.D, 'build ms', Date.now() - t0);
  for (let t = 0; t < 2; t++) for (const p of level.spawns[t]) if (!reach(p)) bad(`spawn ${t} at ${p} not connected`);
  for (const p of level.packs) if (!reach(p.pos)) bad(`pack at ${p.pos} unreachable`);
  for (const p of level.points) if (!reach([p.pos[0] + 4, 0, p.pos[2]])) bad(`point ${p.name} unreachable`);
  if (level.path) { for (const [x, z] of level.path) if (!reach([x, 0, z])) bad(`path node ${x},${z} unreachable`); for (let d = 0; d < level.pathLen; d += 5) { const s = level.pathInfo.seg.find((q) => d <= q.s + q.l) || level.pathInfo.seg.at(-1), tt = (d - s.s) / s.l; const x = s.a[0] + (s.b[0] - s.a[0]) * tt, z = s.a[1] + (s.b[1] - s.a[1]) * tt; if (!reach([x, 0, z])) { bad(`payload lane blocked at ${x.toFixed(0)},${z.toFixed(0)}`); break; } } }
  for (const f of level.fwd || []) for (const p of f) if (!reach(p)) bad(`forward spawn ${p} not connected`);
  for (const p of level.dmSpawns) if (!reach(p)) bad(`dm spawn ${p} not connected`);
  // roofs: layers above 3 m that the flood reaches vs. total
  let roof = 0, roofOk = 0;
  for (let n = 0; n < nav.surf.length; n++) if (nav.surf[n] > 3.9 && nav.surf[n] < 6.5) { roof++; if (seen[n]) roofOk++; }
  console.log('   roofs reachable', roofOk, '/', roof, ' walkable nodes', (() => { let c = 0; for (const v of seen) c += v; return c; })());
  if (roof && roofOk / roof < 0.6) bad(`only ${(100 * roofOk / roof).toFixed(0)}% of high ground is reachable`);
}
console.log(failed ? failed + ' failure(s)' : 'all maps OK');
process.exit(failed ? 1 : 0);
