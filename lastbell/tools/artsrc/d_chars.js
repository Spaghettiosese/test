
/* ============================================================ CHARACTERS */
const SS = 2, SC = 1.22, K = SS * SC, SPW = 90, SPH = 156, SAX = 45, SAY = 132;
const DEF_LOOK = { skin: '#d9a98a', hair: '#2a1d18', hairStyle: 'short', outfit: 'uniform', outfitColor: '#3f4d5c', accent: '#c9892f', build: 'avg', glasses: false, age: 'adult', pose: 'stand', extra: 'none' };
const FACE = { s: [0, 0], se: [45, 0], e: [90, 0], ne: [135, 0], n: [180, 0], nw: [135, 1], w: [90, 1], sw: [45, 1] };
const FACE_ALIAS = { south: 's', north: 'n', east: 'e', west: 'w' };
const _spr = new Map();

function normLook(look) { return Object.assign({}, DEF_LOOK, look || {}); }
function lookKey(l) { return [l.skin, l.hair, l.hairStyle, l.outfit, l.outfitColor, l.accent, l.build, l.glasses ? 1 : 0, l.age, l.extra].join('|'); }

function limb(g, r, x0, y0, x1, y1, w0, w1, col, o) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  const pts = [[x0 + nx * w0 / 2, y0 + ny * w0 / 2], [x1 + nx * w1 / 2, y1 + ny * w1 / 2], [x1 - nx * w1 / 2, y1 - ny * w1 / 2], [x0 - nx * w0 / 2, y0 - ny * w0 / 2]];
  const lit = [mix(col, [255, 190, 120], .3), mix(mul(col, .66), [30, 50, 90], .25), Math.PI, .4, .4];
  paintPoly(g, pts, col, r, Object.assign({ n: 8, sw: 1.7, sl: L * .6, ang: Math.atan2(dy, dx), aj: .12, ink: true, inkw: 1.1, ew: .8, lit, jv: .12 }, o));
  paintEll(g, x1, y1, w1 / 2 + .1, w1 / 2 + .1, col, r, Object.assign({ n: 5, ink: false, edge: false, pn: 10 }, o && o.end));
}
function ik(x0, y0, tx, ty, a, b, dir) {
  let dx = tx - x0, dy = ty - y0, d = Math.hypot(dx, dy); const mx = a + b - .3; if (d > mx) { dx *= mx / d; dy *= mx / d; d = mx; tx = x0 + dx; ty = y0 + dy; }
  if (d < .5) d = .5;
  const ca = clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1), ang = Math.acos(ca) * dir, base = Math.atan2(dy, dx);
  return [x0 + Math.cos(base + ang) * a, y0 + Math.sin(base + ang) * a, tx, ty];
}

function drawFigure(g, r, look, yawDeg, frame, pose, t0) {
  const L = look, yaw = yawDeg * Math.PI / 180, c = Math.cos(yaw), s = Math.sin(yaw), back = c < -0.15;
  const skin = C(L.skin), hairC = C(L.hair), outC = C(L.outfitColor), accC = C(L.accent);
  const build = L.build === 'heavy' ? 1.3 : L.build === 'slim' ? .86 : 1;
  const old = L.age === 'old', teen = L.age === 'teen';
  const H = teen ? 68 : old ? 69 : 74;
  const shW = 11.6 * build + (L.build === 'heavy' ? 1.5 : 0), depth = 7.4 * build;
  const hw = Math.sqrt((shW * c) * (shW * c) + (depth * s) * (depth * s));
  const hang = pose === 'hang', sit = pose === 'sit' || pose === 'wheelchair', wheel = pose === 'wheelchair';
  const slump = pose === 'slump' || (old && pose === 'stand' && false), lean = pose === 'lean';
  const walk = frame > 0, ph = (frame - 1) * Math.PI / 2, sw = walk ? Math.sin(ph) : 0, bob = walk ? Math.abs(Math.sin(ph)) * 1.4 : 0;
  const lift = hang ? 36 : 0;
  const fwdX = s, fwdY = c * .5;                 // screen vector of "forward"
  const legLen = H * .47, hipY = sit ? -(wheel ? 25 : 21) : -legLen - lift - bob;
  const torsoL = H * .30, shY = hipY - torsoL + (slump ? 4 : 0) + (sit ? 1 : 0), neckY = shY - 2.4 - (slump ? 1 : 0), headR = teen ? 7.9 : 8.5;
  const headCy = neckY - headR - 1.2 + (slump ? 4 : 0) + (old ? 1.2 : 0), headCx = (slump ? fwdX * 4.5 : old ? fwdX * 1.6 : 0) + (lean ? -fwdX * 1 : 0);
  const isLab = L.outfit === 'labcoat', isCoat = L.outfit === 'coat', isApron = L.outfit === 'apron';
  const longTop = isLab || isCoat;
  // pants colour
  const pantsC = ({ uniform: mul(outC, .62), coat: [50, 46, 48], apron: [62, 52, 52], overalls: outC, suit: mul(outC, .85), tracksuit: outC, cardigan: [66, 58, 58], labcoat: [58, 56, 60], shirtsleeves: [58, 54, 52] })[L.outfit] || mul(outC, .6);
  const shirtC = ({ uniform: mix(outC, [220, 214, 200], .0), coat: [90, 84, 78], apron: mul(outC, .55), overalls: [168, 150, 120], suit: [214, 208, 192], tracksuit: [210, 210, 204], cardigan: [214, 196, 160], labcoat: [90, 100, 110], shirtsleeves: outC })[L.outfit] || outC;
  const topC = ({ uniform: outC, coat: outC, apron: mix(outC, [90, 70, 60], .4), overalls: [168, 150, 120], suit: outC, tracksuit: outC, cardigan: outC, labcoat: outC, shirtsleeves: outC })[L.outfit] || outC;
  const shoeC = [34, 28, 28];
  const hipHalf = shW * .5 * Math.max(Math.abs(c), .3);
  const ground = -lift - bob * 0;
  // ---------- legs
  const legs = [];
  for (let k = 0; k < 2; k++) {                      // 0 = R (near in profile), 1 = L (far)
    const side = k === 0 ? -1 : 1, hx = side * hipHalf * (1) * (c >= 0 ? 1 : -1) + (side * 0), swK = (k === 0 ? 1 : -1) * sw;
    let kx, ky, fx, fy;
    if (sit) {
      const hx2 = hx, hy2 = hipY;
      kx = hx2 + fwdX * 14 + (wheel ? fwdX * 2 : 0); ky = hy2 + fwdY * 14 * .9 + 1;
      fx = kx + fwdX * (wheel ? 5 : 1); fy = (wheel ? -9 : -1) + fwdY * 14 * .9 + (wheel ? fwdY * 6 : 6) * .3 + (wheel ? 2 : 0);
      if (!wheel) { fy = ground + fwdY * 14 * .9 + 2; }
      legs.push({ hx: hx2, hy: hy2, kx, ky, fx, fy: fy, k });
    } else {
      const st = (hang ? 0 : swK * 7), fwdFoot = st;
      fx = hx + fwdX * fwdFoot + (hang ? side * .6 : 0); fy = ground + fwdY * fwdFoot * .9 - (swK > 0.4 ? 1.4 : 0) - (walk && swK > 0 ? Math.abs(swK) * 1.8 : 0);
      if (lean && k === 1) { fx += -fwdX * 5 * (s < .3 ? 0 : 1) - side * 2; }
      const midX = (hx + fx) / 2 + fwdX * (hang ? 0 : 1.2 + Math.max(0, swK) * 1.8), midY = (hipY + fy) / 2 + fwdY * .6;
      legs.push({ hx, hy: hipY + 1, kx: midX, ky: midY, fx, fy, k });
    }
  }
  const drawLeg = (lg) => {
    const w = 6.6 * build + (L.build === 'heavy' ? 1.2 : 0);
    limb(g, r, lg.hx, lg.hy, lg.kx, lg.ky, w, w * .86, pantsC, { sw: 1.8 });
    limb(g, r, lg.kx, lg.ky, lg.fx, lg.fy - 1.8, w * .86, w * .66, pantsC, { sw: 1.7 });
    // shoe
    const sx = lg.fx + fwdX * 2.4, sy = lg.fy + fwdY * 1.2;
    paintPoly(g, [[lg.fx - 3.2, lg.fy - 3], [lg.fx + 3.2, lg.fy - 3], [sx + 3.4 + fwdX * 1.5, sy + .6], [sx - 3.4, sy + 1.2]], shoeC, r, { n: 5, sw: 1.5, ink: true, inkw: 1.1, lit: [[120, 100, 90], [10, 10, 20], Math.PI, .4, .4] });
  };
  if (hang) {  /* nothing special: limp legs */ }
  const legOrder = (s > .3 || true) ? [legs[1], legs[0]] : legs;
  if (wheel) { /* wheel behind drawn later */ }
  // ---------- wheelchair back parts
  const wr = 15, wrx = Math.max(2.4, wr * (.12 + .88 * s));
  const wcx = (c >= 0 ? 1 : 1) * 0;
  const drawWheel = (side) => {
    const cx = side * (shW + 3.5) * Math.abs(c) + (s > .7 ? side * 0 : 0) - (s > .3 ? fwdX * -2 : 0), cy = -wr - .5;
    g.save(); g.lineCap = 'round';
    g.strokeStyle = css([20, 18, 22], .95); g.lineWidth = 3.4; g.beginPath(); g.ellipse(cx, cy, wrx, wr, 0, 0, 7); g.stroke();
    g.strokeStyle = css([120, 124, 128], .95); g.lineWidth = 1.4; g.beginPath(); g.ellipse(cx, cy, wrx, wr, 0, 0, 7); g.stroke();
    g.strokeStyle = css([255, 190, 120], .5); g.lineWidth = .8; g.beginPath(); g.ellipse(cx, cy, wrx, wr, 0, -2.4, -.6); g.stroke();
    if (wrx > 5) { g.strokeStyle = css([70, 72, 78], .8); g.lineWidth = .7; for (let a = 0; a < 6.28; a += .52) { g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * wrx * .92, cy + Math.sin(a) * wr * .92); g.stroke(); } }
    g.fillStyle = css([150, 150, 150]); g.beginPath(); g.ellipse(cx, cy, Math.max(1.3, wrx * .12), 1.8, 0, 0, 7); g.fill();
    g.restore();
  };
  if (wheel) {
    // frame/seat
    drawWheel(c >= 0 ? 1 : -1);          // far wheel
    paintPoly(g, [[-hipHalf - 5, hipY + 3], [hipHalf + 5, hipY + 3], [hipHalf + 5 + fwdX * 15, hipY + 3 + fwdY * 14], [-hipHalf - 5 + fwdX * 15, hipY + 3 + fwdY * 14]], [44, 40, 44], r, { n: 6, ink: true });
  }
  if (sit && !wheel) {  // simple chair under the sitter
    const sy0 = hipY + 4, hw2 = shW * .9;
    if (!back) paintPoly(g, [[-hw2 - 1 - s * 3, shY + 6], [hw2 + 1 - s * 8, shY + 6], [hw2 + 1 - s * 8, sy0], [-hw2 - 1 - s * 3, sy0]], [88, 60, 40], r, { n: 10, ink: true, ang: 1.57 });
    paintPoly(g, [[-hw2 - 2, sy0], [hw2 + 2, sy0], [hw2 + 2 + fwdX * 8, sy0 + fwdY * 8 + 2], [-hw2 - 2 + fwdX * 8, sy0 + fwdY * 8 + 2]], [118, 82, 54], r, { n: 10, ink: true });
    for (const sx of [-hw2, hw2]) { limb(g, r, sx, sy0 + 1, sx + fwdX * 2, ground + 1, 2.6, 2.2, [88, 60, 40], {}); }
  }
  if (!wheel || true) { for (const lg of legOrder) drawLeg(lg); }
  // ---------- far arm (L) before torso in profile
  const armLen = H * .36, aw = 5.6 * build + (L.build === 'heavy' ? 1 : 0);
  const extra = L.extra || 'none';
  const sleeveC = L.outfit === 'shirtsleeves' ? shirtC : L.outfit === 'apron' ? shirtC : topC;
  const armRoot = (k) => { const side = k === 0 ? -1 : 1; return [side * shW * c * .98 + (k === 0 ? fwdX * 0 : 0), shY + 2.4]; };
  const handTarget = (k) => {
    const [rx, ry] = armRoot(k), swA = (k === 0 ? -1 : 1) * sw, side = k === 0 ? -1 : 1;
    let tx = rx + side * 1.2 * Math.abs(c) + fwdX * swA * 7 * 1.0, ty = ry + armLen * .93 + fwdY * swA * 5;
    let bend = side * (c >= 0 ? 1 : -1) * 1;
    if (hang) { tx = rx + side * 1.5; ty = ry + armLen * .95; }
    if (sit) { tx = rx + fwdX * 8 + side * 1.5 * Math.abs(c); ty = ry + armLen * .62 + fwdY * 6; if (wheel) { tx = rx + fwdX * 10 + side * 3 * Math.abs(c); ty = ry + armLen * .7; } }
    if (lean) { tx = rx * .3 + fwdX * 4; ty = ry + armLen * .5; bend = 1; }                       // folded
    if (extra === 'cigarette' && k === 0) { tx = headCx + fwdX * 5.5 + (side * 0); ty = headCy + 5; bend = -side; }
    if (extra === 'mic' && k === 0) { tx = rx * .4 + fwdX * 8; ty = shY + 8; }
    if (extra === 'clipboard' && k === 0) { tx = rx * .2 + fwdX * 5; ty = shY + 13; bend = side; }
    if (extra === 'broom' && k === 0) { tx = rx + fwdX * 6; ty = shY + 9; }
    if (extra === 'ladle' && k === 0) { tx = fwdX * 8 + rx * .3; ty = shY + 9; bend = side; }
    if (extra === 'book' && k === 0) { tx = rx * .15 + fwdX * 5; ty = shY + 12; }
    if (extra === 'rope' && k === 0) { tx = rx + fwdX * 2; ty = hipY + 8; }
    if (extra === 'megaphone' && k === 0) { tx = fwdX * 7; ty = headCy + 7; bend = -side; }
    if (slump && !sit) { ty += 1.5; }
    return [tx, ty, bend];
  };
  const drawArm = (k) => {
    const [rx, ry] = armRoot(k), [tx, ty, bend] = handTarget(k);
    const e = ik(rx, ry, tx, ty, armLen * .52, armLen * .52, bend || 1);
    const bare = L.outfit === 'shirtsleeves' && false;
    limb(g, r, rx, ry, e[0], e[1], aw, aw * .86, sleeveC, { sw: 1.7 });
    const rolled = L.outfit === 'shirtsleeves' || L.outfit === 'cardigan' && false;
    limb(g, r, e[0], e[1], e[2], e[3], aw * .86, aw * .7, rolled ? skin : sleeveC, { sw: 1.6 });
    if (L.outfit === 'tracksuit') { g.strokeStyle = css(accC, .9); g.lineWidth = 1.2; g.beginPath(); g.moveTo(rx, ry + 1); g.lineTo(e[0], e[1]); g.lineTo(e[2], e[3] - 2); g.stroke(); }
    // hand
    paintEll(g, e[2], e[3] + 1, 2.5, 2.7, skin, r, { n: 5, ink: true, inkw: .9, pn: 10, edge: false });
    if (k === 0 && L.extra === 'armband') { const bx = (rx + e[0]) / 2, by = (ry + e[1]) / 2; paintPoly(g, [[bx - aw * .6, by - 2.4], [bx + aw * .6, by - 2.4], [bx + aw * .6, by + 2.2], [bx - aw * .6, by + 2.2]], [176, 30, 34], r, { n: 4, ink: true, inkw: .9, ew: .6 }); g.fillStyle = css([240, 220, 160]); g.fillRect(bx - 1.2, by - 1, 2.4, 2); }
    return [e[2], e[3] + 1];
  };
  const farArmFirst = s > .35;
  let farHand = null;
  if (farArmFirst) farHand = drawArm(1);
  // ---------- torso
  const bellyBulge = L.build === 'heavy' ? 2.6 : 0, hemY = longTop ? hipY + legLen * .62 : isApron ? hipY + legLen * .55 : hipY + 3;
  const tw = hw * 1.02 + .6, ww = (hw * .88 + bellyBulge * Math.max(.4, s) + .3);
  const tlean = lean ? -fwdX * 2.6 : 0, tslump = slump ? fwdX * 3 : 0;
  const torsoPts = [[-tw + tlean, shY], [-tw * .55 + tlean * .8, shY - 1.6], [tw * .55 + tlean * .8, shY - 1.6], [tw + tlean, shY], [ww + tslump * .2 + tlean * .3, (shY + hipY) / 2], [ww * (longTop ? 1.18 : 1.04) + tslump * .1, hemY], [-ww * (longTop ? 1.18 : 1.04), hemY], [-ww - tslump * .2 + tlean * .3, (shY + hipY) / 2]];
  const lit = [mix(topC, [255, 190, 120], .35), mix(mul(topC, .62), [30, 50, 90], .3), Math.PI - s * .6, .42, .42];
  // shirt layer for open garments
  if (L.outfit === 'cardigan' || L.outfit === 'coat' || L.outfit === 'suit' || L.outfit === 'labcoat') {
    paintPoly(g, torsoPts, shirtC, r, { n: 20, ink: false, edge: false });
  }
  paintPoly(g, torsoPts, topC, r, { n: 46, sw: 2.2, ang: 1.45, aj: .22, ink: true, inkw: 1.3, lit, jv: .13, alt: mix(topC, accC, .3), ew: 1 });
  const torsoMidX = tlean * .5;
  if (!back) {
    const fx0 = fwdX * 3.4 * (s > .8 ? 1 : s) ;   // front-centre line shift (towards facing)
    const cx = torsoMidX + fx0 * 0.7;
    const vis = Math.abs(c) > .3;
    if (L.outfit === 'uniform') {
      if (vis) { g.fillStyle = css([226, 196, 100]); for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(cx, shY + 7 + i * 5.4, .9, 0, 7); g.fill(); } }
      paintPoly(g, [[cx - 5, shY], [cx, shY + 5], [cx + 5, shY], [cx + 3, shY - 1.8], [cx, shY + 1], [cx - 3, shY - 1.8]], mul(topC, 1.25), r, { n: 4, ink: true, inkw: .9, ew: .6 });
      g.fillStyle = css(accC, .95); g.fillRect(-ww, hipY - 1.6, ww * 2, 2.4);                                  // belt
      paintPoly(g, [[-tw, shY], [-tw + 5, shY - .6], [-tw + 4, shY + 2.6], [-tw - .6, shY + 2.6]], accC, r, { n: 3, ink: true, inkw: .8, ew: .5 }); // epaulettes
      paintPoly(g, [[tw, shY], [tw - 5, shY - .6], [tw - 4, shY + 2.6], [tw + .6, shY + 2.6]], accC, r, { n: 3, ink: true, inkw: .8, ew: .5 });
    } else if (L.outfit === 'suit') {
      paintPoly(g, [[cx - 4, shY - 1], [cx, shY + 13], [cx + 4, shY - 1]], shirtC, r, { n: 4, ink: true, inkw: .9 });
      if (vis) paintPoly(g, [[cx - 1.2, shY + 1], [cx + 1.2, shY + 1], [cx + 1.8, shY + 12], [cx, shY + 14], [cx - 1.8, shY + 12]], accC, r, { n: 3, ink: true, inkw: .8, ew: .5 });
      paintPoly(g, [[cx - 4.6, shY - 1], [cx - 1, shY + 15], [cx - 7, shY + 12]], mul(topC, 1.2), r, { n: 4, ink: true, inkw: .9 }); paintPoly(g, [[cx + 4.6, shY - 1], [cx + 1, shY + 15], [cx + 7, shY + 12]], mul(topC, 1.2), r, { n: 4, ink: true, inkw: .9 });
    } else if (L.outfit === 'apron') {
      const ax = cx;
      paintPoly(g, [[ax - ww * .86, shY + 5], [ax + ww * .86, shY + 5], [ax + ww * 1.12, hemY - 1], [ax - ww * 1.12, hemY - 1]], [232, 226, 210], r, { n: 24, ink: true, inkw: 1.2, ang: 1.5, alt: [200, 196, 186], lit: [[255, 246, 226], [150, 150, 170], Math.PI, .4, .4] });
      g.strokeStyle = css(accC, .95); g.lineWidth = 1.2; g.beginPath(); g.moveTo(ax - ww * .8, shY + 5); g.lineTo(ax - tw * .5, shY - .5); g.moveTo(ax + ww * .8, shY + 5); g.lineTo(ax + tw * .5, shY - .5); g.stroke();
      g.fillStyle = css(accC, .7); g.fillRect(ax - 4, hipY - 5, 8, 6); g.fillStyle = css([90, 80, 70], .35); g.fillRect(ax - ww * 1.1, hemY - 3, ww * 2.2, 1.2);
      g.fillStyle = css([140, 70, 50], .35); g.fillRect(ax - 6, hipY - 12, 3, 3);   // stain
    } else if (L.outfit === 'overalls') {
      paintPoly(g, [[cx - ww * .65, shY + 4], [cx + ww * .65, shY + 4], [cx + ww * .85, hipY + 2], [cx - ww * .85, hipY + 2]], outC, r, { n: 20, ink: true, inkw: 1.1, ang: 1.5 });
      g.strokeStyle = css(outC); g.lineWidth = 2; g.beginPath(); g.moveTo(cx - ww * .55, shY + 4); g.lineTo(cx - tw * .45, shY - 1); g.moveTo(cx + ww * .55, shY + 4); g.lineTo(cx + tw * .45, shY - 1); g.stroke();
      g.fillStyle = css(accC); g.fillRect(cx - 3, shY + 7, 6, 4.5); g.fillStyle = css([220, 200, 120]); g.beginPath(); g.arc(cx - ww * .55, shY + 4, 1, 0, 7); g.arc(cx + ww * .55, shY + 4, 1, 0, 7); g.fill();
    } else if (L.outfit === 'tracksuit') {
      g.strokeStyle = css([20, 20, 24], .8); g.lineWidth = 1; g.beginPath(); g.moveTo(cx, shY - 1); g.lineTo(cx, hipY + 2); g.stroke();
      g.strokeStyle = css(accC, .95); g.lineWidth = 1.7; g.beginPath(); g.moveTo(cx - 3, shY); g.lineTo(cx - 3.4, hipY + 2); g.moveTo(cx + 3, shY); g.lineTo(cx + 3.4, hipY + 2); g.stroke();
    } else if (L.outfit === 'cardigan') {
      paintPoly(g, [[cx - 3, shY - 1], [cx + 3, shY - 1], [cx + 2, hipY + 3], [cx - 2, hipY + 3]], shirtC, r, { n: 5, ink: true, inkw: .9 });
      g.fillStyle = css(accC); for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(cx + 3.2, shY + 6 + i * 6, .9, 0, 7); g.fill(); }
    } else if (L.outfit === 'labcoat') {
      g.strokeStyle = css([60, 60, 70], .6); g.lineWidth = 1; g.beginPath(); g.moveTo(cx, shY + 2); g.lineTo(cx, hemY); g.stroke();
      paintPoly(g, [[cx - 5, shY - 1], [cx, shY + 7], [cx + 5, shY - 1], [cx + 3, shY - 2]], [240, 236, 224], r, { n: 4, ink: true, inkw: .9 });
      g.fillStyle = css(accC, .75); g.fillRect(cx + ww * .5, shY + 10, 4, 5); g.fillStyle = css([40, 60, 110], .85); g.fillRect(cx + ww * .5 + 1, shY + 8, 1.2, 3);
      g.fillStyle = css([150, 130, 60], .3); g.fillRect(cx - ww * .8, hemY - 8, 5, 4);
    } else if (L.outfit === 'coat') {
      g.strokeStyle = css([20, 20, 24], .7); g.lineWidth = 1; g.beginPath(); g.moveTo(cx, shY + 2); g.lineTo(cx, hemY); g.stroke();
      g.fillStyle = css([40, 34, 30]); for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(cx - 2, shY + 8 + i * 6, .9, 0, 7); g.arc(cx + 2, shY + 8 + i * 6, .9, 0, 7); g.fill(); }
      paintPoly(g, [[cx - 7, shY - 1.5], [cx - 1, shY + 10], [cx - 8, shY + 8]], mul(topC, 1.25), r, { n: 4, ink: true, inkw: .9 }); paintPoly(g, [[cx + 7, shY - 1.5], [cx + 1, shY + 10], [cx + 8, shY + 8]], mul(topC, 1.25), r, { n: 4, ink: true, inkw: .9 });
      paintPoly(g, [[-tw, shY - 1], [tw, shY - 1], [tw * .8, shY + 2.4], [-tw * .8, shY + 2.4]], accC, r, { n: 4, ink: true, inkw: .8, ew: .5 });    // scarf
    } else if (L.outfit === 'shirtsleeves') {
      g.strokeStyle = css(accC, .95); g.lineWidth = 1.6; g.beginPath(); g.moveTo(cx - ww * .6, shY - 1); g.lineTo(cx - ww * .5, hipY); g.moveTo(cx + ww * .6, shY - 1); g.lineTo(cx + ww * .5, hipY); g.stroke();
      g.fillStyle = css([230, 226, 206], .9); g.fillRect(cx - 1, shY, 2, 5);
    }
  } else if (L.outfit === 'uniform' || L.outfit === 'tracksuit') {  // back details
    g.fillStyle = css(accC, .95); g.fillRect(-ww, hipY - 1.6, ww * 2, 2.4);
  }
  // pants waist band for long garments
  // ---------- near arm(s)
  let hand0 = null;
  if (!farArmFirst) farHand = drawArm(1);
  hand0 = drawArm(0);
  if (wheel) { drawWheel(c >= 0 ? -1 : 1); }
  // ---------- extras
  drawExtra(g, r, L, extra, hand0, farHand, { fwdX, fwdY, s, c, headCx, headCy, shY, hipY, headR, ground });
  // ---------- neck + head
  const hx = headCx, hy = headCy;
  let tilt = 0; if (hang) tilt = .35; else if (slump) tilt = .1 * (fwdX || 1);
  g.save(); g.translate(hx, hy); g.rotate(tilt); g.translate(-hx, -hy);
  if (!hang || true) paintPoly(g, [[hx - 2.6 - torsoMidX * 0 , neckY + 3], [hx + 2.6, neckY + 3], [hx + 2.2, hy + headR * .7], [hx - 2.2, hy + headR * .7]], mul(skin, .85), r, { n: 5, ink: true, inkw: 1, ew: .6 });
  // hair (back layer)
  const hs = L.hairStyle || 'short';
  const hairLit = [mix(hairC, [255, 200, 130], .35), mix(mul(hairC, .5), [20, 30, 70], .3), Math.PI, .5, .55];
  const hopt = { n: 22, sw: 1.5, ang: 1.5, aj: .3, ink: true, inkw: 1.1, lit: hairLit, jv: .15, alt: mix(hairC, [255, 220, 170], .4), ew: .7 };
  const hbx = hx - fwdX * 1.4;
  if (hs === 'long') paintPoly(g, [[hbx - headR - 1.6, hy - 1], [hbx - headR - 2.4, hy + 14], [hbx + headR + 2.4, hy + 14], [hbx + headR + 1.6, hy - 1], [hbx, hy - headR - 1.5]].map(p => [p[0] - fwdX * 1.5 * (s > .5 ? 1 : 0), p[1]]), hairC, r, Object.assign({}, hopt, { n: 36 }));
  if (hs === 'braid' && back) paintPoly(g, [[hx - 3, hy + 2], [hx + 3, hy + 2], [hx + 3.4, hy + 24], [hx - 3.4, hy + 24]], hairC, r, hopt);
  if (hs === 'bob') paintPoly(g, [[hbx - headR - 1.8, hy - 1], [hbx - headR - 2.2, hy + 7], [hbx + headR + 2.2, hy + 7], [hbx + headR + 1.8, hy - 1], [hbx, hy - headR - 1.6]], hairC, r, Object.assign({}, hopt, { n: 28 }));
  if (hs === 'bun') paintEll(g, hx - fwdX * (s > .5 ? 4.6 : 0), hy - headR - 2.8, 3.8, 3.4, hairC, r, { n: 8, ink: true, inkw: 1, lit: hairLit });
  // head
  const ear = !back && (s > .4);
  const hRx = headR * (.94 + .1 * s), hRy = headR * 1.1;
  paintPoly(g, ellPts(hx, hy, hRx, hRy, 22, 0, r, .02), skin, r, { n: 26, sw: 1.6, ang: 1.2, aj: .4, ink: true, inkw: 1.3, lit: [mix(skin, [255, 214, 160], .4), mix(mul(skin, .62), [40, 40, 100], .35), Math.PI - s * .5, .55, .6], jv: .08, alt: mix(skin, [220, 120, 100], .4), ew: 1 });
  // ear
  if (s > .25 && s < .98 || s >= .98) { const ex = hx - (back ? 0 : 0) - (c >= 0 ? -1 : -1) * 0; paintEll(g, hx - hRx * (s > .9 ? 0 : 0.95) - (s > .9 ? -1 : 0), hy + 1.4, 1.5, 2.3, mul(skin, .9), r, { n: 4, ink: true, inkw: .8, pn: 8 }); }
  // face
  if (!back) {
    const fx = hx + s * 4.0 + (c >= 0 ? 0 : 0), eyY = hy + .6, eyDx = 3.2 * Math.max(c, 0) + .0, mood = L._mood;
    const hidden = hang;
    if (!hidden) {
      const eye = (ex, vis) => {
        if (!vis) return;
        g.fillStyle = css([236, 230, 214]); g.beginPath(); g.ellipse(ex, eyY, 1.8, 1.3, 0, 0, 7); g.fill();
        g.fillStyle = css([28, 22, 24]); g.beginPath(); g.arc(ex + s * .5, eyY, 1.0, 0, 7); g.fill();
        g.strokeStyle = css(INK, .8); g.lineWidth = .7; g.beginPath(); g.ellipse(ex, eyY, 1.8, 1.3, 0, 0, 7); g.stroke();
      };
      if (c > .35) { eye(fx - eyDx, true); eye(fx + eyDx, true); } else eye(fx + 1.2 * s, true);
      if (c > .35 && s > .2) { /* far eye foreshortened */ }
      g.strokeStyle = css(mul(hairC, .6), .95); g.lineWidth = 1.1; g.lineCap = 'round';
      if (c > .35) { g.beginPath(); g.moveTo(fx - eyDx - 2, eyY - 2.6); g.lineTo(fx - eyDx + 1.8, eyY - 2.9 + (L.age === 'old' ? .4 : 0)); g.moveTo(fx + eyDx - 1.8, eyY - 2.9); g.lineTo(fx + eyDx + 2, eyY - 2.6); g.stroke(); }
      else { g.beginPath(); g.moveTo(fx - .6, eyY - 2.7); g.lineTo(fx + 2.8, eyY - 2.5); g.stroke(); }
      // nose
      g.strokeStyle = css(mul(skin, .6), .9); g.lineWidth = 1; g.beginPath();
      if (s > .7) { g.moveTo(hx + hRx - .4, hy + .5); g.lineTo(hx + hRx + 2, hy + 3.2); g.lineTo(hx + hRx - .4, hy + 3.6); } else { g.moveTo(fx + .4, eyY + 1); g.lineTo(fx - .6, eyY + 3.4); g.lineTo(fx + 1, eyY + 3.5); }
      g.stroke();
      // mouth
      g.strokeStyle = css(mul(skin, .5), .95); g.lineWidth = 1.1; g.beginPath();
      if (s > .7) { g.moveTo(hx + hRx - 1.2, hy + 5.6); g.lineTo(hx + hRx - 3.4, hy + 5.8); } else { g.moveTo(fx - 2, hy + 5.6); g.quadraticCurveTo(fx, hy + 6.1, fx + 2, hy + 5.6); }
      g.stroke();
      if (teen) { g.fillStyle = css([230, 110, 100], .22); g.beginPath(); g.ellipse(fx - 3.4 * Math.max(c, .3), hy + 3.6, 1.8, 1.2, 0, 0, 7); g.ellipse(fx + 3.4 * Math.max(c, .3), hy + 3.6, 1.8, 1.2, 0, 0, 7); g.fill(); }
      if (old) { g.strokeStyle = css(mul(skin, .55), .55); g.lineWidth = .7; g.beginPath(); g.moveTo(fx - 4 * Math.max(c, .3), hy + 2); g.lineTo(fx - 3 * Math.max(c, .3), hy + 5.4); g.moveTo(fx + 4 * Math.max(c, .3), hy + 2); g.lineTo(fx + 3 * Math.max(c, .3), hy + 5.4); g.moveTo(fx - 3, hy - 4); g.lineTo(fx + 3, hy - 4); g.stroke(); }
      if (L.glasses) {
        g.strokeStyle = css([34, 28, 28], .95); g.lineWidth = 1; 
        if (c > .35) { g.beginPath(); g.ellipse(fx - eyDx, eyY, 2.4, 2.2, 0, 0, 7); g.ellipse(fx + eyDx, eyY, 2.4, 2.2, 0, 0, 7); g.moveTo(fx - eyDx + 2.4, eyY); g.lineTo(fx + eyDx - 2.4, eyY); g.stroke(); }
        else { g.beginPath(); g.ellipse(fx + 1.2 * s, eyY, 2.4, 2.4, 0, 0, 7); g.moveTo(fx + 1.2 * s - 2.4, eyY); g.lineTo(hx - hRx, eyY - .4); g.stroke(); }
        g.fillStyle = css([255, 250, 230], .55); g.fillRect(fx - eyDx - 1.2, eyY - 1.8, 1.2, 1);
      }
    } else { g.fillStyle = css([10, 8, 14], .4); g.beginPath(); g.ellipse(hx + 1, hy + 2, hRx * .8, hRy * .7, 0, 0, 7); g.fill(); }
  }
  // hair (front layer)
  const topY = hy - hRy;
  const cap = (extraBack) => [[hx - hRx - .8, hy + (extraBack ? 3 : -1)], [hx - hRx - .6, hy - hRy * .55], [hx - hRx * .4, topY - 1.4], [hx + hRx * .4, topY - 1.4], [hx + hRx + .6, hy - hRy * .55], [hx + hRx + .8, hy + (extraBack ? 3 : -1)]];
  const shift = (pts, dx) => pts.map(p => [p[0] + dx, p[1]]);
  if (hs === 'short' || hs === 'slick' || hs === 'braid' || hs === 'long' || hs === 'bob' || hs === 'bun') {
    if (back) {
      paintPoly(g, ellPts(hx, hy - .6, hRx + .7, hRy + .5, 20, 0, r, .02), hairC, r, hopt);
    } else {
      const pts = cap(false).concat([[hx + hRx * .8 + s * 2, hy - hRy * .38], [hx + s * 4.2, hy - hRy * .6 + (hs === 'slick' ? -1 : 1.4)], [hx - hRx * .7 + s * 2, hy - hRy * .38]]);
      paintPoly(g, pts, hairC, r, hopt);
      if (hs === 'long' || hs === 'bob') { for (const sd of [-1, 1]) { if (s > .75 && sd * fwdX > 0) continue; paintPoly(g, [[hx + sd * (hRx + .5), hy - 2], [hx + sd * (hRx + 2.4), hy + (hs === 'long' ? 11 : 5)], [hx + sd * (hRx - 1.6), hy + (hs === 'long' ? 11 : 5)], [hx + sd * (hRx - 1.4), hy - 2]], hairC, r, Object.assign({}, hopt, { n: 10 })); } }
      if (hs === 'slick') { g.strokeStyle = css([255, 230, 190], .45); g.lineWidth = .8; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(hx - 4 + i * 2.6, topY + 1.5); g.quadraticCurveTo(hx - 3 + i * 2.6 + 3, topY - .4, hx - 1 + i * 2.6 - fwdX * 3, hy - 3); g.stroke(); } }
    }
    if (hs === 'braid') { const bx = !back ? hx - 6.5 * (s > .8 ? -1 : 1) * (s < .3 ? 1 : 0) - (s > .3 ? -fwdX * -5 : 0) : hx; if (!back) { paintPoly(g, [[bx - 2.4, hy + 5], [bx + 2.4, hy + 5], [bx + 2.8, hy + 24], [bx - 2.8, hy + 24]], hairC, r, Object.assign({}, hopt, { n: 10 })); g.strokeStyle = css(mul(hairC, .5), .8); g.lineWidth = .8; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(bx - 2.4, hy + 7 + i * 3.4); g.lineTo(bx + 2.4, hy + 9 + i * 3.4); g.stroke(); } g.fillStyle = css(accC); g.fillRect(bx - 2.6, hy + 23, 5.2, 1.8); } else { g.strokeStyle = css(mul(hairC, .5), .8); g.lineWidth = .8; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(hx - 3, hy + 4 + i * 3.4); g.lineTo(hx + 3, hy + 6 + i * 3.4); g.stroke(); } g.fillStyle = css(accC); g.fillRect(hx - 3, hy + 24, 6, 1.8); } }
  } else if (hs === 'buzz') {
    if (back) paintPoly(g, ellPts(hx, hy - 1.4, hRx + .3, hRy - .6, 18, 0, r, .02), mix(hairC, skin, .25), r, { n: 12, ink: false, edge: false });
    else paintPoly(g, cap(false).concat([[hx + hRx * .6, hy - hRy * .55], [hx, hy - hRy * .66], [hx - hRx * .6, hy - hRy * .55]]), mix(hairC, skin, .25), r, { n: 14, ink: false, edge: false, sw: 1 });
  } else if (hs === 'curly') {
    const rnd = RNG(hashStr(lookKey(L)));
    for (let i = 0; i < 12; i++) { const a = -3.3 + i * .54, d = hRx * 1.02; const px = hx + Math.cos(a) * d, py = hy - .6 + Math.sin(a) * (hRy * 1.0); paintEll(g, px, py, 3.7, 3.5, jit(hairC, rnd, .12), rnd, { n: 7, ink: true, inkw: .9, pn: 10, edge: false, lit: hairLit }); }
    for (let i = 0; i < 5; i++) paintEll(g, hx - 6 + i * 3, topY + 1, 3.6, 3.4, jit(hairC, rnd, .12), rnd, { n: 5, ink: true, inkw: .9, pn: 10, edge: false });
    if (back) paintEll(g, hx, hy - .6, hRx + .8, hRy + .2, hairC, r, { n: 14, ink: false });
  } else if (hs === 'cap') {
    const capC = outC;
    paintPoly(g, [[hx - hRx - 1, hy - 2.4], [hx - hRx, topY - 1], [hx + hRx, topY - 1], [hx + hRx + 1, hy - 2.4]], capC, r, { n: 14, ink: true, inkw: 1.2, lit: [mix(capC, [255, 200, 140], .4), mul(capC, .5), Math.PI, .5, .5] });
    if (!back) paintPoly(g, [[hx - hRx - .6, hy - 2.4], [hx + hRx + .6, hy - 2.4], [hx + hRx + 3 + s * 6, hy - .6], [hx - hRx - 3 + s * 6 + (s < .3 ? 0 : 0), hy - .6]], mul(capC, .6), r, { n: 8, ink: true, inkw: 1 });
    g.fillStyle = css(accC); g.beginPath(); g.arc(hx + s * 2.2, hy - 5, 1.2, 0, 7); g.fill();
  } else if (hs === 'bald') {
    g.fillStyle = css([255, 240, 210], .4); g.beginPath(); g.ellipse(hx + 2.2, topY + 2.2, 2.2, 1.2, -.3, 0, 7); g.fill();
    if (L.hair && lum(hairC) > 20) { for (const sd of [-1, 1]) { paintPoly(g, [[hx + sd * (hRx + .6), hy - 3], [hx + sd * (hRx + .4), hy + 1.2], [hx + sd * (hRx - 1.6), hy - .2], [hx + sd * (hRx - 1.2), hy - 3.4]], hairC, r, { n: 5, ink: false }); } }
  }
  g.restore();
}

function drawExtra(g, r, L, extra, h0, h1, P) {
  if (extra === 'none' || !h0) return;
  const [hx, hy] = h0, f = P.fwdX || 1;
  if (extra === 'cigarette') {
    g.strokeStyle = css([240, 236, 224]); g.lineWidth = 1.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(hx - f * 1, hy - 1.2); g.lineTo(hx + f * 4.2, hy - 2.6); g.stroke();
    g.fillStyle = css([255, 140, 50]); g.beginPath(); g.arc(hx + f * 4.8, hy - 2.7, 1.1, 0, 7); g.fill();
    g.strokeStyle = css([210, 210, 220], .35); g.lineWidth = 1; g.beginPath(); g.moveTo(hx + f * 5, hy - 4); g.quadraticCurveTo(hx + f * 8, hy - 9, hx + f * 4, hy - 14); g.stroke();
  } else if (extra === 'mic') {
    g.strokeStyle = css([60, 60, 64]); g.lineWidth = 1.8; g.beginPath(); g.moveTo(hx, hy + 1); g.lineTo(hx + f * 2, hy - 7); g.stroke(); paintEll(g, hx + f * 2.4, hy - 9, 2.6, 3, [150, 154, 158], r, { n: 4, ink: true, pn: 10, inkw: .8 });
  } else if (extra === 'clipboard') {
    g.save(); g.translate(hx, hy - 2); g.rotate(-.18 * f); paintPoly(g, [[-5, -9], [5, -9], [5, 5], [-5, 5]], [150, 106, 66], r, { n: 6, ink: true, inkw: 1, ew: .6 }); g.fillStyle = css([236, 230, 208]); g.fillRect(-4, -7, 8, 11); scribbleLines(g, r, -3.2, -4.4, 6, 3, 2.6, [40, 40, 50], .8); g.fillStyle = css([190, 180, 120]); g.fillRect(-2, -10, 4, 2); g.restore();
  } else if (extra === 'broom') {
    g.strokeStyle = css([128, 96, 60]); g.lineWidth = 2; g.beginPath(); g.moveTo(hx + f * 1, hy - 38); g.lineTo(hx - f * 2, P.ground - 2); g.stroke(); g.strokeStyle = css(INK, .5); g.lineWidth = .6; g.stroke();
    paintPoly(g, [[hx - f * 2 - 4, P.ground - 12], [hx - f * 2 + 4, P.ground - 12], [hx - f * 2 + 7, P.ground + 1], [hx - f * 2 - 7, P.ground + 1]], [190, 160, 90], r, { n: 10, ink: true, inkw: 1, ang: 1.57, alt: [120, 90, 50] });
    g.strokeStyle = css([80, 60, 30], .9); g.lineWidth = 1; g.beginPath(); g.moveTo(hx - f * 2 - 4, P.ground - 9); g.lineTo(hx - f * 2 + 4, P.ground - 9); g.stroke();
  } else if (extra === 'ladle') {
    g.strokeStyle = css([170, 170, 170]); g.lineWidth = 1.5; g.beginPath(); g.moveTo(hx, hy + 1); g.lineTo(hx + f * 4, hy - 12); g.stroke(); paintEll(g, hx + f * 4.4, hy - 14, 3.4, 2.6, [150, 154, 150], r, { n: 4, ink: true, pn: 10, inkw: .9 });
  } else if (extra === 'book') {
    g.save(); g.translate(hx, hy - 3); g.rotate(-.12 * f); paintPoly(g, [[-6, -4], [6, -4], [6, 4], [-6, 4]], [90, 50, 44], r, { n: 8, ink: true, inkw: 1 }); g.fillStyle = css([226, 214, 180]); g.fillRect(-5, 3, 10, 1.4); g.fillStyle = css([210, 170, 90]); g.fillRect(-4, -2, 6, 1.2); g.restore();
  } else if (extra === 'rope') {
    g.strokeStyle = css([176, 144, 96]); g.lineWidth = 2.2; g.lineCap = 'round'; g.beginPath(); g.moveTo(hx, hy); g.bezierCurveTo(hx + 3, hy + 10, hx - 3, hy + 16, hx + 1, hy + 24); g.stroke(); g.strokeStyle = css(INK, .4); g.lineWidth = .6; g.stroke();
  } else if (extra === 'megaphone') {
    paintPoly(g, [[hx - 2, hy - 2], [hx + f * 3, hy - 3], [hx + f * 10, hy - 8], [hx + f * 10, hy + 3], [hx + f * 3, hy + 1]], [190, 60, 50], r, { n: 8, ink: true, inkw: 1 });
  }
}

function addOutlineAndRim(src, W, H, rimCol, hangRope) {
  const sz = [W, H], out = mk(W, H), og = ctx2(out);
  // rim light (warm, right/top) + cool fill (left)
  const tmp = mk(W, H), tg = ctx2(tmp);
  tg.drawImage(src, 0, 0); tg.globalCompositeOperation = 'destination-out'; tg.drawImage(src, -1.5 * K, .7 * K); tg.globalCompositeOperation = 'source-in'; tg.fillStyle = css(rimCol, .8); tg.fillRect(0, 0, W, H);
  const tmp2 = mk(W, H), t2 = ctx2(tmp2);
  t2.drawImage(src, 0, 0); t2.globalCompositeOperation = 'destination-out'; t2.drawImage(src, 1.4 * K, -.4 * K); t2.globalCompositeOperation = 'source-in'; t2.fillStyle = 'rgba(70,130,150,.65)'; t2.fillRect(0, 0, W, H);
  const body = mk(W, H), bg = ctx2(body);
  bg.drawImage(src, 0, 0); bg.drawImage(tmp2, 0, 0); bg.drawImage(tmp, 0, 0);
  // dark ink outline (dilated silhouette underneath)
  const sil = mk(W, H), sg = ctx2(sil);
  const R = 1.2 * K;
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.2832; sg.drawImage(src, Math.cos(a) * R, Math.sin(a) * R); }
  sg.globalCompositeOperation = 'source-in'; sg.fillStyle = 'rgb(20,14,18)'; sg.fillRect(0, 0, W, H);
  og.drawImage(sil, 0, 0); og.drawImage(body, 0, 0);
  return out;
}
function greenOutline(spr) {
  if (spr.hl) return spr.hl;
  const W = spr.c.width, H = spr.c.height, c = mk(W, H), g = ctx2(c), R = 2.3 * SS * .8;
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.2832; g.drawImage(spr.c, Math.cos(a) * R, Math.sin(a) * R); }
  g.globalCompositeOperation = 'source-in'; g.fillStyle = 'rgb(96,255,120)'; g.fillRect(0, 0, W, H);
  // soft glow
  const c2 = mk(W, H), g2 = ctx2(c2); g2.globalAlpha = .35; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.2832; g2.drawImage(c, Math.cos(a) * R * 1.8, Math.sin(a) * R * 1.8); }
  g2.globalAlpha = 1; g2.drawImage(c, 0, 0);
  spr.hl = c2; return c2;
}

function figKey(L, facing, frame) { const pose = L.pose || 'stand'; return lookKey(L) + '#' + pose + '#' + facing + '#' + (pose === 'stand' || pose === 'slump' || pose === 'lean' ? frame : 0); }
const _warmQ = [];
function queueFigure(look, facing, frame, pose) { _warmQ.push([look, facing, frame, pose]); }
function warmStep(maxN) {   // bake queued sprites one at a time (called with spare frame time)
  while (maxN-- > 0 && _warmQ.length) { const q = _warmQ.shift(); getFigure(q[0], q[1], q[2], q[3]); }
}
/* returns a ready sprite without ever blocking on animation frames: walk frames fall back to idle while they are baked in the background */
function figureNow(look, facing, frame, pose) {
  const L = normLook(look); if (pose) L.pose = pose; facing = FACE_ALIAS[facing] || facing; if (!FACE[facing]) facing = 's';
  const hit = _spr.get(figKey(L, facing, frame)); if (hit) return hit;
  if (frame > 0) { for (let f = 1; f <= 4; f++) if (!_spr.get(figKey(L, facing, f))) queueFigure(look, facing, f, pose); const idle = _spr.get(figKey(L, facing, 0)); if (idle) return idle; }
  return getFigure(look, facing, frame, pose);
}
function getFigure(look, facing, frame, poseOver) {
  const L = normLook(look); if (poseOver) L.pose = poseOver;
  facing = FACE_ALIAS[facing] || facing; const fd = FACE[facing] || FACE.s; if (!FACE[facing]) facing = 's';
  const pose = L.pose || 'stand';
  const key = figKey(L, facing, frame);
  let spr = _spr.get(key); if (spr) return spr;
  const W = Math.round(SPW * K), Hh = Math.round(SPH * K), c = mk(W, Hh), g = ctx2(c);
  g.save(); g.scale(K, K);
  if (fd[1]) { g.translate(SPW, 0); g.scale(-1, 1); }
  g.translate(SAX, SAY);
  const r = RNG(hashStr(key));
  const rot = pose === 'lie';
  if (rot) { g.rotate(-Math.PI / 2); g.translate(0, -2); }
  if (pose === 'hang') {   // rope drawn behind the figure, from the neck up to the hoop
    L.extra = 'none';
    g.save(); g.lineCap = 'round'; const hh = (L.age === 'teen' ? 68 : 74), top = -(hh * .47) - 36 - hh * .30 - 8, rx = fd[1] ? -20 : 20;
    g.strokeStyle = css(INK, .9); g.lineWidth = 3.4; g.beginPath(); g.moveTo(0, top); g.lineTo(rx, -118); g.stroke();
    g.strokeStyle = css([190, 156, 104]); g.lineWidth = 2; g.stroke(); g.restore();
  }
  drawFigure(g, r, L, fd[0], (pose === 'stand' || pose === 'slump' || pose === 'lean') ? frame : 0, pose === 'lie' ? 'stand' : pose);
  g.restore();
  if (pose === 'hang') { g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(14,16,30,.3)'; g.fillRect(0, 0, W, Hh); g.restore(); }
  const rim = C(look && look._rim || [255, 150, 70]);
  const out = addOutlineAndRim(c, W, Hh, rim);
  spr = { c: out, ax: SAX * K, ay: SAY * K, w: W, h: Hh, hl: null, hang: pose === 'hang' ? { x: (fd[1] ? -20 : 20) * SC, y: -118 * SC } : null };
  _spr.set(key, spr);
  if (_spr.size > 600) { const k = _spr.keys().next().value; _spr.delete(k); }
  return spr;
}
