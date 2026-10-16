// Full-screen storybook backdrops for event and festival scenes (step { t:'scene', name }). Pixel discs only, palette ramps.
import { register, get } from '../../core/registry.js';
import { RAMPS as K } from '../../gfx/palette.js';
import { drawChar } from '../../gfx/chars.js';
import { drawPortrait } from '../../ui/portraits.js';
import { sprite } from '../../artcache.js';
import { SPRITES } from '../../art.js';
import { hash } from '../../gfx/noise.js';

export const VW = 320, VH = 224;
// rect(g, colour, x, y, w, h); rect(g, x, y, w, h, colour) also works.
export const rect = (g, c, x, y, w, h) => { if (typeof c !== 'string') [c, x, y, w, h] = [h, c, x, y, w]; g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
export function disc(g, cx, cy, r, c, ry = r) { g.fillStyle = c; for (let y = -ry; y <= ry; y++) { const w = Math.floor(r * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry || 1))) + 0.5); g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1); } }
// Vertical bands with 2x2 checker dither between neighbours.
export function sky(g, cols, y0 = 0, y1 = VH) {
  const h = (y1 - y0) / cols.length;
  cols.forEach((c, i) => rect(g, c, 0, y0 + i * h, VW, h + 1));
  for (let i = 1; i < cols.length; i++) { const y = Math.round(y0 + i * h); g.fillStyle = cols[i - 1]; for (let yy = y; yy < y + 4; yy++) for (let x = (yy % 2); x < VW; x += 2) if ((yy - y) < 2 || x % 4 === yy % 4) g.fillRect(x, yy, 1, 1); }
}
export function stars(g, t, n = 70, yMax = 120, seed = 1) {
  for (let i = 0; i < n; i++) {
    const x = Math.floor(hash(i, seed, 3) * VW), y = Math.floor(hash(i, seed, 4) * yMax), tw = Math.floor(t * 2 + i) % 7;
    g.fillStyle = tw === 0 ? K.lilac[2] : i % 5 ? K.paper[4] : K.butter[3];
    g.fillRect(x, y, 1, 1);
    if (i % 11 === 0 && tw) { g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); }
  }
}
export function moon(g, cx, cy, r, full = true) {
  for (let k = 3; k >= 1; k--) { g.globalAlpha = 0.08 * (4 - k); disc(g, cx, cy, r + k * 5, K.butter[4]); }
  g.globalAlpha = 1;
  disc(g, cx, cy, r, K.paper[4]); disc(g, cx - 2, cy - 2, r - 3, '#fffdf4');
  for (const [dx, dy, rr] of [[-4, 3, 3], [5, -4, 2], [3, 6, 2], [-6, -5, 1]]) disc(g, cx + dx * r / 14, cy + dy * r / 14, rr * r / 14, K.paper[2]);
  if (!full) disc(g, cx + r * 0.5, cy - r * 0.3, r, '#171233');
}
export function sea(g, y0, ramp, t, y1 = VH) {
  rect(g, ramp[1], 0, y0, VW, y1 - y0); rect(g, ramp[2], 0, y0, VW, 6); rect(g, ramp[3], 0, y0, VW, 1);
  for (let i = 0; i < 40; i++) { const y = y0 + 4 + Math.floor(hash(i, 9, 2) * (y1 - y0 - 6)), x = Math.floor((hash(i, 9, 1) * VW + t * (6 + (i % 4) * 3)) % (VW + 30)) - 15, w = 4 + (i % 5) * 3; rect(g, i % 3 ? ramp[2] : ramp[3], x, y, w, 1); }
}
export function skyline(g, y, c, seed = 2) {
  let x = 0;
  while (x < VW) { const w = 18 + Math.floor(hash(x, seed, 1) * 26), h = 10 + Math.floor(hash(x, seed, 2) * 22); rect(g, c, x, y - h, w, h + 1); if (hash(x, seed, 3) > 0.5) { for (let k = 0; k < w / 2; k++) rect(g, c, x + k, y - h - Math.floor(k / 2), w - k * 2, 1); } x += w; }
}
export function hills(g, y, c, amp = 10, f = 0.02, ph = 0) { g.fillStyle = c; for (let x = 0; x < VW; x++) { const h = Math.round(Math.sin(x * f + ph) * amp + Math.sin(x * f * 2.7 + ph) * amp * 0.4); g.fillRect(x, y - h, 1, VH - y + h); } }
export function misa(g, dir, x, y, t, anim = 'idle') { drawChar(g, 'misa', null, dir, anim, t, x, y); }
export function npc(g, id, dir, x, y, t) { const d = get('npc', id); if (d) drawChar(g, id, d.look, dir, 'idle', t, x, y, 1, id.length * 0.37); }
export function mochi(g, x, y, t, sleep = false) { const n = sleep ? `mochi_sleep_${Math.floor(t) % 2}` : `mochi_sit_${Math.floor(t * 2) % 4}`; if (SPRITES[n]) { const s = sprite(n); g.drawImage(s, Math.round(x - s.width / 2), Math.round(y - s.height)); } }
export function spr(g, name, x, y) { if (SPRITES[name]) { const s = sprite(name); g.drawImage(s, Math.round(x - s.width / 2), Math.round(y - s.height)); } }
// The old game's window close-up: wooden frame, sill and a dim room below.
export function windowRoom(g, inner, t, night = true) {
  inner();
  const W = K.wood;
  rect(g, W[1], 0, 0, VW, 12); rect(g, W[1], 0, 0, 12, 112); rect(g, W[1], VW - 12, 0, 12, 112); rect(g, W[1], VW / 2 - 3, 0, 6, 104);
  rect(g, W[2], 2, 2, VW - 4, 2); rect(g, W[2], VW / 2 - 2, 4, 2, 100);
  rect(g, W[3], 0, 104, VW, 8); rect(g, W[4], 0, 104, VW, 2);
  rect(g, night ? '#3a2a4a' : '#5a4a58', 0, 112, VW, VH - 112);
  for (let x = 0; x < VW; x += 32) rect(g, night ? '#33243f' : '#514252', x, 112, 1, VH - 112);
}
const rain = (g, t, n = 120, c = K.sky[3]) => { g.fillStyle = c; for (let i = 0; i < n; i++) { const x = Math.floor(((hash(i, 2, 2) * (VW + 40) - t * 40) % (VW + 40) + VW + 40) % (VW + 40)), y = Math.floor((hash(i, 3, 3) * VH + t * 220) % VH); g.fillRect(x, y, 1, 4); g.fillRect(x - 1, y + 4, 1, 2); } };
const flakes = (g, t, n = 80, yMax = VH) => { for (let i = 0; i < n; i++) { const x = Math.floor(((hash(i, 2, 7) * VW + Math.sin(t + i) * 6 + t * 6) % VW + VW) % VW), y = Math.floor((hash(i, 3, 7) * yMax + t * (10 + (i % 4) * 5)) % yMax); rect(g, i % 3 ? '#ffffff' : K.snow[2], x, y, i % 5 ? 1 : 2, i % 5 ? 1 : 2); } };

// Burst helper for fireworks: deterministic per index and cycle.
function burst(g, cx, cy, r, ramp, p) {
  const n = 18, a = 1 - p;
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2, d = r * Math.min(1, p * 1.6), x = cx + Math.cos(ang) * d, y = cy + Math.sin(ang) * d * 0.9 + p * p * 10;
    g.globalAlpha = Math.max(0, a); rect(g, ramp[4], x, y, 2, 2); rect(g, ramp[2], x - Math.cos(ang) * 4, y - Math.sin(ang) * 4, 1, 1); rect(g, ramp[3], x - Math.cos(ang) * 8, y - Math.sin(ang) * 7, 1, 1);
  }
  g.globalAlpha = 1;
}
const BACKDROPS = {
  // ---- ported from the old game ----
  night: { music: 'night', draw(g, game, t) {
    windowRoom(g, () => { sky(g, ['#171233', '#1e1a44', '#2a2458'], 0, 104); stars(g, t, 60, 100); moon(g, 240, 46, 16, false);
      const s = (t % 7) / 1.2; if (s < 1) for (let i = 0; i < 14; i++) { g.globalAlpha = 1 - i / 14; rect(g, K.butter[4], 40 + s * 200 - i * 3, 20 + s * 70 - i * 1.5, 3, 2); } g.globalAlpha = 1; }, t);
    misa(g, 'up', 118, 160, t); mochi(g, 196, 156, t); } },
  rain: { music: 'rain', draw(g, game, t) {
    windowRoom(g, () => { sky(g, ['#56687c', '#65788c', '#7d90a4'], 0, 104); hills(g, 96, '#5a6c7e', 6); rain(g, t, 110); if (Math.floor(t * 0.7) % 5 === 0 && (t * 10) % 7 < 0.6) { g.globalAlpha = 0.35; rect(g, '#ffffff', 0, 0, VW, 104); g.globalAlpha = 1; } }, t, false);
    misa(g, 'up', 118, 160, t); mochi(g, 196, 156, t, true); } },
  // ---- weather ----
  rainbow: { draw(g, game, t) {
    sky(g, [K.sky[3], K.sky[4], '#f4f8f0']);
    const cols = [K.ribbon[2], K.leafAutumn[3], K.butter[2], K.forest[3], K.sky[1], K.lilac[2]];
    cols.forEach((c, i) => { const r = 150 - i * 6; g.fillStyle = c; for (let x = -r; x <= r; x++) { const y = Math.round(Math.sqrt(r * r - x * x) * 0.55); g.fillRect(160 + x, 170 - y, 1, 6); } });
    for (let i = 0; i < 5; i++) disc(g, 30 + i * 70, 40 + (i % 2) * 18, 16, '#ffffff', 6);
    hills(g, 170, K.grassSpring[3], 8, 0.03); skyline(g, 180, K.navy[3]); rect(g, K.grassSpring[2], 0, 180, VW, 44);
    for (let i = 0; i < 20; i++) rect(g, K.sky[4], (i * 37) % VW, 190 + (i * 13) % 30, 6, 1);
    misa(g, 'up', 150, 214, t); } },
  typhoon: { music: 'rain', draw(g, game, t) {
    windowRoom(g, () => { sky(g, ['#3e4658', '#4a5468', '#56607a'], 0, 104); const sway = Math.sin(t * 3) * 6; for (let i = 0; i < 3; i++) { const x = 40 + i * 110; rect(g, '#2e3a3a', x, 60, 4, 44); disc(g, x + 2 + sway, 56, 14, '#2f4a40', 9); } rain(g, t * 1.6, 190, '#c8d8e8'); if ((t % 5) < 0.12) { g.globalAlpha = 0.5; rect(g, '#ffffff', 0, 0, VW, 104); g.globalAlpha = 1; } }, t);
    misa(g, 'down', 100, 196, t); mochi(g, 140, 196, t, true); spr(g, 'ev_chochin_white', 220, 196); } },
  candle: { music: 'night', draw(g, game, t) {
    rect(g, '#1a1426', 0, 0, VW, VH); rect(g, '#241a30', 0, 140, VW, 84);
    const fl = Math.floor(t * 8) % 3;
    for (let k = 5; k >= 1; k--) { g.globalAlpha = 0.07; disc(g, 160, 150, 40 + k * 18 + fl, K.butter[3], 24 + k * 12); }
    g.globalAlpha = 1;
    rect(g, K.wood[2], 100, 156, 120, 8); rect(g, K.wood[3], 100, 156, 120, 2);
    for (const [x, h] of [[140, 22], [160, 30], [180, 18]]) { rect(g, K.paper[4], x - 3, 156 - h, 6, h); rect(g, K.paper[2], x + 1, 156 - h, 2, h); rect(g, K.ink[1], x, 152 - h, 1, 3); disc(g, x, 148 - h - fl, 2, K.butter[3], 4); rect(g, '#ffffff', x, 149 - h - fl, 1, 2); }
    misa(g, 'down', 112, 206, t); mochi(g, 214, 206, t); } },
  first_snow: { music: 'night', draw(g, game, t) {
    windowRoom(g, () => { sky(g, ['#c8d4e8', '#d8e2f0', '#e8eef8'], 0, 104); hills(g, 92, K.snow[3], 5); skyline(g, 100, K.snow[2]); rect(g, K.snow[4], 0, 100, VW, 4); flakes(g, t, 90, 104); }, t, false);
    misa(g, 'up', 118, 160, t); mochi(g, 196, 156, t); } },
  heatwave: { draw(g, game, t) {
    sky(g, [K.sky[2], K.sky[3], K.butter[4]], 0, 140); disc(g, 260, 40, 20, K.butter[4]); disc(g, 260, 40, 14, '#ffffff');
    for (let y = 120; y < 150; y++) { const o = Math.round(Math.sin(y * 0.4 + t * 4) * 2); rect(g, K.sand[3], o, y, VW, 1); }
    sea(g, 112, K.water, t, 124); rect(g, K.sand[3], 0, 140, VW, 84); for (let i = 0; i < 30; i++) rect(g, K.sand[2], (i * 53) % VW, 150 + (i * 17) % 70, 3, 1);
    misa(g, 'down', 150, 200, t); } },
  season_card: { draw(g, game, t) {
    const s = game.season, R = { spring: [K.sakura, K.grassSpring], summer: [K.sky, K.grass], autumn: [K.leafAutumn, K.grassAutumn], winter: [K.snow, K.grassWinter] }[s] || [K.sky, K.grass];
    rect(g, '#2b1d2e', 0, 0, VW, VH);
    for (let i = 0; i < 4; i++) {
      const x = 16 + (i % 2) * 148, y = 12 + Math.floor(i / 2) * 100, w = 140, h = 92;
      rect(g, K.paper[4], x, y, w, h); rect(g, K.paper[1], x, y + h - 2, w, 2);
      g.save(); g.beginPath(); g.rect(x + 4, y + 4, w - 8, h - 8); g.clip(); g.translate(x + 4, y + 4);
      rect(g, R[0][3], 0, 0, w, h); rect(g, R[1][2], 0, 56, w, 40); rect(g, R[1][3], 0, 56, w, 2);
      if (i === 0) { hills(g, 56, R[1][1], 6); rect(g, K.stone[4], 20, 28, 30, 30); rect(g, K.roofRed[2], 14, 22, 42, 8); rect(g, K.wood[1], 30, 44, 8, 14); }
      if (i === 1) { sea(g, 50, K.water, t, 84); rect(g, K.paper[4], 100, 14, 10, 40); rect(g, K.ribbon[2], 100, 20, 10, 4); rect(g, K.butter[3], 98, 8, 14, 6); }
      if (i === 2) { for (let k = 0; k < 4; k++) { rect(g, K.woodDark[2], 14 + k * 30, 30, 4, 28); disc(g, 16 + k * 30, 26, 12, R[0][2], 9); } }
      if (i === 3) { rect(g, K.vermilion[2], 50, 14, 4, 44); rect(g, K.vermilion[2], 80, 14, 4, 44); rect(g, K.vermilion[2], 42, 12, 50, 5); rect(g, K.ink[2], 44, 18, 46, 3); }
      for (let k = 0; k < 14; k++) rect(g, s === 'winter' ? '#ffffff' : R[0][4], (k * 29 + t * 12) % w, (k * 19 + t * 20) % h, 2, 1);
      g.restore();
    }
  } },
  // ---- video calls ----
  ship_cabin: { music: 'home', draw(g, game, t) {
    rect(g, '#2b1d2e', 0, 0, VW, VH);
    rect(g, K.ink[1], 22, 6, 276, 132); rect(g, K.wood[1], 24, 8, 272, 128);
    for (let x = 24; x < 296; x += 16) rect(g, K.wood[2], x, 8, 1, 128);
    disc(g, 160, 50, 26, K.metal[2]); disc(g, 160, 50, 22, K.metal[4]); disc(g, 160, 50, 20, K.sky[2]);
    g.save(); g.beginPath(); g.rect(140, 30, 40, 40); g.clip(); sea(g, 54, K.water, t, 72); g.restore();
    rect(g, K.wood[3], 24, 110, 272, 26); rect(g, K.wood[4], 24, 110, 272, 2);
    rect(g, K.paper[3], 250, 20, 30, 22); rect(g, K.water[2], 252, 22, 26, 18); rect(g, K.ink[2], 258, 30, 14, 4); // a whale photo
    const bob = Math.round(Math.sin(t * 1.2) * 1.5), talk = Math.floor(t * 6) % 2;
    rect(g, K.paper[4], 40, 46 + bob, 68, 68); drawPortrait(g, 'mum', 'happy', talk, t % 4 < 0.12 ? 1 : 0, 42, 48 + bob);
    rect(g, K.paper[4], 212, 46 - bob, 68, 68); drawPortrait(g, 'dad', 'happy', 1 - talk, t % 3.3 < 0.12 ? 1 : 0, 214, 48 - bob);
    rect(g, K.ribbon[2], 30, 12, 34, 9); g.fillStyle = '#fff'; if (Math.floor(t * 2) % 2) disc(g, 36, 16, 2, '#ffffff');
    rect(g, K.ink[1], 252, 116, 40, 16); rect(g, '#b6dcc9', 253, 117, 38, 14);
  } },
  // ---- festivals ----
  hanami: { music: 'festival', draw(g, game, t) {
    sky(g, [K.sky[3], K.sky[4], '#fdf2f6'], 0, 130); hills(g, 120, K.grassSpring[3], 6);
    for (const [x, r] of [[40, 40], [160, 52], [285, 44]]) { rect(g, K.woodDark[2], x - 4, 100, 8, 40); disc(g, x, 90, r, K.sakura[2], Math.round(r * 0.6)); disc(g, x - 8, 82, r - 14, K.sakura[3], Math.round(r * 0.4)); disc(g, x - 14, 76, 10, K.sakura[4], 6); }
    rect(g, K.grassSpring[2], 0, 140, VW, 84);
    spr(g, 'ev_picnic_mat', 160, 200);
    for (let i = 0; i < 40; i++) { const x = (hash(i, 1, 5) * VW + t * 14 + Math.sin(t + i) * 8) % VW, y = (hash(i, 2, 5) * VH + t * 18) % VH; rect(g, i % 2 ? K.sakura[3] : K.sakura[4], x, y, 2, 1); }
    misa(g, 'down', 130, 196, t); npc(g, 'nori', 'down', 190, 196, t); mochi(g, 160, 206, t); } },
  carp: { music: 'festival', draw(g, game, t) {
    sky(g, [K.sky[2], K.sky[3], K.sky[4]], 0, 170); for (let i = 0; i < 4; i++) disc(g, (i * 97 + t * 8) % 360 - 20, 30 + i * 18, 22, '#ffffff', 7);
    spr(g, `ev_koinobori_${Math.floor(t * 3) % 2}`, 110, 190); spr(g, `ev_koinobori_${Math.floor(t * 3 + 1) % 2}`, 230, 196);
    rect(g, K.grass[3], 0, 186, VW, 38); misa(g, 'up', 170, 214, t); } },
  tanabata: { music: 'night', draw(g, game, t) {
    sky(g, ['#141030', '#1e1a44', '#2a2458'], 0, 160);
    for (let i = 0; i < 260; i++) { const x = Math.floor(hash(i, 5, 1) * VW), y = Math.floor(x * 0.45 - 10 + (hash(i, 5, 2) - 0.5) * 44); g.globalAlpha = 0.5 + hash(i, 5, 3) * 0.5; rect(g, i % 4 ? K.lilac[3] : K.paper[4], x, y, 1, 1); }
    g.globalAlpha = 1; stars(g, t, 50, 150, 4); disc(g, 70, 40, 2, '#ffffff'); disc(g, 250, 130, 2, '#ffffff');
    rect(g, '#1a2a2a', 0, 160, VW, 64); spr(g, 'ev_bamboo', 230, 214); spr(g, 'ev_bamboo', 60, 214);
    misa(g, 'up', 150, 210, t); } },
  fireworks: { music: 'festival', draw(g, game, t) {
    sky(g, ['#0e0a24', '#171233', '#241c48'], 0, 150);
    stars(g, t, 30, 100, 7);
    const cols = [K.ribbon, K.butter, K.sky, K.sakura, K.mint, K.lilac];
    for (let k = 0; k < 4; k++) { const cyc = Math.floor((t + k * 0.7) / 2.4), p = ((t + k * 0.7) % 2.4) / 2.4; burst(g, 50 + hash(cyc, k, 1) * 220, 30 + hash(cyc, k, 2) * 50, 26 + hash(cyc, k, 3) * 18, cols[(cyc + k) % cols.length], p); }
    skyline(g, 150, '#120c22', 5); sea(g, 150, ['#0c1430', '#141e40', '#1e2a58', '#3a4a80'], t, 186);
    for (let i = 0; i < 8; i++) rect(g, cols[i % 6][3], 20 + i * 38, 156 + (i % 3) * 8, 6, 1);
    rect(g, '#1a1226', 0, 186, VW, 38); misa(g, 'up', 140, 216, t); npc(g, 'kai', 'up', 104, 216, t); npc(g, 'hina', 'up', 178, 216, t); } },
  lanterns_water: { music: 'night', draw(g, game, t) {
    sky(g, ['#120e2a', '#1c1840', '#2a2458'], 0, 120); stars(g, t, 50, 110, 9); moon(g, 260, 40, 12);
    sea(g, 120, ['#0c1430', '#141e40', '#1e2a58', '#2e3e70'], t);
    for (let i = 0; i < 14; i++) { const x = (hash(i, 3, 3) * 360 + t * (6 + i % 3)) % 360 - 20, y = 128 + hash(i, 4, 3) * 80, s = 0.5 + (y - 120) / 160; g.globalAlpha = 0.25; disc(g, x, y + 6, 10 * s, K.butter[3], 3); g.globalAlpha = 1; rect(g, K.butter[3], x - 4 * s, y - 6 * s, 8 * s, 8 * s); rect(g, K.paper[4], x - 4 * s, y - 6 * s, 8 * s, 1); rect(g, K.wood[1], x - 5 * s, y + 2 * s, 10 * s, 2); }
    rect(g, K.woodDark[1], 0, 200, VW, 24); rect(g, K.wood[1], 0, 200, VW, 2); misa(g, 'up', 160, 220, t); } },
  sky_lanterns: { music: 'night', draw(g, game, t) {
    sky(g, ['#120e2a', '#1c1840', '#2a2458', '#3a2c60'], 0, 170); stars(g, t, 60, 140, 11);
    for (let i = 0; i < 24; i++) { const x = hash(i, 6, 1) * VW + Math.sin(t * 0.5 + i) * 6, y = (hash(i, 6, 2) * 200 - t * (8 + i % 4 * 3)) % 220, yy = y < 0 ? y + 220 : y, s = 0.5 + hash(i, 6, 3); g.globalAlpha = 0.2; disc(g, x, yy, 8 * s, K.butter[3]); g.globalAlpha = 1; rect(g, K.butter[3], x - 3 * s, yy - 4 * s, 6 * s, 8 * s); rect(g, K.butter[4], x - 3 * s, yy - 4 * s, 2, 8 * s); }
    hills(g, 186, '#1a1430', 6); misa(g, 'up', 160, 214, t); } },
  moon: { music: 'night', draw(g, game, t) {
    sky(g, ['#141030', '#1e1a44', '#2a2458'], 0, 150); stars(g, t, 50, 130, 13); moon(g, 220, 56, 26);
    for (let i = 0; i < 26; i++) { const x = 10 + i * 12 + Math.sin(t + i) * 2; for (let k = 0; k < 30; k++) rect(g, K.grassAutumn[1], x + Math.floor(k / 8), 180 - k, 1, 1); disc(g, x + 4, 150, 2, K.paper[3], 5); }
    rect(g, '#2a2232', 0, 178, VW, 46); rect(g, K.wood[1], 0, 178, VW, 3);
    spr(g, 'ev_dango_stand', 160, 206); misa(g, 'up', 110, 214, t); npc(g, 'hana', 'up', 210, 214, t); } },
  leaves: { music: 'town', draw(g, game, t) {
    sky(g, [K.sky[3], K.sky[4], K.butter[4]], 0, 120);
    for (const [x, c] of [[30, K.leafAutumn[2]], [110, K.leafAutumn[3]], [200, K.ribbon[2]], [290, K.butter[2]]]) { rect(g, K.woodDark[2], x - 4, 80, 8, 70); disc(g, x, 70, 40, c, 30); disc(g, x - 10, 60, 22, K.leafAutumn[4], 14); }
    rect(g, K.grassAutumn[3], 0, 150, VW, 74); for (let i = 0; i < 6; i++) spr(g, 'ev_leaf_pile', 30 + i * 52, 180 + (i % 2) * 20);
    for (let i = 0; i < 40; i++) { const x = (hash(i, 1, 8) * VW + t * 20) % VW, y = (hash(i, 2, 8) * VH + t * 26 + Math.sin(t * 2 + i) * 5) % VH; rect(g, [K.leafAutumn[2], K.leafAutumn[3], K.butter[2], K.ribbon[2]][i % 4], x, y, 2, 2); }
    misa(g, 'down', 150, 200, t); mochi(g, 180, 204, t); } },
  ghost_night: { music: 'night', draw(g, game, t) {
    sky(g, ['#1a1030', '#26183e', '#3a2048'], 0, 160); stars(g, t, 40, 120, 15); moon(g, 60, 44, 18);
    skyline(g, 160, '#140c20', 9); rect(g, '#2a2232', 0, 160, VW, 64);
    spr(g, 'ev_lanterns_ghost', 160, 170);
    for (const x of [40, 120, 200, 280]) spr(g, 'ev_pumpkin', x, 214);
    const gy = 100 + Math.sin(t * 2) * 6; g.globalAlpha = 0.85; disc(g, 250, gy, 12, '#f4f0ff', 14); rect(g, '#f4f0ff', 238, gy, 25, 14); g.globalAlpha = 1; rect(g, K.ink[1], 245, gy - 4, 2, 3); rect(g, K.ink[1], 253, gy - 4, 2, 3);
    misa(g, 'down', 160, 210, t); } },
  winter_market: { music: 'festival', draw(g, game, t) {
    sky(g, ['#2a2a58', '#3a3a70', '#4a4a80'], 0, 130); stars(g, t, 30, 100, 17);
    skyline(g, 130, '#20203e', 3); rect(g, K.snow[3], 0, 130, VW, 94); rect(g, K.snow[4], 0, 130, VW, 2);
    spr(g, 'ev_stall_winter', 70, 196); spr(g, 'ev_stall_cocoa_winter', 250, 196); spr(g, 'ev_ice_swan', 160, 190); spr(g, 'ev_bunting_winter', 160, 140);
    flakes(g, t, 60); misa(g, 'up', 160, 220, t); } },
  star_tree: { music: 'night', draw(g, game, t) {
    sky(g, ['#18163a', '#24204c', '#302a5a'], 0, 150); stars(g, t, 60, 140, 19);
    rect(g, K.snow[3], 0, 150, VW, 74); skyline(g, 152, '#1a1838', 11);
    spr(g, 'ev_star_tree', 160, 206);
    for (let i = 0; i < 8; i++) if (Math.floor(t * 3 + i) % 3) rect(g, [K.butter[4], K.coral[3], K.sky[4]][i % 3], 136 + (i * 7) % 48, 140 + (i * 11) % 50, 2, 2);
    flakes(g, t, 40); misa(g, 'up', 120, 220, t); npc(g, 'nori', 'up', 200, 220, t); } },
  shrine_night: { music: 'shrine', draw(g, game, t) {
    sky(g, ['#0c0a20', '#141030', '#1c1840'], 0, 150); stars(g, t, 80, 140, 21);
    rect(g, K.stone[1], 0, 150, VW, 74); for (let y = 160; y < 224; y += 10) rect(g, K.stone[2], 0, y, VW, 1);
    rect(g, K.vermilion[1], 60, 40, 10, 112); rect(g, K.vermilion[1], 250, 40, 10, 112); rect(g, K.vermilion[2], 40, 32, 240, 10); rect(g, K.vermilion[3], 40, 32, 240, 2); rect(g, K.ink[2], 52, 50, 216, 6);
    rect(g, K.metal[1], 156, 60, 8, 30); disc(g, 160, 96, 12, K.butter[1], 10); disc(g, 158, 94, 6, K.butter[2], 5);
    const swing = Math.sin(t * 3) * 4; rect(g, K.ribbon[2], 159 + swing, 106, 3, 60); rect(g, K.paper[4], 158 + swing, 120, 5, 4);
    for (const x of [30, 290]) spr(g, 'ev_chochin_white', x, 200);
    misa(g, 'up', 160, 214, t); } },
  sunrise: { music: 'beach', draw(g, game, t) {
    const p = Math.min(1, t / 8);
    sky(g, ['#2a2458', '#6a4a80', '#e0707a', '#f4b048', '#ffe08a'], 0, 130);
    disc(g, 160, 132 - p * 26, 22, K.butter[4]); disc(g, 160, 132 - p * 26, 16, '#fffbe0');
    sea(g, 126, [K.water[0], K.water[1], K.coral[2], K.butter[3]], t, 180);
    for (let i = 0; i < 10; i++) rect(g, K.butter[4], 150 - i * 2 + Math.sin(t * 2 + i) * 3, 130 + i * 5, 20 + i * 4, 1);
    rect(g, K.sand[1], 0, 180, VW, 44); rect(g, K.sand[2], 0, 180, VW, 2);
    misa(g, 'up', 160, 214, t); npc(g, 'mum', 'up', 120, 214, t); npc(g, 'dad', 'up', 200, 214, t); mochi(g, 236, 214, t); } },
  meteors: { music: 'night', draw(g, game, t) {
    sky(g, ['#0a0820', '#120e2c', '#1c1840'], 0, 170); stars(g, t, 110, 160, 23);
    for (let k = 0; k < 4; k++) { const cyc = Math.floor((t + k * 0.9) / 1.8), p = ((t + k * 0.9) % 1.8) / 0.7; if (p > 1) continue; const x0 = 40 + hash(cyc, k, 5) * 240, y0 = 10 + hash(cyc, k, 6) * 50; for (let i = 0; i < 12; i++) { g.globalAlpha = (1 - i / 12) * (1 - p * 0.5); rect(g, K.butter[4], x0 + p * 70 - i * 3, y0 + p * 40 - i * 1.7, 2, 1); } g.globalAlpha = 1; }
    hills(g, 180, '#14102a', 8); misa(g, 'up', 140, 214, t); mochi(g, 176, 214, t); } },
  cleanup: { music: 'beach', draw(g, game, t) {
    sky(g, [K.sky[2], K.sky[3], K.sky[4]], 0, 110); sea(g, 110, K.water, t, 150); rect(g, K.sand[3], 0, 150, VW, 74);
    for (let i = 0; i < 4; i++) disc(g, 40 + i * 80, 150, 20, K.water[4], 2);
    spr(g, 'ev_cleanup_sign', 60, 200); spr(g, 'ev_trash_bags', 100, 204); spr(g, 'ev_trash_bags', 120, 206);
    misa(g, 'down', 170, 206, t); npc(g, 'hina', 'down', 216, 206, t); npc(g, 'ogawa', 'down', 260, 206, t); } },
  yuzu_bath: { music: 'home', draw(g, game, t) {
    rect(g, K.sky[4], 0, 0, VW, VH); for (let x = 0; x < VW; x += 20) for (let y = 0; y < 120; y += 20) rect(g, K.sky[3], x, y, 19, 19);
    rect(g, K.wood[2], 40, 110, 240, 80); rect(g, K.wood[3], 40, 110, 240, 4); rect(g, K.water[3], 48, 118, 224, 60); rect(g, K.water[4], 48, 118, 224, 3);
    for (let i = 0; i < 9; i++) { const x = 70 + i * 24 + Math.sin(t + i) * 3, y = 126 + (i % 3) * 14; disc(g, x, y, 6, K.butter[2], 5); disc(g, x - 2, y - 2, 2, K.butter[4]); }
    for (let i = 0; i < 12; i++) { g.globalAlpha = 0.4; disc(g, 60 + i * 18, (100 - t * 10 - i * 9) % 100 + 10, 5, '#ffffff', 3); } g.globalAlpha = 1;
    rect(g, K.skinLight[3], 150, 112, 22, 10); disc(g, 160, 104, 9, K.hairBrown[2]); disc(g, 160, 108, 7, K.skinLight[3]); rect(g, K.ink[1], 156, 107, 2, 1); rect(g, K.ink[1], 162, 107, 2, 1); } },
  setsubun: { music: 'festival', draw(g, game, t) {
    rect(g, K.plaster[3], 0, 0, VW, 150); rect(g, K.wood[2], 0, 150, VW, 74); for (let x = 0; x < VW; x += 40) rect(g, K.wood[1], x, 150, 1, 74);
    rect(g, K.woodDark[2], 110, 30, 100, 120); rect(g, K.sky[3], 116, 36, 88, 108);
    spr(g, 'ev_oni_mask', 160 + Math.sin(t * 3) * 10, 110);
    for (let i = 0; i < 10; i++) { const p = ((t * 1.5 + i * 0.1) % 1); rect(g, K.butter[3], 140 + p * 30 + (i % 3) * 4, 200 - p * 100 - Math.sin(p * 3) * 20, 2, 2); }
    spr(g, 'ev_bean_box', 120, 214); misa(g, 'up', 150, 214, t); mochi(g, 200, 214, t); } },
  hina: { music: 'home', draw(g, game, t) {
    rect(g, K.plaster[3], 0, 0, VW, 150); rect(g, K.wood[2], 0, 150, VW, 74); for (let x = 30; x < VW; x += 70) { rect(g, K.paper[4], x, 20, 40, 60); rect(g, K.wood[1], x + 19, 20, 2, 60); }
    spr(g, 'ev_hina', 160, 196); rect(g, K.ribbon[1], 100, 196, 120, 6);
    misa(g, 'up', 90, 214, t); mochi(g, 240, 214, t); } },
};
for (const [id, def] of Object.entries(BACKDROPS)) register('backdrop', id, def);
