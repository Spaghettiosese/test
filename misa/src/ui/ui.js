// UI kit for the 320x224 canvas (ART.md 2.8). Everything works with keyboard (arrows/WASD, Enter/Space/E, Esc)
// and mouse (hover + click). Colours come from the master palette so every screen looks consistent.
//
//   panel(g, x, y, w, h, style)   procedural 9-slice: 'paper' (menus), 'dark' / 'night' (dialogue, toasts), 'phone', 'butter'
//   label(g, text, x, y, color?, bg?) -> width          bar(g, x, y, w, h, v, color?, back?)
//   button(g, input, x, y, w, h, text, { focused, disabled, icon }) -> true when activated
//   List (vertical, scrolling), Tabs (horizontal), tooltip(g, text, x, y), inside(mx, my, x, y, w, h), rect(g, c, x, y, w, h)
//   icon(g, spriteName, x, y) / iconC(g, name, cx, cy)   keycap(g, key, x, y) -> width   paw(g, x, y)   dim(g)  (50% Bayer)
//   hearts(g, x, y, n, of?)  check(g, x, y, on)  toggle(g, x, y, on)  slider(g, x, y, w, v)  scrollbar(g, x, y, h, top, rows, n)
import { drawText, drawTextC, drawTextR, measure, wrap, wrapPx, CHAR_W, LINE_H, drawSmall, drawSmallC, measureSmall } from '../font.js';
import { RAMPS, INK } from '../gfx/palette.js';
import { SPRITES } from '../art.js';
import { sprite } from '../artcache.js';

const P = RAMPS;
export const UI = {
  ink: INK, ink2: P.ink[2], night: '#2b1d2e', paper: P.paper[3], paper2: P.paper[2], paperHi: P.paper[4], line: P.paper[1],
  accent: P.coral[2], accent2: P.coral[1], gold: P.butter[2], butter: P.butter[3], mint: P.mint[2], sky: P.sky[2], dim: P.ink[3],
  text: '#fff8e8', textDark: '#3a2a30', good: P.forest[2], bad: P.ribbon[2], muted: P.paper[0], shadow: 'rgba(30,22,36,.5)',
  season: 'spring', reduceMotion: false, colorblind: false,
};
const BASE = { good: UI.good, bad: UI.bad };
// Colour-blind friendly accents: swap the green/red pair for blue/orange (every cue also keeps a shape).
export function setUIOptions(o) {
  Object.assign(UI, o);
  if (UI.colorblind) { UI.good = P.sky[1]; UI.bad = P.vermilion[3]; } else Object.assign(UI, BASE);
}
export { drawText, drawTextC, drawTextR, measure, wrap, wrapPx, CHAR_W, LINE_H, drawSmall, drawSmallC, measureSmall };

export const rect = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
export const inside = (mx, my, x, y, w, h) => mx >= x && my >= y && mx < x + w && my < y + h;

const STYLES = {
  paper: { ink: INK, fill: P.paper[3], hi: P.paper[4], lo: P.paper[2] },
  dark: { ink: '#1e1624', fill: 'rgba(43,29,46,.94)', hi: P.paper[3], lo: '#4a3348' },
  phone: { ink: '#1e1624', fill: P.charcoal[1], hi: P.charcoal[2], lo: P.charcoal[0] },
  butter: { ink: INK, fill: P.butter[3], hi: P.butter[4], lo: P.butter[2] },
  mint: { ink: INK, fill: P.mint[3], hi: P.mint[4], lo: P.mint[2] },
};
STYLES.night = STYLES.dark;
// Procedural 9-slice panel with cut corners, a 1 px bevel and a drop shadow (ART.md 3.11).
export function panel(g, x, y, w, h, style = 'paper', { shadow = true, accent = true } = {}) {
  const s = STYLES[style] || STYLES.paper;
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  if (shadow) { rect(g, UI.shadow, x + 1, y + h, w - 1, 1); rect(g, UI.shadow, x + w, y + 1, 1, h - 1); }
  rect(g, s.ink, x + 1, y, w - 2, 1); rect(g, s.ink, x + 1, y + h - 1, w - 2, 1);
  rect(g, s.ink, x, y + 1, 1, h - 2); rect(g, s.ink, x + w - 1, y + 1, 1, h - 2);
  rect(g, s.fill, x + 1, y + 1, w - 2, h - 2);
  if (style === 'dark' || style === 'night') { rect(g, s.hi, x + 2, y + 1, w - 4, 1); return; }
  rect(g, s.hi, x + 1, y + 1, w - 2, 1); rect(g, s.hi, x + 1, y + 1, 1, h - 2);
  rect(g, s.lo, x + 1, y + h - 2, w - 2, 1); rect(g, s.lo, x + w - 2, y + 2, 1, h - 3);
  if (style === 'paper' && accent && w >= 60 && h >= 24) seasonAccent(g, x, y, w);
}
// Seasonal panel accents: petals in spring, a leaf in autumn, snow caps in winter, a sprig in summer.
function seasonAccent(g, x, y, w) {
  const s = UI.season;
  if (s === 'spring') { rect(g, P.sakura[2], x + w - 9, y - 1, 3, 2); rect(g, P.sakura[3], x + w - 8, y - 2, 1, 1); rect(g, P.sakura[1], x + w - 6, y + 2, 2, 1); }
  else if (s === 'winter') { rect(g, '#ffffff', x + 3, y - 1, w - 6, 1); rect(g, '#ffffff', x + 6, y - 2, 10, 1); rect(g, '#ffffff', x + w - 20, y - 2, 7, 1); rect(g, P.snow[2], x + 3, y, w - 6, 1); }
  else if (s === 'autumn') { rect(g, P.leafAutumn[2], x + w - 9, y - 1, 3, 2); rect(g, P.leafAutumn[1], x + w - 7, y + 1, 2, 1); }
  else { rect(g, P.forest[3], x + w - 9, y - 1, 2, 2); rect(g, P.forest[2], x + w - 7, y, 2, 1); }
}

export function label(g, text, x, y, color = UI.text, bg = UI.accent) {
  const w = measure(text) + 6;
  rect(g, bg, x, y, w, 11); drawText(g, text, x + 3, y + 2, color, 1, null);
  return w;
}
export function bar(g, x, y, w, h, v, color = UI.mint, back = P.ink[2]) {
  rect(g, UI.ink, x - 1, y - 1, w + 2, h + 2); rect(g, back, x, y, w, h);
  const fw = Math.round(w * Math.max(0, Math.min(1, v)));
  rect(g, color, x, y, fw, h);
  if (h > 2 && fw > 1) rect(g, 'rgba(255,255,255,.35)', x, y, fw, 1);
}
export function icon(g, name, x, y) { if (name && SPRITES[name]) { g.drawImage(sprite(name), Math.round(x), Math.round(y)); return true; } return false; }
export function iconC(g, name, cx, cy) { const d = SPRITES[name]; if (!d) return false; g.drawImage(sprite(name), Math.round(cx - d.w / 2), Math.round(cy - d.h / 2)); return true; }
export const spriteSize = (name) => (SPRITES[name] ? [SPRITES[name].w, SPRITES[name].h] : [0, 0]);

// A 9x9 keycap glyph with a letter (E, Q...). Returns its width.
export function keycap(g, key, x, y, color = UI.paper) {
  const k = String(key).toUpperCase(), w = Math.max(9, measureSmall(k) + 5);
  rect(g, UI.ink, x + 1, y, w - 2, 9); rect(g, UI.ink, x, y + 1, w, 7);
  rect(g, color, x + 1, y + 1, w - 2, 6); rect(g, P.paper[1], x + 1, y + 7, w - 2, 1);
  drawSmallC(g, k, x + w / 2, y + 2, UI.ink);
  return w;
}
// 7x7 paw cursor.
export function paw(g, x, y, c = P.coral[2]) {
  rect(g, UI.ink, x + 1, y + 2, 5, 5); rect(g, c, x + 2, y + 3, 3, 3);
  rect(g, c, x, y + 1, 1, 2); rect(g, c, x + 2, y, 1, 2); rect(g, c, x + 4, y, 1, 2); rect(g, c, x + 6, y + 1, 1, 2);
}
// Cached 50% Bayer dim of #1e1624 (no alpha), used behind menus.
let dimPat = null;
export function dim(g, level = 2) {
  if (typeof document === 'undefined' || !g.createPattern) { rect(g, 'rgba(30,22,36,.5)', 0, 0, 320, 224); return; }
  if (!dimPat || dimPat.g !== g) {
    const c = document.createElement('canvas'); c.width = 2; c.height = 2; const x = c.getContext('2d');
    x.fillStyle = '#1e1624'; x.fillRect(0, 0, 1, 1); x.fillRect(1, 1, 1, 1);
    dimPat = { g, p: g.createPattern(c, 'repeat') };
  }
  g.fillStyle = dimPat.p; g.fillRect(0, 0, 320, 224);
  if (level > 2) rect(g, 'rgba(30,22,36,.35)', 0, 0, 320, 224);
}
// 5x5 hearts (full / empty).
export function hearts(g, x, y, n, of = 10, gap = 6) {
  for (let i = 0; i < of; i++) {
    const c = i < n ? P.coral[2] : P.paper[1], hx = x + i * gap;
    rect(g, c, hx, y, 2, 1); rect(g, c, hx + 3, y, 2, 1); rect(g, c, hx, y + 1, 5, 2); rect(g, c, hx + 1, y + 3, 3, 1); rect(g, c, hx + 2, y + 4, 1, 1);
    if (i < n) rect(g, P.coral[4], hx + 1, y + 1, 1, 1);
  }
}
// Checkbox: a tick (good) or an empty box (shape cue, not only colour).
export function check(g, x, y, on) {
  rect(g, UI.ink, x, y, 7, 7); rect(g, on ? P.mint[3] : UI.paperHi, x + 1, y + 1, 5, 5);
  if (on) { rect(g, UI.ink, x + 1, y + 3, 1, 1); rect(g, UI.ink, x + 2, y + 4, 1, 1); rect(g, UI.ink, x + 3, y + 3, 1, 1); rect(g, UI.ink, x + 4, y + 2, 1, 1); rect(g, UI.ink, x + 5, y + 1, 1, 1); }
}
// On/off pill (16x8) with a text cue.
export function toggle(g, x, y, on) {
  rect(g, UI.ink, x + 1, y, 18, 9); rect(g, UI.ink, x, y + 1, 20, 7);
  rect(g, on ? P.mint[2] : P.paper[1], x + 1, y + 1, 18, 7);
  rect(g, UI.paperHi, on ? x + 11 : x + 2, y + 2, 7, 5);
  drawSmall(g, on ? 'ON' : '', x + 3, y + 2, UI.ink);
  if (!on) drawSmall(g, 'OFF', x + 10 - 1, y + 2, P.ink[2]);
}
export function slider(g, x, y, w, v) {
  rect(g, UI.ink, x, y + 3, w, 3); rect(g, P.paper[1], x + 1, y + 4, w - 2, 1);
  const fx = x + Math.round((w - 6) * Math.max(0, Math.min(1, v)));
  rect(g, P.coral[2], x + 1, y + 4, fx - x, 1);
  rect(g, UI.ink, fx, y, 6, 9); rect(g, P.butter[3], fx + 1, y + 1, 4, 7);
}
export function scrollbar(g, x, y, h, top, rows, n) {
  if (n <= rows) return;
  rect(g, P.paper[2], x, y, 3, h);
  const th = Math.max(6, Math.round((rows / n) * h)), ty = y + Math.round((top / Math.max(1, n - rows)) * (h - th));
  rect(g, P.ink[2], x, ty, 3, th);
}

// Button: returns true when clicked (or activated with keyboard if focused). Paper style with hover/pressed/disabled/focus.
export function button(g, input, x, y, w, h, text, { focused = false, disabled = false, icon: ic = null, style = 'paper' } = {}) {
  const hover = !disabled && input && inside(input.mx, input.my, x, y, w, h);
  const pressed = hover && input.down;
  const on = hover || focused;
  const dy = pressed ? 1 : on ? 0 : 0;
  if (!pressed) rect(g, UI.shadow, x + 1, y + h, w - 1, 1);
  rect(g, UI.ink, x + 1, y + dy, w - 2, h); rect(g, UI.ink, x, y + 1 + dy, w, h - 2);
  const fill = disabled ? P.paper[1] : pressed ? P.paper[2] : on ? P.butter[3] : style === 'mint' ? P.mint[3] : P.paper[3];
  rect(g, fill, x + 1, y + 1 + dy, w - 2, h - 2);
  if (!disabled && !pressed) rect(g, on ? P.butter[4] : P.paper[4], x + 1, y + 1 + dy, w - 2, 1);
  const tw = measure(text) + (ic ? 12 : 0), tx = Math.round(x + w / 2 - tw / 2), ty = y + Math.floor((h - 7) / 2) + dy - (on && !pressed ? 1 : 0);
  if (ic) iconC(g, ic, tx + 4, ty + 3);
  drawText(g, text, tx + (ic ? 12 : 0), ty, disabled ? P.ink[3] : UI.ink, 1, null);
  if (focused && !disabled) {
    // marching dashed gold border
    const t = Math.floor(((typeof performance !== 'undefined' ? performance.now() : 0) / 120)) % 4;
    g.fillStyle = P.butter[1];
    for (let i = 0; i < w + 2; i++) if ((i + t) % 4 < 2) { g.fillRect(x - 1 + i, y - 2 + dy, 1, 1); g.fillRect(x + w - i, y + h + 1 + dy, 1, 1); }
    for (let i = 0; i < h + 2; i++) if ((i + t) % 4 < 2) { g.fillRect(x + w + 1, y - 1 + i + dy, 1, 1); g.fillRect(x - 2, y + h - i + dy, 1, 1); }
  }
  return !disabled && ((hover && input.justDown) || (focused && input && (input.pressed.has('enter') || input.pressed.has(' ') || input.pressed.has('e'))));
}

// Vertical list with keyboard/mouse selection and scrolling.
export class List {
  constructor(items = [], rows = 8, rowH = 11) { Object.assign(this, { items, sel: 0, top: 0, rows, rowH }); }
  set(items) { this.items = items; this.sel = Math.min(this.sel, Math.max(0, items.length - 1)); this.fix(); }
  fix() { if (this.sel < this.top) this.top = this.sel; if (this.sel >= this.top + this.rows) this.top = this.sel - this.rows + 1; this.top = Math.max(0, Math.min(this.top, Math.max(0, this.items.length - this.rows))); }
  get current() { return this.items[this.sel]; }
  // returns the picked item on Enter/click, else null
  update(input, x, y, w) {
    const n = this.items.length;
    if (!n) return null;
    const k = input.pressed;
    if (k.has('arrowdown') || k.has('s')) { this.sel = (this.sel + 1) % n; this.fix(); }
    if (k.has('arrowup') || k.has('w')) { this.sel = (this.sel + n - 1) % n; this.fix(); }
    if (input.wheel && inside(input.mx, input.my, x, y, w, this.rows * this.rowH)) { this.top = Math.max(0, Math.min(Math.max(0, n - this.rows), this.top + Math.sign(input.wheel))); }
    const i = Math.floor((input.my - y) / this.rowH) + this.top;
    const over = inside(input.mx, input.my, x, y, w, this.rows * this.rowH) && i >= 0 && i < n;
    if (over && (input.moved || input.justDown)) this.sel = i;
    if ((over && input.justDown) || k.has('enter') || k.has(' ') || k.has('e')) return this.items[this.sel];
    return null;
  }
  draw(g, x, y, w, renderRow) {
    for (let r = 0; r < this.rows; r++) {
      const i = this.top + r, it = this.items[i];
      if (it === undefined) break;
      const yy = y + r * this.rowH;
      if (i === this.sel) { rect(g, P.butter[3], x, yy, w - 4, this.rowH); rect(g, P.butter[2], x, yy + this.rowH - 1, w - 4, 1); }
      renderRow(g, it, x, yy, i === this.sel, i);
    }
    scrollbar(g, x + w - 3, y, this.rows * this.rowH, this.top, this.rows, this.items.length);
  }
}

// Horizontal tabs. Q/E or [ ] or Tab cycle; click selects.
export class Tabs {
  constructor(names) { this.names = names; this.i = 0; }
  get name() { return this.names[this.i]; }
  update(input, x, y, w) {
    const k = input.pressed, n = this.names.length;
    if (k.has('q') || k.has('[')) this.i = (this.i + n - 1) % n;
    if (k.has('tab') || k.has(']') || k.has('r')) this.i = (this.i + 1) % n;
    const tw = w / n;
    if (input.justDown && inside(input.mx, input.my, x, y, w, 13)) this.i = Math.min(n - 1, Math.floor((input.mx - x) / tw));
  }
  draw(g, x, y, w, labels = this.names) {
    const n = this.names.length, tw = w / n;
    labels.forEach((t, i) => {
      const xx = Math.round(x + i * tw), on = i === this.i, ww = Math.round(tw) - 1;
      rect(g, UI.ink, xx + 1, y, ww - 2, 13); rect(g, UI.ink, xx, y + 1, ww, 12);
      rect(g, on ? P.paper[3] : P.paper[1], xx + 1, y + 1, ww - 2, on ? 12 : 11);
      if (on) rect(g, P.coral[2], xx + 2, y + 1, ww - 4, 1);
      drawTextC(g, t, xx + ww / 2, y + 3, on ? UI.ink : P.ink[2], 1, null);
    });
  }
}

export function tooltip(g, text, x, y) {
  const lines = wrapPx(text, 150), w = Math.max(...lines.map((l) => measure(l))) + 10, h = lines.length * 10 + 6;
  const tx = Math.round(Math.max(2, Math.min(318 - w, x))), ty = Math.round(Math.max(2, Math.min(222 - h, y)));
  panel(g, tx, ty, w, h, 'dark');
  lines.forEach((l, i) => drawText(g, l, tx + 5, ty + 4 + i * 10, UI.text));
}
