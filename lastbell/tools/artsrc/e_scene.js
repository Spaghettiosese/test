
/* ===================================================== SCENE BAKING */
const _scenes = new Map();
const HINTS = { menu: 'chalkboard', mirror: 'mirror', notices: 'notice', notice: 'notice', speaker: 'loudspeaker', loudspeaker: 'loudspeaker', portrait: 'portrait', mat: 'mat', rope: 'rope', lockers: 'lockers', bench: 'bench', tray: 'tray', desk: 'desk', cabinet: 'vault', window: 'window', boiler: 'boiler', table: 'table', statue: 'statue', bell: 'bell', mic: 'mic', horn: 'loudspeaker', poster: 'banner', trunk: 'crate', door: 'door' };
function propRect(p) {
  const w = p.w || 1, h = p.h || 1;
  if (p.side === 'l') return { u0: 0, v0: p.y || 0, u1: 1, v1: (p.y || 0) + (p.side === 'l' ? h : w) };
  if (p.side === 'r') return { u0: p.x || 0, v0: 0, u1: (p.x || 0) + w, v1: 1 };
  return { u0: p.x || 0, v0: p.y || 0, u1: (p.x || 0) + w, v1: (p.y || 0) + h };
}
function matchProp(props, o) {
  const words = ((o.id || '').toLowerCase().split('_').slice(1).join(' ') + ' ' + (o.label || '').toLowerCase()).split(/[^a-z]+/).filter(Boolean);
  const hint = new Set(); for (const w of words) if (HINTS[w]) hint.add(HINTS[w]);
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

function buildScene(loc, bucket) {
  const t0 = (typeof performance !== 'undefined') ? performance.now() : 0;
  const ws = worldSize(loc), seed = hashStr(loc.id || 'x');
  const S = { loc, seed, r: RNG(seed), tx: originX(loc), ty: originY(), W: ws.w, H: ws.h, bucket, mood: MOODS[loc.mood] || MOODS.warm, lights: [], exitLights: [], steam: [], dapples: [], lightK: [.9, 1, 1, .8, .32][bucket] };
  const base = mk(ws.w * BS, ws.h * BS), g = ctx2(base); g.scale(BS, BS);
  let props = (loc.props || []).slice();
  const objects = loc.objects || [];
  const injected = [];
  for (const o of objects) {
    const m = matchProp(props, o);
    const words = (o.id || '').toLowerCase();
    if ((m === null) || (/menu/.test(words) && props[m] && props[m].t !== 'chalkboard') || (/mirror/.test(words) && props[m] && props[m].t !== 'mirror')) {
      if (/mirror/.test(words)) { const pr = { t: 'mirror', x: o.x, y: o.y, w: 1, h: 1, v: 0, label: o.label, _obj: o.id }; props.push(pr); }
      else if (/menu/.test(words)) { const pr = { t: 'chalkboard', side: 'r', x: Math.min(o.x + 1.6, (loc.w || 12) - 3), y: 0, w: 2, h: 1, v: 0, label: 'Menu', _obj: o.id }; props.push(pr); }
    }
  }
  S.props = props;
  // 1. floor + flat props
  paintFloor(g, S);
  const flat = props.filter(p => !p.side && FLAT[p.t]).sort((a, b) => ({ rug: 0, stairs: 1, mat: 2, stage: 2, rope: 3, door: 4 }[a.t] || 0) - ({ rug: 0, stairs: 1, mat: 2, stage: 2, rope: 3, door: 4 }[b.t] || 0));
  S.stages = props.filter(p => p.t === 'stage').map(propRect);
  for (const p of flat) { const q = propRect(p), I = { r: RNG(seed + hashStr(p.t + p.x + ',' + p.y)), v: (p.v | 0) % 4, u0: q.u0, v0: q.v0, u1: q.u1, v1: q.v1 }; FLAT[p.t](g, S, p, I); }
  paintLightFloor(g, S);
  paintFloorEdge(g, S);
  // 2. walls
  paintWall(g, S, 'r'); paintWall(g, S, 'l');
  for (const p of props) if (p.side && WALLPROPS[p.t]) bakeWallProp(g, S, p);
  // 3. sprites
  S.items = [];
  const supports = props.filter(p => SUPPORT_Z[p.t]).map(p => Object.assign({ z: SUPPORT_Z[p.t] }, propRect(p)));
  props.forEach((p, idx) => {
    if (p.side && WALLPROPS[p.t]) { S.items.push({ p, idx, kind: 'wall', rect: propRect(p) }); return; }
    if (!p.side && FLAT[p.t]) { S.items.push({ p, idx, kind: 'flat', rect: propRect(p) }); return; }
    const type = PROPS[p.t] ? p.t : 'crate', q = propRect(p), fn = PROPS[type];
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
    const I = { r: RNG(seed + hashStr(p.t + p.x + ',' + p.y + 'z')), v: (p.v | 0) % 4, u0: q.u0, v0: q.v0, u1: q.u1, v1: q.v1, w: p.w || 1, h: p.h || 1 };
    try { fn(sg, Sx, Object.assign({}, p, { t: type }), I); } catch (e) { if (typeof console !== 'undefined') console.warn('Art prop failed', p.t, e); }
    S.items.push({ p, idx, kind: 'sprite', rect: q, spr: { c, x: left, y: top }, cu, cv, zoff });
  });
  S.sprites = S.items.filter(i => i.kind === 'sprite');
  S.order = sortProps(S.sprites);
  // 4. final painterly grain over the baked layer
  applyGrain(g, ws.w, ws.h, .22, 'overlay');
  S.base = base;
  S.objMap = new Map();
  for (const o of objects) { const m = matchProp(props, o); let idx = m; if (o.id) { const inj = props.findIndex(p => p._obj === o.id); if (inj >= 0) idx = inj; } S.objMap.set(o.id, idx === null ? null : S.items[idx] || null); }
  S.bakeMs = (typeof performance !== 'undefined') ? performance.now() - t0 : 0;
  return S;
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
  gr.addColorStop(0, 'rgba(6,4,14,.75)'); gr.addColorStop(.55, 'rgba(6,4,14,.35)'); gr.addColorStop(1, 'rgba(6,4,14,0)'); g.fillStyle = gr; g.save(); g.scale(1, .5); g.fillRect(0, 0, 64, 64); g.restore(); return (_shadow.c = c);
}
const _pm = {}; // sprite ring cache for props
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

function makeRenderer(loc) {
  const R = { loc: loc, _last: null, stats: { frames: 0, ms: 0, bakeMs: 0 } };
  let sigProps = null, sigLen = -1, sig = '';
  function signature(l) {
    const ps = l.props || []; if (ps === sigProps && ps.length === sigLen) return sig;
    sigProps = ps; sigLen = ps.length; let s = ps.length + ':'; for (const p of ps) s += p.t + (p.x | 0) + ',' + (p.y | 0) + (p.v | 0) + (p.side || '') + '|'; sig = String(hashStr(s)); return sig;
  }
  function ensure(l, bucket) {
    const key = (l.id || '') + '|' + (l.mood || '') + '|' + bucket + '|' + signature(l);
    let S = _scenes.get(key);
    if (!S) {
      S = buildScene(l, bucket); S.key = key; _scenes.set(key, S); R.stats.bakeMs = S.bakeMs;
      if (_scenes.size > 8) { const k = _scenes.keys().next().value; _scenes.delete(k); }
    } else { _scenes.delete(key); _scenes.set(key, S); }
    return S;
  }
  R.prebake = function (time) { return ensure(R.loc, bucketOf(time)); };
  R.draw = function (ctx, view, dyn) {
    const t1 = (typeof performance !== 'undefined') ? performance.now() : 0;
    dyn = dyn || {}; view = view || { camX: 0, camY: 0, zoom: 1, w: 1280, h: 720 };
    const l = R.loc, minute = (typeof dyn.time === 'number') ? dyn.time : 600, bucket = bucketOf(minute), S = ensure(l, bucket);
    const t = dyn.t || 0, zoom = view.zoom || 1, w = view.w, h = view.h, camX = view.camX || 0, camY = view.camY || 0;
    ctx.save();
    ctx.fillStyle = '#0a0910'; ctx.fillRect(0, 0, w, h);
    ctx.translate(w / 2, h / 2); ctx.scale(zoom, zoom); ctx.translate(-camX, -camY);
    // baked layer (clipped source rect)
    const vx0 = camX - w / 2 / zoom, vy0 = camY - h / 2 / zoom, vw = w / zoom, vh = h / zoom;
    const sx0 = Math.max(0, Math.floor(vx0)), sy0 = Math.max(0, Math.floor(vy0)), sx1 = Math.min(S.W, Math.ceil(vx0 + vw)), sy1 = Math.min(S.H, Math.ceil(vy0 + vh));
    if (sx1 > sx0 && sy1 > sy0) ctx.drawImage(S.base, sx0 * BS, sy0 * BS, (sx1 - sx0) * BS, (sy1 - sy0) * BS, sx0, sy0, sx1 - sx0, sy1 - sy0);
    // ---- gather hover state
    const hover = dyn.hoverId || null, all = !!dyn.highlightAll;
    const hlItems = [], hlSprites = [];
    const objs = dyn.objects || [];
    const objDefs = l.objects || [];
    for (const o of objs) {
      const on = o.highlight || all || (hover && hover === o.id);
      if (!on) continue;
      const it = S.objMap.get(o.id);
      if (it) hlItems.push(it); else hlItems.push({ marker: o });
    }
    if (hover && !objs.length) { for (const od of objDefs) if (od.id === hover) { const it = S.objMap.get(od.id); hlItems.push(it || { marker: od }); } }
    // flat/wall highlight polygons drawn before sprites (under); recorded for post
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
      ents.push({ x, y, sx: p.sx, sy: p.sy - el, spr, isPlayer, hl, id: e.id, fr, phase: (hashStr(e.id || 'p') % 100) / 16, rect: { u0: x + .5 - .22, u1: x + .5 + .22, v0: y + .5 - .22, v1: y + .5 + .22 }, walking: !!e.walking });
    };
    for (const n of (dyn.npcs || [])) pushEnt(n, false, !!(n.highlight || all || (hover && hover === n.id)));
    if (pl) pushEnt(pl, true, false);
    // ---- depth merge: props sorted statically, entities slotted in
    const order = S.order, n = order.length, slots = new Array(n + 1);
    for (let i = 0; i <= n; i++) slots[i] = null;
    for (const e of ents) {
      let idx = n;
      for (let i = 0; i < n; i++) { const rel = relRect(e.rect, order[i].rect); if (rel === -1) { idx = i; break; } }
      (slots[idx] || (slots[idx] = [])).push(e);
    }
    for (let i = 0; i <= n; i++) if (slots[i]) slots[i].sort((a, b) => (a.x + a.y) - (b.x + b.y));
    // ground-level marks first: shadows + player ring
    for (const e of ents) {
      ctx.globalAlpha = .9; ctx.drawImage(shadowSprite(), e.sx - 32 - 3, e.sy - 12, 64, 26); ctx.globalAlpha = 1;
    }
    if (pl) { const e = ents[ents.length - 1]; const pulse = 1 + Math.sin(t * .004) * .04; ctx.save(); ctx.translate(e.sx, e.sy + 1); ctx.scale(1, .5);
      ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 0, 32 * pulse, 0, 7); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.92)'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(0, 0, 31 * pulse, 0, 7); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.beginPath(); ctx.arc(0, 0, 31 * pulse, 0, 7); ctx.fill(); ctx.restore(); }
    // sprites + ents interleaved
    const seen = new Set();
    for (let i = 0; i <= n; i++) {
      if (slots[i]) for (const e of slots[i]) drawEnt(ctx, e, t, post);
      if (i < n) { const it = order[i]; ctx.drawImage(it.spr.c, it.spr.x, it.spr.y, it.spr.c.width / BS, it.spr.c.height / BS); }
    }
    // collect highlight outlines
    for (const hI of hlItems) {
      if (hI.marker) { post.push({ k: 'diamond', x: hI.marker.x, y: hI.marker.y, a: .8 }); continue; }
      if (seen.has(hI)) continue; seen.add(hI);
      post.push({ k: 'item', it: hI });
    }
    if (hover && hover.indexOf('exit:') === 0) { const id = hover.slice(5); for (const ex of (l.exits || [])) if (ex.id === id) post.push({ k: 'diamond', x: ex.x, y: ex.y, a: 1, big: true }); }
    // ---- lighting / tint in screen space
    ctx.restore();
    ctx.save();
    const tt = timeTint(minute), interior = (l.mood !== 'dusk'), kk = interior ? .8 : 1, am = S.mood.amb;
    const mulc = [am[0] * lerp(1, tt.mul[0], kk), am[1] * lerp(1, tt.mul[1], kk), am[2] * lerp(1, tt.mul[2], kk)];
    ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = css(mulc.map(v => v * 255)); ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    // world-space additive layer
    ctx.translate(w / 2, h / 2); ctx.scale(zoom, zoom); ctx.translate(-camX, -camY);
    ctx.globalCompositeOperation = 'lighter';
    const boost = 1 + (1 - lum(tt.mul)) * 1.6 * (interior ? .6 : 1);
    for (const Lg of S.lights) {
      if (Lg.x + Lg.r < vx0 || Lg.x - Lg.r > vx0 + vw || Lg.y + Lg.r < vy0 || Lg.y - Lg.r > vy0 + vh) continue;
      const fl = 1 + Lg.fl * (Math.sin(t * .013 + Lg.ph) * .6 + Math.sin(t * .031 + Lg.ph * 2.3) * .4);
      let a = Lg.a * fl * (Lg.kind === 'window' ? 1 : boost);
      if (Lg.kind === 'fire' || Lg.kind === 'lamp') a *= 1;
      ctx.globalAlpha = Math.min(1, a); const rr = Lg.r * (Lg.kind === 'window' ? 1 : 1);
      ctx.drawImage(glowSprite(Lg.col, 128), Lg.x - rr, Lg.y - rr, rr * 2, rr * 2);
    }
    // shimmering dapples
    for (const d of S.dapples) {
      if (d.x < vx0 - 40 || d.x > vx0 + vw + 40 || d.y < vy0 - 40 || d.y > vy0 + vh + 40) continue;
      ctx.globalAlpha = (.05 + .05 * Math.sin(t * .0016 + d.ph)) * S.lightK * (bucket === 4 ? .5 : 1);
      const s = d.s * 1.4; ctx.drawImage(glowSprite(d.col, 128), d.x - s / 2, d.y - s / 4, s, s / 2);
    }
    // steam
    for (const st of S.steam) {
      for (let k = 0; k < 4; k++) { const ph = ((t * .00035 + k / 4) % 1), y = st.y - ph * 60, x = st.x + Math.sin(ph * 5 + k) * 8 + ph * 8; ctx.globalAlpha = (1 - ph) * .1; ctx.drawImage(glowSprite([210, 220, 230], 128), x - 14 - ph * 14, y - 14 - ph * 14, 28 + ph * 28, 28 + ph * 28); }
    }
    ctx.globalAlpha = 1;
    // dust motes
    drawDust(ctx, t, vx0, vy0, vw, vh, S, bucket);
    ctx.globalCompositeOperation = 'source-over';
    // highlight outlines (bright green, unaffected by tint)
    for (const p of post) drawPost(ctx, S, p, t);
    ctx.restore();
    // colour wash, vignette, grain (screen space)
    ctx.save();
    if (tt.add[3] > 0) { ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = css(tt.add, tt.add[3] * (interior ? .6 : 1)); ctx.fillRect(0, 0, w, h); }
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(vignette(Math.round(w), Math.round(h)), 0, 0);
    if (Art.quality.grain) {
      ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = .13;
      const o = (Math.floor(t / 70) * 53) % 256, o2 = (Math.floor(t / 70) * 97) % 256;
      ctx.translate(-o, -o2); ctx.fillStyle = ctx.createPattern(grainTile(), 'repeat'); ctx.fillRect(0, 0, w + 256, h + 256);
    }
    ctx.restore();
    if (typeof performance !== 'undefined' && _warmQ.length && performance.now() - t1 < 9) warmStep(1);
    if (typeof performance !== 'undefined') { R.stats.frames++; R.stats.last = performance.now() - t1; R.stats.ms += R.stats.last; }
    R.scene = S;
  };
  return R;
}
function drawEnt(ctx, e, t, post) {
  const spr = e.spr, breath = 1 + Math.sin(t * .0022 + e.phase) * .011, bob = e.walking ? 0 : Math.sin(t * .0022 + e.phase) * .35;
  ctx.save(); ctx.translate(e.sx, e.sy + bob);
  if (spr.hang) { const ang = Math.sin(t * .0011 + e.phase) * .018; ctx.translate(spr.hang.x, spr.hang.y); ctx.rotate(ang); ctx.translate(-spr.hang.x, -spr.hang.y); } else ctx.scale(1, breath);
  ctx.drawImage(spr.c, -spr.ax / SS, -spr.ay / SS, spr.w / SS, spr.h / SS);
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
  const n = 46, col = bucket === 4 ? [160, 190, 255] : DAPPLE[bucket];
  ctx.fillStyle = css(col, 1);
  for (let i = 0; i < n; i++) {
    const a = lat(i, 1, 5), b = lat(i, 2, 5), sp = .00002 + lat(i, 3, 5) * .00005;
    const x = vx0 + (((a + t * sp * (1 + lat(i, 4, 5)) + Math.sin(t * .0004 + i) * .006) % 1) + 1) % 1 * vw;
    const y = vy0 + (((b - t * sp * .8 + Math.cos(t * .00037 + i * 1.7) * .008) % 1) + 1) % 1 * vh;
    const s = .8 + lat(i, 5, 5) * 1.9, tw = .35 + .65 * Math.abs(Math.sin(t * .001 + i * 2.1));
    ctx.globalAlpha = (.12 + lat(i, 6, 5) * .28) * tw * S.lightK;
    ctx.beginPath(); ctx.arc(x, y, s, 0, 6.3); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
