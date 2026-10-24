/* LAST BELL - js/art.js
 * Procedural painterly isometric renderer (Canvas2D only, no assets).
 * Built from tools/artsrc/*.js via tools/build-art.sh (single deliverable: js/art.js).
 *
 * CONVENTIONS
 *  - Tile coords: integer (x,y) = tile CENTRE. project() returns the centre of that tile in baked-world px.
 *    unproject() returns fractional tile coords in the same convention (use Math.round to snap to a tile).
 *  - view = {camX,camY,zoom,w,h}: camX/camY are the WORLD px point shown at the CENTRE of the view
 *    (screen = (world - cam) * zoom + (w/2,h/2)). Everything is drawn in canvas px.
 */
(function () {
'use strict';
const TW = 64, TH = 32;
const WALLH = 150, PAD = 56, TOPX = 70, EDGE = 16, BS = 1.5;   // BS = bake supersample

/* ------------------------------------------------------------------ utils */
function hashStr(s) { s = String(s); let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function RNG(seed) {
  let a = (typeof seed === 'string' ? hashStr(seed) : seed) >>> 0;
  const f = function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  f.r = (lo, hi) => lo + (hi - lo) * f();
  f.i = (lo, hi) => Math.floor(lo + (hi - lo + 1) * f());
  f.g = () => (f() + f() + f() + f() - 2) * 0.8;      // approx gaussian, sd ~ .46
  f.p = (arr) => arr[Math.floor(f() * arr.length) % arr.length];
  f.s = () => (f() < .5 ? -1 : 1);
  return f;
}
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
function lat(i, j, s) { let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(s | 0, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function noise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = smooth(x - xi), yf = smooth(y - yi);
  const a = lat(xi, yi, s), b = lat(xi + 1, yi, s), c = lat(xi, yi + 1, s), d = lat(xi + 1, yi + 1, s);
  return lerp(lerp(a, b, xf), lerp(c, d, xf), yf);
}
function fbm(x, y, s, o) { let v = 0, a = .5, f = 1; for (let i = 0; i < (o || 3); i++) { v += a * noise(x * f, y * f, s + i * 7); a *= .5; f *= 2.03; } return v; }
const sstep = (a, b, x) => { const t = x <= a ? 0 : x >= b ? 1 : (x - a) / (b - a); return t * t * (3 - 2 * t); };

/* ---- fast tileable fbm table (256², 6 octaves, periods 128..4 texels) + bilinear sampler. nt() returns ~0..1 */
let _NT = null;
function ntTable() {
  if (_NT) return _NT;
  const N = 256, T = new Float32Array(N * N), oct = [[2, .2], [4, .3], [8, .3], [16, .15], [32, .08], [64, .04]];
  for (const [c, a] of oct) {
    const L = new Float32Array(c * c); for (let i = 0; i < c * c; i++) L[i] = lat(i % c, (i / c) | 0, c * 31 + 5);
    const k = c / N;
    for (let y = 0; y < N; y++) {
      const fy = y * k, yi = fy | 0, ty = smooth(fy - yi), y0 = yi % c, y1 = (yi + 1) % c;
      for (let x = 0; x < N; x++) {
        const fx = x * k, xi = fx | 0, tx = smooth(fx - xi), x0 = xi % c, x1 = (xi + 1) % c;
        const p = L[y0 * c + x0], q = L[y0 * c + x1], s2 = L[y1 * c + x0], u = L[y1 * c + x1];
        T[y * N + x] += a * (p + (q - p) * tx + (s2 - p + (p - q - s2 + u) * tx) * ty);
      }
    }
  }
  let lo = 1e9, hi = -1e9; for (let i = 0; i < N * N; i++) { if (T[i] < lo) lo = T[i]; if (T[i] > hi) hi = T[i]; }
  for (let i = 0; i < N * N; i++) T[i] = (T[i] - lo) / (hi - lo);
  return (_NT = T);
}
function nt(x, y) {   // feature size ~ 1/scale of the caller (x,y in 'feature' units); tiles every 8 features
  const T = _NT || ntTable(); x *= 32; y *= 32;
  const xf = Math.floor(x), yf = Math.floor(y), fx = x - xf, fy = y - yf, xi = xf & 255, yi = yf & 255, x1 = (xi + 1) & 255, y1 = ((yi + 1) & 255) << 8, y0 = yi << 8;
  const a = T[y0 + xi], b = T[y0 + x1], c = T[y1 + xi], d = T[y1 + x1];
  return a + (b - a) * fx + (c - a + (a - b - c + d) * fx) * fy;
}
/* directional brush-dab field: rows of overlapping strokes of length len, width wid along angle (ca,sa). ~[-1,1] */
function brushF(u, v, ca, sa, len, wid, s) {
  const wx = (nt(u * .045 + s, v * .045) - .5) * len * .6, wy = (nt(u * .03, v * .03 + s * 1.7) - .5) * wid * 2.2;
  const x = u * ca + v * sa + wx, y = -u * sa + v * ca + wy;
  const ry = y / wid, row = Math.floor(ry), fy = ry - row;
  const rl = len * (.7 + lat(row, 3, s) * .6), rx = x / rl + lat(row, 7, s) * 9.7, col = Math.floor(rx), fx = rx - col;
  let t = lat(col, row, s);
  if (fx > .72) { const k = smooth((fx - .72) / .28) * .5; t += (lat(col + 1, row, s) - t) * k; }
  const hair = lat((fy * 7) | 0, col * 13 + row, s + 1) - .5;
  const ridge = fy < .12 ? (.12 - fy) * 4.5 : fy > .9 ? (fy - .9) * -2.5 : 0;
  return (t - .5) * 1.5 + hair * .55 - ridge;
}
/* per-pixel material canvas: fn(u, v, out[3]) in local units, ks texels per unit */
function matCanvas(w, h, ks, fn, ky) {
  ky = ky || ks;
  const W = Math.max(1, Math.ceil(w * ks)), H = Math.max(1, Math.ceil(h * ky)), c = mk(W, H), g = ctx2(c), id = g.createImageData(W, H), d = id.data, o = [0, 0, 0];
  for (let y = 0, i = 0; y < H; y++) {
    const v = (y + .5) / ky;
    for (let x = 0; x < W; x++, i += 4) { o[0] = o[1] = o[2] = 0; fn((x + .5) / ks, v, o); d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2]; d[i + 3] = 255; }
  }
  g.putImageData(id, 0, 0); return c;
}

/* colours: arrays [r,g,b] */
const _cc = new Map();
function C(x) {
  if (Array.isArray(x)) return x;
  if (typeof x !== 'string') return [128, 128, 128];
  let v = _cc.get(x); if (v) return v;
  let s = x.trim();
  if (s[0] === '#') {
    if (s.length === 4) v = [parseInt(s[1] + s[1], 16), parseInt(s[2] + s[2], 16), parseInt(s[3] + s[3], 16)];
    else v = [parseInt(s.slice(1, 3), 16) || 0, parseInt(s.slice(3, 5), 16) || 0, parseInt(s.slice(5, 7), 16) || 0];
  } else { const m = s.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/); v = m ? [+m[1], +m[2], +m[3]] : [128, 128, 128]; }
  _cc.set(x, v); return v;
}
const css = (c, a) => 'rgba(' + (c[0] < 0 ? 0 : c[0] > 255 ? 255 : c[0] | 0) + ',' + (c[1] < 0 ? 0 : c[1] > 255 ? 255 : c[1] | 0) + ',' + (c[2] < 0 ? 0 : c[2] > 255 ? 255 : c[2] | 0) + ',' + (a === undefined ? 1 : +a.toFixed(3)) + ')';
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const mul = (a, k) => typeof k === 'number' ? [a[0] * k, a[1] * k, a[2] * k] : [a[0] * k[0], a[1] * k[1], a[2] * k[2]];
const add = (a, k) => [a[0] + k, a[1] + k, a[2] + k];
const lum = (a) => (a[0] * .3 + a[1] * .59 + a[2] * .11);
function sat(a, k) { const l = lum(a); return [l + (a[0] - l) * k, l + (a[1] - l) * k, l + (a[2] - l) * k]; }
function jit(c, r, amt) { const k = 1 + (r() - .5) * 2 * amt; const sh = (r() - .5) * amt * 40; return [c[0] * k + sh * .6, c[1] * k + sh * .2, c[2] * k - sh * .5]; }
const warmUp = (c, k) => [c[0] + 30 * k, c[1] + 10 * k, c[2] - 20 * k];
const coolDn = (c, k) => [c[0] - 18 * k, c[1] - 2 * k, c[2] + 14 * k];
const INK = [22, 16, 18];

function mk(w, h) {
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
  return c;
}
function ctx2(c) { return c.getContext('2d'); }

/* ------------------------------------------------------------ brush toolkit */
function pathPoly(ctx, pts, r, wob) {
  ctx.beginPath();
  if (!wob || !r) { ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); return; }
  const n = pts.length;
  ctx.moveTo(pts[0][0] + (r() - .5) * wob, pts[0][1] + (r() - .5) * wob);
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy), segs = Math.max(1, Math.round(len / 14));
    for (let s = 1; s <= segs; s++) {
      const t = s / segs;
      ctx.lineTo(a[0] + dx * t + (s === segs && i === n - 1 ? 0 : (r() - .5) * wob), a[1] + dy * t + (s === segs && i === n - 1 ? 0 : (r() - .5) * wob));
    }
  }
  ctx.closePath();
}
function bbox(pts) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of pts) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; } return [x0, y0, x1, y1]; }
function polyArea(pts) { let a = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; }

/* bristle stroke: one curved dab with parallel hairs */
function bristle(ctx, x, y, ang, len, wid, col, alpha, r) {
  const dx = Math.cos(ang) * len * .5, dy = Math.sin(ang) * len * .5;
  const bend = (r() - .5) * len * .18;
  const px = -Math.sin(ang), py = Math.cos(ang);
  ctx.lineCap = 'round';
  ctx.strokeStyle = css(col, alpha); ctx.lineWidth = wid;
  ctx.beginPath(); ctx.moveTo(x - dx, y - dy); ctx.quadraticCurveTo(x + px * bend, y + py * bend, x + dx, y + dy); ctx.stroke();
  if (wid > 2.4) {  // hairs: lighter / darker streaks inside the stroke
    const k = 1 + Math.floor(wid / 3);
    for (let i = 0; i < k; i++) {
      const o = (r() - .5) * wid * .8, l2 = .6 + r() * .4;
      const cc = r() < .5 ? mul(col, 1.18) : mul(col, .82);
      ctx.strokeStyle = css(cc, alpha * .6); ctx.lineWidth = Math.max(.6, wid * .16);
      ctx.beginPath(); ctx.moveTo(x - dx * l2 + px * o, y - dy * l2 + py * o);
      ctx.quadraticCurveTo(x + px * (bend + o), y + py * (bend + o), x + dx * l2 + px * o, y + dy * l2 + py * o); ctx.stroke();
    }
  }
}

/* impasto edges: highlight on lit edges / shadow on away edges */
function edgeLight(ctx, pts, o) {
  const A = polyArea(pts) >= 0 ? 1 : -1, L = o.light || [.55, -.83];
  const hi = o.hi || [255, 232, 190], lo = o.lo || [14, 12, 24], w = o.ew || 1.6;
  ctx.lineCap = 'round';
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    const dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy); if (len < 1) continue;
    const nx = A * dy / len, ny = -A * dx / len;           // outward normal
    const d = nx * L[0] + ny * L[1];
    if (d > .25) { ctx.strokeStyle = css(hi, Math.min(.75, d * .8) * (o.ha === undefined ? 1 : o.ha)); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); }
    else if (d < -.25) { ctx.strokeStyle = css(lo, Math.min(.6, -d * .7) * (o.la === undefined ? 1 : o.la)); ctx.lineWidth = w * 1.3; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); }
  }
}

/* dark hand-drawn ink outline with variable width */
function ink(ctx, pts, r, w, col, alpha, closed) {
  col = col || INK; w = w || 1.6; alpha = alpha === undefined ? .85 : alpha;
  const n = pts.length, m = closed === false ? n - 1 : n;
  ctx.lineCap = 'round';
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < m; i++) {
      const p = pts[i], q = pts[(i + 1) % n];
      const dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy), segs = Math.max(1, Math.round(len / 9));
      let px = p[0], py = p[1];
      for (let s = 1; s <= segs; s++) {
        const t = s / segs, nx = p[0] + dx * t + (r() - .5) * w * .7, ny = p[1] + dy * t + (r() - .5) * w * .7;
        ctx.strokeStyle = css(jit(col, r, .25), pass ? alpha * .45 : alpha); ctx.lineWidth = w * (pass ? .6 : (.7 + r() * .7));
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(nx, ny); ctx.stroke(); px = nx; py = ny;
      }
    }
  }
}
function inkLine(ctx, x0, y0, x1, y1, r, w, col, alpha) { ink(ctx, [[x0, y0], [x1, y1]], r, w, col, alpha, false); }

/* the main painter: fills a polygon with bristle strokes. o: n,ang,aj,sw,sl,alt,jv,wob,ink,edge,lit,dens,alpha,grain */
function paintPoly(ctx, pts, col, r, o) {
  o = o || {}; const c0 = C(col), bb = bbox(pts), w = bb[2] - bb[0], h = bb[3] - bb[1];
  if (w <= 0 || h <= 0) return;
  const area = Math.abs(polyArea(pts));
  ctx.save();
  pathPoly(ctx, pts, r, o.wob === undefined ? 0 : o.wob);
  ctx.clip();
  ctx.fillStyle = css(mul(c0, .93)); ctx.fillRect(bb[0] - 2, bb[1] - 2, w + 4, h + 4);
  if (o.lit) {   // soft volume gradient (light colour -> shadow colour) along an angle
    const a = o.lit[2] === undefined ? -1.0 : o.lit[2], cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2, R = Math.max(w, h) * .6;
    const g = ctx.createLinearGradient(cx - Math.cos(a) * R, cy - Math.sin(a) * R, cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    g.addColorStop(0, css(o.lit[0], o.lit[3] === undefined ? .45 : o.lit[3])); g.addColorStop(1, css(o.lit[1], o.lit[4] === undefined ? .45 : o.lit[4]));
    ctx.fillStyle = g; ctx.fillRect(bb[0] - 2, bb[1] - 2, w + 4, h + 4);
  }
  const dens = o.dens || 60;
  const n = o.n !== undefined ? o.n : clamp(area / dens, 5, 220);
  const ang = o.ang === undefined ? -.5 : o.ang, aj = o.aj === undefined ? .25 : o.aj;
  const sw = o.sw || clamp(Math.min(w, h) / 5, 1.6, 8), sl = o.sl || Math.max(w, h) * .55;
  const alt = o.alt ? C(o.alt) : null, jv = o.jv === undefined ? .16 : o.jv, al = o.alpha === undefined ? 1 : o.alpha;
  for (let i = 0; i < n; i++) {
    const x = bb[0] + r() * w, y = bb[1] + r() * h;
    let cc = jit(c0, r, jv); if (alt && r() < .35) cc = mix(cc, C(alt), .3 + r() * .5);
    bristle(ctx, x, y, ang + r.g() * aj, sl * (.3 + r() * .8), sw * (.5 + r() * 1.1), cc, (.28 + r() * .42) * al, r);
  }
  if (o.edge !== false) edgeLight(ctx, pts, o);
  ctx.restore();
  if (o.ink) ink(ctx, pts, r, o.inkw || 1.6, o.inkc, o.inka);
}
function paintRect(ctx, x, y, w, h, col, r, o) { paintPoly(ctx, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], col, r, o); }
function ellPts(cx, cy, rx, ry, n, rot, r, wob) {
  const pts = []; n = n || 18; rot = rot || 0;
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, k = 1 + (r && wob ? (r() - .5) * wob : 0); const x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k; pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]); }
  return pts;
}
function paintEll(ctx, cx, cy, rx, ry, col, r, o) { paintPoly(ctx, ellPts(cx, cy, rx, ry, o && o.pn || 20, o && o.rot, r, .06), col, r, o); }

/* glaze: translucent colour wash over a region (uses current composite) */
function glaze(ctx, pts, col, a, comp) { ctx.save(); ctx.globalCompositeOperation = comp || 'source-over'; pathPoly(ctx, pts); ctx.fillStyle = css(col, a); ctx.fill(); ctx.restore(); }

/* cached soft glow sprites */
const _glow = new Map();
function glowSprite(col, size) {
  col = C(col); const k = col.map(Math.round).join(',') + ':' + size; let c = _glow.get(k); if (c) return c;
  c = mk(size, size); const g = ctx2(c), gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, css(col, 1)); gr.addColorStop(.25, css(col, .55)); gr.addColorStop(.6, css(col, .16)); gr.addColorStop(1, css(col, 0));
  g.fillStyle = gr; g.fillRect(0, 0, size, size); _glow.set(k, c); return c;
}
function bokehSprite(col, size) {   // disc with soft rim, like out-of-focus light
  col = C(col); const k = 'bk' + col.map(Math.round).join(',') + ':' + size; let c = _glow.get(k); if (c) return c;
  c = mk(size, size); const g = ctx2(c), gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, css(col, .5)); gr.addColorStop(.7, css(col, .62)); gr.addColorStop(.9, css(col, .78)); gr.addColorStop(1, css(col, 0));
  g.fillStyle = gr; g.fillRect(0, 0, size, size); _glow.set(k, c); return c;
}
function stamp(ctx, spr, x, y, s, a) { ctx.globalAlpha = a === undefined ? 1 : a; ctx.drawImage(spr, x - s / 2, y - s / 2, s, s); ctx.globalAlpha = 1; }

/* grain tile (paper / canvas weave) */
let _grain = null;
function grainTile() {
  if (_grain) return _grain;
  const c = mk(256, 256), g = ctx2(c), id = g.createImageData(256, 256), r = RNG(99);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const i = (y * 256 + x) * 4; let v = 128 + (r() - .5) * 90 + Math.sin(x * 1.9) * 7 + Math.sin(y * 2.1) * 7 + (noise(x / 6, y / 6, 3) - .5) * 60;
    id.data[i] = id.data[i + 1] = id.data[i + 2] = clamp(v, 0, 255); id.data[i + 3] = 255;
  }
  g.putImageData(id, 0, 0); _grain = c; return c;
}
function applyGrain(ctx, w, h, amt, comp) {
  ctx.save(); ctx.globalCompositeOperation = comp || 'overlay'; ctx.globalAlpha = amt;
  ctx.fillStyle = ctx.createPattern(grainTile(), 'repeat'); ctx.fillRect(0, 0, w, h); ctx.restore();
}

/* film grain with alpha (cheap source-over instead of overlay): light & dark specks */
let _grainA = null;
function grainTileA() {
  if (_grainA) return _grainA;
  const N = 256, c = mk(N, N), g = ctx2(c), id = g.createImageData(N, N), r = RNG(77);
  for (let i = 0; i < N * N; i++) {
    const v = r() - .5 + (r() - .5) * .6, k = i * 4, lite = v > 0;
    id.data[k] = id.data[k + 1] = id.data[k + 2] = lite ? 235 : 8; if (lite) id.data[k + 2] = 220;
    id.data[k + 3] = Math.min(255, v * v * (lite ? 70 : 150));
  }
  g.putImageData(id, 0, 0); return (_grainA = c);
}
/* scene vignette: strong oval falloff + brushy corners + soft top haze band (cached per size+tone) */
const _svig = {};
function sceneVignette(w, h, tone, haze) {
  w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
  const k = w + 'x' + h + ':' + tone.join(',') + ':' + (haze ? haze.join(',') : ''); if (_svig[k]) return _svig[k];
  const c = mk(w, h), g = ctx2(c), R = Math.hypot(w, h) / 2, tc = tone;
  g.save(); g.translate(w / 2, h / 2); g.scale(1, h / w * 1.25);
  const rr = w * .62, gr = g.createRadialGradient(0, 0, rr * .42, 0, 0, rr * 1.12);
  gr.addColorStop(0, css(tc, 0)); gr.addColorStop(.45, css(tc, .22)); gr.addColorStop(.75, css(tc, .58)); gr.addColorStop(1, css(tc, .9));
  g.fillStyle = gr; g.fillRect(-w, -w, w * 2, w * 2); g.restore();
  if (haze) { const hg = g.createLinearGradient(0, 0, 0, h * .45); hg.addColorStop(0, css(haze, haze[3])); hg.addColorStop(1, css(haze, 0)); g.fillStyle = hg; g.fillRect(0, 0, w, h * .45); }
  const r = RNG(w * 31 + h);
  g.lineCap = 'round';
  for (let i = 0; i < 120; i++) {
    const a = r() * Math.PI * 2, d = .78 + r() * .3, x = w / 2 + Math.cos(a) * w * .55 * d, y = h / 2 + Math.sin(a) * h * .62 * d;
    g.strokeStyle = css(tc, .06 + r() * .14); g.lineWidth = 10 + r() * 34;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a + 1.6) * 80, y + Math.sin(a + 1.6) * 80); g.stroke();
  }
  const keys = Object.keys(_svig); if (keys.length > 4) delete _svig[keys[0]];
  return (_svig[k] = c);
}

/* vignette (cached per size) */
const _vig = {};
function vignette(w, h) {
  const k = w + 'x' + h; if (_vig[k]) return _vig[k];
  const c = mk(w, h), g = ctx2(c), R = Math.hypot(w, h) / 2;
  const gr = g.createRadialGradient(w / 2, h / 2, R * .38, w / 2, h / 2, R * 1.02);
  gr.addColorStop(0, 'rgba(6,4,10,0)'); gr.addColorStop(.55, 'rgba(6,4,10,.28)'); gr.addColorStop(.85, 'rgba(4,3,8,.66)'); gr.addColorStop(1, 'rgba(2,2,6,.88)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  // uneven brushy corners
  const r = RNG(w * 31 + h);
  for (let i = 0; i < 90; i++) {
    const a = r() * Math.PI * 2, d = R * (.7 + r() * .3), x = w / 2 + Math.cos(a) * d * (w / (w + h)) * 2, y = h / 2 + Math.sin(a) * d * (h / (w + h)) * 2;
    g.strokeStyle = 'rgba(2,2,6,' + (.05 + r() * .12) + ')'; g.lineWidth = 8 + r() * 26; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a + 1.6) * 60, y + Math.sin(a + 1.6) * 60); g.stroke();
  }
  const keys = Object.keys(_vig); if (keys.length > 3) delete _vig[keys[0]];
  _vig[k] = c; return c;
}

/* ---------------------------------------------------------- projection */
function lw(loc) { return (loc && loc.w) || 12; }
function lh(loc) { return (loc && loc.h) || 10; }
function originX(loc) { return lh(loc) * 32 + PAD; }
function originY() { return TOPX + WALLH; }
function worldSize(loc) { return { w: (lw(loc) + lh(loc)) * 32 + PAD * 2, h: originY() + (lw(loc) + lh(loc)) * 16 + EDGE + PAD }; }
function project(loc, x, y) { return { sx: originX(loc) + (x - y) * 32, sy: originY() + (x + y + 1) * 16 }; }
function unproject(loc, sx, sy) {
  const a = (sx - originX(loc)) / 32, b = (sy - originY()) / 16;      // a=u-v, b=u+v
  return { x: (a + b) / 2 - .5, y: (b - a) / 2 - .5 };
}
/* edge coords (u,v: tile edges, tile i spans [i,i+1]) -> world px */
function gp(S, u, v, z) { return [S.tx + (u - v) * 32, S.ty + (u + v) * 16 - (z || 0)]; }

/* ------------------------------------------------------- moods / time */
/* amb/bake/glow/floorMix: albedo tints (bake) + legacy fields used by props.
 * lit: light-pass ambient level (0..1, the light map's base), sh/hi: split-tone (shadow / highlight tint), sat, con: grade. */
const MOODS = {
  umber: { amb: [.86, .76, .66], bake: [.97, .90, .80], glow: [255, 170, 90], floorMix: [120, 80, 50], lit: [0.75, 0.68, 0.65], sh: [10, 26, 34], hi: [255, 196, 130], sat: .92, con: 1.12, bg: [16, 12, 12] },
  warm:  { amb: [.98, .86, .72], bake: [1.0, .95, .86], glow: [255, 150, 70], floorMix: [150, 90, 40], lit: [0.79, 0.71, 0.67], sh: [8, 34, 44], hi: [255, 186, 110], sat: .98, con: 1.1, bg: [18, 12, 12] },
  cold:  { amb: [.76, .88, .95], bake: [.88, .96, 1.0], glow: [255, 190, 120], floorMix: [60, 100, 110], lit: [0.73, 0.79, 0.83], sh: [6, 30, 46], hi: [240, 230, 200], sat: .82, con: 1.08, bg: [10, 14, 18] },
  dusk:  { amb: [.82, .88, .96], bake: [.90, .96, 1.0], glow: [255, 140, 70], floorMix: [60, 80, 90], lit: [0.75, 0.79, 0.87], sh: [6, 34, 54], hi: [255, 170, 100], sat: .9, con: 1.12, bg: [10, 14, 20] },
  sick:  { amb: [.80, .94, .72], bake: [.92, 1.0, .88], glow: [220, 230, 130], floorMix: [80, 110, 70], lit: [0.73, 0.79, 0.68], sh: [20, 36, 18], hi: [236, 240, 170], sat: .8, con: 1.1, bg: [12, 15, 10] },
  ember: { amb: [.62, .53, .50], bake: [.9, .82, .78], glow: [255, 120, 40], floorMix: [90, 40, 20], lit: [0.51, 0.45, 0.47], sh: [14, 12, 30], hi: [255, 150, 70], sat: 1.0, con: 1.16, bg: [12, 7, 7] },
  // --- art2 moods. grade = how much the time-of-day tint is allowed through (they are self-lit looks)
  lamp:  { amb: [1.0, .84, .60], bake: [1.0, .91, .74], glow: [255, 188, 84], floorMix: [150, 100, 40], grade: .45, lamp: true, wash: [255, 170, 60, .07], lit: [0.63, 0.55, 0.53], sh: [16, 22, 40], hi: [255, 190, 100], sat: .98, con: 1.14, bg: [14, 10, 8] },
  neon:  { amb: [.66, .74, 1.0], bake: [.84, .90, 1.04], glow: [255, 96, 150], floorMix: [60, 60, 110], grade: .35, sky: [[18, 20, 54], [196, 74, 112]], dapple: [255, 120, 170], neon: true, wash: [40, 140, 190, .07], lit: [0.49, 0.53, 0.69], sh: [10, 20, 54], hi: [255, 130, 170], sat: 1.06, con: 1.16, bg: [8, 8, 18] },
  storm: { amb: [.66, .78, .93], bake: [.82, .92, 1.02], glow: [150, 196, 255], floorMix: [60, 80, 100], grade: .3, sky: [[40, 50, 66], [118, 130, 146]], dapple: [170, 204, 255], storm: true, wash: [90, 130, 190, .07], lit: [0.59, 0.65, 0.73], sh: [8, 22, 40], hi: [210, 226, 250], sat: .78, con: 1.12, bg: [8, 11, 16] }
};
const TIMEKEYS = [
  [0,    [.36, .43, .72], [20, 40, 120, .08]],
  [360,  [.55, .65, .86], [60, 90, 150, .06]],
  [450,  [.90, .95, 1.0], [255, 214, 140, .07]],
  [600,  [1, 1, 1],       [255, 232, 176, .05]],
  [780,  [1, .98, .94],   [255, 240, 200, .02]],
  [960,  [1, .90, .76],   [255, 170, 60, .07]],
  [1080, [.88, .80, .84], [255, 110, 40, .08]],
  [1170, [.62, .72, .88], [20, 100, 120, .09]],
  [1260, [.42, .50, .76], [20, 40, 120, .08]],
  [1440, [.36, .43, .72], [20, 40, 120, .08]]
];
function timeTint(m) {
  m = ((m % 1440) + 1440) % 1440;
  for (let i = 1; i < TIMEKEYS.length; i++) if (m <= TIMEKEYS[i][0]) {
    const a = TIMEKEYS[i - 1], b = TIMEKEYS[i], t = (m - a[0]) / (b[0] - a[0]);
    return { mul: mix(a[1], b[1], t), add: [lerp(a[2][0], b[2][0], t), lerp(a[2][1], b[2][1], t), lerp(a[2][2], b[2][2], t), lerp(a[2][3], b[2][3], t)] };
  }
  return { mul: [.4, .45, .7], add: [20, 40, 120, .08] };
}
function bucketOf(m) { if (m === undefined || m === null || isNaN(m)) m = 600; m = ((m % 1440) + 1440) % 1440; return m < 360 ? 4 : m < 540 ? 0 : m < 840 ? 1 : m < 1050 ? 2 : m < 1200 ? 3 : 4; }
const BUCKET_MIN = [480, 690, 945, 1120, 1320];
const SKY = [  // top, bottom per bucket
  [[190, 196, 170], [250, 220, 160]], [[170, 190, 200], [226, 226, 214]], [[200, 170, 110], [250, 180, 90]],
  [[40, 90, 110], [240, 130, 70]], [[14, 22, 60], [34, 48, 96]]];
const DAPPLE = [[255, 226, 170], [255, 240, 200], [255, 184, 96], [255, 150, 80], [150, 180, 255]];
const DAPPLE_A = [1, 1, 1.1, .9, .45];

/* ---------------------------------------------------------- scene frames */
function floorFrame(ctx, S) { ctx.translate(S.tx, S.ty); ctx.transform(.5, .25, -.5, .25, 0, 0); }
function wallFrame(ctx, S, side) { // local: u px along wall (64/tile), v down from wall top; v = WALLH is the floor line
  if (side === 'l') { ctx.translate(S.tx, S.ty - WALLH); ctx.transform(-.5, .25, 0, 1, 0, 0); }
  else { ctx.translate(S.tx, S.ty - WALLH); ctx.transform(.5, .25, 0, 1, 0, 0); }
}
/* generic local frame for a free-standing wall-plane at arbitrary place:  u0,v0 tile-edge start, dir 'r' or 'l' */
function wallFrameAt(ctx, S, side, u0, z0) {  // origin at base point of wall at tile coordinate u0, z up flipped: local y downward from z0
  const base = side === 'l' ? gp(S, 0, u0, z0) : gp(S, u0, 0, z0);
  ctx.translate(base[0], base[1]);
  if (side === 'l') ctx.transform(-.5, .25, 0, 1, 0, 0); else ctx.transform(.5, .25, 0, 1, 0, 0);
}

/* ------------------------------------------------------------------ floors */
function floorPal(S) {
  const m = S.loc.mood;
  if (S.loc.floor === 'checker') {
    if (m === 'warm') return { a: [222, 196, 142], b: [196, 98, 50], c: [56, 120, 116], d: [150, 60, 40] };
    if (m === 'cold') return { a: [168, 178, 158], b: [92, 122, 120], c: [196, 180, 132], d: [70, 96, 100] };
    return { a: [184, 178, 142], b: [110, 130, 110], c: [190, 150, 90], d: [80, 100, 90] };
  }
  return null;
}
/* worn-path field: soft lanes between the spawn point and every exit (local floor px) */
function wearField(S) {
  const loc = S.loc, sp = loc.spawn || { x: lw(loc) / 2, y: lh(loc) / 2 }, segs = [];
  const P = (o) => [(o.x + .5) * 64, (o.y + .5) * 64];
  const ex = (loc.exits || []).filter(e => e && e.x !== undefined);
  for (const e of ex) segs.push([P(sp), P(e)]);
  if (ex.length > 1) for (let i = 1; i < ex.length; i++) segs.push([P(ex[i - 1]), P(ex[i])]);
  const sg = segs.map(([a, b]) => { const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1; return [a[0], a[1], dx, dy, L2]; });
  return function (u, v) {
    let best = 1e9;
    for (let i = 0; i < sg.length; i++) { const s = sg[i]; let t = ((u - s[0]) * s[2] + (v - s[1]) * s[3]) / s[4]; t = t < 0 ? 0 : t > 1 ? 1 : t; const x = u - s[0] - s[2] * t, y = v - s[1] - s[3] * t, d = x * x + y * y; if (d < best) best = d; }
    const w = Math.exp(-best / 5200) * (.55 + .7 * nt(u * .03 + 40, v * .03 + 9));
    return w > 1 ? 1 : w;
  };
}
function paintFloor(ctx, S) {
  const loc = S.loc, r = S.r, W = lw(loc) * 64, H = lh(loc) * 64, type = loc.floor || 'wood', seed = S.seed % 9973;
  const bk = S.mood.bake, wear = wearField(S);
  const gr = (c) => mul(C(c), bk);
  let fn = null, post = null;
  if (type === 'wood') {
    const m = loc.mood;
    const P = (m === 'storm' ? [[118, 104, 88], [102, 92, 80], [130, 114, 94], [92, 80, 70]] : m === 'warm' ? [[146, 88, 52], [128, 74, 44], [160, 102, 60], [116, 66, 42]] : m === 'lamp' ? [[166, 112, 62], [146, 96, 54], [178, 126, 72], [130, 84, 48]] : [[150, 104, 62], [132, 88, 54], [162, 116, 72], [118, 78, 50]]).map(gr);
    const pw = 16, WC = gr([214, 196, 160]);
    fn = function (u, v, o) {
      const row = (v / pw) | 0, fv = v / pw - row;
      const L = 150 + lat(row, 1, seed) * 150, uu = u + lat(row, 2, seed) * L, idx = Math.floor(uu / L), fu = uu - idx * L;
      const h = lat(idx, row, seed), c = P[(h * 4) | 0];
      // grain: fine wavy lines running along the plank, bending round knots
      let ph = v * 2.1 + (nt(u * .02 + idx * 17.3, row * 9.1 + h * 50) - .5) * 30 + h * 40;
      const kh = lat(idx, row, seed + 5);
      if (kh < .45) { const ku = (lat(idx, row, seed + 6) * .7 + .15) * L, kv = (lat(idx, row, seed + 8) * .5 + .25) * pw, dx = (fu - ku) * .45, dy = (fv * pw - kv), d2 = dx * dx + dy * dy; ph += 9 * Math.exp(-d2 / 26); if (d2 < 3.2) ph = 99; }
      let g = ph === 99 ? -2.4 : Math.sin(ph); g = g * g * g;
      let k = .9 + .08 * g + (nt(u * .006 + 3, v * .006) - .5) * .26 + (nt(u * .05, v * .7 + row) - .5) * .1;
      k += brushF(u, v, 1, 0, 64, 6, seed) * .05;
      // seams, bevel, butt joints, nails
      if (fv < .07) k *= .34; else if (fv < .16) k *= 1.1; else if (fv > .9) k *= .84;
      if (fu < 1.4 || fu > L - .8) k *= .38; else if (fu < 4.4 && (fv > .25 && fv < .38 || fv > .62 && fv < .75)) k *= .5;
      // scuff / wear: lighter, greyer, matte
      const w = wear(u, v) * .85, sc = nt(u * .09 + 11, v * .09) > .72 ? .07 : 0;
      let R = c[0] * k, G = c[1] * k, B = c[2] * k;
      const ww = w * .5 + sc; R += (WC[0] * k * .9 - R) * ww; G += (WC[1] * k * .9 - G) * ww; B += (WC[2] * k * .9 - B) * ww;
      // varnish sheen (broad, away from the path)
      const sh = sstep(.58, .82, nt(u * .011 + 70, v * .016 + 20)) * (1 - w) * 22;
      o[0] = R + sh; o[1] = G + sh * .85; o[2] = B + sh * .6;
    };
    post = function (g) {
      for (let i = 0; i < W * H / 9000; i++) { const x = r() * W, y = r() * H; g.strokeStyle = css(gr([30, 18, 12]), .16 + r() * .14); g.lineWidth = r.r(.6, 1.6); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + r.r(4, 14), y + r.r(-2, 2), x + r.r(10, 30), y + r.r(-3, 3)); g.stroke(); }
    };
  } else if (type === 'checker' || type === 'tile') {
    const P = type === 'tile' ? { a: [196, 190, 150], b: [96, 128, 92], c: [170, 170, 130], d: [80, 110, 84] } : floorPal(S);
    const pa = gr(P.a), pb = gr(P.b), pc = gr(P.c), pd = gr(P.d), T = type === 'tile' ? 32 : 64, gw = type === 'tile' ? 1.5 : 2.1, GC = gr([54, 44, 38]), WC = gr([200, 190, 170]);
    fn = function (u, v, o) {
      const i = Math.floor(u / T), j = Math.floor(v / T), fu = u - i * T, fv = v - j * T, par = (i + j) & 1, hr = lat(i, j, seed);
      const c = hr < .08 ? pc : hr > .95 ? pd : par ? pb : pa;
      const el = Math.min(fu, fv, T - fu, T - fv), gwob = gw * (.75 + .6 * nt(u * .3, v * .3));
      let grout = el < gwob;
      // chipped corners / edges
      const ch = lat(i, j, seed + 9);
      if (!grout && ch < .3) { const cx = ch < .075 ? 0 : ch < .15 ? T : ch < .225 ? 0 : T, cy = ch < .075 ? 0 : ch < .15 ? 0 : ch < .225 ? T : T, dx = fu - cx, dy = fv - cy, rr = (T * .14) * (.6 + nt(u * .4 + i, v * .4 + j)); if (dx * dx + dy * dy < rr * rr) grout = 2; }
      const w = wear(u, v);
      if (grout) {
        const k = (grout === 2 ? .8 : .7) * (.8 + .4 * nt(u * .2, v * .2)) * (1 - w * .2);
        o[0] = GC[0] * k; o[1] = GC[1] * k; o[2] = GC[2] * k; return;
      }
      let k = .9 + (lat(i, j, seed + 3) - .5) * .12 + (nt(u * .015 + 9, v * .015) - .5) * .18;
      if (fv < 3.2 || fu < 2.4) k *= 1.1; else if (T - fv < 3 || T - fu < 2.6) k *= .84;
      k += brushF(u, v, par ? .9 : .42, par ? .44 : -.91, T * .45, T * .09, seed + par) * .06;
      if (Math.abs(nt(u * .22 + i * 7, v * .22) - .5) < .012) k *= .82;   // craquelure
      let R = c[0] * k, G = c[1] * k, B = c[2] * k;
      const ww = w * .42; R += (WC[0] * k - R) * ww * .5; G += (WC[1] * k - G) * ww * .5; B += (WC[2] * k - B) * ww * .5;
      const l = (R + G + B) / 3, ds = w * .35; R += (l - R) * ds; G += (l - G) * ds; B += (l - B) * ds;
      const sh = sstep(.6, .85, nt(u * .012 + 55, v * .018 + 21)) * (1 - w) * 26;
      o[0] = R + sh; o[1] = G + sh * .9; o[2] = B + sh * .75;
    };
    post = function (g) {
      for (let i = 0; i < W * H / 14000; i++) { let x = r() * W, y = r() * H; g.strokeStyle = css([30, 20, 20], .4); g.lineWidth = .9; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += r.r(-12, 12); y += r.r(-12, 12); g.lineTo(x, y); } g.stroke(); }
      if (loc.id === 'canteen') medallion(g, S, 5.5 * 64, 7.5 * 64, 2.1 * 64, gr);
      if (loc.id === 'gym') gymLines(g, S, gr);
    };
  } else if (type === 'cobble') {
    const cs = 64 / 3, sk = S.mood.sky || SKY[S.bucket], s0 = gr([118, 120, 124]), s1 = gr([100, 96, 98]), s2 = gr([136, 124, 106]), s3 = gr([112, 110, 92]), PAL = [s0, s1, s2, s0, s3, s1];
    const MOSS = gr([66, 92, 50]), SOIL = gr([36, 32, 30]), sky0 = mix(sk[0], [24, 34, 50], .4), sky1 = sk[1];
    fn = function (u, v, o) {
      const gx = u / cs, gy = v / cs, ix = Math.floor(gx), iy = Math.floor(gy);
      let d1 = 9, d2 = 9, cx1 = 0, cy1 = 0, id = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const X = ix + dx, Y = iy + dy, cx = X + .5 + (lat(X, Y, seed) - .5) * .55, cy = Y + .5 + (lat(X, Y, seed + 1) - .5) * .55, ex = gx - cx, ey = gy - cy, d = ex * ex + ey * ey;
        if (d < d1) { d2 = d1; d1 = d; cx1 = cx; cy1 = cy; id = X * 7 + Y * 131; } else if (d < d2) d2 = d;
      }
      const edge = Math.sqrt(d2) - Math.sqrt(d1), mz = nt(u * .05, v * .05);
      const pud = nt(u * .009 + 3, v * .011 + 7), wet = sstep(.66, .71, pud), damp = sstep(.56, .66, pud);
      if (edge < .1 + (mz - .5) * .06) {
        const moss = sstep(.5, .66, mz) * (1 - wet);
        let R = SOIL[0] + (MOSS[0] - SOIL[0]) * moss, G = SOIL[1] + (MOSS[1] - SOIL[1]) * moss, B = SOIL[2] + (MOSS[2] - SOIL[2]) * moss;
        if (wet) { R = R * (1 - wet) + sky0[0] * .45 * wet; G = G * (1 - wet) + sky0[1] * .45 * wet; B = B * (1 - wet) + sky0[2] * .45 * wet; }
        o[0] = R; o[1] = G; o[2] = B; return;
      }
      const c = PAL[((lat(id, 5, seed) * 6) | 0)], ex = gx - cx1, ey = gy - cy1;
      let k = .86 + (lat(id, 6, seed) - .5) * .22 + (nt(u * .25, v * .25) - .5) * .16;
      k += (-ex * -.35 - ey * -.94) * .5;                       // dome lit from the back-right
      k *= .62 + .38 * sstep(.1, .3, edge);                     // rounded edge falloff
      k += brushF(u, v, .7, .7, 14, 3.5, seed) * .05;
      let R = c[0] * k, G = c[1] * k, B = c[2] * k;
      const moss = sstep(.6, .75, mz) * sstep(.3, .1, edge) * (1 - damp); R += (MOSS[0] - R) * moss * .6; G += (MOSS[1] - G) * moss * .6; B += (MOSS[2] - B) * moss * .6;
      if (damp > 0) { const dk = 1 - damp * .35; R *= dk; G *= dk; B *= dk; }
      if (wet > 0) {   // puddle: reflects the sky with soft streaks
        const t = sstep(0, 1, (nt(u * .02 + 13, v * .006) * .6 + ((u + v) / (W + H)) * .4)), rr = sky0[0] + (sky1[0] - sky0[0]) * t, rg = sky0[1] + (sky1[1] - sky0[1]) * t, rb = sky0[2] + (sky1[2] - sky0[2]) * t;
        const a = wet * .8; R = R * .5 * (1 - a) + rr * .82 * a; G = G * .5 * (1 - a) + rg * .82 * a; B = B * .5 * (1 - a) + rb * .82 * a;
        if (wet < .9) { R += 18 * (1 - wet); G += 18 * (1 - wet); B += 20 * (1 - wet); }
      }
      o[0] = R; o[1] = G; o[2] = B;
    };
  } else if (type === 'asphalt') {
    const night = loc.mood === 'neon', A0 = gr([64, 66, 76]), A1 = gr([50, 52, 62]), sk = S.mood.sky || SKY[S.bucket], RF = night ? [60, 30, 70] : sk[1];
    fn = function (u, v, o) {
      let k = .86 + (nt(u * .02, v * .02) - .5) * .34 + (nt(u * .4, v * .4) - .5) * .14;
      const sp = lat(u | 0, v | 0, seed); if (sp > .94) k += .22; else if (sp < .05) k -= .2;
      const pt = nt(u * .007 + 50, v * .009 + 3), patch = pt > .64;
      const c = patch ? A1 : A0; if (patch && pt < .655) k *= .55;
      k += brushF(u, v, .995, .1, 100, 16, seed) * .05;
      let R = c[0] * k, G = c[1] * k, B = c[2] * k;
      const wv = nt(u * .006 + 20, v * .008 + 40), wet = sstep(.5, .62, wv);
      if (wet > 0) { const dk = 1 - wet * .4; R *= dk; G *= dk; B *= dk;
        const hue = nt(u * .04 + 7, v * .04) * 6.28, oil = sstep(.7, .8, nt(u * .02 + 90, v * .02 + 4)) * wet * 16;
        R += Math.sin(hue) * oil + RF[0] * .12 * wet; G += Math.sin(hue + 2.1) * oil + RF[1] * .12 * wet; B += Math.sin(hue + 4.2) * oil + RF[2] * .14 * wet; }
      o[0] = R; o[1] = G; o[2] = B;
    };
    post = function (g) { asphaltDetails(g, S, W, H, gr); };
  } else if (type === 'metal') {
    const storm = loc.mood === 'storm', M = gr(storm ? [98, 108, 114] : [110, 108, 100]), RU = gr([128, 72, 42]);
    fn = function (u, v, o) {
      const i = Math.floor(u / 64), j = Math.floor(v / 64), fu = u - i * 64, fv = v - j * 64;
      let k = .9 + (lat(i, j, seed) - .5) * .1 + (nt(u * .02 + i, v * .02) - .5) * .2;
      // diamond tread: alternating short raised bars
      const a = (fu + fv) / 9, b = (fu - fv) / 9, ca = Math.floor(a), cb = Math.floor(b), fa = a - ca - .5, fb = b - cb - .5, alt = (ca + cb) & 1;
      const along = alt ? fa : fb, perp = alt ? fb : fa;
      if (Math.abs(along) < .36 && Math.abs(perp) < .13) k *= perp < 0 ? 1.22 : .7;
      if (fu < 1.2 || fv < 1.2 || fu > 62.8 || fv > 62.8) k *= .35;
      else if (fu < 3 || fv < 3) k *= 1.12;
      k += brushF(u, v, .7, .7, 30, 6, seed) * .05;
      let R = M[0] * k, G = M[1] * k, B = M[2] * k;
      const ru = sstep(.6, .74, nt(u * .015 + 30, v * .015 + 8)) * (.6 + .4 * nt(u * .3, v * .3)); R += (RU[0] * k - R) * ru; G += (RU[1] * k - G) * ru; B += (RU[2] * k - B) * ru;
      if (storm) { const wt = sstep(.55, .7, nt(u * .008 + 5, v * .01 + 60)); R += wt * 14; G += wt * 18; B += wt * 24; }
      o[0] = R; o[1] = G; o[2] = B;
    };
    post = function (g) { metalDetails(g, S, W, H, gr); };
  } else if (type === 'carpet') {
    post = function (g) { carpetPaint(g, S, W, H, gr); };
  } else { // concrete
    const C0 = gr([104, 104, 108]), ST = gr([44, 34, 26]);
    fn = function (u, v, o) {
      const i = Math.floor(u / 128), j = Math.floor(v / 128), fu = u - i * 128, fv = v - j * 128, sa = lat(i, j, seed) * 3;
      let k = .86 + (lat(i, j, seed + 2) - .5) * .12 + (nt(u * .018, v * .018) - .5) * .3 + (nt(u * .3, v * .3) - .5) * .1;
      k += brushF(u, v, Math.cos(sa), Math.sin(sa), 80, 22, seed) * .07;
      const sp = lat(u | 0, v | 0, seed); if (sp > .96) k += .18; else if (sp < .03) k -= .2;
      const el = Math.min(fu, fv, 128 - fu, 128 - fv); if (el < 1.4 + nt(u * .3, v * .3) * 1.2) k *= .3; else if (el < 4) k *= fu < 4 || fv < 4 ? 1.08 : .9;
      let R = C0[0] * k, G = C0[1] * k, B = C0[2] * k;
      const st = nt(u * .012 + 9, v * .014 + 30), oil = sstep(.64, .72, st); R += (ST[0] - R) * oil * .7; G += (ST[1] - G) * oil * .7; B += (ST[2] - B) * oil * .7;
      if (Math.abs(st - .6) < .006) { R *= .7; G *= .7; B *= .72; }
      const w = wear(u, v) * .3; R += (150 - R) * w * .3; G += (148 - G) * w * .3; B += (146 - B) * w * .3;
      o[0] = R; o[1] = G; o[2] = B;
    };
    post = function (g) {
      for (let i = 0; i < 14; i++) { let x = r() * W, y = r() * H; g.strokeStyle = css([20, 18, 22], .5); g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += r.r(-14, 14); y += r.r(-14, 14); g.lineTo(x, y); } g.stroke(); }
    };
  }
  // compose in local floor space, then transform into the scene
  const ks = .8, lc = fn ? matCanvas(W, H, ks, fn) : mk(W * ks, H * ks), lg = ctx2(lc);
  lg.save(); lg.scale(ks, ks);
  if (!fn) { lg.fillStyle = css(gr([60, 44, 38])); lg.fillRect(0, 0, W, H); }
  if (post) post(lg);
  // directional over-strokes: a sparse layer of real bristle strokes so the brush reads at play zoom
  const ang = type === 'wood' ? 0 : type === 'asphalt' ? .1 : -.5;
  for (let i = 0, n = W * H / 2600; i < n; i++) {
    const x = r() * W, y = r() * H, lite = r() < .5;
    bristle(lg, x, y, ang + r.g() * (type === 'wood' ? .05 : .5), r.r(16, 46), r.r(2, 5), lite ? [255, 236, 200] : [20, 14, 24], lite ? .045 : .07, r);
  }
  // ambient occlusion by the two back walls (soft, two-stage)
  let g = lg.createLinearGradient(0, 0, 0, 90); g.addColorStop(0, 'rgba(6,4,14,.62)'); g.addColorStop(.25, 'rgba(6,4,14,.28)'); g.addColorStop(1, 'rgba(6,4,14,0)'); lg.fillStyle = g; lg.fillRect(0, 0, W, 90);
  g = lg.createLinearGradient(0, 0, 90, 0); g.addColorStop(0, 'rgba(6,4,14,.66)'); g.addColorStop(.25, 'rgba(6,4,14,.3)'); g.addColorStop(1, 'rgba(6,4,14,0)'); lg.fillStyle = g; lg.fillRect(0, 0, 90, H);
  g = lg.createRadialGradient(0, 0, 0, 0, 0, 160); g.addColorStop(0, 'rgba(6,4,14,.4)'); g.addColorStop(1, 'rgba(6,4,14,0)'); lg.fillStyle = g; lg.fillRect(0, 0, 160, 160);
  lg.restore();
  ctx.save(); floorFrame(ctx, S); ctx.drawImage(lc, 0, 0, W, H); ctx.restore();
}
function asphaltDetails(ctx, S, W, H, gr) {
  const loc = S.loc, r = S.r, night = loc.mood === 'neon', PV = loc.pave === undefined ? 4.6 : loc.pave, rail = loc.rails === undefined ? (loc.id === 'street' ? 11.4 : -1) : loc.rails;
  // lane markings (faded, chipped) + zebra
  const ly = (rail > 0 ? rail - 2.4 : H / 64 - 2.2) * 64;
  for (let x = 40; x < W - 40; x += 120) paintRect(ctx, x, ly - 2.5, 64, 5, [214, 200, 150], r, { n: 8, sw: 2, ang: 0, edge: false, alpha: .5, jv: .2 });
  for (let k = 0; k < 7; k++) paintRect(ctx, 2.2 * 64 + k * 14, (PV + .35) * 64, 7, 70, [220, 214, 190], r, { n: 10, sw: 2.5, ang: 1.57, edge: false, alpha: .42, jv: .2 });
  if (PV > 0) {
    for (let j = 0; j < PV * 2; j++) for (let i = 0; i < W / 64; i++) {
      const c = jit(gr([118, 114, 108]), r, .1), hh = Math.min(30.4, PV * 64 - j * 32 - 1.6);
      paintRect(ctx, i * 64 + .8, j * 32 + .8, 62.4, hh, c, r, { n: 9, sw: 4, sl: 20, ang: r() * 3, alt: gr([84, 92, 96]), jv: .1, ha: .5, ew: 1.2 });
      if (r() < .18) { ctx.fillStyle = css([20, 30, 50], .25); ctx.beginPath(); ctx.ellipse(i * 64 + r.r(10, 54), j * 32 + r.r(6, 24), r.r(6, 16), r.r(3, 7), 0, 0, 7); ctx.fill(); }
    }
    ctx.strokeStyle = css(gr([30, 28, 30]), .7); ctx.lineWidth = 1.3; ctx.beginPath(); for (let i = 0; i <= W / 64; i++) { ctx.moveTo(i * 64, 0); ctx.lineTo(i * 64, PV * 64); } for (let j = 0; j <= PV * 2; j++) { ctx.moveTo(0, j * 32); ctx.lineTo(W, j * 32); } ctx.stroke();
    for (let i = 0; i < W / 30; i++) { const x = r() * W; ctx.fillStyle = css([60, 84, 50], .35); ctx.fillRect(x, r() * PV * 64, r.r(2, 6), 1.5); }   // weeds in joints
    paintRect(ctx, 0, PV * 64, W, 11, gr([164, 158, 148]), r, { n: W / 5, sw: 3, ang: 0, ink: true, ew: 1.6, ha: .9, light: [0, -1] });
    ctx.fillStyle = css([6, 4, 14], .45); ctx.fillRect(0, PV * 64 + 11, W, 9);
    const gg = ctx.createLinearGradient(0, PV * 64 + 11, 0, PV * 64 + 40); gg.addColorStop(0, 'rgba(6,4,14,.3)'); gg.addColorStop(1, 'rgba(6,4,14,0)'); ctx.fillStyle = gg; ctx.fillRect(0, PV * 64 + 11, W, 30);
  }
  if (rail > 0) {
    const ry = rail * 64;
    for (let x = 0; x < W; x += 21) for (let k = 0; k < 4; k++) paintEll(ctx, x + r.r(-2, 2) + 10, ry - 6 + k * 18 + r.r(-2, 2), r.r(8, 10.5), r.r(7, 9), jit(gr([96, 98, 104]), r, .12), r, { n: 3, pn: 8, sw: 3, ink: false, ew: 1, alt: gr([70, 80, 96]) });
    for (const off of [8, 52]) {
      ctx.fillStyle = css([14, 12, 16], .92); ctx.fillRect(0, ry + off - 3.4, W, 7);
      ctx.fillStyle = css(night ? [150, 170, 210] : [180, 180, 186], .8); ctx.fillRect(0, ry + off - 2.4, W, 1.6);
      ctx.fillStyle = css([110, 60, 40], .35); for (let x = 0; x < W; x += 9) if (r() < .4) ctx.fillRect(x, ry + off + 1, r.r(3, 9), 2);
      ctx.strokeStyle = css([255, 255, 255], .35); ctx.lineWidth = .8; ctx.beginPath(); for (let x = r() * 80; x < W; x += r.r(60, 160)) { ctx.moveTo(x, ry + off - 2); ctx.lineTo(x + r.r(10, 40), ry + off - 2); } ctx.stroke();
    }
  }
  for (let i = 0; i < 22; i++) { let x = r() * W, y = r() * H; ctx.strokeStyle = css([12, 12, 18], .6); ctx.lineWidth = r.r(.8, 1.8); ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 7; k++) { x += r.r(-16, 16); y += r.r(-14, 14); ctx.lineTo(x, y); } ctx.stroke(); }
  for (const [mx, my] of [[W * .42, (PV + 2.4) * 64], [W * .78, (PV + 3.6) * 64]]) {
    if (my > H - 40) continue;
    ctx.fillStyle = css([8, 8, 12], .5); ctx.beginPath(); ctx.arc(mx + 1, my + 1.5, 23, 0, 7); ctx.fill();
    paintEll(ctx, mx, my, 21, 21, [64, 62, 66], r, { n: 12, ink: true, ew: 1.4, lit: [[150, 150, 150], [20, 20, 30], -2.2, .3, .3] });
    ctx.strokeStyle = css([20, 20, 22], .8); ctx.lineWidth = 1.5; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(mx - 15, my + k * 6); ctx.lineTo(mx + 15, my + k * 6); ctx.stroke(); }
    ctx.fillStyle = css([110, 64, 40], .3); ctx.beginPath(); ctx.arc(mx + 6, my + 4, 8, 0, 7); ctx.fill();
  }
  // litter: paper scraps, leaflets
  for (let i = 0; i < 14; i++) { const x = r() * W, y = r.r(PV * 64, H), a = r() * 3; ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = css(r() < .5 ? [210, 200, 170] : [190, 80, 70], .55); ctx.fillRect(-5, -3.5, 10, 7); ctx.restore(); }
}
function metalDetails(ctx, S, W, H, gr) {
  const loc = S.loc, r = S.r, storm = loc.mood === 'storm';
  for (let j = 0; j < lh(loc); j++) for (let i = 0; i < lw(loc); i++) {
    const x0 = i * 64, y0 = j * 64;
    if (lat(i, j, S.seed + 4) > .86) {
      paintRect(ctx, x0 + 1, y0 + 1, 62, 62, [16, 14, 18], r, { n: 6, ink: true, ew: 1.4 });
      const hg = ctx.createRadialGradient(x0 + 32, y0 + 32, 2, x0 + 32, y0 + 32, 40); hg.addColorStop(0, 'rgba(255,110,40,.45)'); hg.addColorStop(1, 'rgba(255,110,40,0)'); ctx.fillStyle = hg; ctx.fillRect(x0 + 3, y0 + 3, 58, 58);
      ctx.strokeStyle = css(gr([108, 112, 112]), .9); ctx.lineWidth = 2.2; ctx.beginPath(); for (let k = 1; k < 8; k++) { ctx.moveTo(x0 + k * 8, y0 + 3); ctx.lineTo(x0 + k * 8, y0 + 61); } ctx.stroke();
      ctx.strokeStyle = css(gr([70, 74, 78]), .9); ctx.lineWidth = 1.4; ctx.beginPath(); for (let k = 1; k < 4; k++) { ctx.moveTo(x0 + 3, y0 + k * 16); ctx.lineTo(x0 + 61, y0 + k * 16); } ctx.stroke();
      S.lights.push((function () { const q = gp(S, (x0 + 32) / 64, (y0 + 32) / 64, 0); return { x: q[0], y: q[1], r: 70, col: [255, 120, 50], a: .1, fl: .25, ph: r() * 6, kind: 'heat' }; })());
      continue;
    }
    for (const [dx, dy] of [[5, 5], [59, 5], [5, 59], [59, 59]]) { ctx.fillStyle = css([34, 34, 38], .9); ctx.beginPath(); ctx.arc(x0 + dx, y0 + dy, 2.2, 0, 7); ctx.fill(); ctx.fillStyle = css([230, 230, 220], .55); ctx.fillRect(x0 + dx - 1, y0 + dy - 1.5, 1.6, 1); }
  }
  for (const p of (loc.props || [])) if ((p.t === 'generator' || p.t === 'console') && !p.side) {
    const x0 = (p.x - .28) * 64, y0 = (p.y - .28) * 64, w = ((p.w || 1) + .56) * 64, h = ((p.h || 1) + .56) * 64;
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.rect(x0 + 9, y0 + 9, w - 18, h - 18); ctx.clip('evenodd');
    ctx.fillStyle = css([34, 30, 26], .95); ctx.fillRect(x0, y0, w, h); ctx.fillStyle = css(gr([214, 176, 50]), .9);
    for (let a = -h; a < w + h; a += 22) { ctx.beginPath(); ctx.moveTo(x0 + a, y0); ctx.lineTo(x0 + a + 11, y0); ctx.lineTo(x0 + a + 11 - h, y0 + h); ctx.lineTo(x0 + a - h, y0 + h); ctx.fill(); }
    for (let i = 0; i < 30; i++) { ctx.fillStyle = css([40, 34, 30], .6); ctx.fillRect(x0 + r() * w, y0 + r() * h, r.r(2, 8), r.r(1, 3)); }
    ctx.restore();
  }
  for (let k = 0; k < 3; k++) { let x = r() * W * .6 + W * .2, y = r() * H * .6 + H * .2; ctx.strokeStyle = css([12, 12, 14], .92); ctx.lineWidth = r.r(4, 6.5); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); for (let q = 0; q < 4; q++) { ctx.quadraticCurveTo(x + r.r(-90, 90), y + r.r(-90, 90), x += r.r(-130, 130), y += r.r(-130, 130)); } ctx.stroke(); ctx.strokeStyle = css([120, 130, 150], .28); ctx.lineWidth = 1.4; ctx.stroke(); }
  for (let i = 0; i < 10; i++) { ctx.fillStyle = css([10, 8, 8], .18 + r() * .15); ctx.beginPath(); ctx.ellipse(r() * W, r() * H, r.r(10, 36), r.r(7, 22), r() * 3, 0, 7); ctx.fill(); }
  if (storm) for (let i = 0; i < 8; i++) { const x = r() * W, y = r() * H, rx = r.r(20, 50); ctx.strokeStyle = css([190, 210, 240], .18); ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y, rx, rx * .7, 0, 3.6, 5.6); ctx.stroke(); }
}
function carpetPaint(ctx, S, W, H, gr) {
  const loc = S.loc, r = S.r, lamp = loc.mood === 'lamp', P = lamp ? { a: [124, 48, 46], b: [152, 66, 52], c: [220, 176, 100], d: [44, 66, 68] } : { a: [84, 62, 74], b: [110, 72, 78], c: [196, 164, 110], d: [40, 58, 70] };
  paintRect(ctx, 0, 0, W, H, gr(P.a), r, { n: W * H / 60, sw: 5, sl: 30, ang: 0, aj: .12, alt: gr(P.b), jv: .1, edge: false });
  for (let j = 0; j < H / 64; j++) for (let i = 0; i < W / 64; i++) {
    const cx = i * 64 + 32, cy = j * 64 + 32, k = ((i + j) & 1) ? 1 : .7;
    paintPoly(ctx, [[cx, cy - 26 * k], [cx + 26 * k, cy], [cx, cy + 26 * k], [cx - 26 * k, cy]], jit(gr(P.b), r, .08), r, { n: 5, sw: 3, sl: 14, ang: .8, ink: false, edge: false, alt: gr(P.c), jv: .1, alpha: .85 });
    ctx.strokeStyle = css(gr(P.c), .5); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(cx, cy - 20 * k); ctx.lineTo(cx + 20 * k, cy); ctx.lineTo(cx, cy + 20 * k); ctx.lineTo(cx - 20 * k, cy); ctx.closePath(); ctx.stroke();
  }
  ctx.strokeStyle = css(gr(P.c), .85); ctx.lineWidth = 4; ctx.strokeRect(14, 14, W - 28, H - 28); ctx.strokeStyle = css(gr(P.d), .9); ctx.lineWidth = 3; ctx.strokeRect(24, 24, W - 48, H - 48);
}
function medallion(ctx, S, cx, cy, R, gr) {
  const r = S.r, rings = [[0, .22, [60, 124, 120]], [.22, .38, [226, 200, 150]], [.38, .56, [200, 104, 52]], [.56, .64, [30, 70, 78]], [.64, .82, [226, 200, 150]], [.82, 1, [200, 104, 52]]];
  ctx.fillStyle = css([30, 24, 24], .9); ctx.beginPath(); ctx.arc(cx, cy, R * 1.04, 0, 7); ctx.fill();
  for (let k = 0; k < rings.length; k++) {
    const [a, b, col] = rings[k], n = k === 0 ? 1 : Math.round(10 + k * 7);
    for (let s = 0; s < n; s++) {
      const a0 = s / n * 6.2832, a1 = (s + 1) / n * 6.2832 - .03;
      let c = col; if (k > 0 && (s & 1) && (k === 2 || k === 5)) c = [60, 124, 120]; if (k === 4 && (s & 1)) c = [196, 150, 100];
      const pts = k === 0 ? ellPts(cx, cy, R * b, R * b, 16, 0, r, .04) : [[cx + Math.cos(a0) * R * a, cy + Math.sin(a0) * R * a], [cx + Math.cos(a0) * R * b, cy + Math.sin(a0) * R * b], [cx + Math.cos((a0 + a1) / 2) * R * b, cy + Math.sin((a0 + a1) / 2) * R * b], [cx + Math.cos(a1) * R * b, cy + Math.sin(a1) * R * b], [cx + Math.cos(a1) * R * a, cy + Math.sin(a1) * R * a]];
      paintPoly(ctx, pts, jit(gr(c), r, .1), r, { n: 4, sw: 3, sl: 14, ang: (a0 + a1) / 2 + 1.57, jv: .1, ew: 1, ha: .5 });
      if (r() < .08) { ctx.fillStyle = css([40, 30, 28], .8); const q = pts[1]; ctx.beginPath(); ctx.arc(q[0], q[1], r.r(2, 4), 0, 7); ctx.fill(); }
    }
  }
  ctx.fillStyle = css([226, 200, 150], .95); ctx.beginPath();
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.2832 - 1.57, rr = i % 2 ? R * .07 : R * .2; ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.strokeStyle = css([30, 24, 24], .8); ctx.lineWidth = 1.2; ctx.stroke();
  // trodden centre
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R); g.addColorStop(0, 'rgba(220,210,190,.12)'); g.addColorStop(1, 'rgba(220,210,190,0)'); ctx.fillStyle = g; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
}
function gymLines(ctx, S, gr) {
  const loc = S.loc, W = lw(loc) * 64, H = lh(loc) * 64, r = S.r;
  ctx.save(); ctx.lineCap = 'round';
  const line = (pts, col, a) => { for (let k = 0; k < 2; k++) { ctx.strokeStyle = css(col, a * (k ? .5 : 1)); ctx.lineWidth = k ? 1.4 : 3; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0] + r.r(-.6, .6), p[1] + r.r(-.6, .6)) : ctx.moveTo(p[0], p[1])); ctx.stroke(); } };
  line([[70, 70], [W - 70, 70], [W - 70, H - 70], [70, H - 70], [70, 70]], [226, 214, 160], .55);
  line([[W / 2, 70], [W / 2, H - 70]], [226, 214, 160], .55);
  ctx.globalAlpha = .55; ctx.strokeStyle = css([226, 214, 160], 1); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(W / 2, H / 2, 90, 0, 7); ctx.stroke(); ctx.strokeStyle = css([190, 80, 60], 1);
  ctx.beginPath(); ctx.arc(8.5 * 64, 3.5 * 64, 120, 0, 3.14); ctx.stroke(); ctx.restore();
}
/* front faces of the floor slab: a cut section (floor finish, screed, rough core) */
function paintFloorEdge(ctx, S) {
  const loc = S.loc, w = lw(loc), h = lh(loc), r = S.r;
  const a = gp(S, w, 0), b = gp(S, w, h), c = gp(S, 0, h), E = EDGE;
  const core = mul([58, 44, 40], S.mood.bake), lip = mul(loc.floor === 'asphalt' || loc.floor === 'cobble' ? [90, 88, 92] : loc.floor === 'wood' ? [120, 84, 52] : [130, 120, 104], S.mood.bake);
  for (const [p, q, k] of [[a, b, .8], [b, c, .52]]) {
    paintPoly(ctx, [p, q, [q[0], q[1] + E], [p[0], p[1] + E]], mul(core, k), r, { n: 40, sw: 3, ang: 1.57, aj: .4, ink: true, inka: .7, alt: mul(core, k * 1.3) });
    paintPoly(ctx, [p, q, [q[0], q[1] + 3.5], [p[0], p[1] + 3.5]], mul(lip, k), r, { n: 20, sw: 2, ang: 0, edge: false });
    ctx.strokeStyle = css([255, 230, 190], .16 * k); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p[0], p[1] + .5); ctx.lineTo(q[0], q[1] + .5); ctx.stroke();
  }
}

/* ------------------------------------------------------------------- walls */
function wallPal(S) {
  const t = S.loc.wall || 'plaster', m = S.loc.mood;
  if (t === 'tiled') return m === 'storm' ? { b: [176, 192, 184], g: [58, 96, 92], m: [60, 70, 70] } : { b: [212, 206, 176], g: [78, 120, 96], m: [70, 66, 54] };
  if (t === 'corrugated') return m === 'storm' ? { b: [112, 128, 134], m: [44, 52, 58], rust: [140, 78, 44] } : { b: [136, 130, 112], m: [50, 46, 40], rust: [150, 80, 40] };
  if (t === 'brick' && m === 'neon') return { b: [112, 70, 74], m: [44, 40, 52], pl: [120, 116, 120] };
  if (t === 'brick' && m === 'storm') return { b: [104, 92, 90], m: [46, 48, 56], pl: [150, 150, 140] };
  if (m === 'lamp') return { top: [200, 164, 104], dado: [112, 76, 58] };
  if (t === 'brick') return m === 'warm' ? { b: [176, 84, 48], m: [74, 54, 44], pl: [210, 190, 150] } : m === 'ember' ? { b: [120, 56, 40], m: [40, 28, 28], pl: [120, 100, 84] } : { b: [136, 78, 58], m: [64, 52, 48], pl: [180, 170, 140] };
  if (m === 'sick') return { top: [196, 206, 160], dado: [74, 120, 84] };
  if (m === 'cold') return { top: [170, 184, 168], dado: [58, 100, 92] };
  if (m === 'umber') return { top: [176, 146, 100], dado: [110, 78, 52] };
  if (m === 'warm') return { top: [196, 170, 120], dado: [96, 62, 44] };
  return { top: [186, 170, 130], dado: [78, 112, 82] };
}
const GHOSTS = ['UNITY IS DUTY', 'ONE BELL · ONE VOICE', 'STUDY · OBEY · SERVE', 'THE FUTURE LISTENS', 'ORDER', 'WORK IS JOY'];
function paintWall(ctx, S, side) {
  const loc = S.loc, r = S.r, len = (side === 'l' ? lh(loc) : lw(loc)) * 64, P = wallPal(S), type = loc.wall || 'plaster', seed = (S.seed + (side === 'l' ? 77 : 0)) % 9973;
  const gr = (c) => mul(C(c), S.mood.bake), dark = side === 'l' ? .74 : 1.0, WH = WALLH;
  const dado = WH * .52, skirt = WH - 11;
  let fn = null;
  const brickAt = (u, v, o, B, M, kk) => {   // writes brick colour, returns 1 if mortar
    const row = (v / 10) | 0, off = (row & 1) ? 15 : 0, col = Math.floor((u + off) / 30), fu = u + off - col * 30, fv = v - row * 10;
    const wob = nt(u * .2, v * .2) * 1.1;
    if (fu < .9 + wob || fv < .9 + wob * .8) { const k = kk * (.74 + .4 * nt(u * .3 + 5, v * .3)) * (fv < 2.2 ? .7 : 1); o[0] = M[0] * k; o[1] = M[1] * k; o[2] = M[2] * k; return 1; }
    const h = lat(col, row, seed); let k = kk * (.8 + h * .34 + (nt(u * .35, v * .35) - .5) * .2);
    if (fv < 3) k *= 1.16; else if (fv > 8.6) k *= .8; if (fu > 27.8) k *= .86;
    let R = B[0] * k, G = B[1] * k, Bl = B[2] * k;
    const hb = lat(col, row, seed + 3); if (hb < .08) { R *= .62; G *= .6; Bl *= .7; } else if (hb > .93) { R *= 1.12; G *= 1.08; Bl *= 1.02; }
    o[0] = R; o[1] = G; o[2] = Bl; return 0;
  };
  if (type === 'brick') {
    const B = gr(P.b), M = gr(P.m), PL = gr(P.pl || [180, 170, 140]);
    fn = function (u, v, o) {
      brickAt(u, v, o, B, M, dark);
      // plaster remnants clinging on
      const pl = nt(u * .009 + 5 + seed, v * .016 + 9) - (v / WH) * .1;
      if (pl > .69) { const k = dark * (.86 + .2 * nt(u * .1, v * .1) + brushF(u, v, .995, .1, 50, 9, seed) * .06); o[0] = PL[0] * k; o[1] = PL[1] * k; o[2] = PL[2] * k; }
      else if (pl > .665) { o[0] *= .55; o[1] *= .55; o[2] *= .6; }
      shadeWall(u, v, o, WH, seed);
    };
  } else if (type === 'tiled') {
    const TB = gr(P.b), TG = gr(P.g), M = gr(P.m), RU = gr([120, 70, 36]);
    fn = function (u, v, o) {
      const th = 11, tw = 18, row = (v / th) | 0, col = (u / tw) | 0, fu = u - col * tw, fv = v - row * th, low = v >= WH * .6, c = low ? TG : TB;
      if (fu < 1 || fv < 1) { const k = dark * .8; o[0] = M[0] * k; o[1] = M[1] * k; o[2] = M[2] * k; }
      else {
        let k = dark * (.9 + (lat(col, row, seed) - .5) * .1 + (nt(u * .05, v * .05) - .5) * .12); if (fv < 2.6) k *= 1.14; else if (fv > th - 2) k *= .84;
        const miss = lat(col, row, seed + 2) < .03; if (miss) { k *= .5; }
        k += brushF(u, v, .85, .5, 14, 3, seed) * .05;
        o[0] = c[0] * k; o[1] = c[1] * k; o[2] = c[2] * k;
        if (miss) { o[0] = M[0] * .7; o[1] = M[1] * .7; o[2] = M[2] * .7; }
      }
      const ru = sstep(.6, .8, nt(u * .25 + 3, v * .006 + seed)) * (1 - v / WH) * .8; o[0] += (RU[0] * dark - o[0]) * ru; o[1] += (RU[1] * dark - o[1]) * ru; o[2] += (RU[2] * dark - o[2]) * ru;
      if (Math.abs(v - WH * .6) < 2.4) { o[0] = 26 * dark; o[1] = 36 * dark; o[2] = 32 * dark; }
      shadeWall(u, v, o, WH, seed);
    };
  } else if (type !== 'corrugated') {   // painted plaster with dado
    const TP = gr(P.top), DD = gr(P.dado), BR = gr([136, 78, 58]), BM = gr([70, 58, 50]), RENDER = gr([150, 140, 124]), RAIL = gr([60, 40, 30]);
    fn = function (u, v, o) {
      const low = v > dado, c = low ? DD : TP;
      let k = dark * (.92 + (nt(u * .01 + seed, v * .02) - .5) * .2 + brushF(u, v, .996, .09, low ? 70 : 90, low ? 9 : 12, seed + (low ? 1 : 0)) * .065);
      if (low) k *= 1 + sstep(dado + 6, dado, v) * .06;
      o[0] = c[0] * k; o[1] = c[1] * k; o[2] = c[2] * k;
      // peeling: paint gone -> render -> brick
      const pe = nt(u * .018 + 31 + seed, v * .026 + 11);
      if (pe > .7) { if (pe > .76) brickAt(u, v, o, BR, BM, dark); else { const kk = dark * (.85 + .3 * nt(u * .2, v * .2)); o[0] = RENDER[0] * kk; o[1] = RENDER[1] * kk; o[2] = RENDER[2] * kk; } }
      else if (pe > .685) { o[0] *= 1.12; o[1] *= 1.1; o[2] *= 1.05; }
      else if (pe > .67) { o[0] *= .7; o[1] *= .7; o[2] *= .72; }
      // water stains: tide rings near the top
      const ws = nt(u * .008 + 4 + seed, v * .012) - v / WH * .25;
      if (ws > .5) { const a = ws > .515 ? .14 : .32; o[0] -= 40 * a; o[1] -= 46 * a; o[2] -= 60 * a; }
      // hand-height grime above the dado, scuffs on the dado
      if (low && v < dado + 30) { const sm = nt(u * .04, v * .2) * .1; o[0] *= 1 - sm; o[1] *= 1 - sm; o[2] *= 1 - sm; }
      if (Math.abs(v - dado) < 2.4) { const kk = dark * (v < dado ? 1.4 : .9); o[0] = RAIL[0] * kk; o[1] = RAIL[1] * kk; o[2] = RAIL[2] * kk; }
      shadeWall(u, v, o, WH, seed);
    };
  }
  if (fn) {
    const ks = .85, ky = 1.5, lc = matCanvas(len, WH, ks, fn, ky), lg = ctx2(lc);
    lg.scale(ks, ky);
    wallDecor(lg, S, side, len, type, P, gr, dark, seed);
    ctx.save(); wallFrame(ctx, S, side); ctx.drawImage(lc, 0, 0, len, WH); ctx.restore();
  } else {
    ctx.save(); wallFrame(ctx, S, side); ctx.beginPath(); ctx.rect(0, 0, len, WH); ctx.clip();
    ctx.fillStyle = css(gr(P.m)); ctx.fillRect(0, 0, len, WH);
    for (let u = 0; u < len; u += 12) {
      const c = jit(gr(P.b), r, .06), g2 = ctx.createLinearGradient(u, 0, u + 12, 0);
      g2.addColorStop(0, css(mul(c, .62 * dark))); g2.addColorStop(.45, css(mul(c, 1.16 * dark))); g2.addColorStop(1, css(mul(c, .7 * dark)));
      ctx.fillStyle = g2; ctx.fillRect(u, 0, 12, WH);
      for (let k = 0; k < 2; k++) bristle(ctx, u + 4 + r() * 4, r() * WH, 1.57 + r.g() * .05, r.r(30, 90), r.r(2, 4), mul(c, 1 + r.g() * .12), .35, r);
    }
    for (let i = 0; i < len / 22; i++) { const x = r() * len, y = r.r(20, WH), s = r.r(10, 34); ctx.globalAlpha = .45; ctx.drawImage(glowSprite(mul(P.rust, dark), 128), x - s / 2, y - s, s, s * 3); }
    ctx.globalAlpha = 1;
    for (let u = 0; u < len; u += 64) { ctx.fillStyle = css([14, 12, 14], .6); ctx.fillRect(u - 1, 0, 2.4, WH); }
    wallDecor(ctx, S, side, len, type, P, gr, dark, seed);
    ctx.restore();
  }
}
/* shared wall weathering per pixel: soot from the top, rising damp, grime streaks */
function shadeWall(u, v, o, WH, seed) {
  const top = 1 - v / WH, n = nt(u * .02 + seed, v * .03);
  const soot = Math.max(0, top - .55) * 1.1 * (.5 + n); let k = 1 - soot * .5;
  const dm = nt(u * .016 + 7, v * .04 + seed) * (v / WH) * (v / WH); if (dm > .3) k *= 1 - (dm - .3) * .9;
  if (Math.abs(dm - .3) < .01) { o[0] += 26; o[1] += 26; o[2] += 22; }
  const st = nt(u * .22 + seed, v * .004); if (st > .64) k *= 1 - (st - .64) * .9;
  o[0] *= k; o[1] *= k * (dm > .3 ? 1.02 : 1); o[2] *= k;
}
/* canvas-painted wall details in local wall space: cracks, propaganda ghost, skirting, AO, light pooling */
function wallDecor(g, S, side, len, type, P, gr, dark, seed) {
  const r = S.r, loc = S.loc, WH = WALLH;
  // cracks
  for (let i = 0; i < len / 120; i++) { let x = r() * len, y = r.r(0, WH * .5); g.strokeStyle = css([26, 20, 20], .5); g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 7; k++) { x += r.r(-5, 5); y += r.r(4, 12); g.lineTo(x, y); } g.stroke(); g.strokeStyle = css([255, 240, 210], .12); g.beginPath(); g.moveTo(x + 1, y); g.stroke(); }
  // painted propaganda ghost on a free stretch of wall
  if (type !== 'tiled' && type !== 'corrugated') {
    const occ = (loc.props || []).filter(p => p.side === side).map(p => [wallStart(p) * 64 - 20, (wallStart(p) + wallLen(p)) * 64 + 20]);
    let best = null;
    for (let u = 40; u + 170 < len; u += 16) { if (!occ.some(q => u < q[1] && u + 170 > q[0])) { best = u; if (lat(u, 1, seed) < .3) break; } }
    if (best !== null && lat(seed, 3, 1) < .8) {
      const txt = GHOSTS[(seed + (side === 'l' ? 3 : 0)) % GHOSTS.length], w = 170, h = 44, tc = mk(w * 2, h * 2), tg = ctx2(tc);
      tg.scale(2, 2); tg.fillStyle = '#fff'; tg.font = 'bold 15px Georgia, serif'; tg.textAlign = 'center'; tg.textBaseline = 'middle';
      const words = txt.split(' · '); words.forEach((wd, i) => tg.fillText(wd, w / 2, h / 2 + (i - (words.length - 1) / 2) * 17, w - 10));
      tg.fillRect(8, 3, w - 16, 2); tg.fillRect(8, h - 5, w - 16, 2);
      tg.setTransform(1, 0, 0, 1, 0, 0); tg.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 160; i++) { tg.globalAlpha = .25 + r() * .5; bristle(tg, r() * w * 2, r() * h * 2, r.g() * .3, r.r(10, 40), r.r(2, 8), [0, 0, 0], 1, r); }
      tg.globalAlpha = 1; tg.globalCompositeOperation = 'source-in'; tg.fillStyle = css(lat(seed, 9, 2) < .5 ? [210, 200, 170] : [170, 50, 40]); tg.fillRect(0, 0, w * 2, h * 2);
      g.globalAlpha = .2; g.drawImage(tc, best, 16, w, h); g.globalAlpha = 1;
    }
  }
  // skirting board (painted wood) for interiors
  if (type !== 'corrugated' && loc.floor !== 'asphalt' && loc.floor !== 'cobble') {
    paintRect(g, 0, WH - 11, len, 11, mul(gr([62, 44, 34]), dark), r, { n: len / 6, sw: 2.6, sl: 40, ang: 0, aj: .04, edge: false, alt: mul(gr([90, 64, 44]), dark) });
    g.fillStyle = css([255, 226, 180], .2); g.fillRect(0, WH - 11, len, 1.3); g.fillStyle = css([8, 6, 12], .5); g.fillRect(0, WH - 9.6, len, 1);
  }
  // ceiling shadow & floor-line AO & corner shade
  let gg = g.createLinearGradient(0, 0, 0, 60); gg.addColorStop(0, 'rgba(6,4,14,.8)'); gg.addColorStop(.4, 'rgba(6,4,14,.3)'); gg.addColorStop(1, 'rgba(6,4,14,0)'); g.fillStyle = gg; g.fillRect(0, 0, len, 60);
  gg = g.createLinearGradient(0, WH - 34, 0, WH); gg.addColorStop(0, 'rgba(6,4,14,0)'); gg.addColorStop(.7, 'rgba(6,4,14,.25)'); gg.addColorStop(1, 'rgba(6,4,14,.6)'); g.fillStyle = gg; g.fillRect(0, WH - 34, len, 34);
  gg = g.createLinearGradient(0, 0, 110, 0); gg.addColorStop(0, 'rgba(6,4,14,.62)'); gg.addColorStop(.3, 'rgba(6,4,14,.25)'); gg.addColorStop(1, 'rgba(6,4,14,0)'); g.fillStyle = gg; g.fillRect(0, 0, 110, WH);
  gg = g.createLinearGradient(len - 160, 0, len, 0); gg.addColorStop(0, css(S.mood.glow, 0)); gg.addColorStop(1, css(S.mood.glow, side === 'r' ? .12 : .06)); g.fillStyle = gg; g.fillRect(len - 160, 0, 160, WH);
}
/* wall thickness: cut top caps and open end faces (painted section), drawn after the walls */
function paintWallCaps(ctx, S) {
  const loc = S.loc, r = S.r, w = lw(loc), h = lh(loc), T = .2, Z = WALLH, E = EDGE;
  const brick = loc.wall === 'brick' || loc.wall === 'tiled', sec = mul(brick ? [120, 66, 50] : [104, 90, 80], S.mood.bake), topc = mul(brick ? [118, 84, 70] : [132, 118, 100], S.mood.bake);
  // end faces (cross sections)
  const endR = [gp(S, w, -T, Z), gp(S, w, 0, Z), gp(S, w, 0, -E), gp(S, w, -T, -E)], endL = [gp(S, -T, h, Z), gp(S, 0, h, Z), gp(S, 0, h, -E), gp(S, -T, h, -E)];
  for (const [pts, k] of [[endR, .62], [endL, .46]]) {
    paintPoly(ctx, pts, mul(sec, k), r, { n: 26, sw: 3, ang: 1.57, aj: .3, ink: true, inka: .8, alt: mul(sec, k * 1.4) });
    ctx.save(); pathPoly(ctx, pts); ctx.clip(); ctx.strokeStyle = css([0, 0, 0], .35); ctx.lineWidth = 1;
    for (let z = 0; z < Z; z += 10) { const a = pts === endR ? gp(S, w, -T, z) : gp(S, -T, h, z), b = pts === endR ? gp(S, w, 0, z) : gp(S, 0, h, z); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    ctx.restore();
  }
  // caps
  const capR = [gp(S, -T, -T, Z), gp(S, w, -T, Z), gp(S, w, 0, Z), gp(S, 0, 0, Z)], capL = [gp(S, -T, -T, Z), gp(S, 0, 0, Z), gp(S, 0, h, Z), gp(S, -T, h, Z)];
  for (const pts of [capR, capL]) paintPoly(ctx, pts, topc, r, { n: 40, sw: 2.4, ang: pts === capR ? .46 : -.46, aj: .1, ink: true, inka: .9, alt: mul(topc, 1.5), edge: false });
  ctx.strokeStyle = css([255, 228, 190], .32); ctx.lineWidth = 1.2; ctx.beginPath();
  let p = gp(S, 0, h, Z); ctx.moveTo(p[0], p[1]); p = gp(S, 0, 0, Z); ctx.lineTo(p[0], p[1]); p = gp(S, w, 0, Z); ctx.lineTo(p[0], p[1]); ctx.stroke();
}
/* the void around the room: dark painted backdrop, tinted by mood */
function paintBackdrop(ctx, S) {
  const r = S.r, W = S.W, H = S.H, bg = S.mood.bg || [14, 12, 14];
  ctx.fillStyle = css(bg); ctx.fillRect(0, 0, W, H);
  const c = gp(S, lw(S.loc) / 2, lh(S.loc) / 2, 40), gg = ctx.createRadialGradient(c[0], c[1], 40, c[0], c[1], Math.max(W, H) * .7);
  gg.addColorStop(0, css(mix(bg, S.mood.glow, .12), 1)); gg.addColorStop(1, css(bg, 0)); ctx.fillStyle = gg; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < W * H / 2500; i++) bristle(ctx, r() * W, r() * H, -.5 + r.g() * .3, r.r(30, 90), r.r(6, 16), r() < .5 ? mul(bg, 1.5) : mul(bg, .6), .25, r);
}

/* ======================================================== PROP HELPERS */
const L_DIR = [.55, -.83];
function V3(S, u, v, z) { return gp(S, u, v, z); }
const PR_AO = [10, 6, 16];

/* ---- local drawing frames on box faces (y runs DOWN from the given z) ----
 * faceL: face v=vv (the visible lower-left face), x along +u (64 px / tile)
 * faceR: face u=uu (the visible lower-right face), x along -v starting at v1 (reads left->right)
 * faceT: horizontal plane at height z, x along +u, y along +v (64 px / tile)          */
function faceL(g, S, u0, vv, z1) { const o = gp(S, u0, vv, z1); g.translate(o[0], o[1]); g.transform(.5, .25, 0, 1, 0, 0); }
function faceR(g, S, uu, v1, z1) { const o = gp(S, uu, v1, z1); g.translate(o[0], o[1]); g.transform(.5, -.25, 0, 1, 0, 0); }
function faceT(g, S, u0, v0, z) { const o = gp(S, u0, v0, z); g.translate(o[0], o[1]); g.transform(.5, .25, -.5, .25, 0, 0); }

/* ---- cached material textures (drawn as patterns inside a face frame) ---- */
const _prT = {};
function prTex(kind) {
  if (_prT[kind]) return _prT[kind];
  const r = RNG('prtex' + kind); let c, g;
  if (kind === 'grain') {          // wood grain running along x
    c = mk(256, 96); g = ctx2(c); g.lineCap = 'round';
    for (let i = 0; i < 64; i++) {
      const y = r() * 96, a = .05 + r() * .17, dark = r() < .78;
      g.strokeStyle = dark ? 'rgba(34,16,6,' + a + ')' : 'rgba(255,222,170,' + (a * .7) + ')'; g.lineWidth = .5 + r() * 1.5;
      g.beginPath(); let x = -12, yy = y; g.moveTo(x, yy); while (x < 268) { x += 6 + r() * 16; yy += (r() - .5) * 1.4; g.lineTo(x, yy); } g.stroke();
    }
    for (let i = 0; i < 3; i++) { const x = 20 + r() * 216, y = 10 + r() * 76; for (let k = 0; k < 5; k++) { g.strokeStyle = 'rgba(40,18,8,' + (.3 - k * .05) + ')'; g.lineWidth = 1; g.beginPath(); g.ellipse(x, y, 2 + k * 3.4, 1 + k * 1.3, 0, 0, 7); g.stroke(); } g.fillStyle = 'rgba(30,12,4,.4)'; g.beginPath(); g.ellipse(x, y, 2.2, 1.2, 0, 0, 7); g.fill(); }
  } else if (kind === 'grime') {   // soft blotches, damp and handling marks
    c = mk(160, 160); g = ctx2(c);
    for (let i = 0; i < 46; i++) {
      const x = r() * 160, y = r() * 160, rr = 6 + r() * 26, dark = r() < .7, gr = g.createRadialGradient(x, y, 0, x, y, rr);
      gr.addColorStop(0, dark ? 'rgba(26,18,12,' + (.06 + r() * .1) + ')' : 'rgba(255,236,200,' + (.04 + r() * .06) + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; for (const ox of [-160, 0, 160]) for (const oy of [-160, 0, 160]) { g.save(); g.translate(ox, oy); g.fillRect(x - rr, y - rr, rr * 2, rr * 2); g.restore(); }
    }
    for (let i = 0; i < 260; i++) { g.fillStyle = r() < .7 ? 'rgba(20,14,10,' + (.1 + r() * .25) + ')' : 'rgba(255,240,210,' + (.08 + r() * .16) + ')'; g.fillRect(r() * 160, r() * 160, .6 + r() * 1.4, .6 + r() * 1.2); }
  } else if (kind === 'speck') {   // stone / concrete pits + cracks
    c = mk(128, 128); g = ctx2(c);
    for (let i = 0; i < 520; i++) { const d = r() < .62; g.fillStyle = d ? 'rgba(24,20,18,' + (.12 + r() * .3) + ')' : 'rgba(255,246,226,' + (.1 + r() * .22) + ')'; const s = .5 + r() * 1.8; g.fillRect(r() * 128, r() * 128, s, s * (.6 + r() * .6)); }
    g.strokeStyle = 'rgba(20,16,14,.35)'; g.lineWidth = .8; for (let i = 0; i < 3; i++) { let x = r() * 128, y = r() * 128; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - .5) * 18; y += r() * 12; g.lineTo(x, y); } g.stroke(); }
  } else if (kind === 'streak') {  // vertical drips / rust runs / soot
    c = mk(128, 128); g = ctx2(c); g.lineCap = 'round';
    for (let i = 0; i < 46; i++) { const x = r() * 128, y = r() * 100, l = 10 + r() * 60, rust = r() < .35; g.strokeStyle = rust ? 'rgba(120,52,20,' + (.08 + r() * .16) + ')' : 'rgba(20,16,14,' + (.06 + r() * .12) + ')'; g.lineWidth = .7 + r() * 2.4; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (r() - .5) * 3, y + l * .5, x + (r() - .5) * 2, y + l); g.stroke(); }
  } else if (kind === 'scratch') { // fine scratches catching light
    c = mk(128, 128); g = ctx2(c); g.lineCap = 'round';
    for (let i = 0; i < 70; i++) { const x = r() * 128, y = r() * 128, a = r() * 6.28, l = 3 + r() * 14; g.strokeStyle = r() < .6 ? 'rgba(255,244,220,' + (.1 + r() * .25) + ')' : 'rgba(20,14,12,' + (.12 + r() * .2) + ')'; g.lineWidth = .5 + r() * .7; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l * .4); g.stroke(); }
  } else if (kind === 'weave') {   // cloth
    c = mk(64, 64); g = ctx2(c);
    for (let i = 0; i < 64; i += 2) { g.fillStyle = 'rgba(0,0,0,' + (.05 + r() * .06) + ')'; g.fillRect(0, i, 64, 1); g.fillStyle = 'rgba(255,255,255,' + (.03 + r() * .04) + ')'; g.fillRect(i, 0, 1, 64); }
    for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(0,0,0,' + (.05 + r() * .08) + ')'; g.fillRect(r() * 64, r() * 64, 2 + r() * 5, 1); }
  } else if (kind === 'paper') {   // fibres + foxing
    c = mk(96, 96); g = ctx2(c);
    for (let i = 0; i < 18; i++) { const x = r() * 96, y = r() * 96, rr = 2 + r() * 7, gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(140,96,40,' + (.06 + r() * .12) + ')'); gr.addColorStop(1, 'rgba(140,96,40,0)'); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
    for (let i = 0; i < 140; i++) { g.fillStyle = 'rgba(60,40,20,' + (.05 + r() * .1) + ')'; g.fillRect(r() * 96, r() * 96, .6 + r() * 2.4, .5); }
  }
  _prT[kind] = c; return c;
}
/* texture fill clipped to a screen polygon; frame(g) sets a face frame so the texture follows the surface */
function prTexFill(g, pts, kind, a, frame, comp, off) {
  if (!a) return;
  g.save(); pathPoly(g, pts); g.clip(); if (frame) frame(g); g.globalAlpha = a; if (comp) g.globalCompositeOperation = comp;
  if (off) g.translate(-off[0], -off[1]);
  g.fillStyle = g.createPattern(prTex(kind), 'repeat'); g.fillRect(-700, -700, 2200, 2200); g.restore();
}
/* linear gradient wash clipped to a polygon */
function prShade(g, pts, x0, y0, x1, y1, stops, comp) {
  g.save(); pathPoly(g, pts); g.clip(); if (comp) g.globalCompositeOperation = comp;
  const gr = g.createLinearGradient(x0, y0, x1, y1); for (const s of stops) gr.addColorStop(s[0], css(s[1], s[2]));
  const bb = bbox(pts); g.fillStyle = gr; g.fillRect(bb[0] - 2, bb[1] - 2, bb[2] - bb[0] + 4, bb[3] - bb[1] + 4); g.restore();
}
function prLine(g, a, b, col, al, w) { g.strokeStyle = css(col, al); g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
function prPoly(g, pts, col, a) { g.fillStyle = css(col, a === undefined ? 1 : a); pathPoly(g, pts); g.fill(); }
/* chipped paint along a screen-space edge a->b, revealing an under colour */
function prChips(g, r, a, b, n, under, sz) {
  sz = sz || 2.4;
  for (let i = 0; i < n; i++) {
    const t = r(), x = lerp(a[0], b[0], t) + (r() - .5) * 2, y = lerp(a[1], b[1], t) + (r() - .3) * 2.5, s = sz * (.4 + r());
    g.fillStyle = css(jit(under, r, .1), .85); g.beginPath(); g.moveTo(x - s, y); g.lineTo(x - s * .2, y - s * .6); g.lineTo(x + s, y - s * .1); g.lineTo(x + s * .3, y + s * .7); g.closePath(); g.fill();
    g.fillStyle = css([255, 236, 200], .35); g.fillRect(x - s * .6, y + s * .55, s * 1.1, .7);
  }
}
/* light-emitter registry: all prop lights go through here. Extra fields for the ENV/LIGHT agent:
 *   src = prop type, z = emitter height above the floor (world px), u/v = tile coords when known */
function prLight(S, x, y, rad, col, a, fl, kind, src, z, u, v) {
  const L = { x: x, y: y, r: rad, col: C(col), a: a, fl: fl || 0, ph: S.r() * 6.28, kind: kind || 'lamp', src: src || null, z: z || 0 };
  if (u !== undefined) { L.u = u; L.v = v; }
  S.lights.push(L); return L;
}
function lightAt(S, u, v, z, rad, col, a, fl, kind, src) { const p = gp(S, u, v, z); return prLight(S, p[0], p[1], rad, col, a, fl, kind, src, z, u, v); }

/* iso box with painted faces. right face u=u1, left face v=v1.
 * o: kl,kr,kt (face value), alt, jv, ink, inkw, vert, topAng, dens, sw, nk, mat ('wood'|'metal'|'enamel'|'stone'|'fabric'|'paper'|null),
 *    wear (0..1 edge chips), under (chip colour), ao (0..1), grime (0..1), rim (false to skip orange rim)               */
function fcs(g, S, r, u0, v0, u1, v1, z0, z1, col, o) {
  o = o || {}; col = C(col);
  const A = gp(S, u0, v0, z1), B = gp(S, u1, v0, z1), Cc = gp(S, u1, v1, z1), D = gp(S, u0, v1, z1);
  const A0 = gp(S, u0, v1, z0), B0 = gp(S, u1, v1, z0), C0 = gp(S, u1, v0, z0);
  const cl = mix(mul(col, o.kl || .6), [30, 50, 92], .2), cr = mix(mul(col, o.kr || .92), [255, 156, 80], .11), ct = mix(mul(col, o.kt || 1.12), [255, 214, 160], .1);
  const nk = o.nk || 1, H = z1 - z0, mat = o.mat || null;
  const base = { alt: o.alt, jv: o.jv === undefined ? .12 : o.jv, ink: false, edge: false, wob: o.wob || 0 };
  const va = o.vert ? 1.57 : null, dens = o.dens || 38, sw = o.sw || 3.4;
  const fL = [D, Cc, B0, A0], fR = [Cc, B, C0, B0], fT = [A, B, Cc, D];
  const big = Math.abs(polyArea(fL)) + Math.abs(polyArea(fR));
  if (H > .5) {
    paintPoly(g, fL, cl, r, Object.assign({ ang: va === null ? .46 : va, aj: .12, dens: dens / nk, sw }, base));
    paintPoly(g, fR, cr, r, Object.assign({ ang: va === null ? 2.68 : va, aj: .12, dens: dens / nk, sw }, base));
  }
  paintPoly(g, fT, ct, r, Object.assign({ ang: o.topAng === undefined ? .46 : o.topAng, aj: .15, dens: dens / nk, sw }, base));
  // ---- material textures following each face
  const tex = (pts, frame, kind, a) => prTexFill(g, pts, kind, a, frame, null, [r() * 128, r() * 64]);
  const fLf = (k) => faceL(k, S, u0, v1, z1), fRf = (k) => faceR(k, S, u1, v1, z1), fTf = (k) => faceT(k, S, u0, v0, z1);
  if (mat === 'wood') {
    if (H > 3) { const vg = o.vert ? (k) => { fLf(k); k.rotate(1.5708); } : fLf, vr = o.vert ? (k) => { fRf(k); k.rotate(1.5708); } : fRf; tex(fL, vg, 'grain', .9); tex(fR, vr, 'grain', .8); }
    tex(fT, o.grainV ? (k) => { fTf(k); k.rotate(1.5708); } : fTf, 'grain', .85);
  } else if (mat === 'metal' || mat === 'enamel') {
    if (H > 3) { tex(fL, fLf, 'streak', .8); tex(fR, fRf, 'streak', .7); tex(fR, fRf, 'scratch', .5); }
    tex(fT, fTf, 'scratch', .7);
  } else if (mat === 'stone') { if (H > 3) { tex(fL, fLf, 'speck', .8); tex(fR, fRf, 'speck', .7); } tex(fT, fTf, 'speck', .7); }
  else if (mat === 'fabric') { if (H > 3) { tex(fL, fLf, 'weave', .9); tex(fR, fRf, 'weave', .8); } tex(fT, fTf, 'weave', .9); }
  else if (mat === 'paper') { tex(fT, fTf, 'paper', .8); }
  const gri = o.grime === undefined ? (big > 700 ? .45 : 0) : o.grime;
  if (gri > 0) { if (H > 3) { tex(fL, fLf, 'grime', gri); tex(fR, fRf, 'grime', gri * .8); } tex(fT, fTf, 'grime', gri * .7); }
  // ---- light: AO toward the base of vertical faces, warm key on the right face, top falloff
  if (H > 3) {
    const ao = o.ao === undefined ? 1 : o.ao, mL = [(D[0] + Cc[0]) / 2, (D[1] + Cc[1]) / 2], mR = [(Cc[0] + B[0]) / 2, (Cc[1] + B[1]) / 2];
    prShade(g, fL, mL[0], mL[1], mL[0], mL[1] + H, [[0, [255, 220, 180], .06], [.45, PR_AO, 0], [1, PR_AO, .34 * ao]]);
    prShade(g, fR, mR[0], mR[1], mR[0], mR[1] + H, [[0, [255, 196, 130], .16], [.4, [255, 196, 130], 0], [.8, PR_AO, .1 * ao], [1, PR_AO, .3 * ao]]);
    prShade(g, fR, Cc[0], Cc[1], B[0], B[1], [[0, [255, 210, 150], .07], [1, [30, 40, 70], .08]]);
  }
  prShade(g, fT, A[0], A[1], Cc[0], Cc[1], [[0, [20, 24, 44], .14], [.6, [255, 220, 170], 0], [1, [255, 226, 180], .12]]);
  // ---- worn edges
  if (o.wear) {
    const un = o.under ? C(o.under) : mul(col, .45), n = Math.round(o.wear * 10 * Math.max(1, (u1 - u0 + v1 - v0)));
    prChips(g, r, D, Cc, n, un); prChips(g, r, Cc, B, n, un); if (H > 8) prChips(g, r, Cc, B0, Math.round(n * .6), un, 2);
  }
  // highlights on the lit edges
  if (o.rim !== false) {
    prLine(g, Cc, B, [255, 176, 92], .55, 1.6); prLine(g, D, Cc, [255, 232, 196], .28, 1.1);
    if (H > 3) prLine(g, [Cc[0] + .7, Cc[1] + 1], [B0[0] + .7, B0[1] - 1], [255, 200, 130], .4, 1.2);
  }
  // ---- ink: thin inner edges, firmer silhouette
  if (o.ink !== false) {
    const iw = o.inkw || 1.5;
    if (H > .5) { ink(g, [Cc, B0], r, iw * .55, null, .5, false); }
    ink(g, [D, Cc, B], r, iw * .6, null, .55, false);
    ink(g, H > .5 ? [A, B, C0, B0, A0, D] : [A, B, Cc, D], r, iw, null, .82);
  }
}
function ecx(rad) { return rad * 45.25; } function ecy(rad) { return rad * 22.6; }
/* painted cylinder (vertical axis). o: sw, dens, alt, ink, top(false), topCol, mat, spec */
function cylBody(g, S, r, cu, cv, rad, z0, z1, col, o) {
  o = o || {}; col = C(col);
  const c0 = gp(S, cu, cv, z0), c1 = gp(S, cu, cv, z1), rx = ecx(rad), ry = ecy(rad), N = Math.max(6, Math.min(14, Math.round(rx / 2.5)));
  const pts = [[c1[0] - rx, c1[1]]];
  for (let i = 0; i <= N; i++) { const a = Math.PI - i / N * Math.PI; pts.push([c0[0] + Math.cos(a) * rx, c0[1] + Math.sin(a) * ry]); }
  pts.push([c1[0] + rx, c1[1]]);
  for (let i = 1; i < N; i++) { const a = i / N * Math.PI; pts.push([c1[0] + Math.cos(a) * rx, c1[1] + Math.sin(a) * ry]); }
  const H = z1 - z0;
  if (H > .3) {
    paintPoly(g, pts, col, r, { ang: 1.57, aj: .08, sw: o.sw || Math.max(1.2, Math.min(3, rx / 3)), dens: o.dens || 30, alt: o.alt, ink: false, edge: false });
    if (o.mat === 'wood') prTexFill(g, pts, 'grain', .7, (k) => { k.translate(c1[0], c1[1]); k.rotate(1.5708); k.scale(1, .6); }, null, [r() * 100, 0]);
    else if (o.mat === 'metal') prTexFill(g, pts, 'streak', .7, (k) => { k.translate(c1[0] - rx, c1[1]); k.scale(rx / 40, 1); });
    // horizontal volume: cool core shadow left, warm key + specular right of centre, reflected rim
    const sp = o.spec === undefined ? .35 : o.spec;
    prShade(g, pts, c0[0] - rx, 0, c0[0] + rx, 0, [[0, mix(mul(col, .35), [20, 34, 70], .4), .75], [.22, mul(col, .6), .35], [.52, col, 0], [.66, mix(col, [255, 236, 200], .5), sp], [.76, col, 0], [.9, mul(col, .55), .3], [1, [255, 170, 90], .45]]);
    if (H > 6) prShade(g, pts, 0, c0[1] - Math.min(H, 30), 0, c0[1] + ry, [[0, PR_AO, 0], [1, PR_AO, .38]]);
  }
  let top = null;
  if (o.top !== false) {
    top = ellPts(c1[0], c1[1], rx, ry, 18, 0, r, .015);
    paintPoly(g, top, o.topCol || mul(col, 1.15), r, { ang: .3, aj: .5, sw: Math.max(1, Math.min(3, rx / 4)), n: Math.max(4, Math.min(24, rx)), ink: false, edge: false, alt: o.alt });
    prShade(g, top, c1[0] - rx, c1[1] - ry, c1[0] + rx, c1[1] + ry, [[0, [20, 26, 50], .18], [1, [255, 226, 180], .16]]);
    g.strokeStyle = css([255, 228, 190], .35); g.lineWidth = 1; g.beginPath(); g.ellipse(c1[0], c1[1], rx - .6, ry - .4, 0, .2, Math.PI * .55); g.stroke();
  }
  if (o.ink !== false) { ink(g, pts, r, o.inkw || (rx > 8 ? 1.4 : 1), null, .8); if (top && rx > 5) { g.strokeStyle = css(INK, .45); g.lineWidth = .8; g.beginPath(); g.ellipse(c1[0], c1[1], rx, ry, 0, Math.PI, Math.PI * 2); g.stroke(); } }
  return { cx: c1[0], cy: c1[1], rx, ry };
}
function vbar(g, S, r, u, v, z0, z1, wpx, col, o) {   // thin vertical post at floor point, rounded shading
  const a = gp(S, u, v, z0), b = gp(S, u, v, z1); col = C(col);
  const pts = [[a[0] - wpx / 2, b[1]], [a[0] + wpx / 2, b[1]], [a[0] + wpx / 2, a[1]], [a[0] - wpx / 2, a[1]]];
  paintPoly(g, pts, col, r, Object.assign({ ang: 1.57, sw: Math.max(1.2, wpx / 2), n: Math.max(3, Math.round((a[1] - b[1]) / 10)), ew: .8, ink: false, edge: false }, o || {}, { ink: false, lit: null }));
  prShade(g, pts, a[0] - wpx / 2, 0, a[0] + wpx / 2, 0, [[0, [16, 22, 44], .5], [.45, col, 0], [.7, [255, 220, 170], .28], [1, [255, 160, 80], .35]]);
  if (z1 - z0 > 20) prShade(g, pts, 0, a[1] - 16, 0, a[1], [[0, PR_AO, 0], [1, PR_AO, .35]]);
  if (!o || o.ink !== false) ink(g, pts, r, (o && o.inkw) || 1.1, null, .75);
}
function contactShadow(g, S, u0, v0, u1, v1, k) {
  k = k || 1; g.save();
  for (let i = 0; i < 3; i++) {   // soft penumbra, pushed away from the key light (kept tight + faint: sprite alpha feeds the hover ring)
    const e = .03 + i * .06, a = (i === 0 ? .16 : .07) * k;
    const pts = [gp(S, u0 - e - .04, v0 - e + .06, 0), gp(S, u1 + e - .04, v0 - e + .06, 0), gp(S, u1 + e - .04, v1 + e + .12, 0), gp(S, u0 - e - .04, v1 + e + .12, 0)];
    pts.forEach(p => { p[0] -= 1.5 + i * 1.2; p[1] += .5 + i * .3; });
    g.fillStyle = css([8, 4, 14], a); pathPoly(g, pts); g.fill();
  }
  // tight occlusion line hugging the footprint
  const q = [gp(S, u0, v1, 0), gp(S, u1, v1, 0), gp(S, u1, v0, 0)];
  g.strokeStyle = css([6, 3, 10], .3 * k); g.lineWidth = 3; g.lineJoin = 'round'; g.beginPath(); g.moveTo(q[0][0] - 1, q[0][1] + 1); g.lineTo(q[1][0], q[1][1] + 1.5); g.lineTo(q[2][0] + 1, q[2][1] + 1); g.stroke();
  g.restore();
}
function rimStroke(g, pts, col, a, w) { g.strokeStyle = css(col || [255, 170, 80], a); g.lineWidth = w || 1.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.stroke(); }
function handText(g, text, cx, cy, size, col, r, maxW, o) {
  o = o || {}; text = String(text); g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
  const font = (s) => (o.font === undefined ? 'bold' : o.font) + ' ' + s + 'px ' + (o.family || 'Impact, "Arial Narrow", "Arial Black", "Liberation Sans", "Helvetica Neue", sans-serif');
  g.font = font(size); let tw = 0; const ws = []; for (const ch of text) { const w = g.measureText(ch).width + size * .06; ws.push(w); tw += w; }
  if (maxW && tw > maxW) { size *= maxW / tw; g.font = font(size); tw = 0; ws.length = 0; for (const ch of text) { const w = g.measureText(ch).width + size * .06; ws.push(w); tw += w; } }
  let x = cx - tw / 2; let i = 0;
  for (const ch of text) {
    const w = ws[i++]; if (ch !== ' ') {
      g.save(); g.translate(x + w / 2, cy + (r() - .5) * size * .1); g.rotate((r() - .5) * .14); g.scale(1, .95 + r() * .12);
      if (o.shadow !== false && !(Array.isArray(o.shadow) && o.shadow[3] === 0)) { g.fillStyle = css(o.shadow || [10, 6, 10], .5); g.fillText(ch, 1.2, 1.4); }
      g.fillStyle = css(jit(C(col), r, .1), o.alpha || .92); g.fillText(ch, 0, 0);
      if (o.drip && r() < .25) { g.fillRect(-size * .1, size * .3, 1.5, r() * size * .5); }
      g.restore();
    } x += w;
  }
  g.restore();
}
/* condensed printed block lettering (posters, stencils, plates) */
function prBlock(g, text, cx, cy, size, col, maxW, o) {
  o = o || {}; text = String(text); g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = (o.weight || '900') + ' ' + size + 'px ' + (o.family || 'Impact, "Arial Narrow", "Inter", "Arial Black", "Liberation Sans", sans-serif');
  const cond = o.cond || .78, tw = g.measureText(text).width * cond, k = maxW && tw > maxW ? maxW / tw : 1;
  g.translate(cx, cy); if (o.rot) g.rotate(o.rot); g.scale(cond * k, 1);
  if (o.outline) { g.lineJoin = 'round'; g.strokeStyle = css(o.outline, o.oa || .9); g.lineWidth = o.ow || size * .16; g.strokeText(text, 0, 0); }
  g.fillStyle = css(C(col), o.alpha || 1); g.fillText(text, 0, 0);
  if (o.stencil) { g.fillStyle = css(o.stencil); for (let i = -6; i <= 6; i++) g.fillRect(i * size * .5 - .5, -size * .05, size * .06, size * .1); }
  g.restore();
}
function scribbleLines(g, r, x, y, w, n, lh, col, a) {
  g.strokeStyle = css(col, a || .6); g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    let xx = x, yy = y + i * lh; const end = x + w * r.r(.5, 1); g.lineWidth = 1.1; g.beginPath(); g.moveTo(xx, yy);
    while (xx < end) { xx += r.r(1.5, 4); g.lineTo(xx, yy + r.r(-1.5, 1.5)); if (r() < .15) { xx += r.r(2, 5); g.moveTo(xx, yy); } }
    g.stroke();
  }
}
function prTypeLines(g, r, x, y, w, n, lh, col, a) {   // typed / printed text lines (straighter than scribbles)
  g.fillStyle = css(col, a || .55);
  for (let i = 0; i < n; i++) { let xx = x; const end = x + w * (i === n - 1 ? r.r(.3, .7) : r.r(.85, 1)); while (xx < end) { const wl = r.r(2, 7) * (lh / 4); g.fillRect(xx, y + i * lh, Math.min(wl, end - xx), Math.max(.6, lh * .32)); xx += wl + lh * .45; } }
}

/* ---- offscreen pictures: painted at the VISUAL aspect of the current frame, then mapped into (x,y,w,h).
 *      Keeps posters / portraits correctly proportioned on skewed walls. Painter gets (ctx, W, 200). */
const _prPics = new Map();
function prPic(g, x, y, w, h, key, paint, res) {
  const m = g.getTransform(), sx = Math.hypot(m.a, m.b), sy = Math.hypot(m.c, m.d);
  const vw = Math.abs(w) * sx, vh = Math.abs(h) * sy, k = res || 1.15;
  const cw = Math.max(6, Math.min(900, Math.round(vw * k))), ch = Math.max(6, Math.min(900, Math.round(vh * k)));
  const kk = key ? key + '|' + cw + 'x' + ch : null;
  let c = kk ? _prPics.get(kk) : null;
  if (!c) {
    c = mk(cw, ch); const cg = ctx2(c), s = ch / 200; cg.scale(s, s);
    try { paint(cg, 200 * cw / ch, 200); } catch (e) { if (typeof console !== 'undefined') console.warn('prPic', key, e); }
    if (kk) { _prPics.set(kk, c); if (_prPics.size > 140) _prPics.delete(_prPics.keys().next().value); }
  }
  g.drawImage(c, x, y, w, h); return c;
}

/* ---- the Union's propaganda vocabulary ---- */
const UN = { red: [176, 36, 34], deep: [112, 20, 24], cream: [230, 216, 180], ink: [30, 24, 26], ochre: [212, 152, 54], teal: [60, 94, 90], olive: [82, 92, 62], grey: [128, 124, 112], blue: [44, 66, 96] };
function prBellGlyph(g, cx, cy, s, col, a) {   // the Union bell emblem (s = height)
  g.fillStyle = css(C(col), a === undefined ? 1 : a); g.beginPath();
  g.moveTo(cx - s * .1, cy - s * .4);
  g.bezierCurveTo(cx - s * .34, cy - s * .38, cx - s * .32, cy + s * .02, cx - s * .36, cy + s * .2);
  g.quadraticCurveTo(cx - s * .4, cy + s * .3, cx - s * .5, cy + s * .33);
  g.lineTo(cx + s * .5, cy + s * .33);
  g.quadraticCurveTo(cx + s * .4, cy + s * .3, cx + s * .36, cy + s * .2);
  g.bezierCurveTo(cx + s * .32, cy + s * .02, cx + s * .34, cy - s * .38, cx + s * .1, cy - s * .4);
  g.closePath(); g.fill();
  g.beginPath(); g.arc(cx, cy - s * .44, s * .075, 0, 7); g.fill();
  g.beginPath(); g.arc(cx, cy + s * .42, s * .085, 0, 7); g.fill();
}
function prRays(g, cx, cy, R, n, col, a, a0, a1) {
  g.fillStyle = css(C(col), a); a0 = a0 === undefined ? 0 : a0; a1 = a1 === undefined ? Math.PI * 2 : a1;
  for (let i = 0; i < n; i++) { const t0 = lerp(a0, a1, i / n), t1 = t0 + (a1 - a0) / n * .5; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(t0) * R, cy + Math.sin(t0) * R); g.lineTo(cx + Math.cos(t1) * R, cy + Math.sin(t1) * R); g.closePath(); g.fill(); }
}
function prAge(g, W, H, r, k, noCrease) {   // yellowed varnish, grime, creases, edge wear on a picture
  k = k === undefined ? 1 : k;
  g.save();
  g.globalAlpha = .55 * k; g.fillStyle = g.createPattern(prTex('paper'), 'repeat'); g.fillRect(0, 0, W, H);
  g.globalAlpha = .7 * k; g.fillStyle = g.createPattern(prTex('grime'), 'repeat'); g.fillRect(0, 0, W, H);
  g.globalAlpha = 1;
  const gr = g.createRadialGradient(W * .5, H * .45, Math.min(W, H) * .2, W * .5, H * .5, Math.max(W, H) * .75); gr.addColorStop(0, 'rgba(255,230,170,0)'); gr.addColorStop(1, 'rgba(70,46,20,' + (.38 * k) + ')'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'multiply'; g.fillStyle = css([236, 214, 170], .35 * k); g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
  if (!noCrease) for (let i = 0; i < 2 * k; i++) { const vert = r() < .5, p = (vert ? W : H) * r.r(.3, .7); g.strokeStyle = 'rgba(20,12,8,.22)'; g.lineWidth = 1.2; g.beginPath(); if (vert) { g.moveTo(p, 0); g.lineTo(p + r.r(-3, 3), H); } else { g.moveTo(0, p); g.lineTo(W, p + r.r(-3, 3)); } g.stroke(); g.strokeStyle = 'rgba(255,240,210,.18)'; g.beginPath(); if (vert) { g.moveTo(p + 1.4, 0); g.lineTo(p + 1.4, H); } else { g.moveTo(0, p + 1.4); g.lineTo(W, p + 1.4); } g.stroke(); }
  g.restore();
}
const UN_SLOGANS = ['ONE BELL ONE UNION', 'DISCIPLINE IS HARMONY', 'THE WARDEN HEARS', 'LISTEN. LEARN. OBEY.', 'ORDER IS HARMONY', 'REST IS EARNED', 'SILENCE IS STRENGTH', 'REPORT IDLE TALK', 'THE BELL KEEPS US', 'STUDY FOR THE UNION'];
/* a full propaganda poster in design space W x H. kind: 'bell'|'march'|'ear'|'warden'|'text'|'pupil'|'wanted'|'notice' */
function prPoster(g, W, H, r, kind, o) {
  o = o || {};
  const red = UN.red, cream = UN.cream, inkc = UN.ink, och = UN.ochre;
  const bgc = o.bg || (kind === 'ear' || kind === 'wanted' || kind === 'notice' ? cream : kind === 'march' ? och : kind === 'text' ? (r() < .5 ? red : cream) : red);
  const dark = lum(bgc) < 120, fg = dark ? cream : inkc, acc = dark ? och : red;
  g.fillStyle = css(bgc); g.fillRect(0, 0, W, H);
  for (let i = 0; i < 22; i++) bristle(g, r() * W, r() * H, r.g() * .3, W * .5, 10, jit(bgc, r, .08), .25, r);
  const sl = o.text || r.p(UN_SLOGANS), words = sl.split(' ');
  const two = words.length > 2 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [sl];
  if (kind === 'bell') {
    prRays(g, W * .5, H * .42, H, 18, dark ? och : red, .28);
    g.fillStyle = css(inkc, .18); g.beginPath(); g.arc(W * .5, H * .42, H * .26, 0, 7); g.fill();
    prBellGlyph(g, W * .5, H * .4, H * .44, dark ? cream : inkc);
    prBellGlyph(g, W * .5 + 2, H * .4 + 1, H * .44, inkc, .25);
    prBellGlyph(g, W * .5, H * .4, H * .44, dark ? cream : inkc);
    g.fillStyle = css(acc); g.fillRect(0, H * .72, W, H * .28);
    two.forEach((t, i) => prBlock(g, t, W / 2, H * (.8 + i * .11), H * .1, dark ? cream : cream, W * .9));
  } else if (kind === 'march') {   // students marching up a diagonal under a banner
    g.fillStyle = css(red); g.beginPath(); g.moveTo(0, H); g.lineTo(0, H * .55); g.lineTo(W, H * .2); g.lineTo(W, H); g.fill();
    prRays(g, W * .85, H * .1, H * 1.2, 14, cream, .14, 1.6, 3.4);
    for (let i = 0; i < 6; i++) {
      const t = i / 5, x = lerp(W * .12, W * .86, t), y = lerp(H * .72, H * .4, t), s = H * (.36 - t * .1);
      g.fillStyle = css(inkc, .92); g.beginPath(); g.arc(x, y - s * .78, s * .09, 0, 7); g.fill();
      g.beginPath(); g.moveTo(x - s * .12, y - s * .66); g.lineTo(x + s * .12, y - s * .66); g.lineTo(x + s * .15, y - s * .2); g.lineTo(x + s * .22, y + s * .12); g.lineTo(x + s * .1, y + s * .14); g.lineTo(x, y - s * .12); g.lineTo(x - s * .12, y + s * .16); g.lineTo(x - s * .22, y + s * .12); g.lineTo(x - s * .14, y - s * .2); g.closePath(); g.fill();
      if (i === 5) { g.strokeStyle = css(inkc); g.lineWidth = 2.4; g.beginPath(); g.moveTo(x + s * .1, y - s * .55); g.lineTo(x + s * .28, y - s * 1.3); g.stroke(); g.fillStyle = css(red); g.beginPath(); g.moveTo(x + s * .28, y - s * 1.3); g.lineTo(x + s * .62, y - s * 1.2); g.lineTo(x + s * .3, y - s * 1.02); g.fill(); }
    }
    prBlock(g, two[0], W * .5, H * .1, H * .11, inkc, W * .9);
    if (two[1]) prBlock(g, two[1], W * .5, H * .9, H * .1, cream, W * .9);
  } else if (kind === 'ear') {     // the stylised ear: THE WARDEN HEARS
    g.fillStyle = css(red); g.fillRect(0, 0, W, H * .62);
    prRays(g, W * .5, H * .32, H, 22, inkc, .16);
    g.strokeStyle = css(cream); g.lineCap = 'round'; g.lineWidth = H * .06; g.beginPath(); g.arc(W * .5, H * .3, H * .17, Math.PI * .9, Math.PI * 2.3); g.stroke();
    g.lineWidth = H * .045; g.beginPath(); g.arc(W * .52, H * .31, H * .08, Math.PI * .8, Math.PI * 2.1); g.stroke();
    g.beginPath(); g.moveTo(W * .5 + H * .16, H * .38); g.quadraticCurveTo(W * .52, H * .52, W * .44, H * .47); g.stroke();
    for (let k = 1; k < 4; k++) { g.strokeStyle = css(cream, .7 - k * .15); g.lineWidth = H * .02; g.beginPath(); g.arc(W * .5, H * .3, H * (.17 + k * .08), -1, .4); g.stroke(); }
    prBlock(g, 'THE WARDEN', W * .5, H * .73, H * .12, red, W * .9);
    prBlock(g, 'HEARS', W * .5, H * .88, H * .16, inkc, W * .9);
  } else if (kind === 'warden') {  // small bust of the Warden over rays
    prRays(g, W * .5, H * .5, H, 20, och, .3);
    g.save(); g.beginPath(); g.rect(0, 0, W, H * .78); g.clip(); wardenBust(g, W * .1, H * .02, W * .8, H * .8, r, false, true); g.restore();
    g.fillStyle = css(cream); g.fillRect(0, H * .76, W, H * .24);
    prBlock(g, two[0], W / 2, H * .83, H * .09, red, W * .9); if (two[1]) prBlock(g, two[1], W / 2, H * .93, H * .08, inkc, W * .9);
  } else if (kind === 'pupil') {   // the good student: profile with book and armband
    prRays(g, W * .1, H * .2, H * 1.3, 12, cream, .16, -.2, 1.6);
    g.fillStyle = css(inkc); g.beginPath(); g.moveTo(W * .3, H); g.lineTo(W * .34, H * .62); g.quadraticCurveTo(W * .36, H * .5, W * .5, H * .48); g.lineTo(W * .52, H * .36);
    g.quadraticCurveTo(W * .46, H * .3, W * .5, H * .2); g.quadraticCurveTo(W * .6, H * .1, W * .7, H * .2); g.quadraticCurveTo(W * .74, H * .26, W * .72, H * .3); g.lineTo(W * .76, H * .34); g.lineTo(W * .72, H * .36); g.quadraticCurveTo(W * .72, H * .44, W * .64, H * .44); g.lineTo(W * .64, H * .5); g.quadraticCurveTo(W * .8, H * .54, W * .82, H); g.fill();
    g.fillStyle = css(cream); g.fillRect(W * .62, H * .56, W * .2, H * .2); g.fillStyle = css(och); g.fillRect(W * .36, H * .66, W * .14, H * .05);
    prBlock(g, two[0], W / 2, H * .88, H * .09, cream, W * .92); if (two[1]) prBlock(g, two[1], W / 2, H * .96, H * .07, och, W * .9);
  } else if (kind === 'wanted') {
    g.strokeStyle = css(inkc, .85); g.lineWidth = 2; g.strokeRect(W * .06, H * .05, W * .88, H * .9);
    prBlock(g, 'REPORT', W / 2, H * .14, H * .11, red, W * .8);
    g.fillStyle = css([190, 176, 150]); g.fillRect(W * .25, H * .24, W * .5, H * .38);
    g.fillStyle = css(inkc, .85); g.beginPath(); g.arc(W * .5, H * .38, W * .1, 0, 7); g.fill(); g.beginPath(); g.ellipse(W * .5, H * .62, W * .2, H * .1, 0, Math.PI, 0); g.fill();
    prTypeLines(g, r, W * .14, H * .7, W * .72, 5, H * .045, inkc, .7);
  } else if (kind === 'notice') {
    prBlock(g, 'NOTICE', W / 2, H * .1, H * .09, red, W * .8);
    g.fillStyle = css(red); g.fillRect(W * .1, H * .17, W * .8, 2);
    prTypeLines(g, r, W * .12, H * .24, W * .76, 12, H * .05, inkc, .6);
    prBellGlyph(g, W * .78, H * .86, H * .12, red, .8);
  } else {                         // 'text': huge slogan, diagonal band
    g.save(); g.translate(W / 2, H / 2); g.rotate(-.14); g.fillStyle = css(dark ? inkc : red); g.fillRect(-W, -H * .14, W * 2, H * .3); g.restore();
    prBlock(g, two[0], W / 2, H * .3, H * .15, fg, W * .9, { rot: -.14 });
    if (two[1]) prBlock(g, two[1], W / 2, H * .5, H * .14, dark ? cream : cream, W * .9, { rot: -.14 });
    prBellGlyph(g, W * .5, H * .8, H * .18, acc);
  }
  if (o.age !== false) prAge(g, W, H, r, o.age || 1);
}

/* ===================================================== WALL-MOUNTED PROPS */
const WALLPROPS = {};
function wallLen(p) { return (p.side === 'l' ? (p.h || 1) : (p.w || 1)); }
function wallStart(p) { return (p.side === 'l' ? (p.y || 0) : (p.x || 0)); }
function wallShadow(g, u0, u1, v0, v1, a) {   // soft cast shadow of a wall object (down-left of the object)
  g.save(); for (let i = 0; i < 3; i++) { g.fillStyle = css([6, 4, 16], (a || .35) * (i ? .35 : .6)); const e = i * 2.5; g.fillRect(u0 - 4 - e, v0 + 4 - e * .2, u1 - u0 + 4 + e * 2, v1 - v0 + 3 + e); } g.restore();
}
function bakeWallProp(g, S, p) {
  const f = WALLPROPS[p.t]; if (!f) return false;
  const r = RNG(S.seed + hashStr(p.t + p.x + ',' + p.y + p.side)), u0 = wallStart(p) * 64, len = wallLen(p) * 64;
  g.save(); wallFrame(g, S, p.side);
  // the left wall's frame runs right-to-left on screen: mirror locally so lettering and pictures read correctly
  if (p.side === 'l') { g.translate(u0 * 2 + len, 0); g.scale(-1, 1); }
  try { f(g, S, p, { r, u0, len, u1: u0 + len, v: (p.v | 0) % 4, side: p.side, Y: (z) => WALLH - z, uc: u0 + len / 2, mir: p.side === 'l' }); } catch (e) { if (typeof console !== 'undefined') console.warn('Art wall prop failed', p.t, e); }
  g.restore();
  return true;
}
function wallFootprintPoly(S, p, z0, z1) {   // screen-space parallelogram of a wall prop (for hover outline)
  const u0 = wallStart(p), u1 = u0 + wallLen(p);
  if (p.side === 'l') return [gp(S, 0, u0, z1), gp(S, 0, u1, z1), gp(S, 0, u1, z0), gp(S, 0, u0, z0)];
  return [gp(S, u0, 0, z1), gp(S, u1, 0, z1), gp(S, u1, 0, z0), gp(S, u0, 0, z0)];
}
const WALLH_TABLE = { door: 112, window: 130, lockers: 96, bookshelf: 116, vault: 84, portrait: 150, banner: 130, notice: 118, pipes: 135, pennant: 138, loudspeaker: 112, curtain: 148, radiator: 60, fence: 120, ladder: 150, chalkboard: 115, mirror: 122 };
/* wall point (local u px, height z) -> world px, for lights pushed from wall props */
function wallPt(S, p, ul, z) { const t = ul / 64; return p.side === 'l' ? gp(S, 0, t, z) : gp(S, t, 0, z); }
function wallLight(S, p, I, ul, z, rad, col, a, fl, kind) {   // ul in the (possibly mirrored) local frame
  const real = I.mir ? I.u0 * 2 + I.len - ul : ul, q = wallPt(S, p, real, z);
  return prLight(S, q[0], q[1], rad, col, a, fl, kind, p.t, z, p.side === 'l' ? 0 : real / 64, p.side === 'l' ? real / 64 : 0);
}
/* local-frame painted plank / panel helpers */
function prPlanks(g, r, x, y, w, h, col, pw, o) {   // vertical boards
  o = o || {}; col = C(col);
  for (let xx = x; xx < x + w - .5; xx += pw) {
    const bw = Math.min(pw, x + w - xx), c = jit(col, r, .1);
    paintRect(g, xx, y + (o.ragged ? r() * 4 : 0), bw - .6, h - (o.ragged ? r() * 4 : 0), c, r, { n: Math.max(4, h / 7), sw: Math.min(4, bw / 3), ang: 1.57, aj: .05, ink: false, edge: false, alt: o.alt });
    g.fillStyle = css([18, 10, 6], .55); g.fillRect(xx + bw - 1.2, y, 1.2, h); g.fillStyle = css([255, 226, 180], .14); g.fillRect(xx, y, 1, h);
  }
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.rotate(1.5708); g.globalAlpha = .9; g.fillStyle = g.createPattern(prTex('grain'), 'repeat'); g.fillRect(y - 10, -x - w - 10, h + 20, w + 20); g.restore();
}
function prBevel(g, x, y, w, h, hi, lo, wd) {   // raised panel edge light
  wd = wd || 1.6; g.lineCap = 'butt';
  g.strokeStyle = css(hi || [255, 232, 190], .38); g.lineWidth = wd; g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y); g.lineTo(x + w, y); g.stroke();
  g.strokeStyle = css(lo || [10, 6, 12], .5); g.beginPath(); g.moveTo(x + w, y); g.lineTo(x + w, y + h); g.lineTo(x, y + h); g.stroke();
}
function prScrew(g, x, y, s) { s = s || 1.8; g.fillStyle = css([40, 38, 36]); g.beginPath(); g.arc(x, y, s, 0, 7); g.fill(); g.fillStyle = css([220, 210, 180], .6); g.beginPath(); g.arc(x - s * .3, y - s * .3, s * .45, 0, 7); g.fill(); }
function prPlate(g, r, x, y, w, h, text, col, tc) {   // small enamel plate with lettering
  paintRect(g, x, y, w, h, col || [236, 228, 204], r, { n: 4, sw: 2, ink: true, inkw: 1, ang: 0, ew: .8 });
  g.strokeStyle = css(tc || [30, 40, 70], .7); g.lineWidth = .8; g.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
  if (text) prBlock(g, text, x + w / 2, y + h / 2 + .5, h * .62, tc || [30, 40, 70], w - 5);
  prChips(g, r, [x, y + h], [x + w, y + h], 2, [30, 30, 34], 1.2);
}
function prPinnedPaper(g, r, x, y, w, h, rot, o) {   // a pinned / taped sheet in local wall coords
  o = o || {}; g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(rot || 0);
  g.fillStyle = css([6, 4, 12], .3); g.fillRect(-w / 2 + 1.5, -h / 2 + 2, w, h);
  const pc = o.col || jit(r() < .5 ? [228, 220, 192] : [214, 200, 160], r, .05);
  paintRect(g, -w / 2, -h / 2, w, h, pc, r, { n: 4, sw: 2, ink: true, inkw: .9, ang: 0, edge: false });
  if (o.kind === 'type') prTypeLines(g, r, -w / 2 + 3, -h / 2 + 7, w - 6, Math.max(1, Math.floor((h - 10) / 3.6)), 3.6, [40, 34, 34], .55);
  else scribbleLines(g, r, -w / 2 + 3, -h / 2 + 6, w - 6, Math.max(1, Math.floor((h - 8) / 4)), 4, [40, 34, 34], .5);
  if (o.head) { g.fillStyle = css(o.head, .85); g.fillRect(-w / 2 + 2.5, -h / 2 + 2, w * .6, 2.6); }
  if (o.stamp) { g.strokeStyle = css([170, 30, 30], .75); g.lineWidth = 1.2; g.beginPath(); g.arc(w * .2, h * .22, Math.min(w, h) * .16, 0, 7); g.stroke(); }
  g.fillStyle = css([20, 10, 6], .18); g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 - 5, h / 2); g.lineTo(w / 2, h / 2 - 5); g.fill();
  if (o.tape) { g.fillStyle = css([230, 220, 170], .55); g.fillRect(-4, -h / 2 - 2, 8, 4); } else { g.fillStyle = css(o.pin || [190, 40, 40]); g.beginPath(); g.arc(0, -h / 2 + 2.5, 1.8, 0, 7); g.fill(); g.fillStyle = css([255, 220, 210], .6); g.fillRect(-.8, -h / 2 + 1.4, .8, .8); }
  g.restore();
}

/* ---- doors ---- */
function prDoorName(label) {
  if (!label) return null; const m = String(label).match(/(?:to|into)\s+(?:the\s+)?(.+)$/i); let s = (m ? m[1] : String(label).replace(/^door\s*/i, '')).toUpperCase().replace(/[^A-Z0-9 .'-]/g, '').trim();
  if (!s || s.length > 18) s = s ? s.split(' ').slice(0, 2).join(' ') : null; return s;
}
WALLPROPS.door = function (g, S, p, I) {
  const { r, u0, len, Y, v } = I, dw = Math.min(len - 18, v === 2 ? 118 : 76), cx = u0 + len / 2, x0 = cx - dw / 2, x1 = cx + dw / 2, top = Y(98), bot = Y(0), dh = bot - top;
  wallShadow(g, x0 - 10, x1 + 10, top - 12, bot - 2, .3);
  // architrave: painted moulding with chipped paint
  const trim = v === 1 ? [78, 84, 86] : v === 2 ? [96, 70, 48] : [62, 92, 74];
  paintRect(g, x0 - 9, top - 9, dw + 18, dh + 9, mul(trim, .9), r, { n: 26, sw: 3, ink: true, inkw: 1.6, ang: 1.57, edge: false, alt: mul(trim, 1.3) });
  prBevel(g, x0 - 9, top - 9, dw + 18, dh + 9); prBevel(g, x0 - 3, top - 3, dw + 6, dh + 3, [10, 6, 12], [255, 230, 190], 1.2);
  g.fillStyle = css([12, 8, 10], .9); g.fillRect(x0 - 2, top - 2, dw + 4, dh + 2);   // rebate shadow
  prChips(g, r, [x0 - 9, top - 9], [x0 - 9, bot], 6, [190, 176, 150]); prChips(g, r, [x1 + 9, top - 9], [x1 + 9, bot], 4, [190, 176, 150]);
  if (v === 2) {   // canteen swing doors: two leaves with porthole windows and brass kick plates
    for (let k = 0; k < 2; k++) {
      const lx = x0 + k * dw / 2 + (k ? 1 : 0), lw = dw / 2 - 1, wood = [128, 84, 52];
      prPlanks(g, r, lx, top, lw, dh, wood, lw / 3, { alt: [176, 120, 70] });
      g.fillStyle = css([20, 10, 6], .25); g.fillRect(lx, top, lw, dh);
      paintRect(g, lx + 5, top + 5, lw - 10, dh * .38, mul(wood, .9), r, { n: 8, ink: true, inkw: 1, ang: 1.57, edge: false }); prBevel(g, lx + 5, top + 5, lw - 10, dh * .38);
      const pcx = lx + lw / 2, pcy = top + 26; g.save(); g.beginPath(); g.ellipse(pcx, pcy, 15, 13, 0, 0, 7); g.clip();
      const gl = g.createLinearGradient(0, pcy - 13, 0, pcy + 13); gl.addColorStop(0, 'rgb(255,214,140)'); gl.addColorStop(1, 'rgb(190,110,50)'); g.fillStyle = gl; g.fillRect(pcx - 16, pcy - 14, 32, 28);
      g.fillStyle = css([60, 30, 20], .5); g.fillRect(pcx - 16, pcy + 2, 32, 12); g.fillStyle = css([255, 255, 230], .4); g.fillRect(pcx - 9, pcy - 10, 3, 16); g.restore();
      g.strokeStyle = css([190, 150, 70]); g.lineWidth = 3; g.beginPath(); g.ellipse(pcx, pcy, 15, 13, 0, 0, 7); g.stroke(); g.strokeStyle = css(INK, .8); g.lineWidth = 1; g.stroke();
      const kp = bot - 18; paintRect(g, lx + 3, kp, lw - 6, 15, [176, 140, 70], r, { n: 10, ink: true, inkw: 1, ang: 0, alt: [230, 200, 120] });
      prTexFill(g, [[lx + 3, kp], [lx + lw - 3, kp], [lx + lw - 3, kp + 15], [lx + 3, kp + 15]], 'scratch', .9);
      g.fillStyle = css([190, 160, 90]); g.fillRect(k ? lx + 3 : lx + lw - 6, top + dh * .5, 3, 12);
    }
    g.fillStyle = css([12, 8, 8], .9); g.fillRect(cx - .8, top, 1.6, dh);
    wallLight(S, p, I, cx, 70, 60, [255, 190, 110], .16, .04, 'window');
  } else if (v === 1) {   // steel service door: grey enamel, red band, stencil, rivets, rust
    const st = [116, 122, 122];
    paintRect(g, x0, top, dw, dh, st, r, { n: 50, sw: 4, ang: 1.57, aj: .06, alt: [150, 156, 150], ink: false, edge: false });
    prTexFill(g, [[x0, top], [x1, top], [x1, bot], [x0, bot]], 'streak', .9); prTexFill(g, [[x0, top], [x1, top], [x1, bot], [x0, bot]], 'scratch', .7);
    prShade(g, [[x0, top], [x1, top], [x1, bot], [x0, bot]], x0, 0, x1, 0, [[0, [255, 230, 190], .12], [1, [10, 14, 24], .25]]);
    paintRect(g, x0, Y(42), dw, 9, [168, 40, 34], r, { n: 8, ink: false, ang: 0, edge: false });
    prBlock(g, 'NO ENTRY', cx, Y(70), 12, [236, 228, 206], dw - 14, { stencil: st });
    prBlock(g, 'BY ORDER', cx, Y(58), 6, [30, 30, 34], dw - 24);
    for (let k = 0; k < 4; k++) { prScrew(g, x0 + 5, top + 8 + k * (dh - 16) / 3, 1.6); prScrew(g, x1 - 5, top + 8 + k * (dh - 16) / 3, 1.6); }
    for (let k = 0; k < 3; k++) { const rx = x0 + 6 + r() * (dw - 12), ry = top + r() * dh * .6; g.strokeStyle = css([120, 54, 22], .45); g.lineWidth = 1.6; g.beginPath(); g.moveTo(rx, ry); g.quadraticCurveTo(rx + 1, ry + 12, rx, ry + 20 + r() * 20); g.stroke(); }
    paintRect(g, cx - 9, top + 12, 18, 8, [60, 64, 66], r, { n: 4, ink: true, inkw: 1, ang: 0 });   // peep hatch
    g.fillStyle = css([12, 12, 14]); g.fillRect(cx - 6, top + 15, 12, 2);
    g.fillStyle = css([210, 196, 150]); g.fillRect(x1 - 12, Y(50), 6, 3); g.strokeStyle = css(INK, .8); g.lineWidth = .8; g.strokeRect(x1 - 12, Y(50), 6, 3);
    prChips(g, r, [x0, bot - 4], [x1, bot - 4], 8, [90, 46, 30], 2.6);
  } else if (v === 3) {   // barred plank door
    prPlanks(g, r, x0, top, dw, dh, [86, 74, 62], 12, { alt: [120, 104, 86] });
    for (const z of [80, 20]) { paintRect(g, x0 - 2, Y(z), dw + 4, 7, [44, 40, 40], r, { n: 6, ink: true, inkw: 1, ang: 0 }); for (let k = 0; k < 5; k++) prScrew(g, x0 + 4 + k * (dw - 8) / 4, Y(z) + 3.5, 1.4); }
    g.strokeStyle = css([20, 14, 12], .8); g.lineWidth = 2; g.beginPath(); g.moveTo(x0 + 6, Y(28)); g.lineTo(x1 - 6, Y(76)); g.stroke();
  } else {               // v0: institutional green enamel over wood, wired-glass pane lit from beyond
    const en = [62, 110, 82];
    prPlanks(g, r, x0, top, dw, dh, en, dw / 2, { alt: [96, 140, 104] });
    g.fillStyle = css(en, .5); g.fillRect(x0, top, dw, dh);
    prTexFill(g, [[x0, top], [x1, top], [x1, bot], [x0, bot]], 'grime', .8);
    prShade(g, [[x0, top], [x1, top], [x1, bot], [x0, bot]], x0, 0, x1, 0, [[0, [255, 230, 190], .1], [1, [10, 14, 24], .22]]);
    // pane
    const px = cx - 15, py = top + 9, pw = 30, ph = 30;
    const gl = g.createLinearGradient(0, py, 0, py + ph); gl.addColorStop(0, 'rgb(255,220,150)'); gl.addColorStop(1, 'rgb(214,140,70)'); g.fillStyle = gl; g.fillRect(px, py, pw, ph);
    g.fillStyle = css([40, 24, 20], .35); g.fillRect(px, py + ph * .55, pw, ph * .45);
    g.strokeStyle = css([60, 50, 40], .7); g.lineWidth = .7; for (let k = 0; k <= 6; k++) { g.beginPath(); g.moveTo(px + k * pw / 6, py); g.lineTo(px + k * pw / 6, py + ph); g.moveTo(px, py + k * ph / 6); g.lineTo(px + pw, py + k * ph / 6); g.stroke(); }
    g.fillStyle = css([255, 255, 240], .28); g.beginPath(); g.moveTo(px + 3, py + ph); g.lineTo(px + 10, py); g.lineTo(px + 15, py); g.lineTo(px + 8, py + ph); g.fill();
    g.strokeStyle = css([20, 30, 22], .9); g.lineWidth = 2.4; g.strokeRect(px - 1, py - 1, pw + 2, ph + 2);
    paintRect(g, x0 + 8, Y(52), dw - 16, 36, mul(en, .85), r, { n: 8, ink: false, ang: 1.57, edge: false }); prBevel(g, x0 + 8, Y(52), dw - 16, 36);
    // kick plate, push plate, handle, room number
    const kp = bot - 14; paintRect(g, x0 + 2, kp, dw - 4, 12, [170, 140, 80], r, { n: 8, ink: true, inkw: .9, ang: 0, alt: [220, 190, 120] }); prTexFill(g, [[x0 + 2, kp], [x1 - 2, kp], [x1 - 2, kp + 12], [x0 + 2, kp + 12]], 'scratch', 1);
    g.fillStyle = css([220, 184, 96]); g.beginPath(); g.arc(x1 - 10, Y(46), 3.2, 0, 7); g.fill(); g.strokeStyle = css(INK, .8); g.lineWidth = 1; g.stroke(); g.fillStyle = css([255, 240, 200], .7); g.fillRect(x1 - 11.5, Y(47.5), 1.4, 1.4);
    g.fillStyle = css([20, 16, 12], .35); g.beginPath(); g.ellipse(x1 - 10, Y(46) + 6, 8, 12, 0, 0, 7); g.fill();   // hand grime around the knob
    prPlate(g, r, cx - 8, top + 44, 16, 7, String(((S.seed >> 3) % 40) + 10 + (p.x | 0) + (p.y | 0)), [236, 228, 204], [30, 40, 70]);
    prChips(g, r, [x0, top + 50], [x0, bot], 8, [150, 110, 70], 2.2); prChips(g, r, [x0 + 4, bot - 15], [x1 - 4, bot - 15], 6, [120, 84, 50], 2);
    if (r() < .7) prPinnedPaper(g, r, x0 + 6 + r() * 10, Y(62), 14, 18, (r() - .5) * .2, { tape: true, kind: 'type' });
    wallLight(S, p, I, cx, 82, 46, [255, 190, 110], .2, .04, 'window');
  }
  // lintel, destination plaque, light leak under the door
  paintRect(g, x0 - 13, top - 16, dw + 26, 8, mul(trim, 1.1), r, { n: 10, ink: true, inkw: 1.2, ang: 0, edge: false }); prBevel(g, x0 - 13, top - 16, dw + 26, 8);
  const nm = prDoorName(p.label); if (nm) prPlate(g, r, cx - Math.min(dw * .45, 32), top - 31, Math.min(dw * .9, 64), 11, nm, [28, 52, 86], [236, 228, 206]);
  g.fillStyle = css([255, 170, 90], .55); g.fillRect(x0 + 2, bot - 2, dw - 4, 2);
  S.exitLights.push({ side: p.side, u: (wallStart(p) + wallLen(p) / 2) });
  const wp = gp(S, p.side === 'l' ? 0 : wallStart(p) + wallLen(p) / 2, p.side === 'l' ? wallStart(p) + wallLen(p) / 2 : 0, 48);
  prLight(S, wp[0], wp[1] + 20, 80, [255, 160, 80], .16, .04, 'door', 'door', 28);
};
WALLPROPS.window = function (g, S, p, I) {
  const { r, u0, len, Y, v } = I, ww = Math.min(len - 22, v === 3 ? 56 : 84), cx = u0 + len / 2, x0 = cx - ww / 2, x1 = cx + ww / 2, wh = v === 3 ? 56 : 76, z0 = v === 3 ? 62 : 50, top = Y(z0 + wh), bot = Y(z0);
  wallShadow(g, x0 - 6, x1 + 6, top - 6, bot + 10, .3);
  const sk = S.mood.sky || SKY[S.bucket], night = S.bucket === 4;
  const frame = v === 2 ? [72, 66, 62] : [204, 196, 170];
  const shape = v === 1 ? function () { g.beginPath(); g.moveTo(x0, bot); g.lineTo(x0, top + ww / 2); g.arc(cx, top + ww / 2, ww / 2, Math.PI, 0); g.lineTo(x1, bot); g.closePath(); } : v === 3 ? function () { g.beginPath(); g.ellipse(cx, (top + bot) / 2, ww / 2, wh / 2, 0, 0, 7); } : function () { g.beginPath(); g.rect(x0, top, ww, wh); };
  // deep reveal (wall thickness) then glass
  g.save(); shape(); g.lineWidth = 16; g.strokeStyle = css(mul(frame, .42)); g.stroke(); g.restore();
  g.save(); shape(); g.clip();
  const gg = g.createLinearGradient(0, top, 0, bot); gg.addColorStop(0, css(sk[0])); gg.addColorStop(1, css(sk[1])); g.fillStyle = gg; g.fillRect(x0 - 2, top - 2, ww + 4, wh + 4);
  for (let i = 0; i < 26; i++) bristle(g, x0 + r() * ww, top + r() * wh * .7, .1 + r.g() * .2, 26, 6, mix(sk[0], sk[1], r()), .35, r);
  // the district beyond: rooftops, chimneys, a loudspeaker mast, lit windows
  const far = mix(sk[1], [40, 50, 60], .45), near = mix(sk[0], [10, 16, 24], .7);
  let bx = x0 - 4; while (bx < x1) { const bw = r.r(10, 22), bh = r.r(10, 30); g.fillStyle = css(far, .8); g.fillRect(bx, bot - bh - 8, bw, bh + 10); bx += bw + r.r(1, 4); }
  bx = x0 - 6; while (bx < x1) { const bw = r.r(14, 30), bh = r.r(4, 18); g.fillStyle = css(near, .92); g.fillRect(bx, bot - bh, bw, bh + 4); if (r() < .4) g.fillRect(bx + bw * .7, bot - bh - 8, 3, 9); if (night || S.mood.neon || r() < .3) { g.fillStyle = css([255, 200, 110], .85); for (let k = 0; k < 2; k++) g.fillRect(bx + 2 + r() * (bw - 4), bot - bh + 2 + r() * Math.max(1, bh - 4), 1.6, 1.8); } bx += bw + r.r(0, 3); }
  const mx = x0 + ww * r.r(.25, .75); g.strokeStyle = css(near); g.lineWidth = 1.6; g.beginPath(); g.moveTo(mx, bot); g.lineTo(mx, bot - 40); g.stroke(); g.fillStyle = css(near); g.beginPath(); g.moveTo(mx, bot - 40); g.lineTo(mx + 7, bot - 44); g.lineTo(mx + 7, bot - 36); g.fill();
  // glass: grime, reflection streaks, condensation at the bottom
  prTexFill(g, [[x0, top], [x1, top], [x1, bot], [x0, bot]], 'grime', .9);
  g.fillStyle = css([255, 255, 245], .14); g.beginPath(); g.moveTo(x0 + ww * .1, bot); g.lineTo(x0 + ww * .45, top); g.lineTo(x0 + ww * .58, top); g.lineTo(x0 + ww * .23, bot); g.fill();
  const cg = g.createLinearGradient(0, bot - 18, 0, bot); cg.addColorStop(0, 'rgba(220,230,230,0)'); cg.addColorStop(1, 'rgba(220,230,230,.28)'); g.fillStyle = cg; g.fillRect(x0, bot - 18, ww, 18);
  if (v === 0 && r() < .6) { g.strokeStyle = css([240, 250, 250], .5); g.lineWidth = .8; const cx0 = x0 + ww * .7, cy0 = top + wh * .3; g.beginPath(); for (let k = 0; k < 5; k++) { g.moveTo(cx0, cy0); g.lineTo(cx0 + Math.cos(k * 1.3) * 12, cy0 + Math.sin(k * 1.3) * 10); } g.stroke(); }
  g.restore();
  // frame + mullions
  g.save(); shape(); g.lineWidth = 5; g.strokeStyle = css(frame); g.stroke(); g.lineWidth = 1.4; g.strokeStyle = css(INK, .85); g.stroke(); g.restore();
  if (v === 2) {   // barred (iron) window
    for (let k = 1; k < 6; k++) { const bxp = x0 + k * ww / 6; g.strokeStyle = css(INK, .9); g.lineWidth = 3.6; g.beginPath(); g.moveTo(bxp, top); g.lineTo(bxp, bot); g.stroke(); g.strokeStyle = css([70, 70, 74]); g.lineWidth = 2.2; g.stroke(); g.strokeStyle = css([255, 200, 140], .35); g.lineWidth = .8; g.beginPath(); g.moveTo(bxp + .8, top); g.lineTo(bxp + .8, bot); g.stroke(); }
    for (const yy of [top + 6, bot - 6]) { g.strokeStyle = css([50, 50, 54]); g.lineWidth = 3; g.beginPath(); g.moveTo(x0, yy); g.lineTo(x1, yy); g.stroke(); }
    g.strokeStyle = css([120, 54, 22], .4); g.lineWidth = 1.4; for (let k = 0; k < 4; k++) { const xx = x0 + r() * ww; g.beginPath(); g.moveTo(xx, bot + 2); g.lineTo(xx + r.r(-1, 1), bot + 8 + r() * 14); g.stroke(); }
  } else {
    const mc = mul(frame, .92); g.strokeStyle = css(INK, .7); g.lineWidth = 4.4; g.beginPath(); g.moveTo(cx, top + (v === 1 ? 4 : 0)); g.lineTo(cx, bot); g.moveTo(x0, (top + bot) / 2 + 4); g.lineTo(x1, (top + bot) / 2 + 4); g.stroke();
    g.strokeStyle = css(mc); g.lineWidth = 2.8; g.stroke();
    g.strokeStyle = css([255, 240, 210], .4); g.lineWidth = .8; g.beginPath(); g.moveTo(cx - 1, top); g.lineTo(cx - 1, bot); g.stroke();
    prChips(g, r, [x0, top], [x0, bot], 5, [120, 100, 80], 1.6);
  }
  // sill with a few lived-in objects
  paintRect(g, x0 - 9, bot, ww + 18, 8, [176, 166, 146], r, { n: 10, ink: true, inkw: 1.3, ang: 0, ha: .9, edge: false }); prBevel(g, x0 - 9, bot, ww + 18, 8);
  prTexFill(g, [[x0 - 9, bot], [x1 + 9, bot], [x1 + 9, bot + 8], [x0 - 9, bot + 8]], 'speck', .7);
  g.fillStyle = css([6, 4, 14], .3); g.fillRect(x0 - 7, bot + 8, ww + 16, 4);
  const sr = r();
  if (sr < .3) { const qx = x0 + ww * .2; paintRect(g, qx - 4, bot - 9, 8, 9, [170, 90, 56], r, { n: 3, ink: true, inkw: .8, ang: 1.57 }); for (let k = 0; k < 5; k++) { g.strokeStyle = css([60, 110, 60]); g.lineWidth = 1.6; g.beginPath(); g.moveTo(qx, bot - 9); g.lineTo(qx + (k - 2) * 3, bot - 16 - r() * 6); g.stroke(); } }
  else if (sr < .55) { const qx = x1 - 12; g.fillStyle = css([80, 120, 100], .8); g.fillRect(qx, bot - 12, 5, 12); g.fillStyle = css([255, 255, 230], .4); g.fillRect(qx + 1, bot - 11, 1, 9); g.strokeStyle = css(INK, .8); g.lineWidth = .8; g.strokeRect(qx, bot - 12, 5, 12); }
  else if (sr < .75) { for (let k = 0; k < 3; k++) { g.fillStyle = css(jit([220, 210, 180], r, .1)); g.fillRect(x0 + 6 + k * 3, bot - 2 - k * 1.4, 18, 1.6); } }
  if (v === 0 || v === 1) {   // heavy curtains, gathered
    const cc = [[120, 46, 42], [64, 96, 92]][v];
    for (const sd of [-1, 1]) {
      const ex = sd < 0 ? x0 - 6 : x1 + 6, inx = sd < 0 ? x0 + 14 : x1 - 14, tie = (top + bot) / 2 + 6;
      const pts = [[ex, top - 8], [inx, top - 8], [inx - sd * 4, tie - 10], [ex + sd * 7, tie], [inx - sd * 2, tie + 10], [inx - sd * 6, bot + 6], [ex, bot + 6]];
      paintPoly(g, pts, cc, r, { n: 26, ang: 1.57, aj: .1, sw: 3, ink: true, inkw: 1.3, edge: false, alt: mul(cc, 1.35) });
      for (let k = 0; k < 4; k++) { const fx = lerp(ex, inx, (k + .5) / 4); g.strokeStyle = css(mul(cc, .45), .7); g.lineWidth = 1.4; g.beginPath(); g.moveTo(fx, top - 6); g.quadraticCurveTo(fx + sd * 2, tie - 8, ex + sd * 7 + sd * k, tie); g.lineTo(fx - sd * 2, bot + 4); g.stroke(); g.strokeStyle = css(mix(cc, [255, 220, 170], .4), .35); g.lineWidth = 1; g.beginPath(); g.moveTo(fx + 1.6, top - 6); g.lineTo(fx + 1.6, tie - 10); g.stroke(); }
      g.fillStyle = css([200, 160, 70]); g.fillRect(ex + sd * 4 - 2, tie - 2, 4, 5);
    }
    paintRect(g, x0 - 12, top - 12, ww + 24, 5, [60, 44, 30], r, { n: 4, ink: true, inkw: 1, ang: 0 });
  }
  if (!night) {
    const wp = gp(S, p.side === 'l' ? 0 : wallStart(p) + wallLen(p) / 2, p.side === 'l' ? wallStart(p) + wallLen(p) / 2 : 0, z0 + wh / 2);
    prLight(S, wp[0], wp[1], 70, S.mood.dapple || DAPPLE[S.bucket], .17 * S.lightK, .03, 'window', 'window', z0 + wh / 2);
  }
};
WALLPROPS.lockers = function (g, S, p, I) {
  const { r, u0, len, Y, v } = I, n = Math.max(2, Math.round(len / 34)), w = len / n, top = Y(90), bot = Y(2);
  const cols = [[92, 122, 106], [112, 120, 122], [134, 104, 70], [90, 110, 132]], base = cols[v];
  wallShadow(g, u0, u0 + len, top, bot, .4);
  paintRect(g, u0 - 2, bot - 1, len + 4, 4, [30, 30, 32], r, { n: 4, ink: true, ang: 0 });   // plinth
  for (let i = 0; i < n; i++) {
    const x = u0 + i * w, c = jit(base, r, .07), open = (i % 7 === 3) && v < 2, dented = r() < .4, pr = RNG(S.seed + i * 31 + v);
    const D0 = [[x + .5, top], [x + w - .5, top], [x + w - .5, bot], [x + .5, bot]];
    if (open) {   // open locker: shelf, books, a coat on the hook, the door swung out
      g.fillStyle = css([16, 14, 16]); g.fillRect(x + 2, top + 2, w - 4, bot - top - 2);
      paintRect(g, x + 2, top + 22, w - 4, 3, [70, 74, 72], r, { n: 2, ink: false });
      for (let k = 0; k < 4; k++) paintRect(g, x + 4 + k * 4.5, top + 9 + (k % 2) * 2, 3.8, 13 - (k % 2) * 2, r.p([[120, 40, 40], [40, 70, 90], [180, 150, 80], [60, 80, 60]]), r, { n: 2, ink: true, inkw: .6, ang: 1.57 });
      paintPoly(g, [[x + w / 2 - 6, top + 28], [x + w / 2 + 6, top + 28], [x + w / 2 + 9, bot - 22], [x + w / 2 - 8, bot - 18]], [70, 62, 58], r, { n: 6, ink: true, inkw: .8, ang: 1.57 });
      g.fillStyle = css([120, 110, 96]); g.fillRect(x + 5, bot - 12, w - 10, 9);
      paintPoly(g, [[x + 2, top + 1], [x - 9, top + 6], [x - 9, bot - 4], [x + 2, bot - 1]], mul(c, .72), r, { n: 10, ink: true, inkw: 1.2, ang: 1.57 });
      for (let k = 0; k < 3; k++) { g.fillStyle = css([10, 12, 12], .6); g.fillRect(x - 7, top + 10 + k * 3, 7, 1.2); }
      continue;
    }
    paintPoly(g, D0, c, pr, { n: 18, sw: 3, ang: 1.57, aj: .06, alt: mul(c, 1.25), ink: false, edge: false });
    prTexFill(g, D0, 'streak', .8, null, null, [pr() * 100, pr() * 50]); prTexFill(g, D0, 'scratch', .6, null, null, [pr() * 100, pr() * 50]);
    prShade(g, D0, x, 0, x + w, 0, [[0, [255, 236, 200], .18], [.15, [255, 236, 200], 0], [.85, [10, 14, 22], 0], [1, [10, 14, 22], .35]]);
    prShade(g, D0, 0, top, 0, bot, [[0, [255, 230, 190], .06], [.7, PR_AO, 0], [1, PR_AO, .35]]);
    // vents, number plate, handle with padlock
    for (let k = 0; k < 4; k++) { g.fillStyle = css([8, 10, 10], .75); g.fillRect(x + 6, top + 6 + k * 3.2, w - 12, 1.4); g.fillStyle = css([255, 240, 210], .25); g.fillRect(x + 6, top + 7.4 + k * 3.2, w - 12, .6); }
    for (let k = 0; k < 3; k++) { g.fillStyle = css([8, 10, 10], .75); g.fillRect(x + 6, bot - 22 + k * 3.2, w - 12, 1.4); }
    paintRect(g, x + 5, top + 22, 11, 6, [226, 220, 196], pr, { n: 2, ink: true, inkw: .7, ang: 0 }); prBlock(g, String(100 + i + (p.y | 0) * 10 + (p.x | 0)), x + 10.5, top + 25.2, 4.4, [30, 30, 40], 9);
    paintRect(g, x + w - 9, Y(50), 4, 14, [180, 170, 150], pr, { n: 2, ink: true, inkw: .7, ang: 1.57 });
    if (pr() < .45) { g.strokeStyle = css([200, 190, 160]); g.lineWidth = 1.4; g.beginPath(); g.arc(x + w - 7, Y(36) - 3, 2.6, Math.PI, 0); g.stroke(); paintRect(g, x + w - 10, Y(36) - 3, 6, 6, [186, 150, 70], pr, { n: 2, ink: true, inkw: .7 }); }
    if (dented) { const dx = x + 6 + pr() * (w - 14), dy = top + 34 + pr() * 30; g.strokeStyle = css([10, 12, 16], .45); g.lineWidth = 1.6; g.beginPath(); g.ellipse(dx, dy, 5, 4, 0, .3, 2.6); g.stroke(); g.strokeStyle = css([255, 236, 200], .35); g.lineWidth = 1.2; g.beginPath(); g.ellipse(dx, dy + 1, 5, 4, 0, 3.4, 5.8); g.stroke(); }
    if (pr() < .35) scribbleLines(g, pr, x + 4, top + 50 + pr() * 12, w - 10, 2, 4, pr() < .5 ? [230, 230, 220] : [30, 30, 36], .5);
    if (pr() < .25) { g.save(); g.translate(x + w / 2, top + 40); g.rotate((pr() - .5) * .4); g.fillStyle = css(r.p([[176, 40, 36], [230, 200, 90], [226, 220, 196]])); g.fillRect(-4, -5, 8, 10); prBellGlyph(g, 0, 0, 7, [30, 24, 26], .8); g.restore(); }
    prChips(g, pr, [x + 1, bot - 3], [x + w - 1, bot - 3], 4, [80, 44, 26], 2.2);
    g.fillStyle = css([10, 8, 10], .7); g.fillRect(x + w - 1, top, 1.2, bot - top);
  }
  paintRect(g, u0 - 2, top - 6, len + 4, 7, mul(base, .72), r, { n: 8, ink: true, inkw: 1.2, ang: 0, edge: false }); prBevel(g, u0 - 2, top - 6, len + 4, 7);
  // stuff dumped on top: a box, a ball, a rolled poster
  for (let x = u0 + 10 + r() * 20; x < u0 + len - 20; x += r.r(50, 120)) { const k = r(); if (k < .4) paintRect(g, x, top - 16, 18, 10, [150, 120, 80], r, { n: 4, ink: true, inkw: .9, ang: 0 }); else if (k < .7) { paintEll(g, x, top - 11, 5.5, 5.5, [170, 80, 40], r, { n: 6, ink: true, inkw: .9 }); } else { paintRect(g, x, top - 10, 24, 4, [226, 216, 186], r, { n: 3, ink: true, inkw: .8, ang: 0 }); } }
};
WALLPROPS.bookshelf = function (g, S, p, I) {
  const { r, u0, len, Y, v } = I, top = Y(108), bot = Y(0), wood = v === 1 ? [92, 60, 38] : [72, 46, 30];
  wallShadow(g, u0 + 2, u0 + len - 2, top - 8, bot, .4);
  paintRect(g, u0 + 2, top, len - 4, bot - top, wood, r, { n: 40, sw: 4, ang: 1.57, ink: true, inkw: 1.6, edge: false });
  const rows = 5, rh = (bot - top - 12) / rows, pal = [[120, 36, 34], [44, 76, 66], [176, 146, 80], [76, 64, 104], [150, 118, 86], [38, 52, 58], [168, 86, 48], [96, 104, 70], [196, 186, 160], [60, 40, 34]];
  const titles = ['UNION', 'HISTORY', 'ORDER', 'BELL', 'VOL.II', 'DUTY', 'GRAMMAR', 'ANTHEM'];
  for (let k = 0; k < rows; k++) {
    const y0 = top + 6 + k * rh, y1 = y0 + rh;
    g.fillStyle = css([10, 6, 6], .88); g.fillRect(u0 + 6, y0, len - 12, rh);
    const sg = g.createLinearGradient(0, y0, 0, y0 + 12); sg.addColorStop(0, 'rgba(0,0,0,.6)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
    let x = u0 + 7;
    while (x < u0 + len - 9) {
      const kk = r();
      if (kk < .05) { x += r.r(6, 14); continue; }
      if (kk < .1) {   // horizontal stack
        const sw2 = r.r(12, 20); let yy = y1; for (let s = 0; s < r.i(2, 4); s++) { const bh = r.r(2.6, 4); paintRect(g, x, yy - bh, sw2 - r() * 3, bh, jit(r.p(pal), r, .1), r, { n: 2, ink: true, inkw: .5, ang: 0, edge: false }); yy -= bh; } x += sw2 + 1; continue;
      }
      if (kk < .13 && k > 0) {  // an object: tin, small bust, folded paper
        if (r() < .5) { paintRect(g, x, y1 - 9, 8, 9, [140, 150, 140], r, { n: 2, ink: true, inkw: .6, ang: 1.57 }); g.fillStyle = css([176, 40, 36]); g.fillRect(x, y1 - 6, 8, 2.4); }
        else { paintEll(g, x + 4, y1 - 12, 3, 3.6, [190, 186, 170], r, { n: 4, ink: true, inkw: .6 }); paintRect(g, x + 1, y1 - 8, 6, 8, [176, 172, 156], r, { n: 2, ink: true, inkw: .6 }); }
        x += 11; continue;
      }
      const bw = r.r(3, 8), bh = rh * r.r(.6, .94), c = jit(r.p(pal), r, .12), lean = r() < .06;
      g.save(); if (lean) { g.translate(x + bw, y1); g.rotate(-.22); g.translate(-x - bw, -y1); }
      paintRect(g, x, y1 - bh, bw, bh, c, r, { n: 2, sw: 2, ang: 1.57, ink: false, edge: false });
      g.fillStyle = css([255, 230, 190], .16); g.fillRect(x, y1 - bh, bw * .3, bh); g.fillStyle = css([0, 0, 0], .3); g.fillRect(x + bw * .75, y1 - bh, bw * .25, bh);
      if (r() < .55) { g.fillStyle = css([214, 184, 104], .75); g.fillRect(x + .5, y1 - bh + 2.5, bw - 1, 1); g.fillRect(x + .5, y1 - 3.5, bw - 1, 1); }
      if (bw > 5.5 && r() < .35) { g.fillStyle = css([226, 210, 160], .5); g.fillRect(x + bw / 2 - .5, y1 - bh * .75, 1, bh * .4); }
      g.strokeStyle = css(INK, .55); g.lineWidth = .6; g.strokeRect(x, y1 - bh, bw, bh);
      g.restore();
      x += bw + .5;
    }
    g.fillStyle = sg; g.fillRect(u0 + 6, y0, len - 12, 12);
    paintRect(g, u0 + 3, y1 - 1, len - 6, 4.5, mul(wood, 1.3), r, { n: 6, ink: true, inkw: .9, ang: 0, edge: false });
    g.fillStyle = css([255, 214, 160], .3); g.fillRect(u0 + 3, y1 - 1, len - 6, 1);
    if (r() < .35) { prPlate(g, r, u0 + len / 2 - 8, y1 + .5, 16, 3.4, null, [226, 214, 176]); }
  }
  prTexFill(g, [[u0 + 2, top], [u0 + len - 2, top], [u0 + len - 2, bot], [u0 + 2, bot]], 'grime', .5);
  paintRect(g, u0, top - 7, len, 9, mul(wood, 1.2), r, { n: 8, ink: true, inkw: 1.3, ang: 0, edge: false }); prBevel(g, u0, top - 7, len, 9);
  for (const xx of [u0 + 2, u0 + len - 8]) { paintRect(g, xx, top, 6, bot - top, mul(wood, 1.1), r, { n: 8, ink: true, inkw: 1, ang: 1.57, edge: false }); g.fillStyle = css([255, 220, 170], .15); g.fillRect(xx, top, 1.4, bot - top); }
  if (v === 1) prPlate(g, r, u0 + 14, top - 18, 36, 9, r() < .5 ? 'APPROVED' : 'REFERENCE', [226, 216, 186], [100, 30, 30]);
};
WALLPROPS.vault = function (g, S, p, I) {   // records safe / filing cabinets
  const { r, u0, len, Y, v } = I, top = Y(84), cx = u0 + len / 2, w = Math.min(len - 10, 100), x0 = cx - w / 2, bot = Y(0);
  wallShadow(g, x0, x0 + w, top, bot, .45);
  if (v === 1) {   // filing cabinet, three drawers
    const n = 3, dh = (bot - top) / n;
    for (let i = 0; i < n; i++) {
      const y = top + i * dh, P = [[x0, y], [x0 + w, y], [x0 + w, y + dh - 1], [x0, y + dh - 1]];
      paintPoly(g, P, [96, 110, 100], r, { n: 16, ink: true, inkw: 1.3, ang: 0, edge: false }); prTexFill(g, P, 'scratch', .7); prBevel(g, x0, y, w, dh - 1);
      paintRect(g, cx - 10, y + dh / 2 - 3, 20, 5, [200, 186, 130], r, { n: 2, ink: true, inkw: .7 }); prPlate(g, r, cx - 9, y + 6, 18, 6, ['A–F', 'G–P', 'R–Z'][i], [230, 222, 196], [40, 30, 30]);
    }
    return;
  }
  const P = [[x0, top], [x0 + w, top], [x0 + w, bot], [x0, bot]];
  paintPoly(g, P, [70, 80, 80], r, { n: 50, sw: 4, ang: 0, aj: .2, ink: true, inkw: 2, alt: [110, 120, 110], edge: false });
  prTexFill(g, P, 'streak', .9); prTexFill(g, P, 'scratch', .8);
  const P2 = [[x0 + 8, top + 8], [x0 + w - 8, top + 8], [x0 + w - 8, bot - 8], [x0 + 8, bot - 8]];
  paintPoly(g, P2, [90, 98, 94], r, { n: 30, sw: 4, ink: true, inkw: 1.3, ang: 0, alt: [130, 140, 120], edge: false }); prBevel(g, x0 + 8, top + 8, w - 16, bot - top - 16);
  prShade(g, P, x0, top, x0 + w, bot, [[0, [255, 236, 200], .12], [.5, [0, 0, 0], 0], [1, [6, 10, 20], .3]]);
  const wx = cx + 6, wy = (top + bot) / 2;
  paintEll(g, wx, wy, 15, 15, [44, 48, 48], r, { n: 10, ink: true, inkw: 1.4 });
  g.strokeStyle = css([210, 190, 120], .95); g.lineWidth = 2.4; g.beginPath(); g.arc(wx, wy, 11, 0, 7); g.stroke();
  for (let k = 0; k < 24; k++) { const a = k / 24 * 6.283; g.strokeStyle = css([230, 220, 180], .7); g.lineWidth = .7; g.beginPath(); g.moveTo(wx + Math.cos(a) * 11, wy + Math.sin(a) * 11); g.lineTo(wx + Math.cos(a) * 13.5, wy + Math.sin(a) * 13.5); g.stroke(); }
  g.fillStyle = css([170, 150, 90]); g.beginPath(); g.arc(wx, wy, 5, 0, 7); g.fill(); g.strokeStyle = css(INK, .8); g.lineWidth = 1; g.stroke(); g.fillStyle = css([255, 240, 200], .6); g.fillRect(wx - 2, wy - 3, 1.5, 1.5);
  paintRect(g, x0 + 14, wy - 14, 6, 28, [180, 170, 140], r, { n: 3, ink: true, inkw: .9, ang: 1.57 });   // lever
  for (let i = 0; i < 8; i++) prScrew(g, x0 + 4 + (i % 4) * (w - 8) / 3, top + 4 + (i >> 2) * (bot - top - 8), 1.7);
  prPlate(g, r, x0 + 12, top + 12, 30, 8, 'RECORDS', [214, 186, 90], [30, 20, 10]);
  prBlock(g, 'STRONGWORKS · SCHOOL No.9', cx, bot - 13, 4, [190, 180, 150], w - 24);
};
WALLPROPS.curtain = function (g, S, p, I) {
  const { r, u0, len, Y, v } = I, top = Y(148), pal = [[150, 28, 38], [58, 92, 84], [196, 186, 160], [30, 30, 40]][v];
  const folds = Math.max(3, Math.round(len / 20)), fw = len / folds;
  for (let i = 0; i < folds; i++) {   // each fold: lit crest, shadowed trough
    const x = u0 + i * fw, bow = r.r(-3, 3), P = [[x - .5, top], [x + fw + .5, top], [x + fw + bow + .5, Y(1)], [x + bow - .5, Y(1)]];
    paintPoly(g, P, pal, r, { n: 14, sw: 4, ang: 1.57, aj: .05, alt: mul(pal, 1.25), ink: false, edge: false });
    prShade(g, P, x, 0, x + fw, 0, [[0, [10, 6, 16], .55], [.35, pal, 0], [.6, mix(pal, [255, 210, 160], .45), .55], [.75, pal, 0], [1, [10, 6, 16], .5]]);
  }
  prTexFill(g, [[u0, top], [u0 + len, top], [u0 + len, Y(1)], [u0, Y(1)]], 'weave', .8);
  prShade(g, [[u0, top], [u0 + len, top], [u0 + len, Y(1)], [u0, Y(1)]], 0, top, 0, Y(1), [[0, [6, 4, 10], .5], [.2, [0, 0, 0], 0], [.85, [0, 0, 0], 0], [1, [6, 4, 10], .35]]);
  // dust / moth wear at the hem, pelmet, gold fringe + tasselled tie-back
  prTexFill(g, [[u0, Y(40)], [u0 + len, Y(40)], [u0 + len, Y(1)], [u0, Y(1)]], 'grime', 1);
  paintRect(g, u0 - 2, top - 8, len + 4, 16, mul(pal, .7), r, { n: 16, ink: true, inkw: 1.3, ang: 0, edge: false, alt: mul(pal, 1.1) });
  for (let x = u0; x < u0 + len; x += 14) { g.fillStyle = css(mul(pal, .5), .8); g.beginPath(); g.moveTo(x, top + 8); g.quadraticCurveTo(x + 7, top + 16, x + 14, top + 8); g.fill(); }
  g.fillStyle = css([200, 160, 70], .9); g.fillRect(u0 - 2, top + 6, len + 4, 2);
  for (let x = u0; x < u0 + len; x += 3.2) { g.fillStyle = css(jit([206, 166, 76], r, .15), .9); g.fillRect(x, Y(8), 1.6, 6 + r() * 3); }
  if (v !== 2) { const tx = u0 + len * .62, ty = Y(56); g.strokeStyle = css([206, 166, 70]); g.lineWidth = 2.6; g.beginPath(); g.moveTo(tx - 16, ty - 4); g.quadraticCurveTo(tx, ty + 6, tx + 16, ty - 4); g.stroke(); paintEll(g, tx, ty + 6, 3, 3, [214, 176, 80], r, { n: 4, ink: true, inkw: .8 }); for (let k = 0; k < 6; k++) { g.strokeStyle = css([200, 160, 70], .9); g.lineWidth = 1; g.beginPath(); g.moveTo(tx - 2 + k * .8, ty + 8); g.lineTo(tx - 3 + k * 1.2, ty + 20); g.stroke(); } }
  if (v === 1) { for (let i = 0; i < 4; i++) { g.fillStyle = css([30, 50, 44], .22); g.beginPath(); g.ellipse(u0 + r() * len, Y(r.r(10, 130)), 14, 7, 0, 0, 7); g.fill(); } }
};
WALLPROPS.pipes = function (g, S, p, I) {
  const { r, u0, len, Y, v } = I, cols = [[100, 116, 106], [156, 104, 70]], base = cols[v % 2];
  const ys = [118, 96, 42];
  const pipe = (y, th, c) => {
    const P = [[u0, y - th / 2], [u0 + len, y - th / 2], [u0 + len, y + th / 2], [u0, y + th / 2]];
    g.fillStyle = css([6, 4, 14], .3); g.fillRect(u0, y + th * .5 + 2, len, 5);
    paintPoly(g, P, c, r, { n: len / 5, sw: 3, ang: 0, aj: .04, ink: false, edge: false, alt: mul(c, 1.3) });
    prTexFill(g, P, 'streak', .5); prTexFill(g, P, 'grime', .7);
    prShade(g, P, 0, y - th / 2, 0, y + th / 2, [[0, [255, 226, 180], .45], [.25, c, 0], [.7, [10, 12, 24], .25], [1, [10, 12, 24], .6]]);
    ink(g, [[u0, y - th / 2], [u0 + len, y - th / 2]], r, 1.1, null, .7, false); ink(g, [[u0, y + th / 2], [u0 + len, y + th / 2]], r, 1.3, null, .8, false);
  };
  for (let k = 0; k < ys.length; k++) {
    const y = Y(ys[k]), th = k === 1 ? 7 : 11, c = jit(k === 2 ? mul(base, .8) : base, r, .06);
    pipe(y, th, c);
    // flanges with bolts, brackets, lagging, valves, gauges, drips, stencilled arrows
    for (let x = u0 + 40 + r() * 30; x < u0 + len - 10; x += r.r(80, 140)) { paintRect(g, x, y - th / 2 - 3, 6, th + 6, mul(c, .78), r, { n: 3, ink: true, inkw: .9, ang: 1.57, edge: false }); g.fillStyle = css([255, 230, 190], .35); g.fillRect(x, y - th / 2 - 3, 1.2, th + 6); prScrew(g, x + 3, y - th / 2 - 1.2, 1.1); prScrew(g, x + 3, y + th / 2 + 1.2, 1.1); }
    for (let x = u0 + 20 + r() * 40; x < u0 + len - 10; x += r.r(110, 170)) { g.fillStyle = css([30, 30, 32]); g.fillRect(x - 1.5, y + th / 2, 3, Y(ys[k] - 16) - y); }
    if (k === 0 && r() < .8) { const lx = u0 + r.r(20, len - 80), lw = r.r(40, 70); paintRect(g, lx, y - th / 2 - 2, lw, th + 4, [196, 186, 160], r, { n: 10, ink: true, inkw: 1, ang: 0, edge: false }); for (let xx = lx + 4; xx < lx + lw; xx += 6) { g.strokeStyle = css([120, 110, 90], .6); g.lineWidth = 1; g.beginPath(); g.moveTo(xx, y - th / 2 - 2); g.lineTo(xx - 3, y + th / 2 + 2); g.stroke(); } prTexFill(g, [[lx, y - th / 2 - 2], [lx + lw, y - th / 2 - 2], [lx + lw, y + th / 2 + 2], [lx, y + th / 2 + 2]], 'grime', 1); }
    for (let x = u0 + 70 + r() * 50; x < u0 + len - 20; x += r.r(160, 260)) {
      g.fillStyle = css([40, 40, 42]); g.fillRect(x - 1, y - th / 2 - 8, 2, 8);
      g.strokeStyle = css(INK, .85); g.lineWidth = 3.2; g.beginPath(); g.ellipse(x, y - th / 2 - 9, 6, 2.4, 0, 0, 7); g.stroke(); g.strokeStyle = css([176, 40, 36]); g.lineWidth = 2; g.stroke(); g.strokeStyle = css([255, 160, 130], .6); g.lineWidth = .8; g.beginPath(); g.ellipse(x, y - th / 2 - 9.6, 6, 2.4, 0, 3.4, 5.9); g.stroke();
    }
    if (k === 1) { const gx = u0 + len * r.r(.3, .7); g.fillStyle = css([40, 40, 42]); g.fillRect(gx - 1, y - th / 2 - 6, 2, 6); g.fillStyle = css([226, 218, 190]); g.beginPath(); g.arc(gx, y - th / 2 - 12, 6.5, 0, 7); g.fill(); g.strokeStyle = css([40, 40, 44]); g.lineWidth = 2; g.stroke(); g.strokeStyle = css([170, 30, 30]); g.lineWidth = 1.2; g.beginPath(); g.moveTo(gx, y - th / 2 - 12); g.lineTo(gx + 4, y - th / 2 - 15); g.stroke(); g.fillStyle = css([170, 30, 30], .7); g.beginPath(); g.arc(gx, y - th / 2 - 12, 6, -.6, 0); g.lineTo(gx, y - th / 2 - 12); g.fill(); }
    if (r() < .7) { const ax = u0 + r.r(30, len - 50); prBlock(g, k === 2 ? 'RETURN' : 'STEAM', ax + 12, y + .5, th * .7, [230, 224, 200], 30); g.fillStyle = css([230, 224, 200], .9); g.beginPath(); g.moveTo(ax + 28, y - th * .3); g.lineTo(ax + 34, y); g.lineTo(ax + 28, y + th * .3); g.fill(); }
    if (r() < .6) { const dx = u0 + r.r(40, len - 40); g.fillStyle = css([140, 200, 200], .6); g.fillRect(dx, y + th / 2, 1.4, r.r(4, 12)); g.fillStyle = css([220, 240, 240], .8); g.beginPath(); g.arc(dx + .7, y + th / 2 + r.r(8, 16), 1.5, 0, 7); g.fill(); g.strokeStyle = css([120, 60, 24], .35); g.lineWidth = 2; g.beginPath(); g.moveTo(dx, y + th / 2 + 18); g.lineTo(dx, Y(0)); g.stroke(); }
  }
  for (let x = u0 + 60; x < u0 + len - 20; x += 190) {   // risers
    const P = [[x, Y(150)], [x + 9, Y(150)], [x + 9, Y(0)], [x, Y(0)]];
    paintPoly(g, P, mul(base, .9), r, { n: 16, ang: 1.57, ink: false, edge: false }); prTexFill(g, P, 'streak', .7);
    prShade(g, P, x, 0, x + 9, 0, [[0, [10, 12, 24], .5], [.4, base, 0], [.65, [255, 226, 180], .4], [1, [10, 12, 24], .45]]); ink(g, P, r, 1.2, null, .8);
    for (const z of [125, 70]) paintRect(g, x - 2, Y(z), 13, 4, mul(base, .7), r, { n: 2, ink: true, inkw: .8, edge: false });
  }
};
WALLPROPS.radiator = function (g, S, p, I) {
  const { r, u0, len, Y, v } = I, top = Y(54), bot = Y(6), c = v === 1 ? [44, 44, 48] : [204, 198, 178];
  wallShadow(g, u0 + 4, u0 + len - 4, top, bot, .35);
  const n = Math.max(4, Math.round(len / 8)), fw = (len - 10) / n;
  for (let i = 0; i < n; i++) {
    const x = u0 + 5 + i * fw, P = [[x + .4, top + 2], [x + fw - .4, top + 2], [x + fw - .4, bot], [x + .4, bot]];
    paintPoly(g, P, jit(c, r, .04), r, { n: 3, ang: 1.57, ink: false, edge: false });
    prShade(g, P, x, 0, x + fw, 0, [[0, [10, 12, 22], .5], [.35, c, 0], [.6, [255, 236, 200], .4], [1, [10, 12, 22], .55]]);
    g.fillStyle = css([10, 8, 10], .6); g.fillRect(x + fw - .6, top + 4, .8, bot - top - 4);
  }
  prTexFill(g, [[u0 + 5, top], [u0 + len - 5, top], [u0 + len - 5, bot], [u0 + 5, bot]], 'streak', .8);
  prChips(g, r, [u0 + 5, bot - 2], [u0 + len - 5, bot - 2], 6, [110, 50, 24], 2);
  paintRect(g, u0 + 3, top - 3, len - 6, 5, mul(c, .86), r, { n: 4, ink: true, inkw: 1, edge: false }); paintRect(g, u0 + 3, bot - 2, len - 6, 4, mul(c, .7), r, { n: 4, ink: true, inkw: 1, edge: false });
  paintRect(g, u0 + 6, Y(5), 7, 5, [80, 80, 82], r, { n: 2, ink: true }); paintRect(g, u0 + len - 13, Y(5), 7, 5, [80, 80, 82], r, { n: 2, ink: true });
  const vx = u0 + len - 6; g.fillStyle = css([60, 60, 64]); g.fillRect(vx - 1, top + 4, 3, 10); g.strokeStyle = css(INK, .8); g.lineWidth = 2.2; g.beginPath(); g.ellipse(vx + .5, top + 3, 4, 1.6, 0, 0, 7); g.stroke(); g.strokeStyle = css([176, 40, 36]); g.lineWidth = 1.2; g.stroke();
  // a sock drying / a cup warming on top
  if (r() < .5) { g.save(); g.translate(u0 + len * .35, top - 2); paintPoly(g, [[0, 0], [9, 0], [9, 14], [14, 18], [12, 21], [3, 18], [0, 14]], r.p([[150, 60, 50], [70, 90, 110], [200, 190, 160]]), r, { n: 4, ink: true, inkw: .9 }); g.restore(); }
  g.fillStyle = css([255, 140, 60], .07); g.fillRect(u0, top - 22, len, 22);
  wallLight(S, p, I, u0 + len / 2, 30, 60, [255, 120, 50], .12, .05, 'heat');
};
WALLPROPS.fence = function (g, S, p, I) {
  const { r, u0, len, Y, v } = I;
  if (v === 1) {   // wooden hoarding layered with torn posters
    const top = Y(118), bot = Y(0);
    for (let x = u0; x < u0 + len; x += 18) { const P = [[x, top + r() * 5], [x + 17, top + r() * 5], [x + 17, bot], [x, bot]]; paintPoly(g, P, jit([108, 86, 62], r, .1), r, { n: 8, sw: 3, ang: 1.57, ink: true, inkw: 1.1, edge: false, alt: [60, 50, 40] }); prTexFill(g, P, 'grain', .8, (k) => k.rotate(1.5708)); g.fillStyle = css([255, 220, 170], .12); g.fillRect(x, top, 1.2, bot - top); }
    prTexFill(g, [[u0, top], [u0 + len, top], [u0 + len, bot], [u0, bot]], 'streak', .9);
    prPosterLayer(g, S, r, u0 + 4, top + 8, len - 8, bot - top - 30, Math.max(3, Math.round(len / 40)), 'hoard' + p.x + p.y);
    paintRect(g, u0, Y(14), len, 4, [70, 56, 44], r, { n: len / 8, ink: true, ang: 0 });
    return;
  }
  // iron spear railings on stone footing
  const top = Y(112);
  const F = [[u0, Y(24)], [u0 + len, Y(24)], [u0 + len, Y(0)], [u0, Y(0)]];
  paintPoly(g, F, [100, 96, 88], r, { n: len / 3, ang: 0, ink: true, inkw: 1.6, alt: [70, 76, 72], edge: false }); prTexFill(g, F, 'speck', 1); prTexFill(g, F, 'grime', 1);
  for (let x = u0 + 30; x < u0 + len; x += 48) { g.strokeStyle = css([20, 18, 20], .5); g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, Y(24)); g.lineTo(x, Y(0)); g.stroke(); }
  paintRect(g, u0, Y(28), len, 5, [130, 126, 116], r, { n: len / 6, ink: true, ang: 0, edge: false });
  for (const z of [104, 34]) paintRect(g, u0, Y(z), len, 5, [32, 32, 36], r, { n: len / 6, ang: 0, ink: true, inkw: 1, edge: false });
  for (let x = u0 + 6; x < u0 + len; x += 13) {
    g.strokeStyle = css(INK, .9); g.lineWidth = 4; g.beginPath(); g.moveTo(x, Y(28)); g.lineTo(x, Y(104)); g.stroke(); g.strokeStyle = css([40, 40, 46]); g.lineWidth = 2.6; g.stroke();
    g.fillStyle = css([46, 46, 52]); g.beginPath(); g.moveTo(x - 3.6, Y(104)); g.quadraticCurveTo(x - 2, top + 2, x, top - 8); g.quadraticCurveTo(x + 2, top + 2, x + 3.6, Y(104)); g.closePath(); g.fill(); g.strokeStyle = css(INK, .85); g.lineWidth = 1; g.stroke();
    g.strokeStyle = css([255, 170, 90], .42); g.lineWidth = .9; g.beginPath(); g.moveTo(x + 1.2, Y(100)); g.lineTo(x + 1.2, Y(30)); g.stroke();
    if (r() < .25) { g.strokeStyle = css([120, 54, 22], .5); g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, Y(30)); g.lineTo(x, Y(10 + r() * 10)); g.stroke(); }
  }
  for (let x = u0 + 60; x < u0 + len; x += 70) {
    const P = [[x - 5, Y(118)], [x + 5, Y(118)], [x + 5, Y(24)], [x - 5, Y(24)]];
    paintPoly(g, P, [44, 44, 50], r, { n: 10, ang: 1.57, ink: false, edge: false }); prShade(g, P, x - 5, 0, x + 5, 0, [[0, [10, 10, 20], .4], [.6, [255, 190, 120], .35], [1, [10, 10, 20], .4]]); ink(g, P, r, 1.3, null, .85);
    paintEll(g, x, Y(121), 6, 4, [56, 56, 60], r, { n: 6, ink: true, inkw: 1 });
  }
};
/* layered, torn, overlapping posters (hoardings, poster walls) in local coords */
function prPosterLayer(g, S, r, x0, y0, w, h, n, key) {
  const kinds = ['bell', 'march', 'ear', 'warden', 'text', 'pupil', 'wanted', 'notice', 'text', 'bell'];
  for (let i = 0; i < n; i++) {
    const pw = r.r(34, 62), ph = pw * r.r(1.15, 1.5) * .62, px = x0 + r.r(-6, w - pw + 6), py = y0 + r.r(-4, Math.max(0, h - ph) + 4), rot = (r() - .5) * .08, kind = r.p(kinds), sd = (r() * 1e9) | 0;
    g.save(); g.translate(px + pw / 2, py + ph / 2); g.rotate(rot); g.translate(-pw / 2, -ph / 2);
    g.fillStyle = css([6, 4, 14], .3); g.fillRect(2, 3, pw, ph);
    // torn outline: ragged bottom / side, sometimes a big rip revealing the poster underneath
    const pts = [[0, 0], [pw * .5, -r() * 2], [pw, 0], [pw + r.r(-2, 1), ph * .5], [pw, ph]];
    const rip = r() < .55, rr = RNG(sd);
    if (rip) { const k = r.i(3, 6); for (let j = 1; j <= k; j++) pts.push([pw * (1 - j / (k + 1)), ph - r.r(0, ph * .45) * (j % 2 ? 1 : .3)]); } else pts.push([pw * .6, ph + r.r(-3, 1)], [pw * .3, ph - r.r(0, 4)]);
    pts.push([0, ph], [r.r(-1, 2), ph * .5]);
    g.save(); pathPoly(g, pts, r, 1.6); g.clip();
    prPic(g, 0, 0, pw, ph, key + ':' + i + ':' + kind, (cg, W, H) => prPoster(cg, W, H, rr, kind, { age: 1.2 }), 1.1);
    g.restore();
    g.strokeStyle = css([236, 226, 196], .55); g.lineWidth = 1.2; pathPoly(g, pts, r, 1.6); g.stroke();   // torn white paper edge
    g.strokeStyle = css([20, 12, 10], .35); g.lineWidth = .8; g.stroke();
    if (r() < .5) { paintPoly(g, [[pw, 0], [pw - r.r(7, 12), 0], [pw, r.r(7, 12)]], [214, 204, 176], r, { n: 2, ink: true, inkw: .7, ew: .5 }); }   // curled corner
    if (r() < .3) { g.fillStyle = css([230, 220, 170], .5); g.fillRect(pw * .4, -2, 9, 4); }
    g.restore();
  }
  // paste streaks + weather
  for (let i = 0; i < w / 30; i++) { const x = x0 + r() * w; g.fillStyle = css([226, 210, 170], .1 + r() * .08); g.fillRect(x, y0 + r() * h * .4, r.r(1.4, 3.4), r.r(18, 60)); }
}
WALLPROPS.ladder = function (g, S, p, I) {
  const { r, u0, len, Y } = I, cx = u0 + len / 2 + 10;
  g.fillStyle = css([6, 4, 12], .35); g.fillRect(cx - 15, Y(148), 38, 148);
  for (const sx of [cx - 12, cx + 8]) { const P = [[sx, Y(150)], [sx + 5, Y(150)], [sx + 5, Y(0)], [sx, Y(0)]]; paintPoly(g, P, [92, 90, 86], r, { n: 12, ang: 1.57, ink: false, edge: false }); prTexFill(g, P, 'streak', .9); prShade(g, P, sx, 0, sx + 5, 0, [[0, [10, 10, 20], .5], [.6, [255, 220, 170], .35], [1, [10, 10, 20], .5]]); ink(g, P, r, 1.1, null, .8); }
  for (let z = 12; z < 148; z += 16) { paintRect(g, cx - 12, Y(z), 25, 3.6, [118, 112, 102], r, { n: 3, ang: 0, ink: true, inkw: .9, edge: false }); g.fillStyle = css([255, 230, 190], .35); g.fillRect(cx - 7, Y(z), 14, .9); }
  for (const z of [30, 90, 140]) { g.fillStyle = css([40, 40, 42]); g.fillRect(cx - 16, Y(z) - 1, 4, 3); g.fillRect(cx + 13, Y(z) - 1, 4, 3); }
  g.fillStyle = css([8, 8, 12], .9); g.fillRect(cx - 24, Y(150), 48, 8);
  g.fillStyle = css([255, 210, 140], .1); g.fillRect(cx - 20, Y(150), 40, 40);
};
WALLPROPS.pennant = function (g, S, p, I) {
  const { r, u0, len, Y, v } = I, cols = [[170, 40, 40], [206, 170, 70], [50, 96, 88], [226, 216, 186]];
  const x0 = u0 + 6, x1 = u0 + Math.max(len, 64) - 6, y0 = Y(132);
  g.strokeStyle = css([40, 30, 26], .9); g.lineWidth = 1.4; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2, y0 + 20, x1, y0 + 2); g.stroke();
  prScrew(g, x0, y0, 1.6); prScrew(g, x1, y0 + 2, 1.6);
  const n = Math.max(4, Math.round((x1 - x0) / 11));
  for (let i = 0; i < n; i++) {
    const t = (i + .5) / n, x = lerp(x0, x1, t), y = y0 + Math.sin(t * Math.PI) * 10 + 2 * (1 - t) + 1, c = cols[(i + v) % 4], l = 18 + r() * 5, sw = (r() - .5) * 3;
    const P = [[x - 5.5, y], [x + 5.5, y], [x + sw, y + l]];
    paintPoly(g, P, c, r, { n: 4, sw: 2.5, ang: 1.57, ink: true, inkw: .9, edge: false });
    prShade(g, P, x - 5.5, 0, x + 5.5, 0, [[0, [10, 6, 16], .3], [.6, [255, 230, 190], .2], [1, [10, 6, 16], .25]]);
    if (i % 3 === 1) prBellGlyph(g, x, y + 6, 5, mul(c, .5), .7);
    if (r() < .25) { g.fillStyle = css([20, 12, 10], .35); g.fillRect(x - 2, y + l * .5, 3, 1); }
  }
};
WALLPROPS.loudspeaker = function (g, S, p, I) {
  const { r, u0, len, Y, v } = I, cx = u0 + len / 2, cy = Y(94);
  g.fillStyle = css([6, 4, 12], .3); g.beginPath(); g.ellipse(cx + 2, cy + 8, 24, 16, 0, 0, 7); g.fill();
  // bracket + conduit
  paintRect(g, cx - 4, cy - 2, 8, 24, [56, 54, 52], r, { n: 4, ink: true, inkw: 1, ang: 1.57, edge: false }); prScrew(g, cx, cy + 18, 1.4);
  g.strokeStyle = css(INK, .9); g.lineWidth = 2.4; g.beginPath(); g.moveTo(cx, cy + 20); g.quadraticCurveTo(cx - 3, cy + 50, cx - 2, Y(0)); g.stroke(); g.strokeStyle = css([40, 40, 42]); g.lineWidth = 1.4; g.stroke();
  // horn: driver can + flaring bell, painted grey-green enamel with rust
  const H0 = [[cx - 14, cy - 8], [cx + 6, cy - 8], [cx + 28, cy - 22], [cx + 28, cy + 20], [cx + 6, cy + 8], [cx - 14, cy + 8]];
  paintPoly(g, H0, [98, 104, 92], r, { n: 22, ang: 0, ink: false, edge: false, alt: [130, 136, 120] }); prTexFill(g, H0, 'streak', .8);
  prShade(g, H0, 0, cy - 22, 0, cy + 20, [[0, [255, 226, 180], .35], [.45, [0, 0, 0], 0], [1, [10, 12, 24], .5]]); ink(g, H0, r, 1.4, null, .85);
  paintRect(g, cx - 20, cy - 9, 8, 18, [60, 60, 58], r, { n: 3, ink: true, inkw: 1, ang: 1.57 });
  paintEll(g, cx + 28, cy - 1, 6.5, 21, [22, 20, 20], r, { n: 6, ink: true, inkw: 1.2 });
  g.strokeStyle = css([170, 164, 140], .55); g.lineWidth = 1.6; g.beginPath(); g.ellipse(cx + 28, cy - 1, 6.5, 21, 0, -1.6, 1.6); g.stroke();
  g.strokeStyle = css([120, 54, 22], .5); g.lineWidth = 1.6; g.beginPath(); g.moveTo(cx + 20, cy + 14); g.lineTo(cx + 19, cy + 30); g.stroke();
  if (v === 1) { g.fillStyle = css([255, 60, 40]); g.beginPath(); g.arc(cx - 16, cy - 12, 1.8, 0, 7); g.fill(); wallLight(S, p, I, cx - 16, 106, 24, [255, 60, 40], .4, .4, 'lamp'); }
};
WALLPROPS.portrait = function (g, S, p, I) {
  const { r, u0, len, Y, v } = I, cx = u0 + len / 2, fw = Math.min(len - 16, v === 1 ? 128 : 152), fh = v === 1 ? 92 : 112, top = Y(36 + fh), x0 = cx - fw / 2;
  wallShadow(g, x0, x0 + fw, top, top + fh, .45);
  // the whole framed painting is painted at true proportions, then mapped onto the wall
  prPic(g, x0, top, fw, fh, 'portrait' + v + ':' + (S.seed & 7), (cg, W, H) => paintFramedWarden(cg, W, H, RNG(77 + v), v), 1.35);
  // brass nameplate
  if (v !== 2) { paintRect(g, cx - 20, top + fh + 3, 40, 8, [206, 170, 90], r, { n: 4, ink: true, inkw: .9, ang: 0 }); prBlock(g, 'THE WARDEN', cx, top + fh + 7.4, 5.6, [40, 26, 10], 34); prScrew(g, cx - 17, top + fh + 7, .9); prScrew(g, cx + 17, top + fh + 7, .9); }
  else { // torn: chalk scrawl and paper scraps beneath
    g.strokeStyle = css([236, 236, 226], .55); g.lineWidth = 1.8; g.beginPath(); g.moveTo(cx - 24, top + fh + 10); g.lineTo(cx - 12, top + fh + 18); g.moveTo(cx - 12, top + fh + 10); g.lineTo(cx - 24, top + fh + 18); g.stroke();
    for (let k = 0; k < 3; k++) paintPoly(g, [[cx + k * 9, Y(3)], [cx + 6 + k * 9, Y(5)], [cx + 8 + k * 9, Y(1)], [cx + k * 9 + 1, Y(0)]], [200, 60, 48], r, { n: 2, ink: true, inkw: .6 });
  }
  if (v === 0) {   // picture lamp above the frame (a light emitter)
    const ly = top - 10; g.strokeStyle = css([60, 46, 30]); g.lineWidth = 2; g.beginPath(); g.moveTo(cx, top - 2); g.lineTo(cx, ly); g.stroke();
    paintPoly(g, [[cx - 22, ly - 3], [cx + 22, ly - 3], [cx + 18, ly + 4], [cx - 18, ly + 4]], [176, 138, 64], r, { n: 6, ink: true, inkw: 1, ang: 0, edge: false });
    g.fillStyle = css([255, 236, 180], .9); g.fillRect(cx - 16, ly + 3, 32, 1.6);
    const gl = g.createLinearGradient(0, ly + 4, 0, ly + 50); gl.addColorStop(0, 'rgba(255,214,140,.32)'); gl.addColorStop(1, 'rgba(255,214,140,0)'); g.fillStyle = gl; g.beginPath(); g.moveTo(cx - 18, ly + 4); g.lineTo(cx + 18, ly + 4); g.lineTo(cx + fw * .5, ly + 54); g.lineTo(cx - fw * .5, ly + 54); g.fill();
    wallLight(S, p, I, cx, 36 + fh + 8, 70, [255, 210, 140], .28, .03, 'lamp');
  }
};
function paintFramedWarden(g, W, H, r, v) {
  const fwid = v === 1 ? 11 : 15;   // frame width (design units, H = 200)
  const gold = v === 1 ? [70, 46, 30] : [190, 148, 66];
  // outer moulding with bevels
  g.fillStyle = css(mul(gold, .6)); g.fillRect(0, 0, W, H);
  for (let i = 0; i < 4; i++) {
    const k = i / 4, e = fwid * k, c = v === 1 ? mix(gold, [30, 20, 14], k * .5) : mix(gold, [255, 226, 140], (1 - Math.abs(k - .4) * 2) * .45);
    g.strokeStyle = css(c); g.lineWidth = fwid / 4 + .6; g.strokeRect(e + fwid / 8, e + fwid / 8, W - e * 2 - fwid / 4, H - e * 2 - fwid / 4);
  }
  for (let i = 0; i < 40; i++) bristle(g, r() * W, r() < .5 ? r() * fwid : H - r() * fwid, 0, 14, 3, jit(gold, r, .2), .35, r);
  // light from upper right: top & right of the frame catch it
  const lg = g.createLinearGradient(W, 0, 0, H); lg.addColorStop(0, 'rgba(255,236,180,.35)'); lg.addColorStop(.5, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(20,10,4,.45)'); g.fillStyle = lg; g.fillRect(0, 0, W, H);
  if (v !== 1) {   // corner rosettes + bead moulding
    for (const [x, y] of [[fwid * .5, fwid * .5], [W - fwid * .5, fwid * .5], [fwid * .5, H - fwid * .5], [W - fwid * .5, H - fwid * .5]]) { g.fillStyle = css([236, 200, 110]); g.beginPath(); for (let k = 0; k < 10; k++) { const a = k * .628, rr = k % 2 ? fwid * .22 : fwid * .42; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); g.fillStyle = css([120, 80, 30]); g.beginPath(); g.arc(x, y, fwid * .14, 0, 7); g.fill(); }
    g.fillStyle = css([255, 230, 150], .5); for (let x = fwid; x < W - fwid; x += 4) { g.beginPath(); g.arc(x, fwid - 2.4, .9, 0, 7); g.fill(); g.beginPath(); g.arc(x, H - fwid + 2.4, .9, 0, 7); g.fill(); }
    // chips in the gilt showing red bole and white gesso
    for (let i = 0; i < 9; i++) { const side = r.i(0, 3), t = r(); const x = side < 2 ? t * W : (side === 2 ? r() * fwid : W - r() * fwid), y = side < 2 ? (side ? H - r() * fwid : r() * fwid) : t * H; g.fillStyle = css(r() < .5 ? [150, 60, 40] : [226, 214, 190], .85); g.beginPath(); g.ellipse(x, y, 1 + r() * 2.4, .8 + r() * 1.6, r() * 3, 0, 7); g.fill(); }
  } else { g.strokeStyle = css([200, 160, 80], .8); g.lineWidth = 1.4; g.strokeRect(fwid - 2, fwid - 2, W - fwid * 2 + 4, H - fwid * 2 + 4); }
  // canvas
  const ix = fwid, iy = fwid, iw = W - fwid * 2, ih = H - fwid * 2;
  g.fillStyle = css([10, 6, 6]); g.fillRect(ix - 1.5, iy - 1.5, iw + 3, ih + 3);
  g.save(); g.beginPath(); g.rect(ix, iy, iw, ih); g.clip(); g.translate(ix, iy);
  wardenBust(g, 0, 0, iw, ih, r, v === 2, false);
  g.restore();
  // inner shadow from the frame lip
  const sh = g.createLinearGradient(ix, iy, ix + 8, iy + 8); sh.addColorStop(0, 'rgba(0,0,0,.55)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sh; g.fillRect(ix, iy, iw, 6); g.fillRect(ix, iy, 6, ih);
}
/* the canonical painting of the Warden: severe socialist-realist bust on red, rays, bell emblem.
 * Painted in a W x H box (any aspect). torn = slashed canvas revealing the hidden microphone. */
function wardenBust(g, x, y, w, h, r, torn, small) {
  g.save(); g.translate(x, y);
  const cx = w * .5, s = h * (small ? .46 : .47);    // s = head height
  // ---- background: oxblood red, sunburst of ochre rays from behind the head, dark lower field, skyline
  const bg = g.createRadialGradient(cx, h * .34, 4, cx, h * .45, Math.max(w, h) * .8); bg.addColorStop(0, css([196, 54, 40])); bg.addColorStop(.5, css([140, 28, 30])); bg.addColorStop(1, css([46, 10, 14])); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  prRays(g, cx, h * .36, h * 1.2, 26, [236, 170, 70], .16);
  prRays(g, cx, h * .36, h * 1.2, 13, [255, 220, 140], .07, .1, 6.38);
  for (let i = 0; i < 30; i++) bristle(g, r() * w, r() * h, r() * 3, h * .14, h * .035, r() < .5 ? [160, 34, 32] : [96, 18, 22], .22, r);
  prBellGlyph(g, cx, h * .3, h * .62, [40, 8, 12], .3);
  g.fillStyle = css([30, 8, 10], .85); let bx = -2; const sky = h * .86; while (bx < w) { const bw = h * r.r(.05, .1), bh = h * r.r(.03, .1); g.fillRect(bx, sky - bh, bw, h); if (r() < .3) { g.fillRect(bx + bw * .5, sky - bh - h * .1, 1.4, h * .1); g.beginPath(); g.moveTo(bx + bw * .5, sky - bh - h * .1); g.lineTo(bx + bw * .5 + h * .03, sky - bh - h * .12); g.lineTo(bx + bw * .5 + h * .03, sky - bh - h * .08); g.fill(); } bx += bw; }
  // ---- shoulders / greatcoat (olive drab), Sam Browne strap, epaulettes, medals
  const hy = h * .4, sy = hy + s * .56;
  const coat = [58, 66, 48], coatL = [104, 110, 76], coatD = [20, 24, 20];
  const body = [[-4, h + 4], [-2, sy + s * .34], [cx - s * .9, sy + s * .02], [cx - s * .3, sy - s * .1], [cx + s * .34, sy - s * .12], [cx + s * .95, sy + s * .04], [w + 2, sy + s * .36], [w + 4, h + 4]];
  paintPoly(g, body, coat, r, { n: 70, sw: h * .03, ang: .3, aj: .5, ink: false, edge: false, alt: coatL });
  g.save(); pathPoly(g, body); g.clip();
  const cl = g.createLinearGradient(0, 0, w, 0); cl.addColorStop(0, 'rgba(10,16,30,.55)'); cl.addColorStop(.5, 'rgba(0,0,0,0)'); cl.addColorStop(.75, 'rgba(255,200,130,.18)'); cl.addColorStop(1, 'rgba(10,10,20,.3)'); g.fillStyle = cl; g.fillRect(0, 0, w, h);
  g.fillStyle = css(coatD, .55); g.beginPath(); g.moveTo(cx - s * .02, sy); g.lineTo(cx + s * .1, h); g.lineTo(cx - s * .08, h); g.closePath(); g.fill();   // coat opening
  g.strokeStyle = css([40, 28, 20]); g.lineWidth = s * .09; g.beginPath(); g.moveTo(cx + s * .7, sy + s * .02); g.lineTo(cx - s * .5, h + 4); g.stroke();   // strap
  g.strokeStyle = css([120, 86, 50], .6); g.lineWidth = s * .02; g.beginPath(); g.moveTo(cx + s * .73, sy + s * .03); g.lineTo(cx - s * .46, h + 4); g.stroke();
  for (let k = 0; k < 3; k++) { g.fillStyle = css([214, 176, 84]); g.beginPath(); g.arc(cx + s * .05, sy + s * (.3 + k * .26), s * .035, 0, 7); g.fill(); }   // buttons
  // ribbons + medals on the (viewer's) left breast
  const mx = cx - s * .62, my = sy + s * .3;
  const rib = [[176, 36, 34], [226, 200, 90], [44, 80, 110], [176, 36, 34], [230, 220, 190], [60, 110, 80]];
  for (let k = 0; k < 6; k++) { g.fillStyle = css(rib[k]); g.fillRect(mx + (k % 3) * s * .13, my + Math.floor(k / 3) * s * .07, s * .12, s * .06); g.fillStyle = css([255, 255, 255], .25); g.fillRect(mx + (k % 3) * s * .13, my + Math.floor(k / 3) * s * .07, s * .12, s * .015); }
  for (let k = 0; k < 3; k++) { const ux = mx + s * (.05 + k * .14), uy = my + s * .26; g.strokeStyle = css([150, 30, 30]); g.lineWidth = s * .04; g.beginPath(); g.moveTo(ux, uy - s * .1); g.lineTo(ux, uy); g.stroke(); g.fillStyle = css([226, 186, 90]); g.beginPath(); for (let j = 0; j < 10; j++) { const a = j * .628 - 1.57, rr = j % 2 ? s * .025 : s * .055; g.lineTo(ux + Math.cos(a) * rr, uy + s * .04 + Math.sin(a) * rr); } g.fill(); }
  g.restore();
  for (const sd of [-1, 1]) {   // epaulettes with fringe
    const ex = cx + sd * s * .78, ey = sy + s * .02;
    paintPoly(g, [[ex - s * .22, ey - s * .02], [ex + s * .22, ey + s * .04 * sd], [ex + s * .2, ey + s * .13], [ex - s * .2, ey + s * .1]], [200, 156, 66], r, { n: 10, ink: true, inkw: 1, edge: false, alt: [250, 220, 140] });
    for (let k = 0; k < 7; k++) { g.strokeStyle = css([214, 170, 80], .9); g.lineWidth = 1.2; g.beginPath(); g.moveTo(ex - s * .18 + k * s * .06, ey + s * .11); g.lineTo(ex - s * .19 + k * s * .06, ey + s * .22); g.stroke(); }
  }
  // high stiff collar with red tabs
  const col = [[cx - s * .42, sy - s * .14], [cx - s * .06, sy + s * .1], [cx + s * .3, sy - s * .16], [cx + s * .36, sy + s * .14], [cx - s * .04, sy + s * .3], [cx - s * .48, sy + s * .12]];
  paintPoly(g, col, [44, 52, 38], r, { n: 16, ink: true, inkw: 1.2, edge: false, alt: [90, 98, 70] });
  for (const sd of [-1, 1]) { g.fillStyle = css([186, 30, 30]); g.beginPath(); g.moveTo(cx + sd * s * .14, sy + s * .12); g.lineTo(cx + sd * s * .36, sy + s * .04); g.lineTo(cx + sd * s * .38, sy + s * .13); g.lineTo(cx + sd * s * .16, sy + s * .2); g.fill(); }
  // ---- head: three-quarter, turned to the viewer's left, chin raised; hard key light from upper right
  const nx = cx - s * .06;   // facial centre line
  const neck = [[cx - s * .17, hy + s * .3], [cx + s * .24, hy + s * .24], [cx + s * .26, sy - s * .02], [cx - s * .2, sy + s * .02]];
  paintPoly(g, neck, [150, 106, 84], r, { n: 10, ink: false, edge: false }); prShade(g, neck, 0, hy + s * .3, 0, sy, [[0, [40, 20, 30], .6], [1, [40, 20, 30], .1]]);
  const head = [[cx - s * .27, hy - s * .22], [cx - s * .29, hy + s * .02], [cx - s * .25, hy + s * .24], [cx - s * .15, hy + s * .42], [cx - s * .04, hy + s * .49], [cx + s * .1, hy + s * .46], [cx + s * .26, hy + s * .3], [cx + s * .33, hy + s * .04], [cx + s * .32, hy - s * .24]];
  const skL = [228, 176, 134], skM = [182, 124, 96], skS = [104, 66, 72], skD = [54, 34, 44];
  paintPoly(g, head, skM, r, { n: 50, sw: s * .05, ang: 1.3, aj: .4, ink: false, edge: false, alt: [196, 140, 108] });
  g.save(); pathPoly(g, head); g.clip();
  // planes: lit right cheek/temple, lit forehead + nose ridge, shadowed left side, cheek hollow, jaw underside
  g.filter = 'blur(' + (s * .012).toFixed(2) + 'px)';
  const plane = (pts, col, a) => { g.fillStyle = css(col, a); pathPoly(g, pts.map(q => [q[0], q[1]])); g.fill(); for (let i = 0; i < 6; i++) { const q = pts[i % pts.length]; bristle(g, q[0] * .5 + (pts[(i + 1) % pts.length][0]) * .5, q[1] * .5 + pts[(i + 1) % pts.length][1] * .5, 1.2, s * .12, s * .04, col, a * .5, r); } };
  plane([[nx + s * .04, hy - s * .25], [cx + s * .34, hy - s * .26], [cx + s * .34, hy + s * .02], [cx + s * .24, hy + s * .12], [nx + s * .12, hy + s * .02], [nx + s * .02, hy - s * .1]], skL, .85);
  plane([[nx + s * .14, hy + s * .1], [cx + s * .3, hy + s * .1], [cx + s * .26, hy + s * .28], [nx + s * .18, hy + s * .28]], mix(skL, skM, .4), .8);
  plane([[cx - s * .3, hy - s * .25], [nx - s * .06, hy - s * .24], [nx - s * .1, hy + s * .12], [nx - s * .1, hy + s * .4], [cx - s * .3, hy + s * .3]], skS, .75);
  plane([[nx + s * .2, hy + s * .14], [cx + s * .3, hy + s * .12], [nx + s * .16, hy + s * .3]], mix(skS, skM, .4), .55);   // cheek hollow under the cheekbone
  plane([[cx - s * .3, hy + s * .34], [nx, hy + s * .4], [cx + s * .3, hy + s * .3], [cx + s * .3, hy + s * .6], [cx - s * .3, hy + s * .6]], skD, .5);   // jaw underside
  g.filter = 'none';
  // cool reflected fill on the shadow side of the jaw (teal bounce)
  g.strokeStyle = css([90, 140, 150], .35); g.lineWidth = s * .03; g.beginPath(); g.moveTo(cx - s * .28, hy + s * .05); g.quadraticCurveTo(cx - s * .26, hy + s * .3, cx - s * .12, hy + s * .44); g.stroke();
  // eye sockets in deep shadow under the visor
  for (const ex of [nx - s * .15, nx + s * .14]) { g.fillStyle = css(skD, .55); g.beginPath(); g.ellipse(ex, hy - s * .03, s * .1, s * .055, 0, 0, 7); g.fill(); }
  // nose: lit ridge, shadow side, nostril
  g.fillStyle = css(skL, .9); g.beginPath(); g.moveTo(nx + s * .005, hy - s * .1); g.lineTo(nx + s * .035, hy - s * .1); g.lineTo(nx + s * .02, hy + s * .17); g.lineTo(nx - s * .02, hy + s * .17); g.fill();
  g.fillStyle = css(skS, .85); g.beginPath(); g.moveTo(nx - s * .005, hy - s * .08); g.lineTo(nx - s * .04, hy + s * .19); g.lineTo(nx - s * .13, hy + s * .21); g.lineTo(nx - s * .07, hy + s * .06); g.fill();
  g.fillStyle = css(skD, .9); g.beginPath(); g.ellipse(nx - s * .04, hy + s * .205, s * .035, s * .014, -.2, 0, 7); g.fill();
  g.fillStyle = css(skD, .7); g.beginPath(); g.moveTo(nx - s * .12, hy + s * .22); g.lineTo(nx + s * .06, hy + s * .21); g.lineTo(nx, hy + s * .24); g.fill();
  // nasolabial folds, mouth set hard, lit lower lip, chin cleft
  g.strokeStyle = css(skS, .75); g.lineWidth = s * .018; g.lineCap = 'round'; g.beginPath(); g.moveTo(nx - s * .11, hy + s * .2); g.quadraticCurveTo(nx - s * .17, hy + s * .28, nx - s * .15, hy + s * .34); g.moveTo(nx + s * .1, hy + s * .2); g.quadraticCurveTo(nx + s * .16, hy + s * .27, nx + s * .14, hy + s * .33); g.stroke();
  g.strokeStyle = css([60, 26, 30], .95); g.lineWidth = s * .022; g.beginPath(); g.moveTo(nx - s * .12, hy + s * .31); g.lineTo(nx + s * .11, hy + s * .3); g.stroke();
  g.strokeStyle = css(skL, .6); g.lineWidth = s * .014; g.beginPath(); g.moveTo(nx - s * .06, hy + s * .335); g.lineTo(nx + s * .07, hy + s * .33); g.stroke();
  g.strokeStyle = css(skS, .5); g.lineWidth = s * .012; g.beginPath(); g.moveTo(nx + s * .0, hy + s * .4); g.lineTo(nx + s * .01, hy + s * .45); g.stroke();
  // grey temples, ear
  for (let i = 0; i < 10; i++) bristle(g, cx + s * (.25 + r() * .07), hy - s * (.05 + r() * .16), 1.4, s * .07, s * .02, r() < .5 ? [150, 146, 140] : [90, 86, 84], .8, r);
  g.restore();
  const ear = ellPts(cx + s * .32, hy + s * .04, s * .055, s * .12, 10, -.1);
  paintPoly(g, ear, skM, r, { n: 6, ink: true, inkw: 1, edge: false }); g.strokeStyle = css(skS, .8); g.lineWidth = 1; g.beginPath(); g.ellipse(cx + s * .32, hy + s * .05, s * .025, s * .07, -.1, -1, 2); g.stroke();
  ink(g, head, r, Math.max(1.2, s * .018), [30, 12, 16], .8);
  // eyes: narrow, pale, staring straight out of the canvas (they follow you)
  for (const [ex, ew] of [[nx - s * .15, s * .07], [nx + s * .14, s * .075]]) {
    const ey = hy - s * .02;
    g.fillStyle = css([210, 196, 176]); g.beginPath(); g.moveTo(ex - ew, ey); g.quadraticCurveTo(ex, ey - s * .032, ex + ew, ey - s * .004); g.quadraticCurveTo(ex, ey + s * .026, ex - ew, ey); g.fill();
    g.fillStyle = css([96, 118, 124]); g.beginPath(); g.arc(ex + s * .005, ey - s * .002, s * .021, 0, 7); g.fill();
    g.fillStyle = css([12, 10, 12]); g.beginPath(); g.arc(ex + s * .005, ey - s * .002, s * .01, 0, 7); g.fill();
    g.fillStyle = css([255, 250, 236], .95); g.fillRect(ex + s * .012, ey - s * .016, s * .008, s * .008);
    g.strokeStyle = css([30, 14, 16], .95); g.lineWidth = s * .016; g.beginPath(); g.moveTo(ex - ew, ey); g.quadraticCurveTo(ex, ey - s * .034, ex + ew, ey - s * .004); g.stroke();
    // heavy straight brows, angled down toward the nose
    g.strokeStyle = css([40, 32, 30]); g.lineWidth = s * .035; g.beginPath(); g.moveTo(ex - ew * 1.2, ey - s * .075 - (ex < nx ? -s * .0 : s * .012)); g.lineTo(ex + ew * 1.1, ey - s * .06 + (ex < nx ? s * .012 : 0)); g.stroke();
  }
  // ---- peaked cap: olive crown, red band, gold bell badge, black lacquered visor with a hard highlight
  const ct = hy - s * .62;
  const crown = [[cx - s * .44, hy - s * .3], [cx - s * .48, ct + s * .08], [cx - s * .2, ct - s * .04], [cx + s * .22, ct - s * .05], [cx + s * .52, ct + s * .06], [cx + s * .44, hy - s * .32]];
  paintPoly(g, crown, [64, 72, 52], r, { n: 30, ink: true, inkw: 1.4, edge: false, alt: [104, 110, 78], lit: [[150, 150, 100], [20, 24, 20], -.3, .45, .55] });
  const band = [[cx - s * .38, hy - s * .34], [cx + s * .42, hy - s * .36], [cx + s * .4, hy - s * .22], [cx - s * .34, hy - s * .2]];
  paintPoly(g, band, [168, 30, 30], r, { n: 12, ink: true, inkw: 1.1, edge: false, alt: [210, 60, 50], lit: [[255, 160, 120], [60, 10, 10], 0, .3, .4] });
  prBellGlyph(g, nx + s * .02, hy - s * .4, s * .16, [222, 182, 84]); g.fillStyle = css([255, 236, 170], .7); g.fillRect(nx + s * .04, hy - s * .46, s * .015, s * .06);
  g.strokeStyle = css([214, 176, 84]); g.lineWidth = s * .015; g.beginPath(); g.moveTo(cx - s * .34, hy - s * .23); g.quadraticCurveTo(nx, hy - s * .19, cx + s * .38, hy - s * .25); g.stroke();
  const visor = [[cx - s * .4, hy - s * .23], [cx + s * .38, hy - s * .26], [cx + s * .3, hy - s * .14], [nx, hy - s * .08], [cx - s * .34, hy - s * .15]];
  paintPoly(g, visor, [16, 14, 16], r, { n: 8, ink: true, inkw: 1.2, edge: false });
  g.strokeStyle = css([230, 220, 210], .6); g.lineWidth = s * .014; g.beginPath(); g.moveTo(nx - s * .05, hy - s * .12); g.quadraticCurveTo(cx + s * .16, hy - s * .14, cx + s * .3, hy - s * .19); g.stroke();
  g.fillStyle = css([20, 10, 16], .35); g.beginPath(); g.moveTo(cx - s * .3, hy - s * .14); g.lineTo(cx + s * .3, hy - s * .16); g.lineTo(cx + s * .3, hy - s * .07); g.quadraticCurveTo(nx, hy - s * .01, cx - s * .28, hy - s * .07); g.fill();   // visor shadow on the brow
  // rim light: hot orange along the right edge of face and coat
  g.strokeStyle = css([255, 170, 90], .55); g.lineWidth = s * .02; g.beginPath(); g.moveTo(cx + s * .33, hy - s * .2); g.lineTo(cx + s * .34, hy + s * .04); g.lineTo(cx + s * .26, hy + s * .3); g.stroke();
  // ---- slogan ribbon across the foot of the canvas
  if (!small) {
    const ry = h * .88, rh = h * .1;
    g.fillStyle = css([18, 8, 8], .5); g.fillRect(0, ry + 2, w, rh);
    paintPoly(g, [[-2, ry], [w + 2, ry - 2], [w + 2, ry + rh - 2], [-2, ry + rh]], [226, 210, 170], r, { n: 16, ink: true, inkw: 1, edge: false, alt: [246, 236, 210] });
    prBlock(g, 'THE WARDEN HEARS', cx, ry + rh * .52, rh * .72, [150, 26, 26], w * .86);
  }
  // varnish, craquelure, soot from the stove
  prAge(g, w, h, r, small ? .6 : .9, true);
  if (!small) { g.strokeStyle = 'rgba(30,16,8,.18)'; g.lineWidth = .6; for (let i = 0; i < 40; i++) { let px = r() * w, py = r() * h; g.beginPath(); g.moveTo(px, py); for (let k = 0; k < 3; k++) { px += (r() - .5) * 10; py += (r() - .5) * 10; g.lineTo(px, py); } g.stroke(); } }
  if (torn) {
    // a diagonal slash through the face: curled flaps, raw canvas, the dark cavity and the hidden microphone
    const rip = [[w * .3, -2], [w * .5, h * .2], [w * .4, h * .38], [w * .6, h * .56], [w * .5, h * .76], [w * .64, h + 2], [w * .86, h + 2], [w * .76, h * .7], [w * .82, h * .5], [w * .66, h * .3], [w * .76, h * .1], [w * .62, -2]];
    g.fillStyle = css([12, 8, 10]); pathPoly(g, rip); g.fill();
    g.save(); pathPoly(g, rip); g.clip();
    const cav = g.createRadialGradient(w * .6, h * .42, 2, w * .6, h * .42, h * .4); cav.addColorStop(0, 'rgba(60,50,46,1)'); cav.addColorStop(1, 'rgba(8,6,8,1)'); g.fillStyle = cav; g.fillRect(0, 0, w, h);
    g.fillStyle = css([150, 120, 90], .4); g.fillRect(w * .5, 0, 1.5, h); g.fillRect(0, h * .62, w, 1.5);   // stretcher bars
    const mx2 = w * .62, my2 = h * .42, mr = h * .1;
    g.fillStyle = css([70, 70, 74]); g.beginPath(); g.arc(mx2, my2, mr + 2, 0, 7); g.fill(); g.fillStyle = css([120, 120, 124]); g.beginPath(); g.arc(mx2, my2, mr, 0, 7); g.fill();
    g.strokeStyle = css([30, 30, 34]); g.lineWidth = 1; for (let k = -4; k <= 4; k++) { const yy = my2 + k * mr / 4.5, hw2 = Math.sqrt(Math.max(0, mr * mr - (k * mr / 4.5) ** 2)); g.beginPath(); g.moveTo(mx2 - hw2, yy); g.lineTo(mx2 + hw2, yy); g.stroke(); }
    g.fillStyle = css([255, 236, 200], .7); g.beginPath(); g.arc(mx2 - mr * .4, my2 - mr * .45, 2, 0, 7); g.fill();
    g.strokeStyle = css([20, 20, 22]); g.lineWidth = 2.6; g.beginPath(); g.moveTo(mx2, my2 + mr); g.quadraticCurveTo(mx2 + 10, h * .7, mx2 - 4, h + 4); g.stroke();
    g.fillStyle = css([255, 50, 40]); g.beginPath(); g.arc(mx2 + mr + 5, my2 - mr, 2.2, 0, 7); g.fill();
    g.restore();
    g.strokeStyle = css([236, 224, 196], .8); g.lineWidth = 1.6; pathPoly(g, rip); g.stroke();   // raw canvas fibres at the edge
    g.strokeStyle = css([20, 10, 12], .9); g.lineWidth = .8; g.stroke();
    // curled flaps: painted side + pale back of canvas
    paintPoly(g, [[w * .3, -2], [w * .5, h * .2], [w * .34, h * .26], [w * .2, h * .06]], [214, 196, 160], r, { n: 6, ink: true, inkw: 1, edge: false });
    paintPoly(g, [[w * .4, h * .38], [w * .6, h * .56], [w * .44, h * .6], [w * .3, h * .44]], [150, 104, 84], r, { n: 6, ink: true, inkw: 1, edge: false });
    paintPoly(g, [[w * .64, h + 2], [w * .86, h + 2], [w * .94, h * .86], [w * .76, h * .9]], [128, 34, 34], r, { n: 6, ink: true, inkw: 1, edge: false });
    // chalk tally / scrawl by a vandal
    g.strokeStyle = css([240, 240, 230], .6); g.lineWidth = 2.2; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(w * .1 + k * 5, h * .62); g.lineTo(w * .12 + k * 5, h * .74); g.stroke(); } g.beginPath(); g.moveTo(w * .08, h * .72); g.lineTo(w * .3, h * .64); g.stroke();
  }
  g.restore();
}
/* kept for callers elsewhere (ending tableaux): paints the Warden painting into (x,y,w,h) */
function wardenFace(g, x, y, w, h, r, v) {
  prPic(g, x, y, w, h, 'wface' + v, (cg, W, H) => wardenBust(cg, 0, 0, W, H, RNG(91 + (v | 0)), v === 2, false), 1.3);
}
WALLPROPS.banner = function (g, S, p, I) {
  const { r, u0, len, Y, v } = I, cx = u0 + len / 2, bw = Math.min(len - 14, 176), bh = 96, top = Y(32 + bh + 6), x0 = cx - bw / 2;
  const label = (p.label && /^[A-Z ,.'!-]+$/.test(p.label) && p.label.length > 5) ? p.label : UN_SLOGANS[(v + (S.seed & 3)) % 4];
  wallShadow(g, x0, x0 + bw, top, top + bh, .4);
  // pole + cords
  paintRect(g, x0 - 8, top - 7, bw + 16, 6, [90, 64, 36], r, { n: 8, ink: true, inkw: 1.1, ang: 0, edge: false }); for (const ex of [x0 - 9, x0 + bw + 9]) { g.fillStyle = css([214, 176, 84]); g.beginPath(); g.arc(ex, top - 4, 3.4, 0, 7); g.fill(); g.strokeStyle = css(INK, .8); g.lineWidth = .9; g.stroke(); }
  g.strokeStyle = css([60, 40, 30], .8); g.lineWidth = 1; g.beginPath(); g.moveTo(x0 + 10, top - 4); g.lineTo(cx, top - 26); g.lineTo(x0 + bw - 10, top - 4); g.stroke(); prScrew(g, cx, top - 26, 1.8);
  const bot = top + bh;
  const pts = [[x0, top], [x0 + bw, top], [x0 + bw + (r() - .5) * 3, bot - 8], [x0 + bw * .82, bot + 2], [x0 + bw * .5, bot - 8], [x0 + bw * .18, bot + 3], [x0, bot - 6]];
  const kinds = ['bell', 'march', 'text', 'ear'];
  g.save(); pathPoly(g, pts, r, 1.5); g.clip();
  prPic(g, x0, top, bw, bh + 6, 'banner' + v + label, (cg, W, H) => {
    const rr = RNG(hashStr(label) + v), pal = [UN.red, UN.olive, UN.cream, UN.deep][v], dark = lum(pal) < 120, fg = dark ? UN.cream : UN.red;
    cg.fillStyle = css(pal); cg.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) bristle(cg, rr() * W, rr() * H, 1.57 + rr.g() * .1, H * .6, 10, jit(pal, rr, .1), .3, rr);
    // hand-painted: big emblem disc on one side, two lines of lettering, border
    const kind = kinds[v], wide = W / H > 1.6, eR = wide ? H * .3 : H * .2, ex = wide ? W * .17 : W * .5, ey = wide ? H * .44 : H * .3;
    if (kind === 'march') { cg.fillStyle = css(UN.ochre, .9); cg.beginPath(); cg.moveTo(0, H * .8); cg.lineTo(W, H * .3); cg.lineTo(W, H * .5); cg.lineTo(0, H); cg.fill(); }
    cg.fillStyle = css(dark ? UN.cream : UN.red); cg.beginPath(); cg.arc(ex, ey, eR, 0, 7); cg.fill();
    prRays(cg, ex, ey, eR * .95, 16, dark ? UN.red : UN.cream, .5);
    prBellGlyph(cg, ex, ey, eR * 1.2, dark ? UN.ink : UN.cream);
    const words = label.split(' '), lines = words.length > 2 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [label];
    if (wide) lines.forEach((ln, i) => handText(cg, ln, W * .6, H * (lines.length > 1 ? .3 + i * .3 : .45), H * .26, fg, rr, W * .6, { shadow: [0, 0, 0, 0], drip: v === 3 }));
    else lines.forEach((ln, i) => handText(cg, ln, W * .5, H * (lines.length > 1 ? .6 + i * .17 : .66), H * .15, fg, rr, W * .82, { shadow: [0, 0, 0, 0], drip: v === 3 }));
    cg.strokeStyle = css(UN.ochre, .9); cg.lineWidth = H * .03; cg.strokeRect(H * .05, H * .05, W - H * .1, H * .8);
    prAge(cg, W, H, rr, .8);
  }, 1.1);
  // fabric folds: vertical light/shadow bands, sag between the cords
  for (let i = 0; i < 5; i++) { const fx = x0 + (i + .5) * bw / 5; const gr = g.createLinearGradient(fx - bw / 10, 0, fx + bw / 10, 0); gr.addColorStop(0, 'rgba(10,6,16,.22)'); gr.addColorStop(.5, 'rgba(255,220,170,.1)'); gr.addColorStop(1, 'rgba(10,6,16,.22)'); g.fillStyle = gr; g.fillRect(fx - bw / 10, top, bw / 5, bh + 6); }
  g.restore();
  g.strokeStyle = css(INK, .8); g.lineWidth = 1.3; pathPoly(g, pts, r, 1.5); g.stroke();
  // tears / mildew
  if (v === 3 || r() < .3) { g.fillStyle = css([20, 12, 12], .8); g.beginPath(); g.moveTo(x0 + bw * .7, bot - 6); g.lineTo(x0 + bw * .74, bot - 30); g.lineTo(x0 + bw * .77, bot - 4); g.fill(); }
};
WALLPROPS.notice = function (g, S, p, I) {
  const { r, u0, len, Y, v } = I, cx = u0 + len / 2, bw = Math.min(len - 10, 144), bh = v === 1 ? 62 : 80, top = Y(44 + bh), x0 = cx - bw / 2;
  wallShadow(g, x0, x0 + bw, top, top + bh, .4);
  paintRect(g, x0 - 5, top - 5, bw + 10, bh + 10, [108, 70, 40], r, { n: 30, ink: true, inkw: 1.4, ang: 0, edge: false }); prBevel(g, x0 - 5, top - 5, bw + 10, bh + 10);
  const CB = [[x0, top], [x0 + bw, top], [x0 + bw, top + bh], [x0, top + bh]];
  paintPoly(g, CB, v === 2 ? [66, 96, 74] : [156, 112, 74], r, { n: 50, sw: 3, ang: .3, aj: 1, ink: true, inkw: 1, alt: v === 2 ? [90, 120, 96] : [110, 76, 46], edge: false });
  prTexFill(g, CB, 'speck', .9); prTexFill(g, CB, 'grime', .6);
  // pin holes from years of notices
  for (let i = 0; i < 30; i++) { g.fillStyle = css([20, 12, 8], .5); g.fillRect(x0 + r() * bw, top + r() * bh, 1, 1); }
  // a printed propaganda sheet, typed orders, a photo, hand-written appeals, a red-stamped list
  const n = v === 1 ? 4 : 7;
  const slots = [];
  for (let i = 0; i < n; i++) {
    const big = i === 0, pw = big ? Math.min(40, bw * .32) : r.r(18, 30), ph = big ? bh * .78 : r.r(18, 30);
    const px = big ? x0 + 6 : x0 + 8 + r() * (bw - pw - 14), py = big ? top + 6 : top + 4 + r() * (bh - ph - 6); slots.push([px, py, pw, ph]);
    if (big) { g.save(); g.translate(px + pw / 2, py + ph / 2); g.rotate(-.02); const rr = RNG(S.seed + 7); prPic(g, -pw / 2, -ph / 2, pw, ph, 'nb' + (S.seed & 3) + v, (cg, W, H) => prPoster(cg, W, H, rr, v === 2 ? 'pupil' : 'ear', { text: 'REPORT IDLE TALK' }), 1.2); g.strokeStyle = css(INK, .6); g.lineWidth = .8; g.strokeRect(-pw / 2, -ph / 2, pw, ph); g.fillStyle = css([190, 40, 40]); g.beginPath(); g.arc(0, -ph / 2 + 2, 1.7, 0, 7); g.fill(); g.restore(); continue; }
    const k = r();
    if (k < .2) {   // photo
      g.save(); g.translate(px + pw / 2, py + ph / 2); g.rotate((r() - .5) * .3); g.fillStyle = css([236, 230, 214]); g.fillRect(-9, -8, 18, 16); g.fillStyle = css([70, 66, 60]); g.fillRect(-7.5, -6.5, 15, 11); g.fillStyle = css([150, 140, 120]); g.beginPath(); g.arc(0, -2, 2.6, 0, 7); g.fill(); g.fillRect(-4, 1, 8, 4); g.fillStyle = css([230, 220, 170], .6); g.fillRect(-4, -9.5, 8, 3); g.restore();
    } else prPinnedPaper(g, r, px, py, pw, ph, (r() - .5) * .18, { kind: k < .6 ? 'type' : 'hand', head: r() < .5 ? [160, 30, 30] : [30, 24, 24], stamp: r() < .35, tape: r() < .2, pin: r.p([[190, 40, 40], [40, 90, 160], [220, 190, 60]]) });
  }
  // a length of red string between two pins (somebody's been thinking)
  if (v !== 1) { const a = slots[1] || [x0 + 20, top + 20], b = slots[n - 1] || [x0 + bw - 20, top + 40]; g.strokeStyle = css([200, 40, 40], .75); g.lineWidth = .9; g.beginPath(); g.moveTo(a[0] + 4, a[1] + 3); g.quadraticCurveTo((a[0] + b[0]) / 2, Math.max(a[1], b[1]) + 10, b[0] + 4, b[1] + 3); g.stroke(); }
  prPlate(g, r, cx - 26, top - 14, 52, 9, v === 2 ? 'DORMITORY ORDERS' : 'NOTICES', [30, 52, 86], [236, 228, 206]);
};
WALLPROPS.chalkboard = function (g, S, p, I) {
  const { r, u0, len, Y, v } = I, cx = u0 + len / 2, bw = Math.min(len - 10, 124), bh = 74, top = Y(40 + bh), x0 = cx - bw / 2;
  wallShadow(g, x0, x0 + bw, top, top + bh, .4);
  paintRect(g, x0 - 5, top - 5, bw + 10, bh + 10, [118, 82, 48], r, { n: 24, ink: true, inkw: 1.4, ang: 0, edge: false }); prBevel(g, x0 - 5, top - 5, bw + 10, bh + 10);
  const B = [[x0, top], [x0 + bw, top], [x0 + bw, top + bh], [x0, top + bh]];
  paintPoly(g, B, [34, 46, 42], r, { n: 50, sw: 6, ang: .2, aj: 1, alt: [70, 84, 78], ink: true, inkw: 1, jv: .08, edge: false });
  // old erased chalk ghosts
  g.save(); g.globalAlpha = .1; for (let i = 0; i < 14; i++) bristle(g, x0 + r() * bw, top + r() * bh, r.g() * .3, 30, 8, [220, 220, 210], .8, r); g.restore();
  chalkMenu(g, r, x0, top, bw, bh, p.label);
  paintRect(g, x0 - 3, top + bh + 3, bw + 6, 4, [98, 66, 38], r, { n: 4, ink: true, inkw: 1, ang: 0 });   // chalk ledge
  g.fillStyle = css([236, 232, 220]); g.fillRect(x0 + bw * .7, top + bh + 1.5, 6, 2); g.fillStyle = css([200, 70, 60]); g.fillRect(x0 + bw * .2, top + bh + 1.5, 4, 2);
};
function chalkMenu(g, r, x0, top, bw, bh, label) {
  const ch = [236, 232, 214], fam = '"Comic Sans MS","Segoe Print","Chalkboard SE",cursive';
  handText(g, (label && /menu/i.test(label)) ? 'MENU' : 'TODAY', x0 + bw / 2, top + bh * .15, bh * .17, ch, r, bw - 20, { shadow: [0, 0, 0, 0], family: fam, font: 'bold' });
  const items = ['CABBAGE SOUP ..... 2', 'BREAD (GREY) ...... 1', 'TEA (RATION) ...... 1', 'NO SECONDS'];
  g.fillStyle = css(ch, .8);
  for (let i = 0; i < items.length; i++) { g.font = Math.round(bh * .11) + 'px ' + fam; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.save(); g.translate(x0 + bw * .07, top + bh * (.38 + i * .15)); g.rotate((r() - .5) * .03); if (i === 3) g.fillStyle = css([236, 140, 120], .85); g.fillText(items[i], 0, 0); g.restore(); }
  g.strokeStyle = css(ch, .7); g.lineWidth = 1.2; g.beginPath(); g.moveTo(x0 + bw * .07, top + bh * .25); g.lineTo(x0 + bw * .88, top + bh * .26); g.stroke();
  prBellGlyph(g, x0 + bw * .88, top + bh * .14, bh * .14, ch, .5);
  g.fillStyle = css(ch, .07); g.fillRect(x0, top + bh * .6, bw, bh * .4);
}
WALLPROPS.mirror = function (g, S, p, I) {
  const { r, u0, len, Y } = I, cx = u0 + len / 2, bw = 52, bh = 88, top = Y(30 + bh), x0 = cx - bw / 2;
  wallShadow(g, x0, x0 + bw, top, top + bh, .4);
  paintRect(g, x0 - 5, top - 5, bw + 10, bh + 10, [96, 68, 40], r, { n: 24, ink: true, inkw: 1.3, ang: 1.57, edge: false }); prBevel(g, x0 - 5, top - 5, bw + 10, bh + 10);
  const gr = g.createLinearGradient(x0, top, x0 + bw, top + bh); gr.addColorStop(0, css([176, 192, 190])); gr.addColorStop(1, css([56, 76, 88])); g.fillStyle = gr; g.fillRect(x0, top, bw, bh);
  prTexFill(g, [[x0, top], [x0 + bw, top], [x0 + bw, top + bh], [x0, top + bh]], 'grime', 1);
  g.fillStyle = css([40, 30, 20], .25); g.fillRect(x0, top + bh - 14, bw, 14);   // de-silvering
  g.strokeStyle = css([20, 24, 28], .85); g.lineWidth = 1.1; g.beginPath(); g.moveTo(x0 + 10, top); g.lineTo(x0 + 26, top + 30); g.lineTo(x0 + 18, top + 60); g.lineTo(x0 + 40, bh + top); g.moveTo(x0 + 26, top + 30); g.lineTo(x0 + 52, top + 24); g.stroke();
  g.fillStyle = css([255, 255, 255], .22); g.beginPath(); g.moveTo(x0 + 4, top + bh - 10); g.lineTo(x0 + 14, top + 4); g.lineTo(x0 + 20, top + 4); g.lineTo(x0 + 10, top + bh - 10); g.fill();
};

/* ================================================== FREE-STANDING PROPS */
const PROPS = {};         // sprite props:  (g,S,p,I)
const FLAT = {};          // painted straight into the baked floor layer
const PH = { counter: 100, table: 80, bench: 90, stool: 70, plant: 120, pillar: 170, chair: 90, desk: 110, boiler: 210, statue: 240, crate: 80, lamp: 170, loudspeaker: 250, sack: 60, barrel: 90, mic: 100, sofa: 90, cart: 90, tray: 50, tree: 290, bell: 150, hoop: 190, fence: 100, chalkboard: 110, mirror: 130, door: 100, ladder: 100, bookshelf: 130, lockers: 100, vault: 100, pipes: 100, window: 100, banner: 100, curtain: 100, pennant: 100, portrait: 100, notice: 100, radiator: 70 };
const PEX = { tree: 110, plant: 24, statue: 30, loudspeaker: 24, boiler: 40, lamp: 40, hoop: 30, bell: 20 };
const SUPPORT_Z = { counter: 44, table: 34, desk: 40, crate: 32, bench: 22, boiler: 0 };

/* ---- surface clutter (u,v tile coords, z = surface height) ---- */
function prCup(g, S, r, u, v, z, col, o) {   // chipped enamel mug
  o = o || {}; col = C(col || r.p([[226, 222, 206], [96, 130, 160], [200, 90, 70], [120, 150, 110]]));
  const c = cylBody(g, S, r, u, v, o.rad || .075, z, z + (o.h || 9), col, { ink: true, sw: 1.5, inkw: .9, top: false, spec: .5 });
  const q = gp(S, u, v, z + (o.h || 9));
  g.fillStyle = css([30, 20, 16]); g.beginPath(); g.ellipse(q[0], q[1], c.rx - .6, c.ry - .4, 0, 0, 7); g.fill();
  g.fillStyle = css(o.liq || [110, 64, 30], .9); g.beginPath(); g.ellipse(q[0], q[1] + .6, c.rx - 1.4, c.ry - 1, 0, 0, 7); g.fill();
  g.strokeStyle = css(mul(col, 1.1)); g.lineWidth = 1.1; g.beginPath(); g.ellipse(q[0], q[1], c.rx, c.ry, 0, 0, 7); g.stroke();
  g.strokeStyle = css(INK, .8); g.lineWidth = 1.6; g.beginPath(); g.arc(q[0] + c.rx + .6, q[1] + 4, 2.6, -1.4, 1.4); g.stroke(); g.strokeStyle = css(col); g.lineWidth = 1; g.stroke();
  if (r() < .5) { g.fillStyle = css([30, 30, 40], .9); g.fillRect(q[0] - 2 + r() * 3, q[1] + 1.5, 1.6, 1.2); }   // enamel chip
}
function prGlass(g, S, r, u, v, z, h, liq) {    // tumbler with tea / water
  const q0 = gp(S, u, v, z), q1 = gp(S, u, v, z + (h || 8)), w = 3.4;
  if (liq) { g.fillStyle = css(liq, .75); g.fillRect(q0[0] - w + .6, q0[1] - (h || 8) * .6, w * 2 - 1.2, (h || 8) * .6); }
  g.fillStyle = css([200, 220, 220], .22); g.fillRect(q1[0] - w, q1[1], w * 2, q0[1] - q1[1]);
  g.strokeStyle = css([230, 245, 245], .7); g.lineWidth = .8; g.strokeRect(q1[0] - w, q1[1], w * 2, q0[1] - q1[1]);
  g.fillStyle = css([255, 255, 255], .7); g.fillRect(q1[0] + w - 1.6, q1[1] + 1, .8, q0[1] - q1[1] - 2);
  g.strokeStyle = css([230, 245, 245], .6); g.beginPath(); g.ellipse(q1[0], q1[1], w, 1.4, 0, 0, 7); g.stroke();
}
function prBottle(g, S, r, u, v, z, col, h, o) {
  o = o || {}; col = C(col); h = h || 18; const p0 = gp(S, u, v, z), x = p0[0], y = p0[1], w = o.w || 3.2;
  const P = [[x - w, y], [x - w, y - h * .58], [x - w * .4, y - h * .76], [x - w * .38, y - h], [x + w * .38, y - h], [x + w * .4, y - h * .76], [x + w, y - h * .58], [x + w, y]];
  prPoly(g, P, mul(col, .8), .95);
  prShade(g, P, x - w, 0, x + w, 0, [[0, [10, 14, 20], .5], [.55, col, .2], [.75, [255, 255, 230], .5], [1, [10, 14, 20], .4]]);
  if (o.liq !== false) { g.fillStyle = css(mul(col, .5), .6); g.fillRect(x - w, y - h * (o.level || .4), w * 2, h * (o.level || .4)); }
  if (o.label) { g.fillStyle = css(o.label, .95); g.fillRect(x - w, y - h * .45, w * 2, h * .22); g.fillStyle = css([30, 20, 20], .5); g.fillRect(x - w * .6, y - h * .38, w * 1.2, .8); }
  g.fillStyle = css(o.cap || [190, 170, 120]); g.fillRect(x - w * .45, y - h - 1.4, w * .9, 1.8);
  g.fillStyle = css([255, 255, 240], .8); g.fillRect(x + w * .35, y - h * .56, .9, h * .42);
  g.strokeStyle = css(INK, .85); g.lineWidth = .9; pathPoly(g, P); g.stroke();
}
function prSheet(g, S, r, u, v, z, w, h, rot, o) {   // paper lying on a surface (w,h in tile units)
  o = o || {}; g.save(); faceT(g, S, u, v, z); g.rotate(rot || 0);
  const W = w * 64, H = h * 64, pc = o.col || jit([230, 222, 196], r, .04);
  g.fillStyle = css([8, 4, 14], .25); g.fillRect(-W / 2 + 2, -H / 2 + 2, W, H);
  g.fillStyle = css(pc); g.fillRect(-W / 2, -H / 2, W, H);
  g.fillStyle = g.createPattern(prTex('paper'), 'repeat'); g.globalAlpha = .7; g.fillRect(-W / 2, -H / 2, W, H); g.globalAlpha = 1;
  if (o.lines !== false) prTypeLines(g, r, -W / 2 + W * .12, -H / 2 + H * .14, W * .76, Math.max(2, Math.floor(H / 7)), 6, o.ink || [50, 44, 50], .45);
  if (o.head) { g.fillStyle = css(o.head, .8); g.fillRect(-W / 2 + W * .12, -H / 2 + H * .06, W * .5, 3); }
  if (o.stamp) { g.strokeStyle = css([170, 30, 30], .7); g.lineWidth = 2; g.beginPath(); g.arc(W * .2, H * .22, Math.min(W, H) * .16, 0, 7); g.stroke(); }
  g.strokeStyle = css(INK, .5); g.lineWidth = 1.6; g.strokeRect(-W / 2, -H / 2, W, H);
  g.restore();
}
function prRing(g, S, u, v, z, rad, a) {   // coffee / tea ring stain
  g.save(); faceT(g, S, u, v, z); g.strokeStyle = css([70, 40, 18], a || .3); g.lineWidth = 2.2; g.beginPath(); g.arc(0, 0, rad * 64, .3, 5.9); g.stroke(); g.lineWidth = 1; g.beginPath(); g.arc(1, 1, rad * 64 - 1.5, 2, 4); g.stroke(); g.restore();
}
function prBurn(g, S, r, u, v, z) {        // cigarette burn
  g.save(); faceT(g, S, u, v, z); g.rotate(r() * 3); const gr = g.createRadialGradient(0, 0, 0, 0, 0, 9); gr.addColorStop(0, 'rgba(16,8,4,.85)'); gr.addColorStop(.5, 'rgba(60,30,10,.45)'); gr.addColorStop(1, 'rgba(60,30,10,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, 10, 4, 0, 0, 7); g.fill(); g.restore();
}
function prBookFlat(g, S, r, u, v, z, w, d, th, col, rot) {   // closed book lying flat
  const c = C(col || r.p([[120, 36, 34], [44, 76, 66], [76, 64, 104], [150, 118, 86], [38, 52, 58]]));
  fcs(g, S, r, u - w / 2, v - d / 2, u + w / 2, v + d / 2, z, z + th, c, { ink: true, inkw: .9, dens: 30, rim: false, grime: 0, kl: .55 });
  const a = gp(S, u - w / 2 + .02, v + d / 2, z + th * .2), b = gp(S, u + w / 2 - .02, v + d / 2, z + th * .2); prLine(g, a, b, [236, 226, 196], .9, Math.max(1, th * .5));
  const a2 = gp(S, u + w / 2, v + d / 2 - .02, z + th * .2), b2 = gp(S, u + w / 2, v - d / 2 + .02, z + th * .2); prLine(g, a2, b2, [236, 226, 196], .9, Math.max(1, th * .5));
}
function prOpenBook(g, S, r, u, v, z, rot) {
  g.save(); faceT(g, S, u, v, z); g.rotate(rot || 0);
  g.fillStyle = css([8, 4, 14], .25); g.fillRect(-20, -12, 42, 26);
  g.fillStyle = css([90, 40, 34]); g.fillRect(-21, -14, 42, 27);
  for (const sd of [-1, 1]) { g.fillStyle = css([232, 224, 198]); g.beginPath(); g.moveTo(0, -12); g.quadraticCurveTo(sd * 10, -15, sd * 19, -12); g.lineTo(sd * 19, 11); g.quadraticCurveTo(sd * 10, 8, 0, 11); g.fill(); prTypeLines(g, r, sd < 0 ? -17 : 3, -8, 14, 6, 3, [50, 44, 50], .45); }
  g.fillStyle = css([0, 0, 0], .25); g.fillRect(-1.5, -12, 3, 23); g.restore();
}
function prAshtray(g, S, r, u, v, z) {
  const c = cylBody(g, S, r, u, v, .09, z, z + 2.5, [150, 150, 146], { ink: true, sw: 1.2, inkw: .8, top: false });
  const q = gp(S, u, v, z + 2.5); g.fillStyle = css([60, 56, 52]); g.beginPath(); g.ellipse(q[0], q[1], c.rx - 1, c.ry - .6, 0, 0, 7); g.fill();
  for (let i = 0; i < 3; i++) { const a = r() * 6.28; g.strokeStyle = css([236, 226, 200]); g.lineWidth = 1.4; g.beginPath(); g.moveTo(q[0] + Math.cos(a) * 1.5, q[1] + Math.sin(a) * .7); g.lineTo(q[0] + Math.cos(a) * 5.5, q[1] + Math.sin(a) * 2.2); g.stroke(); g.fillStyle = css([200, 130, 60]); g.fillRect(q[0] + Math.cos(a) * 5.5 - .6, q[1] + Math.sin(a) * 2.2 - .6, 1.4, 1.4); }
  g.fillStyle = css([120, 116, 110], .6); g.beginPath(); g.ellipse(q[0] - 1, q[1], 2.4, 1, 0, 0, 7); g.fill();
}
function prBowl(g, S, r, u, v, z, col, food) {
  const q = gp(S, u, v, z), c = C(col || [220, 216, 200]);
  g.fillStyle = css([8, 4, 14], .25); g.beginPath(); g.ellipse(q[0] - 1.5, q[1] + 1, 8, 3.6, 0, 0, 7); g.fill();
  g.fillStyle = css(mul(c, .8)); g.beginPath(); g.moveTo(q[0] - 7.5, q[1] - 3); g.quadraticCurveTo(q[0], q[1] + 6, q[0] + 7.5, q[1] - 3); g.fill();
  g.strokeStyle = css(INK, .8); g.lineWidth = .9; g.stroke();
  g.fillStyle = css(c); g.beginPath(); g.ellipse(q[0], q[1] - 3, 7.5, 3.4, 0, 0, 7); g.fill(); g.stroke();
  g.fillStyle = css(food || [150, 120, 60]); g.beginPath(); g.ellipse(q[0], q[1] - 2.6, 5.6, 2.2, 0, 0, 7); g.fill();
  g.fillStyle = css([255, 240, 200], .35); g.beginPath(); g.ellipse(q[0] + 2, q[1] - 3.4, 2, .7, 0, 0, 7); g.fill();
  g.strokeStyle = css([60, 90, 120], .7); g.lineWidth = .8; g.beginPath(); g.ellipse(q[0], q[1] - 3, 6.6, 2.9, 0, .2, 2.9); g.stroke();
}
function prSpoon(g, S, u, v, z, ang) { const q = gp(S, u, v, z); g.save(); g.translate(q[0], q[1]); g.rotate(ang || .3); g.strokeStyle = css([210, 210, 206]); g.lineWidth = 1.2; g.beginPath(); g.moveTo(-6, 0); g.lineTo(3, 0); g.stroke(); g.fillStyle = css([220, 220, 216]); g.beginPath(); g.ellipse(5, 0, 2.6, 1.4, 0, 0, 7); g.fill(); g.restore(); }
function prBread(g, S, r, u, v, z) {
  const q = gp(S, u, v, z); const P = ellPts(q[0], q[1] - 3, 9, 4.6, 12, -.2, r, .1);
  paintPoly(g, P, [176, 120, 64], r, { n: 6, ink: true, inkw: .9, edge: false, alt: [210, 160, 90] }); prShade(g, P, q[0] - 9, q[1] - 7, q[0] + 9, q[1], [[0, [255, 220, 150], .3], [1, [60, 30, 10], .4]]);
  g.strokeStyle = css([110, 70, 30], .8); g.lineWidth = .9; for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(q[0] + k * 4 - 1.5, q[1] - 5); g.lineTo(q[0] + k * 4 + 1.5, q[1] - 2); g.stroke(); }
}
function prCards(g, S, r, u, v, z) { for (let i = 0; i < 5; i++) { g.save(); faceT(g, S, u + (r() - .5) * .25, v + (r() - .5) * .2, z + .2); g.rotate(r() * 3); g.fillStyle = css([8, 4, 14], .2); g.fillRect(-5, -7, 11, 15); g.fillStyle = css([236, 230, 214]); g.fillRect(-6, -8, 11, 15); g.strokeStyle = css(INK, .5); g.lineWidth = 1; g.strokeRect(-6, -8, 11, 15); g.fillStyle = css(r() < .5 ? [170, 30, 30] : [30, 30, 30]); g.fillRect(-3, -3, 4, 4); g.restore(); } }
/* surface clutter scatter keyed to location: fills a rectangle on a top surface */
function prClutter(g, S, r, u0, v0, u1, v1, z, kind, dens) {
  const area = (u1 - u0) * (v1 - v0), n = Math.max(1, Math.round(area * (dens || 2.2)));
  // stains first, then objects back-to-front
  for (let i = 0; i < Math.ceil(area * 1.2); i++) { const uu = lerp(u0, u1, r()), vv = lerp(v0, v1, r()); if (r() < .6) prRing(g, S, uu, vv, z + .05, r.r(.06, .09), r.r(.15, .32)); else if (kind === 'boiler' || kind === 'office' || kind === 'relay' || r() < .3) prBurn(g, S, r, uu, vv, z + .05); }
  const items = [];
  for (let i = 0; i < n; i++) items.push([lerp(u0 + .1, u1 - .1, (i + r()) / n), lerp(v0 + .1, v1 - .1, r())]);
  items.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
  for (const [uu, vv] of items) {
    const k = r();
    if (kind === 'canteen') {
      if (k < .3) { prBowl(g, S, r, uu, vv, z, null, r.p([[150, 120, 60], [120, 140, 70], [170, 110, 70]])); if (r() < .6) prSpoon(g, S, uu + .1, vv + .08, z + .5, r() * 2); }
      else if (k < .5) prCup(g, S, r, uu, vv, z);
      else if (k < .65) prGlass(g, S, r, uu, vv, z, 8, [160, 90, 40]);
      else if (k < .78) prBread(g, S, r, uu, vv, z);
      else if (k < .88) prSheet(g, S, r, uu, vv, z, .2, .12, r() * 3, { col: [216, 196, 120], head: [160, 30, 30] });   // ration coupon
      else prSpoon(g, S, uu, vv, z + .3, r() * 3);
    } else if (kind === 'boiler') {
      if (k < .25) prCards(g, S, r, uu, vv, z); else if (k < .45) prCup(g, S, r, uu, vv, z, [140, 150, 140]); else if (k < .6) prAshtray(g, S, r, uu, vv, z);
      else if (k < .75) prBottle(g, S, r, uu, vv, z, [60, 100, 60], 16, { label: [200, 190, 150] }); else if (k < .88) prSheet(g, S, r, uu, vv, z, .34, .24, r() * .8 - .4, { col: [200, 190, 160], head: [30, 30, 30] }); else prGlass(g, S, r, uu, vv, z, 7, [200, 160, 80]);
    } else if (kind === 'library' || kind === 'office') {
      if (k < .3) prBookFlat(g, S, r, uu, vv, z, .3, .22, 3 + r() * 2); else if (k < .48) { prBookFlat(g, S, r, uu, vv, z, .32, .24, 3); prBookFlat(g, S, r, uu + .02, vv - .01, z + 3, .28, .2, 2.6); }
      else if (k < .65) prOpenBook(g, S, r, uu, vv, z + .1, r() * .6 - .3); else if (k < .85) prSheet(g, S, r, uu, vv, z, .26, .34, r() * .8 - .4); else prCup(g, S, r, uu, vv, z, [226, 222, 206]);
    } else if (kind === 'dorm') {
      if (k < .3) prCup(g, S, r, uu, vv, z); else if (k < .45) prSheet(g, S, r, uu, vv, z, .28, .2, r() * 2, { lines: true, ink: [40, 50, 110] }); else if (k < .6) prBookFlat(g, S, r, uu, vv, z, .28, .2, 3);
      else if (k < .75) prBread(g, S, r, uu, vv, z); else if (k < .88) prCards(g, S, r, uu, vv, z); else prGlass(g, S, r, uu, vv, z, 7, [180, 110, 50]);
    } else {
      if (k < .4) prCup(g, S, r, uu, vv, z); else if (k < .7) prSheet(g, S, r, uu, vv, z, .26, .2, r() * 2); else prGlass(g, S, r, uu, vv, z, 7, [190, 210, 210]);
    }
  }
}
/* raised panels on a box face. face 'L' (v = vv, along u) or 'R' (u = uu, along v) */
function prPanels(g, S, r, face, a0, a1, k, z0, z1, col, n, o) {
  o = o || {}; col = C(col);
  g.save();
  if (face === 'L') faceL(g, S, a0, k, z1); else faceR(g, S, k, a1, z1);
  const W = (a1 - a0) * 64, H = z1 - z0, m = o.margin || 5, pw = (W - m) / n;
  for (let i = 0; i < n; i++) {
    const x = m + i * pw, w = pw - m;
    paintRect(g, x, m * .8, w, H - m * 1.6, mul(col, o.k || .9), r, { n: 5, sw: 3, ang: 1.57, ink: false, edge: false });
    prBevel(g, x, m * .8, w, H - m * 1.6, [255, 232, 190], [10, 6, 12], 2.2);
    if (o.knob) { g.fillStyle = css([214, 184, 100]); g.fillRect(x + w / 2 - 4, H * .3, 8, 2.6); g.strokeStyle = css(INK, .7); g.lineWidth = 1; g.strokeRect(x + w / 2 - 4, H * .3, 8, 2.6); }
  }
  g.restore();
}

PROPS.counter = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, w = u1 - u0;
  const body = [[78, 104, 90], [150, 150, 140], [112, 120, 122], [180, 176, 166]][v];
  contactShadow(g, S, u0, v0, u1, v1, 1);
  fcs(g, S, r, u0, v0, u1, v1, 0, 6, [34, 30, 28], { ink: true, grime: .6, rim: false });   // kick plinth
  fcs(g, S, r, u0 + .02, v0 + .02, u1 - .02, v1 - .02, 6, 40, body, { vert: true, mat: 'wood', wear: .5, under: [150, 120, 80], alt: mul(body, 1.3) });
  prPanels(g, S, r, 'L', u0 + .02, u1 - .02, v1 - .02, 8, 38, body, Math.round(w * 1.4));
  prPanels(g, S, r, 'R', v0 + .02, v1 - .02, u1 - .02, 8, 38, body, Math.max(1, Math.round((v1 - v0) * 1.2)));
  // scuffs from boots along the bottom of the front
  { const a = gp(S, u0 + .1, v1, 9), b = gp(S, u1 - .1, v1, 9); for (let i = 0; i < w * 5; i++) { const t = r(), x = lerp(a[0], b[0], t), y = lerp(a[1], b[1], t); g.fillStyle = css([20, 16, 14], .25 + r() * .2); g.fillRect(x, y - r() * 5, r.r(3, 9), 1.2); } }
  // dented zinc top with a rolled edge
  const e = .06, top = [[150, 156, 152], [120, 84, 52], [176, 180, 180], [214, 210, 200]][v];
  fcs(g, S, r, u0 - e, v0 - e, u1 + e, v1 + e, 40, 45, top, { topAng: .46, alt: [210, 220, 220], dens: 24, kt: 1.12, mat: v === 1 ? 'wood' : 'metal', rim: true });
  const zt = [gp(S, u0 - e, v0 - e, 45), gp(S, u1 + e, v0 - e, 45), gp(S, u1 + e, v1 + e, 45), gp(S, u0 - e, v1 + e, 45)];
  for (let i = 0; i < w * 3; i++) { const q = gp(S, lerp(u0, u1, r()), lerp(v0, v1, r()), 45); g.strokeStyle = css([255, 255, 250], .25); g.lineWidth = 1; g.beginPath(); g.ellipse(q[0], q[1], 4 + r() * 4, 2 + r() * 1.5, 0, 3.4, 5.6); g.stroke(); g.strokeStyle = css([20, 24, 30], .25); g.beginPath(); g.ellipse(q[0], q[1] + .8, 4 + r() * 4, 2 + r() * 1.5, 0, .3, 2.8); g.stroke(); }
  prRing(g, S, u0 + w * .3, v0 + .6, 45.1, .08); prRing(g, S, u0 + w * .62, v1 - .5, 45.1, .07);
  // glass sneeze-guard along the back edge
  const gt = v === 0 ? 76 : v === 2 ? 66 : 0;
  if (gt) {
    const pa = gp(S, u0 + .1, v0 + .14, 45), pb = gp(S, u1 - .1, v0 + .14, 45), pc = gp(S, u1 - .1, v0 + .14, gt), pd = gp(S, u0 + .1, v0 + .14, gt);
    g.save(); g.globalAlpha = .38; prPoly(g, [pa, pb, pc, pd], v === 0 ? [120, 200, 170] : [190, 220, 220]); g.restore();
    prShade(g, [pa, pb, pc, pd], pd[0], pd[1], pa[0], pa[1], [[0, [255, 255, 240], .22], [.5, [255, 255, 255], 0], [1, [40, 90, 80], .2]]);
    for (let k = 0; k < Math.round(w * 1.2); k++) { const t = (k + r() * .5) / Math.round(w * 1.2); g.strokeStyle = css([230, 255, 240], .35); g.lineWidth = 1.6; g.beginPath(); g.moveTo(lerp(pd[0], pc[0], t), lerp(pd[1], pc[1], t) + 4); g.lineTo(lerp(pd[0], pc[0], t) + 7, lerp(pd[1], pc[1], t) + 22); g.stroke(); }
    rimStroke(g, [pa, pd, pc, pb], [30, 40, 36], .85, 1.8); rimStroke(g, [pd, pc], [255, 240, 200], .5, 1);
    for (const t of [0, .5, 1]) { const q0 = gp(S, lerp(u0 + .1, u1 - .1, t), v0 + .14, 45), q1 = gp(S, lerp(u0 + .1, u1 - .1, t), v0 + .14, gt); prLine(g, q0, q1, [60, 64, 66], .95, 2.2); }
  }
  // serving line: soup kettle (steaming), stacks of bowls, bread board, tea urn, a few bottles, cups
  const pot = u0 + w * (v === 2 ? .7 : .22), pv = (v0 + v1) / 2 - .05;
  const kc = cylBody(g, S, r, pot, pv, .36, 45, 63, [156, 160, 158], { ink: true, mat: 'metal', alt: [200, 206, 206] });
  g.strokeStyle = css(INK, .8); g.lineWidth = 2; g.beginPath(); g.ellipse(kc.cx, kc.cy - 2, kc.rx * .5, 4, 0, Math.PI, 0); g.stroke();
  g.fillStyle = css([170, 120, 60]); g.beginPath(); g.ellipse(kc.cx, kc.cy + .5, kc.rx - 2.5, kc.ry - 1.6, 0, 0, 7); g.fill();
  { const lq = gp(S, pot + .26, pv - .1, 63); g.strokeStyle = css([190, 190, 186]); g.lineWidth = 1.6; g.beginPath(); g.moveTo(lq[0] - 6, lq[1] + 2); g.lineTo(lq[0] + 4, lq[1] - 14); g.stroke(); }
  S.steam.push({ x: kc.cx, y: kc.cy - 6 });
  for (let s2 = 0; s2 < 2; s2++) { const bu = u0 + w * (.36 + s2 * .05), bv = v0 + .5; for (let k = 0; k < 5; k++) prBowl(g, S, r, bu, bv, 45 + k * 2.2, [220, 216, 200], [220, 216, 200]); }
  { const bu = u0 + w * .5, bv = (v0 + v1) / 2; fcs(g, S, r, bu - .28, bv - .2, bu + .28, bv + .2, 45, 47, [150, 104, 60], { mat: 'wood', ink: true, inkw: .9, rim: false, grime: 0 }); prBread(g, S, r, bu - .08, bv, 47); prBread(g, S, r, bu + .14, bv + .06, 47); }
  { const tu = u0 + w * .86, tv = v0 + .55; const tc = cylBody(g, S, r, tu, tv, .2, 45, 70, [176, 140, 70], { ink: true, mat: 'metal', alt: [230, 200, 120], spec: .55 }); cylBody(g, S, r, tu, tv, .08, 70, 76, [150, 120, 60], { ink: true }); const tp = gp(S, tu + .12, tv + .16, 52); g.fillStyle = css([60, 50, 30]); g.fillRect(tp[0] - 1, tp[1] - 1, 6, 2.4); g.fillStyle = css([40, 30, 20]); g.beginPath(); g.arc(tc.cx, tc.cy - 10, 2, 0, 7); g.fill(); }
  const nb = Math.max(2, Math.round(w * .5));
  for (let i = 0; i < nb; i++) prBottle(g, S, r, u0 + w * (.6 + i * .04), v0 + .32, 45, r.p([[220, 230, 220], [60, 120, 80], [150, 100, 50]]), r.r(15, 19), { label: r() < .6 ? [230, 220, 190] : null, level: r.r(.2, .8) });
  for (let i = 0; i < Math.round(w * .6); i++) { const uu = u0 + .4 + r() * (w - .8), vv = v1 - .3 - r() * .3; if (Math.abs(uu - pot) < .5) continue; r() < .6 ? prCup(g, S, r, uu, vv, 45) : prGlass(g, S, r, uu, vv, 45, 8, [160, 90, 40]); }
  // a cash tin and a spike of ration coupons near the end
  { const cu = u1 - .45, cv = v1 - .5; fcs(g, S, r, cu - .14, cv - .1, cu + .14, cv + .1, 45, 50, [60, 90, 70], { ink: true, inkw: .9, rim: true, grime: 0, mat: 'metal' }); const sp = gp(S, cu - .3, cv + .1, 45); prLine(g, sp, [sp[0], sp[1] - 12], [60, 60, 62], 1, 1); for (let k = 0; k < 4; k++) { g.fillStyle = css(jit([216, 196, 120], r, .08)); g.fillRect(sp[0] - 4 + (r() - .5) * 2, sp[1] - 3 - k * 2, 8, 1.6); } }
  if (v === 2) { const q = gp(S, u0 + w * .7, (v0 + v1) / 2, 45); S.steam.push({ x: q[0], y: q[1] - 66 }); }
};
PROPS.table = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, loc = S.loc.id;
  contactShadow(g, S, u0, v0, u1, v1, .8);
  const wood = [[142, 100, 62], [100, 120, 98], [150, 150, 146], [196, 186, 160]][v];
  const legC = mul(wood, .62), inset = .08;
  if (v !== 3) {
    for (const [uu, vv] of [[u0 + inset, v0 + inset], [u1 - inset, v0 + inset], [u1 - inset, v1 - inset], [u0 + inset, v1 - inset]]) fcs(g, S, r, uu - .04, vv - .04, uu + .04, vv + .04, 0, 31, legC, { ink: true, inkw: 1, rim: true, grime: 0, mat: 'wood', vert: true });
    // stretcher rail along the long side
    const a = gp(S, u0 + inset, v1 - inset, 8), b = gp(S, u1 - inset, v1 - inset, 8); prLine(g, a, b, INK, .8, 3.4); prLine(g, a, b, legC, 1, 2.2);
    fcs(g, S, r, u0 + .05, v0 + .05, u1 - .05, v1 - .05, 26, 31, mul(wood, .8), { ink: true, inkw: 1, rim: false, mat: 'wood', grime: .3 });   // apron
  } else fcs(g, S, r, u0 + .06, v0 + .06, u1 - .06, v1 - .06, 3, 31, wood, { vert: true, alt: [230, 220, 190], mat: 'wood' });
  const oil = v === 1 && (loc === 'canteen' || loc === 'dorm');
  fcs(g, S, r, u0, v0, u1, v1, 31, 35, oil ? [150, 60, 50] : wood, { alt: oil ? [220, 210, 190] : [200, 160, 100], dens: 26, mat: oil ? 'fabric' : 'wood', wear: .4 });
  if (oil) {   // checked oilcloth over the top
    g.save(); faceT(g, S, u0, v0, 35); g.beginPath(); g.rect(0, 0, (u1 - u0) * 64, (v1 - v0) * 64); g.clip(); g.fillStyle = css([236, 226, 200], .55); for (let x = 0; x < (u1 - u0) * 64; x += 16) for (let y = 0; y < (v1 - v0) * 64; y += 16) if (((x + y) / 16) % 2 === 0) g.fillRect(x, y, 8, 8); else g.fillRect(x + 8, y + 8, 8, 8); g.restore();
    const a = gp(S, u0, v1, 35), b = gp(S, u1, v1, 35); prLine(g, [a[0], a[1] + 2], [b[0], b[1] + 2], [150, 60, 50], .9, 4); // hanging edge
  }
  prClutter(g, S, r, u0 + .1, v0 + .12, u1 - .1, v1 - .12, 35, loc, loc === 'canteen' ? 2.6 : 2);
  if (loc === 'library') { const lu = u0 + (u1 - u0) * (v ? .25 : .75), lv = (v0 + v1) / 2; prReadingLamp(g, S, r, lu, lv, 35); }
};
function prReadingLamp(g, S, r, u, v, z) {   // green banker's lamp
  fcs(g, S, r, u - .12, v - .08, u + .12, v + .08, z, z + 3, [150, 120, 60], { ink: true, inkw: .9, rim: true, grime: 0, mat: 'metal' });
  vbar(g, S, r, u, v, z + 3, z + 16, 2, [176, 140, 70]);
  const q = gp(S, u, v, z + 16), P = [[q[0] - 12, q[1] + 2], [q[0] - 9, q[1] - 5], [q[0] + 9, q[1] - 5], [q[0] + 12, q[1] + 2]];
  prPoly(g, P, [40, 110, 76]); prShade(g, P, 0, q[1] - 5, 0, q[1] + 2, [[0, [180, 255, 200], .45], [1, [10, 30, 20], .4]]); g.strokeStyle = css(INK, .85); g.lineWidth = 1; pathPoly(g, P); g.stroke();
  g.fillStyle = css([255, 236, 170], .95); g.beginPath(); g.ellipse(q[0], q[1] + 2.2, 10, 1.6, 0, 0, 7); g.fill();
  prLight(S, q[0], q[1] + 6, 90, [255, 220, 140], .34, .03, 'lamp', 'desklamp', z + 16, u, v);
}
PROPS.bench = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, loc = S.loc.id, park = loc === 'courtyard', pew = loc === 'theatre';
  const wood = park ? [130, 92, 56] : [[150, 108, 66], [168, 130, 82], [96, 78, 56], [150, 50, 46]][v];
  contactShadow(g, S, u0, v0, u1, v1, .8);
  const iron = [40, 42, 46], nl = Math.max(2, Math.round((u1 - u0) / 1.4));
  const legs = (vv, zt, c) => { for (let i = 0; i <= nl; i++) { const uu = u0 + .14 + i * (u1 - u0 - .28) / nl; if (park || v === 2) vbar(g, S, r, uu, vv, 0, zt, 3, iron); else fcs(g, S, r, uu - .04, vv - .04, uu + .04, vv + .04, 0, zt, c, { ink: true, inkw: .9, grime: 0, mat: 'wood', vert: true }); } };
  const back = park || pew || v === 2 || v === 3;
  if (back) {   // backrest on the far side: two rails on posts
    for (let i = 0; i <= nl; i++) { const uu = u0 + .14 + i * (u1 - u0 - .28) / nl; vbar(g, S, r, uu, v0 + .12, 18, 50, park ? 3 : 3.6, park ? iron : mul(wood, .7)); }
    for (const z of park ? [30, 42] : [36]) fcs(g, S, r, u0 + .02, v0 + .08, u1 - .02, v0 + .15, z, z + (park ? 7 : 12), wood, { vert: false, mat: 'wood', wear: .3, ink: true, inkw: 1.1, grime: .3 });
    if (pew) { const q = gp(S, u0 + .4, v0 + .15, 44); prPlate(g, r, q[0] - 6, q[1] - 3, 12, 5, String(((p.y | 0) >> 1) + 1), [214, 184, 100], [40, 26, 10]); }
  }
  legs(v0 + .2, 20, mul(wood, .6)); legs(v1 - .2, 20, mul(wood, .6));
  // slatted seat
  const zs = v === 1 && !park ? 24 : 21, ns = park ? 4 : 3, dv = (v1 - v0 - .12) / ns;
  for (let k = 0; k < ns; k++) fcs(g, S, r, u0, v0 + .06 + k * dv + .015, u1, v0 + .06 + (k + 1) * dv - .015, zs - 3, zs, jit(wood, r, .06), { mat: 'wood', dens: 24, wear: .35, ink: true, inkw: 1, grime: .25, kt: 1.15 });
  // carved initials, a forgotten item
  if (r() < .6) { const q = gp(S, lerp(u0, u1, r.r(.2, .8)), v1 - .2, zs); g.strokeStyle = css([40, 20, 10], .55); g.lineWidth = .8; g.beginPath(); g.moveTo(q[0] - 3, q[1]); g.lineTo(q[0] - 1, q[1] - 3); g.lineTo(q[0] + 1, q[1]); g.moveTo(q[0] + 3, q[1] - 2); g.lineTo(q[0] + 6, q[1] - 1); g.stroke(); }
  const kf = r();
  if (kf < .3) prSheet(g, S, r, lerp(u0, u1, r.r(.2, .8)), (v0 + v1) / 2, zs, .3, .2, r(), { col: [220, 210, 180], head: [160, 30, 30] });
  else if (kf < .45 && loc === 'gym') { const q = gp(S, lerp(u0, u1, .7), (v0 + v1) / 2, zs); paintPoly(g, [[q[0] - 10, q[1] - 2], [q[0] + 8, q[1] - 6], [q[0] + 12, q[1] - 1], [q[0] - 6, q[1] + 3]], [226, 222, 210], r, { n: 4, ink: true, inkw: .8 }); }   // towel
  else if (kf < .55) prCup(g, S, r, lerp(u0, u1, .8), (v0 + v1) / 2, zs);
};
PROPS.stool = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  contactShadow(g, S, cu - .3, cv - .3, cu + .3, cv + .3, .9);
  cylBody(g, S, r, cu, cv, .26, 0, 2.5, [64, 66, 70], { ink: true, sw: 2, mat: 'metal' });
  vbar(g, S, r, cu, cv, 2, 22, 4, [176, 182, 182]);
  const fr = gp(S, cu, cv, 9); g.strokeStyle = css(INK, .8); g.lineWidth = 2.6; g.beginPath(); g.ellipse(fr[0], fr[1], ecx(.2), ecy(.2), 0, 0, 7); g.stroke(); g.strokeStyle = css([190, 196, 196]); g.lineWidth = 1.4; g.stroke();
  g.strokeStyle = css([255, 255, 255], .5); g.lineWidth = .8; g.beginPath(); g.ellipse(fr[0], fr[1] - .6, ecx(.2), ecy(.2), 0, 3.6, 5.6); g.stroke();
  const seat = v === 1 ? [140, 104, 66] : [160, 34, 38];
  cylBody(g, S, r, cu, cv, .3, 20, 23, [190, 194, 194], { ink: true, sw: 2, top: false, mat: 'metal' });
  const c = cylBody(g, S, r, cu, cv, .29, 23, 29, seat, { ink: true, sw: 3, alt: v === 1 ? [190, 150, 100] : [230, 90, 80], topCol: mul(seat, 1.2), spec: .5 });
  // cracked vinyl patched with tape, button tufting
  if (v !== 1) { const q = gp(S, cu + .05, cv - .05, 29); g.strokeStyle = css([40, 10, 10], .7); g.lineWidth = .9; g.beginPath(); g.moveTo(q[0] - 6, q[1]); g.lineTo(q[0] - 2, q[1] + 1); g.lineTo(q[0] + 1, q[1] - 1); g.lineTo(q[0] + 5, q[1] + 1.4); g.stroke(); if (r() < .6) { g.save(); faceT(g, S, cu - .08, cv + .04, 29.1); g.rotate(.6); g.fillStyle = css([200, 190, 160], .85); g.fillRect(-8, -3, 16, 6); g.restore(); } }
  g.fillStyle = css([255, 240, 220], .35); g.beginPath(); g.ellipse(c.cx + 6, c.cy - 1.5, 5, 1.6, -.3, 0, 7); g.fill();
};
PROPS.chair = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, near = (p.y | 0) > 3 && v % 2 === 1;
  const wood = [[134, 90, 56], [112, 78, 50], [100, 44, 38], [110, 114, 116]][v], metal = v === 3;
  contactShadow(g, S, cu - .3, cv - .3, cu + .3, cv + .3, .8);
  const a = .26, backV = near ? cv + a : cv - a;
  const leg = (uu, vv, z1) => metal ? vbar(g, S, r, uu, vv, 0, z1, 2.4, [60, 62, 66]) : fcs(g, S, r, uu - .035, vv - .035, uu + .035, vv + .035, 0, z1, mul(wood, .7), { ink: true, inkw: .9, grime: 0, mat: 'wood', vert: true, rim: true });
  const backrest = () => {
    for (const du of [-.22, .22]) leg(cu + du, backV, 54);
    fcs(g, S, r, cu - .26, backV - .035, cu + .26, backV + .035, 40, 54, wood, { vert: false, mat: 'wood', wear: .4, ink: true, inkw: 1, grime: .2 });
    if (v !== 3) for (const du of [-.08, .08]) fcs(g, S, r, cu + du - .025, backV - .02, cu + du + .025, backV + .02, 23, 40, mul(wood, .9), { ink: true, inkw: .7, grime: 0, rim: false });
  };
  if (!near) backrest();
  for (const [du, dv] of [[.24, -.24], [-.24, -.24], [.24, .24], [-.24, .24]]) if (!(Math.abs(cv + dv - backV) < .05)) leg(cu + du, cv + dv, 20);
  fcs(g, S, r, cu - .29, cv - .29, cu + .29, cv + .29, 19, v === 2 ? 25 : 23, wood, { alt: [200, 150, 100], dens: 22, mat: 'wood', wear: .5, ink: true, inkw: 1.1 });
  if (v === 2) { const q = [gp(S, cu - .24, cv - .24, 25.2), gp(S, cu + .24, cv - .24, 25.2), gp(S, cu + .24, cv + .24, 25.2), gp(S, cu - .24, cv + .24, 25.2)]; paintPoly(g, q, [130, 40, 36], r, { n: 6, ink: true, inkw: .8, edge: false }); prTexFill(g, q, 'weave', .9); }
  if (near) backrest();
};
PROPS.plant = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  contactShadow(g, S, cu - .35, cv - .35, cu + .35, cv + .35, 1);
  // terracotta pot: tapered, rolled rim, chips and white mineral bloom
  const pc = cylBody(g, S, r, cu, cv, .3, 0, 21, [170, 92, 58], { ink: true, alt: [210, 130, 86], sw: 3, top: false });
  { const b = gp(S, cu, cv, 0); g.fillStyle = css([230, 226, 210], .18); g.beginPath(); g.ellipse(b[0], b[1] - 8, pc.rx, 6, 0, 0, Math.PI); g.fill(); for (let i = 0; i < 4; i++) { const a = r() * Math.PI; g.fillStyle = css([110, 60, 40], .8); g.fillRect(b[0] + Math.cos(a) * pc.rx * .9, b[1] - 4 - r() * 14 + Math.sin(a) * 3, 2.4, 1.6); } }
  const rim = cylBody(g, S, r, cu, cv, .36, 21, 26, [186, 104, 66], { ink: true, sw: 2, top: false });
  const top = gp(S, cu, cv, 26); g.fillStyle = css([40, 28, 22]); g.beginPath(); g.ellipse(top[0], top[1], rim.rx - 2, rim.ry - 1.4, 0, 0, 7); g.fill();
  g.fillStyle = css([90, 70, 50], .7); for (let i = 0; i < 6; i++) g.fillRect(top[0] + (r() - .5) * 18, top[1] + (r() - .5) * 6, 1.6, 1.2);
  if (r() < .6) { g.fillStyle = css([236, 226, 200]); g.fillRect(top[0] + 4, top[1] - 1, 4, 1.4); g.fillStyle = css([200, 120, 60]); g.fillRect(top[0] + 7, top[1] - 1, 1.4, 1.4); }   // cigarette end in the soil
  const greens = v === 3 ? [[120, 100, 56], [150, 120, 70], [90, 76, 48]] : [[46, 108, 66], [70, 136, 76], [30, 80, 60], [104, 150, 78]];
  const nl = v === 2 ? 22 : v === 1 ? 14 : 15;
  const leaves = [];
  for (let i = 0; i < nl; i++) {
    const a = (i / nl) * Math.PI * 2 + r() * .4, rr = (v === 1 ? 4 : 12) + r() * 14, h = v === 1 ? 52 + r() * 44 : 26 + r() * 40;
    leaves.push({ a, rr, h, d: Math.sin(a) });
  }
  leaves.sort((x, y) => x.d - y.d);   // back leaves first
  for (const L of leaves) {
    const bx = top[0], by = top[1] - 1, droop = v === 2 ? L.h * .55 : v === 3 ? L.h * .4 : 0;
    const tx = bx + Math.cos(L.a) * L.rr * (v === 2 ? 1.7 : 1.1), ty = by - L.h + Math.sin(L.a) * L.rr * .3 + droop;
    const c = jit(r.p(greens), r, .1), lw_ = v === 1 ? 3.6 : 6.5;
    const dx = tx - bx, dy = ty - by, len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len, bend = (r() - .5) * 8;
    const P = [[bx, by], [bx + dx * .45 + nx * lw_ + bend, by + dy * .45 + ny * lw_], [tx, ty], [bx + dx * .45 - nx * lw_ * .7 + bend, by + dy * .45 - ny * lw_ * .7]];
    paintPoly(g, P, mul(c, .6 + .5 * (L.d + 1) / 2), r, { n: 4, sw: 2, ang: Math.atan2(dy, dx), ink: false, edge: false });
    const lit = Math.cos(L.a + .9) > 0;   // leaves facing the key light catch it
    prShade(g, P, bx + nx * lw_, by + ny * lw_, bx - nx * lw_, by - ny * lw_, [[0, lit ? [255, 220, 150] : [20, 40, 50], lit ? .35 : .3], [1, [10, 20, 20], .3]]);
    if (v === 0) { g.strokeStyle = css([200, 190, 110], .4); g.lineWidth = 1.4; g.beginPath(); g.moveTo(P[1][0], P[1][1]); g.lineTo(tx, ty); g.stroke(); }   // snake-plant yellow margins
    g.strokeStyle = css(mul(c, .5), .8); g.lineWidth = .8; g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(bx + dx * .5 + bend, by + dy * .5, tx, ty); g.stroke();
    ink(g, P, r, .9, null, .6);
    if (v === 3 && r() < .4) { g.fillStyle = css([90, 70, 40], .8); g.fillRect(bx + (r() - .5) * 30, top[1] + 30 + r() * 6, 3, 1.4); }
  }
};
PROPS.pillar = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, h = 150;
  contactShadow(g, S, cu - .4, cv - .4, cu + .4, cv + .4, 1);
  const c = v === 1 ? [146, 76, 56] : v === 2 ? [70, 76, 80] : [196, 182, 146];
  fcs(g, S, r, cu - .42, cv - .42, cu + .42, cv + .42, 0, 14, mul(c, .78), { mat: 'stone', wear: .6, under: [80, 70, 60] });
  fcs(g, S, r, cu - .3, cv - .3, cu + .3, cv + .3, 14, h - 14, c, { vert: true, alt: v === 1 ? [210, 120, 70] : [230, 214, 170], nk: 1.2, mat: v === 1 ? null : 'stone', wear: .4, under: [150, 70, 50] });
  const L = (t, z) => gp(S, lerp(cu - .3, cu + .3, t), cv + .3, z), R = (t, z) => gp(S, cu + .3, lerp(cv + .3, cv - .3, t), z);
  if (v === 1) {   // brick courses
    for (let z = 18; z < h - 16; z += 7) { prLine(g, L(0, z), L(1, z), [60, 30, 24], .5, 1); prLine(g, R(0, z), R(1, z), [60, 30, 24], .4, 1); const off = ((z / 7) | 0) % 2 ? .5 : .25; for (let t = off; t < 1; t += .5) { prLine(g, L(t, z), L(t, z + 7), [60, 30, 24], .4, .9); prLine(g, R(t, z), R(t, z + 7), [60, 30, 24], .35, .9); } }
  }
  if (v === 0) {   // green-painted dado band + a pasted bulletin
    const P1 = [L(0, 70), L(1, 70), R(1, 70), R(1, 14), L(1, 14), L(0, 14)];
    g.save(); g.globalAlpha = .72; prPoly(g, [L(0, 70), L(1, 70), L(1, 14), L(0, 14)], [56, 104, 80]); prPoly(g, [R(0, 70), R(1, 70), R(1, 14), R(0, 14)], [76, 128, 96]); g.restore();
    prLine(g, L(0, 70), L(1, 70), [30, 50, 40], .9, 1.6); prLine(g, R(0, 70), R(1, 70), [30, 50, 40], .9, 1.6);
    prChips(g, r, L(0, 66), L(1, 66), 5, [196, 182, 146], 2); prChips(g, r, R(0, 40), R(1, 40), 3, [196, 182, 146], 2);
    g.save(); faceL(g, S, cu - .3, cv + .3, 120); const rr = RNG(S.seed + 41); prPic(g, 6, 2, 26, 38, 'pil' + (S.seed & 7), (cg, W, H) => prPoster(cg, W, H, rr, 'pupil', { text: 'STUDY FOR THE UNION' }), 1.1); g.strokeStyle = css([20, 12, 10], .5); g.lineWidth = 1; g.strokeRect(6, 2, 26, 38); g.restore();
  }
  // soot / damp / hand-grime at shoulder height
  prTexFill(g, [L(0, h - 14), L(1, h - 14), R(1, h - 14), R(1, 14), L(1, 14), L(0, 14)], 'streak', .8, (k) => { faceL(k, S, cu - .3, cv + .3, h - 14); });
  { const q = L(.6, 60); g.fillStyle = css([30, 20, 16], .12); g.beginPath(); g.ellipse(q[0], q[1], 8, 16, 0, 0, 7); g.fill(); }
  // capital: stepped moulding
  fcs(g, S, r, cu - .36, cv - .36, cu + .36, cv + .36, h - 14, h - 8, mul(c, .95), { mat: 'stone', wear: .3 });
  fcs(g, S, r, cu - .44, cv - .44, cu + .44, cv + .44, h - 8, h, mul(c, 1.05), { mat: 'stone', wear: .5, under: [90, 80, 70] });
  // a long crack
  { let q = L(.3, h - 20); g.strokeStyle = css([30, 24, 20], .6); g.lineWidth = 1; g.beginPath(); g.moveTo(q[0], q[1]); for (let k = 0; k < 6; k++) { q = [q[0] + (r() - .5) * 6, q[1] + 8 + r() * 8]; g.lineTo(q[0], q[1]); } g.stroke(); }
};
PROPS.desk = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, wood = [[96, 56, 36], [150, 112, 70], [90, 98, 98], [130, 84, 52]][v], W = u1 - u0;
  contactShadow(g, S, u0, v0, u1, v1, 1);
  const pedW = Math.min(1, W * .4);
  const ped = (a, b) => {
    fcs(g, S, r, a, v0 + .1, b, v1 - .1, 0, 33, wood, { vert: true, mat: 'wood', wear: .3 });
    for (let k = 0; k < 3; k++) {   // drawers with brass pulls on the front face
      const z0 = 4 + k * 10;
      const P = [gp(S, a + .05, v1 - .1, z0 + 8.5), gp(S, b - .05, v1 - .1, z0 + 8.5), gp(S, b - .05, v1 - .1, z0), gp(S, a + .05, v1 - .1, z0)];
      paintPoly(g, P, mul(wood, .85), r, { n: 4, ink: true, inkw: .9, ang: .46, edge: false }); prLine(g, P[0], P[1], [255, 220, 170], .3, 1);
      const m = gp(S, (a + b) / 2, v1 - .1, z0 + 4.6); g.fillStyle = css([214, 184, 100]); g.beginPath(); g.ellipse(m[0], m[1], 3.4, 1.8, .46, 0, 7); g.fill(); g.strokeStyle = css(INK, .8); g.lineWidth = .8; g.stroke(); g.fillStyle = css([255, 240, 200], .7); g.fillRect(m[0] + .5, m[1] - 1, 1.2, .8);
      if (k === 0) { const kh = gp(S, (a + b) / 2, v1 - .1, z0 + 7.4); g.fillStyle = css([30, 24, 16]); g.fillRect(kh[0] - .6, kh[1] - .6, 1.2, 1.8); }
    }
  };
  if (W >= 2.5) { ped(u0 + .1, u0 + .1 + pedW); ped(u1 - .1 - pedW, u1 - .1); fcs(g, S, r, u0 + .1 + pedW, v0 + .2, u1 - .1 - pedW, v1 - .5, 4, 30, mul(wood, .55), { vert: true, ink: false, grime: .5, rim: false }); }
  else { ped(u1 - .1 - pedW, u1 - .1); for (const [uu, vv] of [[u0 + .1, v0 + .12], [u0 + .1, v1 - .12]]) fcs(g, S, r, uu - .04, vv - .04, uu + .04, vv + .04, 0, 33, mul(wood, .8), { ink: true, inkw: .9, grime: 0, mat: 'wood', vert: true }); }
  fcs(g, S, r, u0, v0, u1, v1, 33, 38, wood, { alt: [190, 140, 90], mat: 'wood', wear: .5, under: [200, 160, 110] });
  // tooled leather inlay with a gilt border
  const ins = [gp(S, u0 + .22, v0 + .18, 38.2), gp(S, u1 - .22, v0 + .18, 38.2), gp(S, u1 - .22, v1 - .18, 38.2), gp(S, u0 + .22, v1 - .18, 38.2)];
  paintPoly(g, ins, v === 2 ? [70, 90, 100] : [38, 78, 58], r, { n: 30, ang: .46, ink: true, inkw: 1, alt: [70, 120, 84], edge: false });
  prTexFill(g, ins, 'grime', .9, (k) => faceT(k, S, u0, v0, 38.2)); prTexFill(g, ins, 'scratch', .7, (k) => faceT(k, S, u0, v0, 38.2));
  rimStroke(g, ins.concat([ins[0]]), [220, 190, 100], .55, 1);
  const Z = 38.4, cvm = (v0 + v1) / 2;
  if (W >= 2.5) {   // the principal's desk: blotter, inkstand, files, rubber stamps, telephone, lamp, ashtray, nameplate
    prSheet(g, S, r, u0 + W * .45, cvm + .05, Z, .8, .55, 0, { col: [190, 176, 140], lines: false });
    prSheet(g, S, r, u0 + W * .45, cvm + .05, Z + .2, .44, .32, .08, { head: [30, 30, 30], stamp: true });
    for (let k = 0; k < 4; k++) prSheet(g, S, r, u0 + .75, v0 + .55 + (r() - .5) * .05, Z + k * 1.1, .42, .32, (r() - .5) * .2, { col: k === 3 ? [200, 170, 110] : null, lines: k === 3 ? false : true });   // files
    { const q = gp(S, u0 + .75, v0 + .55, Z + 4.6); g.strokeStyle = css([170, 30, 30], .9); g.lineWidth = 1.4; g.beginPath(); g.moveTo(q[0] - 11, q[1] - 1); g.lineTo(q[0] + 11, q[1] + 1); g.stroke(); }
    // inkstand
    fcs(g, S, r, u0 + W * .62 - .2, v0 + .32, u0 + W * .62 + .2, v0 + .5, Z, Z + 3, [70, 50, 34], { ink: true, inkw: .8, mat: 'wood', grime: 0, rim: true });
    for (const du of [-.1, .1]) { cylBody(g, S, r, u0 + W * .62 + du, v0 + .41, .06, Z + 3, Z + 8, [40, 50, 70], { ink: true, inkw: .7, spec: .6 }); }
    { const q = gp(S, u0 + W * .62 + .12, v0 + .41, Z + 8); prLine(g, q, [q[0] + 6, q[1] - 10], [30, 30, 30], .9, 1.2); }
    // rubber stamps + red pad
    { const su = u0 + W * .3, sv = v1 - .5; fcs(g, S, r, su - .14, sv - .1, su + .14, sv + .1, Z, Z + 2, [60, 60, 64], { ink: true, inkw: .7, rim: false, grime: 0 }); const q = gp(S, su, sv, Z + 2); g.fillStyle = css([170, 30, 30]); g.beginPath(); g.ellipse(q[0], q[1], 6, 2.6, 0, 0, 7); g.fill(); for (const du of [.22, .3]) { cylBody(g, S, r, su + du, sv + .05, .04, Z, Z + 7, [110, 70, 40], { ink: true, inkw: .6, top: false }); const t = gp(S, su + du, sv + .05, Z + 7); g.fillStyle = css([60, 40, 26]); g.beginPath(); g.arc(t[0], t[1] - 1, 2, 0, 7); g.fill(); } }
    // bakelite telephone
    { const tu = u1 - .9, tv = v1 - .5; fcs(g, S, r, tu - .18, tv - .14, tu + .18, tv + .14, Z, Z + 5, [24, 22, 24], { ink: true, inkw: .9, kt: 1.6, rim: true, grime: 0 }); const q = gp(S, tu, tv, Z + 5); const P = [[q[0] - 11, q[1] - 2], [q[0] - 8, q[1] - 6], [q[0] + 8, q[1] - 6], [q[0] + 11, q[1] - 2], [q[0] + 7, q[1] - 3], [q[0] - 7, q[1] - 3]]; prPoly(g, P, [20, 18, 20]); g.strokeStyle = css([255, 255, 255], .35); g.lineWidth = .8; g.beginPath(); g.moveTo(q[0] - 7, q[1] - 5.4); g.lineTo(q[0] + 7, q[1] - 5.4); g.stroke(); g.fillStyle = css([226, 220, 200]); g.beginPath(); g.arc(q[0], q[1] + 1, 3, 0, 7); g.fill(); g.strokeStyle = css(INK, .8); g.stroke();
      const c0 = gp(S, tu + .18, tv, Z + 2), c1 = gp(S, u1 + .1, tv + .1, 10); g.strokeStyle = css([20, 18, 20], .9); g.lineWidth = 1.2; g.beginPath(); g.moveTo(c0[0], c0[1]); g.bezierCurveTo(c0[0] + 10, c0[1] + 4, c1[0] + 6, c1[1] - 10, c1[0], c1[1]); g.stroke(); }
    prAshtray(g, S, r, u0 + W * .52, v1 - .35, Z);
    prCup(g, S, r, u1 - .5, v0 + .7, Z, [226, 222, 206], { liq: [60, 34, 20] }); prRing(g, S, u1 - .62, v0 + .82, Z, .08, .35);
    { const q = gp(S, u0 + W * .45, v1 - .14, Z); g.save(); faceL(g, S, u0 + W * .45 - .3, v1 - .14, Z + 6); paintRect(g, 0, 0, 38, 6, [190, 156, 70], r, { n: 3, ink: true, inkw: 1.4, ang: 0, edge: false }); prBlock(g, 'PRINCIPAL', 19, 3.2, 4.6, [40, 26, 10], 34); g.restore(); }
    prDeskLamp(g, S, r, u1 - .7, v0 + .45, Z);
  } else {          // logbook desk
    prOpenBook(g, S, r, u0 + W * .45, cvm, Z + .1, -.1);
    prCup(g, S, r, u1 - .4, v1 - .3, Z, [140, 150, 140]);
    prSheet(g, S, r, u0 + .3, v0 + .3, Z, .3, .22, .4);
    prDeskLamp(g, S, r, u1 - .35, v0 + .3, Z);
  }
};
function prDeskLamp(g, S, r, u, v, z) {
  cylBody(g, S, r, u, v, .1, z, z + 2, [40, 70, 56], { ink: true, inkw: .8 });
  const b = gp(S, u, v, z + 2), e = [b[0] + 5, b[1] - 16], t = [b[0] - 4, b[1] - 22];
  g.strokeStyle = css(INK, .9); g.lineWidth = 2.6; g.beginPath(); g.moveTo(b[0], b[1]); g.lineTo(e[0], e[1]); g.lineTo(t[0], t[1]); g.stroke(); g.strokeStyle = css([60, 90, 70]); g.lineWidth = 1.4; g.stroke();
  const P = [[t[0] - 9, t[1] + 5], [t[0] - 3, t[1] - 4], [t[0] + 6, t[1] - 2], [t[0] + 5, t[1] + 6]];
  prPoly(g, P, [40, 104, 74]); prShade(g, P, t[0] - 3, t[1] - 4, t[0], t[1] + 6, [[0, [170, 255, 200], .4], [1, [10, 30, 20], .5]]); g.strokeStyle = css(INK, .85); g.lineWidth = 1; pathPoly(g, P); g.stroke();
  g.fillStyle = css([255, 240, 190]); g.beginPath(); g.ellipse(t[0] - 2, t[1] + 5.5, 6, 1.8, -.4, 0, 7); g.fill();
  prLight(S, t[0] - 2, t[1] + 8, 76, [255, 214, 130], .26, .03, 'lamp', 'desklamp', z + 18, u, v);
}
PROPS.boiler = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, R = 1.05;
  contactShadow(g, S, u0 + .1, v0 + .1, u1 - .1, v1 - .1, 1.2);
  fcs(g, S, r, u0 + .15, v0 + .15, u1 - .15, v1 - .15, 0, 14, [86, 52, 44], { vert: false, mat: 'stone', wear: .7, under: [40, 30, 28] });   // brick plinth
  { const L = (t, z) => gp(S, lerp(u0 + .15, u1 - .15, t), v1 - .15, z); for (const z of [5, 10]) prLine(g, L(0, z), L(1, z), [40, 24, 20], .6, 1); }
  const steel = [90, 98, 96];
  const tank = cylBody(g, S, r, cu, cv, R, 14, 118, steel, { sw: 4, dens: 22, alt: [150, 126, 100], topCol: [104, 110, 106], mat: 'metal', spec: .3 });
  // heat discolouration + rust patches + soot
  g.save(); g.beginPath(); { const c0 = gp(S, cu, cv, 14), c1 = gp(S, cu, cv, 118); g.moveTo(c1[0] - tank.rx, c1[1]); g.lineTo(c0[0] - tank.rx, c0[1]); g.ellipse(c0[0], c0[1], tank.rx, tank.ry, 0, Math.PI, 0, true); g.lineTo(c1[0] + tank.rx, c1[1]); g.ellipse(c1[0], c1[1], tank.rx, tank.ry, 0, 0, Math.PI); } g.clip();
  for (let i = 0; i < 9; i++) { const q = gp(S, cu + r.r(-.9, .9), cv + .9, r.r(20, 110)), rr = r.r(6, 16), gr = g.createRadialGradient(q[0], q[1], 0, q[0], q[1], rr); gr.addColorStop(0, r() < .5 ? 'rgba(140,60,24,.45)' : 'rgba(60,40,70,.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(q[0] - rr, q[1] - rr, rr * 2, rr * 2); }
  { const q = gp(S, cu, cv + 1, 40), gr = g.createRadialGradient(q[0], q[1], 4, q[0], q[1], 50); gr.addColorStop(0, 'rgba(255,120,40,.25)'); gr.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = gr; g.fillRect(q[0] - 50, q[1] - 50, 100, 100); }
  g.restore();
  cylBody(g, S, r, cu, cv, .5, 118, 134, [84, 90, 88], { sw: 3, mat: 'metal' });
  // riveted seams (front half), with highlight + shadow per rivet
  for (const z of [34, 66, 98]) { const c0 = gp(S, cu, cv, z); g.strokeStyle = css([30, 32, 34], .7); g.lineWidth = 2; g.beginPath(); g.ellipse(c0[0], c0[1], ecx(R), ecy(R), 0, 0, Math.PI); g.stroke(); g.strokeStyle = css([200, 200, 190], .25); g.lineWidth = 1; g.beginPath(); g.ellipse(c0[0], c0[1] - 2, ecx(R), ecy(R), 0, .2, Math.PI - .2); g.stroke(); for (let k = 0; k < 18; k++) { const a = (k + .5) / 18 * Math.PI, x = c0[0] + Math.cos(a) * ecx(R), y = c0[1] + Math.sin(a) * ecy(R) + 3; g.fillStyle = css([24, 24, 26], .8); g.beginPath(); g.arc(x + .4, y + .5, 1.4, 0, 7); g.fill(); g.fillStyle = css([210, 190, 160], .7); g.beginPath(); g.arc(x - .3, y - .3, .8, 0, 7); g.fill(); } }
  // vertical seam
  { const a = gp(S, cu + .45, cv + .95, 116), b = gp(S, cu + .45, cv + .95, 16); prLine(g, a, b, [30, 30, 34], .6, 1.6); }
  // fire door facing the viewer: hinged iron door with a vent, glowing slots, and the open grate light
  const fd = gp(S, cu - .1, v1 - .05, 44);
  paintRect(g, fd[0] - 21, fd[1] - 26, 42, 44, [46, 46, 50], r, { n: 16, ink: true, inkw: 1.6, ang: 0, edge: false });
  prTexFill(g, [[fd[0] - 21, fd[1] - 26], [fd[0] + 21, fd[1] - 26], [fd[0] + 21, fd[1] + 18], [fd[0] - 21, fd[1] + 18]], 'streak', 1);
  const fg = g.createRadialGradient(fd[0], fd[1] - 2, 2, fd[0], fd[1] - 2, 17); fg.addColorStop(0, 'rgba(255,236,160,1)'); fg.addColorStop(.5, 'rgba(255,130,40,.95)'); fg.addColorStop(1, 'rgba(140,34,10,.9)');
  g.fillStyle = fg; g.beginPath(); g.ellipse(fd[0], fd[1] - 3, 15, 14, 0, 0, 7); g.fill();
  for (let k = 0; k < 7; k++) { g.fillStyle = css([255, 220, 120], .8); g.fillRect(fd[0] - 9 + r() * 18, fd[1] - 8 + r() * 10, 1.4, 1.4); }   // embers
  g.strokeStyle = css(INK, .9); g.lineWidth = 2; g.beginPath(); g.ellipse(fd[0], fd[1] - 3, 15, 14, 0, 0, 7); g.stroke();
  g.fillStyle = css([10, 6, 6], .9); for (let k = -2; k <= 2; k++) g.fillRect(fd[0] - 14, fd[1] - 3 + k * 5, 28, 1.6);
  for (const dy of [-18, 10]) { paintRect(g, fd[0] - 25, fd[1] + dy, 6, 6, [30, 30, 32], r, { n: 2, ink: true, inkw: .8 }); }
  paintRect(g, fd[0] + 16, fd[1] - 6, 10, 4, [70, 70, 74], r, { n: 2, ink: true, inkw: .8, ang: 0 });   // latch handle
  prLight(S, fd[0], fd[1] - 3, 300, [255, 120, 40], .6, .22, 'fire', 'boiler', 44, cu - .1, v1);
  prLight(S, fd[0] + 40, fd[1] + 24, 220, [255, 90, 30], .3, .2, 'fire', 'boiler', 10, cu, v1 + .6);
  // gauges, sight glass, warning plate
  for (const [gu, gz, gr] of [[.5, 90, 8], [.15, 100, 6]]) { const gq = gp(S, cu + gu, cv + .75 + gu * .3, gz); paintEll(g, gq[0], gq[1], gr + 1.5, gr + 1.5, [176, 140, 70], r, { n: 6, ink: true, inkw: 1.1 }); g.fillStyle = css([226, 218, 190]); g.beginPath(); g.arc(gq[0], gq[1], gr, 0, 7); g.fill(); g.fillStyle = css([170, 30, 30], .7); g.beginPath(); g.moveTo(gq[0], gq[1]); g.arc(gq[0], gq[1], gr - 1, -.5, .2); g.fill(); for (let k = 0; k < 9; k++) { const a = Math.PI * .8 + k * .18; g.strokeStyle = css(INK, .7); g.lineWidth = .6; g.beginPath(); g.moveTo(gq[0] + Math.cos(a) * gr * .7, gq[1] + Math.sin(a) * gr * .7); g.lineTo(gq[0] + Math.cos(a) * gr * .9, gq[1] + Math.sin(a) * gr * .9); g.stroke(); } g.strokeStyle = css([20, 20, 20]); g.lineWidth = 1.2; g.beginPath(); g.moveTo(gq[0], gq[1]); g.lineTo(gq[0] + gr * .6, gq[1] - gr * .5); g.stroke(); g.fillStyle = css([255, 255, 240], .6); g.fillRect(gq[0] - gr * .5, gq[1] - gr * .6, 2, 1.4); }
  { const sg = gp(S, cu + .8, cv + .55, 60); paintRect(g, sg[0] - 3, sg[1] - 26, 6, 30, [60, 60, 64], r, { n: 2, ink: true, inkw: .9, ang: 1.57 }); g.fillStyle = css([140, 190, 190], .7); g.fillRect(sg[0] - 1.4, sg[1] - 23, 2.8, 24); g.fillStyle = css([60, 100, 120], .9); g.fillRect(sg[0] - 1.4, sg[1] - 10, 2.8, 11); }
  { g.save(); faceL(g, S, cu - .75, cv + .72, 112); g.transform(1, -.1, 0, 1, 0, 0); paintRect(g, 10, 0, 44, 12, [214, 180, 50], r, { n: 4, ink: true, inkw: 1.4, ang: 0, edge: false }); prBlock(g, 'DANGER · HIGH PRESSURE', 32, 6.4, 7, [30, 24, 20], 40); g.restore(); }
  // flue up to the ceiling
  const c1 = gp(S, cu, cv, 134);
  const F1 = [[c1[0] - 8, c1[1]], [c1[0] + 8, c1[1]], [c1[0] + 8, c1[1] - 42], [c1[0] - 8, c1[1] - 42]];
  paintPoly(g, F1, [70, 74, 74], r, { n: 8, ink: false, ang: 1.57, edge: false }); prShade(g, F1, c1[0] - 8, 0, c1[0] + 8, 0, [[0, [10, 12, 24], .5], [.6, [255, 210, 160], .35], [1, [10, 12, 24], .45]]); ink(g, F1, r, 1.3, null, .85);
  const F2 = [[c1[0] - 8, c1[1] - 42], [c1[0] + 30, c1[1] - 60], [c1[0] + 30, c1[1] - 44], [c1[0] + 8, c1[1] - 34]];
  paintPoly(g, F2, [70, 74, 74], r, { n: 8, ink: true, inkw: 1.3, ang: -.4, edge: false }); prShade(g, F2, 0, c1[1] - 60, 0, c1[1] - 34, [[0, [255, 210, 160], .3], [1, [10, 12, 24], .45]]);
  for (const z of [10, 30]) { prLine(g, [c1[0] - 9, c1[1] - z], [c1[0] + 9, c1[1] - z], [40, 42, 44], .9, 3); }
  S.steam.push({ x: c1[0] + 30, y: c1[1] - 55 });
  // coal heap + shovel at the front-right
  { const ch = gp(S, u1 - .3, v1 + .25, 0); for (let i = 0; i < 26; i++) { const x = ch[0] + (r() - .5) * 34, y = ch[1] - r() * 10 * (1 - Math.abs(x - ch[0]) / 20); paintPoly(g, ellPts(x, y, r.r(2.4, 4.6), r.r(1.8, 3), 5, r() * 3, r, .4), [24, 22, 24], r, { n: 2, ink: false, edge: false }); g.fillStyle = css([150, 160, 170], .5); g.fillRect(x - 1, y - 2, 1.4, .8); }
    g.strokeStyle = css(INK, .9); g.lineWidth = 2.6; g.beginPath(); g.moveTo(ch[0] - 6, ch[1] - 6); g.lineTo(ch[0] + 14, ch[1] - 40); g.stroke(); g.strokeStyle = css([120, 84, 50]); g.lineWidth = 1.6; g.stroke(); paintPoly(g, [[ch[0] - 12, ch[1] - 2], [ch[0] - 2, ch[1] - 8], [ch[0] + 2, ch[1]], [ch[0] - 8, ch[1] + 4]], [70, 70, 74], r, { n: 3, ink: true, inkw: .9 }); }
};
PROPS.statue = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, bronze = v === 1, stone = bronze ? [88, 128, 110] : [160, 156, 146];
  contactShadow(g, S, u0 + .05, v0 + .05, u1 - .05, v1 - .05, 1.3);
  fcs(g, S, r, u0 + .1, v0 + .1, u1 - .1, v1 - .1, 0, 30, mul([160, 156, 146], .82), { vert: false, alt: [200, 196, 180], mat: 'stone', wear: .6, under: [90, 86, 80] });
  fcs(g, S, r, u0 + .3, v0 + .3, u1 - .3, v1 - .3, 30, 62, [160, 156, 146], { vert: false, alt: [210, 206, 190], nk: 1.2, mat: 'stone', wear: .4 });
  fcs(g, S, r, u0 + .22, v0 + .22, u1 - .22, v1 - .22, 62, 68, mul([160, 156, 146], 1.05), { mat: 'stone', wear: .5 });
  // bronze plaque with patina run-off
  g.save(); faceL(g, S, u0 + .55, v1 - .3, 56); paintRect(g, 0, 0, 58, 18, [110, 90, 50], r, { n: 6, ink: true, inkw: 1.6, ang: 0, edge: false }); prBlock(g, 'FATHER OF THE UNION', 29, 6.5, 6, [214, 190, 110], 52); prTypeLines(g, r, 8, 11, 42, 2, 3, [214, 190, 110], .5); g.restore();
  g.save(); faceL(g, S, u0 + .55, v1 - .3, 38); g.fillStyle = css([70, 140, 110], .35); for (let k = 0; k < 6; k++) g.fillRect(6 + k * 9, 0, 3, 8 + r() * 12); g.restore();
  // wreath of dead carnations at the foot, a candle stub
  { const q = gp(S, cu - .2, v1 - .05, 30.5); g.strokeStyle = css([60, 70, 40]); g.lineWidth = 3; g.beginPath(); g.ellipse(q[0], q[1] - 2, 10, 4.4, 0, 0, 7); g.stroke(); for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28; g.fillStyle = css(k % 2 ? [130, 40, 40] : [90, 30, 30]); g.beginPath(); g.arc(q[0] + Math.cos(a) * 10, q[1] - 2 + Math.sin(a) * 4.4, 1.8, 0, 7); g.fill(); } g.fillStyle = css([170, 30, 30]); g.fillRect(q[0] - 1, q[1] + 2, 2, 8); }
  // the figure in greatcoat, one arm raised, pointing over the yard
  const b = gp(S, cu, cv, 68), bx = b[0], by = b[1], c = stone, k = bronze ? [70, 120, 96] : [180, 178, 170];
  const cape = [[bx - 14, by - 86], [bx - 30, by - 50], [bx - 34, by - 8], [bx - 18, by - 2], [bx - 8, by - 60]];
  paintPoly(g, cape, mul(c, .72), r, { n: 20, sw: 4, ang: 1.3, ink: true, inkw: 1.8, edge: false }); prShade(g, cape, bx - 34, 0, bx - 8, 0, [[0, [20, 30, 50], .5], [1, [255, 220, 170], .15]]);
  const coat = [[bx - 22, by], [bx - 18, by - 28], [bx - 16, by - 56], [bx - 15, by - 78], [bx + 15, by - 78], [bx + 16, by - 58], [bx + 20, by - 26], [bx + 27, by - 2], [bx + 10, by + 2]];
  // boots
  for (const dx of [-10, 6]) paintPoly(g, [[bx + dx - 5, by + 1], [bx + dx + 7, by + 1], [bx + dx + 6, by - 8], [bx + dx - 4, by - 8]], mul(c, .6), r, { n: 3, ink: true, inkw: 1, edge: false });
  paintPoly(g, coat, c, r, { n: 50, sw: 4, ang: 1.5, ink: true, inkw: 2, alt: k, edge: false });
  prShade(g, coat, bx - 21, 0, bx + 24, 0, [[0, [20, 30, 50], .55], [.5, c, 0], [.75, [255, 220, 170], .35], [1, [20, 30, 50], .3]]);
  prTexFill(g, coat, bronze ? 'streak' : 'speck', 1);
  g.strokeStyle = css([30, 30, 32], .45); g.lineWidth = 1; for (const dx of [-8, 2, 12]) { g.beginPath(); g.moveTo(bx + dx * .6, by - 70); g.quadraticCurveTo(bx + dx, by - 30, bx + dx * 1.1, by - 2); g.stroke(); }
  prLine(g, [bx - 18, by - 46], [bx + 18, by - 46], [40, 40, 44], .6, 2.4);   // belt
  const sh = [[bx - 15, by - 78], [bx + 15, by - 78], [bx + 19, by - 90], [bx - 19, by - 90]]; paintPoly(g, sh, mul(c, 1.05), r, { n: 10, ink: true, inkw: 1.4, edge: false });
  const arm = [[bx + 13, by - 88], [bx + 38, by - 114], [bx + 45, by - 108], [bx + 20, by - 78]]; paintPoly(g, arm, c, r, { n: 10, ink: true, inkw: 1.4, edge: false }); prShade(g, arm, bx + 38, by - 114, bx + 16, by - 80, [[0, [255, 220, 170], .3], [1, [20, 30, 50], .3]]);
  paintEll(g, bx + 46, by - 112, 5, 5, c, r, { n: 6, ink: true, inkw: 1.2 });
  const arm2 = [[bx - 16, by - 84], [bx - 22, by - 54], [bx - 16, by - 52], [bx - 10, by - 80]]; paintPoly(g, arm2, mul(c, .8), r, { n: 6, ink: true, inkw: 1.2, edge: false });
  const head = [[bx - 8, by - 90], [bx + 8, by - 90], [bx + 9, by - 104], [bx + 4, by - 108], [bx - 6, by - 108], [bx - 9, by - 104]]; paintPoly(g, head, mul(c, 1.08), r, { n: 8, ink: true, inkw: 1.4, edge: false }); prShade(g, head, bx - 9, 0, bx + 9, 0, [[0, [20, 30, 50], .5], [1, [255, 220, 170], .3]]);
  paintPoly(g, [[bx - 11, by - 104], [bx + 11, by - 104], [bx + 12, by - 113], [bx - 12, by - 113]], mul(c, .9), r, { n: 6, ink: true, inkw: 1.3, edge: false });
  prLine(g, [bx - 12, by - 104], [bx + 13, by - 103], [30, 30, 32], .8, 2.2);
  // pigeon on the arm + droppings, moss
  { const px = bx + 32, py = by - 112; paintEll(g, px, py, 4.2, 3, [120, 120, 126], r, { n: 4, ink: true, inkw: .8 }); paintEll(g, px + 3.6, py - 2.6, 2, 2, [110, 110, 116], r, { n: 3, ink: true, inkw: .6 }); g.fillStyle = css([200, 120, 60]); g.fillRect(px + 5, py - 3, 1.4, .8); }
  g.save(); g.globalCompositeOperation = 'source-atop'; for (let i = 0; i < 12; i++) { g.fillStyle = css([236, 236, 226], .25); g.fillRect(bx + r.r(-16, 16), by - r.r(60, 112), 1.6, r.r(4, 14)); g.fillStyle = css([50, 76, 46], .2); g.fillRect(r.r(bx - 40, bx + 40), by + r.r(-30, 30), r.r(3, 9), r.r(6, 20)); } g.restore();
  prLine(g, [bx + 25, by - 110], [bx + 44, by - 116], [255, 190, 120], .4, 1.2);
};
PROPS.crate = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I;
  contactShadow(g, S, u0, v0, u1, v1, .9);
  if (v === 2) {   // theatre prop trunk: canvas-covered, brass corners, travel labels
    const c = [86, 60, 44];
    fcs(g, S, r, u0 + .06, v0 + .06, u1 - .06, v1 - .06, 0, 26, c, { vert: true, alt: [140, 96, 60], mat: 'fabric', wear: .5, under: [180, 160, 120] });
    fcs(g, S, r, u0 + .05, v0 + .08, u1 - .05, v1 - .08, 26, 35, mul(c, 1.12), { mat: 'fabric', wear: .5 });
    for (let k = 0; k < 3; k++) { const uu = lerp(u0 + .18, u1 - .18, k / 2); const a = gp(S, uu, v1 - .06, 0), b = gp(S, uu, v1 - .06, 26), c2 = gp(S, uu, v1 - .08, 35), d = gp(S, uu, v0 + .1, 35); g.strokeStyle = css(INK, .7); g.lineWidth = 4.4; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c2[0], c2[1]); g.lineTo(d[0], d[1]); g.stroke(); g.strokeStyle = css([120, 84, 46]); g.lineWidth = 3; g.stroke(); }
    for (const [uu, vv] of [[u0 + .06, v1 - .06], [u1 - .06, v1 - .06], [u1 - .06, v0 + .06]]) for (const z of [2, 24]) { const q = gp(S, uu, vv, z); g.fillStyle = css([200, 170, 90]); g.beginPath(); g.moveTo(q[0] - 4, q[1] - 2); g.lineTo(q[0] + 4, q[1] - 2); g.lineTo(q[0] + 4, q[1] + 3); g.lineTo(q[0] - 4, q[1] + 3); g.fill(); g.strokeStyle = css(INK, .8); g.lineWidth = .8; g.stroke(); }
    const lk = gp(S, (u0 + u1) / 2, v1 - .06, 22); g.fillStyle = css([220, 190, 100]); g.fillRect(lk[0] - 3, lk[1] - 3, 6, 7); g.strokeStyle = css(INK, .9); g.lineWidth = 1; g.strokeRect(lk[0] - 3, lk[1] - 3, 6, 7);
    g.save(); faceL(g, S, u0 + .3, v1 - .06, 22); for (let k = 0; k < 3; k++) { const x = 6 + k * 34 + r() * 8, y = 2 + r() * 6; g.save(); g.translate(x, y); g.rotate((r() - .5) * .3); g.fillStyle = css(r.p([[226, 210, 160], [176, 40, 36], [60, 100, 120]])); g.fillRect(0, 0, 22, 12); prBlock(g, r.p(['TOUR', 'No.9', 'HALL', 'PROPS']), 11, 6.5, 7, [30, 24, 20], 20); g.restore(); } g.restore();
    return;
  }
  if (v === 1) {   // dormitory footlocker: olive tin with stencilled name
    const c = [86, 96, 64];
    fcs(g, S, r, u0 + .1, v0 + .14, u1 - .1, v1 - .14, 0, 24, c, { vert: true, mat: 'enamel', wear: .7, under: [60, 50, 40] });
    fcs(g, S, r, u0 + .08, v0 + .12, u1 - .08, v1 - .12, 24, 30, mul(c, 1.1), { mat: 'enamel', wear: .6, under: [60, 50, 40] });
    g.save(); faceL(g, S, u0 + .1, v1 - .14, 22); prBlock(g, 'V. KOREN · 3B', 25, 8, 7, [226, 220, 196], 44, { stencil: c }); g.restore();
    for (const uu of [u0 + .3, u1 - .3]) { const q = gp(S, uu, v1 - .14, 20); g.fillStyle = css([190, 180, 150]); g.fillRect(q[0] - 2.5, q[1] - 2, 5, 5); g.strokeStyle = css(INK, .8); g.lineWidth = .8; g.strokeRect(q[0] - 2.5, q[1] - 2, 5, 5); }
    prSheet(g, S, r, (u0 + u1) / 2 + .1, (v0 + v1) / 2, 30, .3, .2, .3, { col: [220, 212, 186], ink: [40, 50, 110] });
    return;
  }
  const c = v === 3 ? [150, 128, 88] : [168, 124, 76];
  const stack = v === 3 ? 2 : 1;
  for (let s = 0; s < stack; s++) {
    const z0 = s * 28, uu0 = u0 + .04 + s * .18, vv0 = v0 + .04 + s * .1, uu1 = u1 - .04 - (s ? .2 : 0), vv1 = v1 - .04;
    fcs(g, S, r, uu0, vv0, uu1, vv1, z0, z0 + 28, c, { vert: false, alt: [220, 180, 120], dens: 24, mat: 'wood', wear: .4, under: [90, 66, 40] });
    // plank seams + corner battens
    for (let k = 1; k < 3; k++) { const z = z0 + k * 9.3; prLine(g, gp(S, uu0, vv1, z), gp(S, uu1, vv1, z), INK, .45, 1.1); prLine(g, gp(S, uu1, vv1, z), gp(S, uu1, vv0, z), INK, .4, 1.1); }
    for (const [uu, vv] of [[uu0 + .05, vv1], [uu1 - .05, vv1]]) { const a = gp(S, uu, vv, z0), b = gp(S, uu, vv, z0 + 28); prLine(g, a, b, mul(c, .7), 1, 4); prLine(g, a, b, INK, .4, .8); }
    { const a = gp(S, uu1, vv1 - .05, z0), b = gp(S, uu1, vv1 - .05, z0 + 28); prLine(g, a, b, mul(c, .75), 1, 4); }
    const bq = gp(S, uu1, (vv0 + vv1) / 2, z0 + 14), bq2 = gp(S, (uu0 + uu1) / 2, vv1, z0 + 14);
    prLine(g, [bq2[0] - 14, bq2[1] - 11], [bq2[0] + 14, bq2[1] + 3], [70, 46, 28], .7, 2.6);
    // stencilled supply marks + nails
    g.save(); faceL(g, S, uu0 + .12, vv1, z0 + 22); prBlock(g, s ? 'FRAGILE' : 'UNION SUPPLY', ((uu1 - uu0) * 64 - 16) / 2, 7, 7, [40, 30, 24], (uu1 - uu0) * 64 - 24, { alpha: .75 }); if (!s) { prBlock(g, 'No.' + (40 + (S.seed % 50)), ((uu1 - uu0) * 64 - 16) / 2, 15, 5, [140, 30, 26], 40, { alpha: .8 }); } g.restore();
    g.save(); faceR(g, S, uu1, vv1, z0 + 22); prBellGlyph(g, (vv1 - vv0) * 32, 8, 10, [40, 30, 24], .6); g.restore();
    for (let k = 0; k < 4; k++) { const q = gp(S, lerp(uu0, uu1, (k + .5) / 4), vv1, z0 + 26); g.fillStyle = css([40, 36, 34]); g.fillRect(q[0], q[1], 1.2, 1.2); }
  }
  if (v === 0 && r() < .9) { const q = gp(S, u0 + .4, (v0 + v1) / 2, 28); prSheet(g, S, r, u0 + .5, (v0 + v1) / 2, 28.2, .34, .24, -.2, { head: [30, 30, 30] }); prCup(g, S, r, u1 - .4, (v0 + v1) / 2, 28); }
};
PROPS.lamp = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  contactShadow(g, S, cu - .3, cv - .3, cu + .3, cv + .3, .8);
  if (v === 1) {   // iron lamp post with a glazed lantern
    cylBody(g, S, r, cu, cv, .22, 0, 12, [46, 50, 52], { ink: true, mat: 'metal' });
    cylBody(g, S, r, cu, cv, .15, 12, 18, [56, 60, 62], { ink: true });
    vbar(g, S, r, cu, cv, 16, 122, 5, [44, 48, 50]);
    for (const z of [40, 100]) { const q = gp(S, cu, cv, z); g.strokeStyle = css([60, 64, 66]); g.lineWidth = 7; g.beginPath(); g.moveTo(q[0] - 3.5, q[1]); g.lineTo(q[0] + 3.5, q[1]); g.stroke(); }
    const t = gp(S, cu, cv, 124);
    const G = [[t[0] - 10, t[1] - 4], [t[0] + 10, t[1] - 4], [t[0] + 14, t[1] - 26], [t[0] - 14, t[1] - 26]];
    const gl = g.createLinearGradient(0, t[1] - 26, 0, t[1]); gl.addColorStop(0, 'rgb(255,236,170)'); gl.addColorStop(1, 'rgb(240,170,80)'); g.fillStyle = gl; pathPoly(g, G); g.fill();
    g.fillStyle = css([255, 255, 230], .95); g.beginPath(); g.ellipse(t[0], t[1] - 14, 4, 6, 0, 0, 7); g.fill();
    g.strokeStyle = css(INK, .9); g.lineWidth = 2; pathPoly(g, G); g.stroke(); g.lineWidth = 1.4; g.beginPath(); g.moveTo(t[0], t[1] - 4); g.lineTo(t[0], t[1] - 26); g.stroke();
    paintPoly(g, [[t[0] - 18, t[1] - 26], [t[0] + 18, t[1] - 26], [t[0] + 5, t[1] - 36], [t[0] - 5, t[1] - 36]], [44, 48, 50], r, { n: 6, ink: true, inkw: 1.4, edge: false }); prLine(g, [t[0] - 16, t[1] - 27], [t[0] + 16, t[1] - 27], [255, 200, 130], .5, 1);
    paintEll(g, t[0], t[1] - 38, 3, 3, [44, 48, 50], r, { n: 4, ink: true });
    paintRect(g, t[0] - 10, t[1] - 6, 20, 4, [40, 44, 46], r, { n: 2, ink: true, inkw: 1 });
    prLight(S, t[0], t[1] - 14, 150, [255, 190, 100], .45, .04, 'lamp', 'lamp', 110, cu, cv);
    prLight(S, t[0], t[1] + 40, 90, [255, 170, 80], .1, .03, 'pool', 'lamp', 0, cu, cv);
    return;
  }
  cylBody(g, S, r, cu, cv, .22, 0, 4, [60, 44, 36], { ink: true, mat: 'wood' });
  vbar(g, S, r, cu, cv, 3, v === 2 ? 70 : 92, v === 2 ? 3 : 3.4, v === 2 ? [90, 90, 94] : [140, 110, 66]);
  const t = gp(S, cu, cv, v === 2 ? 72 : 94);
  if (v === 2) {   // caged work light on a stand
    g.fillStyle = css([255, 244, 200]); g.beginPath(); g.arc(t[0], t[1] - 6, 6, 0, 7); g.fill();
    g.strokeStyle = css([40, 40, 44], .9); g.lineWidth = 1.2; g.beginPath(); g.arc(t[0], t[1] - 6, 9, 0, 7); g.moveTo(t[0] - 9, t[1] - 6); g.lineTo(t[0] + 9, t[1] - 6); g.moveTo(t[0], t[1] - 15); g.lineTo(t[0], t[1] + 3); g.moveTo(t[0] - 6.4, t[1] - 12.4); g.lineTo(t[0] + 6.4, t[1] + .4); g.stroke();
    const cb = gp(S, cu, cv, 40), ce = gp(S, cu + .6, cv + .4, 0); g.strokeStyle = css([20, 20, 22], .9); g.lineWidth = 1.4; g.beginPath(); g.moveTo(cb[0], cb[1]); g.quadraticCurveTo(cb[0] + 10, ce[1], ce[0], ce[1]); g.stroke();
    prLight(S, t[0], t[1] - 6, 130, [255, 200, 120], .4, .1, 'lamp', 'lamp', 66, cu, cv);
  } else {         // standard lamp: pleated fabric shade, scorched where the bulb sits, tassel
    const sh = [[t[0] - 12, t[1] - 3], [t[0] + 12, t[1] - 3], [t[0] + 7, t[1] - 23], [t[0] - 7, t[1] - 23]];
    paintPoly(g, sh, [226, 196, 136], r, { n: 12, ink: false, alt: [255, 230, 170], edge: false });
    prShade(g, sh, t[0] - 12, 0, t[0] + 12, 0, [[0, [150, 90, 50], .45], [.4, [255, 240, 200], .4], [1, [150, 90, 50], .35]]);
    g.strokeStyle = css([160, 110, 60], .5); g.lineWidth = .8; for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(t[0] + k * 3.4, t[1] - 3); g.lineTo(t[0] + k * 2, t[1] - 23); g.stroke(); }
    g.fillStyle = css([140, 80, 40], .3); g.beginPath(); g.ellipse(t[0] + 1, t[1] - 18, 3, 2, 0, 0, 7); g.fill();
    ink(g, sh, r, 1.5, null, .85);
    g.fillStyle = css([255, 226, 160], .95); g.beginPath(); g.ellipse(t[0], t[1] - 3, 11, 2.4, 0, 0, 7); g.fill();
    prLine(g, [t[0] + 9, t[1] - 3], [t[0] + 9, t[1] + 6], [120, 40, 30], .9, 1); g.fillStyle = css([170, 50, 40]); g.fillRect(t[0] + 8, t[1] + 6, 2, 3);
    prLight(S, t[0], t[1] - 10, 140, [255, 190, 100], .42, .06, 'lamp', 'lamp', 86, cu, cv);
  }
  const fq = gp(S, cu, cv, 0); prLight(S, fq[0], fq[1], 70, [255, 170, 80], .1, .03, 'pool', 'lamp', 0, cu, cv);
};
PROPS.loudspeaker = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  contactShadow(g, S, cu - .2, cv - .2, cu + .2, cv + .2, .8);
  cylBody(g, S, r, cu, cv, .2, 0, 8, [60, 60, 62], { ink: true, mat: 'stone' });
  vbar(g, S, r, cu, cv, 6, 196, 5.4, [96, 98, 94]);
  // painted warning bands + junction box + cable conduit
  for (const z of [30, 40]) { const a = gp(S, cu, cv, z); g.fillStyle = css(z === 30 ? [176, 40, 36] : [226, 216, 186]); g.fillRect(a[0] - 2.7, a[1] - 10, 5.4, 10); }
  { const q = gp(S, cu, cv, 70); paintRect(g, q[0] - 7, q[1] - 12, 14, 16, [70, 80, 74], r, { n: 4, ink: true, inkw: 1, ang: 1.57, edge: false }); prScrew(g, q[0] - 4, q[1] - 9, 1); prScrew(g, q[0] + 4, q[1] + 1, 1); g.fillStyle = css([214, 180, 50]); g.beginPath(); g.moveTo(q[0], q[1] - 8); g.lineTo(q[0] + 4, q[1] - 1); g.lineTo(q[0] - 4, q[1] - 1); g.fill(); }
  { const q = gp(S, cu, cv, 50); g.fillStyle = css([230, 220, 190], .9); g.save(); g.translate(q[0] - 7, q[1] - 18); g.rotate(-.05); g.fillRect(0, 0, 14, 18); prTypeLines(g, r, 2, 4, 10, 4, 3, [40, 30, 30], .6); g.restore(); }
  const t = gp(S, cu, cv, 190);
  paintRect(g, t[0] - 14, t[1] + 4, 28, 4, [60, 62, 60], r, { n: 2, ink: true, inkw: 1, ang: 0 });
  const nh = v === 1 ? 2 : 3;
  for (let i = 0; i < nh; i++) {
    const sd = i === 1 ? 1 : -1, a = i * 2.2 + .6 + (v === 1 ? 1 : 0), dx = Math.cos(a) * 14, dy = Math.sin(a) * 4 - (i === 2 ? 12 : 0), fx = t[0] + dx, fy = t[1] + dy, dir = Math.cos(a) > -0.2 ? 1 : -1;
    const H0 = [[fx - dir * 9, fy - 7], [fx + dir * 9, fy - 7], [fx + dir * 22, fy - 18], [fx + dir * 22, fy + 18], [fx + dir * 9, fy + 7], [fx - dir * 9, fy + 7]];
    paintPoly(g, H0, [102, 104, 92], r, { n: 16, ink: false, ang: 0, edge: false, alt: [130, 136, 120] });
    prShade(g, H0, 0, fy - 18, 0, fy + 18, [[0, [255, 226, 180], .4], [.45, [0, 0, 0], 0], [1, [10, 12, 24], .5]]); prTexFill(g, H0, 'streak', .9); ink(g, H0, r, 1.3, null, .85);
    paintEll(g, fx + dir * 22, fy, 5, 18, [24, 22, 22], r, { n: 5, ink: true, inkw: 1.1 });
    g.strokeStyle = css([170, 160, 136], .5); g.lineWidth = 1.4; g.beginPath(); g.ellipse(fx + dir * 22, fy, 5, 18, 0, dir > 0 ? -1.6 : 1.6, dir > 0 ? 1.6 : 4.7); g.stroke();
    prLine(g, [fx + dir * 16, fy + 12], [fx + dir * 15.5, fy + 26], [120, 54, 22], .45, 1.4);
  }
  g.strokeStyle = css(INK, .85); g.lineWidth = 1.6; g.beginPath(); g.moveTo(t[0], t[1] + 10); g.quadraticCurveTo(t[0] - 40, t[1] + 80, t[0] - 80, t[1] + 30); g.stroke();
};
PROPS.sack = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  contactShadow(g, S, cu - .35, cv - .35, cu + .35, cv + .35, .9);
  const n = v === 2 ? 3 : v === 1 ? 2 : 1;
  for (let i = 0; i < n; i++) {
    const o = gp(S, cu + (i - (n - 1) / 2) * .38, cv + (i % 2) * .2, i === 2 ? 22 : 0), c = jit([176, 150, 104], r, .08), h = 30 + r() * 8;
    const P = [[o[0] - 15, o[1] - 2], [o[0] - 17, o[1] - h * .5], [o[0] - 10, o[1] - h * .85], [o[0] - 5, o[1] - h], [o[0] - 7, o[1] - h - 5], [o[0] + 7, o[1] - h - 5], [o[0] + 5, o[1] - h], [o[0] + 10, o[1] - h * .85], [o[0] + 17, o[1] - h * .5], [o[0] + 15, o[1] - 2], [o[0], o[1] + 4]];
    paintPoly(g, P, c, r, { n: 30, sw: 3, ang: 2, aj: 1, ink: false, alt: [220, 190, 130], edge: false, wob: 2 });
    prTexFill(g, P, 'weave', 1); prShade(g, P, o[0] - 17, 0, o[0] + 17, 0, [[0, [30, 30, 60], .45], [.6, [255, 226, 170], .25], [1, [30, 30, 60], .3]]); prShade(g, P, 0, o[1] - h, 0, o[1], [[0, [0, 0, 0], 0], [1, PR_AO, .4]]);
    ink(g, P, r, 1.5, null, .85);
    g.strokeStyle = css([60, 40, 26], .5); g.lineWidth = 1; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(o[0] - 4 + k * 4, o[1] - h + 2); g.quadraticCurveTo(o[0] - 6 + k * 5, o[1] - h * .6, o[0] - 10 + k * 8, o[1] - 6); g.stroke(); }
    g.strokeStyle = css([110, 84, 50]); g.lineWidth = 2; g.beginPath(); g.moveTo(o[0] - 6, o[1] - h + 1); g.lineTo(o[0] + 6, o[1] - h + 3); g.stroke();
    g.save(); g.translate(o[0], o[1] - h * .42); g.rotate(-.06); prBlock(g, 'FLOUR', 0, 0, 7, [150, 40, 36], 22, { alpha: .8 }); prBlock(g, 'GRADE III', 0, 6, 3.6, [60, 40, 30], 18, { alpha: .7 }); g.restore();
    g.fillStyle = css([240, 236, 220], .35); g.beginPath(); g.ellipse(o[0] + 4, o[1] + 1, 8, 2, 0, 0, 7); g.fill();   // flour dust
  }
};
PROPS.barrel = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, h = v === 1 ? 44 : 40;
  contactShadow(g, S, cu - .4, cv - .4, cu + .4, cv + .4, 1);
  const col = v === 1 ? [60, 82, 108] : v === 2 ? [120, 90, 60] : [136, 96, 58];
  const c = cylBody(g, S, r, cu, cv, .38, 0, h, col, { ink: true, sw: 3, alt: v === 1 ? [160, 80, 40] : [190, 140, 90], topCol: v === 2 ? [96, 110, 120] : mul(col, .8), mat: v === 1 ? 'metal' : 'wood', spec: v === 1 ? .45 : .25 });
  if (v !== 1) { for (let k = -3; k <= 3; k++) { const q0 = gp(S, cu, cv, 1), x = q0[0] + k * c.rx / 3.6; prLine(g, [x, q0[1] + Math.sqrt(Math.max(0, 1 - (k / 3.6) ** 2)) * c.ry - 1], [x, q0[1] - h + Math.sqrt(Math.max(0, 1 - (k / 3.6) ** 2)) * c.ry + 1], [40, 24, 14], .4, .8); } }
  for (const z of v === 1 ? [12, h - 12] : [5, h * .3, h * .7, h - 5]) { const c0 = gp(S, cu, cv, z); g.strokeStyle = css(v === 1 ? [30, 40, 54] : [44, 44, 48], .95); g.lineWidth = v === 1 ? 2.6 : 3; g.beginPath(); g.ellipse(c0[0], c0[1], ecx(.38) - .3, ecy(.38), 0, 0, Math.PI); g.stroke(); g.strokeStyle = css([255, 220, 170], .3); g.lineWidth = .8; g.beginPath(); g.ellipse(c0[0], c0[1] - 1.4, ecx(.38) - .3, ecy(.38), 0, .2, 1.4); g.stroke(); }
  const tq = gp(S, cu, cv, h);
  if (v === 1) {   // steel drum: rust blooms, hazard label, bung caps
    g.save(); g.globalCompositeOperation = 'source-atop'; for (let i = 0; i < 9; i++) { const q = gp(S, cu + r.r(-.3, .3), cv + .3, r.r(5, 38)); g.fillStyle = css([150, 70, 30], .35); g.beginPath(); g.ellipse(q[0], q[1], r.r(2, 6), r.r(2, 5), 0, 0, 7); g.fill(); } g.restore();
    const q = gp(S, cu - .05, cv + .38, 30); g.fillStyle = css([214, 180, 50]); g.beginPath(); g.moveTo(q[0], q[1] - 7); g.lineTo(q[0] + 7, q[1]); g.lineTo(q[0], q[1] + 7); g.lineTo(q[0] - 7, q[1]); g.fill(); g.strokeStyle = css(INK, .8); g.lineWidth = 1; g.stroke(); prBlock(g, '!', q[0], q[1] + .5, 8, [30, 20, 10], 6);
    g.fillStyle = css([50, 60, 70]); g.beginPath(); g.ellipse(tq[0] + 6, tq[1] - 1, 3, 1.4, 0, 0, 7); g.fill(); g.strokeStyle = css([170, 180, 190], .5); g.lineWidth = .8; g.beginPath(); g.ellipse(tq[0], tq[1], c.rx - 3, c.ry - 2, 0, 0, 7); g.stroke();
  } else { g.strokeStyle = css([60, 40, 24], .6); g.lineWidth = .8; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(tq[0] - c.rx * .8, tq[1] + k * 2.6); g.lineTo(tq[0] + c.rx * .8, tq[1] + k * 2.6); g.stroke(); } if (r() < .6) prCup(g, S, r, cu + .1, cv, h, [140, 150, 140]); }
};
PROPS.mic = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  contactShadow(g, S, cu - .25, cv - .25, cu + .25, cv + .25, .8);
  cylBody(g, S, r, cu, cv, .2, 0, 4, [40, 42, 46], { ink: true, mat: 'metal', spec: .6 });
  vbar(g, S, r, cu, cv, 3, 40, 3, [150, 154, 156]); vbar(g, S, r, cu, cv, 40, 64, 2.2, [180, 184, 186]);
  { const q = gp(S, cu, cv, 40); paintRect(g, q[0] - 3, q[1] - 2, 6, 4, [60, 60, 64], r, { n: 2, ink: true, inkw: .8 }); }
  const t = gp(S, cu, cv, 64);
  g.strokeStyle = css(INK, .85); g.lineWidth = 3.6; g.beginPath(); g.moveTo(t[0], t[1]); g.quadraticCurveTo(t[0] + 6, t[1] - 18, t[0] + 12, t[1] - 22); g.stroke(); g.strokeStyle = css([150, 154, 156]); g.lineWidth = 2; g.stroke();
  // big ribbon microphone: chrome cage around a grille
  const mx = t[0] + 14, my = t[1] - 25;
  paintEll(g, mx, my, 7, 10, v === 0 ? [176, 180, 184] : [110, 110, 114], r, { n: 10, ink: true, inkw: 1.2, edge: false });
  g.fillStyle = css([30, 30, 34], .85); g.beginPath(); g.ellipse(mx, my, 4.6, 7.4, 0, 0, 7); g.fill();
  g.strokeStyle = css([150, 150, 154], .6); g.lineWidth = .6; for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(mx - 4.2, my + k * 2); g.lineTo(mx + 4.2, my + k * 2); g.stroke(); }
  g.strokeStyle = css([230, 236, 240], .8); g.lineWidth = 1; g.beginPath(); g.ellipse(mx, my, 7, 10, 0, -2.2, -.6); g.stroke();
  g.fillStyle = css([255, 250, 240], .8); g.fillRect(mx + 3, my - 7, 1.4, 1.4);
  if (v === 1) {   // dead mic: electrical tape round the neck, cable coiled on the floor and cut
    g.fillStyle = css([20, 20, 22]); g.fillRect(t[0] + 4, t[1] - 12, 5, 4);
    const b = gp(S, cu, cv, 2); g.strokeStyle = css(INK, .9); g.lineWidth = 1.8; g.beginPath(); g.moveTo(b[0], b[1]); g.bezierCurveTo(b[0] + 30, b[1] + 6, b[0] + 10, b[1] + 20, b[0] + 44, b[1] + 16); g.stroke(); g.fillStyle = css([200, 130, 60]); g.fillRect(b[0] + 44, b[1] + 15, 2, 2);
  } else { const b = gp(S, cu, cv, 2); g.strokeStyle = css(INK, .9); g.lineWidth = 1.6; g.beginPath(); g.moveTo(t[0], t[1] + 30); g.quadraticCurveTo(t[0] + 20, t[1] + 50, t[0] + 60, t[1] + 44); g.stroke(); g.fillStyle = css([255, 60, 40]); g.beginPath(); g.arc(mx - 9, my + 6, 1.4, 0, 7); g.fill(); prLight(S, mx - 9, my + 6, 18, [255, 60, 40], .5, .3, 'lamp', 'mic', 92, cu, cv); }
};
PROPS.sofa = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, c = [[70, 100, 80], [120, 78, 54], [130, 50, 50], [90, 92, 110]][v];
  contactShadow(g, S, u0, v0, u1, v1, .9);
  for (const [uu, vv] of [[u0 + .15, v1 - .12], [u1 - .15, v1 - .12], [u1 - .15, v0 + .12]]) vbar(g, S, r, uu, vv, 0, 10, 3.4, [40, 30, 24]);
  fcs(g, S, r, u0, v0, u1, v0 + .35, 10, 50, c, { vert: false, alt: mul(c, 1.4), mat: 'fabric', wear: .3, under: [200, 190, 160] });
  fcs(g, S, r, u0, v0 + .2, u0 + .3, v1, 10, 34, c, { mat: 'fabric' });
  const n = Math.max(1, Math.round((u1 - u0) / 0.9));
  for (let i = 0; i < n; i++) fcs(g, S, r, lerp(u0 + .3, u1 - .3, i / n) + .02, v0 + .3, lerp(u0 + .3, u1 - .3, (i + 1) / n) - .02, v1 - .02, 10, 26, mul(c, 1.08), { alt: mul(c, 1.5), dens: 26, mat: 'fabric', wear: .3, under: [210, 200, 170] });
  fcs(g, S, r, u1 - .3, v0 + .2, u1, v1, 10, 34, c, { mat: 'fabric', wear: .4, under: [200, 190, 160] });
  { const q = gp(S, u0 + .8, v1 - .3, 26); g.fillStyle = css([226, 214, 170], .7); g.beginPath(); g.ellipse(q[0], q[1], 6, 2.4, .3, 0, 7); g.fill(); g.strokeStyle = css([60, 40, 30], .7); g.lineWidth = .8; g.stroke(); }   // split seam, stuffing
};
PROPS.cart = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I;
  contactShadow(g, S, u0, v0, u1, v1, .9);
  const c = v === 1 ? [140, 100, 64] : [160, 166, 166];
  for (const [uu, vv] of [[u0 + .1, v0 + .1], [u1 - .1, v0 + .1], [u1 - .1, v1 - .1], [u0 + .1, v1 - .1]]) vbar(g, S, r, uu, vv, 6, 50, 2.6, mul(c, .7));
  fcs(g, S, r, u0 + .05, v0 + .05, u1 - .05, v1 - .05, 14, 17, c, { mat: v === 1 ? 'wood' : 'metal' }); fcs(g, S, r, u0, v0, u1, v1, 46, 49, c, { mat: v === 1 ? 'wood' : 'metal', wear: .4 });
  for (const [uu, vv] of [[u0 + .2, v1 - .05], [u1 - .05, v1 - .2], [u1 - .05, v0 + .2]]) { const q = gp(S, uu, vv, 6); g.fillStyle = css([30, 30, 32]); g.beginPath(); g.arc(q[0], q[1], 5, 0, 7); g.fill(); g.strokeStyle = css([150, 150, 150]); g.lineWidth = 1.2; g.stroke(); g.fillStyle = css([170, 170, 170]); g.beginPath(); g.arc(q[0], q[1], 1.6, 0, 7); g.fill(); }
  prClutter(g, S, r, u0 + .1, v0 + .1, u1 - .1, v1 - .1, 49, 'canteen', 2.4);
  prClutter(g, S, r, u0 + .15, v0 + .15, u1 - .15, v1 - .15, 17, 'canteen', 1.2);
};
PROPS.tray = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, q = gp(S, cu, cv, 0);
  const pts = [[q[0] - 17, q[1]], [q[0], q[1] - 8.5], [q[0] + 17, q[1]], [q[0], q[1] + 8.5]];
  g.fillStyle = css([6, 4, 14], .3); pathPoly(g, pts.map(a => [a[0] - 2, a[1] + 2])); g.fill();
  paintPoly(g, pts, [150, 156, 154], r, { n: 8, ink: true, inkw: 1.2, ew: 1.2, ha: 1, edge: false });
  prTexFill(g, pts, 'scratch', 1);
  paintPoly(g, [[q[0] - 13, q[1]], [q[0], q[1] - 6.5], [q[0] + 13, q[1]], [q[0], q[1] + 6.5]], [118, 124, 122], r, { n: 4, ink: false, edge: false });
  prLine(g, pts[3], pts[2], [255, 255, 250], .5, 1);
  prBowl(g, S, r, cu - .1, cv - .02, 1, [210, 204, 184], v % 2 ? [150, 100, 50] : [120, 140, 70]);
  prBread(g, S, r, cu + .12, cv - .14, 1);
  prSpoon(g, S, cu + .08, cv + .12, 1, -.3);
};
PROPS.tree = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, base = gp(S, cu, cv, 0), bx = base[0], by = base[1];
  g.fillStyle = css([6, 4, 16], .2); g.beginPath(); g.ellipse(bx - 18, by + 4, 74, 28, -.1, 0, 7); g.fill();
  // iron tree guard + root flare
  for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI, x = bx + Math.cos(a) * 18, y = by + Math.sin(a) * 7; prLine(g, [x, y], [x, y - 22], INK, .85, 2.4); prLine(g, [x, y], [x, y - 22], [50, 52, 56], 1, 1.2); }
  g.strokeStyle = css([50, 52, 56]); g.lineWidth = 2; g.beginPath(); g.ellipse(bx, by - 20, 18, 7, 0, 0, Math.PI); g.stroke();
  const trunk = [[bx - 13, by + 4], [bx - 8, by - 10], [bx - 7, by - 60], [bx - 13, by - 112], [bx + 6, by - 114], [bx + 3, by - 62], [bx + 9, by - 10], [bx + 14, by + 4]];
  paintPoly(g, trunk, [80, 60, 46], r, { n: 44, ang: 1.57, aj: .2, sw: 3, ink: true, inkw: 2, alt: [130, 96, 66], edge: false });
  prShade(g, trunk, bx - 13, 0, bx + 14, 0, [[0, [20, 24, 44], .55], [.55, [0, 0, 0], 0], [.8, [255, 190, 110], .35], [1, [20, 24, 44], .3]]);
  g.strokeStyle = css([40, 28, 20], .55); g.lineWidth = 1; for (let i = 0; i < 12; i++) { const y = by - r() * 105, x = bx + (r() - .5) * 12; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - .5) * 3, y - 6 - r() * 10); g.stroke(); }
  if (r() < .8) { const q = [bx - 4, by - 62]; g.save(); g.translate(q[0], q[1]); g.rotate(-.06); g.fillStyle = css([226, 214, 180]); g.fillRect(-6, -8, 12, 16); prTypeLines(g, r, -4, -4, 8, 3, 3, [40, 30, 30], .6); g.fillStyle = css([40, 40, 40]); g.fillRect(-.6, -9, 1.2, 1.2); g.restore(); }   // nailed notice
  const autumn = v !== 1, cols = v === 1 ? [[78, 92, 48], [56, 66, 42], [116, 110, 52]] : [[148, 116, 44], [176, 96, 40], [104, 120, 52], [200, 148, 50], [120, 68, 40]];
  const blobs = v === 1 ? 6 : 12, cx0 = bx - 4, cy0 = by - 150;
  // branches
  g.strokeStyle = css([60, 44, 34], .95); g.lineCap = 'round'; for (let i = 0; i < 5; i++) { g.lineWidth = 3.6 - i * .4; g.beginPath(); g.moveTo(bx - 2, by - 100 + i * 4); const ex = bx + r.r(-56, 56), ey = by - r.r(120, 170); g.quadraticCurveTo((bx + ex) / 2, by - 120, ex, ey); g.stroke(); }
  // canopy: dark core masses, then clustered leaf dabs, lit toward the upper right, cool underneath
  const dab = (x, y, rx, ry, c, a) => { g.fillStyle = css(c, a); g.beginPath(); g.ellipse(x, y, rx, ry, r() * 3, 0, 7); g.fill(); };
  for (let i = 0; i < blobs; i++) { const a = r() * 6.28, d = r() * 50, x = cx0 + Math.cos(a) * d * 1.3, y = cy0 + Math.sin(a) * d * .8; const gr = g.createRadialGradient(x, y, 2, x, y, 40); const c = mix(r.p(cols), [20, 26, 40], .55); gr.addColorStop(0, css(c, .9)); gr.addColorStop(.7, css(c, .6)); gr.addColorStop(1, css(c, 0)); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, 40, 30, 0, 0, 7); g.fill(); }
  const nd = v === 1 ? 170 : 420;
  for (let i = 0; i < nd; i++) {
    const a = r() * 6.28, d = Math.sqrt(r()) * 80, x = cx0 + Math.cos(a) * d * 1.25, y = cy0 + Math.sin(a) * d * .78;
    const lit = clamp(.5 + (Math.cos(a + .9) * d / 80) * .6 - (y - cy0) / 160, 0, 1), base = r.p(cols);
    const c = lit > .62 ? mix(base, [255, 200, 110], (lit - .6) * 1.1) : mix(base, [24, 34, 52], (1 - lit) * .55);
    const n = 3 + (r() * 3 | 0); for (let k = 0; k < n; k++) dab(x + (r() - .5) * 7, y + (r() - .5) * 5, r.r(1.6, 3.4), r.r(1.1, 2.2), jit(c, r, .08), .85);
  }
  for (let i = 0; i < 30; i++) { const a = -.9 + (r() - .5) * 1.4, d = 70 + r() * 14, x = cx0 + Math.cos(a) * d * 1.25, y = cy0 + Math.sin(a) * d * .78; dab(x, y, 2.4, 1.6, mix(r.p(cols), [255, 210, 120], .55), .9); }   // rim-lit edge leaves
  // gaps where the sky shows through
  for (let i = 0; i < 8; i++) { const x = cx0 + r.r(-60, 60), y = cy0 + r.r(-40, 30); dab(x, y, r.r(2, 4), r.r(1.5, 3), [30, 36, 50], .4); }
  if (v === 1) { g.strokeStyle = css([50, 40, 32], .8); g.lineWidth = 1.2; for (let i = 0; i < 10; i++) { const x = cx0 + r.r(-70, 70), y = cy0 + r.r(-50, 30); g.beginPath(); g.moveTo(x, y); g.lineTo(x + r.r(-14, 14), y - r.r(6, 16)); g.stroke(); } }
  if (autumn) for (let i = 0; i < 16; i++) { const x = bx + r.r(-60, 40), y = by + r.r(-8, 16); g.fillStyle = css(jit(r.p(cols), r, .15), .85); g.beginPath(); g.ellipse(x, y, 2.6, 1.3, r() * 3, 0, 7); g.fill(); }   // fallen leaves
};
PROPS.bell = function (g, S, p, I) {   // the old school bell on its timber frame
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  contactShadow(g, S, cu - .45, cv - .45, cu + .45, cv + .45, 1);
  fcs(g, S, r, cu - .4, cv - .35, cu + .4, cv + .35, 0, 8, [110, 108, 100], { mat: 'stone', wear: .5 });
  for (const du of [-.32, .32]) { const a = gp(S, cu + du, cv, 8), b = gp(S, cu + du * .2, cv, 112); const P = [[a[0] - 3.4, a[1]], [a[0] + 3.4, a[1]], [b[0] + 2.4, b[1]], [b[0] - 2.4, b[1]]]; paintPoly(g, P, [96, 64, 40], r, { n: 6, ink: false, ang: 1.57, edge: false }); prTexFill(g, P, 'grain', .9, (k) => k.rotate(1.5708)); prShade(g, P, a[0] - 3.4, 0, a[0] + 3.4, 0, [[0, [20, 20, 40], .4], [.7, [255, 200, 140], .3], [1, [20, 20, 40], .3]]); ink(g, P, r, 1.2, null, .85); }
  const t = gp(S, cu, cv, 112); paintRect(g, t[0] - 18, t[1] - 4, 36, 7, [92, 62, 38], r, { n: 6, ink: true, inkw: 1.2, ang: 0, edge: false }); prLine(g, [t[0] - 18, t[1] - 4], [t[0] + 18, t[1] - 4], [255, 210, 150], .4, 1);
  const bc = v === 1 ? [90, 150, 126] : [176, 132, 62];
  const B = [[t[0] - 6, t[1] + 3], [t[0] + 6, t[1] + 3], [t[0] + 10, t[1] + 14], [t[0] + 17, t[1] + 34], [t[0] + 22, t[1] + 44], [t[0] - 22, t[1] + 44], [t[0] - 17, t[1] + 34], [t[0] - 10, t[1] + 14]];
  paintPoly(g, B, bc, r, { n: 30, ang: 1.5, ink: false, alt: [255, 220, 120], edge: false });
  prShade(g, B, t[0] - 22, 0, t[0] + 22, 0, [[0, [20, 40, 50], .6], [.35, bc, 0], [.62, [255, 236, 180], .45], [.78, bc, 0], [1, [255, 160, 80], .45]]);
  g.save(); pathPoly(g, B); g.clip(); for (let i = 0; i < 10; i++) { g.fillStyle = css([80, 150, 120], .25 + r() * .2); g.fillRect(t[0] + r.r(-18, 18), t[1] + r.r(8, 30), r.r(1.4, 3.4), r.r(5, 16)); } g.restore();   // verdigris runs
  ink(g, B, r, 1.8, null, .9);
  g.fillStyle = css([20, 12, 10], .9); g.beginPath(); g.ellipse(t[0], t[1] + 44, 22, 5, 0, 0, 7); g.fill();
  g.strokeStyle = css(mix(bc, [255, 230, 160], .4), .8); g.lineWidth = 1.6; g.beginPath(); g.ellipse(t[0], t[1] + 43, 22, 5, 0, 0, Math.PI); g.stroke();
  g.fillStyle = css([60, 50, 40]); g.beginPath(); g.arc(t[0] + 2, t[1] + 46, 3.4, 0, 7); g.fill();   // clapper
  g.strokeStyle = css([200, 180, 140]); g.lineWidth = 1.4; g.beginPath(); g.moveTo(t[0] + 30, t[1] - 3); g.quadraticCurveTo(t[0] + 36, t[1] + 40, t[0] + 28, t[1] + 78); g.stroke();
  g.fillStyle = css([140, 70, 44]); g.beginPath(); g.arc(t[0] + 28, t[1] + 80, 3, 0, 7); g.fill();
  g.save(); faceL(g, S, cu - .3, cv + .35, 7); prBlock(g, '1891', 19, 3.4, 5, [40, 36, 30], 20, { alpha: .6 }); g.restore();
};
PROPS.hoop = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  contactShadow(g, S, cu - .25, cv - .35, cu + .25, cv + .25, .8);
  cylBody(g, S, r, cu, cv - .35, .18, 0, 8, [60, 60, 62], { ink: true, mat: 'metal' });
  vbar(g, S, r, cu, cv - .35, 6, 150, 6, [92, 96, 98]);
  { const q = gp(S, cu, cv - .35, 40); g.fillStyle = css([200, 50, 40], .9); g.fillRect(q[0] - 3, q[1] - 30, 6, 30); g.fillStyle = css([230, 220, 200]); for (let k = 0; k < 3; k++) g.fillRect(q[0] - 3, q[1] - 26 + k * 9, 6, 3); }   // padding
  const b0 = gp(S, cu, cv - .35, 148), b1 = gp(S, cu, cv, 112);
  g.strokeStyle = css(INK, .85); g.lineWidth = 5; g.beginPath(); g.moveTo(b0[0], b0[1]); g.lineTo(b1[0], b1[1] - 2); g.stroke(); g.strokeStyle = css([80, 84, 86]); g.lineWidth = 3; g.stroke();
  fcs(g, S, r, cu - .6, cv - .05, cu + .6, cv + .02, 98, 150, [226, 224, 214], { alt: [255, 255, 255], ink: true, dens: 50, mat: 'wood', wear: .4, under: [150, 130, 100] });
  const inner = [gp(S, cu - .22, cv + .03, 110), gp(S, cu + .22, cv + .03, 110), gp(S, cu + .22, cv + .03, 132), gp(S, cu - .22, cv + .03, 132)];
  g.strokeStyle = css([190, 50, 40], .95); g.lineWidth = 2.2; pathPoly(g, inner); g.stroke();
  // ball smudges on the board
  for (let k = 0; k < 6; k++) { const q = gp(S, cu + r.r(-.4, .4), cv + .03, r.r(108, 145)); g.fillStyle = css([90, 70, 50], .15); g.beginPath(); g.arc(q[0], q[1], r.r(3, 6), 0, 7); g.fill(); }
  const rim = gp(S, cu, cv + .38, 106);
  g.strokeStyle = css(INK, .85); g.lineWidth = 4.4; g.beginPath(); g.ellipse(rim[0], rim[1], ecx(.3), ecy(.3), 0, 0, 7); g.stroke(); g.strokeStyle = css([220, 90, 40]); g.lineWidth = 2.6; g.stroke();
  g.strokeStyle = css([255, 200, 150], .6); g.lineWidth = 1; g.beginPath(); g.ellipse(rim[0], rim[1] - 1, ecx(.3), ecy(.3), 0, 3.3, 6); g.stroke();
  g.strokeStyle = css([236, 232, 220], .75); g.lineWidth = 1;
  for (let k = 0; k < 12; k++) { const a = k / 12 * 6.28, x = rim[0] + Math.cos(a) * ecx(.3), y = rim[1] + Math.sin(a) * ecy(.3), a2 = a + .6; g.beginPath(); g.moveTo(x, y); g.lineTo(rim[0] + Math.cos(a2) * ecx(.17), rim[1] + 20 + Math.sin(a2) * ecy(.17)); g.stroke(); }
  g.beginPath(); g.ellipse(rim[0], rim[1] + 10, ecx(.24), ecy(.24), 0, 0, 7); g.stroke(); g.beginPath(); g.ellipse(rim[0], rim[1] + 20, ecx(.17), ecy(.17), 0, 0, 7); g.stroke();
  // torn net strand hanging
  g.beginPath(); g.moveTo(rim[0] + 8, rim[1] + 20); g.lineTo(rim[0] + 10, rim[1] + 30); g.stroke();
};
PROPS.fence = function (g, S, p, I) {   // free-standing low railing along the long axis
  const { r, v, u0, v0, u1, v1 } = I, alongU = (u1 - u0) >= (v1 - v0), cv = (v0 + v1) / 2, cu = (u0 + u1) / 2;
  const n = Math.max(2, Math.round((alongU ? u1 - u0 : v1 - v0) * 3));
  for (let i = 0; i <= n; i++) { const t = i / n; const uu = alongU ? lerp(u0 + .05, u1 - .05, t) : cu, vv = alongU ? cv : lerp(v0 + .05, v1 - .05, t); vbar(g, S, r, uu, vv, 0, 40, 2.6, [40, 40, 46]); const q = gp(S, uu, vv, 40); g.fillStyle = css([190, 160, 80]); g.beginPath(); g.arc(q[0], q[1] - 1, 2, 0, 7); g.fill(); }
  for (const z of [34, 10]) { const a = gp(S, alongU ? u0 : cu, alongU ? cv : v0, z), b = gp(S, alongU ? u1 : cu, alongU ? cv : v1, z); prLine(g, a, b, INK, .9, 4); prLine(g, a, b, [56, 56, 62], 1, 2.4); prLine(g, [a[0], a[1] - 1], [b[0], b[1] - 1], [255, 200, 140], .35, .8); }
};
PROPS.chalkboard = function (g, S, p, I) {   // A-frame menu board
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  contactShadow(g, S, cu - .4, cv - .2, cu + .4, cv + .2, .8);
  const q = gp(S, cu, cv, 0);
  g.strokeStyle = css(INK, .85); g.lineWidth = 5; g.beginPath(); g.moveTo(q[0] - 24, q[1]); g.lineTo(q[0] - 14, q[1] - 70); g.moveTo(q[0] + 24, q[1]); g.lineTo(q[0] + 14, q[1] - 70); g.moveTo(q[0], q[1] + 3); g.lineTo(q[0], q[1] - 58); g.stroke();
  g.strokeStyle = css([110, 76, 46]); g.lineWidth = 3.2; g.stroke();
  g.save(); g.translate(q[0] - 30, q[1] - 82); g.transform(1, .45, 0, 1, 0, 0);
  paintRect(g, -3, -3, 66, 50, [120, 84, 50], r, { n: 12, ink: true, inkw: 1.2, ang: 0, edge: false }); prBevel(g, -3, -3, 66, 50); paintRect(g, 0, 0, 60, 44, [34, 46, 42], r, { n: 24, sw: 5, ang: .2, aj: 1, alt: [70, 84, 78], ink: true, inkw: .9, edge: false }); chalkMenu(g, r, 0, 0, 60, 44, 'MENU'); g.restore();
};
PROPS.mirror = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, q = gp(S, cu, cv, 0);
  contactShadow(g, S, cu - .35, cv - .2, cu + .35, cv + .2, .8);
  g.strokeStyle = css(INK, .85); g.lineWidth = 6.4; g.beginPath(); g.moveTo(q[0] - 20, q[1]); g.lineTo(q[0] - 14, q[1] - 40); g.moveTo(q[0] + 20, q[1]); g.lineTo(q[0] + 14, q[1] - 40); g.stroke(); g.strokeStyle = css([80, 54, 34]); g.lineWidth = 4.4; g.stroke();
  g.save(); g.translate(q[0], q[1] - 46);
  paintPoly(g, ellPts(0, -34, 22, 40, 20, 0, r, .02), [100, 70, 44], r, { n: 24, ink: true, ang: 1.57, alt: [180, 130, 70], edge: false });
  const gr = g.createLinearGradient(-16, -66, 16, -4); gr.addColorStop(0, css([186, 200, 196])); gr.addColorStop(.5, css([100, 126, 130])); gr.addColorStop(1, css([46, 62, 76]));
  g.fillStyle = gr; g.beginPath(); g.ellipse(0, -34, 17, 35, 0, 0, 7); g.fill();
  prTexFill(g, ellPts(0, -34, 17, 35, 16), 'grime', 1);
  g.strokeStyle = css([14, 18, 22], .9); g.lineWidth = 1.1; g.beginPath(); g.moveTo(-6, -66); g.lineTo(2, -44); g.lineTo(-4, -26); g.lineTo(8, -8); g.moveTo(2, -44); g.lineTo(16, -50); g.moveTo(-4, -26); g.lineTo(-16, -30); g.stroke();
  g.strokeStyle = css([255, 255, 255], .35); g.lineWidth = 2.5; g.beginPath(); g.moveTo(-10, -58); g.lineTo(-10, -20); g.stroke();
  g.restore();
};
PROPS.ladder = function (g, S, p, I) {   // free-standing ladder leaning
  const { r, v, u0, v0, u1, v1 } = I, q = gp(S, (u0 + u1) / 2, (v0 + v1) / 2, 0);
  g.lineCap = 'round';
  for (const pass of [0, 1]) { g.strokeStyle = pass ? css([150, 110, 70]) : css(INK, .85); g.lineWidth = pass ? 3 : 4.6; g.beginPath(); g.moveTo(q[0] - 8, q[1]); g.lineTo(q[0] - 2, q[1] - 90); g.moveTo(q[0] + 8, q[1]); g.lineTo(q[0] + 14, q[1] - 90); g.stroke(); g.lineWidth = pass ? 2.4 : 3.8; for (let z = 10; z < 86; z += 12) { g.beginPath(); g.moveTo(q[0] - 8 + z * .07, q[1] - z); g.lineTo(q[0] + 8 + z * .07, q[1] - z); g.stroke(); } }
  for (let z = 10; z < 86; z += 12) prLine(g, [q[0] - 7 + z * .07, q[1] - z - 1], [q[0] + 7 + z * .07, q[1] - z - 1], [255, 220, 170], .35, .8);
};
/* ---- flat (floor-level) props, baked into the floor layer ---- */
FLAT.rug = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, W = (u1 - u0) * 64, H = (v1 - v0) * 64;
  g.save(); g.translate(...gp(S, u0, v0, 0)); g.transform(.5, .25, -.5, .25, 0, 0);
  g.fillStyle = css([8, 6, 14], .35); g.fillRect(-4, -2, W + 8, H + 8);
  const pal = [[[140, 42, 38], [222, 172, 90], [40, 56, 60]], [[42, 96, 100], [222, 192, 136], [146, 68, 50]], [[58, 88, 68], [196, 168, 100], [120, 30, 30]], [[110, 80, 60], [180, 150, 110], [60, 50, 44]]][v];
  paintRect(g, 0, 0, W, H, pal[0], r, { n: W * H / 110, sw: 5, ang: 0, aj: .1, alt: pal[1], jv: .1, ink: true, inkw: 2, ew: 1.4, ha: .4, edge: false });
  prTexFill(g, [[0, 0], [W, 0], [W, H], [0, H]], 'weave', 1);
  paintRect(g, 9, 9, W - 18, H - 18, mul(pal[0], .82), r, { n: W * H / 180, sw: 4, ang: 0, alt: pal[2], jv: .1, ink: false, edge: false });
  // border bands + a running motif
  g.strokeStyle = css(pal[1], .9); g.lineWidth = 3; g.strokeRect(14, 14, W - 28, H - 28); g.strokeStyle = css(pal[2], .8); g.lineWidth = 2; g.strokeRect(22, 22, W - 44, H - 44);
  g.fillStyle = css(pal[1], .7); for (let x = 26; x < W - 26; x += 10) { g.beginPath(); g.moveTo(x, 17); g.lineTo(x + 4, 19.5); g.lineTo(x, 22); g.fill(); g.beginPath(); g.moveTo(x, H - 17); g.lineTo(x + 4, H - 19.5); g.lineTo(x, H - 22); g.fill(); }
  const cx = W / 2, cy = H / 2, k = Math.min(W, H) / 2 - 30;
  g.fillStyle = css(pal[1], .85); g.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283, rr = i % 2 ? k * .35 : k * .8; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.closePath(); g.fill(); g.strokeStyle = css(pal[2], .9); g.lineWidth = 2; g.stroke();
  g.fillStyle = css(pal[2], .9); g.beginPath(); g.arc(cx, cy, k * .18, 0, 7); g.fill();
  if (v === 2) { g.fillStyle = css([230, 200, 100], .9); g.beginPath(); g.arc(cx, cy, k * .3, 0, 7); g.fill(); prBellGlyph(g, cx, cy, k * .42, [120, 30, 30]); }
  // wear: the faded walking path, threadbare patches, stains, frayed fringe
  const wg = g.createLinearGradient(0, 0, W, H); wg.addColorStop(0, 'rgba(230,210,170,0)'); wg.addColorStop(.5, 'rgba(230,210,170,.16)'); wg.addColorStop(1, 'rgba(230,210,170,0)'); g.fillStyle = wg; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 4; i++) { const x = r() * W, y = r() * H, rr = r.r(8, 20), gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(200,180,150,.3)'); gr.addColorStop(1, 'rgba(200,180,150,0)'); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  for (let i = 0; i < 18; i++) { g.fillStyle = css([20, 16, 14], .08); g.beginPath(); g.ellipse(r() * W, r() * H, r.r(8, 24), r.r(5, 14), 0, 0, 7); g.fill(); }
  g.strokeStyle = css(pal[1], .7); g.lineWidth = 1.4; for (let x = 0; x < W; x += 4) { const l1 = 3 + r() * 3, l2 = 3 + r() * 3; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (r() - .5) * 2, -l1); g.moveTo(x, H); g.lineTo(x + (r() - .5) * 2, H + l2); g.stroke(); }
  if (r() < .6) { g.save(); g.translate(W * r.r(.6, .9), 0); g.fillStyle = css([8, 6, 14], .35); g.beginPath(); g.moveTo(0, 0); g.lineTo(24, 0); g.lineTo(24, 18); g.fill(); g.fillStyle = css(mul(pal[0], .7)); g.beginPath(); g.moveTo(0, 0); g.lineTo(22, -2); g.lineTo(20, 16); g.fill(); g.restore(); }   // curled corner
  g.restore();
};
FLAT.mat = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, W = (u1 - u0) * 64, H = (v1 - v0) * 64, col = v === 1 ? [64, 96, 118] : [150, 70, 54];
  const t = 9;
  const A = gp(S, u0, v0, t), B = gp(S, u1, v0, t), Cc = gp(S, u1, v1, t), D = gp(S, u0, v1, t), D0 = gp(S, u0, v1, 0), C0 = gp(S, u1, v1, 0), B0 = gp(S, u1, v0, 0);
  g.fillStyle = css([6, 4, 14], .35); pathPoly(g, [A, B, Cc, D].map(q => [q[0] - 4, q[1] + t + 2])); g.fill();
  paintPoly(g, [D, Cc, C0, D0], mul(col, .55), r, { n: 16, ang: .46, ink: true, edge: false });
  paintPoly(g, [Cc, B, B0, C0], mul(col, .85), r, { n: 16, ang: 2.68, ink: true, edge: false });
  g.save(); g.translate(A[0], A[1]); g.transform(.5, .25, -.5, .25, 0, 0);
  g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.clip();
  g.fillStyle = css(mul(col, 1.05)); g.fillRect(0, 0, W, H);
  for (let i = 0; i < W * H / 80; i++) bristle(g, r() * W, r() * H, r() * 3, 20, 5, jit(col, r, .16), .5, r);
  g.fillStyle = g.createPattern(prTex('scratch'), 'repeat'); g.globalAlpha = .8; g.fillRect(0, 0, W, H); g.fillStyle = g.createPattern(prTex('grime'), 'repeat'); g.fillRect(0, 0, W, H); g.globalAlpha = 1;
  const nx = Math.max(2, Math.round(W / 64)), ny = Math.max(2, Math.round(H / 64));
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const x0 = i * W / nx, y0 = j * H / ny, w = W / nx, h = H / ny;
    const gg = g.createRadialGradient(x0 + w * .6, y0 + h * .4, 2, x0 + w / 2, y0 + h / 2, w * .7); gg.addColorStop(0, 'rgba(255,220,170,.25)'); gg.addColorStop(1, 'rgba(10,6,20,.28)'); g.fillStyle = gg; g.fillRect(x0 + 1, y0 + 1, w - 2, h - 2);
    g.strokeStyle = css([20, 12, 14], .7); g.lineWidth = 2; g.strokeRect(x0 + 1, y0 + 1, w - 2, h - 2);
    g.fillStyle = css([230, 210, 170], .6); g.beginPath(); g.arc(x0 + w / 2, y0 + h / 2, 2.2, 0, 7); g.fill();
  }
  // a split seam taped over, chalk dust from hands
  g.fillStyle = css([200, 190, 160], .7); g.fillRect(W * .3, H * .5 - 3, 30, 6); g.fillStyle = css([255, 255, 250], .12); g.beginPath(); g.ellipse(W * .6, H * .4, 30, 14, 0, 0, 7); g.fill();
  g.restore();
  rimStroke(g, [Cc, B, A], [255, 190, 120], .5, 1.6);
  if (v === 1) { const h1 = gp(S, (u0 + u1) / 2, v1, 5); g.strokeStyle = css([230, 220, 190], .9); g.lineWidth = 2; g.beginPath(); g.ellipse(h1[0], h1[1], 8, 2.6, 0, 0, 7); g.stroke(); }
};
FLAT.rope = function (g, S, p, I) {
  const { r, u0, v0, u1, v1 } = I, c = gp(S, (u0 + u1) / 2, (v0 + v1) / 2, 0);
  g.fillStyle = css([6, 4, 14], .35); g.beginPath(); g.ellipse(c[0] - 3, c[1] + 3, 20, 9, 0, 0, 7); g.fill();
  for (let k = 0; k < 4; k++) {
    g.strokeStyle = css(INK, .8); g.lineWidth = 5; g.beginPath(); g.ellipse(c[0], c[1] - k * 1.6, 17 - k * 2.6, 7.6 - k * 1.2, 0, 0, 7); g.stroke();
    g.strokeStyle = css(jit([176, 144, 96], r, .1)); g.lineWidth = 3.4; g.stroke();
    g.strokeStyle = css([60, 44, 28], .5); g.lineWidth = 1; g.setLineDash([2, 3]); g.stroke(); g.setLineDash([]);
    g.strokeStyle = css([255, 230, 180], .35); g.lineWidth = .8; g.beginPath(); g.ellipse(c[0], c[1] - k * 1.6 - 1, 17 - k * 2.6, 7.6 - k * 1.2, 0, 3.4, 6); g.stroke();
  }
  g.strokeStyle = css(INK, .8); g.lineWidth = 5; g.beginPath(); g.moveTo(c[0] + 12, c[1] + 2); g.bezierCurveTo(c[0] + 30, c[1] + 8, c[0] + 40, c[1] - 6, c[0] + 56, c[1] + 6); g.stroke(); g.strokeStyle = css([176, 144, 96]); g.lineWidth = 3.4; g.stroke();
  // frayed, cleanly-cut end (the clue: it was cut, not worn)
  g.fillStyle = css([210, 186, 140]); g.beginPath(); g.ellipse(c[0] + 56, c[1] + 6, 2.2, 1.8, 0, 0, 7); g.fill(); g.strokeStyle = css([200, 170, 120], .8); g.lineWidth = .7; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(c[0] + 56, c[1] + 6); g.lineTo(c[0] + 59 + r() * 2, c[1] + 4 + r() * 4); g.stroke(); }
};
FLAT.stage = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, H = STAGE_H, wood = v === 1 ? [120, 78, 54] : [100, 72, 52];
  const A = gp(S, u0, v0, H), B = gp(S, u1, v0, H), Cc = gp(S, u1, v1, H), D = gp(S, u0, v1, H), D0 = gp(S, u0, v1, 0), C0 = gp(S, u1, v1, 0), B0 = gp(S, u1, v0, 0);
  g.fillStyle = css([6, 4, 14], .35); pathPoly(g, [D0, C0, B0, [B0[0] - 8, B0[1] + 6], [C0[0] - 8, C0[1] + 6], [D0[0] - 8, D0[1] + 6]]); g.fill();
  // apron: painted skirting boards with a scuffed kick line
  const fL = [D, Cc, C0, D0], fR = [Cc, B, B0, C0];
  paintPoly(g, fL, mul(wood, .5), r, { n: 40, ang: 1.57, ink: true, alt: [160, 110, 70], edge: false });
  paintPoly(g, fR, mul(wood, .75), r, { n: 40, ang: 1.57, ink: true, alt: [200, 140, 80], edge: false });
  prTexFill(g, fL, 'grime', 1); prTexFill(g, fR, 'grime', .8);
  { const n = Math.round((u1 - u0) * 2); for (let i = 1; i < n; i++) { const a = gp(S, lerp(u0, u1, i / n), v1, H), b = gp(S, lerp(u0, u1, i / n), v1, 0); prLine(g, a, b, [20, 12, 10], .5, 1); } const m = Math.round((v1 - v0) * 2); for (let i = 1; i < m; i++) { const a = gp(S, u1, lerp(v0, v1, i / m), H), b = gp(S, u1, lerp(v0, v1, i / m), 0); prLine(g, a, b, [20, 12, 10], .4, 1); } }
  prShade(g, fL, 0, D[1], 0, D0[1], [[0, [0, 0, 0], 0], [1, PR_AO, .4]]);
  g.save(); g.translate(A[0], A[1]); g.transform(.5, .25, -.5, .25, 0, 0);
  const W = (u1 - u0) * 64, Hh = (v1 - v0) * 64; g.beginPath(); g.rect(0, 0, W, Hh); g.clip();
  for (let x = 0; x < W; x += 13) paintRect(g, x, 0, 12.5, Hh, jit(mul(wood, 1.25), r, .12), r, { n: 8, sw: 3, ang: 1.57, aj: .05, alt: [200, 150, 90], ink: false, edge: false });
  g.save(); g.rotate(1.5708); g.fillStyle = g.createPattern(prTex('grain'), 'repeat'); g.globalAlpha = .9; g.fillRect(0, -W, Hh, W); g.restore();
  g.strokeStyle = css([20, 12, 10], .5); g.lineWidth = 1; for (let x = 0; x < W; x += 13) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, Hh); g.stroke(); for (let y = r() * 60; y < Hh; y += 50 + r() * 60) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + 13, y); g.stroke(); g.fillStyle = css([30, 20, 14], .6); g.fillRect(x + 2, y + 2, 1.4, 1.4); g.fillRect(x + 9, y + 2, 1.4, 1.4); } }
  const gg = g.createRadialGradient(W / 2, Hh / 2, 10, W / 2, Hh / 2, Math.max(W, Hh) * .6); gg.addColorStop(0, 'rgba(255,220,160,.18)'); gg.addColorStop(1, 'rgba(0,0,0,.0)'); g.fillStyle = gg; g.fillRect(0, 0, W, Hh);
  // spike tape marks, a chalk X, scuffs
  g.fillStyle = css([226, 214, 170], .5); g.fillRect(W * .3, Hh * .2, 10, 2.5); g.fillRect(W * .55, Hh * .6, 10, 2.5); g.fillStyle = css([200, 60, 50], .5); g.fillRect(W * .45, Hh * .42, 2.5, 10);
  g.strokeStyle = css([240, 240, 230], .45); g.lineWidth = 2.4; g.beginPath(); g.moveTo(W * .62 - 8, Hh * .3 - 8); g.lineTo(W * .62 + 8, Hh * .3 + 8); g.moveTo(W * .62 + 8, Hh * .3 - 8); g.lineTo(W * .62 - 8, Hh * .3 + 8); g.stroke();
  g.fillStyle = g.createPattern(prTex('scratch'), 'repeat'); g.globalAlpha = .8; g.fillRect(0, 0, W, Hh); g.globalAlpha = 1;
  g.restore();
  rimStroke(g, [D, Cc, B], [255, 190, 110], .55, 1.8);
  // footlight row along the front lip: tin hoods with warm bulbs
  const lipA = gp(S, u0, v1, H), lipB = gp(S, u1, v1, H), nfl = Math.max(4, Math.round((u1 - u0) * 1.6));
  for (let i = 0; i < nfl; i++) { const t = (i + .5) / nfl, x = lerp(lipA[0], lipB[0], t), y = lerp(lipA[1], lipB[1], t); g.fillStyle = css([40, 38, 36]); g.beginPath(); g.moveTo(x - 4, y + 1); g.lineTo(x + 4, y - 1); g.lineTo(x + 4, y + 3); g.lineTo(x - 4, y + 5); g.fill(); const lit = r() < .7; g.fillStyle = css(lit ? [255, 214, 140] : [90, 80, 70], .9); g.beginPath(); g.arc(x, y + 1, 1.5, 0, 7); g.fill(); }
  if (v === 1) {   // choir risers
    for (let k = 0; k < 2; k++) { const z = H + 4 + k * 5; fcs(g, S, r, u0 + .1 + k * .4, v0 + .15, u1 - .3, v0 + .55 + k * .0, H, z, [96, 70, 50], { mat: 'wood', wear: .4 }); }
  }
  fcs(g, S, r, u0 + (u1 - u0) * .3, v1, u0 + (u1 - u0) * .55, v1 + .38, 0, H * .5, mul(wood, 1.1), { mat: 'wood', wear: .5 });
};
const STAGE_H = 16;
FLAT.stairs = function (g, S, p, I) {
  // sunken stairwell: treads descend toward +u, clipped to the opening so they read as a pit
  const { r, v, u0, v0, u1, v1 } = I, W = u1 - u0, steps = 6, SH_ = 10;
  const open = [gp(S, u0, v0, 0), gp(S, u1, v0, 0), gp(S, u1, v1, 0), gp(S, u0, v1, 0)];
  g.save(); pathPoly(g, open); g.clip();
  const bb = bbox(open); g.fillStyle = css([6, 4, 10]); g.fillRect(bb[0] - 2, bb[1] - 2, bb[2] - bb[0] + 4, bb[3] - bb[1] + 80);
  const wb = [gp(S, u0, v0, 0), gp(S, u1, v0, 0), gp(S, u1, v0, -80), gp(S, u0, v0, -80)];
  paintPoly(g, wb, [62, 58, 58], r, { n: 30, ang: 0, ink: false, edge: false, jv: .1 }); prTexFill(g, wb, 'streak', 1); prTexFill(g, wb, 'speck', .7);
  paintPoly(g, [gp(S, u0, v0, 0), gp(S, u0, v1, 0), gp(S, u0, v1, -80), gp(S, u0, v0, -80)], [40, 38, 40], r, { n: 16, ang: 1.57, ink: false, edge: false });
  for (let i = 0; i < steps; i++) {
    const a = u0 + i * W / steps, b = a + W / steps, z = -(i + 1) * SH_ + 4, dk = Math.max(.32, 1 - i * .12);
    const T = [gp(S, a, v0, z), gp(S, b, v0, z), gp(S, b, v1, z), gp(S, a, v1, z)];
    paintPoly(g, T, mul([168, 160, 146], dk), r, { n: 12, ang: 2.68, ink: true, inkw: 1.3, alt: [210, 196, 160], ew: 1, edge: false }); prTexFill(g, T, 'speck', .8);
    // worn hollow in the middle of each tread, chipped nosing
    const m = gp(S, (a + b) / 2, (v0 + v1) / 2, z); g.fillStyle = css([20, 16, 14], .2); g.beginPath(); g.ellipse(m[0], m[1], 14, 5, 0, 0, 7); g.fill();
    prChips(g, r, gp(S, b, v0, z), gp(S, b, v1, z), 3, [80, 76, 70], 2);
    paintPoly(g, [gp(S, b, v0, z), gp(S, b, v1, z), gp(S, b, v1, z - SH_), gp(S, b, v0, z - SH_)], mul([104, 98, 92], dk), r, { n: 6, ang: 2.68, ink: true, inkw: 1.1, edge: false });
  }
  const gl = g.createLinearGradient(...gp(S, u0, (v0 + v1) / 2, 0), ...gp(S, u1, (v0 + v1) / 2, -50)); gl.addColorStop(0, 'rgba(255,130,50,0)'); gl.addColorStop(1, 'rgba(255,130,50,.35)'); g.fillStyle = gl; pathPoly(g, open); g.fill();
  g.restore();
  paintPoly(g, [gp(S, u0 - .04, v1, 0), gp(S, u1, v1, 0), gp(S, u1, v1 + .1, 0), gp(S, u0 - .04, v1 + .1, 0)], [150, 146, 136], r, { n: 8, ang: .46, ink: true, inkw: 1.3, edge: false });
  paintPoly(g, [gp(S, u0 - .1, v0 - .04, 0), gp(S, u0, v0 - .04, 0), gp(S, u0, v1, 0), gp(S, u0 - .1, v1, 0)], [150, 146, 136], r, { n: 8, ang: 2.68, ink: true, inkw: 1.3, edge: false });
  const n = 4;
  for (let i = 0; i <= n; i++) { const t = i / n; vbar(g, S, r, lerp(u0 + .1, u1 - .1, t), v1 + .05, 0, 36, 3, [40, 44, 46]); }
  const ra = gp(S, u0 + .1, v1 + .05, 36), rb = gp(S, u1 - .1, v1 + .05, 36);
  g.strokeStyle = css(INK, .9); g.lineWidth = 4.6; g.beginPath(); g.moveTo(ra[0], ra[1]); g.lineTo(rb[0], rb[1]); g.stroke(); g.strokeStyle = css([96, 100, 100]); g.lineWidth = 3; g.stroke(); g.strokeStyle = css([255, 190, 120], .6); g.lineWidth = 1; g.beginPath(); g.moveTo(ra[0] + 1, ra[1] - 1); g.lineTo(rb[0] + 1, rb[1] - 1); g.stroke();
  const rc = gp(S, u0 + .1, v1 + .05, 18), rd = gp(S, u1 - .1, v1 + .05, 18); g.strokeStyle = css([60, 64, 66], .9); g.lineWidth = 2; g.beginPath(); g.moveTo(rc[0], rc[1]); g.lineTo(rd[0], rd[1]); g.stroke();
  const wg = gp(S, u1 - .3, (v0 + v1) / 2, -30); prLight(S, wg[0], wg[1], 120, [255, 120, 50], .3, .12, 'fire', 'stairs', -30, u1 - .3, (v0 + v1) / 2);
};
FLAT.door = function (g, S, p, I) {   // cellar door/hatch standing at the foot of the stairs
  const { r, v, u0, v0, u1, v1 } = I, c = gp(S, (u0 + u1) / 2, (v0 + v1) / 2, 0);
  const P = [[c[0] - 18, c[1]], [c[0] - 18, c[1] - 44], [c[0] + 18, c[1] - 62], [c[0] + 18, c[1] - 18]];
  paintPoly(g, P, [84, 70, 60], r, { n: 16, ink: true, ang: -.4, edge: false }); prTexFill(g, P, 'grain', .9, (k) => { k.translate(c[0], c[1]); k.transform(1, -.5, 0, 1, 0, 0); k.rotate(1.5708); });
  const P2 = [[c[0] - 13, c[1] - 4], [c[0] - 13, c[1] - 38], [c[0] + 13, c[1] - 52], [c[0] + 13, c[1] - 18]];
  paintPoly(g, P2, [60, 50, 44], r, { n: 8, ink: true, ang: -.4, edge: false });
  g.fillStyle = css([255, 150, 60], .35); pathPoly(g, P2); g.fill();
  for (const dz of [10, 34]) prLine(g, [c[0] - 18, c[1] - dz], [c[0] + 18, c[1] - dz - 18], [40, 40, 42], .9, 3);
  g.fillStyle = css([200, 170, 90]); g.fillRect(c[0] + 8, c[1] - 32, 3, 6);
};

/* ======================================================================
 * ART2: expansion props (dorm / library / street / relay / tower)
 * ==================================================================== */
Object.assign(PH, { bunk: 120, wardrobe: 150, hotplate: 90, catalog: 160, globe: 110, stall: 150, tram_stop: 230, kiosk: 180, streetlamp: 250, barrier: 90, car: 100, console: 120, generator: 160, bigbell: 230, ropes: 160, spiral: 170,
  poster_wall: 100, vault_door: 100, antenna: 100, railing: 100 });
Object.assign(PEX, { streetlamp: 40, tram_stop: 40, stall: 20, bigbell: 40, catalog: 20, car: 18 });
Object.assign(SUPPORT_Z, { hotplate: 36, stall: 38, catalog: 62, console: 34 });
Object.assign(WALLH_TABLE, { poster_wall: 128, vault_door: 104, antenna: 148, railing: 140 });

function frontFace(I) {   // visible long face of a box: fn(t 0..1, z) -> screen point
  const alongV = (I.v1 - I.v0) > (I.u1 - I.u0) + .001;
  return alongV ? (S, t, z) => gp(S, I.u1, lerp(I.v0, I.v1, t), z) : (S, t, z) => gp(S, lerp(I.u0, I.u1, t), I.v1, z);
}
function facePanel(g, S, r, F, t0, t1, z0, z1, col, o) { return paintPoly(g, [F(S, t0, z1), F(S, t1, z1), F(S, t1, z0), F(S, t0, z0)], col, r, Object.assign({ n: 10, ink: true, inkw: 1.1, ew: .9, ang: 1.57 }, o || {})); }
function neonSign(g, S, cx, cy, text, col, size, o) {
  o = o || {}; col = C(col);
  const font = 'bold ' + size + 'px "Arial Black", Impact, "Helvetica Neue", sans-serif';
  const w = Math.ceil(text.length * size * .72 + 36), h = Math.ceil(size * 1.9 + 28), sk = o.skew || 0;
  g.save(); g.translate(cx, cy); if (sk) g.transform(1, sk, 0, 1, 0, 0);
  if (o.board !== false) { g.fillStyle = css([14, 12, 20], .92); g.fillRect(-w / 2 + 12, -size * .75, w - 24, size * 1.5); g.strokeStyle = css(INK, .9); g.lineWidth = 1.4; g.strokeRect(-w / 2 + 12, -size * .75, w - 24, size * 1.5); }
  g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.strokeStyle = css(mul(col, .38)); g.lineWidth = 2.6; g.strokeText(text, 0, 0); g.restore();
  const c = mk(w, h), k = ctx2(c); k.translate(w / 2, h / 2); if (sk) k.transform(1, sk, 0, 1, 0, 0);
  k.font = font; k.textAlign = 'center'; k.textBaseline = 'middle'; k.lineJoin = 'round';
  k.shadowColor = css(col, 1); k.shadowBlur = 16; k.strokeStyle = css(col); k.lineWidth = 3.2; k.strokeText(text, 0, 0); k.strokeText(text, 0, 0);
  k.shadowBlur = 0; k.strokeStyle = css(mix(col, [255, 255, 255], .75)); k.lineWidth = 1.2; k.strokeText(text, 0, 0);
  S.neons.push({ c, x: cx - w / 2, y: cy - h / 2, w, h, ph: S.r() * 50 });
  S.lights.push({ x: cx, y: cy, r: Math.max(60, text.length * size * .7), col, a: .34, fl: 0, ph: S.neons[S.neons.length - 1].ph, kind: 'neon' });
}
function glassTube(g, x, yb, h, w, glowCol, a) {   // vertical valve / glass tube with a hot filament
  const gr = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0); gr.addColorStop(0, 'rgba(180,210,220,.5)'); gr.addColorStop(.35, css(glowCol, .75 * a)); gr.addColorStop(1, 'rgba(60,80,90,.55)');
  g.fillStyle = gr; g.beginPath(); g.moveTo(x - w / 2, yb); g.lineTo(x - w / 2, yb - h + w / 2); g.arc(x, yb - h + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w / 2, yb); g.closePath(); g.fill();
  g.strokeStyle = css(INK, .85); g.lineWidth = 1.1; g.stroke();
  g.fillStyle = css(mix(glowCol, [255, 255, 255], .5), .9 * a); g.fillRect(x - .8, yb - h * .75, 1.6, h * .55);
  g.fillStyle = css([40, 36, 36]); g.fillRect(x - w / 2 - .5, yb - 2.5, w + 1, 3.5);
  g.fillStyle = css([255, 255, 255], .45); g.fillRect(x - w / 2 + 1.2, yb - h + w / 2, 1.2, h * .5);
}

/* ---- dorm ---- */
PROPS.bunk = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, metal = v === 1 || v === 3, frame = metal ? [70, 78, 80] : [[96, 70, 52], [84, 74, 66], [110, 84, 56], [76, 80, 84]][v];
  const bl = [[[66, 84, 100], [196, 190, 170]], [[112, 116, 112], [210, 206, 190]], [[150, 118, 66], [220, 210, 180]], [[130, 52, 48], [226, 214, 190]]][v];
  contactShadow(g, S, u0, v0, u1, v1, 1);
  const post = (u, vv, z0, z1) => metal ? vbar(g, S, r, u, vv, z0, z1, 4, frame) : fcs(g, S, r, u - .05, vv - .05, u + .05, vv + .05, z0, z1, mul(frame, .85), { ink: true, inkw: 1, grime: .2, mat: 'wood', vert: true, wear: .3 });
  post(u0 + .08, v0 + .1, 0, 108); post(u1 - .08, v0 + .1, 0, 108);
  // boots and a cardboard suitcase under the lower bunk
  { const q = gp(S, u0 + .6, v1 - .2, 0); for (const dx of [0, 7]) { paintPoly(g, [[q[0] + dx - 3, q[1]], [q[0] + dx + 5, q[1] - 2], [q[0] + dx + 6, q[1] - 6], [q[0] + dx + 2, q[1] - 12], [q[0] + dx - 2, q[1] - 12], [q[0] + dx - 3, q[1] - 5]], [36, 28, 24], r, { n: 3, ink: true, inkw: .8, edge: false }); } }
  if (r() < .7) fcs(g, S, r, u1 - .9, v0 + .3, u1 - .3, v1 - .15, 0, 8, [120, 96, 66], { ink: true, inkw: 1, rim: true, wear: .5, under: [70, 50, 34] });
  const deck = (z, made, upper) => {
    // slats / spring frame, striped ticking mattress
    fcs(g, S, r, u0 + .04, v0 + .06, u1 - .04, v1 - .06, z, z + 4, frame, { mat: metal ? 'metal' : 'wood', ink: true, inkw: 1, wear: .3, grime: .2 });
    fcs(g, S, r, u0 + .08, v0 + .1, u1 - .08, v1 - .1, z + 4, z + 11, [196, 188, 166], { mat: 'fabric', ink: true, inkw: 1, kt: 1.1, grime: .4 });
    g.save(); faceL(g, S, u0 + .08, v1 - .1, z + 11); g.strokeStyle = css([60, 80, 110], .5); g.lineWidth = 1.4; for (let x = 4; x < (u1 - u0 - .16) * 64; x += 6) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 7); g.stroke(); } g.restore();
    // pillow: plump, creased, at the u0 end
    const pu = u0 + .32, pv = (v0 + v1) / 2, pq = gp(S, pu, pv, z + 13);
    const PP = ellPts(pq[0], pq[1], 17, 8, 14, .46, r, .12);
    paintPoly(g, PP, bl[1], r, { n: 8, ink: true, inkw: 1, edge: false, alt: [240, 236, 220] });
    prShade(g, PP, pq[0] - 14, pq[1] - 7, pq[0] + 12, pq[1] + 7, [[0, [255, 240, 210], .3], [1, [40, 40, 70], .35]]);
    g.strokeStyle = css([120, 110, 100], .5); g.lineWidth = .9; g.beginPath(); g.moveTo(pq[0] - 6, pq[1] - 2); g.quadraticCurveTo(pq[0], pq[1] + 1, pq[0] + 6, pq[1] - 1); g.stroke();
    // wool blanket: covers the rest, folds down over the front edge, turned-down sheet, stripe band
    const bu0 = u0 + .55, top = z + 12.5;
    const T = [gp(S, bu0, v0 + .08, top), gp(S, u1 - .06, v0 + .08, top), gp(S, u1 - .06, v1 - .06, top), gp(S, bu0, v1 - .06, top)];
    paintPoly(g, T, bl[0], r, { n: 18, ang: .46, ink: false, edge: false, alt: mul(bl[0], 1.3) }); prTexFill(g, T, 'weave', 1, (k) => faceT(k, S, bu0, v0, top));
    prShade(g, T, T[0][0], T[0][1], T[2][0], T[2][1], [[0, [20, 24, 44], .2], [1, [255, 220, 170], .15]]);
    const F = [gp(S, bu0, v1 - .06, top), gp(S, u1 - .06, v1 - .06, top), gp(S, u1 - .06, v1 - .04, z + 2), gp(S, bu0 + .05, v1 - .04, z + 1)];
    paintPoly(g, F, mul(bl[0], .7), r, { n: 10, ang: 1.57, ink: false, edge: false }); prTexFill(g, F, 'weave', 1);
    prShade(g, F, 0, F[0][1], 0, F[3][1], [[0, [255, 220, 170], .12], [1, PR_AO, .4]]);
    for (let k = 0; k < 4; k++) { const t = (k + .5) / 4, a = gp(S, lerp(bu0, u1 - .06, t), v1 - .06, top), b = gp(S, lerp(bu0, u1 - .06, t) + .03, v1 - .04, z + 2); prLine(g, a, b, mul(bl[0], .45), .5, 1.6); }
    const SR = gp(S, u1 - .06, v1 - .05, top), SR2 = gp(S, u1 - .06, v0 + .08, top);
    prLine(g, gp(S, bu0 + .05, v0 + .08, top + .2), gp(S, bu0 + .05, v1 - .06, top + .2), bl[1], .95, 3.2);   // turned-down sheet
    g.save(); faceT(g, S, bu0, v0 + .08, top + .1); g.fillStyle = css([226, 214, 186], .6); g.fillRect(14, 0, 6, (v1 - v0 - .14) * 64); g.restore();   // stripe band
    ink(g, [T[0], T[1], SR, F[2], F[3], T[3]], r, 1.2, null, .7);
    if (!made) { for (let k = 0; k < 3; k++) { const q = gp(S, lerp(bu0 + .2, u1 - .3, r()), lerp(v0 + .2, v1 - .3, r()), top); const P = ellPts(q[0], q[1] - 2, r.r(8, 14), r.r(3, 5), 9, .4, r, .3); paintPoly(g, P, mul(bl[0], 1.1), r, { n: 4, ink: false, edge: false }); prShade(g, P, q[0] - 10, q[1] - 6, q[0] + 10, q[1] + 2, [[0, [255, 220, 170], .3], [1, [10, 10, 30], .35]]); } }
    // personal items: a book, a letter, a photo
    if (r() < .6) prBookFlat(g, S, r, u1 - .45, v0 + .3, top, .24, .17, 2.4);
    if (r() < .5) prSheet(g, S, r, u0 + .8, v1 - .3, top + .2, .2, .14, r(), { ink: [40, 50, 110] });
  };
  deck(18, v === 1);
  for (const [uu, vv] of [[u0 + .08, v1 - .1], [u1 - .08, v1 - .1]]) post(uu, vv, 0, 108);
  deck(66, v !== 2, true);
  // guard rail, ladder, a towel over the rail, a taped photo on the post
  const ra = gp(S, u0 + .1, v1 - .08, 92), rb = gp(S, u1 - .1, v1 - .08, 92); prLine(g, ra, rb, INK, .85, 4.6); prLine(g, ra, rb, metal ? frame : mul(frame, .9), 1, 3); prLine(g, [ra[0], ra[1] - 1], [rb[0], rb[1] - 1], [255, 210, 160], .35, .8);
  for (let k = 0; k < 4; k++) { const q0 = gp(S, u1 - .02, v1 - .22, 18 + k * 13), q1 = gp(S, u1 - .02, v0 + .22, 18 + k * 13); prLine(g, q0, q1, INK, .8, 4); prLine(g, q0, q1, mul(frame, 1.15), 1, 2.4); }
  { const t = r.r(.3, .6), a = gp(S, lerp(u0, u1, t), v1 - .08, 92); const tc = r.p([[200, 70, 60], [226, 220, 200], [80, 110, 140]]); const P = [[a[0] - 7, a[1] - 3], [a[0] + 7, a[1] + 1], [a[0] + 8, a[1] + 18], [a[0] - 6, a[1] + 14]]; paintPoly(g, P, tc, r, { n: 4, ink: true, inkw: .8, edge: false }); prTexFill(g, P, 'weave', 1); g.fillStyle = css([255, 255, 255], .3); g.fillRect(a[0] - 6, a[1] + 8, 13, 1.4); }
  if (v === 0) { const q = gp(S, u0 + .08, v1 - .1, 86); g.save(); g.translate(q[0] + 3, q[1]); g.rotate(.08); g.fillStyle = css([236, 230, 214]); g.fillRect(-5, -6, 10, 12); g.fillStyle = css([90, 84, 76]); g.fillRect(-4, -5, 8, 8); g.fillStyle = css([160, 150, 130]); g.beginPath(); g.arc(0, -2, 1.8, 0, 7); g.fill(); g.fillStyle = css([230, 220, 170], .7); g.fillRect(-3, -7.5, 6, 2.4); g.restore(); }
};
PROPS.wardrobe = function (g, S, p, I) {
  const { r, v } = I, F = frontFace(I), wood = [[104, 66, 44], [118, 148, 126], [112, 120, 122], [130, 90, 58]][v], H = 132;
  const alongV = (I.v1 - I.v0) > (I.u1 - I.u0) + .001, d = .82;
  const u0 = I.u0 + .02, v0 = I.v0 + .04, u1 = alongV ? I.u0 + d : I.u1 - .04, v1 = alongV ? I.v1 - .04 : I.v0 + d;
  contactShadow(g, S, u0, v0, u1, v1, 1.1);
  const J = { u0, v0, u1, v1 }, FF = frontFace(J);
  fcs(g, S, r, u0, v0, u1, v1, 6, H, wood, { mat: 'wood', wear: .45, vert: true, alt: v === 1 ? [190, 230, 200] : [190, 130, 80], dens: 26, nk: 1.1 });
  fcs(g, S, r, u0 - .03, v0 - .03, u1 + .03, v1 + .03, H, H + 8, mul(wood, 1.1), { mat: 'wood', wear: .45, alt: [220, 170, 110] });
  fcs(g, S, r, u0 + .04, v0 + .04, u1 - .04, v1 - .04, 0, 7, [34, 28, 26], { mat: 'wood', wear: .45, ink: true });
  const nd = alongV ? Math.max(2, Math.round((v1 - v0) / .95)) : Math.max(2, Math.round((u1 - u0) / .95));
  for (let i = 0; i < nd; i++) {
    const t0 = (i + .06) / nd, t1 = (i + .94) / nd, open = (v === 3 && i === 0);
    if (open) {   // open door: dark interior with coats
      facePanel(g, S, r, FF, t0, t1, 12, H - 8, [10, 8, 10], { n: 4, ink: true });
      for (let k = 0; k < 4; k++) { const tt = lerp(t0, t1, .15 + k * .22), a = FF(S, tt, H - 14), b = FF(S, tt, 34 + (k % 2) * 12); paintPoly(g, [[a[0] - 5, a[1]], [a[0] + 5, a[1]], [b[0] + 7, b[1]], [b[0] - 7, b[1]]], [[96, 84, 76], [60, 70, 76], [120, 60, 52], [70, 66, 60]][k], r, { n: 6, ink: true, ang: 1.57, ew: .8 }); }
      continue;
    }
    facePanel(g, S, r, FF, t0, t1, 12, H - 8, mul(wood, .86), { n: 16, alt: mul(wood, 1.3), lit: [[255, 214, 170], [20, 20, 40], 0, .3, .4] });
    facePanel(g, S, r, FF, lerp(t0, t1, .14), lerp(t0, t1, .86), 24, H - 24, mul(wood, .72), { n: 8, ink: true, inkw: .9, ha: .4 });
    if (v === 2) for (let k = 0; k < 5; k++) { const a = FF(S, lerp(t0, t1, .25), H - 30 - k * 5), b = FF(S, lerp(t0, t1, .75), H - 30 - k * 5); g.strokeStyle = css([10, 12, 14], .7); g.lineWidth = 1.2; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    const h = FF(S, i % 2 ? t0 + .08 / nd : t1 - .08 / nd, 62); g.fillStyle = css([214, 184, 100]); g.fillRect(h[0] - 1.5, h[1] - 6, 3, 12); g.strokeStyle = css(INK, .8); g.lineWidth = .9; g.strokeRect(h[0] - 1.5, h[1] - 6, 3, 12);
    if (v === 1 && i === 0) { const q = FF(S, lerp(t0, t1, .5), 100); g.fillStyle = css([236, 230, 200], .85); g.fillRect(q[0] - 7, q[1] - 5, 14, 9); scribbleLines(g, r, q[0] - 5, q[1] - 2, 10, 2, 3, [30, 30, 36], .8); }
  }
  g.strokeStyle = css([255, 190, 120], .35); g.lineWidth = 1.4; const e0 = gp(S, u1, v1, H), e1 = gp(S, u1, v0, H); g.beginPath(); g.moveTo(e0[0], e0[1]); g.lineTo(e1[0], e1[1]); g.stroke();
};
PROPS.hotplate = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  contactShadow(g, S, cu - .42, cv - .42, cu + .42, cv + .42, .9);
  fcs(g, S, r, cu - .36, cv - .36, cu + .36, cv + .36, 0, 30, [112, 76, 50], { mat: 'wood', wear: .4, vert: true, alt: [190, 140, 90], dens: 26 });
  fcs(g, S, r, cu - .38, cv - .38, cu + .38, cv + .38, 30, 34, [136, 98, 62], { mat: 'wood', wear: .4, alt: [220, 170, 110] });
  fcs(g, S, r, cu - .3, cv - .24, cu + .1, cv + .24, 34, 40, [70, 72, 74], { mat: 'wood', wear: .4, ink: true });   // hotplate body
  const q = gp(S, cu - .1, cv, 40);
  for (let k = 0; k < 3; k++) { g.strokeStyle = css([255, 120 - k * 20, 40], .95); g.lineWidth = 2.2; g.beginPath(); g.ellipse(q[0], q[1], 14 - k * 4.4, 6.6 - k * 2.1, 0, 0, 7); g.stroke(); }
  g.fillStyle = css([255, 200, 120], .5); g.beginPath(); g.ellipse(q[0], q[1], 6, 2.6, 0, 0, 7); g.fill();
  S.lights.push({ x: q[0], y: q[1] - 4, r: 100, col: [255, 120, 40], a: .34, fl: .12, ph: r() * 6, kind: 'fire' });
  if (v !== 2) { const kk = gp(S, cu - .1, cv, 40); cylBody(g, S, r, cu - .1, cv, .2, 40, v === 1 ? 62 : 54, v === 1 ? [140, 150, 150] : [70, 98, 110], { ink: true, sw: 2, alt: [220, 230, 230] });
    if (v === 0) { g.strokeStyle = css([30, 30, 34]); g.lineWidth = 2; g.beginPath(); g.moveTo(kk[0] + 8, kk[1] - 22); g.quadraticCurveTo(kk[0] + 20, kk[1] - 30, kk[0] + 14, kk[1] - 10); g.stroke(); S.steam.push({ x: kk[0] - 6, y: kk[1] - 56 }); }
    else { S.steam.push({ x: kk[0], y: kk[1] - 64 }); } }
  else { const tt = gp(S, cu + .18, cv + .08, 34); cylBody(g, S, r, cu + .2, cv + .1, .13, 34, 41, [210, 204, 186], { ink: true, sw: 2 }); paintPoly(g, [[tt[0] - 5, tt[1] - 9], [tt[0] + 5, tt[1] - 9], [tt[0], tt[1] - 4]], [180, 60, 50], r, { n: 3, ink: true }); }
  // cable
  const c0 = gp(S, cu + .3, cv + .3, 34), c1 = gp(S, cu + .52, cv + .5, 0); g.strokeStyle = css([20, 18, 20], .95); g.lineWidth = 2; g.beginPath(); g.moveTo(c0[0], c0[1]); g.quadraticCurveTo(c0[0] + 6, c0[1] + 22, c1[0], c1[1]); g.stroke();
};

/* ---- library ---- */
PROPS.catalog = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, F = frontFace(I), wood = [[116, 76, 46], [88, 62, 44], [132, 98, 62], [74, 70, 64]][v], w = Math.max(u1 - u0, v1 - v0), H = 66;
  contactShadow(g, S, u0, v0, u1, v1, 1);
  fcs(g, S, r, u0 + .04, v0 + .06, u1 - .04, v1 - .06, 0, H, wood, { mat: 'wood', wear: .35, vert: true, alt: [200, 150, 90], dens: 28 });
  fcs(g, S, r, u0, v0, u1, v1, H, H + 5, mul(wood, 1.12), { mat: 'wood', wear: .35, alt: [230, 180, 120] });
  const rows = 4, cols = Math.max(3, Math.round(w * 3.6));
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const t0 = (i + .07) / cols, t1 = (i + .93) / cols, z1 = H - 4 - j * (H - 10) / rows, z0 = z1 - (H - 10) / rows + 3;
    facePanel(g, S, r, F, t0, t1, z0, z1, mul(wood, .78 + (j + i) % 2 * .08), { n: 4, ink: true, inkw: .9, ha: .5, ew: .7 });
    const m = F(S, (t0 + t1) / 2, (z0 + z1) / 2 + 1.5);
    g.fillStyle = css([226, 214, 170], .9); g.fillRect(m[0] - 4, m[1] - 3.6, 8, 4.4); g.strokeStyle = css(INK, .6); g.lineWidth = .7; g.strokeRect(m[0] - 4, m[1] - 3.6, 8, 4.4); g.fillStyle = css([40, 30, 24], .7); g.fillRect(m[0] - 2.6, m[1] - 2.4, 5, .9);
    g.fillStyle = css([214, 176, 84]); g.fillRect(m[0] - 1.8, m[1] + 1.2, 3.6, 1.6);
    if (i === 2 && j === 1 && v !== 3) { const o = F(S, (t0 + t1) / 2, (z0 + z1) / 2); const d = gp(S, o[0], o[1], 0); paintPoly(g, [[o[0] - 5, o[1] - 2], [o[0] + 5, o[1] - 1], [o[0] + 6, o[1] + 4], [o[0] - 4, o[1] + 3]], [226, 214, 176], r, { n: 3, ink: true, ew: .6 }); }   // half-open drawer
  }
  // the organ crown: gilt pipes, tallest in the middle
  const np = Math.max(5, Math.round(w * 4)), bs = F(S, .06, H + 5), be = F(S, .94, H + 5);
  for (let i = 0; i < np; i++) {
    const t = i / (np - 1), x = lerp(bs[0], be[0], t), y = lerp(bs[1], be[1], t), hh = 16 + Math.sin(t * Math.PI) * 26 + (i % 2) * 6, pw = 5.2;
    const c = jit([200, 160, 70], r, .1);
    paintPoly(g, [[x - pw / 2, y], [x + pw / 2, y], [x + pw / 2, y - hh], [x - pw / 2, y - hh]], c, r, { n: 4, ang: 1.57, ink: true, inkw: 1.1, lit: [[255, 236, 160], [90, 60, 20], 0, .5, .5], ew: .8 });
    g.fillStyle = css([30, 20, 10], .85); g.beginPath(); g.ellipse(x, y - hh + 1, pw / 2, 1.5, 0, 0, 7); g.fill();
    g.fillStyle = css([20, 12, 8], .7); g.beginPath(); g.ellipse(x, y - hh * .35, pw * .3, 1.8, 0, 0, 7); g.fill();
  }
  const mid = F(S, .5, H + 5); g.fillStyle = css([226, 196, 100]); g.beginPath(); g.moveTo(mid[0] - 10, mid[1] - 4); g.lineTo(mid[0], mid[1] - 18); g.lineTo(mid[0] + 10, mid[1] - 4); g.closePath(); g.fill(); g.strokeStyle = css(INK, .8); g.lineWidth = 1; g.stroke();
  handText(g, 'A – Z', mid[0], mid[1] - 8, 6, [40, 26, 14], r, 14, { shadow: [0, 0, 0, 0] });
  const lt = gp(S, (u0 + u1) / 2, (v0 + v1) / 2, H + 40); S.lights.push({ x: lt[0], y: lt[1], r: 70, col: [255, 214, 140], a: .12, fl: .02, ph: r() * 6, kind: 'pool' });
};
PROPS.globe = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  contactShadow(g, S, cu - .3, cv - .3, cu + .3, cv + .3, .9);
  const b = gp(S, cu, cv, 0);
  for (const [dx, dy] of [[-15, 4], [15, 4], [0, 9]]) { g.strokeStyle = css([86, 56, 36]); g.lineWidth = 3.6; g.beginPath(); g.moveTo(b[0] + dx, b[1] + dy); g.lineTo(b[0] + dx * .15, b[1] - 40); g.stroke(); g.strokeStyle = css(INK, .6); g.lineWidth = .8; g.stroke(); }
  cylBody(g, S, r, cu, cv, .1, 36, 41, [150, 108, 60], { ink: true, sw: 2 });
  const cx = b[0], cy = b[1] - 70, R = 24;
  g.save(); g.translate(cx, cy); g.rotate(-.4);
  const sea = v === 1 ? [168, 150, 110] : [52, 98, 118];
  paintEll(g, 0, 0, R, R, sea, r, { n: 36, ink: true, inkw: 1.8, lit: [[230, 240, 220], [14, 26, 48], -1, .55, .6], alt: v === 1 ? [210, 190, 140] : [90, 150, 160], edge: false });
  g.save(); g.beginPath(); g.arc(0, 0, R - .6, 0, 7); g.clip();
  const land = v === 1 ? [[150, 120, 80], [110, 90, 60]] : [[176, 150, 90], [96, 130, 80], [156, 120, 76]];
  for (let i = 0; i < 9; i++) { const pts = ellPts(r.r(-R, R) * .9, r.r(-R, R) * .9, r.r(5, 13), r.r(4, 10), 9, r() * 3, r, .6); paintPoly(g, pts, r.p(land), r, { n: 5, sw: 3, ink: false, edge: false, jv: .12 }); }
  g.strokeStyle = css([10, 20, 30], .28); g.lineWidth = .9; for (let k = -2; k <= 2; k++) { g.beginPath(); g.ellipse(0, 0, R, R * Math.abs(k) / 3 + .1, 0, 0, 7); g.stroke(); }
  const sh = g.createRadialGradient(-R * .4, -R * .5, 2, 0, 0, R * 1.2); sh.addColorStop(0, 'rgba(255,240,200,.3)'); sh.addColorStop(.6, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(8,10,30,.55)'); g.fillStyle = sh; g.fillRect(-R, -R, R * 2, R * 2);
  g.restore();
  g.strokeStyle = css([214, 176, 84]); g.lineWidth = 2.6; g.beginPath(); g.ellipse(0, 0, R + 3, R + 3, 0, -1.4, 1.4 + 3.1 - .2); g.stroke(); g.strokeStyle = css(INK, .7); g.lineWidth = .8; g.stroke();
  g.fillStyle = css([226, 196, 100]); g.beginPath(); g.arc(0, -R - 3, 2.4, 0, 7); g.arc(0, R + 3, 2.4, 0, 7); g.fill();
  g.restore();
};

/* ---- street ---- */
PROPS.stall = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, F = frontFace(I), wood = [[110, 76, 48], [88, 84, 72], [96, 64, 44], [70, 80, 90]][v];
  const stripe = [[[188, 56, 48], [226, 210, 170]], [[96, 112, 86], [160, 150, 112]], [[56, 98, 120], [214, 196, 150]], [[170, 120, 50], [60, 58, 60]]][v];
  contactShadow(g, S, u0, v0, u1, v1, 1);
  for (const [uu, vv] of [[u0 + .1, v0 + .1], [u1 - .1, v0 + .1]]) vbar(g, S, r, uu, vv, 0, 124, 4.6, [70, 54, 40], { lit: [[255, 200, 140], [10, 12, 24], 0, .6, .5] });
  // counter + goods
  fcs(g, S, r, u0 + .1, v0 + .45, u1 - .1, v1 - .15, 0, 34, wood, { mat: 'wood', wear: .5, vert: true, alt: [190, 140, 90], dens: 26 });
  fcs(g, S, r, u0 + .05, v0 + .4, u1 - .05, v1 - .1, 34, 38, mul(wood, 1.18), { mat: 'wood', wear: .5, alt: [230, 190, 130] });
  const cloth = [gp(S, u0 + .05, v1 - .1, 38), gp(S, u1 - .05, v1 - .1, 38), gp(S, u1 - .05, v1 - .1, 6), gp(S, u0 + .05, v1 - .1, 6)];
  paintPoly(g, cloth, mix(stripe[0], [20, 20, 30], .3), r, { n: 20, ang: 1.57, ink: true, wob: 2, alt: stripe[1], inkw: 1.2 });
  const goods = (n) => {
    for (let i = 0; i < n; i++) {
      const uu = lerp(u0 + .25, u1 - .3, (i + r() * .6) / n), vv = lerp(v0 + .6, v1 - .35, r()), q = gp(S, uu, vv, 38), k = r();
      if (k < .3) { cylBody(g, S, r, uu, vv, .11, 38, 52, r() < .5 ? [60, 110, 90] : [150, 110, 60], { ink: true, sw: 2 }); }
      else if (k < .55) { paintPoly(g, [[q[0] - 8, q[1]], [q[0], q[1] - 4], [q[0] + 8, q[1]], [q[0], q[1] + 4]], [176, 134, 84], r, { n: 3, ink: true }); paintPoly(g, [[q[0] - 6, q[1] - 5], [q[0], q[1] - 9], [q[0] + 6, q[1] - 5], [q[0], q[1] - 1]], [200, 156, 100], r, { n: 3, ink: true }); }
      else if (k < .8) { cylBody(g, S, r, uu, vv, .09, 38, 44, [196, 196, 186], { ink: true, sw: 1.5 }); cylBody(g, S, r, uu + .16, vv, .09, 38, 44, [196, 196, 186], { ink: true, sw: 1.5 }); cylBody(g, S, r, uu + .08, vv - .12, .09, 44, 50, [196, 196, 186], { ink: true, sw: 1.5 }); }
      else { paintPoly(g, [[q[0] - 7, q[1] - 6], [q[0] + 7, q[1] - 6], [q[0] + 6, q[1] + 3], [q[0] - 6, q[1] + 3]], [226, 214, 176], r, { n: 4, ink: true }); scribbleLines(g, r, q[0] - 5, q[1] - 3, 10, 2, 3, [60, 30, 30], .6); }
    }
  };
  goods(Math.round((u1 - u0) * 2.6));
  for (const [uu, vv] of [[u0 + .1, v1 - .08], [u1 - .1, v1 - .08]]) vbar(g, S, r, uu, vv, 0, 104, 4.6, [84, 62, 44], { lit: [[255, 200, 140], [10, 12, 24], 0, .6, .5] });
  // awning (slopes toward the viewer), striped, scalloped valance
  const ns = Math.max(4, Math.round((u1 - u0) * 3)), zb = 126, zf = 106;
  for (let i = 0; i < ns; i++) {
    const a = lerp(u0 - .05, u1 + .05, i / ns), b = lerp(u0 - .05, u1 + .05, (i + 1) / ns), c = (i & 1) ? stripe[1] : stripe[0];
    paintPoly(g, [gp(S, a, v0 - .02, zb), gp(S, b, v0 - .02, zb), gp(S, b, v1 + .12, zf), gp(S, a, v1 + .12, zf)], v === 1 ? jit(c, r, .1) : c, r, { n: 8, ang: 2.0, ink: true, inkw: 1.2, alt: mul(c, 1.3), ew: 1, ha: .7 });
    const q0 = gp(S, a, v1 + .12, zf), q1 = gp(S, b, v1 + .12, zf);
    paintPoly(g, [q0, q1, [(q0[0] + q1[0]) / 2, q1[1] + 9]], c, r, { n: 3, ink: true, inkw: 1, ew: .8 });
  }
  if (v === 1) { for (let k = 0; k < 3; k++) { const q = gp(S, lerp(u0, u1, r.r(.15, .85)), lerp(v0, v1, r.r(.2, .8)), 118); paintPoly(g, ellPts(q[0], q[1], r.r(6, 11), r.r(4, 6), 6, r() * 3, r, .4), r.p([[74, 86, 66], [140, 124, 80], [100, 70, 52]]), r, { n: 4, ink: true, inkw: .9 }); } }
  // lantern under the awning + hanging bundle
  const L = gp(S, (u0 + u1) / 2, v1 - .1, 104);
  g.strokeStyle = css([30, 26, 26]); g.lineWidth = 1.2; g.beginPath(); g.moveTo(L[0], L[1] - 8); g.lineTo(L[0], L[1] - 1); g.stroke();
  paintPoly(g, [[L[0] - 5, L[1]], [L[0] + 5, L[1]], [L[0] + 4, L[1] + 11], [L[0] - 4, L[1] + 11]], [255, 214, 130], r, { n: 6, ink: true, inkw: 1.2, ew: .6 });
  S.lights.push({ x: L[0], y: L[1] + 6, r: 120, col: [255, 180, 80], a: .5, fl: .14, ph: r() * 6, kind: 'lamp' });
  S.lights.push({ x: gp(S, (u0 + u1) / 2, (v0 + v1) / 2 + .3, 0)[0], y: gp(S, (u0 + u1) / 2, (v0 + v1) / 2 + .3, 0)[1], r: 100, col: [255, 160, 70], a: .12, fl: .08, ph: r() * 6, kind: 'pool' });
  if (v === 1) { const sg = gp(S, u1 - .2, v1 + .12, 118); neonSign(g, S, sg[0] - 4, sg[1] + 20, 'OPEN', [90, 255, 150], 9, { skew: -.5, board: false }); }
  if (v === 0 || v === 2) { for (let k = 0; k < 3; k++) { const q = gp(S, lerp(u0 + .4, u1 - .4, k / 2), v0 + .55, 116); g.strokeStyle = css([40, 30, 26]); g.lineWidth = 1; g.beginPath(); g.moveTo(q[0], q[1] + 2); g.lineTo(q[0], q[1] + 10); g.stroke(); paintEll(g, q[0], q[1] + 18, 3.6, 8, r.p([[150, 70, 56], [190, 150, 90], [120, 90, 60]]), r, { n: 6, ink: true, inkw: 1 }); } }
};
PROPS.tram_stop = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, col = [[170, 52, 46], [60, 120, 116], [196, 150, 60], [96, 100, 112]][v];
  contactShadow(g, S, u0, v0, u1, v1, .8);
  fcs(g, S, r, u0 + .05, v0 + .05, u1 - .05, v1 - .05, 0, 6, [140, 136, 128], { mat: 'metal', wear: .4, alt: [190, 186, 170], dens: 24 });   // platform
  const pole = (uu, vv, h) => vbar(g, S, r, uu, vv, 6, h, 4.4, [56, 62, 66], { lit: [[255, 190, 130], [10, 12, 24], 0, .6, .5] });
  pole(u0 + .15, v0 + .15, 122); pole(u1 - .15, v0 + .15, 122);
  // glass back panel with frame and ad
  const ga = gp(S, u0 + .15, v0 + .15, 112), gb = gp(S, u1 - .15, v0 + .15, 112), gc = gp(S, u1 - .15, v0 + .15, 24), gd = gp(S, u0 + .15, v0 + .15, 24);
  g.save(); g.globalAlpha = .55; paintPoly(g, [ga, gb, gc, gd], [150, 190, 200], r, { n: 24, ang: 2.68, ink: false, jv: .2, edge: false }); g.restore();
  g.strokeStyle = css([170, 230, 255], .5); g.lineWidth = 1.2; for (let k = 1; k < 4; k++) { const t = k / 4; g.beginPath(); g.moveTo(lerp(gd[0], gc[0], t) + 4, lerp(gd[1], gc[1], t) + 8); g.lineTo(lerp(gd[0], gc[0], t) + 14, lerp(gd[1], gc[1], t) - 10); g.stroke(); }
  rimStroke(g, [ga, gb, gc, gd, ga], [20, 26, 30], .85, 1.6);
  const ad = [gp(S, u0 + .4, v0 + .17, 100), gp(S, u0 + 1.0, v0 + .17, 100), gp(S, u0 + 1.0, v0 + .17, 52), gp(S, u0 + .4, v0 + .17, 52)];
  paintPoly(g, ad, [176, 40, 40], r, { n: 10, ink: true, ang: 2.68 });
  handText(g, 'LISTEN', (ad[0][0] + ad[1][0]) / 2, (ad[0][1] + ad[3][1]) / 2 - 4, 8, [240, 226, 180], r, 30, { shadow: [0, 0, 0, 0] });
  // bench
  const bu0 = u0 + .35, bu1 = u1 - .45;
  for (const uu of [bu0 + .1, bu1 - .1]) { vbar(g, S, r, uu, v0 + .5, 6, 24, 3, [40, 44, 48]); vbar(g, S, r, uu, v0 + .85, 6, 24, 3, [40, 44, 48]); }
  fcs(g, S, r, bu0, v0 + .42, bu1, v0 + .95, 24, 28, [136, 98, 60], { mat: 'metal', wear: .4, alt: [200, 150, 90], dens: 24 });
  // roof
  fcs(g, S, r, u0 - .08, v0 - .05, u1 + .08, v1 - .25, 122, 128, [64, 72, 74], { mat: 'metal', wear: .4, alt: col, dens: 24 });
  const rf = gp(S, u1 + .08, v1 - .25, 125); g.fillStyle = css(col, .95); const ra = gp(S, u0 - .08, v1 - .25, 128), rb = gp(S, u1 + .08, v1 - .25, 128); paintPoly(g, [ra, rb, rb.map((x, i) => i ? x + 7 : x), ra.map((x, i) => i ? x + 7 : x)], col, r, { n: 6, ink: true, inkw: 1, ang: 0 });
  // totem pole + round sign
  const sx = u1 - .1, sv = v1 - .1; pole(sx, sv, 196);
  const sp = gp(S, sx, sv, 196);
  paintEll(g, sp[0], sp[1] - 4, 20, 20, col, r, { n: 18, ink: true, inkw: 2, lit: [mix(col, [255, 220, 160], .4), mul(col, .5), -1, .5, .5], alt: mul(col, 1.3) });
  g.fillStyle = css([240, 230, 200]); g.beginPath(); g.arc(sp[0], sp[1] - 4, 14, 0, 7); g.fill(); g.strokeStyle = css(INK, .7); g.lineWidth = 1.2; g.stroke();
  handText(g, '9', sp[0], sp[1] - 3, 22, col, r, 18, { shadow: [0, 0, 0, 0] });
  const tp = gp(S, sx, sv, 150); paintRect(g, tp[0] - 9, tp[1] - 12, 18, 24, [226, 220, 196], r, { n: 6, ink: true, ang: 0 }); scribbleLines(g, r, tp[0] - 7, tp[1] - 8, 13, 5, 4, [40, 40, 46], .8);
  const ns = gp(S, (u0 + u1) / 2, v1 - .3, 150); neonSign(g, S, ns[0], ns[1] - 2, 'TRAM', [255, 110, 120], 13, { skew: .5, board: false }); for (const t of [-.3, .3]) { const q = gp(S, (u0 + u1) / 2 + t, v1 - .3, 128), q2 = gp(S, (u0 + u1) / 2 + t, v1 - .3, 146); g.strokeStyle = css([40, 44, 48]); g.lineWidth = 2; g.beginPath(); g.moveTo(q[0], q[1]); g.lineTo(q2[0], q2[1]); g.stroke(); }
  S.lights.push({ x: gp(S, (u0 + u1) / 2, v0 + .7, 118)[0], y: gp(S, (u0 + u1) / 2, v0 + .7, 118)[1], r: 90, col: [230, 240, 210], a: .22, fl: .04, ph: r() * 6, kind: 'lamp' });
};
PROPS.kiosk = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, F = frontFace(I), body = [[70, 112, 96], [160, 112, 60], [84, 96, 130], [150, 56, 52]][v];
  contactShadow(g, S, u0, v0, u1, v1, 1);
  const bu0 = u0 + .12, bv0 = v0 + .12, bu1 = u1 - .12, bv1 = v1 - .12, J = { u0: bu0, v0: bv0, u1: bu1, v1: bv1 };
  fcs(g, S, r, bu0, bv0, bu1, bv1, 0, 96, body, { mat: 'enamel', wear: .6, under: [60, 50, 40], vert: true, alt: mul(body, 1.4), dens: 24 });
  fcs(g, S, r, bu0 - .05, bv0 - .05, bu1 + .05, bv1 + .05, 0, 14, mul(body, .55), { mat: 'enamel', wear: .6, under: [60, 50, 40], ink: true });
  // serving windows on both visible faces
  const wnd = (Fn, t0, t1) => {
    facePanel(g, S, r, Fn, t0, t1, 40, 84, [250, 200, 110], { n: 6, ink: true, inkw: 1.4, ang: 1.57 });
    const a = Fn(S, t0, 84), b = Fn(S, t1, 84); g.strokeStyle = css(INK, .8); g.lineWidth = 1; g.beginPath(); g.moveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); g.lineTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 44); g.stroke();
    for (let k = 0; k < 5; k++) { const q = Fn(S, lerp(t0, t1, .08 + k * .19), 48 + (k % 2) * 14); paintRect(g, q[0] - 5, q[1] - 14, 10, 20, r.p([[226, 220, 196], [210, 200, 170], [196, 60, 50]]), r, { n: 3, ink: true, ew: .6, ang: 0 }); scribbleLines(g, r, q[0] - 4, q[1] - 10, 8, 3, 4, [40, 36, 36], .6); }
    const sh = [Fn(S, t0 - .04, 40), Fn(S, t1 + .04, 40)]; g.strokeStyle = css([210, 180, 110]); g.lineWidth = 3.2; g.beginPath(); g.moveTo(sh[0][0], sh[0][1]); g.lineTo(sh[1][0], sh[1][1]); g.stroke(); g.strokeStyle = css(INK, .7); g.lineWidth = .8; g.stroke();
  };
  const Fv = (S_, t, z) => gp(S_, bu1, lerp(bv0, bv1, t), z), Fu = (S_, t, z) => gp(S_, lerp(bu0, bu1, t), bv1, z);
  wnd(Fu, .14, .86); wnd(Fv, .2, .8);
  // roof with deep overhang, sign board
  fcs(g, S, r, u0 - .02, v0 - .02, u1 + .02, v1 + .02, 96, 104, mul(body, .7), { mat: 'enamel', wear: .6, under: [60, 50, 40], alt: [230, 200, 140] });
  fcs(g, S, r, u0 + .25, v0 + .25, u1 - .25, v1 - .25, 104, 114, mul(body, .9), {});
  const sg = Fu(S, .5, 124), sg2 = Fu(S, .5, 130);
  paintRect(g, sg[0] - 28, sg[1] - 11, 56, 20, [24, 22, 26], r, { n: 8, ink: true, ang: 0 });
  neonSign(g, S, sg[0] - 1, sg[1] - 1, 'PRESS', v === 1 ? [255, 190, 70] : [255, 70, 140], 12, { skew: .5, board: false });
  // news stand sidewalk board
  const bq = gp(S, u1 - .05, v1 + .05, 0); paintPoly(g, [[bq[0] - 14, bq[1] - 2], [bq[0] + 2, bq[1] - 22], [bq[0] + 14, bq[1] - 12], [bq[0] - 2, bq[1] + 8]], [236, 230, 204], r, { n: 6, ink: true }); handText(g, 'NEWS', bq[0], bq[1] - 8, 6, [40, 30, 30], r, 14, { shadow: [0, 0, 0, 0] });
  S.lights.push({ x: Fu(S, .5, 60)[0], y: Fu(S, .5, 60)[1] + 6, r: 110, col: [255, 190, 100], a: .38, fl: .06, ph: r() * 6, kind: 'lamp' });
};
PROPS.streetlamp = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  contactShadow(g, S, cu - .3, cv - .3, cu + .3, cv + .3, .9);
  cylBody(g, S, r, cu, cv, .2, 0, 22, [44, 52, 54], { ink: true, sw: 2 });
  cylBody(g, S, r, cu, cv, .12, 22, 28, [60, 66, 66], { ink: true, sw: 2 });
  vbar(g, S, r, cu, cv, 26, 176, 6, [44, 50, 54], { lit: [[255, 190, 130], [10, 12, 24], 0, .6, .5] });
  const t = gp(S, cu, cv, 176), faulty = v === 2, double = v === 3;
  // curved arm
  for (const sd of (double ? [-1, 1] : [1])) {
    g.strokeStyle = css([44, 50, 54]); g.lineWidth = 4.4; g.beginPath(); g.moveTo(t[0], t[1] + 4); g.quadraticCurveTo(t[0], t[1] - 22, t[0] + sd * 22, t[1] - 26); g.stroke(); g.strokeStyle = css(INK, .7); g.lineWidth = .9; g.stroke();
    const hx = t[0] + sd * 28, hy = t[1] - 24;
    paintPoly(g, [[hx - 13, hy - 4], [hx + 13, hy - 4], [hx + 9, hy + 4], [hx - 9, hy + 4]], [52, 58, 60], r, { n: 8, ink: true, inkw: 1.4 });
    g.fillStyle = css(faulty ? [255, 200, 120] : [255, 214, 130]); g.beginPath(); g.ellipse(hx, hy + 5, 8, 2.8, 0, 0, 7); g.fill();
    const Lx = hx, Ly = hy + 6;
    S.lights.push({ x: Lx, y: Ly, r: 90, col: [255, 170, 80], a: .62, fl: faulty ? 0 : .04, ph: r() * 6, kind: faulty ? 'neon' : 'lamp' });
    S.lights.push({ x: Lx - 4, y: Ly + 150, r: 150, col: [255, 160, 70], a: .26, fl: faulty ? 0 : .03, ph: r() * 6, kind: faulty ? 'neon' : 'pool' });
    // faint cone of light
    g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createLinearGradient(0, Ly, 0, Ly + 150); gr.addColorStop(0, 'rgba(255,190,110,.2)'); gr.addColorStop(1, 'rgba(255,190,110,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(Lx - 8, Ly); g.lineTo(Lx + 8, Ly); g.lineTo(Lx + 56, Ly + 150); g.lineTo(Lx - 56, Ly + 150); g.fill(); g.restore();
  }
  if (v === 1) { const hy = t[1] + 26; paintPoly(g, [[t[0] + 3, hy - 7], [t[0] + 14, hy - 7], [t[0] + 28, hy - 16], [t[0] + 28, hy + 16], [t[0] + 14, hy + 7], [t[0] + 3, hy + 7]], [104, 102, 92], r, { n: 16, ink: true, ang: 0, lit: [[255, 210, 150], [10, 10, 20], -1.57, .5, .5] }); paintEll(g, t[0] + 28, hy, 5, 16, [28, 26, 26], r, { n: 5, ink: true }); }
  // posters pasted on the post
  const pq = gp(S, cu, cv, 70); paintRect(g, pq[0] - 5, pq[1] - 14, 10, 18, [210, 196, 160], r, { n: 4, ink: true, ew: .6, ang: 0 });
};
PROPS.barrier = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, alongU = (u1 - u0) >= (v1 - v0), cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, len = alongU ? u1 - u0 : v1 - v0;
  const n = Math.max(2, Math.round(len / .8) + 1);
  const pt = (i, z) => alongU ? gp(S, lerp(u0 + .12, u1 - .12, i / (n - 1)), cv, z) : gp(S, cu, lerp(v0 + .12, v1 - .12, i / (n - 1)), z);
  for (let i = 0; i < n; i++) { const b = pt(i, 0); g.fillStyle = css([6, 4, 14], .3); g.beginPath(); g.ellipse(b[0] - 3, b[1] + 2, 9, 4, 0, 0, 7); g.fill(); }
  if (v === 1) {   // striped wooden trestles
    for (let i = 0; i < n; i += 2) { const b = pt(i, 0), t = pt(i, 52); for (const dx of [-8, 8]) { g.strokeStyle = css([86, 60, 40]); g.lineWidth = 3.4; g.beginPath(); g.moveTo(b[0] + dx, b[1]); g.lineTo(t[0] + dx * .3, t[1]); g.stroke(); } }
    for (let i = 0; i < n - 1; i++) { const a = pt(i, 46), b = pt(i + 1, 46), a2 = pt(i, 28), b2 = pt(i + 1, 28), c = i & 1 ? [226, 220, 200] : [180, 44, 40];
      paintPoly(g, [a, b, b2, a2], c, r, { n: 8, ink: true, inkw: 1.2, ang: 0 }); g.strokeStyle = css(i & 1 ? [180, 44, 40] : [226, 220, 200], .9); g.lineWidth = 3; g.beginPath(); for (let k = 0; k < 4; k++) { const t0 = (k + .5) / 4; g.moveTo(lerp(a[0], b[0], t0) - 4, lerp(a[1], b[1], t0) + 5); g.lineTo(lerp(a[0], b[0], t0) + 4, lerp(a[1], b[1], t0) - 4); } g.stroke(); }
    return;
  }
  for (let i = 0; i < n; i++) {
    const b = pt(i, 0), t = pt(i, 40);
    cylBody(g, S, r, alongU ? lerp(u0 + .12, u1 - .12, i / (n - 1)) : cu, alongU ? cv : lerp(v0 + .12, v1 - .12, i / (n - 1)), .13, 0, 3, [70, 66, 60], { ink: true, sw: 2 });
    paintPoly(g, [[b[0] - 1.8, b[1]], [b[0] + 1.8, b[1]], [t[0] + 1.8, t[1]], [t[0] - 1.8, t[1]]], v === 2 ? [150, 150, 150] : [196, 160, 70], r, { n: 4, ink: true, inkw: .9, ang: 1.57 });
    g.fillStyle = css(v === 2 ? [180, 180, 180] : [226, 190, 90]); g.beginPath(); g.arc(t[0], t[1] - 1, 3.6, 0, 7); g.fill(); g.strokeStyle = css(INK, .8); g.lineWidth = 1; g.stroke();
  }
  for (let i = 0; i < n - 1; i++) {
    const a = pt(i, 36), b = pt(i + 1, 36), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + 7;
    g.lineCap = 'round'; g.strokeStyle = css(INK, .9); g.lineWidth = v === 2 ? 3.4 : 5.2; g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(mx, my + 5, b[0], b[1]); g.stroke();
    g.strokeStyle = css(v === 2 ? [150, 156, 160] : [150, 30, 36]); g.lineWidth = v === 2 ? 2.2 : 3.6; g.stroke();
    if (v !== 2) { g.strokeStyle = css([220, 90, 80], .6); g.lineWidth = 1; g.beginPath(); g.moveTo(a[0] + 1, a[1] - 1); g.quadraticCurveTo(mx, my + 4, b[0] + 1, b[1] - 1); g.stroke(); }
  }
};
PROPS.car = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, van = v === 1, body = van ? [86, 92, 78] : [26, 28, 34], H = van ? 58 : 38;
  contactShadow(g, S, u0, v0, u1, v1, 1.2);
  const bu0 = u0 + .08, bu1 = u1 - .08, bv0 = v0 + .12, bv1 = v1 - .12;
  const wheel = (uu, side) => {   // wheel on side face v=bv1
    const q = gp(S, uu, bv1 + .02, 11); g.save(); g.translate(q[0], q[1]); g.transform(.5, .25, 0, 1, 0, 0);
    g.fillStyle = css([8, 8, 10]); g.beginPath(); g.arc(0, 0, 14, 0, 7); g.fill(); g.fillStyle = css([150, 154, 150]); g.beginPath(); g.arc(0, 0, 7.4, 0, 7); g.fill(); g.strokeStyle = css([40, 42, 46]); g.lineWidth = 1.4; g.stroke(); g.fillStyle = css([60, 60, 64]); g.beginPath(); g.arc(0, 0, 2.6, 0, 7); g.fill(); g.restore();
  };
  // chassis + lower body (chamfered with two stacked boxes)
  fcs(g, S, r, bu0, bv0, bu1, bv1, 8, 24, body, { mat: 'metal', vert: false, alt: mul(body, 2.2), dens: 30, kl: .7, kr: 1.25 });
  fcs(g, S, r, bu0 + .06, bv0 + .06, bu1 - .06, bv1 - .06, 24, H, body, { mat: 'metal', vert: false, alt: mul(body, 2.4), dens: 30, kl: .7, kr: 1.3, kt: 1.4 });
  wheel(bu0 + .38, 0); wheel(bu1 - .36, 1);
  // cabin
  const cu0 = bu0 + (van ? .14 : .5), cu1 = bu1 - (van ? .14 : .62);
  const cabH = van ? 82 : 64;
  fcs(g, S, r, cu0, bv0 + .12, cu1, bv1 - .12, H, cabH, van ? body : [34, 36, 44], { mat: 'metal', vert: false, alt: [90, 110, 130], dens: 40, kt: 1.5 });
  // windows (side face v = bv1 - .12, end face u = cu1)
  const win = (a, b, z0, z1, Fn) => { const P = [Fn(a, z1), Fn(b, z1), Fn(b, z0), Fn(a, z0)]; const gr = g.createLinearGradient(P[0][0], P[0][1], P[2][0], P[2][1]); gr.addColorStop(0, css([120, 150, 176])); gr.addColorStop(1, css([22, 34, 52])); g.fillStyle = gr; pathPoly(g, P); g.fill(); g.strokeStyle = css(INK, .9); g.lineWidth = 1.4; g.stroke(); g.fillStyle = css([255, 255, 255], .25); pathPoly(g, [P[0], [lerp(P[0][0], P[1][0], .3), lerp(P[0][1], P[1][1], .3)], [lerp(P[3][0], P[2][0], .15), lerp(P[3][1], P[2][1], .15)], P[3]]); g.fill(); };
  const Fs = (u, z) => gp(S, u, bv1 - .12, z), Fe = (vv, z) => gp(S, cu1, vv, z);
  const nw = van ? 0 : 2;
  if (!van) { win(lerp(cu0, cu1, .06), lerp(cu0, cu1, .5), H + 5, cabH - 6, Fs); win(lerp(cu0, cu1, .54), lerp(cu0, cu1, .94), H + 5, cabH - 6, Fs); win(bv0 + .2, bv1 - .2, H + 5, cabH - 6, Fe); }
  else { win(lerp(cu0, cu1, .1), lerp(cu0, cu1, .4), H + 8, cabH - 8, Fs); win(bv0 + .22, bv1 - .22, H + 8, cabH - 10, Fe); g.strokeStyle = css([20, 20, 22], .95); g.lineWidth = 1.6; for (let k = 0; k < 3; k++) { const a = Fs(lerp(cu0, cu1, .1), H + 14 + k * 9), b = Fs(lerp(cu0, cu1, .4), H + 14 + k * 9); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); } }
  // front (u1 end): grille, lamps, bumper
  const gz = (z) => (vv) => gp(S, bu1 - .06, vv, z);
  facePanel(g, S, r, (S_, t, z) => gp(S_, bu1 - .06, lerp(bv0 + .2, bv1 - .2, t), z), 0, 1, 14, 30, [180, 184, 180], { n: 6, ink: true, ang: 1.57 });
  g.strokeStyle = css([30, 32, 34], .9); g.lineWidth = 1.2; for (let k = 0; k < 6; k++) { const a = gp(S, bu1 - .06, lerp(bv0 + .24, bv1 - .24, k / 5), 16), b = gp(S, bu1 - .06, lerp(bv0 + .24, bv1 - .24, k / 5), 28); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
  for (const vv of [bv0 + .17, bv1 - .17]) { const q = gp(S, bu1 - .04, vv, 28); g.fillStyle = css([255, 244, 200]); g.beginPath(); g.ellipse(q[0], q[1], 6, 4.4, .5, 0, 7); g.fill(); g.strokeStyle = css(INK, .9); g.lineWidth = 1.3; g.stroke(); S.lights.push({ x: q[0] + 6, y: q[1] + 3, r: 80, col: [255, 236, 190], a: .5, fl: .02, ph: r() * 6, kind: 'lamp' }); }
  const bp = [gp(S, bu1 + .02, bv0 + .06, 14), gp(S, bu1 + .02, bv1 - .06, 14), gp(S, bu1 + .02, bv1 - .06, 8), gp(S, bu1 + .02, bv0 + .06, 8)]; paintPoly(g, bp, [190, 192, 188], r, { n: 6, ink: true, inkw: 1.2, ang: 0 });
  // chrome trim + gloss streak on the roof + state star
  const t0 = Fs(bu0 + .1, 30), t1 = Fs(bu1 - .1, 30); g.strokeStyle = css([210, 214, 210], .8); g.lineWidth = 1.4; g.beginPath(); g.moveTo(t0[0], t0[1]); g.lineTo(t1[0], t1[1]); g.stroke();
  const ro = gp(S, (cu0 + cu1) / 2, (bv0 + bv1) / 2, cabH); g.strokeStyle = css([200, 220, 255], .4); g.lineWidth = 2; g.beginPath(); g.moveTo(ro[0] - 14, ro[1] + 1); g.lineTo(ro[0] + 10, ro[1] - 6); g.stroke();
  if (van) { const q = Fs(lerp(bu0, bu1, .7), 34); handText(g, 'STATE', q[0], q[1], 8, [226, 220, 200], r, 26, { shadow: [0, 0, 0, 0] }); }
  g.fillStyle = css([226, 196, 100]); const em = gp(S, bu1 - .02, (bv0 + bv1) / 2, 36); g.beginPath(); for (let i = 0; i < 10; i++) { const a = i * .6283 - 1.57, rr = i % 2 ? 1.6 : 3.4; g.lineTo(em[0] + Math.cos(a) * rr, em[1] + Math.sin(a) * rr * .8); } g.fill();
};

/* ---- relay ---- */
PROPS.console = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, F = frontFace(I), W = u1 - u0, wal = [66, 46, 36], steel = [74, 82, 84];
  contactShadow(g, S, u0, v0, u1, v1, 1.1);
  // desk base + slanted control panel
  fcs(g, S, r, u0 + .05, v0 + .85, u1 - .05, v1 - .05, 0, 32, wal, { mat: 'metal', wear: .3, vert: true, alt: [150, 100, 64], dens: 26 });
  for (let i = 0; i < Math.round(W * 1.2); i++) { const t0 = (i + .08) / Math.round(W * 1.2), t1 = (i + .92) / Math.round(W * 1.2); facePanel(g, S, r, (S_, t, z) => gp(S_, lerp(u0 + .05, u1 - .05, t), v1 - .05, z), t0, t1, 5, 27, mul(wal, .85), { n: 6, ink: true, inkw: .9, ang: 1.57, ha: .5 }); }
  const P = (uu, tv) => gp(S, uu, lerp(v1 - .05, v0 + .85, tv), lerp(32, 56, tv));
  const pan = [P(u0 + .05, 0), P(u1 - .05, 0), P(u1 - .05, 1), P(u0 + .05, 1)];
  paintPoly(g, pan, [58, 68, 66], r, { n: 70, ang: .46, ink: true, inkw: 1.6, alt: [96, 110, 104], lit: [[170, 190, 170], [10, 14, 20], -1.2, .4, .5] });
  const nb = Math.max(4, Math.round(W * 1.6));
  for (let i = 0; i < nb; i++) {
    const uu = lerp(u0 + .22, u1 - .22, (i + .5) / nb);
    // fader slot + cap
    const a = P(uu, .12), b = P(uu, .5); g.strokeStyle = css([12, 12, 14], .95); g.lineWidth = 3; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.strokeStyle = css([150, 154, 140], .5); g.lineWidth = .8; g.stroke();
    const c = P(uu, .12 + .38 * lat(i, 3, S.seed)); paintPoly(g, [[c[0] - 4, c[1] - 2], [c[0] + 4, c[1] - 2], [c[0] + 4, c[1] + 3], [c[0] - 4, c[1] + 3]], [214, 204, 180], r, { n: 3, ink: true, inkw: .9, ew: .6 });
    // knob
    const k = P(uu, .74); g.fillStyle = css([24, 24, 28]); g.beginPath(); g.ellipse(k[0], k[1], 4.6, 3, 0, 0, 7); g.fill(); g.fillStyle = css([190, 180, 150]); g.beginPath(); g.ellipse(k[0], k[1] - 1.4, 3.6, 2.2, 0, 0, 7); g.fill(); g.strokeStyle = css(INK, .9); g.lineWidth = .8; g.stroke();
    const ang = r.r(-1.2, 1.2); g.strokeStyle = css([20, 20, 22]); g.lineWidth = 1; g.beginPath(); g.moveTo(k[0], k[1] - 1.4); g.lineTo(k[0] + Math.sin(ang) * 3, k[1] - 1.4 - Math.cos(ang) * 1.8); g.stroke();
    // lamp
    const lp = P(uu, .93); const on = lat(i, 5, S.seed) > .35; g.fillStyle = css(on ? (i % 3 ? [120, 255, 140] : [255, 80, 60]) : [40, 30, 30]); g.beginPath(); g.arc(lp[0], lp[1], 1.9, 0, 7); g.fill(); g.strokeStyle = css(INK, .8); g.lineWidth = .7; g.stroke();
    if (on) S.lights.push({ x: lp[0], y: lp[1], r: 16, col: i % 3 ? [120, 255, 140] : [255, 90, 70], a: .5, fl: .5, ph: r() * 6, kind: 'lamp' });
  }
  // rack with valves + meters + tape reels
  fcs(g, S, r, u0 + .08, v0 + .1, u1 - .08, v0 + .85, 56, 108, [44, 50, 52], { mat: 'metal', wear: .3, vert: true, ink: true, alt: [90, 100, 100], dens: 30 });
  const Fr = (t, z) => gp(S, lerp(u0 + .08, u1 - .08, t), v0 + .85, z);
  const bays = Math.max(3, Math.round(W / 1.2));
  for (let b = 0; b < bays; b++) {
    const t0 = (b + .05) / bays, t1 = (b + .95) / bays, kind = b % 3;
    facePanel(g, S, r, Fr, t0, t1, 60, 104, [22, 24, 26], { n: 8, ink: true, inkw: 1.2, ha: .3 });
    if (kind === 1) {   // meters + reel
      for (let m = 0; m < 2; m++) { const q = Fr(lerp(t0, t1, .25 + m * .5), 92); paintRect(g, q[0] - 8, q[1] - 6, 16, 12, [226, 214, 170], r, { n: 4, ink: true, ew: .6, ang: 0 }); g.strokeStyle = css([20, 20, 22]); g.lineWidth = 1; g.beginPath(); g.moveTo(q[0] - 3, q[1] + 5); g.lineTo(q[0] + 2 + m * 3, q[1] - 4); g.stroke(); g.fillStyle = css([180, 40, 36]); g.fillRect(q[0] + 3, q[1] - 5, 4, 3); }
      for (let m = 0; m < 2; m++) { const q = Fr(lerp(t0, t1, .3 + m * .4), 72); g.save(); g.translate(q[0], q[1]); g.transform(.5, .25, 0, 1, 0, 0); g.fillStyle = css([16, 16, 18]); g.beginPath(); g.arc(0, 0, 11, 0, 7); g.fill(); g.strokeStyle = css([180, 180, 170]); g.lineWidth = 1.6; g.stroke(); g.fillStyle = css([110, 70, 40]); g.beginPath(); g.arc(0, 0, 7, 0, 7); g.fill(); g.fillStyle = css([200, 200, 190]); g.beginPath(); g.arc(0, 0, 2.2, 0, 7); g.fill(); g.strokeStyle = css([200, 200, 190], .8); g.lineWidth = 1.2; for (let s = 0; s < 3; s++) { const a = s * 2.094; g.beginPath(); g.moveTo(Math.cos(a) * 2.5, Math.sin(a) * 2.5); g.lineTo(Math.cos(a) * 9, Math.sin(a) * 9); g.stroke(); } g.restore(); }
    } else {            // valve bay
      const nt = 4;
      for (let k = 0; k < nt; k++) { const q = Fr(lerp(t0, t1, (k + .5) / nt), 66), tall = 20 + (k % 2) * 7 + (b % 2) * 4, on = lat(b * 7 + k, 2, S.seed) > .15; glassTube(g, q[0], q[1], tall, 7.5, [255, 160, 60], on ? 1 : .15);
        if (on) S.lights.push({ x: q[0], y: q[1] - tall * .5, r: 26, col: [255, 140, 50], a: .38, fl: .22, ph: r() * 6, kind: 'lamp' }); }
      const a = Fr(t0 + .01, 63), c = Fr(t1 - .01, 63); g.strokeStyle = css([150, 150, 140], .6); g.lineWidth = 1; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(c[0], c[1]); g.stroke();
    }
  }
  // top-mounted sign + cables + microphone socket
  const sg = Fr(.5, 124); neonSign(g, S, sg[0], sg[1] + 4, 'ON AIR', [255, 60, 50], 11, { skew: .5 });
  for (let k = 0; k < 3; k++) { const a = Fr(.1 + k * .35, 108), b = Fr(.15 + k * .35, 118); g.strokeStyle = css([14, 14, 16], .95); g.lineWidth = 2.2; g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(a[0] + 8, a[1] - 22, b[0] + 12, b[1] - 6); g.stroke(); }
  S.lights.push({ x: gp(S, (u0 + u1) / 2, v1, 40)[0], y: gp(S, (u0 + u1) / 2, v1, 40)[1], r: 150, col: [255, 140, 60], a: .24, fl: .08, ph: r() * 6, kind: 'lamp' });
  S.steam.push({ x: Fr(.82, 104)[0], y: Fr(.82, 104)[1] - 8 });
};
PROPS.generator = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, col = [[78, 92, 70], [110, 100, 70], [70, 84, 100], [100, 70, 60]][v];
  contactShadow(g, S, u0, v0, u1, v1, 1.2);
  fcs(g, S, r, u0 + .06, v0 + .06, u1 - .06, v1 - .06, 0, 12, [34, 34, 38], { mat: 'enamel', wear: .6, under: [70, 44, 30], vert: true, ink: true });
  fcs(g, S, r, u0 + .14, v0 + .14, u1 - .14, v1 - .3, 12, 70, col, { mat: 'enamel', wear: .6, under: [70, 44, 30], vert: true, alt: mul(col, 1.5), dens: 22 });
  const F = (t, z) => gp(S, lerp(u0 + .14, u1 - .14, t), v1 - .3, z), Fe = (t, z) => gp(S, u1 - .14, lerp(v0 + .14, v1 - .3, t), z);
  // side louvres + fan grille on the front, hazard chevrons
  for (let k = 0; k < 9; k++) { const a = Fe(.1, 22 + k * 5), b = Fe(.9, 22 + k * 5); g.strokeStyle = css([10, 12, 10], .85); g.lineWidth = 2; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
  const fq = F(.5, 42); g.save(); g.translate(fq[0], fq[1]); g.transform(.5, .25, 0, 1, 0, 0); g.fillStyle = css([14, 14, 16]); g.beginPath(); g.arc(0, 0, 19, 0, 7); g.fill(); g.strokeStyle = css([150, 154, 148]); g.lineWidth = 1.6; g.stroke(); for (let k = 1; k < 4; k++) { g.beginPath(); g.arc(0, 0, k * 4.8, 0, 7); g.stroke(); } for (let k = 0; k < 8; k++) { g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(k * .785) * 19, Math.sin(k * .785) * 19); g.stroke(); } g.restore();
  const ctl = F(.86, 56); paintRect(g, ctl[0] - 14, ctl[1] - 14, 22, 24, [26, 28, 30], r, { n: 6, ink: true, ang: 0 }); g.fillStyle = css([220, 210, 180]); g.beginPath(); g.arc(ctl[0] - 6, ctl[1] - 5, 4.2, 0, 7); g.fill(); g.strokeStyle = css(INK, .8); g.lineWidth = 1; g.stroke(); g.strokeStyle = css([170, 30, 30]); g.beginPath(); g.moveTo(ctl[0] - 6, ctl[1] - 5); g.lineTo(ctl[0] - 3, ctl[1] - 8); g.stroke();
  g.fillStyle = css([255, 70, 50]); g.beginPath(); g.arc(ctl[0] + 3, ctl[1] + 5, 2.4, 0, 7); g.fill(); S.lights.push({ x: ctl[0] + 3, y: ctl[1] + 5, r: 34, col: [255, 70, 40], a: .6, fl: .6, ph: r() * 6, kind: 'lamp' });
  // alternator drum on top + exhaust stack
  cylBody(g, S, r, cu - .15, cv - .1, .55, 70, 100, mul(col, .9), { sw: 3, dens: 22, alt: mul(col, 1.5), topCol: mul(col, 1.2) });
  const rb = gp(S, cu - .15, cv - .1, 100); g.strokeStyle = css([20, 22, 20], .8); g.lineWidth = 2; for (const z of [78, 88]) { const c0 = gp(S, cu - .15, cv - .1, z); g.beginPath(); g.ellipse(c0[0], c0[1], ecx(.55), ecy(.55), 0, 0, Math.PI); g.stroke(); }
  const sx = u1 - .35, sv = v0 + .35; vbar(g, S, r, sx, sv, 70, 150, 8, [40, 40, 44], { lit: [[255, 190, 130], [10, 12, 24], 0, .6, .5] });
  const st = gp(S, sx, sv, 150); paintPoly(g, [[st[0] - 8, st[1]], [st[0] + 8, st[1]], [st[0] + 12, st[1] - 8], [st[0] - 12, st[1] - 8]], [60, 58, 60], r, { n: 6, ink: true });
  S.steam.push({ x: st[0], y: st[1] - 10 }); S.steam.push({ x: st[0] + 3, y: st[1] - 18 });
  // cables to the wall, fuel can
  const c0 = gp(S, u0 + .3, v1 - .2, 12), c1 = gp(S, u0 - .35, v1 + .1, 0); g.strokeStyle = css([10, 10, 12], .95); g.lineWidth = 3.4; g.beginPath(); g.moveTo(c0[0], c0[1]); g.quadraticCurveTo(c0[0] - 20, c0[1] + 30, c1[0], c1[1]); g.stroke();
  const jq = gp(S, u1 - .1, v1 - .06, 0); paintPoly(g, [[jq[0] - 7, jq[1]], [jq[0] + 7, jq[1] - 3], [jq[0] + 7, jq[1] - 24], [jq[0] - 7, jq[1] - 21]], [170, 56, 44], r, { n: 6, ink: true, ang: 1.57 });
  S.lights.push({ x: F(.5, 40)[0], y: F(.5, 40)[1], r: 130, col: [255, 150, 60], a: .12, fl: .12, ph: r() * 6, kind: 'heat' });
};
WALLPROPS.vault_door = function (g, S, p, I) {
  const { r, u0, len, Y, v } = I, cx = u0 + len / 2;
  wallShadow(g, cx - len / 2 + 4, cx + len / 2 - 4, Y(106), Y(0), .45);
  if (v === 1) {   // round tape vault
    const R = Math.min(len / 2 - 8, 46), cy = Y(56);
    paintRect(g, cx - R - 12, Y(112), R * 2 + 24, 112, [96, 98, 92], r, { n: 70, ang: 0, ink: true, inkw: 2, alt: [140, 140, 130], ew: 1.6 });      // concrete surround
    for (let i = 0; i < 2; i++) paintEll(g, cx, cy, R + 8 - i * 2, R + 8 - i * 2, i ? [60, 64, 66] : [110, 112, 108], r, { n: 30, ink: true, inkw: 2, alt: [170, 170, 150] });
    paintEll(g, cx, cy, R, R, [78, 86, 86], r, { n: 70, sw: 4, ang: 0, aj: 1.5, ink: true, inkw: 2.2, alt: [130, 142, 136], lit: [[190, 200, 180], [12, 16, 24], -.8, .5, .5], edge: false });
    g.strokeStyle = css([20, 24, 26], .85); g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R * .78, 0, 7); g.stroke(); g.strokeStyle = css([190, 200, 180], .3); g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, R * .78 + 2, 3.6, 5.6); g.stroke();
    for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283; g.fillStyle = css([40, 44, 46]); g.beginPath(); g.arc(cx + Math.cos(a) * R * .9, cy + Math.sin(a) * R * .9, 2.2, 0, 7); g.fill(); g.fillStyle = css([200, 200, 190], .5); g.fillRect(cx + Math.cos(a) * R * .9 - 1, cy + Math.sin(a) * R * .9 - 1.6, 1.4, 1); }
    // handwheel
    g.strokeStyle = css(INK, .9); g.lineWidth = 6.4; g.beginPath(); g.arc(cx, cy, R * .5, 0, 7); g.stroke(); g.strokeStyle = css([204, 176, 96]); g.lineWidth = 4; g.stroke();
    for (let k = 0; k < 6; k++) { const a = k * 1.0472 + .3; g.strokeStyle = css(INK, .9); g.lineWidth = 6; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * R * .5, cy + Math.sin(a) * R * .5); g.stroke(); g.strokeStyle = css([204, 176, 96]); g.lineWidth = 3.6; g.stroke(); g.fillStyle = css([226, 200, 120]); g.beginPath(); g.arc(cx + Math.cos(a) * R * .56, cy + Math.sin(a) * R * .56, 3.4, 0, 7); g.fill(); }
    g.fillStyle = css([226, 200, 120]); g.beginPath(); g.arc(cx, cy, 6.4, 0, 7); g.fill(); g.strokeStyle = css(INK, .9); g.lineWidth = 1.4; g.stroke();
    // hinge barrels, gauge, plate
    for (const dy of [-26, 26]) paintRect(g, cx - R - 14, cy + dy - 7, 12, 14, [56, 58, 60], r, { n: 6, ink: true, ang: 1.57 });
    const gq = [cx + R * .72, cy - R * .72]; g.fillStyle = css([226, 218, 190]); g.beginPath(); g.arc(gq[0], gq[1], 7, 0, 7); g.fill(); g.strokeStyle = css(INK, .9); g.lineWidth = 1.6; g.stroke(); g.strokeStyle = css([170, 30, 30]); g.lineWidth = 1.2; g.beginPath(); g.moveTo(gq[0], gq[1]); g.lineTo(gq[0] + 3, gq[1] - 4); g.stroke();
    paintRect(g, cx - 22, cy + R + 4, 44, 11, [196, 170, 90], r, { n: 6, ink: true, ang: 0 }); handText(g, 'TAPES', cx, cy + R + 9.5, 7, [30, 20, 10], r, 36, { shadow: [0, 0, 0, 0] });
    g.fillStyle = css([255, 60, 40]); g.beginPath(); g.arc(cx - R - 2, Y(100), 3, 0, 7); g.fill(); S.lights.push((function () { const q = gp(S, p.side === 'l' ? 0 : wallStart(p) + .1, p.side === 'l' ? wallStart(p) + .1 : 0, 100); return { x: q[0], y: q[1], r: 40, col: [255, 60, 40], a: .4, fl: .3, ph: r() * 6, kind: 'lamp' }; })());
    return;
  }
  // v0: heavy state gate: concrete portal, double steel leaves, plate, lamp, camera
  const dw = Math.min(len - 14, 108), x0 = cx - dw / 2, top = Y(100);
  paintRect(g, x0 - 12, top - 10, dw + 24, Y(0) - top + 10, [104, 104, 100], r, { n: 70, ang: 0, ink: true, inkw: 2, alt: [150, 150, 140], ew: 1.6, ha: .8 });
  paintRect(g, x0, top, dw, Y(0) - top, [66, 74, 74], r, { n: 70, sw: 4, ang: 1.57, aj: .1, ink: true, inkw: 2, alt: [110, 124, 118], lit: [[160, 180, 170], [10, 14, 22], 0, .35, .5] });
  g.strokeStyle = css([12, 14, 16], .95); g.lineWidth = 2.6; g.beginPath(); g.moveTo(cx, top); g.lineTo(cx, Y(0)); g.stroke();
  for (const sx of [-1, 1]) { const lx = cx + sx * dw / 4; g.strokeStyle = css([22, 26, 28], .8); g.lineWidth = 2; g.strokeRect(lx - dw / 4 + 5, top + 8, dw / 2 - 10, Y(0) - top - 16); g.beginPath(); g.moveTo(lx - dw / 4 + 5, top + 8); g.lineTo(lx + dw / 4 - 5, Y(0) - 8); g.moveTo(lx + dw / 4 - 5, top + 8); g.lineTo(lx - dw / 4 + 5, Y(0) - 8); g.stroke();
    for (let k = 0; k < 6; k++) { g.fillStyle = css([34, 36, 38]); g.beginPath(); g.arc(lx - dw / 4 + 9, top + 14 + k * 14, 1.6, 0, 7); g.arc(lx + dw / 4 - 9, top + 14 + k * 14, 1.6, 0, 7); g.fill(); } }
  g.fillStyle = css([210, 176, 50], .9); for (let k = 0; k < 8; k++) { const xx = x0 + k * dw / 8; g.beginPath(); g.moveTo(xx, Y(12)); g.lineTo(xx + 6, Y(12)); g.lineTo(xx + dw / 8 + 6 - 6, Y(0)); g.lineTo(xx + dw / 8 - 6, Y(0)); g.closePath(); if (k % 2 === 0) g.fill(); }
  // enamel sign, lamp, camera, intercom, chain+padlock
  paintRect(g, cx - 40, top - 28, 80, 15, [30, 56, 90], r, { n: 10, ink: true, inkw: 1.6, ang: 0 }); handText(g, 'DISTRICT RELAY No. 4', cx, top - 20.5, 6.4, [236, 232, 214], r, 74, { shadow: [0, 0, 0, 0] });
  paintRect(g, cx - 40, top - 12.5, 80, 3, [176, 40, 36], r, { n: 4, ink: false, ang: 0 });
  g.fillStyle = css([255, 60, 40]); g.beginPath(); g.arc(x0 - 6, top + 6, 4, 0, 7); g.fill(); g.strokeStyle = css(INK, .9); g.lineWidth = 1.4; g.stroke();
  S.lights.push((function () { const q = gp(S, p.side === 'l' ? 0 : wallStart(p) + .05, p.side === 'l' ? wallStart(p) + .05 : 0, 90); return { x: q[0], y: q[1], r: 56, col: [255, 60, 40], a: .5, fl: .5, ph: r() * 6, kind: 'lamp' }; })());
  g.strokeStyle = css([20, 20, 22]); g.lineWidth = 3; g.beginPath(); g.moveTo(x0 + dw + 6, top - 4); g.lineTo(x0 + dw + 22, top - 10); g.stroke(); paintRect(g, x0 + dw + 14, top - 15, 16, 9, [60, 62, 66], r, { n: 4, ink: true, ang: 0 }); g.fillStyle = css([255, 50, 50]); g.fillRect(x0 + dw + 26, top - 11, 2, 2);
  paintRect(g, x0 + dw + 4, Y(60), 12, 20, [52, 54, 56], r, { n: 4, ink: true, ang: 1.57 }); g.fillStyle = css([10, 10, 12]); for (let k = 0; k < 4; k++) g.fillRect(x0 + dw + 7, Y(58) + k * 3.4, 6, 1.4);
  g.strokeStyle = css([30, 30, 32]); g.lineWidth = 2.6; g.beginPath(); g.moveTo(cx - 12, Y(48)); g.quadraticCurveTo(cx, Y(36), cx + 12, Y(48)); g.stroke(); paintRect(g, cx - 4, Y(46), 8, 9, [190, 160, 70], r, { n: 4, ink: true, ew: .6, ang: 1.57 });
};
WALLPROPS.antenna = function (g, S, p, I) {
  const { r, u0, len, Y, v } = I, cx = u0 + len / 2;
  wallShadow(g, cx - 28, cx + 28, Y(132), Y(10), .42);
  paintRect(g, cx - 28, Y(130), 56, 122, [48, 54, 54], r, { n: 50, sw: 4, ang: 1.57, ink: true, inkw: 1.8, alt: [90, 98, 96], lit: [[170, 190, 180], [10, 14, 22], 0, .3, .5] });
  // porcelain insulators + cable bundle rising through the ceiling
  for (let k = 0; k < 3; k++) { const x = cx - 15 + k * 15, y = Y(104 - k * 6); for (let j = 0; j < 4; j++) { paintEll(g, x, y + j * 5, 6 - j * .4, 2.6, [226, 220, 200], r, { n: 6, ink: true, inkw: 1, ew: .6 }); } g.strokeStyle = css([14, 14, 16], .95); g.lineWidth = 3.4 - k * .4; g.beginPath(); g.moveTo(x, y - 2); g.lineTo(x + (k - 1) * 3, Y(152)); g.stroke(); g.strokeStyle = css([200, 150, 90], .4); g.lineWidth = 1; g.stroke(); }
  // knife switch
  paintRect(g, cx - 18, Y(58), 36, 30, [32, 40, 44], r, { n: 10, ink: true, ang: 0 });
  g.strokeStyle = css([210, 130, 70]); g.lineWidth = 3.2; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx - 10, Y(32)); g.lineTo(cx - 10, Y(56)); g.moveTo(cx + 10, Y(32)); g.lineTo(cx + 10, Y(56)); g.stroke(); g.beginPath(); g.moveTo(cx - 10, Y(56)); g.lineTo(cx + 10, Y(56)); g.stroke(); g.strokeStyle = css(INK, .7); g.lineWidth = .8; g.stroke();
  paintRect(g, cx - 4, Y(66), 8, 8, [20, 20, 22], r, { n: 3, ink: true, ew: .6 });
  paintRect(g, cx - 22, Y(24), 44, 12, [196, 170, 90], r, { n: 6, ink: true, ang: 0 }); handText(g, 'AERIAL FEED', cx, Y(18), 6, [30, 20, 10], r, 40, { shadow: [0, 0, 0, 0] });
  // crackle of blue light between the insulators (animated through a neon layer)
  const q = gp(S, p.side === 'l' ? 0 : wallStart(p) + wallLen(p) / 2, p.side === 'l' ? wallStart(p) + wallLen(p) / 2 : 0, 100);
  const c = mk(60, 40), k = ctx2(c); k.strokeStyle = css([150, 200, 255]); k.lineWidth = 1.6; k.shadowColor = css([120, 180, 255]); k.shadowBlur = 8; k.beginPath(); k.moveTo(4, 20); for (let i = 1; i < 8; i++) k.lineTo(4 + i * 7, 20 + (i % 2 ? -7 : 6)); k.stroke();
  S.neons.push({ c, x: q[0] - 30, y: q[1] - 20, w: 60, h: 40, ph: 7.7 });
};
WALLPROPS.poster_wall = function (g, S, p, I) {
  const { r, u0, len, Y, v } = I, top = Y(132), bot = Y(4), hgt = bot - top;
  const B = [[u0, top], [u0 + len, top], [u0 + len, bot], [u0, bot]];
  paintPoly(g, B, [88, 72, 58], r, { n: len / 2, sw: 5, ang: 1.57, ink: true, inkw: 2, alt: [140, 120, 96], ew: 1.4, edge: false });
  prTexFill(g, B, 'streak', 1); prTexFill(g, B, 'speck', .6);
  // three generations of paste: old faded layer, the current campaign, fresh notices on top
  prPosterLayer(g, S, r, u0, top + 2, len, hgt - 10, Math.round(len / 22), 'pw0' + p.x);
  g.save(); g.globalAlpha = .35; g.fillStyle = css([220, 206, 170]); g.fillRect(u0, top, len, hgt); g.restore();   // sun-bleached under-layer
  prPosterLayer(g, S, r, u0 + 6, top + 10, len - 12, hgt - 30, Math.round(len / 34), 'pw1' + p.x);
  prPosterLayer(g, S, r, u0 + 20, top + 30, len - 40, hgt - 70, Math.max(2, Math.round(len / 90)), 'pw2' + p.x);
  const gg = g.createLinearGradient(0, top, 0, bot); gg.addColorStop(0, 'rgba(8,6,16,.4)'); gg.addColorStop(.22, 'rgba(8,6,16,0)'); gg.addColorStop(.8, 'rgba(8,6,16,0)'); gg.addColorStop(1, 'rgba(8,6,16,.45)'); g.fillStyle = gg; g.fillRect(u0, top, len, hgt);
  prTexFill(g, B, 'grime', .9);
  // dissident chalk: a bell crossed out, and WAKE UP scrawled across a face
  g.strokeStyle = css([240, 240, 226], .6); g.lineWidth = 1.6; const gx = u0 + len * .66, gy = Y(36); g.beginPath(); g.moveTo(gx - 6, gy + 8); g.quadraticCurveTo(gx - 6, gy - 8, gx, gy - 9); g.quadraticCurveTo(gx + 6, gy - 8, gx + 6, gy + 8); g.closePath(); g.moveTo(gx - 9, gy - 8); g.lineTo(gx + 9, gy + 10); g.moveTo(gx + 9, gy - 8); g.lineTo(gx - 9, gy + 10); g.stroke();
  handText(g, 'WAKE UP', u0 + len * .3, Y(56), 13, [236, 236, 220], r, 70, { shadow: false, alpha: .6, family: '"Comic Sans MS","Segoe Print",cursive' });
  // a paste bucket and brush left at the foot
  { const bx = u0 + len * .82; paintRect(g, bx, Y(18), 14, 14, [120, 124, 120], r, { n: 3, ink: true, inkw: 1, ang: 1.57, edge: false }); g.fillStyle = css([226, 220, 196], .9); g.fillRect(bx + 1, Y(18), 12, 2); prLine(g, [bx + 9, Y(16)], [bx + 18, Y(40)], [110, 80, 50], 1, 2); }
  paintRect(g, u0, top - 6, len, 6, [56, 46, 40], r, { n: len / 6, ink: true, ang: 0 });
};

/* ---- tower ---- */
PROPS.bigbell = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, bronze = v === 1 ? [92, 150, 120] : [168, 112, 50], timber = [92, 66, 46];
  contactShadow(g, S, cu - 1.3, cv - .9, cu + 1.3, cv + .9, 1.3);
  g.fillStyle = css([6, 4, 14], .3); { const b = gp(S, cu, cv, 0); g.beginPath(); g.ellipse(b[0] - 6, b[1] + 3, 64, 26, -.05, 0, 7); g.fill(); }
  const post = (uu, vv, top, w) => vbar(g, S, r, uu, vv, 0, top, w, timber, { lit: [[255, 200, 140], [10, 12, 24], 0, .6, .5], alt: [150, 110, 76] });
  // back posts + beam
  post(cu - 1.35, cv - .45, 204, 11); post(cu + 1.35, cv - .45, 204, 11);
  const bA = gp(S, cu - 1.4, cv - .2, 204), bB = gp(S, cu + 1.4, cv - .2, 204);
  paintPoly(g, [[bA[0], bA[1] - 8], [bB[0], bB[1] - 8], [bB[0], bB[1] + 8], [bA[0], bA[1] + 8]], timber, r, { n: 30, ang: .46, ink: true, inkw: 2, alt: [150, 110, 76], lit: [[255, 200, 140], [10, 12, 24], -1.57, .5, .5], ew: 1.4 });
  // headstock and straps
  const hA = gp(S, cu - .75, cv, 178), hB = gp(S, cu + .75, cv, 178);
  paintPoly(g, [[hA[0], hA[1] - 6], [hB[0], hB[1] - 6], [hB[0], hB[1] + 7], [hA[0], hA[1] + 7]], [74, 52, 38], r, { n: 16, ang: .46, ink: true, inkw: 1.8 });
  for (const t of [.2, .5, .8]) { const x = lerp(hA[0], hB[0], t), y = lerp(hA[1], hB[1], t); g.strokeStyle = css([40, 42, 46]); g.lineWidth = 3; g.beginPath(); g.moveTo(x, y - 8); g.lineTo(x, y + 12); g.stroke(); }
  // bell body from a profile
  const prof = (z) => { const k = clamp((172 - z) / 138, 0, 1); return .28 + .46 * Math.pow(k, .6) + (k > .7 ? .34 * Math.pow((k - .7) / .3, 1.8) : 0); };
  const L = [], R = [];
  for (let z = 172; z >= 34; z -= 6) { const c0 = gp(S, cu, cv, z), rd = prof(z); L.push([c0[0] - ecx(rd), c0[1]]); R.push([c0[0] + ecx(rd), c0[1]]); }
  const mc = gp(S, cu, cv, 34), mr = prof(34), arc = [];
  for (let i = 0; i <= 14; i++) { const a = i / 14 * Math.PI; arc.push([mc[0] + Math.cos(a) * ecx(mr), mc[1] + Math.sin(a) * ecy(mr)]); }
  const body = L.concat(arc.reverse()).concat(R.reverse());
  g.save(); g.translate(0, 0);
  // dark interior sliver under the lip, then the cast-bronze body
  paintPoly(g, ellPts(mc[0], mc[1] + 1.5, ecx(mr) * .96, ecy(mr) * .98, 24, 0, r, .01), [14, 8, 6], r, { n: 4, ink: true, inkw: 1.8 });
  paintPoly(g, body, bronze, r, { n: 200, sw: 5, sl: 50, ang: 1.5, aj: .25, ink: false, alt: mix(bronze, [255, 220, 130], .35), jv: .14, edge: false });
  g.save(); pathPoly(g, body); g.clip();
  const bx0 = mc[0] - ecx(mr), bx1 = mc[0] + ecx(mr), btop = gp(S, cu, cv, 172)[1];
  // cylindrical volume: cold teal shadow side, deep core, polished warm highlight, hot reflected rim
  { const gr = g.createLinearGradient(bx0, 0, bx1, 0); gr.addColorStop(0, 'rgba(30,70,90,.7)'); gr.addColorStop(.18, 'rgba(20,30,50,.45)'); gr.addColorStop(.42, 'rgba(0,0,0,0)'); gr.addColorStop(.6, 'rgba(255,226,150,.35)'); gr.addColorStop(.68, 'rgba(255,246,210,.42)'); gr.addColorStop(.76, 'rgba(0,0,0,0)'); gr.addColorStop(.9, 'rgba(30,16,10,.35)'); gr.addColorStop(1, 'rgba(255,150,60,.6)'); g.fillStyle = gr; g.fillRect(bx0 - 4, btop - 10, bx1 - bx0 + 8, mc[1] - btop + 30); }
  // verdigris: green-blue patina pooled at the crown and in the band recesses, running down in streaks
  { const pg = g.createLinearGradient(0, btop, 0, mc[1]); pg.addColorStop(0, 'rgba(90,160,130,.55)'); pg.addColorStop(.35, 'rgba(90,160,130,.18)'); pg.addColorStop(1, 'rgba(90,160,130,.05)'); g.fillStyle = pg; g.fillRect(bx0 - 4, btop - 10, bx1 - bx0 + 8, mc[1] - btop + 30); }
  for (let i = 0; i < 46; i++) { const x = lerp(bx0, bx1, r()), z = r.r(60, 172), q = gp(S, cu, cv, z), l = r.r(8, 46); g.strokeStyle = css(r() < .7 ? [96, 170, 140] : [140, 200, 176], .14 + r() * .22); g.lineWidth = r.r(1, 3.4); g.beginPath(); g.moveTo(x, q[1] - 30); g.quadraticCurveTo(x + r.r(-2, 2), q[1] - 30 + l * .5, x + r.r(-1.5, 1.5), q[1] - 30 + l); g.stroke(); }
  for (let i = 0; i < 16; i++) { const q = [lerp(bx0, bx1, r()), lerp(btop + 10, mc[1], r())], rr = r.r(3, 9), gr = g.createRadialGradient(q[0], q[1], 0, q[0], q[1], rr); gr.addColorStop(0, 'rgba(110,180,150,.4)'); gr.addColorStop(1, 'rgba(110,180,150,0)'); g.fillStyle = gr; g.fillRect(q[0] - rr, q[1] - rr, rr * 2, rr * 2); }
  // the polished strike zone near the lip, worn bright by a century of the clapper
  { const sq = gp(S, cu, cv, 48), gr = g.createRadialGradient(sq[0] + 14, sq[1] + 8, 2, sq[0] + 14, sq[1] + 8, 30); gr.addColorStop(0, 'rgba(255,214,140,.5)'); gr.addColorStop(1, 'rgba(255,214,140,0)'); g.fillStyle = gr; g.fillRect(sq[0] - 20, sq[1] - 24, 70, 60); }
  // inscription bands (front arcs) with relief studs and cast lettering
  for (const z of [132, 108, 70]) { const c0 = gp(S, cu, cv, z), rd = prof(z); g.strokeStyle = css(mul(bronze, .4), .85); g.lineWidth = 3.4; g.beginPath(); g.ellipse(c0[0], c0[1], ecx(rd), ecy(rd), 0, 0, Math.PI); g.stroke(); g.strokeStyle = css([110, 180, 150], .45); g.lineWidth = 1.6; g.beginPath(); g.ellipse(c0[0], c0[1] + 1.6, ecx(rd), ecy(rd), 0, .1, Math.PI - .1); g.stroke(); g.strokeStyle = css(mix(bronze, [255, 230, 150], .6), .7); g.lineWidth = 1.2; g.beginPath(); g.ellipse(c0[0], c0[1] - 2.4, ecx(rd), ecy(rd), 0, .1, Math.PI - .1); g.stroke(); }
  const ib = gp(S, cu, cv + prof(120) * .9, 120); prBlock(g, 'ONE BELL · ONE UNION', ib[0] - 2, ib[1] - 5, 8, mul(bronze, .36), 74, { alpha: .9 }); prBlock(g, 'ONE BELL · ONE UNION', ib[0] - 2.8, ib[1] - 5.8, 8, mix(bronze, [255, 230, 160], .5), 74, { alpha: .35 });
  const ib2 = gp(S, cu, cv + prof(86) * .9, 86); prBlock(g, 'SCHOOL No. 9  ·  CAST 1891', ib2[0], ib2[1] - 2, 6, mul(bronze, .38), 96, { alpha: .8 });
  for (let k = 0; k < 12; k++) { const a = .2 + k * .23, z = 96, c0 = gp(S, cu, cv, z), rd = prof(z); g.fillStyle = css(mix(bronze, [255, 230, 150], .5), .8); g.beginPath(); g.arc(c0[0] + Math.cos(a) * ecx(rd) * .92, c0[1] + Math.sin(a) * ecy(rd) * .92, 1.8, 0, 7); g.fill(); g.fillStyle = css([30, 20, 10], .5); g.beginPath(); g.arc(c0[0] + Math.cos(a) * ecx(rd) * .92 + .8, c0[1] + Math.sin(a) * ecy(rd) * .92 + 1, 1.2, 0, 7); g.fill(); }
  // cast relief of the bell emblem on the front, a chalked tally of the nights
  { const q = gp(S, cu + .1, cv + prof(150) * .9, 150); prBellGlyph(g, q[0], q[1], 16, mul(bronze, .45), .9); prBellGlyph(g, q[0] - .8, q[1] - .8, 16, mix(bronze, [255, 230, 160], .4), .5); }
  if (v === 2) { g.strokeStyle = css([10, 6, 4], .95); g.lineWidth = 2; g.beginPath(); const s0 = gp(S, cu + .3, cv + .8, 110); g.moveTo(s0[0], s0[1]); g.lineTo(s0[0] + 3, s0[1] + 12); g.lineTo(s0[0] - 2, s0[1] + 26); g.lineTo(s0[0] + 4, s0[1] + 44); g.stroke(); }
  prTexFill(g, body, 'scratch', .6); prTexFill(g, body, 'grime', .7);
  g.restore();
  ink(g, body, r, 2.6, null, .9);
  // heavy lip band
  g.strokeStyle = css(mix(bronze, [255, 230, 150], .35), .9); g.lineWidth = 4; g.beginPath(); g.ellipse(mc[0], mc[1], ecx(mr), ecy(mr), 0, 0, Math.PI); g.stroke(); g.strokeStyle = css(INK, .9); g.lineWidth = 1.2; g.stroke();
  // crown loops
  for (const t of [-.5, 0, .5]) { const c = gp(S, cu + t * .5, cv, 176); paintEll(g, c[0], c[1] - 6, 5, 7, [60, 46, 34], r, { n: 8, ink: true }); }
  g.restore();
  // clapper
  const cl = gp(S, cu + .08, cv + .1, 28); g.strokeStyle = css([40, 34, 30]); g.lineWidth = 3; g.beginPath(); g.moveTo(cl[0], cl[1] - 12); g.lineTo(cl[0] + 1, cl[1] + 6); g.stroke(); paintEll(g, cl[0] + 1, cl[1] + 10, 7, 7, [60, 56, 54], r, { n: 10, ink: true, lit: [[200, 190, 170], [10, 10, 20], -1, .5, .5] });
  // front posts, bracing, iron bands, wheel + rope
  post(cu - 1.35, cv + .45, 204, 12); post(cu + 1.35, cv + .45, 204, 12);
  for (const sd of [-1, 1]) { const a = gp(S, cu + sd * 1.35, cv + .45, 30), b = gp(S, cu + sd * 1.35, cv - .45, 170); g.strokeStyle = css(mul(timber, .9)); g.lineWidth = 5; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.strokeStyle = css(INK, .7); g.lineWidth = 1; g.stroke(); }
  const fA = gp(S, cu - 1.4, cv + .45, 204), fB = gp(S, cu + 1.4, cv + .45, 204);
  paintPoly(g, [[fA[0], fA[1] - 8], [fB[0], fB[1] - 8], [fB[0], fB[1] + 8], [fA[0], fA[1] + 8]], timber, r, { n: 30, ang: .46, ink: true, inkw: 2, alt: [150, 110, 76], ew: 1.4 });
  for (const sd of [-1, 1]) for (const z of [60, 120, 180]) { const q = gp(S, cu + sd * 1.35, cv + .45, z); g.strokeStyle = css([36, 38, 42]); g.lineWidth = 3; g.beginPath(); g.moveTo(q[0] - 6, q[1]); g.lineTo(q[0] + 6, q[1]); g.stroke(); }
  const wc = gp(S, cu + 1.55, cv, 150); g.save(); g.translate(wc[0], wc[1]); g.transform(-.5, .25, 0, 1, 0, 0);
  g.strokeStyle = css([86, 60, 40]); g.lineWidth = 7; g.beginPath(); g.arc(0, 0, 48, 0, 7); g.stroke(); g.strokeStyle = css([150, 110, 76]); g.lineWidth = 2; g.stroke();
  g.strokeStyle = css([80, 56, 38]); g.lineWidth = 4; for (let k = 0; k < 8; k++) { g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(k * .785) * 46, Math.sin(k * .785) * 46); g.stroke(); }
  g.fillStyle = css([50, 40, 34]); g.beginPath(); g.arc(0, 0, 7, 0, 7); g.fill(); g.strokeStyle = css(INK, .9); g.lineWidth = 1.4; g.stroke(); g.restore();
  const r0 = gp(S, cu + 1.55, cv + .8, 110), r1 = gp(S, cu + 1.5, cv + 1.2, 40), r2 = gp(S, cu + 1.35, cv + 1.3, 0);
  g.strokeStyle = css(INK, .9); g.lineWidth = 4.4; g.beginPath(); g.moveTo(r0[0], r0[1]); g.quadraticCurveTo(r1[0] + 4, r1[1], r2[0], r2[1] - 2); g.stroke(); g.strokeStyle = css([196, 164, 110]); g.lineWidth = 3; g.stroke(); g.strokeStyle = css([90, 66, 40], .7); g.lineWidth = 1; g.setLineDash([2, 3]); g.stroke(); g.setLineDash([]);
  for (let k = 0; k < 3; k++) { g.strokeStyle = css([196, 164, 110]); g.lineWidth = 3; g.beginPath(); g.ellipse(r2[0] + 4, r2[1] - k * 1.8 + 1, 15 - k * 2.4, 6 - k, 0, 0, 7); g.stroke(); }
  const sl = gp(S, cu + 1.5, cv + 1.05, 60); paintPoly(g, [[sl[0] - 3, sl[1]], [sl[0] + 3, sl[1]], [sl[0] + 3, sl[1] + 26], [sl[0] - 3, sl[1] + 26]], [176, 40, 40], r, { n: 6, ink: true, inkw: .9, ang: 1.57 });
  g.fillStyle = css([226, 220, 196]); g.fillRect(sl[0] - 3, sl[1] + 8, 6, 5);
  S.lights.push({ x: mc[0] + 30, y: mc[1] - 70, r: 150, col: [255, 160, 70], a: .16, fl: .05, ph: r() * 6, kind: 'lamp' });
};
PROPS.ropes = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, n = 3 + (v & 1), alongV = (v1 - v0) >= (u1 - u0), cv = (v0 + v1) / 2;
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? .5 : i / (n - 1), uu = alongV ? cu : lerp(u0 + .25, u1 - .25, t), vv = alongV ? lerp(v0 + .25, v1 - .25, t) : cv;
    const base = gp(S, uu, vv, 0), top = gp(S, uu, vv, 160), sx = (lat(i, 4, S.seed) - .5) * 5;
    g.fillStyle = css([6, 4, 14], .28); g.beginPath(); g.ellipse(base[0] - 3, base[1] + 2, 10, 4, 0, 0, 7); g.fill();
    const gr = g.createLinearGradient(0, top[1], 0, base[1]); gr.addColorStop(0, 'rgba(60,44,30,0)'); gr.addColorStop(.35, 'rgba(196,164,110,.95)'); gr.addColorStop(1, 'rgba(196,164,110,1)');
    const sway = Math.sin(i * 2.1 + S.seed) * 5;
    const path = () => { g.beginPath(); g.moveTo(top[0], top[1]); g.quadraticCurveTo(top[0] + sway, (top[1] + base[1]) / 2, base[0] + sx, base[1] - 46); };
    g.lineCap = 'round'; path(); g.strokeStyle = css(INK, .8); g.lineWidth = 5; g.stroke(); path(); g.strokeStyle = gr; g.lineWidth = 3.4; g.stroke();
    path(); g.strokeStyle = css([90, 66, 40], .6); g.lineWidth = 1; g.setLineDash([2, 3]); g.stroke(); g.setLineDash([]);
    // woolly sally (striped) and loose tail
    const sa = [base[0] + sx * .8 + sway * .15, base[1] - 108], sb = [base[0] + sx, base[1] - 70];
    const cols = [[176, 40, 40], [236, 230, 210], [50, 76, 130]];
    for (let k = 0; k < 6; k++) { const y0 = sa[1] + k * (sb[1] - sa[1]) / 6; paintRect(g, sa[0] - 4.6, y0, 9.2, (sb[1] - sa[1]) / 6 + .8, cols[(k + i) % 3], r, { n: 3, ink: i === 0 && k === 0 ? true : false, ang: 0, ew: .5 }); }
    g.strokeStyle = css(INK, .85); g.lineWidth = 1.2; g.strokeRect(sa[0] - 4.6, sa[1], 9.2, sb[1] - sa[1]);
    g.strokeStyle = css(INK, .8); g.lineWidth = 4.2; g.beginPath(); g.moveTo(sb[0], sb[1]); g.quadraticCurveTo(sb[0] + 4, sb[1] + 16, sb[0] - 2 + sx, base[1] - 22); g.stroke(); g.strokeStyle = css([196, 164, 110]); g.lineWidth = 2.8; g.stroke();
    g.fillStyle = css([210, 180, 130]); g.beginPath(); g.arc(sb[0] - 2 + sx, base[1] - 21, 2.8, 0, 7); g.fill(); g.strokeStyle = css(INK, .8); g.lineWidth = .9; g.stroke();
  }
  // wooden rope-peg rail
  const a = gp(S, alongV ? cu : u0 + .1, alongV ? v0 + .05 : cv, 0);
};
WALLPROPS.railing = function (g, S, p, I) {
  const { r, u0, len, Y, v } = I, sk = S.mood.sky || SKY[S.bucket], zOpen = 40, zTop = 126;
  const wins = S.props.filter(q => q.t === 'window' && q.side === p.side).map(q => [wallStart(q) * 64 - 8, (wallStart(q) + wallLen(q)) * 64 + 8]).map(w => I.mir ? [u0 * 2 + len - w[1], u0 * 2 + len - w[0]] : w);
  const pierW = 20, slot = 86; let x = u0 + 4;
  // parapet stone course
  paintRect(g, u0, Y(zOpen), len, zOpen, [92, 90, 86], r, { n: len / 3, sw: 5, ang: 0, ink: true, inkw: 1.8, alt: [136, 134, 124], ew: 1.4 });
  for (let u = u0 + 36; u < u0 + len; u += 64) { g.strokeStyle = css([22, 22, 26], .6); g.lineWidth = 1.4; g.beginPath(); g.moveTo(u, Y(zOpen)); g.lineTo(u, Y(0)); g.stroke(); }
  paintRect(g, u0, Y(zOpen + 6), len, 8, [130, 126, 116], r, { n: len / 5, ang: 0, ink: true, ha: .9 });
  while (x < u0 + len - 40) {
    const x1 = Math.min(x + slot, u0 + len - 6), skip = wins.some(w => !(x1 < w[0] || x > w[1]));
    if (!skip && x1 - x > 40) {
      const aw = x1 - x, top = Y(zTop), bot = Y(zOpen + 6);
      g.save(); g.beginPath(); g.moveTo(x, bot); g.lineTo(x, top + aw / 2); g.arc(x + aw / 2, top + aw / 2, aw / 2, Math.PI, 0); g.lineTo(x1, bot); g.closePath(); g.clip();
      const gg = g.createLinearGradient(0, top, 0, bot); gg.addColorStop(0, css(sk[0])); gg.addColorStop(1, css(sk[1])); g.fillStyle = gg; g.fillRect(x, top, aw, bot - top);
      for (let i = 0; i < 18; i++) bristle(g, x + r() * aw, top + r() * (bot - top), .1 + r.g() * .15, 22, 5, mix(sk[0], sk[1], r()), .45, r);
      // the grey district: rooftops, chimneys, a few lit windows, the relay aerial
      g.fillStyle = css(mix(sk[0], [10, 14, 24], .72), .95);
      let bx = x - 4; while (bx < x1) { const bw = r.r(14, 30), bh = r.r(10, 34); g.fillRect(bx, bot - bh, bw, bh + 4); if (r() < .4) g.fillRect(bx + bw * .6, bot - bh - r.r(4, 10), 3, 12); bx += bw + r.r(0, 3); }
      g.fillStyle = css([255, 200, 110], .9); for (let i = 0; i < 5; i++) g.fillRect(x + r() * aw, bot - r.r(4, 20), 1.6, 1.8);
      g.strokeStyle = css(INK, .6); g.lineWidth = 1; g.beginPath(); g.moveTo(x + aw * .7, bot - 20); g.lineTo(x + aw * .7, bot - 50); g.stroke();
      g.strokeStyle = css([200, 215, 255], .22); g.lineWidth = 1; g.beginPath(); for (let i = 0; i < 10; i++) { const rx = x + r() * aw, ry = top + r() * (bot - top); g.moveTo(rx, ry); g.lineTo(rx - 3, ry + 11); } g.stroke();
      g.restore();
      g.save(); g.beginPath(); g.moveTo(x, bot); g.lineTo(x, top + aw / 2); g.arc(x + aw / 2, top + aw / 2, aw / 2, Math.PI, 0); g.lineTo(x1, bot); g.strokeStyle = css([120, 116, 108]); g.lineWidth = 6; g.stroke(); g.strokeStyle = css(INK, .85); g.lineWidth = 1.3; g.stroke(); g.restore();
    }
    // pier
    paintRect(g, x1, Y(zTop + 6), pierW, zTop + 6 - 4, [104, 100, 94], r, { n: 24, ang: 1.57, ink: true, inkw: 1.6, alt: [150, 146, 134], lit: [[200, 190, 170], [10, 12, 22], 0, .35, .5] });
    x = x1 + pierW;
  }
  // iron railing along the whole parapet
  const ry = Y(zOpen + 6);
  for (let u = u0 + 4; u < u0 + len; u += 12) { g.strokeStyle = css(INK, .9); g.lineWidth = 4; g.beginPath(); g.moveTo(u, ry); g.lineTo(u, ry - 30); g.stroke(); g.strokeStyle = css([52, 56, 62]); g.lineWidth = 2.4; g.stroke(); g.strokeStyle = css([255, 170, 90], .4); g.lineWidth = .8; g.beginPath(); g.moveTo(u + 1, ry - 2); g.lineTo(u + 1, ry - 28); g.stroke(); }
  g.strokeStyle = css(INK, .9); g.lineWidth = 6; g.beginPath(); g.moveTo(u0, ry - 31); g.lineTo(u0 + len, ry - 31); g.stroke(); g.strokeStyle = css([86, 90, 96]); g.lineWidth = 4; g.stroke(); g.strokeStyle = css([255, 200, 140], .5); g.lineWidth = 1; g.beginPath(); g.moveTo(u0, ry - 33); g.lineTo(u0 + len, ry - 33); g.stroke();
  g.strokeStyle = css([60, 64, 70]); g.lineWidth = 2.6; g.beginPath(); g.moveTo(u0, ry - 8); g.lineTo(u0 + len, ry - 8); g.stroke();
};
PROPS.spiral = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, N = 13, RT = .96, ang0 = -.4;
  contactShadow(g, S, cu - .9, cv - .9, cu + .9, cv + .9, 1);
  const stone = [176, 160, 128], iron = [34, 38, 44];
  const treads = [];
  for (let i = 0; i < N; i++) treads.push({ a: ang0 + i * .5, z: 10 + i * 9.4 });
  const drawTread = (t) => {
    const a0 = t.a - .26, a1 = t.a + .26, c0 = gp(S, cu, cv, t.z), pts = [c0];
    for (let k = 0; k <= 4; k++) { const a = lerp(a0, a1, k / 4); pts.push([c0[0] + Math.cos(a) * ecx(RT), c0[1] + Math.sin(a) * ecy(RT)]); }
    const down = pts.slice(1).map(q => [q[0], q[1] + 9]);
    paintPoly(g, [pts[1], pts[2], pts[3], pts[4], pts[5], down[4], down[3], down[2], down[1], down[0]], mul(stone, .55), r, { n: 8, ink: true, inkw: 1.1, ang: 1.57 });
    paintPoly(g, pts, jit(stone, r, .1), r, { n: 12, ink: true, inkw: 1.3, ang: a0 + 1.57, alt: [214, 200, 170], ha: .8, ew: 1 });
  };
  const far = treads.filter(t => Math.sin(t.a) < 0), near = treads.filter(t => Math.sin(t.a) >= 0);
  const cs = (t) => Math.sin(t.a);
  far.forEach(drawTread);
  vbar(g, S, r, cu, cv, 0, 124, 16, [92, 84, 74], { lit: [[255, 200, 140], [10, 12, 24], 0, .6, .5] });
  near.forEach(drawTread);
  // handrail helix with balusters
  const rail = []; for (let i = 0; i < N; i++) { const t = treads[i], c0 = gp(S, cu, cv, t.z + 30); rail.push([c0[0] + Math.cos(t.a) * ecx(RT - .04), c0[1] + Math.sin(t.a) * ecy(RT - .04), Math.sin(t.a)]); const c1 = gp(S, cu, cv, t.z); const x = c1[0] + Math.cos(t.a) * ecx(RT - .04), y = c1[1] + Math.sin(t.a) * ecy(RT - .04); g.strokeStyle = css(iron, .95); g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, y); g.lineTo(rail[i][0], rail[i][1]); g.stroke(); }
  g.strokeStyle = css(INK, .9); g.lineWidth = 4.4; g.beginPath(); rail.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.stroke(); g.strokeStyle = css([116, 100, 80]); g.lineWidth = 2.6; g.stroke(); g.strokeStyle = css([255, 200, 140], .5); g.lineWidth = .8; g.stroke();
  // dark opening above
  const top = gp(S, cu, cv, 150); const gr = g.createRadialGradient(top[0], top[1], 4, top[0], top[1], 46); gr.addColorStop(0, 'rgba(4,3,8,.95)'); gr.addColorStop(1, 'rgba(4,3,8,0)'); g.fillStyle = gr; g.fillRect(top[0] - 50, top[1] - 40, 100, 80);
  const q = gp(S, cu, cv, 0); g.fillStyle = css([255, 150, 70], .12); g.beginPath(); g.ellipse(q[0], q[1], 60, 28, 0, 0, 7); g.fill();
};

/* ============================================================ CHARACTERS
 * Painted figures. A small 3D skeleton (body space in cm: a = character's right, y = up, f = forward) is posed,
 * projected with the facing yaw (no sprite mirroring, so the warm key light always comes from screen-right) and
 * painted part by part, depth-sorted: sculpted gradients (cool reflected light -> core shadow -> warm key), form-following
 * brush strokes, cloth folds/seams/collars/buttons, faces and hair with strands; then a shared brush texture, ground
 * occlusion, warm rim + cool fill rim and a dark ink contour over the whole silhouette.
 * Contract (unchanged): getFigure/figureNow -> {c,w,h,ax,ay,hang?}, drawn at the feet point as
 * drawImage(c, -ax/SS, -ay/SS, w/SS, h/SS). Optional extra: spr.sh = {c,ax,ay,w,h} soft painted ground shadow (same units).
 */
const SS = 2, SC = 1.22, K = SS * SC;      // SS: sprite supersample (canvas px per world px). K kept for the scene's hover ring
const CH_PX = 0.68;                        // world px per body cm: adult ~120 px, teen ~113 px (~1.3x the old figures; kept just above door height)
const CH_DK = 0.5;                         // iso foreshortening of depth (2:1 floor)
const CH_LX = .8, CH_LY = -.6;             // key light direction (screen space, towards the light)
const DEF_LOOK = { skin: '#d9a98a', hair: '#2a1d18', hairStyle: 'short', outfit: 'uniform', outfitColor: '#3f4d5c', accent: '#c9892f', build: 'avg', glasses: false, age: 'adult', pose: 'stand', extra: 'none' };
const FACE = { s: 0, se: 45, e: 90, ne: 135, n: 180, nw: -135, w: -90, sw: -45 };
const FACE_ALIAS = { south: 's', north: 'n', east: 'e', west: 'w' };
const _spr = new Map();

function normLook(look) { return Object.assign({}, DEF_LOOK, look || {}); }
function lookKey(l) { return [l.skin, l.hair, l.hairStyle, l.outfit, l.outfitColor, l.accent, l.build, l.glasses ? 1 : 0, l.age, l.extra].join('|'); }

/* ---------------------------------------------------------------- identity (signature details per NPC) */
const ch_ids = new WeakMap();
function ch_idOf(look) {
  if (!look || typeof look !== 'object') return '';
  if (look._id) return look._id;
  let id = ch_ids.get(look); if (id !== undefined) return id;
  id = '';
  try { const gd = typeof window !== 'undefined' && window.GD; if (gd && gd.npcs) for (const k in gd.npcs) if (gd.npcs[k] && gd.npcs[k].look === look) { id = k; break; } if (!id && gd && gd.playerLook === look) id = 'player'; } catch (e) { /* ignore */ }
  ch_ids.set(look, id); return id;
}

/* ---------------------------------------------------------------- small vector kit (3D arrays) */
const v3 = (a, y, f) => [a, y, f];
const vAdd = (p, q) => [p[0] + q[0], p[1] + q[1], p[2] + q[2]];
const vSub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
const vMul = (p, k) => [p[0] * k, p[1] * k, p[2] * k];
const vDot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
const vLen = (p) => Math.hypot(p[0], p[1], p[2]);
const vNorm = (p) => { const l = vLen(p) || 1; return [p[0] / l, p[1] / l, p[2] / l]; };
const vCross = (p, q) => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
const vLerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
function ch_ik(A, T, L1, L2, hint) {
  let d = vSub(T, A), dist = vLen(d); const mx = (L1 + L2) * .995, mn = Math.abs(L1 - L2) + .5;
  if (dist > mx) { d = vMul(d, mx / dist); dist = mx; T = vAdd(A, d); } else if (dist < mn) { d = vMul(vNorm(d), mn); dist = mn; T = vAdd(A, d); }
  const u = vMul(d, 1 / dist), x = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist), h = Math.sqrt(Math.max(0, L1 * L1 - x * x));
  let n = vSub(hint, vMul(u, vDot(hint, u))); if (vLen(n) < 1e-3) n = [0, 0, 1]; n = vNorm(n);
  return [vAdd(vAdd(A, vMul(u, x)), vMul(n, h)), T];
}

/* ---------------------------------------------------------------- paint kit */
const ch_tc = new Map();
function ch_tones(c) {
  c = C(c); const k = (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0); let t = ch_tc.get(k); if (t) return t;
  const sh = mix(mul(c, .38), [28, 38, 72], .32), lt = mix(mul(c, 1.24), [255, 206, 150], .3);
  t = { base: c, sh, core: mix(sh, [12, 10, 22], .28), ref: mix(sh, [84, 124, 138], .3), mid: mix(c, sh, .3), lt, hi: mix(lt, [255, 240, 214], .4) };
  ch_tc.set(k, t); return t;
}
function ch_tone(c, t) { const T = ch_tones(c); return t < .5 ? mix(T.sh, T.base, t * 2) : mix(T.base, T.lt, (t - .5) * 2); }
function ch_grad(g, x0, y0, x1, y1, c) {   // (x0,y0) = shadow side, (x1,y1) = lit side
  const T = ch_tones(c), gr = g.createLinearGradient(x0, y0, x1, y1);
  gr.addColorStop(0, css(T.ref)); gr.addColorStop(.17, css(T.core)); gr.addColorStop(.4, css(T.mid)); gr.addColorStop(.62, css(T.base)); gr.addColorStop(.87, css(T.lt)); gr.addColorStop(1, css(mix(T.lt, T.base, .35)));
  return gr;
}
function ch_path(g, P) {   // smooth closed path through polygon midpoints
  const n = P.length; if (n < 3) return; g.beginPath(); const a = P[n - 1], b = P[0];
  g.moveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
  for (let i = 0; i < n; i++) { const p = P[i], q = P[(i + 1) % n]; g.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
  g.closePath();
}
function ch_poly(g, P) { g.beginPath(); g.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) g.lineTo(P[i][0], P[i][1]); g.closePath(); }
function ch_curve(g, P) {  // smooth open polyline
  g.beginPath(); g.moveTo(P[0][0], P[0][1]);
  if (P.length === 2) { g.lineTo(P[1][0], P[1][1]); return; }
  for (let i = 1; i < P.length - 1; i++) { const p = P[i], q = P[i + 1]; g.quadraticCurveTo(p[0], p[1], i === P.length - 2 ? q[0] : (p[0] + q[0]) / 2, i === P.length - 2 ? q[1] : (p[1] + q[1]) / 2); }
}
function ch_bb(P) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of P) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; } return [x0, y0, x1, y1]; }
function ch_hull(P) {
  const pts = P.map(p => [p[0], p[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]); if (pts.length < 3) return pts;
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  up.pop(); lo.pop(); return lo.concat(up);
}
/* shaded fill of a polygon: gradient across (perpendicular to `ax` direction, oriented to the light) + brush strokes */
function ch_fill(g, r, P, col, o) {
  o = o || {};
  const bb = ch_bb(P), cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2, w = bb[2] - bb[0], h = bb[3] - bb[1];
  let ax = o.ax || [0, 1]; const al = Math.hypot(ax[0], ax[1]) || 1; ax = [ax[0] / al, ax[1] / al];
  let nx = -ax[1], ny = ax[0]; if (nx * CH_LX + ny * CH_LY < 0) { nx = -nx; ny = -ny; }
  const R = (Math.abs(nx) * w + Math.abs(ny) * h) * .5 + .5, sx = o.sx || 0;
  const gx0 = cx - nx * R + sx, gy0 = cy - ny * R, gx1 = cx + nx * R + sx, gy1 = cy + ny * R;
  g.save(); (o.sharp ? ch_poly : ch_path)(g, P);
  g.fillStyle = ch_grad(g, gx0, gy0, gx1, gy1, col); g.fill();
  if (o.flat) { g.globalAlpha = o.flat; g.fillStyle = css(C(col)); g.fill(); g.globalAlpha = 1; }
  g.clip();
  if (o.top !== undefined) {   // vertical light falloff / occlusion
    const vg = g.createLinearGradient(0, bb[1], 0, bb[3]); vg.addColorStop(0, o.top > 0 ? 'rgba(255,226,180,' + o.top + ')' : 'rgba(0,0,0,0)'); vg.addColorStop(.5, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(14,14,34,' + (o.bot || 0) + ')');
    g.fillStyle = vg; g.fillRect(bb[0] - 1, bb[1] - 1, w + 2, h + 2);
  }
  const n = o.n === undefined ? Math.min(40, Math.max(3, (w * h) / 40)) : o.n, sw = o.sw || 1.4, sl = o.sl || Math.max(3, Math.min(w, h) * .9), jv = o.jv === undefined ? .07 : o.jv;
  const dl = (gx1 - gx0) * (gx1 - gx0) + (gy1 - gy0) * (gy1 - gy0) || 1;
  g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = bb[0] + r() * w, y = bb[1] + r() * h, t = clamp(((x - gx0) * (gx1 - gx0) + (y - gy0) * (gy1 - gy0)) / dl, 0, 1);
    const a = Math.atan2(ax[1], ax[0]) + (r() - .5) * .5, L = sl * (.4 + r() * .7), dx = Math.cos(a) * L * .5, dy = Math.sin(a) * L * .5;
    let cc = ch_tone(col, clamp(t * 1.05 - .02 + (r() - .5) * .16, 0, 1)); cc = jit(cc, r, jv);
    g.strokeStyle = css(cc, .22 + r() * .3); g.lineWidth = sw * (.6 + r() * .8);
    g.beginPath(); g.moveTo(x - dx, y - dy); g.quadraticCurveTo(x + (r() - .5) * L * .3, y + (r() - .5) * L * .3, x + dx, y + dy); g.stroke();
  }
  if (o.fx) o.fx(g);
  g.restore();
  if (o.ink !== false) { (o.sharp ? ch_poly : ch_path)(g, P); g.strokeStyle = css(o.inkc || INK, o.inka === undefined ? .62 : o.inka); g.lineWidth = o.inkw || .55; g.lineJoin = 'round'; g.stroke(); }
}
function ch_limbOutline(P, R) {
  const n = P.length, Lf = [], Rt = [], dirs = [];
  for (let i = 0; i < n; i++) {
    let dx, dy;
    if (i === 0) { dx = P[1][0] - P[0][0]; dy = P[1][1] - P[0][1]; }
    else if (i === n - 1) { dx = P[i][0] - P[i - 1][0]; dy = P[i][1] - P[i - 1][1]; }
    else { const l1 = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]) || 1, l2 = Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]) || 1; dx = (P[i][0] - P[i - 1][0]) / l1 + (P[i + 1][0] - P[i][0]) / l2; dy = (P[i][1] - P[i - 1][1]) / l1 + (P[i + 1][1] - P[i][1]) / l2; }
    const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; dirs.push([dx, dy]);
    Lf.push([P[i][0] - dy * R[i], P[i][1] + dx * R[i]]); Rt.push([P[i][0] + dy * R[i], P[i][1] - dx * R[i]]);
  }
  const out = Lf.slice(), e = P[n - 1], de = dirs[n - 1], re = R[n - 1];
  for (let k = 1; k < 5; k++) { const t = k / 5 * Math.PI, c = Math.cos(t), s = Math.sin(t); out.push([e[0] + (-de[1] * c + de[0] * s) * re, e[1] + (de[0] * c + de[1] * s) * re]); }
  for (let i = n - 1; i >= 0; i--) out.push(Rt[i]);
  const b = P[0], db = dirs[0], rb = R[0];
  for (let k = 1; k < 5; k++) { const t = k / 5 * Math.PI, c = Math.cos(t), s = Math.sin(t); out.push([b[0] + (db[1] * c - db[0] * s) * rb, b[1] + (-db[0] * c - db[1] * s) * rb]); }
  return out;
}
function ch_limb(g, r, P, R, col, o) {
  const out = ch_limbOutline(P, R), a = P[0], b = P[P.length - 1];
  ch_fill(g, r, out, col, Object.assign({ ax: [b[0] - a[0], b[1] - a[1]], n: Math.round(4 + P.length * 3), sw: 1.2 }, o));
  return out;
}
/* a cloth fold / crease: dark groove + light ridge towards the light */
function ch_fold(g, P, w, col, a) {
  a = a === undefined ? 1 : a; g.lineCap = 'round';
  ch_curve(g, P); g.strokeStyle = css(ch_tones(col).core, .5 * a); g.lineWidth = w; g.stroke();
  g.save(); g.translate(CH_LX * w * .7, CH_LY * w * .7); ch_curve(g, P); g.strokeStyle = css(ch_tones(col).lt, .38 * a); g.lineWidth = w * .55; g.stroke(); g.restore();
}
function ch_dot(g, x, y, rad, col, a) { g.fillStyle = css(col, a === undefined ? 1 : a); g.beginPath(); g.arc(x, y, rad, 0, 6.2832); g.fill(); }
function ch_stroke(g, P, w, col, a) { g.lineCap = 'round'; g.lineJoin = 'round'; ch_curve(g, P); g.strokeStyle = css(col, a === undefined ? 1 : a); g.lineWidth = w; g.stroke(); }
function ch_button(g, x, y, rad, col) { const T = ch_tones(col); ch_dot(g, x, y, rad * 1.25, T.core, .7); ch_dot(g, x, y, rad, T.base); ch_dot(g, x + rad * .35, y - rad * .35, rad * .4, T.hi, .9); }

/* shared brush texture (light/dark strokes, applied source-atop) */
let ch_texC = null;
function ch_tex() {
  if (ch_texC) return ch_texC;
  const c = mk(160, 160), g = ctx2(c), r = RNG(4242); g.lineCap = 'round';
  for (let i = 0; i < 520; i++) {
    const x = r() * 160, y = r() * 160, a = 1.35 + (r() - .5) * .9, L = 3 + r() * 9, lt = r() < .5;
    g.strokeStyle = lt ? 'rgba(255,236,200,' + (.025 + r() * .06) + ')' : 'rgba(10,8,24,' + (.03 + r() * .08) + ')'; g.lineWidth = .8 + r() * 2.2;
    for (const ox of [-160, 0, 160]) for (const oy of [-160, 0, 160]) { if (Math.abs(x + ox - 80) > 100 || Math.abs(y + oy - 80) > 100) continue; g.beginPath(); g.moveTo(x + ox - Math.cos(a) * L / 2, y + oy - Math.sin(a) * L / 2); g.lineTo(x + ox + Math.cos(a) * L / 2, y + oy + Math.sin(a) * L / 2); g.stroke(); }
  }
  return (ch_texC = c);
}

/* ---------------------------------------------------------------- body proportions */
function ch_body(L) {
  const hs = L.hairStyle || 'short', fem = L.fem !== undefined ? !!L.fem : /^(bun|bob|braid|long)$/.test(hs);
  const teen = L.age === 'teen', old = L.age === 'old', b = L.build === 'heavy' ? 2 : L.build === 'slim' ? 0 : 1;
  const W3 = (s, m, h) => b === 0 ? s : b === 1 ? m : h;
  const H = (fem ? 166 : 177) * (teen ? .955 : old ? .975 : 1), headH = H / (teen ? 7.0 : old ? 7.3 : 7.5);
  const tf = teen ? .93 : 1, ff = fem ? .9 : 1;
  const B = {
    H, headH, fem, teen, old, b,
    hipY: H * .52, ankY: H * .045, neckY: H - headH - H * .022,
    thighL: H * .245, shinL: H * .232, upL: H * .172, foreL: H * .152, handL: H * .1, footL: H * .148,
    hipJ: H * .05 * W3(.92, 1, 1.15) * (fem ? 1.06 : 1),
    shW: H * (fem ? .102 : .116) * W3(.95, 1, 1.08) * tf,
    chestW: H * (fem ? .086 : .097) * W3(.9, 1, 1.22) * tf, chestD: H * (fem ? .066 : .062) * W3(.88, 1, 1.32),
    waistW: H * (fem ? .072 : .084) * W3(.9, 1, 1.45) * tf, waistD: H * .054 * W3(.9, 1, 1.62), belly: W3(0, .003, .03) * H,
    hipW: H * (fem ? .1 : .089) * W3(.9, 1, 1.25) * tf, hipD: H * .06 * W3(.92, 1, 1.28),
    rThigh: H * .048 * W3(.86, 1, 1.3), rKnee: H * .029 * W3(.9, 1, 1.15), rCalf: H * .032 * W3(.86, 1, 1.22), rAnk: H * .019,
    rUp: H * .029 * W3(.86, 1, 1.32) * ff, rElb: H * .022 * W3(.9, 1, 1.2) * ff, rFore: H * .024 * W3(.88, 1, 1.25) * ff, rWr: H * .016 * ff,
    rNeck: H * .03 * W3(.9, 1, 1.28) * ff
  };
  B.shY = B.neckY - H * .03; B.hs = B.shY - B.hipY;
  return B;
}

/* ---------------------------------------------------------------- outfit palette */
function ch_outfit(L, B, id) {
  const o = L.outfit || 'uniform', oc = C(L.outfitColor), ac = C(L.accent), fem = B.fem;
  const darkTr = [44, 42, 46], tweed = [64, 58, 54];
  const P = { o, top: oc, sleeve: oc, pants: mul(oc, .7), shirt: [218, 212, 196], shoe: [32, 26, 26], shoeHi: .7, skirt: null, skirtH: 0, hem: -.03, long: 0, rolled: false, cuff: null, sock: null };
  if (o === 'uniform') { P.pants = mix(mul(oc, .72), [30, 30, 40], .2); P.cuff = P.shirt; if (fem && B.teen) { P.skirt = P.pants; P.skirtH = .29; P.pleats = true; P.sock = [40, 38, 44]; } }
  else if (o === 'coat') { P.pants = darkTr; P.long = .2; P.shirt = mix(ac, [60, 56, 54], .4); P.cuff = null; }
  else if (o === 'apron') { P.top = mix(mul(ac, .7), [70, 60, 60], .35); P.sleeve = P.top; P.pants = P.top; P.skirt = P.top; P.skirtH = .17; P.rolled = true; P.apron = oc; P.shoe = [40, 32, 30]; P.sock = mul(C(L.skin), .78); }
  else if (o === 'overalls') { P.top = mix(oc, [190, 170, 140], .55); P.sleeve = P.top; P.pants = oc; P.bib = oc; P.rolled = true; P.shirt = P.top; P.shoe = [58, 40, 30]; P.boot = true; }
  else if (o === 'suit') { P.pants = mul(oc, .92); P.cuff = P.shirt; if (fem) { P.skirt = P.pants; P.skirtH = .25; P.sock = mix(C(L.skin), [60, 50, 50], .35); } }
  else if (o === 'tracksuit') { P.pants = mul(oc, .9); P.shoe = [214, 210, 200]; P.shoeHi = .9; P.trainer = true; P.stripe = ac; P.hem = .0; }
  else if (o === 'cardigan') { P.shirt = mix(ac, [228, 220, 200], .78); P.pants = tweed; P.hem = -.045; P.knit = true; P.shoe = [62, 44, 34]; if (fem) { P.skirt = mix(oc, [50, 50, 56], .55); P.skirtH = B.old ? .17 : .25; P.sock = mix(C(L.skin), [70, 60, 60], .45); } }
  else if (o === 'labcoat') { P.long = .3; P.pants = darkTr; P.shirt = [150, 160, 168]; P.shoe = [58, 42, 32]; if (fem) { P.skirt = [70, 64, 70]; P.skirtH = .2; P.sock = mix(C(L.skin), [60, 50, 50], .4); P.pants = P.skirt; } }
  else if (o === 'shirtsleeves') { P.shirt = oc; P.pants = [52, 48, 50]; P.rolled = true; P.braces = ac; P.hem = .085; }
  return P;
}

/* ---------------------------------------------------------------- arm / hand configuration */
function ch_armPlan(L, B, id, pose, walk, idleB, hsh) {
  const ex = L.extra || 'none';
  const sigs = { fenwick: 'clasp', lemmy: 'behind', rhea: 'crossed', gregor: 'behind', hob: 'clasp', brune: 'hipL', tomas: 'lap', wren: 'relax', player: 'relax', vasha: 'smoke', nadia: 'smoke', dov: 'smokeLow', anka: 'smokeSit' };
  let plan = sigs[id] || ['relax', 'relax', 'pockets', 'behind', 'relax', 'crossed'][hsh % 6];
  if (L.outfit === 'apron' && plan === 'pockets') plan = 'hipL';
  if (ex === 'cigarette') plan = pose === 'sit' || pose === 'wheelchair' ? 'smokeSit' : (id === 'dov' ? 'smokeLow' : 'smoke');
  else if (ex === 'clipboard') plan = pose === 'sit' || pose === 'wheelchair' ? 'clipLap' : 'clipChest';
  else if (ex === 'book') plan = pose === 'sit' || pose === 'wheelchair' ? 'bookLap' : 'bookChest';
  else if (ex === 'broom') plan = pose === 'lean' ? 'broomLean' : 'broom';
  else if (ex === 'ladle') plan = 'ladle';
  else if (ex === 'mic') plan = 'mic';
  else if (ex === 'megaphone') plan = 'mega';
  else if (ex === 'rope') plan = 'rope';
  else if (pose === 'sit' || pose === 'wheelchair') plan = 'lap';
  if (pose === 'hang' || pose === 'lie') plan = pose;
  if (pose === 'slump' && /^(relax|pockets|crossed|clasp|hipL)$/.test(plan)) plan = 'slump';
  if (walk) {   // carried items keep their hold; free arms swing
    if (/^(relax|pockets|behind|crossed|clasp|hipL|lap|slump|smokeLow|smokeSit)$/.test(plan)) plan = 'swing';
    else if (plan === 'smoke') plan = 'swingSmoke';
    else if (plan === 'broomLean') plan = 'broom';
  }
  if (idleB && plan === 'relax') plan = 'relaxB';
  return plan;
}

/* ---------------------------------------------------------------- the model */
function ch_model(L, id, yawDeg, pose, frame, idleB) {
  const B = ch_body(L), H = B.H, OF = ch_outfit(L, B, id), hsh = hashStr(lookKey(L) + id);
  const walk = frame > 0 && (pose === 'stand' || pose === 'lean' || pose === 'slump');
  if (walk) pose = 'stand';
  const sit = pose === 'sit' || pose === 'wheelchair', wheel = pose === 'wheelchair', hang = pose === 'hang', lean = pose === 'lean', slump = pose === 'slump', lie = pose === 'lie';
  const yaw = yawDeg * Math.PI / 180, sy = Math.sin(yaw), cy = Math.cos(yaw);
  const ws = (hsh & 1) ? 1 : -1;            // weight-bearing side
  const ph = walk ? (frame - 1) * Math.PI / 2 : 0;
  // ---- pelvis & spine
  let pel = [0, B.hipY - .8, 0], pitch = 0, stoop = 0, twist = 0, roll = 0, headTurn = 0, headPitch = 0, headRoll = 0, lift = 0;
  const stride = H * (B.old ? .11 : .145);
  if (B.old) { stoop = .22; headPitch = -.16; pel[1] -= 1.2; }
  if (walk) {
    pel = [1.5 * Math.sin(ph), B.hipY - 1.4 - H * .024 * Math.cos(ph) * Math.cos(ph), 0];
    pitch = .05; twist = -.16 * Math.cos(ph);
  } else if (sit) {
    const seat = H * (wheel ? .285 : .265); pel = [0, seat + H * .05, -3]; pitch = -.05;
    if (/^(book|clip)/.test(L.extra || '') || L.extra === 'book' || L.extra === 'clipboard') { pitch = .1; headPitch = .3; }
  } else if (lean) { pel = [ws * 1.2, B.hipY - 1.8, 5]; pitch = -.13; headPitch += .1; }
  else if (slump) { pel = [0, B.hipY - 2.2, 0]; pitch = .2; stoop += .25; headPitch = .55; }
  else if (hang) { lift = 34; pel = [0, B.hipY + lift, 0]; pitch = .03; headPitch = .5; headRoll = .38; roll = .05; }
  else { pel = [ws * 1.6, B.hipY - .9, 0]; roll = -ws * .025; }
  if (idleB && !walk && !hang) { headTurn = (hsh & 2 ? .2 : -.2); pel[0] -= ws * .8; }
  if (lie) { headRoll = .22; }
  // upper-body transform (relative to pelvis: [lat, h, fwd])
  const hs = B.hs;
  const ub = (p) => {
    const t = twist * clamp(p[1] / hs, 0, 1.2), ct = Math.cos(t), st = Math.sin(t);
    let a = p[0] * ct + p[2] * st, f = -p[0] * st + p[2] * ct, h = p[1];
    const ang = pitch + stoop * Math.pow(clamp(h / hs, 0, 1.3), 1.6), ca = Math.cos(ang), sa = Math.sin(ang);
    const y = h * ca - f * sa; f = h * sa + f * ca; a += h * Math.sin(roll);
    return [pel[0] + a, pel[1] + y, pel[2] + f];
  };
  // ---- legs
  const legs = [];
  for (const s of [1, -1]) {
    const hip = [pel[0] + s * B.hipJ, pel[1] - 1, pel[2]];
    let ank, footDir = [s * .12, 0, 1], fp = 0, hint = [s * .08, 0, 1];
    if (walk) {
      const fpos = s * stride * Math.cos(ph), lft = Math.max(0, -s * Math.sin(ph));
      fp = fpos > stride * .5 ? .22 : fpos < -stride * .5 ? -.38 : lft > .5 ? -.25 : 0;
      ank = [s * (B.hipJ - .5), B.ankY + lft * H * .075 + (fp < 0 ? B.footL * .22 : 0), fpos + (lft > .5 ? 2 : 0)];
    } else if (sit) {
      const knee = [s * (B.hipJ + 1.2), pel[1] + .5, pel[2] + B.thighL * .97];
      ank = wheel ? [s * (B.hipJ + .5), H * .085, knee[2] + 5] : [s * (B.hipJ + 1.6), B.ankY, knee[2] + 4 + (s === ws ? 5 : 0)];
      legs.push({ s, hip, knee, ank, footDir, fp: wheel ? .1 : 0 }); continue;
    } else if (lean) {
      ank = s === ws ? [s * (B.hipJ - .5), B.ankY, 10] : [ws * (B.hipJ + .5), B.ankY + 1.2, 17]; if (s !== ws) { fp = -.55; footDir = [-s * .25, 0, 1]; }
    } else if (hang) { ank = [s * (B.hipJ - 1.8), B.ankY + lift + 2, 2]; fp = -1.15; hint = [0, 0, 1]; }
    else if (slump) { ank = [s * (B.hipJ + 1.5), B.ankY, 3]; }
    else if (lie) { ank = [s * (B.hipJ + 3.5), B.ankY, 0]; fp = 0; }
    else { ank = s === ws ? [s * (B.hipJ - 1), B.ankY, 0] : [s * (B.hipJ + 3.5), B.ankY + .4, 7]; if (B.old) ank[2] += 3; }
    const kj = ch_ik(hip, ank, B.thighL, B.shinL, hint);
    legs.push({ s, hip, knee: kj[0], ank: kj[1], footDir: vNorm(footDir), fp });
  }
  // ---- shoulders, neck, head
  const shoulder = (s) => ub([s * B.shW, hs, B.old || slump ? 1.5 : 0]);
  const neckB = ub([0, B.neckY - B.hipY, -1.2]);
  const headC0 = ub([0, B.neckY - B.hipY + B.headH * .56, 1.2]);
  const headPitchT = headPitch + pitch + stoop * .9 - (B.old ? .08 : 0);
  const head = { c: headC0, yaw: yaw + headTurn + twist, pitch: headPitch, roll: headRoll + roll, hh: B.headH * .5, hw: B.headH * .37 * (B.teen ? 1.02 : 1) * (B.b === 2 ? 1.06 : 1), hd: B.headH * .44 };
  // head pushed forward by stoop/slump
  if (B.old || slump) head.c = [head.c[0], head.c[1] - (slump ? 4 : 1.5), head.c[2] + (slump ? 4 : 2.5)];
  // ---- arms
  const plan = ch_armPlan(L, B, id, pose, walk, idleB, hsh);
  const arms = {}, chestF = B.chestD + B.belly * .3;
  const shY = pel[1] + hs, hipY = pel[1];
  const A = (s, t, hint, hand, o) => { arms[s] = Object.assign({ t, hint, hand: hand || 'open' }, o || {}); };
  const relax = (s, k) => A(s, [pel[0] + s * (B.hipW + 3.6 + (k || 0)), hipY - H * .025, 3.5 + (B.old ? 3 : 0)], [s * .3, 0, -1], 'open');
  const swing = (s, amt) => { const sh = shoulder(s), Lr = (B.upL + B.foreL) * (amt > 0 ? .9 : .97), an = amt * .5; A(s, [sh[0] + s * 3.5, sh[1] - Lr * Math.cos(an), sh[2] + Lr * Math.sin(an) + 3], [s * .2, 0, -1], 'open'); };
  const swingAmt = (s) => -s * Math.cos(ph);
  let item = null;
  switch (plan) {
    case 'swing': swing(1, swingAmt(1)); swing(-1, swingAmt(-1)); break;
    case 'swingSmoke': swing(-1, swingAmt(-1)); A(1, [pel[0] + B.hipW + 1, hipY + H * .02, 12], [1, 0, -.5], 'pinch'); item = 'cig'; break;
    case 'relax': relax(1); relax(-1); break;
    case 'relaxB': relax(1, -1.5); A(-1, [pel[0] - B.hipW - 2, hipY - H * .01, 6], [-.3, 0, -1], 'open'); break;
    case 'pockets': for (const s of [1, -1]) A(s, [pel[0] + s * B.hipW * .82, hipY - H * .012, B.hipD * .55], [s * 1, 0, -.7], 'hidden'); break;
    case 'behind': for (const s of [1, -1]) A(s, [pel[0] + s * 3, hipY + H * .015, -B.hipD - 5], [s * .7, 0, -1], 'open'); break;
    case 'crossed': A(1, [-B.shW * .62, shY - H * .135, chestF + 6.5], [1, -.4, .1], 'fist', { bias: .8 }); A(-1, [B.shW * .6, shY - H * .118, chestF + 4], [-1, -.4, .1], 'fist'); break;
    case 'clasp': for (const s of [1, -1]) A(s, [pel[0] + s * 1.5, hipY - H * .02, B.hipD + 5], [s * .6, 0, -.6], s > 0 ? 'fist' : 'open', { bias: s > 0 ? .6 : 0 }); break;
    case 'hipL': relax(1); A(-1, [pel[0] - B.waistW - 2, hipY + H * .085, -1], [-1, .25, -.6], 'fist'); break;
    case 'lap': for (const s of [1, -1]) A(s, [pel[0] + s * (B.hipW * .55), pel[1] + H * .06, pel[2] + B.thighL * .6], [s * .5, 0, -1], 'open'); break;
    case 'slump': for (const s of [1, -1]) A(s, [pel[0] + s * (B.shW - 2), hipY - H * .01, 13], [s * .3, 0, -1], 'open'); break;
    case 'hang': for (const s of [1, -1]) { const sh = shoulder(s); A(s, [sh[0] + s * 1.5, sh[1] - (B.upL + B.foreL) * .98, sh[2] + 2], [s * .2, 0, -1], 'open'); } break;
    case 'lie': for (const s of [1, -1]) A(s, [pel[0] + s * (B.hipW + 11), hipY - H * .02, 0], [s * .5, 0, -1], 'open'); break;
    case 'smoke': {   // classic smoker: right hand raised by the mouth, left forearm across under the elbow
      const hc = head.c; A(1, [hc[0] + B.headH * .95, hc[1] - B.headH * .72, hc[2] + B.headH * .3], [1, -1, .1], 'pinch', { up: 1, bias: 1 });
      A(-1, [pel[0] + B.shW * .35, shY - H * .145, chestF + 4.5], [-1, -.5, .1], 'fist'); item = 'cig'; break; }
    case 'smokeLow': relax(-1); A(-1, [pel[0] - B.hipW * .82, hipY - H * .012, B.hipD * .55], [-1, 0, -.7], 'hidden'); A(1, [pel[0] + B.hipW + 3, hipY - H * .015, 7], [1, 0, -1], 'pinch'); item = 'cig'; break;
    case 'smokeSit': A(1, [pel[0] + B.shW * .75, shY - H * .03, pel[2] + 16], [1, -1, -.2], 'pinch', { up: 1, bias: 1 }); A(-1, [pel[0] - B.hipW * .5, pel[1] + H * .06, pel[2] + B.thighL * .62], [-.5, 0, -1], 'open'); item = 'cig'; break;
    case 'clipChest': A(-1, [pel[0] - 2, shY - H * .175, chestF + 6], [-1, -.4, -.2], 'open', { bias: 1.2 }); A(1, [pel[0] + 4, shY - H * .15, chestF + 11], [1, -.5, -.2], 'pinch', { bias: 1.6 }); item = 'clip'; break;
    case 'clipLap': case 'bookLap': for (const s of [1, -1]) A(s, [pel[0] + s * 7, pel[1] + H * .085, pel[2] + B.thighL * .62], [s * .6, 0, -1], 'open', { bias: 1.5 }); item = plan === 'clipLap' ? 'clipLap' : 'bookLap'; break;
    case 'bookChest': A(-1, [pel[0] - 1, shY - H * .16, chestF + 5.5], [-1, -.4, -.1], 'open', { bias: 1.4 }); A(1, [pel[0] + B.shW * .45, shY - H * .2, chestF + 6], [1, -.3, -.2], 'fist', { bias: .3 }); item = 'book'; break;
    case 'broom': A(1, [pel[0] + B.shW * .55, shY - H * .07, 13], [1, 0, -.8], 'fist', { bias: .8 }); A(-1, [pel[0] + B.shW * .25, hipY + H * .075, 15], [-1, 0, -.6], 'fist', { bias: 1.2 }); item = 'broom'; break;
    case 'broomLean': A(1, [pel[0] + 3, shY - H * .1, 24], [1, -.2, -.5], 'fist', { bias: 1.4 }); A(-1, [pel[0] + 1, shY - H * .085, 24], [-1, -.2, -.5], 'fist', { bias: 1.6 }); item = 'broomLean'; break;
    case 'ladle': A(1, [pel[0] + B.shW + 3, shY - H * .1, 11], [1, -.6, -.5], 'fist', { bias: 1 }); A(-1, [pel[0] - B.waistW - 2, hipY + H * .085, -1], [-1, .25, -.6], 'fist'); item = 'ladle'; break;
    case 'mic': A(1, [pel[0] + 5, shY - H * .05, chestF + 12], [1, -.5, -.3], 'fist', { bias: 1.4 }); relax(-1); item = 'mic'; break;
    case 'mega': A(1, [pel[0] + B.hipW + 4.5, hipY - H * .005, 6], [1, 0, -1], 'fist'); A(-1, [pel[0] - B.waistW - 2, hipY + H * .085, -1], [-1, .25, -.6], 'fist'); item = 'mega'; break;
    case 'rope': A(1, [pel[0] + B.hipW + 4, hipY - H * .01, 5], [1, 0, -1], 'fist'); relax(-1); item = 'rope'; break;
    default: relax(1); relax(-1);
  }
  const armJ = {};
  for (const s of [1, -1]) {
    const sh = shoulder(s), a = arms[s];
    const j = ch_ik(sh, a.t, B.upL, B.foreL, a.hint);
    armJ[s] = Object.assign({ s, sh, el: j[0], wr: j[1] }, a);
  }
  return { B, OF, L, id, yaw, sy, cy, pose, walk, sit, wheel, hang, lean, slump, lie, pel, ub, legs, armJ, head, neckB, plan, item, hsh, ws, lift, ph, frame };
}

/* ---------------------------------------------------------------- rendering */
function ch_render(L, id, yawDeg, pose, frame, idleB) {
  const M = ch_model(L, id, yawDeg, pose, frame, idleB);
  const { B, OF, yaw, pel, ub } = M, H = B.H, skin = C(L.skin), hairC = C(L.hair), accC = C(L.accent);
  const sY = Math.sin(yaw), cY = Math.cos(yaw);
  const V = (yw) => { const s = Math.sin(yw), c = Math.cos(yw); return { Rx: -c, Rd: s, Fx: s, Fd: c }; };
  const V0 = V(yaw);
  const P = (p, vv) => { vv = vv || V0; const d = p[0] * vv.Rd + p[2] * vv.Fd; return [p[0] * vv.Rx + p[2] * vv.Fx, -p[1] + d * CH_DK, d]; };
  const parts = [], post = [];
  let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
  const ext = (q, rad) => { rad = rad || 0; if (q[0] - rad < bx0) bx0 = q[0] - rad; if (q[0] + rad > bx1) bx1 = q[0] + rad; if (q[1] - rad < by0) by0 = q[1] - rad; if (q[1] + rad > by1) by1 = q[1] + rad; return q; };
  const PE = (p, rad, vv) => ext(P(p, vv), rad);
  const part = (d, fn) => parts.push({ d, fn });
  const r = RNG(hsh32(M));
  function hsh32(m) { return (m.hsh ^ Math.imul(m.frame + 3, 2654435761) ^ (Math.round(yawDeg) * 7919)) >>> 0; }
  const torsoD = P(pel)[2];
  const standing = !M.sit && !M.lie;

  /* ---------- torso sections (relative to pelvis) */
  const b2 = B.b === 2, fem = B.fem;
  const secs = [
    { h: -H * .048, w: B.hipW * .9, d: B.hipD * .88, f: 0 },
    { h: 0, w: B.hipW, d: B.hipD, f: 0 },
    { h: H * .05, w: (B.hipW + B.waistW) * .5 + (b2 ? 1.5 : 0), d: (B.hipD + B.waistD) * .5, f: B.belly * .6 },
    { h: H * .1, w: B.waistW, d: B.waistD, f: B.belly },
    { h: H * .16, w: B.chestW * .96, d: B.chestD, f: B.belly * .4 + (fem ? H * .008 : 0) },
    { h: H * .215, w: B.chestW, d: B.chestD * 1.02, f: fem ? H * .012 : H * .004 },
    { h: B.hs - H * .012, w: B.shW * .96 + 1, d: B.chestD * .82, f: 0 },
    { h: B.hs + H * .016, w: B.shW * .64, d: B.chestD * .62, f: -1 },
    { h: B.neckY - B.hipY - 1, w: B.rNeck * 1.18, d: B.rNeck * 1.12, f: -1.2 }
  ];
  const secAt = (h) => {
    if (h <= secs[0].h) return secs[0]; for (let i = 1; i < secs.length; i++) if (h <= secs[i].h) { const a = secs[i - 1], b = secs[i], t = (h - a.h) / (b.h - a.h); return { h, w: lerp(a.w, b.w, t), d: lerp(a.d, b.d, t), f: lerp(a.f, b.f, t) }; }
    return secs[secs.length - 1];
  };
  const twistAt = (h) => M.ub === ub ? 0 : 0;
  // surface point of the torso (phi: 0 = front centre, + towards character's right), with out-offset
  const surf = (phi, h, out) => { const s = secAt(h), k = 1 + (out || 0) / Math.max(s.w, 1); return ub([s.w * k * Math.sin(phi), h, s.f + s.d * k * Math.cos(phi)]); };
  const sTw = (h) => { const tw = (M.walk ? -.16 * Math.cos(M.ph) : 0) * clamp(h / B.hs, 0, 1.2); return yaw + tw; };
  const visT = (phi, h) => { const s = secAt(h), yw = sTw(h), na = Math.sin(phi) / s.w, nf = Math.cos(phi) / s.d; return na * Math.sin(yw) + nf * Math.cos(yw); };
  const PS = (phi, h, out) => P(surf(phi, h, out));
  // silhouette of the torso between heights
  const silAt = (h, extra) => {
    const s = secAt(h), c = P(ub([0, h, s.f])), yw = sTw(h), Rx = -Math.cos(yw), Fx = Math.sin(yw);
    const w = s.w + (extra || 0), d = s.d + (extra || 0) * .8, rho = Math.sqrt(w * Rx * w * Rx + d * Fx * d * Fx);
    return [c[0], c[1], rho];
  };
  const torsoPoly = (h0, h1, extra, n) => {
    const hsList = [h0]; for (const s of secs) if (s.h > h0 + .5 && s.h < h1 - .5) hsList.push(s.h); hsList.push(h1);
    if (n) { for (let i = 1; i < n; i++) hsList.push(h0 + (h1 - h0) * i / n); hsList.sort((a, b) => a - b); }
    const right = [], left = [];
    for (const h of hsList) { const q = silAt(h, extra); right.push(ext([q[0] + q[2], q[1]])); left.push(ext([q[0] - q[2], q[1]])); }
    return right.concat(left.reverse());
  };

  /* ---------- LEGS */
  const trouserR = B.fem && OF.skirt ? 0 : (OF.o === 'overalls' || OF.o === 'coat' ? 1.6 : 1.1);
  const legBare = !!OF.skirt;
  const legCol = legBare ? (OF.sock || mix(skin, [60, 50, 50], .3)) : C(OF.pants);
  const drawFoot = (g, lg) => {
    const fd = lg.footDir, fwd = [fd[0], 0, fd[2]], side = vNorm(vCross([0, 1, 0], fwd)), fp = lg.fp;
    const up = [0, 1, 0], ca = Math.cos(fp), sa = Math.sin(fp);
    const dir = vNorm([fwd[0] * ca, sa, fwd[2] * ca]), upv = vNorm(vCross(dir, side)), upn = upv[1] < 0 ? vMul(upv, -1) : upv;
    const A = lg.ank, fl = B.footL * (OF.boot ? 1.05 : 1), fw = H * (OF.trainer ? .028 : .025), heelP = vAdd(A, vMul(dir, -H * .028));
    const pt = (l, s, u) => vAdd(vAdd(vAdd(heelP, vMul(dir, l)), vMul(side, s)), vMul(upn, u));
    const base = -B.ankY * .95, pts = [];
    for (const s of [-1, 1]) { pts.push(pt(0, s * fw * .8, base), pt(fl * .72, s * fw, base), pt(fl, s * fw * .55, base + 1.6), pt(fl * .95, s * fw * .5, base + 4.2), pt(fl * .45, s * fw * .8, base + 6.5), pt(0, s * fw * .75, base + 5.2), pt(H * .02, s * fw * .55, OF.boot ? 9 : 4)); }
    const sp = pts.map(p => PE(p, .5)), hull = ch_hull(sp), shoe = C(OF.shoe);
    ch_fill(g, r, hull, shoe, { ax: [1, 0], n: 3, sw: 1, inka: .8, inkw: .6 });
    // sole & toe shine
    const s0 = P(pt(0, 0, base)), s1 = P(pt(fl, 0, base + .6)), toe = P(pt(fl * .82, fw * .25, base + 4));
    ch_stroke(g, [[s0[0], s0[1]], [s1[0], s1[1]]], 1.1, OF.trainer ? [240, 236, 226] : mul(shoe, .5), .85);
    ch_dot(g, toe[0], toe[1], 1, ch_tones(shoe).hi, OF.shoeHi * .7);
    if (OF.trainer && OF.stripe) { const a = P(pt(fl * .3, fw * .9 * (V0.Rd * side[0] + V0.Fd * side[2] > 0 ? 1 : -1), base + 2.5)), b = P(pt(fl * .65, fw * .9 * (V0.Rd * side[0] + V0.Fd * side[2] > 0 ? 1 : -1), base + 3.2)); ch_stroke(g, [[a[0], a[1]], [b[0], b[1]]], 1, OF.stripe, .9); }
  };
  const drawLeg = (g, lg) => {
    const hp = P(lg.hip), kn = P(lg.knee), an = P(lg.ank), lifted = lg.ank[1] > B.ankY + 3 && !M.hang;
    ext(hp, 10); ext(an, 8);
    const calf = P(vLerp(lg.knee, lg.ank, .32)), tr = trouserR;
    const Rr = legBare ? [B.rThigh, B.rKnee, B.rCalf, B.rAnk] : [B.rThigh + tr + .6, B.rKnee + tr + 2.6, B.rCalf + tr + 1.6, B.rAnk + tr + 3.2];
    const knS = M.sit ? 1.12 : 1;
    const pts = [[hp[0], hp[1]], [kn[0], kn[1]], [calf[0], calf[1]], [an[0], an[1] - 1]];
    // foot first when it points away (heel nearer), else after
    const fwdD = lg.footDir[0] * V0.Rd + lg.footDir[2] * V0.Fd;
    if (fwdD < -.2) drawFoot(g, lg);
    const out = ch_limb(g, r, pts, [Rr[0], Rr[1] * knS, Rr[2], Rr[3]], legCol, {
      n: 9, sw: 1.3, top: 0, bot: .25, fx: (g2) => {
        if (legBare) { // stocking sheen down the shin
          ch_stroke(g2, [[kn[0] + 1, kn[1]], [an[0] + .8, an[1] - 3]], 1, ch_tones(legCol).lt, .35); return;
        }
        const pc = C(OF.pants), bend = Math.abs(Math.atan2(an[0] - kn[0], an[1] - kn[1]) - Math.atan2(kn[0] - hp[0], kn[1] - hp[1]));
        // knee creases (more when bent), ankle break, pressed crease line
        const kx = kn[0], ky = kn[1], kk = Math.min(1, .35 + bend * 1.4);
        ch_fold(g2, [[kx - Rr[1] * .9, ky - 2], [kx, ky - .5], [kx + Rr[1] * .8, ky - 2.6]], .9, pc, kk);
        ch_fold(g2, [[kx - Rr[1] * .7, ky + 2.2], [kx + Rr[1] * .2, ky + 1.2], [kx + Rr[1] * .7, ky + 2.8]], .7, pc, kk * .8);
        if (!lifted && !M.sit) { ch_fold(g2, [[an[0] - Rr[3], an[1] - 4.5], [an[0], an[1] - 3.2], [an[0] + Rr[3], an[1] - 5]], .8, pc, .9); ch_fold(g2, [[an[0] - Rr[3] * .8, an[1] - 8], [an[0] + Rr[3] * .7, an[1] - 7]], .6, pc, .6); }
        if (OF.o === 'suit' || OF.o === 'uniform') ch_stroke(g2, [[hp[0] + 1.2, hp[1] + 5], [kn[0] + 1.4, kn[1]], [an[0] + 1.2, an[1] - 4]], .5, ch_tones(pc).lt, .4);
        if (OF.stripe) { const side = (lg.s * V0.Rx) > 0 ? 1 : -1; ch_stroke(g2, [[hp[0] + side * Rr[0] * .82, hp[1] + 2], [kn[0] + side * Rr[1] * .8, kn[1]], [an[0] + side * Rr[3] * .75, an[1] - 2]], 1.1, OF.stripe, .85); }
        // crotch drag folds from the inner thigh
        ch_fold(g2, [[hp[0] - lg.s * V0.Rx * Rr[0] * .5, hp[1] + 3], [hp[0], hp[1] + 7.5]], .6, pc, .5);
      }
    });
    if (fwdD >= -.2) drawFoot(g, lg);
    return out;
  };
  for (const lg of M.legs) {
    const dd = (P(lg.hip)[2] + P(lg.knee)[2] + P(lg.ank)[2]) / 3;
    part(standing ? -100 + dd * .01 : (M.sit ? dd + 1 : dd), (g) => drawLeg(g, lg));
  }

  /* ---------- SKIRTS / LONG COAT TAILS (follow the knees) */
  const kneeSpread = () => { const kR = M.legs[0].knee, kL = M.legs[1].knee; return { w: Math.abs(kR[0] - kL[0]) * .5, d: Math.abs(kR[2] - kL[2]) * .5, cf: (kR[2] + kL[2]) * .5 - pel[2], ca: (kR[0] + kL[0]) * .5 - pel[0] }; };
  const drawTails = (g, col, hemY, wide, isCoat, openFront) => {
    // from waist (h = H*.08) down to absolute hemY
    const ks = kneeSpread(), hTop = H * .06, hBot = hemY - pel[1];
    const rows = 5, right = [], left = [], centers = [];
    for (let i = 0; i <= rows; i++) {
      const t = i / rows, h = lerp(hTop, hBot, t), s = secAt(Math.max(h, secs[0].h));
      const below = clamp((-h) / Math.max(1, -hBot), 0, 1);
      const w = (h > 0 ? s.w : lerp(B.hipW, Math.max(B.hipW * wide, ks.w + B.rKnee + 4), below)) + (isCoat ? 1.8 : 1), d = (h > 0 ? s.d : lerp(B.hipD, Math.max(B.hipD * wide, ks.d + B.rKnee + 3), below)) + (isCoat ? 1.6 : .8);
      const cf = h > 0 ? s.f : ks.cf * below, ca = h > 0 ? 0 : ks.ca * below;
      const yy = Math.max(h, secs[0].h);
      const c = P(h > 0 ? ub([ca, h, cf]) : [pel[0] + ca, pel[1] + h, pel[2] + cf]), Rx = -Math.cos(yaw), Fx = Math.sin(yaw), rho = Math.sqrt(w * Rx * w * Rx + d * Fx * d * Fx);
      const sway = M.walk ? Math.sin(M.ph) * 1.5 * t : 0;
      right.push(ext([c[0] + rho + sway, c[1] + (i === rows ? 1.2 : 0)])); left.push(ext([c[0] - rho + sway, c[1] + (i === rows ? -.4 : 0)])); centers.push([c[0], c[1], w, d, cf, ca, h]);
    }
    const poly = right.concat(left.reverse());
    ch_fill(g, r, poly, col, { ax: [0, 1], n: 26, sw: 1.6, top: .0, bot: .32, fx: (g2) => {
      // vertical drape folds
      const cB = centers[rows], cT = centers[0];
      for (let k = 0; k < 5; k++) { const u = -.8 + k * .4 + (r() - .5) * .15, x0 = cT[0] + u * (right[0][0] - left[left.length - 1][0]) * .4, x1 = cB[0] + u * (right[rows][0] - left[0][0]) * .5; ch_fold(g2, [[x0, cT[1] + 4], [lerp(x0, x1, .5) + (r() - .5) * 2, lerp(cT[1], cB[1], .55)], [x1, cB[1]]], .8, col, .7); }
      if (OF.pleats) for (let k = -3; k <= 3; k++) { const x0 = cT[0] + k * 2.4, x1 = cB[0] + k * 3.4; ch_stroke(g2, [[x0, cT[1] + 2], [x1, cB[1]]], .5, ch_tones(col).core, .55); }
      if (openFront && cY > -.2) {   // coat opening
        const f0 = PS(0, H * .06), f1x = cB[0] + sY * (right[rows][0] - cB[0]) * .2;
        ch_stroke(g2, [[f0[0], f0[1]], [f1x, cB[1]]], .7, INK, .55);
        ch_stroke(g2, [[f0[0] + .8, f0[1]], [f1x + .9, cB[1]]], .5, ch_tones(col).lt, .5);
      }
      // hem shadow line
      ch_stroke(g2, [left[0], [cB[0], cB[1] + 1.4], right[rows]], 1.2, ch_tones(col).core, .5);
    } });
  };

  /* ---------- TORSO (seat, top garment, details) */
  const oc = C(L.outfitColor), topC = C(OF.top);
  const drawTorso = (g) => {
    const hTop = secs[secs.length - 1].h;
    // trousers seat / lower body
    if (!OF.skirt) { const seat = torsoPoly(secs[0].h, H * .11, trouserR + .4, 2); ch_fill(g, r, seat, OF.pants, { n: 8, sw: 1.4, bot: .2, top: 0 }); }
    // long tails / skirts
    if (OF.skirt && !OF.long) drawTails(g, OF.skirt, (M.sit ? pel[1] - 2 : B.ankY + H * OF.skirtH + (M.hang ? M.lift : 0)), 1.25, false, false);
    if (OF.long && !M.sit) drawTails(g, OF.top, B.ankY + H * OF.long + (M.hang ? M.lift : 0), 1.32, true, true);
    if (OF.long && M.sit) { const seat2 = torsoPoly(secs[0].h, H * .11, 2.4, 2); ch_fill(g, r, seat2, OF.top, { n: 6, bot: .2, top: 0 }); }
    // neck
    const nb = P(M.neckB), hc = P(M.head.c), nt = [lerp(nb[0], hc[0], .7), lerp(nb[1], hc[1], .7)];
    ch_limb(g, r, [[nb[0], nb[1] + 2], nt], [B.rNeck, B.rNeck * .92], skin, { n: 4, inka: .4, fx: (g2) => { g2.fillStyle = 'rgba(30,20,40,.35)'; g2.fillRect(nt[0] - 8, nt[1] - 2, 16, 5); } });
    // top garment
    const hemH = OF.o === 'apron' ? H * .09 : (OF.skirt && OF.o !== 'cardigan' && OF.o !== 'suit') ? H * .085 : H * OF.hem;
    const topPoly = torsoPoly(Math.min(hemH, H * .1), hTop, OF.o === 'coat' ? 1.8 : OF.o === 'labcoat' ? 1.4 : OF.o === 'suit' || OF.o === 'uniform' ? 1.1 : .7, 3);
    const garmentC = OF.o === 'overalls' ? OF.top : OF.o === 'shirtsleeves' ? OF.shirt : topC;
    ch_fill(g, r, topPoly, garmentC, { ax: [0, 1], n: 30, sw: 1.6, top: .1, bot: .18, fx: (g2) => torsoDetail(g2, garmentC, hemH) });
    if (OF.bib) drawBib(g);
    if (OF.apron) drawApron(g);
    collar(g, garmentC);
    sigTorso(g);
  };
  const visible = (phi, h) => visT(phi, h) > .05;
  const surfLine = (phi, h0, h1, n, out) => { const pts = []; for (let i = 0; i <= n; i++) { const h = lerp(h0, h1, i / n); if (!visible(phi, h)) return null; const q = PS(phi, h, out); pts.push([q[0], q[1]]); } return pts; };
  const ringLine = (h, p0, p1, n, out) => { const pts = []; for (let i = 0; i <= n; i++) { const phi = lerp(p0, p1, i / n); if (visible(phi, h)) { const q = PS(phi, h, out); pts.push([q[0], q[1]]); } } return pts; };
  const front = cY > .12, back = cY < -.12;
  const torsoDetail = (g, col, hemH) => {
    const T = ch_tones(col), hc = H * .1, hChest = H * .2, hSh = B.hs;
    // side drag folds from the armpits & waist bunching
    for (const s of [1, -1]) {
      const phi = s * 1.25; if (visible(phi, H * .15)) { const a = PS(phi, H * .21), b = PS(s * 1.0, H * .13), c2 = PS(s * .85, H * .07); ch_fold(g, [[a[0], a[1]], [b[0], b[1]], [c2[0], c2[1]]], .9, col, .8); }
      const phi2 = s * 1.45; if (visible(phi2, H * .1)) { const a = PS(phi2, H * .11), b = PS(s * 1.1, H * .085); ch_fold(g, [[a[0], a[1]], [b[0], b[1]]], .8, col, .7); }
    }
    if (B.b === 2) { const a = ringLine(H * .085, -1, 1, 6); if (a.length > 1) ch_fold(g, a, .9, col, .6); }
    // hem shadow
    const hem = ringLine(Math.min(hemH, H * .1) + 1, -1.6, 1.6, 10); if (hem.length > 1) ch_stroke(g, hem, 1.1, T.core, .45);
    // side seams
    for (const s of [1, -1]) { const ln = surfLine(s * 1.57, hemH + 2, hSh - 2, 4); if (ln) ch_stroke(g, ln, .45, T.core, .45); }
    const o = OF.o;
    if (o === 'uniform') {
      const ln = surfLine(0, hemH + 1, hSh + 1, 5); if (ln) { ch_stroke(g, ln, .6, T.core, .7); for (let i = 0; i < 4; i++) { const q = PS(.05, lerp(H * .07, H * .24, i / 3)); if (visible(.05, H * .15)) ch_button(g, q[0], q[1], .75, [214, 178, 96]); } }
      // belt
      const bl = ringLine(H * .085, -1.7, 1.7, 10, .6); if (bl.length > 1) { ch_stroke(g, bl, 2.6, mul(accC, .55), 1); ch_stroke(g, bl, 1.6, accC, .95); }
      if (visible(0, H * .085)) { const q = PS(0, H * .085, .8); g.fillStyle = css([226, 196, 110]); g.fillRect(q[0] - 1.4, q[1] - 1.3, 2.8, 2.6); g.strokeStyle = css(INK, .6); g.lineWidth = .4; g.strokeRect(q[0] - 1.4, q[1] - 1.3, 2.8, 2.6); }
      // breast pockets
      for (const s of [1, -1]) if (visible(s * .5, H * .2)) { const a = PS(s * .32, H * .225, .2), b = PS(s * .72, H * .225, .2), c2 = PS(s * .72, H * .19, .2), d = PS(s * .32, H * .19, .2); ch_poly(g, [a, b, c2, d]); g.strokeStyle = css(T.core, .6); g.lineWidth = .5; g.stroke(); ch_stroke(g, [a, b], 1.2, mul(col, 1.15), .7); ch_button(g, (a[0] + b[0]) / 2, a[1] + 1, .5, [214, 178, 96]); }
    } else if (o === 'suit' || o === 'coat' || o === 'labcoat' || o === 'cardigan') {
      // open front: shirt/blouse visible in a V; lapels
      const deep = o === 'cardigan' ? H * .1 : o === 'labcoat' ? H * .13 : o === 'coat' ? H * .16 : H * .14;
      if (front) {
        const v = [PS(-.42, hSh + 1), PS(0, deep), PS(.42, hSh + 1), PS(.3, hSh + 3), PS(-.3, hSh + 3)];
        ch_fill(g, r, v, OF.shirt, { n: 4, inka: .5, ax: [0, 1] });
        if (o !== 'cardigan' && o !== 'labcoat' || L.extra === 'none' && o === 'labcoat') { // tie
          const t0 = PS(0, hSh - 1, .5), t1 = PS(0, deep + 2, .5);
          if (id === 'fenwick' || id === 'quill') { ch_fill(g, r, [[t0[0] - 2.6, t0[1] - 1], [t0[0], t0[1] + .3], [t0[0] + 2.6, t0[1] - 1], [t0[0] + 2.6, t0[1] + 1.6], [t0[0], t0[1] + .6], [t0[0] - 2.6, t0[1] + 1.6]], accC, { sharp: true, n: 2, inka: .7 }); }
          else if (o !== 'labcoat' || true) ch_fill(g, r, [[t0[0] - .9, t0[1]], [t0[0] + .9, t0[1]], [t1[0] + 1.5, t1[1] - 1.5], [t1[0], t1[1] + .8], [t1[0] - 1.5, t1[1] - 1.5]], o === 'labcoat' ? [70, 60, 60] : accC, { sharp: true, n: 2, inka: .7 });
        }
        if (o !== 'cardigan') for (const s of [1, -1]) {   // lapels
          const la = [PS(s * .44, hSh + 1.5, .6), PS(s * .05, deep, .6), PS(s * .25, deep + H * .03, .6), PS(s * .78, hSh - H * .02, .6), PS(s * .7, hSh + 1.2, .6)];
          ch_fill(g, r, la, mul(col, 1.08), { n: 4, sharp: true, inka: .65, ax: [0, 1] });
        }
        // closure + buttons below the V
        const ln = surfLine(o === 'cardigan' ? .06 : 0, hemH + 1, deep, 4); if (ln) ch_stroke(g, ln, .55, T.core, .75);
        const nb = o === 'coat' ? 3 : o === 'cardigan' ? 4 : 2;
        for (let i = 0; i < nb; i++) { const h = lerp(deep - 2, hemH + 4, (i + .5) / nb); if (o === 'coat') { for (const s of [1, -1]) if (visible(s * .22, h)) { const q = PS(s * .22, h); ch_button(g, q[0], q[1], .8, [40, 32, 28]); } } else if (visible(.1, h)) { const q = PS(o === 'cardigan' ? .1 : .06, h); ch_button(g, q[0], q[1], .65, o === 'cardigan' ? accC : [40, 34, 34]); } }
        // pockets
        for (const s of [1, -1]) if (visible(s * .6, H * .05)) { const a = PS(s * .35, H * .055, .3), b = PS(s * .85, H * .055, .3); ch_stroke(g, [a, b], .8, T.core, .7); ch_stroke(g, [[a[0], a[1] + .9], [b[0], b[1] + .9]], .5, T.lt, .4); }
        if (o === 'labcoat' && visible(-.6, H * .2)) { const a = PS(-.4, H * .21, .3), b = PS(-.8, H * .21, .3); ch_stroke(g, [a, b], .7, T.core, .7); ch_stroke(g, [[a[0], a[1] - .5], [a[0] - .2, a[1] - 3.5]], .8, [40, 70, 140], .95); ch_stroke(g, [[a[0] - 1.4, a[1] - .5], [a[0] - 1.5, a[1] - 3]], .8, [160, 40, 40], .9); }
      }
      if (o === 'cardigan') {   // knit ribbing at hem & front bands
        const rib = ringLine(hemH + 1.8, -1.6, 1.6, 12); if (rib.length > 1) ch_stroke(g, rib, 1.8, T.core, .35);
        for (let i = -10; i <= 10; i++) { const phi = i * .15; if (!visible(phi, hemH + 1)) continue; const a = PS(phi, hemH + .3), b = PS(phi, hemH + 3.4); ch_stroke(g, [a, b], .35, T.core, .5); }
      }
      if (o === 'coat' || o === 'labcoat') { const bl = ringLine(H * .1, -1.6, 1.6, 10, .9); if (bl.length > 1 && o === 'coat') { ch_stroke(g, bl, 2.4, mul(col, .7), 1); ch_stroke(g, bl, .6, T.lt, .4); if (visible(0, H * .1)) { const q = PS(0, H * .1, 1); g.strokeStyle = css(accC); g.lineWidth = .6; g.strokeRect(q[0] - 1.6, q[1] - 1.4, 3.2, 2.8); } } }
      if (back && (o === 'coat' || o === 'labcoat')) { const ln = surfLine(Math.PI, H * .02, H * .09, 2); if (ln) ch_stroke(g, ln, .6, T.core, .6); }
    } else if (o === 'tracksuit') {
      const zipTo = id === 'vasha' ? H * .2 : hSh + 1;
      const ln = surfLine(0, hemH + 1, hSh + 2, 6);
      if (ln) { ch_stroke(g, ln, .7, T.core, .8); ch_stroke(g, ln.map(p => [p[0] + .6, p[1]]), .35, [200, 200, 200], .5); }
      if (front && id === 'vasha') { const v = [PS(-.3, hSh + 1), PS(0, zipTo), PS(.3, hSh + 1)]; ch_fill(g, r, v, [210, 206, 196], { n: 2, sharp: true, inka: .5 }); }
      for (const s of [1, -1]) { const ln2 = surfLine(s * .62, hemH + 2, hSh, 5, .3); if (ln2) ch_stroke(g, ln2, 1.1, accC, .9); }
      const rib = ringLine(hemH + 1.6, -1.6, 1.6, 10); if (rib.length > 1) ch_stroke(g, rib, 2.2, T.core, .35);
    } else if (o === 'shirtsleeves') {
      const ln = surfLine(0, H * .09, hSh + 1, 5); if (ln) { ch_stroke(g, ln, .5, T.core, .7); for (let i = 0; i < 4; i++) { const h = lerp(H * .12, H * .26, i / 3); if (visible(0, h)) { const q = PS(0.04, h); ch_dot(g, q[0], q[1], .5, [236, 230, 214]); } } }
      // tucked blousing over the belt
      const bl = ringLine(H * .088, -1.7, 1.7, 10, .3); if (bl.length > 1) { ch_stroke(g, bl, 2, [40, 32, 30], 1); }
      for (let i = -3; i <= 3; i++) { const phi = i * .32; if (!visible(phi, H * .1)) continue; const a = PS(phi, H * .095), b = PS(phi + .08, H * .14); ch_fold(g, [a, b], .6, col, .7); }
      if (OF.braces) for (const s of [1, -1]) { const ln2 = surfLine(s * .45, H * .09, hSh + 2, 5, .3); if (ln2) ch_stroke(g, ln2, 1.4, OF.braces, .95); }
      if (back && OF.braces) { const a = PS(Math.PI, H * .19, .3); for (const s of [1, -1]) { const b = PS(Math.PI - s * .5, hSh + 2, .3), c2 = PS(Math.PI - s * .35, H * .09, .3); ch_stroke(g, [[c2[0], c2[1]], [a[0], a[1]], [b[0], b[1]]], 1.4, OF.braces, .95); } }
    } else if (o === 'overalls') {
      const bl = ringLine(H * .09, -1.7, 1.7, 8); // shirt only; bib drawn after
    }
    if (back && (o === 'uniform' || o === 'suit')) { const ln = surfLine(Math.PI, hemH + 1, H * .07, 2); if (ln) ch_stroke(g, ln, .6, T.core, .7); if (o === 'uniform') { const bl = ringLine(H * .085, Math.PI - 1.7, Math.PI + 1.7, 10, .6); if (bl.length > 1) { ch_stroke(g, bl, 2.6, mul(accC, .55), 1); ch_stroke(g, bl, 1.6, accC, .95); } } }
    // light across the chest / shoulder planes
    const sh1 = PS(.6 * (sY >= 0 ? 1 : -1) + .2, H * .2), sh2 = PS(.9, B.hs - 2);
    if (visible(.75, H * .21)) ch_stroke(g, [[sh1[0], sh1[1]], [sh2[0], sh2[1]]], 2.4, T.lt, .18);
  };
  const drawBib = (g) => {
    const col = C(OF.bib), hB = H * .225;
    if (front) {
      const bib = [PS(-.62, H * .1, .6), PS(.62, H * .1, .6), PS(.5, hB, .6), PS(-.5, hB, .6)];
      ch_fill(g, r, bib, col, { n: 8, sharp: true, inka: .7, fx: (g2) => { const a = PS(-.25, hB - 3, .7), b = PS(.25, hB - 3, .7), c2 = PS(.25, hB - H * .065, .7), d = PS(-.25, hB - H * .065, .7); ch_poly(g2, [a, b, c2, d]); g2.strokeStyle = css(ch_tones(col).core, .7); g2.lineWidth = .5; g2.stroke(); ch_stroke(g2, [a, b], .7, [226, 190, 110], .7); } });
      for (const s of [1, -1]) { const q = PS(s * .45, hB - 1, .7); ch_button(g, q[0], q[1], .9, [200, 170, 100]); }
    }
    // straps
    for (const s of [1, -1]) {
      const pts = [];
      for (let i = 0; i <= 5; i++) { const t = i / 5, phi = front || !back ? lerp(s * .47, s * .55, t) : 0; }
      const fr = [PS(s * .47, hB, .7), PS(s * .5, B.hs + 2, .7)], bk = [PS(Math.PI - s * .45, B.hs + 2, .7), PS(Math.PI - s * .2, H * .13, .7)];
      if (front && visible(s * .47, hB)) ch_stroke(g, [[fr[0][0], fr[0][1]], [fr[1][0], fr[1][1]]], 2.2, col, 1);
      if (back) { ch_stroke(g, [[bk[0][0], bk[0][1]], [bk[1][0], bk[1][1]]], 2.2, col, 1); }
      if (!front && !back) { const a = PS(s * .7, hB, .7), b = PS(s * 1.0, B.hs + 2, .7); if (visible(s * .7, hB)) ch_stroke(g, [[a[0], a[1]], [b[0], b[1]]], 2.2, col, 1); }
    }
    // waist of the overalls (sides/back)
    const bl = ringLine(H * .105, -3.2, 3.2, 16, .7); if (bl.length > 1 && !front) ch_stroke(g, bl, 3, col, 1);
  };
  const drawApron = (g) => {
    const col = C(OF.apron), T = ch_tones(col);
    if (!back) {
      const hB = H * .2, bottom = B.ankY + H * .26 - pel[1];
      // skirt part of the apron: spans front of skirt
      const ks = kneeSpread(), pts = [];
      const L0 = PS(-1.0, H * .08, 1.2), R0 = PS(1.0, H * .08, 1.2);
      const c = P([pel[0] + ks.ca, pel[1] + bottom, pel[2] + ks.cf + B.hipD * 1.25 + 1.5]), wB = (B.hipW * 1.08 + 1);
      const Rx = -Math.cos(yaw), Fx = Math.sin(yaw), half = Math.abs(wB * Rx) + Math.abs(2 * Fx);
      const lower = [[L0[0], L0[1]], [R0[0], R0[1]], [c[0] + half * (R0[0] > L0[0] ? 1 : -1) * .95, c[1]], [c[0] - half * (R0[0] > L0[0] ? 1 : -1) * .95, c[1] + .5]];
      if (visible(0, H * .05)) {
        const bib = [PS(-.5, H * .085, .9), PS(.5, H * .085, .9), PS(.42, hB, .9), PS(-.42, hB, .9)];
        ch_fill(g, r, lower.map(p => ext(p)), col, { n: 16, sharp: false, inka: .7, ax: [0, 1], bot: .2, top: 0, fx: (g2) => {
          for (let k = 0; k < 4; k++) { const u = -.6 + k * .4; const x0 = lerp(L0[0], R0[0], .5 + u * .5), x1 = lerp(lower[3][0], lower[2][0], .5 + u * .55); ch_fold(g2, [[x0, L0[1] + 3], [x1, lower[2][1] - 1]], .8, col, .7); }
          g2.fillStyle = 'rgba(120,70,50,.25)'; g2.beginPath(); g2.ellipse(lerp(L0[0], R0[0], .35), L0[1] + 9, 2.4, 1.6, .3, 0, 7); g2.fill(); g2.beginPath(); g2.ellipse(lerp(L0[0], R0[0], .62), L0[1] + 16, 1.6, 1.2, 0, 0, 7); g2.fill();
          // pocket
          const pa = [lerp(L0[0], R0[0], .3), L0[1] + 5], pb = [lerp(L0[0], R0[0], .7), L0[1] + 5]; ch_stroke(g2, [pa, pb], .6, T.core, .6); ch_stroke(g2, [[pa[0], pa[1] + 5], [pb[0], pb[1] + 5]], .5, T.core, .45);
        } });
        if (front) ch_fill(g, r, bib, col, { n: 6, sharp: true, inka: .7 });
        // ties & waist band
        const wb = ringLine(H * .085, -1.3, 1.3, 8, 1); if (wb.length > 1) ch_stroke(g, wb, 1.6, mul(col, .85), 1);
        if (front) for (const s of [1, -1]) { const a = PS(s * .42, hB, .9), b = PS(s * .55, B.hs + 2.5, .5); ch_stroke(g, [[a[0], a[1]], [b[0], b[1]]], 1.1, mul(col, .9), 1); }
      }
    } else {
      const wb = ringLine(H * .085, Math.PI - 1.5, Math.PI + 1.5, 8, 1); if (wb.length > 1) ch_stroke(g, wb, 1.4, mul(col, .85), 1);
      const q = PS(Math.PI, H * .085, 1.2); ch_stroke(g, [[q[0] - 3, q[1] - 1.5], [q[0], q[1]], [q[0] + 3, q[1] - 1.5]], 1.4, col, 1); ch_stroke(g, [[q[0], q[1]], [q[0] - 1.5, q[1] + 6]], 1, col, 1); ch_stroke(g, [[q[0], q[1]], [q[0] + 1.8, q[1] + 6]], 1, col, 1);
      for (const s of [1, -1]) { const a = PS(Math.PI - s * .5, B.hs + 1.5, .5), b = PS(Math.PI, H * .2, .5); ch_stroke(g, [[a[0], a[1]], [b[0], b[1]]], 1, col, .95); }
    }
  };
  const collar = (g, col) => {
    const o = OF.o, hN = secs[secs.length - 1].h, T = ch_tones(col);
    if (o === 'uniform' || o === 'tracksuit') {   // stand collar ring around the neck base
      const ring = []; const rr = B.rNeck + 1.4;
      for (let i = 0; i <= 16; i++) { const a = -Math.PI + i / 16 * Math.PI * 2; ring.push(ub([Math.sin(a) * rr, hN + 1.8 - (Math.cos(a) > 0 ? 1 : 0) * Math.cos(a) * (o === 'uniform' ? 1.2 : 0), Math.cos(a) * rr * 1.02 + secs[secs.length - 1].f])); }
      const lo = []; for (let i = 0; i <= 16; i++) { const a = -Math.PI + i / 16 * Math.PI * 2; lo.push(ub([Math.sin(a) * (rr + 1), hN - 2.5, Math.cos(a) * (rr + 1) + secs[secs.length - 1].f])); }
      const sp = ch_hull(ring.concat(lo).map(p => P(p)));
      ch_fill(g, r, sp, o === 'uniform' ? mul(col, 1.05) : col, { n: 3, inka: .6, sharp: false });
      if (o === 'uniform' && front) { const q = PS(0, hN, 1.4); ch_stroke(g, [[q[0] - .2, q[1] - 2], [q[0], q[1] + 1]], .6, INK, .7); ch_stroke(g, [PS(-.6, hN - 1.2, 1.6), PS(-.15, hN + .4, 1.6)], 1, [236, 230, 214], .8); ch_stroke(g, [PS(.6, hN - 1.2, 1.6), PS(.15, hN + .4, 1.6)], 1, [236, 230, 214], .8); }
    } else if (o === 'coat') {   // big collar (turned up for Voss)
      const up = id === 'voss' ? 4.5 : 1.8;
      const pts = []; for (let i = 0; i <= 12; i++) { const a = -Math.PI * .95 + i / 12 * Math.PI * 1.9; pts.push(P(ub([Math.sin(a) * (B.rNeck + 2.6), hN + up * (1 - Math.max(0, Math.cos(a)) * .6), Math.cos(a) * (B.rNeck + 2.2) + secs[secs.length - 1].f]))); }
      for (let i = 0; i <= 12; i++) { const a = -Math.PI * .95 + i / 12 * Math.PI * 1.9; pts.push(P(ub([Math.sin(a) * (B.rNeck + 5.5), hN - 3, Math.cos(a) * (B.rNeck + 4) + secs[secs.length - 1].f]))); }
      ch_fill(g, r, ch_hull(pts), mul(col, 1.08), { n: 6, inka: .7 });
      if (front) { const v = [PS(-.35, hN - 1, 1.5), PS(0, H * .2, 1.5), PS(.35, hN - 1, 1.5)]; ch_fill(g, r, v, accC, { n: 4, sharp: true, inka: .6 }); } // scarf
      else if (!back) { const a = PS(sY > 0 ? .4 : -.4, hN - 1, 2); ch_dot(g, a[0], a[1], 2.2, accC, .9); }
    } else if (o === 'suit' || o === 'labcoat' || o === 'shirtsleeves' || o === 'cardigan' || o === 'overalls' || o === 'apron') {
      if (front || !back) for (const s of [1, -1]) {   // shirt collar points
        if (!visible(s * .3, hN - 1)) continue;
        const c0 = PS(s * .05, hN - 3.5, 1.4), c1 = PS(s * .55, hN + .6, 1.4), c2 = PS(s * .4, hN - 4.4, 1.6);
        const cc = o === 'shirtsleeves' ? OF.shirt : o === 'overalls' ? OF.top : o === 'apron' ? mix(OF.top, [230, 220, 200], .5) : OF.shirt;
        ch_fill(g, r, [c0, c1, c2], mul(C(cc), 1.08), { n: 2, sharp: true, inka: .6 });
      }
      if (back) { const bl = ringLine(hN - 1, Math.PI - 1.2, Math.PI + 1.2, 8, 1.2); if (bl.length > 1) ch_stroke(g, bl, 1.8, mul(C(OF.shirt), 1.05), .9); }
    }
  };
  // signature torso props (keys, satchel strap, whistle, headphones, shawl, rope coil)
  const sigTorso = (g) => {
    if (id === 'vasha') { // whistle on a lanyard
      const a = PS(-.5, B.hs + 2, 1.6), b = PS(-.05, H * .19, 1.8), c2 = PS(.5, B.hs + 2, 1.6);
      if (front) { ch_stroke(g, [a, b, c2], .55, [210, 60, 50], .95); ch_fill(g, r, [[b[0] - 1.3, b[1]], [b[0] + 1.3, b[1]], [b[0] + 1.6, b[1] + 3], [b[0] - 1.1, b[1] + 3]], [190, 190, 196], { n: 1, inka: .7, sharp: true }); ch_dot(g, b[0] + .6, b[1] + .9, .4, [255, 255, 255], .9); }
    }
    if (id === 'nadia') { // satchel strap across the body
      const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8, phi = lerp(-.95, 1.15, t), h = lerp(B.hs + 2, H * .03, t); if (visible(phi, h)) { const q = PS(phi, h, 1.6); pts.push([q[0], q[1]]); } }
      if (pts.length > 1) { ch_stroke(g, pts, 1.8, [62, 40, 30], 1); ch_stroke(g, pts.map(p => [p[0] + .5, p[1] - .4]), .5, [150, 110, 80], .5); }
      if (visible(1.2, H * .02) || !front) { const q = PS(1.35, -H * .01, 3); ch_fill(g, r, [[q[0] - 5, q[1] - 4], [q[0] + 5, q[1] - 4], [q[0] + 5.5, q[1] + 5], [q[0] - 5.5, q[1] + 5]], [92, 62, 44], { n: 3, inka: .8, sharp: true, fx: (g2) => ch_stroke(g2, [[q[0] - 5, q[1] - 1], [q[0] + 5, q[1] - 1]], .6, [40, 26, 20], .8) }); }
    }
    if (id === 'osk' || id === 'matron') { // keys on a ring at the hip
      const sd = id === 'osk' ? 1.3 : -1.3; if (visible(sd, H * .09)) { const q = PS(sd, H * .07, 1.5); g.strokeStyle = css([150, 140, 110], .95); g.lineWidth = .6; g.beginPath(); g.arc(q[0], q[1], 1.6, 0, 7); g.stroke(); for (let k = 0; k < 4; k++) ch_stroke(g, [[q[0] - 1 + k * .7, q[1] + 1.4], [q[0] - 1.6 + k * 1.1, q[1] + 4.5]], .6, [190, 180, 140], .95); }
    }
    if (id === 'marr' && front) { const q = PS(-.45, H * .22, 1.5); ch_dot(g, q[0], q[1], 1.2, accC); ch_dot(g, q[0] + .4, q[1] - .4, .4, [255, 245, 210], .9); }
    if (id === 'corvin' && front) { const q = PS(-.45, H * .22, 1.4); ch_dot(g, q[0], q[1], .9, [190, 40, 40]); ch_dot(g, q[0], q[1], .4, [230, 200, 110]); }
    if (id === 'anka') { // knitted shawl over the shoulders
      const sh = []; for (let i = 0; i <= 14; i++) { const a = -Math.PI + i / 14 * Math.PI * 2; if (visT(a, B.hs) < -.2) continue; sh.push(PS(a, B.hs + 2.4, 2.4)); }
      const lo = []; for (let i = 14; i >= 0; i--) { const a = -Math.PI + i / 14 * Math.PI * 2; if (visT(a, B.hs) < -.2) continue; lo.push(PS(a, H * (Math.cos(a) > 0 ? .17 : .2), 2.8)); }
      const poly = sh.concat(lo); if (poly.length > 4) ch_fill(g, r, poly.map(p => [p[0], p[1]]), mix(accC, [120, 90, 70], .3), { n: 14, sw: 1, inka: .7, fx: (g2) => { const b = ch_bb(poly); for (let y = b[1]; y < b[3]; y += 1.6) ch_stroke(g2, [[b[0], y], [b[2], y + .6]], .35, [30, 20, 18], .35); } });
    }
    if (id === 'ilsabet' || id === 'tomas') { // headphones round the neck
      const pts = []; for (let i = 0; i <= 10; i++) { const a = -Math.PI * .5 + i / 10 * Math.PI; pts.push(P(ub([Math.sin(a) * (B.rNeck + 2.6), secs[secs.length - 1].h + 1 + Math.cos(a) * 1.2, -Math.cos(a) * (B.rNeck + 2.2) + 1]))); }
      if (cY > -.3) { ch_stroke(g, pts.slice(1, 10).map(p => [p[0], p[1]]), 1, [40, 40, 44], 1); }
      for (const s of [1, -1]) { const q = P(ub([s * (B.rNeck + 2.6), secs[secs.length - 1].h - .5, 1.5])); ch_fill(g, r, ellPts(q[0], q[1], 2.1 * Math.max(.45, Math.abs(cY)) + .5, 2.4, 10), [52, 50, 56], { n: 1, inka: .8 }); ch_dot(g, q[0] + .4, q[1] - .6, .5, [180, 180, 190], .7); }
    }
    if (id === 'hob') { // coil of bell-rope over the left shoulder
      const c = ub([-B.shW * .55, B.hs - 2, 0]);
      for (let k = 0; k < 3; k++) { const pts = []; for (let i = 0; i <= 18; i++) { const a = i / 18 * Math.PI * 2; pts.push(P([c[0] + Math.sin(a) * 2.5 + (k - 1) * 1.2, c[1] - 9 + Math.cos(a) * 14, c[2] + Math.cos(a) * 9])); } ch_stroke(g, pts.map(p => ext([p[0], p[1]])), 1.6, [150, 120, 80], .95); ch_stroke(g, pts.map(p => [p[0] + .4, p[1] - .3]), .5, [220, 190, 140], .5); }
    }
  };
  part(standing ? torsoD : torsoD, drawTorso);

  /* ---------- ARMS + HANDS + held items */
  const sleeveC = OF.o === 'shirtsleeves' ? C(OF.shirt) : C(OF.sleeve);
  const sleeveR = OF.o === 'coat' ? 2.4 : OF.o === 'labcoat' ? 2.1 : OF.o === 'suit' || OF.o === 'uniform' || OF.o === 'cardigan' ? 1.7 : 1.3;
  const handGeo = (a) => {
    // hand frame: u along fingers, s across knuckles, n palm normal
    let u = vNorm(vSub(a.wr, a.el)); if (a.up) u = vNorm(vAdd(u, [0, 1.2, .5]));
    if (a.hand === 'fist') u = vNorm(vAdd(u, [0, -.2, .4]));
    let s0 = [0, 0, 1]; if (Math.abs(vDot(s0, u)) > .9) s0 = [a.s, 0, 0];
    const sv = vNorm(vSub(s0, vMul(u, vDot(s0, u)))), nv = vCross(u, sv);
    return { u, sv, nv };
  };
  const drawHand = (g, a) => {
    if (a.hand === 'hidden') return null;
    const sc = H / 174, { u, sv, nv } = handGeo(a), W = a.wr;
    const fist = a.hand === 'fist' || a.hand === 'pinch';
    const pt = (l, s, n) => vAdd(vAdd(vAdd(W, vMul(u, l * sc)), vMul(sv, s * sc)), vMul(nv, n * sc * a.s));
    const pts = [pt(0, -2.4, 1), pt(0, 2.4, 1), pt(0, -2.2, -1.2), pt(0, 2.2, -1.2), pt(5.2, -3.6, 1.2), pt(5.2, 3.6, 1.2), pt(5.2, 3.3, -1.3), pt(5.2, -3.3, -1.3)];
    if (fist) pts.push(pt(7.6, -3.2, -1.5), pt(7.6, 3.2, -1.5), pt(6.5, -3, -3), pt(6.5, 3, -3));
    else pts.push(pt(9.6, -2.8, -1), pt(9.6, 2.6, -1), pt(8.6, -3.2, .5), pt(8.6, 3, .5));
    const sp = pts.map(p => PE(p, 1)), hull = ch_hull(sp);
    ch_fill(g, r, hull, skin, { ax: [sp[4][0] - sp[0][0], sp[4][1] - sp[0][1]], n: 3, sw: .8, inka: .7, inkw: .5, fx: (g2) => {
      if (!fist) { for (let k = -1; k <= 1; k++) { const a1 = P(pt(5.6, k * 1.25, 0)), b1 = P(pt(9, k * 1.1, -.6)); ch_stroke(g2, [[a1[0], a1[1]], [b1[0], b1[1]]], .35, ch_tones(skin).core, .45); } }
      else { const a1 = P(pt(6, -3, -1)), b1 = P(pt(6, 3, -1)); ch_stroke(g2, [[a1[0], a1[1]], [b1[0], b1[1]]], .45, ch_tones(skin).core, .45); }
    } });
    // thumb
    const t0 = P(pt(1.2, 2.6, 1)), t1 = P(pt(fist ? 5.4 : 4.8, fist ? 1.8 : 3.8, fist ? 2.6 : 2.4));
    ch_limb(g, r, [[t0[0], t0[1]], [t1[0], t1[1]]], [1.25 * sc, .95 * sc], skin, { n: 1, inka: .6, inkw: .45 });
    return { grip: vAdd(W, vMul(u, 5.5 * sc)), u, sv, nv, tip: vAdd(W, vMul(u, (fist ? 7.5 : 9.5) * sc)) };
  };
  const drawArm = (g, a) => {
    const sh = P(a.sh), el = P(a.el), wr = P(a.wr); ext(sh, 8); ext(wr, 12);
    const upMid = P(vLerp(a.sh, a.el, .45)), sr = sleeveR;
    const rolled = OF.rolled, cuffAt = .0;
    const R = [B.rUp + sr + .6, B.rUp * .92 + sr, B.rElb + sr, B.rFore + sr * .8, B.rWr + sr * .7];
    const fore = P(vLerp(a.el, a.wr, .4));
    const sleeveEndW = rolled ? P(vLerp(a.el, a.wr, .12)) : wr;
    // shoulder cap / upper sleeve
    if (rolled) {
      // forearm bare skin first, rolled cuff over it
      ch_limb(g, r, [[el[0], el[1]], [fore[0], fore[1]], [wr[0], wr[1]]], [B.rElb * .95, B.rFore * .95, B.rWr], skin, { n: 4, inka: .55, fx: (g2) => { const hair = ch_tones(skin).core; ch_stroke(g2, [[fore[0] - .5, fore[1]], [wr[0], wr[1]]], .4, hair, .2); } });
      ch_limb(g, r, [[sh[0], sh[1]], [upMid[0], upMid[1]], [el[0], el[1]], [sleeveEndW[0], sleeveEndW[1]]], [R[0], R[1], R[2] + .4, R[2] + 1.3], sleeveC, { n: 8, top: .12, bot: .1, fx: (g2) => { ch_fold(g2, [[el[0] - R[2], el[1] - 1], [el[0] + R[2], el[1] - 1.8]], .7, sleeveC, .8); } });
      const c0 = P(vLerp(a.el, a.wr, .04)), c1 = P(vLerp(a.el, a.wr, .14));
      ch_limb(g, r, [[c0[0], c0[1]], [c1[0], c1[1]]], [R[2] + 1.4, R[2] + 1.3], mul(sleeveC, 1.06), { n: 2, inka: .7, fx: (g2) => ch_fold(g2, [[c0[0] - 2, (c0[1] + c1[1]) / 2], [c0[0] + 2, (c0[1] + c1[1]) / 2 + .4]], .5, sleeveC, .9) });
    } else {
      ch_limb(g, r, [[sh[0], sh[1]], [upMid[0], upMid[1]], [el[0], el[1]], [fore[0], fore[1]], [wr[0], wr[1]]], R, sleeveC, { n: 12, top: .12, bot: .12, fx: (g2) => {
        // elbow creases and armpit drag
        const bend = (() => { const d1 = vNorm(vSub(a.el, a.sh)), d2 = vNorm(vSub(a.wr, a.el)); return Math.acos(clamp(vDot(d1, d2), -1, 1)); })();
        const k = Math.min(1, .35 + bend * .9);
        ch_fold(g2, [[el[0] - R[2] * .9, el[1] - 2.4], [el[0], el[1] - .6], [el[0] + R[2] * .8, el[1] - 2]], .75, sleeveC, k);
        ch_fold(g2, [[el[0] - R[2] * .6, el[1] + 1.8], [el[0] + R[2] * .7, el[1] + 2.6]], .6, sleeveC, k * .8);
        ch_fold(g2, [[sh[0], sh[1] + 4], [upMid[0] + .6, upMid[1] + 2]], .6, sleeveC, .5);
        if (OF.stripe) ch_stroke(g2, [[sh[0] + (sh[0] > el[0] ? 1 : -1) * R[0] * .5, sh[1] + 1], [el[0] + (sh[0] > el[0] ? 1 : -1) * R[2] * .7, el[1]], [wr[0] + (sh[0] > el[0] ? 1 : -1) * R[4] * .6, wr[1] - 1]], 1.1, OF.stripe, .9);
        if (OF.knit) { const c0 = P(vLerp(a.el, a.wr, .82)); for (let i = 0; i < 4; i++) { const q = vLerp([c0[0], c0[1]], [wr[0], wr[1]], i / 4); ch_stroke(g2, [[q[0] - R[4], q[1]], [q[0] + R[4], q[1] + .4]], .35, ch_tones(sleeveC).core, .5); } }
        if (OF.o === 'uniform') { const c0 = P(vLerp(a.el, a.wr, .86)); ch_stroke(g2, [[c0[0] - R[4] - .4, c0[1]], [c0[0] + R[4] + .4, c0[1] + .5]], .7, accC, .8); }
      } });
      if (OF.cuff && a.hand !== 'hidden') { const c0 = P(vLerp(a.el, a.wr, .97)), c1 = P(vAdd(a.wr, vMul(vNorm(vSub(a.wr, a.el)), 1.2))); ch_limb(g, r, [[c0[0], c0[1]], [c1[0], c1[1]]], [B.rWr + .5, B.rWr + .4], OF.cuff, { n: 1, inka: .5 }); }
    }
    // uniform epaulette / shoulder seam
    if (OF.o === 'uniform') { const e0 = P(ub([a.s * (B.shW * .55), B.hs + H * .016, 0])), e1 = P(ub([a.s * (B.shW + 1.5), B.hs + 1, 0])); ch_stroke(g, [[e0[0], e0[1]], [e1[0], e1[1]]], 2.2, mul(accC, .8), .95); ch_stroke(g, [[e0[0], e0[1] - .5], [e1[0], e1[1] - .6]], .6, ch_tones(accC).hi, .5); }
    // armband on the left upper arm
    if (L.extra === 'armband' && a.s === -1) {
      const b0 = vLerp(a.sh, a.el, .3), b1 = vLerp(a.sh, a.el, .5), p0 = P(b0), p1 = P(b1), rr = R[1] + .5;
      const out = ch_limb(g, r, [[p0[0], p0[1]], [p1[0], p1[1]]], [rr, rr], [170, 32, 34], { n: 2, inka: .8, sharp: true });
      const mid = P(vAdd(vLerp(b0, b1, .5), [0, 0, 0])), facing = (a.s * V0.Rd) * -1 + .3;
      ch_dot(g, mid[0] + (sY > 0 ? -1 : 1) * rr * .25, mid[1], 1.15, [236, 222, 180], .95); ch_dot(g, mid[0] + (sY > 0 ? -1 : 1) * rr * .25, mid[1], .5, [40, 20, 20], .9);
    }
    const hd = drawHand(g, a);
    if (hd) drawItem(g, a, hd);
  };
  /* held items */
  const drawItem = (g, a, hd) => {
    const it = M.item; if (!it) return;
    const R = a.s === 1, sc = H / 174;
    if (it === 'cig' && R) {
      const base = vAdd(hd.tip, vMul(hd.sv, 1.2 * sc)), dir = vNorm(vAdd(hd.sv, [0, .35, 0])), tip = vAdd(base, vMul(dir, 6 * sc));
      const b = PE(base, 1), t = PE(tip, 1);
      ch_stroke(g, [[b[0], b[1]], [t[0], t[1]]], 1.25, [238, 232, 216], 1); ch_stroke(g, [[b[0], b[1]], [lerp(b[0], t[0], .3), lerp(b[1], t[1], .3)]], 1.25, [200, 150, 90], 1);
      ch_dot(g, t[0], t[1], .9, [255, 120, 40], 1);
      // smoke wisp: one soft curling ribbon (painted after the ink contour so it stays airy)
      const rs = RNG(M.hsh + 5), ph0 = rs() * 6, pts = [[t[0], t[1] - .8]]; let px = t[0], py = t[1] - .8;
      for (let i = 1; i <= 10; i++) { py -= 2.6 + i * .3; px += Math.sin(ph0 + i * .62) * (.5 + i * .22) + .25; pts.push(ext([px, py])); }
      post.push((g) => { g.lineCap = 'round';
        for (let k = 0; k < 3; k++) { const seg = pts.slice(Math.floor(k * 3), Math.min(pts.length, Math.floor(k * 3) + 5)); if (seg.length < 2) continue; g.strokeStyle = css([214, 220, 228], .2 - k * .05); g.lineWidth = 2.2 + k * 1.3; ch_curve(g, seg); g.stroke(); }
        g.strokeStyle = css([238, 240, 244], .32); g.lineWidth = .5; ch_curve(g, pts.slice(0, 7)); g.stroke(); ch_dot(g, t[0], t[1], 2.4, [255, 140, 60], .2); });
    } else if ((it === 'clip' && !R) || (it === 'clipLap' && R)) {
      const c = it === 'clip' ? vAdd(hd.grip, [a.s * -1, 6 * sc, 3]) : [pel[0], pel[1] + H * .075, pel[2] + B.thighL * .6];
      const ux = [1, 0, 0], vy = it === 'clip' ? vNorm([0, 1, -.35]) : vNorm([0, .25, -1]);
      const w = 11.5 * sc, h = 15.5 * sc, Q = (x, y) => PE(vAdd(vAdd(c, vMul(ux, x)), vMul(vy, y)), .5);
      const n = vCross(ux, vy), nd = n[0] * V0.Rd + n[2] * V0.Fd + n[1] * .5;
      const board = [Q(-w, -h), Q(w, -h), Q(w, h), Q(-w, h)];
      ch_fill(g, r, board, [140, 98, 60], { sharp: true, n: 3, inka: .85, inkw: .6 });
      if (nd < 0 || it === 'clipLap') {
        const paper = [Q(-w + 1.4, -h + 1.4), Q(w - 1.4, -h + 1.4), Q(w - 1.4, h - 3), Q(-w + 1.4, h - 3)];
        ch_fill(g, r, paper, [232, 226, 206], { sharp: true, n: 2, inka: .3, fx: (g2) => { for (let i = 0; i < 6; i++) { const y = -h + 4 + i * 3.4 * sc * 1.2; const p0 = Q(-w + 3, y * (it === 'clip' ? -1 : 1)), p1 = Q(w - 3 - (i % 3) * 2, y * (it === 'clip' ? -1 : 1)); ch_stroke(g2, [[p0[0], p0[1]], [p1[0], p1[1]]], .45, [60, 60, 80], .55); } } });
        const k0 = Q(-3, it === 'clip' ? h - .5 : -h + .5), k1 = Q(3, it === 'clip' ? h - .5 : -h + .5); ch_stroke(g, [[k0[0], k0[1]], [k1[0], k1[1]]], 1.6, [180, 176, 160], 1);
      }
    } else if ((it === 'book' && !R) || (it === 'bookLap' && R)) {
      if (it === 'book') {
        const c = vAdd(hd.grip, [2 * sc, 7 * sc, 2.5]), ux = [1, 0, 0], vy = vNorm([0, 1, -.15]), th = vCross(ux, vy);
        const w = 8 * sc, h = 11 * sc, Q = (x, y, z) => PE(vAdd(vAdd(vAdd(c, vMul(ux, x)), vMul(vy, y)), vMul(th, z)), .5);
        const pts = []; for (const x of [-w, w]) for (const y of [-h, h]) for (const z of [-1.6, 1.6]) pts.push(Q(x, y, z));
        ch_fill(g, r, ch_hull(pts), [96, 40, 36], { sharp: true, n: 3, inka: .85 });
        const s0 = Q(w, -h, 1.7), s1 = Q(w, h, 1.7); ch_stroke(g, [[s0[0], s0[1]], [s1[0], s1[1]]], 1, [226, 216, 186], .9);
        const t0 = Q(-w * .5, h * .4, -1.8), t1 = Q(w * .5, h * .4, -1.8); ch_stroke(g, [[t0[0], t0[1]], [t1[0], t1[1]]], .8, [214, 176, 90], .8);
      } else {
        const c = [pel[0], pel[1] + H * .08, pel[2] + B.thighL * .62];
        const pg = (side) => { const pts = []; for (const [x, y] of [[0, -6], [side * 9, -7], [side * 9.5, 6], [0, 6.5]]) pts.push(PE(vAdd(c, [x * sc, Math.abs(x) * .18 + 1, y * sc]), .5)); return pts; };
        for (const s of [-1, 1]) ch_fill(g, r, pg(s), [236, 228, 206], { sharp: true, n: 2, inka: .6, fx: (g2) => { for (let i = 0; i < 4; i++) { const p0 = P(vAdd(c, [s * 2 * sc, 1.5, (-4 + i * 2.6) * sc])), p1 = P(vAdd(c, [s * 7.5 * sc, 2.5, (-4.5 + i * 2.6) * sc])); ch_stroke(g2, [[p0[0], p0[1]], [p1[0], p1[1]]], .35, [70, 70, 80], .5); } } });
        const sp0 = P(vAdd(c, [0, 1, -6 * sc])), sp1 = P(vAdd(c, [0, 1, 6.5 * sc])); ch_stroke(g, [[sp0[0], sp0[1]], [sp1[0], sp1[1]]], .7, [90, 40, 36], .9);
      }
    } else if ((it === 'broom' || it === 'broomLean') && R) {
      const top = it === 'broom' ? vAdd(hd.grip, [2, 22 * sc, -3]) : vAdd(hd.grip, [0, 5 * sc, 0]), foot = it === 'broom' ? [pel[0] + B.hipW + 10, 4, pel[2] + 22] : [pel[0] + 4, 4, pel[2] + 46];
      const t = PE(top, 2), f = PE(foot, 2);
      ch_stroke(g, [[t[0], t[1]], [f[0], f[1]]], 2.1, INK, .8); ch_stroke(g, [[t[0], t[1]], [f[0], f[1]]], 1.4, [140, 104, 64], 1); ch_stroke(g, [[t[0] + .4, t[1]], [f[0] + .4, f[1]]], .45, [220, 180, 120], .6);
      // straw head
      const dir = vNorm(vSub(foot, top)), sd = vNorm(vCross(dir, [0, 0, 1])), hd0 = vAdd(foot, vMul(dir, -1)), pts = [];
      for (const s of [-1, 1]) { pts.push(PE(vAdd(hd0, vMul(sd, s * 3.2)), 1), PE(vAdd(vAdd(foot, [0, -4, 0]), vMul(sd, s * 9)), 1), PE(vAdd(vAdd(foot, vMul(dir, -12)), vMul(sd, s * 2.4)), 1)); }
      ch_fill(g, r, ch_hull(pts), [188, 156, 88], { n: 8, ax: [f[0] - t[0], f[1] - t[1]], inka: .8, fx: (g2) => { const b = P(vAdd(foot, vMul(dir, -9))); ch_stroke(g2, [[b[0] - 4, b[1]], [b[0] + 4, b[1] + .5]], .9, [90, 60, 30], .9); for (let k = -4; k <= 4; k++) { const q = P(vAdd(vAdd(foot, [0, -4, 0]), vMul(sd, k * 2))); ch_stroke(g2, [[b[0] + k * .5, b[1] + 1], [q[0], q[1]]], .35, [110, 80, 40], .5); } } });
    } else if (it === 'ladle' && R) {
      const top = vAdd(hd.grip, [-1, 40 * sc, 4]), b = PE(hd.grip, 2), t = PE(top, 9);
      ch_stroke(g, [[b[0], b[1] + 3], [t[0], t[1]]], 2, INK, .8); ch_stroke(g, [[b[0], b[1] + 3], [t[0], t[1]]], 1.3, [176, 178, 176], 1);
      ch_fill(g, r, ellPts(t[0] + .8, t[1] - 3, 6, 4.4, 12), [158, 162, 160], { n: 2, inka: .85, fx: (g2) => { ch_dot(g2, t[0] + 2.2, t[1] - 3.8, 1.1, [250, 250, 246], .8); g2.fillStyle = 'rgba(40,40,50,.5)'; g2.beginPath(); g2.ellipse(t[0] + .8, t[1] - 4.2, 3.4, 1.3, 0, 0, 7); g2.fill(); } });
    } else if (it === 'mic' && R) {
      const top = vAdd(hd.grip, vMul(hd.u, 0)), tt = vAdd(top, [0, 9 * sc, 2]), a1 = PE(top, 1), b1 = PE(tt, 3);
      ch_stroke(g, [[a1[0], a1[1]], [b1[0], b1[1]]], 2, [40, 40, 44], 1); ch_fill(g, r, ellPts(b1[0], b1[1] - 1, 2.2, 2.6, 10), [150, 154, 160], { n: 2, inka: .8 });
      ch_stroke(g, [[a1[0], a1[1] + 2], [a1[0] - 2, a1[1] + 20], [a1[0] + 6, -2]], .6, [30, 30, 34], .8);
    } else if (it === 'mega' && R) {
      const ax2 = vNorm([.2, -.6, 1]), base = vAdd(hd.grip, vMul(ax2, 2)), mouth = vAdd(base, vMul(ax2, 26 * sc)), sd = vNorm(vCross(ax2, [0, 1, 0])), up2 = vCross(sd, ax2), pts = [], ring = [];
      for (let i = 0; i < 12; i++) { const a2 = i / 12 * 6.2832; pts.push(PE(vAdd(base, vAdd(vMul(sd, Math.cos(a2) * 2.6), vMul(up2, Math.sin(a2) * 2.6))), 1)); const q = PE(vAdd(mouth, vAdd(vMul(sd, Math.cos(a2) * 9 * sc), vMul(up2, Math.sin(a2) * 9 * sc))), 1); pts.push(q); ring.push(q); }
      ch_fill(g, r, ch_hull(pts), [196, 186, 160], { n: 4, inka: .85, ax: [pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]] });
      const md = ax2[0] * V0.Rd + ax2[2] * V0.Fd + ax2[1] * .5; if (md > 0) ch_fill(g, r, ring, [40, 30, 30], { n: 1, inka: .6, sharp: true }); else ch_stroke(g, ring.concat([ring[0]]), 1.4, [170, 40, 34], .9);
    } else if (it === 'rope' && R) {
      const c = vAdd(hd.grip, [2, -6, 2]);
      for (let k = 0; k < 3; k++) { const pts = []; for (let i = 0; i <= 16; i++) { const a2 = i / 16 * 6.2832; pts.push(PE([c[0] + Math.cos(a2) * 1.5 + k, c[1] + Math.sin(a2) * 8, c[2] + Math.cos(a2) * 6], 1)); } ch_stroke(g, pts, 1.5, [166, 134, 88], .95); }
      const e0 = P([c[0], c[1] - 8, c[2]]); ch_stroke(g, [[e0[0], e0[1]], [e0[0] + 2, e0[1] + 12], [e0[0] - 1, e0[1] + 20]], 1.4, [166, 134, 88], .95);
    }
  };
  for (const s of [1, -1]) {
    const a = M.armJ[s], dd = (P(a.sh)[2] + P(a.el)[2] + P(a.wr)[2]) / 3 + 3 + (a.bias || 0);
    part(torsoD + (dd - torsoD), (g) => drawArm(g, a));
  }

  /* ---------- HEAD */
  const hd = M.head, hc = hd.c;
  const headView = (yw) => { const s = Math.sin(yw), c = Math.cos(yw); return { Rx: -c, Rd: s, Fx: s, Fd: c }; };
  const HV = headView(hd.yaw);
  const hp = hd.pitch, hr = hd.roll, cp = Math.cos(hp), spp = Math.sin(hp);
  const headPt = (alpha, e, rad) => {   // surface point, alpha: 0 = face front, + = character's right; e: elevation
    rad = rad || 1; const ce = Math.cos(e), taper = e < 0 ? 1 - .22 * Math.pow(-Math.sin(e), 1.6) * (B.teen ? .7 : 1) : 1;
    let la = hd.hw * rad * ce * Math.sin(alpha) * taper, up = hd.hh * rad * Math.sin(e), fw = hd.hd * rad * ce * Math.cos(alpha) * taper * (Math.cos(alpha) > 0 ? 1 : 1.06);
    const u2 = up * cp - fw * spp, f2 = up * spp + fw * cp;   // pitch (nod forward = +)
    const l2 = la * Math.cos(hr) - u2 * Math.sin(hr), u3 = la * Math.sin(hr) + u2 * Math.cos(hr);
    return [hc[0] + l2 * HV.Rx / -1 * -1, u3, f2, l2];
  };
  const toS = (q) => { // q: [_, up, fw, lat] head-local rotated -> screen
    const la = q[3], up = q[1], fw = q[2], x = la * HV.Rx + fw * HV.Fx, d = la * HV.Rd + fw * HV.Fd, c0 = P(hc);
    return [c0[0] + x, c0[1] - up + d * CH_DK, c0[2] + d];
  };
  const HS = (alpha, e, rad) => toS(headPt(alpha, e, rad));
  const hVis = (alpha, e) => { const n = headPt(alpha, e, 1); const nl = [n[3] / hd.hw, n[1] / hd.hh, n[2] / hd.hd]; return nl[0] * HV.Rd + nl[2] * HV.Fd + nl[1] * .45; };
  const hsN = L.hairStyle || 'short';
  const headC = P(hc);
  const rxV = Math.sqrt(Math.pow(hd.hw * Math.cos(hd.yaw), 2) + Math.pow(hd.hd * Math.sin(hd.yaw), 2));
  const headSil = () => {   // projected silhouette from many surface samples (convex hull)
    const pts = []; for (let i = 0; i < 16; i++) for (const e of [-1.45, -1.05, -.6, 0, .6, 1.1, 1.5]) pts.push(HS(i / 16 * 6.2832, e, 1));
    return ch_hull(pts).map(p => ext(p, 1));
  };
  /* hair styles: line(alpha) = lowest elevation of hair; vol = shell scale */
  const HAIR = {
    short: { vol: 1.1, line: (a) => { const c = Math.cos(a); return c > .55 ? .5 - (1 - c) * .5 : c > -.3 ? .1 + (c - .55) * .1 : -.55; } },
    slick: { vol: 1.06, line: (a) => { const c = Math.cos(a); return c > .5 ? .58 : c > -.3 ? .18 : -.5; } },
    buzz: { vol: 1.025, line: (a) => { const c = Math.cos(a); return c > .55 ? .55 : c > -.3 ? .2 : -.45; } },
    curly: { vol: 1.26, line: (a) => { const c = Math.cos(a); return c > .55 ? .36 : c > -.3 ? .0 : -.6; } },
    long: { vol: 1.1, line: (a) => { const c = Math.cos(a); return c > .6 ? .48 : c > -.2 ? .25 : -.7; } },
    bob: { vol: 1.13, line: (a) => { const c = Math.cos(a); return c > .62 ? .3 : c > -.2 ? .1 : -.75; } },
    bun: { vol: 1.05, line: (a) => { const c = Math.cos(a); return c > .55 ? .5 : c > -.3 ? .2 : -.5; } },
    braid: { vol: 1.05, line: (a) => { const c = Math.cos(a); return c > .55 ? .5 : c > -.3 ? .22 : -.5; } },
    cap: { vol: 1.04, line: (a) => { const c = Math.cos(a); return c > .55 ? .55 : c > -.3 ? .1 : -.45; } },
    bald: { vol: 1.03, line: (a) => { const c = Math.cos(a); return c > .2 ? 9 : c > -.3 ? -.05 : -.35; }, top: (a) => { const c = Math.cos(a); return c > .2 ? -9 : c > -.3 ? .32 : .45; } }
  };
  const HST = HAIR[hsN] || HAIR.short;
  const thin = B.old ? .85 : 1;
  const hairT = ch_tones(hairC);
  // visible arc of a hairline (as screen polyline) over view angles beta in [-90,90]
  const hairArc = (lineFn, rad) => {
    const pts = []; for (let i = 0; i <= 14; i++) { const beta = -Math.PI / 2 + i / 14 * Math.PI, alpha = hd.yaw - beta; const e = clamp(lineFn(alpha), -1.5, 1.5); pts.push(HS(alpha, e, rad)); }
    return pts;
  };
  const clipAbove = (g, arc, up) => { // clip to region above (up=1) or below (up=-1) the arc
    const BIG = 80, a0 = arc[0], a1 = arc[arc.length - 1];
    g.beginPath(); g.moveTo(a0[0], a0[1]); for (const p of arc) g.lineTo(p[0], p[1]);
    // ensure the arc runs left->right or right->left consistently: extend outward horizontally
    const dir = a1[0] >= a0[0] ? 1 : -1;
    g.lineTo(a1[0] + dir * BIG, a1[1]); g.lineTo(a1[0] + dir * BIG, a1[1] - up * BIG); g.lineTo(a0[0] - dir * BIG, a0[1] - up * BIG); g.lineTo(a0[0] - dir * BIG, a0[1]); g.closePath(); g.clip();
  };
  const strands = (g, n, col, rad, len) => {   // hair strands flowing from the crown
    const crown = HS(Math.PI * .85, 1.2, rad), Tt = ch_tones(col);
    g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const al = (r() - .5) * 2 * Math.PI, e = -.6 + r() * 1.9, p = HS(al, Math.min(1.45, e), rad * 1.01), q = HS(al, Math.min(1.5, e + (len || .5)), rad * 1.01);
      const lt = r() < .45, cc = lt ? (p[0] > headC[0] ? Tt.lt : Tt.base) : Tt.core;
      g.strokeStyle = css(cc, lt ? .45 : .5); g.lineWidth = .35 + r() * .45;
      g.beginPath(); g.moveTo(q[0], q[1]); g.quadraticCurveTo(lerp(p[0], q[0], .5) + (r() - .5) * 1.2, lerp(p[1], q[1], .5), p[0], p[1]); g.stroke();
    }
    // sheen on the lit side of the crown
    const s0 = HS(hd.yaw - .9, .75, rad * 1.01), s1 = HS(hd.yaw - .35, .98, rad * 1.01);
    g.strokeStyle = css(Tt.hi, .38); g.lineWidth = 1.4; g.beginPath(); g.moveTo(s0[0], s0[1]); g.quadraticCurveTo((s0[0] + s1[0]) / 2 + .6, (s0[1] + s1[1]) / 2 - .8, s1[0], s1[1]); g.stroke();
  };
  const drawHairShell = (g) => {
    if (hsN === 'bald') {   // horseshoe fringe band
      if (lum(hairC) < 30 && !B.old) return;
      const rad = 1.03;
      g.save(); const sil = []; for (let i = 0; i < 16; i++) for (const e of [-1, -.5, 0, .5, 1, 1.4]) sil.push(HS(i / 16 * 6.2832, e, rad)); ch_path(g, ch_hull(sil)); g.clip();
      clipAbove(g, hairArc(HST.line, rad), 1); clipAbove(g, hairArc(HST.top, rad), -1);
      const bb = ch_bb(sil); g.fillStyle = ch_grad(g, bb[0], 0, bb[2], 0, hairC); g.fillRect(bb[0] - 2, bb[1] - 2, bb[2] - bb[0] + 4, bb[3] - bb[1] + 4);
      strands(g, 10, hairC, rad, .3); g.restore(); return;
    }
    const rad = HST.vol * (B.old && hsN !== 'buzz' ? .985 : 1);
    const sil = []; for (let i = 0; i < 20; i++) for (const e of [-1.2, -.8, -.4, 0, .4, .8, 1.2, 1.55]) { let rr = rad; if (hsN === 'curly') rr *= 1 + .07 * Math.sin(i * 2.7 + e * 5); sil.push(HS(i / 20 * 6.2832, e, rr)); }
    if (hsN === 'curly') { // bumpy outline: keep hull but add clumps later
    }
    const hull = ch_hull(sil).map(p => ext(p, 1.5));
    g.save(); ch_path(g, hull); g.clip(); clipAbove(g, hairArc(HST.line, rad), 1);
    const bb = ch_bb(hull), hcol = hsN === 'buzz' ? mix(hairC, skin, .42) : hairC;
    g.fillStyle = ch_grad(g, bb[0], bb[1] + 4, bb[2], bb[1], hcol); g.fillRect(bb[0] - 2, bb[1] - 2, bb[2] - bb[0] + 4, bb[3] - bb[1] + 4);
    if (hsN === 'buzz') { const rs = RNG(M.hsh); for (let i = 0; i < 70; i++) { const x = bb[0] + rs() * (bb[2] - bb[0]), y = bb[1] + rs() * (bb[3] - bb[1]); ch_dot(g, x, y, .3, rs() < .5 ? mul(hairC, .8) : ch_tones(hairC).lt, .5); } }
    else if (hsN === 'curly') {
      const rs = RNG(M.hsh + 3);
      for (let i = 0; i < 46; i++) { const al = rs() * 6.2832, e = -.5 + rs() * 2.1, q = HS(al, Math.min(1.5, e), rad * 1.02); if (hVis(al, Math.min(1.5, e)) < -.1) continue; const lit = q[0] > headC[0] - 1; g.strokeStyle = css(lit && rs() < .6 ? hairT.lt : hairT.core, .55); g.lineWidth = .55; g.beginPath(); g.arc(q[0], q[1], .9 + rs() * .9, rs() * 6, rs() * 6 + 3.6); g.stroke(); }
    } else strands(g, hsN === 'slick' ? 26 : 20 * thin, hairC, rad, hsN === 'slick' ? .9 : .55);
    if (hsN === 'slick') { for (let k = 0; k < 4; k++) { const a0 = hd.yaw - .5 + k * .32, p0 = HS(a0, .45, rad), p1 = HS(a0 + .1, 1.2, rad), p2 = HS(a0 + .3, 1.45, rad); ch_stroke(g, [[p0[0], p0[1]], [p1[0], p1[1]], [p2[0], p2[1]]], .55, hairT.hi, .55); } }
    g.restore();
    ch_path(g, hull); g.save(); g.clip(); clipAbove(g, hairArc(HST.line, rad), 1); ch_path(g, hull); g.strokeStyle = css(INK, .6); g.lineWidth = .6; g.stroke(); g.restore();
    if (hsN === 'curly') { // clumps on the silhouette
      const rs = RNG(M.hsh + 9);
      for (let i = 0; i < 14; i++) { const al = i / 14 * 6.2832, e = .3 + rs() * 1.1; if (hVis(al, e) < -.35 || HST.line(al) > e) continue; const q = HS(al, e, rad * 1.05); ext(q, 3); ch_fill(g, rs, ellPts(q[0], q[1], 1.8 + rs(), 1.7 + rs() * .8, 8), jit(hairC, rs, .1), { n: 2, sw: .6, inka: .45, inkw: .4 }); }
    }
  };
  const drawBackHair = (g) => {
    const hairCol = hairC, rad = HST.vol;
    if (hsN === 'long' || hsN === 'bob') {
      const endY = hsN === 'long' ? -hd.hh * 1.0 - H * .1 : -hd.hh * 1.05, wb = hsN === 'long' ? 1.3 : 1.18;
      const pts = [];
      for (let i = 0; i <= 12; i++) { const a = Math.PI * .42 + i / 12 * Math.PI * 1.16; pts.push(HS(a, .1, rad)); pts.push(HS(a, .6, rad)); }
      // hanging part: points below the head at the back
      const down = (lat, fw) => { const q = headPt(0, 0, 1); return toS([0, endY, fw * hd.hd, lat * hd.hw]); };
      for (const lat of [-wb, -.6, 0, .6, wb]) pts.push(down(lat, -.55 - (Math.abs(lat) < .7 ? .25 : 0)));
      for (const lat of [-wb * .95, wb * .95]) pts.push(down(lat, .05));
      const hull = ch_hull(pts.map(p => ext(p, 1)));
      ch_fill(g, r, hull, mul(hairCol, .9), { ax: [0, 1], n: 18, sw: .8, sl: 8, inka: .6, fx: (g2) => { const bb = ch_bb(hull); for (let i = 0; i < 18; i++) { const x = bb[0] + r() * (bb[2] - bb[0]); ch_stroke(g2, [[x, bb[1] + 2], [x + (r() - .5) * 2, bb[3] - r() * 3]], .45, r() < .5 ? hairT.core : hairT.lt, .4); } } });
    } else if (hsN === 'bun') {
      const q = HS(Math.PI, .72, 1.12), rr = hd.hh * .38; ext(q, rr + 1);
      ch_fill(g, r, ellPts(q[0], q[1] - rr * .3, rr, rr * .9, 12), hairCol, { n: 6, sw: .7, inka: .65, fx: (g2) => { for (let k = 0; k < 5; k++) { g2.strokeStyle = css(k % 2 ? hairT.lt : hairT.core, .5); g2.lineWidth = .5; g2.beginPath(); g2.arc(q[0], q[1] - rr * .3, rr * (.3 + k * .14), 3.6 + k, 5.6 + k); g2.stroke(); } } });
    }
  };
  const drawBraid = (g) => {
    if (hsN !== 'braid') return;
    const a0 = headPt(1.9, -.15, 1.02), p0 = toS(a0), sh = ub([B.shW * .5, B.hs + 3, 3]), ch = ub([B.shW * .42, H * .19, B.chestD + 2.5]);
    const pts = [p0, P(sh), P(ch)], tCol = hairC, n = 7;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), seg = t < .4 ? vLerp([p0[0], p0[1]], [P(sh)[0], P(sh)[1]], t / .4) : vLerp([P(sh)[0], P(sh)[1]], [P(ch)[0], P(ch)[1]], (t - .4) / .6);
      const rr = 2.5 - t * .7; ext(seg, rr + 1);
      ch_fill(g, r, ellPts(seg[0] + (i % 2 ? .5 : -.5), seg[1], rr, rr * 1.15, 10), i % 2 ? mul(tCol, 1.05) : tCol, { n: 2, sw: .6, inka: .6, inkw: .4 });
    }
    const end = P(ch); ch_dot(g, end[0], end[1] + 2.6, 1.4, accC); ch_stroke(g, [[end[0] - .6, end[1] + 3.6], [end[0] - 1, end[1] + 6.5]], 1, tCol, .9); ch_stroke(g, [[end[0] + .5, end[1] + 3.6], [end[0] + .9, end[1] + 6.2]], 1, tCol, .9);
  };
  const drawFace = (g) => {
    const closed = M.lie || M.hang, T = ch_tones(skin), dark = T.core;
    const vis = (al, e) => clamp(hVis(al, e) * 2.2, 0, 1);
    // eye sockets
    for (const s of [1, -1]) {
      const al = s * .42, v = vis(al, .02); if (v <= .05) continue;
      const q = HS(al, .02, .98), w = 2.1 * Math.max(.35, Math.cos(hd.yaw - al)) * (hd.hw / 7.6);
      g.fillStyle = css(mix(T.sh, [60, 40, 60], .2), .32 * v); g.beginPath(); g.ellipse(q[0], q[1] + .1, w * 1.25, 1.6, 0, 0, 7); g.fill();
      // brow ridge light
      const br = HS(al, .2, 1.01); g.fillStyle = css(T.lt, .25 * v); g.beginPath(); g.ellipse(br[0], br[1], w, .7, 0, 0, 7); g.fill();
      if (!closed) {
        g.fillStyle = css(mix([226, 220, 206], T.base, .3), .9 * v); g.beginPath(); g.ellipse(q[0], q[1] + .1, w * .75, .55, 0, 0, 7); g.fill();
        const ir = HS(al - .04 * Math.sin(hd.yaw - al) * 0, .0, 1.0); ch_dot(g, ir[0] + (sY > 0 ? .25 : -.25) * Math.abs(Math.sin(hd.yaw)), ir[1] + .15, .55, [34, 26, 26], .95 * v);
        ch_dot(g, ir[0] + .3, ir[1] - .1, .18, [255, 250, 240], .7 * v);
      }
      ch_stroke(g, [[q[0] - w * .85, q[1] + (closed ? .3 : -.1)], [q[0], q[1] - (closed ? -.4 : .55)], [q[0] + w * .85, q[1] + (closed ? .3 : -.05)]], .45, [30, 22, 24], .85 * v);
      if (B.old) ch_stroke(g, [[q[0] - w * .6, q[1] + 1.4], [q[0] + w * .6, q[1] + 1.3]], .3, dark, .35 * v);
      // brows
      const b0 = HS(s * .2, .22 + (B.old ? -.02 : 0), 1.03), b1 = HS(s * .4, .27, 1.03), b2 = HS(s * .66, .21, 1.02);
      if (vis(s * .4, .25) > .1) ch_stroke(g, [[b0[0], b0[1]], [b1[0], b1[1]], [b2[0], b2[1]]], B.fem ? .55 : .8, mix(mul(hairC, .7), [30, 24, 24], .3), .9 * vis(s * .4, .25));
    }
    // nose: bridge, side shadow, tip highlight
    const nb = HS(0, .06, 1.02), nt = HS(0, -.3, 1.2), nbase = HS(0, -.38, 1.04);
    const nl = HS(-.17, -.33, 1.02), nr = HS(.17, -.33, 1.02);
    const nVis = vis(0, -.2);
    if (nVis > .02 || Math.abs(Math.sin(hd.yaw)) > .5) {
      const poly = [nb, nt, nbase, Math.sin(hd.yaw) > 0 ? nr : nl];
      ch_fill(g, r, poly.map(p => [p[0], p[1]]), mix(skin, T.lt, .2), { n: 1, sharp: false, ink: false });
      const shSide = nt[0] < nb[0] ? nr : nl;
      ch_stroke(g, [[nb[0], nb[1] + .6], [lerp(nt[0], shSide[0], .4) - .2, nt[1] - .4], [nbase[0], nbase[1]]], .55, dark, .55);
      ch_dot(g, nt[0] + .35, nt[1] - .1, .45, T.hi, .55); ch_dot(g, nbase[0] - .2, nbase[1] + .5, .6, mul(T.core, .8), .45);
      if (Math.abs(Math.sin(hd.yaw)) > .55) { ch_poly(g, [[nb[0], nb[1]], [nt[0], nt[1]], [nbase[0], nbase[1]]]); g.strokeStyle = css(INK, .55); g.lineWidth = .45; g.stroke(); }
    }
    // mouth
    const mv = vis(0, -.56);
    if (mv > .05) {
      const m0 = HS(-.27, -.56, 1.0), m1 = HS(0, -.585, 1.04), m2 = HS(.27, -.56, 1.0), lip = HS(0, -.66, 1.03);
      const mc = mix(mul(T.core, .9), [120, 40, 40], .35);
      ch_stroke(g, [[m0[0], m0[1]], [m1[0], m1[1]], [m2[0], m2[1]]], .55, mc, .85 * mv);
      ch_dot(g, lip[0] + .3, lip[1], .6, T.lt, .35 * mv); ch_dot(g, lip[0], lip[1] + .9, .9, T.sh, .22 * mv);
      if (B.old) for (const s of [1, -1]) { if (vis(s * .3, -.45) < .2) continue; const a = HS(s * .2, -.33, 1.02), b = HS(s * .32, -.6, 1.0); ch_stroke(g, [[a[0], a[1]], [b[0], b[1]]], .35, dark, .4); }
    }
    // cheeks (warm), chin light, jaw shade on the shadow side
    for (const s of [1, -1]) { const v = vis(s * .55, -.25); if (v < .1) continue; const q = HS(s * .55, -.25, 1); g.fillStyle = css([226, 110, 96], (B.teen ? .2 : .12) * v); g.beginPath(); g.ellipse(q[0], q[1], 1.8, 1.2, 0, 0, 7); g.fill(); }
    const ch2 = HS(0, -.84, 1); if (vis(0, -.8) > .1) ch_dot(g, ch2[0] + .4, ch2[1] - .3, 1, T.lt, .25);
    if (B.old) { for (let k = 0; k < 2; k++) { const a = HS(-.3, .42 + k * .1, 1.02), b = HS(.3, .42 + k * .1, 1.02); if (vis(0, .45) > .3) ch_stroke(g, [[a[0], a[1]], [b[0], b[1]]], .3, dark, .3); } }
    if (B.b === 2 || B.old) { const q = HS(0, -1.05, .98); if (vis(0, -.9) > .1) ch_stroke(g, [HS(-.5, -.95, .98), q, HS(.5, -.95, .98)].map(p => [p[0], p[1]]), .5, dark, .35); }
    // stubble / five o'clock shadow for adult men with short dark hair
    if (!B.fem && !B.teen && (id === 'brune' || id === 'osk' || id === 'gregor' || id === 'dov' || id === 'tomas')) { g.save(); g.globalAlpha = .18; for (const s of [1, -1]) { const q = HS(s * .45, -.62, 1); g.fillStyle = css(mix(hairC, T.sh, .5)); g.beginPath(); g.ellipse(q[0], q[1], 2.2, 2, 0, 0, 7); g.fill(); } g.restore(); }
  };
  const drawEars = (g) => {
    for (const s of [1, -1]) {
      const al = s * 1.5, v = hVis(al, -.05);
      if (v < -.25) continue;
      if ((hsN === 'long' || hsN === 'bob') && true) continue;
      const q = HS(al, -.08, 1.0), w = 1.1 * Math.max(.25, Math.abs(Math.sin(hd.yaw - al))) + .35;
      ch_fill(g, r, ellPts(q[0], q[1], w, hd.hh * .22, 10), mix(skin, [220, 120, 100], .12), { n: 1, inka: .45, inkw: .4, flat: .5, fx: (g2) => { ch_stroke(g2, [[q[0] - w * .2, q[1] - 1.5], [q[0] + w * .25, q[1] + .3], [q[0] - w * .1, q[1] + 1.6]], .4, ch_tones(skin).core, .6); } });
    }
  };
  const drawSideHair = (g) => {   // bob/long curtains in front of the ears; fringe flicks
    if (hsN === 'long' || hsN === 'bob') {
      for (const s of [1, -1]) {
        const al = s * 1.25; if (hVis(al, -.2) < -.45) continue;
        const endE = hsN === 'bob' ? -1.0 : -1.25, pts = [];
        for (const e of [.5, 0, -.5, endE]) pts.push(HS(al - s * .15, e, HST.vol * 1.02));
        for (const e of [endE, -.5, 0, .5]) pts.push(HS(al + s * .5, e, HST.vol * 1.04));
        if (hsN === 'long') { const lo = HS(al + s * .25, -1.3, HST.vol); pts.push([lo[0], lo[1] + H * .07]); }
        const hull = ch_hull(pts.map(p => ext(p, 1)));
        ch_fill(g, r, hull, hairC, { ax: [0, 1], n: 6, sw: .6, sl: 6, inka: .55, fx: (g2) => { const bb = ch_bb(hull); for (let i = 0; i < 6; i++) { const x = bb[0] + r() * (bb[2] - bb[0]); ch_stroke(g2, [[x, bb[1]], [x + (r() - .5), bb[3]]], .4, r() < .5 ? hairT.core : hairT.lt, .45); } } });
      }
      if (hsN === 'bob' && hVis(0, .35) > 0) { // straight fringe
        const pts = []; for (let i = 0; i <= 8; i++) { const a = -.95 + i / 8 * 1.9; pts.push(HS(a, .26, HST.vol * 1.02)); } for (let i = 8; i >= 0; i--) { const a = -.95 + i / 8 * 1.9; pts.push(HS(a, .62, HST.vol * 1.04)); }
        ch_fill(g, r, pts, hairC, { n: 4, sw: .5, inka: .5, ax: [0, 1] });
      }
    }
    if ((hsN === 'short' || hsN === 'curly') && hVis(0, .5) > 0) {   // a few loose strands over the forehead
      for (let k = 0; k < 4; k++) { const a = hd.yaw * 0 + (-.4 + k * .27), p0 = HS(a, .7, HST.vol), p1 = HS(a + .1, .42 - r() * .08, 1.02); ch_stroke(g, [[p0[0], p0[1]], [p1[0], p1[1]]], .6, k % 2 ? hairT.base : hairT.core, .85); }
    }
  };
  const drawHat = (g) => {
    const capped = hsN === 'cap' || id === 'brune';
    if (!capped) return;
    const peaked = id === 'brune', col = peaked ? mix(oc, [30, 30, 40], .3) : mix(oc, [70, 60, 50], .35);
    const crown = []; for (let i = 0; i < 16; i++) for (const e of [.3, .7, 1.1, 1.45]) crown.push(HS(i / 16 * 6.2832 + .1, e, (peaked ? 1.16 : 1.14) + (e > 1 ? (peaked ? .14 : .02) : 0)));
    const ch = ch_hull(crown.map(p => [p[0], p[1] - (peaked ? 1.6 : 0)]).map(p => ext(p, 1)));
    // brim (front)
    const brim = []; for (let i = 0; i <= 10; i++) { const a = -1.25 + i / 10 * 2.5; brim.push(HS(a, .36, 1.16)); } for (let i = 10; i >= 0; i--) { const a = -1.0 + i / 10 * 2.0, q = headPt(a, .3, 1.55); brim.push(toS([0, q[1] - 1, q[2] + 1.5, q[3]])); }
    const brimVis = hVis(0, .3) > -.3;
    if (!brimVis) ch_fill(g, r, brim.map(p => ext(p, 1)), mul(col, .7), { n: 2, inka: .8, sharp: true });
    ch_fill(g, r, ch, col, { ax: [0, 1], n: 8, sw: 1, inka: .75, fx: (g2) => { const b = ch_bb(ch); if (peaked) { const band = ringH(.4, 1.16); ch_stroke(g2, band, 2, [30, 26, 26], .9); } else ch_stroke(g2, [[b[0] + 1, b[1] + 3], [b[2] - 2, b[1] + 2]], .6, ch_tones(col).lt, .5); } });
    if (brimVis) { ch_fill(g, r, brim.map(p => ext(p, 1)), mul(col, peaked ? .5 : .85), { n: 2, inka: .8, sharp: true }); }
    if (peaked && hVis(0, .7) > 0) { const q = HS(0, .72, 1.3); ch_dot(g, q[0], q[1], 1.3, [214, 180, 90]); ch_dot(g, q[0], q[1], .6, [170, 40, 40]); }
  };
  const ringH = (e, rad) => { const pts = []; for (let i = 0; i <= 16; i++) { const a = hd.yaw - Math.PI / 2 + i / 16 * Math.PI; pts.push(HS(a, e, rad)); } return pts.map(p => [p[0], p[1]]); };
  const drawGlasses = (g) => {
    if (!L.glasses) return;
    const col = [30, 26, 28];
    const eyes = [];
    for (const s of [1, -1]) {
      const al = s * .42, v = hVis(al, .02);
      const q = HS(al, .02, 1.1), cosb = Math.cos(hd.yaw - al), w = 2.3 * Math.max(.18, cosb) + .3;
      if (cosb > -.05 && v > -.1) { g.strokeStyle = css(col, .95); g.lineWidth = .5; g.beginPath(); g.ellipse(q[0], q[1], w, 1.75, 0, 0, 7); g.stroke(); eyes.push(q);
        g.strokeStyle = css([255, 252, 236], .85); g.lineWidth = .5; g.beginPath(); g.moveTo(q[0] + w * .1, q[1] - 1.1); g.lineTo(q[0] + w * .65, q[1] - .3); g.stroke(); }
      const t0 = HS(s * .95, .05, 1.05), t1 = HS(s * 1.5, .0, 1.04);
      if (hVis(s * 1.25, .05) > -.3) ch_stroke(g, [[t0[0], t0[1]], [t1[0], t1[1]]], .45, col, .9);
    }
    if (hVis(0, .03) > 0) { const a = HS(-.2, .05, 1.1), b = HS(.2, .05, 1.1); ch_stroke(g, [[a[0], a[1]], [b[0], b[1]]], .45, col, .95); }
  };
  const drawHead = (g) => {
    const sil = headSil();
    // hair shell (behind the face), then the face over it
    if (hsN !== 'bald') drawHairShell(g);
    // skin
    g.save();
    if (hsN !== 'bald') { ch_path(g, sil); g.clip(); clipAbove(g, hairArc(HST.line, 1.0), -1); }
    const bb = ch_bb(sil);
    ch_fill(g, r, sil, skin, { ax: [0, 1], sx: 0, n: 8, sw: 1, sl: 5, top: .08, bot: .2, inka: .7, inkw: .55, fx: (g2) => {
      // planes of the face: shade the side away from the light, temple + under-cheek shadow
      const fc = HS(0, -.2, 1), sideSh = HS(Math.sin(hd.yaw) > 0 ? .9 : -.9, -.3, 1);
      g2.fillStyle = css(ch_tones(skin).sh, .18); g2.beginPath(); g2.ellipse(Math.min(fc[0], sideSh[0]) - 1, fc[1], 3.4, 5, 0, 0, 7); g2.fill();
    } });
    g.restore();
    if (hsN === 'bald') { drawHairShell(g); const q = HS(hd.yaw - .5, 1.0, 1.0); ch_dot(g, q[0] + .8, q[1], 1.8, [255, 240, 214], .35); ch_dot(g, q[0] + 1, q[1] - .2, .8, [255, 248, 230], .5); }
    if (cY > -.05 || Math.abs(sY) > .3) drawFace(g);
    drawEars(g);
    drawSideHair(g);
    drawGlasses(g);
    drawHat(g);
    if (M.hang) { ch_path(g, sil); g.fillStyle = 'rgba(10,10,24,.42)'; g.fill(); }
  };
  // back hair & braid & head parts
  const backD = headC[2] - hd.hd * (cY > 0 ? 1.4 : -1.4) * 1;
  if (hsN === 'long' || hsN === 'bob' || hsN === 'bun') part(cY > 0 ? Math.min(backD, torsoD - 1) : backD + 50, drawBackHair);
  if (hsN === 'braid') part(cY > -.2 ? headC[2] + 8 : torsoD - 2, drawBraid);
  part(Math.max(headC[2], torsoD + .5) + (cY >= 0 ? 0 : 0) + 2.2, drawHead);

  /* ---------- FURNITURE: chair / wheelchair / hanging rope */
  if (M.sit && !M.wheel) {
    const seat = H * .265, f0 = pel[2] - B.hipD - 2, f1 = pel[2] + B.thighL * .7, wd = B.hipW + 5, wood = [104, 70, 44];
    const SP = (a, y, f) => PE([a, y, f], 1);
    const seatPoly = [SP(-wd, seat, f0), SP(wd, seat, f0), SP(wd, seat, f1), SP(-wd, seat, f1)];
    const legsC = [[-wd + 1.5, f0 + 1.5], [wd - 1.5, f0 + 1.5], [wd - 1.5, f1 - 1.5], [-wd + 1.5, f1 - 1.5]];
    const backTop = seat + H * .27;
    const chairBack = (g) => { for (const s of [-1, 1]) { const a = SP(s * (wd - 1.5), seat, f0 + .5), b = SP(s * (wd - 1.8), backTop, f0 - 2.5); ch_stroke(g, [[a[0], a[1]], [b[0], b[1]]], 2.2, wood, 1); ch_stroke(g, [[a[0], a[1]], [b[0], b[1]]], .5, INK, .5); }
      const s0 = [SP(-wd + 1, backTop - 1, f0 - 2.5), SP(wd - 1, backTop - 1, f0 - 2.5), SP(wd - 1, backTop - 8, f0 - 2), SP(-wd + 1, backTop - 8, f0 - 2)]; ch_fill(g, r, s0, mul(wood, 1.1), { sharp: true, n: 4, inka: .8, ax: [1, 0] }); };
    part(P([0, seat, f0 - 2])[2] - (cY > 0 ? 6 : -60), chairBack);
    part(standing ? -200 : -150, (g) => {
      for (const lc of legsC) { const a = SP(lc[0], seat, lc[1]), b = SP(lc[0], 0, lc[1]); ch_stroke(g, [[a[0], a[1]], [b[0], b[1]]], 2, mul(wood, .8), 1); ch_stroke(g, [[a[0] + .6, a[1]], [b[0] + .6, b[1]]], .5, [200, 150, 100], .4); }
      ch_fill(g, r, seatPoly, wood, { sharp: true, n: 5, inka: .85, ax: [1, 0] });
      const e0 = SP(-wd, seat - 1.5, f1), e1 = SP(wd, seat - 1.5, f1); ch_stroke(g, [[e0[0], e0[1]], [e1[0], e1[1]]], 1.8, mul(wood, .65), 1);
    });
  }
  if (M.wheel) {
    const seat = H * .285, wr = H * .175, wf = pel[2] - 3, wa = B.hipW + 6.5, steel = [150, 154, 160], dark = [34, 32, 36];
    const wheel = (s, g) => {
      const ptsO = [], ptsI = []; for (let i = 0; i <= 28; i++) { const a = i / 28 * 6.2832; ptsO.push(PE([s * wa, wr + Math.sin(a) * wr, wf + Math.cos(a) * wr], 1)); ptsI.push(P([s * (wa - .5), wr + Math.sin(a) * wr * .86, wf + Math.cos(a) * wr * .86])); }
      ch_stroke(g, ptsO, 3.2, dark, 1); ch_stroke(g, ptsO, 1, [70, 70, 76], .9); ch_stroke(g, ptsI, .7, steel, .9);
      const c = P([s * wa, wr, wf]); g.strokeStyle = css(steel, .55); g.lineWidth = .35; for (let k = 0; k < 12; k++) { const q = ptsI[Math.round(k * 28 / 12) % 28]; g.beginPath(); g.moveTo(c[0], c[1]); g.lineTo(q[0], q[1]); g.stroke(); }
      ch_dot(g, c[0], c[1], 1.2, [190, 190, 196]); const lit = ptsO.slice(18, 26); ch_stroke(g, lit, .5, [255, 200, 140], .5);
      // caster
      const cc = PE([s * (B.hipW + 3), H * .035, pel[2] + B.thighL + 8], 2); ch_fill(g, r, ellPts(cc[0], cc[1], 1.6 * Math.max(.4, Math.abs(sY)) + .5, H * .035, 10), dark, { n: 1, inka: .8 });
      const st0 = P([s * (B.hipW + 3), H * .07, pel[2] + B.thighL + 8]), st1 = P([s * (B.hipW + 3), seat - 2, pel[2] + B.thighL]); ch_stroke(g, [[cc[0], cc[1]], [st0[0], st0[1]], [st1[0], st1[1]]], .9, steel, 1);
    };
    const frame = (g) => {   // back posts, handles, seat, footrest
      for (const s of [-1, 1]) {
        const b0 = P([s * (B.hipW + 3), seat - 3, pel[2] - B.hipD - 3]), b1 = PE([s * (B.hipW + 3), seat + H * .3, pel[2] - B.hipD - 5], 1), b2 = PE([s * (B.hipW + 3), seat + H * .3 + 1, pel[2] - B.hipD - 13], 1);
        ch_stroke(g, [[b0[0], b0[1]], [b1[0], b1[1]], [b2[0], b2[1]]], 1.1, steel, 1); ch_stroke(g, [[b1[0], b1[1]], [b2[0], b2[1]]], 1.8, dark, 1);
        const a0 = P([s * (B.hipW + 3), seat + H * .1, pel[2] - B.hipD - 3]), a1 = P([s * (B.hipW + 3), seat + H * .1, pel[2] + B.thighL * .55]); ch_stroke(g, [[a0[0], a0[1]], [a1[0], a1[1]]], 1.4, dark, 1);
      }
      const bk = [P([-(B.hipW + 3), seat + 2, pel[2] - B.hipD - 3]), P([B.hipW + 3, seat + 2, pel[2] - B.hipD - 3]), P([B.hipW + 3, seat + H * .27, pel[2] - B.hipD - 4.5]), P([-(B.hipW + 3), seat + H * .27, pel[2] - B.hipD - 4.5])];
      ch_fill(g, r, bk.map(p => [p[0], p[1]]), [46, 44, 52], { sharp: true, n: 3, inka: .8, ax: [1, 0] });
    };
    const front2 = (g) => { const fp = [PE([-(B.hipW + 2), H * .06, pel[2] + B.thighL + 2], 1), PE([B.hipW + 2, H * .06, pel[2] + B.thighL + 2], 1), PE([B.hipW + 2, H * .06, pel[2] + B.thighL + 12], 1), PE([-(B.hipW + 2), H * .06, pel[2] + B.thighL + 12], 1)]; ch_fill(g, r, fp, [60, 60, 66], { sharp: true, n: 1, inka: .8 }); const sp = [P([-(B.hipW + 2), seat - 1, pel[2] - B.hipD]), P([B.hipW + 2, seat - 1, pel[2] - B.hipD]), P([B.hipW + 2, seat - 1, pel[2] + B.thighL * .8]), P([-(B.hipW + 2), seat - 1, pel[2] + B.thighL * .8])]; ch_fill(g, r, sp.map(p => [p[0], p[1]]), [40, 38, 44], { sharp: true, n: 1, inka: .7 }); };
    const nearS = (V0.Rd >= 0) ? 1 : -1;
    part(cY > 0 ? -160 : 60, frame);
    part(-150, front2);
    part(-140 + (P([-nearS * wa, wr, wf])[2]) * .01, (g) => wheel(-nearS, g));
    part(torsoD + 2.6, (g) => wheel(nearS, g));
  }
  if (M.hang) {
    const left = (yawDeg < -10 && yawDeg > -170);
    const topW = [(left ? -24 : 24) / CH_PX, -150 / CH_PX];
    part(-300, (g) => {
      const nk = P(ub([0, B.neckY - B.hipY + 1, -2])); const k0 = [nk[0] + (left ? -1 : 1) * 3, nk[1] - 3];
      ext(topW, 2);
      ch_stroke(g, [[k0[0], k0[1]], [lerp(k0[0], topW[0], .5) + 1, lerp(k0[1], topW[1], .5)], topW], 2, INK, .9);
      ch_stroke(g, [[k0[0], k0[1]], [lerp(k0[0], topW[0], .5) + 1, lerp(k0[1], topW[1], .5)], topW], 1.2, [184, 150, 100], 1);
    });
    part(1000, (g) => { // noose knot at the neck (over the collar)
      const nk = P(ub([0, B.neckY - B.hipY + 1, 0])); ch_stroke(g, [[nk[0] - B.rNeck, nk[1] + 1], [nk[0], nk[1] + 2.5], [nk[0] + B.rNeck, nk[1] + .5]], 1.5, [176, 142, 96], .9);
    });
  }

  /* ---------- paint */
  parts.sort((a, b) => a.d - b.d);
  const pad = 4, sc = CH_PX * SS;
  // run once to compute bounds (geometry registers via ext), drawing into a 1x1 scratch is wasteful -> bounds are
  // gathered by a dry pass on a cheap context recorder
  const dry = ch_dryCtx();
  for (const p of parts) p.fn(dry);
  ext([0, 0], 6);
  const W = Math.ceil((bx1 - bx0 + pad * 2) * sc), Hh = Math.ceil((by1 - by0 + pad * 2) * sc);
  const c = mk(W, Hh), g = ctx2(c), ox = (-bx0 + pad) * sc, oy = (-by0 + pad) * sc;
  g.setTransform(sc, 0, 0, sc, ox, oy);
  post.length = 0;
  for (const p of parts) p.fn(g);
  g.setTransform(1, 0, 0, 1, 0, 0);
  return { c, W, H: Hh, ox, oy, M, post, sc };
}
/* a no-op 2D context used for the bounds pass */
let ch_dryC = null;
function ch_dryCtx() {
  if (ch_dryC) return ch_dryC;
  const noop = function () {}, grad = { addColorStop: noop };
  ch_dryC = new Proxy({}, { get: (t, k) => k === 'createLinearGradient' || k === 'createRadialGradient' ? () => grad : (k in t ? t[k] : noop), set: (t, k, v) => { t[k] = v; return true; } });
  return ch_dryC;
}

/* ---------------------------------------------------------------- finishing: texture, occlusion, rim light, ink contour */
function ch_finish(src, W, H, rimCol, groundY, dark) {
  const g = ctx2(src);
  // brush texture + vertical occlusion (cool, darker towards the ground), source-atop
  g.save(); g.globalCompositeOperation = 'source-atop';
  g.fillStyle = g.createPattern(ch_tex(), 'repeat'); g.fillRect(0, 0, W, H);
  const vg = g.createLinearGradient(0, 0, 0, groundY);
  vg.addColorStop(0, 'rgba(255,220,170,.05)'); vg.addColorStop(.45, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(16,18,40,.34)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
  if (dark) { g.fillStyle = 'rgba(12,14,30,' + dark + ')'; g.fillRect(0, 0, W, H); }
  g.restore();
  const out = mk(W, H), og = ctx2(out), k = SS;
  // rim lights
  const tmp = mk(W, H), tg = ctx2(tmp);
  tg.drawImage(src, 0, 0); tg.globalCompositeOperation = 'destination-out'; tg.drawImage(src, -1.0 * k, .7 * k); tg.globalCompositeOperation = 'source-in'; tg.fillStyle = css(rimCol, .4); tg.fillRect(0, 0, W, H);
  const tmp2 = mk(W, H), t2 = ctx2(tmp2);
  t2.drawImage(src, 0, 0); t2.globalCompositeOperation = 'destination-out'; t2.drawImage(src, 1.3 * k, -.2 * k); t2.globalCompositeOperation = 'source-in'; t2.fillStyle = 'rgba(80,140,165,.3)'; t2.fillRect(0, 0, W, H);
  // ink contour (dilated silhouette)
  const R = 1.05 * k;
  for (let i = 0; i < 10; i++) { const a = i / 10 * 6.2832; og.drawImage(src, Math.cos(a) * R, Math.sin(a) * R); }
  og.globalCompositeOperation = 'source-in'; og.fillStyle = 'rgb(18,13,18)'; og.fillRect(0, 0, W, H);
  og.globalCompositeOperation = 'source-over'; og.drawImage(src, 0, 0); og.drawImage(tmp2, 0, 0); og.drawImage(tmp, 0, 0);
  return out;
}
/* lying figures: the front view laid flat along the floor (head towards the facing direction) */
function ch_lay(img, yawDeg) {
  const th = yawDeg * Math.PI / 180, hu = Math.sin(th), hv = Math.cos(th);
  // image x -> floor (-hv, hu) ; image down -> floor (-hu, -hv); floor (u,v) -> screen (u, v*.5)
  const a = -hv, b = hu * CH_DK, cc = -hu, d = -hv * CH_DK;
  const corners = [[0, 0], [img.W, 0], [img.W, img.H], [0, img.H]].map(([x, y]) => { const X = x - img.ox, Y = y - img.oy + img.M.B.H * .52 * CH_PX * SS; return [a * X + cc * Y, b * X + d * Y]; });
  const bb = ch_bb(corners), pad = 6, W = Math.ceil(bb[2] - bb[0] + pad * 2), H = Math.ceil(bb[3] - bb[1] + pad * 2);
  const c = mk(W, H), g = ctx2(c), ox = -bb[0] + pad, oy = -bb[1] + pad;
  g.setTransform(a, b, cc, d, ox, oy - 8 * CH_PX * SS);
  g.drawImage(img.c, -img.ox, -img.oy + img.M.B.H * .52 * CH_PX * SS);
  g.setTransform(1, 0, 0, 1, 0, 0);
  return { c, W, H, ox, oy, M: img.M };
}
/* soft painted ground shadow for a pose (optional extra on the sprite) */
const ch_shC = new Map();
function ch_shadow(kind, wcm) {
  const k = kind + ':' + Math.round(wcm); let s = ch_shC.get(k); if (s) return s;
  const rx = wcm * CH_PX * SS, ry = rx * (kind === 'lie' ? .45 : .36), W = Math.ceil(rx * 2.6), H = Math.ceil(ry * 2.8), c = mk(W, H), g = ctx2(c), r = RNG(k);
  const gr = g.createRadialGradient(W / 2, H / 2, 1, W / 2, H / 2, rx); gr.addColorStop(0, 'rgba(8,6,16,.55)'); gr.addColorStop(.6, 'rgba(8,6,16,.22)'); gr.addColorStop(1, 'rgba(8,6,16,0)');
  g.save(); g.translate(W / 2, H / 2); g.scale(1, ry / rx); g.translate(-W / 2, -H / 2); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
  g.lineCap = 'round'; for (let i = 0; i < 26; i++) { const a = r() * 6.28, d = r() * .8; g.strokeStyle = 'rgba(8,6,16,' + (.04 + r() * .06) + ')'; g.lineWidth = 2 + r() * 5; const x = W / 2 + Math.cos(a) * rx * d, y = H / 2 + Math.sin(a) * ry * d; g.beginPath(); g.moveTo(x - 6, y); g.lineTo(x + 6, y + (r() - .5) * 2); g.stroke(); }
  s = { c, w: W, h: H, ax: W / 2, ay: H / 2 }; ch_shC.set(k, s); return s;
}

/* ---------------------------------------------------------------- sprite cache + public API */
function figKey(L, facing, frame, id) { const pose = L.pose || 'stand'; return lookKey(L) + '#' + (id || '') + '#' + pose + '#' + facing + '#' + ((pose === 'stand' || pose === 'slump' || pose === 'lean') ? frame : 0); }
const _warmQ = [], ch_pend = new Set();
function queueFigure(look, facing, frame, pose) {
  const L = normLook(look); if (pose) L.pose = pose; const k = figKey(L, FACE_ALIAS[facing] || facing, frame || 0, ch_idOf(look));
  if (ch_pend.has(k) || _spr.has(k)) return; ch_pend.add(k); _warmQ.push([look, facing, frame, pose, k]);
}
function warmStep(maxN) {   // bake queued sprites one at a time (called with spare frame time)
  while (maxN-- > 0 && _warmQ.length) { const q = _warmQ.shift(); ch_pend.delete(q[4]); getFigure(q[0], q[1], q[2], q[3]); }
}
function ch_now() { return typeof performance !== 'undefined' ? performance.now() : Date.now(); }
/* returns a ready sprite without ever blocking on animation frames: walk frames (and the idle weight shift) fall back to
 * the idle sprite while they are baked in the background */
function figureNow(look, facing, frame, pose) {
  const L = normLook(look); if (pose) L.pose = pose; facing = FACE_ALIAS[facing] || facing; if (FACE[facing] === undefined) facing = 's';
  const id = ch_idOf(look), p = L.pose || 'stand';
  if (!frame && (p === 'stand' || p === 'lean')) {   // subtle idle variation: every few seconds a short weight shift / glance
    const ph = ((ch_now() / 1000) + (hashStr(id || lookKey(L)) % 97) * .37) % 7.5;
    if (ph > 5.6) frame = -1;
  }
  const hit = _spr.get(figKey(L, facing, frame, id)); if (hit) return hit;
  if (frame !== 0) {
    if (frame > 0) { for (let f = 1; f <= 4; f++) if (!_spr.get(figKey(L, facing, f, id))) queueFigure(look, facing, f, pose); }
    else queueFigure(look, facing, -1, pose);
    const idle = _spr.get(figKey(L, facing, 0, id)); if (idle) return idle;
    return getFigure(look, facing, 0, pose);
  }
  return getFigure(look, facing, frame, pose);
}
function getFigure(look, facing, frame, poseOver) {
  const L = normLook(look); if (poseOver) L.pose = poseOver;
  facing = FACE_ALIAS[facing] || facing; if (FACE[facing] === undefined) facing = 's';
  const pose = L.pose || 'stand', id = ch_idOf(look);
  frame = frame || 0;
  const key = figKey(L, facing, frame, id);
  let spr = _spr.get(key); if (spr) return spr;
  const anim = pose === 'stand' || pose === 'slump' || pose === 'lean';
  const fr = anim ? frame : 0, yaw = FACE[facing];
  let img;
  if (pose === 'lie') img = ch_lay(ch_render(L, id, 0, 'lie', 0, false), yaw);
  else img = ch_render(L, id, yaw, pose, fr > 0 ? fr : 0, fr < 0);
  const rim = C(look && look._rim || [255, 156, 80]);
  const out = ch_finish(img.c, img.W, img.H, rim, img.oy, pose === 'hang' ? .38 : 0);
  if (img.post && img.post.length) { const og = ctx2(out); og.setTransform(img.sc, 0, 0, img.sc, img.ox, img.oy); for (const fn of img.post) fn(og); og.setTransform(1, 0, 0, 1, 0, 0); }
  const B = img.M.B;
  spr = { c: out, ax: img.ox, ay: img.oy, w: img.W, h: img.H, hl: null, hang: null };
  if (pose === 'hang') { const left = (yaw < -10 && yaw > -170); spr.hang = { x: left ? -24 : 24, y: -150 }; }
  spr.sh = ch_shadow(pose === 'lie' ? 'lie' : (pose === 'wheelchair' || pose === 'sit') ? 'sit' : 'stand', pose === 'lie' ? B.H * .55 : pose === 'wheelchair' ? 46 : pose === 'sit' ? 38 : 30 + B.b * 4);
  _spr.set(key, spr);
  if (_spr.size > 700) { const k = _spr.keys().next().value; _spr.delete(k); }
  return spr;
}
function greenOutline(spr) {
  if (spr.hl) return spr.hl;
  const W = spr.c.width, H = spr.c.height, c = mk(W, H), g = ctx2(c), R = 2.3 * SS * .8;
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.2832; g.drawImage(spr.c, Math.cos(a) * R, Math.sin(a) * R); }
  g.globalCompositeOperation = 'source-in'; g.fillStyle = 'rgb(96,255,120)'; g.fillRect(0, 0, W, H);
  const c2 = mk(W, H), g2 = ctx2(c2); g2.globalAlpha = .35; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.2832; g2.drawImage(c, Math.cos(a) * R * 1.8, Math.sin(a) * R * 1.8); }
  g2.globalAlpha = 1; g2.drawImage(c, 0, 0);
  spr.hl = c2; return c2;
}

/* ===================================================== SCENE BAKING */
const _scenes = new Map();
const HINTS = { menu: 'chalkboard', mirror: 'mirror', notices: 'notice', notice: 'notice', speaker: 'loudspeaker', loudspeaker: 'loudspeaker', portrait: 'portrait', mat: 'mat', rope: 'rope', lockers: 'lockers', bench: 'bench', tray: 'tray', desk: 'desk', cabinet: 'vault', window: 'window', boiler: 'boiler', table: 'table', statue: 'statue', mic: 'mic', horn: 'loudspeaker', poster: 'banner', trunk: 'crate', door: 'door',
  // art2
  posters: ['banner', 'poster_wall'], poster_wall: 'poster_wall', queue: ['barrier', 'rope'], kiosk: 'kiosk', tram: 'tram_stop', gate: ['vault_door', 'fence'], relaygate: 'vault_door', car: 'car',
  console: 'console', generator: 'generator', aerial: ['antenna', 'ladder'], ropes: 'ropes', array: 'loudspeaker', view: ['window', 'railing'], vault: ['vault', 'vault_door'], bell: ['bell', 'bigbell'],
  bunk: 'bunk', hotplate: 'hotplate', footlocker: 'crate', catalog: 'catalog', globe: 'globe', stacks: ['bookshelf', 'curtain'], logbook: 'desk', stall: 'stall' };
function propRect(p) {
  const w = p.w || 1, h = p.h || 1;
  if (p.side === 'l') return { u0: 0, v0: p.y || 0, u1: 1, v1: (p.y || 0) + (p.side === 'l' ? h : w) };
  if (p.side === 'r') return { u0: p.x || 0, v0: 0, u1: (p.x || 0) + w, v1: 1 };
  return { u0: p.x || 0, v0: p.y || 0, u1: (p.x || 0) + w, v1: (p.y || 0) + h };
}
function matchProp(props, o) {
  const words = ((o.id || '').toLowerCase().split('_').slice(1).join(' ') + ' ' + (o.label || '').toLowerCase()).split(/[^a-z]+/).filter(Boolean);
  const hint = new Set(); for (const w of words) { const h = HINTS[w]; if (h) (Array.isArray(h) ? h : [h]).forEach(x => hint.add(x)); }
  let best = null, bs = 1e9; const ox = o.x + .5, oy = o.y + .5;
  props.forEach((p, i) => {
    if (p.t === 'rug' || p.t === 'plant' && !hint.has('plant')) return;
    const q = propRect(p), area = (q.u1 - q.u0) * (q.v1 - q.v0);
    const dx = Math.max(q.u0 - ox, 0, ox - q.u1), dy = Math.max(q.v0 - oy, 0, oy - q.v1), d = Math.hypot(dx, dy);
    if (d > 1.7) return;
    let s = d * 10 + Math.min(area, 20) * .2;
    if (d === 0) s -= 4;
    if (hint.has(p.t)) s -= 40; else if (hint.size && !(hint.has(p.t))) s += 6;
    if (s < bs) { bs = s; best = i; }
  });
  if (best !== null && bs < 14) return best;
  return null;
}

/* ---------------------------------------------------------------- grading
 * per-scene colour grade: contrast S-curve, saturation, split toning (tinted shadows / warm highlights).
 * gradeOf(S) -> params; gradePx(G, r, g, b, out) for a single pixel. */
function gradeOf(S) {
  const m = S.mood, b = S.bucket, night = b === 4, eve = b === 3;
  const sh = night ? mix(m.sh || [8, 24, 40], [6, 14, 52], .5) : (m.sh || [8, 24, 40]);
  const hi = eve ? mix(m.hi || [255, 190, 120], [255, 140, 70], .4) : (m.hi || [255, 190, 120]);
  return { sh, hi, sat: (m.sat || .92) * (night ? .85 : 1), con: m.con || 1.1, ws: night ? .62 : .5, wh: .2 };
}
function gradePx(G, r, g, b, o) {
  let l = (r * .3 + g * .59 + b * .11) / 255;
  const c = G.con;
  r = (r / 255 - .46) * c + .46; g = (g / 255 - .46) * c + .46; b = (b / 255 - .46) * c + .46;
  const l2 = r * .3 + g * .59 + b * .11, s = G.sat;
  r = l2 + (r - l2) * s; g = l2 + (g - l2) * s; b = l2 + (b - l2) * s;
  l = l < 0 ? 0 : l > 1 ? 1 : l;
  const ws = (1 - l) * (1 - l) * (1 - l) * G.ws, wh = l * l * l * G.wh;
  r = r * 255; g = g * 255; b = b * 255;
  r += (G.sh[0] - r) * ws + (G.hi[0] - r) * wh; g += (G.sh[1] - g) * ws + (G.hi[1] - g) * wh; b += (G.sh[2] - b) * ws + (G.hi[2] - b) * wh;
  o[0] = r; o[1] = g; o[2] = b;
}
function gradeCanvas(c, G, S) {   // via the dithered 64^3 LUT (fast)
  const g = ctx2(c), id = g.getImageData(0, 0, c.width, c.height), d = id.data, L = gradeLUT(S);
  let h = 12345;
  for (let i = 0; i < d.length; i += 4) {
    h = (h * 1103515245 + 12345) & 0x7fffffff; const dt = (h >> 16) & 3;
    let r = d[i] + dt, gg = d[i + 1] + dt, b = d[i + 2] + dt; r = r > 255 ? 255 : r; gg = gg > 255 ? 255 : gg; b = b > 255 ? 255 : b;
    const li = (((r >> 2) << 12) | ((gg >> 2) << 6) | (b >> 2)) * 3; d[i] = L[li]; d[i + 1] = L[li + 1]; d[i + 2] = L[li + 2];
  }
  g.putImageData(id, 0, 0);
}
/* 64^3 LUT of the grade (for per-frame character relighting) */
function gradeLUT(S) {
  if (S.lut) return S.lut;
  const L = new Uint8ClampedArray(64 * 64 * 64 * 3), o = [0, 0, 0], G = S.grade;
  for (let r = 0, i = 0; r < 64; r++) for (let g = 0; g < 64; g++) for (let b = 0; b < 64; b++, i += 3) { gradePx(G, r * 4.05, g * 4.05, b * 4.05, o); L[i] = o[0]; L[i + 1] = o[1]; L[i + 2] = o[2]; }
  return (S.lut = L);
}

/* --------------------------------------------------------------- light kit */
const _lspr = new Map();
function lightSprite(col) {          // soft painted falloff (quadratic core, brushy rim)
  col = C(col); const k = col.map(v => Math.round(v / 8)).join(','); let c = _lspr.get(k); if (c) return c;
  const N = 128; c = mk(N, N); const g = ctx2(c), gr = g.createRadialGradient(N / 2, N / 2, 0, N / 2, N / 2, N / 2);
  gr.addColorStop(0, css(col, 1)); gr.addColorStop(.18, css(col, .78)); gr.addColorStop(.42, css(col, .4)); gr.addColorStop(.7, css(col, .12)); gr.addColorStop(1, css(col, 0));
  g.fillStyle = gr; g.fillRect(0, 0, N, N);
  const r = RNG(k); g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 40; i++) { const a = r() * 6.28, d = N * (.15 + r() * .32); bristle(g, N / 2 + Math.cos(a) * d, N / 2 + Math.sin(a) * d, a + 1.57, r.r(14, 34), r.r(3, 8), [0, 0, 0], .12, r); }
  _lspr.set(k, c); return c;
}
function lightDraw(g, L, x, y, rx, ry, a) { g.globalAlpha = Math.min(1, a); g.drawImage(lightSprite(L), x - rx, y - ry, rx * 2, ry * 2); }
/* light influence at a screen point (0..1+) */
function lightInf(Lg, x, y) { const dx = x - Lg.x, dy = (y - Lg.y) * 1.3, d = Math.sqrt(dx * dx + dy * dy), R = Lg.r * 1.25; return d >= R ? 0 : Lg.a * (1 - d / R); }
function strongestLight(S, x, y, skipBox) {
  let best = null, bi = 0;
  for (const Lg of S.lights) {
    if (Lg.kind === 'heat') continue;
    if (skipBox && Lg.x > skipBox[0] && Lg.x < skipBox[2] && Lg.y > skipBox[1] && Lg.y < skipBox[3]) continue;
    const v = lightInf(Lg, x, y) * (Lg.kind === 'window' ? 2.2 : Lg.kind === 'pool' ? .6 : 1);
    if (v > bi) { bi = v; best = Lg; }
  }
  return best ? { L: best, inf: bi } : null;
}
/* shadow direction (screen vector on the floor, y already foreshortened) for a point */
function shadowDir(S, x, y, skipBox) {
  const s = strongestLight(S, x, y - 30, skipBox);
  if (s && s.inf > .05 && s.L.kind !== 'window') {
    let dx = x - s.L.x, dy = (y - s.L.y); const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const len = clamp(.32 + 60 / (d + 60) * .25, .3, .62);
    let Dy = dy * .5 * len; if (Math.abs(Dy) < .12) Dy = Dy < 0 ? -.12 : .12;
    return { x: dx * len, y: Dy, a: clamp(s.inf * 1.6, .3, .7) };
  }
  return S.shDir;
}
/* black silhouette of a canvas (alpha kept) */
function silhouette(src, col) { const c = mk(src.width, src.height), g = ctx2(c); g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col || '#000'; g.fillRect(0, 0, c.width, c.height); return c; }
/* cheap portable blur: down-sample twice and back up */
function softBlur(src, k) {
  const w = Math.max(1, Math.round(src.width / k)), h = Math.max(1, Math.round(src.height / k)), a = mk(w, h), ga = ctx2(a);
  ga.imageSmoothingEnabled = true; ga.drawImage(src, 0, 0, w, h);
  const b = mk(Math.max(1, w >> 1), Math.max(1, h >> 1)), gb = ctx2(b); gb.drawImage(a, 0, 0, b.width, b.height);
  const out = mk(src.width, src.height), go = ctx2(out); go.globalAlpha = .5; go.drawImage(a, 0, 0, out.width, out.height); go.drawImage(b, 0, 0, out.width, out.height); go.globalAlpha = 1;
  return out;
}

function buildScene(loc, bucket) {
  const now = () => (typeof performance !== 'undefined') ? performance.now() : 0, t0 = now(), prof = {};
  let tp = t0; const lap = (k) => { const t = now(); prof[k] = Math.round(t - tp); tp = t; };
  const ws = worldSize(loc), seed = hashStr(loc.id || 'x');
  const S = { loc, seed, r: RNG(seed), tx: originX(loc), ty: originY(), W: ws.w, H: ws.h, bucket, mood: MOODS[loc.mood] || MOODS.warm, lights: [], exitLights: [], steam: [], dapples: [], neons: [], beams: [], lightK: [.9, 1, 1, .8, .32][bucket], prof };
  if (S.mood.storm) S.lightK = .55; else if (S.mood.neon) S.lightK = .5;
  S.rain = loc.rain !== undefined ? !!loc.rain : (S.mood.storm && (loc.id === 'tower' || loc.floor === 'asphalt'));
  S.wet = loc.floor === 'asphalt' || loc.floor === 'cobble' || (S.mood.storm && loc.floor === 'metal');
  S.grade = gradeOf(S);
  const base = mk(ws.w * BS, ws.h * BS), g = ctx2(base); g.scale(BS, BS);
  let props = (loc.props || []).slice().map(p => (p && p.t === 'stairs' && (p.v | 0) === 1 && !p.side) ? Object.assign({}, p, { t: 'spiral' }) : p);
  const objects = loc.objects || [];
  for (const o of objects) {
    const m = matchProp(props, o);
    const words = (o.id || '').toLowerCase();
    if ((m === null) || (/menu/.test(words) && props[m] && props[m].t !== 'chalkboard') || (/mirror/.test(words) && props[m] && props[m].t !== 'mirror')) {
      if (/mirror/.test(words)) { const pr = { t: 'mirror', x: o.x, y: o.y, w: 1, h: 1, v: 0, label: o.label, _obj: o.id }; props.push(pr); }
      else if (/menu/.test(words)) { const pr = { t: 'chalkboard', side: 'r', x: Math.min(o.x + 1.6, (loc.w || 12) - 3), y: 0, w: 2, h: 1, v: 0, label: 'Menu', _obj: o.id }; props.push(pr); }
    }
  }
  S.props = props;
  // 1. backdrop, floor + flat props
  paintBackdrop(g, S); lap('backdrop');
  paintFloor(g, S); lap('floor');
  const flat = props.filter(p => !p.side && FLAT[p.t]).sort((a, b) => ({ rug: 0, stairs: 1, mat: 2, stage: 2, rope: 3, door: 4 }[a.t] || 0) - ({ rug: 0, stairs: 1, mat: 2, stage: 2, rope: 3, door: 4 }[b.t] || 0));
  S.stages = props.filter(p => p.t === 'stage').map(propRect);
  for (const p of flat) { const q = propRect(p), I = { r: RNG(seed + hashStr(p.t + p.x + ',' + p.y)), v: (p.v | 0) % 4, u0: q.u0, v0: q.v0, u1: q.u1, v1: q.v1 }; try { FLAT[p.t](g, S, p, I); } catch (e) { if (typeof console !== 'undefined') console.warn('Art flat prop failed', p.t, e); } }
  paintFloorEdge(g, S); lap('flat');
  // 2. walls
  paintWall(g, S, 'r'); paintWall(g, S, 'l');
  for (const p of props) if (p.side && WALLPROPS[p.t]) { try { bakeWallProp(g, S, p); } catch (e) { if (typeof console !== 'undefined') console.warn('Art wall prop failed', p.t, e); } }
  paintWallCaps(g, S); lap('walls');
  // 3. sprites
  S.items = [];
  const supports = props.filter(p => SUPPORT_Z[p.t]).map(p => Object.assign({ z: SUPPORT_Z[p.t] }, propRect(p)));
  props.forEach((p, idx) => {
    if (p.side && WALLPROPS[p.t]) { S.items.push({ p, idx, kind: 'wall', rect: propRect(p) }); return; }
    if (!p.side && FLAT[p.t]) { S.items.push({ p, idx, kind: 'flat', rect: propRect(p) }); return; }
    const type = PROPS[p.t] ? p.t : 'crate', q = propRect(p), fn = PROPS[type], unk = !PROPS[p.t];
    const cu = (q.u0 + q.u1) / 2, cv = (q.v0 + q.v1) / 2;
    let zoff = 0;
    for (const st of S.stages) if (cu > st.u0 && cu < st.u1 && cv > st.v0 && cv < st.v1) zoff = Math.max(zoff, STAGE_H);
    if (p.t === 'tray') for (const sp of supports) if (cu > sp.u0 && cu < sp.u1 && cv > sp.v0 && cv < sp.v1) zoff = Math.max(zoff, sp.z + 1);
    const Sx = Object.create(S); Sx.ty = S.ty - zoff;
    const H = (PH[type] || 100), ex = PEX[type] || 14;
    const left = Math.floor(gp(Sx, q.u0, q.v1, 0)[0] - ex - 14), right = Math.ceil(gp(Sx, q.u1, q.v0, 0)[0] + ex + 14);
    const top = Math.floor(gp(Sx, q.u0, q.v0, H)[1] - 12), bottom = Math.ceil(gp(Sx, q.u1, q.v1, 0)[1] + 16);
    const c = mk((right - left) * BS, (bottom - top) * BS), sg = ctx2(c);
    sg.scale(BS, BS); sg.translate(-left, -top);
    const I = { r: RNG(seed + hashStr(p.t + p.x + ',' + p.y + 'z')), v: unk ? hashStr(String(p.t)) % 3 : (p.v | 0) % 4, u0: q.u0, v0: q.v0, u1: q.u1, v1: q.v1, w: p.w || 1, h: p.h || 1 };
    try { fn(sg, Sx, Object.assign({}, p, { t: type }), I); } catch (e) { if (typeof console !== 'undefined') console.warn('Art prop failed', p.t, e); }
    S.items.push({ p, idx, kind: 'sprite', rect: q, spr: { c, x: left, y: top }, cu, cv, zoff, foot: gp(Sx, cu, cv, 0), fp: [gp(Sx, q.u0, q.v0, 0), gp(Sx, q.u1, q.v0, 0), gp(Sx, q.u1, q.v1, 0), gp(Sx, q.u0, q.v1, 0)] });
  });
  S.sprites = S.items.filter(i => i.kind === 'sprite');
  S.order = sortProps(S.sprites); lap('props');
  // 4. lighting
  lightPass(S, base); lap('light');
  S.base = S.comp;
  S.objMap = new Map();
  for (const o of objects) { const m = matchProp(props, o); let idx = m; if (o.id) { const inj = props.findIndex(p => p._obj === o.id); if (inj >= 0) idx = inj; } S.objMap.set(o.id, idx === null ? null : S.items[idx] || null); }
  S.bakeMs = now() - t0;
  return S;
}

/* the light pass: light map (ambient + painted light pools + window shafts - cast shadows) multiplied over
 * floor/walls/props, then hot cores, volumetric beams, wet reflections, bloom, colour grade, lit-sprite extraction. */
function lightPass(S, base) {
  const loc = S.loc, r = RNG(S.seed + 404), W = S.W, H = S.H, b = S.bucket, mood = S.mood, interior = loc.mood !== 'dusk' && loc.floor !== 'asphalt';
  const prof = S.prof, now = () => (typeof performance !== 'undefined') ? performance.now() : 0; let tp = now(); const lap = (k) => { const t = now(); prof[k] = Math.round(t - tp); tp = t; };
  // ---- default light direction: daylight through windows, else a soft top light
  const wins = (S.props || []).filter(p => p.t === 'window' && p.side);
  const day = b !== 4, wr = wins.filter(p => p.side === 'r').length, wl = wins.filter(p => p.side === 'l').length;
  S.shDir = day && (wr || wl) ? (wr >= wl ? { x: -.62, y: .3, a: .5 } : { x: .62, y: .3, a: .5 }) : { x: -.28, y: .22, a: .38 };
  if (!interior) S.shDir = day ? { x: -.7, y: .34, a: .48 } : { x: -.3, y: .22, a: .36 };
  // ---- composite: base + props (raw)
  const comp = mk(base.width, base.height), cg = ctx2(comp);
  cg.drawImage(base, 0, 0);
  cg.save(); cg.scale(BS, BS);
  for (const it of S.order) cg.drawImage(it.spr.c, it.spr.x, it.spr.y, it.spr.c.width / BS, it.spr.c.height / BS);
  cg.restore(); lap('comp');
  // ---- light map at half world resolution
  const LS = .5, LW = Math.ceil(W * LS), LH = Math.ceil(H * LS), lm = mk(LW, LH), lg = ctx2(lm);
  const tt = timeTint(BUCKET_MIN[b]), kk = mood.grade !== undefined ? mood.grade : (interior ? .7 : 1), lit = mood.lit || [.62, .58, .56];
  let amb = [0, 1, 2].map(i => lit[i] * lerp(1, tt.mul[i], kk));
  if (day && wins.length && interior) amb = amb.map(v => v * 1.08);
  if (interior) amb = [amb[0] * .93, amb[1] * .97, amb[2] * 1.06];
  lg.fillStyle = css(amb.map(v => v * 255)); lg.fillRect(0, 0, LW, LH);
  lg.save(); lg.scale(LS, LS);
  // depth darkening toward the scene edges and the ceiling line
  const ctr = gp(S, lw(loc) * .55, lh(loc) * .55, 30), Rr = Math.hypot(W, H) * .5;
  let gg = lg.createRadialGradient(ctr[0], ctr[1], Rr * .25, ctr[0], ctr[1], Rr * 1.05); gg.addColorStop(0, 'rgba(0,0,0,0)'); gg.addColorStop(.6, 'rgba(0,0,0,.12)'); gg.addColorStop(1, 'rgba(0,0,0,.42)');
  lg.fillStyle = gg; lg.fillRect(0, 0, W, H);
  gg = lg.createLinearGradient(0, S.ty - WALLH - 20, 0, S.ty - WALLH * .3); gg.addColorStop(0, 'rgba(0,0,0,.4)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); lg.fillStyle = gg; lg.fillRect(0, 0, W, S.ty);
  // lights
  lg.globalCompositeOperation = 'lighter';
  const gain = interior ? 1.5 : 1.3;
  for (const Lg of S.lights) {
    const a = Lg.a * gain, R = Lg.r;
    if (Lg.kind === 'pool') lightDraw(lg, Lg.col, Lg.x, Lg.y, R * 1.6, R * .9, a * 1.2);
    else if (Lg.kind === 'window') lightDraw(lg, Lg.col, Lg.x, Lg.y + 10, R * 1.8, R * 1.6, a * 1.3);
    else if (Lg.kind === 'door') lightDraw(lg, Lg.col, Lg.x, Lg.y + 30, R * 1.4, R * 1.0, a * 1.4);
    else if (Lg.kind === 'heat') lightDraw(lg, Lg.col, Lg.x, Lg.y, R * 1.2, R * .7, a);
    else {
      lightDraw(lg, Lg.col, Lg.x, Lg.y, R * 1.7, R * 1.5, a * 1.15);
      if (R > 60 && Lg.kind !== 'neon') lightDraw(lg, Lg.col, Lg.x, Lg.y + R * .9, R * 1.5, R * .75, a * .45);   // pool cast on the floor below
    }
  }
  // window shafts on the floor + glow round the frame (daylight; faint moonlight at night)
  const col = mood.dapple || DAPPLE[b], ka = (mood.dapple ? .8 : DAPPLE_A[b]) * S.lightK * (day ? 1 : .55), skew = b <= 1 ? .55 : b === 2 ? .2 : -.15;
  for (const p of wins) {
    const s0 = (p.side === 'l' ? p.y : p.x) || 0, s1 = s0 + ((p.side === 'l' ? p.h : p.w) || 1), L = (b === 3 ? 7 : 5.2), z0 = (p.v | 0) % 4 === 3 ? 62 : 52, zt = z0 + ((p.v | 0) % 4 === 3 ? 56 : 74);
    const m0 = s0 + (s1 - s0) * .5 - Math.min(.9, (s1 - s0) * .5), m1 = s0 + (s1 - s0) * .5 + Math.min(.9, (s1 - s0) * .5);
    const F = (a, d) => p.side === 'r' ? gp(S, a + d * skew, d, 0) : gp(S, d, a + d * skew, 0);
    const poly = [F(m0, .05), F(m1, .05), F(m1, L), F(m0, L)];
    lg.save(); lg.globalCompositeOperation = 'lighter';
    const q0 = F((m0 + m1) / 2, 0), q1 = F((m0 + m1) / 2, L), lgr = lg.createLinearGradient(q0[0], q0[1], q1[0], q1[1]);
    lgr.addColorStop(0, css(col, .7 * ka)); lgr.addColorStop(.5, css(col, .34 * ka)); lgr.addColorStop(1, css(col, 0));
    lg.fillStyle = lgr; pathPoly(lg, poly, r, 4); lg.fill();
    // mullion shadows across the shaft
    lg.globalCompositeOperation = 'source-over'; lg.strokeStyle = css([0, 0, 0], .22 * ka); lg.lineWidth = 6;
    const mm = (m0 + m1) / 2; let a0 = F(mm, .1), a1 = F(mm, L); lg.beginPath(); lg.moveTo(a0[0], a0[1]); lg.lineTo(a1[0], a1[1]); lg.stroke();
    lg.restore();
    const wc = p.side === 'r' ? gp(S, (s0 + s1) / 2, 0, (z0 + zt) / 2) : gp(S, 0, (s0 + s1) / 2, (z0 + zt) / 2);
    lg.globalCompositeOperation = 'lighter'; lightDraw(lg, col, wc[0], wc[1], 90, 80, .35 * ka); lg.globalCompositeOperation = 'source-over';
    // volumetric beam (drawn later, additive over the composite)
    const w0 = p.side === 'r' ? gp(S, m0, 0, zt) : gp(S, 0, m0, zt), w1 = p.side === 'r' ? gp(S, m1, 0, zt) : gp(S, 0, m1, zt), w2 = p.side === 'r' ? gp(S, m1, 0, z0) : gp(S, 0, m1, z0), w3 = p.side === 'r' ? gp(S, m0, 0, z0) : gp(S, 0, m0, z0);
    S.beams.push({ pts: [w0, w1, F(m1, L * .8), F(m0, L * .8)], win: [w0, w1, w2, w3], c0: q0, c1: F((m0 + m1) / 2, L * .8), col, a: ka });
  }
  // dappled light spots
  const n = Math.round(lw(loc) * lh(loc) * .3);
  lg.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const u = r.r(.4, lw(loc) - .4), v = r.r(.4, lh(loc) - .4), q = gp(S, u, v, 0), s = r.r(14, 48), cc = jit(col, r, .12);
    lightDraw(lg, cc, q[0], q[1], s, s * .5, r.r(.05, .16) * ka);
    if (i % 3 === 0) S.dapples.push({ x: q[0], y: q[1], s: s * 1.2, ph: r() * 6.28, col: cc });
  }
  lg.globalCompositeOperation = 'source-over';
  lg.restore(); lap('lmap');
  // ---- cast shadows + contact occlusion -> shadow mask, subtracted from the light map
  const sm = mk(LW, LH), sg = ctx2(sm);
  sg.save(); sg.scale(LS, LS);
  for (const it of S.sprites) {
    if (it.p.t === 'rug') continue;
    const c = it.spr.c, box = [it.spr.x, it.spr.y, it.spr.x + c.width / BS, it.spr.y + c.height / BS], cx = it.foot[0], cy = it.foot[1];
    const D = shadowDir(S, cx, cy, box);
    const sil = silhouette(c);
    sg.save(); sg.globalAlpha = D.a; sg.setTransform(LS, 0, 0, LS, 0, 0); sg.translate(cx, cy); sg.transform(1, 0, -D.x, -D.y, 0, 0);
    sg.drawImage(sil, it.spr.x - cx, it.spr.y - cy, c.width / BS, c.height / BS); sg.restore();
    sg.globalAlpha = .55; sg.fillStyle = '#000'; const fp = it.fp, mx = (fp[0][0] + fp[2][0]) / 2, my = (fp[0][1] + fp[2][1]) / 2;
    sg.beginPath(); fp.forEach((pt, i) => { const x = mx + (pt[0] - mx) * 1.12, y = my + (pt[1] - my) * 1.15 + 2; i ? sg.lineTo(x, y) : sg.moveTo(x, y); }); sg.closePath(); sg.fill(); sg.globalAlpha = 1;
  }
  sg.restore();
  const smb = softBlur(sm, 3), smb2 = softBlur(sm, 7);
  lg.globalAlpha = .4; lg.drawImage(smb2, 0, 0); lg.globalAlpha = .32; lg.drawImage(smb, 0, 0); lg.globalAlpha = .1; lg.drawImage(sm, 0, 0); lg.globalAlpha = 1; lap('shadows');
  S.lm = lm; S.LS = LS;
  try { S.lmData = lg.getImageData(0, 0, LW, LH).data; S.LW = LW; S.LH = LH; } catch (e) { S.lmData = null; }
  // ---- multiply the light map over the composite
  cg.save(); cg.globalCompositeOperation = 'multiply'; cg.imageSmoothingEnabled = true; cg.drawImage(lm, 0, 0, comp.width, comp.height); cg.restore();
  cg.save(); cg.scale(BS, BS);
  // hot cores / glow halos (additive)
  cg.globalCompositeOperation = 'lighter';
  for (const Lg of S.lights) {
    if (Lg.kind === 'pool' || Lg.kind === 'door') continue;
    const R = Lg.r, a = Lg.a;
    if (Lg.kind === 'window') { cg.globalAlpha = Math.min(1, a * .35); cg.drawImage(glowSprite(Lg.col, 128), Lg.x - R, Lg.y - R, R * 2, R * 2); continue; }
    cg.globalAlpha = Math.min(1, a * .55); cg.drawImage(glowSprite(Lg.col, 128), Lg.x - R * .9, Lg.y - R * .9, R * 1.8, R * 1.8);
    cg.globalAlpha = Math.min(1, a * .9); cg.drawImage(glowSprite(mix(Lg.col, [255, 250, 230], .5), 128), Lg.x - R * .22, Lg.y - R * .22, R * .44, R * .44);
  }
  cg.globalAlpha = 1;
  // volumetric window beams
  for (const bm of S.beams) {
    const gr2 = cg.createLinearGradient(bm.win[0][0], bm.win[0][1], bm.c1[0], bm.c1[1]);
    gr2.addColorStop(0, css(bm.col, .2 * bm.a)); gr2.addColorStop(.6, css(bm.col, .07 * bm.a)); gr2.addColorStop(1, css(bm.col, 0));
    cg.globalCompositeOperation = 'screen'; cg.fillStyle = gr2; pathPoly(cg, bm.pts, r, 6); cg.fill();
    for (let k = 0; k < 3; k++) { cg.globalAlpha = .5; cg.fillStyle = gr2; const o = (k - 1) * 9; pathPoly(cg, bm.pts.map(p => [p[0] + o, p[1]]), r, 8); cg.fill(); }
    cg.globalAlpha = 1;
    cg.globalCompositeOperation = 'lighter'; cg.globalAlpha = .28 * bm.a; pathPoly(cg, bm.win); cg.fillStyle = css(bm.col); cg.fill(); cg.globalAlpha = 1;
  }
  cg.globalCompositeOperation = 'source-over';
  cg.restore();
  if (S.wet) wetReflections(S, cg, r);
  // atmospheric haze toward the top of the scene (warm/cool per mood)
  {
    const hz = mix(S.grade.hi, mood.sky ? mood.sky[1] : [200, 190, 170], .5);
    const hg = cg.createLinearGradient(0, 0, 0, (S.ty) * BS); hg.addColorStop(0, css(hz, .13)); hg.addColorStop(.6, css(hz, .05)); hg.addColorStop(1, css(hz, 0));
    cg.globalCompositeOperation = 'screen'; cg.fillStyle = hg; cg.fillRect(0, 0, comp.width, S.ty * BS); cg.globalCompositeOperation = 'source-over';
  }
  lap('fx');
  // ---- colour grade + bloom
  gradeCanvas(comp, S.grade, S); lap('grade');
  bloomPass(comp, S); lap('bloom');
  applyGrain(cg, comp.width, comp.height, .14, 'overlay');
  // match the void colour at the borders to the per-frame clear colour
  { const px = cg.getImageData(2, 2, 1, 1).data; S.bgCol = [px[0], px[1], px[2]]; const E = 80 * BS, cw = comp.width, ch = comp.height, bc = S.bgCol;
    const edge = (x0, y0, x1, y1, rx, ry, rw, rh) => { const g3 = cg.createLinearGradient(x0, y0, x1, y1); g3.addColorStop(0, css(bc, 1)); g3.addColorStop(1, css(bc, 0)); cg.fillStyle = g3; cg.fillRect(rx, ry, rw, rh); };
    edge(0, 0, E, 0, 0, 0, E, ch); edge(cw, 0, cw - E, 0, cw - E, 0, E, ch); edge(0, 0, 0, E, 0, 0, cw, E); edge(0, ch, 0, ch - E, 0, ch - E, cw, E); }
  // ---- lit sprites for re-drawing in front of characters
  for (const it of S.sprites) {
    const c = it.spr.c, l = mk(c.width, c.height), g2 = ctx2(l);
    g2.drawImage(comp, it.spr.x * BS, it.spr.y * BS, c.width, c.height, 0, 0, c.width, c.height);
    g2.globalCompositeOperation = 'destination-in'; g2.drawImage(c, 0, 0);
    it.lit = l;
  }
  S.comp = comp; lap('extract');
}
function wetReflections(S, cg, r) {
  const loc = S.loc, W = S.W, H = S.H, k = .25, RW = Math.ceil(W * k), RH = Math.ceil(H * k), rc = mk(RW, RH), rg = ctx2(rc);
  rg.save(); rg.scale(k, k); rg.globalCompositeOperation = 'lighter';
  const fy0 = S.ty, fy1 = S.ty + (lw(loc) + lh(loc)) * 16;
  for (const Lg of S.lights) {
    if (Lg.kind === 'pool' || Lg.kind === 'heat' || Lg.kind === 'door') continue;
    const y0 = Math.max(fy0, Lg.y + 24), len = 120 + Lg.r * 1.2, wd = 8 + Lg.r * .12, a = Math.min(.9, Lg.a * 1.4);
    const gr = rg.createLinearGradient(0, y0, 0, y0 + len); gr.addColorStop(0, css(Lg.col, a)); gr.addColorStop(.3, css(Lg.col, a * .5)); gr.addColorStop(1, css(Lg.col, 0));
    rg.fillStyle = gr;
    for (let s = 0; s < 5; s++) { const x = Lg.x + (s - 2) * wd * .45 + r.r(-3, 3); rg.fillRect(x - wd * .35, y0 + r.r(0, 12), wd * .7, len * r.r(.6, 1)); }
  }
  for (const ns of S.neons) { const gr = rg.createLinearGradient(0, ns.y + ns.h, 0, ns.y + ns.h + 200); gr.addColorStop(0, 'rgba(255,90,160,.5)'); gr.addColorStop(1, 'rgba(255,90,160,0)'); rg.fillStyle = gr; rg.fillRect(ns.x, ns.y + ns.h + 30, ns.w, 200); }
  rg.restore();
  // wetness mask in floor space
  const fw = lw(loc) * 16, fh = lh(loc) * 16, mc = mk(fw, fh), mg = ctx2(mc), id = mg.createImageData(fw, fh), d = id.data, cob = loc.floor === 'cobble';
  for (let y = 0, i = 0; y < fh; y++) for (let x = 0; x < fw; x++, i += 4) {
    const u = x * 4, v = y * 4;
    const w = cob ? sstep(.6, .71, nt(u * .009 + 3, v * .011 + 7)) : loc.floor === 'asphalt' ? sstep(.46, .62, nt(u * .006 + 20, v * .008 + 40)) * .9 + .1 : sstep(.5, .7, nt(u * .008 + 5, v * .01 + 60)) * .7;
    d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = w * 255;
  }
  mg.putImageData(id, 0, 0);
  rg.save(); rg.globalCompositeOperation = 'destination-in'; rg.scale(k, k); floorFrame(rg, S); rg.drawImage(mc, 0, 0, lw(loc) * 64, lh(loc) * 64); rg.restore();
  cg.save(); cg.globalCompositeOperation = 'lighter'; cg.globalAlpha = .8; cg.drawImage(rc, 0, 0, W * BS, H * BS); cg.restore();
}
function bloomPass(comp, S) {
  const k = 6, w = Math.ceil(comp.width / k), h = Math.ceil(comp.height / k), c = mk(w, h), g = ctx2(c);
  g.drawImage(comp, 0, 0, w, h);
  const id = g.getImageData(0, 0, w, h), d = id.data, thr = S.bucket === 4 || S.mood.neon || S.mood.storm || S.mood.lamp || S.mood === MOODS.ember ? 150 : 185;
  for (let i = 0; i < d.length; i += 4) {
    const l = d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11, f = l > thr ? (l - thr) / (255 - thr) : 0, ff = f * f * 1.6;
    d[i] *= ff; d[i + 1] *= ff; d[i + 2] *= ff; d[i + 3] = 255;
  }
  g.putImageData(id, 0, 0);
  const b1 = softBlur(c, 2), b2 = softBlur(c, 5), cg = ctx2(comp);
  cg.save(); cg.globalCompositeOperation = 'lighter'; cg.imageSmoothingEnabled = true;
  cg.globalAlpha = .5; cg.drawImage(b1, 0, 0, comp.width, comp.height); cg.globalAlpha = .55; cg.drawImage(b2, 0, 0, comp.width, comp.height); cg.restore();
}

function relRect(A, B) {   // -1: A behind B ; 1: A in front ; 0: unknown
  const e = .001;
  const aB = A.u1 <= B.u0 + e || A.v1 <= B.v0 + e, bB = B.u1 <= A.u0 + e || B.v1 <= A.v0 + e;
  if (aB && !bB) return -1; if (bB && !aB) return 1; if (aB && bB) return 0;
  const sa = A.u0 + A.u1 + A.v0 + A.v1, sb = B.u0 + B.u1 + B.v0 + B.v1;
  // overlapping footprints: container first
  return sa === sb ? 0 : (sa < sb ? -1 : 1);
}
function sortProps(items) {
  const n = items.length, out = [], placed = new Array(n).fill(false), before = items.map(() => []);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j) { const r = relRect(items[i].rect, items[j].rect); if (r === 1) before[i].push(j); }
  const key = (it) => it.rect.u0 + it.rect.u1 + it.rect.v0 + it.rect.v1;
  for (let k = 0; k < n; k++) {
    let best = -1;
    for (let i = 0; i < n; i++) { if (placed[i]) continue; if (before[i].every(j => placed[j])) { if (best < 0 || key(items[i]) < key(items[best])) best = i; } }
    if (best < 0) { for (let i = 0; i < n; i++) if (!placed[i] && (best < 0 || key(items[i]) < key(items[best]))) best = i; }
    placed[best] = true; out.push(items[best]);
  }
  return out;
}
function elevAt(S, x, y) { const u = x + .5, v = y + .5; for (const st of S.stages) if (u > st.u0 && u < st.u1 && v > st.v0 && v < st.v1) return STAGE_H; return 0; }

/* ======================================================= RENDERER */
const _shadow = {};
function shadowSprite() {
  if (_shadow.c) return _shadow.c; const c = mk(64, 32), g = ctx2(c), gr = g.createRadialGradient(32, 16, 1, 32, 16, 30);
  gr.addColorStop(0, 'rgba(6,4,14,.8)'); gr.addColorStop(.45, 'rgba(6,4,14,.42)'); gr.addColorStop(1, 'rgba(6,4,14,0)'); g.fillStyle = gr; g.save(); g.scale(1, .5); g.fillRect(0, 0, 64, 64); g.restore(); return (_shadow.c = c);
}
function propRing(item) {
  if (item.ring) return item.ring; const src = item.spr.c, W = src.width, H = src.height, c = mk(W + 12, H + 12), g = ctx2(c), R = 2.2 * BS;
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.2832; g.drawImage(src, 6 + Math.cos(a) * R, 6 + Math.sin(a) * R); }
  g.globalCompositeOperation = 'source-in'; g.fillStyle = 'rgb(96,255,120)'; g.fillRect(0, 0, W + 12, H + 12);
  g.globalCompositeOperation = 'destination-out'; g.drawImage(src, 6, 6);
  item.ring = c; return c;
}
function spriteRing(spr) {
  if (spr.ring) return spr.ring; const src = spr.c, W = src.width, H = src.height, pad = 8, c = mk(W + pad * 2, H + pad * 2), g = ctx2(c), R = 2.0 + K * .15;
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.2832; g.drawImage(src, pad + Math.cos(a) * R, pad + Math.sin(a) * R); }
  g.globalCompositeOperation = 'source-in'; g.fillStyle = 'rgb(96,255,120)'; g.fillRect(0, 0, W + pad * 2, H + pad * 2);
  const glow = mk(W + pad * 2, H + pad * 2), gg = ctx2(glow); gg.globalAlpha = .35; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.2832; gg.drawImage(c, Math.cos(a) * R * 1.8, Math.sin(a) * R * 1.8); } gg.globalAlpha = 1; gg.drawImage(c, 0, 0);
  gg.globalCompositeOperation = 'destination-out'; gg.drawImage(src, pad, pad);
  spr.ring = glow; spr.pad = pad; return glow;
}
/* --- character relighting: sprite pixels x light-map sample, graded with the scene LUT, plus a rim from the key light */
function sprPixels(spr) { if (spr._ePx) return spr._ePx; try { spr._ePx = ctx2(spr.c).getImageData(0, 0, spr.c.width, spr.c.height); } catch (e) { spr._ePx = null; } return spr._ePx; }
function sprSil(spr) {     // blurred quarter-res silhouette for cast shadows
  if (spr._eSil) return spr._eSil;
  const w = Math.max(1, spr.c.width >> 2), h = Math.max(1, spr.c.height >> 2), c = mk(w, h), g = ctx2(c);
  g.drawImage(spr.c, 0, 0, w, h); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#05040c'; g.fillRect(0, 0, w, h);
  return (spr._eSil = softBlur(c, 1.5));
}
function sprRim(spr, side, col) {
  const key = side + ':' + col.map(v => v >> 4).join(','); spr._eRim = spr._eRim || {}; if (spr._eRim[key]) return spr._eRim[key];
  const W = spr.c.width, H = spr.c.height, c = mk(W, H), g = ctx2(c), d = 3.2 * SS;
  g.drawImage(spr.c, 0, 0); g.globalCompositeOperation = 'destination-out'; g.drawImage(spr.c, -side * d, d * .55);
  g.globalCompositeOperation = 'source-in'; g.fillStyle = css(mix(col, [255, 255, 255], .25)); g.fillRect(0, 0, W, H);
  const keys = Object.keys(spr._eRim); if (keys.length > 6) delete spr._eRim[keys[0]];
  return (spr._eRim[key] = c);
}
function lmSample(S, x, y) {
  const d = S.lmData; if (!d) return [1, 1, 1];
  let i = Math.round(x * S.LS), j = Math.round(y * S.LS); i = i < 0 ? 0 : i >= S.LW ? S.LW - 1 : i; j = j < 0 ? 0 : j >= S.LH ? S.LH - 1 : j;
  const k = (j * S.LW + i) * 4; return [d[k] / 255, d[k + 1] / 255, d[k + 2] / 255];
}
function litEntity(R, S, e) {
  const spr = e.spr, px = sprPixels(spr);
  if (!px) return spr.c;
  const a = lmSample(S, e.sx, e.sy - 30), b2 = lmSample(S, e.sx, e.sy - 70), L = [(a[0] + b2[0]) / 2, (a[1] + b2[1]) / 2, (a[2] + b2[2]) / 2];
  const q = (v) => Math.round(Math.min(1.25, v * 1.12) * 40);
  const kl = strongestLight(S, e.sx, e.sy - 50);
  let rim = null;
  if (kl && kl.inf > .04) { const side = kl.L.x > e.sx ? 1 : -1; rim = { side, col: kl.L.col, a: clamp(kl.inf * 2.6, .15, .95) }; }
  const key = q(L[0]) + ',' + q(L[1]) + ',' + q(L[2]) + (rim ? '|' + rim.side + (rim.col.join('.')) + Math.round(rim.a * 10) : '');
  let E = R.ents.get(e.id || 'p');
  if (!E) { E = { c: null, key: '', spr: null, S: null }; R.ents.set(e.id || 'p', E); }
  if (E.spr === spr && E.key === key && E.S === S) return E.c;
  if (!E.c || E.c.width !== spr.c.width || E.c.height !== spr.c.height) { E.c = mk(spr.c.width, spr.c.height); E.id = null; }
  const g = ctx2(E.c), lut = gradeLUT(S), src = px.data;
  if (!E.id || E.id.width !== px.width) E.id = g.createImageData(px.width, px.height);
  const out = E.id.data, lr = q(L[0]) / 40 * 1.0, lgg = q(L[1]) / 40, lb = q(L[2]) / 40;
  for (let i = 0; i < src.length; i += 4) {
    const al = src[i + 3]; out[i + 3] = al; if (!al) continue;
    let r = src[i] * lr, gq = src[i + 1] * lgg, bq = src[i + 2] * lb; r = r > 255 ? 255 : r; gq = gq > 255 ? 255 : gq; bq = bq > 255 ? 255 : bq;
    const li = (((r >> 2) << 12) | ((gq >> 2) << 6) | (bq >> 2)) * 3;
    out[i] = lut[li]; out[i + 1] = lut[li + 1]; out[i + 2] = lut[li + 2];
  }
  g.putImageData(E.id, 0, 0);
  if (rim) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = rim.a; g.drawImage(sprRim(spr, rim.side, rim.col), 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  E.spr = spr; E.key = key; E.S = S;
  return E.c;
}

function makeRenderer(loc) {
  const R = { loc: loc, _last: null, stats: { frames: 0, ms: 0, bakeMs: 0 }, ents: new Map() };
  let sigProps = null, sigLen = -1, sig = '';
  function signature(l) {
    const ps = l.props || []; if (ps === sigProps && ps.length === sigLen) return sig;
    sigProps = ps; sigLen = ps.length; let s = ps.length + ':'; for (const p of ps) s += p.t + (p.x | 0) + ',' + (p.y | 0) + (p.v | 0) + (p.side || '') + '|'; sig = String(hashStr(s)); return sig;
  }
  function ensure(l, bucket) {
    const key = (l.id || '') + '|' + (l.mood || '') + '|' + bucket + '|' + signature(l);
    let S = _scenes.get(key);
    if (!S) {
      S = buildScene(l, bucket); S.key = key; _scenes.set(key, S); R.stats.bakeMs = S.bakeMs; R.stats.prof = S.prof;
      if (_scenes.size > 4) { const k = _scenes.keys().next().value; _scenes.delete(k); }
    } else { _scenes.delete(key); _scenes.set(key, S); }
    return S;
  }
  R.prebake = function (time) { return ensure(R.loc, bucketOf(time)); };
  R.draw = function (ctx, view, dyn) {
    const t1 = (typeof performance !== 'undefined') ? performance.now() : 0;
    dyn = dyn || {}; view = view || { camX: 0, camY: 0, zoom: 1, w: 1280, h: 720 };
    const l = R.loc, minute = (typeof dyn.time === 'number') ? dyn.time : 600, bucket = bucketOf(minute), S = ensure(l, bucket);
    const t = dyn.t || 0, zoom = view.zoom || 1, w = view.w, h = view.h, camX = view.camX || 0, camY = view.camY || 0;
    // ---- baked, lit, graded scene: one 1:1 device-pixel blit from a cache scaled to the current zoom*dpr
    let M = null; try { M = ctx.getTransform(); } catch (e) { M = null; }
    const ds = M ? Math.hypot(M.a, M.b) || 1 : 1, kz = zoom * ds;
    ctx.save();
    ctx.fillStyle = css(S.bgCol || S.mood.bg || [10, 9, 16]); ctx.fillRect(0, 0, w, h);
    if (M && Math.abs(M.b) < 1e-6 && Math.abs(M.c) < 1e-6 && S.W * S.H * kz * kz < 2.4e7) {
      if (!S.scr || Math.abs(S.scr.k - kz) > 1e-4) {
        for (const o of _scenes.values()) if (o !== S) o.scr = null;
        const c = mk(S.W * kz, S.H * kz), g = ctx2(c); g.imageSmoothingEnabled = true; try { g.imageSmoothingQuality = 'high'; } catch (e) { }
        g.drawImage(S.comp, 0, 0, c.width, c.height); S.scr = { k: kz, c };
      }
      const c = S.scr.c, ox = Math.round(M.e + (w / 2 - camX * zoom) * ds), oy = Math.round(M.f + (h / 2 - camY * zoom) * ds), DW = w * ds, DH = h * ds;
      const sx0 = Math.max(0, -ox), sy0 = Math.max(0, -oy), sx1 = Math.min(c.width, Math.ceil(DW - ox)), sy1 = Math.min(c.height, Math.ceil(DH - oy));
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (sx1 > sx0 && sy1 > sy0) ctx.drawImage(c, sx0, sy0, sx1 - sx0, sy1 - sy0, ox + sx0, oy + sy0, sx1 - sx0, sy1 - sy0);
      ctx.setTransform(M);
    }
    ctx.translate(w / 2, h / 2); ctx.scale(zoom, zoom); ctx.translate(-camX, -camY);
    const vx0 = camX - w / 2 / zoom, vy0 = camY - h / 2 / zoom, vw = w / zoom, vh = h / zoom;
    if (!S.scr) { const sx0 = Math.max(0, Math.floor(vx0)), sy0 = Math.max(0, Math.floor(vy0)), sx1 = Math.min(S.W, Math.ceil(vx0 + vw)), sy1 = Math.min(S.H, Math.ceil(vy0 + vh)); if (sx1 > sx0 && sy1 > sy0) ctx.drawImage(S.comp, sx0 * BS, sy0 * BS, (sx1 - sx0) * BS, (sy1 - sy0) * BS, sx0, sy0, sx1 - sx0, sy1 - sy0); }
    // ---- gather hover state
    const hover = dyn.hoverId || null, all = !!dyn.highlightAll;
    const hlItems = [];
    const objs = dyn.objects || [];
    const objDefs = l.objects || [];
    for (const o of objs) {
      const on = o.highlight || all || (hover && hover === o.id);
      if (!on) continue;
      const it = S.objMap.get(o.id);
      if (it) hlItems.push(it); else hlItems.push({ marker: o });
    }
    if (hover && !objs.length) { for (const od of objDefs) if (od.id === hover) { const it = S.objMap.get(od.id); hlItems.push(it || { marker: od }); } }
    const post = [];
    // ---- entities
    const ents = [];
    const pl = dyn.player;
    const pushEnt = (e, isPlayer, hl) => {
      const x = e.x || 0, y = e.y || 0, el = elevAt(S, x, y);
      const fr = e.walking ? 1 + (Math.floor(t / 115) % 4) : 0;
      const spr = figureNow(e.look || (isPlayer ? DEF_LOOK : null), e.facing || 's', fr, e.pose && e.pose !== (e.look && e.look.pose) ? e.pose : null);
      if (isPlayer && !R._warmed) { R._warmed = true; for (const f of ['s', 'se', 'e', 'ne', 'n', 'nw', 'w', 'sw']) { queueFigure(e.look || DEF_LOOK, f, 0); } for (const f of ['se', 'sw', 'ne', 'nw', 'e', 's', 'n', 'w']) for (let k = 1; k <= 4; k++) queueFigure(e.look || DEF_LOOK, f, k); }
      const p = project(l, x, y);
      ents.push({ x, y, sx: p.sx, sy: p.sy - el, spr, isPlayer, hl, id: isPlayer ? '@player' : e.id, fr, phase: (hashStr(e.id || 'p') % 100) / 16, rect: { u0: x + .5 - .22, u1: x + .5 + .22, v0: y + .5 - .22, v1: y + .5 + .22 }, walking: !!e.walking });
    };
    for (const n of (dyn.npcs || [])) pushEnt(n, false, !!(n.highlight || all || (hover && hover === n.id)));
    if (pl) pushEnt(pl, true, false);
    // ---- depth: slot each entity in the static prop order
    const order = S.order, n = order.length;
    for (const e of ents) {
      let idx = n;
      for (let i = 0; i < n; i++) { const rel = relRect(e.rect, order[i].rect); if (rel === -1) { idx = i; break; } }
      e.slot = idx;
    }
    ents.sort((a, b) => a.slot - b.slot || (a.x + a.y) - (b.x + b.y));
    // ground marks first: contact + cast shadows, player ring
    for (const e of ents) {
      const D = shadowDir(S, e.sx, e.sy), sil = sprSil(e.spr), spr = e.spr;
      e.sd = D;
      ctx.save(); ctx.translate(e.sx, e.sy); ctx.transform(1, 0, -D.x, -D.y, 0, 0); ctx.globalAlpha = clamp(D.a * .95, .2, .62);
      ctx.drawImage(sil, -spr.ax / SS, -spr.ay / SS, spr.w / SS, spr.h / SS); ctx.restore();
      ctx.globalAlpha = .85; ctx.drawImage(shadowSprite(), e.sx - 30, e.sy - 11, 60, 23); ctx.globalAlpha = 1;
    }
    if (pl) { const e = ents.find(q => q.isPlayer); const pulse = 1 + Math.sin(t * .004) * .04; ctx.save(); ctx.translate(e.sx, e.sy + 1); ctx.scale(1, .5);
      ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 0, 32 * pulse, 0, 7); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.92)'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(0, 0, 31 * pulse, 0, 7); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.beginPath(); ctx.arc(0, 0, 31 * pulse, 0, 7); ctx.fill(); ctx.restore(); }
    // characters, each followed by the props that stand in front of it (re-drawn clipped to its footprint on screen)
    for (const e of ents) {
      drawEnt(ctx, e, t, post, litEntity(R, S, e));
      const spr = e.spr, bx0 = e.sx - spr.ax / SS - 4, by0 = e.sy - spr.ay / SS - 4, bx1 = bx0 + spr.w / SS + 8, by1 = Math.max(by0 + spr.h / SS + 8, e.sy + 20);
      const cx0 = Math.min(bx0, e.sx - 40), cx1 = Math.max(bx1, e.sx + 40), cy1 = Math.max(by1, e.sy + 22);
      let clipped = false;
      for (let i = e.slot; i < n; i++) {
        const it = order[i], c = it.lit || it.spr.c, ix0 = it.spr.x, iy0 = it.spr.y, ix1 = ix0 + c.width / BS, iy1 = iy0 + c.height / BS;
        if (ix1 < cx0 || ix0 > cx1 || iy1 < by0 || iy0 > cy1) continue;
        if (!clipped) { ctx.save(); ctx.beginPath(); ctx.rect(cx0, by0, cx1 - cx0, cy1 - by0); ctx.clip(); clipped = true; }
        ctx.drawImage(c, ix0, iy0, c.width / BS, c.height / BS);
      }
      if (clipped) ctx.restore();
    }
    // collect highlight outlines
    const seen = new Set();
    for (const hI of hlItems) {
      if (hI.marker) { post.push({ k: 'diamond', x: hI.marker.x, y: hI.marker.y, a: .8 }); continue; }
      if (seen.has(hI)) continue; seen.add(hI);
      post.push({ k: 'item', it: hI });
    }
    if (hover && hover.indexOf('exit:') === 0) { const id = hover.slice(5); for (const ex of (l.exits || [])) if (ex.id === id) post.push({ k: 'diamond', x: ex.x, y: ex.y, a: 1, big: true }); }
    // ---- animated light: flicker, neon, steam, dapple shimmer, dust in the beams
    const flash = S.mood.storm ? lightning(t) : 0;
    ctx.globalCompositeOperation = 'lighter';
    for (const Lg of S.lights) {
      if (Lg.x + Lg.r < vx0 || Lg.x - Lg.r > vx0 + vw || Lg.y + Lg.r < vy0 || Lg.y - Lg.r > vy0 + vh) continue;
      let a = 0;
      if (Lg.kind === 'neon') { const v = neonFlicker(t, Lg.ph); if (v < .6) { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = (1 - v) * .45; ctx.drawImage(glowSprite([0, 0, 0], 128), Lg.x - Lg.r * 1.4, Lg.y - Lg.r * 1.2, Lg.r * 2.8, Lg.r * 2.4); ctx.globalCompositeOperation = 'lighter'; continue; } a = Lg.a * (v - .8) * .8; }
      else if (Lg.kind === 'window') a = S.mood.storm ? flash * Lg.a * 3 : 0;
      else if (Lg.fl > .015) { const o = Math.sin(t * .013 + Lg.ph) * .6 + Math.sin(t * .031 + Lg.ph * 2.3) * .4 + (lat(Math.floor(t / 90), Math.floor(Lg.ph * 10), 3) < Lg.fl * .5 ? .8 : 0); a = Lg.a * Lg.fl * o * 1.6; }
      if (a <= .004) continue;
      ctx.globalAlpha = Math.min(1, a); const rr = Lg.r * 1.2;
      ctx.drawImage(glowSprite(Lg.col, 128), Lg.x - rr, Lg.y - rr, rr * 2, rr * 2);
    }
    for (const d of S.dapples) {
      if (d.x < vx0 - 40 || d.x > vx0 + vw + 40 || d.y < vy0 - 40 || d.y > vy0 + vh + 40) continue;
      ctx.globalAlpha = Math.max(0, .06 * Math.sin(t * .0016 + d.ph)) * S.lightK * (bucket === 4 ? .5 : 1);
      if (ctx.globalAlpha < .004) continue;
      const s = d.s; ctx.drawImage(glowSprite(d.col, 128), d.x - s / 2, d.y - s / 4, s, s / 2);
    }
    for (const ns of S.neons) {
      if (ns.x + ns.w < vx0 || ns.x > vx0 + vw || ns.y + ns.h < vy0 || ns.y > vy0 + vh) continue;
      ctx.globalAlpha = neonFlicker(t, ns.ph); ctx.drawImage(ns.c, ns.x, ns.y, ns.w, ns.h);
    }
    for (const st of S.steam) {
      for (let k = 0; k < 5; k++) { const ph = ((t * .00032 + k / 5) % 1), y = st.y - ph * 70, x = st.x + Math.sin(ph * 5 + k) * 8 + ph * 10; ctx.globalAlpha = Math.sin(ph * 3.14) * .12; ctx.drawImage(glowSprite([210, 220, 230], 128), x - 12 - ph * 18, y - 12 - ph * 18, 24 + ph * 36, 24 + ph * 36); }
    }
    ctx.globalAlpha = 1;
    drawDust(ctx, t, vx0, vy0, vw, vh, S, bucket);
    ctx.globalCompositeOperation = 'source-over';
    if (S.rain) drawRain(ctx, t, vx0, vy0, vw, vh, zoom, S);
    for (const p of post) drawPost(ctx, S, p, t);
    ctx.restore();
    // ---- screen space: lightning, vignette + top haze, film grain
    ctx.save();
    if (flash > .02) { ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = css([200, 220, 255], flash * .3); ctx.fillRect(0, 0, w, h); ctx.globalCompositeOperation = 'source-over'; }
    const hz = S.mood.sky ? S.mood.sky[1] : S.grade.hi;
    // vignette + grain in device pixels (1:1 blits, no resampling)
    const dw = Math.round(w * ds), dh = Math.round(h * ds);
    if (M) ctx.setTransform(1, 0, 0, 1, M.e, M.f);
    ctx.drawImage(sceneVignette(M ? dw : w, M ? dh : h, mul(S.mood.bg || [6, 4, 10], .5), [hz[0], hz[1], hz[2], .07]), 0, 0);
    if (Art.quality.grain) {
      const o = (Math.floor(t / 60) * 53) % 256, o2 = (Math.floor(t / 60) * 97) % 256;
      ctx.globalAlpha = .5; ctx.translate(-o, -o2); ctx.fillStyle = ctx.createPattern(grainTileA(), 'repeat'); ctx.fillRect(0, 0, (M ? dw : w) + 256, (M ? dh : h) + 256);
    }
    ctx.restore();
    if (typeof performance !== 'undefined' && _warmQ.length && performance.now() - t1 < 9) warmStep(1);
    if (typeof performance !== 'undefined') { R.stats.frames++; R.stats.last = performance.now() - t1; R.stats.ms += R.stats.last; }
    R.scene = S;
  };
  return R;
}
function drawEnt(ctx, e, t, post, img) {
  const spr = e.spr, breath = 1 + Math.sin(t * .0022 + e.phase) * .011, bob = e.walking ? 0 : Math.sin(t * .0022 + e.phase) * .35;
  ctx.save(); ctx.translate(e.sx, e.sy + bob);
  if (spr.hang) { const ang = Math.sin(t * .0011 + e.phase) * .018; ctx.translate(spr.hang.x, spr.hang.y); ctx.rotate(ang); ctx.translate(-spr.hang.x, -spr.hang.y); } else ctx.scale(1, breath);
  ctx.drawImage(img || spr.c, -spr.ax / SS, -spr.ay / SS, spr.w / SS, spr.h / SS);
  ctx.restore();
  if (e.hl) post.push({ k: 'ent', e });
}
function drawPost(ctx, S, p, t) {
  const pulse = .85 + .15 * Math.sin(t * .006);
  if (p.k === 'ent') {
    const e = p.e, ring = spriteRing(e.spr), pad = e.spr.pad;
    ctx.save(); ctx.translate(e.sx, e.sy); ctx.globalAlpha = pulse;
    ctx.drawImage(ring, (-e.spr.ax - pad) / SS, (-e.spr.ay - pad) / SS, ring.width / SS, ring.height / SS); ctx.restore();
  } else if (p.k === 'item') {
    const it = p.it; ctx.save(); ctx.globalAlpha = pulse;
    if (it.kind === 'sprite') { const ring = propRing(it); ctx.drawImage(ring, it.spr.x - 6 / BS, it.spr.y - 6 / BS, ring.width / BS, ring.height / BS); }
    else {
      let pts;
      if (it.kind === 'wall') pts = wallFootprintPoly(S, it.p, 4, WALLH_TABLE[it.p.t] || 100);
      else { const q = it.rect, hh = it.p.t === 'stage' ? STAGE_H : it.p.t === 'mat' ? 9 : 2; pts = [gp(S, q.u0, q.v0, hh), gp(S, q.u1, q.v0, hh), gp(S, q.u1, q.v1, hh), gp(S, q.u0, q.v1, hh)]; }
      ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(96,255,120,.25)'; ctx.lineWidth = 6; pathPoly(ctx, pts); ctx.stroke();
      ctx.strokeStyle = 'rgb(110,255,130)'; ctx.lineWidth = 1.8; pathPoly(ctx, pts); ctx.stroke();
    }
    ctx.restore();
  } else if (p.k === 'diamond') {
    const c = gp(S, p.x + .5, p.y + .5, 0), a = p.a * pulse; ctx.save(); ctx.translate(c[0], c[1]);
    const k = p.big ? 1 : .55; const pts = [[0, -16 * k], [32 * k, 0], [0, 16 * k], [-32 * k, 0]];
    ctx.fillStyle = 'rgba(96,255,120,' + (.12 * a) + ')'; pathPoly(ctx, pts); ctx.fill();
    ctx.strokeStyle = 'rgba(96,255,120,' + (.3 * a) + ')'; ctx.lineWidth = 6; pathPoly(ctx, pts); ctx.stroke();
    ctx.strokeStyle = 'rgba(120,255,140,' + a + ')'; ctx.lineWidth = 1.8; pathPoly(ctx, pts); ctx.stroke();
    ctx.restore();
  }
}
function drawDust(ctx, t, vx0, vy0, vw, vh, S, bucket) {
  const col = S.mood.dapple || (bucket === 4 ? [160, 190, 255] : DAPPLE[bucket]);
  // motes drifting inside the window beams: bright, many
  for (let bi = 0; bi < S.beams.length; bi++) {
    const bm = S.beams[bi], p = bm.pts;
    ctx.fillStyle = css(mix(bm.col, [255, 255, 255], .4), 1);
    for (let i = 0; i < 34; i++) {
      const a = lat(i, bi, 15), b = lat(i, bi + 9, 15), sp = .00002 + lat(i, 3, 15) * .00003;
      const u = ((a + t * sp + Math.sin(t * .0005 + i) * .02) % 1 + 1) % 1, v = ((b + Math.cos(t * .00041 + i * 1.3) * .03 + t * sp * .3) % 1 + 1) % 1;
      const top = [p[0][0] + (p[1][0] - p[0][0]) * u, p[0][1] + (p[1][1] - p[0][1]) * u], bot = [p[3][0] + (p[2][0] - p[3][0]) * u, p[3][1] + (p[2][1] - p[3][1]) * u];
      const x = top[0] + (bot[0] - top[0]) * v, y = top[1] + (bot[1] - top[1]) * v;
      const tw = .3 + .7 * Math.abs(Math.sin(t * .0013 + i * 2.1));
      ctx.globalAlpha = (.18 + lat(i, 6, 15) * .4) * tw * bm.a * (1 - v * .7);
      ctx.fillRect(x, y, .9 + lat(i, 5, 15) * 1.3, .9 + lat(i, 5, 15) * 1.3);
    }
  }
  // motes hanging in lamp light
  let li = 0;
  for (const Lg of S.lights) {
    if (Lg.kind !== 'lamp' && Lg.kind !== 'fire' || Lg.r < 60) continue; if (li++ > 8) break;
    if (Lg.x + Lg.r < vx0 || Lg.x - Lg.r > vx0 + vw || Lg.y + Lg.r < vy0 || Lg.y - Lg.r > vy0 + vh) continue;
    ctx.fillStyle = css(mix(Lg.col, [255, 255, 255], .3), 1);
    for (let i = 0; i < 10; i++) {
      const a = lat(i, li, 25) * 6.28 + t * .00008 * (1 + lat(i, 2, 25)), d = Lg.r * (.15 + lat(i, 3, 25) * .55), y = Lg.y + Math.sin(a) * d * .6 + ((t * .004 * (.3 + lat(i, 4, 25))) % 40) - 20;
      ctx.globalAlpha = .35 * Math.abs(Math.sin(t * .001 + i)) * (1 - d / Lg.r);
      ctx.fillRect(Lg.x + Math.cos(a) * d, y, 1.3, 1.3);
    }
  }
  // sparse general dust
  const n = S.mood.storm ? 18 : 26;
  ctx.fillStyle = css(col, 1);
  for (let i = 0; i < n; i++) {
    const a = lat(i, 1, 5), b = lat(i, 2, 5), sp = .00002 + lat(i, 3, 5) * .00005;
    const x = vx0 + (((a + t * sp * (1 + lat(i, 4, 5)) + Math.sin(t * .0004 + i) * .006) % 1) + 1) % 1 * vw;
    const y = vy0 + (((b - t * sp * .8 + Math.cos(t * .00037 + i * 1.7) * .008) % 1) + 1) % 1 * vh;
    const s = .7 + lat(i, 5, 5) * 1.5, tw = .35 + .65 * Math.abs(Math.sin(t * .001 + i * 2.1));
    ctx.globalAlpha = (.1 + lat(i, 6, 5) * .2) * tw * S.lightK;
    ctx.fillRect(x, y, s, s);
  }
  ctx.globalAlpha = 1;
}
function drawRain(ctx, t, vx0, vy0, vw, vh, zoom, S) {
  ctx.save(); ctx.lineCap = 'round';
  for (let layer = 0; layer < 3; layer++) {
    const n = [70, 90, 40][layer];
    ctx.strokeStyle = ['rgba(150,180,220,.10)', 'rgba(180,205,245,.2)', 'rgba(220,235,255,.32)'][layer]; ctx.lineWidth = [.8, 1.1, 1.6][layer];
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const sp = [.0009, .0014, .002][layer] * (.8 + lat(i, layer, 61) * .5), a = lat(i, 7 + layer, 61), b = lat(i, 9 + layer, 61);
      const k = (b + t * sp) % 1, x = vx0 + (((a + k * .22) % 1) * vw), y = vy0 + k * vh * 1.1 - 20, L = [12, 22, 34][layer];
      ctx.moveTo(x, y); ctx.lineTo(x - L * .22, y + L);
    }
    ctx.stroke();
  }
  // splashes / ripples on the floor
  if (S && S.loc) {
    const loc = S.loc; ctx.strokeStyle = 'rgba(200,220,255,.35)'; ctx.lineWidth = .8;
    for (let i = 0; i < 40; i++) {
      const ph = ((t * .0016 + lat(i, 1, 71)) % 1), cyc = Math.floor(t * .0016 + lat(i, 1, 71));
      const u = lat(i, cyc, 72) * lw(loc), v = lat(i, cyc, 73) * lh(loc), q = gp(S, u, v, 0);
      if (q[0] < vx0 || q[0] > vx0 + vw || q[1] < vy0 || q[1] > vy0 + vh) continue;
      ctx.globalAlpha = (1 - ph) * .8; ctx.beginPath(); ctx.ellipse(q[0], q[1], 1 + ph * 7, .5 + ph * 3.5, 0, 0, 6.3); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

/* ---- art2 animation helpers ---- */
function neonFlicker(t, ph) {        // tube mostly steady with brown-outs and stutters
  const slot = Math.floor(t / 70), a = lat(slot, Math.floor(ph * 100), 41), b = lat(Math.floor(t / 1900), Math.floor(ph * 100), 42);
  let v = .92 + .08 * Math.sin(t * .02 + ph);
  if (b < .12) v *= a < .5 ? .15 : .9;       // occasional stutter burst
  else if (a < .018) v *= .3;
  return v;
}
function lightning(t) {              // returns 0..1 flash intensity, a few times a minute
  const cyc = 11000, k = Math.floor(t / cyc), ph = t - k * cyc, at = 2000 + lat(k, 1, 51) * 6000;
  const d = ph - at; if (d < 0 || d > 700) return 0;
  return d < 90 ? 1 - d / 140 : d < 200 ? .15 : d < 300 ? .75 * (1 - (d - 200) / 100) : d < 700 ? .1 * (1 - (d - 300) / 400) : 0;
}

/* ====================================================== ITEM ICONS (v3)
 * 56x56 pixel/painted hybrid: shapes rasterised into the shared px engine (hue-shifted ramps, top-left key
 * light, selective dither on big flat areas, dark outer outline), shown at 56px 1:1 or integer-upscaled. */
const _icons = new Map();
const IC_FONT = { A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110', '4': '101101111001001', '5': '111100110001110', '6': '011100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001110', '.': '000000000000010', '-': '000000111000000', '#': '101111101111101' };
function iconBuild(id) {
  const N = 56, P = px_new(N), r = pt_rng(pt_hash('icon:' + id));
  const M = (c, o) => px_mat(P, c, Object.assign({ n: 5, bias: .55 }, o || {}));
  const G = (cx, cy, b, k) => (x, y) => b - ((x - cx) * .55 + (y - cy) * .65) * (k === undefined ? .02 : k);
  const SP = (cx, cy, rx, ry, b, k) => (x, y) => { const a = (x + .5 - cx) / rx, c = (y + .5 - cy) / ry, nz = Math.sqrt(Math.max(0, 1 - a * a - c * c)); return b + (-a * .5 - c * .6 + nz * .65 - .4) * (k || .7); };
  const poly = (pts, m, sh, z) => px_shape(P, (g) => { g.moveTo(pts[0][0], pts[0][1]); for (let k = 1; k < pts.length; k++) g.lineTo(pts[k][0], pts[k][1]); g.closePath(); g.fill(); }, m, sh, z || 1);
  const rect = (x, y, w, h, m, sh, z) => poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], m, sh, z);
  const ell = (cx, cy, rx, ry, m, sh, z, rot) => px_shape(P, (g) => { g.ellipse(cx, cy, rx, ry, rot || 0, 0, 7); g.fill(); }, m, sh, z || 1);
  const ring = (cx, cy, rx, ry, w, m, sh, z, rot) => px_shape(P, (g) => { g.lineWidth = w; g.ellipse(cx, cy, rx, ry, rot || 0, 0, 7); g.stroke(); }, m, sh, z || 1);
  const ln = (pts, w, m, sh, z) => px_shape(P, (g) => { g.lineWidth = w; g.moveTo(pts[0][0], pts[0][1]); for (let k = 1; k < pts.length; k++) g.lineTo(pts[k][0], pts[k][1]); g.stroke(); }, m, sh, z || 1);
  const crv = (pts, w, m, sh, z) => px_shape(P, (g) => { g.lineWidth = w; g.moveTo(pts[0][0], pts[0][1]); for (let k = 1; k + 1 < pts.length; k += 2) g.quadraticCurveTo(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1]); g.stroke(); }, m, sh, z || 1);
  const pix = (x, y, m, t, z) => px_tone(P, x, y, m, t, z || 30);
  const txt = (s, x, y, m, t, z) => { s = String(s).toUpperCase(); for (let c = 0; c < s.length; c++) { const gl = IC_FONT[s[c]]; if (!gl) continue; for (let k = 0; k < 15; k++) if (gl[k] === '1') pix(x + c * 4 + (k % 3), y + ((k / 3) | 0), m, t, z); } };
  const scrib = (x, y, w, rows, gap, m, t, z) => { for (let j = 0; j < rows; j++) { let xx = x; const ww = w - (j === rows - 1 ? w * .35 : r() * 4); while (xx < x + ww) { const run = 2 + ((r() * 4) | 0); for (let k = 0; k < run && xx < x + ww; k++, xx++) pix(xx, y + j * gap + ((k === 1 && r() < .3) ? -1 : 0), m, t, z); xx += 1; } } };
  const hole = (x, y) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= N || y >= N) return; const i = y * N + x; P.M[i] = -1; P.Z[i] = 32000; };
  const holeEll = (cx, cy, rx, ry) => { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const a = (x + .5 - cx) / rx, b = (y + .5 - cy) / ry; if (a * a + b * b <= 1) hole(x, y); } };
  // common materials
  const brass = () => M([196, 150, 62], { lk: .75, bias: .5 }), paperM = (c) => M(c || [226, 214, 178], { dither: true, bias: .6, lk: .6 }), inkM = () => M([40, 40, 70], { bias: .5 });
  const redM = () => M([176, 40, 40]), steel = () => M([150, 156, 166], { lk: .75, bias: .5 }), blackM = () => M([42, 40, 46], { bias: .45, lk: .5 });
  switch (id) {
    case 'boiler_key': {
      const b = brass(), pa = paperM([214, 196, 150]), rd = redM();
      poly([[5, 33], [16, 30], [19, 42], [8, 45]], pa, G(12, 38, .6), 1); hole(10, 35); ln([[10, 35], [14, 21]], 1, rd, .6, 2); txt('B', 11, 37, rd, 1, 3);
      px_shape(P, (g) => { g.ellipse(17, 16, 10, 10, 0, 0, 7); g.ellipse(17, 16, 4.5, 4.5, 0, 0, 7); g.fill('evenodd'); }, b, SP(17, 16, 10, 10, .55), 4);
      ln([[24, 23], [45, 44]], 5, b, (x, y) => .55 + ((x - y) * .12), 4); ell(24, 23, 4, 4, b, .5, 5);
      ln([[39, 38], [34, 43]], 4, b, .45, 4); ln([[44, 43], [39, 48]], 4, b, .4, 4); ln([[42, 41], [40, 43]], 2, b, .3, 5);
      break;
    }
    case 'chalk_stub': {
      const ch = M([236, 234, 224], { bias: .6, hs: .4 }), dust = M([210, 210, 214], { bias: .5 });
      ln([[14, 36], [37, 23]], 11, ch, (x, y) => .62 - ((y - 30) + (x - 26) * .5) * .035, 2);
      ell(37.5, 23, 3.4, 5.8, ch, .9, 3, -1.05); ell(13.5, 36.5, 4, 5.4, ch, (x, y) => .55 + (x < 13 ? -.15 : 0), 3, -1.05);
      for (let k = 0; k < 14; k++) pix(10 + r() * 34, 42 + r() * 8, dust, (r() * 3) | 0, 1);
      for (let k = 0; k < 6; k++) pix(18 + k * 3, 30 - (k & 1), ch, 4, 4);
      break;
    }
    case 'torn_page': {
      const pa = paperM([222, 210, 172]), pen = M([70, 64, 66]), rd = redM();
      const edge = []; for (let y = 5; y <= 51; y += 3) edge.push([40 + (y % 6 ? 4 : -1) + r() * 2, y]);
      poly([[10, 6], ...edge, [12, 50], [8, 28]], pa, G(25, 28, .62, .012), 1);
      ring(26, 22, 7, 9, 1.2, pen, .45, 2); ln([[22, 21], [24, 21]], 1, pen, .3, 3); ln([[28, 21], [30, 21]], 1, pen, .3, 3); ln([[25, 26], [27, 26]], 1, pen, .3, 3);
      ln([[18, 34], [34, 34]], 1, pen, .4, 2); for (let k = 0; k < 6; k++) ln([[19 + k * 2, 31], [17 + k * 2, 33]], 1, pen, .55, 2);
      scrib(14, 39, 22, 3, 4, pen, 2, 3); ring(31, 41, 6, 4.5, 1.4, rd, .6, 4);
      break;
    }
    case 'ration_coupon': {
      const pa = paperM([214, 192, 120]), rd = redM(), ink = M([70, 52, 40]);
      poly([[5, 17], [50, 13], [52, 39], [7, 43]], pa, G(28, 28, .6, .01), 1);
      for (let k = 0; k < 7; k++) { holeEll(5.5, 19 + k * 3.6, 1.2, 1.2); holeEll(51.5, 15 + k * 3.6, 1.2, 1.2); }
      ln([[9, 20], [47, 17]], 1, ink, .4, 2); ln([[10, 37], [48, 34]], 1, ink, .4, 2);
      txt('RATION', 11, 22, rd, 1, 3); txt('4417', 12, 30, ink, 1, 3); ring(41, 30, 5, 5, 1.5, rd, .5, 4); pix(41, 30, rd, 2, 5); pix(40, 29, rd, 1, 5);
      break;
    }
    case 'cigarettes': {
      const red = M([178, 50, 44], { dither: true }), wh = M([236, 230, 212]), fl = M([196, 130, 60]), foil = steel(), gold = brass();
      for (const [x, h] of [[22, 9], [28, 6]]) { rect(x, 12 - h + 6, 4, h + 4, wh, .75, 1); rect(x, 12 - h + 6, 4, 3, fl, .6, 2); }
      rect(14, 14, 28, 36, red, G(28, 32, .55, .016), 3); rect(14, 14, 28, 6, foil, G(28, 17, .6, .03), 4);
      rect(14, 27, 28, 9, wh, G(28, 31, .6, .01), 4); txt('UNION', 18, 29, red, 1, 5);
      for (let x = 15; x < 42; x += 2) pix(x, 38, gold, 3, 5); rect(37, 14, 5, 36, red, .3, 4);
      break;
    }
    case 'ledger': case 'matron_ledger': {
      const fat = id === 'matron_ledger', cov = M(fat ? [44, 84, 60] : [40, 76, 60], { dither: true }), sp = M([30, 46, 40]), pg = paperM([226, 214, 178]), gold = brass(), rd = redM();
      const t = fat ? 8 : 5;
      poly([[13, 7 + 0], [44, 7], [44 + t * .6, 9], [44 + t * .6, 48], [44, 50], [13, 50]], pg, (x, y) => .5 + ((y & 1) ? .12 : 0), 1);
      rect(9, 5, 35, 43, cov, G(26, 26, .55, .014), 3); rect(9, 5, 6, 43, sp, G(12, 26, .5, .03), 4);
      for (const yy of [10, 42]) ln([[9, yy], [15, yy]], 1, gold, .7, 5);
      rect(21, 13, 17, 9, gold, G(29, 17, .6, .03), 5); rect(23, 15, 13, 5, cov, .35, 6);
      if (fat) { for (const [yy, c] of [[14, [190, 60, 60]], [24, [70, 110, 170]], [34, [210, 180, 70]]]) rect(44 + t * .6, yy, 4, 5, M(c), .55, 2); rect(38, 24, 8, 8, gold, SP(42, 28, 4, 4, .55), 6); pix(42, 28, cov, 0, 7); }
      else { ln([[33, 48], [33, 54], [31, 53]], 2, rd, .55, 2); for (const [cx, cy] of [[43, 6], [43, 47]]) poly([[cx - 4, cy - 1], [cx + 1, cy - 1], [cx + 1, cy + 3]], gold, .6, 6); }
      break;
    }
    case 'rhea_pin': {
      const en = M([186, 34, 40], { lk: .6 }), gold = brass(), st = steel();
      ln([[8, 44], [46, 38]], 1.6, st, .7, 1);
      poly([[28, 6], [44, 15], [44, 33], [28, 47], [12, 33], [12, 15]], gold, G(28, 26, .6, .02), 2);
      poly([[28, 10], [40, 17], [40, 31], [28, 42], [16, 31], [16, 17]], en, G(28, 26, .55, .022), 3);
      px_shape(P, (g) => { for (let i = 0; i < 10; i++) { const a = i * .6283 - 1.5708, rr = i % 2 ? 4 : 9.5; g.lineTo(28 + Math.cos(a) * rr, 26 + Math.sin(a) * rr); } g.closePath(); g.fill(); }, gold, G(28, 26, .7, .03), 4);
      pix(18, 18, en, 4, 5); pix(19, 17, en, 4, 5);
      break;
    }
    case 'note_yesterday_1': case 'note_yesterday_2': case 'note_yesterday_3': {
      const n = +id.slice(-1), pa = paperM(n === 1 ? [232, 226, 204] : n === 2 ? [228, 216, 160] : [230, 206, 196]), ln_ = M([140, 160, 196]), rd = M([200, 90, 90]), ink = inkM();
      const rot = (n - 2) * .1, ca = Math.cos(rot), sa = Math.sin(rot), T = (x, y) => [28 + (x - 28) * ca - (y - 28) * sa, 28 + (x - 28) * sa + (y - 28) * ca];
      const pts = n === 1 ? [[9, 8], [16, 6], [23, 9], [31, 6], [38, 9], [46, 7], [46, 50], [10, 50]] : n === 2 ? [[10, 6], [46, 6], [46, 40], [36, 50], [10, 50]] : [[9, 7], [46, 5], [48, 27], [45, 50], [11, 51], [7, 30]];
      poly(pts.map((p) => T(p[0], p[1])), pa, n === 3 ? (x, y) => .6 + (pt_vn(x * .25, y * .25, 3) - .5) * .5 : G(28, 28, .62, .01), 1);
      if (n === 2) poly([T(36, 50), T(46, 40), T(37, 41)], pa, .35, 2);
      for (let yy = 15; yy < 48; yy += 5) for (let xx = 11; xx < 45; xx++) { const q = T(xx, yy); const i = Math.round(q[1]) * N + Math.round(q[0]); if (P.M[i] === pa) pix(q[0], q[1], ln_, 2, 2); }
      for (let yy = 8; yy < 49; yy++) { const q = T(16, yy); const i = Math.round(q[1]) * N + Math.round(q[0]); if (P.M[i] === pa || P.M[i] === ln_) pix(q[0], q[1], rd, 2, 3); }
      const rn = ['I', 'II', 'III'][n - 1]; const tq = T(20, 10); for (let c = 0; c < rn.length; c++) for (let yy = 0; yy < 7; yy++) { pix(tq[0] + c * 4, tq[1] + yy, ink, 1, 5); pix(tq[0] + c * 4 + 1, tq[1] + yy, ink, 2, 5); }
      for (let j = 0; j < 5; j++) { const q = T(19, 19 + j * 5); scrib(q[0], q[1] - 1, j === 4 ? 14 : 24, 1, 5, ink, 1, 4); }
      break;
    }
    case 'radio_tube': case 'gregor_tubes': {
      if (id === 'gregor_tubes') {
        const box = M([170, 130, 84], { dither: true }), news = paperM([206, 200, 180]), gl = M([170, 206, 210], { bias: .5, lk: .7 }), ink = M([70, 66, 64]);
        for (let k = 0; k < 3; k++) { const x = 15 + k * 10; ell(x + 3, 17 - (k & 1) * 3, 4.2, 7, gl, SP(x + 3, 17 - (k & 1) * 3, 4.2, 7, .6), 2); pix(x + 1, 13 - (k & 1) * 3, gl, 4, 3); pix(x + 1, 14 - (k & 1) * 3, gl, 4, 3); poly([[x - 1, 22], [x + 7, 22], [x + 8, 30], [x - 2, 30]], news, G(x + 3, 26, .6, .03), 3); scrib(x, 25, 6, 2, 2, ink, 1, 4); }
        poly([[9, 26], [47, 26], [45, 50], [11, 50]], box, G(28, 38, .55, .015), 5); poly([[9, 26], [47, 26], [50, 21], [6, 21]], box, .72, 4);
        txt('6', 26, 36, ink, 0, 6); ln([[12, 31], [44, 31]], 1, box, .3, 6);
        break;
      }
      const gl = M([160, 204, 210], { bias: .5, lk: .75, dither: true }), bk = blackM(), pl = steel(), fil = M([255, 150, 60], { glow: true, ramp: [[200, 80, 30], [255, 150, 60], [255, 230, 160]] }), pins = brass();
      for (let k = 0; k < 4; k++) rect(20 + k * 5, 46, 1.5, 6, pins, .6, 1);
      px_shape(P, (g) => { g.moveTo(17, 40); g.lineTo(16, 18); g.quadraticCurveTo(16, 6, 28, 5); g.quadraticCurveTo(40, 6, 40, 18); g.lineTo(39, 40); g.closePath(); g.fill(); }, gl, (x, y) => .55 - (x - 28) * .025 + (x < 21 ? .25 : 0), 2);
      rect(22, 16, 12, 18, pl, G(28, 25, .4, .03), 3); for (let y = 18; y < 33; y += 3) ln([[23, y], [33, y]], 1, pl, .2, 4);
      ln([[26, 33], [26, 20], [30, 20], [30, 33]], 1, fil, .6, 5); ell(28, 24, 2, 3, fil, .9, 6);
      for (let y = 10; y < 36; y++) pix(19, y, gl, 4, 7); pix(20, 9, gl, 4, 7);
      rect(15, 38, 26, 9, bk, G(28, 42, .5, .03), 8); ln([[16, 39], [40, 39]], 1, bk, .9, 9);
      break;
    }
    case 'bread_note': {
      const cr = M([186, 120, 58], { lk: .6 }), sc = M([232, 196, 130]), pa = paperM(), ink = inkM();
      poly([[30, 6], [38, 4], [42, 24], [34, 27]], pa, G(36, 15, .62, .02), 1); scrib(33, 9, 6, 3, 3, ink, 1, 2);
      ell(28, 34, 22, 13, cr, SP(28, 31, 22, 15, .5, .9), 3);
      for (let k = -2; k <= 2; k++) { ln([[28 + k * 8 - 3, 27], [28 + k * 8 + 2, 36]], 2, sc, .55, 4); }
      for (let k = 0; k < 8; k++) pix(12 + r() * 30, 38 + r() * 6, cr, 0, 5);
      break;
    }
    case 'vanguard_armband': {
      const rd = M([176, 32, 36], { dither: true, lk: .55 }), wh = M([236, 228, 206]), gold = brass();
      ring(28, 23, 20, 8, 3, rd, .22, 1);
      px_shape(P, (g) => { g.ellipse(28, 34, 21, 9, 0, 0, Math.PI); g.lineTo(7, 23); g.ellipse(28, 23, 21, 9, 0, Math.PI, 0, true); g.closePath(); g.fill(); }, rd, (x, y) => .6 - (x - 28) * .014 + (y > 40 ? -.15 : 0) + (Math.abs(x - 28) > 16 ? -.12 : 0), 2);
      ell(28, 32, 7, 6.5, wh, SP(28, 32, 7, 6.5, .65), 3);
      px_shape(P, (g) => { for (let i = 0; i < 10; i++) { const a = i * .6283 - 1.5708, rr = i % 2 ? 2.3 : 5.5; g.lineTo(28 + Math.cos(a) * rr, 32 + Math.sin(a) * rr); } g.closePath(); g.fill(); }, rd, .55, 4);
      for (let x = 9; x < 48; x += 3) { pix(x, 24 + Math.round(Math.sin((x - 7) / 42 * Math.PI) * 8), gold, 3, 4); pix(x, 34 + Math.round(Math.sin((x - 7) / 42 * Math.PI) * 8), gold, 1, 4); }
      break;
    }
    case 'pocket_mirror': {
      const b = brass(), gl = M([150, 196, 206], { bias: .5, lk: .7 }), ink = M([60, 70, 80]);
      ell(33, 17, 15, 11, b, SP(33, 17, 15, 11, .45), 1, -.3); ell(33, 17, 11, 7.5, b, .3, 2, -.3);
      ell(24, 33, 17, 17, b, SP(24, 33, 17, 17, .5), 3); ell(24, 33, 13, 13, gl, (x, y) => .5 - ((x - 24) * .6 + (y - 33) * .7) * .03, 4);
      ln([[16, 26], [22, 22]], 2, gl, .98, 5); ln([[17, 31], [27, 24]], 1, gl, .9, 5);
      ln([[27, 22], [24, 32], [30, 38], [28, 44]], 1, ink, .4, 6); rect(34, 22, 4, 4, b, .7, 5);
      break;
    }
    case 'warden_badge': {
      const g_ = brass(), en = M([120, 30, 34]), gd = M([226, 196, 110], { lk: .7 });
      poly([[28, 4], [47, 12], [46, 32], [28, 51], [10, 32], [9, 12]], g_, G(28, 26, .62, .02), 1);
      poly([[28, 9], [42, 15], [41, 31], [28, 45], [15, 31], [14, 15]], en, G(28, 26, .55, .02), 2);
      px_shape(P, (g) => { g.moveTo(22, 32); g.quadraticCurveTo(22, 16, 28, 16); g.quadraticCurveTo(34, 16, 34, 32); g.lineTo(36, 34); g.lineTo(20, 34); g.closePath(); g.fill(); }, gd, G(28, 26, .6, .03), 3);
      ell(28, 37, 2.4, 2.2, gd, .6, 3); pix(28, 14, gd, 3, 4); pix(28, 15, gd, 2, 4);
      break;
    }
    case 'sweet_roll': {
      const dough = M([212, 146, 74], { lk: .65 }), sw = M([150, 86, 40]), ic = M([246, 240, 226], { bias: .6 });
      ell(28, 33, 22, 14, dough, SP(28, 30, 22, 16, .55, .8), 1);
      px_shape(P, (g) => { g.lineWidth = 2.4; for (let a = 0; a < 15; a += .2) { const rr = 1.3 * a, x = 28 + Math.cos(a) * rr, y = 31 + Math.sin(a) * rr * .6; if (a === 0) g.moveTo(x, y); else g.lineTo(x, y); } g.stroke(); }, sw, .45, 2);
      crv([[12, 28], [20, 20], [28, 26], [36, 32], [44, 25]], 2.4, ic, .8, 3); crv([[16, 36], [24, 30], [32, 37], [38, 40], [42, 34]], 2, ic, .7, 3);
      pix(20, 31, ic, 4, 4); pix(20, 32, ic, 3, 4); pix(36, 33, ic, 3, 4); pix(36, 34, ic, 2, 4);
      break;
    }
    case 'ration_tea': {
      const en = M([228, 224, 210], { bias: .6, hs: .5 }), rim = M([60, 90, 140]), tea = M([96, 54, 30]), tag = M([220, 190, 80]), st = M([210, 214, 220]), ch = M([60, 66, 74]);
      ring(41, 32, 6, 7, 3.4, en, .5, 1);
      poly([[13, 20], [39, 20], [37, 47], [15, 47]], en, (x, y) => .7 - (x - 18) * .022, 2); ell(26, 20, 13, 4, rim, .5, 3); ell(26, 20.5, 11, 2.8, tea, .4, 4);
      for (const [x, y] of [[18, 30], [33, 40], [21, 44]]) { pix(x, y, ch, 1, 5); pix(x + 1, y, ch, 2, 5); }
      ln([[33, 20], [37, 28]], 1, M([200, 200, 190]), .8, 5); rect(35, 28, 5, 6, tag, .65, 6);
      for (const [x0, ph] of [[20, 0], [27, 2], [33, 1]]) for (let k = 0; k < 9; k++) if ((k + ph) % 3 !== 0) pix(x0 + Math.round(Math.sin((k + ph) * .8) * 1.5), 15 - k, st, 2 - (k > 5 ? 1 : 0), 6);
      ell(26, 48, 11, 2, en, .3, 1);
      break;
    }
    case 'exam_booklet': {
      const cov = M([164, 180, 140], { dither: true }), rd = redM(), ink = M([60, 60, 56]), st = steel();
      rect(11, 5, 34, 46, cov, G(28, 28, .58, .012), 1); rect(11, 5, 34, 11, rd, G(28, 10, .55, .02), 2); txt('EXAM', 20, 8, M([240, 226, 200]), 1, 3);
      ring(28, 29, 7, 7, 1.3, ink, .4, 3); ln([[25, 29], [31, 29]], 1, ink, .4, 3); ln([[28, 26], [28, 32]], 1, ink, .4, 3);
      for (let k = 0; k < 3; k++) ln([[17, 40 + k * 3], [39, 40 + k * 3]], 1, ink, .55, 3);
      for (const y of [16, 40]) rect(11, y, 2, 3, st, .8, 3);
      break;
    }
    case 'vasha_notebook': {
      const cov = M([92, 100, 64], { dither: true }), bk = blackM(), pc = M([206, 160, 60]), pg = paperM(), wh = M([210, 206, 180]);
      poly([[12, 7], [42, 7], [44, 9], [44, 50], [12, 50]], pg, .5, 1);
      rect(10, 6, 32, 43, cov, G(26, 27, .55, .013), 2); rect(34, 6, 3, 43, bk, .45, 3);
      ln([[44, 8], [44, 46]], 3, pc, (x, y) => .6 - (x - 44) * .1, 4); poly([[42.5, 46], [45.5, 46], [44, 51]], M([220, 190, 150]), .6, 4); pix(44, 50, bk, 0, 5); rect(41, 10, 6, 3, steel(), .7, 5);
      px_shape(P, (g) => { for (let i = 0; i < 10; i++) { const a = i * .6283 - 1.5708, rr = i % 2 ? 2.5 : 6; g.lineTo(22 + Math.cos(a) * rr, 24 + Math.sin(a) * rr); } g.closePath(); g.fill(); }, wh, .55, 3);
      txt('7', 19, 38, wh, 1, 3); txt('9', 23, 38, wh, 1, 3);
      break;
    }
    case 'staged_rope': {
      const rp = M([176, 140, 90], { bias: .55 }), cut = M([232, 210, 160]);
      const tw = (x, y) => .55 + (((x + y * 2) & 3) < 2 ? .16 : -.12);
      for (let k = 0; k < 4; k++) ring(26, 38 - k * 3, 18 - k * 2, 8 - k, 4, rp, (x, y) => tw(x, y) - (y > 40 - k * 3 ? -.05 : .1), 1 + k);
      crv([[38, 30], [50, 24], [44, 12], [38, 2], [30, 9], [26, 16], [34, 20]], 4, rp, tw, 6);
      ell(34.5, 20, 2.6, 2.6, cut, .7, 7); pix(34, 19, cut, 4, 8);
      ell(30, 14, 3.5, 3, rp, (x, y) => tw(x, y) - .05, 7);
      break;
    }
    case 'mic_cable': {
      const cb = M([40, 40, 46], { lk: .55 }), st = steel(), gold = brass();
      for (let k = 0; k < 4; k++) ring(24, 32 - k * 2.5, 17 - k * 1.5, 10 - k, 3, cb, (x, y) => (y < 30 - k * 2.5 ? .65 : .35), 1 + k);
      crv([[38, 28], [44, 22], [42, 14]], 3, cb, .5, 6); rect(37, 5, 9, 10, st, G(41, 10, .6, .04), 7); for (let k = 0; k < 3; k++) pix(39 + k * 2, 4, gold, 3, 8);
      crv([[10, 36], [6, 44], [12, 48]], 3, cb, .5, 6); rect(12, 45, 9, 7, st, G(16, 48, .6, .04), 7); rect(20, 46, 2, 5, st, .3, 8);
      break;
    }
    case 'school_cap': {
      const cl = M([56, 72, 96], { dither: true, lk: .5 }), vs = blackM(), gold = brass(), bd = M([36, 44, 60]);
      px_shape(P, (g) => { g.moveTo(8, 30); g.quadraticCurveTo(8, 10, 28, 9); g.quadraticCurveTo(48, 10, 48, 28); g.lineTo(46, 34); g.lineTo(10, 34); g.closePath(); g.fill(); }, cl, SP(28, 24, 22, 16, .5, .8), 1);
      rect(9, 28, 38, 6, bd, G(28, 31, .45, .02), 2);
      px_shape(P, (g) => { g.moveTo(12, 34); g.quadraticCurveTo(28, 50, 47, 36); g.lineTo(44, 33); g.lineTo(12, 33); g.closePath(); g.fill(); }, vs, (x, y) => .6 - (y - 34) * .05, 3);
      ell(28, 22, 4, 4, gold, SP(28, 22, 4, 4, .55), 3); ln([[16, 38], [26, 41]], 1, vs, .9, 4);
      break;
    }
    case 'bent_spoon': {
      const st = M([188, 190, 196], { lk: .8, bias: .5 });
      crv([[8, 48], [22, 36], [24, 30], [26, 24], [33, 22]], 4, st, (x, y) => .55 + (x + y < 54 ? .2 : 0), 1);
      ell(39, 17, 9, 6.5, st, SP(39, 17, 9, 6.5, .55, .9), 2, -.6); ell(39.5, 17.5, 5.5, 3.6, st, (x, y) => .3 + (x - 39) * .04, 3, -.6); pix(36, 15, st, 4, 4); pix(37, 14, st, 4, 4);
      break;
    }
    case 'relay_pass': case 'forged_pass': {
      const forged = id === 'forged_pass', cd = M(forged ? [214, 200, 156] : [196, 208, 186], { dither: true, bias: .6 }), ph = M([120, 124, 130]), sk = M([200, 170, 150]), ink = M([50, 56, 60]), stp = M(forged ? [120, 60, 140] : [176, 40, 40]), clip = steel();
      if (forged) poly([[6, 10], [50, 7], [51, 46], [7, 49]], cd, (x, y) => .6 + (pt_vn(x * .2, y * .2, 4) - .5) * .25, 1); else rect(6, 10, 44, 34, cd, G(28, 27, .62, .01), 1);
      if (!forged) { rect(23, 4, 10, 8, clip, G(28, 8, .6, .04), 3); holeEll(28, 7, 2.5, 1.2); }
      rect(10, 15, 13, 16, ph, .4, 2); ell(16.5, 21, 3.4, 4, sk, SP(16.5, 21, 3.4, 4, .5), 3); poly([[11, 31], [13, 26], [20, 26], [22, 31]], ink, .45, 3);
      txt('PASS', 27, 15, ink, 0, 3); scrib(27, 23, 19, 3, 3, ink, 1, 3);
      ring(22, 34, 6, 6, 1.4, stp, .55, 5); txt('4', 20, 32, stp, 1, 5); if (forged) { ring(24, 35, 6, 6, 1, stp, .75, 4); crv([[30, 42], [34, 36], [38, 41], [42, 46], [46, 38]], 1, ink, .3, 4); }
      if (!forged) { for (let x = 7; x < 50; x++) pix(x, 11, cd, 4, 2); }
      break;
    }
    case 'relay_log': {
      const cov = M([110, 126, 116], { dither: true }), pg = paperM(), tape = M([200, 190, 150]), gr = M([60, 56, 40]), ink = inkM();
      poly([[13, 7], [44, 7], [46, 9], [46, 50], [13, 50]], pg, (x, y) => .5 + ((y & 1) ? .1 : 0), 1);
      rect(10, 5, 34, 44, cov, G(27, 27, .56, .013), 2); rect(10, 5, 5, 44, tape, G(12, 27, .55, .03), 3);
      rect(20, 12, 18, 9, pg, .62, 3); txt('LOG', 23, 14, ink, 1, 4);
      ring(29, 33, 5, 5, 1, ink, .4, 3); for (const rr of [8, 11]) px_shape(P, (g) => { g.lineWidth = 1; g.arc(29, 33, rr, -2.2, -.9); g.stroke(); }, ink, .5, 3);
      for (const [x, y, s] of [[36, 40, 3], [19, 42, 2], [40, 27, 2]]) ell(x, y, s, s * .8, gr, .3, 4);
      break;
    }
    case 'master_tape': {
      const tin = M([150, 154, 160], { lk: .75 }), tp = M([92, 62, 40]), rd = redM(), wh = M([236, 226, 200]);
      ell(28, 30, 22, 20, tin, SP(28, 28, 22, 22, .5, .7), 1); ring(28, 30, 22, 20, 1.5, tin, .25, 2);
      ell(28, 30, 15, 13.5, tp, (x, y) => .45 + Math.sin(Math.hypot(x - 28, y - 30) * 2.2) * .12, 2);
      ell(28, 30, 6, 5.5, tin, SP(28, 30, 6, 5.5, .6), 3); for (let k = 0; k < 3; k++) { const a = k * 2.094 - 1.57; holeEll(28 + Math.cos(a) * 3.2, 30 + Math.sin(a) * 3, 1.1, 1.1); }
      rect(9, 44, 38, 8, wh, .62, 4); txt('JUBILEE', 10, 45, rd, 1, 5);
      break;
    }
    case 'counter_tone': {
      const tin = M([60, 104, 130], { dither: true }), pat = M([214, 180, 90]), sc = M([200, 156, 62], { dither: true }), wx = blackM(), gw = M([127, 208, 192], { glow: true, ramp: [[60, 140, 130], [127, 208, 192], [210, 255, 240]] });
      for (let k = 0; k < 22; k++) { const a = r() * 6.28, rr = 22 + r() * 5; pix(28 + Math.cos(a) * rr, 30 + Math.sin(a) * rr * .8, gw, (r() * 3) | 0, 1); }
      ell(28, 38, 20, 9, tin, (x, y) => .4 - (x - 28) * .01, 2); rect(8, 22, 40, 16, tin, G(28, 30, .55, .015), 3); ell(28, 22, 20, 8, tin, SP(28, 22, 20, 8, .65), 4);
      for (let x = 10; x < 47; x += 4) { pix(x, 30, pat, 3, 5); pix(x + 2, 33, pat, 2, 5); }
      ell(28, 21, 7, 3.2, wx, SP(28, 20, 7, 3.2, .55), 5); rect(21, 12, 14, 9, wx, (x, y) => .45 - (x - 28) * .04 + (x === 23 ? .4 : 0), 5); ell(28, 12, 7, 3, wx, .75, 6); ell(28, 12, 2, 1, gw, .7, 7);
      crv([[6, 30], [20, 40], [36, 38], [44, 36], [50, 28]], 6, sc, (x, y) => .55 + (((x + y) % 4) < 2 ? .1 : -.1), 6); poly([[46, 30], [52, 40], [47, 44], [44, 34]], sc, .4, 7);
      break;
    }
    case 'inspector_card': {
      const cd = M([232, 222, 196], { bias: .6, dither: true }), emb = M([200, 186, 150]), ink = M([46, 44, 50]), gold = brass();
      rect(5, 13, 46, 30, cd, G(28, 28, .62, .01), 1);
      px_shape(P, (g) => { g.moveTo(14, 27); g.quadraticCurveTo(20, 19, 26, 27); g.quadraticCurveTo(20, 33, 14, 27); g.fill(); }, emb, .45, 2);
      ell(20, 27, 2.4, 2.4, ink, .3, 3); ln([[14, 26], [26, 26]], 1, gold, .6, 4); for (const dx of [-4, 0, 4]) pix(20 + dx, 22 - (dx ? 0 : 1), emb, 1, 3);
      txt('VOSS', 30, 20, ink, 0, 3); scrib(30, 28, 17, 3, 3, ink, 2, 3); for (let x = 6; x < 50; x++) pix(x, 14, cd, 4, 2);
      break;
    }
    case 'black_market_ticket': {
      const tk = M([184, 92, 74], { dither: true }), ink = M([50, 30, 26]), pa = M([232, 210, 170]);
      poly([[6, 16], [50, 12], [51, 40], [7, 44]], tk, G(28, 28, .58, .012), 1);
      for (let k = 0; k < 6; k++) holeEll(36 + (k % 2) * 4, 17 + k * 3.8, 1.3, 1.3);
      for (let x = 8; x < 50; x += 2) { const y = 16 - (x - 6) * .09; pix(x, y + 3, pa, 3, 2); }
      txt('XII', 11, 21, pa, 3, 3); scrib(10, 30, 22, 2, 4, ink, 1, 3); ln([[31, 15], [32, 42]], 1, ink, .4, 2);
      break;
    }
    case 'banned_book': {
      const cov = M([108, 84, 62], { dither: true }), sp = M([74, 56, 42]), pg = paperM(), bm = M([210, 200, 160]);
      poly([[16, 8], [42, 8], [44, 10], [44, 49], [16, 49]], pg, (x, y) => .5 + ((y & 1) ? .1 : 0), 1);
      rect(13, 6, 29, 42, cov, (x, y) => G(27, 27, .55, .012)(x, y) + (pt_vn(x * .3, y * .3, 8) - .5) * .25, 2); rect(13, 6, 4, 42, sp, G(15, 27, .5, .03), 3);
      rect(30, 2, 5, 10, bm, G(32, 6, .6, .04), 1); poly([[38, 6], [42, 6], [42, 10]], pg, .6, 3);
      for (let k = 0; k < 4; k++) pix(20 + k * 5, 47, sp, 1, 4);
      break;
    }
    case 'tram_token': {
      const b = brass(), en = M([150, 110, 44]);
      ell(28, 28, 20, 20, b, SP(28, 28, 20, 20, .55, .7), 1); ring(28, 28, 17, 17, 1.2, en, .4, 2); ring(28, 28, 19.5, 19.5, 1, b, .25, 2);
      holeEll(28, 28, 4, 4); ring(28, 28, 5, 5, 1, en, .35, 2);
      rect(17, 13, 22, 7, en, .45, 3); rect(19, 14, 3, 3, b, .75, 4); rect(24, 14, 3, 3, b, .75, 4); rect(29, 14, 3, 3, b, .75, 4); rect(34, 14, 3, 3, b, .75, 4); ln([[22, 11], [27, 8]], 1, en, .4, 3);
      for (let k = 0; k < 9; k++) { const a = k / 9 * 3.14 + .2; pix(28 + Math.cos(a) * 12, 28 + Math.sin(a) * 12 + 2, en, 1, 3); }
      break;
    }
    case 'wrench': {
      const ir = M([110, 116, 124], { lk: .7 }), oil = M([60, 64, 72]), rust = M([150, 86, 50]);
      ln([[12, 46], [36, 20]], 6, ir, (x, y) => .55 + ((x + y) < 56 ? .15 : -.05), 1);
      poly([[30, 20], [40, 8], [48, 12], [44, 18], [38, 17], [38, 24]], ir, G(39, 16, .6, .03), 2); poly([[36, 27], [44, 22], [48, 26], [40, 31]], ir, .45, 2);
      rect(33, 22, 6, 6, oil, (x, y) => .5 + ((y & 1) ? .2 : -.1), 3);
      for (const [x, y] of [[18, 40], [24, 33], [15, 44]]) { pix(x, y, rust, 2, 4); pix(x + 1, y, rust, 1, 4); }
      ln([[14, 43], [30, 25]], 1, ir, .95, 4);
      break;
    }
    case 'osk_keys': {
      const st = steel(), b = brass(), cu = M([176, 110, 70]), tg = paperM([230, 222, 196]), ink = M([60, 50, 50]);
      ring(28, 20, 15, 12, 2.4, st, (x, y) => (y < 18 ? .8 : .4), 1);
      const keys = [[-12, 30, b], [-6, 34, st], [0, 36, cu], [6, 34, b], [12, 30, st], [-9, 32, cu], [9, 32, b]];
      keys.forEach(([dx, len, m], k) => { const x0 = 28 + dx * 1.1, y0 = 20 + 12 * Math.sqrt(Math.max(0, 1 - (dx * 1.1 / 15) ** 2)); const ang = dx * .06; const x1 = x0 + Math.sin(ang) * (len - 12), y1 = y0 + (len - 12) * Math.cos(ang); ell(x0, y0 + 1, 2.6, 2.6, m, .6, 2 + k); ln([[x0, y0 + 3], [x1, Math.min(52, y1 + 3)]], 2, m, .55, 2 + k); pix(x1 + 1, Math.min(52, y1 + 1), m, 2, 3 + k); });
      for (const [x, y] of [[10, 30], [41, 33]]) { rect(x, y, 6, 5, tg, .6, 12); txt('-', x + 1, y, ink, 0, 13); }
      break;
    }
    case 'choir_score': {
      const pa = paperM([232, 222, 190]), ink = M([46, 40, 40]), pen = M([180, 70, 60]);
      poly([[13, 5], [47, 8], [44, 52], [10, 49]], pa, G(28, 28, .5, .01), 1);
      poly([[8, 7], [42, 5], [43, 47], [8, 50]], pa, G(25, 27, .62, .01), 2);
      for (let s = 0; s < 3; s++) for (let l = 0; l < 5; l++) ln([[11, 11 + s * 12 + l * 2], [40, 10 + s * 12 + l * 2]], .8, ink, .55, 3);
      for (let k = 0; k < 9; k++) { const x = 14 + k * 3, y = 11 + ((k * 7) % 3) * 12 + ((k * 5) % 5) * 1.5; ell(x, y + 1, 1.3, 1, ink, .2, 4); ln([[x + 1, y + 1], [x + 1, y - 4]], .8, ink, .3, 4); }
      ln([[34, 46], [37, 39], [40, 43]], 1, pen, .55, 5); ln([[37, 39], [37, 46]], 1, pen, .55, 5);
      break;
    }
    case 'wren_note': {
      const pa = paperM([224, 210, 186]), c1 = M([200, 60, 50]), c2 = M([60, 100, 180]), c3 = M([80, 150, 80]), ink = M([60, 56, 60]);
      poly([[12, 14], [44, 11], [46, 43], [14, 46]], pa, G(28, 28, .6, .012), 1); ln([[13, 30], [45, 27]], 1, pa, .35, 2); ln([[28, 12], [30, 45]], 1, pa, .35, 2);
      crv([[16, 18], [20, 14], [24, 20]], 1.4, c1, .55, 3); crv([[33, 35], [38, 31], [42, 38]], 1.4, c2, .55, 3); ln([[17, 38], [24, 34], [20, 42]], 1.4, c3, .55, 3);
      ell(37, 18, 3, 2, c2, .5, 3); pix(40, 17, c1, 2, 4); txt('TO', 17, 22, ink, 0, 3);
      break;
    }
    case 'cylinder_blank': {
      const wx = M([44, 40, 46], { lk: .55 }), sl = M([186, 156, 110], { dither: true }), ink = M([90, 60, 40]);
      rect(14, 8, 20, 30, wx, (x, y) => .4 - (x - 20) * .04 + (x === 17 || x === 18 ? .5 : 0), 1); ell(24, 8, 10, 3.5, wx, .65, 2); ell(24, 8, 4, 1.5, wx, .1, 3);
      rect(13, 26, 22, 24, sl, G(24, 38, .58, .02), 4); ell(24, 50, 11, 3.5, sl, .4, 3); ell(24, 26, 11, 3.5, sl, .7, 4); ell(24, 26, 9.5, 2.6, wx, .3, 5);
      rect(15, 34, 18, 6, M([226, 214, 178]), .6, 5); scrib(16, 36, 15, 1, 3, ink, 1, 6);
      break;
    }
    case 'vasha_letter': {
      const en = paperM([222, 212, 180]), fl = M([200, 190, 156]), wax = M([150, 36, 40]), ink = inkM();
      poly([[5, 14], [50, 11], [52, 42], [7, 45]], en, G(28, 28, .6, .01), 1);
      ln([[6, 15], [29, 32], [51, 12]], 1.2, fl, .35, 2); ln([[8, 44], [24, 30]], 1, fl, .4, 2); ln([[51, 41], [33, 29]], 1, fl, .4, 2);
      ell(29, 31, 5, 4.6, wax, SP(29, 31, 5, 4.6, .55), 3); pix(28, 30, wax, 4, 4); ell(16, 22, 3, 2, ink, .7, 3);
      for (let k = 0; k < 4; k++) rect(36 + k * 3, 36, 2, 2, ink, .4, 3);
      break;
    }
    case 'fake_bell_schedule': {
      const pa = paperM([226, 222, 204]), ink = M([50, 50, 56]), rd = redM(), gold = brass();
      poly([[8, 5], [48, 7], [47, 52], [9, 50]], pa, G(28, 28, .62, .01), 1);
      px_shape(P, (g) => { g.moveTo(24, 16); g.quadraticCurveTo(24, 9, 28, 9); g.quadraticCurveTo(32, 9, 32, 16); g.lineTo(34, 17); g.lineTo(22, 17); g.closePath(); g.fill(); }, gold, G(28, 13, .6, .05), 2);
      for (let k = 0; k < 6; k++) ln([[12, 21 + k * 5], [44, 21.5 + k * 5]], .8, ink, .55, 2); ln([[22, 20], [22, 47]], .8, ink, .55, 2);
      for (let k = 0; k < 5; k++) { scrib(13, 23 + k * 5, 7, 1, 1, ink, 1, 3); scrib(24, 23 + k * 5, 15, 1, 1, ink, 2, 3); }
      for (const yy of [28, 38]) { ln([[24, yy], [40, yy - 1]], 1, rd, .6, 4); }
      ring(35, 43, 5, 3, 1.2, rd, .6, 4); ln([[42, 13], [46, 20]], 1, rd, .6, 4); ln([[46, 13], [42, 20]], 1, rd, .6, 4);
      break;
    }
    case 'thermos': {
      const gr = M([70, 112, 80], { lk: .55, dither: true }), st = steel(), stc = M([226, 220, 190]), ink = M([60, 50, 50]);
      rect(17, 13, 22, 38, gr, (x, y) => .55 - (x - 22) * .03 + (x > 34 ? -.1 : 0) - (Math.hypot(x - 32, y - 38) < 3.5 ? .25 : 0), 1);
      ell(28, 51, 11, 2.5, gr, .3, 1); rect(18, 6, 20, 9, st, G(28, 10, .55, .03), 2); ell(28, 6, 10, 2.5, st, .8, 3); rect(25, 2, 6, 3, blackM(), .5, 4);
      rect(19, 22, 15, 10, stc, .62, 3); scrib(20, 24, 12, 2, 3, ink, 1, 4); pix(31, 36, gr, 4, 4);
      for (let y = 15; y < 50; y++) pix(20, y, gr, 4, 2);
      break;
    }
    case 'quill_notes': {
      const cd = M([234, 226, 202], { bias: .6 }), ink = inkM(), lace = M([62, 44, 34]);
      for (let k = 3; k >= 0; k--) rect(9 + k * 1.2, 13 - k * 2.4, 36, 26, cd, (x, y) => .62 - k * .1 - ((x - 28) * .55 + (y - 26) * .65) * .006, 1 + (3 - k));
      for (let k = 0; k < 4; k++) scrib(13, 17 + k * 4, 26, 1, 1, ink, 1, 6);
      ln([[27, 4], [27, 45]], 2, lace, .5, 7); ln([[7, 24], [48, 26]], 2, lace, .5, 7);
      crv([[27, 25], [20, 34], [25, 37]], 1.6, lace, .55, 8); crv([[27, 25], [34, 34], [31, 37]], 1.6, lace, .55, 8); ell(27, 25, 2, 2, lace, .7, 9);
      break;
    }
    default: {
      const m = M([150, 140, 120]), ink = M([50, 44, 40]);
      rect(12, 12, 32, 32, m, G(28, 28, .6, .02), 1); txt('?', 26, 26, ink, 0, 2); txt(String(id).slice(0, 2), 24, 24, ink, 0, 2);
    }
  }
  return px_render(P, { mode: 'icon', inner: 1 });
}
function drawItemIconImpl(ctx, x, y, size, id) {
  id = String(id); let c = _icons.get(id);
  if (!c) {
    let buf; try { buf = iconBuild(id); } catch (e) { buf = pt_mk(56, 56); }
    c = pt_mk(112, 112); const g = c.getContext('2d');
    const sh = g.createRadialGradient(58, 98, 2, 58, 98, 40); sh.addColorStop(0, 'rgba(0,0,0,.42)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = sh; g.save(); g.translate(58, 98); g.scale(1, .26); g.beginPath(); g.arc(0, 0, 40, 0, 7); g.restore(); g.fill();
    g.imageSmoothingEnabled = false; g.drawImage(buf, 0, 0, 112, 112); _icons.set(id, c);
  }
  const prev = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = !(size % 56 === 0); if (ctx.imageSmoothingEnabled && 'imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(c, x, y, size, size); ctx.imageSmoothingEnabled = prev;
}

/* =============================================== PIXEL-ART PORTRAITS (v3)
 * 96x96 hand-pixel style buffer: per-material hue-shifted ramps (cool shadows / warm lights), clean clusters,
 * selective dithering (backdrop + cloth only), key light upper-left, warm rim light on the right edge,
 * cool painted backdrop. Per-character signature details are keyed on the npc look (skin|hair fingerprint).
 * buildPortraitBuffer(look,opts) returns the 96x96 canvas (swap-in seam); drawPortraitImpl adds the badge. */
const PT_N = 96;
const _pbuf = new Map(), _pcomp = new Map(); let _ptBg = null;
const PX_DET = 1, PT_B4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
/* ---- private helpers (portrait / item area; independent of other modules' internals) */
const pt_clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const pt_mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function pt_C(x) {
  if (Array.isArray(x)) return x; if (typeof x !== 'string') return [128, 128, 128];
  const s = x.trim(); if (s[0] === '#') { if (s.length === 4) return [parseInt(s[1] + s[1], 16), parseInt(s[2] + s[2], 16), parseInt(s[3] + s[3], 16)]; return [parseInt(s.slice(1, 3), 16) || 0, parseInt(s.slice(3, 5), 16) || 0, parseInt(s.slice(5, 7), 16) || 0]; }
  const m = s.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/); return m ? [+m[1], +m[2], +m[3]] : [128, 128, 128];
}
function pt_hash(s) { s = String(s); let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function pt_rng(seed) { let a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function pt_mk(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
function pt_css(c, a) { return 'rgba(' + (pt_clamp(c[0], 0, 255) | 0) + ',' + (pt_clamp(c[1], 0, 255) | 0) + ',' + (pt_clamp(c[2], 0, 255) | 0) + ',' + (a === undefined ? 1 : a) + ')'; }
function pt_vn(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const h = (i, j) => { let n = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(s | 0, 1274126177); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return (h(xi, yi) * (1 - u) + h(xi + 1, yi) * u) * (1 - v) + (h(xi, yi + 1) * (1 - u) + h(xi + 1, yi + 1) * u) * v;
}
const PT_DEF = { skin: '#d9a98a', hair: '#2a1d18', hairStyle: 'short', outfit: 'uniform', outfitColor: '#3f4d5c', accent: '#c9892f', build: 'avg', glasses: false, age: 'adult', pose: 'stand', extra: 'none' };
function pt_norm(look) { return Object.assign({}, PT_DEF, look || {}); }
function pt_lookKey(l) { return [l.skin, l.hair, l.hairStyle, l.outfit, l.outfitColor, l.accent, l.build, l.glasses ? 1 : 0, l.age, l.extra].join('|'); }
function pt_hsl(c) {
  const r = c[0] / 255, g = c[1] / 255, b = c[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
  if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  return [h, s, l];
}
function pt_rgb(h, s, l) {
  h = (((h % 360) + 360) % 360) / 360; s = pt_clamp(s, 0, 1); l = pt_clamp(l, 0, 1); if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = (t) => { if (t < 0) t += 1; if (t > 1) t -= 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}
function pt_hueTo(h, tg, deg) { const d = ((tg - h + 540) % 360) - 180; return h + Math.sign(d) * Math.min(Math.abs(d), deg); }
/* hue-shifted ramp, dark -> light. bias = where the base colour sits (0..1). */
function pt_ramp(base, n, o) {
  o = o || {}; const hsl = pt_hsl(base), h0 = hsl[0], s0 = hsl[1], l0 = hsl[2];
  const bias = o.bias === undefined ? .58 : o.bias, dk = o.dk === undefined ? .68 : o.dk, lk = o.lk === undefined ? .5 : o.lk, hs = o.hs === undefined ? 1 : o.hs;
  const cool = o.cool === undefined ? 236 : o.cool, warm = o.warm === undefined ? 44 : o.warm, out = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? bias : i / (n - 1); let H, S, Lv;
    if (t <= bias) { const u = bias > 0 ? (bias - t) / bias : 0; Lv = l0 * (1 - dk * u); H = s0 < .06 ? cool : pt_hueTo(h0, cool, 26 * hs * u); S = Math.min(1, Math.max(s0, .14 * hs * u) * (1 + (o.sk === undefined ? .22 : o.sk) * u)); }
    else { const u = (t - bias) / (1 - bias); Lv = l0 + (1 - l0) * lk * u; H = s0 < .06 ? warm : pt_hueTo(h0, warm, 18 * hs * u); S = Math.max(s0 * (1 - .12 * u), .1 * hs * u); }
    out.push(pt_rgb(H, S, Lv));
  }
  return out;
}

/* ---------------------------------------------------------------- tiny pixel engine (shared with items) */
function px_new(N) { const n = N * N; return { N, M: new Int16Array(n).fill(-1), V: new Float32Array(n), Z: new Int16Array(n).fill(-32000), F: new Uint8Array(n), mats: [] }; }
function px_mat(P, base, o) { o = o || {}; const ramp = o.ramp || pt_ramp(pt_C(base), o.n || 6, o); P.mats.push({ ramp, n: ramp.length, dither: !!o.dither, bg: !!o.bg, glow: !!o.glow }); return P.mats.length - 1; }
function px_put(P, x, y, m, v, z, f) { x = Math.round(x); y = Math.round(y); const N = P.N; if (x < 0 || y < 0 || x >= N || y >= N) return; const i = y * N + x; if (z < P.Z[i]) return; P.M[i] = m; P.V[i] = v; P.Z[i] = z; P.F[i] = f || 0; }
function px_tone(P, x, y, m, t, z) { px_put(P, x, y, m, (t + .01) / Math.max(1, P.mats[m].n - 1), z, PX_DET); }
function px_adj(P, x, y, dv, m) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= P.N || y >= P.N) return; const i = y * P.N + x; if (m !== undefined && P.M[i] !== m) return; P.V[i] += dv; }
function px_fill(P, x0, y0, x1, y1, fn, m, z, f) {
  const N = P.N; x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0)); x1 = Math.min(N - 1, Math.ceil(x1)); y1 = Math.min(N - 1, Math.ceil(y1));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const v = fn(x, y); if (v >= 0) { const i = y * N + x; if (z >= P.Z[i]) { P.M[i] = m; P.V[i] = v; P.Z[i] = z; P.F[i] = f || 0; } } }
}
let _pxMask = null;
function px_mask(P, draw) {
  const N = P.N; if (!_pxMask || _pxMask.c.width !== N) { const c = pt_mk(N, N); _pxMask = { c, g: c.getContext('2d', { willReadFrequently: true }) }; }
  const g = _pxMask.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, N, N); g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); draw(g);
  const d = g.getImageData(0, 0, N, N).data, out = new Uint8Array(N * N); for (let i = 0; i < N * N; i++) out[i] = d[i * 4 + 3] >= 120 ? 1 : 0; return out;
}
function px_shape(P, draw, m, shade, z, f) {
  const N = P.N, mk_ = px_mask(P, draw), fn = typeof shade === 'function';
  for (let i = 0; i < N * N; i++) if (mk_[i] && z >= P.Z[i]) { const x = i % N, y = (i / N) | 0; const v = fn ? shade(x, y) : shade; if (v < 0) continue; P.M[i] = m; P.V[i] = v; P.Z[i] = z; P.F[i] = f || 0; }
  return mk_;
}
/* render: quantize -> edge pass -> colours. mode 'portrait' (selout + warm rim on the right) | 'icon' (outer ink outline). */
function px_render(P, o) {
  o = o || {}; const N = P.N, n = N * N, M = P.M, Z = P.Z, F = P.F, mats = P.mats, T = new Int16Array(n), E = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const m = M[i]; if (m < 0) { T[i] = -1; continue; }
    const mt = mats[m], k = mt.n - 1, v = pt_clamp(P.V[i], 0, 1) * k; let t = Math.floor(v); const fr = v - t;
    if (mt.dither && !(F[i] & PX_DET)) { const x = i % N, y = (i / N) | 0, bd = mt.bg ? .1 : .16; if (fr > .5 - bd && fr < .5 + bd) t += (x + y) & 1; else if (fr >= .5 + bd) t++; } else if (fr >= .5) t++;
    T[i] = pt_clamp(t, 0, k);
  }
  const empty = (j) => M[j] < 0 || mats[M[j]].bg;
  const T2 = Int16Array.from(T), portrait = o.mode !== 'icon', rimX = o.rimX === undefined ? N * .55 : o.rimX;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x, m = M[i]; if (m < 0 || mats[m].bg || (F[i] & PX_DET) || mats[m].glow) continue;
    const k = mats[m].n - 1, eR = x < N - 1 && empty(i + 1), eL = x > 0 && empty(i - 1), eU = y > 0 && empty(i - N), eD = y < N - 1 && empty(i + N);
    if (portrait) {
      if (eR || (eU && x >= rimX && !eL)) { E[i] = 2; if (x > 0 && M[i - 1] === m) T2[i - 1] = Math.min(k, T[i - 1] + 1); continue; }
      if (eL || eD) { T2[i] = Math.max(0, T[i] - 2); E[i] = 1; continue; }
      if (eU) { T2[i] = Math.min(k, T[i] + 1); continue; }
    } else {
      if (eU || eL) { T2[i] = Math.min(k, T[i] + 1); continue; }
      if (eD || eR) { T2[i] = Math.max(0, T[i] - 1); continue; }
    }
    // internal edge: upper layer next to a lower, different material -> darker selout
    let ie = false;
    for (let q = 0; q < 4 && !ie; q++) {
      const xx = x + (q === 0 ? 1 : q === 1 ? -1 : 0), yy = y + (q === 2 ? 1 : q === 3 ? -1 : 0); if (xx < 0 || yy < 0 || xx >= N || yy >= N) continue;
      const j = yy * N + xx; if (M[j] >= 0 && (M[j] !== m || Z[i] - Z[j] >= 3) && !mats[M[j]].bg && Z[j] < Z[i] - (o.zgap || 0) && !(F[j] & PX_DET)) ie = true;
    }
    if (ie) T2[i] = Math.max(0, T[i] - (o.inner || 1));
  }
  const cv = pt_mk(N, N), g = cv.getContext('2d'), id = g.createImageData(N, N), d = id.data;
  const ink = o.ink || [20, 14, 26], rimC = o.rimC || [255, 172, 96], tint = o.tint ? pt_C(o.tint) : null;
  for (let i = 0; i < n; i++) {
    const m = M[i]; let c;
    if (m < 0) {
      if (portrait) continue;
      // icon outer outline: darkest tone of the strongest neighbour
      const x = i % N, y = (i / N) | 0; let nb = -1;
      if (x < N - 1 && M[i + 1] >= 0) nb = i + 1; else if (x > 0 && M[i - 1] >= 0) nb = i - 1; else if (y < N - 1 && M[i + N] >= 0) nb = i + N; else if (y > 0 && M[i - N] >= 0) nb = i - N;
      if (nb < 0 || mats[M[nb]].bg) continue; c = pt_mix(mats[M[nb]].ramp[0], ink, .55);
    } else {
      const mt = mats[m]; c = mt.ramp[T2[i]];
      if (E[i] === 2) c = pt_mix(mt.ramp[mt.n - 1], rimC, .5);
      else if (E[i] === 1) c = pt_mix(mt.ramp[Math.max(0, T2[i])], ink, .3);
    }
    if (tint) c = pt_mix(c, tint, .1);
    d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = 255;
  }
  g.putImageData(id, 0, 0); return cv;
}

/* ---------------------------------------------------------------- per-character signatures (keyed on skin|hair) */
const PT_SIG = {
  player: { id: 'player', plaster: 1, badge: 1, iris: [74, 96, 118], gl: 'round', glC: [70, 56, 44] },
  '#c98f6e|#5a5a58': { id: 'vasha', fem: 1, scar: 'brow', whistle: 1, iris: [92, 116, 88], brows: 2, bg: [44, 62, 66] },
  '#e0b196|#8c8379': { id: 'bronka', fem: 1, kerchief: [170, 54, 46], rosy: 1, dress: [78, 88, 118], iris: [96, 72, 52], bg: [60, 58, 78] },
  '#b88a6a|#1c1a22': { id: 'ilsabet', fem: 1, gl: 'round', glC: [74, 46, 34], phones: 1, chair: 1, iris: [74, 52, 40], bg: [40, 68, 74] },
  '#e6c3a8|#d8d2c8': { id: 'fenwick', gl: 'wire', glC: [196, 170, 96], bow: 1, iris: [104, 118, 146], bg: [64, 54, 84] },
  '#e9c9b1|#a2723a': { id: 'lemmy', freckles: 1, monitor: 1, iris: [96, 124, 80], bg: [46, 64, 80] },
  '#cdb5a0|#403a34': { id: 'ostrov', stache: 'neat', ropeMark: 1, pale: 1, pin: 1, iris: [74, 74, 76], bg: [50, 54, 62] },
  '#b78d70|#6e6a66': { id: 'osk', stache: 'walrus', stubble: .5, keys: 1, brows: 3, iris: [92, 82, 62], bg: [44, 62, 58] },
  '#e2b89b|#1a1414': { id: 'rhea', fem: 1, lips: [156, 40, 48], star: 'collar', iris: [62, 50, 42], bg: [48, 52, 76] },
  '#e3c4ae|#8d8d90': { id: 'marr', fem: 1, gl: 'cat', glC: [44, 30, 46], pearls: 1, brooch: 1, lips: [156, 86, 88], iris: [100, 112, 90], bg: [46, 66, 62] },
  '#c9a187|#bdb6aa': { id: 'anka', fem: 1, gl: 'round', glC: [120, 92, 50], goggles: 1, stains: 1, iris: [84, 72, 52], bg: [58, 60, 70] },
  '#e6c9b4|#9d9ba0': { id: 'matron', fem: 1, gl: 'half', glC: [150, 120, 60], chain: 1, mole: 1, iris: [84, 94, 116], bg: [62, 56, 74] },
  '#c79b7c|#3a2a1c': { id: 'dov', earCig: 1, stubble: .22, smirk: 1, chainN: 1, iris: [76, 54, 34], bg: [50, 60, 72] },
  '#e3c1a5|#6a3a22': { id: 'wren', fem: 1, freckles: 1, satchel: 1, iris: [66, 112, 92], small: 1, bg: [44, 70, 72] },
  '#dcb9a0|#2a2a30': { id: 'ysolde', fem: 1, gl: 'square', glC: [92, 40, 40], pencil: 1, brooch: 1, lips: [150, 84, 86], iris: [64, 66, 86], bg: [54, 58, 82] },
  '#d4ae94|#e0ddd4': { id: 'quill', gl: 'round', glC: [184, 150, 84], goatee: 1, bow: 1, spots: 1, iris: [104, 104, 112], bg: [60, 62, 70] },
  '#e8c8b0|#4a3a2a': { id: 'corvin', gl: 'square', glC: [40, 34, 34], star: 'chest', part: 1, iris: [72, 92, 124], bg: [44, 60, 78] },
  '#b98a6a|#1c1418': { id: 'nadia', fem: 1, ccap: 1, hoops: 1, tuck: 1, lips: [176, 40, 46], scarf: [206, 156, 62], iris: [64, 44, 32], bg: [42, 58, 72] },
  '#e0c4ae|#8a8a8c': { id: 'voss', bigCollar: 1, insignia: 1, hollow: 1, narrow: 1, iris: [150, 172, 184], bg: [40, 50, 64] },
  '#c4a088|#b8b4aa': { id: 'gregor', gl: 'round', glC: [60, 50, 44], beard: 1, iris: [84, 72, 60], bg: [52, 64, 60] },
  '#d4b098|#4a4a50': { id: 'tomas', gl: 'square', glC: [150, 154, 162], headset: 1, stubble: .2, pens: 1, iris: [82, 104, 124], bg: [38, 62, 74] },
  '#d0a890|#2a1a1a': { id: 'brune', pcap: 1, scar: 'cheek', stubble: .55, nose: 'broken', iris: [62, 52, 42], brows: 3, bg: [56, 52, 62] },
  '#b89c84|#cfcac0': { id: 'hob', cords: 1, stubble: .4, earPlugs: 1, hollowEyes: 1, iris: [112, 112, 102], bg: [48, 56, 66] }
};
function pt_sig(L) {
  const acc = String(L.accent).toLowerCase();
  if (L.outfit === 'uniform' && L.age === 'teen' && L.glasses && acc === '#c9892f' && String(L.outfitColor).toLowerCase() === '#3f4d5c') return PT_SIG.player;
  return PT_SIG[(String(L.skin) + '|' + String(L.hair)).toLowerCase()] || null;
}

/* ---------------------------------------------------------------- portrait builder */
function buildPortraitBuffer(look, opts) {
  opts = opts || {};
  const L = pt_norm(look), mood = opts.mood || 'neutral';
  const key = [pt_lookKey(L), mood, opts.tint || '', opts.bg || ''].join('#');
  const hit = _pbuf.get(key); if (hit) return hit;
  const S = pt_sig(L) || {}, N = PT_N, P = px_new(N), r = pt_rng(pt_hash(pt_lookKey(L)));
  const build = L.build === 'heavy' ? 1 : L.build === 'slim' ? -1 : 0, old = L.age === 'old', teen = L.age === 'teen', fem = !!S.fem;
  const hs = L.hairStyle || 'short', o = L.outfit, angry = mood === 'angry', sad = mood === 'sad', smile = mood === 'smile', shock = mood === 'shock';
  const Lx = -.5, Ly = -.56, Lz = .66;
  const bump = (x, y, cx, cy, rx, ry) => { const a = (x - cx) / rx, b = (y - cy) / ry, q = a * a + b * b; return q > 5 ? 0 : Math.exp(-q); };
  // ---- geometry
  const hcx = 48, hcy = 38 + (teen ? 1 : 0) + (S.small ? 1 : 0);
  const hrx = 18.3 + build * (build > 0 ? 2 : 1.1) - (fem ? .7 : 0) - (teen ? .4 : 0) - (S.small ? .6 : 0);
  const jawY = hcy + 4, chinY = hcy + 25 + (build > 0 ? 1 : 0) - (teen ? 1 : 0), craR = 28;
  const chinW = (fem ? 5.2 : 7) + build * 2 + (old && build > 0 ? 1.6 : 0) - (S.hollow ? .6 : 0), jawP = fem || teen ? 2.0 : 2.5 + build * .3;
  const hw = (y) => { if (y < jawY) { const t = Math.abs(y - jawY) / craR; return t >= 1 ? 0 : hrx * Math.pow(1 - Math.pow(t, 2.3), 1 / 2.3); } const u = (y - jawY) / (chinY - jawY); if (u >= 1) return 0; return (hrx - (hrx - chinW) * Math.pow(u, jawP)) * Math.sqrt(1 - Math.pow(u, 5)); };
  const eyeY = hcy + 2, ex = 7.2 + build * .5, noseY = hcy + 12, mouthY = hcy + 18, mw = (fem ? 3 : 4) + (build > 0 ? 1 : 0);
  const nw = 10 + build * 2.4 - (fem ? 1.6 : 0) - (teen ? .5 : 0), sw = 37 + build * 4 - (fem ? 2 : 0) - (teen ? 1.5 : 0) - (S.small ? 2 : 0), nb = 75 - (build > 0 ? 1 : 0) + (S.small ? 1 : 0);
  // ---- palette
  let skinB = pt_C(L.skin); if (S.pale) skinB = pt_mix(skinB, [176, 184, 176], .3);
  const hairB = pt_C(L.hair), clothB = pt_C(L.outfitColor), accB = pt_C(L.accent);
  const bgB = opts.bg ? pt_C(opts.bg) : (S.bg || [[46, 64, 80], [42, 68, 72], [56, 58, 82], [50, 70, 68]][pt_hash(pt_lookKey(L)) % 4]);
  const mBg = px_mat(P, bgB, { n: 6, dither: true, bg: true, hs: .6, bias: .45, dk: .62, lk: .45 });
  const mBgW = px_mat(P, pt_mix(bgB, [150, 100, 72], .38), { n: 4, dither: true, bg: true, bias: .5, lk: .4 });
  const mSmoke = px_mat(P, [176, 184, 192], { n: 3, bg: true, bias: .5, lk: .4 });
  const mSkin = px_mat(P, skinB, { n: 7, cool: 345, warm: 40, bias: .6, dk: .6, lk: .55, hs: .7, sk: -.25 });
  const mHair = px_mat(P, hairB, { n: 6, bias: .55, dk: .66, lk: pt_hsl(hairB)[2] > .6 ? .55 : .45 });
  const mCloth = px_mat(P, clothB, { n: 6, dither: true, bias: .55, dk: .66, lk: .45 });
  const shirtB = o === 'overalls' ? pt_mix(accB, [150, 142, 132], .6) : o === 'apron' ? (S.dress || [80, 88, 116]) : o === 'shirtsleeves' ? clothB : o === 'labcoat' ? [92, 104, 120] : o === 'tracksuit' ? [200, 196, 186] : [222, 216, 200];
  const mShirt = px_mat(P, shirtB, { n: 5, bias: .55, dither: o === 'apron' || o === 'overalls' });
  const mAcc = px_mat(P, accB, { n: 5, bias: .55 });
  const mGold = px_mat(P, [204, 158, 66], { n: 5, bias: .5, lk: .75 });
  const mSilver = px_mat(P, [146, 152, 162], { n: 5, bias: .5, lk: .75 });
  const mEye = px_mat(P, [224, 220, 212], { ramp: [pt_mix(skinB, [120, 110, 130], .5), [196, 192, 192], [232, 228, 220]] });
  const mIris = px_mat(P, S.iris || [86, 72, 60], { n: 4, bias: .6 });
  const mInk = px_mat(P, [28, 22, 30], { ramp: [[18, 13, 22], [36, 26, 34], [66, 50, 56], [250, 248, 240]] });
  const mLip = px_mat(P, S.lips || pt_mix(skinB, [178, 84, 84], fem ? .4 : .26), { n: 4, cool: 330, bias: .6 });
  const mWhite = px_mat(P, [236, 232, 222], { ramp: [[150, 150, 160], [204, 200, 196], [240, 236, 226]] });
  const mEmber = px_mat(P, [255, 140, 60], { ramp: [[190, 64, 30], [255, 138, 48], [255, 222, 150]], glow: true });
  const mStub = px_mat(P, pt_mix(pt_mix(skinB, hairB, .62), [60, 60, 90], .2), { n: 5, bias: .62 });
  const glB = S.glC || [44, 36, 34];
  const mFrame = px_mat(P, glB, { n: 4, bias: .45, lk: .7 });
  const mDark = px_mat(P, [40, 38, 44], { n: 4, bias: .4, lk: .6 });
  // ---- backdrop: painted strokes, glow behind head, warm haze on the right (rim source)
  if (!_ptBg) { _ptBg = { V: new Float32Array(N * N), W: new Uint8Array(N * N) };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x * .8 + y * .6, w = -x * .6 + y * .8;
    const glow = pt_clamp(1 - Math.hypot((x - 34) * .85, y - 30) / 62, 0, 1);
    let v = .16 + glow * .55 + (pt_vn(u * .07, w * .3, 3) - .5) * .32 + (pt_vn(x * .18, y * .05, 9) - .5) * .12;
    const wv = pt_clamp((x - 70) / 24, 0, 1) * pt_clamp(1 - Math.abs(y - 40) / 46, 0, 1) + (pt_vn(u * .1, w * .2, 5) - .5) * .3;
    const i = y * N + x;
    if (wv > .62 + (PT_B4[y & 3][x & 3] / 15) * .3) { _ptBg.W[i] = 1; _ptBg.V[i] = .25 + wv * .55; } else { _ptBg.V[i] = v; }
  }
  }
  for (let i = 0; i < N * N; i++) { P.M[i] = _ptBg.W[i] ? mBgW : mBg; P.V[i] = _ptBg.V[i]; P.Z[i] = 0; }
  // ---- wheelchair handles (behind body)
  if (S.chair) for (const sd of [-1, 1]) { const x0 = hcx + sd * (sw - 4); px_fill(P, x0 - 1, 60, x0 + 1, 84, (x, y) => (y < 66 ? .25 + (x - x0 + 1) * .12 : .45 + (sd * (x0 - x)) * .15), mDark, 3); }
  // ---- back hair (long) / bun
  if (hs === 'long') {
    const bw2 = hrx + 5.5;
    px_fill(P, hcx - bw2 - 2, hcy - 10, hcx + bw2 + 2, 92, (x, y) => { const dx = Math.abs(x + .5 - hcx), lim = bw2 - Math.max(0, y - 70) * .25 + Math.sin(y * .6 + x) * .6; if (dx > lim) return -1; if (y > 86 + Math.sin(x * 1.3) * 3) return -1; return .2 + (hcx - x) * .006 + Math.sin(x * 1.1 + y * .1) * .06; }, mHair, 2);
  }
  // ---- body
  const bodyV = (x, y) => {
    const nx = (x + .5 - hcx) / (sw + 3); let v = .54 - nx * .34 - Math.max(0, y - 80) * .006;
    if (y < nb + 10) v += (nb + 10 - y) * .016 * (1 - Math.abs(nx) * .4);
    v -= .2 * bump(x, y, hcx + 2, nb + 3, nw * 1.6, 4.5);
    v += .045 * Math.sin(x * .55 + y * .22 + pt_vn(x * .2, y * .2, 4) * 3) * (y > 82 ? 1 : 0);
    return v;
  };
  const baseMat = (o === 'overalls' || o === 'apron') ? mShirt : mCloth;
  px_shape(P, (g) => {
    g.moveTo(hcx - nw - 1, nb - 3); g.bezierCurveTo(hcx - nw - 3, nb + 3, hcx - sw + 10, nb + 3, hcx - sw + 3, nb + 7);
    g.bezierCurveTo(hcx - sw - 1, nb + 9, hcx - sw - 2, nb + 14, hcx - sw - 2, 97); g.lineTo(hcx + sw + 2, 97);
    g.bezierCurveTo(hcx + sw + 2, nb + 14, hcx + sw + 1, nb + 9, hcx + sw - 3, nb + 7); g.bezierCurveTo(hcx + sw - 10, nb + 3, hcx + nw + 3, nb + 3, hcx + nw + 1, nb - 3);
    g.closePath(); g.fill();
  }, baseMat, (o === 'cardigan') ? (x, y) => bodyV(x, y) + ((x & 1) ? .05 : -.05) : bodyV, 4);
  // ---- neck
  px_fill(P, hcx - nw, jawY + 2, hcx + nw, nb + 1, (x, y) => { const nx = (x + .5 - hcx) / nw; if (Math.abs(nx) > 1) return -1; return .5 - nx * .2 - .3 * pt_clamp(1 - (y - chinY) / 8, 0, 1) - (y > nb + 3 ? .08 : 0); }, mSkin, 5);
  if (!fem && !teen && !S.beard) px_adj(P, hcx - 1, chinY + 7, .12, mSkin);
  if ((old || S.hollow) && !fem) for (let y = chinY + 4; y < nb + 2; y++) { px_adj(P, hcx - 4 + ((y - chinY) >> 2), y, -.09, mSkin); px_adj(P, hcx + 4 - ((y - chinY) >> 2), y, -.12, mSkin); }
  if (S.ropeMark) for (let x = hcx - nw; x <= hcx + nw; x++) { px_tone(P, x, chinY + 6 + ((x + 1) % 3 === 0 ? 1 : 0), mLip, 0, 6); px_tone(P, x, chinY + 7 + ((x + 1) % 3 === 0 ? 1 : 0), mLip, 1, 6); }
  // ---- clothing
  const Zc = 9, Zf = 10;
  const poly = (pts, m, sh, z, f) => px_shape(P, (g) => { g.moveTo(pts[0][0], pts[0][1]); for (let k = 1; k < pts.length; k++) g.lineTo(pts[k][0], pts[k][1]); g.closePath(); g.fill(); }, m, sh, z, f);
  const line = (pts, wd, m, sh, z, f) => px_shape(P, (g) => { g.lineWidth = wd; g.moveTo(pts[0][0], pts[0][1]); for (let k = 1; k < pts.length; k++) g.lineTo(pts[k][0], pts[k][1]); g.stroke(); }, m, sh, z, f);
  const ell = (cx, cy, rx, ry, m, sh, z, f) => px_fill(P, cx - rx - 1, cy - ry - 1, cx + rx + 1, cy + ry + 1, (x, y) => { const a = (x + .5 - cx) / rx, b = (y + .5 - cy) / ry, q = a * a + b * b; if (q > 1) return -1; return typeof sh === 'function' ? sh(x, y, a, b) : sh; }, m, z, f);
  const sph = (cx, cy, rx, ry, base, k) => (x, y) => { const a = (x + .5 - cx) / rx, b = (y + .5 - cy) / ry; const nz = Math.sqrt(Math.max(0, 1 - a * a - b * b)); return base + (a * Lx + b * Ly + nz * Lz - .4) * (k || .6); };
  const button = (x, y, m) => { px_tone(P, x, y, m || mGold, 3, Zf + 1); px_tone(P, x + 1, y, m || mGold, 2, Zf + 1); px_tone(P, x, y + 1, m || mGold, 1, Zf + 1); px_tone(P, x + 1, y + 1, m || mGold, 0, Zf + 1); };
  const shirtV = (x, y) => .62 - (x - hcx) * .02 - (y - nb) * .008;
  const lapels = (wTop, depth, m, light) => {
    for (const sd of [-1, 1]) poly([[hcx + sd * (nw - 1), nb - 2], [hcx + sd * (nw + wTop), nb], [hcx + sd * (nw + wTop + 3), nb + 9], [hcx + sd * (nw + 1), nb + 6], [hcx + sd * 2, depth]], m, (x, y) => (sd < 0 ? .7 : .38) + (light || 0) - (y - nb) * .006, Zc);
  };
  if (o === 'suit' || o === 'coat' || o === 'labcoat') {
    const depth = o === 'coat' ? 90 : 94;
    poly([[hcx - nw + 1, nb - 3], [hcx + nw - 1, nb - 3], [hcx + 3, depth], [hcx - 3, depth]], mShirt, shirtV, Zc - 1);
    if (S.bow) { poly([[hcx - 5, nb - 1], [hcx, nb + 1], [hcx + 5, nb - 1], [hcx + 5, nb + 4], [hcx, nb + 2], [hcx - 5, nb + 4]], mAcc, (x, y) => .55 - (x - hcx) * .05 + (Math.abs(x - hcx) < 1 ? .2 : 0), Zc + 1); }
    else { poly([[hcx - 1.6, nb - 2], [hcx + 1.6, nb - 2], [hcx + 1, nb + 1]], mAcc, .7, Zc); poly([[hcx - 1, nb + 1], [hcx + 1, nb + 1], [hcx + 2.6, depth - 3], [hcx, depth], [hcx - 2.6, depth - 3]], o === 'coat' ? mDark : mAcc, (x, y) => .5 - (x - hcx) * .08 + ((y >> 1) & 1) * .06, Zc); }
    // shirt collar points
    for (const sd of [-1, 1]) poly([[hcx + sd * (nw - 1), nb - 4], [hcx + sd * 1.5, nb], [hcx + sd * (nw - 3), nb + 3]], mShirt, sd < 0 ? .85 : .5, Zc + 1);
    lapels(o === 'coat' ? 6 : 4, depth, o === 'labcoat' ? mCloth : mCloth, o === 'labcoat' ? .05 : 0);
    if (o === 'labcoat') { for (let y = depth; y < 96; y++) px_tone(P, hcx, y, mCloth, 1, Zc); poly([[hcx - 17, 84], [hcx - 9, 84], [hcx - 9, 92], [hcx - 17, 92]], mCloth, .4, Zc); }
    if (S.pens) { px_tone(P, hcx - 15, 82, mAcc, 3, Zf); px_tone(P, hcx - 15, 83, mAcc, 2, Zf); px_tone(P, hcx - 13, 82, mSilver, 4, Zf); px_tone(P, hcx - 13, 83, mSilver, 2, Zf); px_tone(P, hcx - 11, 83, mInk, 1, Zf); px_tone(P, hcx - 11, 82, mInk, 2, Zf); }
    if (S.stains) for (const [sx, sy] of [[hcx + 14, 86], [hcx + 9, 92], [hcx - 18, 90], [hcx + 19, 80]]) { px_tone(P, sx, sy, mAcc, 2, Zf); px_tone(P, sx + 1, sy, mAcc, 3, Zf); px_tone(P, sx, sy + 1, mAcc, 1, Zf); }
    if (o === 'suit') for (let y = 92; y < 96; y += 3) button(hcx - 1, y, mDark);
  }
  if (S.bigCollar) {
    for (const sd of [-1, 1]) {
      poly([[hcx + sd * (nw - 1), nb + 2], [hcx + sd * (nw + 1), jawY + 9], [hcx + sd * (nw + 6), jawY + 5], [hcx + sd * (nw + 13), nb - 3], [hcx + sd * (sw - 6), nb + 6], [hcx + sd * (nw + 4), nb + 6]], mCloth,
        (x, y) => (sd < 0 ? .62 : .3) + (y - jawY) * -.004 + (Math.abs(x - hcx) < nw + 3 ? -.12 : 0), 6);
    }
  }
  if (o === 'uniform') {
    // stand collar + tabs
    px_fill(P, hcx - nw - 1, nb - 5, hcx + nw + 1, nb + 1, (x, y) => { const dx = x + .5 - hcx; if (Math.abs(dx) > nw + 1 - (y < nb - 3 ? 0 : 0)) return -1; if (y < nb - 4 + Math.abs(dx) * .12) return -1; return .62 - dx * .03 + (y === nb - 4 ? .1 : 0); }, mCloth, Zc + 1);
    for (const sd of [-1, 1]) poly([[hcx + sd * (nw - 4), nb - 3], [hcx + sd * (nw + .5), nb - 4], [hcx + sd * (nw + 1), nb], [hcx + sd * (nw - 3.5), nb]], mAcc, sd < 0 ? .72 : .45, Zc + 2);
    for (let y = nb + 2; y < 96; y++) px_tone(P, hcx, y, mCloth, 1, Zc);
    for (let y = nb + 6; y < 96; y += 6) button(hcx + 1, y);
    for (const sd of [-1, 1]) { poly([[hcx + sd * (nw + 4), nb + 1], [hcx + sd * (sw - 4), nb + 5], [hcx + sd * (sw - 3), nb + 8], [hcx + sd * (nw + 4), nb + 4]], mCloth, sd < 0 ? .75 : .36, Zc); button(hcx + sd * (sw - 8) - (sd > 0 ? 1 : 0), nb + 5); }
    for (const sd of [-1, 1]) for (let x = 0; x < 9; x++) px_tone(P, hcx + sd * (7 + x), 85, mCloth, sd < 0 ? 2 : 1, Zc);
    if (L.extra === 'armband') { line([[hcx - sw + 2, nb + 10], [hcx - sw + 10, nb + 8]], 5, mAcc, (x, y) => .7 - (y - nb - 9) * .05, Zf); px_tone(P, hcx - sw + 6, nb + 9, mGold, 4, Zf + 1); px_tone(P, hcx - sw + 5, nb + 9, mGold, 2, Zf + 1); px_tone(P, hcx - sw + 6, nb + 10, mGold, 1, Zf + 1); px_tone(P, hcx - sw + 6, nb + 8, mGold, 3, Zf + 1); }
    if (S.badge) { poly([[hcx - 14, 82], [hcx - 9, 82], [hcx - 9, 87], [hcx - 11.5, 89], [hcx - 14, 87]], mAcc, (x, y) => .75 - (y - 82) * .07, Zf); px_tone(P, hcx - 12, 84, mWhite, 2, Zf + 1); }
    if (S.monitor) { poly([[hcx - 15, 82], [hcx - 8, 82], [hcx - 8, 86], [hcx - 15, 86]], mGold, (x, y) => .8 - (y - 82) * .12 - (x - hcx + 15) * .02, Zf); for (let x = hcx - 14; x < hcx - 8; x++) px_tone(P, x, 84, mAcc, 2, Zf + 1); }
  }
  if (S.star) { const sx = S.star === 'collar' ? hcx - 4 : hcx - 12, sy = S.star === 'collar' ? nb - 2 : 84, m = S.star === 'collar' ? mGold : mAcc; px_tone(P, sx, sy - 1, m, 3, Zf + 2); px_tone(P, sx - 1, sy, m, 3, Zf + 2); px_tone(P, sx, sy, m, 4, Zf + 2); px_tone(P, sx + 1, sy, m, 2, Zf + 2); px_tone(P, sx - 1, sy + 1, m, 2, Zf + 2); px_tone(P, sx + 1, sy + 1, m, 1, Zf + 2); }
  if (o === 'cardigan') {
    poly([[hcx - nw, nb - 3], [hcx + nw, nb - 3], [hcx + 1, 92], [hcx - 1, 92]], mShirt, shirtV, Zc - 1);
    if (fem) for (const sd of [-1, 1]) poly([[hcx + sd * (nw + 1), nb - 4], [hcx + sd * .5, nb - 1], [hcx + sd * 1.5, nb + 3], [hcx + sd * (nw + 2), nb]], mShirt, sd < 0 ? .9 : .55, Zc + 1);
    for (const sd of [-1, 1]) line([[hcx + sd * (nw + 1), nb - 1], [hcx + sd * 1.5, 93], [hcx + sd * 1.5, 97]], 2, mCloth, sd < 0 ? .72 : .32, Zc);
    for (let y = nb + 10; y < 96; y += 6) button(hcx + 2, y, mAcc);
  }
  if (o === 'tracksuit') {
    px_fill(P, hcx - nw - 2, nb - 6, hcx + nw + 2, nb + 1, (x, y) => { const dx = x + .5 - hcx; if (Math.abs(dx) > nw + 2) return -1; return .6 - dx * .035 + (y === nb - 6 ? .12 : 0); }, mCloth, Zc + 1);
    for (let y = nb - 6; y < 96; y++) px_tone(P, hcx, y, mSilver, y < nb - 3 ? 3 : 1, Zc + 2);
    px_tone(P, hcx + 1, nb + 4, mSilver, 4, Zc + 3); px_tone(P, hcx + 1, nb + 5, mSilver, 2, Zc + 3);
    for (const sd of [-1, 1]) for (const off of [4, 7]) line([[hcx + sd * (nw + 4), nb + off - 3], [hcx + sd * (sw - 4), nb + 4 + off], [hcx + sd * (sw + 1), nb + 13 + off]], 1.4, mAcc, sd < 0 ? .75 : .45, Zc);
  }
  if (o === 'shirtsleeves') {
    poly([[hcx - nw + 1, nb - 4], [hcx + nw - 1, nb - 4], [hcx + 1, nb + 9], [hcx - 1, nb + 9]], mSkin, (x, y) => .42 - (x - hcx) * .03 - (y - nb) * .01, Zc);
    for (const sd of [-1, 1]) poly([[hcx + sd * (nw + 1), nb - 6], [hcx + sd * 1, nb + 9], [hcx + sd * (nw + 6), nb + 3]], mCloth, sd < 0 ? .78 : .4, Zc + 1);
    for (const sd of [-1, 1]) line([[hcx + sd * 14, nb + 4], [hcx + sd * 13, 97]], 2.2, mAcc, sd < 0 ? .6 : .35, Zc);
    for (let y = nb + 12; y < 96; y += 6) button(hcx, y, mWhite);
  }
  if (o === 'overalls') {
    poly([[hcx - nw - 1, nb - 4], [hcx - 1, nb + 2], [hcx - nw + 2, nb + 3]], mShirt, .8, Zc + 1); poly([[hcx + nw + 1, nb - 4], [hcx + 1, nb + 2], [hcx + nw - 2, nb + 3]], mShirt, .45, Zc + 1);
    poly([[hcx - 13, 83], [hcx + 13, 83], [hcx + 14, 97], [hcx - 14, 97]], mCloth, (x, y) => .55 - (x - hcx) * .016 + (y === 83 ? .12 : 0), Zc);
    poly([[hcx - 6, 87], [hcx + 5, 87], [hcx + 5, 93], [hcx - 6, 93]], mCloth, .34, Zc + 1);
    for (const sd of [-1, 1]) { line([[hcx + sd * 11, 84], [hcx + sd * 15, nb + 1], [hcx + sd * 17, nb - 1]], 3.4, mCloth, (x, y) => (sd < 0 ? .62 : .34) + (nb + 2 - y) * -.01, Zc + 1); button(hcx + sd * 11 - (sd > 0 ? 1 : 0), 83, mSilver); }
  }
  if (o === 'apron') {
    px_fill(P, hcx - nw - 3, nb - 4, hcx + nw + 3, nb + 4, (x, y) => { const dx = x + .5 - hcx; if (y < nb - 3 + dx * dx * .03 || y > nb - 1 + dx * dx * .045) return -1; return -1; }, mShirt, Zc);
    poly([[hcx - 12, 80], [hcx + 12, 80], [hcx + 14, 97], [hcx - 14, 97]], mCloth, (x, y) => .62 - (x - hcx) * .016 + (y === 80 ? .15 : 0) + Math.sin(x * .9) * .04, Zc);
    for (const sd of [-1, 1]) line([[hcx + sd * 11, 81], [hcx + sd * (nw + 4), nb], [hcx + sd * (nw + 3), nb - 4]], 2.6, mCloth, sd < 0 ? .7 : .4, Zc + 1);
    poly([[hcx - 7, 88], [hcx + 6, 88], [hcx + 6, 94], [hcx - 7, 94]], mCloth, .44, Zc + 1);
  }
  if (o === 'coat' && !S.bigCollar) for (let y = 90; y < 96; y += 4) { button(hcx - 7, y, mGold); button(hcx + 6, y, mGold); }
  if (S.bigCollar) { poly([[hcx - 1, 90], [hcx + 1, 90], [hcx + 1, 97], [hcx - 1, 97]], mCloth, .2, Zc); for (let y = 90; y < 97; y += 5) { button(hcx - 7, y, mDark); button(hcx + 6, y, mDark); } }
  if (S.insignia) { ell(hcx - 13, 84, 2.8, 1.8, mGold, (x, y, a, b) => .7 - b * .4 - a * .2, Zf + 1); px_tone(P, hcx - 13, 84, mInk, 0, Zf + 2); px_tone(P, hcx - 14, 83, mGold, 4, Zf + 2); for (let x = hcx - 15; x <= hcx - 11; x++) px_tone(P, x, 83, mGold, 1, Zf + 2); }
  if (S.brooch) { ell(hcx - 12, 83, 1.9, 1.9, mGold, sph(hcx - 12, 83, 1.9, 1.9, .55), Zf + 1); px_tone(P, hcx - 12, 83, mAcc, 3, Zf + 2); }
  if (S.pearls) for (let dx = -nw - 2; dx <= nw + 2; dx += 2) { const y = nb - 3 + dx * dx * .03; px_tone(P, hcx + dx, y, mWhite, 2, Zf + 2); px_tone(P, hcx + dx, y + 1, mWhite, 0, Zf + 2); px_tone(P, hcx + dx + 1, y, mWhite, 1, Zf + 2); }
  if (S.scarf) {
    const mScarf = px_mat(P, S.scarf, { n: 5, bias: .55, dither: true });
    px_fill(P, hcx - nw - 4, nb - 8, hcx + nw + 4, nb + 2, (x, y) => { const dx = x + .5 - hcx; if (Math.abs(dx) > nw + 4 - (y > nb ? 2 : 0)) return -1; return .5 - dx * .03 + Math.sin(dx * .9 + y * .7) * .12; }, mScarf, Zf);
    poly([[hcx - 4, nb], [hcx + 2, nb], [hcx + 4, 92], [hcx - 1, 94]], mScarf, (x, y) => .55 - (x - hcx) * .04 + ((y >> 1) & 1) * .08, Zf);
  }
  if (S.whistle) { line([[hcx - nw + 1, nb - 2], [hcx + 2, 87], [hcx + nw - 1, nb - 2]], 1, mAcc, .7, Zf); poly([[hcx + 1, 87], [hcx + 6, 87], [hcx + 6, 90], [hcx + 1, 90]], mSilver, (x, y) => .85 - (y - 87) * .2 - (x - hcx) * .03, Zf + 1); px_tone(P, hcx + 4, 88, mInk, 0, Zf + 2); }
  if (S.satchel) { line([[hcx - sw + 4, nb + 4], [hcx + 18, 97]], 3.4, mAcc, (x, y) => .58 + ((x + y) % 5 === 0 ? -.15 : 0), Zf); poly([[hcx + 2, 87], [hcx + 6, 87], [hcx + 7, 91], [hcx + 3, 91]], mGold, .65, Zf + 1); px_tone(P, hcx + 4, 89, mGold, 0, Zf + 2); }
  if (S.phones) {
    line([[hcx - nw - 3, nb - 2], [hcx - 4, nb + 3], [hcx + 4, nb + 3], [hcx + nw + 3, nb - 2]], 1.8, mDark, .5, Zf);
    for (const sd of [-1, 1]) { ell(hcx + sd * (nw + 3), nb - 2, 2.6, 3.4, mDark, sph(hcx + sd * (nw + 3), nb - 2, 2.6, 3.4, .45, .8), Zf + 1); px_tone(P, hcx + sd * (nw + 3) - 1, nb - 4, mSilver, 4, Zf + 2); }
  }
  if (S.chainN) for (let dx = -nw + 1; dx <= nw - 1; dx++) { const y = nb + 1 + dx * dx * .07; if ((dx & 1) === 0) px_tone(P, hcx + dx, y, mGold, dx < 0 ? 4 : 2, Zf + 1); }
  if (S.keys) { const kx = hcx - 12, ky = 88; for (let a = 0; a < 6.28; a += .5) px_tone(P, kx + Math.cos(a) * 2.4, ky + Math.sin(a) * 2.4, mSilver, a < 3 ? 3 : 1, Zf + 2); for (const [kx2, kl, m] of [[-2, 5, mGold], [0, 6, mSilver], [2, 4, mGold]]) for (let k = 0; k < kl; k++) px_tone(P, kx + kx2, ky + 3 + k, m, k === kl - 1 ? 1 : 3 - (k & 1), Zf + 2); }
  if (S.cords) {
    const mRope = px_mat(P, [150, 118, 82], { n: 5, bias: .6, hs: .5 });
    const rV = (x, y) => .56 + (((x + y * 2) & 3) < 2 ? .14 : -.12);
    line([[hcx - nw - 2, nb - 5], [hcx - nw + 1, nb + 6], [hcx - 4, 86], [hcx + 3, 97]], 3, mRope, rV, Zf + 1);
    line([[hcx + nw + 2, nb - 5], [hcx + nw, nb + 8], [hcx + 7, 88], [hcx + 9, 97]], 3, mRope, rV, Zf + 2);
    line([[hcx - nw - 5, nb - 2], [hcx - nw - 3, nb + 12], [hcx - 9, 97]], 2.6, mRope, rV, Zf);
    for (const [kx, ky] of [[hcx - nw + 2, nb + 7], [hcx - 2, 90], [hcx + nw, nb + 10], [hcx - nw - 3, nb + 13]]) ell(kx, ky, 3.2, 2.8, mRope, (x, y, a, b) => .5 - a * .3 - b * .3 + (((x + y) & 1) ? .08 : -.08), Zf + 3);
  }
  // ---- ears
  for (const sd of [-1, 1]) {
    const ecx = hcx + sd * (hw(eyeY + 3) + .4), ecy = eyeY + 4;
    ell(ecx, ecy, 2.6, 4.8, mSkin, (x, y, a, b) => (sd < 0 ? .62 : .34) - Math.abs(b) * .1 + (a * sd < -.2 ? -.06 : 0), 7);
    px_adj(P, ecx + sd * .2, ecy, -.25, mSkin); px_adj(P, ecx + sd * .2, ecy + 1, -.18, mSkin);
    if (S.earPlugs) { px_tone(P, ecx, ecy, mWhite, 2, 8); px_tone(P, ecx, ecy + 1, mWhite, 1, 8); }
    if (S.hoops) { for (let a = 0; a < 6.28; a += .45) px_tone(P, ecx + Math.cos(a) * 1.8, ecy + 7 + Math.sin(a) * 2.2, mGold, Math.sin(a) < 0 ? 4 : 1, 13); }
  }
  // ---- head
  const faceV = (x, y) => {
    const w = hw(y + .5); if (w <= 0) return -1; const dxp = x + .5 - hcx; if (Math.abs(dxp) > w) return -1;
    const nx = dxp / w, ny = (y + .5 - (hcy + 3)) / 26, nz = Math.sqrt(Math.max(0, 1 - nx * nx * .86 - ny * ny * .55));
    let v = .46 + (nx * Lx + ny * Ly + nz * Lz - .45) * .62;
    for (const sd of [-1, 1]) {
      v -= (.15 + (sd > 0 ? .05 : 0) + (old || S.hollowEyes ? .07 : 0)) * bump(x, y, hcx + sd * ex, eyeY - .5, 4.6, 2.8);
      v += .07 * bump(x, y, hcx + sd * ex, eyeY - 4.5, 4.5, 1.4);
    }
    v += .12 * bump(x, y, hcx - 1.2, eyeY + 4, 1.1, 3.6) - .17 * bump(x, y, hcx + 1.8, eyeY + 5, 1.1, 3.4);
    v += .1 * bump(x, y, hcx - .8, noseY - 1.5, 1.6, 1.3) - .2 * bump(x, y, hcx + .3, noseY + 1.3, 3, 1);
    v += .08 * bump(x, y, hcx - ex - 1.5, eyeY + 6, 3.6, 2.4) - (.05 + (build < 0 || S.hollow ? .07 : 0)) * bump(x, y, hcx + ex + 2.5, eyeY + 9, 2.6, 4);
    if (build < 0 || S.hollow) v -= .06 * bump(x, y, hcx - ex - 2.5, eyeY + 9, 2.4, 3.5);
    v -= .14 * bump(x, y, hcx, mouthY + 3, 3.4, 1.1); v += .08 * bump(x, y, hcx - 1, chinY - 4, 3, 2);
    if (y > chinY - 3) v -= .1;
    if (hs === 'bald' || hs === 'cap') v += .2 * bump(x, y, hcx - 5, hcy - 16, 4, 3);
    return v;
  };
  px_fill(P, hcx - hrx - 1, hcy - 24, hcx + hrx + 1, chinY + 1, faceV, mSkin, 8);
  const Zd = 9, Zb = 11, Zh = 12, Zt = 13, Zg = 14;
  // bald spots / blush / freckles
  if (S.spots) { px_adj(P, hcx + 4, hcy - 15, -.12, mSkin); px_adj(P, hcx + 6, hcy - 13, -.1, mSkin); px_adj(P, hcx - 7, hcy - 12, -.08, mSkin); }
  if (teen || S.rosy || smile || fem) {
    const bl = S.rosy ? .9 : smile ? .6 : .3;
    for (const sd of [-1, 1]) for (let yy = 0; yy < 3; yy++) for (let xx = -2; xx <= 2; xx++) { const px = hcx + sd * (ex + 1) + xx, py = eyeY + 5 + yy; if (((px + py) & 1) === 0 && Math.abs(xx) + yy < 3 + bl * 2 && r() < .5 + bl * .5) px_tone(P, px, py, mLip, 3 - (sd > 0 ? 1 : 0), Zd); }
  }
  if (S.freckles) for (let k = 0; k < 16; k++) { const px = hcx + (r() - .5) * 18, py = eyeY + 4 + r() * 4; if (Math.abs(px - hcx) > 1.5) px_tone(P, px, py, mSkin, 2, Zd); }
  if (S.mole) px_tone(P, hcx - 7, mouthY - 2, mSkin, 0, Zd);
  // stubble
  const stub = S.stubble || 0;
  if (stub) for (let y = noseY + 1; y <= chinY + 1; y++) for (let x = hcx - hrx; x <= hcx + hrx; x++) {
    const i = y * N + x; if (P.M[i] !== mSkin || P.Z[i] !== 8) continue; const dx = Math.abs(x + .5 - hcx);
    const inZone = y >= mouthY + 1 || (y >= mouthY - 2 && dx <= mw + 1 && y <= mouthY - 1) || dx > hw(y) - 5 - stub * 4;
    if (!inZone || (y < mouthY + 1 && dx > mw + 1 && y < noseY + 3)) continue;
    if (((x + y) & 1) === 0 || r() < stub * .5) { P.M[i] = mStub; P.V[i] = P.V[i] + .05; P.Z[i] = 8; }
  }
  // ---- eyes
  const irisDX = -1, narrow = S.narrow && !shock;
  for (const sd of [-1, 1]) {
    const c = Math.round(hcx + sd * ex - .5), O = (k) => c + sd * k; // k>0 = outer
    const rowsTop = shock ? -2 : (angry || narrow) ? 0 : -1, rowsBot = shock ? 1 : smile ? 0 : 1;
    for (let yy = rowsTop; yy <= rowsBot; yy++) {
      const half = yy === 0 ? 3 : (yy === rowsTop && !shock ? 2 : yy === rowsBot ? 2 : 3);
      for (let k = -half; k <= half; k++) {
        if (sad && yy === rowsTop && k >= 2) continue;
        const ix = O(k) - c; const isIris = (sd < 0 ? (ix === irisDX || ix === irisDX + 1) : (ix === irisDX || ix === irisDX + 1)) && (!shock || yy !== rowsTop);
        if (isIris) px_tone(P, O(k), eyeY + yy, mIris, yy === rowsTop ? 0 : yy === 0 ? 1 : 2, Zd);
        else px_tone(P, O(k), eyeY + yy, mEye, (yy === rowsTop || Math.abs(k) === 3 || k * sd > 1) ? 0 : (k > 0 ? 1 : 2) - (sd > 0 ? 1 : 0), Zd);
      }
    }
    if (!S.hollowEyes) { px_tone(P, c + irisDX, eyeY + (rowsTop < 0 ? rowsTop + (shock ? 1 : 0) : 0), mWhite, 2, Zd + 1); }
    px_tone(P, c + irisDX + 1, eyeY, mInk, 0, Zd + 1);
    // upper lid
    const lidY = eyeY + rowsTop - 1;
    for (let k = -3; k <= 3; k++) { const dy = (sad && k >= 2) ? 1 : (k === -3 ? 1 : 0); px_tone(P, O(k), lidY + dy, mInk, k >= 1 ? 0 : 1, Zd); }
    if (fem) { px_tone(P, O(4), lidY, mInk, 0, Zd); px_tone(P, O(4), lidY - 1, mInk, 1, Zd); }
    else px_tone(P, O(4), lidY + 1, mSkin, 1, Zd);
    if (!shock) for (let k = -3; k <= 3; k++) px_adj(P, O(k), lidY - 1, -.08, mSkin);
    // lower lid / cheek
    if (smile) for (let k = -2; k <= 3; k++) px_tone(P, O(k), eyeY + 1 + (Math.abs(k) >= 3 ? -1 : 0), mSkin, 2, Zd);
    else for (let k = -2; k <= 2; k++) px_tone(P, O(k), eyeY + rowsBot + 1, mSkin, k * sd < 0 ? 3 : 2, Zd);
    if (old || S.hollowEyes) for (let k = -1; k <= 3; k++) px_tone(P, O(k), eyeY + rowsBot + 2 + (k === 3 ? -1 : 0), mSkin, 1 + (sd < 0 ? 1 : 0), Zd);
    if (old) { px_tone(P, O(5), eyeY - 1, mSkin, 1, Zd); px_tone(P, O(5), eyeY + 1, mSkin, 1, Zd); px_tone(P, O(6), eyeY + 2, mSkin, 2, Zd); }
    // brows
    const by = eyeY - 5 - (shock ? 2 : 0) + (angry ? 1 : 0) - (smile ? 0 : 0) + (S.pcap ? 1 : 0);
    const thick = S.brows || (fem ? 1 : 2), bt0 = pt_hsl(hairB)[2] > .55 ? 2 : 1;
    for (let k = -3; k <= 4; k++) {
      let dy = angry ? Math.round((-k + .5) * .5) : sad ? Math.round((k - .5) * .45) : (k >= 0 && k <= 2 ? -1 : 0) + (k >= 4 ? 1 : 0);
      if (shock) dy -= (k >= -1 && k <= 2) ? 1 : 0;
      if (S.scar === 'brow' && sd < 0 && k === 1) continue;
      const tk = thick - (fem && k >= 3 ? 0 : 0); for (let t = 0; t < tk + (thick > 1 && k >= 3 ? -1 : 0); t++) px_tone(P, O(k), by + dy + t, mHair, t === 0 ? bt0 : bt0 - 1, Zd + 1);
      if (thick === 1 && k <= 0) px_tone(P, O(k), by + dy + 1, mHair, bt0 - 1, Zd + 1);
    }
    if (angry) { px_adj(P, hcx + sd, by + 1, -.14, mSkin); px_adj(P, hcx + sd, by + 2, -.14, mSkin); }
  }
  // ---- nose details
  const nX = S.nose === 'broken' ? 1 : 0, nWide = old || build > 0 ? 3 : 2;
  px_tone(P, hcx - nWide, noseY, mSkin, 2, Zd); px_tone(P, hcx + nWide, noseY, mSkin, 0, Zd); px_tone(P, hcx - nWide + 1, noseY + 1, mSkin, 1, Zd); px_tone(P, hcx + nWide - 1, noseY + 1, mSkin, 0, Zd);
  px_tone(P, hcx - 1 + nX, noseY - 1, mSkin, 6, Zd); if (nX) { px_adj(P, hcx + 1, eyeY + 4, -.15, mSkin); px_adj(P, hcx, eyeY + 5, .12, mSkin); }
  if (angry) { px_tone(P, hcx - 2, eyeY + 3, mSkin, 2, Zd); px_tone(P, hcx + 2, eyeY + 3, mSkin, 1, Zd); }
  // ---- age lines
  if (old) {
    const fy = [hcy - 9, hcy - 6]; for (const yy of fy) for (let x = hcx - 7; x <= hcx + 7; x++) if ((x * 7 + yy) % 6 !== 0) px_adj(P, x, yy + (Math.abs(x - hcx) > 4 ? 1 : 0), -.11, mSkin);
    for (const sd of [-1, 1]) for (let k = 0; k < 5; k++) { px_adj(P, hcx + sd * (3 + k * .5 + (k > 2 ? k - 2 : 0)), noseY + k, -.17, mSkin); px_adj(P, hcx + sd * (2 + k * .5), noseY + k, sd < 0 ? .06 : 0, mSkin); }
    for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) px_adj(P, hcx + sd * (mw + 1), mouthY + 2 + k, -.12, mSkin);
  } else if (!teen) for (const sd of [-1, 1]) for (let k = 2; k < 5; k++) px_adj(P, hcx + sd * (3 + k * .6), noseY + k, -.08, mSkin);
  // scars
  if (S.scar === 'brow') { const sx = Math.round(hcx - ex - .5) + 1; for (let y = eyeY - 8; y <= eyeY - 3; y++) px_tone(P, sx + (y > eyeY - 5 ? 0 : 0), y, mLip, 3, Zd + 2); for (let y = eyeY + 3; y <= eyeY + 6; y++) { px_tone(P, sx - 1, y, mLip, 3, Zd + 2); px_adj(P, sx, y, -.1, mSkin); } }
  if (S.scar === 'cheek') for (let k = 0; k < 7; k++) { px_tone(P, hcx + 7 + k * .6, eyeY + 3 + k, mLip, 3, Zd + 2); px_adj(P, hcx + 8 + k * .6, eyeY + 3 + k, -.12, mSkin); }
  // ---- mouth
  const lipT = (x, y, t) => px_tone(P, x, y, mLip, t, Zd);
  const mx0 = hcx - mw, mx1 = hcx + mw;
  if (shock) {
    const wv = [1, 2, 2, 2, 1]; for (let k = 0; k < 5; k++) for (let dx = -wv[k]; dx <= wv[k]; dx++) px_tone(P, hcx + dx, mouthY - 1 + k, k === 0 ? mWhite : k === 4 ? mLip : mInk, k === 0 ? 1 : k === 4 ? 1 : (dx > 0 ? 0 : 1), Zd);
    for (let k = 0; k < 5; k++) { lipT(hcx - wv[k] - 1, mouthY - 1 + k, 2); lipT(hcx + wv[k] + 1, mouthY - 1 + k, 1); }
  } else if (smile) {
    for (let x = mx0; x <= mx1; x++) { const ed = Math.abs(x - hcx) >= mw; lipT(x, mouthY - (ed ? 1 : 0), 0); }
    for (let x = mx0 + 1; x <= mx1 - 1; x++) px_tone(P, x, mouthY + 1 - (Math.abs(x - hcx) >= mw - 1 ? 1 : 0), Math.abs(x - hcx) < mw - 1 ? mWhite : mLip, Math.abs(x - hcx) < mw - 1 ? 2 - (x > hcx + 1 ? 1 : 0) : 0, Zd);
    for (let x = mx0 + 2; x <= mx1 - 2; x++) lipT(x, mouthY + 2, x < hcx ? 2 : 1);
    px_tone(P, mx0 - 1, mouthY - 2, mSkin, 2, Zd); px_tone(P, mx1 + 1, mouthY - 2, mSkin, 1, Zd);
  } else if (sad) {
    for (let x = mx0; x <= mx1; x++) lipT(x, mouthY + (Math.abs(x - hcx) >= mw - 1 ? 1 : 0), 0);
    for (let x = mx0 + 2; x <= mx1 - 2; x++) lipT(x, mouthY + 1, x < hcx ? 3 : 2);
    px_tone(P, mx0, mouthY + 2, mSkin, 2, Zd); px_tone(P, mx1, mouthY + 2, mSkin, 1, Zd);
  } else if (angry) {
    for (let x = mx0; x <= mx1; x++) lipT(x, mouthY - 1 + (Math.abs(x - hcx) >= mw ? 1 : 0), 0);
    for (let x = mx0 + 1; x <= mx1 - 1; x++) px_tone(P, x, mouthY, mWhite, ((x - hcx) & 1) ? 1 : 2, Zd);
    for (let x = mx0; x <= mx1; x++) lipT(x, mouthY + 1 + (Math.abs(x - hcx) >= mw ? 1 : 0), 0);
  } else {
    const sm = S.smirk ? 1 : 0;
    for (let x = mx0 + 1; x <= mx1 - 1; x++) lipT(x, mouthY - (sm && x >= mx1 - 1 ? 1 : 0), x > hcx + 1 ? 0 : 1);
    px_tone(P, mx0, mouthY, mSkin, 2, Zd); px_tone(P, mx1, mouthY - sm, mSkin, 1, Zd);
    if (fem || S.lips) { for (let x = mx0 + 1; x <= mx1 - 1; x++) lipT(x, mouthY - 1, Math.abs(x - hcx) === 1 ? 2 : 1); }
  }
  if (!shock && !smile) for (let x = mx0 + 2; x <= mx1 - 2; x++) { const y = mouthY + (sad ? 2 : 1) + (angry ? 1 : 0); if (fem || S.lips) lipT(x, y, x < hcx ? 3 : 2); else px_adj(P, x, y, x < hcx ? .08 : .03, mSkin); }
  if (!fem && !S.beard && !S.stache && !shock) px_adj(P, hcx, mouthY - 2, -.1, mSkin);
  // ---- beards & mustaches (hair material)
  const hairTex = (x, y, base) => base + Math.sin(x * 1.3 + Math.sin(y * .9) * 2) * .1 + (pt_vn(x * .4, y * .4, 2) - .5) * .2;
  if (S.beard) {
    px_fill(P, hcx - hrx, noseY - 1, hcx + hrx, chinY + 7, (x, y) => {
      const dx = x + .5 - hcx, w = hw(Math.min(y, chinY - 3) + .5) + (y > chinY - 5 ? 2.5 - (y - chinY + 5) * .45 : .8);
      if (Math.abs(dx) > w) return -1; if (y < mouthY - 2 && Math.abs(dx) < w - 5) return -1; if (y < noseY + 2 && Math.abs(dx) < w - 3) return -1;
      if (y > chinY + 2 && Math.abs(dx) > 9 - (y - chinY) * .9) return -1;
      return hairTex(x, y, .5 - dx * .02 - (y - noseY) * .006);
    }, mHair, Zb);
  }
  if (S.goatee) px_fill(P, hcx - 4, mouthY + 1, hcx + 4, chinY + 3, (x, y) => { const dx = x + .5 - hcx; if (Math.abs(dx) > 4 - (y - mouthY) * .12) return -1; return hairTex(x, y, .55 - dx * .03); }, mHair, Zb);
  if (S.stache || S.beard || S.goatee) {
    const kind = S.stache || 'full';
    const rows = kind === 'walrus' ? [[-3, 3], [-5, 5], [-6, 6], [-6, -3], [3, 6], [-7, -5], [5, 7]] : kind === 'neat' ? [[-mw + 1, -1], [1, mw - 1]] : [[-mw, mw], [-mw - 1, -2], [2, mw + 1]];
    const ys = kind === 'walrus' ? [noseY + 1, noseY + 2, noseY + 3, noseY + 4, noseY + 4, noseY + 5, noseY + 5] : kind === 'neat' ? [mouthY - 2, mouthY - 2] : [mouthY - 2, mouthY - 1, mouthY - 1];
    for (let k = 0; k < rows.length; k++) for (let dx = rows[k][0]; dx <= rows[k][1]; dx++) px_put(P, hcx + dx, ys[k], mHair, hairTex(hcx + dx, ys[k], .55 - dx * .03 - k * .03), Zb + 1);
    if (kind === 'neat') for (let dx = -mw; dx <= mw; dx++) px_put(P, hcx + dx, mouthY - 1, mHair, .45 - dx * .03, Zb + 1);
    if (S.beard) for (let x = mx0 + 1; x <= mx1 - 1; x++) px_tone(P, x, mouthY + (smile ? 1 : 0), shock ? mInk : mLip, 0, Zb + 2);
  }
  // ---- front hair
  const vol = { buzz: .8, slick: 1.4, short: 2.8, bun: 1.6, braid: 1.6, curly: 5.5, long: 3, bob: 3.4, cap: 1.2, bald: 1.2 }[hs] || 2.5;
  const hRx = hrx + vol, hRy = craR + vol, hCy = jawY;
  const recede = old && !fem ? 3 : 0;
  const hlc = hcy - 11 - recede - (hs === 'slick' ? 1 : 0), sideY = eyeY - 3 + (fem ? 1 : 0);
  const partX = S.part ? hcx - 5 : (hs === 'long' || hs === 'braid' || hs === 'bun') ? hcx : hcx - 4;
  const hl = (x) => { const dx = Math.abs(x + .5 - hcx), t = Math.min(1, dx / (hrx - 1)); let v = hlc + Math.pow(t, 2.4) * (sideY - hlc); if (hs === 'short') v += Math.sin(x * .8 + 1) * 1.1; if (hs === 'curly') v += Math.sin(x * 1.1) * 1.3 + 1; if (hs === 'slick' && !fem) v += 1.6 * Math.exp(-dx * dx / 5); if (recede) v += 2.5 * Math.exp(-Math.pow((dx - 7) / 2.5, 2)); return v; };
  const sideEnd = fem ? eyeY + 1 : eyeY + 3;
  const hairV = (x, y) => {
    const nx = (x + .5 - hcx) / hRx, ny = (y + .5 - hCy) / hRy, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
    let v = .4 + (nx * Lx + ny * Ly + nz * Lz - .45) * .7;
    const a = Math.atan2(y - (hcy - 30), x - partX); v += .1 * Math.sin(a * 24 + pt_vn(x * .25, y * .25, 7) * 4);
    if (hs === 'slick') { v += .28 * Math.exp(-Math.pow(ny + .62 - nx * .3, 2) / .006) * (nx < .3 ? 1 : .4); v += .05 * Math.sin(x * 1.6 + y * .3); }
    if (hs === 'curly') v += .17 * Math.sin(x * 1.25 + 2 * Math.sin(y * .6)) * Math.sin(y * 1.25 + 2 * Math.sin(x * .5));
    if (hs === 'buzz') v += ((x + y) & 1 ? .06 : -.06) - .05;
    if (Math.abs(x + .5 - partX) < .8 && y < hcy - 12 && hs !== 'buzz' && hs !== 'curly' && hs !== 'slick') v -= .28;
    return v;
  };
  const capTop = (x, y) => { const a = Math.abs(x + .5 - hcx) / hRx, b = Math.abs(y + .5 - hCy) / hRy; return y > hCy ? a * a + b * b < 1 : Math.pow(a, 2.3) + Math.pow(b, 2.3) < 1; };
  if (hs === 'short' || hs === 'slick' || hs === 'buzz' || hs === 'bun' || hs === 'braid' || hs === 'long' || hs === 'bob' || hs === 'curly') {
    const cur = hs === 'curly';
    px_fill(P, hcx - hRx - 7, hcy - 32, hcx + hRx + 7, mouthY + 4, (x, y) => {
      const dx = Math.abs(x + .5 - hcx);
      if (cur) { const ang = Math.atan2(y + .5 - (hcy - 1), x + .5 - hcx), rr = 1 + .07 * Math.sin(ang * 10 + 1) + .03 * Math.sin(ang * 17); const a = (x + .5 - hcx) / (hRx * rr), b = (y + .5 - (hcy - 1)) / ((26) * rr); if (a * a + b * b > 1) return -1; if (y > eyeY + 6) return -1; }
      else if (!capTop(x, y)) return -1;
      const w = hw(y + .5), inFace = dx < w;
      if (y < hl(x)) { if (hs === 'buzz' && y > hl(x) - 1.6 && ((x + y) & 1)) return -1; return hairV(x, y); }
      if (hs === 'bob') { if (y < eyeY - 5 + ((x % 4) === 0 ? 1 : 0)) return hairV(x, y); }
      if (hs === 'long' || hs === 'bob') return -1;
      if (y < (cur ? eyeY + 5 : sideEnd) && (dx > w - (fem ? 1.5 : 2.5) || !inFace)) return hairV(x, y);
      return -1;
    }, mHair, Zh);
  }
  if (hs === 'long') {
    for (const sd of [-1, 1]) px_fill(P, hcx + (sd < 0 ? -hRx - 8 : 0), hcy - 12, hcx + (sd < 0 ? 0 : hRx + 8), 88, (x, y) => {
      const dxs = (x + .5 - hcx) * sd; if (dxs < 0) return -1;
      const tuckZone = S.tuck && y > eyeY - 2 && y < eyeY + 11;
      const inner = y < jawY + 2 ? hw(y + .5) - (tuckZone ? -3.2 : 1.5) : Math.max(hw(y + .5) - 1, nw + 2 + (y - chinY) * .1);
      const outer = Math.max(inner + 4, (y < hcy ? hw(y + .5) + vol + .5 : hrx + vol + 1 - (y - hcy) * .05));
      if (y > 84 - Math.abs(Math.sin(x * .9)) * 6) return -1;
      if (dxs < inner || dxs > outer) return -1; if (y < hl(x) + 1 && dxs < hw(y + .5)) return -1;
      return hairV(x, y) - (y > jawY ? (y - jawY) * .004 : 0) + .05;
    }, mHair, Zh);
  }
  if (hs === 'bob') {
    for (const sd of [-1, 1]) px_fill(P, hcx + (sd < 0 ? -hRx - 2 : 0), hcy - 12, hcx + (sd < 0 ? 0 : hRx + 2), mouthY + 5, (x, y) => {
      const dxs = (x + .5 - hcx) * sd; if (dxs < 0) return -1;
      const inner = hw(y + .5) - 2.2, outer = hrx + vol - Math.max(0, y - (mouthY - 3)) * 1.1;
      if (dxs < inner || dxs > outer || y > mouthY + 3) return -1; if (!capTop(x, y) && y < hcy) return -1;
      return hairV(x, y) + .04;
    }, mHair, Zh);
  }
  if (hs === 'bun' && !S.kerchief) {
    const bx = hcx + 1, byy = hcy - 28;
    ell(bx, byy, 6.8, 5.2, mHair, (x, y, a, b) => .45 + (a * Lx + b * Ly) * .5 + .12 * Math.sin(Math.atan2(b, a) * 3 + Math.hypot(a, b) * 9), Zh - 1);
    if (S.pencil) { line([[bx - 9, byy + 3], [bx + 8, byy - 4]], 1.6, mAcc, (x, y) => .8 - (y - byy) * .02, Zh + 1); px_tone(P, bx - 9, byy + 3, mInk, 1, Zh + 2); px_tone(P, bx + 8, byy - 4, mLip, 3, Zh + 2); px_tone(P, bx + 9, byy - 4, mLip, 2, Zh + 2); }
  }
  if (hs === 'braid') {
    const pts = []; for (let y = eyeY + 4; y < 97; y += 3.6) pts.push([hcx + hrx + 1 + Math.sin(y * .07) * 2 - Math.max(0, y - 74) * .12, y]);
    pts.forEach((p, k) => { const off = (k & 1) ? .9 : -.9; ell(p[0] + off, p[1], 2.9, 2.5, mHair, (x, y, a, b) => .52 + (a * Lx + b * Ly) * .6 - k * .01, Zh + 1 + (k & 1)); });
    const last = pts[pts.length - 1]; if (last && last[1] < 96) ell(last[0], last[1] + 3, 1.8, 1.5, mAcc, .6, Zh + 3);
  }
  if (hs === 'bald' || hs === 'cap') {
    px_fill(P, hcx - hrx - 3, hcy - 12, hcx + hrx + 3, eyeY + 6, (x, y) => {
      const dx = Math.abs(x + .5 - hcx), w = hw(y + .5), a = (x + .5 - hcx) / (hrx + 1.4), b = (y + .5 - hCy) / (craR + 1.4);
      if (a * a + b * b > 1) return -1; if (dx < w - 2.4) return -1; if (y < hcy - 8 + (dx < hrx - 1 ? 3 : 0) + ((x * 3) % 2)) return -1; if (y > eyeY + 4) return -1;
      return hairV(x, y) + .05;
    }, mHair, Zh);
  }
  // hair cast shadow onto forehead / ears
  for (let y = 1; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; if (P.M[i] !== mSkin || P.Z[i] > 8) continue; const up = P.M[i - N], up2 = y > 1 ? P.M[i - 2 * N] : -1; if ((up === mHair && P.Z[i - N] >= Zh) || (S.pcap || S.ccap || S.kerchief) && P.Z[i - N] >= Zt) P.V[i] -= .2; else if (up2 === mHair && P.Z[i - 2 * N] >= Zh) P.V[i] -= .1; }
  // ---- headwear
  if (S.kerchief) {
    const mK = px_mat(P, S.kerchief, { n: 5, bias: .55 });
    px_fill(P, hcx - hRx - 3, hcy - 32, hcx + hRx + 3, hcy - 4, (x, y) => { const a = (x + .5 - hcx) / (hrx + 3), b = (y + .5 - hCy) / (craR + 3); if (a * a + b * b > 1) return -1; const dx = Math.abs(x + .5 - hcx); if (y > hcy - 9 + dx * dx * .03) return -1; let v = .5 + (a * Lx + b * Ly) * .55 + Math.sin(x * .5 - y * .3) * .06; return v; }, mK, Zt);
    for (let y = hcy - 30; y < hcy - 4; y++) for (let x = hcx - hrx - 2; x < hcx + hrx + 2; x++) { const i = y * N + x; if (P.M[i] === mK && (x % 6 === 0) && ((y + (x % 12 === 0 ? 3 : 0)) % 6 === 0)) { px_tone(P, x, y, mWhite, 2, Zt + 1); px_tone(P, x + 1, y, mWhite, 1, Zt + 1); } }
    ell(hcx + 8, hcy - 28, 3.6, 2.6, mK, sph(hcx + 8, hcy - 28, 3.6, 2.6, .5), Zt + 1); ell(hcx + 12, hcy - 27, 3.2, 2.2, mK, sph(hcx + 12, hcy - 27, 3.2, 2.2, .42), Zt + 1); ell(hcx + 10, hcy - 26, 1.6, 1.6, mK, .3, Zt + 2);
    // grey hair peeking at temples
    for (const sd of [-1, 1]) for (let y = hcy - 9; y < hcy - 3; y++) for (let k = 0; k < 2; k++) { const x = hcx + sd * (hw(y + .5) - 1 - k); px_put(P, x, y, mHair, .5 + sd * -.1, Zh); }
  }
  const visorShadow = (y0, y1) => { for (let y = y0; y <= y1; y++) for (let x = hcx - hrx; x <= hcx + hrx; x++) { const i = y * N + x; if (P.M[i] === mSkin && P.Z[i] <= Zd) P.V[i] -= .16 * (1 - (y - y0) / (y1 - y0 + 1)); } };
  if (S.pcap || S.ccap) {
    const big = S.pcap ? 1 : 0, cB = S.pcap ? clothB : pt_mix(clothB, [40, 40, 50], .2), mCap = px_mat(P, cB, { n: 5, bias: .55 }), mBand = px_mat(P, S.pcap ? [150, 40, 42] : clothB, { n: 4, bias: .5 });
    const yb = hcy - 13 + (S.ccap ? -1 : 0), wB = hrx + 1.2 + big, wT = hrx + 3.5 + big * 3;
    poly([[hcx - wB, yb], [hcx - wT, yb - 11 - big], [hcx - wT + 3, yb - 14 - big], [hcx + wT - 3, yb - 14 - big], [hcx + wT, yb - 11 - big], [hcx + wB, yb]], mCap, (x, y) => .5 - (x - hcx) / wT * .3 + (y < yb - 11 - big ? .15 : 0), Zt);
    px_fill(P, hcx - wB, yb - 3, hcx + wB, yb, (x, y) => (Math.abs(x + .5 - hcx) > wB ? -1 : .55 - (x - hcx) * .02 - (y === yb - 3 ? -.1 : 0)), mBand, Zt + 1);
    if (S.ccap) for (let x = Math.ceil(hcx - wB); x <= hcx + wB; x++) { px_tone(P, x, yb - 3, mGold, x < hcx ? 3 : 2, Zt + 2); px_tone(P, x, yb, mGold, x < hcx ? 2 : 1, Zt + 2); }
    poly([[hcx - wB + 1, yb], [hcx + wB - 1, yb], [hcx + wB - 3, yb + 3], [hcx - wB + 3, yb + 3]], mDark, (x, y) => .55 - (y - yb) * .15 + (y === yb && x < hcx ? .2 : 0), Zt + 2);
    ell(hcx, yb - 5, 2.2, 2.4, mGold, sph(hcx, yb - 5, 2.2, 2.4, .6, .9), Zt + 3);
    visorShadow(yb + 1, yb + 6 + big);
  }
  if (hs === 'cap' && !S.pcap && !S.ccap) {
    const capC = pt_mix(accB, clothB, .3), mCap = px_mat(P, capC, { n: 5, bias: .55 });
    px_fill(P, hcx - hrx - 4, hcy - 30, hcx + hrx + 5, hcy - 10, (x, y) => { const a = (x + .5 - hcx - 1) / (hrx + 4), b = (y + .5 - (hcy - 17)) / 11; if (a * a + b * b > 1 || y > hcy - 12) return -1; return .5 + (a * Lx + b * Ly) * .6 + (((x >> 1) + (y >> 1)) & 1 ? .05 : -.05); }, mCap, Zt);
    poly([[hcx - hrx - 1, hcy - 13], [hcx + hrx + 3, hcy - 13], [hcx + hrx + 1, hcy - 9], [hcx - hrx + 1, hcy - 9]], mCap, (x, y) => .42 - (y - hcy + 13) * .08 - (x - hcx) * .01, Zt + 1);
    px_tone(P, hcx + 1, hcy - 24, mCap, 4, Zt + 2); visorShadow(hcy - 8, hcy - 4);
  }
  if (S.goggles) {
    for (let x = hcx - hrx - 1; x <= hcx + hrx + 1; x++) { const y = hcy - 12 + Math.round(Math.abs(x - hcx) * .08); if (capTop(x, y) || Math.abs(x - hcx) < hrx + 1) { px_tone(P, x, y, mDark, 1, Zt); px_tone(P, x, y + 1, mDark, 0, Zt); } }
    for (const sd of [-1, 1]) { const gx = hcx + sd * 5, gy = hcy - 12; ell(gx, gy, 3.6, 3, mGold, (x, y, a, b) => .55 - b * .3 - a * .2, Zt + 1); ell(gx, gy, 2.2, 1.8, mSilver, (x, y, a, b) => .3 - b * .2, Zt + 2); px_tone(P, gx - 1, gy - 1, mWhite, 2, Zt + 3); }
  }
  if (S.headset) {
    for (let a = -Math.PI; a <= 0; a += .02) { const x = hcx + Math.cos(a) * (hRx + 1.5), y = hCy + Math.sin(a) * (hRy + 1.2); if (y < eyeY) { px_tone(P, x, y, mDark, 1, Zt); px_tone(P, x, y + 1, mDark, 0, Zt); } }
    for (const sd of [-1, 1]) { const cx2 = hcx + sd * (hrx + 1.5); ell(cx2, eyeY + 3, 2.8, 4.4, mDark, sph(cx2, eyeY + 3, 2.8, 4.4, .45, .8), Zt + 1); px_tone(P, cx2 - 1, eyeY + 1, mSilver, 4, Zt + 2); }
    line([[hcx - hrx - 1, eyeY + 6], [hcx - hrx + 2, mouthY + 1], [hcx - mw - 2, mouthY + 1]], 1, mDark, .3, Zt + 1); ell(hcx - mw - 2, mouthY + 1, 1.5, 1.3, mDark, .15, Zt + 2);
  }
  if (S.earCig) { for (let k = 0; k < 7; k++) px_tone(P, hcx + hrx - 2 + k, eyeY - 1 + (k > 4 ? 1 : 0), k < 2 ? mAcc : mWhite, k < 2 ? 2 : (k > 4 ? 1 : 2), Zt + 2); }
  if (S.plaster) { const mP = px_mat(P, [214, 184, 150], { n: 4, bias: .55 }); line([[hcx + 4, hcy - 7], [hcx + 10, hcy - 10]], 2.6, mP, (x, y) => .6 + (((x + y) & 1) ? .1 : 0), Zt); px_tone(P, hcx + 7, hcy - 9, mP, 1, Zt + 1); }
  // ---- glasses
  const gl = S.gl || (L.glasses ? 'round' : null);
  if (L.glasses && gl) {
    const fr = (x, y, t) => px_tone(P, x, y, mFrame, t, Zg);
    for (const sd of [-1, 1]) {
      const gx = hcx + sd * ex - .5, gy = eyeY;
      for (let y = gy - 5; y <= gy + 5; y++) for (let x = Math.floor(gx - 6); x <= Math.ceil(gx + 6); x++) {
        const u = (x + .5 - gx - .5), v = (y + .5 - gy - .3); let on = false;
        if (gl === 'round' || gl === 'wire') { const d = Math.hypot(u / 4.6, v / 3.9); on = d > .8 && d <= 1.08; }
        else if (gl === 'square') on = (Math.abs(u) <= 4.6 && Math.abs(v) <= 3.4) && (Math.abs(u) > 3.6 || Math.abs(v) > 2.4);
        else if (gl === 'cat') { const top = -3.2 - (u * sd > 1 ? (u * sd - 1) * .45 : 0); on = (Math.abs(u) <= 4.8 && v >= top - .9 && v <= 3) && (Math.abs(u) > 3.9 || v < top + .4 || v > 2); }
        else if (gl === 'half') on = (Math.abs(u) <= 4.6 && v >= -.6 && v <= 3) && (Math.abs(u) > 3.7 || v > 2.1 || (v < .3));
        if (on) fr(x, y, (gl === 'wire' || gl === 'half') ? (v < 0 ? 3 : 2) : (u < 0 && v < 0 ? 2 : v > 1 ? 0 : 1));
      }
      if (gl !== 'half') { px_tone(P, gx - 2.4, gy - 1.6, mWhite, 2, Zg + 1); px_tone(P, gx - 1.4, gy - 2.6, mWhite, 1, Zg + 1); }
      const tx0 = gx + sd * 5; for (let k = 0; k < 4; k++) fr(tx0 + sd * k, gy - 1, 0);
    }
    for (let x = hcx - 1; x <= hcx; x++) fr(x, eyeY - 1, 1);
    if (S.chain) for (let k = 0; k < 18; k += 2) { const t = k / 17; for (const sd of [-1, 1]) px_tone(P, hcx + sd * (ex + 5 + t * 4 - t * t * 6), eyeY + 1 + t * (nb - eyeY - 2), mGold, 3 - (sd > 0 ? 1 : 0), Zg); }
  }
  // ---- cigarette in mouth corner + smoke + ember glow
  if (L.extra === 'cigarette' && !S.earCig) {
    const x0 = hcx + mw - 1, y0 = mouthY + (smile ? -1 : 0); let ex2 = 0, ey2 = 0;
    for (let k = 0; k < 7; k++) { const x = x0 + k, y = y0 + (k >> 2); if (k === 6) { px_tone(P, x, y, mEmber, 1, Zg); px_tone(P, x + 1, y, mEmber, 2, Zg); ex2 = x + 1; ey2 = y; } else px_tone(P, x, y, mWhite, k < 2 ? 1 : 2, Zg); }
    for (let k = 0; k < 7; k++) px_adj(P, x0 + k, y0 + 1 + (k >> 2), -.1, mSkin);
    for (let y = ey2 - 6; y <= ey2 + 6; y++) for (let x = ex2 - 6; x <= ex2 + 6; x++) { const d = Math.hypot(x - ex2, y - ey2); if (d < 6) px_adj(P, x, y, .1 * (1 - d / 6), mSkin); }
    for (let k = 2; k < 40; k++) { const sx = ex2 + Math.sin(k * .33) * 2.2 + k * .25, sy = ey2 - k * 1.1; const i = Math.round(sy) * N + Math.round(sx); if (sy < 1 || sx >= N - 1) break; if (P.M[i] === mBg || P.M[i] === mBgW) { px_put(P, sx, sy, mSmoke, .7 - k * .012, 1); if ((k & 1) && k > 6) px_put(P, sx + 1, sy, mSmoke, .3, 1); } }
  }
  // tears / sweat
  if (sad) { const tx = Math.round(hcx + ex - .5) + 2; for (let k = 0; k < 3; k++) px_tone(P, tx, eyeY + 2 + k, mWhite, k === 0 ? 2 : 1, Zg + 1); }
  if (shock) { const tx = Math.round(hcx - hrx + 2); px_tone(P, tx, hcy - 7, mWhite, 2, Zg + 1); px_tone(P, tx, hcy - 6, mWhite, 1, Zg + 1); px_tone(P, tx + 1, hcy - 6, mWhite, 0, Zg + 1); }
  const cv = px_render(P, { mode: 'portrait', rimX: hcx + 4, tint: opts.tint });
  _pbuf.set(key, cv); if (_pbuf.size > 120) _pbuf.delete(_pbuf.keys().next().value);
  return cv;
}

/* ---------------------------------------------------------------- painted badge */
function wobbleCircle(g, cx, cy, R, r, amp) {
  g.beginPath(); const n = 48;
  for (let i = 0; i <= n; i++) { const a = i / n * 6.2832, k = 1 + (pt_vn(Math.cos(a) * 2 + 5, Math.sin(a) * 2 + 5, 11) - .5) * amp + (r() - .5) * amp * .25; const x = cx + Math.cos(a) * R * k, y = cy + Math.sin(a) * R * k; if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); }
  g.closePath();
}
function pt_compose(look, opts, size) {
  const buf = buildPortraitBuffer(look, opts), cv = pt_mk(size, size), g = cv.getContext('2d'), r = pt_rng(pt_hash(pt_lookKey(pt_norm(look))) + 7);
  const R = size * .47, bw = size * .072, Rin = R - bw * .62, c = size / 2;
  g.translate(c, c);
  // drop shadow
  const sh = g.createRadialGradient(size * .02, size * .04, R * .7, size * .02, size * .04, R * 1.08); sh.addColorStop(0, 'rgba(0,0,0,.55)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = sh; g.beginPath(); g.arc(size * .02, size * .04, R * 1.08, 0, 7); g.fill();
  // pixel art: integer nearest upscale, then filtered fit (even pixel sizes at any badge size)
  g.save(); g.beginPath(); g.arc(0, 0, Rin, 0, 7); g.clip();
  const diam = Rin * 2.02, CR = 82, k = Math.max(1, Math.ceil(diam / CR)), up = pt_mk(PT_N * k, PT_N * k), ug = up.getContext('2d');
  ug.imageSmoothingEnabled = false; ug.drawImage(buf, 0, 0, PT_N * k, PT_N * k);
  g.imageSmoothingEnabled = true; if ('imageSmoothingQuality' in g) g.imageSmoothingQuality = 'high';
  g.drawImage(up, 7 * k, 5 * k, CR * k, CR * k, -diam / 2, -diam / 2, diam, diam);
  const vg = g.createRadialGradient(-Rin * .15, -Rin * .2, Rin * .55, 0, 0, Rin * 1.02); vg.addColorStop(0, 'rgba(8,6,16,0)'); vg.addColorStop(1, 'rgba(8,6,16,.5)'); g.fillStyle = vg; g.fillRect(-Rin, -Rin, Rin * 2, Rin * 2);
  g.shadowColor = 'rgba(0,0,0,.75)'; g.shadowBlur = bw * .9; g.shadowOffsetX = bw * .22; g.shadowOffsetY = bw * .3; g.strokeStyle = '#000'; g.lineWidth = bw; g.beginPath(); g.arc(0, 0, Rin + bw * .5, 0, 7); g.stroke();
  g.restore();
  // frame: dark base ring
  g.lineCap = 'round';
  wobbleCircle(g, 0, 0, R - bw * .05, r, .012); g.lineWidth = bw * 1.4; g.strokeStyle = 'rgb(26,17,14)'; g.stroke();
  // brushed brass band, lit from upper-left, cool reflection lower-right, warm rim glint right
  const brassD = [92, 58, 26], brassM = [176, 128, 56], brassL = [246, 214, 140], cool = [86, 118, 128];
  for (let i = 0; i < 120; i++) {
    const a = r() * 6.2832, da = .06 + r() * .26, rr = R - bw * .05 + (r() - .5) * bw * .62, lit = Math.pow(Math.cos(a + 2.36) * .5 + .5, 1.4);
    let col = lit > .5 ? pt_mix(brassM, brassL, (lit - .5) * 2 * (.6 + r() * .4)) : pt_mix(brassD, brassM, lit * 2 * (.7 + r() * .3));
    if (lit < .25 && r() < .5) col = pt_mix(col, cool, .45); const wr = Math.cos(a) * .5 + .5; if (wr > .85 && r() < .5) col = pt_mix(col, [255, 170, 90], .4);
    g.strokeStyle = pt_css(col, .5 + r() * .45); g.lineWidth = bw * (.16 + r() * .32); g.beginPath(); g.arc(0, 0, rr, a, a + da); g.stroke();
  }
  // engraved groove + bevels
  g.strokeStyle = 'rgba(30,18,10,.75)'; g.lineWidth = Math.max(1, bw * .1); g.beginPath(); g.arc(0, 0, R - bw * .05, 0, 7); g.stroke();
  g.strokeStyle = 'rgba(255,232,170,.35)'; g.lineWidth = Math.max(.8, bw * .06); g.beginPath(); g.arc(0, 0, R + bw * .05, -3.3, -.9); g.stroke();
  g.strokeStyle = 'rgba(255,238,180,.7)'; g.lineWidth = Math.max(.8, bw * .09); g.beginPath(); g.arc(0, 0, R + bw * .48, -3.0, -1.4); g.stroke();
  g.strokeStyle = 'rgba(255,170,90,.55)'; g.beginPath(); g.arc(0, 0, R + bw * .44, -.7, .5); g.stroke();
  g.strokeStyle = 'rgba(255,236,170,.55)'; g.lineWidth = Math.max(.8, bw * .08); g.beginPath(); g.arc(0, 0, Rin + bw * .08, .3, 1.9); g.stroke();
  g.strokeStyle = 'rgba(12,8,12,.92)'; g.lineWidth = Math.max(1.2, bw * .14); g.beginPath(); g.arc(0, 0, Rin, 0, 7); g.stroke();
  wobbleCircle(g, 0, 0, R + bw * .66, r, .01); g.lineWidth = Math.max(1.2, bw * .12); g.strokeStyle = 'rgba(12,8,12,.9)'; g.stroke();
  // ticks (bell dial) and four rivets
  for (let i = 0; i < 24; i++) {
    if (i % 6 === 3) continue; const a = i / 24 * 6.2832 - 1.5708, ca = Math.cos(a), sa = Math.sin(a), r0 = R - bw * .3, r1 = R + bw * (i % 2 ? .12 : .25);
    g.strokeStyle = 'rgba(40,24,12,.8)'; g.lineWidth = Math.max(.8, bw * .09); g.beginPath(); g.moveTo(ca * r0, sa * r0); g.lineTo(ca * r1, sa * r1); g.stroke();
    g.strokeStyle = 'rgba(255,230,160,.35)'; g.beginPath(); g.moveTo(ca * r0 - sa * bw * .08, sa * r0 + ca * bw * .08); g.lineTo(ca * r1 - sa * bw * .08, sa * r1 + ca * bw * .08); g.stroke();
  }
  for (let i = 0; i < 4; i++) {
    const a = i * 1.5708 + .785, x = Math.cos(a) * (R - bw * .02), y = Math.sin(a) * (R - bw * .02), rv = bw * .2;
    const gr = g.createRadialGradient(x - rv * .35, y - rv * .4, rv * .1, x, y, rv); gr.addColorStop(0, 'rgb(255,236,180)'); gr.addColorStop(.5, 'rgb(170,120,50)'); gr.addColorStop(1, 'rgb(44,26,12)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, rv, 0, 7); g.fill();
  }
  return cv;
}
function drawPortraitImpl(canvas, look, opts) {
  opts = opts || {}; if (opts.size) { canvas.width = canvas.height = opts.size; }
  const W = canvas.width, H = canvas.height, size = Math.min(W, H), g = canvas.getContext('2d');
  const key = [pt_lookKey(pt_norm(look)), opts.mood || 'neutral', opts.tint || '', opts.bg || '', size].join('#');
  let comp = _pcomp.get(key); if (!comp) { comp = pt_compose(look, opts, size); _pcomp.set(key, comp); if (_pcomp.size > 60) _pcomp.delete(_pcomp.keys().next().value); }
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); g.drawImage(comp, Math.round((W - size) / 2), Math.round((H - size) / 2)); g.restore();
}
/* ===================================================================
 * SCENES: title, day cards, ending tableaux (painted, layered, responsive)
 *  - every tableau is painted in LOGICAL units: k = min(h/720, w/640), W = w/k, H = h/k
 *    (landscape keeps 720 logical rows, portrait keeps 640 logical columns), so nothing is ever stretched.
 *  - painted once into a few parallax layers (cached), animated cheaply on top.
 * =================================================================== */
const _tab = new Map(), _cards = new Map();
const GS = {};                                   // scene painters: GS[id](S, r)
const GS_M = 26;                                 // parallax margin (logical px)
function gs_layout(w, h) { const k = Math.min(h / 720, w / 640); return { k: k, W: w / k, H: h / k }; }

/* ---------------------------------------------------------- engine */
function gs_build(id, w, h, dpr) {
  const L = gs_layout(w, h), W = L.W, H = L.H, M = GS_M;
  const bs = L.k * dpr;                       // bake at exact device resolution => per-frame blits are unscaled & pixel aligned
  const S = { id: id, W: W, H: H, M: M, k: L.k, bs: bs, dpr: dpr, port: W < H * .95, layers: [], anims: [], t: 0 };
  S.layer = function (depth, o) {            // o: {y0,y1,drift:[amp,period]} ; returns a ctx in logical coords
    o = o || {}; const y0 = o.y0 === undefined ? -M : Math.max(-M, Math.floor(o.y0)), y1 = o.y1 === undefined ? H + M : Math.min(H + M, Math.ceil(o.y1));
    const ex = o.drift ? o.drift[0] : 0;
    const c = mk((W + 2 * M + 2 * ex) * bs, (y1 - y0) * bs), g = ctx2(c);
    g.setTransform(bs, 0, 0, bs, (M + ex) * bs, -y0 * bs);
    S.layers.push({ c: c, g: g, depth: depth, y0: y0, y1: y1, ex: ex, drift: o.drift });
    return g;
  };
  S.anim = function (depth, fn) { S.anims.push({ depth: depth, fn: fn }); };
  GS[id](S, RNG(hashStr(id) ^ 0x5bd1));
  S.anims.sort((a, b) => a.depth - b.depth);
  const L0 = S.layers[0]; if (L0) { L0.g.setTransform(1, 0, 0, 1, 0, 0); applyGrain(L0.g, L0.c.width, L0.c.height, .26, 'overlay'); }
  S.layers.forEach((Lr) => { Lr.g = null; });
  return S;
}
function gs_get(map, id, w, h, dpr) {
  const key = id + '|' + w + '|' + h + '|' + dpr; let S = map.get(key);
  if (!S) { S = gs_build(id, w, h, dpr); map.set(key, S); if (map.size > 3) map.delete(map.keys().next().value); }
  return S;
}
function gs_draw(map, ctx, w, h, t, id) {
  w = Math.max(2, Math.round(w)); h = Math.max(2, Math.round(h)); t = t || 0;
  const base = ctx.getTransform ? ctx.getTransform() : { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  const dpr = Math.round(Math.hypot(base.a, base.b) * 100) / 100 || 1;
  const S = gs_get(map, id, w, h, Math.min(dpr, 2)), k = S.k, M = S.M, bs = S.bs, exact = Math.abs(S.dpr - dpr) < .01;
  ctx.save();
  ctx.fillStyle = '#050408'; ctx.fillRect(0, 0, w, h);
  // slow camera: drift in a lissajous so it never looks like a loop
  const cx = Math.sin(t * .000061) * .7 + Math.sin(t * .000023 + 1) * .3, cy = Math.cos(t * .000047) * .6 + Math.sin(t * .000017) * .4;
  const off = (d, extra) => [Math.round((cx * M * .8 * d + (extra || 0)) * bs) / bs, Math.round(cy * M * .45 * d * bs) / bs];
  const at = function (d) { const o = off(d); ctx.setTransform(base.a, base.b, base.c, base.d, base.e, base.f); ctx.scale(k, k); ctx.translate(o[0], o[1]); };
  S.at = at; S.t = t;
  let ai = 0;
  const runAnims = (dmax) => { while (ai < S.anims.length && S.anims[ai].depth <= dmax) { const A = S.anims[ai++]; at(A.depth); A.fn(ctx, t, S); } };
  for (const Lr of S.layers) {
    runAnims(Lr.depth - 1e-6);
    const dx = Lr.drift ? Math.sin(t / Lr.drift[1] * 6.2832) * Lr.drift[0] : 0, o = off(Lr.depth, dx);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    if (exact) { ctx.setTransform(1, 0, 0, 1, Math.round(base.e), Math.round(base.f)); ctx.drawImage(Lr.c, Math.round((o[0] - M - Lr.ex) * bs), Math.round((Lr.y0 + o[1]) * bs)); }
    else { at(Lr.depth); ctx.translate(dx, 0); ctx.drawImage(Lr.c, -M - Lr.ex, Lr.y0, Lr.c.width / bs, Lr.c.height / bs); }
  }
  runAnims(1e9);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.setTransform(1, 0, 0, 1, Math.round(base.e), Math.round(base.f));
  const vw = Math.round(w * dpr), vh = Math.round(h * dpr);
  ctx.drawImage(vignette(vw, vh), 0, 0);
  ctx.restore();
}
function drawTitleImpl(ctx, w, h, t) { gs_draw(_tab, ctx, w, h, t, 'title'); }
function drawDayCardImpl(ctx, w, h, t, day) { gs_draw(_cards, ctx, w, h, t, (day === 3 || day === '3') ? 'day3' : 'day2'); }
function drawEndingImpl(ctx, w, h, t, id) { gs_draw(_tab, ctx, w, h, t, GS[id] ? id : 'end_curfew'); }

/* ---------------------------------------------------------- paint helpers */
function gs_stop(stops, t) { t = clamp(t, 0, 1); for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) { const a = stops[i - 1], b = stops[i]; return mix(a[1], b[1], (t - a[0]) / (b[0] - a[0] || 1)); } return stops[stops.length - 1][1]; }
function gs_grad(g, x0, y0, x1, y1, stops, a) { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(s => gr.addColorStop(s[0], css(s[1], s[2] === undefined ? (a === undefined ? 1 : a) : s[2]))); return gr; }
/* sky / wall wash: vertical gradient + long loose directional strokes picked from it */
function gs_wash(g, r, x, y, w, h, stops, o) {
  o = o || {};
  g.fillStyle = gs_grad(g, 0, y, 0, y + h, stops); g.fillRect(x, y, w, h);
  const n = o.n || Math.round(w * h / 900), ang = o.ang || 0, aj = o.aj === undefined ? .06 : o.aj, sl = o.sl || [80, 300], sw = o.sw || [6, 22];
  for (let i = 0; i < n; i++) {
    const yy = y + r() * h, xx = x + r() * w, tt = (yy - y) / h + r.g() * (o.mixY || .04);
    bristle(g, xx, yy, ang + r.g() * aj, r.r(sl[0], sl[1]), r.r(sw[0], sw[1]), jit(gs_stop(stops, tt), r, o.jv || .07), r.r(.12, o.amax || .32), r);
  }
}
/* glow / light */
function gs_glow(g, x, y, rad, col, a, comp) { g.save(); g.globalCompositeOperation = comp || 'lighter'; g.globalAlpha = clamp(a, 0, 1); g.drawImage(glowSprite(col, 128), x - rad, y - rad, rad * 2, rad * 2); g.restore(); }
function gs_eglow(g, x, y, rx, ry, col, a, comp) { g.save(); g.globalCompositeOperation = comp || 'lighter'; g.globalAlpha = clamp(a, 0, 1); g.drawImage(glowSprite(col, 128), x - rx, y - ry, rx * 2, ry * 2); g.restore(); }
function gs_beam(g, x0, y0, w0, x1, y1, w1, col, a0, a1, hard) {   // a soft volumetric light shaft (nested trapezoids)
  g.save(); g.globalCompositeOperation = 'lighter';
  const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, css(col, 1)); gr.addColorStop(1, css(col, a1 === undefined ? 0 : a1 / (a0 || 1)));
  g.fillStyle = gr; const n = hard ? 1 : 5;
  for (let i = 0; i < n; i++) { const k = hard ? 1 : .55 + i * .16; g.globalAlpha = a0 / n * (hard ? 1 : 1.4); g.beginPath(); g.moveTo(x0 - w0 * k / 2, y0); g.lineTo(x0 + w0 * k / 2, y0); g.lineTo(x1 + w1 * k / 2, y1); g.lineTo(x1 - w1 * k / 2, y1); g.closePath(); g.fill(); }
  g.restore();
}
function gs_dark(g, x, y, w, h, hx, hy, rx, ry, col, a) {   // darken everything except a soft elliptical pool
  g.save(); g.translate(hx, hy); g.scale(1, ry / rx);
  const R = Math.max(w, h) * 2, gr = g.createRadialGradient(0, 0, rx * .25, 0, 0, rx * 1.6);
  gr.addColorStop(0, css(col, 0)); gr.addColorStop(.5, css(col, a * .55)); gr.addColorStop(1, css(col, a));
  g.fillStyle = gr; g.fillRect(-R, -R * rx / ry, R * 2, R * 2 * rx / ry); g.restore();
}
function gs_haze(g, x, y0, w, y1, col, a0, a1) { g.fillStyle = gs_grad(g, 0, y0, 0, y1, [[0, col, a0], [1, col, a1]]); g.fillRect(x, y0, w, y1 - y0); }
/* painted cloud mass, lit from L (unit vector towards light) */
function gs_cloud(g, r, cx, cy, rx, ry, dark, lit, L, o) {
  o = o || {}; const n = o.n || Math.round(rx * ry / 40 + 40), lx = L[0], ly = L[1];
  const puffs = []; for (let i = 0; i < (o.p || 5); i++) puffs.push([cx + r.g() * rx * .7, cy + r.g() * ry * .4 - Math.abs(r.g()) * ry * .2, r.r(.45, 1)]);
  g.save();
  for (let i = 0; i < n; i++) {
    const P = puffs[i % puffs.length], a = r() * 6.2832, d = Math.sqrt(r());
    const x = P[0] + Math.cos(a) * d * rx * .55 * P[2], y = P[1] + Math.sin(a) * d * ry * .5 * P[2];
    if (y > cy + ry * .38) continue;                   // flattish bottoms
    const nx = Math.cos(a), ny = Math.sin(a), f = clamp((nx * lx + ny * ly) * d * .9 + .25 + (y - cy) / ry * .4 * ly, 0, 1);
    const c = mix(dark, lit, f * f);
    bristle(g, x, y, (o.ang || 0) + r.g() * .25, r.r(30, 110) * (rx / 200 + .4), r.r(6, 18) * (ry / 60 + .5), jit(c, r, .06), r.r(.16, .36) * (o.a || 1), r);
  }
  g.restore();
}
/* polygon painter shortcut with a light direction (L = towards light) */
function gs_poly(g, r, pts, col, L, o) {
  o = o || {}; const a = Math.atan2(-L[1], -L[0]);
  const opt = Object.assign({ ang: a + 1.57, aj: .3, jv: .1, light: L, hi: o.rim || [255, 214, 160], ew: o.ew || 1.6, lit: [o.litc || mix(col, [255, 230, 190], .25), o.shc || mul(col, .55), a, o.la === undefined ? .5 : o.la, o.sa === undefined ? .55 : o.sa], ink: false }, o);
  paintPoly(g, pts, col, r, opt);
}
function gs_rect(g, r, x, y, w, h, col, L, o) { gs_poly(g, r, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], col, L, o); }
function gs_ell(g, r, cx, cy, rx, ry, col, L, o) { gs_poly(g, r, ellPts(cx, cy, rx, ry, (o && o.pn) || 22, (o && o.rot) || 0, r, .05), col, L, o); }
/* loose brush text (graffiti / chalk / ink) */
function gs_text(g, r, s, x, y, size, col, o) {
  o = o || {}; g.save(); g.textAlign = o.align || 'center'; g.textBaseline = 'middle';
  g.font = (o.weight || 'bold') + ' ' + size + 'px ' + (o.font || '"Courier New", monospace');
  g.translate(x, y); if (o.rot) g.rotate(o.rot);
  if (o.sx) g.scale(o.sx, 1);
  for (let p = 0; p < (o.passes || 3); p++) { g.globalAlpha = (o.a || .9) * (p ? .45 : 1); g.fillStyle = css(jit(col, r, .12)); g.fillText(s, (r() - .5) * size * .06, (r() - .5) * size * .06); }
  if (o.drip) { g.strokeStyle = css(col, .8); g.lineCap = 'round'; const tw = g.measureText(s).width; for (let i = 0; i < o.drip; i++) { const dx = (r() - .5) * tw, len = r.r(size * .3, size * 1.6); g.lineWidth = r.r(1.5, size * .09); g.beginPath(); g.moveTo(dx, size * .3); g.lineTo(dx + r.g() * 2, size * .3 + len); g.stroke(); } }
  g.restore();
}
/* small silhouette crow; wing phase p (0..1) */
function gs_crow(g, x, y, s, p, col) {
  const f = Math.sin(p * 6.2832); g.fillStyle = col || 'rgba(12,10,14,.9)';
  g.beginPath(); g.moveTo(x - 11 * s, y - 2 * s + f * 7 * s); g.quadraticCurveTo(x - 5 * s, y - 4 * s - f * 2 * s, x - 1 * s, y);
  g.lineTo(x + 1.5 * s, y - 1.5 * s); g.lineTo(x + 4 * s, y - .5 * s); g.lineTo(x + 1 * s, y + .8 * s);
  g.quadraticCurveTo(x + 5 * s, y - 4 * s - f * 2 * s, x + 11 * s, y - 2 * s + f * 7 * s); g.quadraticCurveTo(x + 4 * s, y + 1 * s, x, y + 2.2 * s); g.quadraticCurveTo(x - 4 * s, y + 1 * s, x - 11 * s, y - 2 * s + f * 7 * s); g.fill();
}
function gs_perched(g, x, y, s, dir) { g.fillStyle = 'rgba(10,9,12,.95)'; g.beginPath(); g.ellipse(x, y - 4 * s, 4 * s, 5.5 * s, dir * .3, 0, 7); g.fill(); g.beginPath(); g.arc(x + dir * 3 * s, y - 10 * s, 2.6 * s, 0, 7); g.fill(); g.beginPath(); g.moveTo(x + dir * 5 * s, y - 10.5 * s); g.lineTo(x + dir * 8.5 * s, y - 9.5 * s); g.lineTo(x + dir * 5 * s, y - 9 * s); g.fill(); g.beginPath(); g.moveTo(x - dir * 2 * s, y - 1 * s); g.lineTo(x - dir * 8 * s, y + 4 * s); g.lineTo(x - dir * 3 * s, y + 1 * s); g.fill(); }
/* horn loudspeaker pointing ang (rad), at x,y, size s */
function gs_horn(g, r, x, y, s, ang, L, col) {
  col = col || [44, 46, 50]; const c = Math.cos(ang), sn = Math.sin(ang), P = (u, v) => [x + c * u - sn * v, y + sn * u + c * v];
  gs_poly(g, r, [P(-6 * s, -5 * s), P(4 * s, -6 * s), P(30 * s, -17 * s), P(30 * s, 17 * s), P(4 * s, 6 * s), P(-6 * s, 5 * s)], col, L, { n: 24, sw: 2.6 * s, ink: true, inkw: 1.4 * s, la: .6 });
  g.fillStyle = css([10, 9, 12]); g.beginPath(); g.ellipse(P(30 * s, 0)[0], P(30 * s, 0)[1], 5 * s, 17 * s, ang, 0, 7); g.fill();
}
/* utility pole with crossbar */
function gs_pole(g, r, x, y, h, L, col) {
  col = col || [38, 32, 30];
  gs_poly(g, r, [[x - 5, y - h], [x + 5, y - h], [x + 7, y], [x - 7, y]], col, L, { n: 30, sw: 3, ang: 1.57, aj: .05, ink: true, inkw: 1.5, la: .5 });
  gs_rect(g, r, x - 34, y - h + 18, 68, 6, mul(col, 1.1), L, { n: 10, sw: 2, ang: 0, ink: true, inkw: 1.2 });
  for (const dx of [-28, -12, 12, 28]) { g.fillStyle = css([150, 140, 120]); g.fillRect(x + dx - 2, y - h + 12, 4, 6); }
}
function gs_wire(g, a, b, sag, col, w) { g.strokeStyle = col || 'rgba(14,12,16,.75)'; g.lineWidth = w || 1.4; g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + sag, b[0], b[1]); g.stroke(); }
function gs_wireAt(a, b, sag, t) { const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + sag]; return [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * m[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * m[1] + t * t * b[1]]; }
/* window: lit (warm interior w/ mullions + optional silhouette) or dark (sky reflection) */
function gs_window(g, r, x, y, w, h, lit, o) {
  o = o || {};
  if (lit) {
    const c = o.col || [255, 184, 96];
    g.fillStyle = gs_grad(g, 0, y, 0, y + h, [[0, mul(c, .78)], [.6, c], [1, mix(c, [255, 240, 200], .3)]]); g.fillRect(x, y, w, h);
    for (let i = 0; i < 4; i++) bristle(g, x + r() * w, y + r() * h, 1.57 + r.g() * .2, h * .6, Math.max(1, w * .2), jit(mix(c, [255, 236, 190], r() * .5), r, .1), .35, r);
    if (o.who) { g.fillStyle = css(mul(c, .3), .85); const px = x + w * r.r(.3, .7); g.beginPath(); g.arc(px, y + h * .42, w * .17, 0, 7); g.fill(); g.beginPath(); g.moveTo(px - w * .32, y + h); g.quadraticCurveTo(px - w * .3, y + h * .58, px, y + h * .56); g.quadraticCurveTo(px + w * .3, y + h * .58, px + w * .32, y + h); g.fill(); }
  } else {
    const c = o.dark || [30, 40, 50];
    g.fillStyle = gs_grad(g, 0, y, 0, y + h, [[0, mix(c, o.sky || [120, 140, 150], .35)], [1, mul(c, .6)]]); g.fillRect(x, y, w, h);
    bristle(g, x + w * .3, y + h * .3, -.9, h * .5, w * .16, o.sky || [140, 160, 170], .16, r);
  }
  g.strokeStyle = css(o.frame || [20, 18, 20], .9); g.lineWidth = Math.max(1, w * .07);
  g.strokeRect(x, y, w, h);
  if (o.mull !== false && w > 7) { g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.moveTo(x, y + h * .38); g.lineTo(x + w, y + h * .38); g.stroke(); }
  if (o.sill !== false) { g.fillStyle = css(o.sillc || [120, 118, 110], .8); g.fillRect(x - w * .1, y + h, w * 1.2, Math.max(1.5, h * .06)); }
}
/* ground plane strokes in perspective: horizontal strokes shrinking towards horizon */
function gs_ground(g, r, x, y0, w, y1, stops, o) {
  o = o || {}; g.fillStyle = gs_grad(g, 0, y0, 0, y1, stops); g.fillRect(x, y0, w, y1 - y0);
  const n = o.n || Math.round(w * (y1 - y0) / 500);
  for (let i = 0; i < n; i++) {
    const t = Math.pow(r(), 1.3), yy = y0 + t * (y1 - y0), s = .25 + t * 1.2;
    bristle(g, x + r() * w, yy, r.g() * .05, r.r(30, 110) * s, r.r(3, 9) * s, jit(gs_stop(stops, t + r.g() * .05), r, .1), r.r(.15, .4), r);
  }
  if (o.cobble) {   // cobble joints
    g.strokeStyle = css(o.cobble, .35);
    for (let row = 0; row < 40; row++) { const t = Math.pow(row / 40, 1.6), yy = y0 + t * (y1 - y0), s = .2 + t * 1.3; if (yy > y1) break; g.lineWidth = .8 + s; const step = 26 * s + 6; for (let xx = x + (row % 2) * step / 2 + r() * 6; xx < x + w; xx += step * r.r(.8, 1.2)) { g.beginPath(); g.moveTo(xx, yy); g.quadraticCurveTo(xx + step * .5, yy - 3 * s, xx + step * .9, yy + r.g() * s); g.stroke(); } }
  }
}
function gs_smoke(g, t, x, y, col, a, s, seed) {   // animated rising smoke puffs
  for (let i = 0; i < 7; i++) {
    const ph = ((t * .00005 * (1 + (seed % 3) * .2) + i / 7) % 1), yy = y - ph * 150 * s, xx = x + Math.sin(ph * 4 + seed + t * .0003) * 14 * s + ph * 50 * s;
    gs_glow(g, xx, yy, (14 + ph * 50) * s, col, a * Math.sin(ph * 3.14), 'source-over');
  }
}
function gs_motes(g, t, x, y, w, h, n, col, a, seed) {   // drifting dust / embers / snow
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = css(col);
  for (let i = 0; i < n; i++) {
    const s1 = lat(i, 1, seed), s2 = lat(i, 2, seed), s3 = lat(i, 3, seed);
    const xx = x + ((s1 * w + Math.sin(t * .0004 * (.5 + s3) + i) * 30 + t * .006 * (s2 - .5)) % w + w) % w, yy = y + ((s2 * h - t * .01 * (.3 + s3) * (seed & 1 ? -1 : 1)) % h + h) % h;
    g.globalAlpha = a * (.4 + .6 * Math.abs(Math.sin(t * .0012 + i * 1.7))); const rr = .7 + s3 * 1.8;
    g.fillRect(xx - rr, yy - rr, rr * 2, rr * 2);
  }
  g.restore();
}
function gs_rings(g, t, x, y, col, a, speed, maxR, flat) {   // bell sound rings
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 3; k++) { const ph = (t * speed + k / 3) % 1, R = 20 + ph * maxR; g.strokeStyle = css(col, (1 - ph) * (1 - ph) * a); g.lineWidth = 2 + ph * 10; g.beginPath(); g.ellipse(x, y, R, R * (flat || .7), 0, 0, 6.2832); g.stroke(); }
  g.restore();
}

/* ---------------------------------------------------------- painted figures
 * realistic proportions (~7.5 heads). x,y = point between the feet; H = standing height (logical px).
 * o: {pose, view:'front'|'back'|'side', dir:1|-1 (side: facing right=1), L:[lx,ly] towards light, rim, amb,
 *     coat, trousers, shirt, skin, hair, hs:'short'|'long'|'bun'|'cap'|'bald', coatLen (0 none ... 1 knee), scarf, rot}
 */
function gs_pose(name) {
  const P = {
    stand: { head: [0, -7.0], neck: [0, -6.42], shL: [-.98, -6.08], shR: [.98, -6.08], elL: [-1.18, -4.75], elR: [1.18, -4.75], haL: [-1.2, -3.55], haR: [1.2, -3.55], hpL: [-.52, -3.8], hpR: [.52, -3.8], knL: [-.5, -2.0], knR: [.5, -2.0], ftL: [-.55, -.12], ftR: [.55, -.12] },
    pockets: { head: [0, -7.0], neck: [0, -6.42], shL: [-.95, -6.05], shR: [.95, -6.05], elL: [-1.32, -4.85], elR: [1.32, -4.85], haL: [-.86, -3.95], haR: [.86, -3.95], hpL: [-.5, -3.8], hpR: [.5, -3.8], knL: [-.47, -2.0], knR: [.47, -2.0], ftL: [-.5, -.12], ftR: [.5, -.12] },
    sideStand: { head: [.12, -7.0], neck: [.02, -6.42], shL: [-.1, -6.1], shR: [.08, -6.1], elL: [-.1, -4.75], elR: [.25, -4.72], haL: [.0, -3.6], haR: [.42, -3.62], hpL: [-.05, -3.8], hpR: [.05, -3.8], knL: [.0, -2.0], knR: [.12, -2.0], ftL: [-.05, -.12], ftR: [.18, -.12] },
    walk: { head: [.18, -6.95], neck: [.08, -6.4], shL: [-.05, -6.06], shR: [.12, -6.06], elL: [-.55, -4.8], elR: [.6, -4.85], haL: [-.75, -3.75], haR: [1.0, -3.85], hpL: [-.03, -3.75], hpR: [.08, -3.75], knL: [-.5, -2.0], knR: [.65, -2.1], ftL: [-.95, -.15], ftR: [.85, -.12] },
    reach: { head: [.2, -7.0], neck: [.06, -6.42], shL: [-.12, -6.1], shR: [.1, -6.1], elL: [-.05, -4.75], elR: [.85, -5.55], haL: [.15, -3.65], haR: [1.45, -6.25], hpL: [-.05, -3.8], hpR: [.05, -3.8], knL: [.0, -2.0], knR: [.1, -2.0], ftL: [-.05, -.12], ftR: [.2, -.12] },
    sit: { head: [.32, -5.62], neck: [.2, -5.05], shL: [.05, -4.72], shR: [.22, -4.72], elL: [.25, -3.4], elR: [.5, -3.38], haL: [1.25, -3.25], haR: [1.45, -3.3], hpL: [-.05, -2.3], hpR: [.05, -2.3], knL: [1.72, -2.35], knR: [1.8, -2.32], ftL: [1.6, -.12], ftR: [1.78, -.12] },
    sitBow: { head: [.95, -5.2], neck: [.72, -4.82], shL: [.42, -4.55], shR: [.6, -4.55], elL: [.95, -3.3], elR: [1.1, -3.3], haL: [1.6, -2.9], haR: [1.75, -2.95], hpL: [-.05, -2.3], hpR: [.05, -2.3], knL: [1.72, -2.35], knR: [1.8, -2.32], ftL: [1.6, -.12], ftR: [1.78, -.12] },
    sitWrite: { head: [.42, -5.6], neck: [.25, -5.05], shL: [.08, -4.72], shR: [.25, -4.72], elL: [.2, -3.4], elR: [.95, -4.25], haL: [1.1, -2.9], haR: [1.55, -5.2], hpL: [-.05, -2.3], hpR: [.05, -2.3], knL: [1.72, -2.35], knR: [1.8, -2.32], ftL: [1.6, -.12], ftR: [1.78, -.12] },
    sitFront: { head: [0, -5.62], neck: [0, -5.05], shL: [-.95, -4.72], shR: [.95, -4.72], elL: [-1.1, -3.45], elR: [1.1, -3.45], haL: [-.55, -2.65], haR: [.55, -2.65], hpL: [-.55, -2.4], hpR: [.55, -2.4], knL: [-.6, -2.1], knR: [.6, -2.1], ftL: [-.62, -.12], ftR: [.62, -.12] },
    palm: { head: [.26, -6.9], neck: [.06, -6.42], shL: [-.1, -6.1], shR: [.08, -6.1], elL: [-.05, -4.75], elR: [.55, -4.85], haL: [.1, -3.65], haR: [1.0, -5.35], hpL: [-.05, -3.8], hpR: [.05, -3.8], knL: [.0, -2.0], knR: [.12, -2.0], ftL: [-.05, -.12], ftR: [.18, -.12] },
    wipe: { head: [0, -7.0], neck: [0, -6.42], shL: [-.95, -6.08], shR: [.95, -6.08], elL: [-1.2, -4.85], elR: [1.2, -4.85], haL: [-.3, -4.6], haR: [.3, -4.75], hpL: [-.52, -3.8], hpR: [.52, -3.8], knL: [-.5, -2.0], knR: [.5, -2.0], ftL: [-.55, -.12], ftR: [.55, -.12] },
    sitPour: { head: [0, -5.62], neck: [0, -5.05], shL: [-.95, -4.72], shR: [.95, -4.72], elL: [-1.15, -3.5], elR: [1.25, -3.6], haL: [-.5, -3.0], haR: [.8, -3.3], hpL: [-.55, -2.4], hpR: [.55, -2.4], knL: [-.6, -2.1], knR: [.6, -2.1], ftL: [-.62, -.12], ftR: [.62, -.12] },
    lie: null
  };
  return P[name] || P.stand;
}
function gs_capsule(a, b, r1, r2, n) {   // tapered stadium polygon between joints
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, nx = -uy, ny = ux, pts = [];
  n = n || 6;
  for (let i = 0; i <= n; i++) { const t = -1.5708 + i / n * 3.1416, c = Math.cos(t), s = Math.sin(t); pts.push([b[0] + (ux * c + nx * s) * r2, b[1] + (uy * c + ny * s) * r2]); }
  for (let i = 0; i <= n; i++) { const t = 1.5708 + i / n * 3.1416, c = Math.cos(t), s = Math.sin(t); pts.push([a[0] + (ux * c + nx * s) * r1, a[1] + (uy * c + ny * s) * r1]); }
  return pts;
}
function gs_person(g, r, x, y, H, o) {
  o = o || {};
  const T = g.getTransform(), sc = Math.max(.5, Math.hypot(T.a, T.b));
  const u = H / 7.5, view = o.view || 'front', hdir = o.dir || 1, dir = o.pose === 'lie' ? -hdir : hdir, L0 = o.L || [.6, -.8], Ln = Math.hypot(L0[0], L0[1]) || 1, L = [L0[0] / Ln, L0[1] / Ln], rim = C(o.rim || [255, 200, 140]);
  const lie = o.pose === 'lie', seated = /^sit/.test(o.pose || ''), back = view === 'back', side = view === 'side';
  const J = gs_pose(lie ? 'sideStand' : (o.pose || (side ? 'sideStand' : 'stand')));
  const rot = o.rot || 0, cr = Math.cos(rot), sr = Math.sin(rot), tw = o.thin || 1;
  if (lie) { const a = -1.5708 * hdir, c = Math.cos(a), s2_ = Math.sin(a); L[0] = L0[0] / Ln * c - L0[1] / Ln * s2_; L[1] = L0[0] / Ln * s2_ + L0[1] / Ln * c; }
  // local figure canvas
  const pad = 2.2 * u, bw = 4.6 * u + pad, bh = 7.9 * u + pad;
  const ox = bw / 2, oy = bh - pad * .5;
  const F = mk(bw * sc, bh * sc), f = ctx2(F); f.scale(sc, sc);
  const P = (k) => { let px = J[k][0] * (side ? dir : 1), py = J[k][1]; if (!side) px *= tw; const qx = px * cr - py * sr, qy = px * sr + py * cr; return [ox + qx * u, oy + qy * u]; };
  const skin = C(o.skin || '#d4a184'), hair = C(o.hair || '#2a1d18'), coat = C(o.coat || [58, 62, 70]), trs = C(o.trousers || mul(coat, .78)), shirt = C(o.shirt || [200, 196, 186]), shoe = C(o.shoe || [22, 18, 18]), sleeve = C(o.sleeve || coat);
  const fill = (pts, col, ang, ex) => paintPoly(f, pts, col, r, Object.assign({ n: Math.max(8, Math.round(Math.abs(polyArea(pts)) / (u * u * .05))), sw: Math.max(1.2, u * .16), sl: u * .8, ang: ang === undefined ? 1.57 : ang, aj: .2, jv: .1, alt: mix(col, o.alt || rim, .25), edge: false, ink: false }, ex || {}));
  const limb = (a, b, r1, r2, col) => fill(gs_capsule(a, b, r1, r2, 5), col, Math.atan2(b[1] - a[1], b[0] - a[0]), { aj: .1 });
  const nk = P('neck'), hd = P('head'), shL = P('shL'), shR = P('shR'), hpL = P('hpL'), hpR = P('hpR');
  const coatLen = o.coatLen === undefined ? .5 : o.coatLen;
  const arm = (sd) => { const a0 = P('sh' + sd), a = [a0[0], a0[1] + u * .22], e = P('el' + sd), h = P('ha' + sd); limb(a, e, u * .27, u * .22, sleeve); limb(e, h, u * .22, u * .16, sleeve);
    if (o.pose !== 'pockets') { const hc = o.gloves ? C(o.gloves) : skin; const d = [h[0] - e[0], h[1] - e[1]], l = Math.hypot(d[0], d[1]) || 1; fill(ellPts(h[0] + d[0] / l * u * .2, h[1] + d[1] / l * u * .2, u * .14, u * .23, 10, Math.atan2(d[1], d[0]) - 1.57), hc, 1.57, { n: 6, sw: u * .08 }); } };
  const leg = (sd) => { const a = P('hp' + sd), k = P('kn' + sd), ft = P('ft' + sd); limb(a, k, u * .38, u * .27, trs); limb(k, ft, u * .27, u * .18, trs);
    const fd = (side || seated) ? dir : (sd === 'L' ? -.25 : .25), fl = side || seated ? .62 : .3;
    fill([[ft[0] - u * .2 * (side || seated ? dir : 1), ft[1] - u * .16], [ft[0] + u * fl * fd + u * .1 * Math.sign(fd || 1), ft[1] - u * .06], [ft[0] + u * (fl + .06) * fd + u * .1 * Math.sign(fd || 1), ft[1] + u * .12], [ft[0] - u * .22, ft[1] + u * .12]], shoe, 0, { n: 5 }); };
  // ----- body
  const torsoPts = () => {
    const hemY = (sd) => { const hp = P('hp' + sd), kn = P('kn' + sd); return [lerp(hp[0], kn[0], coatLen), lerp(hp[1], kn[1], coatLen) + u * .25]; };
    if (side && !seated && !lie) {
      const b = dir, hr = hemY('R'), hl = hemY('L');
      return [[nk[0] - b * u * .28, nk[1] + u * .02], [nk[0] + b * u * .28, nk[1] + u * .1], [shR[0] + b * u * .45, shR[1] + u * .7], [shR[0] + b * u * .42, shR[1] + u * 1.3], [hpR[0] + b * u * .38, hpR[1] - u * .3], [Math.max(hr[0], hl[0]) * (b > 0 ? 1 : 0) + Math.min(hr[0], hl[0]) * (b > 0 ? 0 : 1) + b * u * .45 * (coatLen > .1 ? 1 : .5), Math.max(hr[1], hl[1])], [hpL[0] - b * u * (coatLen > .1 ? .75 : .45), Math.max(hr[1], hl[1])], [hpL[0] - b * u * .5, hpL[1] - u * .2], [shL[0] - b * u * .5, shL[1] + u * 1.2], [shL[0] - b * u * .45, shL[1] + u * .3]];
    }
    if (seated && side) { const b = dir; return [[nk[0] - b * u * .3, nk[1] + u * .02], [nk[0] + b * u * .28, nk[1] + u * .1], [shR[0] + b * u * .42, shR[1] + u * .75], [shR[0] + b * u * .36, shR[1] + u * 1.4], [hpR[0] + b * u * 1.2, hpR[1] - u * .25], [hpR[0] + b * u * 1.2, hpR[1] + u * .38], [hpL[0] - b * u * .5, hpL[1] + u * .4], [hpL[0] - b * u * .55, hpL[1] - u * .3], [shL[0] - b * u * .5, shL[1] + u * 1.1], [shL[0] - b * u * .42, shL[1] + u * .25]]; }
    const hem = coatLen > .05 ? [hemY('R'), hemY('L')] : [[hpR[0] + u * .1, hpR[1] + u * .35], [hpL[0] - u * .1, hpL[1] + u * .35]];
    const flare = coatLen * u * .35, wx = (hpR[0] - hpL[0]) * .66, wy = lerp(shR[1], hpR[1], .62), mx = (hpR[0] + hpL[0]) / 2;
    return [[nk[0] - u * .24, nk[1] + u * .1], [nk[0] + u * .24, nk[1] + u * .1], [lerp(nk[0], shR[0], .6), shR[1] + u * .02], [shR[0] + u * .14, shR[1] + u * .1], [shR[0] + u * .26, shR[1] + u * .34], [shR[0] + u * .2, shR[1] + u * 1.0], [mx + wx, wy], [hpR[0] + u * .22, hpR[1] - u * .05], [hem[0][0] + flare, hem[0][1]], [(hem[0][0] + hem[1][0]) / 2, hem[0][1] + u * .06], [hem[1][0] - flare, hem[1][1]], [hpL[0] - u * .22, hpL[1] - u * .05], [mx - wx, wy], [shL[0] - u * .2, shL[1] + u * 1.0], [shL[0] - u * .26, shL[1] + u * .34], [shL[0] - u * .14, shL[1] + u * .1], [lerp(nk[0], shL[0], .6), shL[1] + u * .02]];
  };
  const farA = side ? 'L' : (back ? 'R' : 'L'), nearA = side ? 'R' : (back ? 'L' : 'R');
  if (side || seated) { arm('L'); leg('L'); } else { leg('L'); leg('R'); }
  if (side || seated) leg('R');
  if (!side && !seated) { /* arms drawn after torso for front/back */ }
  // neck
  limb([nk[0], nk[1] + u * .25], [hd[0] - (side ? dir * u * .1 : 0), hd[1] + u * .35], u * .17, u * .16, mul(skin, .9));
  const tp = torsoPts();
  fill(tp, coat, 1.57 + rot, { n: Math.round(Math.abs(polyArea(tp)) / (u * u * .03)), sw: u * .2 });
  if (!back) {   // shirt V, lapels, buttons / front seam
    if (!side) { fill([[nk[0] - u * .2, nk[1] + u * .1], [nk[0] + u * .2, nk[1] + u * .1], [nk[0] + u * .02, nk[1] + u * 1.0], [nk[0] - u * .02, nk[1] + u * 1.0]], shirt, 1.57, { n: 8 }); if (o.tie) fill([[nk[0] - u * .06, nk[1] + u * .15], [nk[0] + u * .06, nk[1] + u * .15], [nk[0] + u * .08, nk[1] + u * .95], [nk[0], nk[1] + u * 1.05], [nk[0] - u * .08, nk[1] + u * .95]], o.tie, 1.57, { n: 5 }); f.strokeStyle = css(mul(coat, .45), .8); f.lineWidth = u * .06; f.beginPath(); f.moveTo(nk[0] - u * .22, nk[1] + u * .1); f.lineTo(nk[0] - u * .02, nk[1] + u * 1.05); f.lineTo(nk[0] - u * .02, tp[8][1] - u * .1); f.moveTo(nk[0] + u * .22, nk[1] + u * .1); f.lineTo(nk[0] + u * .02, nk[1] + u * 1.05); f.stroke(); }
    else { f.strokeStyle = css(mul(coat, .45), .7); f.lineWidth = u * .05; f.beginPath(); f.moveTo(nk[0] + dir * u * .25, nk[1] + u * .15); f.lineTo(nk[0] + dir * u * .05, nk[1] + u * .8); f.stroke(); }
  } else { f.strokeStyle = css(mul(coat, .5), .6); f.lineWidth = u * .05; f.beginPath(); f.moveTo(nk[0], nk[1] + u * .3); f.lineTo(nk[0], tp[8][1] - u * .05); f.stroke(); }
  if (o.scarf) fill([[nk[0] - u * .36, nk[1] - u * .02], [nk[0] + u * .36, nk[1] - u * .02], [nk[0] + u * .34, nk[1] + u * .32], [nk[0] - u * .34, nk[1] + u * .32]], C(o.scarf), 0, { n: 10 });
  if (o.collar) fill([[nk[0] - u * .42, nk[1] - u * .25], [nk[0] + u * .42, nk[1] - u * .25], [nk[0] + u * .48, nk[1] + u * .3], [nk[0] - u * .48, nk[1] + u * .3]], mul(coat, 1.08), 1.57, { n: 10 });
  if (side || seated) arm('R'); else { arm(farA); arm(nearA); }
  if (o.satchel) { const sx = hpR[0] + u * .1, sy = hpR[1] - u * .3; fill([[sx, sy], [sx + u * .9, sy], [sx + u * .95, sy + u * 1.0], [sx - u * .05, sy + u * 1.0]], C(o.satchel), 0, { n: 10 }); f.strokeStyle = css(mul(C(o.satchel), .5)); f.lineWidth = u * .08; f.beginPath(); f.moveTo(sx + u * .1, sy); f.lineTo(shL[0], shL[1] + u * .1); f.stroke(); }
  // ----- head
  const hr = u * .43, hv = u * .55, hx = hd[0], hy = hd[1];
  const hpts = side ? [[hx - dir * hr * .95, hy - hv * .15], [hx - dir * hr * .7, hy - hv * .85], [hx + dir * hr * .2, hy - hv * 1.0], [hx + dir * hr * .85, hy - hv * .55], [hx + dir * hr * 1.0, hy - hv * .1], [hx + dir * hr * 1.18, hy + hv * .18], [hx + dir * hr * .98, hy + hv * .3], [hx + dir * hr * 1.0, hy + hv * .5], [hx + dir * hr * .6, hy + hv * .92], [hx - dir * hr * .25, hy + hv * .78], [hx - dir * hr * .85, hy + hv * .35]]
    : [[hx, hy - hv], [hx + hr * .78, hy - hv * .72], [hx + hr, hy - hv * .1], [hx + hr * .9, hy + hv * .4], [hx + hr * .5, hy + hv * .85], [hx, hy + hv], [hx - hr * .5, hy + hv * .85], [hx - hr * .9, hy + hv * .4], [hx - hr, hy - hv * .1], [hx - hr * .78, hy - hv * .72]];
  if (back) hpts.forEach(p => p);
  fill(hpts, skin, 1.57, { n: 26, sw: u * .12, sl: u * .4 });
  const sd = L[0] >= 0 ? 1 : -1;
  if (!back && !side) {
    f.fillStyle = css(mul(skin, .5), .5); f.beginPath(); f.ellipse(hx - sd * hr * .3, hy + hv * .05, hr * .7, hv * .95, 0, 0, 7); f.save(); f.clip(); f.beginPath(); f.rect(hx - sd * hr * 2 - (sd > 0 ? 0 : 0), hy - hv * 2, hr * 2, hv * 4); f.restore();
    f.save(); pathPoly(f, hpts); f.clip(); f.fillStyle = css(mul(skin, .45), .45); f.fillRect(sd > 0 ? hx - hr * 1.2 : hx + hr * .15, hy - hv * 1.2, hr * 1.05, hv * 2.4); f.restore();
    f.fillStyle = css(mul(skin, .3), .75); for (const ex of [-1, 1]) { f.beginPath(); f.ellipse(hx + ex * hr * .38, hy - hv * .05, hr * .16, hv * .075, 0, 0, 7); f.fill(); }
    f.fillStyle = css(mul(skin, .55), .6); f.fillRect(hx - hr * .55, hy - hv * .22, hr * 1.1, hv * .06);
    f.strokeStyle = css(mul(skin, .35), .65); f.lineWidth = Math.max(.6, u * .045); f.beginPath(); f.moveTo(hx + sd * hr * .04, hy); f.lineTo(hx - sd * hr * .1, hy + hv * .34); f.lineTo(hx + sd * hr * .1, hy + hv * .37); f.stroke();
    f.strokeStyle = css(mul(skin, .4), .7); f.beginPath(); f.moveTo(hx - hr * .24, hy + hv * .58); f.quadraticCurveTo(hx, hy + hv * (o.smile ? .7 : .6), hx + hr * .24, hy + hv * .58); f.stroke();
    if (o.glasses) { f.strokeStyle = css([20, 18, 18], .9); f.lineWidth = Math.max(.6, u * .04); for (const ex of [-1, 1]) { f.beginPath(); f.ellipse(hx + ex * hr * .4, hy - hv * .05, hr * .27, hv * .16, 0, 0, 7); f.stroke(); } f.fillStyle = css([255, 245, 220], .35); f.beginPath(); f.ellipse(hx + sd * hr * .4, hy - hv * .07, hr * .2, hv * .1, 0, 0, 7); f.fill(); }
  } else if (side) {
    f.fillStyle = css(mul(skin, .3), .75); f.beginPath(); f.ellipse(hx + dir * hr * .55, hy - hv * .04, hr * .13, hv * .06, 0, 0, 7); f.fill();
    f.fillStyle = css(mul(skin, .7), .8); f.beginPath(); f.ellipse(hx - dir * hr * .1, hy + hv * .05, hr * .16, hv * .2, 0, 0, 7); f.fill();
    if (o.glasses) { f.strokeStyle = css([20, 18, 18], .9); f.lineWidth = Math.max(.6, u * .04); f.beginPath(); f.ellipse(hx + dir * hr * .62, hy - hv * .04, hr * .2, hv * .15, 0, 0, 7); f.moveTo(hx + dir * hr * .42, hy - hv * .06); f.lineTo(hx - dir * hr * .2, hy - hv * .1); f.stroke(); }
  }
  const hs = o.hs || 'short';
  if (hs !== 'bald') {
    let hp;
    if (back) hp = hs === 'long' ? [[hx - hr * 1.06, hy - hv * .1], [hx - hr * .75, hy - hv * 1.06], [hx + hr * .75, hy - hv * 1.06], [hx + hr * 1.06, hy - hv * .1], [hx + hr * 1.12, hy + hv * 1.7], [hx, hy + hv * 1.8], [hx - hr * 1.12, hy + hv * 1.7]] : [[hx - hr * 1.04, hy], [hx - hr * .8, hy - hv * 1.05], [hx, hy - hv * 1.12], [hx + hr * .8, hy - hv * 1.05], [hx + hr * 1.04, hy], [hx + hr * .88, hy + hv * .6], [hx, hy + hv * .72], [hx - hr * .88, hy + hv * .6]];
    else if (side) hp = hs === 'long' ? [[hx + dir * hr * .7, hy - hv * .7], [hx + dir * hr * .1, hy - hv * 1.1], [hx - dir * hr * .85, hy - hv * .85], [hx - dir * hr * 1.12, hy + hv * .2], [hx - dir * hr * 1.0, hy + hv * 1.6], [hx - dir * hr * .15, hy + hv * 1.45], [hx - dir * hr * .1, hy + hv * .1], [hx + dir * hr * .5, hy - hv * .38]] : [[hx + dir * hr * .82, hy - hv * .6], [hx + dir * hr * .1, hy - hv * 1.12], [hx - dir * hr * .85, hy - hv * .82], [hx - dir * hr * 1.06, hy + hv * .05], [hx - dir * hr * .85, hy + hv * .55], [hx - dir * hr * .35, hy + hv * .28], [hx - dir * hr * .15, hy - hv * .28], [hx + dir * hr * .6, hy - hv * .38]];
    else hp = hs === 'long' ? [[hx - hr * 1.1, hy + hv * 1.3], [hx - hr * 1.1, hy - hv * .5], [hx - hr * .55, hy - hv * 1.1], [hx + hr * .55, hy - hv * 1.1], [hx + hr * 1.1, hy - hv * .5], [hx + hr * 1.1, hy + hv * 1.3], [hx + hr * .82, hy + hv * 1.25], [hx + hr * .8, hy - hv * .3], [hx, hy - hv * .6], [hx - hr * .8, hy - hv * .3], [hx - hr * .82, hy + hv * 1.25]] : [[hx - hr * 1.04, hy - hv * .02], [hx - hr * .9, hy - hv * .8], [hx - hr * .2, hy - hv * 1.12], [hx + hr * .62, hy - hv * 1.0], [hx + hr * 1.04, hy - hv * .42], [hx + hr * 1.0, hy + hv * .02], [hx + hr * .84, hy - hv * .4], [hx + hr * .1, hy - hv * .6], [hx - hr * .72, hy - hv * .42], [hx - hr * .94, hy + hv * .08]];
    if (hs === 'grey' || hs === 'bun' || hs === 'short' || hs === 'long' || hs === 'cap') fill(hp, hair, 1.4, { n: 30, sw: u * .09, sl: u * .5, aj: .5, alt: mix(hair, [255, 255, 255], .15) });
    if (hs === 'bun') fill(ellPts(hx - (side ? dir * hr * .85 : 0), hy - hv * (back ? .45 : side ? .55 : 1.0), hr * .4, hv * .32, 12), hair, 0, { n: 10 });
    if (hs === 'cap') fill([[hx - hr * 1.08, hy - hv * .3], [hx - hr * .9, hy - hv * 1.08], [hx + hr * .9, hy - hv * 1.08], [hx + hr * 1.08, hy - hv * .3], [hx + (side ? dir * hr * 1.7 : hr * 1.2), hy - hv * .22], [hx - (side ? dir * hr * .9 : hr * 1.2), hy - hv * .22]], C(o.capc || coat), 0, { n: 12 });
  }
  if (o.hat) { const hc = C(o.hat); fill([[hx - hr * 1.55, hy - hv * .45], [hx + hr * 1.55, hy - hv * .45], [hx + hr * 1.4, hy - hv * .62], [hx - hr * 1.4, hy - hv * .62]], hc, 0, { n: 10 }); fill([[hx - hr * .95, hy - hv * .55], [hx + hr * .95, hy - hv * .55], [hx + hr * .85, hy - hv * 1.35], [hx - hr * .85, hy - hv * 1.35]], hc, 0, { n: 12 }); }
  // ----- unify: form shadow (away from light) + ambient falloff to the feet + rim light on the lit contour
  f.save(); f.setTransform(1, 0, 0, 1, 0, 0); f.globalCompositeOperation = 'source-atop';
  const W2 = F.width, H2 = F.height, amb = C(o.ambc || [16, 20, 36]);
  const lg = f.createLinearGradient(W2 / 2 + L[0] * W2 * .25, H2 / 2 + L[1] * H2 * .12, W2 / 2 - L[0] * W2 * .25, H2 / 2 - L[1] * H2 * .12);
  lg.addColorStop(0, css(amb, 0)); lg.addColorStop(.55, css(amb, (o.shade || .45) * .5)); lg.addColorStop(1, css(amb, o.shade || .45)); f.fillStyle = lg; f.fillRect(0, 0, W2, H2);
  if (!lie && !seated) { const vg = f.createLinearGradient(0, oy * sc - H * sc * .5, 0, oy * sc); vg.addColorStop(0, css(amb, 0)); vg.addColorStop(1, css(amb, o.footDark === undefined ? .35 : o.footDark)); f.fillStyle = vg; f.fillRect(0, 0, W2, H2); }
  if (o.tint) { f.fillStyle = css(C(o.tint[0]), o.tint[1]); f.fillRect(0, 0, W2, H2); }
  f.restore();
  const rw = (o.rimW || .09) * u * sc;
  if (rw > .3) {
    const R = mk(F.width, F.height), rg = ctx2(R);
    rg.drawImage(F, 0, 0); rg.globalCompositeOperation = 'source-in'; rg.fillStyle = css(rim); rg.fillRect(0, 0, R.width, R.height);
    rg.globalCompositeOperation = 'destination-out'; rg.drawImage(F, -L[0] * rw, -L[1] * rw);
    rg.globalAlpha = .6; rg.drawImage(F, -L[0] * rw * .45, -L[1] * rw * .45);
    // break the rim up like a dry brush
    rg.globalAlpha = 1; for (let i = 0; i < 40; i++) { rg.fillStyle = 'rgba(0,0,0,' + r.r(.3, .9) + ')'; rg.beginPath(); rg.ellipse(r() * R.width, r() * R.height, rw * r.r(1, 4), rw * r.r(2, 8), r() * 3, 0, 7); rg.fill(); }
    f.save(); f.setTransform(1, 0, 0, 1, 0, 0); f.globalCompositeOperation = 'source-atop'; f.globalAlpha = o.rimA === undefined ? .8 : o.rimA;
    if ('filter' in f) f.filter = 'blur(' + Math.max(.5, rw * .25).toFixed(1) + 'px)'; f.drawImage(R, 0, 0); f.filter = 'none';
    f.globalCompositeOperation = 'lighter'; f.globalAlpha = (o.rimA === undefined ? .8 : o.rimA) * .35; f.drawImage(R, 0, 0); f.restore();
  }
  // ----- place it
  g.save();
  if (o.shadow !== false && !lie) { g.globalAlpha = o.shadowA || .45; g.fillStyle = '#06050a'; g.beginPath(); g.ellipse(x + (seated ? u * .9 * dir : 0) + (o.shX || 0), y, u * (seated ? 1.9 : 1.25), u * .3, 0, 0, 6.2832); g.fill(); g.globalAlpha = 1; }
  if (o.alpha) g.globalAlpha = o.alpha;
  if (lie) { g.translate(x, y - u * .42); g.rotate(1.5708 * hdir); g.drawImage(F, -ox, -oy, bw, bh); }
  else g.drawImage(F, x - ox, y - oy, bw, bh);
  g.restore();
  const toW = lie ? (p) => { const a = 1.5708 * hdir, dx = p[0] - ox, dy = p[1] - oy; return [x + dx * Math.cos(a) - dy * Math.sin(a), y - u * .42 + dx * Math.sin(a) + dy * Math.cos(a)]; } : (p) => [x - ox + p[0], y - oy + p[1]];
  return { head: toW(hd), hands: [toW(P('haL')), toW(P('haR'))], u: u, neck: toW(nk) };
}
/* ---------------------------------------------------------- reusable set pieces */
/* School No. 9: facade + bell tower. returns anchor points */
function gs_school(g, r, cx, gy, s, o) {
  o = o || {}; const L = o.L || [-.4, -.9], rim = o.rim || [255, 160, 80];
  const wall = o.wall || [70, 82, 84], roof = o.roof || [34, 36, 42], tw = 150 * s, fw = (o.fw || 1000) * s, fh = 250 * s, th = 330 * s;
  const tx = cx, fx0 = cx - fw * (o.leftFrac || .58), fx1 = fx0 + fw;
  const top = gy - fh;
  // wings
  gs_rect(g, r, fx0, top, fw, fh, wall, L, { rim: rim, n: Math.round(fw * fh / 260), sw: 8 * s, sl: 60 * s, ang: 1.57, aj: .12, ew: 2.2 * s, ink: true, inkw: 1.8 * s, la: .35, sa: .55, litc: mix(wall, rim, .35), shc: mul(wall, .55) });
  // stone courses + plinth
  for (let i = 0; i < 4; i++) { const yy = top + fh * (.24 + i * .25); g.fillStyle = css(mul(wall, .7), .45); g.fillRect(fx0, yy, fw, 3 * s); }
  gs_rect(g, r, fx0, gy - 26 * s, fw, 26 * s, mul(wall, .7), L, { n: 40, sw: 5 * s, ang: 0, ink: true, inkw: 1.4 * s, rim: rim });
  // cornice + roof
  gs_poly(g, r, [[fx0 - 14 * s, top + 4 * s], [fx1 + 14 * s, top + 4 * s], [fx1 + 6 * s, top - 14 * s], [fx0 - 6 * s, top - 14 * s]], mul(wall, .8), L, { rim: rim, n: 40, sw: 4 * s, ang: 0, ink: true, inkw: 1.6 * s, ew: 2.5 * s });
  gs_poly(g, r, [[fx0, top - 14 * s], [fx1, top - 14 * s], [fx1 - 40 * s, top - 62 * s], [fx0 + 40 * s, top - 62 * s]], roof, L, { rim: rim, n: 80, sw: 6 * s, ang: -.1, ink: true, inkw: 1.6 * s, ew: 2 * s });
  // chimneys
  for (const f of [.12, .36, .86]) { const x = fx0 + fw * f; gs_rect(g, r, x, top - 98 * s, 24 * s, 50 * s, [62, 46, 44], L, { rim: rim, n: 14, sw: 3 * s, ang: 1.57, ink: true, inkw: 1.2 * s }); }
  // windows
  const wins = [], cols = Math.floor(fw / (62 * s)), rows = 3, ww = 30 * s, wh = 46 * s;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const wx = fx0 + (i + .5) * fw / cols - ww / 2, wy = top + 24 * s + j * 70 * s;
    if (Math.abs(wx + ww / 2 - tx) < tw * .62) continue;
    const lit = lat(i, j, o.seed || 9) < (o.litP === undefined ? .45 : o.litP);
    gs_window(g, r, wx, wy, ww, wh, lit, { col: o.winc || [255, 178, 90], who: lit && lat(i, j, 4) < .25, dark: o.dark || [24, 34, 40], sky: o.sky || [100, 130, 130], frame: [16, 14, 16], sillc: mix(wall, [255, 255, 255], .2) });
    if (lit) wins.push({ x: wx, y: wy, w: ww, h: wh, ph: lat(i, j, 21) * 6.28, fl: lat(i, j, 22) });
  }
  // entrance: portico with lit doors
  const dw = 70 * s, dh = 96 * s, dx = tx - dw / 2;
  gs_window(g, r, dx, gy - 26 * s - dh, dw, dh, o.doorLit !== false, { col: [255, 170, 80], mull: true, sill: false, dark: [20, 20, 24] });
  for (const sx of [-1, 1]) gs_rect(g, r, tx + sx * (dw / 2 + 14 * s) - 7 * s, gy - 26 * s - dh - 14 * s, 14 * s, dh + 14 * s, mul(wall, 1.1), L, { rim: rim, n: 12, sw: 3 * s, ang: 1.57, ink: true, inkw: 1.2 * s });
  // steps
  for (let i = 0; i < 3; i++) gs_rect(g, r, dx - 30 * s - i * 14 * s, gy - 26 * s + i * 9 * s, dw + 60 * s + i * 28 * s, 9 * s, mix(wall, [150, 140, 120], .3), L, { n: 12, sw: 3 * s, ang: 0, ink: true, inkw: 1, rim: rim });
  // tower shaft
  const tt = top - th;
  gs_rect(g, r, tx - tw / 2, tt, tw, th + 4 * s, mul(wall, 1.04), L, { rim: rim, n: 160, sw: 7 * s, sl: 50 * s, ang: 1.57, aj: .1, ew: 2.6 * s, ink: true, inkw: 2 * s, la: .4, sa: .65, litc: mix(wall, rim, .45) });
  for (let i = 0; i < 6; i++) { g.fillStyle = css(mul(wall, .7), .35); g.fillRect(tx - tw / 2, tt + 40 * s + i * 48 * s, tw, 2.4 * s); }
  // slit windows on tower
  for (let i = 0; i < 2; i++) gs_window(g, r, tx - 8 * s, top - 90 * s - i * 70 * s, 16 * s, 34 * s, i === 0 && (o.litP || 0) > .2, { col: [255, 170, 80], mull: false, sill: false, dark: [18, 22, 26] });
  // clock
  const clY = tt + 150 * s;
  gs_ell(g, r, tx, clY, 34 * s, 34 * s, [226, 214, 182], L, { rim: [255, 240, 210], n: 30, sw: 4 * s, ink: true, inkw: 2.4 * s, shc: [140, 130, 110] });
  g.strokeStyle = css([20, 16, 18], .9); g.lineWidth = 3 * s; g.lineCap = 'round'; g.beginPath(); g.moveTo(tx, clY); g.lineTo(tx + 18 * s, clY + 8 * s); g.moveTo(tx, clY); g.lineTo(tx - 2 * s, clY - 25 * s); g.stroke();
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; g.fillStyle = css([30, 26, 26]); g.fillRect(tx + Math.cos(a) * 27 * s - 1.5 * s, clY + Math.sin(a) * 27 * s - 1.5 * s, 3 * s, 3 * s); }
  // belfry: arched opening with the bell
  const by0 = tt + 22 * s, bw = 92 * s, bh = 92 * s;
  g.fillStyle = css(o.belfry || [18, 16, 20]); g.beginPath(); g.moveTo(tx - bw / 2, by0 + bh); g.lineTo(tx - bw / 2, by0 + bw / 2); g.arc(tx, by0 + bw / 2, bw / 2, Math.PI, 0); g.lineTo(tx + bw / 2, by0 + bh); g.closePath(); g.fill();
  if (o.belfryGlow) { g.save(); g.clip(); gs_glow(g, tx, by0 + bh * .55, bw, o.belfryGlow, .55); g.restore(); }
  const bellY = by0 + 30 * s, bc = o.bell || [176, 130, 60];
  gs_poly(g, r, [[tx - 9 * s, bellY - 8 * s], [tx + 9 * s, bellY - 8 * s], [tx + 16 * s, bellY + 10 * s], [tx + 20 * s, bellY + 34 * s], [tx + 30 * s, bellY + 44 * s], [tx - 30 * s, bellY + 44 * s], [tx - 20 * s, bellY + 34 * s], [tx - 16 * s, bellY + 10 * s]], bc, [L[0], L[1]], { rim: [255, 220, 150], n: 40, sw: 3 * s, ang: 1.57, ink: true, inkw: 1.6 * s, ew: 2.6 * s, litc: mix(bc, [255, 220, 150], .5) });
  g.strokeStyle = css([20, 16, 16]); g.lineWidth = 4 * s; g.beginPath(); g.moveTo(tx - bw / 2, bellY - 10 * s); g.lineTo(tx + bw / 2, bellY - 10 * s); g.stroke();
  // balustrade + cornice
  gs_rect(g, r, tx - tw / 2 - 12 * s, by0 + bh, tw + 24 * s, 12 * s, mul(wall, .85), L, { rim: rim, n: 20, sw: 3 * s, ang: 0, ink: true, inkw: 1.4 * s });
  gs_rect(g, r, tx - tw / 2 - 14 * s, tt - 10 * s, tw + 28 * s, 14 * s, mul(wall, .85), L, { rim: rim, n: 20, sw: 3 * s, ang: 0, ink: true, inkw: 1.4 * s, ew: 2.4 * s });
  // spire
  gs_poly(g, r, [[tx - tw / 2 - 10 * s, tt - 10 * s], [tx + tw / 2 + 10 * s, tt - 10 * s], [tx + 4 * s, tt - 150 * s], [tx - 4 * s, tt - 150 * s]], roof, L, { rim: rim, n: 80, sw: 5 * s, ang: -1.2, ink: true, inkw: 1.8 * s, ew: 2.6 * s });
  g.strokeStyle = css([20, 18, 18]); g.lineWidth = 2.5 * s; g.beginPath(); g.moveTo(tx, tt - 150 * s); g.lineTo(tx, tt - 196 * s); g.moveTo(tx - 16 * s, tt - 182 * s); g.lineTo(tx + 16 * s, tt - 182 * s); g.stroke();
  // loudspeaker clusters on the tower corners
  const spk = [];
  if (o.horns !== false) for (const sx of [-1, 1]) { const hx = tx + sx * (tw / 2 + 4 * s), hy = by0 + bh + 40 * s; gs_horn(g, r, hx, hy, 1.15 * s, sx > 0 ? -.25 : Math.PI + .25, L, o.hornc); gs_horn(g, r, hx, hy + 44 * s, .95 * s, sx > 0 ? .2 : Math.PI - .2, L, o.hornc); spk.push([hx + sx * 36 * s, hy]); }
  // flag
  if (o.flag !== false) { const fxp = fx0 + fw * .2; g.strokeStyle = css([20, 18, 18]); g.lineWidth = 2.5 * s; g.beginPath(); g.moveTo(fxp, top - 62 * s); g.lineTo(fxp, top - 170 * s); g.stroke(); }
  return { tx: tx, bellX: tx, bellY: bellY + 20 * s, top: top, tt: tt, fx0: fx0, fx1: fx1, wins: wins, spk: spk, clY: clY, flag: [fx0 + fw * .2, top - 168 * s], s: s, spire: tt - 196 * s };
}
function gs_flag(g, t, x, y, s, col) {   // animated flag on a pole top (pole drawn in bake)
  g.save(); g.fillStyle = css(col || [150, 30, 32]); g.beginPath(); g.moveTo(x, y);
  for (let i = 0; i <= 8; i++) { const u = i / 8; g.lineTo(x + u * 64 * s, y + Math.sin(t * .004 - u * 4) * 5 * s * u); }
  for (let i = 8; i >= 0; i--) { const u = i / 8; g.lineTo(x + u * 64 * s, y + 38 * s + Math.sin(t * .004 - u * 4 + .6) * 5 * s * u); }
  g.closePath(); g.fill(); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x, y + 24 * s, 64 * s, 4 * s); g.restore();
}
/* apartment block silhouette with windows (lit list returned) */
function gs_block(g, r, x, gy, w, h, col, L, o) {
  o = o || {}; const lits = [];
  gs_rect(g, r, x, gy - h, w, h + 4, col, L, { rim: o.rim || [255, 170, 100], n: Math.round(w * h / (o.far ? 600 : 300)), sw: o.far ? 5 : 7, sl: 40, ang: 1.57, aj: .1, ink: !o.far, inkw: 1.6, ew: o.far ? 1 : 2, la: .3, sa: .5, edge: !o.far || !!o.edge });
  if (o.roof !== false) gs_rect(g, r, x - 3, gy - h - 6, w + 6, 8, mul(col, .7), L, { n: 8, sw: 2, ang: 0, ink: false, edge: false });
  const ww = o.ww || 14, wh = o.wh || 20, gx = o.gx || 12, gyy = o.gyy || 16, nx = Math.max(1, Math.floor((w - 10) / (ww + gx))), ny = Math.max(1, Math.floor((h - 20) / (wh + gyy)));
  const ox = x + (w - (nx * (ww + gx) - gx)) / 2;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const wx = ox + i * (ww + gx), wy = gy - h + 14 + j * (wh + gyy), lit = lat(i + Math.round(x), j, o.seed || 1) < (o.lit === undefined ? .4 : o.lit);
    if (o.far) { g.fillStyle = css(lit ? (o.col || [255, 190, 110]) : (o.dark || mul(col, .55)), lit ? .9 : .8); g.fillRect(wx, wy, ww, wh); }
    else gs_window(g, r, wx, wy, ww, wh, lit, { col: o.col, dark: o.dark || mul(col, .45), sky: o.sky || mix(col, [160, 170, 180], .4), who: lit && o.who && lat(i, j, 7) < o.who, mull: ww > 10, sillc: mul(col, 1.3) });
    if (lit) lits.push({ x: wx, y: wy, w: ww, h: wh, ph: lat(i, j, x | 0) * 6.28, fl: lat(j, i, 5) });
    else if (o.all) lits.push({ x: wx, y: wy, w: ww, h: wh, ph: lat(i, j, x | 0) * 6.28, fl: lat(j, i, 5), off: true });
  }
  if (o.chimney) { const cx = x + w * r.r(.2, .8); gs_rect(g, r, cx, gy - h - 34, 12, 30, mul(col, .8), L, { n: 6, sw: 2, ang: 1.57, ink: !o.far }); lits.chim = [cx + 6, gy - h - 36]; }
  return lits;
}
function gs_winFlicker(g, t, wins, col, a) {   // flickering / breathing glow over lit windows
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const w of wins) { if (w.off) continue; const f = .5 + .5 * Math.sin(t * .0011 * (1 + w.fl) + w.ph), b = w.fl > .85 ? (Math.sin(t * .021 + w.ph) > .6 ? .2 : 1) : 1; g.globalAlpha = a * f * b; g.drawImage(glowSprite(col, 64), w.x - w.w * .8, w.y - w.h * .5, w.w * 2.6, w.h * 2); }
  g.restore();
}
function gs_winDark(g, t, wins, rate) {   // some lit windows go dark briefly (TV flicker / someone passing)
  for (const w of wins) { if (w.fl < (rate || .9)) continue; const v = Math.sin(t * .0007 * (1 + w.fl * 3) + w.ph * 3); if (v > .55) { g.fillStyle = css([14, 14, 20], clamp((v - .55) * 4, 0, .82)); g.fillRect(w.x + 1, w.y + 1, w.w - 2, w.h - 2); } }
}

/* ======================================================== TITLE
 * School No. 9 at dusk: the Bell tower, loudspeakers, crows, a lone student. UI sits on the left.
 */
GS.title = function (S, r) {
  const W = S.W, H = S.H, port = S.port;
  const y0 = port ? (H - 720) * .42 : (H - 720) * .5;          // where the 720-tall "stage" sits
  const gy = y0 + (port ? 600 : 575);                       // school ground line
  const tx = port ? W * .6 : Math.max(W * .69, W - 430);   // tower x
  const s = port ? .74 : .6;
  const Ls = [-.45, -.89];                                   // light from behind-left (sunset)
  const sunX = port ? W * .28 : tx - 420, sunY = gy - 30;
  // ---- sky (opaque, slowest)
  const g = S.layer(.15);
  const sky = [[0, [12, 22, 34]], [.3, [26, 54, 66]], [.55, [62, 98, 96]], [.74, [168, 128, 90]], [.88, [232, 132, 62]], [1, [250, 176, 92]]];
  gs_wash(g, r, -S.M, -S.M, W + 2 * S.M, gy - y0 + y0 + S.M + 20, sky.map(s2 => [s2[0], s2[1]]), { n: 900, sl: [80, 320], sw: [8, 26], aj: .05 });
  gs_glow(g, sunX, sunY, 520, [255, 140, 60], .45); gs_glow(g, sunX, sunY, 180, [255, 200, 120], .45);
  gs_haze(g, -S.M, gy - 200, W + 2 * S.M, gy + 10, [255, 150, 70], 0, .5);
  // high thin cirrus baked (static); moving clouds in their own layer
  for (let i = 0; i < 10; i++) { const cx = r.r(-50, W + 50), cy = y0 + r.r(10, 180) - (port ? 260 : 0) * r(); gs_cloud(g, r, cx, cy, r.r(160, 340), r.r(10, 24), [30, 50, 62], [226, 140, 90], [-.6, .8], { n: 70, a: .55, ang: -.04 }); }
  g.fillStyle = gs_grad(g, 0, gy, 0, H + S.M, [[0, [40, 40, 44]], [1, [10, 10, 14]]]); g.fillRect(-S.M, gy, W + 2 * S.M, H - gy + S.M * 2);
  // ---- drifting cloud banks
  const gc = S.layer(.3, { y0: -S.M, y1: gy - 60, drift: [70, 260000] });
  for (let i = 0; i < 9; i++) { const cx = r.r(-120, W + 120), cy = y0 + r.r(70, 330) - (port ? r() * (y0 + 100) : 0), rx = r.r(160, 330); gs_cloud(gc, r, cx, cy, rx, r.r(28, 54), mix([26, 38, 52], [48, 50, 64], r()), mix([246, 140, 70], [255, 196, 120], r()), [-.5, .85], { n: Math.round(rx * 1.1), p: 6 }); }
  // ---- far city (haze-blue silhouettes, chimneys, a gasholder)
  const gf = S.layer(.45, { y0: gy - 330, y1: gy + 40 });
  const farWins = [];
  for (let x = -S.M - 20; x < W + S.M; x += r.r(50, 110)) { const h = r.r(60, 200), w = r.r(48, 100); farWins.push(...gs_block(gf, r, x, gy - 10, w, h, mix([52, 66, 76], [96, 84, 84], r() * .4), Ls, { far: true, lit: .22, ww: 5, wh: 7, gx: 7, gyy: 9, col: [255, 196, 120], dark: [44, 58, 68], seed: x | 0 })); }
  const chims = []; for (let i = 0; i < 4; i++) { const x = r.r(0, W), hh = r.r(120, 220); gs_rect(gf, r, x, gy - 10 - hh, 14, hh, [44, 52, 60], Ls, { n: 20, sw: 3, ang: 1.57, ink: false, edge: false }); chims.push([x + 7, gy - 12 - hh]); }
  gs_haze(gf, -S.M, gy - 160, W + 2 * S.M, gy + 40, [236, 150, 90], 0, .55);
  // ---- the school
  const gm = S.layer(.7, { y0: gy - 620 * s - 40, y1: gy + 60 });
  const sch = gs_school(gm, r, tx, gy, s, { L: Ls, rim: [255, 150, 70], wall: [70, 84, 86], litP: .48, seed: 7, belfryGlow: [255, 170, 80], sky: [120, 120, 110], winc: [255, 176, 86], fw: port ? 820 : 1080 });
  gs_haze(gm, -S.M, gy - 40, W + 2 * S.M, gy + 60, [30, 32, 38], 0, .9);
  // ---- foreground: plaza, lamp, poles & wires, the student
  const gfg = S.layer(1.05, { y0: gy - 470, y1: H + S.M });
  gs_ground(gfg, r, -S.M, gy + 2, W + 2 * S.M, H + S.M, [[0, [70, 66, 62]], [.25, [52, 50, 52]], [1, [16, 16, 20]]], { cobble: [12, 12, 16], n: 1100 });
  // wet sheen reflecting the sky glow + windows
  gs_eglow(gfg, sunX + 200, gy + 50, 520, 40, [255, 150, 70], .25);
  for (const w of sch.wins) if (lat(w.x | 0, 3, 1) < .5) { gfg.save(); gfg.globalAlpha = .25; gfg.fillStyle = css([255, 170, 90]); gfg.fillRect(w.x + 4, gy + 8 + (gy - w.y) * .12, w.w - 8, 3 + (gy - w.y) * .05); gfg.restore(); }
  const lampX = port ? W * .12 : W * .4, lampY = port ? gy + (H - gy) * .45 : H - 120;
  const poleX = port ? W * .9 : Math.min(W - 60, tx + 430), poleY = H - 40;
  gs_pole(gfg, r, poleX, poleY, port ? 560 : 470, Ls);
  gs_horn(gfg, r, poleX - 10, poleY - (port ? 560 : 470) + 50, 1.3, Math.PI + .35, Ls);
  gs_horn(gfg, r, poleX + 10, poleY - (port ? 560 : 470) + 56, 1.3, -.3, Ls);
  const wireTop = [poleX - 28, poleY - (port ? 560 : 470) + 14];
  const wA = [sch.tx + 75 * s, sch.tt + 160 * s], wB = [-S.M - 40, wireTop[1] + 120];
  gs_wire(gfg, wA, wireTop, 40); gs_wire(gfg, [wA[0], wA[1] + 8], [wireTop[0] + 56, wireTop[1]], 46);
  gs_wire(gfg, [poleX + 28, wireTop[1]], [W + S.M + 40, wireTop[1] + 60], 30);
  for (let i = 0; i < 5; i++) { const p = gs_wireAt(wA, wireTop, 40, .55 + i * .07); gs_perched(gfg, p[0], p[1], 1.1, i % 2 ? 1 : -1); }
  // street lamp
  gfg.strokeStyle = css([20, 18, 20]); gfg.lineWidth = 7; gfg.beginPath(); gfg.moveTo(lampX, lampY); gfg.lineTo(lampX, lampY - 300); gfg.quadraticCurveTo(lampX, lampY - 330, lampX + 30, lampY - 330); gfg.stroke();
  gs_poly(gfg, r, [[lampX + 18, lampY - 332], [lampX + 46, lampY - 332], [lampX + 52, lampY - 318], [lampX + 12, lampY - 318]], [30, 28, 30], Ls, { n: 8, ink: true });
  gs_beam(gfg, lampX + 32, lampY - 318, 30, lampX + 32, lampY, 230, [255, 170, 80], .2, .04);
  gs_eglow(gfg, lampX + 32, lampY - 4, 170, 34, [255, 160, 70], .5);
  // the lone student: back to us, looking up at the tower, satchel
  const stX = port ? W * .34 : tx - 250, stY = port ? H - 90 : H - 34, stH = port ? 330 : 290;
  gs_person(gfg, r, stX, stY, stH, { view: 'back', pose: 'pockets', L: [-.5, -.86], rim: [255, 150, 70], coat: [46, 54, 66], trousers: [30, 32, 40], hair: [26, 20, 18], hs: 'short', coatLen: .25, amb: .55, shadowA: .6, scarf: [120, 34, 34] });
  gs_poly(gfg, r, [[stX + stH * .08, stY - stH * .5], [stX + stH * .2, stY - stH * .5], [stX + stH * .21, stY - stH * .36], [stX + stH * .07, stY - stH * .36]], [70, 46, 30], Ls, { n: 8, ink: true, rim: [255, 160, 80] });
  // left side darkening for the title UI (landscape) / middle band (portrait)
  if (!port) { gfg.fillStyle = gs_grad(gfg, 0, 0, W * .55, 0, [[0, [6, 8, 12], .72], [.6, [6, 8, 12], .3], [1, [6, 8, 12], 0]]); gfg.fillRect(-S.M, gy - 470, W * .55 + S.M, H - gy + 470 + S.M); }
  const gl = S.layer(1.06, { y0: -S.M, y1: gy - 470 });
  if (!port) { gl.fillStyle = gs_grad(gl, 0, 0, W * .55, 0, [[0, [6, 8, 12], .72], [.6, [6, 8, 12], .3], [1, [6, 8, 12], 0]]); gl.fillRect(-S.M, -S.M, W * .55 + S.M, gy - 470 + S.M); }
  else { gl.fillStyle = 'rgba(0,0,0,0)'; }
  // ---- animation
  S.anim(.46, (c, t) => { for (const p of chims) gs_smoke(c, t, p[0], p[1], [120, 110, 110], .14, 1, p[0] | 0); gs_winFlicker(c, t, farWins.filter((w, i) => i % 3 === 0), [255, 190, 110], .25); });
  S.anim(.71, (c, t) => {
    gs_winFlicker(c, t, sch.wins, [255, 170, 80], .3); gs_winDark(c, t, sch.wins, .82);
    gs_flag(c, t, sch.flag[0], sch.flag[1], s, [150, 30, 32]);
    // the Bell: a slow, rare toll every ~14 s
    const ph = (t % 14000) / 14000; if (ph < .5) gs_rings(c, ph * 2 * 5000, sch.bellX, sch.bellY, [255, 200, 120], .32 * (1 - ph * 2), .0002, 900 * s, .65);
    gs_glow(c, sch.bellX, sch.bellY, 70 * s, [255, 170, 80], .18 + .08 * Math.sin(t * .002));
    // crows circling the tower
    for (let i = 0; i < 9; i++) { const a = t * .00018 * (1 + (i % 3) * .25) + i * .7, rx = (170 + (i * 37) % 120) * s, ry = 60 * s; const bx = sch.tx + Math.cos(a) * rx, by = sch.tt - 90 * s + Math.sin(a) * ry + Math.sin(t * .001 + i) * 12; gs_crow(c, bx, by, (.8 + (i % 3) * .2) * s * (1 + Math.sin(a) * .15), t * .0035 + i * .37); }
  });
  S.anim(1.1, (c, t) => {
    // lamp flicker + a moth or two, crows crossing
    const fl = .85 + .15 * Math.sin(t * .013) * Math.sin(t * .0071 + 1) + (Math.sin(t * .0013) > .97 ? -.4 : 0);
    gs_glow(c, lampX + 32, lampY - 322, 60, [255, 190, 110], .55 * fl); gs_eglow(c, lampX + 32, lampY - 4, 170, 34, [255, 160, 70], .12 * fl);
    for (let i = 0; i < 3; i++) { const p = ((t * .00003 + i * .37) % 1), bx = -60 + p * (W + 120), by = y0 + 120 + i * 50 + Math.sin(p * 9 + i) * 20; gs_crow(c, bx, by, 1.2 - i * .2, t * .004 + i); }
  });
};

/* ======================================================== DAY CARDS (day 2 Wednesday / day 3 Thursday, Jubilee) */
function gs_dayCard(S, r, jub) {
  const W = S.W, H = S.H, port = S.port;
  const y0 = (H - 720) * (port ? .38 : .5), gy = y0 + 600;
  const sunX = port ? W * .3 : W * .26, sunY = gy - 70;
  const L = [-.7, -.7];
  const sky = jub ? [[0, [30, 20, 40]], [.32, [96, 44, 62]], [.58, [200, 92, 62]], [.78, [246, 154, 82]], [1, [255, 200, 120]]] : [[0, [26, 44, 72]], [.35, [84, 112, 140]], [.62, [196, 160, 150]], [.82, [244, 200, 160]], [1, [252, 222, 176]]];
  const g = S.layer(.15);
  gs_wash(g, r, -S.M, -S.M, W + 2 * S.M, gy + S.M + 10, sky, { n: 900, sl: [100, 340], sw: [8, 26] });
  gs_glow(g, sunX, sunY, 640, jub ? [255, 140, 60] : [255, 214, 160], .55); gs_glow(g, sunX, sunY, 160, [255, 236, 200], .6);
  paintEll(g, sunX, sunY, 46, 46, jub ? [255, 216, 150] : [255, 242, 214], RNG(5), { n: 40, sw: 8, ang: 0, aj: 3, ink: false, edge: false, alt: [255, 250, 230], jv: .04 });
  lightRaysGS(g, sunX, sunY, 1100, 3.0, -1.5708, jub ? [255, 170, 90] : [255, 236, 200], jub ? .1 : .08, 18, r);
  g.fillStyle = gs_grad(g, 0, gy, 0, H + S.M, [[0, jub ? [80, 56, 56] : [90, 92, 100]], [1, [16, 14, 18]]]); g.fillRect(-S.M, gy, W + 2 * S.M, H - gy + S.M * 2);
  const gc = S.layer(.3, { y0: -S.M, y1: gy - 80, drift: [80, 200000] });
  for (let i = 0; i < (jub ? 10 : 7); i++) { const cx = r.r(-100, W + 100), cy = y0 + r.r(30, 340) - (port ? r() * (y0 + 60) : 0), rx = r.r(150, 320); gs_cloud(gc, r, cx, cy, rx, r.r(24, 50), jub ? mix([60, 30, 52], [110, 46, 60], r()) : mix([110, 120, 150], [150, 150, 170], r()), jub ? [255, 160, 90] : [255, 222, 190], [-.8, .6], { n: Math.round(rx * .8) }); }
  // far district, hazy
  const gf = S.layer(.45, { y0: gy - 300, y1: gy + 20 });
  const fw = [];
  for (let x = -S.M - 20; x < W + S.M; x += r.r(46, 90)) fw.push(...gs_block(gf, r, x, gy - 6, r.r(40, 80), r.r(50, 170), mix(jub ? [110, 70, 90] : [116, 126, 150], jub ? [190, 110, 96] : [190, 170, 170], r() * .5), L, { far: true, lit: .3, ww: 5, wh: 7, gx: 7, gyy: 9, col: [255, 214, 150], dark: jub ? [90, 60, 80] : [96, 104, 130], seed: x | 0 }));
  gs_haze(gf, -S.M, gy - 140, W + 2 * S.M, gy + 20, jub ? [255, 150, 90] : [255, 220, 190], 0, .55);
  // school on the right (smaller), tower catching first light
  const tx = port ? W * .66 : W * .7, s = port ? .62 : .72;
  const gm = S.layer(.7, { y0: gy - 640 * s - 40, y1: gy + 40 });
  const sch = gs_school(gm, r, tx, gy, s, { L: L, rim: jub ? [255, 150, 80] : [255, 214, 170], wall: jub ? [120, 92, 96] : [116, 126, 128], roof: jub ? [56, 36, 48] : [58, 62, 70], litP: jub ? .5 : .25, seed: jub ? 9 : 5, bell: [210, 160, 80], sky: sky[3][1], fw: 900, doorLit: true });
  const gfg = S.layer(1.05, { y0: gy - 500, y1: H + S.M });
  gs_ground(gfg, r, -S.M, gy, W + 2 * S.M, H + S.M, jub ? [[0, [120, 90, 80]], [.3, [80, 58, 58]], [1, [20, 14, 18]]] : [[0, [128, 126, 128]], [.3, [84, 86, 94]], [1, [18, 18, 24]]], { cobble: [20, 16, 18], n: 900 });
  gs_eglow(gfg, sunX, gy + 30, 600, 50, jub ? [255, 150, 80] : [255, 214, 170], .35);
  // poles: two on Wednesday; on Thursday many, with horns & red bunting
  const poles = jub ? [[W * .05, H - 20, 480], [W * .3, gy + 70, 360], [W * .93, H - 30, 500]] : [[W * .06, H - 30, 430], [W * .94, H - 20, 450]];
  for (const [x, y, h] of poles) { gs_pole(gfg, r, x, y, h, L); gs_horn(gfg, r, x + 8, y - h + 52, 1.2, -.3, L); gs_horn(gfg, r, x - 8, y - h + 58, 1.2, Math.PI + .3, L); }
  const strings = [];
  if (jub) {
    const pt = (p) => [p[0], p[1] - p[2] + 16];
    strings.push([pt(poles[0]), pt(poles[1]), 60], [pt(poles[1]), [sch.tx - 70 * s, sch.top - 10], 50], [[sch.tx + 70 * s, sch.top - 10], pt(poles[2]), 70], [pt(poles[0]), [sch.tx - 75 * s, sch.tt + 120 * s], 120]);
    for (const [a, b, sag] of strings) {
      gs_wire(gfg, a, b, sag, 'rgba(20,14,16,.9)', 1.6);
      const n = Math.max(6, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 28));
      for (let i = 1; i < n; i++) { const p = gs_wireAt(a, b, sag, i / n), c = [[176, 34, 38], [236, 200, 110], [226, 220, 200]][i % 3]; gs_poly(gfg, r, [[p[0] - 8, p[1]], [p[0] + 8, p[1]], [p[0] + r.g() * 2, p[1] + 22]], c, L, { n: 5, sw: 2.5, ink: true, inkw: 1, ew: .8, rim: [255, 200, 140] }); }
    }
    // Jubilee banner on the facade
    gs_rect(gm, r, sch.fx0 + 40, sch.top + 160 * s, (sch.tx - sch.fx0) - 150 * s, 46 * s, [150, 26, 34], L, { n: 60, ink: true, inkw: 2, ang: 0, rim: [255, 170, 110] });
    gs_text(gm, r, 'GRAND HARMONY', sch.fx0 + 40 + ((sch.tx - sch.fx0) - 150 * s) / 2, sch.top + 183 * s, 22 * s, [250, 226, 160], { font: 'Georgia, serif', passes: 2 });
  } else {
    // a black car waiting at the gate, lamps still lit
    const cx = port ? W * .2 : W * .26, cy = H - (port ? 140 : 70);
    gs_poly(gfg, r, [[cx - 120, cy], [cx + 130, cy], [cx + 128, cy - 40], [cx + 90, cy - 50], [cx + 50, cy - 92], [cx - 60, cy - 92], [cx - 92, cy - 52], [cx - 122, cy - 44]], [20, 22, 28], L, { n: 90, ink: true, inkw: 2, rim: [255, 220, 180], sw: 4, ang: 0 });
    gs_poly(gfg, r, [[cx - 50, cy - 84], [cx + 40, cy - 84], [cx + 70, cy - 52], [cx - 78, cy - 52]], [70, 80, 96], L, { n: 20, sw: 3, ang: -.4, rim: [255, 220, 180] });
    for (const wx of [cx - 78, cx + 82]) { gfg.fillStyle = css([8, 8, 10]); gfg.beginPath(); gfg.ellipse(wx, cy, 24, 22, 0, 0, 7); gfg.fill(); gfg.fillStyle = css([70, 70, 76]); gfg.beginPath(); gfg.ellipse(wx, cy, 9, 8, 0, 0, 7); gfg.fill(); }
    S.carLamp = [cx + 126, cy - 30];
  }
  // early figures heading to school
  const kids = jub ? 7 : 4;
  for (let i = 0; i < kids; i++) { const x = sch.tx - 220 * s + i * (440 * s / kids) + r.r(-14, 14), y = gy + 30 + (i % 3) * 16; gs_person(gfg, r, x, y, 64 + (i % 3) * 6, { view: 'back', pose: i % 2 ? 'walk' : 'pockets', L: L, rim: jub ? [255, 150, 80] : [255, 214, 170], coat: jub && i % 3 === 0 ? [110, 34, 36] : [52, 62, 76], hs: ['short', 'long', 'cap', 'bun'][i % 4], ink: false, shadowA: .3 }); }
  // the legible band behind the card text
  const gv = S.layer(1.06, { y0: -S.M, y1: gy - 500 });
  for (const gg of [gfg, gv, gm]) { const cy = H * .44; const v = gg.createRadialGradient(W / 2, cy, 30, W / 2, cy, Math.max(W, 700) * .55); v.addColorStop(0, css(jub ? [24, 10, 24] : [12, 20, 36], .5)); v.addColorStop(.6, css(jub ? [24, 10, 24] : [12, 20, 36], .22)); v.addColorStop(1, 'rgba(0,0,0,0)'); gg.fillStyle = v; gg.fillRect(-S.M, -2000, W + 2 * S.M, 5000); if (gg === gm) break; }
  S.anim(.46, (c, t) => { gs_winFlicker(c, t, fw.filter((w, i) => i % 4 === 0), [255, 214, 150], .2); });
  S.anim(.71, (c, t) => {
    gs_winFlicker(c, t, sch.wins, [255, 190, 110], .25);
    const ph = (t % 9000) / 9000; if (ph < .55) gs_rings(c, ph * 5000 / .55, sch.bellX, sch.bellY, jub ? [255, 120, 80] : [255, 226, 170], .3 * (1 - ph / .55), .0002, 800 * s, .65);
    gs_flag(c, t, sch.flag[0], sch.flag[1], s, [160, 34, 36]);
  });
  S.anim(1.1, (c, t) => {
    for (let i = 0; i < 7; i++) { const p = ((t * .000028 * (1 + i % 3 * .3) + i * .19) % 1), bx = -60 + p * (W + 120), by = y0 + 90 + (i * 47) % 200 + Math.sin(p * 8 + i) * 18; gs_crow(c, bx, by, .9, t * .004 + i); }
    if (S.carLamp) { gs_glow(c, S.carLamp[0], S.carLamp[1], 90, [255, 236, 190], .5 + .05 * Math.sin(t * .01)); gs_beam(c, S.carLamp[0], S.carLamp[1], 10, S.carLamp[0] + 260, S.carLamp[1] + 30, 90, [255, 236, 200], .15, 0); }
    if (jub) gs_motes(c, t, 0, y0 + 200, W, 400, 30, [255, 180, 110], .5, 7);
  });
}
function lightRaysGS(g, x, y, len, spread, dirA, col, a, n, r) {
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) { const ang = dirA + (i / (n - 1) - .5) * spread + r.g() * .03, w = r.r(.015, .05), Ln = len * r.r(.6, 1); const gr = g.createLinearGradient(x, y, x + Math.cos(ang) * Ln, y + Math.sin(ang) * Ln); gr.addColorStop(0, css(col, a)); gr.addColorStop(1, css(col, 0)); g.fillStyle = gr; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(ang - w) * Ln, y + Math.sin(ang - w) * Ln); g.lineTo(x + Math.cos(ang + w) * Ln, y + Math.sin(ang + w) * Ln); g.closePath(); g.fill(); }
  g.restore();
}
GS.day2 = function (S, r) { gs_dayCard(S, r, false); };
GS.day3 = function (S, r) { gs_dayCard(S, r, true); };
/* ===================================================================
 * ENDING TABLEAUX (11). Each illustrates its epilogue. Composition keeps the emotional focus in the upper
 * half (the epilogue text covers the lower part of the screen) and works from phone portrait to ultrawide.
 * =================================================================== */
function gs_stage(S) {   // vertical placement of the 720-tall stage for endings
  return S.port ? Math.min(40, (S.H - 720) * .15) : (S.H - 720) * .5;
}
/* perspective floor boards / tiles converging on (vx, vy) */
function gs_boards(g, r, x0, x1, y0, y1, vx, vy, col, o) {
  o = o || {};
  g.fillStyle = gs_grad(g, 0, y0, 0, y1, [[0, mul(col, o.far || .55)], [1, mul(col, o.near || 1.05)]]); g.fillRect(x0, y0, x1 - x0, y1 - y0);
  const n = o.n || 26;
  for (let i = -n; i <= n * 2; i++) {   // board seams radiating from the vanishing point
    const bx = vx + (i - n / 2) * (o.gap || 60) * 2.2, t0 = (y0 - vy) / (y1 - vy);
    const ax = vx + (bx - vx) * t0;
    g.strokeStyle = css(mul(col, .4), .5); g.lineWidth = 1.2; g.beginPath(); g.moveTo(ax, y0); g.lineTo(bx, y1); g.stroke();
  }
  for (let i = 0; i < (o.strokes || 500); i++) {
    const t = Math.pow(r(), .8), yy = y0 + t * (y1 - y0), xx = x0 + r() * (x1 - x0);
    const a = Math.atan2(yy - vy, xx - vx);
    bristle(g, xx, yy, a, r.r(20, 90) * (.3 + t), r.r(2, 7) * (.3 + t), jit(mix(mul(col, .6 + t * .5), o.alt || col, r() * .3), r, .12), r.r(.15, .4), r);
  }
}
function gs_chair(g, r, x, y, s, col, dir, L, rim) {   // wooden chair, side view (seat at y - 1.9u)
  const k = s, d = dir || 1, o = { rim: rim, n: 8, sw: 2.2 * k, ink: true, inkw: 1.1 * k };
  gs_rect(g, r, x - 22 * k, y - 62 * k, 50 * k, 7 * k, col, L, o);
  gs_rect(g, r, x - 20 * k * d - (d < 0 ? 6 * k : 0), y - 140 * k, 6 * k, 140 * k, mul(col, .9), L, o);
  gs_rect(g, r, x + 22 * k * d - (d < 0 ? 6 * k : 0), y - 60 * k, 6 * k, 60 * k, mul(col, .8), L, o);
}
function gs_cup(g, r, x, y, s, col, L, rim) {
  gs_poly(g, r, [[x - 9 * s, y - 16 * s], [x + 9 * s, y - 16 * s], [x + 7 * s, y], [x - 7 * s, y]], col, L, { rim: rim, n: 8, sw: 2 * s, ink: true, inkw: 1 * s });
  g.strokeStyle = css(mul(col, .6)); g.lineWidth = 2 * s; g.beginPath(); g.arc(x + 10 * s, y - 9 * s, 4 * s, -1.4, 1.4); g.stroke();
  g.fillStyle = css([60, 36, 20]); g.beginPath(); g.ellipse(x, y - 16 * s, 9 * s, 2.5 * s, 0, 0, 7); g.fill();
}
function gs_steam(g, t, x, y, s, a, seed) {
  g.save(); g.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const ph = ((t * .00025 + i / 3 + (seed || 0)) % 1);
    g.strokeStyle = css([240, 236, 226], a * Math.sin(ph * 3.14)); g.lineWidth = (2 + ph * 5) * s;
    g.beginPath(); const yy = y - ph * 50 * s; g.moveTo(x + Math.sin(t * .002 + i) * 3 * s, yy + 8 * s);
    g.bezierCurveTo(x + 8 * s * Math.sin(t * .0015 + i * 2), yy, x - 8 * s * Math.sin(t * .0013 + i), yy - 12 * s, x + 4 * s * Math.sin(t * .001 + i), yy - 22 * s); g.stroke();
  }
  g.restore();
}
function gs_lampShade(g, r, x, y, s, col, L) {   // green desk lamp; returns bulb point
  g.strokeStyle = css([26, 24, 22]); g.lineWidth = 4 * s; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 10 * s, y - 70 * s); g.lineTo(x + 26 * s, y - 104 * s); g.stroke();
  gs_rect(g, r, x - 26 * s, y - 6 * s, 52 * s, 8 * s, [30, 28, 26], L, { n: 6, ink: true });
  gs_poly(g, r, [[x + 4 * s, y - 118 * s], [x + 44 * s, y - 118 * s], [x + 66 * s, y - 88 * s], [x - 18 * s, y - 88 * s]], col, L, { n: 20, sw: 3 * s, ink: true, inkw: 1.4 * s, rim: [255, 236, 190] });
  return [x + 24 * s, y - 86 * s];
}
function gs_curtain(g, r, x, y, w, h, col, L, o) {   // heavy pleated drape
  o = o || {}; const folds = o.folds || Math.max(3, Math.round(w / 40));
  for (let i = 0; i < folds; i++) {
    const fx = x + i * w / folds, fw = w / folds * 1.15, sway = (o.gather || 0) * (i / folds - .5);
    const pts = [[fx, y], [fx + fw, y], [fx + fw + sway * .3, y + h], [fx + sway * .3, y + h]];
    gs_poly(g, r, pts, mix(col, mul(col, .5), (i % 2) * .5), L, { n: Math.round(fw * h / 140), sw: fw * .25, sl: h * .4, ang: 1.57, aj: .04, rim: o.rim || [255, 160, 120], la: .5, sa: .7, ew: 1.5 });
    g.fillStyle = gs_grad(g, fx, 0, fx + fw, 0, [[0, [0, 0, 0], .35], [.4, [0, 0, 0], 0], [.75, [255, 200, 180], .06], [1, [0, 0, 0], .4]]); g.fillRect(fx, y, fw, h);
  }
}
function gs_redrawRing(g, t, x, y, col, a, period, R) {   // a single slow expanding ring that repeats
  const ph = (t % period) / period; g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = css(col, a * (1 - ph) * (1 - ph)); g.lineWidth = 1.5 + ph * 4; g.beginPath(); g.ellipse(x, y, 10 + ph * R, (10 + ph * R) * .55, 0, 0, 6.2832); g.stroke(); g.restore();
}

/* ======================================================== THE BELL (curfew): on the stage of the Old Theatre */
GS.end_curfew = function (S, r) {
  const W = S.W, H = S.H, Y = gs_stage(S), cx = W / 2;
  const L = [-.45, -.9], warm = [255, 214, 160];
  const sY = Y + 360;                 // stage front edge
  const g = S.layer(.15);
  gs_wash(g, r, -S.M, -S.M, W + 2 * S.M, H + 2 * S.M, [[0, [8, 8, 12]], [.4, [22, 18, 22]], [.7, [40, 28, 30]], [1, [12, 10, 12]]], { n: 700, ang: 1.57, sl: [60, 240], sw: [8, 24], amax: .25 });
  for (let i = 0; i < 9; i++) { const x = cx - 520 + i * 130 + r.r(-20, 20); g.strokeStyle = css([60, 50, 46], .5); g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, -S.M); g.lineTo(x + r.g() * 10, Y + r.r(80, 260)); g.stroke(); gs_rect(g, r, x - 4, Y + r.r(60, 250), 8, 24, [70, 60, 50], L, { n: 4, ink: false, edge: false }); }
  for (let i = 0; i < 4; i++) gs_rect(g, r, -S.M, Y + 20 + i * 52, W + 2 * S.M, 6, [34, 28, 28], L, { n: 30, sw: 2, ang: 0, ink: false, edge: false });
  const winX = cx + (S.port ? 150 : 330), winY = Y + 70;
  gs_window(g, r, winX - 22, winY, 44, 66, true, { col: [255, 196, 120], mull: true });
  gs_glow(g, winX, winY + 33, 160, [255, 170, 90], .35);
  gs_wash(g, r, cx - 900, Y + 160, 1800, sY - Y - 160, [[0, [36, 26, 26]], [1, [56, 40, 34]]], { n: 260, sl: [30, 90], sw: [6, 14], ang: 0 });
  gs_boards(g, r, -S.M, W + S.M, Y + 250, sY + 4, cx, Y - 200, [118, 88, 62], { gap: 26, n: 40, strokes: 700, alt: [150, 120, 90], far: .3, near: .9 });
  gs_dark(g, -S.M, -S.M, W, H, cx - 20, sY - 70, 300, 80, [6, 4, 8], .72);
  const gm = S.layer(.5);
  const pw = S.port ? W * .5 + 30 : Math.min(560, W * .44);
  gs_curtain(gm, r, -S.M, -S.M, cx - pw + S.M + 40, sY + S.M + 20, [120, 24, 30], [.6, -.6], { folds: 6, gather: 80, rim: [255, 150, 110] });
  gs_curtain(gm, r, cx + pw - 40, -S.M, W + S.M - (cx + pw - 40), sY + S.M + 20, [120, 24, 30], [-.6, -.6], { folds: 6, gather: -80, rim: [255, 150, 110] });
  gs_curtain(gm, r, -S.M, -S.M, W + 2 * S.M, Y + 40 + S.M, [104, 20, 26], [0, -1], { folds: 18, rim: [255, 150, 110] });
  gm.fillStyle = gs_grad(gm, 0, Y + 40, 0, Y + 74, [[0, [0, 0, 0], .6], [1, [0, 0, 0], 0]]); gm.fillRect(-S.M, Y + 40, W + 2 * S.M, 40);
  for (let x = -S.M; x < W + S.M; x += 46) { gm.fillStyle = css([150, 110, 50], .8); gm.beginPath(); gm.arc(x + 23, Y + 40, 23, 0, 3.14); gm.fill(); gm.fillStyle = css([90, 16, 20]); gm.beginPath(); gm.arc(x + 23, Y + 38, 19, 0, 3.14); gm.fill(); }
  gs_rect(gm, r, -S.M, sY, W + 2 * S.M, 22, [60, 40, 30], L, { n: 60, sw: 4, ang: 0, ink: true, inkw: 1.6, rim: [255, 200, 150] });
  for (let x = cx - 600; x < cx + 600; x += 60) gs_ell(gm, r, x, sY - 6, 12, 7, [40, 36, 34], L, { n: 4, ink: true, inkw: 1 });
  const fx = cx - 20, fy = sY - 70;
  const lit = S.layer(.55, { y0: Y - 60, y1: sY + 30 });
  gs_beam(lit, cx - 260, Y - 40, 90, fx, fy, 420, warm, .2, .08);
  gs_eglow(lit, fx, fy + 10, 330, 70, [255, 220, 170], .55);
  const fig = gs_person(lit, r, fx + 140, fy, 270, { view: 'side', pose: 'lie', dir: -1, L: [-.3, -.95], rim: [255, 230, 190], coat: [50, 56, 70], trousers: [36, 38, 46], hs: 'short', hair: [36, 26, 22], coatLen: .3, amb: .5, shade: .5, rimA: .9 });
  for (const h of fig.hands) { gs_glow(lit, h[0], h[1], 14, [255, 255, 255], .25); for (let i = 0; i < 10; i++) bristle(lit, h[0] + r.g() * 16, h[1] + r.g() * 6 + 4, r() * 3, 12, 2, [236, 232, 220], .35, r); }
  for (let i = 0; i < 14; i++) bristle(lit, fx + r.g() * 260, fy + 12 + r() * 30, r.g() * .3, r.r(10, 40), r.r(1, 3), [220, 214, 200], .25, r);
  const gf = S.layer(1.0, { y0: sY + 10, y1: H + S.M });
  gf.fillStyle = gs_grad(gf, 0, sY + 10, 0, H + S.M, [[0, [14, 10, 12]], [1, [4, 4, 6]]]); gf.fillRect(-S.M, sY + 10, W + 2 * S.M, H - sY + S.M);
  for (let row = 0; row < 14; row++) { const sc = 1 + row * .3, yy = sY + 90 + row * 40 * sc; if (yy - 60 * sc > H + S.M) break; const bend = 26 * sc; for (let x = cx - 40 * sc - Math.ceil((cx + S.M + 60) / (66 * sc)) * 66 * sc + (row % 2) * 33 * sc; x < W + S.M + 60; x += 66 * sc) { const dy = Math.pow((x - cx) / (W * .7), 2) * -bend; gs_poly(gf, r, [[x, yy + dy + 40 * sc], [x, yy + dy], [x + 3 * sc, yy + dy - 40 * sc], [x + 30 * sc, yy + dy - 48 * sc], [x + 57 * sc, yy + dy - 40 * sc], [x + 60 * sc, yy + dy], [x + 60 * sc, yy + dy + 40 * sc]], mix([34, 10, 14], [8, 5, 7], clamp(row / 3, 0, 1)), [(cx - x) / W, -1], { n: 10, sw: 5 * sc, ang: 1.57, rim: [255, 190, 140], ew: 1.2 + row * .2, la: .15, sa: .7, ink: true, inkw: 1.2, inka: .5, ha: clamp(.9 - row * .12, .1, 1) }); } }
  gf.fillStyle = gs_grad(gf, 0, sY + 10, 0, sY + 120, [[0, [255, 200, 150], .08], [1, [0, 0, 0], 0]]); gf.fillRect(-S.M, sY + 10, W + 2 * S.M, 110);
  S.anim(.56, (c, t) => {
    c.save(); c.beginPath(); c.moveTo(cx - 305, Y - 40); c.lineTo(cx - 215, Y - 40); c.lineTo(fx + 190, fy); c.lineTo(fx - 190, fy); c.closePath(); c.clip();
    gs_motes(c, t, cx - 320, Y - 40, 560, fy - Y + 40, 70, [255, 236, 200], .55, 3); c.restore();
    const b = .9 + .1 * Math.sin(t * .0009); gs_beam(c, cx - 260, Y - 40, 70, fx, fy, 300, warm, .05 * b, .02, true);
    gs_redrawRing(c, t, fig.head[0], fig.head[1], [255, 240, 210], .35, 7000, 260); gs_redrawRing(c, t + 3500, fig.head[0], fig.head[1], [255, 240, 210], .25, 7000, 260);
  });
  S.anim(.16, (c, t) => { gs_glow(c, winX, winY + 33, 70, [255, 190, 110], .25 + .08 * Math.sin(t * .0007)); });
};

/* ======================================================== THE LEDGER: the boiler room, the stove, sleeves rolled up */
GS.end_ledger = function (S, r) {
  const W = S.W, H = S.H, Y = gs_stage(S), cx = W / 2, port = S.port;
  const fY = Y + 520;
  const stX = cx - (port ? 170 : 330), stY = fY - 10;
  const L = [-.8, -.4], amber = [255, 160, 70];
  const g = S.layer(.2);
  gs_wash(g, r, -S.M, -S.M, W + 2 * S.M, H + 2 * S.M, [[0, [16, 12, 24]], [.35, [40, 26, 44]], [.7, [56, 34, 46]], [1, [18, 12, 18]]], { n: 800, sl: [30, 120], sw: [8, 20], ang: 0, amax: .3 });
  for (let row = 0; row < 34; row++) { const yy = Y - 40 + row * 16; for (let x = -S.M + (row % 2) * 22; x < W + S.M; x += 44) { const d = Math.hypot(x - stX, (yy - stY + 140) * 1.4) / 700; g.fillStyle = css(mix([170, 90, 60], [40, 28, 46], clamp(d, 0, 1)), .16 + r() * .1); g.fillRect(x + r() * 2, yy + r() * 2, 40, 13); } }
  for (let i = -3; i < 4; i++) { const ax = cx + i * 420 + 90; g.strokeStyle = css([20, 12, 18], .75); g.lineWidth = 30; g.beginPath(); g.ellipse(ax, Y + 330, 210, 290, 0, 3.14, 6.28); g.stroke(); g.strokeStyle = css([150, 80, 60], .2); g.lineWidth = 5; g.beginPath(); g.ellipse(ax, Y + 330, 194, 276, 0, 3.4, 5.4); g.stroke(); }
  for (let i = 0; i < 3; i++) { const py = Y + 28 + i * 24; gs_rect(g, r, -S.M, py, W + 2 * S.M, 14 - i * 2, [70, 60, 66], [0, 1], { n: 90, sw: 4, ang: 0, rim: [255, 150, 90], ink: true, inkw: 1.4, la: .5 }); }
  for (let i = 0; i < 9; i++) { const px = cx + (port ? -10 : 60) + i * (port ? 34 : 64) + r.r(-6, 6), py = Y + 140 + (i % 3) * 34 + r.r(-8, 8); if (port && i > 7) break; gs_poly(g, r, [[px, py], [px + 30, py - 2], [px + 32, py + 40], [px + 2, py + 42]], [200, 186, 214], L, { n: 8, sw: 3, rim: [255, 210, 170], ink: true, inkw: .8 }); for (let k = 0; k < 5; k++) { g.strokeStyle = css([110, 60, 160], .7); g.lineWidth = 1; g.beginPath(); g.moveTo(px + 5, py + 8 + k * 6); g.lineTo(px + 25 + r.g() * 3, py + 8 + k * 6 + r.g()); g.stroke(); } }
  gs_boards(g, r, -S.M, W + S.M, fY - 130, H + S.M, cx, Y - 300, [64, 46, 50], { gap: 40, n: 30, strokes: 600, alt: [110, 70, 60], far: .5, near: .6 });
  gs_dark(g, -S.M, -S.M, W, H, stX + 120, stY - 120, 560, 300, [10, 6, 16], .6);
  gs_eglow(g, stX, stY - 60, 640, 260, amber, .3);
  const gm = S.layer(.6, { y0: Y + 20, y1: H + S.M });
  // the stove: pot-bellied, glowing grate, a kettle on top, flue up into the dark
  gs_rect(gm, r, stX - 9, Y + 20, 18, stY - 214 - Y - 20, [40, 34, 36], L, { n: 24, sw: 3, ang: 1.57, ink: true, rim: amber });
  gs_poly(gm, r, ellPts(stX, stY - 110, 70, 100, 24, 0), [44, 34, 34], [.3, -.6], { n: 120, sw: 6, ang: 1.57, ink: true, inkw: 2.4, rim: amber, la: .2, sa: .6 });
  gs_rect(gm, r, stX - 80, stY - 14, 160, 16, [36, 30, 30], L, { n: 14, ink: true, rim: amber });
  gs_rect(gm, r, stX - 86, stY - 214, 172, 18, [50, 40, 40], L, { n: 14, ink: true, rim: amber });
  gs_window(gm, r, stX - 34, stY - 130, 68, 44, true, { col: [255, 140, 50], mull: false, sill: false });
  for (let i = 0; i < 4; i++) { gm.fillStyle = css([30, 20, 18]); gm.fillRect(stX - 34 + i * 17 + 7, stY - 130, 4, 44); }
  gs_poly(gm, r, [[stX - 30, stY - 214], [stX + 30, stY - 214], [stX + 36, stY - 240], [stX + 18, stY - 258], [stX - 18, stY - 258], [stX - 36, stY - 240]], [96, 84, 76], L, { n: 16, ink: true, inkw: 1.4, rim: [255, 200, 140] });
  gm.strokeStyle = css([30, 26, 26]); gm.lineWidth = 4; gm.beginPath(); gm.moveTo(stX + 34, stY - 238); gm.lineTo(stX + 62, stY - 252); gm.stroke();
  // the circle of chairs: twelve people, sleeves up, arms written on, the student among them
  const ring = [], N = port ? 7 : 12;
  for (let i = 0; i < N; i++) { const a = (i / N) * 6.2832 + .3, rx = port ? 230 : 440, ry = 60; ring.push({ x: cx + (port ? 60 : 110) + Math.cos(a) * rx, y: fY - 10 + Math.sin(a) * ry, a: a, i: i }); }
  ring.sort((p, q) => p.y - q.y);
  const clothes = [[70, 56, 70], [86, 70, 56], [52, 60, 72], [96, 84, 70], [60, 44, 48], [70, 74, 60], [44, 48, 60], [90, 60, 54], [64, 64, 76], [80, 70, 80], [56, 50, 44], [74, 58, 60]];
  const skins = ['#d9a98a', '#c08a6a', '#e2b89a', '#a8785a', '#d4a184'];
  const arms = [];
  for (const p of ring) {
    const front = Math.sin(p.a) > .3, dir = Math.cos(p.a) > 0 ? -1 : 1, isStudent = p.i === 2, isAnka = p.i === 6 % N;
    const sc = .9 + (p.y - (fY - 70)) / 120 * .2, h = 270 * sc;
    const Lp = [clamp((stX - p.x) / 500, -1, 1), -.45];
    gs_chair(gm, r, p.x, p.y, sc * 1.0, [70, 50, 40], dir, Lp, amber);
    const info = gs_person(gm, r, p.x - dir * 8 * sc, p.y, h, { view: 'side', pose: p.i % 4 === 1 ? 'sitBow' : 'sit', dir: dir, L: Lp, rim: amber, coat: isStudent ? [46, 56, 70] : clothes[p.i % clothes.length], sleeve: mix(C(skins[p.i % 5]), clothes[p.i % 12], .1), skin: skins[p.i % 5], hs: isAnka ? 'bun' : ['short', 'long', 'cap', 'short', 'bun'][p.i % 5], hair: isAnka ? [214, 210, 204] : [[40, 30, 24], [90, 60, 40], [20, 18, 18], [140, 120, 100]][p.i % 4], coatLen: .2, amb: .55, shade: front ? .62 : .45, ambc: [30, 16, 44], glasses: isAnka, rimA: .9 });
    arms.push(info.hands);
    if (isAnka) { gs_cup(gm, r, info.hands[1][0] + dir * 4, info.hands[1][1] + 2, 1.1 * sc, [200, 190, 170], Lp, amber); S.ankaCup = [info.hands[1][0] + dir * 4, info.hands[1][1] - 16 * sc]; }
  }
  for (const hh of arms) for (const hnd of hh) for (let k = 0; k < 2; k++) { gm.strokeStyle = css([90, 40, 140], .8); gm.lineWidth = 1; gm.beginPath(); gm.moveTo(hnd[0] - 12, hnd[1] - 12 + k * 3); gm.lineTo(hnd[0] - 3 + r.g() * 2, hnd[1] - 13 + k * 3); gm.stroke(); }
  // foreground close-up: a forearm on the table edge, the note in violet ink
  const gf = S.layer(1.0, { y0: fY + 30, y1: H + S.M });
  const tY = Math.max(fY + 80, H - 160);
  gs_rect(gf, r, -S.M, tY, W + 2 * S.M, H - tY + S.M, [52, 36, 32], [-.3, -1], { n: 300, sw: 7, ang: 0, ink: true, inkw: 2, rim: amber, la: .4 });
  gf.fillStyle = gs_grad(gf, 0, tY, 0, H + S.M, [[0, [0, 0, 0], 0], [1, [0, 0, 0], .6]]); gf.fillRect(-S.M, tY, W + 2 * S.M, H - tY + S.M);
  const ax0 = port ? cx - 330 : cx - 560, ay = tY + 46;
  gs_poly(gf, r, [[ax0, ay - 34], [ax0 + 400, ay - 26], [ax0 + 452, ay - 14], [ax0 + 470, ay + 6], [ax0 + 448, ay + 30], [ax0, ay + 42]], C('#d9a98a'), [-.6, -.8], { n: 140, sw: 6, ang: 0, rim: [255, 190, 130], ink: true, inkw: 1.6, inkc: [60, 30, 30], shc: [120, 70, 60] });
  gs_poly(gf, r, [[ax0 - 40, ay - 46], [ax0 + 60, ay - 44], [ax0 + 64, ay + 52], [ax0 - 40, ay + 56]], [80, 64, 70], [-.6, -.8], { n: 40, sw: 6, ang: 1.57, rim: amber, ink: true });
  gs_text(gf, r, 'DO NOT BE SAD.', ax0 + 250, ay - 10, 19, [80, 46, 130], { font: '"Segoe Script", "Brush Script MT", cursive', weight: 'normal', passes: 2, rot: .02, a: .8 });
  gs_text(gf, r, 'EAT SOMETHING.', ax0 + 250, ay + 14, 19, [80, 46, 130], { font: '"Segoe Script", "Brush Script MT", cursive', weight: 'normal', passes: 2, rot: .02, a: .8 });
  S.anim(.61, (c, t) => {
    const fl = .8 + .2 * Math.sin(t * .007) * Math.sin(t * .0031 + 2);
    gs_glow(c, stX, stY - 108, 160, [255, 120, 40], .35 * fl); gs_eglow(c, stX, stY - 40, 520, 160, [255, 140, 60], .1 * fl);
    gs_steam(c, t, stX + 64, stY - 254, 1.2, .35, 0);
    if (S.ankaCup) gs_steam(c, t, S.ankaCup[0], S.ankaCup[1], .7, .3, .5);
    gs_motes(c, t, stX - 160, Y + 40, 320, stY - Y - 140, 18, [255, 150, 70], .6, 9);
  });
};

/* ======================================================== THE WAKE: the district humming back at the Bell in E-flat */
GS.end_wake = function (S, r) {
  const W = S.W, H = S.H, Y = gs_stage(S), cx = W / 2, port = S.port;
  const gy = Y + (port ? 560 : 540);
  const g = S.layer(.15);
  gs_wash(g, r, -S.M, -S.M, W + 2 * S.M, gy + S.M, [[0, [8, 12, 30]], [.45, [22, 34, 66]], [.8, [52, 60, 92]], [1, [130, 100, 96]]], { n: 800, sl: [100, 320], sw: [10, 26] });
  for (let i = 0; i < 220; i++) { const x = r() * W, y = r() * (gy - 200); g.fillStyle = css([230, 230, 255], r.r(.2, .8)); g.fillRect(x, y, r() < .1 ? 2 : 1.2, r() < .1 ? 2 : 1.2); }
  gs_glow(g, cx, gy - 160, 700, [255, 180, 90], .22);
  g.fillStyle = css([12, 12, 20]); g.fillRect(-S.M, gy, W + 2 * S.M, H - gy + S.M);
  const gc = S.layer(.3, { y0: -S.M, y1: gy - 200, drift: [60, 240000] });
  for (let i = 0; i < 6; i++) gs_cloud(gc, r, r.r(-100, W + 100), Y + r.r(40, 220) - (port ? r() * 100 : 0), r.r(180, 320), r.r(16, 30), [20, 26, 50], [130, 116, 140], [0, 1], { n: 160, a: .7 });
  const s = port ? .6 : .56;
  const gm = S.layer(.5, { y0: gy - 640 * s - 40, y1: gy + 20 });
  const sch = gs_school(gm, r, cx, gy - 20, s, { L: [0, -1], rim: [255, 190, 120], wall: [46, 52, 74], roof: [24, 26, 40], litP: .9, seed: 3, winc: [255, 196, 110], belfryGlow: [255, 210, 140], fw: 900, flag: false, dark: [20, 24, 40], sky: [60, 70, 100] });
  const gb = S.layer(.75, { y0: gy - 470, y1: gy + 40 });
  const wins = [];
  const blocks = port ? [[-60, 230, 420], [W - 170, 230, 450]] : [[-40, 330, 380], [W - 300, 340, 430], [cx - 660, 200, 260], [cx + 470, 200, 290]];
  blocks.sort((a, b) => a[2] - b[2]);
  for (const [bx, bw, bh] of blocks) wins.push(...gs_block(gb, r, bx, gy + 10, bw, bh, [44, 46, 64], [0, -1], { lit: .96, ww: 22, wh: 32, gx: 18, gyy: 22, col: [255, 196, 110], who: .7, rim: [255, 190, 120], edge: true }));
  const gf = S.layer(1.0, { y0: gy - 200, y1: H + S.M });
  gs_ground(gf, r, -S.M, gy + 10, W + 2 * S.M, H + S.M, [[0, [60, 54, 60]], [.3, [36, 34, 44]], [1, [10, 10, 16]]], { cobble: [10, 10, 14], n: 700 });
  for (const w of wins) if (lat(w.x | 0, w.y | 0, 3) < .3) { gf.fillStyle = css([255, 190, 110], .1); gf.fillRect(w.x, gy + 16 + (gy - w.y) * .1, w.w, 3); }
  const people = port ? 6 : 13;
  for (let i = 0; i < people; i++) { const x = (i + .5) / people * W + r.r(-20, 20), y = gy + 40 + (i % 3) * 22 + r.r(0, 10), h = 110 + (i % 3) * 12; gs_person(gf, r, x, y, h, { view: i % 4 === 0 ? 'back' : 'side', pose: i % 4 === 0 ? 'pockets' : 'sideStand', dir: i % 2 ? 1 : -1, L: [0, -1], rim: [255, 190, 120], coat: [[60, 56, 70], [80, 64, 56], [50, 60, 74], [90, 80, 70]][i % 4], hs: ['short', 'long', 'cap', 'bun', 'short'][i % 5], coatLen: .7, shadowA: .3, amb: .45, shade: .5, footDark: .5 }); }
  S.anim(.51, (c, t) => { gs_rings(c, t, sch.bellX, sch.bellY, [255, 210, 150], .25, .00012, 700 * s, .6); gs_glow(c, sch.bellX, sch.bellY, 90, [255, 200, 120], .3 + .1 * Math.sin(t * .0015)); });
  S.anim(.76, (c, t) => {
    gs_winFlicker(c, t, wins, [255, 196, 110], .22);
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (let i = 0; i < wins.length; i += 3) { const w = wins[i], ph = ((t * .00008 + w.fl) % 1), x0 = w.x + w.w / 2, y0 = w.y + w.h * .4; const x = lerp(x0, sch.bellX, ph * .5), y = lerp(y0, sch.bellY, ph * .5) - Math.sin(ph * 3.14) * 40; c.strokeStyle = css([255, 210, 140], .22 * Math.sin(ph * 3.14)); c.lineWidth = 2; c.beginPath(); c.moveTo(x - 6, y); c.quadraticCurveTo(x, y - 4 - 3 * Math.sin(t * .004 + i), x + 6, y); c.stroke(); }
    c.restore();
  });
};

/* ======================================================== RATION TEA (quiet): the kitchen window at nine */
GS.end_quiet = function (S, r) {
  const W = S.W, H = S.H, Y = gs_stage(S), cx = W / 2, port = S.port;
  const ww = port ? 300 : 420, wh = 330, wx = cx - ww / 2 + (port ? -40 : -60), wy = Y + 50;
  const L = [.6, -.6], lamp = [255, 196, 120];
  const g = S.layer(.15);
  gs_wash(g, r, -S.M, -S.M, W + 2 * S.M, H + 2 * S.M, [[0, [10, 16, 32]], [.3, [26, 40, 64]], [.5, [70, 66, 84]], [1, [20, 20, 30]]], { n: 500 });
  const hz = wy + wh * .8;
  const ow = []; for (let x = wx - 200; x < wx + ww + 200; x += r.r(30, 60)) ow.push(...gs_block(g, r, x, hz + 40, r.r(30, 56), r.r(40, 140), [30, 36, 54], [0, -1], { far: true, lit: .4, ww: 4, wh: 6, gx: 6, gyy: 8, col: [255, 200, 120], dark: [26, 32, 48], seed: x | 0 }));
  const sch = gs_school(g, r, wx + ww * .66, hz + 30, .24, { L: [0, -1], wall: [40, 46, 64], roof: [24, 26, 38], rim: [200, 180, 160], litP: .3, fw: 900, horns: false, flag: false, belfryGlow: [255, 200, 130] });
  const gm = S.layer(.6);
  gm.save(); gm.beginPath(); gm.rect(-S.M, -S.M, W + 2 * S.M, H + 2 * S.M); gm.rect(wx + ww, wy, -ww, wh); gm.clip('evenodd');
  gs_wash(gm, r, -S.M, -S.M, W + 2 * S.M, H + 2 * S.M, [[0, [70, 56, 44]], [.5, [120, 92, 62]], [1, [52, 40, 34]]], { n: 900, ang: 1.57, sl: [40, 160], sw: [8, 22] });
  for (let x = -S.M; x < W + S.M; x += 34) { gm.fillStyle = css([90, 60, 40], .12); gm.fillRect(x, -S.M, 12, H + 2 * S.M); }
  gs_dark(gm, -S.M, -S.M, W, H, wx + ww / 2, wy + wh / 2, 520, 360, [14, 8, 8], .7);
  gm.restore();
  const fr = [70, 58, 48];
  gs_rect(gm, r, wx - 16, wy - 16, ww + 32, 16, fr, L, { n: 16, ink: true, rim: lamp }); gs_rect(gm, r, wx - 16, wy, 16, wh, fr, L, { n: 16, ink: true, rim: lamp }); gs_rect(gm, r, wx + ww, wy, 16, wh, fr, L, { n: 16, ink: true, rim: lamp });
  gs_rect(gm, r, wx + ww / 2 - 5, wy, 10, wh, fr, L, { n: 10, ink: true, rim: lamp }); gs_rect(gm, r, wx, wy + wh * .42, ww, 8, fr, L, { n: 10, ink: true, rim: lamp });
  gs_rect(gm, r, wx - 40, wy + wh, ww + 80, 20, [150, 126, 100], L, { n: 30, ink: true, rim: [255, 220, 170], ang: 0 });
  gm.save(); gm.globalCompositeOperation = 'lighter'; gm.fillStyle = gs_grad(gm, wx, wy, wx + ww, wy + wh, [[0, [255, 200, 140], .08], [.5, [255, 200, 140], .0], [1, [255, 200, 140], .05]]); gm.fillRect(wx, wy, ww, wh); gm.restore();
  const cupX = wx + ww * .8, cupY = wy + wh;
  gs_cup(gm, r, cupX, cupY, 1.6, [210, 200, 182], L, lamp);
  const spX = port ? wx + ww + 70 : wx + ww + 160, spY = wy + 60;
  gs_poly(gm, r, [[spX - 34, spY - 40], [spX + 34, spY - 40], [spX + 38, spY + 40], [spX - 38, spY + 40]], [60, 44, 34], L, { n: 30, ink: true, inkw: 2, rim: lamp });
  gs_ell(gm, r, spX, spY - 4, 24, 24, [40, 30, 26], L, { n: 20, ink: true });
  for (let i = 0; i < 5; i++) { gm.strokeStyle = css([90, 70, 50], .7); gm.lineWidth = 1.5; gm.beginPath(); gm.moveTo(spX - 20, spY - 14 + i * 6); gm.lineTo(spX + 20, spY - 14 + i * 6); gm.stroke(); }
  gm.fillStyle = css([255, 140, 60]); gm.beginPath(); gm.arc(spX + 24, spY + 28, 3, 0, 7); gm.fill();
  // counter under the window, the sink with a thin blue ribbon of ink going down the drain
  const ctY = wy + wh + 22, flY = Y + 640;
  gs_rect(gm, r, -S.M, ctY, W + 2 * S.M, 26, [150, 132, 110], [.4, -1], { n: 80, sw: 5, ang: 0, ink: true, inkw: 1.6, rim: [255, 220, 170] });
  gs_rect(gm, r, -S.M, ctY + 26, W + 2 * S.M, flY - ctY - 26, [76, 60, 50], L, { n: 160, sw: 7, ang: 1.57, ink: true, rim: lamp, la: .3 });
  for (let x = -S.M + 20; x < W + S.M; x += 150) { gm.strokeStyle = css([30, 22, 18], .6); gm.lineWidth = 2; gm.strokeRect(x, ctY + 40, 130, flY - ctY - 60); gm.fillStyle = css([200, 170, 110], .6); gm.fillRect(x + 58, ctY + 60, 14, 4); }
  gs_rect(gm, r, -S.M, flY, W + 2 * S.M, H - flY + S.M, [40, 32, 30], [0, -1], { n: 100, sw: 8, ang: 0 });
  const skX = wx + ww * .62;
  gs_ell(gm, r, skX, ctY + 6, 92, 10, [120, 122, 126], [0, -1], { n: 20, ink: true, inkw: 1.6, rim: [255, 230, 200] });
  gm.strokeStyle = css([60, 100, 220], .85); gm.lineWidth = 2.2; gm.beginPath(); gm.moveTo(skX - 60, ctY + 4); gm.bezierCurveTo(skX - 30, ctY + 10, skX + 20, ctY + 2, skX + 4, ctY + 7); gm.stroke();
  gm.strokeStyle = css([150, 150, 150]); gm.lineWidth = 5; gm.beginPath(); gm.moveTo(skX + 70, ctY); gm.lineTo(skX + 70, ctY - 46); gm.quadraticCurveTo(skX + 70, ctY - 60, skX + 50, ctY - 58); gm.stroke();
  // bare bulb, top right
  const bulbX = port ? W - 80 : W * .82, bulbY = Y + 30;
  gm.strokeStyle = css([20, 16, 14]); gm.lineWidth = 2; gm.beginPath(); gm.moveTo(bulbX, -S.M); gm.lineTo(bulbX, bulbY); gm.stroke();
  gs_ell(gm, r, bulbX, bulbY + 10, 9, 12, [255, 236, 190], [0, 1], { n: 6, edge: false });
  gs_glow(gm, bulbX, bulbY + 10, 380, [255, 180, 100], .3);
  // the parent at the window, hand flat against the glass, faint reflection
  const pf = S.layer(.8, { y0: wy - 80, y1: H + S.M });
  const handX = wx + ww * .33, handY = wy + wh * .5, py = flY + 14, u = (py - handY) / 6.25, hH = u * 7.5, px = handX - 1.45 * u;
  gs_person(pf, r, px, py, hH, { view: 'side', pose: 'reach', dir: 1, L: [.85, -.5], rim: lamp, coat: [96, 78, 66], sleeve: [96, 78, 66], skin: '#d9a98a', hs: 'bun', hair: [60, 44, 36], coatLen: .75, amb: .45, shade: .6, shadow: false, rimA: .8 });
  gs_glow(gm, handX + 6, handY, 40, [200, 220, 255], .12);
  S.anim(.16, (c, t) => { gs_winFlicker(c, t, ow.filter((w, i) => i % 2 === 0), [255, 200, 120], .3); const ph = (t % 11000) / 11000; if (ph < .5) gs_rings(c, ph * 9000, sch.bellX, sch.bellY, [255, 200, 140], .3 * (1 - ph * 2), .0002, 200, .65); });
  S.anim(.61, (c, t) => { gs_steam(c, t, cupX, cupY - 26, 1.3, .35, 0); const b = .5 + .5 * Math.sin(t * .006); gs_glow(c, spX + 24, spY + 28, 14, [255, 140, 60], .4 + .3 * b); gs_rings(c, t, spX, spY - 4, [255, 220, 180], .12, .0004, 90, 1); });
};

/* ======================================================== THE GOOD STUDENT: thirty years later, at a railing, feeling nothing */
GS.end_good_student = function (S, r) {
  const W = S.W, H = S.H, Y = gs_stage(S), cx = W / 2, port = S.port;
  const gy = Y + 470, L = [.5, -.85], fog = [214, 170, 110];
  const g = S.layer(.15);
  gs_wash(g, r, -S.M, -S.M, W + 2 * S.M, gy + S.M + 40, [[0, [40, 44, 56]], [.5, [110, 100, 92]], [.85, [200, 160, 110]], [1, [222, 182, 124]]], { n: 700, sl: [120, 360], sw: [12, 30], amax: .35 });
  const tx = port ? cx + 60 : cx + 220;
  const sch = gs_school(g, r, tx, gy, .5, { L: L, rim: [255, 214, 160], wall: [120, 112, 100], roof: [70, 64, 62], litP: .6, seed: 21, winc: [255, 200, 120], fw: 1500, belfryGlow: [255, 210, 150], horns: true, sky: [190, 160, 120] });
  gs_haze(g, -S.M, Y - 40, W + 2 * S.M, gy + 20, fog, .15, .55);
  g.fillStyle = gs_grad(g, 0, gy, 0, H + S.M, [[0, [120, 104, 84]], [1, [30, 26, 26]]]); g.fillRect(-S.M, gy, W + 2 * S.M, H - gy + S.M);
  // iron railing with spear finials
  const gm = S.layer(.6, { y0: gy - 220, y1: gy + 60 });
  const rY = gy + 40;
  gs_rect(gm, r, -S.M, rY - 170, W + 2 * S.M, 7, [24, 22, 24], L, { n: 40, ang: 0, ink: true, rim: [255, 210, 150] });
  gs_rect(gm, r, -S.M, rY - 30, W + 2 * S.M, 7, [24, 22, 24], L, { n: 40, ang: 0, ink: true, rim: [255, 210, 150] });
  for (let x = -S.M; x < W + S.M; x += 22) { gm.fillStyle = css([22, 20, 22]); gm.fillRect(x, rY - 196, 4, 200); gm.beginPath(); gm.moveTo(x - 4, rY - 194); gm.lineTo(x + 2, rY - 212); gm.lineTo(x + 8, rY - 194); gm.fill(); gm.fillStyle = css([255, 210, 150], .25); gm.fillRect(x + 3, rY - 190, 1, 186); }
  // the black car at the kerb, lamps on
  const gf = S.layer(1.0, { y0: gy - 330, y1: H + S.M });
  const carX = port ? cx - 210 : cx - 420, carY = gy + 150;
  gs_poly(gf, r, [[carX - 170, carY], [carX + 180, carY], [carX + 176, carY - 54], [carX + 120, carY - 68], [carX + 66, carY - 124], [carX - 80, carY - 124], [carX - 126, carY - 70], [carX - 168, carY - 60]], [20, 20, 26], L, { n: 120, ink: true, inkw: 2.2, rim: [255, 220, 170], sw: 5, ang: 0, la: .45 });
  gs_poly(gf, r, [[carX - 66, carY - 114], [carX + 54, carY - 114], [carX + 96, carY - 70], [carX - 104, carY - 70]], [96, 92, 90], L, { n: 24, sw: 3, ang: -.4, rim: [255, 220, 180] });
  for (const wx of [carX - 104, carX + 112]) { gf.fillStyle = css([8, 8, 10]); gf.beginPath(); gf.ellipse(wx, carY, 32, 30, 0, 0, 7); gf.fill(); gf.fillStyle = css([80, 76, 72]); gf.beginPath(); gf.ellipse(wx, carY, 12, 11, 0, 0, 7); gf.fill(); }
  const lampP = [carX + 176, carY - 40];
  // the man: good coat, hat, gloved hand on the railing, back to us
  const mx = port ? cx + 60 : cx + 70, my = gy + 250;
  gs_person(gf, r, mx, my, 430, { view: 'back', pose: 'stand', L: [.4, -.9], rim: [255, 214, 160], coat: [44, 46, 54], trousers: [30, 30, 36], hair: [120, 116, 110], hs: 'short', hat: [30, 30, 34], coatLen: .95, gloves: [26, 22, 22], amb: .5, shade: .5, scarf: [140, 130, 110], rimA: .9 });
  // the Friday paper on the pavement: page three, a smiling student beside a Principal
  const nx = port ? cx - 150 : cx - 120, ny = Math.min(H - 60, my + 40);
  gs_poly(gf, r, [[nx - 90, ny - 30], [nx + 80, ny - 40], [nx + 96, ny + 24], [nx - 80, ny + 36]], [196, 188, 166], [0, -1], { n: 40, sw: 3, ang: -.05, ink: true, inkw: 1.2, rim: [255, 236, 200] });
  gs_poly(gf, r, [[nx - 70, ny - 22], [nx - 4, ny - 26], [nx + 2, ny + 14], [nx - 64, ny + 18]], [90, 86, 80], [0, -1], { n: 14, sw: 2 });
  for (const [px, ph] of [[nx - 46, 30], [nx - 20, 34]]) { gf.fillStyle = css([40, 38, 36]); gf.beginPath(); gf.arc(px, ny - 10, 4, 0, 7); gf.fill(); gf.fillRect(px - 6, ny - 5, 12, ph * .45); }
  for (let k = 0; k < 6; k++) { gf.strokeStyle = css([70, 66, 60], .7); gf.lineWidth = 1; gf.beginPath(); gf.moveTo(nx + 10, ny - 22 + k * 7); gf.lineTo(nx + 80, ny - 26 + k * 7); gf.stroke(); }
  gs_text(gf, r, 'AN EXAMPLE', nx, ny - 36, 10, [40, 36, 34], { rot: -.05, passes: 1 });
  S.anim(.16, (c, t) => { gs_winFlicker(c, t, sch.wins, [255, 200, 120], .15); const ph = (t % 12000) / 12000; if (ph < .5) gs_rings(c, ph * 9000, sch.bellX, sch.bellY, [255, 230, 190], .22 * (1 - ph * 2), .0002, 500, .6); });
  S.anim(.4, (c, t) => { c.save(); c.globalAlpha = .1 + .04 * Math.sin(t * .0003); c.fillStyle = css(fog); c.fillRect(-S.M, Y + 120 + Math.sin(t * .0002) * 20, W + 2 * S.M, 260); c.restore(); });
  S.anim(1.1, (c, t) => { gs_glow(c, lampP[0], lampP[1], 70, [255, 240, 200], .6); gs_beam(c, lampP[0], lampP[1], 12, lampP[0] + 420, lampP[1] + 60, 160, [255, 236, 200], .12, 0, true); gs_motes(c, t, -S.M, Y, W, 400, 26, [255, 220, 170], .35, 12); });
};

/* ======================================================== THE BROADCAST (static): WHAT THEY TOOK across the Warden's face */
GS.end_static = function (S, r) {
  const W = S.W, H = S.H, Y = gs_stage(S), cx = W / 2, port = S.port;
  const L = [-.7, -.7], gy = Y + 560;
  const g = S.layer(.2);
  gs_wash(g, r, -S.M, -S.M, W + 2 * S.M, H + 2 * S.M, [[0, [70, 80, 78]], [.5, [104, 110, 100]], [1, [40, 42, 40]]], { n: 600 });
  // the poster wall
  gs_rect(g, r, -S.M, Y - 10, W + 2 * S.M, gy - Y + 10, [96, 90, 80], L, { n: 900, sw: 9, ang: 1.57, aj: .2, alt: [130, 120, 100], ink: false, la: .3, sa: .5 });
  for (let i = 0; i < 26; i++) { const px = r.r(-S.M, W), py = Y + r.r(0, 440), pw = r.r(50, 120), ph = pw * 1.4; gs_rect(g, r, px, py, pw, ph, mix([200, 190, 160], [150, 60, 50], r() * .5), L, { n: 20, sw: 4, alpha: .6, ink: false, rim: [240, 230, 200], ew: 1 }); }
  // the Warden: a huge stern face in red & black
  const pw = port ? 440 : 520, ph = 440, px = cx - pw / 2, py = Y + 20;
  gs_rect(g, r, px, py, pw, ph, [168, 40, 36], L, { n: 260, sw: 8, ang: 1.57, ink: true, inkw: 3, rim: [255, 220, 190], alt: [190, 60, 46] });
  const fx = cx, fy = py + 200;
  gs_poly(g, r, [[fx - 120, fy - 140], [fx + 110, fy - 150], [fx + 140, fy - 20], [fx + 110, fy + 110], [fx + 40, fy + 160], [fx - 50, fy + 160], [fx - 120, fy + 100], [fx - 146, fy - 30]], [226, 196, 160], [.6, -.6], { n: 160, sw: 7, ang: 1.2, ink: true, inkw: 3, shc: [120, 80, 60], rim: [255, 236, 210] });
  gs_poly(g, r, [[fx - 136, fy - 70], [fx - 120, fy - 160], [fx + 20, fy - 196], [fx + 130, fy - 160], [fx + 146, fy - 60], [fx + 110, fy - 120], [fx - 100, fy - 120]], [30, 22, 22], L, { n: 50, sw: 6, ink: true });
  g.fillStyle = css([24, 16, 16]); g.fillRect(fx - 100, fy - 60, 80, 14); g.fillRect(fx + 26, fy - 64, 80, 14);
  for (const ex of [-60, 66]) { g.fillStyle = css([240, 232, 210]); g.beginPath(); g.ellipse(fx + ex, fy - 26, 26, 12, 0, 0, 7); g.fill(); g.fillStyle = css([20, 20, 24]); g.beginPath(); g.arc(fx + ex + 4, fy - 26, 9, 0, 7); g.fill(); }
  g.strokeStyle = css([60, 30, 24], .9); g.lineWidth = 5; g.beginPath(); g.moveTo(fx, fy - 10); g.lineTo(fx - 16, fy + 50); g.lineTo(fx + 8, fy + 54); g.moveTo(fx - 54, fy + 96); g.lineTo(fx + 60, fy + 92); g.stroke();
  gs_rect(g, r, px, py + ph - 70, pw, 70, [20, 16, 18], L, { n: 40, ang: 0 });
  gs_text(g, r, 'THE BELL KEEPS US WHOLE', cx, py + ph - 35, port ? 24 : 30, [236, 216, 170], { font: 'Georgia, serif', passes: 2 });
  // the vandal's paint: WHAT THEY TOOK, white, dripping, across the face
  gs_text(g, r, 'WHAT THEY TOOK', cx + 6, fy + 10, port ? 62 : 74, [246, 244, 236], { font: 'Impact, "Arial Black", sans-serif', rot: -.07, drip: 16, passes: 3, sx: port ? .82 : 1 });
  // pavement + a pole leaking static
  g.fillStyle = gs_grad(g, 0, gy, 0, H + S.M, [[0, [70, 70, 66]], [1, [20, 20, 22]]]); g.fillRect(-S.M, gy, W + 2 * S.M, H - gy + S.M);
  const gf = S.layer(1.0, { y0: Y - 40, y1: H + S.M });
  const poleX = port ? W - 50 : cx + pw / 2 + 160;
  gs_pole(gf, r, poleX, gy + 60, 600, L); gs_horn(gf, r, poleX - 10, gy - 490, 1.4, Math.PI + .3, L);
  // people looking at the writing on their own hands
  const ppl = port ? [[cx - 220, 1], [cx - 60, -1], [cx + 190, -1]] : [[cx - 470, 1], [cx - 300, 1], [cx - 120, -1], [cx + 140, 1], [cx + 360, -1], [cx + 520, -1]];
  ppl.forEach(([x, d], i) => { const y = gy + 130 + (i % 2) * 40, hh = 300 + (i % 2) * 30; const f = gs_person(gf, r, x, y, hh, { view: 'side', pose: i % 3 === 2 ? 'pockets' : 'palm', dir: d, L: L, rim: [240, 236, 220], coat: [[60, 66, 64], [84, 70, 58], [50, 54, 64], [96, 90, 80], [70, 60, 66], [56, 60, 52]][i], hs: ['cap', 'long', 'short', 'bun', 'short', 'long'][i], coatLen: .8, amb: .55, shade: .45, shadowA: .3, rimA: .6 }); if (i % 3 !== 2) { const hp = f.hands[1]; for (let k = 0; k < 3; k++) { gf.strokeStyle = css([30, 30, 60], .85); gf.lineWidth = 1; gf.beginPath(); gf.moveTo(hp[0] - 4, hp[1] + k * 3); gf.lineTo(hp[0] + 5, hp[1] + k * 3 - 1); gf.stroke(); } } });
  S.anim(1.05, (c, t) => {
    const hx = poleX - 40, hy = gy - 490;
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 14; i++) { const ph = ((t * .0009 + i / 14) % 1), x = hx - ph * 220, y = hy + Math.sin(i * 7.3 + t * .01) * ph * 60; c.strokeStyle = css([220, 230, 240], .3 * (1 - ph)); c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); for (let k = 1; k < 6; k++) c.lineTo(x - k * 5, y + (lat(i, k, (t / 60) | 0) - .5) * 14); c.stroke(); }
    c.restore();
  });
  S.anim(.21, (c, t) => { // wet paint glistening, a slow drip
    const ph = (t % 9000) / 9000; c.fillStyle = css([246, 244, 236], .9); c.fillRect(cx + 130, fy + 40, 3, 20 + ph * 60);
  });
};

/* ======================================================== RESOLVED (arrested): Miss Pell, the biscuits, the very thick file */
GS.end_arrested = function (S, r) {
  const W = S.W, H = S.H, Y = gs_stage(S), cx = W / 2, port = S.port;
  const L = [.7, -.6], lampc = [255, 222, 150], dY = Y + 420;
  const g = S.layer(.2);
  gs_wash(g, r, -S.M, -S.M, W + 2 * S.M, H + 2 * S.M, [[0, [120, 116, 92]], [.6, [168, 160, 126]], [1, [80, 78, 62]]], { n: 800, ang: 1.57, sl: [40, 160], sw: [10, 24] });
  gs_rect(g, r, -S.M, Y + 300, W + 2 * S.M, 10, [90, 96, 70], L, { n: 30, ang: 0 });
  g.fillStyle = css([74, 90, 66], .9); g.fillRect(-S.M, Y + 310, W + 2 * S.M, H);
  // the window painted over in Civic Cream
  const wx = port ? cx - 290 : cx - 520, wy = Y + 40;
  gs_rect(g, r, wx, wy, 180, 220, [222, 212, 170], L, { n: 120, sw: 10, ang: .3, aj: .5, ink: true, inkw: 3, rim: [255, 250, 220], alt: [240, 232, 196] });
  g.strokeStyle = css([60, 56, 44], .9); g.lineWidth = 6; g.strokeRect(wx, wy, 180, 220); g.beginPath(); g.moveTo(wx + 90, wy); g.lineTo(wx + 90, wy + 220); g.moveTo(wx, wy + 110); g.lineTo(wx + 180, wy + 110); g.stroke();
  // radiator
  for (let i = 0; i < 9; i++) gs_rect(g, r, wx + 10 + i * 18, wy + 250, 14, 80, [150, 150, 130], L, { n: 6, ink: true, inkw: 1, rim: [255, 240, 210] });
  // clock + portrait that listens
  const ckX = port ? cx + 220 : cx + 380; gs_ell(g, r, ckX, Y + 70, 34, 34, [230, 222, 196], L, { n: 20, ink: true, inkw: 3 }); g.strokeStyle = css([20, 18, 16]); g.lineWidth = 3; g.beginPath(); g.moveTo(ckX, Y + 70); g.lineTo(ckX + 4, Y + 46); g.moveTo(ckX, Y + 70); g.lineTo(ckX + 18, Y + 76); g.stroke();
  gs_dark(g, -S.M, -S.M, W, H, cx + 40, dY - 150, 420, 280, [20, 22, 14], .55);
  // Miss Pell behind the desk, cardigan, glasses, biscuits offered
  const gm = S.layer(.55, { y0: Y + 40, y1: H + S.M });
  const mp = gs_person(gm, r, cx + 70, dY + 40, 420, { view: 'front', pose: 'sitFront', L: [-.7, -.6], rim: lampc, coat: [140, 104, 80], shirt: [226, 220, 200], skin: '#e2b89a', hs: 'bun', hair: [110, 90, 74], glasses: true, smile: true, amb: .55, shade: .4, shadow: false, coatLen: 0 });
  // desk
  gs_poly(gm, r, [[-S.M, dY], [W + S.M, dY], [W + S.M, dY + 36], [-S.M, dY + 36]], [86, 60, 40], [0, -1], { n: 200, sw: 6, ang: 0, ink: true, inkw: 2, rim: [255, 220, 160] });
  gs_rect(gm, r, -S.M, dY + 36, W + 2 * S.M, H - dY, [50, 36, 26], L, { n: 160, sw: 8, ang: 1.57 });
  const bulb = gs_lampShade(gm, r, cx - 170, dY, 1.3, [40, 90, 60], [.2, -1]);
  // the file: very, very thick
  const fx0 = cx - 40, fw = 190;
  for (let i = 0; i < 9; i++) gs_rect(gm, r, fx0 + r.g() * 3, dY - 12 - i * 9, fw, 9, i % 3 ? [214, 196, 150] : [190, 166, 120], [.2, -1], { n: 10, sw: 2, ang: 0, ink: true, inkw: .8, rim: lampc });
  gs_rect(gm, r, fx0 - 2, dY - 96, fw + 4, 12, [160, 120, 70], [.2, -1], { n: 12, ink: true, rim: lampc });
  gs_text(gm, r, 'RETENTION', fx0 + fw / 2, dY - 90, 10, [120, 30, 30], { passes: 1 });
  // biscuits, thermos, paper cup, the card
  const bx = cx + 240; gs_ell(gm, r, bx, dY - 6, 60, 12, [230, 226, 214], [0, -1], { n: 14, ink: true }); for (let i = 0; i < 5; i++) gs_ell(gm, r, bx - 32 + i * 16, dY - 12 - (i % 2) * 4, 12, 6, [200, 150, 90], [0, -1], { n: 5, ink: true, inkw: .8 });
  gs_rect(gm, r, cx + 330, dY - 90, 34, 90, [70, 90, 80], [.2, -1], { n: 14, ink: true, rim: lampc }); gs_cup(gm, r, cx + 384, dY, 1.3, [236, 230, 214], [.2, -1], lampc);
  gs_poly(gm, r, [[cx - 330, dY - 4], [cx - 250, dY - 10], [cx - 246, dY + 2], [cx - 326, dY + 8]], [236, 230, 210], [0, -1], { n: 6, ink: true, inkw: .8 });
  // the student from behind, foreground, small and still
  const gf = S.layer(1.0, { y0: dY - 200, y1: H + S.M });
  gs_person(gf, r, port ? cx - 140 : cx - 260, H + 120, 560, { view: 'back', pose: 'sitFront', L: [.4, -.9], rim: lampc, coat: [46, 54, 66], hair: [30, 24, 20], hs: 'short', amb: .4, shade: .6, shadow: false, rimA: .8 });
  S.anim(.56, (c, t) => {
    const f = .92 + .08 * Math.sin(t * .013) * Math.sin(t * .0047);
    gs_glow(c, bulb[0], bulb[1] + 20, 260, [255, 220, 140], .25 * f); gs_eglow(c, bulb[0] + 60, dY, 300, 40, [255, 220, 150], .2 * f);
    gs_steam(c, t, cx + 384, dY - 24, 1.1, .3, .2);
  });
  S.anim(.21, (c, t) => { const a = (t / 60000) * 6.283; c.strokeStyle = css([150, 30, 30]); c.lineWidth = 1.5; c.beginPath(); c.moveTo(ckX, Y + 70); c.lineTo(ckX + Math.sin(a) * 26, Y + 70 - Math.cos(a) * 26); c.stroke(); });
};

/* ======================================================== THE WARDEN'S EYE: the warm room above the Relay; a second cup */
GS.end_wardens_eye = function (S, r) {
  const W = S.W, H = S.H, Y = gs_stage(S), cx = W / 2, port = S.port;
  const L = [-.6, -.7], warm = [255, 180, 100], cold = [170, 200, 230], dY = Y + 430;
  const g = S.layer(.15);
  // the night district through the big window
  const wx0 = port ? 20 : cx - 520, wx1 = port ? W - 140 : cx + 300, wy0 = Y + 20, wy1 = Y + 330;
  gs_wash(g, r, -S.M, -S.M, W + 2 * S.M, H + 2 * S.M, [[0, [10, 14, 28]], [.4, [26, 34, 56]], [.6, [50, 50, 70]], [1, [10, 10, 16]]], { n: 500 });
  const ow = []; for (let x = wx0 - 40; x < wx1 + 40; x += r.r(30, 60)) ow.push(...gs_block(g, r, x, wy1 + 20, r.r(30, 56), r.r(40, 150), [28, 32, 50], [0, -1], { far: true, lit: .3, ww: 4, wh: 6, gx: 6, gyy: 8, col: [255, 200, 120], dark: [24, 28, 44], seed: x | 0 }));
  const sch = gs_school(g, r, lerp(wx0, wx1, .3), wy1 + 10, .28, { L: [0, -1], wall: [40, 46, 64], roof: [22, 24, 36], rim: [200, 180, 160], litP: .3, fw: 900, belfryGlow: [255, 190, 120], flag: false });
  const mast = [lerp(wx0, wx1, .78), wy0 + 50];
  g.strokeStyle = css([20, 20, 28]); g.lineWidth = 3; g.beginPath(); g.moveTo(mast[0] - 30, wy1 + 20); g.lineTo(mast[0], mast[1]); g.lineTo(mast[0] + 30, wy1 + 20); for (let k = 1; k < 8; k++) { const yy = lerp(mast[1], wy1 + 20, k / 8), w = 30 * k / 8; g.moveTo(mast[0] - w, yy); g.lineTo(mast[0] + w, yy); } g.stroke();
  // the room
  const gm = S.layer(.55);
  gm.save(); gm.beginPath(); gm.rect(-S.M, -S.M, W + 2 * S.M, H + 2 * S.M); gm.rect(wx1, wy0, wx0 - wx1, wy1 - wy0); gm.clip('evenodd');
  gs_wash(gm, r, -S.M, -S.M, W + 2 * S.M, H + 2 * S.M, [[0, [60, 64, 56]], [.5, [96, 92, 74]], [1, [40, 40, 34]]], { n: 800, ang: 1.57, sl: [40, 160], sw: [8, 22] });
  gm.restore();
  for (const [a, b, c2, d] of [[wx0 - 14, wy0 - 14, wx1 - wx0 + 28, 14], [wx0 - 14, wy1, wx1 - wx0 + 28, 18], [wx0 - 14, wy0, 14, wy1 - wy0], [wx1, wy0, 14, wy1 - wy0]]) gs_rect(gm, r, a, b, c2, d, [50, 46, 40], L, { n: 14, ink: true, rim: warm });
  for (let i = 1; i < 4; i++) gs_rect(gm, r, lerp(wx0, wx1, i / 4) - 4, wy0, 8, wy1 - wy0, [50, 46, 40], L, { n: 6, ink: true, rim: warm });
  // the doorway at right: a cold corridor and the student who has been brought
  const dx = port ? W - 120 : cx + 420, dw = port ? 110 : 170;
  gs_rect(gm, r, dx, Y + 60, dw, dY - Y + 80, [150, 176, 200], [0, -1], { n: 60, sw: 8, ang: 1.57, edge: false });
  gs_haze(gm, dx, Y + 60, dw, dY + 140, [220, 236, 250], .3, 0);
  gs_rect(gm, r, dx - 12, Y + 48, 12, dY - Y + 92, [40, 36, 32], L, { n: 8, ink: true }); gs_rect(gm, r, dx + dw, Y + 48, 12, dY - Y + 92, [40, 36, 32], L, { n: 8, ink: true });
  gs_person(gm, r, dx + dw * .5, dY + 120, 330, { view: 'front', pose: 'stand', L: [-.8, -.4], rim: cold, coat: [46, 54, 66], shirt: [210, 206, 196], hair: [34, 26, 22], hs: 'long', amb: .35, shade: .65, ambc: [10, 14, 30], rimA: .9, shadow: false });
  for (let i = 0; i < 4; i++) bristle(gm, dx + dw * .5 + r.g() * 30, dY - 60 + r() * 80, 1.2, 14, 2, [200, 200, 196], .7, r);
  // the Eye: emblem on the wall above the console
  const ex = port ? 110 : cx - 640 + 90, ey = Y + 120;
  if (!port) { gs_ell(gm, r, ex, ey, 54, 54, [140, 30, 30], L, { n: 30, ink: true, inkw: 2.4, rim: warm }); gs_ell(gm, r, ex, ey, 40, 18, [230, 220, 190], L, { n: 12, ink: true }); gm.fillStyle = css([20, 16, 16]); gm.beginPath(); gm.arc(ex, ey, 12, 0, 7); gm.fill(); }
  // the console with dials
  const dials = [];
  const cX0 = port ? -S.M : cx - 660, cW = port ? 150 : 300;
  gs_rect(gm, r, cX0, dY - 170, cW, 240, [54, 58, 52], L, { n: 80, ink: true, inkw: 2, rim: warm });
  for (let j = 0; j < 3; j++) for (let i = 0; i < (port ? 2 : 4); i++) { const x = cX0 + 40 + i * 66, y = dY - 140 + j * 60; gs_ell(gm, r, x, y, 18, 18, [230, 200, 140], L, { n: 8, ink: true, inkw: 1.6 }); dials.push([x, y, lat(i, j, 3)]); }
  // the desk and the Warden (you) pouring a second cup
  gs_rect(gm, r, -S.M, dY, W + 2 * S.M, 30, [96, 66, 42], [0, -1], { n: 160, sw: 6, ang: 0, ink: true, inkw: 2, rim: warm });
  gs_rect(gm, r, -S.M, dY + 30, W + 2 * S.M, H - dY, [44, 32, 24], L, { n: 140, sw: 8, ang: 1.57 });
  const gp = S.layer(.62, { y0: Y, y1: dY + 80 });
  const px = port ? cx - 40 : cx - 80;
  gs_person(gp, r, px, dY + 70, 420, { view: 'front', pose: 'sitPour', L: [-.5, -.8], rim: warm, coat: [104, 108, 104], shirt: [190, 186, 170], tie: [60, 60, 66], hair: [150, 146, 140], hs: 'short', amb: .5, shade: .45, collar: true, shadow: false, coatLen: 0 });
  gs_rect(gp, r, -S.M, dY, W + 2 * S.M, 80, [96, 66, 42], [0, -1], { n: 120, sw: 6, ang: 0, ink: true, inkw: 2, rim: warm });
  const tsx = px + 70, tsy = dY - 40;
  gs_rect(gp, r, tsx - 10, tsy - 60, 26, 70, [60, 80, 70], [-.5, -.8], { n: 10, ink: true, rim: warm, rot: .5 });
  gs_cup(gp, r, px - 60, dY, 1.3, [236, 230, 214], L, warm); gs_cup(gp, r, px + 110, dY, 1.3, [236, 230, 214], L, warm);
  gs_rect(gp, r, px - 200, dY - 6, 90, 6, [230, 224, 200], [0, -1], { n: 6, ink: true, inkw: .6 });
  gs_glow(gp, px + 20, dY - 60, 300, warm, .22);
  S.anim(.16, (c, t) => { gs_winFlicker(c, t, ow.filter((w, i) => i % 2 === 0), [255, 200, 120], .3); const on = Math.sin(t * .003) > 0; gs_glow(c, mast[0], mast[1], on ? 26 : 12, [255, 50, 40], on ? .9 : .3); });
  S.anim(.56, (c, t) => { for (const [x, y, k] of dials) { gs_glow(c, x, y, 26, [255, 150, 60], .18 + .1 * Math.sin(t * .002 + k * 9)); const a = -2.2 + 1.2 * (k + .1 * Math.sin(t * .001 + k * 5)) * 2; c.strokeStyle = css([120, 20, 20]); c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * 14, y + Math.sin(a) * 14); c.stroke(); } });
  S.anim(.63, (c, t) => { gs_steam(c, t, px - 60, dY - 24, 1, .3, 0); gs_steam(c, t, px + 110, dY - 24, 1, .3, .4); c.save(); c.globalAlpha = .7; c.strokeStyle = css([150, 100, 50]); c.lineWidth = 3; c.beginPath(); c.moveTo(px + 104, dY - 30); c.quadraticCurveTo(px + 108, dY - 50 + Math.sin(t * .01) * 2, px + 80, dY - 70); c.stroke(); c.restore(); });
};

/* ======================================================== THE CONFESSION (martyr): pencil on the wall, painted over, written again */
GS.end_martyr = function (S, r) {
  const W = S.W, H = S.H, Y = gs_stage(S), cx = W / 2, port = S.port;
  const L = [-.7, -.7], moon = [200, 220, 255], fY = Y + 560;
  const g = S.layer(.2);
  gs_wash(g, r, -S.M, -S.M, W + 2 * S.M, fY + S.M, [[0, [70, 80, 96]], [.6, [130, 140, 150]], [1, [96, 104, 116]]], { n: 900, ang: 1.57, sl: [40, 160], sw: [10, 26] });
  // painted-over patches (fresher paint), the corner
  const cX = port ? cx + 200 : cx + 330;
  for (let i = 0; i < 7; i++) { g.save(); g.globalAlpha = .35; gs_rect(g, r, cX - r.r(60, 300), Y + r.r(60, 360), r.r(60, 140), r.r(40, 110), [146, 154, 162], L, { n: 20, sw: 8, edge: false }); g.restore(); }
  g.fillStyle = gs_grad(g, cX, 0, cX + 200, 0, [[0, [60, 66, 80], .5], [1, [30, 34, 46], .8]]); g.fillRect(cX, -S.M, W + S.M - cX, fY + S.M);
  g.strokeStyle = css([40, 44, 56], .6); g.lineWidth = 3; g.beginPath(); g.moveTo(cX, -S.M); g.lineTo(cX, fY); g.stroke();
  // the small pencil writing, low in the corner
  for (let k = 0; k < 16; k++) { g.strokeStyle = css([50, 50, 56], .7); g.lineWidth = .9; g.beginPath(); let x = cX - 150, y = Y + 300 + k * 9; g.moveTo(x, y); while (x < cX - 8) { x += r.r(3, 7); g.lineTo(x, y + r.g() * 1.5); } g.stroke(); }
  // high barred window, snow outside
  const wx = port ? cx - 250 : cx - 380, wy = Y + 40, ww = 120, wh = 90;
  g.fillStyle = gs_grad(g, 0, wy, 0, wy + wh, [[0, [20, 30, 56]], [1, [60, 70, 100]]]); g.fillRect(wx, wy, ww, wh);
  gs_ell(g, r, wx + 86, wy + 26, 12, 12, [240, 244, 255], [0, 1], { n: 6, edge: false });
  // floor
  g.fillStyle = gs_grad(g, 0, fY, 0, H + S.M, [[0, [74, 80, 92]], [1, [24, 26, 32]]]); g.fillRect(-S.M, fY, W + 2 * S.M, H - fY + S.M);
  const gm = S.layer(.55);
  for (let i = 0; i <= 4; i++) { gm.fillStyle = css([30, 30, 36]); gm.fillRect(wx + i * ww / 4 - 3, wy, 6, wh); }
  gs_rect(gm, r, wx - 8, wy - 8, ww + 16, 8, [60, 64, 72], L, { n: 6, ink: true }); gs_rect(gm, r, wx - 8, wy + wh, ww + 16, 10, [60, 64, 72], L, { n: 6, ink: true });
  gs_beam(gm, wx + ww / 2, wy + wh / 2, ww, port ? cx + 40 : cx + 100, fY - 40, 300, moon, .16, .04);
  // the door with the hatch open: warm corridor, a boy with a pencil stub reading
  const dx = port ? 30 : cx - 600, dw = 170;
  if (!port || true) {
    gs_rect(gm, r, dx, Y + 120, dw, fY - Y - 120, [80, 84, 90], L, { n: 80, sw: 8, ang: 1.57, ink: true, inkw: 2.4, rim: [230, 236, 255] });
    const hx = dx + 40, hy = Y + 220; gm.fillStyle = css([255, 190, 110]); gm.fillRect(hx, hy, 90, 50);
    gs_person(gm, r, hx + 45, hy + 248, 230, { view: 'front', pose: 'stand', L: [0, -1], rim: [255, 200, 130], coat: [200, 196, 186], hair: [60, 40, 30], hs: 'short', amb: .3, shade: .7, shadow: false, alpha: 1 });
    gm.save(); gm.globalCompositeOperation = 'destination-over'; gm.restore();
    // mask the boy to the hatch: repaint door around hatch
    gs_rect(gm, r, dx, hy + 50, dw, fY - hy - 50, [80, 84, 90], L, { n: 60, sw: 8, ang: 1.57, ink: true, inkw: 2.4, rim: [230, 236, 255] });
    gs_rect(gm, r, dx, Y + 120, 40, hy + 50 - Y - 120, [80, 84, 90], L, { n: 14, sw: 6, ang: 1.57, edge: false }); gs_rect(gm, r, hx + 90, Y + 120, dw - 130, hy + 50 - Y - 120, [80, 84, 90], L, { n: 14, sw: 6, ang: 1.57, edge: false });
    gs_rect(gm, r, dx, Y + 120, dw, hy - Y - 120, [80, 84, 90], L, { n: 20, sw: 6, ang: 1.57, edge: false });
    gm.strokeStyle = css([30, 30, 34]); gm.lineWidth = 4; gm.strokeRect(hx, hy, 90, 50); gm.strokeRect(dx, Y + 120, dw, fY - Y - 120);
    gs_glow(gm, hx + 45, hy + 25, 120, [255, 180, 100], .3);
    S.hatch = [hx + 45, hy + 25];
  }
  // the iron bed and the prisoner, writing in the corner
  const bx = cX - 330;
  gs_rect(gm, r, bx, fY - 90, 320, 22, [190, 196, 200], L, { n: 30, ink: true, rim: [240, 246, 255], ang: 0 });
  gs_rect(gm, r, bx, fY - 68, 320, 8, [40, 42, 48], L, { n: 10, ink: true }); for (const lx of [bx + 6, bx + 306]) { gm.fillStyle = css([40, 42, 48]); gm.fillRect(lx, fY - 68, 6, 68); }
  gm.strokeStyle = css([40, 42, 48]); gm.lineWidth = 5; gm.beginPath(); gm.moveTo(bx + 4, fY); gm.lineTo(bx + 4, fY - 160); gm.lineTo(bx + 40, fY - 160); gm.lineTo(bx + 40, fY - 80); gm.stroke();
  gs_person(gm, r, bx + 170, fY - 4, 330, { view: 'side', pose: 'sitWrite', dir: 1, L: [-.7, -.6], rim: moon, coat: [190, 192, 196], trousers: [170, 172, 178], skin: '#d4a184', hair: [40, 30, 26], hs: 'short', amb: .5, shade: .5, shadow: false, rimA: .8 });
  S.anim(.56, (c, t) => { gs_motes(c, t, wx - 20, wy - 20, ww + 40, wh + 40, 30, [255, 255, 255], .8, 2); if (S.hatch) gs_glow(c, S.hatch[0], S.hatch[1], 90, [255, 190, 110], .12 + .05 * Math.sin(t * .002)); const b = .7 + .3 * Math.sin(t * .0004); gs_beam(c, wx + ww / 2, wy + wh / 2, ww, port ? cx + 40 : cx + 100, fY - 40, 300, moon, .04 * b, 0, true); });
};

/* ======================================================== THE SILENCE (silenced): eleven dark hours; a bell with its rope cut */
GS.end_silenced = function (S, r) {
  const W = S.W, H = S.H, Y = gs_stage(S), cx = W / 2, port = S.port;
  const gy = Y + 470, L = [.3, -1], candle = [255, 170, 80];
  const g = S.layer(.15);
  gs_wash(g, r, -S.M, -S.M, W + 2 * S.M, gy + S.M, [[0, [4, 6, 16]], [.6, [12, 18, 38]], [1, [26, 30, 50]]], { n: 600, sl: [100, 300] });
  for (let i = 0; i < 520; i++) { const x = r() * (W + 2 * S.M) - S.M, y = r() * (gy - 40); const band = Math.exp(-Math.pow((y - (gy * .5 - (x - cx) * .25)) / 90, 2)); if (r() > .45 + band * .5) continue; g.fillStyle = css([230, 230, 255], r.r(.25, .9)); const sz = r() < .08 ? 2.2 : 1.1; g.fillRect(x, y, sz, sz); }
  for (let i = 0; i < 60; i++) gs_glow(g, cx + r.g() * 500, gy * .5 - r.g() * 140, r.r(30, 90), [120, 130, 180], .04);
  const gb = S.layer(.4, { y0: gy - 380, y1: gy + 20 });
  const cands = [];
  for (let x = -S.M - 20; x < W + S.M; x += r.r(70, 140)) { const h = r.r(150, 340), w = r.r(70, 130); const ws = gs_block(gb, r, x, gy + 10, w, h, [16, 18, 30], [0, -1], { lit: .12, ww: 12, wh: 16, gx: 12, gyy: 16, col: [255, 160, 70], all: false, edge: false, rim: [60, 70, 110], dark: [10, 12, 22] }); cands.push(...ws); }
  // dead poles, horns silent
  for (const px of [cx - (port ? 220 : 480), cx + (port ? 230 : 520)]) { gs_pole(gb, r, px, gy + 10, 360, L, [18, 18, 24]); gs_horn(gb, r, px + 8, gy - 300, 1.2, -.3, L, [20, 20, 26]); gs_horn(gb, r, px - 8, gy - 294, 1.2, Math.PI + .3, L, [20, 20, 26]); }
  // the dye-works wall and the mural: a bell with its rope cut
  const gf = S.layer(1.0, { y0: gy - 40, y1: H + S.M });
  gs_rect(gf, r, -S.M, gy - 20, W + 2 * S.M, H - gy + S.M + 20, [44, 30, 30], [0, -1], { n: 700, sw: 8, ang: 0, ink: false, alt: [60, 40, 44], la: .2, sa: .5 });
  for (let row = 0; row < 40; row++) for (let x = -S.M + (row % 2) * 24; x < W + S.M; x += 48) { gf.fillStyle = css([20, 14, 16], .25); gf.fillRect(x, gy - 20 + row * 18, 46, 2); }
  const mx = port ? cx : cx + 40, my = gy + 140;
  gs_poly(gf, r, [[mx - 26, my - 74], [mx + 26, my - 74], [mx + 40, my - 30], [mx + 54, my + 40], [mx + 86, my + 70], [mx - 86, my + 70], [mx - 54, my + 40], [mx - 40, my - 30]], [214, 200, 160], [.3, -1], { n: 80, sw: 6, ang: 1.57, ink: true, inkw: 4, inkc: [30, 20, 20], edge: false, alt: [240, 230, 200] });
  gs_ell(gf, r, mx, my + 82, 18, 14, [214, 200, 160], [0, -1], { n: 10, ink: true, inkw: 3, edge: false });
  gf.strokeStyle = css([214, 200, 160], .95); gf.lineWidth = 6; gf.lineCap = 'round'; gf.beginPath(); gf.moveTo(mx, my - 74); gf.lineTo(mx, my - 150); gf.moveTo(mx, my - 200); gf.lineTo(mx + 3, my - 270); gf.stroke();
  for (const [yy, d] of [[my - 150, 1], [my - 200, -1]]) for (let k = -2; k <= 2; k++) { gf.lineWidth = 2; gf.beginPath(); gf.moveTo(mx, yy); gf.lineTo(mx + k * 5, yy + d * 14); gf.stroke(); }
  // painted over once, painted again: the ghost of a grey square behind it
  gf.save(); gf.globalAlpha = .12; for (let i = 0; i < 40; i++) bristle(gf, mx + r.g() * 160, my - 60 + r.g() * 130, r.g() * .3, r.r(40, 120), r.r(8, 18), [90, 84, 84], .5, r); gf.restore();
  // a doorway with people and a candle
  const dX = port ? 60 : cx - 420, dYY = gy + 40;
  gf.fillStyle = css([8, 6, 8]); gf.fillRect(dX, dYY, 120, 220);
  gs_glow(gf, dX + 60, dYY + 120, 140, candle, .45);
  gs_person(gf, r, dX + 40, dYY + 230, 190, { view: 'front', pose: 'wipe', L: [0, 1], rim: candle, coat: [60, 46, 40], hs: 'bun', hair: [50, 36, 30], amb: .35, shade: .55, shadow: false, ambc: [6, 6, 14] });
  gs_person(gf, r, dX + 86, dYY + 236, 160, { view: 'front', pose: 'stand', L: [-.6, .6], rim: candle, coat: [40, 44, 56], hs: 'cap', hair: [30, 26, 22], amb: .35, shade: .6, shadow: false, ambc: [6, 6, 14] });
  const cpos = [dX + 40, dYY + 230 - 190 / 7.5 * 4.7];
  gs_rect(gf, r, cpos[0] - 3, cpos[1] - 14, 6, 14, [236, 226, 200], [0, -1], { n: 4, edge: false });
  S.anim(.41, (c, t) => { for (let i = 0; i < cands.length; i++) { const w = cands[i]; gs_glow(c, w.x + w.w / 2, w.y + w.h * .6, 26 + 6 * Math.sin(t * .009 + w.ph), candle, .3 + .15 * Math.sin(t * .013 + w.ph * 3)); } });
  S.anim(.16, (c, t) => { for (let i = 0; i < 24; i++) { const x = lat(i, 1, 77) * W, y = lat(i, 2, 77) * (gy - 60); const a = .5 + .5 * Math.sin(t * .003 * (1 + lat(i, 3, 7)) + i); c.fillStyle = css([240, 240, 255], a * .8); c.fillRect(x - 1, y - 1, 2.2, 2.2); } });
  S.anim(1.01, (c, t) => { const f = .8 + .2 * Math.sin(t * .02) * Math.sin(t * .007); gs_glow(c, cpos[0], cpos[1] - 18, 60, candle, .6 * f); gs_ell2(c, cpos[0], cpos[1] - 18, f); });
};
function gs_ell2(c, x, y, f) { c.fillStyle = css([255, 236, 180], .95); c.beginPath(); c.ellipse(x, y, 2.5, 6 * f, 0, 0, 7); c.fill(); }

/* ======================================================== THE NIGHT TRAM (exodus): the terminus café at four in the morning */
GS.end_exodus = function (S, r) {
  const W = S.W, H = S.H, Y = gs_stage(S), cx = W / 2, port = S.port;
  const L = [.3, -.9], warm = [255, 196, 120], dY = Y + 470;
  const wy0 = Y + 30, wy1 = Y + 330;
  const g = S.layer(.15);
  gs_wash(g, r, -S.M, -S.M, W + 2 * S.M, wy1 + 80, [[0, [20, 30, 60]], [.6, [60, 76, 110]], [.85, [140, 120, 130]], [1, [70, 80, 100]]], { n: 500 });
  // across the river: the district, tiny, with its tower; the bridge; water
  const hz = wy1 - 70;
  for (let x = -S.M; x < W + S.M; x += r.r(20, 40)) { const h = r.r(10, 40); g.fillStyle = css([40, 46, 70]); g.fillRect(x, hz - h, r.r(16, 36), h); }
  const tX = port ? cx + 140 : cx + 260; g.fillStyle = css([40, 46, 70]); g.fillRect(tX - 5, hz - 70, 10, 70); g.beginPath(); g.moveTo(tX - 7, hz - 70); g.lineTo(tX, hz - 92); g.lineTo(tX + 7, hz - 70); g.fill();
  g.fillStyle = gs_grad(g, 0, hz, 0, wy1 + 80, [[0, [50, 60, 90]], [1, [20, 26, 44]]]); g.fillRect(-S.M, hz, W + 2 * S.M, wy1 + 80 - hz);
  g.strokeStyle = css([20, 22, 34]); g.lineWidth = 4; g.beginPath(); g.moveTo(-S.M, hz + 10); g.lineTo(W + S.M, hz + 4); g.stroke();
  for (let x = -S.M; x < W + S.M; x += 90) { g.lineWidth = 2; g.beginPath(); g.moveTo(x, hz + 8); g.quadraticCurveTo(x + 45, hz - 24, x + 90, hz + 7); g.stroke(); g.beginPath(); g.moveTo(x + 45, hz - 16); g.lineTo(x + 45, hz + 30); g.stroke(); }
  // the night tram at the terminus, lit windows
  const trX = port ? cx - 200 : cx - 360, trY = wy1 + 10;
  gs_rect(g, r, trX, trY - 70, 300, 64, [130, 40, 34], [.3, -.9], { n: 60, ink: true, inkw: 2, rim: [255, 200, 160] });
  const tw = []; for (let i = 0; i < 6; i++) { const wx = trX + 14 + i * 46; gs_window(g, r, wx, trY - 60, 34, 26, true, { col: [255, 214, 140], mull: false, sill: false }); tw.push({ x: wx, y: trY - 60, w: 34, h: 26, ph: i, fl: .3 }); }
  g.strokeStyle = css([20, 18, 20]); g.lineWidth = 2; g.beginPath(); g.moveTo(trX + 150, trY - 70); g.lineTo(trX + 120, trY - 110); g.moveTo(-S.M, trY - 112); g.lineTo(W + S.M, trY - 110); g.stroke();
  // the café: window frame, counter, radio, the woman in the apron
  const gm = S.layer(.55);
  gm.save(); gm.beginPath(); gm.rect(-S.M, -S.M, W + 2 * S.M, H + 2 * S.M); gm.rect(W + S.M, wy0, -W - 2 * S.M, wy1 - wy0); gm.clip('evenodd');
  gs_wash(gm, r, -S.M, -S.M, W + 2 * S.M, H + 2 * S.M, [[0, [70, 54, 40]], [.5, [140, 104, 64]], [1, [60, 44, 34]]], { n: 700, ang: 1.57 });
  gm.restore();
  for (let x = -S.M; x < W + S.M; x += 210) gs_rect(gm, r, x, wy0, 14, wy1 - wy0, [60, 46, 34], L, { n: 8, ink: true, rim: warm });
  gs_rect(gm, r, -S.M, wy1, W + 2 * S.M, 16, [90, 70, 50], L, { n: 30, ink: true, rim: warm, ang: 0 });
  gs_text(gm, r, 'TERMINUS', port ? cx : cx + 300, wy0 + 40, 38, [255, 220, 160], { font: 'Georgia, serif', sx: -1, a: .22, passes: 1 });
  // pendant lamps
  const lamps = port ? [cx - 160, cx + 160] : [cx - 360, cx, cx + 360];
  for (const lx of lamps) { gm.strokeStyle = css([20, 16, 14]); gm.lineWidth = 2; gm.beginPath(); gm.moveTo(lx, -S.M); gm.lineTo(lx, Y + 10); gm.stroke(); gs_poly(gm, r, [[lx - 10, Y + 6], [lx + 10, Y + 6], [lx + 30, Y + 30], [lx - 30, Y + 30]], [40, 70, 50], [0, -1], { n: 8, ink: true }); }
  // counter at right and the woman
  const ctX = port ? cx + 40 : cx + 160;
  const woman = gs_person(gm, r, ctX + (port ? 150 : 220), dY + 30, 360, { view: 'front', pose: 'wipe', L: [-.5, -.8], rim: warm, coat: [90, 70, 80], shirt: [230, 222, 206], skin: '#e2b89a', hs: 'bun', hair: [80, 50, 36], amb: .55, shade: .4, shadow: false, coatLen: .9 });
  gs_poly(gm, r, [[woman.neck[0] - 30, woman.neck[1] + 40], [woman.neck[0] + 30, woman.neck[1] + 40], [woman.neck[0] + 40, dY], [woman.neck[0] - 40, dY]], [236, 230, 214], L, { n: 14, rim: warm, edge: false });
  gs_cup(gm, r, (woman.hands[0][0] + woman.hands[1][0]) / 2, woman.hands[0][1] + 10, 1.2, [200, 220, 230], L, warm);
  gs_rect(gm, r, ctX, dY - 60, W + S.M - ctX, 24, [180, 184, 186], [0, -1], { n: 60, ang: 0, ink: true, inkw: 2, rim: [255, 240, 220] });
  gs_rect(gm, r, ctX, dY - 36, W + S.M - ctX, H - dY + 60, [70, 50, 40], L, { n: 100, ink: true, ang: 1.57 });
  const rdX = ctX + 50; gs_rect(gm, r, rdX, dY - 120, 90, 60, [110, 70, 40], L, { n: 20, ink: true, inkw: 2, rim: warm }); gs_rect(gm, r, rdX + 10, dY - 110, 46, 38, [200, 170, 110], L, { n: 8, ink: true });
  // the zinc table, the student in a coat, the apricot pastry
  const gp = S.layer(.75, { y0: Y + 60, y1: H + S.M });
  const tbX = port ? cx - 150 : cx - 220;
  gs_chair(gp, r, tbX - 110, dY + 150, 1.15, [60, 40, 30], 1, [.8, -.5], warm);
  gs_person(gp, r, tbX - 110, dY + 150, 400, { view: 'side', pose: 'sit', dir: 1, L: [.8, -.5], rim: warm, coat: [46, 54, 66], hair: [30, 24, 20], hs: 'short', coatLen: .5, amb: .5, shade: .45, collar: true, rimA: .85 });
  gs_ell(gp, r, tbX + 60, dY + 10, 140, 18, [176, 180, 182], [0, -1], { n: 30, ink: true, inkw: 2, rim: [255, 240, 220] });
  gp.fillStyle = css([30, 26, 24]); gp.fillRect(tbX + 56, dY + 24, 8, 140);
  gs_ell(gp, r, tbX + 60, dY + 4, 36, 8, [236, 232, 220], [0, -1], { n: 8, ink: true }); gs_ell(gp, r, tbX + 58, dY - 2, 20, 8, [226, 150, 60], [0, -1], { n: 10, ink: true, rim: [255, 220, 150] });
  gs_cup(gp, r, tbX + 120, dY + 6, 1.4, [236, 232, 220], L, warm);
  S.anim(.16, (c, t) => { gs_winFlicker(c, t, tw, [255, 214, 140], .3); c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 30; i++) { const x = lat(i, 9, 3) * W, y = hz + 14 + lat(i, 8, 3) * 50; c.fillStyle = css([255, 214, 160], .12 + .1 * Math.sin(t * .003 + i)); c.fillRect(x + Math.sin(t * .001 + i) * 6, y, 14, 1.5); } c.restore(); });
  S.anim(.56, (c, t) => { for (const lx of lamps) gs_glow(c, lx, Y + 34, 160, warm, .35); gs_rings(c, t, rdX + 72, dY - 90, [255, 220, 170], .1, .0005, 70, 1); });
  S.anim(.76, (c, t) => { gs_steam(c, t, tbX + 120, dY - 16, 1.1, .3, 0); });
};

/* ========================================================== EXPORT */
const _renderers = new Map();
const Art = {
  TW: TW, TH: TH, version: '2.0',
  quality: { grain: true },
  project: project, unproject: unproject, worldSize: worldSize,
  getRenderer: function (loc) {
    loc = loc || {}; const k = loc.id || 'x';
    let R = _renderers.get(k); if (!R) { R = makeRenderer(loc); _renderers.set(k, R); }
    R.loc = loc; return R;
  },
  drawPortrait: function (canvas, look, opts) { return typeof drawPortraitImpl === 'function' ? drawPortraitImpl(canvas, look, opts) : null; },
  portraitDataURL: function (look, opts, size) { const c = mk(size || 128, size || 128); Art.drawPortrait(c, look, opts); return c.toDataURL('image/png'); },
  drawTitle: function (ctx, w, h, t) { return typeof drawTitleImpl === 'function' ? drawTitleImpl(ctx, w, h, t) : null; },
  drawEnding: function (ctx, w, h, t, id) { return typeof drawEndingImpl === 'function' ? drawEndingImpl(ctx, w, h, t, id) : null; },
  drawDayCard: function (ctx, w, h, t, dayN) { return typeof drawDayCardImpl === 'function' ? drawDayCardImpl(ctx, w, h, t, dayN) : null; },
  drawItemIcon: function (ctx, x, y, size, id) { return typeof drawItemIconImpl === 'function' ? drawItemIconImpl(ctx, x, y, size, id) : null; },
  /* helpers for tools / engine */
  getFigure: getFigure,
  timeTint: timeTint,
  prebake: function (loc, time) { return Art.getRenderer(loc).prebake(time); },
  clearCache: function () { _scenes.clear(); _spr.clear(); _tab.clear(); _cards.clear(); }
};
(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this)).Art = Art;
})();
