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
const MOODS = {
  umber: { amb: [.86, .76, .66], bake: [.97, .90, .80], glow: [255, 170, 90], floorMix: [120, 80, 50] },
  warm:  { amb: [.98, .86, .72], bake: [1.0, .95, .86], glow: [255, 150, 70], floorMix: [150, 90, 40] },
  cold:  { amb: [.76, .88, .95], bake: [.88, .96, 1.0], glow: [255, 190, 120], floorMix: [60, 100, 110] },
  dusk:  { amb: [.82, .88, .96], bake: [.90, .96, 1.0], glow: [255, 140, 70], floorMix: [60, 80, 90] },
  sick:  { amb: [.80, .94, .72], bake: [.92, 1.0, .88], glow: [220, 230, 130], floorMix: [80, 110, 70] },
  ember: { amb: [.62, .53, .50], bake: [.9, .82, .78], glow: [255, 120, 40], floorMix: [90, 40, 20] }
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
    if (m === 'warm') return { a: [218, 190, 134], b: [200, 104, 52], c: [60, 124, 120], d: [150, 60, 40] };
    if (m === 'cold') return { a: [150, 168, 150], b: [96, 124, 122], c: [190, 176, 130], d: [70, 96, 100] };
    return { a: [180, 176, 140], b: [110, 130, 110], c: [190, 150, 90], d: [80, 100, 90] };
  }
  return null;
}
function paintFloor(ctx, S) {
  const loc = S.loc, r = S.r, W = lw(loc) * 64, H = lh(loc) * 64, type = loc.floor || 'wood';
  ctx.save(); floorFrame(ctx, S);
  ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  const gr = (c) => mul(C(c), S.mood.bake);
  ctx.fillStyle = css(gr([60, 44, 38])); ctx.fillRect(0, 0, W, H);
  if (type === 'wood') {
    const base = [[150, 104, 62], [132, 88, 54], [162, 116, 72], [118, 78, 50]];
    for (let v = 0, row = 0; v < H; v += 15, row++) {
      let u = -r() * 120;
      while (u < W) {
        const len = r.r(110, 280), c = jit(gr(r.p(base)), r, .1);
        const x0 = Math.max(0, u), x1 = Math.min(W, u + len);
        if (x1 > x0) {
          paintRect(ctx, x0, v, x1 - x0, 14, c, r, { ang: 0, aj: .05, sw: 2.4, sl: 70, n: (x1 - x0) / 7, jv: .13, alt: [190, 140, 80], ha: .5, ew: 1, light: [0, -1], la: .7 });
          if (r() < .35) { ctx.fillStyle = css(gr([40, 24, 18]), .18); ctx.fillRect(x0 + r() * (x1 - x0), v + r() * 12, r.r(8, 26), 1.5); }
          ctx.fillStyle = css(gr([22, 14, 12]), .7); ctx.fillRect(x1 - 1, v, 1.6, 14);
          if (r() < .5) { ctx.fillStyle = css([20, 12, 10], .55); ctx.fillRect(x0 + 4, v + 6, 1.6, 1.6); ctx.fillRect(x1 - 5, v + 6, 1.6, 1.6); }
        }
        u += len;
      }
      ctx.fillStyle = css(gr([20, 12, 10]), .65); ctx.fillRect(0, v + 13.4, W, 1.6);
    }
  } else if (type === 'checker') {
    const P = floorPal(S);
    for (let j = 0; j < lh(loc); j++) for (let i = 0; i < lw(loc); i++) {
      const par = (i + j) & 1, hr = lat(i, j, S.seed);
      let c = par ? P.b : P.a;
      if (hr < .1) c = P.c; else if (hr > .94) c = P.d;
      c = jit(gr(c), r, .1);
      paintRect(ctx, i * 64 + 1, j * 64 + 1, 62, 62, c, r, { n: 22, sw: 4, sl: 30, ang: (par ? .3 : -.9) + r.g() * .15, alt: par ? [230, 130, 60] : [90, 150, 140], jv: .12, ha: .55, la: .4, ew: 1.4 });
      // worn centre / chips
      if (r() < .4) { ctx.fillStyle = css([255, 240, 200], .08); ctx.beginPath(); ctx.ellipse(i * 64 + r.r(16, 48), j * 64 + r.r(16, 48), r.r(6, 16), r.r(5, 12), r() * 3, 0, 7); ctx.fill(); }
      if (r() < .12) { ctx.strokeStyle = css([30, 20, 20], .5); ctx.lineWidth = 1; ctx.beginPath(); const x = i * 64 + r.r(8, 56), y = j * 64 + r.r(8, 56); ctx.moveTo(x, y); ctx.lineTo(x + r.r(-18, 18), y + r.r(-18, 18)); ctx.lineTo(x + r.r(-24, 24), y + r.r(-24, 24)); ctx.stroke(); }
    }
    // grout lines
    ctx.strokeStyle = css(gr([34, 26, 24]), .75); ctx.lineWidth = 1.7;
    ctx.beginPath(); for (let i = 0; i <= lw(loc); i++) { ctx.moveTo(i * 64, 0); ctx.lineTo(i * 64, H); } for (let j = 0; j <= lh(loc); j++) { ctx.moveTo(0, j * 64); ctx.lineTo(W, j * 64); } ctx.stroke();
    if (loc.id === 'canteen') medallion(ctx, S, 5.5 * 64, 7.5 * 64, 2.1 * 64, gr);
    if (loc.id === 'gym') gymLines(ctx, S, gr);
  } else if (type === 'cobble') {
    for (let j = 0; j < lh(loc); j++) for (let i = 0; i < lw(loc); i++) {
      for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
        const cx = i * 64 + (a + .5) * 21.3 + r.r(-3, 3), cy = j * 64 + (b + .5) * 21.3 + r.r(-3, 3), rx = r.r(8.5, 10.8), ry = r.r(8.2, 10.4);
        const t = r(), c = jit(gr(t < .5 ? [118, 120, 124] : t < .8 ? [104, 100, 100] : [134, 124, 108]), r, .12);
        paintPoly(ctx, ellPts(cx, cy, rx, ry, 9, r() * 3, r, .12), c, r, { n: 4, sw: 3.5, sl: 12, ang: r() * 3, edge: true, ew: 1.2, ink: false, alt: [90, 110, 120], jv: .1 });
      }
    }
    // moss / puddles
    for (let i = 0; i < 26; i++) { const x = r() * W, y = r() * H; ctx.fillStyle = css([70, 100, 60], .1 + r() * .1); ctx.beginPath(); ctx.ellipse(x, y, r.r(10, 40), r.r(8, 28), r() * 3, 0, 7); ctx.fill(); }
    for (let i = 0; i < 5; i++) { const x = r.r(100, W - 100), y = r.r(100, H - 100), rx = r.r(30, 60), ry = r.r(22, 40); const sk = SKY[S.bucket]; const g = ctx.createLinearGradient(x, y - ry, x, y + ry); g.addColorStop(0, css(mix(sk[0], [30, 50, 70], .3), .6)); g.addColorStop(1, css(sk[1], .55)); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, r() * 3, 0, 7); ctx.fill(); ctx.strokeStyle = css([20, 24, 30], .6); ctx.lineWidth = 1.4; ctx.stroke(); }
  } else if (type === 'tile') {
    for (let j = 0; j < lh(loc) * 2; j++) for (let i = 0; i < lw(loc) * 2; i++) {
      const par = (i + j) & 1, c = jit(gr(par ? [96, 128, 92] : [196, 190, 150]), r, .09);
      paintRect(ctx, i * 32 + .8, j * 32 + .8, 30.6, 30.6, c, r, { n: 8, sw: 3, sl: 18, ang: r() * 3, alt: [60, 90, 70], jv: .1, ha: .5, ew: 1.2 });
    }
    ctx.strokeStyle = css(gr([40, 50, 40]), .65); ctx.lineWidth = 1.2; ctx.beginPath();
    for (let i = 0; i <= lw(loc) * 2; i++) { ctx.moveTo(i * 32, 0); ctx.lineTo(i * 32, H); } for (let j = 0; j <= lh(loc) * 2; j++) { ctx.moveTo(0, j * 32); ctx.lineTo(W, j * 32); } ctx.stroke();
  } else { // concrete
    for (let j = 0; j < Math.ceil(lh(loc) / 2); j++) for (let i = 0; i < Math.ceil(lw(loc) / 2); i++) {
      const c = jit(gr([104, 104, 108]), r, .1);
      paintRect(ctx, i * 128 + 1.5, j * 128 + 1.5, 125, 125, c, r, { n: 55, sw: 7, sl: 60, ang: r() * 3, aj: 1.2, alt: [80, 84, 96], jv: .12, ha: .3, la: .3 });
    }
    ctx.strokeStyle = css([20, 18, 22], .7); ctx.lineWidth = 2;
    ctx.beginPath(); for (let i = 0; i <= lw(loc); i += 2) { ctx.moveTo(i * 64, 0); ctx.lineTo(i * 64, H); } for (let j = 0; j <= lh(loc); j += 2) { ctx.moveTo(0, j * 64); ctx.lineTo(W, j * 64); } ctx.stroke();
    for (let i = 0; i < 14; i++) { let x = r() * W, y = r() * H; ctx.strokeStyle = css([20, 18, 22], .5); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 6; k++) { x += r.r(-14, 14); y += r.r(-14, 14); ctx.lineTo(x, y); } ctx.stroke(); }
    for (let i = 0; i < 12; i++) { ctx.fillStyle = css(r() < .5 ? [20, 18, 16] : [90, 60, 30], .14 + r() * .12); ctx.beginPath(); ctx.ellipse(r() * W, r() * H, r.r(8, 34), r.r(6, 24), r() * 3, 0, 7); ctx.fill(); }
  }
  // large soft tonal blotches (glazing)
  for (let i = 0; i < 40; i++) {
    const x = r() * W, y = r() * H, s = r.r(60, 200), dark = r() < .55;
    ctx.globalAlpha = dark ? .09 : .06; ctx.drawImage(glowSprite(dark ? [10, 10, 30] : [255, 220, 160], 128), x - s / 2, y - s / 2, s, s);
  }
  ctx.globalAlpha = 1;
  // ambient occlusion by the two back walls + room edges
  let g = ctx.createLinearGradient(0, 0, 0, 56); g.addColorStop(0, 'rgba(6,4,14,.55)'); g.addColorStop(1, 'rgba(6,4,14,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 56);
  g = ctx.createLinearGradient(0, 0, 56, 0); g.addColorStop(0, 'rgba(6,4,14,.6)'); g.addColorStop(1, 'rgba(6,4,14,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 56, H);
  ctx.restore();
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
    }
  }
  // star in the middle
  ctx.fillStyle = css([226, 200, 150], .95); ctx.beginPath();
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.2832 - 1.57, rr = i % 2 ? R * .07 : R * .2; ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.strokeStyle = css([30, 24, 24], .8); ctx.lineWidth = 1.2; ctx.stroke();
}
function gymLines(ctx, S, gr) {
  const loc = S.loc, W = lw(loc) * 64, H = lh(loc) * 64;
  ctx.save(); ctx.globalAlpha = .55; ctx.strokeStyle = css([226, 214, 160], 1); ctx.lineWidth = 3;
  ctx.strokeRect(70, 70, W - 140, H - 140); ctx.beginPath(); ctx.moveTo(W / 2, 70); ctx.lineTo(W / 2, H - 70); ctx.stroke();
  ctx.beginPath(); ctx.arc(W / 2, H / 2, 90, 0, 7); ctx.stroke(); ctx.strokeStyle = css([190, 80, 60], 1);
  ctx.beginPath(); ctx.arc(8.5 * 64, 3.5 * 64, 120, 0, 3.14); ctx.stroke(); ctx.restore();
}
function paintFloorEdge(ctx, S) {
  const loc = S.loc, w = lw(loc), h = lh(loc), r = S.r;
  const a = gp(S, w, 0), b = gp(S, w, h), c = gp(S, 0, h);
  const col = mul([70, 50, 44], S.mood.bake);
  paintPoly(ctx, [a, b, [b[0], b[1] + EDGE], [a[0], a[1] + EDGE]], mul(col, .8), r, { n: 30, sw: 3, ang: 1.57, aj: .3, ink: true });
  paintPoly(ctx, [b, c, [c[0], c[1] + EDGE], [b[0], b[1] + EDGE]], mul(col, .55), r, { n: 30, sw: 3, ang: 1.57, aj: .3, ink: true });
}

/* ------------------------------------------------------------------- walls */
function wallPal(S) {
  const t = S.loc.wall || 'plaster', m = S.loc.mood;
  if (t === 'brick') return m === 'warm' ? { b: [176, 84, 48], m: [74, 54, 44] } : m === 'ember' ? { b: [120, 56, 40], m: [40, 28, 28] } : { b: [136, 78, 58], m: [64, 52, 48] };
  if (m === 'sick') return { top: [196, 206, 160], dado: [74, 120, 84] };
  if (m === 'cold') return { top: [170, 184, 168], dado: [58, 100, 92] };
  if (m === 'umber') return { top: [176, 146, 100], dado: [110, 78, 52] };
  return { top: [186, 170, 130], dado: [78, 112, 82] };
}
function paintWall(ctx, S, side) {
  const loc = S.loc, r = S.r, len = (side === 'l' ? lh(loc) : lw(loc)) * 64, P = wallPal(S), brick = loc.wall === 'brick';
  const gr = (c) => mul(C(c), S.mood.bake) , dark = side === 'l' ? .72 : 1.0;
  ctx.save(); wallFrame(ctx, S, side); ctx.beginPath(); ctx.rect(0, 0, len, WALLH); ctx.clip();
  if (brick) {
    ctx.fillStyle = css(gr(P.m)); ctx.fillRect(0, 0, len, WALLH);
    const bh = 10, bw = 30;
    for (let row = 0, v = 0; v < WALLH; row++, v += bh) {
      let u = (row & 1) ? -bw / 2 : 0;
      for (; u < len; u += bw) {
        const c = mul(jit(gr(P.b), r, .14), dark * (.85 + .15 * noise(u / 90, v / 60, S.seed)));
        paintRect(ctx, u + 1, v + 1, bw - 2, bh - 1.6, c, r, { n: 2, sw: 3, sl: 14, ang: 0, aj: .12, alt: r() < .3 ? [150, 60, 40] : [210, 120, 70], jv: .1, ew: 1, ha: .55, la: .5, light: [0, -1] });
      }
    }
  } else {
    const dado = WALLH * .52;
    paintRect(ctx, 0, 0, len, dado + 2, mul(gr(P.top), dark), r, { n: len / 3, sw: 9, sl: 70, ang: .06, aj: .35, jv: .08, alt: [220, 200, 150], edge: false });
    paintRect(ctx, 0, dado, len, WALLH - dado, mul(gr(P.dado), dark), r, { n: len / 3, sw: 8, sl: 70, ang: .05, aj: .3, jv: .09, alt: [30, 70, 60], edge: false });
    ctx.fillStyle = css(gr([20, 30, 24]), .85); ctx.fillRect(0, dado - 1, len, 3.2); ctx.fillStyle = css([230, 220, 170], .35); ctx.fillRect(0, dado - 2.4, len, 1.4);
    // peeling patches, cracks
    for (let i = 0; i < len / 90; i++) {
      const x = r() * len, y = r.r(8, WALLH - 30), pts = ellPts(x, y, r.r(8, 22), r.r(6, 16), 9, r() * 3, r, .5);
      paintPoly(ctx, pts, mul(gr([150, 120, 96]), dark), r, { n: 6, sw: 4, ang: r() * 3, ink: false, alt: [100, 70, 60], jv: .2 });
    }
    for (let i = 0; i < len / 70; i++) { let x = r() * len, y = r.r(0, WALLH * .5); ctx.strokeStyle = css([26, 20, 20], .55); ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 6; k++) { x += r.r(-5, 5); y += r.r(5, 14); ctx.lineTo(x, y); } ctx.stroke(); }
  }
  // damp / grime
  for (let i = 0; i < len / 40; i++) { const x = r() * len, y = r.r(WALLH * .5, WALLH), s = r.r(40, 110); ctx.globalAlpha = .12; ctx.drawImage(glowSprite([20, 16, 10], 128), x - s / 2, y - s / 2, s, s * .8); }
  for (let i = 0; i < len / 60; i++) { const x = r() * len, y = r.r(0, WALLH * .7); ctx.strokeStyle = css([20, 24, 22], .1 + r() * .1); ctx.lineWidth = r.r(1.5, 5); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + r.r(-2, 2), y + r.r(20, 70)); ctx.stroke(); }
  ctx.globalAlpha = 1;
  // ceiling shadow & floor-line shadow & vertical corner shade
  let g = ctx.createLinearGradient(0, 0, 0, 46); g.addColorStop(0, 'rgba(6,4,14,.75)'); g.addColorStop(1, 'rgba(6,4,14,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, len, 46);
  g = ctx.createLinearGradient(0, WALLH - 26, 0, WALLH); g.addColorStop(0, 'rgba(6,4,14,0)'); g.addColorStop(1, 'rgba(6,4,14,.5)'); ctx.fillStyle = g; ctx.fillRect(0, WALLH - 26, len, 26);
  g = ctx.createLinearGradient(0, 0, 80, 0); g.addColorStop(0, 'rgba(6,4,14,.5)'); g.addColorStop(1, 'rgba(6,4,14,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 80, WALLH);
  // warm light pooling from the right side (rim light on walls)
  g = ctx.createLinearGradient(len - 140, 0, len, 0); g.addColorStop(0, css(S.mood.glow, 0)); g.addColorStop(1, css(S.mood.glow, side === 'r' ? .14 : .08)); ctx.fillStyle = g; ctx.fillRect(len - 140, 0, 140, WALLH);
  // baseboard
  ctx.fillStyle = css(gr([40, 28, 26]), .9); ctx.fillRect(0, WALLH - 9, len, 9); ctx.fillStyle = css([255, 220, 170], .18); ctx.fillRect(0, WALLH - 9, len, 1.4);
  ctx.restore();
  // top cap
  ctx.save(); wallFrame(ctx, S, side);
  const cap = [[0, 0], [len, 0], [len, -9], [0, -9]];
  paintPoly(ctx, cap, mul(gr([150, 130, 108]), dark), r, { n: len / 8, sw: 3, ang: 0, aj: .1, ha: .8, ink: true });
  ctx.restore();
}

/* floor light shafts from windows/doors, dapples, dust stains: baked */
function paintLightFloor(ctx, S) {
  const loc = S.loc, r = S.r, b = S.bucket, col = DAPPLE[b], ka = DAPPLE_A[b] * S.lightK;
  ctx.save(); floorFrame(ctx, S); ctx.beginPath(); ctx.rect(0, 0, lw(loc) * 64, lh(loc) * 64); ctx.clip();
  ctx.globalCompositeOperation = 'lighter';
  for (const p of (loc.props || [])) {
    if (p.t !== 'window' || !p.side) continue;
    const u0 = (p.x || 0) * 64, u1 = ((p.x || 0) + (p.w || 1)) * 64, v0 = (p.y || 0) * 64, v1 = ((p.y || 0) + (p.h || 1)) * 64, L = 5.5 * 64;
    let poly, g;
    if (p.side === 'r') { poly = [[u0, 0], [u1, 0], [u1 + L * .55, L], [u0 + L * .55, L]]; g = ctx.createLinearGradient(0, 0, 0, L); }
    else { poly = [[0, v0], [0, v1], [L, v1 + L * .55], [L, v0 + L * .55]]; g = ctx.createLinearGradient(0, 0, L, 0); }
    g.addColorStop(0, css(col, .24 * ka)); g.addColorStop(1, css(col, 0));
    ctx.fillStyle = g; pathPoly(ctx, poly, r, 3); ctx.fill();
    // pane shadows: dark mullion bars across the shaft
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = css([8, 6, 16], .16 * ka); ctx.lineWidth = 5;
    const m = (p.side === 'r') ? [[(u0 + u1) / 2, 0, (u0 + u1) / 2 + L * .55, L]] : [[0, (v0 + v1) / 2, L, (v0 + v1) / 2 + L * .55]];
    for (const q of m) { ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(q[2], q[3]); ctx.stroke(); }
    ctx.globalCompositeOperation = 'lighter';
  }
  // dappled bokeh spots
  const n = Math.round(lw(loc) * lh(loc) * .55);
  S.dapples = [];
  for (let i = 0; i < n; i++) {
    const u = r.r(30, lw(loc) * 64 - 30), v = r.r(30, lh(loc) * 64 - 30), s = r.r(16, 64);
    const c = jit(col, r, .12);
    ctx.globalAlpha = Math.min(1, r.r(.08, .3) * ka);
    if (i % 4 === 0) ctx.drawImage(bokehSprite(c, 64), u - s / 2, v - s / 2, s, s); else { ctx.globalAlpha *= 1.4; ctx.drawImage(glowSprite(c, 128), u - s * .9, v - s * .9, s * 1.8, s * 1.8); }
    if (i % 3 === 0) { const sp = gp(S, u / 64, v / 64, 0); S.dapples.push({ x: sp[0], y: sp[1], s: s * .9, ph: r() * 6.28, col: c }); }
  }
  ctx.globalAlpha = 1; ctx.restore();
}

/* ======================================================== PROP HELPERS */
const L_DIR = [.55, -.83];
function V3(S, u, v, z) { return gp(S, u, v, z); }
/* iso box with painted faces. right face u=u1, left face v=v1 */
function fcs(g, S, r, u0, v0, u1, v1, z0, z1, col, o) {
  o = o || {}; col = C(col);
  const A = gp(S, u0, v0, z1), B = gp(S, u1, v0, z1), Cc = gp(S, u1, v1, z1), D = gp(S, u0, v1, z1);
  const A0 = gp(S, u0, v1, z0), B0 = gp(S, u1, v1, z0), C0 = gp(S, u1, v0, z0);
  const cl = mix(mul(col, o.kl || .6), [30, 50, 90], .22), cr = mix(mul(col, o.kr || .92), [255, 150, 70], .12), ct = mix(mul(col, o.kt || 1.1), [255, 210, 150], .1);
  const nk = o.nk || 1, base = { alt: o.alt, jv: o.jv === undefined ? .13 : o.jv, ink: o.ink === undefined ? true : o.ink, ew: 1.3, wob: o.wob || 0 };
  const va = o.vert ? 1.57 : null;
  const dens = o.dens || 38;
  paintPoly(g, [D, Cc, B0, A0], cl, r, Object.assign({ ang: va === null ? .46 : va, aj: .12, dens: dens / nk, sw: o.sw || 3.4 }, base));
  paintPoly(g, [Cc, B, C0, B0], cr, r, Object.assign({ ang: va === null ? 2.68 : va, aj: .12, dens: dens / nk, sw: o.sw || 3.4 }, base));
  paintPoly(g, [A, B, Cc, D], ct, r, Object.assign({ ang: o.topAng === undefined ? .46 : o.topAng, aj: .15, dens: dens / nk, sw: o.sw || 3.4 }, base));
  // orange rim on lit edges
  g.lineCap = 'round'; g.strokeStyle = css([255, 168, 80], .55); g.lineWidth = 1.8;
  g.beginPath(); g.moveTo(Cc[0], Cc[1]); g.lineTo(B[0], B[1]); g.stroke();
  g.strokeStyle = css([255, 200, 130], .45); g.beginPath(); g.moveTo(Cc[0] + .8, Cc[1]); g.lineTo(B0[0] + .8, B0[1]); g.stroke();
}
function ecx(rad) { return rad * 45.25; } function ecy(rad) { return rad * 22.6; }
function cylBody(g, S, r, cu, cv, rad, z0, z1, col, o) {
  o = o || {}; col = C(col);
  const c0 = gp(S, cu, cv, z0), c1 = gp(S, cu, cv, z1), rx = ecx(rad), ry = ecy(rad);
  const pts = []; const N = 10;
  pts.push([c1[0] - rx, c1[1]]);
  pts.push([c0[0] - rx, c0[1]]);
  for (let i = 1; i < N; i++) { const a = Math.PI - i / N * Math.PI; pts.push([c0[0] + Math.cos(a) * rx * -1 * -1, c0[1] + Math.sin(Math.PI - a) * ry]); }
  pts.push([c0[0] + rx, c0[1]]);
  pts.push([c1[0] + rx, c1[1]]);
  for (let i = N - 1; i >= 1; i--) { const a = i / N * Math.PI; pts.push([c1[0] + Math.cos(a) * rx, c1[1] + Math.sin(a) * ry]); }
  const lit = [mix(col, [255, 190, 120], .35), mix(mul(col, .45), [20, 40, 70], .3), Math.PI, .5, .55];
  paintPoly(g, pts, col, r, { ang: 1.57, aj: .08, sw: o.sw || 3, dens: o.dens || 30, lit, alt: o.alt, ink: o.ink === undefined ? true : o.ink, edge: false, ew: 1.3 });
  if (o.top !== false) paintPoly(g, ellPts(c1[0], c1[1], rx, ry, 18, 0, r, .02), o.topCol || mul(col, 1.15), r, { ang: .3, aj: .5, sw: 3, n: 20, ink: o.ink === undefined ? true : o.ink, alt: o.alt });
  return { cx: c1[0], cy: c1[1], rx, ry };
}
function vbar(g, S, r, u, v, z0, z1, wpx, col, o) {   // thin vertical post at floor point
  const a = gp(S, u, v, z0), b = gp(S, u, v, z1);
  paintPoly(g, [[a[0] - wpx / 2, b[1]], [a[0] + wpx / 2, b[1]], [a[0] + wpx / 2, a[1]], [a[0] - wpx / 2, a[1]]], col, r, Object.assign({ ang: 1.57, sw: Math.max(1.2, wpx / 2), n: 6, ew: .8, ink: true, inkw: 1.2 }, o || {}));
}
function contactShadow(g, S, u0, v0, u1, v1, k) {
  k = k || 1; g.save();
  for (let i = 0; i < 3; i++) {
    const e = .1 + i * .13, a = .15 * k;
    const pts = [gp(S, u0 - e - .05, v0 - e + .05, 0), gp(S, u1 + e - .05, v0 - e + .05, 0), gp(S, u1 + e - .05, v1 + e + .1, 0), gp(S, u0 - e - .05, v1 + e + .1, 0)];
    pts.forEach(p => { p[0] -= 3 + i * 2; p[1] += 1; });
    g.fillStyle = css([6, 4, 16], a); pathPoly(g, pts); g.fill();
  }
  g.restore();
}
function rimStroke(g, pts, col, a, w) { g.strokeStyle = css(col || [255, 170, 80], a); g.lineWidth = w || 1.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.stroke(); }
function handText(g, text, cx, cy, size, col, r, maxW, o) {
  o = o || {}; text = String(text); g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
  const font = (s) => (o.font || 'bold') + ' ' + s + 'px ' + (o.family || 'Impact, "Arial Black", "Helvetica Neue", sans-serif');
  g.font = font(size); let tw = 0; const ws = []; for (const ch of text) { const w = g.measureText(ch).width + size * .06; ws.push(w); tw += w; }
  if (maxW && tw > maxW) { size *= maxW / tw; g.font = font(size); tw = 0; for (let i = 0; i < ws.length; i++) { ws[i] *= maxW / tw || 1; } tw = 0; ws.length = 0; for (const ch of text) { const w = g.measureText(ch).width + size * .06; ws.push(w); tw += w; } }
  let x = cx - tw / 2; let i = 0;
  for (const ch of text) {
    const w = ws[i++]; if (ch !== ' ') {
      g.save(); g.translate(x + w / 2, cy + (r() - .5) * size * .1); g.rotate((r() - .5) * .14); g.scale(1, .95 + r() * .12);
      if (o.shadow !== false) { g.fillStyle = css(o.shadow || [10, 6, 10], .5); g.fillText(ch, 1.2, 1.4); }
      g.fillStyle = css(jit(C(col), r, .1), .92); g.fillText(ch, 0, 0);
      if (o.drip && r() < .25) { g.fillRect(-size * .1, size * .3, 1.5, r() * size * .5); }
      g.restore();
    } x += w;
  }
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
function lightAt(S, u, v, z, rad, col, a, fl, kind) { const p = gp(S, u, v, z); S.lights.push({ x: p[0], y: p[1], r: rad, col: C(col), a: a, fl: fl || 0, ph: S.r() * 6.28, kind: kind || 'lamp' }); }

/* ===================================================== WALL-MOUNTED PROPS */
const WALLPROPS = {};
function wallLen(p) { return (p.side === 'l' ? (p.h || 1) : (p.w || 1)); }
function wallStart(p) { return (p.side === 'l' ? (p.y || 0) : (p.x || 0)); }
function wallShadow(g, u0, u1, v0, v1, a) { g.fillStyle = css([6, 4, 16], a || .35); g.fillRect(u0 - 3, v0 + 4, u1 - u0 + 4, v1 - v0 + 2); }
function bakeWallProp(g, S, p) {
  const f = WALLPROPS[p.t]; if (!f) return false;
  const r = RNG(S.seed + hashStr(p.t + p.x + ',' + p.y + p.side)), u0 = wallStart(p) * 64, len = wallLen(p) * 64;
  g.save(); wallFrame(g, S, p.side);
  f(g, S, p, { r, u0, len, u1: u0 + len, v: (p.v | 0) % 4, side: p.side, Y: (z) => WALLH - z, uc: u0 + len / 2 });
  g.restore();
  return true;
}
function wallFootprintPoly(S, p, z0, z1) {   // screen-space parallelogram of a wall prop (for hover outline)
  const u0 = wallStart(p), u1 = u0 + wallLen(p);
  if (p.side === 'l') return [gp(S, 0, u0, z1), gp(S, 0, u1, z1), gp(S, 0, u1, z0), gp(S, 0, u0, z0)];
  return [gp(S, u0, 0, z1), gp(S, u1, 0, z1), gp(S, u1, 0, z0), gp(S, u0, 0, z0)];
}
const WALLH_TABLE = { door: 100, window: 128, lockers: 92, bookshelf: 112, vault: 80, portrait: 125, banner: 128, notice: 100, pipes: 135, pennant: 135, loudspeaker: 110, curtain: 148, radiator: 60, fence: 120, ladder: 150, chalkboard: 115 };

WALLPROPS.door = function (g, S, p, I) {
  const { r, u0, len, Y, v } = I, dw = Math.min(len - 18, v === 2 ? 118 : 74), cx = u0 + len / 2, x0 = cx - dw / 2, x1 = cx + dw / 2, top = Y(98), bot = Y(0);
  // warm light spill from beyond + frame
  paintRect(g, x0 - 8, top - 8, dw + 16, bot - top + 8, [62, 44, 38], r, { n: 30, sw: 3, ink: true, ang: 1.57, ha: .7 });
  const leaf = [[[64, 116, 84], [118, 150, 130]], [[120, 124, 126], [180, 60, 50]], [[128, 82, 52], [190, 150, 80]], [[84, 70, 60], [60, 50, 44]]][v];
  g.fillStyle = css([255, 160, 80], .85); g.fillRect(x0, top, dw, bot - top);
  if (v === 2) {
    for (let k = 0; k < 2; k++) paintRect(g, x0 + k * dw / 2 + (k ? 1 : 0), top, dw / 2 - 1, bot - top, leaf[0], r, { n: 50, sw: 4, ang: 1.57, aj: .1, alt: [190, 140, 80], ink: true, ew: 1.4 });
    for (let k = 0; k < 2; k++) for (let j = 0; j < 2; j++) paintRect(g, x0 + k * dw / 2 + 8, top + 8 + j * 44, dw / 2 - 16, 36, mul(leaf[0], .85), r, { n: 8, sw: 3, ang: 1.57, ink: true, ha: .4 });
    g.fillStyle = css(leaf[1]); g.fillRect(cx - 6, Y(46), 3, 12); g.fillRect(cx + 3, Y(46), 3, 12);
  } else if (v === 3) {
    paintRect(g, x0, Y(60), dw, 60, [90, 80, 70], r, { n: 30, ink: true });
    g.strokeStyle = css([20, 14, 12], .8); g.lineWidth = 2; for (let k = 1; k < 6; k++) { g.beginPath(); g.moveTo(x0 + k * dw / 6, Y(60)); g.lineTo(x0 + k * dw / 6, bot); g.stroke(); }
  } else {
    paintRect(g, x0 + 2, top + 2, dw - 4, bot - top - 2, leaf[0], r, { n: 70, sw: 4, ang: 1.57, aj: .08, alt: v === 0 ? [180, 200, 150] : [60, 70, 80], ink: true, ew: 1.5, ha: .6 });
    if (v === 0) {   // wired glass pane, panels
      g.fillStyle = css([200, 170, 100], .85); g.fillRect(cx - 14, top + 12, 28, 26); g.strokeStyle = css([40, 50, 40], .8); g.lineWidth = 1; for (let k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(cx - 14 + k * 7, top + 12); g.lineTo(cx - 14 + k * 7, top + 38); g.moveTo(cx - 14, top + 12 + k * 6.5); g.lineTo(cx + 14, top + 12 + k * 6.5); g.stroke(); }
      paintRect(g, x0 + 10, Y(50), dw - 20, 36, mul(leaf[0], .82), r, { n: 10, ink: true, ang: 1.57, ha: .4 });
    } else {
      g.fillStyle = css(leaf[1], .9); g.fillRect(x0 + 2, Y(34), dw - 4, 8); handText(g, 'NO ENTRY', cx, Y(66), 10, [240, 230, 210], r, dw - 16);
      for (let k = 0; k < 3; k++) { g.fillStyle = css([60, 62, 64]); g.beginPath(); g.arc(x0 + 8, Y(20 + k * 30), 2, 0, 7); g.fill(); }
    }
    g.fillStyle = css([220, 180, 90]); g.beginPath(); g.arc(x1 - 10, Y(46), 3, 0, 7); g.fill(); g.strokeStyle = css([20, 14, 10], .8); g.lineWidth = 1; g.stroke();
  }
  // lintel & sign
  paintRect(g, x0 - 12, top - 14, dw + 24, 8, [90, 70, 56], r, { n: 10, ink: true, ang: 0 });
  g.fillStyle = css([8, 6, 14], .35); g.fillRect(x0 - 12, bot - 2, dw + 24, 4);
  S.exitLights.push({ side: p.side, u: (wallStart(p) + wallLen(p) / 2) });
  const wp = gp(S, p.side === 'l' ? 0 : wallStart(p) + wallLen(p) / 2, p.side === 'l' ? wallStart(p) + wallLen(p) / 2 : 0, 48);
  S.lights.push({ x: wp[0], y: wp[1] + 20, r: 80, col: [255, 160, 80], a: .16, fl: .04, ph: r() * 6, kind: 'door' });
};
WALLPROPS.window = function (g, S, p, I) {
  const { r, u0, len, Y, v } = I, ww = Math.min(len - 22, v === 3 ? 56 : 82), cx = u0 + len / 2, x0 = cx - ww / 2, x1 = cx + ww / 2, wh = v === 3 ? 56 : 74, z0 = v === 3 ? 62 : 52, top = Y(z0 + wh), bot = Y(z0);
  wallShadow(g, x0 - 4, x1 + 4, top - 4, bot + 8, .3);
  const sk = SKY[S.bucket];
  const frame = v === 2 ? [70, 64, 60] : [196, 188, 160];
  let shape = v === 1 ? function () { g.beginPath(); g.moveTo(x0, bot); g.lineTo(x0, top + ww / 2); g.arc(cx, top + ww / 2, ww / 2, Math.PI, 0); g.lineTo(x1, bot); g.closePath(); } : v === 3 ? function () { g.beginPath(); g.ellipse(cx, (top + bot) / 2, ww / 2, wh / 2, 0, 0, 7); } : function () { g.beginPath(); g.rect(x0, top, ww, wh); };
  g.save(); shape(); g.strokeStyle = css(mul(frame, .5)); g.lineWidth = 10; g.stroke(); g.clip();
  const gg = g.createLinearGradient(0, top, 0, bot); gg.addColorStop(0, css(sk[0])); gg.addColorStop(1, css(sk[1])); g.fillStyle = gg; g.fillRect(x0 - 2, top - 2, ww + 4, wh + 4);
  // painterly sky strokes + far silhouettes
  for (let i = 0; i < 26; i++) bristle(g, x0 + r() * ww, top + r() * wh, .1 + r.g() * .2, 24, 5, mix(sk[0], sk[1], r()), .4, r);
  g.fillStyle = css(mix(sk[0], [10, 20, 30], .6), .7); for (let i = 0; i < 4; i++) { g.fillRect(x0 + i * ww / 4, bot - r.r(8, 24), ww / 4 - 4, 30); }
  if (S.bucket === 4) { g.fillStyle = css([255, 230, 190], .9); for (let i = 0; i < 5; i++) g.fillRect(x0 + r() * ww, bot - r.r(4, 20), 2, 2); }
  g.restore();
  g.save(); shape(); g.lineWidth = 4.5; g.strokeStyle = css(frame); g.stroke(); g.lineWidth = 1.4; g.strokeStyle = css(INK, .85); g.stroke(); g.restore();
  g.strokeStyle = css(frame); g.lineWidth = 3;
  if (v === 2) { for (let k = 1; k < 5; k++) { g.strokeStyle = css([30, 28, 32]); g.lineWidth = 3; g.beginPath(); g.moveTo(x0 + k * ww / 5, top); g.lineTo(x0 + k * ww / 5, bot); g.stroke(); } }
  else { g.beginPath(); g.moveTo(cx, top); g.lineTo(cx, bot); g.moveTo(x0, (top + bot) / 2); g.lineTo(x1, (top + bot) / 2); g.stroke(); }
  // sill
  paintRect(g, x0 - 6, bot, ww + 12, 7, [170, 160, 140], r, { n: 8, ink: true, ang: 0, ha: .9 });
  if (v === 0 || v === 1) { // curtains / blind
    const cc = [[120, 50, 44], [74, 100, 96]][v];
    paintPoly(g, [[x0 - 4, top - 4], [x0 + 12, top - 4], [x0 + 6, bot], [x0 - 4, bot]], cc, r, { n: 14, ang: 1.57, ink: true, sw: 3 });
    paintPoly(g, [[x1 + 4, top - 4], [x1 - 12, top - 4], [x1 - 6, bot], [x1 + 4, bot]], cc, r, { n: 14, ang: 1.57, ink: true, sw: 3 });
  }
  if (S.bucket !== 4) { const wp = gp(S, p.side === 'l' ? 0 : wallStart(p) + wallLen(p) / 2, p.side === 'l' ? wallStart(p) + wallLen(p) / 2 : 0, z0 + wh / 2); S.lights.push({ x: wp[0], y: wp[1], r: 70, col: DAPPLE[S.bucket], a: .17 * S.lightK, fl: .03, ph: r() * 6, kind: 'window' }); }
};
WALLPROPS.lockers = function (g, S, p, I) {
  const { r, u0, len, Y, v } = I, n = Math.max(2, Math.round(len / 34)), w = len / n, top = Y(88);
  const cols = [[96, 124, 108], [110, 118, 120], [128, 100, 70], [92, 110, 130]], base = cols[v];
  wallShadow(g, u0, u0 + len, top, Y(0), .4);
  for (let i = 0; i < n; i++) {
    const x = u0 + i * w, c = jit(base, r, .1), open = (i % 7 === 3) && v < 2;
    paintRect(g, x + .5, top, w - 1, Y(0) - top, c, r, { n: 22, sw: 3, ang: 1.57, aj: .1, alt: [150, 160, 130], ink: true, ew: 1.4, ha: .6 });
    if (open) { g.fillStyle = css([12, 10, 14], .92); g.fillRect(x + 4, top + 4, w - 8, Y(0) - top - 8); paintPoly(g, [[x + 4, top + 4], [x - 5, top + 8], [x - 5, Y(0) - 6], [x + 4, Y(0) - 4]], mul(c, .75), r, { n: 10, ink: true }); continue; }
    for (let k = 0; k < 4; k++) { g.fillStyle = css([10, 12, 12], .65); g.fillRect(x + 5, top + 8 + k * 3.2, w - 10, 1.4); }
    for (let k = 0; k < 3; k++) { g.fillStyle = css([10, 12, 12], .65); g.fillRect(x + 5, Y(24) + k * 3.2, w - 10, 1.4); }
    g.fillStyle = css([214, 190, 120]); g.fillRect(x + w / 2 - 3, Y(46), 6, 4);
    g.fillStyle = css([230, 226, 200], .85); g.fillRect(x + 6, top + 22, 9, 5); g.fillStyle = css(INK, .7); g.fillRect(x + 7, top + 24, 6, 1);
    if (r() < .35) { g.strokeStyle = css([20, 24, 22], .5); g.lineWidth = 1.4; g.beginPath(); g.moveTo(x + 3, Y(10) - r() * 30); g.lineTo(x + 8, Y(10) - r() * 30 - 8); g.stroke(); }
    if (r() < .3) { g.fillStyle = css([150, 60, 40], .5); g.fillRect(x + r() * (w - 6), Y(0) - r.r(6, 30), 5, 3); }
  }
  paintRect(g, u0 - 2, top - 5, len + 4, 6, mul(base, .7), r, { n: 8, ink: true });
};
WALLPROPS.bookshelf = function (g, S, p, I) {
  const { r, u0, len, Y, v } = I, top = Y(104);
  paintRect(g, u0 + 2, top, len - 4, Y(0) - top, [70, 46, 32], r, { n: 50, sw: 4, ang: 1.57, ink: true, ew: 1.4 });
  const rows = 5, rh = (Y(0) - top - 8) / rows, pal = [[120, 40, 40], [50, 80, 70], [180, 150, 80], [80, 70, 110], [150, 120, 90], [40, 56, 60], [170, 90, 50]];
  for (let k = 0; k < rows; k++) {
    const y1 = top + 6 + (k + 1) * rh;
    g.fillStyle = css([12, 8, 8], .75); g.fillRect(u0 + 4, top + 6 + k * rh, len - 8, rh);
    let x = u0 + 6;
    while (x < u0 + len - 8) {
      if (r() < .06) { x += r.r(6, 16); continue; }
      const bw = r.r(3, 7.5), bh = rh * r.r(.62, .96), c = jit(r.p(pal), r, .12);
      paintRect(g, x, y1 - bh, bw, bh, c, r, { n: 3, sw: 2, ang: 1.57, ink: false, ew: .8, ha: .7 });
      if (r() < .3) { g.fillStyle = css([220, 190, 110], .7); g.fillRect(x + 1, y1 - bh + 4, bw - 2, 1.3); }
      if (r() < .05) { g.save(); g.translate(x + bw, y1); g.rotate(-.25); g.fillStyle = css(c); g.fillRect(-bw, -bh, bw, bh); g.restore(); }
      x += bw + .6;
    }
    paintRect(g, u0 + 2, y1 - 1, len - 4, 4, [92, 62, 42], r, { n: 6, ink: true, ang: 0 });
  }
  if (v === 1) { g.fillStyle = css([230, 220, 190], .8); g.fillRect(u0 + 14, top - 8, 22, 6); }
};
WALLPROPS.vault = function (g, S, p, I) {
  const { r, u0, len, Y, v } = I, top = Y(82), cx = u0 + len / 2, w = Math.min(len - 10, 100);
  wallShadow(g, cx - w / 2, cx + w / 2, top, Y(0), .45);
  if (v === 1) {
    const n = 3, dh = (Y(0) - top) / n;
    for (let i = 0; i < n; i++) { paintRect(g, cx - w / 2, top + i * dh, w, dh - 1, [96, 110, 100], r, { n: 20, ink: true, ew: 1.4, ang: 0 }); g.fillStyle = css([220, 200, 120]); g.fillRect(cx - 8, top + i * dh + dh / 2 - 2, 16, 4); }
    return;
  }
  paintRect(g, cx - w / 2, top, w, Y(0) - top, [72, 80, 80], r, { n: 70, sw: 4, ang: 0, aj: .2, ink: true, ew: 1.8, alt: [110, 120, 110] });
  paintRect(g, cx - w / 2 + 8, top + 8, w - 16, Y(0) - top - 16, [92, 98, 94], r, { n: 40, sw: 4, ink: true, ang: 0, alt: [130, 140, 120] });
  const wx = cx, wy = (top + Y(0)) / 2;
  paintEll(g, wx, wy, 17, 17, [60, 66, 66], r, { n: 16, ink: true });
  g.strokeStyle = css([200, 180, 110], .9); g.lineWidth = 3.2; g.beginPath(); g.arc(wx, wy, 13, 0, 7); g.stroke();
  for (let k = 0; k < 6; k++) { const a = k * 1.0472; g.beginPath(); g.moveTo(wx, wy); g.lineTo(wx + Math.cos(a) * 20, wy + Math.sin(a) * 20); g.stroke(); }
  g.fillStyle = css([214, 190, 120]); g.beginPath(); g.arc(wx, wy, 4, 0, 7); g.fill();
  for (let i = 0; i < 8; i++) { g.fillStyle = css([40, 44, 44]); g.beginPath(); g.arc(cx - w / 2 + 4 + (i % 4) * (w - 8) / 3, top + 4 + (i >> 2) * (Y(0) - top - 8), 1.8, 0, 7); g.fill(); }
  g.fillStyle = css([210, 180, 80], .7); g.fillRect(cx - w / 2 + 14, top + 14, 22, 6);
  handText(g, 'RECORDS', cx, top + 17, 6, [20, 20, 20], r, 22, { shadow: [0, 0, 0, 0] });
};
WALLPROPS.curtain = function (g, S, p, I) {
  const { r, u0, len, Y, v } = I, top = Y(146), pal = [[150, 30, 40], [70, 100, 90], [196, 186, 160], [30, 30, 40]][v];
  const folds = Math.round(len / 24), fw = len / folds;
  paintRect(g, u0, top - 4, len, 10, [80, 56, 30], r, { n: 10, ink: true, ang: 0 });
  for (let i = 0; i < folds; i++) {
    const x = u0 + i * fw, bow = r.r(-3, 3);
    const c0 = mul(jit(pal, r, .08), 0.65 + 0.45 * Math.abs(Math.sin(i * 1.7 + 1)));
    paintPoly(g, [[x, top], [x + fw, top], [x + fw + bow, Y(2)], [x + bow, Y(2)]], c0, r, { n: 18, sw: 4, ang: 1.57, aj: .06, alt: mul(pal, 1.3), ink: false, edge: false, lit: [[255, 200, 140], [10, 10, 30], 0, .25, .4] });
  }
  for (let i = 0; i <= folds; i++) { g.strokeStyle = css([10, 6, 10], .35); g.lineWidth = 1.5; g.beginPath(); g.moveTo(u0 + i * fw, top + 6); g.lineTo(u0 + i * fw + r.r(-3, 3), Y(2)); g.stroke(); }
  // gold fringe + tie-backs
  g.fillStyle = css([200, 160, 70], .9); for (let x = u0; x < u0 + len; x += 4) g.fillRect(x, Y(6), 2, 6 + r() * 3);
  if (v !== 2) { paintRect(g, u0 + len * .3, Y(50), len * .4, 6, [200, 160, 70], r, { n: 6, ink: true }); }
  if (v === 1) { for (let i = 0; i < 5; i++) { g.fillStyle = css([20, 40, 36], .25); g.beginPath(); g.ellipse(u0 + r() * len, Y(r.r(10, 130)), 14, 7, 0, 0, 7); g.fill(); } }
};
WALLPROPS.pipes = function (g, S, p, I) {
  const { r, u0, len, Y, v } = I, cols = [[104, 120, 112], [150, 100, 70]], base = cols[v % 2];
  const ys = [118, 96, 42];
  for (let k = 0; k < ys.length; k++) {
    const y = Y(ys[k]), th = k === 1 ? 7 : 10, c = jit(k === 2 ? mul(base, .8) : base, r, .08);
    g.fillStyle = css([6, 4, 14], .35); g.fillRect(u0, y + th * .6 + 3, len, 5);
    paintRect(g, u0, y - th / 2, len, th, c, r, { n: len / 4, sw: 3, ang: 0, aj: .04, lit: [[255, 220, 170], [10, 14, 24], -1.57, .6, .55], ink: true, ew: 1.4, alt: [180, 200, 180] });
    g.fillStyle = css([255, 235, 200], .35); g.fillRect(u0, y - th / 2 + 1.5, len, 1.6);
    for (let x = u0 + 40 + r() * 30; x < u0 + len - 10; x += r.r(80, 140)) { paintRect(g, x, y - th / 2 - 2.5, 6, th + 5, mul(c, .8), r, { n: 4, ink: true, ang: 1.57 }); }
    for (let x = u0 + 70 + r() * 50; x < u0 + len - 20; x += r.r(160, 260)) { g.fillStyle = css([150, 40, 36]); g.beginPath(); g.arc(x, y - th / 2 - 6, 4.5, 0, 7); g.fill(); g.strokeStyle = css(INK, .8); g.lineWidth = 1.2; g.stroke(); g.fillRect(x - .8, y - th / 2 - 6, 1.6, 6); }
    if (r() < .6) { const dx = u0 + r.r(40, len - 40); g.fillStyle = css([140, 200, 200], .7); g.fillRect(dx, y + th / 2, 1.5, r.r(4, 14)); g.fillStyle = css([220, 240, 240], .8); g.beginPath(); g.arc(dx + .7, y + th / 2 + r.r(8, 16), 1.5, 0, 7); g.fill(); }
  }
  // vertical riser every ~3 tiles
  for (let x = u0 + 60; x < u0 + len - 20; x += 190) paintRect(g, x, Y(135), 8, 135, mul(base, .9), r, { n: 20, ang: 1.57, ink: true, lit: [[255, 220, 170], [10, 14, 24], 0, .5, .5] });
};
WALLPROPS.radiator = function (g, S, p, I) {
  const { r, u0, len, Y, v } = I, top = Y(52), c = v === 1 ? [40, 40, 44] : [206, 200, 182];
  wallShadow(g, u0 + 4, u0 + len - 4, top, Y(6), .35);
  const n = Math.round(len / 9);
  for (let i = 0; i < n; i++) { paintRect(g, u0 + 4 + i * (len - 8) / n, top, (len - 8) / n - 1, Y(6) - top, jit(c, r, .06), r, { n: 4, ang: 1.57, ink: true, ew: 1, ha: .7 }); }
  g.fillStyle = css([255, 140, 60], .08); g.fillRect(u0, top - 18, len, 18);
  paintRect(g, u0 + 2, top - 5, len - 4, 5, mul(c, .8), r, { n: 4, ink: true }); paintRect(g, u0 + 6, Y(7), 8, 7, [90, 90, 90], r, { n: 3, ink: true }); paintRect(g, u0 + len - 14, Y(7), 8, 7, [90, 90, 90], r, { n: 3, ink: true });
  const wp = gp(S, p.side === 'l' ? 0 : wallStart(p) + wallLen(p) / 2, p.side === 'l' ? wallStart(p) + wallLen(p) / 2 : 0, 30);
  S.lights.push({ x: wp[0] + 8, y: wp[1] + 6, r: 60, col: [255, 120, 50], a: .12, fl: .05, ph: r() * 6, kind: 'heat' });
};
WALLPROPS.fence = function (g, S, p, I) {
  const { r, u0, len, Y, v } = I;
  if (v === 1) {   // wooden hoarding with torn posters
    const top = Y(118);
    for (let x = u0; x < u0 + len; x += 18) paintRect(g, x, top + (x % 3) * 2, 17, Y(0) - top, jit([112, 88, 62], r, .12), r, { n: 10, sw: 3, ang: 1.57, ink: true, ew: 1.2, alt: [60, 50, 40] });
    for (let i = 0; i < len / 90; i++) { const x = u0 + r() * (len - 50); paintRect(g, x, Y(r.r(50, 100)), r.r(30, 46), r.r(34, 52), jit([200, 188, 160], r, .1), r, { n: 8, ink: true, ang: 0 }); scribbleLines(g, r, x + 4, Y(80), 24, 3, 6, [30, 24, 24], .6); }
    return;
  }
  // iron spear railings on stone footing
  const top = Y(112);
  paintRect(g, u0, Y(22), len, 22, [96, 92, 86], r, { n: len / 3, ang: 0, ink: true, ew: 1.6, alt: [70, 76, 72] });
  paintRect(g, u0, Y(104), len, 6, [30, 30, 34], r, { n: len / 6, ang: 0, ink: true }); paintRect(g, u0, Y(30), len, 5, [30, 30, 34], r, { n: len / 6, ang: 0, ink: true });
  for (let x = u0 + 6; x < u0 + len; x += 14) {
    paintRect(g, x - 1.8, Y(104), 3.6, 82, [34, 34, 40], r, { n: 4, ang: 1.57, ink: false, ha: 1, ew: .8 });
    g.fillStyle = css([40, 40, 46]); g.beginPath(); g.moveTo(x - 3.4, Y(104)); g.lineTo(x, top - 6); g.lineTo(x + 3.4, Y(104)); g.closePath(); g.fill(); g.strokeStyle = css(INK, .8); g.lineWidth = 1; g.stroke();
    g.strokeStyle = css([255, 170, 90], .4); g.beginPath(); g.moveTo(x + 1.5, Y(100)); g.lineTo(x + 1.5, Y(26)); g.stroke();
  }
  for (let x = u0 + 60; x < u0 + len; x += 70) paintRect(g, x - 5, Y(116), 10, 96, [44, 44, 50], r, { n: 10, ang: 1.57, ink: true, lit: [[255, 190, 120], [10, 10, 20], 0, .5, .5] });
};
WALLPROPS.ladder = function (g, S, p, I) {
  const { r, u0, len, Y } = I, cx = u0 + len / 2 + 10;
  g.fillStyle = css([6, 4, 12], .4); g.fillRect(cx - 14, Y(148), 36, 148);
  paintRect(g, cx - 12, Y(150), 5, 150, [100, 96, 90], r, { n: 16, ang: 1.57, ink: true }); paintRect(g, cx + 8, Y(150), 5, 150, [100, 96, 90], r, { n: 16, ang: 1.57, ink: true });
  for (let z = 12; z < 148; z += 16) paintRect(g, cx - 12, Y(z), 25, 4, [124, 118, 106], r, { n: 3, ang: 0, ink: true, ew: 1 });
  g.fillStyle = css([8, 8, 12], .9); g.fillRect(cx - 24, Y(150), 48, 8);
  g.fillStyle = css([255, 210, 140], .12); g.fillRect(cx - 20, Y(150), 40, 40);
};
WALLPROPS.pennant = function (g, S, p, I) {
  const { r, u0, len, Y, v } = I, cols = [[170, 40, 40], [200, 170, 70], [50, 100, 90], [170, 120, 60]];
  const x0 = u0 + 6, x1 = u0 + Math.max(len, 64) - 6, y0 = Y(130);
  g.strokeStyle = css([40, 30, 26], .9); g.lineWidth = 1.6; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2, y0 + 20, x1, y0 + 2); g.stroke();
  const n = 5;
  for (let i = 0; i < n; i++) {
    const t = (i + .5) / n, x = lerp(x0, x1, t), y = y0 + Math.sin(t * Math.PI) * 10 + 2 * (1 - t);
    paintPoly(g, [[x - 7, y], [x + 7, y], [x, y + 20 + r() * 4]], cols[(i + v) % 4], r, { n: 6, sw: 2.5, ang: 1.57, ink: true, ew: 1 });
  }
};
WALLPROPS.loudspeaker = function (g, S, p, I) {
  const { r, u0, len, Y, v } = I, cx = u0 + len / 2, cy = Y(92);
  g.fillStyle = css([6, 4, 12], .35); g.beginPath(); g.ellipse(cx + 4, cy + 6, 22, 14, 0, 0, 7); g.fill();
  paintRect(g, cx - 4, cy, 8, 22, [60, 58, 56], r, { n: 6, ink: true, ang: 1.57 });
  paintPoly(g, [[cx - 12, cy - 12], [cx + 12, cy - 12], [cx + 26, cy - 22], [cx + 26, cy + 20], [cx + 12, cy + 12], [cx - 12, cy + 12]], [96, 96, 88], r, { n: 30, ang: 0, ink: true, lit: [[255, 210, 150], [10, 10, 20], -1.57, .5, .5] });
  paintEll(g, cx + 26, cy - 1, 7, 21, [30, 28, 28], r, { n: 6, ink: true });
  g.strokeStyle = css([160, 150, 120], .5); g.lineWidth = 1; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(cx + 22, cy - 1 + k * 7); g.lineTo(cx + 30, cy - 1 + k * 7); g.stroke(); }
};
WALLPROPS.portrait = function (g, S, p, I) {
  const { r, u0, len, Y, v } = I, cx = u0 + len / 2, fw = Math.min(len - 16, 150), fh = v === 1 ? 82 : 104, top = Y(34 + fh + 8) + (v === 1 ? 6 : 0), x0 = cx - fw / 2;
  wallShadow(g, x0, x0 + fw, top, top + fh, .42);
  const gold = v === 1 ? [112, 76, 44] : [196, 156, 70];
  paintRect(g, x0, top, fw, fh, gold, r, { n: 80, sw: 4, ang: 0, aj: .3, ink: true, ew: 1.6, alt: [250, 220, 140], jv: .2 });
  const ix = x0 + 9, iy = top + 9, iw = fw - 18, ih = fh - 18;
  g.save(); g.beginPath(); g.rect(ix, iy, iw, ih); g.clip();
  wardenFace(g, ix, iy, iw, ih, r, v);
  g.restore();
  g.strokeStyle = css(INK, .9); g.lineWidth = 1.8; g.strokeRect(ix, iy, iw, ih);
  g.strokeStyle = css([255, 232, 160], .6); g.lineWidth = 1.3; g.beginPath(); g.moveTo(x0 + 2, top + fh - 2); g.lineTo(x0 + 2, top + 2); g.lineTo(x0 + fw - 2, top + 2); g.stroke();
  if (v !== 2) { g.fillStyle = css([220, 190, 100], .9); g.fillRect(cx - 18, top + fh + 2, 36, 7); handText(g, 'THE WARDEN', cx, top + fh + 5.5, 6, [30, 20, 10], r, 32, { shadow: [0, 0, 0, 0] }); }
  // eyes that follow - faint spotlight gleam
  g.fillStyle = css([255, 180, 90], .1); g.fillRect(ix, iy, iw * .5, ih);
};
function wardenFace(g, x, y, w, h, r, v) {
  const cx = x + w / 2, torn = v === 2;
  const bg = g.createLinearGradient(x, y, x, y + h); bg.addColorStop(0, css([120, 30, 30])); bg.addColorStop(1, css([60, 18, 22])); g.fillStyle = bg; g.fillRect(x, y, w, h);
  g.save(); g.globalAlpha = .25; g.strokeStyle = css([230, 190, 90]); g.lineWidth = 3;
  for (let i = 0; i < 9; i++) { const a = -1.9 + i * .3; g.beginPath(); g.moveTo(cx, y + h * .45); g.lineTo(cx + Math.cos(a + 1.57) * w, y + h * .45 + Math.sin(a + 1.57) * w); g.stroke(); } g.restore();
  for (let i = 0; i < 30; i++) bristle(g, x + r() * w, y + r() * h, r() * 3, 18, 4, [150, 40, 40], .22, r);
  // shoulders / greatcoat
  const sy = y + h * .78;
  paintPoly(g, [[x - 4, y + h + 4], [x + w * .1, sy + 2], [cx - w * .12, sy - 6], [cx + w * .12, sy - 6], [x + w * .9, sy + 2], [x + w + 4, y + h + 4]], [48, 56, 46], r, { n: 40, ang: 0, ink: true, lit: [[120, 110, 70], [10, 14, 12], -1, .4, .4] });
  paintPoly(g, [[cx - w * .15, sy - 8], [cx, sy + 8], [cx + w * .15, sy - 8], [cx + w * .2, y + h + 4], [cx - w * .2, y + h + 4]], [30, 36, 30], r, { n: 10, ink: true });
  g.fillStyle = css([222, 190, 90]); for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(x + w * .78 + i * 3, sy + 8 + i * 2, 2.2, 0, 7); g.fill(); }
  g.fillStyle = css([210, 40, 40]); g.fillRect(x + w * .66, sy + 12, 7, 5); g.fillStyle = css([240, 200, 90]); g.fillRect(x + w * .66, sy + 12, 7, 1.5);
  paintPoly(g, [[x + 2, sy + 2], [x + w * .22, sy - 2], [x + w * .24, sy + 5], [x + 2, sy + 9]], [200, 160, 70], r, { n: 6, ink: true });  // epaulette
  // neck + head
  const hy = y + h * .4, hw = w * .17, hh = h * .31;
  paintPoly(g, [[cx - hw * .5, hy + hh * .6], [cx + hw * .5, hy + hh * .6], [cx + hw * .62, sy - 2], [cx - hw * .62, sy - 2]], [150, 118, 94], r, { n: 8, ink: true });
  paintPoly(g, [[cx - hw * .6, sy - 14], [cx - hw * .15, sy - 3], [cx, sy - 12], [cx + hw * .15, sy - 3], [cx + hw * .6, sy - 14], [cx + hw * .5, sy + 2], [cx - hw * .5, sy + 2]], [34, 44, 34], r, { n: 6, ink: true }); // collar
  const head = [[cx - hw, hy - hh * .5], [cx - hw * 1.06, hy + hh * .1], [cx - hw * .78, hy + hh * .55], [cx - hw * .3, hy + hh * .82], [cx + hw * .3, hy + hh * .82], [cx + hw * .78, hy + hh * .55], [cx + hw * 1.06, hy + hh * .1], [cx + hw, hy - hh * .5], [cx, hy - hh * .72]];
  paintPoly(g, head, [196, 154, 122], r, { n: 40, ang: 1.2, ink: true, inkw: 1.8, lit: [[255, 214, 170], [90, 60, 70], -.7, .5, .5], alt: [150, 100, 90] });
  // hair: slicked grey with severe widow's peak
  paintPoly(g, [[cx - hw * 1.05, hy - hh * .1], [cx - hw * 1.0, hy - hh * .56], [cx - hw * .4, hy - hh * .78], [cx, hy - hh * .8], [cx + hw * .4, hy - hh * .78], [cx + hw * 1.0, hy - hh * .56], [cx + hw * 1.05, hy - hh * .1], [cx + hw * .8, hy - hh * .45], [cx + hw * .3, hy - hh * .5], [cx, hy - hh * .32], [cx - hw * .3, hy - hh * .5], [cx - hw * .8, hy - hh * .45]], [84, 82, 84], r, { n: 20, ang: -.2, ink: true, alt: [160, 160, 160] });
  // cheek shadows, brow, eyes (hard stare), nose, moustache, mouth
  g.fillStyle = css([60, 30, 40], .32); g.beginPath(); g.moveTo(cx - hw * .95, hy + hh * .05); g.lineTo(cx - hw * .35, hy + hh * .4); g.lineTo(cx - hw * .6, hy + hh * .7); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(cx + hw * .95, hy + hh * .05); g.lineTo(cx + hw * .35, hy + hh * .4); g.lineTo(cx + hw * .6, hy + hh * .7); g.closePath(); g.fill();
  g.strokeStyle = css([24, 20, 22], .95); g.lineCap = 'round'; g.lineWidth = Math.max(2, h * .035);
  g.beginPath(); g.moveTo(cx - hw * .75, hy - hh * .17); g.lineTo(cx - hw * .12, hy - hh * .06); g.moveTo(cx + hw * .75, hy - hh * .17); g.lineTo(cx + hw * .12, hy - hh * .06); g.stroke();
  const ey = hy + hh * .06;
  g.fillStyle = css([236, 224, 200]); g.beginPath(); g.ellipse(cx - hw * .42, ey, hw * .24, hh * .06, 0, 0, 7); g.ellipse(cx + hw * .42, ey, hw * .24, hh * .06, 0, 0, 7); g.fill();
  g.fillStyle = css([24, 28, 32]); g.beginPath(); g.arc(cx - hw * .42, ey, hh * .05, 0, 7); g.arc(cx + hw * .42, ey, hh * .05, 0, 7); g.fill();
  g.strokeStyle = css([40, 20, 24], .6); g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx, ey + 2); g.lineTo(cx - hw * .1, hy + hh * .36); g.lineTo(cx + hw * .12, hy + hh * .38); g.stroke();
  g.fillStyle = css([50, 46, 46]); g.beginPath(); g.moveTo(cx - hw * .55, hy + hh * .44); g.quadraticCurveTo(cx, hy + hh * .36, cx + hw * .55, hy + hh * .44); g.quadraticCurveTo(cx, hy + hh * .56, cx - hw * .55, hy + hh * .44); g.fill();
  g.strokeStyle = css([30, 14, 18], .95); g.lineWidth = 1.8; g.beginPath(); g.moveTo(cx - hw * .3, hy + hh * .6); g.lineTo(cx + hw * .3, hy + hh * .6); g.stroke();
  if (torn) {
    // diagonal rip through the face revealing a dark cavity + microphone grille
    const rip = [[x + w * .3, y - 2], [x + w * .5, y + h * .22], [x + w * .42, y + h * .4], [x + w * .6, y + h * .58], [x + w * .52, y + h * .78], [x + w * .66, y + h + 2], [x + w * .84, y + h + 2], [x + w * .74, y + h * .7], [x + w * .8, y + h * .5], [x + w * .66, y + h * .3], [x + w * .74, y + h * .1], [x + w * .6, y - 2]];
    g.fillStyle = css([14, 10, 12]); pathPoly(g, rip); g.fill();
    paintPoly(g, [[x + w * .5, y + h * .3], [x + w * .66, y + h * .3], [x + w * .66, y + h * .5], [x + w * .5, y + h * .5]], [30, 28, 30], r, { n: 6, ink: false });
    g.fillStyle = css([90, 90, 94]); g.beginPath(); g.arc(x + w * .6, y + h * .42, h * .09, 0, 7); g.fill(); g.strokeStyle = css([20, 20, 24]); g.lineWidth = 1; for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(x + w * .6 - h * .09, y + h * .42 + k * 2.4); g.lineTo(x + w * .6 + h * .09, y + h * .42 + k * 2.4); g.stroke(); }
    g.fillStyle = css([255, 230, 190], .6); g.beginPath(); g.arc(x + w * .57, y + h * .38, 2.2, 0, 7); g.fill();
    g.strokeStyle = css([20, 10, 12], .9); g.lineWidth = 1.6; pathPoly(g, rip); g.stroke();
    // curled paper flaps + chalk smudges
    paintPoly(g, [[x + w * .3, y - 2], [x + w * .5, y + h * .22], [x + w * .36, y + h * .26], [x + w * .22, y + h * .06]], [196, 150, 120], r, { n: 6, ink: true });
    paintPoly(g, [[x + w * .66, y + h + 2], [x + w * .84, y + h + 2], [x + w * .9, y + h * .84], [x + w * .74, y + h * .88]], [120, 40, 40], r, { n: 6, ink: true });
    g.strokeStyle = css([240, 240, 230], .55); g.lineWidth = 2.2; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(x + w * .46 + k * 4, y + h * .6); g.lineTo(x + w * .5 + k * 4, y + h * .72); g.stroke(); }
  }
}
WALLPROPS.banner = function (g, S, p, I) {
  const { r, u0, len, Y, v } = I, cx = u0 + len / 2, bw = Math.min(len - 14, 170), bh = 92, top = Y(32 + bh + 6) - 0, x0 = cx - bw / 2;
  const pal = [[158, 36, 38], [78, 98, 86], [176, 168, 140], [120, 30, 28]][v];
  const slog = ['ONE BELL, ONE UNION', 'DISCIPLINE IS HARMONY', 'THE WARDEN HEARS', 'LISTEN. LEARN. LOVE.'];
  const label = (p.label && /^[A-Z ,.'!-]+$/.test(p.label) && p.label.length > 5) ? p.label : slog[(v + (S.seed & 3)) % 4];
  wallShadow(g, x0, x0 + bw, top, top + bh, .4);
  paintRect(g, x0 - 4, top - 6, bw + 8, 6, [90, 66, 38], r, { n: 8, ink: true, ang: 0 });
  const bot = top + bh;
  const pts = [[x0, top], [x0 + bw, top], [x0 + bw + (r() - .5) * 3, bot - 8], [x0 + bw * .8, bot + 4], [x0 + bw * .5, bot - 6], [x0 + bw * .2, bot + 5], [x0, bot - 4]];
  paintPoly(g, pts, pal, r, { n: 80, sw: 5, ang: 1.57, aj: .15, ink: true, alt: mul(pal, 1.4), wob: 2, lit: [[255, 200, 140], [10, 10, 30], 0, .25, .35] });
  g.strokeStyle = css([226, 196, 100], .85); g.lineWidth = 2; g.strokeRect(x0 + 6, top + 6, bw - 12, bh - 22);
  const words = label.split(' '), lines = words.length > 2 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [label];
  const tc = v === 2 ? [40, 30, 24] : [236, 210, 130];
  lines.forEach((ln, i) => handText(g, ln, cx, top + 6 + (bh - 22) * ((i + .5) / lines.length), lines.length > 1 ? 15 : 17, tc, r, bw - 22, { drip: v === 3 }));
  if (v === 1 || v === 3) { g.fillStyle = css([240, 220, 150], .9); g.beginPath(); for (let i = 0; i < 10; i++) { const a = i * .6283 - 1.57, rr = i % 2 ? 4 : 9; g.lineTo(cx + Math.cos(a) * rr, bot - 12 + Math.sin(a) * rr); } g.fill(); }
  // tears and creases
  g.strokeStyle = css([10, 6, 8], .25); g.lineWidth = 1.4; for (let i = 0; i < 3; i++) { const x = x0 + r() * bw; g.beginPath(); g.moveTo(x, top); g.lineTo(x + r.r(-4, 4), bot); g.stroke(); }
};
WALLPROPS.notice = function (g, S, p, I) {
  const { r, u0, len, Y, v } = I, cx = u0 + len / 2, bw = Math.min(len - 10, 140), bh = v === 1 ? 60 : 78, top = Y(44 + bh), x0 = cx - bw / 2;
  wallShadow(g, x0, x0 + bw, top, top + bh, .4);
  paintRect(g, x0 - 4, top - 4, bw + 8, bh + 8, [110, 72, 40], r, { n: 40, ink: true, ang: 0, ew: 1.6 });
  paintRect(g, x0, top, bw, bh, v === 2 ? [70, 100, 78] : [150, 110, 76], r, { n: 70, sw: 3, ang: .3, aj: 1, ink: true, alt: [100, 70, 40] });
  const n = v === 1 ? 4 : 6;
  for (let i = 0; i < n; i++) {
    const pw = r.r(20, 36), ph = r.r(22, 34), px = x0 + 5 + r() * (bw - pw - 10), py = top + 5 + r() * (bh - ph - 8);
    g.save(); g.translate(px + pw / 2, py + ph / 2); g.rotate((r() - .5) * .16);
    paintRect(g, -pw / 2, -ph / 2, pw, ph, jit(r() < .5 ? [226, 218, 190] : [210, 198, 160], r, .06), r, { n: 5, ink: true, ew: 1, inkw: 1.2, ang: 0 });
    g.fillStyle = css(r() < .4 ? [160, 30, 30] : [30, 24, 24], .8); g.fillRect(-pw / 2 + 3, -ph / 2 + 3, pw * .6, 3);
    scribbleLines(g, r, -pw / 2 + 3, -ph / 2 + 10, pw - 6, Math.floor((ph - 12) / 4), 4, [40, 34, 34], .55);
    if (r() < .4) { g.strokeStyle = css([170, 30, 30], .8); g.lineWidth = 1.6; g.beginPath(); g.arc(pw / 4, ph / 4, 6, 0, 7); g.stroke(); }
    g.fillStyle = css([190, 40, 40]); g.beginPath(); g.arc(0, -ph / 2 + 2, 1.7, 0, 7); g.fill();
    g.restore();
  }
};
WALLPROPS.chalkboard = function (g, S, p, I) {
  const { r, u0, len, Y, v } = I, cx = u0 + len / 2, bw = Math.min(len - 10, 120), bh = 70, top = Y(40 + bh), x0 = cx - bw / 2;
  wallShadow(g, x0, x0 + bw, top, top + bh, .4);
  paintRect(g, x0 - 4, top - 4, bw + 8, bh + 8, [120, 84, 50], r, { n: 30, ink: true, ang: 0 });
  paintRect(g, x0, top, bw, bh, [34, 46, 42], r, { n: 70, sw: 6, ang: .2, aj: 1, alt: [70, 84, 78], ink: true, jv: .08 });
  chalkMenu(g, r, x0, top, bw, bh, p.label);
};
function chalkMenu(g, r, x0, top, bw, bh, label) {
  handText(g, (label && /menu/i.test(label)) ? 'MENU' : 'TODAY', x0 + bw / 2, top + 11, 13, [236, 232, 214], r, bw - 20, { shadow: [0, 0, 0, 0], family: '"Comic Sans MS","Segoe Print",cursive', font: 'bold' });
  const items = ['CABBAGE SOUP ..... 2', 'BREAD (GREY) ...... 1', 'TEA (RATION) ...... 1', 'NO SECONDS'];
  g.fillStyle = css([226, 222, 204], .78);
  for (let i = 0; i < items.length; i++) { g.font = '8px "Comic Sans MS","Segoe Print",cursive'; g.textAlign = 'left'; g.save(); g.translate(x0 + 8, top + 26 + i * 11); g.rotate((r() - .5) * .03); g.fillText(items[i], 0, 0); g.restore(); }
  g.strokeStyle = css([226, 222, 204], .7); g.lineWidth = 1.4; g.beginPath(); g.moveTo(x0 + 8, top + 41); g.lineTo(x0 + bw - 14, top + 42); g.stroke();
  g.fillStyle = css([226, 222, 204], .06); g.fillRect(x0, top + bh * .6, bw, bh * .4);
}
WALLPROPS.mirror = function (g, S, p, I) {
  const { r, u0, len, Y } = I, cx = u0 + len / 2, bw = 50, bh = 88, top = Y(30 + bh), x0 = cx - bw / 2;
  paintRect(g, x0 - 5, top - 5, bw + 10, bh + 10, [96, 68, 40], r, { n: 30, ink: true, ang: 1.57 });
  const gr = g.createLinearGradient(x0, top, x0 + bw, top + bh); gr.addColorStop(0, css([170, 190, 190])); gr.addColorStop(1, css([60, 80, 90])); g.fillStyle = gr; g.fillRect(x0, top, bw, bh);
  g.strokeStyle = css([20, 24, 28], .85); g.lineWidth = 1.2; g.beginPath(); g.moveTo(x0 + 10, top); g.lineTo(x0 + 26, top + 30); g.lineTo(x0 + 18, top + 60); g.lineTo(x0 + 40, bh + top); g.moveTo(x0 + 26, top + 30); g.lineTo(x0 + 50, top + 24); g.stroke();
  g.fillStyle = css([255, 255, 255], .25); g.fillRect(x0 + 4, top + 6, 6, bh - 18);
};

/* ================================================== FREE-STANDING PROPS */
const PROPS = {};         // sprite props:  (g,S,p,I)
const FLAT = {};          // painted straight into the baked floor layer
const PH = { counter: 100, table: 80, bench: 90, stool: 70, plant: 120, pillar: 170, chair: 90, desk: 110, boiler: 210, statue: 240, crate: 80, lamp: 170, loudspeaker: 250, sack: 60, barrel: 90, mic: 100, sofa: 90, cart: 90, tray: 50, tree: 290, bell: 150, hoop: 190, fence: 100, chalkboard: 110, mirror: 130, door: 100, ladder: 100, bookshelf: 130, lockers: 100, vault: 100, pipes: 100, window: 100, banner: 100, curtain: 100, pennant: 100, portrait: 100, notice: 100, radiator: 70 };
const PEX = { tree: 110, plant: 24, statue: 30, loudspeaker: 24, boiler: 40, lamp: 40, hoop: 30, bell: 20 };
const SUPPORT_Z = { counter: 44, table: 34, desk: 40, crate: 32, bench: 22, boiler: 0 };

PROPS.counter = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, w = u1 - u0;
  const wood = [[96, 66, 44], [150, 150, 140], [112, 120, 122], [180, 176, 166]][v];
  const top = [[148, 158, 156], [120, 84, 52], [176, 180, 180], [214, 210, 200]][v];
  fcs(g, S, r, u0, v0, u1, v1, 0, 40, wood, { vert: true, alt: v === 0 ? [140, 100, 60] : null });
  // panelled front on both visible faces
  for (let i = 0; i < Math.round(w * 1.6); i++) {
    const a = u0 + .1 + i * (w - .2) / Math.round(w * 1.6), b = a + (w - .2) / Math.round(w * 1.6) - .06;
    const p0 = gp(S, a, v1, 8), p1 = gp(S, b, v1, 8), p2 = gp(S, b, v1, 33), p3 = gp(S, a, v1, 33);
    paintPoly(g, [p3, p2, p1, p0], mul(wood, .8), r, { n: 8, ang: .46, ink: true, inkw: 1.1, ha: .5, ew: 1 });
    if (v === 1 || v === 3) { g.fillStyle = css([210, 200, 170], .12); pathPoly(g, [p3, p2, p1, p0]); g.fill(); }
  }
  const e = .05;
  fcs(g, S, r, u0 - e, v0 - e, u1 + e, v1 + e, 40, 45, top, { topAng: .46, alt: [230, 240, 240], dens: 26, kt: 1.2 });
  const hl = [gp(S, u0 - e, v1 + e, 45), gp(S, u1 + e, v1 + e, 45), gp(S, u1 + e, v0 - e, 45)];
  rimStroke(g, hl, [255, 244, 220], .5, 1.4);
  // glass partition with green glow
  const gt = v === 0 ? 76 : v === 2 ? 66 : 0;
  if (gt) {
    const pa = gp(S, u0 + .1, v0 + .12, 45), pb = gp(S, u1 - .1, v0 + .12, 45), pc = gp(S, u1 - .1, v0 + .12, gt), pd = gp(S, u0 + .1, v0 + .12, gt);
    g.save(); g.globalAlpha = .62; paintPoly(g, [pa, pb, pc, pd], v === 0 ? [90, 180, 140] : [190, 220, 220], r, { n: 30, ang: 2.68, ink: false, jv: .2, edge: false }); g.restore();
    g.strokeStyle = css([190, 255, 220], .55); g.lineWidth = 1.2; for (let k = 1; k < 4; k++) { const t = k / 4; g.beginPath(); g.moveTo(lerp(pd[0], pc[0], t) , lerp(pd[1], pc[1], t)); g.lineTo(lerp(pd[0], pc[0], t) + 6, lerp(pd[1], pc[1], t) + 20); g.stroke(); }
    rimStroke(g, [pa, pd, pc, pb], [20, 30, 26], .8, 1.6);
    // bottles
    for (let i = 0; i < Math.floor(w * 2.2); i++) { const uu = u0 + .3 + i * .45 + r() * .05, bz = 45, p0 = gp(S, uu, v0 + .35, bz); const h = r.r(14, 22); g.fillStyle = css(r() < .6 ? [60, 140, 90] : [150, 110, 60], .95); g.beginPath(); g.moveTo(p0[0] - 3, p0[1]); g.lineTo(p0[0] - 3, p0[1] - h * .6); g.lineTo(p0[0] - 1.2, p0[1] - h * .75); g.lineTo(p0[0] - 1.2, p0[1] - h); g.lineTo(p0[0] + 1.2, p0[1] - h); g.lineTo(p0[0] + 1.2, p0[1] - h * .75); g.lineTo(p0[0] + 3, p0[1] - h * .6); g.lineTo(p0[0] + 3, p0[1]); g.closePath(); g.fill(); g.strokeStyle = css(INK, .85); g.lineWidth = 1; g.stroke(); g.fillStyle = css([255, 255, 220], .5); g.fillRect(p0[0] + .6, p0[1] - h * .6, 1.2, h * .5); }
  }
  // cups, pot, ladle
  for (let i = 0; i < Math.floor(w * 1.1); i++) {
    const uu = u0 + .5 + r() * (w - 1), vv = v0 + .25 + r() * (v1 - v0 - .5), q = gp(S, uu, vv, 45);
    if (r() < .5) { cylBody(g, S, r, uu, vv, .13, 45, 53, [210, 206, 190], { ink: true, sw: 2 }); }
    else { paintRect(g, q[0] - 5, q[1] - 5, 10, 5, [214, 196, 150], r, { n: 3, ink: true, ang: 0 }); }
  }
  if (v === 2) { const q = gp(S, u0 + w * .7, (v0 + v1) / 2, 45); cylBody(g, S, r, u0 + w * .7, (v0 + v1) / 2, .38, 45, 66, [150, 154, 152], { ink: true }); S.steam = S.steam || []; S.steam.push({ x: q[0], y: q[1] - 66 }); }
};
PROPS.table = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I;
  contactShadow(g, S, u0, v0, u1, v1, .8);
  const wood = [[142, 100, 62], [92, 124, 100], [150, 150, 146], [196, 186, 160]][v];
  if (v !== 3) { for (const [uu, vv] of [[u0 + .08, v0 + .08], [u1 - .08, v0 + .08], [u1 - .08, v1 - .08], [u0 + .08, v1 - .08]]) vbar(g, S, r, uu, vv, 0, 31, 3.4, mul(wood, .6)); }
  else { fcs(g, S, r, u0 + .06, v0 + .06, u1 - .06, v1 - .06, 3, 31, wood, { vert: true, alt: [230, 220, 190] }); }
  fcs(g, S, r, u0, v0, u1, v1, 31, 35, wood, { alt: [200, 160, 100], dens: 26 });
  // items
  const n = Math.floor((u1 - u0) * (v1 - v0) * 1.2) + 1;
  for (let i = 0; i < n; i++) {
    const uu = u0 + .25 + r() * (u1 - u0 - .5), vv = v0 + .2 + r() * (v1 - v0 - .4), q = gp(S, uu, vv, 35), k = r();
    if (k < .35) cylBody(g, S, r, uu, vv, .12, 35, 43, [220, 216, 200], { ink: true, sw: 2 });
    else if (k < .65) paintPoly(g, [[q[0] - 7, q[1] - 2], [q[0], q[1] - 6], [q[0] + 7, q[1] - 2], [q[0], q[1] + 2]], [226, 216, 184], r, { n: 3, ink: true, ew: 1 });
    else { paintPoly(g, [[q[0] - 8, q[1]], [q[0], q[1] - 4], [q[0] + 8, q[1]], [q[0], q[1] + 4]], [100, 110, 100], r, { n: 3, ink: true }); cylBody(g, S, r, uu, vv, .1, 35, 39, [200, 196, 180], { ink: true, sw: 1.5 }); }
  }
};
PROPS.bench = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, wood = [[150, 108, 66], [168, 130, 82], [96, 78, 56], [150, 50, 46]][v];
  contactShadow(g, S, u0, v0, u1, v1, .8);
  const nl = Math.max(2, Math.round((u1 - u0) / 1.4));
  for (let i = 0; i <= nl; i++) { const uu = u0 + .12 + i * (u1 - u0 - .24) / nl; for (const vv of [v0 + .18, v1 - .18]) vbar(g, S, r, uu, vv, 0, 20, 3.4, v === 2 ? [40, 44, 48] : mul(wood, .55)); }
  if (v === 2 || v === 3) { // backrest at far side
    fcs(g, S, r, u0, v0 + .05, u1, v0 + .17, 24, 46, mul(wood, .9), { vert: false, alt: [200, 160, 110] });
    for (let k = 1; k < 3; k++) { const a = gp(S, u0, v0 + .17, 24 + k * 7), b = gp(S, u1, v0 + .17, 24 + k * 7); g.strokeStyle = css(INK, .6); g.lineWidth = 1; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
  }
  fcs(g, S, r, u0, v0 + .06, u1, v1 - .06, 18, v === 1 ? 24 : 21, wood, { alt: [210, 170, 110], dens: 24 });
  const nb = Math.max(1, Math.floor(v1 - v0)); if (v1 - v0 > 0.9) { /* plank lines */ }
  g.strokeStyle = css(INK, .35); g.lineWidth = 1; const z = v === 1 ? 24 : 21;
  for (let k = 1; k < 3; k++) { const vv = lerp(v0 + .06, v1 - .06, k / 3); const a = gp(S, u0, vv, z), b = gp(S, u1, vv, z); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
};
PROPS.stool = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  contactShadow(g, S, cu - .3, cv - .3, cu + .3, cv + .3, .9);
  cylBody(g, S, r, cu, cv, .26, 0, 2.5, [70, 72, 76], { ink: true, sw: 2 });
  vbar(g, S, r, cu, cv, 2, 22, 4, [170, 176, 176]);
  const seat = v === 1 ? [140, 104, 66] : [162, 36, 38];
  cylBody(g, S, r, cu, cv, .3, 21, 29, seat, { ink: true, sw: 3, alt: v === 1 ? [190, 150, 100] : [240, 100, 80], topCol: mul(seat, 1.25) });
  const q = gp(S, cu, cv, 29); g.fillStyle = css([255, 240, 220], .3); g.beginPath(); g.ellipse(q[0] + 7, q[1] - 2, 4, 1.6, -.3, 0, 7); g.fill();
};
PROPS.chair = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, near = (p.y | 0) > 3 && v % 2 === 1;
  const wood = [[134, 90, 56], [110, 76, 50], [96, 40, 36], [110, 114, 116]][v];
  contactShadow(g, S, cu - .3, cv - .3, cu + .3, cv + .3, .8);
  const a = .28;
  const backV = near ? cv + a : cv - a;
  if (!near) { for (const du of [-.22, .22]) vbar(g, S, r, cu + du, backV, 18, 52, 3.4, mul(wood, .75)); fcs(g, S, r, cu - .26, backV - .03, cu + .26, backV + .03, 38, 52, wood, { vert: true }); }
  for (const [du, dv] of [[-.24, -.24], [.24, -.24], [.24, .24], [-.24, .24]]) vbar(g, S, r, cu + du, cv + dv, 0, 20, 3, mul(wood, .6));
  fcs(g, S, r, cu - .3, cv - .3, cu + .3, cv + .3, 18, v === 2 ? 25 : 22, wood, { alt: [200, 150, 100], dens: 22 });
  if (near) { for (const du of [-.22, .22]) vbar(g, S, r, cu + du, backV, 20, 52, 3.4, mul(wood, .8)); fcs(g, S, r, cu - .26, backV - .03, cu + .26, backV + .03, 38, 52, wood, { vert: true }); }
  if (v === 2) fcs(g, S, r, cu - .22, backV - .04, cu + .22, backV + .06, 34, 54, wood, { vert: true });
};
PROPS.plant = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  contactShadow(g, S, cu - .35, cv - .35, cu + .35, cv + .35, 1);
  cylBody(g, S, r, cu, cv, .34, 0, 24, [176, 94, 60], { ink: true, alt: [220, 140, 90], sw: 3 });
  const top = gp(S, cu, cv, 24); paintEll(g, top[0], top[1], 15, 7, [50, 36, 28], r, { n: 6 });
  const greens = v === 3 ? [[120, 100, 56], [150, 120, 70], [90, 76, 48]] : [[46, 110, 66], [74, 140, 76], [30, 80, 60], [110, 160, 80]];
  const nl = v === 2 ? 20 : v === 1 ? 12 : 16;
  for (let i = 0; i < nl; i++) {
    const a = (i / nl) * Math.PI * 2 + r() * .4, rr = (v === 1 ? 6 : 14) + r() * 14, h = v === 1 ? 50 + r() * 40 : 28 + r() * 38;
    const bx = top[0], by = top[1] - 2, tx = bx + Math.cos(a) * rr * (v === 2 ? 1.6 : 1), ty = by - h + Math.sin(a) * rr * .3 + (v === 2 ? h * .45 : 0);
    const c = jit(r.p(greens), r, .12), lw_ = v === 1 ? 4 : 6.5;
    const dx = tx - bx, dy = ty - by, len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
    paintPoly(g, [[bx, by], [bx + dx * .5 + nx * lw_, by + dy * .5 + ny * lw_], [tx, ty], [bx + dx * .5 - nx * lw_, by + dy * .5 - ny * lw_]], c, r, { n: 5, sw: 2, ang: Math.atan2(dy, dx), ink: true, inkw: 1.1, ew: .8, ha: .8 });
    g.strokeStyle = css(mul(c, .6), .8); g.lineWidth = .9; g.beginPath(); g.moveTo(bx, by); g.lineTo(tx, ty); g.stroke();
  }
};
PROPS.pillar = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, h = 150;
  contactShadow(g, S, cu - .4, cv - .4, cu + .4, cv + .4, 1);
  const c = v === 1 ? [140, 74, 54] : v === 2 ? [70, 76, 80] : [184, 170, 134];
  fcs(g, S, r, cu - .42, cv - .42, cu + .42, cv + .42, 0, 12, mul(c, .8), { vert: false });
  fcs(g, S, r, cu - .3, cv - .3, cu + .3, cv + .3, 12, h - 12, c, { vert: true, alt: v === 1 ? [210, 120, 70] : [230, 214, 170], nk: 1.2 });
  if (v === 0) { const a = gp(S, cu - .3, cv + .3, 66), b = gp(S, cu + .3, cv + .3, 66), c2 = gp(S, cu + .3, cv - .3, 66); g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = css([60, 106, 80], .7); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c2[0], c2[1]); g.lineTo(c2[0], c2[1] + 66); g.lineTo(b[0], b[1] + 66); g.lineTo(a[0], a[1] + 66); g.closePath(); g.fill(); g.restore(); }
  fcs(g, S, r, cu - .42, cv - .42, cu + .42, cv + .42, h - 12, h, mul(c, 1.05), {});
  // soot / damp stains
  g.save(); g.globalCompositeOperation = 'source-atop'; for (let i = 0; i < 6; i++) { const q = gp(S, cu + r.r(-.3, .3), cv + .3, r.r(14, h - 20)); g.fillStyle = css([20, 16, 14], .1 + r() * .1); g.beginPath(); g.ellipse(q[0], q[1], r.r(5, 14), r.r(8, 24), 0, 0, 7); g.fill(); } g.restore();
};
PROPS.desk = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, wood = [[96, 62, 40], [150, 112, 70], [90, 98, 98], [130, 84, 52]][v];
  contactShadow(g, S, u0, v0, u1, v1, 1);
  // pedestals
  fcs(g, S, r, u0 + .1, v0 + .1, u0 + 1.0, v1 - .1, 0, 33, wood, { vert: true });
  fcs(g, S, r, u1 - 1.0, v0 + .1, u1 - .1, v1 - .1, 0, 33, wood, { vert: true });
  for (let k = 0; k < 3; k++) { const z0 = 4 + k * 10, a = gp(S, u1 - 1.0, v1 - .1, z0), b = gp(S, u1 - .1, v1 - .1, z0), c2 = gp(S, u1 - .1, v1 - .1, z0 + 8), d = gp(S, u1 - 1.0, v1 - .1, z0 + 8); paintPoly(g, [d, c2, b, a], mul(wood, .78), r, { n: 5, ink: true, inkw: 1.1, ang: .46, ew: 1 }); const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 4]; g.fillStyle = css([214, 184, 100]); g.fillRect(m[0] - 3, m[1], 6, 2); }
  fcs(g, S, r, u0 + 1.0, v0 + .2, u1 - 1.0, v1 - .5, 4, 30, mul(wood, .6), { vert: true, ink: false });
  fcs(g, S, r, u0, v0, u1, v1, 33, 38, wood, { alt: [190, 140, 90] });
  // leather inlay
  const ins = [gp(S, u0 + .25, v0 + .2, 38.2), gp(S, u1 - .25, v0 + .2, 38.2), gp(S, u1 - .25, v1 - .2, 38.2), gp(S, u0 + .25, v1 - .2, 38.2)];
  paintPoly(g, ins, v === 2 ? [70, 90, 100] : [40, 82, 60], r, { n: 36, ang: .46, ink: true, inkw: 1.2, alt: [80, 130, 90] });
  rimStroke(g, ins.concat([ins[0]]), [220, 190, 100], .5, 1);
  // desk clutter: ink, lamp, papers, nameplate, phone
  const put = (uu, vv, f) => f(gp(S, uu, vv, 38));
  put(u0 + .8, v0 + .5, q => { paintPoly(g, [[q[0] - 10, q[1]], [q[0], q[1] - 5], [q[0] + 10, q[1]], [q[0], q[1] + 5]], [230, 224, 200], r, { n: 3, ink: true }); scribbleLines(g, r, q[0] - 6, q[1] - 1, 10, 2, 2, [40, 40, 50], .7); });
  put(u0 + 1.9, v0 + .9, q => { paintPoly(g, [[q[0] - 9, q[1]], [q[0] + 1, q[1] - 5], [q[0] + 9, q[1]], [q[0] - 1, q[1] + 5]], [210, 204, 180], r, { n: 3, ink: true }); });
  put(u1 - 1.0, v0 + .6, q => { paintRect(g, q[0] - 9, q[1] - 8, 18, 6, [214, 184, 100], r, { n: 4, ink: true, ang: 0 }); });
  put(u0 + 1.4, v1 - .6, q => { paintRect(g, q[0] - 7, q[1] - 6, 14, 5, [20, 20, 22], r, { n: 3, ink: true }); g.fillStyle = css([200, 40, 40]); g.fillRect(q[0] - 2, q[1] - 9, 4, 3); });
  const lampP = gp(S, u1 - .8, v0 + .5, 38);
  vbar(g, S, r, u1 - .8, v0 + .5, 38, 56, 2.4, [60, 70, 60]);
  paintPoly(g, [[lampP[0] - 10, lampP[1] - 18], [lampP[0] + 6, lampP[1] - 24], [lampP[0] + 12, lampP[1] - 16], [lampP[0] - 4, lampP[1] - 12]], [40, 110, 80], r, { n: 8, ink: true });
  S.lights.push({ x: lampP[0], y: lampP[1] - 14 + (S.zoff || 0), r: 70, col: [255, 214, 130], a: .22, fl: .03, ph: r() * 6, kind: 'lamp' });
};
PROPS.boiler = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  contactShadow(g, S, u0 + .1, v0 + .1, u1 - .1, v1 - .1, 1.2);
  fcs(g, S, r, u0 + .15, v0 + .15, u1 - .15, v1 - .15, 0, 14, [70, 62, 60], { vert: false });       // brick plinth
  const tank = cylBody(g, S, r, cu, cv, 1.05, 14, 118, [92, 100, 98], { sw: 4, dens: 22, alt: [160, 130, 100], topCol: [110, 116, 112] });
  cylBody(g, S, r, cu, cv, .5, 118, 134, [84, 90, 88], { sw: 3 });
  // rivet bands
  g.strokeStyle = css([40, 42, 44], .8); g.lineWidth = 2.4;
  for (const z of [34, 66, 98]) { const c0 = gp(S, cu, cv, z); g.beginPath(); g.ellipse(c0[0], c0[1], ecx(1.05), ecy(1.05), 0, 0, Math.PI); g.stroke(); g.fillStyle = css([190, 160, 120], .7); for (let k = 0; k < 14; k++) { const a = k / 13 * Math.PI; g.beginPath(); g.arc(c0[0] + Math.cos(a) * ecx(1.05), c0[1] + Math.sin(a) * ecy(1.05) + 3, 1.3, 0, 7); g.fill(); } }
  // fire door facing viewer (towards +v / -u mid)
  const fd = gp(S, cu - .1, v1 - .05, 44);
  paintRect(g, fd[0] - 20, fd[1] - 24, 40, 42, [50, 50, 54], r, { n: 20, ink: true, ew: 1.6, ang: 0 });
  const fg = g.createRadialGradient(fd[0], fd[1] - 2, 2, fd[0], fd[1] - 2, 17); fg.addColorStop(0, 'rgba(255,230,150,1)'); fg.addColorStop(.5, 'rgba(255,130,40,.95)'); fg.addColorStop(1, 'rgba(160,40,10,.9)');
  g.fillStyle = fg; g.beginPath(); g.ellipse(fd[0], fd[1] - 3, 15, 14, 0, 0, 7); g.fill(); g.strokeStyle = css(INK, .9); g.lineWidth = 2; g.stroke();
  g.fillStyle = css([10, 6, 6], .9); for (let k = -2; k <= 2; k++) g.fillRect(fd[0] - 14, fd[1] - 3 + k * 5, 28, 1.6);
  S.lights.push({ x: fd[0], y: fd[1] - 3 + (S.zoff || 0), r: 300, col: [255, 120, 40], a: .6, fl: .22, ph: r() * 6, kind: 'fire' });
  S.lights.push({ x: fd[0] + 40, y: fd[1] + 24 + (S.zoff || 0), r: 220, col: [255, 90, 30], a: .3, fl: .2, ph: r() * 6, kind: 'fire' });
  // gauges
  const gq = gp(S, cu + .5, cv + .75, 90);
  g.fillStyle = css([220, 210, 180]); g.beginPath(); g.arc(gq[0], gq[1], 8, 0, 7); g.fill(); g.strokeStyle = css(INK, .9); g.lineWidth = 2; g.stroke(); g.strokeStyle = css([170, 30, 30]); g.lineWidth = 1.4; g.beginPath(); g.moveTo(gq[0], gq[1]); g.lineTo(gq[0] + 4, gq[1] - 5); g.stroke();
  // chimney pipe to wall
  const c1 = gp(S, cu, cv, 134), c2 = gp(S, cu, v0 - .3, 134), c3 = gp(S, cu, v0 - .3, 175);
  paintPoly(g, [[c1[0] - 8, c1[1]], [c1[0] + 8, c1[1]], [c1[0] + 8, c1[1] - 42], [c1[0] - 8, c1[1] - 42]], [74, 78, 78], r, { n: 10, ink: true, ang: 1.57, lit: [[255, 200, 140], [10, 10, 20], 0, .5, .5] });
  paintPoly(g, [[c1[0] - 8, c1[1] - 42], [c1[0] + 30, c1[1] - 60], [c1[0] + 30, c1[1] - 44], [c1[0] + 8, c1[1] - 34]], [74, 78, 78], r, { n: 10, ink: true, ang: -.4 });
  // soot streaks
  g.save(); g.globalCompositeOperation = 'source-atop'; for (let i = 0; i < 10; i++) { const q = gp(S, cu + r.r(-.9, .9), cv + .9, r.r(20, 110)); g.fillStyle = css([10, 8, 8], .13); g.fillRect(q[0] + r.r(-20, 20), q[1] - r.r(20, 60), r.r(2, 9), r.r(20, 60)); } g.restore();
  S.steam = S.steam || []; S.steam.push({ x: c1[0] + 30, y: c1[1] - 55 });
};
PROPS.statue = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, stone = v === 1 ? [90, 130, 112] : [156, 154, 146];
  contactShadow(g, S, u0 + .05, v0 + .05, u1 - .05, v1 - .05, 1.3);
  fcs(g, S, r, u0 + .1, v0 + .1, u1 - .1, v1 - .1, 0, 30, mul(stone, .85), { vert: false, alt: [200, 196, 180] });
  fcs(g, S, r, u0 + .3, v0 + .3, u1 - .3, v1 - .3, 30, 62, stone, { vert: false, alt: [210, 206, 190], nk: 1.2 });
  fcs(g, S, r, u0 + .22, v0 + .22, u1 - .22, v1 - .22, 62, 68, mul(stone, 1.05), {});
  const pq = gp(S, cu, v1 - .3, 46); paintRect(g, pq[0] - 22, pq[1] - 9, 44, 16, [40, 40, 38], r, { n: 6, ink: true, ang: 0 }); handText(g, 'FATHER OF THE UNION', pq[0], pq[1] - 1, 5.5, [214, 190, 110], r, 38, { shadow: [0, 0, 0, 0], font: '' });
  // figure in greatcoat, one arm raised, on top of plinth
  const b = gp(S, cu, cv, 68), c = stone, k = v === 1 ? [70, 120, 96] : [176, 174, 166];
  const bx = b[0], by = b[1];
  paintPoly(g, [[bx - 20, by], [bx - 18, by - 52], [bx - 14, by - 76], [bx + 14, by - 76], [bx + 18, by - 52], [bx + 20, by]], c, r, { n: 60, sw: 4, ang: 1.5, ink: true, inkw: 2, alt: k, lit: [[255, 210, 150], [30, 40, 60], Math.PI, .5, .5] });
  paintPoly(g, [[bx - 14, by - 76], [bx + 14, by - 76], [bx + 18, by - 90], [bx - 18, by - 90]], mul(c, 1.05), r, { n: 12, ink: true });                 // shoulders
  paintPoly(g, [[bx + 14, by - 88], [bx + 40, by - 112], [bx + 46, by - 104], [bx + 20, by - 78]], c, r, { n: 10, ink: true });                       // raised arm
  paintEll(g, bx + 46, by - 110, 5, 5, c, r, { n: 6, ink: true });
  paintPoly(g, [[bx - 8, by - 90], [bx + 8, by - 90], [bx + 9, by - 106], [bx - 9, by - 106]], mul(c, 1.1), r, { n: 8, ink: true });              // head
  paintPoly(g, [[bx - 10, by - 102], [bx + 10, by - 102], [bx + 12, by - 112], [bx - 12, by - 112]], mul(c, .9), r, { n: 6, ink: true });              // cap
  g.strokeStyle = css([30, 30, 32], .5); g.lineWidth = 1; g.beginPath(); g.moveTo(bx, by - 74); g.lineTo(bx, by - 2); g.stroke();
  g.fillStyle = css([230, 230, 220], .7); g.fillRect(bx - 10, by - 100, 2, 2);                                                                        // pigeon stain / gleam
  g.save(); g.globalCompositeOperation = 'source-atop'; for (let i = 0; i < 9; i++) { g.fillStyle = css([230, 230, 220], .18); g.fillRect(bx + r.r(-14, 14), by - r.r(60, 112), 2, r.r(6, 16)); g.fillStyle = css([40, 60, 40], .16); g.fillRect(r.r(bx - 40, bx + 40), pq[1] + r.r(-40, 20), r.r(3, 9), r.r(8, 24)); } g.restore();
};
PROPS.crate = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I;
  contactShadow(g, S, u0, v0, u1, v1, .9);
  if (v === 2) { // trunk
    const c = [96, 62, 44];
    fcs(g, S, r, u0 + .06, v0 + .06, u1 - .06, v1 - .06, 0, 26, c, { vert: true, alt: [150, 100, 60] });
    fcs(g, S, r, u0 + .06, v0 + .1, u1 - .06, v1 - .1, 26, 34, mul(c, 1.1), {});
    for (let k = 0; k < 3; k++) { const uu = lerp(u0 + .15, u1 - .15, k / 2); const a = gp(S, uu, v1 - .06, 0), b = gp(S, uu, v1 - .06, 26), c2 = gp(S, uu, v1 - .1, 34); g.strokeStyle = css([200, 170, 90], .95); g.lineWidth = 3.4; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c2[0], c2[1]); g.stroke(); g.strokeStyle = css(INK, .6); g.lineWidth = .8; g.stroke(); }
    const lk = gp(S, (u0 + u1) / 2, v1 - .06, 22); g.fillStyle = css([220, 190, 100]); g.fillRect(lk[0] - 3, lk[1] - 3, 6, 7); g.strokeStyle = css(INK, .9); g.lineWidth = 1; g.strokeRect(lk[0] - 3, lk[1] - 3, 6, 7);
    handText(g, 'PROPS', gp(S, u1 - .06, (v0 + v1) / 2, 14)[0], gp(S, u1 - .06, (v0 + v1) / 2, 14)[1], 7, [230, 200, 130], r, 22, { shadow: [0, 0, 0, 0] });
    return;
  }
  const c = v === 1 ? [150, 130, 90] : [172, 128, 78];
  const stack = v === 3 ? 2 : 1;
  for (let s = 0; s < stack; s++) {
    const z0 = s * 28, uu0 = u0 + .04 + s * .18, vv0 = v0 + .04 + s * .1, uu1 = u1 - .04 - (s ? .2 : 0), vv1 = v1 - .04;
    fcs(g, S, r, uu0, vv0, uu1, vv1, z0, z0 + 28, c, { vert: false, alt: [220, 180, 120], dens: 24 });
    // slat lines + corner braces
    g.strokeStyle = css(INK, .45); g.lineWidth = 1.2;
    for (const [fu, fv] of [[uu1, null], [null, vv1]]) {
      for (let k = 1; k < 3; k++) { const z = z0 + k * 9.3; const a = fu === null ? gp(S, uu0, vv1, z) : gp(S, uu1, vv0, z), b = fu === null ? gp(S, uu1, vv1, z) : gp(S, uu1, vv1, z); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    }
    const bq = gp(S, uu1, (vv0 + vv1) / 2, z0 + 14), bq2 = gp(S, (uu0 + uu1) / 2, vv1, z0 + 14);
    g.strokeStyle = css([60, 40, 26], .6); g.lineWidth = 2; g.beginPath(); g.moveTo(bq[0] - 12, bq[1] + 10); g.lineTo(bq[0] + 12, bq[1] - 10); g.stroke(); g.beginPath(); g.moveTo(bq2[0] - 12, bq2[1] - 10); g.lineTo(bq2[0] + 12, bq2[1] + 10); g.stroke();
    if (v === 1 && s === 0) handText(g, 'PROPERTY OF', bq2[0], bq2[1] - 5, 5, [40, 30, 24], r, 28, { shadow: [0, 0, 0, 0] });
  }
};
PROPS.lamp = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  contactShadow(g, S, cu - .3, cv - .3, cu + .3, cv + .3, .8);
  if (v === 1) { // street lamp post
    cylBody(g, S, r, cu, cv, .2, 0, 10, [50, 54, 56], { ink: true });
    vbar(g, S, r, cu, cv, 8, 124, 5, [44, 48, 50]);
    const t = gp(S, cu, cv, 124);
    paintPoly(g, [[t[0] - 10, t[1] - 4], [t[0] + 10, t[1] - 4], [t[0] + 14, t[1] - 24], [t[0] - 14, t[1] - 24]], [220, 190, 110], r, { n: 10, ink: true, inkw: 2, alt: [255, 240, 180] });
    paintPoly(g, [[t[0] - 17, t[1] - 24], [t[0] + 17, t[1] - 24], [t[0], t[1] - 34]], [44, 48, 50], r, { n: 8, ink: true });
    S.lights.push({ x: t[0], y: t[1] - 14 + (S.zoff || 0), r: 150, col: [255, 190, 100], a: .45, fl: .04, ph: r() * 6, kind: 'lamp' });
    S.lights.push({ x: t[0], y: t[1] + 40 + (S.zoff || 0), r: 90, col: [255, 170, 80], a: .1, fl: .03, ph: r() * 6, kind: 'pool' });
    return;
  }
  cylBody(g, S, r, cu, cv, .22, 0, 4, [60, 44, 36], { ink: true });
  vbar(g, S, r, cu, cv, 3, v === 2 ? 70 : 92, v === 2 ? 3 : 3.4, v === 2 ? [90, 90, 94] : [120, 90, 56]);
  const t = gp(S, cu, cv, v === 2 ? 72 : 94);
  if (v === 2) { // caged bulb
    g.fillStyle = css([255, 240, 190]); g.beginPath(); g.arc(t[0], t[1] - 6, 6, 0, 7); g.fill(); g.strokeStyle = css([40, 40, 44], .9); g.lineWidth = 1.2; g.beginPath(); g.arc(t[0], t[1] - 6, 9, 0, 7); g.moveTo(t[0] - 9, t[1] - 6); g.lineTo(t[0] + 9, t[1] - 6); g.moveTo(t[0], t[1] - 15); g.lineTo(t[0], t[1] + 3); g.stroke();
    S.lights.push({ x: t[0], y: t[1] - 6 + (S.zoff || 0), r: 130, col: [255, 200, 120], a: .4, fl: .1, ph: r() * 6, kind: 'lamp' });
  } else {
    paintPoly(g, [[t[0] - 11, t[1] - 4], [t[0] + 11, t[1] - 4], [t[0] + 7, t[1] - 22], [t[0] - 7, t[1] - 22]], [226, 198, 140], r, { n: 14, ink: true, inkw: 1.8, alt: [255, 230, 170], lit: [[255, 250, 210], [160, 100, 60], 0, .6, .5] });
    g.fillStyle = css([255, 220, 150], .9); g.fillRect(t[0] - 8, t[1] - 4, 16, 2.4);
    S.lights.push({ x: t[0], y: t[1] - 10 + (S.zoff || 0), r: 140, col: [255, 190, 100], a: .42, fl: .06, ph: r() * 6, kind: 'lamp' });
  }
  S.lights.push({ x: gp(S, cu, cv, 0)[0], y: gp(S, cu, cv, 0)[1] + (S.zoff || 0), r: 70, col: [255, 170, 80], a: .1, fl: .03, ph: r() * 6, kind: 'pool' });
};
PROPS.loudspeaker = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  contactShadow(g, S, cu - .2, cv - .2, cu + .2, cv + .2, .8);
  cylBody(g, S, r, cu, cv, .16, 0, 6, [60, 60, 62], { ink: true });
  vbar(g, S, r, cu, cv, 4, 196, 5.4, [96, 98, 96], { lit: [[255, 200, 140], [10, 14, 24], 0, .6, .5] });
  const t = gp(S, cu, cv, 190);
  for (let i = 0; i < (v === 1 ? 2 : 3); i++) {
    const a = i * 2.2 + .6 + (v === 1 ? 1 : 0), dx = Math.cos(a) * 14, dy = Math.sin(a) * 4;
    paintPoly(g, [[t[0] + dx - 9, t[1] + dy - 8], [t[0] + dx + 10, t[1] + dy - 8], [t[0] + dx + 22, t[1] + dy - 18], [t[0] + dx + 22, t[1] + dy + 18], [t[0] + dx + 10, t[1] + dy + 8], [t[0] + dx - 9, t[1] + dy + 8]], [102, 100, 90], r, { n: 20, ink: true, ang: 0, lit: [[255, 210, 150], [10, 10, 20], -1.57, .5, .5] });
    paintEll(g, t[0] + dx + 22, t[1] + dy, 5, 18, [28, 26, 26], r, { n: 5, ink: true });
  }
  g.strokeStyle = css([20, 20, 20], .8); g.lineWidth = 1; g.beginPath(); g.moveTo(t[0], t[1] + 10); g.quadraticCurveTo(t[0] - 40, t[1] + 80, t[0] - 80, t[1] + 30); g.stroke();
};
PROPS.sack = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  contactShadow(g, S, cu - .35, cv - .35, cu + .35, cv + .35, .9);
  const n = v === 2 ? 3 : v === 1 ? 2 : 1;
  for (let i = 0; i < n; i++) {
    const o = gp(S, cu + (i - (n - 1) / 2) * .38, cv + (i % 2) * .2, i === 2 ? 22 : 0), c = jit([176, 150, 104], r, .1), h = 30 + r() * 8;
    paintPoly(g, [[o[0] - 15, o[1] - 2], [o[0] - 17, o[1] - h * .5], [o[0] - 8, o[1] - h * .85], [o[0] - 5, o[1] - h], [o[0] - 7, o[1] - h - 4], [o[0] + 7, o[1] - h - 4], [o[0] + 5, o[1] - h], [o[0] + 9, o[1] - h * .85], [o[0] + 17, o[1] - h * .5], [o[0] + 15, o[1] - 2], [o[0], o[1] + 4]], c, r, { n: 44, sw: 3, ang: 2, aj: 1, ink: true, inkw: 1.8, alt: [220, 190, 130], lit: [[255, 220, 160], [60, 50, 60], Math.PI, .4, .5], wob: 2 });
    g.strokeStyle = css([60, 40, 26], .8); g.lineWidth = 1.8; g.beginPath(); g.moveTo(o[0] - 6, o[1] - h + 3); g.lineTo(o[0] + 6, o[1] - h + 5); g.stroke();
    if (v === 0 || i === 0) handText(g, 'FLOUR', o[0], o[1] - h * .45, 6, [150, 40, 36], r, 20, { shadow: [0, 0, 0, 0] });
  }
};
PROPS.barrel = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, h = v === 1 ? 44 : 40;
  contactShadow(g, S, cu - .4, cv - .4, cu + .4, cv + .4, 1);
  const col = v === 1 ? [64, 86, 110] : v === 2 ? [120, 90, 60] : [136, 98, 60];
  cylBody(g, S, r, cu, cv, .38, 0, h, col, { ink: true, sw: 3, alt: v === 1 ? [160, 80, 40] : [190, 140, 90], topCol: v === 2 ? [96, 110, 120] : mul(col, .8) });
  for (const z of [6, h / 2, h - 6]) { const c0 = gp(S, cu, cv, z); g.strokeStyle = css(v === 1 ? [30, 40, 54] : [50, 52, 56], .95); g.lineWidth = 2.4; g.beginPath(); g.ellipse(c0[0], c0[1], ecx(.38) - .5, ecy(.38), 0, 0, Math.PI); g.stroke(); }
  if (v === 1) { g.save(); g.globalCompositeOperation = 'source-atop'; for (let i = 0; i < 8; i++) { const q = gp(S, cu + r.r(-.3, .3), cv + .3, r.r(5, 35)); g.fillStyle = css([150, 70, 30], .3); g.fillRect(q[0], q[1], r.r(2, 8), r.r(3, 8)); } g.restore(); }
};
PROPS.mic = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  contactShadow(g, S, cu - .25, cv - .25, cu + .25, cv + .25, .8);
  cylBody(g, S, r, cu, cv, .2, 0, 4, [44, 46, 50], { ink: true });
  vbar(g, S, r, cu, cv, 3, 64, 3, [100, 102, 104], { lit: [[255, 220, 170], [10, 10, 20], 0, .6, .5] });
  const t = gp(S, cu, cv, 64);
  g.strokeStyle = css([80, 82, 84]); g.lineWidth = 2.6; g.beginPath(); g.moveTo(t[0], t[1]); g.quadraticCurveTo(t[0] + 6, t[1] - 18, t[0] + 12, t[1] - 22); g.stroke();
  paintEll(g, t[0] + 14, t[1] - 24, 6, 8, v === 0 ? [90, 90, 92] : [150, 156, 160], r, { n: 10, ink: true, alt: [255, 255, 255] });
  g.strokeStyle = css([20, 20, 22], .6); g.lineWidth = .8; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(t[0] + 8, t[1] - 24 + k * 3); g.lineTo(t[0] + 20, t[1] - 24 + k * 3); g.stroke(); }
  g.fillStyle = css([255, 240, 200], .6); g.beginPath(); g.arc(t[0] + 16, t[1] - 28, 1.4, 0, 7); g.fill();
  if (v === 1) { g.strokeStyle = css([20, 20, 22], .9); g.lineWidth = 1.6; g.beginPath(); g.moveTo(t[0], t[1] + 30); g.quadraticCurveTo(t[0] + 20, t[1] + 50, t[0] + 60, t[1] + 44); g.stroke(); }
};
PROPS.sofa = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, c = [[70, 100, 80], [120, 78, 54], [130, 50, 50], [90, 92, 110]][v];
  contactShadow(g, S, u0, v0, u1, v1, .9);
  fcs(g, S, r, u0, v0, u1, v0 + .35, 10, 48, c, { vert: false, alt: mul(c, 1.4) });
  fcs(g, S, r, u0, v0 + .2, u0 + .3, v1, 10, 34, c, {});
  fcs(g, S, r, u1 - .3, v0 + .2, u1, v1, 10, 34, c, {});
  const n = Math.max(1, Math.round((u1 - u0) / 0.9));
  for (let i = 0; i < n; i++) fcs(g, S, r, lerp(u0 + .3, u1 - .3, i / n) + .02, v0 + .3, lerp(u0 + .3, u1 - .3, (i + 1) / n) - .02, v1 - .02, 10, 26, mul(c, 1.08), { alt: mul(c, 1.5), dens: 26 });
  for (const uu of [u0 + .15, u1 - .15]) { vbar(g, S, r, uu, v1 - .1, 0, 10, 3.4, [40, 30, 24]); }
};
PROPS.cart = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I;
  contactShadow(g, S, u0, v0, u1, v1, .9);
  const c = v === 1 ? [140, 100, 64] : [160, 166, 166];
  for (const [uu, vv] of [[u0 + .1, v0 + .1], [u1 - .1, v0 + .1], [u1 - .1, v1 - .1], [u0 + .1, v1 - .1]]) vbar(g, S, r, uu, vv, 6, 50, 2.6, mul(c, .7));
  fcs(g, S, r, u0 + .05, v0 + .05, u1 - .05, v1 - .05, 14, 17, c, {}); fcs(g, S, r, u0, v0, u1, v1, 46, 49, c, {});
  for (const [uu, vv] of [[u0 + .2, v1 - .05], [u1 - .05, v1 - .2], [u1 - .05, v0 + .2]]) { const q = gp(S, uu, vv, 6); g.fillStyle = css([30, 30, 32]); g.beginPath(); g.arc(q[0], q[1], 5, 0, 7); g.fill(); g.strokeStyle = css([120, 120, 120]); g.lineWidth = 1; g.stroke(); }
  for (let i = 0; i < 4; i++) { const q = gp(S, lerp(u0 + .15, u1 - .15, r()), lerp(v0 + .1, v1 - .1, r()), 49); paintPoly(g, [[q[0] - 8, q[1]], [q[0], q[1] - 4], [q[0] + 8, q[1]], [q[0], q[1] + 4]], [190, 180, 150], r, { n: 3, ink: true }); }
};
PROPS.tray = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, q = gp(S, cu, cv, 0);
  const pts = [[q[0] - 17, q[1]], [q[0], q[1] - 8.5], [q[0] + 17, q[1]], [q[0], q[1] + 8.5]];
  g.fillStyle = css([6, 4, 14], .3); pathPoly(g, pts.map(a => [a[0] - 2, a[1] + 2])); g.fill();
  paintPoly(g, pts, [150, 156, 154], r, { n: 10, ink: true, ew: 1.2, ha: 1 });
  paintPoly(g, [[q[0] - 13, q[1]], [q[0], q[1] - 6.5], [q[0] + 13, q[1]], [q[0], q[1] + 6.5]], [112, 118, 116], r, { n: 4, ink: false });
  const bu = cu - .12, bq = gp(S, bu, cv, 0);
  g.fillStyle = css([210, 204, 184]); g.beginPath(); g.ellipse(bq[0], bq[1] - 3, 7, 3.4, 0, 0, 7); g.fill(); g.strokeStyle = css(INK, .85); g.lineWidth = 1.2; g.stroke();
  g.fillStyle = css(v % 2 ? [150, 100, 50] : [110, 140, 70]); g.beginPath(); g.ellipse(bq[0], bq[1] - 3.6, 5, 2.2, 0, 0, 7); g.fill();
  g.strokeStyle = css([220, 220, 220], .9); g.lineWidth = 1.6; g.beginPath(); g.moveTo(q[0] + 4, q[1] + 2); g.lineTo(q[0] + 12, q[1] - 3); g.stroke(); g.fillStyle = css([220, 220, 220]); g.beginPath(); g.ellipse(q[0] + 4, q[1] + 2, 2.4, 1.3, 0, 0, 7); g.fill();
};
PROPS.tree = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, base = gp(S, cu, cv, 0), bx = base[0], by = base[1];
  g.fillStyle = css([6, 4, 16], .22); g.beginPath(); g.ellipse(bx - 14, by + 4, 70, 26, -.1, 0, 7); g.fill();
  paintPoly(g, [[bx - 11, by + 4], [bx - 7, by - 60], [bx - 13, by - 110], [bx + 6, by - 112], [bx + 3, by - 62], [bx + 12, by + 4]], [84, 62, 46], r, { n: 50, ang: 1.57, aj: .2, sw: 3, ink: true, inkw: 2, alt: [140, 100, 70], lit: [[200, 160, 110], [20, 20, 40], Math.PI, .4, .5] });
  const cols = v === 1 ? [[90, 96, 50], [60, 66, 44], [130, 110, 50]] : [[148, 118, 44], [176, 96, 40], [104, 122, 52], [200, 150, 50], [120, 70, 40]];
  const blobs = v === 1 ? 7 : 12;
  const cx0 = bx - 4, cy0 = by - 150;
  for (let i = 0; i < blobs; i++) {
    const a = r() * 6.28, d = r() * 52, x = cx0 + Math.cos(a) * d * 1.3, y = cy0 + Math.sin(a) * d * .8 - (i / blobs) * 10;
    paintEll(g, x, y, r.r(26, 44), r.r(20, 34), jit(r.p(cols), r, .1), r, { n: 12, sw: 5, ang: r() * 3, aj: 1.5, ink: false, alt: [230, 180, 70], edge: false, jv: .18 });
  }
  const leaves = v === 1 ? 70 : 190;
  for (let i = 0; i < leaves; i++) {
    const a = r() * 6.28, d = Math.sqrt(r()) * 82, x = cx0 + Math.cos(a) * d * 1.2, y = cy0 + Math.sin(a) * d * .75;
    const rim = Math.cos(a - -.8) > .5 ? 1 : 0;
    const c = rim ? mix(r.p(cols), [255, 190, 90], .5) : mix(r.p(cols), [30, 40, 50], r() * .4);
    bristle(g, x, y, r() * 6.28, r.r(6, 14), r.r(2.5, 5), c, .6, r);
  }
  g.strokeStyle = css([60, 44, 34], .9); g.lineWidth = 3; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(bx, by - 100); g.lineTo(bx + r.r(-40, 40), by - r.r(125, 150)); g.stroke(); }
  for (let i = 0; i < 14; i++) { g.fillStyle = css([255, 230, 160], .2); g.beginPath(); g.arc(cx0 + r.r(-60, 60), cy0 + r.r(-40, 30), r.r(1.5, 4), 0, 7); g.fill(); }
};
PROPS.bell = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  contactShadow(g, S, cu - .45, cv - .45, cu + .45, cv + .45, 1);
  fcs(g, S, r, cu - .4, cv - .35, cu + .4, cv + .35, 0, 8, [110, 108, 100], {});
  for (const du of [-.32, .32]) { const a = gp(S, cu + du, cv, 8), b = gp(S, cu + du * .2, cv, 112); paintPoly(g, [[a[0] - 3, a[1]], [a[0] + 3, a[1]], [b[0] + 2, b[1]], [b[0] - 2, b[1]]], [96, 64, 40], r, { n: 6, ink: true, ang: 1.57 }); }
  const t = gp(S, cu, cv, 112); paintRect(g, t[0] - 18, t[1] - 4, 36, 7, [92, 62, 38], r, { n: 8, ink: true, ang: 0 });
  const bc = v === 1 ? [90, 150, 126] : [196, 144, 60];
  paintPoly(g, [[t[0] - 6, t[1] + 3], [t[0] + 6, t[1] + 3], [t[0] + 10, t[1] + 14], [t[0] + 18, t[1] + 34], [t[0] + 22, t[1] + 44], [t[0] - 22, t[1] + 44], [t[0] - 18, t[1] + 34], [t[0] - 10, t[1] + 14]], bc, r, { n: 40, ang: 1.5, ink: true, inkw: 2, lit: [[255, 240, 180], [60, 30, 20], Math.PI, .6, .5], alt: [255, 220, 120] });
  g.fillStyle = css([20, 12, 10], .9); g.beginPath(); g.ellipse(t[0], t[1] + 44, 22, 5, 0, 0, 7); g.fill();
  g.strokeStyle = css([210, 190, 140]); g.lineWidth = 1.4; g.beginPath(); g.moveTo(t[0] + 30, t[1] - 3); g.quadraticCurveTo(t[0] + 36, t[1] + 40, t[0] + 28, t[1] + 78); g.stroke();
  g.fillStyle = css([140, 70, 44]); g.beginPath(); g.arc(t[0] + 28, t[1] + 80, 3, 0, 7); g.fill();
};
PROPS.hoop = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  contactShadow(g, S, cu - .25, cv - .35, cu + .25, cv + .25, .8);
  // support pole behind, with brace
  cylBody(g, S, r, cu, cv - .35, .16, 0, 6, [60, 60, 62], { ink: true });
  vbar(g, S, r, cu, cv - .35, 4, 150, 6, [90, 94, 96], { lit: [[255, 200, 140], [10, 14, 24], 0, .6, .5] });
  const b0 = gp(S, cu, cv - .35, 148), b1 = gp(S, cu, cv, 112);
  g.strokeStyle = css([70, 74, 76]); g.lineWidth = 4; g.beginPath(); g.moveTo(b0[0], b0[1]); g.lineTo(b1[0], b1[1] - 2); g.stroke();
  g.strokeStyle = css(INK, .8); g.lineWidth = 1; g.stroke();
  // backboard
  fcs(g, S, r, cu - .6, cv - .05, cu + .6, cv + .02, 98, 150, [226, 224, 214], { alt: [255, 255, 255], ink: true, dens: 50 });
  const inner = [gp(S, cu - .22, cv + .03, 110), gp(S, cu + .22, cv + .03, 110), gp(S, cu + .22, cv + .03, 132), gp(S, cu - .22, cv + .03, 132)];
  g.strokeStyle = css([190, 50, 40], .95); g.lineWidth = 2; pathPoly(g, inner); g.stroke();
  const rim = gp(S, cu, cv + .38, 106);
  g.strokeStyle = css([220, 90, 40]); g.lineWidth = 3; g.beginPath(); g.ellipse(rim[0], rim[1], ecx(.3), ecy(.3), 0, 0, 7); g.stroke(); g.strokeStyle = css(INK, .7); g.lineWidth = .8; g.stroke();
  g.strokeStyle = css([236, 232, 220], .75); g.lineWidth = 1;
  for (let k = 0; k < 9; k++) { const a = k / 9 * 6.28, x = rim[0] + Math.cos(a) * ecx(.3), y = rim[1] + Math.sin(a) * ecy(.3); g.beginPath(); g.moveTo(x, y); g.lineTo(rim[0] + Math.cos(a) * ecx(.15), rim[1] + 20 + Math.sin(a) * ecy(.15)); g.stroke(); }
};
PROPS.fence = function (g, S, p, I) {   // free-standing low railing along the long axis
  const { r, v, u0, v0, u1, v1 } = I, alongU = (u1 - u0) >= (v1 - v0), cv = (v0 + v1) / 2, cu = (u0 + u1) / 2;
  const n = Math.max(2, Math.round((alongU ? u1 - u0 : v1 - v0) * 3));
  for (let i = 0; i <= n; i++) { const t = i / n; const uu = alongU ? lerp(u0 + .05, u1 - .05, t) : cu, vv = alongU ? cv : lerp(v0 + .05, v1 - .05, t); vbar(g, S, r, uu, vv, 0, 40, 2.6, [40, 40, 46]); }
  for (const z of [34, 10]) { const a = gp(S, alongU ? u0 : cu, alongU ? cv : v0, z), b = gp(S, alongU ? u1 : cu, alongU ? cv : v1, z); g.strokeStyle = css([36, 36, 42]); g.lineWidth = 3; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
};
PROPS.chalkboard = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  contactShadow(g, S, cu - .4, cv - .2, cu + .4, cv + .2, .8);
  const q = gp(S, cu, cv, 0);
  g.strokeStyle = css([90, 62, 40]); g.lineWidth = 4; g.beginPath(); g.moveTo(q[0] - 24, q[1]); g.lineTo(q[0] - 14, q[1] - 70); g.moveTo(q[0] + 24, q[1]); g.lineTo(q[0] + 14, q[1] - 70); g.moveTo(q[0], q[1] + 3); g.lineTo(q[0], q[1] - 58); g.stroke();
  g.save(); g.translate(q[0] - 30, q[1] - 82); g.transform(1, .45, 0, 1, 0, 0);
  paintRect(g, -3, -3, 66, 50, [120, 84, 50], r, { n: 16, ink: true, ang: 0 }); paintRect(g, 0, 0, 60, 44, [34, 46, 42], r, { n: 30, sw: 5, ang: .2, aj: 1, alt: [70, 84, 78], ink: true }); chalkMenu(g, r, 0, 0, 60, 44, 'MENU'); g.restore();
};
PROPS.mirror = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, q = gp(S, cu, cv, 0);
  contactShadow(g, S, cu - .35, cv - .2, cu + .35, cv + .2, .8);
  g.strokeStyle = css([80, 54, 34]); g.lineWidth = 5; g.beginPath(); g.moveTo(q[0] - 20, q[1]); g.lineTo(q[0] - 14, q[1] - 40); g.moveTo(q[0] + 20, q[1]); g.lineTo(q[0] + 14, q[1] - 40); g.stroke();
  g.save(); g.translate(q[0], q[1] - 46);
  paintPoly(g, ellPts(0, -34, 22, 40, 20, 0, r, .02), [100, 70, 44], r, { n: 30, ink: true, ang: 1.57, alt: [180, 130, 70] });
  const gr = g.createLinearGradient(-16, -66, 16, -4); gr.addColorStop(0, css([186, 200, 196])); gr.addColorStop(.5, css([100, 126, 130])); gr.addColorStop(1, css([46, 62, 76]));
  g.fillStyle = gr; g.beginPath(); g.ellipse(0, -34, 17, 35, 0, 0, 7); g.fill();
  g.strokeStyle = css([14, 18, 22], .9); g.lineWidth = 1.1; g.beginPath(); g.moveTo(-6, -66); g.lineTo(2, -44); g.lineTo(-4, -26); g.lineTo(8, -8); g.moveTo(2, -44); g.lineTo(16, -50); g.moveTo(-4, -26); g.lineTo(-16, -30); g.stroke();
  g.strokeStyle = css([255, 255, 255], .35); g.lineWidth = 2.5; g.beginPath(); g.moveTo(-10, -58); g.lineTo(-10, -20); g.stroke();
  g.restore();
};
PROPS.ladder = function (g, S, p, I) {   // free-standing ladder leaning
  const { r, v, u0, v0, u1, v1 } = I, q = gp(S, (u0 + u1) / 2, (v0 + v1) / 2, 0);
  g.strokeStyle = css([150, 110, 70]); g.lineWidth = 3; g.beginPath(); g.moveTo(q[0] - 8, q[1]); g.lineTo(q[0] - 2, q[1] - 90); g.moveTo(q[0] + 8, q[1]); g.lineTo(q[0] + 14, q[1] - 90); g.stroke();
  for (let z = 10; z < 86; z += 12) { g.beginPath(); g.moveTo(q[0] - 8 + z * .07, q[1] - z); g.lineTo(q[0] + 8 + z * .07, q[1] - z); g.stroke(); }
};
/* ---- flat (floor-level) props, baked into the floor layer ---- */
FLAT.rug = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, W = (u1 - u0) * 64, H = (v1 - v0) * 64;
  g.save(); g.translate(...gp(S, u0, v0, 0)); g.transform(.5, .25, -.5, .25, 0, 0);
  g.fillStyle = css([8, 6, 14], .35); g.fillRect(-3, -2, W + 6, H + 6);
  const pal = [[[148, 44, 40], [226, 176, 90], [40, 56, 60]], [[44, 100, 104], [226, 196, 140], [150, 70, 50]], [[60, 92, 70], [196, 170, 100], [120, 30, 30]], [[110, 80, 60], [180, 150, 110], [60, 50, 44]]][v];
  paintRect(g, 0, 0, W, H, pal[0], r, { n: W * H / 90, sw: 5, ang: 0, aj: .1, alt: pal[1], jv: .1, ink: true, ew: 1.4, ha: .4 });
  paintRect(g, 8, 8, W - 16, H - 16, mul(pal[0], .8), r, { n: W * H / 140, sw: 4, ang: 0, alt: pal[2], jv: .1, ink: false, edge: false });
  g.strokeStyle = css(pal[1], .9); g.lineWidth = 3; g.strokeRect(14, 14, W - 28, H - 28); g.strokeStyle = css(pal[2], .8); g.lineWidth = 2; g.strokeRect(22, 22, W - 44, H - 44);
  const cx = W / 2, cy = H / 2, k = Math.min(W, H) / 2 - 30;
  g.fillStyle = css(pal[1], .85); g.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283, rr = i % 2 ? k * .35 : k * .8; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.closePath(); g.fill(); g.strokeStyle = css(pal[2], .9); g.lineWidth = 2; g.stroke();
  g.fillStyle = css(pal[2], .9); g.beginPath(); g.arc(cx, cy, k * .18, 0, 7); g.fill();
  if (v === 2) { g.fillStyle = css([230, 200, 100], .9); g.beginPath(); g.arc(cx, cy, k * .3, 0, 7); g.fill(); handText(g, 'W', cx, cy, k * .3, [120, 30, 30], r, k * .4, { shadow: [0, 0, 0, 0] }); }
  for (let x = 0; x < W; x += 5) { g.fillStyle = css(pal[1], .7); g.fillRect(x, -3, 1.6, 4); g.fillRect(x, H - 1, 1.6, 4); }
  for (let i = 0; i < 18; i++) { g.fillStyle = css([20, 16, 14], .08); g.beginPath(); g.ellipse(r() * W, r() * H, r.r(8, 24), r.r(5, 14), 0, 0, 7); g.fill(); }
  g.restore();
};
FLAT.mat = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, W = (u1 - u0) * 64, H = (v1 - v0) * 64, col = v === 1 ? [64, 98, 120] : [150, 70, 54];
  // thick padded slab: sides then top
  const t = 9;
  const A = gp(S, u0, v0, t), B = gp(S, u1, v0, t), Cc = gp(S, u1, v1, t), D = gp(S, u0, v1, t), D0 = gp(S, u0, v1, 0), C0 = gp(S, u1, v1, 0), B0 = gp(S, u1, v0, 0);
  g.fillStyle = css([6, 4, 14], .35); pathPoly(g, [A, B, Cc, D].map(q => [q[0] - 4, q[1] + t + 2])); g.fill();
  paintPoly(g, [D, Cc, C0, D0], mul(col, .55), r, { n: 20, ang: .46, ink: true });
  paintPoly(g, [Cc, B, B0, C0], mul(col, .85), r, { n: 20, ang: 2.68, ink: true });
  g.save(); g.translate(A[0], A[1]); g.transform(.5, .25, -.5, .25, 0, 0);
  g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.clip();
  g.fillStyle = css(mul(col, 1.05)); g.fillRect(0, 0, W, H);
  for (let i = 0; i < W * H / 60; i++) bristle(g, r() * W, r() * H, r() * 3, 20, 5, jit(col, r, .16), .5, r);
  const nx = Math.max(2, Math.round(W / 64)), ny = Math.max(2, Math.round(H / 64));
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const x0 = i * W / nx, y0 = j * H / ny, w = W / nx, h = H / ny;
    const gg = g.createRadialGradient(x0 + w * .6, y0 + h * .4, 2, x0 + w / 2, y0 + h / 2, w * .7); gg.addColorStop(0, 'rgba(255,220,170,.25)'); gg.addColorStop(1, 'rgba(10,6,20,.28)'); g.fillStyle = gg; g.fillRect(x0 + 1, y0 + 1, w - 2, h - 2);
    g.strokeStyle = css([20, 12, 14], .7); g.lineWidth = 2; g.strokeRect(x0 + 1, y0 + 1, w - 2, h - 2);
    g.fillStyle = css([230, 210, 170], .6); g.beginPath(); g.arc(x0 + w / 2, y0 + h / 2, 2.2, 0, 7); g.fill();
  }
  g.restore();
  rimStroke(g, [Cc, B, A], [255, 190, 120], .5, 1.6);
  if (v === 1) { const h1 = gp(S, (u0 + u1) / 2, v1, 5); g.strokeStyle = css([230, 220, 190], .9); g.lineWidth = 2; g.beginPath(); g.ellipse(h1[0], h1[1], 8, 2.6, 0, 0, 7); g.stroke(); }
};
FLAT.rope = function (g, S, p, I) {
  const { r, u0, v0, u1, v1 } = I, c = gp(S, (u0 + u1) / 2, (v0 + v1) / 2, 0);
  g.fillStyle = css([6, 4, 14], .35); g.beginPath(); g.ellipse(c[0] - 3, c[1] + 3, 20, 9, 0, 0, 7); g.fill();
  for (let k = 0; k < 4; k++) {
    g.strokeStyle = css(jit([176, 144, 96], r, .1)); g.lineWidth = 3.6; g.beginPath(); g.ellipse(c[0], c[1] - k * 1.6, 17 - k * 2.6, 7.6 - k * 1.2, 0, 0, 7); g.stroke();
    g.strokeStyle = css([60, 44, 28], .45); g.lineWidth = 1; g.setLineDash([2, 3]); g.stroke(); g.setLineDash([]);
  }
  g.strokeStyle = css([176, 144, 96]); g.lineWidth = 3.4; g.beginPath(); g.moveTo(c[0] + 12, c[1] + 2); g.bezierCurveTo(c[0] + 30, c[1] + 8, c[0] + 40, c[1] - 6, c[0] + 56, c[1] + 6); g.stroke(); g.strokeStyle = css(INK, .5); g.lineWidth = .9; g.stroke();
  g.fillStyle = css([120, 90, 60]); g.beginPath(); g.arc(c[0] + 56, c[1] + 6, 2.4, 0, 7); g.fill();
};
FLAT.stage = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, H = STAGE_H, wood = v === 1 ? [120, 78, 54] : [100, 72, 52];
  // front faces
  const A = gp(S, u0, v0, H), B = gp(S, u1, v0, H), Cc = gp(S, u1, v1, H), D = gp(S, u0, v1, H), D0 = gp(S, u0, v1, 0), C0 = gp(S, u1, v1, 0), B0 = gp(S, u1, v0, 0);
  g.fillStyle = css([6, 4, 14], .35); pathPoly(g, [D0, C0, B0, [B0[0] - 8, B0[1] + 6], [C0[0] - 8, C0[1] + 6], [D0[0] - 8, D0[1] + 6]]); g.fill();
  paintPoly(g, [D, Cc, C0, D0], mul(wood, .5), r, { n: 50, ang: 1.57, ink: true, alt: [160, 110, 70] });
  paintPoly(g, [Cc, B, B0, C0], mul(wood, .75), r, { n: 50, ang: 1.57, ink: true, alt: [200, 140, 80] });
  // top boards
  g.save(); g.translate(A[0], A[1]); g.transform(.5, .25, -.5, .25, 0, 0);
  const W = (u1 - u0) * 64, Hh = (v1 - v0) * 64; g.beginPath(); g.rect(0, 0, W, Hh); g.clip();
  for (let x = 0; x < W; x += 13) paintRect(g, x, 0, 12.5, Hh, jit(mul(wood, 1.25), r, .12), r, { n: 8, sw: 3, ang: 1.57, aj: .05, alt: [200, 150, 90], ink: false, edge: false });
  g.strokeStyle = css([20, 12, 10], .5); g.lineWidth = 1; for (let x = 0; x < W; x += 13) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, Hh); g.stroke(); }
  // worn centre, tape marks
  const gg = g.createRadialGradient(W / 2, Hh / 2, 10, W / 2, Hh / 2, Math.max(W, Hh) * .6); gg.addColorStop(0, 'rgba(255,220,160,.18)'); gg.addColorStop(1, 'rgba(0,0,0,.0)'); g.fillStyle = gg; g.fillRect(0, 0, W, Hh);
  g.fillStyle = css([226, 214, 170], .45); g.fillRect(W * .3, Hh * .2, 10, 2.5); g.fillRect(W * .55, Hh * .6, 10, 2.5);
  g.restore();
  rimStroke(g, [D, Cc, B], [255, 190, 110], .55, 1.8);
  // footlight row / front lip
  g.fillStyle = css([255, 200, 120], .5); const lipA = gp(S, u0, v1, H), lipB = gp(S, u1, v1, H);
  for (let i = 0; i < 6; i++) { const t = (i + .5) / 6; g.beginPath(); g.arc(lerp(lipA[0], lipB[0], t), lerp(lipA[1], lipB[1], t) + 2.5, 1.7, 0, 7); g.fill(); }
  if (v === 1) { // choir risers + bunting
    const rb = gp(S, u0, v0, H);
    for (let k = 0; k < 2; k++) { const z = H + 4 + k * 5; fcs(g, S, r, u0 + .1 + k * .4, v0 + .15, u1 - .3, v0 + .55 + k * .0, H, z, [96, 70, 50], {}); }
  }
  // steps
  const st = gp(S, u0 + (u1 - u0) * .35, v1, 0);
  fcs(g, S, r, u0 + (u1 - u0) * .3, v1, u0 + (u1 - u0) * .55, v1 + .38, 0, H * .5, mul(wood, 1.1), {});
};
const STAGE_H = 16;
FLAT.stairs = function (g, S, p, I) {
  // sunken stairwell: treads descend toward +u, clipped to the opening so they read as a pit
  const { r, v, u0, v0, u1, v1 } = I, W = u1 - u0, steps = 6, SH_ = 10;
  const open = [gp(S, u0, v0, 0), gp(S, u1, v0, 0), gp(S, u1, v1, 0), gp(S, u0, v1, 0)];
  g.save(); pathPoly(g, open); g.clip();
  const bb = bbox(open); g.fillStyle = css([6, 4, 10]); g.fillRect(bb[0] - 2, bb[1] - 2, bb[2] - bb[0] + 4, bb[3] - bb[1] + 80);
  paintPoly(g, [gp(S, u0, v0, 0), gp(S, u1, v0, 0), gp(S, u1, v0, -80), gp(S, u0, v0, -80)], [62, 58, 58], r, { n: 40, ang: 0, ink: false, edge: false, jv: .1 });
  paintPoly(g, [gp(S, u0, v0, 0), gp(S, u0, v1, 0), gp(S, u0, v1, -80), gp(S, u0, v0, -80)], [40, 38, 40], r, { n: 20, ang: 1.57, ink: false, edge: false });
  for (let i = 0; i < steps; i++) {
    const a = u0 + i * W / steps, b = a + W / steps, z = -(i + 1) * SH_ + 4, dk = Math.max(.32, 1 - i * .12);
    paintPoly(g, [gp(S, a, v0, z), gp(S, b, v0, z), gp(S, b, v1, z), gp(S, a, v1, z)], mul([168, 160, 146], dk), r, { n: 14, ang: 2.68, ink: true, inkw: 1.3, alt: [210, 196, 160], ew: 1 });
    paintPoly(g, [gp(S, b, v0, z), gp(S, b, v1, z), gp(S, b, v1, z - SH_), gp(S, b, v0, z - SH_)], mul([104, 98, 92], dk), r, { n: 8, ang: 2.68, ink: true, inkw: 1.1 });
  }
  const gl = g.createLinearGradient(...gp(S, u0, (v0 + v1) / 2, 0), ...gp(S, u1, (v0 + v1) / 2, -50)); gl.addColorStop(0, 'rgba(255,130,50,0)'); gl.addColorStop(1, 'rgba(255,130,50,.35)'); g.fillStyle = gl; pathPoly(g, open); g.fill();
  g.restore();
  // stone coping + railing along the front-left lip (v1) and back lip
  paintPoly(g, [gp(S, u0 - .04, v1, 0), gp(S, u1, v1, 0), gp(S, u1, v1 + .1, 0), gp(S, u0 - .04, v1 + .1, 0)], [150, 146, 136], r, { n: 8, ang: .46, ink: true, inkw: 1.3 });
  paintPoly(g, [gp(S, u0 - .1, v0 - .04, 0), gp(S, u0, v0 - .04, 0), gp(S, u0, v1, 0), gp(S, u0 - .1, v1, 0)], [150, 146, 136], r, { n: 8, ang: 2.68, ink: true, inkw: 1.3 });
  const n = 4;
  for (let i = 0; i <= n; i++) { const t = i / n; vbar(g, S, r, lerp(u0 + .1, u1 - .1, t), v1 + .05, 0, 36, 3, [40, 44, 46]); }
  const ra = gp(S, u0 + .1, v1 + .05, 36), rb = gp(S, u1 - .1, v1 + .05, 36);
  g.strokeStyle = css(INK, .9); g.lineWidth = 4.6; g.beginPath(); g.moveTo(ra[0], ra[1]); g.lineTo(rb[0], rb[1]); g.stroke(); g.strokeStyle = css([96, 100, 100]); g.lineWidth = 3; g.stroke(); g.strokeStyle = css([255, 190, 120], .6); g.lineWidth = 1; g.beginPath(); g.moveTo(ra[0] + 1, ra[1] - 1); g.lineTo(rb[0] + 1, rb[1] - 1); g.stroke();
  const rc = gp(S, u0 + .1, v1 + .05, 18), rd = gp(S, u1 - .1, v1 + .05, 18); g.strokeStyle = css([60, 64, 66], .9); g.lineWidth = 2; g.beginPath(); g.moveTo(rc[0], rc[1]); g.lineTo(rd[0], rd[1]); g.stroke();
  const wg = gp(S, u1 - .3, (v0 + v1) / 2, -30); S.lights.push({ x: wg[0], y: wg[1], r: 120, col: [255, 120, 50], a: .3, fl: .12, ph: r() * 6, kind: 'fire' });
};
FLAT.door = function (g, S, p, I) {   // cellar door/hatch standing at the foot of the stairs
  const { r, v, u0, v0, u1, v1 } = I, c = gp(S, (u0 + u1) / 2, (v0 + v1) / 2, 0);
  paintPoly(g, [[c[0] - 18, c[1]], [c[0] - 18, c[1] - 44], [c[0] + 18, c[1] - 62], [c[0] + 18, c[1] - 18]], [84, 70, 60], r, { n: 20, ink: true, ang: -.4 });
  paintPoly(g, [[c[0] - 13, c[1] - 4], [c[0] - 13, c[1] - 38], [c[0] + 13, c[1] - 52], [c[0] + 13, c[1] - 18]], [60, 50, 44], r, { n: 10, ink: true, ang: -.4 });
  g.fillStyle = css([255, 150, 60], .35); g.beginPath(); g.moveTo(c[0] - 13, c[1] - 4); g.lineTo(c[0] - 13, c[1] - 38); g.lineTo(c[0] + 13, c[1] - 52); g.lineTo(c[0] + 13, c[1] - 18); g.fill();
};

/* ============================================================ CHARACTERS */
const SS = 2, SC = 1.22, K = SS * SC, SPW = 90, SPH = 156, SAX = 45, SAY = 132;
const DEF_LOOK = { skin: '#d9a98a', hair: '#2a1d18', hairStyle: 'short', outfit: 'uniform', outfitColor: '#3f4d5c', accent: '#c9892f', build: 'avg', glasses: false, age: 'adult', pose: 'stand', extra: 'none' };
const FACE = { s: [0, 0], se: [45, 0], e: [90, 0], ne: [135, 0], n: [180, 0], nw: [135, 1], w: [90, 1], sw: [45, 1] };
const FACE_ALIAS = { south: 's', north: 'n', east: 'e', west: 'w' };
const _spr = new Map();

function normLook(look) { return Object.assign({}, DEF_LOOK, look || {}); }
function lookKey(l) { return [l.skin, l.hair, l.hairStyle, l.outfit, l.outfitColor, l.accent, l.build, l.glasses ? 1 : 0, l.age, l.extra].join('|'); }

function limb(g, r, x0, y0, x1, y1, w0, w1, col, o) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  const pts = [[x0 + nx * w0 / 2, y0 + ny * w0 / 2], [x1 + nx * w1 / 2, y1 + ny * w1 / 2], [x1 - nx * w1 / 2, y1 - ny * w1 / 2], [x0 - nx * w0 / 2, y0 - ny * w0 / 2]];
  const lit = [mix(col, [255, 190, 120], .3), mix(mul(col, .66), [30, 50, 90], .25), Math.PI, .4, .4];
  paintPoly(g, pts, col, r, Object.assign({ n: 8, sw: 1.7, sl: L * .6, ang: Math.atan2(dy, dx), aj: .12, ink: true, inkw: 1.1, ew: .8, lit, jv: .12 }, o));
  paintEll(g, x1, y1, w1 / 2 + .1, w1 / 2 + .1, col, r, Object.assign({ n: 5, ink: false, edge: false, pn: 10 }, o && o.end));
}
function ik(x0, y0, tx, ty, a, b, dir) {
  let dx = tx - x0, dy = ty - y0, d = Math.hypot(dx, dy); const mx = a + b - .3; if (d > mx) { dx *= mx / d; dy *= mx / d; d = mx; tx = x0 + dx; ty = y0 + dy; }
  if (d < .5) d = .5;
  const ca = clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1), ang = Math.acos(ca) * dir, base = Math.atan2(dy, dx);
  return [x0 + Math.cos(base + ang) * a, y0 + Math.sin(base + ang) * a, tx, ty];
}

function drawFigure(g, r, look, yawDeg, frame, pose, t0) {
  const L = look, yaw = yawDeg * Math.PI / 180, c = Math.cos(yaw), s = Math.sin(yaw), back = c < -0.15;
  const skin = C(L.skin), hairC = C(L.hair), outC = C(L.outfitColor), accC = C(L.accent);
  const build = L.build === 'heavy' ? 1.3 : L.build === 'slim' ? .86 : 1;
  const old = L.age === 'old', teen = L.age === 'teen';
  const H = teen ? 68 : old ? 69 : 74;
  const shW = 11.6 * build + (L.build === 'heavy' ? 1.5 : 0), depth = 7.4 * build;
  const hw = Math.sqrt((shW * c) * (shW * c) + (depth * s) * (depth * s));
  const hang = pose === 'hang', sit = pose === 'sit' || pose === 'wheelchair', wheel = pose === 'wheelchair';
  const slump = pose === 'slump' || (old && pose === 'stand' && false), lean = pose === 'lean';
  const walk = frame > 0, ph = (frame - 1) * Math.PI / 2, sw = walk ? Math.sin(ph) : 0, bob = walk ? Math.abs(Math.sin(ph)) * 1.4 : 0;
  const lift = hang ? 36 : 0;
  const fwdX = s, fwdY = c * .5;                 // screen vector of "forward"
  const legLen = H * .47, hipY = sit ? -(wheel ? 25 : 21) : -legLen - lift - bob;
  const torsoL = H * .30, shY = hipY - torsoL + (slump ? 4 : 0) + (sit ? 1 : 0), neckY = shY - 2.4 - (slump ? 1 : 0), headR = teen ? 7.9 : 8.5;
  const headCy = neckY - headR - 1.2 + (slump ? 4 : 0) + (old ? 1.2 : 0), headCx = (slump ? fwdX * 4.5 : old ? fwdX * 1.6 : 0) + (lean ? -fwdX * 1 : 0);
  const isLab = L.outfit === 'labcoat', isCoat = L.outfit === 'coat', isApron = L.outfit === 'apron';
  const longTop = isLab || isCoat;
  // pants colour
  const pantsC = ({ uniform: mul(outC, .62), coat: [50, 46, 48], apron: [62, 52, 52], overalls: outC, suit: mul(outC, .85), tracksuit: outC, cardigan: [66, 58, 58], labcoat: [58, 56, 60], shirtsleeves: [58, 54, 52] })[L.outfit] || mul(outC, .6);
  const shirtC = ({ uniform: mix(outC, [220, 214, 200], .0), coat: [90, 84, 78], apron: mul(outC, .55), overalls: [168, 150, 120], suit: [214, 208, 192], tracksuit: [210, 210, 204], cardigan: [214, 196, 160], labcoat: [90, 100, 110], shirtsleeves: outC })[L.outfit] || outC;
  const topC = ({ uniform: outC, coat: outC, apron: mix(outC, [90, 70, 60], .4), overalls: [168, 150, 120], suit: outC, tracksuit: outC, cardigan: outC, labcoat: outC, shirtsleeves: outC })[L.outfit] || outC;
  const shoeC = [34, 28, 28];
  const hipHalf = shW * .5 * Math.max(Math.abs(c), .3);
  const ground = -lift - bob * 0;
  // ---------- legs
  const legs = [];
  for (let k = 0; k < 2; k++) {                      // 0 = R (near in profile), 1 = L (far)
    const side = k === 0 ? -1 : 1, hx = side * hipHalf * (1) * (c >= 0 ? 1 : -1) + (side * 0), swK = (k === 0 ? 1 : -1) * sw;
    let kx, ky, fx, fy;
    if (sit) {
      const hx2 = hx, hy2 = hipY;
      kx = hx2 + fwdX * 14 + (wheel ? fwdX * 2 : 0); ky = hy2 + fwdY * 14 * .9 + 1;
      fx = kx + fwdX * (wheel ? 5 : 1); fy = (wheel ? -9 : -1) + fwdY * 14 * .9 + (wheel ? fwdY * 6 : 6) * .3 + (wheel ? 2 : 0);
      if (!wheel) { fy = ground + fwdY * 14 * .9 + 2; }
      legs.push({ hx: hx2, hy: hy2, kx, ky, fx, fy: fy, k });
    } else {
      const st = (hang ? 0 : swK * 7), fwdFoot = st;
      fx = hx + fwdX * fwdFoot + (hang ? side * .6 : 0); fy = ground + fwdY * fwdFoot * .9 - (swK > 0.4 ? 1.4 : 0) - (walk && swK > 0 ? Math.abs(swK) * 1.8 : 0);
      if (lean && k === 1) { fx += -fwdX * 5 * (s < .3 ? 0 : 1) - side * 2; }
      const midX = (hx + fx) / 2 + fwdX * (hang ? 0 : 1.2 + Math.max(0, swK) * 1.8), midY = (hipY + fy) / 2 + fwdY * .6;
      legs.push({ hx, hy: hipY + 1, kx: midX, ky: midY, fx, fy, k });
    }
  }
  const drawLeg = (lg) => {
    const w = 6.6 * build + (L.build === 'heavy' ? 1.2 : 0);
    limb(g, r, lg.hx, lg.hy, lg.kx, lg.ky, w, w * .86, pantsC, { sw: 1.8 });
    limb(g, r, lg.kx, lg.ky, lg.fx, lg.fy - 1.8, w * .86, w * .66, pantsC, { sw: 1.7 });
    // shoe
    const sx = lg.fx + fwdX * 2.4, sy = lg.fy + fwdY * 1.2;
    paintPoly(g, [[lg.fx - 3.2, lg.fy - 3], [lg.fx + 3.2, lg.fy - 3], [sx + 3.4 + fwdX * 1.5, sy + .6], [sx - 3.4, sy + 1.2]], shoeC, r, { n: 5, sw: 1.5, ink: true, inkw: 1.1, lit: [[120, 100, 90], [10, 10, 20], Math.PI, .4, .4] });
  };
  if (hang) {  /* nothing special: limp legs */ }
  const legOrder = (s > .3 || true) ? [legs[1], legs[0]] : legs;
  if (wheel) { /* wheel behind drawn later */ }
  // ---------- wheelchair back parts
  const wr = 15, wrx = Math.max(2.4, wr * (.12 + .88 * s));
  const wcx = (c >= 0 ? 1 : 1) * 0;
  const drawWheel = (side) => {
    const cx = side * (shW + 3.5) * Math.abs(c) + (s > .7 ? side * 0 : 0) - (s > .3 ? fwdX * -2 : 0), cy = -wr - .5;
    g.save(); g.lineCap = 'round';
    g.strokeStyle = css([20, 18, 22], .95); g.lineWidth = 3.4; g.beginPath(); g.ellipse(cx, cy, wrx, wr, 0, 0, 7); g.stroke();
    g.strokeStyle = css([120, 124, 128], .95); g.lineWidth = 1.4; g.beginPath(); g.ellipse(cx, cy, wrx, wr, 0, 0, 7); g.stroke();
    g.strokeStyle = css([255, 190, 120], .5); g.lineWidth = .8; g.beginPath(); g.ellipse(cx, cy, wrx, wr, 0, -2.4, -.6); g.stroke();
    if (wrx > 5) { g.strokeStyle = css([70, 72, 78], .8); g.lineWidth = .7; for (let a = 0; a < 6.28; a += .52) { g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * wrx * .92, cy + Math.sin(a) * wr * .92); g.stroke(); } }
    g.fillStyle = css([150, 150, 150]); g.beginPath(); g.ellipse(cx, cy, Math.max(1.3, wrx * .12), 1.8, 0, 0, 7); g.fill();
    g.restore();
  };
  if (wheel) {
    // frame/seat
    drawWheel(c >= 0 ? 1 : -1);          // far wheel
    paintPoly(g, [[-hipHalf - 5, hipY + 3], [hipHalf + 5, hipY + 3], [hipHalf + 5 + fwdX * 15, hipY + 3 + fwdY * 14], [-hipHalf - 5 + fwdX * 15, hipY + 3 + fwdY * 14]], [44, 40, 44], r, { n: 6, ink: true });
  }
  if (sit && !wheel) {  // simple chair under the sitter
    const sy0 = hipY + 4, hw2 = shW * .9;
    if (!back) paintPoly(g, [[-hw2 - 1 - s * 3, shY + 6], [hw2 + 1 - s * 8, shY + 6], [hw2 + 1 - s * 8, sy0], [-hw2 - 1 - s * 3, sy0]], [88, 60, 40], r, { n: 10, ink: true, ang: 1.57 });
    paintPoly(g, [[-hw2 - 2, sy0], [hw2 + 2, sy0], [hw2 + 2 + fwdX * 8, sy0 + fwdY * 8 + 2], [-hw2 - 2 + fwdX * 8, sy0 + fwdY * 8 + 2]], [118, 82, 54], r, { n: 10, ink: true });
    for (const sx of [-hw2, hw2]) { limb(g, r, sx, sy0 + 1, sx + fwdX * 2, ground + 1, 2.6, 2.2, [88, 60, 40], {}); }
  }
  if (!wheel || true) { for (const lg of legOrder) drawLeg(lg); }
  // ---------- far arm (L) before torso in profile
  const armLen = H * .36, aw = 5.6 * build + (L.build === 'heavy' ? 1 : 0);
  const extra = L.extra || 'none';
  const sleeveC = L.outfit === 'shirtsleeves' ? shirtC : L.outfit === 'apron' ? shirtC : topC;
  const armRoot = (k) => { const side = k === 0 ? -1 : 1; return [side * shW * c * .98 + (k === 0 ? fwdX * 0 : 0), shY + 2.4]; };
  const handTarget = (k) => {
    const [rx, ry] = armRoot(k), swA = (k === 0 ? -1 : 1) * sw, side = k === 0 ? -1 : 1;
    let tx = rx + side * 1.2 * Math.abs(c) + fwdX * swA * 7 * 1.0, ty = ry + armLen * .93 + fwdY * swA * 5;
    let bend = side * (c >= 0 ? 1 : -1) * 1;
    if (hang) { tx = rx + side * 1.5; ty = ry + armLen * .95; }
    if (sit) { tx = rx + fwdX * 8 + side * 1.5 * Math.abs(c); ty = ry + armLen * .62 + fwdY * 6; if (wheel) { tx = rx + fwdX * 10 + side * 3 * Math.abs(c); ty = ry + armLen * .7; } }
    if (lean) { tx = rx * .3 + fwdX * 4; ty = ry + armLen * .5; bend = 1; }                       // folded
    if (extra === 'cigarette' && k === 0) { tx = headCx + fwdX * 5.5 + (side * 0); ty = headCy + 5; bend = -side; }
    if (extra === 'mic' && k === 0) { tx = rx * .4 + fwdX * 8; ty = shY + 8; }
    if (extra === 'clipboard' && k === 0) { tx = rx * .2 + fwdX * 5; ty = shY + 13; bend = side; }
    if (extra === 'broom' && k === 0) { tx = rx + fwdX * 6; ty = shY + 9; }
    if (extra === 'ladle' && k === 0) { tx = fwdX * 8 + rx * .3; ty = shY + 9; bend = side; }
    if (extra === 'book' && k === 0) { tx = rx * .15 + fwdX * 5; ty = shY + 12; }
    if (extra === 'rope' && k === 0) { tx = rx + fwdX * 2; ty = hipY + 8; }
    if (extra === 'megaphone' && k === 0) { tx = fwdX * 7; ty = headCy + 7; bend = -side; }
    if (slump && !sit) { ty += 1.5; }
    return [tx, ty, bend];
  };
  const drawArm = (k) => {
    const [rx, ry] = armRoot(k), [tx, ty, bend] = handTarget(k);
    const e = ik(rx, ry, tx, ty, armLen * .52, armLen * .52, bend || 1);
    const bare = L.outfit === 'shirtsleeves' && false;
    limb(g, r, rx, ry, e[0], e[1], aw, aw * .86, sleeveC, { sw: 1.7 });
    const rolled = L.outfit === 'shirtsleeves' || L.outfit === 'cardigan' && false;
    limb(g, r, e[0], e[1], e[2], e[3], aw * .86, aw * .7, rolled ? skin : sleeveC, { sw: 1.6 });
    if (L.outfit === 'tracksuit') { g.strokeStyle = css(accC, .9); g.lineWidth = 1.2; g.beginPath(); g.moveTo(rx, ry + 1); g.lineTo(e[0], e[1]); g.lineTo(e[2], e[3] - 2); g.stroke(); }
    // hand
    paintEll(g, e[2], e[3] + 1, 2.5, 2.7, skin, r, { n: 5, ink: true, inkw: .9, pn: 10, edge: false });
    if (k === 0 && L.extra === 'armband') { const bx = (rx + e[0]) / 2, by = (ry + e[1]) / 2; paintPoly(g, [[bx - aw * .6, by - 2.4], [bx + aw * .6, by - 2.4], [bx + aw * .6, by + 2.2], [bx - aw * .6, by + 2.2]], [176, 30, 34], r, { n: 4, ink: true, inkw: .9, ew: .6 }); g.fillStyle = css([240, 220, 160]); g.fillRect(bx - 1.2, by - 1, 2.4, 2); }
    return [e[2], e[3] + 1];
  };
  const farArmFirst = s > .35;
  let farHand = null;
  if (farArmFirst) farHand = drawArm(1);
  // ---------- torso
  const bellyBulge = L.build === 'heavy' ? 2.6 : 0, hemY = longTop ? hipY + legLen * .62 : isApron ? hipY + legLen * .55 : hipY + 3;
  const tw = hw * 1.02 + .6, ww = (hw * .88 + bellyBulge * Math.max(.4, s) + .3);
  const tlean = lean ? -fwdX * 2.6 : 0, tslump = slump ? fwdX * 3 : 0;
  const torsoPts = [[-tw + tlean, shY], [-tw * .55 + tlean * .8, shY - 1.6], [tw * .55 + tlean * .8, shY - 1.6], [tw + tlean, shY], [ww + tslump * .2 + tlean * .3, (shY + hipY) / 2], [ww * (longTop ? 1.18 : 1.04) + tslump * .1, hemY], [-ww * (longTop ? 1.18 : 1.04), hemY], [-ww - tslump * .2 + tlean * .3, (shY + hipY) / 2]];
  const lit = [mix(topC, [255, 190, 120], .35), mix(mul(topC, .62), [30, 50, 90], .3), Math.PI - s * .6, .42, .42];
  // shirt layer for open garments
  if (L.outfit === 'cardigan' || L.outfit === 'coat' || L.outfit === 'suit' || L.outfit === 'labcoat') {
    paintPoly(g, torsoPts, shirtC, r, { n: 20, ink: false, edge: false });
  }
  paintPoly(g, torsoPts, topC, r, { n: 46, sw: 2.2, ang: 1.45, aj: .22, ink: true, inkw: 1.3, lit, jv: .13, alt: mix(topC, accC, .3), ew: 1 });
  const torsoMidX = tlean * .5;
  if (!back) {
    const fx0 = fwdX * 3.4 * (s > .8 ? 1 : s) ;   // front-centre line shift (towards facing)
    const cx = torsoMidX + fx0 * 0.7;
    const vis = Math.abs(c) > .3;
    if (L.outfit === 'uniform') {
      if (vis) { g.fillStyle = css([226, 196, 100]); for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(cx, shY + 7 + i * 5.4, .9, 0, 7); g.fill(); } }
      paintPoly(g, [[cx - 5, shY], [cx, shY + 5], [cx + 5, shY], [cx + 3, shY - 1.8], [cx, shY + 1], [cx - 3, shY - 1.8]], mul(topC, 1.25), r, { n: 4, ink: true, inkw: .9, ew: .6 });
      g.fillStyle = css(accC, .95); g.fillRect(-ww, hipY - 1.6, ww * 2, 2.4);                                  // belt
      paintPoly(g, [[-tw, shY], [-tw + 5, shY - .6], [-tw + 4, shY + 2.6], [-tw - .6, shY + 2.6]], accC, r, { n: 3, ink: true, inkw: .8, ew: .5 }); // epaulettes
      paintPoly(g, [[tw, shY], [tw - 5, shY - .6], [tw - 4, shY + 2.6], [tw + .6, shY + 2.6]], accC, r, { n: 3, ink: true, inkw: .8, ew: .5 });
    } else if (L.outfit === 'suit') {
      paintPoly(g, [[cx - 4, shY - 1], [cx, shY + 13], [cx + 4, shY - 1]], shirtC, r, { n: 4, ink: true, inkw: .9 });
      if (vis) paintPoly(g, [[cx - 1.2, shY + 1], [cx + 1.2, shY + 1], [cx + 1.8, shY + 12], [cx, shY + 14], [cx - 1.8, shY + 12]], accC, r, { n: 3, ink: true, inkw: .8, ew: .5 });
      paintPoly(g, [[cx - 4.6, shY - 1], [cx - 1, shY + 15], [cx - 7, shY + 12]], mul(topC, 1.2), r, { n: 4, ink: true, inkw: .9 }); paintPoly(g, [[cx + 4.6, shY - 1], [cx + 1, shY + 15], [cx + 7, shY + 12]], mul(topC, 1.2), r, { n: 4, ink: true, inkw: .9 });
    } else if (L.outfit === 'apron') {
      const ax = cx;
      paintPoly(g, [[ax - ww * .86, shY + 5], [ax + ww * .86, shY + 5], [ax + ww * 1.12, hemY - 1], [ax - ww * 1.12, hemY - 1]], [232, 226, 210], r, { n: 24, ink: true, inkw: 1.2, ang: 1.5, alt: [200, 196, 186], lit: [[255, 246, 226], [150, 150, 170], Math.PI, .4, .4] });
      g.strokeStyle = css(accC, .95); g.lineWidth = 1.2; g.beginPath(); g.moveTo(ax - ww * .8, shY + 5); g.lineTo(ax - tw * .5, shY - .5); g.moveTo(ax + ww * .8, shY + 5); g.lineTo(ax + tw * .5, shY - .5); g.stroke();
      g.fillStyle = css(accC, .7); g.fillRect(ax - 4, hipY - 5, 8, 6); g.fillStyle = css([90, 80, 70], .35); g.fillRect(ax - ww * 1.1, hemY - 3, ww * 2.2, 1.2);
      g.fillStyle = css([140, 70, 50], .35); g.fillRect(ax - 6, hipY - 12, 3, 3);   // stain
    } else if (L.outfit === 'overalls') {
      paintPoly(g, [[cx - ww * .65, shY + 4], [cx + ww * .65, shY + 4], [cx + ww * .85, hipY + 2], [cx - ww * .85, hipY + 2]], outC, r, { n: 20, ink: true, inkw: 1.1, ang: 1.5 });
      g.strokeStyle = css(outC); g.lineWidth = 2; g.beginPath(); g.moveTo(cx - ww * .55, shY + 4); g.lineTo(cx - tw * .45, shY - 1); g.moveTo(cx + ww * .55, shY + 4); g.lineTo(cx + tw * .45, shY - 1); g.stroke();
      g.fillStyle = css(accC); g.fillRect(cx - 3, shY + 7, 6, 4.5); g.fillStyle = css([220, 200, 120]); g.beginPath(); g.arc(cx - ww * .55, shY + 4, 1, 0, 7); g.arc(cx + ww * .55, shY + 4, 1, 0, 7); g.fill();
    } else if (L.outfit === 'tracksuit') {
      g.strokeStyle = css([20, 20, 24], .8); g.lineWidth = 1; g.beginPath(); g.moveTo(cx, shY - 1); g.lineTo(cx, hipY + 2); g.stroke();
      g.strokeStyle = css(accC, .95); g.lineWidth = 1.7; g.beginPath(); g.moveTo(cx - 3, shY); g.lineTo(cx - 3.4, hipY + 2); g.moveTo(cx + 3, shY); g.lineTo(cx + 3.4, hipY + 2); g.stroke();
    } else if (L.outfit === 'cardigan') {
      paintPoly(g, [[cx - 3, shY - 1], [cx + 3, shY - 1], [cx + 2, hipY + 3], [cx - 2, hipY + 3]], shirtC, r, { n: 5, ink: true, inkw: .9 });
      g.fillStyle = css(accC); for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(cx + 3.2, shY + 6 + i * 6, .9, 0, 7); g.fill(); }
    } else if (L.outfit === 'labcoat') {
      g.strokeStyle = css([60, 60, 70], .6); g.lineWidth = 1; g.beginPath(); g.moveTo(cx, shY + 2); g.lineTo(cx, hemY); g.stroke();
      paintPoly(g, [[cx - 5, shY - 1], [cx, shY + 7], [cx + 5, shY - 1], [cx + 3, shY - 2]], [240, 236, 224], r, { n: 4, ink: true, inkw: .9 });
      g.fillStyle = css(accC, .75); g.fillRect(cx + ww * .5, shY + 10, 4, 5); g.fillStyle = css([40, 60, 110], .85); g.fillRect(cx + ww * .5 + 1, shY + 8, 1.2, 3);
      g.fillStyle = css([150, 130, 60], .3); g.fillRect(cx - ww * .8, hemY - 8, 5, 4);
    } else if (L.outfit === 'coat') {
      g.strokeStyle = css([20, 20, 24], .7); g.lineWidth = 1; g.beginPath(); g.moveTo(cx, shY + 2); g.lineTo(cx, hemY); g.stroke();
      g.fillStyle = css([40, 34, 30]); for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(cx - 2, shY + 8 + i * 6, .9, 0, 7); g.arc(cx + 2, shY + 8 + i * 6, .9, 0, 7); g.fill(); }
      paintPoly(g, [[cx - 7, shY - 1.5], [cx - 1, shY + 10], [cx - 8, shY + 8]], mul(topC, 1.25), r, { n: 4, ink: true, inkw: .9 }); paintPoly(g, [[cx + 7, shY - 1.5], [cx + 1, shY + 10], [cx + 8, shY + 8]], mul(topC, 1.25), r, { n: 4, ink: true, inkw: .9 });
      paintPoly(g, [[-tw, shY - 1], [tw, shY - 1], [tw * .8, shY + 2.4], [-tw * .8, shY + 2.4]], accC, r, { n: 4, ink: true, inkw: .8, ew: .5 });    // scarf
    } else if (L.outfit === 'shirtsleeves') {
      g.strokeStyle = css(accC, .95); g.lineWidth = 1.6; g.beginPath(); g.moveTo(cx - ww * .6, shY - 1); g.lineTo(cx - ww * .5, hipY); g.moveTo(cx + ww * .6, shY - 1); g.lineTo(cx + ww * .5, hipY); g.stroke();
      g.fillStyle = css([230, 226, 206], .9); g.fillRect(cx - 1, shY, 2, 5);
    }
  } else if (L.outfit === 'uniform' || L.outfit === 'tracksuit') {  // back details
    g.fillStyle = css(accC, .95); g.fillRect(-ww, hipY - 1.6, ww * 2, 2.4);
  }
  // pants waist band for long garments
  // ---------- near arm(s)
  let hand0 = null;
  if (!farArmFirst) farHand = drawArm(1);
  hand0 = drawArm(0);
  if (wheel) { drawWheel(c >= 0 ? -1 : 1); }
  // ---------- extras
  drawExtra(g, r, L, extra, hand0, farHand, { fwdX, fwdY, s, c, headCx, headCy, shY, hipY, headR, ground });
  // ---------- neck + head
  const hx = headCx, hy = headCy;
  let tilt = 0; if (hang) tilt = .35; else if (slump) tilt = .1 * (fwdX || 1);
  g.save(); g.translate(hx, hy); g.rotate(tilt); g.translate(-hx, -hy);
  if (!hang || true) paintPoly(g, [[hx - 2.6 - torsoMidX * 0 , neckY + 3], [hx + 2.6, neckY + 3], [hx + 2.2, hy + headR * .7], [hx - 2.2, hy + headR * .7]], mul(skin, .85), r, { n: 5, ink: true, inkw: 1, ew: .6 });
  // hair (back layer)
  const hs = L.hairStyle || 'short';
  const hairLit = [mix(hairC, [255, 200, 130], .35), mix(mul(hairC, .5), [20, 30, 70], .3), Math.PI, .5, .55];
  const hopt = { n: 22, sw: 1.5, ang: 1.5, aj: .3, ink: true, inkw: 1.1, lit: hairLit, jv: .15, alt: mix(hairC, [255, 220, 170], .4), ew: .7 };
  const hbx = hx - fwdX * 1.4;
  if (hs === 'long') paintPoly(g, [[hbx - headR - 1.6, hy - 1], [hbx - headR - 2.4, hy + 14], [hbx + headR + 2.4, hy + 14], [hbx + headR + 1.6, hy - 1], [hbx, hy - headR - 1.5]].map(p => [p[0] - fwdX * 1.5 * (s > .5 ? 1 : 0), p[1]]), hairC, r, Object.assign({}, hopt, { n: 36 }));
  if (hs === 'braid' && back) paintPoly(g, [[hx - 3, hy + 2], [hx + 3, hy + 2], [hx + 3.4, hy + 24], [hx - 3.4, hy + 24]], hairC, r, hopt);
  if (hs === 'bob') paintPoly(g, [[hbx - headR - 1.8, hy - 1], [hbx - headR - 2.2, hy + 7], [hbx + headR + 2.2, hy + 7], [hbx + headR + 1.8, hy - 1], [hbx, hy - headR - 1.6]], hairC, r, Object.assign({}, hopt, { n: 28 }));
  if (hs === 'bun') paintEll(g, hx - fwdX * (s > .5 ? 4.6 : 0), hy - headR - 2.8, 3.8, 3.4, hairC, r, { n: 8, ink: true, inkw: 1, lit: hairLit });
  // head
  const ear = !back && (s > .4);
  const hRx = headR * (.94 + .1 * s), hRy = headR * 1.1;
  paintPoly(g, ellPts(hx, hy, hRx, hRy, 22, 0, r, .02), skin, r, { n: 26, sw: 1.6, ang: 1.2, aj: .4, ink: true, inkw: 1.3, lit: [mix(skin, [255, 214, 160], .4), mix(mul(skin, .62), [40, 40, 100], .35), Math.PI - s * .5, .55, .6], jv: .08, alt: mix(skin, [220, 120, 100], .4), ew: 1 });
  // ear
  if (s > .25 && s < .98 || s >= .98) { const ex = hx - (back ? 0 : 0) - (c >= 0 ? -1 : -1) * 0; paintEll(g, hx - hRx * (s > .9 ? 0 : 0.95) - (s > .9 ? -1 : 0), hy + 1.4, 1.5, 2.3, mul(skin, .9), r, { n: 4, ink: true, inkw: .8, pn: 8 }); }
  // face
  if (!back) {
    const fx = hx + s * 4.0 + (c >= 0 ? 0 : 0), eyY = hy + .6, eyDx = 3.2 * Math.max(c, 0) + .0, mood = L._mood;
    const hidden = hang;
    if (!hidden) {
      const eye = (ex, vis) => {
        if (!vis) return;
        g.fillStyle = css([236, 230, 214]); g.beginPath(); g.ellipse(ex, eyY, 1.8, 1.3, 0, 0, 7); g.fill();
        g.fillStyle = css([28, 22, 24]); g.beginPath(); g.arc(ex + s * .5, eyY, 1.0, 0, 7); g.fill();
        g.strokeStyle = css(INK, .8); g.lineWidth = .7; g.beginPath(); g.ellipse(ex, eyY, 1.8, 1.3, 0, 0, 7); g.stroke();
      };
      if (c > .35) { eye(fx - eyDx, true); eye(fx + eyDx, true); } else eye(fx + 1.2 * s, true);
      if (c > .35 && s > .2) { /* far eye foreshortened */ }
      g.strokeStyle = css(mul(hairC, .6), .95); g.lineWidth = 1.1; g.lineCap = 'round';
      if (c > .35) { g.beginPath(); g.moveTo(fx - eyDx - 2, eyY - 2.6); g.lineTo(fx - eyDx + 1.8, eyY - 2.9 + (L.age === 'old' ? .4 : 0)); g.moveTo(fx + eyDx - 1.8, eyY - 2.9); g.lineTo(fx + eyDx + 2, eyY - 2.6); g.stroke(); }
      else { g.beginPath(); g.moveTo(fx - .6, eyY - 2.7); g.lineTo(fx + 2.8, eyY - 2.5); g.stroke(); }
      // nose
      g.strokeStyle = css(mul(skin, .6), .9); g.lineWidth = 1; g.beginPath();
      if (s > .7) { g.moveTo(hx + hRx - .4, hy + .5); g.lineTo(hx + hRx + 2, hy + 3.2); g.lineTo(hx + hRx - .4, hy + 3.6); } else { g.moveTo(fx + .4, eyY + 1); g.lineTo(fx - .6, eyY + 3.4); g.lineTo(fx + 1, eyY + 3.5); }
      g.stroke();
      // mouth
      g.strokeStyle = css(mul(skin, .5), .95); g.lineWidth = 1.1; g.beginPath();
      if (s > .7) { g.moveTo(hx + hRx - 1.2, hy + 5.6); g.lineTo(hx + hRx - 3.4, hy + 5.8); } else { g.moveTo(fx - 2, hy + 5.6); g.quadraticCurveTo(fx, hy + 6.1, fx + 2, hy + 5.6); }
      g.stroke();
      if (teen) { g.fillStyle = css([230, 110, 100], .22); g.beginPath(); g.ellipse(fx - 3.4 * Math.max(c, .3), hy + 3.6, 1.8, 1.2, 0, 0, 7); g.ellipse(fx + 3.4 * Math.max(c, .3), hy + 3.6, 1.8, 1.2, 0, 0, 7); g.fill(); }
      if (old) { g.strokeStyle = css(mul(skin, .55), .55); g.lineWidth = .7; g.beginPath(); g.moveTo(fx - 4 * Math.max(c, .3), hy + 2); g.lineTo(fx - 3 * Math.max(c, .3), hy + 5.4); g.moveTo(fx + 4 * Math.max(c, .3), hy + 2); g.lineTo(fx + 3 * Math.max(c, .3), hy + 5.4); g.moveTo(fx - 3, hy - 4); g.lineTo(fx + 3, hy - 4); g.stroke(); }
      if (L.glasses) {
        g.strokeStyle = css([34, 28, 28], .95); g.lineWidth = 1; 
        if (c > .35) { g.beginPath(); g.ellipse(fx - eyDx, eyY, 2.4, 2.2, 0, 0, 7); g.ellipse(fx + eyDx, eyY, 2.4, 2.2, 0, 0, 7); g.moveTo(fx - eyDx + 2.4, eyY); g.lineTo(fx + eyDx - 2.4, eyY); g.stroke(); }
        else { g.beginPath(); g.ellipse(fx + 1.2 * s, eyY, 2.4, 2.4, 0, 0, 7); g.moveTo(fx + 1.2 * s - 2.4, eyY); g.lineTo(hx - hRx, eyY - .4); g.stroke(); }
        g.fillStyle = css([255, 250, 230], .55); g.fillRect(fx - eyDx - 1.2, eyY - 1.8, 1.2, 1);
      }
    } else { g.fillStyle = css([10, 8, 14], .4); g.beginPath(); g.ellipse(hx + 1, hy + 2, hRx * .8, hRy * .7, 0, 0, 7); g.fill(); }
  }
  // hair (front layer)
  const topY = hy - hRy;
  const cap = (extraBack) => [[hx - hRx - .8, hy + (extraBack ? 3 : -1)], [hx - hRx - .6, hy - hRy * .55], [hx - hRx * .4, topY - 1.4], [hx + hRx * .4, topY - 1.4], [hx + hRx + .6, hy - hRy * .55], [hx + hRx + .8, hy + (extraBack ? 3 : -1)]];
  const shift = (pts, dx) => pts.map(p => [p[0] + dx, p[1]]);
  if (hs === 'short' || hs === 'slick' || hs === 'braid' || hs === 'long' || hs === 'bob' || hs === 'bun') {
    if (back) {
      paintPoly(g, ellPts(hx, hy - .6, hRx + .7, hRy + .5, 20, 0, r, .02), hairC, r, hopt);
    } else {
      const pts = cap(false).concat([[hx + hRx * .8 + s * 2, hy - hRy * .38], [hx + s * 4.2, hy - hRy * .6 + (hs === 'slick' ? -1 : 1.4)], [hx - hRx * .7 + s * 2, hy - hRy * .38]]);
      paintPoly(g, pts, hairC, r, hopt);
      if (hs === 'long' || hs === 'bob') { for (const sd of [-1, 1]) { if (s > .75 && sd * fwdX > 0) continue; paintPoly(g, [[hx + sd * (hRx + .5), hy - 2], [hx + sd * (hRx + 2.4), hy + (hs === 'long' ? 11 : 5)], [hx + sd * (hRx - 1.6), hy + (hs === 'long' ? 11 : 5)], [hx + sd * (hRx - 1.4), hy - 2]], hairC, r, Object.assign({}, hopt, { n: 10 })); } }
      if (hs === 'slick') { g.strokeStyle = css([255, 230, 190], .45); g.lineWidth = .8; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(hx - 4 + i * 2.6, topY + 1.5); g.quadraticCurveTo(hx - 3 + i * 2.6 + 3, topY - .4, hx - 1 + i * 2.6 - fwdX * 3, hy - 3); g.stroke(); } }
    }
    if (hs === 'braid') { const bx = !back ? hx - 6.5 * (s > .8 ? -1 : 1) * (s < .3 ? 1 : 0) - (s > .3 ? -fwdX * -5 : 0) : hx; if (!back) { paintPoly(g, [[bx - 2.4, hy + 5], [bx + 2.4, hy + 5], [bx + 2.8, hy + 24], [bx - 2.8, hy + 24]], hairC, r, Object.assign({}, hopt, { n: 10 })); g.strokeStyle = css(mul(hairC, .5), .8); g.lineWidth = .8; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(bx - 2.4, hy + 7 + i * 3.4); g.lineTo(bx + 2.4, hy + 9 + i * 3.4); g.stroke(); } g.fillStyle = css(accC); g.fillRect(bx - 2.6, hy + 23, 5.2, 1.8); } else { g.strokeStyle = css(mul(hairC, .5), .8); g.lineWidth = .8; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(hx - 3, hy + 4 + i * 3.4); g.lineTo(hx + 3, hy + 6 + i * 3.4); g.stroke(); } g.fillStyle = css(accC); g.fillRect(hx - 3, hy + 24, 6, 1.8); } }
  } else if (hs === 'buzz') {
    if (back) paintPoly(g, ellPts(hx, hy - 1.4, hRx + .3, hRy - .6, 18, 0, r, .02), mix(hairC, skin, .25), r, { n: 12, ink: false, edge: false });
    else paintPoly(g, cap(false).concat([[hx + hRx * .6, hy - hRy * .55], [hx, hy - hRy * .66], [hx - hRx * .6, hy - hRy * .55]]), mix(hairC, skin, .25), r, { n: 14, ink: false, edge: false, sw: 1 });
  } else if (hs === 'curly') {
    const rnd = RNG(hashStr(lookKey(L)));
    for (let i = 0; i < 12; i++) { const a = -3.3 + i * .54, d = hRx * 1.02; const px = hx + Math.cos(a) * d, py = hy - .6 + Math.sin(a) * (hRy * 1.0); paintEll(g, px, py, 3.7, 3.5, jit(hairC, rnd, .12), rnd, { n: 7, ink: true, inkw: .9, pn: 10, edge: false, lit: hairLit }); }
    for (let i = 0; i < 5; i++) paintEll(g, hx - 6 + i * 3, topY + 1, 3.6, 3.4, jit(hairC, rnd, .12), rnd, { n: 5, ink: true, inkw: .9, pn: 10, edge: false });
    if (back) paintEll(g, hx, hy - .6, hRx + .8, hRy + .2, hairC, r, { n: 14, ink: false });
  } else if (hs === 'cap') {
    const capC = outC;
    paintPoly(g, [[hx - hRx - 1, hy - 2.4], [hx - hRx, topY - 1], [hx + hRx, topY - 1], [hx + hRx + 1, hy - 2.4]], capC, r, { n: 14, ink: true, inkw: 1.2, lit: [mix(capC, [255, 200, 140], .4), mul(capC, .5), Math.PI, .5, .5] });
    if (!back) paintPoly(g, [[hx - hRx - .6, hy - 2.4], [hx + hRx + .6, hy - 2.4], [hx + hRx + 3 + s * 6, hy - .6], [hx - hRx - 3 + s * 6 + (s < .3 ? 0 : 0), hy - .6]], mul(capC, .6), r, { n: 8, ink: true, inkw: 1 });
    g.fillStyle = css(accC); g.beginPath(); g.arc(hx + s * 2.2, hy - 5, 1.2, 0, 7); g.fill();
  } else if (hs === 'bald') {
    g.fillStyle = css([255, 240, 210], .4); g.beginPath(); g.ellipse(hx + 2.2, topY + 2.2, 2.2, 1.2, -.3, 0, 7); g.fill();
    if (L.hair && lum(hairC) > 20) { for (const sd of [-1, 1]) { paintPoly(g, [[hx + sd * (hRx + .6), hy - 3], [hx + sd * (hRx + .4), hy + 1.2], [hx + sd * (hRx - 1.6), hy - .2], [hx + sd * (hRx - 1.2), hy - 3.4]], hairC, r, { n: 5, ink: false }); } }
  }
  g.restore();
}

function drawExtra(g, r, L, extra, h0, h1, P) {
  if (extra === 'none' || !h0) return;
  const [hx, hy] = h0, f = P.fwdX || 1;
  if (extra === 'cigarette') {
    g.strokeStyle = css([240, 236, 224]); g.lineWidth = 1.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(hx - f * 1, hy - 1.2); g.lineTo(hx + f * 4.2, hy - 2.6); g.stroke();
    g.fillStyle = css([255, 140, 50]); g.beginPath(); g.arc(hx + f * 4.8, hy - 2.7, 1.1, 0, 7); g.fill();
    g.strokeStyle = css([210, 210, 220], .35); g.lineWidth = 1; g.beginPath(); g.moveTo(hx + f * 5, hy - 4); g.quadraticCurveTo(hx + f * 8, hy - 9, hx + f * 4, hy - 14); g.stroke();
  } else if (extra === 'mic') {
    g.strokeStyle = css([60, 60, 64]); g.lineWidth = 1.8; g.beginPath(); g.moveTo(hx, hy + 1); g.lineTo(hx + f * 2, hy - 7); g.stroke(); paintEll(g, hx + f * 2.4, hy - 9, 2.6, 3, [150, 154, 158], r, { n: 4, ink: true, pn: 10, inkw: .8 });
  } else if (extra === 'clipboard') {
    g.save(); g.translate(hx, hy - 2); g.rotate(-.18 * f); paintPoly(g, [[-5, -9], [5, -9], [5, 5], [-5, 5]], [150, 106, 66], r, { n: 6, ink: true, inkw: 1, ew: .6 }); g.fillStyle = css([236, 230, 208]); g.fillRect(-4, -7, 8, 11); scribbleLines(g, r, -3.2, -4.4, 6, 3, 2.6, [40, 40, 50], .8); g.fillStyle = css([190, 180, 120]); g.fillRect(-2, -10, 4, 2); g.restore();
  } else if (extra === 'broom') {
    g.strokeStyle = css([128, 96, 60]); g.lineWidth = 2; g.beginPath(); g.moveTo(hx + f * 1, hy - 38); g.lineTo(hx - f * 2, P.ground - 2); g.stroke(); g.strokeStyle = css(INK, .5); g.lineWidth = .6; g.stroke();
    paintPoly(g, [[hx - f * 2 - 4, P.ground - 12], [hx - f * 2 + 4, P.ground - 12], [hx - f * 2 + 7, P.ground + 1], [hx - f * 2 - 7, P.ground + 1]], [190, 160, 90], r, { n: 10, ink: true, inkw: 1, ang: 1.57, alt: [120, 90, 50] });
    g.strokeStyle = css([80, 60, 30], .9); g.lineWidth = 1; g.beginPath(); g.moveTo(hx - f * 2 - 4, P.ground - 9); g.lineTo(hx - f * 2 + 4, P.ground - 9); g.stroke();
  } else if (extra === 'ladle') {
    g.strokeStyle = css([170, 170, 170]); g.lineWidth = 1.5; g.beginPath(); g.moveTo(hx, hy + 1); g.lineTo(hx + f * 4, hy - 12); g.stroke(); paintEll(g, hx + f * 4.4, hy - 14, 3.4, 2.6, [150, 154, 150], r, { n: 4, ink: true, pn: 10, inkw: .9 });
  } else if (extra === 'book') {
    g.save(); g.translate(hx, hy - 3); g.rotate(-.12 * f); paintPoly(g, [[-6, -4], [6, -4], [6, 4], [-6, 4]], [90, 50, 44], r, { n: 8, ink: true, inkw: 1 }); g.fillStyle = css([226, 214, 180]); g.fillRect(-5, 3, 10, 1.4); g.fillStyle = css([210, 170, 90]); g.fillRect(-4, -2, 6, 1.2); g.restore();
  } else if (extra === 'rope') {
    g.strokeStyle = css([176, 144, 96]); g.lineWidth = 2.2; g.lineCap = 'round'; g.beginPath(); g.moveTo(hx, hy); g.bezierCurveTo(hx + 3, hy + 10, hx - 3, hy + 16, hx + 1, hy + 24); g.stroke(); g.strokeStyle = css(INK, .4); g.lineWidth = .6; g.stroke();
  } else if (extra === 'megaphone') {
    paintPoly(g, [[hx - 2, hy - 2], [hx + f * 3, hy - 3], [hx + f * 10, hy - 8], [hx + f * 10, hy + 3], [hx + f * 3, hy + 1]], [190, 60, 50], r, { n: 8, ink: true, inkw: 1 });
  }
}

function addOutlineAndRim(src, W, H, rimCol, hangRope) {
  const sz = [W, H], out = mk(W, H), og = ctx2(out);
  // rim light (warm, right/top) + cool fill (left)
  const tmp = mk(W, H), tg = ctx2(tmp);
  tg.drawImage(src, 0, 0); tg.globalCompositeOperation = 'destination-out'; tg.drawImage(src, -1.5 * K, .7 * K); tg.globalCompositeOperation = 'source-in'; tg.fillStyle = css(rimCol, .8); tg.fillRect(0, 0, W, H);
  const tmp2 = mk(W, H), t2 = ctx2(tmp2);
  t2.drawImage(src, 0, 0); t2.globalCompositeOperation = 'destination-out'; t2.drawImage(src, 1.4 * K, -.4 * K); t2.globalCompositeOperation = 'source-in'; t2.fillStyle = 'rgba(70,130,150,.65)'; t2.fillRect(0, 0, W, H);
  const body = mk(W, H), bg = ctx2(body);
  bg.drawImage(src, 0, 0); bg.drawImage(tmp2, 0, 0); bg.drawImage(tmp, 0, 0);
  // dark ink outline (dilated silhouette underneath)
  const sil = mk(W, H), sg = ctx2(sil);
  const R = 1.2 * K;
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.2832; sg.drawImage(src, Math.cos(a) * R, Math.sin(a) * R); }
  sg.globalCompositeOperation = 'source-in'; sg.fillStyle = 'rgb(20,14,18)'; sg.fillRect(0, 0, W, H);
  og.drawImage(sil, 0, 0); og.drawImage(body, 0, 0);
  return out;
}
function greenOutline(spr) {
  if (spr.hl) return spr.hl;
  const W = spr.c.width, H = spr.c.height, c = mk(W, H), g = ctx2(c), R = 2.3 * SS * .8;
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.2832; g.drawImage(spr.c, Math.cos(a) * R, Math.sin(a) * R); }
  g.globalCompositeOperation = 'source-in'; g.fillStyle = 'rgb(96,255,120)'; g.fillRect(0, 0, W, H);
  // soft glow
  const c2 = mk(W, H), g2 = ctx2(c2); g2.globalAlpha = .35; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.2832; g2.drawImage(c, Math.cos(a) * R * 1.8, Math.sin(a) * R * 1.8); }
  g2.globalAlpha = 1; g2.drawImage(c, 0, 0);
  spr.hl = c2; return c2;
}

function figKey(L, facing, frame) { const pose = L.pose || 'stand'; return lookKey(L) + '#' + pose + '#' + facing + '#' + (pose === 'stand' || pose === 'slump' || pose === 'lean' ? frame : 0); }
const _warmQ = [];
function queueFigure(look, facing, frame, pose) { _warmQ.push([look, facing, frame, pose]); }
function warmStep(maxN) {   // bake queued sprites one at a time (called with spare frame time)
  while (maxN-- > 0 && _warmQ.length) { const q = _warmQ.shift(); getFigure(q[0], q[1], q[2], q[3]); }
}
/* returns a ready sprite without ever blocking on animation frames: walk frames fall back to idle while they are baked in the background */
function figureNow(look, facing, frame, pose) {
  const L = normLook(look); if (pose) L.pose = pose; facing = FACE_ALIAS[facing] || facing; if (!FACE[facing]) facing = 's';
  const hit = _spr.get(figKey(L, facing, frame)); if (hit) return hit;
  if (frame > 0) { for (let f = 1; f <= 4; f++) if (!_spr.get(figKey(L, facing, f))) queueFigure(look, facing, f, pose); const idle = _spr.get(figKey(L, facing, 0)); if (idle) return idle; }
  return getFigure(look, facing, frame, pose);
}
function getFigure(look, facing, frame, poseOver) {
  const L = normLook(look); if (poseOver) L.pose = poseOver;
  facing = FACE_ALIAS[facing] || facing; const fd = FACE[facing] || FACE.s; if (!FACE[facing]) facing = 's';
  const pose = L.pose || 'stand';
  const key = figKey(L, facing, frame);
  let spr = _spr.get(key); if (spr) return spr;
  const W = Math.round(SPW * K), Hh = Math.round(SPH * K), c = mk(W, Hh), g = ctx2(c);
  g.save(); g.scale(K, K);
  if (fd[1]) { g.translate(SPW, 0); g.scale(-1, 1); }
  g.translate(SAX, SAY);
  const r = RNG(hashStr(key));
  const rot = pose === 'lie';
  if (rot) { g.rotate(-Math.PI / 2); g.translate(0, -2); }
  if (pose === 'hang') {   // rope drawn behind the figure, from the neck up to the hoop
    L.extra = 'none';
    g.save(); g.lineCap = 'round'; const hh = (L.age === 'teen' ? 68 : 74), top = -(hh * .47) - 36 - hh * .30 - 8, rx = fd[1] ? -20 : 20;
    g.strokeStyle = css(INK, .9); g.lineWidth = 3.4; g.beginPath(); g.moveTo(0, top); g.lineTo(rx, -118); g.stroke();
    g.strokeStyle = css([190, 156, 104]); g.lineWidth = 2; g.stroke(); g.restore();
  }
  drawFigure(g, r, L, fd[0], (pose === 'stand' || pose === 'slump' || pose === 'lean') ? frame : 0, pose === 'lie' ? 'stand' : pose);
  g.restore();
  if (pose === 'hang') { g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(14,16,30,.3)'; g.fillRect(0, 0, W, Hh); g.restore(); }
  const rim = C(look && look._rim || [255, 150, 70]);
  const out = addOutlineAndRim(c, W, Hh, rim);
  spr = { c: out, ax: SAX * K, ay: SAY * K, w: W, h: Hh, hl: null, hang: pose === 'hang' ? { x: (fd[1] ? -20 : 20) * SC, y: -118 * SC } : null };
  _spr.set(key, spr);
  if (_spr.size > 600) { const k = _spr.keys().next().value; _spr.delete(k); }
  return spr;
}

/* ===================================================== SCENE BAKING */
const _scenes = new Map();
const HINTS = { menu: 'chalkboard', mirror: 'mirror', notices: 'notice', notice: 'notice', speaker: 'loudspeaker', loudspeaker: 'loudspeaker', portrait: 'portrait', mat: 'mat', rope: 'rope', lockers: 'lockers', bench: 'bench', tray: 'tray', desk: 'desk', cabinet: 'vault', window: 'window', boiler: 'boiler', table: 'table', statue: 'statue', bell: 'bell', mic: 'mic', horn: 'loudspeaker', poster: 'banner', trunk: 'crate', door: 'door' };
function propRect(p) {
  const w = p.w || 1, h = p.h || 1;
  if (p.side === 'l') return { u0: 0, v0: p.y || 0, u1: 1, v1: (p.y || 0) + (p.side === 'l' ? h : w) };
  if (p.side === 'r') return { u0: p.x || 0, v0: 0, u1: (p.x || 0) + w, v1: 1 };
  return { u0: p.x || 0, v0: p.y || 0, u1: (p.x || 0) + w, v1: (p.y || 0) + h };
}
function matchProp(props, o) {
  const words = ((o.id || '').toLowerCase().split('_').slice(1).join(' ') + ' ' + (o.label || '').toLowerCase()).split(/[^a-z]+/).filter(Boolean);
  const hint = new Set(); for (const w of words) if (HINTS[w]) hint.add(HINTS[w]);
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

function buildScene(loc, bucket) {
  const t0 = (typeof performance !== 'undefined') ? performance.now() : 0;
  const ws = worldSize(loc), seed = hashStr(loc.id || 'x');
  const S = { loc, seed, r: RNG(seed), tx: originX(loc), ty: originY(), W: ws.w, H: ws.h, bucket, mood: MOODS[loc.mood] || MOODS.warm, lights: [], exitLights: [], steam: [], dapples: [], lightK: [.9, 1, 1, .8, .32][bucket] };
  const base = mk(ws.w * BS, ws.h * BS), g = ctx2(base); g.scale(BS, BS);
  let props = (loc.props || []).slice();
  const objects = loc.objects || [];
  const injected = [];
  for (const o of objects) {
    const m = matchProp(props, o);
    const words = (o.id || '').toLowerCase();
    if ((m === null) || (/menu/.test(words) && props[m] && props[m].t !== 'chalkboard') || (/mirror/.test(words) && props[m] && props[m].t !== 'mirror')) {
      if (/mirror/.test(words)) { const pr = { t: 'mirror', x: o.x, y: o.y, w: 1, h: 1, v: 0, label: o.label, _obj: o.id }; props.push(pr); }
      else if (/menu/.test(words)) { const pr = { t: 'chalkboard', side: 'r', x: Math.min(o.x + 1.6, (loc.w || 12) - 3), y: 0, w: 2, h: 1, v: 0, label: 'Menu', _obj: o.id }; props.push(pr); }
    }
  }
  S.props = props;
  // 1. floor + flat props
  paintFloor(g, S);
  const flat = props.filter(p => !p.side && FLAT[p.t]).sort((a, b) => ({ rug: 0, stairs: 1, mat: 2, stage: 2, rope: 3, door: 4 }[a.t] || 0) - ({ rug: 0, stairs: 1, mat: 2, stage: 2, rope: 3, door: 4 }[b.t] || 0));
  S.stages = props.filter(p => p.t === 'stage').map(propRect);
  for (const p of flat) { const q = propRect(p), I = { r: RNG(seed + hashStr(p.t + p.x + ',' + p.y)), v: (p.v | 0) % 4, u0: q.u0, v0: q.v0, u1: q.u1, v1: q.v1 }; FLAT[p.t](g, S, p, I); }
  paintLightFloor(g, S);
  paintFloorEdge(g, S);
  // 2. walls
  paintWall(g, S, 'r'); paintWall(g, S, 'l');
  for (const p of props) if (p.side && WALLPROPS[p.t]) bakeWallProp(g, S, p);
  // 3. sprites
  S.items = [];
  const supports = props.filter(p => SUPPORT_Z[p.t]).map(p => Object.assign({ z: SUPPORT_Z[p.t] }, propRect(p)));
  props.forEach((p, idx) => {
    if (p.side && WALLPROPS[p.t]) { S.items.push({ p, idx, kind: 'wall', rect: propRect(p) }); return; }
    if (!p.side && FLAT[p.t]) { S.items.push({ p, idx, kind: 'flat', rect: propRect(p) }); return; }
    const type = PROPS[p.t] ? p.t : 'crate', q = propRect(p), fn = PROPS[type];
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
    const I = { r: RNG(seed + hashStr(p.t + p.x + ',' + p.y + 'z')), v: (p.v | 0) % 4, u0: q.u0, v0: q.v0, u1: q.u1, v1: q.v1, w: p.w || 1, h: p.h || 1 };
    try { fn(sg, Sx, Object.assign({}, p, { t: type }), I); } catch (e) { if (typeof console !== 'undefined') console.warn('Art prop failed', p.t, e); }
    S.items.push({ p, idx, kind: 'sprite', rect: q, spr: { c, x: left, y: top }, cu, cv, zoff });
  });
  S.sprites = S.items.filter(i => i.kind === 'sprite');
  S.order = sortProps(S.sprites);
  // 4. final painterly grain over the baked layer
  applyGrain(g, ws.w, ws.h, .22, 'overlay');
  S.base = base;
  S.objMap = new Map();
  for (const o of objects) { const m = matchProp(props, o); let idx = m; if (o.id) { const inj = props.findIndex(p => p._obj === o.id); if (inj >= 0) idx = inj; } S.objMap.set(o.id, idx === null ? null : S.items[idx] || null); }
  S.bakeMs = (typeof performance !== 'undefined') ? performance.now() - t0 : 0;
  return S;
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
  gr.addColorStop(0, 'rgba(6,4,14,.75)'); gr.addColorStop(.55, 'rgba(6,4,14,.35)'); gr.addColorStop(1, 'rgba(6,4,14,0)'); g.fillStyle = gr; g.save(); g.scale(1, .5); g.fillRect(0, 0, 64, 64); g.restore(); return (_shadow.c = c);
}
const _pm = {}; // sprite ring cache for props
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

function makeRenderer(loc) {
  const R = { loc: loc, _last: null, stats: { frames: 0, ms: 0, bakeMs: 0 } };
  let sigProps = null, sigLen = -1, sig = '';
  function signature(l) {
    const ps = l.props || []; if (ps === sigProps && ps.length === sigLen) return sig;
    sigProps = ps; sigLen = ps.length; let s = ps.length + ':'; for (const p of ps) s += p.t + (p.x | 0) + ',' + (p.y | 0) + (p.v | 0) + (p.side || '') + '|'; sig = String(hashStr(s)); return sig;
  }
  function ensure(l, bucket) {
    const key = (l.id || '') + '|' + (l.mood || '') + '|' + bucket + '|' + signature(l);
    let S = _scenes.get(key);
    if (!S) {
      S = buildScene(l, bucket); S.key = key; _scenes.set(key, S); R.stats.bakeMs = S.bakeMs;
      if (_scenes.size > 8) { const k = _scenes.keys().next().value; _scenes.delete(k); }
    } else { _scenes.delete(key); _scenes.set(key, S); }
    return S;
  }
  R.prebake = function (time) { return ensure(R.loc, bucketOf(time)); };
  R.draw = function (ctx, view, dyn) {
    const t1 = (typeof performance !== 'undefined') ? performance.now() : 0;
    dyn = dyn || {}; view = view || { camX: 0, camY: 0, zoom: 1, w: 1280, h: 720 };
    const l = R.loc, minute = (typeof dyn.time === 'number') ? dyn.time : 600, bucket = bucketOf(minute), S = ensure(l, bucket);
    const t = dyn.t || 0, zoom = view.zoom || 1, w = view.w, h = view.h, camX = view.camX || 0, camY = view.camY || 0;
    ctx.save();
    ctx.fillStyle = '#0a0910'; ctx.fillRect(0, 0, w, h);
    ctx.translate(w / 2, h / 2); ctx.scale(zoom, zoom); ctx.translate(-camX, -camY);
    // baked layer (clipped source rect)
    const vx0 = camX - w / 2 / zoom, vy0 = camY - h / 2 / zoom, vw = w / zoom, vh = h / zoom;
    const sx0 = Math.max(0, Math.floor(vx0)), sy0 = Math.max(0, Math.floor(vy0)), sx1 = Math.min(S.W, Math.ceil(vx0 + vw)), sy1 = Math.min(S.H, Math.ceil(vy0 + vh));
    if (sx1 > sx0 && sy1 > sy0) ctx.drawImage(S.base, sx0 * BS, sy0 * BS, (sx1 - sx0) * BS, (sy1 - sy0) * BS, sx0, sy0, sx1 - sx0, sy1 - sy0);
    // ---- gather hover state
    const hover = dyn.hoverId || null, all = !!dyn.highlightAll;
    const hlItems = [], hlSprites = [];
    const objs = dyn.objects || [];
    const objDefs = l.objects || [];
    for (const o of objs) {
      const on = o.highlight || all || (hover && hover === o.id);
      if (!on) continue;
      const it = S.objMap.get(o.id);
      if (it) hlItems.push(it); else hlItems.push({ marker: o });
    }
    if (hover && !objs.length) { for (const od of objDefs) if (od.id === hover) { const it = S.objMap.get(od.id); hlItems.push(it || { marker: od }); } }
    // flat/wall highlight polygons drawn before sprites (under); recorded for post
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
      ents.push({ x, y, sx: p.sx, sy: p.sy - el, spr, isPlayer, hl, id: e.id, fr, phase: (hashStr(e.id || 'p') % 100) / 16, rect: { u0: x + .5 - .22, u1: x + .5 + .22, v0: y + .5 - .22, v1: y + .5 + .22 }, walking: !!e.walking });
    };
    for (const n of (dyn.npcs || [])) pushEnt(n, false, !!(n.highlight || all || (hover && hover === n.id)));
    if (pl) pushEnt(pl, true, false);
    // ---- depth merge: props sorted statically, entities slotted in
    const order = S.order, n = order.length, slots = new Array(n + 1);
    for (let i = 0; i <= n; i++) slots[i] = null;
    for (const e of ents) {
      let idx = n;
      for (let i = 0; i < n; i++) { const rel = relRect(e.rect, order[i].rect); if (rel === -1) { idx = i; break; } }
      (slots[idx] || (slots[idx] = [])).push(e);
    }
    for (let i = 0; i <= n; i++) if (slots[i]) slots[i].sort((a, b) => (a.x + a.y) - (b.x + b.y));
    // ground-level marks first: shadows + player ring
    for (const e of ents) {
      ctx.globalAlpha = .9; ctx.drawImage(shadowSprite(), e.sx - 32 - 3, e.sy - 12, 64, 26); ctx.globalAlpha = 1;
    }
    if (pl) { const e = ents[ents.length - 1]; const pulse = 1 + Math.sin(t * .004) * .04; ctx.save(); ctx.translate(e.sx, e.sy + 1); ctx.scale(1, .5);
      ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 0, 32 * pulse, 0, 7); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.92)'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(0, 0, 31 * pulse, 0, 7); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.beginPath(); ctx.arc(0, 0, 31 * pulse, 0, 7); ctx.fill(); ctx.restore(); }
    // sprites + ents interleaved
    const seen = new Set();
    for (let i = 0; i <= n; i++) {
      if (slots[i]) for (const e of slots[i]) drawEnt(ctx, e, t, post);
      if (i < n) { const it = order[i]; ctx.drawImage(it.spr.c, it.spr.x, it.spr.y, it.spr.c.width / BS, it.spr.c.height / BS); }
    }
    // collect highlight outlines
    for (const hI of hlItems) {
      if (hI.marker) { post.push({ k: 'diamond', x: hI.marker.x, y: hI.marker.y, a: .8 }); continue; }
      if (seen.has(hI)) continue; seen.add(hI);
      post.push({ k: 'item', it: hI });
    }
    if (hover && hover.indexOf('exit:') === 0) { const id = hover.slice(5); for (const ex of (l.exits || [])) if (ex.id === id) post.push({ k: 'diamond', x: ex.x, y: ex.y, a: 1, big: true }); }
    // ---- lighting / tint in screen space
    ctx.restore();
    ctx.save();
    const tt = timeTint(minute), interior = (l.mood !== 'dusk'), kk = interior ? .8 : 1, am = S.mood.amb;
    const mulc = [am[0] * lerp(1, tt.mul[0], kk), am[1] * lerp(1, tt.mul[1], kk), am[2] * lerp(1, tt.mul[2], kk)];
    ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = css(mulc.map(v => v * 255)); ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    // world-space additive layer
    ctx.translate(w / 2, h / 2); ctx.scale(zoom, zoom); ctx.translate(-camX, -camY);
    ctx.globalCompositeOperation = 'lighter';
    const boost = 1 + (1 - lum(tt.mul)) * 1.6 * (interior ? .6 : 1);
    for (const Lg of S.lights) {
      if (Lg.x + Lg.r < vx0 || Lg.x - Lg.r > vx0 + vw || Lg.y + Lg.r < vy0 || Lg.y - Lg.r > vy0 + vh) continue;
      const fl = 1 + Lg.fl * (Math.sin(t * .013 + Lg.ph) * .6 + Math.sin(t * .031 + Lg.ph * 2.3) * .4);
      let a = Lg.a * fl * (Lg.kind === 'window' ? 1 : boost);
      if (Lg.kind === 'fire' || Lg.kind === 'lamp') a *= 1;
      ctx.globalAlpha = Math.min(1, a); const rr = Lg.r * (Lg.kind === 'window' ? 1 : 1);
      ctx.drawImage(glowSprite(Lg.col, 128), Lg.x - rr, Lg.y - rr, rr * 2, rr * 2);
    }
    // shimmering dapples
    for (const d of S.dapples) {
      if (d.x < vx0 - 40 || d.x > vx0 + vw + 40 || d.y < vy0 - 40 || d.y > vy0 + vh + 40) continue;
      ctx.globalAlpha = (.05 + .05 * Math.sin(t * .0016 + d.ph)) * S.lightK * (bucket === 4 ? .5 : 1);
      const s = d.s * 1.4; ctx.drawImage(glowSprite(d.col, 128), d.x - s / 2, d.y - s / 4, s, s / 2);
    }
    // steam
    for (const st of S.steam) {
      for (let k = 0; k < 4; k++) { const ph = ((t * .00035 + k / 4) % 1), y = st.y - ph * 60, x = st.x + Math.sin(ph * 5 + k) * 8 + ph * 8; ctx.globalAlpha = (1 - ph) * .1; ctx.drawImage(glowSprite([210, 220, 230], 128), x - 14 - ph * 14, y - 14 - ph * 14, 28 + ph * 28, 28 + ph * 28); }
    }
    ctx.globalAlpha = 1;
    // dust motes
    drawDust(ctx, t, vx0, vy0, vw, vh, S, bucket);
    ctx.globalCompositeOperation = 'source-over';
    // highlight outlines (bright green, unaffected by tint)
    for (const p of post) drawPost(ctx, S, p, t);
    ctx.restore();
    // colour wash, vignette, grain (screen space)
    ctx.save();
    if (tt.add[3] > 0) { ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = css(tt.add, tt.add[3] * (interior ? .6 : 1)); ctx.fillRect(0, 0, w, h); }
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(vignette(Math.round(w), Math.round(h)), 0, 0);
    if (Art.quality.grain) {
      ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = .13;
      const o = (Math.floor(t / 70) * 53) % 256, o2 = (Math.floor(t / 70) * 97) % 256;
      ctx.translate(-o, -o2); ctx.fillStyle = ctx.createPattern(grainTile(), 'repeat'); ctx.fillRect(0, 0, w + 256, h + 256);
    }
    ctx.restore();
    if (typeof performance !== 'undefined' && _warmQ.length && performance.now() - t1 < 9) warmStep(1);
    if (typeof performance !== 'undefined') { R.stats.frames++; R.stats.last = performance.now() - t1; R.stats.ms += R.stats.last; }
    R.scene = S;
  };
  return R;
}
function drawEnt(ctx, e, t, post) {
  const spr = e.spr, breath = 1 + Math.sin(t * .0022 + e.phase) * .011, bob = e.walking ? 0 : Math.sin(t * .0022 + e.phase) * .35;
  ctx.save(); ctx.translate(e.sx, e.sy + bob);
  if (spr.hang) { const ang = Math.sin(t * .0011 + e.phase) * .018; ctx.translate(spr.hang.x, spr.hang.y); ctx.rotate(ang); ctx.translate(-spr.hang.x, -spr.hang.y); } else ctx.scale(1, breath);
  ctx.drawImage(spr.c, -spr.ax / SS, -spr.ay / SS, spr.w / SS, spr.h / SS);
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
  const n = 46, col = bucket === 4 ? [160, 190, 255] : DAPPLE[bucket];
  ctx.fillStyle = css(col, 1);
  for (let i = 0; i < n; i++) {
    const a = lat(i, 1, 5), b = lat(i, 2, 5), sp = .00002 + lat(i, 3, 5) * .00005;
    const x = vx0 + (((a + t * sp * (1 + lat(i, 4, 5)) + Math.sin(t * .0004 + i) * .006) % 1) + 1) % 1 * vw;
    const y = vy0 + (((b - t * sp * .8 + Math.cos(t * .00037 + i * 1.7) * .008) % 1) + 1) % 1 * vh;
    const s = .8 + lat(i, 5, 5) * 1.9, tw = .35 + .65 * Math.abs(Math.sin(t * .001 + i * 2.1));
    ctx.globalAlpha = (.12 + lat(i, 6, 5) * .28) * tw * S.lightK;
    ctx.beginPath(); ctx.arc(x, y, s, 0, 6.3); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/* ====================================================== ITEM ICONS */
const _icons = new Map();
function iconPainter(id, g, r) {
  const S = 96, cx = 48, cy = 50;
  const P = (pts, col, o) => paintPoly(g, pts, col, r, Object.assign({ n: 14, sw: 2.6, ink: true, inkw: 1.8, ew: 1.4 }, o || {}));
  const E = (x, y, rx, ry, col, o) => paintEll(g, x, y, rx, ry, col, r, Object.assign({ n: 14, sw: 2.6, ink: true, inkw: 1.8, pn: 16 }, o || {}));
  const R_ = (x, y, w, h, col, o) => paintRect(g, x, y, w, h, col, r, Object.assign({ n: 14, sw: 2.6, ink: true, inkw: 1.8, ew: 1.4 }, o || {}));
  g.save(); g.translate(cx, cy);
  g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(2, 30, 30, 8, 0, 0, 7); g.fill();
  const paper = [226, 214, 176];
  switch (id) {
    case 'boiler_key': E(0, -22, 13, 13, [196, 150, 64], { lit: [[255, 230, 150], [90, 50, 20], 0] }); E(0, -22, 5, 5, [30, 24, 20], { ink: false }); R_(-4, -10, 8, 46, [196, 150, 64], { ang: 1.57 }); R_(-4, 16, 14, 6, [196, 150, 64]); R_(-4, 27, 18, 6, [196, 150, 64]); break;
    case 'chalk_stub': P([[-26, 8], [18, -14], [28, -4], [-18, 22]], [236, 234, 222], { n: 20, alt: [200, 200, 210] }); P([[18, -14], [28, -4], [24, -2], [14, -10]], [200, 196, 190]); g.fillStyle = css([255, 255, 255], .8); for (let i = 0; i < 12; i++) { g.beginPath(); g.arc(r.r(-26, 16), r.r(8, 28), r.r(.8, 2.2), 0, 7); g.fill(); } break;
    case 'torn_page': P([[-24, -32], [20, -34], [26, -10], [18, 4], [24, 22], [14, 34], [-26, 32]], paper, { n: 40, wob: 2, alt: [250, 240, 210] }); scribbleLines(g, r, -16, -22, 32, 7, 6, [50, 40, 36], .8); g.strokeStyle = css([150, 40, 40], .8); g.lineWidth = 2; g.beginPath(); g.arc(8, 14, 8, 0, 6.28); g.stroke(); break;
    case 'ration_coupon': g.rotate(-.12); P([[-34, -18], [34, -18], [34, 18], [-34, 18]], [210, 190, 120], { n: 40, alt: [240, 220, 150] }); g.setLineDash([3, 3]); g.strokeStyle = css([60, 40, 30], .8); g.lineWidth = 1.4; g.strokeRect(-30, -14, 60, 28); g.setLineDash([]); handText(g, 'RATION', -6, -3, 13, [150, 30, 30], r, 44, { shadow: [0, 0, 0, 0] }); handText(g, 'No. 4417', -2, 8, 7, [60, 40, 30], r, 40, { shadow: [0, 0, 0, 0], font: '' }); E(22, 2, 7, 7, [150, 30, 30], { ink: false }); break;
    case 'cigarettes': P([[-24, -26], [24, -26], [24, 28], [-24, 28]], [186, 52, 46], { n: 40 }); P([[-24, -26], [24, -26], [24, -10], [-24, -10]], [226, 220, 200], { n: 14 }); for (let i = 0; i < 4; i++) E(-15 + i * 10, -29, 4, 3, [236, 226, 196], { n: 6 }); handText(g, 'UNION', 0, 10, 11, [236, 210, 120], r, 40, { shadow: [0, 0, 0, 0] }); break;
    case 'ledger': P([[-30, -34], [30, -34], [30, 34], [-30, 34]], [38, 70, 56], { n: 50, alt: [70, 110, 84], lit: [[160, 210, 170], [10, 30, 20], -.8] }); P([[-30, 28], [30, 28], [30, 34], [-30, 34]], [220, 206, 170], { n: 8 }); R_(-30, -34, 8, 68, [30, 44, 40], { ang: 1.57 }); P([[-8, -22], [20, -22], [20, -6], [-8, -6]], [196, 160, 80], { n: 14 }); handText(g, 'LEDGER', 6, -14, 8, [40, 30, 20], r, 24, { shadow: [0, 0, 0, 0] }); g.strokeStyle = css([170, 40, 40]); g.lineWidth = 3; g.beginPath(); g.moveTo(10, 34); g.lineTo(10, 42); g.stroke(); break;
    case 'rhea_pin': g.rotate(.2); P([[-4, -34], [18, -22], [18, 6], [-4, 24], [-26, 6], [-26, -22]], [180, 36, 40], { n: 40, lit: [[255, 140, 120], [60, 10, 20], -.9] }); g.fillStyle = css([236, 206, 110]); g.beginPath(); for (let i = 0; i < 10; i++) { const a = i * .6283 - 1.57, rr = i % 2 ? 5 : 11; g.lineTo(-4 + Math.cos(a) * rr, -4 + Math.sin(a) * rr); } g.fill(); g.strokeStyle = css(INK); g.lineWidth = 1.2; g.stroke(); g.strokeStyle = css([200, 200, 200]); g.lineWidth = 2.4; g.beginPath(); g.moveTo(-14, 24); g.lineTo(24, 24); g.stroke(); break;
    case 'note_yesterday_1': case 'note_yesterday_2': case 'note_yesterday_3': { const n = +id.slice(-1); g.rotate((n - 2) * .12); P([[-26, -30], [24, -32], [28, 26], [-24, 30]], [n === 2 ? 220 : 232, n === 3 ? 206 : 222, 180], { n: 40, wob: 3, alt: [250, 240, 210] }); g.strokeStyle = css([200, 190, 160], .6); g.lineWidth = 1; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-8 + i * 3, -30 + i * 6); g.lineTo(-14 + i * 3, 29); g.stroke(); }
      scribbleLines(g, r, -18, -18, 36, 6, 7, [30, 36, 70], .9); g.fillStyle = css([30, 36, 70]); g.font = 'bold 15px "Comic Sans MS", cursive'; g.textAlign = 'center'; g.fillText(String(n), 0, -22); break; }
    case 'radio_tube': R_(-14, 26, 28, 10, [60, 56, 54]); for (let i = 0; i < 4; i++) { g.fillStyle = css([200, 190, 170]); g.fillRect(-10 + i * 6.5, 36, 2, 7); } P([[-14, 26], [-16, -8], [-10, -30], [0, -36], [10, -30], [16, -8], [14, 26]], [196, 220, 224], { n: 20, ink: true, alt: [255, 255, 255], jv: .05 }); g.globalAlpha = .55; g.fillStyle = css([255, 255, 255]); g.fillRect(-10, -20, 3, 36); g.globalAlpha = 1; g.strokeStyle = css([210, 130, 60]); g.lineWidth = 2; g.beginPath(); g.moveTo(-5, 24); g.lineTo(-5, -14); g.moveTo(5, 24); g.lineTo(5, -14); g.moveTo(-5, -14); g.quadraticCurveTo(0, -24, 5, -14); g.stroke(); g.fillStyle = css([255, 150, 60], .5); g.beginPath(); g.arc(0, -4, 12, 0, 7); g.fill(); break;
    case 'bread_note': E(0, 6, 34, 20, [196, 140, 74], { n: 26, alt: [236, 190, 110], lit: [[255, 220, 150], [90, 40, 20], -.9] }); g.strokeStyle = css([120, 70, 30], .8); g.lineWidth = 2; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 10 - 4, -6); g.lineTo(i * 10 + 4, 6); g.stroke(); } g.save(); g.rotate(.4); P([[10, -28], [30, -28], [30, -6], [10, -6]], paper, { n: 10 }); scribbleLines(g, r, 13, -22, 14, 3, 5, [50, 40, 36], .8); g.restore(); break;
    case 'vanguard_armband': P([[-34, -16], [34, -12], [34, 14], [-34, 18]], [176, 30, 34], { n: 50, alt: [230, 70, 60], lit: [[255, 140, 120], [70, 10, 20], -1.2] }); E(0, 1, 14, 14, [236, 226, 196], { n: 14 }); g.fillStyle = css([176, 30, 34]); g.beginPath(); for (let i = 0; i < 10; i++) { const a = i * .6283 - 1.57, rr = i % 2 ? 4.5 : 11; g.lineTo(Math.cos(a) * rr, 1 + Math.sin(a) * rr); } g.fill(); g.strokeStyle = css(INK); g.lineWidth = 1; g.stroke(); break;
    case 'pocket_mirror': E(0, 0, 30, 30, [160, 150, 130], { n: 22, alt: [220, 200, 140], lit: [[255, 240, 190], [60, 40, 20], -.9] }); E(0, 0, 23, 23, [170, 200, 204], { n: 14, jv: .05, ink: true }); g.fillStyle = css([255, 255, 255], .5); g.beginPath(); g.ellipse(-8, -9, 4, 11, .6, 0, 7); g.fill(); g.strokeStyle = css(INK, .8); g.lineWidth = 1.2; g.beginPath(); g.moveTo(-4, -20); g.lineTo(4, -4); g.lineTo(-2, 8); g.stroke(); break;
    case 'warden_badge': g.rotate(-.1); P([[0, -36], [30, -22], [30, 10], [0, 34], [-30, 10], [-30, -22]], [214, 172, 70], { n: 60, lit: [[255, 240, 170], [110, 70, 20], -1], alt: [255, 225, 130] }); P([[0, -28], [22, -17], [22, 6], [0, 26], [-22, 6], [-22, -17]], [120, 28, 30], { n: 24 }); g.fillStyle = css([226, 196, 100]); g.beginPath(); g.moveTo(-9, -8); g.quadraticCurveTo(-9, -20, 0, -20); g.quadraticCurveTo(9, -20, 9, -8); g.lineTo(13, 4); g.lineTo(-13, 4); g.closePath(); g.fill(); g.strokeStyle = css(INK); g.lineWidth = 1.2; g.stroke(); g.beginPath(); g.arc(0, 8, 3, 0, 7); g.fill(); break;
    case 'sweet_roll': E(0, 6, 34, 21, [214, 150, 80], { n: 26, alt: [240, 190, 110] }); for (let i = 0; i < 3; i++) { g.strokeStyle = css([150, 90, 40], .7); g.lineWidth = 3; g.beginPath(); g.ellipse(0, 6, 28 - i * 10, 15 - i * 5, 0, 0, 5.5); g.stroke(); } g.fillStyle = css([250, 244, 230], .85); g.beginPath(); g.moveTo(-22, 0); g.quadraticCurveTo(-8, -16, 8, -6); g.quadraticCurveTo(24, -4, 22, 6); g.quadraticCurveTo(0, 2, -22, 0); g.fill(); g.strokeStyle = css(INK, .6); g.lineWidth = 1; g.stroke(); break;
    case 'ration_tea': P([[-24, -10], [24, -10], [20, 26], [-20, 26]], [226, 222, 206], { n: 30, lit: [[255, 255, 245], [110, 110, 130], 0] }); E(0, -10, 24, 7, [70, 40, 24], { n: 14, ink: true }); g.strokeStyle = css(INK); g.lineWidth = 3.4; g.beginPath(); g.arc(26, 6, 10, -1.5, 1.5); g.stroke(); g.strokeStyle = css([226, 222, 206]); g.lineWidth = 1.8; g.stroke(); g.fillStyle = css([150, 40, 40], .8); g.fillRect(-12, 6, 24, 5); g.strokeStyle = css([240, 240, 240], .5); g.lineWidth = 2.4; for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(i * 10, -16); g.quadraticCurveTo(i * 10 + 6, -26, i * 10, -36); g.stroke(); } break;
    case 'exam_booklet': P([[-26, -34], [26, -34], [26, 34], [-26, 34]], [196, 190, 160], { n: 40, alt: [226, 220, 190] }); R_(-26, -34, 6, 68, [140, 130, 100], { ang: 1.57 }); R_(-12, -24, 34, 18, [236, 230, 210], { n: 8 }); handText(g, 'EXAM', 5, -17, 12, [150, 30, 30], r, 28, { shadow: [0, 0, 0, 0] }); scribbleLines(g, r, -10, 6, 30, 5, 6, [60, 50, 50], .7); break;
    case 'vasha_notebook': P([[-26, -32], [26, -32], [26, 32], [-26, 32]], [70, 60, 46], { n: 40, alt: [120, 100, 70] }); R_(-26, -32, 6, 64, [40, 34, 28], { ang: 1.57 }); g.strokeStyle = css([190, 60, 50]); g.lineWidth = 3; g.beginPath(); g.moveTo(14, -32); g.lineTo(14, 32); g.stroke(); R_(-10, -18, 22, 14, [226, 214, 176], { n: 6 }); scribbleLines(g, r, -8, -13, 18, 2, 5, [50, 40, 36], .8); break;
    case 'staged_rope': for (let k = 0; k < 4; k++) { g.strokeStyle = css(jit([176, 144, 96], r, .1)); g.lineWidth = 8; g.beginPath(); g.ellipse(0, 12 - k * 6, 26 - k * 3, 12 - k, 0, 0, 7); g.stroke(); g.strokeStyle = css([80, 60, 36], .6); g.lineWidth = 1.4; g.setLineDash([3, 4]); g.stroke(); g.setLineDash([]); g.strokeStyle = css(INK, .7); g.lineWidth = 1; g.beginPath(); g.ellipse(0, 12 - k * 6, 30 - k * 3, 15 - k, 0, 0, 7); g.stroke(); } g.strokeStyle = css([176, 144, 96]); g.lineWidth = 7; g.beginPath(); g.moveTo(20, 6); g.bezierCurveTo(38, 14, 30, -14, 32, -30); g.stroke(); break;
    case 'mic_cable': for (let k = 0; k < 3; k++) { g.strokeStyle = css([34, 34, 38]); g.lineWidth = 6; g.beginPath(); g.ellipse(-6, 6 - k * 4, 24 - k * 2, 14 - k, 0, 0, 7); g.stroke(); g.strokeStyle = css([120, 120, 130], .5); g.lineWidth = 1.5; g.stroke(); } R_(14, -14, 20, 10, [170, 172, 176], { n: 8 }); R_(32, -12, 8, 6, [220, 190, 90]); R_(-40, 22, 14, 10, [170, 172, 176], { n: 8 }); break;
    case 'school_cap': P([[-30, 8], [-24, -10], [-6, -22], [18, -20], [30, -6], [32, 12], [-30, 12]], [58, 72, 90], { n: 50, lit: [[140, 170, 210], [14, 20, 36], -1] }); P([[-34, 12], [30, 12], [44, 20], [-20, 24]], [30, 36, 46], { n: 16 }); E(2, -2, 7, 7, [214, 170, 70], { n: 10 }); R_(-30, 6, 62, 6, [38, 46, 60], { n: 8 }); break;
    case 'bent_spoon': g.strokeStyle = css(INK); g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(-30, 30); g.lineTo(-6, 6); g.lineTo(8, 4); g.stroke(); g.strokeStyle = css([190, 192, 196]); g.lineWidth = 6; g.stroke(); g.strokeStyle = css([255, 255, 255], .7); g.lineWidth = 1.5; g.beginPath(); g.moveTo(-28, 28); g.lineTo(-6, 5); g.stroke(); g.save(); g.translate(18, -10); g.rotate(-.9); E(0, 0, 18, 12, [190, 192, 196], { n: 16, lit: [[255, 255, 255], [60, 70, 90], -1] }); E(1, 0, 11, 7, [150, 154, 160], { ink: false, n: 6 }); g.restore(); break;
    default: R_(-24, -24, 48, 48, [150, 140, 120], { n: 30 }); handText(g, '?', 0, 0, 30, [40, 30, 24], r, 20, { shadow: [0, 0, 0, 0] });
  }
  g.restore();
}
function drawItemIconImpl(ctx, x, y, size, id) {
  let c = _icons.get(id);
  if (!c) { c = mk(144, 144); const g = ctx2(c); g.scale(1.5, 1.5); try { iconPainter(String(id), g, RNG(hashStr('icon' + id))); } catch (e) { } _icons.set(id, c); }
  ctx.drawImage(c, x, y, size, size);
}

/* =============================================== PIXEL-ART PORTRAITS
 * Procedural 64x64, ~17 colour palette, 4x4 ordered dithering, nearest-neighbour upscale.
 * This function is the swap-in seam for Moonkai output: replace buildPortraitBuffer(look,opts) and
 * return a 64x64 canvas; the painted badge and upscaling are done by drawPortraitImpl.            */
const BAYER4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const _pbuf = new Map();
function ramp3(c, cool) { c = C(c); return [mix(mul(c, .5), [20, 24, 60], cool === undefined ? .32 : cool), c, mix(c, [255, 232, 196], .38)]; }
function inEll(x, y, cx, cy, rx, ry) { const dx = (x - cx) / rx, dy = (y - cy) / ry; return dx * dx + dy * dy; }
function inPoly(x, y, pts) { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { if (((pts[i][1] > y) !== (pts[j][1] > y)) && (x < (pts[j][0] - pts[i][0]) * (y - pts[i][1]) / (pts[j][1] - pts[i][1]) + pts[i][0])) c = !c; } return c; }

function buildPortraitBuffer(look, opts) {
  const L = normLook(look), mood = (opts && opts.mood) || 'neutral', tint = opts && opts.tint ? C(opts.tint) : null;
  const key = JSON.stringify([lookKey(L), L.pose === 'wheelchair' ? 1 : 0, mood, opts && opts.tint, opts && opts.bg]);
  let hit = _pbuf.get(key); if (hit) return hit;
  const N = 64, M = new Uint8Array(N * N), SH = new Float32Array(N * N), Z = new Uint8Array(N * N);
  const build = L.build === 'heavy' ? 1 : L.build === 'slim' ? -1 : 0, old = L.age === 'old', teen = L.age === 'teen';
  const hcx = 32, hcy = 26 + (teen ? 1 : 0), hrx = 12.4 + build * 1.6 - (teen ? .6 : 0), hry = 15.2 + (teen ? -.6 : 0) + (old ? .4 : 0);
  const sw = 23 + build * 4.5;
  const ID = { bg: 0, skin: 1, hair: 2, out: 3, acc: 4, shirt: 5, ink: 6, white: 7, dark: 8, lip: 9 };
  const light = [.55, -.55, .62];
  const put = (x, y, m, sh, z) => { if (x < 0 || y < 0 || x >= N || y >= N) return; const i = y * N + x; M[i] = m; SH[i] = sh; Z[i] = z; };
  // --- background: dithered glow
  const bgC = opts && opts.bg ? C(opts.bg) : mix(mul(C(L.outfitColor), .5), [30, 56, 60], .6);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const d = Math.hypot(x - 36, y - 24) / 44; put(x, y, ID.bg, Math.min(.999, Math.round(clamp(1 - d * 1.1, 0, 1) * 2) / 2), 0); }
  const shadeEll = (x, y, cx, cy, rx, ry) => { const nx = (x - cx) / rx, ny = (y - cy) / ry, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)); return clamp(.52 + (nx * light[0] + ny * light[1] + nz * light[2]) * .62 - .22, 0, 1); };
  // --- back hair (long / braid / bob / bun)
  const hs = L.hairStyle || 'short';
  if (hs === 'long') for (let y = 14; y < 58; y++) for (let x = 14; x < 51; x++) { const e = inEll(x, y, 32, 30, 19.5, 22); if (e < 1 && y < 58) put(x, y, ID.hair, clamp(.4 + (x - 32) * .012, 0, 1), 1); }
  if (hs === 'bob') for (let y = 12; y < 42; y++) for (let x = 12; x < 53; x++) { if (inEll(x, y, 32, 26, 20, 17) < 1 || (y > 26 && y < 42 && x > 14 && x < 50 && inEll(x, y, 32, 30, 19, 14) < 1)) put(x, y, ID.hair, .45 + (x - 32) * .01, 1); }
  // --- shoulders / outfit
  const outShape = (x, y) => { // shoulders silhouette
    const top = 45 - Math.max(0, 1 - Math.abs(x - 32) / 8) * 2; if (y < top) return false;
    const dx = Math.abs(x - 32); const edge = sw - Math.max(0, (y < 52 ? (52 - y) * .7 : 0)) - Math.max(0, dx - (sw - 7)) * 0;
    return dx < edge && (y > 47 || dx < 12 + (y - 45) * 6);
  };
  for (let y = 44; y < N; y++) for (let x = 0; x < N; x++) if (outShape(x, y)) { const nx = (x - 32) / sw; put(x, y, ID.out, clamp(.5 + nx * .45 - (y - 44) * .008 + ((x + y) % 7 === 0 ? .04 : 0), 0, 1), 2); }
  // shirt / inner garment region + details by outfit
  const o = L.outfit;
  const inShirt = (x, y) => y >= 46 && Math.abs(x - 32) < 5 + (y - 46) * .55 && y < 64;
  if (o === 'suit' || o === 'uniform' || o === 'coat' || o === 'cardigan' || o === 'labcoat' || o === 'shirtsleeves') for (let y = 44; y < N; y++) for (let x = 0; x < N; x++) if (outShape(x, y) && inShirt(x, y) && (o !== 'shirtsleeves' && o !== 'labcoat')) put(x, y, ID.shirt, clamp(.55 + (x - 32) * .02, 0, 1), 3);
  if (o === 'shirtsleeves') for (let y = 44; y < N; y++) for (let x = 0; x < N; x++) if (outShape(x, y)) { put(x, y, ID.shirt, clamp(.6 + (x - 32) * .02 - (y - 44) * .004, 0, 1), 3); }
  if (o === 'labcoat') for (let y = 44; y < N; y++) for (let x = 0; x < N; x++) if (outShape(x, y) && Math.abs(x - 32) < 3.5 + (y - 46) * .3 && y > 46) put(x, y, ID.shirt, .4, 3);
  if (o === 'apron') for (let y = 52; y < N; y++) for (let x = 0; x < N; x++) if (outShape(x, y) && Math.abs(x - 32) < 14 && y > 52) put(x, y, ID.shirt, clamp(.65 + (x - 32) * .01, 0, 1), 3);
  if (o === 'overalls') for (let y = 50; y < N; y++) for (let x = 0; x < N; x++) if (outShape(x, y) && Math.abs(x - 32) < 14) put(x, y, ID.out, .45 + (x - 32) * .01, 3);
  // neck
  for (let y = 38; y < 50; y++) for (let x = 24; x < 41; x++) { const nx = (x - 32) / 6; if (Math.abs(nx) < 1 && !(Z[y * N + x] >= 3 && M[y * N + x] !== ID.skin)) { if (Z[y * N + x] < 2 || y < 47) put(x, y, ID.skin, clamp(.22 + (y < 46 ? 0 : .05) + nx * .12 + (y > 44 ? 0 : -.1), 0, 1), 3); } }
  // collar / tie details
  const accDet = [];
  const dot = (x, y, m, sh) => put(x, y, m, sh, 5);
  if (o === 'suit') { for (let y = 47; y < 64; y++) { const w = (y - 46) * .12 + .8; for (let x = 32 - Math.ceil(w); x <= 32 + Math.floor(w); x++) put(x, y, ID.acc, .45 + ((y & 1) ? .15 : 0), 5); } for (let k = 0; k < 14; k++) { put(27 - Math.floor(k / 4), 46 + k, ID.out, .75, 5); put(37 + Math.floor(k / 4), 46 + k, ID.out, .75, 5); } }
  if (o === 'uniform') { for (let x = 24; x <= 40; x++) for (let y = 44; y < 49; y++) if (Math.abs(x - 32) > 2 && y < 49 - Math.abs(x - 32) * .05 + 1) put(x, y, ID.acc, .62, 5); for (let k = 0; k < 4; k++) put(32, 50 + k * 4, ID.acc, .9, 5); for (const sx of [32 - sw + 4, 32 + sw - 4]) { for (let q = 0; q < 6; q++) put(sx + q - 3, 49 + (q >> 1), ID.acc, .8, 5); } }
  if (o === 'coat') { for (let k = 0; k < 18; k++) { put(25 - (k >> 2), 44 + k, ID.out, .78, 5); put(39 + (k >> 2), 44 + k, ID.out, .78, 5); } for (let x = 25; x <= 39; x++) { put(x, 45, ID.acc, .5, 5); put(x, 46, ID.acc, .66, 5); } }
  if (o === 'apron') { for (let y = 46; y < 54; y++) { put(32 - 12 + Math.floor((y - 46) * .3), y, ID.acc, .7, 5); put(32 + 12 - Math.floor((y - 46) * .3), y, ID.acc, .7, 5); } for (let x = 29; x < 36; x++) for (let y = 58; y < 62; y++) put(x, y, ID.acc, .6, 5); }
  if (o === 'overalls') { for (let y = 46; y < 54; y++) { put(24 + ((y - 46) >> 1), y, ID.out, .75, 5); put(40 - ((y - 46) >> 1), y, ID.out, .75, 5); } put(25, 52, ID.acc, .9, 5); put(39, 52, ID.acc, .9, 5); }
  if (o === 'tracksuit') { for (let y = 46; y < 64; y++) { put(32, y, ID.ink, .5, 5); if (y > 48) { put(25, y, ID.acc, .7, 5); put(39, y, ID.acc, .7, 5); } } put(32, 47, ID.acc, .9, 5); }
  if (o === 'cardigan') { for (let y = 46; y < 64; y++) { put(32 - 5 - Math.floor((y - 46) * .15), y, ID.ink, .5, 5); put(32 + 5 + Math.floor((y - 46) * .15), y, ID.ink, .5, 5); } for (let k = 0; k < 3; k++) put(37, 52 + k * 4, ID.acc, .9, 5); }
  if (o === 'labcoat') { for (let k = 0; k < 14; k++) { put(27 - (k >> 2), 45 + k, ID.shirt, .85, 5); put(37 + (k >> 2), 45 + k, ID.shirt, .85, 5); } for (let y = 48; y < 64; y++) put(32, y, ID.ink, .5, 5); put(43, 56, ID.acc, .8, 5); put(43, 55, ID.acc, .9, 5); put(44, 56, ID.acc, .6, 5); }
  if (o === 'shirtsleeves') { for (let y = 44; y < 64; y++) { put(25, y, ID.acc, .6, 5); put(39, y, ID.acc, .6, 5); } for (let x = 28; x < 37; x++) put(x, 45, ID.shirt, .9, 5); }
  // --- head
  const faceL = (x, y) => inEll(x, y, hcx, hcy, hrx, hry);
  // ears
  for (const sd of [-1, 1]) for (let y = hcy - 3; y < hcy + 5; y++) for (let x = hcx + sd * (hrx - 1.5); sd < 0 ? x > hcx + sd * (hrx + 3.5) : x < hcx + sd * (hrx + 3.5); x += sd) { const xi = Math.round(x); if (inEll(xi, y, hcx + sd * (hrx + 1.2), hcy + 1, 2.8, 4) < 1) put(xi, y, ID.skin, sd > 0 ? .65 : .25, 3); }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const e = faceL(x, y), jaw = (y > hcy + 3) ? 1 + (y - hcy - 3) * .016 : 1;
    const e2 = inEll(x, y, hcx, hcy + (y > hcy ? (y - hcy) * -.06 : 0), hrx * (y > hcy + 6 ? (1 - (y - hcy - 6) * .026 * (build > 0 ? .5 : 1)) : 1), hry);
    if (e2 < 1) put(x, y, ID.skin, clamp(shadeEll(x, y, hcx, hcy, hrx, hry) + .14, 0, 1), 4);
  }
  // blush
  if (teen || mood === 'smile') for (const sd of [-1, 1]) for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) { const px = hcx + sd * 8 + x - 2, py = hcy + 7 + y; if (M[py * N + px] === ID.skin && (x + y) % 2 === 0) SH[py * N + px] = Math.min(1, SH[py * N + px] + .25); }
  // --- hair (front)
  const hl = (x) => hcy - 6.5 + Math.abs(x - hcx) * (hs === 'slick' ? .06 : .22);
  const hairPix = (x, y) => {
    const top = inEll(x, y, hcx, hcy - 1, hrx + 1.8, hry + 1.6);
    if (hs === 'short' || hs === 'braid' || hs === 'slick' || hs === 'bun') return top < 1 && (y < hl(x) || (Math.abs(x - hcx) > hrx - 2.2 && y < hcy + 4));
    if (hs === 'long') return top < 1 && (y < hl(x) - 1 || (Math.abs(x - hcx) > hrx - 2.5 && y < hcy + 14));
    if (hs === 'bob') return top < 1 && (y < hl(x) - .5 || (Math.abs(x - hcx) > hrx - 2.5 && y < hcy + 10));
    if (hs === 'buzz') return top < 1 && (y < hl(x) - 3 || (Math.abs(x - hcx) > hrx - 1.2 && y < hcy - 1));
    if (hs === 'curly') { const a = Math.atan2(y - (hcy - 2), x - hcx); return inEll(x, y, hcx, hcy - 2, hrx + 3 + Math.sin(a * 8) * 1.6, hry + 2.6 + Math.sin(a * 8) * 1.6) < 1 && (y < hl(x) + 1 || Math.abs(x - hcx) > hrx - 1.5 && y < hcy + 6);
    }
    if (hs === 'cap') return false;
    if (hs === 'bald') return Math.abs(x - hcx) > hrx - .5 && y > hcy - 6 && y < hcy + 1 && top < 1.25 && inEll(x, y, hcx, hcy, hrx + 1.4, hry) < 1.2;
    return false;
  };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (hairPix(x, y)) {
    let sh = shadeEll(x, y, hcx, hcy - 2, hrx + 2, hry + 2); if (hs === 'slick' && ((x * 2 + y) % 6 === 0)) sh = Math.min(1, sh + .35); if (hs === 'curly' && (x + y * 3) % 5 === 0) sh += .25; if (hs === 'buzz') sh *= .75;
    put(x, y, ID.hair, clamp(sh, 0, 1), 5);
  }
  if (hs === 'bun') for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { if (inEll(x, y, hcx + 1, hcy - hry - 1.5, 5, 4.4) < 1) put(x, y, ID.hair, shadeEll(x, y, hcx + 1, hcy - hry - 1.5, 5, 4.4), 5); }
  if (hs === 'braid') for (let y = hcy + 4; y < 62; y++) for (let x = 0; x < N; x++) { const cx = hcx + hrx + 3 + Math.sin(y * .5) * .9; if (Math.abs(x - cx) < 2.3 && y > hcy + 8) put(x, y, ID.hair, ((y >> 1) & 1) ? .8 : .35, 6); }
  if (hs === 'long') for (let y = hcy + 8; y < 60; y++) for (const sd of [-1, 1]) for (let x = 0; x < 5; x++) { const px = hcx + sd * (hrx + 1) + (sd > 0 ? x - 1 : -x + 1); put(Math.round(px), y, ID.hair, clamp(.35 + x * .06 + (sd > 0 ? .15 : 0), 0, 1), 6); }
  if (hs === 'cap') {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const t = inEll(x, y, hcx, hcy - 3, hrx + 2, hry - 1);
      if (t < 1 && y < hcy - 5.5) put(x, y, ID.out, clamp(shadeEll(x, y, hcx, hcy - 3, hrx + 2, hry) + .1, 0, 1), 5);
      if (y >= hcy - 6 && y < hcy - 3 && Math.abs(x - hcx - 5) < hrx + 6 && x > hcx - hrx - 1) put(x, y, ID.out, .25 + (y - hcy + 6) * .05, 6);
    }
    for (let x = hcx - 2; x < hcx + 4; x++) put(x, hcy - 9, ID.acc, .9, 7);
  }
  if (hs === 'bald') { put(hcx + 5, hcy - 14, ID.skin, 1, 7); put(hcx + 6, hcy - 13, ID.skin, 1, 7); put(hcx + 4, hcy - 14, ID.skin, .9, 7); }
  // --- outline pass (top layer pixel next to a lower layer pixel)
  const outl = new Uint8Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; if (M[i] === ID.bg) continue; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= N || yy >= N) continue; const j = yy * N + xx; if (Z[j] < Z[i] && (M[j] === ID.bg || Z[i] - Z[j] >= 1)) { if (M[i] !== ID.skin || Z[j] <= 3 || true) outl[i] = 1; } } }
  // outline only between big groups: skin/hair edge and body edge; skip hair-on-skin inner (keeps pixel look clean)
  for (let i = 0; i < N * N; i++) if (outl[i]) { const m = M[i]; if (m === ID.shirt || m === ID.acc) continue; M[i] = ID.ink; Z[i] = 9; }
  // --- facial details
  const ex = 5.4 + build * .3, ey = hcy + 0;
  const S_ = (x, y, m, sh) => put(Math.round(x), Math.round(y), m, sh === undefined ? .5 : sh, 10);
  const hairD = ID.hair;
  const shock = mood === 'shock', angry = mood === 'angry', sad = mood === 'sad', smile = mood === 'smile';
  for (const sd of [-1, 1]) {
    const cx = hcx + sd * ex, eyeR = shock ? 2 : 1;
    for (let dy = -eyeR; dy <= eyeR; dy++) for (let dx = -2; dx <= 2; dx++) { if ((Math.abs(dx) === 2 && Math.abs(dy) >= 1) || (!shock && Math.abs(dy) === 1 && Math.abs(dx) === 2)) continue; if (shock || Math.abs(dy) < 1 || Math.abs(dx) < 2) S_(cx + dx, ey + dy, ID.white, 1); }
    S_(cx + 0, ey, ID.dark, 0); S_(cx + 1, ey, ID.dark, 0); if (shock) { S_(cx, ey + 1, ID.dark, 0); S_(cx + 1, ey + 1, ID.dark, 0); }
    S_(cx - 2, ey + 1 + (smile ? 0 : 1), ID.skin, .15);                                     // eyelid shadow
    // brows
    const by = ey - 4 - (shock ? 2 : 0);
    for (let k = -2; k <= 2; k++) { const t = k * (-sd) / 2; const dy = angry ? Math.round(t * 1.4) : sad ? -Math.round(t * 1.4) : 0; S_(cx + k, by + dy, hairD, .15); if (angry && Math.abs(k) < 2) S_(cx + k, by + dy - 1, hairD, .15); }
    if (old) { S_(cx - 3, ey + 2, ID.skin, .1); S_(cx + 3, ey + 2, ID.skin, .1); }
  }
  // nose
  for (let y = ey + 2; y < ey + 8; y++) S_(hcx + 1 + (y > ey + 5 ? 0 : 0), y, ID.skin, .15 + (y - ey) * .03);
  S_(hcx - 1, ey + 8, ID.skin, .05); S_(hcx, ey + 8, ID.skin, .05); S_(hcx + 1, ey + 8, ID.skin, .12); S_(hcx + 2, ey + 8, ID.skin, .12);
  // mouth
  const my = hcy + 11;
  if (shock) { for (let dx = -1; dx <= 1; dx++) { S_(hcx + dx, my, ID.dark, 0); S_(hcx + dx, my + 1, ID.dark, 0); S_(hcx + dx, my + 2, ID.dark, 0); } S_(hcx, my + 1, ID.lip, .3); }
  else if (smile) { for (let dx = -3; dx <= 3; dx++) S_(hcx + dx, my + (Math.abs(dx) >= 3 ? -1 : Math.abs(dx) >= 2 ? 0 : 1) , ID.lip, .15); for (let dx = -2; dx <= 2; dx++) S_(hcx + dx, my, ID.white, 1); }
  else if (sad) { for (let dx = -3; dx <= 3; dx++) S_(hcx + dx, my + (Math.abs(dx) >= 3 ? 1 : Math.abs(dx) >= 2 ? 0 : -0) , ID.lip, .15); S_(hcx - 3, my + 1, ID.lip, .15); S_(hcx + 3, my + 1, ID.lip, .15); }
  else if (angry) { for (let dx = -3; dx <= 3; dx++) S_(hcx + dx, my + (Math.abs(dx) >= 3 ? 1 : 0), ID.lip, .1); }
  else { for (let dx = -2; dx <= 2; dx++) S_(hcx + dx, my, ID.lip, .2); S_(hcx - 3, my, ID.skin, .2); S_(hcx + 3, my, ID.skin, .2); }
  if (L.extra === 'cigarette') { for (let dx = 0; dx < 7; dx++) S_(hcx + 3 + dx, my + 1 - (dx >> 2), ID.white, dx > 5 ? .2 : 1); S_(hcx + 10, my - 1, ID.acc, 1); S_(hcx + 11, my - 4, ID.white, .55); S_(hcx + 12, my - 7, ID.white, .4); }
  // age
  if (old) { for (let y = ey + 3; y < ey + 10; y += 1) { if (y % 2 === 0) { S_(hcx - 9, y, ID.skin, .12); S_(hcx + 9, y, ID.skin, .12); } } for (let x = hcx - 6; x <= hcx + 6; x += 2) { S_(x, hcy - 9, ID.skin, .12); S_(x + 1, hcy - 11, ID.skin, .14); } S_(hcx - 4, my + 3, ID.skin, .1); S_(hcx + 4, my + 3, ID.skin, .1); }
  else if (!teen) { S_(hcx - 7, ey + 7, ID.skin, .15); S_(hcx - 7, ey + 8, ID.skin, .15); S_(hcx + 7, ey + 7, ID.skin, .15); S_(hcx + 7, ey + 8, ID.skin, .15); }
  // glasses
  if (L.glasses) {
    for (const sd of [-1, 1]) { const cx = hcx + sd * ex; for (let y = ey - 4; y <= ey + 4; y++) for (let x = Math.round(cx) - 5; x <= Math.round(cx) + 5; x++) { const d = Math.hypot((x - cx) / 4.9, (y - ey) / 3.7); if (d > .82 && d < 1.12) S_(x, y, ID.ink, 0); } }
    for (let x = hcx - 1; x <= hcx + 1; x++) S_(x, ey - 1, ID.ink, 0);
    for (let k = 0; k < 4; k++) { S_(hcx - ex - 5 - k, ey - 1, ID.ink, 0); S_(hcx + ex + 5 + k, ey - 1, ID.ink, 0); }
    S_(hcx - ex - 2, ey - 2, ID.white, 1); S_(hcx + ex - 2, ey - 2, ID.white, 1);
  }
  if (mood === 'sad') { S_(hcx + ex + 1, ey + 4, ID.white, .8); S_(hcx + ex + 1, ey + 5, ID.white, .8); }
  // --- palette + dithering to ImageData
  const pal = {};
  const skinC = mix(C(L.skin), tint || C(L.skin), tint ? .12 : 0);
  const ramps = [
    ramp3(bgC, .1), ramp3(skinC), ramp3(C(L.hair)), ramp3(C(L.outfitColor)), ramp3(C(L.accent)), ramp3(o === 'labcoat' ? [226, 222, 208] : o === 'apron' ? [226, 222, 208] : o === 'overalls' ? [168, 150, 120] : o === 'suit' ? [214, 208, 192] : o === 'tracksuit' ? [200, 200, 196] : mix(C(L.outfitColor), [220, 214, 200], .72)),
    [[18, 14, 20], [18, 14, 20], [18, 14, 20]], [[236, 230, 214], [236, 230, 214], [250, 246, 236]], [[22, 18, 22], [22, 18, 22], [40, 32, 32]], [mul(mix(skinC, [170, 60, 60], .55), .7), mix(skinC, [170, 60, 60], .55), mix(skinC, [200, 90, 80], .5)]
  ];
  if (tint) for (const rp of ramps) for (let k = 0; k < 3; k++) rp[k] = mix(rp[k], tint, .08);
  const cv = mk(N, N), cg = ctx2(cv), id = cg.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x, m = M[i], rp = ramps[m], th = (BAYER4[y & 3][x & 3] + .5) / 16;
    const v = clamp(SH[i], 0, .999) * 2, lv = Math.floor(v), fr = v - lv;
    const idx = lv + (fr > th ? 1 : 0), col = rp[clamp(idx, 0, 2)];
    id.data[i * 4] = col[0]; id.data[i * 4 + 1] = col[1]; id.data[i * 4 + 2] = col[2]; id.data[i * 4 + 3] = 255;
  }
  cg.putImageData(id, 0, 0);
  _pbuf.set(key, cv); if (_pbuf.size > 120) _pbuf.delete(_pbuf.keys().next().value);
  return cv;
}

function wobbleCircle(g, cx, cy, R, r, amp) {
  g.beginPath(); const n = 40;
  for (let i = 0; i <= n; i++) { const a = i / n * 6.2832, k = 1 + (noise(Math.cos(a) * 2 + 5, Math.sin(a) * 2 + 5, 11) - .5) * amp + (r() - .5) * amp * .25; const x = cx + Math.cos(a) * R * k, y = cy + Math.sin(a) * R * k; if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); }
  g.closePath();
}
function drawPortraitImpl(canvas, look, opts) {
  opts = opts || {}; if (opts.size) { canvas.width = canvas.height = opts.size; }
  const W = canvas.width, H = canvas.height, size = Math.min(W, H), g = canvas.getContext('2d');
  const buf = buildPortraitBuffer(look, opts), r = RNG(hashStr(lookKey(normLook(look))) + 7);
  g.save(); g.clearRect(0, 0, W, H); g.translate(W / 2, H / 2);
  const R = size * .47, bw = size * .075, Rin = R - bw * .7;
  // shadow
  g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(size * .02, size * .035, R * 1.0, R * 1.0, 0, 0, 7); g.fill();
  // pixel art inside circular clip
  g.save(); wobbleCircle(g, 0, 0, Rin, r, .0); g.clip();
  g.imageSmoothingEnabled = false; const s = Rin * 2 * 1.04; g.drawImage(buf, 7, 5, 50, 50, -s / 2, -s / 2, s, s);
  const vg = g.createRadialGradient(0, 0, Rin * .55, 0, 0, Rin); vg.addColorStop(0, 'rgba(10,6,16,0)'); vg.addColorStop(1, 'rgba(10,6,16,.55)'); g.fillStyle = vg; g.fillRect(-Rin, -Rin, Rin * 2, Rin * 2);
  g.restore();
  // painted thick border: dark ink base, gold-ochre band, brushed strokes, highlights
  g.lineCap = 'round';
  wobbleCircle(g, 0, 0, R, r, .02); g.lineWidth = bw * 1.25; g.strokeStyle = 'rgb(24,16,16)'; g.stroke();
  const bandC = C(opts.border || [198, 150, 66]);
  for (let i = 0; i < 70; i++) {
    const a = r() * 6.2832, da = .08 + r() * .26, rr = R - bw * .08 + (r() - .5) * bw * .5, lit = Math.cos(a + .8) * .5 + .5;
    const c = mix(mul(bandC, .55), mix(bandC, [255, 224, 150], .5), lit * (.5 + r() * .5));
    g.strokeStyle = css(jit(c, r, .1), .45 + r() * .4); g.lineWidth = bw * (.25 + r() * .35); g.beginPath(); g.arc(0, 0, rr, a, a + da); g.stroke();
  }
  g.strokeStyle = 'rgba(255,236,170,.65)'; g.lineWidth = bw * .1; g.beginPath(); g.arc(0, 0, R - bw * .45, -2.6, -.5); g.stroke();
  g.strokeStyle = 'rgba(14,10,14,.9)'; g.lineWidth = Math.max(1.4, bw * .13); wobbleCircle(g, 0, 0, Rin + bw * .02, r, .012); g.stroke();
  g.strokeStyle = 'rgba(14,10,14,.9)'; wobbleCircle(g, 0, 0, R + bw * .55, r, .02); g.stroke();
  // little rivets
  g.fillStyle = 'rgba(40,24,16,.7)'; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.2832 + .2; g.beginPath(); g.arc(Math.cos(a) * (R - bw * .1), Math.sin(a) * (R - bw * .1), bw * .09, 0, 7); g.fill(); }
  g.restore();
}

/* ======================================== TITLE + ENDING TABLEAUX */
const DW = 1280, DH = 720;
const _tab = new Map();
function stopAt(stops, t) { t = clamp(t, 0, 1); for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) { const a = stops[i - 1], b = stops[i]; return mix(C(a[1]), C(b[1]), (t - a[0]) / (b[0] - a[0] || 1)); } return C(stops[stops.length - 1][1]); }
function skyFill(g, x, y, w, h, stops, r, n) {
  const gr = g.createLinearGradient(0, y, 0, y + h); stops.forEach(s => gr.addColorStop(s[0], css(C(s[1])))); g.fillStyle = gr; g.fillRect(x, y, w, h);
  for (let i = 0; i < (n || 500); i++) { const yy = y + r() * h, t = (yy - y) / h; bristle(g, x + r() * w, yy, r.g() * .06, r.r(100, 360), r.r(7, 24), jit(stopAt(stops, t), r, .1), r.r(.1, .3), r); }
}
function cloud(g, cx, cy, rx, ry, col, rim, r, n) {
  const cnt = (n || 8) * 22; g.save();
  for (let i = 0; i < cnt; i++) {
    const a = r() * 6.2832, d = Math.sqrt(r()), x = cx + Math.cos(a) * d * rx, y = cy + Math.sin(a) * d * ry * .55 + (1 - d) * -ry * .15;
    const top = (y - cy) / (ry * .55 + 1), c = mix(mix(col, [255, 255, 255], .0), C(rim), clamp(-top * .6 + (x - cx) / rx * .35, 0, .7));
    bristle(g, x, y, r.g() * .06, r.r(50, 150) * (rx / 220 + .3), r.r(9, 22), jit(mul(c, 1 - d * .2), r, .08), r.r(.18, .34), r);
  }
  g.restore();
}
function glowAt(g, x, y, rad, col, a) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a; g.drawImage(glowSprite(col, 128), x - rad, y - rad, rad * 2, rad * 2); g.restore(); }
function lightRays(g, x, y, len, spread, dirA, col, a, n, r) {
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const ang = dirA + (i / (n - 1) - .5) * spread + r.g() * .02, w = r.r(.02, .06), L = len * r.r(.6, 1);
    const gr = g.createLinearGradient(x, y, x + Math.cos(ang) * L, y + Math.sin(ang) * L); gr.addColorStop(0, css(col, a)); gr.addColorStop(1, css(col, 0));
    g.fillStyle = gr; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(ang - w) * L, y + Math.sin(ang - w) * L); g.lineTo(x + Math.cos(ang + w) * L, y + Math.sin(ang + w) * L); g.closePath(); g.fill();
  }
  g.restore();
}
function fig(g, look, facing, frame, x, y, sc, pose, tintMul) {
  const s = getFigure(look, facing, frame, pose);
  g.save(); g.translate(x, y); g.scale(sc / SS, sc / SS); g.drawImage(s.c, -s.ax, -s.ay); g.restore();
}
function groundShadow(g, x, y, rx, a) { g.save(); g.globalAlpha = a || .5; g.fillStyle = '#05040a'; g.beginPath(); g.ellipse(x, y, rx, rx * .25, 0, 0, 7); g.fill(); g.restore(); }

function paintSchool(g, r, o) {
  const x0 = o.x, by = o.y, s = o.s || 1, wall = C(o.wall || [96, 108, 100]), roof = C(o.roof || [44, 52, 56]), lit = C(o.lit || [255, 190, 90]), glows = o.glows;
  const W = 840 * s, FH = 190 * s, tx = x0 + 560 * s, TW_ = 118 * s, TH_ = 360 * s;
  const rimC = o.rim || [255, 150, 70];
  // facade
  paintPoly(g, [[x0, by - FH], [x0 + W, by - FH], [x0 + W, by], [x0, by]], wall, r, { n: 260, sw: 9 * s, sl: 80 * s, ang: 1.57, aj: .15, ink: true, inkw: 3, alt: mul(wall, 1.3), lit: [mix(wall, rimC, .3), mul(wall, .45), 0, .3, .5], jv: .1 });
  paintPoly(g, [[x0 - 6 * s, by - FH - 14 * s], [x0 + W + 6 * s, by - FH - 14 * s], [x0 + W + 6 * s, by - FH], [x0 - 6 * s, by - FH]], roof, r, { n: 60, sw: 6, ang: 0, ink: true, inkw: 2.4 });
  // windows
  const rows = 3, cols = 17, ww = 30 * s, wh = 36 * s;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const wx = x0 + 26 * s + i * (W - 52 * s) / (cols - 1) - ww / 2, wy = by - FH + 20 * s + j * 54 * s;
    if (Math.abs(wx + ww / 2 - tx) < TW_ / 2 + 8 * s) continue;
    const on = lat(i, j, o.seed || 3) < (o.litP === undefined ? .45 : o.litP);
    paintRect(g, wx, wy, ww, wh, on ? lit : [26, 36, 44], r, { n: 10, sw: 4, ang: 1.57, ink: true, inkw: 2, alt: on ? [255, 230, 150] : [50, 70, 80], jv: .08 });
    g.strokeStyle = css([20, 18, 20], .8); g.lineWidth = 1.6 * s; g.beginPath(); g.moveTo(wx + ww / 2, wy); g.lineTo(wx + ww / 2, wy + wh); g.moveTo(wx, wy + wh * .45); g.lineTo(wx + ww, wy + wh * .45); g.stroke();
    if (on && glows) glows.push({ x: wx + ww / 2, y: wy + wh / 2, r: 46 * s, col: lit, a: .32, fl: .12, ph: (i * 7 + j * 3) % 6 });
  }
  // entrance with steps
  const dx = x0 + 300 * s; paintRect(g, dx - 34 * s, by - 74 * s, 68 * s, 74 * s, [40, 30, 26], r, { n: 30, ink: true, ang: 1.57 }); paintRect(g, dx - 26 * s, by - 66 * s, 52 * s, 66 * s, [200, 150, 80], r, { n: 20, ang: 1.57, ink: true, alt: [255, 200, 110] });
  for (let k = 0; k < 4; k++) paintRect(g, dx - (46 + k * 6) * s, by - (k + 1) * 6 * s + 24 * s, (92 + k * 12) * s, 7 * s, mul(wall, .9 - k * .06), r, { n: 8, ang: 0, ink: true, ew: 1 });
  if (glows) glows.push({ x: dx, y: by - 30 * s, r: 90 * s, col: [255, 170, 80], a: .4, fl: .05, ph: 1 });
  // sign band
  paintRect(g, x0 + 150 * s, by - FH - 40 * s, 310 * s, 26 * s, [30, 56, 48], r, { n: 30, ink: true, ang: 0 }); handText(g, 'WARDEN AUREL MEMORIAL GYMNASIUM', x0 + 305 * s, by - FH - 27 * s, 14 * s, [226, 214, 160], r, 290 * s, { shadow: [0, 0, 0, 0], font: 'bold' });
  // tower with belfry
  paintPoly(g, [[tx - TW_ / 2, by - FH + 8 * s], [tx + TW_ / 2, by - FH + 8 * s], [tx + TW_ / 2 - 8 * s, by - TH_], [tx - TW_ / 2 + 8 * s, by - TH_]], mul(wall, 1.04), r, { n: 240, sw: 8 * s, sl: 70 * s, ang: 1.57, aj: .12, ink: true, inkw: 3, lit: [mix(wall, rimC, .4), mul(wall, .4), 0, .35, .55], alt: mul(wall, 1.3) });
  const bt = by - TH_ + 34 * s, bw = 60 * s, bh = 82 * s;
  g.fillStyle = css([14, 10, 14]); g.beginPath(); g.moveTo(tx - bw / 2, bt + bh); g.lineTo(tx - bw / 2, bt + 20 * s); g.arc(tx, bt + 20 * s, bw / 2, Math.PI, 0); g.lineTo(tx + bw / 2, bt + bh); g.closePath(); g.fill();
  g.strokeStyle = css(INK); g.lineWidth = 2.4; g.stroke();
  const bellC = C(o.bell || [226, 178, 80]);
  paintPoly(g, [[tx - 6 * s, bt + 10 * s], [tx + 6 * s, bt + 10 * s], [tx + 9 * s, bt + 36 * s], [tx + 22 * s, bt + 62 * s], [tx - 22 * s, bt + 62 * s], [tx - 9 * s, bt + 36 * s]], bellC, r, { n: 40, sw: 3, ang: 1.5, ink: true, lit: [[255, 240, 180], [90, 50, 20], 0], alt: [255, 220, 130] });
  g.strokeStyle = css([20, 14, 12], .6); g.lineWidth = 2; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(tx - bw / 2 + k * bw / 4, bt + 30 * s); g.lineTo(tx - bw / 2 + k * bw / 4, bt + bh); g.stroke(); }
  if (glows) glows.push({ x: tx, y: bt + 40 * s, r: 120 * s, col: bellC, a: .3, fl: .08, ph: 2.2 });
  // roof pyramid + spire
  paintPoly(g, [[tx - TW_ / 2 - 8 * s, by - TH_], [tx + TW_ / 2 + 8 * s, by - TH_], [tx + 4 * s, by - TH_ - 98 * s], [tx - 4 * s, by - TH_ - 98 * s]], roof, r, { n: 80, sw: 5, ang: 1.2, ink: true, inkw: 2.6, lit: [mix(roof, rimC, .4), mul(roof, .4), 0, .3, .4] });
  g.strokeStyle = css(INK); g.lineWidth = 2.6; g.beginPath(); g.moveTo(tx, by - TH_ - 98 * s); g.lineTo(tx, by - TH_ - 132 * s); g.stroke(); g.fillStyle = css(rimC); g.beginPath(); g.arc(tx, by - TH_ - 132 * s, 4 * s, 0, 7); g.fill();
  // clock
  g.fillStyle = css([230, 220, 180]); g.beginPath(); g.arc(tx, by - TH_ + 4 * s + 130 * s, 22 * s, 0, 7); g.fill(); g.strokeStyle = css(INK); g.lineWidth = 2.4; g.stroke(); g.beginPath(); g.moveTo(tx, by - TH_ + 134 * s); g.lineTo(tx, by - TH_ + 114 * s); g.moveTo(tx, by - TH_ + 134 * s); g.lineTo(tx + 12 * s, by - TH_ + 134 * s); g.stroke();
  // loudspeaker horns on tower
  for (const sd of [-1, 1]) { const hx = tx + sd * (TW_ / 2 + 2 * s), hy = by - TH_ + 60 * s; paintPoly(g, [[hx, hy - 8 * s], [hx + sd * 26 * s, hy - 16 * s], [hx + sd * 26 * s, hy + 16 * s], [hx, hy + 8 * s]], [80, 80, 76], r, { n: 16, ink: true, ang: 0 }); }
  // flagpole on the facade
  g.strokeStyle = css(INK); g.lineWidth = 3; g.beginPath(); g.moveTo(x0 + 80 * s, by - FH - 14 * s); g.lineTo(x0 + 80 * s, by - FH - 110 * s); g.stroke();
  paintPoly(g, [[x0 + 80 * s, by - FH - 110 * s], [x0 + 130 * s, by - FH - 100 * s], [x0 + 126 * s, by - FH - 80 * s], [x0 + 80 * s, by - FH - 86 * s]], [170, 34, 36], r, { n: 20, ink: true, ang: .1 });
  // rim light along right edges + base haze
  g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = css(rimC, .5); g.lineWidth = 3 * s; g.beginPath(); g.moveTo(tx + TW_ / 2, by - FH); g.lineTo(tx + TW_ / 2 - 8 * s, by - TH_); g.stroke(); g.restore();
  const hz = g.createLinearGradient(0, by - 60 * s, 0, by); hz.addColorStop(0, css(o.haze || [255, 150, 70], 0)); hz.addColorStop(1, css(o.haze || [255, 150, 70], .22)); g.fillStyle = hz; g.fillRect(x0 - 20, by - 60 * s, W + 40, 60 * s);
  return { tx: tx, bellY: bt + 40 * s, top: by - TH_ };
}
function cobbles(g, r, y0, h, col, sky) {
  const gr = g.createLinearGradient(0, y0, 0, y0 + h); gr.addColorStop(0, css(mul(col, .9))); gr.addColorStop(1, css(mul(col, .35))); g.fillStyle = gr; g.fillRect(0, y0, DW, h);
  for (let i = 0; i < 900; i++) { const y = y0 + Math.pow(r(), 1.5) * h, k = (y - y0) / h, x = r() * DW, w = 10 + k * 46, hh = 4 + k * 16; paintEll(g, x, y, w, hh, jit(mul(col, .6 + k * .5), r, .14), r, { n: 5, sw: 3, ang: 0, ink: false, edge: false, pn: 8, alpha: .8 }); }
  for (let i = 0; i < 6; i++) { const x = r.r(100, DW - 100), y = y0 + r.r(h * .3, h * .9), rx = r.r(50, 140), ry = rx * .16; const pg = g.createLinearGradient(x, y - ry, x, y + ry); pg.addColorStop(0, css(sky[0], .7)); pg.addColorStop(1, css(sky[1], .7)); g.fillStyle = pg; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); }
}
function pole(g, r, x, y, h, col) {
  paintRect(g, x - 3, y - h, 6, h, col || [40, 40, 44], r, { n: 10, ang: 1.57, ink: true, inkw: 1.6 });
  for (const sd of [-1, 1]) paintPoly(g, [[x + sd * 3, y - h + 10], [x + sd * 26, y - h + 2], [x + sd * 26, y - h + 30], [x + sd * 3, y - h + 22]], [84, 84, 78], r, { n: 12, ink: true, ang: 0, inkw: 1.6 });
}
function wires(g, pts, a) { g.strokeStyle = css([14, 12, 16], a || .7); g.lineWidth = 1.5; for (let i = 0; i < pts.length - 1; i++) { const p = pts[i], q = pts[i + 1]; g.beginPath(); g.moveTo(p[0], p[1]); g.quadraticCurveTo((p[0] + q[0]) / 2, Math.max(p[1], q[1]) + 22, q[0], q[1]); g.stroke(); } }

/* ---- scene builders: return {glows, anim(g,t,Wd,Hd), cam} ---- */
const SCENES = {};
SCENES.title = function (g, r) {
  const sc = { glows: [], rings: { x: 0, y: 0 }, birds: [] };
  skyFill(g, 0, 0, DW, DH * .72, [[0, [14, 46, 56]], [.35, [40, 98, 86]], [.62, [136, 150, 92]], [.82, [236, 150, 70]], [1, [250, 190, 100]]], r, 700);
  for (let i = 0; i < 7; i++) cloud(g, r.r(0, DW), r.r(40, 300), r.r(140, 300), r.r(26, 50), mix([30, 70, 70], [210, 120, 70], r() * .8), [255, 170, 80], r, 8);
  glowAt(g, 960, 470, 360, [255, 150, 60], .25);
  // distant blocks
  for (let i = 0; i < 12; i++) { const x = i * 120 + r.r(-20, 20), h = r.r(70, 190); paintRect(g, x, 560 - h, r.r(80, 130), h + 20, mix([40, 56, 60], [120, 70, 60], r() * .3), r, { n: 60, sw: 6, ang: 1.57, ink: false, edge: false, alpha: .9 }); }
  const info = paintSchool(g, r, { x: 330, y: 610, s: 1.0, wall: [90, 108, 98], litP: .5, glows: sc.glows, seed: 7, bell: [236, 190, 90] });
  sc.rings = { x: info.tx, y: info.bellY };
  cobbles(g, r, 600, DH - 600, [96, 98, 100], [[40, 90, 90], [240, 140, 70]]);
  // poles + wires
  pole(g, r, 120, 680, 340); pole(g, r, 1180, 700, 400);
  wires(g, [[120, 345], [660, 520], [1180, 305]]);
  // lone student, left, looking at the school
  groundShadow(g, 220, 690, 36, .5); fig(g, GD_PLAYER(), 'ne', 0, 220, 690, 2.2 * 1.0, 'stand');
  glowAt(g, 220, 640, 120, [255, 140, 60], .08);
  sc.anim = function (g, t) {
    // bell rings
    for (let k = 0; k < 3; k++) { const ph = ((t * .00017 + k / 3) % 1), rad = 30 + ph * 700; g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = css([255, 210, 120], (1 - ph) * .22); g.lineWidth = 3 + ph * 8; g.beginPath(); g.ellipse(sc.rings.x, sc.rings.y, rad, rad * .72, 0, 0, 7); g.stroke(); g.restore(); }
    // birds
    g.fillStyle = css([10, 10, 14], .85); for (let i = 0; i < 9; i++) { const bx = ((t * .02 * (.6 + (i % 3) * .2) + i * 190) % (DW + 200)) - 100, by = 110 + (i * 53) % 220 + Math.sin(t * .003 + i) * 14, f = Math.sin(t * .012 + i * 2) * 5; g.beginPath(); g.moveTo(bx - 9, by + f); g.quadraticCurveTo(bx - 3, by - 5, bx, by); g.quadraticCurveTo(bx + 3, by - 5, bx + 9, by + f); g.lineTo(bx + 3, by - 2); g.lineTo(bx - 3, by - 2); g.fill(); }
  };
  return sc;
};
function GD_PLAYER() { return (typeof window !== 'undefined' && window.GD && window.GD.playerLook) || DEF_LOOK; }

SCENES.end_good_student = function (g, r) {
  const sc = { glows: [] };
  skyFill(g, 0, 0, DW, DH, [[0, [20, 70, 62]], [.4, [90, 150, 96]], [.7, [226, 190, 96]], [1, [250, 150, 70]]], r, 700);
  for (let i = 0; i < 6; i++) cloud(g, r.r(0, DW), r.r(30, 260), r.r(160, 320), r.r(26, 46), mix([120, 170, 110], [240, 190, 100], r() * .7), [255, 200, 110], r, 8);
  glowAt(g, 640, 560, 520, [255, 200, 100], .3);
  const info = paintSchool(g, r, { x: 220, y: 560, s: 1.1, wall: [120, 132, 112], litP: .15, glows: sc.glows, seed: 11, rim: [255, 200, 100], haze: [255, 190, 90] });
  sc.rings = info;
  cobbles(g, r, 556, DH - 556, [128, 118, 100], [[120, 170, 110], [250, 190, 100]]);
  // flags at half-mast, row of students in uniform
  const uni = (c, i) => ({ skin: ['#e9c9b1', '#d9a98a', '#c98f6e', '#e0b196'][i % 4], hair: ['#2a1d18', '#a2723a', '#1a1414', '#5a4a3a'][i % 4], hairStyle: ['short', 'slick', 'bob', 'cap'][i % 4], outfit: 'uniform', outfitColor: c, accent: '#c9892f', build: 'avg', glasses: i % 3 === 0, age: 'teen', pose: 'stand', extra: 'none' });
  for (let i = 0; i < 9; i++) { const x = 170 + i * 118 + (i % 2) * 14, y = 640 + (i % 2) * 22, s = 1.8 + (i % 2) * .15; groundShadow(g, x, y, 28, .4); fig(g, uni('#3f4d5c', i), 'n', 0, x, y, s * 1.2); }
  // the player in front with Vanguard armband, facing the school
  groundShadow(g, 640, 702, 40, .55); fig(g, Object.assign({}, GD_PLAYER(), { extra: 'armband', outfitColor: '#7a2828' }), 'n', 0, 640, 704, 3.2);
  glowAt(g, 640, 620, 260, [255, 180, 80], .12);
  sc.anim = function (g, t) {
    for (let k = 0; k < 2; k++) { const ph = ((t * .00014 + k / 2) % 1); g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = css([255, 230, 150], (1 - ph) * .2); g.lineWidth = 4 + ph * 8; g.beginPath(); g.ellipse(info.tx, info.bellY, 40 + ph * 720, (40 + ph * 720) * .7, 0, 0, 7); g.stroke(); g.restore(); }
    g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 14; i++) { const x = (i * 97 + t * .02) % DW, y = 80 + (i * 61) % 420 + Math.sin(t * .001 + i) * 18; g.fillStyle = css([255, 230, 150], .5); g.beginPath(); g.arc(x, y, 1.6, 0, 7); g.fill(); } g.restore();
  };
  return sc;
};
SCENES.end_ledger = function (g, r) {
  const sc = { glows: [] };
  g.fillStyle = css([26, 16, 18]); g.fillRect(0, 0, DW, DH);
  for (let y = 0, row = 0; y < 470; y += 22, row++) for (let x = (row & 1) * -30; x < DW; x += 60) paintRect(g, x + 1, y + 1, 58, 20, jit([110, 54, 40], r, .2), r, { n: 3, sw: 4, ang: 0, ink: false, edge: false, alpha: .9 });
  const wallShade = g.createLinearGradient(0, 0, 0, 480); wallShade.addColorStop(0, 'rgba(6,4,10,.92)'); wallShade.addColorStop(.6, 'rgba(6,4,10,.5)'); wallShade.addColorStop(1, 'rgba(6,4,10,.2)'); g.fillStyle = wallShade; g.fillRect(0, 0, DW, 480);
  // ceiling pipes
  for (let k = 0; k < 4; k++) { const y = 40 + k * 28; paintRect(g, 0, y, DW, 16 + (k & 1) * 6, [74 + k * 6, 80, 76], r, { n: 120, sw: 6, ang: 0, ink: true, inkw: 2, lit: [[255, 210, 150], [10, 12, 20], -1.57, .5, .5] }); for (let x = 90 + k * 70; x < DW; x += 260) paintRect(g, x, y - 4, 10, 26, [50, 54, 52], r, { n: 6, ink: true, ang: 1.57 }); }
  // floor
  paintRect(g, 0, 470, DW, 250, [58, 56, 60], r, { n: 400, sw: 14, ang: .02, aj: .2, alt: [90, 80, 80], lit: [[110, 90, 80], [10, 10, 16], -1.57, .3, .6], ink: false, edge: false });
  // string of bulbs
  const bulbs = [];
  for (let i = 0; i < 9; i++) { const x = 100 + i * 135, y = 150 + Math.sin(i * 1.1) * 12 + (i % 2) * 14; bulbs.push([x, y]); }
  wires(g, [[0, 120]].concat(bulbs).concat([[DW, 120]]), .9);
  for (const [x, y] of bulbs) { g.fillStyle = css([255, 232, 160]); g.beginPath(); g.arc(x, y + 8, 7, 0, 7); g.fill(); g.strokeStyle = css(INK); g.lineWidth = 1.6; g.stroke(); sc.glows.push({ x, y: y + 8, r: 150, col: [255, 170, 70], a: .55, fl: .2, ph: x * .07 }); }
  // boiler glow at left
  paintPoly(g, [[30, 262], [250, 262], [250, 500], [190, 520], [90, 520], [30, 500]], [86, 90, 88], r, { n: 240, sw: 8, ang: 1.57, ink: true, inkw: 3, lit: [[255, 160, 90], [10, 12, 20], Math.PI, .5, .5] }); paintEll(g, 140, 262, 110, 26, [100, 104, 100], r, { n: 30, ink: true, inkw: 3 }); for (const yy of [320, 380, 440]) { g.strokeStyle = css([30, 32, 34], .8); g.lineWidth = 3; g.beginPath(); g.ellipse(140, yy, 110, 22, 0, 0, Math.PI); g.stroke(); }
  g.fillStyle = css([255, 140, 40]); g.beginPath(); g.ellipse(140, 410, 46, 36, 0, 0, 7); g.fill(); g.strokeStyle = css(INK); g.lineWidth = 3; g.stroke(); sc.glows.push({ x: 140, y: 410, r: 280, col: [255, 110, 30], a: .6, fl: .25, ph: 1 });
  // table, ledger, circle of figures
  const tx = 700, ty = 560;
  groundShadow(g, tx, ty + 40, 220, .5);
  paintPoly(g, [[tx - 160, ty - 10], [tx + 160, ty - 10], [tx + 190, ty + 20], [tx - 190, ty + 20]], [140, 98, 60], r, { n: 120, ang: 0, ink: true, inkw: 3, alt: [200, 150, 90] });
  paintRect(g, tx - 190, ty + 20, 380, 16, [96, 66, 40], r, { n: 30, ang: 0, ink: true }); for (const x of [-170, 170]) paintRect(g, tx + x - 7, ty + 36, 14, 80, [86, 58, 36], r, { n: 10, ang: 1.57, ink: true });
  const lg = ty - 20; paintPoly(g, [[tx - 60, lg], [tx, lg - 14], [tx + 60, lg], [tx, lg + 16]], [40, 70, 56], r, { n: 40, ink: true, inkw: 2.4, ang: 0, alt: [90, 130, 100] }); paintPoly(g, [[tx - 52, lg - 2], [tx, lg - 14], [tx, lg + 10], [tx - 52, lg + 6]], [226, 214, 176], r, { n: 20, ink: true, ang: 0 }); paintPoly(g, [[tx + 52, lg - 2], [tx, lg - 14], [tx, lg + 10], [tx + 52, lg + 6]], [236, 226, 190], r, { n: 20, ink: true, ang: 0 });
  sc.glows.push({ x: tx, y: lg - 6, r: 300, col: [255, 214, 130], a: .7, fl: .06, ph: 0 });
  const ank = { skin: '#c9a187', hair: '#bdb6aa', hairStyle: 'bun', outfit: 'labcoat', outfitColor: '#d9d4c4', accent: '#6a3f2a', build: 'avg', glasses: true, age: 'old', pose: 'stand', extra: 'cigarette' };
  groundShadow(g, tx + 150, ty + 60, 40, .5); fig(g, ank, 'sw', 0, tx + 150, ty + 60, 2.6);
  groundShadow(g, tx - 150, ty + 70, 40, .5); fig(g, GD_PLAYER(), 'se', 0, tx - 150, ty + 70, 2.6);
  const seated = (i) => ({ skin: ['#e9c9b1', '#b88a6a', '#d9a98a'][i % 3], hair: ['#1c1a22', '#a2723a', '#5a5a58'][i % 3], hairStyle: ['braid', 'curly', 'buzz'][i % 3], outfit: ['cardigan', 'overalls', 'uniform'][i % 3], outfitColor: ['#7a4b3a', '#566a77', '#3f4d5c'][i % 3], accent: '#c9892f', build: 'avg', glasses: i === 1, age: 'teen', pose: 'sit', extra: 'none' });
  [[420, 610, 'e'], [900, 640, 'w'], [330, 690, 'e'], [1040, 600, 'w'], [980, 700, 'w']].forEach((p, i) => { groundShadow(g, p[0], p[1], 30, .4); fig(g, seated(i), p[2], 0, p[0], p[1], 2.2); });
  // dark vignette to make it intimate
  sc.anim = function (g, t) {
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) { const ph = ((t * .0002 + i / 4) % 1); g.globalAlpha = (1 - ph) * .08; g.drawImage(glowSprite([220, 220, 230], 128), 160 + Math.sin(ph * 6 + i) * 20 - 30 * ph, 380 - ph * 220, 60 + ph * 120, 60 + ph * 120); }
    g.restore();
  };
  return sc;
};
SCENES.end_static = function (g, r) {
  const sc = { glows: [] };
  g.fillStyle = css([10, 6, 14]); g.fillRect(0, 0, DW, DH);
  // proscenium + stage back wall
  paintRect(g, 160, 40, 960, 420, [54, 36, 40], r, { n: 300, sw: 14, ang: 1.57, ink: true, inkw: 4, alt: [96, 50, 44], lit: [[120, 80, 60], [10, 8, 14], -1.57, .3, .6] });
  paintPoly(g, [[200, 60], [1080, 60], [1080, 440], [200, 440]], [220, 180, 120], r, { n: 200, sw: 18, ang: 1.57, ink: false, alt: [255, 230, 170], edge: false });
  for (const sd of [0, 1]) paintPoly(g, [[sd ? 1120 : 160, 40], [sd ? 1030 : 250, 40], [sd ? 1060 : 220, 460], [sd ? 1120 : 160, 460]], [130, 24, 36], r, { n: 120, sw: 10, ang: 1.57, ink: true, inkw: 3, alt: [200, 60, 50], lit: [[255, 140, 120], [30, 6, 14], 0, .3, .5] });
  paintRect(g, 160, 30, 960, 36, [110, 20, 32], r, { n: 60, ang: 0, ink: true }); for (let x = 170; x < 1110; x += 16) { g.fillStyle = css([210, 170, 70], .85); g.fillRect(x, 64, 3, 8); }
  // stage floor
  paintPoly(g, [[120, 460], [1160, 460], [1240, 560], [40, 560]], [140, 100, 64], r, { n: 300, sw: 12, ang: 0, ink: true, inkw: 3, alt: [220, 170, 100], lit: [[255, 230, 170], [40, 20, 20], -1.57, .5, .4] });
  paintRect(g, 40, 560, 1200, 26, [70, 44, 30], r, { n: 60, ang: 0, ink: true, inkw: 3 });
  // light pouring toward the viewer
  const ml = [640, 430];
  lightRays(g, ml[0], ml[1], 800, 2.6, Math.PI / 2, [255, 236, 190], .22, 26, r);
  glowAt(g, 640, 400, 560, [255, 236, 190], .6);
  // microphone stand (centre) and the lone figure
  groundShadow(g, 640, 540, 70, .4);
  paintRect(g, 636, 330, 8, 210, [60, 60, 66], r, { n: 20, ink: true, ang: 1.57 }); paintEll(g, 640, 540, 38, 9, [50, 50, 56], r, { n: 10, ink: true });
  paintEll(g, 640, 320, 13, 18, [200, 204, 208], r, { n: 16, ink: true, alt: [255, 255, 255], lit: [[255, 255, 255], [60, 70, 90], -1] });
  fig(g, GD_PLAYER(), 's', 0, 520, 548, 3.4);
  glowAt(g, 640, 320, 150, [255, 255, 240], .9);
  // loudspeakers on poles at the sides
  pole(g, r, 90, 700, 560); pole(g, r, 1190, 700, 560);
  // audience: dark heads at the bottom
  for (let i = 0; i < 34; i++) { const x = i * 40 + r.r(-8, 8) - 10, y = 660 + (i % 3) * 22 + r.r(-4, 6), s = 22 + (i % 3) * 6; paintEll(g, x, y, s, s * 1.15, jit([16, 10, 18], r, .3), r, { n: 8, sw: 5, ang: 1, ink: false, edge: false }); paintEll(g, x, y + s * 1.3, s * 1.5, s, [12, 8, 14], r, { n: 6, ink: false, edge: false }); g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = css([255, 190, 110], .18); g.beginPath(); g.arc(x + s * .5, y - s * .3, s * .7, -1, 1); g.fill(); g.restore(); }
  sc.anim = function (g, t) {
    // sound arcs from loudspeakers
    for (const x of [90, 1190]) for (let k = 0; k < 3; k++) { const ph = ((t * .00035 + k / 3) % 1); g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = css([255, 230, 170], (1 - ph) * .35); g.lineWidth = 3; g.beginPath(); const sd = x < 640 ? 1 : -1; g.arc(x + sd * 24, 160, 20 + ph * 220, -.9 + (sd < 0 ? 3.14 : 0), .9 + (sd < 0 ? 3.14 : 0)); g.stroke(); g.restore(); }
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .12 + .04 * Math.sin(t * .004); g.drawImage(glowSprite([255, 240, 200], 128), 640 - 400, 330 - 280, 800, 560); g.restore();
  };
  return sc;
};
SCENES.end_quiet = function (g, r) {
  const sc = { glows: [] };
  skyFill(g, 0, 0, DW, DH, [[0, [18, 28, 62]], [.45, [58, 76, 116]], [.75, [176, 120, 110]], [1, [236, 150, 90]]], r, 700);
  for (let i = 0; i < 70; i++) { g.fillStyle = css([255, 240, 210], r.r(.2, .8)); g.fillRect(r.r(0, DW), r.r(0, 220), 2, 2); }
  for (let i = 0; i < 4; i++) cloud(g, r.r(0, DW), r.r(60, 260), r.r(160, 280), 34, [96, 90, 120], [255, 160, 100], r, 7);
  // apartment blocks both sides, lit windows
  const block = (x, w, h, col) => { paintRect(g, x, 640 - h, w, h, col, r, { n: 220, sw: 9, ang: 1.57, ink: true, inkw: 3, alt: mul(col, 1.3), lit: [[255, 160, 100], [8, 8, 16], 0, .25, .5] }); for (let j = 0; j < h / 46; j++) for (let i = 0; i < w / 44; i++) { const on = lat(i + x, j, 9) < .35, wx = x + 14 + i * 44, wy = 640 - h + 16 + j * 46; paintRect(g, wx, wy, 24, 30, on ? [250, 190, 90] : [24, 30, 40], r, { n: 6, ink: true, inkw: 1.6, ang: 1.57 }); if (on) sc.glows.push({ x: wx + 12, y: wy + 15, r: 44, col: [255, 180, 80], a: .28, fl: .1, ph: (i + j * 3 + x) % 6 }); } };
  block(-20, 260, 420, [66, 70, 84]); block(250, 200, 300, [78, 70, 84]); block(840, 220, 340, [70, 72, 88]); block(1060, 260, 460, [60, 64, 80]);
  // road
  const road = g.createLinearGradient(0, 600, 0, DH); road.addColorStop(0, css([70, 66, 80])); road.addColorStop(1, css([22, 20, 30])); g.fillStyle = road; g.beginPath(); g.moveTo(0, 640); g.lineTo(DW, 640); g.lineTo(DW, DH); g.lineTo(0, DH); g.fill();
  paintPoly(g, [[470, 640], [840, 640], [1280, 720], [0, 720]], [64, 60, 74], r, { n: 300, sw: 12, ang: 1.4, aj: .3, ink: false, alt: [100, 80, 90], edge: false });
  for (let i = 0; i < 90; i++) { const y = 650 + Math.pow(r(), 1.4) * 70, x = r() * DW; paintEll(g, x, y, 6 + (y - 640) * .5, 2 + (y - 640) * .15, jit([84, 80, 92], r, .2), r, { n: 4, ink: false, edge: false, pn: 8, sw: 3 }); }
  // lit window with tea on top-right block
  const wx = 1100, wy = 360; paintRect(g, wx, wy, 70, 90, [255, 196, 100], r, { n: 20, ink: true, inkw: 3, ang: 1.57, alt: [255, 230, 150] }); paintRect(g, wx + 4, wy + 62, 62, 28, [96, 56, 36], r, { n: 10, ink: true }); paintEll(g, wx + 36, wy + 56, 9, 6, [226, 222, 206], r, { n: 8, ink: true }); sc.glows.push({ x: wx + 35, y: wy + 50, r: 150, col: [255, 190, 90], a: .6, fl: .05, ph: 2 }); sc.tea = { x: wx + 36, y: wy + 46 };
  // lamps along the road
  for (const [x, y, h] of [[330, 650, 200], [760, 648, 190], [1000, 690, 300]]) { paintRect(g, x - 3, y - h, 6, h, [30, 30, 36], r, { n: 8, ink: true, ang: 1.57 }); g.fillStyle = css([255, 214, 130]); g.beginPath(); g.ellipse(x, y - h - 4, 10, 7, 0, 0, 7); g.fill(); g.strokeStyle = css(INK); g.lineWidth = 2; g.stroke(); sc.glows.push({ x, y: y - h, r: 180, col: [255, 180, 90], a: .5, fl: .05, ph: x }); }
  pole(g, r, 560, 650, 180);
  sc.path = { x0: 180, y0: 700, x1: 780, y1: 654 };
  sc.anim = function (g, t) {
    // lone figure walking home, away from us, along the road; long shadow
    const T = (t * .00006) % 1.4, k = clamp(T, 0, 1), x = lerp(sc.path.x0, sc.path.x1, k), y = lerp(sc.path.y0, sc.path.y1, k), s = lerp(3.2, 1.5, k), walking = T < 1;
    g.save(); g.globalAlpha = .4 * (1 - clamp((T - 1.1) * 5, 0, 1)); g.fillStyle = '#05040a'; g.beginPath(); g.ellipse(x + 30 * s, y + 3, 56 * s, 6 * s, -.05, 0, 7); g.fill(); g.restore();
    g.save(); g.globalAlpha = 1 - clamp((T - 1.15) * 6, 0, 1); fig(g, Object.assign({}, GD_PLAYER(), { outfitColor: '#3f4d5c' }), 'ne', walking ? 1 + (Math.floor(t / 150) % 4) : 0, x, y, s); g.restore();
    g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 3; i++) { const ph = ((t * .0003 + i / 3) % 1); g.globalAlpha = (1 - ph) * .3; g.drawImage(glowSprite([230, 230, 240], 128), sc.tea.x - 10 + Math.sin(ph * 6) * 6, sc.tea.y - ph * 40 - 10, 20 + ph * 16, 20 + ph * 16); } g.restore();
  };
  return sc;
};
SCENES.end_arrested = function (g, r) {
  const sc = { glows: [] };
  g.fillStyle = css([18, 20, 24]); g.fillRect(0, 0, DW, DH);
  // concrete cell wall
  paintRect(g, 0, 0, DW, 520, [72, 76, 78], r, { n: 520, sw: 14, ang: .1, aj: .4, alt: [100, 104, 104], jv: .12, ink: false, edge: false, lit: [[110, 120, 116], [14, 16, 22], -.5, .3, .7] });
  paintRect(g, 0, 520, DW, 200, [40, 40, 46], r, { n: 300, sw: 14, ang: 0, ink: false, edge: false, alt: [70, 66, 70] });
  for (let i = 0; i < 40; i++) { g.strokeStyle = css([20, 22, 24], .25); g.lineWidth = r.r(2, 6); g.beginPath(); const x = r() * DW; g.moveTo(x, r() * 200); g.lineTo(x + r.r(-6, 6), r.r(200, 520)); g.stroke(); }
  // window with bars, night sky + loudspeaker pole outside
  const wx = 700, wy = 70, ww = 360, wh = 290;
  paintRect(g, wx - 18, wy - 18, ww + 36, wh + 36, [50, 50, 54], r, { n: 120, sw: 8, ang: 1.57, ink: true, inkw: 4 });
  skyFill(g, wx, wy, ww, wh, [[0, [16, 34, 54]], [.6, [40, 90, 84]], [1, [150, 120, 70]]], r, 120);
  g.save(); g.beginPath(); g.rect(wx, wy, ww, wh); g.clip();
  pole(g, r, wx + 250, wy + wh, 230, [14, 16, 20]);
  g.fillStyle = css([14, 16, 20]); for (let i = 0; i < 5; i++) g.fillRect(wx + i * 80, wy + wh - 40 - (i * 37) % 70, 70, 120);
  for (let i = 0; i < 5; i++) { g.fillStyle = css([255, 214, 120], .8); g.fillRect(wx + 12 + i * 80, wy + wh - 22 - (i * 37) % 60, 8, 10); }
  g.restore();
  for (let i = 0; i < 6; i++) { const x = wx + i * (ww / 5); paintRect(g, x - 7, wy - 6, 14, wh + 12, [30, 30, 34], r, { n: 16, sw: 4, ang: 1.57, ink: true, inkw: 2, lit: [[160, 180, 190], [6, 6, 10], 0, .5, .5] }); }
  paintRect(g, wx - 6, wy + wh / 2 - 6, ww + 12, 12, [30, 30, 34], r, { n: 10, ang: 0, ink: true });
  // projected bar shadows across the floor/wall + light
  g.save(); g.globalCompositeOperation = 'lighter'; const lx = wx + 40; for (let i = 0; i < 6; i++) { const x0 = wx + i * (ww / 5); g.fillStyle = 'rgba(120,170,200,.0)'; }
  const beam = g.createLinearGradient(wx, wy, wx - 380, 720); beam.addColorStop(0, 'rgba(150,200,230,.34)'); beam.addColorStop(1, 'rgba(150,200,230,0)'); g.fillStyle = beam;
  for (let i = 0; i < 5; i++) { const a0 = wx + 14 + i * (ww / 5), a1 = a0 + ww / 5 - 28; g.beginPath(); g.moveTo(a0, wy + wh); g.lineTo(a1, wy + wh); g.lineTo(a1 - 520, 720); g.lineTo(a0 - 520, 720); g.closePath(); g.fill(); }
  g.restore();
  // cot, tin cup, tally marks, tiny portrait
  paintPoly(g, [[160, 520], [520, 520], [560, 580], [120, 580]], [78, 70, 62], r, { n: 100, ang: 0, ink: true, inkw: 3 }); paintRect(g, 120, 580, 440, 18, [50, 44, 40], r, { n: 20, ang: 0, ink: true }); for (const x of [130, 540]) paintRect(g, x, 598, 12, 70, [40, 40, 44], r, { n: 10, ang: 1.57, ink: true });
  paintPoly(g, [[180, 500], [330, 500], [350, 530], [160, 530]], [140, 136, 120], r, { n: 40, ang: 0, ink: true });
  for (let k = 0; k < 4; k++) { g.strokeStyle = css([226, 226, 214], .7); g.lineWidth = 2.4; for (let j = 0; j < 4; j++) { g.beginPath(); g.moveTo(120 + k * 22 + j * 4, 190); g.lineTo(122 + k * 22 + j * 4, 226); g.stroke(); } g.beginPath(); g.moveTo(116 + k * 22, 220); g.lineTo(140 + k * 22, 196); g.stroke(); }
  paintRect(g, 360, 140, 90, 120, [60, 50, 40], r, { n: 40, ink: true, inkw: 3, ang: 0 }); paintRect(g, 368, 148, 74, 104, [96, 28, 30], r, { n: 30, ink: true, ang: 1.57 }); paintEll(g, 405, 190, 17, 22, [150, 118, 96], r, { n: 10, ink: true }); g.strokeStyle = css(INK); g.lineWidth = 2.6; g.beginPath(); g.moveTo(394, 186); g.lineTo(404, 188); g.moveTo(416, 186); g.lineTo(406, 188); g.stroke();
  groundShadow(g, 300, 660, 110, .5); fig(g, GD_PLAYER(), 'se', 0, 300, 650, 2.9, 'sit');
  sc.dust = true;
  sc.anim = function (g, t) {
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .08 + .03 * Math.sin(t * .0007); g.fillStyle = css([140, 190, 230]); g.fillRect(wx, wy, ww, wh); g.restore();
    g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 40; i++) { const k = (i * .137 + t * .00004 * (1 + i % 3)) % 1, x = wx - 400 * k + (i * 53) % 340, y = wy + wh + 400 * k + Math.sin(t * .0008 + i) * 6; g.globalAlpha = .4 * (1 - Math.abs(k - .4)); g.fillStyle = css([210, 230, 250]); g.beginPath(); g.arc(x, y, 1.2 + (i % 3) * .5, 0, 7); g.fill(); } g.restore();
  };
  return sc;
};
SCENES.end_curfew = function (g, r) {
  const sc = { glows: [] };
  g.fillStyle = css([10, 8, 14]); g.fillRect(0, 0, DW, DH);
  paintRect(g, 160, 20, 960, 470, [46, 40, 44], r, { n: 300, sw: 12, ang: 1.57, ink: true, inkw: 4, alt: [80, 60, 50], lit: [[100, 80, 66], [8, 8, 14], -1.57, .3, .7] });
  for (const sd of [0, 1]) paintPoly(g, [[sd ? 1120 : 160, 20], [sd ? 960 : 320, 20], [sd ? 1000 : 280, 490], [sd ? 1120 : 160, 490]], [92, 28, 34], r, { n: 150, sw: 10, ang: 1.57, ink: true, inkw: 3, alt: [150, 60, 50], lit: [[230, 130, 110], [14, 6, 12], 0, .3, .6] });
  paintRect(g, 160, 14, 960, 44, [80, 20, 28], r, { n: 60, ang: 0, ink: true, inkw: 3 });
  // hanging bell silhouette and pale ring
  const bx = 640, by = 130;
  paintPoly(g, [[bx - 10, by - 80], [bx + 10, by - 80], [bx + 14, by - 30], [bx + 40, by + 20], [bx + 56, by + 50], [bx - 56, by + 50], [bx - 40, by + 20], [bx - 14, by - 30]], [60, 70, 76], r, { n: 80, ang: 1.5, ink: true, inkw: 3, lit: [[170, 200, 210], [8, 10, 18], Math.PI, .5, .5] });
  g.strokeStyle = css([60, 56, 54]); g.lineWidth = 4; g.beginPath(); g.moveTo(bx, by - 80); g.lineTo(bx, 20); g.stroke();
  // stage floor
  paintPoly(g, [[120, 490], [1160, 490], [1260, 600], [20, 600]], [110, 78, 52], r, { n: 340, sw: 12, ang: 0, ink: true, inkw: 3, alt: [180, 130, 80], lit: [[255, 230, 170], [20, 10, 12], -1.57, .5, .4] });
  paintRect(g, 20, 600, 1240, 30, [60, 40, 28], r, { n: 60, ang: 0, ink: true, inkw: 3 });
  // spotlight cone from above onto centre
  g.save(); g.globalCompositeOperation = 'lighter'; const cone = g.createLinearGradient(640, 0, 640, 560); cone.addColorStop(0, 'rgba(210,230,255,.0)'); cone.addColorStop(.3, 'rgba(210,230,255,.22)'); cone.addColorStop(1, 'rgba(255,240,200,.3)'); g.fillStyle = cone; g.beginPath(); g.moveTo(600, 0); g.lineTo(680, 0); g.lineTo(900, 560); g.lineTo(380, 560); g.closePath(); g.fill(); g.restore();
  glowAt(g, 640, 560, 340, [210, 230, 255], .4);
  // the player lying on the stage, again
  groundShadow(g, 640, 560, 130, .5); const lying = getFigure(GD_PLAYER(), 'se', 0, 'lie'); g.save(); g.translate(640, 560); g.scale(3.2 / SS, 3.2 / SS); g.drawImage(lying.c, -lying.ax, -lying.ay); g.restore();
  // rows of empty seats (silhouettes) in foreground
  for (let row = 0; row < 3; row++) for (let i = 0; i < 16; i++) { const x = 20 + i * 82 + (row & 1) * 38, y = 640 + row * 36, s = 1 + row * .12; paintPoly(g, [[x, y], [x + 54 * s, y], [x + 50 * s, y + 50 * s], [x + 4 * s, y + 50 * s]], mix([40, 16, 24], [14, 8, 14], row / 3), r, { n: 20, sw: 5, ang: 1.57, ink: true, inkw: 2, lit: [[120, 60, 60], [6, 4, 8], 0, .2, .6] }); }
  sc.bell = { x: bx, y: by };
  sc.anim = function (g, t) {
    for (let k = 0; k < 3; k++) { const ph = ((t * .00022 + k / 3) % 1); g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = css([190, 220, 255], (1 - ph) * .16); g.lineWidth = 3 + ph * 9; g.beginPath(); g.ellipse(bx, by + 20, 60 + ph * 780, (60 + ph * 780) * .5, 0, 0, 7); g.stroke(); g.restore(); }
    g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 60; i++) { const x = 640 + Math.sin(i * 12.9 + t * .0003 * (1 + i % 3)) * (60 + i * 3.4), y = ((i * 97 + t * .012 * (.5 + (i % 4) * .2)) % 540); g.globalAlpha = .35 * (.4 + .6 * Math.abs(Math.sin(t * .001 + i))); g.fillStyle = css([220, 235, 255]); g.beginPath(); g.arc(x, y, 1.1 + (i % 3) * .5, 0, 7); g.fill(); } g.restore();
  };
  return sc;
};
function getTableau(id, w, h) {
  const key = id + '|' + w + '|' + h; let sc = _tab.get(key); if (sc) return sc;
  const fn = SCENES[id] || SCENES.end_curfew;
  const c = mk(w, h), g = ctx2(c); g.scale(w / DW, h / DH);
  const sc0 = fn(g, RNG(hashStr(id)));
  // paint texture overlay (canvas weave) baked once
  g.setTransform(1, 0, 0, 1, 0, 0); applyGrain(g, w, h, .3, 'overlay');
  sc = { canvas: c, scene: sc0, w, h }; _tab.set(key, sc);
  if (_tab.size > 8) _tab.delete(_tab.keys().next().value);
  return sc;
}
function drawTableau(ctx, w, h, t, id) {
  w = Math.max(2, Math.round(w)); h = Math.max(2, Math.round(h)); t = t || 0;
  const bw = Math.min(w, 1600), bh = Math.round(bw * h / w), sc = getTableau(id, bw, bh);
  ctx.save(); ctx.fillStyle = '#050408'; ctx.fillRect(0, 0, w, h);
  const z = 1.035 + Math.sin(t * .00012) * .012, dx = Math.sin(t * .00009) * 10, dy = Math.cos(t * .00007) * 6;
  ctx.translate(w / 2 + dx, h / 2 + dy); ctx.scale(z * w / bw, z * w / bw); ctx.translate(-bw / 2, -bh / 2);
  ctx.drawImage(sc.canvas, 0, 0);
  ctx.save(); ctx.scale(bw / DW, bh / DH);
  const s = sc.scene;
  for (const Lg of (s.glows || [])) { const fl = 1 + Lg.fl * (Math.sin(t * .012 + Lg.ph) * .6 + Math.sin(t * .029 + Lg.ph * 2.1) * .4); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, Lg.a * fl); ctx.drawImage(glowSprite(Lg.col, 128), Lg.x - Lg.r, Lg.y - Lg.r, Lg.r * 2, Lg.r * 2); }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  if (s.anim) s.anim(ctx, t);
  ctx.restore(); ctx.restore();
  ctx.drawImage(vignette(w, h), 0, 0);
  if (Art.quality.grain) { ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = .12; const o = (Math.floor(t / 70) * 53) % 256, o2 = (Math.floor(t / 70) * 97) % 256; ctx.translate(-o, -o2); ctx.fillStyle = ctx.createPattern(grainTile(), 'repeat'); ctx.fillRect(0, 0, w + 256, h + 256); ctx.restore(); }
}
function drawTitleImpl(ctx, w, h, t) { drawTableau(ctx, w, h, t, 'title'); }
function drawEndingImpl(ctx, w, h, t, id) { drawTableau(ctx, w, h, t, SCENES[id] ? id : 'end_curfew'); }

/* ========================================================== EXPORT */
const _renderers = new Map();
const Art = {
  TW: TW, TH: TH, version: '1.0',
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
  drawItemIcon: function (ctx, x, y, size, id) { return typeof drawItemIconImpl === 'function' ? drawItemIconImpl(ctx, x, y, size, id) : null; },
  /* helpers for tools / engine */
  getFigure: getFigure,
  timeTint: timeTint,
  prebake: function (loc, time) { return Art.getRenderer(loc).prebake(time); },
  clearCache: function () { _scenes.clear(); _spr.clear(); }
};
(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this)).Art = Art;
})();
