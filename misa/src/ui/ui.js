// Tiny UI kit for the 320x224 canvas. Everything works with keyboard (arrows/WASD, Enter/Space/E, Esc)
// and mouse (hover + click). Colours come from UI so screens look consistent.
import { drawText, drawTextC, measure, wrap, CHAR_W } from '../font.js';

export const UI = {
  ink: '#2b1d2e', ink2: '#3b2a40', paper: '#fff6e6', paper2: '#f3e2c7', line: '#c9a98a',
  accent: '#e0707a', accent2: '#bd5460', gold: '#ffd76a', mint: '#86cdb0', sky: '#7fb2e0', dim: '#8f7d8f',
  text: '#fff8e8', textDark: '#3a2a30', good: '#79c26a', bad: '#e0605a',
};
export { drawText, drawTextC, measure, wrap, CHAR_W };

export const rect = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
export const inside = (mx, my, x, y, w, h) => mx >= x && my >= y && mx < x + w && my < y + h;

// Rounded pixel panel. style: 'dark' (dialogue/HUD) or 'paper' (menus).
export function panel(g, x, y, w, h, style = 'paper') {
  const dark = style === 'dark';
  const fill = dark ? '#2b1d2ee8' : UI.paper, edge = dark ? UI.paper : UI.ink, shade = dark ? '#00000000' : UI.paper2;
  rect(g, edge, x + 1, y, w - 2, h); rect(g, edge, x, y + 1, w, h - 2);
  rect(g, fill, x + 1, y + 1, w - 2, h - 2);
  if (!dark) { rect(g, shade, x + 2, y + h - 4, w - 4, 2); rect(g, '#ffffff', x + 2, y + 2, w - 4, 1); }
}
export function label(g, text, x, y, color = UI.text, bg = UI.accent) {
  const w = measure(text) + 6;
  rect(g, bg, x, y, w, 9); drawText(g, text, x + 3, y + 2, color, 1, null);
  return w;
}
export function bar(g, x, y, w, h, v, color = UI.mint, back = '#5a3a86') {
  rect(g, UI.ink, x - 1, y - 1, w + 2, h + 2); rect(g, back, x, y, w, h); rect(g, color, x, y, Math.round(w * Math.max(0, Math.min(1, v))), h);
}

// Button: returns true when clicked (or activated with keyboard if focused).
export function button(g, input, x, y, w, h, text, { focused = false, disabled = false } = {}) {
  const hover = !disabled && inside(input.mx, input.my, x, y, w, h);
  const on = hover || focused;
  rect(g, UI.ink, x, y, w, h);
  rect(g, disabled ? '#9a8a90' : on ? UI.gold : UI.mint, x + 1, y + 1, w - 2, h - 2);
  if (!disabled) rect(g, '#ffffff66', x + 1, y + 1, w - 2, 1);
  drawTextC(g, text, x + w / 2, y + Math.floor(h / 2) - 2, UI.ink, 1, null);
  return !disabled && ((hover && input.justDown) || (focused && (input.pressed.has('enter') || input.pressed.has(' ') || input.pressed.has('e'))));
}

// Vertical list with keyboard/mouse selection and scrolling.
export class List {
  constructor(items = [], rows = 8, rowH = 10) { Object.assign(this, { items, sel: 0, top: 0, rows, rowH }); }
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
    if (input.wheel) { this.top = Math.max(0, Math.min(Math.max(0, n - this.rows), this.top + Math.sign(input.wheel))); }
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
      if (i === this.sel) rect(g, '#ffd76a88', x, yy, w, this.rowH);
      renderRow(g, it, x, yy, i === this.sel, i);
    }
    if (this.items.length > this.rows) {
      const th = Math.max(6, (this.rows / this.items.length) * this.rows * this.rowH), ty = y + (this.top / this.items.length) * this.rows * this.rowH;
      rect(g, UI.line, x + w - 2, y, 2, this.rows * this.rowH); rect(g, UI.ink, x + w - 2, ty, 2, th);
    }
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
    if (input.justDown && inside(input.mx, input.my, x, y, w, 12)) this.i = Math.min(n - 1, Math.floor((input.mx - x) / tw));
  }
  draw(g, x, y, w, labels = this.names) {
    const n = this.names.length, tw = w / n;
    labels.forEach((t, i) => {
      const xx = Math.round(x + i * tw), on = i === this.i;
      rect(g, UI.ink, xx, y, Math.round(tw) - 1, 12);
      rect(g, on ? UI.paper : UI.line, xx + 1, y + 1, Math.round(tw) - 3, on ? 11 : 10);
      drawTextC(g, t, xx + tw / 2 - 1, y + 4, on ? UI.ink : UI.ink2, 1, null);
    });
  }
}

export function tooltip(g, text, x, y) {
  const lines = wrap(text, 34), w = Math.max(...lines.map((l) => measure(l))) + 8, h = lines.length * 7 + 6;
  const tx = Math.max(2, Math.min(318 - w, x)), ty = Math.max(2, Math.min(222 - h, y));
  panel(g, tx, ty, w, h, 'dark');
  lines.forEach((l, i) => drawText(g, l, tx + 4, ty + 4 + i * 7, UI.text));
}
