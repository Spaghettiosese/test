
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
  S.lights.push({ x: fd[0], y: fd[1] - 3 + (S.zoff || 0), r: 170, col: [255, 120, 40], a: .5, fl: .22, ph: r() * 6, kind: 'fire' });
  S.lights.push({ x: fd[0] + 40, y: fd[1] + 24 + (S.zoff || 0), r: 130, col: [255, 90, 30], a: .25, fl: .2, ph: r() * 6, kind: 'fire' });
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
  const { r, v, u0, v0, u1, v1 } = I, steps = 6, W = u1 - u0;
  // stone-framed stairwell opening: treads descend toward -u (far side)
  g.fillStyle = css([6, 4, 12]); pathPoly(g, [gp(S, u0, v0, 0), gp(S, u1, v0, 0), gp(S, u1, v1, 0), gp(S, u0, v1, 0)]); g.fill();
  for (let i = 0; i < steps; i++) {
    const a = u0 + i * W / steps, b = a + W / steps, z = -i * 7;
    const top = [gp(S, a, v0, z), gp(S, b, v0, z), gp(S, b, v1, z), gp(S, a, v1, z)];
    const face = [gp(S, a, v1, z), gp(S, b, v1, z), gp(S, b, v1, z - 7), gp(S, a, v1, z - 7)];
    const dk = 1 - i * .11;
    paintPoly(g, top, mul([150, 146, 136], dk), r, { n: 16, ang: .46, ink: true, inkw: 1.3, alt: [200, 190, 160] });
    paintPoly(g, face, mul([96, 94, 90], dk), r, { n: 6, ang: .46, ink: true, inkw: 1.1 });
  }
  const grad = g.createLinearGradient(...gp(S, u0, (v0 + v1) / 2, 0), ...gp(S, u1, (v0 + v1) / 2, 0)); grad.addColorStop(0, 'rgba(255,150,60,0)'); grad.addColorStop(1, 'rgba(255,150,60,.0)');
  g.fillStyle = 'rgba(0,0,0,.35)'; pathPoly(g, [gp(S, u1 - W / steps, v0, -35), gp(S, u1, v0, -35), gp(S, u1, v1, -35), gp(S, u1 - W / steps, v1, -35)]); g.fill();
  // railing along the front (v1) edge, posts + top rail
  const pa = gp(S, u0 + .08, v1 - .06, 4), pb = gp(S, u1 - .08, v1 - .06, -30);
  const n = 5;
  for (let i = 0; i <= n; i++) { const t = i / n, base = [lerp(pa[0], pb[0], t), lerp(pa[1], pb[1], t)]; vbar(g, S, r, lerp(u0 + .08, u1 - .08, t), v1 - .06, -i * 5.2 + 3, -i * 5.2 + 38, 3, [40, 44, 46]); }
  const ra = gp(S, u0 + .08, v1 - .06, 40), rb = gp(S, u1 - .08, v1 - .06, 8);
  g.strokeStyle = css([60, 64, 66]); g.lineWidth = 3.6; g.beginPath(); g.moveTo(ra[0], ra[1]); g.lineTo(rb[0], rb[1]); g.stroke(); g.strokeStyle = css([255, 190, 120], .5); g.lineWidth = 1.2; g.beginPath(); g.moveTo(ra[0] + 1, ra[1] - 1.5); g.lineTo(rb[0] + 1, rb[1] - 1.5); g.stroke();
  const rc = gp(S, u0 + .08, v1 - .06, 20), rd = gp(S, u1 - .08, v1 - .06, -12); g.strokeStyle = css([50, 54, 56], .9); g.lineWidth = 2; g.beginPath(); g.moveTo(rc[0], rc[1]); g.lineTo(rd[0], rd[1]); g.stroke();
  const wg = gp(S, u1, (v0 + v1) / 2, -30); S.lights.push({ x: wg[0], y: wg[1], r: 90, col: [255, 120, 50], a: .22, fl: .12, ph: r() * 6, kind: 'fire' });
};
FLAT.door = function (g, S, p, I) {   // cellar door/hatch standing at the foot of the stairs
  const { r, v, u0, v0, u1, v1 } = I, c = gp(S, (u0 + u1) / 2, (v0 + v1) / 2, 0);
  paintPoly(g, [[c[0] - 18, c[1]], [c[0] - 18, c[1] - 44], [c[0] + 18, c[1] - 62], [c[0] + 18, c[1] - 18]], [84, 70, 60], r, { n: 20, ink: true, ang: -.4 });
  paintPoly(g, [[c[0] - 13, c[1] - 4], [c[0] - 13, c[1] - 38], [c[0] + 13, c[1] - 52], [c[0] + 13, c[1] - 18]], [60, 50, 44], r, { n: 10, ink: true, ang: -.4 });
  g.fillStyle = css([255, 150, 60], .35); g.beginPath(); g.moveTo(c[0] - 13, c[1] - 4); g.lineTo(c[0] - 13, c[1] - 38); g.lineTo(c[0] + 13, c[1] - 52); g.lineTo(c[0] + 13, c[1] - 18); g.fill();
};
