// Turns the World's panels into merged chunk meshes (one mesh per 8 x 8 m x storey and material)
// and rebuilds only the chunks whose panels change. Static furniture is meshed once the same way.
import { Geometry, cylinder, sphere } from '../../../engine/geometry.js';
import { Mesh, Node } from '../../../engine/scene.js';
import { STOREY, WALL_T, SLAB_T } from './grid.js';

const HT = WALL_T / 2, CH = 8;

class Acc {
  constructor() { this.p = []; this.n = []; this.u = []; this.i = []; }
  quad(a, b, c, d, nx, ny, nz) {
    const o = this.p.length / 3;
    this.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], d[0], d[1], d[2]);
    for (let k = 0; k < 4; k++) this.n.push(nx, ny, nz);
    this.u.push(0, 0, 1, 0, 1, 1, 0, 1);
    this.i.push(o, o + 1, o + 2, o, o + 2, o + 3);
  }
  // axis-aligned box; f = which faces to emit { px, nx, py, ny, pz, nz }
  box(x0, y0, z0, x1, y1, z1, f = null) {
    if (!f || f.px) this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], 1, 0, 0);
    if (!f || f.nx) this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], -1, 0, 0);
    if (!f || f.py) this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], 0, 1, 0);
    if (!f || f.ny) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], 0, -1, 0);
    if (!f || f.pz) this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], 0, 0, 1);
    if (!f || f.nz) this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], 0, 0, -1);
  }
  geo(g, tx, ty, tz) {
    const o = this.p.length / 3, P = g.positions;
    for (let k = 0; k < P.length; k += 3) this.p.push(P[k] + tx, P[k + 1] + ty, P[k + 2] + tz);
    for (let k = 0; k < g.normals.length; k++) this.n.push(g.normals[k]);
    for (let k = 0; k < g.uvs.length; k++) this.u.push(g.uvs[k]);
    for (let k = 0; k < g.indices.length; k++) this.i.push(g.indices[k] + o);
  }
  build() { return new Geometry({ positions: this.p, normals: this.n, uvs: this.u, indices: this.i }); }
  get empty() { return this.i.length === 0; }
}

const cylCache = new Map(), sphCache = new Map();
const cylGeo = (r, h, seg) => { const k = `${r}|${h}|${seg}`; let g = cylCache.get(k); if (!g) cylCache.set(k, (g = cylinder({ radiusTop: r, radiusBottom: r, height: h, radialSegments: seg, heightSegments: 1, capTop: true, capBottom: true }))); return g; };
const sphGeo = (r) => { let g = sphCache.get(r); if (!g) sphCache.set(r, (g = sphere({ radius: r, widthSegments: 14, heightSegments: 9 }))); return g; };

export class WorldMesher {
  constructor(world, lib, scene) {
    this.w = world; this.lib = lib;
    this.root = new Node('World'); scene.add(this.root);
    this.chunks = new Map(); this.dirty = new Set(); this.statics = new Node('Statics'); this.root.add(this.statics);
  }
  key(ix, iy, iz) { return `${Math.floor(ix / CH)}_${Math.floor(iz / CH)}_${Math.floor(iy / STOREY)}`; }
  mark(p) {
    const { ix, iy, iz } = p;
    for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) this.dirty.add(this.key(ix + dx, iy, iz + dz));
    this.dirty.add(this.key(ix, iy - 1, iz)); this.dirty.add(this.key(ix, iy + 1, iz));
  }
  buildAll() {
    const w = this.w;
    for (let lv = 0; lv <= w.floors; lv++) for (let cz = 0; cz * CH < w.D + 1; cz++) for (let cx = 0; cx * CH < w.W + 1; cx++) this.dirty.add(`${cx}_${cz}_${lv}`);
    this.update(1e9);
  }
  update(max = 3) {
    let n = 0;
    for (const k of this.dirty) {
      this.dirty.delete(k); this.rebuild(k);
      if (++n >= max) break;
    }
    return n;
  }
  rebuild(key) {
    const w = this.w, [cx, cz, lv] = key.split('_').map(Number);
    let node = this.chunks.get(key);
    if (node) { for (const c of node.children.slice()) node.remove(c); } else { node = new Node('chunk ' + key); this.root.add(node); this.chunks.set(key, node); }
    const acc = new Map(), A = (m) => { let a = acc.get(m); if (!a) acc.set(m, (a = new Acc())); return a; };
    const x0 = cx * CH, x1 = Math.min(w.W, x0 + CH), z0 = cz * CH, z1 = Math.min(w.D, z0 + CH);
    const y0 = lv * STOREY, y1 = Math.min(w.H, y0 + STOREY);
    const has = (ax, ix, iy, iz) => { const p = w.get(ax, ix, iy, iz); return p && !p.dead; };
    const xe = x1 === w.W ? x1 : x1 - 1, ze = z1 === w.D ? z1 : z1 - 1;
    for (let iy = y0; iy < y1; iy++) {
      for (let iz = z0; iz < z1; iz++) for (let ix = x0; ix <= xe; ix++) { const p = w.getX(ix, iy, iz); if (p && !p.dead) this.wallPanel(p, A, has); }
      for (let iz = z0; iz <= ze; iz++) for (let ix = x0; ix < x1; ix++) { const p = w.getZ(ix, iy, iz); if (p && !p.dead) this.wallPanel(p, A, has); }
    }
    // floors and roofs sit at the bottom of a storey chunk (level y0) only
    if (y0 % STOREY === 0 && y0 <= w.floors * STOREY) for (let iz = z0; iz < z1; iz++) for (let ix = x0; ix < x1; ix++) {
      const p = w.getY(ix, y0, iz);
      if (p && !p.dead) this.slab(p, A, w);
    }
    for (const [m, a] of acc) {
      if (a.empty) continue;
      const mesh = new Mesh(a.build(), this.lib.get(m), m);
      mesh.castShadow = m !== 'glass' && !m.startsWith('floor:ground'); mesh.receiveShadow = true;
      if (m === 'glass') mesh.castShadow = false;
      node.add(mesh);
    }
  }
  wallPanel(p, A, has) {
    const { ix, iy, iz } = p, x = p.ax === 'x';
    if (p.kind === 'door') return; // leaves are separate nodes
    const lat = x ? iz : ix, below = has(p.ax, ix, iy - 1, iz), above = has(p.ax, ix, iy + 1, iz);
    const nb = (d) => (x ? has('x', ix, iy, iz + d) : has('z', ix + d, iy, iz));
    // a free end grows by half a wall thickness only at an L-corner (exactly one wall meets it);
    // at a T-junction the through-wall already covers it, and a bare end stays flush
    const perp = (v) => (x ? (has('z', ix - 1, iy, v) ? 1 : 0) + (has('z', ix, iy, v) ? 1 : 0) : (has('x', v, iy, iz - 1) ? 1 : 0) + (has('x', v, iy, iz) ? 1 : 0));
    const e0 = nb(-1) ? 0 : perp(lat) === 1 ? HT : 0, e1 = nb(1) ? 0 : perp(lat + 1) === 1 ? HT : 0;
    // lateral extent along the wall
    const l0 = lat - e0, l1 = lat + 1 + e1;
    if (p.kind === 'glass') {
      const g = A('glass');
      if (x) g.box(ix - 0.025, iy + 0.02, iz + 0.02, ix + 0.025, iy + 0.98, iz + 0.98); else g.box(ix + 0.02, iy + 0.02, iz - 0.025, ix + 0.98, iy + 0.98, iz + 0.025);
      return;
    }
    const mat = p.reinforced ? 'steel' : 'wall:' + p.mat;
    const skA = p.reinforced ? 'steel' : (p.sa || mat), skB = p.reinforced ? 'steel' : (p.sb || mat);
    const faces = { py: !above, ny: !below, nx: false, px: false, nz: false, pz: false };
    if (x) {
      A(skA).box(ix - HT, iy, l0, ix, iy + 1, l1, { nx: true });
      A(skB).box(ix, iy, l0, ix + HT, iy + 1, l1, { px: true });
      const m = A(mat); // caps and top / bottom share the structural material
      m.box(ix - HT, iy, l0, ix + HT, iy + 1, l1, { py: faces.py, ny: faces.ny, nz: !nb(-1), pz: !nb(1) });
    } else {
      A(skA).box(l0, iy, iz - HT, l1, iy + 1, iz, { nz: true });
      A(skB).box(l0, iy, iz, l1, iy + 1, iz + HT, { pz: true });
      const m = A(mat);
      m.box(l0, iy, iz - HT, l1, iy + 1, iz + HT, { py: faces.py, ny: faces.ny, nx: !nb(-1), px: !nb(1) });
    }
    if (p.barricade) { const b = A('barricade'); if (x) b.box(ix + HT, iy + 0.1, iz + 0.05, ix + HT + 0.05, iy + 0.9, iz + 0.95); else b.box(ix + 0.05, iy + 0.1, iz + HT, ix + 0.95, iy + 0.9, iz + HT + 0.05); }
  }
  slab(p, A, w) {
    const { ix, iy, iz } = p;
    if (p.ground) return;
    const top = p.finish || 'floor:concrete';
    const has = (dx, dz) => { const q = w.getY(ix + dx, iy, iz + dz); return q && !q.dead && !q.ground; };
    const t = A(p.reinforced ? 'steel' : top), edge = A('slabEdge'), ceil = A('ceiling');
    if (p.hatch) {
      A('hatchwood').box(ix + 0.04, iy - SLAB_T, iz + 0.04, ix + 0.96, iy, iz + 0.96, { py: true });
      A('metalDark').box(ix, iy - SLAB_T, iz, ix + 1, iy - 0.02, iz + 1, { px: !has(1, 0), nx: !has(-1, 0), pz: !has(0, 1), nz: !has(0, -1) });
      A('ceiling').box(ix, iy - SLAB_T, iz, ix + 1, iy - SLAB_T + 0.0, iz + 1, { ny: true });
      if (p.reinforced) A('steel').box(ix + 0.02, iy, iz + 0.02, ix + 0.98, iy + 0.04, iz + 0.98);
      return;
    }
    t.box(ix, iy - SLAB_T, iz, ix + 1, iy, iz + 1, { py: true });
    ceil.box(ix, iy - SLAB_T, iz, ix + 1, iy, iz + 1, { ny: iy > 0 });
    edge.box(ix, iy - SLAB_T, iz, ix + 1, iy, iz + 1, { px: !has(1, 0), nx: !has(-1, 0), pz: !has(0, 1), nz: !has(0, -1) });
  }

  // ---- static scenery: boxes, cylinders and spheres grouped per chunk
  buildStatics(list) {
    const groups = new Map();
    for (const v of list) {
      const c = v.c, k = `${Math.floor(c[0] / 12)}_${Math.floor(c[2] / 12)}_${Math.floor(c[1] / 4)}`;
      let g = groups.get(k); if (!g) groups.set(k, (g = new Map()));
      let a = g.get(v.m); if (!a) g.set(v.m, (a = new Acc()));
      if (v.t === 'box') a.box(c[0] - v.s[0] / 2, c[1] - v.s[1] / 2, c[2] - v.s[2] / 2, c[0] + v.s[0] / 2, c[1] + v.s[1] / 2, c[2] + v.s[2] / 2);
      else if (v.t === 'cyl') a.geo(cylGeo(v.r, v.h, v.seg || 12), c[0], c[1], c[2]);
      else if (v.t === 'sph') a.geo(sphGeo(v.r), c[0], c[1], c[2]);
    }
    for (const [k, g] of groups) {
      const node = new Node('statics ' + k);
      for (const [m, a] of g) { if (a.empty) continue; const mesh = new Mesh(a.build(), this.lib.get(m), m); mesh.castShadow = true; node.add(mesh); }
      this.statics.add(node);
    }
  }
}
