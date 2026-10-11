// Style-target mockup: an outdoor town corner drawn procedurally at 1 art px = 1 canvas px, 32px tiles,
// next to Misa's real Moonkai sheet. Exercises: ramps + season swap, hash noise, dual-grid autotile
// (path + pond), water animation, tree generator, facade generator, selective outline, contact shadows,
// multiply lightmap with banded lights, weather particles, Bayer dither.
const VW = 320, VH = 224, T = 32;
export function makeScene(R, opts) {
  const { season = 'summer', time = 'day', weather = 'clear', t = 0, misa } = opts;
  const C = materials(R, season);
  const cv = document.createElement('canvas'); cv.width = VW; cv.height = VH;
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  const px = (x, y, c) => { g.fillStyle = c; g.fillRect(x, y, 1, 1); };

  // ---------- helpers ----------
  const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const bayer = (x, y) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
  const vnoise = (x, y, s, sc) => { // smooth value noise at scale sc (pixels)
    const fx = x / sc, fy = y / sc, ix = Math.floor(fx), iy = Math.floor(fy), u = fx - ix, v = fy - iy;
    const a = hash(ix, iy, s), b = hash(ix + 1, iy, s), c = hash(ix, iy + 1, s), d = hash(ix + 1, iy + 1, s);
    const su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v);
    return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv;
  };

  // ---------- map: corner (dual-grid) masks for path and water ----------
  const CW = VW / T + 1, CH = VH / T + 1;
  const corners = (pts) => { const m = new Uint8Array(CW * CH); for (const [x, y] of pts) m[y * CW + x] = 1; return m; };
  const path = corners([[3, 4], [3, 5], [3, 6], [3, 7], [4, 4], [5, 4], [6, 4], [6, 5], [7, 5], [8, 5], [8, 6], [9, 6], [10, 6]]);
  const pond = corners([[7, 1], [8, 1], [9, 1], [10, 1], [7, 2], [8, 2], [9, 2], [10, 2], [8, 3], [9, 3], [10, 3], [10, 0], [9, 0]]);
  // field value at pixel = bilinear blend of the 4 tile corners, plus edge noise -> organic rounded autotile
  const field = (m, x, y, s) => {
    const cx = x / T, cy = y / T, ix = Math.min(CW - 2, Math.floor(cx)), iy = Math.min(CH - 2, Math.floor(cy)), u = cx - ix, v = cy - iy;
    const a = m[iy * CW + ix], b = m[iy * CW + ix + 1], c = m[(iy + 1) * CW + ix], d = m[(iy + 1) * CW + ix + 1];
    const f = a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
    return f + (vnoise(x, y, s, 6) - 0.5) * 0.22;
  };
  const inPath = (x, y) => field(path, x, y, 11) > 0.5, inPond = (x, y) => field(pond, x, y, 23) > 0.5;

  // ---------- ground ----------
  const G = C.grass, D = C.dirt, Wt = C.water;
  for (let y = 0; y < VH; y++) for (let x = 0; x < VW; x++) {
    let col;
    if (inPond(x, y)) {
      const f = field(pond, x, y, 23);
      const edge = !inPond(x, y - 1) || !inPond(x - 1, y) || !inPond(x + 1, y) || !inPond(x, y + 1);
      col = f > 0.85 ? Wt[2] : Wt[3];
      if (!inPond(x, y - 1) || !inPond(x, y - 2)) col = Wt[1]; // bank shadow under the top lip
      if (edge && ((x + y + Math.floor(t * 3)) % 5) < 3 && inPond(x, y - 1)) col = Wt[5]; // foam ring, crawls with t
      const wv = (x + Math.floor(t * 6) + Math.floor(Math.sin(y * 0.7) * 3)) % 23; // wave glints
      if (f > 0.8 && y % 7 === 3 && wv < 4 && hash(Math.floor((x + t * 6) / 23), y, 5) > 0.4) col = Wt[4];
      if (season === 'winter') col = f > 0.85 ? '#c0d8ec' : '#d8e8f4', (hash(x >> 2, y >> 1, 9) > 0.9 && (col = '#ffffff'));
    } else if (inPath(x, y)) {
      col = D[3];
      if (vnoise(x, y, 4, 9) > 0.62 && bayer(x, y) < 0.5) col = D[2];
      if (hash(x, y, 3) > 0.985) col = D[1], px(x + 1, y, D[4]);
      if (!inPath(x, y - 1) || !inPath(x, y - 2)) col = D[1]; // grass overhang shadow on the path's top edge
      else if (!inPath(x - 1, y) || !inPath(x + 1, y)) col = D[2];
      if (season === 'winter' && field(path, x, y, 11) + (vnoise(x, y, 8, 5) - 0.5) * 0.3 < 0.9) col = (bayer(x, y) < 0.15 ? C.snow[2] : C.snow[3]);
    } else {
      // grass: macro light/dark patches (dithered boundary) + tufts + rare flowers
      const n = vnoise(x, y, 1, 28);
      col = n > 0.66 + (bayer(x, y) - 0.5) * 0.1 ? G[4] : n < 0.32 + (bayer(x, y) - 0.5) * 0.1 ? G[2] : G[3];
      if (inPath(x, y + 1) || inPond(x, y + 1)) col = G[1];          // rim where grass meets path/water below
      else if (inPath(x, y - 1) || inPond(x, y - 1)) col = G[4];     // lit lip above the path's bottom edge
    }
    if (col) px(x, y, col);
  }
  // grass tufts and flowers, placed by hash per 8x8 cell (deterministic, never on path/water)
  for (let cy = 0; cy < VH; cy += 8) for (let cx = 0; cx < VW; cx += 8) {
    const h = hash(cx, cy, 7), x = cx + Math.floor(hash(cx, cy, 8) * 6), y = cy + Math.floor(hash(cx, cy, 9) * 6);
    if (inPath(x, y + 2) || inPond(x, y + 2) || inPath(x + 2, y) || inPond(x + 2, y)) continue;
    if (h < 0.28) { px(x, y + 1, G[1]); px(x + 2, y + 1, G[1]); px(x + 1, y, G[season === 'winter' ? 1 : 5]); px(x, y, G[4]); px(x + 2, y, G[4]); px(x + 1, y + 1, G[2]); }
    else if (h < 0.33 && season !== 'winter') { const fc = C.flower[Math.floor(hash(cx, cy, 10) * C.flower.length)]; px(x + 1, y, fc); px(x, y + 1, fc); px(x + 2, y + 1, fc); px(x + 1, y + 2, fc); px(x + 1, y + 1, C.butter[2]); px(x + 1, y + 3, G[1]); }
  }

  // ---------- sprites: draw into a buffer, then selective outline ----------
  const spriteCanvas = (w, h, draw, opt = {}) => {
    const c = document.createElement('canvas'); c.width = w + 2; c.height = h + 2;
    const s = c.getContext('2d'); s.translate(1, 1);
    const R2 = (x, y, ww, hh, col) => { s.fillStyle = col; s.fillRect(x, y, ww, hh); };
    R2.disc = (cx, cy, rx, ry, col) => { for (let yy = -ry; yy <= ry; yy++) { const ww = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (yy * yy) / (ry * ry))) + 0.5); R2(cx - ww, cy + yy, ww * 2 + 1, 1, col); } };
    draw(R2);
    if (opt.outline !== false) selectiveOutline(c, opt.ink || '#2a1a22');
    return c;
  };
  // empty pixel touching the sprite -> dark hue-shifted shade of that neighbour; bottom side -> ink (grounds the object)
  function selectiveOutline(c, ink) {
    const s = c.getContext('2d'), w = c.width, h = c.height, im = s.getImageData(0, 0, w, h), d = im.data, out = new Uint8ClampedArray(d);
    const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 40;
    const [ir, ig, ib] = [parseInt(ink.slice(1, 3), 16), parseInt(ink.slice(3, 5), 16), parseInt(ink.slice(5, 7), 16)];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (solid(x, y)) continue;
      const nb = [[0, -1], [-1, 0], [1, 0], [0, 1]].filter(([dx, dy]) => solid(x + dx, y + dy));
      if (!nb.length) continue;
      const o = (y * w + x) * 4;
      if (solid(x, y - 1) && !solid(x, y + 1)) { out[o] = ir; out[o + 1] = ig; out[o + 2] = ib; out[o + 3] = 255; continue; }
      let r = 0, gg = 0, b = 0; for (const [dx, dy] of nb) { const q = ((y + dy) * w + x + dx) * 4; r += d[q]; gg += d[q + 1]; b += d[q + 2]; }
      r /= nb.length; gg /= nb.length; b /= nb.length;
      out[o] = r * 0.42 + 14; out[o + 1] = gg * 0.36 + 8; out[o + 2] = b * 0.42 + 26; out[o + 3] = 255; // darker + pushed toward plum
    }
    im.data.set(out); s.putImageData(im, 0, 0);
  }
  const shadowEll = (cx, cy, rx, ry) => { g.fillStyle = 'rgba(42,26,64,0.30)'; for (let yy = -ry; yy <= ry; yy++) { const ww = Math.floor(rx * Math.sqrt(1 - (yy * yy) / (ry * ry)) + 0.5); g.fillRect(cx - ww, cy + yy, ww * 2 + 1, 1); } };

  // ---------- house facade (5 tiles wide, roof 52 + wall 50) ----------
  const night = time === 'night';
  const house = spriteCanvas(168, 124, (R) => {
    const Rf = C.roof, P = C.plaster, Wd = C.wood, Wk = C.woodDark;
    // wall: 70 px tall so a 28x50 door is taller than Misa (door height = character height + 4)
    R(4, 52, 160, 70, P[3]); R(4, 52, 160, 5, P[1]); for (let x = 8; x < 160; x += 8) R(x, 106, 1, 12, P[2]);
    R(4, 104, 160, 2, Wk[3]); R(4, 118, 160, 4, Wk[2]); R(4, 118, 160, 1, Wk[3]);   // wainscot rail + skirting
    R(4, 52, 4, 70, Wk[3]); R(160, 52, 4, 70, Wk[2]);                               // corner posts (lit left, shaded right)
    for (const wx of [16, 112]) {
      R(wx - 2, 62, 32, 30, Wk[2]); R(wx, 64, 28, 26, night ? C.butter[3] : C.sky[2]);
      if (!night) { R(wx, 64, 28, 7, C.sky[3]); R(wx + 4, 73, 2, 2, C.sky[4]); R(wx + 6, 71, 2, 2, C.sky[4]); R(wx, 84, 28, 6, C.sky[1]); }
      else { R(wx, 64, 28, 3, C.butter[4]); R(wx, 85, 28, 5, C.butter[2]); }
      R(wx, 64, 6, 26, C.coral[2]); R(wx + 22, 64, 6, 26, C.coral[2]); R(wx + 5, 64, 1, 26, C.coral[1]); R(wx + 22, 64, 1, 26, C.coral[1]); R(wx, 64, 28, 2, C.coral[1]);
      R(wx + 13, 64, 2, 26, Wk[2]);
      R(wx - 4, 92, 36, 3, Wd[3]); R(wx - 4, 94, 36, 1, Wd[1]);                     // sill
      R(wx - 2, 95, 32, 6, Wd[2]); R(wx - 2, 100, 32, 1, Wd[1]);                      // flower box
      for (let i = 0; i < 6; i++) R(wx + i * 5, 91 + (i % 2), 3, 3, season === 'winter' ? C.snow[4] : C.flower[i % C.flower.length]);
    }
    // door 28x50 with striped awning and step
    R(66, 70, 30, 52, Wk[1]); R(68, 72, 26, 50, Wd[2]); R(70, 75, 10, 18, Wd[3]); R(82, 75, 10, 18, Wd[3]); R(70, 98, 22, 20, Wd[1]); R(71, 99, 20, 18, Wd[2]);
    R(89, 94, 2, 3, C.butter[2]); R(89, 94, 1, 1, C.butter[4]);
    R(62, 63, 38, 7, C.mint[2]); for (let x = 62; x < 100; x += 6) R(x, 63, 3, 7, C.paper[4]); R(62, 69, 38, 1, C.mint[0]);
    R(102, 78, 10, 7, C.paper[3]); R(104, 80, 2, 3, C.ink[1]); R(108, 80, 2, 3, C.ink[1]);   // house number
    // roof seen from above-front: kawara-style vertical ridges + course lines (reads as tiles, not brick)
    R(0, 4, 168, 50, Rf[2]);
    for (let x = 0; x < 168; x += 6) { R(x, 6, 1, 46, Rf[3]); R(x + 4, 6, 1, 46, Rf[1]); R(x + 5, 6, 1, 46, Rf[0]); }
    for (let y = 16; y < 52; y += 10) { R(0, y, 168, 1, Rf[0]); R(0, y + 1, 168, 1, Rf[1]); R(0, y - 1, 168, 1, Rf[3]); }
    R(0, 0, 168, 6, Rf[4]); R(0, 5, 168, 1, Rf[3]); R(0, 52, 168, 3, Rf[0]);
    if (season === 'winter') { R(0, 0, 168, 9, C.snow[4]); for (let x = 0; x < 168; x += 7) R(x, 9, 4, 2 + (x % 3), C.snow[3]); R(0, 50, 168, 3, C.snow[3]); }
    R(132, 0, 14, 18, C.brick[2]); R(132, 0, 14, 3, C.brick[4]); R(144, 3, 2, 15, C.brick[1]);   // chimney
  }, {});
  // ---------- tree generator ----------
  const tree = (seed, kind) => spriteCanvas(56, 72, (R) => {
    const L = kind === 'sakura' ? C.sakura : C.leaf;
    R(25, 44, 7, 26, C.woodDark[2]); R(25, 44, 2, 26, C.woodDark[3]); R(30, 44, 2, 26, C.woodDark[1]); R(22, 66, 13, 4, C.woodDark[2]);
    if (season === 'winter' && kind !== 'pine') { // bare branches
      for (const [x0, y0, x1, y1] of [[28, 46, 12, 22], [28, 44, 44, 18], [28, 40, 28, 8], [20, 30, 10, 14], [38, 28, 48, 16]]) { const n = 24; for (let i = 0; i <= n; i++) R(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 2, 2, C.woodDark[2]); }
      R(10, 12, 6, 2, C.snow[4]); R(26, 6, 6, 2, C.snow[4]); R(42, 14, 6, 2, C.snow[4]); return;
    }
    const blobs = [[28, 28, 20, 18], [16, 34, 11, 10], [40, 34, 11, 10], [22, 18, 12, 11], [36, 18, 12, 11], [28, 40, 14, 8]];
    for (const [x, y, rx, ry] of blobs) R.disc(x, y, rx, ry, L[1]);                       // shadow mass
    for (const [x, y, rx, ry] of blobs) R.disc(x - 2, y - 3, rx - 3, ry - 3, L[2]);       // mid
    for (const [x, y, rx, ry] of blobs.slice(0, 5)) R.disc(x - 4, y - 6, Math.max(2, rx - 8), Math.max(2, ry - 8), L[3]); // lit clusters (top-left light)
    for (let i = 0; i < 26; i++) { const a = hash(i, seed, 1) * 6.283, r = 6 + hash(i, seed, 2) * 14, x = Math.round(28 + Math.cos(a) * r - 3), y = Math.round(24 + Math.sin(a) * r * 0.8 - 3); if (y < 30 && x < 34) R(x, y, 2, 1, L[4]); }
    for (let i = 0; i < 14; i++) { const x = 10 + Math.floor(hash(i, seed, 3) * 36), y = 30 + Math.floor(hash(i, seed, 4) * 14); R(x, y, 2, 2, L[0]); }
    if (kind === 'apple' && season === 'autumn') for (let i = 0; i < 6; i++) R(12 + Math.floor(hash(i, seed, 6) * 30), 20 + Math.floor(hash(i, seed, 7) * 20), 3, 3, C.coral[2]);
  });
  // ---------- small props ----------
  const lamp = spriteCanvas(10, 52, (R) => { R(4, 10, 2, 40, C.charcoal[2]); R(4, 10, 1, 40, C.charcoal[3]); R(2, 48, 6, 3, C.charcoal[1]); R(1, 2, 8, 9, C.charcoal[1]); R(2, 3, 6, 7, night ? C.butter[3] : C.paper[2]); R(0, 0, 10, 3, C.charcoal[2]); });
  const fence = spriteCanvas(96, 22, (R) => { for (let x = 0; x < 96; x += 16) { R(x, 2, 4, 20, C.wood[3]); R(x + 3, 2, 1, 20, C.wood[2]); R(x, 0, 4, 2, C.wood[4]); if (season === 'winter') R(x, 0, 4, 2, C.snow[4]); } R(0, 6, 96, 3, C.wood[3]); R(0, 8, 96, 1, C.wood[1]); R(0, 14, 96, 3, C.wood[3]); R(0, 16, 96, 1, C.wood[1]); });
  const sign = spriteCanvas(26, 30, (R) => { R(11, 12, 4, 18, C.wood[2]); R(0, 0, 26, 14, C.wood[3]); R(0, 12, 26, 2, C.wood[1]); R(2, 2, 22, 9, C.wood[4]); R(5, 5, 3, 3, C.coral[2]); R(10, 5, 11, 1, C.wood[1]); R(10, 8, 8, 1, C.wood[1]); });
  const mailbox = spriteCanvas(12, 24, (R) => { R(5, 10, 3, 14, C.wood[2]); R(0, 0, 12, 11, C.coral[2]); R(0, 0, 12, 3, C.coral[3]); R(10, 2, 2, 9, C.coral[1]); R(3, 5, 6, 1, C.coral[0]); R(11, 1, 1, 5, C.butter[2]); });
  const bush = spriteCanvas(30, 18, (R) => { const L = season === 'winter' ? C.snow : C.leaf; R.disc(8, 11, 8, 6, L[1]); R.disc(20, 10, 9, 7, L[1]); R.disc(7, 9, 6, 4, L[2]); R.disc(18, 8, 7, 5, L[2]); R.disc(6, 7, 3, 2, L[3]); R(16, 4, 3, 1, L[4]); });

  // ---------- y-sorted objects ----------
  const objs = [];
  const put = (c, x, footY, shadow) => objs.push({ y: footY, fn: () => { if (shadow) shadowEll(x + shadow[0], footY + shadow[1], shadow[2], shadow[3]); g.drawImage(c, x - 1, footY - c.height + 1); } });
  put(house, 16, 124, null);
  g.fillStyle = 'rgba(42,26,64,0.30)'; g.fillRect(20, 124, 164, 5); g.fillRect(184, 60, 5, 64); // house cast shadow (down-right)
  put(tree(3, season === 'spring' ? 'sakura' : 'apple'), 236, 150, [28, -2, 20, 5]);
  put(tree(9, 'apple'), 278, 214, [28, -2, 18, 5]);
  put(fence, 186, 122, null);
  put(lamp, 196, 150, [5, -1, 5, 2]);
  put(sign, 222, 176, [13, -1, 9, 2]);
  put(mailbox, 4, 150, [6, -1, 6, 2]);
  put(bush, 132, 142, [15, -1, 13, 3]); put(bush, 14, 196, [15, -1, 13, 3]);
  // Misa at true 1:1 density, frame 0 of the front row
  if (misa) objs.push({ y: 168, fn: () => { shadowEll(112, 168, 10, 3); g.drawImage(misa, 0, 0, 40, 48, 92, 168 - 47, 40, 48); } });
  objs.sort((a, b) => a.y - b.y).forEach((o) => o.fn());

  // ---------- weather ----------
  if (weather === 'snow') for (let i = 0; i < 90; i++) { const sp = 12 + hash(i, 1, 1) * 18, x = Math.round((hash(i, 2, 2) * VW + Math.sin(t * 1.3 + i) * 6 + t * 8) % VW), y = Math.round((hash(i, 3, 3) * VH + t * sp) % VH); g.fillStyle = i % 4 ? '#ffffff' : C.snow[2]; g.fillRect(x, y, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1); }
  if (weather === 'rain') { for (let i = 0; i < 110; i++) { const far = i % 3 === 0, x = Math.round((hash(i, 2, 2) * (VW + 40) - t * (far ? 40 : 70)) % (VW + 40)), y = Math.round((hash(i, 3, 3) * VH + t * (far ? 160 : 260)) % VH); g.fillStyle = far ? 'rgba(200,220,240,0.35)' : 'rgba(225,240,255,0.65)'; for (let k = 0; k < (far ? 3 : 5); k++) g.fillRect(x - Math.floor(k / 2), y + k, 1, 1); }
    for (let i = 0; i < 14; i++) { const x = Math.floor(hash(i, Math.floor(t * 8), 4) * VW), y = Math.floor(hash(i, Math.floor(t * 8), 5) * VH); g.fillStyle = 'rgba(230,245,255,0.7)'; g.fillRect(x - 2, y, 1, 1); g.fillRect(x + 2, y, 1, 1); g.fillRect(x - 1, y - 1, 3, 1); } }

  // ---------- lighting: multiply lightmap, banded pixel lights ----------
  const grade = { day: null, golden: '#ffe2b8', dusk: '#d8a0b0', night: '#4c4a8c' }[time];
  const wgrade = weather === 'rain' ? '#b4c0d4' : weather === 'snow' ? '#e4ecfa' : null;
  if (grade || wgrade) {
    const L = document.createElement('canvas'); L.width = VW; L.height = VH; const l = L.getContext('2d');
    l.fillStyle = grade || '#ffffff'; l.fillRect(0, 0, VW, VH);
    if (wgrade) { l.globalCompositeOperation = 'multiply'; l.fillStyle = wgrade; l.fillRect(0, 0, VW, VH); l.globalCompositeOperation = 'source-over'; }
    if (night) {
      const band = (cx, cy, r, col, bands = 4) => { l.globalCompositeOperation = 'lighter'; for (let k = 0; k < bands; k++) { const rr = Math.round(r * (1 - k / bands)); l.fillStyle = col; const ry = Math.round(rr * 0.75); for (let yy = -ry; yy <= ry; yy++) { const ww = Math.floor(rr * Math.sqrt(1 - (yy * yy) / (ry * ry || 1))); l.fillRect(cx - ww, cy + yy, ww * 2 + 1, 1); } } l.globalCompositeOperation = 'source-over'; };
      band(201, 106, 46, 'rgba(120,90,40,0.55)'); // lamp
      for (const wx of [32, 128]) { band(wx + 14, 140, 30, 'rgba(110,80,30,0.5)', 3); l.globalCompositeOperation = 'lighter'; l.fillStyle = 'rgba(255,220,140,0.9)'; l.fillRect(wx, 64, 28, 26); l.globalCompositeOperation = 'source-over'; }
      band(97, 136, 22, 'rgba(110,80,30,0.45)', 3); // door
    }
    g.globalCompositeOperation = 'multiply'; g.drawImage(L, 0, 0); g.globalCompositeOperation = 'source-over';
    if (night) { // re-light emissive pixels (glass, lantern) so they don't get multiplied down
      
      g.fillStyle = '#fff4c0'; g.fillRect(199, 102, 6, 7);
      for (let i = 0; i < 18; i++) { const x = Math.floor(hash(i, 9, 9) * VW), y = Math.floor(hash(i, 8, 8) * 60) + 150; if (Math.floor(t * 3 + i) % 4 === 0) { g.fillStyle = '#e8ff9a'; g.fillRect(x, y, 1, 1); } } // fireflies
    }
  }
  return cv;
}

export function materials(R, season) {
  const grass = { spring: R.grassSpring, summer: R.grass, autumn: R.grassAutumn, winter: R.grassWinter }[season];
  const leaf = { spring: R.leaf, summer: R.leaf, autumn: R.leafAutumn, winter: R.leaf }[season];
  const flower = { spring: [R.sakura[2], R.lilac[3], R.paper[4]], summer: [R.coral[2], R.butter[2], R.lilac[2]], autumn: [R.leafAutumn[2], R.butter[1], R.coral[1]], winter: [R.snow[4]] }[season];
  return { ...R, grass, leaf, flower, roof: R.roofRed };
}
