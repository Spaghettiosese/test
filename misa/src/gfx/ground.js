// Procedural ground: bakes a map's floor into one canvas at screen density (32 px per tile).
// Tile defs choose how they're painted:
//   { ground: 'grass' | 'meadow' | 'lawn' | 'dirt' | 'sand' | 'water' | 'ocean' | 'paved' | 'plaza' | 'gravel' | 'asphalt' | 'snow' }
//      terrain: organic blended edges (tile-centre field + noise), drawn per pixel
//   { floor: 'planks' | 'kitchen' | 'bath' | 'tatami' | 'linoleum' | 'gym' | 'carpet' | 'stone' | 'wood_dark', tint?: ramp name }
//   { wall: 'plaster' | 'wood' | 'school' | 'brick' | 'stone' | 'hedge' }   walls get a face when the tile below is walkable
//   { spr } legacy 16px sprite tiles (upscaled)
import { materials, RAMPS } from './palette.js';
import { hash, vnoise, bayer } from './noise.js';

export const T2 = 32; // screen px per tile
const PRIORITY = { water: 9, ocean: 9, asphalt: 7, paved: 7, plaza: 7, gravel: 6, dirt: 5, sand: 4, snow: 3 }; // grass family = 0
const rgbCache = new Map();
const rgb = (h) => { let c = rgbCache.get(h); if (!c) { const n = parseInt(h.slice(1, 7), 16); c = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; rgbCache.set(h, c); } return c; };

export function bakeGround(m, season, bgHex = '#1e1624') {
  const W = m.w * T2, H = m.h * T2, img = new ImageData(W, H), d = img.data, M = materials(season);
  const put = (x, y, hex) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const c = rgb(hex), o = (y * W + x) * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255; };
  const rectf = (x, y, w, h, hex) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) put(i, j, hex); };
  const bg = rgb(bgHex);
  for (let i = 0; i < d.length; i += 4) { d[i] = bg[0]; d[i + 1] = bg[1]; d[i + 2] = bg[2]; d[i + 3] = 255; }
  const tileAt = (tx, ty) => (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h ? null : m.tiles[ty][tx]);
  const terr = (t) => (t && t.ground) || null;
  const isTerrain = (t) => !!(t && t.ground);
  // indicator field for terrain k: bilinear between tile centres + edge noise
  const field = (k, x, y, seed) => {
    const fx = x / T2 - 0.5, fy = y / T2 - 0.5, ix = Math.floor(fx), iy = Math.floor(fy), u = fx - ix, v = fy - iy;
    const val = (tx, ty) => { const t = tileAt(Math.max(0, Math.min(m.w - 1, tx)), Math.max(0, Math.min(m.h - 1, ty))); return t && t.ground === k ? 1 : 0; };
    const a = val(ix, iy), b = val(ix + 1, iy), c = val(ix, iy + 1), e = val(ix + 1, iy + 1);
    return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + e * u * v + (vnoise(x, y, seed, 6) - 0.5) * 0.22;
  };
  // which terrain owns pixel (x,y)? highest-priority terrain whose field passes, else the tile's own grass family
  const owner = (x, y, near) => {
    for (const k of near) if (field(k, x, y, PRIORITY[k] * 7) > 0.5) return k;
    const t = tileAt(Math.floor(x / T2), Math.floor(y / T2));
    return t && t.ground && !PRIORITY[t.ground] ? t.ground : 'grass';
  };
  const G = M.grass, D = M.dirt, S = M.sand, Wt = M.water, ST = M.stone, CH = M.charcoal;

  // ---------- terrain tiles ----------
  for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
    const t = m.tiles[ty][tx];
    if (!isTerrain(t)) continue;
    const near = new Set();
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const n = terr(tileAt(tx + i, ty + j)); if (n && PRIORITY[n]) near.add(n); }
    const order = [...near].sort((a, b) => PRIORITY[b] - PRIORITY[a]);
    const uniform = order.length <= 1 && [-1, 0, 1].every((j) => [-1, 0, 1].every((i) => { const n = tileAt(tx + i, ty + j); return !n || terr(n) === t.ground; }));
    for (let y = ty * T2; y < (ty + 1) * T2; y++) for (let x = tx * T2; x < (tx + 1) * T2; x++) {
      const k = uniform ? t.ground : owner(x, y, order);
      const inK = (xx, yy) => (uniform ? true : owner(xx, yy, order) === k);
      let col;
      switch (k) {
        case 'water': case 'ocean': {
          const deep = uniform || field(k, x, y, 63) > 0.85;
          col = deep ? Wt[2] : Wt[3];
          if (!uniform && (!inK(x, y - 1) || !inK(x, y - 2))) col = Wt[1];
          if (season === 'winter' && k === 'water') col = deep ? '#c0d8ec' : '#d8e8f4', (hash(x >> 2, y >> 1, 9) > 0.9 && (col = '#ffffff'));
          break;
        }
        case 'dirt':
          col = D[3];
          if (vnoise(x, y, 4, 9) > 0.62 && bayer(x, y) < 0.5) col = D[2];
          if (hash(x, y, 3) > 0.985) { col = D[1]; put(x + 1, y, D[4]); }
          if (!uniform) { if (!inK(x, y - 1) || !inK(x, y - 2)) col = D[1]; else if (!inK(x - 1, y) || !inK(x + 1, y)) col = D[2]; }
          if (season === 'winter' && vnoise(x, y, 8, 5) > 0.55) col = bayer(x, y) < 0.15 ? M.snow[2] : M.snow[3];
          break;
        case 'sand':
          col = S[3];
          if (vnoise(x, y, 5, 11) > 0.6 && bayer(x, y) < 0.4) col = S[2];
          if (hash(x, y, 4) > 0.992) col = S[4];
          if (!uniform && (!inK(x, y - 1))) col = S[1];
          break;
        case 'paved': case 'plaza': {
          const slab = k === 'paved' ? 16 : 8, lx = ((x % slab) + slab) % slab, ly = y % slab;
          const off = k === 'plaza' && Math.floor(y / slab) % 2 ? slab / 2 : 0, lx2 = (x + off) % slab;
          col = hash(Math.floor((x + off) / slab), Math.floor(y / slab), 11) > 0.7 ? ST[3] : ST[4];
          if (lx2 === 0 || ly === 0) col = ST[2]; else if (lx2 === 1 || ly === 1) col = ST[5] || ST[4];
          void lx;
          if (!uniform && !inK(x, y - 1)) col = ST[1];
          if (season === 'winter' && hash(x >> 1, y >> 1, 21) > 0.8) col = M.snow[3];
          break;
        }
        case 'gravel':
          col = hash(x, y, 13) > 0.5 ? ST[4] : ST[3];
          if (Math.abs(((x * 0.15 + Math.sin(y * 0.08) * 6) % 6) - 3) < 0.6) col = ST[3];
          if (!uniform && !inK(x, y - 1)) col = ST[2];
          break;
        case 'asphalt':
          col = hash(x, y, 17) > 0.93 ? CH[1] : CH[2];
          if (!uniform && (!inK(x, y - 1) || !inK(x, y + 1))) col = ST[4];
          break;
        case 'snow':
          col = vnoise(x, y, 2, 20) > 0.6 ? M.snow[4] : M.snow[3];
          break;
        default: { // grass family
          const n = vnoise(x, y, 1, 40) * 0.7 + vnoise(x, y, 2, 11) * 0.3, lawn = k === 'lawn';
          col = lawn ? (Math.floor(x / 16) % 2 ? G[3] : G[4]) : n > 0.68 + (bayer(x, y) - 0.5) * 0.08 ? G[4] : n < 0.3 + (bayer(x, y) - 0.5) * 0.08 ? G[2] : G[3];
          if (!uniform) {
            const below = owner(x, y + 1, order), above = owner(x, y - 1, order);
            if (below !== k && PRIORITY[below]) col = G[1];
            else if (above !== k && PRIORITY[above]) col = G[4];
          }
        }
      }
      put(x, y, col);
    }
  }
  // grass tufts and flowers (per 8x8 cell, never on other terrain)
  const isGrassPx = (x, y) => { const t = tileAt(Math.floor(x / T2), Math.floor(y / T2)); return !!(t && t.ground && !PRIORITY[t.ground]); };
  for (let cy = 0; cy < H; cy += 8) for (let cx = 0; cx < W; cx += 8) {
    const t = tileAt(Math.floor(cx / T2), Math.floor(cy / T2));
    if (!t || !t.ground || PRIORITY[t.ground] || t.ground === 'lawn') continue;
    const h = hash(cx, cy, 7), x = cx + Math.floor(hash(cx, cy, 8) * 6), y = cy + Math.floor(hash(cx, cy, 9) * 6);
    if (![[x, y], [x + 2, y + 2], [x, y + 3], [x + 3, y]].every(([a, b]) => isGrassPx(a, b))) continue;
    const near = new Set(); for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const n = terr(tileAt(Math.floor(x / T2) + i, Math.floor(y / T2) + j)); if (n && PRIORITY[n]) near.add(n); }
    const order = [...near].sort((a, b) => PRIORITY[b] - PRIORITY[a]);
    if (order.length && [[x, y + 2], [x + 2, y], [x, y + 3]].some(([a, b]) => owner(a, b, order) !== t.ground)) continue;
    const flowers = t.ground === 'meadow' ? 0.15 : 0.05;
    if (h < 0.28) { put(x, y + 1, G[1]); put(x + 2, y + 1, G[1]); put(x + 1, y, G[season === 'winter' ? 1 : 5]); put(x, y, G[4]); put(x + 2, y, G[4]); put(x + 1, y + 1, G[2]); }
    else if (h < 0.28 + flowers && season !== 'winter') { const fc = M.flower[Math.floor(hash(cx, cy, 10) * M.flower.length)]; put(x + 1, y, fc); put(x, y + 1, fc); put(x + 2, y + 1, fc); put(x + 1, y + 2, fc); put(x + 1, y + 1, M.butter[2]); put(x + 1, y + 3, G[1]); }
  }

  // ---------- floors and walls (per tile) ----------
  for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
    const t = m.tiles[ty][tx], X = tx * T2, Y = ty * T2;
    if (t.floor) paintFloor(t, X, Y, tx, ty, put, rectf, M);
    else if (t.wall) {
      const below = tileAt(tx, ty + 1), face = below && !below.solid && !below.wall;
      paintWall(t, X, Y, tx, ty, face, put, rectf, M);
    }
  }
  // ambient occlusion: darken the 2 px of floor right under a wall face
  for (let ty = 1; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
    const t = m.tiles[ty][tx], up = m.tiles[ty - 1][tx];
    if (t.floor && up.wall) for (let x = tx * T2; x < (tx + 1) * T2; x++) for (let y = ty * T2; y < ty * T2 + 2; y++) { const o = (y * W + x) * 4; d[o] *= 0.78; d[o + 1] *= 0.74; d[o + 2] *= 0.82; }
  }
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  c.getContext('2d').putImageData(img, 0, 0);
  // legacy sprite tiles on top
  return c;
}

function rampOf(t, M, fallback) { return (t.tint && M[t.tint]) || M[fallback]; }

function paintFloor(t, X, Y, tx, ty, put, rectf, M) {
  const k = t.floor;
  if (k === 'planks' || k === 'wood_dark') {
    const Wd = rampOf(t, M, k === 'wood_dark' ? 'woodDark' : 'wood');
    for (let r = 0; r < 4; r++) {
      const by = Y + r * 8, off = (r % 2) * 16 + ((tx * 7) % 3) * 4;
      for (let x = X; x < X + 32; x++) {
        const board = Math.floor((x + off) / 32), step = hash(board, ty * 4 + r, 31) > 0.66 ? 2 : hash(board, ty * 4 + r, 32) > 0.5 ? 3 : 3;
        for (let y = by; y < by + 8; y++) put(x, y, Wd[step]);
        put(x, by + 7, Wd[1]);
        if ((x + off) % 32 === 0) for (let y = by; y < by + 7; y++) put(x, y, Wd[1]);
        if (hash(x, by, 33) > 0.94) put(x, by + 3, Wd[2]);
      }
      put(X + 2, by + 1, Wd[4]);
    }
  } else if (k === 'kitchen') {
    const A = M.paper, B = rampOf(t, M, 'sky');
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
      const dark = (tx * 2 + i + ty * 2 + j) % 2 === 0, x = X + i * 16, y = Y + j * 16;
      rectf(x, y, 16, 16, dark ? B[3] : A[3]); rectf(x, y, 16, 1, dark ? B[4] : A[4]); rectf(x, y, 1, 16, dark ? B[4] : A[4]);
      rectf(x, y + 15, 16, 1, A[1]); rectf(x + 15, y, 1, 16, A[1]);
    }
  } else if (k === 'bath') {
    const B = rampOf(t, M, 'sky');
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const x = X + i * 8, y = Y + j * 8; rectf(x, y, 8, 8, hash(tx * 4 + i, ty * 4 + j, 41) > 0.8 ? B[4] : B[3]); rectf(x, y + 7, 8, 1, B[2]); rectf(x + 7, y, 1, 8, B[2]); }
  } else if (k === 'tatami') {
    const G = M.butter, Bo = M.forest;
    rectf(X, Y, 32, 32, '#d8cf8a');
    for (let y = Y; y < Y + 32; y += 2) rectf(X, y, 32, 1, '#ccc27c');
    if (tx % 2 === 0) rectf(X, Y, 2, 32, Bo[2]); if (ty % 1 === 0) rectf(X, Y, 32, 2, Bo[2]);
    void G;
  } else if (k === 'linoleum') {
    const L = rampOf(t, M, 'mint');
    rectf(X, Y, 32, 32, L[3]);
    for (let y = Y; y < Y + 32; y++) for (let x = X; x < X + 32; x++) if (hash(x, y, 51) > 0.985) put(x, y, L[4]);
    rectf(X, Y + 31, 32, 1, L[2]); if ((tx + ty) % 3 === 0) rectf(X + 4, Y + 10, 12, 1, L[4]);
  } else if (k === 'gym') {
    const Wd = M.wood;
    for (let y = Y; y < Y + 32; y++) for (let x = X; x < X + 32; x++) put(x, y, (Math.floor((x + (Math.floor(y / 4) % 2) * 8) / 16) % 2) ? Wd[4] : Wd[3]);
    for (let x = X; x < X + 32; x++) put(x, Y + 31, Wd[2]);
    if (t.line) rectf(X, Y + 15, 32, 2, '#fffaf0');
  } else if (k === 'carpet') {
    const C = rampOf(t, M, 'coral');
    rectf(X, Y, 32, 32, C[2]);
    for (let y = Y; y < Y + 32; y++) for (let x = X; x < X + 32; x++) if ((x + y) % 4 === 0) put(x, y, C[3]);
  } else if (k === 'stone') {
    const S = M.stone;
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const x = X + i * 16, y = Y + j * 16; rectf(x, y, 16, 16, hash(tx * 2 + i, ty * 2 + j, 61) > 0.5 ? S[3] : S[4]); rectf(x, y + 15, 16, 1, S[2]); rectf(x + 15, y, 1, 16, S[2]); }
  } else rectf(X, Y, 32, 32, M.paper[2]);
}

function paintWall(t, X, Y, tx, ty, face, put, rectf, M) {
  const k = t.wall, Wk = M.woodDark;
  if (k === 'hedge') {
    const L = M.leaf;
    rectf(X, Y, 32, 32, L[1]);
    for (let i = 0; i < 6; i++) { const cx = X + 4 + Math.floor(hash(tx, ty * 7 + i, 71) * 24), cy = Y + 4 + Math.floor(hash(tx, ty * 7 + i, 72) * 20); for (let y = -4; y <= 4; y++) for (let x = -5; x <= 5; x++) if (x * x / 25 + y * y / 16 <= 1) put(cx + x, cy + y, y < -1 ? L[3] : L[2]); }
    return;
  }
  if (!face) { // top-down wall thickness
    rectf(X, Y, 32, 32, Wk[1]); rectf(X, Y, 32, 2, Wk[2]); rectf(X, Y + 30, 32, 2, Wk[0]);
    return;
  }
  const P = k === 'wood' ? M.wood : k === 'school' ? M.paper : k === 'brick' ? M.brick : k === 'stone' ? M.stone : (t.tint && M[t.tint]) || M.plaster;
  rectf(X, Y, 32, 8, Wk[1]); rectf(X, Y, 32, 1, Wk[2]); // cap
  rectf(X, Y + 8, 32, 24, P[3]);
  if (k === 'wood') for (let x = X; x < X + 32; x += 6) rectf(x, Y + 8, 1, 20, P[2]);
  else if (k === 'brick') for (let r = 0; r < 4; r++) { rectf(X, Y + 8 + r * 6, 32, 1, P[1]); for (let x = X + ((r % 2) * 6); x < X + 32; x += 12) rectf(x, Y + 8 + r * 6, 1, 6, P[1]); }
  else for (let y = Y + 9; y < Y + 26; y++) for (let x = X; x < X + 32; x++) if (hash(x, y, 81) > 0.97) put(x, y, P[4]);
  if (k === 'school') { rectf(X, Y + 20, 32, 2, M.mint[2]); }
  rectf(X, Y + 8, 32, 1, P[4] || P[3]);
  rectf(X, Y + 26, 32, 4, Wk[2]); rectf(X, Y + 26, 32, 1, Wk[3]); rectf(X, Y + 30, 32, 2, Wk[1]); // baseboard
}

// Per-frame water animation: foam crawling along shores and sliding glints, drawn only in view.
export function waterInfo(m) {
  const tiles = [];
  for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) { const t = m.tiles[ty][tx]; if (t.ground === 'water' || t.ground === 'ocean') tiles.push([tx, ty]); }
  return tiles;
}
export function drawWaterFX(g, m, tiles, camX, camY, time, season, vw = 320, vh = 224) {
  if (season === 'winter') return;
  const W = RAMPS.water, f = Math.floor(time * 6);
  for (const [tx, ty] of tiles) {
    const X = tx * T2 - camX, Y = ty * T2 - camY;
    if (X < -32 || Y < -32 || X > vw || Y > vh) continue;
    for (let k = 0; k < 3; k++) {
      const y = 3 + ((k * 11 + ty * 5) % 26), x0 = Math.floor((hash(tx, ty * 3 + k, 91) * 40 + time * 6) % 40) - 4;
      if (x0 < 0 || x0 > 26) continue;
      g.fillStyle = W[4]; g.fillRect(Math.round(X + x0), Math.round(Y + y), 4, 1);
    }
    if ((tx + ty + f) % 7 === 0) { g.fillStyle = W[5]; g.fillRect(Math.round(X + 10 + (f % 9)), Math.round(Y + 20), 2, 1); }
  }
}
