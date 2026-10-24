// Where every gun lies on the tables, and which one the player is looking at.
//
// Shooting counters ('bench'): handguns and SMGs side by side, pointing downrange (+Z), lying on
// their right side. Armory tables ('armory'): long guns in rows along X, barrels to +X, their top
// edge toward the player at the front of the table. Guns are placed from their rest bounds in
// their own space (x left, y up, z to the muzzle), so nothing overlaps whatever its shape.

// rotations: lying on the right side (left side up), then turned to point along +X
export const BENCH_Q = [0, 0, Math.SQRT1_2, Math.SQRT1_2]; // +90 deg about Z: (x, y, z) -> (-y, x, z)
export const ARMORY_Q = [0.5, 0.5, 0.5, 0.5]; // then +90 deg about Y: (x, y, z) -> (z, x, y)
const toWorld = (kind, [x, y, z]) => (kind === 'bench' ? [-y, x, z] : [z, x, y]);

// guns: [{ id, bench: bool, bounds: { min, max } }], tables: [{ kind, center: [x, top, z], size: [lx, lz] }]
// returns Map id -> { kind, q, pos, seg: [a, b] (its length, through the middle), radius }
export function layoutTables(guns, tables) {
  const out = new Map();
  const place = (g, kind, pos) => {
    const { min, max } = g.bounds, cx = (min[0] + max[0]) / 2, cy = (min[1] + max[1]) / 2;
    const a = toWorld(kind, [cx, cy, min[2]]), b = toWorld(kind, [cx, cy, max[2]]);
    out.set(g.id, { kind, q: kind === 'bench' ? BENCH_Q : ARMORY_Q, pos, seg: [a.map((v, i) => v + pos[i]), b.map((v, i) => v + pos[i])], radius: Math.max(0.05, (max[1] - min[1]) / 2) });
  };
  // ---- counters: an even share each, centred, 10 cm apart
  const benches = tables.filter((t) => t.kind === 'bench');
  const short = guns.filter((g) => g.bench);
  const per = Math.ceil(short.length / benches.length);
  benches.forEach((t, i) => {
    const row = short.slice(i * per, (i + 1) * per);
    const h = (g) => g.bounds.max[1] - g.bounds.min[1];
    let x = t.center[0] - (row.reduce((s, g) => s + h(g), 0) + 0.1 * (row.length - 1)) / 2;
    for (const g of row) {
      const { min, max } = g.bounds;
      place(g, 'bench', [x + max[1], t.center[1] - min[0] + 0.002, t.center[2] - (min[2] + max[2]) / 2]);
      x += h(g) + 0.1;
    }
  });
  // ---- armory tables: rows from the front edge back, a new table when one is full
  const long = guns.filter((g) => !g.bench);
  const tabs = tables.filter((t) => t.kind === 'armory');
  let ti = 0, rowFront = null, x = 0, rowDepth = 0;
  const startTable = () => { const t = tabs[ti]; rowFront = t.center[2] + t.size[1] / 2 - 0.04; x = t.center[0] - t.size[0] / 2 + 0.05; rowDepth = 0; };
  startTable();
  for (const g of long) {
    const { min, max } = g.bounds, len = max[2] - min[2], dep = max[1] - min[1];
    let t = tabs[ti];
    if (x + len > t.center[0] + t.size[0] / 2 - 0.03) { // the row is full: start the next one
      rowFront -= rowDepth + 0.05; x = t.center[0] - t.size[0] / 2 + 0.05; rowDepth = 0;
    }
    if (rowFront - dep < t.center[2] - t.size[1] / 2 - 0.04 && ti < tabs.length - 1) { ti++; startTable(); t = tabs[ti]; }
    place(g, 'armory', [x - min[2], t.center[1] - min[0] + 0.002, rowFront - max[1]]);
    x += len + 0.09; rowDepth = Math.max(rowDepth, dep);
  }
  return out;
}

// The gun the view ray points at: the nearest segment within its radius, up to `reach` metres.
export function pickAlongRay(eye, dir, spots, reach = 2.4) {
  let best = null, bestScore = 1;
  for (const [id, s] of spots) {
    const [a, b] = s.seg, v = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], w = [eye[0] - a[0], eye[1] - a[1], eye[2] - a[2]];
    const B = dir[0] * v[0] + dir[1] * v[1] + dir[2] * v[2], C = v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
    const D = dir[0] * w[0] + dir[1] * w[1] + dir[2] * w[2], Ev = v[0] * w[0] + v[1] * w[1] + v[2] * w[2];
    const den = C - B * B;
    let tc = den > 1e-9 ? (Ev - B * D) / den : Ev / C;
    tc = Math.max(0, Math.min(1, tc));
    const q = [a[0] + v[0] * tc, a[1] + v[1] * tc, a[2] + v[2] * tc];
    const sc = (q[0] - eye[0]) * dir[0] + (q[1] - eye[1]) * dir[1] + (q[2] - eye[2]) * dir[2];
    if (sc < 0.1 || sc > reach) continue;
    const p = [eye[0] + dir[0] * sc - q[0], eye[1] + dir[1] * sc - q[1], eye[2] + dir[2] * sc - q[2]];
    const score = Math.hypot(...p) / s.radius;
    if (score < bestScore) { bestScore = score; best = id; }
  }
  return best;
}
