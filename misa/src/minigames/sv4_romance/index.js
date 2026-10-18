// Date minigames (sv4_romance): cozy, no fail state; the score only changes how the date goes.
//   sv4_star_trace  - roof stargazing: a ring shrinks around each of five stars, press Space / click when it hugs the star.
//   sv4_umbrella    - rainy walk: slide the shared umbrella (arrows / drag) to shelter twelve drifting raindrops.
import { register } from '../../core/registry.js';
import { drawText, drawTextC } from '../../font.js';
import { RAMPS as Rr } from '../../gfx/palette.js';
import { clamp } from '../../rng.js';

const rect = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

export class StarTrace {
  constructor(rng) {
    this.rng = rng;
    this.stars = Array.from({ length: 5 }, () => ({ x: 40 + rng() * 240, y: 50 + rng() * 110 }));
    Object.assign(this, { i: 0, r: 46, acc: [], flash: 0, wait: 0, done: false, score: 0, t: 0, msg: 'Press Space when the ring hugs the star' });
  }
  update(dt, input) {
    if (this.done) return;
    this.t += dt; this.flash = Math.max(0, this.flash - dt);
    if (this.wait > 0) { this.wait -= dt; if (this.wait <= 0) { this.i++; this.r = 46; if (this.i >= this.stars.length) this.finish(); } return; }
    this.r -= dt * (22 + this.i * 4);
    const k = input.pressed;
    if (k.has(' ') || k.has('enter') || k.has('e') || input.justDown) this.hit(clamp(1 - Math.abs(this.r - 7) / 30, 0, 1));
    else if (this.r < 1) this.hit(0);
  }
  hit(a) { this.acc.push(a); this.flash = 0.5; this.wait = 0.5; this.msg = a > 0.8 ? 'A perfect wish!' : a > 0.4 ? 'Close enough to make a wish' : 'It slipped away...'; }
  finish() { this.done = true; const m = this.acc.reduce((a, b) => a + b, 0) / (this.acc.length || 1); this.score = clamp(0.3 + m * 0.7, 0.3, 1); this.result = { text: m > 0.7 ? 'You traced the whole sky.' : 'A sky full of stars, anyway.' }; }
  draw(g) {
    rect(g, '#10142a', 0, 0, 320, 224); rect(g, '#1c2244', 0, 150, 320, 74);
    for (let n = 0; n < 40; n++) rect(g, n % 3 ? '#8890c0' : '#c8d0f0', (n * 83) % 320, (n * 47) % 140, 1, 1);
    drawTextC(g, 'STARGAZING', 160, 10, Rr.butter[3], 2, null);
    this.stars.forEach((s, n) => { if (n < this.i || (n === this.i && this.wait <= 0)) { rect(g, n < this.i ? '#f4e49a' : '#fff8d0', s.x - 2, s.y - 2, 5, 5); rect(g, n < this.i ? '#f4e49a' : '#fff8d0', s.x - 4, s.y, 9, 1); rect(g, n < this.i ? '#f4e49a' : '#fff8d0', s.x, s.y - 4, 1, 9); } });
    if (this.i < this.stars.length && this.wait <= 0) { const s = this.stars[this.i], r = Math.round(this.r); g.strokeStyle = '#9ac8e8'; g.lineWidth = 1; g.beginPath(); g.arc(s.x + 0.5, s.y + 0.5, Math.max(1, r), 0, Math.PI * 2); g.stroke(); }
    drawTextC(g, this.msg, 160, 190, Rr.paper[4], 1, null);
    drawText(g, `${Math.min(this.i + 1, 5)}/5`, 286, 12, Rr.paper[3], 1, null);
  }
}
register('minigame', 'sv4_star_trace', {
  title: 'Stargazing', resultTitle: 'STARGAZING DONE',
  make: (game) => new StarTrace(game.rng),
  bot(m, t, inp) { if (m.wait <= 0 && m.r < 9) inp.pressed = new Set([' ']); return inp; },
});

export class Umbrella {
  constructor(rng) {
    this.rng = rng; this.drops = []; this.spawned = 0;
    Object.assign(this, { x: 160, caught: 0, missed: 0, done: false, score: 0, t: 0, next: 0.6, wet: 0 });
  }
  update(dt, input) {
    if (this.done) return;
    this.t += dt; this.wet = Math.max(0, this.wet - dt);
    const keys = input.keys || new Set(), k = input.pressed;
    const dir = (keys.has('arrowright') || keys.has('d') || k.has('arrowright') ? 1 : 0) - (keys.has('arrowleft') || keys.has('a') || k.has('arrowleft') ? 1 : 0);
    if (input.down && !dir) this.x += clamp(input.mx - this.x, -1, 1) * dt * 150; else this.x += dir * dt * 150;
    this.x = clamp(this.x, 34, 286);
    this.next -= dt;
    if (this.spawned < 12 && this.next <= 0) { this.drops.push({ x: 30 + this.rng() * 260, y: 28, v: 60 + this.rng() * 30 }); this.spawned++; this.next = 0.8; }
    for (const d of this.drops) d.y += d.v * dt;
    this.drops = this.drops.filter((d) => {
      if (d.y < 150) return true;
      if (Math.abs(d.x - this.x) <= 32) this.caught++; else { this.missed++; this.wet = 0.4; }
      return false;
    });
    if (this.spawned >= 12 && !this.drops.length) { this.done = true; this.score = clamp(0.3 + (this.caught / 12) * 0.7, 0.3, 1); this.result = { text: this.caught >= 10 ? 'Barely a drop on either of you.' : 'A little damp, a lot happy.' }; }
  }
  draw(g) {
    rect(g, '#4a5a74', 0, 0, 320, 224); rect(g, '#33425a', 0, 160, 320, 64);
    for (let n = 0; n < 30; n++) rect(g, '#9ab0c8', (n * 61 + this.t * 20) % 320, (n * 37 + this.t * 160) % 150, 1, 4);
    drawTextC(g, 'SHARED UMBRELLA', 160, 10, Rr.butter[3], 2, null);
    drawTextC(g, 'Slide with the arrows, or drag', 160, 30, Rr.paper[4], 1, null);
    for (const d of this.drops) { rect(g, '#cfe4f8', d.x, d.y, 2, 5); }
    rect(g, '#e0707a', this.x - 32, 138, 64, 6); rect(g, '#c8505a', this.x - 26, 134, 52, 4); rect(g, '#5a4a40', this.x, 144, 1, 14);
    rect(g, '#3a3a5a', this.x - 12, 156, 8, 12); rect(g, '#5a3a4a', this.x + 4, 156, 8, 12);
    rect(g, this.wet > 0 ? '#cfe4f8' : '#f2d8c0', this.x - 12, 150, 8, 6); rect(g, '#f2d8c0', this.x + 4, 150, 8, 6);
    drawText(g, `${this.caught}/12`, 280, 12, Rr.paper[3], 1, null);
  }
}
register('minigame', 'sv4_umbrella', {
  title: 'Shared umbrella', resultTitle: 'RAINY WALK DONE',
  make: (game) => new Umbrella(game.rng),
  bot(m, t, inp) { const d = m.drops.slice().sort((a, b) => b.y - a.y)[0]; const keys = new Set(); if (d) { if (d.x > m.x + 6) keys.add('arrowright'); else if (d.x < m.x - 6) keys.add('arrowleft'); } inp.keys = keys; return inp; },
});
