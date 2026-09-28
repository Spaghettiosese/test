// Misa, painted by hand on the Moonkai Pixel Studio canvas (tools/misa-studio.mjs).
//   assets/moonkai/misa_sheet.png      11 cols x 3 rows of 40x48: rows = down / up / side (faces right)
//                                      cols 0-3 idle breathing, 4 blink, 5-10 walk
//   assets/moonkai/misa_portraits.png  4x4 of 64x64: rows = neutral / happy / surprised / sleepy,
//                                      cols = mouth closed/open x blink off/on
import { epx } from './artcache.js';

const FW = 40, FH = 48, PW = 64;
const imgs = {};
let big = null;
const ROW = { down: 0, up: 1, left: 2, right: 2 };
const MOOD = { neutral: 0, happy: 1, surprised: 2, sleepy: 3 };

export function loadMisa() {
  return Promise.all(['misa_sheet', 'misa_portraits'].map((k) => new Promise((res) => {
    const img = new Image();
    img.onload = () => { imgs[k] = img; res(); };
    img.onerror = () => res();
    img.src = (typeof window !== 'undefined' && window.MOONKAI_SHEETS && window.MOONKAI_SHEETS[k]) || `assets/moonkai/${k}.png`;
  })));
}

// Which sheet column to show. anim: 'idle' | 'walk' | 'run'; t = seconds in that animation.
export function misaFrame(anim, t) {
  if (anim === 'idle') return t % 3.8 < 0.14 ? 4 : [0, 1, 2, 1][Math.floor(t * 2.2) % 4];
  return 5 + (Math.floor(t * (anim === 'run' ? 16 : 12)) % 6);
}

function smoothSheet(img) {
  if (!big) { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').drawImage(img, 0, 0); big = epx(c); }
  return big;
}

// Draw with the feet centred on (x, y). scale 2 uses a Scale2x-smoothed copy of the sheet; other scales are nearest-neighbour.
export function drawMisa(g, dir, anim, t, x, y, scale = 1) {
  const img = imgs.misa_sheet;
  if (!img) { g.fillStyle = '#3d5a8c'; g.fillRect(Math.round(x - 8), Math.round(y - 30), 16, 30); return; }
  const f = misaFrame(anim, t), row = ROW[dir] ?? 0, smooth = scale === 2, k = smooth ? 2 : 1;
  g.save();
  g.translate(Math.round(x), 0);
  if (dir === 'left') g.scale(-1, 1);
  g.drawImage(smooth ? smoothSheet(img) : img, f * FW * k, row * FH * k, FW * k, FH * k, -Math.round((FW * scale) / 2), Math.round(y - (FH - 1) * scale), FW * scale, FH * scale);
  g.restore();
}

// 64x64 portrait facing the viewer. mouth: 0 closed / 1 open, blink: 0 / 1.
export function drawPortrait(g, mood, mouth, blink, x, y) {
  const img = imgs.misa_portraits;
  if (!img) return false;
  g.drawImage(img, (mouth * 2 + blink) * PW, (MOOD[mood] ?? 0) * PW, PW, PW, x, y, PW, PW);
  return true;
}
