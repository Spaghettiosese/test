
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
