// Seto Islands map toolkit: tiles, grids, doors, interior rooms and a registrar that keeps maps loadable while shared
// interactions or neighbour maps are missing (same idea as coast/util.js coastMap).
import { register, registerMany, get } from '../../core/registry.js';
import { grid, coastMap } from '../coast/util.js';
import { prop } from '../town/lib.js';
import { sprW } from '../town/lib.js';
import './art.js';
import { BLD } from './art.js';

registerMany('tile', {
  sv4_sea: { ground: 'ocean' },                       // open water you can sail on (walkable; the boat is drawn under Misa)
  sv4_land: { ground: 'sand', solid: true },          // islands on the sea map
  sv4_green: { ground: 'grass', solid: true },
  sv4_rock: { ground: 'dirt', solid: true },
  sv4_deck: { ground: 'ocean' },                      // walkable water under pier planks / boardwalk
  sv4_wood: { ground: 'grass', solid: true },         // tree line
  sv4_cliff: { ground: 'dirt', solid: true },
  sv4_wall: { wall: 'wood', solid: true },
  sv4_stonewall: { wall: 'stone', solid: true },
  sv4_floor_sand: { floor: 'planks', tint: 'sand' },
  sv4_mossfloor: { floor: 'stone' },
});
export { grid, prop };

// Plank objects over deck tiles ('p' in the grid): baked into the ground like the harbour pier.
export function deckObjects(G, ch = 'p', skipEdge = false) {
  const out = [];
  G.each((x, y, c) => {
    if (c !== ch) return;
    const l = G.get(x - 1, y) !== ch, r = G.get(x + 1, y) !== ch, b = G.get(x, y + 1) !== ch;
    out.push({ spr: `coast_pier_${b ? 'b' : ''}${l ? 'l' : r ? 'r' : 'm'}`, x, y, wall: true, solid: false });
    if (b && !skipEdge) out.push({ spr: 'coast_piles', x, y: y + 1, wall: true, solid: false, dy: -10 });
  });
  return out;
}

// Outdoor island map. Interactions that belong to another area but are missing fall back to a gentle look (coastMap does that).
export function isle(id, def) {
  return coastMap(id, { outdoor: true, music: 'beach', ...def });
}

// A stilt building prop with a door warp below it: returns { obj, warp, spawn } (door tile = tile below the footprint).
export function house(name, x, y, o = {}) {
  const [tw] = BLD[name] || [Math.ceil(sprW(name) / 32)];
  const obj = prop(name, x, y, { w: tw, h: 1, shadow: tw * 14, ...(o.obj || {}) });
  if (o.use) obj.use = o.use;
  if (o.glow) obj.light = o.glow === true ? [{ kind: 'window', x: 14, y: -12 }, { kind: 'window', x: tw * 16 + 24, y: -12 }] : o.glow;
  const out = { obj };
  if (o.to) {
    const dx = o.door ?? Math.floor(tw / 2);
    out.warp = { x: x + dx, y: y + 1, to: o.to, enter: 'up', ...(o.hours || {}) };
    out.spawn = [x + dx, y + 2, 'down'];
    out.door = [x + dx, y + 1];
  }
  return out;
}

// Interior room: returns { G, legend } with walls on the top two rows and the border, floor inside, door tile 'd' at (doorX, h-1).
export function room(w, h, doorX, floor = 'int_fl_planks', wall = 'int_wall_wood') {
  const G = grid(w, h, '#');
  G.rect(1, 2, w - 2, h - 3, '.');
  G.set(doorX, h - 1, 'd');
  return { G, legend: { '#': wall, '.': floor, d: 'int_fl_door' } };
}
export function inn(id, def) {
  return register('map', id, { indoor: true, interiors: true, music: 'library', bg: '#1e1624', ...def });
}
// A wrapper that returns a getter-copy of a registered map (some neighbour maps use non-configurable getters, so we copy their descriptors).
export function wrapMap(id, { warps = [], objects = [], spawns = {}, spots = {} } = {}) {
  const old = get('map', id);
  if (!old || old.__sv4) return old;
  const ds = Object.getOwnPropertyDescriptors(old);
  for (const d of Object.values(ds)) d.configurable = true;
  const copy = Object.defineProperties({}, ds);
  const get2 = (k) => { const d = Object.getOwnPropertyDescriptor(old, k); return d && d.get ? () => d.get.call(old) : () => old[k] || []; };
  const bw = get2('warps'), bo = get2('objects');
  Object.defineProperty(copy, 'warps', { get: () => [...bw(), ...warps.map((w) => (typeof w === 'function' ? w() : w))], enumerable: true, configurable: true });
  Object.defineProperty(copy, 'objects', { get: () => [...bo(), ...objects.flatMap((o) => (typeof o === 'function' ? o() : [o]))], enumerable: true, configurable: true });
  copy.spawns = { ...(old.spawns || {}), ...spawns };
  copy.spots = { ...(old.spots || {}), ...spots };
  Object.defineProperty(copy, '__sv4', { value: true, enumerable: false });
  const R = get2;
  void R;
  registerReplace(id, copy);
  return copy;
}
import { R as REG } from '../../core/registry.js';
function registerReplace(id, copy) { REG.map[id] = copy; }
