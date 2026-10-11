// Character sheets: 40x48 frames, 11 per row; rows = down / up / side (faces right, mirrored for left).
// cols 0-3 idle breathing, 4 blink, 5-10 walk. Misa's sheet is painted in Moonkai Pixel Studio; NPC sheets
// come from tools/studio-cast.mjs (assets/cast/<id>.png). Missing sheets fall back to a palette swap of Misa.
import { epx } from '../artcache.js';
import { shade } from './color.js';

export const FW = 40, FH = 48;
const imgs = {}, canv = {}, smooth = {};
const ROW = { down: 0, up: 1, left: 2, right: 2 };

export const MISA_PAL = {
  hair: ['#8b5a44', '#b98262', '#5a3a2e'], top: ['#3d5a8c', '#5f80b4', '#2c4270'], bottom: ['#2a3552', '#1f2840'],
  skin: ['#f8d5b8', '#e3a98a'], eyes: ['#b0703c'], accent: ['#f0a0b8'], shoe: ['#f4f4f8', '#8a90a8'], trim: ['#fff1d6'],
};

export function loadImage(key, url) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => { imgs[key] = img; res(true); };
    img.onerror = () => res(false);
    img.src = url;
  });
}
export const image = (key) => imgs[key];
const toCanvas = (img) => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').drawImage(img, 0, 0); return c; };

// Swap exact colours (pairs of [fromHex, toHex]) across a sheet.
export function recolor(src, pairs) {
  const c = toCanvas(src), g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, c.height), p = d.data;
  const map = new Map(pairs.map(([a, b]) => [parseInt(a.slice(1), 16), b]));
  const cache = new Map();
  for (let i = 0; i < p.length; i += 4) {
    if (!p[i + 3]) continue;
    const k = (p[i] << 16) | (p[i + 1] << 8) | p[i + 2];
    const to = map.get(k);
    if (!to) continue;
    let rgb = cache.get(to);
    if (!rgb) { const n = parseInt(to.slice(1), 16); rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; cache.set(to, rgb); }
    p[i] = rgb[0]; p[i + 1] = rgb[1]; p[i + 2] = rgb[2];
  }
  g.putImageData(d, 0, 0);
  return c;
}

// Build palette-swap pairs from a "look" ({ hair, top, bottom, skin, eyes, accent, shoe }).
export function lookPairs(look) {
  const P = MISA_PAL, out = [];
  const ramp = (base, n) => n === 3 ? [base, shade(base, 1, 0.12), shade(base, -1, 0.14)] : [base, shade(base, -1, 0.12)];
  for (const k of ['hair', 'top', 'bottom', 'skin', 'shoe']) if (look[k]) ramp(look[k], P[k].length).forEach((c, i) => out.push([P[k][i], c]));
  if (look.eyes) out.push([P.eyes[0], look.eyes]);
  if (look.accent) out.push([P.accent[0], look.accent]);
  if (look.trim) out.push([P.trim[0], look.trim]);
  return out;
}

// Get (and cache) a drawable sheet. key: 'misa', 'misa@<outfitId>' or an NPC id.
export function sheetFor(key, look) {
  if (canv[key]) return canv[key];
  const base = imgs.misa_sheet;
  if (key === 'misa') return base || null;
  if (imgs['cast_' + key]) return (canv[key] = imgs['cast_' + key]);
  if (!base || !look) return base || null;
  return (canv[key] = recolor(base, lookPairs(look)));
}
export function smoothSheet(key, look) {
  if (smooth[key]) return smooth[key];
  const s = sheetFor(key, look);
  return s ? (smooth[key] = epx(s instanceof HTMLCanvasElement ? s : toCanvas(s))) : null;
}

export function charFrame(anim, t, seed = 0) {
  if (anim === 'idle') return (t + seed) % 3.8 < 0.14 ? 4 : [0, 1, 2, 1][Math.floor((t + seed) * 2.2) % 4];
  return 5 + (Math.floor(t * (anim === 'run' ? 16 : 12)) % 6);
}

// Draw a character with feet centred on (x, y). Any sheet with 11 columns x 3 rows works (Misa 40x48 frames,
// cast sheets 48x64); feet sit on the frame's bottom row. scale 2 uses a Scale2x-smoothed copy.
export function drawChar(g, key, look, dir, anim, t, x, y, scale = 1, seed = 0) {
  const sm = scale === 2, src = sm ? smoothSheet(key, look) : sheetFor(key, look);
  if (!src) { g.fillStyle = (look && look.top) || '#3d5a8c'; g.fillRect(Math.round(x - 7 * scale), Math.round(y - 30 * scale), 14 * scale, 30 * scale); return; }
  const k = sm ? 2 : 1, fw = src.width / 11 / k, fh = src.height / 3 / k, f = charFrame(anim, t, seed), row = ROW[dir] ?? 0;
  g.save();
  g.translate(Math.round(x), 0);
  if (dir === 'left') g.scale(-1, 1);
  g.drawImage(src, f * fw * k, row * fh * k, fw * k, fh * k, -Math.round((fw * scale) / 2), Math.round(y - (fh - 1) * scale), fw * scale, fh * scale);
  g.restore();
}
