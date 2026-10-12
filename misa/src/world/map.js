// Map model. Maps are authored as compact JS data and registered with register('map', id, def):
//
// register('map', 'town', {
//   name: 'Hoshimori Square', outdoor: true, music: 'town',
//   legend: { '.': 'grass', '=': 'path', '~': 'water', '#': 'wall' },   // char -> registered tile id
//   rows: ['....==....', ...],                                         // ground layer, one char per 16px tile
//   objects: [{ spr: 'tree', x: 3, y: 4, w: 1, h: 1 }],                  // props: footprint in tiles, sprite bottom-aligned
//   warps: [{ x: 5, y: 0, to: 'school', tx: 10, ty: 18, dir: 'up' }],    // step onto the tile to travel
//   spawns: { default: [5, 5] },
//   onEnter(game) {},
// });
//
// Tile defs: register('tile', 'grass', { spr: 't_grass', solid: false, seasonal: { winter: 't_snow' }, anim: ['t_water0','t_water1'], walkSfx })
// Object fields: spr, x, y, w, h (footprint tiles), solid (default true), flat (drawn under actors),
//   wall (drawn into the static layer), dx/dy (pixel nudge), fp ([x,y,w,h] tile override for collision),
//   interact: { label, run(game, obj) } | { label, script: 'scriptId' }, when(game) -> bool (conditional prop),
//   sprFn(game) -> sprite id (stateful sprites, e.g. wilted plants).
import { get } from '../core/registry.js';
import { check } from '../core/cond.js';

export const TILE = 16;

export function buildMap(id) {
  const def = get('map', id);
  if (!def) throw new Error(`unknown map ${id}`);
  const rows = def.rows, h = rows.length, w = Math.max(...rows.map((r) => r.length));
  const tiles = [];
  for (let y = 0; y < h; y++) {
    const row = [];
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x] ?? ' ';
      const tid = def.legend[ch] ?? def.legend[' '] ?? 'void';
      const t = get('tile', tid);
      if (!t) throw new Error(`map ${id}: tile "${tid}" (char "${ch}") is not registered`);
      row.push(t);
    }
    tiles.push(row);
  }
  const objects = (def.objects || []).map((o, i) => {
    const out = { solid: true, w: 1, h: 1, ...o, key: `${id}#${i}` };
    if (o.use) { // shared interactions registered by systems: register('interaction', id, { label, run, when?, sprFn?, overlay? })
      const it = get('interaction', o.use);
      if (!it) { // the validator reports this; at runtime keep the game playable
        console.warn(`map ${id}: interaction "${o.use}" is not registered`);
        out.interact = { label: 'Look', run: (g) => g.toast && g.toast('Nothing to do here yet.') };
        return out;
      }
      out.interact = it; if (it.sprFn) out.sprFn = it.sprFn; if (it.overlay) out.overlay = it.overlay;
    }
    return out;
  });
  return { id, def, w, h, tiles, objects, warps: def.warps || [], spawns: def.spawns || {}, pw: w * TILE, ph: h * TILE };
}

// Named positions: map.spots (NPC stops, props) and map.spawns (arrival points). Values: [tx, ty] or [tx, ty, dir].
export function spotOf(m, stop) {
  if (stop.pos) return stop.pos;
  const name = stop.spot, v = (m.def.spots && m.def.spots[name]) || (m.spawns && m.spawns[name]);
  if (!v) { console.warn(`map ${m.id}: unknown spot "${name}"`); return m.spawns.default || [1, 1]; }
  return v;
}
// Resolve a warp target: { to: 'town:cafe_door' } (named spawn), { to: 'town', at: 'cafe_door' } or { to: 'town', tx, ty }.
export function warpTarget(w) {
  const [mapId, spawnName] = String(w.to).split(':');
  const spawn = spawnName || w.at;
  if (spawn) {
    const def = get('map', mapId);
    const v = def && def.spawns && def.spawns[spawn];
    if (!v) throw new Error(`warp to unknown spawn ${mapId}:${spawn}`);
    return { map: mapId, tx: v[0], ty: v[1], dir: v[2] || w.dir };
  }
  return { map: mapId, tx: w.tx, ty: w.ty, dir: w.dir };
}

export const tileAt = (m, tx, ty) => (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h ? null : m.tiles[ty][tx]);
export const tileSolid = (m, tx, ty) => { const t = tileAt(m, tx, ty); return !t || !!t.solid; };

export const footprint = (o) => (o.fp ? o.fp.map((v) => v * TILE) : [o.x * TILE, o.y * TILE, o.w * TILE, o.h * TILE]);
export const activeObjects = (m, game) => m.objects.filter((o) => !o.when || check(o.when, game));

export function solidRects(m, game) {
  return activeObjects(m, game).filter((o) => o.solid && !o.flat && !o.wall).map(footprint);
}

const hit = (ax, ay, aw, ah, r) => ax < r[0] + r[2] && ax + aw > r[0] && ay < r[1] + r[3] && ay + ah > r[1];
export function blocked(m, x, y, w, h, rects) {
  const x0 = Math.floor(x / TILE), x1 = Math.floor((x + w - 0.01) / TILE), y0 = Math.floor(y / TILE), y1 = Math.floor((y + h - 0.01) / TILE);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (tileSolid(m, tx, ty)) return true;
  return rects.some((r) => hit(x, y, w, h, r));
}
// Move a feet-box (centred on x, bottom at y) with axis-separated sliding.
export function moveBody(m, b, dx, dy, rects, w = 8, h = 5) {
  if (!blocked(m, b.x + dx - w / 2, b.y - h, w, h, rects)) b.x += dx;
  if (!blocked(m, b.x - w / 2, b.y + dy - h, w, h, rects)) b.y += dy;
}

// Grid of walkable tiles for NPC pathfinding (objects block their footprint tiles).
export function passGrid(m, game, objs = activeObjects(m, game)) {
  const g = Array.from({ length: m.h }, (_, y) => Array.from({ length: m.w }, (_, x) => !tileSolid(m, x, y)));
  for (const o of objs) {
    if (!o.solid || o.flat || o.wall) continue;
    const [px, py, pw, ph] = footprint(o);
    for (let ty = Math.floor(py / TILE); ty < Math.ceil((py + ph) / TILE); ty++)
      for (let tx = Math.floor(px / TILE); tx < Math.ceil((px + pw) / TILE); tx++) if (g[ty] && g[ty][tx] !== undefined) g[ty][tx] = false;
  }
  return g;
}

export const distToRect = (px, py, r) => {
  const cx = Math.max(r[0], Math.min(px, r[0] + r[2])), cy = Math.max(r[1], Math.min(py, r[1] + r[3]));
  return Math.hypot(px - cx, py - cy);
};

export function warpAt(m, px, py) {
  const tx = Math.floor(px / TILE), ty = Math.floor((py - 2) / TILE);
  return m.warps.find((w) => tx >= w.x && tx < w.x + (w.w || 1) && ty >= w.y && ty < w.y + (w.h || 1));
}
