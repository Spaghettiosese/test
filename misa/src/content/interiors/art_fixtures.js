// Fixture art for every interior (hd, 1 art px = 1 screen px, sizes from the ART.md scale chart).
// Light from the top-left: top faces [3]/[4], fronts [2], right edges and undersides [1].
import { S, D, C, block, panelDoor, drawerStack, grain, leg, books, foliage, pot, cushion, glint, hash } from './kit.js';

const W = C.wood, WD = C.woodDark, M = C.metal, P = C.paper;

// ---------------- home: kitchen ----------------
S('int_fridge', 28, 56, (R) => {
  block(R, 0, 0, 28, 56, 4, [M[1], M[2], M[3], M[4], '#ffffff']);
  R(1, 22, 26, 1, M[1]); R(1, 23, 26, 1, M[4]); R(22, 8, 2, 10, M[1]); R(22, 27, 2, 16, M[1]); R(22, 8, 1, 10, M[4]);
  R(5, 9, 5, 4, C.coral[2]); R(5, 9, 5, 1, C.coral[3]); R(12, 12, 4, 4, C.butter[2]); R(6, 28, 8, 10, P[4]); R(7, 30, 6, 1, C.sky[1]); R(7, 32, 5, 1, C.sky[1]); R(8, 26, 3, 2, C.mint[2]);
  glint(R, 3, 6); R(1, 53, 26, 3, M[0]);
});
const counterBody = (R, w, top = C.paper) => { block(R, 0, 6, w, 34, 7, [WD[1], W[1], W[2], W[3], W[4]]); R(0, 6, w, 6, top[3]); R(0, 6, w, 1, top[4]); R(0, 12, w, 2, top[1]); R(0, 38, w, 2, WD[0]); };
S('int_counter', 32, 40, (R) => { counterBody(R, 32); panelDoor(R, 3, 16, 12, 20, W, 'right'); panelDoor(R, 17, 16, 12, 20, W, 'left'); R(5, 2, 6, 5, C.mint[2]); R(5, 2, 6, 1, C.mint[3]); R(18, 0, 3, 7, C.butter[2]); R(22, 1, 4, 6, C.coral[2]); R(22, 1, 4, 1, C.coral[3]); });
S('int_sink', 64, 40, (R) => {
  counterBody(R, 64); R(14, 7, 34, 6, M[1]); R(15, 8, 32, 4, M[2]); R(15, 8, 32, 1, M[0]); R(30, 0, 3, 8, M[2]); R(30, 0, 8, 2, M[3]); R(36, 2, 2, 2, M[1]);
  panelDoor(R, 3, 16, 18, 20, W, 'right'); panelDoor(R, 23, 16, 18, 20, W, 'left'); panelDoor(R, 43, 16, 18, 20, W, 'left');
  R(52, 2, 8, 6, C.sky[3]); R(53, 3, 6, 1, '#ffffff'); R(4, 3, 7, 4, C.sakura[3]);
});
S('int_stove', 32, 40, (R) => {
  block(R, 0, 6, 32, 34, 7, [M[0], M[1], M[2], M[3], M[4]]); R(2, 8, 12, 3, C.charcoal[1]); R(18, 8, 12, 3, C.charcoal[1]); R(4, 9, 8, 1, C.charcoal[3]); R(20, 9, 8, 1, C.charcoal[3]);
  R(4, 18, 24, 16, C.charcoal[1]); R(5, 19, 22, 14, C.charcoal[2]); R(6, 20, 20, 2, C.charcoal[3]); R(5, 15, 22, 1, M[1]); for (let i = 0; i < 4; i++) R(5 + i * 6, 13, 3, 2, C.coral[2]);
  R(19, 0, 10, 7, C.coral[2]); R(19, 0, 10, 2, C.coral[3]); R(17, 2, 2, 3, C.coral[1]); R(23, -0, 2, 1, M[3]); R(1, 38, 30, 2, M[0]);
});
S('int_counter_long', 96, 40, (R) => {
  counterBody(R, 96, C.stone.slice(1)); for (let i = 0; i < 4; i++) panelDoor(R, 3 + i * 23, 16, 20, 20, W, i % 2 ? 'left' : 'right');
  R(4, 0, 30, 3, WD[2]); R(4, 0, 30, 1, WD[3]); [C.coral, C.butter, C.mint, C.lilac, C.sky, C.forest].forEach((r, i) => { R(6 + i * 5, -0, 3, 3, r[2]); });
  R(44, 3, 20, 4, W[3]); R(44, 3, 20, 1, W[4]); R(50, 4, 6, 2, C.leafAutumn[2]); R(70, 1, 8, 6, P[4]); R(72, 2, 4, 1, C.sky[2]); R(82, 0, 6, 7, C.forest[2]); R(83, 0, 4, 2, C.forest[3]);
});
S('int_table', 48, 40, (R) => {
  leg(R, 3, 18, 4, 22, WD); leg(R, 41, 18, 4, 22, WD); leg(R, 10, 18, 3, 18, WD); leg(R, 35, 18, 3, 18, WD);
  block(R, 0, 4, 48, 18, 12, [WD[1], W[1], W[2], W[3], W[4]]); grain(R, 1, 5, 46, 10, W, 7);
  R(10, 6, 28, 8, C.coral[3]); R(10, 6, 28, 1, C.coral[4]); for (let i = 12; i < 38; i += 4) R(i, 8, 2, 2, P[4]); R(10, 14, 28, 3, C.coral[2]);
  R(18, 0, 10, 7, P[4]); R(19, 1, 8, 2, C.sky[3]); R(21, -0, 4, 1, P[3]); R(31, 2, 3, 5, C.butter[2]);
});
S('int_chair', 20, 28, (R) => { R(2, 0, 16, 14, W[2]); R(2, 0, 16, 2, W[3]); R(4, 3, 12, 9, W[1]); R(5, 4, 10, 7, W[3]); leg(R, 2, 18, 3, 10, WD); leg(R, 15, 18, 3, 10, WD); block(R, 0, 13, 20, 7, 4, [WD[1], W[1], W[2], W[3], W[4]]); R(3, 13, 14, 3, C.coral[3]); });
S('int_chair_back', 20, 28, (R) => { leg(R, 2, 18, 3, 10, WD); leg(R, 15, 18, 3, 10, WD); block(R, 0, 13, 20, 6, 3, [WD[1], W[1], W[2], W[3], W[4]]); R(2, 0, 16, 18, W[2]); R(2, 0, 16, 2, W[3]); R(4, 4, 12, 2, W[1]); R(4, 9, 12, 2, W[1]); R(17, 2, 1, 16, W[1]); });
const potPlant = (R, wilt) => { pot(R, 10, 30, 14, 11); if (wilt) { R(9, 10, 2, 10, C.grassAutumn[2]); R(4, 12, 6, 3, C.grassAutumn[3]); R(11, 11, 6, 3, C.grassAutumn[3]); R(2, 15, 4, 2, C.grassAutumn[1]); R(14, 14, 4, 3, C.grassAutumn[1]); } else { foliage(R, 10, 11, 8, 8, C.leaf, 4); R(9, 2, 3, 3, C.coral[3]); R(10, 3, 1, 1, C.butter[2]); R(14, 6, 2, 2, C.coral[3]); } };
S('int_pot_ok', 20, 30, (R) => potPlant(R, false));
S('int_pot_wilt', 20, 30, (R) => potPlant(R, true));
S('int_bowl', 20, 10, (R) => { R.e(10, 6, 9, 3, C.sky[1]); R.e(10, 5, 8, 3, C.sky[2]); R.e(10, 4, 6, 2, M[3]); R(5, 7, 10, 1, C.sky[1]); R(8, 8, 4, 1, C.coral[3]); });
S('int_bowl_full', 20, 10, (R) => { R.e(10, 6, 9, 3, C.sky[1]); R.e(10, 5, 8, 3, C.sky[2]); R.e(10, 3, 6, 3, W[1]); R.e(9, 2, 4, 2, W[2]); R(7, 1, 2, 1, W[3]); R(12, 2, 2, 1, W[3]); });
S('int_dishes', 24, 10, (R) => { R.e(7, 6, 6, 2, P[4]); R.e(7, 6, 4, 1, P[2]); R.e(9, 4, 6, 2, P[3]); R(6, 3, 2, 1, C.dirt[1]); R(16, 1, 5, 7, C.coral[2]); R(16, 1, 5, 1, C.coral[3]); R(17, 0, 3, 1, M[3]); R(11, 4, 2, 1, C.dirt[1]); });
// ---------------- home: bath / laundry ----------------
S('int_washer', 30, 40, (R) => {
  block(R, 0, 2, 30, 38, 6, [M[1], M[2], P[3], P[4], '#ffffff']); R(2, 3, 10, 3, M[2]); R(3, 4, 2, 1, C.coral[2]); R(7, 4, 2, 1, C.mint[2]); R(22, 3, 5, 3, C.charcoal[2]);
  R.e(15, 23, 10, 10, M[1]); R.e(15, 23, 9, 9, M[3]); R.e(15, 23, 7, 7, C.sky[1]); R.e(15, 24, 6, 6, C.sky[2]); R(11, 19, 4, 2, C.sky[4]); R(13, 26, 6, 3, C.coral[3]); R(1, 38, 28, 2, M[1]);
});
S('int_basket', 24, 20, (R) => { R(1, 6, 22, 14, W[2]); R(0, 5, 24, 3, W[3]); R(0, 5, 24, 1, W[4]); for (let x = 3; x < 22; x += 4) R(x, 8, 1, 11, W[1]); R(1, 13, 22, 1, W[1]); R(2, 18, 20, 2, W[1]); });
S('int_basket_full', 24, 20, (R) => { R(1, 6, 22, 14, W[2]); R(2, 0, 8, 7, C.sky[2]); R(2, 0, 8, 2, C.sky[3]); R(9, 1, 9, 6, C.coral[3]); R(9, 1, 9, 1, C.coral[4]); R(15, 2, 7, 5, C.butter[3]); R(0, 5, 24, 3, W[3]); for (let x = 3; x < 22; x += 4) R(x, 8, 1, 11, W[1]); R(1, 13, 22, 1, W[1]); R(2, 18, 20, 2, W[1]); });
const tub = (R, r) => { block(R, 0, 4, 64, 36, 8, r); R(4, 6, 56, 10, C.sky[2]); R(4, 6, 56, 2, C.sky[1]); R(8, 9, 10, 2, C.sky[4]); R(30, 11, 14, 1, C.sky[3]); R(52, 0, 4, 7, M[2]); R(52, 0, 8, 2, M[3]); R(2, 38, 60, 2, r[0]); R(14, 3, 6, 4, '#ffffff'); R(17, 1, 4, 3, '#ffffff'); };
S('int_tub', 64, 40, (R) => { tub(R, [C.sky[1], P[1], P[3], P[4], '#ffffff']); R(4, 26, 56, 1, P[2]); });
S('int_tub_hinoki', 64, 40, (R) => { tub(R, [WD[1], W[2], W[3], W[4], '#fff0c8']); for (let x = 6; x < 64; x += 8) R(x, 18, 1, 20, W[2]); R(0, 22, 64, 2, WD[2]); R(0, 34, 64, 2, WD[2]); });
S('int_vanity', 32, 48, (R) => { R(4, 0, 24, 20, M[2]); R(5, 1, 22, 18, C.sky[3]); R(6, 2, 6, 2, '#ffffff'); R(6, 4, 2, 2, '#ffffff'); R(5, 16, 22, 3, C.sky[4]); counterBody(R.at(0, 8), 32); R(10, 15, 12, 4, M[2]); R(15, 11, 2, 5, M[3]); panelDoor(R, 4, 26, 24, 16, W, 'top'); R(26, 13, 3, 4, C.mint[2]); });
S('int_towels', 24, 30, (R) => { R(0, 0, 24, 3, M[2]); R(0, 0, 24, 1, M[3]); R(2, 3, 9, 20, C.coral[3]); R(2, 3, 2, 20, C.coral[4]); R(10, 3, 1, 20, C.coral[2]); R(13, 3, 9, 26, C.mint[3]); R(13, 3, 2, 26, C.mint[4]); R(21, 3, 1, 26, C.mint[1]); R(13, 24, 9, 1, C.mint[1]); });
D('int_bathmat', 40, 22, (R) => { R(1, 0, 38, 22, C.mint[2]); R(0, 1, 40, 20, C.mint[2]); for (let y = 3; y < 20; y += 3) R(3, y, 34, 1, C.mint[3]); });
// ---------------- home: bedroom ----------------
S('int_bed', 40, 64, (R) => {
  block(R, 0, 0, 40, 64, 0, [WD[1], WD[1], WD[2], WD[3], WD[4]]); R(0, 0, 40, 10, WD[2]); R(0, 0, 40, 2, WD[3]); R(2, 2, 36, 6, W[3]);
  R(2, 10, 36, 50, P[4]); cushion(R, 6, 12, 28, 11, { 1: P[1], 2: P[3], 3: P[4], 4: '#ffffff' });
  R(2, 25, 36, 33, C.sky[2]); R(2, 25, 36, 3, C.sky[3]); R(2, 28, 36, 1, P[4]); for (let y = 32; y < 56; y += 8) for (let x = 5; x < 36; x += 8) { R(x + 2, y, 2, 1, C.sky[4]); R(x + 1, y + 1, 4, 1, C.sky[4]); R(x + 2, y + 2, 2, 1, C.sky[4]); }
  R(37, 28, 1, 30, C.sky[1]); R(2, 56, 36, 2, C.sky[1]); R(0, 58, 40, 6, WD[2]); R(0, 58, 40, 1, WD[3]); R(2, 62, 36, 2, WD[1]);
});
S('int_desk', 56, 44, (R) => {
  R(2, 16, 4, 28, WD[1]); block(R, 0, 12, 56, 10, 6, [WD[1], W[1], W[2], W[3], W[4]]); drawerStack(R, 36, 22, 18, 22, 3, W); leg(R, 2, 22, 3, 22, WD);
  R(6, 0, 18, 14, C.charcoal[2]); R(7, 1, 16, 10, C.sky[2]); R(8, 2, 6, 1, C.sky[4]); R(13, 14, 4, 2, C.charcoal[1]); R(28, 7, 10, 7, C.butter[2]); R(29, 8, 8, 1, P[4]); R(40, 4, 2, 10, M[2]); R(38, 2, 7, 3, C.coral[2]); R(46, 8, 5, 6, C.mint[2]); R(47, 6, 1, 3, C.coral[3]); R(49, 5, 1, 4, C.sky[3]);
});
S('int_wardrobe', 32, 60, (R) => { block(R, 0, 0, 32, 60, 4, [WD[1], W[1], W[2], W[3], W[4]]); panelDoor(R, 2, 6, 13, 46, W, 'right'); panelDoor(R, 17, 6, 13, 46, W, 'left'); R(2, 53, 28, 5, W[1]); leg(R, 2, 58, 3, 2, WD); leg(R, 27, 58, 3, 2, WD); R(4, 10, 9, 1, W[4]); });
S('int_mirror', 20, 48, (R) => { R(0, 0, 20, 44, WD[2]); R(0, 0, 20, 1, WD[3]); R(2, 2, 16, 38, C.sky[3]); R(2, 2, 16, 6, C.sky[4]); R(4, 10, 2, 8, '#ffffff'); R(6, 12, 1, 4, '#ffffff'); R(2, 30, 16, 10, C.sky[2]); R(4, 44, 3, 4, WD[1]); R(13, 44, 3, 4, WD[1]); });
S('int_cushion', 28, 18, (R) => { cushion(R, 0, 4, 28, 14, C.coral); R(12, 9, 4, 3, C.coral[1]); });
S('int_box', 32, 28, (R) => { block(R, 0, 6, 32, 22, 6, [W[0], W[1], W[2], W[3], W[4]]); R(2, 0, 28, 7, C.sand[3]); R(2, 0, 28, 1, C.sand[4]); R(14, 0, 4, 28, C.coral[2]); R(14, 0, 1, 28, C.coral[3]); R(4, 14, 8, 6, P[4]); R(5, 16, 6, 1, C.sky[1]); R(5, 18, 4, 1, C.sky[1]); R(22, 10, 5, 5, C.butter[2]); });
// ---------------- home: living room ----------------
S('int_sofa_back', 72, 44, (R) => {
  R(2, 0, 68, 26, C.coral[1]); R(4, 0, 64, 4, C.coral[2]); R(4, 1, 64, 1, C.coral[3]); cushion(R, 6, 4, 30, 20, C.coral); cushion(R, 36, 4, 30, 20, C.coral);
  R(0, 6, 8, 34, C.coral[2]); R(0, 6, 8, 2, C.coral[3]); R(64, 6, 8, 34, C.coral[1]); R(64, 6, 8, 2, C.coral[2]); R(6, 24, 60, 16, C.coral[1]); R(6, 24, 60, 2, C.coral[2]);
  R(14, 0, 9, 5, C.butter[2]); R(14, 0, 9, 1, C.butter[3]); leg(R, 4, 40, 4, 4, WD); leg(R, 64, 40, 4, 4, WD);
});
S('int_tv', 56, 44, (R) => {
  block(R, 0, 24, 56, 20, 4, [WD[1], W[1], W[2], W[3], W[4]]); panelDoor(R, 3, 30, 24, 12, W, 'top'); panelDoor(R, 29, 30, 24, 12, W, 'top');
  R(6, 0, 44, 24, C.charcoal[1]); R(7, 1, 42, 21, C.charcoal[2]); R(8, 2, 40, 19, C.navy[1]); R(9, 3, 8, 1, C.navy[3]); R(9, 4, 2, 2, C.navy[3]); R(25, 22, 6, 3, C.charcoal[1]); R(38, 20, 8, 1, C.coral[2]);
});
S('int_radio', 28, 30, (R) => { block(R, 0, 14, 28, 16, 3, [WD[1], W[1], W[2], W[3], W[4]]); R(2, 2, 24, 13, C.coral[2]); R(2, 2, 24, 2, C.coral[3]); R(4, 6, 12, 7, C.coral[1]); for (let y = 7; y < 13; y += 2) R(5, y, 10, 1, C.coral[3]); R.e(21, 9, 3, 3, P[3]); R(21, 7, 1, 2, C.charcoal[2]); R(20, 0, 1, 3, M[2]); });
S('int_bookshelf', 32, 64, (R) => {
  block(R, 0, 0, 32, 64, 3, [WD[0], WD[1], WD[2], WD[3], WD[4]]);
  for (let s = 0; s < 4; s++) { const y = 5 + s * 14; R(3, y, 26, 12, WD[0]); books(R, 3, y + 1, 26, 11, s + 11); R(2, y + 12, 28, 2, WD[3]); }
  R(2, 61, 28, 3, WD[1]);
});
S('int_lamp', 16, 48, (R) => { R(1, 0, 14, 12, C.butter[3]); R(0, 4, 16, 8, C.butter[2]); R(2, 1, 6, 2, C.butter[4]); R(0, 11, 16, 1, C.butter[1]); R(7, 12, 2, 32, WD[2]); R(7, 12, 1, 32, WD[3]); R.e(8, 45, 6, 2, WD[1]); });
S('int_nook', 64, 44, (R) => { block(R, 0, 18, 64, 26, 6, [WD[1], W[1], W[2], W[3], W[4]]); cushion(R, 2, 12, 60, 12, C.mint); cushion(R, 4, 2, 14, 14, C.butter); cushion(R, 46, 2, 14, 14, C.coral); books(R, 6, 30, 52, 10, 41); R(4, 40, 56, 2, WD[1]); });
// ---------------- home: entry / pets ----------------
S('int_shoes', 32, 36, (R) => { block(R, 0, 6, 32, 30, 5, [WD[1], W[1], W[2], W[3], W[4]]); panelDoor(R, 3, 13, 12, 20, W, 'right'); panelDoor(R, 17, 13, 12, 20, W, 'left'); R(4, 0, 8, 6, C.coral[2]); R(4, 4, 9, 2, P[4]); R(18, 1, 9, 5, C.sky[2]); R(18, 4, 10, 2, P[4]); });
S('int_maneki', 18, 24, (R) => { R.e(9, 17, 7, 6, P[4]); R.e(9, 8, 7, 6, P[4]); R.t([3, 5], [4, 0], [7, 3], P[4]); R.t([11, 3], [14, 0], [15, 5], P[4]); R(4, 2, 1, 2, C.coral[3]); R(13, 2, 1, 2, C.coral[3]); R(5, 8, 2, 1, C.ink[1]); R(11, 8, 2, 1, C.ink[1]); R(8, 11, 2, 1, C.coral[2]); R(3, 13, 12, 2, C.ribbon[2]); R(8, 15, 2, 2, C.butter[2]); R(14, 6, 3, 6, P[4]); R(14, 5, 3, 1, P[2]); R.e(9, 19, 4, 3, C.butter[2]); R(4, 22, 10, 2, P[2]); R(2, 10, 3, 3, C.coral[3]); });
S('int_pet_bed', 34, 18, (R) => { R.e(17, 11, 16, 7, C.lilac[1]); R.e(17, 10, 15, 6, C.lilac[2]); R.e(17, 11, 11, 4, C.lilac[4]); R.e(16, 10, 9, 3, P[4]); R(4, 6, 8, 2, C.lilac[3]); });
S('int_cat_tree', 32, 60, (R) => {
  R(13, 10, 6, 46, C.sand[2]); for (let y = 12; y < 54; y += 3) R(13, y, 6, 1, C.sand[1]); R(13, 10, 2, 46, C.sand[3]);
  block(R, 0, 54, 32, 6, 3, [WD[1], C.mint[1], C.mint[2], C.mint[3], C.mint[4]]); block(R, 2, 30, 20, 6, 3, [WD[1], C.mint[1], C.mint[2], C.mint[3], C.mint[4]]); block(R, 8, 4, 22, 8, 4, [WD[1], C.mint[1], C.mint[2], C.mint[3], C.mint[4]]);
  R(26, 12, 1, 8, C.sand[1]); R.e(26, 21, 2, 2, C.coral[3]);
});
S('int_toys', 26, 14, (R) => { R.e(5, 9, 4, 4, C.coral[2]); R(4, 7, 2, 1, C.coral[4]); R(3, 10, 5, 1, C.butter[2]); R(10, 10, 12, 3, C.mint[2]); R(21, 4, 1, 7, WD[2]); R(18, 2, 6, 3, C.lilac[3]); R(19, 1, 3, 1, C.lilac[4]); R.e(14, 6, 2, 2, C.sky[3]); });
S('int_ladder', 28, 64, (R) => { R(0, 0, 28, 6, WD[1]); R(2, 1, 24, 4, WD[0]); R(3, 4, 4, 60, W[2]); R(3, 4, 1, 60, W[3]); R(21, 4, 4, 60, W[1]); R(21, 4, 1, 60, W[2]); for (let y = 10; y < 62; y += 9) { R(7, y, 14, 3, W[3]); R(7, y + 2, 14, 1, W[1]); } });
D('int_rug_round', 64, 44, (R) => { R.e(32, 22, 31, 21, C.butter[1]); R.e(32, 22, 29, 19, C.butter[2]); R.e(32, 22, 22, 14, C.coral[3]); R.e(32, 22, 16, 10, C.butter[3]); R.e(32, 22, 8, 5, C.coral[3]); });
D('int_rug_long', 96, 44, (R) => { R(0, 2, 96, 40, C.navy[2]); R(2, 4, 92, 36, P[3]); R(5, 7, 86, 30, C.sky[2]); for (let i = 0; i < 12; i++) R(10 + i * 7, 12, 3, 20, i % 2 ? P[3] : C.coral[3]); for (let x = 2; x < 94; x += 3) { R(x, 0, 1, 2, P[2]); R(x, 42, 1, 2, P[2]); } });
D('int_genkan', 64, 30, (R) => { R(0, 0, 64, 30, C.stone[3]); for (let i = 0; i < 64; i += 16) { R(i, 0, 1, 30, C.stone[2]); } R(0, 14, 64, 1, C.stone[2]); R(0, 0, 64, 2, C.stone[4]); });
// ---------------- attic ----------------
S('int_trunk', 44, 32, (R) => { R(0, 6, 44, 26, C.navy[1]); R.e(22, 7, 22, 6, C.navy[2]); R(0, 7, 44, 4, C.navy[2]); R(1, 4, 42, 2, C.navy[3]); R(0, 12, 44, 2, C.butter[1]); R(0, 12, 44, 1, C.butter[3]); [4, 20, 36].forEach((x) => { R(x, 2, 4, 30, C.butter[1]); R(x, 2, 1, 30, C.butter[3]); }); R(19, 14, 6, 7, C.butter[2]); R(21, 16, 2, 3, C.ink[1]); R(0, 30, 44, 2, C.navy[0]); });
S('int_board', 64, 44, (R) => {
  R(0, 0, 64, 44, WD[1]); R(2, 2, 60, 40, C.dirt[3]); for (let i = 0; i < 40; i++) R(2 + Math.floor(hash(i, 1, 2) * 60), 2 + Math.floor(hash(i, 2, 3) * 40), 1, 1, C.dirt[2]);
  [[5, 5, 14, 11, P[4]], [24, 4, 12, 14, C.butter[3]], [42, 6, 16, 10, P[3]], [8, 24, 16, 12, C.sky[4]], [32, 24, 12, 14, P[4]], [48, 22, 11, 15, C.sakura[4]]].forEach(([x, y, w, h, c], i) => { R(x, y, w, h, c); R(x + 1, y + 3, w - 3, 1, C.ink[3]); R(x + 1, y + 5, w - 5, 1, C.ink[3]); R(x + Math.floor(w / 2), y - 1, 2, 2, [C.ribbon[2], C.sky[1], C.butter[1]][i % 3]); });
  R(12, 10, 20, 1, C.ribbon[2]); R(32, 14, 18, 1, C.ribbon[2]); R(16, 18, 1, 8, C.ribbon[2]); R(38, 18, 14, 1, C.ribbon[2]); R(0, 42, 64, 2, WD[0]);
});
S('int_boxes', 36, 40, (R) => { block(R, 0, 16, 22, 24, 6, [C.sand[0], C.sand[1], C.sand[2], C.sand[3], C.sand[4]]); R(9, 16, 4, 24, C.sand[1]); block(R, 18, 22, 18, 18, 5, [C.sand[0], C.sand[1], C.sand[2], C.sand[3], C.sand[4]]); block(R, 4, 0, 18, 17, 5, [C.sand[0], C.sand[1], C.sand[3], C.sand[4], P[4]]); R(6, 8, 10, 4, P[4]); R(7, 9, 6, 1, C.ink[3]); });
S('int_dressform', 22, 46, (R) => { R.e(11, 10, 8, 9, C.coral[2]); R.e(9, 8, 4, 5, C.coral[3]); R(4, 14, 14, 10, C.coral[2]); R(5, 16, 3, 6, C.coral[3]); R(9, 0, 4, 3, WD[2]); R(10, 24, 2, 18, WD[2]); R(4, 42, 14, 4, WD[1]); R(4, 18, 14, 2, P[4]); });
S('int_attic_bed', 64, 40, (R) => { block(R, 0, 8, 64, 32, 6, [WD[1], W[1], W[2], W[3], W[4]]); R(2, 4, 60, 18, P[4]); cushion(R, 4, 2, 16, 12, { 1: P[1], 2: P[3], 3: P[4], 4: '#ffffff' }); R(20, 6, 42, 18, C.lilac[2]); R(20, 6, 42, 2, C.lilac[3]); for (let x = 24; x < 60; x += 8) R(x, 12, 2, 2, C.butter[3]); R(2, 38, 60, 2, WD[0]); });
S('int_skylight', 64, 30, (R) => { R(0, 0, 64, 30, WD[1]); R(2, 2, 60, 26, WD[2]); R(4, 4, 56, 22, C.navy[1]); R(31, 4, 2, 22, WD[2]); R(4, 14, 56, 2, WD[2]); R(8, 6, 1, 1, '#fffaf0'); R(20, 9, 1, 1, '#fffaf0'); R(44, 7, 1, 1, '#fffaf0'); R(52, 19, 1, 1, '#fffaf0'); R(14, 20, 1, 1, C.lilac[3]); R(40, 22, 2, 2, C.butter[3]); }, { outline: false });
S('int_scope', 28, 44, (R) => { R(13, 18, 2, 22, C.charcoal[2]); R(5, 38, 4, 4, C.charcoal[1]); R(19, 38, 4, 4, C.charcoal[1]); R(8, 34, 12, 2, C.charcoal[1]); R(4, 2, 22, 7, C.navy[2]); R(4, 2, 22, 2, C.navy[3]); R(0, 3, 5, 5, C.butter[2]); R(24, 4, 4, 4, C.charcoal[2]); R(12, 9, 4, 10, C.charcoal[1]); });

// ---------------- cafe ----------------
S('int_cafe_counter', 64, 44, (R) => { block(R, 0, 8, 64, 36, 8, [WD[0], WD[1], WD[2], WD[3], WD[4]]); R(0, 8, 64, 6, C.stone[4]); R(0, 8, 64, 1, C.stone[5]); for (let x = 3; x < 62; x += 6) R(x, 17, 4, 25, WD[3]); R(2, 3, 10, 6, P[4]); R(3, 4, 8, 1, C.coral[2]); R(40, 0, 10, 9, C.mint[3]); R(42, 0, 6, 2, C.mint[4]); R(52, 4, 8, 5, C.butter[2]); });
S('int_espresso', 32, 44, (R) => { block(R, 0, 14, 32, 30, 6, [WD[0], WD[1], WD[2], WD[3], WD[4]]); R(0, 14, 32, 5, C.stone[4]); R(3, 0, 26, 15, M[2]); R(3, 0, 26, 3, M[3]); R(4, 1, 24, 1, M[4]); R(6, 5, 6, 3, C.charcoal[2]); R(20, 5, 6, 3, C.charcoal[2]); R(8, 8, 2, 4, C.charcoal[1]); R(22, 8, 2, 4, C.charcoal[1]); R(8, 12, 4, 3, P[4]); R(14, 3, 4, 2, C.coral[2]); for (let i = 0; i < 3; i++) R(5 + i * 9, 22, 6, 18, WD[3]); });
S('int_pastry_case', 64, 44, (R) => {
  block(R, 0, 4, 64, 40, 4, [WD[0], WD[1], WD[2], WD[3], WD[4]]); R(2, 6, 60, 24, C.sky[4]); R(2, 6, 60, 2, '#ffffff'); R(2, 18, 60, 1, M[3]);
  for (let i = 0; i < 6; i++) { R.e(7 + i * 10, 15, 4, 3, [C.butter[2], C.coral[3], C.wood[3], C.sakura[3], C.butter[3], C.leafAutumn[3]][i]); R(5 + i * 10, 13, 3, 1, P[4]); R.e(7 + i * 10, 26, 4, 2, [C.wood[2], C.sakura[2], C.butter[2], C.coral[2], C.mint[3], C.wood[3]][i]); }
  glint(R, 4, 8); glint(R, 34, 8); R(2, 32, 60, 10, WD[3]); R(2, 32, 60, 1, WD[4]);
});
S('int_cafe_table', 36, 34, (R) => { R(16, 14, 4, 18, C.charcoal[2]); R(10, 31, 16, 3, C.charcoal[1]); R.e(18, 8, 17, 7, WD[2]); R.e(18, 7, 16, 6, W[3]); R.e(15, 5, 8, 2, W[4]); R(12, 3, 6, 5, P[4]); R(13, 4, 4, 1, C.wood[1]); R(22, 2, 3, 6, C.mint[2]); R(22, 1, 3, 2, C.mint[3]); });
S('int_cafe_chair', 20, 28, (R) => { R(3, 0, 14, 12, C.charcoal[2]); R(4, 1, 12, 2, C.charcoal[3]); R(4, 4, 12, 1, C.charcoal[1]); R(4, 8, 12, 1, C.charcoal[1]); R(3, 18, 2, 10, C.charcoal[1]); R(15, 18, 2, 10, C.charcoal[1]); block(R, 1, 12, 18, 7, 4, [C.coral[0], C.coral[1], C.coral[2], C.coral[3], C.coral[4]]); });
S('int_menu_board', 52, 40, (R) => { R(0, 0, 52, 40, WD[2]); R(0, 0, 52, 1, WD[3]); R(3, 3, 46, 34, C.chalkboard[1]); R(6, 6, 22, 2, C.chalkboard[4]); for (let y = 12; y < 34; y += 5) { R(6, y, 16 + (y % 3) * 4, 1, C.chalkboard[3]); R(38, y, 7, 1, C.butter[3]); } R(36, 5, 8, 6, C.coral[3]); R(39, 3, 2, 2, C.chalkboard[4]); });
S('int_mic', 16, 44, (R) => { R(7, 8, 2, 32, C.charcoal[2]); R(2, 40, 12, 4, C.charcoal[1]); R(5, 0, 6, 9, C.charcoal[3]); R(6, 1, 2, 3, M[4]); R(4, 8, 8, 2, C.charcoal[1]); });
S('int_speaker', 24, 36, (R) => { block(R, 0, 0, 24, 36, 3, [C.charcoal[0], C.charcoal[1], C.charcoal[2], C.charcoal[3], C.charcoal[4]]); R.e(12, 12, 6, 6, C.charcoal[1]); R.e(12, 12, 3, 3, C.charcoal[3]); R.e(12, 27, 4, 4, C.charcoal[1]); });
S('int_sugar_jar', 14, 18, (R) => { R(2, 4, 10, 14, C.sky[4]); R(2, 4, 2, 14, '#ffffff'); R(1, 2, 12, 3, C.coral[2]); R(5, 0, 4, 2, C.coral[3]); R(3, 10, 8, 7, P[4]); }, {});
// ---------------- mart ----------------
const GOODS = {
  snacks: (R, x, y, w, s) => { for (let i = 0; i < w - 4; i += 6) { const r = [C.coral, C.butter, C.sky, C.mint, C.lilac][Math.floor(hash(i, s, 1) * 5)]; R(x + i, y + 2, 5, 9, r[2]); R(x + i, y + 2, 5, 2, r[3]); R(x + i + 1, y + 6, 3, 2, P[4]); } },
  produce: (R, x, y, w, s) => { for (let i = 0; i < w - 4; i += 5) { const r = [C.coral, C.forest, C.butter, C.leafAutumn][Math.floor(hash(i, s, 2) * 4)]; R.e(x + i + 2, y + 8, 2, 2, r[2]); R(x + i + 1, y + 7, 1, 1, r[3]); R.e(x + i + 4, y + 9, 2, 2, r[2]); } R(x, y + 10, w, 2, W[1]); },
  drinks: (R, x, y, w, s) => { for (let i = 0; i < w - 2; i += 4) { const r = [C.sky, C.coral, C.mint, C.butter][Math.floor(hash(i, s, 3) * 4)]; R(x + i, y + 3, 3, 9, r[2]); R(x + i + 1, y + 1, 1, 2, r[3]); R(x + i, y + 6, 3, 2, P[4]); } },
  seeds: (R, x, y, w, s) => { for (let i = 0; i < w - 5; i += 7) { const r = [C.forest, C.coral, C.butter, C.lilac][Math.floor(hash(i, s, 4) * 4)]; R(x + i, y + 3, 6, 9, P[4]); R(x + i + 1, y + 6, 4, 4, r[2]); R(x + i, y + 3, 6, 2, r[3]); } },
  home: (R, x, y, w, s) => { for (let i = 0; i < w - 6; i += 8) { const r = [C.sky, C.lilac, C.mint, C.sand][Math.floor(hash(i, s, 5) * 4)]; R(x + i, y + 4, 7, 8, r[2]); R(x + i, y + 4, 7, 1, r[4]); R(x + i + 2, y + 1, 3, 3, r[3]); } },
};
for (const [k, fill] of Object.entries(GOODS)) S(`int_shelf_${k}`, 64, 56, (R) => {
  const fr = k === 'drinks' ? [M[0], M[1], M[2], M[3], M[4]] : [C.mint[0], C.mint[1], C.mint[2], C.mint[3], C.mint[4]];
  block(R, 0, 0, 64, 56, 3, fr); if (k === 'drinks') R(2, 4, 60, 44, C.sky[3]);
  for (let s = 0; s < 4; s++) { const y = 4 + s * 12; if (k !== 'drinks') R(3, y, 58, 11, fr[1]); fill(R, 4, y, 56, s + k.length); R(2, y + 11, 60, 1, fr[3]); R(4, y + 11, 6, 1, C.butter[2]); }
  if (k === 'drinks') { glint(R, 4, 6); R(31, 4, 2, 44, M[2]); }
  R(2, 52, 60, 4, fr[1]);
});
S('int_register', 64, 44, (R) => { block(R, 0, 10, 64, 34, 8, [C.mint[0], C.mint[1], C.mint[2], C.mint[3], C.mint[4]]); R(0, 10, 64, 6, P[3]); R(4, 0, 18, 12, C.charcoal[2]); R(5, 1, 16, 5, C.mint[4]); R(6, 2, 8, 1, C.charcoal[2]); for (let i = 0; i < 3; i++) R(6 + i * 5, 8, 3, 2, P[3]); R(30, 4, 20, 8, C.butter[2]); R(31, 5, 18, 1, C.butter[3]); R(52, 6, 8, 6, C.coral[3]); R(4, 22, 56, 10, C.mint[1]); R(10, 25, 44, 4, P[4]); R(12, 26, 24, 2, C.coral[2]); });
S('int_gacha', 26, 48, (R) => { R(1, 0, 24, 26, C.coral[2]); R(1, 0, 24, 3, C.coral[3]); R(3, 3, 20, 20, C.sky[4]); for (let i = 0; i < 9; i++) R.e(6 + (i % 3) * 7, 8 + Math.floor(i / 3) * 6, 2, 2, [C.butter[2], C.mint[2], C.lilac[2], C.coral[3]][i % 4]); block(R, 0, 26, 26, 22, 3, [C.coral[0], C.coral[1], C.coral[2], C.coral[3], C.coral[4]]); R.e(13, 34, 4, 4, M[3]); R(12, 31, 2, 6, M[1]); R(8, 41, 10, 4, C.charcoal[1]); });
S('int_arcade', 34, 60, (R) => { block(R, 0, 0, 34, 60, 4, [C.navy[0], C.navy[1], C.navy[2], C.navy[3], C.navy[4]]); R(2, 4, 30, 6, C.lilac[2]); R(5, 6, 24, 2, C.butter[3]); R(4, 12, 26, 20, C.charcoal[1]); R(6, 14, 22, 16, C.charcoal[2]); R(8, 22, 6, 4, C.mint[3]); R(18, 16, 4, 4, C.coral[3]); R(13, 18, 2, 2, C.butter[3]); R(2, 34, 30, 8, C.navy[3]); R(7, 35, 2, 4, C.charcoal[1]); R.e(8, 35, 2, 2, C.coral[2]); R.e(19, 37, 2, 1, C.butter[2]); R.e(25, 37, 2, 1, C.sky[3]); R(12, 46, 10, 6, C.charcoal[1]); R(15, 48, 4, 1, C.butter[2]); });
S('int_clothes_rack', 48, 48, (R) => { R(2, 2, 2, 44, M[2]); R(44, 2, 2, 44, M[2]); R(0, 2, 48, 2, M[3]); R(0, 44, 8, 3, M[1]); R(40, 44, 8, 3, M[1]); [C.coral, C.sky, C.butter, C.mint, C.lilac, C.navy].forEach((r, i) => { R(6 + i * 6, 4, 5, 22 + (i % 2) * 4, r[2]); R(6 + i * 6, 4, 1, 22, r[3]); R(10 + i * 6, 5, 1, 20, r[1]); }); });
// ---------------- library ----------------
S('int_stack', 64, 64, (R) => { block(R, 0, 0, 64, 64, 3, [WD[0], WD[1], WD[2], WD[3], WD[4]]); for (let s = 0; s < 4; s++) { const y = 5 + s * 14; R(3, y, 58, 12, WD[0]); books(R, 3, y + 1, 58, 11, s * 7 + 3); R(2, y + 12, 60, 2, WD[3]); } R(30, 4, 1, 56, WD[1]); R(2, 61, 60, 3, WD[1]); });
S('int_stack_ladder', 64, 64, (R) => { block(R, 0, 0, 64, 64, 3, [WD[0], WD[1], WD[2], WD[3], WD[4]]); for (let s = 0; s < 4; s++) { const y = 5 + s * 14; R(3, y, 58, 12, WD[0]); books(R, 3, y + 1, 58, 11, s * 5 + 31); R(2, y + 12, 60, 2, WD[3]); } R(40, 0, 3, 64, W[2]); R(52, 0, 3, 64, W[1]); for (let y = 6; y < 62; y += 8) R(43, y, 9, 2, W[3]); R(2, 61, 60, 3, WD[1]); });
S('int_reading_table', 64, 40, (R) => { leg(R, 3, 16, 4, 24, WD); leg(R, 57, 16, 4, 24, WD); block(R, 0, 8, 64, 12, 8, [WD[0], WD[1], WD[2], WD[3], WD[4]]); R(6, 10, 14, 6, P[4]); R(13, 10, 1, 6, P[2]); R(36, 9, 10, 5, C.coral[2]); R(36, 9, 10, 1, C.coral[3]);
  R(26, 0, 12, 5, C.forest[2]); R(26, 0, 12, 1, C.forest[3]); R(27, 5, 10, 1, C.butter[3]); R(31, 6, 2, 6, C.butter[1]); R(28, 12, 8, 2, C.butter[1]); });
S('int_lib_desk', 80, 44, (R) => { block(R, 0, 10, 80, 34, 8, [WD[0], WD[1], WD[2], WD[3], WD[4]]); for (let x = 4; x < 76; x += 18) panelDoor(R, x, 22, 16, 18, WD, 'none'); R(6, 4, 12, 7, C.charcoal[2]); R(7, 5, 10, 4, C.sky[2]); R(24, 6, 16, 4, P[4]); R(26, 3, 12, 3, C.coral[2]); R(48, 4, 6, 6, C.butter[2]); R(58, 2, 14, 8, C.sky[1]); R(58, 2, 14, 2, C.sky[2]); R(62, 6, 6, 1, P[4]); });
S('int_archive', 52, 52, (R) => { block(R, 0, 16, 52, 36, 4, [M[0], M[1], M[2], M[3], M[4]]); for (let y = 22; y < 50; y += 9) for (let x = 3; x < 49; x += 12) { panelDoor(R, x, y, 11, 8, [M[0], M[1], M[2], M[3]], 'none'); R(x + 3, y + 3, 5, 2, P[4]); } R(8, 0, 36, 18, C.charcoal[1]); R(10, 2, 32, 12, C.butter[4]); for (let y = 4; y < 13; y += 2) R(12, y, 20 + (y % 4) * 2, 1, C.ink[3]); R(24, 14, 4, 3, C.charcoal[2]); });
S('int_display', 52, 44, (R) => { block(R, 0, 22, 52, 22, 3, [WD[0], WD[1], WD[2], WD[3], WD[4]]); R(1, 2, 50, 21, C.sky[4]); R(1, 2, 50, 1, '#ffffff'); R(0, 0, 52, 3, WD[3]); R(8, 15, 8, 6, C.stone[3]); R(9, 14, 6, 2, C.stone[4]); R.e(26, 18, 5, 3, C.sakura[3]); R(24, 16, 2, 1, '#ffffff'); R(36, 12, 10, 9, C.butter[2]); R(38, 14, 6, 1, C.butter[4]); glint(R, 4, 5); glint(R, 30, 5); R(4, 28, 44, 1, WD[1]); R(10, 32, 32, 6, P[3]); });
S('int_newspapers', 28, 44, (R) => { R(12, 6, 3, 36, WD[2]); R(4, 40, 20, 4, WD[1]); R(2, 4, 24, 3, WD[3]); for (let i = 0; i < 3; i++) { R(3 + i * 7, 7, 6, 18, P[4]); R(3 + i * 7, 9, 6, 1, C.ink[3]); R(4 + i * 7, 12, 4, 4, C.stone[3]); R(4 + i * 7, 18, 4, 1, C.ink[3]); } });
// ---------------- post office ----------------
S('int_post_counter', 80, 44, (R) => { block(R, 0, 10, 80, 34, 8, [C.sky[0], C.sky[1], W[2], W[3], W[4]]); R(0, 10, 80, 6, P[3]); R(0, 18, 80, 3, C.coral[2]); for (let x = 4; x < 76; x += 18) panelDoor(R, x, 24, 16, 16, W, 'none'); R(6, 2, 14, 9, M[2]); R(6, 2, 14, 2, M[3]); R(8, 7, 10, 2, C.charcoal[2]); R(30, 4, 12, 7, C.sand[2]); R(30, 4, 12, 2, C.sand[3]); R(35, 4, 2, 7, C.coral[2]); R(52, 6, 10, 5, P[4]); R(54, 7, 3, 3, C.coral[2]); R(66, 3, 8, 8, C.butter[2]); R(68, 0, 4, 4, WD[2]); });
S('int_pigeonholes', 64, 56, (R) => { block(R, 0, 0, 64, 56, 3, [WD[0], WD[1], WD[2], WD[3], WD[4]]); for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) { const x = 3 + c * 10, y = 5 + r * 10; R(x, y, 9, 9, WD[0]); if (hash(c, r, 7) > 0.35) { R(x + 1, y + 3 + Math.floor(hash(c, r, 8) * 3), 7, 5, [P[4], C.sky[4], C.sakura[4], C.butter[4]][Math.floor(hash(c, r, 9) * 4)]); R(x + 2, y + 6, 2, 1, C.coral[2]); } } R(2, 54, 60, 2, WD[1]); });
S('int_parcels', 34, 32, (R) => { block(R, 0, 12, 20, 20, 5, [C.sand[0], C.sand[1], C.sand[2], C.sand[3], C.sand[4]]); R(9, 12, 3, 20, C.coral[2]); block(R, 16, 18, 18, 14, 4, [C.sand[0], C.sand[1], C.sand[3], C.sand[4], P[4]]); block(R, 3, 0, 14, 13, 4, [C.sand[0], C.sand[1], C.sand[2], C.sand[3], C.sand[4]]); R(6, 6, 8, 4, P[4]); R(20, 24, 8, 3, P[4]); });
S('int_bench', 48, 26, (R) => { leg(R, 3, 14, 4, 12, WD); leg(R, 41, 14, 4, 12, WD); R(0, 0, 48, 10, W[2]); R(0, 0, 48, 2, W[3]); R(0, 5, 48, 1, W[1]); block(R, 0, 9, 48, 7, 4, [WD[1], W[1], W[2], W[3], W[4]]); });
S('int_postbox', 22, 40, (R) => { R(2, 12, 18, 28, C.ribbon[2]); R.e(11, 10, 10, 6, C.ribbon[2]); R(2, 12, 2, 28, C.ribbon[3]); R(17, 12, 3, 28, C.ribbon[1]); R(6, 16, 10, 2, C.charcoal[1]); R(7, 22, 8, 6, P[4]); R(0, 38, 22, 2, C.ribbon[0]); R.e(9, 7, 4, 2, C.ribbon[4]); });
// ---------------- clock shop and tower ----------------
S('int_workbench', 64, 44, (R) => { leg(R, 3, 18, 4, 26, WD); leg(R, 57, 18, 4, 26, WD); block(R, 0, 10, 64, 12, 8, [WD[0], WD[1], W[2], W[3], W[4]]); R(6, 30, 52, 4, WD[2]); R(8, 26, 10, 4, M[2]);
  R.e(14, 12, 5, 3, P[4]); R.e(14, 12, 3, 2, C.butter[3]); R(13, 11, 2, 1, C.ink[1]); R(24, 13, 8, 2, M[3]); R(36, 12, 4, 4, C.butter[2]); R(42, 13, 3, 3, M[2]); R(48, 0, 2, 12, C.charcoal[2]); R(44, 0, 10, 4, C.charcoal[3]); R(45, 4, 8, 1, C.butter[3]); R(52, 13, 6, 2, C.coral[2]); });
S('int_grandfather', 24, 62, (R) => { block(R, 0, 0, 24, 62, 3, [WD[0], WD[1], WD[2], WD[3], WD[4]]); R.e(12, 11, 8, 8, C.butter[1]); R.e(12, 11, 7, 7, P[4]); R(4, 22, 16, 30, WD[1]); R(5, 23, 14, 28, C.sky[1]); R(11, 23, 2, 18, C.butter[2]); R.e(12, 43, 4, 4, C.butter[2]); R.e(11, 42, 2, 2, C.butter[4]); R(2, 54, 20, 6, WD[1]); R(12, 6, 1, 6, C.ink[1]); R(12, 11, 4, 1, C.ink[1]); });
S('int_stool', 18, 22, (R) => { R.e(9, 3, 8, 3, C.coral[2]); R.e(8, 2, 6, 2, C.coral[3]); R(4, 5, 2, 17, WD[2]); R(12, 5, 2, 17, WD[1]); R(5, 14, 8, 1, WD[2]); });
S('int_stairs_up', 32, 48, (R) => { for (let i = 0; i < 6; i++) { const y = 40 - i * 8; R(0, y, 32, 8, W[2 + (i % 2)]); R(0, y, 32, 2, W[4]); R(0, y + 7, 32, 1, W[1]); } R(0, 0, 2, 48, WD[1]); R(30, 0, 2, 48, WD[1]); R(0, 0, 32, 2, WD[0]); });
S('int_stairs_down', 32, 32, (R) => { R(0, 0, 32, 32, WD[0]); for (let i = 0; i < 4; i++) { const y = 2 + i * 7; R(2, y, 28, 5, W[3 - Math.min(2, i)]); R(2, y, 28, 1, W[4]); } R(0, 0, 2, 32, WD[1]); R(30, 0, 2, 32, WD[1]); }, { outline: false });
S('int_bell', 52, 56, (R) => { R(0, 0, 52, 6, WD[1]); R(0, 0, 52, 2, WD[2]); R(24, 6, 4, 6, C.charcoal[2]); R.e(26, 14, 8, 4, C.butter[1]); R(14, 14, 24, 22, C.butter[1]); R.t([14, 36], [6, 46], [14, 36], C.butter[1]); R(8, 36, 36, 10, C.butter[1]); R(10, 14, 6, 30, C.butter[2]); R(16, 12, 6, 32, C.butter[3]); R(18, 13, 2, 26, C.butter[4]); R(6, 44, 40, 3, C.butter[0]); R(24, 46, 4, 6, C.charcoal[2]); R.e(26, 52, 3, 3, C.charcoal[1]); R(12, 24, 28, 2, C.butter[0]); });
S('int_gear_frame', 64, 64, (R) => { R(0, 0, 6, 64, WD[1]); R(58, 0, 6, 64, WD[1]); R(0, 0, 64, 6, WD[2]); R(0, 58, 64, 6, WD[1]); R(1, 1, 2, 62, WD[3]); }, { outline: false });
// ---------------- school ----------------
S('int_locker', 20, 56, (R) => { block(R, 0, 0, 20, 56, 2, [C.sky[0], C.sky[1], C.sky[2], C.sky[3], C.sky[4]]); R(1, 3, 18, 51, C.sky[2]); for (let y = 6; y < 16; y += 2) R(4, y, 12, 1, C.sky[1]); R(15, 26, 2, 6, M[3]); R(2, 3, 1, 51, C.sky[3]); R(4, 20, 8, 3, P[4]); R(0, 54, 20, 2, C.sky[0]); });
S('int_shoe_locker', 64, 52, (R) => { block(R, 0, 0, 64, 52, 3, [WD[0], WD[1], W[2], W[3], W[4]]); for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) { const x = 3 + c * 12, y = 5 + r * 11; R(x, y, 11, 10, WD[1]); R(x + 1, y + 1, 9, 8, W[3]); R(x + 2, y + 2, 4, 1, P[4]); if (hash(c, r, 3) > 0.4) { R(x + 1, y + 6, 9, 3, P[4]); R(x + 1, y + 8, 9, 1, C.ribbon[2]); } } R(2, 49, 60, 3, WD[1]); });
S('int_chalkboard', 96, 48, (R) => {
  R(0, 0, 96, 44, W[2]); R(0, 0, 96, 1, W[3]); R(3, 3, 90, 38, C.chalkboard[2]); R(3, 3, 90, 2, C.chalkboard[1]);
  for (let i = 0; i < 70; i++) { const x = 6 + Math.floor(hash(i, 1, 41) * 84), y = 7 + Math.floor(hash(i, 2, 42) * 30); if (hash(i, 3, 43) > 0.4) R(x, y, 2 + Math.floor(hash(i, 4, 44) * 6), 1, 'rgba(232,240,224,0.6)'); }
  R(8, 8, 26, 1, C.chalkboard[4]); R(8, 12, 18, 1, C.chalkboard[4]); R.e(66, 20, 9, 6, C.chalkboard[2]); for (let a = 0; a < 40; a++) R(66 + Math.round(Math.cos(a / 6.4) * 9), 20 + Math.round(Math.sin(a / 6.4) * 6), 1, 1, C.chalkboard[4]); R(64, 18, 3, 3, C.butter[3]); R(80, 30, 8, 1, C.coral[3]);
  R(0, 41, 96, 4, W[3]); R(0, 41, 96, 1, W[4]); R(10, 40, 4, 2, '#ffffff'); R(18, 40, 3, 2, C.coral[3]); R(70, 39, 8, 3, C.charcoal[3]); R(0, 45, 96, 3, W[1]);
});
S('int_podium', 32, 38, (R) => { block(R, 0, 6, 32, 32, 6, [WD[0], WD[1], W[2], W[3], W[4]]); R(4, 14, 24, 20, W[1]); R(5, 15, 22, 18, W[2]); R(6, 0, 16, 7, P[4]); R(8, 2, 10, 1, C.ink[3]); R(24, 2, 4, 5, C.forest[2]); });
S('int_school_desk', 28, 30, (R) => { leg(R, 2, 12, 2, 18, M); leg(R, 24, 12, 2, 18, M); R(4, 14, 20, 8, C.wood[1]); R(4, 14, 20, 2, WD[1]); block(R, 0, 4, 28, 10, 7, [WD[1], W[1], W[2], W[3], W[4]]); R(6, 5, 8, 4, P[4]); R(7, 6, 5, 1, C.sky[1]); R(18, 5, 6, 1, C.coral[2]); });
S('int_school_chair', 20, 22, (R) => { R(2, 0, 16, 9, W[2]); R(2, 0, 16, 2, W[3]); R(2, 8, 1, 6, M[1]); R(17, 8, 1, 6, M[1]); block(R, 1, 12, 18, 4, 2, [WD[1], W[1], W[2], W[3], W[4]]); R(2, 16, 2, 6, M[1]); R(16, 16, 2, 6, M[1]); });
S('int_teacher_desk', 64, 40, (R) => { block(R, 0, 10, 64, 30, 8, [WD[0], WD[1], C.stone[3], C.stone[4], C.stone[5]]); R(0, 10, 64, 7, C.forest[3]); R(0, 10, 64, 1, C.forest[4]); drawerStack(R, 42, 19, 20, 20, 3, [M[0], M[1], M[2], M[3]]); R(6, 2, 16, 9, P[4]); R(8, 4, 10, 1, C.coral[2]); R(8, 6, 8, 1, C.ink[3]); R(28, 3, 6, 8, C.coral[2]); R(36, 4, 4, 7, C.mint[2]); R(37, 1, 2, 3, C.forest[3]); });
S('int_notice', 64, 40, (R) => { R(0, 0, 64, 40, WD[2]); R(0, 0, 64, 1, WD[3]); R(2, 2, 60, 36, C.dirt[3]); [[5, 4, 14, 16, C.sakura[4]], [22, 5, 12, 12, P[4]], [38, 3, 20, 10, C.butter[4]], [7, 23, 18, 12, C.sky[4]], [30, 20, 12, 15, C.mint[4]], [46, 17, 13, 18, P[4]]].forEach(([x, y, w, h, c], i) => { R(x, y, w, h, c); for (let k = y + 3; k < y + h - 2; k += 2) R(x + 2, k, w - 4 - (k % 3), 1, C.ink[3]); R(x + Math.floor(w / 2), y, 2, 2, [C.ribbon[2], C.sky[1], C.forest[2]][i % 3]); }); });
const doorSpr = (name, r, sign) => S(name, 28, 50, (R) => { R(0, 0, 28, 50, WD[1]); R(2, 2, 24, 48, r[2]); R(2, 2, 24, 1, r[3]); R(2, 2, 1, 48, r[3]); R(5, 6, 18, 14, C.sky[3]); R(5, 6, 18, 2, C.sky[4]); R(13, 6, 2, 14, r[2]); R(5, 24, 18, 22, r[1]); R(6, 25, 16, 20, r[2]); R(21, 28, 3, 3, C.butter[2]); if (sign) { R(4, -0, 20, 6, P[4]); R(6, 2, 16, 2, sign); } });
doorSpr('int_door', W); doorSpr('int_club_door', C.sky, C.coral[2]); doorSpr('int_staff_door', W, C.forest[2]); doorSpr('int_door_glass', C.mint);
S('int_nurse_bed', 40, 60, (R) => { R(0, 0, 40, 60, M[1]); R(2, 2, 36, 56, P[4]); cushion(R, 6, 4, 28, 10, { 1: P[1], 2: P[3], 3: P[4], 4: '#ffffff' }); R(2, 18, 36, 36, C.mint[3]); R(2, 18, 36, 2, C.mint[4]); R(2, 52, 36, 2, C.mint[2]); R(0, 56, 40, 4, M[2]); R(2, 58, 3, 2, M[0]); R(35, 58, 3, 2, M[0]); });
S('int_curtain', 12, 60, (R) => { R(0, 0, 12, 3, M[2]); for (let x = 0; x < 12; x += 4) { R(x, 3, 4, 55, P[4]); R(x + 3, 3, 1, 55, P[2]); } R(0, 56, 12, 4, P[3]); });
S('int_lab_bench', 64, 40, (R) => { block(R, 0, 8, 64, 32, 8, [C.charcoal[0], C.charcoal[1], C.charcoal[2], C.charcoal[3], C.charcoal[4]]); for (let x = 4; x < 60; x += 15) panelDoor(R, x, 20, 13, 16, [C.mint[0], C.mint[1], C.mint[2], C.mint[3]], 'top');
  R(6, 0, 4, 10, C.sky[4]); R(6, 5, 4, 5, C.mint[3]); R.e(18, 7, 4, 3, C.sky[4]); R(17, 1, 2, 4, C.sky[4]); R.e(18, 8, 3, 2, C.coral[3]); R(30, 2, 10, 7, M[2]); R(32, 0, 2, 2, M[3]); R(46, 4, 3, 6, C.butter[3]); R(52, 3, 3, 7, C.lilac[3]); R(58, 0, 2, 10, M[2]); R(56, 0, 6, 2, M[3]); });
S('int_skeleton', 22, 54, (R) => { R(10, 12, 2, 36, P[3]); R.e(11, 6, 6, 6, P[4]); R(8, 5, 2, 2, C.ink[1]); R(12, 5, 2, 2, C.ink[1]); R(9, 9, 4, 1, C.ink[3]); for (let y = 15; y < 30; y += 3) R(5, y, 12, 1, P[3]); R(4, 14, 2, 18, P[3]); R(16, 14, 2, 18, P[3]); R(6, 31, 10, 3, P[3]); R(7, 34, 2, 14, P[3]); R(13, 34, 2, 14, P[3]); R(4, 48, 14, 6, M[1]); R(10, 0, 2, 2, M[2]); });
S('int_easel', 28, 46, (R) => { R(3, 4, 3, 42, W[2]); R(22, 4, 3, 42, W[1]); R(13, 0, 2, 46, W[1]); R(1, 6, 26, 22, P[4]); R(3, 8, 22, 18, C.sky[3]); R.e(10, 22, 8, 5, C.forest[3]); R.e(19, 24, 7, 4, C.forest[2]); R(17, 11, 4, 4, C.butter[2]); R(0, 28, 28, 3, W[3]); });
S('int_piano', 64, 54, (R) => { block(R, 0, 0, 64, 54, 4, [C.charcoal[0], C.charcoal[1], C.charcoal[2], C.charcoal[3], C.charcoal[4]]); R(4, 8, 56, 14, C.charcoal[1]); R(8, 10, 12, 8, P[4]); R(10, 12, 8, 1, C.ink[3]); R(0, 26, 64, 8, C.charcoal[3]); R(2, 28, 60, 5, P[4]); for (let x = 4; x < 62; x += 4) R(x, 28, 1, 5, P[1]); for (let x = 5; x < 60; x += 4) if ((x / 4 | 0) % 7 !== 2 && (x / 4 | 0) % 7 !== 6) R(x, 28, 2, 3, C.charcoal[0]); R(6, 36, 4, 16, C.charcoal[1]); R(54, 36, 4, 16, C.charcoal[1]); R(26, 48, 12, 2, C.butter[2]); glint(R, 3, 3, C.charcoal[4]); });
S('int_railing', 32, 26, (R) => { R(0, 0, 32, 3, M[3]); R(0, 0, 32, 1, M[4]); R(0, 3, 32, 1, M[1]); for (let x = 2; x < 32; x += 6) R(x, 3, 2, 21, M[2]); R(0, 22, 32, 2, M[1]); R(0, 12, 32, 1, M[2]); });
S('int_railing_side', 10, 32, (R) => { R(3, 0, 4, 32, M[3]); R(3, 0, 1, 32, M[4]); R(6, 0, 1, 32, M[1]); for (let y = 2; y < 32; y += 8) R(2, y, 6, 2, M[2]); });
S('int_water_tank', 64, 60, (R) => { R(6, 44, 4, 16, M[1]); R(54, 44, 4, 16, M[1]); R(30, 46, 4, 14, M[1]); R.e(32, 8, 30, 8, M[3]); R(2, 8, 60, 36, M[2]); R(2, 8, 4, 36, M[3]); R(56, 8, 6, 36, M[1]); R.e(32, 44, 30, 6, M[1]); R.e(32, 8, 28, 6, M[4]); R(2, 20, 60, 1, M[1]); R(2, 32, 60, 1, M[1]); R(46, 14, 2, 26, C.charcoal[2]); for (let y = 16; y < 40; y += 4) R(44, y, 6, 1, C.charcoal[2]); });
S('int_stairhouse', 64, 64, (R) => { R(0, 10, 64, 54, C.stone[3]); R(0, 0, 64, 12, C.stone[1]); R(0, 0, 64, 2, C.stone[2]); R(2, 12, 60, 2, C.stone[4]); for (let y = 16; y < 62; y += 8) R(0, y, 64, 1, C.stone[2]); R(18, 14, 28, 50, WD[1]); R(20, 16, 24, 48, C.sky[1]); R(21, 17, 22, 20, C.sky[3]); R(31, 17, 2, 20, C.sky[1]); R(38, 42, 3, 3, C.butter[2]); }, {});
S('int_hoop', 52, 72, (R) => { R(24, 30, 4, 42, M[1]); R(24, 30, 1, 42, M[3]); R(16, 68, 20, 4, M[0]); R(4, 0, 44, 30, '#ffffff'); R(4, 0, 44, 1, P[3]); R(4, 29, 44, 1, P[1]); R(4, 0, 2, 30, P[2]); R(16, 12, 20, 14, C.coral[2]); R(18, 14, 16, 10, '#ffffff'); R(16, 28, 20, 2, C.leafAutumn[2]); for (let i = 0; i < 5; i++) R(17 + i * 4, 30, 1, 10, P[3]); R(19, 39, 14, 1, P[2]); });
S('int_gym_stage', 256, 64, (R) => {
  R(0, 0, 256, 34, C.ribbon[1]); for (let x = 0; x < 256; x += 8) { R(x, 0, 4, 34, C.ribbon[2]); R(x, 0, 1, 34, C.ribbon[3]); } R(0, 0, 256, 6, C.butter[1]); R(0, 0, 256, 2, C.butter[2]); for (let x = 4; x < 256; x += 16) R(x, 6, 8, 3, C.butter[1]);
  R(96, 14, 64, 20, C.ribbon[0]); R(100, 30, 56, 4, WD[2]);
  block(R, 0, 34, 256, 30, 6, [WD[0], WD[1], W[2], W[3], W[4]]); for (let x = 6; x < 250; x += 28) panelDoor(R, x, 44, 24, 16, W, 'none'); R(120, 38, 16, 4, C.butter[2]);
});
S('int_bleachers', 96, 56, (R) => { for (let i = 0; i < 4; i++) { const y = i * 12; R(0, y, 96, 12, WD[1]); R(0, y, 96, 5, W[3 - (i % 2)]); R(0, y, 96, 1, W[4]); R(0, y + 5, 96, 1, W[1]); } R(0, 48, 96, 8, WD[0]); R(0, 0, 2, 56, M[1]); R(94, 0, 2, 56, M[1]); });
S('int_ball_cart', 34, 32, (R) => { R(2, 12, 30, 16, M[1]); for (let x = 4; x < 32; x += 4) R(x, 12, 1, 16, M[3]); R(2, 12, 30, 1, M[3]); [[8, 10, C.leafAutumn], [16, 8, C.sky], [24, 10, C.coral], [12, 4, P], [20, 3, C.leafAutumn]].forEach(([x, y, r]) => { R.e(x, y, 5, 5, r[2]); R(x - 2, y - 3, 2, 2, r[4] || r[3]); R(x - 5, y, 10, 1, r[1]); }); R.e(5, 30, 2, 2, C.charcoal[1]); R.e(29, 30, 2, 2, C.charcoal[1]); });
S('int_mats', 64, 22, (R) => { for (let i = 0; i < 3; i++) block(R, 0, 14 - i * 6, 64, 8, 4, [C.sky[0], C.sky[1], C.sky[2], C.sky[3], C.sky[4]]); });
// ---------------- Goro's house ----------------
S('int_chabudai', 60, 30, (R) => { leg(R, 6, 14, 4, 16, WD); leg(R, 50, 14, 4, 16, WD); R.e(30, 10, 29, 9, WD[1]); R.e(30, 9, 28, 8, WD[2]); R.e(28, 7, 22, 5, WD[3]); R(20, 4, 8, 6, C.forest[3]); R(21, 3, 6, 2, C.forest[4]); R(34, 6, 6, 4, P[4]); R(35, 4, 4, 2, C.sky[3]); R(42, 8, 6, 3, C.sand[3]); });
S('int_rocker', 34, 44, (R) => { R(4, 0, 26, 24, W[2]); R(4, 0, 26, 2, W[3]); for (let x = 8; x < 28; x += 5) R(x, 3, 2, 19, W[1]); cushion(R, 4, 20, 26, 10, C.forest); R(2, 18, 4, 16, W[3]); R(28, 18, 4, 16, W[1]); R(4, 30, 3, 10, WD[2]); R(27, 30, 3, 10, WD[2]); R(0, 40, 34, 3, WD[2]); R(0, 40, 4, 2, WD[1]); R(30, 40, 4, 2, WD[1]); });
S('int_bonsai', 30, 32, (R) => { R(3, 22, 24, 7, C.stone[2]); R(2, 21, 26, 3, C.stone[3]); R(2, 21, 26, 1, C.stone[4]); R(5, 29, 4, 3, C.stone[1]); R(21, 29, 4, 3, C.stone[1]); R(13, 10, 3, 12, WD[2]); R(10, 14, 4, 2, WD[2]); R(16, 12, 5, 2, WD[2]); foliage(R, 10, 10, 6, 4, C.leaf, 3); foliage(R, 21, 8, 6, 4, C.leaf, 5); foliage(R, 15, 4, 5, 3, C.leaf, 7); });
S('int_tokonoma', 64, 60, (R) => { R(0, 0, 64, 60, WD[1]); R(3, 3, 58, 48, C.plaster[3]); R(3, 3, 58, 3, C.plaster[1]); R(24, 6, 16, 32, P[4]); R(24, 6, 16, 2, WD[2]); R(24, 36, 16, 2, WD[2]); R(29, 12, 2, 18, C.ink[1]); R(33, 14, 2, 10, C.ink[1]); R(30, 26, 5, 2, C.ink[1]); R(0, 50, 64, 10, WD[2]); R(0, 50, 64, 2, WD[3]); R(46, 38, 8, 12, C.sky[2]); R(47, 32, 2, 8, C.forest[2]); R(50, 30, 3, 3, C.coral[3]); });
S('int_dog_bed', 36, 18, (R) => { R.e(18, 11, 17, 7, C.ribbon[1]); R.e(18, 10, 16, 6, C.ribbon[2]); R.e(18, 11, 12, 4, C.sand[3]); R(10, 9, 16, 1, C.sand[2]); R(14, 4, 8, 2, C.butter[2]); });
S('int_tools', 30, 46, (R) => { R(0, 0, 30, 4, WD[2]); R(4, 4, 2, 40, W[2]); R(2, 34, 6, 10, M[2]); R(12, 4, 2, 38, W[2]); R(10, 38, 6, 6, M[3]); R(11, 42, 1, 3, M[1]); R(14, 42, 1, 3, M[1]); R(20, 4, 2, 30, W[1]); R(17, 30, 8, 10, C.forest[2]); R(17, 30, 8, 2, C.forest[3]); R(26, 4, 2, 12, C.charcoal[2]); });
S('int_futon', 44, 64, (R) => { R(0, 0, 44, 64, P[2]); R(1, 1, 42, 62, P[3]); cushion(R, 10, 3, 24, 9, C.sky); R(1, 16, 42, 46, C.forest[3]); R(1, 16, 42, 2, C.forest[4]); for (let y = 22; y < 60; y += 7) R(4, y, 36, 1, C.forest[2]); }, { outline: false });
// ---------------- small shared bits ----------------
S('int_sign', 40, 20, (R) => { R(0, 0, 40, 18, WD[2]); R(2, 2, 36, 14, P[3]); R(2, 2, 36, 1, P[4]); R(6, 6, 28, 2, C.coral[2]); R(8, 10, 24, 2, C.ink[3]); });
S('int_clock_face', 22, 24, (R) => { R.e(11, 11, 10, 10, WD[1]); R.e(11, 11, 9, 9, WD[3]); R.e(11, 11, 7, 7, P[4]); R(11, 5, 1, 1, C.ink[2]); R(11, 17, 1, 1, C.ink[2]); R(5, 11, 1, 1, C.ink[2]); R(17, 11, 1, 1, C.ink[2]); R(9, 21, 4, 3, WD[1]); });
S('int_cuckoo', 24, 34, (R) => { R.t([0, 8], [12, 0], [24, 8], WD[2]); R(2, 8, 20, 18, W[2]); R(2, 8, 20, 2, W[3]); R.e(12, 17, 6, 6, P[4]); R(11, 0, 2, 3, W[3]); R(9, 26, 1, 6, C.butter[1]); R(14, 26, 1, 8, C.butter[1]); R.e(9, 32, 1, 2, C.butter[2]); R.e(14, 33, 1, 1, C.butter[2]); });
S('int_plant_tall', 30, 52, (R) => { pot(R, 15, 52, 18, 14, C.stone); foliage(R, 15, 24, 13, 14, C.leaf, 9); foliage(R, 10, 12, 7, 8, C.leaf, 12); R(14, 30, 2, 9, C.forest[1]); });
S('int_umbrella_stand', 16, 34, (R) => { R(2, 14, 12, 20, C.sky[2]); R(2, 14, 2, 20, C.sky[3]); R(12, 14, 2, 20, C.sky[1]); R(2, 14, 12, 2, C.sky[4]); R(4, 0, 2, 16, C.coral[2]); R(3, 0, 3, 2, C.coral[1]); R(9, 2, 2, 14, C.forest[2]); R(8, 2, 3, 2, C.forest[3]); });
S('int_kotatsu_fixed', 56, 40, (R) => { R(0, 10, 56, 26, C.coral[2]); R(0, 10, 56, 3, C.coral[3]); for (let x = 4; x < 56; x += 8) R(x, 14, 4, 4, C.coral[4]); R(0, 34, 56, 2, C.coral[1]); block(R, 4, 4, 48, 8, 6, [WD[1], W[1], W[2], W[3], W[4]]); R.e(16, 6, 4, 2, C.leafAutumn[2]); R.e(24, 7, 4, 2, C.leafAutumn[2]); R(40, 2, 6, 5, P[4]); });
