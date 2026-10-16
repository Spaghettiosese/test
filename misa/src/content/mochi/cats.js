// Cat sprites at 1:1 density (docs/ART.md scale chart): sit ~22x24, walk 30x20, sleep 28x14 including the ink outline.
// One parametric painter draws Mochi, the neighbourhood strays (palette swaps) and, at a smaller scale, Kuro the kitten.
// All sprites face right; the world flips them for left.
import { defineSprite, makeR } from '../../art.js';

// cdef: like defineSprite, but adds a transparent 1px margin and clips the drawing to it, so the ink outline
// always has room (tests/art.test.mjs) even when a pose reaches a pixel past its box.
export function cdef(name, w, h, draw, opts) {
  const W = w + 2, H = h + 2;
  defineSprite(name, W, H, (R0, ctx) => {
    const surf = { rect(x, y, ww, hh, c) {
      const x0 = Math.max(0, x), y0 = Math.max(0, y), x1 = Math.min(W, x + ww), y1 = Math.min(H, y + hh);
      if (x1 > x0 && y1 > y0) R0(x0, y0, x1 - x0, y1 - y0, c);
    } };
    draw(makeR(surf, 1, 1), ctx);
  }, opts);
}
import { RAMPS } from '../../gfx/palette.js';

const INK = '#2a1a22', WHITE = '#fffaf0';
// [deep, shade, base, light, highlight]
export const CAT_PALETTES = {
  mochi: { fur: ['#8a4a22', '#b8702f', '#d98d45', '#f2b56b', '#ffd9a0'], cream: [RAMPS.paper[2], RAMPS.paper[3]], eye: ['#3f9a52', '#6fcf7a'], nose: '#f7a1b1', stripes: true },
  kuro: { fur: ['#24222e', '#3a3846', '#5a5a64', '#76768a', '#9a9aac'], cream: ['#d8d4dc', '#f4f0f4'], eye: ['#c48a1e', '#ffd04a'], nose: '#c87a8a', stripes: false, socks: true, bentEar: true },
  // strays: a calico, a black cat, a white cat, a grey tabby and a tuxedo
  hanako: { fur: ['#6a4a3a', '#9a7058', '#f0e6d8', '#fff6ec', '#ffffff'], cream: ['#e8dccc', '#fffaf0'], eye: ['#b07a1e', '#f0c040'], nose: '#f0a0a8', patches: ['#d98d45', '#3a3038'] },
  sumi: { fur: ['#121018', '#1c1a26', '#2a2834', '#3c3a4a', '#5a5870'], cream: ['#2a2834', '#3c3a4a'], eye: ['#7a9a1e', '#d8f05a'], nose: '#5a4050' },
  yuki: { fur: ['#8a8aa4', '#c8c8dc', '#ecebf2', '#fbfaff', '#ffffff'], cream: ['#ecebf2', '#ffffff'], eye: ['#2f6fc4', '#7fc8f0'], nose: '#f7a1b1' },
  nezumi: { fur: ['#3a3848', '#5a5868', '#8a8898', '#aeacba', '#d0ced8'], cream: ['#d8d4dc', '#f4f0f4'], eye: ['#3f9a52', '#9ae07a'], nose: '#c87a8a', stripes: true },
  tux: { fur: ['#121018', '#1c1a26', '#2a2834', '#3c3a4a', '#5a5870'], cream: ['#e8e4ec', '#fffaf0'], eye: ['#b07a1e', '#f0c040'], nose: '#f0a0a8', socks: true, bib: true },
};

// ---------------------------------------------------------------- shared bits
function eye(R, x, y, P, h = 3) {         // a 2-wide cat eye: ink lid + iris + glint
  R(x, y, 2, h, INK); R(x + 1, y + 1, 1, h - 1, P.eye[1]); R(x, y + h - 1, 1, 1, P.eye[0]); R(x, y, 1, 1, WHITE);
}
const closedEye = (R, x, y) => { R(x, y + 1, 1, 1, INK); R(x + 1, y + 2, 1, 1, INK); R(x + 2, y + 1, 1, 1, INK); };
const lidEye = (R, x, y) => R(x, y + 1, 3, 1, INK);
function ear(R, P, tip, base0, base1, inner = true, bent = false) {
  R.t(tip, base0, base1, P.fur[3]);
  if (inner) { const cx = Math.round((tip[0] + base0[0] + base1[0]) / 3), cy = Math.round((tip[1] + base0[1] + base1[1]) / 3); R(cx, cy, 1, 2, P.nose); }
  if (bent) R(tip[0] - 1, tip[1], 3, 2, P.fur[2]);
}
function patches(R, P, spots) { if (!P.patches) return; spots.forEach(([x, y, w, h], i) => R(x, y, w, h, P.patches[i % 2])); }

// ---------------------------------------------------------------- SIT (front 3/4 view), content 20x22
// tail: frame 0..3 sway; mode: 'open' | 'blink' | 'happy' | 'wide' | 'groom0..3'
function sitBody(R, P, o = {}) {
  const tail = o.tail || 0, F = P.fur;
  // tail: lies on the floor to the right then curls up; the tip sways
  const tip = [[17, 13], [18, 12], [19, 13], [18, 14]][tail];
  R(13, 19, 4, 2, F[2]); R(16, 16, 2, 4, F[2]); R(tip[0] - 1, tip[1], 2, 17 - tip[1], F[2]); R(tip[0] - 1, tip[1], 2, 2, P.stripes ? F[1] : F[3]);
  R(14, 20, 3, 1, F[1]);
  // body (pear): haunch right, chest left
  R.e(9, 15, 6, 6, F[2]); R.e(8, 14, 5, 5, F[3]); R(4, 18, 11, 3, F[2]);
  R.e(7, 15, 2, 3, P.cream[1]); R(6, 17, 3, 2, P.cream[0]); R(5, 13, 2, 1, F[4]);
  if (P.bib) R.e(7, 14, 3, 4, P.cream[1]);
  R(13, 15, 2, 5, F[1]); R(3, 19, 1, 2, F[1]);
  if (P.stripes) { R(12, 12, 2, 1, F[1]); R(13, 14, 2, 1, F[1]); R(13, 17, 2, 1, F[1]); }
  patches(R, P, [[11, 12, 3, 3], [12, 17, 3, 2]]);
  // front paws
  const paw = P.socks ? P.cream[1] : F[3];
  R(5, 19, 3, 2, paw); R(9, 19, 3, 2, paw); R(8, 19, 1, 2, F[1]); R(5, 20, 3, 1, P.socks ? P.cream[0] : F[2]); R(9, 20, 3, 1, P.socks ? P.cream[0] : F[2]);
  R(6, 20, 1, 1, F[1]); R(10, 20, 1, 1, F[1]);
}
function sitHead(R, P, o = {}) {
  const F = P.fur, dy = o.headDy || 0, dx = o.headDx || 0, H = R.at(dx, dy);
  // ears
  if (o.flat) { H.t([1, 4], [4, 3], [1, 6], F[3]); H.t([12, 3], [15, 4], [15, 6], F[3]); }
  else {
    ear(H, P, [2, 0], [1, 5], [6, 3]); ear(H, P, [13, 0], [10, 3], [15, 5], true, P.bentEar);
  }
  H.e(8, 7, 7, 5, F[3]); H(2, 8, 13, 3, F[3]); H.e(8, 10, 6, 2, F[3]);
  H(1, 9, 2, 2, F[3]); H(14, 9, 2, 2, F[2]);                      // cheek fluff
  H(13, 5, 2, 5, F[2]); H(3, 4, 4, 1, F[4]); H(2, 5, 2, 1, F[4]); // shade right, light top-left
  H(4, 11, 9, 1, F[2]);
  if (P.stripes) { H(7, 2, 1, 2, F[1]); H(9, 2, 1, 2, F[1]); H(8, 3, 1, 1, F[1]); }
  patches(H, P, [[3, 3, 4, 3], [10, 2, 3, 3]]);
  // muzzle
  H.e(8, 9, 2, 1, P.cream[1]); H(8, 8, 1, 1, P.nose);
  const m = o.mode || 'open';
  if (m === 'open') { eye(H, 4, 6, P); eye(H, 11, 6, P); }
  else if (m === 'wide') { eye(H, 4, 5, P, 4); eye(H, 11, 5, P, 4); H(5, 7, 1, 1, INK); H(12, 7, 1, 1, INK); }
  else if (m === 'happy') { closedEye(H, 3, 6); closedEye(H, 11, 6); H(7, 10, 3, 1, '#b04a55'); H(3, 9, 2, 1, RAMPS.coral[3]); H(12, 9, 2, 1, RAMPS.coral[3]); }
  else if (m === 'sleepy') { lidEye(H, 3, 6); lidEye(H, 11, 6); }
  else { H(3, 7, 3, 1, INK); H(11, 7, 3, 1, INK); }            // blink
  if (o.mouth) { H(7, 10, 3, 2, '#7a2a35'); H(8, 11, 1, 1, RAMPS.coral[3]); }
}
export function paintSit(R0, P, o = {}) {
  const R = R0;
  sitBody(R, P, o);
  sitHead(R, P, o);
  if (o.harness) harnessSit(R);
}
function harnessSit(R) { const c = RAMPS.ribbon; R(3, 12, 11, 1, c[2]); R(3, 13, 11, 1, c[1]); R(7, 13, 2, 2, RAMPS.butter[2]); }

// ---------------------------------------------------------------- GROOM (sitting, licks a raised paw), content 20x22
function paintGroom(R, P, f) {
  sitBody(R, P, { tail: f % 4 });
  const F = P.fur;
  const H = R.at(1, 1 + (f % 2));
  ear(H, P, [2, 0], [1, 5], [6, 3]); ear(H, P, [13, 0], [10, 3], [15, 5], true, P.bentEar);
  H.e(8, 7, 7, 5, F[3]); H(2, 8, 13, 3, F[3]); H(13, 5, 2, 5, F[2]); H(3, 4, 4, 1, F[4]);
  if (P.stripes) { H(7, 2, 1, 2, F[1]); H(9, 2, 1, 2, F[1]); }
  patches(H, P, [[3, 3, 4, 3]]);
  closedEye(H, 3, 6); closedEye(H, 11, 6);
  H.e(8, 9, 2, 1, P.cream[1]); H(8, 8, 1, 1, P.nose);
  // a raised paw at the side of the muzzle, licked in a little rhythm
  const py = [9, 8, 9, 10][f], pc = P.socks ? P.cream[1] : F[3];
  R(1, py + 3, 3, 8, F[3]); R(3, py + 3, 1, 8, F[1]); R(0, py, 4, 3, pc); R(1, py - 1, 2, 1, pc); R(0, py, 2, 1, P.socks ? WHITE : F[4]);
  R(0, py + 2, 4, 1, P.socks ? P.cream[0] : F[1]); R(4, py, 1, 3, F[1]);
  if (f % 2 === 0) R(5, py + 1, 2, 1, RAMPS.coral[3]);
}

// ---------------------------------------------------------------- SIT FROM BEHIND (window watching), content 20x22
function paintBack(R, P, f) {
  const F = P.fur, tip = [[18, 13], [19, 12], [19, 14]][f % 3];
  R(13, 19, 4, 2, F[2]); R(16, 16, 2, 4, F[2]); R(tip[0] - 1, tip[1], 2, 17 - tip[1], F[2]);
  R.e(9, 15, 6, 6, F[2]); R.e(9, 14, 5, 5, F[3]); R(4, 18, 11, 3, F[2]); R(7, 12, 4, 8, F[3]);
  if (P.stripes) for (let y = 12; y < 20; y += 3) R(6, y, 6, 1, F[1]);
  ear(R, P, [3, 0], [2, 5], [7, 3], false); ear(R, P, [14, 0], [11, 3], [16, 5], false, P.bentEar);
  R.e(9, 7, 7, 5, F[3]); R(3, 8, 13, 3, F[3]); R(14, 5, 2, 6, F[2]); R(4, 4, 4, 1, F[4]);
  if (P.stripes) { R(8, 3, 1, 3, F[1]); R(10, 3, 1, 3, F[1]); R(9, 6, 1, 2, F[1]); }
  R(1, 9, 1, 1, P.cream[1]); R(17, 9, 1, 1, P.cream[1]);       // whisker tips
}

// ---------------------------------------------------------------- WALK (side view), content 28x18, 6 frames
// legs: [x, lift] for far-front, far-back, near-front, near-back
const WALK = [
  [[19, 0], [7, 1], [16, 1], [10, 0]], [[20, 0], [6, 0], [17, 2], [9, 0]], [[19, 1], [7, 0], [18, 0], [8, 1]],
  [[17, 1], [9, 0], [19, 0], [7, 1]], [[16, 2], [10, 0], [20, 0], [6, 0]], [[18, 0], [8, 1], [19, 1], [7, 0]],
];
export function paintWalk(R, P, f, o = {}) {
  const F = P.fur, L = WALK[f % 6], bob = o.run ? 0 : (f % 3 === 1 ? 1 : 0);
  const B = R.at(0, bob);
  const leg = (x, lift, c, sock) => { B(x, 11 - lift, 3, 5, c); B(x, 16 - lift, 4, 1, sock || c); };
  const sock = P.socks ? P.cream[1] : null;
  leg(L[0][0], L[0][1], F[1], sock && P.cream[0]); leg(L[1][0], L[1][1], F[1], sock && P.cream[0]);
  // tail rises from the rump in a soft S and curls at the tip, swaying
  const tw = [0, 1, 1, 0, -1, -1][f % 6];
  B(5, 6, 2, 3, F[2]); B(4 + Math.min(0, tw), 3, 2, 3, F[2]); B(3 + tw, 1, 2, 2, F[3]); B(4 + tw, 0, 2, 1, F[3]);
  if (P.stripes) { B(4 + Math.min(0, tw), 4, 2, 1, F[1]); B(3 + tw, 1, 1, 1, F[1]); }
  // body
  B.e(14, 9, 8, 4, F[2]); B.e(13, 8, 7, 3, F[3]); B(8, 6, 4, 1, F[4]);
  B.e(15, 12, 5, 1, P.cream[0]);
  if (P.bib) B(18, 8, 4, 5, P.cream[1]);
  if (P.stripes) { B(10, 5, 1, 3, F[1]); B(13, 5, 1, 3, F[1]); B(16, 5, 1, 3, F[1]); }
  patches(B, P, [[10, 6, 4, 3], [15, 7, 3, 2]]);
  leg(L[2][0], L[2][1], F[3], sock); leg(L[3][0], L[3][1], F[3], sock);
  // head
  const H = B.at(o.headDown ? 1 : 0, o.headDown ? 3 : 0);
  ear(H, P, [19, 0], [18, 4], [22, 2], false); ear(H, P, [24, 0], [22, 2], [26, 4], true, P.bentEar);
  H.e(22, 6, 5, 4, F[3]); H(18, 7, 9, 2, F[3]); H(19, 4, 3, 1, F[4]); H(25, 8, 2, 1, F[2]);
  H(25, 8, 2, 2, P.cream[1]); H(27, 7, 1, 1, P.nose);
  if (P.stripes) { H(20, 3, 1, 2, F[1]); H(22, 2, 1, 2, F[1]); }
  if (o.blink || o.headDown) H(23, 6, 2, 1, INK); else { H(23, 5, 2, 2, INK); H(24, 6, 1, 1, P.eye[1]); H(23, 5, 1, 1, WHITE); }
  if (o.mouth) H(26, 10, 2, 1, '#7a2a35');
  if (o.harness) { const c = RAMPS.ribbon; B(17, 4, 2, 9, c[2]); B(10, 5, 2, 9, c[2]); B(11, 4, 7, 1, c[1]); B(17, 9, 1, 1, RAMPS.butter[2]); }
}

// ---------------------------------------------------------------- SLEEP (curled donut), content 26x12, 3 breathing frames
function paintSleep(R, P, f, o = {}) {
  const F = P.fur, br = [0, 1, 0][f % 3];
  // a round curl: back arching over on the right, head tucked at the left, tail wrapped along the front
  R.e(15, 7 - br, 10, 4 + br, F[2]); R.e(14, 6 - br, 9, 3 + br, F[3]); R(11, 3 - br, 6, 1, F[4]);
  if (P.stripes) { R(15, 3 - br, 1, 3, F[1]); R(19, 4 - br, 1, 3, F[1]); R(22, 5 - br, 1, 3, F[1]); }
  patches(R, P, [[14, 4 - br, 4, 3], [19, 5 - br, 3, 3]]);
  R(5, 10, 18, 2, F[2]); R(6, 10, 16, 1, F[3]);                       // tail along the front
  if (P.stripes) { R(10, 10, 1, 2, F[1]); R(14, 10, 1, 2, F[1]); R(18, 10, 1, 2, F[1]); }
  R(4, 10, 2, 2, P.stripes ? F[1] : F[3]);
  // head resting on the tail, nose tucked, ears poking above the curl
  const H = R.at(0, 1);
  ear(H, P, [2, 0], [1, 4], [5, 3]); ear(H, P, [8, 0], [6, 3], [10, 4], true, P.bentEar);
  H.e(6, 6, 5, 3, F[3]); H(2, 4, 3, 1, F[4]); H(11, 5, 1, 4, F[1]); H(10, 7, 1, 2, F[2]);
  if (P.stripes) { H(5, 3, 1, 2, F[1]); H(7, 3, 1, 2, F[1]); }
  if (o.open) { H(3, 5, 2, 2, INK); H(4, 6, 1, 1, P.eye[1]); H(7, 5, 2, 2, INK); H(8, 6, 1, 1, P.eye[1]); }
  else { closedEye(H, 2, 5); closedEye(H, 7, 5); }
  H(5, 8, 2, 1, P.cream[1]); H(5, 7, 1, 1, P.nose);
  R(0, 9, 4, 3, P.socks ? P.cream[1] : F[3]); R(0, 11, 4, 1, F[2]);  // a paw peeking out
}

// ---------------------------------------------------------------- LOAF (paws tucked), content 22x16, 2 frames (slow blink)
function paintLoaf(R, P, f, o = {}) {
  const F = P.fur;
  R(14, 13, 7, 2, F[2]); R(19, 11, 2, 3, F[2]);                    // tail around the side
  R.e(11, 10, 9, 5, F[2]); R.e(10, 9, 8, 4, F[3]); R(3, 13, 16, 2, F[2]); R(4, 7, 4, 1, F[4]);
  if (P.stripes) { R(13, 6, 1, 3, F[1]); R(16, 8, 1, 3, F[1]); }
  patches(R, P, [[12, 6, 4, 3]]);
  R(5, 13, 6, 2, P.socks ? P.cream[1] : P.cream[0]);
  const H = R.at(0, o.flat ? 2 : 0);
  if (o.flat) { H.t([0, 4], [4, 3], [1, 6], F[3]); H.t([9, 3], [13, 4], [12, 6], F[3]); }
  else { ear(H, P, [2, 0], [1, 4], [5, 2]); ear(H, P, [11, 0], [8, 2], [12, 4], true, P.bentEar); }
  H.e(7, 6, 6, 4, F[3]); H(2, 7, 11, 2, F[3]); H(11, 5, 2, 4, F[2]); H(3, 3, 3, 1, F[4]);
  if (P.stripes) { H(6, 2, 1, 2, F[1]); H(8, 2, 1, 2, F[1]); }
  H.e(7, 8, 2, 1, P.cream[1]); H(7, 7, 1, 1, P.nose);
  if (o.wide) { eye(H, 3, 4, P, 3); eye(H, 9, 4, P, 3); }
  else if (f === 1) { lidEye(H, 2, 5); lidEye(H, 9, 5); }
  else { eye(H, 3, 5, P, 2); eye(H, 9, 5, P, 2); }
}

// ---------------------------------------------------------------- STRETCH (play bow), content 28x18, 3 frames
function paintStretch(R, P, f) {
  const F = P.fur, up = [0, 2, 3][f];
  // back legs standing, front paws stretched forward
  R(5, 9, 3, 8, F[1]); R(8, 9, 3, 8, F[3]); R(8, 16, 3, 1, F[2]);
  R(1, 2 - up, 2, 6, F[2]); R(0, 1 - up, 3, 2, F[3]);             // tail up
  R.t([3, 4 - up], [13, 9], [3, 12], F[3]); R.e(8, 8 - Math.floor(up / 2), 6, 4, F[3]);
  R.e(14, 11, 6, 3, F[3]); R(5, 5 - up, 4, 1, F[4]);
  R(9, 12, 10, 2, P.cream[0]);
  if (P.stripes) { R(7, 5 - up, 1, 3, F[1]); R(10, 7, 1, 3, F[1]); R(13, 9, 1, 2, F[1]); }
  patches(R, P, [[8, 6, 4, 3]]);
  R(15 + up, 15, 8, 2, F[3]); R(13 + up, 16, 9, 1, F[2]); R(22 + up, 15, 1, 2, P.socks ? P.cream[1] : F[3]);
  // head low, near the floor
  const H = R.at(1, 4);
  ear(H, P, [17, 0], [16, 4], [20, 2], false); ear(H, P, [22, 0], [20, 2], [24, 4], true, P.bentEar);
  H.e(20, 6, 5, 4, F[3]); H(17, 4, 3, 1, F[4]); H(22, 8, 3, 2, P.cream[1]); H(25, 7, 1, 1, P.nose);
  if (f === 2) { H(21, 5, 2, 1, INK); H(23, 9, 2, 2, '#7a2a35'); } else { H(21, 5, 2, 2, INK); H(22, 6, 1, 1, P.eye[1]); }
}

// ---------------------------------------------------------------- POUNCE: crouch-wiggle, leap, land; content 28x18, 4 frames
function paintPounce(R, P, f) {
  const F = P.fur;
  if (f < 2) {            // crouched low, butt wiggles
    const w = f;
    R(1, 10 - w, 6, 2, F[2]); R(0, 9 - w, 2, 2, F[3]);
    R.e(12, 12, 9, 3, F[2]); R.e(12, 11, 8, 2, F[3]); R(6, 9 + w, 5, 2, F[3]); R(5, 10, 3, 1, F[4]);
    if (P.stripes) { R(10, 9, 1, 2, F[1]); R(14, 9, 1, 2, F[1]); }
    patches(R, P, [[10, 9, 4, 2]]);
    R(17, 15, 6, 2, P.socks ? P.cream[1] : F[3]); R(5, 15, 6, 2, F[2]);
    const H = R.at(0, 5);
    ear(H, P, [19, 0], [18, 4], [22, 2], false); ear(H, P, [24, 0], [22, 2], [26, 4], true, P.bentEar);
    H.e(22, 6, 5, 4, F[3]); H(25, 8, 2, 2, P.cream[1]); H(27, 7, 1, 1, P.nose);
    H(22, 4, 3, 3, INK); H(23, 5, 2, 2, P.eye[1]); H(22, 4, 1, 1, WHITE);
  } else {                // airborne stretch / landing squash
    const air = f === 2, y = air ? 0 : 4;
    const B = R.at(0, y);
    B(0, 3, 5, 2, F[2]); B(0, 2, 2, 2, F[3]);
    B.e(13, 7, 9, air ? 3 : 4, F[2]); B.e(13, 6, 8, air ? 2 : 3, F[3]); B(7, 5, 3, 1, F[4]);
    if (P.stripes) { B(11, 4, 1, 3, F[1]); B(15, 4, 1, 3, F[1]); }
    patches(B, P, [[11, 4, 4, 3]]);
    if (air) { B(20, 9, 6, 2, F[3]); B(3, 9, 6, 2, F[2]); } else { B(18, 10, 3, 4, F[3]); B(8, 10, 3, 4, F[2]); }
    const H = B.at(0, -2);
    ear(H, P, [19, 0], [18, 4], [22, 2], false); ear(H, P, [24, 0], [22, 2], [26, 4], true, P.bentEar);
    H.e(22, 6, 5, 4, F[3]); H(25, 8, 2, 2, P.cream[1]); H(27, 7, 1, 1, P.nose);
    H(22, 5, 2, 2, INK); H(23, 6, 1, 1, P.eye[1]); if (air) H(25, 10, 2, 1, '#7a2a35');
  }
}

// ---------------------------------------------------------------- EAT (head down at the bowl), content 28x18, 2 frames
function paintEat(R, P, f) { paintWalk(R, P, 0, { headDown: true, blink: true }); if (f) R(26, 15, 1, 1, RAMPS.coral[3]); }

// ---------------------------------------------------------------- BELLY (rolled on her back, paws up), content 26x14
function paintBelly(R, P, f) {
  const F = P.fur, pc = P.socks ? P.cream[1] : F[3];
  R(21, 9, 4, 2, F[2]); R(23, 6 + f, 2, 4, F[2]); R(23, 6 + f, 2, 1, P.stripes ? F[1] : F[3]);   // tail flick
  R.e(14, 9, 9, 4, F[2]); R.e(14, 8, 8, 3, F[3]); R.e(14, 8, 6, 2, P.cream[1]); R(10, 7, 3, 1, WHITE);
  // paws up, bent at the wrist
  const paw = (x, y, h) => { R(x, y, 3, h, F[3]); R(x, y, 3, 2, pc); R(x + 2, y + 2, 1, h - 2, F[2]); };
  paw(8, 3 + f, 4); paw(12, 2 + f, 5); paw(16, 3, 4); paw(19, 4 - f, 3);
  // head upside down at the left, ears to the floor
  const H = R.at(0, 3);
  H.t([1, 7], [1, 10], [4, 9], F[3]); H.t([6, 9], [9, 10], [9, 7], F[3]);
  H.e(5, 5, 5, 4, F[3]); H(1, 6, 3, 1, F[2]); H(4, 2, 3, 2, P.cream[1]); H(5, 3, 1, 1, P.nose);
  closedEye(H, 1, 4); closedEye(H, 6, 4);
}

// ---------------------------------------------------------------- ARCH (puffed up, hiss), content 26x20
function paintArch(R, P, f) {
  const F = P.fur;
  R(1, 1 + f, 3, 10, F[2]); R(0, 0 + f, 3, 3, F[3]);                // bottle-brush tail
  for (let i = 0; i < 4; i++) R(0, 2 + i * 2 + f, 1, 1, F[3]);
  R(5, 10, 3, 9, F[1]); R(17, 10, 3, 9, F[1]); R(8, 10, 3, 9, F[3]); R(19, 10, 3, 9, F[3]);
  R.e(13, 7, 10, 6, F[2]); R.e(12, 6, 9, 5, F[3]); R(5, 3, 6, 1, F[4]);
  for (let i = 0; i < 6; i++) R(5 + i * 3, 1 + (i % 2), 1, 2, F[3]);        // spiky fur
  if (P.stripes) { R(9, 2, 1, 4, F[1]); R(13, 1, 1, 4, F[1]); R(17, 2, 1, 4, F[1]); }
  const H = R.at(0, 3);
  H.t([18, 3], [17, 6], [21, 5], F[3]); H.t([25, 3], [22, 5], [25, 7], F[3]);
  H.e(22, 8, 4, 4, F[3]); H(21, 6, 2, 2, INK); H(22, 7, 1, 1, P.eye[1]); H(24, 10, 2, 2, P.cream[1]);
  H(23, 11, 3, 2, '#7a2a35'); H(23, 11, 1, 1, WHITE); H(25, 11, 1, 1, WHITE);
}

// ---------------------------------------------------------------- registration
const opts = { hd: true, outline: 'ink' };
export function defineCat(prefix, P) {
  for (let t = 0; t < 4; t++) cdef(`${prefix}_sit_${t}`, 20, 22, (R) => paintSit(R, P, { tail: t }), opts);
  cdef(`${prefix}_sit_b`, 20, 22, (R) => paintSit(R, P, { tail: 0, mode: 'blink' }), opts);
  cdef(`${prefix}_sit_happy`, 20, 22, (R) => paintSit(R, P, { tail: 1, mode: 'happy' }), opts);
  cdef(`${prefix}_sit_meow`, 20, 22, (R) => paintSit(R, P, { tail: 2, mode: 'happy', mouth: true }), opts);
  cdef(`${prefix}_sit_wide`, 20, 22, (R) => paintSit(R, P, { tail: 0, mode: 'wide' }), opts);
  cdef(`${prefix}_sit_sleepy`, 20, 22, (R) => paintSit(R, P, { tail: 0, mode: 'sleepy' }), opts);
  for (let f = 0; f < 6; f++) cdef(`${prefix}_walk_${f}`, 28, 18, (R) => paintWalk(R, P, f), opts);
  for (let f = 0; f < 3; f++) cdef(`${prefix}_sleep_${f}`, 26, 12, (R) => paintSleep(R, P, f), opts);
  cdef(`${prefix}_sleep_open`, 26, 12, (R) => paintSleep(R, P, 0, { open: true }), opts);
  for (let f = 0; f < 2; f++) cdef(`${prefix}_loaf_${f}`, 22, 16, (R) => paintLoaf(R, P, f), opts);
  cdef(`${prefix}_loaf_scared`, 22, 16, (R) => paintLoaf(R, P, 0, { flat: true, wide: true }), opts);
  for (let f = 0; f < 4; f++) cdef(`${prefix}_groom_${f}`, 20, 22, (R) => paintGroom(R, P, f), opts);
  for (let f = 0; f < 3; f++) cdef(`${prefix}_back_${f}`, 20, 22, (R) => paintBack(R, P, f), opts);
  for (let f = 0; f < 3; f++) cdef(`${prefix}_stretch_${f}`, 28, 18, (R) => paintStretch(R, P, f), opts);
  for (let f = 0; f < 4; f++) cdef(`${prefix}_pounce_${f}`, 28, 18, (R) => paintPounce(R, P, f), opts);
  for (let f = 0; f < 2; f++) cdef(`${prefix}_eat_${f}`, 28, 18, (R) => paintEat(R, P, f), opts);
  for (let f = 0; f < 2; f++) cdef(`${prefix}_belly_${f}`, 26, 14, (R) => paintBelly(R, P, f), opts);
  for (let f = 0; f < 2; f++) cdef(`${prefix}_arch_${f}`, 26, 20, (R) => paintArch(R, P, f), opts);
}

// Mochi: full set plus harness variants for walks outside.
defineCat('mc', CAT_PALETTES.mochi);
for (let t = 0; t < 4; t++) cdef(`mc_hsit_${t}`, 20, 22, (R) => paintSit(R, CAT_PALETTES.mochi, { tail: t, harness: true }), opts);
for (let f = 0; f < 6; f++) cdef(`mc_hwalk_${f}`, 28, 18, (R) => paintWalk(R, CAT_PALETTES.mochi, f, { harness: true }), opts);
// Strays use a lighter set (sit, loaf, sleep, walk, groom).
export const STRAYS = ['hanako', 'sumi', 'yuki', 'nezumi', 'tux'];
for (const id of STRAYS) {
  const P = CAT_PALETTES[id];
  for (let t = 0; t < 4; t++) cdef(`stray_${id}_sit_${t}`, 20, 22, (R) => paintSit(R, P, { tail: t }), opts);
  cdef(`stray_${id}_sit_b`, 20, 22, (R) => paintSit(R, P, { tail: 0, mode: 'blink' }), opts);
  cdef(`stray_${id}_sit_happy`, 20, 22, (R) => paintSit(R, P, { tail: 1, mode: 'happy' }), opts);
  for (let f = 0; f < 2; f++) cdef(`stray_${id}_loaf_${f}`, 22, 16, (R) => paintLoaf(R, P, f), opts);
  for (let f = 0; f < 3; f++) cdef(`stray_${id}_sleep_${f}`, 26, 12, (R) => paintSleep(R, P, f), opts);
  for (let f = 0; f < 4; f++) cdef(`stray_${id}_groom_${f}`, 20, 22, (R) => paintGroom(R, P, f), opts);
  for (let f = 0; f < 6; f++) cdef(`stray_${id}_walk_${f}`, 28, 18, (R) => paintWalk(R, P, f), opts);
}

// Cardboard box (empty, and with Mochi peeking out), content 24x22
const BOX = ['#6a4a2e', '#9a7048', '#c09464', '#dcb47e', '#f0d0a0'];
function paintBox(R, withCat) {
  if (withCat) { const P = CAT_PALETTES.mochi; ear(R.at(2, 0), P, [2, 0], [1, 5], [6, 3]); ear(R.at(2, 0), P, [13, 0], [10, 3], [15, 5]); R.at(2, 0).e(8, 7, 7, 5, P.fur[3]); const H = R.at(2, 0); H(13, 5, 2, 5, P.fur[2]); H(3, 4, 4, 1, P.fur[4]); H(7, 2, 1, 2, P.fur[1]); H(9, 2, 1, 2, P.fur[1]); eye(H, 4, 6, P); eye(H, 11, 6, P); H(8, 9, 1, 1, P.nose); }
  R.t([0, 8], [4, 10], [3, 5], BOX[3]); R.t([23, 8], [19, 10], [21, 4], BOX[2]);   // flaps
  R(2, 10, 20, 12, BOX[2]); R(2, 10, 20, 2, BOX[4]); R(2, 12, 3, 10, BOX[3]); R(18, 12, 4, 10, BOX[1]); R(2, 21, 20, 1, BOX[0]);
  R(10, 15, 5, 2, BOX[1]); R(11, 14, 3, 1, BOX[3]);                                   // a little arrow print
  if (!withCat) R(4, 10, 16, 2, BOX[0]);
}
cdef('mochi_box', 24, 22, (R) => paintBox(R, false), { hd: true, outline: 'selective' });
cdef('mochi_box_cat', 24, 22, (R) => paintBox(R, true), { hd: true, outline: 'selective' });
cdef('mochi_mouse_toy', 10, 6, (R) => { R.e(5, 3, 4, 2, '#8a9aab'); R(1, 1, 2, 2, '#b9c6d2'); R(7, 2, 1, 1, '#2a1a22'); R(9, 3, 1, 1, '#f7a1b1'); R(0, 4, 1, 2, '#5a6678'); }, { hd: true, outline: 'selective' });
