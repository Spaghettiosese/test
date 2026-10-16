// Festival decorations and event props (hd, 1 art px = 1 screen px, selective outlines, palette ramps only).
import { defineSprite } from '../../art.js';
import { RAMPS as K } from '../../gfx/palette.js';

const P = { hd: true, outline: 'selective' };
const W = K.paper[4];

// ---------- small reusable bits ----------
// Paper lantern (chochin): ramp = colour ramp, at (x, y) top-left, size w x h.
function chochin(R, x, y, w, h, ramp, lit = true) {
  R(x + 1, y, w - 2, 1, K.woodDark[1]);
  R.e(x + Math.floor(w / 2), y + Math.floor(h / 2), Math.floor(w / 2), Math.floor(h / 2) - 1, ramp[2]);
  R.e(x + Math.floor(w / 2) - 1, y + Math.floor(h / 2) - 1, Math.max(1, Math.floor(w / 2) - 2), Math.max(1, Math.floor(h / 2) - 3), lit ? ramp[3] : ramp[2]);
  for (let yy = y + 3; yy < y + h - 2; yy += 3) R(x + 1, yy, w - 2, 1, ramp[1]);
  R(x + Math.floor(w / 2) - 1, y + 2, 1, h - 4, lit ? ramp[4] : ramp[3]);
  R(x + 1, y + h - 1, w - 2, 1, K.woodDark[1]);
  R(x + Math.floor(w / 2), y + h, 1, 2, K.butter[1]);
}
function post(R, x, y, h) { R(x, y, 3, h, K.wood[1]); R(x, y, 1, h, K.wood[3]); R(x + 2, y, 1, h, K.woodDark[2]); R(x - 1, y + h - 2, 5, 2, K.woodDark[2]); }

// ---------- festival stalls (yatai) ----------
const goods = {
  goldfish: (R) => { R(10, 33, 44, 7, K.sky[1]); R(10, 33, 44, 1, K.sky[3]); R(11, 34, 42, 5, K.water[3]); for (const [x, c] of [[15, K.vermilion[2]], [24, K.butter[2]], [33, K.vermilion[3]], [43, K.vermilion[2]], [48, K.paper[4]]]) { R(x, 36, 4, 2, c); R(x + 4, 35, 2, 1, c); R(x + 4, 38, 2, 1, c); } R(14, 34, 30, 1, K.water[5]); },
  ringtoss: (R) => { for (let i = 0; i < 5; i++) { const x = 9 + i * 10; R(x, 33 - (i % 2) * 3, 7, 7 + (i % 2) * 3, [K.coral[2], K.butter[2], K.mint[2], K.lilac[2], K.sky[2]][i]); R(x, 33 - (i % 2) * 3, 7, 1, [K.coral[4], K.butter[4], K.mint[4], K.lilac[4], K.sky[4]][i]); R(x + 2, 35 - (i % 2) * 3, 1, 1, K.ink[1]); R(x + 4, 35 - (i % 2) * 3, 1, 1, K.ink[1]); } },
  takoyaki: (R) => { R(10, 35, 26, 5, K.metal[1]); for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { R.e(13 + i * 6, 36 + j * 2, 2, 1, K.butter[1]); R(12 + i * 6, 35 + j * 2, 1, 1, K.butter[3]); } R(40, 32, 14, 8, K.paper[3]); R(42, 34, 3, 3, K.wood[1]); R(47, 34, 3, 3, K.wood[1]); R(40, 32, 14, 1, K.paper[4]); },
  sweets: (R) => { for (let i = 0; i < 4; i++) { const x = 12 + i * 11; R(x + 2, 31, 1, 9, K.paper[3]); R.e(x + 2, 29, 4, 4, i % 2 ? K.sakura[3] : K.sky[4]); R.e(x + 1, 28, 2, 2, K.paper[4]); } for (let i = 0; i < 3; i++) { R.e(18 + i * 11, 37, 3, 3, K.ribbon[2]); R(17 + i * 11, 35, 1, 1, K.ribbon[4]); } },
  masks: (R) => { for (let i = 0; i < 4; i++) { const x = 10 + i * 11; R.e(x + 4, 34, 4, 5, [K.paper[4], K.coral[3], K.sky[3], K.butter[3]][i]); R(x + 2, 33, 1, 1, K.ink[1]); R(x + 6, 33, 1, 1, K.ink[1]); R(x + 3, 36, 3, 1, K.coral[1]); } },
  cocoa: (R) => { R(10, 33, 12, 7, K.metal[2]); R(10, 33, 12, 1, K.metal[4]); R(14, 30, 4, 3, K.metal[1]); for (let i = 0; i < 4; i++) { R(28 + i * 6, 35, 4, 5, W); R(28 + i * 6, 35, 4, 1, K.woodDark[2]); } R(30, 31, 1, 2, K.paper[4]); R(42, 30, 1, 3, K.paper[4]); },
  crafts: (R) => { R(10, 34, 10, 6, K.lilac[2]); R(10, 34, 10, 1, K.lilac[4]); R(23, 32, 8, 8, K.mint[2]); R(23, 32, 8, 1, K.mint[4]); R.e(40, 36, 4, 4, K.coral[2]); R(39, 33, 2, 1, K.coral[4]); R(47, 31, 6, 9, K.butter[2]); R(48, 33, 4, 1, K.butter[4]); },
  veg: (R) => { R.e(16, 36, 6, 4, K.leafAutumn[3]); R(15, 31, 2, 2, K.forest[2]); R.e(29, 37, 4, 3, K.ribbon[2]); R(28, 34, 2, 1, K.forest[3]); R(36, 34, 6, 6, K.forest[3]); R(36, 34, 6, 1, K.forest[4]); R.e(48, 37, 4, 3, K.lilac[1]); R(47, 35, 1, 1, K.lilac[3]); },
  choco: (R) => { for (let i = 0; i < 5; i++) { const x = 10 + i * 9; R(x, 34, 7, 6, i % 2 ? K.coral[2] : K.lilac[2]); R(x, 34, 7, 1, i % 2 ? K.coral[4] : K.lilac[4]); R(x + 3, 34, 1, 6, K.butter[2]); R(x + 2, 32, 3, 2, K.butter[3]); } },
  fortune: (R) => { R(12, 32, 10, 8, K.vermilion[2]); R(12, 32, 10, 1, K.vermilion[4]); R(16, 29, 2, 3, K.wood[2]); for (let i = 0; i < 4; i++) { R(28 + i * 6, 33, 4, 7, W); R(29 + i * 6, 35, 2, 1, K.vermilion[2]); } },
};
function stall(R, aw, kind, snow = false) {
  // posts and dark back
  post(R, 3, 16, 43); post(R, 58, 16, 43);
  R(6, 20, 52, 22, K.woodDark[1]); R(6, 20, 52, 3, K.ink[2]);
  // awning (stripes, trapezoid, lit from the top-left)
  for (let y = 3; y < 16; y++) {
    const inset = Math.floor((15 - y) / 3);
    for (let x = 1 + inset; x <= 62 - inset; x++) {
      const s = Math.floor((x + 4) / 8) % 2, light = y < 7;
      R(x, y, 1, 1, s ? (light ? aw[3] : aw[2]) : (light ? W : K.paper[3]));
    }
  }
  if (snow) { for (let x = 6; x < 58; x++) R(x, 2 + ((x * 7) % 3 === 0 ? 1 : 0), 1, 2, K.snow[4]); R(4, 4, 56, 1, K.snow[3]); }
  // scalloped valance
  for (let i = 0; i < 8; i++) { const c = i % 2 ? aw[2] : K.paper[3]; R(i * 8, 16, 8, 2, c); R.e(i * 8 + 4, 18, 3, 1, c); R(i * 8 + 1, 18, 6, 1, i % 2 ? aw[1] : K.paper[1]); }
  R(6, 21, 52, 2, K.ink[1]);
  // little hanging lanterns
  chochin(R, 8, 22, 6, 8, K.ribbon); chochin(R, 50, 22, 6, 8, K.ribbon);
  // counter
  goods[kind](R);
  R(1, 40, 62, 5, K.wood[3]); R(1, 40, 62, 1, K.wood[4]); R(1, 45, 62, 1, K.wood[1]);
  R(1, 46, 62, 12, K.wood[2]); R(1, 46, 2, 12, K.wood[3]); R(61, 46, 2, 12, K.wood[1]);
  for (let x = 8; x < 60; x += 10) R(x, 47, 1, 10, K.wood[1]);
  // cloth sign on the front
  R(19, 47, 26, 10, W); R(19, 47, 26, 1, K.paper[4]); R(19, 56, 26, 1, K.paper[1]); R(21, 49, 22, 6, aw[2]); R(22, 50, 20, 1, aw[3]);
  R(1, 58, 62, 2, K.woodDark[2]);
}
const STALLS = { goldfish: K.ribbon, ringtoss: K.sky, takoyaki: K.butter, sweets: K.sakura, masks: K.mint, cocoa: K.forest, crafts: K.lilac, veg: K.leafAutumn, choco: K.coral, fortune: K.vermilion };
for (const [kind, aw] of Object.entries(STALLS)) defineSprite(`ev_stall_${kind}`, 64, 60, (R) => stall(R, aw, kind), P);
defineSprite('ev_stall_winter', 64, 60, (R) => stall(R, K.forest, 'crafts', true), P);
defineSprite('ev_stall_cocoa_winter', 64, 60, (R) => stall(R, K.ribbon, 'cocoa', true), P);

// ---------- strings of lanterns and bunting ----------
function sag(i, n, depth) { const t = i / n; return Math.round(depth * 4 * t * (1 - t)); }
function lanternString(R, ramps, frame = 0) {
  post(R, 1, 6, 50); post(R, 92, 6, 50);
  R(0, 5, 5, 2, K.woodDark[2]); R(91, 5, 5, 2, K.woodDark[2]);
  for (let x = 4; x < 92; x++) R(x, 8 + sag(x - 4, 88, 8), 1, 1, K.ink[2]);
  for (let i = 0; i < 7; i++) {
    const x = 9 + i * 12, y = 9 + sag(x - 4 + 3, 88, 8);
    R(x + 3, y, 1, 2, K.ink[2]);
    chochin(R, x, y + 2, 8, 11, ramps[(i + frame) % ramps.length]);
  }
}
defineSprite('ev_lanterns', 96, 56, (R) => lanternString(R, [K.ribbon, K.paper, K.ribbon, K.butter]), P);
defineSprite('ev_lanterns_pink', 96, 56, (R) => lanternString(R, [K.sakura, K.paper, K.sakura, K.coral]), P);
defineSprite('ev_lanterns_bon', 96, 56, (R) => lanternString(R, [K.paper, K.butter, K.paper, K.vermilion]), P);
defineSprite('ev_lanterns_ghost', 96, 56, (R) => lanternString(R, [K.leafAutumn, K.lilac, K.leafAutumn, K.mint]), P);
function bunting(R, cols) {
  post(R, 1, 4, 34); post(R, 92, 4, 34);
  for (let x = 4; x < 92; x++) R(x, 6 + sag(x - 4, 88, 6), 1, 1, K.ink[2]);
  for (let i = 0; i < 11; i++) {
    const x = 6 + i * 8, y = 7 + sag(x - 4 + 3, 88, 6), c = cols[i % cols.length];
    R.t([x, y], [x + 6, y], [x + 3, y + 8], c[2]); R(x, y, 6, 1, c[3]); R(x + 1, y + 1, 2, 1, c[4]);
  }
}
defineSprite('ev_bunting', 96, 40, (R) => bunting(R, [K.coral, K.butter, K.mint, K.sky, K.lilac]), P);
defineSprite('ev_bunting_sports', 96, 40, (R) => bunting(R, [K.ribbon, W ? K.paper : K.paper, K.navy]), P);
defineSprite('ev_bunting_winter', 96, 40, (R) => bunting(R, [K.ribbon, K.forest, K.butter, K.snow]), P);

// single standing lantern
function standLantern(R, ramp) { post(R, 6, 14, 30); R(3, 12, 9, 2, K.woodDark[2]); chochin(R, 2, 0, 11, 13, ramp); }
defineSprite('ev_chochin', 16, 44, (R) => standLantern(R, K.ribbon), P);
defineSprite('ev_chochin_pink', 16, 44, (R) => standLantern(R, K.sakura), P);
defineSprite('ev_chochin_white', 16, 44, (R) => standLantern(R, K.paper), P);

// ---------- picnic and hanami ----------
defineSprite('ev_picnic_mat', 64, 36, (R) => {
  for (let y = 4; y < 34; y++) for (let x = 0; x < 64; x++) {
    if (x < (33 - y) / 6 || x > 63 - (33 - y) / 6) continue;
    const a = Math.floor(x / 6) % 2, b = Math.floor((y - 4) / 5) % 2;
    R(x, y, 1, 1, a && b ? K.ribbon[2] : a || b ? K.coral[3] : W);
  }
  R(4, 33, 56, 1, K.coral[1]);
  // jubako bento box, teacups, onigiri and sakura petals
  R(10, 10, 16, 11, K.ink[2]); R(10, 10, 16, 3, K.ribbon[2]); R(11, 10, 14, 1, K.ribbon[3]); R(12, 15, 5, 4, K.butter[3]); R(18, 15, 6, 4, K.forest[3]); R(12, 15, 2, 2, K.coral[3]);
  for (const [x, y] of [[34, 12], [42, 14]]) { R(x, y, 5, 4, W); R(x, y, 5, 1, K.mint[2]); R(x + 1, y + 1, 3, 1, K.forest[3]); }
  for (const [x, y] of [[48, 20], [53, 22]]) { R.t([x + 3, y], [x + 6, y + 5], [x, y + 5], W); R(x + 2, y + 3, 3, 2, K.ink[1]); }
  for (const [x, y] of [[6, 26], [28, 24], [40, 28], [58, 12], [22, 8]]) { R(x, y, 2, 1, K.sakura[2]); R(x, y + 1, 1, 1, K.sakura[3]); }
}, { hd: true });

// ---------- tanabata bamboo ----------
defineSprite('ev_bamboo', 48, 88, (R) => {
  R(21, 4, 4, 84, K.forest[2]); R(21, 4, 1, 84, K.forest[4]); R(24, 4, 1, 84, K.forest[1]);
  for (let y = 10; y < 86; y += 13) R(20, y, 6, 2, K.forest[1]);
  R(14, 80, 18, 8, K.woodDark[2]); R(14, 80, 18, 2, K.wood[2]);
  const leaf = (x, y, d) => { for (let i = 0; i < 7; i++) R(x + i * d, y - Math.floor(i / 3), 2, 2, i % 2 ? K.leaf[3] : K.leaf[2]); };
  for (const [x, y, d] of [[19, 10, -2], [25, 14, 2], [19, 24, -2], [25, 30, 2], [19, 40, -2], [25, 46, 2], [19, 56, -1], [25, 60, 1], [21, 2, 1]]) leaf(x, y, d);
  R.e(23, 4, 6, 3, K.leaf[3]); R.e(10, 9, 5, 3, K.leaf[2]); R.e(37, 13, 5, 3, K.leaf[2]); R.e(8, 23, 5, 3, K.leaf[3]); R.e(39, 29, 5, 3, K.leaf[3]); R.e(10, 39, 4, 3, K.leaf[2]); R.e(37, 45, 4, 3, K.leaf[2]);
  const strips = [[9, 12, K.coral], [14, 22, K.butter], [33, 17, K.sky], [38, 32, K.lilac], [6, 26, K.mint], [11, 42, K.sakura], [34, 48, K.butter], [28, 37, K.coral], [16, 34, K.sky], [30, 24, K.mint]];
  for (const [x, y, c] of strips) { R(x + 1, y - 2, 1, 2, K.ink[3]); R(x, y, 3, 9, c[3]); R(x, y, 1, 9, c[4]); R(x + 2, y + 8, 1, 1, c[1]); }
  for (let i = 0; i < 6; i++) { R(4 + i * 3, 50 + (i % 2), 3, 2, i % 2 ? K.butter[2] : K.coral[3]); R(26 + i * 3, 56 + (i % 2), 3, 2, i % 2 ? K.sky[3] : K.lilac[3]); }
}, P);

// ---------- koinobori (carp streamers), two frames ----------
function carp(R, x, y, len, ramp, f) {
  for (let i = 0; i < len; i++) {
    const w = i < 3 ? 3 + i : i > len - 6 ? Math.max(2, len - i) : 6, yy = y + Math.round(Math.sin((i + f * 3) * 0.35) * 1.5);
    R(x + i, yy - w, 1, w * 2, ramp[2]); R(x + i, yy - w, 1, 1, ramp[3]);
    if (i % 4 === 2 && i > 6 && i < len - 4) R(x + i, yy - 2, 2, 1, ramp[4]);
    if (i % 4 === 0 && i > 6 && i < len - 4) R(x + i, yy + 2, 2, 1, ramp[1]);
  }
  const ty = y + Math.round(Math.sin((len + f * 3) * 0.35) * 1.5);
  R.t([x + len - 1, ty], [x + len + 5, ty - 5], [x + len + 3, ty], ramp[2]); R.t([x + len - 1, ty], [x + len + 5, ty + 5], [x + len + 3, ty], ramp[1]);
  R.e(x + 4, y - 1, 2, 2, W); R(x + 4, y - 1, 1, 1, K.ink[1]); R(x, y - 5, 1, 10, K.paper[3]);
}
for (const f of [0, 1]) defineSprite(`ev_koinobori_${f}`, 72, 100, (R) => {
  R(4, 6, 3, 94, K.metal[2]); R(4, 6, 1, 94, K.metal[4]); R.e(5, 4, 3, 3, K.butter[2]); R(4, 3, 1, 1, K.butter[4]);
  for (let k = 0; k < 4; k++) R(1 + (k + f) % 2 * 6, 7 + k, 3, 1, [K.coral[2], K.sky[2], K.butter[2], K.mint[2]][k]);
  R(8, 12, 4, 2, K.paper[2]); R(9, 13, 50, 1, K.ink[3]);
  // fukinagashi (rainbow streamer)
  for (let i = 0; i < 34; i++) { const yy = 15 + Math.round(Math.sin((i + f * 4) * 0.3) * 1.2); [K.sky, K.butter, K.coral, K.mint, W && K.paper][0]; R(8 + i, yy, 1, 2, K.sky[3]); R(8 + i, yy + 2, 1, 2, K.butter[3]); R(8 + i, yy + 4, 1, 2, K.coral[3]); R(8 + i, yy + 6, 1, 2, K.mint[3]); }
  carp(R, 9, 34, 44, K.charcoal, f); carp(R, 9, 56, 38, K.ribbon, f); carp(R, 9, 76, 30, K.sky, f);
}, P);

// ---------- floating lantern (toro nagashi) ----------
defineSprite('ev_toro', 16, 18, (R) => {
  R(1, 13, 14, 4, K.wood[2]); R(1, 13, 14, 1, K.wood[3]); R(1, 16, 14, 1, K.woodDark[2]);
  R(3, 2, 10, 11, K.butter[3]); R(3, 2, 10, 1, K.paper[4]); R(4, 4, 3, 8, K.butter[4]); R(3, 2, 1, 11, K.wood[1]); R(12, 2, 1, 11, K.wood[1]); R(7, 3, 2, 9, K.butter[2]);
}, { hd: true });

// ---------- moon viewing ----------
defineSprite('ev_dango_stand', 40, 40, (R0) => {
  const R = R0.at(0, 2);
  // susuki grass in a vase
  R(28, 20, 8, 14, K.stone[2]); R(28, 20, 8, 1, K.stone[4]); R(29, 22, 2, 10, K.stone[3]);
  for (const [x, h, d] of [[30, 18, -1], [32, 20, 0], [34, 16, 1], [31, 14, 1]]) { for (let i = 0; i < h; i++) R(x + Math.floor(i * d / 4), 20 - i, 1, 1, K.grassAutumn[2]); R.e(x + Math.floor(h * d / 4), 20 - h, 1, 3, K.paper[3]); }
  // sanbo tray with a dango pyramid
  R(3, 26, 20, 3, K.wood[3]); R(3, 26, 20, 1, K.wood[4]); R(5, 29, 16, 6, K.wood[2]); R(10, 30, 6, 4, K.woodDark[2]);
  for (const [x, y] of [[6, 22], [11, 22], [16, 22], [8, 18], [14, 18], [11, 14]]) { R.e(x + 2, y + 2, 2, 2, W); R(x + 1, y + 1, 1, 1, K.paper[4]); R(x + 3, y + 3, 1, 1, K.paper[2]); }
}, P);

// ---------- ghost night lanterns ----------
defineSprite('ev_pumpkin', 22, 22, (R) => {
  R.e(11, 13, 10, 8, K.leafAutumn[2]); R.e(5, 13, 3, 7, K.leafAutumn[3]); R.e(16, 13, 3, 7, K.leafAutumn[1]); R(10, 6, 2, 13, K.leafAutumn[1]);
  R(10, 2, 2, 4, K.forest[2]); R(12, 3, 3, 1, K.forest[3]);
  R.t([5, 10], [9, 10], [7, 13], K.butter[4]); R.t([13, 10], [17, 10], [15, 13], K.butter[4]); R(6, 16, 10, 2, K.butter[3]); R(8, 16, 1, 1, K.leafAutumn[2]); R(12, 17, 1, 1, K.leafAutumn[2]);
}, P);
defineSprite('ev_obake', 16, 30, (R) => {
  chochin(R, 1, 4, 14, 22, K.paper);
  R(4, 10, 2, 3, K.ink[1]); R(10, 10, 2, 3, K.ink[1]); R(5, 17, 6, 3, K.ribbon[1]); R(7, 19, 2, 4, K.ribbon[2]);
}, P);

// ---------- winter ----------
defineSprite('ev_star_tree', 56, 92, (R) => {
  R(25, 78, 6, 12, K.woodDark[2]); R(25, 78, 2, 12, K.wood[1]); R(17, 86, 22, 6, K.ribbon[1]); R(17, 86, 22, 2, K.ribbon[2]);
  const tiers = [[28, 10, 9, 22], [28, 24, 15, 24], [28, 40, 21, 26], [28, 56, 27, 26]];
  for (const [cx, top, half, h] of tiers) {
    R.t([cx, top], [cx - half, top + h], [cx + half, top + h], K.forest[2]);
    R.t([cx, top], [cx - half, top + h], [cx - 1, top + h], K.forest[3]);
    R(cx - half + 1, top + h - 2, half * 2 - 1, 2, K.snow[3]);
  }
  for (const [x, y, c] of [[22, 30, K.coral], [33, 36, K.butter], [18, 48, K.sky], [36, 52, K.coral], [26, 58, K.butter], [12, 68, K.lilac], [42, 70, K.sky], [30, 74, K.coral], [20, 76, K.butter]]) { R(x, y, 3, 3, c[2]); R(x, y, 1, 1, c[4]); }
  R.t([28, 0], [24, 8], [32, 8], K.butter[2]); R.t([22, 4], [34, 4], [28, 10], K.butter[2]); R(27, 3, 2, 3, K.butter[4]);
}, P);
defineSprite('ev_kadomatsu', 28, 42, (R) => {
  for (const [x, top] of [[6, 4], [12, 0], [18, 8]]) { R(x, top + 3, 5, 30 - top, K.forest[2]); R(x, top + 3, 1, 30 - top, K.forest[4]); R(x + 4, top + 3, 1, 30 - top, K.forest[1]); R.t([x, top + 3], [x + 4, top], [x + 4, top + 3], K.forest[3]); R(x + 1, top + 4, 3, 1, K.paper[3]); }
  R.e(6, 26, 5, 3, K.leaf[1]); R.e(22, 26, 5, 3, K.leaf[1]); R(2, 24, 3, 2, K.leaf[3]); R(22, 23, 3, 2, K.leaf[3]); R(12, 25, 2, 2, K.ribbon[2]);
  R(2, 28, 24, 14, K.grassAutumn[3]); R(2, 28, 24, 2, K.grassAutumn[4]); for (let y = 31; y < 41; y += 3) R(2, y, 24, 1, K.grassAutumn[1]); R(2, 34, 24, 2, K.ribbon[2]);
}, P);
defineSprite('ev_snowman', 28, 38, (R) => {
  R.e(14, 28, 11, 9, K.snow[3]); R.e(11, 26, 7, 6, K.snow[4]); R(5, 35, 18, 2, K.snow[2]);
  R.e(14, 13, 8, 7, K.snow[3]); R.e(12, 11, 5, 4, K.snow[4]);
  R(10, 11, 2, 2, K.ink[1]); R(16, 11, 2, 2, K.ink[1]); R(13, 14, 5, 2, K.leafAutumn[2]); R(13, 14, 2, 1, K.leafAutumn[3]);
  R(5, 19, 18, 3, K.ribbon[2]); R(5, 19, 18, 1, K.ribbon[3]); R(17, 21, 3, 7, K.ribbon[2]);
  R(8, 2, 12, 4, K.metal[1]); R(6, 5, 16, 2, K.metal[2]); R(8, 2, 12, 1, K.metal[3]);
  R(13, 25, 2, 2, K.ink[1]); R(13, 30, 2, 2, K.ink[1]);
}, P);
defineSprite('ev_ice_swan', 32, 42, (R) => {
  R(4, 34, 24, 8, K.stone[3]); R(4, 34, 24, 1, K.stone[5]); R(4, 41, 24, 1, K.stone[1]);
  R.e(17, 26, 11, 7, K.sky[4]); R.e(14, 24, 7, 4, K.snow[4]); R.t([20, 22], [30, 14], [28, 26], K.sky[3]);
  R(7, 8, 3, 16, K.sky[4]); R(8, 8, 1, 14, W); R.e(9, 6, 3, 3, K.sky[4]); R(4, 6, 3, 2, K.sky[3]);
  R(18, 28, 6, 1, K.sky[2]); R(12, 30, 10, 1, K.sky[3]);
}, P);

// ---------- summer and other ----------
defineSprite('ev_yagura', 64, 84, (R) => {
  post(R, 6, 26, 58); post(R, 55, 26, 58); post(R, 18, 30, 54); post(R, 43, 30, 54);
  for (let y = 40; y < 80; y += 14) { R(6, y, 52, 2, K.wood[1]); }
  R(4, 24, 56, 6, K.wood[3]); R(4, 24, 56, 1, K.wood[4]); R(4, 29, 56, 1, K.woodDark[2]);
  for (let x = 4; x < 60; x += 8) { R(x, 30, 4, 10, K.ribbon[2]); R(x + 4, 30, 4, 10, W); }
  R(4, 39, 56, 1, K.ink[2]);
  // taiko drum and roof
  R.e(32, 16, 9, 7, K.wood[2]); R.e(32, 12, 9, 3, K.paper[3]); R.e(32, 12, 7, 2, K.paper[4]); R(23, 15, 18, 1, K.woodDark[1]);
  R.t([32, 0], [2, 8], [62, 8], K.ribbon[2]); R(2, 8, 60, 2, K.ribbon[1]); R.t([32, 0], [2, 8], [31, 8], K.ribbon[3]);
  for (let i = 0; i < 5; i++) { const x = 8 + i * 12; R(x + 2, 40, 1, 2, K.ink[2]); chochin(R, x - 1, 42, 7, 9, i % 2 ? K.paper : K.butter); }
}, P);
defineSprite('ev_leaf_pile', 30, 14, (R) => {
  R.e(15, 9, 14, 5, K.leafAutumn[1]); R.e(13, 7, 10, 4, K.leafAutumn[2]); R.e(17, 6, 7, 3, K.leafAutumn[3]);
  for (const [x, y, c] of [[5, 8, K.butter[2]], [10, 4, K.leafAutumn[4]], [20, 5, K.ribbon[2]], [24, 9, K.leafAutumn[3]], [14, 3, K.butter[3]], [8, 11, K.ribbon[3]]]) { R(x, y, 2, 1, c); R(x + 1, y + 1, 1, 1, c); }
}, { hd: true });
defineSprite('ev_hina', 48, 46, (R0) => {
  const R = R0.at(0, 1);
  for (let k = 0; k < 3; k++) { const y = 12 + k * 10, inset = 10 - k * 5; R(inset, y + 6, 48 - inset * 2, 4, K.ribbon[2]); R(inset, y + 6, 48 - inset * 2, 1, K.ribbon[3]); R(inset, y + 10, 48 - inset * 2, 2, K.ribbon[1]); }
  R(2, 38, 44, 4, K.woodDark[2]);
  // emperor and empress on top, court ladies below
  R(8, 0, 32, 16, K.butter[2]); R(8, 0, 32, 1, K.butter[4]); for (let x = 10; x < 38; x += 4) R(x, 2, 1, 13, K.butter[1]);
  R.e(18, 12, 4, 5, K.navy[2]); R.e(18, 6, 2, 2, K.skinLight[3]); R(17, 3, 3, 2, K.ink[1]);
  R.e(29, 12, 5, 5, K.ribbon[2]); R(25, 13, 9, 1, K.butter[3]); R.e(29, 6, 2, 2, K.skinLight[3]); R(27, 4, 5, 2, K.ink[1]);
  for (const x of [17, 24, 31]) { R.e(x, 25, 3, 3, W); R(x - 3, 24, 7, 1, K.coral[3]); R.e(x, 20, 2, 2, K.skinLight[3]); R(x - 2, 18, 4, 1, K.ink[1]); }
  for (const x of [10, 38]) { R(x - 1, 30, 3, 6, K.forest[3]); R.e(x, 29, 3, 2, K.sakura[3]); }
}, P);
defineSprite('ev_cleanup_sign', 30, 36, (R) => {
  post(R, 13, 16, 20);
  R(1, 1, 28, 17, K.mint[2]); R(1, 1, 28, 1, K.mint[4]); R(1, 17, 28, 1, K.mint[0]); R(3, 3, 24, 13, W);
  R.e(10, 10, 4, 4, K.sky[2]); R(9, 5, 2, 2, K.sky[1]); R(17, 6, 7, 1, K.mint[1]); R(17, 9, 6, 1, K.mint[1]); R(17, 12, 7, 1, K.mint[1]);
}, P);
defineSprite('ev_trash_bags', 26, 18, (R) => {
  R.e(8, 11, 7, 6, K.charcoal[2]); R.e(6, 9, 3, 3, K.charcoal[3]); R(7, 3, 3, 3, K.charcoal[1]);
  R.e(18, 12, 6, 5, K.sky[2]); R.e(16, 10, 2, 2, K.sky[3]); R(17, 5, 3, 3, K.sky[1]);
}, P);
defineSprite('ev_derby_flag', 20, 48, (R) => {
  post(R, 2, 2, 46);
  R(5, 3, 14, 16, K.sky[2]); R(5, 3, 14, 1, K.sky[4]); R(5, 18, 14, 1, K.sky[0]);
  R.e(11, 10, 4, 2, K.butter[3]); R.t([15, 10], [18, 7], [18, 13], K.butter[3]); R(9, 10, 1, 1, K.ink[1]);
}, P);
defineSprite('ev_bean_box', 16, 12, (R) => { R(1, 3, 14, 8, K.wood[3]); R(1, 3, 14, 1, K.wood[4]); R(3, 4, 10, 4, K.wood[1]); for (let i = 0; i < 5; i++) R(4 + i * 2, 4 + (i % 2), 1, 1, K.butter[3]); R(1, 10, 14, 1, K.woodDark[2]); }, P);
defineSprite('ev_oni_mask', 24, 22, (R) => {
  R.e(12, 12, 10, 9, K.ribbon[2]); R.e(10, 10, 6, 5, K.ribbon[3]);
  R.t([3, 4], [6, 0], [8, 5], K.butter[3]); R.t([16, 5], [18, 0], [21, 4], K.butter[3]);
  R(6, 10, 4, 3, W); R(14, 10, 4, 3, W); R(8, 11, 2, 2, K.ink[1]); R(15, 11, 2, 2, K.ink[1]);
  R(7, 16, 10, 3, K.ink[1]); R(8, 16, 2, 2, W); R(14, 16, 2, 2, W); R(5, 7, 5, 1, K.ink[1]); R(14, 7, 5, 1, K.ink[1]);
}, P);
defineSprite('ev_moon_lantern', 18, 18, (R) => { R.e(9, 9, 8, 8, K.butter[3]); R.e(7, 7, 5, 5, K.butter[4]); R(4, 10, 3, 2, K.butter[2]); R(11, 5, 2, 2, K.butter[2]); }, { hd: true });
