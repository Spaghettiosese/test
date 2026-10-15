// Maths "Number Bubbles": click two rising bubbles that add up to the target on the slate.
import { Cursor } from '../../input.js';
import { act } from '../../input.js';
import { CardGame, K, INK, rect, disc, ring, txtC, txt, chalkboard, blit, sfx, clamp } from './common.js';

export class MathGame extends CardGame {
  constructor(game, opts = {}) {
    super(game, opts, {
      title: opts.exam ? 'Maths exam' : 'Number Bubbles', chip: 'Maths', color: K.sky, limit: opts.exam ? 60 : opts.quiz ? 25 : 45,
      how: ['Bubbles float up with numbers.', 'Pop two that add up to the target on the slate.', 'Mouse: click two bubbles. Keys: arrows + space.'],
      keys: 'Click or space: pick a bubble',
    });
    this.need = opts.quiz ? 3 : Math.round((opts.exam ? 9 : 6) + this.diff * 3);
    this.maxN = Math.round(9 + this.diff * 9);
    this.cur = new Cursor(160, 120, 140, [10, 24, 310, 206]);
    Object.assign(this, { bubbles: [], pairs: 0, wrong: 0, sel: null, spawnT: 0, id: 0 });
    this.newTarget();
    for (let i = 0; i < 6; i++) this.spawn(30 + i * 30);
  }
  newTarget() { this.target = 6 + Math.floor(this.rng() * (this.maxN - 4)); }
  spawn(y) {
    const live = this.bubbles.filter((b) => !b.popped);
    let n;
    const lonely = live.filter((b) => b.n < this.target && !live.some((o) => o !== b && o.n + b.n === this.target));
    if (lonely.length && this.rng() < 0.6) n = this.target - lonely[Math.floor(this.rng() * lonely.length)].n;
    else n = 1 + Math.floor(this.rng() * (this.target - 1));
    const x = 30 + this.rng() * 196;
    this.bubbles.push({ id: this.id++, n, x, y: y ?? 214, r: 13 + (n > 9 ? 1 : 0), vy: 10 + this.rng() * 6 + this.diff * 8, w: this.rng() * 6, popped: 0 });
  }
  hit(x, y) { return this.bubbles.find((b) => !b.popped && Math.hypot(b.x - x, b.y - y) <= b.r + 2); }
  progress() { return clamp(this.pairs / this.need - this.wrong * 0.03, 0.2, 1); }
  info() { return `${this.pairs}/${this.need}`; }
  play(dt, input) {
    this.cur.update(dt, input);
    this.spawnT -= dt;
    const live = this.bubbles.filter((b) => !b.popped);
    if (this.spawnT <= 0 && live.length < 9) { this.spawn(); this.spawnT = 1.1 - this.diff * 0.4; }
    for (const b of this.bubbles) {
      if (b.popped) { b.popped += dt; continue; }
      b.y -= b.vy * dt; b.x += Math.sin(this.t * 1.7 + b.w) * 8 * dt;
      b.x = clamp(b.x, 22, 236);
    }
    this.bubbles = this.bubbles.filter((b) => (b.popped ? b.popped < 0.4 : b.y > 10));
    if (this.sel && !this.bubbles.includes(this.sel)) this.sel = null;
    if (act(input)) {
      const b = this.hit(this.cur.x, this.cur.y);
      if (!b) return;
      if (!this.sel) { this.sel = b; sfx('blip'); return; }
      if (this.sel === b) { this.sel = null; return; }
      if (this.sel.n + b.n === this.target) {
        this.sel.popped = b.popped = 0.001; this.pairs++; sfx('pop'); sfx('chime');
        this.pop(`${this.sel.n} + ${b.n} = ${this.target}`, (this.sel.x + b.x) / 2, Math.min(this.sel.y, b.y) - 16, K.butter[3]);
        this.sel = null; this.newTarget();
        if (this.pairs >= this.need) this.finish(clamp(1 - this.wrong * 0.04 - Math.max(0, this.playT - this.limit * 0.6) / this.limit * 0.3, 0.3, 1));
      } else { this.wrong++; this.shake = 0.2; sfx('wrong'); this.pop('Not quite!', b.x, b.y - 18, K.coral[3]); this.sel = null; }
    }
  }
  scene(g) {
    blit(g, 'school_math_bg', 320, 224, (c) => {
      const S = K.sky;
      rect(c, S[4], 0, 0, 320, 224);
      for (let y = 19; y < 224; y += 8) for (let x = (y / 8) % 2 ? 0 : 4; x < 320; x += 8) rect(c, S[3], x, y, 1, 1);
      rect(c, K.wood[3], 0, 204, 248, 20); rect(c, K.wood[4], 0, 204, 248, 1);
      rect(c, K.wood[2], 248, 19, 72, 205); rect(c, K.wood[3], 248, 19, 2, 205); rect(c, K.wood[1], 318, 19, 2, 205);
      chalkboard(c, 256, 40, 56, 52);
    });
    // target on the slate
    txtC(g, 'Target', 284, 48, K.chalkboard[4]);
    const ts = String(this.target);
    // big chalk numerals (drawn 3x with pixel blocks)
    drawBig(g, ts, 284, 60, K.paper[4]);
    txtC(g, 'Pairs', 284, 112, K.paper[4]);
    for (let i = 0; i < this.need; i++) { const x = 258 + (i % 6) * 9, y = 124 + Math.floor(i / 6) * 9; rect(g, INK, x, y, 7, 7); rect(g, i < this.pairs ? K.butter[2] : K.wood[1], x + 1, y + 1, 5, 5); }
    if (this.wrong) txtC(g, `Oops x${this.wrong}`, 284, 150, K.coral[4]);
    for (const b of this.bubbles) {
      if (b.popped) { const r = Math.round(b.r + b.popped * 30); g.globalAlpha = 1 - b.popped / 0.4; ring(g, K.sky[4], b.x, b.y, r); ring(g, '#ffffff', b.x, b.y, r - 3); g.globalAlpha = 1; continue; }
      const on = b === this.sel, hover = !on && Math.hypot(b.x - this.cur.x, b.y - this.cur.y) <= b.r + 2;
      disc(g, on ? K.butter[1] : K.sky[1], b.x, b.y, b.r + 1);
      disc(g, on ? K.butter[3] : hover ? K.sky[4] : K.sky[3], b.x, b.y, b.r);
      disc(g, on ? K.butter[4] : '#ffffff', b.x - 5, b.y - 5, 3);
      rect(g, '#ffffff', b.x - 7, b.y - 8, 2, 1);
      txtC(g, String(b.n), b.x + 1, b.y - 2, on ? K.butter[0] : K.sky[0]);
    }
    // cursor: a little chalk pointer
    const x = Math.round(this.cur.x), y = Math.round(this.cur.y);
    rect(g, INK, x - 1, y - 6, 3, 13); rect(g, INK, x - 6, y - 1, 13, 3);
    rect(g, K.paper[4], x, y - 5, 1, 11); rect(g, K.paper[4], x - 5, y, 11, 1);
  }
}

// Big pixel digits for slates and scoreboards (3x5 glyphs drawn as s-pixel blocks).
const DIG = { 0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001', 5: '111100111001111', 6: '111100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001111', ':': '000010000010000', '.': '000000000000010', '/': '001001010100100', '-': '000000111000000' };
export function drawBig(g, s, cx, y, c, sz = 4) {
  const w = s.length * 4 * sz - sz, x0 = Math.round(cx - w / 2);
  [...s].forEach((ch, i) => { const bits = DIG[ch] || DIG[0]; for (let k = 0; k < 15; k++) if (bits[k] === '1') rect(g, c, x0 + i * 4 * sz + (k % 3) * sz, y + Math.floor(k / 3) * sz, sz, sz); });
}

export function mathBot(m, t, input) {
  if (m.phase === 'intro') { input.pressed.add(' '); return input; }
  const frame = Math.round(t * 60);
  if (frame % 6) return input;
  const live = m.bubbles.filter((b) => !b.popped && b.y < 205);
  let a = m.sel, b = null;
  if (a) b = live.find((o) => o !== a && o.n + a.n === m.target);
  if (!b) { a = null; for (const x of live) { const y = live.find((o) => o !== x && o.n + x.n === m.target); if (y) { a = x; b = y; break; } } }
  if (!a) return input;
  const tgt = m.sel === a ? b : a;
  return Object.assign(input, { mx: tgt.x, my: tgt.y, moved: true, justDown: true });
}
