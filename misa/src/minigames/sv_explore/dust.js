// Dust sprite shoo-away: a cozy, no-fail-state minigame. A fluffy dust sprite drifts around the mine and dodges your
// cursor. Hold the button (Space/E or mouse) while your broom is close to sweep it off before time runs out.
// Win: it scampers away and leaves fluff. Lose: it bumps you and you lose a little energy (never worse).
import { register } from '../../core/registry.js';
import { Cursor, actHeld } from '../../input.js';
import { drawText, drawTextC } from '../../font.js';
import { RAMPS as Rr } from '../../gfx/palette.js';
import { hash } from '../../gfx/noise.js';
import { sfx } from '../../audio.js';
import { clamp } from '../../rng.js';

const BOUNDS = [16, 40, 304, 206];
const rect = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

export class DustGame {
  constructor(rng, { size = 1, tier = 1 } = {}) {
    this.rng = rng;
    Object.assign(this, { t: 0, limit: 10 + tier, done: false, score: 0, stubborn: 1, title: 'Dust sprite', reach: 30 + tier * 4 });
    this.x = 200; this.y = 120; this.tx = 120; this.ty = 100; this.speed = 55 + size * 8; this.cur = new Cursor(80, 130, 130, BOUNDS);
    this.swept = 0;
  }
  update(dt, input) {
    if (this.done) return;
    this.t += dt;
    this.cur.update(dt, input);
    const dx = this.x - this.cur.x, dy = this.y - this.cur.y, d = Math.hypot(dx, dy) || 1;
    const hold = actHeld(input);
    // wander, and slip away from a close cursor
    if (Math.hypot(this.tx - this.x, this.ty - this.y) < 6 || this.rng() < dt * 0.4) { this.tx = BOUNDS[0] + 20 + this.rng() * (BOUNDS[2] - BOUNDS[0] - 40); this.ty = BOUNDS[1] + 20 + this.rng() * (BOUNDS[3] - BOUNDS[1] - 40); }
    let vx = this.tx - this.x, vy = this.ty - this.y; const vl = Math.hypot(vx, vy) || 1; vx = vx / vl * this.speed * 0.5; vy = vy / vl * this.speed * 0.5;
    if (d < 64) { const k = (1 - d / 64) * this.speed * (hold && d < this.reach ? 0.5 : 1.1); vx += dx / d * k; vy += dy / d * k; }
    this.x = clamp(this.x + vx * dt, BOUNDS[0], BOUNDS[2]); this.y = clamp(this.y + vy * dt, BOUNDS[1], BOUNDS[3]);
    this.sweeping = hold && d < this.reach;
    if (this.sweeping) { this.stubborn -= dt / 2.2; this.swept += dt; if (Math.floor(this.t * 10) % 3 === 0) sfx('scrub'); }
    if (this.stubborn <= 0) this.finish(true);
    else if (this.t >= this.limit) this.finish(false);
  }
  finish(ok) {
    this.done = true; this.won = ok;
    this.score = ok ? clamp(1 - this.t / this.limit, 0.4, 1) : 0;
    this.result = ok ? { text: 'It scampered off, leaving soft fluff behind!', shooed: true } : { text: 'It bumped into you and giggled away. A little tired!', shooed: false };
    sfx(ok ? 'chime' : 'wrong');
  }
  draw(g, sprite) {
    rect(g, '#1a1426', 0, 0, 320, 224); rect(g, '#241a36', 0, 150, 320, 74);
    for (let i = 0; i < 40; i++) { const x = hash(i, 1, 4) * 320, y = 24 + hash(i, 2, 4) * 190 + Math.sin(this.t + i) * 2; rect(g, hash(i, 3, 4) > 0.7 ? Rr.lilac[2] : Rr.charcoal[3], x, y, 2, 2); }
    rect(g, '#2b1d2ee0', 0, 0, 320, 18); drawText(g, 'SHOO THE DUST SPRITE', 8, 7, Rr.butter[3], 1, null);
    drawText(g, `${Math.max(0, Math.ceil(this.limit - this.t))}S`, 296, 7, Rr.paper[3], 1, null);
    const f = Math.floor(this.t * 4) % 2, im = sprite('sv_dust_' + f);
    if (im) g.drawImage(im, Math.round(this.x - im.width / 2 + (this.sweeping ? Math.sin(this.t * 60) * 1.5 : 0)), Math.round(this.y - im.height / 2 + Math.sin(this.t * 3) * 2));
    // broom
    const cx = Math.round(this.cur.x), cy = Math.round(this.cur.y), sw = this.sweeping ? Math.sin(this.t * 30) * 4 : 0;
    rect(g, Rr.wood[2], cx - 1 + sw, cy - 14, 2, 14); rect(g, Rr.butter[2], cx - 5 + sw, cy, 10, 5); rect(g, Rr.butter[3], cx - 5 + sw, cy, 10, 1);
    rect(g, Rr.ink[1], 96, 204, 128, 8); rect(g, Rr.ink[3], 97, 205, 126, 6); rect(g, Rr.coral[2], 97, 205, Math.round(126 * clamp(this.stubborn, 0, 1)), 6);
    drawTextC(g, this.sweeping ? 'Sweeping!' : 'Hold Space near it to sweep', 160, 194, Rr.paper[4], 1, null);
  }
}
register('minigame', 'sv_dust_shoo', {
  title: 'Dust sprite', resultTitle: 'ALL CLEAR',
  make: (game, o) => new DustGame(game.rng, o),
  bot(m, t, inp) { inp.moved = true; inp.mx = m.x; inp.my = m.y; inp.keys = new Set([' ']); return inp; },
});
