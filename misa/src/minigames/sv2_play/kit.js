// Shared bits for the three Hoshimori arcade cabinets (Star Runner, Mochi Kart, Kumo Quest).
// Every cabinet is an Arcade instance: attract screen -> play (lives, rising difficulty) -> game over -> done.
// Controls: arrows (or WASD) + E; or the pointer/touch (drag to steer, tap = action). Touch A maps to E.
// opts given by the cabinet interaction: { hs: [{n,s}], ghost, best } (high-score table, ghost run).
import { drawText, drawTextC } from '../../font.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { axis, act } from '../../input.js';
import { sfx } from '../../audio.js';

export const W = 320, H = 224;
export const rect = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
export const disc = (g, c, cx, cy, r) => { for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y) + 0.5); rect(g, c, cx - w, cy + y, w * 2 + 1, 1); } };
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const hash = (a, b = 0) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

// Direction from arrows/WASD, else toward the pointer while it is held (touch drag / mouse hold).
export function steer(input, px, py, dead = 5) {
  const a = axis(input);
  if (a.x || a.y) { const n = Math.hypot(a.x, a.y); return { x: a.x / n, y: a.y / n, ptr: false }; }
  if (input.down && !input.justDown) {
    const dx = input.mx - px, dy = input.my - py, d = Math.hypot(dx, dy);
    if (d > dead) return { x: dx / d, y: dy / d, ptr: true };
  }
  return { x: 0, y: 0, ptr: false };
}
export const ePressed = (input) => input.pressed.has('e') || input.pressed.has(' ');
export const botIn = (keys = [], pressed = []) => ({ mx: 0, my: 0, moved: false, down: false, justDown: false, wheel: 0, keys: new Set(keys), pressed: new Set(pressed) });
export const dirKeys = (x, y, dz = 0.25) => { const k = []; if (x > dz) k.push('arrowright'); if (x < -dz) k.push('arrowleft'); if (y > dz) k.push('arrowdown'); if (y < -dz) k.push('arrowup'); return k; };

export function heart(g, x, y, on) {
  const c = on ? K.ribbon[2] : K.charcoal[2];
  rect(g, c, x + 1, y, 2, 1); rect(g, c, x + 5, y, 2, 1); rect(g, c, x, y + 1, 8, 2); rect(g, c, x + 1, y + 3, 6, 1); rect(g, c, x + 2, y + 4, 4, 1); rect(g, c, x + 3, y + 5, 2, 1);
  if (on) rect(g, K.paper[4], x + 1, y + 1, 1, 1);
}
export function hudBar(g, title, points, lives, extra, maxLives = 3) {
  rect(g, '#1a1228', 0, 0, W, 20); rect(g, K.lilac[1], 0, 19, W, 1);
  drawText(g, title, 6, 6, K.butter[3], 1, null);
  drawText(g, String(points).padStart(6, '0'), 112, 6, K.paper[4], 1, null);
  for (let i = 0; i < maxLives; i++) heart(g, 170 + i * 10, 7, i < lives);
  if (extra) drawText(g, extra, 214, 6, K.mint[3], 1, null);
}
export function scoreTable(g, hs, x, y, hl) {
  drawTextC(g, 'HIGH SCORES', x + 50, y, K.butter[3], 1, null);
  (hs || []).slice(0, 5).forEach((r, i) => {
    const c = hl === i ? K.coral[3] : i === 0 ? K.butter[3] : K.paper[3];
    drawText(g, `${i + 1}. ${String(r.n).padEnd(5).slice(0, 5)}`, x, y + 11 + i * 9, c, 1, null);
    drawText(g, String(r.s).padStart(6, ' '), x + 54, y + 11 + i * 9, c, 1, null);
  });
}
// Twinkling backdrop used by the attract screens.
export function attractBg(g, t, c1, c2) {
  rect(g, c1, 0, 0, W, H);
  for (let i = 0; i < 46; i++) { const x = hash(i, 1) * W, y = (hash(i, 2) * H + t * (6 + (i % 5) * 3)) % H, on = (Math.floor(t * 2 + i) % 3) === 0; rect(g, on ? c2 : K.charcoal[2], x, y, on ? 2 : 1, on ? 2 : 1); }
}

export class Arcade {
  constructor(game, opts, cfg) {
    this.game = game; this.opts = opts || {}; this.cfg = cfg;
    Object.assign(this, { phase: 'attract', t: 0, clock: 0, overT: 0, points: 0, lives: cfg.lives || 3, done: false, score: 0, hs: (opts && opts.hs) || [], autoplay: false, result: null });
  }
  begin() { this.phase = 'play'; this.t = 0; sfx('select'); this.start && this.start(); }
  update(dt, input, game) {
    if (this.done) return;
    this.clock += dt;
    if (this.phase === 'attract') { if (act(input) || (this.opts.autostart && this.clock > 0.2)) this.begin(); return; }
    if (this.phase === 'over') { this.overT += dt; if (this.overT > 1.4 && (act(input) || this.overT > 3.2 || this.autoplay)) this.done = true; return; }
    this.t += dt;
    this.tick(dt, input, game);
    if (this.autoplay && this.t > (this.cfg.botCap || 100) && this.phase === 'play') this.end(false, 'Closing time!');
  }
  // Called when the player presses Esc in the scene.
  finish() { if (this.phase === 'play') this.end(false, 'Cabinet unplugged.'); else this.done = true; }
  end(won, text) {
    if (this.phase === 'over') return;
    this.phase = 'over'; this.overT = 0; this.won = !!won; this.msg = text;
    this.score = clamp(this.points / this.cfg.goal, 0, 1);
    this.tickets = this.ticketsFor();
    this.result = { text: `${this.points} pts, ${this.tickets} tickets`, points: this.points, tickets: this.tickets, won: !!won, extra: this.extraResult ? this.extraResult() : null };
    sfx(won ? 'chime' : 'wrong');
  }
  ticketsFor() { return Math.max(0, Math.round(this.points / this.cfg.perTicket)) + (this.won ? this.cfg.winBonus || 0 : 0); }
  attract(g, title, sub, art) {
    attractBg(g, this.clock, this.cfg.bg1, this.cfg.bg2);
    art && art(g, this.clock);
    drawTextC(g, title, 160, 22, K.butter[3], 2, null);
    drawTextC(g, sub, 160, 44, K.paper[3], 1, null);
    scoreTable(g, this.hs, 110, 130, -1);
    const blink = Math.floor(this.clock * 2) % 2;
    if (blink) drawTextC(g, 'PRESS E OR TAP TO START', 160, 202, K.mint[3], 1, null);
    drawTextC(g, this.cfg.help, 160, 212, K.paper[2], 1, null);
  }
  overlay(g) {
    if (this.phase !== 'over') return;
    rect(g, 'rgba(20,12,34,.78)', 40, 70, 240, 76);
    drawTextC(g, this.won ? 'YOU DID IT!' : 'GAME OVER', 160, 78, this.won ? K.butter[3] : K.coral[3], 2, null);
    if (this.msg) drawTextC(g, this.msg, 160, 98, K.paper[3], 1, null);
    drawTextC(g, `${this.points} POINTS`, 160, 112, K.paper[4], 1, null);
    drawTextC(g, `${this.tickets} TICKETS`, 160, 124, K.mint[3], 1, null);
    if (this.overT > 1.4) drawTextC(g, 'PRESS E OR TAP', 160, 136, K.paper[2], 1, null);
  }
}
