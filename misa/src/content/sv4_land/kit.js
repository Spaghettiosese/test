// Map-building helpers for sv4_land: tree scatter, trail drawing, steam overlays, interior registration.
import { register } from '../../core/registry.js';
import { hash, prop, LEGEND } from '../town/lib.js';

export const MLEGEND = { ...LEGEND, T: 'coast_wood', S: 'wall_stone', D: 'town_bridge' };
const PATHY = ':=g+~B_sD';
const KINDS = ['maple', 'pine', 'pine_b', 'pine_s', 'maple_s', 'oak'];
// Trees on edge tiles (decor) and scattered over grass (solid), keeping clear of paths and of the given objects.
export function scatter(rows, objs = [], { seed = 21, dens = 0.28, kinds = KINDS, edge = 'T', keepX = () => false } = {}) {
  const keep = new Set();
  for (const o of objs) for (let j = o.y - 1; j <= o.y + (o.h || 1); j++) for (let i = o.x - 1; i <= o.x + (o.w || 1); i++) keep.add(`${i},${j}`);
  const out = [];
  for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[0].length; x++) {
    const ch = rows[y][x], k = kinds[Math.floor(hash(x, y, seed) * kinds.length)];
    if (ch === edge) { if (hash(x, y, 5) < 0.85) out.push(prop(`town_tree_${k}`, x, y, { solid: false })); continue; }
    if (ch !== '.' || keep.has(`${x},${y}`) || keepX(x, y)) continue;
    let near = false;
    for (let j = -1; j <= 1 && !near; j++) for (let i = -1; i <= 1; i++) if (rows[y + j] && PATHY.includes(rows[y + j][x + i] || '.')) { near = true; break; }
    if (!near && hash(x, y, 11) < dens) out.push(prop(`town_tree_${k}`, x, y, { shadow: 12 }));
  }
  return out;
}
// Trail through waypoints, a w-wide ribbon of ch.
export function trail(g, pts, w = 3, ch = ':') {
  const r = (w - 1) >> 1;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    if (x0 === x1) g.fill(x0 - r, Math.min(y0, y1) - r, w, Math.abs(y1 - y0) + w, ch); else g.fill(Math.min(x0, x1) - r, y0 - r, Math.abs(x1 - x0) + w, w, ch);
  }
}
export const interior = (id, def) => register('map', id, { indoor: true, interiors: true, music: 'home', bg: '#1e1624', ...def });
// Rising steam puffs over an object (screen-space overlay; ox/oy px from the object's tile origin).
export const steam = (ox = 8, oy = 0, n = 5) => (game, world, o) => {
  const g = world.g, t = game.clock, cx = world.sx(o.x * 16 + ox), by = world.sy(o.y * 16 + oy);
  g.save(); g.fillStyle = '#ffffff';
  for (let i = 0; i < n; i++) {
    const ph = (t * 0.5 + i / n) % 1, x = cx + Math.sin(t + i * 2.1) * 4 + (i - n / 2) * 3, y = by - ph * 22;
    g.globalAlpha = 0.5 * (1 - ph); g.fillRect(Math.round(x), Math.round(y), 3 + Math.round(ph * 3), 2 + Math.round(ph * 2));
  }
  g.restore();
};
export const merge = (...bs) => ({ objs: bs.map((b) => b.obj), warps: bs.flatMap((b) => b.warps), spawns: Object.assign({}, ...bs.map((b) => b.spawns)) });
