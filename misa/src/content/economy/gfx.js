// Economy area: shared drawing helpers for the shop scene, the noticeboard, the job minigames and the phone apps.
// Everything is drawn with integer rects (no anti-aliasing) and palette colours from src/gfx/palette.js.
import { SPRITES } from '../../art.js';
import { sprite } from '../../artcache.js';
import { drawText, drawTextC, measure } from '../../font.js';
import { RAMPS, INK } from '../../gfx/palette.js';
import { UI } from '../../ui/ui.js';

export { drawText, drawTextC, measure, UI, RAMPS, INK };
export const C = {
  ink: INK, deep: '#1e1624', night: '#2b1d2e', paper: RAMPS.paper[3], paper2: RAMPS.paper[2], paper1: RAMPS.paper[1], paperHi: RAMPS.paper[4],
  gold: RAMPS.butter[2], goldL: RAMPS.butter[3], coral: RAMPS.coral[2], coralD: RAMPS.coral[1], mint: RAMPS.mint[2], mintD: RAMPS.mint[1],
  sky: RAMPS.sky[2], dim: RAMPS.paper[0], text: '#fff8e8', textDark: INK, good: RAMPS.forest[3], lilac: RAMPS.lilac[2],
};

export const rect = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
export const disc = (g, c, cx, cy, r) => { for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y) + 0.3); rect(g, c, cx - w, cy + y, w * 2 + 1, 1); } };
export const ring = (g, c, cx, cy, r, t = 1) => { for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y) + 0.3), ri = r - t, wi = Math.abs(y) <= ri ? Math.floor(Math.sqrt(ri * ri - y * y) + 0.3) : -1; if (wi < 0) rect(g, c, cx - w, cy + y, w * 2 + 1, 1); else { rect(g, c, cx - w, cy + y, w - wi, 1); rect(g, c, cx + wi + 1, cy + y, w - wi, 1); } } };
export const inside = (mx, my, x, y, w, h) => mx >= x && my >= y && mx < x + w && my < y + h;

// ART.md 3.11 panels: paper (menus, shop) and night (speech, toasts). Cut corners, bevel, 1 px drop shadow.
const STYLE = {
  paper: { ink: C.ink, fill: C.paper, hi: C.paperHi, lo: C.paper2, shadow: 'rgba(30,22,36,.5)' },
  night: { ink: C.deep, fill: 'rgba(43,29,46,.94)', hi: C.paper, lo: '#4a3348', shadow: 'rgba(30,22,36,.5)' },
  card: { ink: C.ink, fill: C.paperHi, hi: '#ffffff', lo: C.paper2, shadow: 'rgba(30,22,36,.35)' },
};
export function panel(g, x, y, w, h, s = 'paper') {
  s = typeof s === 'string' ? STYLE[s] : s;
  rect(g, s.shadow, x + 1, y + h, w - 1, 1); rect(g, s.shadow, x + w, y + 1, 1, h - 1);
  rect(g, s.ink, x + 1, y, w - 2, 1); rect(g, s.ink, x + 1, y + h - 1, w - 2, 1);
  rect(g, s.ink, x, y + 1, 1, h - 2); rect(g, s.ink, x + w - 1, y + 1, 1, h - 2);
  rect(g, s.fill, x + 1, y + 1, w - 2, h - 2);
  rect(g, s.hi, x + 1, y + 1, w - 2, 1); rect(g, s.hi, x + 1, y + 1, 1, h - 2);
  rect(g, s.lo, x + 1, y + h - 2, w - 2, 1); rect(g, s.lo, x + w - 2, y + 1, 1, h - 2);
}

// Kit buttons (ART.md 2.8): paper normal, butter hover, paper[2] pressed, paper[1] disabled; focus = gold dashes.
export function btn(g, x, y, w, h, text, { hover = false, focus = false, disabled = false, tone = 'paper', t = 0 } = {}) {
  const fill = disabled ? RAMPS.paper[1] : hover || focus ? RAMPS.butter[3] : tone === 'mint' ? RAMPS.mint[3] : tone === 'coral' ? RAMPS.coral[3] : C.paper;
  rect(g, 'rgba(30,22,36,.5)', x + 1, y + h, w - 1, 1);
  rect(g, C.ink, x + 1, y, w - 2, h); rect(g, C.ink, x, y + 1, w, h - 2);
  rect(g, fill, x + 1, y + 1, w - 2, h - 2);
  if (!disabled) { rect(g, '#ffffff', x + 1, y + 1, w - 2, 1); rect(g, 'rgba(42,26,64,.18)', x + 1, y + h - 2, w - 2, 1); }
  const ty = y + Math.floor(h / 2) - 3 - (hover && !disabled ? 1 : 0);
  drawTextC(g, text, x + w / 2, ty, disabled ? RAMPS.ink[3] : C.ink, 1, null);
  if (focus && !disabled) dashes(g, x - 2, y - 2, w + 4, h + 4, t);
}
export function dashes(g, x, y, w, h, t = 0) {
  const off = Math.floor(t * 8) % 4;
  for (let i = -off; i < w; i += 4) { const a = Math.max(0, i), b = Math.min(w, i + 2); if (b > a) { rect(g, C.gold, x + a, y, b - a, 1); rect(g, C.gold, x + w - b, y + h - 1, b - a, 1); } }
  for (let i = -off; i < h; i += 4) { const a = Math.max(0, i), b = Math.min(h, i + 2); if (b > a) { rect(g, C.gold, x + w - 1, y + a, 1, b - a); rect(g, C.gold, x, y + h - b, 1, b - a); } }
}

// Draw a sprite (item icon) centred in a box, if it exists.
export function icon(g, name, cx, cy) {
  if (!name || !SPRITES[name]) return false;
  const s = SPRITES[name];
  g.drawImage(sprite(name), Math.round(cx - s.w / 2), Math.round(cy - s.h / 2));
  return true;
}
// A framed 20x20 slot with an item icon and an optional count.
export function slot(g, x, y, iconName, n, { sel = false, fill = C.paperHi } = {}) {
  rect(g, sel ? C.gold : C.paper1, x, y, 20, 20); rect(g, fill, x + 1, y + 1, 18, 18);
  icon(g, iconName, x + 10, y + 10);
  if (n > 1) { const s = String(n); drawText(g, s, x + 19 - measure(s), y + 14, C.ink, 1, C.paperHi); }
}

// Word wrap by pixel width (the font may become proportional; measure() always knows).
export function wrapPx(str, maxPx) {
  const out = []; let line = '';
  for (const w of String(str || '').split(' ')) {
    const tryLine = line ? line + ' ' + w : w;
    if (measure(tryLine) > maxPx && line) { out.push(line); line = w; } else line = tryLine;
  }
  if (line) out.push(line);
  return out;
}
export function fit(str, maxPx) {
  let s = String(str);
  if (measure(s) <= maxPx) return s;
  while (s.length > 1 && measure(s + '.') > maxPx) s = s.slice(0, -1);
  return s.trimEnd() + '.';
}
export const coins = (n) => `${n}c`;
// Small coin glyph (9x9) drawn in rects so it never depends on another area's sprite.
export function coinGlyph(g, x, y) {
  disc(g, RAMPS.butter[0], x + 4, y + 4, 4); disc(g, RAMPS.butter[2], x + 4, y + 4, 3); rect(g, RAMPS.butter[1], x + 4, y + 2, 2, 5); rect(g, RAMPS.butter[4], x + 3, y + 2, 1, 4);
}
export function starGlyph(g, x, y, c = RAMPS.butter[2]) {
  rect(g, c, x + 3, y, 1, 2); rect(g, c, x, y + 2, 7, 1); rect(g, c, x + 1, y + 3, 5, 1); rect(g, c, x + 2, y + 4, 3, 1); rect(g, c, x + 1, y + 5, 2, 1); rect(g, c, x + 4, y + 5, 2, 1); rect(g, c, x + 1, y + 6, 1, 1); rect(g, c, x + 5, y + 6, 1, 1);
}
// Scrollbar for lists.
export function scrollbar(g, x, y, h, top, rows, n) {
  if (n <= rows) return;
  rect(g, C.paper1, x, y, 2, h);
  const th = Math.max(6, Math.round(h * rows / n)), ty = y + Math.round((h - th) * top / Math.max(1, n - rows));
  rect(g, C.ink, x, ty, 2, th);
}
// Header strip used by full-screen economy scenes.
export function header(g, title, right = '') {
  rect(g, C.night, 0, 0, 320, 16); rect(g, C.deep, 0, 16, 320, 1);
  drawText(g, title, 8, 5, C.gold, 1, null);
  if (right) drawText(g, right, 312 - measure(right), 5, C.text, 1, null);
}
// Keyboard helpers shared by economy screens.
export const K = {
  up: (i) => i.pressed.has('arrowup') || i.pressed.has('w'),
  down: (i) => i.pressed.has('arrowdown') || i.pressed.has('s'),
  left: (i) => i.pressed.has('arrowleft') || i.pressed.has('a'),
  right: (i) => i.pressed.has('arrowright') || i.pressed.has('d'),
  ok: (i) => i.pressed.has('enter') || i.pressed.has(' ') || i.pressed.has('e'),
  back: (i) => i.pressed.has('escape') || i.pressed.has('backspace'),
};
