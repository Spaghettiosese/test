// Coast area helpers: palette shortcuts, small pixel-art helpers, a map grid builder and a map registrar
// that keeps maps playable while shared interactions (shops, jobs, story objects) are still being written.
import { register, get } from '../../core/registry.js';
import { RAMPS, INK } from '../../gfx/palette.js';
import { hash, bayer } from '../../gfx/noise.js';

export const C = RAMPS;
export { INK, hash, bayer };
export const WHITE = RAMPS.paper[4];

// ---------- pixel helpers (R is the sprite rect painter) ----------
export const px = (R, x, y, c) => R(x, y, 1, 1, c);
// Fill with c where a 4x4 Bayer threshold passes (cheap texture / gradient band).
export function dither(R, x, y, w, h, c, amt = 0.5, sx = 0, sy = 0) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (bayer(x + i + sx, y + j + sy) < amt) R(x + i, y + j, 1, 1, c);
}
// Speckle with hashed single pixels.
export function speckle(R, x, y, w, h, c, p = 0.08, seed = 1) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (hash(x + i, y + j, seed) < p) R(x + i, y + j, 1, 1, c);
}
// Horizontal planks: rows of boards with seams, per-board tone variation and grain.
export function planks(R, x, y, w, h, ramp, { board = 6, seam = 1, seed = 3, vertical = false, gaps = false } = {}) {
  if (vertical) {
    for (let i = 0; i < w; i += board + seam) {
      const bw = Math.min(board, w - i), k = Math.floor(i / (board + seam)), tone = hash(k, seed, 7) > 0.6 ? 2 : 3;
      R(x + i, y, bw, h, ramp[tone]); R(x + i, y, 1, h, ramp[tone + 1] || ramp[4]); R(x + i + bw - 1, y, 1, h, ramp[1]);
      for (let j = 3; j < h; j += 9) if (hash(k, j, seed) > 0.5) R(x + i + 2, y + j, 1, 3, ramp[1]);
      if (!gaps && seam) R(x + i + bw, y, seam, h, ramp[0]);
    }
    return;
  }
  for (let j = 0; j < h; j += board + seam) {
    const bh = Math.min(board, h - j), k = Math.floor(j / (board + seam)), tone = hash(k, seed, 7) > 0.6 ? 2 : 3;
    R(x, y + j, w, bh, ramp[tone]); R(x, y + j, w, 1, ramp[tone + 1] || ramp[4]); R(x, y + j + bh - 1, w, 1, ramp[1]);
    for (let i = 4; i < w; i += 11) if (hash(i, k, seed) > 0.5) R(x + i, y + j + 2, 3, 1, ramp[1]);
    if (!gaps && seam) R(x, y + j + bh, w, seam, ramp[0]);
  }
}
// A lit box (top face lighter, right side darker): ¾ view crate / block.
export function box(R, x, y, w, h, top, ramp) {
  R(x, y, w, top, ramp[3]); R(x, y, w, 1, ramp[4]);
  R(x, y + top, w, h - top, ramp[2]); R(x + w - 2, y + top, 2, h - top, ramp[1]); R(x, y + h - 1, w, 1, ramp[1]);
}
// Little pixel letters (3x5) for signs drawn into sprites. Only the glyphs we need.
const GLYPH = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100',
  G: '011100101101011', H: '101101111101101', I: '111010010010111', K: '101101110101101', L: '100100100100111', M: '101111111101101',
  N: '110101101101101', O: '010101101101010', P: '110101110100100', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', W: '101101111111101', Y: '101101010010010', '&': '010101010101011', ' ': '000000000000000', '-': '000000111000000',
};
export function letters(R, x, y, text, c) {
  for (const ch of text) { const g = GLYPH[ch] || GLYPH[' ']; for (let i = 0; i < 15; i++) if (g[i] === '1') R(x + (i % 3), y + Math.floor(i / 3), 1, 1, c); x += 4; }
}

// ---------- map grid builder ----------
// const G = grid(48, 22, '.'); G.rect(x, y, w, h, ch); G.set(x, y, ch); G.rows() -> string[]
export function grid(w, h, fill) {
  const a = Array.from({ length: h }, () => Array(w).fill(fill));
  const api = {
    w, h, a,
    set(x, y, ch) { if (x >= 0 && y >= 0 && x < w && y < h) a[y][x] = ch; return api; },
    get(x, y) { return x >= 0 && y >= 0 && x < w && y < h ? a[y][x] : null; },
    rect(x, y, rw, rh, ch) { for (let j = y; j < y + rh; j++) for (let i = x; i < x + rw; i++) api.set(i, j, ch); return api; },
    // organic blob (ellipse) of a char
    blob(cx, cy, rx, ry, ch) { for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) if ((i * i) / (rx * rx + 0.3) + (j * j) / (ry * ry + 0.3) <= 1) api.set(cx + i, cy + j, ch); return api; },
    rows() { return a.map((r) => r.join('')); },
    each(fn) { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) fn(x, y, a[y][x]); },
  };
  return api;
}

// ---------- maps ----------
// Objects that name a shared interaction (`use: 'shop_bait'`) owned by another area fall back to a gentle
// placeholder until that area registers it, so the map always loads. `soon` is the placeholder text.
export function coastMap(id, def) {
  const objs = def.objects || [];
  delete def.objects;
  const m = register('map', id, def);
  Object.defineProperty(m, 'objects', {
    enumerable: true,
    get() {
      return objs.map((o) => {
        if (!o.use || get('interaction', o.use)) return o;
        const { use, soon, ...rest } = o;
        void use;
        return { ...rest, interact: { label: o.soonLabel || 'Look', run: (g) => g.toast(soon || 'Not open just yet. Come back soon!') } };
      });
    },
  });
  return m;
}

// Once-per-day / once-per-week helpers backed by the coast state slice.
export const today = (game, key) => (game.state.coast.daily[key] === game.day);
export const markToday = (game, key) => { game.state.coast.daily[key] = game.day; };
export const weekOf = (day) => Math.floor((day - 1) / 7);
