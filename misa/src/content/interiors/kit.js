// Interiors art kit: small helpers so every piece of furniture is shaded the same way
// (ART.md: light from the top-left, 3+ tones per material, selective outline with an ink bottom edge).
// All sprites here are hd (1 art px = 1 screen px; a tile is 32x32).
import { defineSprite, SPRITES } from '../../art.js';
import { RAMPS } from '../../gfx/palette.js';
import { hash } from '../../gfx/noise.js';

export const C = RAMPS;
export { hash };

// Define an hd prop sprite with a selective outline (skips names that already exist, so variants can share code).
export function S(name, w, h, draw, opts = {}) {
  if (SPRITES[name]) return name;
  defineSprite(name, w, h, draw, { hd: true, outline: 'selective', ...opts });
  return name;
}
// Flat decal (rugs, floor marks): no outline.
export const D = (name, w, h, draw, opts = {}) => S(name, w, h, draw, { outline: false, ...opts });

// A block seen in 3/4 view: a lit top face (height `top`) over a front face. r = 5-step ramp.
export function block(R, x, y, w, h, top, r, { edge = true } = {}) {
  R(x, y, w, h, r[2]);
  if (top > 0) { R(x, y, w, top, r[3]); R(x, y, w, 1, r[4]); R(x, y + top, w, 1, r[1]); }
  if (edge) { R(x, y + top + 1, 1, h - top - 1, r[3]); R(x + w - 1, y + top + 1, 1, h - top - 1, r[1]); }
  R(x, y + h - 1, w, 1, r[1]);
}
// A recessed panel (cabinet door / drawer front) with a knob.
export function panelDoor(R, x, y, w, h, r, knob = 'right', kc = C.butter) {
  R(x, y, w, h, r[1]); R(x + 1, y + 1, w - 2, h - 2, r[2]); R(x + 1, y + 1, w - 2, 1, r[3]); R(x + 1, y + 1, 1, h - 2, r[3]);
  const ky = y + Math.floor(h / 2) - 1;
  if (knob === 'right') R(x + w - 4, ky, 2, 2, kc[2]); else if (knob === 'left') R(x + 2, ky, 2, 2, kc[2]); else if (knob === 'top') R(x + Math.floor(w / 2) - 2, y + 3, 4, 1, kc[1]);
}
export function drawerStack(R, x, y, w, h, n, r) {
  const dh = Math.floor(h / n);
  for (let i = 0; i < n; i++) { panelDoor(R, x, y + i * dh, w, dh - 1, r, 'none'); R(x + Math.floor(w / 2) - 3, y + i * dh + Math.floor(dh / 2) - 1, 6, 1, C.butter[1]); R(x + Math.floor(w / 2) - 3, y + i * dh + Math.floor(dh / 2) - 2, 6, 1, C.butter[3]); }
}
// Wood grain dashes across a face.
export function grain(R, x, y, w, h, r, seed = 1) {
  for (let j = 0; j < h; j += 3) for (let i = 0; i < w; i += 7) if (hash(x + i, y + j, seed) > 0.62) R(x + i + Math.floor(hash(i, j, seed + 1) * 4), y + j + 1, 2 + Math.floor(hash(i, j, seed + 2) * 3), 1, r[1]);
}
// A table leg / post.
export function leg(R, x, y, w, h, r) { R(x, y, w, h, r[1]); if (w > 1) R(x, y, 1, h, r[2]); }

const SPINES = ['coral', 'sky', 'mint', 'butter', 'lilac', 'navy', 'forest', 'woodDark', 'ribbon', 'paper'];
// Procedural book spines (2-4 px wide, muted ramps, an occasional leaning book).
export function books(R, x, y, w, h, seed = 0, fill = 0.92) {
  let i = 0, k = 0;
  while (i < w - 1) {
    const bw = 2 + Math.floor(hash(seed, k, 3) * 3), r = C[SPINES[Math.floor(hash(seed, k, 4) * SPINES.length)]];
    if (i + bw > w) break;
    if (hash(seed, k, 5) > fill) { i += bw; k++; continue; }
    const bh = h - Math.floor(hash(seed, k, 6) * Math.min(4, h / 3));
    if (hash(seed, k, 7) > 0.93 && i + bw + 3 < w) { // leaning book
      for (let j = 0; j < bh - 1; j++) R(x + i + Math.floor(j / 4), y + h - 1 - j, bw, 1, r[2]);
      i += bw + 3; k++; continue;
    }
    R(x + i, y + h - bh, bw, bh, r[2]); R(x + i, y + h - bh, 1, bh, r[3]); if (bw > 2) R(x + i + bw - 1, y + h - bh, 1, bh, r[1]);
    if (bh > 6) R(x + i, y + h - bh + 2, bw, 1, r[4] || r[3]);
    i += bw; k++;
  }
}
// Leafy blob in three passes (shadow mass, mid, lit clusters).
export function foliage(R, cx, cy, rx, ry, L = C.leaf, seed = 1) {
  const blobs = [[0, 0, rx, ry], [-rx * 0.55, ry * 0.25, rx * 0.6, ry * 0.65], [rx * 0.55, ry * 0.25, rx * 0.6, ry * 0.65], [-rx * 0.3, -ry * 0.45, rx * 0.55, ry * 0.55], [rx * 0.3, -ry * 0.45, rx * 0.55, ry * 0.55]]
    .map(([x, y, a, b], i) => [Math.round(cx + x + (hash(seed, i, 1) - 0.5) * 2), Math.round(cy + y), Math.max(1, Math.round(a)), Math.max(1, Math.round(b))]);
  for (const [x, y, a, b] of blobs) R.e(x, y, a, b, L[1]);
  for (const [x, y, a, b] of blobs) R.e(x - 1, y - 1, Math.max(1, a - 1), Math.max(1, b - 1), L[2]);
  for (const [x, y, a, b] of blobs.slice(0, 5)) R.e(x - 2, y - 2, Math.max(1, a - 3), Math.max(1, b - 3), L[3]);
  for (let i = 0; i < 6; i++) R(Math.round(cx - rx * 0.6 + hash(seed, i, 9) * rx), Math.round(cy - ry * 0.7 + hash(seed, i, 8) * ry * 0.8), 2, 1, L[4]);
}
// Plant pot (terracotta by default): cx = centre x, by = bottom y.
export function pot(R, cx, by, w, h, r = C.brick) {
  const x = cx - Math.floor(w / 2);
  R(x + 1, by - h, w - 2, h, r[2]); R(x, by - h, w, 3, r[3]); R(x, by - h, w, 1, r[4]); R(x + w - 3, by - h + 3, 2, h - 3, r[1]); R(x + 1, by - h + 3, 1, h - 3, r[3]); R(x + 2, by - 1, w - 4, 1, r[1]);
}
// Cloth / cushion: rounded block.
export function cushion(R, x, y, w, h, r) {
  R(x + 1, y, w - 2, h, r[2]); R(x, y + 1, w, h - 2, r[2]); R(x + 1, y + 1, w - 3, 2, r[3]); R(x + 1, y + 1, 1, h - 3, r[3]); R(x + 1, y + h - 1, w - 2, 1, r[1]); R(x + w - 1, y + 2, 1, h - 3, r[1]); R(x + 2, y + 1, 2, 1, r[4]);
}
// Small glints on glass/metal.
export function glint(R, x, y, c = '#ffffff') { R(x, y, 2, 1, c); R(x, y + 1, 1, 1, c); }
// Metal appliance box.
export function metalBox(R, x, y, w, h, top, r = C.metal) { block(R, x, y, w, h, top, r); }
// Ramp lookup by name (with a fallback).
export const ramp = (n) => C[n] || C.wood;
