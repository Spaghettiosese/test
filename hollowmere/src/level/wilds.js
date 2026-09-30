// Everything outside Ashgate's walls: the Old Road with its farms and toll bridge, the Mirewood
// with its hunters, bandits and a witch, the Blackfen swamp with a sunken shrine, and burnt
// Cinderwick on Hangman's Hill. About five times the ground the first demo covered.
import * as E from '../../../engine/index.js';
import './furniture.js';
import './houses.js';
import { dressHome } from './town.js';

const rnd = E.rng(20240611);
const r = (a, b) => a + (b - a) * rnd();
const hyp = Math.hypot;
const D2R = Math.PI / 180;

export const REGIONS = [
  // name, [x0, z0, x1, z1] (for the map, zone names and ambience)
  { id: 'road', name: 'The Old Road', rect: [-60, -272, 60, -4] },
  { id: 'farms', name: 'Tolliver Farms', rect: [20, -180, 110, -90] },
  { id: 'mire', name: 'The Mirewood', rect: [-256, -160, -58, 200] },
  { id: 'fen', name: 'Blackfen', rect: [-256, -272, -58, -160] },
  { id: 'cinder', name: 'Cinderwick', rect: [56, -70, 256, 200] },
  { id: 'bridge', name: 'Greywater Bridge', rect: [-60, -262, 60, -200] },
];

export const LANDMARKS = [
  { name: 'Ashgate', x: 0, z: 50, c: '#e0b450' }, { name: 'Ravenspire', x: 0, z: 125, c: '#c8283a' }, { name: 'Camp', x: 13, z: -34 }, { name: 'Tolliver Farm', x: 40, z: -140 }, { name: 'Greywater Bridge', x: 0, z: -226 },
  { name: 'Hunter\'s Lodge', x: -135, z: -71 }, { name: 'Bandit Camp', x: -172, z: 14, c: '#ff6a6a' }, { name: 'Ruined Tower', x: -116, z: 70 }, { name: 'Witch\'s Hut', x: -204, z: 92 }, { name: 'Sunken Shrine', x: -190, z: -232 },
  { name: 'Cinderwick', x: 150, z: 60, c: '#ff9a48' }, { name: 'Plague Ward', x: 195, z: 120 }, { name: 'Hangman\'s Hill', x: 198, z: 160 }, { name: 'Catacombs', x: 100, z: 36, c: '#a56cff' },
];
export const regionAt = (x, z) => { for (const q of REGIONS) if (x > q.rect[0] && x < q.rect[2] && z > q.rect[1] && z < q.rect[3]) return q; return null; };
export const inCryptRect = (x, z) => x > 66 && x < 136 && z > 6 && z < 64;

// ---------------------------------------------------------------------------- materials
function wildMats(B) {
  const M = (name, o) => new E.Material({ name, ...o });
  Object.assign(B.pal, {
    pine: M('Pine', { color: '#16261f', roughness: 1, pattern: 'fabric', patternScale: 30, patternColor: '#0a140f' }),
    pine2: M('Pine light', { color: '#22382c', roughness: 1, pattern: 'fabric', patternScale: 30, patternColor: '#0e1a13' }),
    birch: M('Birch', { color: '#b8b0a0', roughness: 0.9, pattern: 'wood', patternScale: 8, patternColor: '#2a2622' }),
    leafDead: M('Dead leaf', { color: '#4a3422', roughness: 1, pattern: 'fabric', patternScale: 30, patternColor: '#241408' }),
    fern: M('Fern', { color: '#1e3a26', roughness: 1 }),
    bog: M('Bog', { color: '#242c1e', roughness: 1, pattern: 'dirt', patternScale: 4, patternColor: '#10140c' }),
    peat: M('Peat', { color: '#2a1f18', roughness: 1, pattern: 'dirt', patternScale: 5, patternColor: '#120c08' }),
    crop: M('Wheat', { color: '#7a6a2e', roughness: 1, pattern: 'hair', patternScale: 20, patternColor: '#3a3010' }),
    cropG: M('Turnips', { color: '#3a4a26', roughness: 1, pattern: 'hair', patternScale: 20, patternColor: '#1a2410' }),
    field: M('Furrows', { color: '#3a2a1e', roughness: 1, pattern: 'stripes', patternScale: 14, patternColor: '#241810' }),
    char: M('Char', { color: '#1a1614', roughness: 1, pattern: 'dirt', patternScale: 6, patternColor: '#0a0806' }),
    ash: M('Ash', { color: '#5a5654', roughness: 1, pattern: 'dirt', patternScale: 6, patternColor: '#2e2a28' }),
    reed: M('Reed', { color: '#5a6a34', roughness: 1 }),
    fenWater: M('Fen water', { color: '#1a2a26', roughness: 0.06, metallic: 0.35 }),
    river: M('River', { color: '#1e3040', roughness: 0.05, metallic: 0.4 }),
    tent: M('Hide tent', { color: '#54402c', roughness: 1, pattern: 'fabric', patternScale: 20, patternColor: '#2a1c10' }),
    wisp: M('Wisp', { color: '#9affd0', emissive: '#66ffc0', emissiveStrength: 4 }),
    rune: M('Waystone rune', { color: '#4a2f80', emissive: '#8f5cff', emissiveStrength: 2.4, roughness: 0.4 }),
  });
}

// ---------------------------------------------------------------------------- placement helpers
class Keepout {
  constructor() { this.rects = []; this.circles = []; this.lines = []; }
  rect(x0, z0, x1, z1) { this.rects.push([x0, z0, x1, z1]); }
  circle(x, z, rad) { this.circles.push([x, z, rad]); }
  line(pts, w) { for (let i = 0; i < pts.length - 1; i++) this.lines.push([pts[i], pts[i + 1], w]); }
  hit(x, z, pad = 0) {
    for (const q of this.rects) if (x > q[0] - pad && x < q[2] + pad && z > q[1] - pad && z < q[3] + pad) return true;
    for (const q of this.circles) if (hyp(x - q[0], z - q[1]) < q[2] + pad) return true;
    for (const [a, b, w] of this.lines) {
      const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1;
      const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2));
      if (hyp(x - (a[0] + dx * t), z - (a[1] + dz * t)) < w + pad) return true;
    }
    return false;
  }
}

const cellKit = (B, prefix, x, z) => B.kit(`${prefix}_${Math.floor(x / 36)}_${Math.floor(z / 36)}`);

function pine(B, x, z, s = 1, collide = true) {
  const k = cellKit(B, 'wood', x, z), h = r(6.5, 10) * s, M = B.pal, m = rnd() < 0.5 ? M.pine : M.pine2;
  k.cyl(M.bark, [x, h * 0.3, z], 0.22 * s, h * 0.6, [r(-2, 2), 0, r(-2, 2)], 6);
  for (let i = 0; i < 4; i++) { const t = i / 4, rad = (2.3 - t * 1.5) * s; k.add(m, E.cone({ radius: rad, height: h * 0.42, radialSegments: 7, heightSegments: 1 }), [x, h * (0.3 + t * 0.2) + h * 0.2, z], [0, r(0, 60), 0]); }
  if (collide) { B.lazyCollider(x - 0.28, 0, z - 0.28, x + 0.28, 5, z + 0.28, 'wood'); B.nav.block(x - 0.5, z - 0.5, x + 0.5, z + 0.5, 1); }
}
function birch(B, x, z, s = 1) {
  const k = cellKit(B, 'wood', x, z), h = r(5, 7.5) * s, M = B.pal;
  k.cyl(M.birch, [x, h / 2, z], 0.13 * s, h, [r(-3, 3), 0, r(-3, 3)], 6);
  k.add(M.leafDead, E.superquadric({ rx: 1.5 * s, ry: 1.1 * s, rz: 1.5 * s, e1: 0.8, e2: 0.8, widthSegments: 7, heightSegments: 5 }), [x, h * 0.85, z]);
  B.lazyCollider(x - 0.18, 0, z - 0.18, x + 0.18, 5, z + 0.18, 'wood'); B.nav.block(x - 0.4, z - 0.4, x + 0.4, z + 0.4, 1);
}
function stump(B, x, z, s = 1) { cellKit(B, 'wood', x, z).cyl(B.pal.bark, [x, 0.25 * s, z], 0.3 * s, 0.5 * s, [0, 0, 0], 7); }
function log(B, x, z, s = 1) { cellKit(B, 'wood', x, z).cyl(B.pal.bark, [x, 0.22 * s, z], 0.22 * s, 3 * s, [90, r(0, 180), 0], 7); }
function fernPatch(B, x, z) { const k = cellKit(B, 'wood', x, z); for (let i = 0; i < 4; i++) k.add(B.pal.fern, E.cone({ radius: 0.5, height: 0.6, radialSegments: 5, heightSegments: 1 }), [x + r(-0.5, 0.5), 0.3, z + r(-0.5, 0.5)], [r(-20, 20), r(0, 360), r(-20, 20)]); }
function reedClump(B, x, z) { const k = cellKit(B, 'fen', x, z); for (let i = 0; i < 5; i++) k.cyl(B.pal.reed, [x + r(-0.5, 0.5), 0.6, z + r(-0.5, 0.5)], 0.015, r(1.0, 1.6), [r(-8, 8), 0, r(-8, 8)], 4); }
function deadStick(B, x, z, s = 1) {
  const k = cellKit(B, 'fen', x, z), h = r(3, 5) * s;
  k.cyl(B.pal.bark, [x, h / 2, z], 0.1 * s, h, [r(-6, 6), r(0, 360), r(-6, 6)], 5);
  for (let i = 0; i < 3; i++) { const a = r(0, 360); k.cyl(B.pal.bark, [x + Math.sin(a * D2R) * 0.5, h * 0.7, z + Math.cos(a * D2R) * 0.5], 0.03, 1.4, [55 * Math.cos(a * D2R), a, -55 * Math.sin(a * D2R)], 4); }
  B.lazyCollider(x - 0.2, 0, z - 0.2, x + 0.2, 4, z + 0.2, 'wood'); B.nav.block(x - 0.4, z - 0.4, x + 0.4, z + 0.4, 1);
}

// scatter through a rectangle with a minimum spacing, skipping keepouts
function scatter(B, keep, rect, n, place, { spacing = 3.4, seedTries = 40 } = {}) {
  const grid = new Map(), key = (x, z) => Math.floor(x / spacing) + ',' + Math.floor(z / spacing);
  let placed = 0;
  for (let i = 0; i < n * seedTries && placed < n; i++) {
    const x = r(rect[0], rect[2]), z = r(rect[1], rect[3]);
    if (keep.hit(x, z, 1.2)) continue;
    const gx = Math.floor(x / spacing), gz = Math.floor(z / spacing);
    let bad = false;
    for (let a = -1; a <= 1 && !bad; a++) for (let b = -1; b <= 1 && !bad; b++) for (const p of grid.get((gx + a) + ',' + (gz + b)) || []) if (hyp(p[0] - x, p[1] - z) < spacing) { bad = true; break; }
    if (bad) continue;
    (grid.get(key(x, z)) || grid.set(key(x, z), []).get(key(x, z))).push([x, z]);
    place(x, z); placed++;
  }
  return placed;
}

function trail(B, pts, { w = 2.6, mat = 'dirt', noise = 0 } = {}) {
  const M = B.pal;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L = hyp(dx, dz), yaw = -Math.atan2(dz, dx) / D2R;
    const k = B.kit('trails');
    k.box(mat === 'dirt' ? M.mud : M[mat] || M.mud, [(a[0] + b[0]) / 2, 0.012, (a[1] + b[1]) / 2], [L + w * 0.6, 0.03, w], [0, yaw, 0]);
    const n = Math.ceil(L / 2);
    for (let j = 0; j <= n; j++) B.nav.setNoise(a[0] + dx * j / n - 1.5, a[1] + dz * j / n - 1.5, a[0] + dx * j / n + 1.5, a[1] + dz * j / n + 1.5, noise);
  }
}
function waterPlane(B, x0, z0, x1, z1, mat, y = 0.03) {
  const m = new E.Mesh(E.plane({ width: x1 - x0, depth: z1 - z0 }), mat, 'Water'); m.castShadow = false; m.position.set([(x0 + x1) / 2, y, (z0 + z1) / 2]); B.scene.add(m);
}
function deepWater(B, x0, z0, x1, z1, mat) {
  (B.mapWater ||= []).push([x0, z0, x1, z1]);
  waterPlane(B, x0, z0, x1, z1, mat); B.nav.block(x0, z0, x1, z1, 1); B.lazyCollider(x0, -1, z0, x1, 1.6, z1, 'water');
}
function boardwalk(B, a, b, { w = 1.7, y = 0.22 } = {}) {
  const dx = b[0] - a[0], dz = b[1] - a[1], L = hyp(dx, dz), yaw = -Math.atan2(dz, dx) / D2R, n = Math.ceil(L / 1.6);
  const k = B.kit('boardwalk');
  for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; k.box(B.pal.plank, [a[0] + dx * t, y - 0.03, a[1] + dz * t], [L / n - 0.05, 0.06, w], [0, yaw, 0]); }
  for (const s of [-1, 1]) for (let i = 0; i <= n; i += 2) { const t = i / n; k.cyl(B.pal.timber, [a[0] + dx * t - Math.sin(yaw * D2R) * 0 + (-dz / L) * s * (w / 2 + 0.05), y - 0.5, a[1] + dz * t + (dx / L) * s * (w / 2 + 0.05)], 0.06, 1.1, [0, 0, 0], 5); }
  // flat collider along the walkway, made of short segments so the diagonal follows
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n, x0 = a[0] + dx * t0, z0 = a[1] + dz * t0, x1 = a[0] + dx * t1, z1 = a[1] + dz * t1, hw = w / 2 + 0.05;
    B.lazyCollider(Math.min(x0, x1) - hw * Math.abs(dz / L), -0.3, Math.min(z0, z1) - hw * Math.abs(dx / L), Math.max(x0, x1) + hw * Math.abs(dz / L), y, Math.max(z0, z1) + hw * Math.abs(dx / L), 'wood');
    B.nav.clear(Math.min(x0, x1) - hw * Math.abs(dz / L), Math.min(z0, z1) - hw * Math.abs(dx / L), Math.max(x0, x1) + hw * Math.abs(dz / L), Math.max(z0, z1) + hw * Math.abs(dx / L));
    B.nav.setHeight(Math.min(x0, x1) - hw * Math.abs(dz / L), Math.min(z0, z1) - hw * Math.abs(dx / L), Math.max(x0, x1) + hw * Math.abs(dz / L), Math.max(z0, z1) + hw * Math.abs(dx / L), y);
    B.nav.setNoise(Math.min(x0, x1) - 1, Math.min(z0, z1) - 1, Math.max(x0, x1) + 1, Math.max(z0, z1) + 1, 2);
  }
}
function fenceRun(B, x0, z0, x1, z1, { h = 1.1, gaps = [] } = {}) {
  const dx = x1 - x0, dz = z1 - z0, L = hyp(dx, dz), n = Math.floor(L / 1.8), yaw = -Math.atan2(dz, dx) / D2R, k = B.kit('fences_' + Math.floor(x0 / 60) + '_' + Math.floor(z0 / 60));
  for (let i = 0; i <= n; i++) { const t = i / n, px = x0 + dx * t, pz = z0 + dz * t; if (gaps.some((g) => hyp(px - g[0], pz - g[1]) < g[2])) continue; k.box(B.pal.timber, [px, h / 2, pz], [0.1, h, 0.1]); }
  k.box(B.pal.timber, [(x0 + x1) / 2, h * 0.85, (z0 + z1) / 2], [L, 0.07, 0.07], [0, yaw, 0]); k.box(B.pal.timber, [(x0 + x1) / 2, h * 0.45, (z0 + z1) / 2], [L, 0.07, 0.07], [0, yaw, 0]);
  const cells = Math.ceil(L / 3);
  for (let i = 0; i < cells; i++) { const t0 = i / cells, t1 = (i + 1) / cells, ax = x0 + dx * t0, az = z0 + dz * t0, bx = x0 + dx * t1, bz = z0 + dz * t1; if (gaps.some((g) => hyp((ax + bx) / 2 - g[0], (az + bz) / 2 - g[1]) < g[2] + 1)) continue; B.lazyCollider(Math.min(ax, bx) - 0.08, 0, Math.min(az, bz) - 0.08, Math.max(ax, bx) + 0.08, h, Math.max(az, bz) + 0.08, 'wood'); B.nav.block(Math.min(ax, bx) - 0.1, Math.min(az, bz) - 0.1, Math.max(ax, bx) + 0.1, Math.max(az, bz) + 0.1, 1); }
}
function tent(B, x, z, yaw = 0, s = 1) {
  const k = B.kit('camps_' + Math.floor(x / 60) + '_' + Math.floor(z / 60)), a = yaw;
  for (const side of [-1, 1]) k.box(B.pal.tent, [x + Math.cos(a * D2R) * 0, 1.0 * s, z + side * 0.5 * s], [2.6 * s, 0.05, 1.4 * s], [side * 52, a, 0]);
  k.box(B.pal.timber, [x, 1.65 * s, z], [2.7 * s, 0.06, 0.06], [0, a, 0]);
  B.lazyCollider(x - 1.3 * s, 0, z - 0.9 * s, x + 1.3 * s, 1.6 * s, z + 0.9 * s, 'cloth'); B.nav.block(x - 1.3 * s, z - 0.9 * s, x + 1.3 * s, z + 0.9 * s, 1);
}
function logSeat(B, name, x, z, dir) {
  B.kit('camps_' + Math.floor(x / 60) + '_' + Math.floor(z / 60)).cyl(B.pal.bark, [x, 0.22, z], 0.2, 1.4, [90, dir + 90, 0], 7);
  B.poi(name, x, z, { yaw: dir, type: 'sit', y: 0.42, approach: [x + Math.sin(dir * D2R) * 1.0, z + Math.cos(dir * D2R) * 1.0] });
}
function waystone(B, x, z, name) {
  const k = B.kit('stones');
  k.box(B.pal.stoneOld, [x, 1.1, z], [0.8, 2.2, 0.55], [r(-3, 3), r(0, 360), r(-3, 3)], 0.05);
  k.box(B.pal.rune, [x, 1.5, z + 0.29], [0.3, 0.5, 0.02]);
  B.lazyCollider(x - 0.4, 0, z - 0.4, x + 0.4, 2.2, z + 0.4, 'stone'); B.nav.block(x - 0.5, z - 0.5, x + 0.5, z + 0.5, 1);
  const l = new E.Light('point', { color: '#8f5cff', intensity: 3, range: 7, flicker: 0.1 }); l.position.set([x, 1.6, z + 0.6]); B.decor.add(l); B.lights.push(l);
  B.poi(name, x, z - 1.3, { yaw: 0, type: 'stand' });
}
function wagon(B, x, z, yaw = 0, { broken = false } = {}) {
  const k = B.kit('road_props');
  k.box(B.pal.plank, [x, 0.9, z], [1.8, 0.15, 3.6], [0, yaw, broken ? 8 : 0]);
  for (const s of [-1, 1]) k.box(B.pal.plank, [x + Math.cos(yaw * D2R) * s * 0.9, 1.25, z - Math.sin(yaw * D2R) * s * 0.9], [0.1, 0.7, 3.6], [0, yaw, 0]);
  for (const s of [-1, 1]) k.cyl(B.pal.timber, [x + Math.cos(yaw * D2R) * s * 1.0, 0.55, z - Math.sin(yaw * D2R) * s * 1.0], 0.55, 0.12, [0, yaw, 90], 12);
  B.lazyCollider(x - 1, 0, z - 1.9, x + 1, 1.5, z + 1.9, 'wood'); B.nav.block(x - 1.1, z - 1.9, x + 1.1, z + 1.9, 1);
}
const wprop = (B, kind, x, z, o = {}) => B.prop(kind, x, 0, z, o);

// ---------------------------------------------------------------------------- the whole wilds
export function buildWilds(B) {
  wildMats(B);
  const keep = new Keepout(), M = B.pal;
  // what is already built in the first demo (town, keep, crypt, and the camp road)
  keep.rect(-58, -6, 140, 178); keep.line([[0, -272], [0, -4]], 6); keep.circle(13, -34, 12);
  B.useChunk('trails');

  // ------------------------------------------------ trails and roads
  const ROAD = [[0, -72], [0, -272]];
  B.ground('dirt', -3, -272, 3, -72, 0, 0.05, { chunk: 'trails', noise: 0 });
  B.kit('trails').box(M.mud, [-3.2, 0.005, -172], [0.7, 0.02, 200]); B.kit('trails').box(M.mud, [3.2, 0.005, -172], [0.7, 0.02, 200]);
  const T_FARM = [[3, -128], [16, -128], [28, -132]];
  const T_EAST = [[3, -46], [30, -44], [60, -30], [92, -14], [118, 0], [134, 30], [140, 62]];
  const T_WEST = [[-3, -100], [-30, -100], [-62, -96], [-92, -80], [-124, -60]];
  const T_LODGE_BANDIT = [[-124, -60], [-140, -30], [-158, -4], [-172, 10]];
  const T_TOWER = [[-124, -60], [-118, -20], [-112, 30], [-110, 70]];
  const T_WITCH = [[-172, 10], [-190, 40], [-200, 88]];
  const T_FEN = [[-30, -100], [-50, -130], [-74, -158]];
  const T_GALLOWS = [[140, 62], [160, 90], [190, 116]];
  const T_KEEPSIDE = [[-62, 60], [-88, 58], [-110, 70]];
  for (const t of [T_FARM, T_EAST, T_WEST, T_LODGE_BANDIT, T_TOWER, T_WITCH, T_FEN, T_GALLOWS, T_KEEPSIDE]) { trail(B, t, { w: 2.6, noise: 0 }); keep.line(t, 3.2); }

  // ------------------------------------------------ Tolliver Farms (south-east of the road)
  const farm = B.house({ id: 'farm', x: 30, z: -146, w: 11, d: 8, h: 3.8, wall: 'plaster', door: { side: 'W', at: 4, w: 1.6, id: 'farm_door' }, windows: [{ side: 'S', at: 3 }, { side: 'N', at: 5 }, { side: 'E', at: 4 }], roofMat: 'roofRed' });
  dressHome(B, farm, { chest: { loot: [['gold', 26], ['cheese', 1]], name: 'Farm chest', locked: true, lockLevel: 1 } });
  B.poi('farm_hearth', 41 - 1.5, -146 + 4, { yaw: 0, type: 'stand' });
  keep.rect(28, -148, 43, -136);
  const barn = B.house({ id: 'barn', x: 48, z: -156, w: 15, d: 10, h: 5, wall: 'plank', timber: false, door: { side: 'W', at: 5, w: 3, id: 'barn_door', autoClose: true }, doors: [{ side: 'E', at: 5, w: 3, id: 'barn_door_b' }], windows: [{ side: 'S', at: 4, w: 0.8 }], roofMat: 'roofRed', floor: 'floorWood', zone: 0 });
  for (let i = 0; i < 8; i++) B.prop('hay', 52 + (i % 4) * 2.2, 0, -152 + Math.floor(i / 4) * 1.2, { yaw: r(0, 90) });
  for (let i = 0; i < 3; i++) B.bed(50.4 + i * 2.4, -154.4, { dir: 0, id: 'bed_barn_' + i, chunk: barn.chunk });
  B.chest(61.2, -158, { dir: 270, loot: [['gold', 18], ['bread', 2]], name: 'Feed chest', chunk: barn.chunk });
  B.hearth(53, 0, -150.6, { r: 0.3, range: 8, intensity: 6, chunk: barn.chunk });
  B.poi('barn_work', 55, -151, { yaw: 180, type: 'stand' }); B.poi('barn_hay', 51.5, -152.4, { yaw: 0, type: 'stand' });
  keep.rect(46, -158, 65, -144);
  // outbuildings, fields, well and fences
  const shed = B.house({ id: 'shed', x: 28, z: -168, w: 6, d: 5, h: 3, wall: 'plank', timber: false, door: { side: 'N', at: 3, w: 1.4, id: 'shed_door' }, roofMat: 'roofRed', windows: [] });
  B.chest(32.6, -166.5, { dir: 180, loot: [['lockpick', 2], ['potion', 1], ['scrap', 4], ['beartrap', 1]], name: 'Tool chest', locked: true, lockLevel: 2, id: 'shed_chest', chunk: shed.chunk });
  keep.rect(26, -170, 36, -160);
  const fields = [[70, -140, 96, -112, 'crop'], [70, -108, 96, -92, 'cropG'], [36, -118, 66, -98, 'field'], [72, -170, 100, -150, 'crop']];
  for (const [x0, z0, x1, z1, m] of fields) { B.ground('field', x0, z0, x1, z1, 0, 0.05, { chunk: 'fields' }); keep.rect(x0, z0, x1, z1); const k = B.kit('fields'); for (let x = x0 + 1; x < x1; x += 1.5) for (let z = z0 + 1; z < z1; z += 1.5) if (m !== 'field') k.cyl(M[m === 'crop' ? 'crop' : 'cropG'], [x + r(-0.3, 0.3), 0.4, z + r(-0.3, 0.3)], 0.06, m === 'crop' ? 0.9 : 0.35, [r(-8, 8), 0, r(-8, 8)], 4); }
  B.poi('field_a', 82, -126, { yaw: 0, type: 'stand' }); B.poi('field_b', 80, -100, { yaw: 90, type: 'stand' }); B.poi('field_c', 86, -160, { yaw: 180, type: 'stand' });
  B.route('farm_loop', [[36, -132], [56, -128], [70, -104], [64, -96], [46, -110], [36, -132]]);
  for (const [a, b, c, d] of [[34, -122, 68, -122], [68, -122, 68, -90], [34, -90, 68, -90]]) fenceRun(B, a, b, c, d, { gaps: [[52, -122, 2], [68, -106, 2]] });
  // scarecrow
  B.kit('fields').cyl(M.timber, [83, 1.1, -116], 0.05, 2.2, [0, 0, 0], 5); B.kit('fields').box(M.timber, [83, 1.7, -116], [1.4, 0.05, 0.05]); B.kit('fields').box(M.canvasDirty, [83, 1.3, -116], [0.5, 0.8, 0.2]);
  B.lazyCollider(82.8, 0, -116.2, 83.2, 2.2, -115.8, 'wood');
  B.well && B.well(38, -176, { chunk: 'road_props' }); B.pois.well_farm = B.pois.well;
  wprop(B, 'barrel', 46.4, -137); wprop(B, 'crate', 44.8, -137.3, { yaw: 20 }); wprop(B, 'bucket', 44.6, -134); wprop(B, 'sack', 27, -139, { yaw: 40 });
  // ------------------------------------------------ travelling on the road
  wagon(B, -6, -60, 12, { broken: true }); for (const [x, z] of [[-9, -62], [-7, -57.5], [-3.6, -64]]) wprop(B, ['crateS', 'sack', 'jug'][Math.floor(r(0, 3))], x, z, { yaw: r(0, 360) });
  B.chest(-9.4, -57, { dir: 90, loot: [['gold', 24], ['potion', 1]], name: 'Wreck crate', chunk: 'road_props' });
  waystone(B, 5, -85, 'ws_road'); waystone(B, -70, -95, 'ws_mire'); waystone(B, 118, 4, 'ws_cinder');

  // ------------------------------------------------ Greywater bridge and toll house
  const riverZ0 = -232, riverZ1 = -220;
  deepWater(B, -256, riverZ0, -4.5, riverZ1, M.river); deepWater(B, 4.5, riverZ0, 256, riverZ1, M.river);
  waterPlane(B, -4.5, riverZ0, 4.5, riverZ1, M.river);
  B.kit('bridge').box(M.stoneOld, [0, 0.05, -226], [9, 0.5, 12.6]); B.kit('bridge').box(M.stoneDark, [-4.4, 0.7, -226], [0.5, 1.4, 12.8]); B.kit('bridge').box(M.stoneDark, [4.4, 0.7, -226], [0.5, 1.4, 12.8]);
  for (const s of [-1, 1]) for (const zz of [-231, -226, -221]) B.kit('bridge').box(M.stoneDark, [s * 4.4, 1.5, zz], [0.55, 0.3, 1.2]);
  B.lazyCollider(-4.9, -0.6, riverZ0 - 0.6, -3.9, 1.4, riverZ1 + 0.6, 'stone'); B.lazyCollider(3.9, -0.6, riverZ0 - 0.6, 4.9, 1.4, riverZ1 + 0.6, 'stone');
  B.nav.block(-4.9, riverZ0, -3.9, riverZ1, 1); B.nav.block(3.9, riverZ0, 4.9, riverZ1, 1);
  B.lampPost(-3.4, -217, { chunk: 'bridge' }); B.lampPost(3.4, -235, { chunk: 'bridge' });
  const toll = B.house({ id: 'toll', x: 8, z: -216, w: 9, d: 7, h: 3.8, wall: 'stoneDark', timber: false, zone: 1, door: { side: 'W', at: 3.5, w: 1.6, id: 'toll_door', locked: true, keyId: 'tollkey', lockLevel: 1 }, windows: [{ side: 'S', at: 2.5 }, { side: 'N', at: 4 }], roofMat: 'roofSlate' });
  const [tx0, tz0, tx1, tz1] = toll.inner;
  for (let i = 0; i < 2; i++) B.bed(tx1 - 1.2 - i * 2.2, tz1 - 1.3, { dir: 180, id: 'bed_toll_' + i, chunk: toll.chunk });
  B.table(tx0 + 2, tz0 + 2, 2, 1, { chunk: toll.chunk }); B.chair(tx0 + 2, tz0 + 3.2, 180, { name: 'sit_toll', chunk: toll.chunk }); B.candle(tx0 + 2, 0.85, tz0 + 2, { chunk: toll.chunk });
  B.chest(tx0 + 0.8, tz1 - 0.8, { dir: 90, loot: [['gold', 80], ['ironcap', 1], ['raven', 1]], name: 'Toll strongbox', locked: true, lockLevel: 2, id: 'toll_box', chunk: toll.chunk });
  B.hearth(tx0 + 3.6, 0, tz1 - 0.6, { r: 0.35, range: 9, intensity: 8, chunk: toll.chunk });
  B.poi('toll_post_n', 2.2, -216, { yaw: 180, type: 'stand' }); B.poi('toll_post_s', -2.2, -236, { yaw: 0, type: 'stand' }); B.poi('toll_desk', tx0 + 4.2, tz0 + 2.6, { yaw: 270, type: 'stand' });
  B.route('bridge_beat', [[-2, -215], [2, -240], [-2, -240], [2, -215]]);
  B.kit('bridge').box(M.timber, [0, 2.4, -216], [9.6, 0.25, 0.3]); for (const s of [-1, 1]) B.kit('bridge').box(M.timber, [s * 4.6, 1.2, -216], [0.3, 2.4, 0.3]);
  B.kit('bridge').box(M.crimson, [0, 1.85, -216], [3.6, 0.9, 0.05]);
  keep.rect(-8, -240, 20, -212);

  // ------------------------------------------------ the Mirewood: hunter's lodge, watch tower, witch, bandits
  const lodge = B.house({ id: 'lodge', x: -142, z: -76, w: 13, d: 10, h: 3.6, wall: 'plank', timber: false, door: { side: 'E', at: 4.5, w: 1.6, id: 'lodge_door' }, windows: [{ side: 'S', at: 3 }, { side: 'S', at: 9 }, { side: 'N', at: 4 }], roofMat: 'roofRed' });
  dressHome(B, lodge, { chest: { loot: [['gold', 20], ['potion', 1], ['huntershood', 1], ['knife', 3]], name: 'Hunter chest', locked: true, lockLevel: 1 } });
  B.poi('lodge_yard', -126, -71, { yaw: 270, type: 'stand' });
  B.kit('camps_-3_-2').box(M.plank, [-129.5, 1.6, -78], [0.1, 3.2, 0.1]); for (let i = 0; i < 3; i++) B.kit('camps_-3_-2').box(M.rug, [-130 + i * 0.9, 1.9, -77.8], [0.7, 1.0, 0.06], [0, 0, r(-6, 6)]);
  keep.rect(-144, -78, -126, -64);
  T_LODGE_BANDIT.forEach(() => 0);

  // a ruined watch tower: walls with a breach, a chest at the top, wisp lights
  const tower = { x: -116, z: 70 };
  B.roundTower({ x: tower.x, z: tower.z, r: 4.2, h: 12, mat: 'stoneOld', cone: false, crenel: true, chunk: 'tower_ruin' });
  B.kit('tower_ruin').box(M.moss, [tower.x, 0.1, tower.z], [9, 0.15, 9], [0, 20, 0]);
  B.nav.clear(tower.x - 0.6, tower.z - 4.8, tower.x + 0.6, tower.z - 3.2); // door gap
  B.vbox('leafDead', tower.x - 3, 0, tower.z - 2, tower.x + 3, 0.1, tower.z + 2, { chunk: 'tower_ruin' });
  B.poi('tower_camp', tower.x, tower.z - 6, { yaw: 0, type: 'stand' });
  B.chest(tower.x + 6, tower.z + 1, { dir: 270, loot: [['gold', 40], ['ring', 1], ['wolftooth', 1], ['signet', 1]], name: 'Old cache', locked: true, lockLevel: 3, id: 'tower_cache', chunk: 'tower_ruin' });
  keep.circle(tower.x, tower.z, 8);

  // the witch's hut on stilts above the bog
  const witch = B.house({ id: 'witch', x: -206, z: 88, w: 8, d: 7, h: 3.4, wall: 'plank', timber: false, door: { side: 'S', at: 4, w: 1.4, id: 'witch_door' }, windows: [{ side: 'E', at: 3 }], roofMat: 'roofRed', y: 0.6, noise: 2 });
  B.vbox('plank', -207, 0, 87, -197, 0.6, 96, { chunk: witch.chunk }); // raised deck body
  B.ground('plank', -209, 82, -203, 87.4, 0.6, 0.15, { chunk: witch.chunk, noise: 2 });
  B.lazyCollider(-209, 0, 82, -203, 0.6, 87.4, 'wood'); B.nav.setHeight(-209, 82, -203, 87.4, 0.6); B.nav.setHeight(-205, 87.4, -201, 95, 0.6);
  B.hearth(-202, 0.6, 93.2, { r: 0.4, range: 10, intensity: 9, chunk: witch.chunk });
  for (let i = 0; i < 5; i++) B.prop(['bottle', 'jug', 'pot', 'skull', 'book'][i], -199.6 + i * 0.5, 1.3, 88.4, { sleep: true });
  B.table(-203, 91, 2, 1, { chunk: witch.chunk, y: 0.6 }); B.candle(-203, 1.45, 91, { chunk: witch.chunk });
  B.chest(-199.8, 94.2, { y: 0.6, dir: 270, loot: [['potion', 2], ['gold', 35], ['hexbane', 1], ['nightcloak', 1], ['embering', 1]], name: 'Witch trunk', locked: true, lockLevel: 2, id: 'witch_chest', chunk: witch.chunk });
  B.poi('witch_fire', -204, 93.2, { yaw: 0, type: 'stand', y: 0.6 }); B.poi('witch_table', -203, 92.4, { yaw: 180, type: 'stand', y: 0.6 }); B.bed(-200.4, 90.6, { dir: 90, y: 0.6, id: 'bed_witch', chunk: witch.chunk });
  keep.rect(-212, 78, -196, 100);

  // bandit camp in a clearing
  const bc = { x: -172, z: 14 };
  keep.circle(bc.x, bc.z, 20);
  B.hearth(bc.x, 0, bc.z, { r: 0.7, range: 22, intensity: 18 });
  for (let i = 0; i < 6; i++) { const a = i * 60 + 20; logSeat(B, 'bandit_seat_' + i, bc.x + Math.sin(a * D2R) * 3.4, bc.z + Math.cos(a * D2R) * 3.4, (a + 180) % 360); }
  tent(B, bc.x - 8, bc.z + 6, 20); tent(B, bc.x + 9, bc.z + 5, -30); tent(B, bc.x - 6, bc.z - 9, 70); tent(B, bc.x + 8, bc.z - 8, 110, 1.15);
  [[bc.x - 8, bc.z + 3.6, 0], [bc.x + 9, bc.z + 2.6, 0], [bc.x - 3.6, bc.z - 9, 90], [bc.x + 8, bc.z - 5.4, 0], [bc.x - 9.6, bc.z + 5.6, 90]].forEach(([x, z, d], i) => B.bed(x, z, { dir: d, id: 'bed_bandit_' + i, w: 0.85, l: 1.8, sheet: 'linen', chunk: 'camps_-3_0' }));
  B.chest(bc.x + 12, bc.z - 2, { dir: 270, loot: [['gold', 60], ['potion', 2], ['lockpick', 3], ['chainvest', 1], ['greaves', 1]], name: 'Bandit loot', locked: true, lockLevel: 2, id: 'bandit_loot', chunk: 'camps_-3_0' });
  B.chest(bc.x - 2, bc.z + 12, { dir: 180, loot: [['gold', 25], ['wine', 2]], name: 'Supply crate', chunk: 'camps_-3_0' });
  for (let i = 0; i < 5; i++) wprop(B, ['barrel', 'crate', 'sack', 'bottle', 'crateS'][i], bc.x + 4 + i * 0.7, bc.z + 12, { yaw: r(0, 360) });
  B.poi('bandit_lookout', bc.x + 14, bc.z + 12, { yaw: 315, type: 'stand' }); B.poi('bandit_gate', bc.x - 15, bc.z - 2, { yaw: 270, type: 'stand' });
  B.route('lamp_route', [[0, 22], [0, 36], [0, 48], [0, 60], [0, 72], [0, 84], [0, 60], [0, 36]]);
  B.route('hunt_loop', [[-122, -70], [-108, -88], [-94, -72], [-108, -52], [-122, -70]]); B.route('road_walk', [[2, -100], [2, -140], [-2, -190], [2, -140]]); B.route('pilgrim_route', [[5, -92], [-30, -100], [-64, -96], [-30, -100]]);
  B.route('bandit_patrol', [[bc.x - 15, bc.z - 4], [bc.x - 12, bc.z + 12], [bc.x + 4, bc.z + 16], [bc.x + 16, bc.z + 2], [bc.x + 8, bc.z - 14], [bc.x - 8, bc.z - 15]]);
  fenceRun(B, bc.x - 18, bc.z - 16, bc.x - 18, bc.z + 16, { gaps: [[bc.x - 18, bc.z - 2, 2.2]] });
  // a signpost at the fork
  B.kit('trails').box(M.timber, [-120, 1.2, -58], [0.14, 2.4, 0.14]); B.kit('trails').box(M.plank, [-120, 2.0, -58], [1.3, 0.28, 0.06], [0, 20, 4]); B.kit('trails').box(M.plank, [-120, 1.6, -58], [1.1, 0.26, 0.06], [0, -50, -4]);

  // ------------------------------------------------ forests: scatter after the clearings are known
  keep.rect(-12, -272, 12, -4);   // road
  const mire = [-252, -160, -60, 198];
  scatter(B, keep, mire, 620, (x, z) => { const t = rnd(); if (t < 0.62) pine(B, x, z, r(0.8, 1.35)); else if (t < 0.85) birch(B, x, z, r(0.8, 1.2)); else deadStick(B, x, z, r(0.8, 1.3)); }, { spacing: 4.2 });
  scatter(B, keep, mire, 260, (x, z) => { const t = rnd(); if (t < 0.4) fernPatch(B, x, z); else if (t < 0.65) stump(B, x, z, r(0.8, 1.5)); else if (t < 0.85) log(B, x, z, r(0.8, 1.4)); else cellKit(B, 'wood', x, z).add(M.stoneOld, E.superquadric({ rx: 0.7, ry: 0.4, rz: 0.6, e1: 0.7, e2: 0.7, widthSegments: 6, heightSegments: 4 }), [x, 0.2, z], [0, r(0, 360), 0]); }, { spacing: 1.6 });
  // roadside and eastern scatter: sparse dead trees along the road, farms edges
  scatter(B, keep, [-40, -215, 40, -76], 46, (x, z) => { if (rnd() < 0.7) deadStick(B, x, z, r(0.9, 1.4)); else cellKit(B, 'wood', x, z).add(M.stoneOld, E.superquadric({ rx: 0.7, ry: 0.4, rz: 0.6, e1: 0.7, e2: 0.7, widthSegments: 6, heightSegments: 4 }), [x, 0.2, z], [0, r(0, 360), 0]); }, { spacing: 5 });
  scatter(B, keep, [56, -250, 254, -72], 120, (x, z) => { if (rnd() < 0.6) pine(B, x, z, r(0.7, 1.2)); else deadStick(B, x, z, r(0.9, 1.4)); }, { spacing: 6 });

  // ------------------------------------------------ Blackfen swamp
  const fen = [-252, -270, -60, -160];
  B.ground('bog', -256, -272, -58, -160, 0, 0.08, { chunk: 'fen_ground', noise: 3 });
  B.ground('bog', -256, -160, -190, -100, 0, 0.08, { chunk: 'fen_ground', noise: 3 });
  const pools = [[-120, -190, 30, 24], [-200, -220, 34, 26], [-90, -240, 28, 22], [-160, -140, 26, 18], [-235, -180, 22, 28], [-70, -175, 18, 16], [-215, -140, 22, 16]];
  const fenPath = [[-74, -158], [-92, -170], [-110, -168], [-128, -176], [-146, -190], [-166, -204], [-180, -224]];
  keep.line(fenPath, 4);
  for (const [cx, cz, w, d] of pools) {
    const rect = [cx - w / 2, cz - d / 2, cx + w / 2, cz + d / 2];
    // deep pools are blocked except where the boardwalk crosses (carve after)
    deepWater(B, ...rect, M.fenWater); keep.rect(...rect);
  }
  for (let i = 0; i < fenPath.length - 1; i++) boardwalk(B, fenPath[i], fenPath[i + 1]);
  // boardwalk beats: also a side spur to a hut
  boardwalk(B, [-128, -176], [-128, -150], {});
  // the sunken shrine at the end of the boardwalk
  const sx = -190, sz = -232;
  B.kit('shrine').box(M.stoneOld, [sx, 0.15, sz], [16, 0.5, 16], [0, 8, 0]);
  for (const [dx, dz] of [[-5, -5], [5, -5], [-5, 5], [5, 5]]) { B.kit('shrine').cyl(M.stoneOld, [sx + dx, 2.6, sz + dz], 0.6, 5.4, [0, 0, r(-3, 3)], 8); B.lazyCollider(sx + dx - 0.6, 0, sz + dz - 0.6, sx + dx + 0.6, 5.4, sz + dz + 0.6, 'stone'); }
  B.kit('shrine').box(M.stoneDark, [sx, 3.4, sz - 5], [10, 0.7, 0.9]); B.kit('shrine').box(M.stoneDark, [sx, 1.0, sz - 7.8], [2.4, 1.6, 1.4]);
  B.nav.block(sx - 1.2, sz - 8.5, sx + 1.2, sz - 7.1, 1); B.lazyCollider(sx - 1.2, 0, sz - 8.5, sx + 1.2, 1.6, sz - 7.1, 'stone');
  B.chest(sx, sz - 6.4, { dir: 0, loot: [['gold', 120], ['ring', 1], ['nightbloom', 1], ['sainttear', 1], ['mendring', 1]], name: 'Drowned reliquary', locked: true, lockLevel: 3, id: 'fen_reliquary', chunk: 'shrine', gold: true });
  B.poi('fen_shrine', sx, sz + 4, { yaw: 180, type: 'stand' }); B.route('fen_walk', [[-92, -170], [-110, -168], [-128, -176], [-146, -190]]);
  B.ground('stoneOld', sx - 8, sz - 8, sx + 8, sz + 8, 0.02, 0.1, { chunk: 'shrine', noise: 3 }); B.nav.setHeight(sx - 8, sz - 8, sx + 8, sz + 8, 0.15);
  B.nav.clear(sx - 8, sz - 8, sx + 8, sz + 8); for (const [dx, dz] of [[-5, -5], [5, -5], [-5, 5], [5, 5]]) B.nav.block(sx + dx - 0.7, sz + dz - 0.7, sx + dx + 0.7, sz + dz + 0.7, 1); B.nav.block(sx - 1.2, sz - 8.5, sx + 1.2, sz - 7.1, 1);
  // path from the boardwalk end to the shrine platform
  boardwalk(B, [-180, -224], [sx, sz + 6], {});
  // wisps
  for (let i = 0; i < 26; i++) {
    const x = r(-250, -62), z = r(-268, -162); if (B.nav.isBlocked(x, z) === false && rnd() < 0.5) { const l = new E.Light('point', { color: '#66ffc0', intensity: 2.2, range: 6, flicker: 0.4 }); l.position.set([x, 0.9, z]); B.decor.add(l); B.lights.push(l); B.kit('fen_' + Math.floor(x / 60)).add(M.wisp, E.sphere({ radius: 0.09, widthSegments: 6, heightSegments: 4 }), [x, 0.9, z]); }
  }
  scatter(B, keep, fen, 130, (x, z) => { const t = rnd(); if (t < 0.3) deadStick(B, x, z, r(0.8, 1.4)); else reedClump(B, x, z); }, { spacing: 3 });
  scatter(B, keep, fen, 90, (x, z) => reedClump(B, x, z), { spacing: 1.4 });

  // ------------------------------------------------ Cinderwick: burnt village and Hangman's Hill
  B.ground('ash', 96, -20, 230, 150, 0, 0.06, { chunk: 'cinder_ground', noise: 0 });
  keep.line(T_EAST, 3.5);
  const ruins = [[150, 34, 8, 6], [134, 52, 7, 6], [162, 62, 9, 7], [120, 74, 6, 6], [144, 88, 8, 8], [176, 40, 7, 6], [180, 78, 8, 6], [128, 108, 9, 6]];
  ruins.forEach(([x, z, w, d], i) => {
    if (keep.hit(x + w / 2, z + d / 2, 0) && (x < 141 && z < 62)) return;
    const k = B.kit('cinder_' + Math.floor(x / 60) + '_' + Math.floor(z / 60));
    // broken char walls
    for (const [x0, z0, x1, z1] of [[x, z, x + w, z + 0.5], [x, z + d, x + w, z + d + 0.5], [x, z, x + 0.5, z + d], [x + w, z, x + w + 0.5, z + d]]) {
      const gap = rnd() < 0.4; if (gap) continue;
      const hh = r(0.8, 3.2);
      k.box(M.char, [(x0 + x1) / 2, hh / 2, (z0 + z1) / 2], [x1 - x0, hh, z1 - z0], [0, 0, r(-3, 3)]);
      B.lazyCollider(x0, 0, z0, x1, hh, z1, 'wood'); B.nav.block(x0, z0, x1, z1, 1);
    }
    for (let j = 0; j < 3; j++) k.cyl(M.char, [x + r(1, w - 1), 1.1, z + r(1, d - 1)], 0.12, r(1.5, 2.6), [r(-15, 15), r(0, 360), r(-25, 25)], 5);
    keep.rect(x - 1, z - 1, x + w + 1, z + d + 1);
    if (i === 3) { B.chest(x + 2, z + 2, { dir: 0, loot: [['gold', 30], ['bread', 1]], name: 'Charred chest', chunk: 'cinder_1_0' }); }
    if (i === 6) B.searchSpot(x + 3, 0.9, z + 3, { name: 'burnt cupboard', loot: [['gold', 12], ['diary', 0]].filter((l) => l[1] > 0), id: 'cinder_cupboard' });
  });
  B.poi('cinder_center', 150, 60, { yaw: 0, type: 'stand' });
  B.route('cinder_walk', [[132, 48], [150, 56], [166, 52], [172, 68], [150, 78], [130, 68]]); B.route('cinder_walk2', [[120, 100], [140, 100], [150, 120], [130, 124]]);
  // well
  B.well && B.well(152, 96, { chunk: 'road_props' }); B.pois.cinder_well = B.pois.well;
  // the plague ward: a fenced graveyard with a locked gate and a mass grave
  fenceRun(B, 176, 100, 214, 100, { gaps: [[195, 100, 2]] }); fenceRun(B, 214, 100, 214, 140); fenceRun(B, 176, 140, 214, 140); fenceRun(B, 176, 100, 176, 140);
  for (let i = 0; i < 24; i++) B.tomb(178 + (i % 6) * 6, 104 + Math.floor(i / 6) * 8, { dir: r(-10, 10), kind: ['stone', 'cross', 'slab'][i % 3], chunk: 'cinder_graves' });
  B.poi('plague_gate', 195, 97, { yaw: 180, type: 'stand' });
  B.searchSpot(196, 0.5, 122, { name: 'mass grave', loot: [['gold', 55], ['ring', 1]], id: 'mass_grave', verb: 'Dig through the' });
  keep.rect(174, 98, 216, 142);
  // gallows on the hill top
  const gx = 196, gz = 122 + 22;
  B.ground('dirt', 186, 150, 208, 166, 0, 0.06, { chunk: 'gallows', noise: 0 });
  B.kit('gallows').box(M.timber, [gx, 3, gz + 6], [0.4, 6, 0.4]); B.kit('gallows').box(M.timber, [gx + 2.4, 5.6, gz + 6], [5, 0.35, 0.35]); B.kit('gallows').box(M.timber, [gx + 1.2, 4.6, gz + 6], [0.2, 2, 0.2], [0, 0, 40]);
  B.lazyCollider(gx - 0.2, 0, gz + 5.8, gx + 0.2, 6, gz + 6.2, 'wood'); B.nav.block(gx - 0.4, gz + 5.6, gx + 0.4, gz + 6.4, 1);
  B.kit('gallows').box(M.plank, [gx + 2, 0.7, gz + 6], [3.4, 1.4, 3.4]); B.lazyCollider(gx + 0.3, 0, gz + 4.3, gx + 3.7, 1.4, gz + 7.7, 'wood'); B.nav.block(gx + 0.3, gz + 4.3, gx + 3.7, gz + 7.7, 1);
  for (let i = 0; i < 3; i++) B.kit('gallows').cyl(M.rope, [gx + 1.2 + i * 1.3, 4.2, gz + 6], 0.03, 1.3, [0, 0, 0], 5);
  B.poi('gallows_base', gx + 2, gz + 3, { yaw: 180, type: 'stand' });
  B.chest(gx - 4, gz + 3, { dir: 90, loot: [['gold', 40], ['potion', 1]], name: 'Hangman\'s kit', locked: true, lockLevel: 1, id: 'hangman_kit', chunk: 'gallows' });
  waystone(B, 208, 172, 'ws_gallows');
  scatter(B, keep, [60, -68, 254, 198], 200, (x, z) => { const t = rnd(); if (t < 0.25) deadStick(B, x, z, r(1, 1.5)); else if (t < 0.5) cellKit(B, 'wood', x, z).add(M.stoneOld, E.superquadric({ rx: 0.9, ry: 0.5, rz: 0.8, e1: 0.7, e2: 0.7, widthSegments: 6, heightSegments: 4 }), [x, 0.25, z], [0, r(0, 360), 0]); else pine(B, x, z, r(0.7, 1.15)); }, { spacing: 5 });

  // world edge: dense treeline so the map ends in forest, not void
  const edge = (x0, z0, x1, z1) => scatter(B, { hit: (x) => Math.abs(x) < 9 }, [x0, z0, x1, z1], Math.round((x1 - x0) * (z1 - z0) / 60), (x, z) => pine(B, x, z, r(1.0, 1.6)), { spacing: 3.2 });
  edge(-254, 186, 254, 197); edge(-254, -270, 254, -262); edge(246, -270, 255, 197); edge(-255, -270, -246, 197);
  // bandits' snares round the camp and on the wood trails; wires across the bandit gate
  B.trapSpots = [{ kind: 'bear', x: -160, z: -8 }, { kind: 'bear', x: -150, z: 20 }, { kind: 'bear', x: -186, z: 30 }, { kind: 'wire', x: -186, z: 12, yaw: 90 }, { kind: 'wire', x: -158, z: 2, yaw: 30 }, { kind: 'bear', x: -136, z: -34 }, { kind: 'bear', x: -104, z: 10 }, { kind: 'bear', x: -122, z: 40 }, { kind: 'wire', x: 118, z: 86, yaw: 0 }, { kind: 'bear', x: 140, z: 102 }, { kind: 'bear', x: -110, z: -150 }];
  B.useChunk('main');
  return { keep };
}
