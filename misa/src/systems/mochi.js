// Mochi the cat lives at home: she wanders, follows Misa, naps on her cushion, greets you at the door,
// gets the zoomies, and opens the close-up petting menu when you interact with her.
import { register, features } from '../core/registry.js';
import { moveBody, solidRects, TILE } from '../world/map.js';
import { sprite2 } from '../artcache.js';
import { SPRITES } from '../art.js';


class Mochi {
  constructor() { Object.assign(this, { id: 'mochi', map: 'home', x: 7.5 * TILE, y: 11.9 * TILE, dir: 1, state: 'nap', t: 8, frame: 0, ft: 0, anim: 0, tx: 0, ty: 0, stuck: 0, label: 'Pet Mochi' }); }
  set(state, t) { this.state = state; this.t = t; }
  get moving() { return ['follow', 'wander', 'goNap', 'zoom', 'greet'].includes(this.state); }
  get sprite() {
    if (this.state === 'nap') return `mochi_sleep_${Math.floor(this.anim * 1.1) % 2}`;
    if (this.state === 'sit') return this.anim % 4.5 < 0.14 ? 'mochi_sit_b' : `mochi_sit_${Math.floor(this.anim * 2.2) % 4}`;
    return `mochi_walk_${this.frame}`;
  }
  update(dt, game, world) {
    const p = world.player, rng = game.rng, m = world.map;
    this.t -= dt; this.ft += dt; this.anim += dt;
    const dP = Math.hypot(p.x - this.x, p.y - this.y), night = game.minutes > 21 * 60;
    let speed = 0, tx = this.x, ty = this.y;
    const cushion = (m.spawns.cushion || [7, 11]).map((v, i) => v * TILE + (i ? 14 : 8));
    switch (this.state) {
      case 'follow': tx = p.x; ty = p.y; speed = dP > 60 ? 50 : 32; if (dP < 22) this.set('sit', 3 + rng() * 6); break;
      case 'greet': tx = p.x; ty = p.y; speed = 70; if (dP < 18) { this.set('sit', 4); game.sfx('meow'); world.particles.push({ spr: 'heart', x: this.x - 3, y: this.y - 22, vy: -12, life: 1.2 }); } break;
      case 'sit':
        if (this.t <= 0) {
          if (night && rng() < 0.6) this.set('goNap', 30);
          else if (rng() < 0.35) { this.set('wander', 4 + rng() * 3); this.tx = this.x + (rng() - 0.5) * 120; this.ty = this.y + (rng() - 0.5) * 80; }
          else this.set('follow', 20);
        }
        if (dP > 48 && !night) this.set('follow', 20);
        break;
      case 'wander': tx = this.tx; ty = this.ty; speed = 24; if (this.t <= 0 || Math.hypot(tx - this.x, ty - this.y) < 4) this.set('sit', 2 + rng() * 5); break;
      case 'goNap': tx = cushion[0]; ty = cushion[1]; speed = 34; if (Math.hypot(tx - this.x, ty - this.y) < 4 || this.t <= 0) this.set('nap', 20 + rng() * 25); break;
      case 'nap': if (this.t <= 0 || (dP < 14 && !night)) this.set('sit', 2); break;
      case 'zoom':
        speed = 95;
        if (Math.hypot(this.tx - this.x, this.ty - this.y) < 6 || this.stuck > 0.3) { this.tx = 24 + rng() * (m.pw - 48); this.ty = 24 + rng() * (m.ph - 48); this.stuck = 0; }
        tx = this.tx; ty = this.ty;
        if (this.t <= 0) this.set('sit', 3);
        break;
    }
    if (speed) {
      const d = Math.hypot(tx - this.x, ty - this.y) || 1, ox = this.x, oy = this.y;
      moveBody(m, this, ((tx - this.x) / d) * speed * dt, ((ty - this.y) / d) * speed * dt, solidRects(m, game), 8, 4);
      this.dir = tx - ox >= 0 ? 1 : -1;
      const moved = Math.hypot(this.x - ox, this.y - oy);
      this.stuck = moved < speed * dt * 0.25 ? this.stuck + dt : 0;
      if (this.stuck > 2.5) { this.x = p.x + 6; this.y = p.y; this.stuck = 0; }
      if (this.ft > (this.state === 'zoom' ? 0.07 : 0.11)) { this.ft = 0; this.frame = (this.frame + 1) % 4; }
    }
  }
  draw(g, world) {
    world.shadow(this.x, this.y, 9);
    world.drawFeet(this.sprite, this.x, this.y + 1, this.dir < 0 && this.moving);
    if (this.state === 'nap') world.drawFeet('zzz', this.x + 6, this.y - 12 + Math.sin(world.game.clock * 2) * 1.5);
  }
  interact(game) {
    game.minigame('pet', {}).then((r) => {
      const aff = r.score || 0, ms = game.state.mochi;
      if (ms.pettedDay !== game.day && aff > 0.05) {
        ms.pettedDay = game.day; ms.affection = Math.min(100, ms.affection + Math.round(aff * 6));
        game.addMood(Math.round(aff * 10));
        if (aff >= 1) { game.addMoney(0, true); game.toast('Mochi adores you!', 'heart'); game.stat('mochiFullPets'); }
        else game.toast(`Mochi purrs. Mood +${Math.round(aff * 10)}`, 'heart');
      } else if (aff > 0.05) game.toast('Mochi purrs happily', 'heart');
      game.stat('mochiPets');
      this.set('sit', 8);
    });
  }
}

register('system', 'mochi', {
  init(game) {
    const mochi = new Mochi();
    game.mochi = mochi;
    let last = null;
    game.bus.on('mapEnter', ({ map }) => {
      if (!game.world.pets.includes(mochi)) game.world.pets.push(mochi);
      if (map === 'home' && last && last !== 'home') {
        const p = game.world.player;
        mochi.x = p.x + (game.rng() < 0.5 ? -40 : 40); mochi.y = p.y - 20;
        mochi.set(game.minutes > 21 * 60 ? 'goNap' : 'greet', 30);
      }
      last = map;
    });
    game.bus.on('dayStart', () => { mochi.map = 'home'; mochi.set('nap', 5); });
    game.bus.on('startZoomies', () => { mochi.set('zoom', 9); mochi.tx = mochi.x; mochi.ty = mochi.y; });
  },
});

features('Mochi', [
  'Mochi lives at home: wanders, follows Misa around, sits and grooms',
  'Mochi naps on her cushion at night (with floating Zzz)',
  'Mochi runs to greet Misa when she comes home',
  'Mochi gets the zoomies and races around the house',
  'Close-up petting menu: stroke Mochi with the mouse or keyboard; her eyes follow your hand',
  'Petting: head and chin are favourite spots, frantic stroking annoys her, she purrs when happy',
  'Mochi affection meter that grows with daily petting',
]);
