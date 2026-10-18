// Mountain & Meadow art: trail props, the rope bridge, waterfall, summit kit, Yukemuri facades and baths, onsen cats and
// snow monkeys, ranch animals, windmill, lake boathouse and cabin. All hd sprites via the town spr() helper (the engine
// adds the outline margin). Animals are drawn in 'ink' outline; props use the selective outline.
import { spr, line } from '../town/lib.js';
import { facade } from '../town/facade.js';
import { RAMPS as Rr } from '../../gfx/palette.js';

const INK = '#2a1a22', P = (name, w, h, draw, o = {}) => spr(name, w, h, draw, o), A = (name, w, h, draw) => spr(name, w, h, (R) => draw(R), { outline: 'ink' });
const D = (name, w, h, draw, o = {}) => spr(name, w, h, draw, { outline: false, ...o }); // flat decals: no outline

// ------------------------------------------------------------------ trailhead and trail furniture
P('tk_sign', 26, 42, (R, M) => {
  R(11, 14, 4, 27, M.wood[2]); R(11, 14, 1, 27, M.wood[3]); R(2, 4, 22, 10, M.woodDark[3]); R(2, 4, 22, 2, M.wood[4]); R(2, 13, 22, 1, M.woodDark[1]);
  R(5, 8, 12, 1, M.paper[4]); R(5, 10, 8, 1, M.paper[3]); R.t([18, 6], [18, 12], [23, 9], M.paper[4]);
});
P('tk_bellpost', 18, 38, (R, M) => {
  R(7, 4, 4, 33, M.wood[2]); R(7, 4, 1, 33, M.wood[3]); R(2, 3, 14, 3, M.woodDark[2]); R(1, 4, 3, 5, M.butter[2]); R(1, 4, 1, 3, M.butter[4]);
  R(13, 6, 3, 8, M.butter[2]); R(13, 6, 1, 6, M.butter[4]); R(12, 14, 5, 1, M.butter[1]); R(14, 15, 1, 1, M.ink[1]);
  R(4, 16, 10, 8, M.paper[4]); R(5, 18, 8, 1, M.ribbon[2]); R(5, 20, 6, 1, M.ink[2]);
});
P('tk_register', 48, 42, (R, M) => {
  R(2, 14, 44, 26, M.wood[2]); R(2, 14, 44, 3, M.wood[4]); R(2, 39, 44, 1, M.woodDark[1]); R(0, 12, 48, 4, M.woodDark[3]);
  R.t([4, 12], [44, 12], [24, 1], M.roofTeal[2]); R(4, 12, 40, 2, M.roofTeal[1]); R(6, 20, 14, 14, M.paper[4]); R(8, 23, 10, 1, M.forest[2]); R(8, 26, 8, 1, M.ink[3]); R(8, 29, 10, 1, M.ink[3]);
  R(26, 20, 16, 18, M.wood[3]); for (let i = 0; i < 4; i++) R(28, 22 + i * 4, 12, 2, M.forest[i % 2 ? 3 : 2]);
});
for (const [k, c] of [['a', 'coral'], ['b', 'sky'], ['c', 'mint']]) P(`tk_car_${k}`, 56, 30, (R, M) => {
  const B = M[c];
  R(2, 12, 52, 12, B[2]); R(2, 12, 52, 2, B[3]); R(10, 3, 32, 11, B[2]); R(10, 3, 32, 2, B[3]); R(13, 5, 12, 8, M.sky[4]); R(28, 5, 11, 8, M.sky[4]);
  R(2, 22, 52, 3, B[1]); R(50, 15, 4, 3, M.butter[3]); R(2, 15, 3, 3, M.ribbon[2]);
  for (const x of [13, 40]) { R.e(x, 25, 5, 4, M.charcoal[1]); R.e(x, 25, 2, 2, M.metal[3]); }
});
P('tk_shelter', 64, 60, (R, M, se) => {
  R(4, 14, 56, 6, M.woodDark[2]); R.t([0, 16], [64, 16], [32, 2], M.roofTeal[2]); R.t([8, 15], [32, 15], [32, 5], M.roofTeal[3]); R(0, 14, 64, 3, M.roofTeal[1]);
  R(6, 17, 4, 40, M.wood[2]); R(54, 17, 4, 40, M.wood[2]); R(6, 17, 1, 40, M.wood[3]); R(12, 34, 40, 5, M.wood[3]); R(12, 34, 40, 1, M.wood[4]); R(14, 39, 3, 16, M.wood[1]); R(47, 39, 3, 16, M.wood[1]);
  R(16, 22, 18, 10, M.paper[3]); R(18, 24, 14, 1, M.forest[2]); R(18, 27, 10, 1, M.ink[3]);
  if (se === 'winter') R.t([6, 14], [58, 14], [32, 3], M.snow[4]);
}, { seasonal: true });
D('tk_plank', 32, 32, (R, M) => {
  R(0, 0, 32, 32, M.wood[2]); for (let y = 0; y < 32; y += 8) { R(0, y, 32, 1, M.wood[1]); R(0, y + 1, 32, 1, M.wood[3]); }
  for (let y = 0; y < 32; y += 8) R(y % 16 ? 6 : 22, y + 4, 1, 4, M.wood[1]);
});
P('tk_rope_rail', 32, 26, (R, M) => {
  for (const x of [1, 29]) { R(x, 4, 3, 21, M.woodDark[2]); R(x, 4, 1, 21, M.woodDark[3]); }
  line(R, 2, 8, 30, 8, M.sand[3]); line(R, 2, 9, 30, 9, M.sand[1]); line(R, 2, 16, 30, 16, M.sand[3]); line(R, 2, 17, 30, 17, M.sand[1]);
});
P('tk_boulder', 34, 34, (R, M) => {
  R.e(17, 20, 15, 12, M.stone[2]); R.e(15, 16, 11, 8, M.stone[3]); R.e(12, 13, 5, 3, M.stone[4]); R(6, 28, 24, 3, M.stone[1]); R(20, 12, 8, 1, M.stone[1]);
});
P('tk_mat', 38, 20, (R, M) => {
  R.e(19, 11, 16, 7, M.stone[2]); R.e(18, 9, 13, 5, M.stone[3]); R.e(15, 8, 6, 2, M.stone[4]); R(10, 7, 18, 4, M.forest[2]); R(10, 7, 18, 1, M.forest[3]);
});
P('tk_cairn', 26, 32, (R, M) => {
  R.e(13, 27, 10, 4, M.stone[2]); R.e(13, 19, 7, 4, M.stone[3]); R.e(12, 13, 5, 3, M.stone[2]); R.e(13, 8, 3, 3, M.stone[3]); R(11, 17, 3, 1, M.stone[4]); R(6, 27, 3, 1, M.stone[4]);
});
P('tk_telescope', 30, 50, (R, M) => {
  R.t([14, 28], [4, 48], [8, 48], M.metal[2]); R.t([15, 28], [24, 48], [20, 48], M.metal[1]); R(13, 26, 4, 6, M.metal[3]); R(14, 44, 3, 4, M.metal[2]);
  R(5, 8, 20, 9, M.metal[3]); R(5, 8, 20, 2, M.metal[4]); R(2, 9, 5, 7, M.metal[2]); R(23, 10, 5, 5, M.coral[2]); R(6, 12, 18, 1, M.metal[1]);
});
P('tk_hokora', 54, 52, (R, M, se) => {
  R(8, 30, 38, 20, M.stone[2]); R(8, 30, 38, 2, M.stone[3]); R(10, 22, 34, 10, M.woodDark[2]); R(14, 24, 26, 8, M.ink[1]); R(22, 25, 10, 7, M.butter[3]); R(24, 27, 6, 3, M.coral[2]);
  R.t([2, 24], [52, 24], [27, 4], M.roofRed[2]); R.t([8, 23], [27, 23], [27, 7], M.roofRed[3]); R(2, 23, 50, 3, M.roofRed[1]); R(14, 44, 26, 6, M.stone[3]);
  if (se === 'winter') R.t([8, 24], [46, 24], [27, 7], M.snow[4]);
}, { seasonal: true });
P('tk_ropeway', 90, 96, (R, M, se) => {
  R(6, 40, 60, 54, M.woodDark[2]); R(6, 40, 60, 3, M.woodDark[3]); R.t([0, 42], [72, 42], [36, 14], M.roofSlate[2]); R.t([6, 41], [36, 41], [36, 18], M.roofSlate[3]); R(0, 40, 72, 3, M.roofSlate[1]);
  R(14, 56, 20, 38, M.ink[2]); R(16, 58, 16, 36, M.butter[3]); R(38, 52, 22, 14, M.sky[4]); R(38, 52, 22, 2, M.paper[4]);
  R(66, 8, 4, 86, M.metal[2]); R(66, 8, 1, 86, M.metal[3]); line(R, 68, 14, 88, 3, M.metal[1]); line(R, 68, 15, 88, 4, M.metal[3]);
  R(74, 18, 14, 10, M.ribbon[2]); R(74, 18, 14, 2, M.ribbon[3]); R(77, 21, 8, 4, M.sky[4]); R(80, 11, 1, 7, M.metal[1]);
  if (se === 'winter') R.t([0, 42], [72, 42], [36, 20], M.snow[4]);
}, { seasonal: true });
D('tk_snow_patch', 64, 32, (R, M) => { R.e(32, 16, 28, 11, M.snow[3]); R.e(30, 14, 22, 8, M.snow[4]); R.e(46, 19, 8, 3, M.snow[2]); });
P('tk_ski_gate', 56, 56, (R, M) => {
  for (const x of [4, 48]) { R(x, 4, 4, 50, M.woodDark[2]); R(x, 4, 1, 50, M.woodDark[3]); }
  R(2, 4, 52, 8, M.ribbon[2]); R(2, 4, 52, 2, M.ribbon[3]); for (let i = 0; i < 6; i++) R(5 + i * 8, 6, 4, 4, M.paper[4]);
  R(10, 40, 3, 12, M.sky[3]); R(40, 40, 3, 12, M.sky[3]);
});
// the waterfall: two frames of falling water over a rock face
for (const f of [0, 1]) P(`tk_falls_${f}`, 96, 124, (R, M) => {
  R(0, 0, 96, 124, M.stone[1]); for (let i = 0; i < 30; i++) R((i * 29) % 90, (i * 13) % 110, 6 + (i % 3) * 3, 3, i % 2 ? M.stone[2] : M.stone[0]);
  R(0, 0, 96, 14, M.forest[1]); R(10, 4, 20, 10, M.forest[2]); R(60, 2, 24, 12, M.forest[2]);
  R(30, 12, 38, 106, M.water[3]); R(30, 12, 3, 106, M.water[4]); R(65, 12, 3, 106, M.water[2]);
  for (let y = 14; y < 112; y += 6) { R(36 + ((y + f * 3) % 12), y, 3, 4, M.water[5]); R(50 + ((y * 2 + f * 5) % 11), y + 2, 2, 5, M.water[4]); }
  R(22, 112, 54, 10, M.water[5]); for (let i = 0; i < 8; i++) R(24 + i * 6 + f * 2, 112 + (i % 2) * 3, 4, 3, M.paper[4]);
}, {});
P('tk_hut_bunk', 64, 56, (R, M) => {
  R(2, 2, 60, 52, M.woodDark[2]); R(2, 2, 60, 2, M.woodDark[3]); for (const y of [8, 30]) { R(6, y, 52, 10, M.wood[3]); R(6, y, 52, 2, M.wood[4]); R(8, y + 2, 22, 7, M.paper[4]); R(30, y + 2, 26, 7, M.coral[2]); }
  R(4, 52, 4, 2, M.woodDark[1]); R(56, 52, 4, 2, M.woodDark[1]);
});
P('tk_hearth', 62, 48, (R, M) => {
  R(2, 20, 58, 26, M.stone[2]); R(2, 20, 58, 3, M.stone[3]); R(8, 24, 46, 20, M.wood[1]); R(12, 28, 38, 14, M.charcoal[0]);
  R.e(31, 36, 12, 5, M.vermilion[2]); R.e(31, 34, 7, 3, M.butter[3]); R.t([14, 28], [48, 28], [31, 18], M.metal[2]); R(30, 4, 2, 16, M.metal[1]); R.e(31, 22, 7, 5, M.metal[1]); R(34, 18, 6, 3, M.metal[2]);
});
P('tk_barrel_tub', 46, 42, (R, M) => {
  R.e(23, 16, 19, 8, M.wood[3]); R.e(23, 16, 16, 6, M.water[3]); R.e(21, 15, 8, 3, M.water[4]); R(4, 16, 38, 22, M.wood[2]); R(4, 16, 4, 22, M.wood[3]); R(38, 16, 4, 22, M.wood[1]);
  for (const y of [22, 32]) R(4, y, 38, 2, M.metal[1]); R.e(23, 38, 19, 3, M.wood[1]); R(8, 36, 30, 2, M.wood[1]);
});
D('yk_pool_cave', 96, 64, (R, M) => {
  R.e(48, 32, 46, 29, M.stone[1]); R.e(48, 32, 42, 26, M.water[2]); R.e(46, 30, 34, 19, M.water[3]); R.e(40, 26, 14, 7, M.water[4]); R.e(66, 40, 8, 3, M.water[5]);
  for (let i = 0; i < 9; i++) R.e(10 + i * 9, 6 + (i * 7) % 52, 3, 2, M.stone[3]);
});
// ------------------------------------------------------------------ Yukemuri village
const RYO = (name, w, wall, roofRamp, curtain, sign, door) => facade(name, { w, top: 8, roofH: 56, wallH: 84, wall, wallRamp: wall === 'siding' ? 'woodDark' : 'paper', roof: 'kawara', roofRamp, wainscot: 'woodDark', posts: true,
  door: { x: door, style: 'double', ramp: 'woodDark' }, noren: [{ x: door - 6, w: 44, y: 62, ramp: curtain }], chimney: 12,
  windows: [{ x: 14, y: 14, curtain, box: true }, { x: 54, y: 14, curtain, box: true }, { x: w * 32 - 66, y: 14, curtain, box: true }, { x: w * 32 - 36, y: 54, curtain }].filter((q) => Math.abs(q.x - door) > 40),
  signs: [{ text: sign, y: 52, ramp: curtain === 'navy' ? 'navy' : 'paper', light: true, ink: curtain, inkI: 0, hang: true }] });
RYO('yk_ryokan_a', 9, 'plaster', 'roofSlate', 'coral', 'Kitsune-no-Yu', 126);
RYO('yk_ryokan_b', 8, 'siding', 'roofRed', 'navy', 'Tsuru Inn', 112);
RYO('yk_ryokan_c', 8, 'plaster', 'roofTeal', 'mint', 'Hoshi Inn', 100);
RYO('yk_ryokan_d', 9, 'siding', 'roofSlate', 'butter', 'Matsu Inn', 120);
facade('yk_bathhouse', { w: 8, top: 22, roofH: 58, wallH: 80, wall: 'plaster', wallRamp: 'paper', roof: 'kawara', roofRamp: 'roofRed', wainscot: 'sky', posts: true, chimney: 220,
  door: { x: 100, style: 'double', ramp: 'woodDark' }, noren: [{ x: 94, w: 44, y: 62, ramp: 'navy', text: '' }], awnings: [{ x: 4, w: 84, y: 40, a: 'navy', b: 'paper' }],
  windows: [{ x: 16, y: 14, w: 40, h: 28, shop: true }, { x: 176, y: 14, w: 40, h: 28, shop: true }], signs: [{ text: 'Yukemuri Yu', y: 54, ramp: 'paper', light: true, ink: 'navy', inkI: 0, hang: true }] });
facade('yk_shop_souv', { w: 5, top: 8, roofH: 22, wallH: 92, wall: 'siding', wallRamp: 'wood', roof: 'tin', roofRamp: 'roofTeal', posts: true, door: { x: 66, style: 'wood', ramp: 'woodDark' },
  windows: [{ x: 8, y: 50, w: 44, h: 32, shop: true }, { x: 100, y: 50, w: 44, h: 32, shop: true }], noren: [{ x: 60, w: 40, y: 50, ramp: 'coral' }], signs: [{ text: 'Souvenirs', y: 34, ramp: 'wood', light: true, ink: 'woodDark', inkI: 1 }] });
facade('yk_shop_egg', { w: 4, top: 8, roofH: 22, wallH: 90, wall: 'siding', wallRamp: 'woodDark', roof: 'tin', roofRamp: 'roofSlate', posts: true, door: { x: 48, style: 'wood', ramp: 'wood' },
  windows: [{ x: 8, y: 50, w: 34, h: 32, shop: true }, { x: 84, y: 50, w: 34, h: 32, shop: true }], awnings: [{ x: 4, w: 120, y: 38, a: 'butter', b: 'paper' }], signs: [{ text: 'Onsen eggs', y: 24, ramp: 'butter', light: true, ink: 'woodDark', inkI: 1 }] });
facade('yk_shop_manju', { w: 4, top: 8, roofH: 22, wallH: 90, wall: 'plaster', wallRamp: 'paper', roof: 'kawara', roofRamp: 'roofTeal', posts: true, door: { x: 48, style: 'wood', ramp: 'wood' },
  windows: [{ x: 8, y: 50, w: 34, h: 32, shop: true }, { x: 84, y: 50, w: 34, h: 32, shop: true }], noren: [{ x: 42, w: 36, y: 52, ramp: 'ribbon' }], signs: [{ text: 'Manju', y: 34, ramp: 'ribbon', light: true, ink: 'ribbon', inkI: 0 }] });
// steaming vent grate and the village's smaller props
P('yk_vent', 32, 26, (R, M) => {
  R.e(16, 16, 14, 7, M.stone[1]); R.e(16, 14, 12, 5, M.stone[3]); R.e(16, 14, 9, 3, M.charcoal[1]); for (let i = 0; i < 5; i++) R(9 + i * 3, 11, 1, 6, M.metal[2]); R(6, 20, 20, 2, M.butter[1]);
});
D('yk_sulfur_stain', 40, 20, (R, M) => { R.e(20, 10, 18, 7, M.butter[2]); R.e(18, 8, 12, 4, M.butter[3]); });
P('yk_sled', 34, 18, (R, M) => { R(2, 4, 30, 8, M.coral[2]); R(2, 4, 30, 2, M.coral[3]); R(0, 12, 34, 2, M.metal[2]); R(4, 14, 26, 1, M.metal[1]); R(2, 8, 4, 6, M.wood[2]); });
P('yk_cat_house', 62, 48, (R, M, se) => {
  R(4, 18, 54, 28, M.wood[2]); R(4, 18, 54, 3, M.wood[3]); R.t([0, 20], [62, 20], [31, 2], M.roofRed[2]); R(0, 18, 62, 3, M.roofRed[1]); R(22, 28, 18, 18, M.ink[1]); R(24, 30, 14, 16, M.butter[3]);
  R.e(31, 36, 4, 4, M.coral[3]); R(8, 28, 10, 8, M.sky[4]); R(10, 24, 6, 4, M.coral[2]);
  if (se === 'winter') R.t([2, 20], [60, 20], [31, 5], M.snow[4]);
}, { seasonal: true });
P('yk_footbath_bench', 52, 30, (R, M) => { R(2, 8, 48, 7, M.wood[3]); R(2, 8, 48, 2, M.wood[4]); R(5, 15, 4, 12, M.wood[1]); R(43, 15, 4, 12, M.wood[1]); R(2, 2, 48, 6, M.wood[2]); });
P('yk_towel_rack', 48, 40, (R, M) => { R(2, 6, 4, 32, M.wood[2]); R(42, 6, 4, 32, M.wood[2]); R(1, 4, 46, 3, M.wood[3]); for (const [x, c] of [[8, 'sky'], [20, 'paper'], [32, 'coral']]) { R(x, 7, 10, 20, M[c][3]); R(x, 7, 10, 2, M[c][4]); R(x, 25, 10, 2, M[c][2]); } });
// onsen_bath interior: pools, washing stations, lockers, poster
D('yk_pool_in', 128, 96, (R, M) => {
  R(0, 0, 128, 96, M.stone[1]); R(2, 2, 124, 92, M.stone[2]); R(8, 8, 112, 80, M.water[2]); R(8, 8, 112, 4, M.water[1]); R(14, 14, 100, 68, M.water[3]); R(24, 22, 40, 6, M.water[4]); R(70, 52, 30, 4, M.water[4]);
  for (let i = 0; i < 14; i++) R(4 + i * 9, 0, 6, 3, M.stone[3]);
});
D('yk_pool_out', 160, 96, (R, M) => {
  R.e(80, 48, 78, 46, M.stone[1]); R.e(80, 48, 73, 41, M.stone[3]); R.e(80, 48, 68, 36, M.water[2]); R.e(78, 46, 56, 28, M.water[3]); R.e(60, 36, 22, 8, M.water[4]); R.e(106, 62, 14, 4, M.water[4]);
  for (const [x, y] of [[12, 40], [28, 12], [60, 4], [118, 6], [146, 36], [144, 66], [100, 90], [38, 84]]) R.e(x, y, 8, 6, M.stone[3]);
});
P('yk_wash', 32, 34, (R, M) => { R(6, 18, 20, 4, M.wood[3]); R(8, 22, 3, 8, M.wood[1]); R(21, 22, 3, 8, M.wood[1]); R(3, 4, 4, 22, M.metal[2]); R(3, 4, 11, 3, M.metal[3]); R(12, 7, 2, 4, M.sky[3]); R.e(23, 15, 5, 3, M.butter[3]); R(18, 15, 10, 4, M.butter[3]); });
P('yk_locker', 62, 56, (R, M) => { R(2, 2, 58, 52, M.woodDark[2]); R(2, 2, 58, 2, M.woodDark[3]); for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { const x = 5 + i * 14, y = 6 + j * 24; R(x, y, 12, 20, M.wood[3]); R(x, y, 12, 2, M.wood[4]); R(x + 8, y + 9, 2, 3, M.butter[2]); } });
P('yk_poster', 26, 42, (R, M) => { R(3, 4, 20, 30, M.paper[4]); R(3, 4, 20, 3, M.sky[3]); R.e(13, 15, 4, 3, M.water[3]); for (let i = 0; i < 4; i++) R(6, 22 + i * 3, 14 - (i % 2) * 4, 1, M.ink[3]); R(11, 34, 4, 6, M.wood[2]); });
P('yk_noren_bath', 62, 40, (R, M) => { R(2, 2, 58, 3, M.woodDark[2]); for (let i = 0; i < 3; i++) { R(6 + i * 18, 5, 16, 28, i === 1 ? M.ribbon[2] : M.navy[2]); R(6 + i * 18, 5, 16, 2, M.paper[4]); R(12 + i * 18, 14, 4, 4, M.paper[4]); R(6 + i * 18, 32, 16, 2, i === 1 ? M.ribbon[1] : M.navy[1]); } });
P('yk_fruitmilk', 30, 50, (R, M) => { R(2, 2, 26, 46, M.sky[3]); R(2, 2, 26, 3, M.sky[4]); R(4, 8, 22, 18, M.paper[4]); for (let i = 0; i < 4; i++) R(6 + i * 5, 11, 3, 10, [M.coral[2], M.butter[2], M.mint[2], M.lilac[2]][i]); R(4, 30, 22, 8, M.charcoal[1]); R(6, 41, 18, 4, M.sky[1]); });
P('yk_lantern_post', 18, 56, (R, M, se) => { R(7, 14, 4, 40, M.wood[2]); R(7, 14, 1, 40, M.wood[3]); R(2, 4, 14, 14, M.vermilion[2]); R(2, 4, 14, 2, M.vermilion[3]); R(6, 8, 6, 6, M.butter[4]); R(2, 16, 14, 2, M.vermilion[1]); if (se === 'winter') R(2, 2, 14, 3, M.snow[4]); }, { seasonal: true });
// ------------------------------------------------------------------ animals: _i0 _i1 idle, _w0 _w1 walk; cat also _s0 sleeping
function cow(R, f, walk) {
  const dy = f && !walk ? 2 : 0, s = walk ? f : 0;
  R.e(18, 16, 15, 9, '#fffaf0'); R.e(14, 16, 6, 4, INK); R.e(24, 14, 5, 3, INK); R(6, 18, 24, 2, '#e8dccc');
  R.e(34, 10 + dy, 6, 6, '#fffaf0'); R.e(37, 14 + dy, 5, 3, '#f0b8c0'); R(32, 4 + dy, 2, 3, '#f0e0a0'); R(40, 4 + dy, 2, 3, '#f0e0a0'); R(36, 8 + dy, 1, 1, INK); R(30, 6 + dy, 3, 2, INK);
  R(31, 22, 6, 3, '#f0b8c0');
  for (const x of [8, 12, 24, 28]) R(x + (walk && x > 14 ? s : 0), 24, 3, 6, '#e8dccc');
  R(1, 14, 2, 8, INK);
}
function sheep(R, f, walk) {
  const dy = f && !walk ? 1 : 0, s = walk ? f : 0;
  for (const [x, y, r] of [[10, 11, 7], [18, 9, 7], [24, 12, 6], [14, 14, 7], [20, 14, 6]]) R.e(x, y, r, r - 1, '#f4efe6');
  R.e(12, 8, 5, 3, '#fffaf0'); R.e(27, 11 + dy, 4, 4, '#4a3a38'); R(30, 12 + dy, 2, 1, '#4a3a38'); R(25, 9 + dy, 2, 2, '#4a3a38'); R(28, 10 + dy, 1, 1, '#fff');
  for (const x of [9, 13, 21, 25]) R(x + (walk && x > 14 ? s : 0), 19, 2, 5, '#4a3a38');
}
function horse(R, f, walk) {
  const dy = f && !walk ? 2 : 0, s = walk ? f : 0, B = '#8f5a3a', D2 = '#6a3f28';
  R.e(18, 17, 15, 8, B); R.e(16, 20, 12, 3, D2); R(30, 2 + dy, 6, 14, B); R.e(35, 4 + dy, 6, 4, B); R(40, 5 + dy, 3, 5, '#e8c8a8'); R(34, 0 + dy, 2, 3, B); R(37, 4 + dy, 1, 1, INK);
  R(28, 2 + dy, 3, 12, '#2a1a22'); R(1, 12, 3, 14, '#2a1a22'); R(0, 26, 3, 2, '#2a1a22');
  for (const x of [8, 13, 24, 29]) { R(x + (walk && x > 14 ? s : 0), 24, 3, 9, D2); R(x + (walk && x > 14 ? s : 0), 32, 3, 2, INK); }
}
function cat(R, f, walk, sleep, c, c2) {
  if (sleep) { R.e(11, 10, 9, 4, c); R.e(14, 9, 5, 3, c2); R(18, 8, 3, 2, c); R(18, 7, 1, 1, c); R(21, 8, 1, 1, INK); R(2, 12, 6, 2, c); return; }
  const dy = f && !walk ? 1 : 0;
  R.e(10, 10, 8, 4, c); R.e(7, 11, 5, 2, c2); R.e(17, 6 + dy, 4, 4, c); R(14, 1 + dy, 2, 3, c); R(19, 1 + dy, 2, 3, c); R(18, 5 + dy, 1, 1, INK); R(21, 7 + dy, 1, 1, '#f08090');
  R(1, 7 - f, 3, 2, c); R(3, 9, 2, 3, c); for (const x of [6, 9, 13, 15]) R(x + (walk && x > 9 ? f : 0), 13, 2, 3, c2);
}
function monkey(R, f, walk) {
  const dy = f && !walk ? 1 : 0, B = '#9a8a7a', FC = '#e08070';
  R.e(10, 12, 7, 6, B); R.e(10, 14, 4, 3, '#b8a898'); R.e(17, 7 + dy, 5, 5, B); R.e(18, 8 + dy, 3, 3, FC); R(19, 7 + dy, 1, 1, INK); R.e(13, 6 + dy, 2, 2, B);
  R(2, 9 - f, 2, 8, B); R(3, 8 - f, 3, 2, B); for (const x of [7, 12]) R(x + (walk ? f : 0), 17, 2, 4, B);
}
const SPEC = [['cow', cow, 46, 32], ['sheep', sheep, 34, 26], ['horse', horse, 48, 36]];
for (const [k, fn, w, h] of SPEC) for (const [tag, f, walk] of [['i0', 0, false], ['i1', 1, false], ['w0', 0, true], ['w1', 1, true]]) A(`ml_${k}_${tag}`, w, h, (R) => fn(R, f, walk));
// monkeys use the tk_ prefix for their sprites
for (const tag of ['i0', 'i1', 'w0', 'w1']) A(`tk_monkey_${tag}`, 26, 24, (R) => monkey(R, tag.endsWith('1') ? 1 : 0, tag[0] === 'w'));
[['0', '#f0a050', '#d08030'], ['1', '#4a4450', '#34303a'], ['2', '#f0e8dc', '#d8ccbc']].forEach(([k, c, c2]) => {
  for (const [tag, f, walk] of [['i0', 0, false], ['i1', 1, false], ['w0', 0, true], ['w1', 1, true]]) A(`yk_cat${k}_${tag}`, 24, 18, (R) => cat(R, f, walk, false, c, c2));
  A(`yk_cat${k}_s0`, 24, 16, (R) => cat(R, 0, false, true, c, c2));
});
// ------------------------------------------------------------------ Meadow Hills
P('ml_trough', 62, 26, (R, M) => { R(2, 6, 58, 16, M.wood[2]); R(2, 6, 58, 3, M.wood[4]); R(4, 9, 54, 8, M.water[3]); R(4, 9, 54, 2, M.water[4]); R(4, 22, 4, 3, M.wood[1]); R(54, 22, 4, 3, M.wood[1]); });
P('ml_hayroll', 36, 34, (R, M) => { R.e(18, 18, 15, 14, M.butter[2]); R.e(18, 18, 11, 10, M.butter[3]); R.e(18, 18, 6, 6, M.butter[2]); R.e(16, 14, 3, 3, M.butter[4]); });
P('ml_silo', 42, 118, (R, M) => { R(4, 22, 34, 94, M.paper[3]); R(4, 22, 6, 94, M.paper[4]); R(32, 22, 6, 94, M.paper[2]); for (let y = 30; y < 114; y += 14) R(4, y, 34, 1, M.stone[2]); R.e(21, 22, 17, 12, M.metal[2]); R.e(19, 20, 11, 8, M.metal[3]); R(17, 70, 8, 22, M.woodDark[2]); });
for (let f = 0; f < 4; f++) P(`ml_windmill_${f}`, 128, 196, (R, M) => {
  R.t([32, 186], [96, 186], [74, 60], M.paper[2]); R.t([32, 186], [64, 186], [64, 60], M.paper[3]); R.t([74, 60], [54, 60], [64, 60], M.paper[3]); R(30, 184, 68, 6, M.stone[2]);
  R(54, 150, 20, 34, M.woodDark[2]); R(56, 152, 16, 32, M.butter[3]); R(40, 100, 12, 14, M.sky[3]); R(76, 100, 12, 14, M.sky[3]);
  R.t([36, 64], [92, 64], [64, 28], M.roofRed[2]); R.t([36, 64], [64, 64], [64, 30], M.roofRed[3]); R(36, 62, 56, 4, M.roofRed[1]);
  const a0 = (f * Math.PI) / 8; // blades turn a quarter step per frame
  for (let b = 0; b < 4; b++) {
    const a = a0 + (b * Math.PI) / 2, dx = Math.cos(a), dy = Math.sin(a);
    for (let r = 6; r < 60; r++) { const x = Math.round(64 + dx * r), y = Math.round(50 + dy * r); R(x - 1, y, 3, 2, M.wood[2]); if (r > 20) for (let k = -3; k <= 3; k++) { const px = Math.round(x - dy * k * 1), py = Math.round(y + dx * k * 1); R(px, py, 2, 2, k === 3 ? M.wood[4] : M.paper[3]); } }
  }
  R.e(64, 50, 6, 6, M.metal[2]);
});
D('ml_wheat', 32, 32, (R, M, se) => {
  const c = se === 'spring' ? M.grass[2] : se === 'summer' ? M.butter[2] : se === 'autumn' ? M.butter[3] : M.dirt[2];
  R(0, 0, 32, 32, se === 'winter' ? M.snow[3] : M.dirt[2]);
  if (se !== 'winter') for (let x = 1; x < 32; x += 3) for (let y = 2; y < 30; y += 6) { R(x, y, 1, 7, c); R(x, y, 1, 2, se === 'summer' || se === 'autumn' ? M.butter[4] : M.grass[3]); }
  else for (let x = 2; x < 32; x += 5) R(x, 12, 1, 5, M.dirt[3]);
}, { seasonal: true });
D('ml_dance_floor', 160, 96, (R, M) => { for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) R(i * 32, j * 32, 32, 32, (i + j) % 2 ? M.wood[3] : M.wood[2]); for (let i = 0; i <= 5; i++) R(i * 32 - (i === 5 ? 1 : 0), 0, 1, 96, M.wood[1]); });
D('ml_dock', 32, 32, (R, M) => { R(0, 0, 32, 32, M.wood[2]); for (let x = 0; x < 32; x += 8) { R(x, 0, 1, 32, M.wood[1]); R(x + 1, 0, 1, 32, M.wood[3]); } for (const [x, y] of [[3, 4], [27, 4], [3, 26], [27, 26]]) R(x, y, 2, 2, M.metal[2]); });
D('ml_lily', 28, 16, (R, M) => { R.e(8, 8, 6, 3, M.leaf[2]); R.e(7, 7, 4, 2, M.leaf[3]); R.e(20, 9, 5, 3, M.leaf[2]); R(19, 6, 3, 2, M.sakura[3]); R(8, 5, 2, 2, M.paper[4]); });
P('ml_reeds', 30, 44, (R, M) => { for (let i = 0; i < 9; i++) { const x = 3 + i * 3; R(x, 8 + (i * 5) % 12, 1, 34 - (i * 5) % 12, i % 2 ? M.leaf[2] : M.leaf[3]); if (i % 3 === 0) R(x - 1, 4 + (i * 3) % 6, 3, 8, M.wood[2]); } });
P('ml_hottub', 62, 44, (R, M) => { R.e(31, 22, 28, 18, M.wood[2]); R.e(31, 20, 25, 15, M.wood[3]); R.e(31, 19, 21, 12, M.water[3]); R.e(26, 16, 8, 4, M.water[4]); R(4, 24, 54, 14, M.wood[2]); R(4, 24, 6, 14, M.wood[3]); R(52, 24, 6, 14, M.wood[1]); R(4, 30, 54, 2, M.metal[1]); R(46, 34, 10, 8, M.stone[2]); });
P('ml_board', 38, 46, (R, M) => { R(4, 6, 30, 22, M.wood[3]); R(4, 6, 30, 2, M.wood[4]); R(7, 10, 24, 14, M.paper[4]); R(9, 12, 10, 1, M.ink[3]); R(9, 15, 16, 1, M.ink[3]); R(9, 18, 12, 1, M.ink[3]); R(8, 28, 3, 16, M.wood[1]); R(27, 28, 3, 16, M.wood[1]); });
P('ml_stall_milk', 66, 58, (R, M) => { R(2, 24, 62, 32, M.wood[2]); R(2, 24, 62, 3, M.wood[3]); for (let i = 0; i < 6; i++) R(i * 11 + 1, 2, 11, 22, i % 2 ? M.paper[4] : M.sky[3]); R(0, 22, 66, 3, M.woodDark[2]); for (let i = 0; i < 4; i++) { R(8 + i * 13, 32, 8, 14, M.paper[4]); R(10 + i * 13, 28, 4, 4, M.sky[3]); } });
P('ml_stall_bread', 66, 58, (R, M) => { R(2, 24, 62, 32, M.wood[2]); R(2, 24, 62, 3, M.wood[3]); for (let i = 0; i < 6; i++) R(i * 11 + 1, 2, 11, 22, i % 2 ? M.paper[4] : M.coral[2]); R(0, 22, 66, 3, M.woodDark[2]); for (let i = 0; i < 4; i++) R.e(14 + i * 13, 38, 6, 4, M.sand[3]); });
P('ml_stall_craft', 66, 58, (R, M) => { R(2, 24, 62, 32, M.wood[2]); R(2, 24, 62, 3, M.wood[3]); for (let i = 0; i < 6; i++) R(i * 11 + 1, 2, 11, 22, i % 2 ? M.paper[4] : M.forest[2]); R(0, 22, 66, 3, M.woodDark[2]); for (let i = 0; i < 4; i++) { R(8 + i * 13, 34, 9, 10, [M.coral, M.butter, M.lilac, M.mint][i][3]); R(10 + i * 13, 31, 5, 3, M.paper[4]); } });
P('ml_fruit_stand', 66, 56, (R, M) => { R(2, 22, 62, 32, M.wood[2]); R(2, 22, 62, 3, M.wood[3]); for (let i = 0; i < 6; i++) R(i * 11 + 1, 2, 11, 20, i % 2 ? M.paper[4] : M.ribbon[2]); R(0, 20, 66, 3, M.woodDark[2]); for (let i = 0; i < 4; i++) { R.e(14 + i * 13, 36, 6, 5, [M.ribbon, M.coral, M.hairGinger, M.butter][i][2]); R.e(12 + i * 13, 34, 2, 1, M.paper[4]); } });
P('ml_ranch_store', 130, 100, (R, M, se) => {
  R(4, 34, 122, 62, M.brick[3]); R(4, 34, 122, 3, M.brick[4]); R(4, 92, 122, 4, M.brick[1]); R.t([0, 36], [130, 36], [65, 4], M.roofSlate[2]); R.t([8, 35], [65, 35], [65, 8], M.roofSlate[3]); R(0, 34, 130, 3, M.roofSlate[1]);
  R(52, 52, 26, 44, M.woodDark[2]); R(54, 54, 22, 42, M.wood[3]); R(64, 54, 1, 42, M.woodDark[1]); R(54, 54, 22, 3, M.wood[4]);
  for (const x of [12, 90]) { R(x, 50, 28, 26, M.sky[4]); R(x, 50, 28, 2, M.paper[4]); R(x + 13, 50, 2, 26, M.paper[3]); R(x - 1, 76, 30, 3, M.wood[2]); }
  R(40, 38, 50, 10, M.paper[4]); R(44, 41, 42, 1, M.ribbon[2]); R(44, 44, 30, 1, M.ink[3]);
  if (se === 'winter') R.t([0, 36], [130, 36], [65, 10], M.snow[4]);
}, { seasonal: true });
facade('ml_boathouse', { w: 6, top: 6, roofH: 46, wallH: 70, wall: 'siding', wallRamp: 'wood', roof: 'tin', roofRamp: 'roofTeal', posts: true, door: { x: 80, style: 'double', ramp: 'woodDark' },
  windows: [{ x: 14, y: 18, curtain: 'sky' }, { x: 138, y: 18, curtain: 'sky' }], signs: [{ text: 'Boat house', y: 46, ramp: 'paper', light: true, ink: 'sky', inkI: 0 }] });
facade('ml_cabin', { w: 6, top: 6, roofH: 54, wallH: 70, wall: 'siding', wallRamp: 'woodDark', roof: 'kawara', roofRamp: 'roofRed', posts: true, chimney: 150, door: { x: 80, style: 'wood', ramp: 'wood' },
  windows: [{ x: 18, y: 14, curtain: 'butter', box: true }, { x: 130, y: 14, curtain: 'butter', box: true }], signs: [{ text: 'Cabin', y: 46, ramp: 'wood', light: true, ink: 'woodDark', inkI: 1 }] });
facade('tk_teastall', { w: 4, top: 6, roofH: 30, wallH: 64, wall: 'siding', wallRamp: 'wood', roof: 'tin', roofRamp: 'roofRed', posts: true, door: { x: 48, style: 'wood', ramp: 'woodDark' },
  windows: [{ x: 8, y: 30, w: 34, h: 28, shop: true }, { x: 84, y: 30, w: 34, h: 28, shop: true }], awnings: [{ x: 4, w: 120, y: 24, a: 'vermilion', b: 'paper' }], signs: [{ text: 'Tea stall', y: 16, ramp: 'paper', light: true, ink: 'vermilion', inkI: 0 }] });
facade('tk_hut', { w: 5, top: 6, roofH: 46, wallH: 66, wall: 'siding', wallRamp: 'woodDark', roof: 'tin', roofRamp: 'roofSlate', posts: true, chimney: 120, door: { x: 66, style: 'wood', ramp: 'wood' },
  windows: [{ x: 14, y: 12, curtain: 'forest' }, { x: 100, y: 12, curtain: 'forest' }], signs: [{ text: 'Tsukimi hut', y: 44, ramp: 'paper', light: true, ink: 'forest', inkI: 0 }] });
