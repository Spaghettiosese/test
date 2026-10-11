// NPC entities. Defined with register('npc', id, def):
//   name, role, bio, look: { hair, skin, eyes, top, bottom, shoes, accent }, birthday: { season, day },
//   schedule: [ { when?: Cond, stops: [ { at: '08:00', map: 'cafe', spot: 'counter' | pos: [tx, ty], dir?, anim? } ] }, ... ]
//     Groups are checked top to bottom and the first one whose `when` passes is today's plan (so a rainy-day group
//     placed first replaces the whole day). Within a plan the latest stop with `at <= now` is where they are; before
//     the first stop they're at the plan's last stop (home, overnight).
//   gifts: { love: [...], like: [...], dislike: [...], hate: [...], loveTags, likeTags, dislikeTags },
//   lines: { ... } (see systems/social.js), events: [{ id, hearts, map, when?: Cond, script(game) -> steps }]
import { get, all } from '../core/registry.js';
import { parseHM } from '../core/time.js';
import { check } from '../core/cond.js';
import { findPath } from '../core/path.js';
import { TILE, spotOf } from './map.js';

// Today's plan for an NPC: the first rule group whose condition holds.
export function planFor(def, game) {
  for (const [gi, grp] of (def.schedule || []).entries()) if (grp.stops && grp.stops.length && check(grp.when, game)) return { gi, stops: grp.stops };
  return null;
}
// Where should this NPC be right now? -> { key, stop } or null
export function scheduleEntry(def, game, minutes = game.minutes) {
  if (def.override) { const o = def.override(game); if (o !== undefined) return o && { key: 'override:' + (o.key || o.map + (o.spot || o.pos)), stop: o }; }
  const plan = planFor(def, game);
  if (!plan) return null;
  let si = -1;
  plan.stops.forEach((st, i) => { if (parseHM(st.at) <= minutes) si = i; });
  if (si < 0) si = plan.stops.length - 1;
  const stop = plan.stops[si];
  if (!stop.map) return null; // { at, map: null } means "away" (out of town, asleep somewhere unseen)
  return { key: `${plan.gi}:${si}`, stop };
}

export class NPC {
  constructor(id, seed = 0) {
    this.id = id; this.def = get('npc', id);
    Object.assign(this, { x: 0, y: 0, dir: 'down', moving: false, at: seed, path: null, entryKey: null, stop: null, present: false, leaving: false, emote: null, emoteT: 0, talkT: 0, pause: 0, prevMap: null });
  }
  get tx() { return Math.floor(this.x / TILE); }
  get ty() { return Math.floor((this.y - 1) / TILE); }
  place(tx, ty, dir = 'down') { this.x = tx * TILE + 8; this.y = ty * TILE + 14; this.dir = dir; this.path = null; this.moving = false; }

  // Called when the player arrives on a map (snap) and every frame while on it.
  sync(game, map, grid, snap) {
    const e = scheduleEntry(this.def, game);
    const key = e ? e.key : null, stop = e ? e.stop : null, here = !!stop && stop.map === map.id;
    if (snap) {
      this.entryKey = key; this.stop = stop; this.present = here; this.leaving = false;
      if (here) { const [tx, ty] = spotOf(map, stop); this.place(tx, ty, stop.dir || 'down'); }
      return;
    }
    if (key === this.entryKey) return;
    const was = this.present, prev = this.stop;
    this.entryKey = key; this.stop = stop;
    if (here) {
      const [tx, ty] = spotOf(map, stop);
      if (!was) { // walk in through the door that leads to where they were before
        const w = map.warps.find((wp) => prev && warpTargetMap(wp) === prev.map) || map.warps.find((wp) => warpTargetMap(wp) && warpTargetMap(wp) !== map.id);
        if (w) this.place(w.x, w.y, 'down'); else this.place(tx, ty);
        this.present = true; this.leaving = false;
      }
      this.goTo(grid, tx, ty);
    } else if (was) { // head for the door toward their next stop, then vanish
      const w = map.warps.find((wp) => stop && warpTargetMap(wp) === stop.map) || map.warps[0];
      if (w) { this.leaving = true; this.goTo(grid, w.x, w.y); } else this.present = false;
    }
  }
  goTo(grid, tx, ty) {
    const pass = (x, y) => grid[y] && grid[y][x];
    this.path = findPath(pass, this.tx, this.ty, tx, ty) || [[tx, ty]];
  }
  walkTo(grid, tx, ty) { this.goTo(grid, tx, ty); return new Promise((res) => { this.onArrive = res; }); }

  update(dt, game, speed = 34) {
    this.at += dt;
    if (this.emoteT > 0) { this.emoteT -= dt; if (this.emoteT <= 0) this.emote = null; }
    if (this.talkT > 0) { this.talkT -= dt; this.moving = false; return; }
    if (this.pause > 0) { this.pause -= dt; this.moving = false; return; }
    if (this.path && this.path.length) {
      const [nx, ny] = this.path[0], gx = nx * TILE + 8, gy = ny * TILE + 14;
      const dx = gx - this.x, dy = gy - this.y, d = Math.hypot(dx, dy);
      if (!this.moving) this.at = 0;
      this.moving = true;
      if (d < speed * dt + 0.5) { this.x = gx; this.y = gy; this.path.shift(); }
      else { this.x += (dx / d) * speed * dt; this.y += (dy / d) * speed * dt; }
      this.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
      if (!this.path.length) {
        this.path = null; this.moving = false; this.at = 0;
        if (this.leaving) { this.present = false; this.leaving = false; }
        else if (this.stop && this.stop.dir) this.dir = this.stop.dir;
        if (this.onArrive) { const f = this.onArrive; this.onArrive = null; f(); }
      }
    } else this.moving = false;
  }
  faceTo(x, y) { const dx = x - this.x, dy = y - this.y; this.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down'; }
  say(emote, t = 1.6) { this.emote = emote; this.emoteT = t; }
  get anim() { return this.moving ? 'walk' : 'idle'; }
}

export const warpTargetMap = (w) => (w.to ? String(w.to).split(':')[0] : null);
export const allNPCs = () => all('npc');
