
/* ================================================== FREE-STANDING PROPS */
const PROPS = {};         // sprite props:  (g,S,p,I)
const FLAT = {};          // painted straight into the baked floor layer
const PH = { counter: 100, table: 80, bench: 90, stool: 70, plant: 120, pillar: 170, chair: 90, desk: 110, boiler: 210, statue: 240, crate: 80, lamp: 170, loudspeaker: 250, sack: 60, barrel: 90, mic: 100, sofa: 90, cart: 90, tray: 50, tree: 290, bell: 150, hoop: 190, fence: 100, chalkboard: 110, mirror: 130, door: 100, ladder: 100, bookshelf: 130, lockers: 100, vault: 100, pipes: 100, window: 100, banner: 100, curtain: 100, pennant: 100, portrait: 100, notice: 100, radiator: 70 };
const PEX = { tree: 110, plant: 24, statue: 30, loudspeaker: 24, boiler: 40, lamp: 40, hoop: 30, bell: 20 };
const SUPPORT_Z = { counter: 44, table: 34, desk: 40, crate: 32, bench: 22, boiler: 0 };

/* ---- surface clutter (u,v tile coords, z = surface height) ---- */
function prCup(g, S, r, u, v, z, col, o) {   // chipped enamel mug
  o = o || {}; col = C(col || r.p([[226, 222, 206], [96, 130, 160], [200, 90, 70], [120, 150, 110]]));
  const c = cylBody(g, S, r, u, v, o.rad || .075, z, z + (o.h || 9), col, { ink: true, sw: 1.5, inkw: .9, top: false, spec: .5 });
  const q = gp(S, u, v, z + (o.h || 9));
  g.fillStyle = css([30, 20, 16]); g.beginPath(); g.ellipse(q[0], q[1], c.rx - .6, c.ry - .4, 0, 0, 7); g.fill();
  g.fillStyle = css(o.liq || [110, 64, 30], .9); g.beginPath(); g.ellipse(q[0], q[1] + .6, c.rx - 1.4, c.ry - 1, 0, 0, 7); g.fill();
  g.strokeStyle = css(mul(col, 1.1)); g.lineWidth = 1.1; g.beginPath(); g.ellipse(q[0], q[1], c.rx, c.ry, 0, 0, 7); g.stroke();
  g.strokeStyle = css(INK, .8); g.lineWidth = 1.6; g.beginPath(); g.arc(q[0] + c.rx + .6, q[1] + 4, 2.6, -1.4, 1.4); g.stroke(); g.strokeStyle = css(col); g.lineWidth = 1; g.stroke();
  if (r() < .5) { g.fillStyle = css([30, 30, 40], .9); g.fillRect(q[0] - 2 + r() * 3, q[1] + 1.5, 1.6, 1.2); }   // enamel chip
}
function prGlass(g, S, r, u, v, z, h, liq) {    // tumbler with tea / water
  const q0 = gp(S, u, v, z), q1 = gp(S, u, v, z + (h || 8)), w = 3.4;
  if (liq) { g.fillStyle = css(liq, .75); g.fillRect(q0[0] - w + .6, q0[1] - (h || 8) * .6, w * 2 - 1.2, (h || 8) * .6); }
  g.fillStyle = css([200, 220, 220], .22); g.fillRect(q1[0] - w, q1[1], w * 2, q0[1] - q1[1]);
  g.strokeStyle = css([230, 245, 245], .7); g.lineWidth = .8; g.strokeRect(q1[0] - w, q1[1], w * 2, q0[1] - q1[1]);
  g.fillStyle = css([255, 255, 255], .7); g.fillRect(q1[0] + w - 1.6, q1[1] + 1, .8, q0[1] - q1[1] - 2);
  g.strokeStyle = css([230, 245, 245], .6); g.beginPath(); g.ellipse(q1[0], q1[1], w, 1.4, 0, 0, 7); g.stroke();
}
function prBottle(g, S, r, u, v, z, col, h, o) {
  o = o || {}; col = C(col); h = h || 18; const p0 = gp(S, u, v, z), x = p0[0], y = p0[1], w = o.w || 3.2;
  const P = [[x - w, y], [x - w, y - h * .58], [x - w * .4, y - h * .76], [x - w * .38, y - h], [x + w * .38, y - h], [x + w * .4, y - h * .76], [x + w, y - h * .58], [x + w, y]];
  prPoly(g, P, mul(col, .8), .95);
  prShade(g, P, x - w, 0, x + w, 0, [[0, [10, 14, 20], .5], [.55, col, .2], [.75, [255, 255, 230], .5], [1, [10, 14, 20], .4]]);
  if (o.liq !== false) { g.fillStyle = css(mul(col, .5), .6); g.fillRect(x - w, y - h * (o.level || .4), w * 2, h * (o.level || .4)); }
  if (o.label) { g.fillStyle = css(o.label, .95); g.fillRect(x - w, y - h * .45, w * 2, h * .22); g.fillStyle = css([30, 20, 20], .5); g.fillRect(x - w * .6, y - h * .38, w * 1.2, .8); }
  g.fillStyle = css(o.cap || [190, 170, 120]); g.fillRect(x - w * .45, y - h - 1.4, w * .9, 1.8);
  g.fillStyle = css([255, 255, 240], .8); g.fillRect(x + w * .35, y - h * .56, .9, h * .42);
  g.strokeStyle = css(INK, .85); g.lineWidth = .9; pathPoly(g, P); g.stroke();
}
function prSheet(g, S, r, u, v, z, w, h, rot, o) {   // paper lying on a surface (w,h in tile units)
  o = o || {}; g.save(); faceT(g, S, u, v, z); g.rotate(rot || 0);
  const W = w * 64, H = h * 64, pc = o.col || jit([230, 222, 196], r, .04);
  g.fillStyle = css([8, 4, 14], .25); g.fillRect(-W / 2 + 2, -H / 2 + 2, W, H);
  g.fillStyle = css(pc); g.fillRect(-W / 2, -H / 2, W, H);
  g.fillStyle = g.createPattern(prTex('paper'), 'repeat'); g.globalAlpha = .7; g.fillRect(-W / 2, -H / 2, W, H); g.globalAlpha = 1;
  if (o.lines !== false) prTypeLines(g, r, -W / 2 + W * .12, -H / 2 + H * .14, W * .76, Math.max(2, Math.floor(H / 7)), 6, o.ink || [50, 44, 50], .45);
  if (o.head) { g.fillStyle = css(o.head, .8); g.fillRect(-W / 2 + W * .12, -H / 2 + H * .06, W * .5, 3); }
  if (o.stamp) { g.strokeStyle = css([170, 30, 30], .7); g.lineWidth = 2; g.beginPath(); g.arc(W * .2, H * .22, Math.min(W, H) * .16, 0, 7); g.stroke(); }
  g.strokeStyle = css(INK, .5); g.lineWidth = 1.6; g.strokeRect(-W / 2, -H / 2, W, H);
  g.restore();
}
function prRing(g, S, u, v, z, rad, a) {   // coffee / tea ring stain
  g.save(); faceT(g, S, u, v, z); g.strokeStyle = css([70, 40, 18], a || .3); g.lineWidth = 2.2; g.beginPath(); g.arc(0, 0, rad * 64, .3, 5.9); g.stroke(); g.lineWidth = 1; g.beginPath(); g.arc(1, 1, rad * 64 - 1.5, 2, 4); g.stroke(); g.restore();
}
function prBurn(g, S, r, u, v, z) {        // cigarette burn
  g.save(); faceT(g, S, u, v, z); g.rotate(r() * 3); const gr = g.createRadialGradient(0, 0, 0, 0, 0, 9); gr.addColorStop(0, 'rgba(16,8,4,.85)'); gr.addColorStop(.5, 'rgba(60,30,10,.45)'); gr.addColorStop(1, 'rgba(60,30,10,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, 10, 4, 0, 0, 7); g.fill(); g.restore();
}
function prBookFlat(g, S, r, u, v, z, w, d, th, col, rot) {   // closed book lying flat
  const c = C(col || r.p([[120, 36, 34], [44, 76, 66], [76, 64, 104], [150, 118, 86], [38, 52, 58]]));
  fcs(g, S, r, u - w / 2, v - d / 2, u + w / 2, v + d / 2, z, z + th, c, { ink: true, inkw: .9, dens: 30, rim: false, grime: 0, kl: .55 });
  const a = gp(S, u - w / 2 + .02, v + d / 2, z + th * .2), b = gp(S, u + w / 2 - .02, v + d / 2, z + th * .2); prLine(g, a, b, [236, 226, 196], .9, Math.max(1, th * .5));
  const a2 = gp(S, u + w / 2, v + d / 2 - .02, z + th * .2), b2 = gp(S, u + w / 2, v - d / 2 + .02, z + th * .2); prLine(g, a2, b2, [236, 226, 196], .9, Math.max(1, th * .5));
}
function prOpenBook(g, S, r, u, v, z, rot) {
  g.save(); faceT(g, S, u, v, z); g.rotate(rot || 0);
  g.fillStyle = css([8, 4, 14], .25); g.fillRect(-20, -12, 42, 26);
  g.fillStyle = css([90, 40, 34]); g.fillRect(-21, -14, 42, 27);
  for (const sd of [-1, 1]) { g.fillStyle = css([232, 224, 198]); g.beginPath(); g.moveTo(0, -12); g.quadraticCurveTo(sd * 10, -15, sd * 19, -12); g.lineTo(sd * 19, 11); g.quadraticCurveTo(sd * 10, 8, 0, 11); g.fill(); prTypeLines(g, r, sd < 0 ? -17 : 3, -8, 14, 6, 3, [50, 44, 50], .45); }
  g.fillStyle = css([0, 0, 0], .25); g.fillRect(-1.5, -12, 3, 23); g.restore();
}
function prAshtray(g, S, r, u, v, z) {
  const c = cylBody(g, S, r, u, v, .09, z, z + 2.5, [150, 150, 146], { ink: true, sw: 1.2, inkw: .8, top: false });
  const q = gp(S, u, v, z + 2.5); g.fillStyle = css([60, 56, 52]); g.beginPath(); g.ellipse(q[0], q[1], c.rx - 1, c.ry - .6, 0, 0, 7); g.fill();
  for (let i = 0; i < 3; i++) { const a = r() * 6.28; g.strokeStyle = css([236, 226, 200]); g.lineWidth = 1.4; g.beginPath(); g.moveTo(q[0] + Math.cos(a) * 1.5, q[1] + Math.sin(a) * .7); g.lineTo(q[0] + Math.cos(a) * 5.5, q[1] + Math.sin(a) * 2.2); g.stroke(); g.fillStyle = css([200, 130, 60]); g.fillRect(q[0] + Math.cos(a) * 5.5 - .6, q[1] + Math.sin(a) * 2.2 - .6, 1.4, 1.4); }
  g.fillStyle = css([120, 116, 110], .6); g.beginPath(); g.ellipse(q[0] - 1, q[1], 2.4, 1, 0, 0, 7); g.fill();
}
function prBowl(g, S, r, u, v, z, col, food) {
  const q = gp(S, u, v, z), c = C(col || [220, 216, 200]);
  g.fillStyle = css([8, 4, 14], .25); g.beginPath(); g.ellipse(q[0] - 1.5, q[1] + 1, 8, 3.6, 0, 0, 7); g.fill();
  g.fillStyle = css(mul(c, .8)); g.beginPath(); g.moveTo(q[0] - 7.5, q[1] - 3); g.quadraticCurveTo(q[0], q[1] + 6, q[0] + 7.5, q[1] - 3); g.fill();
  g.strokeStyle = css(INK, .8); g.lineWidth = .9; g.stroke();
  g.fillStyle = css(c); g.beginPath(); g.ellipse(q[0], q[1] - 3, 7.5, 3.4, 0, 0, 7); g.fill(); g.stroke();
  g.fillStyle = css(food || [150, 120, 60]); g.beginPath(); g.ellipse(q[0], q[1] - 2.6, 5.6, 2.2, 0, 0, 7); g.fill();
  g.fillStyle = css([255, 240, 200], .35); g.beginPath(); g.ellipse(q[0] + 2, q[1] - 3.4, 2, .7, 0, 0, 7); g.fill();
  g.strokeStyle = css([60, 90, 120], .7); g.lineWidth = .8; g.beginPath(); g.ellipse(q[0], q[1] - 3, 6.6, 2.9, 0, .2, 2.9); g.stroke();
}
function prSpoon(g, S, u, v, z, ang) { const q = gp(S, u, v, z); g.save(); g.translate(q[0], q[1]); g.rotate(ang || .3); g.strokeStyle = css([210, 210, 206]); g.lineWidth = 1.2; g.beginPath(); g.moveTo(-6, 0); g.lineTo(3, 0); g.stroke(); g.fillStyle = css([220, 220, 216]); g.beginPath(); g.ellipse(5, 0, 2.6, 1.4, 0, 0, 7); g.fill(); g.restore(); }
function prBread(g, S, r, u, v, z) {
  const q = gp(S, u, v, z); const P = ellPts(q[0], q[1] - 3, 9, 4.6, 12, -.2, r, .1);
  paintPoly(g, P, [176, 120, 64], r, { n: 6, ink: true, inkw: .9, edge: false, alt: [210, 160, 90] }); prShade(g, P, q[0] - 9, q[1] - 7, q[0] + 9, q[1], [[0, [255, 220, 150], .3], [1, [60, 30, 10], .4]]);
  g.strokeStyle = css([110, 70, 30], .8); g.lineWidth = .9; for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(q[0] + k * 4 - 1.5, q[1] - 5); g.lineTo(q[0] + k * 4 + 1.5, q[1] - 2); g.stroke(); }
}
function prCards(g, S, r, u, v, z) { for (let i = 0; i < 5; i++) { g.save(); faceT(g, S, u + (r() - .5) * .25, v + (r() - .5) * .2, z + .2); g.rotate(r() * 3); g.fillStyle = css([8, 4, 14], .2); g.fillRect(-5, -7, 11, 15); g.fillStyle = css([236, 230, 214]); g.fillRect(-6, -8, 11, 15); g.strokeStyle = css(INK, .5); g.lineWidth = 1; g.strokeRect(-6, -8, 11, 15); g.fillStyle = css(r() < .5 ? [170, 30, 30] : [30, 30, 30]); g.fillRect(-3, -3, 4, 4); g.restore(); } }
/* surface clutter scatter keyed to location: fills a rectangle on a top surface */
function prClutter(g, S, r, u0, v0, u1, v1, z, kind, dens) {
  const area = (u1 - u0) * (v1 - v0), n = Math.max(1, Math.round(area * (dens || 2.2)));
  // stains first, then objects back-to-front
  for (let i = 0; i < Math.ceil(area * 1.2); i++) { const uu = lerp(u0, u1, r()), vv = lerp(v0, v1, r()); if (r() < .6) prRing(g, S, uu, vv, z + .05, r.r(.06, .09), r.r(.15, .32)); else if (kind === 'boiler' || kind === 'office' || kind === 'relay' || r() < .3) prBurn(g, S, r, uu, vv, z + .05); }
  const items = [];
  for (let i = 0; i < n; i++) items.push([lerp(u0 + .1, u1 - .1, (i + r()) / n), lerp(v0 + .1, v1 - .1, r())]);
  items.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
  for (const [uu, vv] of items) {
    const k = r();
    if (kind === 'canteen') {
      if (k < .3) { prBowl(g, S, r, uu, vv, z, null, r.p([[150, 120, 60], [120, 140, 70], [170, 110, 70]])); if (r() < .6) prSpoon(g, S, uu + .1, vv + .08, z + .5, r() * 2); }
      else if (k < .5) prCup(g, S, r, uu, vv, z);
      else if (k < .65) prGlass(g, S, r, uu, vv, z, 8, [160, 90, 40]);
      else if (k < .78) prBread(g, S, r, uu, vv, z);
      else if (k < .88) prSheet(g, S, r, uu, vv, z, .2, .12, r() * 3, { col: [216, 196, 120], head: [160, 30, 30] });   // ration coupon
      else prSpoon(g, S, uu, vv, z + .3, r() * 3);
    } else if (kind === 'boiler') {
      if (k < .25) prCards(g, S, r, uu, vv, z); else if (k < .45) prCup(g, S, r, uu, vv, z, [140, 150, 140]); else if (k < .6) prAshtray(g, S, r, uu, vv, z);
      else if (k < .75) prBottle(g, S, r, uu, vv, z, [60, 100, 60], 16, { label: [200, 190, 150] }); else if (k < .88) prSheet(g, S, r, uu, vv, z, .34, .24, r() * .8 - .4, { col: [200, 190, 160], head: [30, 30, 30] }); else prGlass(g, S, r, uu, vv, z, 7, [200, 160, 80]);
    } else if (kind === 'library' || kind === 'office') {
      if (k < .3) prBookFlat(g, S, r, uu, vv, z, .3, .22, 3 + r() * 2); else if (k < .48) { prBookFlat(g, S, r, uu, vv, z, .32, .24, 3); prBookFlat(g, S, r, uu + .02, vv - .01, z + 3, .28, .2, 2.6); }
      else if (k < .65) prOpenBook(g, S, r, uu, vv, z + .1, r() * .6 - .3); else if (k < .85) prSheet(g, S, r, uu, vv, z, .26, .34, r() * .8 - .4); else prCup(g, S, r, uu, vv, z, [226, 222, 206]);
    } else if (kind === 'dorm') {
      if (k < .3) prCup(g, S, r, uu, vv, z); else if (k < .45) prSheet(g, S, r, uu, vv, z, .28, .2, r() * 2, { lines: true, ink: [40, 50, 110] }); else if (k < .6) prBookFlat(g, S, r, uu, vv, z, .28, .2, 3);
      else if (k < .75) prBread(g, S, r, uu, vv, z); else if (k < .88) prCards(g, S, r, uu, vv, z); else prGlass(g, S, r, uu, vv, z, 7, [180, 110, 50]);
    } else {
      if (k < .4) prCup(g, S, r, uu, vv, z); else if (k < .7) prSheet(g, S, r, uu, vv, z, .26, .2, r() * 2); else prGlass(g, S, r, uu, vv, z, 7, [190, 210, 210]);
    }
  }
}
/* raised panels on a box face. face 'L' (v = vv, along u) or 'R' (u = uu, along v) */
function prPanels(g, S, r, face, a0, a1, k, z0, z1, col, n, o) {
  o = o || {}; col = C(col);
  g.save();
  if (face === 'L') faceL(g, S, a0, k, z1); else faceR(g, S, k, a1, z1);
  const W = (a1 - a0) * 64, H = z1 - z0, m = o.margin || 5, pw = (W - m) / n;
  for (let i = 0; i < n; i++) {
    const x = m + i * pw, w = pw - m;
    paintRect(g, x, m * .8, w, H - m * 1.6, mul(col, o.k || .9), r, { n: 5, sw: 3, ang: 1.57, ink: false, edge: false });
    prBevel(g, x, m * .8, w, H - m * 1.6, [255, 232, 190], [10, 6, 12], 2.2);
    if (o.knob) { g.fillStyle = css([214, 184, 100]); g.fillRect(x + w / 2 - 4, H * .3, 8, 2.6); g.strokeStyle = css(INK, .7); g.lineWidth = 1; g.strokeRect(x + w / 2 - 4, H * .3, 8, 2.6); }
  }
  g.restore();
}

PROPS.counter = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, w = u1 - u0;
  const body = [[78, 104, 90], [150, 150, 140], [112, 120, 122], [180, 176, 166]][v];
  contactShadow(g, S, u0, v0, u1, v1, 1);
  fcs(g, S, r, u0, v0, u1, v1, 0, 6, [34, 30, 28], { ink: true, grime: .6, rim: false });   // kick plinth
  fcs(g, S, r, u0 + .02, v0 + .02, u1 - .02, v1 - .02, 6, 40, body, { vert: true, mat: 'wood', wear: .5, under: [150, 120, 80], alt: mul(body, 1.3) });
  prPanels(g, S, r, 'L', u0 + .02, u1 - .02, v1 - .02, 8, 38, body, Math.round(w * 1.4));
  prPanels(g, S, r, 'R', v0 + .02, v1 - .02, u1 - .02, 8, 38, body, Math.max(1, Math.round((v1 - v0) * 1.2)));
  // scuffs from boots along the bottom of the front
  { const a = gp(S, u0 + .1, v1, 9), b = gp(S, u1 - .1, v1, 9); for (let i = 0; i < w * 5; i++) { const t = r(), x = lerp(a[0], b[0], t), y = lerp(a[1], b[1], t); g.fillStyle = css([20, 16, 14], .25 + r() * .2); g.fillRect(x, y - r() * 5, r.r(3, 9), 1.2); } }
  // dented zinc top with a rolled edge
  const e = .06, top = [[150, 156, 152], [120, 84, 52], [176, 180, 180], [214, 210, 200]][v];
  fcs(g, S, r, u0 - e, v0 - e, u1 + e, v1 + e, 40, 45, top, { topAng: .46, alt: [210, 220, 220], dens: 24, kt: 1.12, mat: v === 1 ? 'wood' : 'metal', rim: true });
  const zt = [gp(S, u0 - e, v0 - e, 45), gp(S, u1 + e, v0 - e, 45), gp(S, u1 + e, v1 + e, 45), gp(S, u0 - e, v1 + e, 45)];
  for (let i = 0; i < w * 3; i++) { const q = gp(S, lerp(u0, u1, r()), lerp(v0, v1, r()), 45); g.strokeStyle = css([255, 255, 250], .25); g.lineWidth = 1; g.beginPath(); g.ellipse(q[0], q[1], 4 + r() * 4, 2 + r() * 1.5, 0, 3.4, 5.6); g.stroke(); g.strokeStyle = css([20, 24, 30], .25); g.beginPath(); g.ellipse(q[0], q[1] + .8, 4 + r() * 4, 2 + r() * 1.5, 0, .3, 2.8); g.stroke(); }
  prRing(g, S, u0 + w * .3, v0 + .6, 45.1, .08); prRing(g, S, u0 + w * .62, v1 - .5, 45.1, .07);
  // glass sneeze-guard along the back edge
  const gt = v === 0 ? 76 : v === 2 ? 66 : 0;
  if (gt) {
    const pa = gp(S, u0 + .1, v0 + .14, 45), pb = gp(S, u1 - .1, v0 + .14, 45), pc = gp(S, u1 - .1, v0 + .14, gt), pd = gp(S, u0 + .1, v0 + .14, gt);
    g.save(); g.globalAlpha = .38; prPoly(g, [pa, pb, pc, pd], v === 0 ? [120, 200, 170] : [190, 220, 220]); g.restore();
    prShade(g, [pa, pb, pc, pd], pd[0], pd[1], pa[0], pa[1], [[0, [255, 255, 240], .22], [.5, [255, 255, 255], 0], [1, [40, 90, 80], .2]]);
    for (let k = 0; k < Math.round(w * 1.2); k++) { const t = (k + r() * .5) / Math.round(w * 1.2); g.strokeStyle = css([230, 255, 240], .35); g.lineWidth = 1.6; g.beginPath(); g.moveTo(lerp(pd[0], pc[0], t), lerp(pd[1], pc[1], t) + 4); g.lineTo(lerp(pd[0], pc[0], t) + 7, lerp(pd[1], pc[1], t) + 22); g.stroke(); }
    rimStroke(g, [pa, pd, pc, pb], [30, 40, 36], .85, 1.8); rimStroke(g, [pd, pc], [255, 240, 200], .5, 1);
    for (const t of [0, .5, 1]) { const q0 = gp(S, lerp(u0 + .1, u1 - .1, t), v0 + .14, 45), q1 = gp(S, lerp(u0 + .1, u1 - .1, t), v0 + .14, gt); prLine(g, q0, q1, [60, 64, 66], .95, 2.2); }
  }
  // serving line: soup kettle (steaming), stacks of bowls, bread board, tea urn, a few bottles, cups
  const pot = u0 + w * (v === 2 ? .7 : .22), pv = (v0 + v1) / 2 - .05;
  const kc = cylBody(g, S, r, pot, pv, .36, 45, 63, [156, 160, 158], { ink: true, mat: 'metal', alt: [200, 206, 206] });
  g.strokeStyle = css(INK, .8); g.lineWidth = 2; g.beginPath(); g.ellipse(kc.cx, kc.cy - 2, kc.rx * .5, 4, 0, Math.PI, 0); g.stroke();
  g.fillStyle = css([170, 120, 60]); g.beginPath(); g.ellipse(kc.cx, kc.cy + .5, kc.rx - 2.5, kc.ry - 1.6, 0, 0, 7); g.fill();
  { const lq = gp(S, pot + .26, pv - .1, 63); g.strokeStyle = css([190, 190, 186]); g.lineWidth = 1.6; g.beginPath(); g.moveTo(lq[0] - 6, lq[1] + 2); g.lineTo(lq[0] + 4, lq[1] - 14); g.stroke(); }
  S.steam.push({ x: kc.cx, y: kc.cy - 6 });
  for (let s2 = 0; s2 < 2; s2++) { const bu = u0 + w * (.36 + s2 * .05), bv = v0 + .5; for (let k = 0; k < 5; k++) prBowl(g, S, r, bu, bv, 45 + k * 2.2, [220, 216, 200], [220, 216, 200]); }
  { const bu = u0 + w * .5, bv = (v0 + v1) / 2; fcs(g, S, r, bu - .28, bv - .2, bu + .28, bv + .2, 45, 47, [150, 104, 60], { mat: 'wood', ink: true, inkw: .9, rim: false, grime: 0 }); prBread(g, S, r, bu - .08, bv, 47); prBread(g, S, r, bu + .14, bv + .06, 47); }
  { const tu = u0 + w * .86, tv = v0 + .55; const tc = cylBody(g, S, r, tu, tv, .2, 45, 70, [176, 140, 70], { ink: true, mat: 'metal', alt: [230, 200, 120], spec: .55 }); cylBody(g, S, r, tu, tv, .08, 70, 76, [150, 120, 60], { ink: true }); const tp = gp(S, tu + .12, tv + .16, 52); g.fillStyle = css([60, 50, 30]); g.fillRect(tp[0] - 1, tp[1] - 1, 6, 2.4); g.fillStyle = css([40, 30, 20]); g.beginPath(); g.arc(tc.cx, tc.cy - 10, 2, 0, 7); g.fill(); }
  const nb = Math.max(2, Math.round(w * .5));
  for (let i = 0; i < nb; i++) prBottle(g, S, r, u0 + w * (.6 + i * .04), v0 + .32, 45, r.p([[220, 230, 220], [60, 120, 80], [150, 100, 50]]), r.r(15, 19), { label: r() < .6 ? [230, 220, 190] : null, level: r.r(.2, .8) });
  for (let i = 0; i < Math.round(w * .6); i++) { const uu = u0 + .4 + r() * (w - .8), vv = v1 - .3 - r() * .3; if (Math.abs(uu - pot) < .5) continue; r() < .6 ? prCup(g, S, r, uu, vv, 45) : prGlass(g, S, r, uu, vv, 45, 8, [160, 90, 40]); }
  // a cash tin and a spike of ration coupons near the end
  { const cu = u1 - .45, cv = v1 - .5; fcs(g, S, r, cu - .14, cv - .1, cu + .14, cv + .1, 45, 50, [60, 90, 70], { ink: true, inkw: .9, rim: true, grime: 0, mat: 'metal' }); const sp = gp(S, cu - .3, cv + .1, 45); prLine(g, sp, [sp[0], sp[1] - 12], [60, 60, 62], 1, 1); for (let k = 0; k < 4; k++) { g.fillStyle = css(jit([216, 196, 120], r, .08)); g.fillRect(sp[0] - 4 + (r() - .5) * 2, sp[1] - 3 - k * 2, 8, 1.6); } }
  if (v === 2) { const q = gp(S, u0 + w * .7, (v0 + v1) / 2, 45); S.steam.push({ x: q[0], y: q[1] - 66 }); }
};
PROPS.table = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, loc = S.loc.id;
  contactShadow(g, S, u0, v0, u1, v1, .8);
  const wood = [[142, 100, 62], [100, 120, 98], [150, 150, 146], [196, 186, 160]][v];
  const legC = mul(wood, .62), inset = .08;
  if (v !== 3) {
    for (const [uu, vv] of [[u0 + inset, v0 + inset], [u1 - inset, v0 + inset], [u1 - inset, v1 - inset], [u0 + inset, v1 - inset]]) fcs(g, S, r, uu - .04, vv - .04, uu + .04, vv + .04, 0, 31, legC, { ink: true, inkw: 1, rim: true, grime: 0, mat: 'wood', vert: true });
    // stretcher rail along the long side
    const a = gp(S, u0 + inset, v1 - inset, 8), b = gp(S, u1 - inset, v1 - inset, 8); prLine(g, a, b, INK, .8, 3.4); prLine(g, a, b, legC, 1, 2.2);
    fcs(g, S, r, u0 + .05, v0 + .05, u1 - .05, v1 - .05, 26, 31, mul(wood, .8), { ink: true, inkw: 1, rim: false, mat: 'wood', grime: .3 });   // apron
  } else fcs(g, S, r, u0 + .06, v0 + .06, u1 - .06, v1 - .06, 3, 31, wood, { vert: true, alt: [230, 220, 190], mat: 'wood' });
  const oil = v === 1 && (loc === 'canteen' || loc === 'dorm');
  fcs(g, S, r, u0, v0, u1, v1, 31, 35, oil ? [150, 60, 50] : wood, { alt: oil ? [220, 210, 190] : [200, 160, 100], dens: 26, mat: oil ? 'fabric' : 'wood', wear: .4 });
  if (oil) {   // checked oilcloth over the top
    g.save(); faceT(g, S, u0, v0, 35); g.beginPath(); g.rect(0, 0, (u1 - u0) * 64, (v1 - v0) * 64); g.clip(); g.fillStyle = css([236, 226, 200], .55); for (let x = 0; x < (u1 - u0) * 64; x += 16) for (let y = 0; y < (v1 - v0) * 64; y += 16) if (((x + y) / 16) % 2 === 0) g.fillRect(x, y, 8, 8); else g.fillRect(x + 8, y + 8, 8, 8); g.restore();
    const a = gp(S, u0, v1, 35), b = gp(S, u1, v1, 35); prLine(g, [a[0], a[1] + 2], [b[0], b[1] + 2], [150, 60, 50], .9, 4); // hanging edge
  }
  prClutter(g, S, r, u0 + .1, v0 + .12, u1 - .1, v1 - .12, 35, loc, loc === 'canteen' ? 2.6 : 2);
  if (loc === 'library') { const lu = u0 + (u1 - u0) * (v ? .25 : .75), lv = (v0 + v1) / 2; prReadingLamp(g, S, r, lu, lv, 35); }
};
function prReadingLamp(g, S, r, u, v, z) {   // green banker's lamp
  fcs(g, S, r, u - .12, v - .08, u + .12, v + .08, z, z + 3, [150, 120, 60], { ink: true, inkw: .9, rim: true, grime: 0, mat: 'metal' });
  vbar(g, S, r, u, v, z + 3, z + 16, 2, [176, 140, 70]);
  const q = gp(S, u, v, z + 16), P = [[q[0] - 12, q[1] + 2], [q[0] - 9, q[1] - 5], [q[0] + 9, q[1] - 5], [q[0] + 12, q[1] + 2]];
  prPoly(g, P, [40, 110, 76]); prShade(g, P, 0, q[1] - 5, 0, q[1] + 2, [[0, [180, 255, 200], .45], [1, [10, 30, 20], .4]]); g.strokeStyle = css(INK, .85); g.lineWidth = 1; pathPoly(g, P); g.stroke();
  g.fillStyle = css([255, 236, 170], .95); g.beginPath(); g.ellipse(q[0], q[1] + 2.2, 10, 1.6, 0, 0, 7); g.fill();
  prLight(S, q[0], q[1] + 6, 90, [255, 220, 140], .34, .03, 'lamp', 'desklamp', z + 16, u, v);
}
PROPS.bench = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, loc = S.loc.id, park = loc === 'courtyard', pew = loc === 'theatre';
  const wood = park ? [130, 92, 56] : [[150, 108, 66], [168, 130, 82], [96, 78, 56], [150, 50, 46]][v];
  contactShadow(g, S, u0, v0, u1, v1, .8);
  const iron = [40, 42, 46], nl = Math.max(2, Math.round((u1 - u0) / 1.4));
  const legs = (vv, zt, c) => { for (let i = 0; i <= nl; i++) { const uu = u0 + .14 + i * (u1 - u0 - .28) / nl; if (park || v === 2) vbar(g, S, r, uu, vv, 0, zt, 3, iron); else fcs(g, S, r, uu - .04, vv - .04, uu + .04, vv + .04, 0, zt, c, { ink: true, inkw: .9, grime: 0, mat: 'wood', vert: true }); } };
  const back = park || pew || v === 2 || v === 3;
  if (back) {   // backrest on the far side: two rails on posts
    for (let i = 0; i <= nl; i++) { const uu = u0 + .14 + i * (u1 - u0 - .28) / nl; vbar(g, S, r, uu, v0 + .12, 18, 50, park ? 3 : 3.6, park ? iron : mul(wood, .7)); }
    for (const z of park ? [30, 42] : [36]) fcs(g, S, r, u0 + .02, v0 + .08, u1 - .02, v0 + .15, z, z + (park ? 7 : 12), wood, { vert: false, mat: 'wood', wear: .3, ink: true, inkw: 1.1, grime: .3 });
    if (pew) { const q = gp(S, u0 + .4, v0 + .15, 44); prPlate(g, r, q[0] - 6, q[1] - 3, 12, 5, String(((p.y | 0) >> 1) + 1), [214, 184, 100], [40, 26, 10]); }
  }
  legs(v0 + .2, 20, mul(wood, .6)); legs(v1 - .2, 20, mul(wood, .6));
  // slatted seat
  const zs = v === 1 && !park ? 24 : 21, ns = park ? 4 : 3, dv = (v1 - v0 - .12) / ns;
  for (let k = 0; k < ns; k++) fcs(g, S, r, u0, v0 + .06 + k * dv + .015, u1, v0 + .06 + (k + 1) * dv - .015, zs - 3, zs, jit(wood, r, .06), { mat: 'wood', dens: 24, wear: .35, ink: true, inkw: 1, grime: .25, kt: 1.15 });
  // carved initials, a forgotten item
  if (r() < .6) { const q = gp(S, lerp(u0, u1, r.r(.2, .8)), v1 - .2, zs); g.strokeStyle = css([40, 20, 10], .55); g.lineWidth = .8; g.beginPath(); g.moveTo(q[0] - 3, q[1]); g.lineTo(q[0] - 1, q[1] - 3); g.lineTo(q[0] + 1, q[1]); g.moveTo(q[0] + 3, q[1] - 2); g.lineTo(q[0] + 6, q[1] - 1); g.stroke(); }
  const kf = r();
  if (kf < .3) prSheet(g, S, r, lerp(u0, u1, r.r(.2, .8)), (v0 + v1) / 2, zs, .3, .2, r(), { col: [220, 210, 180], head: [160, 30, 30] });
  else if (kf < .45 && loc === 'gym') { const q = gp(S, lerp(u0, u1, .7), (v0 + v1) / 2, zs); paintPoly(g, [[q[0] - 10, q[1] - 2], [q[0] + 8, q[1] - 6], [q[0] + 12, q[1] - 1], [q[0] - 6, q[1] + 3]], [226, 222, 210], r, { n: 4, ink: true, inkw: .8 }); }   // towel
  else if (kf < .55) prCup(g, S, r, lerp(u0, u1, .8), (v0 + v1) / 2, zs);
};
PROPS.stool = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  contactShadow(g, S, cu - .3, cv - .3, cu + .3, cv + .3, .9);
  cylBody(g, S, r, cu, cv, .26, 0, 2.5, [64, 66, 70], { ink: true, sw: 2, mat: 'metal' });
  vbar(g, S, r, cu, cv, 2, 22, 4, [176, 182, 182]);
  const fr = gp(S, cu, cv, 9); g.strokeStyle = css(INK, .8); g.lineWidth = 2.6; g.beginPath(); g.ellipse(fr[0], fr[1], ecx(.2), ecy(.2), 0, 0, 7); g.stroke(); g.strokeStyle = css([190, 196, 196]); g.lineWidth = 1.4; g.stroke();
  g.strokeStyle = css([255, 255, 255], .5); g.lineWidth = .8; g.beginPath(); g.ellipse(fr[0], fr[1] - .6, ecx(.2), ecy(.2), 0, 3.6, 5.6); g.stroke();
  const seat = v === 1 ? [140, 104, 66] : [160, 34, 38];
  cylBody(g, S, r, cu, cv, .3, 20, 23, [190, 194, 194], { ink: true, sw: 2, top: false, mat: 'metal' });
  const c = cylBody(g, S, r, cu, cv, .29, 23, 29, seat, { ink: true, sw: 3, alt: v === 1 ? [190, 150, 100] : [230, 90, 80], topCol: mul(seat, 1.2), spec: .5 });
  // cracked vinyl patched with tape, button tufting
  if (v !== 1) { const q = gp(S, cu + .05, cv - .05, 29); g.strokeStyle = css([40, 10, 10], .7); g.lineWidth = .9; g.beginPath(); g.moveTo(q[0] - 6, q[1]); g.lineTo(q[0] - 2, q[1] + 1); g.lineTo(q[0] + 1, q[1] - 1); g.lineTo(q[0] + 5, q[1] + 1.4); g.stroke(); if (r() < .6) { g.save(); faceT(g, S, cu - .08, cv + .04, 29.1); g.rotate(.6); g.fillStyle = css([200, 190, 160], .85); g.fillRect(-8, -3, 16, 6); g.restore(); } }
  g.fillStyle = css([255, 240, 220], .35); g.beginPath(); g.ellipse(c.cx + 6, c.cy - 1.5, 5, 1.6, -.3, 0, 7); g.fill();
};
PROPS.chair = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, near = (p.y | 0) > 3 && v % 2 === 1;
  const wood = [[134, 90, 56], [112, 78, 50], [100, 44, 38], [110, 114, 116]][v], metal = v === 3;
  contactShadow(g, S, cu - .3, cv - .3, cu + .3, cv + .3, .8);
  const a = .26, backV = near ? cv + a : cv - a;
  const leg = (uu, vv, z1) => metal ? vbar(g, S, r, uu, vv, 0, z1, 2.4, [60, 62, 66]) : fcs(g, S, r, uu - .035, vv - .035, uu + .035, vv + .035, 0, z1, mul(wood, .7), { ink: true, inkw: .9, grime: 0, mat: 'wood', vert: true, rim: true });
  const backrest = () => {
    for (const du of [-.22, .22]) leg(cu + du, backV, 54);
    fcs(g, S, r, cu - .26, backV - .035, cu + .26, backV + .035, 40, 54, wood, { vert: false, mat: 'wood', wear: .4, ink: true, inkw: 1, grime: .2 });
    if (v !== 3) for (const du of [-.08, .08]) fcs(g, S, r, cu + du - .025, backV - .02, cu + du + .025, backV + .02, 23, 40, mul(wood, .9), { ink: true, inkw: .7, grime: 0, rim: false });
  };
  if (!near) backrest();
  for (const [du, dv] of [[.24, -.24], [-.24, -.24], [.24, .24], [-.24, .24]]) if (!(Math.abs(cv + dv - backV) < .05)) leg(cu + du, cv + dv, 20);
  fcs(g, S, r, cu - .29, cv - .29, cu + .29, cv + .29, 19, v === 2 ? 25 : 23, wood, { alt: [200, 150, 100], dens: 22, mat: 'wood', wear: .5, ink: true, inkw: 1.1 });
  if (v === 2) { const q = [gp(S, cu - .24, cv - .24, 25.2), gp(S, cu + .24, cv - .24, 25.2), gp(S, cu + .24, cv + .24, 25.2), gp(S, cu - .24, cv + .24, 25.2)]; paintPoly(g, q, [130, 40, 36], r, { n: 6, ink: true, inkw: .8, edge: false }); prTexFill(g, q, 'weave', .9); }
  if (near) backrest();
};
PROPS.plant = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  contactShadow(g, S, cu - .35, cv - .35, cu + .35, cv + .35, 1);
  // terracotta pot: tapered, rolled rim, chips and white mineral bloom
  const pc = cylBody(g, S, r, cu, cv, .3, 0, 21, [170, 92, 58], { ink: true, alt: [210, 130, 86], sw: 3, top: false });
  { const b = gp(S, cu, cv, 0); g.fillStyle = css([230, 226, 210], .18); g.beginPath(); g.ellipse(b[0], b[1] - 8, pc.rx, 6, 0, 0, Math.PI); g.fill(); for (let i = 0; i < 4; i++) { const a = r() * Math.PI; g.fillStyle = css([110, 60, 40], .8); g.fillRect(b[0] + Math.cos(a) * pc.rx * .9, b[1] - 4 - r() * 14 + Math.sin(a) * 3, 2.4, 1.6); } }
  const rim = cylBody(g, S, r, cu, cv, .36, 21, 26, [186, 104, 66], { ink: true, sw: 2, top: false });
  const top = gp(S, cu, cv, 26); g.fillStyle = css([40, 28, 22]); g.beginPath(); g.ellipse(top[0], top[1], rim.rx - 2, rim.ry - 1.4, 0, 0, 7); g.fill();
  g.fillStyle = css([90, 70, 50], .7); for (let i = 0; i < 6; i++) g.fillRect(top[0] + (r() - .5) * 18, top[1] + (r() - .5) * 6, 1.6, 1.2);
  if (r() < .6) { g.fillStyle = css([236, 226, 200]); g.fillRect(top[0] + 4, top[1] - 1, 4, 1.4); g.fillStyle = css([200, 120, 60]); g.fillRect(top[0] + 7, top[1] - 1, 1.4, 1.4); }   // cigarette end in the soil
  const greens = v === 3 ? [[120, 100, 56], [150, 120, 70], [90, 76, 48]] : [[46, 108, 66], [70, 136, 76], [30, 80, 60], [104, 150, 78]];
  const nl = v === 2 ? 22 : v === 1 ? 14 : 15;
  const leaves = [];
  for (let i = 0; i < nl; i++) {
    const a = (i / nl) * Math.PI * 2 + r() * .4, rr = (v === 1 ? 4 : 12) + r() * 14, h = v === 1 ? 52 + r() * 44 : 26 + r() * 40;
    leaves.push({ a, rr, h, d: Math.sin(a) });
  }
  leaves.sort((x, y) => x.d - y.d);   // back leaves first
  for (const L of leaves) {
    const bx = top[0], by = top[1] - 1, droop = v === 2 ? L.h * .55 : v === 3 ? L.h * .4 : 0;
    const tx = bx + Math.cos(L.a) * L.rr * (v === 2 ? 1.7 : 1.1), ty = by - L.h + Math.sin(L.a) * L.rr * .3 + droop;
    const c = jit(r.p(greens), r, .1), lw_ = v === 1 ? 3.6 : 6.5;
    const dx = tx - bx, dy = ty - by, len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len, bend = (r() - .5) * 8;
    const P = [[bx, by], [bx + dx * .45 + nx * lw_ + bend, by + dy * .45 + ny * lw_], [tx, ty], [bx + dx * .45 - nx * lw_ * .7 + bend, by + dy * .45 - ny * lw_ * .7]];
    paintPoly(g, P, mul(c, .6 + .5 * (L.d + 1) / 2), r, { n: 4, sw: 2, ang: Math.atan2(dy, dx), ink: false, edge: false });
    const lit = Math.cos(L.a + .9) > 0;   // leaves facing the key light catch it
    prShade(g, P, bx + nx * lw_, by + ny * lw_, bx - nx * lw_, by - ny * lw_, [[0, lit ? [255, 220, 150] : [20, 40, 50], lit ? .35 : .3], [1, [10, 20, 20], .3]]);
    if (v === 0) { g.strokeStyle = css([200, 190, 110], .4); g.lineWidth = 1.4; g.beginPath(); g.moveTo(P[1][0], P[1][1]); g.lineTo(tx, ty); g.stroke(); }   // snake-plant yellow margins
    g.strokeStyle = css(mul(c, .5), .8); g.lineWidth = .8; g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(bx + dx * .5 + bend, by + dy * .5, tx, ty); g.stroke();
    ink(g, P, r, .9, null, .6);
    if (v === 3 && r() < .4) { g.fillStyle = css([90, 70, 40], .8); g.fillRect(bx + (r() - .5) * 30, top[1] + 30 + r() * 6, 3, 1.4); }
  }
};
PROPS.pillar = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, h = 150;
  contactShadow(g, S, cu - .4, cv - .4, cu + .4, cv + .4, 1);
  const c = v === 1 ? [146, 76, 56] : v === 2 ? [70, 76, 80] : [196, 182, 146];
  fcs(g, S, r, cu - .42, cv - .42, cu + .42, cv + .42, 0, 14, mul(c, .78), { mat: 'stone', wear: .6, under: [80, 70, 60] });
  fcs(g, S, r, cu - .3, cv - .3, cu + .3, cv + .3, 14, h - 14, c, { vert: true, alt: v === 1 ? [210, 120, 70] : [230, 214, 170], nk: 1.2, mat: v === 1 ? null : 'stone', wear: .4, under: [150, 70, 50] });
  const L = (t, z) => gp(S, lerp(cu - .3, cu + .3, t), cv + .3, z), R = (t, z) => gp(S, cu + .3, lerp(cv + .3, cv - .3, t), z);
  if (v === 1) {   // brick courses
    for (let z = 18; z < h - 16; z += 7) { prLine(g, L(0, z), L(1, z), [60, 30, 24], .5, 1); prLine(g, R(0, z), R(1, z), [60, 30, 24], .4, 1); const off = ((z / 7) | 0) % 2 ? .5 : .25; for (let t = off; t < 1; t += .5) { prLine(g, L(t, z), L(t, z + 7), [60, 30, 24], .4, .9); prLine(g, R(t, z), R(t, z + 7), [60, 30, 24], .35, .9); } }
  }
  if (v === 0) {   // green-painted dado band + a pasted bulletin
    const P1 = [L(0, 70), L(1, 70), R(1, 70), R(1, 14), L(1, 14), L(0, 14)];
    g.save(); g.globalAlpha = .72; prPoly(g, [L(0, 70), L(1, 70), L(1, 14), L(0, 14)], [56, 104, 80]); prPoly(g, [R(0, 70), R(1, 70), R(1, 14), R(0, 14)], [76, 128, 96]); g.restore();
    prLine(g, L(0, 70), L(1, 70), [30, 50, 40], .9, 1.6); prLine(g, R(0, 70), R(1, 70), [30, 50, 40], .9, 1.6);
    prChips(g, r, L(0, 66), L(1, 66), 5, [196, 182, 146], 2); prChips(g, r, R(0, 40), R(1, 40), 3, [196, 182, 146], 2);
    g.save(); faceL(g, S, cu - .3, cv + .3, 120); const rr = RNG(S.seed + 41); prPic(g, 6, 2, 26, 38, 'pil' + (S.seed & 7), (cg, W, H) => prPoster(cg, W, H, rr, 'pupil', { text: 'STUDY FOR THE UNION' }), 1.1); g.strokeStyle = css([20, 12, 10], .5); g.lineWidth = 1; g.strokeRect(6, 2, 26, 38); g.restore();
  }
  // soot / damp / hand-grime at shoulder height
  prTexFill(g, [L(0, h - 14), L(1, h - 14), R(1, h - 14), R(1, 14), L(1, 14), L(0, 14)], 'streak', .8, (k) => { faceL(k, S, cu - .3, cv + .3, h - 14); });
  { const q = L(.6, 60); g.fillStyle = css([30, 20, 16], .12); g.beginPath(); g.ellipse(q[0], q[1], 8, 16, 0, 0, 7); g.fill(); }
  // capital: stepped moulding
  fcs(g, S, r, cu - .36, cv - .36, cu + .36, cv + .36, h - 14, h - 8, mul(c, .95), { mat: 'stone', wear: .3 });
  fcs(g, S, r, cu - .44, cv - .44, cu + .44, cv + .44, h - 8, h, mul(c, 1.05), { mat: 'stone', wear: .5, under: [90, 80, 70] });
  // a long crack
  { let q = L(.3, h - 20); g.strokeStyle = css([30, 24, 20], .6); g.lineWidth = 1; g.beginPath(); g.moveTo(q[0], q[1]); for (let k = 0; k < 6; k++) { q = [q[0] + (r() - .5) * 6, q[1] + 8 + r() * 8]; g.lineTo(q[0], q[1]); } g.stroke(); }
};
PROPS.desk = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, wood = [[96, 56, 36], [150, 112, 70], [90, 98, 98], [130, 84, 52]][v], W = u1 - u0;
  contactShadow(g, S, u0, v0, u1, v1, 1);
  const pedW = Math.min(1, W * .4);
  const ped = (a, b) => {
    fcs(g, S, r, a, v0 + .1, b, v1 - .1, 0, 33, wood, { vert: true, mat: 'wood', wear: .3 });
    for (let k = 0; k < 3; k++) {   // drawers with brass pulls on the front face
      const z0 = 4 + k * 10;
      const P = [gp(S, a + .05, v1 - .1, z0 + 8.5), gp(S, b - .05, v1 - .1, z0 + 8.5), gp(S, b - .05, v1 - .1, z0), gp(S, a + .05, v1 - .1, z0)];
      paintPoly(g, P, mul(wood, .85), r, { n: 4, ink: true, inkw: .9, ang: .46, edge: false }); prLine(g, P[0], P[1], [255, 220, 170], .3, 1);
      const m = gp(S, (a + b) / 2, v1 - .1, z0 + 4.6); g.fillStyle = css([214, 184, 100]); g.beginPath(); g.ellipse(m[0], m[1], 3.4, 1.8, .46, 0, 7); g.fill(); g.strokeStyle = css(INK, .8); g.lineWidth = .8; g.stroke(); g.fillStyle = css([255, 240, 200], .7); g.fillRect(m[0] + .5, m[1] - 1, 1.2, .8);
      if (k === 0) { const kh = gp(S, (a + b) / 2, v1 - .1, z0 + 7.4); g.fillStyle = css([30, 24, 16]); g.fillRect(kh[0] - .6, kh[1] - .6, 1.2, 1.8); }
    }
  };
  if (W >= 2.5) { ped(u0 + .1, u0 + .1 + pedW); ped(u1 - .1 - pedW, u1 - .1); fcs(g, S, r, u0 + .1 + pedW, v0 + .2, u1 - .1 - pedW, v1 - .5, 4, 30, mul(wood, .55), { vert: true, ink: false, grime: .5, rim: false }); }
  else { ped(u1 - .1 - pedW, u1 - .1); for (const [uu, vv] of [[u0 + .1, v0 + .12], [u0 + .1, v1 - .12]]) fcs(g, S, r, uu - .04, vv - .04, uu + .04, vv + .04, 0, 33, mul(wood, .8), { ink: true, inkw: .9, grime: 0, mat: 'wood', vert: true }); }
  fcs(g, S, r, u0, v0, u1, v1, 33, 38, wood, { alt: [190, 140, 90], mat: 'wood', wear: .5, under: [200, 160, 110] });
  // tooled leather inlay with a gilt border
  const ins = [gp(S, u0 + .22, v0 + .18, 38.2), gp(S, u1 - .22, v0 + .18, 38.2), gp(S, u1 - .22, v1 - .18, 38.2), gp(S, u0 + .22, v1 - .18, 38.2)];
  paintPoly(g, ins, v === 2 ? [70, 90, 100] : [38, 78, 58], r, { n: 30, ang: .46, ink: true, inkw: 1, alt: [70, 120, 84], edge: false });
  prTexFill(g, ins, 'grime', .9, (k) => faceT(k, S, u0, v0, 38.2)); prTexFill(g, ins, 'scratch', .7, (k) => faceT(k, S, u0, v0, 38.2));
  rimStroke(g, ins.concat([ins[0]]), [220, 190, 100], .55, 1);
  const Z = 38.4, cvm = (v0 + v1) / 2;
  if (W >= 2.5) {   // the principal's desk: blotter, inkstand, files, rubber stamps, telephone, lamp, ashtray, nameplate
    prSheet(g, S, r, u0 + W * .45, cvm + .05, Z, .8, .55, 0, { col: [190, 176, 140], lines: false });
    prSheet(g, S, r, u0 + W * .45, cvm + .05, Z + .2, .44, .32, .08, { head: [30, 30, 30], stamp: true });
    for (let k = 0; k < 4; k++) prSheet(g, S, r, u0 + .75, v0 + .55 + (r() - .5) * .05, Z + k * 1.1, .42, .32, (r() - .5) * .2, { col: k === 3 ? [200, 170, 110] : null, lines: k === 3 ? false : true });   // files
    { const q = gp(S, u0 + .75, v0 + .55, Z + 4.6); g.strokeStyle = css([170, 30, 30], .9); g.lineWidth = 1.4; g.beginPath(); g.moveTo(q[0] - 11, q[1] - 1); g.lineTo(q[0] + 11, q[1] + 1); g.stroke(); }
    // inkstand
    fcs(g, S, r, u0 + W * .62 - .2, v0 + .32, u0 + W * .62 + .2, v0 + .5, Z, Z + 3, [70, 50, 34], { ink: true, inkw: .8, mat: 'wood', grime: 0, rim: true });
    for (const du of [-.1, .1]) { cylBody(g, S, r, u0 + W * .62 + du, v0 + .41, .06, Z + 3, Z + 8, [40, 50, 70], { ink: true, inkw: .7, spec: .6 }); }
    { const q = gp(S, u0 + W * .62 + .12, v0 + .41, Z + 8); prLine(g, q, [q[0] + 6, q[1] - 10], [30, 30, 30], .9, 1.2); }
    // rubber stamps + red pad
    { const su = u0 + W * .3, sv = v1 - .5; fcs(g, S, r, su - .14, sv - .1, su + .14, sv + .1, Z, Z + 2, [60, 60, 64], { ink: true, inkw: .7, rim: false, grime: 0 }); const q = gp(S, su, sv, Z + 2); g.fillStyle = css([170, 30, 30]); g.beginPath(); g.ellipse(q[0], q[1], 6, 2.6, 0, 0, 7); g.fill(); for (const du of [.22, .3]) { cylBody(g, S, r, su + du, sv + .05, .04, Z, Z + 7, [110, 70, 40], { ink: true, inkw: .6, top: false }); const t = gp(S, su + du, sv + .05, Z + 7); g.fillStyle = css([60, 40, 26]); g.beginPath(); g.arc(t[0], t[1] - 1, 2, 0, 7); g.fill(); } }
    // bakelite telephone
    { const tu = u1 - .9, tv = v1 - .5; fcs(g, S, r, tu - .18, tv - .14, tu + .18, tv + .14, Z, Z + 5, [24, 22, 24], { ink: true, inkw: .9, kt: 1.6, rim: true, grime: 0 }); const q = gp(S, tu, tv, Z + 5); const P = [[q[0] - 11, q[1] - 2], [q[0] - 8, q[1] - 6], [q[0] + 8, q[1] - 6], [q[0] + 11, q[1] - 2], [q[0] + 7, q[1] - 3], [q[0] - 7, q[1] - 3]]; prPoly(g, P, [20, 18, 20]); g.strokeStyle = css([255, 255, 255], .35); g.lineWidth = .8; g.beginPath(); g.moveTo(q[0] - 7, q[1] - 5.4); g.lineTo(q[0] + 7, q[1] - 5.4); g.stroke(); g.fillStyle = css([226, 220, 200]); g.beginPath(); g.arc(q[0], q[1] + 1, 3, 0, 7); g.fill(); g.strokeStyle = css(INK, .8); g.stroke();
      const c0 = gp(S, tu + .18, tv, Z + 2), c1 = gp(S, u1 + .1, tv + .1, 10); g.strokeStyle = css([20, 18, 20], .9); g.lineWidth = 1.2; g.beginPath(); g.moveTo(c0[0], c0[1]); g.bezierCurveTo(c0[0] + 10, c0[1] + 4, c1[0] + 6, c1[1] - 10, c1[0], c1[1]); g.stroke(); }
    prAshtray(g, S, r, u0 + W * .52, v1 - .35, Z);
    prCup(g, S, r, u1 - .5, v0 + .7, Z, [226, 222, 206], { liq: [60, 34, 20] }); prRing(g, S, u1 - .62, v0 + .82, Z, .08, .35);
    { const q = gp(S, u0 + W * .45, v1 - .14, Z); g.save(); faceL(g, S, u0 + W * .45 - .3, v1 - .14, Z + 6); paintRect(g, 0, 0, 38, 6, [190, 156, 70], r, { n: 3, ink: true, inkw: 1.4, ang: 0, edge: false }); prBlock(g, 'PRINCIPAL', 19, 3.2, 4.6, [40, 26, 10], 34); g.restore(); }
    prDeskLamp(g, S, r, u1 - .7, v0 + .45, Z);
  } else {          // logbook desk
    prOpenBook(g, S, r, u0 + W * .45, cvm, Z + .1, -.1);
    prCup(g, S, r, u1 - .4, v1 - .3, Z, [140, 150, 140]);
    prSheet(g, S, r, u0 + .3, v0 + .3, Z, .3, .22, .4);
    prDeskLamp(g, S, r, u1 - .35, v0 + .3, Z);
  }
};
function prDeskLamp(g, S, r, u, v, z) {
  cylBody(g, S, r, u, v, .1, z, z + 2, [40, 70, 56], { ink: true, inkw: .8 });
  const b = gp(S, u, v, z + 2), e = [b[0] + 5, b[1] - 16], t = [b[0] - 4, b[1] - 22];
  g.strokeStyle = css(INK, .9); g.lineWidth = 2.6; g.beginPath(); g.moveTo(b[0], b[1]); g.lineTo(e[0], e[1]); g.lineTo(t[0], t[1]); g.stroke(); g.strokeStyle = css([60, 90, 70]); g.lineWidth = 1.4; g.stroke();
  const P = [[t[0] - 9, t[1] + 5], [t[0] - 3, t[1] - 4], [t[0] + 6, t[1] - 2], [t[0] + 5, t[1] + 6]];
  prPoly(g, P, [40, 104, 74]); prShade(g, P, t[0] - 3, t[1] - 4, t[0], t[1] + 6, [[0, [170, 255, 200], .4], [1, [10, 30, 20], .5]]); g.strokeStyle = css(INK, .85); g.lineWidth = 1; pathPoly(g, P); g.stroke();
  g.fillStyle = css([255, 240, 190]); g.beginPath(); g.ellipse(t[0] - 2, t[1] + 5.5, 6, 1.8, -.4, 0, 7); g.fill();
  prLight(S, t[0] - 2, t[1] + 8, 76, [255, 214, 130], .26, .03, 'lamp', 'desklamp', z + 18, u, v);
}
PROPS.boiler = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, R = 1.05;
  contactShadow(g, S, u0 + .1, v0 + .1, u1 - .1, v1 - .1, 1.2);
  fcs(g, S, r, u0 + .15, v0 + .15, u1 - .15, v1 - .15, 0, 14, [86, 52, 44], { vert: false, mat: 'stone', wear: .7, under: [40, 30, 28] });   // brick plinth
  { const L = (t, z) => gp(S, lerp(u0 + .15, u1 - .15, t), v1 - .15, z); for (const z of [5, 10]) prLine(g, L(0, z), L(1, z), [40, 24, 20], .6, 1); }
  const steel = [90, 98, 96];
  const tank = cylBody(g, S, r, cu, cv, R, 14, 118, steel, { sw: 4, dens: 22, alt: [150, 126, 100], topCol: [104, 110, 106], mat: 'metal', spec: .3 });
  // heat discolouration + rust patches + soot
  g.save(); g.beginPath(); { const c0 = gp(S, cu, cv, 14), c1 = gp(S, cu, cv, 118); g.moveTo(c1[0] - tank.rx, c1[1]); g.lineTo(c0[0] - tank.rx, c0[1]); g.ellipse(c0[0], c0[1], tank.rx, tank.ry, 0, Math.PI, 0, true); g.lineTo(c1[0] + tank.rx, c1[1]); g.ellipse(c1[0], c1[1], tank.rx, tank.ry, 0, 0, Math.PI); } g.clip();
  for (let i = 0; i < 9; i++) { const q = gp(S, cu + r.r(-.9, .9), cv + .9, r.r(20, 110)), rr = r.r(6, 16), gr = g.createRadialGradient(q[0], q[1], 0, q[0], q[1], rr); gr.addColorStop(0, r() < .5 ? 'rgba(140,60,24,.45)' : 'rgba(60,40,70,.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(q[0] - rr, q[1] - rr, rr * 2, rr * 2); }
  { const q = gp(S, cu, cv + 1, 40), gr = g.createRadialGradient(q[0], q[1], 4, q[0], q[1], 50); gr.addColorStop(0, 'rgba(255,120,40,.25)'); gr.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = gr; g.fillRect(q[0] - 50, q[1] - 50, 100, 100); }
  g.restore();
  cylBody(g, S, r, cu, cv, .5, 118, 134, [84, 90, 88], { sw: 3, mat: 'metal' });
  // riveted seams (front half), with highlight + shadow per rivet
  for (const z of [34, 66, 98]) { const c0 = gp(S, cu, cv, z); g.strokeStyle = css([30, 32, 34], .7); g.lineWidth = 2; g.beginPath(); g.ellipse(c0[0], c0[1], ecx(R), ecy(R), 0, 0, Math.PI); g.stroke(); g.strokeStyle = css([200, 200, 190], .25); g.lineWidth = 1; g.beginPath(); g.ellipse(c0[0], c0[1] - 2, ecx(R), ecy(R), 0, .2, Math.PI - .2); g.stroke(); for (let k = 0; k < 18; k++) { const a = (k + .5) / 18 * Math.PI, x = c0[0] + Math.cos(a) * ecx(R), y = c0[1] + Math.sin(a) * ecy(R) + 3; g.fillStyle = css([24, 24, 26], .8); g.beginPath(); g.arc(x + .4, y + .5, 1.4, 0, 7); g.fill(); g.fillStyle = css([210, 190, 160], .7); g.beginPath(); g.arc(x - .3, y - .3, .8, 0, 7); g.fill(); } }
  // vertical seam
  { const a = gp(S, cu + .45, cv + .95, 116), b = gp(S, cu + .45, cv + .95, 16); prLine(g, a, b, [30, 30, 34], .6, 1.6); }
  // fire door facing the viewer: hinged iron door with a vent, glowing slots, and the open grate light
  const fd = gp(S, cu - .1, v1 - .05, 44);
  paintRect(g, fd[0] - 21, fd[1] - 26, 42, 44, [46, 46, 50], r, { n: 16, ink: true, inkw: 1.6, ang: 0, edge: false });
  prTexFill(g, [[fd[0] - 21, fd[1] - 26], [fd[0] + 21, fd[1] - 26], [fd[0] + 21, fd[1] + 18], [fd[0] - 21, fd[1] + 18]], 'streak', 1);
  const fg = g.createRadialGradient(fd[0], fd[1] - 2, 2, fd[0], fd[1] - 2, 17); fg.addColorStop(0, 'rgba(255,236,160,1)'); fg.addColorStop(.5, 'rgba(255,130,40,.95)'); fg.addColorStop(1, 'rgba(140,34,10,.9)');
  g.fillStyle = fg; g.beginPath(); g.ellipse(fd[0], fd[1] - 3, 15, 14, 0, 0, 7); g.fill();
  for (let k = 0; k < 7; k++) { g.fillStyle = css([255, 220, 120], .8); g.fillRect(fd[0] - 9 + r() * 18, fd[1] - 8 + r() * 10, 1.4, 1.4); }   // embers
  g.strokeStyle = css(INK, .9); g.lineWidth = 2; g.beginPath(); g.ellipse(fd[0], fd[1] - 3, 15, 14, 0, 0, 7); g.stroke();
  g.fillStyle = css([10, 6, 6], .9); for (let k = -2; k <= 2; k++) g.fillRect(fd[0] - 14, fd[1] - 3 + k * 5, 28, 1.6);
  for (const dy of [-18, 10]) { paintRect(g, fd[0] - 25, fd[1] + dy, 6, 6, [30, 30, 32], r, { n: 2, ink: true, inkw: .8 }); }
  paintRect(g, fd[0] + 16, fd[1] - 6, 10, 4, [70, 70, 74], r, { n: 2, ink: true, inkw: .8, ang: 0 });   // latch handle
  prLight(S, fd[0], fd[1] - 3, 300, [255, 120, 40], .6, .22, 'fire', 'boiler', 44, cu - .1, v1);
  prLight(S, fd[0] + 40, fd[1] + 24, 220, [255, 90, 30], .3, .2, 'fire', 'boiler', 10, cu, v1 + .6);
  // gauges, sight glass, warning plate
  for (const [gu, gz, gr] of [[.5, 90, 8], [.15, 100, 6]]) { const gq = gp(S, cu + gu, cv + .75 + gu * .3, gz); paintEll(g, gq[0], gq[1], gr + 1.5, gr + 1.5, [176, 140, 70], r, { n: 6, ink: true, inkw: 1.1 }); g.fillStyle = css([226, 218, 190]); g.beginPath(); g.arc(gq[0], gq[1], gr, 0, 7); g.fill(); g.fillStyle = css([170, 30, 30], .7); g.beginPath(); g.moveTo(gq[0], gq[1]); g.arc(gq[0], gq[1], gr - 1, -.5, .2); g.fill(); for (let k = 0; k < 9; k++) { const a = Math.PI * .8 + k * .18; g.strokeStyle = css(INK, .7); g.lineWidth = .6; g.beginPath(); g.moveTo(gq[0] + Math.cos(a) * gr * .7, gq[1] + Math.sin(a) * gr * .7); g.lineTo(gq[0] + Math.cos(a) * gr * .9, gq[1] + Math.sin(a) * gr * .9); g.stroke(); } g.strokeStyle = css([20, 20, 20]); g.lineWidth = 1.2; g.beginPath(); g.moveTo(gq[0], gq[1]); g.lineTo(gq[0] + gr * .6, gq[1] - gr * .5); g.stroke(); g.fillStyle = css([255, 255, 240], .6); g.fillRect(gq[0] - gr * .5, gq[1] - gr * .6, 2, 1.4); }
  { const sg = gp(S, cu + .8, cv + .55, 60); paintRect(g, sg[0] - 3, sg[1] - 26, 6, 30, [60, 60, 64], r, { n: 2, ink: true, inkw: .9, ang: 1.57 }); g.fillStyle = css([140, 190, 190], .7); g.fillRect(sg[0] - 1.4, sg[1] - 23, 2.8, 24); g.fillStyle = css([60, 100, 120], .9); g.fillRect(sg[0] - 1.4, sg[1] - 10, 2.8, 11); }
  { g.save(); faceL(g, S, cu - .75, cv + .72, 112); g.transform(1, -.1, 0, 1, 0, 0); paintRect(g, 10, 0, 44, 12, [214, 180, 50], r, { n: 4, ink: true, inkw: 1.4, ang: 0, edge: false }); prBlock(g, 'DANGER · HIGH PRESSURE', 32, 6.4, 7, [30, 24, 20], 40); g.restore(); }
  // flue up to the ceiling
  const c1 = gp(S, cu, cv, 134);
  const F1 = [[c1[0] - 8, c1[1]], [c1[0] + 8, c1[1]], [c1[0] + 8, c1[1] - 42], [c1[0] - 8, c1[1] - 42]];
  paintPoly(g, F1, [70, 74, 74], r, { n: 8, ink: false, ang: 1.57, edge: false }); prShade(g, F1, c1[0] - 8, 0, c1[0] + 8, 0, [[0, [10, 12, 24], .5], [.6, [255, 210, 160], .35], [1, [10, 12, 24], .45]]); ink(g, F1, r, 1.3, null, .85);
  const F2 = [[c1[0] - 8, c1[1] - 42], [c1[0] + 30, c1[1] - 60], [c1[0] + 30, c1[1] - 44], [c1[0] + 8, c1[1] - 34]];
  paintPoly(g, F2, [70, 74, 74], r, { n: 8, ink: true, inkw: 1.3, ang: -.4, edge: false }); prShade(g, F2, 0, c1[1] - 60, 0, c1[1] - 34, [[0, [255, 210, 160], .3], [1, [10, 12, 24], .45]]);
  for (const z of [10, 30]) { prLine(g, [c1[0] - 9, c1[1] - z], [c1[0] + 9, c1[1] - z], [40, 42, 44], .9, 3); }
  S.steam.push({ x: c1[0] + 30, y: c1[1] - 55 });
  // coal heap + shovel at the front-right
  { const ch = gp(S, u1 - .3, v1 + .25, 0); for (let i = 0; i < 26; i++) { const x = ch[0] + (r() - .5) * 34, y = ch[1] - r() * 10 * (1 - Math.abs(x - ch[0]) / 20); paintPoly(g, ellPts(x, y, r.r(2.4, 4.6), r.r(1.8, 3), 5, r() * 3, r, .4), [24, 22, 24], r, { n: 2, ink: false, edge: false }); g.fillStyle = css([150, 160, 170], .5); g.fillRect(x - 1, y - 2, 1.4, .8); }
    g.strokeStyle = css(INK, .9); g.lineWidth = 2.6; g.beginPath(); g.moveTo(ch[0] - 6, ch[1] - 6); g.lineTo(ch[0] + 14, ch[1] - 40); g.stroke(); g.strokeStyle = css([120, 84, 50]); g.lineWidth = 1.6; g.stroke(); paintPoly(g, [[ch[0] - 12, ch[1] - 2], [ch[0] - 2, ch[1] - 8], [ch[0] + 2, ch[1]], [ch[0] - 8, ch[1] + 4]], [70, 70, 74], r, { n: 3, ink: true, inkw: .9 }); }
};
PROPS.statue = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, bronze = v === 1, stone = bronze ? [88, 128, 110] : [160, 156, 146];
  contactShadow(g, S, u0 + .05, v0 + .05, u1 - .05, v1 - .05, 1.3);
  fcs(g, S, r, u0 + .1, v0 + .1, u1 - .1, v1 - .1, 0, 30, mul([160, 156, 146], .82), { vert: false, alt: [200, 196, 180], mat: 'stone', wear: .6, under: [90, 86, 80] });
  fcs(g, S, r, u0 + .3, v0 + .3, u1 - .3, v1 - .3, 30, 62, [160, 156, 146], { vert: false, alt: [210, 206, 190], nk: 1.2, mat: 'stone', wear: .4 });
  fcs(g, S, r, u0 + .22, v0 + .22, u1 - .22, v1 - .22, 62, 68, mul([160, 156, 146], 1.05), { mat: 'stone', wear: .5 });
  // bronze plaque with patina run-off
  g.save(); faceL(g, S, u0 + .55, v1 - .3, 56); paintRect(g, 0, 0, 58, 18, [110, 90, 50], r, { n: 6, ink: true, inkw: 1.6, ang: 0, edge: false }); prBlock(g, 'FATHER OF THE UNION', 29, 6.5, 6, [214, 190, 110], 52); prTypeLines(g, r, 8, 11, 42, 2, 3, [214, 190, 110], .5); g.restore();
  g.save(); faceL(g, S, u0 + .55, v1 - .3, 38); g.fillStyle = css([70, 140, 110], .35); for (let k = 0; k < 6; k++) g.fillRect(6 + k * 9, 0, 3, 8 + r() * 12); g.restore();
  // wreath of dead carnations at the foot, a candle stub
  { const q = gp(S, cu - .2, v1 - .05, 30.5); g.strokeStyle = css([60, 70, 40]); g.lineWidth = 3; g.beginPath(); g.ellipse(q[0], q[1] - 2, 10, 4.4, 0, 0, 7); g.stroke(); for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28; g.fillStyle = css(k % 2 ? [130, 40, 40] : [90, 30, 30]); g.beginPath(); g.arc(q[0] + Math.cos(a) * 10, q[1] - 2 + Math.sin(a) * 4.4, 1.8, 0, 7); g.fill(); } g.fillStyle = css([170, 30, 30]); g.fillRect(q[0] - 1, q[1] + 2, 2, 8); }
  // the figure in greatcoat, one arm raised, pointing over the yard
  const b = gp(S, cu, cv, 68), bx = b[0], by = b[1], c = stone, k = bronze ? [70, 120, 96] : [180, 178, 170];
  const cape = [[bx - 14, by - 86], [bx - 30, by - 50], [bx - 34, by - 8], [bx - 18, by - 2], [bx - 8, by - 60]];
  paintPoly(g, cape, mul(c, .72), r, { n: 20, sw: 4, ang: 1.3, ink: true, inkw: 1.8, edge: false }); prShade(g, cape, bx - 34, 0, bx - 8, 0, [[0, [20, 30, 50], .5], [1, [255, 220, 170], .15]]);
  const coat = [[bx - 22, by], [bx - 18, by - 28], [bx - 16, by - 56], [bx - 15, by - 78], [bx + 15, by - 78], [bx + 16, by - 58], [bx + 20, by - 26], [bx + 27, by - 2], [bx + 10, by + 2]];
  // boots
  for (const dx of [-10, 6]) paintPoly(g, [[bx + dx - 5, by + 1], [bx + dx + 7, by + 1], [bx + dx + 6, by - 8], [bx + dx - 4, by - 8]], mul(c, .6), r, { n: 3, ink: true, inkw: 1, edge: false });
  paintPoly(g, coat, c, r, { n: 50, sw: 4, ang: 1.5, ink: true, inkw: 2, alt: k, edge: false });
  prShade(g, coat, bx - 21, 0, bx + 24, 0, [[0, [20, 30, 50], .55], [.5, c, 0], [.75, [255, 220, 170], .35], [1, [20, 30, 50], .3]]);
  prTexFill(g, coat, bronze ? 'streak' : 'speck', 1);
  g.strokeStyle = css([30, 30, 32], .45); g.lineWidth = 1; for (const dx of [-8, 2, 12]) { g.beginPath(); g.moveTo(bx + dx * .6, by - 70); g.quadraticCurveTo(bx + dx, by - 30, bx + dx * 1.1, by - 2); g.stroke(); }
  prLine(g, [bx - 18, by - 46], [bx + 18, by - 46], [40, 40, 44], .6, 2.4);   // belt
  const sh = [[bx - 15, by - 78], [bx + 15, by - 78], [bx + 19, by - 90], [bx - 19, by - 90]]; paintPoly(g, sh, mul(c, 1.05), r, { n: 10, ink: true, inkw: 1.4, edge: false });
  const arm = [[bx + 13, by - 88], [bx + 38, by - 114], [bx + 45, by - 108], [bx + 20, by - 78]]; paintPoly(g, arm, c, r, { n: 10, ink: true, inkw: 1.4, edge: false }); prShade(g, arm, bx + 38, by - 114, bx + 16, by - 80, [[0, [255, 220, 170], .3], [1, [20, 30, 50], .3]]);
  paintEll(g, bx + 46, by - 112, 5, 5, c, r, { n: 6, ink: true, inkw: 1.2 });
  const arm2 = [[bx - 16, by - 84], [bx - 22, by - 54], [bx - 16, by - 52], [bx - 10, by - 80]]; paintPoly(g, arm2, mul(c, .8), r, { n: 6, ink: true, inkw: 1.2, edge: false });
  const head = [[bx - 8, by - 90], [bx + 8, by - 90], [bx + 9, by - 104], [bx + 4, by - 108], [bx - 6, by - 108], [bx - 9, by - 104]]; paintPoly(g, head, mul(c, 1.08), r, { n: 8, ink: true, inkw: 1.4, edge: false }); prShade(g, head, bx - 9, 0, bx + 9, 0, [[0, [20, 30, 50], .5], [1, [255, 220, 170], .3]]);
  paintPoly(g, [[bx - 11, by - 104], [bx + 11, by - 104], [bx + 12, by - 113], [bx - 12, by - 113]], mul(c, .9), r, { n: 6, ink: true, inkw: 1.3, edge: false });
  prLine(g, [bx - 12, by - 104], [bx + 13, by - 103], [30, 30, 32], .8, 2.2);
  // pigeon on the arm + droppings, moss
  { const px = bx + 32, py = by - 112; paintEll(g, px, py, 4.2, 3, [120, 120, 126], r, { n: 4, ink: true, inkw: .8 }); paintEll(g, px + 3.6, py - 2.6, 2, 2, [110, 110, 116], r, { n: 3, ink: true, inkw: .6 }); g.fillStyle = css([200, 120, 60]); g.fillRect(px + 5, py - 3, 1.4, .8); }
  g.save(); g.globalCompositeOperation = 'source-atop'; for (let i = 0; i < 12; i++) { g.fillStyle = css([236, 236, 226], .25); g.fillRect(bx + r.r(-16, 16), by - r.r(60, 112), 1.6, r.r(4, 14)); g.fillStyle = css([50, 76, 46], .2); g.fillRect(r.r(bx - 40, bx + 40), by + r.r(-30, 30), r.r(3, 9), r.r(6, 20)); } g.restore();
  prLine(g, [bx + 25, by - 110], [bx + 44, by - 116], [255, 190, 120], .4, 1.2);
};
PROPS.crate = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I;
  contactShadow(g, S, u0, v0, u1, v1, .9);
  if (v === 2) {   // theatre prop trunk: canvas-covered, brass corners, travel labels
    const c = [86, 60, 44];
    fcs(g, S, r, u0 + .06, v0 + .06, u1 - .06, v1 - .06, 0, 26, c, { vert: true, alt: [140, 96, 60], mat: 'fabric', wear: .5, under: [180, 160, 120] });
    fcs(g, S, r, u0 + .05, v0 + .08, u1 - .05, v1 - .08, 26, 35, mul(c, 1.12), { mat: 'fabric', wear: .5 });
    for (let k = 0; k < 3; k++) { const uu = lerp(u0 + .18, u1 - .18, k / 2); const a = gp(S, uu, v1 - .06, 0), b = gp(S, uu, v1 - .06, 26), c2 = gp(S, uu, v1 - .08, 35), d = gp(S, uu, v0 + .1, 35); g.strokeStyle = css(INK, .7); g.lineWidth = 4.4; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c2[0], c2[1]); g.lineTo(d[0], d[1]); g.stroke(); g.strokeStyle = css([120, 84, 46]); g.lineWidth = 3; g.stroke(); }
    for (const [uu, vv] of [[u0 + .06, v1 - .06], [u1 - .06, v1 - .06], [u1 - .06, v0 + .06]]) for (const z of [2, 24]) { const q = gp(S, uu, vv, z); g.fillStyle = css([200, 170, 90]); g.beginPath(); g.moveTo(q[0] - 4, q[1] - 2); g.lineTo(q[0] + 4, q[1] - 2); g.lineTo(q[0] + 4, q[1] + 3); g.lineTo(q[0] - 4, q[1] + 3); g.fill(); g.strokeStyle = css(INK, .8); g.lineWidth = .8; g.stroke(); }
    const lk = gp(S, (u0 + u1) / 2, v1 - .06, 22); g.fillStyle = css([220, 190, 100]); g.fillRect(lk[0] - 3, lk[1] - 3, 6, 7); g.strokeStyle = css(INK, .9); g.lineWidth = 1; g.strokeRect(lk[0] - 3, lk[1] - 3, 6, 7);
    g.save(); faceL(g, S, u0 + .3, v1 - .06, 22); for (let k = 0; k < 3; k++) { const x = 6 + k * 34 + r() * 8, y = 2 + r() * 6; g.save(); g.translate(x, y); g.rotate((r() - .5) * .3); g.fillStyle = css(r.p([[226, 210, 160], [176, 40, 36], [60, 100, 120]])); g.fillRect(0, 0, 22, 12); prBlock(g, r.p(['TOUR', 'No.9', 'HALL', 'PROPS']), 11, 6.5, 7, [30, 24, 20], 20); g.restore(); } g.restore();
    return;
  }
  if (v === 1) {   // dormitory footlocker: olive tin with stencilled name
    const c = [86, 96, 64];
    fcs(g, S, r, u0 + .1, v0 + .14, u1 - .1, v1 - .14, 0, 24, c, { vert: true, mat: 'enamel', wear: .7, under: [60, 50, 40] });
    fcs(g, S, r, u0 + .08, v0 + .12, u1 - .08, v1 - .12, 24, 30, mul(c, 1.1), { mat: 'enamel', wear: .6, under: [60, 50, 40] });
    g.save(); faceL(g, S, u0 + .1, v1 - .14, 22); prBlock(g, 'V. KOREN · 3B', 25, 8, 7, [226, 220, 196], 44, { stencil: c }); g.restore();
    for (const uu of [u0 + .3, u1 - .3]) { const q = gp(S, uu, v1 - .14, 20); g.fillStyle = css([190, 180, 150]); g.fillRect(q[0] - 2.5, q[1] - 2, 5, 5); g.strokeStyle = css(INK, .8); g.lineWidth = .8; g.strokeRect(q[0] - 2.5, q[1] - 2, 5, 5); }
    prSheet(g, S, r, (u0 + u1) / 2 + .1, (v0 + v1) / 2, 30, .3, .2, .3, { col: [220, 212, 186], ink: [40, 50, 110] });
    return;
  }
  const c = v === 3 ? [150, 128, 88] : [168, 124, 76];
  const stack = v === 3 ? 2 : 1;
  for (let s = 0; s < stack; s++) {
    const z0 = s * 28, uu0 = u0 + .04 + s * .18, vv0 = v0 + .04 + s * .1, uu1 = u1 - .04 - (s ? .2 : 0), vv1 = v1 - .04;
    fcs(g, S, r, uu0, vv0, uu1, vv1, z0, z0 + 28, c, { vert: false, alt: [220, 180, 120], dens: 24, mat: 'wood', wear: .4, under: [90, 66, 40] });
    // plank seams + corner battens
    for (let k = 1; k < 3; k++) { const z = z0 + k * 9.3; prLine(g, gp(S, uu0, vv1, z), gp(S, uu1, vv1, z), INK, .45, 1.1); prLine(g, gp(S, uu1, vv1, z), gp(S, uu1, vv0, z), INK, .4, 1.1); }
    for (const [uu, vv] of [[uu0 + .05, vv1], [uu1 - .05, vv1]]) { const a = gp(S, uu, vv, z0), b = gp(S, uu, vv, z0 + 28); prLine(g, a, b, mul(c, .7), 1, 4); prLine(g, a, b, INK, .4, .8); }
    { const a = gp(S, uu1, vv1 - .05, z0), b = gp(S, uu1, vv1 - .05, z0 + 28); prLine(g, a, b, mul(c, .75), 1, 4); }
    const bq = gp(S, uu1, (vv0 + vv1) / 2, z0 + 14), bq2 = gp(S, (uu0 + uu1) / 2, vv1, z0 + 14);
    prLine(g, [bq2[0] - 14, bq2[1] - 11], [bq2[0] + 14, bq2[1] + 3], [70, 46, 28], .7, 2.6);
    // stencilled supply marks + nails
    g.save(); faceL(g, S, uu0 + .12, vv1, z0 + 22); prBlock(g, s ? 'FRAGILE' : 'UNION SUPPLY', ((uu1 - uu0) * 64 - 16) / 2, 7, 7, [40, 30, 24], (uu1 - uu0) * 64 - 24, { alpha: .75 }); if (!s) { prBlock(g, 'No.' + (40 + (S.seed % 50)), ((uu1 - uu0) * 64 - 16) / 2, 15, 5, [140, 30, 26], 40, { alpha: .8 }); } g.restore();
    g.save(); faceR(g, S, uu1, vv1, z0 + 22); prBellGlyph(g, (vv1 - vv0) * 32, 8, 10, [40, 30, 24], .6); g.restore();
    for (let k = 0; k < 4; k++) { const q = gp(S, lerp(uu0, uu1, (k + .5) / 4), vv1, z0 + 26); g.fillStyle = css([40, 36, 34]); g.fillRect(q[0], q[1], 1.2, 1.2); }
  }
  if (v === 0 && r() < .9) { const q = gp(S, u0 + .4, (v0 + v1) / 2, 28); prSheet(g, S, r, u0 + .5, (v0 + v1) / 2, 28.2, .34, .24, -.2, { head: [30, 30, 30] }); prCup(g, S, r, u1 - .4, (v0 + v1) / 2, 28); }
};
PROPS.lamp = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  contactShadow(g, S, cu - .3, cv - .3, cu + .3, cv + .3, .8);
  if (v === 1) {   // iron lamp post with a glazed lantern
    cylBody(g, S, r, cu, cv, .22, 0, 12, [46, 50, 52], { ink: true, mat: 'metal' });
    cylBody(g, S, r, cu, cv, .15, 12, 18, [56, 60, 62], { ink: true });
    vbar(g, S, r, cu, cv, 16, 122, 5, [44, 48, 50]);
    for (const z of [40, 100]) { const q = gp(S, cu, cv, z); g.strokeStyle = css([60, 64, 66]); g.lineWidth = 7; g.beginPath(); g.moveTo(q[0] - 3.5, q[1]); g.lineTo(q[0] + 3.5, q[1]); g.stroke(); }
    const t = gp(S, cu, cv, 124);
    const G = [[t[0] - 10, t[1] - 4], [t[0] + 10, t[1] - 4], [t[0] + 14, t[1] - 26], [t[0] - 14, t[1] - 26]];
    const gl = g.createLinearGradient(0, t[1] - 26, 0, t[1]); gl.addColorStop(0, 'rgb(255,236,170)'); gl.addColorStop(1, 'rgb(240,170,80)'); g.fillStyle = gl; pathPoly(g, G); g.fill();
    g.fillStyle = css([255, 255, 230], .95); g.beginPath(); g.ellipse(t[0], t[1] - 14, 4, 6, 0, 0, 7); g.fill();
    g.strokeStyle = css(INK, .9); g.lineWidth = 2; pathPoly(g, G); g.stroke(); g.lineWidth = 1.4; g.beginPath(); g.moveTo(t[0], t[1] - 4); g.lineTo(t[0], t[1] - 26); g.stroke();
    paintPoly(g, [[t[0] - 18, t[1] - 26], [t[0] + 18, t[1] - 26], [t[0] + 5, t[1] - 36], [t[0] - 5, t[1] - 36]], [44, 48, 50], r, { n: 6, ink: true, inkw: 1.4, edge: false }); prLine(g, [t[0] - 16, t[1] - 27], [t[0] + 16, t[1] - 27], [255, 200, 130], .5, 1);
    paintEll(g, t[0], t[1] - 38, 3, 3, [44, 48, 50], r, { n: 4, ink: true });
    paintRect(g, t[0] - 10, t[1] - 6, 20, 4, [40, 44, 46], r, { n: 2, ink: true, inkw: 1 });
    prLight(S, t[0], t[1] - 14, 150, [255, 190, 100], .45, .04, 'lamp', 'lamp', 110, cu, cv);
    prLight(S, t[0], t[1] + 40, 90, [255, 170, 80], .1, .03, 'pool', 'lamp', 0, cu, cv);
    return;
  }
  cylBody(g, S, r, cu, cv, .22, 0, 4, [60, 44, 36], { ink: true, mat: 'wood' });
  vbar(g, S, r, cu, cv, 3, v === 2 ? 70 : 92, v === 2 ? 3 : 3.4, v === 2 ? [90, 90, 94] : [140, 110, 66]);
  const t = gp(S, cu, cv, v === 2 ? 72 : 94);
  if (v === 2) {   // caged work light on a stand
    g.fillStyle = css([255, 244, 200]); g.beginPath(); g.arc(t[0], t[1] - 6, 6, 0, 7); g.fill();
    g.strokeStyle = css([40, 40, 44], .9); g.lineWidth = 1.2; g.beginPath(); g.arc(t[0], t[1] - 6, 9, 0, 7); g.moveTo(t[0] - 9, t[1] - 6); g.lineTo(t[0] + 9, t[1] - 6); g.moveTo(t[0], t[1] - 15); g.lineTo(t[0], t[1] + 3); g.moveTo(t[0] - 6.4, t[1] - 12.4); g.lineTo(t[0] + 6.4, t[1] + .4); g.stroke();
    const cb = gp(S, cu, cv, 40), ce = gp(S, cu + .6, cv + .4, 0); g.strokeStyle = css([20, 20, 22], .9); g.lineWidth = 1.4; g.beginPath(); g.moveTo(cb[0], cb[1]); g.quadraticCurveTo(cb[0] + 10, ce[1], ce[0], ce[1]); g.stroke();
    prLight(S, t[0], t[1] - 6, 130, [255, 200, 120], .4, .1, 'lamp', 'lamp', 66, cu, cv);
  } else {         // standard lamp: pleated fabric shade, scorched where the bulb sits, tassel
    const sh = [[t[0] - 12, t[1] - 3], [t[0] + 12, t[1] - 3], [t[0] + 7, t[1] - 23], [t[0] - 7, t[1] - 23]];
    paintPoly(g, sh, [226, 196, 136], r, { n: 12, ink: false, alt: [255, 230, 170], edge: false });
    prShade(g, sh, t[0] - 12, 0, t[0] + 12, 0, [[0, [150, 90, 50], .45], [.4, [255, 240, 200], .4], [1, [150, 90, 50], .35]]);
    g.strokeStyle = css([160, 110, 60], .5); g.lineWidth = .8; for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(t[0] + k * 3.4, t[1] - 3); g.lineTo(t[0] + k * 2, t[1] - 23); g.stroke(); }
    g.fillStyle = css([140, 80, 40], .3); g.beginPath(); g.ellipse(t[0] + 1, t[1] - 18, 3, 2, 0, 0, 7); g.fill();
    ink(g, sh, r, 1.5, null, .85);
    g.fillStyle = css([255, 226, 160], .95); g.beginPath(); g.ellipse(t[0], t[1] - 3, 11, 2.4, 0, 0, 7); g.fill();
    prLine(g, [t[0] + 9, t[1] - 3], [t[0] + 9, t[1] + 6], [120, 40, 30], .9, 1); g.fillStyle = css([170, 50, 40]); g.fillRect(t[0] + 8, t[1] + 6, 2, 3);
    prLight(S, t[0], t[1] - 10, 140, [255, 190, 100], .42, .06, 'lamp', 'lamp', 86, cu, cv);
  }
  const fq = gp(S, cu, cv, 0); prLight(S, fq[0], fq[1], 70, [255, 170, 80], .1, .03, 'pool', 'lamp', 0, cu, cv);
};
PROPS.loudspeaker = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  contactShadow(g, S, cu - .2, cv - .2, cu + .2, cv + .2, .8);
  cylBody(g, S, r, cu, cv, .2, 0, 8, [60, 60, 62], { ink: true, mat: 'stone' });
  vbar(g, S, r, cu, cv, 6, 196, 5.4, [96, 98, 94]);
  // painted warning bands + junction box + cable conduit
  for (const z of [30, 40]) { const a = gp(S, cu, cv, z); g.fillStyle = css(z === 30 ? [176, 40, 36] : [226, 216, 186]); g.fillRect(a[0] - 2.7, a[1] - 10, 5.4, 10); }
  { const q = gp(S, cu, cv, 70); paintRect(g, q[0] - 7, q[1] - 12, 14, 16, [70, 80, 74], r, { n: 4, ink: true, inkw: 1, ang: 1.57, edge: false }); prScrew(g, q[0] - 4, q[1] - 9, 1); prScrew(g, q[0] + 4, q[1] + 1, 1); g.fillStyle = css([214, 180, 50]); g.beginPath(); g.moveTo(q[0], q[1] - 8); g.lineTo(q[0] + 4, q[1] - 1); g.lineTo(q[0] - 4, q[1] - 1); g.fill(); }
  { const q = gp(S, cu, cv, 50); g.fillStyle = css([230, 220, 190], .9); g.save(); g.translate(q[0] - 7, q[1] - 18); g.rotate(-.05); g.fillRect(0, 0, 14, 18); prTypeLines(g, r, 2, 4, 10, 4, 3, [40, 30, 30], .6); g.restore(); }
  const t = gp(S, cu, cv, 190);
  paintRect(g, t[0] - 14, t[1] + 4, 28, 4, [60, 62, 60], r, { n: 2, ink: true, inkw: 1, ang: 0 });
  const nh = v === 1 ? 2 : 3;
  for (let i = 0; i < nh; i++) {
    const sd = i === 1 ? 1 : -1, a = i * 2.2 + .6 + (v === 1 ? 1 : 0), dx = Math.cos(a) * 14, dy = Math.sin(a) * 4 - (i === 2 ? 12 : 0), fx = t[0] + dx, fy = t[1] + dy, dir = Math.cos(a) > -0.2 ? 1 : -1;
    const H0 = [[fx - dir * 9, fy - 7], [fx + dir * 9, fy - 7], [fx + dir * 22, fy - 18], [fx + dir * 22, fy + 18], [fx + dir * 9, fy + 7], [fx - dir * 9, fy + 7]];
    paintPoly(g, H0, [102, 104, 92], r, { n: 16, ink: false, ang: 0, edge: false, alt: [130, 136, 120] });
    prShade(g, H0, 0, fy - 18, 0, fy + 18, [[0, [255, 226, 180], .4], [.45, [0, 0, 0], 0], [1, [10, 12, 24], .5]]); prTexFill(g, H0, 'streak', .9); ink(g, H0, r, 1.3, null, .85);
    paintEll(g, fx + dir * 22, fy, 5, 18, [24, 22, 22], r, { n: 5, ink: true, inkw: 1.1 });
    g.strokeStyle = css([170, 160, 136], .5); g.lineWidth = 1.4; g.beginPath(); g.ellipse(fx + dir * 22, fy, 5, 18, 0, dir > 0 ? -1.6 : 1.6, dir > 0 ? 1.6 : 4.7); g.stroke();
    prLine(g, [fx + dir * 16, fy + 12], [fx + dir * 15.5, fy + 26], [120, 54, 22], .45, 1.4);
  }
  g.strokeStyle = css(INK, .85); g.lineWidth = 1.6; g.beginPath(); g.moveTo(t[0], t[1] + 10); g.quadraticCurveTo(t[0] - 40, t[1] + 80, t[0] - 80, t[1] + 30); g.stroke();
};
PROPS.sack = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  contactShadow(g, S, cu - .35, cv - .35, cu + .35, cv + .35, .9);
  const n = v === 2 ? 3 : v === 1 ? 2 : 1;
  for (let i = 0; i < n; i++) {
    const o = gp(S, cu + (i - (n - 1) / 2) * .38, cv + (i % 2) * .2, i === 2 ? 22 : 0), c = jit([176, 150, 104], r, .08), h = 30 + r() * 8;
    const P = [[o[0] - 15, o[1] - 2], [o[0] - 17, o[1] - h * .5], [o[0] - 10, o[1] - h * .85], [o[0] - 5, o[1] - h], [o[0] - 7, o[1] - h - 5], [o[0] + 7, o[1] - h - 5], [o[0] + 5, o[1] - h], [o[0] + 10, o[1] - h * .85], [o[0] + 17, o[1] - h * .5], [o[0] + 15, o[1] - 2], [o[0], o[1] + 4]];
    paintPoly(g, P, c, r, { n: 30, sw: 3, ang: 2, aj: 1, ink: false, alt: [220, 190, 130], edge: false, wob: 2 });
    prTexFill(g, P, 'weave', 1); prShade(g, P, o[0] - 17, 0, o[0] + 17, 0, [[0, [30, 30, 60], .45], [.6, [255, 226, 170], .25], [1, [30, 30, 60], .3]]); prShade(g, P, 0, o[1] - h, 0, o[1], [[0, [0, 0, 0], 0], [1, PR_AO, .4]]);
    ink(g, P, r, 1.5, null, .85);
    g.strokeStyle = css([60, 40, 26], .5); g.lineWidth = 1; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(o[0] - 4 + k * 4, o[1] - h + 2); g.quadraticCurveTo(o[0] - 6 + k * 5, o[1] - h * .6, o[0] - 10 + k * 8, o[1] - 6); g.stroke(); }
    g.strokeStyle = css([110, 84, 50]); g.lineWidth = 2; g.beginPath(); g.moveTo(o[0] - 6, o[1] - h + 1); g.lineTo(o[0] + 6, o[1] - h + 3); g.stroke();
    g.save(); g.translate(o[0], o[1] - h * .42); g.rotate(-.06); prBlock(g, 'FLOUR', 0, 0, 7, [150, 40, 36], 22, { alpha: .8 }); prBlock(g, 'GRADE III', 0, 6, 3.6, [60, 40, 30], 18, { alpha: .7 }); g.restore();
    g.fillStyle = css([240, 236, 220], .35); g.beginPath(); g.ellipse(o[0] + 4, o[1] + 1, 8, 2, 0, 0, 7); g.fill();   // flour dust
  }
};
PROPS.barrel = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, h = v === 1 ? 44 : 40;
  contactShadow(g, S, cu - .4, cv - .4, cu + .4, cv + .4, 1);
  const col = v === 1 ? [60, 82, 108] : v === 2 ? [120, 90, 60] : [136, 96, 58];
  const c = cylBody(g, S, r, cu, cv, .38, 0, h, col, { ink: true, sw: 3, alt: v === 1 ? [160, 80, 40] : [190, 140, 90], topCol: v === 2 ? [96, 110, 120] : mul(col, .8), mat: v === 1 ? 'metal' : 'wood', spec: v === 1 ? .45 : .25 });
  if (v !== 1) { for (let k = -3; k <= 3; k++) { const q0 = gp(S, cu, cv, 1), x = q0[0] + k * c.rx / 3.6; prLine(g, [x, q0[1] + Math.sqrt(Math.max(0, 1 - (k / 3.6) ** 2)) * c.ry - 1], [x, q0[1] - h + Math.sqrt(Math.max(0, 1 - (k / 3.6) ** 2)) * c.ry + 1], [40, 24, 14], .4, .8); } }
  for (const z of v === 1 ? [12, h - 12] : [5, h * .3, h * .7, h - 5]) { const c0 = gp(S, cu, cv, z); g.strokeStyle = css(v === 1 ? [30, 40, 54] : [44, 44, 48], .95); g.lineWidth = v === 1 ? 2.6 : 3; g.beginPath(); g.ellipse(c0[0], c0[1], ecx(.38) - .3, ecy(.38), 0, 0, Math.PI); g.stroke(); g.strokeStyle = css([255, 220, 170], .3); g.lineWidth = .8; g.beginPath(); g.ellipse(c0[0], c0[1] - 1.4, ecx(.38) - .3, ecy(.38), 0, .2, 1.4); g.stroke(); }
  const tq = gp(S, cu, cv, h);
  if (v === 1) {   // steel drum: rust blooms, hazard label, bung caps
    g.save(); g.globalCompositeOperation = 'source-atop'; for (let i = 0; i < 9; i++) { const q = gp(S, cu + r.r(-.3, .3), cv + .3, r.r(5, 38)); g.fillStyle = css([150, 70, 30], .35); g.beginPath(); g.ellipse(q[0], q[1], r.r(2, 6), r.r(2, 5), 0, 0, 7); g.fill(); } g.restore();
    const q = gp(S, cu - .05, cv + .38, 30); g.fillStyle = css([214, 180, 50]); g.beginPath(); g.moveTo(q[0], q[1] - 7); g.lineTo(q[0] + 7, q[1]); g.lineTo(q[0], q[1] + 7); g.lineTo(q[0] - 7, q[1]); g.fill(); g.strokeStyle = css(INK, .8); g.lineWidth = 1; g.stroke(); prBlock(g, '!', q[0], q[1] + .5, 8, [30, 20, 10], 6);
    g.fillStyle = css([50, 60, 70]); g.beginPath(); g.ellipse(tq[0] + 6, tq[1] - 1, 3, 1.4, 0, 0, 7); g.fill(); g.strokeStyle = css([170, 180, 190], .5); g.lineWidth = .8; g.beginPath(); g.ellipse(tq[0], tq[1], c.rx - 3, c.ry - 2, 0, 0, 7); g.stroke();
  } else { g.strokeStyle = css([60, 40, 24], .6); g.lineWidth = .8; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(tq[0] - c.rx * .8, tq[1] + k * 2.6); g.lineTo(tq[0] + c.rx * .8, tq[1] + k * 2.6); g.stroke(); } if (r() < .6) prCup(g, S, r, cu + .1, cv, h, [140, 150, 140]); }
};
PROPS.mic = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  contactShadow(g, S, cu - .25, cv - .25, cu + .25, cv + .25, .8);
  cylBody(g, S, r, cu, cv, .2, 0, 4, [40, 42, 46], { ink: true, mat: 'metal', spec: .6 });
  vbar(g, S, r, cu, cv, 3, 40, 3, [150, 154, 156]); vbar(g, S, r, cu, cv, 40, 64, 2.2, [180, 184, 186]);
  { const q = gp(S, cu, cv, 40); paintRect(g, q[0] - 3, q[1] - 2, 6, 4, [60, 60, 64], r, { n: 2, ink: true, inkw: .8 }); }
  const t = gp(S, cu, cv, 64);
  g.strokeStyle = css(INK, .85); g.lineWidth = 3.6; g.beginPath(); g.moveTo(t[0], t[1]); g.quadraticCurveTo(t[0] + 6, t[1] - 18, t[0] + 12, t[1] - 22); g.stroke(); g.strokeStyle = css([150, 154, 156]); g.lineWidth = 2; g.stroke();
  // big ribbon microphone: chrome cage around a grille
  const mx = t[0] + 14, my = t[1] - 25;
  paintEll(g, mx, my, 7, 10, v === 0 ? [176, 180, 184] : [110, 110, 114], r, { n: 10, ink: true, inkw: 1.2, edge: false });
  g.fillStyle = css([30, 30, 34], .85); g.beginPath(); g.ellipse(mx, my, 4.6, 7.4, 0, 0, 7); g.fill();
  g.strokeStyle = css([150, 150, 154], .6); g.lineWidth = .6; for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(mx - 4.2, my + k * 2); g.lineTo(mx + 4.2, my + k * 2); g.stroke(); }
  g.strokeStyle = css([230, 236, 240], .8); g.lineWidth = 1; g.beginPath(); g.ellipse(mx, my, 7, 10, 0, -2.2, -.6); g.stroke();
  g.fillStyle = css([255, 250, 240], .8); g.fillRect(mx + 3, my - 7, 1.4, 1.4);
  if (v === 1) {   // dead mic: electrical tape round the neck, cable coiled on the floor and cut
    g.fillStyle = css([20, 20, 22]); g.fillRect(t[0] + 4, t[1] - 12, 5, 4);
    const b = gp(S, cu, cv, 2); g.strokeStyle = css(INK, .9); g.lineWidth = 1.8; g.beginPath(); g.moveTo(b[0], b[1]); g.bezierCurveTo(b[0] + 30, b[1] + 6, b[0] + 10, b[1] + 20, b[0] + 44, b[1] + 16); g.stroke(); g.fillStyle = css([200, 130, 60]); g.fillRect(b[0] + 44, b[1] + 15, 2, 2);
  } else { const b = gp(S, cu, cv, 2); g.strokeStyle = css(INK, .9); g.lineWidth = 1.6; g.beginPath(); g.moveTo(t[0], t[1] + 30); g.quadraticCurveTo(t[0] + 20, t[1] + 50, t[0] + 60, t[1] + 44); g.stroke(); g.fillStyle = css([255, 60, 40]); g.beginPath(); g.arc(mx - 9, my + 6, 1.4, 0, 7); g.fill(); prLight(S, mx - 9, my + 6, 18, [255, 60, 40], .5, .3, 'lamp', 'mic', 92, cu, cv); }
};
PROPS.sofa = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, c = [[70, 100, 80], [120, 78, 54], [130, 50, 50], [90, 92, 110]][v];
  contactShadow(g, S, u0, v0, u1, v1, .9);
  for (const [uu, vv] of [[u0 + .15, v1 - .12], [u1 - .15, v1 - .12], [u1 - .15, v0 + .12]]) vbar(g, S, r, uu, vv, 0, 10, 3.4, [40, 30, 24]);
  fcs(g, S, r, u0, v0, u1, v0 + .35, 10, 50, c, { vert: false, alt: mul(c, 1.4), mat: 'fabric', wear: .3, under: [200, 190, 160] });
  fcs(g, S, r, u0, v0 + .2, u0 + .3, v1, 10, 34, c, { mat: 'fabric' });
  const n = Math.max(1, Math.round((u1 - u0) / 0.9));
  for (let i = 0; i < n; i++) fcs(g, S, r, lerp(u0 + .3, u1 - .3, i / n) + .02, v0 + .3, lerp(u0 + .3, u1 - .3, (i + 1) / n) - .02, v1 - .02, 10, 26, mul(c, 1.08), { alt: mul(c, 1.5), dens: 26, mat: 'fabric', wear: .3, under: [210, 200, 170] });
  fcs(g, S, r, u1 - .3, v0 + .2, u1, v1, 10, 34, c, { mat: 'fabric', wear: .4, under: [200, 190, 160] });
  { const q = gp(S, u0 + .8, v1 - .3, 26); g.fillStyle = css([226, 214, 170], .7); g.beginPath(); g.ellipse(q[0], q[1], 6, 2.4, .3, 0, 7); g.fill(); g.strokeStyle = css([60, 40, 30], .7); g.lineWidth = .8; g.stroke(); }   // split seam, stuffing
};
PROPS.cart = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I;
  contactShadow(g, S, u0, v0, u1, v1, .9);
  const c = v === 1 ? [140, 100, 64] : [160, 166, 166];
  for (const [uu, vv] of [[u0 + .1, v0 + .1], [u1 - .1, v0 + .1], [u1 - .1, v1 - .1], [u0 + .1, v1 - .1]]) vbar(g, S, r, uu, vv, 6, 50, 2.6, mul(c, .7));
  fcs(g, S, r, u0 + .05, v0 + .05, u1 - .05, v1 - .05, 14, 17, c, { mat: v === 1 ? 'wood' : 'metal' }); fcs(g, S, r, u0, v0, u1, v1, 46, 49, c, { mat: v === 1 ? 'wood' : 'metal', wear: .4 });
  for (const [uu, vv] of [[u0 + .2, v1 - .05], [u1 - .05, v1 - .2], [u1 - .05, v0 + .2]]) { const q = gp(S, uu, vv, 6); g.fillStyle = css([30, 30, 32]); g.beginPath(); g.arc(q[0], q[1], 5, 0, 7); g.fill(); g.strokeStyle = css([150, 150, 150]); g.lineWidth = 1.2; g.stroke(); g.fillStyle = css([170, 170, 170]); g.beginPath(); g.arc(q[0], q[1], 1.6, 0, 7); g.fill(); }
  prClutter(g, S, r, u0 + .1, v0 + .1, u1 - .1, v1 - .1, 49, 'canteen', 2.4);
  prClutter(g, S, r, u0 + .15, v0 + .15, u1 - .15, v1 - .15, 17, 'canteen', 1.2);
};
PROPS.tray = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, q = gp(S, cu, cv, 0);
  const pts = [[q[0] - 17, q[1]], [q[0], q[1] - 8.5], [q[0] + 17, q[1]], [q[0], q[1] + 8.5]];
  g.fillStyle = css([6, 4, 14], .3); pathPoly(g, pts.map(a => [a[0] - 2, a[1] + 2])); g.fill();
  paintPoly(g, pts, [150, 156, 154], r, { n: 8, ink: true, inkw: 1.2, ew: 1.2, ha: 1, edge: false });
  prTexFill(g, pts, 'scratch', 1);
  paintPoly(g, [[q[0] - 13, q[1]], [q[0], q[1] - 6.5], [q[0] + 13, q[1]], [q[0], q[1] + 6.5]], [118, 124, 122], r, { n: 4, ink: false, edge: false });
  prLine(g, pts[3], pts[2], [255, 255, 250], .5, 1);
  prBowl(g, S, r, cu - .1, cv - .02, 1, [210, 204, 184], v % 2 ? [150, 100, 50] : [120, 140, 70]);
  prBread(g, S, r, cu + .12, cv - .14, 1);
  prSpoon(g, S, cu + .08, cv + .12, 1, -.3);
};
PROPS.tree = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, base = gp(S, cu, cv, 0), bx = base[0], by = base[1];
  g.fillStyle = css([6, 4, 16], .2); g.beginPath(); g.ellipse(bx - 18, by + 4, 74, 28, -.1, 0, 7); g.fill();
  // iron tree guard + root flare
  for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI, x = bx + Math.cos(a) * 18, y = by + Math.sin(a) * 7; prLine(g, [x, y], [x, y - 22], INK, .85, 2.4); prLine(g, [x, y], [x, y - 22], [50, 52, 56], 1, 1.2); }
  g.strokeStyle = css([50, 52, 56]); g.lineWidth = 2; g.beginPath(); g.ellipse(bx, by - 20, 18, 7, 0, 0, Math.PI); g.stroke();
  const trunk = [[bx - 13, by + 4], [bx - 8, by - 10], [bx - 7, by - 60], [bx - 13, by - 112], [bx + 6, by - 114], [bx + 3, by - 62], [bx + 9, by - 10], [bx + 14, by + 4]];
  paintPoly(g, trunk, [80, 60, 46], r, { n: 44, ang: 1.57, aj: .2, sw: 3, ink: true, inkw: 2, alt: [130, 96, 66], edge: false });
  prShade(g, trunk, bx - 13, 0, bx + 14, 0, [[0, [20, 24, 44], .55], [.55, [0, 0, 0], 0], [.8, [255, 190, 110], .35], [1, [20, 24, 44], .3]]);
  g.strokeStyle = css([40, 28, 20], .55); g.lineWidth = 1; for (let i = 0; i < 12; i++) { const y = by - r() * 105, x = bx + (r() - .5) * 12; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - .5) * 3, y - 6 - r() * 10); g.stroke(); }
  if (r() < .8) { const q = [bx - 4, by - 62]; g.save(); g.translate(q[0], q[1]); g.rotate(-.06); g.fillStyle = css([226, 214, 180]); g.fillRect(-6, -8, 12, 16); prTypeLines(g, r, -4, -4, 8, 3, 3, [40, 30, 30], .6); g.fillStyle = css([40, 40, 40]); g.fillRect(-.6, -9, 1.2, 1.2); g.restore(); }   // nailed notice
  const autumn = v !== 1, cols = v === 1 ? [[78, 92, 48], [56, 66, 42], [116, 110, 52]] : [[148, 116, 44], [176, 96, 40], [104, 120, 52], [200, 148, 50], [120, 68, 40]];
  const blobs = v === 1 ? 6 : 12, cx0 = bx - 4, cy0 = by - 150;
  // branches
  g.strokeStyle = css([60, 44, 34], .95); g.lineCap = 'round'; for (let i = 0; i < 5; i++) { g.lineWidth = 3.6 - i * .4; g.beginPath(); g.moveTo(bx - 2, by - 100 + i * 4); const ex = bx + r.r(-56, 56), ey = by - r.r(120, 170); g.quadraticCurveTo((bx + ex) / 2, by - 120, ex, ey); g.stroke(); }
  // canopy: dark core masses, then clustered leaf dabs, lit toward the upper right, cool underneath
  const dab = (x, y, rx, ry, c, a) => { g.fillStyle = css(c, a); g.beginPath(); g.ellipse(x, y, rx, ry, r() * 3, 0, 7); g.fill(); };
  for (let i = 0; i < blobs; i++) { const a = r() * 6.28, d = r() * 50, x = cx0 + Math.cos(a) * d * 1.3, y = cy0 + Math.sin(a) * d * .8; const gr = g.createRadialGradient(x, y, 2, x, y, 40); const c = mix(r.p(cols), [20, 26, 40], .55); gr.addColorStop(0, css(c, .9)); gr.addColorStop(.7, css(c, .6)); gr.addColorStop(1, css(c, 0)); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, 40, 30, 0, 0, 7); g.fill(); }
  const nd = v === 1 ? 170 : 420;
  for (let i = 0; i < nd; i++) {
    const a = r() * 6.28, d = Math.sqrt(r()) * 80, x = cx0 + Math.cos(a) * d * 1.25, y = cy0 + Math.sin(a) * d * .78;
    const lit = clamp(.5 + (Math.cos(a + .9) * d / 80) * .6 - (y - cy0) / 160, 0, 1), base = r.p(cols);
    const c = lit > .62 ? mix(base, [255, 200, 110], (lit - .6) * 1.1) : mix(base, [24, 34, 52], (1 - lit) * .55);
    const n = 3 + (r() * 3 | 0); for (let k = 0; k < n; k++) dab(x + (r() - .5) * 7, y + (r() - .5) * 5, r.r(1.6, 3.4), r.r(1.1, 2.2), jit(c, r, .08), .85);
  }
  for (let i = 0; i < 30; i++) { const a = -.9 + (r() - .5) * 1.4, d = 70 + r() * 14, x = cx0 + Math.cos(a) * d * 1.25, y = cy0 + Math.sin(a) * d * .78; dab(x, y, 2.4, 1.6, mix(r.p(cols), [255, 210, 120], .55), .9); }   // rim-lit edge leaves
  // gaps where the sky shows through
  for (let i = 0; i < 8; i++) { const x = cx0 + r.r(-60, 60), y = cy0 + r.r(-40, 30); dab(x, y, r.r(2, 4), r.r(1.5, 3), [30, 36, 50], .4); }
  if (v === 1) { g.strokeStyle = css([50, 40, 32], .8); g.lineWidth = 1.2; for (let i = 0; i < 10; i++) { const x = cx0 + r.r(-70, 70), y = cy0 + r.r(-50, 30); g.beginPath(); g.moveTo(x, y); g.lineTo(x + r.r(-14, 14), y - r.r(6, 16)); g.stroke(); } }
  if (autumn) for (let i = 0; i < 16; i++) { const x = bx + r.r(-60, 40), y = by + r.r(-8, 16); g.fillStyle = css(jit(r.p(cols), r, .15), .85); g.beginPath(); g.ellipse(x, y, 2.6, 1.3, r() * 3, 0, 7); g.fill(); }   // fallen leaves
};
PROPS.bell = function (g, S, p, I) {   // the old school bell on its timber frame
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  contactShadow(g, S, cu - .45, cv - .45, cu + .45, cv + .45, 1);
  fcs(g, S, r, cu - .4, cv - .35, cu + .4, cv + .35, 0, 8, [110, 108, 100], { mat: 'stone', wear: .5 });
  for (const du of [-.32, .32]) { const a = gp(S, cu + du, cv, 8), b = gp(S, cu + du * .2, cv, 112); const P = [[a[0] - 3.4, a[1]], [a[0] + 3.4, a[1]], [b[0] + 2.4, b[1]], [b[0] - 2.4, b[1]]]; paintPoly(g, P, [96, 64, 40], r, { n: 6, ink: false, ang: 1.57, edge: false }); prTexFill(g, P, 'grain', .9, (k) => k.rotate(1.5708)); prShade(g, P, a[0] - 3.4, 0, a[0] + 3.4, 0, [[0, [20, 20, 40], .4], [.7, [255, 200, 140], .3], [1, [20, 20, 40], .3]]); ink(g, P, r, 1.2, null, .85); }
  const t = gp(S, cu, cv, 112); paintRect(g, t[0] - 18, t[1] - 4, 36, 7, [92, 62, 38], r, { n: 6, ink: true, inkw: 1.2, ang: 0, edge: false }); prLine(g, [t[0] - 18, t[1] - 4], [t[0] + 18, t[1] - 4], [255, 210, 150], .4, 1);
  const bc = v === 1 ? [90, 150, 126] : [176, 132, 62];
  const B = [[t[0] - 6, t[1] + 3], [t[0] + 6, t[1] + 3], [t[0] + 10, t[1] + 14], [t[0] + 17, t[1] + 34], [t[0] + 22, t[1] + 44], [t[0] - 22, t[1] + 44], [t[0] - 17, t[1] + 34], [t[0] - 10, t[1] + 14]];
  paintPoly(g, B, bc, r, { n: 30, ang: 1.5, ink: false, alt: [255, 220, 120], edge: false });
  prShade(g, B, t[0] - 22, 0, t[0] + 22, 0, [[0, [20, 40, 50], .6], [.35, bc, 0], [.62, [255, 236, 180], .45], [.78, bc, 0], [1, [255, 160, 80], .45]]);
  g.save(); pathPoly(g, B); g.clip(); for (let i = 0; i < 10; i++) { g.fillStyle = css([80, 150, 120], .25 + r() * .2); g.fillRect(t[0] + r.r(-18, 18), t[1] + r.r(8, 30), r.r(1.4, 3.4), r.r(5, 16)); } g.restore();   // verdigris runs
  ink(g, B, r, 1.8, null, .9);
  g.fillStyle = css([20, 12, 10], .9); g.beginPath(); g.ellipse(t[0], t[1] + 44, 22, 5, 0, 0, 7); g.fill();
  g.strokeStyle = css(mix(bc, [255, 230, 160], .4), .8); g.lineWidth = 1.6; g.beginPath(); g.ellipse(t[0], t[1] + 43, 22, 5, 0, 0, Math.PI); g.stroke();
  g.fillStyle = css([60, 50, 40]); g.beginPath(); g.arc(t[0] + 2, t[1] + 46, 3.4, 0, 7); g.fill();   // clapper
  g.strokeStyle = css([200, 180, 140]); g.lineWidth = 1.4; g.beginPath(); g.moveTo(t[0] + 30, t[1] - 3); g.quadraticCurveTo(t[0] + 36, t[1] + 40, t[0] + 28, t[1] + 78); g.stroke();
  g.fillStyle = css([140, 70, 44]); g.beginPath(); g.arc(t[0] + 28, t[1] + 80, 3, 0, 7); g.fill();
  g.save(); faceL(g, S, cu - .3, cv + .35, 7); prBlock(g, '1891', 19, 3.4, 5, [40, 36, 30], 20, { alpha: .6 }); g.restore();
};
PROPS.hoop = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  contactShadow(g, S, cu - .25, cv - .35, cu + .25, cv + .25, .8);
  cylBody(g, S, r, cu, cv - .35, .18, 0, 8, [60, 60, 62], { ink: true, mat: 'metal' });
  vbar(g, S, r, cu, cv - .35, 6, 150, 6, [92, 96, 98]);
  { const q = gp(S, cu, cv - .35, 40); g.fillStyle = css([200, 50, 40], .9); g.fillRect(q[0] - 3, q[1] - 30, 6, 30); g.fillStyle = css([230, 220, 200]); for (let k = 0; k < 3; k++) g.fillRect(q[0] - 3, q[1] - 26 + k * 9, 6, 3); }   // padding
  const b0 = gp(S, cu, cv - .35, 148), b1 = gp(S, cu, cv, 112);
  g.strokeStyle = css(INK, .85); g.lineWidth = 5; g.beginPath(); g.moveTo(b0[0], b0[1]); g.lineTo(b1[0], b1[1] - 2); g.stroke(); g.strokeStyle = css([80, 84, 86]); g.lineWidth = 3; g.stroke();
  fcs(g, S, r, cu - .6, cv - .05, cu + .6, cv + .02, 98, 150, [226, 224, 214], { alt: [255, 255, 255], ink: true, dens: 50, mat: 'wood', wear: .4, under: [150, 130, 100] });
  const inner = [gp(S, cu - .22, cv + .03, 110), gp(S, cu + .22, cv + .03, 110), gp(S, cu + .22, cv + .03, 132), gp(S, cu - .22, cv + .03, 132)];
  g.strokeStyle = css([190, 50, 40], .95); g.lineWidth = 2.2; pathPoly(g, inner); g.stroke();
  // ball smudges on the board
  for (let k = 0; k < 6; k++) { const q = gp(S, cu + r.r(-.4, .4), cv + .03, r.r(108, 145)); g.fillStyle = css([90, 70, 50], .15); g.beginPath(); g.arc(q[0], q[1], r.r(3, 6), 0, 7); g.fill(); }
  const rim = gp(S, cu, cv + .38, 106);
  g.strokeStyle = css(INK, .85); g.lineWidth = 4.4; g.beginPath(); g.ellipse(rim[0], rim[1], ecx(.3), ecy(.3), 0, 0, 7); g.stroke(); g.strokeStyle = css([220, 90, 40]); g.lineWidth = 2.6; g.stroke();
  g.strokeStyle = css([255, 200, 150], .6); g.lineWidth = 1; g.beginPath(); g.ellipse(rim[0], rim[1] - 1, ecx(.3), ecy(.3), 0, 3.3, 6); g.stroke();
  g.strokeStyle = css([236, 232, 220], .75); g.lineWidth = 1;
  for (let k = 0; k < 12; k++) { const a = k / 12 * 6.28, x = rim[0] + Math.cos(a) * ecx(.3), y = rim[1] + Math.sin(a) * ecy(.3), a2 = a + .6; g.beginPath(); g.moveTo(x, y); g.lineTo(rim[0] + Math.cos(a2) * ecx(.17), rim[1] + 20 + Math.sin(a2) * ecy(.17)); g.stroke(); }
  g.beginPath(); g.ellipse(rim[0], rim[1] + 10, ecx(.24), ecy(.24), 0, 0, 7); g.stroke(); g.beginPath(); g.ellipse(rim[0], rim[1] + 20, ecx(.17), ecy(.17), 0, 0, 7); g.stroke();
  // torn net strand hanging
  g.beginPath(); g.moveTo(rim[0] + 8, rim[1] + 20); g.lineTo(rim[0] + 10, rim[1] + 30); g.stroke();
};
PROPS.fence = function (g, S, p, I) {   // free-standing low railing along the long axis
  const { r, v, u0, v0, u1, v1 } = I, alongU = (u1 - u0) >= (v1 - v0), cv = (v0 + v1) / 2, cu = (u0 + u1) / 2;
  const n = Math.max(2, Math.round((alongU ? u1 - u0 : v1 - v0) * 3));
  for (let i = 0; i <= n; i++) { const t = i / n; const uu = alongU ? lerp(u0 + .05, u1 - .05, t) : cu, vv = alongU ? cv : lerp(v0 + .05, v1 - .05, t); vbar(g, S, r, uu, vv, 0, 40, 2.6, [40, 40, 46]); const q = gp(S, uu, vv, 40); g.fillStyle = css([190, 160, 80]); g.beginPath(); g.arc(q[0], q[1] - 1, 2, 0, 7); g.fill(); }
  for (const z of [34, 10]) { const a = gp(S, alongU ? u0 : cu, alongU ? cv : v0, z), b = gp(S, alongU ? u1 : cu, alongU ? cv : v1, z); prLine(g, a, b, INK, .9, 4); prLine(g, a, b, [56, 56, 62], 1, 2.4); prLine(g, [a[0], a[1] - 1], [b[0], b[1] - 1], [255, 200, 140], .35, .8); }
};
PROPS.chalkboard = function (g, S, p, I) {   // A-frame menu board
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  contactShadow(g, S, cu - .4, cv - .2, cu + .4, cv + .2, .8);
  const q = gp(S, cu, cv, 0);
  g.strokeStyle = css(INK, .85); g.lineWidth = 5; g.beginPath(); g.moveTo(q[0] - 24, q[1]); g.lineTo(q[0] - 14, q[1] - 70); g.moveTo(q[0] + 24, q[1]); g.lineTo(q[0] + 14, q[1] - 70); g.moveTo(q[0], q[1] + 3); g.lineTo(q[0], q[1] - 58); g.stroke();
  g.strokeStyle = css([110, 76, 46]); g.lineWidth = 3.2; g.stroke();
  g.save(); g.translate(q[0] - 30, q[1] - 82); g.transform(1, .45, 0, 1, 0, 0);
  paintRect(g, -3, -3, 66, 50, [120, 84, 50], r, { n: 12, ink: true, inkw: 1.2, ang: 0, edge: false }); prBevel(g, -3, -3, 66, 50); paintRect(g, 0, 0, 60, 44, [34, 46, 42], r, { n: 24, sw: 5, ang: .2, aj: 1, alt: [70, 84, 78], ink: true, inkw: .9, edge: false }); chalkMenu(g, r, 0, 0, 60, 44, 'MENU'); g.restore();
};
PROPS.mirror = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, q = gp(S, cu, cv, 0);
  contactShadow(g, S, cu - .35, cv - .2, cu + .35, cv + .2, .8);
  g.strokeStyle = css(INK, .85); g.lineWidth = 6.4; g.beginPath(); g.moveTo(q[0] - 20, q[1]); g.lineTo(q[0] - 14, q[1] - 40); g.moveTo(q[0] + 20, q[1]); g.lineTo(q[0] + 14, q[1] - 40); g.stroke(); g.strokeStyle = css([80, 54, 34]); g.lineWidth = 4.4; g.stroke();
  g.save(); g.translate(q[0], q[1] - 46);
  paintPoly(g, ellPts(0, -34, 22, 40, 20, 0, r, .02), [100, 70, 44], r, { n: 24, ink: true, ang: 1.57, alt: [180, 130, 70], edge: false });
  const gr = g.createLinearGradient(-16, -66, 16, -4); gr.addColorStop(0, css([186, 200, 196])); gr.addColorStop(.5, css([100, 126, 130])); gr.addColorStop(1, css([46, 62, 76]));
  g.fillStyle = gr; g.beginPath(); g.ellipse(0, -34, 17, 35, 0, 0, 7); g.fill();
  prTexFill(g, ellPts(0, -34, 17, 35, 16), 'grime', 1);
  g.strokeStyle = css([14, 18, 22], .9); g.lineWidth = 1.1; g.beginPath(); g.moveTo(-6, -66); g.lineTo(2, -44); g.lineTo(-4, -26); g.lineTo(8, -8); g.moveTo(2, -44); g.lineTo(16, -50); g.moveTo(-4, -26); g.lineTo(-16, -30); g.stroke();
  g.strokeStyle = css([255, 255, 255], .35); g.lineWidth = 2.5; g.beginPath(); g.moveTo(-10, -58); g.lineTo(-10, -20); g.stroke();
  g.restore();
};
PROPS.ladder = function (g, S, p, I) {   // free-standing ladder leaning
  const { r, v, u0, v0, u1, v1 } = I, q = gp(S, (u0 + u1) / 2, (v0 + v1) / 2, 0);
  g.lineCap = 'round';
  for (const pass of [0, 1]) { g.strokeStyle = pass ? css([150, 110, 70]) : css(INK, .85); g.lineWidth = pass ? 3 : 4.6; g.beginPath(); g.moveTo(q[0] - 8, q[1]); g.lineTo(q[0] - 2, q[1] - 90); g.moveTo(q[0] + 8, q[1]); g.lineTo(q[0] + 14, q[1] - 90); g.stroke(); g.lineWidth = pass ? 2.4 : 3.8; for (let z = 10; z < 86; z += 12) { g.beginPath(); g.moveTo(q[0] - 8 + z * .07, q[1] - z); g.lineTo(q[0] + 8 + z * .07, q[1] - z); g.stroke(); } }
  for (let z = 10; z < 86; z += 12) prLine(g, [q[0] - 7 + z * .07, q[1] - z - 1], [q[0] + 7 + z * .07, q[1] - z - 1], [255, 220, 170], .35, .8);
};
/* ---- flat (floor-level) props, baked into the floor layer ---- */
FLAT.rug = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, W = (u1 - u0) * 64, H = (v1 - v0) * 64;
  g.save(); g.translate(...gp(S, u0, v0, 0)); g.transform(.5, .25, -.5, .25, 0, 0);
  g.fillStyle = css([8, 6, 14], .35); g.fillRect(-4, -2, W + 8, H + 8);
  const pal = [[[140, 42, 38], [222, 172, 90], [40, 56, 60]], [[42, 96, 100], [222, 192, 136], [146, 68, 50]], [[58, 88, 68], [196, 168, 100], [120, 30, 30]], [[110, 80, 60], [180, 150, 110], [60, 50, 44]]][v];
  paintRect(g, 0, 0, W, H, pal[0], r, { n: W * H / 110, sw: 5, ang: 0, aj: .1, alt: pal[1], jv: .1, ink: true, inkw: 2, ew: 1.4, ha: .4, edge: false });
  prTexFill(g, [[0, 0], [W, 0], [W, H], [0, H]], 'weave', 1);
  paintRect(g, 9, 9, W - 18, H - 18, mul(pal[0], .82), r, { n: W * H / 180, sw: 4, ang: 0, alt: pal[2], jv: .1, ink: false, edge: false });
  // border bands + a running motif
  g.strokeStyle = css(pal[1], .9); g.lineWidth = 3; g.strokeRect(14, 14, W - 28, H - 28); g.strokeStyle = css(pal[2], .8); g.lineWidth = 2; g.strokeRect(22, 22, W - 44, H - 44);
  g.fillStyle = css(pal[1], .7); for (let x = 26; x < W - 26; x += 10) { g.beginPath(); g.moveTo(x, 17); g.lineTo(x + 4, 19.5); g.lineTo(x, 22); g.fill(); g.beginPath(); g.moveTo(x, H - 17); g.lineTo(x + 4, H - 19.5); g.lineTo(x, H - 22); g.fill(); }
  const cx = W / 2, cy = H / 2, k = Math.min(W, H) / 2 - 30;
  g.fillStyle = css(pal[1], .85); g.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283, rr = i % 2 ? k * .35 : k * .8; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.closePath(); g.fill(); g.strokeStyle = css(pal[2], .9); g.lineWidth = 2; g.stroke();
  g.fillStyle = css(pal[2], .9); g.beginPath(); g.arc(cx, cy, k * .18, 0, 7); g.fill();
  if (v === 2) { g.fillStyle = css([230, 200, 100], .9); g.beginPath(); g.arc(cx, cy, k * .3, 0, 7); g.fill(); prBellGlyph(g, cx, cy, k * .42, [120, 30, 30]); }
  // wear: the faded walking path, threadbare patches, stains, frayed fringe
  const wg = g.createLinearGradient(0, 0, W, H); wg.addColorStop(0, 'rgba(230,210,170,0)'); wg.addColorStop(.5, 'rgba(230,210,170,.16)'); wg.addColorStop(1, 'rgba(230,210,170,0)'); g.fillStyle = wg; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 4; i++) { const x = r() * W, y = r() * H, rr = r.r(8, 20), gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(200,180,150,.3)'); gr.addColorStop(1, 'rgba(200,180,150,0)'); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  for (let i = 0; i < 18; i++) { g.fillStyle = css([20, 16, 14], .08); g.beginPath(); g.ellipse(r() * W, r() * H, r.r(8, 24), r.r(5, 14), 0, 0, 7); g.fill(); }
  g.strokeStyle = css(pal[1], .7); g.lineWidth = 1.4; for (let x = 0; x < W; x += 4) { const l1 = 3 + r() * 3, l2 = 3 + r() * 3; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (r() - .5) * 2, -l1); g.moveTo(x, H); g.lineTo(x + (r() - .5) * 2, H + l2); g.stroke(); }
  if (r() < .6) { g.save(); g.translate(W * r.r(.6, .9), 0); g.fillStyle = css([8, 6, 14], .35); g.beginPath(); g.moveTo(0, 0); g.lineTo(24, 0); g.lineTo(24, 18); g.fill(); g.fillStyle = css(mul(pal[0], .7)); g.beginPath(); g.moveTo(0, 0); g.lineTo(22, -2); g.lineTo(20, 16); g.fill(); g.restore(); }   // curled corner
  g.restore();
};
FLAT.mat = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, W = (u1 - u0) * 64, H = (v1 - v0) * 64, col = v === 1 ? [64, 96, 118] : [150, 70, 54];
  const t = 9;
  const A = gp(S, u0, v0, t), B = gp(S, u1, v0, t), Cc = gp(S, u1, v1, t), D = gp(S, u0, v1, t), D0 = gp(S, u0, v1, 0), C0 = gp(S, u1, v1, 0), B0 = gp(S, u1, v0, 0);
  g.fillStyle = css([6, 4, 14], .35); pathPoly(g, [A, B, Cc, D].map(q => [q[0] - 4, q[1] + t + 2])); g.fill();
  paintPoly(g, [D, Cc, C0, D0], mul(col, .55), r, { n: 16, ang: .46, ink: true, edge: false });
  paintPoly(g, [Cc, B, B0, C0], mul(col, .85), r, { n: 16, ang: 2.68, ink: true, edge: false });
  g.save(); g.translate(A[0], A[1]); g.transform(.5, .25, -.5, .25, 0, 0);
  g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.clip();
  g.fillStyle = css(mul(col, 1.05)); g.fillRect(0, 0, W, H);
  for (let i = 0; i < W * H / 80; i++) bristle(g, r() * W, r() * H, r() * 3, 20, 5, jit(col, r, .16), .5, r);
  g.fillStyle = g.createPattern(prTex('scratch'), 'repeat'); g.globalAlpha = .8; g.fillRect(0, 0, W, H); g.fillStyle = g.createPattern(prTex('grime'), 'repeat'); g.fillRect(0, 0, W, H); g.globalAlpha = 1;
  const nx = Math.max(2, Math.round(W / 64)), ny = Math.max(2, Math.round(H / 64));
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const x0 = i * W / nx, y0 = j * H / ny, w = W / nx, h = H / ny;
    const gg = g.createRadialGradient(x0 + w * .6, y0 + h * .4, 2, x0 + w / 2, y0 + h / 2, w * .7); gg.addColorStop(0, 'rgba(255,220,170,.25)'); gg.addColorStop(1, 'rgba(10,6,20,.28)'); g.fillStyle = gg; g.fillRect(x0 + 1, y0 + 1, w - 2, h - 2);
    g.strokeStyle = css([20, 12, 14], .7); g.lineWidth = 2; g.strokeRect(x0 + 1, y0 + 1, w - 2, h - 2);
    g.fillStyle = css([230, 210, 170], .6); g.beginPath(); g.arc(x0 + w / 2, y0 + h / 2, 2.2, 0, 7); g.fill();
  }
  // a split seam taped over, chalk dust from hands
  g.fillStyle = css([200, 190, 160], .7); g.fillRect(W * .3, H * .5 - 3, 30, 6); g.fillStyle = css([255, 255, 250], .12); g.beginPath(); g.ellipse(W * .6, H * .4, 30, 14, 0, 0, 7); g.fill();
  g.restore();
  rimStroke(g, [Cc, B, A], [255, 190, 120], .5, 1.6);
  if (v === 1) { const h1 = gp(S, (u0 + u1) / 2, v1, 5); g.strokeStyle = css([230, 220, 190], .9); g.lineWidth = 2; g.beginPath(); g.ellipse(h1[0], h1[1], 8, 2.6, 0, 0, 7); g.stroke(); }
};
FLAT.rope = function (g, S, p, I) {
  const { r, u0, v0, u1, v1 } = I, c = gp(S, (u0 + u1) / 2, (v0 + v1) / 2, 0);
  g.fillStyle = css([6, 4, 14], .35); g.beginPath(); g.ellipse(c[0] - 3, c[1] + 3, 20, 9, 0, 0, 7); g.fill();
  for (let k = 0; k < 4; k++) {
    g.strokeStyle = css(INK, .8); g.lineWidth = 5; g.beginPath(); g.ellipse(c[0], c[1] - k * 1.6, 17 - k * 2.6, 7.6 - k * 1.2, 0, 0, 7); g.stroke();
    g.strokeStyle = css(jit([176, 144, 96], r, .1)); g.lineWidth = 3.4; g.stroke();
    g.strokeStyle = css([60, 44, 28], .5); g.lineWidth = 1; g.setLineDash([2, 3]); g.stroke(); g.setLineDash([]);
    g.strokeStyle = css([255, 230, 180], .35); g.lineWidth = .8; g.beginPath(); g.ellipse(c[0], c[1] - k * 1.6 - 1, 17 - k * 2.6, 7.6 - k * 1.2, 0, 3.4, 6); g.stroke();
  }
  g.strokeStyle = css(INK, .8); g.lineWidth = 5; g.beginPath(); g.moveTo(c[0] + 12, c[1] + 2); g.bezierCurveTo(c[0] + 30, c[1] + 8, c[0] + 40, c[1] - 6, c[0] + 56, c[1] + 6); g.stroke(); g.strokeStyle = css([176, 144, 96]); g.lineWidth = 3.4; g.stroke();
  // frayed, cleanly-cut end (the clue: it was cut, not worn)
  g.fillStyle = css([210, 186, 140]); g.beginPath(); g.ellipse(c[0] + 56, c[1] + 6, 2.2, 1.8, 0, 0, 7); g.fill(); g.strokeStyle = css([200, 170, 120], .8); g.lineWidth = .7; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(c[0] + 56, c[1] + 6); g.lineTo(c[0] + 59 + r() * 2, c[1] + 4 + r() * 4); g.stroke(); }
};
FLAT.stage = function (g, S, p, I) {
  const { r, v, u0, v0, u1, v1 } = I, H = STAGE_H, wood = v === 1 ? [120, 78, 54] : [100, 72, 52];
  const A = gp(S, u0, v0, H), B = gp(S, u1, v0, H), Cc = gp(S, u1, v1, H), D = gp(S, u0, v1, H), D0 = gp(S, u0, v1, 0), C0 = gp(S, u1, v1, 0), B0 = gp(S, u1, v0, 0);
  g.fillStyle = css([6, 4, 14], .35); pathPoly(g, [D0, C0, B0, [B0[0] - 8, B0[1] + 6], [C0[0] - 8, C0[1] + 6], [D0[0] - 8, D0[1] + 6]]); g.fill();
  // apron: painted skirting boards with a scuffed kick line
  const fL = [D, Cc, C0, D0], fR = [Cc, B, B0, C0];
  paintPoly(g, fL, mul(wood, .5), r, { n: 40, ang: 1.57, ink: true, alt: [160, 110, 70], edge: false });
  paintPoly(g, fR, mul(wood, .75), r, { n: 40, ang: 1.57, ink: true, alt: [200, 140, 80], edge: false });
  prTexFill(g, fL, 'grime', 1); prTexFill(g, fR, 'grime', .8);
  { const n = Math.round((u1 - u0) * 2); for (let i = 1; i < n; i++) { const a = gp(S, lerp(u0, u1, i / n), v1, H), b = gp(S, lerp(u0, u1, i / n), v1, 0); prLine(g, a, b, [20, 12, 10], .5, 1); } const m = Math.round((v1 - v0) * 2); for (let i = 1; i < m; i++) { const a = gp(S, u1, lerp(v0, v1, i / m), H), b = gp(S, u1, lerp(v0, v1, i / m), 0); prLine(g, a, b, [20, 12, 10], .4, 1); } }
  prShade(g, fL, 0, D[1], 0, D0[1], [[0, [0, 0, 0], 0], [1, PR_AO, .4]]);
  g.save(); g.translate(A[0], A[1]); g.transform(.5, .25, -.5, .25, 0, 0);
  const W = (u1 - u0) * 64, Hh = (v1 - v0) * 64; g.beginPath(); g.rect(0, 0, W, Hh); g.clip();
  for (let x = 0; x < W; x += 13) paintRect(g, x, 0, 12.5, Hh, jit(mul(wood, 1.25), r, .12), r, { n: 8, sw: 3, ang: 1.57, aj: .05, alt: [200, 150, 90], ink: false, edge: false });
  g.save(); g.rotate(1.5708); g.fillStyle = g.createPattern(prTex('grain'), 'repeat'); g.globalAlpha = .9; g.fillRect(0, -W, Hh, W); g.restore();
  g.strokeStyle = css([20, 12, 10], .5); g.lineWidth = 1; for (let x = 0; x < W; x += 13) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, Hh); g.stroke(); for (let y = r() * 60; y < Hh; y += 50 + r() * 60) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + 13, y); g.stroke(); g.fillStyle = css([30, 20, 14], .6); g.fillRect(x + 2, y + 2, 1.4, 1.4); g.fillRect(x + 9, y + 2, 1.4, 1.4); } }
  const gg = g.createRadialGradient(W / 2, Hh / 2, 10, W / 2, Hh / 2, Math.max(W, Hh) * .6); gg.addColorStop(0, 'rgba(255,220,160,.18)'); gg.addColorStop(1, 'rgba(0,0,0,.0)'); g.fillStyle = gg; g.fillRect(0, 0, W, Hh);
  // spike tape marks, a chalk X, scuffs
  g.fillStyle = css([226, 214, 170], .5); g.fillRect(W * .3, Hh * .2, 10, 2.5); g.fillRect(W * .55, Hh * .6, 10, 2.5); g.fillStyle = css([200, 60, 50], .5); g.fillRect(W * .45, Hh * .42, 2.5, 10);
  g.strokeStyle = css([240, 240, 230], .45); g.lineWidth = 2.4; g.beginPath(); g.moveTo(W * .62 - 8, Hh * .3 - 8); g.lineTo(W * .62 + 8, Hh * .3 + 8); g.moveTo(W * .62 + 8, Hh * .3 - 8); g.lineTo(W * .62 - 8, Hh * .3 + 8); g.stroke();
  g.fillStyle = g.createPattern(prTex('scratch'), 'repeat'); g.globalAlpha = .8; g.fillRect(0, 0, W, Hh); g.globalAlpha = 1;
  g.restore();
  rimStroke(g, [D, Cc, B], [255, 190, 110], .55, 1.8);
  // footlight row along the front lip: tin hoods with warm bulbs
  const lipA = gp(S, u0, v1, H), lipB = gp(S, u1, v1, H), nfl = Math.max(4, Math.round((u1 - u0) * 1.6));
  for (let i = 0; i < nfl; i++) { const t = (i + .5) / nfl, x = lerp(lipA[0], lipB[0], t), y = lerp(lipA[1], lipB[1], t); g.fillStyle = css([40, 38, 36]); g.beginPath(); g.moveTo(x - 4, y + 1); g.lineTo(x + 4, y - 1); g.lineTo(x + 4, y + 3); g.lineTo(x - 4, y + 5); g.fill(); const lit = r() < .7; g.fillStyle = css(lit ? [255, 214, 140] : [90, 80, 70], .9); g.beginPath(); g.arc(x, y + 1, 1.5, 0, 7); g.fill(); }
  if (v === 1) {   // choir risers
    for (let k = 0; k < 2; k++) { const z = H + 4 + k * 5; fcs(g, S, r, u0 + .1 + k * .4, v0 + .15, u1 - .3, v0 + .55 + k * .0, H, z, [96, 70, 50], { mat: 'wood', wear: .4 }); }
  }
  fcs(g, S, r, u0 + (u1 - u0) * .3, v1, u0 + (u1 - u0) * .55, v1 + .38, 0, H * .5, mul(wood, 1.1), { mat: 'wood', wear: .5 });
};
const STAGE_H = 16;
FLAT.stairs = function (g, S, p, I) {
  // sunken stairwell: treads descend toward +u, clipped to the opening so they read as a pit
  const { r, v, u0, v0, u1, v1 } = I, W = u1 - u0, steps = 6, SH_ = 10;
  const open = [gp(S, u0, v0, 0), gp(S, u1, v0, 0), gp(S, u1, v1, 0), gp(S, u0, v1, 0)];
  g.save(); pathPoly(g, open); g.clip();
  const bb = bbox(open); g.fillStyle = css([6, 4, 10]); g.fillRect(bb[0] - 2, bb[1] - 2, bb[2] - bb[0] + 4, bb[3] - bb[1] + 80);
  const wb = [gp(S, u0, v0, 0), gp(S, u1, v0, 0), gp(S, u1, v0, -80), gp(S, u0, v0, -80)];
  paintPoly(g, wb, [62, 58, 58], r, { n: 30, ang: 0, ink: false, edge: false, jv: .1 }); prTexFill(g, wb, 'streak', 1); prTexFill(g, wb, 'speck', .7);
  paintPoly(g, [gp(S, u0, v0, 0), gp(S, u0, v1, 0), gp(S, u0, v1, -80), gp(S, u0, v0, -80)], [40, 38, 40], r, { n: 16, ang: 1.57, ink: false, edge: false });
  for (let i = 0; i < steps; i++) {
    const a = u0 + i * W / steps, b = a + W / steps, z = -(i + 1) * SH_ + 4, dk = Math.max(.32, 1 - i * .12);
    const T = [gp(S, a, v0, z), gp(S, b, v0, z), gp(S, b, v1, z), gp(S, a, v1, z)];
    paintPoly(g, T, mul([168, 160, 146], dk), r, { n: 12, ang: 2.68, ink: true, inkw: 1.3, alt: [210, 196, 160], ew: 1, edge: false }); prTexFill(g, T, 'speck', .8);
    // worn hollow in the middle of each tread, chipped nosing
    const m = gp(S, (a + b) / 2, (v0 + v1) / 2, z); g.fillStyle = css([20, 16, 14], .2); g.beginPath(); g.ellipse(m[0], m[1], 14, 5, 0, 0, 7); g.fill();
    prChips(g, r, gp(S, b, v0, z), gp(S, b, v1, z), 3, [80, 76, 70], 2);
    paintPoly(g, [gp(S, b, v0, z), gp(S, b, v1, z), gp(S, b, v1, z - SH_), gp(S, b, v0, z - SH_)], mul([104, 98, 92], dk), r, { n: 6, ang: 2.68, ink: true, inkw: 1.1, edge: false });
  }
  const gl = g.createLinearGradient(...gp(S, u0, (v0 + v1) / 2, 0), ...gp(S, u1, (v0 + v1) / 2, -50)); gl.addColorStop(0, 'rgba(255,130,50,0)'); gl.addColorStop(1, 'rgba(255,130,50,.35)'); g.fillStyle = gl; pathPoly(g, open); g.fill();
  g.restore();
  paintPoly(g, [gp(S, u0 - .04, v1, 0), gp(S, u1, v1, 0), gp(S, u1, v1 + .1, 0), gp(S, u0 - .04, v1 + .1, 0)], [150, 146, 136], r, { n: 8, ang: .46, ink: true, inkw: 1.3, edge: false });
  paintPoly(g, [gp(S, u0 - .1, v0 - .04, 0), gp(S, u0, v0 - .04, 0), gp(S, u0, v1, 0), gp(S, u0 - .1, v1, 0)], [150, 146, 136], r, { n: 8, ang: 2.68, ink: true, inkw: 1.3, edge: false });
  const n = 4;
  for (let i = 0; i <= n; i++) { const t = i / n; vbar(g, S, r, lerp(u0 + .1, u1 - .1, t), v1 + .05, 0, 36, 3, [40, 44, 46]); }
  const ra = gp(S, u0 + .1, v1 + .05, 36), rb = gp(S, u1 - .1, v1 + .05, 36);
  g.strokeStyle = css(INK, .9); g.lineWidth = 4.6; g.beginPath(); g.moveTo(ra[0], ra[1]); g.lineTo(rb[0], rb[1]); g.stroke(); g.strokeStyle = css([96, 100, 100]); g.lineWidth = 3; g.stroke(); g.strokeStyle = css([255, 190, 120], .6); g.lineWidth = 1; g.beginPath(); g.moveTo(ra[0] + 1, ra[1] - 1); g.lineTo(rb[0] + 1, rb[1] - 1); g.stroke();
  const rc = gp(S, u0 + .1, v1 + .05, 18), rd = gp(S, u1 - .1, v1 + .05, 18); g.strokeStyle = css([60, 64, 66], .9); g.lineWidth = 2; g.beginPath(); g.moveTo(rc[0], rc[1]); g.lineTo(rd[0], rd[1]); g.stroke();
  const wg = gp(S, u1 - .3, (v0 + v1) / 2, -30); prLight(S, wg[0], wg[1], 120, [255, 120, 50], .3, .12, 'fire', 'stairs', -30, u1 - .3, (v0 + v1) / 2);
};
FLAT.door = function (g, S, p, I) {   // cellar door/hatch standing at the foot of the stairs
  const { r, v, u0, v0, u1, v1 } = I, c = gp(S, (u0 + u1) / 2, (v0 + v1) / 2, 0);
  const P = [[c[0] - 18, c[1]], [c[0] - 18, c[1] - 44], [c[0] + 18, c[1] - 62], [c[0] + 18, c[1] - 18]];
  paintPoly(g, P, [84, 70, 60], r, { n: 16, ink: true, ang: -.4, edge: false }); prTexFill(g, P, 'grain', .9, (k) => { k.translate(c[0], c[1]); k.transform(1, -.5, 0, 1, 0, 0); k.rotate(1.5708); });
  const P2 = [[c[0] - 13, c[1] - 4], [c[0] - 13, c[1] - 38], [c[0] + 13, c[1] - 52], [c[0] + 13, c[1] - 18]];
  paintPoly(g, P2, [60, 50, 44], r, { n: 8, ink: true, ang: -.4, edge: false });
  g.fillStyle = css([255, 150, 60], .35); pathPoly(g, P2); g.fill();
  for (const dz of [10, 34]) prLine(g, [c[0] - 18, c[1] - dz], [c[0] + 18, c[1] - dz - 18], [40, 40, 42], .9, 3);
  g.fillStyle = css([200, 170, 90]); g.fillRect(c[0] + 8, c[1] - 32, 3, 6);
};
