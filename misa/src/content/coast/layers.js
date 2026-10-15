// Living coast: waves washing the shore, bobbing boats and buoys, seagulls that take off when you come close,
// footprints in the sand, falling petals / leaves and fireflies on the hill, the dark of the sea cave, the
// lighthouse beam, and tide-covered sand that blocks the way at high tide.
import { register, features, get } from '../../core/registry.js';
import { RAMPS as C, SHADOW } from '../../gfx/palette.js';
import { hash } from '../../gfx/noise.js';
import { darkness } from '../../gfx/lighting.js';
import { tideAt } from './tides.js';

const TILE = 16;
const onMap = (w, ...ids) => w.map && ids.includes(w.map.id);

// ---------- waves (found by scanning the baked ground for where water meets land) ----------
const WATER = new Set([C.water[1], C.water[2], C.water[3]].map((h) => parseInt(h.slice(1), 16)));
const SANDS = new Set(C.sand.map((h) => parseInt(h.slice(1), 16)));
let shore = null, shoreFor = null;
function scanShore(world) {
  const c = world.static, g = c.getContext('2d'), { width: w, height: h } = c, d = g.getImageData(0, 0, w, h).data;
  const at = (x, y) => { const o = (y * w + x) * 4; return (d[o] << 16) | (d[o + 1] << 8) | d[o + 2]; };
  const pts = [];
  for (let x = 0; x < w; x++) for (let y = 1; y < h; y++) if (WATER.has(at(x, y)) && !WATER.has(at(x, y - 1))) pts.push([x, y, SANDS.has(at(x, y - 1)) ? 1 : 0]);
  shore = pts; shoreFor = c;
}
register('worldLayer', 'coast_waves', {
  below(g, world, game) {
    if (!onMap(world, 'beach', 'harbour')) return;
    if (shoreFor !== world.static) scanShore(world);
    const t = game.clock, cx = Math.round(world.cam.x), cy = Math.round(world.cam.y), W = C.water, S = C.sand;
    for (const [x, y, sandy] of shore) {
      const X = x - cx, Y = y - cy;
      if (X < 0 || X >= 320 || Y < -10 || Y > 234) continue;
      const s = Math.sin(t * 1.2 + x * 0.03 + Math.sin(x * 0.011) * 2);
      if (sandy) {
        const reach = Math.round((s + 1) * 3.5);
        if (reach > 0) { g.fillStyle = W[3]; g.fillRect(X, Y - reach, 1, reach); }
        g.fillStyle = W[5]; g.fillRect(X, Y - reach - 1, 1, 1);
        if ((x + Math.floor(t * 3)) % 4 === 0) { g.fillStyle = W[4]; g.fillRect(X, Y - reach, 1, 1); }
        g.fillStyle = S[1]; if (hash(x, 1, 7) < 0.5 + s * 0.3) g.fillRect(X, Y - reach - 2, 1, 1);
      } else if (s > 0.2 && (x >> 1) % 3) { g.fillStyle = W[5]; g.fillRect(X, Y + (s > 0.7 ? 1 : 0), 1, 1); }
    }
  },
});

// ---------- tide-covered sand: walkable only at low tide (or to wade back out) ----------
export const TIDAL = { beach: [] }; // filled by maps.js: arrays of region tile lists
register('worldLayer', 'coast_tide_solids', {
  solids(world, game) {
    const regions = world.map && TIDAL[world.map.id];
    if (!regions || tideAt(game) === 'low') return [];
    const p = world.player, ptx = Math.floor(p.x / TILE), pty = Math.floor((p.y - 1) / TILE), out = [];
    for (const reg of regions) {
      if (reg.some(([x, y]) => x === ptx && y === pty)) continue; // already out there: let her wade back
      for (const [x, y] of reg) out.push([x * TILE, y * TILE, TILE, TILE]);
    }
    return out;
  },
});

// ---------- bobbing boats and buoys ----------
export const FLOATERS = { harbour: [] }; // [{ spr, x, y (world px, sprite top-left), amp, ph }]
register('worldLayer', 'coast_floaters', {
  sprites(world, game) {
    const list = world.map && FLOATERS[world.map.id];
    if (!list) return [];
    return list.map((f) => ({ y: f.y + (f.base || 40), draw: (g, w) => {
      const img = w.img(f.spr); if (!img) return;
      const bob = Math.round(Math.sin(game.clock * 1.6 + f.ph) * f.amp);
      g.drawImage(img, w.sx(f.x) - w.pad(f.spr), w.sy(f.y) - w.pad(f.spr) + bob);
      g.fillStyle = C.water[4]; const bx = w.sx(f.x) + 4, by = w.sy(f.y) + img.height - 3;
      for (let i = 0; i < img.width - 8; i += 3) if ((i + Math.floor(game.clock * 4)) % 7 < 3) g.fillRect(bx + i, by + (bob > 0 ? 1 : 0), 2, 1);
    } }));
  },
});

// ---------- seagulls ----------
const GULLS = { harbour: [[12, 9], [18, 9], [34, 9], [9, 19], [40, 9]], beach: [[16, 13], [27, 12], [36, 10], [21, 20], [6, 11]] };
let gulls = [], gullMap = null;
register('worldTick', 'coast_gulls', {
  update(dt, world, game) {
    const id = world.map && world.map.id;
    if (gullMap !== id) { gullMap = id; gulls = (GULLS[id] || []).map(([x, y], i) => ({ hx: x * TILE + 8, hy: y * TILE + 10, x: x * TILE + 8, y: y * TILE + 10, st: 'sit', t: hash(i, 3, 1) * 3, ph: i })); }
    const p = world.player;
    for (const b of gulls) {
      b.t += dt;
      if (b.st === 'sit' && Math.hypot(p.x - b.x, p.y - b.y) < 30) { b.st = 'fly'; b.vx = (b.x > p.x ? 1 : -1) * 60; b.t = 0; game.sfx('pop'); }
      else if (b.st === 'fly') { b.x += b.vx * dt; b.y -= 34 * dt; if (b.t > 4) { b.st = 'away'; b.t = 0; } }
      else if (b.st === 'away' && b.t > 20 && Math.hypot(p.x - b.hx, p.y - b.hy) > 70) { b.st = 'sit'; b.x = b.hx; b.y = b.hy; }
    }
  },
});
register('worldLayer', 'coast_gull_draw', {
  sprites(world, game) {
    if (!GULLS[world.map.id] || gullMap !== world.map.id || game.minutes >= 20 * 60 || game.minutes < 5 * 60 || game.weather === 'storm') return [];
    return gulls.filter((b) => b.st !== 'away').map((b) => ({ y: b.st === 'fly' ? b.y + 400 : b.y, draw: (g, w) => {
      const fly = b.st === 'fly', name = fly ? `coast_gull_fly${Math.floor(b.t * 8) % 2}` : `coast_gull_${Math.floor(b.t / 1.7 + b.ph) % 4 === 0 ? 1 : 0}`;
      if (!fly) w.shadow(b.x, b.y, 5);
      w.drawFeet(name, b.x, b.y, fly ? b.vx < 0 : b.ph % 2 === 1);
    } }));
  },
});

// ---------- footprints in the sand ----------
let prints = [], printMap = null, lastPrint = null;
register('worldTick', 'coast_prints', {
  update(dt, world, game) {
    if (printMap !== world.map.id) { printMap = world.map.id; prints = []; lastPrint = null; }
    if (world.map.id !== 'beach') return;
    for (const q of prints) q.age += dt;
    prints = prints.filter((q) => q.age < 25);
    const p = world.player, t = world.map.tiles[Math.floor((p.y - 2) / TILE)]?.[Math.floor(p.x / TILE)];
    if (!p.moving || !t || t.ground !== 'sand') return;
    if (!lastPrint || Math.hypot(p.x - lastPrint.x, p.y - lastPrint.y) > 5) { lastPrint = { x: p.x, y: p.y, side: lastPrint ? -lastPrint.side : 1, age: 0, h: p.dir === 'left' || p.dir === 'right' }; prints.push(lastPrint); if (prints.length > 80) prints.shift(); }
  },
});
register('worldLayer', 'coast_prints_draw', {
  below(g, world) {
    if (world.map.id !== 'beach') return;
    for (const q of prints) {
      if (q.age > 18 && hash(Math.floor(q.x), Math.floor(q.y), Math.floor(q.age * 4)) < (q.age - 18) / 7) continue;
      const x = world.sx(q.x) + (q.h ? 0 : q.side * 3), y = world.sy(q.y) - 2 + (q.h ? q.side * 2 : 0);
      g.fillStyle = C.sand[1]; g.fillRect(x - 1, y, 3, 2); g.fillStyle = C.sand[4]; g.fillRect(x - 1, y + 2, 3, 1);
    }
  },
});

// ---------- petals, leaves and fireflies on the hill and in the park-side home ----------
register('worldLayer', 'coast_hill_air', {
  overlay(g, world, game) {
    if (!onMap(world, 'shrine')) return;
    const t = game.clock, s = game.season, h = game.minutes / 60;
    if (s === 'summer' && (h >= 19.5 || h < 4)) {
      for (let i = 0; i < 22; i++) { const x = ((hash(i, 1, 9) * 360 + Math.sin(t * 0.7 + i) * 24) % 340) - 10, y = (hash(i, 2, 9) * 230 + Math.cos(t * 0.5 + i * 2) * 14) % 224; if ((Math.floor(t * 3) + i) % 4 === 0) continue; g.fillStyle = '#e8ff9a'; g.fillRect(Math.round(x), Math.round(y), 2, 2); g.fillStyle = 'rgba(232,255,154,0.25)'; g.fillRect(Math.round(x) - 2, Math.round(y) - 2, 6, 6); }
      return;
    }
    if ((s !== 'spring' && s !== 'autumn') || h >= 19 || game.weather === 'rain' || game.weather === 'storm') return;
    const cols = s === 'spring' ? [C.sakura[2], C.sakura[3]] : [C.leafAutumn[2], C.leafAutumn[3], C.butter[2]];
    for (let i = 0; i < 26; i++) {
      const sp = 14 + hash(i, 3, 9) * 12, x = ((hash(i, 4, 9) * 360 + t * sp * 0.8 + Math.sin(t * 1.3 + i) * 10 - world.cam.x * 0.2) % 340 + 340) % 340 - 10, y = ((hash(i, 5, 9) * 240 + t * sp - world.cam.y * 0.2) % 240 + 240) % 240 - 8;
      g.fillStyle = cols[i % cols.length]; const f = Math.floor(t * 4 + i) % 2;
      g.fillRect(Math.round(x), Math.round(y), f ? 2 : 1, f ? 1 : 2);
    }
  },
});

// ---------- the sea cave is dark: a soft halo around Misa, light from the mouth, glowing pools and crystals ----------
let CV = null, cx2 = null;
const disc = (c, x, y, r, col) => { const ry = Math.round(r * 0.75); c.fillStyle = col; for (let j = -ry; j <= ry; j++) { const w = Math.floor(r * Math.sqrt(Math.max(0, 1 - (j * j) / (ry * ry)))); c.fillRect(Math.round(x - w), Math.round(y + j), w * 2 + 1, 1); } };
export const CAVE_GLOWS = []; // [{ x, y (tiles), r, col }] filled by maps.js
register('worldLayer', 'coast_cave_dark', {
  above(g, world, game) {
    if (!onMap(world, 'cave')) return;
    if (!CV) { CV = document.createElement('canvas'); CV.width = 320; CV.height = 224; cx2 = CV.getContext('2d'); }
    cx2.globalCompositeOperation = 'source-over'; cx2.fillStyle = '#4a4068'; cx2.fillRect(0, 0, 320, 224);
    cx2.globalCompositeOperation = 'lighter';
    const p = world.player, fl = Math.sin(game.clock * 2) * 2;
    for (let k = 0; k < 4; k++) disc(cx2, world.sx(p.x), world.sy(p.y - 12), 70 - k * 14 + fl, 'rgba(46,40,40,0.55)');
    for (const L of CAVE_GLOWS) for (let k = 0; k < 3; k++) disc(cx2, world.sx(L.x * TILE + 8), world.sy(L.y * TILE + 8), L.r * (1 - k / 3), L.col);
    cx2.globalCompositeOperation = 'source-over';
    g.globalCompositeOperation = 'multiply'; g.drawImage(CV, 0, 0); g.globalCompositeOperation = 'source-over';
    // drips
    for (let i = 0; i < 5; i++) { const ph = (game.clock * 0.6 + hash(i, 1, 4)) % 1, x = world.sx((3 + Math.floor(hash(i, 2, 4) * 18)) * TILE + 8), y0 = world.sy((3 + (i % 4)) * TILE); g.fillStyle = C.water[4]; if (ph < 0.8) g.fillRect(x, Math.round(y0 + ph * 40), 1, 2); else { g.fillRect(x - 2, y0 + 33, 1, 1); g.fillRect(x + 2, y0 + 33, 1, 1); } }
  },
});

// ---------- the lighthouse beam sweeps the bay at night once the lantern is lit ----------
export const BEAM = { beach: null }; // { x, y } world px of the lamp
register('worldLayer', 'coast_beam', {
  overlay(g, world, game) {
    const at = world.map && BEAM[world.map.id];
    if (!at || !game.flag('lantern_lit') || darkness(game.minutes) < 0.3) return;
    const a = game.clock * 0.9, dx = Math.cos(a), dy = Math.sin(a) * 0.45, sx = world.sx(at.x), sy = world.sy(at.y);
    g.fillStyle = 'rgba(255,236,170,0.10)';
    for (let k = 4; k < 260; k += 2) { const x = Math.round(sx + dx * k), y = Math.round(sy + dy * k), sp = 2 + Math.floor(k / 9); if (x < -20 || x > 340 || y < -20 || y > 244) continue; g.fillRect(x - 1, y - sp, 3, sp * 2); }
    g.fillStyle = '#fff4c0'; g.fillRect(sx - 3, sy - 3, 6, 6);
  },
});

// ---------- the lighthouse balcony looks out on open sky ----------
register('worldLayer', 'coast_lh_sky', {
  below(g, world, game) {
    if (!onMap(world, 'lighthouse')) return;
    const h = game.minutes / 60, night = h >= 19.5 || h < 5;
    const x = world.sx(15 * TILE), y0 = world.sy(0), y1 = world.sy(9 * TILE);
    for (let y = y0; y < y1; y++) { const t = (y - y0) / (y1 - y0); g.fillStyle = night ? (t < 0.6 ? '#0e0c24' : '#1b1b3a') : t < 0.5 ? '#7fc8f0' : t < 0.75 ? '#a8dcf5' : C.water[3]; g.fillRect(x, y, 32, 1); }
    if (night) for (let i = 0; i < 8; i++) { g.fillStyle = '#fffaf0'; g.fillRect(x + Math.floor(hash(i, 1, 3) * 30), y0 + Math.floor(hash(i, 2, 3) * (y1 - y0) * 0.6), 1, 1); }
  },
});

// ---------- small daily upkeep ----------
register('system', 'coast_upkeep', {
  init(game) {
    game.bus.on('dayStart', () => {
      const st = game.state.coast;
      if (st.speedDay && st.speedDay !== game.day) { if (game.state.flags.speedBoost === true) delete game.state.flags.speedBoost; st.speedDay = 0; }
    });
  },
});
// the tide washes sandcastles away
register('worldTick', 'coast_castle_tide', {
  update(dt, world, game) {
    const c = game.state.coast.castle;
    if (c && c.day === game.day && tideAt(game) === 'high') { game.state.coast.castle = null; if (world.map.id === 'beach') game.toast('The tide washed your sandcastle away.'); }
  },
});
void SHADOW; void get;

features('Coast & tides', [
  'Waves wash up and down the shore and lap against the harbour wall',
  'At low tide the sandbar and the cave mouth appear; at high tide the sea covers them again',
  'Boats, rowboats and buoys bob on the harbour water',
  'Seagulls perch on bollards and the beach, and flap away when you get close',
  'Misa leaves footprints in the sand that slowly fade',
  'The tidepool cave is dark: Misa sees by a soft halo, glowing pools and crystals, with dripping water',
  'Once the Star Lantern is lit, its beam sweeps across the beach at night',
]);
features('Shrine', [
  'Sakura petals in spring, falling maple leaves in autumn and fireflies on summer nights at the shrine',
]);
