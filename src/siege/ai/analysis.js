// Level analysis for the planners: what are the walls, doors, windows and hatches around an
// objective site, which ones matter, and where would a bot stand to use or defend them.
import { STOREY } from '../world/grid.js';

const D4 = [[1, 0, 'x', 1], [-1, 0, 'x', 0], [0, 1, 'z', 1], [0, -1, 'z', 0]]; // dx, dz, axis, face offset

export function analyseSite(sim, site) {
  const w = sim.world, nav = sim.nav, f = site.f, base = f * STOREY, def = sim.map.def;
  // cells of the site's rooms
  const roomIdx = new Set();
  for (const L of site.rooms) roomIdx.add(w.roomNames.indexOf(def.rooms[f][L][0], f * 0) + 1);
  const letters = site.rooms.map((L) => def.rooms[f][L][0]);
  const cells = [];
  for (let z = 0; z < w.D; z++) for (let x = 0; x < w.W; x++) { const r = w.rooms[f][z * w.W + x]; if (r && letters.includes(w.roomNames[r - 1])) cells.push([x, z]); }
  const inSite = new Set(cells.map(([x, z]) => z * w.W + x));
  const openings = [], units = new Map(), hatches = [], windows = [], doors = [];
  for (const [x, z] of cells) for (const [dx, dz, ax, off] of D4) {
    const nx = x + dx, nz = z + dz;
    if (inSite.has(nz * w.W + nx)) continue;
    const ix = ax === 'x' ? x + off : x, iz = ax === 'x' ? z : z + off;
    const p0 = w.get(ax, ix, base, iz), p1 = w.get(ax, ix, base + 1, iz), p2 = w.get(ax, ix, base + 2, iz);
    const inside = [x + 0.5, base, z + 0.5], outside = [nx + 0.5, base, nz + 0.5];
    const normal = ax === 'x' ? [-dx, 0, 0] : [0, 0, -dz]; // points into the site room
    const centre = ax === 'x' ? [ix, base + 1, iz + 0.5] : [ix + 0.5, base + 1, iz];
    const edge = { ax, ix, iz, inside, outside, normal, centre, dx, dz, panels: [p0, p1, p2] };
    if ((p0 && p0.door) || (p1 && p1.door)) { edge.kind = 'door'; edge.door = (p0 && p0.door) || p1.door; doors.push(edge); openings.push(edge); }
    else if (p1 && p1.kind === 'glass') { edge.kind = 'window'; windows.push(edge); openings.push(edge); }
    else if (!p0 && !p1) { edge.kind = 'open'; openings.push(edge); }
    else if (p0 && p1 && p2 && p0.kind === 'wall' && p0.unit) {
      edge.kind = 'wall'; edge.unit = p0.unit;
      if (!units.has(p0.unit)) units.set(p0.unit, { unit: p0.unit, edges: [], ext: !!p0.ext, nr: !!p0.nr });
      units.get(p0.unit).edges.push(edge);
    } else if (p0 && p0.kind === 'wall') { edge.kind = 'solid'; }
  }
  // hatches above and below the site
  for (const [x, z] of cells) {
    for (const lvl of [base, base + STOREY]) {
      const p = w.getY(x, lvl, z);
      if (p && p.hatch) hatches.push({ panel: p, x, z, lvl, ceiling: lvl > base, inside: [x + 0.5, base, z + 0.5] });
    }
  }
  // sort units: exterior first, then by how many openings the other side has
  const uList = [...units.values()].map((u) => {
    const mid = u.edges[Math.floor(u.edges.length / 2)];
    const outRoom = w.roomAt(mid.outside[0], base, mid.outside[2]);
    const exposure = outRoom < 0 ? 2 : 1;
    return { ...u, mid, outRoom, score: (u.ext ? 3 : 0) + exposure + u.edges.length * 0.2 };
  }).sort((a, b) => b.score - a.score);
  return { site, f, base, cells, inSite, openings, units: uList, hatches, windows, doors };
}

// pick a standing cell on the site side of an edge: one step in from the wall
export function standInside(edge) {
  return [edge.inside[0] + edge.normal[0] * 0.0, edge.inside[1], edge.inside[2] + edge.normal[2] * 0.0];
}
// the cell outside a wall (for attackers)
export function standOutside(edge) { return edge.outside; }
