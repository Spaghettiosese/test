// Outdoor nature props: trees (oak, sakura, maple, pine) with season swaps, bushes, hedges, flower beds,
// planters, potted plants and the winter snowman. All hd, selective outline, palette ramps, light from the top-left.
import { spr, hash, line } from './lib.js';

// ---------- trees ----------
const BLOBS = [[0, 0, 30, 24], [-18, 10, 15, 13], [18, 10, 15, 13], [-10, -14, 17, 14], [12, -14, 17, 14], [0, 18, 20, 10]];
const BRANCHES = [[0, 6, -22, -20], [0, 2, 22, -22], [0, -2, 2, -34], [-10, -8, -26, -2], [12, -10, 28, -6], [-12, -12, -16, -30], [12, -16, 18, -32]];

function leafRamp(M, season, kind) {
  if (kind === 'sakura') return season === 'spring' ? M.sakura : season === 'autumn' ? [M.leafAutumn[0], M.vermilion[1], M.leafAutumn[1], M.leafAutumn[2], M.leafAutumn[3]] : M.leaf;
  if (kind === 'maple') return season === 'autumn' ? M.vermilion : season === 'spring' ? M.forest : M.leaf;
  return M.leaf;
}

function drawTree(R, M, season, kind, big, seed) {
  const W = big ? 80 : 56, H = big ? 104 : 72, s = big ? 1 : 0.68, cx = Math.floor(W / 2), q = (v) => Math.round(v * s);
  const Wd = M.woodDark;
  if (kind === 'pine') return drawPine(R, M, season, W, H, s, cx);
  const tw = big ? 8 : 6, th = big ? 46 : 32, ty = H - th;
  R(cx - tw / 2, ty, tw, th - 3, Wd[2]); R(cx - tw / 2, ty, 2, th - 3, Wd[3]); R(cx + tw / 2 - 2, ty, 2, th - 3, Wd[1]);
  R(cx - tw / 2 - 3, H - 5, tw + 6, 4, Wd[2]); R(cx - tw / 2 - 3, H - 5, 4, 1, Wd[3]); R(cx + tw / 2, H - 4, 3, 3, Wd[1]);
  for (let i = 0; i < 4; i++) R(cx - 1 + (i % 2), ty + 8 + i * 8, 1, 3, Wd[1]);
  const ccy = big ? 40 : 28;
  if (season === 'winter') { // bare branches with snow resting on top
    for (const [x0, y0, x1, y1] of BRANCHES) {
      const ax = cx + q(x0), ay = ccy + 14 + q(y0), bx = cx + q(x1), by = ccy + 14 + q(y1);
      line(R, ax, ay, bx, by, Wd[2], 2); line(R, ax, ay, bx, by, Wd[3], 1);
      line(R, bx, by, bx + Math.sign(x1 || 1) * q(6), by - q(6), Wd[2], 1);
      R(bx - 2, by - 2, 5, 2, M.snow[4]); R(Math.round((ax + bx) / 2) - 1, Math.round((ay + by) / 2) - 2, 4, 1, M.snow[3]);
    }
    line(R, cx, ty + 2, cx, ccy + 14, Wd[2], 3);
    return;
  }
  const L = leafRamp(M, season, kind);
  const blobs = BLOBS.map(([x, y, rx, ry], i) => [cx + q(x) + Math.round((hash(seed, i, 1) - 0.5) * 4), ccy + q(y) + Math.round((hash(seed, i, 2) - 0.5) * 3), q(rx) * (kind === 'sakura' ? 1.06 : 1) | 0, q(ry)]);
  for (const [x, y, rx, ry] of blobs) R.e(x, y, rx, ry, L[1]);
  for (const [x, y, rx, ry] of blobs) R.e(x - 2, y - 3, Math.max(2, rx - 3), Math.max(2, ry - 3), L[2]);
  for (const [x, y, rx, ry] of blobs.slice(0, 5)) R.e(x - 4, y - 6, Math.max(2, rx - q(9)), Math.max(2, ry - q(9)), L[3]);
  const n = big ? 34 : 20;
  for (let i = 0; i < n; i++) { // sparkles on the lit (upper-left) half
    const a = hash(i, seed, 3) * 6.283, r = 4 + hash(i, seed, 4) * q(22), x = Math.round(cx - 6 + Math.cos(a) * r), y = Math.round(ccy - 6 + Math.sin(a) * r * 0.8);
    if (x < cx + 4 && y < ccy + 4) R(x, y, 2, 1, L[4]);
  }
  for (let i = 0; i < (big ? 16 : 9); i++) { // holes on the shadow (lower) half
    const x = cx - q(26) + Math.floor(hash(i, seed, 5) * q(52)), y = ccy + q(6) + Math.floor(hash(i, seed, 6) * q(18));
    R(x, y, 2, 2, L[0]);
  }
  if (kind === 'sakura' && season === 'spring') for (let i = 0; i < (big ? 40 : 22); i++) {
    const x = cx - q(28) + Math.floor(hash(i, seed, 7) * q(56)), y = ccy - q(26) + Math.floor(hash(i, seed, 8) * q(44));
    R(x, y, 1, 1, hash(i, seed, 9) > 0.5 ? M.sakura[4] : M.paper[4]);
  }
  if (kind === 'oak' && season === 'autumn') for (let i = 0; i < 6; i++) R(cx - q(20) + Math.floor(hash(i, seed, 10) * q(40)), ccy + Math.floor(hash(i, seed, 11) * q(14)), 2, 2, M.woodDark[3]);
  if (kind === 'maple' && season !== 'autumn') for (let i = 0; i < 8; i++) R(cx - q(22) + Math.floor(hash(i, seed, 12) * q(30)), ccy - q(18) + Math.floor(hash(i, seed, 13) * q(20)), 1, 2, L[4]);
}

function drawPine(R, M, season, W, H, s, cx) {
  const F = M.forest, Wd = M.woodDark, q = (v) => Math.round(v * s);
  R(cx - 3, H - q(22), 6, q(22) - 3, Wd[2]); R(cx - 3, H - q(22), 2, q(22) - 3, Wd[3]); R(cx - 6, H - 5, 12, 4, Wd[2]);
  const tiers = 5;
  for (let i = 0; i < tiers; i++) {
    const bw = q(36 - i * 6), top = q(4 + i * 14), bot = H - q(20) - q(i * 14) + q(4);
    const yb = Math.min(bot, H - q(18)), yt = Math.max(1, yb - q(30));
    R.t([cx - bw, yb], [cx + bw, yb], [cx, yt], F[1]);
    R.t([cx - bw + 3, yb - 3], [cx + Math.round(bw * 0.25), yb - 3], [cx - 1, yt + 3], F[2]);
    R.t([cx - bw + 7, yb - 5], [cx - Math.round(bw * 0.35), yb - 5], [cx - 3, yt + 8], F[3]);
    R(cx - bw + 2, yb, bw * 2 - 4, 1, F[0]);
    if (season === 'winter') { R.t([cx - Math.round(bw * 0.6), yt + q(16)], [cx + Math.round(bw * 0.3), yt + q(16)], [cx, yt + 1], M.snow[4]); R(cx - Math.round(bw * 0.6), yt + q(16), Math.round(bw * 0.9), 1, M.snow[2]); }
    void top;
  }
}

for (const kind of ['oak', 'sakura', 'maple', 'pine']) {
  spr(`town_tree_${kind}`, 80, 104, (R, M, se) => drawTree(R, M, se, kind, true, 3), { seasonal: true });
  spr(`town_tree_${kind}_b`, 80, 104, (R, M, se) => drawTree(R, M, se, kind, true, 11), { seasonal: true });
  spr(`town_tree_${kind}_s`, 56, 72, (R, M, se) => drawTree(R, M, se, kind, false, 7), { seasonal: true });
}

// ---------- bushes ----------
function bush(R, M, season, flower, seed) {
  const L = M.leaf;
  R.e(8, 11, 8, 6, L[1]); R.e(21, 10, 9, 7, L[1]); R.e(14, 7, 8, 5, L[1]);
  R.e(7, 9, 6, 4, L[2]); R.e(19, 8, 7, 5, L[2]); R.e(13, 5, 6, 3, L[2]);
  R.e(6, 7, 3, 2, L[3]); R.e(16, 5, 4, 2, L[3]); R(12, 3, 3, 1, L[4]); R(4, 6, 2, 1, L[4]);
  R(9, 14, 2, 2, L[0]); R(22, 13, 2, 2, L[0]);
  if (season === 'winter') { R.e(13, 5, 9, 3, M.snow[4]); R.e(22, 7, 6, 2, M.snow[3]); R(4, 7, 5, 2, M.snow[4]); return; }
  if (!flower) return;
  const fc = flower === 'azalea' ? (season === 'spring' ? [M.sakura[2], M.sakura[3]] : null) : season === 'summer' ? [M.lilac[2], M.sky[2]] : season === 'autumn' ? [M.leafAutumn[2], M.butter[2]] : [M.paper[4], M.lilac[3]];
  if (!fc) return;
  for (let i = 0; i < 14; i++) { const x = 3 + Math.floor(hash(i, seed, 1) * 24), y = 3 + Math.floor(hash(i, seed, 2) * 10); R(x, y, 2, 2, fc[i % 2]); R(x, y, 1, 1, M.paper[4]); }
}
spr('town_bush', 30, 18, (R, M, se) => bush(R, M, se, null, 1), { seasonal: true });
spr('town_bush_flower', 30, 18, (R, M, se) => bush(R, M, se, 'hydrangea', 2), { seasonal: true });
spr('town_bush_azalea', 30, 18, (R, M, se) => bush(R, M, se, 'azalea', 3), { seasonal: true });

// Box hedge, 1 tile long, tiles seamlessly (no outline; edges hand-shaded).
spr('town_hedge', 32, 30, (R, M, se) => {
  const L = M.season === 'autumn' ? M.forest : M.leaf;
  R(0, 4, 32, 24, L[1]); R(0, 2, 32, 8, L[2]); R(0, 2, 32, 2, L[3]);
  for (let i = 0; i < 10; i++) { const x = Math.floor(hash(i, 5, 1) * 30), y = 11 + Math.floor(hash(i, 5, 2) * 14); R(x, y, 3, 2, L[2]); R(x, y + 2, 2, 1, L[0]); }
  for (let i = 0; i < 8; i++) R(Math.floor(hash(i, 6, 1) * 30), 3 + Math.floor(hash(i, 6, 2) * 5), 2, 1, L[4]);
  R(0, 10, 32, 1, L[1]); R(0, 27, 32, 2, L[0]); R(0, 29, 32, 1, '#2a1a22');
  if (se === 'winter') { R(0, 1, 32, 5, M.snow[4]); for (let x = 0; x < 32; x += 5) R(x, 6, 3, 1 + (x % 3), M.snow[3]); }
}, { seasonal: true, outline: false });

// ---------- flowers and planters ----------
function blooms(R, M, season, x0, y0, w, h, seed, n) {
  if (season === 'winter') return;
  for (let i = 0; i < n; i++) {
    const x = x0 + Math.floor(hash(i, seed, 1) * (w - 3)), y = y0 + Math.floor(hash(i, seed, 2) * (h - 3)), c = M.flower[i % M.flower.length];
    R(x, y + 2, 1, 2, M.forest[1]); R(x + 1, y, 1, 1, c); R(x, y + 1, 3, 1, c); R(x + 1, y + 2, 1, 1, c); R(x + 1, y + 1, 1, 1, M.butter[2]);
  }
}
spr('town_flowerbed', 64, 22, (R, M, se) => {
  const S = M.stone, D = M.dirt;
  R(0, 6, 64, 16, S[3]); R(0, 6, 64, 2, S[4]); R(0, 19, 64, 3, S[2]); for (let x = 8; x < 64; x += 12) R(x, 8, 1, 11, S[2]);
  R(3, 8, 58, 10, D[1]); R(3, 8, 58, 2, D[0]);
  if (se === 'winter') { R(2, 5, 60, 6, M.snow[4]); R(4, 11, 56, 6, M.snow[3]); return; }
  for (let i = 0; i < 9; i++) R.e(7 + i * 6, 9, 4, 3, M.leaf[2]);
  for (let i = 0; i < 9; i++) R(5 + i * 6, 7, 3, 1, M.leaf[3]);
  blooms(R, M, se, 3, 1, 58, 12, 31, 18);
}, { seasonal: true });
spr('town_planter', 32, 28, (R, M, se) => {
  const S = M.stone;
  R(2, 12, 28, 15, S[3]); R(2, 12, 28, 2, S[4]); R(2, 12, 2, 15, S[4]); R(26, 14, 4, 13, S[2]); R(4, 25, 26, 2, S[2]);
  R(4, 14, 24, 3, M.dirt[1]);
  if (se === 'winter') { R.e(16, 12, 13, 3, M.snow[4]); R(5, 10, 6, 2, M.snow[3]); return; }
  R.e(16, 9, 12, 6, M.leaf[1]); R.e(14, 7, 9, 4, M.leaf[2]); R.e(12, 6, 4, 2, M.leaf[3]);
  blooms(R, M, se, 5, 1, 22, 11, 41, 9);
}, { seasonal: true });
for (const [k, ramp] of [['a', 'coral'], ['b', 'sky'], ['c', 'butter']]) spr(`town_pot_${k}`, 16, 24, (R, M, se) => {
  const P = M[ramp];
  R(2, 14, 12, 9, M.roofRed[2]); R(2, 14, 12, 2, M.roofRed[3]); R(1, 13, 14, 2, M.roofRed[3]); R(11, 16, 3, 7, M.roofRed[1]);
  if (k === 'c') { R(7, 2, 2, 12, M.forest[2]); R(4, 5, 3, 2, M.forest[3]); R(9, 8, 3, 2, M.forest[1]); R(6, 0, 4, 3, se === 'winter' ? M.forest[2] : P[2]); return; }
  R.e(8, 8, 6, 6, M.leaf[1]); R.e(7, 7, 4, 4, M.leaf[2]); R(5, 5, 2, 1, M.leaf[4]);
  if (se !== 'winter') { R(4, 4, 2, 2, P[2]); R(9, 6, 2, 2, P[2]); R(6, 9, 2, 2, P[3]); R(11, 9, 2, 2, P[2]); }
}, { seasonal: true });

// ---------- winter: snowman ----------
spr('town_snowman', 26, 36, (R, M) => {
  const S = M.snow;
  R.e(13, 27, 11, 8, S[3]); R.e(11, 25, 8, 6, S[4]); R(4, 33, 18, 2, S[2]);
  R.e(13, 14, 8, 7, S[3]); R.e(12, 13, 6, 5, S[4]);
  R(6, 19, 14, 3, M.coral[2]); R(15, 20, 3, 7, M.coral[2]); R(15, 26, 3, 1, M.coral[1]); R(6, 21, 14, 1, M.coral[1]);
  R(9, 11, 2, 2, M.ink[1]); R(15, 11, 2, 2, M.ink[1]); R(13, 14, 4, 1, M.leafAutumn[2]); R(13, 15, 2, 1, M.leafAutumn[1]);
  R(7, 1, 12, 7, M.charcoal[2]); R(5, 7, 16, 2, M.charcoal[1]); R(8, 2, 2, 5, M.charcoal[3]);
  R(12, 26, 2, 2, M.ink[2]); R(12, 30, 2, 2, M.ink[2]);
  line(R, 3, 22, 0, 16, M.woodDark[2]); line(R, 22, 22, 25, 17, M.woodDark[2]);
}, { seasonal: true });

// Autumn leaf pile and a spring petal drift (decorative, flat).
spr('town_leafpile', 30, 12, (R, M) => {
  const A = M.leafAutumn;
  R.e(15, 7, 14, 4, A[1]); R.e(13, 6, 10, 3, A[2]); R.e(11, 5, 5, 2, A[3]);
  for (let i = 0; i < 10; i++) R(3 + Math.floor(hash(i, 2, 1) * 24), 3 + Math.floor(hash(i, 2, 2) * 7), 2, 1, [A[3], A[4], M.butter[2]][i % 3]);
}, { outline: false });
