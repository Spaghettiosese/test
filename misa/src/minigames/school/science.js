// Science "Reaction Lab": add drops of reagents to the flask to match the target colour, then test it.
import { act } from '../../input.js';
import { CardGame, K, INK, rect, ell, disc, txt, txtC, blit, btn, inRect, card, sfx, clamp } from './common.js';

const REAGENTS = [
  { name: 'Red', c: [228, 59, 68], ramp: K.ribbon },
  { name: 'Yellow', c: [255, 215, 106], ramp: K.butter },
  { name: 'Blue', c: [58, 111, 196], ramp: K.hairBlue },
];
const WATER = [232, 240, 246];
const hex = (c) => '#' + c.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
// Paint-like mix: average of reagents (water tints toward pale when empty).
export function mix(counts) {
  const n = counts.reduce((a, b) => a + b, 0);
  if (!n) return WATER;
  const out = [0, 0, 0];
  counts.forEach((k, i) => { for (let j = 0; j < 3; j++) out[j] += REAGENTS[i].c[j] * k; });
  // red+yellow+blue darken a little like real pigments
  const dark = counts.filter((k) => k > 0).length >= 3 ? 0.78 : counts.filter((k) => k > 0).length === 2 ? 0.93 : 1;
  return out.map((v) => (v / n) * dark);
}
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const NAMES = ['Sunset orange', 'Leaf green', 'Grape purple', 'Lemon cream', 'Sea teal', 'Rust brown', 'Peach', 'Plum'];

export class LabGame extends CardGame {
  constructor(game, opts = {}) {
    super(game, opts, {
      title: opts.exam ? 'Science exam' : 'Reaction Lab', chip: 'Science', color: K.mint, limit: opts.exam ? 75 : opts.quiz ? 30 : 55,
      how: ['Match the colour on the card by adding drops of red, yellow and blue.', 'The mix is about the ratio of drops. Test it when it looks right!'],
      keys: 'Arrows: choose   Space or click: use',
    });
    this.rounds = opts.quiz ? 1 : opts.exam ? 4 : 3;
    Object.assign(this, { round: 0, sel: 0, counts: [0, 0, 0], scores: [], drops: [], bubble: [], result: null, wait: 0, tested: 0 });
    this.newTarget();
  }
  newTarget() {
    const max = this.diff > 0.5 ? 4 : 3, k = [0, 0, 0];
    const used = this.diff > 0.6 && this.rng() < 0.4 ? 3 : 2;
    const order = [0, 1, 2].sort(() => this.rng() - 0.5).slice(0, used);
    for (const i of order) k[i] = 1 + Math.floor(this.rng() * max);
    if (k.filter((x) => x).length === 2 && k[order[0]] === k[order[1]] && this.rng() < 0.5) k[order[0]]++;
    this.want = k; this.targetC = mix(k); this.counts = [0, 0, 0];
    const [r, y, b] = k; this.tname = r && y && b ? 'Autumn brown' : r && y ? (r > y ? 'Sunset orange' : 'Marigold') : y && b ? (y > b ? 'Leaf green' : 'Sea teal') : r && b ? (r > b ? 'Plum' : 'Grape purple') : 'Pure colour';
  }
  get buttons() { return [[24, 150, 44, 44], [76, 150, 44, 44], [128, 150, 44, 44], [186, 176, 46, 16], [240, 176, 66, 16]]; }
  progress() { return clamp((this.scores.reduce((a, b) => a + b, 0) + 0.2) / this.rounds, 0.2, 1); }
  info() { return `Flask ${Math.min(this.round + 1, this.rounds)}/${this.rounds}`; }
  use(i) {
    if (i < 3) {
      if (this.counts.reduce((a, b) => a + b, 0) >= 12) { this.pop('The flask is full!', 210, 40, K.coral[3]); sfx('wrong'); return; }
      this.counts[i]++; this.drops.push({ i, y: 58, x: 220 }); sfx('pour');
    } else if (i === 3) { this.counts = [0, 0, 0]; sfx('splash'); this.pop('Rinsed', 220, 60, K.sky[3]); }
    else this.test();
  }
  test() {
    if (!this.counts.some((x) => x)) { this.pop('Add some drops first', 220, 60, K.coral[3]); return; }
    const d = dist(mix(this.counts), this.targetC), s = clamp(1 - d / 140, 0, 1);
    const sc = s > 0.93 ? 1 : s > 0.82 ? 0.8 : s > 0.65 ? 0.6 : 0.4;
    this.tested++;
    if (sc < 0.6 && this.tested < 2) { this.pop(d > 60 ? 'Hmm, not close yet. Try again!' : 'Close! Adjust a little', 220, 60, K.butter[3]); sfx('wrong'); return; }
    this.scores.push(sc); this.tested = 0;
    this.result = sc >= 1 ? 'Perfect match!' : sc >= 0.8 ? 'Very close!' : 'Good try!';
    sfx(sc >= 0.8 ? 'chime' : 'pop'); this.flash = 0.25; this.wait = 1.2;
    for (let k = 0; k < 14; k++) this.bubble.push({ x: 212 + this.rng() * 18, y: 120, v: 20 + this.rng() * 30, life: 1 + this.rng() });
  }
  play(dt, input) {
    this.drops = this.drops.filter((d) => (d.y += 160 * dt) < 104);
    this.bubble = this.bubble.filter((b) => (b.life -= dt) > 0); for (const b of this.bubble) b.y -= b.v * dt;
    if (this.wait > 0) {
      this.wait -= dt;
      if (this.wait <= 0) { this.round++; this.result = null; if (this.round >= this.rounds) this.finish(this.scores.reduce((a, b) => a + b, 0) / this.rounds); else this.newTarget(); }
      return;
    }
    const k = input.pressed;
    if (k.has('arrowright') || k.has('d')) { this.sel = (this.sel + 1) % 5; sfx('blip'); }
    if (k.has('arrowleft') || k.has('a')) { this.sel = (this.sel + 4) % 5; sfx('blip'); }
    if (k.has('1')) this.use(0); if (k.has('2')) this.use(1); if (k.has('3')) this.use(2);
    if (input.justDown) { const i = this.buttons.findIndex((r) => inRect(input.mx, input.my, r)); if (i >= 0) { this.sel = i; this.use(i); } return; }
    if (input.moved) { const i = this.buttons.findIndex((r) => inRect(input.mx, input.my, r)); if (i >= 0) this.sel = i; }
    if (act(input)) this.use(this.sel);
  }
  scene(g) {
    blit(g, 'school_lab_bg', 320, 224, (c) => {
      // tiled lab wall and a bench top
      rect(c, K.mint[4], 0, 0, 320, 140);
      for (let y = 19; y < 140; y += 12) { rect(c, K.mint[3], 0, y, 320, 1); for (let x = (y / 12) % 2 ? 0 : 6; x < 320; x += 12) rect(c, K.mint[3], x, y, 1, 12); }
      rect(c, K.charcoal[2], 0, 140, 320, 84); rect(c, K.charcoal[3], 0, 140, 320, 3); rect(c, K.charcoal[1], 0, 143, 320, 2);
      for (let i = 0; i < 30; i++) rect(c, K.charcoal[3], (i * 71) % 320, 150 + (i * 37) % 70, 2, 1);
      // shelf with jars
      rect(c, K.wood[2], 12, 60, 150, 4); rect(c, K.wood[1], 12, 64, 150, 2);
      [[20, K.butter], [44, K.sakura], [70, K.sky], [100, K.forest], [128, K.lilac]].forEach(([x, r]) => { rect(c, INK, x - 1, 39, 16, 21); rect(c, '#e8f0f6', x, 40, 14, 20); rect(c, r[2], x + 1, 48, 12, 11); rect(c, r[3], x + 1, 48, 12, 1); rect(c, K.metal[2], x, 37, 14, 3); });
    });
    // target card
    card(g, 14, 76, 106, 56);
    txt(g, 'Make this:', 20, 82, K.mint[1]);
    rect(g, INK, 20, 92, 34, 34); rect(g, hex(this.targetC), 21, 93, 32, 32); rect(g, 'rgba(255,255,255,0.4)', 21, 93, 32, 2);
    txt(g, this.tname, 58, 95, INK);
    if (this.diff < 0.45) { txt(g, 'Hint:', 58, 107, K.ink[3]); let x = 58; this.want.forEach((n, i) => { for (let j = 0; j < n; j++) { rect(g, hex(REAGENTS[i].c), x, 117, 4, 5); x += 5; } }); }
    // flask
    const fx = 220, cur = mix(this.counts), lvl = this.counts.reduce((a, b) => a + b, 0);
    rect(g, INK, fx - 5, 56, 30, 4); rect(g, '#e8f0f6', fx - 4, 57, 28, 2);
    rect(g, INK, fx + 1, 58, 18, 32); rect(g, '#e8f0f6', fx + 2, 58, 16, 32);
    ell(g, INK, fx + 10, 116, 27, 23); ell(g, '#e8f0f6', fx + 10, 116, 26, 22);
    const h = 8 + lvl * 3;
    for (let y = 138 - h; y <= 138; y++) { const dy = y - 116, w = Math.floor(26 * Math.sqrt(Math.max(0, 1 - (dy * dy) / (22 * 22)))); if (w > 0) rect(g, hex(cur), fx + 10 - w + 1, y, w * 2 - 1, 1); }
    rect(g, 'rgba(255,255,255,0.55)', fx - 8, 100, 3, 18); rect(g, 'rgba(255,255,255,0.55)', fx + 5, 62, 2, 20);
    for (const d of this.drops) { rect(g, hex(REAGENTS[d.i].c), fx + 9, d.y, 3, 5); }
    for (const b of this.bubble) { g.globalAlpha = Math.min(1, b.life); disc(g, '#ffffff', b.x, b.y, 2); g.globalAlpha = 1; }
    txtC(g, `${lvl} drops`, fx + 10, 144, K.paper[3]);
    if (this.result) txtC(g, this.result, fx + 10, 40, K.butter[0]);
    // reagent bottles and buttons
    REAGENTS.forEach((r, i) => {
      const [x, y] = this.buttons[i], on = this.sel === i;
      rect(g, INK, x, y, 44, 44); rect(g, on ? K.butter[3] : K.paper[3], x + 1, y + 1, 42, 42);
      rect(g, INK, x + 15, y + 5, 14, 6); rect(g, K.metal[3], x + 16, y + 6, 12, 4);
      ell(g, INK, x + 22, y + 21, 11, 10); ell(g, r.ramp[2], x + 22, y + 21, 10, 9); ell(g, r.ramp[3], x + 18, y + 17, 3, 2); rect(g, '#ffffff', x + 16, y + 15, 2, 2);
      txtC(g, `${i + 1} ${r.name}`, x + 22, y + 34, INK);
    });
    btn(g, ...this.buttons[3], 'Rinse', { on: this.sel === 3, color: K.sky });
    btn(g, ...this.buttons[4], 'Test it!', { on: this.sel === 4, color: K.mint });
  }
}

export function labBot(m, t, input) {
  if (m.phase === 'intro') { input.pressed.add(' '); return input; }
  if (m.wait > 0 || Math.round(t * 60) % 8) return input;
  // scale the wanted ratio into the flask
  const i = [0, 1, 2].find((j) => m.counts[j] < m.want[j]);
  if (i !== undefined) input.pressed.add(String(i + 1));
  else Object.assign(input, { mx: 250, my: 182, justDown: true, moved: true });
  return input;
}
