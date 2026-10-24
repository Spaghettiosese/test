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
  gs_dark(gm, -S.M, -S.M, W, H, W + 60, wy + 120, 700, 500, [20, 12, 10], .55);
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
  const hH = 460, u = hH / 7.5, handX = wx + ww * .33, handY = wy + wh * .5, px = handX - 1.45 * u, py = handY + 6.25 * u;
  gs_person(pf, r, px, py, hH, { view: 'side', pose: 'reach', dir: 1, L: [.85, -.5], rim: lamp, coat: [96, 78, 66], sleeve: [96, 78, 66], skin: '#d9a98a', hs: 'bun', hair: [60, 44, 36], coatLen: .75, amb: .45, shade: .6, shadow: false, rimA: .8 });
  gs_glow(gm, handX + 6, handY, 40, [200, 220, 255], .12);
  S.anim(.16, (c, t) => { gs_winFlicker(c, t, ow.filter((w, i) => i % 2 === 0), [255, 200, 120], .3); const ph = (t % 11000) / 11000; if (ph < .5) gs_rings(c, ph * 9000, sch.bellX, sch.bellY, [255, 200, 140], .3 * (1 - ph * 2), .0002, 200, .65); });
  S.anim(.61, (c, t) => { gs_steam(c, t, cupX, cupY - 26, 1.3, .35, 0); const b = .5 + .5 * Math.sin(t * .006); gs_glow(c, spX + 24, spY + 28, 14, [255, 140, 60], .4 + .3 * b); gs_rings(c, t, spX, spY - 4, [255, 220, 180], .12, .0004, 90, 1); });
};
