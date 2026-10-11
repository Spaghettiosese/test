import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import './helpers.mjs';
import { SPRITES, renderSprite, drawSprite } from '../src/art.js';
import { BufferSurface } from '../src/surface.js';
import { encodePNG } from '../tools/png.mjs';

test('every sprite renders, and outlined sprites leave room for their outline on all four edges', () => {
  const bad = [];
  for (const [name, d] of Object.entries(SPRITES)) {
    const s = renderSprite(name);
    if (!s.opaquePixels()) bad.push(`${name} is empty`);
    if (d.outline && !name.startsWith('p_')) { // portraits are bust crops, so they may touch the frame
      const raw = new BufferSurface(d.w, d.h); drawSprite(name, raw); // the art before outlining must leave room for the outline
      const { w, h, data } = raw;
      for (let x = 0; x < w; x++) if (data[x * 4 + 3] || data[((h - 1) * w + x) * 4 + 3]) { bad.push(`${name} touches top/bottom edge`); break; }
      for (let y = 0; y < h; y++) if (data[(y * w) * 4 + 3] || data[(y * w + w - 1) * 4 + 3]) { bad.push(`${name} touches left/right edge`); break; }
    }
  }
  assert.deepEqual(bad, [], bad.join('\n'));
  assert.equal(encodePNG(16, 16, renderSprite('t_wood').data).subarray(1, 4).toString(), 'PNG');
});

test("Misa's Studio-painted sheets have the sizes the game expects", () => {
  const dims = (f) => { const b = readFileSync(new URL(`../assets/moonkai/${f}`, import.meta.url)); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
  assert.deepEqual(dims('misa_sheet.png'), [11 * 40, 3 * 48]);
  assert.deepEqual(dims('misa_portraits.png'), [4 * 64, 4 * 64]);
});
