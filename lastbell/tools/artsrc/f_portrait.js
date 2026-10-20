
/* =============================================== PIXEL-ART PORTRAITS
 * Procedural 64x64, ~17 colour palette, 4x4 ordered dithering, nearest-neighbour upscale.
 * This function is the swap-in seam for Moonkai output: replace buildPortraitBuffer(look,opts) and
 * return a 64x64 canvas; the painted badge and upscaling are done by drawPortraitImpl.            */
const BAYER4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const _pbuf = new Map();
function ramp3(c, cool) { c = C(c); return [mix(mul(c, .5), [20, 24, 60], cool === undefined ? .32 : cool), c, mix(c, [255, 232, 196], .38)]; }
function inEll(x, y, cx, cy, rx, ry) { const dx = (x - cx) / rx, dy = (y - cy) / ry; return dx * dx + dy * dy; }
function inPoly(x, y, pts) { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { if (((pts[i][1] > y) !== (pts[j][1] > y)) && (x < (pts[j][0] - pts[i][0]) * (y - pts[i][1]) / (pts[j][1] - pts[i][1]) + pts[i][0])) c = !c; } return c; }

function buildPortraitBuffer(look, opts) {
  const L = normLook(look), mood = (opts && opts.mood) || 'neutral', tint = opts && opts.tint ? C(opts.tint) : null;
  const key = JSON.stringify([lookKey(L), L.pose === 'wheelchair' ? 1 : 0, mood, opts && opts.tint, opts && opts.bg]);
  let hit = _pbuf.get(key); if (hit) return hit;
  const N = 64, M = new Uint8Array(N * N), SH = new Float32Array(N * N), Z = new Uint8Array(N * N);
  const build = L.build === 'heavy' ? 1 : L.build === 'slim' ? -1 : 0, old = L.age === 'old', teen = L.age === 'teen';
  const hcx = 32, hcy = 26 + (teen ? 1 : 0), hrx = 12.4 + build * 1.6 - (teen ? .6 : 0), hry = 15.2 + (teen ? -.6 : 0) + (old ? .4 : 0);
  const sw = 23 + build * 4.5;
  const ID = { bg: 0, skin: 1, hair: 2, out: 3, acc: 4, shirt: 5, ink: 6, white: 7, dark: 8, lip: 9 };
  const light = [.55, -.55, .62];
  const put = (x, y, m, sh, z) => { if (x < 0 || y < 0 || x >= N || y >= N) return; const i = y * N + x; M[i] = m; SH[i] = sh; Z[i] = z; };
  // --- background: dithered glow
  const bgC = opts && opts.bg ? C(opts.bg) : mix(mul(C(L.outfitColor), .5), [30, 56, 60], .6);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const d = Math.hypot(x - 36, y - 24) / 44; put(x, y, ID.bg, Math.min(.999, Math.round(clamp(1 - d * 1.1, 0, 1) * 2) / 2), 0); }
  const shadeEll = (x, y, cx, cy, rx, ry) => { const nx = (x - cx) / rx, ny = (y - cy) / ry, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)); return clamp(.52 + (nx * light[0] + ny * light[1] + nz * light[2]) * .62 - .22, 0, 1); };
  // --- back hair (long / braid / bob / bun)
  const hs = L.hairStyle || 'short';
  if (hs === 'long') for (let y = 14; y < 58; y++) for (let x = 14; x < 51; x++) { const e = inEll(x, y, 32, 30, 19.5, 22); if (e < 1 && y < 58) put(x, y, ID.hair, clamp(.4 + (x - 32) * .012, 0, 1), 1); }
  if (hs === 'bob') for (let y = 12; y < 42; y++) for (let x = 12; x < 53; x++) { if (inEll(x, y, 32, 26, 20, 17) < 1 || (y > 26 && y < 42 && x > 14 && x < 50 && inEll(x, y, 32, 30, 19, 14) < 1)) put(x, y, ID.hair, .45 + (x - 32) * .01, 1); }
  // --- shoulders / outfit
  const outShape = (x, y) => { // shoulders silhouette
    const top = 45 - Math.max(0, 1 - Math.abs(x - 32) / 8) * 2; if (y < top) return false;
    const dx = Math.abs(x - 32); const edge = sw - Math.max(0, (y < 52 ? (52 - y) * .7 : 0)) - Math.max(0, dx - (sw - 7)) * 0;
    return dx < edge && (y > 47 || dx < 12 + (y - 45) * 6);
  };
  for (let y = 44; y < N; y++) for (let x = 0; x < N; x++) if (outShape(x, y)) { const nx = (x - 32) / sw; put(x, y, ID.out, clamp(.5 + nx * .45 - (y - 44) * .008 + ((x + y) % 7 === 0 ? .04 : 0), 0, 1), 2); }
  // shirt / inner garment region + details by outfit
  const o = L.outfit;
  const inShirt = (x, y) => y >= 46 && Math.abs(x - 32) < 5 + (y - 46) * .55 && y < 64;
  if (o === 'suit' || o === 'uniform' || o === 'coat' || o === 'cardigan' || o === 'labcoat' || o === 'shirtsleeves') for (let y = 44; y < N; y++) for (let x = 0; x < N; x++) if (outShape(x, y) && inShirt(x, y) && (o !== 'shirtsleeves' && o !== 'labcoat')) put(x, y, ID.shirt, clamp(.55 + (x - 32) * .02, 0, 1), 3);
  if (o === 'shirtsleeves') for (let y = 44; y < N; y++) for (let x = 0; x < N; x++) if (outShape(x, y)) { put(x, y, ID.shirt, clamp(.6 + (x - 32) * .02 - (y - 44) * .004, 0, 1), 3); }
  if (o === 'labcoat') for (let y = 44; y < N; y++) for (let x = 0; x < N; x++) if (outShape(x, y) && Math.abs(x - 32) < 3.5 + (y - 46) * .3 && y > 46) put(x, y, ID.shirt, .4, 3);
  if (o === 'apron') for (let y = 52; y < N; y++) for (let x = 0; x < N; x++) if (outShape(x, y) && Math.abs(x - 32) < 14 && y > 52) put(x, y, ID.shirt, clamp(.65 + (x - 32) * .01, 0, 1), 3);
  if (o === 'overalls') for (let y = 50; y < N; y++) for (let x = 0; x < N; x++) if (outShape(x, y) && Math.abs(x - 32) < 14) put(x, y, ID.out, .45 + (x - 32) * .01, 3);
  // neck
  for (let y = 38; y < 50; y++) for (let x = 24; x < 41; x++) { const nx = (x - 32) / 6; if (Math.abs(nx) < 1 && !(Z[y * N + x] >= 3 && M[y * N + x] !== ID.skin)) { if (Z[y * N + x] < 2 || y < 47) put(x, y, ID.skin, clamp(.22 + (y < 46 ? 0 : .05) + nx * .12 + (y > 44 ? 0 : -.1), 0, 1), 3); } }
  // collar / tie details
  const accDet = [];
  const dot = (x, y, m, sh) => put(x, y, m, sh, 5);
  if (o === 'suit') { for (let y = 47; y < 64; y++) { const w = (y - 46) * .12 + .8; for (let x = 32 - Math.ceil(w); x <= 32 + Math.floor(w); x++) put(x, y, ID.acc, .45 + ((y & 1) ? .15 : 0), 5); } for (let k = 0; k < 14; k++) { put(27 - Math.floor(k / 4), 46 + k, ID.out, .75, 5); put(37 + Math.floor(k / 4), 46 + k, ID.out, .75, 5); } }
  if (o === 'uniform') { for (let x = 24; x <= 40; x++) for (let y = 44; y < 49; y++) if (Math.abs(x - 32) > 2 && y < 49 - Math.abs(x - 32) * .05 + 1) put(x, y, ID.acc, .62, 5); for (let k = 0; k < 4; k++) put(32, 50 + k * 4, ID.acc, .9, 5); for (const sx of [32 - sw + 4, 32 + sw - 4]) { for (let q = 0; q < 6; q++) put(sx + q - 3, 49 + (q >> 1), ID.acc, .8, 5); } }
  if (o === 'coat') { for (let k = 0; k < 18; k++) { put(25 - (k >> 2), 44 + k, ID.out, .78, 5); put(39 + (k >> 2), 44 + k, ID.out, .78, 5); } for (let x = 25; x <= 39; x++) { put(x, 45, ID.acc, .5, 5); put(x, 46, ID.acc, .66, 5); } }
  if (o === 'apron') { for (let y = 46; y < 54; y++) { put(32 - 12 + Math.floor((y - 46) * .3), y, ID.acc, .7, 5); put(32 + 12 - Math.floor((y - 46) * .3), y, ID.acc, .7, 5); } for (let x = 29; x < 36; x++) for (let y = 58; y < 62; y++) put(x, y, ID.acc, .6, 5); }
  if (o === 'overalls') { for (let y = 46; y < 54; y++) { put(24 + ((y - 46) >> 1), y, ID.out, .75, 5); put(40 - ((y - 46) >> 1), y, ID.out, .75, 5); } put(25, 52, ID.acc, .9, 5); put(39, 52, ID.acc, .9, 5); }
  if (o === 'tracksuit') { for (let y = 46; y < 64; y++) { put(32, y, ID.ink, .5, 5); if (y > 48) { put(25, y, ID.acc, .7, 5); put(39, y, ID.acc, .7, 5); } } put(32, 47, ID.acc, .9, 5); }
  if (o === 'cardigan') { for (let y = 46; y < 64; y++) { put(32 - 5 - Math.floor((y - 46) * .15), y, ID.ink, .5, 5); put(32 + 5 + Math.floor((y - 46) * .15), y, ID.ink, .5, 5); } for (let k = 0; k < 3; k++) put(37, 52 + k * 4, ID.acc, .9, 5); }
  if (o === 'labcoat') { for (let k = 0; k < 14; k++) { put(27 - (k >> 2), 45 + k, ID.shirt, .85, 5); put(37 + (k >> 2), 45 + k, ID.shirt, .85, 5); } for (let y = 48; y < 64; y++) put(32, y, ID.ink, .5, 5); put(43, 56, ID.acc, .8, 5); put(43, 55, ID.acc, .9, 5); put(44, 56, ID.acc, .6, 5); }
  if (o === 'shirtsleeves') { for (let y = 44; y < 64; y++) { put(25, y, ID.acc, .6, 5); put(39, y, ID.acc, .6, 5); } for (let x = 28; x < 37; x++) put(x, 45, ID.shirt, .9, 5); }
  // --- head
  const faceL = (x, y) => inEll(x, y, hcx, hcy, hrx, hry);
  // ears
  for (const sd of [-1, 1]) for (let y = hcy - 3; y < hcy + 5; y++) for (let x = hcx + sd * (hrx - 1.5); sd < 0 ? x > hcx + sd * (hrx + 3.5) : x < hcx + sd * (hrx + 3.5); x += sd) { const xi = Math.round(x); if (inEll(xi, y, hcx + sd * (hrx + 1.2), hcy + 1, 2.8, 4) < 1) put(xi, y, ID.skin, sd > 0 ? .65 : .25, 3); }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const e = faceL(x, y), jaw = (y > hcy + 3) ? 1 + (y - hcy - 3) * .016 : 1;
    const e2 = inEll(x, y, hcx, hcy + (y > hcy ? (y - hcy) * -.06 : 0), hrx * (y > hcy + 6 ? (1 - (y - hcy - 6) * .026 * (build > 0 ? .5 : 1)) : 1), hry);
    if (e2 < 1) put(x, y, ID.skin, clamp(shadeEll(x, y, hcx, hcy, hrx, hry) + .14, 0, 1), 4);
  }
  // blush
  if (teen || mood === 'smile') for (const sd of [-1, 1]) for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) { const px = hcx + sd * 8 + x - 2, py = hcy + 7 + y; if (M[py * N + px] === ID.skin && (x + y) % 2 === 0) SH[py * N + px] = Math.min(1, SH[py * N + px] + .25); }
  // --- hair (front)
  const hl = (x) => hcy - 6.5 + Math.abs(x - hcx) * (hs === 'slick' ? .06 : .22);
  const hairPix = (x, y) => {
    const top = inEll(x, y, hcx, hcy - 1, hrx + 1.8, hry + 1.6);
    if (hs === 'short' || hs === 'braid' || hs === 'slick' || hs === 'bun') return top < 1 && (y < hl(x) || (Math.abs(x - hcx) > hrx - 2.2 && y < hcy + 4));
    if (hs === 'long') return top < 1 && (y < hl(x) - 1 || (Math.abs(x - hcx) > hrx - 2.5 && y < hcy + 14));
    if (hs === 'bob') return top < 1 && (y < hl(x) - .5 || (Math.abs(x - hcx) > hrx - 2.5 && y < hcy + 10));
    if (hs === 'buzz') return top < 1 && (y < hl(x) - 3 || (Math.abs(x - hcx) > hrx - 1.2 && y < hcy - 1));
    if (hs === 'curly') { const a = Math.atan2(y - (hcy - 2), x - hcx); return inEll(x, y, hcx, hcy - 2, hrx + 3 + Math.sin(a * 8) * 1.6, hry + 2.6 + Math.sin(a * 8) * 1.6) < 1 && (y < hl(x) + 1 || Math.abs(x - hcx) > hrx - 1.5 && y < hcy + 6);
    }
    if (hs === 'cap') return false;
    if (hs === 'bald') return Math.abs(x - hcx) > hrx - .5 && y > hcy - 6 && y < hcy + 1 && top < 1.25 && inEll(x, y, hcx, hcy, hrx + 1.4, hry) < 1.2;
    return false;
  };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (hairPix(x, y)) {
    let sh = shadeEll(x, y, hcx, hcy - 2, hrx + 2, hry + 2); if (hs === 'slick' && ((x * 2 + y) % 6 === 0)) sh = Math.min(1, sh + .35); if (hs === 'curly' && (x + y * 3) % 5 === 0) sh += .25; if (hs === 'buzz') sh *= .75;
    put(x, y, ID.hair, clamp(sh, 0, 1), 5);
  }
  if (hs === 'bun') for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { if (inEll(x, y, hcx + 1, hcy - hry - 1.5, 5, 4.4) < 1) put(x, y, ID.hair, shadeEll(x, y, hcx + 1, hcy - hry - 1.5, 5, 4.4), 5); }
  if (hs === 'braid') for (let y = hcy + 4; y < 62; y++) for (let x = 0; x < N; x++) { const cx = hcx + hrx + 3 + Math.sin(y * .5) * .9; if (Math.abs(x - cx) < 2.3 && y > hcy + 8) put(x, y, ID.hair, ((y >> 1) & 1) ? .8 : .35, 6); }
  if (hs === 'long') for (let y = hcy + 8; y < 60; y++) for (const sd of [-1, 1]) for (let x = 0; x < 5; x++) { const px = hcx + sd * (hrx + 1) + (sd > 0 ? x - 1 : -x + 1); put(Math.round(px), y, ID.hair, clamp(.35 + x * .06 + (sd > 0 ? .15 : 0), 0, 1), 6); }
  if (hs === 'cap') {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const t = inEll(x, y, hcx, hcy - 3, hrx + 2, hry - 1);
      if (t < 1 && y < hcy - 5.5) put(x, y, ID.out, clamp(shadeEll(x, y, hcx, hcy - 3, hrx + 2, hry) + .1, 0, 1), 5);
      if (y >= hcy - 6 && y < hcy - 3 && Math.abs(x - hcx - 5) < hrx + 6 && x > hcx - hrx - 1) put(x, y, ID.out, .25 + (y - hcy + 6) * .05, 6);
    }
    for (let x = hcx - 2; x < hcx + 4; x++) put(x, hcy - 9, ID.acc, .9, 7);
  }
  if (hs === 'bald') { put(hcx + 5, hcy - 14, ID.skin, 1, 7); put(hcx + 6, hcy - 13, ID.skin, 1, 7); put(hcx + 4, hcy - 14, ID.skin, .9, 7); }
  // --- outline pass (top layer pixel next to a lower layer pixel)
  const outl = new Uint8Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; if (M[i] === ID.bg) continue; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= N || yy >= N) continue; const j = yy * N + xx; if (Z[j] < Z[i] && (M[j] === ID.bg || Z[i] - Z[j] >= 1)) { if (M[i] !== ID.skin || Z[j] <= 3 || true) outl[i] = 1; } } }
  // outline only between big groups: skin/hair edge and body edge; skip hair-on-skin inner (keeps pixel look clean)
  for (let i = 0; i < N * N; i++) if (outl[i]) { const m = M[i]; if (m === ID.shirt || m === ID.acc) continue; M[i] = ID.ink; Z[i] = 9; }
  // --- facial details
  const ex = 5.4 + build * .3, ey = hcy + 0;
  const S_ = (x, y, m, sh) => put(Math.round(x), Math.round(y), m, sh === undefined ? .5 : sh, 10);
  const hairD = ID.hair;
  const shock = mood === 'shock', angry = mood === 'angry', sad = mood === 'sad', smile = mood === 'smile';
  for (const sd of [-1, 1]) {
    const cx = hcx + sd * ex, eyeR = shock ? 2 : 1;
    for (let dy = -eyeR; dy <= eyeR; dy++) for (let dx = -2; dx <= 2; dx++) { if ((Math.abs(dx) === 2 && Math.abs(dy) >= 1) || (!shock && Math.abs(dy) === 1 && Math.abs(dx) === 2)) continue; if (shock || Math.abs(dy) < 1 || Math.abs(dx) < 2) S_(cx + dx, ey + dy, ID.white, 1); }
    S_(cx + 0, ey, ID.dark, 0); S_(cx + 1, ey, ID.dark, 0); if (shock) { S_(cx, ey + 1, ID.dark, 0); S_(cx + 1, ey + 1, ID.dark, 0); }
    S_(cx - 2, ey + 1 + (smile ? 0 : 1), ID.skin, .15);                                     // eyelid shadow
    // brows
    const by = ey - 4 - (shock ? 2 : 0);
    for (let k = -2; k <= 2; k++) { const t = k * (-sd) / 2; const dy = angry ? Math.round(t * 1.4) : sad ? -Math.round(t * 1.4) : 0; S_(cx + k, by + dy, hairD, .15); if (angry && Math.abs(k) < 2) S_(cx + k, by + dy - 1, hairD, .15); }
    if (old) { S_(cx - 3, ey + 2, ID.skin, .1); S_(cx + 3, ey + 2, ID.skin, .1); }
  }
  // nose
  for (let y = ey + 2; y < ey + 8; y++) S_(hcx + 1 + (y > ey + 5 ? 0 : 0), y, ID.skin, .15 + (y - ey) * .03);
  S_(hcx - 1, ey + 8, ID.skin, .05); S_(hcx, ey + 8, ID.skin, .05); S_(hcx + 1, ey + 8, ID.skin, .12); S_(hcx + 2, ey + 8, ID.skin, .12);
  // mouth
  const my = hcy + 11;
  if (shock) { for (let dx = -1; dx <= 1; dx++) { S_(hcx + dx, my, ID.dark, 0); S_(hcx + dx, my + 1, ID.dark, 0); S_(hcx + dx, my + 2, ID.dark, 0); } S_(hcx, my + 1, ID.lip, .3); }
  else if (smile) { for (let dx = -3; dx <= 3; dx++) S_(hcx + dx, my + (Math.abs(dx) >= 3 ? -1 : Math.abs(dx) >= 2 ? 0 : 1) , ID.lip, .15); for (let dx = -2; dx <= 2; dx++) S_(hcx + dx, my, ID.white, 1); }
  else if (sad) { for (let dx = -3; dx <= 3; dx++) S_(hcx + dx, my + (Math.abs(dx) >= 3 ? 1 : Math.abs(dx) >= 2 ? 0 : -0) , ID.lip, .15); S_(hcx - 3, my + 1, ID.lip, .15); S_(hcx + 3, my + 1, ID.lip, .15); }
  else if (angry) { for (let dx = -3; dx <= 3; dx++) S_(hcx + dx, my + (Math.abs(dx) >= 3 ? 1 : 0), ID.lip, .1); }
  else { for (let dx = -2; dx <= 2; dx++) S_(hcx + dx, my, ID.lip, .2); S_(hcx - 3, my, ID.skin, .2); S_(hcx + 3, my, ID.skin, .2); }
  if (L.extra === 'cigarette') { for (let dx = 0; dx < 7; dx++) S_(hcx + 3 + dx, my + 1 - (dx >> 2), ID.white, dx > 5 ? .2 : 1); S_(hcx + 10, my - 1, ID.acc, 1); S_(hcx + 11, my - 4, ID.white, .55); S_(hcx + 12, my - 7, ID.white, .4); }
  // age
  if (old) { for (let y = ey + 3; y < ey + 10; y += 1) { if (y % 2 === 0) { S_(hcx - 9, y, ID.skin, .12); S_(hcx + 9, y, ID.skin, .12); } } for (let x = hcx - 6; x <= hcx + 6; x += 2) { S_(x, hcy - 9, ID.skin, .12); S_(x + 1, hcy - 11, ID.skin, .14); } S_(hcx - 4, my + 3, ID.skin, .1); S_(hcx + 4, my + 3, ID.skin, .1); }
  else if (!teen) { S_(hcx - 7, ey + 7, ID.skin, .15); S_(hcx - 7, ey + 8, ID.skin, .15); S_(hcx + 7, ey + 7, ID.skin, .15); S_(hcx + 7, ey + 8, ID.skin, .15); }
  // glasses
  if (L.glasses) {
    for (const sd of [-1, 1]) { const cx = hcx + sd * ex; for (let y = ey - 4; y <= ey + 4; y++) for (let x = Math.round(cx) - 5; x <= Math.round(cx) + 5; x++) { const d = Math.hypot((x - cx) / 4.9, (y - ey) / 3.7); if (d > .82 && d < 1.12) S_(x, y, ID.ink, 0); } }
    for (let x = hcx - 1; x <= hcx + 1; x++) S_(x, ey - 1, ID.ink, 0);
    for (let k = 0; k < 4; k++) { S_(hcx - ex - 5 - k, ey - 1, ID.ink, 0); S_(hcx + ex + 5 + k, ey - 1, ID.ink, 0); }
    S_(hcx - ex - 2, ey - 2, ID.white, 1); S_(hcx + ex - 2, ey - 2, ID.white, 1);
  }
  if (mood === 'sad') { S_(hcx + ex + 1, ey + 4, ID.white, .8); S_(hcx + ex + 1, ey + 5, ID.white, .8); }
  // --- palette + dithering to ImageData
  const pal = {};
  const skinC = mix(C(L.skin), tint || C(L.skin), tint ? .12 : 0);
  const ramps = [
    ramp3(bgC, .1), ramp3(skinC), ramp3(C(L.hair)), ramp3(C(L.outfitColor)), ramp3(C(L.accent)), ramp3(o === 'labcoat' ? [226, 222, 208] : o === 'apron' ? [226, 222, 208] : o === 'overalls' ? [168, 150, 120] : o === 'suit' ? [214, 208, 192] : o === 'tracksuit' ? [200, 200, 196] : mix(C(L.outfitColor), [220, 214, 200], .72)),
    [[18, 14, 20], [18, 14, 20], [18, 14, 20]], [[236, 230, 214], [236, 230, 214], [250, 246, 236]], [[22, 18, 22], [22, 18, 22], [40, 32, 32]], [mul(mix(skinC, [170, 60, 60], .55), .7), mix(skinC, [170, 60, 60], .55), mix(skinC, [200, 90, 80], .5)]
  ];
  if (tint) for (const rp of ramps) for (let k = 0; k < 3; k++) rp[k] = mix(rp[k], tint, .08);
  const cv = mk(N, N), cg = ctx2(cv), id = cg.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x, m = M[i], rp = ramps[m], th = (BAYER4[y & 3][x & 3] + .5) / 16;
    const v = clamp(SH[i], 0, .999) * 2, lv = Math.floor(v), fr = v - lv;
    const idx = lv + (fr > th ? 1 : 0), col = rp[clamp(idx, 0, 2)];
    id.data[i * 4] = col[0]; id.data[i * 4 + 1] = col[1]; id.data[i * 4 + 2] = col[2]; id.data[i * 4 + 3] = 255;
  }
  cg.putImageData(id, 0, 0);
  _pbuf.set(key, cv); if (_pbuf.size > 120) _pbuf.delete(_pbuf.keys().next().value);
  return cv;
}

function wobbleCircle(g, cx, cy, R, r, amp) {
  g.beginPath(); const n = 40;
  for (let i = 0; i <= n; i++) { const a = i / n * 6.2832, k = 1 + (noise(Math.cos(a) * 2 + 5, Math.sin(a) * 2 + 5, 11) - .5) * amp + (r() - .5) * amp * .25; const x = cx + Math.cos(a) * R * k, y = cy + Math.sin(a) * R * k; if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); }
  g.closePath();
}
function drawPortraitImpl(canvas, look, opts) {
  opts = opts || {}; if (opts.size) { canvas.width = canvas.height = opts.size; }
  const W = canvas.width, H = canvas.height, size = Math.min(W, H), g = canvas.getContext('2d');
  const buf = buildPortraitBuffer(look, opts), r = RNG(hashStr(lookKey(normLook(look))) + 7);
  g.save(); g.clearRect(0, 0, W, H); g.translate(W / 2, H / 2);
  const R = size * .47, bw = size * .075, Rin = R - bw * .7;
  // shadow
  g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(size * .02, size * .035, R * 1.0, R * 1.0, 0, 0, 7); g.fill();
  // pixel art inside circular clip
  g.save(); wobbleCircle(g, 0, 0, Rin, r, .0); g.clip();
  g.imageSmoothingEnabled = false; const s = Rin * 2 * 1.04; g.drawImage(buf, 7, 5, 50, 50, -s / 2, -s / 2, s, s);
  const vg = g.createRadialGradient(0, 0, Rin * .55, 0, 0, Rin); vg.addColorStop(0, 'rgba(10,6,16,0)'); vg.addColorStop(1, 'rgba(10,6,16,.55)'); g.fillStyle = vg; g.fillRect(-Rin, -Rin, Rin * 2, Rin * 2);
  g.restore();
  // painted thick border: dark ink base, gold-ochre band, brushed strokes, highlights
  g.lineCap = 'round';
  wobbleCircle(g, 0, 0, R, r, .02); g.lineWidth = bw * 1.25; g.strokeStyle = 'rgb(24,16,16)'; g.stroke();
  const bandC = C(opts.border || [198, 150, 66]);
  for (let i = 0; i < 70; i++) {
    const a = r() * 6.2832, da = .08 + r() * .26, rr = R - bw * .08 + (r() - .5) * bw * .5, lit = Math.cos(a + .8) * .5 + .5;
    const c = mix(mul(bandC, .55), mix(bandC, [255, 224, 150], .5), lit * (.5 + r() * .5));
    g.strokeStyle = css(jit(c, r, .1), .45 + r() * .4); g.lineWidth = bw * (.25 + r() * .35); g.beginPath(); g.arc(0, 0, rr, a, a + da); g.stroke();
  }
  g.strokeStyle = 'rgba(255,236,170,.65)'; g.lineWidth = bw * .1; g.beginPath(); g.arc(0, 0, R - bw * .45, -2.6, -.5); g.stroke();
  g.strokeStyle = 'rgba(14,10,14,.9)'; g.lineWidth = Math.max(1.4, bw * .13); wobbleCircle(g, 0, 0, Rin + bw * .02, r, .012); g.stroke();
  g.strokeStyle = 'rgba(14,10,14,.9)'; wobbleCircle(g, 0, 0, R + bw * .55, r, .02); g.stroke();
  // little rivets
  g.fillStyle = 'rgba(40,24,16,.7)'; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.2832 + .2; g.beginPath(); g.arc(Math.cos(a) * (R - bw * .1), Math.sin(a) * (R - bw * .1), bw * .09, 0, 7); g.fill(); }
  g.restore();
}
