// Town area toolkit: sprite helpers, a tiny sign font, map-building helpers and safe map registration.
import { register, get } from '../../core/registry.js';
import { defineSprite, SPRITES } from '../../art.js';
import { RAMPS, materials } from '../../gfx/palette.js';
import { hash } from '../../gfx/noise.js';

export { RAMPS, materials, hash, SPRITES };
export const TP = 32; // screen px per tile (1 tile = 16 world px, drawn at 2x)
const SUMMER = materials('summer');

// spr(name, w, h, (R, M, season) => {...}, opts): an hd prop sprite with a selective outline.
// opts.seasonal makes M the season-swapped materials; otherwise M is the summer set.
export function spr(name, w, h, draw, opts = {}) {
  const { seasonal = false, outline = 'selective', flip = false } = opts;
  defineSprite(name, w, h, (R0, ctx) => draw(clipR(R0, w, h), seasonal && ctx && ctx.M ? ctx.M : SUMMER, (ctx && ctx.season) || 'summer'), { hd: true, outline: outline || false, seasonal, flip });
  return name;
}
// Drawing API clipped to the content box, so outlines always have room.
function clipR(R0, W, H) {
  const R = (x, y, w, h, c) => { const x0 = Math.max(0, x), y0 = Math.max(0, y), x1 = Math.min(W, x + w), y1 = Math.min(H, y + h); if (x1 > x0 && y1 > y0) R0(x0, y0, x1 - x0, y1 - y0, c); };
  R.e = (cx, cy, rx, ry, c) => { for (let y = -ry; y <= ry; y++) { const w = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry || 1))) + 0.5); R(cx - w, cy + y, w * 2 + 1, 1, c); } };
  R.t = (a, b, cc, c) => {
    const pts = [a, b, cc], ys = pts.map((p) => p[1]);
    for (let y = Math.min(...ys); y <= Math.max(...ys); y++) {
      let lo = Infinity, hi = -Infinity;
      for (let i = 0; i < 3; i++) {
        const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % 3];
        if (y1 === y2) { if (y1 === y) { lo = Math.min(lo, x1, x2); hi = Math.max(hi, x1, x2); } continue; }
        if ((y - y1) * (y - y2) <= 0) { const x = x1 + ((y - y1) * (x2 - x1)) / (y2 - y1); lo = Math.min(lo, x); hi = Math.max(hi, x); }
      }
      if (lo <= hi) R(Math.round(lo), y, Math.round(hi) - Math.round(lo) + 1, 1, c);
    }
  };
  return R;
}
export const sprW = (name) => { const d = SPRITES[name]; return d ? d.w - 2 * (d.pad || 0) : 0; };
export const sprH = (name) => { const d = SPRITES[name]; return d ? d.h - 2 * (d.pad || 0) : 0; };

// ---------- 3x5 sign lettering, painted into sprites (signs are upper case) ----------
const GLYPH = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100',
  G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
  M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101',
  S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
  Y: '101101010010010', Z: '111001010100111', 0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
  4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001110',
  '.': '000000000000010', '!': '010010010000010', "'": '010010000000000', '-': '000000111000000', '&': '010101010101011', ' ': '000000000000000',
  '<': '001010100010001', '>': '100010001010100', '^': '010101000000000', ':': '000010000010000',
};
// M and W get 5 px glyphs so they read at 1x.
const WIDE = { M: ['10001', '11011', '10101', '10001', '10001'], W: ['10001', '10001', '10101', '11011', '10001'] };
export const signW = (s) => [...s.toUpperCase()].reduce((a, ch) => a + (WIDE[ch] ? 6 : 4), 0) - 1;
export function signText(R, s, x, y, c) {
  let cx = x;
  for (const ch of s.toUpperCase()) {
    if (WIDE[ch]) { WIDE[ch].forEach((row, j) => [...row].forEach((b, i) => b === '1' && R(cx + i, y + j, 1, 1, c))); cx += 6; continue; }
    const bits = GLYPH[ch] || GLYPH[' '];
    for (let i = 0; i < 15; i++) if (bits[i] === '1') R(cx + (i % 3), y + Math.floor(i / 3), 1, 1, c);
    cx += 4;
  }
}

// Pixel line (for branches, wires drawn inside sprites).
export function line(R, x0, y0, x1, y1, c, t = 1) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
  for (let i = 0; i <= n; i++) R(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), t, t, c);
}

// ---------- map building ----------
// A mutable character grid painted with rectangles, turned into map rows at the end.
export function grid(w, h, fill) {
  const g = Array.from({ length: h }, () => Array(w).fill(fill));
  g.w = w; g.h = h;
  g.fill = (x, y, ww, hh, ch) => { for (let j = y; j < y + hh; j++) for (let i = x; i < x + ww; i++) if (g[j] && i >= 0 && i < w) g[j][i] = ch; return g; };
  g.set = (pts, ch) => { for (const [x, y] of pts) if (g[y] && x >= 0 && x < w) g[y][x] = ch; return g; };
  g.blob = (cx, cy, rx, ry, ch) => { for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) if ((i * i) / (rx * rx + 0.3) + (j * j) / (ry * ry + 0.3) <= 1) g.set([[cx + i, cy + j]], ch); return g; };
  g.rows = () => g.map((r) => r.join(''));
  return g;
}

// A prop centred horizontally over its footprint (x, y = footprint top-left tile, w/h footprint tiles).
export function prop(spr, x, y, o = {}) {
  const w = o.w || 1, h = o.h || 1, cw = sprW(spr);
  const out = { spr, x, y, ...o, w, h };
  out.dx = (w * TP - cw) / 4 + (o.dx || 0);
  return out;
}

// Common outdoor legend, shared by every town map.
export const LEGEND = {
  '.': 'grass', ',': 'meadow', '"': 'lawn', ':': 'dirt', '=': 'paved', '+': 'plaza', '_': 'asphalt',
  '~': 'water', 'g': 'gravel', 's': 'sand', '#': 'hedge', 'B': 'town_bridge', 'p': 'town_plot',
  'W': 'wall_brick', 'S': 'wall_stone',
};

// Friendly stand-ins for shared interactions other areas haven't registered yet, so the town never breaks.
const PENDING = {
  shop_market: ['Market stall', 'Fresh vegetables and fruit, all from farms around the bay.'],
  shop_ramen: ['Ramen cart', 'Steam curls up from the pot. It smells wonderful.'],
  shop_salon: ['Salon Snip', 'A sign in the window: walk-ins welcome.'],
  shop_clinic: ['Dr. Mori\'s clinic', 'A clinic for people and their pets.'],
  shop_woodworks: ['Kinoko Woodworks', 'Shelves of handmade furniture, smelling of cedar.'],
  shop_stall: ['Friday stall', 'An old merchant\'s stall full of curious odds and ends.'],
  vending: ['Vending machine', 'Rows of little drinks glow behind the glass.'],
  noticeboard: ['Noticeboard', 'Town notices and requests are pinned here.'],
  mailbox: ['Mailbox', 'Nothing in the mailbox today.'],
  craft_bench: ['Workbench', 'Grandma\'s old workbench, with tools hung neatly on the wall.'],
};
const fallbackUse = (o) => {
  if (!o.use || get('interaction', o.use)) return o;
  const [label, text] = PENDING[o.use] || ['Look', 'Nothing to do here yet.'];
  const { use, ...rest } = o; void use;
  return { ...rest, interact: { label, run: (g) => g.say(null, 'neutral', text) } };
};
const warpOk = (w) => {
  const [mapId, sp] = String(w.to).split(':'), def = get('map', mapId);
  return !!def && (!sp || !!(def.spawns && def.spawns[sp]));
};
const guardWarp = (w) => (warpOk(w) ? w : { ...w, locked: () => true, lockedText: w.missingText || 'The door is locked.' });

// Register a town map. Objects and warps are resolved when the map is built, so props that use another area's
// interaction (or doors into another area's interior) work as soon as that area lands, and never crash before.
export function townMap(id, def) {
  const objects = def.objects || [], warps = def.warps || [];
  const m = register('map', id, { outdoor: true, music: 'town', legend: LEGEND, ...def });
  Object.defineProperty(m, 'objects', { get: () => objects.map(fallbackUse), enumerable: true, configurable: true });
  Object.defineProperty(m, 'warps', { get: () => warps.map(guardWarp), enumerable: true, configurable: true });
  return m;
}

// Opening hours for doors: { open: '09:00', close: '19:00', closedOn?: 'sun' } -> locked cond + text.
export function hours(o) {
  const conds = [`time<${o.open}`, `time>=${o.close}`];
  if (o.closedOn) conds.push(`day:${o.closedOn}`);
  const fmt = (hm) => { const [h, m] = hm.split(':').map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 && h < 24 ? 'PM' : 'AM'}`; };
  const txt = `Closed. Open ${fmt(o.open)} to ${fmt(o.close)}${o.closedOn ? `, closed ${{ sun: 'Sundays', sat: 'Saturdays', mon: 'Mondays' }[o.closedOn]}` : ''}.`;
  return { locked: { any: conds }, lockedText: (g) => (o.closedOn && g.check(`day:${o.closedOn}`) ? txt : g.check(`time<${o.open}`) ? `Closed until ${fmt(o.open)}.` : txt) };
}

// Town tile variants: walkable water under bridges, and garden soil.
register('tile', 'town_bridge', { ground: 'water', solid: false });
register('tile', 'town_plot', { ground: 'dirt' });
