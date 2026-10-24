
/* ===================================================== SCENE BAKING */
const _scenes = new Map();
const HINTS = { menu: 'chalkboard', mirror: 'mirror', notices: 'notice', notice: 'notice', speaker: 'loudspeaker', loudspeaker: 'loudspeaker', portrait: 'portrait', mat: 'mat', rope: 'rope', lockers: 'lockers', bench: 'bench', tray: 'tray', desk: 'desk', cabinet: 'vault', window: 'window', boiler: 'boiler', table: 'table', statue: 'statue', mic: 'mic', horn: 'loudspeaker', poster: 'banner', trunk: 'crate', door: 'door',
  // art2
  posters: ['banner', 'poster_wall'], poster_wall: 'poster_wall', queue: ['barrier', 'rope'], kiosk: 'kiosk', tram: 'tram_stop', gate: ['vault_door', 'fence'], relaygate: 'vault_door', car: 'car',
  console: 'console', generator: 'generator', aerial: ['antenna', 'ladder'], ropes: 'ropes', array: 'loudspeaker', view: ['window', 'railing'], vault: ['vault', 'vault_door'], bell: ['bell', 'bigbell'],
  bunk: 'bunk', hotplate: 'hotplate', footlocker: 'crate', catalog: 'catalog', globe: 'globe', stacks: ['bookshelf', 'curtain'], logbook: 'desk', stall: 'stall' };
function propRect(p) {
  const w = p.w || 1, h = p.h || 1;
  if (p.side === 'l') return { u0: 0, v0: p.y || 0, u1: 1, v1: (p.y || 0) + (p.side === 'l' ? h : w) };
  if (p.side === 'r') return { u0: p.x || 0, v0: 0, u1: (p.x || 0) + w, v1: 1 };
  return { u0: p.x || 0, v0: p.y || 0, u1: (p.x || 0) + w, v1: (p.y || 0) + h };
}
function matchProp(props, o) {
  const words = ((o.id || '').toLowerCase().split('_').slice(1).join(' ') + ' ' + (o.label || '').toLowerCase()).split(/[^a-z]+/).filter(Boolean);
  const hint = new Set(); for (const w of words) { const h = HINTS[w]; if (h) (Array.isArray(h) ? h : [h]).forEach(x => hint.add(x)); }
  let best = null, bs = 1e9; const ox = o.x + .5, oy = o.y + .5;
  props.forEach((p, i) => {
    if (p.t === 'rug' || p.t === 'plant' && !hint.has('plant')) return;
    const q = propRect(p), area = (q.u1 - q.u0) * (q.v1 - q.v0);
    const dx = Math.max(q.u0 - ox, 0, ox - q.u1), dy = Math.max(q.v0 - oy, 0, oy - q.v1), d = Math.hypot(dx, dy);
    if (d > 1.7) return;
    let s = d * 10 + Math.min(area, 20) * .2;
    if (d === 0) s -= 4;
    if (hint.has(p.t)) s -= 40; else if (hint.size && !(hint.has(p.t))) s += 6;
    if (s < bs) { bs = s; best = i; }
  });
  if (best !== null && bs < 14) return best;
  return null;
}

/* ---------------------------------------------------------------- grading
 * per-scene colour grade: contrast S-curve, saturation, split toning (tinted shadows / warm highlights).
 * gradeOf(S) -> params; gradePx(G, r, g, b, out) for a single pixel. */
function gradeOf(S) {
  const m = S.mood, b = S.bucket, night = b === 4, eve = b === 3;
  const sh = night ? mix(m.sh || [8, 24, 40], [6, 14, 52], .5) : (m.sh || [8, 24, 40]);
  const hi = eve ? mix(m.hi || [255, 190, 120], [255, 140, 70], .4) : (m.hi || [255, 190, 120]);
  return { sh, hi, sat: (m.sat || .92) * (night ? .85 : 1), con: m.con || 1.1, ws: night ? .62 : .5, wh: .2 };
}
function gradePx(G, r, g, b, o) {
  let l = (r * .3 + g * .59 + b * .11) / 255;
  const c = G.con;
  r = (r / 255 - .46) * c + .46; g = (g / 255 - .46) * c + .46; b = (b / 255 - .46) * c + .46;
  const l2 = r * .3 + g * .59 + b * .11, s = G.sat;
  r = l2 + (r - l2) * s; g = l2 + (g - l2) * s; b = l2 + (b - l2) * s;
  l = l < 0 ? 0 : l > 1 ? 1 : l;
  const ws = (1 - l) * (1 - l) * (1 - l) * G.ws, wh = l * l * l * G.wh;
  r = r * 255; g = g * 255; b = b * 255;
  r += (G.sh[0] - r) * ws + (G.hi[0] - r) * wh; g += (G.sh[1] - g) * ws + (G.hi[1] - g) * wh; b += (G.sh[2] - b) * ws + (G.hi[2] - b) * wh;
  o[0] = r; o[1] = g; o[2] = b;
}
function gradeCanvas(c, G, S) {   // via the dithered 64^3 LUT (fast)
  const g = ctx2(c), id = g.getImageData(0, 0, c.width, c.height), d = id.data, L = gradeLUT(S);
  let h = 12345;
  for (let i = 0; i < d.length; i += 4) {
    h = (h * 1103515245 + 12345) & 0x7fffffff; const dt = (h >> 16) & 3;
    let r = d[i] + dt, gg = d[i + 1] + dt, b = d[i + 2] + dt; r = r > 255 ? 255 : r; gg = gg > 255 ? 255 : gg; b = b > 255 ? 255 : b;
    const li = (((r >> 2) << 12) | ((gg >> 2) << 6) | (b >> 2)) * 3; d[i] = L[li]; d[i + 1] = L[li + 1]; d[i + 2] = L[li + 2];
  }
  g.putImageData(id, 0, 0);
}
/* 64^3 LUT of the grade (for per-frame character relighting) */
function gradeLUT(S) {
  if (S.lut) return S.lut;
  const L = new Uint8ClampedArray(64 * 64 * 64 * 3), o = [0, 0, 0], G = S.grade;
  for (let r = 0, i = 0; r < 64; r++) for (let g = 0; g < 64; g++) for (let b = 0; b < 64; b++, i += 3) { gradePx(G, r * 4.05, g * 4.05, b * 4.05, o); L[i] = o[0]; L[i + 1] = o[1]; L[i + 2] = o[2]; }
  return (S.lut = L);
}

/* --------------------------------------------------------------- light kit */
const _lspr = new Map();
function lightSprite(col) {          // soft painted falloff (quadratic core, brushy rim)
  col = C(col); const k = col.map(v => Math.round(v / 8)).join(','); let c = _lspr.get(k); if (c) return c;
  const N = 128; c = mk(N, N); const g = ctx2(c), gr = g.createRadialGradient(N / 2, N / 2, 0, N / 2, N / 2, N / 2);
  gr.addColorStop(0, css(col, 1)); gr.addColorStop(.18, css(col, .78)); gr.addColorStop(.42, css(col, .4)); gr.addColorStop(.7, css(col, .12)); gr.addColorStop(1, css(col, 0));
  g.fillStyle = gr; g.fillRect(0, 0, N, N);
  const r = RNG(k); g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 40; i++) { const a = r() * 6.28, d = N * (.15 + r() * .32); bristle(g, N / 2 + Math.cos(a) * d, N / 2 + Math.sin(a) * d, a + 1.57, r.r(14, 34), r.r(3, 8), [0, 0, 0], .12, r); }
  _lspr.set(k, c); return c;
}
function lightDraw(g, L, x, y, rx, ry, a) { g.globalAlpha = Math.min(1, a); g.drawImage(lightSprite(L), x - rx, y - ry, rx * 2, ry * 2); }
/* light influence at a screen point (0..1+) */
function lightInf(Lg, x, y) { const dx = x - Lg.x, dy = (y - Lg.y) * 1.3, d = Math.sqrt(dx * dx + dy * dy), R = Lg.r * 1.25; return d >= R ? 0 : Lg.a * (1 - d / R); }
function strongestLight(S, x, y, skipBox) {
  let best = null, bi = 0;
  for (const Lg of S.lights) {
    if (Lg.kind === 'heat') continue;
    if (skipBox && Lg.x > skipBox[0] && Lg.x < skipBox[2] && Lg.y > skipBox[1] && Lg.y < skipBox[3]) continue;
    const v = lightInf(Lg, x, y) * (Lg.kind === 'window' ? 2.2 : Lg.kind === 'pool' ? .6 : 1);
    if (v > bi) { bi = v; best = Lg; }
  }
  return best ? { L: best, inf: bi } : null;
}
/* shadow direction (screen vector on the floor, y already foreshortened) for a point */
function shadowDir(S, x, y, skipBox) {
  const s = strongestLight(S, x, y - 30, skipBox);
  if (s && s.inf > .05 && s.L.kind !== 'window') {
    let dx = x - s.L.x, dy = (y - s.L.y); const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const len = clamp(.32 + 60 / (d + 60) * .25, .3, .62);
    let Dy = dy * .5 * len; if (Math.abs(Dy) < .12) Dy = Dy < 0 ? -.12 : .12;
    return { x: dx * len, y: Dy, a: clamp(s.inf * 1.6, .3, .7) };
  }
  return S.shDir;
}
/* black silhouette of a canvas (alpha kept) */
function silhouette(src, col) { const c = mk(src.width, src.height), g = ctx2(c); g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col || '#000'; g.fillRect(0, 0, c.width, c.height); return c; }
/* cheap portable blur: down-sample twice and back up */
function softBlur(src, k) {
  const w = Math.max(1, Math.round(src.width / k)), h = Math.max(1, Math.round(src.height / k)), a = mk(w, h), ga = ctx2(a);
  ga.imageSmoothingEnabled = true; ga.drawImage(src, 0, 0, w, h);
  const b = mk(Math.max(1, w >> 1), Math.max(1, h >> 1)), gb = ctx2(b); gb.drawImage(a, 0, 0, b.width, b.height);
  const out = mk(src.width, src.height), go = ctx2(out); go.globalAlpha = .5; go.drawImage(a, 0, 0, out.width, out.height); go.drawImage(b, 0, 0, out.width, out.height); go.globalAlpha = 1;
  return out;
}

function buildScene(loc, bucket) {
  const now = () => (typeof performance !== 'undefined') ? performance.now() : 0, t0 = now(), prof = {};
  let tp = t0; const lap = (k) => { const t = now(); prof[k] = Math.round(t - tp); tp = t; };
  const ws = worldSize(loc), seed = hashStr(loc.id || 'x');
  const S = { loc, seed, r: RNG(seed), tx: originX(loc), ty: originY(), W: ws.w, H: ws.h, bucket, mood: MOODS[loc.mood] || MOODS.warm, lights: [], exitLights: [], steam: [], dapples: [], neons: [], beams: [], lightK: [.9, 1, 1, .8, .32][bucket], prof };
  if (S.mood.storm) S.lightK = .55; else if (S.mood.neon) S.lightK = .5;
  S.rain = loc.rain !== undefined ? !!loc.rain : (S.mood.storm && (loc.id === 'tower' || loc.floor === 'asphalt'));
  S.wet = loc.floor === 'asphalt' || loc.floor === 'cobble' || (S.mood.storm && loc.floor === 'metal');
  S.grade = gradeOf(S);
  const base = mk(ws.w * BS, ws.h * BS), g = ctx2(base); g.scale(BS, BS);
  let props = (loc.props || []).slice().map(p => (p && p.t === 'stairs' && (p.v | 0) === 1 && !p.side) ? Object.assign({}, p, { t: 'spiral' }) : p);
  const objects = loc.objects || [];
  for (const o of objects) {
    const m = matchProp(props, o);
    const words = (o.id || '').toLowerCase();
    if ((m === null) || (/menu/.test(words) && props[m] && props[m].t !== 'chalkboard') || (/mirror/.test(words) && props[m] && props[m].t !== 'mirror')) {
      if (/mirror/.test(words)) { const pr = { t: 'mirror', x: o.x, y: o.y, w: 1, h: 1, v: 0, label: o.label, _obj: o.id }; props.push(pr); }
      else if (/menu/.test(words)) { const pr = { t: 'chalkboard', side: 'r', x: Math.min(o.x + 1.6, (loc.w || 12) - 3), y: 0, w: 2, h: 1, v: 0, label: 'Menu', _obj: o.id }; props.push(pr); }
    }
  }
  S.props = props;
  // 1. backdrop, floor + flat props
  paintBackdrop(g, S); lap('backdrop');
  paintFloor(g, S); lap('floor');
  const flat = props.filter(p => !p.side && FLAT[p.t]).sort((a, b) => ({ rug: 0, stairs: 1, mat: 2, stage: 2, rope: 3, door: 4 }[a.t] || 0) - ({ rug: 0, stairs: 1, mat: 2, stage: 2, rope: 3, door: 4 }[b.t] || 0));
  S.stages = props.filter(p => p.t === 'stage').map(propRect);
  for (const p of flat) { const q = propRect(p), I = { r: RNG(seed + hashStr(p.t + p.x + ',' + p.y)), v: (p.v | 0) % 4, u0: q.u0, v0: q.v0, u1: q.u1, v1: q.v1 }; try { FLAT[p.t](g, S, p, I); } catch (e) { if (typeof console !== 'undefined') console.warn('Art flat prop failed', p.t, e); } }
  paintFloorEdge(g, S); lap('flat');
  // 2. walls
  paintWall(g, S, 'r'); paintWall(g, S, 'l');
  for (const p of props) if (p.side && WALLPROPS[p.t]) { try { bakeWallProp(g, S, p); } catch (e) { if (typeof console !== 'undefined') console.warn('Art wall prop failed', p.t, e); } }
  paintWallCaps(g, S); lap('walls');
  // 3. sprites
  S.items = [];
  const supports = props.filter(p => SUPPORT_Z[p.t]).map(p => Object.assign({ z: SUPPORT_Z[p.t] }, propRect(p)));
  props.forEach((p, idx) => {
    if (p.side && WALLPROPS[p.t]) { S.items.push({ p, idx, kind: 'wall', rect: propRect(p) }); return; }
    if (!p.side && FLAT[p.t]) { S.items.push({ p, idx, kind: 'flat', rect: propRect(p) }); return; }
    const type = PROPS[p.t] ? p.t : 'crate', q = propRect(p), fn = PROPS[type], unk = !PROPS[p.t];
    const cu = (q.u0 + q.u1) / 2, cv = (q.v0 + q.v1) / 2;
    let zoff = 0;
    for (const st of S.stages) if (cu > st.u0 && cu < st.u1 && cv > st.v0 && cv < st.v1) zoff = Math.max(zoff, STAGE_H);
    if (p.t === 'tray') for (const sp of supports) if (cu > sp.u0 && cu < sp.u1 && cv > sp.v0 && cv < sp.v1) zoff = Math.max(zoff, sp.z + 1);
    const Sx = Object.create(S); Sx.ty = S.ty - zoff;
    const H = (PH[type] || 100), ex = PEX[type] || 14;
    const left = Math.floor(gp(Sx, q.u0, q.v1, 0)[0] - ex - 14), right = Math.ceil(gp(Sx, q.u1, q.v0, 0)[0] + ex + 14);
    const top = Math.floor(gp(Sx, q.u0, q.v0, H)[1] - 12), bottom = Math.ceil(gp(Sx, q.u1, q.v1, 0)[1] + 16);
    const c = mk((right - left) * BS, (bottom - top) * BS), sg = ctx2(c);
    sg.scale(BS, BS); sg.translate(-left, -top);
    const I = { r: RNG(seed + hashStr(p.t + p.x + ',' + p.y + 'z')), v: unk ? hashStr(String(p.t)) % 3 : (p.v | 0) % 4, u0: q.u0, v0: q.v0, u1: q.u1, v1: q.v1, w: p.w || 1, h: p.h || 1 };
    try { fn(sg, Sx, Object.assign({}, p, { t: type }), I); } catch (e) { if (typeof console !== 'undefined') console.warn('Art prop failed', p.t, e); }
    S.items.push({ p, idx, kind: 'sprite', rect: q, spr: { c, x: left, y: top }, cu, cv, zoff, foot: gp(Sx, cu, cv, 0), fp: [gp(Sx, q.u0, q.v0, 0), gp(Sx, q.u1, q.v0, 0), gp(Sx, q.u1, q.v1, 0), gp(Sx, q.u0, q.v1, 0)] });
  });
  S.sprites = S.items.filter(i => i.kind === 'sprite');
  S.order = sortProps(S.sprites); lap('props');
  // 4. lighting
  lightPass(S, base); lap('light');
  S.base = S.comp;
  S.objMap = new Map();
  for (const o of objects) { const m = matchProp(props, o); let idx = m; if (o.id) { const inj = props.findIndex(p => p._obj === o.id); if (inj >= 0) idx = inj; } S.objMap.set(o.id, idx === null ? null : S.items[idx] || null); }
  S.bakeMs = now() - t0;
  return S;
}

/* the light pass: light map (ambient + painted light pools + window shafts - cast shadows) multiplied over
 * floor/walls/props, then hot cores, volumetric beams, wet reflections, bloom, colour grade, lit-sprite extraction. */
function lightPass(S, base) {
  const loc = S.loc, r = RNG(S.seed + 404), W = S.W, H = S.H, b = S.bucket, mood = S.mood, interior = loc.mood !== 'dusk' && loc.floor !== 'asphalt';
  const prof = S.prof, now = () => (typeof performance !== 'undefined') ? performance.now() : 0; let tp = now(); const lap = (k) => { const t = now(); prof[k] = Math.round(t - tp); tp = t; };
  // ---- default light direction: daylight through windows, else a soft top light
  const wins = (S.props || []).filter(p => p.t === 'window' && p.side);
  const day = b !== 4, wr = wins.filter(p => p.side === 'r').length, wl = wins.filter(p => p.side === 'l').length;
  S.shDir = day && (wr || wl) ? (wr >= wl ? { x: -.62, y: .3, a: .5 } : { x: .62, y: .3, a: .5 }) : { x: -.28, y: .22, a: .38 };
  if (!interior) S.shDir = day ? { x: -.7, y: .34, a: .48 } : { x: -.3, y: .22, a: .36 };
  // ---- composite: base + props (raw)
  const comp = mk(base.width, base.height), cg = ctx2(comp);
  cg.drawImage(base, 0, 0);
  cg.save(); cg.scale(BS, BS);
  for (const it of S.order) cg.drawImage(it.spr.c, it.spr.x, it.spr.y, it.spr.c.width / BS, it.spr.c.height / BS);
  cg.restore(); lap('comp');
  // ---- light map at half world resolution
  const LS = .5, LW = Math.ceil(W * LS), LH = Math.ceil(H * LS), lm = mk(LW, LH), lg = ctx2(lm);
  const tt = timeTint(BUCKET_MIN[b]), kk = mood.grade !== undefined ? mood.grade : (interior ? .7 : 1), lit = mood.lit || [.62, .58, .56];
  let amb = [0, 1, 2].map(i => lit[i] * lerp(1, tt.mul[i], kk));
  if (day && wins.length && interior) amb = amb.map(v => v * 1.08);
  if (interior) amb = [amb[0] * .93, amb[1] * .97, amb[2] * 1.06];
  lg.fillStyle = css(amb.map(v => v * 255)); lg.fillRect(0, 0, LW, LH);
  lg.save(); lg.scale(LS, LS);
  // depth darkening toward the scene edges and the ceiling line
  const ctr = gp(S, lw(loc) * .55, lh(loc) * .55, 30), Rr = Math.hypot(W, H) * .5;
  let gg = lg.createRadialGradient(ctr[0], ctr[1], Rr * .25, ctr[0], ctr[1], Rr * 1.05); gg.addColorStop(0, 'rgba(0,0,0,0)'); gg.addColorStop(.6, 'rgba(0,0,0,.12)'); gg.addColorStop(1, 'rgba(0,0,0,.42)');
  lg.fillStyle = gg; lg.fillRect(0, 0, W, H);
  gg = lg.createLinearGradient(0, S.ty - WALLH - 20, 0, S.ty - WALLH * .3); gg.addColorStop(0, 'rgba(0,0,0,.4)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); lg.fillStyle = gg; lg.fillRect(0, 0, W, S.ty);
  // lights
  lg.globalCompositeOperation = 'lighter';
  const gain = interior ? 1.5 : 1.3;
  for (const Lg of S.lights) {
    const a = Lg.a * gain, R = Lg.r;
    if (Lg.kind === 'pool') lightDraw(lg, Lg.col, Lg.x, Lg.y, R * 1.6, R * .9, a * 1.2);
    else if (Lg.kind === 'window') lightDraw(lg, Lg.col, Lg.x, Lg.y + 10, R * 1.8, R * 1.6, a * 1.3);
    else if (Lg.kind === 'door') lightDraw(lg, Lg.col, Lg.x, Lg.y + 30, R * 1.4, R * 1.0, a * 1.4);
    else if (Lg.kind === 'heat') lightDraw(lg, Lg.col, Lg.x, Lg.y, R * 1.2, R * .7, a);
    else {
      lightDraw(lg, Lg.col, Lg.x, Lg.y, R * 1.7, R * 1.5, a * 1.15);
      if (R > 60 && Lg.kind !== 'neon') lightDraw(lg, Lg.col, Lg.x, Lg.y + R * .9, R * 1.5, R * .75, a * .45);   // pool cast on the floor below
    }
  }
  // window shafts on the floor + glow round the frame (daylight; faint moonlight at night)
  const col = mood.dapple || DAPPLE[b], ka = (mood.dapple ? .8 : DAPPLE_A[b]) * S.lightK * (day ? 1 : .55), skew = b <= 1 ? .55 : b === 2 ? .2 : -.15;
  for (const p of wins) {
    const s0 = (p.side === 'l' ? p.y : p.x) || 0, s1 = s0 + ((p.side === 'l' ? p.h : p.w) || 1), L = (b === 3 ? 7 : 5.2), z0 = (p.v | 0) % 4 === 3 ? 62 : 52, zt = z0 + ((p.v | 0) % 4 === 3 ? 56 : 74);
    const m0 = s0 + (s1 - s0) * .5 - Math.min(.9, (s1 - s0) * .5), m1 = s0 + (s1 - s0) * .5 + Math.min(.9, (s1 - s0) * .5);
    const F = (a, d) => p.side === 'r' ? gp(S, a + d * skew, d, 0) : gp(S, d, a + d * skew, 0);
    const poly = [F(m0, .05), F(m1, .05), F(m1, L), F(m0, L)];
    lg.save(); lg.globalCompositeOperation = 'lighter';
    const q0 = F((m0 + m1) / 2, 0), q1 = F((m0 + m1) / 2, L), lgr = lg.createLinearGradient(q0[0], q0[1], q1[0], q1[1]);
    lgr.addColorStop(0, css(col, .7 * ka)); lgr.addColorStop(.5, css(col, .34 * ka)); lgr.addColorStop(1, css(col, 0));
    lg.fillStyle = lgr; pathPoly(lg, poly, r, 4); lg.fill();
    // mullion shadows across the shaft
    lg.globalCompositeOperation = 'source-over'; lg.strokeStyle = css([0, 0, 0], .22 * ka); lg.lineWidth = 6;
    const mm = (m0 + m1) / 2; let a0 = F(mm, .1), a1 = F(mm, L); lg.beginPath(); lg.moveTo(a0[0], a0[1]); lg.lineTo(a1[0], a1[1]); lg.stroke();
    lg.restore();
    const wc = p.side === 'r' ? gp(S, (s0 + s1) / 2, 0, (z0 + zt) / 2) : gp(S, 0, (s0 + s1) / 2, (z0 + zt) / 2);
    lg.globalCompositeOperation = 'lighter'; lightDraw(lg, col, wc[0], wc[1], 90, 80, .35 * ka); lg.globalCompositeOperation = 'source-over';
    // volumetric beam (drawn later, additive over the composite)
    const w0 = p.side === 'r' ? gp(S, m0, 0, zt) : gp(S, 0, m0, zt), w1 = p.side === 'r' ? gp(S, m1, 0, zt) : gp(S, 0, m1, zt), w2 = p.side === 'r' ? gp(S, m1, 0, z0) : gp(S, 0, m1, z0), w3 = p.side === 'r' ? gp(S, m0, 0, z0) : gp(S, 0, m0, z0);
    S.beams.push({ pts: [w0, w1, F(m1, L * .8), F(m0, L * .8)], win: [w0, w1, w2, w3], c0: q0, c1: F((m0 + m1) / 2, L * .8), col, a: ka });
  }
  // dappled light spots
  const n = Math.round(lw(loc) * lh(loc) * .3);
  lg.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const u = r.r(.4, lw(loc) - .4), v = r.r(.4, lh(loc) - .4), q = gp(S, u, v, 0), s = r.r(14, 48), cc = jit(col, r, .12);
    lightDraw(lg, cc, q[0], q[1], s, s * .5, r.r(.05, .16) * ka);
    if (i % 3 === 0) S.dapples.push({ x: q[0], y: q[1], s: s * 1.2, ph: r() * 6.28, col: cc });
  }
  lg.globalCompositeOperation = 'source-over';
  lg.restore(); lap('lmap');
  // ---- cast shadows + contact occlusion -> shadow mask, subtracted from the light map
  const sm = mk(LW, LH), sg = ctx2(sm);
  sg.save(); sg.scale(LS, LS);
  for (const it of S.sprites) {
    if (it.p.t === 'rug') continue;
    const c = it.spr.c, box = [it.spr.x, it.spr.y, it.spr.x + c.width / BS, it.spr.y + c.height / BS], cx = it.foot[0], cy = it.foot[1];
    const D = shadowDir(S, cx, cy, box);
    const sil = silhouette(c);
    sg.save(); sg.globalAlpha = D.a; sg.setTransform(LS, 0, 0, LS, 0, 0); sg.translate(cx, cy); sg.transform(1, 0, -D.x, -D.y, 0, 0);
    sg.drawImage(sil, it.spr.x - cx, it.spr.y - cy, c.width / BS, c.height / BS); sg.restore();
    sg.globalAlpha = .55; sg.fillStyle = '#000'; const fp = it.fp, mx = (fp[0][0] + fp[2][0]) / 2, my = (fp[0][1] + fp[2][1]) / 2;
    sg.beginPath(); fp.forEach((pt, i) => { const x = mx + (pt[0] - mx) * 1.12, y = my + (pt[1] - my) * 1.15 + 2; i ? sg.lineTo(x, y) : sg.moveTo(x, y); }); sg.closePath(); sg.fill(); sg.globalAlpha = 1;
  }
  sg.restore();
  const smb = softBlur(sm, 3), smb2 = softBlur(sm, 7);
  lg.globalAlpha = .4; lg.drawImage(smb2, 0, 0); lg.globalAlpha = .32; lg.drawImage(smb, 0, 0); lg.globalAlpha = .1; lg.drawImage(sm, 0, 0); lg.globalAlpha = 1; lap('shadows');
  S.lm = lm; S.LS = LS;
  try { S.lmData = lg.getImageData(0, 0, LW, LH).data; S.LW = LW; S.LH = LH; } catch (e) { S.lmData = null; }
  // ---- multiply the light map over the composite
  cg.save(); cg.globalCompositeOperation = 'multiply'; cg.imageSmoothingEnabled = true; cg.drawImage(lm, 0, 0, comp.width, comp.height); cg.restore();
  cg.save(); cg.scale(BS, BS);
  // hot cores / glow halos (additive)
  cg.globalCompositeOperation = 'lighter';
  for (const Lg of S.lights) {
    if (Lg.kind === 'pool' || Lg.kind === 'door') continue;
    const R = Lg.r, a = Lg.a;
    if (Lg.kind === 'window') { cg.globalAlpha = Math.min(1, a * .35); cg.drawImage(glowSprite(Lg.col, 128), Lg.x - R, Lg.y - R, R * 2, R * 2); continue; }
    cg.globalAlpha = Math.min(1, a * .55); cg.drawImage(glowSprite(Lg.col, 128), Lg.x - R * .9, Lg.y - R * .9, R * 1.8, R * 1.8);
    cg.globalAlpha = Math.min(1, a * .9); cg.drawImage(glowSprite(mix(Lg.col, [255, 250, 230], .5), 128), Lg.x - R * .22, Lg.y - R * .22, R * .44, R * .44);
  }
  cg.globalAlpha = 1;
  // volumetric window beams
  for (const bm of S.beams) {
    const gr2 = cg.createLinearGradient(bm.win[0][0], bm.win[0][1], bm.c1[0], bm.c1[1]);
    gr2.addColorStop(0, css(bm.col, .2 * bm.a)); gr2.addColorStop(.6, css(bm.col, .07 * bm.a)); gr2.addColorStop(1, css(bm.col, 0));
    cg.globalCompositeOperation = 'screen'; cg.fillStyle = gr2; pathPoly(cg, bm.pts, r, 6); cg.fill();
    for (let k = 0; k < 3; k++) { cg.globalAlpha = .5; cg.fillStyle = gr2; const o = (k - 1) * 9; pathPoly(cg, bm.pts.map(p => [p[0] + o, p[1]]), r, 8); cg.fill(); }
    cg.globalAlpha = 1;
    cg.globalCompositeOperation = 'lighter'; cg.globalAlpha = .28 * bm.a; pathPoly(cg, bm.win); cg.fillStyle = css(bm.col); cg.fill(); cg.globalAlpha = 1;
  }
  cg.globalCompositeOperation = 'source-over';
  cg.restore();
  if (S.wet) wetReflections(S, cg, r);
  // atmospheric haze toward the top of the scene (warm/cool per mood)
  {
    const hz = mix(S.grade.hi, mood.sky ? mood.sky[1] : [200, 190, 170], .5);
    const hg = cg.createLinearGradient(0, 0, 0, (S.ty) * BS); hg.addColorStop(0, css(hz, .13)); hg.addColorStop(.6, css(hz, .05)); hg.addColorStop(1, css(hz, 0));
    cg.globalCompositeOperation = 'screen'; cg.fillStyle = hg; cg.fillRect(0, 0, comp.width, S.ty * BS); cg.globalCompositeOperation = 'source-over';
  }
  lap('fx');
  // ---- colour grade + bloom
  gradeCanvas(comp, S.grade, S); lap('grade');
  bloomPass(comp, S); lap('bloom');
  applyGrain(cg, comp.width, comp.height, .14, 'overlay');
  // match the void colour at the borders to the per-frame clear colour
  { const px = cg.getImageData(2, 2, 1, 1).data; S.bgCol = [px[0], px[1], px[2]]; const E = 80 * BS, cw = comp.width, ch = comp.height, bc = S.bgCol;
    const edge = (x0, y0, x1, y1, rx, ry, rw, rh) => { const g3 = cg.createLinearGradient(x0, y0, x1, y1); g3.addColorStop(0, css(bc, 1)); g3.addColorStop(1, css(bc, 0)); cg.fillStyle = g3; cg.fillRect(rx, ry, rw, rh); };
    edge(0, 0, E, 0, 0, 0, E, ch); edge(cw, 0, cw - E, 0, cw - E, 0, E, ch); edge(0, 0, 0, E, 0, 0, cw, E); edge(0, ch, 0, ch - E, 0, ch - E, cw, E); }
  // ---- lit sprites for re-drawing in front of characters
  for (const it of S.sprites) {
    const c = it.spr.c, l = mk(c.width, c.height), g2 = ctx2(l);
    g2.drawImage(comp, it.spr.x * BS, it.spr.y * BS, c.width, c.height, 0, 0, c.width, c.height);
    g2.globalCompositeOperation = 'destination-in'; g2.drawImage(c, 0, 0);
    it.lit = l;
  }
  S.comp = comp; lap('extract');
}
function wetReflections(S, cg, r) {
  const loc = S.loc, W = S.W, H = S.H, k = .25, RW = Math.ceil(W * k), RH = Math.ceil(H * k), rc = mk(RW, RH), rg = ctx2(rc);
  rg.save(); rg.scale(k, k); rg.globalCompositeOperation = 'lighter';
  const fy0 = S.ty, fy1 = S.ty + (lw(loc) + lh(loc)) * 16;
  for (const Lg of S.lights) {
    if (Lg.kind === 'pool' || Lg.kind === 'heat' || Lg.kind === 'door') continue;
    const y0 = Math.max(fy0, Lg.y + 24), len = 120 + Lg.r * 1.2, wd = 8 + Lg.r * .12, a = Math.min(.9, Lg.a * 1.4);
    const gr = rg.createLinearGradient(0, y0, 0, y0 + len); gr.addColorStop(0, css(Lg.col, a)); gr.addColorStop(.3, css(Lg.col, a * .5)); gr.addColorStop(1, css(Lg.col, 0));
    rg.fillStyle = gr;
    for (let s = 0; s < 5; s++) { const x = Lg.x + (s - 2) * wd * .45 + r.r(-3, 3); rg.fillRect(x - wd * .35, y0 + r.r(0, 12), wd * .7, len * r.r(.6, 1)); }
  }
  for (const ns of S.neons) { const gr = rg.createLinearGradient(0, ns.y + ns.h, 0, ns.y + ns.h + 200); gr.addColorStop(0, 'rgba(255,90,160,.5)'); gr.addColorStop(1, 'rgba(255,90,160,0)'); rg.fillStyle = gr; rg.fillRect(ns.x, ns.y + ns.h + 30, ns.w, 200); }
  rg.restore();
  // wetness mask in floor space
  const fw = lw(loc) * 16, fh = lh(loc) * 16, mc = mk(fw, fh), mg = ctx2(mc), id = mg.createImageData(fw, fh), d = id.data, cob = loc.floor === 'cobble';
  for (let y = 0, i = 0; y < fh; y++) for (let x = 0; x < fw; x++, i += 4) {
    const u = x * 4, v = y * 4;
    const w = cob ? sstep(.6, .71, nt(u * .009 + 3, v * .011 + 7)) : loc.floor === 'asphalt' ? sstep(.46, .62, nt(u * .006 + 20, v * .008 + 40)) * .9 + .1 : sstep(.5, .7, nt(u * .008 + 5, v * .01 + 60)) * .7;
    d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = w * 255;
  }
  mg.putImageData(id, 0, 0);
  rg.save(); rg.globalCompositeOperation = 'destination-in'; rg.scale(k, k); floorFrame(rg, S); rg.drawImage(mc, 0, 0, lw(loc) * 64, lh(loc) * 64); rg.restore();
  cg.save(); cg.globalCompositeOperation = 'lighter'; cg.globalAlpha = .8; cg.drawImage(rc, 0, 0, W * BS, H * BS); cg.restore();
}
function bloomPass(comp, S) {
  const k = 6, w = Math.ceil(comp.width / k), h = Math.ceil(comp.height / k), c = mk(w, h), g = ctx2(c);
  g.drawImage(comp, 0, 0, w, h);
  const id = g.getImageData(0, 0, w, h), d = id.data, thr = S.bucket === 4 || S.mood.neon || S.mood.storm || S.mood.lamp || S.mood === MOODS.ember ? 150 : 185;
  for (let i = 0; i < d.length; i += 4) {
    const l = d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11, f = l > thr ? (l - thr) / (255 - thr) : 0, ff = f * f * 1.6;
    d[i] *= ff; d[i + 1] *= ff; d[i + 2] *= ff; d[i + 3] = 255;
  }
  g.putImageData(id, 0, 0);
  const b1 = softBlur(c, 2), b2 = softBlur(c, 5), cg = ctx2(comp);
  cg.save(); cg.globalCompositeOperation = 'lighter'; cg.imageSmoothingEnabled = true;
  cg.globalAlpha = .5; cg.drawImage(b1, 0, 0, comp.width, comp.height); cg.globalAlpha = .55; cg.drawImage(b2, 0, 0, comp.width, comp.height); cg.restore();
}

function relRect(A, B) {   // -1: A behind B ; 1: A in front ; 0: unknown
  const e = .001;
  const aB = A.u1 <= B.u0 + e || A.v1 <= B.v0 + e, bB = B.u1 <= A.u0 + e || B.v1 <= A.v0 + e;
  if (aB && !bB) return -1; if (bB && !aB) return 1; if (aB && bB) return 0;
  const sa = A.u0 + A.u1 + A.v0 + A.v1, sb = B.u0 + B.u1 + B.v0 + B.v1;
  // overlapping footprints: container first
  return sa === sb ? 0 : (sa < sb ? -1 : 1);
}
function sortProps(items) {
  const n = items.length, out = [], placed = new Array(n).fill(false), before = items.map(() => []);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j) { const r = relRect(items[i].rect, items[j].rect); if (r === 1) before[i].push(j); }
  const key = (it) => it.rect.u0 + it.rect.u1 + it.rect.v0 + it.rect.v1;
  for (let k = 0; k < n; k++) {
    let best = -1;
    for (let i = 0; i < n; i++) { if (placed[i]) continue; if (before[i].every(j => placed[j])) { if (best < 0 || key(items[i]) < key(items[best])) best = i; } }
    if (best < 0) { for (let i = 0; i < n; i++) if (!placed[i] && (best < 0 || key(items[i]) < key(items[best]))) best = i; }
    placed[best] = true; out.push(items[best]);
  }
  return out;
}
function elevAt(S, x, y) { const u = x + .5, v = y + .5; for (const st of S.stages) if (u > st.u0 && u < st.u1 && v > st.v0 && v < st.v1) return STAGE_H; return 0; }

/* ======================================================= RENDERER */
const _shadow = {};
function shadowSprite() {
  if (_shadow.c) return _shadow.c; const c = mk(64, 32), g = ctx2(c), gr = g.createRadialGradient(32, 16, 1, 32, 16, 30);
  gr.addColorStop(0, 'rgba(6,4,14,.8)'); gr.addColorStop(.45, 'rgba(6,4,14,.42)'); gr.addColorStop(1, 'rgba(6,4,14,0)'); g.fillStyle = gr; g.save(); g.scale(1, .5); g.fillRect(0, 0, 64, 64); g.restore(); return (_shadow.c = c);
}
function propRing(item) {
  if (item.ring) return item.ring; const src = item.spr.c, W = src.width, H = src.height, c = mk(W + 12, H + 12), g = ctx2(c), R = 2.2 * BS;
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.2832; g.drawImage(src, 6 + Math.cos(a) * R, 6 + Math.sin(a) * R); }
  g.globalCompositeOperation = 'source-in'; g.fillStyle = 'rgb(96,255,120)'; g.fillRect(0, 0, W + 12, H + 12);
  g.globalCompositeOperation = 'destination-out'; g.drawImage(src, 6, 6);
  item.ring = c; return c;
}
function spriteRing(spr) {
  if (spr.ring) return spr.ring; const src = spr.c, W = src.width, H = src.height, pad = 8, c = mk(W + pad * 2, H + pad * 2), g = ctx2(c), R = 2.0 + K * .15;
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.2832; g.drawImage(src, pad + Math.cos(a) * R, pad + Math.sin(a) * R); }
  g.globalCompositeOperation = 'source-in'; g.fillStyle = 'rgb(96,255,120)'; g.fillRect(0, 0, W + pad * 2, H + pad * 2);
  const glow = mk(W + pad * 2, H + pad * 2), gg = ctx2(glow); gg.globalAlpha = .35; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.2832; gg.drawImage(c, Math.cos(a) * R * 1.8, Math.sin(a) * R * 1.8); } gg.globalAlpha = 1; gg.drawImage(c, 0, 0);
  gg.globalCompositeOperation = 'destination-out'; gg.drawImage(src, pad, pad);
  spr.ring = glow; spr.pad = pad; return glow;
}
/* --- character relighting: sprite pixels x light-map sample, graded with the scene LUT, plus a rim from the key light */
function sprPixels(spr) { if (spr._ePx) return spr._ePx; try { spr._ePx = ctx2(spr.c).getImageData(0, 0, spr.c.width, spr.c.height); } catch (e) { spr._ePx = null; } return spr._ePx; }
function sprSil(spr) {     // blurred quarter-res silhouette for cast shadows
  if (spr._eSil) return spr._eSil;
  const w = Math.max(1, spr.c.width >> 2), h = Math.max(1, spr.c.height >> 2), c = mk(w, h), g = ctx2(c);
  g.drawImage(spr.c, 0, 0, w, h); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#05040c'; g.fillRect(0, 0, w, h);
  return (spr._eSil = softBlur(c, 1.5));
}
function sprRim(spr, side, col) {
  const key = side + ':' + col.map(v => v >> 4).join(','); spr._eRim = spr._eRim || {}; if (spr._eRim[key]) return spr._eRim[key];
  const W = spr.c.width, H = spr.c.height, c = mk(W, H), g = ctx2(c), d = 3.2 * SS;
  g.drawImage(spr.c, 0, 0); g.globalCompositeOperation = 'destination-out'; g.drawImage(spr.c, -side * d, d * .55);
  g.globalCompositeOperation = 'source-in'; g.fillStyle = css(mix(col, [255, 255, 255], .25)); g.fillRect(0, 0, W, H);
  const keys = Object.keys(spr._eRim); if (keys.length > 6) delete spr._eRim[keys[0]];
  return (spr._eRim[key] = c);
}
function lmSample(S, x, y) {
  const d = S.lmData; if (!d) return [1, 1, 1];
  let i = Math.round(x * S.LS), j = Math.round(y * S.LS); i = i < 0 ? 0 : i >= S.LW ? S.LW - 1 : i; j = j < 0 ? 0 : j >= S.LH ? S.LH - 1 : j;
  const k = (j * S.LW + i) * 4; return [d[k] / 255, d[k + 1] / 255, d[k + 2] / 255];
}
function litEntity(R, S, e) {
  const spr = e.spr, px = sprPixels(spr);
  if (!px) return spr.c;
  const a = lmSample(S, e.sx, e.sy - 30), b2 = lmSample(S, e.sx, e.sy - 70), L = [(a[0] + b2[0]) / 2, (a[1] + b2[1]) / 2, (a[2] + b2[2]) / 2];
  const q = (v) => Math.round(Math.min(1.25, v * 1.12) * 40);
  const kl = strongestLight(S, e.sx, e.sy - 50);
  let rim = null;
  if (kl && kl.inf > .04) { const side = kl.L.x > e.sx ? 1 : -1; rim = { side, col: kl.L.col, a: clamp(kl.inf * 2.6, .15, .95) }; }
  const key = q(L[0]) + ',' + q(L[1]) + ',' + q(L[2]) + (rim ? '|' + rim.side + (rim.col.join('.')) + Math.round(rim.a * 10) : '');
  let E = R.ents.get(e.id || 'p');
  if (!E) { E = { c: null, key: '', spr: null, S: null }; R.ents.set(e.id || 'p', E); }
  if (E.spr === spr && E.key === key && E.S === S) return E.c;
  if (!E.c || E.c.width !== spr.c.width || E.c.height !== spr.c.height) { E.c = mk(spr.c.width, spr.c.height); E.id = null; }
  const g = ctx2(E.c), lut = gradeLUT(S), src = px.data;
  if (!E.id || E.id.width !== px.width) E.id = g.createImageData(px.width, px.height);
  const out = E.id.data, lr = q(L[0]) / 40 * 1.0, lgg = q(L[1]) / 40, lb = q(L[2]) / 40;
  for (let i = 0; i < src.length; i += 4) {
    const al = src[i + 3]; out[i + 3] = al; if (!al) continue;
    let r = src[i] * lr, gq = src[i + 1] * lgg, bq = src[i + 2] * lb; r = r > 255 ? 255 : r; gq = gq > 255 ? 255 : gq; bq = bq > 255 ? 255 : bq;
    const li = (((r >> 2) << 12) | ((gq >> 2) << 6) | (bq >> 2)) * 3;
    out[i] = lut[li]; out[i + 1] = lut[li + 1]; out[i + 2] = lut[li + 2];
  }
  g.putImageData(E.id, 0, 0);
  if (rim) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = rim.a; g.drawImage(sprRim(spr, rim.side, rim.col), 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  E.spr = spr; E.key = key; E.S = S;
  return E.c;
}

function makeRenderer(loc) {
  const R = { loc: loc, _last: null, stats: { frames: 0, ms: 0, bakeMs: 0 }, ents: new Map() };
  let sigProps = null, sigLen = -1, sig = '';
  function signature(l) {
    const ps = l.props || []; if (ps === sigProps && ps.length === sigLen) return sig;
    sigProps = ps; sigLen = ps.length; let s = ps.length + ':'; for (const p of ps) s += p.t + (p.x | 0) + ',' + (p.y | 0) + (p.v | 0) + (p.side || '') + '|'; sig = String(hashStr(s)); return sig;
  }
  function ensure(l, bucket) {
    const key = (l.id || '') + '|' + (l.mood || '') + '|' + bucket + '|' + signature(l);
    let S = _scenes.get(key);
    if (!S) {
      S = buildScene(l, bucket); S.key = key; _scenes.set(key, S); R.stats.bakeMs = S.bakeMs; R.stats.prof = S.prof;
      if (_scenes.size > 4) { const k = _scenes.keys().next().value; _scenes.delete(k); }
    } else { _scenes.delete(key); _scenes.set(key, S); }
    return S;
  }
  R.prebake = function (time) { return ensure(R.loc, bucketOf(time)); };
  R.draw = function (ctx, view, dyn) {
    const t1 = (typeof performance !== 'undefined') ? performance.now() : 0;
    dyn = dyn || {}; view = view || { camX: 0, camY: 0, zoom: 1, w: 1280, h: 720 };
    const l = R.loc, minute = (typeof dyn.time === 'number') ? dyn.time : 600, bucket = bucketOf(minute), S = ensure(l, bucket);
    const t = dyn.t || 0, zoom = view.zoom || 1, w = view.w, h = view.h, camX = view.camX || 0, camY = view.camY || 0;
    // ---- baked, lit, graded scene: one 1:1 device-pixel blit from a cache scaled to the current zoom*dpr
    let M = null; try { M = ctx.getTransform(); } catch (e) { M = null; }
    const ds = M ? Math.hypot(M.a, M.b) || 1 : 1, kz = zoom * ds;
    ctx.save();
    ctx.fillStyle = css(S.bgCol || S.mood.bg || [10, 9, 16]); ctx.fillRect(0, 0, w, h);
    if (M && Math.abs(M.b) < 1e-6 && Math.abs(M.c) < 1e-6 && S.W * S.H * kz * kz < 2.4e7) {
      if (!S.scr || Math.abs(S.scr.k - kz) > 1e-4) {
        for (const o of _scenes.values()) if (o !== S) o.scr = null;
        const c = mk(S.W * kz, S.H * kz), g = ctx2(c); g.imageSmoothingEnabled = true; try { g.imageSmoothingQuality = 'high'; } catch (e) { }
        g.drawImage(S.comp, 0, 0, c.width, c.height); S.scr = { k: kz, c };
      }
      const c = S.scr.c, ox = Math.round(M.e + (w / 2 - camX * zoom) * ds), oy = Math.round(M.f + (h / 2 - camY * zoom) * ds), DW = w * ds, DH = h * ds;
      const sx0 = Math.max(0, -ox), sy0 = Math.max(0, -oy), sx1 = Math.min(c.width, Math.ceil(DW - ox)), sy1 = Math.min(c.height, Math.ceil(DH - oy));
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (sx1 > sx0 && sy1 > sy0) ctx.drawImage(c, sx0, sy0, sx1 - sx0, sy1 - sy0, ox + sx0, oy + sy0, sx1 - sx0, sy1 - sy0);
      ctx.setTransform(M);
    }
    ctx.translate(w / 2, h / 2); ctx.scale(zoom, zoom); ctx.translate(-camX, -camY);
    const vx0 = camX - w / 2 / zoom, vy0 = camY - h / 2 / zoom, vw = w / zoom, vh = h / zoom;
    if (!S.scr) { const sx0 = Math.max(0, Math.floor(vx0)), sy0 = Math.max(0, Math.floor(vy0)), sx1 = Math.min(S.W, Math.ceil(vx0 + vw)), sy1 = Math.min(S.H, Math.ceil(vy0 + vh)); if (sx1 > sx0 && sy1 > sy0) ctx.drawImage(S.comp, sx0 * BS, sy0 * BS, (sx1 - sx0) * BS, (sy1 - sy0) * BS, sx0, sy0, sx1 - sx0, sy1 - sy0); }
    // ---- gather hover state
    const hover = dyn.hoverId || null, all = !!dyn.highlightAll;
    const hlItems = [];
    const objs = dyn.objects || [];
    const objDefs = l.objects || [];
    for (const o of objs) {
      const on = o.highlight || all || (hover && hover === o.id);
      if (!on) continue;
      const it = S.objMap.get(o.id);
      if (it) hlItems.push(it); else hlItems.push({ marker: o });
    }
    if (hover && !objs.length) { for (const od of objDefs) if (od.id === hover) { const it = S.objMap.get(od.id); hlItems.push(it || { marker: od }); } }
    const post = [];
    // ---- entities
    const ents = [];
    const pl = dyn.player;
    const pushEnt = (e, isPlayer, hl) => {
      const x = e.x || 0, y = e.y || 0, el = elevAt(S, x, y);
      const fr = e.walking ? 1 + (Math.floor(t / 115) % 4) : 0;
      const spr = figureNow(e.look || (isPlayer ? DEF_LOOK : null), e.facing || 's', fr, e.pose && e.pose !== (e.look && e.look.pose) ? e.pose : null);
      if (isPlayer && !R._warmed) { R._warmed = true; for (const f of ['s', 'se', 'e', 'ne', 'n', 'nw', 'w', 'sw']) { queueFigure(e.look || DEF_LOOK, f, 0); } for (const f of ['se', 'sw', 'ne', 'nw', 'e', 's', 'n', 'w']) for (let k = 1; k <= 4; k++) queueFigure(e.look || DEF_LOOK, f, k); }
      const p = project(l, x, y);
      ents.push({ x, y, sx: p.sx, sy: p.sy - el, spr, isPlayer, hl, id: isPlayer ? '@player' : e.id, fr, phase: (hashStr(e.id || 'p') % 100) / 16, rect: { u0: x + .5 - .22, u1: x + .5 + .22, v0: y + .5 - .22, v1: y + .5 + .22 }, walking: !!e.walking });
    };
    for (const n of (dyn.npcs || [])) pushEnt(n, false, !!(n.highlight || all || (hover && hover === n.id)));
    if (pl) pushEnt(pl, true, false);
    // ---- depth: slot each entity in the static prop order
    const order = S.order, n = order.length;
    for (const e of ents) {
      let idx = n;
      for (let i = 0; i < n; i++) { const rel = relRect(e.rect, order[i].rect); if (rel === -1) { idx = i; break; } }
      e.slot = idx;
    }
    ents.sort((a, b) => a.slot - b.slot || (a.x + a.y) - (b.x + b.y));
    // ground marks first: contact + cast shadows, player ring
    for (const e of ents) {
      const D = shadowDir(S, e.sx, e.sy), sil = sprSil(e.spr), spr = e.spr;
      e.sd = D;
      ctx.save(); ctx.translate(e.sx, e.sy); ctx.transform(1, 0, -D.x, -D.y, 0, 0); ctx.globalAlpha = clamp(D.a * .95, .2, .62);
      ctx.drawImage(sil, -spr.ax / SS, -spr.ay / SS, spr.w / SS, spr.h / SS); ctx.restore();
      ctx.globalAlpha = .85; ctx.drawImage(shadowSprite(), e.sx - 30, e.sy - 11, 60, 23); ctx.globalAlpha = 1;
    }
    if (pl) { const e = ents.find(q => q.isPlayer); const pulse = 1 + Math.sin(t * .004) * .04; ctx.save(); ctx.translate(e.sx, e.sy + 1); ctx.scale(1, .5);
      ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 0, 32 * pulse, 0, 7); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.92)'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(0, 0, 31 * pulse, 0, 7); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.beginPath(); ctx.arc(0, 0, 31 * pulse, 0, 7); ctx.fill(); ctx.restore(); }
    // characters, each followed by the props that stand in front of it (re-drawn clipped to its footprint on screen)
    for (const e of ents) {
      drawEnt(ctx, e, t, post, litEntity(R, S, e));
      const spr = e.spr, bx0 = e.sx - spr.ax / SS - 4, by0 = e.sy - spr.ay / SS - 4, bx1 = bx0 + spr.w / SS + 8, by1 = Math.max(by0 + spr.h / SS + 8, e.sy + 20);
      const cx0 = Math.min(bx0, e.sx - 40), cx1 = Math.max(bx1, e.sx + 40), cy1 = Math.max(by1, e.sy + 22);
      let clipped = false;
      for (let i = e.slot; i < n; i++) {
        const it = order[i], c = it.lit || it.spr.c, ix0 = it.spr.x, iy0 = it.spr.y, ix1 = ix0 + c.width / BS, iy1 = iy0 + c.height / BS;
        if (ix1 < cx0 || ix0 > cx1 || iy1 < by0 || iy0 > cy1) continue;
        if (!clipped) { ctx.save(); ctx.beginPath(); ctx.rect(cx0, by0, cx1 - cx0, cy1 - by0); ctx.clip(); clipped = true; }
        ctx.drawImage(c, ix0, iy0, c.width / BS, c.height / BS);
      }
      if (clipped) ctx.restore();
    }
    // collect highlight outlines
    const seen = new Set();
    for (const hI of hlItems) {
      if (hI.marker) { post.push({ k: 'diamond', x: hI.marker.x, y: hI.marker.y, a: .8 }); continue; }
      if (seen.has(hI)) continue; seen.add(hI);
      post.push({ k: 'item', it: hI });
    }
    if (hover && hover.indexOf('exit:') === 0) { const id = hover.slice(5); for (const ex of (l.exits || [])) if (ex.id === id) post.push({ k: 'diamond', x: ex.x, y: ex.y, a: 1, big: true }); }
    // ---- animated light: flicker, neon, steam, dapple shimmer, dust in the beams
    const flash = S.mood.storm ? lightning(t) : 0;
    ctx.globalCompositeOperation = 'lighter';
    for (const Lg of S.lights) {
      if (Lg.x + Lg.r < vx0 || Lg.x - Lg.r > vx0 + vw || Lg.y + Lg.r < vy0 || Lg.y - Lg.r > vy0 + vh) continue;
      let a = 0;
      if (Lg.kind === 'neon') { const v = neonFlicker(t, Lg.ph); if (v < .6) { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = (1 - v) * .45; ctx.drawImage(glowSprite([0, 0, 0], 128), Lg.x - Lg.r * 1.4, Lg.y - Lg.r * 1.2, Lg.r * 2.8, Lg.r * 2.4); ctx.globalCompositeOperation = 'lighter'; continue; } a = Lg.a * (v - .8) * .8; }
      else if (Lg.kind === 'window') a = S.mood.storm ? flash * Lg.a * 3 : 0;
      else if (Lg.fl > .015) { const o = Math.sin(t * .013 + Lg.ph) * .6 + Math.sin(t * .031 + Lg.ph * 2.3) * .4 + (lat(Math.floor(t / 90), Math.floor(Lg.ph * 10), 3) < Lg.fl * .5 ? .8 : 0); a = Lg.a * Lg.fl * o * 1.6; }
      if (a <= .004) continue;
      ctx.globalAlpha = Math.min(1, a); const rr = Lg.r * 1.2;
      ctx.drawImage(glowSprite(Lg.col, 128), Lg.x - rr, Lg.y - rr, rr * 2, rr * 2);
    }
    for (const d of S.dapples) {
      if (d.x < vx0 - 40 || d.x > vx0 + vw + 40 || d.y < vy0 - 40 || d.y > vy0 + vh + 40) continue;
      ctx.globalAlpha = Math.max(0, .06 * Math.sin(t * .0016 + d.ph)) * S.lightK * (bucket === 4 ? .5 : 1);
      if (ctx.globalAlpha < .004) continue;
      const s = d.s; ctx.drawImage(glowSprite(d.col, 128), d.x - s / 2, d.y - s / 4, s, s / 2);
    }
    for (const ns of S.neons) {
      if (ns.x + ns.w < vx0 || ns.x > vx0 + vw || ns.y + ns.h < vy0 || ns.y > vy0 + vh) continue;
      ctx.globalAlpha = neonFlicker(t, ns.ph); ctx.drawImage(ns.c, ns.x, ns.y, ns.w, ns.h);
    }
    for (const st of S.steam) {
      for (let k = 0; k < 5; k++) { const ph = ((t * .00032 + k / 5) % 1), y = st.y - ph * 70, x = st.x + Math.sin(ph * 5 + k) * 8 + ph * 10; ctx.globalAlpha = Math.sin(ph * 3.14) * .12; ctx.drawImage(glowSprite([210, 220, 230], 128), x - 12 - ph * 18, y - 12 - ph * 18, 24 + ph * 36, 24 + ph * 36); }
    }
    ctx.globalAlpha = 1;
    drawDust(ctx, t, vx0, vy0, vw, vh, S, bucket);
    ctx.globalCompositeOperation = 'source-over';
    if (S.rain) drawRain(ctx, t, vx0, vy0, vw, vh, zoom, S);
    for (const p of post) drawPost(ctx, S, p, t);
    ctx.restore();
    // ---- screen space: lightning, vignette + top haze, film grain
    ctx.save();
    if (flash > .02) { ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = css([200, 220, 255], flash * .3); ctx.fillRect(0, 0, w, h); ctx.globalCompositeOperation = 'source-over'; }
    const hz = S.mood.sky ? S.mood.sky[1] : S.grade.hi;
    ctx.drawImage(sceneVignette(w, h, mul(S.mood.bg || [6, 4, 10], .5), [hz[0], hz[1], hz[2], .07]), 0, 0, w, h);
    if (Art.quality.grain) {
      const o = (Math.floor(t / 60) * 53) % 256, o2 = (Math.floor(t / 60) * 97) % 256;
      ctx.globalAlpha = .5; ctx.translate(-o, -o2); ctx.fillStyle = ctx.createPattern(grainTileA(), 'repeat'); ctx.fillRect(0, 0, w + 256, h + 256);
    }
    ctx.restore();
    if (typeof performance !== 'undefined' && _warmQ.length && performance.now() - t1 < 9) warmStep(1);
    if (typeof performance !== 'undefined') { R.stats.frames++; R.stats.last = performance.now() - t1; R.stats.ms += R.stats.last; }
    R.scene = S;
  };
  return R;
}
function drawEnt(ctx, e, t, post, img) {
  const spr = e.spr, breath = 1 + Math.sin(t * .0022 + e.phase) * .011, bob = e.walking ? 0 : Math.sin(t * .0022 + e.phase) * .35;
  ctx.save(); ctx.translate(e.sx, e.sy + bob);
  if (spr.hang) { const ang = Math.sin(t * .0011 + e.phase) * .018; ctx.translate(spr.hang.x, spr.hang.y); ctx.rotate(ang); ctx.translate(-spr.hang.x, -spr.hang.y); } else ctx.scale(1, breath);
  ctx.drawImage(img || spr.c, -spr.ax / SS, -spr.ay / SS, spr.w / SS, spr.h / SS);
  ctx.restore();
  if (e.hl) post.push({ k: 'ent', e });
}
function drawPost(ctx, S, p, t) {
  const pulse = .85 + .15 * Math.sin(t * .006);
  if (p.k === 'ent') {
    const e = p.e, ring = spriteRing(e.spr), pad = e.spr.pad;
    ctx.save(); ctx.translate(e.sx, e.sy); ctx.globalAlpha = pulse;
    ctx.drawImage(ring, (-e.spr.ax - pad) / SS, (-e.spr.ay - pad) / SS, ring.width / SS, ring.height / SS); ctx.restore();
  } else if (p.k === 'item') {
    const it = p.it; ctx.save(); ctx.globalAlpha = pulse;
    if (it.kind === 'sprite') { const ring = propRing(it); ctx.drawImage(ring, it.spr.x - 6 / BS, it.spr.y - 6 / BS, ring.width / BS, ring.height / BS); }
    else {
      let pts;
      if (it.kind === 'wall') pts = wallFootprintPoly(S, it.p, 4, WALLH_TABLE[it.p.t] || 100);
      else { const q = it.rect, hh = it.p.t === 'stage' ? STAGE_H : it.p.t === 'mat' ? 9 : 2; pts = [gp(S, q.u0, q.v0, hh), gp(S, q.u1, q.v0, hh), gp(S, q.u1, q.v1, hh), gp(S, q.u0, q.v1, hh)]; }
      ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(96,255,120,.25)'; ctx.lineWidth = 6; pathPoly(ctx, pts); ctx.stroke();
      ctx.strokeStyle = 'rgb(110,255,130)'; ctx.lineWidth = 1.8; pathPoly(ctx, pts); ctx.stroke();
    }
    ctx.restore();
  } else if (p.k === 'diamond') {
    const c = gp(S, p.x + .5, p.y + .5, 0), a = p.a * pulse; ctx.save(); ctx.translate(c[0], c[1]);
    const k = p.big ? 1 : .55; const pts = [[0, -16 * k], [32 * k, 0], [0, 16 * k], [-32 * k, 0]];
    ctx.fillStyle = 'rgba(96,255,120,' + (.12 * a) + ')'; pathPoly(ctx, pts); ctx.fill();
    ctx.strokeStyle = 'rgba(96,255,120,' + (.3 * a) + ')'; ctx.lineWidth = 6; pathPoly(ctx, pts); ctx.stroke();
    ctx.strokeStyle = 'rgba(120,255,140,' + a + ')'; ctx.lineWidth = 1.8; pathPoly(ctx, pts); ctx.stroke();
    ctx.restore();
  }
}
function drawDust(ctx, t, vx0, vy0, vw, vh, S, bucket) {
  const col = S.mood.dapple || (bucket === 4 ? [160, 190, 255] : DAPPLE[bucket]);
  // motes drifting inside the window beams: bright, many
  for (let bi = 0; bi < S.beams.length; bi++) {
    const bm = S.beams[bi], p = bm.pts;
    ctx.fillStyle = css(mix(bm.col, [255, 255, 255], .4), 1);
    for (let i = 0; i < 34; i++) {
      const a = lat(i, bi, 15), b = lat(i, bi + 9, 15), sp = .00002 + lat(i, 3, 15) * .00003;
      const u = ((a + t * sp + Math.sin(t * .0005 + i) * .02) % 1 + 1) % 1, v = ((b + Math.cos(t * .00041 + i * 1.3) * .03 + t * sp * .3) % 1 + 1) % 1;
      const top = [p[0][0] + (p[1][0] - p[0][0]) * u, p[0][1] + (p[1][1] - p[0][1]) * u], bot = [p[3][0] + (p[2][0] - p[3][0]) * u, p[3][1] + (p[2][1] - p[3][1]) * u];
      const x = top[0] + (bot[0] - top[0]) * v, y = top[1] + (bot[1] - top[1]) * v;
      const tw = .3 + .7 * Math.abs(Math.sin(t * .0013 + i * 2.1));
      ctx.globalAlpha = (.18 + lat(i, 6, 15) * .4) * tw * bm.a * (1 - v * .7);
      ctx.fillRect(x, y, .9 + lat(i, 5, 15) * 1.3, .9 + lat(i, 5, 15) * 1.3);
    }
  }
  // motes hanging in lamp light
  let li = 0;
  for (const Lg of S.lights) {
    if (Lg.kind !== 'lamp' && Lg.kind !== 'fire' || Lg.r < 60) continue; if (li++ > 8) break;
    if (Lg.x + Lg.r < vx0 || Lg.x - Lg.r > vx0 + vw || Lg.y + Lg.r < vy0 || Lg.y - Lg.r > vy0 + vh) continue;
    ctx.fillStyle = css(mix(Lg.col, [255, 255, 255], .3), 1);
    for (let i = 0; i < 10; i++) {
      const a = lat(i, li, 25) * 6.28 + t * .00008 * (1 + lat(i, 2, 25)), d = Lg.r * (.15 + lat(i, 3, 25) * .55), y = Lg.y + Math.sin(a) * d * .6 + ((t * .004 * (.3 + lat(i, 4, 25))) % 40) - 20;
      ctx.globalAlpha = .35 * Math.abs(Math.sin(t * .001 + i)) * (1 - d / Lg.r);
      ctx.fillRect(Lg.x + Math.cos(a) * d, y, 1.3, 1.3);
    }
  }
  // sparse general dust
  const n = S.mood.storm ? 18 : 26;
  ctx.fillStyle = css(col, 1);
  for (let i = 0; i < n; i++) {
    const a = lat(i, 1, 5), b = lat(i, 2, 5), sp = .00002 + lat(i, 3, 5) * .00005;
    const x = vx0 + (((a + t * sp * (1 + lat(i, 4, 5)) + Math.sin(t * .0004 + i) * .006) % 1) + 1) % 1 * vw;
    const y = vy0 + (((b - t * sp * .8 + Math.cos(t * .00037 + i * 1.7) * .008) % 1) + 1) % 1 * vh;
    const s = .7 + lat(i, 5, 5) * 1.5, tw = .35 + .65 * Math.abs(Math.sin(t * .001 + i * 2.1));
    ctx.globalAlpha = (.1 + lat(i, 6, 5) * .2) * tw * S.lightK;
    ctx.fillRect(x, y, s, s);
  }
  ctx.globalAlpha = 1;
}
function drawRain(ctx, t, vx0, vy0, vw, vh, zoom, S) {
  ctx.save(); ctx.lineCap = 'round';
  for (let layer = 0; layer < 3; layer++) {
    const n = [70, 90, 40][layer];
    ctx.strokeStyle = ['rgba(150,180,220,.10)', 'rgba(180,205,245,.2)', 'rgba(220,235,255,.32)'][layer]; ctx.lineWidth = [.8, 1.1, 1.6][layer];
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const sp = [.0009, .0014, .002][layer] * (.8 + lat(i, layer, 61) * .5), a = lat(i, 7 + layer, 61), b = lat(i, 9 + layer, 61);
      const k = (b + t * sp) % 1, x = vx0 + (((a + k * .22) % 1) * vw), y = vy0 + k * vh * 1.1 - 20, L = [12, 22, 34][layer];
      ctx.moveTo(x, y); ctx.lineTo(x - L * .22, y + L);
    }
    ctx.stroke();
  }
  // splashes / ripples on the floor
  if (S && S.loc) {
    const loc = S.loc; ctx.strokeStyle = 'rgba(200,220,255,.35)'; ctx.lineWidth = .8;
    for (let i = 0; i < 40; i++) {
      const ph = ((t * .0016 + lat(i, 1, 71)) % 1), cyc = Math.floor(t * .0016 + lat(i, 1, 71));
      const u = lat(i, cyc, 72) * lw(loc), v = lat(i, cyc, 73) * lh(loc), q = gp(S, u, v, 0);
      if (q[0] < vx0 || q[0] > vx0 + vw || q[1] < vy0 || q[1] > vy0 + vh) continue;
      ctx.globalAlpha = (1 - ph) * .8; ctx.beginPath(); ctx.ellipse(q[0], q[1], 1 + ph * 7, .5 + ph * 3.5, 0, 0, 6.3); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

/* ---- art2 animation helpers ---- */
function neonFlicker(t, ph) {        // tube mostly steady with brown-outs and stutters
  const slot = Math.floor(t / 70), a = lat(slot, Math.floor(ph * 100), 41), b = lat(Math.floor(t / 1900), Math.floor(ph * 100), 42);
  let v = .92 + .08 * Math.sin(t * .02 + ph);
  if (b < .12) v *= a < .5 ? .15 : .9;       // occasional stutter burst
  else if (a < .018) v *= .3;
  return v;
}
function lightning(t) {              // returns 0..1 flash intensity, a few times a minute
  const cyc = 11000, k = Math.floor(t / cyc), ph = t - k * cyc, at = 2000 + lat(k, 1, 51) * 6000;
  const d = ph - at; if (d < 0 || d > 700) return 0;
  return d < 90 ? 1 - d / 140 : d < 200 ? .15 : d < 300 ? .75 * (1 - (d - 200) / 100) : d < 700 ? .1 * (1 - (d - 300) / 400) : 0;
}
