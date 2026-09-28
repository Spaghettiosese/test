// Mochi: follows Misa, sits, wanders, naps and sometimes gets the zoomies.
import { moveBody, CUSHION, TILE } from './world.js';

export class Cat {
  constructor(x, y) { Object.assign(this, { x, y, dir: 1, state: 'nap', t: 10, frame: 0, ft: 0, anim: 0, tx: x, ty: y, stuck: 0, wantHeart: 0 }); }
  set(state, t) { this.state = state; this.t = t; }
  update(dt, ctx) {
    const { player, rects, rng, night } = ctx;
    this.t -= dt; this.ft += dt; this.anim += dt;
    const dP = Math.hypot(player.x - this.x, player.y - this.y);
    let speed = 0, tx = this.x, ty = this.y;
    switch (this.state) {
      case 'follow':
        tx = player.x; ty = player.y; speed = dP > 60 ? 46 : 30;
        if (dP < 22) this.set('sit', 3 + rng() * 6);
        break;
      case 'sit':
        if (this.t <= 0) {
          if (night && rng() < 0.6) this.set('goNap', 30);
          else if (rng() < 0.35) this.set('wander', 4 + rng() * 3), (this.tx = this.x + (rng() - 0.5) * 120, this.ty = this.y + (rng() - 0.5) * 80);
          else this.set('follow', 20);
        }
        if (dP > 40) this.set('follow', 20);
        break;
      case 'wander':
        tx = this.tx; ty = this.ty; speed = 24;
        if (this.t <= 0 || Math.hypot(tx - this.x, ty - this.y) < 4) this.set('sit', 2 + rng() * 5);
        break;
      case 'goNap':
        tx = CUSHION.x; ty = CUSHION.y; speed = 34;
        if (Math.hypot(tx - this.x, ty - this.y) < 4 || this.t <= 0) this.set('nap', 20 + rng() * 25);
        break;
      case 'nap':
        if (this.t <= 0 || (dP < 14 && !night)) this.set('sit', 2);
        break;
      case 'zoom': {
        speed = 95;
        if (Math.hypot(this.tx - this.x, this.ty - this.y) < 6 || this.stuck > 0.3) {
          this.tx = 24 + rng() * (18 * TILE); this.ty = 24 + rng() * (11 * TILE); this.stuck = 0;
        }
        tx = this.tx; ty = this.ty;
        if (this.t <= 0) this.set('sit', 3);
        break;
      }
    }
    if (speed) {
      const d = Math.hypot(tx - this.x, ty - this.y) || 1;
      const ox = this.x, oy = this.y;
      moveBody(this, ((tx - this.x) / d) * speed * dt, ((ty - this.y) / d) * speed * dt, rects, 8, 4);
      this.dir = tx - ox >= 0 ? 1 : -1;
      const moved = Math.hypot(this.x - ox, this.y - oy);
      this.stuck = moved < speed * dt * 0.25 ? this.stuck + dt : 0;
      if (this.stuck > 2.5) { this.x = player.x + 6; this.y = player.y; this.stuck = 0; }
      if (this.ft > (this.state === 'zoom' ? 0.07 : 0.11)) { this.ft = 0; this.frame = (this.frame + 1) % 4; }
    }
    if (this.wantHeart > 0) this.wantHeart -= dt;
  }
  get moving() { return ['follow', 'wander', 'goNap', 'zoom'].includes(this.state); }
  get sprite() {
    if (this.state === 'nap') return `mochi_sleep_${Math.floor(this.anim * 1.1) % 2}`;
    if (this.state === 'sit') return this.anim % 4.5 < 0.14 ? 'mochi_sit_b' : `mochi_sit_${Math.floor(this.anim * 2.2) % 4}`;
    return `mochi_walk_${this.frame}`;
  }
}
