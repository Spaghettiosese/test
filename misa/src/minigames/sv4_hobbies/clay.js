// Shape the clay: spin the wheel, move the cursor up and down the pot (arrows or pointer) and push the walls in or out.
// Left/right arrows narrow/widen the clay at the cursor, Enter finishes. With a mouse: hold the button and drag to the width you want.
// opts: { shape: vase|bowl|mug|plate|jug, steady (0..1 less drift) }
import { register } from '../../core/registry.js';
import { drawText, drawTextC } from '../../font.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { sfx } from '../../audio.js';
import { rect, clamp, hash, W, H } from '../sv2_play/kit.js';

// Half widths (in 4 px units) for 14 rows from the rim down.
export const SHAPES = {
  plate: [3, 5, 8, 11, 13, 14, 14, 14, 14, 14, 14, 14, 14, 14],
  bowl: [12, 12, 11, 11, 10, 10, 9, 8, 7, 6, 5, 4, 4, 4],
  mug: [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
  vase: [5, 5, 6, 7, 8, 9, 10, 10, 9, 8, 7, 6, 6, 6],
  jug: [5, 4, 4, 5, 7, 9, 10, 10, 10, 9, 8, 8, 8, 8],
};
const ROWS = 14, RH = 8, CX = 160, TOP = 58;
export class ClayGame {
  constructor(game, o = {}) {
    this.o = o; this.shape = SHAPES[o.shape] ? o.shape : 'vase'; this.target = SHAPES[this.shape];
    this.w = Array(ROWS).fill(8); this.r = 5; this.steady = o.steady || 0;
    Object.assign(this, { t: 0, done: false, score: 0, limit: 30, spin: 0 });
  }
  err() { let s = 0; for (let i = 0; i < ROWS; i++) s += Math.abs(this.w[i] - this.target[i]); return s / ROWS; }
  edit(dt, d) {
    const c = Math.round(this.r);
    for (let k = -1; k <= 1; k++) { const i = c + k; if (i >= 0 && i < ROWS) this.w[i] = clamp(this.w[i] + d * dt * 9 * (k === 0 ? 1 : 0.45), 1.5, 16); }
  }
  update(dt, input) {
    if (this.done) return;
    this.t += dt; this.spin += dt * 6;
    const k = input.keys;
    if (k.has('arrowdown') || k.has('s')) this.r = Math.min(ROWS - 1, this.r + dt * 7);
    if (k.has('arrowup') || k.has('w')) this.r = Math.max(0, this.r - dt * 7);
    if (k.has('arrowleft') || k.has('a')) this.edit(dt, -1);
    if (k.has('arrowright') || k.has('d')) this.edit(dt, 1);
    if (input.moved || input.down) { this.r = clamp((input.my - TOP) / RH, 0, ROWS - 1); if (input.down) { const c = Math.round(this.r), want = clamp(Math.abs(input.mx - CX) / 4, 1.5, 16); this.w[c] += clamp(want - this.w[c], -1, 1) * dt * 12; } }
    for (let i = 0; i < ROWS; i++) this.w[i] = clamp(this.w[i] + (hash(i, Math.floor(this.t * 2)) - 0.5) * dt * (1.6 - this.steady), 1.5, 16);
    if (input.pressed.has('enter') || this.t >= this.limit) this.finish();
  }
  finish() {
    if (this.done) return;
    this.done = true; this.score = clamp(1 - this.err() / 5, 0, 1);
    this.result = { text: this.score > 0.85 ? 'A beautifully even pot!' : this.score > 0.55 ? 'Not bad for clay!' : 'A very... rustic shape.', shape: this.shape, acc: this.score };
    sfx(this.score > 0.5 ? 'chime' : 'wrong');
  }
  draw(g) {
    rect(g, '#2a2036', 0, 0, W, H); rect(g, K.wood[1], 80, 176, 160, 10); rect(g, K.wood[2], 80, 176, 160, 2);
    for (let i = 0; i < ROWS; i++) {
      const y = TOP + i * RH, tw = this.target[i] * 4, w = this.w[i] * 4;
      rect(g, 'rgba(255,246,160,.5)', CX - tw - 1, y, 1, RH); rect(g, 'rgba(255,246,160,.5)', CX + tw, y, 1, RH);
      rect(g, K.hairGinger ? K.hairGinger[1] : K.wood[2], CX - w, y, w * 2, RH); rect(g, K.sand[2], CX - w, y, w * 2, 1);
      rect(g, K.wood[3], CX - w, y, 3, RH); for (let s = 0; s < 3; s++) rect(g, 'rgba(255,255,255,.15)', CX - w + 4 + ((s * 17 + Math.floor(this.spin * 4)) % Math.max(4, w * 2 - 8)), y + 2, 2, 3);
    }
    const cy = TOP + this.r * RH; rect(g, K.paper[4], CX - 80, cy + 3, 18, 2); rect(g, K.paper[4], CX + 62, cy + 3, 18, 2);
    rect(g, '#1a1228', 0, 0, W, 18); drawText(g, `SHAPE A ${this.shape.toUpperCase()}`, 6, 6, K.butter[3], 1, null); drawText(g, `${Math.max(0, Math.ceil(this.limit - this.t))}S`, 292, 6, K.paper[3], 1, null);
    drawTextC(g, `Match the dotted outline: ${Math.round(clamp(1 - this.err() / 5, 0, 1) * 100)}%`, 160, 196, K.paper[4], 1, null);
    drawTextC(g, 'Up/Down: move   Left/Right: narrow/widen   Enter: done', 160, 210, K.paper[2], 1, null);
  }
}
register('minigame', 'sv4h_clay', {
  title: 'Throw a pot', resultTitle: 'ON THE WHEEL',
  make: (game, o) => new ClayGame(game, o),
  bot(m, t, inp) {
    if (m.err() < 0.4 || m.t > 24) { inp.pressed = new Set(['enter']); return inp; }
    let bi = 0, bd = 0; for (let i = 0; i < ROWS; i++) { const d = m.target[i] - m.w[i]; if (Math.abs(d) > Math.abs(bd)) { bd = d; bi = i; } }
    const keys = new Set();
    if (m.r < bi - 0.35) keys.add('arrowdown'); else if (m.r > bi + 0.35) keys.add('arrowup'); else if (Math.abs(bd) > 0.05) keys.add(bd > 0 ? 'arrowright' : 'arrowleft');
    inp.keys = keys; return inp;
  },
});
