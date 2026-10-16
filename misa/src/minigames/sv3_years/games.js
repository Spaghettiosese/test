// Minigames for the school years.
//   sv3_speech   - election / captain speech: stop the marker inside the glowing phrase zones (Space / click), five phrases.
//   sv3_tasting  - Mika's apprenticeship tasting: set four dials (salt, sweet, heat, aroma) to match the target before time runs out.
// Both are cozy: no fail state, the score only changes the reward.
import { register } from '../../core/registry.js';
import { drawText, drawTextC } from '../../font.js';
import { RAMPS as Rr } from '../../gfx/palette.js';
import { sfx } from '../../audio.js';
import { clamp } from '../../rng.js';

const rect = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const PHRASES = ['I love this class', 'Let us try our best', 'Every voice counts', 'We will make it fun', 'Thank you for listening'];

export class SpeechGame {
  constructor(rng, opts = {}) {
    this.rng = rng; this.opts = opts;
    const tier = clamp(opts.tier || 1, 1, 4);
    Object.assign(this, { done: false, score: 0, t: 0, round: 0, pos: 0, dir: 1, hits: 0, acc: 0, flash: 0, wait: 0, speed: 0.55 + tier * 0.12, width: 0.2 - tier * 0.015, title: 'Speech', msg: 'Press Space when the marker is in the glow' });
    this.zone = this.newZone();
  }
  newZone() { return 0.15 + this.rng() * 0.7; }
  update(dt, input) {
    if (this.done) return;
    this.t += dt; this.flash = Math.max(0, this.flash - dt);
    if (this.wait > 0) { this.wait -= dt; if (this.wait <= 0) { if (this.round >= PHRASES.length) return this.finish(); this.zone = this.newZone(); this.pos = 0; this.dir = 1; } return; }
    this.pos += this.dir * this.speed * (1 + this.round * 0.08) * dt;
    if (this.pos > 1) { this.pos = 1; this.dir = -1; } else if (this.pos < 0) { this.pos = 0; this.dir = 1; }
    const k = input.pressed;
    if (k.has(' ') || k.has('enter') || k.has('e') || input.justDown) {
      const d = Math.abs(this.pos - this.zone), hit = d <= this.width / 2;
      this.acc += clamp(1 - d / (this.width * 1.5), 0, 1); if (hit) this.hits++;
      this.flash = 0.4; this.last = hit ? (d < this.width / 6 ? 'Perfect!' : 'Nice!') : 'Missed it';
      sfx(hit ? 'chime' : 'blip'); this.round++; this.wait = 0.6;
    }
  }
  finish() { this.done = true; this.score = clamp(0.25 + this.acc / PHRASES.length * 0.75, 0, 1); this.result = { text: this.hits >= 4 ? 'The hall goes quiet, then applauds!' : this.hits >= 2 ? 'A steady speech. People nod.' : 'You wobbled, but you said it from the heart.' }; }
  draw(g) {
    rect(g, '#2b1d2e', 0, 0, 320, 224); rect(g, '#3d2a4a', 0, 150, 320, 74);
    for (let i = 0; i < 9; i++) { rect(g, i % 2 ? Rr.lilac[1] : Rr.coral[1], 20 + i * 33, 170 + (i % 3) * 6, 18, 24); rect(g, Rr.skinLight[3], 25 + i * 33, 160 + (i % 3) * 6, 9, 9); }
    drawTextC(g, 'YOUR SPEECH', 160, 12, Rr.butter[3], 2, null);
    drawTextC(g, PHRASES[Math.min(this.round, PHRASES.length - 1)].toUpperCase(), 160, 40, Rr.paper[4], 1, null);
    rect(g, Rr.ink[0], 38, 76, 244, 22); rect(g, Rr.ink[2], 40, 78, 240, 18);
    rect(g, this.flash > 0 ? Rr.butter[3] : Rr.mint[2], 40 + (this.zone - this.width / 2) * 240, 78, this.width * 240, 18);
    rect(g, Rr.paper[4], 40 + this.pos * 240 - 2, 72, 4, 30);
    drawTextC(g, this.last && this.flash > 0 ? this.last : this.msg, 160, 112, Rr.paper[4], 1, null);
    drawText(g, `${Math.min(this.round + 1, PHRASES.length)}/${PHRASES.length}`, 280, 12, Rr.paper[3], 1, null);
  }
}
register('minigame', 'sv3_speech', {
  title: 'Speech', resultTitle: 'SPEECH DONE',
  make: (game, o) => new SpeechGame(game.rng, o),
  bot(m, t, inp) { if (m.wait <= 0 && Math.abs(m.pos - m.zone) < 0.03) inp.pressed = new Set([' ']); return inp; },
});

const DIALS = ['SALT', 'SWEET', 'HEAT', 'AROMA'];
export class TastingGame {
  constructor(rng, opts = {}) {
    this.rng = rng; this.tier = clamp(opts.tier || 1, 1, 4);
    this.target = DIALS.map(() => 1 + Math.floor(rng() * 8)); this.val = DIALS.map(() => 5); this.sel = 0;
    Object.assign(this, { done: false, score: 0, t: 0, limit: 28 - this.tier * 2, title: 'Tasting' });
  }
  update(dt, input) {
    if (this.done) return;
    this.t += dt; const k = input.pressed;
    if (k.has('arrowdown') || k.has('s')) this.sel = (this.sel + 1) % 4;
    if (k.has('arrowup') || k.has('w')) this.sel = (this.sel + 3) % 4;
    if (k.has('arrowleft') || k.has('a')) this.val[this.sel] = clamp(this.val[this.sel] - 1, 0, 9);
    if (k.has('arrowright') || k.has('d')) this.val[this.sel] = clamp(this.val[this.sel] + 1, 0, 9);
    if (k.has(' ') || k.has('enter') || this.t >= this.limit) this.finish();
  }
  err() { return this.val.reduce((a, v, i) => a + Math.abs(v - this.target[i]), 0); }
  finish() { this.done = true; const e = this.err(); this.score = clamp(1 - e / 20, 0.2, 1); this.result = { text: e <= 2 ? 'Mika closes her eyes. "Perfect balance."' : e <= 8 ? 'Mika nods slowly. "Close. Very close."' : 'Mika smiles. "Adventurous. We will keep working."' }; }
  draw(g) {
    rect(g, '#3a2a22', 0, 0, 320, 224); rect(g, '#5a4032', 0, 180, 320, 44);
    drawTextC(g, 'MIKA\'S TASTING', 160, 10, Rr.butter[3], 2, null);
    drawTextC(g, 'Match the flavour card. Up/Down choose, Left/Right adjust, Space to serve', 160, 34, Rr.paper[4], 1, null);
    DIALS.forEach((n, i) => {
      const y = 56 + i * 28, on = i === this.sel;
      rect(g, on ? Rr.butter[2] : Rr.ink[2], 40, y, 240, 22); rect(g, Rr.ink[0], 42, y + 2, 236, 18);
      drawText(g, n, 48, y + 7, Rr.paper[4], 1, null);
      for (let v = 0; v < 10; v++) { rect(g, v <= this.val[i] ? Rr.coral[2] : Rr.ink[3], 110 + v * 14, y + 5, 11, 12); }
      rect(g, Rr.mint[3], 110 + this.target[i] * 14 + 3, y + 1, 5, 3);
    });
    drawText(g, `${Math.max(0, Math.ceil(this.limit - this.t))}S`, 286, 12, Rr.paper[3], 1, null);
  }
}
register('minigame', 'sv3_tasting', {
  title: 'Tasting', resultTitle: 'TASTING DONE',
  make: (game, o) => new TastingGame(game.rng, o),
  bot(m, t, inp) {
    const i = m.val.findIndex((v, j) => v !== m.target[j]);
    if (i < 0) { inp.pressed = new Set([' ']); return inp; }
    if (m.sel !== i) inp.pressed = new Set(['arrowdown']); else inp.pressed = new Set([m.val[i] < m.target[i] ? 'arrowright' : 'arrowleft']);
    return inp;
  },
});
