// Harbour & Fish Market props (hd: 1 art px = 1 screen px, 32 px per tile; light from the top-left).
import { defineSprite as def } from '../../art.js';
import { C, INK, px, dither, speckle, planks, box, letters, hash } from './util.js';

const W = C.wood, WD = C.woodDark, S = C.stone, P = C.paper, MT = C.metal, CH = C.charcoal, WA = C.water;
const sel = { hd: true, outline: 'selective' };
const flat = { hd: true };

// ---------- pier planks over water (flat, no outline; gaps let the water show through) ----------
// Boards run across the pier; side stringers on open edges; piles under the end.
function pierTile(R, { l, r, b, t }, seed) {
  for (let j = 0; j < 32; j += 6) {
    const k = j / 6, tone = hash(k, seed, 5) > 0.55 ? 2 : 3, shift = Math.round((hash(k, seed, 6) - 0.5) * 2);
    R(0, j, 32, 5, W[tone]); R(0, j, 32, 1, W[tone + 1]); R(0, j + 4, 32, 1, W[1]);
    if (hash(k, seed, 9) > 0.7) R(2 + shift + Math.floor(hash(k, seed, 8) * 20), j + 2, 6, 1, W[1]);
    if (hash(k, seed, 11) > 0.8) R(8 + Math.floor(hash(k, seed, 12) * 14), j + 1, 3, 1, S[3]); // weathered grey patch
    px(R, 3, j + 2, WD[1]); px(R, 28, j + 2, WD[1]);                                             // nails over the stringers
  }
  if (l) { R(0, 0, 3, 32, WD[2]); R(0, 0, 1, 32, WD[3]); }
  if (r) { R(29, 0, 3, 32, WD[1]); R(31, 0, 1, 32, WD[0]); }
  if (t) R(0, 0, 32, 2, WD[2]);
  if (b) { R(0, 29, 32, 3, WD[1]); R(0, 29, 32, 1, WD[3]); }
}
for (const [name, e] of Object.entries({ l: { l: 1 }, m: {}, r: { r: 1 }, bl: { l: 1, b: 1 }, bm: { b: 1 }, br: { r: 1, b: 1 }, tl: { l: 1, t: 1 }, tm: { t: 1 }, tr: { r: 1, t: 1 } })) {
  def(`coast_pier_${name}`, 32, 32, (R) => pierTile(R, e, name.length * 7 + name.charCodeAt(0)), flat);
}
// Piles under the pier edges (drawn as their own flat strip under the planks' bottom edge).
def('coast_piles', 32, 12, (R) => {
  for (const x of [2, 26]) { R(x, 0, 5, 12, WD[1]); R(x, 0, 2, 12, WD[2]); R(x, 8, 5, 4, C.forest[0]); R(x - 1, 10, 7, 1, WA[4]); }
}, flat);

// ---------- sea wall (baked wall tile: stone blocks, algae at the waterline) ----------
for (let v = 0; v < 2; v++) def(`coast_seawall_${v}`, 32, 32, (R) => {
  R(0, 0, 32, 32, S[2]);
  R(0, 0, 32, 5, S[4]); R(0, 0, 32, 1, S[5]); R(0, 5, 32, 1, S[1]);          // coping stone
  for (let row = 0; row < 3; row++) {
    const y = 6 + row * 8, off = ((row + v) % 2) * 8;
    for (let x = -off; x < 32; x += 16) {
      const tone = hash(x + v * 40, row, 3) > 0.5 ? 3 : 2;
      R(x + 1, y, 14, 7, S[tone]); R(x + 1, y, 14, 1, S[tone + 1]); R(x + 14, y, 1, 7, S[1]);
    }
    R(0, y + 7, 32, 1, S[1]);
  }
  R(0, 24, 32, 8, C.forest[1]); dither(R, 0, 22, 32, 3, C.forest[1], 0.4); R(0, 28, 32, 4, C.forest[0]); // algae + wet line
  speckle(R, 0, 24, 32, 6, C.forest[2], 0.1, 9 + v);
}, flat);

// ---------- small dockside props ----------
def('coast_bollard', 16, 18, (R) => {
  R(3, 6, 10, 11, CH[2]); R(3, 6, 3, 11, CH[3]); R(11, 6, 2, 11, CH[1]);
  R.e(8, 5, 7, 3, CH[2]); R.e(7, 4, 5, 2, CH[3]); R(5, 3, 3, 1, CH[4]);
  R(2, 16, 12, 1, CH[1]);
}, sel);
def('coast_bollard_rope', 16, 18, (R) => {
  R(3, 6, 10, 11, CH[2]); R(3, 6, 3, 11, CH[3]); R(11, 6, 2, 11, CH[1]);
  R.e(8, 5, 7, 3, CH[2]); R.e(7, 4, 5, 2, CH[3]); R(5, 3, 3, 1, CH[4]);
  for (let i = 0; i < 12; i++) { px(R, 2 + i, 9 + (i % 2), i % 2 ? W[2] : W[4]); px(R, 2 + i, 11 + (i % 2), i % 2 ? W[1] : W[3]); }
  R(13, 11, 2, 6, W[3]); px(R, 14, 16, W[1]);
}, sel);
function crate(R, x, y, w, h, ramp, mark) {
  box(R, x, y, w, h, 6, ramp);
  for (let i = x + 3; i < x + w - 2; i += 6) R(i, y + 7, 1, h - 8, ramp[1]);
  R(x + 1, y + 6, w - 2, 1, ramp[0]); R(x + 1, y + Math.floor(h / 2) + 3, w - 2, 1, ramp[1]);
  if (mark) { R(x + 6, y + 10, w - 12, 5, P[3]); R(x + 8, y + 12, 4, 1, C.sky[1]); R(x + 12, y + 11, 1, 3, C.sky[1]); }
}
def('coast_crate', 26, 24, (R) => crate(R, 0, 0, 26, 24, W, true), sel);
def('coast_crates', 30, 44, (R) => { crate(R, 2, 20, 26, 24, W, true); crate(R, 4, 0, 22, 20, WD.map((c, i) => (i > 1 ? W[i - 1] : c)), false); }, sel);
def('coast_fishbox', 26, 16, (R) => {
  box(R, 0, 0, 26, 16, 4, C.sky);
  for (let i = 0; i < 4; i++) { R.e(5 + i * 5, 3, 3, 1, i % 2 ? MT[4] : C.coral[3]); px(R, 3 + i * 5, 3, INK); }
  R(2, 8, 22, 1, C.sky[1]); R(2, 12, 22, 1, C.sky[1]);
}, sel);
def('coast_net', 44, 20, (R) => {
  R.e(22, 12, 20, 7, C.forest[1]); R.e(20, 10, 16, 5, C.forest[2]);
  for (let y = 5; y < 19; y += 3) for (let x = 3; x < 42; x += 3) if (((x - 22) ** 2) / 400 + ((y - 12) ** 2) / 49 < 1) px(R, x, y, C.forest[3]);
  for (const [x, y, c] of [[8, 9, C.coral[2]], [17, 6, C.butter[2]], [28, 8, C.coral[2]], [36, 12, C.butter[2]], [24, 15, C.coral[2]]]) { R(x, y, 4, 3, c); R(x, y, 4, 1, c === C.coral[2] ? C.coral[3] : C.butter[3]); }
}, sel);
def('coast_rope', 20, 12, (R) => {
  R.e(10, 6, 9, 5, W[2]); R.e(10, 6, 6, 3, W[3]); R.e(10, 6, 3, 1, W[1]);
  for (let i = 0; i < 18; i += 3) px(R, 2 + i, 6 + (i % 2), W[4]);
  R(16, 9, 4, 2, W[2]);
}, sel);
def('coast_lifering', 20, 40, (R) => {
  R(8, 12, 4, 28, WD[2]); R(8, 12, 1, 28, WD[3]);
  for (let y = -9; y <= 9; y++) for (let x = -9; x <= 9; x++) { const d = x * x + y * y; if (d <= 85 && d > 20) px(R, 10 + x, 10 + y, d < 40 ? C.leafAutumn[1] : C.leafAutumn[2]); }
  R(1, 8, 4, 4, P[4]); R(15, 8, 4, 4, P[4]); R(8, 1, 4, 3, P[4]); R(8, 16, 4, 3, P[4]);
  R(3, 4, 3, 2, C.leafAutumn[3]); R(13, 15, 3, 2, C.leafAutumn[1]);
}, sel);
def('coast_buoy', 14, 18, (R) => {
  R(6, 0, 2, 5, MT[2]); R(4, 4, 6, 2, MT[3]);
  R.e(7, 10, 6, 5, C.ribbon[2]); R(1, 9, 12, 3, P[4]); R.e(5, 8, 2, 2, C.ribbon[3]);
  R(1, 14, 12, 3, C.ribbon[1]); R(0, 16, 14, 1, WA[4]);
}, sel);
def('coast_lamp', 14, 60, (R) => {
  R(4, 54, 6, 5, C.navy[1]); R(3, 58, 8, 2, C.navy[0]);
  R(5, 14, 4, 42, C.navy[2]); R(5, 14, 1, 42, C.navy[3]); R(8, 14, 1, 42, C.navy[1]);
  R(1, 2, 12, 2, C.navy[1]); R(3, 0, 8, 2, C.navy[2]);
  R(2, 4, 10, 9, C.butter[3]); R(2, 4, 10, 1, C.butter[4]); R(6, 4, 2, 9, C.navy[1]); R(2, 12, 10, 1, C.butter[1]);
  R(1, 13, 12, 2, C.navy[1]);
}, sel);
def('coast_bench', 48, 26, (R) => {
  R(3, 14, 4, 11, WD[1]); R(41, 14, 4, 11, WD[1]);
  R(0, 2, 48, 4, W[3]); R(0, 2, 48, 1, W[4]); R(0, 7, 48, 3, W[2]); R(0, 7, 48, 1, W[3]);
  R(1, 12, 46, 3, W[3]); R(1, 12, 46, 1, W[4]); R(1, 15, 46, 1, W[1]); R(2, 16, 44, 1, WD[1]);
  R(4, 0, 3, 14, WD[2]); R(41, 0, 3, 14, WD[2]);
}, sel);
def('coast_tide_board', 36, 48, (R) => {
  R(4, 30, 3, 18, WD[2]); R(29, 30, 3, 18, WD[1]);
  R(0, 2, 36, 30, W[2]); R(0, 2, 36, 1, W[4]); R(0, 0, 36, 3, WD[2]); R(0, 0, 36, 1, WD[3]); R(0, 31, 36, 1, W[1]);
  R(3, 5, 30, 24, P[3]); R(3, 5, 30, 1, P[4]);
  for (let x = 0; x < 28; x++) { const y = 17 + Math.round(Math.sin(x * 0.42) * 6); R(4 + x, y, 1, 2, C.sky[1]); if (x % 9 === 3) R(4 + x, 24, 1, 4, C.sky[2]); }
  R(4, 23, 28, 1, C.sky[3]);
  R(25, 6, 6, 4, C.coral[2]); letters(R, 5, 6, 'TIDE', INK);
}, sel);
def('coast_binocular', 22, 42, (R) => {
  R(8, 18, 6, 22, MT[2]); R(8, 18, 2, 22, MT[3]); R(5, 38, 12, 3, MT[1]);
  R(2, 6, 18, 12, C.mint[2]); R(2, 6, 18, 2, C.mint[3]); R(16, 8, 4, 10, C.mint[1]);
  R(0, 8, 5, 6, MT[2]); R(0, 8, 2, 6, MT[4]); R(17, 0, 4, 7, MT[2]);
  R(3, 2, 5, 5, C.charcoal[2]); R(11, 2, 5, 5, C.charcoal[2]); R(4, 3, 2, 1, C.sky[3]); R(12, 3, 2, 1, C.sky[3]);
  R(8, 12, 6, 3, C.butter[2]); px(R, 10, 13, INK);
}, sel);

// ---------- Captain Jun's boat Sayori (bow to the right, drawn bobbing by the harbour layer) ----------
def('coast_sayori', 124, 60, (R) => {
  // hull (¾ view: deck seen from above, white side below)
  R.t([4, 28], [118, 28], [108, 52], P[3]); R(4, 28, 104, 24, P[3]);
  R.t([108, 28], [123, 26], [108, 52], P[3]);
  R(6, 46, 104, 6, C.ribbon[2]); R.t([108, 46], [116, 46], [108, 52], C.ribbon[2]);                  // red waterline
  R(4, 30, 116, 3, C.navy[2]); R(4, 30, 116, 1, C.navy[3]);                                         // navy stripe
  R(4, 34, 104, 1, P[4]); R(6, 44, 102, 2, P[1]);
  // deck
  R(6, 18, 104, 11, W[3]); R.t([110, 18], [121, 25], [110, 29], W[3]);
  for (let x = 8; x < 110; x += 7) R(x, 19, 1, 9, W[2]);
  R(4, 16, 108, 3, P[4]); R.t([112, 16], [123, 25], [112, 19], P[4]); R(4, 27, 116, 2, P[2]);       // gunwale
  // wheelhouse
  R(22, 0, 34, 26, P[3]); R(22, 0, 34, 3, C.navy[2]); R(22, 0, 34, 1, C.navy[3]);
  R(54, 3, 2, 23, P[1]); R(22, 3, 1, 23, P[4]);
  R(26, 6, 10, 8, C.sky[2]); R(26, 6, 10, 2, C.sky[3]); px(R, 28, 9, P[4]); px(R, 29, 8, P[4]);
  R(40, 6, 10, 8, C.sky[2]); R(40, 6, 10, 2, C.sky[3]); px(R, 42, 9, P[4]);
  R(22, 18, 34, 2, C.navy[2]);
  // mast + flag, nets, buoys, life ring
  R(68, 0, 2, 18, WD[2]); R(70, 1, 9, 5, C.butter[2]); R(70, 1, 9, 1, C.butter[3]); R(70, 5, 9, 1, C.butter[1]);
  R.e(86, 22, 10, 4, C.forest[2]); for (let i = 0; i < 8; i++) px(R, 78 + i * 2, 21 + (i % 2), C.forest[3]);
  R(98, 19, 4, 4, C.coral[2]); R(92, 24, 4, 3, C.butter[2]);
  R.e(12, 37, 4, 4, C.leafAutumn[2]); R.e(12, 37, 1, 1, P[3]); R(11, 33, 2, 2, P[4]);
  // name plate: SAYORI
  R(60, 37, 30, 7, C.navy[2]); letters(R, 62, 38, 'SAYORI', P[4]);
  R(108, 30, 2, 1, P[4]);
}, sel);
def('coast_rowboat_a', 60, 28, (R) => rowboat(R, C.mint), sel);
def('coast_rowboat_b', 60, 28, (R) => rowboat(R, C.coral), sel);
function rowboat(R, ramp) {
  R.e(30, 12, 28, 9, ramp[2]); R.e(30, 11, 25, 7, W[3]); R(6, 12, 48, 1, ramp[3]);
  R(14, 6, 3, 12, W[2]); R(40, 6, 3, 12, W[2]); R(18, 10, 22, 2, W[1]);
  R(4, 16, 52, 6, ramp[1]); R(8, 21, 44, 2, ramp[0]); R(6, 15, 48, 1, ramp[3]);
  R(26, 4, 3, 2, W[4]);
  R(44, 9, 14, 2, WD[2]); R(54, 7, 4, 6, WD[3]);
}

// ---------- seagull (animal: ink outline) ----------
const gull = (R, f, fly) => {
  const Wg = P[4], G = MT[3], G2 = MT[2], B = C.butter[1];
  if (!fly) {
    R(3, 3, 8, 5, Wg); R(1, 5, 3, 2, G); R(5, 4, 6, 3, G); R(6, 4, 4, 1, MT[4]); px(R, 11, 5, CH[1]);
    R(9, 0, 4, 4, Wg); px(R, 11, 1, INK); R(13, 2, 2, 1, B); R(5, 8, 1, f ? 1 : 2, B); R(8, 8, 1, 2, B);
    return;
  }
  const up = f % 2 === 0;
  R(5, 5, 8, 3, Wg); R(12, 4, 3, 3, Wg); px(R, 13, 5, INK); R(15, 5, 2, 1, B);
  if (up) { R(2, 1, 6, 3, G); R(0, 0, 3, 2, CH[2]); R(8, 2, 3, 3, G2); R(10, 0, 4, 3, G); R(13, 0, 2, 1, CH[2]); }
  else { R(2, 7, 6, 2, G); R(0, 8, 3, 2, CH[2]); R(9, 7, 5, 2, G); R(13, 8, 2, 2, CH[2]); }
  R(3, 6, 2, 1, Wg);
};
def('coast_gull_0', 16, 11, (R) => gull(R, 0, false), { hd: true, outline: 'ink' });
def('coast_gull_1', 16, 11, (R) => gull(R, 1, false), { hd: true, outline: 'ink' });
def('coast_gull_fly0', 18, 11, (R) => gull(R, 0, true), { hd: true, outline: 'ink' });
def('coast_gull_fly1', 18, 11, (R) => gull(R, 1, true), { hd: true, outline: 'ink' });

// ---------- fish market stalls ----------
function stall(R, A, Bk) {
  // posts
  R(4, 18, 4, 52, WD[2]); R(4, 18, 1, 52, WD[3]); R(80, 18, 4, 52, WD[1]);
  // counter with ice bed
  box(R, 0, 42, 88, 28, 12, W);
  R(2, 44, 84, 8, C.sky[4]); dither(R, 2, 44, 84, 8, C.sky[3], 0.3);
  const fish = [[MT[3], MT[1]], [C.coral[3], C.coral[1]], [C.sky[2], C.sky[0]], [C.butter[3], C.butter[1]]];
  for (let i = 0; i < 9; i++) { const [a, b] = fish[i % 4], x = 5 + i * 9; R.e(x + 3, 47 + (i % 2), 4, 2, a); R(x - 1, 47 + (i % 2), 2, 2, b); px(R, x + 5, 47 + (i % 2), INK); }
  for (let i = 0; i < 4; i++) { R(8 + i * 20, 56, 10, 6, P[4]); R(9 + i * 20, 58, 6, 1, C.ribbon[2]); R(9 + i * 20, 60, 4, 1, INK); }
  R(0, 66, 88, 4, W[1]);
  // awning: stripes + scalloped edge
  R(0, 4, 88, 16, A[2]);
  for (let x = 0; x < 88; x += 16) R(x + 8, 4, 8, 16, Bk[3]);
  R(0, 4, 88, 2, A[3]); for (let x = 0; x < 88; x += 16) R(x + 8, 4, 8, 2, Bk[4]);
  for (let x = 0; x < 88; x += 4) { const c = Math.floor(x / 8) % 2 ? Bk[2] : A[1]; R(x, 20, 4, 1, c); R(x + 1, 21, 2, 1, c); }
  R(0, 0, 88, 4, W[2]); R(0, 0, 88, 1, W[3]); R(44, 0, 2, 4, W[1]);
  // hanging sign
  R(30, 24, 28, 9, W[3]); R(30, 24, 28, 1, W[4]); R(43, 20, 1, 4, CH[2]); letters(R, 32, 26, 'FISH', W[0]);
}
def('coast_stall_a', 88, 70, (R) => stall(R, C.sky, P), sel);
def('coast_stall_b', 88, 70, (R) => stall(R, C.coral, P), sel);

// ---------- Bait & Tackle shop front ----------
def('coast_bait_shop', 184, 128, (R) => {
  const SK = C.sky, RT = C.roofTeal;
  // roof plane (tin, vertical seams) seen from above
  R(0, 0, 184, 40, RT[2]);
  for (let x = 2; x < 184; x += 6) { R(x, 0, 1, 40, RT[3]); R(x + 4, 0, 1, 40, RT[1]); }
  R(0, 0, 184, 2, RT[4]); R(0, 38, 184, 3, RT[0]);
  speckle(R, 0, 4, 184, 32, RT[1], 0.02, 31);
  // wall (weathered blue siding)
  R(4, 41, 176, 84, SK[2]);
  for (let y = 44; y < 120; y += 5) { R(4, y, 176, 1, SK[1]); R(4, y + 1, 176, 1, SK[3]); }
  R(4, 41, 176, 3, C.navy[1]);                                 // eave shadow
  R(4, 41, 3, 84, SK[3]); R(177, 41, 3, 84, SK[1]);             // corner posts
  R(4, 118, 176, 7, WD[2]); R(4, 118, 176, 1, WD[3]);           // skirting
  // big window with lures and rods
  R(16, 58, 64, 40, WD[2]); R(19, 61, 58, 34, SK[1]); R(19, 61, 58, 8, SK[3]); px(R, 24, 66, P[4]); px(R, 25, 65, P[4]); px(R, 60, 66, P[4]);
  for (let i = 0; i < 6; i++) { R(24 + i * 9, 70, 1, 6 + (i % 3) * 2, CH[3]); R(22 + i * 9, 76 + (i % 3) * 2, 5, 3, [C.coral[2], C.butter[2], C.mint[2]][i % 3]); }
  R(19, 86, 58, 9, W[2]); R(19, 86, 58, 1, W[3]); for (let i = 0; i < 5; i++) R(24 + i * 11, 82, 6, 4, i % 2 ? C.butter[2] : C.mint[3]);
  R(16, 98, 64, 3, W[3]); R(46, 58, 2, 40, WD[2]);
  // door (glass shop door, OPEN sign)
  R(98, 66, 32, 54, WD[1]); R(100, 68, 28, 52, W[2]); R(103, 71, 22, 26, SK[3]); R(103, 71, 22, 4, SK[4]); px(R, 107, 79, P[4]); px(R, 108, 78, P[4]);
  R(105, 82, 18, 7, C.coral[2]); letters(R, 106, 83, 'OPEN', P[4]);
  R(103, 100, 22, 16, W[1]); R(124, 92, 2, 4, C.butter[2]);
  R(96, 120, 36, 4, S[3]); R(96, 120, 36, 1, S[4]);
  // hanging sign on a bracket
  R(136, 46, 40, 2, CH[2]); R(140, 48, 1, 3, CH[2]); R(171, 48, 1, 3, CH[2]);
  R(134, 51, 44, 22, W[3]); R(134, 51, 44, 1, W[4]); R(134, 72, 44, 1, W[1]);
  letters(R, 140, 54, 'BAIT &', C.navy[1]); letters(R, 138, 63, 'TACKLE', C.navy[1]);
  // fish weathervane-style sign over the door + buoys on the wall
  R.e(114, 54, 12, 5, C.butter[2]); R.e(112, 53, 8, 2, C.butter[3]); R.t([126, 54], [132, 49], [132, 59], C.butter[1]); px(R, 106, 53, INK);
  for (const [x, y, c] of [[146, 84, C.coral[2]], [158, 90, C.butter[2]], [168, 82, C.mint[2]]]) { R(x, 76, 1, y - 76, CH[3]); R.e(x, y, 4, 5, c); R(x - 4, y, 9, 1, P[4]); }
  // rods leaning by the door
  for (let i = 0; i < 3; i++) R(88 + i * 3, 70 + i * 4, 1, 54 - i * 4, i === 1 ? C.coral[1] : WD[3]);
}, sel);

// ---------- warehouse (fisheries co-op) ----------
def('coast_coop', 184, 126, (R) => {
  const RS = C.roofSlate, BR = C.brick;
  R(0, 0, 184, 42, RS[2]);
  for (let y = 2; y < 40; y += 6) for (let x = (y / 6) % 2 ? 0 : 4; x < 184; x += 8) { R(x, y, 7, 5, RS[3]); R(x, y + 4, 7, 1, RS[1]); }
  R(0, 0, 184, 2, RS[4]); R(0, 40, 184, 3, RS[0]);
  R(4, 43, 176, 80, BR[3]);
  for (let r = 0; r < 13; r++) { const y = 46 + r * 6; R(4, y, 176, 1, BR[1]); for (let x = 4 + (r % 2) * 6; x < 180; x += 12) R(x, y, 1, 6, BR[1]); }
  R(4, 43, 176, 3, BR[0]);
  // sliding door
  R(60, 62, 64, 60, MT[2]); for (let x = 62; x < 124; x += 4) R(x, 62, 1, 60, MT[1]); R(60, 62, 64, 2, MT[3]); R(91, 62, 2, 60, MT[0]);
  R(56, 58, 72, 4, CH[2]); R(56, 58, 72, 1, CH[3]);
  // sign
  R(62, 47, 60, 10, P[3]); R(62, 47, 60, 1, P[4]); letters(R, 66, 49, 'FISH CO-OP', C.navy[1]);
  // small windows
  for (const x of [16, 144]) { R(x, 66, 24, 20, WD[2]); R(x + 2, 68, 20, 16, C.sky[1]); R(x + 2, 68, 20, 4, C.sky[3]); R(x + 11, 68, 2, 16, WD[2]); }
  R(4, 118, 176, 5, S[2]); R(4, 118, 176, 1, S[3]);
}, sel);

// ---------- noodle stand (yatai) ----------
function yatai(R, lit) {
  const RD = C.ribbon, lan = lit ? [C.butter[3], C.butter[4]] : [C.coral[2], C.coral[3]];
  // roof
  R(0, 4, 96, 14, WD[2]); for (let x = 1; x < 96; x += 5) { R(x, 4, 1, 14, WD[3]); R(x + 3, 4, 1, 14, WD[1]); }
  R(0, 4, 96, 2, WD[3]); R(0, 17, 96, 2, WD[0]);
  // posts
  R(6, 19, 4, 40, W[2]); R(86, 19, 4, 40, W[1]);
  // noren curtains
  for (let i = 0; i < 4; i++) { const x = 12 + i * 18; R(x, 19, 16, 18, RD[2]); R(x, 19, 16, 2, RD[3]); R(x + 15, 21, 1, 16, RD[1]); }
  R.e(48, 27, 6, 4, P[4]); R(42, 27, 13, 1, RD[2]); R(44, 23, 1, 3, P[4]); R(50, 22, 1, 4, P[4]);   // bowl + chopsticks
  // counter + bowls + steam
  box(R, 2, 50, 92, 26, 10, W);
  for (let i = 0; i < 3; i++) { R.e(24 + i * 22, 52, 6, 2, P[4]); R(19 + i * 22, 52, 11, 2, RD[2]); }
  for (let i = 0; i < 4; i++) R(14 + i * 23, 62, 12, 10, W[1]);
  R(70, 40, 18, 10, CH[2]); R(70, 40, 18, 2, CH[3]); R(72, 36, 4, 4, P[3]); px(R, 74, 33, P[4]); px(R, 73, 30, P[3]);
  // wheel
  R.e(84, 76, 7, 7, WD[2]); R.e(84, 76, 4, 4, WD[3]); R(83, 70, 2, 13, WD[1]); R(77, 75, 13, 2, WD[1]);
  // paper lanterns at the corners
  for (const x of [4, 86]) { R(x + 2, 18, 2, 3, CH[2]); R.e(x + 3, 26, 5, 6, lan[0]); R(x - 1, 23, 9, 1, lan[1]); R(x - 1, 27, 9, 1, lit ? C.butter[2] : C.coral[1]); R(x, 31, 6, 2, CH[2]); R(x, 20, 6, 1, CH[2]); }
}
def('coast_yatai', 96, 84, (R) => yatai(R, false), sel);
def('coast_yatai_lit', 96, 84, (R) => yatai(R, true), sel);
def('coast_stool', 14, 16, (R) => { R.e(7, 3, 6, 2, C.ribbon[2]); R(1, 3, 12, 2, C.ribbon[1]); R(3, 5, 2, 10, CH[2]); R(9, 5, 2, 10, CH[1]); R(3, 10, 8, 1, CH[2]); }, sel);

// ---------- Theo's mural wall (seasonal details) ----------
def('coast_mural', 192, 84, (R, ctx) => {
  const season = ctx.season, PL = C.plaster, N = C.navy;
  R(0, 0, 192, 84, PL[3]); R(0, 0, 192, 6, S[4]); R(0, 0, 192, 1, S[5]); R(0, 6, 192, 1, S[2]);
  R(0, 78, 192, 6, S[2]); R(0, 78, 192, 1, S[3]);
  // night-sky mural with a whale swimming through stars
  R(4, 9, 184, 67, N[1]);
  for (let y = 9; y < 76; y++) if (y > 30) dither(R, 4, y, 184, 1, N[2], (y - 30) / 60);
  for (let i = 0; i < 46; i++) { const x = 6 + Math.floor(hash(i, 1, 41) * 180), y = 11 + Math.floor(hash(i, 2, 41) * 40); px(R, x, y, i % 5 ? P[4] : C.butter[3]); }
  // waves along the bottom
  for (let x = 4; x < 188; x++) { const y = 64 + Math.round(Math.sin(x * 0.18) * 3); R(x, y, 1, 76 - y, C.sky[2]); px(R, x, y, C.sky[4]); if (x % 12 < 3) px(R, x, y + 3, P[4]); }
  // whale
  R.e(92, 42, 34, 12, C.sky[1]); R.e(88, 46, 28, 6, C.sky[3]); R.t([124, 40], [146, 28], [140, 46], C.sky[1]); R.t([124, 44], [148, 50], [136, 38], C.sky[1]);
  px(R, 70, 40, P[4]); R(69, 41, 3, 1, INK); for (let i = 0; i < 4; i++) R(76 + i * 8, 50, 5, 1, C.sky[4]);
  R(78, 24, 2, 6, C.sky[4]); R(74, 20, 2, 4, C.sky[4]); R(82, 21, 2, 4, C.sky[4]);
  // the lighthouse beam (a star) top right
  R.t([160, 18], [176, 14], [176, 22], C.butter[3]); R(156, 14, 6, 10, P[4]); R(157, 24, 4, 30, P[3]); R(157, 30, 4, 3, C.coral[2]); R(157, 40, 4, 3, C.coral[2]);
  for (const [x, y] of [[30, 20], [44, 30], [120, 16]]) { R(x - 2, y, 5, 1, C.butter[3]); R(x, y - 2, 1, 5, C.butter[3]); px(R, x, y, P[4]); }
  // season details
  if (season === 'spring') for (let i = 0; i < 24; i++) { const x = 6 + Math.floor(hash(i, 5, 43) * 180), y = 10 + Math.floor(hash(i, 6, 43) * 50); R(x, y, 2, 2, C.sakura[2]); px(R, x, y, C.sakura[3]); }
  if (season === 'summer') { R.e(28, 22, 9, 9, C.butter[2]); R.e(26, 20, 5, 5, C.butter[3]); for (const [x, y] of [[50, 18], [60, 24], [112, 20]]) { R(x, y, 3, 1, P[4]); R(x + 3, y - 1, 3, 1, P[4]); } }
  if (season === 'autumn') { R.e(30, 22, 8, 8, C.butter[3]); R.e(33, 20, 6, 6, N[1]); for (let i = 0; i < 18; i++) { const x = 6 + Math.floor(hash(i, 7, 44) * 180), y = 10 + Math.floor(hash(i, 8, 44) * 50); R(x, y, 3, 2, i % 2 ? C.leafAutumn[2] : C.leafAutumn[3]); } }
  if (season === 'winter') { R(0, 0, 192, 4, C.snow[4]); dither(R, 0, 4, 192, 2, C.snow[3], 0.5); for (let i = 0; i < 30; i++) px(R, 6 + Math.floor(hash(i, 9, 45) * 180), 10 + Math.floor(hash(i, 10, 45) * 60), C.snow[4]); R.e(30, 60, 7, 6, P[4]); R.e(30, 50, 5, 5, P[4]); px(R, 29, 49, INK); px(R, 32, 49, INK); R(30, 51, 3, 1, C.leafAutumn[2]); }
  // signature + paint cans
  R(170, 68, 14, 6, N[1]); letters(R, 171, 69, 'TP', C.coral[3]);
  for (const [x, c] of [[8, C.coral[2]], [16, C.butter[2]], [176, C.mint[2]]]) { R(x, 72, 6, 7, MT[3]); R(x, 72, 6, 2, c); R(x, 78, 6, 1, MT[1]); }
}, { hd: true, outline: 'selective', seasonal: true });
