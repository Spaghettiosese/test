// Shared kit for the school close-up minigames (classes, homework, exams, clubs, school events).
// Every game is a 320x224 close-up card drawn at 1:1 with colours from the master palette.
// A game extends CardGame and implements play(dt, input) + scene(g, sprite); the base class handles the
// how-to-play card, the timer, dozing off, floating feedback, the header/footer chrome and the result text.
import { RAMPS, INK } from '../../gfx/palette.js';
import { drawText, measure } from '../../font.js';
import { act } from '../../input.js';
import { sfx } from '../../audio.js';
import { clamp } from '../../rng.js';

export { RAMPS, INK, clamp, sfx };
export const K = RAMPS;
export const DEEP = K.ink[0];

// ---------- pixel primitives ----------
export const rect = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
export function ell(g, c, cx, cy, rx, ry) {
  cx = Math.round(cx); cy = Math.round(cy);
  for (let y = -ry; y <= ry; y++) { const w = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry || 1))) + 0.5); rect(g, c, cx - w, cy + y, w * 2 + 1, 1); }
}
export const disc = (g, c, cx, cy, r) => ell(g, c, cx, cy, r, r);
export function ring(g, c, cx, cy, r) {
  cx = Math.round(cx); cy = Math.round(cy);
  let x = r, y = 0, e = 1 - r;
  while (x >= y) {
    for (const [a, b] of [[x, y], [y, x], [-y, x], [-x, y], [-x, -y], [-y, -x], [y, -x], [x, -y]]) rect(g, c, cx + a, cy + b, 1, 1);
    y++; if (e < 0) e += 2 * y + 1; else { x--; e += 2 * (y - x) + 1; }
  }
}
// Pixel line (Bresenham) with a square brush of size s.
export function line(g, c, x0, y0, x1, y1, s = 1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, o = Math.floor(s / 2);
  let e = dx + dy;
  g.fillStyle = c;
  for (let i = 0; i < 2000; i++) {
    g.fillRect(x0 - o, y0 - o, s, s);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * e;
    if (e2 >= dy) { e += dy; x0 += sx; }
    if (e2 <= dx) { e += dx; y0 += sy; }
  }
}
// 2x2 checker dither fill (for large soft areas only).
export function dither(g, c, x, y, w, h, phase = 0) {
  g.fillStyle = c;
  for (let yy = 0; yy < h; yy++) for (let xx = (yy + phase) % 2; xx < w; xx += 2) g.fillRect(x + xx, y + yy, 1, 1);
}

// ---------- text ----------
export const txt = (g, s, x, y, c = K.paper[4], shadow = null) => drawText(g, String(s), Math.round(x), Math.round(y), c, 1, shadow);
export const txtC = (g, s, cx, y, c, shadow = null) => drawText(g, String(s), Math.round(cx - measure(String(s)) / 2), Math.round(y), c, 1, shadow);
export const txtR = (g, s, rx, y, c, shadow = null) => drawText(g, String(s), Math.round(rx - measure(String(s))), Math.round(y), c, 1, shadow);
export const textW = (s) => measure(String(s));
// Wrap by pixel width (works with any font width).
export function wrapPx(s, maxW) {
  const out = []; let ln = '';
  for (const w of String(s).split(' ')) {
    const t = ln ? ln + ' ' + w : w;
    if (measure(t) > maxW && ln) { out.push(ln); ln = w; } else ln = t;
  }
  if (ln) out.push(ln);
  return out;
}

// ---------- cached static art (backgrounds) ----------
const CACHE = new Map();
export function cached(key, w, h, draw) {
  if (typeof document === 'undefined') return null;
  let c = CACHE.get(key);
  if (!c) { c = document.createElement('canvas'); c.width = w; c.height = h; const cg = c.getContext('2d'); cg.imageSmoothingEnabled = false; draw(cg); CACHE.set(key, c); }
  return c;
}
export function blit(g, key, w, h, draw, x = 0, y = 0) { const c = cached(key, w, h, draw); if (c) g.drawImage(c, x, y); else draw(g); }

// ---------- UI kit pieces (ART 2.8) ----------
// Paper card: ink outline with cut corners, inner highlight top/left, shade bottom/right, 1px drop shadow.
export function card(g, x, y, w, h, { fill = K.paper[3], band = K.paper[2], shadow = true } = {}) {
  if (shadow) { rect(g, 'rgba(30,22,36,0.45)', x + 2, y + h, w - 2, 1); rect(g, 'rgba(30,22,36,0.45)', x + w, y + 2, 1, h - 2); }
  rect(g, INK, x + 1, y, w - 2, h); rect(g, INK, x, y + 1, w, h - 2);
  rect(g, fill, x + 1, y + 1, w - 2, h - 2);
  rect(g, K.paper[4], x + 1, y + 1, w - 2, 1); rect(g, K.paper[4], x + 1, y + 1, 1, h - 2);
  rect(g, band, x + 2, y + h - 3, w - 3, 2); rect(g, band, x + w - 2, y + 2, 1, h - 4);
}
export function nightPanel(g, x, y, w, h) {
  rect(g, INK, x + 1, y, w - 2, h); rect(g, INK, x, y + 1, w, h - 2);
  rect(g, 'rgba(43,29,46,0.94)', x + 1, y + 1, w - 2, h - 2);
  rect(g, K.paper[3], x + 2, y + 1, w - 4, 1);
}
// 3-state pixel button. Returns its rect for hit tests.
export function btn(g, x, y, w, h, label, { on = false, disabled = false, color = K.mint } = {}) {
  rect(g, INK, x + 1, y, w - 2, h); rect(g, INK, x, y + 1, w, h - 2);
  rect(g, disabled ? K.paper[1] : on ? K.butter[3] : color[3], x + 1, y + 1, w - 2, h - 2);
  if (!disabled) { rect(g, '#ffffff', x + 1, y + 1, w - 2, 1); rect(g, on ? K.butter[1] : color[1], x + 1, y + h - 2, w - 2, 1); }
  txtC(g, label, x + w / 2, y + Math.floor(h / 2) - 2 - (on ? 1 : 0), disabled ? K.ink[3] : INK);
  return [x, y, w, h];
}
export const inRect = (mx, my, r) => mx >= r[0] && my >= r[1] && mx < r[0] + r[2] && my < r[1] + r[3];
export function meter(g, x, y, w, h, v, c = K.mint[2], back = K.ink[2]) {
  rect(g, INK, x - 1, y - 1, w + 2, h + 2); rect(g, back, x, y, w, h); rect(g, c, x, y, Math.round(w * clamp(v, 0, 1)), h);
  if (h > 2) rect(g, 'rgba(255,255,255,0.35)', x, y, Math.round(w * clamp(v, 0, 1)), 1);
}
// Tiny keycap glyph (9x9) with a letter.
export function keycap(g, x, y, k) {
  rect(g, INK, x, y, 9, 9); rect(g, K.paper[3], x + 1, y + 1, 7, 6); rect(g, K.paper[1], x + 1, y + 7, 7, 1);
  txtC(g, k, x + 5, y + 2, INK);
}

// ---------- grades ----------
export const LETTERS = [[0.9, 'S'], [0.75, 'A'], [0.6, 'B'], [0.4, 'C'], [0, 'D']];
export const letterFor = (s) => LETTERS.find(([v]) => s >= v)[1];
const CHEER = { S: 'Brilliant!', A: 'Great work!', B: 'Nicely done!', C: 'Good effort!', D: 'Keep going, you\'ll get it!' };
export const cheer = (L) => CHEER[L];

// Study-skill difficulty 0..1 (opts.diff overrides; exams are a little harder).
export function diffOf(game, opts = {}) {
  if (typeof opts.diff === 'number') return clamp(opts.diff, 0, 1);
  const lv = game && game.skillLevel ? game.skillLevel('study') : 0;
  return clamp(lv / 8 + (opts.exam ? 0.15 : 0), 0, 1);
}

// ---------- the base card game ----------
export class CardGame {
  // meta: { title, subject (label chip), color (ramp), how: [lines], keys: footer hint, limit (s), icon? }
  constructor(game, opts, meta) {
    this.game = game; this.opts = opts || {};
    this.rng = (game && game.rng) || Math.random;
    Object.assign(this, { title: meta.title, chip: meta.chip || '', color: meta.color || K.sky, how: meta.how || [], keys: meta.keys || '', limit: meta.limit || 0 });
    this.diff = diffOf(game, this.opts);
    this.exam = !!this.opts.exam;
    this.phase = this.opts.skipIntro ? 'play' : 'intro';
    Object.assign(this, { t: 0, playT: 0, done: false, score: 0, bonus: 0, pops: [], doze: 0, dozeNext: 6 + this.rng() * 6, flash: 0, shake: 0 });
    this.drowsy = !!this.opts.drowsy;
    if (this.exam) this.chip = 'Exam';
  }
  get timeLeft() { return this.limit ? Math.max(0, this.limit - this.playT) : 0; }
  pop(text, x, y, c = K.butter[2]) { this.pops.push({ text, x, y, c, life: 1 }); }
  finish(score, note) {
    if (this.done) return;
    this.score = clamp(score, 0, 1);
    const L = letterFor(this.score);
    this.letter = L;
    this.result = { text: note || `Grade ${L}. ${cheer(L)}`, letter: L };
    this.done = true;
  }
  update(dt, input, game) {
    if (this.done) return;
    this.t += dt;
    this.pops = this.pops.filter((p) => (p.life -= dt) > 0);
    for (const p of this.pops) p.y -= 14 * dt;
    if (this.flash > 0) this.flash -= dt;
    if (this.shake > 0) this.shake -= dt;
    if (this.phase === 'intro') {
      if ((this.t > 0.35 && act(input)) || this.t > 6) { this.phase = 'play'; sfx('select'); }
      return;
    }
    // dozing off: low energy makes Misa's eyelids droop; tap to stay awake
    if (this.drowsy) {
      this.dozeNext -= dt;
      if (this.dozeNext <= 0 && this.doze === 0) this.doze = 0.01;
      if (this.doze > 0) {
        if (act(input)) { this.doze = Math.max(0, this.doze - 0.3); if (this.doze === 0) { this.dozeNext = 8 + this.rng() * 8; this.pop('Awake!', 160, 110, K.mint[3]); } return; }
        this.doze = Math.min(1, this.doze + dt * 0.35);
        if (this.doze > 0.55) return; // too sleepy to work
      }
    }
    this.playT += dt;
    this.play(dt, input, game);
    if (!this.done && this.limit && this.playT >= this.limit) this.timeUp();
  }
  timeUp() { this.finish(this.progress ? this.progress() : 0.5); }
  draw(g, sprite, game) {
    const sx = this.shake > 0 ? Math.round(Math.sin(this.t * 80) * 2) : 0;
    if (sx) { g.save(); g.translate(sx, 0); }
    this.scene(g, sprite, game);
    if (sx) g.restore();
    for (const p of this.pops) { g.globalAlpha = Math.min(1, p.life * 2); txtC(g, p.text, p.x, Math.round(p.y), p.c, DEEP); }
    g.globalAlpha = 1;
    if (this.flash > 0) { g.globalAlpha = Math.min(0.5, this.flash); rect(g, '#ffffff', 0, 0, 320, 224); g.globalAlpha = 1; }
    this.chrome(g);
    if (this.doze > 0) this.drawDoze(g);
    if (this.phase === 'intro') this.drawIntro(g);
  }
  chrome(g) {
    // header ribbon
    rect(g, INK, 0, 0, 320, 19); rect(g, 'rgba(43,29,46,0.96)', 0, 0, 320, 18); rect(g, K.paper[3], 0, 18, 320, 1);
    const c = this.color, cw = textW(this.chip) + 10;
    if (this.chip) { rect(g, c[1], 4, 4, cw, 11); rect(g, c[2], 4, 4, cw, 10); rect(g, c[3], 4, 4, cw, 1); txt(g, this.chip, 9, 7, INK); }
    txt(g, this.title, (this.chip ? cw + 10 : 8), 7, K.paper[4], DEEP);
    const info = this.info ? this.info() : '';
    if (this.limit) {
      const v = this.timeLeft / this.limit;
      meter(g, 252, 7, 62, 4, v, v > 0.25 ? K.mint[2] : K.coral[2]);
      if (info) txtR(g, info, 246, 7, K.butter[3]);
    } else if (info) txtR(g, info, 314, 7, K.butter[3]);
    // footer hint
    if (this.keys && this.phase === 'play') {
      const w = textW(this.keys) + 12, x = Math.round(160 - w / 2);
      nightPanel(g, x, 211, w, 13); txt(g, this.keys, x + 6, 215, K.paper[3]);
    }
  }
  drawIntro(g) {
    g.globalAlpha = 0.55; rect(g, DEEP, 0, 19, 320, 205); g.globalAlpha = 1;
    const lines = this.how.flatMap((l) => wrapPx(l, 196));
    const h = 44 + lines.length * 9, y = Math.round(118 - h / 2);
    card(g, 54, y, 212, h);
    rect(g, this.color[2], 55, y + 1, 210, 14); rect(g, this.color[3], 55, y + 1, 210, 1);
    txtC(g, this.exam ? `${this.title}` : 'How to play', 160, y + 5, INK);
    lines.forEach((l, i) => txtC(g, l, 160, y + 21 + i * 9, INK));
    if (Math.floor(this.t * 2.5) % 2 || this.t < 0.35) txtC(g, 'Press space or click to start', 160, y + h - 14, this.color[1]);
  }
  drawDoze(g) {
    const d = Math.min(1, this.doze / 0.6), lid = Math.round(d * 100);
    rect(g, DEEP, 0, 0, 320, lid); rect(g, DEEP, 0, 224 - lid, 320, lid);
    rect(g, K.plaster[1], 0, lid - 2, 320, 2); rect(g, K.plaster[1], 0, 224 - lid, 320, 2);
    if (this.doze > 0.2) {
      const w = 170, x = 75;
      nightPanel(g, x, 104, w, 18);
      txtC(g, 'Zzz... tap space or click to stay awake!', 160, 110, Math.floor(this.t * 4) % 2 ? K.butter[3] : K.paper[4]);
    }
  }
}

// ---------- shared painted backdrops ----------
// Wooden desk top seen from above (most class close-ups sit on Misa's desk).
export function deskTop(g, key = 'desk') {
  blit(g, 'school_bg_' + key, 320, 224, (c) => {
    const W = K.wood;
    rect(c, W[3], 0, 0, 320, 224);
    for (let y = 0; y < 224; y += 14) {
      rect(c, W[2], 0, y + 13, 320, 1);
      for (let x = ((y / 14) % 2) * 37; x < 320; x += 74) rect(c, W[2], x, y, 1, 13);
      for (let k = 0; k < 6; k++) { const gx = (y * 7 + k * 53) % 320; rect(c, W[4], gx, y + 3 + (k % 3) * 3, 9 + (k % 4) * 3, 1); }
    }
    rect(c, 'rgba(79,48,40,0.10)', 0, 190, 320, 34);
  });
}
// Chalkboard with a wooden frame and a chalk tray.
export function chalkboard(g, x, y, w, h) {
  const C = K.chalkboard, W = K.wood;
  rect(g, W[1], x - 4, y - 4, w + 8, h + 8); rect(g, W[2], x - 3, y - 3, w + 6, 2); rect(g, W[0], x - 4, y + h + 3, w + 8, 1);
  rect(g, C[1], x, y, w, h);
  for (let i = 0; i < 26; i++) { const sx = x + ((i * 97) % w), sy = y + ((i * 53) % h); rect(g, C[2], sx, sy, 6 + (i % 5) * 3, 1); }
  rect(g, W[2], x - 2, y + h, w + 4, 3); rect(g, K.paper[4], x + 10, y + h - 1, 6, 2); rect(g, K.sakura[3], x + 20, y + h - 1, 5, 2);
}
// Lined notebook paper.
export function notebook(g, x, y, w, h, lineC = K.sky[3]) {
  card(g, x, y, w, h, { fill: K.paper[4], band: K.paper[2] });
  for (let yy = y + 14; yy < y + h - 4; yy += 10) rect(g, lineC, x + 2, yy, w - 4, 1);
  rect(g, K.coral[3], x + 14, y + 1, 1, h - 2);
}
