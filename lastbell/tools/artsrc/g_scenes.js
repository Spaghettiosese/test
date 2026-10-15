
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
