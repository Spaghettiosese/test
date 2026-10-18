// Photography viewfinder: a subject drifts about the scene; steer the frame (arrows or pointer) and press E/click to shoot.
// Score = how centred the subject is (70%) plus a rule-of-thirds bonus (30%). opts: { sky, ground, subjects: [name], lively 0..1, level }
import { register } from '../../core/registry.js';
import { Cursor, act } from '../../input.js';
import { drawText, drawTextC } from '../../font.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { sfx } from '../../audio.js';
import { rect, disc, clamp, hash, W, H } from '../sv2_play/kit.js';

const THIRDS = [[107, 87], [213, 87], [107, 150], [213, 150]];
export class FrameGame {
  constructor(game, o = {}) {
    this.o = o;
    Object.assign(this, { t: 0, done: false, score: 0, flash: 0, limit: 9 + Math.min(3, (o.level || 0) * 0.4), comp: 0, shotAt: null });
    this.cur = new Cursor(160, 112, 105 + (o.level || 0) * 4, [30, 40, 290, 196]);
    this.lively = 0.5 + (o.lively == null ? 0.4 : o.lively) * 0.8;
    this.ph = [hash(7, 1) * 6, hash(7, 2) * 6];
  }
  subject(t = this.t) { return { x: 160 + 96 * Math.sin(t * 0.9 * this.lively + this.ph[0]), y: 118 + 46 * Math.sin(t * 1.3 * this.lively + this.ph[1]) }; }
  shoot() {
    const s = this.subject(), d = Math.hypot(this.cur.x - s.x, this.cur.y - s.y);
    const td = Math.min(...THIRDS.map(([x, y]) => Math.hypot(this.cur.x - x, this.cur.y - y)));
    const frame = clamp(1 - d / 64, 0, 1), th = clamp(1 - td / 60, 0, 1);
    this.comp = this.score = clamp(0.7 * frame + 0.3 * th, 0, 1);
    this.done = true; this.flash = 1; sfx('select');
    this.result = { text: this.score > 0.8 ? 'A perfectly framed shot!' : this.score > 0.5 ? 'A nice composition.' : 'A bit off-centre...', comp: this.score };
  }
  finish() { if (!this.done) this.shoot(); }
  update(dt, input) {
    if (this.done) return;
    this.t += dt; this.cur.update(dt, input);
    if (act(input) && this.t > 0.3) this.shoot(); else if (this.t >= this.limit) this.shoot();
  }
  draw(g, sprite) {
    const o = this.o, t = this.t, s = this.subject();
    rect(g, o.sky || K.sky[3], 0, 0, W, H); rect(g, o.ground || K.forest[2], 0, 150, W, 74);
    rect(g, K.forest[1], 0, 140, W, 10); for (let i = 0; i < 8; i++) disc(g, K.forest[3], 20 + i * 44, 140, 16);
    const nm = (o.subjects && o.subjects[0]) || 'Misa';
    rect(g, K.ink[1], s.x - 7, s.y - 4, 14, 22); rect(g, K.coral[2], s.x - 6, s.y - 3, 12, 14); disc(g, K.paper[4], s.x, s.y - 10, 7); rect(g, K.hairBrown ? K.hairBrown[2] : K.wood[3], s.x - 7, s.y - 17, 14, 5);
    if (o.subjects && o.subjects.length > 1) { rect(g, K.sky[1], s.x + 14, s.y, 11, 16); disc(g, K.paper[3], s.x + 19, s.y - 6, 5); }
    const c = this.cur, vw = 150, vh = 96;
    g.fillStyle = 'rgba(20,12,34,.6)';
    g.fillRect(0, 0, W, c.y - vh / 2); g.fillRect(0, c.y + vh / 2, W, H); g.fillRect(0, c.y - vh / 2, c.x - vw / 2, vh); g.fillRect(c.x + vw / 2, c.y - vh / 2, W, vh);
    const x0 = c.x - vw / 2, y0 = c.y - vh / 2;
    for (const [a, b, w, h] of [[x0, y0, vw, 2], [x0, y0 + vh - 2, vw, 2], [x0, y0, 2, vh], [x0 + vw - 2, y0, 2, vh]]) rect(g, K.paper[4], a, b, w, h);
    rect(g, 'rgba(255,255,255,.35)', x0 + vw / 3, y0, 1, vh); rect(g, 'rgba(255,255,255,.35)', x0 + 2 * vw / 3, y0, 1, vh); rect(g, 'rgba(255,255,255,.35)', x0, y0 + vh / 3, vw, 1); rect(g, 'rgba(255,255,255,.35)', x0, y0 + 2 * vh / 3, vw, 1);
    rect(g, K.coral[3], c.x - 5, c.y, 11, 1); rect(g, K.coral[3], c.x, c.y - 5, 1, 11);
    rect(g, '#1a1228', 0, 0, W, 18); drawText(g, 'VIEWFINDER', 6, 6, K.butter[3], 1, null); drawText(g, `${Math.max(0, Math.ceil(this.limit - t))}S`, 292, 6, K.paper[3], 1, null);
    drawTextC(g, `Subject: ${nm}`, 160, 206, K.paper[4], 1, null); drawTextC(g, 'Arrows or mouse to frame, E or click to shoot', 160, 215, K.paper[2], 1, null);
    if (this.flash > 0) { g.fillStyle = `rgba(255,255,255,${this.flash})`; g.fillRect(0, 0, W, H); this.flash = Math.max(0, this.flash - 0.03); }
  }
}
register('minigame', 'sv4h_frame', {
  title: 'Viewfinder', resultTitle: 'SNAP!',
  make: (game, o) => new FrameGame(game, o),
  bot(m, t, inp) {
    const s = m.subject(); inp.moved = true; inp.mx = s.x; inp.my = s.y;
    const td = Math.min(...THIRDS.map(([x, y]) => Math.hypot(s.x - x, s.y - y)));
    if (m.t > 1.5 && (td < 40 || m.t > 6)) inp.pressed = new Set([' ']);
    return inp;
  },
});
