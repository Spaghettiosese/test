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
function matCanvas(w, h, ks, fn) {
  const W = Math.max(1, Math.ceil(w * ks)), H = Math.max(1, Math.ceil(h * ks)), c = mk(W, H), g = ctx2(c), id = g.createImageData(W, H), d = id.data, o = [0, 0, 0];
  for (let y = 0, i = 0; y < H; y++) {
    const v = (y + .5) / ks;
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
    id.data[k + 3] = Math.min(255, v * v * 150);
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
