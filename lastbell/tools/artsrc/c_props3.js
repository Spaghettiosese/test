
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
