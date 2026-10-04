// FROSTGATE STATION: a snowbound escort map. Pure data here (boxes, spawns, packs, payload path)
// so the simulation can run headless; buildLevelVisuals() turns the boxes into engine meshes.
import * as E from '../../engine/index.js';

export const MAP_NAME = 'FROSTGATE';
export const PATH = [[0, -50], [0, 138]]; // payload centre line (x, z)
export const CHECKPOINTS = [74, 148]; // distance along the path where the time bank refills
export const BOUNDS = { x0: -34, x1: 34, z0: -84, z1: 172 };

export function makeLevelData() {
  const boxes = [];
  const add = (x0, y0, z0, x1, y1, z1, m = 'wall') => { boxes.push({ x0: Math.min(x0, x1), y0, z0: Math.min(z0, z1), x1: Math.max(x0, x1), y1, z1: Math.max(z0, z1), m }); };
  const B = (cx, cz, w, d, h, m = 'wall', y0 = 0) => add(cx - w / 2, y0, cz - d / 2, cx + w / 2, y0 + h, cz + d / 2, m);
  const R = (x0, z0, x1, z1, h, m = 'wall', y0 = 0) => add(x0, y0, z0, x1, y0 + h, z1, m);
  // steps rising toward `dir` (+z, -z, +x, -x), starting at (x,z) corner-anchor, w wide
  const stairs = (x, z, w, dir, n, rise = 0.45, run = 0.7, m = 'stone') => {
    for (let i = 0; i < n; i++) {
      const h = (i + 1) * rise, o = i * run;
      if (dir === '+z') R(x, z + o, x + w, z + o + run, h, m);
      else if (dir === '-z') R(x, z - o - run, x + w, z - o, h, m);
      else if (dir === '+x') R(x + o, z, x + o + run, z + w, h, m);
      else R(x - o - run, z, x - o, z + w, h, m);
    }
  };
  // hollow hall: four walls with door gaps, a roof slab. doors: [side, centre, width]
  const hall = (x0, z0, x1, z1, h, doors = [], m = 'wallB') => {
    const t = 0.6, dh = 3.3;
    const side = (name, ax0, az0, ax1, az1, horizontal) => {
      const ds = doors.filter((d) => d[0] === name);
      let cur = horizontal ? ax0 : az0; const end = horizontal ? ax1 : az1;
      for (const [, c, w] of ds.sort((a, b) => a[1] - b[1])) {
        const a = c - w / 2, b = c + w / 2;
        if (horizontal) { R(cur, az0, a, az1, h, m); R(a, az0, b, az1, h - dh, m, dh); } else { R(ax0, cur, ax1, a, h, m); R(ax0, a, ax1, b, h - dh, m, dh); }
        cur = b;
      }
      if (horizontal) R(cur, az0, end, az1, h, m); else R(ax0, cur, ax1, end, h, m);
    };
    side('z-', x0, z0, x1, z0 + t, true); side('z+', x0, z1 - t, x1, z1, true);
    side('x-', x0, z0, x0 + t, z1, false); side('x+', x1 - t, z0, x1, z1, false);
    R(x0, z0, x1, z1, 0.35, 'roof', h - 0.35); // roof slab
  };

  // ---- perimeter cliffs and end walls
  R(-37, -87, -34, 175, 18, 'cliff'); R(34, -87, 37, 175, 18, 'cliff');
  R(-37, -87, 37, -84, 18, 'cliff'); R(-37, 172, 37, 175, 18, 'cliff');

  // ---- attacker spawn room (z -84..-62), mirrored defender room (z 148..172)
  for (const [za, zb, dir] of [[-84, -62, 1], [148, 172, -1]]) {
    R(-19, za, -18, zb, 9, 'wallA'); R(18, za, 19, zb, 9, 'wallA');
    R(-19, za, 19, zb, 0.8, 'roof', 7.5);
    const fz = dir > 0 ? zb : za; // front wall facing the street
    R(-19, fz - 0.5, -9, fz + 0.5, 9, 'wallA'); R(9, fz - 0.5, 19, fz + 0.5, 9, 'wallA');
    R(-9, fz - 0.5, 9, fz + 0.5, 3.6, 'trim', 5.4); // gate lintel
    // benches and crates inside
    B(-13, (za + zb) / 2, 1.2, 6, 0.9, 'crate'); B(13, (za + zb) / 2, 1.2, 6, 0.9, 'crate');
  }
  // spawn-side outer blocks
  R(-34, -84, -19, -62, 11, 'wallA'); R(19, -84, 34, -62, 11, 'wallA');
  R(-34, 148, -19, 172, 11, 'wallA'); R(19, 148, 34, 172, 11, 'wallA');

  // ---- LEFT side blocks (x -34..-18)
  R(-34, -62, -18, -44, 10, 'wallA');
  stairs(-26, -43, 3, '+z', 9); // up to the low hall roof
  B(-31, -41, 3, 2, 1.2, 'crate'); B(-20.5, -39, 2, 2, 1.3, 'crate');
  hall(-34, -34, -18, -14, 4.05, [['x+', -24, 4], ['z+', -26, 3]], 'wallB');
  R(-18.4, -34, -18, -14, 0.9, 'trim', 4.05); // parapet
  R(-34, -14, -18, 10, 10, 'wallA');
  R(-34, 10, -18, 22, 12.5, 'wallA'); // arch pylon
  hall(-34, 22, -18, 38, 6, [['x+', 30, 4], ['z-', -28, 3]], 'wallA');
  stairs(-24, 49.3, 3, '-z', 14, 0.43, 0.7); // up to the market hall roof (z 38..)
  B(-30, 44, 2.5, 2.5, 1.3, 'crate'); B(-20, 46, 2, 2, 1.1, 'crate');
  R(-34, 50, -18, 80, 11, 'wallA');
  // ---- RIGHT side blocks (x 18..34)
  R(18, -62, 34, -30, 10, 'wallA');
  hall(18, -30, 34, -8, 4.05, [['x-', -19, 4], ['z+', 26, 3]], 'wallB');
  R(18, -30, 18.4, -8, 0.9, 'trim', 4.05);
  stairs(26, 1.2, 3, '-z', 9); // pocket stairs up to the right hall roof (z -8)
  B(31, -2, 3, 2, 1.2, 'crate'); B(21, -4, 2, 2, 1.3, 'crate');
  R(18, 2, 34, 22, 12.5, 'wallA');
  B(26, 27, 2, 2, 1.3, 'crate'); B(22, 29.5, 3, 1.4, 1.2, 'barrier');
  hall(18, 32, 34, 56, 5, [['x-', 44, 4], ['z-', 28, 3]], 'wallA');
  R(18, 56, 34, 80, 10, 'wallA');

  // ---- arch gate across the avenue (z 10..22), payload walks straight through
  R(-18, 10, -12, 22, 12.5, 'wallA'); R(12, 10, 18, 22, 12.5, 'wallA');
  R(-18, 10, 18, 22, 3.2, 'trim', 9.3); // the span
  R(-12, 12, 12, 20, 0.7, 'trim', 8.6);

  // ---- station hall (z 80..98): payload passes the central passage
  R(-34, 80, -8, 98, 11, 'wallA'); R(8, 80, 34, 98, 11, 'wallA');
  R(-8, 80, 8, 98, 4, 'roof', 6.5);
  B(-4.5, 86, 0.8, 0.8, 5.5, 'trim'); B(4.5, 86, 0.8, 0.8, 5.5, 'trim'); B(-4.5, 92, 0.8, 0.8, 5.5, 'trim'); B(4.5, 92, 0.8, 0.8, 5.5, 'trim');
  // inside the station: two ticket counters give cover without blocking the lane
  B(-5.5, 89, 1.2, 4, 1.15, 'counter'); B(5.5, 89, 1.2, 4, 1.15, 'counter');

  // ---- final plaza blocks (z 98..148)
  R(-34, 98, -18, 112, 9, 'wallA');
  stairs(-26, 121.3, 3, '-z', 9); // stairs up to the left hall roof
  hall(-34, 122, -18, 142, 4.05, [['x+', 132, 4], ['z-', -26, 3]], 'wallB');
  R(-18.4, 122, -18, 142, 0.9, 'trim', 4.05);
  B(-30, 117, 3, 2, 1.2, 'crate'); B(-21, 114.5, 2, 2, 1.3, 'crate');
  R(-34, 142, -18, 148, 9, 'wallA');
  R(18, 98, 34, 120, 9, 'wallA');
  hall(18, 120, 34, 140, 4.05, [['x-', 130, 4], ['z+', 27, 3]], 'wallB');
  R(18, 120, 18.4, 140, 0.9, 'trim', 4.05);
  stairs(26, 147.4 - 0.1, 3, '-z', 9); // keep clear of the spawn wall
  R(18, 140, 34, 148, 9, 'wallA');

  // ---- avenue cover (kept clear of the payload lane |x| < 2.6)
  const cover = [
    // plaza one: statues and a fountain either side of the lane
    [-10, -40, 'fountain', 7, 7, 1.0], [10, -40, 'fountain', 7, 7, 1.0], [-10, -40, 'statue', 1.6, 1.6, 4.2], [10, -40, 'statue', 1.6, 1.6, 4.2],
    [-13, -22, 'barrier', 4, 0.9, 1.2], [13, -22, 'barrier', 4, 0.9, 1.2], [-6, -52, 'crate', 1.6, 1.6, 1.3], [6, -52, 'crate', 1.6, 1.6, 1.3],
    [-14, -8, 'planter', 6, 1.6, 1.1], [14, -8, 'planter', 6, 1.6, 1.1], [-8, 0, 'barrier', 3, 0.9, 1.2], [8, 0, 'barrier', 3, 0.9, 1.2],
    // beyond the arch: market stalls
    [-9, 30, 'stall', 3.4, 2.2, 1.3], [9, 34, 'stall', 3.4, 2.2, 1.3], [-12, 48, 'stall', 3.4, 2.2, 1.3], [12, 52, 'stall', 3.4, 2.2, 1.3],
    [-6, 62, 'crate', 2, 2, 1.4], [6, 66, 'crate', 2, 2, 1.4], [-14, 70, 'barrier', 4, 0.9, 1.2], [14, 72, 'barrier', 4, 0.9, 1.2],
    [-13, 40, 'barrier', 3, 0.9, 1.2], [13, 42, 'planter', 5, 1.6, 1.1],
    // final plaza
    [-10, 106, 'pillar', 1.6, 1.6, 6], [10, 106, 'pillar', 1.6, 1.6, 6], [-10, 122, 'pillar', 1.6, 1.6, 6], [10, 122, 'pillar', 1.6, 1.6, 6],
    [-14, 114, 'barrier', 3.5, 0.9, 1.2], [14, 114, 'barrier', 3.5, 0.9, 1.2], [-6, 128, 'crate', 1.8, 1.8, 1.3], [6, 130, 'crate', 1.8, 1.8, 1.3],
    [-13, 138, 'planter', 5, 1.6, 1.1], [13, 138, 'planter', 5, 1.6, 1.1], [-6, 100, 'crate', 1.6, 1.6, 1.3], [6, 102, 'barrier', 3, 0.9, 1.2],
  ];
  for (const [x, z, m, w, d, h] of cover) B(x, z, w, d, h, m);
  // goal gate behind the payload's last stop
  B(-6, 144, 1.4, 1.4, 7, 'trim'); B(6, 144, 1.4, 1.4, 7, 'trim'); R(-6.7, 143.3, 6.7, 144.7, 1, 'trim', 6.8);

  // ---- spawns, health packs
  const spawns = [[], []];
  for (let i = 0; i < 5; i++) {
    spawns[0].push([-8 + i * 4, 0, -80 + (i % 2) * 3]);
    spawns[1].push([8 - i * 4, 0, 168 - (i % 2) * 3]);
  }
  const packs = [
    { pos: [-26, 0, -38], big: false }, { pos: [30, 0, -4], big: false }, { pos: [-30, 0, 44.5], big: true }, { pos: [30, 0, 28], big: false },
    { pos: [-30, 0, 118], big: false }, { pos: [30, 0, 143], big: false }, { pos: [-5, 0, 70], big: true }, { pos: [5, 0, 106], big: false },
  ];
  return { boxes, spawns, packs, path: PATH, checkpoints: CHECKPOINTS, bounds: BOUNDS };
}

// ------------------------------------------------------------------ nav grid
// 1 m cells, up to four standable layers per cell (street, hall roofs, interiors). Edges allow
// step-ups of 0.6 m (stairs are built from 0.43-0.45 m steps) and drops of up to 5 m.
export function buildNav(level) {
  const { x0, x1, z0, z1 } = level.bounds, W = Math.ceil(x1 - x0), D = Math.ceil(z1 - z0), L = 4;
  const nav = { x0, z0, W, D, L, surf: new Float32Array(W * D * L).fill(NaN) };
  const inCell = (b, cx, cz, r) => b.x0 < cx + r && b.x1 > cx - r && b.z0 < cz + r && b.z1 > cz - r;
  for (let j = 0; j < D; j++) for (let i = 0; i < W; i++) {
    const cx = x0 + i + 0.5, cz = z0 + j + 0.5;
    const near = level.boxes.filter((b) => inCell(b, cx, cz, 0.5));
    const cands = new Set([0]);
    for (const b of near) if (inCell(b, cx, cz, 0.02)) cands.add(b.y1);
    let l = 0;
    for (const s of [...cands].sort((a, b) => a - b)) {
      if (l >= L) break;
      // must be supported by a box whose top is s (or the ground) under the cell centre
      const blocked = near.some((b) => b.y1 > s + 0.55 && b.y0 < s + 1.85 && inCell(b, cx, cz, 0.42));
      if (blocked) continue;
      nav.surf[(j * W + i) * L + l++] = s;
    }
  }
  nav.idx = (i, j, l) => (j * W + i) * L + l;
  nav.cellOf = (x, z) => [Math.floor(x - x0), Math.floor(z - z0)];
  nav.layerAt = (i, j, y) => {
    if (i < 0 || j < 0 || i >= W || j >= D) return -1;
    let best = -1, bd = 1e9;
    for (let l = 0; l < L; l++) { const s = nav.surf[nav.idx(i, j, l)]; if (s !== s) continue; const d = Math.abs(s - y); if (d < bd) { bd = d; best = l; } }
    return bd < 1.2 ? best : -1;
  };
  return nav;
}

// A* over the layered grid. from/to are world positions; returns an array of [x,y,z] waypoints.
export function findPath(nav, from, to, maxNodes = 14000) {
  const { W, D, L } = nav;
  const [si, sj] = nav.cellOf(from[0], from[2]);
  let [ti, tj] = nav.cellOf(to[0], to[2]);
  const sl = nav.layerAt(si, sj, from[1]);
  if (sl < 0) return null;
  let tl = nav.layerAt(ti, tj, to[1]);
  if (tl < 0) { // snap the goal to the nearest walkable cell
    let found = false;
    for (let r = 1; r < 8 && !found; r++) for (let dj = -r; dj <= r && !found; dj++) for (let di = -r; di <= r && !found; di++) { const l = nav.layerAt(ti + di, tj + dj, to[1]); if (l >= 0) { ti += di; tj += dj; tl = l; found = true; } }
    if (!found) return null;
  }
  const N = W * D * L;
  const g = (nav._g ||= new Float32Array(N)).fill(Infinity), came = (nav._came ||= new Int32Array(N)).fill(-1);
  const start = nav.idx(si, sj, sl), goal = nav.idx(ti, tj, tl);
  const heap = [[0, start]];
  const push = (it) => { heap.push(it); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { let l = 2 * i + 1, r = l + 1, m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  g[start] = 0;
  let expanded = 0, reached = false;
  const h = (i, j) => Math.hypot(i - ti, j - tj);
  while (heap.length && expanded++ < maxNodes) {
    const [, cur] = pop();
    if (cur === goal) { reached = true; break; }
    const cl = cur % L, cell = (cur - cl) / L, ci = cell % W, cj = (cell - ci) / W, cs = nav.surf[cur];
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const ni = ci + di, nj = cj + dj;
      if (ni < 0 || nj < 0 || ni >= W || nj >= D) continue;
      for (let l = 0; l < L; l++) {
        const ns = nav.surf[nav.idx(ni, nj, l)]; if (ns !== ns) continue;
        const dz = ns - cs;
        if (dz > 0.62 || dz < -5) continue;
        if (di && dj) { // no cutting corners through walls
          const a = nav.layerAt(ci + di, cj, cs), b = nav.layerAt(ci, cj + dj, cs);
          if (a < 0 || b < 0 || Math.abs(nav.surf[nav.idx(ci + di, cj, a)] - cs) > 0.62 || Math.abs(nav.surf[nav.idx(ci, cj + dj, b)] - cs) > 0.62) continue;
        }
        const n = nav.idx(ni, nj, l), cost = g[cur] + (di && dj ? 1.414 : 1) + (dz < -0.7 ? 1.5 : 0) + (dz > 0.1 ? 0.3 : 0);
        if (cost < g[n]) { g[n] = cost; came[n] = cur; push([cost + h(ni, nj), n]); }
      }
    }
  }
  if (!reached) return null;
  const out = [];
  for (let n = goal; n !== -1; n = came[n]) {
    const l = n % L, cell = (n - l) / L, i = cell % W, j = (cell - i) / W;
    out.push([nav.x0 + i + 0.5, nav.surf[n], nav.z0 + j + 0.5]);
  }
  return out.reverse();
}

// ------------------------------------------------------------------ visuals
const MATS = () => ({
  wallA: new E.Material({ name: 'Plaster', color: '#8ea6c4', roughness: 0.85 }),
  wallB: new E.Material({ name: 'Warm plaster', color: '#cfa77a', roughness: 0.85 }),
  trim: new E.Material({ name: 'Trim', color: '#6f4524', roughness: 0.7, pattern: 'wood', patternScale: 3, patternColor: '#4d2e16', patternStrength: 0.5 }),
  stone: new E.Material({ name: 'Stone', color: '#7e8794', roughness: 0.9 }),
  roof: new E.Material({ name: 'Snow roof', color: '#f2f6fb', roughness: 0.85 }),
  cliff: new E.Material({ name: 'Cliff', color: '#4d5663', roughness: 1 }),
  crate: new E.Material({ name: 'Crate', color: '#a67a43', roughness: 0.85, pattern: 'wood', patternScale: 2.5, patternColor: '#6b4a26', patternStrength: 0.5 }),
  barrier: new E.Material({ name: 'Barrier', color: '#c4c9d2', roughness: 0.85 }),
  planter: new E.Material({ name: 'Planter', color: '#4f6b8f', roughness: 0.85 }),
  fountain: new E.Material({ name: 'Fountain', color: '#a7b0bd', roughness: 0.6 }),
  statue: new E.Material({ name: 'Statue', color: '#7d8ea3', metallic: 0.5, roughness: 0.35 }),
  pillar: new E.Material({ name: 'Pillar', color: '#b6bfcf', roughness: 0.85 }),
  stall: new E.Material({ name: 'Stall', color: '#c9533f', roughness: 0.8 }),
  counter: new E.Material({ name: 'Counter', color: '#7a5330', roughness: 0.6, pattern: 'wood', patternScale: 4, patternColor: '#4f331a' }),
  floor: new E.Material({ name: 'Floor', color: '#6c7380', roughness: 0.9 }),
});

export function buildLevelVisuals(scene, level) {
  const M = MATS(), kit = new E.Kit(E.archPalette());
  const snow = new E.Material({ name: 'Snow', color: '#dfe8f3', roughness: 0.95 });
  const cobble = new E.Material({ name: 'Cobble', color: '#586170', roughness: 0.95 });
  const ground = new E.Mesh(E.plane({ width: 90, depth: 280 }), snow, 'Snow'); ground.position.set([0, 0, 44]); ground.castShadow = false; scene.add(ground);
  // paved avenue down the middle, a darker lane where the payload rolls
  kit.box(cobble, [0, 0.012, 44], [36, 0.02, 220]);
  kit.box(new E.Material({ name: 'Rails', color: '#2f343d', metallic: 0.6, roughness: 0.5 }), [0, 0.03, 44], [3.4, 0.02, 200]);
  for (let z = -48; z < 140; z += 2) kit.box(M.trim, [0, 0.045, z], [3.6, 0.03, 0.22]);
  // spawn pads
  for (const [t, z] of [[0, -74], [1, 160]]) kit.box(new E.Material({ name: 'Pad', color: t ? '#8a6a70' : '#6f819a', emissive: t ? '#ff4a52' : '#3a9bff', emissiveStrength: 0.03, roughness: 0.7 }), [0, 0.04, z], [30, 0.02, 14]);
  for (const b of level.boxes) {
    const m = M[b.m] || M.wallA;
    kit.box(m, [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2], [b.x1 - b.x0, b.y1 - b.y0, b.z1 - b.z0], [0, 0, 0], b.m === 'roof' || b.m === 'barrier' || b.m === 'crate' ? 0.04 : 0);
    // snow caps on anything with a flat top bigger than a crate
    if (b.y1 - b.y0 > 0.3 && b.x1 - b.x0 > 1.5 && b.z1 - b.z0 > 1.5 && b.m !== 'roof' && b.m !== 'cliff' && b.m !== 'trim' && b.y0 === 0) {
      kit.box(M.roof, [(b.x0 + b.x1) / 2, b.y1 + 0.05, (b.z0 + b.z1) / 2], [b.x1 - b.x0 + 0.1, 0.12, b.z1 - b.z0 + 0.1]);
    }
  }
  // arch trim, banners, lamp posts for colour
  const bannerA = new E.Material({ name: 'Banner A', color: '#3a9bff', roughness: 0.8, doubleSided: true });
  const bannerD = new E.Material({ name: 'Banner D', color: '#ff4a52', roughness: 0.8, doubleSided: true });
  kit.box(bannerA, [0, 7, 9.9], [5, 3.6, 0.08]); kit.box(bannerD, [0, 7, 22.1], [5, 3.6, 0.08]);
  kit.box(bannerA, [-17.9, 5, -30], [0.08, 4, 3]); kit.box(bannerD, [17.9, 5, 130], [0.08, 4, 3]);
  const lamp = new E.Material({ name: 'Lamp', color: '#ffe6b0', emissive: '#ffd27a', emissiveStrength: 2, roughness: 0.4 });
  const post = new E.Material({ name: 'Post', color: '#2d3139', metallic: 0.7, roughness: 0.5 });
  for (let z = -56; z <= 140; z += 24) for (const x of [-15.5, 15.5]) { kit.cyl(post, [x, 2.2, z], 0.07, 4.4, [0, 0, 0], 8); kit.box(lamp, [x, 4.45, z], [0.4, 0.3, 0.4]); }
  const node = kit.toNode('Frostgate'); scene.add(node);
  for (const z of [-72, 160]) for (const x of [-9, 9]) { const l = new E.Light('point', { color: '#ffe8c4', intensity: 10, range: 22 }); l.position.set([x, 6.2, z]); scene.add(l); }
  // a few real lights along the street
  for (let z = -56; z <= 140; z += 48) { const l = new E.Light('point', { color: '#ffd9a0', intensity: 5, range: 16 }); l.position.set([0, 4.4, z]); scene.add(l); }
  return node;
}
