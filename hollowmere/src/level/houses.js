// Generic building constructor: walls with doors and windows on the grid, floor, ceiling, timber
// frame, gable roof. Returns a handle for furnishing the inside.
import * as E from '../../../engine/index.js';
import { Builder } from './builder.js';

const P = Builder.prototype;
const SIDES = { S: { axis: 'x', out: -1 }, N: { axis: 'x', out: 1 }, W: { axis: 'z', out: -1 }, E: { axis: 'z', out: 1 } };

// o: { id, x, z, w, d, h, wall, roof, roofMat, door: {side, at, w, locked, keyId, lockLevel, gate, hinge, id}, doors: [...], windows: [{side, at, w}], floor, timber, ridge, rise, chunk, y, noRoof, ceilMat }
P.house = function house(o) {
  const { x, z, w, d, h = 4, y = 0 } = o, chunk = o.chunk || o.id || 'house' + Math.round(x + z * 7);
  this.useChunk(chunk);
  const wallMat = o.wall || 'plaster', t = o.t ?? 0.8;
  const doors = [...(o.doors || []), ...(o.door ? [o.door] : [])];
  const result = { id: o.id, x, z, w, d, h, doors: [], chunk, inner: [x + 1, z + 1, x + w - 1, z + d - 1], bounds: [x, z, x + w, z + d], y };
  for (const [side, S] of Object.entries(SIDES)) {
    const len = S.axis === 'x' ? w : d;
    const c = side === 'S' ? z + 0.5 : side === 'N' ? z + d - 0.5 : side === 'W' ? x + 0.5 : x + w - 0.5;
    const ops = [];
    for (const dd of doors) if (dd.side === side) ops.push({ at: dd.at, w: dd.w ?? 1.7, top: dd.h ?? 2.5, sill: 0, kind: dd.kind || 'door', ref: dd });
    for (const win of o.windows || []) if (win.side === side) ops.push({ at: win.at, w: win.w ?? 1.0, top: win.top ?? 2.4, sill: win.sill ?? 1.05, kind: win.kind || 'window' });
    this.wall({ axis: S.axis, a: S.axis === 'x' ? x : z, b: S.axis === 'x' ? x + len : z + len, c, y0: y, h, t, mat: wallMat, openings: ops, chunk, kind: 'stone', cap: null });
    if (o.timber !== false && wallMat.startsWith('plaster')) this.frame({ axis: S.axis, a: S.axis === 'x' ? x : z, b: S.axis === 'x' ? x + len : z + len, c, y0: y, h, side: S.out, t, chunk });
    for (const op of ops) if (op.ref && op.kind !== 'arch' && !op.ref.open) {
      const cx = S.axis === 'x' ? (S.axis === 'x' ? x : 0) + op.at : c, cz = S.axis === 'x' ? c : z + op.at;
      const dw = op.ref.gate ? op.w / 2 : op.w;
      const mk = (hinge, px, pz) => this.door({ axis: S.axis, x: px, z: pz, y, w: op.ref.gate ? dw : op.w, h: op.top, hinge, locked: !!op.ref.locked, keyId: op.ref.keyId || null, lockLevel: op.ref.lockLevel || 1, id: op.ref.id || null, chunk, gate: !!op.ref.gate, name: op.ref.name || 'door', mat: op.ref.mat || 'door', autoClose: op.ref.autoClose !== false });
      if (op.ref.gate) { const a = S.axis === 'x' ? x + op.at : z + op.at; const dl = mk('a', S.axis === 'x' ? a - dw / 2 : c, S.axis === 'x' ? c : a - dw / 2), dr = mk('b', S.axis === 'x' ? a + dw / 2 : c, S.axis === 'x' ? c : a + dw / 2); result.doors.push(dl, dr); (result.gates ||= []).push([dl, dr]); }
      else result.doors.push(mk(op.ref.hinge || 'a', S.axis === 'x' ? x + op.at : c, S.axis === 'x' ? c : z + op.at));
    }
  }
  // floor, ceiling, indoors
  const ix0 = x + 0.5, iz0 = z + 0.5, ix1 = x + w - 0.5, iz1 = z + d - 0.5;
  if (o.floor !== null) this.vbox(o.floor || 'floorWood', ix0, y - 0.05, iz0, ix1, y + 0.02, iz1, { chunk });
  if (!o.open) { this.vbox(o.ceilMat || 'timber', x + 0.1, y + h, z + 0.1, x + w - 0.1, y + h + 0.16, z + d - 0.1, { chunk }); }
  this.nav.setIndoor(x + 1, z + 1, x + w - 1, z + d - 1, o.underground ? 2 : 1);
  this.nav.setNoise(x + 1, z + 1, x + w - 1, z + d - 1, o.noise ?? 2);
  this.nav.setZone(x, z, x + w, z + d, o.zone ?? 0);
  if (o.roof !== false && !o.open) this.gableRoof({ x0: x - 0.2, z0: z - 0.2, x1: x + w + 0.2, z1: z + d + 0.2, y: y + h + 0.16, rise: o.rise ?? Math.min(w, d) * 0.42, mat: o.roofMat || 'roofSlate', ridge: o.ridge, chunk, over: 0.5 });
  if (o.chimney) { const [cx, cz] = o.chimney; this.solid('stoneDark', cx - 0.5, y + h, cz - 0.5, cx + 0.5, y + h + (o.rise ?? 3) + 2, cz + 0.5, { chunk, nav: false, collide: false }); }
  result.door = result.doors[0];
  return result;
};
export const inRect = (b, px, pz, m = 0) => px > b.bounds[0] + m && px < b.bounds[2] - m && pz > b.bounds[1] + m && pz < b.bounds[3] - m;
