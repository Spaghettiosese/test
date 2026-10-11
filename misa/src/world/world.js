// The overworld scene: one map at a time, drawn at 2x with a camera that follows Misa.
// Extension points (register in your own module, never edit this file for content):
//   register('worldLayer', id, { below?(g, world, game), sprites?(world, game) -> [{ y, draw(g, world, game) }],
//                                above?(g, world, game), overlay?(g, world, game), solids?(world, game) -> [[x,y,w,h], ...] })
//   register('worldTick', id, { update(dt, world, game) })
//   register('targetProvider', id, { find(world, game) -> { label, dist, run(game), x?, y? } | null })
// Useful world helpers: world.map (id, def, tiles, w, h), world.player {x,y,dir}, world.sx(wx)/sy(wy) (world->screen),
//   world.drawSpr(name, wx, wy), world.drawFeet(name, wx, wy, flip), world.shadow(wx, wy, halfWidth),
//   world.particles.push({ spr | c, x, y, vx, vy, life, s }), world.npcs[id], world.actor(id), world.refreshRects().
import { get, all } from '../core/registry.js';
import { SPRITES } from '../art.js';
import { sprite2 } from '../artcache.js';
import { axis, act } from '../input.js';
import { drawChar } from '../gfx/chars.js';
import { TILE, buildMap, activeObjects, solidRects, moveBody, footprint, distToRect, warpAt, passGrid, tileAt, warpTarget } from './map.js';
import { check } from '../core/cond.js';
import { NPC } from './npc.js';
import { findPath } from '../core/path.js';
import { bakeGround, waterInfo, drawWaterFX } from '../gfx/ground.js';
import { drawLighting } from '../gfx/lighting.js';
import { drawWeather, ditherFade } from '../gfx/weather.js';
import { SHADOW } from '../gfx/palette.js';

export const Z = 2, VW = 320, VH = 224, REACH = 14;

export class WorldScene {
  constructor(game) {
    this.name = 'world'; this.opaque = true; this.pausesTime = false;
    this.game = game; game.world = this;
    this.cam = { x: 0, y: 0 };
    this.player = { x: 0, y: 0, dir: 'down', at: 0, moving: false, run: false, path: null };
    this.npcs = {}; // id -> NPC entity (persistent across maps)
    this.fade = 1; this.fadeTo = 0; this.busy = false; // map transitions
    this.pets = [];  // extra actors (Mochi etc.) registered by systems: { id, map, update, draw, y, x, interact }
    this.particles = [];
    this.lastWarp = null;
  }

  // ---------- maps ----------
  load(mapId, x, y, dir) {
    const game = this.game;
    this.map = buildMap(mapId);
    this.static = null; this.staticSeason = null;
    this.grid = passGrid(this.map, game);
    const p = this.player;
    if (x === undefined) { const s = this.map.spawns.default || [2, 2]; x = s[0] * TILE + 8; y = s[1] * TILE + 14; }
    Object.assign(p, { x, y, dir: dir || p.dir, path: null });
    for (const def of all('npc')) (this.npcs[def.id] ||= new NPC(def.id, def.id.length * 0.37)).sync(game, this.map, this.grid, true);
    this.refreshRects();
    game.state.map = mapId;
    this.storePosition();
    this.lastWarp = warpAt(this.map, p.x, p.y) || null;
    this.snapCamera();
    if (this.map.def.onEnter) this.map.def.onEnter(game);
    game.bus.emit('mapEnter', { map: mapId });
  }
  // Collision rects are cached; conditional props are re-checked a few times a second.
  refreshRects() {
    this.rects = solidRects(this.map, this.game);
    for (const L of all('worldLayer')) if (L.solids) this.rects.push(...L.solids(this, this.game));
    this.rectsT = 0.4;
  }
  storePosition() { if (this.map) Object.assign(this.game.state.pos, { x: Math.round(this.player.x), y: Math.round(this.player.y), dir: this.player.dir }); this.game.state.map = this.map ? this.map.id : this.game.state.map; }
  // Fade out, switch map, fade in. Resolves when the new map is visible.
  warp(mapId, tx, ty, dir) {
    if (this.busy) return Promise.resolve();
    this.busy = true; this.fadeTo = 1;
    return new Promise((res) => {
      this.afterFade = () => {
        this.load(mapId, tx === undefined ? undefined : tx * TILE + 8, ty === undefined ? undefined : ty * TILE + 14, dir);
        this.fadeTo = 0; this.busy = false; this.game.sfx('step'); res();
      };
    });
  }
  snapCamera() {
    const m = this.map, p = this.player;
    this.cam.x = m.pw * Z <= VW ? (m.pw * Z - VW) / 2 : Math.max(0, Math.min(m.pw * Z - VW, p.x * Z - VW / 2));
    this.cam.y = m.ph * Z <= VH ? (m.ph * Z - VH) / 2 : Math.max(0, Math.min(m.ph * Z - VH, p.y * Z - 40 - VH / 2));
  }

  // ---------- actors ----------
  presentNPCs() { return Object.values(this.npcs).filter((n) => n.present); }
  actor(id) {
    if (id === 'misa' || id === 'player') return this.playerActor();
    if (this.npcs[id]) return this.npcs[id];
    return this.pets.find((p) => p.id === id);
  }
  playerActor() {
    const p = this.player, w = this;
    return {
      get x() { return p.x; }, get y() { return p.y; },
      walkTo(tx, ty) { return w.autoWalk(tx, ty); },
      faceTo(x, y) { const dx = x - p.x, dy = y - p.y; p.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down'; },
      set dir(d) { p.dir = d; }, get dir() { return p.dir; },
      say(e, t = 1.6) { p.emote = e; p.emoteT = t; },
    };
  }
  autoWalk(tx, ty) {
    const p = this.player;
    const pass = (x, y) => this.grid[y] && this.grid[y][x];
    p.path = findPath(pass, Math.floor(p.x / TILE), Math.floor((p.y - 1) / TILE), tx, ty) || [[tx, ty]];
    return new Promise((res) => { p.onArrive = res; });
  }

  // What would E interact with right now?
  target() {
    const p = this.player, game = this.game;
    let best = null, bd = REACH;
    for (const o of activeObjects(this.map, game)) {
      if (!o.interact || (o.interact.when && !check(o.interact.when, game))) continue;
      const d = distToRect(p.x, p.y - 3, footprint(o));
      if (d < bd) { bd = d; best = { kind: 'obj', o, label: typeof o.interact.label === 'function' ? o.interact.label(game, o) : o.interact.label }; }
    }
    for (const n of this.presentNPCs()) {
      const d = Math.hypot(n.x - p.x, n.y - p.y) - 4;
      if (d < bd + 4) { bd = d; best = { kind: 'npc', npc: n, label: `Talk to ${n.def.name}` }; }
    }
    for (const tp of all('targetProvider')) {
      const t = tp.find(this, game);
      if (t && (t.dist ?? 0) < bd + 2) { bd = t.dist ?? 0; best = { kind: 'custom', label: t.label, run: t.run, x: t.x, y: t.y }; }
    }
    for (const a of this.pets) {
      if (a.map !== this.map.id || !a.interact) continue;
      const d = Math.hypot(a.x - p.x, a.y - p.y) - 4;
      if (d < bd + 4) { bd = d; best = { kind: 'pet', a, label: a.label || 'Pet' }; }
    }
    return best;
  }
  interact(t) {
    const game = this.game;
    if (!t) return;
    if (t.kind === 'npc') { t.npc.faceTo(this.player.x, this.player.y); game.bus.emit('talk', { npc: t.npc.id }); if (game.talk) game.talk(t.npc); return; }
    if (t.kind === 'pet') { t.a.interact(game); return; }
    if (t.kind === 'custom') { t.run(game); return; }
    const it = t.o.interact;
    game.bus.emit('interact', { obj: t.o });
    if (it.run) it.run(game, t.o);
    else if (it.script) game.run(get('script', it.script).steps(game, t.o));
  }

  // ---------- update ----------
  tick(dt) { this.animate(dt, false); }
  update(dt, input) { this.animate(dt, true, input); }
  animate(dt, control, input) {
    const game = this.game, p = this.player;
    if (this.fade !== this.fadeTo) {
      this.fade += Math.sign(this.fadeTo - this.fade) * dt * 5;
      if ((this.fadeTo === 1 && this.fade >= 1) || (this.fadeTo === 0 && this.fade <= 0)) { this.fade = this.fadeTo; if (this.fadeTo === 1 && this.afterFade) { const f = this.afterFade; this.afterFade = null; f(); } }
    }
    if ((this.rectsT -= dt) <= 0) this.refreshRects();
    const rects = this.rects;
    const wasMoving = p.moving, wasRun = p.run;
    let vx = 0, vy = 0;
    if (p.path && p.path.length) {
      const [nx, ny] = p.path[0], gx = nx * TILE + 8, gy = ny * TILE + 14, dx = gx - p.x, dy = gy - p.y, d = Math.hypot(dx, dy);
      if (d < 1.5) { p.x = gx; p.y = gy; p.path.shift(); if (!p.path.length) { p.path = null; if (p.onArrive) { const f = p.onArrive; p.onArrive = null; f(); } } }
      else { vx = dx; vy = dy; }
      p.run = false;
    } else if (control && !this.busy) {
      const a = axis(input); vx = a.x; vy = a.y;
      if (!vx && !vy && input.down && !input.justDown && game.settings.mouseWalk !== false) {
        const wx = (input.mx + this.cam.x) / Z, wy = (input.my + this.cam.y) / Z, dx = wx - p.x, dy = wy - (p.y - 12);
        if (Math.hypot(dx, dy) > 6) { vx = dx; vy = dy; }
      }
      p.run = !!(vx || vy) && (input.keys.has('shift') !== !!game.settings.runToggle);
    }
    const n = Math.hypot(vx, vy);
    p.moving = n > 0;
    if (n) {
      const sp = (p.path ? 50 : p.run ? 86 : 56) * (game.state.flags.speedBoost ? 1.15 : 1) * dt;
      if (p.path) { p.x += (vx / n) * Math.min(sp, n); p.y += (vy / n) * Math.min(sp, n); }
      else moveBody(this.map, p, (vx / n) * sp, (vy / n) * sp, rects);
      p.dir = Math.abs(vx) > Math.abs(vy) ? (vx < 0 ? 'left' : 'right') : vy < 0 ? 'up' : 'down';
      this.stepAcc = (this.stepAcc || 0) + sp / TILE;
      if (this.stepAcc >= 1) { game.stat('steps', Math.floor(this.stepAcc)); this.stepAcc %= 1; }
    }
    if (p.moving !== wasMoving || p.run !== wasRun) p.at = 0;
    p.at += dt;
    if (p.emoteT > 0) { p.emoteT -= dt; if (p.emoteT <= 0) p.emote = null; }

    // NPCs follow their schedules
    for (const npc of Object.values(this.npcs)) {
      npc.sync(game, this.map, this.grid, false);
      if (npc.present) npc.update(dt, game);
    }
    for (const a of this.pets) if (a.map === this.map.id && a.update) a.update(dt, game, this);
    for (const L of all('worldTick')) L.update(dt, this, game);
    this.particles = this.particles.filter((q) => (q.life -= dt) > 0);
    for (const q of this.particles) { q.x += (q.vx || 0) * dt; q.y += (q.vy || 0) * dt; }

    if (!control || this.busy) { this.followCamera(dt); return; }
    // warps
    const w = warpAt(this.map, p.x, p.y);
    if (w && w !== this.lastWarp && !p.path) {
      const needUp = w.enter === 'up', needDown = w.enter === 'down';
      if ((!needUp || vy < 0) && (!needDown || vy > 0) && check(w.when, game)) {
        if (w.locked && check(w.locked, game)) { if (!this.lockedMsg) { game.toast(typeof w.lockedText === 'function' ? w.lockedText(game) : w.lockedText || 'It\'s locked.'); this.lockedMsg = true; } }
        else { this.lastWarp = w; game.sfx('door'); const t = warpTarget(w); this.warp(t.map, t.tx, t.ty, t.dir); return; }
      }
    } else if (!w) { this.lastWarp = null; this.lockedMsg = false; }

    // menus
    const k = input.pressed;
    if (k.has('escape') || k.has('tab') || k.has('m')) { game.open('phone', 'bag'); return; }
    if (k.has('j')) { game.open('phone', 'quests'); return; }
    if (k.has('g')) { const t = this.target(); if (t && t.kind === 'npc') game.open('phone', 'bag'); else game.toast('Stand next to someone to give a gift'); return; }
    // interaction
    if (act(input)) {
      let t = this.target();
      if (input.justDown && !input.pressed.size && t) {
        // a mouse click only interacts with what was clicked
        const wx = (input.mx + this.cam.x) / Z, wy = (input.my + this.cam.y) / Z;
        const near = (x, y, r) => Math.hypot(wx - x, wy - y) < r;
        const ok = t.kind === 'obj' ? distToRect(wx, wy, footprint(t.o)) < 10 : t.kind === 'npc' ? near(t.npc.x, t.npc.y - 14, 16) : t.kind === 'custom' ? (t.x === undefined || near(t.x, t.y, 16)) : near(t.a.x, t.a.y - 6, 14);
        if (!ok) t = null;
      }
      if (t) this.interact(t);
    }
    this.followCamera(dt);
  }
  followCamera(dt) {
    const m = this.map, p = this.player;
    const tx = m.pw * Z <= VW ? (m.pw * Z - VW) / 2 : Math.max(0, Math.min(m.pw * Z - VW, p.x * Z - VW / 2));
    const ty = m.ph * Z <= VH ? (m.ph * Z - VH) / 2 : Math.max(0, Math.min(m.ph * Z - VH, p.y * Z - 40 - VH / 2));
    const k = Math.min(1, dt * 10);
    this.cam.x += (tx - this.cam.x) * k; this.cam.y += (ty - this.cam.y) * k;
    if (Math.abs(tx - this.cam.x) < 0.5) this.cam.x = tx;
    if (Math.abs(ty - this.cam.y) < 0.5) this.cam.y = ty;
  }

  // ---------- drawing ----------
  tileSprite(t) { const s = t.seasonal && t.seasonal[this.game.season]; return s || t.spr; }
  buildStatic() {
    const m = this.map, season = this.game.season;
    const baked = m.tiles.some((row) => row.some((t) => t.ground || t.floor || t.wall));
    const c = baked ? bakeGround(m, season, m.def.bg || '#1e1624') : document.createElement('canvas');
    if (!baked) { c.width = m.pw * Z; c.height = m.ph * Z; }
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    if (!baked && m.def.bg) { g.fillStyle = m.def.bg; g.fillRect(0, 0, c.width, c.height); }
    this.animTiles = [];
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      const t = m.tiles[y][x];
      if (t.anim) { this.animTiles.push([x, y, t]); continue; }
      if (t.ground || t.floor || t.wall) continue;
      const sp = typeof t.pick === 'function' ? t.pick(x, y, season, m) : this.tileSprite(t);
      if (sp) g.drawImage(sprite2(sp, false, season), x * TILE * Z, y * TILE * Z);
    }
    for (const o of m.objects) if (o.wall && !o.when) { const img = this.img(o.spr); if (img) g.drawImage(img, (o.x * TILE + (o.dx || 0)) * Z - this.pad(o.spr), ((o.y + o.h) * TILE + (o.dy || 0)) * Z - img.height + this.pad(o.spr)); }
    this.water = waterInfo(m);
    this.lights = m.objects.filter((o) => o.light);
    this.static = c; this.staticSeason = season;
  }
  img(name, flip) { return SPRITES[name] ? sprite2(name, flip, this.game.season) : null; }
  pad(name) { const d = SPRITES[name]; return d && d.hd ? d.pad || 0 : 0; }
  // Lights in view: { kind, x, y } in world px.
  visibleLights() {
    const out = [], game = this.game;
    for (const o of this.lights || []) {
      if (o.when && !check(o.when, game)) continue;
      for (const li of [].concat(o.light)) {
        if (li.when && !check(li.when, game)) continue;
        const fp = footprint(o);
        out.push({ kind: li.kind || 'lamp', x: fp[0] + (li.x ?? fp[2] / 2), y: fp[1] + (li.y ?? -8) });
      }
    }
    for (const li of this.map.def.lights || []) out.push({ kind: li.kind || 'lamp', x: li.x * TILE + 8, y: li.y * TILE + 8 });
    return out;
  }
  sx(wx) { return Math.round(wx * Z - this.cam.x); }
  sy(wy) { return Math.round(wy * Z - this.cam.y); }
  // Draw a sprite with its top-left at world (wx, wy) (legacy: world-unit size; hd: screen-pixel size).
  drawSpr(name, wx, wy, flip) { const img = this.img(name, flip); if (img) this.g.drawImage(img, this.sx(wx) - this.pad(name), this.sy(wy) - this.pad(name)); }
  // Draw a sprite standing on world point (wx, wy): centred horizontally, bottom at the point.
  drawFeet(name, wx, wy, flip) { const img = this.img(name, flip); if (img) this.g.drawImage(img, this.sx(wx) - Math.round(img.width / 2), this.sy(wy) - img.height + this.pad(name)); }
  // Contact shadow: a plum pixel ellipse (w = half width in screen px).
  shadow(wx, wy, w) {
    const g = this.g, cx = this.sx(wx), cy = this.sy(wy) - 1, ry = 2;
    g.fillStyle = SHADOW;
    for (let y = -ry; y <= ry; y++) { const ww = Math.floor(w * Math.sqrt(1 - (y * y) / (ry * ry + 0.5))); g.fillRect(cx - ww, cy + y, ww * 2 + 1, 1); }
  }

  draw(g) {
    const game = this.game, m = this.map;
    this.g = g;
    if (!this.static || this.staticSeason !== game.season) this.buildStatic();
    g.fillStyle = m.def.bg || '#1a1226'; g.fillRect(0, 0, VW, VH);
    g.drawImage(this.static, -Math.round(this.cam.x), -Math.round(this.cam.y));
    const fr = Math.floor(game.clock * 2.5);
    for (const [x, y, t] of this.animTiles) {
      const px = x * TILE * Z - this.cam.x, py = y * TILE * Z - this.cam.y;
      if (px < -32 || py < -32 || px > VW || py > VH) continue;
      g.drawImage(sprite2(t.anim[(fr + x + y) % t.anim.length]), Math.round(px), Math.round(py));
    }
    drawWaterFX(g, m, this.water || [], Math.round(this.cam.x), Math.round(this.cam.y), game.clock, game.season);
    const layers = all('worldLayer');
    for (const L of layers) if (L.below) L.below(g, this, game);
    const list = [];
    for (const L of layers) if (L.sprites) for (const sp of L.sprites(this, game) || []) list.push({ d: sp.y, fn: () => sp.draw(g, this, game) });
    for (const o of activeObjects(m, game)) {
      if (o.wall && !o.when) continue;
      const spr = o.sprFn ? o.sprFn(game, o) : o.spr, img = this.img(spr, o.flip);
      if (!img) continue;
      const pad = this.pad(spr), bx = (o.x * TILE + (o.dx || 0)) * Z - this.cam.x - pad, by = ((o.y + o.h) * TILE + (o.dy || 0)) * Z - this.cam.y - img.height + pad;
      if (bx > VW + 8 || by > VH + 8 || bx + img.width < -8 || by + img.height < -8) continue;
      const x = o.x * TILE + (o.dx || 0), y = by / Z + this.cam.y / Z;
      if (o.flat || o.wall) { g.drawImage(img, Math.round(bx), Math.round(by)); continue; }
      const fp = footprint(o);
      list.push({ d: fp[1] + fp[3] + (o.depth || 0), fn: () => { if (o.shadow) this.shadow(fp[0] + fp[2] / 2, fp[1] + fp[3], o.shadow); g.drawImage(img, Math.round(bx), Math.round(by)); if (o.overlay) o.overlay(game, this, o, x, y); } });
    }
    for (const a of this.pets) if (a.map === m.id) list.push({ d: a.y, fn: () => a.draw(g, this, game) });
    for (const npc of this.presentNPCs()) list.push({ d: npc.y, fn: () => this.drawNPC(npc) });
    const p = this.player;
    list.push({ d: p.y, fn: () => {
      this.shadow(p.x, p.y, 12);
      const key = game.state.outfit && game.state.outfit !== 'hoodie' ? 'misa@' + game.state.outfit : 'misa';
      const look = game.state.outfit && get('outfit', game.state.outfit) ? get('outfit', game.state.outfit).look : null;
      drawChar(g, key, look, p.dir, p.moving ? (p.run ? 'run' : 'walk') : 'idle', p.at, this.sx(p.x), this.sy(p.y) + 2);
      if (p.emote) this.drawEmote(p.emote, p.x, p.y - 30);
    } });
    list.sort((a, b) => a.d - b.d).forEach((e) => e.fn());
    for (const L of layers) if (L.above) L.above(g, this, game);
    drawWeather(g, game, this);
    drawLighting(g, game, this);
    for (const L of layers) if (L.overlay) L.overlay(g, this, game);
    for (const q of this.particles) { g.globalAlpha = Math.min(1, q.life * 2); if (q.spr) this.drawFeet(q.spr, q.x, q.y); else { g.fillStyle = q.c; g.fillRect(this.sx(q.x), this.sy(q.y), q.s || 2, q.s || 2); } }
    g.globalAlpha = 1;
    for (const f of game.overlays || []) f(g, this, game);
    ditherFade(g, this.fade);
  }
  drawNPC(npc) {
    const g = this.g, def = npc.def;
    this.shadow(npc.x, npc.y, 11);
    drawChar(g, def.id, def.look, npc.dir, npc.moving ? 'walk' : 'idle', npc.at, this.sx(npc.x), this.sy(npc.y) + 2, 1, def.id.length * 0.37);
    if (npc.emote) this.drawEmote(npc.emote, npc.x, npc.y - 30);
  }
  drawEmote(e, wx, wy) {
    const g = this.g, x = this.sx(wx) - 8, y = this.sy(wy) - 10 + Math.round(Math.sin(this.game.clock * 6));
    g.fillStyle = '#2b1d2e'; g.fillRect(x - 1, y - 1, 18, 16); g.fillStyle = '#fff6e6'; g.fillRect(x, y, 16, 14);
    g.fillRect(x + 6, y + 14, 4, 2);
    if (SPRITES[e]) g.drawImage(sprite2(e), x + 8 - SPRITES[e].w, y + 7 - SPRITES[e].h);
    else { g.fillStyle = '#2b1d2e'; g.fillRect(x + 7, y + 3, 2, 6); g.fillRect(x + 7, y + 10, 2, 2); }
  }
}
