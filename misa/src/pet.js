// Close-up "pet Mochi" menu: a big animated pixel cat and a hand you move with the mouse (or WASD).
// Hold the button (or Space) and stroke slowly. Head and chin are favourites; stroking too fast annoys her.
import { Cursor, actHeld } from './input.js';
import { drawText, drawTextC } from './font.js';
import { sfx } from './audio.js';
import { clamp, range } from './rng.js';

const K = '#5a3020', O = '#f2b56b', O2 = '#d98d45', CR = '#fff1d6', PK = '#f7a1b1', GR = '#6fcf7a', GR2 = '#3f9a52';
const CX = 160;
const rect = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const ell = (g, c, cx, cy, rx, ry) => { for (let y = -ry; y <= ry; y++) { const w = Math.floor(rx * Math.sqrt(1 - (y * y) / (ry * ry)) + 0.5); rect(g, c, cx - w, cy + y, w * 2 + 1, 1); } };
const blob = (g, fill, cx, cy, rx, ry, shade = null) => { ell(g, K, cx, cy, rx + 1, ry + 1); if (shade) { ell(g, shade, cx, cy, rx, ry); ell(g, fill, cx - 2, cy - 2, rx - 2, ry - 2); } else ell(g, fill, cx, cy, rx, ry); };
const tri = (g, c, a, b, d) => {
  const pts = [a, b, d], ys = pts.map((p) => p[1]);
  for (let y = Math.min(...ys); y <= Math.max(...ys); y++) {
    let lo = 1e9, hi = -1e9;
    for (let i = 0; i < 3; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % 3];
      if (y1 === y2) { if (y === y1) { lo = Math.min(lo, x1, x2); hi = Math.max(hi, x1, x2); } continue; }
      if ((y - y1) * (y - y2) <= 0) { const x = x1 + ((y - y1) * (x2 - x1)) / (y2 - y1); lo = Math.min(lo, x); hi = Math.max(hi, x); }
    }
    if (lo <= hi) rect(g, c, Math.round(lo), y, Math.round(hi) - Math.round(lo) + 1, 1);
  }
};
const inEll = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
const DONE = { x: 236, y: 198, w: 76, h: 20 };

export class PetGame {
  constructor(rng) {
    Object.assign(this, { rng, t: 0, affection: 0, stroke: 0, annoyT: 0, overT: 0, done: false, score: 0, hearts: [], purrT: 0, msg: 'HOLD MOUSE / SPACE AND STROKE SLOWLY', zone: null, lean: 0, petting: false, earT: 3, meowed: 0, title: 'Pet Mochi' });
    this.cur = new Cursor(230, 150, 130, [10, 24, 310, 214]);
  }
  zoneAt(x, y) {
    const hx = CX + this.lean;
    if (inEll(x, y, hx, 122, 16, 9)) return 'chin';
    if (inEll(x, y, hx, 100, 44, 36) || inEll(x, y, hx - 30, 74, 14, 14) || inEll(x, y, hx + 30, 74, 14, 14)) return 'head';
    if (inEll(x, y, CX, 152, 48, 42)) return 'body';
    return null;
  }
  update(dt, input) {
    if (this.done) return;
    this.t += dt; this.earT -= dt;
    this.cur.update(dt, input);
    if (input.justDown && input.mx > DONE.x && input.mx < DONE.x + DONE.w && input.my > DONE.y && input.my < DONE.y + DONE.h) { this.finish(); return; }
    const sp = this.cur.speedNow;
    this.zone = this.zoneAt(this.cur.x, this.cur.y);
    this.petting = actHeld(input) && sp > 14 && !!this.zone && this.annoyT <= 0;
    if (this.annoyT > 0) this.annoyT -= dt;
    if (this.petting) {
      if (sp > 330) {
        this.overT += dt;
        if (this.overT > 0.7) { this.annoyT = 1.6; this.overT = 0; this.affection = Math.max(0, this.affection - 0.06); this.msg = 'TOO FAST! GENTLE STROKES, PLEASE'; sfx('wrong'); }
      } else {
        this.overT = Math.max(0, this.overT - dt);
        const rate = { chin: 0.2, head: 0.14, body: 0.09 }[this.zone];
        const before = this.affection;
        this.affection = Math.min(1, this.affection + dt * rate);
        this.stroke = Math.min(1, this.stroke + dt * 4);
        this.msg = this.zone === 'chin' ? 'MMM... RIGHT UNDER THE CHIN!' : this.zone === 'head' ? 'HEAD PATS ARE THE BEST' : 'A NICE LONG BACK RUB';
        if (this.rng() < dt * (4 + this.stroke * 6)) this.hearts.push({ x: this.cur.x + range(this.rng, -14, 14), y: this.cur.y - 10, life: 1.4, s: this.rng() < 0.3 ? 1 : 0 });
        if (before < 0.5 && this.affection >= 0.5) { sfx('meow'); this.msg = 'MOCHI IS STARTING TO PURR'; }
        if (before < 1 && this.affection >= 1) { sfx('chime'); this.msg = 'MOCHI LOVES YOU! PRESS DONE WHEN READY'; }
      }
    } else this.stroke = Math.max(0, this.stroke - dt * 1.5);
    this.purrT -= dt;
    if (this.stroke > 0.3 && this.purrT <= 0) { sfx('purr'); this.purrT = 0.32; }
    for (const h of this.hearts) { h.y -= 22 * dt; h.life -= dt; }
    this.hearts = this.hearts.filter((h) => h.life > 0);
    const want = this.stroke > 0.2 ? clamp((this.cur.x - CX) * 0.08, -6, 6) : 0;
    this.lean += (want - this.lean) * Math.min(1, dt * 6);
    this.score = this.affection;
  }
  finish() { this.done = true; this.score = this.affection; }
  get mood() { return this.annoyT > 0 ? 'annoyed' : this.affection >= 1 ? 'full' : this.stroke > 0.2 ? 'happy' : 'idle'; }

  draw(g, sprite) {
    const t = this.t, mood = this.mood, breathe = Math.sin(t * 2.2) * 1.2 + (this.stroke > 0.3 ? Math.sin(t * 24) * 0.6 : 0);
    // room
    rect(g, '#f6e2c8', 0, 0, 320, 224); rect(g, '#e8c9a6', 0, 150, 320, 74);
    for (let x = 0; x < 320; x += 40) rect(g, '#dcb894', x, 150, 1, 74);
    rect(g, '#fff6d6', 20, 40, 50, 60); rect(g, '#bfe6f5', 24, 44, 42, 52); rect(g, '#7a4f3a', 44, 44, 2, 52); rect(g, '#7a4f3a', 24, 68, 42, 2);
    // shadow + cushion
    ell(g, '#00000022', CX, 198, 78, 10); blob(g, '#e0707a', CX, 192, 72, 12, '#bd5460'); ell(g, '#f08a94', CX, 187, 60, 6);
    // tail
    const tailSway = (mood === 'annoyed' ? 2.2 : 1) * (1 + this.stroke * 0.5);
    const tp = [];
    for (let i = 0; i < 22; i++) tp.push([CX + 42 + i * 1.5 + Math.sin(t * 2.4 - i * 0.28) * (i * 0.5) * tailSway, 182 - i * 3.9]);
    for (const [x, y] of tp) ell(g, K, Math.round(x), Math.round(y), 8, 8);
    tp.forEach(([x, y], i) => ell(g, i > 17 ? CR : i % 5 === 3 ? O2 : O, Math.round(x), Math.round(y), 6, 6));
    // body
    const by = 152 + breathe * 0.5;
    blob(g, O, CX, by, 48, 42, O2); ell(g, CR, CX, by + 14, 28, 28);
    for (let k = 0; k < 3; k++) { ell(g, O2, CX - 44 + k * 3, by - 12 + k * 14, 6, 2); ell(g, O2, CX + 44 - k * 3, by - 12 + k * 14, 6, 2); }
    // front paws
    for (const s of [-1, 1]) { blob(g, CR, CX + s * 18, 186, 12, 9); rect(g, K, CX + s * 18 - 1, 184, 1, 5); rect(g, K, CX + s * 18 + s * 4 - 1, 184, 1, 4); }
    // head
    const hx = CX + Math.round(this.lean), hy = 100 + Math.round(breathe * 0.4) + (this.stroke > 0.3 ? 1 : 0);
    const flat = mood === 'annoyed', twitch = this.earT < 0.18 && this.earT > 0;
    if (this.earT < -0.1) this.earT = range(this.rng, 3, 7);
    for (const s of [-1, 1]) {
      const e = flat ? [[hx + s * 44, hy - 4], [hx + s * 56, hy - 22], [hx + s * 24, hy - 26]] : [[hx + s * 40, hy - 12], [hx + s * 34 + (twitch && s > 0 ? 6 : 0), hy - 46], [hx + s * 14, hy - 28]];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) tri(g, K, ...e.map(([x, y]) => [x + dx, y + dy]));
      tri(g, O, ...e);
      const c = e.reduce((a, p) => [a[0] + p[0] / 3, a[1] + p[1] / 3], [0, 0]);
      tri(g, PK, ...e.map(([x, y]) => [Math.round(c[0] + (x - c[0]) * 0.55), Math.round(c[1] + (y - c[1]) * 0.55)]));
    }
    blob(g, O, hx, hy, 44, 35, O2);
    blob(g, O, hx - 42, hy + 9, 10, 8); blob(g, O, hx + 42, hy + 9, 10, 8);
    ell(g, O, hx, hy, 42, 33);
    for (const dx of [-8, 0, 8]) rect(g, O2, hx + dx - 1, hy - 34, 3, dx === 0 ? 14 : 10);
    ell(g, CR, hx, hy + 15, 17, 11); ell(g, CR, hx - 12, hy + 12, 9, 8); ell(g, CR, hx + 12, hy + 12, 9, 8);
    tri(g, PK, [hx - 5, hy + 7], [hx + 5, hy + 7], [hx, hy + 13]); rect(g, K, hx, hy + 13, 1, 3);
    const open = mood === 'happy' || mood === 'full';
    if (open) { ell(g, '#7a2a35', hx, hy + 20, 4, 3); rect(g, '#f08a94', hx - 2, hy + 21, 4, 2); }
    else { rect(g, K, hx - 7, hy + 17, 6, 1); rect(g, K, hx + 2, hy + 17, 6, 1); rect(g, K, hx - 8, hy + 16, 1, 1); rect(g, K, hx + 8, hy + 16, 1, 1); rect(g, K, hx - 1, hy + 16, 1, 2); }
    for (const s of [-1, 1]) for (const [dy, dl] of [[-2, 1], [3, 0], [8, -1]]) { for (let i = 0; i < 24; i++) rect(g, '#fff1d6', hx + s * (22 + i), hy + 14 + dy + Math.round((dl * i) / 6), 1, 1); }
    // eyes
    const look = [clamp((this.cur.x - hx) / 30, -1, 1), clamp((this.cur.y - hy) / 30, -1, 1)];
    const blink = t % 4.2 < 0.14;
    for (const s of [-1, 1]) {
      const ex = hx + s * 19, ey = hy - 4;
      if (mood === 'happy' || (blink && mood === 'idle')) { for (let x = -9; x <= 9; x++) rect(g, K, ex + x, ey - 2 + Math.floor(Math.abs(x) * 0.6) - (mood === 'happy' ? 0 : 5) * 0 + (mood === 'happy' ? 0 : 3), 1, 3); }
      else if (mood === 'full') { for (let x = -9; x <= 9; x++) rect(g, K, ex + x, ey + 4 - Math.floor(Math.abs(x) * 0.45), 1, 3); }
      else {
        ell(g, K, ex, ey, 10, 12); ell(g, GR, ex, ey, 9, 11); ell(g, GR2, ex, ey + 3, 8, 7); ell(g, GR, ex, ey - 1, 7, 8);
        ell(g, K, ex + Math.round(look[0] * 2.5), ey + Math.round(look[1] * 2.5), 3, 8);
        rect(g, '#ffffff', ex - 6, ey - 8, 4, 4); rect(g, '#ffffffcc', ex + 3, ey + 4, 2, 2);
        if (flat) { rect(g, O, ex - 11, ey - 14, 23, 12); rect(g, K, ex - 10, ey - 3 + (s > 0 ? -2 : 0) + (s < 0 ? 0 : 2) * 0, 21, 2); }
      }
    }
    if (mood === 'happy' || mood === 'full') { ell(g, '#f58a9a99', hx - 32, hy + 8, 7, 4); ell(g, '#f58a9a99', hx + 32, hy + 8, 7, 4); }
    if (mood === 'full') { g.globalAlpha = 0.9; g.drawImage(sprite('zzz'), hx + 46, hy - 40 + Math.round(Math.sin(t * 2) * 2), 16, 16); g.globalAlpha = 1; }
    // hearts
    for (const h of this.hearts) { g.globalAlpha = Math.min(1, h.life); const s = h.s ? 3 : 2; g.drawImage(sprite('heart'), Math.round(h.x), Math.round(h.y), 7 * s, 6 * s); }
    g.globalAlpha = 1;
    // hand
    const c = this.cur, down = this.petting || actHeld({ keys: new Set(), down: false });
    const hp = this.stroke > 0.1 ? Math.sin(t * 20) * 1.5 : 0;
    rect(g, K, c.x - 8, c.y + 4, 20, 26); rect(g, '#3d5a8c', c.x - 7, c.y + 5, 18, 25); rect(g, '#5f80b4', c.x - 7, c.y + 5, 18, 4);
    ell(g, K, Math.round(c.x + hp), Math.round(c.y), 11, 9); ell(g, '#f8d5b8', Math.round(c.x + hp), Math.round(c.y), 10, 8); ell(g, '#e3a98a', Math.round(c.x + hp + 3), Math.round(c.y + 3), 6, 4);
    for (let i = 0; i < 4; i++) { blob(g, '#f8d5b8', Math.round(c.x + hp - 8 + i * 5), Math.round(c.y - 8 - (i === 1 || i === 2 ? 2 : 0)), 3, 4); }
    // HUD
    rect(g, '#2b1d2ecc', 0, 0, 320, 22);
    drawText(g, 'PET MOCHI', 8, 8, '#fffaf0');
    for (let i = 0; i < 5; i++) { g.globalAlpha = this.affection >= (i + 0.5) / 5 ? 1 : 0.25; g.drawImage(sprite('heart'), 90 + i * 12, 6, 10, 9); }
    g.globalAlpha = 1;
    rect(g, '#5a3a86', 160, 8, 90, 7); rect(g, this.affection >= 1 ? '#ffd76a' : '#f0a0b8', 161, 9, Math.round(88 * this.affection), 5);
    drawTextC(g, this.msg, 116, 209, '#2b1d2e', 1, null);
    rect(g, K, DONE.x - 1, DONE.y - 1, DONE.w + 2, DONE.h + 2); rect(g, this.affection >= 1 ? '#ffd76a' : '#86cdb0', DONE.x, DONE.y, DONE.w, DONE.h);
    drawTextC(g, 'DONE (ESC)', DONE.x + DONE.w / 2, DONE.y + 7, '#2b1d2e', 1, null);
  }
}
