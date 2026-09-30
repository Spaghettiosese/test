// The duchy grows: Fort Greywatch on the road (with a gaol), the lakeside village of Pellmouth,
// the Stonehollow Mine under the western hills, and the Choir Stones in the south-east.
import * as E from '../../../engine/index.js';
import './furniture.js';
import './houses.js';
import { dressHome } from './town.js';
import { waterPlane, deepWater, boardwalk, fenceRun, trail, logSeat, waystone, wprop } from './wilds.js';

const rnd = E.rng(5150);
const r = (a, b) => a + (b - a) * rnd();
const D2R = Math.PI / 180;
const arches = (list) => list.map(([side, at, w = 2.4]) => ({ side, at, w, kind: 'arch', h: 2.8 }));

export function expandDuchy(B, keep) {
  B.oreVeins = []; B.hollowSpots = []; B.fishSpots = [];
  fortGreywatch(B, keep); pellmouth(B, keep); stonehollow(B, keep); choirStones(B, keep); caravanPois(B); hideout(B, keep);
  B.useChunk('main');
}

// ---------------------------------------------------------------------------- Fort Greywatch
function fortGreywatch(B, keep) {
  const M = B.pal; B.useChunk('fort');
  const X0 = 10, X1 = 34, Z0 = -120, Z1 = -98;
  const W = (o) => B.wall({ mat: 'timber', h: 3.4, t: 0.5, kind: 'wood', chunk: 'fort', ...o });
  W({ axis: 'x', a: X0, b: X1, c: Z0 }); W({ axis: 'x', a: X0, b: X1, c: Z1 }); W({ axis: 'z', a: Z0, b: Z1, c: X1 });
  W({ axis: 'z', a: Z0, b: Z1, c: X0, openings: [{ at: 11, w: 3.8, top: 3.0, kind: 'arch' }] });
  for (let z = Z0 + 1; z < Z1; z += 2) B.kit('fort').cyl(M.timber, [X0 - 0.1, 3.8, z], 0.12, 1.4, [0, 0, 0], 5);
  // barracks
  const bar = B.house({ id: 'barracks', x: 12, z: -118, w: 13, d: 8, h: 3.6, wall: 'plaster', zone: 1, door: { side: 'N', at: 6, w: 1.6, id: 'fort_barracks_door' }, windows: [{ side: 'S', at: 3 }, { side: 'S', at: 9 }], roofMat: 'roofSlate' });
  for (let i = 0; i < 3; i++) B.bed(14 + i * 3.1, -115.8, { dir: 0, id: 'bed_fort_' + i, chunk: bar.chunk });
  B.table(14.6, -111.9, 2.2, 1.0, { chunk: bar.chunk }); B.chair(13.3, -111.9, 270, { name: 'fort_seat_0', chunk: bar.chunk }); B.chair(16.0, -111.9, 90, { name: 'fort_seat_1', chunk: bar.chunk }); B.chair(14.6, -113.0, 0, { name: 'fort_seat_2', chunk: bar.chunk }); B.candle(14.6, 0.85, -111.9, { chunk: bar.chunk });
  B.hearth(23.2, 0, -116.9, { r: 0.35, range: 9, intensity: 8, chunk: bar.chunk });
  B.chest(20.8, -111.5, { dir: 180, name: 'Confiscated goods', id: 'fort_confiscated', locked: true, lockLevel: 2, loot: [], chunk: bar.chunk, w: 0.9, d: 0.55 });
  B.chest(23.6, -111.6, { dir: 180, name: 'Armory chest', locked: true, lockLevel: 2, loot: [['watchhelm', 1], ['jerkin', 1], ['knife', 4]], chunk: bar.chunk, w: 0.9, d: 0.55 });
  // the gaol
  const gaol = B.house({ id: 'gaol', x: 26, z: -118, w: 8, d: 8, h: 3.4, wall: 'stoneDark', timber: false, zone: 2, floor: 'flagstone', door: { side: 'N', at: 4, w: 1.4, id: 'gaol_door', locked: true, keyId: 'gaolkey', lockLevel: 2, name: 'gaol door' }, windows: [{ side: 'S', at: 4, w: 0.5 }], roofMat: 'roofSlate' });
  B.bed(28.6, -115.6, { dir: 0, id: 'bed_gaol', w: 0.95, chunk: gaol.chunk });
  B.prop('bucket', 32.5, 0, -116.2); B.prop('hay', 31.6, 0, -112.4, { yaw: 20 });
  B.poi('gaol_cell', 30.5, -113.5, { yaw: 180, type: 'stand' });
  B.torch(27.1, 2.3, -113.5, { dir: [1, 0], chunk: gaol.chunk, range: 6, intensity: 5 });
  // the yard
  B.hearth(22, 0, -102.5, { r: 0.55, range: 14, intensity: 12, chunk: 'fort' });
  for (let i = 0; i < 4; i++) { const a = i * 90 + 45; logSeat(B, 'fort_fire_' + i, 22 + Math.sin(a * D2R) * 2.8, -102.5 + Math.cos(a * D2R) * 2.8, (a + 180) % 360); }
  B.prop('dummy', 29, 0, -103.4, { yaw: 90 }); B.prop('dummy', 29, 0, -106.4, { yaw: 90 });
  for (const [x, z] of [[33, -110], [33, -111.2], [32, -99.6], [11.6, -99.6]]) B.prop(['barrel', 'crate'][Math.floor(r(0, 2))], x, 0, z, { yaw: r(0, 360) });
  B.lampPost(7.4, -106.4, { chunk: 'fort' }); B.lampPost(7.4, -112, { chunk: 'fort' });
  B.roundTower({ x: 34.6, z: -97.4, r: 2.5, h: 8, mat: 'stoneOld', cone: false, crenel: true, chunk: 'fort' });
  B.kit('fort').cyl(M.timber, [17, 3.5, -99.4], 0.05, 7, [0, 0, 0], 5); B.kit('fort').box(M.crimson, [17.6, 6.2, -99.4], [1.2, 1.6, 0.04]);
  B.poi('fort_gate_l', 12.6, -111.2, { yaw: 270, type: 'stand' }); B.poi('fort_gate_r', 12.6, -106.8, { yaw: 270, type: 'stand' });
  B.poi('fort_parade', 20, -106.4, { yaw: 180, type: 'stand' }); B.poi('fort_spar_a', 27.4, -103.4, { yaw: 270, type: 'stand' }); B.poi('fort_spar_b', 27.4, -106.4, { yaw: 270, type: 'stand' });
  B.route('fort_yard', [[14, -106], [30, -107.5], [30, -100.5], [14, -101]]);
  B.route('road_patrol', [[2, -110], [1, -98], [1, -88], [2, -98]]);
  trail(B, [[3, -109], [10, -109]], { w: 3 }); keep.rect(6, -124, 38, -94);
  stable(B, keep);
}

// a lean-to stable west of the road: the only place in the duchy that sells a horse
function stable(B, keep) {
  const M = B.pal, k = B.kit('fort');
  for (const [x, z] of [[-12, -117.6], [-4, -117.6], [-12, -105.4], [-4, -105.4]]) k.cyl(M.timber, [x, 1.6, z], 0.11, 3.2, [0, 0, 0], 6);
  k.box(M.timber, [-8, 3.25, -111.5], [9.4, 0.14, 13.4]); k.box(M.roofSlate, [-8, 3.4, -111.5], [9.8, 0.1, 13.8]);
  k.box(M.timber, [-12, 1.5, -111.5], [0.12, 3.0, 12]);
  B.prop('hay', -5.0, 0, -107.4, { yaw: 40 }); B.prop('hay', -10.8, 0, -107.0, { yaw: 100 }); B.prop('barrel', -2.6, 0, -105.6, { yaw: 0 }); B.prop('crate', -3.6, 0, -105.4, { yaw: 12 });
  for (let i = 0; i < 3; i++) B.bed(-11 + i * 3.1, -116.4, { dir: 0, id: i ? 'bed_stable_' + i : 'bed_stable', w: 0.95 });
  k.box(M.plank, [-9.4, 0.45, -113.2], [0.5, 0.3, 2.2]);
  k.box(M.timber, [-4.4, 0.95, -111.5], [0.1, 0.1, 5]);
  B.lampPost(-2.6, -108, { chunk: 'fort' });
  B.stable = { x: -7.6, z: -111.5, yaw: -90 };
  keep.rect(-14, -119, -2, -104);
  B.poi('stable_hand', -3.4, -109, { yaw: 90, type: 'stand' });
}

// the caravan's places are moved about by the Caravan system; these are only its first positions
function caravanPois(B) {
  const x = 8, z = -70;
  B.poi('caravan_m', x + 3, z + 1, { yaw: 270, type: 'stand' }); B.poi('caravan_g1', x + 4.5, z - 3, { yaw: 0, type: 'stand' }); B.poi('caravan_g2', x + 4.5, z + 5, { yaw: 180, type: 'stand' });
  B.poi('caravan_bed_m', x - 0.5, z + 4, { yaw: 90, type: 'sleep' }); B.poi('caravan_bed_g', x - 1.8, z - 3, { yaw: 90, type: 'sleep' });
  B.caravanSeed = [x, z];
}

// a hunter's cabin beside the old road that anyone with the gold can lease: a bed, a stash, a bench
function hideout(B, keep) {
  const M = B.pal, X = -31, Z = -54, W = 8, D = 6;
  const cab = B.house({ id: 'hideout', x: X, z: Z, w: W, d: D, h: 3.2, wall: 'plaster', door: { side: 'E', at: 3, w: 1.4, id: 'hideout_door', locked: true, keyId: 'hideoutkey', lockLevel: 4, name: 'cabin door' }, windows: [{ side: 'N', at: 4 }, { side: 'S', at: 4 }], roofMat: 'roofThatch' });
  B.bed(X + 1.3, Z + 1.3, { dir: 0, id: 'bed_hideout', w: 0.95, chunk: cab.chunk });
  B.hearth(X + 6.4, 0, Z + D - 0.9, { r: 0.35, range: 9, intensity: 8, chunk: cab.chunk });
  B.table(X + 5.4, Z + 1.6, 2.0, 0.9, { chunk: cab.chunk });
  B.torch(X + W - 0.3, 2.2, Z + 3, { dir: [-1, 0], chunk: cab.chunk, range: 6, intensity: 5 });
  B.kit(cab.chunk).box(M.timber, [X + 1.0, 0.4, Z + D - 0.8], [1.3, 0.8, 0.7]); B.kit(cab.chunk).box(M.iron, [X + 1.0, 0.82, Z + D - 0.8], [1.34, 0.06, 0.74]);
  B.kit(cab.chunk).box(M.plank, [X + 0.25, 1.4, Z + 3.4], [0.3, 0.06, 2.6]);
  B.hideoutSpots = { stash: [X + 1.0, Z + D - 0.8], bench: [X + 5.4, Z + 1.6], plate: [X + 0.4, Z + 3.4], sign: [X + W + 0.7, Z + 1.4], door: 'hideout_door' };
  keep.rect(X - 2, Z - 2, X + W + 3, Z + D + 2); keep.line([[X + W + 2, Z + 3], [-3, Z + 3]], 3.4);
  trail(B, [[-3, Z + 3], [X + W + 1.6, Z + 3]], { w: 2.4 });
}

// ---------------------------------------------------------------------------- Pellmouth
function pellmouth(B, keep) {
  const M = B.pal; B.useChunk('pell');
  const lake = new E.Material({ name: 'Lake', color: '#1e3a48', roughness: 0.05, metallic: 0.4 });
  deepWater(B, 156, -194, 208, -138, lake);
  B.ground('dirt', 112, -198, 156, -134, 0, 0.05, { chunk: 'pell', noise: 0 });
  const homes = [['pell_a', 120, -152], ['pell_b', 120, -166], ['pell_c', 120, -180]];
  for (const [id, x, z] of homes) {
    const b = B.house({ id, x, z, w: 8, d: 7, h: 3.6, wall: 'plank', timber: false, door: { side: 'E', at: 3.5, w: 1.5, id: id + '_door' }, windows: [{ side: 'S', at: 3 }, { side: 'N', at: 4 }], roofMat: 'roofThatch' });
    dressHome(B, b, { chest: { loot: [['gold', 10 + Math.floor(r(0, 14))], ['bread', 1]], name: 'Fisher\'s chest', locked: rnd() < 0.5, lockLevel: 1 } });
  }
  const inn = B.house({ id: 'inn', x: 136, z: -172, w: 14, d: 10, h: 4, wall: 'plank', timber: false, door: { side: 'W', at: 5, w: 1.7, id: 'inn_door' }, windows: [{ side: 'S', at: 4 }, { side: 'S', at: 10 }, { side: 'N', at: 7 }], roofMat: 'roofThatch' });
  B.bar(138, -164.6, 148.6, -163.6, { chunk: inn.chunk });
  for (let i = 0; i < 4; i++) { const x = 139.5 + (i % 2) * 4.2, z = -168.6 + Math.floor(i / 2) * 2.8; B.table(x, z, 1.6, 1.0, { chunk: inn.chunk }); B.chair(x - 1.1, z, 270, { name: 'pell_seat_' + (i * 2), chunk: inn.chunk }); B.chair(x + 1.1, z, 90, { name: 'pell_seat_' + (i * 2 + 1), chunk: inn.chunk }); B.candle(x, 0.85, z, { chunk: inn.chunk }); B.prop('mug', x + 0.3, 0.85, z + 0.1); }
  B.hearth(143, 0, -171, { r: 0.45, range: 12, intensity: 11, chunk: inn.chunk });
  B.bed(148.4, -170.4, { dir: 0, id: 'bed_inn_0', chunk: inn.chunk }); B.bed(146, -170.4, { dir: 0, id: 'bed_inn_1', chunk: inn.chunk });
  B.poi('inn_bar', 143.5, -165.4, { yaw: 180, type: 'stand' });
  B.chest(137.4, -171, { dir: 90, name: 'Inn strongbox', loot: [['gold', 55], ['wine', 2]], locked: true, lockLevel: 2, chunk: inn.chunk, w: 0.9, d: 0.55 });
  for (let i = 0; i < 3; i++) B.prop('barrel', 137 + i * 0.9, 0, -163.6 + 0.3, { yaw: 10 * i });
  // the pier and boats
  boardwalk(B, [152, -155], [182, -155], { w: 2.4, y: 0.25 });
  B.lampPost(153, -153.4, { chunk: 'pell' }); B.lampPost(170, -153.4, { chunk: 'pell' });
  B.poi('fish_pier', 181.4, -155, { yaw: 90, type: 'stand', y: 0.25 }); B.poi('fish_shore_a', 153.4, -186, { yaw: 90, type: 'stand' }); B.poi('fish_shore_b', 153.4, -143, { yaw: 90, type: 'stand' });
  B.fishSpots.push({ x: 181.4, z: -155, y: 0.25 }, { x: 153.4, z: -186, y: 0 }, { x: 153.4, z: -143, y: 0 }, { x: 170, z: -156.8, y: 0.25 });
  for (const [bx, bz, yaw] of [[166, -150, 0], [174, -159.6, 0]]) { const k = B.kit('pell'); k.box(M.plank, [bx, 0.15, bz], [4.2, 0.3, 1.5], [0, yaw, 0]); k.box(M.timber, [bx, 0.5, bz - 0.7], [4.0, 0.3, 0.1]); k.box(M.timber, [bx, 0.5, bz + 0.7], [4.0, 0.3, 0.1]); k.box(M.timber, [bx + 2.1, 0.5, bz], [0.1, 0.3, 1.5]); }
  for (let i = 0; i < 4; i++) { B.kit('pell').cyl(M.timber, [148, 1.1, -190 + i * 4], 0.05, 2.2, [0, 0, 0], 5); B.kit('pell').box(M.rope, [148, 1.9, -190 + i * 4 + 1], [0.05, 0.05, 2.0]); B.kit('pell').box(M.rope, [148.06, 1.3, -190 + i * 4 + 1], [0.02, 1.0, 1.8]); }
  B.poi('pell_dock', 150.4, -152.6, { yaw: 90, type: 'stand' }); B.poi('pell_net', 146.4, -188, { yaw: 90, type: 'stand' });
  B.route('pell_lane', [[131, -150], [139, -160], [131, -176], [131, -189], [140, -176]]);
  trail(B, [[100, -130], [118, -141], [130, -153], [133, -176]], { w: 2.8 });
  B.ground('dirt', 126, -192, 136, -138, 0, 0.05, { chunk: 'pell', noise: 0 });
  keep.rect(110, -200, 212, -132);
}

// ---------------------------------------------------------------------------- Stonehollow Mine
function stonehollow(B, keep) {
  const M = B.pal; B.useChunk('mine');
  const ore = new E.Material({ name: 'Ore', color: '#6a7a9a', metallic: 0.8, roughness: 0.4, emissive: '#3a4a8a', emissiveStrength: 0.9 });
  const root = new E.Material({ name: 'Choir root', color: '#3a2060', roughness: 0.6, emissive: '#8f5cff', emissiveStrength: 2.2 });
  const mk = (id, x, z, w, d, ar, extra = {}) => B.house({ id, x, z, w, d, h: 4, wall: 'stoneDark', timber: false, zone: 1, roof: false, underground: true, floor: 'flagstone', ceilMat: 'stoneOld', noise: 1, t: 0.9, doors: arches(ar), ...extra });
  const A = mk('mine_a', -244, 118, 18, 10, [['S', 9, 2.6], ['N', 9, 2.4]]);
  const Bt = mk('mine_b', -238, 128, 6, 16, [['S', 3, 2.4], ['N', 3, 2.4]]);
  const C = mk('mine_c', -248, 144, 22, 16, [['S', 13, 2.4]], { h: 5 });
  B.torch(-243.3, 2.4, 123, { dir: [1, 0], chunk: 'mine_a', range: 10, intensity: 8 }); B.torch(-226.7, 2.4, 123, { dir: [-1, 0], chunk: 'mine_a', range: 10, intensity: 8 });
  B.torch(-237.5, 2.4, 134, { dir: [1, 0], chunk: 'mine_b', range: 8, intensity: 6, color: '#8fb0ff' });
  B.torch(-247.3, 2.6, 150, { dir: [1, 0], chunk: 'mine_c', range: 10, intensity: 6, color: '#8fb0ff' });
  [-242.2, -240, -229.6, -227.4].forEach((x, i) => { if (i < 3) B.bed(x, 120.3, { dir: 0, id: 'bed_mine_' + i, chunk: 'mine_a' }); });
  B.table(-229, 124.4, 2.2, 1, { chunk: 'mine_a' }); B.chair(-229, 125.6, 0, { name: 'mine_seat', chunk: 'mine_a' }); B.candle(-229, 0.85, 124.4, { chunk: 'mine_a' });
  B.chest(-226.9, 120.6, { dir: 270, name: 'Foreman\'s chest', loot: [['pickaxe', 1], ['whetstone', 2], ['gold', 30]], locked: true, lockLevel: 1, chunk: 'mine_a', w: 0.9, d: 0.55 });
  for (const [x, z] of [[-243, 126], [-242, 126.7], [-228, 127]]) wprop(B, 'barrel', x, z);
  for (const [x, z] of [[-243, 123.6], [-231, 119.4]]) wprop(B, 'crate', x, z, { yaw: 30 });
  B.poi('mine_foreman', -233, 122, { yaw: 180, type: 'stand' }); B.poi('mine_work_0', -242.6, 124.5, { yaw: 270, type: 'stand' }); B.poi('mine_work_1', -232.7, 137, { yaw: 270, type: 'stand' }); B.poi('mine_work_2', -237, 156, { yaw: 180, type: 'stand' });
  // ore veins on the walls
  const vein = (x, y, z, sx, sz) => { B.vbox(ore, x - sx / 2, y - 0.5, z - sz / 2, x + sx / 2, y + 0.5, z + sz / 2, { chunk: 'mine_a' }); B.oreVeins.push({ x: x + (sx < sz ? (x > -236 ? -0.9 : 0.9) : 0), y, z: z + (sx > sz ? (z > 140 ? -0.9 : 0.9) : 0), ready: true, regrow: 0 }); };
  vein(-243.45, 1.4, 125, 0.2, 1.6); vein(-232.45, 1.3, 138, 0.2, 1.4); vein(-237.6, 1.2, 140.5, 0.2, 1.2); vein(-247.45, 1.4, 153, 0.2, 1.6); vein(-226.45, 1.4, 155, 0.2, 1.4); vein(-240, 1.3, 159.45, 1.6, 0.2);
  B.oreVeins[0].x = -242.5; B.oreVeins[1].x = -233.4; B.oreVeins[2].x = -236.7; B.oreVeins[3].x = -246.5; B.oreVeins[4].x = -227.4; B.oreVeins[5].z = 158.5;
  // the cavern and what sleeps in it
  B.solid(root, -238.4, 0, 151.4, -236.6, 2.6, 153.2, { chunk: 'mine_c', nav: true });
  const l = new E.Light('point', { color: '#8f5cff', intensity: 9, range: 12, flicker: 0.3 }); l.position.set([-237.5, 2.4, 152.3]); B.decor.add(l); B.lights.push(l);
  B.chest(-226.6, 158, { dir: 270, name: 'Miner\'s cache', loot: [['gold', 75], ['gem', 1], ['nightcloak', 1], ['ore', 3]], locked: true, lockLevel: 2, id: 'mine_cache', chunk: 'mine_c', w: 0.9, d: 0.55 });
  B.poi('mine_deep', -237.5, 148.4, { yaw: 0, type: 'stand' });
  B.hollowSpots.push([-244, 152], [-231, 153], [-241, 158], [-233, 157.5], [-236, 148]);
  trail(B, [[-200, 88], [-214, 102], [-235, 113]], { w: 2.6 }); keep.rect(-254, 110, -205, 168);
}

// ---------------------------------------------------------------------------- the Choir Stones
function choirStones(B, keep) {
  const M = B.pal; B.useChunk('stones'); const cx = 80, cz = -200, R = 7.2;
  B.ground('ash', cx - 11, cz - 11, cx + 11, cz + 11, 0, 0.05, { chunk: 'stones', noise: 0 });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2, x = cx + Math.cos(a) * R, z = cz + Math.sin(a) * R, h = 2.6 + r(0, 1.4);
    B.kit('stones').box(M.stoneOld, [x, h / 2, z], [0.9, h, 0.7], [r(-4, 4), -a / D2R + 90, r(-4, 4)], 0.05); B.kit('stones').box(M.rune, [x, h * 0.6, z], [0.3, 0.5, 0.74], [0, -a / D2R + 90, 0]);
    B.lazyCollider(x - 0.55, 0, z - 0.55, x + 0.55, h, z + 0.55, 'stone'); B.nav.block(x - 0.6, z - 0.6, x + 0.6, z + 0.6, 1);
  }
  B.solid('stoneDark', cx - 1.3, 0, cz - 0.8, cx + 1.3, 1.0, cz + 0.8, { chunk: 'stones', bevel: 0.05 });
  B.kit('stones').box(M.rune, [cx, 1.02, cz], [1.6, 0.04, 0.5]);
  const l = new E.Light('point', { color: '#8f5cff', intensity: 6, range: 14, flicker: 0.25 }); l.position.set([cx, 1.6, cz]); B.decor.add(l); B.lights.push(l);
  B.poi('stones_altar', cx, cz - 1.8, { yaw: 0, type: 'stand' });
  B.searchSpot(cx, 1.1, cz + 1.4, { name: 'altar offerings', loot: [['gold', 45], ['sainttear', 1]], id: 'stones_offering', verb: 'Search the' });
  waystone(B, cx, cz + 13.5, 'ws_stones');
  B.hollowSpots.push([cx - 4, cz - 3], [cx + 4, cz + 3], [cx + 3, cz - 4], [cx - 3, cz + 4.6], [cx, cz + 9]);
  trail(B, [[3, -198], [30, -200], [58, -200], [70, -200]], { w: 2.6 }); keep.rect(cx - 13, cz - 13, cx + 13, cz + 16);
}
