
/* ====================================================== ITEM ICONS (v3)
 * 56x56 pixel/painted hybrid: shapes rasterised into the shared px engine (hue-shifted ramps, top-left key
 * light, selective dither on big flat areas, dark outer outline), shown at 56px 1:1 or integer-upscaled. */
const _icons = new Map();
const IC_FONT = { A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110', '4': '101101111001001', '5': '111100110001110', '6': '011100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001110', '.': '000000000000010', '-': '000000111000000', '#': '101111101111101' };
function iconBuild(id) {
  const N = 56, P = px_new(N), r = pt_rng(pt_hash('icon:' + id));
  const M = (c, o) => px_mat(P, c, Object.assign({ n: 5, bias: .55 }, o || {}));
  const G = (cx, cy, b, k) => (x, y) => b - ((x - cx) * .55 + (y - cy) * .65) * (k === undefined ? .02 : k);
  const SP = (cx, cy, rx, ry, b, k) => (x, y) => { const a = (x + .5 - cx) / rx, c = (y + .5 - cy) / ry, nz = Math.sqrt(Math.max(0, 1 - a * a - c * c)); return b + (-a * .5 - c * .6 + nz * .65 - .4) * (k || .7); };
  const poly = (pts, m, sh, z) => px_shape(P, (g) => { g.moveTo(pts[0][0], pts[0][1]); for (let k = 1; k < pts.length; k++) g.lineTo(pts[k][0], pts[k][1]); g.closePath(); g.fill(); }, m, sh, z || 1);
  const rect = (x, y, w, h, m, sh, z) => poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], m, sh, z);
  const ell = (cx, cy, rx, ry, m, sh, z, rot) => px_shape(P, (g) => { g.ellipse(cx, cy, rx, ry, rot || 0, 0, 7); g.fill(); }, m, sh, z || 1);
  const ring = (cx, cy, rx, ry, w, m, sh, z, rot) => px_shape(P, (g) => { g.lineWidth = w; g.ellipse(cx, cy, rx, ry, rot || 0, 0, 7); g.stroke(); }, m, sh, z || 1);
  const ln = (pts, w, m, sh, z) => px_shape(P, (g) => { g.lineWidth = w; g.moveTo(pts[0][0], pts[0][1]); for (let k = 1; k < pts.length; k++) g.lineTo(pts[k][0], pts[k][1]); g.stroke(); }, m, sh, z || 1);
  const crv = (pts, w, m, sh, z) => px_shape(P, (g) => { g.lineWidth = w; g.moveTo(pts[0][0], pts[0][1]); for (let k = 1; k + 1 < pts.length; k += 2) g.quadraticCurveTo(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1]); g.stroke(); }, m, sh, z || 1);
  const pix = (x, y, m, t, z) => px_tone(P, x, y, m, t, z || 30);
  const txt = (s, x, y, m, t, z) => { s = String(s).toUpperCase(); for (let c = 0; c < s.length; c++) { const gl = IC_FONT[s[c]]; if (!gl) continue; for (let k = 0; k < 15; k++) if (gl[k] === '1') pix(x + c * 4 + (k % 3), y + ((k / 3) | 0), m, t, z); } };
  const scrib = (x, y, w, rows, gap, m, t, z) => { for (let j = 0; j < rows; j++) { let xx = x; const ww = w - (j === rows - 1 ? w * .35 : r() * 4); while (xx < x + ww) { const run = 2 + ((r() * 4) | 0); for (let k = 0; k < run && xx < x + ww; k++, xx++) pix(xx, y + j * gap + ((k === 1 && r() < .3) ? -1 : 0), m, t, z); xx += 1; } } };
  const hole = (x, y) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= N || y >= N) return; const i = y * N + x; P.M[i] = -1; P.Z[i] = 32000; };
  const holeEll = (cx, cy, rx, ry) => { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const a = (x + .5 - cx) / rx, b = (y + .5 - cy) / ry; if (a * a + b * b <= 1) hole(x, y); } };
  // common materials
  const brass = () => M([196, 150, 62], { lk: .75, bias: .5 }), paperM = (c) => M(c || [226, 214, 178], { dither: true, bias: .6, lk: .6 }), inkM = () => M([40, 40, 70], { bias: .5 });
  const redM = () => M([176, 40, 40]), steel = () => M([150, 156, 166], { lk: .75, bias: .5 }), blackM = () => M([42, 40, 46], { bias: .45, lk: .5 });
  switch (id) {
    case 'boiler_key': {
      const b = brass(), pa = paperM([214, 196, 150]), rd = redM();
      poly([[5, 33], [16, 30], [19, 42], [8, 45]], pa, G(12, 38, .6), 1); hole(10, 35); ln([[10, 35], [14, 21]], 1, rd, .6, 2); txt('B', 11, 37, rd, 1, 3);
      px_shape(P, (g) => { g.ellipse(17, 16, 10, 10, 0, 0, 7); g.ellipse(17, 16, 4.5, 4.5, 0, 0, 7); g.fill('evenodd'); }, b, SP(17, 16, 10, 10, .55), 4);
      ln([[24, 23], [45, 44]], 5, b, (x, y) => .55 + ((x - y) * .12), 4); ell(24, 23, 4, 4, b, .5, 5);
      ln([[39, 38], [34, 43]], 4, b, .45, 4); ln([[44, 43], [39, 48]], 4, b, .4, 4); ln([[42, 41], [40, 43]], 2, b, .3, 5);
      break;
    }
    case 'chalk_stub': {
      const ch = M([236, 234, 224], { bias: .6, hs: .4 }), dust = M([210, 210, 214], { bias: .5 });
      ln([[14, 36], [37, 23]], 11, ch, (x, y) => .62 - ((y - 30) + (x - 26) * .5) * .035, 2);
      ell(37.5, 23, 3.4, 5.8, ch, .9, 3, -1.05); ell(13.5, 36.5, 4, 5.4, ch, (x, y) => .55 + (x < 13 ? -.15 : 0), 3, -1.05);
      for (let k = 0; k < 14; k++) pix(10 + r() * 34, 42 + r() * 8, dust, (r() * 3) | 0, 1);
      for (let k = 0; k < 6; k++) pix(18 + k * 3, 30 - (k & 1), ch, 4, 4);
      break;
    }
    case 'torn_page': {
      const pa = paperM([222, 210, 172]), pen = M([70, 64, 66]), rd = redM();
      const edge = []; for (let y = 5; y <= 51; y += 3) edge.push([40 + (y % 6 ? 4 : -1) + r() * 2, y]);
      poly([[10, 6], ...edge, [12, 50], [8, 28]], pa, G(25, 28, .62, .012), 1);
      ring(26, 22, 7, 9, 1.2, pen, .45, 2); ln([[22, 21], [24, 21]], 1, pen, .3, 3); ln([[28, 21], [30, 21]], 1, pen, .3, 3); ln([[25, 26], [27, 26]], 1, pen, .3, 3);
      ln([[18, 34], [34, 34]], 1, pen, .4, 2); for (let k = 0; k < 6; k++) ln([[19 + k * 2, 31], [17 + k * 2, 33]], 1, pen, .55, 2);
      scrib(14, 39, 22, 3, 4, pen, 2, 3); ring(31, 41, 6, 4.5, 1.4, rd, .6, 4);
      break;
    }
    case 'ration_coupon': {
      const pa = paperM([214, 192, 120]), rd = redM(), ink = M([70, 52, 40]);
      poly([[5, 17], [50, 13], [52, 39], [7, 43]], pa, G(28, 28, .6, .01), 1);
      for (let k = 0; k < 7; k++) { holeEll(5.5, 19 + k * 3.6, 1.2, 1.2); holeEll(51.5, 15 + k * 3.6, 1.2, 1.2); }
      ln([[9, 20], [47, 17]], 1, ink, .4, 2); ln([[10, 37], [48, 34]], 1, ink, .4, 2);
      txt('RATION', 11, 22, rd, 1, 3); txt('4417', 12, 30, ink, 1, 3); ring(41, 30, 5, 5, 1.5, rd, .5, 4); pix(41, 30, rd, 2, 5); pix(40, 29, rd, 1, 5);
      break;
    }
    case 'cigarettes': {
      const red = M([178, 50, 44], { dither: true }), wh = M([236, 230, 212]), fl = M([196, 130, 60]), foil = steel(), gold = brass();
      for (const [x, h] of [[22, 9], [28, 6]]) { rect(x, 12 - h + 6, 4, h + 4, wh, .75, 1); rect(x, 12 - h + 6, 4, 3, fl, .6, 2); }
      rect(14, 14, 28, 36, red, G(28, 32, .55, .016), 3); rect(14, 14, 28, 6, foil, G(28, 17, .6, .03), 4);
      rect(14, 27, 28, 9, wh, G(28, 31, .6, .01), 4); txt('UNION', 18, 29, red, 1, 5);
      for (let x = 15; x < 42; x += 2) pix(x, 38, gold, 3, 5); rect(37, 14, 5, 36, red, .3, 4);
      break;
    }
    case 'ledger': case 'matron_ledger': {
      const fat = id === 'matron_ledger', cov = M(fat ? [44, 84, 60] : [40, 76, 60], { dither: true }), sp = M([30, 46, 40]), pg = paperM([226, 214, 178]), gold = brass(), rd = redM();
      const t = fat ? 8 : 5;
      poly([[13, 7 + 0], [44, 7], [44 + t * .6, 9], [44 + t * .6, 48], [44, 50], [13, 50]], pg, (x, y) => .5 + ((y & 1) ? .12 : 0), 1);
      rect(9, 5, 35, 43, cov, G(26, 26, .55, .014), 3); rect(9, 5, 6, 43, sp, G(12, 26, .5, .03), 4);
      for (const yy of [10, 42]) ln([[9, yy], [15, yy]], 1, gold, .7, 5);
      rect(21, 13, 17, 9, gold, G(29, 17, .6, .03), 5); rect(23, 15, 13, 5, cov, .35, 6);
      if (fat) { for (const [yy, c] of [[14, [190, 60, 60]], [24, [70, 110, 170]], [34, [210, 180, 70]]]) rect(44 + t * .6, yy, 4, 5, M(c), .55, 2); rect(38, 24, 8, 8, gold, SP(42, 28, 4, 4, .55), 6); pix(42, 28, cov, 0, 7); }
      else { ln([[33, 48], [33, 54], [31, 53]], 2, rd, .55, 2); for (const [cx, cy] of [[43, 6], [43, 47]]) poly([[cx - 4, cy - 1], [cx + 1, cy - 1], [cx + 1, cy + 3]], gold, .6, 6); }
      break;
    }
    case 'rhea_pin': {
      const en = M([186, 34, 40], { lk: .6 }), gold = brass(), st = steel();
      ln([[8, 44], [46, 38]], 1.6, st, .7, 1);
      poly([[28, 6], [44, 15], [44, 33], [28, 47], [12, 33], [12, 15]], gold, G(28, 26, .6, .02), 2);
      poly([[28, 10], [40, 17], [40, 31], [28, 42], [16, 31], [16, 17]], en, G(28, 26, .55, .022), 3);
      px_shape(P, (g) => { for (let i = 0; i < 10; i++) { const a = i * .6283 - 1.5708, rr = i % 2 ? 4 : 9.5; g.lineTo(28 + Math.cos(a) * rr, 26 + Math.sin(a) * rr); } g.closePath(); g.fill(); }, gold, G(28, 26, .7, .03), 4);
      pix(18, 18, en, 4, 5); pix(19, 17, en, 4, 5);
      break;
    }
    case 'note_yesterday_1': case 'note_yesterday_2': case 'note_yesterday_3': {
      const n = +id.slice(-1), pa = paperM(n === 1 ? [232, 226, 204] : n === 2 ? [228, 216, 160] : [230, 206, 196]), ln_ = M([140, 160, 196]), rd = M([200, 90, 90]), ink = inkM();
      const rot = (n - 2) * .1, ca = Math.cos(rot), sa = Math.sin(rot), T = (x, y) => [28 + (x - 28) * ca - (y - 28) * sa, 28 + (x - 28) * sa + (y - 28) * ca];
      const pts = n === 1 ? [[9, 8], [16, 6], [23, 9], [31, 6], [38, 9], [46, 7], [46, 50], [10, 50]] : n === 2 ? [[10, 6], [46, 6], [46, 40], [36, 50], [10, 50]] : [[9, 7], [46, 5], [48, 27], [45, 50], [11, 51], [7, 30]];
      poly(pts.map((p) => T(p[0], p[1])), pa, n === 3 ? (x, y) => .6 + (pt_vn(x * .25, y * .25, 3) - .5) * .5 : G(28, 28, .62, .01), 1);
      if (n === 2) poly([T(36, 50), T(46, 40), T(37, 41)], pa, .35, 2);
      for (let yy = 15; yy < 48; yy += 5) for (let xx = 11; xx < 45; xx++) { const q = T(xx, yy); const i = Math.round(q[1]) * N + Math.round(q[0]); if (P.M[i] === pa) pix(q[0], q[1], ln_, 2, 2); }
      for (let yy = 8; yy < 49; yy++) { const q = T(16, yy); const i = Math.round(q[1]) * N + Math.round(q[0]); if (P.M[i] === pa || P.M[i] === ln_) pix(q[0], q[1], rd, 2, 3); }
      const rn = ['I', 'II', 'III'][n - 1]; const tq = T(20, 10); for (let c = 0; c < rn.length; c++) for (let yy = 0; yy < 7; yy++) { pix(tq[0] + c * 4, tq[1] + yy, ink, 1, 5); pix(tq[0] + c * 4 + 1, tq[1] + yy, ink, 2, 5); }
      for (let j = 0; j < 5; j++) { const q = T(19, 19 + j * 5); scrib(q[0], q[1] - 1, j === 4 ? 14 : 24, 1, 5, ink, 1, 4); }
      break;
    }
    case 'radio_tube': case 'gregor_tubes': {
      if (id === 'gregor_tubes') {
        const box = M([170, 130, 84], { dither: true }), news = paperM([206, 200, 180]), gl = M([170, 206, 210], { bias: .5, lk: .7 }), ink = M([70, 66, 64]);
        for (let k = 0; k < 3; k++) { const x = 15 + k * 10; ell(x + 3, 17 - (k & 1) * 3, 4.2, 7, gl, SP(x + 3, 17 - (k & 1) * 3, 4.2, 7, .6), 2); pix(x + 1, 13 - (k & 1) * 3, gl, 4, 3); pix(x + 1, 14 - (k & 1) * 3, gl, 4, 3); poly([[x - 1, 22], [x + 7, 22], [x + 8, 30], [x - 2, 30]], news, G(x + 3, 26, .6, .03), 3); scrib(x, 25, 6, 2, 2, ink, 1, 4); }
        poly([[9, 26], [47, 26], [45, 50], [11, 50]], box, G(28, 38, .55, .015), 5); poly([[9, 26], [47, 26], [50, 21], [6, 21]], box, .72, 4);
        txt('6', 26, 36, ink, 0, 6); ln([[12, 31], [44, 31]], 1, box, .3, 6);
        break;
      }
      const gl = M([160, 204, 210], { bias: .5, lk: .75, dither: true }), bk = blackM(), pl = steel(), fil = M([255, 150, 60], { glow: true, ramp: [[200, 80, 30], [255, 150, 60], [255, 230, 160]] }), pins = brass();
      for (let k = 0; k < 4; k++) rect(20 + k * 5, 46, 1.5, 6, pins, .6, 1);
      px_shape(P, (g) => { g.moveTo(17, 40); g.lineTo(16, 18); g.quadraticCurveTo(16, 6, 28, 5); g.quadraticCurveTo(40, 6, 40, 18); g.lineTo(39, 40); g.closePath(); g.fill(); }, gl, (x, y) => .55 - (x - 28) * .025 + (x < 21 ? .25 : 0), 2);
      rect(22, 16, 12, 18, pl, G(28, 25, .4, .03), 3); for (let y = 18; y < 33; y += 3) ln([[23, y], [33, y]], 1, pl, .2, 4);
      ln([[26, 33], [26, 20], [30, 20], [30, 33]], 1, fil, .6, 5); ell(28, 24, 2, 3, fil, .9, 6);
      for (let y = 10; y < 36; y++) pix(19, y, gl, 4, 7); pix(20, 9, gl, 4, 7);
      rect(15, 38, 26, 9, bk, G(28, 42, .5, .03), 8); ln([[16, 39], [40, 39]], 1, bk, .9, 9);
      break;
    }
    case 'bread_note': {
      const cr = M([186, 120, 58], { lk: .6 }), sc = M([232, 196, 130]), pa = paperM(), ink = inkM();
      poly([[30, 6], [38, 4], [42, 24], [34, 27]], pa, G(36, 15, .62, .02), 1); scrib(33, 9, 6, 3, 3, ink, 1, 2);
      ell(28, 34, 22, 13, cr, SP(28, 31, 22, 15, .5, .9), 3);
      for (let k = -2; k <= 2; k++) { ln([[28 + k * 8 - 3, 27], [28 + k * 8 + 2, 36]], 2, sc, .55, 4); }
      for (let k = 0; k < 8; k++) pix(12 + r() * 30, 38 + r() * 6, cr, 0, 5);
      break;
    }
    case 'vanguard_armband': {
      const rd = M([176, 32, 36], { dither: true, lk: .55 }), wh = M([236, 228, 206]), gold = brass();
      ring(28, 28, 21, 11, 13, rd, (x, y) => (y < 26 ? .3 : .6) - (x - 28) * .01, 1);
      px_shape(P, (g) => { g.ellipse(28, 31, 21, 11, 0, 0, Math.PI); g.lineTo(7, 25); g.ellipse(28, 25, 21, 11, 0, Math.PI, 0, true); g.closePath(); g.fill(); }, rd, (x, y) => .6 - (x - 28) * .014 + (y > 38 ? -.15 : 0), 2);
      ell(28, 33, 7, 6.5, wh, SP(28, 33, 7, 6.5, .65), 3);
      px_shape(P, (g) => { for (let i = 0; i < 10; i++) { const a = i * .6283 - 1.5708, rr = i % 2 ? 2.3 : 5.5; g.lineTo(28 + Math.cos(a) * rr, 33 + Math.sin(a) * rr); } g.closePath(); g.fill(); }, rd, .55, 4);
      for (let x = 9; x < 48; x += 3) pix(x, 26 + Math.round(Math.sin((x - 7) / 42 * Math.PI) * 10), gold, 2, 4);
      break;
    }
    case 'pocket_mirror': {
      const b = brass(), gl = M([150, 196, 206], { bias: .5, lk: .7 }), ink = M([60, 70, 80]);
      ell(33, 17, 15, 11, b, SP(33, 17, 15, 11, .45), 1, -.3); ell(33, 17, 11, 7.5, b, .3, 2, -.3);
      ell(24, 33, 17, 17, b, SP(24, 33, 17, 17, .5), 3); ell(24, 33, 13, 13, gl, (x, y) => .5 - ((x - 24) * .6 + (y - 33) * .7) * .03, 4);
      ln([[16, 26], [22, 22]], 2, gl, .98, 5); ln([[17, 31], [27, 24]], 1, gl, .9, 5);
      ln([[27, 22], [24, 32], [30, 38], [28, 44]], 1, ink, .4, 6); rect(34, 22, 4, 4, b, .7, 5);
      break;
    }
    case 'warden_badge': {
      const g_ = brass(), en = M([120, 30, 34]), gd = M([226, 196, 110], { lk: .7 });
      poly([[28, 4], [47, 12], [46, 32], [28, 51], [10, 32], [9, 12]], g_, G(28, 26, .62, .02), 1);
      poly([[28, 9], [42, 15], [41, 31], [28, 45], [15, 31], [14, 15]], en, G(28, 26, .55, .02), 2);
      px_shape(P, (g) => { g.moveTo(22, 32); g.quadraticCurveTo(22, 16, 28, 16); g.quadraticCurveTo(34, 16, 34, 32); g.lineTo(36, 34); g.lineTo(20, 34); g.closePath(); g.fill(); }, gd, G(28, 26, .6, .03), 3);
      ell(28, 37, 2.4, 2.2, gd, .6, 3); pix(28, 14, gd, 3, 4); pix(28, 15, gd, 2, 4);
      break;
    }
    case 'sweet_roll': {
      const dough = M([212, 146, 74], { lk: .65 }), sw = M([150, 86, 40]), ic = M([246, 240, 226], { bias: .6 });
      ell(28, 33, 22, 14, dough, SP(28, 30, 22, 16, .55, .8), 1);
      px_shape(P, (g) => { g.lineWidth = 2.4; for (let a = 0; a < 15; a += .2) { const rr = 1.3 * a, x = 28 + Math.cos(a) * rr, y = 31 + Math.sin(a) * rr * .6; if (a === 0) g.moveTo(x, y); else g.lineTo(x, y); } g.stroke(); }, sw, .45, 2);
      crv([[12, 28], [20, 20], [28, 26], [36, 32], [44, 25]], 2.4, ic, .8, 3); crv([[16, 36], [24, 30], [32, 37], [38, 40], [42, 34]], 2, ic, .7, 3);
      pix(20, 31, ic, 4, 4); pix(20, 32, ic, 3, 4); pix(36, 33, ic, 3, 4); pix(36, 34, ic, 2, 4);
      break;
    }
    case 'ration_tea': {
      const en = M([228, 224, 210], { bias: .6, hs: .5 }), rim = M([60, 90, 140]), tea = M([96, 54, 30]), tag = M([220, 190, 80]), st = M([210, 214, 220]), ch = M([60, 66, 74]);
      ring(41, 32, 6, 7, 3.4, en, .5, 1);
      poly([[13, 20], [39, 20], [37, 47], [15, 47]], en, (x, y) => .7 - (x - 18) * .022, 2); ell(26, 20, 13, 4, rim, .5, 3); ell(26, 20.5, 11, 2.8, tea, .4, 4);
      for (const [x, y] of [[18, 30], [33, 40], [21, 44]]) { pix(x, y, ch, 1, 5); pix(x + 1, y, ch, 2, 5); }
      ln([[33, 20], [37, 28]], 1, M([200, 200, 190]), .8, 5); rect(35, 28, 5, 6, tag, .65, 6);
      for (const [x0, ph] of [[20, 0], [27, 2], [33, 1]]) for (let k = 0; k < 9; k++) if ((k + ph) % 3 !== 0) pix(x0 + Math.round(Math.sin((k + ph) * .8) * 1.5), 15 - k, st, 2 - (k > 5 ? 1 : 0), 6);
      ell(26, 48, 11, 2, en, .3, 1);
      break;
    }
    case 'exam_booklet': {
      const cov = M([164, 180, 140], { dither: true }), rd = redM(), ink = M([60, 60, 56]), st = steel();
      rect(11, 5, 34, 46, cov, G(28, 28, .58, .012), 1); rect(11, 5, 34, 11, rd, G(28, 10, .55, .02), 2); txt('EXAM', 20, 8, M([240, 226, 200]), 1, 3);
      ring(28, 29, 7, 7, 1.3, ink, .4, 3); ln([[25, 29], [31, 29]], 1, ink, .4, 3); ln([[28, 26], [28, 32]], 1, ink, .4, 3);
      for (let k = 0; k < 3; k++) ln([[17, 40 + k * 3], [39, 40 + k * 3]], 1, ink, .55, 3);
      for (const y of [16, 40]) rect(11, y, 2, 3, st, .8, 3);
      break;
    }
    case 'vasha_notebook': {
      const cov = M([92, 100, 64], { dither: true }), bk = blackM(), pc = M([206, 160, 60]), pg = paperM(), wh = M([210, 206, 180]);
      poly([[12, 7], [42, 7], [44, 9], [44, 50], [12, 50]], pg, .5, 1);
      rect(10, 6, 32, 43, cov, G(26, 27, .55, .013), 2); rect(34, 6, 3, 43, bk, .45, 3);
      ln([[44, 8], [44, 46]], 3, pc, (x, y) => .6 - (x - 44) * .1, 4); poly([[42.5, 46], [45.5, 46], [44, 51]], M([220, 190, 150]), .6, 4); pix(44, 50, bk, 0, 5); rect(41, 10, 6, 3, steel(), .7, 5);
      px_shape(P, (g) => { for (let i = 0; i < 10; i++) { const a = i * .6283 - 1.5708, rr = i % 2 ? 2.5 : 6; g.lineTo(22 + Math.cos(a) * rr, 24 + Math.sin(a) * rr); } g.closePath(); g.fill(); }, wh, .55, 3);
      txt('7', 19, 38, wh, 1, 3); txt('9', 23, 38, wh, 1, 3);
      break;
    }
    case 'staged_rope': {
      const rp = M([176, 140, 90], { bias: .55 }), cut = M([232, 210, 160]);
      const tw = (x, y) => .55 + (((x + y * 2) & 3) < 2 ? .16 : -.12);
      for (let k = 0; k < 4; k++) ring(26, 38 - k * 3, 18 - k * 2, 8 - k, 4, rp, (x, y) => tw(x, y) - (y > 40 - k * 3 ? -.05 : .1), 1 + k);
      crv([[38, 30], [50, 24], [44, 12], [38, 2], [30, 9], [26, 16], [34, 20]], 4, rp, tw, 6);
      ell(34.5, 20, 2.6, 2.6, cut, .7, 7); pix(34, 19, cut, 4, 8);
      ell(30, 14, 3.5, 3, rp, (x, y) => tw(x, y) - .05, 7);
      break;
    }
    case 'mic_cable': {
      const cb = M([40, 40, 46], { lk: .55 }), st = steel(), gold = brass();
      for (let k = 0; k < 4; k++) ring(24, 32 - k * 2.5, 17 - k * 1.5, 10 - k, 3, cb, (x, y) => (y < 30 - k * 2.5 ? .65 : .35), 1 + k);
      crv([[38, 28], [44, 22], [42, 14]], 3, cb, .5, 6); rect(37, 5, 9, 10, st, G(41, 10, .6, .04), 7); for (let k = 0; k < 3; k++) pix(39 + k * 2, 4, gold, 3, 8);
      crv([[10, 36], [6, 44], [12, 48]], 3, cb, .5, 6); rect(12, 45, 9, 7, st, G(16, 48, .6, .04), 7); rect(20, 46, 2, 5, st, .3, 8);
      break;
    }
    case 'school_cap': {
      const cl = M([56, 72, 96], { dither: true, lk: .5 }), vs = blackM(), gold = brass(), bd = M([36, 44, 60]);
      px_shape(P, (g) => { g.moveTo(8, 30); g.quadraticCurveTo(8, 10, 28, 9); g.quadraticCurveTo(48, 10, 48, 28); g.lineTo(46, 34); g.lineTo(10, 34); g.closePath(); g.fill(); }, cl, SP(28, 24, 22, 16, .5, .8), 1);
      rect(9, 28, 38, 6, bd, G(28, 31, .45, .02), 2);
      px_shape(P, (g) => { g.moveTo(12, 34); g.quadraticCurveTo(28, 50, 47, 36); g.lineTo(44, 33); g.lineTo(12, 33); g.closePath(); g.fill(); }, vs, (x, y) => .6 - (y - 34) * .05, 3);
      ell(28, 22, 4, 4, gold, SP(28, 22, 4, 4, .55), 3); ln([[16, 38], [26, 41]], 1, vs, .9, 4);
      break;
    }
    case 'bent_spoon': {
      const st = M([188, 190, 196], { lk: .8, bias: .5 });
      crv([[8, 48], [22, 36], [24, 30], [26, 24], [33, 22]], 4, st, (x, y) => .55 + (x + y < 54 ? .2 : 0), 1);
      ell(39, 17, 9, 6.5, st, SP(39, 17, 9, 6.5, .55, .9), 2, -.6); ell(39.5, 17.5, 5.5, 3.6, st, (x, y) => .3 + (x - 39) * .04, 3, -.6); pix(36, 15, st, 4, 4); pix(37, 14, st, 4, 4);
      break;
    }
    case 'relay_pass': case 'forged_pass': {
      const forged = id === 'forged_pass', cd = M(forged ? [214, 200, 156] : [196, 208, 186], { dither: true, bias: .6 }), ph = M([120, 124, 130]), sk = M([200, 170, 150]), ink = M([50, 56, 60]), stp = M(forged ? [120, 60, 140] : [176, 40, 40]), clip = steel();
      if (forged) poly([[6, 10], [50, 7], [51, 46], [7, 49]], cd, (x, y) => .6 + (pt_vn(x * .2, y * .2, 4) - .5) * .25, 1); else rect(6, 10, 44, 34, cd, G(28, 27, .62, .01), 1);
      if (!forged) { rect(23, 4, 10, 8, clip, G(28, 8, .6, .04), 3); holeEll(28, 7, 2.5, 1.2); }
      rect(10, 15, 13, 16, ph, .4, 2); ell(16.5, 21, 3.4, 4, sk, SP(16.5, 21, 3.4, 4, .5), 3); poly([[11, 31], [13, 26], [20, 26], [22, 31]], ink, .45, 3);
      txt('PASS', 27, 15, ink, 0, 3); scrib(27, 23, 19, 3, 3, ink, 1, 3);
      ring(22, 34, 6, 6, 1.4, stp, .55, 5); txt('4', 20, 32, stp, 1, 5); if (forged) { ring(24, 35, 6, 6, 1, stp, .75, 4); crv([[30, 42], [34, 36], [38, 41], [42, 46], [46, 38]], 1, ink, .3, 4); }
      if (!forged) { for (let x = 7; x < 50; x++) pix(x, 11, cd, 4, 2); }
      break;
    }
    case 'relay_log': {
      const cov = M([110, 126, 116], { dither: true }), pg = paperM(), tape = M([200, 190, 150]), gr = M([60, 56, 40]), ink = inkM();
      poly([[13, 7], [44, 7], [46, 9], [46, 50], [13, 50]], pg, (x, y) => .5 + ((y & 1) ? .1 : 0), 1);
      rect(10, 5, 34, 44, cov, G(27, 27, .56, .013), 2); rect(10, 5, 5, 44, tape, G(12, 27, .55, .03), 3);
      rect(20, 12, 18, 9, pg, .62, 3); txt('LOG', 23, 14, ink, 1, 4);
      ring(29, 33, 5, 5, 1, ink, .4, 3); for (const rr of [8, 11]) px_shape(P, (g) => { g.lineWidth = 1; g.arc(29, 33, rr, -2.2, -.9); g.stroke(); }, ink, .5, 3);
      for (const [x, y, s] of [[36, 40, 3], [19, 42, 2], [40, 27, 2]]) ell(x, y, s, s * .8, gr, .3, 4);
      break;
    }
    case 'master_tape': {
      const tin = M([150, 154, 160], { lk: .75 }), tp = M([92, 62, 40]), rd = redM(), wh = M([236, 226, 200]);
      ell(28, 30, 22, 20, tin, SP(28, 28, 22, 22, .5, .7), 1); ring(28, 30, 22, 20, 1.5, tin, .25, 2);
      ell(28, 30, 15, 13.5, tp, (x, y) => .45 + Math.sin(Math.hypot(x - 28, y - 30) * 2.2) * .12, 2);
      ell(28, 30, 6, 5.5, tin, SP(28, 30, 6, 5.5, .6), 3); for (let k = 0; k < 3; k++) { const a = k * 2.094 - 1.57; holeEll(28 + Math.cos(a) * 3.2, 30 + Math.sin(a) * 3, 1.1, 1.1); }
      rect(9, 44, 38, 8, wh, .62, 4); txt('JUBILEE', 10, 45, rd, 1, 5);
      break;
    }
    case 'counter_tone': {
      const tin = M([60, 104, 130], { dither: true }), pat = M([214, 180, 90]), sc = M([200, 156, 62], { dither: true }), wx = blackM(), gw = M([127, 208, 192], { glow: true, ramp: [[60, 140, 130], [127, 208, 192], [210, 255, 240]] });
      for (let k = 0; k < 22; k++) { const a = r() * 6.28, rr = 22 + r() * 5; pix(28 + Math.cos(a) * rr, 30 + Math.sin(a) * rr * .8, gw, (r() * 3) | 0, 1); }
      ell(28, 38, 20, 9, tin, (x, y) => .4 - (x - 28) * .01, 2); rect(8, 22, 40, 16, tin, G(28, 30, .55, .015), 3); ell(28, 22, 20, 8, tin, SP(28, 22, 20, 8, .65), 4);
      for (let x = 10; x < 47; x += 4) { pix(x, 30, pat, 3, 5); pix(x + 2, 33, pat, 2, 5); }
      ell(28, 21, 7, 3.2, wx, SP(28, 20, 7, 3.2, .55), 5); rect(21, 12, 14, 9, wx, (x, y) => .45 - (x - 28) * .04 + (x === 23 ? .4 : 0), 5); ell(28, 12, 7, 3, wx, .75, 6); ell(28, 12, 2, 1, gw, .7, 7);
      crv([[6, 30], [20, 40], [36, 38], [44, 36], [50, 28]], 6, sc, (x, y) => .55 + (((x + y) % 4) < 2 ? .1 : -.1), 6); poly([[46, 30], [52, 40], [47, 44], [44, 34]], sc, .4, 7);
      break;
    }
    case 'inspector_card': {
      const cd = M([232, 222, 196], { bias: .6, dither: true }), emb = M([200, 186, 150]), ink = M([46, 44, 50]), gold = brass();
      rect(5, 13, 46, 30, cd, G(28, 28, .62, .01), 1);
      px_shape(P, (g) => { g.moveTo(14, 27); g.quadraticCurveTo(20, 19, 26, 27); g.quadraticCurveTo(20, 33, 14, 27); g.fill(); }, emb, .45, 2);
      ell(20, 27, 2.4, 2.4, ink, .3, 3); ln([[14, 26], [26, 26]], 1, gold, .6, 4); for (const dx of [-4, 0, 4]) pix(20 + dx, 22 - (dx ? 0 : 1), emb, 1, 3);
      txt('VOSS', 30, 20, ink, 0, 3); scrib(30, 28, 17, 3, 3, ink, 2, 3); for (let x = 6; x < 50; x++) pix(x, 14, cd, 4, 2);
      break;
    }
    case 'black_market_ticket': {
      const tk = M([184, 92, 74], { dither: true }), ink = M([50, 30, 26]), pa = M([232, 210, 170]);
      poly([[6, 16], [50, 12], [51, 40], [7, 44]], tk, G(28, 28, .58, .012), 1);
      for (let k = 0; k < 6; k++) holeEll(36 + (k % 2) * 4, 17 + k * 3.8, 1.3, 1.3);
      for (let x = 8; x < 50; x += 2) { const y = 16 - (x - 6) * .09; pix(x, y + 3, pa, 3, 2); }
      txt('XII', 11, 21, pa, 3, 3); scrib(10, 30, 22, 2, 4, ink, 1, 3); ln([[31, 15], [32, 42]], 1, ink, .4, 2);
      break;
    }
    case 'banned_book': {
      const cov = M([108, 84, 62], { dither: true }), sp = M([74, 56, 42]), pg = paperM(), bm = M([210, 200, 160]);
      poly([[16, 8], [42, 8], [44, 10], [44, 49], [16, 49]], pg, (x, y) => .5 + ((y & 1) ? .1 : 0), 1);
      rect(13, 6, 29, 42, cov, (x, y) => G(27, 27, .55, .012)(x, y) + (pt_vn(x * .3, y * .3, 8) - .5) * .25, 2); rect(13, 6, 4, 42, sp, G(15, 27, .5, .03), 3);
      rect(30, 2, 5, 10, bm, G(32, 6, .6, .04), 1); poly([[38, 6], [42, 6], [42, 10]], pg, .6, 3);
      for (let k = 0; k < 4; k++) pix(20 + k * 5, 47, sp, 1, 4);
      break;
    }
    case 'tram_token': {
      const b = brass(), en = M([150, 110, 44]);
      ell(28, 28, 20, 20, b, SP(28, 28, 20, 20, .55, .7), 1); ring(28, 28, 17, 17, 1.2, en, .4, 2); ring(28, 28, 19.5, 19.5, 1, b, .25, 2);
      holeEll(28, 28, 4, 4); ring(28, 28, 5, 5, 1, en, .35, 2);
      rect(17, 13, 22, 7, en, .45, 3); rect(19, 14, 3, 3, b, .75, 4); rect(24, 14, 3, 3, b, .75, 4); rect(29, 14, 3, 3, b, .75, 4); rect(34, 14, 3, 3, b, .75, 4); ln([[22, 11], [27, 8]], 1, en, .4, 3);
      for (let k = 0; k < 9; k++) { const a = k / 9 * 3.14 + .2; pix(28 + Math.cos(a) * 12, 28 + Math.sin(a) * 12 + 2, en, 1, 3); }
      break;
    }
    case 'wrench': {
      const ir = M([110, 116, 124], { lk: .7 }), oil = M([60, 64, 72]), rust = M([150, 86, 50]);
      ln([[12, 46], [36, 20]], 6, ir, (x, y) => .55 + ((x + y) < 56 ? .15 : -.05), 1);
      poly([[30, 20], [40, 8], [48, 12], [44, 18], [38, 17], [38, 24]], ir, G(39, 16, .6, .03), 2); poly([[36, 27], [44, 22], [48, 26], [40, 31]], ir, .45, 2);
      rect(33, 22, 6, 6, oil, (x, y) => .5 + ((y & 1) ? .2 : -.1), 3);
      for (const [x, y] of [[18, 40], [24, 33], [15, 44]]) { pix(x, y, rust, 2, 4); pix(x + 1, y, rust, 1, 4); }
      ln([[14, 43], [30, 25]], 1, ir, .95, 4);
      break;
    }
    case 'osk_keys': {
      const st = steel(), b = brass(), cu = M([176, 110, 70]), tg = paperM([230, 222, 196]), ink = M([60, 50, 50]);
      ring(28, 20, 15, 12, 2.4, st, (x, y) => (y < 18 ? .8 : .4), 1);
      const keys = [[-12, 30, b], [-6, 34, st], [0, 36, cu], [6, 34, b], [12, 30, st], [-9, 32, cu], [9, 32, b]];
      keys.forEach(([dx, len, m], k) => { const x0 = 28 + dx * 1.1, y0 = 20 + 12 * Math.sqrt(Math.max(0, 1 - (dx * 1.1 / 15) ** 2)); const ang = dx * .06; const x1 = x0 + Math.sin(ang) * (len - 12), y1 = y0 + (len - 12) * Math.cos(ang); ell(x0, y0 + 1, 2.6, 2.6, m, .6, 2 + k); ln([[x0, y0 + 3], [x1, Math.min(52, y1 + 3)]], 2, m, .55, 2 + k); pix(x1 + 1, Math.min(52, y1 + 1), m, 2, 3 + k); });
      for (const [x, y] of [[10, 30], [41, 33]]) { rect(x, y, 6, 5, tg, .6, 12); txt('-', x + 1, y, ink, 0, 13); }
      break;
    }
    case 'choir_score': {
      const pa = paperM([232, 222, 190]), ink = M([46, 40, 40]), pen = M([180, 70, 60]);
      poly([[13, 5], [47, 8], [44, 52], [10, 49]], pa, G(28, 28, .5, .01), 1);
      poly([[8, 7], [42, 5], [43, 47], [8, 50]], pa, G(25, 27, .62, .01), 2);
      for (let s = 0; s < 3; s++) for (let l = 0; l < 5; l++) ln([[11, 11 + s * 12 + l * 2], [40, 10 + s * 12 + l * 2]], .8, ink, .55, 3);
      for (let k = 0; k < 9; k++) { const x = 14 + k * 3, y = 11 + ((k * 7) % 3) * 12 + ((k * 5) % 5) * 1.5; ell(x, y + 1, 1.3, 1, ink, .2, 4); ln([[x + 1, y + 1], [x + 1, y - 4]], .8, ink, .3, 4); }
      ln([[34, 46], [37, 39], [40, 43]], 1, pen, .55, 5); ln([[37, 39], [37, 46]], 1, pen, .55, 5);
      break;
    }
    case 'wren_note': {
      const pa = paperM([224, 210, 186]), c1 = M([200, 60, 50]), c2 = M([60, 100, 180]), c3 = M([80, 150, 80]), ink = M([60, 56, 60]);
      poly([[12, 14], [44, 11], [46, 43], [14, 46]], pa, G(28, 28, .6, .012), 1); ln([[13, 30], [45, 27]], 1, pa, .35, 2); ln([[28, 12], [30, 45]], 1, pa, .35, 2);
      crv([[16, 18], [20, 14], [24, 20]], 1.4, c1, .55, 3); crv([[33, 35], [38, 31], [42, 38]], 1.4, c2, .55, 3); ln([[17, 38], [24, 34], [20, 42]], 1.4, c3, .55, 3);
      ell(37, 18, 3, 2, c2, .5, 3); pix(40, 17, c1, 2, 4); txt('TO', 17, 22, ink, 0, 3);
      break;
    }
    case 'cylinder_blank': {
      const wx = M([44, 40, 46], { lk: .55 }), sl = M([186, 156, 110], { dither: true }), ink = M([90, 60, 40]);
      rect(14, 8, 20, 30, wx, (x, y) => .4 - (x - 20) * .04 + (x === 17 || x === 18 ? .5 : 0), 1); ell(24, 8, 10, 3.5, wx, .65, 2); ell(24, 8, 4, 1.5, wx, .1, 3);
      rect(13, 26, 22, 24, sl, G(24, 38, .58, .02), 4); ell(24, 50, 11, 3.5, sl, .4, 3); ell(24, 26, 11, 3.5, sl, .7, 4); ell(24, 26, 9.5, 2.6, wx, .3, 5);
      rect(15, 34, 18, 6, M([226, 214, 178]), .6, 5); scrib(16, 36, 15, 1, 3, ink, 1, 6);
      break;
    }
    case 'vasha_letter': {
      const en = paperM([222, 212, 180]), fl = M([200, 190, 156]), wax = M([150, 36, 40]), ink = inkM();
      poly([[5, 14], [50, 11], [52, 42], [7, 45]], en, G(28, 28, .6, .01), 1);
      ln([[6, 15], [29, 32], [51, 12]], 1.2, fl, .35, 2); ln([[8, 44], [24, 30]], 1, fl, .4, 2); ln([[51, 41], [33, 29]], 1, fl, .4, 2);
      ell(29, 31, 5, 4.6, wax, SP(29, 31, 5, 4.6, .55), 3); pix(28, 30, wax, 4, 4); ell(16, 22, 3, 2, ink, .7, 3);
      for (let k = 0; k < 4; k++) rect(36 + k * 3, 36, 2, 2, ink, .4, 3);
      break;
    }
    case 'fake_bell_schedule': {
      const pa = paperM([226, 222, 204]), ink = M([50, 50, 56]), rd = redM(), gold = brass();
      poly([[8, 5], [48, 7], [47, 52], [9, 50]], pa, G(28, 28, .62, .01), 1);
      px_shape(P, (g) => { g.moveTo(24, 16); g.quadraticCurveTo(24, 9, 28, 9); g.quadraticCurveTo(32, 9, 32, 16); g.lineTo(34, 17); g.lineTo(22, 17); g.closePath(); g.fill(); }, gold, G(28, 13, .6, .05), 2);
      for (let k = 0; k < 6; k++) ln([[12, 21 + k * 5], [44, 21.5 + k * 5]], .8, ink, .55, 2); ln([[22, 20], [22, 47]], .8, ink, .55, 2);
      for (let k = 0; k < 5; k++) { scrib(13, 23 + k * 5, 7, 1, 1, ink, 1, 3); scrib(24, 23 + k * 5, 15, 1, 1, ink, 2, 3); }
      for (const yy of [28, 38]) { ln([[24, yy], [40, yy - 1]], 1, rd, .6, 4); }
      ring(35, 43, 5, 3, 1.2, rd, .6, 4); ln([[42, 13], [46, 20]], 1, rd, .6, 4); ln([[46, 13], [42, 20]], 1, rd, .6, 4);
      break;
    }
    case 'thermos': {
      const gr = M([70, 112, 80], { lk: .55, dither: true }), st = steel(), stc = M([226, 220, 190]), ink = M([60, 50, 50]);
      rect(17, 13, 22, 38, gr, (x, y) => .55 - (x - 22) * .03 + (x > 34 ? -.1 : 0) - (Math.hypot(x - 32, y - 38) < 3.5 ? .25 : 0), 1);
      ell(28, 51, 11, 2.5, gr, .3, 1); rect(18, 6, 20, 9, st, G(28, 10, .55, .03), 2); ell(28, 6, 10, 2.5, st, .8, 3); rect(25, 2, 6, 3, blackM(), .5, 4);
      rect(19, 22, 15, 10, stc, .62, 3); scrib(20, 24, 12, 2, 3, ink, 1, 4); pix(31, 36, gr, 4, 4);
      for (let y = 15; y < 50; y++) pix(20, y, gr, 4, 2);
      break;
    }
    case 'quill_notes': {
      const cd = M([234, 226, 202], { bias: .6 }), ink = inkM(), lace = M([62, 44, 34]);
      for (let k = 3; k >= 0; k--) rect(9 + k * 1.2, 13 - k * 2.4, 36, 26, cd, (x, y) => .62 - k * .1 - ((x - 28) * .55 + (y - 26) * .65) * .006, 1 + (3 - k));
      for (let k = 0; k < 4; k++) scrib(13, 17 + k * 4, 26, 1, 1, ink, 1, 6);
      ln([[27, 4], [27, 45]], 2, lace, .5, 7); ln([[7, 24], [48, 26]], 2, lace, .5, 7);
      crv([[27, 25], [20, 34], [25, 37]], 1.6, lace, .55, 8); crv([[27, 25], [34, 34], [31, 37]], 1.6, lace, .55, 8); ell(27, 25, 2, 2, lace, .7, 9);
      break;
    }
    default: {
      const m = M([150, 140, 120]), ink = M([50, 44, 40]);
      rect(12, 12, 32, 32, m, G(28, 28, .6, .02), 1); txt('?', 26, 26, ink, 0, 2); txt(String(id).slice(0, 2), 24, 24, ink, 0, 2);
    }
  }
  return px_render(P, { mode: 'icon', inner: 1 });
}
function drawItemIconImpl(ctx, x, y, size, id) {
  id = String(id); let c = _icons.get(id);
  if (!c) {
    let buf; try { buf = iconBuild(id); } catch (e) { buf = pt_mk(56, 56); }
    c = pt_mk(112, 112); const g = c.getContext('2d');
    const sh = g.createRadialGradient(58, 98, 2, 58, 98, 40); sh.addColorStop(0, 'rgba(0,0,0,.42)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = sh; g.save(); g.translate(58, 98); g.scale(1, .26); g.beginPath(); g.arc(0, 0, 40, 0, 7); g.restore(); g.fill();
    g.imageSmoothingEnabled = false; g.drawImage(buf, 0, 0, 112, 112); _icons.set(id, c);
  }
  const prev = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = !(size % 56 === 0); if (ctx.imageSmoothingEnabled && 'imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(c, x, y, size, size); ctx.imageSmoothingEnabled = prev;
}
