// Street furniture and set dressing: fences and walls, lamps, benches, signs and name plates, mailbox, post box,
// vending machine, bus stop, utility poles, bike rack, fountain, noticeboard, festival stage, market stalls,
// ramen cart, clothesline, workbench, park and school props, bunting and shotengai lanterns.
import { spr, hash, line, signText, signW } from './lib.js';

const SH = '#2a1a404d';
// Light offsets (world px from the footprint top-left) for props that glow.
export const LIGHT = {
  lamp: { kind: 'lamp', x: 8, y: -9 }, street: { kind: 'lamp', x: 13, y: -22 }, vending: { kind: 'vending', x: 8, y: 2 },
  lantern: { kind: 'lantern', x: 8, y: -4 }, cart: { kind: 'lantern', x: 6, y: -14 }, stone: { kind: 'lantern', x: 8, y: -5 },
};

// ---------- fences and walls (tile seamlessly: no outline, hand-shaded edges) ----------
spr('town_fence_wood', 32, 24, (R, M, se) => {
  const W = M.wood;
  R(0, 6, 32, 3, W[3]); R(0, 8, 32, 1, W[1]); R(0, 14, 32, 3, W[3]); R(0, 16, 32, 1, W[1]); R(0, 6, 32, 1, W[4]);
  for (const x of [2, 18]) { R(x, 2, 5, 21, W[3]); R(x, 2, 1, 21, W[4]); R(x + 4, 2, 1, 21, W[1]); R(x, 1, 5, 2, W[4]); R(x, 22, 5, 1, '#2a1a22'); if (se === 'winter') R(x - 1, 0, 7, 2, M.snow[4]); }
  if (se === 'winter') R(0, 5, 32, 1, M.snow[4]);
}, { seasonal: true, outline: false });
spr('town_fence_picket', 32, 24, (R, M, se) => {
  const P = M.paper;
  R(0, 9, 32, 2, P[2]); R(0, 16, 32, 2, P[2]); R(0, 18, 32, 1, P[0]);
  for (let x = 1; x < 32; x += 6) { R(x, 4, 4, 18, P[3]); R(x + 1, 2, 2, 2, P[3]); R(x, 4, 1, 18, P[4]); R(x + 3, 4, 1, 18, P[1]); R(x, 22, 4, 1, '#2a1a22'); if (se === 'winter') R(x, 2, 4, 2, M.snow[4]); }
}, { seasonal: true, outline: false });
spr('town_wall_stone', 32, 28, (R, M, se) => {
  const S = M.stone;
  R(0, 4, 32, 23, S[3]); R(0, 2, 32, 4, S[4]); R(0, 2, 32, 1, S[5]); R(0, 6, 32, 1, S[1]);
  for (let r = 0; r < 4; r++) { const y = 7 + r * 5; R(0, y + 4, 32, 1, S[2]); for (let x = (r % 2) * 8; x < 32; x += 16) R(x, y, 1, 5, S[2]); if (hash(r, 1, 3) > 0.4) R(4 + r * 6, y + 1, 5, 2, S[4]); }
  R(0, 27, 32, 1, '#2a1a22'); if (se === 'winter') R(0, 0, 32, 4, M.snow[4]);
  if (se !== 'winter') { R(26, 8, 2, 6, M.leaf[2]); R(25, 10, 4, 2, M.leaf[3]); }
}, { seasonal: true, outline: false });
spr('town_fence_v', 32, 40, (R, M, se) => { // a fence running north-south, seen end-on
  const W = M.wood;
  R(14, 0, 4, 38, W[2]); R(14, 0, 1, 38, W[3]); R(13, 10, 6, 28, W[3]); R(13, 10, 1, 28, W[4]); R(18, 10, 1, 28, W[1]); R(13, 9, 6, 2, W[4]); R(13, 38, 6, 1, '#2a1a22');
  if (se === 'winter') R(12, 8, 8, 2, M.snow[4]);
}, { seasonal: true, outline: false });
spr('town_gatepost', 14, 40, (R, M, se) => {
  const S = M.stone; R(1, 6, 12, 33, S[3]); R(1, 6, 3, 33, S[4]); R(10, 6, 3, 33, S[2]); R(0, 2, 14, 5, S[4]); R(0, 2, 14, 1, S[5]);
  R(3, 14, 8, 6, M.paper[3]); R(4, 16, 6, 1, M.ink[2]); if (se === 'winter') R(0, 0, 14, 3, M.snow[4]);
}, { seasonal: true });

// ---------- lights ----------
spr('town_lamp', 32, 58, (R, M) => {
  const C = M.charcoal;
  R(15, 12, 3, 42, C[2]); R(15, 12, 1, 42, C[3]); R(12, 52, 9, 4, C[1]); R(13, 51, 7, 1, C[2]);
  R(11, 3, 11, 10, C[1]); R(12, 4, 9, 8, M.paper[2]); R(12, 4, 9, 2, M.paper[4]); R(16, 4, 1, 8, C[1]); R(10, 1, 13, 3, C[2]); R(14, 0, 5, 1, C[3]); R(11, 13, 11, 1, C[2]);
}, {});
spr('town_streetlight', 32, 84, (R, M) => {
  const S = M.metal;
  R(5, 10, 4, 72, S[1]); R(5, 10, 1, 72, S[2]); R(3, 78, 8, 5, S[0]);
  line(R, 7, 10, 12, 4, S[1], 2); R(12, 3, 12, 2, S[1]); R(20, 4, 12, 4, S[2]); R(21, 8, 10, 3, M.paper[3]); R(20, 3, 12, 1, S[3]);
}, {});
spr('town_stone_lantern', 24, 44, (R, M, se) => { // toro along the shrine approach
  const S = M.stone;
  R(5, 36, 14, 7, S[3]); R(5, 36, 14, 1, S[4]); R(9, 22, 6, 14, S[3]); R(9, 22, 2, 14, S[4]);
  R(4, 13, 16, 10, S[3]); R(7, 15, 10, 6, M.charcoal[1]); R(8, 16, 8, 4, M.butter[1]);
  R.t([1, 13], [22, 13], [12, 3], S[2]); R.t([3, 12], [12, 12], [12, 5], S[4]); R(11, 0, 3, 4, S[3]);
  if (se === 'winter') R.t([4, 10], [19, 10], [12, 2], M.snow[4]);
}, { seasonal: true });

// ---------- benches, tables ----------
spr('town_bench', 48, 28, (R, M, se) => {
  const W = M.wood, C = M.charcoal;
  for (const y of [2, 7]) { R(3, y, 42, 4, W[3]); R(3, y, 42, 1, W[4]); R(3, y + 3, 42, 1, W[1]); }
  R(2, 14, 44, 5, W[3]); R(2, 14, 44, 1, W[4]); R(2, 18, 44, 1, W[1]); R(2, 19, 44, 2, SH);
  for (const x of [4, 40]) { R(x, 1, 3, 25, C[2]); R(x, 1, 1, 25, C[3]); R(x - 1, 12, 5, 2, C[2]); }
  if (se === 'winter') { R(2, 13, 44, 2, M.snow[4]); R(3, 1, 42, 1, M.snow[4]); }
}, { seasonal: true });
spr('town_chess', 48, 34, (R, M) => {
  const S = M.stone;
  R(10, 4, 28, 14, S[4]); R(10, 4, 28, 1, S[5]); R(10, 17, 28, 3, S[2]);
  for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) if ((i + j) % 2) R(12 + i * 4, 6 + j * 3, 4, 3, S[1]);
  R(14, 6, 2, 3, M.paper[4]); R(30, 12, 2, 3, M.charcoal[1]); R(20, 20, 8, 12, S[3]); R(20, 20, 2, 12, S[4]);
  for (const x of [1, 39]) { R(x, 20, 8, 5, S[3]); R(x, 20, 8, 1, S[4]); R(x + 2, 25, 4, 7, S[2]); }
}, {});
spr('town_terrace', 48, 60, (R, M) => { // cafe table with a parasol
  const W = M.wood, A = M.mint, P = M.paper;
  R(23, 8, 2, 40, M.charcoal[2]); R.t([2, 16], [46, 16], [24, 0], A[2]);
  for (let i = 0; i < 4; i++) R.t([4 + i * 11, 16], [10 + i * 11, 16], [24, 1], i % 2 ? P[3] : A[2]);
  R(2, 16, 44, 2, A[1]); R(24, 0, 1, 2, A[4]);
  R(10, 40, 28, 6, W[3]); R(10, 40, 28, 1, W[4]); R(10, 45, 28, 1, W[1]); R(14, 46, 2, 12, W[1]); R(32, 46, 2, 12, W[1]);
  R(18, 38, 4, 3, P[4]); R(26, 37, 5, 4, M.coral[2]);
  for (const x of [1, 40]) { R(x, 44, 7, 3, W[2]); R(x + 1, 47, 1, 10, W[1]); R(x + 5, 47, 1, 10, W[1]); R(x, 36, 2, 9, W[2]); }
}, {});
spr('town_chalkboard', 22, 32, (R, M) => {
  const C = M.chalkboard, W = M.wood;
  line(R, 3, 30, 7, 2, W[1], 2); line(R, 18, 30, 14, 2, W[1], 2); R(4, 3, 14, 20, W[2]); R(5, 4, 12, 18, C[2]);
  for (let i = 0; i < 4; i++) R(7, 7 + i * 4, 4 + ((i * 3) % 6), 1, C[4]); R(13, 15, 2, 2, M.coral[3]);
}, {});

// ---------- signs ----------
spr('town_signpost', 32, 46, (R, M, se) => {
  const W = M.wood;
  R(14, 6, 4, 38, W[2]); R(14, 6, 1, 38, W[3]); R(12, 42, 8, 3, W[1]);
  R(4, 6, 22, 9, W[3]); R.t([26, 6], [26, 14], [30, 10], W[3]); R(4, 6, 22, 1, W[4]); R(6, 9, 14, 1, W[1]); R(6, 11, 10, 1, W[1]);
  R(6, 18, 22, 9, W[3]); R.t([6, 18], [6, 26], [2, 22], W[3]); R(6, 18, 22, 1, W[4]); R(10, 21, 14, 1, W[1]); R(12, 23, 10, 1, W[1]);
  R(14, 1, 4, 5, W[2]); if (se === 'winter') R(4, 4, 22, 2, M.snow[4]);
}, { seasonal: true });
// Blue street name plate on a short pole, with the text painted on.
export function plate(name, text) {
  const tw = signW(text), w = Math.max(28, tw + 10);
  return spr(name, w, 42, (R, M) => {
    const S = M.sky, cx = Math.floor(w / 2);
    R(cx - 1, 12, 3, 29, M.metal[1]); R(cx - 1, 12, 1, 29, M.metal[2]);
    R(0, 1, w, 12, S[0]); R(1, 2, w - 2, 10, S[1]); R(1, 2, w - 2, 1, S[2]);
    signText(R, text, Math.floor((w - tw) / 2), 5, M.paper[4]);
  }, {});
}
spr('town_noticeboard', 56, 50, (R, M, se) => {
  const W = M.wood;
  for (const x of [4, 48]) { R(x, 6, 4, 43, W[2]); R(x, 6, 1, 43, W[3]); }
  R(2, 10, 52, 30, W[1]); R(4, 12, 48, 26, '#c8955a'); for (let i = 0; i < 30; i++) R(4 + Math.floor(hash(i, 1, 1) * 47), 12 + Math.floor(hash(i, 1, 2) * 25), 1, 1, '#a87440');
  const papers = [[7, 14, 12, 14, M.paper[4]], [22, 15, 10, 9, M.butter[3]], [35, 13, 13, 11, M.paper[3]], [24, 27, 12, 9, M.sky[3]], [8, 30, 11, 6, M.coral[4]], [40, 26, 9, 10, M.mint[3]]];
  for (const [x, y, w, h, c] of papers) { R(x, y, w, h, c); R(x + Math.floor(w / 2), y, 1, 1, M.coral[1]); for (let k = 2; k < h - 1; k += 2) R(x + 1, y + k, w - 3, 1, '#00000022'); }
  R(0, 2, 56, 7, M.roofRed[2]); R(0, 2, 56, 2, M.roofRed[3]); R(0, 8, 56, 1, M.roofRed[0]); R(2, 9, 52, 2, SH);
  if (se === 'winter') R(0, 0, 56, 3, M.snow[4]);
}, { seasonal: true });

// ---------- post and drinks ----------
spr('town_mailbox', 18, 30, (R, M) => {
  const C = M.coral;
  R(7, 12, 4, 17, M.wood[2]); R(7, 12, 1, 17, M.wood[3]);
  R(1, 1, 16, 12, C[2]); R(1, 1, 16, 3, C[3]); R(14, 3, 3, 10, C[1]); R(4, 6, 8, 1, C[0]); R(1, 12, 16, 1, C[0]);
  R(16, 0, 1, 7, M.butter[2]); R(16, 0, 1, 1, M.butter[4]);
}, {});
spr('town_postbox', 22, 40, (R, M) => {
  const C = M.ribbon;
  R(2, 8, 18, 30, C[2]); R.e(11, 8, 9, 6, C[2]); R.e(9, 6, 6, 3, C[3]); R(3, 8, 3, 30, C[3]); R(17, 8, 3, 30, C[1]);
  R(6, 14, 10, 2, C[0]); R(6, 22, 10, 7, M.paper[4]); R(8, 24, 6, 1, C[1]); R(8, 26, 4, 1, C[1]); R(2, 36, 18, 2, C[0]);
}, {});
spr('town_vending', 32, 60, (R, M) => {
  const B = M.sky, P = M.paper;
  R(1, 2, 30, 56, B[1]); R(1, 2, 30, 2, B[3]); R(1, 2, 2, 56, B[2]); R(28, 2, 3, 56, B[0]);
  R(4, 6, 24, 26, P[4]); R(4, 6, 24, 1, P[3]);
  for (let r = 0; r < 3; r++) for (let i = 0; i < 5; i++) { const c = [M.coral[2], M.butter[2], M.mint[2], M.sky[2], M.lilac[2]][(i + r * 2) % 5]; R(6 + i * 4, 8 + r * 8, 3, 6, c); R(6 + i * 4, 8 + r * 8, 1, 2, P[4]); R(6 + i * 4, 15 + r * 8, 3, 1, M.coral[1]); }
  R(4, 34, 16, 6, M.charcoal[1]); R(5, 35, 14, 4, '#9ed8ff'); R(22, 34, 6, 10, B[2]); R(23, 36, 4, 1, M.charcoal[1]); R(24, 40, 2, 2, M.butter[2]);
  R(4, 46, 24, 8, M.charcoal[1]); R(5, 47, 22, 5, M.charcoal[2]); R(1, 56, 30, 2, B[0]);
}, {});

// ---------- bus stop ----------
spr('town_busstop_sign', 20, 58, (R, M) => {
  R(9, 14, 3, 43, M.metal[2]); R(9, 14, 1, 43, M.metal[3]); R(6, 55, 9, 2, M.metal[0]);
  R.e(10, 8, 9, 7, M.ribbon[1]); R.e(10, 8, 7, 5, M.paper[4]);
  R(5, 5, 11, 6, M.sky[1]); R(6, 6, 2, 2, M.sky[4]); R(10, 6, 2, 2, M.sky[4]); R(5, 11, 3, 2, M.charcoal[1]); R(13, 11, 3, 2, M.charcoal[1]);
  R(4, 22, 13, 16, M.paper[3]); R(4, 22, 13, 2, M.sky[1]); for (let i = 0; i < 5; i++) R(6, 26 + i * 2, 4 + (i * 3) % 6, 1, M.ink[2]);
}, {});
spr('town_bus_shelter', 96, 60, (R, M, se) => {
  const S = M.metal, G = M.sky;
  R(2, 4, 92, 6, S[3]); R(2, 4, 92, 2, S[4]); R(2, 9, 92, 1, S[0]); R(4, 10, 88, 3, SH);
  R(6, 10, 84, 34, G[3]); R(6, 10, 84, 34, '#bfe6f5'); for (let x = 6; x < 90; x += 28) R(x, 10, 2, 34, S[2]); R(14, 14, 8, 2, G[4]); R(40, 14, 4, 2, G[4]);
  R(8, 18, 22, 22, M.butter[3]); R(10, 20, 18, 3, M.coral[2]); for (let i = 0; i < 4; i++) R(10, 26 + i * 3, 14, 1, M.ink[3]);
  for (const x of [4, 88]) { R(x, 4, 4, 54, S[1]); R(x, 4, 1, 54, S[2]); }
  R(12, 44, 72, 4, M.wood[3]); R(12, 44, 72, 1, M.wood[4]); R(12, 48, 72, 2, M.wood[1]); R(16, 50, 2, 8, S[1]); R(78, 50, 2, 8, S[1]);
  if (se === 'winter') R(2, 2, 92, 3, M.snow[4]);
}, { seasonal: true });

// ---------- utility pole (wires are drawn between poles by the town layer) ----------
spr('town_pole', 32, 112, (R, M) => {
  const S = M.stone;
  R(13, 4, 7, 106, S[3]); R(13, 4, 2, 106, S[4]); R(18, 4, 2, 106, S[2]); R(12, 108, 9, 3, S[1]);
  R(2, 12, 28, 3, M.woodDark[2]); R(2, 12, 28, 1, M.woodDark[3]); for (const x of [4, 12, 20, 27]) { R(x, 9, 2, 3, M.paper[3]); R(x, 8, 2, 1, M.paper[4]); }
  R(20, 30, 8, 12, M.metal[2]); R(20, 30, 8, 2, M.metal[3]); R(26, 32, 2, 10, M.metal[1]);
  for (let y = 50; y < 100; y += 8) R(y % 16 ? 11 : 20, y, 2, 1, M.metal[1]);
  R(14, 64, 5, 10, M.butter[2]); R(14, 64, 5, 1, M.butter[3]);
}, {});
spr('town_mirror', 24, 66, (R, M) => {
  R(11, 18, 3, 47, M.leafAutumn[2]); R(11, 18, 1, 47, M.leafAutumn[3]); R(11, 40, 3, 3, M.paper[4]);
  R.e(12, 10, 10, 9, M.leafAutumn[2]); R.e(12, 10, 8, 7, M.metal[3]); R.e(10, 8, 4, 3, M.metal[4]); R(6, 11, 10, 2, M.grass[3]);
}, {});

// ---------- bikes ----------
function bike(R, M, x, c) {
  const C = M.charcoal, F = M[c];
  for (const wx of [x + 6, x + 22]) { R.e(wx, 18, 6, 6, C[1]); R.e(wx, 18, 4, 4, '#00000000'); R.e(wx, 18, 1, 1, C[2]); }
  R.e(x + 6, 18, 5, 5, C[1]); R.e(x + 22, 18, 5, 5, C[1]); R.e(x + 6, 18, 3, 3, M.metal[4]); R.e(x + 22, 18, 3, 3, M.metal[4]);
  line(R, x + 6, 18, x + 13, 10, F[2], 2); line(R, x + 13, 10, x + 22, 10, F[2], 2); line(R, x + 14, 18, x + 13, 10, F[2], 2); line(R, x + 22, 18, x + 21, 7, F[1], 2);
  R(x + 10, 7, 6, 2, C[2]); R(x + 19, 5, 6, 2, C[2]); R(x + 23, 4, 2, 2, M.butter[2]); R(x + 22, 9, 6, 4, M.metal[3]);
}
spr('town_bikerack', 64, 30, (R, M) => {
  const S = M.metal;
  R(0, 24, 64, 3, S[2]); R(0, 24, 64, 1, S[3]);
  for (let x = 4; x < 64; x += 12) { R(x, 12, 2, 13, S[2]); R(x + 6, 12, 2, 13, S[1]); R(x, 11, 8, 2, S[3]); }
  bike(R, M, 2, 'coral'); bike(R, M, 33, 'mint');
}, {});

// ---------- fountain (water spray is animated by the fountain interaction) ----------
spr('town_fountain', 96, 64, (R, M, se) => {
  const S = M.stone, Wt = M.water, frozen = se === 'winter';
  R.e(48, 44, 46, 18, S[2]); R.e(48, 42, 46, 18, S[4]); R.e(48, 42, 44, 16, S[3]);
  R.e(48, 43, 40, 13, frozen ? '#c0d8ec' : Wt[2]); R.e(48, 45, 38, 10, frozen ? '#d8e8f4' : Wt[3]);
  R(46, 46, 4, 2, frozen ? '#ffffff' : Wt[4]);
  R(42, 18, 12, 26, S[3]); R(42, 18, 3, 26, S[4]); R(51, 18, 3, 26, S[2]);
  R.e(48, 18, 16, 5, S[2]); R.e(48, 17, 16, 5, S[4]); R.e(48, 17, 13, 3, frozen ? '#d8e8f4' : Wt[3]);
  R(46, 4, 4, 13, S[3]); R(46, 4, 1, 13, S[5]); R.e(48, 4, 4, 3, S[4]);
  R.e(48, 60, 44, 3, S[1]); R(10, 50, 6, 2, S[5]);
  if (frozen) { R.e(48, 15, 14, 3, M.snow[4]); R(42, 40, 12, 2, M.snow[4]); }
}, { seasonal: true });

// ---------- festival stage and market ----------
spr('town_stage', 160, 76, (R, M, se) => {
  const W = M.wood, V = M.vermilion;
  for (const x of [6, 148]) { R(x, 4, 6, 48, V[2]); R(x, 4, 2, 48, V[3]); R(x + 4, 4, 2, 48, V[1]); }
  R(0, 2, 160, 8, V[2]); R(0, 2, 160, 2, V[3]); R(0, 9, 160, 1, V[0]);
  R(14, 10, 132, 12, M.paper[4]); for (let x = 14; x < 146; x += 22) R.t([x, 10], [x + 22, 10], [x + 11, 20], x % 44 ? M.coral[2] : M.butter[2]);
  R(12, 26, 136, 22, M.navy[2]); for (let x = 16; x < 146; x += 10) R(x, 26, 1, 22, M.navy[1]);
  R(0, 48, 160, 8, W[3]); R(0, 48, 160, 2, W[4]); R(0, 56, 160, 16, W[2]); for (let x = 0; x < 160; x += 16) R(x, 56, 1, 16, W[1]); R(0, 71, 160, 2, W[0]);
  for (let i = 0; i < 3; i++) { R(64 + i * 0, 56 + i * 5, 32, 5, W[3]); R(64, 56 + i * 5, 32, 1, W[4]); }
  if (se === 'winter') R(0, 0, 160, 3, M.snow[4]);
}, { seasonal: true });
function stall(R, M, a, b, goods) {
  const W = M.wood, A = M[a], B = M[b];
  for (const x of [3, 57]) { R(x, 10, 4, 46, W[2]); R(x, 10, 1, 46, W[3]); }
  R(0, 4, 64, 14, A[2]); for (let x = 0; x < 64; x += 10) R(x, 4, 5, 14, B[3]); R(0, 4, 64, 2, A[3]);
  for (let x = 0; x < 64; x += 4) R(x, 18, 2, 2, (Math.floor(x / 5) % 2 ? B : A)[1]); R(2, 20, 60, 3, SH);
  R(2, 34, 60, 6, W[3]); R(2, 34, 60, 1, W[4]); R(2, 40, 60, 14, W[2]); for (let x = 6; x < 60; x += 12) R(x, 40, 1, 14, W[1]); R(2, 53, 60, 2, W[0]);
  for (let i = 0; i < 4; i++) { const x = 6 + i * 14; R(x, 26, 12, 9, W[1]); R(x + 1, 27, 10, 3, W[3]); for (let k = 0; k < 5; k++) R(x + 1 + (k % 3) * 3 + (k > 2 ? 1 : 0), 24 + (k > 2 ? 2 : 0), 3, 3, goods[(i + k) % goods.length]); }
  R(40, 44, 14, 8, M.paper[4]); R(42, 46, 8, 1, M.ink[2]); R(42, 48, 6, 1, M.ink[2]);
}
spr('town_stall_veg', 64, 56, (R, M) => stall(R, M, 'forest', 'paper', [M.forest[3], M.leafAutumn[2], M.coral[2], M.forest[2]]), {});
spr('town_stall_fruit', 64, 56, (R, M) => stall(R, M, 'coral', 'paper', [M.ribbon[2], M.butter[2], M.leafAutumn[3], M.lilac[2]]), {});
spr('town_stall_flower', 64, 56, (R, M) => stall(R, M, 'lilac', 'paper', [M.sakura[2], M.butter[2], M.paper[4], M.sky[3]]), {});
spr('town_crates', 32, 30, (R, M) => {
  const W = M.wood;
  for (const [x, y] of [[2, 12], [16, 14], [8, 2]]) { R(x, y, 14, 14, W[3]); R(x, y, 14, 1, W[4]); R(x, y, 1, 14, W[4]); R(x + 13, y, 1, 14, W[1]); R(x, y + 6, 14, 1, W[1]); R(x + 2, y + 2, 10, 3, M.leafAutumn[2]); }
}, {});

// ---------- night ramen cart (yatai) ----------
spr('town_ramen_cart', 80, 70, (R, M) => {
  const W = M.wood, Wk = M.woodDark;
  R(4, 2, 72, 8, Wk[2]); R(4, 2, 72, 2, Wk[3]); R(2, 9, 76, 2, Wk[1]);
  for (const x of [8, 68]) { R(x, 10, 4, 30, Wk[2]); R(x, 10, 1, 30, Wk[3]); }
  for (let i = 0; i < 4; i++) { R(14 + i * 13, 11, 12, 16, M.navy[2]); R(14 + i * 13, 11, 1, 16, M.navy[3]); R(14 + i * 13, 26, 12, 1, M.navy[1]); }
  signText(R, 'RAMEN', 26, 16, M.paper[4]);
  R(4, 38, 72, 6, W[3]); R(4, 38, 72, 1, W[4]); R(4, 44, 72, 16, W[2]); for (let x = 8; x < 76; x += 8) R(x, 44, 1, 16, W[1]);
  R(54, 32, 14, 7, M.metal[2]); R(54, 32, 14, 2, M.metal[3]); R(20, 34, 6, 4, M.paper[4]); R(30, 34, 6, 4, M.paper[4]);
  R.e(64, 60, 8, 8, Wk[1]); R.e(64, 60, 5, 5, Wk[3]); R.e(64, 60, 1, 1, Wk[1]);
  R(70, 14, 6, 10, M.ribbon[2]); R(70, 14, 6, 1, M.ribbon[1]); R(70, 23, 6, 1, M.ribbon[1]); R(72, 12, 2, 2, M.charcoal[1]);
  for (const x of [14, 30]) { R(x, 56, 10, 3, Wk[2]); R(x + 1, 59, 2, 9, Wk[1]); R(x + 7, 59, 2, 9, Wk[1]); }
}, {});

// ---------- yard ----------
for (let f = 0; f < 2; f++) spr(`town_clothesline_${f}`, 128, 52, (R, M, se) => {
  const W = M.woodDark, sw = f ? 1 : -1;
  for (const x of [4, 120]) { R(x, 4, 4, 46, W[2]); R(x, 4, 1, 46, W[3]); R(x - 3, 6, 10, 2, W[3]); }
  line(R, 5, 8, 64, 12, M.paper[1]); line(R, 64, 12, 124, 8, M.paper[1]);
  const items = [[16, M.sky[3], 14, 16], [36, M.coral[3], 12, 20], [56, M.paper[4], 16, 12], [80, M.mint[3], 12, 18], [100, M.butter[3], 14, 14]];
  items.forEach(([x, c, w, h], i) => { const y = 10 + Math.round(Math.sin(x / 20) * 2), o = (i % 2 ? sw : -sw); R(x + o, y, w, h, c); R(x + o, y, w, 2, M.paper[4]); R(x + o + w - 2, y + 2, 2, h - 2, '#00000022'); R(x + 2, y - 1, 1, 2, M.wood[1]); R(x + w - 3, y - 1, 1, 2, M.wood[1]); });
  if (se === 'winter') { R(-0 + 1, 2, 8, 2, M.snow[4]); R(120, 2, 8, 2, M.snow[4]); }
}, { seasonal: true });
spr('town_workbench', 64, 40, (R, M) => {
  const W = M.wood;
  R(2, 0, 60, 16, M.woodDark[2]); for (let i = 0; i < 5; i++) { R(6 + i * 11, 3, 2, 9 - (i % 3), M.metal[2]); R(5 + i * 11, 3, 4, 2, M.metal[3]); }
  R(0, 16, 64, 6, W[3]); R(0, 16, 64, 1, W[4]); R(0, 21, 64, 1, W[1]); R(2, 22, 60, 2, SH);
  for (const x of [3, 57]) { R(x, 22, 4, 17, W[2]); R(x, 22, 1, 17, W[3]); } R(7, 30, 50, 3, W[2]);
  R(12, 12, 10, 4, M.paper[4]); R(30, 13, 8, 3, M.coral[2]); R(44, 11, 3, 5, M.metal[3]); R(46, 13, 8, 2, W[1]);
}, {});
spr('town_barrel', 22, 28, (R, M) => {
  const W = M.wood;
  R(2, 4, 18, 23, W[2]); R(2, 4, 4, 23, W[3]); R(16, 4, 4, 23, W[1]); for (const y of [7, 18]) R(1, y, 20, 2, M.metal[1]);
  R.e(11, 4, 9, 3, W[1]); R.e(11, 4, 7, 2, M.water[2]); R(8, 3, 3, 1, M.water[4]);
}, {});
spr('town_garden_bed', 64, 26, (R, M, se) => { // vegetable rows in Goro's garden
  const D = M.dirt;
  R(0, 6, 64, 18, M.wood[2]); R(0, 6, 64, 1, M.wood[4]); R(2, 8, 60, 14, D[1]); for (let y = 10; y < 22; y += 4) R(2, y, 60, 1, D[0]);
  if (se === 'winter') { R(0, 5, 64, 6, M.snow[4]); R(2, 11, 60, 8, M.snow[3]); return; }
  for (let i = 0; i < 10; i++) { const x = 4 + i * 6; R.e(x + 2, 9, 3, 3, M.forest[2]); R(x + 1, 6, 2, 2, M.forest[3]); if (se !== 'spring' && i % 3 === 0) R(x + 2, 11, 3, 3, se === 'autumn' ? M.leafAutumn[2] : M.ribbon[2]); }
  for (let i = 0; i < 10; i++) { const x = 6 + i * 6; R.e(x, 17, 2, 3, M.leaf[2]); R(x, 15, 1, 2, M.leaf[3]); }
}, { seasonal: true });

// ---------- park ----------
spr('town_bandstand', 160, 128, (R, M, se) => {
  const T = M.roofTeal, P = M.paper, W = M.wood;
  R.e(80, 112, 76, 14, M.stone[2]); R.e(80, 110, 76, 14, M.stone[4]); R.e(80, 110, 72, 12, W[3]); for (let x = 12; x < 150; x += 8) R(x, 104, 1, 14, W[2]);
  for (const x of [10, 44, 112, 146]) { R(x, 40, 5, 68, P[3]); R(x, 40, 1, 68, P[4]); R(x + 4, 40, 1, 68, P[1]); }
  for (let x = 14; x < 146; x += 6) R(x, 96, 2, 10, P[3]); R(10, 94, 140, 3, P[3]); R(10, 94, 140, 1, P[4]);
  R.t([2, 44], [158, 44], [80, 4], T[1]); R.t([10, 42], [80, 42], [80, 8], T[3]); R.t([80, 42], [150, 42], [80, 8], T[2]);
  for (let k = 0; k < 6; k++) line(R, 80, 6, 4 + k * 30, 44, T[0]);
  R(2, 42, 156, 4, T[0]); for (let x = 4; x < 156; x += 6) R(x, 46, 3, 2, P[4]); R(78, 0, 4, 6, M.butter[2]);
  if (se === 'winter') R.t([20, 38], [140, 38], [80, 8], M.snow[4]);
}, { seasonal: true });
spr('town_swings', 96, 70, (R, M) => {
  const S = M.coral, C = M.charcoal;
  line(R, 4, 66, 14, 4, S[2], 3); line(R, 24, 66, 14, 4, S[2], 3); line(R, 70, 66, 80, 4, S[2], 3); line(R, 90, 66, 80, 4, S[2], 3);
  R(12, 2, 72, 4, S[2]); R(12, 2, 72, 1, S[3]);
  for (const x of [30, 58]) { R(x, 6, 1, 44, C[2]); R(x + 10, 6, 1, 44, C[2]); R(x - 1, 50, 13, 3, M.wood[3]); R(x - 1, 52, 13, 1, M.wood[1]); }
}, {});
spr('town_slide', 64, 62, (R, M) => {
  const S = M.sky, Mt = M.metal;
  R(4, 14, 4, 46, Mt[1]); R(20, 14, 4, 46, Mt[1]); for (let y = 20; y < 58; y += 7) R(6, y, 16, 2, Mt[2]);
  R(2, 12, 24, 4, S[2]); R(2, 12, 24, 1, S[3]);
  for (let i = 0; i < 36; i++) R(24 + i, 14 + Math.round(i * 1.05), 4, 3, i < 3 ? S[2] : M.butter[2]);
  for (let i = 0; i < 36; i++) R(24 + i, 13 + Math.round(i * 1.05), 4, 1, M.butter[3]);
  R(6, 2, 16, 10, S[1]); R.t([4, 4], [24, 4], [14, 0], S[2]);
}, {});
spr('town_sandbox', 64, 44, (R, M) => {
  const W = M.wood, S = M.sand;
  R(0, 2, 64, 40, W[2]); R(0, 2, 64, 2, W[4]); R(3, 5, 58, 34, S[3]); for (let i = 0; i < 30; i++) R(4 + Math.floor(hash(i, 3, 1) * 56), 6 + Math.floor(hash(i, 3, 2) * 32), 2, 1, S[2]);
  R.e(20, 20, 7, 5, S[2]); R.e(19, 18, 5, 3, S[4]); R(40, 26, 6, 5, M.coral[2]); R(42, 22, 1, 4, M.coral[1]);
}, { outline: false });
spr('town_bridge_deck', 128, 56, (R, M, se) => {
  const W = M.wood;
  R(0, 10, 128, 40, W[2]); for (let x = 0; x < 128; x += 8) { R(x, 10, 1, 40, W[1]); R(x + 1, 10, 2, 40, W[3]); }
  for (const y of [4, 48]) { R(0, y, 128, 4, M.vermilion[2]); R(0, y, 128, 1, M.vermilion[3]); R(0, y + 3, 128, 1, M.vermilion[0]); for (let x = 2; x < 128; x += 20) R(x, y - 4, 4, 8, M.vermilion[1]); }
  if (se === 'winter') { R(0, 3, 128, 2, M.snow[4]); R(0, 47, 128, 2, M.snow[4]); }
}, { seasonal: true, outline: false });

// ---------- school ----------
spr('town_goal', 30, 58, (R, M) => {
  const P = M.paper[4];
  R(2, 4, 3, 52, P); R(2, 4, 26, 3, P); R(25, 8, 2, 46, M.paper[2]);
  for (let y = 10; y < 54; y += 5) line(R, 5, y, 25, y + 2, '#e8f0f699');
  for (let x = 8; x < 26; x += 5) line(R, x, 7, x, 54, '#e8f0f699');
}, {});
spr('town_flagpole', 16, 120, (R, M) => {
  R(7, 4, 2, 112, M.metal[3]); R(7, 4, 1, 112, M.metal[4]); R(5, 114, 6, 4, M.stone[2]); R.e(8, 3, 2, 2, M.butter[2]);
}, {});
spr('town_gate_pillar', 30, 60, (R, M, se) => {
  const S = M.stone;
  R(3, 8, 24, 50, S[3]); R(3, 8, 5, 50, S[4]); R(22, 8, 5, 50, S[2]); R(1, 4, 28, 6, S[4]); R(1, 4, 28, 1, S[5]);
  for (let y = 16; y < 58; y += 8) R(3, y, 24, 1, S[2]);
  R(7, 22, 16, 22, M.paper[4]); R(7, 22, 16, 1, M.metal[2]); for (let i = 0; i < 4; i++) R(9 + (i % 2), 25 + i * 5, 12, 2, M.ink[2]);
  if (se === 'winter') R(1, 2, 28, 3, M.snow[4]);
}, { seasonal: true });
spr('town_bins', 40, 30, (R, M) => {
  for (const [x, c] of [[2, 'sky'], [14, 'forest'], [26, 'butter']]) { const C = M[c]; R(x, 6, 11, 22, C[2]); R(x, 6, 3, 22, C[3]); R(x + 9, 6, 2, 22, C[1]); R(x - 1, 3, 13, 4, C[1]); R(x + 3, 4, 5, 1, M.charcoal[1]); }
}, {});

// ---------- festivals and the shotengai ----------
spr('town_bunting', 192, 30, (R, M) => {
  const cols = [M.coral[2], M.butter[2], M.mint[2], M.sky[2], M.lilac[2]];
  const sag = (x) => 4 + Math.round(Math.sin((x / 192) * Math.PI) * 10);
  for (let x = 0; x < 192; x++) R(x, sag(x), 1, 1, M.ink[2]);
  for (let i = 0; i < 14; i++) { const x = 4 + i * 13, y = sag(x + 4) + 1; R.t([x, y], [x + 9, y], [x + 4, y + 11], cols[i % 5]); R(x + 1, y, 7, 1, M.paper[4]); }
  R(0, 2, 3, 6, M.woodDark[2]); R(189, 2, 3, 6, M.woodDark[2]);
}, {});
spr('town_lanterns', 96, 30, (R, M) => { // a string of paper lanterns under the arcade roof
  const sag = (x) => 2 + Math.round(Math.sin((x / 96) * Math.PI) * 5);
  for (let x = 0; x < 96; x++) R(x, sag(x), 1, 1, M.ink[2]);
  for (let i = 0; i < 4; i++) { const x = 8 + i * 24, y = sag(x) + 2, C = i % 2 ? M.ribbon : M.butter; R(x + 2, y, 6, 2, M.charcoal[1]); R.e(x + 5, y + 10, 6, 8, C[2]); R.e(x + 3, y + 8, 3, 5, C[3]); for (let k = 0; k < 3; k++) R(x, y + 6 + k * 4, 11, 1, C[1]); R(x + 2, y + 18, 6, 2, M.charcoal[1]); }
}, {});
spr('town_arcade_pillar', 20, 110, (R, M) => {
  const S = M.metal;
  R(6, 6, 8, 102, S[2]); R(6, 6, 2, 102, S[3]); R(12, 6, 2, 102, S[1]); R(3, 104, 14, 5, S[1]); R(2, 2, 16, 5, S[3]); R(2, 2, 16, 1, S[4]);
  R(4, 40, 12, 18, M.coral[2]); R(5, 41, 10, 2, M.coral[3]); for (let i = 0; i < 3; i++) R(6, 46 + i * 4, 8, 1, M.paper[4]);
}, {});
spr('town_kei_truck', 96, 54, (R, M) => { // a little parked delivery truck (side view)
  const B = M.sky, C = M.charcoal;
  R(4, 22, 88, 20, B[3]); R(4, 22, 88, 2, B[4]); R(4, 40, 88, 2, B[1]);
  R(62, 6, 30, 18, B[3]); R(66, 9, 22, 12, M.sky[2]); R(66, 9, 22, 3, M.sky[4]); R(62, 6, 30, 2, B[4]);
  R(6, 16, 54, 6, M.wood[3]); R(8, 10, 14, 7, M.leafAutumn[2]); R(24, 12, 12, 5, M.forest[2]); R(40, 11, 14, 6, M.wood[2]);
  R(86, 30, 6, 4, M.butter[2]); R(4, 30, 4, 4, M.ribbon[2]);
  for (const x of [22, 74]) { R.e(x, 44, 9, 9, C[1]); R.e(x, 44, 5, 5, M.metal[3]); R.e(x, 44, 2, 2, C[2]); }
}, {});
