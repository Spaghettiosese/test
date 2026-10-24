
/* ------------------------------------------------------- moods / time */
/* amb/bake/glow/floorMix: albedo tints (bake) + legacy fields used by props.
 * lit: light-pass ambient level (0..1, the light map's base), sh/hi: split-tone (shadow / highlight tint), sat, con: grade. */
const MOODS = {
  umber: { amb: [.86, .76, .66], bake: [.97, .90, .80], glow: [255, 170, 90], floorMix: [120, 80, 50], lit: [0.75, 0.68, 0.65], sh: [10, 26, 34], hi: [255, 196, 130], sat: .92, con: 1.12, bg: [16, 12, 12] },
  warm:  { amb: [.98, .86, .72], bake: [1.0, .95, .86], glow: [255, 150, 70], floorMix: [150, 90, 40], lit: [0.79, 0.71, 0.67], sh: [8, 34, 44], hi: [255, 186, 110], sat: .98, con: 1.1, bg: [18, 12, 12] },
  cold:  { amb: [.76, .88, .95], bake: [.88, .96, 1.0], glow: [255, 190, 120], floorMix: [60, 100, 110], lit: [0.73, 0.79, 0.83], sh: [6, 30, 46], hi: [240, 230, 200], sat: .82, con: 1.08, bg: [10, 14, 18] },
  dusk:  { amb: [.82, .88, .96], bake: [.90, .96, 1.0], glow: [255, 140, 70], floorMix: [60, 80, 90], lit: [0.75, 0.79, 0.87], sh: [6, 34, 54], hi: [255, 170, 100], sat: .9, con: 1.12, bg: [10, 14, 20] },
  sick:  { amb: [.80, .94, .72], bake: [.92, 1.0, .88], glow: [220, 230, 130], floorMix: [80, 110, 70], lit: [0.73, 0.79, 0.68], sh: [20, 36, 18], hi: [236, 240, 170], sat: .8, con: 1.1, bg: [12, 15, 10] },
  ember: { amb: [.62, .53, .50], bake: [.9, .82, .78], glow: [255, 120, 40], floorMix: [90, 40, 20], lit: [0.51, 0.45, 0.47], sh: [14, 12, 30], hi: [255, 150, 70], sat: 1.0, con: 1.16, bg: [12, 7, 7] },
  // --- art2 moods. grade = how much the time-of-day tint is allowed through (they are self-lit looks)
  lamp:  { amb: [1.0, .84, .60], bake: [1.0, .91, .74], glow: [255, 188, 84], floorMix: [150, 100, 40], grade: .45, lamp: true, wash: [255, 170, 60, .07], lit: [0.63, 0.55, 0.53], sh: [16, 22, 40], hi: [255, 190, 100], sat: .98, con: 1.14, bg: [14, 10, 8] },
  neon:  { amb: [.66, .74, 1.0], bake: [.84, .90, 1.04], glow: [255, 96, 150], floorMix: [60, 60, 110], grade: .35, sky: [[18, 20, 54], [196, 74, 112]], dapple: [255, 120, 170], neon: true, wash: [40, 140, 190, .07], lit: [0.49, 0.53, 0.69], sh: [10, 20, 54], hi: [255, 130, 170], sat: 1.06, con: 1.16, bg: [8, 8, 18] },
  storm: { amb: [.66, .78, .93], bake: [.82, .92, 1.02], glow: [150, 196, 255], floorMix: [60, 80, 100], grade: .3, sky: [[40, 50, 66], [118, 130, 146]], dapple: [170, 204, 255], storm: true, wash: [90, 130, 190, .07], lit: [0.59, 0.65, 0.73], sh: [8, 22, 40], hi: [210, 226, 250], sat: .78, con: 1.12, bg: [8, 11, 16] }
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
const BUCKET_MIN = [480, 690, 945, 1120, 1320];
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
    if (m === 'warm') return { a: [222, 196, 142], b: [196, 98, 50], c: [56, 120, 116], d: [150, 60, 40] };
    if (m === 'cold') return { a: [168, 178, 158], b: [92, 122, 120], c: [196, 180, 132], d: [70, 96, 100] };
    return { a: [184, 178, 142], b: [110, 130, 110], c: [190, 150, 90], d: [80, 100, 90] };
  }
  return null;
}
/* worn-path field: soft lanes between the spawn point and every exit (local floor px) */
function wearField(S) {
  const loc = S.loc, sp = loc.spawn || { x: lw(loc) / 2, y: lh(loc) / 2 }, segs = [];
  const P = (o) => [(o.x + .5) * 64, (o.y + .5) * 64];
  const ex = (loc.exits || []).filter(e => e && e.x !== undefined);
  for (const e of ex) segs.push([P(sp), P(e)]);
  if (ex.length > 1) for (let i = 1; i < ex.length; i++) segs.push([P(ex[i - 1]), P(ex[i])]);
  const sg = segs.map(([a, b]) => { const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1; return [a[0], a[1], dx, dy, L2]; });
  return function (u, v) {
    let best = 1e9;
    for (let i = 0; i < sg.length; i++) { const s = sg[i]; let t = ((u - s[0]) * s[2] + (v - s[1]) * s[3]) / s[4]; t = t < 0 ? 0 : t > 1 ? 1 : t; const x = u - s[0] - s[2] * t, y = v - s[1] - s[3] * t, d = x * x + y * y; if (d < best) best = d; }
    const w = Math.exp(-best / 5200) * (.55 + .7 * nt(u * .03 + 40, v * .03 + 9));
    return w > 1 ? 1 : w;
  };
}
function paintFloor(ctx, S) {
  const loc = S.loc, r = S.r, W = lw(loc) * 64, H = lh(loc) * 64, type = loc.floor || 'wood', seed = S.seed % 9973;
  const bk = S.mood.bake, wear = wearField(S);
  const gr = (c) => mul(C(c), bk);
  let fn = null, post = null;
  if (type === 'wood') {
    const m = loc.mood;
    const P = (m === 'storm' ? [[118, 104, 88], [102, 92, 80], [130, 114, 94], [92, 80, 70]] : m === 'warm' ? [[146, 88, 52], [128, 74, 44], [160, 102, 60], [116, 66, 42]] : m === 'lamp' ? [[166, 112, 62], [146, 96, 54], [178, 126, 72], [130, 84, 48]] : [[150, 104, 62], [132, 88, 54], [162, 116, 72], [118, 78, 50]]).map(gr);
    const pw = 16, WC = gr([214, 196, 160]);
    fn = function (u, v, o) {
      const row = (v / pw) | 0, fv = v / pw - row;
      const L = 150 + lat(row, 1, seed) * 150, uu = u + lat(row, 2, seed) * L, idx = Math.floor(uu / L), fu = uu - idx * L;
      const h = lat(idx, row, seed), c = P[(h * 4) | 0];
      // grain: fine wavy lines running along the plank, bending round knots
      let ph = v * 2.1 + (nt(u * .02 + idx * 17.3, row * 9.1 + h * 50) - .5) * 30 + h * 40;
      const kh = lat(idx, row, seed + 5);
      if (kh < .45) { const ku = (lat(idx, row, seed + 6) * .7 + .15) * L, kv = (lat(idx, row, seed + 8) * .5 + .25) * pw, dx = (fu - ku) * .45, dy = (fv * pw - kv), d2 = dx * dx + dy * dy; ph += 9 * Math.exp(-d2 / 26); if (d2 < 3.2) ph = 99; }
      let g = ph === 99 ? -2.4 : Math.sin(ph); g = g * g * g;
      let k = .9 + .08 * g + (nt(u * .006 + 3, v * .006) - .5) * .26 + (nt(u * .05, v * .7 + row) - .5) * .1;
      k += brushF(u, v, 1, 0, 64, 6, seed) * .05;
      // seams, bevel, butt joints, nails
      if (fv < .07) k *= .34; else if (fv < .16) k *= 1.1; else if (fv > .9) k *= .84;
      if (fu < 1.4 || fu > L - .8) k *= .38; else if (fu < 4.4 && (fv > .25 && fv < .38 || fv > .62 && fv < .75)) k *= .5;
      // scuff / wear: lighter, greyer, matte
      const w = wear(u, v) * .85, sc = nt(u * .09 + 11, v * .09) > .72 ? .07 : 0;
      let R = c[0] * k, G = c[1] * k, B = c[2] * k;
      const ww = w * .5 + sc; R += (WC[0] * k * .9 - R) * ww; G += (WC[1] * k * .9 - G) * ww; B += (WC[2] * k * .9 - B) * ww;
      // varnish sheen (broad, away from the path)
      const sh = sstep(.58, .82, nt(u * .011 + 70, v * .016 + 20)) * (1 - w) * 22;
      o[0] = R + sh; o[1] = G + sh * .85; o[2] = B + sh * .6;
    };
    post = function (g) {
      for (let i = 0; i < W * H / 9000; i++) { const x = r() * W, y = r() * H; g.strokeStyle = css(gr([30, 18, 12]), .16 + r() * .14); g.lineWidth = r.r(.6, 1.6); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + r.r(4, 14), y + r.r(-2, 2), x + r.r(10, 30), y + r.r(-3, 3)); g.stroke(); }
    };
  } else if (type === 'checker' || type === 'tile') {
    const P = type === 'tile' ? { a: [196, 190, 150], b: [96, 128, 92], c: [170, 170, 130], d: [80, 110, 84] } : floorPal(S);
    const pa = gr(P.a), pb = gr(P.b), pc = gr(P.c), pd = gr(P.d), T = type === 'tile' ? 32 : 64, gw = type === 'tile' ? 1.5 : 2.1, GC = gr([54, 44, 38]), WC = gr([200, 190, 170]);
    fn = function (u, v, o) {
      const i = Math.floor(u / T), j = Math.floor(v / T), fu = u - i * T, fv = v - j * T, par = (i + j) & 1, hr = lat(i, j, seed);
      const c = hr < .08 ? pc : hr > .95 ? pd : par ? pb : pa;
      const el = Math.min(fu, fv, T - fu, T - fv), gwob = gw * (.75 + .6 * nt(u * .3, v * .3));
      let grout = el < gwob;
      // chipped corners / edges
      const ch = lat(i, j, seed + 9);
      if (!grout && ch < .3) { const cx = ch < .075 ? 0 : ch < .15 ? T : ch < .225 ? 0 : T, cy = ch < .075 ? 0 : ch < .15 ? 0 : ch < .225 ? T : T, dx = fu - cx, dy = fv - cy, rr = (T * .14) * (.6 + nt(u * .4 + i, v * .4 + j)); if (dx * dx + dy * dy < rr * rr) grout = 2; }
      const w = wear(u, v);
      if (grout) {
        const k = (grout === 2 ? .8 : .7) * (.8 + .4 * nt(u * .2, v * .2)) * (1 - w * .2);
        o[0] = GC[0] * k; o[1] = GC[1] * k; o[2] = GC[2] * k; return;
      }
      let k = .9 + (lat(i, j, seed + 3) - .5) * .12 + (nt(u * .015 + 9, v * .015) - .5) * .18;
      if (fv < 3.2 || fu < 2.4) k *= 1.1; else if (T - fv < 3 || T - fu < 2.6) k *= .84;
      k += brushF(u, v, par ? .9 : .42, par ? .44 : -.91, T * .45, T * .09, seed + par) * .06;
      if (Math.abs(nt(u * .22 + i * 7, v * .22) - .5) < .012) k *= .82;   // craquelure
      let R = c[0] * k, G = c[1] * k, B = c[2] * k;
      const ww = w * .42; R += (WC[0] * k - R) * ww * .5; G += (WC[1] * k - G) * ww * .5; B += (WC[2] * k - B) * ww * .5;
      const l = (R + G + B) / 3, ds = w * .35; R += (l - R) * ds; G += (l - G) * ds; B += (l - B) * ds;
      const sh = sstep(.6, .85, nt(u * .012 + 55, v * .018 + 21)) * (1 - w) * 26;
      o[0] = R + sh; o[1] = G + sh * .9; o[2] = B + sh * .75;
    };
    post = function (g) {
      for (let i = 0; i < W * H / 14000; i++) { let x = r() * W, y = r() * H; g.strokeStyle = css([30, 20, 20], .4); g.lineWidth = .9; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += r.r(-12, 12); y += r.r(-12, 12); g.lineTo(x, y); } g.stroke(); }
      if (loc.id === 'canteen') medallion(g, S, 5.5 * 64, 7.5 * 64, 2.1 * 64, gr);
      if (loc.id === 'gym') gymLines(g, S, gr);
    };
  } else if (type === 'cobble') {
    const cs = 64 / 3, sk = S.mood.sky || SKY[S.bucket], s0 = gr([118, 120, 124]), s1 = gr([100, 96, 98]), s2 = gr([136, 124, 106]), s3 = gr([112, 110, 92]), PAL = [s0, s1, s2, s0, s3, s1];
    const MOSS = gr([66, 92, 50]), SOIL = gr([36, 32, 30]), sky0 = mix(sk[0], [24, 34, 50], .4), sky1 = sk[1];
    fn = function (u, v, o) {
      const gx = u / cs, gy = v / cs, ix = Math.floor(gx), iy = Math.floor(gy);
      let d1 = 9, d2 = 9, cx1 = 0, cy1 = 0, id = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const X = ix + dx, Y = iy + dy, cx = X + .5 + (lat(X, Y, seed) - .5) * .55, cy = Y + .5 + (lat(X, Y, seed + 1) - .5) * .55, ex = gx - cx, ey = gy - cy, d = ex * ex + ey * ey;
        if (d < d1) { d2 = d1; d1 = d; cx1 = cx; cy1 = cy; id = X * 7 + Y * 131; } else if (d < d2) d2 = d;
      }
      const edge = Math.sqrt(d2) - Math.sqrt(d1), mz = nt(u * .05, v * .05);
      const pud = nt(u * .009 + 3, v * .011 + 7), wet = sstep(.66, .71, pud), damp = sstep(.56, .66, pud);
      if (edge < .1 + (mz - .5) * .06) {
        const moss = sstep(.5, .66, mz) * (1 - wet);
        let R = SOIL[0] + (MOSS[0] - SOIL[0]) * moss, G = SOIL[1] + (MOSS[1] - SOIL[1]) * moss, B = SOIL[2] + (MOSS[2] - SOIL[2]) * moss;
        if (wet) { R = R * (1 - wet) + sky0[0] * .45 * wet; G = G * (1 - wet) + sky0[1] * .45 * wet; B = B * (1 - wet) + sky0[2] * .45 * wet; }
        o[0] = R; o[1] = G; o[2] = B; return;
      }
      const c = PAL[((lat(id, 5, seed) * 6) | 0)], ex = gx - cx1, ey = gy - cy1;
      let k = .86 + (lat(id, 6, seed) - .5) * .22 + (nt(u * .25, v * .25) - .5) * .16;
      k += (-ex * -.35 - ey * -.94) * .5;                       // dome lit from the back-right
      k *= .62 + .38 * sstep(.1, .3, edge);                     // rounded edge falloff
      k += brushF(u, v, .7, .7, 14, 3.5, seed) * .05;
      let R = c[0] * k, G = c[1] * k, B = c[2] * k;
      const moss = sstep(.6, .75, mz) * sstep(.3, .1, edge) * (1 - damp); R += (MOSS[0] - R) * moss * .6; G += (MOSS[1] - G) * moss * .6; B += (MOSS[2] - B) * moss * .6;
      if (damp > 0) { const dk = 1 - damp * .35; R *= dk; G *= dk; B *= dk; }
      if (wet > 0) {   // puddle: reflects the sky with soft streaks
        const t = sstep(0, 1, (nt(u * .02 + 13, v * .006) * .6 + ((u + v) / (W + H)) * .4)), rr = sky0[0] + (sky1[0] - sky0[0]) * t, rg = sky0[1] + (sky1[1] - sky0[1]) * t, rb = sky0[2] + (sky1[2] - sky0[2]) * t;
        const a = wet * .8; R = R * .5 * (1 - a) + rr * .82 * a; G = G * .5 * (1 - a) + rg * .82 * a; B = B * .5 * (1 - a) + rb * .82 * a;
        if (wet < .9) { R += 18 * (1 - wet); G += 18 * (1 - wet); B += 20 * (1 - wet); }
      }
      o[0] = R; o[1] = G; o[2] = B;
    };
  } else if (type === 'asphalt') {
    const night = loc.mood === 'neon', A0 = gr([64, 66, 76]), A1 = gr([50, 52, 62]), sk = S.mood.sky || SKY[S.bucket], RF = night ? [60, 30, 70] : sk[1];
    fn = function (u, v, o) {
      let k = .86 + (nt(u * .02, v * .02) - .5) * .34 + (nt(u * .4, v * .4) - .5) * .14;
      const sp = lat(u | 0, v | 0, seed); if (sp > .94) k += .22; else if (sp < .05) k -= .2;
      const pt = nt(u * .007 + 50, v * .009 + 3), patch = pt > .64;
      const c = patch ? A1 : A0; if (patch && pt < .655) k *= .55;
      k += brushF(u, v, .995, .1, 100, 16, seed) * .05;
      let R = c[0] * k, G = c[1] * k, B = c[2] * k;
      const wv = nt(u * .006 + 20, v * .008 + 40), wet = sstep(.5, .62, wv);
      if (wet > 0) { const dk = 1 - wet * .4; R *= dk; G *= dk; B *= dk;
        const hue = nt(u * .04 + 7, v * .04) * 6.28, oil = sstep(.7, .8, nt(u * .02 + 90, v * .02 + 4)) * wet * 16;
        R += Math.sin(hue) * oil + RF[0] * .12 * wet; G += Math.sin(hue + 2.1) * oil + RF[1] * .12 * wet; B += Math.sin(hue + 4.2) * oil + RF[2] * .14 * wet; }
      o[0] = R; o[1] = G; o[2] = B;
    };
    post = function (g) { asphaltDetails(g, S, W, H, gr); };
  } else if (type === 'metal') {
    const storm = loc.mood === 'storm', M = gr(storm ? [98, 108, 114] : [110, 108, 100]), RU = gr([128, 72, 42]);
    fn = function (u, v, o) {
      const i = Math.floor(u / 64), j = Math.floor(v / 64), fu = u - i * 64, fv = v - j * 64;
      let k = .9 + (lat(i, j, seed) - .5) * .1 + (nt(u * .02 + i, v * .02) - .5) * .2;
      // diamond tread: alternating short raised bars
      const a = (fu + fv) / 9, b = (fu - fv) / 9, ca = Math.floor(a), cb = Math.floor(b), fa = a - ca - .5, fb = b - cb - .5, alt = (ca + cb) & 1;
      const along = alt ? fa : fb, perp = alt ? fb : fa;
      if (Math.abs(along) < .36 && Math.abs(perp) < .13) k *= perp < 0 ? 1.22 : .7;
      if (fu < 1.2 || fv < 1.2 || fu > 62.8 || fv > 62.8) k *= .35;
      else if (fu < 3 || fv < 3) k *= 1.12;
      k += brushF(u, v, .7, .7, 30, 6, seed) * .05;
      let R = M[0] * k, G = M[1] * k, B = M[2] * k;
      const ru = sstep(.6, .74, nt(u * .015 + 30, v * .015 + 8)) * (.6 + .4 * nt(u * .3, v * .3)); R += (RU[0] * k - R) * ru; G += (RU[1] * k - G) * ru; B += (RU[2] * k - B) * ru;
      if (storm) { const wt = sstep(.55, .7, nt(u * .008 + 5, v * .01 + 60)); R += wt * 14; G += wt * 18; B += wt * 24; }
      o[0] = R; o[1] = G; o[2] = B;
    };
    post = function (g) { metalDetails(g, S, W, H, gr); };
  } else if (type === 'carpet') {
    post = function (g) { carpetPaint(g, S, W, H, gr); };
  } else { // concrete
    const C0 = gr([104, 104, 108]), ST = gr([44, 34, 26]);
    fn = function (u, v, o) {
      const i = Math.floor(u / 128), j = Math.floor(v / 128), fu = u - i * 128, fv = v - j * 128, sa = lat(i, j, seed) * 3;
      let k = .86 + (lat(i, j, seed + 2) - .5) * .12 + (nt(u * .018, v * .018) - .5) * .3 + (nt(u * .3, v * .3) - .5) * .1;
      k += brushF(u, v, Math.cos(sa), Math.sin(sa), 80, 22, seed) * .07;
      const sp = lat(u | 0, v | 0, seed); if (sp > .96) k += .18; else if (sp < .03) k -= .2;
      const el = Math.min(fu, fv, 128 - fu, 128 - fv); if (el < 1.4 + nt(u * .3, v * .3) * 1.2) k *= .3; else if (el < 4) k *= fu < 4 || fv < 4 ? 1.08 : .9;
      let R = C0[0] * k, G = C0[1] * k, B = C0[2] * k;
      const st = nt(u * .012 + 9, v * .014 + 30), oil = sstep(.64, .72, st); R += (ST[0] - R) * oil * .7; G += (ST[1] - G) * oil * .7; B += (ST[2] - B) * oil * .7;
      if (Math.abs(st - .6) < .006) { R *= .7; G *= .7; B *= .72; }
      const w = wear(u, v) * .3; R += (150 - R) * w * .3; G += (148 - G) * w * .3; B += (146 - B) * w * .3;
      o[0] = R; o[1] = G; o[2] = B;
    };
    post = function (g) {
      for (let i = 0; i < 14; i++) { let x = r() * W, y = r() * H; g.strokeStyle = css([20, 18, 22], .5); g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += r.r(-14, 14); y += r.r(-14, 14); g.lineTo(x, y); } g.stroke(); }
    };
  }
  // compose in local floor space, then transform into the scene
  const ks = .8, lc = fn ? matCanvas(W, H, ks, fn) : mk(W * ks, H * ks), lg = ctx2(lc);
  lg.save(); lg.scale(ks, ks);
  if (!fn) { lg.fillStyle = css(gr([60, 44, 38])); lg.fillRect(0, 0, W, H); }
  if (post) post(lg);
  // directional over-strokes: a sparse layer of real bristle strokes so the brush reads at play zoom
  const ang = type === 'wood' ? 0 : type === 'asphalt' ? .1 : -.5;
  for (let i = 0, n = W * H / 2600; i < n; i++) {
    const x = r() * W, y = r() * H, lite = r() < .5;
    bristle(lg, x, y, ang + r.g() * (type === 'wood' ? .05 : .5), r.r(16, 46), r.r(2, 5), lite ? [255, 236, 200] : [20, 14, 24], lite ? .045 : .07, r);
  }
  // ambient occlusion by the two back walls (soft, two-stage)
  let g = lg.createLinearGradient(0, 0, 0, 90); g.addColorStop(0, 'rgba(6,4,14,.62)'); g.addColorStop(.25, 'rgba(6,4,14,.28)'); g.addColorStop(1, 'rgba(6,4,14,0)'); lg.fillStyle = g; lg.fillRect(0, 0, W, 90);
  g = lg.createLinearGradient(0, 0, 90, 0); g.addColorStop(0, 'rgba(6,4,14,.66)'); g.addColorStop(.25, 'rgba(6,4,14,.3)'); g.addColorStop(1, 'rgba(6,4,14,0)'); lg.fillStyle = g; lg.fillRect(0, 0, 90, H);
  g = lg.createRadialGradient(0, 0, 0, 0, 0, 160); g.addColorStop(0, 'rgba(6,4,14,.4)'); g.addColorStop(1, 'rgba(6,4,14,0)'); lg.fillStyle = g; lg.fillRect(0, 0, 160, 160);
  lg.restore();
  ctx.save(); floorFrame(ctx, S); ctx.drawImage(lc, 0, 0, W, H); ctx.restore();
}
function asphaltDetails(ctx, S, W, H, gr) {
  const loc = S.loc, r = S.r, night = loc.mood === 'neon', PV = loc.pave === undefined ? 4.6 : loc.pave, rail = loc.rails === undefined ? (loc.id === 'street' ? 11.4 : -1) : loc.rails;
  // lane markings (faded, chipped) + zebra
  const ly = (rail > 0 ? rail - 2.4 : H / 64 - 2.2) * 64;
  for (let x = 40; x < W - 40; x += 120) paintRect(ctx, x, ly - 2.5, 64, 5, [214, 200, 150], r, { n: 8, sw: 2, ang: 0, edge: false, alpha: .5, jv: .2 });
  for (let k = 0; k < 7; k++) paintRect(ctx, 2.2 * 64 + k * 14, (PV + .35) * 64, 7, 70, [220, 214, 190], r, { n: 10, sw: 2.5, ang: 1.57, edge: false, alpha: .42, jv: .2 });
  if (PV > 0) {
    for (let j = 0; j < PV * 2; j++) for (let i = 0; i < W / 64; i++) {
      const c = jit(gr([118, 114, 108]), r, .1), hh = Math.min(30.4, PV * 64 - j * 32 - 1.6);
      paintRect(ctx, i * 64 + .8, j * 32 + .8, 62.4, hh, c, r, { n: 9, sw: 4, sl: 20, ang: r() * 3, alt: gr([84, 92, 96]), jv: .1, ha: .5, ew: 1.2 });
      if (r() < .18) { ctx.fillStyle = css([20, 30, 50], .25); ctx.beginPath(); ctx.ellipse(i * 64 + r.r(10, 54), j * 32 + r.r(6, 24), r.r(6, 16), r.r(3, 7), 0, 0, 7); ctx.fill(); }
    }
    ctx.strokeStyle = css(gr([30, 28, 30]), .7); ctx.lineWidth = 1.3; ctx.beginPath(); for (let i = 0; i <= W / 64; i++) { ctx.moveTo(i * 64, 0); ctx.lineTo(i * 64, PV * 64); } for (let j = 0; j <= PV * 2; j++) { ctx.moveTo(0, j * 32); ctx.lineTo(W, j * 32); } ctx.stroke();
    for (let i = 0; i < W / 30; i++) { const x = r() * W; ctx.fillStyle = css([60, 84, 50], .35); ctx.fillRect(x, r() * PV * 64, r.r(2, 6), 1.5); }   // weeds in joints
    paintRect(ctx, 0, PV * 64, W, 11, gr([164, 158, 148]), r, { n: W / 5, sw: 3, ang: 0, ink: true, ew: 1.6, ha: .9, light: [0, -1] });
    ctx.fillStyle = css([6, 4, 14], .45); ctx.fillRect(0, PV * 64 + 11, W, 9);
    const gg = ctx.createLinearGradient(0, PV * 64 + 11, 0, PV * 64 + 40); gg.addColorStop(0, 'rgba(6,4,14,.3)'); gg.addColorStop(1, 'rgba(6,4,14,0)'); ctx.fillStyle = gg; ctx.fillRect(0, PV * 64 + 11, W, 30);
  }
  if (rail > 0) {
    const ry = rail * 64;
    for (let x = 0; x < W; x += 21) for (let k = 0; k < 4; k++) paintEll(ctx, x + r.r(-2, 2) + 10, ry - 6 + k * 18 + r.r(-2, 2), r.r(8, 10.5), r.r(7, 9), jit(gr([96, 98, 104]), r, .12), r, { n: 3, pn: 8, sw: 3, ink: false, ew: 1, alt: gr([70, 80, 96]) });
    for (const off of [8, 52]) {
      ctx.fillStyle = css([14, 12, 16], .92); ctx.fillRect(0, ry + off - 3.4, W, 7);
      ctx.fillStyle = css(night ? [150, 170, 210] : [180, 180, 186], .8); ctx.fillRect(0, ry + off - 2.4, W, 1.6);
      ctx.fillStyle = css([110, 60, 40], .35); for (let x = 0; x < W; x += 9) if (r() < .4) ctx.fillRect(x, ry + off + 1, r.r(3, 9), 2);
      ctx.strokeStyle = css([255, 255, 255], .35); ctx.lineWidth = .8; ctx.beginPath(); for (let x = r() * 80; x < W; x += r.r(60, 160)) { ctx.moveTo(x, ry + off - 2); ctx.lineTo(x + r.r(10, 40), ry + off - 2); } ctx.stroke();
    }
  }
  for (let i = 0; i < 22; i++) { let x = r() * W, y = r() * H; ctx.strokeStyle = css([12, 12, 18], .6); ctx.lineWidth = r.r(.8, 1.8); ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 7; k++) { x += r.r(-16, 16); y += r.r(-14, 14); ctx.lineTo(x, y); } ctx.stroke(); }
  for (const [mx, my] of [[W * .42, (PV + 2.4) * 64], [W * .78, (PV + 3.6) * 64]]) {
    if (my > H - 40) continue;
    ctx.fillStyle = css([8, 8, 12], .5); ctx.beginPath(); ctx.arc(mx + 1, my + 1.5, 23, 0, 7); ctx.fill();
    paintEll(ctx, mx, my, 21, 21, [64, 62, 66], r, { n: 12, ink: true, ew: 1.4, lit: [[150, 150, 150], [20, 20, 30], -2.2, .3, .3] });
    ctx.strokeStyle = css([20, 20, 22], .8); ctx.lineWidth = 1.5; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(mx - 15, my + k * 6); ctx.lineTo(mx + 15, my + k * 6); ctx.stroke(); }
    ctx.fillStyle = css([110, 64, 40], .3); ctx.beginPath(); ctx.arc(mx + 6, my + 4, 8, 0, 7); ctx.fill();
  }
  // litter: paper scraps, leaflets
  for (let i = 0; i < 14; i++) { const x = r() * W, y = r.r(PV * 64, H), a = r() * 3; ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = css(r() < .5 ? [210, 200, 170] : [190, 80, 70], .55); ctx.fillRect(-5, -3.5, 10, 7); ctx.restore(); }
}
function metalDetails(ctx, S, W, H, gr) {
  const loc = S.loc, r = S.r, storm = loc.mood === 'storm';
  for (let j = 0; j < lh(loc); j++) for (let i = 0; i < lw(loc); i++) {
    const x0 = i * 64, y0 = j * 64;
    if (lat(i, j, S.seed + 4) > .86) {
      paintRect(ctx, x0 + 1, y0 + 1, 62, 62, [16, 14, 18], r, { n: 6, ink: true, ew: 1.4 });
      const hg = ctx.createRadialGradient(x0 + 32, y0 + 32, 2, x0 + 32, y0 + 32, 40); hg.addColorStop(0, 'rgba(255,110,40,.45)'); hg.addColorStop(1, 'rgba(255,110,40,0)'); ctx.fillStyle = hg; ctx.fillRect(x0 + 3, y0 + 3, 58, 58);
      ctx.strokeStyle = css(gr([108, 112, 112]), .9); ctx.lineWidth = 2.2; ctx.beginPath(); for (let k = 1; k < 8; k++) { ctx.moveTo(x0 + k * 8, y0 + 3); ctx.lineTo(x0 + k * 8, y0 + 61); } ctx.stroke();
      ctx.strokeStyle = css(gr([70, 74, 78]), .9); ctx.lineWidth = 1.4; ctx.beginPath(); for (let k = 1; k < 4; k++) { ctx.moveTo(x0 + 3, y0 + k * 16); ctx.lineTo(x0 + 61, y0 + k * 16); } ctx.stroke();
      S.lights.push((function () { const q = gp(S, (x0 + 32) / 64, (y0 + 32) / 64, 0); return { x: q[0], y: q[1], r: 70, col: [255, 120, 50], a: .1, fl: .25, ph: r() * 6, kind: 'heat' }; })());
      continue;
    }
    for (const [dx, dy] of [[5, 5], [59, 5], [5, 59], [59, 59]]) { ctx.fillStyle = css([34, 34, 38], .9); ctx.beginPath(); ctx.arc(x0 + dx, y0 + dy, 2.2, 0, 7); ctx.fill(); ctx.fillStyle = css([230, 230, 220], .55); ctx.fillRect(x0 + dx - 1, y0 + dy - 1.5, 1.6, 1); }
  }
  for (const p of (loc.props || [])) if ((p.t === 'generator' || p.t === 'console') && !p.side) {
    const x0 = (p.x - .28) * 64, y0 = (p.y - .28) * 64, w = ((p.w || 1) + .56) * 64, h = ((p.h || 1) + .56) * 64;
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.rect(x0 + 9, y0 + 9, w - 18, h - 18); ctx.clip('evenodd');
    ctx.fillStyle = css([34, 30, 26], .95); ctx.fillRect(x0, y0, w, h); ctx.fillStyle = css(gr([214, 176, 50]), .9);
    for (let a = -h; a < w + h; a += 22) { ctx.beginPath(); ctx.moveTo(x0 + a, y0); ctx.lineTo(x0 + a + 11, y0); ctx.lineTo(x0 + a + 11 - h, y0 + h); ctx.lineTo(x0 + a - h, y0 + h); ctx.fill(); }
    for (let i = 0; i < 30; i++) { ctx.fillStyle = css([40, 34, 30], .6); ctx.fillRect(x0 + r() * w, y0 + r() * h, r.r(2, 8), r.r(1, 3)); }
    ctx.restore();
  }
  for (let k = 0; k < 3; k++) { let x = r() * W * .6 + W * .2, y = r() * H * .6 + H * .2; ctx.strokeStyle = css([12, 12, 14], .92); ctx.lineWidth = r.r(4, 6.5); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); for (let q = 0; q < 4; q++) { ctx.quadraticCurveTo(x + r.r(-90, 90), y + r.r(-90, 90), x += r.r(-130, 130), y += r.r(-130, 130)); } ctx.stroke(); ctx.strokeStyle = css([120, 130, 150], .28); ctx.lineWidth = 1.4; ctx.stroke(); }
  for (let i = 0; i < 10; i++) { ctx.fillStyle = css([10, 8, 8], .18 + r() * .15); ctx.beginPath(); ctx.ellipse(r() * W, r() * H, r.r(10, 36), r.r(7, 22), r() * 3, 0, 7); ctx.fill(); }
  if (storm) for (let i = 0; i < 8; i++) { const x = r() * W, y = r() * H, rx = r.r(20, 50); ctx.strokeStyle = css([190, 210, 240], .18); ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y, rx, rx * .7, 0, 3.6, 5.6); ctx.stroke(); }
}
function carpetPaint(ctx, S, W, H, gr) {
  const loc = S.loc, r = S.r, lamp = loc.mood === 'lamp', P = lamp ? { a: [124, 48, 46], b: [152, 66, 52], c: [220, 176, 100], d: [44, 66, 68] } : { a: [84, 62, 74], b: [110, 72, 78], c: [196, 164, 110], d: [40, 58, 70] };
  paintRect(ctx, 0, 0, W, H, gr(P.a), r, { n: W * H / 60, sw: 5, sl: 30, ang: 0, aj: .12, alt: gr(P.b), jv: .1, edge: false });
  for (let j = 0; j < H / 64; j++) for (let i = 0; i < W / 64; i++) {
    const cx = i * 64 + 32, cy = j * 64 + 32, k = ((i + j) & 1) ? 1 : .7;
    paintPoly(ctx, [[cx, cy - 26 * k], [cx + 26 * k, cy], [cx, cy + 26 * k], [cx - 26 * k, cy]], jit(gr(P.b), r, .08), r, { n: 5, sw: 3, sl: 14, ang: .8, ink: false, edge: false, alt: gr(P.c), jv: .1, alpha: .85 });
    ctx.strokeStyle = css(gr(P.c), .5); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(cx, cy - 20 * k); ctx.lineTo(cx + 20 * k, cy); ctx.lineTo(cx, cy + 20 * k); ctx.lineTo(cx - 20 * k, cy); ctx.closePath(); ctx.stroke();
  }
  ctx.strokeStyle = css(gr(P.c), .85); ctx.lineWidth = 4; ctx.strokeRect(14, 14, W - 28, H - 28); ctx.strokeStyle = css(gr(P.d), .9); ctx.lineWidth = 3; ctx.strokeRect(24, 24, W - 48, H - 48);
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
      if (r() < .08) { ctx.fillStyle = css([40, 30, 28], .8); const q = pts[1]; ctx.beginPath(); ctx.arc(q[0], q[1], r.r(2, 4), 0, 7); ctx.fill(); }
    }
  }
  ctx.fillStyle = css([226, 200, 150], .95); ctx.beginPath();
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.2832 - 1.57, rr = i % 2 ? R * .07 : R * .2; ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.strokeStyle = css([30, 24, 24], .8); ctx.lineWidth = 1.2; ctx.stroke();
  // trodden centre
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R); g.addColorStop(0, 'rgba(220,210,190,.12)'); g.addColorStop(1, 'rgba(220,210,190,0)'); ctx.fillStyle = g; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
}
function gymLines(ctx, S, gr) {
  const loc = S.loc, W = lw(loc) * 64, H = lh(loc) * 64, r = S.r;
  ctx.save(); ctx.lineCap = 'round';
  const line = (pts, col, a) => { for (let k = 0; k < 2; k++) { ctx.strokeStyle = css(col, a * (k ? .5 : 1)); ctx.lineWidth = k ? 1.4 : 3; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0] + r.r(-.6, .6), p[1] + r.r(-.6, .6)) : ctx.moveTo(p[0], p[1])); ctx.stroke(); } };
  line([[70, 70], [W - 70, 70], [W - 70, H - 70], [70, H - 70], [70, 70]], [226, 214, 160], .55);
  line([[W / 2, 70], [W / 2, H - 70]], [226, 214, 160], .55);
  ctx.globalAlpha = .55; ctx.strokeStyle = css([226, 214, 160], 1); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(W / 2, H / 2, 90, 0, 7); ctx.stroke(); ctx.strokeStyle = css([190, 80, 60], 1);
  ctx.beginPath(); ctx.arc(8.5 * 64, 3.5 * 64, 120, 0, 3.14); ctx.stroke(); ctx.restore();
}
/* front faces of the floor slab: a cut section (floor finish, screed, rough core) */
function paintFloorEdge(ctx, S) {
  const loc = S.loc, w = lw(loc), h = lh(loc), r = S.r;
  const a = gp(S, w, 0), b = gp(S, w, h), c = gp(S, 0, h), E = EDGE;
  const core = mul([58, 44, 40], S.mood.bake), lip = mul(loc.floor === 'asphalt' || loc.floor === 'cobble' ? [90, 88, 92] : loc.floor === 'wood' ? [120, 84, 52] : [130, 120, 104], S.mood.bake);
  for (const [p, q, k] of [[a, b, .8], [b, c, .52]]) {
    paintPoly(ctx, [p, q, [q[0], q[1] + E], [p[0], p[1] + E]], mul(core, k), r, { n: 40, sw: 3, ang: 1.57, aj: .4, ink: true, inka: .7, alt: mul(core, k * 1.3) });
    paintPoly(ctx, [p, q, [q[0], q[1] + 3.5], [p[0], p[1] + 3.5]], mul(lip, k), r, { n: 20, sw: 2, ang: 0, edge: false });
    ctx.strokeStyle = css([255, 230, 190], .16 * k); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p[0], p[1] + .5); ctx.lineTo(q[0], q[1] + .5); ctx.stroke();
  }
}

/* ------------------------------------------------------------------- walls */
function wallPal(S) {
  const t = S.loc.wall || 'plaster', m = S.loc.mood;
  if (t === 'tiled') return m === 'storm' ? { b: [176, 192, 184], g: [58, 96, 92], m: [60, 70, 70] } : { b: [212, 206, 176], g: [78, 120, 96], m: [70, 66, 54] };
  if (t === 'corrugated') return m === 'storm' ? { b: [112, 128, 134], m: [44, 52, 58], rust: [140, 78, 44] } : { b: [136, 130, 112], m: [50, 46, 40], rust: [150, 80, 40] };
  if (t === 'brick' && m === 'neon') return { b: [112, 70, 74], m: [44, 40, 52], pl: [120, 116, 120] };
  if (t === 'brick' && m === 'storm') return { b: [104, 92, 90], m: [46, 48, 56], pl: [150, 150, 140] };
  if (m === 'lamp') return { top: [200, 164, 104], dado: [112, 76, 58] };
  if (t === 'brick') return m === 'warm' ? { b: [176, 84, 48], m: [74, 54, 44], pl: [210, 190, 150] } : m === 'ember' ? { b: [120, 56, 40], m: [40, 28, 28], pl: [120, 100, 84] } : { b: [136, 78, 58], m: [64, 52, 48], pl: [180, 170, 140] };
  if (m === 'sick') return { top: [196, 206, 160], dado: [74, 120, 84] };
  if (m === 'cold') return { top: [170, 184, 168], dado: [58, 100, 92] };
  if (m === 'umber') return { top: [176, 146, 100], dado: [110, 78, 52] };
  if (m === 'warm') return { top: [196, 170, 120], dado: [96, 62, 44] };
  return { top: [186, 170, 130], dado: [78, 112, 82] };
}
const GHOSTS = ['UNITY IS DUTY', 'ONE BELL · ONE VOICE', 'STUDY · OBEY · SERVE', 'THE FUTURE LISTENS', 'ORDER', 'WORK IS JOY'];
function paintWall(ctx, S, side) {
  const loc = S.loc, r = S.r, len = (side === 'l' ? lh(loc) : lw(loc)) * 64, P = wallPal(S), type = loc.wall || 'plaster', seed = (S.seed + (side === 'l' ? 77 : 0)) % 9973;
  const gr = (c) => mul(C(c), S.mood.bake), dark = side === 'l' ? .74 : 1.0, WH = WALLH;
  const dado = WH * .52, skirt = WH - 11;
  let fn = null;
  const brickAt = (u, v, o, B, M, kk) => {   // writes brick colour, returns 1 if mortar
    const row = (v / 10) | 0, off = (row & 1) ? 15 : 0, col = Math.floor((u + off) / 30), fu = u + off - col * 30, fv = v - row * 10;
    const wob = nt(u * .2, v * .2) * 1.1;
    if (fu < .9 + wob || fv < .9 + wob * .8) { const k = kk * (.74 + .4 * nt(u * .3 + 5, v * .3)) * (fv < 2.2 ? .7 : 1); o[0] = M[0] * k; o[1] = M[1] * k; o[2] = M[2] * k; return 1; }
    const h = lat(col, row, seed); let k = kk * (.8 + h * .34 + (nt(u * .35, v * .35) - .5) * .2);
    if (fv < 3) k *= 1.16; else if (fv > 8.6) k *= .8; if (fu > 27.8) k *= .86;
    let R = B[0] * k, G = B[1] * k, Bl = B[2] * k;
    const hb = lat(col, row, seed + 3); if (hb < .08) { R *= .62; G *= .6; Bl *= .7; } else if (hb > .93) { R *= 1.12; G *= 1.08; Bl *= 1.02; }
    o[0] = R; o[1] = G; o[2] = Bl; return 0;
  };
  if (type === 'brick') {
    const B = gr(P.b), M = gr(P.m), PL = gr(P.pl || [180, 170, 140]);
    fn = function (u, v, o) {
      brickAt(u, v, o, B, M, dark);
      // plaster remnants clinging on
      const pl = nt(u * .009 + 5 + seed, v * .016 + 9) - (v / WH) * .1;
      if (pl > .69) { const k = dark * (.86 + .2 * nt(u * .1, v * .1) + brushF(u, v, .995, .1, 50, 9, seed) * .06); o[0] = PL[0] * k; o[1] = PL[1] * k; o[2] = PL[2] * k; }
      else if (pl > .665) { o[0] *= .55; o[1] *= .55; o[2] *= .6; }
      shadeWall(u, v, o, WH, seed);
    };
  } else if (type === 'tiled') {
    const TB = gr(P.b), TG = gr(P.g), M = gr(P.m), RU = gr([120, 70, 36]);
    fn = function (u, v, o) {
      const th = 11, tw = 18, row = (v / th) | 0, col = (u / tw) | 0, fu = u - col * tw, fv = v - row * th, low = v >= WH * .6, c = low ? TG : TB;
      if (fu < 1 || fv < 1) { const k = dark * .8; o[0] = M[0] * k; o[1] = M[1] * k; o[2] = M[2] * k; }
      else {
        let k = dark * (.9 + (lat(col, row, seed) - .5) * .1 + (nt(u * .05, v * .05) - .5) * .12); if (fv < 2.6) k *= 1.14; else if (fv > th - 2) k *= .84;
        const miss = lat(col, row, seed + 2) < .03; if (miss) { k *= .5; }
        k += brushF(u, v, .85, .5, 14, 3, seed) * .05;
        o[0] = c[0] * k; o[1] = c[1] * k; o[2] = c[2] * k;
        if (miss) { o[0] = M[0] * .7; o[1] = M[1] * .7; o[2] = M[2] * .7; }
      }
      const ru = sstep(.6, .8, nt(u * .25 + 3, v * .006 + seed)) * (1 - v / WH) * .8; o[0] += (RU[0] * dark - o[0]) * ru; o[1] += (RU[1] * dark - o[1]) * ru; o[2] += (RU[2] * dark - o[2]) * ru;
      if (Math.abs(v - WH * .6) < 2.4) { o[0] = 26 * dark; o[1] = 36 * dark; o[2] = 32 * dark; }
      shadeWall(u, v, o, WH, seed);
    };
  } else if (type !== 'corrugated') {   // painted plaster with dado
    const TP = gr(P.top), DD = gr(P.dado), BR = gr([136, 78, 58]), BM = gr([70, 58, 50]), RENDER = gr([150, 140, 124]), RAIL = gr([60, 40, 30]);
    fn = function (u, v, o) {
      const low = v > dado, c = low ? DD : TP;
      let k = dark * (.92 + (nt(u * .01 + seed, v * .02) - .5) * .2 + brushF(u, v, .996, .09, low ? 70 : 90, low ? 9 : 12, seed + (low ? 1 : 0)) * .065);
      if (low) k *= 1 + sstep(dado + 6, dado, v) * .06;
      o[0] = c[0] * k; o[1] = c[1] * k; o[2] = c[2] * k;
      // peeling: paint gone -> render -> brick
      const pe = nt(u * .018 + 31 + seed, v * .026 + 11);
      if (pe > .7) { if (pe > .76) brickAt(u, v, o, BR, BM, dark); else { const kk = dark * (.85 + .3 * nt(u * .2, v * .2)); o[0] = RENDER[0] * kk; o[1] = RENDER[1] * kk; o[2] = RENDER[2] * kk; } }
      else if (pe > .685) { o[0] *= 1.12; o[1] *= 1.1; o[2] *= 1.05; }
      else if (pe > .67) { o[0] *= .7; o[1] *= .7; o[2] *= .72; }
      // water stains: tide rings near the top
      const ws = nt(u * .008 + 4 + seed, v * .012) - v / WH * .25;
      if (ws > .5) { const a = ws > .515 ? .14 : .32; o[0] -= 40 * a; o[1] -= 46 * a; o[2] -= 60 * a; }
      // hand-height grime above the dado, scuffs on the dado
      if (low && v < dado + 30) { const sm = nt(u * .04, v * .2) * .1; o[0] *= 1 - sm; o[1] *= 1 - sm; o[2] *= 1 - sm; }
      if (Math.abs(v - dado) < 2.4) { const kk = dark * (v < dado ? 1.4 : .9); o[0] = RAIL[0] * kk; o[1] = RAIL[1] * kk; o[2] = RAIL[2] * kk; }
      shadeWall(u, v, o, WH, seed);
    };
  }
  if (fn) {
    const ks = .85, ky = 1.5, lc = matCanvas(len, WH, ks, fn, ky), lg = ctx2(lc);
    lg.scale(ks, ky);
    wallDecor(lg, S, side, len, type, P, gr, dark, seed);
    ctx.save(); wallFrame(ctx, S, side); ctx.drawImage(lc, 0, 0, len, WH); ctx.restore();
  } else {
    ctx.save(); wallFrame(ctx, S, side); ctx.beginPath(); ctx.rect(0, 0, len, WH); ctx.clip();
    ctx.fillStyle = css(gr(P.m)); ctx.fillRect(0, 0, len, WH);
    for (let u = 0; u < len; u += 12) {
      const c = jit(gr(P.b), r, .06), g2 = ctx.createLinearGradient(u, 0, u + 12, 0);
      g2.addColorStop(0, css(mul(c, .62 * dark))); g2.addColorStop(.45, css(mul(c, 1.16 * dark))); g2.addColorStop(1, css(mul(c, .7 * dark)));
      ctx.fillStyle = g2; ctx.fillRect(u, 0, 12, WH);
      for (let k = 0; k < 2; k++) bristle(ctx, u + 4 + r() * 4, r() * WH, 1.57 + r.g() * .05, r.r(30, 90), r.r(2, 4), mul(c, 1 + r.g() * .12), .35, r);
    }
    for (let i = 0; i < len / 22; i++) { const x = r() * len, y = r.r(20, WH), s = r.r(10, 34); ctx.globalAlpha = .45; ctx.drawImage(glowSprite(mul(P.rust, dark), 128), x - s / 2, y - s, s, s * 3); }
    ctx.globalAlpha = 1;
    for (let u = 0; u < len; u += 64) { ctx.fillStyle = css([14, 12, 14], .6); ctx.fillRect(u - 1, 0, 2.4, WH); }
    wallDecor(ctx, S, side, len, type, P, gr, dark, seed);
    ctx.restore();
  }
}
/* shared wall weathering per pixel: soot from the top, rising damp, grime streaks */
function shadeWall(u, v, o, WH, seed) {
  const top = 1 - v / WH, n = nt(u * .02 + seed, v * .03);
  const soot = Math.max(0, top - .55) * 1.1 * (.5 + n); let k = 1 - soot * .5;
  const dm = nt(u * .016 + 7, v * .04 + seed) * (v / WH) * (v / WH); if (dm > .3) k *= 1 - (dm - .3) * .9;
  if (Math.abs(dm - .3) < .01) { o[0] += 26; o[1] += 26; o[2] += 22; }
  const st = nt(u * .22 + seed, v * .004); if (st > .64) k *= 1 - (st - .64) * .9;
  o[0] *= k; o[1] *= k * (dm > .3 ? 1.02 : 1); o[2] *= k;
}
/* canvas-painted wall details in local wall space: cracks, propaganda ghost, skirting, AO, light pooling */
function wallDecor(g, S, side, len, type, P, gr, dark, seed) {
  const r = S.r, loc = S.loc, WH = WALLH;
  // cracks
  for (let i = 0; i < len / 120; i++) { let x = r() * len, y = r.r(0, WH * .5); g.strokeStyle = css([26, 20, 20], .5); g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 7; k++) { x += r.r(-5, 5); y += r.r(4, 12); g.lineTo(x, y); } g.stroke(); g.strokeStyle = css([255, 240, 210], .12); g.beginPath(); g.moveTo(x + 1, y); g.stroke(); }
  // painted propaganda ghost on a free stretch of wall
  if (type !== 'tiled' && type !== 'corrugated') {
    const occ = (loc.props || []).filter(p => p.side === side).map(p => [wallStart(p) * 64 - 20, (wallStart(p) + wallLen(p)) * 64 + 20]);
    let best = null;
    for (let u = 40; u + 170 < len; u += 16) { if (!occ.some(q => u < q[1] && u + 170 > q[0])) { best = u; if (lat(u, 1, seed) < .3) break; } }
    if (best !== null && lat(seed, 3, 1) < .8) {
      const txt = GHOSTS[(seed + (side === 'l' ? 3 : 0)) % GHOSTS.length], w = 170, h = 44, tc = mk(w * 2, h * 2), tg = ctx2(tc);
      tg.scale(2, 2); tg.fillStyle = '#fff'; tg.font = 'bold 15px Georgia, serif'; tg.textAlign = 'center'; tg.textBaseline = 'middle';
      const words = txt.split(' · '); words.forEach((wd, i) => tg.fillText(wd, w / 2, h / 2 + (i - (words.length - 1) / 2) * 17, w - 10));
      tg.fillRect(8, 3, w - 16, 2); tg.fillRect(8, h - 5, w - 16, 2);
      tg.setTransform(1, 0, 0, 1, 0, 0); tg.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 160; i++) { tg.globalAlpha = .25 + r() * .5; bristle(tg, r() * w * 2, r() * h * 2, r.g() * .3, r.r(10, 40), r.r(2, 8), [0, 0, 0], 1, r); }
      tg.globalAlpha = 1; tg.globalCompositeOperation = 'source-in'; tg.fillStyle = css(lat(seed, 9, 2) < .5 ? [210, 200, 170] : [170, 50, 40]); tg.fillRect(0, 0, w * 2, h * 2);
      g.globalAlpha = .2; g.drawImage(tc, best, 16, w, h); g.globalAlpha = 1;
    }
  }
  // skirting board (painted wood) for interiors
  if (type !== 'corrugated' && loc.floor !== 'asphalt' && loc.floor !== 'cobble') {
    paintRect(g, 0, WH - 11, len, 11, mul(gr([62, 44, 34]), dark), r, { n: len / 6, sw: 2.6, sl: 40, ang: 0, aj: .04, edge: false, alt: mul(gr([90, 64, 44]), dark) });
    g.fillStyle = css([255, 226, 180], .2); g.fillRect(0, WH - 11, len, 1.3); g.fillStyle = css([8, 6, 12], .5); g.fillRect(0, WH - 9.6, len, 1);
  }
  // ceiling shadow & floor-line AO & corner shade
  let gg = g.createLinearGradient(0, 0, 0, 60); gg.addColorStop(0, 'rgba(6,4,14,.8)'); gg.addColorStop(.4, 'rgba(6,4,14,.3)'); gg.addColorStop(1, 'rgba(6,4,14,0)'); g.fillStyle = gg; g.fillRect(0, 0, len, 60);
  gg = g.createLinearGradient(0, WH - 34, 0, WH); gg.addColorStop(0, 'rgba(6,4,14,0)'); gg.addColorStop(.7, 'rgba(6,4,14,.25)'); gg.addColorStop(1, 'rgba(6,4,14,.6)'); g.fillStyle = gg; g.fillRect(0, WH - 34, len, 34);
  gg = g.createLinearGradient(0, 0, 110, 0); gg.addColorStop(0, 'rgba(6,4,14,.62)'); gg.addColorStop(.3, 'rgba(6,4,14,.25)'); gg.addColorStop(1, 'rgba(6,4,14,0)'); g.fillStyle = gg; g.fillRect(0, 0, 110, WH);
  gg = g.createLinearGradient(len - 160, 0, len, 0); gg.addColorStop(0, css(S.mood.glow, 0)); gg.addColorStop(1, css(S.mood.glow, side === 'r' ? .12 : .06)); g.fillStyle = gg; g.fillRect(len - 160, 0, 160, WH);
}
/* wall thickness: cut top caps and open end faces (painted section), drawn after the walls */
function paintWallCaps(ctx, S) {
  const loc = S.loc, r = S.r, w = lw(loc), h = lh(loc), T = .2, Z = WALLH, E = EDGE;
  const brick = loc.wall === 'brick' || loc.wall === 'tiled', sec = mul(brick ? [120, 66, 50] : [104, 90, 80], S.mood.bake), topc = mul(brick ? [118, 84, 70] : [132, 118, 100], S.mood.bake);
  // end faces (cross sections)
  const endR = [gp(S, w, -T, Z), gp(S, w, 0, Z), gp(S, w, 0, -E), gp(S, w, -T, -E)], endL = [gp(S, -T, h, Z), gp(S, 0, h, Z), gp(S, 0, h, -E), gp(S, -T, h, -E)];
  for (const [pts, k] of [[endR, .62], [endL, .46]]) {
    paintPoly(ctx, pts, mul(sec, k), r, { n: 26, sw: 3, ang: 1.57, aj: .3, ink: true, inka: .8, alt: mul(sec, k * 1.4) });
    ctx.save(); pathPoly(ctx, pts); ctx.clip(); ctx.strokeStyle = css([0, 0, 0], .35); ctx.lineWidth = 1;
    for (let z = 0; z < Z; z += 10) { const a = pts === endR ? gp(S, w, -T, z) : gp(S, -T, h, z), b = pts === endR ? gp(S, w, 0, z) : gp(S, 0, h, z); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    ctx.restore();
  }
  // caps
  const capR = [gp(S, -T, -T, Z), gp(S, w, -T, Z), gp(S, w, 0, Z), gp(S, 0, 0, Z)], capL = [gp(S, -T, -T, Z), gp(S, 0, 0, Z), gp(S, 0, h, Z), gp(S, -T, h, Z)];
  for (const pts of [capR, capL]) paintPoly(ctx, pts, topc, r, { n: 40, sw: 2.4, ang: pts === capR ? .46 : -.46, aj: .1, ink: true, inka: .9, alt: mul(topc, 1.5), edge: false });
  ctx.strokeStyle = css([255, 228, 190], .32); ctx.lineWidth = 1.2; ctx.beginPath();
  let p = gp(S, 0, h, Z); ctx.moveTo(p[0], p[1]); p = gp(S, 0, 0, Z); ctx.lineTo(p[0], p[1]); p = gp(S, w, 0, Z); ctx.lineTo(p[0], p[1]); ctx.stroke();
}
/* the void around the room: dark painted backdrop, tinted by mood */
function paintBackdrop(ctx, S) {
  const r = S.r, W = S.W, H = S.H, bg = S.mood.bg || [14, 12, 14];
  ctx.fillStyle = css(bg); ctx.fillRect(0, 0, W, H);
  const c = gp(S, lw(S.loc) / 2, lh(S.loc) / 2, 40), gg = ctx.createRadialGradient(c[0], c[1], 40, c[0], c[1], Math.max(W, H) * .7);
  gg.addColorStop(0, css(mix(bg, S.mood.glow, .12), 1)); gg.addColorStop(1, css(bg, 0)); ctx.fillStyle = gg; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < W * H / 2500; i++) bristle(ctx, r() * W, r() * H, -.5 + r.g() * .3, r.r(30, 90), r.r(6, 16), r() < .5 ? mul(bg, 1.5) : mul(bg, .6), .25, r);
}
