// facade(spec): procedural building fronts (ART.md 2.5 item 5 and 3.7). Front-facing 3/4 view: the roof plane seen
// from above over a wall face. Walls (plaster, wood siding, brick, shop), kawara / slate / tin / flat roofs, windows
// with curtains in the owner's ramp (glass glows at night through the town emissive pass), doors, awnings, noren,
// signs, chimneys, flower boxes and winter snow caps. Each building is one seasonal sprite plus metadata
// (door position, glass rects, window lights) used by building() to place it with its door warp.
import { spr, hash, signText, signW, line, TP } from './lib.js';

export const FACADES = {};
const SH = '#2a1a404d'; // translucent plum for cast shadows inside sprites

function wallFill(R, M, s, W, y0, H) {
  const k = s.wall || 'plaster', h = H - y0;
  if (k === 'brick') {
    const B = M[s.wallRamp || 'brick'];
    R(0, y0, W, h, B[2]);
    for (let r = 0; r * 5 < h; r++) { const y = y0 + r * 5; R(0, y, W, 1, B[1]); for (let x = (r % 2) * 5; x < W; x += 10) R(x, y, 1, 5, B[1]); for (let x = (r % 2) * 5 + 2; x < W; x += 10) if (hash(x, r, 3) > 0.7) R(x, y + 1, 6, 3, B[3]); }
  } else if (k === 'siding') {
    const Wd = M[s.wallRamp || 'wood'];
    R(0, y0, W, h, Wd[3]);
    for (let y = y0 + 4; y < H; y += 5) { R(0, y, W, 1, Wd[1]); R(0, y + 1, W, 1, Wd[2]); }
    for (let i = 0; i < W / 6; i++) R(Math.floor(hash(i, 3, 1) * W), y0 + Math.floor(hash(i, 3, 2) * h), 4, 1, Wd[4]);
  } else {
    const P = M[s.wallRamp || (k === 'shop' ? 'paper' : 'plaster')];
    R(0, y0, W, h, P[3]);
    for (let i = 0; i < W * h / 60; i++) R(Math.floor(hash(i, 7, 1) * W), y0 + Math.floor(hash(i, 7, 2) * h), 1, 1, P[4]);
    for (let i = 0; i < W * h / 140; i++) R(Math.floor(hash(i, 8, 1) * W), y0 + Math.floor(hash(i, 8, 2) * h), 1, 1, P[2]);
  }
}

function roof(R, M, s, W, top, rh, season) {
  const Rf = M[s.roofRamp || 'roofRed'], kind = s.roof || 'kawara';
  if (kind === 'flat') {
    const P = M[s.wallRamp || 'paper'];
    R(0, top, W, rh, P[2]); R(0, top, W, 3, P[4]); R(0, top + 3, W, 1, P[1]); R(0, top + rh - 4, W, 4, P[1]);
    for (const ax of s.ac || []) { R(ax, top - 10, 22, 14, M.metal[3]); R(ax, top - 10, 22, 2, M.metal[4]); R(ax + 18, top - 8, 4, 12, M.metal[2]); for (let i = 0; i < 4; i++) R(ax + 3 + i * 4, top - 6, 2, 8, M.metal[1]); }
  } else if (kind === 'slate') {
    R(0, top, W, rh, Rf[2]);
    for (let y = top + 6; y < top + rh - 3; y += 4) for (let x = ((y / 4) % 2) * 4; x < W; x += 8) { R(x, y, 7, 1, Rf[1]); R(x + 3, y - 2, 1, 2, Rf[1]); R(x + 1, y - 3, 2, 1, Rf[3]); }
    R(0, top, W, 5, Rf[4]); R(0, top + 5, W, 1, Rf[3]);
  } else if (kind === 'tin') {
    R(0, top, W, rh, Rf[2]);
    for (let x = 0; x < W; x += 4) { R(x, top + 4, 1, rh - 4, Rf[3]); R(x + 3, top + 4, 1, rh - 4, Rf[1]); }
    R(0, top, W, 4, Rf[4]);
  } else { // kawara: vertical ridges every 6 px, course lines every 10 px
    R(0, top, W, rh, Rf[2]);
    for (let x = 0; x < W; x += 6) { R(x, top + 6, 1, rh - 6, Rf[3]); R(x + 4, top + 6, 1, rh - 6, Rf[1]); R(x + 5, top + 6, 1, rh - 6, Rf[0]); }
    for (let y = top + 16; y < top + rh - 2; y += 10) { R(0, y, W, 1, Rf[0]); R(0, y + 1, W, 1, Rf[1]); R(0, y - 1, W, 1, Rf[3]); }
    R(0, top, W, 6, Rf[4]); R(0, top + 5, W, 1, Rf[3]); R(0, top + 6, W, 1, Rf[1]);
  }
  if (kind !== 'flat') R(0, top + rh - 3, W, 3, Rf[0]);
  if (s.chimney !== undefined) { const x = s.chimney; R(x, top - 10, 14, 18, M.brick[2]); R(x, top - 10, 14, 3, M.brick[4]); R(x + 12, top - 7, 2, 15, M.brick[1]); R(x + 2, top - 4, 9, 1, M.brick[1]); }
  if (season === 'winter') {
    if (kind === 'flat') { R(0, top, W, 4, M.snow[4]); for (const ax of s.ac || []) R(ax, top - 11, 22, 3, M.snow[4]); }
    else { R(0, top, W, 9, M.snow[4]); for (let x = 0; x < W; x += 7) R(x, top + 9, 4, 2 + (x % 3), M.snow[3]); R(0, top + rh - 4, W, 2, M.snow[3]); }
    if (s.chimney !== undefined) R(s.chimney - 1, top - 12, 16, 3, M.snow[4]);
  }
}

function windowAt(R, M, w, y0, season, glass) {
  const { x } = w, y = y0 + (w.y ?? 14), ww = w.w || 28, wh = w.h || 26, Wk = M.woodDark;
  R(x - 2, y - 2, ww + 4, wh + 4, Wk[2]); R(x - 2, y - 2, ww + 4, 1, Wk[3]);
  R(x, y, ww, wh, M.sky[2]); R(x, y, ww, 6, M.sky[3]); R(x, y + wh - 5, ww, 5, M.sky[1]);
  R(x + 4, y + 9, 2, 2, M.sky[4]); R(x + 6, y + 7, 2, 2, M.sky[4]);
  const C = w.curtain && M[w.curtain], cw = C ? Math.max(4, Math.round(ww * 0.2)) : 0;
  const mid = x + Math.floor(ww / 2) - 1;
  if (w.shop) { glass.push([x, y, ww, wh]); for (let i = 0; i < Math.floor(ww / 10); i++) { const gx = x + 4 + i * 10; R(gx, y + wh - 9, 6, 7, [M.coral[2], M.butter[2], M.mint[2], M.lilac[2]][i % 4]); R(gx, y + wh - 9, 6, 1, M.paper[4]); } R(x, y + wh - 2, ww, 2, Wk[1]); return; }
  glass.push([x + cw, y + 2, mid - x - cw, wh - 2], [mid + 2, y + 2, x + ww - cw - mid - 2, wh - 2]);
  if (C) { R(x, y, cw, wh, C[2]); R(x + ww - cw, y, cw, wh, C[2]); R(x + cw - 1, y, 1, wh, C[1]); R(x + ww - cw, y, 1, wh, C[1]); R(x, y, ww, 2, C[1]); R(x + 1, y + 3, 1, wh - 4, C[3]); }
  R(mid, y, 2, wh, Wk[2]); if (wh > 30) R(x, y + Math.floor(wh / 2), ww, 2, Wk[2]);
  R(x - 4, y + wh + 2, ww + 8, 3, M.wood[3]); R(x - 4, y + wh + 4, ww + 8, 1, M.wood[1]);
  if (w.box) {
    R(x - 2, y + wh + 5, ww + 4, 6, M.wood[2]); R(x - 2, y + wh + 10, ww + 4, 1, M.wood[1]);
    for (let i = 0; i < Math.floor(ww / 5) + 1; i++) R(x - 1 + i * 5, y + wh + 1 + (i % 2), 3, 3, season === 'winter' ? M.snow[4] : season === 'autumn' ? M.leafAutumn[2 + (i % 2)] : M.flower[i % M.flower.length]);
    if (season !== 'winter') for (let i = 0; i < Math.floor(ww / 5); i++) R(x + 1 + i * 5, y + wh + 3, 2, 2, M.leaf[2]);
  }
}

function door(R, M, d, H, glass) {
  const Wk = M.woodDark, Wd = M[d.ramp || 'wood'], x = d.x, st = d.style || 'wood';
  const dw = st === 'double' || st === 'slide' ? 52 : d.w || 28, dh = d.h || 50, y = H - dh - 2;
  R(x - 2, y - 2, dw + 4, dh + 2, Wk[1]);
  if (st === 'glass' || st === 'slide') {
    R(x, y, dw, dh, M.metal[3]); R(x + 3, y + 3, dw - 6, dh - 6, M.sky[2]); R(x + 3, y + 3, dw - 6, 8, M.sky[3]); R(x + 6, y + 14, 2, 10, M.sky[4]);
    glass.push([x + 3, y + 11, dw - 6, dh - 14]);
    if (st === 'slide') R(x + 25, y, 2, dh, M.metal[2]);
    R(x + Math.floor(dw / 2) - 7, y + 18, 14, 7, M.paper[4]); signText(R, 'OPEN', x + Math.floor(dw / 2) - 7, y + 19, M.mint[1]);
  } else if (st === 'double') {
    for (const ox of [0, 26]) { R(x + ox, y, 26, dh, Wd[2]); R(x + ox + 3, y + 4, 20, 18, Wd[3]); R(x + ox + 3, y + 26, 20, 20, Wd[1]); R(x + ox + 4, y + 27, 18, 18, Wd[2]); }
    R(x + 25, y, 2, dh, Wk[1]); R(x + 22, y + 26, 2, 3, M.butter[2]); R(x + 28, y + 26, 2, 3, M.butter[2]);
  } else {
    R(x, y, dw, dh, Wd[2]); R(x + 2, y + 3, 10, 18, Wd[3]); R(x + 14, y + 3, 10, 18, Wd[3]); R(x + 2, y + 25, 22, 20, Wd[1]); R(x + 3, y + 26, 20, 18, Wd[2]);
    R(x + 21, y + 22, 2, 3, M.butter[2]); R(x + 21, y + 22, 1, 1, M.butter[4]);
  }
  R(x - 4, H - 2, dw + 8, 2, M.stone[4]); R(x - 4, H - 1, dw + 8, 1, M.stone[2]);
  return { x, w: dw };
}

function decorate(R, M, s, W, wy, H, season) {
  for (const a of s.awnings || []) { // striped awning with a scalloped edge
    const A = M[a.a || 'mint'], B = M[a.b || 'paper'], y = wy + (a.y ?? 6), h = a.h || 9;
    R(a.x, y, a.w, h, A[2]);
    for (let x = a.x; x < a.x + a.w; x += 8) R(x, y, 4, h, B[3]);
    R(a.x, y, a.w, 2, A[3]); R(a.x, y + h, a.w, 1, A[1]);
    for (let x = a.x; x < a.x + a.w; x += 2) R(x, y + h + 1, 1, 1, (Math.floor((x - a.x) / 4) % 2 ? B : A)[1]);
    R(a.x, y + h + 2, a.w, 3, SH);
    if (season === 'winter') R(a.x, y - 1, a.w, 2, M.snow[4]);
  }
  for (const n of s.noren || []) { // cloth panels with a white mark
    const N = M[n.ramp || 'navy'], y = wy + (n.y ?? 10), pw = Math.floor((n.w - 3) / 3);
    R(n.x - 2, y - 2, n.w + 4, 3, M.woodDark[2]);
    for (let i = 0; i < 3; i++) { const px = n.x + i * (pw + 1); R(px, y, pw, 20, N[2]); R(px, y, 1, 20, N[3]); R(px + pw - 1, y, 1, 20, N[1]); R(px, y + 19, pw, 1, N[1]); }
    if (n.text) signText(R, n.text, n.x + Math.floor((n.w - signW(n.text)) / 2), y + 7, M.paper[4]);
    else R.e(n.x + Math.floor(n.w / 2), y + 9, 4, 4, M.paper[4]);
  }
  for (const g of s.signs || []) { // painted board, hanging board or blue plate
    const S = M[g.ramp || 'wood'], tw = signW(g.text), bw = tw + 10, y = g.y ?? wy + 2, x = g.x ?? Math.floor((W - bw) / 2);
    if (g.hang) { R(x + bw - 2, y - 4, 6, 2, M.charcoal[2]); R(x + 2, y - 2, 1, 2, M.charcoal[2]); R(x + bw - 3, y - 2, 1, 2, M.charcoal[2]); }
    R(x, y, bw, 11, S[1]); R(x + 1, y + 1, bw - 2, 9, S[g.light ? 3 : 2]); R(x + 1, y + 1, bw - 2, 1, S[4]);
    signText(R, g.text, x + 5, y + 3, g.ink ? M[g.ink][g.inkI ?? 1] : g.light ? S[0] : M.paper[4]);
    R(x, y + 11, bw, 2, SH);
  }
  if (s.number) { R(s.number.x, wy + s.number.y, 11, 9, M.paper[3]); signText(R, String(s.number.n), s.number.x + 2, wy + s.number.y + 2, M.ink[1]); }
  for (const p of s.pipes || []) { R(p, wy, 3, H - wy - 4, M.metal[2]); R(p, wy, 1, H - wy - 4, M.metal[3]); }
  if (s.cross) { const { x, y } = s.cross; R(x + 4, wy + y, 6, 16, M.paper[4]); R(x, wy + y + 5, 14, 6, M.paper[4]); R(x + 5, wy + y + 1, 4, 14, M.ribbon[2]); R(x + 1, wy + y + 6, 12, 4, M.ribbon[2]); }
}

// Define a building sprite from a spec and remember its layout.
export function facade(name, s) {
  const W = s.w * TP, top = s.top || 0, rh = s.roofH ?? 52, wh = s.wallH ?? 72, H = top + rh + wh, wy = top + rh;
  const glass = [], meta = { name, w: s.w, H, glass, doors: [], windows: s.windows || [] };
  spr(name, W, H, (R, M, season) => {
    const g = [];
    if (s.tower) drawTower(R, M, s.tower, top, season);
    wallFill(R, M, s, W, wy, H);
    if (s.wall !== 'brick' && s.posts !== false) { R(0, wy, 4, wh, M.woodDark[3]); R(W - 4, wy, 4, wh, M.woodDark[2]); }
    if (s.wainscot) { R(0, H - 18, W, 2, M.woodDark[3]); R(0, H - 16, W, 12, M[s.wainscot][2]); for (let x = 6; x < W; x += 8) R(x, H - 16, 1, 12, M[s.wainscot][1]); }
    R(0, H - 4, W, 4, M.woodDark[2]); R(0, H - 4, W, 1, M.woodDark[3]);
    for (const w of s.windows || []) windowAt(R, M, w, wy, season, g);
    for (const d of [].concat(s.door || [])) door(R, M, d, H, g);
    decorate(R, M, s, W, wy, H, season);
    roof(R, M, s, W, top, rh, season);
    R(0, wy, W, 3, SH); R(0, wy + 3, W, 2, '#2a1a4026');
    if (s.extra) s.extra(R, M, season, { W, H, wy, top });
  }, { seasonal: true });
  // dry-run the glass rects once (sprite drawing is lazy)
  const probe = (x, y, w, h) => {}; probe.e = probe; probe.t = probe; probe.at = () => probe;
  for (const w of s.windows || []) windowAt(probe, PROBE_M, w, wy, 'summer', glass);
  for (const d of [].concat(s.door || [])) { const r = door(probe, PROBE_M, d, H, glass); meta.doors.push(r); }
  meta.hT = Math.ceil((H + 2) / TP);
  if (s.tower) meta.clock = [s.tower.x + s.tower.w / 2, 46];
  FACADES[name] = meta;
  return meta;
}
const PROBE_M = new Proxy({}, { get: () => new Proxy([], { get: (t, k) => (k === 'length' ? 6 : '#000000') }) });

function drawTower(R, M, t, top, season) { // clock tower rising above the roof
  const x = t.x, w = t.w, y0 = 0, Wk = M.woodDark, B = M.brick;
  R(x, y0 + 22, w, top + 30, B[2]); R(x, y0 + 22, 3, top + 30, B[3]); R(x + w - 3, y0 + 22, 3, top + 30, B[1]);
  for (let y = y0 + 26; y < top + 50; y += 5) for (let bx = x + ((y / 5) % 2) * 5; bx < x + w; bx += 10) R(bx, y, 1, 5, B[1]);
  R.t([x - 4, y0 + 24], [x + w + 3, y0 + 24], [x + w / 2, y0 + 2], M.roofSlate[1]); R.t([x - 1, y0 + 22], [x + w / 2, y0 + 22], [x + w / 2, y0 + 5], M.roofSlate[3]);
  R(x - 4, y0 + 22, w + 8, 4, M.roofSlate[0]); R(x + w / 2, y0, 1, 4, M.butter[2]);
  if (season === 'winter') R.t([x + 6, y0 + 16], [x + w - 6, y0 + 16], [x + w / 2, y0 + 4], M.snow[4]);
  const cx = x + w / 2, cy = y0 + 46;
  R.e(cx, cy, 17, 17, Wk[1]); R.e(cx, cy, 15, 15, M.paper[3]); R.e(cx - 2, cy - 2, 11, 11, M.paper[4]);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; R(Math.round(cx + Math.sin(a) * 12), Math.round(cy - Math.cos(a) * 12), i % 3 ? 1 : 2, i % 3 ? 1 : 2, M.ink[1]); }
  R(x + 6, y0 + 68, w - 12, 10, Wk[2]); R(x + 8, y0 + 70, w - 16, 6, M.charcoal[1]); R(cx - 3, y0 + 66, 6, 8, M.butter[1]);
}

// Place a building: returns the object, its door warp(s) and the matching arrival spawn(s).
// opts: { to: 'cafe:from_town', spawn: 'from_cafe', hours: {...}, locked, lockedText, litUntil, glow, missingText }
export function building(name, x, y, opts = {}) {
  const f = FACADES[name], hT = f.hT;
  const obj = { spr: name, x, y, w: f.w, h: hT, glass: f.glass, glassH: f.H, litUntil: opts.litUntil ?? 24 * 60 + 30, shopGlow: !!opts.shop, ...(opts.obj || {}) };
  obj.light = f.windows.map((w) => ({ kind: 'window', x: Math.round((w.x + (w.w || 28) / 2) / 2), y: hT * 16 + 5 }));
  if (!obj.light.length) delete obj.light;
  const warps = [], spawns = {};
  const d = f.doors[0];
  if (d && opts.to !== undefined) {
    const tx = x + Math.floor((d.x + d.w / 2) / TP), ty = y + hT;
    const w = { x: tx, y: ty, to: opts.to, enter: 'up', missingText: opts.missingText };
    if (opts.hours) Object.assign(w, opts.hours);
    if (opts.locked) Object.assign(w, { locked: opts.locked, lockedText: opts.lockedText });
    warps.push(w);
    if (opts.spawn) spawns[opts.spawn] = [tx, ty + 1, 'down'];
    obj.doorTile = [tx, ty];
  }
  return { obj, warps, spawns, door: obj.doorTile };
}

// ---------------- the buildings of Hoshimori Bay ----------------
facade('town_house_misa', { w: 8, top: 12, roofH: 56, wallH: 74, wall: 'plaster', roof: 'kawara', roofRamp: 'roofRed', chimney: 196, wainscot: 'paper',
  door: { x: 114, style: 'wood' }, awnings: [{ x: 108, w: 40, y: 10, a: 'mint', b: 'paper' }], number: { x: 152, y: 30, n: 7 },
  windows: [{ x: 22, curtain: 'coral', box: true }, { x: 64, curtain: 'coral', box: true }, { x: 168, curtain: 'butter', box: true }, { x: 208, curtain: 'butter', box: true }] });
facade('town_house_goro', { w: 6, top: 4, roofH: 52, wallH: 72, wall: 'siding', wallRamp: 'wood', roof: 'kawara', roofRamp: 'roofTeal',
  door: { x: 30, style: 'wood', ramp: 'woodDark' }, awnings: [{ x: 24, w: 40, y: 8, a: 'forest', b: 'paper' }], number: { x: 66, y: 28, n: 5 },
  windows: [{ x: 94, curtain: 'forest', box: true }, { x: 142, curtain: 'forest', box: true }] });
facade('town_house_blue', { w: 6, top: 12, roofH: 52, wallH: 72, wall: 'plaster', wallRamp: 'sky', roof: 'slate', roofRamp: 'roofSlate', chimney: 150,
  door: { x: 130, style: 'wood' }, windows: [{ x: 20, curtain: 'lilac', box: true }, { x: 66, curtain: 'lilac' }] });
facade('town_shed', { w: 3, roofH: 30, wallH: 56, wall: 'siding', wallRamp: 'woodDark', roof: 'tin', roofRamp: 'roofTeal', door: { x: 22, style: 'double', ramp: 'wood' } });
facade('town_cafe', { w: 6, top: 4, roofH: 40, wallH: 78, wall: 'plaster', wallRamp: 'paper', roof: 'tin', roofRamp: 'roofTeal', wainscot: 'mint',
  door: { x: 82, style: 'glass' }, awnings: [{ x: 6, w: 70, y: 18, a: 'mint', b: 'paper' }, { x: 116, w: 70, y: 18, a: 'mint', b: 'paper' }],
  windows: [{ x: 10, y: 28, w: 62, h: 30, shop: true }, { x: 120, y: 28, w: 62, h: 30, shop: true }], signs: [{ text: 'Cafe Kumo', x: 73, y: 50, ramp: 'mint', light: true, ink: 'mint', inkI: 0 }] });
facade('town_mart', { w: 6, top: 12, roofH: 20, wallH: 90, wall: 'shop', wallRamp: 'paper', roof: 'flat', ac: [140], posts: false,
  door: { x: 70, style: 'slide' }, awnings: [{ x: 4, w: 184, y: 22, a: 'butter', b: 'coral', h: 8 }],
  windows: [{ x: 8, y: 38, w: 54, h: 40, shop: true }, { x: 130, y: 38, w: 54, h: 40, shop: true }], signs: [{ text: 'Sunny Mart', y: 36, ramp: 'butter', light: true, ink: 'coral' }] });
facade('town_library', { w: 7, top: 8, roofH: 50, wallH: 104, wall: 'brick', roof: 'slate', roofRamp: 'roofSlate',
  door: { x: 86, style: 'double', ramp: 'woodDark' },
  windows: [{ x: 14, y: 10, h: 30 }, { x: 60, y: 10, h: 30 }, { x: 136, y: 10, h: 30 }, { x: 182, y: 10, h: 30 }, { x: 14, y: 54, h: 30, curtain: 'forest' }, { x: 182, y: 54, h: 30, curtain: 'forest' }],
  signs: [{ text: 'Library', y: 96, ramp: 'paper', light: true, ink: 'navy' }] });
facade('town_post', { w: 5, top: 8, roofH: 48, wallH: 76, wall: 'plaster', roof: 'kawara', roofRamp: 'roofRed', wainscot: 'coral',
  door: { x: 66, style: 'glass' }, windows: [{ x: 16, curtain: 'coral' }, { x: 116, curtain: 'coral' }], signs: [{ text: 'Post office', y: 60, ramp: 'coral' }] });
facade('town_clockshop', { w: 5, top: 84, roofH: 44, wallH: 76, wall: 'siding', wallRamp: 'woodDark', roof: 'kawara', roofRamp: 'roofSlate',
  tower: { x: 52, w: 56 }, door: { x: 18, style: 'wood', ramp: 'wood' }, windows: [{ x: 72, y: 16, w: 40, h: 30, shop: true }, { x: 124, curtain: 'butter' }],
  signs: [{ text: "Wren's Clocks", y: 130, ramp: 'butter', light: true, ink: 'woodDark', hang: true }] });
facade('town_sunny_pines', { w: 9, top: 6, roofH: 52, wallH: 76, wall: 'siding', wallRamp: 'paper', roof: 'kawara', roofRamp: 'roofTeal', wainscot: 'mint',
  door: { x: 118, style: 'double', ramp: 'wood' }, awnings: [{ x: 110, w: 68, y: 2, a: 'mint', b: 'paper' }],
  windows: [{ x: 16, curtain: 'mint', box: true }, { x: 62, curtain: 'mint', box: true }, { x: 196, curtain: 'mint', box: true }, { x: 242, curtain: 'mint', box: true }],
  signs: [{ text: 'Sunny Pines', y: 58, ramp: 'forest' }] });
facade('town_school', { w: 16, top: 14, roofH: 22, wallH: 128, wall: 'plaster', wallRamp: 'paper', roof: 'flat', ac: [40, 420], posts: false,
  door: { x: 230, style: 'slide' },
  windows: [32, 80, 128, 176, 304, 352, 400, 448].flatMap((x) => [{ x, y: 14, w: 32, h: 28 }, { x, y: 62, w: 32, h: 28 }]).concat([{ x: 236, y: 14, w: 40, h: 28 }]),
  signs: [{ text: 'Hoshimori High', y: 94, ramp: 'navy' }],
  extra: (R, M, season, { wy }) => { R(0, wy + 52, 512, 3, M.mint[2]); R(0, wy + 100, 512, 3, M.mint[2]); const cx = 256, cy = wy + 8; void cx; void cy; } });
facade('town_gym', { w: 9, top: 6, roofH: 34, wallH: 90, wall: 'siding', wallRamp: 'paper', roof: 'tin', roofRamp: 'roofSlate',
  door: { x: 118, style: 'double', ramp: 'metal' }, windows: [24, 68, 194, 238].map((x) => ({ x, y: 10, w: 28, h: 20 })), signs: [{ text: 'Gym', y: 56, ramp: 'navy' }] });

// Shotengai shop fronts: two storeys, flat roof, a painted signboard, and an awning or noren.
const SHOP = (o) => ({ w: 5, top: 10, roofH: 16, wallH: 104, roof: 'flat', posts: true, ...o });
facade('town_shop_salon', SHOP({ wall: 'plaster', wallRamp: 'lilac', door: { x: 98, style: 'glass' }, windows: [{ x: 12, y: 60, w: 70, h: 30, shop: true }, { x: 20, y: 8, curtain: 'lilac' }, { x: 104, y: 8, curtain: 'lilac' }],
  awnings: [{ x: 6, w: 148, y: 46, a: 'lilac', b: 'paper' }], signs: [{ text: 'Salon Snip', y: 54, ramp: 'lilac', light: true, ink: 'lilac', inkI: 0 }] }));
facade('town_shop_clinic', SHOP({ wall: 'plaster', wallRamp: 'paper', door: { x: 66, style: 'glass' }, windows: [{ x: 14, y: 52, curtain: 'mint' }, { x: 118, y: 52, curtain: 'mint' }, { x: 14, y: 8 }, { x: 118, y: 8 }],
  cross: { x: 72, y: 12 }, signs: [{ text: 'Dr. Mori clinic & vet', y: 50, ramp: 'mint', light: true, ink: 'mint', inkI: 0 }] }));
facade('town_shop_woodworks', SHOP({ wall: 'siding', wallRamp: 'wood', door: { x: 20, style: 'double', ramp: 'woodDark' }, windows: [{ x: 98, y: 54, w: 50, h: 34, shop: true }, { x: 30, y: 8, curtain: 'forest' }, { x: 110, y: 8, curtain: 'forest' }],
  noren: [{ x: 18, w: 56, y: 56, ramp: 'forest' }], signs: [{ text: 'Kinoko Woodworks', y: 44, ramp: 'woodDark' }] }));
facade('town_shop_wagashi', SHOP({ wall: 'plaster', door: { x: 66, style: 'wood' }, windows: [{ x: 10, y: 54, w: 44, h: 34, shop: true }, { x: 108, y: 54, w: 44, h: 34, shop: true }, { x: 66, y: 8, curtain: 'coral' }],
  noren: [{ x: 62, w: 36, y: 56, ramp: 'coral', text: '' }], signs: [{ text: 'Sweets', y: 44, ramp: 'coral' }] }));
facade('town_shop_books', SHOP({ wall: 'brick', wallRamp: 'brick', door: { x: 120, style: 'glass' }, windows: [{ x: 10, y: 54, w: 94, h: 34, shop: true }, { x: 30, y: 8, curtain: 'butter' }, { x: 104, y: 8, curtain: 'butter' }],
  awnings: [{ x: 6, w: 104, y: 42, a: 'navy', b: 'paper' }], signs: [{ text: 'Books', y: 26, ramp: 'navy' }] }));
facade('town_shop_tea', SHOP({ wall: 'siding', wallRamp: 'woodDark', door: { x: 66, style: 'wood' }, windows: [{ x: 12, y: 56, w: 40, h: 32, shop: true }, { x: 108, y: 56, w: 40, h: 32, shop: true }, { x: 66, y: 8, curtain: 'mint' }],
  noren: [{ x: 60, w: 40, y: 58, ramp: 'navy' }], signs: [{ text: 'Tea house', y: 44, ramp: 'forest' }] }));

// The greenhouse (school grounds): a glass house, not a facade.
spr('town_greenhouse', 160, 104, (R, M, se) => {
  const F = M.metal;
  R(4, 40, 152, 62, M.mint[3]); R(4, 40, 152, 62, '#bfe6f5'); for (let x = 4; x < 156; x += 16) R(x, 40, 2, 62, F[3]);
  R(4, 70, 152, 2, F[3]); R(4, 98, 152, 4, F[1]);
  for (let i = 0; i < 9; i++) { R.e(14 + i * 16, 92, 6, 5, M.leaf[2]); R.e(12 + i * 16, 90, 3, 2, M.leaf[3]); if (se !== 'winter') R(14 + i * 16, 87, 2, 2, M.flower[i % M.flower.length]); }
  R.t([0, 42], [160, 42], [80, 4], F[3]); R.t([6, 40], [80, 40], [80, 8], '#d8f0fa'); R.t([80, 40], [154, 40], [80, 8], '#a8d0e4');
  for (let k = 0; k < 7; k++) line(R, 80, 6, 8 + k * 24, 40, F[2]);
  R(0, 40, 160, 3, F[1]); R(66, 66, 28, 36, F[2]); R(68, 68, 24, 34, '#a8d0e4'); R(78, 68, 2, 34, F[2]);
  if (se === 'winter') { R.t([20, 36], [140, 36], [80, 10], M.snow[4]); }
  R(10, 46, 12, 6, '#ffffffaa'); R(28, 46, 6, 3, '#ffffffaa');
}, { seasonal: true });
