// Browser-side sprite cache. Bakes the procedural art to canvases, and lets any
// PNG in assets/override/<name>.png (e.g. painted in Moonkai Pixel Studio) replace it.
import { SPRITES, renderSprite } from './art.js';

const cache = new Map();
const overrides = new Map();

function bake(name, flip) {
  const d = SPRITES[name];
  const c = document.createElement('canvas');
  c.width = d.w; c.height = d.h;
  const g = c.getContext('2d');
  const ov = overrides.get(name);
  if (ov) {
    if (flip) { g.translate(d.w, 0); g.scale(-1, 1); }
    g.drawImage(ov, 0, 0);
  } else {
    const buf = renderSprite(name, flip);
    g.putImageData(new ImageData(buf.data, d.w, d.h), 0, 0);
  }
  return c;
}

export function sprite(name, flip = false) {
  const k = name + (flip ? '@f' : '');
  let c = cache.get(k);
  if (!c) { c = bake(name, flip); cache.set(k, c); }
  return c;
}

// Scale2x / EPX: doubles a sprite and rounds off jagged corners instead of just making bigger pixels.
function epx(src) {
  const w = src.width, h = src.height, d = src.getContext('2d').getImageData(0, 0, w, h).data;
  const out = new ImageData(w * 2, h * 2), o = out.data;
  const px = (x, y) => { x = Math.max(0, Math.min(w - 1, x)); y = Math.max(0, Math.min(h - 1, y)); const i = (y * w + x) * 4; return d[i + 3] < 8 ? 0 : (d[i] << 24 | d[i + 1] << 16 | d[i + 2] << 8 | d[i + 3]) >>> 0; };
  const put = (x, y, v) => { const i = (y * w * 2 + x) * 4; o[i] = v >>> 24; o[i + 1] = (v >>> 16) & 255; o[i + 2] = (v >>> 8) & 255; o[i + 3] = v & 255; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const P = px(x, y), A = px(x, y - 1), B = px(x + 1, y), C = px(x - 1, y), D = px(x, y + 1);
    let p1 = P, p2 = P, p3 = P, p4 = P;
    if (C === A && C !== D && A !== B) p1 = A;
    if (A === B && A !== C && B !== D) p2 = B;
    if (D === C && D !== B && C !== A) p3 = C;
    if (B === D && B !== A && D !== C) p4 = D;
    put(x * 2, y * 2, p1); put(x * 2 + 1, y * 2, p2); put(x * 2, y * 2 + 1, p3); put(x * 2 + 1, y * 2 + 1, p4);
  }
  const c = document.createElement('canvas'); c.width = w * 2; c.height = h * 2;
  c.getContext('2d').putImageData(out, 0, 0);
  return c;
}
const cache2 = new Map();
export function sprite2(name, flip = false) {
  const k = name + (flip ? '@f' : '');
  let c = cache2.get(k);
  if (!c) { c = epx(sprite(name, flip)); cache2.set(k, c); }
  return c;
}

export async function loadOverrides(base = 'assets/override/') {
  let names = [];
  try { names = await (await fetch(`${base}manifest.json`)).json(); } catch { /* no overrides */ }
  await Promise.all(names.filter((n) => SPRITES[n]).map((name) => new Promise((res) => {
    const img = new Image();
    img.onload = () => { overrides.set(name, img); res(); };
    img.onerror = () => res();
    img.src = `${base}${name}.png`;
  })));
  cache.clear(); cache2.clear();
  return overrides.size;
}
