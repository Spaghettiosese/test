// Art for the sv4_home area (home life, pets and renovations). Everything is drawn with `cd()`, a clipped 1px-border
// sprite helper: you draw in a w x h box, the sprite is (w+2) x (h+2) and nothing may touch the outer pixel ring, so the
// engine's selective/ink outline always has room (tests/art.test.mjs). Flat decals and overlays skip the outline.
// Sprite families: int_hw_* (room props), furn_* (decorate catalogue pieces), hw_builder_* (contractors), sv4_pet_* (pets),
// sv4_acc_<id>_<dir> (accessory overlays drawn over Misa's 40x48 frame, 8px of headroom for hats), sv4_tailor_sign.
import { defineSprite, makeR, SPRITES } from '../../art.js';
import { RAMPS as C } from '../../gfx/palette.js';
import { block, leg, books, foliage, pot, cushion, hash } from '../interiors/kit.js';

const INK = '#2a1a22', WHITE = '#fffaf0';
export function cd(name, w, h, draw, opts = {}) {
  if (SPRITES[name]) return name;
  const W = w + 2, H = h + 2;
  defineSprite(name, W, H, (R0) => {
    const surf = { rect(x, y, ww, hh, c) {
      const x0 = Math.max(1, x), y0 = Math.max(1, y), x1 = Math.min(W - 1, x + ww), y1 = Math.min(H - 1, y + hh);
      if (x1 > x0 && y1 > y0) R0(x0, y0, x1 - x0, y1 - y0, c);
    } };
    draw(makeR(surf, 1, 1));
  }, { hd: true, outline: 'selective', ...opts });
  return name;
}
const flat = { outline: false };
const ink = { outline: 'ink' };
const W = C.wood, WD = C.woodDark, P = C.paper, M = C.metal;
const r5 = (r) => [r[0], r[1], r[2], r[3], r[4] || r[3]];

// ---------------------------------------------------------------- doors, boards, plans
cd('int_hw_arch', 30, 46, (R) => {
  R(0, 0, 30, 46, WD[1]); R(2, 2, 26, 44, WD[2]); R(4, 5, 22, 41, C.butter[4]);
  R(4, 5, 7, 41, C.coral[3]); R(19, 5, 7, 41, C.coral[3]); for (let y = 8; y < 44; y += 6) { R(5, y, 1, 4, C.coral[2]); R(8, y, 1, 4, C.coral[2]); R(20, y, 1, 4, C.coral[2]); R(23, y, 1, 4, C.coral[2]); }
  R(2, 2, 26, 5, C.coral[2]); R(2, 2, 26, 1, C.coral[4]); R(13, 14, 4, 20, C.butter[3]); R(13, 14, 1, 20, WHITE);
});
cd('int_hw_plans', 26, 34, (R) => {
  leg(R, 2, 22, 3, 12, WD); leg(R, 21, 22, 3, 12, WD); leg(R, 11, 24, 3, 10, WD);
  R(0, 0, 26, 24, WD[2]); R(2, 2, 22, 20, C.sky[2]);
  for (let x = 4; x < 22; x += 4) R(x, 3, 1, 18, C.sky[3]); for (let y = 5; y < 20; y += 4) R(3, y, 20, 1, C.sky[3]);
  R(5, 7, 16, 11, WHITE); R(7, 9, 12, 7, C.sky[2]); R(11, 5, 4, 3, WHITE); R(9, 12, 8, 1, WHITE); R(2, 22, 22, 2, WD[1]);
});
cd('int_hw_boards', 30, 44, (R) => {
  R(0, 0, 30, 44, WD[1]); for (let y = 2; y < 42; y += 8) { R(2, y, 26, 7, W[2]); R(2, y, 26, 1, W[3]); R(2, y + 6, 26, 1, W[1]); R(4, y + 3, 1, 1, M[3]); R(25, y + 3, 1, 1, M[3]); }
  for (let i = 0; i < 38; i++) { R(2 + Math.floor(i * 0.65), 3 + i, 4, 1, WD[2]); }
  R(6, 16, 18, 12, C.butter[3]); R(6, 16, 18, 2, C.charcoal[2]); for (let x = 6; x < 24; x += 6) R(x, 18, 3, 10, C.charcoal[2]); R(8, 20, 14, 6, C.butter[4]);
});
const doorSprite = (id, a, kind) => cd(`int_hw_door_${id}`, 30, 46, (R) => {
  R(0, 0, 30, 46, a[1]); R(2, 2, 26, 44, a[2]); R(2, 2, 26, 2, a[3]);
  if (kind === 'stairs') {
    R(4, 5, 22, 41, C.charcoal[2]); for (let i = 0; i < 6; i++) { const y = 38 - i * 6, x = 5 + i * 2; R(x, y, 20 - i * 3, 5, W[3 - (i % 2)]); R(x, y + 4, 20 - i * 3, 1, W[1]); }
    R(24, 8, 2, 34, WD[2]); R(4, 8, 2, 34, WD[2]);
  } else {
    R(4, 5, 22, 41, WD[2]); R(5, 6, 20, 39, W[2]); R(5, 6, 20, 2, W[3]); R(8, 9, 14, 12, C.sky[4]); R(8, 9, 14, 1, WHITE); R(14, 9, 2, 12, W[2]); R(8, 14, 14, 2, W[2]);
    R(8, 25, 14, 17, W[1]); R(9, 26, 12, 15, W[3]); R(21, 30, 2, 3, C.butter[2]);
  }
});
doorSprite('sunroom', C.butter, 'door'); doorSprite('study', C.sky, 'stairs'); doorSprite('bathhouse', C.mint, 'door'); doorSprite('workshop', C.coral, 'door');
doorSprite('greenhouse', C.forest, 'door'); doorSprite('guest', C.lilac, 'door'); doorSprite('balcony', C.sky, 'door');

// ---------------------------------------------------------------- builders (Goro and a carpenter), two arm frames each
function builder(R, hat, shirt, f, beard) {
  R(5, 0, 6, 3, hat); R(4, 2, 8, 1, hat); R(5, 3, 6, 5, '#f2c9a4'); if (beard) R(5, 6, 6, 3, '#e8e8f0'); R(6, 5, 1, 1, INK); R(9, 5, 1, 1, INK);
  R(4, 8, 8, 8, shirt); R(4, 8, 8, 1, C.paper[4]); R(4, 15, 8, 1, '#2a3a5a');
  R(5, 16, 3, 6, '#3a4a6a'); R(8, 16, 3, 6, '#2a3a5a'); R(4, 22, 4, 2, '#5a3a2a'); R(8, 22, 4, 2, '#5a3a2a');
  if (f) { R(12, 3, 2, 7, '#f2c9a4'); R(11, 0, 4, 3, M[3]); R(13, 3, 1, 5, WD[2]); R(2, 10, 2, 5, '#f2c9a4'); }
  else { R(12, 10, 2, 6, '#f2c9a4'); R(13, 15, 2, 2, M[3]); R(2, 10, 2, 5, '#f2c9a4'); }
}
for (let f = 0; f < 2; f++) { cd(`hw_builder_0_${f}`, 16, 24, (R) => builder(R, C.butter[2], C.leafAutumn[2], f, true), ink); cd(`hw_builder_1_${f}`, 16, 24, (R) => builder(R, C.coral[2], C.sky[2], f, false), ink); }
cd('hw_crate_stack', 24, 22, (R) => { block(R, 0, 8, 14, 14, 3, r5(W)); block(R, 10, 2, 14, 20, 3, r5(W)); R(2, 14, 10, 1, WD[2]); R(12, 10, 10, 1, WD[2]); });
cd('hw_sawhorse', 26, 16, (R) => { R(2, 0, 22, 4, W[3]); R(2, 0, 22, 1, W[4]); leg(R, 3, 4, 3, 12, WD); leg(R, 20, 4, 3, 12, WD); R(7, 6, 12, 1, WD[2]); });
cd('hw_progress_sign', 22, 26, (R) => { R(10, 12, 3, 14, WD[2]); R(0, 0, 22, 14, C.butter[3]); R(0, 0, 22, 2, C.charcoal[2]); for (let x = 0; x < 22; x += 6) R(x, 0, 3, 2, C.butter[3]); R(2, 4, 18, 8, WHITE); });

// ---------------------------------------------------------------- room props
cd('int_hw_teatable', 56, 34, (R) => {
  leg(R, 5, 18, 4, 14, WD); leg(R, 47, 18, 4, 14, WD); block(R, 0, 8, 56, 14, 8, r5([WD[1], W[1], W[2], W[3], W[4]]));
  R(8, 3, 8, 6, P[4]); R(16, 5, 3, 2, P[4]); R(9, 2, 6, 1, C.coral[3]); R(26, 5, 5, 4, C.mint[3]); R(26, 5, 5, 1, P[4]); R(38, 5, 5, 4, C.butter[3]); R(38, 5, 5, 1, P[4]); R(46, 6, 5, 3, C.sakura[3]);
});
cd('int_hw_desk_big', 64, 46, (R) => {
  leg(R, 3, 22, 4, 24, WD); leg(R, 57, 22, 4, 24, WD); block(R, 0, 14, 64, 12, 8, r5([WD[0], WD[1], W[2], W[3], W[4]]));
  R(4, 24, 56, 6, W[1]); R(36, 26, 20, 16, WD[2]); R(38, 28, 16, 5, W[2]); R(38, 35, 16, 5, W[2]); R(44, 30, 4, 1, C.butter[2]); R(44, 37, 4, 1, C.butter[2]);
  R(6, 6, 18, 9, WHITE); R(8, 8, 14, 1, P[2]); R(8, 10, 10, 1, P[2]); R(28, 2, 3, 12, M[2]); R(24, 0, 10, 4, C.butter[3]); R(38, 8, 14, 6, C.sky[2]); R(38, 8, 14, 1, C.sky[4]);
});
cd('int_hw_globe', 20, 30, (R) => { R(8, 22, 4, 6, WD[2]); R(3, 27, 14, 3, WD[1]); R.e(10, 12, 9, 9, C.sky[2]); R.e(8, 9, 6, 5, C.sky[3]); R.e(12, 14, 4, 3, C.forest[3]); R(6, 8, 4, 3, C.forest[3]); R(10, 2, 1, 20, M[3]); });
cd('int_hw_scope', 26, 46, (R) => { R(11, 24, 3, 22, WD[2]); R(3, 40, 20, 3, WD[1]); R(7, 34, 2, 12, WD[2]); R(17, 34, 2, 12, WD[2]); R.t([4, 6], [22, 0], [22, 14], M[3]); R(2, 4, 8, 8, M[2]); R(18, 0, 6, 15, M[2]); R(8, 8, 12, 4, M[3]); R(10, 5, 8, 1, M[4]); });
const planter = (id, st) => cd(`int_hw_planter_${id}`, 30, 24, (R) => {
  block(R, 0, 8, 30, 16, 4, r5(W)); R(2, 10, 26, 6, C.woodDark[0]); R(3, 11, 24, 4, '#5a3a2a'); R(3, 11, 24, 1, '#7a5238');
  if (st >= 1) for (let i = 0; i < 4; i++) { const x = 5 + i * 6; R(x + 1, 6, 1, 6, C.leaf[2]); R(x, 5, 3, 2, C.leaf[3]); }
  if (st >= 2) for (let i = 0; i < 4; i++) { const x = 5 + i * 6; R(x - 1, 2, 5, 4, C.leaf[2]); R(x, 1, 3, 2, C.leaf[3]); R(x + 1, 6, 1, 5, C.leaf[1]); }
  if (st >= 3) for (let i = 0; i < 4; i++) { const x = 5 + i * 6; R(x, 0, 3, 3, [C.coral[3], C.butter[3], C.sakura[3], C.lilac[3]][i]); R(x + 1, 1, 1, 1, WHITE); }
  if (st === 4) R(2, 10, 26, 6, '#3a2418');
});
['e', 's', 'g', 'r'].forEach((id, i) => planter(id, i));
cd('int_hw_planter_w', 30, 24, (R) => { block(R, 0, 8, 30, 16, 4, r5(W)); R(2, 10, 26, 6, '#3a2418'); R(3, 11, 24, 1, '#5a3a2a'); R(6, 4, 1, 7, C.leaf[2]); R(11, 5, 1, 6, C.leaf[2]); R(18, 4, 1, 7, C.leaf[2]); R(23, 5, 1, 6, C.leaf[2]); });
cd('int_hw_bench', 46, 26, (R) => { leg(R, 3, 12, 3, 14, WD); leg(R, 40, 12, 3, 14, WD); R(0, 8, 46, 5, W[3]); R(0, 8, 46, 1, W[4]); R(0, 0, 46, 8, W[2]); for (let x = 2; x < 44; x += 6) R(x, 1, 1, 6, W[1]); R(0, 12, 46, 1, W[1]); });
cd('int_hw_onsen', 96, 56, (R) => {
  R(0, 6, 96, 50, C.stone[3]); R(0, 6, 96, 3, C.stone[4]); R(2, 10, 92, 42, C.stone[2]);
  for (let i = 0; i < 12; i++) { const x = 2 + i * 8 + (i % 2) * 2; R(x, 4 + (i % 3), 7, 5, C.stone[2 + (i % 2)]); R(x, 4 + (i % 3), 7, 1, C.stone[4]); }
  R(4, 14, 88, 34, C.water[2]); R(4, 14, 88, 3, C.water[3]); for (let y = 20; y < 46; y += 6) for (let x = 8 + ((y / 6) % 2) * 6; x < 86; x += 12) R(x, y, 6, 1, C.water[3]);
  R(4, 48, 88, 3, C.stone[1]); R(0, 52, 96, 4, C.stone[1]);
});
cd('int_hw_stool', 14, 12, (R) => { R(1, 0, 12, 4, W[3]); R(1, 0, 12, 1, W[4]); R(2, 4, 2, 8, WD[2]); R(10, 4, 2, 8, WD[1]); R(3, 8, 8, 1, WD[2]); });
cd('int_hw_bucket', 14, 12, (R) => { R(1, 0, 12, 3, C.water[4]); R(0, 2, 14, 10, W[3]); R(0, 4, 14, 1, M[2]); R(0, 9, 14, 1, M[2]); R(0, 2, 2, 10, W[4]); });
cd('int_hw_screen', 64, 48, (R) => { for (let i = 0; i < 16; i++) { const x = i * 4; R(x, 2, 3, 46, i % 2 ? C.leaf[3] : C.leaf[2]); R(x, 2, 1, 46, C.leaf[4]); } R(0, 12, 64, 2, WD[2]); R(0, 34, 64, 2, WD[2]); R(0, 0, 64, 3, WD[1]); });
cd('int_hw_stone_lantern', 16, 34, (R) => { R(2, 26, 12, 8, C.stone[2]); R(5, 14, 6, 12, C.stone[3]); R(2, 6, 12, 8, C.stone[2]); R(5, 8, 6, 5, C.butter[3]); R(0, 2, 16, 5, C.stone[3]); R(4, 0, 8, 3, C.stone[2]); });
cd('int_hw_workbench', 68, 46, (R) => {
  leg(R, 3, 24, 5, 22, WD); leg(R, 60, 24, 5, 22, WD); block(R, 0, 14, 68, 14, 8, r5([WD[0], WD[1], W[2], W[3], W[4]]));
  R(6, 28, 56, 3, W[1]); R(4, 8, 6, 7, M[3]); R(5, 4, 4, 5, WD[2]); R(18, 10, 14, 5, W[4]); R(36, 4, 12, 11, C.sky[3]); R(36, 4, 12, 1, C.sky[4]); R(52, 6, 3, 9, C.coral[3]); R(56, 8, 3, 7, C.butter[3]); R(14, 31, 40, 12, WD[2]); R(16, 33, 16, 8, W[2]); R(36, 33, 16, 8, W[2]);
});
cd('int_hw_sewing', 38, 36, (R) => {
  leg(R, 3, 24, 3, 12, WD); leg(R, 32, 24, 3, 12, WD); R(0, 22, 38, 4, W[3]); R(0, 22, 38, 1, W[4]);
  R(4, 6, 26, 16, C.paper[3]); R(4, 6, 26, 2, C.paper[4]); R(22, 0, 8, 8, C.paper[2]); R(7, 10, 8, 6, C.coral[3]); R(26, 8, 2, 14, M[3]); R(30, 14, 5, 8, C.sky[3]); R(8, 17, 14, 2, M[2]);
});
cd('int_hw_pegboard', 64, 34, (R) => { R(0, 0, 64, 34, W[2]); R(0, 0, 64, 2, W[3]); for (let y = 4; y < 32; y += 4) for (let x = 3; x < 62; x += 4) R(x, y, 1, 1, WD[1]); R(4, 5, 3, 14, M[3]); R(5, 3, 1, 3, WD[2]); R(14, 6, 12, 5, M[2]); R(30, 5, 6, 12, C.coral[3]); R(42, 6, 14, 3, M[3]); R(44, 12, 10, 8, C.sky[3]); R(20, 18, 16, 3, WD[2]); });
cd('int_hw_paintshelf', 32, 54, (R) => { block(R, 0, 0, 32, 54, 3, r5([WD[0], W[1], W[2], W[3], W[4]])); for (let s = 0; s < 3; s++) { const y = 5 + s * 16; R(3, y, 26, 13, W[1]); for (let i = 0; i < 5; i++) { R(5 + i * 5, y + 3, 4, 9, [C.coral[3], C.sky[3], C.mint[3], C.butter[3], C.lilac[3]][(i + s) % 5]); R(6 + i * 5, y + 1, 2, 2, M[3]); } } });
cd('int_hw_guestbed', 54, 70, (R) => {
  R(0, 0, 54, 70, WD[1]); R(0, 0, 54, 12, W[2]); R(2, 2, 50, 8, W[3]); R(2, 12, 50, 54, P[4]);
  cushion(R, 6, 14, 20, 12, C.lilac); cushion(R, 28, 14, 20, 12, C.lilac);
  R(2, 30, 50, 36, C.sky[3]); R(2, 30, 50, 2, C.sky[4]); for (let x = 6; x < 50; x += 8) R(x, 34, 4, 28, C.sky[2]); R(2, 62, 50, 4, C.sky[1]);
});
cd('int_hw_nightstand', 22, 34, (R) => { block(R, 0, 14, 22, 20, 4, r5(W)); R(3, 22, 16, 8, W[1]); R(9, 25, 4, 2, C.butter[2]); R(8, 8, 6, 6, C.butter[3]); R(10, 14, 2, 2, M[3]); R(7, 3, 8, 6, C.butter[4]); });
cd('int_hw_guestrug', 76, 52, (R) => { R.e(38, 26, 37, 25, C.lilac[1]); R.e(38, 26, 35, 23, C.lilac[2]); R.e(38, 26, 28, 17, C.butter[3]); R.e(38, 26, 20, 12, C.lilac[3]); R.e(38, 26, 10, 6, C.butter[2]); }, flat);
cd('int_hw_menu_stand', 30, 38, (R) => {
  leg(R, 4, 28, 3, 10, WD); leg(R, 23, 28, 3, 10, WD); R(0, 0, 30, 30, WD[2]); R(2, 2, 26, 26, C.charcoal[1]); R(2, 2, 26, 2, C.charcoal[2]);
  for (let i = 0; i < 6; i++) { R(5, 6 + i * 4, 8 + (i * 5) % 7, 1, WHITE); R(21, 6 + i * 4, 4, 1, C.butter[3]); } R(4, 29, 22, 2, W[3]);
});
cd('int_hw_wcan', 18, 14, (R) => { R(2, 4, 10, 9, C.mint[2]); R(2, 4, 10, 2, C.mint[3]); R(12, 5, 5, 2, C.mint[2]); R(15, 3, 2, 3, C.mint[3]); R(5, 1, 6, 3, M[3]); R(1, 8, 2, 4, C.mint[1]); });
cd('int_hw_plushie_mat', 28, 18, (R) => { cushion(R, 0, 4, 28, 14, C.sakura); }, flat);
cd('int_hw_rug_study', 64, 40, (R) => { R.e(32, 20, 31, 19, C.navy[1]); R.e(32, 20, 28, 16, C.navy[2]); R.e(32, 20, 20, 11, C.butter[2]); R.e(32, 20, 14, 7, C.navy[3]); }, flat);
cd('int_hw_tatami_mat', 60, 38, (R) => { R(0, 0, 60, 38, C.sand[2]); R(0, 0, 60, 2, C.forest[1]); R(0, 36, 60, 2, C.forest[1]); for (let x = 3; x < 58; x += 4) R(x, 3, 1, 32, C.sand[3]); }, flat);
cd('int_hw_sunbeam', 40, 28, (R) => { R(0, 0, 40, 28, C.butter[4]); }, { outline: false, alpha: 0.18 });

// ---------------------------------------------------------------- decorate-catalogue furniture (registered into interiors' CATALOG in furniture.js)
cd('furn_gadget_ricecooker', 20, 22, (R) => { R.e(10, 12, 9, 8, WHITE); R.e(10, 10, 8, 5, P[4]); R(2, 14, 16, 4, P[2]); R(7, 3, 6, 3, M[3]); R(14, 12, 3, 2, C.coral[3]); R(3, 18, 14, 3, M[2]); });
cd('furn_gadget_oven', 34, 30, (R) => { block(R, 0, 2, 34, 28, 3, r5([M[0], M[1], M[2], M[3], M[4]])); R(4, 10, 26, 16, C.charcoal[2]); R(6, 12, 22, 12, C.butter[1]); R(6, 12, 22, 2, C.butter[3]); R(4, 7, 4, 2, C.coral[3]); R(10, 7, 4, 2, C.butter[3]); R(24, 7, 4, 2, C.sky[3]); R(8, 28, 4, 2, C.charcoal[1]); R(22, 28, 4, 2, C.charcoal[1]); });
cd('furn_gadget_blender', 16, 28, (R) => { R(1, 20, 14, 8, C.charcoal[2]); R(1, 20, 14, 1, C.charcoal[3]); R(6, 24, 4, 2, C.coral[3]); R(3, 4, 10, 16, C.sky[4]); R(3, 4, 2, 16, WHITE); R(4, 12, 8, 8, C.coral[3]); R(2, 1, 12, 4, C.charcoal[2]); R(0, 17, 16, 3, M[3]); });
const frame = (R, x, y, w, h, c, pic) => { R(x, y, w, h, WD[2]); R(x, y, w, 1, WD[3]); R(x + 1, y + 1, w - 2, h - 2, P[4]); R(x + 2, y + 2, w - 4, h - 4, c); pic(R, x + 2, y + 2, w - 4, h - 4); };
const faces = (R, x, y, w, h, n) => { for (let i = 0; i < n; i++) { const cx = x + Math.floor(((i + 0.5) * w) / n); R.e(cx, y + h - 6, 3, 4, [C.coral[3], C.sky[3], C.butter[3]][i % 3]); R.e(cx, y + h - 11, 3, 3, '#f2c9a4'); R(cx - 3, y + h - 14, 6, 2, WD[1]); } };
cd('furn_photo_family', 24, 28, (R) => frame(R, 0, 0, 24, 28, C.sky[3], (R2, x, y, w, h) => faces(R2, x, y, w, h, 3)));
cd('furn_photo_ship', 30, 24, (R) => frame(R, 0, 0, 30, 24, C.sky[2], (R2, x, y, w, h) => { R2(x, y + h - 5, w, 5, C.water[2]); R2(x + 4, y + h - 9, 14, 5, WHITE); R2(x + 12, y + h - 14, 3, 5, WHITE); R2(x + 14, y + 2, 4, 4, C.butter[3]); }));
cd('furn_photo_nori', 22, 26, (R) => frame(R, 0, 0, 22, 26, C.sakura[3], (R2, x, y, w, h) => { R2.e(x + 8, y + 9, 5, 5, '#f2c9a4'); R2(x + 3, y + 3, 10, 4, C.hairPink[2]); R2(x + 5, y + 13, 8, 6, C.lilac[2]); R2(x + 13, y + 11, 4, 7, C.leaf[2]); }));
cd('furn_photo_garland', 56, 22, (R) => { R(0, 2, 56, 1, M[2]); [[2, C.coral], [14, C.sky], [26, C.butter], [38, C.mint]].forEach(([x, r], i) => { R(x + 4, 3, 1, 3, M[2]); R(x, 6, 12, 14, WD[2]); R(x + 1, 7, 10, 12, P[4]); R(x + 2, 8, 8, 10, r[3]); R.e(x + 6, 14, 2, 2, '#f2c9a4'); R(x + 4, 17, 4, 1, WD[1]); }); });
cd('furn_photo_wall_big', 60, 34, (R) => { R(0, 0, 60, 34, WD[1]); R(2, 2, 56, 30, C.butter[4]); [[4, 4, 14, 12], [20, 4, 10, 12], [32, 4, 12, 12], [46, 4, 10, 12], [4, 19, 12, 11], [18, 19, 16, 11], [36, 19, 10, 11], [48, 19, 8, 11]].forEach(([x, y, w, h], i) => { R(x, y, w, h, WD[2]); R(x + 1, y + 1, w - 2, h - 2, [C.sky[3], C.coral[3], C.mint[3], C.sakura[3], C.lilac[3], C.sky[2], C.butter[3], C.leaf[3]][i]); R.e(x + w / 2, y + h / 2 + 1, 2, 2, '#f2c9a4'); }); });
cd('furn_pet_bed_dog', 38, 18, (R) => { R.e(19, 11, 18, 6, C.coral[2]); R.e(19, 9, 16, 5, C.coral[3]); R.e(19, 10, 11, 3, C.paper[4]); R(2, 6, 34, 3, C.coral[3]); R(6, 12, 3, 2, C.coral[4]); }, flat);
cd('furn_hutch_rabbit', 44, 38, (R) => { leg(R, 3, 28, 3, 10, WD); leg(R, 38, 28, 3, 10, WD); block(R, 0, 10, 44, 20, 4, r5(W)); R(3, 16, 38, 11, C.charcoal[2]); for (let x = 5; x < 40; x += 4) R(x, 16, 1, 11, M[3]); R(5, 22, 12, 5, C.butter[3]); R.t([0, 10], [22, 0], [44, 10], C.coral[2]); R(0, 9, 44, 2, C.coral[1]); });
cd('furn_tank_turtle', 40, 28, (R) => { R(0, 6, 40, 22, C.sky[4]); R(1, 8, 38, 19, C.water[3]); R(1, 8, 38, 2, C.water[4]); R(2, 20, 36, 6, C.sand[3]); R(0, 4, 40, 3, M[3]); R(0, 25, 40, 3, M[2]); R(6, 14, 12, 7, C.stone[2]); R(8, 12, 8, 3, C.stone[3]); R(24, 10, 6, 10, C.leaf[2]); R(27, 8, 3, 4, C.leaf[3]); });
cd('furn_cage_parakeet', 26, 50, (R) => { R(11, 36, 4, 14, M[2]); R(4, 46, 18, 4, M[2]); R(2, 28, 22, 4, M[3]); for (let x = 3; x < 24; x += 3) R(x, 6, 1, 22, M[3]); R(2, 4, 22, 3, M[2]); R(8, 0, 10, 5, M[3]); R(11, 0, 4, 5, M[4]); R(4, 16, 18, 2, W[2]); R(8, 22, 6, 5, C.mint[3]); });

// ---------------------------------------------------------------- tailor sign
cd('sv4_tailor_sign', 26, 40, (R) => { R(11, 0, 4, 6, M[2]); R(0, 6, 26, 24, WD[2]); R(2, 8, 22, 20, C.sakura[4]); R(2, 8, 22, 2, C.sakura[3]);
  R(6, 12, 14, 10, WHITE); R.t([6, 12], [20, 12], [13, 22], C.coral[3]); R(12, 22, 2, 8, M[3]); R(9, 25, 8, 4, C.lilac[3]); R(10, 32, 6, 8, WD[1]); });

// ---------------------------------------------------------------- pets
const DOG = { fur: ['#4a2418', '#6e3c28', '#8c5238', '#a96a48', '#c88a62'], white: ['#cfc4b8', '#f4eee6', '#ffffff'], nose: INK, tongue: '#e0707a', col: C.sky };
function dogHead(R, o = {}) {
  R.t([2, 2], [0, 9], [5, 6], DOG.fur[0]); R.t([12, 2], [14, 9], [9, 6], DOG.fur[1]);
  R.e(7, 8, 6, 5, DOG.fur[3]); R(5, 3, 3, 2, DOG.fur[4]); R.e(10, 11, 4, 3, DOG.white[1]); R(13, 9, 2, 2, DOG.nose);
  if (o.blink) R(8, 7, 3, 1, INK); else if (o.happy) { R(8, 7, 1, 1, INK); R(9, 6, 1, 1, INK); R(10, 7, 1, 1, INK); } else { R(8, 6, 2, 3, INK); R(8, 6, 1, 1, WHITE); }
  R(5, 7, 2, 1, DOG.white[1]);
  if (o.tongue) { R(11, 13, 2, 2, DOG.tongue); }
}
function dogSit(R, f, o = {}) {
  const wg = [0, 1, 0, -1][f % 4];
  R(2 + wg, 14, 3, 3, DOG.fur[2]); R(0 + wg, 13, 3, 2, DOG.fur[3]);
  R.e(9, 18, 6, 6, DOG.fur[2]); R.e(8, 17, 5, 5, DOG.fur[3]); R.e(12, 19, 3, 5, DOG.white[1]);
  R(5, 23, 7, 2, DOG.fur[2]); R(11, 19, 3, 6, DOG.white[1]); R(11, 24, 4, 1, DOG.white[2]);
  R(9, 12, 6, 2, DOG.col[2]); R(12, 13, 2, 2, C.butter[2]);
  if (o.paw) { R(14, 15, 3, 2, DOG.fur[3]); R(15, 14, 2, 2, DOG.white[1]); }
  dogHead(R.at(6, 2), o);
}
function dogWalk(R, f) {
  const L = [[0, 2], [2, 0], [4, 0], [2, 2]][f % 4], tail = [0, 1, 0, 1][f % 4];
  R(2, 7 - tail, 3, 3, DOG.fur[2]);
  R(5 + L[0], 14, 2, 4, DOG.fur[1]); R(6 + L[0], 17, 3, 1, DOG.white[1]); R(13 - L[1], 14, 2, 4, DOG.fur[1]); R(13 - L[1] - 1, 17, 3, 1, DOG.white[1]);
  R.e(10, 11, 7, 4, DOG.fur[2]); R.e(10, 10, 6, 3, DOG.fur[3]); R.e(14, 12, 3, 3, DOG.white[1]);
  R(5 + (3 - L[0]), 14, 2, 4, DOG.fur[2]); R(6 + (3 - L[0]), 17, 3, 1, DOG.white[1]); R(14 - (3 - L[1]), 14, 2, 4, DOG.fur[2]);
  R(13, 8, 4, 2, DOG.col[2]);
  dogHead(R.at(11, 0), { tongue: f % 2 === 0 });
}
function dogLie(R, f, rolled) {
  const br = f % 2;
  if (rolled) { R.e(11, 8, 9, 4, DOG.white[1]); R.e(11, 7, 7, 2, DOG.white[2]); R(4, 3 + br, 3, 3, DOG.fur[2]); R(17, 3 + br, 3, 3, DOG.fur[2]); R(7, 3 + br, 3, 3, DOG.fur[3]); R(14, 3, 3, 3, DOG.fur[3]); R.e(21, 8, 3, 3, DOG.fur[3]); R(21, 7, 2, 2, DOG.fur[0]); R(3, 8, 3, 2, DOG.fur[2]); return; }
  R.e(10, 8 - br, 9, 4 + br, DOG.fur[2]); R.e(9, 7 - br, 8, 3 + br, DOG.fur[3]); R.e(3, 8, 2, 2, DOG.fur[3]);
  R(16, 10, 8, 2, DOG.fur[3]); R(21, 10, 4, 2, DOG.white[1]); R(13, 5, 3, 2, DOG.col[2]);
  const H = R.at(14, 1); R.t([16, 0], [15, 5], [19, 3], DOG.fur[0]); H.e(7, 6, 4, 3, DOG.fur[3]); H(8, 6, 4, 3, DOG.white[1]); H(10, 5, 2, 2, DOG.nose); H(5, 5, 3, 1, INK);
}
for (let f = 0; f < 4; f++) { cd(`sv4_pet_azuki_sit_${f}`, 19, 26, (R) => dogSit(R, f, { tongue: f % 2 === 0 }), ink); cd(`sv4_pet_azuki_walk_${f}`, 21, 19, (R) => dogWalk(R, f), ink); }
cd('sv4_pet_azuki_sit_b', 19, 26, (R) => dogSit(R, 0, { blink: true }), ink);
cd('sv4_pet_azuki_happy', 19, 26, (R) => dogSit(R, 1, { happy: true, tongue: true }), ink);
cd('sv4_pet_azuki_paw', 19, 26, (R) => dogSit(R, 1, { paw: true, happy: true }), ink);
for (let f = 0; f < 2; f++) cd(`sv4_pet_azuki_lie_${f}`, 26, 13, (R) => dogLie(R, f), ink);
for (let f = 0; f < 2; f++) cd(`sv4_pet_azuki_roll_${f}`, 26, 13, (R) => dogLie(R, f, true), ink);
cd('sv4_pet_ball', 6, 6, (R) => { R.e(3, 3, 2, 2, '#e0707a'); R(2, 2, 1, 1, WHITE); }, ink);

const RAB = { fur: ['#8a7a6a', '#b8a898', '#d8cbb8', '#efe4d2', '#fffaf0'], ear: '#f0b8b8', eye: INK };
function rabSit(R, f, o = {}) {
  R.e(5, 13, 5, 5, RAB.fur[2]); R.e(4, 12, 4, 4, RAB.fur[3]); R.e(2, 15, 2, 2, RAB.fur[4]);
  R.e(9, 14, 3, 3, RAB.fur[3]); R(8, 17, 5, 1, RAB.fur[1]);
  const tw = o.twitch ? 1 : 0;
  R.e(10, 8, 4, 4, RAB.fur[3]); R.e(12, 9, 2, 2, RAB.fur[4]); R(13, 8, 2, 2, RAB.ear);
  R(5, 0 + tw, 2, 7, RAB.fur[2]); R(5, 1 + tw, 1, 5, RAB.ear); R(8, 1, 2, 6, RAB.fur[3]); R(8, 2, 1, 4, RAB.ear);
  if (o.blink) R(11, 8, 2, 1, INK); else { R(11, 7, 1, 2, INK); R(11, 7, 1, 1, WHITE); }
  R(14, 10, 1, 1, '#d87a8a');
  if (o.eat) { R(13, 12, 3, 2, C.leaf[3]); }
}
function rabHop(R, up) {
  const y = up ? 0 : 3;
  R.e(5, 11 + y, 5, 4, RAB.fur[2]); R.e(4, 10 + y, 4, 3, RAB.fur[3]); R(1, 12 + y, 2, 2, RAB.fur[4]); R(2, 14 + y + (up ? 1 : 0), 6, 2, RAB.fur[1]);
  R(9, 13 + y, up ? 5 : 3, 2, RAB.fur[3]);
  R.e(10, 8 + y, 4, 3, RAB.fur[3]); R(13, 8 + y, 2, 2, RAB.ear); R(4, 1 + y, 6, 2, RAB.fur[2]); R(9, 2 + y, 2, 5, RAB.fur[3]); R(11, 7 + y, 1, 2, INK);
}
cd('sv4_pet_rabbit_sit_0', 17, 19, (R) => rabSit(R, 0), ink); cd('sv4_pet_rabbit_sit_1', 17, 19, (R) => rabSit(R, 1, { twitch: true }), ink);
cd('sv4_pet_rabbit_sit_b', 17, 19, (R) => rabSit(R, 0, { blink: true }), ink); cd('sv4_pet_rabbit_eat', 17, 19, (R) => rabSit(R, 0, { eat: true }), ink);
cd('sv4_pet_rabbit_hop_0', 17, 19, (R) => rabHop(R, true), ink); cd('sv4_pet_rabbit_hop_1', 17, 19, (R) => rabHop(R, false), ink);
cd('sv4_pet_rabbit_lie', 20, 11, (R) => { R.e(9, 6, 8, 4, RAB.fur[3]); R.e(8, 5, 6, 3, RAB.fur[4]); R.e(16, 6, 3, 3, RAB.fur[3]); R(15, 2, 4, 2, RAB.fur[2]); R(17, 3, 1, 1, INK); R(19, 6, 1, 1, '#d87a8a'); R(3, 7, 3, 3, RAB.fur[4]); }, ink);

const TUR = { shell: ['#2e5a34', '#3f7a46', '#58a05a', '#7ac074'], skin: ['#7a9a52', '#9ab86a'], line: '#1f3a24' };
function turtle(R, f, o = {}) {
  const neck = o.hide ? 0 : o.stretch ? 4 : 2, leg = f % 2;
  if (!o.hide) { R(1, 10 - (o.stretch ? 1 : 0), 1, 1, INK); R.e(2 + 0, 11, 2, 2, TUR.skin[1]); R(3, 11, 3 + neck, 2, TUR.skin[0]); R(3, 10, 2, 1, TUR.skin[1]); }
  R(5 + leg, 15, 3, 2, TUR.skin[0]); R(13 - leg, 15, 3, 2, TUR.skin[0]); R(18, 14, 3, 2, TUR.skin[0]);
  R.e(12, 11, 8, 6, TUR.shell[1]); R.e(11, 9, 7, 4, TUR.shell[2]); R.e(10, 8, 4, 2, TUR.shell[3]);
  R(7, 11, 10, 1, TUR.line); R(11, 6, 1, 8, TUR.line); R(15, 8, 1, 7, TUR.line); R(7, 14, 12, 1, TUR.shell[0]);
  if (!o.hide) R(2, 11, 1, 1, INK);
}
for (let f = 0; f < 2; f++) cd(`sv4_pet_genta_walk_${f}`, 22, 19, (R) => turtle(R, f), ink);
cd('sv4_pet_genta_stretch', 22, 19, (R) => turtle(R, 0, { stretch: true }), ink); cd('sv4_pet_genta_hide', 22, 19, (R) => turtle(R, 0, { hide: true }), ink);

const PAR = { body: [C.leaf[1], C.leaf[2], C.leaf[3], '#a8e060'], head: ['#e8c838', '#f4dc58', '#fff070'], wing: ['#2e6a3a', '#3f8a4a'], beak: C.coral[2] };
function parakeet(R, o = {}) {
  const wing = o.fly ? (o.up ? -5 : 3) : 0;
  R(1, 14, 3, 7, PAR.body[0]); R(0, 18, 3, 4, PAR.body[0]);
  R.e(8, 12, 5, 6, PAR.body[2]); R.e(7, 11, 4, 4, PAR.body[3]); R.e(11, 15, 3, 3, PAR.head[1]);
  R.e(10, 6, 4, 4, PAR.head[1]); R(8, 3, 4, 2, PAR.head[2]); R(13, 6, 2, 3, PAR.beak); R(11, 5, 1, 2, INK); R(10, 8, 3, 1, '#f08a98');
  if (o.fly) { R(2, 8 + wing, 7, 4, PAR.wing[1]); R(0, 9 + wing, 4, 2, PAR.wing[0]); R(5, 12, 4, 6, PAR.wing[1]); } else { R(4, 10, 6, 7, PAR.wing[1]); R(3, 14, 4, 3, PAR.wing[0]); R(6, 11, 3, 1, PAR.body[3]); }
  if (!o.fly) { R(8, 21, 1, 2, '#c89060'); R(11, 21, 1, 2, '#c89060'); if (o.sing) { R(14, 4, 1, 1, INK); } }
}
cd('sv4_pet_piyo_sit_0', 17, 24, (R) => parakeet(R), ink); cd('sv4_pet_piyo_sing', 17, 24, (R) => parakeet(R, { sing: true }), ink);
cd('sv4_pet_piyo_fly_0', 17, 24, (R) => parakeet(R, { fly: true, up: true }), ink); cd('sv4_pet_piyo_fly_1', 17, 24, (R) => parakeet(R, { fly: true }), ink);
cd('sv4_pet_perch', 18, 8, (R) => { R(0, 3, 18, 2, W[2]); R(0, 3, 18, 1, W[3]); }, flat);

// ---------------------------------------------------------------- accessory overlays (40x48 box, y in FRAME coordinates, 8px of headroom above)
// Misa's frame: head spans x 6..35, y 1..27 (eyes y 17..21, hairline ~y 14), hoodie starts at y 26.
// ACC[id] = { name, slot: 'hair'|'face'|'neck'|'head', price, c: colour ramp, draw(R, dir, c) } where dir is down|up|side (side faces right).
export const ACC = {};
const accDef = (id, name, slot, price, c, desc, draw) => { ACC[id] = { id, name, slot, price, c, desc, draw }; };
const bow = (R, x, y, c) => { R(x, y + 1, 4, 5, c[2]); R(x + 6, y + 1, 4, 5, c[2]); R(x + 4, y + 2, 2, 3, c[1]); R(x, y + 1, 4, 1, c[3]); R(x + 6, y + 1, 4, 1, c[3]); };
['red', 'blue', 'butter'].forEach((n, i) => {
  const r = [C.ribbon, C.sky, C.butter][i];
  accDef(`ribbon_${n}`, `${['Red', 'Blue', 'Lemon'][i]} hair ribbon`, 'hair', 160, r, 'A big bow tied in her hair.', (R, d, c) => { bow(R, d === 'side' ? 5 : 7, 3, c); });
});
accDef('hairclip_star', 'Star hairclip', 'hair', 120, C.butter, 'A tiny gold star clip.', (R, d, c) => { const x = d === 'side' ? 20 : 26, y = 5; R(x, y, 5, 2, c[3]); R(x + 1, y - 1, 3, 1, c[4]); R(x + 2, y + 2, 1, 1, c[2]); });
accDef('glasses_round', 'Round glasses', 'face', 220, C.charcoal, 'Thin round frames. Instantly studious.', (R, d, c) => {
  if (d === 'up') return;
  const f = c[2], tint = 'rgba(200,230,255,0.28)';
  if (d === 'down') { for (const x of [11, 23]) { R(x, 15, 7, 1, f); R(x, 21, 7, 1, f); R(x, 15, 1, 7, f); R(x + 6, 15, 1, 7, f); R(x + 1, 16, 5, 5, tint); } R(18, 17, 5, 1, f); R(8, 17, 3, 1, f); R(30, 17, 3, 1, f); }
  else { R(22, 15, 8, 1, f); R(22, 21, 8, 1, f); R(22, 15, 1, 7, f); R(29, 15, 1, 7, f); R(23, 16, 6, 5, tint); R(12, 17, 10, 1, f); }
});
accDef('glasses_sun', 'Sunglasses', 'face', 260, C.charcoal, 'Dark lenses for bright summer days.', (R, d, c) => {
  if (d === 'up') return;
  if (d === 'down') { R(10, 15, 9, 7, c[1]); R(22, 15, 9, 7, c[1]); R(19, 16, 3, 1, c[2]); R(10, 15, 3, 1, c[3]); R(22, 15, 3, 1, c[3]); R(8, 16, 2, 1, c[2]); R(31, 16, 2, 1, c[2]); }
  else { R(21, 15, 10, 7, c[1]); R(21, 15, 3, 1, c[3]); R(12, 16, 9, 1, c[2]); }
});
const scarf = (R, d, c) => {
  if (d === 'up') { R(10, 26, 21, 5, c[2]); R(10, 26, 21, 1, c[3]); R(10, 30, 21, 1, c[1]); return; }
  if (d === 'down') { R(11, 25, 19, 5, c[2]); R(11, 25, 19, 1, c[3]); R(11, 29, 19, 1, c[1]); R(23, 30, 5, 10, c[2]); R(23, 30, 1, 10, c[3]); R(23, 39, 5, 1, c[1]); for (let y = 32; y < 39; y += 3) R(24, y, 4, 1, c[1]); return; }
  R(13, 25, 15, 5, c[2]); R(13, 25, 15, 1, c[3]); R(13, 29, 15, 1, c[1]); R(10, 29, 5, 11, c[2]); R(10, 29, 1, 11, c[3]); R(10, 39, 5, 1, c[1]);
};
accDef('scarf_red', 'Red scarf', 'neck', 240, C.ribbon, 'A thick wool scarf, wound twice.', scarf);
accDef('scarf_sky', 'Sky scarf', 'neck', 240, C.sky, 'A light blue scarf for autumn walks.', scarf);
accDef('scarf_cream', 'Cream scarf', 'neck', 240, C.paper, 'Soft and warm, like a cloud.', scarf);
accDef('hat_sun', 'Straw sun hat', 'head', 320, C.butter, 'A wide-brimmed straw hat with a ribbon.', (R, d, c) => {
  R(10, -4, 21, 10, c[3]); R(10, -4, 21, 2, c[4]); R(10, 4, 21, 2, C.coral[2]); R(2, 6, 37, 3, c[3]); R(2, 6, 37, 1, c[4]); R(4, 9, 33, 2, c[2]); R(8, 11, 25, 1, c[1]);
});
['red', 'sky'].forEach((n, i) => {
  const r = [C.ribbon, C.sky][i];
  accDef(`hat_beanie_${n}`, `${['Red', 'Sky'][i]} beanie`, 'head', 200, r, 'A knitted beanie with a pom-pom.', (R, d, c) => {
    R.e(20, 4, 14, 8, c[2]); R(6, 6, 29, 6, c[2]); R(6, 11, 29, 3, c[3]); R(6, 11, 29, 1, c[4]); for (let x = 8; x < 34; x += 3) R(x, 6, 1, 5, c[1]); R.e(20, -5, 3, 3, WHITE);
  });
});
accDef('cat_ears', 'Cat-ear headband', 'head', 180, C.hairGinger, 'A headband with two fluffy cat ears. Mochi approves.', (R, d, c) => {
  R.t([8, 9], [10, -4], [16, 4], c[2]); R.t([32, 9], [30, -4], [24, 4], c[2]); R.t([10, 6], [11, -1], [14, 3], '#f0b8b8'); R.t([30, 6], [29, -1], [26, 3], '#f0b8b8');
  R(7, 7, 27, 2, C.charcoal[2]);
});
accDef('beret_pink', 'Pink beret', 'head', 220, C.hairPink, 'A jaunty beret, a little like Aunt Nori\'s.', (R, d, c) => {
  R.e(18, 4, 15, 6, c[2]); R.e(17, 2, 11, 3, c[3]); R(6, 8, 29, 2, c[1]); R(19, -3, 3, 3, c[1]);
});
export const ACC_IDS = Object.keys(ACC);
for (const a of Object.values(ACC)) for (const d of ['down', 'up', 'side']) {
  defineSprite(`sv4_acc_${a.id}_${d}`, 40, 48, (R0) => {
    const surf = { rect(x, y, w, h, c) { const x0 = Math.max(0, x), y0 = Math.max(0, y), x1 = Math.min(40, x + w), y1 = Math.min(48, y + h); if (x1 > x0 && y1 > y0) R0(x0, y0, x1 - x0, y1 - y0, c); } };
    a.draw(makeR(surf, 0, 8), d, a.c);
  }, { hd: true, outline: false });
}
void hash; void books; void foliage; void pot;
