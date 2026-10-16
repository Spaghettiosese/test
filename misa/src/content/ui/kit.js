// Shared helpers for the ui content area: tap-friendly buttons (>= 16 canvas px tall) and a mood/energy mini-bar.
import { UI, rect, inside, button, drawText } from '../../ui/ui.js';

// Draw a button (hover/pressed look from ui.button) and return true if it was tapped/clicked this frame.
export function tap(g, game, x, y, w, h, text, opts = {}) {
  const input = game.input || { mx: -9, my: -9, down: false, justDown: false, pressed: new Set() };
  const noKeys = { ...input, pressed: new Set() }; // keyboard is handled by the caller
  button(g, noKeys, x, y, w, h, text, opts);
  return !opts.disabled && !!input.justDown && inside(input.mx, input.my, x, y, w, h);
}
// Hit test only (use in update()).
export const hit = (input, x, y, w, h) => !!input.justDown && inside(input.mx, input.my, x, y, w, h);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const stateOf = (game) => game.state.ui;
export function line(g, text, x, y, c = UI.ink) { drawText(g, text, x, y, c, 1, null); }
export { rect };
