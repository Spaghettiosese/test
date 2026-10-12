// Shared pieces for the part-time job minigames (economy area): focusable buttons with mouse + keyboard
// navigation, a top bar, customers drawn as palette-swapped townsfolk, and bot helpers.
import { drawChar } from '../../gfx/chars.js';
import { get } from '../../core/registry.js';
import { rect, disc, panel, btn, icon, drawText, drawTextC, measure, inside, K, C, RAMPS, fit, wrapPx, starGlyph } from '../../content/economy/gfx.js';

export { rect, disc, panel, btn, icon, drawText, drawTextC, measure, inside, K, C, RAMPS, fit, wrapPx, starGlyph };
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Focusable buttons: hover/click with the mouse, arrows/WASD move focus spatially, Space/Enter/E presses.
export class Buttons {
  constructor() { this.list = []; this.focus = null; }
  set(list) { this.list = list; if (!list.some((b) => b.id === this.focus && !b.disabled)) { const f = list.find((b) => !b.disabled); this.focus = f ? f.id : null; } }
  get(id) { return this.list.find((b) => b.id === id); }
  update(input) {
    let hit = null;
    for (const b of this.list) if (!b.disabled && inside(input.mx, input.my, b.x, b.y, b.w, b.h)) hit = b;
    if (hit && (input.moved || input.justDown)) this.focus = hit.id;
    if (hit && input.justDown) return hit.id;
    const dirs = [[K.left, -1, 0], [K.right, 1, 0], [K.up, 0, -1], [K.down, 0, 1]];
    const cur = this.get(this.focus);
    for (const [f, dx, dy] of dirs) {
      if (!f(input)) continue;
      if (!cur) { this.set(this.list); break; }
      const cx = cur.x + cur.w / 2, cy = cur.y + cur.h / 2;
      let best = null, bs = Infinity;
      for (const b of this.list) {
        if (b === cur || b.disabled) continue;
        const ox = b.x + b.w / 2 - cx, oy = b.y + b.h / 2 - cy, along = ox * dx + oy * dy;
        if (along <= 2) continue;
        const s = along + Math.abs(dx ? oy : ox) * 2.5;
        if (s < bs) { bs = s; best = b; }
      }
      if (best) this.focus = best.id;
    }
    if (!input.justDown && K.ok(input) && cur && !cur.disabled) return cur.id;
    return null;
  }
  isFocus(id) { return this.focus === id; }
}
// A bot "clicks" a button: input with the pointer on its centre.
export const clickAt = (input, x, y) => Object.assign(input, { mx: x, my: y, moved: true, justDown: true, down: true });
export const clickBtn = (input, b) => (b ? clickAt(input, b.x + b.w / 2, b.y + b.h / 2) : input);

// Top bar shared by all job minigames.
export function topBar(g, title, info, prog = null) {
  rect(g, C.night, 0, 0, 320, 18); rect(g, C.deep, 0, 18, 320, 1);
  drawText(g, title, 8, 6, C.gold, 1, null);
  if (info) drawText(g, info, (prog === null ? 312 : 214) - measure(info), 6, C.text, 1, null);
  if (prog !== null) { rect(g, C.deep, 220, 6, 92, 7); rect(g, '#5a3a86', 221, 7, 90, 5); rect(g, C.mint, 221, 7, Math.round(90 * clamp(prog, 0, 1)), 5); }
}
export function hint(g, text) { rect(g, 'rgba(30,22,36,.75)', 0, 213, 320, 11); drawTextC(g, text, 160, 216, '#fff6c0', 1, null); }
export const itemDraw = (g, id, cx, cy) => icon(g, itemSprite(id), cx, cy);
export const itemSprite = (id) => { const it = get('item', id); return it ? it.icon : null; };

// Townsfolk looks for customers (palette swaps of Misa's sheet, as the engine does for NPCs without art).
export const LOOKS = [
  { hair: '#24203a', top: '#e0707a', bottom: '#2a3552', skin: '#f8d5b8' }, { hair: '#e8c56a', top: '#7fb2e0', bottom: '#3a3850', skin: '#f8d5b8' },
  { hair: '#5a3a2e', top: '#86cdb0', bottom: '#4a2e2a', skin: '#d6a07c' }, { hair: '#c8c8dc', top: '#9474e0', bottom: '#262436', skin: '#f2c9a4' },
  { hair: '#d9763f', top: '#ffd76a', bottom: '#2f5f40', skin: '#f8d5b8' }, { hair: '#38334f', top: '#f4e4c1', bottom: '#7a4f3a', skin: '#c68a62' },
  { hair: '#8b5a44', top: '#4f8a58', bottom: '#1f2840', skin: '#f2c9a4' }, { hair: '#ff85b8', top: '#3a3850', bottom: '#5f80b4', skin: '#f8d5b8' },
];
export function drawPerson(g, idx, x, y, t, mood = 'idle') {
  const look = LOOKS[idx % LOOKS.length];
  const bob = mood === 'happy' ? -Math.abs(Math.round(Math.sin(t * 10) * 2)) : 0;
  drawChar(g, 'econ_cust_' + (idx % LOOKS.length), look, 'down', 'idle', t + idx, x, y + bob, 1, idx);
}
// Little emote bubbles over customers.
export function emote(g, x, y, kind) {
  panel(g, x - 7, y - 7, 14, 13, 'card');
  if (kind === 'heart') { rect(g, C.coral, x - 4, y - 3, 3, 3); rect(g, C.coral, x + 1, y - 3, 3, 3); rect(g, C.coral, x - 4, y - 1, 8, 2); rect(g, C.coral, x - 3, y + 1, 6, 1); rect(g, C.coral, x - 2, y + 2, 4, 1); rect(g, C.coral, x - 1, y + 3, 2, 1); }
  else if (kind === 'sweat') { rect(g, C.sky, x - 1, y - 3, 2, 2); rect(g, C.sky, x - 2, y - 1, 4, 3); rect(g, C.sky, x - 1, y + 2, 2, 1); }
  else if (kind === 'note') { rect(g, C.ink, x + 1, y - 4, 1, 6); rect(g, C.ink, x + 2, y - 4, 2, 1); disc(g, C.ink, x - 1, y + 2, 2); }
  else { rect(g, C.gold, x - 1, y - 4, 2, 5); rect(g, C.gold, x - 1, y + 2, 2, 2); }
}
// Floating text popups ("+12", "Perfect!").
export class Pops {
  constructor() { this.list = []; }
  add(text, x, y, color = C.gold) { this.list.push({ text, x, y, color, t: 0 }); }
  update(dt) { this.list = this.list.filter((p) => (p.t += dt) < 1.1); }
  draw(g) { for (const p of this.list) drawTextC(g, p.text, p.x, Math.round(p.y - p.t * 14), p.color, 1, C.deep); }
}
// Common end: time-based score helper.
export const timeScore = (t, par, slack) => clamp(1 - (t - par) / slack, 0.4, 1);
