// 32x32 pixel-art busts for the dialogue box, drawn in code from a person's spec with the same
// palette approach as the Moonkai pixel studio (a small fixed palette, hue-shifted shading,
// a dark outline). The canvas is scaled up with nearest-neighbour filtering by CSS.
import { SKIN, HAIR } from './people/outfits.js';

const OUT = '#181425', BG1 = '#1c1226', BG2 = '#2a1a38', GLOW = '#5a2a3a';
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const toHex = (c) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
// hue-shifted shade: darker = cooler & bluer, lighter = warmer
const shade = (h, k) => { const c = hex(h); return k < 0 ? toHex([c[0] * (1 + k * 0.5), c[1] * (1 + k * 0.6), c[2] * (1 + k * 0.25) + 10]) : toHex([c[0] + 255 * k * 0.4 + 8, c[1] + 255 * k * 0.3, c[2] + 255 * k * 0.18]); };

export function drawPortrait(canvas, npcOrSpec, mood = 'calm') {
  const spec = npcOrSpec.spec || npcOrSpec, ctx = canvas.getContext('2d');
  canvas.width = canvas.height = 32; ctx.imageSmoothingEnabled = false;
  const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  // background: a dithered glow behind the head, as if by firelight
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const d = Math.hypot(x - 22, y - 10); const v = d < 6 ? 2 : d < 11 ? 1 : 0; const dith = ((x + y) & 1) === 0; px(x, y, 1, 1, v === 2 ? (dith ? GLOW : BG2) : v === 1 ? (dith ? BG2 : BG1) : BG1); }
  const skin = SKIN[spec.skin || 'fair'] || SKIN.fair, sk = skin[0], sd = shade(skin[0], -0.28), sl = shade(skin[0], 0.12);
  const hairC = HAIR[spec.hair?.color || 'brown'] || spec.hair?.color || '#3b2a1f', hd = shade(hairC, -0.35), hl = shade(hairC, 0.2);
  const outfit = spec.outfit || 'peasant', c = spec.colors || {};
  const cloth = c.cloth || c.robe || (outfit === 'guard' || outfit === 'captain' ? '#59616b' : '#5a4a3c'), cd = shade(cloth, -0.3), cl = shade(cloth, 0.15);
  const wide = outfit === 'smith' || (spec.build || 1) > 1.1 ? 1 : 0;
  // shoulders / clothing
  px(4 - wide, 26, 24 + wide * 2, 6, cloth); px(4 - wide, 26, 24 + wide * 2, 1, cl); px(4 - wide, 30, 24 + wide * 2, 2, cd);
  px(3 - wide, 27, 1, 5, OUT); px(28 + wide, 27, 1, 5, OUT); px(4 - wide, 25, 24 + wide * 2, 1, OUT);
  // tabard / trim / collar hints
  if (outfit === 'guard' || outfit === 'captain') { px(13, 26, 6, 6, c.tabard || '#7a1f26'); px(15, 28, 2, 2, '#141115'); px(4, 26, 4, 3, '#8a929c'); px(24, 26, 4, 3, '#8a929c'); }
  if (outfit === 'noble' || outfit === 'duke') { px(12, 26, 8, 2, '#b8923e'); if (outfit === 'duke') { px(4, 25, 24, 4, '#8a8478'); px(4, 25, 24, 1, '#b8b0a0'); } }
  if (outfit === 'priest') { px(15, 26, 2, 6, '#b8923e'); px(14, 28, 4, 1, '#d8ceb8'); }
  if (outfit === 'rogue') { px(4, 26, 24, 2, '#20182a'); }
  // neck
  px(13, 22, 6, 4, sd); px(13, 22, 6, 1, OUT);
  // head
  const hx = 9, hy = 6, hw = 14, hh = 17;
  px(hx + 1, hy, hw - 2, hh, sk); px(hx, hy + 2, hw, hh - 5, sk);
  px(hx + 1, hy + hh - 2, hw - 2, 2, sk); px(hx + 3, hy + hh, hw - 6, 1, sk);
  px(hx + hw - 4, hy + 2, 3, hh - 4, sd);            // shaded side
  px(hx + 2, hy + 3, 3, 6, sl);                       // highlight
  // outline
  px(hx, hy + 1, 1, hh - 3, OUT); px(hx + hw - 1, hy + 1, 1, hh - 3, OUT); px(hx + 1, hy, hw - 2, 1, OUT); px(hx + 2, hy + hh + 1, hw - 4, 1, OUT);
  px(hx + 1, hy + hh, 2, 1, OUT); px(hx + hw - 3, hy + hh, 2, 1, OUT);
  // eyes & brows
  const ey = hy + 8, eyeC = spec.eyes || '#3d4d5c';
  px(hx + 3, ey, 3, 2, '#e9e2da'); px(hx + 8, ey, 3, 2, '#e9e2da'); px(hx + 4, ey, 1, 2, eyeC); px(hx + 9, ey, 1, 2, eyeC); px(hx + 4, ey + (mood === 'fear' ? -1 : 0), 1, 1, '#000'); px(hx + 9, ey + (mood === 'fear' ? -1 : 0), 1, 1, '#000');
  const browY = ey - 2 + (mood === 'anger' ? 0 : mood === 'fear' ? -1 : 0);
  px(hx + 3, browY, 3, 1, hd); px(hx + 8, browY, 3, 1, hd);
  if (mood === 'anger') { px(hx + 5, browY + 1, 1, 1, hd); px(hx + 8, browY + 1, 1, 1, hd); }
  // nose & mouth
  px(hx + 6, ey + 2, 2, 3, sd); px(hx + 7, ey + 4, 1, 1, shade(sk, -0.4));
  const my = ey + 6; px(hx + 4, my, 6, 1, mood === 'fear' ? '#3a1218' : '#8a4a42'); if (mood === 'fear') px(hx + 5, my + 1, 4, 1, '#3a1218');
  if (spec.scar) { px(hx + 3, hy + 5, 1, 6, '#b06a6a'); px(hx + 2, hy + 8, 3, 1, '#b06a6a'); }
  // beard
  if (spec.beard) { const long = spec.beard === 'long'; px(hx + 2, my + 1, hw - 4, long ? 6 : 3, hairC); px(hx + 3, my + (long ? 7 : 4), hw - 6, 1, hd); px(hx + 3, my - 1, 2, 1, hairC); px(hx + 9, my - 1, 2, 1, hairC); px(hx + 5, my, 4, 1, '#8a4a42'); }
  else if (spec.mustache) { px(hx + 3, my - 1, 8, 2, hairC); }
  // hair / headgear
  const style = spec.hair?.style || 'short';
  if (outfit === 'guard' || outfit === 'captain') {
    const steel = '#7d8590', sh = '#5a626c', sl2 = '#a8b0ba';
    px(hx - 1, hy - 3, hw + 2, 8, steel); px(hx - 1, hy - 3, hw + 2, 1, OUT); px(hx - 2, hy - 1, 1, 6, OUT); px(hx + hw + 1, hy - 1, 1, 6, OUT); px(hx + 2, hy - 2, 6, 1, sl2); px(hx - 1, hy + 4, hw + 2, 2, sh); px(hx + 6, hy + 4, 2, 8, steel);
    if (outfit === 'captain') { px(hx - 1, hy - 5, hw + 2, 3, '#1a0e14'); px(hx + 5, hy - 7, 4, 3, c.tabard || '#7a1f26'); }
  } else if (spec.hood || outfit === 'rogue') {
    const hood = c.cloth2 || '#3a2f28'; px(hx - 2, hy - 2, hw + 4, 9, hood); px(hx - 3, hy + 2, 3, 20, hood); px(hx + hw, hy + 2, 3, 20, hood); px(hx - 2, hy - 2, hw + 4, 1, OUT); px(hx - 1, hy + 5, hw + 2, 2, shade(hood, -0.4)); px(hx - 3, hy + 2, 1, 20, OUT); px(hx + hw + 2, hy + 2, 1, 20, OUT);
  } else if (outfit === 'priest' && style === 'tonsure') { px(hx, hy + 3, 2, 8, hairC); px(hx + hw - 2, hy + 3, 2, 8, hairC); px(hx + 1, hy, hw - 2, 2, hairC); }
  else if (outfit === 'duke') { px(hx, hy - 1, hw, 4, hairC); px(hx - 1, hy + 2, 2, 8, hairC); px(hx + hw - 1, hy + 2, 2, 8, hairC); px(hx + 1, hy - 1, hw - 2, 1, hl); px(hx + 1, hy - 3, hw - 2, 2, '#b8923e'); px(hx + 6, hy - 4, 2, 2, '#c01840'); }
  else if (style !== 'bald') {
    px(hx, hy - 1, hw, 5, hairC); px(hx - 1, hy + 1, 2, style === 'long' ? 20 : 7, hairC); px(hx + hw - 1, hy + 1, 2, style === 'long' ? 20 : 7, hairC); px(hx + 1, hy - 1, hw - 2, 1, hl); px(hx + 1, hy + 3, 4, 2, hd); px(hx + 9, hy + 3, 4, 1, hd);
    if (style === 'wild') { px(hx - 2, hy - 2, hw + 4, 3, hairC); }
  }
  if (spec.cap) { px(hx - 1, hy - 2, hw + 2, 5, cloth); px(hx - 1, hy - 2, hw + 2, 1, OUT); }
  if (outfit === 'woman' && spec.scarf !== false) { const sc = c.cloth2 || '#8a7a68'; px(hx - 1, hy - 1, hw + 2, 8, sc); px(hx - 2, hy + 4, 2, 12, sc); px(hx + hw, hy + 4, 2, 12, sc); px(hx + 3, hy + 4, 8, 2, sk); px(hx - 1, hy - 1, hw + 2, 1, OUT); }
  return canvas;
}
