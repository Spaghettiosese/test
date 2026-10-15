// Beach, cliffs, cave, shrine, lighthouse and Sunny Pines props (hd, 32 px per tile, light from the top-left).
// Uses town's clipped sprite helper spr(name, w, h, (R, M, season) => ..., { seasonal, outline }).
import { spr, signText, line } from '../town/lib.js';
import { RAMPS as C } from '../../gfx/palette.js';
import { hash, bayer } from '../../gfx/noise.js';

const INK = '#2a1a22', W = C.wood, WD = C.woodDark, S = C.stone, P = C.paper, MT = C.metal, CH = C.charcoal, SA = C.sand, WA = C.water, V = C.vermilion;
const px = (R, x, y, c) => R(x, y, 1, 1, c);
const dith = (R, x, y, w, h, c, a) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (bayer(x + i, y + j) < a) R(x + i, y + j, 1, 1, c); };
const flat = { outline: false };
const box = (R, x, y, w, h, top, r) => { R(x, y, w, top, r[3]); R(x, y, w, 1, r[4]); R(x, y + top, w, h - top, r[2]); R(x + w - 2, y + top, 2, h - top, r[1]); R(x, y + h - 1, w, 1, r[1]); };

// ======================= BEACH =======================
for (const [k, A] of [['a', C.coral], ['b', C.mint]]) {
  spr(`coast_umbrella_${k}`, 56, 64, (R) => {
    R(27, 18, 2, 46, WD[2]); R(27, 18, 1, 46, W[4]);
    R.e(28, 16, 27, 11, A[2]);
    for (let i = 0; i < 6; i++) R.t([28, 4], [2 + i * 9, 18], [7 + i * 9, 19], i % 2 ? P[4] : A[2]);
    R.e(22, 10, 12, 4, A[3]); R.e(20, 9, 6, 2, A[4]);
    for (let x = 2; x < 55; x += 4) { R(x, 25, 3, 1, A[1]); px(R, x + 1, 26, A[1]); }
    R(26, 2, 4, 3, A[1]);
  });
  spr(`coast_towel_${k}`, 28, 46, (R) => {
    R(0, 0, 28, 46, P[4]); for (let y = 0; y < 46; y += 10) R(0, y, 28, 5, A[2]); R(0, 0, 28, 1, A[3]); R(27, 0, 1, 46, A[1]);
    for (let x = 1; x < 28; x += 3) { px(R, x, 45, A[1]); }
  }, flat);
}
spr('coast_umbrella_shade', 60, 22, (R) => R.e(30, 11, 29, 10, '#2a1a4038'), flat);
spr('coast_ice_stand', 90, 82, (R) => {
  const B = C.sky;
  R(6, 22, 4, 40, W[2]); R(80, 22, 4, 40, W[1]);
  R(0, 10, 90, 14, P[4]); for (let x = 0; x < 90; x += 12) { for (let i = 0; i < 12; i++) px(R, x + i, 16 + Math.round(Math.sin(i * 0.55) * 2), B[2]); } R(0, 10, 90, 2, B[3]);
  for (let x = 0; x < 90; x += 6) { R(x, 24, 6, 1, B[2]); R(x + 1, 25, 4, 1, B[2]); }
  R(0, 6, 90, 4, W[2]); R(0, 6, 90, 1, W[3]);
  box(R, 2, 52, 86, 28, 10, W); for (let x = 8; x < 86; x += 14) R(x, 64, 8, 12, W[1]);
  // flag: a white banner with blue waves and a red mark (the shaved-ice flag)
  R(70, 0, 2, 50, WD[2]); R(72, 26, 16, 22, P[4]); R(74, 29, 12, 9, C.ribbon[2]); R(76, 31, 8, 5, P[4]); R(79, 30, 2, 7, C.ribbon[2]);
  for (let i = 0; i < 16; i++) px(R, 72 + i, 42 + Math.round(Math.sin(i * 0.8) * 1.5), B[2]); R(72, 45, 16, 3, B[2]);
  // cups of shaved ice: strawberry, melon, blue
  for (const [x, c] of [[12, C.ribbon[3]], [26, C.forest[3]], [40, B[3]]]) { R(x, 46, 8, 6, P[3]); R(x, 51, 8, 1, P[1]); R.e(x + 4, 44, 5, 4, P[4]); R.e(x + 4, 43, 4, 2, c); px(R, x + 2, 41, P[4]); }
  // crank ice machine
  R(52, 32, 14, 20, MT[2]); R(52, 32, 14, 2, MT[3]); R(54, 36, 10, 8, B[4]); R(64, 30, 6, 2, MT[1]); R(68, 26, 2, 6, C.ribbon[2]);
}, {});
spr('coast_driftwood', 62, 18, (R) => {
  R.e(30, 10, 28, 5, S[3]); R.e(28, 9, 24, 3, S[4]); R(4, 12, 54, 2, S[2]);
  line(R, 40, 9, 54, 2, S[3], 2); line(R, 14, 10, 6, 3, S[3], 2); R(5, 2, 3, 2, S[4]);
  for (let x = 8; x < 54; x += 7) R(x, 9, 4, 1, S[2]); R.e(58, 10, 3, 3, S[2]);
}, {});
spr('coast_driftwood_s', 34, 14, (R) => { R.e(16, 8, 15, 4, S[3]); R.e(15, 7, 12, 2, S[4]); R(4, 10, 26, 1, S[2]); line(R, 22, 7, 30, 1, S[3], 2); }, {});
function pit(R) {
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, x = 20 + Math.round(Math.cos(a) * 17), y = 26 + Math.round(Math.sin(a) * 7); R.e(x, y, 4, 3, S[2 + (i % 2)]); px(R, x - 1, y - 2, S[4]); }
  R.e(20, 26, 12, 4, CH[1]); dith(R, 9, 24, 22, 5, CH[2], 0.4);
  line(R, 10, 30, 28, 22, WD[2], 3); line(R, 10, 22, 30, 30, WD[1], 3); px(R, 12, 29, WD[3]); px(R, 27, 23, WD[3]);
}
spr('coast_bonfire_off', 40, 36, (R) => pit(R), {});
for (let f = 0; f < 3; f++) spr(`coast_bonfire_${f}`, 40, 36, (R) => {
  pit(R);
  const o = [0, 2, -2][f], O = C.leafAutumn, Y = C.butter;
  R.t([10, 26], [20 + o, 2 + f * 2], [30, 26], O[2]); R.t([13, 26], [16 - o, 8], [22, 26], O[3]); R.t([18, 26], [25 + o, 10 - f], [29, 26], O[3]);
  R.t([14, 26], [20 - o, 12 + f], [26, 26], Y[2]); R.t([17, 26], [20, 17], [23, 26], Y[4]);
  px(R, 14 + f * 4, 6 - f, Y[3]); px(R, 26 - f * 3, 3 + f, O[3]);
}, {});
const castle = (R0, st) => {
  const R = (x, y, w, h, c) => R0(x, y + 10, w, h, c); R.e = (x, y, rx, ry, c) => R0.e(x, y + 10, rx, ry, c);
  R.e(17, 25, 16, 4, SA[2]); R.e(16, 24, 13, 3, SA[3]);
  box(R, 6, 12, 22, 14, 4, SA);
  for (let x = 6; x < 28; x += 4) R(x, 10, 2, 2, SA[3]);
  R(14, 18, 6, 8, SA[1]); R.e(17, 18, 3, 2, SA[1]);
  if (st >= 2) { box(R, 2, 6, 8, 20, 3, SA); box(R, 24, 6, 8, 20, 3, SA); R(3, 3, 2, 3, SA[3]); R(7, 3, 2, 3, SA[3]); R(25, 3, 2, 3, SA[3]); R(29, 3, 2, 3, SA[3]); }
  if (st >= 3) { box(R, 13, 0, 8, 12, 3, SA); R(17, -8, 1, 8, WD[2]); R(18, -8, 6, 4, C.coral[2]); px(R, 9, 22, C.coral[3]); px(R, 26, 21, P[4]); R(20, 22, 2, 2, C.lilac[3]); }
};
for (let s = 1; s <= 3; s++) spr(`coast_castle_${s}`, 34, 40, (R) => castle(R, s), {});
function rock(R, w, h, seed) {
  const cx = w / 2;
  R.e(cx, h - h / 2, cx - 1, h / 2 - 1, S[2]);
  R.e(cx - w / 8, h / 2 - h / 8, cx - w / 4, h / 3, S[3]); R.e(cx - w / 5, h / 3, w / 6, h / 6, S[4]);
  R(2, h - 5, w - 4, 3, CH[2]); dith(R, 2, h - 8, w - 4, 4, C.forest[1], 0.35);
  for (let i = 0; i < 6; i++) { const x = 4 + Math.floor(hash(i, seed, 3) * (w - 8)), y = h / 2 + Math.floor(hash(i, seed, 4) * (h / 3)); px(R, x, y, P[3]); px(R, x + 1, y, S[1]); }
}
spr('coast_rock_s', 24, 16, (R) => rock(R, 24, 16, 1), {});
spr('coast_rock_m', 38, 26, (R) => rock(R, 38, 26, 2), {});
spr('coast_rock_l', 62, 40, (R) => rock(R, 62, 40, 3), {});
const pool = (R, glow) => {
  R.e(28, 18, 27, 16, S[2]); R.e(27, 16, 25, 13, S[3]);
  R.e(28, 19, 21, 11, glow ? C.mint[1] : WA[2]); R.e(27, 18, 19, 9, glow ? C.mint[2] : WA[3]); R(12, 15, 30, 1, WA[4]);
  R(18, 22, 3, 3, C.coral[2]); px(R, 19, 21, C.coral[3]); px(R, 17, 23, C.coral[3]); px(R, 21, 23, C.coral[3]);
  R(34, 19, 2, 2, C.butter[2]); R(32, 20, 6, 1, C.butter[2]); R(35, 17, 1, 6, C.butter[2]);
  R.e(26, 25, 3, 1, C.lilac[2]); R(40, 22, 2, 2, C.forest[3]);
  for (let i = 0; i < 9; i++) { const a = i * 0.7; px(R, 28 + Math.round(Math.cos(a) * 25), 18 + Math.round(Math.sin(a) * 14), S[4]); }
  if (glow) for (let i = 0; i < 7; i++) px(R, 12 + Math.floor(hash(i, 2, 7) * 30), 13 + Math.floor(hash(i, 3, 7) * 12), C.mint[4]);
};
spr('coast_tidepool', 56, 36, (R) => pool(R, false), {});
spr('coast_cavepool', 56, 36, (R) => pool(R, true), {});
spr('coast_sandbar', 32, 32, (R) => {
  R(0, 0, 32, 32, SA[2]); dith(R, 0, 0, 32, 32, SA[1], 0.25);
  for (let i = 0; i < 5; i++) { const x = Math.floor(hash(i, 4, 9) * 26), y = Math.floor(hash(i, 5, 9) * 26); R.e(x + 3, y + 2, 3, 1, WA[3]); px(R, x + 2, y + 1, WA[4]); }
  for (let i = 0; i < 3; i++) R(Math.floor(hash(i, 6, 9) * 28), Math.floor(hash(i, 7, 9) * 28), 3, 1, SA[3]);
}, flat);
spr('coast_dunegrass', 22, 18, (R, M) => {
  const G = M.grass;
  for (let i = 0; i < 7; i++) { const x = 2 + i * 3, h = 8 + Math.floor(hash(i, 1, 5) * 8); line(R, x, 17, x + (i % 2 ? 2 : -1), 17 - h, i % 2 ? G[2] : G[3]); px(R, x + (i % 2 ? 2 : -1), 17 - h, G[4]); }
  R(1, 16, 20, 2, SA[1]);
}, { seasonal: true });
spr('coast_rope_fence', 32, 22, (R) => {
  for (const x of [2, 28]) { R(x, 4, 3, 18, W[2]); R(x, 4, 1, 18, W[3]); R(x, 3, 3, 1, W[4]); }
  for (let x = 4; x < 29; x++) { const y = 7 + Math.round(Math.sin(((x - 4) / 24) * Math.PI) * 3); px(R, x, y, W[1]); px(R, x, y + 7, W[1]); }
}, {});
spr('coast_stairs', 32, 64, (R) => {
  for (let s = 0; s < 8; s++) { const y = s * 8; R(2, y, 28, 8, W[3]); R(2, y, 28, 2, W[4]); R(2, y + 6, 28, 2, W[1]); px(R, 4, y + 3, WD[1]); px(R, 27, y + 3, WD[1]); }
  R(0, 0, 3, 64, WD[2]); R(29, 0, 3, 64, WD[1]);
}, flat);

// Cliffs (baked into the ground): rim with a grass lip, rock face with strata, wet base.
for (const part of ['rim', 'face', 'base']) for (let v = 0; v < 3; v++) spr(`coast_cliff_${part}_${v}`, 32, 32, (R, M) => {
  R(0, 0, 32, 32, S[2]);
  for (let r = 0; r < 4; r++) {
    const y = r * 8 + ((v + r) % 2) * 2;
    for (let x = -8; x < 32; x += 10 + ((r + v) % 3) * 2) { const t = hash(x + v * 9, r, 13) > 0.5 ? 3 : 2; R(x + 1, y, 9, 7, S[t]); R(x + 1, y, 9, 1, S[t + 1]); R(x + 9, y + 1, 1, 6, S[1]); }
    R(0, y + 7, 32, 1, S[1]);
  }
  dith(R, 0, 0, 32, 32, C.dirt[1], 0.12);
  if (part === 'rim') { const G = M.grass; for (let x = 0; x < 32; x++) { const h = 4 + Math.round(hash(x >> 1, v, 17) * 3); R(x, 0, 1, h, G[3]); px(R, x, h, G[1]); px(R, x, 0, G[4]); } }
  if (part === 'base') { R(0, 26, 32, 6, S[1]); dith(R, 0, 22, 32, 6, C.forest[1], 0.35); R(0, 30, 32, 2, CH[1]); }
}, { seasonal: true, outline: false });

// The cave mouth in the headland cliff (dry at low tide, flooded at high tide).
for (const wet of [0, 1]) spr(`coast_cave_mouth${wet ? '_wet' : ''}`, 64, 62, (R) => {
  R.e(32, 40, 29, 30, S[1]); R.e(32, 42, 24, 26, CH[1]); R.e(32, 46, 19, 22, CH[0]); R(8, 46, 48, 16, CH[0]);
  for (let i = 0; i < 8; i++) R(10 + i * 6, 16 + (i % 3) * 3, 2, 4 + (i % 2) * 3, S[2]);
  R.e(18, 26, 6, 3, S[3]); R.e(46, 24, 5, 2, S[3]);
  if (wet) { R(8, 50, 48, 12, WA[2]); for (let x = 8; x < 56; x++) if ((x * 7) % 5 < 2) px(R, x, 50 + ((x >> 2) % 2), WA[4]); R(8, 60, 48, 2, WA[1]); }
  else { R(10, 52, 44, 10, SA[1]); dith(R, 10, 52, 44, 10, SA[2], 0.3); }
}, flat);

// Lighthouse exterior on the headland (dark until the lantern is lit).
for (const lit of [0, 1]) spr(`coast_lighthouse${lit ? '_lit' : ''}`, 80, 186, (R) => {
  const top = 62, bot = 176, Rb = C.ribbon;
  for (let y = top; y < bot; y++) {
    const half = Math.round(18 + ((y - top) / (bot - top)) * 10), x0 = 40 - half, band = Math.floor((y - top) / 19) % 2 === 1;
    const base = band ? Rb : P;
    R(x0, y, half * 2, 1, base[3]); R(x0, y, 4, 1, base[4]); R(40 + half - 9, y, 9, 1, base[2]); R(40 + half - 3, y, 3, 1, base[1]);
  }
  R(10, 176, 60, 9, S[2]); R(10, 176, 60, 2, S[4]); R(66, 178, 4, 7, S[1]);
  // door + windows
  R(32, 150, 16, 26, WD[1]); R(33, 151, 14, 25, lit ? W[2] : WD[2]); R(34, 152, 12, 1, WD[3]); px(R, 44, 164, C.butter[2]); R(30, 148, 20, 3, S[3]);
  for (const y of [86, 120]) { R(36, y, 8, 11, WD[1]); R(37, y + 1, 6, 9, lit ? C.butter[3] : C.sky[1]); R(37, y + 1, 6, 2, lit ? C.butter[4] : C.sky[2]); }
  // gallery + railing
  R(6, 54, 68, 8, CH[2]); R(6, 54, 68, 2, CH[3]); R(6, 61, 68, 2, CH[1]);
  R(6, 44, 68, 2, CH[2]); for (let x = 6; x < 74; x += 6) R(x, 44, 1, 10, CH[2]);
  // lamp room
  R(22, 22, 36, 32, CH[1]);
  for (let x = 24; x < 56; x += 8) { R(x, 24, 7, 28, lit ? C.butter[3] : C.sky[1]); R(x, 24, 7, 6, lit ? C.butter[4] : C.sky[2]); }
  if (lit) { R.e(40, 38, 7, 7, P[4]); R(39, 26, 2, 24, P[4]); R(29, 37, 22, 2, P[4]); }
  else { R.e(40, 40, 6, 6, C.sky[0]); px(R, 37, 37, C.sky[3]); }
  R(20, 52, 40, 3, CH[2]);
  // dome, vent, weathervane
  R.e(40, 22, 21, 13, CH[2]); R(19, 22, 42, 2, CH[1]); R.e(34, 16, 9, 6, CH[3]); R(37, 6, 6, 4, CH[1]); R(39, 0, 2, 7, MT[2]); R(34, 2, 12, 1, MT[2]); px(R, 46, 1, C.butter[2]);
}, {});

// ======================= CAVE =======================
for (let v = 0; v < 3; v++) {
  spr(`coast_cave_top_${v}`, 32, 32, (R) => { R(0, 0, 32, 32, CH[1]); for (let i = 0; i < 14; i++) { const x = Math.floor(hash(i, v, 21) * 30), y = Math.floor(hash(i, v, 22) * 30); R(x, y, 2 + (i % 3), 1, i % 4 ? CH[2] : S[1]); } dith(R, 0, 0, 32, 32, CH[0], 0.18); }, flat);
  spr(`coast_cave_face_${v}`, 32, 32, (R) => {
    R(0, 0, 32, 32, S[1]);
    for (let r = 0; r < 4; r++) for (let x = -6 + ((r + v) % 2) * 5; x < 32; x += 11) { R(x + 1, r * 8, 9, 7, r < 2 ? S[2] : S[1]); R(x + 1, r * 8, 9, 1, r < 2 ? S[3] : S[2]); }
    R(0, 0, 32, 3, CH[1]); R(0, 28, 32, 4, CH[1]); dith(R, 0, 22, 32, 6, C.mint[0], 0.2 + v * 0.05);
    R(6 + v * 7, 3, 2, 5, S[3]); px(R, 7 + v * 7, 8, WA[4]);
  }, flat);
}
spr('coast_stalagmite', 20, 30, (R) => { R.t([2, 29], [10, 0], [18, 29], S[2]); R.t([4, 29], [9, 4], [10, 29], S[3]); R(2, 27, 16, 2, S[1]); px(R, 8, 8, S[4]); }, {});
spr('coast_crystal', 26, 24, (R) => {
  const L = C.lilac;
  R.t([3, 23], [7, 6], [11, 23], L[2]); R.t([9, 23], [14, 0], [19, 23], L[3]); R.t([16, 23], [21, 9], [24, 23], L[2]);
  R(13, 4, 1, 16, L[4]); R(6, 12, 1, 8, L[4]); R(1, 22, 24, 2, S[1]);
}, {});
spr('coast_star_mark', 40, 32, (R) => {
  R(0, 2, 40, 30, S[2]); R(0, 2, 40, 2, S[3]);
  const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 5 : 12; pts.push([20 + Math.round(Math.cos(a) * r), 16 + Math.round(Math.sin(a) * r)]); }
  for (let i = 0; i < 10; i++) { const [a, b] = pts[i], [c, d] = pts[(i + 1) % 10]; line(R, a, b, c, d, S[0]); line(R, a + 1, b + 1, c + 1, d + 1, S[3]); }
  signText(R, 'HA', 15, 26, S[0]);
  px(R, 20, 16, C.butter[2]);
}, flat);

// ======================= SHRINE =======================
spr('coast_torii', 128, 116, (R) => {
  const VV = V;
  for (const x of [14, 104]) { R(x, 30, 10, 78, VV[2]); R(x, 30, 3, 78, VV[3]); R(x + 8, 30, 2, 78, VV[1]); R(x - 2, 104, 14, 10, CH[2]); R(x - 2, 104, 14, 2, CH[3]); }
  R(4, 34, 120, 8, VV[2]); R(4, 34, 120, 2, VV[3]); R(4, 41, 120, 1, VV[1]);           // nuki
  R(6, 12, 116, 10, VV[2]); R(6, 12, 116, 2, VV[3]); R(6, 21, 116, 1, VV[0]);          // shimaki
  R(0, 4, 128, 8, CH[2]); R(0, 4, 128, 2, CH[3]); R.t([0, 4], [0, 0], [10, 4], CH[2]); R.t([118, 4], [127, 0], [127, 4], CH[2]); // kasagi
  R(56, 22, 16, 12, CH[2]); R(58, 24, 12, 8, C.butter[1]); R(60, 26, 8, 4, C.butter[2]);  // plaque
  R(18, 108, 2, 6, CH[1]);
}, {});
spr('coast_steps', 32, 32, (R, M) => {
  for (let s = 0; s < 4; s++) { const y = s * 8; R(0, y, 32, 8, S[3]); R(0, y, 32, 3, S[4]); px(R, 0, y, S[5]); R(0, y + 6, 32, 2, S[1]); for (let x = 0; x < 32; x += 11) R(x + ((s * 5) % 9), y + 3, 1, 3, S[2]); }
  dith(R, 0, 0, 3, 32, M.grass[2], 0.4); dith(R, 29, 0, 3, 32, M.grass[1], 0.4);
}, { seasonal: true, outline: false });
for (const lit of [0, 1]) spr(`coast_lantern${lit ? '_lit' : ''}`, 22, 50, (R) => {
  R(3, 44, 16, 5, S[2]); R(3, 44, 16, 1, S[4]); R(8, 26, 6, 18, S[3]); R(8, 26, 2, 18, S[4]); R(13, 26, 1, 18, S[1]);
  R(4, 22, 14, 4, S[3]); R(4, 22, 14, 1, S[4]);
  R(5, 12, 12, 10, S[2]); R(8, 14, 6, 6, lit ? C.butter[3] : CH[1]); if (lit) R(9, 15, 4, 3, P[4]);
  R.t([0, 12], [11, 4], [21, 12], S[3]); R(1, 11, 20, 2, S[2]); R.t([3, 11], [11, 5], [11, 11], S[4]); R(10, 0, 3, 4, S[3]);
}, {});
spr('coast_hall', 224, 168, (R) => {
  const RT = C.roofTeal;
  // stone base + veranda
  R(8, 146, 208, 20, S[2]); R(8, 146, 208, 3, S[4]); for (let x = 8; x < 216; x += 26) R(x, 149, 1, 17, S[1]);
  R(12, 132, 200, 14, W[2]); R(12, 132, 200, 2, W[4]); R(12, 144, 200, 2, W[1]);
  R(92, 146, 40, 20, W[3]); for (let y = 148; y < 166; y += 5) { R(92, y, 40, 1, W[1]); R(92, y + 1, 40, 1, W[4]); }
  // walls: lattice doors between vermilion pillars
  R(20, 74, 184, 58, WD[2]);
  for (let i = 0; i < 4; i++) { const x = 30 + i * 44; R(x, 80, 34, 52, W[3]); for (let gx = x + 2; gx < x + 34; gx += 5) R(gx, 80, 1, 52, W[1]); for (let gy = 82; gy < 132; gy += 6) R(x, gy, 34, 1, W[1]); }
  for (const x of [20, 64, 108, 152, 196]) { R(x, 74, 8, 58, V[2]); R(x, 74, 2, 58, V[3]); R(x + 6, 74, 2, 58, V[1]); }
  R(20, 70, 184, 6, V[2]); R(20, 70, 184, 1, V[3]);
  // roof: sweeping copper-green with curved eaves, seen from above
  R.t([0, 72], [24, 52], [24, 72], RT[1]); R.t([200, 52], [223, 72], [200, 72], RT[1]);
  R(24, 14, 176, 58, RT[2]);
  for (let x = 26; x < 200; x += 6) { R(x, 18, 1, 54, RT[3]); R(x + 4, 18, 1, 54, RT[1]); }
  for (let y = 26; y < 70; y += 11) { R(24, y, 176, 1, RT[0]); R(24, y - 1, 176, 1, RT[3]); }
  R(0, 70, 224, 4, RT[0]); R(10, 66, 204, 4, RT[2]);
  R(24, 6, 176, 10, CH[2]); R(24, 6, 176, 2, CH[3]); R(24, 15, 176, 1, CH[1]);       // ridge
  for (const x of [60, 92, 124, 156]) { R(x, 0, 8, 6, CH[3]); R(x, 0, 8, 1, CH[4]); }  // katsuogi
  R.t([14, 10], [6, 0], [10, 0], CH[2]); R.t([210, 10], [214, 0], [218, 0], CH[2]); // chigi
  R(16, 6, 6, 8, CH[2]); R(202, 6, 6, 8, CH[2]);
  // shimenawa rope with shide paper zigzags
  for (let x = 40; x < 184; x++) { const y = 82 + Math.round(Math.sin(((x - 40) / 144) * Math.PI) * 8); R(x, y, 1, 5, W[4]); px(R, x, y + (x % 3), W[2]); px(R, x, y + 4, W[1]); }
  for (const x of [60, 90, 134, 164]) { const y = 92 + Math.round(Math.sin(((x - 40) / 144) * Math.PI) * 8) - 4; R(x, y, 4, 3, P[4]); R(x + 2, y + 3, 4, 3, P[4]); R(x, y + 6, 4, 3, P[4]); }
  // plaque
  R(98, 40, 28, 16, WD[1]); R(100, 42, 24, 12, WD[2]); R(103, 45, 18, 6, C.butter[2]);
}, {});
spr('coast_offering_box', 46, 32, (R) => {
  box(R, 1, 4, 44, 27, 9, W); for (let x = 4; x < 44; x += 5) R(x, 5, 3, 7, WD[0]);
  R(1, 3, 44, 2, WD[2]); R(18, 18, 10, 8, C.butter[2]); R(20, 20, 6, 4, C.butter[3]); R(1, 28, 44, 3, WD[1]);
}, {});
spr('coast_bell_rope', 24, 84, (R) => {
  R.e(12, 9, 9, 8, C.butter[2]); R.e(10, 6, 5, 4, C.butter[3]); R(5, 12, 14, 2, C.butter[1]); R(10, 15, 4, 2, CH[2]); px(R, 9, 5, P[4]);
  for (let y = 16; y < 78; y++) { R(9, y, 6, 1, (y >> 1) % 3 === 0 ? P[4] : (y >> 1) % 3 === 1 ? V[2] : V[3]); px(R, 14, y, V[1]); }
  R(6, 76, 12, 6, V[1]); for (let x = 6; x < 18; x += 2) R(x, 80, 1, 3, V[2]);
}, {});
for (let n = 0; n < 4; n++) spr(`coast_ema_${n}`, 72, 60, (R) => {
  R(4, 18, 4, 42, WD[2]); R(64, 18, 4, 42, WD[1]);
  R(0, 4, 72, 6, WD[2]); R(0, 4, 72, 1, WD[3]); R.t([0, 4], [36, 0], [71, 4], WD[3]);
  R(4, 12, 64, 2, WD[1]); R(4, 26, 64, 2, WD[1]); R(4, 40, 64, 2, WD[1]);
  const count = 10 + n * 4;
  for (let i = 0; i < count; i++) {
    const row = i % 3, col = Math.floor(i / 3), x = 7 + ((col * 11 + row * 5) % 56), y = 14 + row * 14;
    R(x, y, 9, 8, W[4]); R(x, y + 7, 9, 1, W[2]); px(R, x + 4, y - 1, V[2]);
    R(x + 2, y + 3, 5, 1, [C.coral[2], C.sky[1], INK, C.forest[2]][i % 4]); if (i % 3 === 0) R.e(x + 4, y + 5, 1, 1, C.coral[2]);
    if (i >= 10) R(x + 1, y + 1, 7, 1, C.butter[3]);
  }
}, {});
spr('coast_omikuji', 36, 52, (R) => {
  R(4, 22, 28, 30, W[2]); R(4, 22, 28, 2, W[4]); R(30, 24, 2, 28, W[1]);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { R(7 + c * 6, 26 + r * 8, 5, 6, W[3]); px(R, 9 + c * 6, 29 + r * 8, WD[1]); }
  R(4, 50, 28, 2, W[1]);
  R(8, 4, 20, 18, V[2]); R(8, 4, 5, 18, V[3]); R(25, 4, 3, 18, V[1]); R(8, 2, 20, 3, CH[2]); R(16, 0, 3, 3, W[4]); R(13, 10, 10, 6, P[4]);
}, {});
for (let n = 0; n < 4; n++) spr(`coast_fortune_rope_${n}`, 64, 40, (R) => {
  for (const x of [2, 58]) { R(x, 4, 4, 36, WD[2]); R(x, 4, 1, 36, WD[3]); R(x, 2, 4, 2, WD[3]); }
  for (const y of [10, 22]) for (let x = 6; x < 58; x++) px(R, x, y + Math.round(Math.sin(((x - 6) / 52) * Math.PI) * 2), W[1]);
  const k = 12 + n * 6;
  for (let i = 0; i < k; i++) { const x = 8 + ((i * 7) % 48), y = (i % 2 ? 22 : 10) + Math.round(Math.sin(((x - 6) / 52) * Math.PI) * 2); R(x, y - 1, 3, 2, P[4]); R(x + 1, y + 1, 2, 4, P[3]); }
}, {});
spr('coast_chozuya', 62, 46, (R) => {
  for (const x of [2, 56]) { R(x, 10, 4, 36, W[2]); R(x, 10, 1, 36, W[3]); }
  R(0, 4, 62, 7, WD[2]); R(0, 4, 62, 2, WD[3]); R.t([0, 4], [31, 0], [61, 4], WD[3]);
  R(10, 28, 42, 16, S[3]); R(10, 28, 42, 3, S[4]); R(12, 31, 38, 5, WA[3]); R(14, 32, 20, 1, WA[4]); R(48, 31, 2, 13, S[1]);
  R(44, 18, 10, 3, C.forest[3]); px(R, 44, 21, WA[4]); px(R, 44, 24, WA[4]);
  for (let i = 0; i < 3; i++) { line(R, 16 + i * 8, 30, 22 + i * 8, 23, W[3]); R(14 + i * 8, 29, 4, 3, W[4]); }
}, {});
spr('coast_komainu', 28, 40, (R) => {
  R(2, 28, 24, 11, S[2]); R(2, 28, 24, 2, S[4]); R(23, 30, 3, 9, S[1]);
  R.e(14, 22, 9, 7, S[3]); R.e(17, 12, 8, 8, S[3]); R.e(15, 9, 5, 4, S[4]);
  for (let i = 0; i < 4; i++) R.e(10 + i * 4, 6 + (i % 2), 2, 2, S[2]);
  R(19, 13, 2, 2, CH[1]); R(21, 16, 4, 2, S[1]); R(5, 18, 4, 4, S[2]); px(R, 6, 17, S[4]);
  R(8, 25, 4, 4, S[2]); R(18, 25, 4, 4, S[2]); R.e(22, 24, 3, 2, S[4]);
}, {});
spr('coast_office', 116, 92, (R) => {
  R(0, 0, 116, 26, C.roofTeal[2]); for (let x = 2; x < 116; x += 6) { R(x, 0, 1, 26, C.roofTeal[3]); R(x + 4, 0, 1, 26, C.roofTeal[1]); } R(0, 24, 116, 3, C.roofTeal[0]);
  R(4, 27, 108, 63, P[3]); R(4, 27, 108, 3, P[1]); R(4, 27, 4, 63, V[2]); R(108, 27, 4, 63, V[1]); R(4, 84, 108, 6, W[2]);
  R(14, 38, 66, 34, WD[2]); R(16, 40, 62, 28, W[4]);
  for (let i = 0; i < 8; i++) { const x = 20 + i * 7; R(x, 46, 5, 8, [C.ribbon[2], C.sky[2], C.butter[2], C.forest[2]][i % 4]); R(x + 1, 48, 3, 1, C.butter[3]); R(x + 2, 44, 1, 2, P[4]); }
  R(16, 60, 62, 8, W[2]); R(16, 60, 62, 1, W[3]);
  for (let i = 0; i < 3; i++) { R(84 + i * 7, 32, 6, 22, V[2]); R(84 + i * 7, 32, 6, 2, V[3]); } R(86, 40, 16, 3, P[4]);
}, {});
spr('coast_rail', 32, 24, (R) => {
  for (const x of [1, 27]) { R(x, 2, 4, 22, W[2]); R(x, 2, 1, 22, W[3]); R(x, 1, 4, 1, W[4]); }
  R(0, 6, 32, 3, W[3]); R(0, 6, 32, 1, W[4]); R(0, 14, 32, 3, W[2]); R(0, 16, 32, 1, W[1]);
}, {});
spr('coast_marker', 22, 48, (R) => {
  R(2, 42, 18, 6, S[2]); R(2, 42, 18, 1, S[4]); R(4, 4, 14, 38, S[3]); R(4, 4, 3, 38, S[4]); R(16, 4, 2, 38, S[1]); R.t([4, 4], [11, 0], [17, 4], S[3]);
  for (let y = 8; y < 38; y += 6) R(9, y, 4, 4, S[1]);
}, {});

// ======================= LIGHTHOUSE INTERIOR =======================
spr('coast_lh_stairs', 64, 64, (R) => {
  R(0, 0, 64, 64, CH[1]);
  for (let s = 0; s < 8; s++) { const y = s * 8, w = 56 - s * 2; R(4 + s, y, w, 8, MT[2]); R(4 + s, y, w, 2, MT[3]); R(4 + s, y + 6, w, 2, MT[1]); for (let x = 8 + s; x < 4 + s + w; x += 6) px(R, x, y + 4, MT[1]); }
  R(0, 0, 4, 64, MT[1]); R(60, 0, 4, 64, MT[0]); R(1, 0, 2, 64, MT[3]);
}, flat);
for (const lit of [0, 1]) spr(`coast_lens${lit ? '_lit' : ''}`, 84, 100, (R) => {
  const G = lit ? C.butter : C.sky, B = C.butter;
  R(18, 78, 48, 20, MT[2]); R(18, 78, 48, 3, MT[3]); R(62, 80, 4, 18, MT[1]); R(14, 96, 56, 4, MT[1]);
  R.e(42, 42, 34, 38, B[1]); R.e(42, 42, 31, 35, G[2]);
  for (let k = 0; k < 5; k++) { R.e(42, 42, 28 - k * 6, 32 - k * 7, k % 2 ? G[3] : G[1]); R.e(42, 42, 26 - k * 6, 30 - k * 7, k % 2 ? G[2] : G[3]); }
  R.e(42, 42, 5, 6, lit ? P[4] : G[4]);
  for (let y = 8; y < 78; y += 10) R(10, y, 64, 1, B[1]);
  R(30, 14, 3, 10, P[4]); R(26, 22, 2, 6, P[4]);
  if (lit) { for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3; line(R, 42 + Math.round(Math.cos(a) * 8), 42 + Math.round(Math.sin(a) * 9), 42 + Math.round(Math.cos(a) * 20), 42 + Math.round(Math.sin(a) * 23), P[4]); } }
  R(40, 0, 4, 6, B[1]);
}, {});
spr('coast_logdesk', 52, 44, (R) => {
  R(4, 22, 4, 22, WD[2]); R(44, 22, 4, 22, WD[1]);
  R(0, 12, 52, 12, WD[3]); R(0, 12, 52, 2, WD[4]); R(0, 22, 52, 3, WD[1]);
  R(10, 6, 28, 10, P[4]); R(23, 6, 2, 10, P[1]); for (let y = 8; y < 15; y += 2) { R(12, y, 9, 1, C.sky[2]); R(26, y, 10, 1, C.sky[2]); }
  R(40, 6, 6, 7, CH[2]); R(42, 2, 1, 5, P[4]); R(4, 4, 6, 9, C.butter[2]); R(5, 2, 4, 2, C.butter[3]); R(4, 11, 6, 2, MT[2]);
}, {});
spr('coast_keeper_bed', 40, 62, (R) => {
  R(0, 0, 40, 10, WD[2]); R(0, 0, 40, 2, WD[3]); R(2, 10, 36, 50, W[1]);
  R(4, 8, 32, 12, P[4]); R(4, 18, 32, 2, P[2]);
  R(2, 22, 36, 38, C.navy[2]); for (let y = 26; y < 58; y += 8) R(2, y, 36, 2, C.navy[3]); R(36, 22, 2, 38, C.navy[1]); R(2, 58, 36, 3, WD[1]);
}, {});
spr('coast_stove', 30, 46, (R) => {
  R(4, 12, 22, 30, CH[2]); R(4, 12, 6, 30, CH[3]); R(23, 12, 3, 30, CH[1]); R(2, 10, 26, 3, CH[3]); R(6, 40, 4, 6, CH[1]); R(20, 40, 4, 6, CH[1]);
  R(9, 24, 12, 8, C.leafAutumn[2]); R(10, 26, 10, 4, C.butter[3]); R(12, 0, 6, 10, CH[2]);
  R(16, 4, 10, 6, MT[3]); R(14, 6, 3, 1, MT[2]); R(19, 2, 4, 2, MT[2]);
}, {});
spr('coast_coat_hook', 26, 50, (R) => {
  R(0, 2, 26, 4, WD[2]); R(0, 2, 26, 1, WD[3]); R(12, 6, 2, 3, MT[2]);
  R(4, 8, 18, 40, C.navy[2]); R(4, 8, 4, 40, C.navy[3]); R(20, 8, 2, 40, C.navy[1]); R(9, 8, 8, 6, C.navy[1]);
  for (const y of [18, 26, 34]) { px(R, 15, y, C.butter[3]); px(R, 16, y, C.butter[1]); }
  px(R, 15, 42, C.navy[0]);
  R(4, 46, 18, 2, C.navy[1]);
}, {});
spr('coast_oil_shelf', 48, 58, (R) => {
  R(0, 0, 48, 58, WD[2]); R(2, 2, 44, 54, WD[1]);
  for (const y of [18, 36, 54]) R(2, y, 44, 3, W[3]);
  for (let i = 0; i < 6; i++) { const x = 4 + (i % 3) * 14, y = 6 + Math.floor(i / 3) * 18; R(x, y, 10, 12, i % 2 ? C.ribbon[2] : C.forest[2]); R(x, y, 10, 2, MT[3]); R(x + 2, y + 5, 6, 3, P[3]); }
  for (let i = 0; i < 4; i++) R(5 + i * 10, 44, 7, 10, [C.sky[2], C.butter[2], C.coral[2], P[3]][i]);
}, {});
spr('coast_barrel', 22, 28, (R) => { R(1, 4, 20, 22, W[2]); R(1, 4, 5, 22, W[3]); R(17, 4, 4, 22, W[1]); R.e(11, 4, 10, 3, W[3]); R.e(11, 4, 7, 2, W[1]); R(1, 9, 20, 2, MT[1]); R(1, 20, 20, 2, MT[1]); }, {});
spr('coast_porthole', 28, 28, (R) => { R.e(14, 14, 13, 13, C.butter[1]); R.e(14, 14, 11, 11, C.butter[2]); R.e(14, 14, 9, 9, C.navy[1]); R.e(12, 11, 4, 3, C.sky[1]); px(R, 9, 9, P[4]); for (let i = 0; i < 6; i++) px(R, 14 + Math.round(Math.cos(i) * 12), 14 + Math.round(Math.sin(i) * 12), C.butter[3]); }, flat);
spr('coast_chart', 44, 30, (R) => {
  R(0, 0, 44, 30, W[1]); R(2, 2, 40, 26, P[3]); R(2, 2, 40, 10, C.sky[3]);
  R.e(18, 20, 12, 6, C.forest[3]); R.e(30, 18, 6, 4, SA[3]); px(R, 36, 16, C.ribbon[2]); line(R, 6, 8, 34, 24, C.ribbon[2]); signText(R, 'BAY', 4, 4, C.navy[1]);
}, flat);
spr('coast_foghorn', 42, 34, (R) => {
  R(2, 22, 22, 12, MT[1]); R(2, 22, 22, 2, MT[3]);
  R.t([14, 8], [40, 0], [40, 28], C.butter[2]); R(10, 10, 6, 10, C.butter[1]); R(38, 2, 3, 24, C.butter[1]); R.t([20, 10], [36, 4], [36, 10], C.butter[3]);
}, {});
spr('coast_lh_window', 64, 40, (R) => {
  R(0, 0, 64, 40, MT[1]);
  for (let i = 0; i < 3; i++) { const x = 2 + i * 21; R(x, 2, 19, 36, C.navy[1]); dith(R, x, 22, 19, 16, C.navy[2], 0.5); R(x, 30, 19, 8, C.sky[1]); px(R, x + 4 + i * 3, 6 + i * 4, P[4]); px(R, x + 12, 12, P[4]); px(R, x + 8, 18 - i, C.butter[3]); }
}, flat);
spr('coast_grate', 32, 32, (R) => { R(0, 0, 32, 32, MT[1]); for (let y = 0; y < 32; y += 4) for (let x = (y / 4) % 2 * 2; x < 32; x += 4) R(x, y, 3, 3, MT[2]); R(0, 0, 32, 1, MT[3]); }, flat);
spr('coast_lh_rail', 32, 26, (R) => {
  for (const x of [0, 29]) R(x, 2, 3, 24, MT[2]);
  R(0, 2, 32, 2, MT[3]); R(0, 12, 32, 2, MT[2]); for (let x = 5; x < 29; x += 6) R(x, 4, 1, 20, MT[1]);
}, {});

// ======================= SUNNY PINES =======================
const fabric = C.mint, CO = C.coral;
spr('coast_pines_sofa', 72, 42, (R) => {
  R(0, 4, 72, 18, fabric[2]); R(0, 4, 72, 3, fabric[3]); for (const x of [24, 48]) R(x, 8, 1, 14, fabric[1]);
  R(0, 20, 72, 16, fabric[3]); R(0, 20, 72, 2, fabric[4]); R(0, 34, 72, 2, fabric[1]);
  R(0, 8, 8, 30, fabric[2]); R(64, 8, 8, 30, fabric[1]); R(2, 38, 4, 4, WD[1]); R(66, 38, 4, 4, WD[1]);
  R(10, 22, 12, 9, CO[3]); R(12, 24, 8, 1, CO[4]);
}, {});
spr('coast_armchair', 32, 42, (R) => {
  const F = CO;
  R(3, 0, 26, 22, F[2]); R(3, 0, 26, 3, F[3]); for (let i = 0; i < 6; i++) R.e(9 + (i % 3) * 7, 6 + Math.floor(i / 3) * 8, 1, 1, P[4]);
  R(0, 14, 7, 22, F[3]); R(25, 14, 7, 22, F[1]); R(5, 22, 22, 12, F[3]); R(5, 22, 22, 2, F[4]); R(2, 36, 4, 6, WD[2]); R(26, 36, 4, 6, WD[1]);
  R(8, 18, 16, 3, C.butter[3]);
}, {});
spr('coast_pines_bed', 42, 64, (R) => {
  R(0, 0, 42, 12, W[2]); R(0, 0, 42, 2, W[4]); R(2, 12, 38, 50, W[1]);
  R(5, 10, 32, 12, P[4]); R(5, 20, 32, 2, P[2]);
  R(2, 24, 38, 38, C.lilac[3]); for (let y = 26; y < 60; y += 6) for (let x = 4; x < 38; x += 6) R(x + ((y / 6) % 2) * 3, y, 2, 2, (x + y) % 4 ? C.sakura[2] : C.butter[2]); R(38, 24, 2, 38, C.lilac[1]); R(2, 24, 38, 2, C.lilac[4]);
}, {});
spr('coast_nightstand', 24, 34, (R) => {
  box(R, 0, 14, 24, 20, 5, W); R(3, 22, 18, 1, W[1]); px(R, 12, 25, C.butter[2]);
  R(4, 2, 10, 12, C.butter[2]); R(5, 3, 8, 8, C.sky[3]); R(7, 5, 3, 3, C.coral[2]); R(15, 6, 6, 8, P[3]); R(16, 3, 4, 3, C.forest[3]);
}, {});
spr('coast_tv', 50, 44, (R) => {
  box(R, 0, 26, 50, 18, 5, WD);
  R(6, 2, 38, 24, CH[1]); R(8, 4, 34, 18, C.sky[1]); R(8, 4, 34, 6, C.sky[3]); R.e(25, 16, 8, 3, C.forest[3]); px(R, 12, 6, P[4]); R(22, 24, 6, 2, CH[2]);
}, {});
for (let f = 0; f < 2; f++) spr(`coast_fishtank_${f}`, 54, 44, (R) => {
  R(0, 26, 54, 18, WD[2]); R(0, 26, 54, 2, WD[3]);
  R(2, 0, 50, 27, C.sky[2]); R(2, 0, 50, 3, CH[2]); R(4, 4, 46, 21, WA[3]); dith(R, 4, 16, 46, 9, WA[2], 0.4); R(4, 21, 46, 4, SA[3]);
  R(10, 14, 2, 8, C.forest[2]); R(12, 10, 2, 12, C.forest[3]); R(40, 12, 2, 10, C.forest[2]);
  const o = f ? 4 : 0;
  R.e(20 + o, 10, 3, 2, C.butter[2]); px(R, 16 + o, 10, C.butter[1]); R.e(34 - o, 16, 3, 2, C.coral[2]); px(R, 38 - o, 16, C.coral[1]);
  px(R, 26, 6 - f, P[4]); px(R, 27, 9 - f, P[4]); px(R, 8, 5, P[4]);
}, {});
spr('coast_piano', 56, 50, (R) => {
  R(0, 0, 56, 32, WD[1]); R(0, 0, 56, 3, WD[3]); R(4, 6, 48, 10, WD[2]); R(20, 8, 14, 6, P[3]);
  R(0, 28, 56, 8, P[4]); for (let x = 2; x < 56; x += 4) R(x, 28, 1, 8, P[1]); for (let x = 4; x < 54; x += 8) { R(x, 28, 2, 5, CH[1]); R(x + 4, 28, 2, 5, CH[1]); }
  R(0, 36, 56, 4, WD[1]); R(2, 40, 4, 10, WD[0]); R(50, 40, 4, 10, WD[0]);
}, {});
spr('coast_shogi', 44, 36, (R) => {
  R(6, 22, 4, 14, W[1]); R(34, 22, 4, 14, W[1]);
  R(2, 8, 40, 16, W[4]); R(2, 22, 40, 3, W[2]); for (let i = 0; i < 9; i++) { R(4 + i * 4, 9, 1, 13, W[2]); }
  for (let y = 10; y < 22; y += 3) R(3, y, 38, 1, W[3]);
  for (let i = 0; i < 9; i++) { R(5 + i * 4, 10 + (i % 2) * 9, 3, 3, W[3]); px(R, 6 + i * 4, 10 + (i % 2) * 9, P[4]); }
  R(16, 2, 6, 5, P[3]); R(17, 1, 4, 1, C.forest[2]);
}, {});
spr('coast_dining_table', 96, 44, (R) => {
  R(6, 24, 4, 20, W[1]); R(86, 24, 4, 20, W[1]);
  R(0, 4, 96, 22, P[4]); R(0, 4, 96, 2, P[4]); for (let x = 0; x < 96; x += 8) R(x, 22, 4, 4, C.sky[3]); R(0, 24, 96, 2, P[1]);
  for (let i = 0; i < 4; i++) { const x = 8 + i * 23; R.e(x + 6, 12, 6, 3, P[3]); R.e(x + 6, 12, 4, 2, i % 2 ? C.butter[3] : C.forest[3]); R(x + 14, 9, 2, 6, C.sky[3]); }
  R(44, 6, 8, 6, C.coral[2]); R(46, 4, 4, 2, C.forest[3]);
}, {});
spr('coast_chair', 22, 30, (R) => { R(2, 0, 18, 14, W[2]); R(2, 0, 18, 2, W[3]); R(4, 4, 14, 1, W[1]); R(0, 14, 22, 6, W[3]); R(0, 14, 22, 1, W[4]); R(2, 20, 3, 10, W[1]); R(17, 20, 3, 10, W[1]); }, {});
spr('coast_counter', 96, 46, (R) => {
  box(R, 0, 14, 96, 32, 10, P); for (let x = 6; x < 96; x += 22) R(x, 28, 16, 14, P[1]);
  R(6, 2, 24, 14, MT[3]); R(6, 2, 24, 2, MT[4]); R(10, 0, 4, 3, MT[2]);
  for (let i = 0; i < 5; i++) { R(40 + i * 10, 8, 7, 6, P[4]); R(41 + i * 10, 9, 5, 2, i % 2 ? C.coral[3] : C.butter[3]); }
}, {});
spr('coast_reception', 80, 44, (R) => {
  box(R, 0, 12, 80, 32, 10, W); R(4, 24, 72, 2, W[1]); R(30, 28, 20, 10, C.mint[2]); signText(R, 'HELLO', 31, 31, P[4]);
  R(6, 4, 20, 10, P[4]); R(16, 4, 1, 10, P[2]); for (let y = 6; y < 13; y += 2) R(8, y, 6, 1, C.sky[2]); R(30, 6, 8, 6, C.butter[2]); R(33, 4, 2, 2, C.butter[3]);
  R(60, 0, 12, 14, C.forest[2]); R(62, 2, 8, 6, C.forest[3]); R(62, 10, 8, 4, C.coral[1]);
}, {});
spr('coast_plant', 24, 40, (R) => {
  R(5, 28, 14, 12, C.coral[1]); R(5, 28, 14, 2, C.coral[2]);
  for (let i = 0; i < 7; i++) { const a = -2.6 + i * 0.5; line(R, 12, 28, 12 + Math.round(Math.cos(a) * 11), 16 + Math.round(Math.sin(a) * 14), i % 2 ? C.forest[2] : C.forest[3], 2); }
}, {});
spr('coast_shelf', 48, 62, (R) => {
  R(0, 0, 48, 62, W[1]); R(2, 2, 44, 58, WD[2]);
  for (const y of [18, 38, 58]) R(2, y, 44, 3, W[3]);
  for (let s = 0; s < 3; s++) for (let x = 4; x < 44;) { const w = 3 + Math.floor(hash(x, s, 5) * 3), h = 10 + Math.floor(hash(x, s, 6) * 5); R(x, s * 20 + 18 - h, w, h, [C.coral[2], C.sky[2], C.forest[2], C.butter[2], C.lilac[2]][Math.floor(hash(x, s, 7) * 5)]); x += w + 1; }
}, {});
spr('coast_photos', 60, 26, (R) => {
  for (let i = 0; i < 4; i++) { const x = 2 + i * 15, y = (i % 2) * 4; R(x, y, 12, 14, C.butter[1]); R(x + 1, y + 1, 10, 12, [C.sky[3], SA[3], C.sakura[3], C.navy[1]][i]); }
  R(5, 6, 4, 6, P[4]); R(32, 4, 4, 8, P[4]); R(33, 3, 2, 2, C.ribbon[2]); R(48, 9, 2, 6, P[4]); px(R, 49, 7, C.butter[3]);
}, flat);
spr('coast_window', 60, 40, (R, M) => {
  R(0, 0, 60, 40, P[2]); R(3, 3, 54, 30, C.sky[3]); R(3, 3, 54, 10, C.sky[4]);
  for (let i = 0; i < 4; i++) R.e(10 + i * 14, 30, 8, 6, M.leaf[2]); R(3, 32, 54, 1, M.leaf[1]);
  R(29, 3, 2, 30, P[3]); R(0, 34, 60, 6, P[3]); R(0, 34, 60, 1, P[4]); R(0, 0, 8, 34, CO[3]); R(52, 0, 8, 34, CO[2]);
}, { seasonal: true, outline: false });
spr('coast_tea_cart', 40, 40, (R) => {
  R(2, 16, 36, 4, MT[3]); R(2, 32, 36, 3, MT[2]); R(3, 18, 2, 18, MT[1]); R(35, 18, 2, 18, MT[1]); R.e(6, 37, 2, 2, CH[2]); R.e(34, 37, 2, 2, CH[2]);
  R.e(14, 10, 7, 6, C.forest[2]); R.e(12, 8, 3, 2, C.forest[3]); R(20, 8, 6, 2, C.forest[1]); R(12, 2, 4, 2, CH[2]);
  for (let i = 0; i < 3; i++) { R(24 + i * 4, 10, 3, 5, P[4]); px(R, 25 + i * 4, 10, C.forest[3]); }
  for (let i = 0; i < 4; i++) R(5 + i * 8, 26, 6, 6, P[3]);
}, {});
spr('coast_rug', 96, 64, (R) => {
  R(0, 0, 96, 64, CO[2]); R(4, 4, 88, 56, CO[3]); R(8, 8, 80, 48, C.butter[3]); R(12, 12, 72, 40, CO[3]);
  for (let y = 16; y < 50; y += 8) for (let x = 16; x < 82; x += 8) px(R, x + ((y / 8) % 2) * 4, y, C.butter[3]);
  for (let x = 2; x < 96; x += 4) { px(R, x, 0, P[4]); px(R, x, 63, P[4]); }
}, flat);
spr('coast_clock', 22, 26, (R) => { R.e(11, 11, 10, 10, W[2]); R.e(11, 11, 8, 8, P[4]); R(10, 5, 1, 7, INK); R(11, 11, 4, 1, INK); R(9, 22, 4, 4, W[1]); }, {});
