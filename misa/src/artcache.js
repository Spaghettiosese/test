// Browser-side sprite cache. Bakes the procedural art to canvases, and lets any
// PNG in assets/override/<name>.png (e.g. painted in Moonkai Pixel Studio) replace it.
import { SPRITES } from './art.js';
import { CanvasSurface, MirrorSurface } from './surface.js';

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
    let s = new CanvasSurface(g);
    if (flip !== d.flip) s = new MirrorSurface(s, d.w);
    d.draw((x, y, w, h, col) => s.rect(x, y, w, h, col));
  }
  return c;
}

export function sprite(name, flip = false) {
  const k = name + (flip ? '@f' : '');
  let c = cache.get(k);
  if (!c) { c = bake(name, flip); cache.set(k, c); }
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
  cache.clear();
  return overrides.size;
}
