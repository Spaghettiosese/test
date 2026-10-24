
/* ------------------------------------------------------- moods / time */
const MOODS = {
  umber: { amb: [.86, .76, .66], bake: [.97, .90, .80], glow: [255, 170, 90], floorMix: [120, 80, 50] },
  warm:  { amb: [.98, .86, .72], bake: [1.0, .95, .86], glow: [255, 150, 70], floorMix: [150, 90, 40] },
  cold:  { amb: [.76, .88, .95], bake: [.88, .96, 1.0], glow: [255, 190, 120], floorMix: [60, 100, 110] },
  dusk:  { amb: [.82, .88, .96], bake: [.90, .96, 1.0], glow: [255, 140, 70], floorMix: [60, 80, 90] },
  sick:  { amb: [.80, .94, .72], bake: [.92, 1.0, .88], glow: [220, 230, 130], floorMix: [80, 110, 70] },
  ember: { amb: [.62, .53, .50], bake: [.9, .82, .78], glow: [255, 120, 40], floorMix: [90, 40, 20] },
  // --- art2 moods. grade = how much the time-of-day tint is allowed through (they are self-lit looks)
  lamp:  { amb: [1.0, .84, .60], bake: [1.0, .91, .74], glow: [255, 188, 84], floorMix: [150, 100, 40], grade: .45, lamp: true, wash: [255, 170, 60, .07] },
  neon:  { amb: [.66, .74, 1.0], bake: [.84, .90, 1.04], glow: [255, 96, 150], floorMix: [60, 60, 110], grade: .35, sky: [[18, 20, 54], [196, 74, 112]], dapple: [255, 120, 170], neon: true, wash: [40, 140, 190, .07] },
  storm: { amb: [.66, .78, .93], bake: [.82, .92, 1.02], glow: [150, 196, 255], floorMix: [60, 80, 100], grade: .3, sky: [[40, 50, 66], [118, 130, 146]], dapple: [170, 204, 255], storm: true, wash: [90, 130, 190, .07] }
};
const TIMEKEYS = [
  [0,    [.36, .43, .72], [20, 40, 120, .08]],
  [360,  [.55, .65, .86], [60, 90, 150, .06]],
  [450,  [.90, .95, 1.0], [255, 214, 140, .07]],
  [600,  [1, 1, 1],       [255, 232, 176, .05]],
  [780,  [1, .98, .94],   [255, 240, 200, .02]],
  [960,  [1, .90, .76],   [255, 170, 60, .07]],
  [1080, [.88, .80, .84], [255, 110, 40, .08]],
  [1170, [.62, .72, .88], [20, 100, 120, .09]],
  [1260, [.42, .50, .76], [20, 40, 120, .08]],
  [1440, [.36, .43, .72], [20, 40, 120, .08]]
];
function timeTint(m) {
  m = ((m % 1440) + 1440) % 1440;
  for (let i = 1; i < TIMEKEYS.length; i++) if (m <= TIMEKEYS[i][0]) {
    const a = TIMEKEYS[i - 1], b = TIMEKEYS[i], t = (m - a[0]) / (b[0] - a[0]);
    return { mul: mix(a[1], b[1], t), add: [lerp(a[2][0], b[2][0], t), lerp(a[2][1], b[2][1], t), lerp(a[2][2], b[2][2], t), lerp(a[2][3], b[2][3], t)] };
  }
  return { mul: [.4, .45, .7], add: [20, 40, 120, .08] };
}
function bucketOf(m) { if (m === undefined || m === null || isNaN(m)) m = 600; m = ((m % 1440) + 1440) % 1440; return m < 360 ? 4 : m < 540 ? 0 : m < 840 ? 1 : m < 1050 ? 2 : m < 1200 ? 3 : 4; }
const SKY = [  // top, bottom per bucket
  [[190, 196, 170], [250, 220, 160]], [[170, 190, 200], [226, 226, 214]], [[200, 170, 110], [250, 180, 90]],
  [[40, 90, 110], [240, 130, 70]], [[14, 22, 60], [34, 48, 96]]];
const DAPPLE = [[255, 226, 170], [255, 240, 200], [255, 184, 96], [255, 150, 80], [150, 180, 255]];
const DAPPLE_A = [1, 1, 1.1, .9, .45];

/* ---------------------------------------------------------- scene frames */
function floorFrame(ctx, S) { ctx.translate(S.tx, S.ty); ctx.transform(.5, .25, -.5, .25, 0, 0); }
function wallFrame(ctx, S, side) { // local: u px along wall (64/tile), v down from wall top; v = WALLH is the floor line
  if (side === 'l') { ctx.translate(S.tx, S.ty - WALLH); ctx.transform(-.5, .25, 0, 1, 0, 0); }
  else { ctx.translate(S.tx, S.ty - WALLH); ctx.transform(.5, .25, 0, 1, 0, 0); }
}
/* generic local frame for a free-standing wall-plane at arbitrary place:  u0,v0 tile-edge start, dir 'r' or 'l' */
function wallFrameAt(ctx, S, side, u0, z0) {  // origin at base point of wall at tile coordinate u0, z up flipped: local y downward from z0
  const base = side === 'l' ? gp(S, 0, u0, z0) : gp(S, u0, 0, z0);
  ctx.translate(base[0], base[1]);
  if (side === 'l') ctx.transform(-.5, .25, 0, 1, 0, 0); else ctx.transform(.5, .25, 0, 1, 0, 0);
}

/* ------------------------------------------------------------------ floors */
function floorPal(S) {
  const m = S.loc.mood;
  if (S.loc.floor === 'checker') {
    if (m === 'warm') return { a: [218, 190, 134], b: [200, 104, 52], c: [60, 124, 120], d: [150, 60, 40] };
    if (m === 'cold') return { a: [150, 168, 150], b: [96, 124, 122], c: [190, 176, 130], d: [70, 96, 100] };
    return { a: [180, 176, 140], b: [110, 130, 110], c: [190, 150, 90], d: [80, 100, 90] };
  }
  return null;
}
function paintFloor(ctx, S) {
  const loc = S.loc, r = S.r, W = lw(loc) * 64, H = lh(loc) * 64, type = loc.floor || 'wood';
  ctx.save(); floorFrame(ctx, S);
  ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  const gr = (c) => mul(C(c), S.mood.bake);
  ctx.fillStyle = css(gr([60, 44, 38])); ctx.fillRect(0, 0, W, H);
  if (type === 'wood') {
    const base = [[150, 104, 62], [132, 88, 54], [162, 116, 72], [118, 78, 50]];
    for (let v = 0, row = 0; v < H; v += 15, row++) {
      let u = -r() * 120;
      while (u < W) {
        const len = r.r(110, 280), c = jit(gr(r.p(base)), r, .1);
        const x0 = Math.max(0, u), x1 = Math.min(W, u + len);
        if (x1 > x0) {
          paintRect(ctx, x0, v, x1 - x0, 14, c, r, { ang: 0, aj: .05, sw: 2.4, sl: 70, n: (x1 - x0) / 7, jv: .13, alt: [190, 140, 80], ha: .5, ew: 1, light: [0, -1], la: .7 });
          if (r() < .35) { ctx.fillStyle = css(gr([40, 24, 18]), .18); ctx.fillRect(x0 + r() * (x1 - x0), v + r() * 12, r.r(8, 26), 1.5); }
          ctx.fillStyle = css(gr([22, 14, 12]), .7); ctx.fillRect(x1 - 1, v, 1.6, 14);
          if (r() < .5) { ctx.fillStyle = css([20, 12, 10], .55); ctx.fillRect(x0 + 4, v + 6, 1.6, 1.6); ctx.fillRect(x1 - 5, v + 6, 1.6, 1.6); }
        }
        u += len;
      }
      ctx.fillStyle = css(gr([20, 12, 10]), .65); ctx.fillRect(0, v + 13.4, W, 1.6);
    }
  } else if (type === 'checker') {
    const P = floorPal(S);
    for (let j = 0; j < lh(loc); j++) for (let i = 0; i < lw(loc); i++) {
      const par = (i + j) & 1, hr = lat(i, j, S.seed);
      let c = par ? P.b : P.a;
      if (hr < .1) c = P.c; else if (hr > .94) c = P.d;
      c = jit(gr(c), r, .1);
      paintRect(ctx, i * 64 + 1, j * 64 + 1, 62, 62, c, r, { n: 22, sw: 4, sl: 30, ang: (par ? .3 : -.9) + r.g() * .15, alt: par ? [230, 130, 60] : [90, 150, 140], jv: .12, ha: .55, la: .4, ew: 1.4 });
      // worn centre / chips
      if (r() < .4) { ctx.fillStyle = css([255, 240, 200], .08); ctx.beginPath(); ctx.ellipse(i * 64 + r.r(16, 48), j * 64 + r.r(16, 48), r.r(6, 16), r.r(5, 12), r() * 3, 0, 7); ctx.fill(); }
      if (r() < .12) { ctx.strokeStyle = css([30, 20, 20], .5); ctx.lineWidth = 1; ctx.beginPath(); const x = i * 64 + r.r(8, 56), y = j * 64 + r.r(8, 56); ctx.moveTo(x, y); ctx.lineTo(x + r.r(-18, 18), y + r.r(-18, 18)); ctx.lineTo(x + r.r(-24, 24), y + r.r(-24, 24)); ctx.stroke(); }
    }
    // grout lines
    ctx.strokeStyle = css(gr([34, 26, 24]), .75); ctx.lineWidth = 1.7;
    ctx.beginPath(); for (let i = 0; i <= lw(loc); i++) { ctx.moveTo(i * 64, 0); ctx.lineTo(i * 64, H); } for (let j = 0; j <= lh(loc); j++) { ctx.moveTo(0, j * 64); ctx.lineTo(W, j * 64); } ctx.stroke();
    if (loc.id === 'canteen') medallion(ctx, S, 5.5 * 64, 7.5 * 64, 2.1 * 64, gr);
    if (loc.id === 'gym') gymLines(ctx, S, gr);
  } else if (type === 'cobble') {
    for (let j = 0; j < lh(loc); j++) for (let i = 0; i < lw(loc); i++) {
      for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
        const cx = i * 64 + (a + .5) * 21.3 + r.r(-3, 3), cy = j * 64 + (b + .5) * 21.3 + r.r(-3, 3), rx = r.r(8.5, 10.8), ry = r.r(8.2, 10.4);
        const t = r(), c = jit(gr(t < .5 ? [118, 120, 124] : t < .8 ? [104, 100, 100] : [134, 124, 108]), r, .12);
        paintPoly(ctx, ellPts(cx, cy, rx, ry, 9, r() * 3, r, .12), c, r, { n: 4, sw: 3.5, sl: 12, ang: r() * 3, edge: true, ew: 1.2, ink: false, alt: [90, 110, 120], jv: .1 });
      }
    }
    // moss / puddles
    for (let i = 0; i < 26; i++) { const x = r() * W, y = r() * H; ctx.fillStyle = css([70, 100, 60], .1 + r() * .1); ctx.beginPath(); ctx.ellipse(x, y, r.r(10, 40), r.r(8, 28), r() * 3, 0, 7); ctx.fill(); }
    for (let i = 0; i < 5; i++) { const x = r.r(100, W - 100), y = r.r(100, H - 100), rx = r.r(30, 60), ry = r.r(22, 40); const sk = SKY[S.bucket]; const g = ctx.createLinearGradient(x, y - ry, x, y + ry); g.addColorStop(0, css(mix(sk[0], [30, 50, 70], .3), .6)); g.addColorStop(1, css(sk[1], .55)); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, r() * 3, 0, 7); ctx.fill(); ctx.strokeStyle = css([20, 24, 30], .6); ctx.lineWidth = 1.4; ctx.stroke(); }
  } else if (type === 'tile') {
    for (let j = 0; j < lh(loc) * 2; j++) for (let i = 0; i < lw(loc) * 2; i++) {
      const par = (i + j) & 1, c = jit(gr(par ? [96, 128, 92] : [196, 190, 150]), r, .09);
      paintRect(ctx, i * 32 + .8, j * 32 + .8, 30.6, 30.6, c, r, { n: 8, sw: 3, sl: 18, ang: r() * 3, alt: [60, 90, 70], jv: .1, ha: .5, ew: 1.2 });
    }
    ctx.strokeStyle = css(gr([40, 50, 40]), .65); ctx.lineWidth = 1.2; ctx.beginPath();
    for (let i = 0; i <= lw(loc) * 2; i++) { ctx.moveTo(i * 32, 0); ctx.lineTo(i * 32, H); } for (let j = 0; j <= lh(loc) * 2; j++) { ctx.moveTo(0, j * 32); ctx.lineTo(W, j * 32); } ctx.stroke();
  } else if (type === 'carpet') {
    const lamp = loc.mood === 'lamp', P = lamp ? { a: [124, 48, 46], b: [152, 66, 52], c: [220, 176, 100], d: [44, 66, 68] } : { a: [84, 62, 74], b: [110, 72, 78], c: [196, 164, 110], d: [40, 58, 70] };
    paintRect(ctx, 0, 0, W, H, gr(P.a), r, { n: W * H / 60, sw: 5, sl: 30, ang: 0, aj: .12, alt: gr(P.b), jv: .1, edge: false });
    for (let j = 0; j < H / 64; j++) for (let i = 0; i < W / 64; i++) {      // woven lozenge pattern
      const cx = i * 64 + 32, cy = j * 64 + 32, k = ((i + j) & 1) ? 1 : .7;
      paintPoly(ctx, [[cx, cy - 26 * k], [cx + 26 * k, cy], [cx, cy + 26 * k], [cx - 26 * k, cy]], jit(gr(P.b), r, .08), r, { n: 5, sw: 3, sl: 14, ang: .8, ink: false, edge: false, alt: gr(P.c), jv: .1, alpha: .85 });
      ctx.strokeStyle = css(gr(P.c), .5); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(cx, cy - 20 * k); ctx.lineTo(cx + 20 * k, cy); ctx.lineTo(cx, cy + 20 * k); ctx.lineTo(cx - 20 * k, cy); ctx.closePath(); ctx.stroke();
      ctx.fillStyle = css(gr(P.d), .8); ctx.beginPath(); ctx.arc(cx, cy, 3.4 * k, 0, 7); ctx.fill();
    }
    ctx.strokeStyle = css(gr(P.c), .85); ctx.lineWidth = 4; ctx.strokeRect(14, 14, W - 28, H - 28); ctx.strokeStyle = css(gr(P.d), .9); ctx.lineWidth = 3; ctx.strokeRect(24, 24, W - 48, H - 48);
    for (let i = 0; i < 26; i++) { ctx.fillStyle = css(r() < .5 ? [14, 10, 12] : [230, 200, 150], .08 + r() * .06); ctx.beginPath(); ctx.ellipse(r() * W, r() * H, r.r(14, 50), r.r(10, 30), r() * 3, 0, 7); ctx.fill(); }
  } else if (type === 'asphalt') {
    const night = loc.mood === 'neon', PV = loc.pave === undefined ? 4.6 : loc.pave, rail = loc.rails === undefined ? (loc.id === 'street' ? 11.4 : -1) : loc.rails;
    paintRect(ctx, 0, 0, W, H, gr([66, 68, 76]), r, { n: W * H / 420, sw: 14, sl: 90, ang: .05, aj: 1.4, alt: gr([40, 42, 54]), jv: .14, edge: false });
    for (let i = 0; i < W * H / 400; i++) { const x = r() * W, y = r() * H; ctx.fillStyle = css(r() < .5 ? [24, 24, 32] : [150, 150, 160], .12 + r() * .12); ctx.fillRect(x, y, r.r(1, 3), r.r(1, 2.6)); }
    for (let i = 0; i < 7; i++) paintRect(ctx, r() * W * .9, r.r(PV * 64 + 40, H - 80), r.r(60, 150), r.r(30, 70), jit(gr([52, 54, 62]), r, .08), r, { n: 20, sw: 5, ang: .1, aj: 1, ink: false, edge: false, alpha: .8 });   // patches
    // lane markings (faded)
    ctx.fillStyle = css([214, 200, 150], .5); const ly = (rail > 0 ? rail - 2.4 : H / 64 - 2.2) * 64; for (let x = 40; x < W - 40; x += 120) { ctx.fillRect(x, ly - 2.5, 64, 5); }
    for (let k = 0; k < 7; k++) { ctx.fillStyle = css([220, 214, 190], .42); ctx.fillRect(2.2 * 64 + k * 14, (PV + .35) * 64, 7, 70); }   // zebra
    // pavement slabs + curb
    if (PV > 0) {
      for (let j = 0; j < PV * 2; j++) for (let i = 0; i < W / 64; i++) { const c = jit(gr([118, 114, 108]), r, .1); paintRect(ctx, i * 64 + .8, j * 32 + .8, 62.4, Math.min(30.4, PV * 64 - j * 32 - 1.6), c, r, { n: 9, sw: 4, sl: 20, ang: r() * 3, alt: gr([84, 92, 96]), jv: .1, ha: .5, ew: 1.2 }); }
      ctx.strokeStyle = css(gr([30, 28, 30]), .7); ctx.lineWidth = 1.3; ctx.beginPath(); for (let i = 0; i <= W / 64; i++) { ctx.moveTo(i * 64, 0); ctx.lineTo(i * 64, PV * 64); } for (let j = 0; j <= PV * 2; j++) { ctx.moveTo(0, j * 32); ctx.lineTo(W, j * 32); } ctx.stroke();
      paintRect(ctx, 0, PV * 64, W, 11, gr([164, 158, 148]), r, { n: W / 5, sw: 3, ang: 0, ink: true, ew: 1.6, ha: .9, light: [0, -1] });
      ctx.fillStyle = css([6, 4, 14], .35); ctx.fillRect(0, PV * 64 + 11, W, 8);
    }
    // tram rails in setts
    if (rail > 0) {
      const ry = rail * 64;
      for (let x = 0; x < W; x += 21) for (let k = 0; k < 4; k++) paintEll(ctx, x + r.r(-2, 2) + 10, ry - 6 + k * 18 + r.r(-2, 2), r.r(8, 10.5), r.r(7, 9), jit(gr([96, 98, 104]), r, .12), r, { n: 3, pn: 8, sw: 3, ink: false, ew: 1, alt: gr([70, 80, 96]) });
      for (const off of [8, 52]) { ctx.fillStyle = css([18, 16, 20], .9); ctx.fillRect(0, ry + off - 3, W, 6.4); ctx.fillStyle = css(night ? [170, 190, 220] : [190, 190, 190], .75); ctx.fillRect(0, ry + off - 2.2, W, 1.8); }
    }
    for (let i = 0; i < 16; i++) { let x = r() * W, y = r() * H; ctx.strokeStyle = css([14, 14, 20], .55); ctx.lineWidth = r.r(.8, 1.8); ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 7; k++) { x += r.r(-16, 16); y += r.r(-14, 14); ctx.lineTo(x, y); } ctx.stroke(); }
    // manhole covers
    for (const [mx, my] of [[W * .42, (PV + 2.4) * 64], [W * .78, (PV + 3.6) * 64]]) { if (my > H - 40) continue; paintEll(ctx, mx, my, 21, 21, [58, 56, 60], r, { n: 12, ink: true, ew: 1.4 }); ctx.strokeStyle = css([20, 20, 22], .8); ctx.lineWidth = 1.5; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(mx - 15, my + k * 6); ctx.lineTo(mx + 15, my + k * 6); ctx.stroke(); } }
    // wet puddles holding the sky / neon
    const sk = S.mood.sky || SKY[S.bucket];
    for (let i = 0; i < 9; i++) {
      const x = r.r(80, W - 80), y = r.r(PV * 64 + 60, H - 50), rx = r.r(34, 80), ry = rx * r.r(.4, .6);
      const g2 = ctx.createLinearGradient(x - rx, y, x + rx, y); g2.addColorStop(0, css(night ? [18, 22, 50] : mix(sk[0], [30, 50, 70], .3), .7)); g2.addColorStop(.35, css(night ? [150, 60, 110] : sk[1], .38)); g2.addColorStop(.7, css(night ? [50, 140, 170] : sk[1], .34)); g2.addColorStop(1, css(sk[0], .7));
      ctx.fillStyle = g2; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, r() * .3, 0, 7); ctx.fill(); ctx.strokeStyle = css([8, 8, 14], .55); ctx.lineWidth = 1.6; ctx.stroke();
      ctx.strokeStyle = css([255, 255, 255], .25); ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x - rx * .2, y - ry * .15, rx * .5, ry * .4, 0, 3.4, 5.8); ctx.stroke();
    }
  } else if (type === 'metal') {
    const storm = loc.mood === 'storm';
    for (let j = 0; j < lh(loc); j++) for (let i = 0; i < lw(loc); i++) {
      const grate = lat(i, j, S.seed + 4) > .86, c = jit(gr(storm ? [98, 108, 114] : [110, 108, 100]), r, .08);
      const x0 = i * 64, y0 = j * 64;
      if (grate) {
        paintRect(ctx, x0 + 1, y0 + 1, 62, 62, [18, 18, 22], r, { n: 6, ink: true, ew: 1.4 });
        ctx.strokeStyle = css(gr([108, 112, 112]), .9); ctx.lineWidth = 2.2; ctx.beginPath(); for (let k = 1; k < 8; k++) { ctx.moveTo(x0 + k * 8, y0 + 3); ctx.lineTo(x0 + k * 8, y0 + 61); } ctx.stroke();
        ctx.strokeStyle = css(gr([70, 74, 78]), .9); ctx.lineWidth = 1.4; ctx.beginPath(); for (let k = 1; k < 4; k++) { ctx.moveTo(x0 + 3, y0 + k * 16); ctx.lineTo(x0 + 61, y0 + k * 16); } ctx.stroke();
        S.lights.push((function () { const q = gp(S, (x0 + 32) / 64, (y0 + 32) / 64, 0); return { x: q[0], y: q[1], r: 70, col: [255, 120, 50], a: .1, fl: .25, ph: r() * 6, kind: 'heat' }; })());
        continue;
      }
      paintRect(ctx, x0 + 1, y0 + 1, 62, 62, c, r, { n: 18, sw: 5, sl: 34, ang: r() * 3, alt: gr([160, 160, 150]), jv: .09, ha: .5, ew: 1.4 });
      ctx.save(); ctx.beginPath(); ctx.rect(x0 + 3, y0 + 3, 58, 58); ctx.clip();       // diamond tread
      ctx.strokeStyle = css(gr([44, 46, 50]), .55); ctx.lineWidth = 2.2; ctx.beginPath();
      for (let a = -64; a < 128; a += 12) { ctx.moveTo(x0 + a, y0); ctx.lineTo(x0 + a + 14, y0 + 14); ctx.moveTo(x0 + a, y0 + 14); ctx.lineTo(x0 + a + 14, y0); }
      for (let b = 0; b < 4; b++) for (let a = -64; a < 128; a += 24) { ctx.moveTo(x0 + a + 6, y0 + 14 + b * 14 + 3); ctx.lineTo(x0 + a + 17, y0 + 14 + b * 14 + 12); }
      ctx.stroke(); ctx.strokeStyle = css([230, 230, 220], .22); ctx.lineWidth = 1; ctx.beginPath(); for (let k = 0; k < 14; k++) { const a = r.r(-10, 60), b = r.r(0, 58); ctx.moveTo(x0 + a, y0 + b); ctx.lineTo(x0 + a + 7, y0 + b + 6); } ctx.stroke();
      ctx.restore();
      for (const [dx, dy] of [[5, 5], [59, 5], [5, 59], [59, 59]]) { ctx.fillStyle = css([40, 40, 44], .9); ctx.beginPath(); ctx.arc(x0 + dx, y0 + dy, 2.1, 0, 7); ctx.fill(); ctx.fillStyle = css([220, 220, 210], .5); ctx.fillRect(x0 + dx - 1, y0 + dy - 1.4, 1.6, 1); }
    }
    ctx.strokeStyle = css([12, 12, 16], .85); ctx.lineWidth = 1.8; ctx.beginPath(); for (let i = 0; i <= lw(loc); i++) { ctx.moveTo(i * 64, 0); ctx.lineTo(i * 64, H); } for (let j = 0; j <= lh(loc); j++) { ctx.moveTo(0, j * 64); ctx.lineTo(W, j * 64); } ctx.stroke();
    // hazard-stripe borders round heavy machinery, cable runs, oil
    for (const p of (loc.props || [])) if ((p.t === 'generator' || p.t === 'console') && !p.side) {
      const x0 = (p.x - .28) * 64, y0 = (p.y - .28) * 64, w = ((p.w || 1) + .56) * 64, h = ((p.h || 1) + .56) * 64;
      ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.rect(x0 + 9, y0 + 9, w - 18, h - 18); ctx.clip('evenodd');
      ctx.fillStyle = css([34, 30, 26], .95); ctx.fillRect(x0, y0, w, h); ctx.fillStyle = css(gr([214, 176, 50]), .92);
      for (let a = -h; a < w + h; a += 22) { ctx.beginPath(); ctx.moveTo(x0 + a, y0); ctx.lineTo(x0 + a + 11, y0); ctx.lineTo(x0 + a + 11 - h, y0 + h); ctx.lineTo(x0 + a - h, y0 + h); ctx.fill(); }
      ctx.restore();
    }
    for (let k = 0; k < 3; k++) { let x = r() * W * .6 + W * .2, y = r() * H * .6 + H * .2; ctx.strokeStyle = css([12, 12, 14], .92); ctx.lineWidth = r.r(4, 6.5); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); for (let q = 0; q < 4; q++) { ctx.quadraticCurveTo(x + r.r(-90, 90), y + r.r(-90, 90), x += r.r(-130, 130), y += r.r(-130, 130)); } ctx.stroke(); ctx.strokeStyle = css([120, 130, 150], .28); ctx.lineWidth = 1.4; ctx.stroke(); }
    for (let i = 0; i < 12; i++) { ctx.fillStyle = css([10, 8, 8], .2 + r() * .15); ctx.beginPath(); ctx.ellipse(r() * W, r() * H, r.r(10, 40), r.r(7, 24), r() * 3, 0, 7); ctx.fill(); }
  } else { // concrete
    for (let j = 0; j < Math.ceil(lh(loc) / 2); j++) for (let i = 0; i < Math.ceil(lw(loc) / 2); i++) {
      const c = jit(gr([104, 104, 108]), r, .1);
      paintRect(ctx, i * 128 + 1.5, j * 128 + 1.5, 125, 125, c, r, { n: 55, sw: 7, sl: 60, ang: r() * 3, aj: 1.2, alt: [80, 84, 96], jv: .12, ha: .3, la: .3 });
    }
    ctx.strokeStyle = css([20, 18, 22], .7); ctx.lineWidth = 2;
    ctx.beginPath(); for (let i = 0; i <= lw(loc); i += 2) { ctx.moveTo(i * 64, 0); ctx.lineTo(i * 64, H); } for (let j = 0; j <= lh(loc); j += 2) { ctx.moveTo(0, j * 64); ctx.lineTo(W, j * 64); } ctx.stroke();
    for (let i = 0; i < 14; i++) { let x = r() * W, y = r() * H; ctx.strokeStyle = css([20, 18, 22], .5); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 6; k++) { x += r.r(-14, 14); y += r.r(-14, 14); ctx.lineTo(x, y); } ctx.stroke(); }
    for (let i = 0; i < 12; i++) { ctx.fillStyle = css(r() < .5 ? [20, 18, 16] : [90, 60, 30], .14 + r() * .12); ctx.beginPath(); ctx.ellipse(r() * W, r() * H, r.r(8, 34), r.r(6, 24), r() * 3, 0, 7); ctx.fill(); }
  }
  // large soft tonal blotches (glazing)
  for (let i = 0; i < 40; i++) {
    const x = r() * W, y = r() * H, s = r.r(60, 200), dark = r() < .55;
    ctx.globalAlpha = dark ? .09 : .06; ctx.drawImage(glowSprite(dark ? [10, 10, 30] : [255, 220, 160], 128), x - s / 2, y - s / 2, s, s);
  }
  ctx.globalAlpha = 1;
  // ambient occlusion by the two back walls + room edges
  let g = ctx.createLinearGradient(0, 0, 0, 56); g.addColorStop(0, 'rgba(6,4,14,.55)'); g.addColorStop(1, 'rgba(6,4,14,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 56);
  g = ctx.createLinearGradient(0, 0, 56, 0); g.addColorStop(0, 'rgba(6,4,14,.6)'); g.addColorStop(1, 'rgba(6,4,14,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 56, H);
  ctx.restore();
}
function medallion(ctx, S, cx, cy, R, gr) {
  const r = S.r, rings = [[0, .22, [60, 124, 120]], [.22, .38, [226, 200, 150]], [.38, .56, [200, 104, 52]], [.56, .64, [30, 70, 78]], [.64, .82, [226, 200, 150]], [.82, 1, [200, 104, 52]]];
  ctx.fillStyle = css([30, 24, 24], .9); ctx.beginPath(); ctx.arc(cx, cy, R * 1.04, 0, 7); ctx.fill();
  for (let k = 0; k < rings.length; k++) {
    const [a, b, col] = rings[k], n = k === 0 ? 1 : Math.round(10 + k * 7);
    for (let s = 0; s < n; s++) {
      const a0 = s / n * 6.2832, a1 = (s + 1) / n * 6.2832 - .03;
      let c = col; if (k > 0 && (s & 1) && (k === 2 || k === 5)) c = [60, 124, 120]; if (k === 4 && (s & 1)) c = [196, 150, 100];
      const pts = k === 0 ? ellPts(cx, cy, R * b, R * b, 16, 0, r, .04) : [[cx + Math.cos(a0) * R * a, cy + Math.sin(a0) * R * a], [cx + Math.cos(a0) * R * b, cy + Math.sin(a0) * R * b], [cx + Math.cos((a0 + a1) / 2) * R * b, cy + Math.sin((a0 + a1) / 2) * R * b], [cx + Math.cos(a1) * R * b, cy + Math.sin(a1) * R * b], [cx + Math.cos(a1) * R * a, cy + Math.sin(a1) * R * a]];
      paintPoly(ctx, pts, jit(gr(c), r, .1), r, { n: 4, sw: 3, sl: 14, ang: (a0 + a1) / 2 + 1.57, jv: .1, ew: 1, ha: .5 });
    }
  }
  // star in the middle
  ctx.fillStyle = css([226, 200, 150], .95); ctx.beginPath();
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.2832 - 1.57, rr = i % 2 ? R * .07 : R * .2; ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.strokeStyle = css([30, 24, 24], .8); ctx.lineWidth = 1.2; ctx.stroke();
}
function gymLines(ctx, S, gr) {
  const loc = S.loc, W = lw(loc) * 64, H = lh(loc) * 64;
  ctx.save(); ctx.globalAlpha = .55; ctx.strokeStyle = css([226, 214, 160], 1); ctx.lineWidth = 3;
  ctx.strokeRect(70, 70, W - 140, H - 140); ctx.beginPath(); ctx.moveTo(W / 2, 70); ctx.lineTo(W / 2, H - 70); ctx.stroke();
  ctx.beginPath(); ctx.arc(W / 2, H / 2, 90, 0, 7); ctx.stroke(); ctx.strokeStyle = css([190, 80, 60], 1);
  ctx.beginPath(); ctx.arc(8.5 * 64, 3.5 * 64, 120, 0, 3.14); ctx.stroke(); ctx.restore();
}
function paintFloorEdge(ctx, S) {
  const loc = S.loc, w = lw(loc), h = lh(loc), r = S.r;
  const a = gp(S, w, 0), b = gp(S, w, h), c = gp(S, 0, h);
  const col = mul([70, 50, 44], S.mood.bake);
  paintPoly(ctx, [a, b, [b[0], b[1] + EDGE], [a[0], a[1] + EDGE]], mul(col, .8), r, { n: 30, sw: 3, ang: 1.57, aj: .3, ink: true });
  paintPoly(ctx, [b, c, [c[0], c[1] + EDGE], [b[0], b[1] + EDGE]], mul(col, .55), r, { n: 30, sw: 3, ang: 1.57, aj: .3, ink: true });
}

/* ------------------------------------------------------------------- walls */
function wallPal(S) {
  const t = S.loc.wall || 'plaster', m = S.loc.mood;
  if (t === 'tiled') return m === 'storm' ? { b: [176, 192, 184], g: [58, 96, 92], m: [60, 70, 70] } : { b: [212, 206, 176], g: [78, 120, 96], m: [70, 66, 54] };
  if (t === 'corrugated') return m === 'storm' ? { b: [112, 128, 134], m: [44, 52, 58], rust: [140, 78, 44] } : { b: [136, 130, 112], m: [50, 46, 40], rust: [150, 80, 40] };
  if (t === 'brick' && m === 'neon') return { b: [112, 70, 74], m: [44, 40, 52] };
  if (t === 'brick' && m === 'storm') return { b: [104, 92, 90], m: [46, 48, 56] };
  if (m === 'lamp') return { top: [200, 164, 104], dado: [112, 76, 58] };
  if (t === 'brick') return m === 'warm' ? { b: [176, 84, 48], m: [74, 54, 44] } : m === 'ember' ? { b: [120, 56, 40], m: [40, 28, 28] } : { b: [136, 78, 58], m: [64, 52, 48] };
  if (m === 'sick') return { top: [196, 206, 160], dado: [74, 120, 84] };
  if (m === 'cold') return { top: [170, 184, 168], dado: [58, 100, 92] };
  if (m === 'umber') return { top: [176, 146, 100], dado: [110, 78, 52] };
  return { top: [186, 170, 130], dado: [78, 112, 82] };
}
function paintWall(ctx, S, side) {
  const loc = S.loc, r = S.r, len = (side === 'l' ? lh(loc) : lw(loc)) * 64, P = wallPal(S), brick = loc.wall === 'brick';
  const gr = (c) => mul(C(c), S.mood.bake) , dark = side === 'l' ? .72 : 1.0;
  ctx.save(); wallFrame(ctx, S, side); ctx.beginPath(); ctx.rect(0, 0, len, WALLH); ctx.clip();
  if (loc.wall === 'tiled') {
    const th = 11, tw = 18, dado = WALLH * .6;
    ctx.fillStyle = css(gr(P.m)); ctx.fillRect(0, 0, len, WALLH);
    for (let v = 0, row = 0; v < WALLH; v += th, row++) for (let u = 0; u < len; u += tw) {
      const low = v >= dado, base = low ? P.g : P.b, c = mul(jit(gr(base), r, .07), dark * (.88 + .12 * noise(u / 70, v / 50, S.seed)));
      paintRect(ctx, u + .7, v + .7, tw - 1.4, th - 1.4, c, r, { n: 2, sw: 4, sl: 14, ang: .3 + r() * .4, aj: .3, alt: low ? [140, 190, 150] : [250, 244, 214], jv: .05, ew: .9, ha: .8, la: .5, light: [.4, -.9] });
      if (r() < .06) { ctx.fillStyle = css([20, 14, 10], .55); ctx.beginPath(); ctx.moveTo(u + 3, v + 2); ctx.lineTo(u + tw - 3, v + 3); ctx.lineTo(u + tw / 2, v + th - 2); ctx.fill(); }
    }
    ctx.fillStyle = css(gr([20, 30, 26]), .9); ctx.fillRect(0, dado - 3, len, 5); ctx.fillStyle = css([230, 236, 214], .45); ctx.fillRect(0, dado - 3.6, len, 1.6);
    for (let i = 0; i < len / 50; i++) { const x = r() * len; ctx.fillStyle = css([40, 30, 14], .14 + r() * .1); ctx.fillRect(x, r.r(0, 40), r.r(1.5, 4), r.r(30, 100)); }
  } else if (loc.wall === 'corrugated') {
    ctx.fillStyle = css(gr(P.m)); ctx.fillRect(0, 0, len, WALLH);
    for (let u = 0; u < len; u += 12) {
      const c = jit(gr(P.b), r, .06), g2 = ctx.createLinearGradient(u, 0, u + 12, 0);
      g2.addColorStop(0, css(mul(c, .62 * dark))); g2.addColorStop(.45, css(mul(c, 1.16 * dark))); g2.addColorStop(1, css(mul(c, .7 * dark)));
      ctx.fillStyle = g2; ctx.fillRect(u, 0, 12, WALLH);
      for (let k = 0; k < 2; k++) bristle(ctx, u + 4 + r() * 4, r() * WALLH, 1.57 + r.g() * .05, r.r(30, 90), r.r(2, 4), mul(c, 1 + r.g() * .12), .35, r);
    }
    for (let i = 0; i < len / 22; i++) { const x = r() * len, y = r.r(20, WALLH), s = r.r(10, 34); ctx.globalAlpha = .45; ctx.drawImage(glowSprite(mul(P.rust, dark), 128), x - s / 2, y - s, s, s * 3); }
    ctx.globalAlpha = 1;
    for (let u = 0; u < len; u += 64) { ctx.fillStyle = css([14, 12, 14], .6); ctx.fillRect(u - 1, 0, 2.4, WALLH); for (let y = 10; y < WALLH; y += 36) { ctx.fillStyle = css([36, 34, 36]); ctx.beginPath(); ctx.arc(u + 6, y, 1.8, 0, 7); ctx.fill(); ctx.fillStyle = css([210, 200, 180], .4); ctx.fillRect(u + 5, y - 1.6, 1.4, 1); } }
    ctx.fillStyle = css([14, 12, 14], .5); ctx.fillRect(0, WALLH * .55, len, 3);
  } else if (brick) {
    ctx.fillStyle = css(gr(P.m)); ctx.fillRect(0, 0, len, WALLH);
    const bh = 10, bw = 30;
    for (let row = 0, v = 0; v < WALLH; row++, v += bh) {
      let u = (row & 1) ? -bw / 2 : 0;
      for (; u < len; u += bw) {
        const c = mul(jit(gr(P.b), r, .14), dark * (.85 + .15 * noise(u / 90, v / 60, S.seed)));
        paintRect(ctx, u + 1, v + 1, bw - 2, bh - 1.6, c, r, { n: 2, sw: 3, sl: 14, ang: 0, aj: .12, alt: r() < .3 ? [150, 60, 40] : [210, 120, 70], jv: .1, ew: 1, ha: .55, la: .5, light: [0, -1] });
      }
    }
  } else {
    const dado = WALLH * .52;
    paintRect(ctx, 0, 0, len, dado + 2, mul(gr(P.top), dark), r, { n: len / 3, sw: 9, sl: 70, ang: .06, aj: .35, jv: .08, alt: [220, 200, 150], edge: false });
    paintRect(ctx, 0, dado, len, WALLH - dado, mul(gr(P.dado), dark), r, { n: len / 3, sw: 8, sl: 70, ang: .05, aj: .3, jv: .09, alt: [30, 70, 60], edge: false });
    ctx.fillStyle = css(gr([20, 30, 24]), .85); ctx.fillRect(0, dado - 1, len, 3.2); ctx.fillStyle = css([230, 220, 170], .35); ctx.fillRect(0, dado - 2.4, len, 1.4);
    // peeling patches, cracks
    for (let i = 0; i < len / 90; i++) {
      const x = r() * len, y = r.r(8, WALLH - 30), pts = ellPts(x, y, r.r(8, 22), r.r(6, 16), 9, r() * 3, r, .5);
      paintPoly(ctx, pts, mul(gr([150, 120, 96]), dark), r, { n: 6, sw: 4, ang: r() * 3, ink: false, alt: [100, 70, 60], jv: .2 });
    }
    for (let i = 0; i < len / 70; i++) { let x = r() * len, y = r.r(0, WALLH * .5); ctx.strokeStyle = css([26, 20, 20], .55); ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 6; k++) { x += r.r(-5, 5); y += r.r(5, 14); ctx.lineTo(x, y); } ctx.stroke(); }
  }
  // damp / grime
  for (let i = 0; i < len / 40; i++) { const x = r() * len, y = r.r(WALLH * .5, WALLH), s = r.r(40, 110); ctx.globalAlpha = .12; ctx.drawImage(glowSprite([20, 16, 10], 128), x - s / 2, y - s / 2, s, s * .8); }
  for (let i = 0; i < len / 60; i++) { const x = r() * len, y = r.r(0, WALLH * .7); ctx.strokeStyle = css([20, 24, 22], .1 + r() * .1); ctx.lineWidth = r.r(1.5, 5); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + r.r(-2, 2), y + r.r(20, 70)); ctx.stroke(); }
  ctx.globalAlpha = 1;
  // ceiling shadow & floor-line shadow & vertical corner shade
  let g = ctx.createLinearGradient(0, 0, 0, 46); g.addColorStop(0, 'rgba(6,4,14,.75)'); g.addColorStop(1, 'rgba(6,4,14,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, len, 46);
  g = ctx.createLinearGradient(0, WALLH - 26, 0, WALLH); g.addColorStop(0, 'rgba(6,4,14,0)'); g.addColorStop(1, 'rgba(6,4,14,.5)'); ctx.fillStyle = g; ctx.fillRect(0, WALLH - 26, len, 26);
  g = ctx.createLinearGradient(0, 0, 80, 0); g.addColorStop(0, 'rgba(6,4,14,.5)'); g.addColorStop(1, 'rgba(6,4,14,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 80, WALLH);
  // warm light pooling from the right side (rim light on walls)
  g = ctx.createLinearGradient(len - 140, 0, len, 0); g.addColorStop(0, css(S.mood.glow, 0)); g.addColorStop(1, css(S.mood.glow, side === 'r' ? .14 : .08)); ctx.fillStyle = g; ctx.fillRect(len - 140, 0, 140, WALLH);
  // baseboard
  ctx.fillStyle = css(gr([40, 28, 26]), .9); ctx.fillRect(0, WALLH - 9, len, 9); ctx.fillStyle = css([255, 220, 170], .18); ctx.fillRect(0, WALLH - 9, len, 1.4);
  ctx.restore();
  // top cap
  ctx.save(); wallFrame(ctx, S, side);
  const cap = [[0, 0], [len, 0], [len, -9], [0, -9]];
  paintPoly(ctx, cap, mul(gr([150, 130, 108]), dark), r, { n: len / 8, sw: 3, ang: 0, aj: .1, ha: .8, ink: true });
  ctx.restore();
}

/* floor light shafts from windows/doors, dapples, dust stains: baked */
function paintLightFloor(ctx, S) {
  const loc = S.loc, r = S.r, b = S.bucket, col = S.mood.dapple || DAPPLE[b], ka = (S.mood.dapple ? .8 : DAPPLE_A[b]) * S.lightK;
  ctx.save(); floorFrame(ctx, S); ctx.beginPath(); ctx.rect(0, 0, lw(loc) * 64, lh(loc) * 64); ctx.clip();
  ctx.globalCompositeOperation = 'lighter';
  for (const p of (loc.props || [])) {
    if (p.t !== 'window' || !p.side) continue;
    const u0 = (p.x || 0) * 64, u1 = ((p.x || 0) + (p.w || 1)) * 64, v0 = (p.y || 0) * 64, v1 = ((p.y || 0) + (p.h || 1)) * 64, L = 5.5 * 64;
    let poly, g;
    if (p.side === 'r') { poly = [[u0, 0], [u1, 0], [u1 + L * .55, L], [u0 + L * .55, L]]; g = ctx.createLinearGradient(0, 0, 0, L); }
    else { poly = [[0, v0], [0, v1], [L, v1 + L * .55], [L, v0 + L * .55]]; g = ctx.createLinearGradient(0, 0, L, 0); }
    g.addColorStop(0, css(col, .24 * ka)); g.addColorStop(1, css(col, 0));
    ctx.fillStyle = g; pathPoly(ctx, poly, r, 3); ctx.fill();
    // pane shadows: dark mullion bars across the shaft
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = css([8, 6, 16], .16 * ka); ctx.lineWidth = 5;
    const m = (p.side === 'r') ? [[(u0 + u1) / 2, 0, (u0 + u1) / 2 + L * .55, L]] : [[0, (v0 + v1) / 2, L, (v0 + v1) / 2 + L * .55]];
    for (const q of m) { ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(q[2], q[3]); ctx.stroke(); }
    ctx.globalCompositeOperation = 'lighter';
  }
  // dappled bokeh spots
  const n = Math.round(lw(loc) * lh(loc) * .55);
  S.dapples = [];
  for (let i = 0; i < n; i++) {
    const u = r.r(30, lw(loc) * 64 - 30), v = r.r(30, lh(loc) * 64 - 30), s = r.r(16, 64);
    const c = jit(col, r, .12);
    ctx.globalAlpha = Math.min(1, r.r(.08, .3) * ka);
    if (i % 4 === 0) ctx.drawImage(bokehSprite(c, 64), u - s / 2, v - s / 2, s, s); else { ctx.globalAlpha *= 1.4; ctx.drawImage(glowSprite(c, 128), u - s * .9, v - s * .9, s * 1.8, s * 1.8); }
    if (i % 3 === 0) { const sp = gp(S, u / 64, v / 64, 0); S.dapples.push({ x: sp[0], y: sp[1], s: s * .9, ph: r() * 6.28, col: c }); }
  }
  ctx.globalAlpha = 1; ctx.restore();
}
