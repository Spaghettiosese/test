// The town's other animals at 1:1 density with ink outlines: Kuro the kitten, Daifuku the shiba, ducks, koi,
// seagulls, sparrows and butterflies. Every sprite faces right; the world flips for left.
import { defineSprite } from '../../art.js';
import { RAMPS } from '../../gfx/palette.js';
import { CAT_PALETTES } from './cats.js';

const INK = '#2a1a22', WHITE = '#fffaf0';
const ink = { hd: true, outline: 'ink' };
const noOutline = { hd: true };

// ================================================================ Kuro: a small charcoal kitten, white socks, a bent ear
const K = CAT_PALETTES.kuro, KF = K.fur;
function kEyes(R, x, y, mode) {
  if (mode === 'blink') { R(x, y + 1, 2, 1, INK); R(x + 5, y + 1, 2, 1, INK); return; }
  if (mode === 'happy') { R(x, y + 1, 1, 1, INK); R(x + 1, y, 1, 1, INK); R(x + 5, y, 1, 1, INK); R(x + 6, y + 1, 1, 1, INK); return; }
  for (const ex of [x, x + 5]) { R(ex, y, 2, 3, INK); R(ex + 1, y + 1, 1, 2, K.eye[1]); R(ex, y, 1, 1, WHITE); }
}
function kHead(R, mode = 'open', o = {}) {
  if (o.flat) { R.t([0, 4], [4, 2], [1, 6], KF[3]); R.t([10, 2], [13, 3], [12, 6], KF[3]); }
  else { R.t([1, 0], [0, 5], [5, 2], KF[3]); R(2, 2, 1, 2, K.nose); R.t([11, 1], [8, 2], [12, 5], KF[3]); R(11, 0, 2, 2, KF[2]); R(10, 3, 1, 1, K.nose); }
  R.e(6, 6, 6, 4, KF[3]); R(1, 6, 11, 3, KF[3]); R(10, 4, 2, 5, KF[2]); R(2, 3, 3, 1, KF[4]); R(3, 10, 7, 1, KF[2]);
  R.e(6, 8, 2, 1, K.cream[1]); R(6, 7, 1, 1, K.nose);
  kEyes(R, 2, 5, mode);
  if (o.mouth) { R(5, 9, 3, 2, '#7a2a35'); R(5, 9, 1, 1, WHITE); R(7, 9, 1, 1, WHITE); }
}
function kuroSit(R, tail, mode, o = {}) {
  const tip = [[12, 8], [13, 7], [13, 9]][tail];
  R(10, 14, 3, 2, KF[2]); R(tip[0], tip[1], 2, 14 - tip[1], KF[2]);
  R.e(7, 11, 4, 4, KF[2]); R.e(6, 10, 3, 3, KF[3]); R(3, 13, 9, 3, KF[2]); R.e(6, 12, 2, 2, K.cream[0]);
  R(3, 14, 3, 2, K.cream[1]); R(7, 14, 3, 2, K.cream[1]); R(6, 14, 1, 2, KF[1]);
  kHead(R.at(0, 0), mode, o);
}
function kuroWalk(R, f) {
  const L = [[[13, 0], [5, 1], [11, 1], [7, 0]], [[14, 0], [4, 0], [12, 1], [6, 0]], [[12, 1], [6, 0], [13, 0], [5, 1]], [[11, 0], [7, 1], [14, 0], [4, 0]]][f % 4];
  const leg = (x, l, c) => { R(x, 8 - l, 2, 4, c); R(x, 11 - l, 3, 1, K.cream[1]); };
  leg(L[0][0], L[0][1], KF[1]); leg(L[1][0], L[1][1], KF[1]);
  const tw = [0, 1, 0, -1][f % 4];
  R(3, 2 + tw, 2, 5, KF[2]); R(2, 1 + tw, 2, 2, KF[3]);
  R.e(9, 6, 6, 3, KF[2]); R.e(9, 5, 5, 2, KF[3]); R(5, 4, 3, 1, KF[4]); R(9, 8, 5, 1, K.cream[0]);
  leg(L[2][0], L[2][1], KF[3]); leg(L[3][0], L[3][1], KF[3]);
  // head
  R.t([13, 0], [12, 4], [16, 2], KF[3]); R.t([18, 0], [16, 2], [19, 3], KF[3]); R(18, 0, 2, 1, KF[2]);
  R.e(16, 5, 4, 3, KF[3]); R(13, 3, 3, 1, KF[4]); R(18, 6, 2, 2, K.cream[1]); R(19, 5, 1, 1, K.nose);
  R(16, 4, 2, 2, INK); R(17, 5, 1, 1, K.eye[1]); R(16, 4, 1, 1, WHITE);
}
function kuroSleep(R, f) {
  const br = f % 2;
  R.e(11, 5 - br, 7, 3 + br, KF[2]); R.e(10, 4 - br, 6, 2 + br, KF[3]); R(8, 2 - br, 4, 1, KF[4]);
  R(3, 7, 12, 2, KF[2]); R(3, 7, 2, 2, KF[1]);
  R.t([1, 1], [0, 4], [3, 3], KF[3]); R.t([6, 1], [4, 3], [7, 4], KF[3]); R(6, 1, 2, 1, KF[2]);
  R.e(4, 5, 4, 2, KF[3]); R(1, 4, 1, 1, INK); R(2, 5, 1, 1, INK); R(5, 5, 1, 1, INK); R(6, 4, 1, 1, INK);
  R(0, 7, 3, 2, K.cream[1]); R(4, 6, 1, 1, K.nose);
}
for (let t = 0; t < 3; t++) defineSprite(`kuro_sit_${t}`, 15, 16, (R) => kuroSit(R, t, 'open'), ink);
defineSprite('kuro_sit_b', 15, 16, (R) => kuroSit(R, 0, 'blink'), ink);
defineSprite('kuro_sit_happy', 15, 16, (R) => kuroSit(R, 1, 'happy'), ink);
defineSprite('kuro_sit_meow', 15, 16, (R) => kuroSit(R, 2, 'happy', { mouth: true }), ink);
defineSprite('kuro_hiss', 15, 16, (R) => kuroSit(R, 2, 'open', { flat: true, mouth: true }), ink);
defineSprite('kuro_scared', 15, 16, (R) => kuroSit(R, 0, 'open', { flat: true }), ink);
for (let f = 0; f < 4; f++) defineSprite(`kuro_walk_${f}`, 20, 12, (R) => kuroWalk(R, f), ink);
for (let f = 0; f < 2; f++) defineSprite(`kuro_sleep_${f}`, 18, 9, (R) => kuroSleep(R, f), ink);

// ================================================================ Daifuku: cream-and-tan shiba, red collar, curly tail (~30x26)
const D = { tan: ['#7a4e2a', '#c4943e', '#e0b070', '#e8c890', '#f8e0b0'], cream: ['#e8d8c4', '#f8ece0', WHITE], collar: RAMPS.ribbon, nose: '#2a1a22', tongue: '#e0707a' };
function dogHead(R, o = {}) {
  // pointy ears, cream cheeks (urajiro), fox-like muzzle facing right
  R.t([3, 0], [2, 6], [7, 4], D.tan[2]); R(4, 2, 1, 3, D.tan[1]);
  R.t([9, 0], [7, 4], [12, 5], D.tan[3]); R(9, 2, 1, 3, D.tan[1]);
  R.e(7, 8, 6, 5, D.tan[3]); R(3, 5, 4, 1, D.tan[4]);
  R.e(8, 11, 5, 2, D.cream[1]); R(11, 8, 5, 4, D.cream[1]); R(15, 8, 1, 2, D.nose); R(12, 11, 4, 1, D.cream[0]);
  R(5, 6, 2, 1, D.cream[1]); R(9, 6, 2, 1, D.cream[1]);           // eyebrow dots
  if (o.blink) R(7, 8, 3, 1, INK);
  else if (o.happy) { R(7, 8, 1, 1, INK); R(8, 7, 1, 1, INK); R(9, 8, 1, 1, INK); }
  else { R(8, 7, 2, 2, INK); R(8, 7, 1, 1, WHITE); }
  if (o.tongue) { R(12, 12, 3, 1, '#7a2a35'); R(13, 13, 2, 2, D.tongue); }
  if (o.bark) { R(12, 11, 4, 2, '#7a2a35'); R(13, 12, 2, 1, D.tongue); }
}
function dogStand(R, f, o = {}) {
  const walk = o.walk, L = walk ? [[[17, 0], [6, 1], [19, 1], [8, 0]], [[18, 1], [5, 0], [20, 0], [7, 1]], [[19, 0], [6, 0], [18, 0], [9, 0]], [[20, 0], [7, 1], [17, 1], [8, 0]]][f % 4] : [[17, 0], [6, 0], [20, 0], [9, 0]];
  const leg = (x, l, c) => { R(x, 16 - l, 3, 7, c); R(x, 22 - l, 4, 1, D.cream[1]); };
  leg(L[0][0], L[0][1], D.tan[1]); leg(L[1][0], L[1][1], D.tan[1]);
  // curly tail over the back (wags)
  const wg = o.wag ? [0, 1, 0, -1][f % 4] : 0;
  R.e(5 + wg, 7, 4, 3, D.tan[3]); R.e(5 + wg, 7, 2, 1, D.cream[1]); R(3 + wg, 9, 3, 3, D.tan[2]);
  // body
  R.e(13, 15, 10, 5, D.tan[2]); R.e(12, 14, 9, 4, D.tan[3]); R(6, 11, 6, 1, D.tan[4]);
  R.e(15, 18, 6, 2, D.cream[1]);
  leg(L[2][0], L[2][1], D.tan[3]); leg(L[3][0], L[3][1], D.tan[3]);
  // collar + head
  R(19, 10, 3, 7, D.collar[2]); R(19, 15, 3, 1, D.collar[1]); R(20, 16, 2, 2, RAMPS.butter[2]);
  dogHead(R.at(14, 0), o);
}
function dogSit(R, f, o = {}) {
  const wg = [0, 1, 0, -1][f % 4];
  R.e(6 + wg, 15, 4, 3, D.tan[3]); R.e(6 + wg, 15, 2, 1, D.cream[1]);       // tail curl beside
  R.e(13, 17, 8, 7, D.tan[2]); R.e(12, 16, 7, 6, D.tan[3]); R(7, 12, 4, 1, D.tan[4]);
  R.e(17, 18, 3, 5, D.cream[1]); R(5, 22, 12, 2, D.tan[2]); R(4, 22, 6, 2, D.tan[3]);
  R(15, 18, 3, 6, D.tan[3]); R(15, 23, 4, 1, D.cream[1]); R(19, 19, 3, 5, D.tan[2]); R(19, 23, 4, 1, D.cream[1]);
  R(16, 10, 3, 4, D.collar[2]); R(17, 13, 2, 2, RAMPS.butter[2]);
  dogHead(R.at(10, 0), o);
}
function dogLie(R, f) {
  const br = f % 2;
  R.e(14, 10 - br, 11, 4 + br, D.tan[2]); R.e(13, 9 - br, 10, 3 + br, D.tan[3]); R(8, 6 - br, 6, 1, D.tan[4]);
  R.e(4, 9, 3, 2, D.tan[3]); R.e(4, 9, 1, 1, D.cream[1]);
  R(20, 12, 9, 2, D.tan[3]); R(26, 12, 4, 2, D.cream[1]);
  const H = R.at(15, 2);
  R.t([18, 1], [17, 6], [21, 4], D.tan[2]); R.t([23, 1], [21, 4], [25, 5], D.tan[3]);
  H.e(7, 6, 5, 4, D.tan[3]); H(10, 6, 5, 3, D.cream[1]); H(14, 6, 1, 2, D.nose); H(6, 6, 3, 1, INK); H(5, 4, 2, 1, D.cream[1]);
  R(18, 10, 2, 4, D.collar[2]);
}
for (let f = 0; f < 4; f++) defineSprite(`dai_walk_${f}`, 30, 23, (R) => dogStand(R, f, { walk: true, wag: true, tongue: true }), ink);
defineSprite('dai_stand', 30, 23, (R) => dogStand(R, 0, {}), ink);
defineSprite('dai_bark', 30, 23, (R) => dogStand(R, 0, { bark: true, wag: true }), ink);
for (let f = 0; f < 4; f++) defineSprite(`dai_sit_${f}`, 26, 24, (R) => dogSit(R, f, { tongue: f % 2 === 0, wag: true }), ink);
defineSprite('dai_sit_b', 26, 24, (R) => dogSit(R, 0, { blink: true }), ink);
defineSprite('dai_sit_happy', 26, 24, (R) => dogSit(R, 1, { happy: true, tongue: true }), ink);
for (let f = 0; f < 2; f++) defineSprite(`dai_lie_${f}`, 30, 15, (R) => dogLie(R, f), ink);
defineSprite('dai_ball', 6, 6, (R) => { R.e(3, 3, 3, 3, '#c8e04a'); R(1, 1, 2, 1, '#f0ff9a'); R(1, 3, 5, 1, WHITE); }, ink);

// ================================================================ Park ducks (swim, waddle) and koi
const DK = { body: ['#6a5040', '#a08060', '#c8a878', '#e0c8a0'], head: ['#1f4a3a', '#2f7a52', '#4fa078'], bill: RAMPS.butter, white: WHITE };
function duck(R, f, o = {}) {
  const bob = o.swim ? f % 2 : 0;
  if (o.swim) { R(0, 9, 16, 1, RAMPS.water[4]); R(2 + f, 10, 3, 1, RAMPS.water[5]); }
  R.e(7, 6 + bob, 6, 3, DK.body[2]); R.e(6, 5 + bob, 5, 2, DK.body[3]); R(1, 4 + bob, 3, 2, DK.body[1]); R(4, 7 + bob, 6, 1, DK.body[1]);
  R(7, 5 + bob, 3, 1, RAMPS.sky[2]);                 // speculum
  const hen = o.hen, H = hen ? DK.body : DK.head;
  R.e(12, 2 + bob, 2, 2, H[1]); R(11, 1 + bob, 2, 1, H[2]); R(12, 2 + bob, 1, 1, INK);
  if (!hen) R(10, 4 + bob, 3, 1, WHITE);
  R(14, 2 + bob, 2, 1, DK.bill[1]); R(14, 3 + bob, 2, 1, DK.bill[0]);
  if (!o.swim) { R(6, 9, 1, 2, RAMPS.butter[1]); R(9, 9 - f, 1, 2, RAMPS.butter[1]); R(9, 10, 2, 1, RAMPS.butter[1]); R(6, 10, 2, 1, RAMPS.butter[1]); }
}
for (let f = 0; f < 2; f++) {
  defineSprite(`duck_swim_${f}`, 16, 11, (R) => duck(R, f, { swim: true }), ink);
  defineSprite(`duck_hen_swim_${f}`, 16, 11, (R) => duck(R, f, { swim: true, hen: true }), ink);
  defineSprite(`duck_walk_${f}`, 16, 11, (R) => duck(R, f), ink);
}
// koi: seen from above in the water (no outline, slightly translucent orange/white)
function koi(R, f, c1, c2) {
  const sw = [0, 1, 0, -1][f];
  R(1, 3 + sw, 3, 2, c1); R(0, 2 + sw, 1, 4, c1);        // tail
  R.e(8, 4, 5, 2, c1); R(5, 3, 3, 2, c2); R(10, 3, 2, 2, c2); R(12, 3, 2, 1, INK); R(12, 5, 2, 1, INK);
}
const KOI = [['#f0703a', WHITE], [WHITE, '#f0703a'], ['#ffd76a', WHITE]];
KOI.forEach(([a, b], i) => { for (let f = 0; f < 4; f++) defineSprite(`koi_${i}_${f}`, 15, 9, (R) => koi(R, f, a, b), noOutline); });

// ================================================================ Seagulls (stand, walk, fly)
const GL = { w: ['#8a90a8', '#c8ccdc', '#f4f4f8', WHITE], grey: ['#5a6070', '#8a9aab'], beak: RAMPS.butter, leg: '#e0a84a' };
function gullStand(R, f) {
  R(4, 10, 1, 3, GL.leg); R(7, 10, 1, 3, GL.leg); R(4, 12, 2, 1, GL.leg); R(7, 12, 2, 1, GL.leg);
  R.e(6, 7, 5, 3, GL.w[2]); R(1, 5, 7, 3, GL.grey[1]); R(0, 5, 2, 2, INK); R(2, 8, 6, 1, GL.w[1]);
  R.e(10, 3 - (f % 2), 2, 2, GL.w[3]); R(10, 2 - (f % 2), 1, 1, INK); R(12, 3 - (f % 2), 2, 1, GL.beak[1]); R(13, 4 - (f % 2), 1, 1, '#e0503a');
}
function gullFly(R, f) {
  const up = f % 2 === 0;
  R.e(8, 6, 4, 2, GL.w[2]); R(12, 4, 2, 2, GL.w[3]); R(13, 5, 1, 1, INK); R(14, 5, 2, 1, GL.beak[1]); R(3, 6, 2, 1, GL.w[1]);
  if (up) { R.t([5, 5], [11, 5], [2, 0], GL.grey[1]); R(1, 0, 2, 1, INK); }
  else { R.t([5, 6], [11, 6], [2, 11], GL.grey[1]); R(1, 10, 2, 1, INK); }
}
for (let f = 0; f < 2; f++) defineSprite(`gull_stand_${f}`, 14, 13, (R) => gullStand(R, f), ink);
for (let f = 0; f < 2; f++) defineSprite(`gull_fly_${f}`, 16, 12, (R) => gullFly(R, f), ink);

// ================================================================ Sparrows (hop, peck, fly) ~8x8
const SP = { b: ['#5a3a2e', '#8a5e44', '#b08560', '#d0a87c'], belly: '#e8dcc8', cap: '#6a4436' };
function sparrow(R, f, mode) {
  if (mode === 'fly') {
    R.e(4, 4, 3, 2, SP.b[2]); R(6, 3, 2, 2, SP.cap); R(7, 3, 1, 1, INK); R(8, 4, 1, 1, RAMPS.butter[1]); R(0, 4, 2, 1, SP.b[1]);
    if (f % 2) R.t([2, 3], [6, 3], [3, 0], SP.b[1]); else R.t([2, 5], [6, 5], [3, 8], SP.b[1]);
    return;
  }
  const peck = mode === 'peck';
  R(3, 7, 1, 1, SP.b[0]); R(5, 7, 1, 1, SP.b[0]);
  R.e(4, 5, 3, 2, SP.b[2]); R(2, 4, 3, 1, SP.b[1]); R(3, 6, 3, 1, SP.belly); R(0, 3 + (f % 2), 2, 2, SP.b[1]);
  const hy = peck ? 3 : 1;
  R(5, hy, 3, 3, SP.b[3]); R(5, hy, 3, 1, SP.cap); R(6, hy + 1, 1, 1, INK); R(8, hy + 1, 1, 1, RAMPS.butter[1]); R(6, hy + 2, 2, 1, SP.belly);
}
for (let f = 0; f < 2; f++) { defineSprite(`sparrow_hop_${f}`, 9, 8, (R) => sparrow(R, f, 'hop'), ink); defineSprite(`sparrow_fly_${f}`, 9, 8, (R) => sparrow(R, f, 'fly'), ink); }
defineSprite('sparrow_peck', 9, 8, (R) => sparrow(R, 0, 'peck'), ink);
// pigeons for the square: a chunkier grey bird
function pigeon(R, f, peck) {
  R(4, 8, 1, 1, '#e0707a'); R(6, 8, 1, 1, '#e0707a');
  R.e(5, 5, 4, 3, '#8a8aa4'); R(1, 4, 4, 2, '#6a6a86'); R(3, 6, 4, 1, '#a8a8c0'); R(0, 4 + f, 2, 2, '#5a5a74');
  const hy = peck ? 3 : 0;
  R(7, hy + 1, 3, 3, '#7a7a98'); R(7, hy + 3, 3, 1, '#5fa88a'); R(8, hy + 1, 1, 1, INK); R(10, hy + 2, 1, 1, '#c8c8dc');
}
for (let f = 0; f < 2; f++) defineSprite(`pigeon_${f}`, 11, 9, (R) => pigeon(R, f, false), ink);
defineSprite('pigeon_peck', 11, 9, (R) => pigeon(R, 0, true), ink);

// ================================================================ Butterflies (2-frame flap), no outline; tiny and bright
const BF = [[RAMPS.butter[2], RAMPS.butter[0]], [RAMPS.sakura[2], RAMPS.sakura[0]], [WHITE, '#8a8aa4'], [RAMPS.sky[2], RAMPS.sky[0]]];
BF.forEach(([c, d], i) => {
  defineSprite(`bfly_${i}_0`, 7, 6, (R) => { R(0, 0, 3, 3, c); R(4, 0, 3, 3, c); R(1, 3, 2, 2, c); R(4, 3, 2, 2, c); R(3, 1, 1, 4, INK); R(0, 0, 1, 1, d); R(6, 0, 1, 1, d); }, noOutline);
  defineSprite(`bfly_${i}_1`, 7, 6, (R) => { R(1, 1, 2, 2, c); R(4, 1, 2, 2, c); R(2, 3, 1, 1, c); R(4, 3, 1, 1, c); R(3, 1, 1, 4, INK); }, noOutline);
});
