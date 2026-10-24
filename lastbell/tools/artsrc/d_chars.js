
/* ============================================================ CHARACTERS
 * Painted figures. A small 3D skeleton (body space in cm: a = character's right, y = up, f = forward) is posed,
 * projected with the facing yaw (no sprite mirroring, so the warm key light always comes from screen-right) and
 * painted part by part, depth-sorted: sculpted gradients (cool reflected light -> core shadow -> warm key), form-following
 * brush strokes, cloth folds/seams/collars/buttons, faces and hair with strands; then a shared brush texture, ground
 * occlusion, warm rim + cool fill rim and a dark ink contour over the whole silhouette.
 * Contract (unchanged): getFigure/figureNow -> {c,w,h,ax,ay,hang?}, drawn at the feet point as
 * drawImage(c, -ax/SS, -ay/SS, w/SS, h/SS). Optional extra: spr.sh = {c,ax,ay,w,h} soft painted ground shadow (same units).
 */
const SS = 2, SC = 1.22, K = SS * SC;      // SS: sprite supersample (canvas px per world px). K kept for the scene's hover ring
const CH_PX = 0.68;                        // world px per body cm: adult ~120 px, teen ~113 px (~1.3x the old figures; kept just above door height)
const CH_DK = 0.5;                         // iso foreshortening of depth (2:1 floor)
const CH_LX = .8, CH_LY = -.6;             // key light direction (screen space, towards the light)
const DEF_LOOK = { skin: '#d9a98a', hair: '#2a1d18', hairStyle: 'short', outfit: 'uniform', outfitColor: '#3f4d5c', accent: '#c9892f', build: 'avg', glasses: false, age: 'adult', pose: 'stand', extra: 'none' };
const FACE = { s: 0, se: 45, e: 90, ne: 135, n: 180, nw: -135, w: -90, sw: -45 };
const FACE_ALIAS = { south: 's', north: 'n', east: 'e', west: 'w' };
const _spr = new Map();

function normLook(look) { return Object.assign({}, DEF_LOOK, look || {}); }
function lookKey(l) { return [l.skin, l.hair, l.hairStyle, l.outfit, l.outfitColor, l.accent, l.build, l.glasses ? 1 : 0, l.age, l.extra].join('|'); }

/* ---------------------------------------------------------------- identity (signature details per NPC) */
const ch_ids = new WeakMap();
function ch_idOf(look) {
  if (!look || typeof look !== 'object') return '';
  if (look._id) return look._id;
  let id = ch_ids.get(look); if (id !== undefined) return id;
  id = '';
  try { const gd = typeof window !== 'undefined' && window.GD; if (gd && gd.npcs) for (const k in gd.npcs) if (gd.npcs[k] && gd.npcs[k].look === look) { id = k; break; } if (!id && gd && gd.playerLook === look) id = 'player'; } catch (e) { /* ignore */ }
  ch_ids.set(look, id); return id;
}

/* ---------------------------------------------------------------- small vector kit (3D arrays) */
const v3 = (a, y, f) => [a, y, f];
const vAdd = (p, q) => [p[0] + q[0], p[1] + q[1], p[2] + q[2]];
const vSub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
const vMul = (p, k) => [p[0] * k, p[1] * k, p[2] * k];
const vDot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
const vLen = (p) => Math.hypot(p[0], p[1], p[2]);
const vNorm = (p) => { const l = vLen(p) || 1; return [p[0] / l, p[1] / l, p[2] / l]; };
const vCross = (p, q) => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
const vLerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
function ch_ik(A, T, L1, L2, hint) {
  let d = vSub(T, A), dist = vLen(d); const mx = (L1 + L2) * .995, mn = Math.abs(L1 - L2) + .5;
  if (dist > mx) { d = vMul(d, mx / dist); dist = mx; T = vAdd(A, d); } else if (dist < mn) { d = vMul(vNorm(d), mn); dist = mn; T = vAdd(A, d); }
  const u = vMul(d, 1 / dist), x = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist), h = Math.sqrt(Math.max(0, L1 * L1 - x * x));
  let n = vSub(hint, vMul(u, vDot(hint, u))); if (vLen(n) < 1e-3) n = [0, 0, 1]; n = vNorm(n);
  return [vAdd(vAdd(A, vMul(u, x)), vMul(n, h)), T];
}

/* ---------------------------------------------------------------- paint kit */
const ch_tc = new Map();
function ch_tones(c) {
  c = C(c); const k = (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0); let t = ch_tc.get(k); if (t) return t;
  const sh = mix(mul(c, .38), [28, 38, 72], .32), lt = mix(mul(c, 1.24), [255, 206, 150], .3);
  t = { base: c, sh, core: mix(sh, [12, 10, 22], .28), ref: mix(sh, [84, 124, 138], .3), mid: mix(c, sh, .3), lt, hi: mix(lt, [255, 240, 214], .4) };
  ch_tc.set(k, t); return t;
}
function ch_tone(c, t) { const T = ch_tones(c); return t < .5 ? mix(T.sh, T.base, t * 2) : mix(T.base, T.lt, (t - .5) * 2); }
function ch_grad(g, x0, y0, x1, y1, c) {   // (x0,y0) = shadow side, (x1,y1) = lit side
  const T = ch_tones(c), gr = g.createLinearGradient(x0, y0, x1, y1);
  gr.addColorStop(0, css(T.ref)); gr.addColorStop(.17, css(T.core)); gr.addColorStop(.4, css(T.mid)); gr.addColorStop(.62, css(T.base)); gr.addColorStop(.87, css(T.lt)); gr.addColorStop(1, css(mix(T.lt, T.base, .35)));
  return gr;
}
function ch_path(g, P) {   // smooth closed path through polygon midpoints
  const n = P.length; if (n < 3) return; g.beginPath(); const a = P[n - 1], b = P[0];
  g.moveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
  for (let i = 0; i < n; i++) { const p = P[i], q = P[(i + 1) % n]; g.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
  g.closePath();
}
function ch_poly(g, P) { g.beginPath(); g.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) g.lineTo(P[i][0], P[i][1]); g.closePath(); }
function ch_curve(g, P) {  // smooth open polyline
  g.beginPath(); g.moveTo(P[0][0], P[0][1]);
  if (P.length === 2) { g.lineTo(P[1][0], P[1][1]); return; }
  for (let i = 1; i < P.length - 1; i++) { const p = P[i], q = P[i + 1]; g.quadraticCurveTo(p[0], p[1], i === P.length - 2 ? q[0] : (p[0] + q[0]) / 2, i === P.length - 2 ? q[1] : (p[1] + q[1]) / 2); }
}
function ch_bb(P) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of P) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; } return [x0, y0, x1, y1]; }
function ch_hull(P) {
  const pts = P.map(p => [p[0], p[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]); if (pts.length < 3) return pts;
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  up.pop(); lo.pop(); return lo.concat(up);
}
/* shaded fill of a polygon: gradient across (perpendicular to `ax` direction, oriented to the light) + brush strokes */
function ch_fill(g, r, P, col, o) {
  o = o || {};
  const bb = ch_bb(P), cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2, w = bb[2] - bb[0], h = bb[3] - bb[1];
  let ax = o.ax || [0, 1]; const al = Math.hypot(ax[0], ax[1]) || 1; ax = [ax[0] / al, ax[1] / al];
  let nx = -ax[1], ny = ax[0]; if (nx * CH_LX + ny * CH_LY < 0) { nx = -nx; ny = -ny; }
  const R = (Math.abs(nx) * w + Math.abs(ny) * h) * .5 + .5, sx = o.sx || 0;
  const gx0 = cx - nx * R + sx, gy0 = cy - ny * R, gx1 = cx + nx * R + sx, gy1 = cy + ny * R;
  g.save(); (o.sharp ? ch_poly : ch_path)(g, P);
  g.fillStyle = ch_grad(g, gx0, gy0, gx1, gy1, col); g.fill();
  if (o.flat) { g.globalAlpha = o.flat; g.fillStyle = css(C(col)); g.fill(); g.globalAlpha = 1; }
  g.clip();
  if (o.top !== undefined) {   // vertical light falloff / occlusion
    const vg = g.createLinearGradient(0, bb[1], 0, bb[3]); vg.addColorStop(0, o.top > 0 ? 'rgba(255,226,180,' + o.top + ')' : 'rgba(0,0,0,0)'); vg.addColorStop(.5, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(14,14,34,' + (o.bot || 0) + ')');
    g.fillStyle = vg; g.fillRect(bb[0] - 1, bb[1] - 1, w + 2, h + 2);
  }
  const n = o.n === undefined ? Math.min(40, Math.max(3, (w * h) / 40)) : o.n, sw = o.sw || 1.4, sl = o.sl || Math.max(3, Math.min(w, h) * .9), jv = o.jv === undefined ? .07 : o.jv;
  const dl = (gx1 - gx0) * (gx1 - gx0) + (gy1 - gy0) * (gy1 - gy0) || 1;
  g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = bb[0] + r() * w, y = bb[1] + r() * h, t = clamp(((x - gx0) * (gx1 - gx0) + (y - gy0) * (gy1 - gy0)) / dl, 0, 1);
    const a = Math.atan2(ax[1], ax[0]) + (r() - .5) * .5, L = sl * (.4 + r() * .7), dx = Math.cos(a) * L * .5, dy = Math.sin(a) * L * .5;
    let cc = ch_tone(col, clamp(t * 1.05 - .02 + (r() - .5) * .16, 0, 1)); cc = jit(cc, r, jv);
    g.strokeStyle = css(cc, .22 + r() * .3); g.lineWidth = sw * (.6 + r() * .8);
    g.beginPath(); g.moveTo(x - dx, y - dy); g.quadraticCurveTo(x + (r() - .5) * L * .3, y + (r() - .5) * L * .3, x + dx, y + dy); g.stroke();
  }
  if (o.fx) o.fx(g);
  g.restore();
  if (o.ink !== false) { (o.sharp ? ch_poly : ch_path)(g, P); g.strokeStyle = css(o.inkc || INK, o.inka === undefined ? .62 : o.inka); g.lineWidth = o.inkw || .55; g.lineJoin = 'round'; g.stroke(); }
}
function ch_limbOutline(P, R) {
  const n = P.length, Lf = [], Rt = [], dirs = [];
  for (let i = 0; i < n; i++) {
    let dx, dy;
    if (i === 0) { dx = P[1][0] - P[0][0]; dy = P[1][1] - P[0][1]; }
    else if (i === n - 1) { dx = P[i][0] - P[i - 1][0]; dy = P[i][1] - P[i - 1][1]; }
    else { const l1 = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]) || 1, l2 = Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]) || 1; dx = (P[i][0] - P[i - 1][0]) / l1 + (P[i + 1][0] - P[i][0]) / l2; dy = (P[i][1] - P[i - 1][1]) / l1 + (P[i + 1][1] - P[i][1]) / l2; }
    const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; dirs.push([dx, dy]);
    Lf.push([P[i][0] - dy * R[i], P[i][1] + dx * R[i]]); Rt.push([P[i][0] + dy * R[i], P[i][1] - dx * R[i]]);
  }
  const out = Lf.slice(), e = P[n - 1], de = dirs[n - 1], re = R[n - 1];
  for (let k = 1; k < 5; k++) { const t = k / 5 * Math.PI, c = Math.cos(t), s = Math.sin(t); out.push([e[0] + (-de[1] * c + de[0] * s) * re, e[1] + (de[0] * c + de[1] * s) * re]); }
  for (let i = n - 1; i >= 0; i--) out.push(Rt[i]);
  const b = P[0], db = dirs[0], rb = R[0];
  for (let k = 1; k < 5; k++) { const t = k / 5 * Math.PI, c = Math.cos(t), s = Math.sin(t); out.push([b[0] + (db[1] * c - db[0] * s) * rb, b[1] + (-db[0] * c - db[1] * s) * rb]); }
  return out;
}
function ch_limb(g, r, P, R, col, o) {
  const out = ch_limbOutline(P, R), a = P[0], b = P[P.length - 1];
  ch_fill(g, r, out, col, Object.assign({ ax: [b[0] - a[0], b[1] - a[1]], n: Math.round(4 + P.length * 3), sw: 1.2 }, o));
  return out;
}
/* a cloth fold / crease: dark groove + light ridge towards the light */
function ch_fold(g, P, w, col, a) {
  a = a === undefined ? 1 : a; g.lineCap = 'round';
  ch_curve(g, P); g.strokeStyle = css(ch_tones(col).core, .5 * a); g.lineWidth = w; g.stroke();
  g.save(); g.translate(CH_LX * w * .7, CH_LY * w * .7); ch_curve(g, P); g.strokeStyle = css(ch_tones(col).lt, .38 * a); g.lineWidth = w * .55; g.stroke(); g.restore();
}
function ch_dot(g, x, y, rad, col, a) { g.fillStyle = css(col, a === undefined ? 1 : a); g.beginPath(); g.arc(x, y, rad, 0, 6.2832); g.fill(); }
function ch_stroke(g, P, w, col, a) { g.lineCap = 'round'; g.lineJoin = 'round'; ch_curve(g, P); g.strokeStyle = css(col, a === undefined ? 1 : a); g.lineWidth = w; g.stroke(); }
function ch_button(g, x, y, rad, col) { const T = ch_tones(col); ch_dot(g, x, y, rad * 1.25, T.core, .7); ch_dot(g, x, y, rad, T.base); ch_dot(g, x + rad * .35, y - rad * .35, rad * .4, T.hi, .9); }

/* shared brush texture (light/dark strokes, applied source-atop) */
let ch_texC = null;
function ch_tex() {
  if (ch_texC) return ch_texC;
  const c = mk(160, 160), g = ctx2(c), r = RNG(4242); g.lineCap = 'round';
  for (let i = 0; i < 520; i++) {
    const x = r() * 160, y = r() * 160, a = 1.35 + (r() - .5) * .9, L = 3 + r() * 9, lt = r() < .5;
    g.strokeStyle = lt ? 'rgba(255,236,200,' + (.025 + r() * .06) + ')' : 'rgba(10,8,24,' + (.03 + r() * .08) + ')'; g.lineWidth = .8 + r() * 2.2;
    for (const ox of [-160, 0, 160]) for (const oy of [-160, 0, 160]) { if (Math.abs(x + ox - 80) > 100 || Math.abs(y + oy - 80) > 100) continue; g.beginPath(); g.moveTo(x + ox - Math.cos(a) * L / 2, y + oy - Math.sin(a) * L / 2); g.lineTo(x + ox + Math.cos(a) * L / 2, y + oy + Math.sin(a) * L / 2); g.stroke(); }
  }
  return (ch_texC = c);
}

/* ---------------------------------------------------------------- body proportions */
function ch_body(L) {
  const hs = L.hairStyle || 'short', fem = L.fem !== undefined ? !!L.fem : /^(bun|bob|braid|long)$/.test(hs);
  const teen = L.age === 'teen', old = L.age === 'old', b = L.build === 'heavy' ? 2 : L.build === 'slim' ? 0 : 1;
  const W3 = (s, m, h) => b === 0 ? s : b === 1 ? m : h;
  const H = (fem ? 166 : 177) * (teen ? .955 : old ? .975 : 1), headH = H / (teen ? 7.0 : old ? 7.3 : 7.5);
  const tf = teen ? .93 : 1, ff = fem ? .9 : 1;
  const B = {
    H, headH, fem, teen, old, b,
    hipY: H * .52, ankY: H * .045, neckY: H - headH - H * .022,
    thighL: H * .245, shinL: H * .232, upL: H * .172, foreL: H * .152, handL: H * .1, footL: H * .148,
    hipJ: H * .05 * W3(.92, 1, 1.15) * (fem ? 1.06 : 1),
    shW: H * (fem ? .102 : .116) * W3(.95, 1, 1.08) * tf,
    chestW: H * (fem ? .086 : .097) * W3(.9, 1, 1.22) * tf, chestD: H * (fem ? .066 : .062) * W3(.88, 1, 1.32),
    waistW: H * (fem ? .072 : .084) * W3(.9, 1, 1.45) * tf, waistD: H * .054 * W3(.9, 1, 1.62), belly: W3(0, .003, .03) * H,
    hipW: H * (fem ? .1 : .089) * W3(.9, 1, 1.25) * tf, hipD: H * .06 * W3(.92, 1, 1.28),
    rThigh: H * .048 * W3(.86, 1, 1.3), rKnee: H * .029 * W3(.9, 1, 1.15), rCalf: H * .032 * W3(.86, 1, 1.22), rAnk: H * .019,
    rUp: H * .029 * W3(.86, 1, 1.32) * ff, rElb: H * .022 * W3(.9, 1, 1.2) * ff, rFore: H * .024 * W3(.88, 1, 1.25) * ff, rWr: H * .016 * ff,
    rNeck: H * .03 * W3(.9, 1, 1.28) * ff
  };
  B.shY = B.neckY - H * .03; B.hs = B.shY - B.hipY;
  return B;
}

/* ---------------------------------------------------------------- outfit palette */
function ch_outfit(L, B, id) {
  const o = L.outfit || 'uniform', oc = C(L.outfitColor), ac = C(L.accent), fem = B.fem;
  const darkTr = [44, 42, 46], tweed = [64, 58, 54];
  const P = { o, top: oc, sleeve: oc, pants: mul(oc, .7), shirt: [218, 212, 196], shoe: [32, 26, 26], shoeHi: .7, skirt: null, skirtH: 0, hem: -.03, long: 0, rolled: false, cuff: null, sock: null };
  if (o === 'uniform') { P.pants = mix(mul(oc, .72), [30, 30, 40], .2); P.cuff = P.shirt; if (fem && B.teen) { P.skirt = P.pants; P.skirtH = .29; P.pleats = true; P.sock = [40, 38, 44]; } }
  else if (o === 'coat') { P.pants = darkTr; P.long = .2; P.shirt = mix(ac, [60, 56, 54], .4); P.cuff = null; }
  else if (o === 'apron') { P.top = mix(mul(ac, .7), [70, 60, 60], .35); P.sleeve = P.top; P.pants = P.top; P.skirt = P.top; P.skirtH = .17; P.rolled = true; P.apron = oc; P.shoe = [40, 32, 30]; P.sock = mul(C(L.skin), .78); }
  else if (o === 'overalls') { P.top = mix(oc, [190, 170, 140], .55); P.sleeve = P.top; P.pants = oc; P.bib = oc; P.rolled = true; P.shirt = P.top; P.shoe = [58, 40, 30]; P.boot = true; }
  else if (o === 'suit') { P.pants = mul(oc, .92); P.cuff = P.shirt; if (fem) { P.skirt = P.pants; P.skirtH = .25; P.sock = mix(C(L.skin), [60, 50, 50], .35); } }
  else if (o === 'tracksuit') { P.pants = mul(oc, .9); P.shoe = [214, 210, 200]; P.shoeHi = .9; P.trainer = true; P.stripe = ac; P.hem = .0; }
  else if (o === 'cardigan') { P.shirt = mix(ac, [228, 220, 200], .78); P.pants = tweed; P.hem = -.045; P.knit = true; P.shoe = [62, 44, 34]; if (fem) { P.skirt = mix(oc, [50, 50, 56], .55); P.skirtH = B.old ? .17 : .25; P.sock = mix(C(L.skin), [70, 60, 60], .45); } }
  else if (o === 'labcoat') { P.long = .3; P.pants = darkTr; P.shirt = [150, 160, 168]; P.shoe = [58, 42, 32]; if (fem) { P.skirt = [70, 64, 70]; P.skirtH = .2; P.sock = mix(C(L.skin), [60, 50, 50], .4); P.pants = P.skirt; } }
  else if (o === 'shirtsleeves') { P.shirt = oc; P.pants = [52, 48, 50]; P.rolled = true; P.braces = ac; P.hem = .085; }
  return P;
}

/* ---------------------------------------------------------------- arm / hand configuration */
function ch_armPlan(L, B, id, pose, walk, idleB, hsh) {
  const ex = L.extra || 'none';
  const sigs = { fenwick: 'clasp', lemmy: 'behind', rhea: 'crossed', gregor: 'behind', hob: 'clasp', brune: 'hipL', tomas: 'lap', wren: 'relax', player: 'relax', vasha: 'smoke', nadia: 'smoke', dov: 'smokeLow', anka: 'smokeSit' };
  let plan = sigs[id] || ['relax', 'relax', 'pockets', 'behind', 'relax', 'crossed'][hsh % 6];
  if (L.outfit === 'apron' && plan === 'pockets') plan = 'hipL';
  if (ex === 'cigarette') plan = pose === 'sit' || pose === 'wheelchair' ? 'smokeSit' : (id === 'dov' ? 'smokeLow' : 'smoke');
  else if (ex === 'clipboard') plan = pose === 'sit' || pose === 'wheelchair' ? 'clipLap' : 'clipChest';
  else if (ex === 'book') plan = pose === 'sit' || pose === 'wheelchair' ? 'bookLap' : 'bookChest';
  else if (ex === 'broom') plan = pose === 'lean' ? 'broomLean' : 'broom';
  else if (ex === 'ladle') plan = 'ladle';
  else if (ex === 'mic') plan = 'mic';
  else if (ex === 'megaphone') plan = 'mega';
  else if (ex === 'rope') plan = 'rope';
  else if (pose === 'sit' || pose === 'wheelchair') plan = 'lap';
  if (pose === 'hang' || pose === 'lie') plan = pose;
  if (pose === 'slump' && /^(relax|pockets|crossed|clasp|hipL)$/.test(plan)) plan = 'slump';
  if (walk) {   // carried items keep their hold; free arms swing
    if (/^(relax|pockets|behind|crossed|clasp|hipL|lap|slump|smokeLow|smokeSit)$/.test(plan)) plan = 'swing';
    else if (plan === 'smoke') plan = 'swingSmoke';
    else if (plan === 'broomLean') plan = 'broom';
  }
  if (idleB && plan === 'relax') plan = 'relaxB';
  return plan;
}

/* ---------------------------------------------------------------- the model */
function ch_model(L, id, yawDeg, pose, frame, idleB) {
  const B = ch_body(L), H = B.H, OF = ch_outfit(L, B, id), hsh = hashStr(lookKey(L) + id);
  const walk = frame > 0 && (pose === 'stand' || pose === 'lean' || pose === 'slump');
  if (walk) pose = 'stand';
  const sit = pose === 'sit' || pose === 'wheelchair', wheel = pose === 'wheelchair', hang = pose === 'hang', lean = pose === 'lean', slump = pose === 'slump', lie = pose === 'lie';
  const yaw = yawDeg * Math.PI / 180, sy = Math.sin(yaw), cy = Math.cos(yaw);
  const ws = (hsh & 1) ? 1 : -1;            // weight-bearing side
  const ph = walk ? (frame - 1) * Math.PI / 2 : 0;
  // ---- pelvis & spine
  let pel = [0, B.hipY - .8, 0], pitch = 0, stoop = 0, twist = 0, roll = 0, headTurn = 0, headPitch = 0, headRoll = 0, lift = 0;
  const stride = H * (B.old ? .11 : .145);
  if (B.old) { stoop = .22; headPitch = -.16; pel[1] -= 1.2; }
  if (walk) {
    pel = [1.5 * Math.sin(ph), B.hipY - 1.4 - H * .024 * Math.cos(ph) * Math.cos(ph), 0];
    pitch = .05; twist = -.16 * Math.cos(ph);
  } else if (sit) {
    const seat = H * (wheel ? .285 : .265); pel = [0, seat + H * .05, -3]; pitch = -.05;
    if (/^(book|clip)/.test(L.extra || '') || L.extra === 'book' || L.extra === 'clipboard') { pitch = .1; headPitch = .3; }
  } else if (lean) { pel = [ws * 1.2, B.hipY - 1.8, 5]; pitch = -.13; headPitch += .1; }
  else if (slump) { pel = [0, B.hipY - 2.2, 0]; pitch = .2; stoop += .25; headPitch = .55; }
  else if (hang) { lift = 34; pel = [0, B.hipY + lift, 0]; pitch = .03; headPitch = .5; headRoll = .38; roll = .05; }
  else { pel = [ws * 1.6, B.hipY - .9, 0]; roll = -ws * .025; }
  if (idleB && !walk && !hang) { headTurn = (hsh & 2 ? .2 : -.2); pel[0] -= ws * .8; }
  if (lie) { headRoll = .22; }
  // upper-body transform (relative to pelvis: [lat, h, fwd])
  const hs = B.hs;
  const ub = (p) => {
    const t = twist * clamp(p[1] / hs, 0, 1.2), ct = Math.cos(t), st = Math.sin(t);
    let a = p[0] * ct + p[2] * st, f = -p[0] * st + p[2] * ct, h = p[1];
    const ang = pitch + stoop * Math.pow(clamp(h / hs, 0, 1.3), 1.6), ca = Math.cos(ang), sa = Math.sin(ang);
    const y = h * ca - f * sa; f = h * sa + f * ca; a += h * Math.sin(roll);
    return [pel[0] + a, pel[1] + y, pel[2] + f];
  };
  // ---- legs
  const legs = [];
  for (const s of [1, -1]) {
    const hip = [pel[0] + s * B.hipJ, pel[1] - 1, pel[2]];
    let ank, footDir = [s * .12, 0, 1], fp = 0, hint = [s * .08, 0, 1];
    if (walk) {
      const fpos = s * stride * Math.cos(ph), lft = Math.max(0, -s * Math.sin(ph));
      fp = fpos > stride * .5 ? .22 : fpos < -stride * .5 ? -.38 : lft > .5 ? -.25 : 0;
      ank = [s * (B.hipJ - .5), B.ankY + lft * H * .075 + (fp < 0 ? B.footL * .22 : 0), fpos + (lft > .5 ? 2 : 0)];
    } else if (sit) {
      const knee = [s * (B.hipJ + 1.2), pel[1] + .5, pel[2] + B.thighL * .97];
      ank = wheel ? [s * (B.hipJ + .5), H * .085, knee[2] + 5] : [s * (B.hipJ + 1.6), B.ankY, knee[2] + 4 + (s === ws ? 5 : 0)];
      legs.push({ s, hip, knee, ank, footDir, fp: wheel ? .1 : 0 }); continue;
    } else if (lean) {
      ank = s === ws ? [s * (B.hipJ - .5), B.ankY, 10] : [ws * (B.hipJ + .5), B.ankY + 1.2, 17]; if (s !== ws) { fp = -.55; footDir = [-s * .25, 0, 1]; }
    } else if (hang) { ank = [s * (B.hipJ - 1.8), B.ankY + lift + 2, 2]; fp = -1.15; hint = [0, 0, 1]; }
    else if (slump) { ank = [s * (B.hipJ + 1.5), B.ankY, 3]; }
    else if (lie) { ank = [s * (B.hipJ + 3.5), B.ankY, 0]; fp = 0; }
    else { ank = s === ws ? [s * (B.hipJ - 1), B.ankY, 0] : [s * (B.hipJ + 3.5), B.ankY + .4, 7]; if (B.old) ank[2] += 3; }
    const kj = ch_ik(hip, ank, B.thighL, B.shinL, hint);
    legs.push({ s, hip, knee: kj[0], ank: kj[1], footDir: vNorm(footDir), fp });
  }
  // ---- shoulders, neck, head
  const shoulder = (s) => ub([s * B.shW, hs, B.old || slump ? 1.5 : 0]);
  const neckB = ub([0, B.neckY - B.hipY, -1.2]);
  const headC0 = ub([0, B.neckY - B.hipY + B.headH * .56, 1.2]);
  const headPitchT = headPitch + pitch + stoop * .9 - (B.old ? .08 : 0);
  const head = { c: headC0, yaw: yaw + headTurn + twist, pitch: headPitch, roll: headRoll + roll, hh: B.headH * .5, hw: B.headH * .37 * (B.teen ? 1.02 : 1) * (B.b === 2 ? 1.06 : 1), hd: B.headH * .44 };
  // head pushed forward by stoop/slump
  if (B.old || slump) head.c = [head.c[0], head.c[1] - (slump ? 4 : 1.5), head.c[2] + (slump ? 4 : 2.5)];
  // ---- arms
  const plan = ch_armPlan(L, B, id, pose, walk, idleB, hsh);
  const arms = {}, chestF = B.chestD + B.belly * .3;
  const shY = pel[1] + hs, hipY = pel[1];
  const A = (s, t, hint, hand, o) => { arms[s] = Object.assign({ t, hint, hand: hand || 'open' }, o || {}); };
  const relax = (s, k) => A(s, [pel[0] + s * (B.hipW + 3.6 + (k || 0)), hipY - H * .025, 3.5 + (B.old ? 3 : 0)], [s * .3, 0, -1], 'open');
  const swing = (s, amt) => { const sh = shoulder(s), Lr = (B.upL + B.foreL) * (amt > 0 ? .9 : .97), an = amt * .5; A(s, [sh[0] + s * 3.5, sh[1] - Lr * Math.cos(an), sh[2] + Lr * Math.sin(an) + 3], [s * .2, 0, -1], 'open'); };
  const swingAmt = (s) => -s * Math.cos(ph);
  let item = null;
  switch (plan) {
    case 'swing': swing(1, swingAmt(1)); swing(-1, swingAmt(-1)); break;
    case 'swingSmoke': swing(-1, swingAmt(-1)); A(1, [pel[0] + B.hipW + 1, hipY + H * .02, 12], [1, 0, -.5], 'pinch'); item = 'cig'; break;
    case 'relax': relax(1); relax(-1); break;
    case 'relaxB': relax(1, -1.5); A(-1, [pel[0] - B.hipW - 2, hipY - H * .01, 6], [-.3, 0, -1], 'open'); break;
    case 'pockets': for (const s of [1, -1]) A(s, [pel[0] + s * B.hipW * .82, hipY - H * .012, B.hipD * .55], [s * 1, 0, -.7], 'hidden'); break;
    case 'behind': for (const s of [1, -1]) A(s, [pel[0] + s * 3, hipY + H * .015, -B.hipD - 5], [s * .7, 0, -1], 'open'); break;
    case 'crossed': A(1, [-B.shW * .62, shY - H * .135, chestF + 6.5], [1, -.4, .1], 'fist', { bias: .8 }); A(-1, [B.shW * .6, shY - H * .118, chestF + 4], [-1, -.4, .1], 'fist'); break;
    case 'clasp': for (const s of [1, -1]) A(s, [pel[0] + s * 1.5, hipY - H * .02, B.hipD + 5], [s * .6, 0, -.6], s > 0 ? 'fist' : 'open', { bias: s > 0 ? .6 : 0 }); break;
    case 'hipL': relax(1); A(-1, [pel[0] - B.waistW - 2, hipY + H * .085, -1], [-1, .25, -.6], 'fist'); break;
    case 'lap': for (const s of [1, -1]) A(s, [pel[0] + s * (B.hipW * .55), pel[1] + H * .06, pel[2] + B.thighL * .6], [s * .5, 0, -1], 'open'); break;
    case 'slump': for (const s of [1, -1]) A(s, [pel[0] + s * (B.shW - 2), hipY - H * .01, 13], [s * .3, 0, -1], 'open'); break;
    case 'hang': for (const s of [1, -1]) { const sh = shoulder(s); A(s, [sh[0] + s * 1.5, sh[1] - (B.upL + B.foreL) * .98, sh[2] + 2], [s * .2, 0, -1], 'open'); } break;
    case 'lie': for (const s of [1, -1]) A(s, [pel[0] + s * (B.hipW + 11), hipY - H * .02, 0], [s * .5, 0, -1], 'open'); break;
    case 'smoke': {   // classic smoker: right hand raised by the mouth, left forearm across under the elbow
      const hc = head.c; A(1, [hc[0] + B.headH * .95, hc[1] - B.headH * .72, hc[2] + B.headH * .3], [1, -1, .1], 'pinch', { up: 1, bias: 1 });
      A(-1, [pel[0] + B.shW * .35, shY - H * .145, chestF + 4.5], [-1, -.5, .1], 'fist'); item = 'cig'; break; }
    case 'smokeLow': relax(-1); A(-1, [pel[0] - B.hipW * .82, hipY - H * .012, B.hipD * .55], [-1, 0, -.7], 'hidden'); A(1, [pel[0] + B.hipW + 3, hipY - H * .015, 7], [1, 0, -1], 'pinch'); item = 'cig'; break;
    case 'smokeSit': A(1, [pel[0] + B.shW * .75, shY - H * .03, pel[2] + 16], [1, -1, -.2], 'pinch', { up: 1, bias: 1 }); A(-1, [pel[0] - B.hipW * .5, pel[1] + H * .06, pel[2] + B.thighL * .62], [-.5, 0, -1], 'open'); item = 'cig'; break;
    case 'clipChest': A(-1, [pel[0] - 2, shY - H * .175, chestF + 6], [-1, -.4, -.2], 'open', { bias: 1.2 }); A(1, [pel[0] + 4, shY - H * .15, chestF + 11], [1, -.5, -.2], 'pinch', { bias: 1.6 }); item = 'clip'; break;
    case 'clipLap': case 'bookLap': for (const s of [1, -1]) A(s, [pel[0] + s * 7, pel[1] + H * .085, pel[2] + B.thighL * .62], [s * .6, 0, -1], 'open', { bias: 1.5 }); item = plan === 'clipLap' ? 'clipLap' : 'bookLap'; break;
    case 'bookChest': A(-1, [pel[0] - 1, shY - H * .16, chestF + 5.5], [-1, -.4, -.1], 'open', { bias: 1.4 }); A(1, [pel[0] + B.shW * .45, shY - H * .2, chestF + 6], [1, -.3, -.2], 'fist', { bias: .3 }); item = 'book'; break;
    case 'broom': A(1, [pel[0] + B.shW * .55, shY - H * .07, 13], [1, 0, -.8], 'fist', { bias: .8 }); A(-1, [pel[0] + B.shW * .25, hipY + H * .075, 15], [-1, 0, -.6], 'fist', { bias: 1.2 }); item = 'broom'; break;
    case 'broomLean': A(1, [pel[0] + 3, shY - H * .1, 24], [1, -.2, -.5], 'fist', { bias: 1.4 }); A(-1, [pel[0] + 1, shY - H * .085, 24], [-1, -.2, -.5], 'fist', { bias: 1.6 }); item = 'broomLean'; break;
    case 'ladle': A(1, [pel[0] + B.shW + 3, shY - H * .1, 11], [1, -.6, -.5], 'fist', { bias: 1 }); A(-1, [pel[0] - B.waistW - 2, hipY + H * .085, -1], [-1, .25, -.6], 'fist'); item = 'ladle'; break;
    case 'mic': A(1, [pel[0] + 5, shY - H * .05, chestF + 12], [1, -.5, -.3], 'fist', { bias: 1.4 }); relax(-1); item = 'mic'; break;
    case 'mega': A(1, [pel[0] + B.hipW + 4.5, hipY - H * .005, 6], [1, 0, -1], 'fist'); A(-1, [pel[0] - B.waistW - 2, hipY + H * .085, -1], [-1, .25, -.6], 'fist'); item = 'mega'; break;
    case 'rope': A(1, [pel[0] + B.hipW + 4, hipY - H * .01, 5], [1, 0, -1], 'fist'); relax(-1); item = 'rope'; break;
    default: relax(1); relax(-1);
  }
  const armJ = {};
  for (const s of [1, -1]) {
    const sh = shoulder(s), a = arms[s];
    const j = ch_ik(sh, a.t, B.upL, B.foreL, a.hint);
    armJ[s] = Object.assign({ s, sh, el: j[0], wr: j[1] }, a);
  }
  return { B, OF, L, id, yaw, sy, cy, pose, walk, sit, wheel, hang, lean, slump, lie, pel, ub, legs, armJ, head, neckB, plan, item, hsh, ws, lift, ph, frame };
}

/* ---------------------------------------------------------------- rendering */
function ch_render(L, id, yawDeg, pose, frame, idleB) {
  const M = ch_model(L, id, yawDeg, pose, frame, idleB);
  const { B, OF, yaw, pel, ub } = M, H = B.H, skin = C(L.skin), hairC = C(L.hair), accC = C(L.accent);
  const sY = Math.sin(yaw), cY = Math.cos(yaw);
  const V = (yw) => { const s = Math.sin(yw), c = Math.cos(yw); return { Rx: -c, Rd: s, Fx: s, Fd: c }; };
  const V0 = V(yaw);
  const P = (p, vv) => { vv = vv || V0; const d = p[0] * vv.Rd + p[2] * vv.Fd; return [p[0] * vv.Rx + p[2] * vv.Fx, -p[1] + d * CH_DK, d]; };
  const parts = [], post = [];
  let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
  const ext = (q, rad) => { rad = rad || 0; if (q[0] - rad < bx0) bx0 = q[0] - rad; if (q[0] + rad > bx1) bx1 = q[0] + rad; if (q[1] - rad < by0) by0 = q[1] - rad; if (q[1] + rad > by1) by1 = q[1] + rad; return q; };
  const PE = (p, rad, vv) => ext(P(p, vv), rad);
  const part = (d, fn) => parts.push({ d, fn });
  const r = RNG(hsh32(M));
  function hsh32(m) { return (m.hsh ^ Math.imul(m.frame + 3, 2654435761) ^ (Math.round(yawDeg) * 7919)) >>> 0; }
  const torsoD = P(pel)[2];
  const standing = !M.sit && !M.lie;

  /* ---------- torso sections (relative to pelvis) */
  const b2 = B.b === 2, fem = B.fem;
  const secs = [
    { h: -H * .048, w: B.hipW * .9, d: B.hipD * .88, f: 0 },
    { h: 0, w: B.hipW, d: B.hipD, f: 0 },
    { h: H * .05, w: (B.hipW + B.waistW) * .5 + (b2 ? 1.5 : 0), d: (B.hipD + B.waistD) * .5, f: B.belly * .6 },
    { h: H * .1, w: B.waistW, d: B.waistD, f: B.belly },
    { h: H * .16, w: B.chestW * .96, d: B.chestD, f: B.belly * .4 + (fem ? H * .008 : 0) },
    { h: H * .215, w: B.chestW, d: B.chestD * 1.02, f: fem ? H * .012 : H * .004 },
    { h: B.hs - H * .012, w: B.shW * .96 + 1, d: B.chestD * .82, f: 0 },
    { h: B.hs + H * .016, w: B.shW * .64, d: B.chestD * .62, f: -1 },
    { h: B.neckY - B.hipY - 1, w: B.rNeck * 1.18, d: B.rNeck * 1.12, f: -1.2 }
  ];
  const secAt = (h) => {
    if (h <= secs[0].h) return secs[0]; for (let i = 1; i < secs.length; i++) if (h <= secs[i].h) { const a = secs[i - 1], b = secs[i], t = (h - a.h) / (b.h - a.h); return { h, w: lerp(a.w, b.w, t), d: lerp(a.d, b.d, t), f: lerp(a.f, b.f, t) }; }
    return secs[secs.length - 1];
  };
  const twistAt = (h) => M.ub === ub ? 0 : 0;
  // surface point of the torso (phi: 0 = front centre, + towards character's right), with out-offset
  const surf = (phi, h, out) => { const s = secAt(h), k = 1 + (out || 0) / Math.max(s.w, 1); return ub([s.w * k * Math.sin(phi), h, s.f + s.d * k * Math.cos(phi)]); };
  const sTw = (h) => { const tw = (M.walk ? -.16 * Math.cos(M.ph) : 0) * clamp(h / B.hs, 0, 1.2); return yaw + tw; };
  const visT = (phi, h) => { const s = secAt(h), yw = sTw(h), na = Math.sin(phi) / s.w, nf = Math.cos(phi) / s.d; return na * Math.sin(yw) + nf * Math.cos(yw); };
  const PS = (phi, h, out) => P(surf(phi, h, out));
  // silhouette of the torso between heights
  const silAt = (h, extra) => {
    const s = secAt(h), c = P(ub([0, h, s.f])), yw = sTw(h), Rx = -Math.cos(yw), Fx = Math.sin(yw);
    const w = s.w + (extra || 0), d = s.d + (extra || 0) * .8, rho = Math.sqrt(w * Rx * w * Rx + d * Fx * d * Fx);
    return [c[0], c[1], rho];
  };
  const torsoPoly = (h0, h1, extra, n) => {
    const hsList = [h0]; for (const s of secs) if (s.h > h0 + .5 && s.h < h1 - .5) hsList.push(s.h); hsList.push(h1);
    if (n) { for (let i = 1; i < n; i++) hsList.push(h0 + (h1 - h0) * i / n); hsList.sort((a, b) => a - b); }
    const right = [], left = [];
    for (const h of hsList) { const q = silAt(h, extra); right.push(ext([q[0] + q[2], q[1]])); left.push(ext([q[0] - q[2], q[1]])); }
    return right.concat(left.reverse());
  };

  /* ---------- LEGS */
  const trouserR = B.fem && OF.skirt ? 0 : (OF.o === 'overalls' || OF.o === 'coat' ? 1.6 : 1.1);
  const legBare = !!OF.skirt;
  const legCol = legBare ? (OF.sock || mix(skin, [60, 50, 50], .3)) : C(OF.pants);
  const drawFoot = (g, lg) => {
    const fd = lg.footDir, fwd = [fd[0], 0, fd[2]], side = vNorm(vCross([0, 1, 0], fwd)), fp = lg.fp;
    const up = [0, 1, 0], ca = Math.cos(fp), sa = Math.sin(fp);
    const dir = vNorm([fwd[0] * ca, sa, fwd[2] * ca]), upv = vNorm(vCross(dir, side)), upn = upv[1] < 0 ? vMul(upv, -1) : upv;
    const A = lg.ank, fl = B.footL * (OF.boot ? 1.05 : 1), fw = H * (OF.trainer ? .028 : .025), heelP = vAdd(A, vMul(dir, -H * .028));
    const pt = (l, s, u) => vAdd(vAdd(vAdd(heelP, vMul(dir, l)), vMul(side, s)), vMul(upn, u));
    const base = -B.ankY * .95, pts = [];
    for (const s of [-1, 1]) { pts.push(pt(0, s * fw * .8, base), pt(fl * .72, s * fw, base), pt(fl, s * fw * .55, base + 1.6), pt(fl * .95, s * fw * .5, base + 4.2), pt(fl * .45, s * fw * .8, base + 6.5), pt(0, s * fw * .75, base + 5.2), pt(H * .02, s * fw * .55, OF.boot ? 9 : 4)); }
    const sp = pts.map(p => PE(p, .5)), hull = ch_hull(sp), shoe = C(OF.shoe);
    ch_fill(g, r, hull, shoe, { ax: [1, 0], n: 3, sw: 1, inka: .8, inkw: .6 });
    // sole & toe shine
    const s0 = P(pt(0, 0, base)), s1 = P(pt(fl, 0, base + .6)), toe = P(pt(fl * .82, fw * .25, base + 4));
    ch_stroke(g, [[s0[0], s0[1]], [s1[0], s1[1]]], 1.1, OF.trainer ? [240, 236, 226] : mul(shoe, .5), .85);
    ch_dot(g, toe[0], toe[1], 1, ch_tones(shoe).hi, OF.shoeHi * .7);
    if (OF.trainer && OF.stripe) { const a = P(pt(fl * .3, fw * .9 * (V0.Rd * side[0] + V0.Fd * side[2] > 0 ? 1 : -1), base + 2.5)), b = P(pt(fl * .65, fw * .9 * (V0.Rd * side[0] + V0.Fd * side[2] > 0 ? 1 : -1), base + 3.2)); ch_stroke(g, [[a[0], a[1]], [b[0], b[1]]], 1, OF.stripe, .9); }
  };
  const drawLeg = (g, lg) => {
    const hp = P(lg.hip), kn = P(lg.knee), an = P(lg.ank), lifted = lg.ank[1] > B.ankY + 3 && !M.hang;
    ext(hp, 10); ext(an, 8);
    const calf = P(vLerp(lg.knee, lg.ank, .32)), tr = trouserR;
    const Rr = legBare ? [B.rThigh, B.rKnee, B.rCalf, B.rAnk] : [B.rThigh + tr + .6, B.rKnee + tr + 2.6, B.rCalf + tr + 1.6, B.rAnk + tr + 3.2];
    const knS = M.sit ? 1.12 : 1;
    const pts = [[hp[0], hp[1]], [kn[0], kn[1]], [calf[0], calf[1]], [an[0], an[1] - 1]];
    // foot first when it points away (heel nearer), else after
    const fwdD = lg.footDir[0] * V0.Rd + lg.footDir[2] * V0.Fd;
    if (fwdD < -.2) drawFoot(g, lg);
    const out = ch_limb(g, r, pts, [Rr[0], Rr[1] * knS, Rr[2], Rr[3]], legCol, {
      n: 9, sw: 1.3, top: 0, bot: .25, fx: (g2) => {
        if (legBare) { // stocking sheen down the shin
          ch_stroke(g2, [[kn[0] + 1, kn[1]], [an[0] + .8, an[1] - 3]], 1, ch_tones(legCol).lt, .35); return;
        }
        const pc = C(OF.pants), bend = Math.abs(Math.atan2(an[0] - kn[0], an[1] - kn[1]) - Math.atan2(kn[0] - hp[0], kn[1] - hp[1]));
        // knee creases (more when bent), ankle break, pressed crease line
        const kx = kn[0], ky = kn[1], kk = Math.min(1, .35 + bend * 1.4);
        ch_fold(g2, [[kx - Rr[1] * .9, ky - 2], [kx, ky - .5], [kx + Rr[1] * .8, ky - 2.6]], .9, pc, kk);
        ch_fold(g2, [[kx - Rr[1] * .7, ky + 2.2], [kx + Rr[1] * .2, ky + 1.2], [kx + Rr[1] * .7, ky + 2.8]], .7, pc, kk * .8);
        if (!lifted && !M.sit) { ch_fold(g2, [[an[0] - Rr[3], an[1] - 4.5], [an[0], an[1] - 3.2], [an[0] + Rr[3], an[1] - 5]], .8, pc, .9); ch_fold(g2, [[an[0] - Rr[3] * .8, an[1] - 8], [an[0] + Rr[3] * .7, an[1] - 7]], .6, pc, .6); }
        if (OF.o === 'suit' || OF.o === 'uniform') ch_stroke(g2, [[hp[0] + 1.2, hp[1] + 5], [kn[0] + 1.4, kn[1]], [an[0] + 1.2, an[1] - 4]], .5, ch_tones(pc).lt, .4);
        if (OF.stripe) { const side = (lg.s * V0.Rx) > 0 ? 1 : -1; ch_stroke(g2, [[hp[0] + side * Rr[0] * .82, hp[1] + 2], [kn[0] + side * Rr[1] * .8, kn[1]], [an[0] + side * Rr[3] * .75, an[1] - 2]], 1.1, OF.stripe, .85); }
        // crotch drag folds from the inner thigh
        ch_fold(g2, [[hp[0] - lg.s * V0.Rx * Rr[0] * .5, hp[1] + 3], [hp[0], hp[1] + 7.5]], .6, pc, .5);
      }
    });
    if (fwdD >= -.2) drawFoot(g, lg);
    return out;
  };
  for (const lg of M.legs) {
    const dd = (P(lg.hip)[2] + P(lg.knee)[2] + P(lg.ank)[2]) / 3;
    part(standing ? -100 + dd * .01 : (M.sit ? dd + 1 : dd), (g) => drawLeg(g, lg));
  }

  /* ---------- SKIRTS / LONG COAT TAILS (follow the knees) */
  const kneeSpread = () => { const kR = M.legs[0].knee, kL = M.legs[1].knee; return { w: Math.abs(kR[0] - kL[0]) * .5, d: Math.abs(kR[2] - kL[2]) * .5, cf: (kR[2] + kL[2]) * .5 - pel[2], ca: (kR[0] + kL[0]) * .5 - pel[0] }; };
  const drawTails = (g, col, hemY, wide, isCoat, openFront) => {
    // from waist (h = H*.08) down to absolute hemY
    const ks = kneeSpread(), hTop = H * .06, hBot = hemY - pel[1];
    const rows = 5, right = [], left = [], centers = [];
    for (let i = 0; i <= rows; i++) {
      const t = i / rows, h = lerp(hTop, hBot, t), s = secAt(Math.max(h, secs[0].h));
      const below = clamp((-h) / Math.max(1, -hBot), 0, 1);
      const w = (h > 0 ? s.w : lerp(B.hipW, Math.max(B.hipW * wide, ks.w + B.rKnee + 4), below)) + (isCoat ? 1.8 : 1), d = (h > 0 ? s.d : lerp(B.hipD, Math.max(B.hipD * wide, ks.d + B.rKnee + 3), below)) + (isCoat ? 1.6 : .8);
      const cf = h > 0 ? s.f : ks.cf * below, ca = h > 0 ? 0 : ks.ca * below;
      const yy = Math.max(h, secs[0].h);
      const c = P(h > 0 ? ub([ca, h, cf]) : [pel[0] + ca, pel[1] + h, pel[2] + cf]), Rx = -Math.cos(yaw), Fx = Math.sin(yaw), rho = Math.sqrt(w * Rx * w * Rx + d * Fx * d * Fx);
      const sway = M.walk ? Math.sin(M.ph) * 1.5 * t : 0;
      right.push(ext([c[0] + rho + sway, c[1] + (i === rows ? 1.2 : 0)])); left.push(ext([c[0] - rho + sway, c[1] + (i === rows ? -.4 : 0)])); centers.push([c[0], c[1], w, d, cf, ca, h]);
    }
    const poly = right.concat(left.reverse());
    ch_fill(g, r, poly, col, { ax: [0, 1], n: 26, sw: 1.6, top: .0, bot: .32, fx: (g2) => {
      // vertical drape folds
      const cB = centers[rows], cT = centers[0];
      for (let k = 0; k < 5; k++) { const u = -.8 + k * .4 + (r() - .5) * .15, x0 = cT[0] + u * (right[0][0] - left[left.length - 1][0]) * .4, x1 = cB[0] + u * (right[rows][0] - left[0][0]) * .5; ch_fold(g2, [[x0, cT[1] + 4], [lerp(x0, x1, .5) + (r() - .5) * 2, lerp(cT[1], cB[1], .55)], [x1, cB[1]]], .8, col, .7); }
      if (OF.pleats) for (let k = -3; k <= 3; k++) { const x0 = cT[0] + k * 2.4, x1 = cB[0] + k * 3.4; ch_stroke(g2, [[x0, cT[1] + 2], [x1, cB[1]]], .5, ch_tones(col).core, .55); }
      if (openFront && cY > -.2) {   // coat opening
        const f0 = PS(0, H * .06), f1x = cB[0] + sY * (right[rows][0] - cB[0]) * .2;
        ch_stroke(g2, [[f0[0], f0[1]], [f1x, cB[1]]], .7, INK, .55);
        ch_stroke(g2, [[f0[0] + .8, f0[1]], [f1x + .9, cB[1]]], .5, ch_tones(col).lt, .5);
      }
      // hem shadow line
      ch_stroke(g2, [left[0], [cB[0], cB[1] + 1.4], right[rows]], 1.2, ch_tones(col).core, .5);
    } });
  };

  /* ---------- TORSO (seat, top garment, details) */
  const oc = C(L.outfitColor), topC = C(OF.top);
  const drawTorso = (g) => {
    const hTop = secs[secs.length - 1].h;
    // trousers seat / lower body
    if (!OF.skirt) { const seat = torsoPoly(secs[0].h, H * .11, trouserR + .4, 2); ch_fill(g, r, seat, OF.pants, { n: 8, sw: 1.4, bot: .2, top: 0 }); }
    // long tails / skirts
    if (OF.skirt && !OF.long) drawTails(g, OF.skirt, (M.sit ? pel[1] - 2 : B.ankY + H * OF.skirtH + (M.hang ? M.lift : 0)), 1.25, false, false);
    if (OF.long && !M.sit) drawTails(g, OF.top, B.ankY + H * OF.long + (M.hang ? M.lift : 0), 1.32, true, true);
    if (OF.long && M.sit) { const seat2 = torsoPoly(secs[0].h, H * .11, 2.4, 2); ch_fill(g, r, seat2, OF.top, { n: 6, bot: .2, top: 0 }); }
    // neck
    const nb = P(M.neckB), hc = P(M.head.c), nt = [lerp(nb[0], hc[0], .7), lerp(nb[1], hc[1], .7)];
    ch_limb(g, r, [[nb[0], nb[1] + 2], nt], [B.rNeck, B.rNeck * .92], skin, { n: 4, inka: .4, fx: (g2) => { g2.fillStyle = 'rgba(30,20,40,.35)'; g2.fillRect(nt[0] - 8, nt[1] - 2, 16, 5); } });
    // top garment
    const hemH = OF.o === 'apron' ? H * .09 : (OF.skirt && OF.o !== 'cardigan' && OF.o !== 'suit') ? H * .085 : H * OF.hem;
    const topPoly = torsoPoly(Math.min(hemH, H * .1), hTop, OF.o === 'coat' ? 1.8 : OF.o === 'labcoat' ? 1.4 : OF.o === 'suit' || OF.o === 'uniform' ? 1.1 : .7, 3);
    const garmentC = OF.o === 'overalls' ? OF.top : OF.o === 'shirtsleeves' ? OF.shirt : topC;
    ch_fill(g, r, topPoly, garmentC, { ax: [0, 1], n: 30, sw: 1.6, top: .1, bot: .18, fx: (g2) => torsoDetail(g2, garmentC, hemH) });
    if (OF.bib) drawBib(g);
    if (OF.apron) drawApron(g);
    collar(g, garmentC);
    sigTorso(g);
  };
  const visible = (phi, h) => visT(phi, h) > .05;
  const surfLine = (phi, h0, h1, n, out) => { const pts = []; for (let i = 0; i <= n; i++) { const h = lerp(h0, h1, i / n); if (!visible(phi, h)) return null; const q = PS(phi, h, out); pts.push([q[0], q[1]]); } return pts; };
  const ringLine = (h, p0, p1, n, out) => { const pts = []; for (let i = 0; i <= n; i++) { const phi = lerp(p0, p1, i / n); if (visible(phi, h)) { const q = PS(phi, h, out); pts.push([q[0], q[1]]); } } return pts; };
  const front = cY > .12, back = cY < -.12;
  const torsoDetail = (g, col, hemH) => {
    const T = ch_tones(col), hc = H * .1, hChest = H * .2, hSh = B.hs;
    // side drag folds from the armpits & waist bunching
    for (const s of [1, -1]) {
      const phi = s * 1.25; if (visible(phi, H * .15)) { const a = PS(phi, H * .21), b = PS(s * 1.0, H * .13), c2 = PS(s * .85, H * .07); ch_fold(g, [[a[0], a[1]], [b[0], b[1]], [c2[0], c2[1]]], .9, col, .8); }
      const phi2 = s * 1.45; if (visible(phi2, H * .1)) { const a = PS(phi2, H * .11), b = PS(s * 1.1, H * .085); ch_fold(g, [[a[0], a[1]], [b[0], b[1]]], .8, col, .7); }
    }
    if (B.b === 2) { const a = ringLine(H * .085, -1, 1, 6); if (a.length > 1) ch_fold(g, a, .9, col, .6); }
    // hem shadow
    const hem = ringLine(Math.min(hemH, H * .1) + 1, -1.6, 1.6, 10); if (hem.length > 1) ch_stroke(g, hem, 1.1, T.core, .45);
    // side seams
    for (const s of [1, -1]) { const ln = surfLine(s * 1.57, hemH + 2, hSh - 2, 4); if (ln) ch_stroke(g, ln, .45, T.core, .45); }
    const o = OF.o;
    if (o === 'uniform') {
      const ln = surfLine(0, hemH + 1, hSh + 1, 5); if (ln) { ch_stroke(g, ln, .6, T.core, .7); for (let i = 0; i < 4; i++) { const q = PS(.05, lerp(H * .07, H * .24, i / 3)); if (visible(.05, H * .15)) ch_button(g, q[0], q[1], .75, [214, 178, 96]); } }
      // belt
      const bl = ringLine(H * .085, -1.7, 1.7, 10, .6); if (bl.length > 1) { ch_stroke(g, bl, 2.6, mul(accC, .55), 1); ch_stroke(g, bl, 1.6, accC, .95); }
      if (visible(0, H * .085)) { const q = PS(0, H * .085, .8); g.fillStyle = css([226, 196, 110]); g.fillRect(q[0] - 1.4, q[1] - 1.3, 2.8, 2.6); g.strokeStyle = css(INK, .6); g.lineWidth = .4; g.strokeRect(q[0] - 1.4, q[1] - 1.3, 2.8, 2.6); }
      // breast pockets
      for (const s of [1, -1]) if (visible(s * .5, H * .2)) { const a = PS(s * .32, H * .225, .2), b = PS(s * .72, H * .225, .2), c2 = PS(s * .72, H * .19, .2), d = PS(s * .32, H * .19, .2); ch_poly(g, [a, b, c2, d]); g.strokeStyle = css(T.core, .6); g.lineWidth = .5; g.stroke(); ch_stroke(g, [a, b], 1.2, mul(col, 1.15), .7); ch_button(g, (a[0] + b[0]) / 2, a[1] + 1, .5, [214, 178, 96]); }
    } else if (o === 'suit' || o === 'coat' || o === 'labcoat' || o === 'cardigan') {
      // open front: shirt/blouse visible in a V; lapels
      const deep = o === 'cardigan' ? H * .1 : o === 'labcoat' ? H * .13 : o === 'coat' ? H * .16 : H * .14;
      if (front) {
        const v = [PS(-.42, hSh + 1), PS(0, deep), PS(.42, hSh + 1), PS(.3, hSh + 3), PS(-.3, hSh + 3)];
        ch_fill(g, r, v, OF.shirt, { n: 4, inka: .5, ax: [0, 1] });
        if (o !== 'cardigan' && o !== 'labcoat' || L.extra === 'none' && o === 'labcoat') { // tie
          const t0 = PS(0, hSh - 1, .5), t1 = PS(0, deep + 2, .5);
          if (id === 'fenwick' || id === 'quill') { ch_fill(g, r, [[t0[0] - 2.6, t0[1] - 1], [t0[0], t0[1] + .3], [t0[0] + 2.6, t0[1] - 1], [t0[0] + 2.6, t0[1] + 1.6], [t0[0], t0[1] + .6], [t0[0] - 2.6, t0[1] + 1.6]], accC, { sharp: true, n: 2, inka: .7 }); }
          else if (o !== 'labcoat' || true) ch_fill(g, r, [[t0[0] - .9, t0[1]], [t0[0] + .9, t0[1]], [t1[0] + 1.5, t1[1] - 1.5], [t1[0], t1[1] + .8], [t1[0] - 1.5, t1[1] - 1.5]], o === 'labcoat' ? [70, 60, 60] : accC, { sharp: true, n: 2, inka: .7 });
        }
        if (o !== 'cardigan') for (const s of [1, -1]) {   // lapels
          const la = [PS(s * .44, hSh + 1.5, .6), PS(s * .05, deep, .6), PS(s * .25, deep + H * .03, .6), PS(s * .78, hSh - H * .02, .6), PS(s * .7, hSh + 1.2, .6)];
          ch_fill(g, r, la, mul(col, 1.08), { n: 4, sharp: true, inka: .65, ax: [0, 1] });
        }
        // closure + buttons below the V
        const ln = surfLine(o === 'cardigan' ? .06 : 0, hemH + 1, deep, 4); if (ln) ch_stroke(g, ln, .55, T.core, .75);
        const nb = o === 'coat' ? 3 : o === 'cardigan' ? 4 : 2;
        for (let i = 0; i < nb; i++) { const h = lerp(deep - 2, hemH + 4, (i + .5) / nb); if (o === 'coat') { for (const s of [1, -1]) if (visible(s * .22, h)) { const q = PS(s * .22, h); ch_button(g, q[0], q[1], .8, [40, 32, 28]); } } else if (visible(.1, h)) { const q = PS(o === 'cardigan' ? .1 : .06, h); ch_button(g, q[0], q[1], .65, o === 'cardigan' ? accC : [40, 34, 34]); } }
        // pockets
        for (const s of [1, -1]) if (visible(s * .6, H * .05)) { const a = PS(s * .35, H * .055, .3), b = PS(s * .85, H * .055, .3); ch_stroke(g, [a, b], .8, T.core, .7); ch_stroke(g, [[a[0], a[1] + .9], [b[0], b[1] + .9]], .5, T.lt, .4); }
        if (o === 'labcoat' && visible(-.6, H * .2)) { const a = PS(-.4, H * .21, .3), b = PS(-.8, H * .21, .3); ch_stroke(g, [a, b], .7, T.core, .7); ch_stroke(g, [[a[0], a[1] - .5], [a[0] - .2, a[1] - 3.5]], .8, [40, 70, 140], .95); ch_stroke(g, [[a[0] - 1.4, a[1] - .5], [a[0] - 1.5, a[1] - 3]], .8, [160, 40, 40], .9); }
      }
      if (o === 'cardigan') {   // knit ribbing at hem & front bands
        const rib = ringLine(hemH + 1.8, -1.6, 1.6, 12); if (rib.length > 1) ch_stroke(g, rib, 1.8, T.core, .35);
        for (let i = -10; i <= 10; i++) { const phi = i * .15; if (!visible(phi, hemH + 1)) continue; const a = PS(phi, hemH + .3), b = PS(phi, hemH + 3.4); ch_stroke(g, [a, b], .35, T.core, .5); }
      }
      if (o === 'coat' || o === 'labcoat') { const bl = ringLine(H * .1, -1.6, 1.6, 10, .9); if (bl.length > 1 && o === 'coat') { ch_stroke(g, bl, 2.4, mul(col, .7), 1); ch_stroke(g, bl, .6, T.lt, .4); if (visible(0, H * .1)) { const q = PS(0, H * .1, 1); g.strokeStyle = css(accC); g.lineWidth = .6; g.strokeRect(q[0] - 1.6, q[1] - 1.4, 3.2, 2.8); } } }
      if (back && (o === 'coat' || o === 'labcoat')) { const ln = surfLine(Math.PI, H * .02, H * .09, 2); if (ln) ch_stroke(g, ln, .6, T.core, .6); }
    } else if (o === 'tracksuit') {
      const zipTo = id === 'vasha' ? H * .2 : hSh + 1;
      const ln = surfLine(0, hemH + 1, hSh + 2, 6);
      if (ln) { ch_stroke(g, ln, .7, T.core, .8); ch_stroke(g, ln.map(p => [p[0] + .6, p[1]]), .35, [200, 200, 200], .5); }
      if (front && id === 'vasha') { const v = [PS(-.3, hSh + 1), PS(0, zipTo), PS(.3, hSh + 1)]; ch_fill(g, r, v, [210, 206, 196], { n: 2, sharp: true, inka: .5 }); }
      for (const s of [1, -1]) { const ln2 = surfLine(s * .62, hemH + 2, hSh, 5, .3); if (ln2) ch_stroke(g, ln2, 1.1, accC, .9); }
      const rib = ringLine(hemH + 1.6, -1.6, 1.6, 10); if (rib.length > 1) ch_stroke(g, rib, 2.2, T.core, .35);
    } else if (o === 'shirtsleeves') {
      const ln = surfLine(0, H * .09, hSh + 1, 5); if (ln) { ch_stroke(g, ln, .5, T.core, .7); for (let i = 0; i < 4; i++) { const h = lerp(H * .12, H * .26, i / 3); if (visible(0, h)) { const q = PS(0.04, h); ch_dot(g, q[0], q[1], .5, [236, 230, 214]); } } }
      // tucked blousing over the belt
      const bl = ringLine(H * .088, -1.7, 1.7, 10, .3); if (bl.length > 1) { ch_stroke(g, bl, 2, [40, 32, 30], 1); }
      for (let i = -3; i <= 3; i++) { const phi = i * .32; if (!visible(phi, H * .1)) continue; const a = PS(phi, H * .095), b = PS(phi + .08, H * .14); ch_fold(g, [a, b], .6, col, .7); }
      if (OF.braces) for (const s of [1, -1]) { const ln2 = surfLine(s * .45, H * .09, hSh + 2, 5, .3); if (ln2) ch_stroke(g, ln2, 1.4, OF.braces, .95); }
      if (back && OF.braces) { const a = PS(Math.PI, H * .19, .3); for (const s of [1, -1]) { const b = PS(Math.PI - s * .5, hSh + 2, .3), c2 = PS(Math.PI - s * .35, H * .09, .3); ch_stroke(g, [[c2[0], c2[1]], [a[0], a[1]], [b[0], b[1]]], 1.4, OF.braces, .95); } }
    } else if (o === 'overalls') {
      const bl = ringLine(H * .09, -1.7, 1.7, 8); // shirt only; bib drawn after
    }
    if (back && (o === 'uniform' || o === 'suit')) { const ln = surfLine(Math.PI, hemH + 1, H * .07, 2); if (ln) ch_stroke(g, ln, .6, T.core, .7); if (o === 'uniform') { const bl = ringLine(H * .085, Math.PI - 1.7, Math.PI + 1.7, 10, .6); if (bl.length > 1) { ch_stroke(g, bl, 2.6, mul(accC, .55), 1); ch_stroke(g, bl, 1.6, accC, .95); } } }
    // light across the chest / shoulder planes
    const sh1 = PS(.6 * (sY >= 0 ? 1 : -1) + .2, H * .2), sh2 = PS(.9, B.hs - 2);
    if (visible(.75, H * .21)) ch_stroke(g, [[sh1[0], sh1[1]], [sh2[0], sh2[1]]], 2.4, T.lt, .18);
  };
  const drawBib = (g) => {
    const col = C(OF.bib), hB = H * .225;
    if (front) {
      const bib = [PS(-.62, H * .1, .6), PS(.62, H * .1, .6), PS(.5, hB, .6), PS(-.5, hB, .6)];
      ch_fill(g, r, bib, col, { n: 8, sharp: true, inka: .7, fx: (g2) => { const a = PS(-.25, hB - 3, .7), b = PS(.25, hB - 3, .7), c2 = PS(.25, hB - H * .065, .7), d = PS(-.25, hB - H * .065, .7); ch_poly(g2, [a, b, c2, d]); g2.strokeStyle = css(ch_tones(col).core, .7); g2.lineWidth = .5; g2.stroke(); ch_stroke(g2, [a, b], .7, [226, 190, 110], .7); } });
      for (const s of [1, -1]) { const q = PS(s * .45, hB - 1, .7); ch_button(g, q[0], q[1], .9, [200, 170, 100]); }
    }
    // straps
    for (const s of [1, -1]) {
      const pts = [];
      for (let i = 0; i <= 5; i++) { const t = i / 5, phi = front || !back ? lerp(s * .47, s * .55, t) : 0; }
      const fr = [PS(s * .47, hB, .7), PS(s * .5, B.hs + 2, .7)], bk = [PS(Math.PI - s * .45, B.hs + 2, .7), PS(Math.PI - s * .2, H * .13, .7)];
      if (front && visible(s * .47, hB)) ch_stroke(g, [[fr[0][0], fr[0][1]], [fr[1][0], fr[1][1]]], 2.2, col, 1);
      if (back) { ch_stroke(g, [[bk[0][0], bk[0][1]], [bk[1][0], bk[1][1]]], 2.2, col, 1); }
      if (!front && !back) { const a = PS(s * .7, hB, .7), b = PS(s * 1.0, B.hs + 2, .7); if (visible(s * .7, hB)) ch_stroke(g, [[a[0], a[1]], [b[0], b[1]]], 2.2, col, 1); }
    }
    // waist of the overalls (sides/back)
    const bl = ringLine(H * .105, -3.2, 3.2, 16, .7); if (bl.length > 1 && !front) ch_stroke(g, bl, 3, col, 1);
  };
  const drawApron = (g) => {
    const col = C(OF.apron), T = ch_tones(col);
    if (!back) {
      const hB = H * .2, bottom = B.ankY + H * .26 - pel[1];
      // skirt part of the apron: spans front of skirt
      const ks = kneeSpread(), pts = [];
      const L0 = PS(-1.0, H * .08, 1.2), R0 = PS(1.0, H * .08, 1.2);
      const c = P([pel[0] + ks.ca, pel[1] + bottom, pel[2] + ks.cf + B.hipD * 1.25 + 1.5]), wB = (B.hipW * 1.08 + 1);
      const Rx = -Math.cos(yaw), Fx = Math.sin(yaw), half = Math.abs(wB * Rx) + Math.abs(2 * Fx);
      const lower = [[L0[0], L0[1]], [R0[0], R0[1]], [c[0] + half * (R0[0] > L0[0] ? 1 : -1) * .95, c[1]], [c[0] - half * (R0[0] > L0[0] ? 1 : -1) * .95, c[1] + .5]];
      if (visible(0, H * .05)) {
        const bib = [PS(-.5, H * .085, .9), PS(.5, H * .085, .9), PS(.42, hB, .9), PS(-.42, hB, .9)];
        ch_fill(g, r, lower.map(p => ext(p)), col, { n: 16, sharp: false, inka: .7, ax: [0, 1], bot: .2, top: 0, fx: (g2) => {
          for (let k = 0; k < 4; k++) { const u = -.6 + k * .4; const x0 = lerp(L0[0], R0[0], .5 + u * .5), x1 = lerp(lower[3][0], lower[2][0], .5 + u * .55); ch_fold(g2, [[x0, L0[1] + 3], [x1, lower[2][1] - 1]], .8, col, .7); }
          g2.fillStyle = 'rgba(120,70,50,.25)'; g2.beginPath(); g2.ellipse(lerp(L0[0], R0[0], .35), L0[1] + 9, 2.4, 1.6, .3, 0, 7); g2.fill(); g2.beginPath(); g2.ellipse(lerp(L0[0], R0[0], .62), L0[1] + 16, 1.6, 1.2, 0, 0, 7); g2.fill();
          // pocket
          const pa = [lerp(L0[0], R0[0], .3), L0[1] + 5], pb = [lerp(L0[0], R0[0], .7), L0[1] + 5]; ch_stroke(g2, [pa, pb], .6, T.core, .6); ch_stroke(g2, [[pa[0], pa[1] + 5], [pb[0], pb[1] + 5]], .5, T.core, .45);
        } });
        if (front) ch_fill(g, r, bib, col, { n: 6, sharp: true, inka: .7 });
        // ties & waist band
        const wb = ringLine(H * .085, -1.3, 1.3, 8, 1); if (wb.length > 1) ch_stroke(g, wb, 1.6, mul(col, .85), 1);
        if (front) for (const s of [1, -1]) { const a = PS(s * .42, hB, .9), b = PS(s * .55, B.hs + 2.5, .5); ch_stroke(g, [[a[0], a[1]], [b[0], b[1]]], 1.1, mul(col, .9), 1); }
      }
    } else {
      const wb = ringLine(H * .085, Math.PI - 1.5, Math.PI + 1.5, 8, 1); if (wb.length > 1) ch_stroke(g, wb, 1.4, mul(col, .85), 1);
      const q = PS(Math.PI, H * .085, 1.2); ch_stroke(g, [[q[0] - 3, q[1] - 1.5], [q[0], q[1]], [q[0] + 3, q[1] - 1.5]], 1.4, col, 1); ch_stroke(g, [[q[0], q[1]], [q[0] - 1.5, q[1] + 6]], 1, col, 1); ch_stroke(g, [[q[0], q[1]], [q[0] + 1.8, q[1] + 6]], 1, col, 1);
      for (const s of [1, -1]) { const a = PS(Math.PI - s * .5, B.hs + 1.5, .5), b = PS(Math.PI, H * .2, .5); ch_stroke(g, [[a[0], a[1]], [b[0], b[1]]], 1, col, .95); }
    }
  };
  const collar = (g, col) => {
    const o = OF.o, hN = secs[secs.length - 1].h, T = ch_tones(col);
    if (o === 'uniform' || o === 'tracksuit') {   // stand collar ring around the neck base
      const ring = []; const rr = B.rNeck + 1.4;
      for (let i = 0; i <= 16; i++) { const a = -Math.PI + i / 16 * Math.PI * 2; ring.push(ub([Math.sin(a) * rr, hN + 1.8 - (Math.cos(a) > 0 ? 1 : 0) * Math.cos(a) * (o === 'uniform' ? 1.2 : 0), Math.cos(a) * rr * 1.02 + secs[secs.length - 1].f])); }
      const lo = []; for (let i = 0; i <= 16; i++) { const a = -Math.PI + i / 16 * Math.PI * 2; lo.push(ub([Math.sin(a) * (rr + 1), hN - 2.5, Math.cos(a) * (rr + 1) + secs[secs.length - 1].f])); }
      const sp = ch_hull(ring.concat(lo).map(p => P(p)));
      ch_fill(g, r, sp, o === 'uniform' ? mul(col, 1.05) : col, { n: 3, inka: .6, sharp: false });
      if (o === 'uniform' && front) { const q = PS(0, hN, 1.4); ch_stroke(g, [[q[0] - .2, q[1] - 2], [q[0], q[1] + 1]], .6, INK, .7); ch_stroke(g, [PS(-.6, hN - 1.2, 1.6), PS(-.15, hN + .4, 1.6)], 1, [236, 230, 214], .8); ch_stroke(g, [PS(.6, hN - 1.2, 1.6), PS(.15, hN + .4, 1.6)], 1, [236, 230, 214], .8); }
    } else if (o === 'coat') {   // big collar (turned up for Voss)
      const up = id === 'voss' ? 4.5 : 1.8;
      const pts = []; for (let i = 0; i <= 12; i++) { const a = -Math.PI * .95 + i / 12 * Math.PI * 1.9; pts.push(P(ub([Math.sin(a) * (B.rNeck + 2.6), hN + up * (1 - Math.max(0, Math.cos(a)) * .6), Math.cos(a) * (B.rNeck + 2.2) + secs[secs.length - 1].f]))); }
      for (let i = 0; i <= 12; i++) { const a = -Math.PI * .95 + i / 12 * Math.PI * 1.9; pts.push(P(ub([Math.sin(a) * (B.rNeck + 5.5), hN - 3, Math.cos(a) * (B.rNeck + 4) + secs[secs.length - 1].f]))); }
      ch_fill(g, r, ch_hull(pts), mul(col, 1.08), { n: 6, inka: .7 });
      if (front) { const v = [PS(-.35, hN - 1, 1.5), PS(0, H * .2, 1.5), PS(.35, hN - 1, 1.5)]; ch_fill(g, r, v, accC, { n: 4, sharp: true, inka: .6 }); } // scarf
      else if (!back) { const a = PS(sY > 0 ? .4 : -.4, hN - 1, 2); ch_dot(g, a[0], a[1], 2.2, accC, .9); }
    } else if (o === 'suit' || o === 'labcoat' || o === 'shirtsleeves' || o === 'cardigan' || o === 'overalls' || o === 'apron') {
      if (front || !back) for (const s of [1, -1]) {   // shirt collar points
        if (!visible(s * .3, hN - 1)) continue;
        const c0 = PS(s * .05, hN - 3.5, 1.4), c1 = PS(s * .55, hN + .6, 1.4), c2 = PS(s * .4, hN - 4.4, 1.6);
        const cc = o === 'shirtsleeves' ? OF.shirt : o === 'overalls' ? OF.top : o === 'apron' ? mix(OF.top, [230, 220, 200], .5) : OF.shirt;
        ch_fill(g, r, [c0, c1, c2], mul(C(cc), 1.08), { n: 2, sharp: true, inka: .6 });
      }
      if (back) { const bl = ringLine(hN - 1, Math.PI - 1.2, Math.PI + 1.2, 8, 1.2); if (bl.length > 1) ch_stroke(g, bl, 1.8, mul(C(OF.shirt), 1.05), .9); }
    }
  };
  // signature torso props (keys, satchel strap, whistle, headphones, shawl, rope coil)
  const sigTorso = (g) => {
    if (id === 'vasha') { // whistle on a lanyard
      const a = PS(-.5, B.hs + 2, 1.6), b = PS(-.05, H * .19, 1.8), c2 = PS(.5, B.hs + 2, 1.6);
      if (front) { ch_stroke(g, [a, b, c2], .55, [210, 60, 50], .95); ch_fill(g, r, [[b[0] - 1.3, b[1]], [b[0] + 1.3, b[1]], [b[0] + 1.6, b[1] + 3], [b[0] - 1.1, b[1] + 3]], [190, 190, 196], { n: 1, inka: .7, sharp: true }); ch_dot(g, b[0] + .6, b[1] + .9, .4, [255, 255, 255], .9); }
    }
    if (id === 'nadia') { // satchel strap across the body
      const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8, phi = lerp(-.95, 1.15, t), h = lerp(B.hs + 2, H * .03, t); if (visible(phi, h)) { const q = PS(phi, h, 1.6); pts.push([q[0], q[1]]); } }
      if (pts.length > 1) { ch_stroke(g, pts, 1.8, [62, 40, 30], 1); ch_stroke(g, pts.map(p => [p[0] + .5, p[1] - .4]), .5, [150, 110, 80], .5); }
      if (visible(1.2, H * .02) || !front) { const q = PS(1.35, -H * .01, 3); ch_fill(g, r, [[q[0] - 5, q[1] - 4], [q[0] + 5, q[1] - 4], [q[0] + 5.5, q[1] + 5], [q[0] - 5.5, q[1] + 5]], [92, 62, 44], { n: 3, inka: .8, sharp: true, fx: (g2) => ch_stroke(g2, [[q[0] - 5, q[1] - 1], [q[0] + 5, q[1] - 1]], .6, [40, 26, 20], .8) }); }
    }
    if (id === 'osk' || id === 'matron') { // keys on a ring at the hip
      const sd = id === 'osk' ? 1.3 : -1.3; if (visible(sd, H * .09)) { const q = PS(sd, H * .07, 1.5); g.strokeStyle = css([150, 140, 110], .95); g.lineWidth = .6; g.beginPath(); g.arc(q[0], q[1], 1.6, 0, 7); g.stroke(); for (let k = 0; k < 4; k++) ch_stroke(g, [[q[0] - 1 + k * .7, q[1] + 1.4], [q[0] - 1.6 + k * 1.1, q[1] + 4.5]], .6, [190, 180, 140], .95); }
    }
    if (id === 'marr' && front) { const q = PS(-.45, H * .22, 1.5); ch_dot(g, q[0], q[1], 1.2, accC); ch_dot(g, q[0] + .4, q[1] - .4, .4, [255, 245, 210], .9); }
    if (id === 'corvin' && front) { const q = PS(-.45, H * .22, 1.4); ch_dot(g, q[0], q[1], .9, [190, 40, 40]); ch_dot(g, q[0], q[1], .4, [230, 200, 110]); }
    if (id === 'anka') { // knitted shawl over the shoulders
      const sh = []; for (let i = 0; i <= 14; i++) { const a = -Math.PI + i / 14 * Math.PI * 2; if (visT(a, B.hs) < -.2) continue; sh.push(PS(a, B.hs + 2.4, 2.4)); }
      const lo = []; for (let i = 14; i >= 0; i--) { const a = -Math.PI + i / 14 * Math.PI * 2; if (visT(a, B.hs) < -.2) continue; lo.push(PS(a, H * (Math.cos(a) > 0 ? .17 : .2), 2.8)); }
      const poly = sh.concat(lo); if (poly.length > 4) ch_fill(g, r, poly.map(p => [p[0], p[1]]), mix(accC, [120, 90, 70], .3), { n: 14, sw: 1, inka: .7, fx: (g2) => { const b = ch_bb(poly); for (let y = b[1]; y < b[3]; y += 1.6) ch_stroke(g2, [[b[0], y], [b[2], y + .6]], .35, [30, 20, 18], .35); } });
    }
    if (id === 'ilsabet' || id === 'tomas') { // headphones round the neck
      const pts = []; for (let i = 0; i <= 10; i++) { const a = -Math.PI * .5 + i / 10 * Math.PI; pts.push(P(ub([Math.sin(a) * (B.rNeck + 2.6), secs[secs.length - 1].h + 1 + Math.cos(a) * 1.2, -Math.cos(a) * (B.rNeck + 2.2) + 1]))); }
      if (cY > -.3) { ch_stroke(g, pts.slice(1, 10).map(p => [p[0], p[1]]), 1, [40, 40, 44], 1); }
      for (const s of [1, -1]) { const q = P(ub([s * (B.rNeck + 2.6), secs[secs.length - 1].h - .5, 1.5])); ch_fill(g, r, ellPts(q[0], q[1], 2.1 * Math.max(.45, Math.abs(cY)) + .5, 2.4, 10), [52, 50, 56], { n: 1, inka: .8 }); ch_dot(g, q[0] + .4, q[1] - .6, .5, [180, 180, 190], .7); }
    }
    if (id === 'hob') { // coil of bell-rope over the left shoulder
      const c = ub([-B.shW * .55, B.hs - 2, 0]);
      for (let k = 0; k < 3; k++) { const pts = []; for (let i = 0; i <= 18; i++) { const a = i / 18 * Math.PI * 2; pts.push(P([c[0] + Math.sin(a) * 2.5 + (k - 1) * 1.2, c[1] - 9 + Math.cos(a) * 14, c[2] + Math.cos(a) * 9])); } ch_stroke(g, pts.map(p => ext([p[0], p[1]])), 1.6, [150, 120, 80], .95); ch_stroke(g, pts.map(p => [p[0] + .4, p[1] - .3]), .5, [220, 190, 140], .5); }
    }
  };
  part(standing ? torsoD : torsoD, drawTorso);

  /* ---------- ARMS + HANDS + held items */
  const sleeveC = OF.o === 'shirtsleeves' ? C(OF.shirt) : C(OF.sleeve);
  const sleeveR = OF.o === 'coat' ? 2.4 : OF.o === 'labcoat' ? 2.1 : OF.o === 'suit' || OF.o === 'uniform' || OF.o === 'cardigan' ? 1.7 : 1.3;
  const handGeo = (a) => {
    // hand frame: u along fingers, s across knuckles, n palm normal
    let u = vNorm(vSub(a.wr, a.el)); if (a.up) u = vNorm(vAdd(u, [0, 1.2, .5]));
    if (a.hand === 'fist') u = vNorm(vAdd(u, [0, -.2, .4]));
    let s0 = [0, 0, 1]; if (Math.abs(vDot(s0, u)) > .9) s0 = [a.s, 0, 0];
    const sv = vNorm(vSub(s0, vMul(u, vDot(s0, u)))), nv = vCross(u, sv);
    return { u, sv, nv };
  };
  const drawHand = (g, a) => {
    if (a.hand === 'hidden') return null;
    const sc = H / 174, { u, sv, nv } = handGeo(a), W = a.wr;
    const fist = a.hand === 'fist' || a.hand === 'pinch';
    const pt = (l, s, n) => vAdd(vAdd(vAdd(W, vMul(u, l * sc)), vMul(sv, s * sc)), vMul(nv, n * sc * a.s));
    const pts = [pt(0, -2.4, 1), pt(0, 2.4, 1), pt(0, -2.2, -1.2), pt(0, 2.2, -1.2), pt(5.2, -3.6, 1.2), pt(5.2, 3.6, 1.2), pt(5.2, 3.3, -1.3), pt(5.2, -3.3, -1.3)];
    if (fist) pts.push(pt(7.6, -3.2, -1.5), pt(7.6, 3.2, -1.5), pt(6.5, -3, -3), pt(6.5, 3, -3));
    else pts.push(pt(9.6, -2.8, -1), pt(9.6, 2.6, -1), pt(8.6, -3.2, .5), pt(8.6, 3, .5));
    const sp = pts.map(p => PE(p, 1)), hull = ch_hull(sp);
    ch_fill(g, r, hull, skin, { ax: [sp[4][0] - sp[0][0], sp[4][1] - sp[0][1]], n: 3, sw: .8, inka: .7, inkw: .5, fx: (g2) => {
      if (!fist) { for (let k = -1; k <= 1; k++) { const a1 = P(pt(5.6, k * 1.25, 0)), b1 = P(pt(9, k * 1.1, -.6)); ch_stroke(g2, [[a1[0], a1[1]], [b1[0], b1[1]]], .35, ch_tones(skin).core, .45); } }
      else { const a1 = P(pt(6, -3, -1)), b1 = P(pt(6, 3, -1)); ch_stroke(g2, [[a1[0], a1[1]], [b1[0], b1[1]]], .45, ch_tones(skin).core, .45); }
    } });
    // thumb
    const t0 = P(pt(1.2, 2.6, 1)), t1 = P(pt(fist ? 5.4 : 4.8, fist ? 1.8 : 3.8, fist ? 2.6 : 2.4));
    ch_limb(g, r, [[t0[0], t0[1]], [t1[0], t1[1]]], [1.25 * sc, .95 * sc], skin, { n: 1, inka: .6, inkw: .45 });
    return { grip: vAdd(W, vMul(u, 5.5 * sc)), u, sv, nv, tip: vAdd(W, vMul(u, (fist ? 7.5 : 9.5) * sc)) };
  };
  const drawArm = (g, a) => {
    const sh = P(a.sh), el = P(a.el), wr = P(a.wr); ext(sh, 8); ext(wr, 12);
    const upMid = P(vLerp(a.sh, a.el, .45)), sr = sleeveR;
    const rolled = OF.rolled, cuffAt = .0;
    const R = [B.rUp + sr + .6, B.rUp * .92 + sr, B.rElb + sr, B.rFore + sr * .8, B.rWr + sr * .7];
    const fore = P(vLerp(a.el, a.wr, .4));
    const sleeveEndW = rolled ? P(vLerp(a.el, a.wr, .12)) : wr;
    // shoulder cap / upper sleeve
    if (rolled) {
      // forearm bare skin first, rolled cuff over it
      ch_limb(g, r, [[el[0], el[1]], [fore[0], fore[1]], [wr[0], wr[1]]], [B.rElb * .95, B.rFore * .95, B.rWr], skin, { n: 4, inka: .55, fx: (g2) => { const hair = ch_tones(skin).core; ch_stroke(g2, [[fore[0] - .5, fore[1]], [wr[0], wr[1]]], .4, hair, .2); } });
      ch_limb(g, r, [[sh[0], sh[1]], [upMid[0], upMid[1]], [el[0], el[1]], [sleeveEndW[0], sleeveEndW[1]]], [R[0], R[1], R[2] + .4, R[2] + 1.3], sleeveC, { n: 8, top: .12, bot: .1, fx: (g2) => { ch_fold(g2, [[el[0] - R[2], el[1] - 1], [el[0] + R[2], el[1] - 1.8]], .7, sleeveC, .8); } });
      const c0 = P(vLerp(a.el, a.wr, .04)), c1 = P(vLerp(a.el, a.wr, .14));
      ch_limb(g, r, [[c0[0], c0[1]], [c1[0], c1[1]]], [R[2] + 1.4, R[2] + 1.3], mul(sleeveC, 1.06), { n: 2, inka: .7, fx: (g2) => ch_fold(g2, [[c0[0] - 2, (c0[1] + c1[1]) / 2], [c0[0] + 2, (c0[1] + c1[1]) / 2 + .4]], .5, sleeveC, .9) });
    } else {
      ch_limb(g, r, [[sh[0], sh[1]], [upMid[0], upMid[1]], [el[0], el[1]], [fore[0], fore[1]], [wr[0], wr[1]]], R, sleeveC, { n: 12, top: .12, bot: .12, fx: (g2) => {
        // elbow creases and armpit drag
        const bend = (() => { const d1 = vNorm(vSub(a.el, a.sh)), d2 = vNorm(vSub(a.wr, a.el)); return Math.acos(clamp(vDot(d1, d2), -1, 1)); })();
        const k = Math.min(1, .35 + bend * .9);
        ch_fold(g2, [[el[0] - R[2] * .9, el[1] - 2.4], [el[0], el[1] - .6], [el[0] + R[2] * .8, el[1] - 2]], .75, sleeveC, k);
        ch_fold(g2, [[el[0] - R[2] * .6, el[1] + 1.8], [el[0] + R[2] * .7, el[1] + 2.6]], .6, sleeveC, k * .8);
        ch_fold(g2, [[sh[0], sh[1] + 4], [upMid[0] + .6, upMid[1] + 2]], .6, sleeveC, .5);
        if (OF.stripe) ch_stroke(g2, [[sh[0] + (sh[0] > el[0] ? 1 : -1) * R[0] * .5, sh[1] + 1], [el[0] + (sh[0] > el[0] ? 1 : -1) * R[2] * .7, el[1]], [wr[0] + (sh[0] > el[0] ? 1 : -1) * R[4] * .6, wr[1] - 1]], 1.1, OF.stripe, .9);
        if (OF.knit) { const c0 = P(vLerp(a.el, a.wr, .82)); for (let i = 0; i < 4; i++) { const q = vLerp([c0[0], c0[1]], [wr[0], wr[1]], i / 4); ch_stroke(g2, [[q[0] - R[4], q[1]], [q[0] + R[4], q[1] + .4]], .35, ch_tones(sleeveC).core, .5); } }
        if (OF.o === 'uniform') { const c0 = P(vLerp(a.el, a.wr, .86)); ch_stroke(g2, [[c0[0] - R[4] - .4, c0[1]], [c0[0] + R[4] + .4, c0[1] + .5]], .7, accC, .8); }
      } });
      if (OF.cuff && a.hand !== 'hidden') { const c0 = P(vLerp(a.el, a.wr, .97)), c1 = P(vAdd(a.wr, vMul(vNorm(vSub(a.wr, a.el)), 1.2))); ch_limb(g, r, [[c0[0], c0[1]], [c1[0], c1[1]]], [B.rWr + .5, B.rWr + .4], OF.cuff, { n: 1, inka: .5 }); }
    }
    // uniform epaulette / shoulder seam
    if (OF.o === 'uniform') { const e0 = P(ub([a.s * (B.shW * .55), B.hs + H * .016, 0])), e1 = P(ub([a.s * (B.shW + 1.5), B.hs + 1, 0])); ch_stroke(g, [[e0[0], e0[1]], [e1[0], e1[1]]], 2.2, mul(accC, .8), .95); ch_stroke(g, [[e0[0], e0[1] - .5], [e1[0], e1[1] - .6]], .6, ch_tones(accC).hi, .5); }
    // armband on the left upper arm
    if (L.extra === 'armband' && a.s === -1) {
      const b0 = vLerp(a.sh, a.el, .3), b1 = vLerp(a.sh, a.el, .5), p0 = P(b0), p1 = P(b1), rr = R[1] + .5;
      const out = ch_limb(g, r, [[p0[0], p0[1]], [p1[0], p1[1]]], [rr, rr], [170, 32, 34], { n: 2, inka: .8, sharp: true });
      const mid = P(vAdd(vLerp(b0, b1, .5), [0, 0, 0])), facing = (a.s * V0.Rd) * -1 + .3;
      ch_dot(g, mid[0] + (sY > 0 ? -1 : 1) * rr * .25, mid[1], 1.15, [236, 222, 180], .95); ch_dot(g, mid[0] + (sY > 0 ? -1 : 1) * rr * .25, mid[1], .5, [40, 20, 20], .9);
    }
    const hd = drawHand(g, a);
    if (hd) drawItem(g, a, hd);
  };
  /* held items */
  const drawItem = (g, a, hd) => {
    const it = M.item; if (!it) return;
    const R = a.s === 1, sc = H / 174;
    if (it === 'cig' && R) {
      const base = vAdd(hd.tip, vMul(hd.sv, 1.2 * sc)), dir = vNorm(vAdd(hd.sv, [0, .35, 0])), tip = vAdd(base, vMul(dir, 6 * sc));
      const b = PE(base, 1), t = PE(tip, 1);
      ch_stroke(g, [[b[0], b[1]], [t[0], t[1]]], 1.25, [238, 232, 216], 1); ch_stroke(g, [[b[0], b[1]], [lerp(b[0], t[0], .3), lerp(b[1], t[1], .3)]], 1.25, [200, 150, 90], 1);
      ch_dot(g, t[0], t[1], .9, [255, 120, 40], 1);
      // smoke wisp: one soft curling ribbon (painted after the ink contour so it stays airy)
      const rs = RNG(M.hsh + 5), ph0 = rs() * 6, pts = [[t[0], t[1] - .8]]; let px = t[0], py = t[1] - .8;
      for (let i = 1; i <= 10; i++) { py -= 2.6 + i * .3; px += Math.sin(ph0 + i * .62) * (.5 + i * .22) + .25; pts.push(ext([px, py])); }
      post.push((g) => { g.lineCap = 'round';
        for (let k = 0; k < 3; k++) { const seg = pts.slice(Math.floor(k * 3), Math.min(pts.length, Math.floor(k * 3) + 5)); if (seg.length < 2) continue; g.strokeStyle = css([214, 220, 228], .2 - k * .05); g.lineWidth = 2.2 + k * 1.3; ch_curve(g, seg); g.stroke(); }
        g.strokeStyle = css([238, 240, 244], .32); g.lineWidth = .5; ch_curve(g, pts.slice(0, 7)); g.stroke(); ch_dot(g, t[0], t[1], 2.4, [255, 140, 60], .2); });
    } else if ((it === 'clip' && !R) || (it === 'clipLap' && R)) {
      const c = it === 'clip' ? vAdd(hd.grip, [a.s * -1, 6 * sc, 3]) : [pel[0], pel[1] + H * .075, pel[2] + B.thighL * .6];
      const ux = [1, 0, 0], vy = it === 'clip' ? vNorm([0, 1, -.35]) : vNorm([0, .25, -1]);
      const w = 11.5 * sc, h = 15.5 * sc, Q = (x, y) => PE(vAdd(vAdd(c, vMul(ux, x)), vMul(vy, y)), .5);
      const n = vCross(ux, vy), nd = n[0] * V0.Rd + n[2] * V0.Fd + n[1] * .5;
      const board = [Q(-w, -h), Q(w, -h), Q(w, h), Q(-w, h)];
      ch_fill(g, r, board, [140, 98, 60], { sharp: true, n: 3, inka: .85, inkw: .6 });
      if (nd < 0 || it === 'clipLap') {
        const paper = [Q(-w + 1.4, -h + 1.4), Q(w - 1.4, -h + 1.4), Q(w - 1.4, h - 3), Q(-w + 1.4, h - 3)];
        ch_fill(g, r, paper, [232, 226, 206], { sharp: true, n: 2, inka: .3, fx: (g2) => { for (let i = 0; i < 6; i++) { const y = -h + 4 + i * 3.4 * sc * 1.2; const p0 = Q(-w + 3, y * (it === 'clip' ? -1 : 1)), p1 = Q(w - 3 - (i % 3) * 2, y * (it === 'clip' ? -1 : 1)); ch_stroke(g2, [[p0[0], p0[1]], [p1[0], p1[1]]], .45, [60, 60, 80], .55); } } });
        const k0 = Q(-3, it === 'clip' ? h - .5 : -h + .5), k1 = Q(3, it === 'clip' ? h - .5 : -h + .5); ch_stroke(g, [[k0[0], k0[1]], [k1[0], k1[1]]], 1.6, [180, 176, 160], 1);
      }
    } else if ((it === 'book' && !R) || (it === 'bookLap' && R)) {
      if (it === 'book') {
        const c = vAdd(hd.grip, [2 * sc, 7 * sc, 2.5]), ux = [1, 0, 0], vy = vNorm([0, 1, -.15]), th = vCross(ux, vy);
        const w = 8 * sc, h = 11 * sc, Q = (x, y, z) => PE(vAdd(vAdd(vAdd(c, vMul(ux, x)), vMul(vy, y)), vMul(th, z)), .5);
        const pts = []; for (const x of [-w, w]) for (const y of [-h, h]) for (const z of [-1.6, 1.6]) pts.push(Q(x, y, z));
        ch_fill(g, r, ch_hull(pts), [96, 40, 36], { sharp: true, n: 3, inka: .85 });
        const s0 = Q(w, -h, 1.7), s1 = Q(w, h, 1.7); ch_stroke(g, [[s0[0], s0[1]], [s1[0], s1[1]]], 1, [226, 216, 186], .9);
        const t0 = Q(-w * .5, h * .4, -1.8), t1 = Q(w * .5, h * .4, -1.8); ch_stroke(g, [[t0[0], t0[1]], [t1[0], t1[1]]], .8, [214, 176, 90], .8);
      } else {
        const c = [pel[0], pel[1] + H * .08, pel[2] + B.thighL * .62];
        const pg = (side) => { const pts = []; for (const [x, y] of [[0, -6], [side * 9, -7], [side * 9.5, 6], [0, 6.5]]) pts.push(PE(vAdd(c, [x * sc, Math.abs(x) * .18 + 1, y * sc]), .5)); return pts; };
        for (const s of [-1, 1]) ch_fill(g, r, pg(s), [236, 228, 206], { sharp: true, n: 2, inka: .6, fx: (g2) => { for (let i = 0; i < 4; i++) { const p0 = P(vAdd(c, [s * 2 * sc, 1.5, (-4 + i * 2.6) * sc])), p1 = P(vAdd(c, [s * 7.5 * sc, 2.5, (-4.5 + i * 2.6) * sc])); ch_stroke(g2, [[p0[0], p0[1]], [p1[0], p1[1]]], .35, [70, 70, 80], .5); } } });
        const sp0 = P(vAdd(c, [0, 1, -6 * sc])), sp1 = P(vAdd(c, [0, 1, 6.5 * sc])); ch_stroke(g, [[sp0[0], sp0[1]], [sp1[0], sp1[1]]], .7, [90, 40, 36], .9);
      }
    } else if ((it === 'broom' || it === 'broomLean') && R) {
      const top = it === 'broom' ? vAdd(hd.grip, [2, 22 * sc, -3]) : vAdd(hd.grip, [0, 5 * sc, 0]), foot = it === 'broom' ? [pel[0] + B.hipW + 10, 4, pel[2] + 22] : [pel[0] + 4, 4, pel[2] + 46];
      const t = PE(top, 2), f = PE(foot, 2);
      ch_stroke(g, [[t[0], t[1]], [f[0], f[1]]], 2.1, INK, .8); ch_stroke(g, [[t[0], t[1]], [f[0], f[1]]], 1.4, [140, 104, 64], 1); ch_stroke(g, [[t[0] + .4, t[1]], [f[0] + .4, f[1]]], .45, [220, 180, 120], .6);
      // straw head
      const dir = vNorm(vSub(foot, top)), sd = vNorm(vCross(dir, [0, 0, 1])), hd0 = vAdd(foot, vMul(dir, -1)), pts = [];
      for (const s of [-1, 1]) { pts.push(PE(vAdd(hd0, vMul(sd, s * 3.2)), 1), PE(vAdd(vAdd(foot, [0, -4, 0]), vMul(sd, s * 9)), 1), PE(vAdd(vAdd(foot, vMul(dir, -12)), vMul(sd, s * 2.4)), 1)); }
      ch_fill(g, r, ch_hull(pts), [188, 156, 88], { n: 8, ax: [f[0] - t[0], f[1] - t[1]], inka: .8, fx: (g2) => { const b = P(vAdd(foot, vMul(dir, -9))); ch_stroke(g2, [[b[0] - 4, b[1]], [b[0] + 4, b[1] + .5]], .9, [90, 60, 30], .9); for (let k = -4; k <= 4; k++) { const q = P(vAdd(vAdd(foot, [0, -4, 0]), vMul(sd, k * 2))); ch_stroke(g2, [[b[0] + k * .5, b[1] + 1], [q[0], q[1]]], .35, [110, 80, 40], .5); } } });
    } else if (it === 'ladle' && R) {
      const top = vAdd(hd.grip, [-1, 40 * sc, 4]), b = PE(hd.grip, 2), t = PE(top, 9);
      ch_stroke(g, [[b[0], b[1] + 3], [t[0], t[1]]], 2, INK, .8); ch_stroke(g, [[b[0], b[1] + 3], [t[0], t[1]]], 1.3, [176, 178, 176], 1);
      ch_fill(g, r, ellPts(t[0] + .8, t[1] - 3, 6, 4.4, 12), [158, 162, 160], { n: 2, inka: .85, fx: (g2) => { ch_dot(g2, t[0] + 2.2, t[1] - 3.8, 1.1, [250, 250, 246], .8); g2.fillStyle = 'rgba(40,40,50,.5)'; g2.beginPath(); g2.ellipse(t[0] + .8, t[1] - 4.2, 3.4, 1.3, 0, 0, 7); g2.fill(); } });
    } else if (it === 'mic' && R) {
      const top = vAdd(hd.grip, vMul(hd.u, 0)), tt = vAdd(top, [0, 9 * sc, 2]), a1 = PE(top, 1), b1 = PE(tt, 3);
      ch_stroke(g, [[a1[0], a1[1]], [b1[0], b1[1]]], 2, [40, 40, 44], 1); ch_fill(g, r, ellPts(b1[0], b1[1] - 1, 2.2, 2.6, 10), [150, 154, 160], { n: 2, inka: .8 });
      ch_stroke(g, [[a1[0], a1[1] + 2], [a1[0] - 2, a1[1] + 20], [a1[0] + 6, -2]], .6, [30, 30, 34], .8);
    } else if (it === 'mega' && R) {
      const ax2 = vNorm([.2, -.6, 1]), base = vAdd(hd.grip, vMul(ax2, 2)), mouth = vAdd(base, vMul(ax2, 26 * sc)), sd = vNorm(vCross(ax2, [0, 1, 0])), up2 = vCross(sd, ax2), pts = [], ring = [];
      for (let i = 0; i < 12; i++) { const a2 = i / 12 * 6.2832; pts.push(PE(vAdd(base, vAdd(vMul(sd, Math.cos(a2) * 2.6), vMul(up2, Math.sin(a2) * 2.6))), 1)); const q = PE(vAdd(mouth, vAdd(vMul(sd, Math.cos(a2) * 9 * sc), vMul(up2, Math.sin(a2) * 9 * sc))), 1); pts.push(q); ring.push(q); }
      ch_fill(g, r, ch_hull(pts), [196, 186, 160], { n: 4, inka: .85, ax: [pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]] });
      const md = ax2[0] * V0.Rd + ax2[2] * V0.Fd + ax2[1] * .5; if (md > 0) ch_fill(g, r, ring, [40, 30, 30], { n: 1, inka: .6, sharp: true }); else ch_stroke(g, ring.concat([ring[0]]), 1.4, [170, 40, 34], .9);
    } else if (it === 'rope' && R) {
      const c = vAdd(hd.grip, [2, -6, 2]);
      for (let k = 0; k < 3; k++) { const pts = []; for (let i = 0; i <= 16; i++) { const a2 = i / 16 * 6.2832; pts.push(PE([c[0] + Math.cos(a2) * 1.5 + k, c[1] + Math.sin(a2) * 8, c[2] + Math.cos(a2) * 6], 1)); } ch_stroke(g, pts, 1.5, [166, 134, 88], .95); }
      const e0 = P([c[0], c[1] - 8, c[2]]); ch_stroke(g, [[e0[0], e0[1]], [e0[0] + 2, e0[1] + 12], [e0[0] - 1, e0[1] + 20]], 1.4, [166, 134, 88], .95);
    }
  };
  for (const s of [1, -1]) {
    const a = M.armJ[s], dd = (P(a.sh)[2] + P(a.el)[2] + P(a.wr)[2]) / 3 + 3 + (a.bias || 0);
    part(torsoD + (dd - torsoD), (g) => drawArm(g, a));
  }

  /* ---------- HEAD */
  const hd = M.head, hc = hd.c;
  const headView = (yw) => { const s = Math.sin(yw), c = Math.cos(yw); return { Rx: -c, Rd: s, Fx: s, Fd: c }; };
  const HV = headView(hd.yaw);
  const hp = hd.pitch, hr = hd.roll, cp = Math.cos(hp), spp = Math.sin(hp);
  const headPt = (alpha, e, rad) => {   // surface point, alpha: 0 = face front, + = character's right; e: elevation
    rad = rad || 1; const ce = Math.cos(e), taper = e < 0 ? 1 - .22 * Math.pow(-Math.sin(e), 1.6) * (B.teen ? .7 : 1) : 1;
    let la = hd.hw * rad * ce * Math.sin(alpha) * taper, up = hd.hh * rad * Math.sin(e), fw = hd.hd * rad * ce * Math.cos(alpha) * taper * (Math.cos(alpha) > 0 ? 1 : 1.06);
    const u2 = up * cp - fw * spp, f2 = up * spp + fw * cp;   // pitch (nod forward = +)
    const l2 = la * Math.cos(hr) - u2 * Math.sin(hr), u3 = la * Math.sin(hr) + u2 * Math.cos(hr);
    return [hc[0] + l2 * HV.Rx / -1 * -1, u3, f2, l2];
  };
  const toS = (q) => { // q: [_, up, fw, lat] head-local rotated -> screen
    const la = q[3], up = q[1], fw = q[2], x = la * HV.Rx + fw * HV.Fx, d = la * HV.Rd + fw * HV.Fd, c0 = P(hc);
    return [c0[0] + x, c0[1] - up + d * CH_DK, c0[2] + d];
  };
  const HS = (alpha, e, rad) => toS(headPt(alpha, e, rad));
  const hVis = (alpha, e) => { const n = headPt(alpha, e, 1); const nl = [n[3] / hd.hw, n[1] / hd.hh, n[2] / hd.hd]; return nl[0] * HV.Rd + nl[2] * HV.Fd + nl[1] * .45; };
  const hsN = L.hairStyle || 'short';
  const headC = P(hc);
  const rxV = Math.sqrt(Math.pow(hd.hw * Math.cos(hd.yaw), 2) + Math.pow(hd.hd * Math.sin(hd.yaw), 2));
  const headSil = () => {   // projected silhouette from many surface samples (convex hull)
    const pts = []; for (let i = 0; i < 16; i++) for (const e of [-1.45, -1.05, -.6, 0, .6, 1.1, 1.5]) pts.push(HS(i / 16 * 6.2832, e, 1));
    return ch_hull(pts).map(p => ext(p, 1));
  };
  /* hair styles: line(alpha) = lowest elevation of hair; vol = shell scale */
  const HAIR = {
    short: { vol: 1.1, line: (a) => { const c = Math.cos(a); return c > .55 ? .5 - (1 - c) * .5 : c > -.3 ? .1 + (c - .55) * .1 : -.55; } },
    slick: { vol: 1.06, line: (a) => { const c = Math.cos(a); return c > .5 ? .58 : c > -.3 ? .18 : -.5; } },
    buzz: { vol: 1.025, line: (a) => { const c = Math.cos(a); return c > .55 ? .55 : c > -.3 ? .2 : -.45; } },
    curly: { vol: 1.26, line: (a) => { const c = Math.cos(a); return c > .55 ? .36 : c > -.3 ? .0 : -.6; } },
    long: { vol: 1.1, line: (a) => { const c = Math.cos(a); return c > .6 ? .48 : c > -.2 ? .25 : -.7; } },
    bob: { vol: 1.13, line: (a) => { const c = Math.cos(a); return c > .62 ? .3 : c > -.2 ? .1 : -.75; } },
    bun: { vol: 1.05, line: (a) => { const c = Math.cos(a); return c > .55 ? .5 : c > -.3 ? .2 : -.5; } },
    braid: { vol: 1.05, line: (a) => { const c = Math.cos(a); return c > .55 ? .5 : c > -.3 ? .22 : -.5; } },
    cap: { vol: 1.04, line: (a) => { const c = Math.cos(a); return c > .55 ? .55 : c > -.3 ? .1 : -.45; } },
    bald: { vol: 1.03, line: (a) => { const c = Math.cos(a); return c > .2 ? 9 : c > -.3 ? -.05 : -.35; }, top: (a) => { const c = Math.cos(a); return c > .2 ? -9 : c > -.3 ? .32 : .45; } }
  };
  const HST = HAIR[hsN] || HAIR.short;
  const thin = B.old ? .85 : 1;
  const hairT = ch_tones(hairC);
  // visible arc of a hairline (as screen polyline) over view angles beta in [-90,90]
  const hairArc = (lineFn, rad) => {
    const pts = []; for (let i = 0; i <= 14; i++) { const beta = -Math.PI / 2 + i / 14 * Math.PI, alpha = hd.yaw - beta; const e = clamp(lineFn(alpha), -1.5, 1.5); pts.push(HS(alpha, e, rad)); }
    return pts;
  };
  const clipAbove = (g, arc, up) => { // clip to region above (up=1) or below (up=-1) the arc
    const BIG = 80, a0 = arc[0], a1 = arc[arc.length - 1];
    g.beginPath(); g.moveTo(a0[0], a0[1]); for (const p of arc) g.lineTo(p[0], p[1]);
    // ensure the arc runs left->right or right->left consistently: extend outward horizontally
    const dir = a1[0] >= a0[0] ? 1 : -1;
    g.lineTo(a1[0] + dir * BIG, a1[1]); g.lineTo(a1[0] + dir * BIG, a1[1] - up * BIG); g.lineTo(a0[0] - dir * BIG, a0[1] - up * BIG); g.lineTo(a0[0] - dir * BIG, a0[1]); g.closePath(); g.clip();
  };
  const strands = (g, n, col, rad, len) => {   // hair strands flowing from the crown
    const crown = HS(Math.PI * .85, 1.2, rad), Tt = ch_tones(col);
    g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const al = (r() - .5) * 2 * Math.PI, e = -.6 + r() * 1.9, p = HS(al, Math.min(1.45, e), rad * 1.01), q = HS(al, Math.min(1.5, e + (len || .5)), rad * 1.01);
      const lt = r() < .45, cc = lt ? (p[0] > headC[0] ? Tt.lt : Tt.base) : Tt.core;
      g.strokeStyle = css(cc, lt ? .45 : .5); g.lineWidth = .35 + r() * .45;
      g.beginPath(); g.moveTo(q[0], q[1]); g.quadraticCurveTo(lerp(p[0], q[0], .5) + (r() - .5) * 1.2, lerp(p[1], q[1], .5), p[0], p[1]); g.stroke();
    }
    // sheen on the lit side of the crown
    const s0 = HS(hd.yaw - .9, .75, rad * 1.01), s1 = HS(hd.yaw - .35, .98, rad * 1.01);
    g.strokeStyle = css(Tt.hi, .38); g.lineWidth = 1.4; g.beginPath(); g.moveTo(s0[0], s0[1]); g.quadraticCurveTo((s0[0] + s1[0]) / 2 + .6, (s0[1] + s1[1]) / 2 - .8, s1[0], s1[1]); g.stroke();
  };
  const drawHairShell = (g) => {
    if (hsN === 'bald') {   // horseshoe fringe band
      if (lum(hairC) < 30 && !B.old) return;
      const rad = 1.03;
      g.save(); const sil = []; for (let i = 0; i < 16; i++) for (const e of [-1, -.5, 0, .5, 1, 1.4]) sil.push(HS(i / 16 * 6.2832, e, rad)); ch_path(g, ch_hull(sil)); g.clip();
      clipAbove(g, hairArc(HST.line, rad), 1); clipAbove(g, hairArc(HST.top, rad), -1);
      const bb = ch_bb(sil); g.fillStyle = ch_grad(g, bb[0], 0, bb[2], 0, hairC); g.fillRect(bb[0] - 2, bb[1] - 2, bb[2] - bb[0] + 4, bb[3] - bb[1] + 4);
      strands(g, 10, hairC, rad, .3); g.restore(); return;
    }
    const rad = HST.vol * (B.old && hsN !== 'buzz' ? .985 : 1);
    const sil = []; for (let i = 0; i < 20; i++) for (const e of [-1.2, -.8, -.4, 0, .4, .8, 1.2, 1.55]) { let rr = rad; if (hsN === 'curly') rr *= 1 + .07 * Math.sin(i * 2.7 + e * 5); sil.push(HS(i / 20 * 6.2832, e, rr)); }
    if (hsN === 'curly') { // bumpy outline: keep hull but add clumps later
    }
    const hull = ch_hull(sil).map(p => ext(p, 1.5));
    g.save(); ch_path(g, hull); g.clip(); clipAbove(g, hairArc(HST.line, rad), 1);
    const bb = ch_bb(hull), hcol = hsN === 'buzz' ? mix(hairC, skin, .42) : hairC;
    g.fillStyle = ch_grad(g, bb[0], bb[1] + 4, bb[2], bb[1], hcol); g.fillRect(bb[0] - 2, bb[1] - 2, bb[2] - bb[0] + 4, bb[3] - bb[1] + 4);
    if (hsN === 'buzz') { const rs = RNG(M.hsh); for (let i = 0; i < 70; i++) { const x = bb[0] + rs() * (bb[2] - bb[0]), y = bb[1] + rs() * (bb[3] - bb[1]); ch_dot(g, x, y, .3, rs() < .5 ? mul(hairC, .8) : ch_tones(hairC).lt, .5); } }
    else if (hsN === 'curly') {
      const rs = RNG(M.hsh + 3);
      for (let i = 0; i < 46; i++) { const al = rs() * 6.2832, e = -.5 + rs() * 2.1, q = HS(al, Math.min(1.5, e), rad * 1.02); if (hVis(al, Math.min(1.5, e)) < -.1) continue; const lit = q[0] > headC[0] - 1; g.strokeStyle = css(lit && rs() < .6 ? hairT.lt : hairT.core, .55); g.lineWidth = .55; g.beginPath(); g.arc(q[0], q[1], .9 + rs() * .9, rs() * 6, rs() * 6 + 3.6); g.stroke(); }
    } else strands(g, hsN === 'slick' ? 26 : 20 * thin, hairC, rad, hsN === 'slick' ? .9 : .55);
    if (hsN === 'slick') { for (let k = 0; k < 4; k++) { const a0 = hd.yaw - .5 + k * .32, p0 = HS(a0, .45, rad), p1 = HS(a0 + .1, 1.2, rad), p2 = HS(a0 + .3, 1.45, rad); ch_stroke(g, [[p0[0], p0[1]], [p1[0], p1[1]], [p2[0], p2[1]]], .55, hairT.hi, .55); } }
    g.restore();
    ch_path(g, hull); g.save(); g.clip(); clipAbove(g, hairArc(HST.line, rad), 1); ch_path(g, hull); g.strokeStyle = css(INK, .6); g.lineWidth = .6; g.stroke(); g.restore();
    if (hsN === 'curly') { // clumps on the silhouette
      const rs = RNG(M.hsh + 9);
      for (let i = 0; i < 14; i++) { const al = i / 14 * 6.2832, e = .3 + rs() * 1.1; if (hVis(al, e) < -.35 || HST.line(al) > e) continue; const q = HS(al, e, rad * 1.05); ext(q, 3); ch_fill(g, rs, ellPts(q[0], q[1], 1.8 + rs(), 1.7 + rs() * .8, 8), jit(hairC, rs, .1), { n: 2, sw: .6, inka: .45, inkw: .4 }); }
    }
  };
  const drawBackHair = (g) => {
    const hairCol = hairC, rad = HST.vol;
    if (hsN === 'long' || hsN === 'bob') {
      const endY = hsN === 'long' ? -hd.hh * 1.0 - H * .1 : -hd.hh * 1.05, wb = hsN === 'long' ? 1.3 : 1.18;
      const pts = [];
      for (let i = 0; i <= 12; i++) { const a = Math.PI * .42 + i / 12 * Math.PI * 1.16; pts.push(HS(a, .1, rad)); pts.push(HS(a, .6, rad)); }
      // hanging part: points below the head at the back
      const down = (lat, fw) => { const q = headPt(0, 0, 1); return toS([0, endY, fw * hd.hd, lat * hd.hw]); };
      for (const lat of [-wb, -.6, 0, .6, wb]) pts.push(down(lat, -.55 - (Math.abs(lat) < .7 ? .25 : 0)));
      for (const lat of [-wb * .95, wb * .95]) pts.push(down(lat, .05));
      const hull = ch_hull(pts.map(p => ext(p, 1)));
      ch_fill(g, r, hull, mul(hairCol, .9), { ax: [0, 1], n: 18, sw: .8, sl: 8, inka: .6, fx: (g2) => { const bb = ch_bb(hull); for (let i = 0; i < 18; i++) { const x = bb[0] + r() * (bb[2] - bb[0]); ch_stroke(g2, [[x, bb[1] + 2], [x + (r() - .5) * 2, bb[3] - r() * 3]], .45, r() < .5 ? hairT.core : hairT.lt, .4); } } });
    } else if (hsN === 'bun') {
      const q = HS(Math.PI, .72, 1.12), rr = hd.hh * .38; ext(q, rr + 1);
      ch_fill(g, r, ellPts(q[0], q[1] - rr * .3, rr, rr * .9, 12), hairCol, { n: 6, sw: .7, inka: .65, fx: (g2) => { for (let k = 0; k < 5; k++) { g2.strokeStyle = css(k % 2 ? hairT.lt : hairT.core, .5); g2.lineWidth = .5; g2.beginPath(); g2.arc(q[0], q[1] - rr * .3, rr * (.3 + k * .14), 3.6 + k, 5.6 + k); g2.stroke(); } } });
    }
  };
  const drawBraid = (g) => {
    if (hsN !== 'braid') return;
    const a0 = headPt(1.9, -.15, 1.02), p0 = toS(a0), sh = ub([B.shW * .5, B.hs + 3, 3]), ch = ub([B.shW * .42, H * .19, B.chestD + 2.5]);
    const pts = [p0, P(sh), P(ch)], tCol = hairC, n = 7;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), seg = t < .4 ? vLerp([p0[0], p0[1]], [P(sh)[0], P(sh)[1]], t / .4) : vLerp([P(sh)[0], P(sh)[1]], [P(ch)[0], P(ch)[1]], (t - .4) / .6);
      const rr = 2.5 - t * .7; ext(seg, rr + 1);
      ch_fill(g, r, ellPts(seg[0] + (i % 2 ? .5 : -.5), seg[1], rr, rr * 1.15, 10), i % 2 ? mul(tCol, 1.05) : tCol, { n: 2, sw: .6, inka: .6, inkw: .4 });
    }
    const end = P(ch); ch_dot(g, end[0], end[1] + 2.6, 1.4, accC); ch_stroke(g, [[end[0] - .6, end[1] + 3.6], [end[0] - 1, end[1] + 6.5]], 1, tCol, .9); ch_stroke(g, [[end[0] + .5, end[1] + 3.6], [end[0] + .9, end[1] + 6.2]], 1, tCol, .9);
  };
  const drawFace = (g) => {
    const closed = M.lie || M.hang, T = ch_tones(skin), dark = T.core;
    const vis = (al, e) => clamp(hVis(al, e) * 2.2, 0, 1);
    // eye sockets
    for (const s of [1, -1]) {
      const al = s * .42, v = vis(al, .02); if (v <= .05) continue;
      const q = HS(al, .02, .98), w = 2.1 * Math.max(.35, Math.cos(hd.yaw - al)) * (hd.hw / 7.6);
      g.fillStyle = css(mix(T.sh, [60, 40, 60], .2), .32 * v); g.beginPath(); g.ellipse(q[0], q[1] + .1, w * 1.25, 1.6, 0, 0, 7); g.fill();
      // brow ridge light
      const br = HS(al, .2, 1.01); g.fillStyle = css(T.lt, .25 * v); g.beginPath(); g.ellipse(br[0], br[1], w, .7, 0, 0, 7); g.fill();
      if (!closed) {
        g.fillStyle = css(mix([226, 220, 206], T.base, .3), .9 * v); g.beginPath(); g.ellipse(q[0], q[1] + .1, w * .75, .55, 0, 0, 7); g.fill();
        const ir = HS(al - .04 * Math.sin(hd.yaw - al) * 0, .0, 1.0); ch_dot(g, ir[0] + (sY > 0 ? .25 : -.25) * Math.abs(Math.sin(hd.yaw)), ir[1] + .15, .55, [34, 26, 26], .95 * v);
        ch_dot(g, ir[0] + .3, ir[1] - .1, .18, [255, 250, 240], .7 * v);
      }
      ch_stroke(g, [[q[0] - w * .85, q[1] + (closed ? .3 : -.1)], [q[0], q[1] - (closed ? -.4 : .55)], [q[0] + w * .85, q[1] + (closed ? .3 : -.05)]], .45, [30, 22, 24], .85 * v);
      if (B.old) ch_stroke(g, [[q[0] - w * .6, q[1] + 1.4], [q[0] + w * .6, q[1] + 1.3]], .3, dark, .35 * v);
      // brows
      const b0 = HS(s * .2, .22 + (B.old ? -.02 : 0), 1.03), b1 = HS(s * .4, .27, 1.03), b2 = HS(s * .66, .21, 1.02);
      if (vis(s * .4, .25) > .1) ch_stroke(g, [[b0[0], b0[1]], [b1[0], b1[1]], [b2[0], b2[1]]], B.fem ? .55 : .8, mix(mul(hairC, .7), [30, 24, 24], .3), .9 * vis(s * .4, .25));
    }
    // nose: bridge, side shadow, tip highlight
    const nb = HS(0, .06, 1.02), nt = HS(0, -.3, 1.2), nbase = HS(0, -.38, 1.04);
    const nl = HS(-.17, -.33, 1.02), nr = HS(.17, -.33, 1.02);
    const nVis = vis(0, -.2);
    if (nVis > .02 || Math.abs(Math.sin(hd.yaw)) > .5) {
      const poly = [nb, nt, nbase, Math.sin(hd.yaw) > 0 ? nr : nl];
      ch_fill(g, r, poly.map(p => [p[0], p[1]]), mix(skin, T.lt, .2), { n: 1, sharp: false, ink: false });
      const shSide = nt[0] < nb[0] ? nr : nl;
      ch_stroke(g, [[nb[0], nb[1] + .6], [lerp(nt[0], shSide[0], .4) - .2, nt[1] - .4], [nbase[0], nbase[1]]], .55, dark, .55);
      ch_dot(g, nt[0] + .35, nt[1] - .1, .45, T.hi, .55); ch_dot(g, nbase[0] - .2, nbase[1] + .5, .6, mul(T.core, .8), .45);
      if (Math.abs(Math.sin(hd.yaw)) > .55) { ch_poly(g, [[nb[0], nb[1]], [nt[0], nt[1]], [nbase[0], nbase[1]]]); g.strokeStyle = css(INK, .55); g.lineWidth = .45; g.stroke(); }
    }
    // mouth
    const mv = vis(0, -.56);
    if (mv > .05) {
      const m0 = HS(-.27, -.56, 1.0), m1 = HS(0, -.585, 1.04), m2 = HS(.27, -.56, 1.0), lip = HS(0, -.66, 1.03);
      const mc = mix(mul(T.core, .9), [120, 40, 40], .35);
      ch_stroke(g, [[m0[0], m0[1]], [m1[0], m1[1]], [m2[0], m2[1]]], .55, mc, .85 * mv);
      ch_dot(g, lip[0] + .3, lip[1], .6, T.lt, .35 * mv); ch_dot(g, lip[0], lip[1] + .9, .9, T.sh, .22 * mv);
      if (B.old) for (const s of [1, -1]) { if (vis(s * .3, -.45) < .2) continue; const a = HS(s * .2, -.33, 1.02), b = HS(s * .32, -.6, 1.0); ch_stroke(g, [[a[0], a[1]], [b[0], b[1]]], .35, dark, .4); }
    }
    // cheeks (warm), chin light, jaw shade on the shadow side
    for (const s of [1, -1]) { const v = vis(s * .55, -.25); if (v < .1) continue; const q = HS(s * .55, -.25, 1); g.fillStyle = css([226, 110, 96], (B.teen ? .2 : .12) * v); g.beginPath(); g.ellipse(q[0], q[1], 1.8, 1.2, 0, 0, 7); g.fill(); }
    const ch2 = HS(0, -.84, 1); if (vis(0, -.8) > .1) ch_dot(g, ch2[0] + .4, ch2[1] - .3, 1, T.lt, .25);
    if (B.old) { for (let k = 0; k < 2; k++) { const a = HS(-.3, .42 + k * .1, 1.02), b = HS(.3, .42 + k * .1, 1.02); if (vis(0, .45) > .3) ch_stroke(g, [[a[0], a[1]], [b[0], b[1]]], .3, dark, .3); } }
    if (B.b === 2 || B.old) { const q = HS(0, -1.05, .98); if (vis(0, -.9) > .1) ch_stroke(g, [HS(-.5, -.95, .98), q, HS(.5, -.95, .98)].map(p => [p[0], p[1]]), .5, dark, .35); }
    // stubble / five o'clock shadow for adult men with short dark hair
    if (!B.fem && !B.teen && (id === 'brune' || id === 'osk' || id === 'gregor' || id === 'dov' || id === 'tomas')) { g.save(); g.globalAlpha = .18; for (const s of [1, -1]) { const q = HS(s * .45, -.62, 1); g.fillStyle = css(mix(hairC, T.sh, .5)); g.beginPath(); g.ellipse(q[0], q[1], 2.2, 2, 0, 0, 7); g.fill(); } g.restore(); }
  };
  const drawEars = (g) => {
    for (const s of [1, -1]) {
      const al = s * 1.5, v = hVis(al, -.05);
      if (v < -.25) continue;
      if ((hsN === 'long' || hsN === 'bob') && true) continue;
      const q = HS(al, -.08, 1.0), w = 1.1 * Math.max(.25, Math.abs(Math.sin(hd.yaw - al))) + .35;
      ch_fill(g, r, ellPts(q[0], q[1], w, hd.hh * .22, 10), mix(skin, [220, 120, 100], .12), { n: 1, inka: .45, inkw: .4, flat: .5, fx: (g2) => { ch_stroke(g2, [[q[0] - w * .2, q[1] - 1.5], [q[0] + w * .25, q[1] + .3], [q[0] - w * .1, q[1] + 1.6]], .4, ch_tones(skin).core, .6); } });
    }
  };
  const drawSideHair = (g) => {   // bob/long curtains in front of the ears; fringe flicks
    if (hsN === 'long' || hsN === 'bob') {
      for (const s of [1, -1]) {
        const al = s * 1.25; if (hVis(al, -.2) < -.45) continue;
        const endE = hsN === 'bob' ? -1.0 : -1.25, pts = [];
        for (const e of [.5, 0, -.5, endE]) pts.push(HS(al - s * .15, e, HST.vol * 1.02));
        for (const e of [endE, -.5, 0, .5]) pts.push(HS(al + s * .5, e, HST.vol * 1.04));
        if (hsN === 'long') { const lo = HS(al + s * .25, -1.3, HST.vol); pts.push([lo[0], lo[1] + H * .07]); }
        const hull = ch_hull(pts.map(p => ext(p, 1)));
        ch_fill(g, r, hull, hairC, { ax: [0, 1], n: 6, sw: .6, sl: 6, inka: .55, fx: (g2) => { const bb = ch_bb(hull); for (let i = 0; i < 6; i++) { const x = bb[0] + r() * (bb[2] - bb[0]); ch_stroke(g2, [[x, bb[1]], [x + (r() - .5), bb[3]]], .4, r() < .5 ? hairT.core : hairT.lt, .45); } } });
      }
      if (hsN === 'bob' && hVis(0, .35) > 0) { // straight fringe
        const pts = []; for (let i = 0; i <= 8; i++) { const a = -.95 + i / 8 * 1.9; pts.push(HS(a, .26, HST.vol * 1.02)); } for (let i = 8; i >= 0; i--) { const a = -.95 + i / 8 * 1.9; pts.push(HS(a, .62, HST.vol * 1.04)); }
        ch_fill(g, r, pts, hairC, { n: 4, sw: .5, inka: .5, ax: [0, 1] });
      }
    }
    if ((hsN === 'short' || hsN === 'curly') && hVis(0, .5) > 0) {   // a few loose strands over the forehead
      for (let k = 0; k < 4; k++) { const a = hd.yaw * 0 + (-.4 + k * .27), p0 = HS(a, .7, HST.vol), p1 = HS(a + .1, .42 - r() * .08, 1.02); ch_stroke(g, [[p0[0], p0[1]], [p1[0], p1[1]]], .6, k % 2 ? hairT.base : hairT.core, .85); }
    }
  };
  const drawHat = (g) => {
    const capped = hsN === 'cap' || id === 'brune';
    if (!capped) return;
    const peaked = id === 'brune', col = peaked ? mix(oc, [30, 30, 40], .3) : mix(oc, [70, 60, 50], .35);
    const crown = []; for (let i = 0; i < 16; i++) for (const e of [.3, .7, 1.1, 1.45]) crown.push(HS(i / 16 * 6.2832 + .1, e, (peaked ? 1.16 : 1.14) + (e > 1 ? (peaked ? .14 : .02) : 0)));
    const ch = ch_hull(crown.map(p => [p[0], p[1] - (peaked ? 1.6 : 0)]).map(p => ext(p, 1)));
    // brim (front)
    const brim = []; for (let i = 0; i <= 10; i++) { const a = -1.25 + i / 10 * 2.5; brim.push(HS(a, .36, 1.16)); } for (let i = 10; i >= 0; i--) { const a = -1.0 + i / 10 * 2.0, q = headPt(a, .3, 1.55); brim.push(toS([0, q[1] - 1, q[2] + 1.5, q[3]])); }
    const brimVis = hVis(0, .3) > -.3;
    if (!brimVis) ch_fill(g, r, brim.map(p => ext(p, 1)), mul(col, .7), { n: 2, inka: .8, sharp: true });
    ch_fill(g, r, ch, col, { ax: [0, 1], n: 8, sw: 1, inka: .75, fx: (g2) => { const b = ch_bb(ch); if (peaked) { const band = ringH(.4, 1.16); ch_stroke(g2, band, 2, [30, 26, 26], .9); } else ch_stroke(g2, [[b[0] + 1, b[1] + 3], [b[2] - 2, b[1] + 2]], .6, ch_tones(col).lt, .5); } });
    if (brimVis) { ch_fill(g, r, brim.map(p => ext(p, 1)), mul(col, peaked ? .5 : .85), { n: 2, inka: .8, sharp: true }); }
    if (peaked && hVis(0, .7) > 0) { const q = HS(0, .72, 1.3); ch_dot(g, q[0], q[1], 1.3, [214, 180, 90]); ch_dot(g, q[0], q[1], .6, [170, 40, 40]); }
  };
  const ringH = (e, rad) => { const pts = []; for (let i = 0; i <= 16; i++) { const a = hd.yaw - Math.PI / 2 + i / 16 * Math.PI; pts.push(HS(a, e, rad)); } return pts.map(p => [p[0], p[1]]); };
  const drawGlasses = (g) => {
    if (!L.glasses) return;
    const col = [30, 26, 28];
    const eyes = [];
    for (const s of [1, -1]) {
      const al = s * .42, v = hVis(al, .02);
      const q = HS(al, .02, 1.1), cosb = Math.cos(hd.yaw - al), w = 2.3 * Math.max(.18, cosb) + .3;
      if (cosb > -.05 && v > -.1) { g.strokeStyle = css(col, .95); g.lineWidth = .5; g.beginPath(); g.ellipse(q[0], q[1], w, 1.75, 0, 0, 7); g.stroke(); eyes.push(q);
        g.strokeStyle = css([255, 252, 236], .85); g.lineWidth = .5; g.beginPath(); g.moveTo(q[0] + w * .1, q[1] - 1.1); g.lineTo(q[0] + w * .65, q[1] - .3); g.stroke(); }
      const t0 = HS(s * .95, .05, 1.05), t1 = HS(s * 1.5, .0, 1.04);
      if (hVis(s * 1.25, .05) > -.3) ch_stroke(g, [[t0[0], t0[1]], [t1[0], t1[1]]], .45, col, .9);
    }
    if (hVis(0, .03) > 0) { const a = HS(-.2, .05, 1.1), b = HS(.2, .05, 1.1); ch_stroke(g, [[a[0], a[1]], [b[0], b[1]]], .45, col, .95); }
  };
  const drawHead = (g) => {
    const sil = headSil();
    // hair shell (behind the face), then the face over it
    if (hsN !== 'bald') drawHairShell(g);
    // skin
    g.save();
    if (hsN !== 'bald') { ch_path(g, sil); g.clip(); clipAbove(g, hairArc(HST.line, 1.0), -1); }
    const bb = ch_bb(sil);
    ch_fill(g, r, sil, skin, { ax: [0, 1], sx: 0, n: 8, sw: 1, sl: 5, top: .08, bot: .2, inka: .7, inkw: .55, fx: (g2) => {
      // planes of the face: shade the side away from the light, temple + under-cheek shadow
      const fc = HS(0, -.2, 1), sideSh = HS(Math.sin(hd.yaw) > 0 ? .9 : -.9, -.3, 1);
      g2.fillStyle = css(ch_tones(skin).sh, .18); g2.beginPath(); g2.ellipse(Math.min(fc[0], sideSh[0]) - 1, fc[1], 3.4, 5, 0, 0, 7); g2.fill();
    } });
    g.restore();
    if (hsN === 'bald') { drawHairShell(g); const q = HS(hd.yaw - .5, 1.0, 1.0); ch_dot(g, q[0] + .8, q[1], 1.8, [255, 240, 214], .35); ch_dot(g, q[0] + 1, q[1] - .2, .8, [255, 248, 230], .5); }
    if (cY > -.05 || Math.abs(sY) > .3) drawFace(g);
    drawEars(g);
    drawSideHair(g);
    drawGlasses(g);
    drawHat(g);
    if (M.hang) { ch_path(g, sil); g.fillStyle = 'rgba(10,10,24,.42)'; g.fill(); }
  };
  // back hair & braid & head parts
  const backD = headC[2] - hd.hd * (cY > 0 ? 1.4 : -1.4) * 1;
  if (hsN === 'long' || hsN === 'bob' || hsN === 'bun') part(cY > 0 ? Math.min(backD, torsoD - 1) : backD + 50, drawBackHair);
  if (hsN === 'braid') part(cY > -.2 ? headC[2] + 8 : torsoD - 2, drawBraid);
  part(Math.max(headC[2], torsoD + .5) + (cY >= 0 ? 0 : 0) + 2.2, drawHead);

  /* ---------- FURNITURE: chair / wheelchair / hanging rope */
  if (M.sit && !M.wheel) {
    const seat = H * .265, f0 = pel[2] - B.hipD - 2, f1 = pel[2] + B.thighL * .7, wd = B.hipW + 5, wood = [104, 70, 44];
    const SP = (a, y, f) => PE([a, y, f], 1);
    const seatPoly = [SP(-wd, seat, f0), SP(wd, seat, f0), SP(wd, seat, f1), SP(-wd, seat, f1)];
    const legsC = [[-wd + 1.5, f0 + 1.5], [wd - 1.5, f0 + 1.5], [wd - 1.5, f1 - 1.5], [-wd + 1.5, f1 - 1.5]];
    const backTop = seat + H * .27;
    const chairBack = (g) => { for (const s of [-1, 1]) { const a = SP(s * (wd - 1.5), seat, f0 + .5), b = SP(s * (wd - 1.8), backTop, f0 - 2.5); ch_stroke(g, [[a[0], a[1]], [b[0], b[1]]], 2.2, wood, 1); ch_stroke(g, [[a[0], a[1]], [b[0], b[1]]], .5, INK, .5); }
      const s0 = [SP(-wd + 1, backTop - 1, f0 - 2.5), SP(wd - 1, backTop - 1, f0 - 2.5), SP(wd - 1, backTop - 8, f0 - 2), SP(-wd + 1, backTop - 8, f0 - 2)]; ch_fill(g, r, s0, mul(wood, 1.1), { sharp: true, n: 4, inka: .8, ax: [1, 0] }); };
    part(P([0, seat, f0 - 2])[2] - (cY > 0 ? 6 : -60), chairBack);
    part(standing ? -200 : -150, (g) => {
      for (const lc of legsC) { const a = SP(lc[0], seat, lc[1]), b = SP(lc[0], 0, lc[1]); ch_stroke(g, [[a[0], a[1]], [b[0], b[1]]], 2, mul(wood, .8), 1); ch_stroke(g, [[a[0] + .6, a[1]], [b[0] + .6, b[1]]], .5, [200, 150, 100], .4); }
      ch_fill(g, r, seatPoly, wood, { sharp: true, n: 5, inka: .85, ax: [1, 0] });
      const e0 = SP(-wd, seat - 1.5, f1), e1 = SP(wd, seat - 1.5, f1); ch_stroke(g, [[e0[0], e0[1]], [e1[0], e1[1]]], 1.8, mul(wood, .65), 1);
    });
  }
  if (M.wheel) {
    const seat = H * .285, wr = H * .175, wf = pel[2] - 3, wa = B.hipW + 6.5, steel = [150, 154, 160], dark = [34, 32, 36];
    const wheel = (s, g) => {
      const ptsO = [], ptsI = []; for (let i = 0; i <= 28; i++) { const a = i / 28 * 6.2832; ptsO.push(PE([s * wa, wr + Math.sin(a) * wr, wf + Math.cos(a) * wr], 1)); ptsI.push(P([s * (wa - .5), wr + Math.sin(a) * wr * .86, wf + Math.cos(a) * wr * .86])); }
      ch_stroke(g, ptsO, 3.2, dark, 1); ch_stroke(g, ptsO, 1, [70, 70, 76], .9); ch_stroke(g, ptsI, .7, steel, .9);
      const c = P([s * wa, wr, wf]); g.strokeStyle = css(steel, .55); g.lineWidth = .35; for (let k = 0; k < 12; k++) { const q = ptsI[Math.round(k * 28 / 12) % 28]; g.beginPath(); g.moveTo(c[0], c[1]); g.lineTo(q[0], q[1]); g.stroke(); }
      ch_dot(g, c[0], c[1], 1.2, [190, 190, 196]); const lit = ptsO.slice(18, 26); ch_stroke(g, lit, .5, [255, 200, 140], .5);
      // caster
      const cc = PE([s * (B.hipW + 3), H * .035, pel[2] + B.thighL + 8], 2); ch_fill(g, r, ellPts(cc[0], cc[1], 1.6 * Math.max(.4, Math.abs(sY)) + .5, H * .035, 10), dark, { n: 1, inka: .8 });
      const st0 = P([s * (B.hipW + 3), H * .07, pel[2] + B.thighL + 8]), st1 = P([s * (B.hipW + 3), seat - 2, pel[2] + B.thighL]); ch_stroke(g, [[cc[0], cc[1]], [st0[0], st0[1]], [st1[0], st1[1]]], .9, steel, 1);
    };
    const frame = (g) => {   // back posts, handles, seat, footrest
      for (const s of [-1, 1]) {
        const b0 = P([s * (B.hipW + 3), seat - 3, pel[2] - B.hipD - 3]), b1 = PE([s * (B.hipW + 3), seat + H * .3, pel[2] - B.hipD - 5], 1), b2 = PE([s * (B.hipW + 3), seat + H * .3 + 1, pel[2] - B.hipD - 13], 1);
        ch_stroke(g, [[b0[0], b0[1]], [b1[0], b1[1]], [b2[0], b2[1]]], 1.1, steel, 1); ch_stroke(g, [[b1[0], b1[1]], [b2[0], b2[1]]], 1.8, dark, 1);
        const a0 = P([s * (B.hipW + 3), seat + H * .1, pel[2] - B.hipD - 3]), a1 = P([s * (B.hipW + 3), seat + H * .1, pel[2] + B.thighL * .55]); ch_stroke(g, [[a0[0], a0[1]], [a1[0], a1[1]]], 1.4, dark, 1);
      }
      const bk = [P([-(B.hipW + 3), seat + 2, pel[2] - B.hipD - 3]), P([B.hipW + 3, seat + 2, pel[2] - B.hipD - 3]), P([B.hipW + 3, seat + H * .27, pel[2] - B.hipD - 4.5]), P([-(B.hipW + 3), seat + H * .27, pel[2] - B.hipD - 4.5])];
      ch_fill(g, r, bk.map(p => [p[0], p[1]]), [46, 44, 52], { sharp: true, n: 3, inka: .8, ax: [1, 0] });
    };
    const front2 = (g) => { const fp = [PE([-(B.hipW + 2), H * .06, pel[2] + B.thighL + 2], 1), PE([B.hipW + 2, H * .06, pel[2] + B.thighL + 2], 1), PE([B.hipW + 2, H * .06, pel[2] + B.thighL + 12], 1), PE([-(B.hipW + 2), H * .06, pel[2] + B.thighL + 12], 1)]; ch_fill(g, r, fp, [60, 60, 66], { sharp: true, n: 1, inka: .8 }); const sp = [P([-(B.hipW + 2), seat - 1, pel[2] - B.hipD]), P([B.hipW + 2, seat - 1, pel[2] - B.hipD]), P([B.hipW + 2, seat - 1, pel[2] + B.thighL * .8]), P([-(B.hipW + 2), seat - 1, pel[2] + B.thighL * .8])]; ch_fill(g, r, sp.map(p => [p[0], p[1]]), [40, 38, 44], { sharp: true, n: 1, inka: .7 }); };
    const nearS = (V0.Rd >= 0) ? 1 : -1;
    part(cY > 0 ? -160 : 60, frame);
    part(-150, front2);
    part(-140 + (P([-nearS * wa, wr, wf])[2]) * .01, (g) => wheel(-nearS, g));
    part(torsoD + 2.6, (g) => wheel(nearS, g));
  }
  if (M.hang) {
    const left = (yawDeg < -10 && yawDeg > -170);
    const topW = [(left ? -24 : 24) / CH_PX, -150 / CH_PX];
    part(-300, (g) => {
      const nk = P(ub([0, B.neckY - B.hipY + 1, -2])); const k0 = [nk[0] + (left ? -1 : 1) * 3, nk[1] - 3];
      ext(topW, 2);
      ch_stroke(g, [[k0[0], k0[1]], [lerp(k0[0], topW[0], .5) + 1, lerp(k0[1], topW[1], .5)], topW], 2, INK, .9);
      ch_stroke(g, [[k0[0], k0[1]], [lerp(k0[0], topW[0], .5) + 1, lerp(k0[1], topW[1], .5)], topW], 1.2, [184, 150, 100], 1);
    });
    part(1000, (g) => { // noose knot at the neck (over the collar)
      const nk = P(ub([0, B.neckY - B.hipY + 1, 0])); ch_stroke(g, [[nk[0] - B.rNeck, nk[1] + 1], [nk[0], nk[1] + 2.5], [nk[0] + B.rNeck, nk[1] + .5]], 1.5, [176, 142, 96], .9);
    });
  }

  /* ---------- paint */
  parts.sort((a, b) => a.d - b.d);
  const pad = 4, sc = CH_PX * SS;
  // run once to compute bounds (geometry registers via ext), drawing into a 1x1 scratch is wasteful -> bounds are
  // gathered by a dry pass on a cheap context recorder
  const dry = ch_dryCtx();
  for (const p of parts) p.fn(dry);
  ext([0, 0], 6);
  const W = Math.ceil((bx1 - bx0 + pad * 2) * sc), Hh = Math.ceil((by1 - by0 + pad * 2) * sc);
  const c = mk(W, Hh), g = ctx2(c), ox = (-bx0 + pad) * sc, oy = (-by0 + pad) * sc;
  g.setTransform(sc, 0, 0, sc, ox, oy);
  post.length = 0;
  for (const p of parts) p.fn(g);
  g.setTransform(1, 0, 0, 1, 0, 0);
  return { c, W, H: Hh, ox, oy, M, post, sc };
}
/* a no-op 2D context used for the bounds pass */
let ch_dryC = null;
function ch_dryCtx() {
  if (ch_dryC) return ch_dryC;
  const noop = function () {}, grad = { addColorStop: noop };
  ch_dryC = new Proxy({}, { get: (t, k) => k === 'createLinearGradient' || k === 'createRadialGradient' ? () => grad : (k in t ? t[k] : noop), set: (t, k, v) => { t[k] = v; return true; } });
  return ch_dryC;
}

/* ---------------------------------------------------------------- finishing: texture, occlusion, rim light, ink contour */
function ch_finish(src, W, H, rimCol, groundY, dark) {
  const g = ctx2(src);
  // brush texture + vertical occlusion (cool, darker towards the ground), source-atop
  g.save(); g.globalCompositeOperation = 'source-atop';
  g.fillStyle = g.createPattern(ch_tex(), 'repeat'); g.fillRect(0, 0, W, H);
  const vg = g.createLinearGradient(0, 0, 0, groundY);
  vg.addColorStop(0, 'rgba(255,220,170,.05)'); vg.addColorStop(.45, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(16,18,40,.34)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
  if (dark) { g.fillStyle = 'rgba(12,14,30,' + dark + ')'; g.fillRect(0, 0, W, H); }
  g.restore();
  const out = mk(W, H), og = ctx2(out), k = SS;
  // rim lights
  const tmp = mk(W, H), tg = ctx2(tmp);
  tg.drawImage(src, 0, 0); tg.globalCompositeOperation = 'destination-out'; tg.drawImage(src, -1.0 * k, .7 * k); tg.globalCompositeOperation = 'source-in'; tg.fillStyle = css(rimCol, .4); tg.fillRect(0, 0, W, H);
  const tmp2 = mk(W, H), t2 = ctx2(tmp2);
  t2.drawImage(src, 0, 0); t2.globalCompositeOperation = 'destination-out'; t2.drawImage(src, 1.3 * k, -.2 * k); t2.globalCompositeOperation = 'source-in'; t2.fillStyle = 'rgba(80,140,165,.3)'; t2.fillRect(0, 0, W, H);
  // ink contour (dilated silhouette)
  const R = 1.05 * k;
  for (let i = 0; i < 10; i++) { const a = i / 10 * 6.2832; og.drawImage(src, Math.cos(a) * R, Math.sin(a) * R); }
  og.globalCompositeOperation = 'source-in'; og.fillStyle = 'rgb(18,13,18)'; og.fillRect(0, 0, W, H);
  og.globalCompositeOperation = 'source-over'; og.drawImage(src, 0, 0); og.drawImage(tmp2, 0, 0); og.drawImage(tmp, 0, 0);
  return out;
}
/* lying figures: the front view laid flat along the floor (head towards the facing direction) */
function ch_lay(img, yawDeg) {
  const th = yawDeg * Math.PI / 180, hu = Math.sin(th), hv = Math.cos(th);
  // image x -> floor (-hv, hu) ; image down -> floor (-hu, -hv); floor (u,v) -> screen (u, v*.5)
  const a = -hv, b = hu * CH_DK, cc = -hu, d = -hv * CH_DK;
  const corners = [[0, 0], [img.W, 0], [img.W, img.H], [0, img.H]].map(([x, y]) => { const X = x - img.ox, Y = y - img.oy + img.M.B.H * .52 * CH_PX * SS; return [a * X + cc * Y, b * X + d * Y]; });
  const bb = ch_bb(corners), pad = 6, W = Math.ceil(bb[2] - bb[0] + pad * 2), H = Math.ceil(bb[3] - bb[1] + pad * 2);
  const c = mk(W, H), g = ctx2(c), ox = -bb[0] + pad, oy = -bb[1] + pad;
  g.setTransform(a, b, cc, d, ox, oy - 8 * CH_PX * SS);
  g.drawImage(img.c, -img.ox, -img.oy + img.M.B.H * .52 * CH_PX * SS);
  g.setTransform(1, 0, 0, 1, 0, 0);
  return { c, W, H, ox, oy, M: img.M };
}
/* soft painted ground shadow for a pose (optional extra on the sprite) */
const ch_shC = new Map();
function ch_shadow(kind, wcm) {
  const k = kind + ':' + Math.round(wcm); let s = ch_shC.get(k); if (s) return s;
  const rx = wcm * CH_PX * SS, ry = rx * (kind === 'lie' ? .45 : .36), W = Math.ceil(rx * 2.6), H = Math.ceil(ry * 2.8), c = mk(W, H), g = ctx2(c), r = RNG(k);
  const gr = g.createRadialGradient(W / 2, H / 2, 1, W / 2, H / 2, rx); gr.addColorStop(0, 'rgba(8,6,16,.55)'); gr.addColorStop(.6, 'rgba(8,6,16,.22)'); gr.addColorStop(1, 'rgba(8,6,16,0)');
  g.save(); g.translate(W / 2, H / 2); g.scale(1, ry / rx); g.translate(-W / 2, -H / 2); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
  g.lineCap = 'round'; for (let i = 0; i < 26; i++) { const a = r() * 6.28, d = r() * .8; g.strokeStyle = 'rgba(8,6,16,' + (.04 + r() * .06) + ')'; g.lineWidth = 2 + r() * 5; const x = W / 2 + Math.cos(a) * rx * d, y = H / 2 + Math.sin(a) * ry * d; g.beginPath(); g.moveTo(x - 6, y); g.lineTo(x + 6, y + (r() - .5) * 2); g.stroke(); }
  s = { c, w: W, h: H, ax: W / 2, ay: H / 2 }; ch_shC.set(k, s); return s;
}

/* ---------------------------------------------------------------- sprite cache + public API */
function figKey(L, facing, frame, id) { const pose = L.pose || 'stand'; return lookKey(L) + '#' + (id || '') + '#' + pose + '#' + facing + '#' + ((pose === 'stand' || pose === 'slump' || pose === 'lean') ? frame : 0); }
const _warmQ = [], ch_pend = new Set();
function queueFigure(look, facing, frame, pose) {
  const L = normLook(look); if (pose) L.pose = pose; const k = figKey(L, FACE_ALIAS[facing] || facing, frame || 0, ch_idOf(look));
  if (ch_pend.has(k) || _spr.has(k)) return; ch_pend.add(k); _warmQ.push([look, facing, frame, pose, k]);
}
function warmStep(maxN) {   // bake queued sprites one at a time (called with spare frame time)
  while (maxN-- > 0 && _warmQ.length) { const q = _warmQ.shift(); ch_pend.delete(q[4]); getFigure(q[0], q[1], q[2], q[3]); }
}
function ch_now() { return typeof performance !== 'undefined' ? performance.now() : Date.now(); }
/* returns a ready sprite without ever blocking on animation frames: walk frames (and the idle weight shift) fall back to
 * the idle sprite while they are baked in the background */
function figureNow(look, facing, frame, pose) {
  const L = normLook(look); if (pose) L.pose = pose; facing = FACE_ALIAS[facing] || facing; if (FACE[facing] === undefined) facing = 's';
  const id = ch_idOf(look), p = L.pose || 'stand';
  if (!frame && (p === 'stand' || p === 'lean')) {   // subtle idle variation: every few seconds a short weight shift / glance
    const ph = ((ch_now() / 1000) + (hashStr(id || lookKey(L)) % 97) * .37) % 7.5;
    if (ph > 5.6) frame = -1;
  }
  const hit = _spr.get(figKey(L, facing, frame, id)); if (hit) return hit;
  if (frame !== 0) {
    if (frame > 0) { for (let f = 1; f <= 4; f++) if (!_spr.get(figKey(L, facing, f, id))) queueFigure(look, facing, f, pose); }
    else queueFigure(look, facing, -1, pose);
    const idle = _spr.get(figKey(L, facing, 0, id)); if (idle) return idle;
    return getFigure(look, facing, 0, pose);
  }
  return getFigure(look, facing, frame, pose);
}
function getFigure(look, facing, frame, poseOver) {
  const L = normLook(look); if (poseOver) L.pose = poseOver;
  facing = FACE_ALIAS[facing] || facing; if (FACE[facing] === undefined) facing = 's';
  const pose = L.pose || 'stand', id = ch_idOf(look);
  frame = frame || 0;
  const key = figKey(L, facing, frame, id);
  let spr = _spr.get(key); if (spr) return spr;
  const anim = pose === 'stand' || pose === 'slump' || pose === 'lean';
  const fr = anim ? frame : 0, yaw = FACE[facing];
  let img;
  if (pose === 'lie') img = ch_lay(ch_render(L, id, 0, 'lie', 0, false), yaw);
  else img = ch_render(L, id, yaw, pose, fr > 0 ? fr : 0, fr < 0);
  const rim = C(look && look._rim || [255, 156, 80]);
  const out = ch_finish(img.c, img.W, img.H, rim, img.oy, pose === 'hang' ? .38 : 0);
  if (img.post && img.post.length) { const og = ctx2(out); og.setTransform(img.sc, 0, 0, img.sc, img.ox, img.oy); for (const fn of img.post) fn(og); og.setTransform(1, 0, 0, 1, 0, 0); }
  const B = img.M.B;
  spr = { c: out, ax: img.ox, ay: img.oy, w: img.W, h: img.H, hl: null, hang: null };
  if (pose === 'hang') { const left = (yaw < -10 && yaw > -170); spr.hang = { x: left ? -24 : 24, y: -150 }; }
  spr.sh = ch_shadow(pose === 'lie' ? 'lie' : (pose === 'wheelchair' || pose === 'sit') ? 'sit' : 'stand', pose === 'lie' ? B.H * .55 : pose === 'wheelchair' ? 46 : pose === 'sit' ? 38 : 30 + B.b * 4);
  _spr.set(key, spr);
  if (_spr.size > 700) { const k = _spr.keys().next().value; _spr.delete(k); }
  return spr;
}
function greenOutline(spr) {
  if (spr.hl) return spr.hl;
  const W = spr.c.width, H = spr.c.height, c = mk(W, H), g = ctx2(c), R = 2.3 * SS * .8;
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.2832; g.drawImage(spr.c, Math.cos(a) * R, Math.sin(a) * R); }
  g.globalCompositeOperation = 'source-in'; g.fillStyle = 'rgb(96,255,120)'; g.fillRect(0, 0, W, H);
  const c2 = mk(W, H), g2 = ctx2(c2); g2.globalAlpha = .35; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.2832; g2.drawImage(c, Math.cos(a) * R * 1.8, Math.sin(a) * R * 1.8); }
  g2.globalAlpha = 1; g2.drawImage(c, 0, 0);
  spr.hl = c2; return c2;
}
