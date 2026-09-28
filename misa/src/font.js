// 3x5 pixel font (caps). Each glyph = 5 rows of 3 bits.
const G = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110',
  E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101',
  I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
  M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100',
  Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
  Y: '101101010010010', Z: '111001010100111',
  0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
  4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010',
  8: '111101111101111', 9: '111101111001110',
  '.': '000000000000010', ',': '000000000010100', '!': '010010010000010', '?': '110001010000010',
  "'": '010010000000000', ':': '000010000010000', '-': '000000111000000', '+': '000010111010000',
  '/': '001001010100100', '%': '101001010100101', '*': '101111111010000', '(': '010100100100010',
  ')': '010001001001010', '>': '100010001010100', '<': '001010100010001', ' ': '000000000000000',
  '"': '101101000000000', '^': '010101000000000', '~': '000011110000000',
};
export const CHAR_W = 4, LINE_H = 7;
export const measure = (s, scale = 1) => s.length * CHAR_W * scale;

export function drawText(g, str, x, y, color = '#fff8e8', scale = 1, shadow = '#2b1d2eaa') {
  const s = String(str).toUpperCase();
  for (const pass of shadow ? [1, 0] : [0]) {
    let cx = x;
    for (const ch of s) {
      const bits = G[ch] || G['?'];
      for (let i = 0; i < 15; i++) if (bits[i] === '1') {
        const px = cx + (i % 3) * scale, py = y + Math.floor(i / 3) * scale;
        g.fillStyle = pass ? shadow : color;
        g.fillRect(px + pass * scale, py + pass * scale, scale, scale);
      }
      cx += CHAR_W * scale;
    }
  }
}
export function drawTextC(g, str, cx, y, color, scale = 1, shadow) {
  drawText(g, str, Math.round(cx - measure(str, scale) / 2), y, color, scale, shadow);
}
export function wrap(str, maxChars) {
  const out = []; let line = '';
  for (const w of String(str).split(' ')) {
    if ((line + ' ' + w).trim().length > maxChars) { out.push(line); line = w; }
    else line = (line + ' ' + w).trim();
  }
  if (line) out.push(line);
  return out;
}
