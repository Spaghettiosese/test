// The maps. Each map is pure data (boxes, spawns, packs, payload path, capture points) so the
// simulation can run headless; buildLevelVisuals() turns the boxes into engine meshes with the
// map's own palette. A small DSL (corridor, spawn rooms, halls with stairs, cover scatter) keeps
// the layouts readable.
import * as E from '../../engine/index.js';
import { rng, clamp } from './util.js';

const RISE = 0.55, RUN = 1.0; // one step per 1 m nav cell, so bots can climb

// ------------------------------------------------------------------ builder
function mk() {
  const boxes = [];
  const add = (x0, y0, z0, x1, y1, z1, m = 'wallA') => { boxes.push({ x0: Math.min(x0, x1), y0, z0: Math.min(z0, z1), x1: Math.max(x0, x1), y1, z1: Math.max(z0, z1), m }); };
  const B = (cx, cz, w, d, h, m = 'wallA', y0 = 0) => add(cx - w / 2, y0, cz - d / 2, cx + w / 2, y0 + h, cz + d / 2, m);
  const R = (x0, z0, x1, z1, h, m = 'wallA', y0 = 0) => add(x0, y0, z0, x1, y0 + h, z1, m);
  const stairs = (x, z, w, dir, n, rise = RISE, run = RUN, m = 'stone') => {
    for (let i = 0; i < n; i++) {
      const h = (i + 1) * rise, o = i * run;
      if (dir === '+z') R(x, z + o, x + w, z + o + run, h, m);
      else if (dir === '-z') R(x, z - o - run, x + w, z - o, h, m);
      else if (dir === '+x') R(x + o, z, x + o + run, z + w, h, m);
      else R(x - o - run, z, x - o, z + w, h, m);
    }
  };
  // stairs that end exactly at the edge of a rect at height h (so a roof or platform is reachable)
  const stairsTo = (rect, h, edge, off, w = 3, m = 'stone') => {
    const [x0, z0, x1, z1] = rect, n = Math.ceil(h / RISE), rise = h / n, len = n * RUN;
    if (edge === 'z-') stairs(x0 + off, z0 - len, w, '+z', n, rise, RUN, m);
    else if (edge === 'z+') stairs(x0 + off, z1 + len, w, '-z', n, rise, RUN, m);
    else if (edge === 'x-') stairs(x0 - len, z0 + off, w, '+x', n, rise, RUN, m);
    else stairs(x1 + len, z0 + off, w, '-x', n, rise, RUN, m);
    return len;
  };
  const hall = (x0, z0, x1, z1, h, doors = [], m = 'wallB') => {
    const t = 0.6, dh = 3.3;
    const side = (name, ax0, az0, ax1, az1, horizontal) => {
      const ds = doors.filter((d) => d[0] === name);
      let cur = horizontal ? ax0 : az0; const end = horizontal ? ax1 : az1;
      for (const [, c, w] of ds.sort((a, b) => a[1] - b[1])) {
        const a = c - w / 2, b2 = c + w / 2;
        if (horizontal) { R(cur, az0, a, az1, h, m); R(a, az0, b2, az1, h - dh, m, dh); } else { R(ax0, cur, ax1, a, h, m); R(ax0, a, ax1, b2, h - dh, m, dh); }
        cur = b2;
      }
      if (horizontal) R(cur, az0, end, az1, h, m); else R(ax0, cur, ax1, end, h, m);
    };
    side('z-', x0, z0, x1, z0 + t, true); side('z+', x0, z1 - t, x1, z1, true);
    side('x-', x0, z0, x0 + t, z1, false); side('x+', x1 - t, z0, x1, z1, false);
    R(x0, z0, x1, z1, 0.35, 'roof', h - 0.35);
  };
  // gated spawn compound; front = which z edge faces the street
  const spawnRoom = (cx, za, zb, front, hw = 19, gate = 9, h = 9) => {
    R(cx - hw, za, cx - hw + 1, zb, h, 'wallA'); R(cx + hw - 1, za, cx + hw, zb, h, 'wallA');
    R(cx - hw, za, cx + hw, zb, 0.8, 'roof', h - 1.5);
    const fz = front === 'z+' ? zb : za, bz = front === 'z+' ? za : zb;
    R(cx - hw, fz - 0.5, cx - gate, fz + 0.5, h, 'wallA'); R(cx + gate, fz - 0.5, cx + hw, fz + 0.5, h, 'wallA');
    R(cx - gate, fz - 0.5, cx + gate, fz + 0.5, h - 5.4, 'trim', 5.4);
    R(cx - hw, bz - 0.5, cx + hw, bz + 0.5, h, 'wallA');
    B(cx - hw + 6, (za + zb) / 2, 1.2, 6, 0.9, 'crate'); B(cx + hw - 6, (za + zb) / 2, 1.2, 6, 0.9, 'crate');
  };
  const overlaps = (x0, z0, x1, z1, m = 1.0) => boxes.some((b) => b.y0 < 2.5 && b.x0 < x1 + m && b.x1 > x0 - m && b.z0 < z1 + m && b.z1 > z0 - m);
  const scatter = (rand, rect, n, kinds, keep = []) => {
    const out = [];
    for (let k = 0, placed = 0; placed < n && k < n * 40; k++) {
      const [x0, z0, x1, z1] = rect, kind = kinds[Math.floor(rand() * kinds.length)];
      let [w, d, h, m] = kind; if (rand() < 0.5) [w, d] = [d, w];
      const cx = x0 + rand() * (x1 - x0), cz = z0 + rand() * (z1 - z0), ax = cx - w / 2, az = cz - d / 2;
      if (keep.some(([a, b2, c, e]) => ax < c && ax + w > a && az < e && az + d > b2)) continue;
      if (overlaps(ax, az, ax + w, az + d, 1.3)) continue;
      B(cx, cz, w, d, h, m); out.push([cx, cz]); placed++;
    }
    return out;
  };
  // A street running along z. Side blocks are generated from patterns so every hall that has a
  // pocket in front of it gets stairs onto its roof.
  const corridor = (rand, { cx, hs, depth, z0, z1, arches = [], hallHeights = [4.05, 5, 6], halls = true }) => {
    const pockets = [];
    for (const side of [-1, 1]) {
      const xi = cx + side * hs, xo = cx + side * (hs + depth), xa = Math.min(xi, xo), xb = Math.max(xi, xo);
      const ranges = []; let zc = z0;
      for (const az of [...arches].sort((a, b2) => a - b2)) { ranges.push([zc, az - 6, false]); ranges.push([az - 6, az + 6, true]); zc = az + 6; }
      ranges.push([zc, z1, false]);
      for (const [ra, rb, arch] of ranges) {
        if (arch) { R(xa, ra, xb, rb, 12.5, 'wallA'); continue; }
        let z = ra, prev = null;
        while (z < rb - 0.01) {
          const left = rb - z;
          if (left < 14 || !halls) { R(xa, z, xb, rb, 7 + rand() * 4, rand() < 0.5 ? 'wallA' : 'wallB'); break; }
          const h = hallHeights[Math.floor(rand() * hallHeights.length)], sl = Math.ceil(h / RISE) * RUN;
          const sol = Math.min(left - 1, 14 + rand() * 12);
          R(xa, z, xb, z + sol, 8 + rand() * 3, rand() < 0.6 ? 'wallA' : 'wallB'); z += sol;
          const left2 = rb - z, plen = sl + 2.2, hl = 16 + rand() * 8;
          if (left2 < plen + 12) { if (left2 > 0.1) R(xa, z, xb, rb, 8, 'wallA'); break; }
          // pocket then hall
          const pz0 = z, pz1 = z + plen, hz1 = Math.min(rb, pz1 + hl);
          if (rb - hz1 < 6) { /* stretch the hall to the end */ }
          const hallRect = [xa, pz1, xb, rb - hz1 < 6 ? rb : hz1];
          const doors = [[side < 0 ? 'x+' : 'x-', (hallRect[1] + hallRect[3]) / 2, 4]];
          const stairX = side < 0 ? 0.6 : depth - 3.6, doorX = side < 0 ? xb - 2.4 : xa + 2.4;
          doors.push(['z-', doorX, 3]);
          hall(hallRect[0], hallRect[1], hallRect[2], hallRect[3], h, doors, rand() < 0.5 ? 'wallB' : 'wallA');
          stairsTo(hallRect, h, 'z-', stairX, 3);
          // parapet on the street edge
          if (side < 0) R(xb - 0.4, hallRect[1], xb, hallRect[3], 0.9, 'trim', h); else R(xa, hallRect[1], xa + 0.4, hallRect[3], 0.9, 'trim', h);
          B((xa + xb) / 2 + (side < 0 ? 3.5 : -3.5), pz0 + 1.6, 2.6, 2, 1.25, 'crate');
          pockets.push({ x: (xa + xb) / 2 + (side < 0 ? 3 : -3), z: pz0 + plen / 2 + 1, side });
          z = hallRect[3];
        }
      }
    }
    return pockets;
  };
  return { boxes, add, B, R, stairs, stairsTo, hall, spawnRoom, scatter, corridor, overlaps };
}
const row = (cx, z, n = 5, gap = 4, dz = 2.5) => Array.from({ length: n }, (_, i) => [cx - ((n - 1) * gap) / 2 + i * gap, 0, z - (i % 2) * dz]);
const lane = (x0, z0, x1, z1) => [x0, z0, x1, z1]; // a keep-clear rectangle
const KINDS = {
  street: [[1.8, 1.8, 1.3, 'crate'], [3.5, 0.9, 1.2, 'barrier'], [2, 2, 1.4, 'crate'], [4, 0.9, 1.2, 'barrier'], [4.5, 1.6, 1.1, 'planter']],
  desert: [[2, 2, 1.4, 'crate'], [3.4, 2.2, 1.3, 'stall'], [3, 3, 1.6, 'rock'], [4, 1.2, 1.2, 'barrier'], [2.4, 2.4, 2.2, 'rock']],
  industrial: [[6, 2.4, 2.6, 'container'], [6, 2.4, 2.6, 'containerB'], [2.4, 2.4, 1.4, 'crate'], [3, 1.2, 1.2, 'barrier'], [2, 2, 2, 'crate']],
  city: [[3.5, 0.9, 1.2, 'barrier'], [2.2, 2.2, 1.3, 'crate'], [4, 1.6, 1.1, 'planter'], [1.6, 1.6, 2.2, 'pillar']],
};

// pathInfo: cumulative lengths of a polyline of [x,z] points
export function pathInfo(path) {
  const seg = []; let total = 0;
  for (let i = 1; i < path.length; i++) { const l = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]); seg.push({ a: path[i - 1], b: path[i], l, s: total }); total += l; }
  return { seg, total };
}
export function pathPoint(info, d) {
  d = clamp(d, 0, info.total);
  for (const s of info.seg) if (d <= s.s + s.l + 1e-6) { const t = s.l ? (d - s.s) / s.l : 0; return { x: s.a[0] + (s.b[0] - s.a[0]) * t, z: s.a[1] + (s.b[1] - s.a[1]) * t, yaw: Math.atan2(s.b[0] - s.a[0], s.b[1] - s.a[1]) }; }
  const s = info.seg[info.seg.length - 1]; return { x: s.b[0], z: s.b[1], yaw: Math.atan2(s.b[0] - s.a[0], s.b[1] - s.a[1]) };
}

// ------------------------------------------------------------------ FROSTGATE (escort)
function frostgate() {
  const b = mk(), { B, R, stairs, hall, boxes } = b;
  const keepLane = [lane(-2.8, -60, 2.8, 150)];
  R(-37, -87, -34, 175, 18, 'cliff'); R(34, -87, 37, 175, 18, 'cliff'); R(-37, -87, 37, -84, 18, 'cliff'); R(-37, 172, 37, 175, 18, 'cliff');
  b.spawnRoom(0, -84, -62, 'z+'); b.spawnRoom(0, 148, 172, 'z-');
  R(-34, -84, -19, -62, 11, 'wallA'); R(19, -84, 34, -62, 11, 'wallA'); R(-34, 148, -19, 172, 11, 'wallA'); R(19, 148, 34, 172, 11, 'wallA');
  R(-34, -62, -18, -44, 10, 'wallA');
  B(-31, -41, 3, 2, 1.2, 'crate'); B(-20.5, -39, 2, 2, 1.3, 'crate');
  hall(-34, -34, -18, -14, 4.05, [['x+', -24, 4], ['z+', -26, 3]], 'wallB'); b.stairsTo([-34, -34, -18, -14], 4.05, 'z-', 8, 3); R(-18.4, -34, -18, -14, 0.9, 'trim', 4.05);
  R(-34, -14, -18, 10, 10, 'wallA'); R(-34, 10, -18, 22, 12.5, 'wallA');
  hall(-34, 22, -18, 38, 5, [['x+', 30, 4], ['z-', -28, 3]], 'wallA'); b.stairsTo([-34, 22, -18, 38], 5, 'z+', 10, 3); B(-30, 44, 2.5, 2.5, 1.3, 'crate');
  R(-34, 50, -18, 80, 11, 'wallA');
  R(18, -62, 34, -30, 10, 'wallA');
  hall(18, -30, 34, -8, 4.05, [['x-', -19, 4], ['z+', 26, 3]], 'wallB'); R(18, -30, 18.4, -8, 0.9, 'trim', 4.05);
  b.stairsTo([18, -30, 34, -8], 4.05, 'z+', 8, 3); B(31, -2, 3, 2, 1.2, 'crate'); B(21, -4, 2, 2, 1.3, 'crate');
  R(18, 2, 34, 22, 12.5, 'wallA'); B(26, 27, 2, 2, 1.3, 'crate'); B(22, 29.5, 3, 1.4, 1.2, 'barrier');
  hall(18, 32, 34, 56, 5, [['x-', 44, 4], ['z-', 28, 3]], 'wallA'); R(18, 56, 34, 80, 10, 'wallA');
  R(-18, 10, -12, 22, 12.5, 'wallA'); R(12, 10, 18, 22, 12.5, 'wallA'); R(-18, 10, 18, 22, 3.2, 'trim', 9.3); R(-12, 12, 12, 20, 0.7, 'trim', 8.6);
  R(-34, 80, -8, 98, 11, 'wallA'); R(8, 80, 34, 98, 11, 'wallA'); R(-8, 80, 8, 98, 4, 'roof', 6.5);
  B(-4.5, 86, 0.8, 0.8, 5.5, 'trim'); B(4.5, 86, 0.8, 0.8, 5.5, 'trim'); B(-4.5, 92, 0.8, 0.8, 5.5, 'trim'); B(4.5, 92, 0.8, 0.8, 5.5, 'trim');
  B(-5.5, 89, 1.2, 4, 1.15, 'counter'); B(5.5, 89, 1.2, 4, 1.15, 'counter');
  R(-34, 98, -18, 112, 9, 'wallA');
  hall(-34, 122, -18, 142, 4.05, [['x+', 132, 4], ['z-', -26, 3]], 'wallB'); b.stairsTo([-34, 122, -18, 142], 4.05, 'z-', 8, 3); R(-18.4, 122, -18, 142, 0.9, 'trim', 4.05);
  B(-30, 117, 3, 2, 1.2, 'crate'); B(-21, 114.5, 2, 2, 1.3, 'crate'); R(-34, 142, -18, 148, 9, 'wallA');
  R(18, 98, 34, 110, 9, 'wallA'); B(31, 116, 3, 2, 1.2, 'crate'); B(21.5, 112, 2, 2, 1.3, 'crate');
  hall(18, 120, 34, 140, 4.05, [['x-', 130, 4], ['z+', 27, 3]], 'wallB'); b.stairsTo([18, 120, 34, 140], 4.05, 'z-', 8, 3); R(18, 120, 18.4, 140, 0.9, 'trim', 4.05); R(18, 140, 34, 148, 9, 'wallA');
  const cover = [
    [-10, -40, 'fountain', 7, 7, 1.0], [10, -40, 'fountain', 7, 7, 1.0], [-10, -40, 'statue', 1.6, 1.6, 4.2], [10, -40, 'statue', 1.6, 1.6, 4.2],
    [-13, -22, 'barrier', 4, 0.9, 1.2], [13, -22, 'barrier', 4, 0.9, 1.2], [-6, -52, 'crate', 1.6, 1.6, 1.3], [6, -52, 'crate', 1.6, 1.6, 1.3],
    [-14, -8, 'planter', 6, 1.6, 1.1], [14, -8, 'planter', 6, 1.6, 1.1], [-8, 0, 'barrier', 3, 0.9, 1.2], [8, 0, 'barrier', 3, 0.9, 1.2],
    [-9, 30, 'stall', 3.4, 2.2, 1.3], [9, 34, 'stall', 3.4, 2.2, 1.3], [-12, 48, 'stall', 3.4, 2.2, 1.3], [12, 52, 'stall', 3.4, 2.2, 1.3],
    [-6, 62, 'crate', 2, 2, 1.4], [6, 66, 'crate', 2, 2, 1.4], [-14, 70, 'barrier', 4, 0.9, 1.2], [14, 72, 'barrier', 4, 0.9, 1.2],
    [-13, 40, 'barrier', 3, 0.9, 1.2], [13, 42, 'planter', 5, 1.6, 1.1],
    [-10, 106, 'pillar', 1.6, 1.6, 6], [10, 106, 'pillar', 1.6, 1.6, 6], [-10, 122, 'pillar', 1.6, 1.6, 6], [10, 122, 'pillar', 1.6, 1.6, 6],
    [-14, 114, 'barrier', 3.5, 0.9, 1.2], [14, 114, 'barrier', 3.5, 0.9, 1.2], [-6, 128, 'crate', 1.8, 1.8, 1.3], [6, 130, 'crate', 1.8, 1.8, 1.3],
    [-13, 138, 'planter', 5, 1.6, 1.1], [13, 138, 'planter', 5, 1.6, 1.1], [-6, 100, 'crate', 1.6, 1.6, 1.3], [6, 102, 'barrier', 3, 0.9, 1.2],
  ];
  for (const [x, z, m, w, d, h] of cover) B(x, z, w, d, h, m);
  B(-6, 144, 1.4, 1.4, 7, 'trim'); B(6, 144, 1.4, 1.4, 7, 'trim'); R(-6.7, 143.3, 6.7, 144.7, 1, 'trim', 6.8);
  return {
    id: 'frostgate', boxes, bounds: { x0: -34, x1: 34, z0: -84, z1: 172 }, spawns: [row(0, -80, 5, 4, 2.5), row(0, 168, 5, 4, 2.5)],
    fwd: [row(0, -4), row(0, 69)], dspawns: [row(0, 72), row(0, 120)], path: [[0, -50], [0, 138]], checkpoints: [74, 148],
    packs: [{ pos: [-30, 0, -37], big: false }, { pos: [23.5, 0, -0.5], big: false }, { pos: [-30, 0, 46], big: true }, { pos: [30, 0, 28], big: false }, { pos: [-20.5, 0, 119], big: false }, { pos: [30, 0, 112], big: false }, { pos: [-5, 0, 70], big: true }, { pos: [5, 0, 106], big: false }],
    attackTime: 300, lamps: [[-56, 140, 24]], lampX: [-15.5, 15.5], bannerA: [[0, 7, 9.9, 5, 3.6, 0.08], [-17.9, 5, -30, 0.08, 4, 3]], bannerD: [[0, 7, 22.1, 5, 3.6, 0.08], [17.9, 5, 130, 0.08, 4, 3]],
    decorZones: [[-17, -56, 17, 140]],
  };
}

// ------------------------------------------------------------------ SUNSCAR CANYON (escort, big, desert)
function sunscar() {
  const b = mk(), rand = rng(901), { R, B, boxes } = b;
  // rock everywhere the street is not
  R(-60, -150, -23, 110, 22, 'cliff'); R(23, -150, 120, 110, 22, 'cliff'); R(-60, 110, -31, 164, 22, 'cliff'); R(73, 110, 120, 164, 22, 'cliff');
  R(-60, 164, 9, 352, 22, 'cliff'); R(59, 164, 120, 352, 22, 'cliff'); R(-60, -154, 120, -150, 22, 'cliff'); R(-60, 350, 120, 354, 22, 'cliff');
  R(-31, 164, 9, 166, 22, 'cliff'); R(-60, 110, -30, 112, 22, 'cliff');
  b.spawnRoom(0, -150, -112, 'z+', 19, 9, 9);
  const pk1 = b.corridor(rand, { cx: 0, hs: 12, depth: 12, z0: -112, z1: 108, arches: [-30, 52] });
  R(-12, -36, 12, -24, 3.2, 'trim', 9.3); R(-12, 46, 12, 58, 3.2, 'trim', 9.3); // arch spans (pylons come from the side blocks)
  // junction plaza (x -30..72, z 108..164): the payload turns east here
  R(-30, 112, -12, 121, 9, 'wallA'); b.hall(-30, 134, -14, 160, 5, [['x+', 147, 4], ['z-', -22, 3]], 'wallB'); b.stairsTo([-30, 134, -14, 160], 5, 'z-', 1, 3);
  R(14, 142, 28, 162, 10, 'wallA'); b.hall(46, 112, 70, 128, 4.05, [['z+', 58, 4], ['x-', 120, 3]], 'wallB'); b.stairsTo([46, 112, 70, 128], 4.05, 'x-', 10, 3);
  B(8, 122, 4, 4, 3, 'rock'); B(50, 150, 5, 5, 3.4, 'rock'); B(-6, 150, 3, 3, 2.4, 'rock');
  const pk2 = b.corridor(rand, { cx: 34, hs: 12, depth: 12, z0: 166, z1: 308, arches: [226] });
  R(22, 220, 46, 232, 3.2, 'trim', 9.3);
  b.spawnRoom(34, 308, 348, 'z-', 19, 9, 9);
  const keepA = [lane(-3, -112, 3, 112), lane(-3, 108, 3, 138), lane(0, 132, 37, 138), lane(31, 134, 37, 308), lane(-10, 4, 10, 16), lane(22, 144, 46, 156)];
  b.scatter(rand, [-9, -108, 9, 104], 22, KINDS.desert, keepA);
  b.scatter(rand, [-28, 110, 70, 162], 14, KINDS.desert, keepA);
  b.scatter(rand, [25, 168, 43, 304], 18, KINDS.desert, keepA);
  const packs = [...pk1.filter((_, i) => i % 2 === 0), ...pk2.filter((_, i) => i % 2 === 1)].map((p, i) => ({ pos: [p.x, 0, p.z], big: i % 4 === 2 }));
  packs.push({ pos: [-26 + 8, 0, 120], big: true }, { pos: [60, 0, 150], big: false });
  return {
    id: 'sunscar', boxes, bounds: { x0: -26, x1: 73, z0: -150, z1: 350 }, spawns: [row(0, -144, 5, 4, 3), row(34, 344, 5, 4, 2.5)], fwd: [row(0, 10), row(34, 150)], dspawns: [row(0, 85), row(34, 225)],
    path: [[0, -80], [0, 135], [34, 135], [34, 300]], checkpoints: [140, 300], packs, attackTime: 450,
    lampX: [-10.5, 10.5], decorZones: [[-12, -108, 12, 108]],
  };
}

// ------------------------------------------------------------------ DUSTLINE JUNCTION (hybrid)
function junction() {
  const b = mk(), rand = rng(404), { R, B, boxes } = b;
  R(-80, -134, 100, -130, 22, 'cliff'); R(-80, 290, 100, 294, 22, 'cliff');
  R(-80, -130, -24, -22, 22, 'cliff'); R(-80, -22, -41, 44, 22, 'cliff'); R(-80, 44, -24, 108, 22, 'cliff'); R(-80, 108, -50, 290, 22, 'cliff');
  R(24, -130, 100, -22, 22, 'cliff'); R(41, -22, 100, 44, 22, 'cliff'); R(24, 44, 100, 128, 22, 'cliff'); R(-2, 128, 100, 290, 22, 'cliff');
  b.spawnRoom(0, -130, -94, 'z+', 19, 9, 9);
  const pk1 = b.corridor(rand, { cx: 0, hs: 11, depth: 12, z0: -94, z1: -22, arches: [] });
  // the junction plaza with the capture point in the middle (x -40..40, z -22..44)
  R(-40, -22, -26, -6, 8, 'wallB'); b.hall(-40, 8, -26, 38, 5, [['x+', 23, 4], ['z-', -33, 3]], 'wallA'); b.stairsTo([-40, 8, -26, 38], 5, 'z-', 1, 3);
  R(26, 31, 40, 44, 9, 'wallB'); b.hall(26, -20, 40, 22, 4.05, [['x-', 1, 4], ['z+', 33, 3]], 'wallA'); b.stairsTo([26, -20, 40, 22], 4.05, 'z+', 10, 3);
  for (const [x, z] of [[-8, 6], [8, 6], [-8, 18], [8, 18]]) B(x, z, 4, 0.9, 1.2, 'barrier');
  B(0, 12, 2.4, 2.4, 6, 'trim'); // the beacon pylon marks the point
  const pk2 = b.corridor(rand, { cx: 0, hs: 11, depth: 12, z0: 44, z1: 108, arches: [76] });
  R(-11, 70, 11, 82, 3.2, 'trim', 9.3);
  B(-8, 118, 3, 3, 2.4, 'rock'); B(-40, 116, 4, 4, 3, 'rock'); B(10, 114, 3, 3, 2, 'rock');
  const pk3 = b.corridor(rand, { cx: -26, hs: 11, depth: 12, z0: 128, z1: 250, arches: [190] });
  R(-37, 184, -15, 196, 3.2, 'trim', 9.3);
  b.spawnRoom(-26, 250, 290, 'z-', 19, 9, 9);
  const keep = [lane(-3, -94, 3, 116), lane(-29, 113, 3, 119), lane(-29, 113, -23, 250), lane(-10, -40, 10, -28), lane(-36, 144, -16, 156)];
  b.scatter(rand, [-9, -90, 9, -26], 12, KINDS.desert, keep);
  b.scatter(rand, [-36, -20, 36, 40], 8, KINDS.desert, [...keep, [-10, 3, 10, 21]]);
  b.scatter(rand, [-9, 46, 9, 104], 12, KINDS.desert, keep);
  b.scatter(rand, [-36, 132, -16, 246], 14, KINDS.desert, keep);
  const packs = [...pk1.filter((_, i) => i % 2 === 0), ...pk2.filter((_, i) => i % 2 === 1), ...pk3.filter((_, i) => i % 2 === 0)].map((p, i) => ({ pos: [p.x, 0, p.z], big: i % 3 === 1 }));
  packs.push({ pos: [-34, 0, 3], big: true }, { pos: [34, 0, 26], big: false });
  return {
    id: 'junction', boxes, bounds: { x0: -52, x1: 42, z0: -130, z1: 292 }, spawns: [row(0, -124, 5, 4, 3), row(-26, 283, 5, 4, 2.5)], fwd: [row(0, -34), row(-26, 150)], dspawns: [row(0, 98), row(-26, 200)],
    points: [{ pos: [0, 0, 12], r: 9, name: 'THE JUNCTION' }], path: [[0, 12], [0, 116], [-26, 116], [-26, 250]], checkpoints: [130], packs, attackTime: 210,
    lampX: [-10, 10], decorZones: [[-11, -94, 11, 108]],
  };
}

// ------------------------------------------------------------------ LUMEN HEIGHTS (control, city at night)
function lumen() {
  const b = mk(), rand = rng(77), { R, B, boxes } = b;
  const S = 64;
  R(-S - 3, -S - 3, S + 3, -S, 20, 'cliff'); R(-S - 3, S, S + 3, S + 3, 20, 'cliff'); R(-S - 3, -S, -S, S, 20, 'cliff'); R(S, -S, S + 3, S, 20, 'cliff');
  b.spawnRoom(0, -64, -44, 'z+', 19, 9, 9); b.spawnRoom(0, 44, 64, 'z-', 19, 9, 9);
  R(-64, -64, -19, -44, 12, 'wallA'); R(19, -64, 64, -44, 12, 'wallA'); R(-64, 44, -19, 64, 12, 'wallA'); R(19, 44, 64, 64, 12, 'wallA');
  // outer tower blocks and mid-block halls with sky-bridge stairs
  for (const sx of [-1, 1]) {
    R(sx * 38 - (sx > 0 ? 0 : 26), -44, sx * 38 + (sx > 0 ? 26 : 0), 44, 14, 'wallA'); // outer towers (x 38..64)
    for (const sz of [-1, 1]) {
      const z0 = sz < 0 ? -42 : 8, z1 = sz < 0 ? -8 : 42, xa = sx < 0 ? -26 : 14, xb = sx < 0 ? -14 : 26;
      b.hall(xa, z0, xb, z1, 5, [[sx < 0 ? 'x+' : 'x-', (z0 + z1) / 2, 4], [sz < 0 ? 'z+' : 'z-', (xa + xb) / 2, 3]], 'wallB');
      b.stairsTo([xa, z0, xb, z1], 5, sx < 0 ? 'x-' : 'x+', (z1 - z0) / 2 - 1.5, 3);
      // parapets
      R(sx < 0 ? xb - 0.4 : xa, z0, sx < 0 ? xb : xa + 0.4, z1, 0.9, 'trim', 5);
      B((xa + xb) / 2, sz < 0 ? -45 : 45, 3, 1, 1.2, 'barrier');
    }
  }
  // two sky bridges over the avenue
  // sky bridges: solid deck with thin neon edge strips (a fully emissive slab glared over the whole street)
  for (const z of [-24, 24]) { R(-14, z - 2, 14, z + 2, 0.4, 'roof', 4.6); R(-14, z - 2, 14, z - 1.86, 0.1, 'neonB', 5.0); R(-14, z + 1.86, 14, z + 2, 0.1, 'neonB', 5.0); }
  // the plaza: low walls ringing the point, a beacon pylon, planters
  for (const [x, z, w, d] of [[-7, -7, 4, 0.9], [7, -7, 4, 0.9], [-7, 7, 4, 0.9], [7, 7, 4, 0.9], [-9.5, 0, 0.9, 4], [9.5, 0, 0.9, 4]]) B(x, z, w, d, 1.2, 'barrier');
  // the plaza beacon: an open frame of four neon posts and a cap, not a solid glowing block
  for (const [x, z] of [[-0.85, -0.85], [0.85, -0.85], [-0.85, 0.85], [0.85, 0.85]]) B(x, z, 0.3, 0.3, 5.5, 'neonA');
  R(-1, -1, 1, 1, 0.3, 'trim', 5.5);
  const keep = [lane(-6, -6, 6, 6)];
  // props are scattered on the south half and mirrored through the centre so both teams get the same map
  const n0 = boxes.length;
  b.scatter(rand, [-12, -40, 12, -12], 7, KINDS.city, [...keep, lane(-14, -26, 14, -22)]);
  b.scatter(rand, [-36, -6, 36, -1.5], 3, KINDS.city, [lane(-12, -12, 12, 12)]);
  b.scatter(rand, [-36, -40, -28, -2], 3, KINDS.city); b.scatter(rand, [28, -40, 36, -2], 3, KINDS.city);
  b.scatter(rand, [-36, -62, 36, -46], 5, KINDS.city, [lane(-12, -64, 12, -44)]);
  for (const bx of boxes.slice(n0)) boxes.push({ ...bx, x0: -bx.x1, x1: -bx.x0, z0: -bx.z1, z1: -bx.z0 });
  const dm = [[-32, 0, -30], [32, 0, -30], [-32, 0, 30], [32, 0, 30], [0, 0, -34], [0, 0, 34], [-32, 0, 0], [32, 0, 0], [-8, 0, -40], [8, 0, 40]];
  return {
    id: 'lumen', boxes, bounds: { x0: -64, x1: 64, z0: -64, z1: 64 }, spawns: [row(0, -60, 5, 4, -3), row(0, 60, 5, 4, 3)], dmSpawns: dm,
    points: [{ pos: [0, 0, 0], r: 9, name: 'CENTRAL PLAZA' }, { pos: [-30, 0, 0], r: 8, name: 'NEON ARCADE' }, { pos: [30, 0, 0], r: 8, name: 'SKY GARDEN' }], packs: [{ pos: [-32, 0, -20], big: false }, { pos: [32, 0, 20], big: false }, { pos: [-32, 0, 22], big: false }, { pos: [32, 0, -22], big: false }, { pos: [0, 0, -34], big: true }, { pos: [0, 0, 34], big: true }, { pos: [-20, 0, 0], big: false }, { pos: [20, 0, 0], big: false }],
    attackTime: 600, lampX: [-14, 14], decorZones: [[-36, -42, 36, 42]],
  };
}

// ------------------------------------------------------------------ THE FOUNDRY (arena)
function foundry() {
  const b = mk(), rand = rng(31), { R, B, boxes } = b;
  const S = 50;
  R(-S - 3, -S - 3, S + 3, -S, 18, 'cliff'); R(-S - 3, S, S + 3, S + 3, 18, 'cliff'); R(-S - 3, -S, -S, S, 18, 'cliff'); R(S, -S, S + 3, S, 18, 'cliff');
  // central furnace on a stepped dais
  for (const [dx, dz, dir, ox, oz] of [[0, -1, '+z', -4, -13.5 - 4.2], [0, 1, '-z', -4, 13.5 + 4.2], [-1, 0, '+x', -13.5 - 4.2, -4], [1, 0, '-x', 13.5 + 4.2, -4]]) b.stairs(ox, oz, 8, dir, 3, 0.45, 1.4);
  R(-13.5, -13.5, 13.5, 13.5, 1.35, 'stone'); B(0, 0, 8, 8, 6, 'wallB', 1.35); B(0, 0, 4, 4, 3, 'trim', 7.35);
  for (const [x, z] of [[-10, -10], [10, -10], [-10, 10], [10, 10]]) B(x, z, 2, 2, 3, 'crate', 1.35);
  // the catwalk ring at y = 5: four straight runs joined at the corners
  const W = 5, o = 30;
  for (const [x0, z0, x1, z1] of [[-o - W / 2, -o - W / 2, -o + W / 2, o + W / 2], [o - W / 2, -o - W / 2, o + W / 2, o + W / 2], [-o - W / 2, -o - W / 2, o + W / 2, -o + W / 2], [-o - W / 2, o - W / 2, o + W / 2, o + W / 2]]) R(x0, z0, x1, z1, 0.4, 'grate', 4.6);
  for (const [x, z] of [[-o, -o], [o, -o], [-o, o], [o, o], [0, -o], [0, o]]) B(x, z, 1.4, 1.4, 4.6, 'trim');
  const e = o + W / 2;
  R(-e, -e, -e + 0.4, e, 0.9, 'trim', 5); R(e - 0.4, -e, e, e, 0.9, 'trim', 5); R(-e, -e, e, -e + 0.4, 0.9, 'trim', 5); R(-e, e - 0.4, e, e, 0.9, 'trim', 5);
  // stairs up to the ring from the inside at the four midpoints (they end flush with the catwalk edge)
  b.stairsTo([-e, -e, -e + W, e], 5, 'x+', e + 8.5, 3); b.stairsTo([e - W, -e, e, e], 5, 'x-', e - 11.5, 3);
  b.stairsTo([-e, -e, e, -e + W], 5, 'z+', e - 11.5, 3); b.stairsTo([-e, e - W, e, e], 5, 'z-', e + 8.5, 3);
  // container yards in the four quadrants
  const ring = [[-42, 0, -42], [42, 0, -42], [-42, 0, 42], [42, 0, 42], [0, 0, -44], [0, 0, 44], [-44, 0, 0], [44, 0, 0], [-20, 0, -20], [20, 0, 20]];
  const fpacks = [{ pos: [0, 0, -20], big: true }, { pos: [0, 0, 20], big: true }, { pos: [-20, 0, 0], big: false }, { pos: [20, 0, 0], big: false }, { pos: [-42, 0, -20], big: false }, { pos: [42, 0, 20], big: false }, { pos: [-42, 0, 20], big: false }, { pos: [42, 0, -20], big: false }];
  const keepYard = [lane(-15, -15, 15, 15), ...ring.map(([x, , z]) => lane(x - 3, z - 3, x + 3, z + 3)), ...fpacks.map((p) => lane(p.pos[0] - 2.5, p.pos[2] - 2.5, p.pos[0] + 2.5, p.pos[2] + 2.5)), lane(-50, -50, 50, -44), lane(-50, 44, 50, 50)];
  for (const [x0, z0, x1, z1] of [[-27, -27, -6, -6], [6, -27, 27, -6], [-27, 6, -6, 27], [6, 6, 27, 27]]) b.scatter(rand, [x0, z0, x1, z1], 7, KINDS.industrial, keepYard);
  b.scatter(rand, [-46, -46, -34, 46], 6, KINDS.industrial, keepYard); b.scatter(rand, [34, -46, 46, 46], 6, KINDS.industrial, keepYard);
  return {
    id: 'foundry', boxes, bounds: { x0: -50, x1: 50, z0: -50, z1: 50 }, spawns: [row(-20, -44, 5, 4, 2), row(20, 44, 5, 4, -2)], dmSpawns: ring,
    points: [{ pos: [0, 0, 0], r: 12.5, name: 'THE FURNACE' }, { pos: [-34, 0, 15], r: 8.5, name: 'THE SMELTER' }, { pos: [34, 0, -15], r: 8.5, name: 'LOADING BAY' }], packs: fpacks,
    attackTime: 480, decorZones: [], lampX: [], arena: true,
  };
}

// ------------------------------------------------------------------ the catalogue
export const THEMES = {
  snow: {
    time: 16.5, ground: '#dfe8f3', pave: '#586170', rail: '#2f343d', particles: 'snow', fog: 0.0042, lamp: '#ffe6b0', exposure: 0.88, ambient: 0.5, sky: [0.42, 0.62, 0.95], fogColor: [0.66, 0.77, 0.92], zenith: [0.2, 0.42, 0.85], horizon: [0.78, 0.86, 0.96],
    mats: { wallA: ['#e8dcc8', 0.85], wallB: ['#9c3b2e', 0.85], trim: ['#6f4524'], stone: ['#7e8794'], roof: ['#f2f6fb'], cliff: ['#4d5663'], crate: ['#a67a43'], barrier: ['#c4c9d2'], planter: ['#2b8a8a'], fountain: ['#a7b0bd'], statue: ['#7d8ea3'], pillar: ['#b6bfcf'], stall: ['#e0a628'], counter: ['#7a5330'], rock: ['#7e8794'], grate: ['#4a4d52'], container: ['#2f6f9f'], containerB: ['#a0402a'], neonA: ['#3a9bff', 0.4, '#3a9bff', 2], neonB: ['#ff4a52', 0.4, '#ff4a52', 2] },
  },
  desert: {
    time: 12.4, ground: '#d8bf8f', pave: '#b39766', rail: '#6b4f2e', particles: 'dust', fog: 0.0036, lamp: '#ffd9a0', exposure: 0.98, ambient: 0.62, sky: [0.5, 0.68, 0.95], fogColor: [0.88, 0.8, 0.66], zenith: [0.25, 0.5, 0.88], horizon: [0.97, 0.86, 0.68],
    mats: { wallA: ['#e0c08a', 0.9], wallB: ['#c0643a', 0.9], trim: ['#6b4a2e'], stone: ['#a08868'], roof: ['#e8d3b0'], cliff: ['#9a5c38'], crate: ['#9c7646'], barrier: ['#cbb08a'], planter: ['#4f8a3a'], fountain: ['#b9a583'], statue: ['#a08868'], pillar: ['#d8c29c'], stall: ['#2e5fb8'], counter: ['#7a5330'], rock: ['#9a6a45'], grate: ['#5b5448'], container: ['#2fb5b0'], containerB: ['#a0402a'], neonA: ['#3a9bff', 0.4, '#3a9bff', 2], neonB: ['#ff4a52', 0.4, '#ff4a52', 2] },
  },
  city: {
    time: 22.6, ground: '#141a26', pave: '#222a3a', rail: '#0c1018', particles: 'rain', fog: 0.007, lamp: '#7fe6ff', exposure: 1.35, ambient: 1.1, sky: [0.1, 0.12, 0.3], fogColor: [0.1, 0.12, 0.22], zenith: [0.04, 0.06, 0.22], horizon: [0.3, 0.2, 0.45], neon: true,
    mats: { wallA: ['#3a4766', 0.7], wallB: ['#4b3c6a', 0.7], trim: ['#101520'], stone: ['#3b4358'], roof: ['#1c2230'], cliff: ['#141a26'], crate: ['#554a3a'], barrier: ['#59627a'], planter: ['#2a4a3f'], fountain: ['#3b4358'], statue: ['#59627a'], pillar: ['#47506a'], stall: ['#5a2a4a'], counter: ['#3a2a2a'], rock: ['#3b4358'], grate: ['#2a3040'], container: ['#2f6f9f'], containerB: ['#a0402a'], neonA: ['#2af0ff', 0.4, '#2af0ff', 3.2], neonB: ['#ff3df2', 0.4, '#ff3df2', 3.2] },
  },
  industrial: {
    time: 15.5, ground: '#4a4d52', pave: '#35383d', rail: '#222428', particles: 'embers', fog: 0.003, lamp: '#ffb866', exposure: 1.05, ambient: 0.95, sky: [0.5, 0.5, 0.55], fogColor: [0.62, 0.5, 0.42], zenith: [0.32, 0.34, 0.45], horizon: [0.95, 0.62, 0.35],
    mats: { wallA: ['#5b5f66', 0.6, 0.08], wallB: ['#7a4a2e', 0.75], trim: ['#e0a020'], stone: ['#6a6e75'], roof: ['#3a3d42'], cliff: ['#2a2c30'], crate: ['#8a5a30'], barrier: ['#9a9ea4'], planter: ['#2b7a7a'], fountain: ['#6a6e75'], statue: ['#8a8e95'], pillar: ['#6a6e75'], stall: ['#7a4a2e'], counter: ['#4a4d52'], rock: ['#5a5d62'], grate: ['#4f545b', 0.5, 0.1], container: ['#2f8a8a', 0.6, 0.08], containerB: ['#a0402a', 0.6, 0.08], neonA: ['#ff9a3a', 0.4, '#ff7a1a', 3], neonB: ['#ff4a2a', 0.4, '#ff2a1a', 3] },
  },
};

export const MAPS = {
  frostgate: { id: 'frostgate', name: 'FROSTGATE', tagline: 'A snowbound station street with a grand arch.', modes: ['escort', 'tdm'], theme: 'snow', build: frostgate, size: 'MEDIUM' },
  sunscar: { id: 'sunscar', name: 'SUNSCAR CANYON', tagline: 'A long haul through a red-rock canyon town.', modes: ['escort'], theme: 'desert', build: sunscar, size: 'HUGE' },
  junction: { id: 'junction', name: 'DUSTLINE JUNCTION', tagline: 'Take the crossroads, then drive the payload out of town.', modes: ['hybrid'], theme: 'desert', build: junction, size: 'LARGE' },
  lumen: { id: 'lumen', name: 'LUMEN HEIGHTS', tagline: 'Neon rooftops, sky bridges, one plaza worth owning.', modes: ['control', 'tdm', 'ffa', 'elim'], theme: 'city', build: lumen, size: 'MEDIUM' },
  foundry: { id: 'foundry', name: 'THE FOUNDRY', tagline: 'Catwalks, containers and a furnace in the middle.', modes: ['tdm', 'ffa', 'training', 'control', 'elim'], theme: 'industrial', build: foundry, size: 'SMALL' },
};
export const MODES = {
  escort: { id: 'escort', name: 'ESCORT', blurb: 'Push the payload to the end of the map before time runs out, or stop it.', teams: true, objective: true },
  hybrid: { id: 'hybrid', name: 'HYBRID', blurb: 'Capture the point, then escort the payload to the goal.', teams: true, objective: true },
  control: { id: 'control', name: 'CONTROL', blurb: 'Hold the point to fill your meter. Best of three rounds.', teams: true, objective: true },
  elim: { id: 'elim', name: 'ELIMINATION', blurb: 'No respawns. Wipe the other team, or hold the centre once it opens. First to three rounds.', teams: true, objective: true },
  tdm: { id: 'tdm', name: 'TEAM DEATHMATCH', blurb: 'First team to thirty eliminations. Respawn fast, hit hard.', teams: true, objective: false },
  ffa: { id: 'ffa', name: 'FREE FOR ALL', blurb: 'Every hero for themselves. First to twenty eliminations.', teams: false, objective: false },
  training: { id: 'training', name: 'TRAINING RANGE', blurb: 'Try any hero against target dummies. No pressure, infinite ultimates.', teams: false, objective: false },
};

export function makeLevel(mapId, mode) {
  const def = MAPS[mapId] || MAPS.frostgate, level = def.build();
  level.def = def; level.name = def.name; level.theme = def.theme; level.mode = mode;
  level.pathInfo = level.path ? pathInfo(level.path) : null;
  if (level.pathInfo) { level.pathLen = level.pathInfo.total; level.checkpoints = (level.checkpoints || []).filter((d) => d < level.pathLen - 5); }
  if (!level.dmSpawns) level.dmSpawns = [...level.spawns[0], ...level.spawns[1]];
  if (!level.points) level.points = [];
  return level;
}

// ------------------------------------------------------------------ nav grid
// 1 m cells, up to four standable layers per cell. Edges allow step-ups of 0.6 m and drops of up to 5 m.
export function buildNav(level) {
  const { x0, x1, z0, z1 } = level.bounds, W = Math.ceil(x1 - x0), D = Math.ceil(z1 - z0), L = 4;
  const nav = { x0, z0, W, D, L, surf: new Float32Array(W * D * L).fill(NaN) };
  const C = 8, grid = new Map();
  for (const b of level.boxes) for (let i = Math.floor(b.x0 / C); i <= Math.floor(b.x1 / C); i++) for (let j = Math.floor(b.z0 / C); j <= Math.floor(b.z1 / C); j++) { const k = i + ',' + j; (grid.get(k) || grid.set(k, []).get(k)).push(b); }
  const nearBoxes = (cx, cz, r) => { const out = new Set(); for (let i = Math.floor((cx - r) / C); i <= Math.floor((cx + r) / C); i++) for (let j = Math.floor((cz - r) / C); j <= Math.floor((cz + r) / C); j++) { const l = grid.get(i + ',' + j); if (l) for (const b of l) out.add(b); } return [...out]; };
  const inCell = (b, cx, cz, r) => b.x0 < cx + r && b.x1 > cx - r && b.z0 < cz + r && b.z1 > cz - r;
  for (let j = 0; j < D; j++) for (let i = 0; i < W; i++) {
    const cx = x0 + i + 0.5, cz = z0 + j + 0.5, near = nearBoxes(cx, cz, 0.7).filter((b) => inCell(b, cx, cz, 0.7));
    const cands = new Set([0]);
    for (const b of near) if (inCell(b, cx, cz, 0.02)) cands.add(b.y1);
    let l = 0;
    for (const s of [...cands].sort((a, b) => a - b)) {
      if (l >= L) break;
      if (near.some((b) => b.y1 > s + 0.62 && b.y0 < s + 1.85 && inCell(b, cx, cz, 0.64))) continue;
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

// calls cb(neighborNode, stepCost) for every node reachable in one step from node `cur`
export function neighbors(nav, cur, cb) {
  const { W, D, L } = nav, cl = cur % L, cell = (cur - cl) / L, ci = cell % W, cj = (cell - ci) / W, cs = nav.surf[cur];
  for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
    if (!di && !dj) continue;
    const ni = ci + di, nj = cj + dj;
    if (ni < 0 || nj < 0 || ni >= W || nj >= D) continue;
    for (let l = 0; l < L; l++) {
      const ns = nav.surf[nav.idx(ni, nj, l)]; if (ns !== ns) continue;
      const dz = ns - cs;
      if (dz > 0.62 || dz < -5) continue;
      if (di && dj) {
        const a = nav.layerAt(ci + di, cj, cs), b = nav.layerAt(ci, cj + dj, cs);
        if (a < 0 || b < 0 || Math.abs(nav.surf[nav.idx(ci + di, cj, a)] - cs) > 0.62 || Math.abs(nav.surf[nav.idx(ci, cj + dj, b)] - cs) > 0.62) continue;
      }
      cb(nav.idx(ni, nj, l), (di && dj ? 1.414 : 1) + (dz < -0.7 ? 1.5 : 0) + (dz > 0.1 ? 0.3 : 0));
    }
  }
}
// every nav node reachable from a world position (breadth first); returns a Uint8Array over nodes
export function floodNav(nav, from) {
  const seen = new Uint8Array(nav.W * nav.D * nav.L), [si, sj] = nav.cellOf(from[0], from[2]), sl = nav.layerAt(si, sj, from[1]);
  if (sl < 0) return seen;
  const q = [nav.idx(si, sj, sl)]; seen[q[0]] = 1;
  for (let h = 0; h < q.length; h++) neighbors(nav, q[h], (n) => { if (!seen[n]) { seen[n] = 1; q.push(n); } });
  return seen;
}
// nearest free ground-level spot to p (used to keep spawns, packs and points off obstacles)
export function snapNav(nav, p, r = 7) {
  const [ci, cj] = nav.cellOf(p[0], p[2]); let best = null, bd = 1e9;
  for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
    const i = ci + di, j = cj + dj, l = nav.layerAt(i, j, p[1] || 0); if (l < 0) continue;
    const s = nav.surf[nav.idx(i, j, l)]; if (Math.abs(s - (p[1] || 0)) > 0.3) continue;
    const d = di * di + dj * dj; if (d < bd) { bd = d; best = [nav.x0 + i + 0.5, s, nav.z0 + j + 0.5]; }
  }
  return best || p;
}
export function nodeAt(nav, p) { const [i, j] = nav.cellOf(p[0], p[2]); const l = nav.layerAt(i, j, p[1]); return l < 0 ? -1 : nav.idx(i, j, l); }

export function findPath(nav, from, to, maxNodes = 30000) {
  const { W, D, L } = nav;
  const [si, sj] = nav.cellOf(from[0], from[2]);
  let [ti, tj] = nav.cellOf(to[0], to[2]);
  const sl = nav.layerAt(si, sj, from[1]);
  if (sl < 0) return null;
  let tl = nav.layerAt(ti, tj, to[1]);
  if (tl < 0) {
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
  const h = (n) => { const l = n % L, cell = (n - l) / L, i = cell % W; return Math.hypot(i - ti, (cell - i) / W - tj); };
  while (heap.length && expanded++ < maxNodes) {
    const [, cur] = pop();
    if (cur === goal) { reached = true; break; }
    neighbors(nav, cur, (n, c) => { const cost = g[cur] + c; if (cost < g[n]) { g[n] = cost; came[n] = cur; push([cost + h(n), n]); } });
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
function makeMats(theme) {
  const out = {};
  for (const [name, a] of Object.entries(theme.mats)) {
    const [color, rough = 0.85, metal = 0, emissive] = a;
    if (typeof metal === 'string') out[name] = new E.Material({ name, color, emissive: metal, emissiveStrength: rough, roughness: 0.5 });
    else out[name] = new E.Material({ name, color, roughness: rough, metallic: typeof metal === 'number' ? metal : 0, ...(emissive ? { emissive, emissiveStrength: a[3] ?? 2 } : {}) });
  }
  for (const n of ['neonA', 'neonB']) { const a = theme.mats[n]; out[n] = new E.Material({ name: n, color: a[0], emissive: a[2], emissiveStrength: a[3], roughness: 0.4 }); }
  out.floor = new E.Material({ name: 'Floor', color: theme.pave, roughness: 0.9 });
  return out;
}

// ------------------------------------------------------------------ visual dressing (no collision): plinths, cornices, windows, pilasters, roof clutter
function shade(hex, f) { const c = E.hexToRGB(hex), h = (v) => Math.max(0, Math.min(255, Math.round(v * 255 * f))).toString(16).padStart(2, '0'); return '#' + h(c[0]) + h(c[1]) + h(c[2]); }
function dressBuildings(kit, level, theme, M) {
  const city = !!theme.neon, rnd = (() => { let a = 1234567; return () => { a = (a * 1103515245 + 12345) & 0x7fffffff; return a / 0x7fffffff; }; })();
  const glass = new E.Material({ name: 'Glass', color: city ? '#0e1424' : '#1c2433', roughness: 0.25, metallic: 0.05 });
  const lit = new E.Material({ name: 'LitWindow', color: city ? '#ffb347' : '#ffcf8a', emissive: city ? '#ffb347' : '#ffcf8a', emissiveStrength: city ? 1.1 : 0.8, roughness: 0.4 });
  const sign = city ? new E.Material({ name: 'Sign', color: '#b6ff4a', emissive: '#b6ff4a', emissiveStrength: 1.6, roughness: 0.4 }) : null;
  const plinthM = {}, trimM = M.trim, clutter = new E.Material({ name: 'Clutter', color: shade(theme.mats.stone[0], 0.9), roughness: 0.8 });
  const B = level.boxes, inside = (x, z, y) => B.some((b) => x > b.x0 + 0.05 && x < b.x1 - 0.05 && z > b.z0 + 0.05 && z < b.z1 - 0.05 && y > b.y0 && y < b.y1);
  const { x0: bx0, x1: bx1, z0: bz0, z1: bz1 } = level.bounds;
  let budget = 2600;
  for (const b of B) {
    if (!(b.m === 'wallA' || b.m === 'wallB') || b.y0 > 0.01) continue;
    const w = b.x1 - b.x0, d = b.z1 - b.z0, h = b.y1 - b.y0; if (h < 4 || w < 2.5 || d < 2.5) continue;
    const cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
    const pm = plinthM[b.m] ||= new E.Material({ name: 'Plinth' + b.m, color: shade(theme.mats[b.m][0], 0.62), roughness: 0.9 });
    kit.box(pm, [cx, 0.4, cz], [w + 0.3, 0.8, d + 0.3]);
    kit.box(trimM, [cx, b.y1 - 0.2, cz], [w + 0.6, 0.4, d + 0.6]);
    // faces that look into the playable area get windows and pilasters
    const faces = [[b.x0, cz, -1, 0, d], [b.x1, cz, 1, 0, d], [cx, b.z0, 0, -1, w], [cx, b.z1, 0, 1, w]];
    for (const [fx, fz, nx, nz, len] of faces) {
      const ox = fx + nx * 0.6, oz = fz + nz * 0.6;
      if (ox < bx0 || ox > bx1 || oz < bz0 || oz > bz1 || inside(ox, oz, 2.4)) continue;
      const along = nx ? [0, 1] : [1, 0], n = Math.floor((len - 1.6) / 3);
      for (let i = 0; i < n && budget > 0; i++) {
        const t = -((n - 1) * 3) / 2 + i * 3, px = fx + along[0] * t + nx * 0.04, pz = fz + along[1] * t + nz * 0.04;
        for (const wy of [2.4, 5.4, 8.4]) { if (wy > h - 1.4) break; const on = rnd() < (city ? 0.6 : 0.25); kit.box(on ? lit : glass, [px, wy, pz], nx ? [0.06, 1.8, 1.2] : [1.2, 1.8, 0.06]); budget--; }
        if (i % 2 === 1 && i < n - 1) { const qx = px + along[0] * 1.5 + nx * 0.06, qz = pz + along[1] * 1.5 + nz * 0.06; kit.box(trimM, [qx, h / 2, qz], nx ? [0.12, h - 0.2, 0.4] : [0.4, h - 0.2, 0.12]); budget--; }
      }
      if (sign && len > 8 && rnd() < 0.35) { const sx = fx + nx * 0.6, sz = fz + nz * 0.6; kit.box(sign, [sx, Math.min(h - 2, 5.5), sz], nx ? [1.0, 3.6, 0.12] : [0.12, 3.6, 1.0]); }
    }
    // roof clutter on tall blocks nobody can reach
    if (h >= 7 && budget > 0) for (let i = 0; i < 1 + Math.floor(w * d / 120); i++) { const ux = b.x0 + 1.2 + rnd() * (w - 2.4), uz = b.z0 + 1.2 + rnd() * (d - 2.4); if (rnd() < 0.6) kit.box(clutter, [ux, b.y1 + 0.4, uz], [1.2, 0.8, 1.0]); else { kit.cyl(clutter, [ux, b.y1 + 0.9, uz], 0.9, 1.8, [0, 0, 0], 10); } budget--; }
  }
}
// one hero landmark per map plus a skyline ring outside the bounds
function buildBackdrop(k, level, theme, M) {
  const { x0, x1, z0, z1 } = level.bounds, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, rnd = (() => { let a = 777; return () => { a = (a * 1103515245 + 12345) & 0x7fffffff; return a / 0x7fffffff; }; })();
  const fog = shade(theme.mats.cliff[0], 1.05), farM = new E.Material({ name: 'Far', color: fog, roughness: 1 }), farM2 = new E.Material({ name: 'Far2', color: shade(theme.mats.cliff[0], 1.25), roughness: 1 });
  const ring = (fn) => { const W = x1 - x0, D = z1 - z0; for (let i = 0; i < 44; i++) { const a = i / 44 * Math.PI * 2, rx = W / 2 + 40 + rnd() * 70, rz = D / 2 + 40 + rnd() * 70; fn(cx + Math.cos(a) * rx, cz + Math.sin(a) * rz, i); } };
  const id = level.id;
  if (theme.neon || theme.particles === 'embers') ring((x, z, i) => { const h = 25 + rnd() * 95, w = 10 + rnd() * 16; k.box(i % 3 ? farM : farM2, [x, h / 2, z], [w, h, w * (0.7 + rnd() * 0.6)]); if (theme.neon && i % 2) k.box(M.neonA, [x, h * 0.7, z], [w + 0.2, 0.4, w * 0.8]); });
  else if (theme.particles === 'dust') ring((x, z, i) => { const h = 18 + rnd() * 30, w = 30 + rnd() * 30; for (let s = 0; s < 3; s++) k.box(s % 2 ? farM : farM2, [x, h * (s + 0.5) / 3, z], [w * (1 - s * 0.22), h / 3, w * (0.8 - s * 0.18)]); });
  else ring((x, z, i) => { const h = 30 + rnd() * 50; k.cyl(i % 2 ? farM : farM2, [x, h / 2, z], 14 + rnd() * 10, h, [0, 0, 0], 6); k.cyl(new E.Material({ name: 'SnowPeak', color: '#f2f6fb', roughness: 0.9 }), [x, h + 2, z], 6, 4, [0, 0, 0], 6); });
  // hero landmarks
  const stone = M.stone, trim = M.trim, warm = new E.Material({ name: 'ClockFace', color: '#ffe7b0', emissive: '#ffd27a', emissiveStrength: 1.6, roughness: 0.4 });
  if (id === 'frostgate') { const z = z1 + 18; k.box(stone, [0, 20, z], [7, 40, 7]); k.box(trim, [0, 40.6, z], [8, 1.2, 8]); for (const s of [-1, 1]) { k.cyl(warm, [0, 33, z + s * 3.56], 2.5, 0.1, [90, 0, 0], 24); } k.box(M.roof, [0, 43, z], [5, 4, 5]); k.cyl(trim, [0, 47, z], 0.15, 5, [0, 0, 0], 6); }
  if (id === 'sunscar') { const z = 52, arch = M.rock; for (let i = 0; i <= 10; i++) { const a = Math.PI * i / 10, x = -Math.cos(a) * 18, y = 14 + Math.sin(a) * 10; k.box(arch, [x, y, z], [6, 4, 5]); } k.box(M.trim, [34, 9, 140], [1, 18, 1]); k.box(M.trim, [40, 9, 140], [1, 18, 1]); k.box(M.trim, [37, 17, 140], [7, 1, 1]); k.cyl(M.roof, [37, 19, 140], 1.4, 1.4, [90, 0, 0], 14); }
  if (id === 'junction') { const x = x1 + 14, z = 12; for (const [a, b] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) k.box(trim, [x + a, 8, z + b], [0.4, 16, 0.4]); k.cyl(M.wallB, [x, 19, z], 3.2, 6, [0, 0, 0], 16); k.cyl(M.roof, [x, 22.6, z], 3.4, 1.2, [0, 0, 0], 16); }
  if (id === 'lumen') { const x = x1 + 30, z = 0; k.cyl(farM2, [x, 45, z], 5, 90, [0, 0, 0], 12); for (const y of [30, 50, 70]) k.cyl(y === 50 ? M.neonB : M.neonA, [x, y, z], 9, 0.6, [0, 0, 0], 24); k.cyl(M.neonA, [x, 92, z], 1, 6, [0, 0, 0], 8); }
  if (id === 'foundry') { const fire = new E.Material({ name: 'FurnaceMouth', color: '#ff7a1a', emissive: '#ff6a10', emissiveStrength: 4, roughness: 0.5 }); k.cyl(M.wallB, [0, 14.2, 0], 1.7, 7.7, [0, 0, 0], 16); k.cyl(trim, [0, 18.2, 0], 2.0, 0.5, [0, 0, 0], 16); for (const [a, b] of [[0, 4.06], [0, -4.06]]) k.box(fire, [a, 2.9, b], [3, 1.6, 0.08]); for (const [a, b] of [[4.06, 0], [-4.06, 0]]) k.box(fire, [a, 2.9, b], [0.08, 1.6, 3]); for (const [x, z] of [[x0 - 10, z0 - 10], [x1 + 10, z1 + 10]]) { k.cyl(farM2, [x, 22, z], 2.4, 44, [0, 0, 0], 12); } k.box(trim, [0, 14, 0], [x1 - x0 - 6, 0.8, 1.2]); }
}
export function buildLevelVisuals(scene, level) {
  const theme = THEMES[level.theme], M = makeMats(theme), kit = new E.Kit(E.archPalette()), root = new E.Node('Level ' + level.id);
  const { x0, x1, z0, z1 } = level.bounds, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const ground = new E.Mesh(E.plane({ width: x1 - x0 + 90, depth: z1 - z0 + 90 }), new E.Material({ name: 'Ground', color: theme.ground, roughness: 0.95 }), 'Ground');
  ground.position.set([cx, 0, cz]); ground.castShadow = false; root.add(ground);
  const pave = new E.Material({ name: 'Pave', color: theme.pave, roughness: 0.95 });
  // paved floor under every street zone, a darker lane where the payload rolls
  for (const [a, b, c, d] of level.decorZones || []) kit.box(pave, [(a + c) / 2, 0.012, (b + d) / 2], [c - a, 0.02, d - b]);
  if (level.arena) kit.box(pave, [cx, 0.012, cz], [x1 - x0, 0.02, z1 - z0]);
  if (level.pathInfo) {
    const railM = new E.Material({ name: 'Rails', color: theme.rail, metallic: 0.6, roughness: 0.5 });
    for (const s of level.pathInfo.seg) { const mx = (s.a[0] + s.b[0]) / 2, mz = (s.a[1] + s.b[1]) / 2, horiz = Math.abs(s.b[0] - s.a[0]) > Math.abs(s.b[1] - s.a[1]); kit.box(railM, [mx, 0.03, mz], horiz ? [s.l + 3.4, 0.02, 3.4] : [3.4, 0.02, s.l + 3.4]); }
    const tie = M.trim;
    for (const s of level.pathInfo.seg) for (let d = 0; d < s.l; d += 2) { const t = d / s.l, x = s.a[0] + (s.b[0] - s.a[0]) * t, z = s.a[1] + (s.b[1] - s.a[1]) * t, horiz = Math.abs(s.b[0] - s.a[0]) > Math.abs(s.b[1] - s.a[1]); kit.box(tie, [x, 0.045, z], horiz ? [0.22, 0.03, 3.6] : [3.6, 0.03, 0.22]); }
  }
  for (const p of level.points) {
    const ring = new E.Material({ name: 'PointRing', color: '#3a4a66', emissive: '#7fb0ff', emissiveStrength: 0.35, roughness: 0.6 });
    kit.cyl(ring, [p.pos[0], 0.05, p.pos[2]], p.r, 0.04, [0, 0, 0], 40); kit.cyl(M.floor, [p.pos[0], 0.07, p.pos[2]], p.r - 0.8, 0.04, [0, 0, 0], 40);
  }
  [[0, 'a'], [1, 'd']].forEach(([t]) => { const sp = level.spawns[t], c = sp.reduce((a, p) => [a[0] + p[0] / sp.length, a[2] + p[2] / sp.length], [0, 0]); kit.box(new E.Material({ name: 'Pad' + t, color: t ? '#8a6a70' : '#6f819a', emissive: t ? '#ff4a52' : '#3a9bff', emissiveStrength: 0.05, roughness: 0.7 }), [c[0], 0.04, c[1]], [18, 0.02, 8]); });
  for (const b of level.boxes) {
    const m = M[b.m] || M.wallA;
    kit.box(m, [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2], [b.x1 - b.x0, b.y1 - b.y0, b.z1 - b.z0], [0, 0, 0], ['roof', 'barrier', 'crate', 'container', 'containerB'].includes(b.m) ? 0.04 : 0);
    if (theme.particles === 'snow' && b.y1 - b.y0 > 0.3 && b.x1 - b.x0 > 1.5 && b.z1 - b.z0 > 1.5 && !['roof', 'cliff', 'trim', 'grate'].includes(b.m) && b.y0 === 0) kit.box(new E.Material({ name: 'SnowCap', color: '#f2f6fb', roughness: 0.85 }), [(b.x0 + b.x1) / 2, b.y1 + 0.05, (b.z0 + b.z1) / 2], [b.x1 - b.x0 + 0.1, 0.12, b.z1 - b.z0 + 0.1]);
    if (theme.neon && b.y1 - b.y0 > 6 && b.m === 'wallA' && b.y0 === 0 && (b.x1 - b.x0) > 8 && (b.z1 - b.z0) > 8) { // glowing window bands on tall blocks
      const mm = ((b.x0 * 7 + b.z0 * 3) | 0) % 2 ? M.neonA : M.neonB;
      for (const f of [b.y1 * 0.4, b.y1 * 0.7]) kit.box(mm, [(b.x0 + b.x1) / 2, f, (b.z0 + b.z1) / 2], [b.x1 - b.x0 + 0.1, 0.35, b.z1 - b.z0 + 0.1]);
    }
    if (theme.particles === 'embers' && b.m === 'trim' && b.y1 - b.y0 > 0.5 && b.y0 === 0) kit.box(M.neonA, [(b.x0 + b.x1) / 2, b.y1 - 0.4, (b.z0 + b.z1) / 2], [b.x1 - b.x0 + 0.06, 0.2, b.z1 - b.z0 + 0.06]);
  }
  dressBuildings(kit, level, theme, M);
  // banners and lamp posts
  const bannerA = new E.Material({ name: 'Banner A', color: '#3a9bff', roughness: 0.8, doubleSided: true }), bannerD = new E.Material({ name: 'Banner D', color: '#ff4a52', roughness: 0.8, doubleSided: true });
  for (const [x, y, z, w, h, d] of level.bannerA || []) kit.box(bannerA, [x, y, z], [w, h, d]);
  for (const [x, y, z, w, h, d] of level.bannerD || []) kit.box(bannerD, [x, y, z], [w, h, d]);
  const lamp = new E.Material({ name: 'Lamp', color: theme.lamp, emissive: theme.lamp, emissiveStrength: 2, roughness: 0.4 }), post = new E.Material({ name: 'Post', color: '#2d3139', metallic: 0.7, roughness: 0.5 });
  const lights = [];
  if (level.lampX?.length && level.decorZones?.length) for (const [a, b, c, d] of level.decorZones) for (let z = b + 6; z <= d - 6; z += 24) for (const x of level.lampX) { kit.cyl(post, [x, 2.2, z], 0.07, 4.4, [0, 0, 0], 8); kit.box(lamp, [x, 4.45, z], [0.4, 0.3, 0.4]); }
  const node = kit.toNode('Geometry'); root.add(node);
  // landmarks and a skyline beyond the playable area (visual only, no shadows)
  const far = new E.Kit(E.archPalette()); buildBackdrop(far, level, theme, M); const farNode = far.toNode('Backdrop'); farNode.traverse((n) => { if ('castShadow' in n) n.castShadow = false; }); root.add(farNode);
  const mkLight = (x, y, z, color, intensity, range) => { const l = new E.Light('point', { color, intensity, range }); l.position.set([x, y, z]); root.add(l); lights.push(l); };
  for (const t of [0, 1]) { const sp = level.spawns[t], c = [sp.reduce((a, p) => a + p[0], 0) / sp.length, sp.reduce((a, p) => a + p[2], 0) / sp.length]; for (const x of [-9, 9]) mkLight(c[0] + x, 6.2, c[1], '#ffe8c4', 10, 22); }
  // street lights centred in each decor zone, so mirrored maps stay mirrored
  for (const [a, b, c, d] of level.decorZones || []) { const n = Math.floor((d - b - 16) / 48) + 1, z0 = (b + d) / 2 - (n - 1) * 24; for (let i = 0; i < n; i++) mkLight((a + c) / 2, 4.4, z0 + i * 48, theme.lamp, theme.neon ? 9 : 5, theme.neon ? 20 : 16); }
  for (const p of level.points) mkLight(p.pos[0], 7, p.pos[2], '#9fc4ff', 14, 24);
  if (level.arena) { for (const [x, z] of [[-30, -30], [30, -30], [-30, 30], [30, 30], [0, 0]]) mkLight(x, 8, z, '#ffb866', 12, 24); }
  scene.add(root);
  return root;
}
