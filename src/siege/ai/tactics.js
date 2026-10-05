// Spatial reasoning for bots: cover, firing posts, exposure to openings, where a grenade can land.
import { CAST, STOREY } from '../world/grid.js';
import { dist3, norm, sub, dot, clamp, yawOf } from '../sim/util.js';

const EYE_STAND = 1.6, EYE_CROUCH = 1.15;

// can `from` (a point) see `to` (a point)? glass is see-through
export const los = (world, from, to) => world.visible(from, to, CAST.GLASS | CAST.PROPS * 0);

// cells around `centre` (world pos) that a bot can reach, within radius, as world positions
export function cellsAround(nav, centre, radius, f = null) {
  const out = [], cx = Math.floor(centre[0]), cz = Math.floor(centre[2]), fl = f ?? nav.floorOf(centre[1]);
  for (let dz = -radius; dz <= radius; dz++) for (let dx = -radius; dx <= radius; dx++) {
    const x = cx + dx, z = cz + dz;
    if (dx * dx + dz * dz > radius * radius || !nav.walkable(x, z, fl) || nav.isHole(x, z, fl)) continue;
    out.push([x + 0.5, fl * STOREY, z + 0.5]);
  }
  return out;
}
// cover from a threat: a cell the threat cannot see at crouch height, preferably close to us and next to a spot
// from which the threat can be shot at (a peek cell)
export function findCover(sim, from, threat, { radius = 6, avoid = [], prefer = null } = {}) {
  const w = sim.world, nav = sim.nav, cells = cellsAround(nav, from, radius), th = [threat[0], threat[1] + 1.5, threat[2]];
  let best = null, bs = -1e9;
  for (const c of cells) {
    const head = [c[0], c[1] + EYE_CROUCH, c[2]], chest = [c[0], c[1] + 0.7, c[2]];
    const hidden = !w.visible(th, head, CAST.GLASS) && !w.visible(th, chest, CAST.GLASS);
    if (!hidden) continue;
    const d = Math.hypot(c[0] - from[0], c[2] - from[2]);
    // a hidden cell that is also reachable without crossing the threat's line of sight
    let s = -d * 1.2;
    if (prefer) s -= dist3(c, prefer) * 0.3;
    // a short step away from the threat's sightline is better than a long run
    const dt = Math.hypot(c[0] - threat[0], c[2] - threat[2]);
    s += Math.min(dt, 12) * 0.2;
    for (const a of avoid) if (Math.hypot(c[0] - a[0], c[2] - a[2]) < 1.2) s -= 6;
    // hugging a wall makes for better cover
    let walls = 0;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!w.cast(c[0], c[1] + 1, c[2], dx, 0, dz, 0.8, CAST.GLASS)) walls += 0; else walls++;
    s += walls * 0.5;
    if (s > bs) { bs = s; best = c; }
  }
  return best;
}
// a cell from which `target` is visible (to fire from), close to `from`
export function findPeek(sim, from, target, { radius = 5, minDist = 2, maxDist = 40 } = {}) {
  const w = sim.world, cells = cellsAround(sim.nav, from, radius);
  let best = null, bs = -1e9;
  const t = [target[0], target[1] + 1.2, target[2]];
  for (const c of cells) {
    const d = Math.hypot(c[0] - target[0], c[2] - target[2]);
    if (d < minDist || d > maxDist) continue;
    if (!w.visible([c[0], c[1] + 1.55, c[2]], t, CAST.GLASS)) continue;
    const s = -Math.hypot(c[0] - from[0], c[2] - from[2]) - Math.abs(d - 10) * 0.1;
    if (s > bs) { bs = s; best = c; }
  }
  return best;
}
// how exposed is a standing point to a list of opening centres? (count of unobstructed lines)
export function exposure(world, p, openings) {
  let n = 0; const e = [p[0], p[1] + 1.5, p[2]];
  for (const o of openings) if (world.visible(e, [o[0], o[1] + 1.2, o[2]], CAST.GLASS)) n++;
  return n;
}
// yaw that looks at the nearest opening of a list
export function facingOf(p, targets) {
  let best = null, bd = 1e9;
  for (const t of targets) { const d = Math.hypot(t[0] - p[0], t[2] - p[2]); if (d < bd) { bd = d; best = t; } }
  return best ? yawOf(best[0] - p[0], best[2] - p[2]) : 0;
}
// lob angle that lands a grenade (speed v) at horizontal distance d and height difference h
export function lobPitch(d, h, v = 11) {
  const g = 9.81, disc = v * v * v * v - g * (g * d * d + 2 * h * v * v);
  if (disc < 0) return 0.75;
  return Math.atan2(v * v - Math.sqrt(disc), g * d);
}
void norm; void sub; void dot; void clamp;
