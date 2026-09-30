// The level toolkit. Everything is placed on the 1 m navigation grid: a wall run fills its cells,
// a building's ring of cells is its wall, doors and arches open cells again, furniture blocks
// the cells it stands on. Each call adds three things at once: visible geometry (merged per
// chunk so the renderer can cull it), static physics boxes for the player and thrown props,
// and navigation data for the people who live here.
import * as E from '../../../engine/index.js';

export function makeMaterials() {
  const pal = E.archPalette();
  const M = (name, o) => new E.Material({ name, ...o });
  Object.assign(pal, {
    stoneWall: M('Castle stone', { color: '#8b8496', roughness: 0.95, pattern: 'brick', patternScale: 5.5, patternColor: '#3a3644' }),
    stoneDark: M('Dark stone', { color: '#6c6678', roughness: 0.95, pattern: 'brick', patternScale: 4, patternColor: '#2c2836' }),
    stoneOld: M('Old stone', { color: '#767081', roughness: 1, pattern: 'brick', patternScale: 3, patternColor: '#2d2a36' }),
    cobble: M('Cobbles', { color: '#6a6470', roughness: 1, pattern: 'brick', patternScale: 10, patternColor: '#26232d' }),
    flagstone: M('Flagstones', { color: '#66607a', roughness: 0.9, pattern: 'brick', patternScale: 2.6, patternColor: '#2a2634', patternStrength: 0.8 }),
    plaster: M('Plaster', { color: '#a89a86', roughness: 1, pattern: 'stucco', patternScale: 1.4, patternColor: '#6d6052' }),
    plasterDark: M('Grimy plaster', { color: '#82766a', roughness: 1, pattern: 'stucco', patternScale: 1.8, patternColor: '#4a4038' }),
    timber: M('Timber', { color: '#3c2a20', roughness: 0.85, pattern: 'planks', patternScale: 7, patternColor: '#170f0a' }),
    plank: M('Planks', { color: '#6a4c36', roughness: 0.9, pattern: 'planks', patternScale: 6, patternColor: '#2a1a10' }),
    floorWood: M('Floorboards', { color: '#5a4030', roughness: 0.9, pattern: 'planks', patternScale: 5, patternColor: '#24160d' }),
    roofSlate: M('Slate', { color: '#4a4658', roughness: 0.9, pattern: 'shingles', patternScale: 5, patternColor: '#22202c' }),
    roofThatch: M('Thatch', { color: '#7d6a3e', roughness: 1, pattern: 'hair', patternScale: 9, patternColor: '#3d3018' }),
    roofRed: M('Red tile', { color: '#7a3a34', roughness: 0.9, pattern: 'shingles', patternScale: 6, patternColor: '#2b1512' }),
    dirt: M('Dirt', { color: '#4a4032', roughness: 1, pattern: 'dirt', patternScale: 1.2, patternColor: '#241d15' }),
    grass: M('Grass', { color: '#3a4630', roughness: 1, pattern: 'dirt', patternScale: 1.6, patternColor: '#1c2415' }),
    mud: M('Mud', { color: '#3a3026', roughness: 0.6, pattern: 'dirt', patternScale: 2.4, patternColor: '#1a140e' }),
    crimson: M('Crimson cloth', { color: '#7c1c28', roughness: 0.9, pattern: 'fabric', patternScale: 90, sheen: 0.4, doubleSided: true }),
    blackCloth: M('Black cloth', { color: '#1c181e', roughness: 0.9, pattern: 'fabric', patternScale: 90, doubleSided: true }),
    linen: M('Linen', { color: '#a89f8a', roughness: 0.95, pattern: 'fabric', patternScale: 120, doubleSided: true }),
    canvasDirty: M('Old canvas', { color: '#8d8168', roughness: 1, pattern: 'fabric', patternScale: 70, doubleSided: true }),
    iron: M('Iron', { color: '#34343c', roughness: 0.5, metallic: 0.9, pattern: 'metal', patternScale: 3, patternColor: '#121216' }),
    goldM: M('Gold', { color: '#c9a04a', roughness: 0.3, metallic: 1 }),
    silverM: M('Silver', { color: '#b9bcc4', roughness: 0.3, metallic: 1 }),
    bone: M('Bone', { color: '#cfc5ae', roughness: 0.8 }),
    candle: M('Candle wax', { color: '#d8ceb0', roughness: 0.6 }),
    flame: M('Flame', { color: '#ffd28a', emissive: '#ff9a3a', emissiveStrength: 6, roughness: 1 }),
    ember: M('Ember', { color: '#ff7a30', emissive: '#ff5a10', emissiveStrength: 3, roughness: 1 }),
    moss: M('Moss', { color: '#3d4a2e', roughness: 1, pattern: 'fabric', patternScale: 30 }),
    bark: M('Bark', { color: '#2c2420', roughness: 1, pattern: 'wood', patternScale: 5, patternColor: '#100c0a' }),
    water: M('Water', { color: '#1c2c3c', roughness: 0.08, metallic: 0.3 }),
    parchment: M('Parchment', { color: '#c8b78e', roughness: 0.9 }),
    wax: M('Black wax', { color: '#15101a', roughness: 0.3, emissive: '#5a1a8a', emissiveStrength: 0.6 }),
    pottery: M('Pottery', { color: '#7a5a44', roughness: 0.8, pattern: 'dirt', patternScale: 6, patternColor: '#3a281c' }),
    leatherM: M('Leather', { color: '#4a3222', roughness: 0.7, pattern: 'leather', patternScale: 60, patternColor: '#20130a' }),
    rug: M('Rug', { color: '#5a1a22', roughness: 1, pattern: 'plaid', patternScale: 6, patternColor: '#2a0a10', sheen: 0.3 }),
    rugBlue: M('Blue rug', { color: '#2a2c54', roughness: 1, pattern: 'stripes', patternScale: 8, patternColor: '#14142e' }),
    hay: M('Hay', { color: '#8a7440', roughness: 1, pattern: 'hair', patternScale: 14, patternColor: '#4a3c1c' }),
  });
  return pal;
}

export class Builder {
  constructor({ scene, world, nav }) {
    this.scene = scene; this.world = world; this.nav = nav;
    this.pal = makeMaterials();
    this.kits = new Map(); this.chunk = 'main';
    this.lights = []; this.torches = []; this.doors = []; this.containers = []; this.interactables = [];
    this.props = []; this.pois = {}; this.routes = {}; this.fires = []; this.decor = new E.Node('Decor'); scene.add(this.decor);
    this.statics = []; this.candles = []; this.sconceLights = [];
  }
  get M() { return this.pal; }
  useChunk(name) { this.chunk = name; return this; }
  kit(name = this.chunk) { if (!this.kits.has(name)) this.kits.set(name, new E.Kit(this.pal)); return this.kits.get(name); }
  finish() {
    for (const [name, k] of this.kits) {
      const n = k.toNode(name);
      n.traverse((m) => { if (m.geometry) m.receiveShadow = true; });
      this.scene.add(n);
    }
  }

  // ------------------------------------------------------------ primitives
  // a static physics box from min/max corners
  collider(x0, y0, z0, x1, y1, z1, kind = 'stone') {
    const b = new E.Body({ shape: new E.Box([(x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2]), type: 'static', position: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], friction: 0.7 });
    b.userData.kind = kind; this.world.add(b); this.statics.push(b); return b;
  }
  // a static box that only exists in the physics world while the player is near (big outdoor areas)
  lazyCollider(x0, y0, z0, x1, y1, z1, kind = 'stone') { (this.lazy ||= []).push({ a: [x0, y0, z0, x1, y1, z1, kind], cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, body: null }); return null; }
  // visual box only
  vbox(mat, x0, y0, z0, x1, y1, z1, { chunk, bevel = 0, rot = null } = {}) {
    const k = this.kit(chunk);
    k.box(typeof mat === 'string' ? this.pal[mat] : mat, [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], [x1 - x0, y1 - y0, z1 - z0], rot || [0, 0, 0], bevel);
  }
  // visual + collider + nav block
  solid(mat, x0, y0, z0, x1, y1, z1, { chunk, kind = 'stone', nav = true, bevel = 0, collide = true } = {}) {
    this.vbox(mat, x0, y0, z0, x1, y1, z1, { chunk, bevel });
    if (collide) this.collider(x0, y0, z0, x1, y1, z1, kind);
    if (nav && y0 < 1.2 && y1 > 0.5) this.nav.block(x0, z0, x1, z1, 1);
  }
  ground(mat, x0, z0, x1, z1, y = 0.0, thick = 0.06, { chunk = 'ground', noise = null, indoor = null } = {}) {
    this.vbox(mat, x0, y - thick, z0, x1, y, z1, { chunk });
    if (noise !== null) this.nav.setNoise(x0, z0, x1, z1, noise);
    if (indoor !== null) this.nav.setIndoor(x0, z0, x1, z1, indoor);
  }

  // ------------------------------------------------------------ walls
  // A wall along x (axis 'x': from a to b at z=c) or along z (axis 'z': from a to b at x=c).
  // openings: [{ at, w, top, sill, kind }], `at` measured from a. kind: door | arch | window | gap.
  wall({ axis = 'x', a, b, c, y0 = 0, h = 4, t = 0.7, mat = 'plaster', openings = [], chunk, kind = 'stone', nav = true, navT = 1, cap = null, capOff = 0 }) {
    const M = typeof mat === 'string' ? this.pal[mat] : mat;
    const ops = openings.slice().sort((p, q) => p.at - q.at);
    const box = (u0, u1, v0, v1) => {
      if (u1 - u0 < 0.01 || v1 - v0 < 0.01) return;
      const [x0, x1, z0, z1] = axis === 'x' ? [a + u0, a + u1, c - t / 2, c + t / 2] : [c - t / 2, c + t / 2, a + u0, a + u1];
      this.vbox(M, x0, y0 + v0, z0, x1, y0 + v1, z1, { chunk });
      this.collider(x0, y0 + v0, z0, x1, y0 + v1, z1, kind);
    };
    const len = b - a; let u = 0;
    for (const o of ops) {
      const lo = o.at - o.w / 2, hi = o.at + o.w / 2, sill = o.sill || 0, top = o.top ?? (o.kind === 'window' ? 2.4 : 2.5);
      box(u, lo, 0, h);
      if (sill > 0) box(lo, hi, 0, sill);
      box(lo, hi, top, h);
      u = hi;
      // frame & glass
      const cx = axis === 'x' ? a + o.at : c, cz = axis === 'x' ? c : a + o.at;
      if (o.kind === 'window') {
        const g = axis === 'x' ? [cx - o.w / 2, y0 + sill, cz - 0.03, cx + o.w / 2, y0 + top, cz + 0.03] : [cx - 0.03, y0 + sill, cz - o.w / 2, cx + 0.03, y0 + top, cz + o.w / 2];
        this.vbox(this.pal.glass, ...g, { chunk });
        const bars = axis === 'x' ? [cx - 0.04, y0 + sill, cz - t / 2 - 0.02, cx + 0.04, y0 + top, cz + t / 2 + 0.02] : [cx - t / 2 - 0.02, y0 + sill, cz - 0.04, cx + t / 2 + 0.02, y0 + top, cz + 0.04];
        this.vbox(this.pal.timber, ...bars, { chunk });
        this.vbox(this.pal.timber, ...(axis === 'x' ? [cx - o.w / 2, y0 + (sill + top) / 2 - 0.03, cz - t / 2 - 0.02, cx + o.w / 2, y0 + (sill + top) / 2 + 0.03, cz + t / 2 + 0.02] : [cx - t / 2 - 0.02, y0 + (sill + top) / 2 - 0.03, cz - o.w / 2, cx + t / 2 + 0.02, y0 + (sill + top) / 2 + 0.03, cz + o.w / 2]), { chunk });
      } else if (o.kind === 'door' || o.kind === 'arch') {
        // door frame posts + lintel beam
        const fr = 0.12, post = (px0, pz0, px1, pz1) => this.vbox(this.pal.timber, px0, y0, pz0, px1, y0 + top, pz1, { chunk });
        if (axis === 'x') { post(cx - o.w / 2 - fr, cz - t / 2 - 0.03, cx - o.w / 2, cz + t / 2 + 0.03); post(cx + o.w / 2, cz - t / 2 - 0.03, cx + o.w / 2 + fr, cz + t / 2 + 0.03); this.vbox(this.pal.timber, cx - o.w / 2 - fr, y0 + top, cz - t / 2 - 0.03, cx + o.w / 2 + fr, y0 + top + 0.16, cz + t / 2 + 0.03, { chunk }); }
        else { post(cx - t / 2 - 0.03, cz - o.w / 2 - fr, cx + t / 2 + 0.03, cz - o.w / 2); post(cx - t / 2 - 0.03, cz + o.w / 2, cx + t / 2 + 0.03, cz + o.w / 2 + fr); this.vbox(this.pal.timber, cx - t / 2 - 0.03, y0 + top, cz - o.w / 2 - fr, cx + t / 2 + 0.03, y0 + top + 0.16, cz + o.w / 2 + fr, { chunk }); }
      }
      // navigation: doors, arches and gaps let people through
      if (o.kind !== 'window') { const [nx0, nx1, nz0, nz1] = axis === 'x' ? [a + lo, a + hi, c - navT / 2, c + navT / 2] : [c - navT / 2, c + navT / 2, a + lo, a + hi]; this.nav.clear(nx0 + 0.01, nz0 + 0.01, nx1 - 0.01, nz1 - 0.01); }
    }
    box(u, len, 0, h);
    if (nav) {
      // block the wall's cells except through the openings
      const [nx0, nx1, nz0, nz1] = axis === 'x' ? [a, b, c - navT / 2, c + navT / 2] : [c - navT / 2, c + navT / 2, a, b];
      this.nav.block(nx0, nz0, nx1, nz1, 1);
      for (const o of ops) if (o.kind !== 'window') {
        const lo = o.at - o.w / 2 + 0.05, hi = o.at + o.w / 2 - 0.05;
        const r = axis === 'x' ? [a + lo, c - navT / 2, a + hi, c + navT / 2] : [c - navT / 2, a + lo, c + navT / 2, a + hi];
        this.nav.clear(r[0] + 0.01, r[1] + 0.01, r[2] - 0.01, r[3] - 0.01);
      }
    }
    if (cap) this.crenels(axis, a, b, c + capOff, y0 + h, capOff ? 0.45 : t, cap);
  }
  // battlement teeth along the top of a wall
  crenels(axis, a, b, c, y, t, mat) {
    const M = typeof mat === 'string' ? this.pal[mat] : mat;
    for (let u = a + 0.4; u < b - 0.4; u += 1.6) {
      if (axis === 'x') this.vbox(M, u, y, c - t / 2, u + 0.9, y + 0.7, c + t / 2, {}); else this.vbox(M, c - t / 2, y, u, c + t / 2, y + 0.7, u + 0.9, {});
    }
  }
  // exposed timber frame on the outer face of a wall run
  frame({ axis, a, b, c, y0 = 0, h, side = 1, t = 0.7, posts = 3.2, chunk }) {
    const M = this.pal.timber, off = t / 2 + 0.04, hw = 0.1;
    const put = (u0, u1, v0, v1) => { const [x0, x1, z0, z1] = axis === 'x' ? [a + u0, a + u1, c + side * off - hw, c + side * off + hw] : [c + side * off - hw, c + side * off + hw, a + u0, a + u1]; this.vbox(M, x0, y0 + v0, Math.min(z0, z1), x1, y0 + v1, Math.max(z0, z1), { chunk }); };
    const len = b - a, n = Math.max(1, Math.round(len / posts));
    for (let i = 0; i <= n; i++) { const u = (i / n) * len; put(Math.max(0, u - hw), Math.min(len, u + hw), 0, h); }
    put(0, len, h - 0.28, h - 0.08); put(0, len, 0.0, 0.2);
    if (h > 3) put(0, len, h * 0.5 - 0.1, h * 0.5 + 0.1);
  }

  // ------------------------------------------------------------ roofs
  // gable roof over a rectangle; ridge runs along the longer side (or `ridge`)
  gableRoof({ x0, z0, x1, z1, y, rise = 2.2, over = 0.55, mat = 'roofSlate', ridge = null, chunk, thick = 0.22 }) {
    const w = x1 - x0, d = z1 - z0, alongX = ridge ? ridge === 'x' : w >= d;
    const M = typeof mat === 'string' ? this.pal[mat] : mat;
    const k = this.kit(chunk), gab = this.pal.plasterDark;
    const span = alongX ? d : w, half = span / 2, tanA = rise / half, ang = Math.atan(tanA) * 180 / Math.PI;
    const run = half + over, drop = over * tanA, sl = Math.hypot(run, rise + drop), cy = y + (rise - drop) / 2 + 0.02;
    const len = (alongX ? w : d) + over * 2, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    for (const s of [-1, 1]) {
      if (alongX) k.box(M, [cx, cy, cz + s * run / 2], [len, thick, sl], [s * ang, 0, 0]);
      else k.box(M, [cx + s * run / 2, cy, cz], [sl, thick, len], [0, 0, -s * ang]);
    }
    k.box(M, alongX ? [cx, y + rise + 0.05, cz] : [cx, y + rise + 0.05, cz], alongX ? [len, 0.16, 0.3] : [0.3, 0.16, len]);
    if (alongX) for (const sx of [x0, x1]) k.add(gab, E.extrude({ outline: [[-half, 0], [half, 0], [0, rise]], depth: 0.5, bevel: 0 }), [sx, y, cz], [0, 90, 0]);
    else for (const sz of [z0, z1]) k.add(gab, E.extrude({ outline: [[-half, 0], [half, 0], [0, rise]], depth: 0.5, bevel: 0 }), [cx, y, sz], [0, 0, 0]);
  }
  flatRoof({ x0, z0, x1, z1, y, mat = 'stoneWall', chunk, thick = 0.5 }) { this.vbox(mat, x0, y, z0, x1, y + thick, z1, { chunk }); this.collider(x0, y, z0, x1, y + thick, z1, 'stone'); }
  // round tower with a conical roof (visual + circle approximated by a box collider)
  roundTower({ x, z, r = 3, h = 10, mat = 'stoneWall', roof = 'roofSlate', chunk, y0 = 0, cone = true, crenel = false, collide = true }) {
    const k = this.kit(chunk);
    k.cyl(typeof mat === 'string' ? this.pal[mat] : mat, [x, y0 + h / 2, z], r, h, [0, 0, 0], 20);
    if (cone) k.add(typeof roof === 'string' ? this.pal[roof] : roof, E.cone({ radius: r + 0.7, height: r * 1.8, radialSegments: 20, heightSegments: 1 }), [x, y0 + h + r * 0.9, z]);
    if (crenel) for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; k.box(this.pal.stoneWall, [x + Math.cos(a) * (r - 0.15), y0 + h + 0.35, z + Math.sin(a) * (r - 0.15)], [0.7, 0.7, 0.5], [0, -a * 180 / Math.PI + 90, 0]); }
    if (collide) { const s = r * 0.72; this.collider(x - s, y0, z - s, x + s, y0 + h, z + s, 'stone'); this.nav.block(x - r + 0.2, z - r + 0.2, x + r - 0.2, z + r - 0.2, 1); }
  }
}
