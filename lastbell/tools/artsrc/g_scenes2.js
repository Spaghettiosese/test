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
  for (let i = 0; i < 7; i++) gs_rect(g, r, cX - r.r(60, 300), Y + r.r(60, 360), r.r(60, 140), r.r(40, 110), [164, 172, 178], L, { n: 20, sw: 8, alpha: .55, edge: false });
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
    gs_person(gm, r, hx + 50, hy + 200, 230, { view: 'front', pose: 'stand', L: [0, -1], rim: [255, 200, 130], coat: [200, 196, 186], hair: [60, 40, 30], hs: 'short', amb: .3, shade: .7, shadow: false, alpha: 1 });
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
  gf.save(); gf.globalAlpha = .25; gs_rect(gf, r, mx - 140, my - 200, 280, 300, [90, 84, 84], [0, -1], { n: 40, sw: 12, edge: false }); gf.restore();
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
  gs_person(gp, r, tbX - 110, dY + 150, 400, { view: 'side', pose: 'sit', dir: 1, L: [.8, -.5], rim: warm, coat: [46, 54, 66], hair: [30, 24, 20], hs: 'short', coatLen: .5, amb: .5, shade: .45, collar: true, rimA: .85 });
  gs_ell(gp, r, tbX + 60, dY + 10, 140, 18, [176, 180, 182], [0, -1], { n: 30, ink: true, inkw: 2, rim: [255, 240, 220] });
  gp.fillStyle = css([30, 26, 24]); gp.fillRect(tbX + 56, dY + 24, 8, 140);
  gs_ell(gp, r, tbX + 60, dY + 4, 36, 8, [236, 232, 220], [0, -1], { n: 8, ink: true }); gs_ell(gp, r, tbX + 58, dY - 2, 20, 8, [226, 150, 60], [0, -1], { n: 10, ink: true, rim: [255, 220, 150] });
  gs_cup(gp, r, tbX + 120, dY + 6, 1.4, [236, 232, 220], L, warm);
  S.anim(.16, (c, t) => { gs_winFlicker(c, t, tw, [255, 214, 140], .3); c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 30; i++) { const x = lat(i, 9, 3) * W, y = hz + 14 + lat(i, 8, 3) * 50; c.fillStyle = css([255, 214, 160], .12 + .1 * Math.sin(t * .003 + i)); c.fillRect(x + Math.sin(t * .001 + i) * 6, y, 14, 1.5); } c.restore(); });
  S.anim(.56, (c, t) => { for (const lx of lamps) gs_glow(c, lx, Y + 34, 160, warm, .35); gs_rings(c, t, rdX + 72, dY - 90, [255, 220, 170], .1, .0005, 70, 1); });
  S.anim(.76, (c, t) => { gs_steam(c, t, tbX + 120, dY - 16, 1.1, .3, 0); });
};
