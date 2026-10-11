// Weather and ambient particles, drawn in screen space over outdoor maps only (indoors you only see it in windows).
import { hash } from './noise.js';
import { RAMPS } from './palette.js';

export function drawWeather(g, game, world) {
  const m = world.map;
  if (!m.def.outdoor || m.def.noWeather) return;
  const t = game.clock, w = game.weather, s = game.season, VW = 320, VH = 224;
  const ox = Math.round(world.cam.x) % 64, oy = Math.round(world.cam.y) % 64;
  if (w === 'rain' || w === 'storm') {
    const n = w === 'storm' ? 150 : 110;
    for (let i = 0; i < n; i++) {
      const far = i % 3 === 0, x = Math.round(((hash(i, 2, 2) * (VW + 40) - t * (far ? 40 : 70) - ox) % (VW + 40) + VW + 40) % (VW + 40)), y = Math.round((hash(i, 3, 3) * VH + t * (far ? 160 : 260) - oy + VH * 4) % VH);
      g.fillStyle = far ? 'rgba(200,220,240,0.35)' : 'rgba(225,240,255,0.65)';
      for (let k = 0; k < (far ? 3 : 5); k++) g.fillRect(x - Math.floor(k / 2), y + k, 1, 1);
    }
    for (let i = 0; i < 16; i++) { const x = Math.floor(hash(i, Math.floor(t * 8), 4) * VW), y = Math.floor(hash(i, Math.floor(t * 8), 5) * VH); g.fillStyle = 'rgba(230,245,255,0.7)'; g.fillRect(x - 2, y, 1, 1); g.fillRect(x + 2, y, 1, 1); g.fillRect(x - 1, y - 1, 3, 1); }
    if (w === 'storm') { const ph = t % 9; if (ph < 0.08 || (ph > 0.16 && ph < 0.2)) { g.fillStyle = `rgba(255,255,255,${ph < 0.08 ? 0.6 : 0.3})`; g.fillRect(0, 0, VW, VH); if (ph < 0.02 && !world._thunder) { world._thunder = true; setTimeout(() => game.sfx('thunder'), 500); } } else world._thunder = false; }
  } else if (w === 'snow') {
    for (let i = 0; i < 90; i++) { const sp = 12 + hash(i, 1, 1) * 18, x = Math.round(((hash(i, 2, 2) * VW + Math.sin(t * 1.3 + i) * 6 + t * 8 - ox) % VW + VW) % VW), y = Math.round(((hash(i, 3, 3) * VH + t * sp - oy) % VH + VH) % VH); g.fillStyle = i % 4 ? '#ffffff' : RAMPS.snow[2]; g.fillRect(x, y, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1); }
  } else if (s === 'spring' || (s === 'autumn' && (w === 'windy' || w === 'sunny' || w === 'cloudy'))) {
    const cols = s === 'spring' ? [RAMPS.sakura[2], RAMPS.sakura[3]] : [RAMPS.leafAutumn[2], RAMPS.leafAutumn[3], RAMPS.butter[2]];
    const n = w === 'windy' ? 26 : 10;
    for (let i = 0; i < n; i++) { const x = Math.round(((hash(i, 7, 1) * (VW + 40) + t * (w === 'windy' ? 40 : 14) - ox) % (VW + 40) + VW + 40) % (VW + 40)) - 20, y = Math.round(((hash(i, 8, 1) * VH + t * 10 + Math.sin(t * 2 + i) * 8 - oy) % VH + VH) % VH); g.fillStyle = cols[i % cols.length]; g.fillRect(x, y, Math.floor(t * 4 + i) % 2 ? 2 : 1, Math.floor(t * 4 + i) % 2 ? 1 : 2); }
  }
  // fireflies on summer evenings
  if (s === 'summer' && game.minutes >= 19 * 60 && game.minutes < 24 * 60 && w === 'sunny') {
    for (let i = 0; i < 16; i++) { if (Math.floor(t * 3 + i) % 4) continue; const x = Math.round(((hash(i, 9, 9) * VW + Math.sin(t * 0.7 + i) * 20 - ox) % VW + VW) % VW), y = Math.round(((hash(i, 8, 8) * VH + Math.cos(t * 0.5 + i) * 12 - oy) % VH + VH) % VH); g.fillStyle = '#e8ff9a'; g.fillRect(x, y, 1, 1); }
  }
}

// Bayer-dither fade: covers pixels whose dither threshold is under `a` (0..1). 17 cached patterns.
const pats = [];
export function ditherFade(g, a, color = '#1e1624') {
  if (a <= 0) return;
  if (a >= 1) { g.fillStyle = color; g.fillRect(0, 0, 320, 224); return; }
  const k = Math.min(16, Math.round(a * 16));
  if (!pats[k]) {
    const c = document.createElement('canvas'); c.width = 4; c.height = 4; const x = c.getContext('2d');
    const B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    x.fillStyle = color; for (let i = 0; i < 16; i++) if (B[i] < k) x.fillRect(i % 4, Math.floor(i / 4), 1, 1);
    pats[k] = g.createPattern(c, 'repeat');
  }
  g.fillStyle = pats[k]; g.fillRect(0, 0, 320, 224);
}
