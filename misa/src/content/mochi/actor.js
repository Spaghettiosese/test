// A small base class for the animal actors that live in world.pets (Mochi, Kuro, Daifuku, the strays).
// They walk tile paths, can be moved and emoted by cutscripts ({ t:'move', who:'mochi' }), and draw a sprite
// standing on their feet with a plum contact shadow.
import { findPath } from '../../core/path.js';
import { TILE } from '../../world/map.js';
import { SPRITES } from '../../art.js';

export const tileOf = (x, y) => [Math.floor(x / TILE), Math.floor((y - 1) / TILE)];
export const tileCenter = (tx, ty) => [tx * TILE + 8, ty * TILE + 13];

export class Critter {
  constructor(id, o = {}) {
    Object.assign(this, { id, map: null, x: 0, y: 0, dir: 1, anim: 0, frame: 0, ft: 0, emote: null, emoteT: 0, path: null, onArrive: null, label: 'Pet', lift: 0, speed: 40 }, o);
  }
  // ---- script API (cutscene steps call these) ----
  walkTo(tx, ty) {
    const w = this.world;
    if (!w || !w.grid) { this.x = tx * TILE + 8; this.y = ty * TILE + 13; return Promise.resolve(); }
    const [sx, sy] = tileOf(this.x, this.y);
    this.path = findPath((x, y) => w.grid[y] && w.grid[y][x], sx, sy, tx, ty, 3000) || [[tx, ty]];
    return new Promise((res) => { this.onArrive = res; });
  }
  faceTo(x) { this.dir = x < this.x ? -1 : 1; }
  say(icon, t = 1.6) { this.emote = icon; this.emoteT = t; }
  get world() { return this._world; }
  // ---- movement ----
  pathTo(world, tx, ty) {
    const [sx, sy] = tileOf(this.x, this.y);
    this.path = findPath((x, y) => world.grid[y] && world.grid[y][x], sx, sy, tx, ty, 3000);
    return !!this.path;
  }
  // Follow the current path; returns true when it is finished (or there is none).
  stepPath(dt, speed) {
    if (!this.path || !this.path.length) { if (this.path) this.arrive(); return true; }
    const [tx, ty] = this.path[0], [gx, gy] = tileCenter(tx, ty), dx = gx - this.x, dy = gy - this.y, d = Math.hypot(dx, dy);
    if (d < 1.5) { this.x = gx; this.y = gy; this.path.shift(); if (!this.path.length) { this.arrive(); return true; } return false; }
    const s = Math.min(d, speed * dt);
    this.x += (dx / d) * s; this.y += (dy / d) * s;
    if (Math.abs(dx) > 0.5) this.dir = dx < 0 ? -1 : 1;
    this.walking = true;
    return false;
  }
  arrive() { this.path = null; if (this.onArrive) { const f = this.onArrive; this.onArrive = null; f(); } }
  // Straight-line move toward a point (short hops, chasing).
  moveToward(tx, ty, speed, dt) {
    const dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy);
    if (d < 1) return true;
    const s = Math.min(d, speed * dt);
    this.x += (dx / d) * s; this.y += (dy / d) * s;
    if (Math.abs(dx) > 0.3) this.dir = dx < 0 ? -1 : 1;
    this.walking = true;
    return d - s < 1;
  }
  tickBase(dt, world) {
    this._world = world; this.anim += dt; this.ft += dt; this.walking = false;
    if (this.emoteT > 0) { this.emoteT -= dt; if (this.emoteT <= 0) this.emote = null; }
  }
  // Draw a sprite on the feet point. Sprites from cdef() carry a 1px transparent margin, so drop them 1px.
  drawSprite(world, name, flip, shadowW = 8, extraY = 0) {
    if (!SPRITES[name]) return;
    if (shadowW && !this.lift) world.shadow(this.x, this.y, shadowW);
    world.drawFeet(name, this.x, this.y + 1 + extraY / 2 - this.lift, flip);
    if (this.emote) world.drawEmote(this.emote, this.x, this.y - 22 - this.lift);
  }
}

export const near = (a, b, r) => Math.hypot(a.x - b.x, a.y - b.y) < r;
