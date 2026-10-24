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
    const nx = Math.cos(a), ny = Math.sin(a), f = clamp((nx * lx + ny * ly) * d * .9 + .25 - (y - cy) / ry * .35, 0, 1);
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
GS.__figs = function (S, r) {
  const g = S.layer(.1); g.fillStyle = '#3a4048'; g.fillRect(-30, -30, S.W + 60, S.H + 60); gs_glow(g, 200, 200, 600, [255, 160, 80], .3);
  const L = [-.6, -.8], rim = [255, 170, 90];
  gs_person(g, r, 120, 680, 560, { view: 'back', pose: 'pockets', L: L, rim: rim, coat: [46, 54, 66], scarf: [120, 34, 34], satchel: [80, 52, 34], coatLen: .3 });
  gs_person(g, r, 380, 680, 560, { view: 'front', pose: 'stand', L: L, rim: rim, coat: [70, 72, 80], tie: [120, 30, 30], hs: 'short', glasses: true });
  gs_person(g, r, 600, 680, 560, { view: 'side', pose: 'walk', dir: 1, L: L, rim: rim, coat: [90, 60, 50], hs: 'long', coatLen: .8, hair: [120, 70, 40] });
  gs_person(g, r, 820, 680, 560, { view: 'side', pose: 'sit', dir: 1, L: L, rim: rim, coat: [120, 110, 90], hs: 'bun', hair: [180, 180, 180] });
  gs_person(g, r, 1100, 680, 560, { view: 'side', pose: 'reach', dir: 1, L: L, rim: rim, coat: [60, 70, 60], hs: 'short' });
  gs_person(g, r, 900, 300, 300, { view: 'side', pose: 'lie', dir: 1, L: L, rim: rim, coat: [50, 54, 70] });
};
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
  for (let i = 0; i < 9; i++) { const cx = r.r(-120, W + 120), cy = y0 + r.r(70, 330) - (port ? r() * (y0 + 100) : 0), rx = r.r(160, 330); gs_cloud(gc, r, cx, cy, rx, r.r(28, 54), mix([22, 36, 48], [40, 44, 58], r()), mix([236, 134, 74], [250, 190, 120], r()), [-.7, .7], { n: Math.round(rx * .9), p: 6 }); }
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
