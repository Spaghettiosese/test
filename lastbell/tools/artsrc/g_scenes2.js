
/* ===================================================================
 * ART2: five new ending tableaux + the day-name transition card
 * =================================================================== */
function s2(x) { return x * x * (3 - 2 * x); }
function blockWins(g, r, sc, x, base, w, h, o) {   // window grid for an apartment block; lit ones animate "waking"
  const ww = o.ww || 20, wh = o.wh || 28, gx = o.gx || 14, gy = o.gy || 18, nx = Math.max(1, Math.floor((w - 16) / (ww + gx))), ny = Math.max(1, Math.floor((h - 24) / (wh + gy)));
  const ox = x + (w - (nx * (ww + gx) - gx)) / 2;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const wx = ox + i * (ww + gx), wy = base - h + 16 + j * (wh + gy);
    const dark = o.dark || [22, 28, 38];
    paintRect(g, wx, wy, ww, wh, dark, r, { n: 4, sw: 3, ang: 1.57, ink: true, inkw: o.far ? 1 : 1.6, jv: .08, edge: false });
    if (!o.far) { g.strokeStyle = css([14, 12, 16], .8); g.lineWidth = 1.2; g.beginPath(); g.moveTo(wx + ww / 2, wy); g.lineTo(wx + ww / 2, wy + wh); g.moveTo(wx, wy + wh * .5); g.lineTo(wx + ww, wy + wh * .5); g.stroke(); }
    if (o.lit !== undefined && lat(i + (x | 0), j, o.seed || 3) < o.lit) sc.wins.push({ x: wx, y: wy, w: ww, h: wh, th: lat(i, j + (x | 0), 17), col: o.col || [255, 190, 100], far: !!o.far });
  }
}
function aptBlock(g, r, sc, x, base, w, h, col, o) {
  o = o || {};
  paintRect(g, x, base - h, w, h + 6, col, r, { n: Math.max(40, w * h / 200), sw: 8, ang: 1.57, aj: .15, ink: !o.far, inkw: 2.6, alt: mul(col, 1.35), jv: .1, lit: [mix(col, o.rim || [255, 170, 100], .4), mul(col, .5), 0, .3, .5], edge: !o.far });
  paintRect(g, x - 4, base - h - 8, w + 8, 10, mul(col, .7), r, { n: Math.max(6, w / 8), ang: 0, ink: !o.far, inkw: 1.6 });
  if (o.wins !== false) blockWins(g, r, sc, x, base, w, h - 8, Object.assign({ lit: .55 }, o));
  if (o.chimney !== false && !o.far) for (let k = 0; k < 2; k++) { const cx = x + w * (.25 + k * .45); if (lat(cx | 0, 3, 5) < .6) { paintRect(g, cx, base - h - 26, 12, 22, mul(col, .6), r, { n: 5, ink: true, ang: 1.57 }); if (lat(cx | 0, 4, 5) < .6) sc.smoke.push({ x: cx + 6, y: base - h - 26, ph: lat(cx | 0, 5, 5) * 6 }); } }
}
function drawWins(g, sc, t, p, a0) {   // lit windows turning on as the district wakes
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const w of sc.wins) {
    const k = s2(clamp((p - w.th) * 5, 0, 1)) * (a0 === undefined ? 1 : a0); if (k <= .01) continue;
    g.fillStyle = css(w.col, (w.far ? .55 : .85) * k); g.fillRect(w.x + 1, w.y + 1, w.w - 2, w.h - 2);
    if (!w.far) { g.globalAlpha = .3 * k; g.drawImage(glowSprite(w.col, 128), w.x - w.w * 1.4, w.y - w.h * .6, w.w * 3.8, w.h * 2.2); g.globalAlpha = 1; }
  }
  g.restore();
}
function smokeAnim(g, sc, t, col, a) {
  g.save(); g.globalCompositeOperation = 'source-over';
  for (const s of sc.smoke) for (let k = 0; k < 5; k++) { const ph = ((t * .00012 + k / 5 + s.ph) % 1), x = s.x + Math.sin(ph * 5 + s.ph) * 6 + ph * 26, y = s.y - ph * 90; g.globalAlpha = (1 - ph) * (a || .22) * Math.min(1, ph * 6); g.drawImage(glowSprite(col || [230, 210, 200], 128), x - 14 - ph * 20, y - 14 - ph * 20, 28 + ph * 40, 28 + ph * 40); }
  g.restore();
}
function sunDisc(g, x, y, R, col) { paintEll(g, x, y, R, R, col, RNG(5), { n: 40, sw: 8, ang: 0, aj: 3, ink: false, edge: false, alt: [255, 250, 220], jv: .05 }); }
function tinyCrowd(g, r, y0, n, x0, x1, sc0, pal, live) {
  for (let i = 0; i < n; i++) { const x = lerp(x0, x1, r()), y = y0 + r() * 16, s = sc0 * (.85 + (y - y0) / 40); const look = { skin: r.p(['#e9c9b1', '#d9a98a', '#c98f6e']), hair: r.p(['#2a1d18', '#a2723a', '#1a1414', '#5a4a3a']), hairStyle: r.p(['short', 'bob', 'cap', 'bun', 'curly']), outfit: r.p(['coat', 'cardigan', 'overalls', 'uniform']), outfitColor: r.p(pal || ['#6a3a30', '#5a5a4a', '#3f4d5c', '#6f5a63', '#566a77']), accent: '#c9892f', build: 'avg', glasses: false, age: 'adult', pose: 'stand', extra: 'none' };
    const e = { look, f: r.p(['n', 'ne', 'nw', 'e', 'w']), x, y, s }; if (live) live.push(e); else { groundShadow(g, x, y, 12 * s, .3); fig(g, look, e.f, 0, x, y, s); } }
}
function drawCrowd(g, list) { for (const e of list) { groundShadow(g, e.x, e.y, 12 * e.s, .3); fig(g, e.look, e.f, 0, e.x, e.y, e.s); } }

SCENES.end_wake = function (g, r) {
  const sc = { glows: [], wins: [], smoke: [], p0: .5 };
  skyFill(g, 0, 0, DW, DH, [[0, [22, 64, 96]], [.3, [92, 140, 156]], [.55, [236, 178, 130]], [.72, [255, 214, 140]], [1, [255, 190, 110]]], r, 760);
  glowAt(g, 820, 430, 640, [255, 214, 140], .75); sunDisc(g, 820, 430, 62, [255, 236, 180]); glowAt(g, 820, 430, 160, [255, 250, 220], .9);
  for (let i = 0; i < 7; i++) cloud(g, r.r(0, DW), r.r(50, 330), r.r(150, 320), r.r(20, 40), mix([240, 170, 150], [250, 210, 150], r() * .7), [255, 230, 170], r, 8);
  lightRays(g, 820, 430, 1100, 3.4, -Math.PI / 2, [255, 226, 160], .12, 22, r);
  // far hazy layer, mid layer (lit windows), near foreground roofs
  for (let i = 0; i < 18; i++) aptBlock(g, r, sc, i * 74 - 20 + r.r(-10, 10), 470, r.r(52, 80), r.r(60, 150), mix([146, 140, 170], [210, 170, 160], r() * .6), { far: true, wins: true, lit: .5, ww: 9, wh: 12, gx: 8, gy: 10, col: [255, 214, 140], dark: [100, 100, 130], rim: [255, 214, 150], chimney: false });
  const hz = g.createLinearGradient(0, 380, 0, 480); hz.addColorStop(0, 'rgba(255,214,150,0)'); hz.addColorStop(1, 'rgba(255,214,150,.4)'); g.fillStyle = hz; g.fillRect(0, 380, DW, 100);
  // the school, every window finally lit, bell tower catching the sun
  const info = paintSchool(g, r, { x: 30, y: 560, s: .88, wall: [130, 136, 128], roof: [70, 66, 70], lit: [255, 214, 140], litP: 1, glows: sc.glows, seed: 4, rim: [255, 200, 120], haze: [255, 200, 120], bell: [255, 214, 120] });
  sc.rings = info;
  aptBlock(g, r, sc, 820, 586, 150, 220, [96, 92, 110], { lit: .75, col: [255, 196, 110], rim: [255, 190, 110] });
  aptBlock(g, r, sc, 990, 590, 170, 280, [112, 98, 104], { lit: .7, col: [255, 190, 100], rim: [255, 190, 110], seed: 8 });
  aptBlock(g, r, sc, 1150, 590, 150, 200, [90, 94, 112], { lit: .7, col: [255, 204, 120], rim: [255, 190, 110], seed: 5 });
  aptBlock(g, r, sc, 690, 580, 110, 150, [124, 106, 100], { lit: .8, col: [255, 200, 120], rim: [255, 190, 110], seed: 11 });
  // the avenue: waking people, a tram, bunting-free but with every loudspeaker silent
  const road = g.createLinearGradient(0, 560, 0, DH); road.addColorStop(0, css([120, 112, 116])); road.addColorStop(1, css([54, 50, 60])); g.fillStyle = road; g.fillRect(0, 560, DW, 160);
  paintRect(g, 0, 560, DW, 160, [96, 90, 98], r, { n: 300, sw: 12, ang: .02, aj: .3, alt: [150, 124, 110], ink: false, edge: false, alpha: .8 });
  for (let i = 0; i < 40; i++) { const x = r() * DW, y = 575 + r() * 130; paintEll(g, x, y, r.r(6, 14), r.r(2, 5), jit([110, 104, 108], r, .2), r, { n: 3, pn: 8, ink: false, edge: false }); }
  glowAt(g, 820, 600, 420, [255, 214, 150], .3);
  sc.crowd = []; tinyCrowd(g, r, 606, 15, 120, 1180, 1.05, null, sc.crowd);
  pole(g, r, 620, 640, 250); pole(g, r, 1200, 700, 330);
  // rooftop foreground: parapet, laundry line, the player and an ally watching the sunrise
  paintPoly(g, [[0, 640], [520, 640], [610, 720], [0, 720]], [64, 52, 56], r, { n: 220, sw: 10, ang: 0, ink: true, inkw: 3, alt: [120, 80, 70], lit: [[255, 190, 120], [10, 8, 16], -1, .4, .6] });
  for (let x = 6; x < 520; x += 46) paintRect(g, x, 640 - (x % 3), 42, 14, jit([88, 66, 62], r, .12), r, { n: 8, ang: 0, ink: true, inkw: 1.6 });
  g.strokeStyle = css([30, 24, 24]); g.lineWidth = 2; g.beginPath(); g.moveTo(40, 560); g.quadraticCurveTo(260, 600, 500, 556); g.stroke();
  [[100, [176, 60, 50]], [190, [226, 214, 176]], [290, [74, 110, 120]], [400, [210, 160, 70]]].forEach(([x, c], i) => { const y = 566 + Math.sin(x * .02) * 14; paintPoly(g, [[x - 18, y], [x + 18, y + 4], [x + 15, y + 46], [x - 16, y + 44]], c, r, { n: 20, sw: 4, ang: 1.5, ink: true, inkw: 1.6, alt: mul(c, 1.3) }); });
  groundShadow(g, 190, 704, 50, .45); fig(g, Object.assign({}, GD_PLAYER(), { outfitColor: '#3f4d5c' }), 'ne', 0, 190, 704, 2.5);
  groundShadow(g, 270, 710, 34, .4); fig(g, { skin: '#e3c1a5', hair: '#6a3a22', hairStyle: 'bob', outfit: 'uniform', outfitColor: '#3f4d5c', accent: '#c9892f', build: 'slim', glasses: false, age: 'teen', pose: 'stand', extra: 'none' }, 'ne', 0, 270, 712, 2.3);
  glowAt(g, 230, 620, 280, [255, 200, 130], .2);
  sc.anim = function (g, t) {
    const p = clamp(sc.p0 + t * .00005, 0, 1); drawWins(g, sc, t, p); drawCrowd(g, sc.crowd);
    smokeAnim(g, sc, t, [255, 230, 210], .2);
    for (let k = 0; k < 3; k++) { const ph = ((t * .00016 + k / 3) % 1), rad = 30 + ph * 760; g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = css([255, 226, 150], (1 - ph) * .2); g.lineWidth = 3 + ph * 8; g.beginPath(); g.ellipse(info.tx, info.bellY, rad, rad * .6, 0, 0, 7); g.stroke(); g.restore(); }
    g.save(); g.globalCompositeOperation = 'lighter'; const sh = .5 + .5 * Math.sin(t * .0006); g.globalAlpha = .05 + .03 * sh; g.drawImage(glowSprite([255, 226, 160], 128), 820 - 520, 430 - 360, 1040, 720); g.restore();
    g.fillStyle = css([12, 10, 16], .9); for (let i = 0; i < 12; i++) { const bx = ((t * .035 * (.6 + (i % 3) * .2) + i * 150) % (DW + 200)) - 100, by = 130 + (i * 47) % 200 + Math.sin(t * .003 + i) * 12, f = Math.sin(t * .012 + i * 2) * 5; g.beginPath(); g.moveTo(bx - 8, by + f); g.quadraticCurveTo(bx - 3, by - 5, bx, by); g.quadraticCurveTo(bx + 3, by - 5, bx + 8, by + f); g.lineTo(bx + 3, by - 2); g.lineTo(bx - 3, by - 2); g.fill(); }
  };
  return sc;
};

SCENES.end_wardens_eye = function (g, r) {
  const sc = { glows: [], motes: true };
  g.fillStyle = css([40, 42, 46]); g.fillRect(0, 0, DW, DH);
  // grey back wall + wainscot
  paintRect(g, 0, 0, DW, 520, [118, 122, 124], r, { n: 520, sw: 14, ang: .05, aj: .3, alt: [150, 154, 150], jv: .06, ink: false, edge: false, lit: [[170, 176, 176], [60, 62, 70], -.5, .3, .5] });
  paintRect(g, 0, 380, DW, 140, [78, 90, 88], r, { n: 220, sw: 10, ang: 0, aj: .2, alt: [60, 74, 70], ink: false, edge: false });
  g.fillStyle = css([30, 34, 34], .9); g.fillRect(0, 376, DW, 6); g.fillStyle = css([190, 196, 186], .3); g.fillRect(0, 374, DW, 2);
  // the window onto the school
  const wx = 250, wy = 60, ww = 780, wh = 360;
  paintRect(g, wx - 22, wy - 22, ww + 44, wh + 44, [64, 66, 68], r, { n: 160, sw: 8, ang: 1.57, ink: true, inkw: 4, lit: [[130, 136, 138], [14, 16, 20], 0, .3, .5] });
  g.save(); g.beginPath(); g.rect(wx, wy, ww, wh); g.clip();
  skyFill(g, wx, wy, ww, wh, [[0, [128, 140, 146]], [.5, [170, 178, 176]], [1, [196, 190, 170]]], r, 160);
  for (let i = 0; i < 4; i++) cloud(g, r.r(wx, wx + ww), r.r(wy + 10, wy + 130), r.r(120, 220), 20, [160, 168, 170], [220, 220, 200], r, 6);
  for (let i = 0; i < 9; i++) paintRect(g, wx + i * 100 - 20, wy + wh - 130 - (i * 31) % 70, 90, 220, mix([96, 104, 110], [130, 130, 136], r() * .4), r, { n: 20, ink: false, edge: false, ang: 1.57, alpha: .8 });
  const info = paintSchool(g, r, { x: wx + 30, y: wy + wh + 40, s: .62, wall: [110, 118, 116], roof: [58, 62, 66], lit: [220, 210, 150], litP: .18, rim: [220, 210, 180], haze: [200, 200, 190], bell: [160, 150, 120] });
  cobbles(g, r, wy + wh - 20, 60, [110, 112, 112], [[150, 160, 160], [190, 190, 180]]);
  tinyCrowd(g, r, wy + wh - 14, 24, wx + 40, wx + 740, .5, ['#3f4d5c', '#3f4d5c', '#566a77']);
  g.restore();
  // venetian blind half drawn at the top + panes
  for (let y = wy; y < wy + 110; y += 9) { paintRect(g, wx, y, ww, 7, [168, 170, 160], r, { n: 6, ang: 0, ink: true, inkw: 1, ew: .6, ha: .9 }); }
  g.strokeStyle = css([40, 42, 44]); g.lineWidth = 5; g.beginPath(); for (let i = 1; i < 4; i++) { g.moveTo(wx + i * ww / 4, wy); g.lineTo(wx + i * ww / 4, wy + wh); } g.moveTo(wx, wy + wh / 2 + 40); g.lineTo(wx + ww, wy + wh / 2 + 40); g.stroke();
  paintRect(g, wx - 32, wy + wh, ww + 64, 16, [90, 92, 90], r, { n: 20, ang: 0, ink: true, inkw: 2.4 });
  // floor
  paintPoly(g, [[0, 520], [DW, 520], [DW, DH], [0, DH]], [58, 60, 58], r, { n: 420, sw: 16, ang: 0, aj: .3, alt: [90, 90, 84], ink: false, edge: false, lit: [[110, 112, 104], [20, 20, 24], -1.2, .3, .6] });
  for (let i = 0; i < 12; i++) { g.strokeStyle = css([24, 24, 26], .5); g.lineWidth = 2; g.beginPath(); g.moveTo(i * 130 - 40, 520); g.lineTo(i * 220 - 400, DH); g.stroke(); }
  // inspector's desk, green lamp, files, nameplate; filing cabinets; portrait of the Warden
  paintRect(g, 1010, 80, 190, 150, [60, 46, 38], r, { n: 70, ink: true, inkw: 3, ang: 0 }); wardenFace(g, 1024, 94, 162, 122, r, 0); g.strokeStyle = css([226, 196, 100], .8); g.lineWidth = 3; g.strokeRect(1024, 94, 162, 122);
  for (let k = 0; k < 3; k++) { const x = 1040 + k * 70; paintRect(g, x, 330, 62, 190, [96, 104, 98], r, { n: 50, ink: true, inkw: 2.4, ang: 1.57, alt: [140, 150, 140], lit: [[180, 190, 180], [12, 14, 20], 0, .3, .5] }); for (let j = 0; j < 4; j++) { paintRect(g, x + 6, 340 + j * 44, 50, 38, [88, 96, 90], r, { n: 6, ink: true, inkw: 1.2, ang: 0, ew: .6 }); g.fillStyle = css([214, 196, 120]); g.fillRect(x + 22, 358 + j * 44, 18, 4); } }
  paintPoly(g, [[160, 540], [820, 540], [900, 600], [80, 600]], [92, 70, 52], r, { n: 220, ang: 0, ink: true, inkw: 3, alt: [140, 104, 70], lit: [[200, 150, 100], [20, 12, 12], -1.2, .3, .6] });
  paintRect(g, 80, 600, 820, 30, [60, 44, 34], r, { n: 50, ang: 0, ink: true, inkw: 3 });
  for (const x of [120, 840]) paintRect(g, x, 630, 26, 90, [54, 40, 32], r, { n: 10, ang: 1.57, ink: true });
  paintPoly(g, [[600, 560], [700, 548], [760, 560], [660, 574]], [226, 220, 196], r, { n: 10, ink: true, ang: 0 }); paintPoly(g, [[420, 558], [520, 566], [560, 580], [450, 574]], [210, 204, 176], r, { n: 10, ink: true, ang: 0 });
  scribbleLines(g, r, 620, 556, 70, 3, 5, [40, 40, 50], .6);
  paintRect(g, 250, 566, 130, 24, [46, 40, 32], r, { n: 10, ink: true, ang: 0 }); paintRect(g, 256, 570, 118, 16, [200, 170, 80], r, { n: 6, ink: false, ang: 0 }); handText(g, 'INSPECTOR', 315, 578, 10, [40, 28, 14], r, 108, { shadow: [0, 0, 0, 0] });
  // lamp
  paintRect(g, 760, 520, 6, 40, [40, 60, 50], r, { n: 5, ink: true, ang: 1.57 }); paintPoly(g, [[730, 520], [800, 518], [786, 496], [746, 496]], [40, 120, 84], r, { n: 20, ink: true, ang: 0, lit: [[120, 220, 160], [10, 40, 30], -1.57, .5, .5] }); sc.glows.push({ x: 765, y: 540, r: 300, col: [160, 255, 190], a: .22, fl: .02, ph: 1 }); sc.glows.push({ x: 765, y: 580, r: 150, col: [255, 240, 170], a: .3, fl: .03, ph: 2 });
  // the inspector: you, seen from behind in the long coat, hands behind the back
  const coat = Object.assign({}, GD_PLAYER(), { outfit: 'coat', outfitColor: '#2a2e34', hairStyle: 'slick', hair: '#8a8a8c', accent: '#c9a54a', extra: 'clipboard', age: 'adult' });
  groundShadow(g, 520, 700, 80, .5); fig(g, coat, 'n', 0, 520, 710, 3.8);
  // the reflection in the glass: the same coat, faint, facing us, eyes a little too steady
  g.save(); g.beginPath(); g.rect(wx, wy, ww, wh); g.clip(); g.globalAlpha = .6; g.globalCompositeOperation = 'screen';
  fig(g, coat, 'sw', 0, 840, wy + wh + 60, 3.0); g.restore();
  g.save(); g.beginPath(); g.rect(wx, wy, ww, wh); g.clip(); const gl = g.createLinearGradient(wx, wy, wx + ww, wy + wh); gl.addColorStop(0, 'rgba(255,255,255,.12)'); gl.addColorStop(.35, 'rgba(255,255,255,0)'); gl.addColorStop(.6, 'rgba(255,255,255,.06)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gl; g.fillRect(wx, wy, ww, wh); g.restore();
  // blinds' slatted light on the floor + desk
  g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 9; i++) { const x0 = 160 + i * 84; g.fillStyle = 'rgba(200,210,205,.06)'; g.beginPath(); g.moveTo(x0, 440); g.lineTo(x0 + 44, 440); g.lineTo(x0 - 120 + 44, DH); g.lineTo(x0 - 120, DH); g.fill(); } g.restore();
  sc.window = { x: wx, y: wy, w: ww, h: wh };
  sc.anim = function (g, t) {
    g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 50; i++) { const k = (i * .131 + t * .000028 * (1 + i % 3)) % 1, x = 180 + k * 560 + Math.sin(t * .0007 + i) * 14 + (i * 43) % 300, y = 430 + k * 270 + Math.sin(t * .001 + i * 3) * 6; g.globalAlpha = .38 * (1 - Math.abs(k - .45) * 1.7); g.fillStyle = css([226, 234, 226]); g.beginPath(); g.arc(x, y, 1 + (i % 3) * .5, 0, 7); g.fill(); } g.restore();
    // a tiny figure in the yard raises its head (the school watching back)
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .06 + .03 * Math.sin(t * .0005); g.drawImage(glowSprite([200, 255, 220], 128), 640, 420, 260, 220); g.restore();
  };
  return sc;
};

SCENES.end_martyr = function (g, r) {
  const sc = { glows: [], motes: true };
  g.fillStyle = css([8, 6, 12]); g.fillRect(0, 0, DW, DH);
  // tribunal hall: back wall with the Warden's banner, drapes, high bench with three chairs
  paintRect(g, 140, 0, 1000, 420, [38, 26, 30], r, { n: 360, sw: 14, ang: 1.57, aj: .2, ink: false, alt: [70, 36, 38], lit: [[96, 70, 60], [6, 4, 10], -1.57, .3, .7], edge: false });
  for (const sd of [0, 1]) paintPoly(g, [[sd ? 1140 : 140, 0], [sd ? 1020 : 260, 0], [sd ? 1050 : 230, 430], [sd ? 1140 : 140, 430]], [86, 20, 30], r, { n: 140, sw: 10, ang: 1.57, ink: true, inkw: 3, alt: [150, 50, 50], lit: [[220, 110, 100], [10, 4, 10], 0, .3, .6] });
  paintRect(g, 560, 26, 160, 280, [120, 24, 30], r, { n: 120, sw: 8, ang: 1.57, ink: true, inkw: 3, alt: [200, 60, 50], lit: [[240, 140, 100], [20, 6, 10], -1.57, .3, .6] });
  // the eye of the Warden on the banner
  g.fillStyle = css([236, 210, 130]); g.beginPath(); g.moveTo(580, 140); g.quadraticCurveTo(640, 90, 700, 140); g.quadraticCurveTo(640, 190, 580, 140); g.fill(); g.strokeStyle = css(INK, .9); g.lineWidth = 3; g.stroke();
  g.fillStyle = css([40, 20, 20]); g.beginPath(); g.arc(640, 140, 20, 0, 7); g.fill(); g.fillStyle = css([226, 60, 50]); g.beginPath(); g.arc(640, 140, 8, 0, 7); g.fill(); sc.glows.push({ x: 640, y: 140, r: 90, col: [255, 70, 50], a: .4, fl: .1, ph: 2 });
  handText(g, 'ORDER IS HARMONY', 640, 250, 16, [236, 210, 130], r, 130, { shadow: [0, 0, 0, 0] });
  // dais + bench
  paintPoly(g, [[160, 420], [1120, 420], [1160, 470], [120, 470]], [76, 52, 40], r, { n: 220, ang: 0, ink: true, inkw: 3, alt: [120, 80, 56] });
  paintRect(g, 120, 470, 1040, 20, [52, 36, 28], r, { n: 40, ang: 0, ink: true, inkw: 3 });
  paintRect(g, 250, 372, 780, 70, [64, 42, 32], r, { n: 120, sw: 6, ang: 0, ink: true, inkw: 3.4, alt: [110, 70, 46], lit: [[190, 140, 90], [14, 8, 8], -1.57, .5, .5] });
  paintRect(g, 250, 366, 780, 10, [100, 68, 48], r, { n: 30, ang: 0, ink: true, inkw: 2.4 });
  const judge = (cx, k) => {   // high-backed chair; hooded figure silhouette with a glint
    paintPoly(g, [[cx - 54, 450], [cx - 50, 250], [cx - 30, 220], [cx + 30, 220], [cx + 50, 250], [cx + 54, 450]], [40, 24, 28], r, { n: 80, sw: 5, ang: 1.57, ink: true, inkw: 3, alt: [90, 44, 44], lit: [[150, 70, 60], [6, 4, 8], 0, .3, .6] });
    if (k !== 1) { paintPoly(g, [[cx - 30, 372], [cx - 22, 306], [cx - 12, 282], [cx + 12, 282], [cx + 22, 306], [cx + 30, 372]], [14, 10, 16], r, { n: 30, ink: true, inkw: 2, ang: 1.57 }); paintEll(g, cx, 280, 15, 18, [20, 14, 20], r, { n: 10, ink: true, inkw: 2 }); g.fillStyle = css([255, 230, 180], .8); g.fillRect(cx - 8, 281, 5, 2); g.fillRect(cx + 3, 281, 5, 2); }
  };
  judge(420, 0); judge(640, 1); judge(860, 2);     // the middle chair is empty
  paintRect(g, 600, 366, 80, 14, [220, 190, 100], r, { n: 6, ink: true, ang: 0 }); handText(g, 'PRESIDING', 640, 373, 8, [40, 26, 12], r, 70, { shadow: [0, 0, 0, 0] });
  // gallery: rows of faceless silhouettes in the dark
  for (let row = 0; row < 3; row++) for (let i = 0; i < 20; i++) { const x = 40 + i * 64 + (row & 1) * 30 + r.r(-6, 6), y = 640 + row * 34, s = 22 + row * 5; if (lat(i, row, 7) < .12) continue; paintEll(g, x, y, s, s * 1.15, jit([16, 10, 18], r, .3), r, { n: 8, sw: 5, ang: 1, ink: false, edge: false }); paintEll(g, x, y + s * 1.3, s * 1.5, s, [12, 8, 14], r, { n: 6, ink: false, edge: false }); }
  // the spotlight cone onto the middle floor
  g.save(); g.globalCompositeOperation = 'lighter'; const cone = g.createLinearGradient(640, 0, 640, 620); cone.addColorStop(0, 'rgba(255,244,214,0)'); cone.addColorStop(.35, 'rgba(255,244,214,.2)'); cone.addColorStop(1, 'rgba(255,244,214,.42)'); g.fillStyle = cone; g.beginPath(); g.moveTo(610, 0); g.lineTo(670, 0); g.lineTo(870, 620); g.lineTo(410, 620); g.closePath(); g.fill(); g.restore();
  g.save(); g.fillStyle = css([112, 96, 76]); g.beginPath(); g.ellipse(640, 612, 240, 54, 0, 0, 7); g.fill(); g.restore();
  paintEll(g, 640, 612, 240, 54, [150, 132, 100], r, { n: 120, sw: 8, ang: 0, aj: 1.2, ink: false, edge: false, alt: [226, 210, 160], alpha: .9 });
  glowAt(g, 640, 608, 360, [255, 240, 200], .5);
  // the empty chair, lit; the single standing figure, back to us, head up
  paintPoly(g, [[760, 604], [800, 596], [822, 610], [782, 620]], [96, 64, 44], r, { n: 10, ink: true, ang: 0 });
  for (const [x, y] of [[766, 608], [796, 600], [816, 612], [786, 622]]) paintRect(g, x - 3, y, 6, 36, [76, 50, 36], r, { n: 4, ink: true, ang: 1.57 });
  paintRect(g, 765, 548, 6, 60, [76, 50, 36], r, { n: 6, ink: true, ang: 1.57 }); paintRect(g, 765, 548, 56, 6, [96, 64, 44], r, { n: 6, ink: true, ang: 0 }); paintRect(g, 815, 548, 6, 62, [76, 50, 36], r, { n: 6, ink: true, ang: 1.57 });
  groundShadow(g, 640, 700, 100, .55); fig(g, Object.assign({}, GD_PLAYER(), { outfitColor: '#3f4d5c', extra: 'armband' }), 'n', 0, 600, 706, 4.0);
  sc.anim = function (g, t) {
    g.save(); g.globalCompositeOperation = 'lighter';
    const fl = 1 + .04 * Math.sin(t * .011) + (lat(Math.floor(t / 90), 3, 77) < .04 ? -.12 : 0);
    g.globalAlpha = .16 * fl; g.drawImage(glowSprite([255, 244, 214], 128), 640 - 330, 560 - 300, 660, 520);
    for (let i = 0; i < 70; i++) { const k = (i * .0713 + t * .000025 * (1 + i % 3)) % 1, x = 640 + Math.sin(i * 12.9 + t * .0003) * (30 + k * 190), y = k * 610; g.globalAlpha = .55 * (.35 + .65 * Math.abs(Math.sin(t * .001 + i))) * Math.min(1, k * 4); g.fillStyle = css([255, 246, 226]); g.beginPath(); g.arc(x, y, 1 + (i % 3) * .5, 0, 7); g.fill(); }
    g.restore();
  };
  return sc;
};

SCENES.end_silenced = function (g, r) {
  const sc = { glows: [], wins: [], smoke: [], candles: [] };
  skyFill(g, 0, 0, DW, DH, [[0, [6, 10, 26]], [.5, [20, 30, 58]], [.8, [46, 54, 86]], [1, [60, 60, 90]]], r, 600);
  for (let i = 0; i < 90; i++) { g.fillStyle = css([220, 230, 255], r.r(.15, .7)); g.fillRect(r.r(0, DW), r.r(0, 300), r.p([1, 1, 2]), 2); }
  for (let i = 0; i < 5; i++) cloud(g, r.r(0, DW), r.r(60, 300), r.r(200, 340), 34, [34, 40, 66], [90, 120, 190], r, 7);
  glowAt(g, 220, 180, 260, [150, 180, 255], .15);
  g.fillStyle = css([12, 14, 26]); g.fillRect(0, 500, DW, 160);
  // blacked-out district: dark layered blocks, only candle windows
  const cand = (x, y) => sc.candles.push({ x, y, ph: r() * 6 });
  for (let i = 0; i < 16; i++) aptBlock(g, r, sc, i * 86 - 30, 520, r.r(66, 96), r.r(80, 190), mix([22, 26, 44], [34, 38, 60], r() * .5), { far: true, wins: true, lit: 0, ww: 10, wh: 14, gx: 9, gy: 11, dark: [10, 12, 22], rim: [90, 120, 200], chimney: false });
  const block = (x, w, h, col) => { aptBlock(g, r, sc, x, 640, w, h, col, { lit: 0, rim: [90, 120, 200], dark: [10, 12, 20], ww: 22, wh: 30, gx: 16, gy: 20 }); for (let j = 0; j < h / 50; j++) for (let i = 0; i < w / 38; i++) if (lat(i + x, j, 21) < .34) cand(x + 18 + i * 38 + 11, 640 - h + 16 + j * 50 + 17); };
  block(-20, 240, 380, [24, 28, 46]); block(240, 190, 270, [30, 32, 52]); block(850, 200, 330, [26, 30, 48]); block(1050, 260, 440, [22, 26, 44]);
  // the school: dark, tower unlit
  const info = paintSchool(g, r, { x: 310, y: 640, s: .62, wall: [40, 48, 62], roof: [20, 24, 34], lit: [255, 190, 100], litP: 0, glows: sc.glows, seed: 4, rim: [90, 130, 210], haze: [60, 90, 160], bell: [90, 90, 100] });
  // the relay aerial: lattice mast on the right hill; drawn live (toppling)
  sc.mast = { x: 930, y: 640, h: 420 };
  // street: dead lamps, cold cobbles, a dangling cut loudspeaker
  cobbles(g, r, 620, DH - 620, [58, 60, 74], [[20, 30, 60], [90, 110, 190]]);
  pole(g, r, 160, 700, 360); pole(g, r, 560, 660, 250);
  g.strokeStyle = css([8, 8, 12], .9); g.lineWidth = 2; g.beginPath(); g.moveTo(190, 346); g.quadraticCurveTo(212, 420, 200, 470); g.stroke(); paintPoly(g, [[188, 470], [212, 470], [226, 492], [174, 492]], [60, 60, 56], r, { n: 10, ink: true, ang: 0 });
  // foreground: the player on a rooftop edge holding a candle, neighbours' candles
  paintPoly(g, [[0, 664], [440, 664], [520, 720], [0, 720]], [22, 20, 30], r, { n: 160, sw: 10, ang: 0, ink: true, inkw: 3, alt: [60, 50, 70], lit: [[90, 110, 170], [4, 4, 8], -1, .4, .6] });
  groundShadow(g, 250, 712, 60, .5); fig(g, Object.assign({}, GD_PLAYER(), { outfitColor: '#3f4d5c' }), 'ne', 0, 250, 714, 3.4);
  paintRect(g, 296, 640, 8, 20, [236, 226, 200], r, { n: 4, ink: true, ang: 1.57 }); sc.glows.push({ x: 300, y: 636, r: 230, col: [255, 170, 80], a: .75, fl: .25, ph: 1 }); sc.glows.push({ x: 300, y: 660, r: 90, col: [255, 200, 120], a: .35, fl: .18, ph: 3 });
  for (const [x, y] of [[90, 690], [160, 700], [420, 696]]) { paintRect(g, x, y - 12, 6, 14, [226, 216, 190], r, { n: 3, ink: true, ang: 1.57 }); sc.glows.push({ x: x + 3, y: y - 14, r: 70, col: [255, 170, 80], a: .5, fl: .3, ph: x }); }
  sc.anim = function (g, t) {
    // candle windows
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const c of sc.candles) { const fl = .65 + .35 * Math.sin(t * .012 + c.ph) * Math.sin(t * .0071 + c.ph * 2); g.globalAlpha = .75 * fl; g.drawImage(glowSprite([255, 170, 70], 128), c.x - 20, c.y - 20, 40, 40); g.globalAlpha = .9 * fl; g.fillStyle = css([255, 214, 140]); g.fillRect(c.x - 2, c.y - 3, 4, 6); }
    g.restore();
    // the aerial toppling: a lattice mast leaning further and further, sparks at the hinge, dying red lamps
    const m = sc.mast, k = clamp((t - 1500) * .00003, 0, 1), ang = s2(k) * 1.0 + Math.sin(t * .004) * .003 * (1 - k);
    g.save(); g.translate(m.x, m.y); g.rotate(ang);
    g.strokeStyle = css([8, 8, 14]); g.lineWidth = 5; g.beginPath(); g.moveTo(-18, 0); g.lineTo(-6, -m.h); g.moveTo(18, 0); g.lineTo(6, -m.h); g.stroke();
    g.lineWidth = 2; g.beginPath(); for (let y = 0; y > -m.h; y -= 34) { const f = 1 - -y / m.h, wL = -18 + 12 * (1 - f), wR = 18 - 12 * (1 - f); const f2 = 1 - -(y - 34) / m.h, w2L = -18 + 12 * (1 - f2), w2R = 18 - 12 * (1 - f2); g.moveTo(wL, y); g.lineTo(w2R, y - 34); g.moveTo(wR, y); g.lineTo(w2L, y - 34); g.moveTo(wL, y); g.lineTo(wR, y); } g.stroke();
    g.strokeStyle = css([90, 120, 200], .5); g.lineWidth = 1.4; g.beginPath(); g.moveTo(-18, 0); g.lineTo(-6, -m.h); g.stroke();
    const blink = lat(Math.floor(t / 300), 4, 33) > (.3 + k * .6); g.fillStyle = css([255, 50, 40], blink ? .95 : .1); g.beginPath(); g.arc(0, -m.h, 4, 0, 7); g.fill(); if (blink) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = .6; g.drawImage(glowSprite([255, 60, 40], 128), -30, -m.h - 30, 60, 60); }
    g.restore();
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 10; i++) { const ph = ((t * .0006 + i * .37) % 1), sx = m.x + (lat(i, 1, 9) - .5) * 30 + ph * 40 * (i % 2 ? 1 : -1), sy = m.y - ph * 40 + ph * ph * 60; g.globalAlpha = (1 - ph) * (.3 + k * .6) * (lat(Math.floor(t / 120), i, 5) < .6 ? 1 : 0); g.fillStyle = css([255, 200, 100]); g.beginPath(); g.arc(sx, sy, 1.6, 0, 7); g.fill(); }
    g.restore();
    g.save(); g.globalCompositeOperation = 'lighter'; const fz = clamp(1 - Math.abs(((t % 9000) - 3000) / 220), 0, 1); if (fz > 0) { g.globalAlpha = fz * .2; g.fillStyle = css([160, 190, 255]); g.fillRect(0, 0, DW, DH * .7); } g.restore();
  };
  return sc;
};

SCENES.end_exodus = function (g, r) {
  const sc = { glows: [], tram: true };
  skyFill(g, 0, 0, DW, DH, [[0, [8, 14, 40]], [.45, [28, 46, 90]], [.75, [96, 80, 120]], [1, [226, 130, 96]]], r, 700);
  for (let i = 0; i < 140; i++) { g.fillStyle = css([230, 236, 255], r.r(.2, .85)); g.fillRect(r.r(0, DW), r.r(0, 330), r.p([1, 1, 2]), 2); }
  glowAt(g, 1010, 150, 300, [210, 224, 255], .35); g.fillStyle = css([236, 240, 250]); g.beginPath(); g.arc(1010, 150, 46, 0, 7); g.fill(); g.fillStyle = css([196, 206, 226], .5); for (const [mx, my, mr] of [[996, 140, 9], [1024, 162, 7], [1008, 120, 5], [1030, 134, 4]]) { g.beginPath(); g.arc(mx, my, mr, 0, 7); g.fill(); } g.strokeStyle = css([20, 24, 50], .5); g.lineWidth = 1.6; g.beginPath(); g.arc(1010, 150, 46, 0, 7); g.stroke(); glowAt(g, 1010, 150, 70, [255, 255, 255], .6);
  for (let i = 0; i < 4; i++) cloud(g, r.r(0, DW), r.r(60, 320), r.r(160, 300), 26, [60, 70, 110], [240, 170, 130], r, 6);
  // the city behind, receding left, with the school's dark tower far off
  for (let i = 0; i < 13; i++) { const x = i * 64 - 10, h = r.r(40, 150); paintRect(g, x, 470 - h, r.r(50, 80), h + 10, mix([46, 44, 74], [90, 70, 100], r() * .5), r, { n: 30, ink: false, edge: false, ang: 1.57, alpha: .95 }); for (let k = 0; k < 6; k++) if (r() < .4) { g.fillStyle = css([255, 190, 100], .8); g.fillRect(x + r.r(6, 40), 470 - h + r.r(8, h - 10), 3, 4); } }
  paintRect(g, 150, 250, 30, 230, [38, 36, 62], r, { n: 20, ink: false, edge: false, ang: 1.57 }); paintPoly(g, [[142, 250], [188, 250], [165, 190]], [30, 30, 50], r, { n: 10, ink: false, edge: false });
  const haze = g.createLinearGradient(0, 380, 0, 520); haze.addColorStop(0, 'rgba(230,130,100,0)'); haze.addColorStop(1, 'rgba(230,140,110,.5)'); g.fillStyle = haze; g.fillRect(0, 380, DW, 140);
  // river with moon path
  const rv = g.createLinearGradient(0, 480, 0, DH); rv.addColorStop(0, css([60, 70, 110])); rv.addColorStop(1, css([8, 12, 28])); g.fillStyle = rv; g.fillRect(0, 480, DW, 240);
  for (let i = 0; i < 260; i++) { const y = 486 + Math.pow(r(), 1.3) * 230, k = (y - 486) / 230, x = r() * DW; bristle(g, x, y, 0, r.r(30, 120) * (.4 + k), r.r(2, 6), jit(mix([70, 84, 130], [10, 16, 40], k), r, .2), r.r(.15, .4), r); }
  sc.moonX = 1010;
  // far bank + bridge: steel truss with arched top chord, crossing the frame
  const by = 540, bt = 440;   // deck y and truss top
  paintRect(g, 0, by, DW, 18, [26, 28, 40], r, { n: 120, sw: 6, ang: 0, ink: true, inkw: 3, alt: [60, 66, 90] });
  paintRect(g, 0, by + 18, DW, 8, [14, 14, 22], r, { n: 40, ang: 0, ink: true });
  for (const px of [90, 460, 830, 1200]) { paintRect(g, px - 20, by + 26, 40, 190, [30, 30, 44], r, { n: 40, ang: 1.57, ink: true, inkw: 3, alt: [70, 70, 100], lit: [[100, 100, 150], [6, 6, 12], 0, .3, .6] }); const ref = g.createLinearGradient(0, by + 216, 0, DH); ref.addColorStop(0, 'rgba(120,130,200,.25)'); ref.addColorStop(1, 'rgba(120,130,200,0)'); g.fillStyle = ref; g.fillRect(px - 20, by + 216, 40, DH - by - 216); }
  for (let i = 0; i < 9; i++) { const x0 = i * 160 - 40, x1 = x0 + 160, x2 = (x0 + x1) / 2; const h1 = bt + 40 * Math.pow((i - 4) / 4.6, 2); g.strokeStyle = css([20, 22, 34]); g.lineWidth = 6; g.beginPath(); g.moveTo(x0, by); g.lineTo(x2, h1); g.lineTo(x1, by); g.stroke(); g.strokeStyle = css([90, 100, 150], .5); g.lineWidth = 1.6; g.beginPath(); g.moveTo(x0 + 2, by - 2); g.lineTo(x2 + 2, h1 + 2); g.stroke(); }
  g.strokeStyle = css([20, 22, 34]); g.lineWidth = 7; g.beginPath(); for (let i = 0; i <= 9; i++) { const x = i * 160 - 40, h = bt + 40 * Math.pow((i - 4.5) / 4.6, 2); i ? g.lineTo(x, h) : g.moveTo(x, h); } g.stroke();
  // overhead wire
  g.strokeStyle = css([8, 8, 12], .9); g.lineWidth = 1.6; g.beginPath(); g.moveTo(0, 372); g.lineTo(DW, 372); g.stroke();
  for (const x of [200, 700, 1160]) { g.beginPath(); g.moveTo(x, 372); g.lineTo(x, 470); g.stroke(); }
  // lamps along the bridge
  for (let i = 0; i < 8; i++) { const x = 70 + i * 170; g.strokeStyle = css([10, 10, 14]); g.lineWidth = 3; g.beginPath(); g.moveTo(x, by); g.lineTo(x, by - 56); g.stroke(); g.fillStyle = css([255, 214, 140]); g.beginPath(); g.arc(x, by - 60, 4, 0, 7); g.fill(); sc.glows.push({ x, y: by - 60, r: 70, col: [255, 190, 100], a: .5, fl: .04, ph: i }); }
  sc.deck = by;
  sc.anim = function (g, t) {
    // reflections of the lamps and the tram on the river (wobbling)
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 8; i++) { const x = 70 + i * 170; for (let k = 0; k < 5; k++) { g.globalAlpha = .1 * (1 - k / 5); g.fillStyle = css([255, 190, 100]); g.fillRect(x - 8 + Math.sin(t * .002 + i + k) * 6, 590 + k * 22, 16, 4); } }
    for (let k = 0; k < 12; k++) { g.globalAlpha = .14 * (1 - k / 12); g.fillStyle = css([226, 234, 255]); g.fillRect(sc.moonX - 40 + Math.sin(t * .0016 + k * 1.3) * 18, 500 + k * 16, 80 - k * 4, 3); }
    g.restore();
    // the tram: lit windows, passengers, headlight, pantograph sparks; crosses the bridge left to right
    const L = 520, T = (t * .00008) % 1.5, x = lerp(-L - 40, DW + 60, clamp(T / 1.3, 0, 1)), y0 = sc.deck - 14;
    g.save(); g.translate(x, y0);
    g.fillStyle = css([6, 6, 10], .4); g.beginPath(); g.ellipse(L / 2, 18, L / 2 + 10, 9, 0, 0, 7); g.fill();
    const body = [[0, 0], [L, 0], [L - 6, -112], [L - 26, -122], [28, -122], [6, -112]];
    paintPoly(g, body, [150, 56, 48], r || RNG(3), { n: 160, sw: 6, ang: 0, ink: true, inkw: 3, alt: [226, 120, 90], lit: [[255, 170, 120], [40, 14, 20], -1.57, .3, .5] });
    paintRect(g, 0, -34, L, 10, [226, 206, 150], r || RNG(3), { n: 30, ang: 0, ink: true, inkw: 2 });
    g.fillStyle = css([40, 30, 40]); g.fillRect(8, -8, L - 16, 10);
    const nw = 8, ww = (L - 70) / nw;
    for (let i = 0; i < nw; i++) {
      const wx = 30 + i * ww; g.fillStyle = css([255, 214, 140]); g.fillRect(wx, -100, ww - 12, 54); g.strokeStyle = css(INK, .9); g.lineWidth = 2.4; g.strokeRect(wx, -100, ww - 12, 54);
      const hx = wx + (ww - 12) / 2, pk = lat(i, 2, 61);   // passenger silhouettes, heads and shoulders
      const pg = g.createLinearGradient(0, -100, 0, -46); pg.addColorStop(0, 'rgba(255,236,180,.0)'); pg.addColorStop(1, 'rgba(255,170,90,.55)'); g.fillStyle = pg; g.fillRect(wx, -100, ww - 12, 54);
      if (pk < .85) { g.fillStyle = css([36, 22, 30], .95); const two = pk < .45; for (const dx of (two ? [-10, 9] : [0])) { g.beginPath(); g.ellipse(hx + dx, -46, 11, 17, 0, Math.PI, 0); g.fill(); g.beginPath(); g.arc(hx + dx, -68, 6.4, 0, 7); g.fill(); } }
      if (i === 5) { g.fillStyle = css([36, 30, 40]); g.beginPath(); g.ellipse(hx, -46, 14, 19, 0, Math.PI, 0); g.fill(); g.fillStyle = css([226, 170, 130]); g.beginPath(); g.arc(hx + 2, -69, 7, 0, 7); g.fill(); g.fillStyle = css([42, 28, 22]); g.beginPath(); g.arc(hx + 1, -73, 7, Math.PI, 0); g.fill(); g.strokeStyle = css([226, 170, 130], .9); g.lineWidth = 2.4; g.beginPath(); g.moveTo(hx + 8, -50); g.lineTo(hx + 14, -62); g.stroke(); }
    }
    g.fillStyle = css([226, 226, 214]); g.beginPath(); g.moveTo(L - 4, -112); g.lineTo(L + 12, -100); g.lineTo(L + 12, -56); g.lineTo(L - 4, -48); g.fill(); g.strokeStyle = css(INK, .9); g.lineWidth = 2; g.stroke();
    handText(g, '9', 40, -135, 18, [236, 226, 190], r || RNG(3), 20, { shadow: [0, 0, 0, 0] });
    g.strokeStyle = css([10, 10, 14]); g.lineWidth = 3; g.beginPath(); g.moveTo(L * .5 - 24, -122); g.lineTo(L * .5 + 2, -142); g.lineTo(L * .5 - 18, 372 - y0); g.stroke(); g.lineWidth = 4; g.beginPath(); g.moveTo(L * .5 - 28, 372 - y0); g.lineTo(L * .5 - 8, 372 - y0); g.stroke();
    for (const wh of [70, L - 90, L - 150, 120]) { g.fillStyle = css([12, 12, 16]); g.beginPath(); g.arc(wh, 10, 14, 0, 7); g.fill(); g.strokeStyle = css([120, 124, 140]); g.lineWidth = 2; g.stroke(); }
    g.restore();
    g.save(); g.globalCompositeOperation = 'lighter';
    g.globalAlpha = .55; g.drawImage(glowSprite([255, 206, 130], 128), x + L / 2 - 340, y0 - 190, 680, 340);
    g.globalAlpha = .8; g.drawImage(glowSprite([255, 244, 200], 128), x + L - 50, y0 - 90, 190, 150);
    for (let i = 0; i < 8; i++) { const ph = ((t * .003 + i * .13) % 1); g.globalAlpha = (1 - ph) * (lat(Math.floor(t / 90), i, 3) < .5 ? .9 : 0); g.fillStyle = css([190, 220, 255]); g.beginPath(); g.arc(x + L * .5 - 18 + (lat(i, 3, 3) - .5) * 20, 372 + ph * 12, 1.6, 0, 7); g.fill(); }
    // windows' reflections in the river
    for (let i = 0; i < nw; i++) { g.globalAlpha = .12; g.fillStyle = css([255, 214, 140]); g.fillRect(x + 30 + i * ww + Math.sin(t * .003 + i) * 4, y0 + 62, ww - 12, 30); }
    g.restore();
    g.save(); g.strokeStyle = css([6, 6, 10], .95); g.lineWidth = 5; g.beginPath(); g.moveTo(0, sc.deck - 22); g.lineTo(DW, sc.deck - 22); g.stroke(); g.lineWidth = 3; for (let px = 30; px < DW; px += 60) { g.beginPath(); g.moveTo(px, sc.deck - 22); g.lineTo(px, sc.deck + 14); g.stroke(); } g.restore();
    // the district's last tower bell silhouetted: a pale ring in the dark, far behind
    g.save(); g.globalCompositeOperation = 'lighter'; for (let k = 0; k < 2; k++) { const ph = ((t * .00014 + k / 2) % 1); g.strokeStyle = css([160, 180, 255], (1 - ph) * .1); g.lineWidth = 2 + ph * 6; g.beginPath(); g.ellipse(165, 230, 20 + ph * 460, (20 + ph * 460) * .6, 0, 0, 7); g.stroke(); } g.restore();
  };
  return sc;
};

/* ---------------- DAY CARD ---------------- */
const _cards = new Map();
function paintDayCard(g, r, day) {
  const sc = { glows: [], bunting: [], day: day };
  const jub = day >= 3;
  // dawn sky: day 2 cool rose-gold with mist, day 3 hot orange under bruised cloud
  skyFill(g, 0, 0, DW, DH, jub ? [[0, [38, 26, 52]], [.35, [120, 52, 70]], [.62, [224, 110, 66]], [.8, [250, 170, 90]], [1, [254, 196, 110]]] : [[0, [30, 56, 88]], [.35, [92, 124, 146]], [.62, [222, 166, 140]], [.8, [248, 204, 148]], [1, [252, 214, 150]]], r, 760);
  glowAt(g, jub ? 300 : 360, 520, 620, jub ? [255, 150, 70] : [255, 210, 150], jub ? .7 : .6); sunDisc(g, jub ? 300 : 360, 530, jub ? 58 : 50, jub ? [255, 214, 140] : [255, 236, 190]);
  for (let i = 0; i < (jub ? 9 : 6); i++) cloud(g, r.r(0, DW), r.r(30, 330), r.r(160, 340), r.r(22, 46), jub ? mix([70, 36, 64], [190, 80, 70], r() * .8) : mix([150, 150, 176], [240, 180, 160], r() * .8), jub ? [255, 150, 80] : [255, 214, 170], r, 8);
  lightRays(g, jub ? 300 : 360, 530, 1000, 3.2, -Math.PI / 2, jub ? [255, 170, 90] : [255, 230, 180], jub ? .14 : .1, 20, r);
  // district skyline (far, hazy)
  const dummy = { wins: [], smoke: [] };
  for (let i = 0; i < 20; i++) aptBlock(g, r, dummy, i * 68 - 20 + r.r(-8, 8), 572, r.r(44, 78), r.r(40, 130), mix(jub ? [110, 70, 96] : [120, 130, 156], jub ? [200, 110, 90] : [210, 170, 160], r() * .6), { far: true, wins: true, lit: .35, ww: 8, wh: 11, gx: 8, gy: 10, col: [255, 214, 140], dark: [70, 70, 100], rim: [255, 190, 130], chimney: false });
  const hz = g.createLinearGradient(0, 470, 0, 590); hz.addColorStop(0, 'rgba(255,200,140,0)'); hz.addColorStop(1, css(jub ? [255, 150, 80] : [255, 210, 170], .45)); g.fillStyle = hz; g.fillRect(0, 470, DW, 120);
  sc.wins = dummy.wins;
  // School No. 9 on the right, bell tower catching the first light
  const info = paintSchool(g, r, { x: 700, y: 650, s: .66, wall: jub ? [134, 100, 100] : [118, 128, 124], roof: jub ? [60, 40, 52] : [60, 64, 70], lit: [255, 200, 120], litP: jub ? .55 : .3, glows: sc.glows, seed: jub ? 9 : 5, rim: jub ? [255, 150, 80] : [255, 200, 130], haze: jub ? [255, 150, 80] : [255, 210, 160], bell: [236, 190, 90] });
  sc.rings = info;
  // the school's own banner on the facade
  if (jub) { paintRect(g, 740, 500, 250, 40, [150, 26, 34], r, { n: 50, ink: true, inkw: 3, ang: 0, alt: [220, 60, 50] }); handText(g, 'THE GRAND HARMONY — 20:00', 865, 520, 17, [250, 226, 150], r, 232, { shadow: [0, 0, 0, 0] }); }
  cobbles(g, r, 640, DH - 640, jub ? [110, 84, 84] : [104, 104, 108], jub ? [[120, 60, 70], [250, 160, 80]] : [[90, 110, 130], [240, 190, 150]]);
  // loudspeaker poles (more, and angrier, on day 3)
  const poles = jub ? [[60, 700, 420], [250, 690, 360], [470, 676, 300], [1120, 700, 440], [1250, 690, 340]] : [[90, 700, 360], [1190, 700, 380]];
  for (const [x, y, h] of poles) { pole(g, r, x, y, h); if (jub) { for (const [dx, dy, k] of [[0, 6, 1.5], [-6, 52, 1.1], [6, 90, .9]]) { const hx = x + dx, hy = y - h + dy; paintPoly(g, [[hx - 12 * k, hy - 7 * k], [hx + 12 * k, hy - 7 * k], [hx + 40 * k, hy - 24 * k], [hx + 40 * k, hy + 24 * k], [hx + 12 * k, hy + 7 * k], [hx - 12 * k, hy + 7 * k]], [30, 28, 32], r, { n: 24, ink: true, inkw: 2, ang: 0, lit: [[255, 120, 70], [4, 4, 8], -1.57, .5, .6] }); paintEll(g, hx + 40 * k, hy, 8 * k, 24 * k, [10, 8, 10], r, { n: 6, ink: true }); } g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = css([255, 60, 40], .0); g.restore(); sc.glows.push({ x, y: y - h + 22, r: 46, col: [255, 70, 40], a: .4, fl: .35, ph: x * .01 }); } }
  // bunting: day 3 strings of Jubilee flags between poles, roof and tower
  if (jub) {
    const strings = [[[60, 700 - 420 + 4], [250, 690 - 360 + 4]], [[250, 690 - 360 + 4], [470, 676 - 300 + 4]], [[470, 676 - 300 + 4], [760, 520]], [[1120, 700 - 440 + 4], [1250, 690 - 340 + 4]], [[760, 520], [1120, 700 - 440 + 4]], [[60, 700 - 420 + 4], [420, 120]]];
    sc.strings = strings;
    strings.forEach(([a, b], si) => { const n = Math.max(6, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 26)); const sag = Math.hypot(b[0] - a[0], b[1] - a[1]) * .1; g.strokeStyle = css([20, 14, 16], .9); g.lineWidth = 1.6; g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + sag * 2, b[0], b[1]); g.stroke();
      for (let i = 1; i < n; i++) { const t = i / n, x = (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * ((a[0] + b[0]) / 2) + t * t * b[0], y = (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * ((a[1] + b[1]) / 2 + sag * 2) + t * t * b[1]; const c = [[190, 36, 40], [236, 206, 120], [236, 230, 210], [60, 100, 90]][(i + si) % 4]; paintPoly(g, [[x - 8, y], [x + 8, y], [x, y + 22 + (i % 3) * 2]], c, r, { n: 6, sw: 2.5, ang: 1.57, ink: true, inkw: 1.2, ew: .8, alt: mul(c, 1.3) }); } });
  }
  // the dark middle band keeps the text legible: a soft dusky veil, heaviest around the centre
  const veil = g.createRadialGradient(640, 330, 40, 640, 330, 520); veil.addColorStop(0, css(jub ? [24, 10, 26] : [14, 22, 40], .52)); veil.addColorStop(.6, css(jub ? [24, 10, 26] : [14, 22, 40], .26)); veil.addColorStop(1, css([6, 6, 12], 0)); g.fillStyle = veil; g.fillRect(0, 0, DW, DH);
  // faint title watermark (UI draws the real one on top)
  g.save(); g.globalAlpha = .16; g.textAlign = 'center'; g.fillStyle = css([255, 236, 190]); g.font = 'bold 22px Georgia, serif'; g.fillText((jub ? 'D A Y   3   —   T H U R S D A Y' : 'D A Y   2   —   W E D N E S D A Y'), 640, 58); g.restore();
  // a few early figures at the gate; on day 2, a black car with its lamps still lit
  const uni = (c, i) => ({ skin: ['#e9c9b1', '#d9a98a', '#c98f6e'][i % 3], hair: ['#2a1d18', '#a2723a', '#1a1414'][i % 3], hairStyle: ['short', 'bob', 'cap'][i % 3], outfit: 'uniform', outfitColor: c, accent: '#c9892f', build: 'avg', glasses: false, age: 'teen', pose: 'stand', extra: 'none' });
  for (let i = 0; i < (jub ? 8 : 4); i++) { const x = 600 + i * 70 + r.r(-12, 12), y = 690 + (i % 2) * 14; groundShadow(g, x, y, 24, .4); fig(g, uni(jub && i % 3 === 0 ? '#7a2828' : '#3f4d5c', i), r.p(['ne', 'nw', 'n']), 0, x, y, 1.4); }
  if (!jub) { paintPoly(g, [[240, 700], [390, 700], [380, 654], [330, 640], [270, 640], [250, 654]], [22, 24, 30], r, { n: 70, ink: true, inkw: 2.4, ang: 0, alt: [90, 100, 120], lit: [[130, 150, 180], [6, 6, 10], -1.2, .4, .5] }); g.fillStyle = css([255, 244, 200]); g.beginPath(); g.ellipse(386, 690, 7, 5, 0, 0, 7); g.fill(); sc.glows.push({ x: 392, y: 690, r: 100, col: [255, 236, 190], a: .55, fl: .03, ph: 2 }); for (const x of [270, 360]) { g.fillStyle = css([6, 6, 8]); g.beginPath(); g.ellipse(x, 702, 14, 8, 0, 0, 7); g.fill(); } }
  return sc;
}
function drawDayCardImpl(ctx, w, h, t, day) {
  w = Math.max(2, Math.round(w)); h = Math.max(2, Math.round(h)); t = t || 0; day = day === 3 || day === '3' ? 3 : 2;
  const bw = Math.min(w, 1600), bh = Math.round(bw * h / w), key = 'card' + day + '|' + bw + '|' + bh;
  let sc = _cards.get(key);
  if (!sc) {
    const c = mk(bw, bh), g = ctx2(c); g.scale(bw / DW, bh / DH);
    const s0 = paintDayCard(g, RNG(hashStr('day' + day)), day);
    g.setTransform(1, 0, 0, 1, 0, 0); applyGrain(g, bw, bh, .3, 'overlay');
    sc = { canvas: c, scene: s0 }; _cards.set(key, sc); if (_cards.size > 4) _cards.delete(_cards.keys().next().value);
  }
  ctx.save(); ctx.fillStyle = '#050408'; ctx.fillRect(0, 0, w, h);
  const z = 1.03 + Math.sin(t * .0001) * .01, dx = Math.sin(t * .00008) * 8, dy = Math.cos(t * .00006) * 5;
  ctx.translate(w / 2 + dx, h / 2 + dy); ctx.scale(z * w / bw, z * w / bw); ctx.translate(-bw / 2, -bh / 2);
  ctx.drawImage(sc.canvas, 0, 0);
  ctx.save(); ctx.scale(bw / DW, bh / DH);
  const s = sc.scene;
  for (const Lg of s.glows) { const fl = 1 + Lg.fl * (Math.sin(t * .012 + Lg.ph) * .6 + Math.sin(t * .029 + Lg.ph * 2.1) * .4); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, Lg.a * fl); ctx.drawImage(glowSprite(Lg.col, 128), Lg.x - Lg.r, Lg.y - Lg.r, Lg.r * 2, Lg.r * 2); }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  drawWins(ctx, { wins: s.wins }, t, clamp(.4 + t * .00004, 0, 1), .8);
  for (let k = 0; k < 3; k++) { const ph = ((t * .00015 + k / 3) % 1), rad = 30 + ph * 700; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = css(day === 3 ? [255, 120, 80] : [255, 220, 150], (1 - ph) * .18); ctx.lineWidth = 3 + ph * 8; ctx.beginPath(); ctx.ellipse(s.rings.tx, s.rings.bellY, rad, rad * .72, 0, 0, 7); ctx.stroke(); ctx.restore(); }
  if (s.strings) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = css([255, 200, 120], .05 + .03 * Math.sin(t * .002)); for (const [a, b] of s.strings) { ctx.fillRect(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), 30); } ctx.restore(); }
  ctx.fillStyle = css([10, 10, 14], .85); for (let i = 0; i < 8; i++) { const bx = ((t * .02 * (.6 + (i % 3) * .2) + i * 190) % (DW + 200)) - 100, by = 120 + (i * 53) % 200 + Math.sin(t * .003 + i) * 14, f = Math.sin(t * .012 + i * 2) * 5; ctx.beginPath(); ctx.moveTo(bx - 9, by + f); ctx.quadraticCurveTo(bx - 3, by - 5, bx, by); ctx.quadraticCurveTo(bx + 3, by - 5, bx + 9, by + f); ctx.lineTo(bx + 3, by - 2); ctx.lineTo(bx - 3, by - 2); ctx.fill(); }
  ctx.restore(); ctx.restore();
  ctx.drawImage(vignette(w, h), 0, 0);
  if (Art.quality.grain) { ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = .12; const o = (Math.floor(t / 70) * 53) % 256, o2 = (Math.floor(t / 70) * 97) % 256; ctx.translate(-o, -o2); ctx.fillStyle = ctx.createPattern(grainTile(), 'repeat'); ctx.fillRect(0, 0, w + 256, h + 256); ctx.restore(); }
}
