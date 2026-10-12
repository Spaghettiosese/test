// Pixel fonts.
//
// Misa Sans: proportional mixed-case 5x7 font (cap height 7, x-height 5, descender 2, line height 10) for dialogue,
// menus and the phone. Glyph widths are 1-5 px plus 1 px spacing. Wraps by pixel width.
// Tiny: a fixed 3x5 caps font for HUD numerals and labels (M, W and N are wider so they never read as H).
//
// API (all coordinates are the top-left of the cap height):
//   drawText(g, str, x, y, color?, scale?, shadow?)   shadow: colour of a 1 px drop shadow, or null for none
//   drawTextC(g, str, cx, y, color?, scale?, shadow?) centred on cx
//   measure(str, scale?) -> width in px              wrap(str, maxChars) -> lines (budget maxChars * 4 px, legacy)
//   wrapPx(str, maxPx, scale?) -> lines              wrap(str, max, 'px') is the same as wrapPx
//   drawSmall(g, str, x, y, color?, shadow?)          measureSmall(str)       the 3x5 font (upper-cases its input)
//   CHAR_W (average advance, 5), LINE_H (10), SMALL_H (6)
//   setTextStyle({ highContrast, wide }) global accessibility options (outlined text, wider letter spacing)
//
// Characters: A-Z a-z 0-9 space . , ! ? ' " : ; - + / % * ( ) < > # = [ ] _ & $ @ | ~ ^ plus the UI-only
// symbols ♥ ★ ♪ … ▼ ▲ ◆ ► · ° (use those only in UI code; content strings stick to ASCII, ENGINE.md rule 7).

const S = (w, ...rows) => ({ w, rows });
// Rows start at the cap line (row 0). Lowercase x-height letters start at row 2; descenders use rows 7-8.
const _ = '';
const GLYPHS = {
  A: S(5, '.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'),
  B: S(5, '####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'),
  C: S(5, '.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'),
  D: S(5, '###..', '#..#.', '#...#', '#...#', '#...#', '#..#.', '###..'),
  E: S(4, '####', '#...', '#...', '###.', '#...', '#...', '####'),
  F: S(4, '####', '#...', '#...', '###.', '#...', '#...', '#...'),
  G: S(5, '.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'),
  H: S(5, '#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'),
  I: S(3, '###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'),
  J: S(4, '..##', '...#', '...#', '...#', '#..#', '#..#', '.##.'),
  K: S(5, '#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'),
  L: S(4, '#...', '#...', '#...', '#...', '#...', '#...', '####'),
  M: S(5, '#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'),
  N: S(5, '#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'),
  O: S(5, '.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'),
  P: S(5, '####.', '#...#', '#...#', '####.', '#....', '#....', '#....'),
  Q: S(5, '.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'),
  R: S(5, '####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'),
  S: S(5, '.###.', '#...#', '#....', '.###.', '....#', '#...#', '.###.'),
  T: S(5, '#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'),
  U: S(5, '#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'),
  V: S(5, '#...#', '#...#', '#...#', '#...#', '.#.#.', '.#.#.', '..#..'),
  W: S(5, '#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'),
  X: S(5, '#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'),
  Y: S(5, '#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'),
  Z: S(5, '#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'),
  a: S(4, _, _, '.##.', '...#', '.###', '#..#', '.###'),
  b: S(4, '#...', '#...', '###.', '#..#', '#..#', '#..#', '###.'),
  c: S(4, _, _, '.##.', '#..#', '#...', '#..#', '.##.'),
  d: S(4, '...#', '...#', '.###', '#..#', '#..#', '#..#', '.###'),
  e: S(4, _, _, '.##.', '#..#', '####', '#...', '.###'),
  f: S(3, '.##', '#..', '###', '#..', '#..', '#..', '#..'),
  g: S(4, _, _, '.###', '#..#', '#..#', '#..#', '.###', '...#', '.##.'),
  h: S(4, '#...', '#...', '###.', '#..#', '#..#', '#..#', '#..#'),
  i: S(1, '#', '.', '#', '#', '#', '#', '#'),
  j: S(3, '..#', '...', '..#', '..#', '..#', '..#', '..#', '..#', '##.'),
  k: S(4, '#...', '#...', '#..#', '#.#.', '##..', '#.#.', '#..#'),
  l: S(2, '#.', '#.', '#.', '#.', '#.', '#.', '.#'),
  m: S(5, _, _, '##.#.', '#.#.#', '#.#.#', '#.#.#', '#.#.#'),
  n: S(4, _, _, '###.', '#..#', '#..#', '#..#', '#..#'),
  o: S(4, _, _, '.##.', '#..#', '#..#', '#..#', '.##.'),
  p: S(4, _, _, '###.', '#..#', '#..#', '#..#', '###.', '#...', '#...'),
  q: S(4, _, _, '.###', '#..#', '#..#', '#..#', '.###', '...#', '...#'),
  r: S(4, _, _, '#.##', '##..', '#...', '#...', '#...'),
  s: S(4, _, _, '.###', '#...', '.##.', '...#', '###.'),
  t: S(3, '.#.', '.#.', '###', '.#.', '.#.', '.#.', '..#'),
  u: S(4, _, _, '#..#', '#..#', '#..#', '#..#', '.###'),
  v: S(5, _, _, '#...#', '#...#', '.#.#.', '.#.#.', '..#..'),
  w: S(5, _, _, '#...#', '#...#', '#.#.#', '#.#.#', '.#.#.'),
  x: S(4, _, _, '#..#', '#..#', '.##.', '#..#', '#..#'),
  y: S(4, _, _, '#..#', '#..#', '#..#', '#..#', '.###', '...#', '.##.'),
  z: S(4, _, _, '####', '...#', '.##.', '#...', '####'),
  0: S(4, '.##.', '#..#', '#.##', '##.#', '#..#', '#..#', '.##.'),
  1: S(3, '.#.', '##.', '.#.', '.#.', '.#.', '.#.', '###'),
  2: S(4, '.##.', '#..#', '...#', '..#.', '.#..', '#...', '####'),
  3: S(4, '###.', '...#', '...#', '.##.', '...#', '...#', '###.'),
  4: S(4, '#..#', '#..#', '#..#', '####', '...#', '...#', '...#'),
  5: S(4, '####', '#...', '###.', '...#', '...#', '#..#', '.##.'),
  6: S(4, '.##.', '#...', '#...', '###.', '#..#', '#..#', '.##.'),
  7: S(4, '####', '...#', '...#', '..#.', '.#..', '.#..', '.#..'),
  8: S(4, '.##.', '#..#', '#..#', '.##.', '#..#', '#..#', '.##.'),
  9: S(4, '.##.', '#..#', '#..#', '.###', '...#', '...#', '.##.'),
  ' ': S(2),
  '.': S(1, _, _, _, _, _, _, '#'),
  ',': S(2, _, _, _, _, _, '.#', '.#', '#.'),
  '!': S(1, '#', '#', '#', '#', '#', '.', '#'),
  '?': S(4, '.##.', '#..#', '...#', '..#.', '.#..', '....', '.#..'),
  "'": S(1, '#', '#'),
  '"': S(3, '#.#', '#.#'),
  ':': S(1, _, _, _, '#', _, _, '#'),
  ';': S(2, _, _, _, '.#', _, _, '.#', '#.'),
  '-': S(3, _, _, _, '###'),
  '+': S(5, _, '..#..', '..#..', '#####', '..#..', '..#..'),
  '/': S(3, '..#', '..#', '.#.', '.#.', '.#.', '#..', '#..'),
  '%': S(5, '##..#', '##.#.', '...#.', '..#..', '.#...', '.#.##', '#..##'),
  '*': S(5, _, '..#..', '#.#.#', '.###.', '#.#.#', '..#..'),
  '(': S(2, '.#', '#.', '#.', '#.', '#.', '#.', '.#'),
  ')': S(2, '#.', '.#', '.#', '.#', '.#', '.#', '#.'),
  '<': S(3, _, '..#', '.#.', '#..', '.#.', '..#'),
  '>': S(3, _, '#..', '.#.', '..#', '.#.', '#..'),
  '#': S(5, '.#.#.', '.#.#.', '#####', '.#.#.', '#####', '.#.#.', '.#.#.'),
  '=': S(4, _, _, '####', _, '####'),
  '[': S(2, '##', '#.', '#.', '#.', '#.', '#.', '##'),
  ']': S(2, '##', '.#', '.#', '.#', '.#', '.#', '##'),
  _: S(4, _, _, _, _, _, _, _, '####'),
  '&': S(5, '.##..', '#..#.', '#.#..', '.#...', '#.#.#', '#..#.', '.##.#'),
  $: S(5, '..#..', '.####', '#.#..', '.###.', '..#.#', '####.', '..#..'),
  '@': S(5, '.###.', '#...#', '#.###', '#.#.#', '#.###', '#....', '.###.'),
  '|': S(1, '#', '#', '#', '#', '#', '#', '#', '#', '#'),
  '~': S(4, _, _, _, '.#.#', '#.#.'),
  '^': S(3, '.#.', '#.#'),
  '♥': S(5, _, '##.##', '#####', '#####', '.###.', '..#..'),
  '★': S(5, '..#..', '..#..', '#####', '.###.', '.###.', '#...#'),
  '♪': S(4, '..##', '..#.', '..#.', '..#.', '.##.', '###.', '.#..'),
  '…': S(5, _, _, _, _, _, _, '#.#.#'),
  '▼': S(5, _, _, '#####', '.###.', '..#..'),
  '▲': S(5, _, _, '..#..', '.###.', '#####'),
  '◆': S(5, _, '..#..', '.###.', '#####', '.###.', '..#..'),
  '►': S(3, _, '#..', '##.', '###', '##.', '#..'),
  '·': S(1, _, _, _, '#'),
  '°': S(3, '.#.', '#.#', '.#.'),
};
// Glyph bitmaps as lists of [x, y] pixels (faster to draw).
for (const g of Object.values(GLYPHS)) { g.px = []; g.rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] === '#') g.px.push([x, y]); }); }
const FALLBACK = GLYPHS['?'];
const glyph = (ch) => GLYPHS[ch] || FALLBACK;

export const CHAR_W = 5, LINE_H = 10, SMALL_H = 6;
export const CHARSET = Object.keys(GLYPHS).join('');
const style = { highContrast: false, wide: false };
export function setTextStyle(o) { Object.assign(style, o); textCache.clear(); }
export const textStyle = () => ({ ...style });
const spacing = () => (style.wide ? 2 : 1);

export function measure(str, scale = 1) {
  const s = String(str ?? '');
  if (!s) return 0;
  let w = 0;
  for (const ch of s) w += glyph(ch).w + spacing();
  return (w - spacing()) * scale;
}

function rawText(g, s, x, y, color, scale, shadow) {
  const sp = spacing();
  const passes = [];
  if (shadow) {
    if (style.highContrast) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1]]) passes.push([dx, dy, shadow.length > 7 ? shadow.slice(0, 7) : shadow]);
    else passes.push([1, 1, shadow]);
  }
  passes.push([0, 0, color]);
  for (const [dx, dy, c] of passes) {
    g.fillStyle = c;
    let cx = x;
    for (const ch of s) {
      const gl = glyph(ch);
      for (const [px, py] of gl.px) g.fillRect(cx + (px + dx) * scale, y + (py + dy) * scale, scale, scale);
      cx += (gl.w + sp) * scale;
    }
  }
}

// Rendered strings are cached as small canvases (LRU), so a dialogue box is a few drawImage calls per frame.
const textCache = new Map();
const MAX_CACHE = 900;
export function drawText(g, str, x, y, color = '#fff8e8', scale = 1, shadow = '#2b1d2eaa') {
  const s = String(str ?? '');
  if (!s) return;
  if (typeof document === 'undefined' || !g.drawImage) return rawText(g, s, Math.round(x), Math.round(y), color, scale, shadow);
  const key = s + '|' + color + '|' + scale + '|' + shadow;
  let c = textCache.get(key);
  if (c) { textCache.delete(key); textCache.set(key, c); }
  else {
    c = document.createElement('canvas');
    const pad = style.highContrast && shadow ? 1 : 0;
    c.width = measure(s, scale) + 2 * scale + pad * 2 * scale; c.height = 11 * scale + pad * 2 * scale;
    rawText(c.getContext('2d'), s, pad * scale, pad * scale, color, scale, shadow);
    c.pad = pad * scale;
    textCache.set(key, c);
    if (textCache.size > MAX_CACHE) textCache.delete(textCache.keys().next().value);
  }
  g.drawImage(c, Math.round(x) - (c.pad || 0), Math.round(y) - (c.pad || 0));
}
export function drawTextC(g, str, cx, y, color, scale = 1, shadow) {
  drawText(g, str, Math.round(cx - measure(str, scale) / 2), y, color, scale, shadow);
}
// Right-aligned helper.
export function drawTextR(g, str, rx, y, color, scale = 1, shadow) {
  drawText(g, str, Math.round(rx - measure(str, scale)), y, color, scale, shadow);
}

// Word wrap by pixel width. Explicit '\n' starts a new line; words longer than a line are split.
export function wrapPx(str, maxPx, scale = 1) {
  const out = [];
  for (const para of String(str ?? '').split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const cand = line ? line + ' ' + word : word;
      if (measure(cand, scale) <= maxPx || !line) {
        if (measure(cand, scale) > maxPx && !line) { // a single over-long word: hard split
          let part = '';
          for (const ch of word) { if (measure(part + ch, scale) > maxPx && part) { out.push(part); part = ch; } else part += ch; }
          line = part;
        } else line = cand;
      } else { out.push(line); line = word; }
    }
    out.push(line);
  }
  return out;
}
// Legacy signature: wrap(str, maxChars) wraps to the pixel budget the old 4 px font gave maxChars characters.
export function wrap(str, max, unit = 'chars') { return wrapPx(str, unit === 'px' ? max : max * 4); }

// ---------------- Tiny 3x5 font (HUD numerals and labels) ----------------
const T = (w, bits) => ({ w, bits });
const TINY = {
  A: T(3, '010101111101101'), B: T(3, '110101110101110'), C: T(3, '011100100100011'), D: T(3, '110101101101110'),
  E: T(3, '111100110100111'), F: T(3, '111100110100100'), G: T(3, '011100101101011'), H: T(3, '101101111101101'),
  I: T(3, '111010010010111'), J: T(3, '001001001101010'), K: T(3, '101101110101101'), L: T(3, '100100100100111'),
  M: T(5, '1000111011101011000110001'), N: T(4, '10011101101110011001'), O: T(3, '010101101101010'), P: T(3, '110101110100100'),
  Q: T(3, '010101101110011'), R: T(3, '110101110101101'), S: T(3, '011100010001110'), T: T(3, '111010010010010'),
  U: T(3, '101101101101111'), V: T(3, '101101101101010'), W: T(5, '1000110001101011010101010'), X: T(3, '101101010101101'),
  Y: T(3, '101101010010010'), Z: T(3, '111001010100111'),
  0: T(3, '111101101101111'), 1: T(3, '010110010010111'), 2: T(3, '110001010100111'), 3: T(3, '110001010001110'),
  4: T(3, '101101111001001'), 5: T(3, '111100110001110'), 6: T(3, '011100111101111'), 7: T(3, '111001010010010'),
  8: T(3, '111101111101111'), 9: T(3, '111101111001110'),
  ' ': T(2, '0000000000'), '.': T(1, '00001'), ',': T(2, '0000000101'), ':': T(1, '01010'), '-': T(3, '000000111000000'),
  '+': T(3, '000010111010000'), '/': T(3, '001001010100100'), '%': T(3, '101001010100101'), '!': T(1, '11101'),
  '?': T(3, '110001010000010'), "'": T(1, '11000'), '(': T(2, '0110101001'), ')': T(2, '1001010110'), 'x': T(3, '000101010101000'),
  '#': T(3, '101111101111101'), '$': T(3, '011110010011110'), '<': T(3, '001010100010001'), '>': T(3, '100010001010100'),
};
const tinyGlyph = (ch) => TINY[ch] || TINY[ch.toUpperCase()] || TINY['?'];
export function measureSmall(str) {
  const s = String(str ?? '');
  let w = 0;
  for (const ch of s) w += tinyGlyph(ch).w + 1;
  return Math.max(0, w - 1);
}
function rawSmall(g, s, x, y, color, shadow) {
  for (const [dx, c] of shadow ? [[1, shadow], [0, color]] : [[0, color]]) {
    g.fillStyle = c;
    let cx = x;
    for (const ch of s) {
      const t = tinyGlyph(ch);
      for (let i = 0; i < t.bits.length; i++) if (t.bits[i] === '1') g.fillRect(cx + (i % t.w) + dx, y + Math.floor(i / t.w) + dx, 1, 1);
      cx += t.w + 1;
    }
  }
}
export function drawSmall(g, str, x, y, color = '#fff8e8', shadow = null) {
  const s = String(str ?? '').toUpperCase().replace('X', 'X');
  if (!s) return;
  if (typeof document === 'undefined' || !g.drawImage) return rawSmall(g, s, Math.round(x), Math.round(y), color, shadow);
  const key = '\u0001' + s + '|' + color + '|' + shadow;
  let c = textCache.get(key);
  if (!c) {
    c = document.createElement('canvas'); c.width = measureSmall(s) + 2; c.height = 7;
    rawSmall(c.getContext('2d'), s, 0, 0, color, shadow);
    textCache.set(key, c);
    if (textCache.size > MAX_CACHE) textCache.delete(textCache.keys().next().value);
  }
  g.drawImage(c, Math.round(x), Math.round(y));
}
export const drawSmallC = (g, str, cx, y, color, shadow) => drawSmall(g, str, Math.round(cx - measureSmall(String(str).toUpperCase()) / 2), y, color, shadow);
export const drawSmallR = (g, str, rx, y, color, shadow) => drawSmall(g, str, Math.round(rx - measureSmall(String(str).toUpperCase())), y, color, shadow);
