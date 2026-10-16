// Close-up "pet Mochi" menu: a big animated pixel cat and Misa's hand, moved with the mouse, touch drag or WASD.
// Hold the button (or Space, or keep a finger down) and stroke slowly. Head and chin are favourites; stroking too
// fast annoys her. drawCat() is the shared close-up cat renderer (pet, feed, feather wand and brushing screens),
// drawn at any size k with row-span pixel ellipses only (no canvas anti-aliasing).
import { Cursor, actHeld } from '../input.js';
import { drawText, drawTextC } from '../font.js';
import { sfx } from '../audio.js';
import { clamp, range } from '../rng.js';

const K = '#2a1a22';
export const CAT_LOOKS = {
  mochi: { o: '#f2b56b', o2: '#d98d45', o3: '#b8702f', hi: '#ffd9a0', cr: '#fff1d6', cr2: '#f4e4c1', pk: '#f7a1b1', eye: '#6fcf7a', eye2: '#3f9a52', stripes: true },
  kuro: { o: '#76768a', o2: '#5a5a64', o3: '#3a3846', hi: '#9a9aac', cr: '#f4f0f4', cr2: '#d8d4dc', pk: '#c87a8a', eye: '#ffd04a', eye2: '#c48a1e', stripes: false, socks: true, bent: true },
};
export const rect = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
export const ell = (g, c, cx, cy, rx, ry) => {
  cx = Math.round(cx); cy = Math.round(cy); rx = Math.max(0, Math.round(rx)); ry = Math.max(0, Math.round(ry));
  for (let y = -ry; y <= ry; y++) { const w = Math.floor(rx * Math.sqrt(1 - (y * y) / ((ry * ry) || 1)) + 0.5); rect(g, c, cx - w, cy + y, w * 2 + 1, 1); }
};
const blob = (g, fill, cx, cy, rx, ry, shade = null) => { ell(g, K, cx, cy, rx + 1, ry + 1); if (shade) { ell(g, shade, cx, cy, rx, ry); ell(g, fill, cx - 2, cy - 2, rx - 2, ry - 2); } else ell(g, fill, cx, cy, rx, ry); };
export const tri = (g, c, a, b, d) => {
  const pts = [a, b, d].map(([x, y]) => [Math.round(x), Math.round(y)]), ys = pts.map((p) => p[1]);
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

// The close-up cat. (cx, base) = centre of the floor line under her. o: { k, t, mood ('idle'|'happy'|'full'|'annoyed'|
// 'eat'|'sniff'|'crouch'|'wide'), lean, look [-1..1, -1..1], stroke, twitch, look: CAT_LOOKS key, tailSway }
export function drawCat(g, cx, base, o = {}) {
  const L = CAT_LOOKS[o.cat || 'mochi'], k = o.k || 1, t = o.t || 0, mood = o.mood || 'idle', S = (v) => Math.round(v * k);
  const stroke = o.stroke || 0, crouch = mood === 'crouch' ? 1 : 0;
  const breathe = Math.sin(t * 2.2) * 1.2 * k + (stroke > 0.3 ? Math.sin(t * 24) * 0.6 : 0);
  const by = base - S(40) + breathe * 0.5 + S(crouch * 14), sq = crouch ? 0.82 : 1;
  // tail (a chain of discs swaying)
  const sway = (o.tailSway ?? 1) * (mood === 'annoyed' ? 2.2 : 1) * (1 + stroke * 0.5) * (crouch ? 1.8 : 1);
  const tp = [];
  for (let i = 0; i < 22; i++) tp.push([cx + S(42 + i * 1.5) + Math.sin(t * (crouch ? 7 : 2.4) - i * 0.28) * (i * 0.5) * sway * k, base - S(10) - S(i * 3.9 * (crouch ? 0.6 : 1))]);
  for (const [x, y] of tp) ell(g, K, x, y, S(8), S(8));
  tp.forEach(([x, y], i) => ell(g, i > 17 ? (L.stripes ? L.o3 : L.o) : i % 5 === 3 && L.stripes ? L.o2 : L.o, x, y, S(6), S(6)));
  // body
  blob(g, L.o, cx, by, S(48), S(42 * sq), L.o2); ell(g, L.cr, cx, by + S(14), S(28), S(28 * sq));
  if (L.stripes) for (let i = 0; i < 3; i++) { ell(g, L.o2, cx - S(44 - i * 3), by - S(12 - i * 14), S(6), S(2)); ell(g, L.o2, cx + S(44 - i * 3), by - S(12 - i * 14), S(6), S(2)); }
  // front paws
  for (const s of [-1, 1]) { const px = cx + s * S(18), py = base - S(6); blob(g, L.socks ? L.cr : L.cr, px, py, S(12), S(9)); rect(g, K, px - 1, py - S(2), 1, S(5)); rect(g, K, px + s * S(4) - 1, py - S(2), 1, S(4)); }
  // head
  const hx = cx + Math.round((o.lean || 0) * k), hy = base - S(92) + Math.round(breathe * 0.4) + (stroke > 0.3 ? 1 : 0) + S(crouch * 24) + (mood === 'eat' ? S(26) : 0);
  const flat = mood === 'annoyed' || mood === 'wide' && o.flat, twitch = o.twitch;
  for (const s of [-1, 1]) {
    const e = flat ? [[hx + s * S(44), hy - S(4)], [hx + s * S(56), hy - S(22)], [hx + s * S(24), hy - S(26)]]
      : [[hx + s * S(40), hy - S(12)], [hx + s * S(34) + (twitch && s > 0 ? S(6) : 0), hy - S(46)], [hx + s * S(14), hy - S(28)]];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) tri(g, K, ...e.map(([x, y]) => [x + dx, y + dy]));
    tri(g, L.o, ...e);
    const c = e.reduce((a, p) => [a[0] + p[0] / 3, a[1] + p[1] / 3], [0, 0]);
    tri(g, L.pk, ...e.map(([x, y]) => [Math.round(c[0] + (x - c[0]) * 0.55), Math.round(c[1] + (y - c[1]) * 0.55)]));
    if (L.bent && s > 0 && !flat) ell(g, L.o2, e[1][0] - S(4), e[1][1] + S(6), S(6), S(4));
  }
  blob(g, L.o, hx, hy, S(44), S(35), L.o2);
  blob(g, L.o, hx - S(42), hy + S(9), S(10), S(8)); blob(g, L.o, hx + S(42), hy + S(9), S(10), S(8));
  ell(g, L.o, hx, hy, S(42), S(33)); ell(g, L.hi, hx - S(16), hy - S(22), S(10), S(4));
  if (L.stripes) for (const dx of [-8, 0, 8]) rect(g, L.o2, hx + S(dx) - 1, hy - S(34), Math.max(1, S(3)), S(dx === 0 ? 14 : 10));
  ell(g, L.cr, hx, hy + S(15), S(17), S(11)); ell(g, L.cr, hx - S(12), hy + S(12), S(9), S(8)); ell(g, L.cr, hx + S(12), hy + S(12), S(9), S(8));
  tri(g, L.pk, [hx - S(5), hy + S(7)], [hx + S(5), hy + S(7)], [hx, hy + S(13)]); rect(g, K, hx, hy + S(13), 1, S(3));
  const open = mood === 'happy' || mood === 'full' || mood === 'eat';
  if (open) { ell(g, '#7a2a35', hx, hy + S(20), S(4), S(3)); rect(g, '#f08a94', hx - S(2), hy + S(21), S(4), Math.max(1, S(2))); }
  else { rect(g, K, hx - S(7), hy + S(17), S(6), 1); rect(g, K, hx + S(2), hy + S(17), S(6), 1); rect(g, K, hx - 1, hy + S(16), 1, S(2)); }
  for (const s of [-1, 1]) for (const [dy, dl] of [[-2, 1], [3, 0], [8, -1]]) for (let i = 0; i < S(24); i++) rect(g, '#fffaf0', hx + s * (S(22) + i), hy + S(14 + dy) + Math.round((dl * i) / (6 * k)), 1, 1);
  // eyes
  const look = o.look || [0, 0], blink = t % 4.2 < 0.14;
  for (const s of [-1, 1]) {
    const ex = hx + s * S(19), ey = hy - S(4);
    if (mood === 'happy' || mood === 'eat' || (blink && (mood === 'idle' || mood === 'crouch'))) { for (let x = -S(9); x <= S(9); x++) rect(g, K, ex + x, ey + S(1) + Math.floor(Math.abs(x) * 0.6 * (mood === 'happy' || mood === 'eat' ? -1 : 0)) + (mood === 'happy' || mood === 'eat' ? S(2) : 0), 1, Math.max(1, S(3))); }
    else if (mood === 'full') { for (let x = -S(9); x <= S(9); x++) rect(g, K, ex + x, ey + S(4) - Math.floor(Math.abs(x) * 0.45), 1, Math.max(1, S(3))); }
    else {
      const big = mood === 'wide' || crouch ? 1.15 : 1;
      ell(g, K, ex, ey, S(10 * big), S(12 * big)); ell(g, L.eye, ex, ey, S(9 * big), S(11 * big)); ell(g, L.eye2, ex, ey + S(3), S(8 * big), S(7 * big)); ell(g, L.eye, ex, ey - S(1), S(7 * big), S(8 * big));
      ell(g, K, ex + Math.round(look[0] * S(2.5)), ey + Math.round(look[1] * S(2.5)), S(crouch || mood === 'wide' ? 5 : 3), S(8));
      rect(g, '#ffffff', ex - S(6), ey - S(8), Math.max(1, S(4)), Math.max(1, S(4))); rect(g, '#ffffffcc', ex + S(3), ey + S(4), Math.max(1, S(2)), Math.max(1, S(2)));
      if (mood === 'annoyed') { rect(g, L.o, ex - S(11), ey - S(14), S(23), S(12)); rect(g, K, ex - S(10), ey - S(3), S(21), Math.max(1, S(2))); }
      if (mood === 'sniff') { rect(g, L.o, ex - S(11), ey - S(14), S(23), S(10)); rect(g, K, ex - S(10), ey - S(4), S(21), 1); }
    }
  }
  if (open) { ell(g, '#f58a9a', hx - S(32), hy + S(8), S(7), S(4)); ell(g, '#f58a9a', hx + S(32), hy + S(8), S(7), S(4)); }
  return { hx, hy };
}

// Misa's arm: a navy hoodie sleeve from the bottom-right edge to the hand, with a cuff and a 4-finger hand.
export function drawHand(g, x, y, t, wiggle = 0) {
  const hp = wiggle ? Math.sin(t * 20) * 1.5 : 0, ax = 330, ay = 240;
  const dx = x - ax, dy = y - ay, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
  for (let i = 0; i <= len; i += 2) { const px = ax + (dx * i) / len, py = ay + (dy * i) / len, w = 11 - (i / len) * 2; ell(g, K, px, py, w + 1, w + 1); }
  for (let i = 0; i <= len; i += 2) { const px = ax + (dx * i) / len, py = ay + (dy * i) / len, w = 10 - (i / len) * 2; ell(g, '#3d5a8c', px, py, w, w); ell(g, '#5f80b4', px + nx * 4, py + ny * 4, Math.max(1, w - 6), Math.max(1, w - 6)); }
  const cx = x + (ax - x) * (16 / len), cy = y + (ay - y) * (16 / len);
  ell(g, K, cx, cy, 10, 10); ell(g, '#2c4270', cx, cy, 9, 9); ell(g, '#5f80b4', cx - 1, cy - 1, 6, 6);
  ell(g, K, x + hp, y, 11, 9); ell(g, '#f8d5b8', x + hp, y, 10, 8); ell(g, '#e3a98a', x + hp + 3, y + 3, 6, 4);
  for (let i = 0; i < 4; i++) { const fx = x + hp - 8 + i * 5, fy = y - 8 - (i === 1 || i === 2 ? 2 : 0); ell(g, K, fx, fy, 4, 5); ell(g, '#f8d5b8', fx, fy, 3, 4); rect(g, '#fff0e2', fx - 1, fy - 3, 1, 1); }
}
// Cozy close-up room behind every cat screen.
export function drawRoom(g, warm = true) {
  rect(g, warm ? '#f6e2c8' : '#e8dcc8', 0, 0, 320, 224); rect(g, '#e8c9a6', 0, 150, 320, 74);
  for (let x = 0; x < 320; x += 40) rect(g, '#dcb894', x, 150, 1, 74);
  rect(g, '#d0a87c', 0, 150, 320, 2);
  rect(g, '#7a4f3a', 18, 38, 54, 64); rect(g, '#bfe6f5', 22, 42, 46, 56); rect(g, '#effaff', 24, 44, 20, 8); rect(g, '#7a4f3a', 44, 42, 2, 56); rect(g, '#7a4f3a', 22, 68, 46, 2);
  rect(g, '#86cdb0', 16, 36, 10, 70); rect(g, '#5eaa92', 22, 36, 2, 70);
}
export function hud(g, title, msg) {
  rect(g, '#2b1d2ee8', 0, 0, 320, 18); drawText(g, title, 8, 6, '#fffaf0');
  if (msg) { rect(g, '#2b1d2ecc', 0, 202, 320, 22); drawTextC(g, msg, 160, 210, '#fff8e8', 1, null); }
}

const CX = 160;
const DONE = { x: 240, y: 4, w: 74, h: 11 };

export class PetGame {
  constructor(rng) {
    Object.assign(this, { rng, t: 0, affection: 0, stroke: 0, annoyT: 0, overT: 0, done: false, score: 0, hearts: [], purrT: 0, msg: 'Hold the mouse, a finger or Space and stroke slowly', zone: null, lean: 0, petting: false, earT: 3, title: 'Pet Mochi' });
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
        if (this.overT > 0.7) { this.annoyT = 1.6; this.overT = 0; this.affection = Math.max(0, this.affection - 0.06); this.msg = 'Too fast! Gentle strokes, please'; sfx('wrong'); }
      } else {
        this.overT = Math.max(0, this.overT - dt);
        const rate = { chin: 0.2, head: 0.14, body: 0.09 }[this.zone];
        const before = this.affection;
        this.affection = Math.min(1, this.affection + dt * rate);
        this.stroke = Math.min(1, this.stroke + dt * 4);
        this.msg = this.zone === 'chin' ? 'Mmm... right under the chin!' : this.zone === 'head' ? 'Head pats are the best' : 'A nice long back rub';
        if (this.rng() < dt * (4 + this.stroke * 6)) this.hearts.push({ x: this.cur.x + range(this.rng, -14, 14), y: this.cur.y - 10, life: 1.4, s: this.rng() < 0.3 ? 1 : 0 });
        if (before < 0.5 && this.affection >= 0.5) { sfx('meow'); this.msg = 'Mochi is starting to purr'; }
        if (before < 1 && this.affection >= 1) { sfx('chime'); this.msg = 'Mochi loves you! Press done when ready'; }
      }
    } else this.stroke = Math.max(0, this.stroke - dt * 1.5);
    this.purrT -= dt;
    if (this.stroke > 0.3 && this.purrT <= 0) { sfx('purr'); this.purrT = 0.32; }
    for (const h of this.hearts) { h.y -= 22 * dt; h.life -= dt; }
    this.hearts = this.hearts.filter((h) => h.life > 0);
    const want = this.stroke > 0.2 ? clamp((this.cur.x - CX) * 0.08, -6, 6) : 0;
    this.lean += (want - this.lean) * Math.min(1, dt * 6);
    if (this.earT < -0.1) this.earT = range(this.rng, 3, 7);
    this.score = this.affection;
  }
  finish() { this.done = true; this.score = this.affection; }
  get mood() { return this.annoyT > 0 ? 'annoyed' : this.affection >= 1 ? 'full' : this.stroke > 0.2 ? 'happy' : 'idle'; }

  draw(g, sprite) {
    const t = this.t, mood = this.mood;
    drawRoom(g);
    ell(g, '#2a1a4033', CX, 198, 78, 10); blob(g, '#e0707a', CX, 192, 72, 12, '#bd5460'); ell(g, '#f08a94', CX, 187, 60, 6);
    const { hx, hy } = drawCat(g, CX, 192, { t, mood, lean: this.lean, stroke: this.stroke, twitch: this.earT < 0.18 && this.earT > 0, look: [clamp((this.cur.x - CX) / 30, -1, 1), clamp((this.cur.y - 96) / 30, -1, 1)] });
    if (mood === 'full') g.drawImage(sprite('zzz'), hx + 46, hy - 40 + Math.round(Math.sin(t * 2) * 2));
    for (const h of this.hearts) { g.globalAlpha = Math.min(1, h.life); g.drawImage(sprite('heart'), Math.round(h.x), Math.round(h.y)); if (h.s) g.drawImage(sprite('heart'), Math.round(h.x) + 5, Math.round(h.y) - 6); }
    g.globalAlpha = 1;
    drawHand(g, this.cur.x, this.cur.y, t, this.stroke > 0.1);
    hud(g, 'Pet Mochi', this.msg);
    for (let i = 0; i < 5; i++) { g.globalAlpha = this.affection >= (i + 0.5) / 5 ? 1 : 0.3; g.drawImage(sprite('heart'), 82 + i * 10, 6); }
    g.globalAlpha = 1;
    rect(g, '#5a3a86', 140, 7, 90, 5); rect(g, this.affection >= 1 ? '#ffd76a' : '#f0a0b8', 141, 8, Math.round(88 * this.affection), 3);
    rect(g, '#fff6e6', DONE.x - 1, DONE.y - 1, DONE.w + 2, DONE.h + 2); rect(g, this.affection >= 1 ? '#ffd76a' : '#86cdb0', DONE.x, DONE.y, DONE.w, DONE.h);
    drawTextC(g, 'Done (Esc)', DONE.x + DONE.w / 2, DONE.y + 3, '#2b1d2e', 1, null);
  }
}
