
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
  const sk = S.mood.sky || SKY[S.bucket];
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
  if (S.bucket !== 4) { const wp = gp(S, p.side === 'l' ? 0 : wallStart(p) + wallLen(p) / 2, p.side === 'l' ? wallStart(p) + wallLen(p) / 2 : 0, z0 + wh / 2); S.lights.push({ x: wp[0], y: wp[1], r: 70, col: S.mood.dapple || DAPPLE[S.bucket], a: .17 * S.lightK, fl: .03, ph: r() * 6, kind: 'window' }); }
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
