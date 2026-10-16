// Shared helpers: walkable tile scans for daily spawns (forage, pan spots) and small effects.
import { buildMap, TILE } from '../../world/map.js';
import { get } from '../../core/registry.js';
import { plotRects } from '../hobbies/world.js';
import { isWater } from '../hobbies/common.js';

const SCAN = new Map();
// Free, walkable tiles of a map with their ground kind. Cached: maps are static (dynamic things live in layers).
export function mapTiles(mapId) {
  if (SCAN.has(mapId)) return SCAN.get(mapId);
  let out = [];
  if (get('map', mapId)) {
    try {
      const m = buildMap(mapId), plots = plotRects(m), solid = new Set();
      for (const o of m.objects) if (o.solid !== false && !o.flat && !o.wall) for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) solid.add(`${x},${y}`);
      const near = (x, y, f) => [[0, 1], [1, 0], [-1, 0], [0, -1]].some(([dx, dy]) => { const n = m.tiles[y + dy] && m.tiles[y + dy][x + dx]; return !!n && f(n); });
      const edge = (x, y) => (m.warps || []).some((w) => x >= w.x - 1 && x <= w.x + (w.w || 1) && y >= w.y - 1 && y <= w.y + (w.h || 1)) || Object.values(m.spawns).some((s) => Math.abs(s[0] - x) < 1 && Math.abs(s[1] - y) < 1);
      for (let y = 1; y < m.h - 1; y++) for (let x = 1; x < m.w - 1; x++) {
        const t = m.tiles[y][x];
        if (!t || t.solid || solid.has(`${x},${y}`) || edge(x, y) || plots.some(([a, b, w, h]) => x >= a && y >= b && x < a + w && y < b + h)) continue;
        out.push({ x, y, ground: t.ground || (t.floor ? 'floor' : ''), nearWater: near(x, y, isWater), wet: isWater(t) });
      }
    } catch { out = []; }
  }
  SCAN.set(mapId, out);
  return out;
}
export const GRASSY = ['grass', 'meadow', 'lawn'];
export function pickN(rng, list, n) {
  const a = list.slice(), out = [];
  for (let i = 0; i < n && a.length; i++) out.push(a.splice(Math.floor(rng() * a.length), 1)[0]);
  return out;
}
export function fx(game, x, y, n = 6, c = '#fff6a0') {
  const w = game.world; if (!w || !w.particles) return;
  for (let i = 0; i < n; i++) w.particles.push({ c, x: x + (Math.random() - 0.5) * 10, y: y - Math.random() * 8, vx: (Math.random() - 0.5) * 30, vy: -20 - Math.random() * 30, life: 0.5 + Math.random() * 0.4, s: 2 });
}
export const centre = (tx, ty) => [tx * TILE + 8, ty * TILE + 8];
