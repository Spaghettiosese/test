
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
  g.save(); pathPoly(g, pts); g.clip(); const m0 = g.getTransform(); if (frame) frame(g); g.globalAlpha = a; if (comp) g.globalCompositeOperation = comp;
  if (off) g.translate(-off[0], -off[1]);
  // fill only the polygon's bounds expressed in the face frame (huge fills in skewed frames are slow)
  const M = g.getTransform().inverse().multiply(m0), bb = bbox(pts); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [px, py] of [[bb[0], bb[1]], [bb[2], bb[1]], [bb[2], bb[3]], [bb[0], bb[3]]]) { const lx = M.a * px + M.c * py + M.e, ly = M.b * px + M.d * py + M.f; if (lx < x0) x0 = lx; if (lx > x1) x1 = lx; if (ly < y0) y0 = ly; if (ly > y1) y1 = ly; }
  g.fillStyle = g.createPattern(prTex(kind), 'repeat'); g.fillRect(x0 - 2, y0 - 2, x1 - x0 + 4, y1 - y0 + 4); g.restore();
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
