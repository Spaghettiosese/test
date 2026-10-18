// Sprites for the creative hobbies: props placed in the world and the two phone icons.
import { defineSprite } from '../../art.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { spr } from '../town/lib.js';

spr('sv4h_stall', 62, 52, (R) => {
  R(3, 22, 4, 28, K.wood[1]); R(55, 22, 4, 28, K.wood[1]); R(2, 32, 58, 16, K.wood[2]); R(2, 32, 58, 2, K.wood[4]); R(2, 46, 58, 2, K.wood[0]);
  R(0, 6, 62, 16, K.ribbon[2]); for (let i = 0; i < 8; i++) R(i * 8, 6, 4, 16, K.paper[4]); R(0, 20, 62, 2, K.ribbon[0]);
  R(6, 24, 14, 8, K.paper[4]); R(8, 26, 10, 1, K.ink[3]); R(8, 28, 8, 1, K.ink[3]); R(24, 22, 10, 10, K.sky[3]); R(26, 24, 6, 4, K.paper[4]); R(38, 24, 6, 8, K.coral[3]); R(46, 26, 10, 6, K.butter[3]); R(48, 24, 2, 2, K.ink[2]);
});
spr('sv4h_kiln', 32, 44, (R) => {
  R(2, 18, 28, 24, K.stone[2]); R(2, 18, 28, 3, K.stone[4]); R(2, 40, 28, 2, K.stone[0]); R.e(16, 18, 14, 10, K.stone[3]); R.e(16, 17, 11, 7, K.stone[4]);
  R(8, 26, 16, 12, K.charcoal[1]); R(10, 28, 12, 8, K.coral[1]); R(12, 30, 8, 5, K.butter[2]); R(14, 2, 4, 10, K.metal[2]); R(13, 0, 6, 3, K.metal[3]);
});
spr('sv4h_wheel', 30, 28, (R) => {
  R(3, 12, 24, 14, K.wood[2]); R(3, 12, 24, 2, K.wood[4]); R(5, 24, 3, 4, K.wood[0]); R(22, 24, 3, 4, K.wood[0]);
  R.e(15, 11, 11, 4, K.metal[3]); R.e(15, 10, 8, 3, K.hairGinger ? K.hairGinger[2] : K.wood[3]); R(12, 3, 6, 6, K.hairGinger ? K.hairGinger[1] : K.wood[2]); R(14, 3, 2, 5, K.sand[3]);
});
spr('sv4h_loom', 34, 42, (R) => {
  R(2, 4, 4, 38, K.wood[1]); R(28, 4, 4, 38, K.wood[1]); R(2, 4, 30, 4, K.wood[3]); R(2, 34, 30, 4, K.wood[2]);
  for (let x = 8; x < 28; x += 3) R(x, 8, 1, 26, K.paper[4]);
  for (let y = 18; y < 32; y += 4) R(8, y, 20, 3, [K.coral[2], K.butter[3], K.sky[3], K.mint[3]][(y >> 2) % 4]);
});
spr('sv4h_keyboard', 40, 28, (R) => {
  R(2, 8, 36, 16, K.charcoal[1]); R(2, 8, 36, 2, K.charcoal[3]); R(4, 12, 32, 10, K.paper[4]); for (let x = 7; x < 36; x += 4) R(x, 12, 1, 10, K.paper[2]);
  for (const x of [6, 10, 18, 22, 26, 34]) R(x, 12, 3, 6, K.ink[1]); R(3, 22, 3, 5, K.metal[1]); R(34, 22, 3, 5, K.metal[1]);
});
spr('sv4h_gallery', 70, 34, (R) => {
  const fr = [[2, 4, 20, 24, K.sky[3]], [26, 2, 18, 18, K.coral[3]], [26, 22, 18, 10, K.butter[3]], [48, 4, 20, 24, K.mint[3]]];
  for (const [x, y, w, h, c] of fr) { R(x, y, w, h, K.wood[2]); R(x + 1, y + 1, w - 2, h - 2, K.paper[4]); R(x + 3, y + 3, w - 6, h - 6, c); R(x + 3, y + h - 8, w - 6, 3, K.forest[2]); }
  R(32, 8, 6, 6, K.butter[4]);
});
spr('sv4h_shelf', 36, 44, (R) => {
  R(2, 2, 32, 40, K.wood[1]); R(4, 4, 28, 36, K.wood[0]);
  for (let r = 0; r < 3; r++) { R(4, 14 + r * 12, 28, 2, K.wood[3]); for (let i = 0; i < 7; i++) R(5 + i * 4, 5 + r * 12, 3, 9, [K.coral[2], K.sky[3], K.butter[3], K.lilac[2], K.mint[3], K.ribbon[2], K.paper[3]][(i + r * 2) % 7]); }
  R(10, 0, 16, 3, K.butter[3]);
});
spr('sv4h_desk', 34, 30, (R) => {
  R(2, 10, 30, 6, K.wood[3]); R(2, 10, 30, 1, K.wood[4]); R(3, 16, 3, 12, K.wood[1]); R(28, 16, 3, 12, K.wood[1]);
  R(8, 5, 12, 6, K.paper[4]); R(10, 7, 8, 1, K.ink[3]); R(10, 9, 6, 1, K.ink[3]); R(24, 2, 2, 8, K.ribbon[2]); R(23, 0, 4, 3, K.paper[4]);
});
spr('sv4h_busk', 36, 22, (R) => {
  R(2, 4, 32, 16, K.lilac[2]); R(2, 4, 32, 2, K.lilac[3]); R(4, 6, 28, 12, K.lilac[1]); R(7, 9, 22, 6, K.butter[3]); R.e(18, 12, 6, 3, K.coral[3]);
}, { outline: false });
spr('sv4h_flower_stand', 48, 38, (R) => {
  R(2, 18, 44, 18, K.wood[2]); R(2, 18, 44, 2, K.wood[4]); R(3, 34, 3, 4, K.wood[0]); R(42, 34, 3, 4, K.wood[0]);
  for (let i = 0; i < 5; i++) { const x = 6 + i * 8, c = [K.coral[3], K.butter[3], K.lilac[3], K.sky[3], K.ribbon[2]][i]; R(x + 2, 8, 2, 12, K.forest[3]); R.e(x + 3, 7, 4, 4, c); R(x + 2, 6, 2, 2, K.butter[4]); }
  R(2, 12, 44, 3, K.ribbon[1]);
});
defineSprite('sv4h_i_album', 12, 11, (R0) => { const R = R0.at(1, 1); R(0, 1, 10, 8, '#2b1d2e'); R(1, 2, 8, 6, K.sky[3]); R(1, 6, 8, 2, K.forest[2]); R(6, 3, 2, 2, K.butter[3]); R(0, 0, 10, 1, K.paper[4]); }, false, true);
defineSprite('sv4h_i_journal', 12, 11, (R0) => { const R = R0.at(1, 1); R(1, 0, 8, 9, '#2b1d2e'); R(2, 1, 6, 7, K.ribbon[2]); R(2, 1, 1, 7, K.ribbon[1]); R(4, 3, 3, 1, K.paper[4]); R(4, 5, 3, 1, K.paper[4]); R(7, 0, 2, 4, K.butter[3]); }, false, true);
