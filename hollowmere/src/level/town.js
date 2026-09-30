// Ashgate, the walled town below Ravenspire keep: the road in, the gate, the street, the
// tavern, houses, smithy, chapel and graveyard, market plaza. All coordinates are metres.
import * as E from '../../../engine/index.js';
import './furniture.js';
import './houses.js';

const rnd = E.rng(1337);
const r = (a, b) => a + (b - a) * rnd();

function deadTree(B, x, z, s = 1, chunk = 'trees') {
  const k = B.kit(chunk), M = B.pal.bark, h = r(3.4, 5.5) * s;
  k.add(M, E.cylinder({ radiusTop: 0.07 * s, radiusBottom: 0.24 * s, height: h, radialSegments: 6, heightSegments: 2 }), [x, h / 2, z], [r(-4, 4), r(0, 360), r(-4, 4)]);
  for (let i = 0; i < 4; i++) {
    const a = r(0, 360), y = h * r(0.5, 0.9), len = r(1.0, 2.2) * s, tilt = r(35, 65);
    const dx = Math.sin(a * Math.PI / 180), dz = Math.cos(a * Math.PI / 180);
    k.add(M, E.cylinder({ radiusTop: 0.015, radiusBottom: 0.06 * s, height: len, radialSegments: 5, heightSegments: 1 }), [x + dx * len * 0.35, y + len * 0.3, z + dz * len * 0.35], [tilt * dz, a, -tilt * dx]);
  }
  B.collider(x - 0.2, 0, z - 0.2, x + 0.2, h, z + 0.2, 'wood'); B.nav.block(x - 0.4, z - 0.4, x + 0.4, z + 0.4, 1);
}
function rock(B, x, z, s = 1, chunk = 'trees') { B.kit(chunk).add(B.pal.stoneOld, E.superquadric({ rx: 0.6 * s, ry: 0.4 * s, rz: 0.5 * s, e1: 0.7, e2: 0.7, widthSegments: 8, heightSegments: 6 }), [x, 0.2 * s, z], [r(-10, 10), r(0, 360), 0]); }
function fenceLine(B, x0, z0, x1, z1, { h = 1.1, chunk = 'fences', gapAt = [], mat = 'timber', collide = true, nav = true } = {}) {
  const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), n = Math.floor(L / 1.6);
  const k = B.kit(chunk), yaw = -Math.atan2(dz, dx) * 180 / Math.PI;
  for (let i = 0; i <= n; i++) { const t = i / n, px = x0 + dx * t, pz = z0 + dz * t; if (gapAt.some((g) => Math.hypot(px - g[0], pz - g[1]) < g[2])) continue; k.box(B.pal[mat], [px, h / 2, pz], [0.12, h, 0.12]); }
  k.box(B.pal[mat], [(x0 + x1) / 2, h * 0.85, (z0 + z1) / 2], [L, 0.08, 0.08], [0, yaw, 0]); k.box(B.pal[mat], [(x0 + x1) / 2, h * 0.45, (z0 + z1) / 2], [L, 0.08, 0.08], [0, yaw, 0]);
}

export function buildOutskirts(B) {
  const M = B.pal;
  B.useChunk('ground');
  // the wide world
  const g = new E.Mesh(E.plane({ width: 900, depth: 900 }), M.grass, 'Ground'); g.castShadow = false; g.position.set([20, -0.02, 40]); B.scene.add(g);
  B.world.add(new E.Body({ shape: new E.Plane(), type: 'static', friction: 0.8 })).userData.kind = 'ground';
  // the road from the south
  B.ground('dirt', -3, -72, 3, 12, 0.0, 0.05, { noise: 0 });
  B.kit('ground').box(M.mud, [-3.2, 0.005, -30], [0.7, 0.02, 100]); B.kit('ground').box(M.mud, [3.2, 0.005, -30], [0.7, 0.02, 100]);
  // camp for the opening scene
  B.useChunk('camp');
  B.hearth(13, 0, -33, { r: 0.55, range: 18, intensity: 16 });
  for (const [lx, lz, ry] of [[10.6, -33.6, 25], [15.4, -32.4, -30], [13.4, -35.8, 100]]) B.kit('camp').cyl(M.bark, [lx, 0.2, lz], 0.2, 1.5, [90, ry, 0], 7);
  B.kit('camp').box(M.canvasDirty, [17, 1.2, -36], [3.2, 0.06, 2.6], [0, 30, 14]);   // lean-to tarp
  B.kit('camp').box(M.timber, [15.6, 0.9, -37], [0.12, 1.8, 0.12]); B.kit('camp').box(M.timber, [18.6, 0.6, -34.6], [0.12, 1.2, 0.12]);
  B.poi('camp_brannoch', 11.4, -31.6, { yaw: 100, type: 'stand' }); B.poi('camp_player', 9, -35, { yaw: 90, type: 'stand' });
  B.prop('sack', 16.5, 0, -36.4, { yaw: 30 }); B.prop('crateS', 17.6, 0, -35.6); B.prop('bottle', 14.4, 0, -31.5); B.prop('mug', 12.2, 0, -31.2);
  // dead trees, rocks and fences along the road
  const trees = B.kit('trees');
  for (let i = 0; i < 70; i++) {
    const side = rnd() < 0.5 ? -1 : 1, x = side * r(8, 48), z = r(-70, 6);
    if (Math.abs(x - 13) < 9 && z > -42 && z < -26) continue;
    if (rnd() < 0.8) deadTree(B, x, z, r(0.8, 1.3)); else rock(B, x, z, r(0.6, 1.6));
  }
  for (let i = 0; i < 24; i++) { const side = rnd() < 0.5 ? -1 : 1; rock(B, side * r(4, 10), r(-68, 6), r(0.3, 0.7)); }
  // a signpost and a milestone
  B.kit('trees').box(M.timber, [-5, 1.2, -18], [0.14, 2.4, 0.14]); B.kit('trees').box(M.plank, [-5, 2.0, -18], [1.3, 0.28, 0.06], [0, 0, 5]); B.kit('trees').box(M.plank, [-5, 1.6, -18], [1.1, 0.26, 0.06], [0, 180, -4]);
  B.solid('stoneOld', -5.7, 0, -12.4, -5.0, 1.0, -11.8, { chunk: 'trees', bevel: 0.05 });
  // distant hills for the horizon
  const hills = B.kit('hills');
  for (let i = 0; i < 26; i++) { const a = (i / 26) * Math.PI * 2, R = r(190, 260); hills.add(M.grass, E.superquadric({ rx: r(35, 70), ry: r(14, 34), rz: r(35, 60), e1: 0.6, e2: 0.6, widthSegments: 10, heightSegments: 6 }), [Math.cos(a) * R + 20, 0, Math.sin(a) * R + 70]); }
  // ravenspire on its crag (visible from the road)
  const crag = B.kit('crag');
  crag.add(M.stoneOld, E.superquadric({ rx: 70, ry: 18, rz: 40, e1: 0.5, e2: 0.6, widthSegments: 12, heightSegments: 8 }), [0, -2, 128]);
}

// ---------------------------------------------------------------- pois & small helpers
export function addHelpers(B) {
  const P = B.constructor.prototype;
  P.poi = function poi(name, x, z, { yaw = 0, type = 'stand', y = null, approach = null, ...rest } = {}) {
    const yy = y ?? this.nav.floorAt(x, z);
    this.pois[name] = { name, x, z, y: yy, yaw, type, approach: approach || [x + Math.sin(yaw * Math.PI / 180) * (type === 'stand' ? 0 : 0.9), z + Math.cos(yaw * Math.PI / 180) * (type === 'stand' ? 0 : 0.9)], ...rest };
    return this.pois[name];
  };
  P.route = function route(name, pts, loop = true) { this.routes[name] = { name, pts, loop }; };
  P.chair = function chair(x, z, dir = 0, { name = null, y = 0, chunk, sitPoi = true } = {}) {
    const g = new E.Node('Chair'); g.position.set([x, y, z]); E.quat.fromEuler(g.rotation, 0, dir, 0);
    const k = new E.Kit(this.pal);
    k.box(this.pal.plank, [0, 0.45, 0], [0.46, 0.06, 0.46], [0, 0, 0], 0.01);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(this.pal.timber, [sx * 0.19, 0.22, sz * 0.19], [0.05, 0.44, 0.05]);
    k.box(this.pal.timber, [0, 0.85, -0.21], [0.44, 0.7, 0.05], [0, 0, 0], 0.01);
    g.add(k.toNode('Chair')); this.decor.add(g);
    this.collider(x - 0.24, y, z - 0.24, x + 0.24, y + 0.5, z + 0.24, 'wood');
    this.nav.block(x - 0.3, z - 0.3, x + 0.3, z + 0.3, 1);
    if (name && sitPoi) this.poi(name, x, z, { yaw: dir, type: 'sit', y: y + 0.45, approach: [x + Math.sin(dir * Math.PI / 180) * 0.95, z + Math.cos(dir * Math.PI / 180) * 0.95] });
    return g;
  };
  P.lampPost = function lampPost(x, z, { lit = true, chunk = 'street', range = 14, intensity = 11 } = {}) {
    const k = this.kit(chunk);
    k.cyl(this.pal.iron, [x, 1.5, z], 0.05, 3, [0, 0, 0], 6); k.box(this.pal.iron, [x, 3.05, z], [0.34, 0.06, 0.34]);
    k.box(this.pal.iron, [x, 3.3, z], [0.28, 0.4, 0.28]); k.box(this.pal.lanternGlass, [x, 3.3, z], [0.2, 0.32, 0.2]);
    const t = this.torch(x, 2.75, z, { dir: [0, 0], range, intensity, chunk, name: 'lamp' });
    t.y = 3.0; t.light.position.set([x, 3.3, z]); t.flame.position.set([x, 3.25, z]); t.flame.scale.set([1.5, 1.5, 1.5]);
    this.collider(x - 0.1, 0, z - 0.1, x + 0.1, 3, z + 0.1, 'iron'); this.nav.block(x - 0.15, z - 0.15, x + 0.15, z + 0.15, 1);
    return t;
  };
  P.stall = function stall(x, z, { dir = 0, w = 3, mat = 'canvasDirty', goods = 'fruit', chunk = 'market', name = 'stall' } = {}) {
    // counter faces +z (customers); the merchant stands behind it, toward -z
    const g = new E.Node('Stall'); g.position.set([x, 0, z]); E.quat.fromEuler(g.rotation, 0, dir, 0);
    const k = new E.Kit(this.pal);
    k.box(this.pal.plank, [0, 0.9, 0.5], [w, 0.08, 0.9], [0, 0, 0], 0.02); k.box(this.pal.timber, [0, 0.45, 0.5], [w - 0.2, 0.86, 0.8]);
    for (const sx of [-1, 1]) { k.box(this.pal.timber, [sx * (w / 2 - 0.05), 1.3, -0.85], [0.09, 2.6, 0.09]); k.box(this.pal.timber, [sx * (w / 2 - 0.05), 1.15, 0.92], [0.09, 2.3, 0.09]); }
    k.box(this.pal[mat], [0, 2.42, 0.03], [w + 0.5, 0.05, 2.2], [-10, 0, 0]);
    const goodMat = { fruit: this.pal.crimson, bread: this.pal.hay, fish: this.pal.silverM, cloth: this.pal.rugBlue, pots: this.pal.pottery, meat: this.pal.rug, herbs: this.pal.moss }[goods] || this.pal.hay;
    for (let i = 0; i < 6; i++) k.add(goodMat, E.superquadric({ rx: 0.12, ry: 0.08, rz: 0.12, e1: 0.8, e2: 0.8, widthSegments: 6, heightSegments: 5 }), [-w / 2 + 0.4 + i * (w - 0.8) / 5, 1.0, 0.4 + (i % 2) * 0.2]);
    g.add(k.toNode('Stall')); this.decor.add(g);
    const c = Math.cos(dir * Math.PI / 180), s = Math.sin(dir * Math.PI / 180);
    // world-space footprint of the counter (rotated 0/90/180/270 only)
    const lx = (px, pz) => [x + px * c + pz * s, z - px * s + pz * c];
    const p0 = lx(-w / 2, 0.1), p1 = lx(w / 2, 0.95), x0 = Math.min(p0[0], p1[0]), x1 = Math.max(p0[0], p1[0]), z0 = Math.min(p0[1], p1[1]), z1 = Math.max(p0[1], p1[1]);
    this.collider(x0, 0, z0, x1, 1.0, z1, 'wood'); this.nav.block(x0, z0, x1, z1, 1);
    const m = lx(0, -0.5);
    this.poi(name, m[0], m[1], { yaw: dir, type: 'stand', approach: [m[0], m[1]] });
    const pp = lx(0.3, 0.5); this.prop('bread', pp[0], 0.94, pp[1], { sleep: true });
    return g;
  };
  P.well = function well(x, z, { chunk = 'market' } = {}) {
    const k = this.kit(chunk);
    k.add(this.pal.stoneOld, E.cylinder({ radiusTop: 1.1, radiusBottom: 1.2, height: 1.0, radialSegments: 14, heightSegments: 2, capTop: false }), [x, 0.5, z]);
    k.add(this.pal.water, E.cylinder({ radiusTop: 0.95, radiusBottom: 0.95, height: 0.02, radialSegments: 14 }), [x, 0.55, z]);
    for (const sx of [-1, 1]) k.box(this.pal.timber, [x + sx * 0.95, 1.8, z], [0.14, 1.9, 0.14]);
    k.box(this.pal.timber, [x, 2.75, z], [2.2, 0.16, 0.16]);
    k.add(this.pal.roofSlate, E.cone({ radius: 1.6, height: 0.9, radialSegments: 4, heightSegments: 1 }), [x, 3.25, z], [0, 45, 0]);
    this.collider(x - 1.1, 0, z - 1.1, x + 1.1, 1.0, z + 1.1, 'stone'); this.nav.block(x - 1.2, z - 1.2, x + 1.2, z + 1.2, 1);
    this.poi('well', x, z - 1.9, { yaw: 0, type: 'stand' });
  };
  P.tomb = function tomb(x, z, { dir = 0, kind = 'stone', chunk = 'graves' } = {}) {
    const k = this.kit(chunk);
    if (kind === 'stone') { k.box(this.pal.stoneOld, [x, 0.5, z], [0.7, 1.0, 0.16], [r(-4, 4), dir, r(-6, 6)], 0.04); k.box(this.pal.moss, [x, 0.03, z + 0.7], [0.7, 0.05, 1.5], [0, dir, 0]); }
    if (kind === 'cross') { k.box(this.pal.stoneOld, [x, 0.7, z], [0.16, 1.4, 0.14], [r(-3, 3), dir, r(-4, 4)]); k.box(this.pal.stoneOld, [x, 1.05, z], [0.7, 0.16, 0.14], [0, dir, 0]); k.box(this.pal.moss, [x, 0.03, z + 0.8], [0.7, 0.05, 1.5], [0, dir, 0]); }
    if (kind === 'slab') k.box(this.pal.stoneOld, [x, 0.25, z], [1.0, 0.5, 2.0], [0, dir, 0], 0.05);
    this.collider(x - 0.4, 0, z - 0.3, x + 0.4, kind === 'slab' ? 0.5 : 1, z + 0.3, 'stone'); this.nav.block(x - 0.4, z - 0.3, x + 0.4, z + 0.3, 1);
  };
}

// ---------------------------------------------------------------- walls & gate
export function buildTownWalls(B) {
  const T = 2, H = 6.5, ch = 'townwall';
  const seg = (a, b, c, axis = 'x', extra = {}) => B.wall({ axis, a, b, c, h: H, t: T, mat: 'stoneWall', chunk: ch, cap: 'stoneWall', navT: T, ...extra });
  seg(-48, -33, 11); seg(-27, -9, 11); seg(9, 20, 11); seg(24, 48, 11);
  // the sewer outfall: a low arch under the wall
  seg(20, 24, 11, 'x', { openings: [{ at: 2, w: 1.5, top: 1.55, kind: 'arch' }], cap: null });
  B.door({ axis: 'x', x: 22, z: 11, w: 1.5, h: 1.55, hinge: 'a', mat: 'iron', name: 'sewer grate', locked: true, lockLevel: 2, id: 'sewer_grate', chunk: ch, autoClose: false });
  // the breach: a collapsed stretch of wall, only rubble left
  B.wall({ axis: 'x', a: -33, b: -27, c: 11, h: 0.5, t: T, mat: 'stoneWall', chunk: ch, nav: false });
  for (let i = 0; i < 9; i++) {
    const x = -32.4 + i * 0.7 + r(-0.1, 0.1), z = 11 + r(-0.9, 0.9), hgt = 0.6 + 0.8 * (1 - Math.abs(i - 4) / 4.5) + r(0, 0.3), sz = r(0.7, 1.1);
    B.solid('stoneOld', x - sz / 2, 0, z - sz / 2, x + sz / 2, hgt, z + sz / 2, { chunk: ch, bevel: 0.1, nav: false });
  }
  B.nav.block(-33, 9.9, -27, 12.1, 2); // only the player scrambles over rubble
  seg(11, 92, 48, 'z'); seg(11, 92, -48, 'z');
  // corner towers
  for (const [x, z] of [[-48, 11], [48, 11], [-48, 92], [48, 92]]) B.roundTower({ x, z, r: 3.6, h: 9.5, mat: 'stoneWall', roof: 'roofSlate', chunk: ch, crenel: true, cone: false });
  // the gatehouse: two towers around an eight-metre passage under a bridge of stone
  for (const sx of [-1, 1]) {
    const x0 = sx < 0 ? -9 : 4, x1 = sx < 0 ? -4 : 9;
    B.solid('stoneWall', x0, 0, 8, x1, 11, 17, { chunk: ch });
    B.gableRoof({ x0: x0 - 0.3, z0: 7.7, x1: x1 + 0.3, z1: 17.3, y: 11, rise: 3.2, mat: 'roofSlate', chunk: ch, ridge: 'z' });
    B.torch(sx * 4.2, 3.4, 9.2, { dir: [0, -1], chunk: ch, range: 13, intensity: 12, name: 'gate torch' });
    B.torch(sx * 4.2, 3.4, 16.8, { dir: [0, 1], chunk: ch, range: 13, intensity: 12, name: 'gate torch' });
  }
  B.solid('stoneWall', -4, 5.2, 8, 4, 11, 17, { chunk: ch, nav: false });
  B.crenels('x', -8.8, 8.8, 8.2, 11, 0.6, 'stoneWall');
  B.ground('cobble', -4, 8, 4, 17, 0.0, 0.05, { chunk: 'street', noise: 1 });
  // the great gate doors: open by day, barred by night
  const gl = B.door({ axis: 'x', x: -2, z: 11, w: 4, h: 5.2, hinge: 'a', gate: true, id: 'gate', name: 'town gate', locked: true, keyId: 'gatekey', chunk: ch, autoClose: false });
  const gr = B.door({ axis: 'x', x: 2, z: 11, w: 4, h: 5.2, hinge: 'b', gate: true, id: 'gate', name: 'town gate', locked: true, keyId: 'gatekey', chunk: ch, autoClose: false });
  B.gates = [gl, gr]; gl.hold = gr.hold = true;
  B.poi('gate_post_l', -3.2, 14.6, { yaw: 0, type: 'stand' }); B.poi('gate_post_r', 3.2, 14.6, { yaw: 0, type: 'stand' });
  B.poi('gate_outside', 2.5, 6.5, { yaw: 180, type: 'stand' });
  B.route('gate_beat', [[-4.5, 18], [-4.5, 26], [4.5, 26], [4.5, 18]]);
  B.route('wall_east', [[44, 15], [44, 40], [44, 66], [44, 88], [44, 66], [44, 40]], true);
  B.route('wall_west', [[-44, 88], [-44, 66], [-44, 40], [-44, 15], [-44, 40], [-44, 66]], true);
}

// ---------------------------------------------------------------- ground of the town
export function buildTownGround(B) {
  B.ground('dirt', -48, 12, 48, 93, 0.0, 0.05, { chunk: 'townground', noise: 0 });
  B.ground('cobble', -3, 12, 3, 93, 0.0, 0.04, { chunk: 'street', noise: 1 });
  B.ground('cobble', -8, 48, 14, 73, 0.0, 0.04, { chunk: 'street', noise: 1 });
  B.ground('cobble', -20, 66, -8, 86, 0.0, 0.04, { chunk: 'street', noise: 1 });
  B.ground('cobble', 3, 14, 8, 30, 0.0, 0.04, { chunk: 'street', noise: 1 }); // tavern yard
  B.ground('cobble', -8, 15, -3, 25, 0.0, 0.04, { chunk: 'street', noise: 1 });
  for (const z of [22, 36, 48, 72, 84]) B.lampPost(z % 2 ? 3.6 : -3.6, z);
  B.lampPost(-9, 70); B.lampPost(14.5, 50);
  // fences round the graveyard are added with the chapel
  // scattered clutter
  for (const [x, z] of [[-6, 34], [5, 40], [6, 20], [-6, 74], [12, 46], [30, 32], [38, 48], [-40, 26], [40, 60], [-38, 50]]) { B.prop('barrel', x, 0, z, { yaw: r(0, 360) }); }
  for (const [x, z] of [[-5.5, 21], [7, 36], [-6.4, 46], [9, 74]]) { B.prop('crate', x, 0, z, { yaw: r(0, 90) }); B.prop('crateS', x + 0.7, 0, z + 0.3, { yaw: r(0, 90) }); }
  for (let i = 0; i < 22; i++) B.prop(['jug', 'bucket', 'sack', 'pot', 'crateS'][i % 5], r(-40, 40), 0, r(18, 88), { yaw: r(0, 360) });
  // trees inside the walls (dead ones, of course) and gravestone clutter come with each district
}

// ---------------------------------------------------------------- shared dressing
// Furnish a one-room home. The layout is planned relative to the door: a clear lane inside the
// door, the hearth on the far wall, the bed in the far corner away from the door, a table off to one side.
function dressHome(B, b, { bed = true, hearth = true, table = true, chest = null, door = null } = {}) {
  const [x0, z0, x1, z1] = b.inner, dd = door || b.doorInfo || { side: 'E', at: 4.5 };
  const side = dd.side, S = side === 'S' || side === 'N';
  const W = S ? x1 - x0 : z1 - z0, D = S ? z1 - z0 : x1 - x0, uDoor = dd.at - 1;
  const map = (u, v) => (side === 'S' ? [x0 + u, z0 + v] : side === 'N' ? [x0 + u, z1 - v] : side === 'W' ? [x0 + v, z0 + u] : [x1 - v, z0 + u]);
  const face = { S: 0, N: 180, W: 90, E: 270 }[side];            // direction pointing into the room
  const headDir = { S: 180, N: 0, W: 270, E: 90 }[side];        // a bed with its head against the far wall
  const away = uDoor < W / 2 ? 1 : -1;                          // which side of the room is away from the door
  const ch = b.chunk;
  if (hearth) { const [hx, hz] = map(W / 2 + (away < 0 ? 0.0 : 0.0), D - 0.45); B.fireplace(hx, hz, { dir: (face + 180) % 360, w: 2.6, h: 2.4, chunk: ch }); }
  if (bed && W >= 5) { const [bx, bz] = map(away > 0 ? W - 1.0 : 1.0, D - 1.35); B.bed(bx, bz, { dir: headDir, id: 'bed_' + b.id, chunk: ch }); }
  if (table) {
    const tu = away > 0 ? W * 0.64 : W * 0.36, [tx, tz] = map(tu, D * 0.4), along = S ? [1.5, 0.9] : [0.9, 1.5];
    B.table(tx, tz, along[0], along[1], { chunk: ch });
    const off = S ? [[0, 0.95], [0, -0.95]] : [[0.95, 0], [-0.95, 0]];
    B.chair(tx + off[0][0], tz + off[0][1], S ? 180 : 270, { name: 'sit_' + b.id, chunk: ch }); B.chair(tx + off[1][0], tz + off[1][1], S ? 0 : 90, { chunk: ch });
    B.prop('mug', tx - 0.3, 0.85, tz + 0.1); B.prop('bread', tx + 0.3, 0.85, tz - 0.1); B.candle(tx, 0.85, tz, { chunk: ch });
  }
  if (chest) { const [cx, cz] = map(away > 0 ? W - 0.55 : 0.55, 0.75); B.chest(cx, cz, { dir: face, ...chest, chunk: ch, w: 0.9, d: 0.55 }); }
  return b;
}

// ---------------------------------------------------------------- the tavern
export function buildTavern(B) {
  const b = B.house({ id: 'tavern', x: 8, z: 14, w: 18, d: 18, h: 4.8, door: { side: 'W', at: 9, w: 2, id: 'tavern_door' }, doors: [{ side: 'S', at: 14, w: 1.6, id: 'tavern_back', locked: true, keyId: 'tavernkey', lockLevel: 1 }], windows: [{ side: 'W', at: 3, w: 1.1 }, { side: 'W', at: 15, w: 1.1 }, { side: 'S', at: 4 }, { side: 'S', at: 9 }, { side: 'N', at: 5 }, { side: 'N', at: 13 }, { side: 'E', at: 5 }, { side: 'E', at: 13 }], wall: 'plaster', roofMat: 'roofRed', chimney: [24.5, 21] });
  const c = b.chunk;
  // kitchen partition (row z=27..28) with a door
  B.wall({ axis: 'x', a: 9, b: 25, c: 27.5, h: 4.8, t: 0.4, mat: 'plasterDark', chunk: c, openings: [{ at: 8, w: 1.5, top: 2.4, kind: 'door' }] });
  B.door({ axis: 'x', x: 17, z: 27.5, w: 1.5, h: 2.4, hinge: 'a', id: 'tavern_kitchen', chunk: c });
  // taproom
  B.rug(15, 20, 6, 4, 'rug');
  B.fireplace(24.55, 20, { dir: 270, w: 3.2, h: 2.6, chunk: c });
  B.bar(13, 24.4, 23, 25.4, { chunk: c });
  B.solid('timber', 22.9, 0, 24.4, 23.4, 1.4, 25.4, { chunk: c, nav: true });
  B.prop('mug', 15, 1.06, 24.9); B.prop('mug', 17.3, 1.06, 24.9); B.prop('bottle', 19, 1.06, 24.9); B.prop('jug', 20.5, 1.06, 24.95); B.prop('candlestick', 21.5, 1.06, 24.9);
  B.shelf(13.9, 27.05, { dir: 180, w: 2.8, h: 2.4, chunk: c, books: false, loot: [['gold', 6]], name: 'bottle shelf' });
  for (let i = 0; i < 5; i++) B.prop(i % 2 ? 'bottle' : 'jug', 12.9 + i * 0.5, 1.22 + (i % 3) * 0.02, 26.75, { sleep: true });
  const seats = [[12.5, 17.5], [12.5, 21.5], [17.5, 16.7], [20.3, 17.5]];
  seats.forEach(([tx, tz], i) => {
    B.table(tx, tz, 1.8, 1.0, { chunk: c }); B.candle(tx, 0.85, tz, { chunk: c, range: 5, intensity: 3.6 }); B.prop('mug', tx - 0.4, 0.85, tz + 0.1); B.prop('mug', tx + 0.4, 0.85, tz - 0.1);
    B.chair(tx - 0.5, tz + 0.95, 180, { name: `tav_seat_${i * 2}`, chunk: c }); B.chair(tx + 0.5, tz - 0.95, 0, { name: `tav_seat_${i * 2 + 1}`, chunk: c });
  });
  B.chandelier(16, 4.2, 20, { r: 1.0, candles: 8, chunk: c });
  B.torch(9.6, 2.5, 17.5, { dir: [1, 0], chunk: c, range: 9, intensity: 8 }); B.torch(9.6, 2.5, 26, { dir: [1, 0], chunk: c, range: 9, intensity: 8 });
  B.banner(17, 2.0, 31.2, { dir: 180, w: 1.2, h: 1.6, mat: 'blackCloth', emblem: false });
  B.poi('tav_bar', 17.5, 26.2, { yaw: 180, type: 'stand' }); B.poi('tav_sweep', 12, 19, { yaw: 90, type: 'stand' });
  B.poi('tav_door_in', 10.5, 23, { yaw: 90, type: 'stand' });
  // kitchen & storeroom
  B.hearth(22.5, 0, 29.3, { r: 0.5, range: 11, intensity: 10, chunk: c });
  B.table(14.5, 29.5, 2.4, 1.0, { chunk: c }); B.prop('sack', 23.2, 0, 30.7); B.prop('sack', 24, 0, 30.3, { yaw: 40 }); B.prop('barrel', 22.6, 0, 30.8); B.prop('bread', 13.6, 0.85, 29.5); B.prop('bread', 14.6, 0.85, 29.7); B.prop('cheese', 15.3, 0.85, 29.4);
  B.chest(10.5, 28.6, { dir: 90, loot: [['gold', 24], ['cellarkey', 1]], locked: true, lockLevel: 1, name: 'Strongbox', id: 'tavern_strongbox', w: 0.9, d: 0.55, chunk: c });
  B.torch(24.5, 2.4, 27.8, { dir: [-1, 0], chunk: c, range: 8, intensity: 7 });
  B.poi('tav_cook', 20, 29.3, { yaw: 90, type: 'stand' });
  // the barkeep sleeps in the back
  B.bed(11.2, 30.0, { dir: 0, id: 'bed_tavern', chunk: c });
  B.candle(10.0, 0.5, 28.6, { chunk: c, range: 4, intensity: 2.6 });
  // the yard outside
  B.bench(5.2, 27.5, 2.0, 0.45, { chunk: 'street' }); B.bench(5.2, 17, 2.0, 0.45, { chunk: 'street' });
  B.lampPost(6.5, 22, { range: 13 });
  return b;
}

// ---------------------------------------------------------------- the smithy
export function buildSmithy(B) {
  const b = B.house({ id: 'smithy', x: -24, z: 49, w: 16, d: 14, h: 4.2, wall: 'stoneDark', timber: false, door: { side: 'E', at: 7, w: 5.5, kind: 'arch', h: 3.3 }, doors: [{ side: 'S', at: 4, w: 1.5, id: 'smithy_back' }], windows: [{ side: 'S', at: 11 }, { side: 'N', at: 5 }, { side: 'N', at: 11 }, { side: 'W', at: 7 }], roofMat: 'roofSlate', chimney: [-22, 52], noise: 3 });
  const c = b.chunk;
  // partition: living room in the back (west)
  B.wall({ axis: 'z', a: 50, b: 62, c: -17.5, h: 4.2, t: 0.4, mat: 'plasterDark', chunk: c, openings: [{ at: 3, w: 1.5, top: 2.4, kind: 'door' }] });
  B.door({ axis: 'z', x: -17.5, z: 53, w: 1.5, h: 2.4, hinge: 'a', chunk: c });
  B.hearth(-14, 0, 60.5, { r: 0.6, range: 16, intensity: 18, chunk: c });
  B.solid('stoneDark', -15.6, 0, 60.9, -12.4, 1.0, 62.1, { chunk: c }); // forge hood base
  B.solid('iron', -14.5, 0, 55.4, -13.5, 0.95, 56.4, { chunk: c, kind: 'iron' }); // anvil block
  B.vbox('iron', -14.8, 0.95, 55.5, -13.2, 1.15, 56.3, { chunk: c, bevel: 0.03 });
  B.poi('anvil', -14.0, 57.2, { yaw: 180, type: 'stand' }); B.poi('forge', -14.2, 59.5, { yaw: 0, type: 'stand' }); B.poi('smith_idle', -11, 55, { yaw: 90, type: 'stand' });
  B.prop('barrel', -11, 0, 62.4); B.prop('bucket', -11.5, 0, 60.5); B.prop('crateS', -12, 0, 50.9);
  // weapon racks on the north wall, swords worth taking
  const rack = B.chest(-10.6, 50.9, { dir: 0, loot: [['sword', 1], ['dagger', 1], ['gold', 18]], name: 'Weapon rack', id: 'smithy_rack', w: 1.6, d: 0.5, chunk: c, mat: 'timber', metal: false });
  B.torch(-8.9, 2.6, 56, { dir: [1, 0], chunk: c, range: 10, intensity: 9 });
  B.torch(-8.9, 2.6, 62, { dir: [1, 0], chunk: c, range: 10, intensity: 9 });
  // back room
  B.bed(-22.6, 52.2, { dir: 0, id: 'bed_smithy', chunk: c });
  B.table(-21, 59, 1.8, 0.9, { chunk: c }); B.chair(-21, 57.9, 0, { chunk: c }); B.candle(-21, 0.85, 59, { chunk: c }); B.prop('mug', -20.4, 0.85, 59.1);
  B.chest(-22.5, 61.4, { dir: 90, loot: [['gold', 30], ['locket', 1]], locked: true, name: "Smith's strongbox", chunk: c, w: 0.9, d: 0.55 });
  B.poi('sit_smithy', -21, 59, { yaw: 180, type: 'sit', y: 0.45, approach: [-21, 57.6] });
  // the shop table in front
  B.table(-6.6, 55, 1.0, 2.6, { chunk: 'street' }); B.prop('candlestick', -6.6, 0.85, 54.4);
  return b;
}

// ---------------------------------------------------------------- houses
export function buildHouses(B) {
  const out = {};
  // the watch house: bunks, a rack of spears, the gate key
  let b = out.watch = B.house({ id: 'watch', x: -20, z: 15, w: 12, d: 10, h: 4.4, wall: 'stoneDark', timber: false, zone: 1, door: { side: 'E', at: 4, w: 1.7, id: 'watch_door' }, windows: [{ side: 'S', at: 3 }, { side: 'S', at: 9 }, { side: 'N', at: 6 }], roofMat: 'roofSlate' });
  const [x0, z0, x1, z1] = b.inner;
  for (let i = 0; i < 3; i++) B.bed(x0 + 1 + i * 2.3, z0 + 1.2, { dir: 0, id: 'bed_watch_' + i, chunk: b.chunk });
  B.table(-13.5, 21.3, 2.2, 1.0, { chunk: b.chunk }); B.chair(-14.4, 22.5, 180, { name: 'sit_watch_0', chunk: b.chunk }); B.chair(-12.6, 22.5, 180, { name: 'sit_watch_1', chunk: b.chunk }); B.chair(-13.5, 20.1, 0, { name: 'sit_watch_2', chunk: b.chunk });
  B.candle(-13.5, 0.85, 21.3, { chunk: b.chunk }); B.prop('mug', -14, 0.85, 21.4); B.prop('bread', -13, 0.85, 21.2);
  B.torch(-19, 2.5, 20, { dir: [1, 0], chunk: b.chunk, range: 9, intensity: 8 }); B.torch(-9.1, 2.5, 21, { dir: [-1, 0], chunk: b.chunk, range: 9, intensity: 7 });
  B.chest(-11.6, 15.9, { dir: 0, loot: [['gatekey', 1], ['gold', 22], ['bread', 2]], locked: true, lockLevel: 1, name: 'Watch lockbox', id: 'watch_box', w: 0.9, d: 0.55, chunk: b.chunk });
  B.poi('watch_table', -13.5, 21.3, { yaw: 0, type: 'stand' });
  // the weaver: a loom and a bed
  b = out.weaver = B.house({ id: 'weaver', x: -16, z: 28, w: 8, d: 9, h: 4, zone: 1, door: { side: 'E', at: 4.5, w: 1.6, id: 'weaver_door' }, windows: [{ side: 'S', at: 2.5 }, { side: 'N', at: 3 }, { side: 'W', at: 5 }, { side: 'E', at: 1.5 }], roofMat: 'roofRed' });
  dressHome(B, b, { chest: { loot: [['gold', 14], ['cloth', 1]], name: 'Chest', locked: false } });
  B.solid('timber', -15, 0, 35.3, -12.6, 1.8, 35.9, { chunk: b.chunk, kind: 'wood' }); B.vbox('linen', -14.9, 0.4, 35.4, -12.7, 1.5, 35.6, { chunk: b.chunk });
  B.poi('loom', -13.8, 34.6, { yaw: 0, type: 'stand' });
  // the cooper
  b = out.cooper = B.house({ id: 'cooper', x: -16, z: 39, w: 8, d: 8, h: 4, zone: 1, door: { side: 'E', at: 4, w: 1.6, id: 'cooper_door' }, windows: [{ side: 'S', at: 2.5 }, { side: 'W', at: 4 }, { side: 'N', at: 5 }], roofMat: 'roofSlate' });
  dressHome(B, b, { chest: { loot: [['gold', 9], ['jug', 1]], name: 'Tool chest' } });
  for (let i = 0; i < 4; i++) B.prop('barrel', -14.5 + i * 0.8, 0, 45.6, { yaw: r(0, 90) });
  B.poi('cooper_work', -13, 44.4, { yaw: 180, type: 'stand' });
  // the baker
  b = out.baker = B.house({ id: 'baker', x: 10, z: 36, w: 10, d: 10, h: 4, zone: 1, door: { side: 'W', at: 5, w: 1.7, id: 'baker_door' }, doors: [], windows: [{ side: 'S', at: 3 }, { side: 'S', at: 7 }, { side: 'N', at: 5 }, { side: 'E', at: 5 }], roofMat: 'roofRed', chimney: [18, 44] });
  B.fireplace(18.6, 41.5, { dir: 270, w: 3.6, h: 2.4, chunk: b.chunk });
  B.hearth(18.2, 0, 41.5, { r: 0.5, range: 12, intensity: 12, chunk: b.chunk, stone: false });
  B.table(14.4, 39.6, 2.6, 1.2, { chunk: b.chunk }); B.prop('bread', 13.6, 0.85, 39.4); B.prop('bread', 14.4, 0.85, 39.9); B.prop('bread', 15.2, 0.85, 39.5); B.prop('sack', 11, 0, 44.4); B.prop('sack', 11.6, 0, 44.9, { yaw: 30 });
  B.bed(11.2, 37.4, { dir: 0, id: 'bed_baker', chunk: b.chunk }); B.candle(14.4, 0.85, 39.6, { chunk: b.chunk });
  B.chest(16.4, 45.4, { dir: 180, loot: [['gold', 16], ['bread', 3]], name: 'Flour bin', chunk: b.chunk, w: 1.0, d: 0.6 });
  B.poi('oven', 16.4, 41.5, { yaw: 90, type: 'stand' }); B.poi('baker_table', 14.4, 41.4, { yaw: 180, type: 'stand' });
  // the widow's cottage
  b = out.widow = B.house({ id: 'widow', x: 22, z: 38, w: 9, d: 9, h: 3.8, zone: 1, door: { side: 'S', at: 3, w: 1.6, id: 'widow_door' }, windows: [{ side: 'W', at: 4.5 }, { side: 'N', at: 4.5 }, { side: 'E', at: 4.5 }], roofMat: 'roofThatch', chimney: [29, 42] });
  dressHome(B, b, { chest: { loot: [['gold', 8]], name: "Marta's chest", id: 'widow_chest' } });
  // the granary: sacks, barrels and crates for the taking
  b = out.granary = B.house({ id: 'granary', x: 18, z: 52, w: 16, d: 15, h: 5, wall: 'plasterDark', zone: 1, door: { side: 'W', at: 7.5, w: 3, id: 'granary_door', locked: true, keyId: 'granarykey', lockLevel: 1, gate: true }, windows: [{ side: 'S', at: 4, w: 0.8 }, { side: 'N', at: 8, w: 0.8 }], roofMat: 'roofRed', floor: 'floorWood', noise: 2 });
  for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) B.prop('sack', 20.5 + i * 0.7, 0, 62.5 + j * 0.7, { yaw: r(0, 90) });
  for (let i = 0; i < 6; i++) B.prop('barrel', 22 + i * 1.5, 0, 53.6, { yaw: r(0, 360) });
  for (let i = 0; i < 4; i++) B.prop('crate', 30 + (i % 2) * 0.7, (i > 1 ? 0.6 : 0), 55 + Math.floor(i / 2) * 0.1, { yaw: r(0, 30) });
  B.chest(32.4, 63.6, { dir: 180, loot: [['gold', 55], ['gem', 1]], locked: true, lockLevel: 2, name: "Reeve's strongbox", id: 'granary_box', w: 1.0, d: 0.6, chunk: b.chunk });
  B.torch(19.6, 3, 59, { dir: [1, 0], chunk: b.chunk, range: 9, intensity: 8 });
  // filler houses so the town feels crowded
  const fill = [
    ['h_e1', 36, 16, 10, 9, 'W', 4.5, 'roofSlate', 'plaster'], ['h_e2', 36, 30, 9, 9, 'W', 4.5, 'roofThatch', 'plaster'], ['h_e3', 36, 44, 10, 9, 'W', 4.5, 'roofRed', 'plasterDark'], ['h_e4', 36, 60, 9, 10, 'W', 5, 'roofSlate', 'plaster'], ['h_e5', 36, 74, 10, 10, 'S', 5, 'roofThatch', 'plaster'],
    ['h_w1', -46, 16, 12, 9, 'E', 4.5, 'roofSlate', 'plasterDark'], ['h_w2', -46, 30, 12, 9, 'E', 4.5, 'roofThatch', 'plaster'], ['h_w3', -46, 44, 12, 9, 'E', 4.5, 'roofRed', 'plaster'],
  ];
  for (const [id, x, z, w, d, side, at, roof, wall] of fill) {
    if (!side) continue;
    const bb = B.house({ id, x, z, w, d, h: 4, wall, zone: 1, door: { side, at, w: 1.6, id: id + '_door' }, windows: [{ side: side === 'W' || side === 'E' ? 'S' : 'W', at: 3 }, { side: 'N', at: w / 2 }, { side: side === 'W' ? 'E' : 'W', at: d / 2 }], roofMat: roof });
    dressHome(B, bb, { chest: { loot: [['gold', 5 + Math.floor(r(0, 14))]], name: 'Chest' } });
    out[id] = bb;
  }
  // stables in the north of the town
  b = out.stables = B.house({ id: 'stables', x: 12, z: 76, w: 14, d: 12, h: 4.2, wall: 'plank', timber: false, zone: 0, door: { side: 'S', at: 7, w: 5, kind: 'arch', h: 3.2 }, windows: [{ side: 'N', at: 4, w: 0.8 }, { side: 'N', at: 10, w: 0.8 }], roofMat: 'roofThatch', floor: 'dirt', noise: 0 });
  for (const sx of [15, 19, 23]) { B.solid('timber', sx - 1.6, 0, 80, sx - 1.5, 1.6, 86, { chunk: b.chunk, nav: false }); }
  for (let i = 0; i < 6; i++) B.prop('hay', 14 + (i % 3) * 3.8, 0, 86.4 - Math.floor(i / 3) * 0.1, { yaw: r(-10, 10) });
  B.prop('bucket', 24, 0, 77.6); B.torch(13.6, 2.5, 82, { dir: [1, 0], chunk: b.chunk, range: 9, intensity: 8 });
  return out;
}

// ---------------------------------------------------------------- the chapel of the Pale Saint & graveyard
export function buildChapel(B) {
  const b = B.house({ id: 'chapel', x: -36, z: 66, w: 16, d: 20, h: 7.2, wall: 'stoneWall', timber: false, zone: 0, rise: 4.5, noise: 1,
    door: { side: 'E', at: 10, w: 2.2, id: 'chapel_door', h: 3.2 }, doors: [{ side: 'W', at: 14, w: 1.6, id: 'chapel_back' }],
    windows: [{ side: 'E', at: 4, w: 1.1, sill: 2.4, top: 5.6 }, { side: 'E', at: 16, w: 1.1, sill: 2.4, top: 5.6 }, { side: 'W', at: 4, w: 1.1, sill: 2.4, top: 5.6 }, { side: 'W', at: 9, w: 1.1, sill: 2.4, top: 5.6 }, { side: 'N', at: 8, w: 1.6, sill: 2.4, top: 6 }], roofMat: 'roofSlate', floor: 'flagstone', ceilMat: 'stoneDark' });
  const c = b.chunk;
  // pews facing the altar (north)
  const pews = [];
  for (let row = 0; row < 4; row++) for (const px of [-32, -25]) { const z = 71 + row * 2.4; B.bench(px, z, 4.4, 0.55, { chunk: c, h: 0.5 }); B.vbox('timber', px - 2.2, 0.5, z + 0.22, px + 2.2, 1.0, z + 0.3, { chunk: c }); pews.push([px, z]); }
  // altar, statue, candles
  B.solid('stoneOld', -31.5, 0, 82.5, -25.5, 1.2, 84, { chunk: c, bevel: 0.05 });
  B.vbox('linen', -31.4, 1.2, 82.6, -25.6, 1.26, 83.9, { chunk: c });
  const k = B.kit(c);
  k.add(B.pal.bone, E.cone({ radius: 0.55, height: 3.4, radialSegments: 8, heightSegments: 1 }), [-28.5, 2.9, 85.1]);
  k.add(B.pal.bone, E.sphere({ radius: 0.28, widthSegments: 10, heightSegments: 8 }), [-28.5, 4.9, 85.1]);
  k.box(B.pal.bone, [-28.5, 4.0, 85.1], [2.3, 0.22, 0.28]); k.add(B.pal.bone, E.torus({ radius: 0.55, tube: 0.05, radialSegments: 6, tubularSegments: 20 }), [-28.5, 5.05, 85.1], [0, 0, 0]);
  B.collider(-29.2, 0, 84.5, -27.8, 5, 85.6, 'stone');
  B.banner(-33.6, 2.4, 85.4, { dir: 0, w: 1.3, h: 3.5, mat: 'blackCloth', emblem: false }); B.banner(-23.4, 2.4, 85.4, { dir: 0, w: 1.3, h: 3.5, mat: 'blackCloth', emblem: false });
  for (const cx of [-31, -30, -27, -26]) B.candle(cx, 1.26, 83.2, { chunk: c, range: 7, intensity: 4.6 });
  for (const cx of [-33.2, -23.8]) for (const cz of [70, 76, 82]) B.candle(cx, 1.3, cz, { chunk: c, holder: true, range: 6, intensity: 4 });
  B.pillar(-29.5, 74, { h: 6, mat: 'stoneWall', chunk: c, r: 0.5 }); B.pillar(-27.5, 74, { h: 6, mat: 'stoneWall', chunk: c, r: 0.5 });
  B.chandelier(-28.5, 5.0, 77, { r: 1.2, candles: 10, chunk: c });
  B.torch(-21.4, 3.0, 80, { dir: [-1, 0], chunk: c, range: 10, intensity: 9 });
  pews.slice(0, 4).forEach(([px, z], i) => B.poi('pray_' + i, px + (i % 2 ? 0.8 : -0.8), z - 0.9, { yaw: 0, type: 'kneel', y: 0 }));
  B.poi('altar', -28.5, 81.6, { yaw: 0, type: 'stand' }); B.poi('chapel_idle', -28.5, 69, { yaw: 0, type: 'stand' });
  B.searchSpot(-28.5, 1.25, 83.2, { name: 'offering bowl', loot: [['gold', 20]], id: 'offering' });
  // the priest's cell in the south-west corner
  B.wall({ axis: 'x', a: -35, b: -30, c: 71.5, h: 3.6, t: 0.4, mat: 'plasterDark', chunk: c, openings: [{ at: 4, w: 1.4, top: 2.4, kind: 'door' }] });
  B.wall({ axis: 'z', a: 67, b: 72, c: -29.5, h: 3.6, t: 0.4, mat: 'plasterDark', chunk: c });
  B.door({ axis: 'x', x: -31, z: 71.5, w: 1.4, h: 2.4, hinge: 'a', chunk: c, id: 'cell_door' });
  B.bed(-33.8, 68.5, { dir: 0, id: 'bed_priest', chunk: c }); B.chest(-31.2, 67.9, { dir: 0, loot: [['mausoleumkey', 1], ['gold', 12], ['book', 1]], locked: true, lockLevel: 1, name: "Priest's coffer", id: 'priest_coffer', chunk: c, w: 0.9, d: 0.55 });
  B.candle(-34.5, 0.5, 68.5, { chunk: c, range: 4, intensity: 2.6 });
  B.useChunk('graveyard');
  // graveyard: iron fence, headstones, dead trees
  const gx0 = -47, gx1 = -36, gz0 = 62, gz1 = 92;
  B.ground('grass', gx0, gz0, gx1, gz1, 0.0, 0.05, { chunk: 'graveyard', noise: 0 });
  fenceLine(B, gx0, gz0, -41.5, gz0, { chunk: 'graveyard', mat: 'iron' }); fenceLine(B, -38.5, gz0, gx1, gz0, { chunk: 'graveyard', mat: 'iron' });
  B.collider(gx0, 0, gz0 - 0.1, -41.5, 1.2, gz0 + 0.1, 'iron'); B.collider(-38.5, 0, gz0 - 0.1, gx1, 1.2, gz0 + 0.1, 'iron');
  B.nav.block(gx0, gz0 - 0.2, -41.5, gz0 + 0.2, 1); B.nav.block(-38.5, gz0 - 0.2, gx1, gz0 + 0.2, 1);
  B.torch(-38.4, 1.9, 61.7, { dir: [0, -1], chunk: 'graveyard', range: 11, intensity: 8, name: 'graveyard torch' }); B.torch(-41.6, 1.9, 61.7, { dir: [0, -1], chunk: 'graveyard', range: 11, intensity: 8, name: 'graveyard torch' });
  const kinds = ['stone', 'cross', 'stone', 'cross', 'slab'];
  for (let i = 0; i < 30; i++) { const x = -46 + (i % 5) * 2.1 + r(-0.3, 0.3), z = 64 + Math.floor(i / 5) * 2.9 + r(-0.3, 0.3); if (z > 80 && x < -38) continue; B.tomb(x, z, { dir: r(-10, 10), kind: kinds[i % 5] }); }
  for (const [x, z] of [[-44, 66], [-38, 79], [-45, 78], [-37, 90]]) deadTree(B, x, z, 1.1, 'graveyard');
  B.poi('grave_walk_a', -41, 63.5, { type: 'stand' }); B.poi('grave_walk_b', -40, 80, { type: 'stand' }); B.poi('grave_walk_c', -44, 70, { type: 'stand' });
  B.route('graveyard_beat', [[-40, 64], [-40, 78], [-44, 78], [-44, 68]]);
  // the mausoleum (the way down)
  const m = B.house({ id: 'mausoleum', x: -46, z: 81, w: 9, d: 9, h: 4.6, wall: 'stoneOld', timber: false, zone: 1, door: { side: 'S', at: 4.5, w: 1.7, id: 'mausoleum_door', locked: true, keyId: 'mausoleumkey', lockLevel: 2, h: 2.8 }, roofMat: 'roofSlate', floor: 'flagstone', noise: 1, rise: 2.2 });
  B.solid('stoneDark', -43.4, 0, 86.3, -41.6, 0.9, 88.6, { chunk: m.chunk, bevel: 0.06 }); B.solid('stoneDark', -40.2, 0, 84.2, -39.2, 0.7, 86.6, { chunk: m.chunk, bevel: 0.05 });
  B.candle(-42.5, 0.9, 87.4, { chunk: m.chunk, range: 5, intensity: 4 });
  B.torch(-41.2, 2.4, 82.6, { dir: [0, 1], chunk: m.chunk, range: 8, intensity: 7, name: 'crypt torch' });
  B.prop('skull', -42.5, 0.9, 87.9); B.prop('candlestick', -41, 0.7, 85.5);
  B.poi('crypt_entrance', -42.3, 83.6, { type: 'stand' });
  // the steps down: an interaction that carries the player below (crypt.js sets the target)
  B.stairsDown = { x: -42.3, z: 86.2, r: 1.6 };
  return b;
}

// ---------------------------------------------------------------- market plaza
export function buildPlaza(B) {
  B.useChunk('market');
  B.well(2, 60);
  const stalls = [[-5, 51, 0, 'fruit', 'canvasDirty'], [3, 51, 0, 'bread', 'crimson'], [9, 51, 0, 'pots', 'canvasDirty'], [-5, 70, 180, 'cloth', 'rugBlue'], [3, 70, 180, 'fish', 'canvasDirty'], [10, 70, 180, 'herbs', 'crimson']];
  stalls.forEach(([x, z, dir, goods, mat], i) => B.stall(x, z, { dir, goods, mat, name: 'stall_' + i, w: 3.2 }));
  // a hanging cage: a corpse the Duke's justice left for the crows
  const gx = 11.5, gz = 60;
  B.solid('timber', gx - 0.15, 0, gz - 0.15, gx + 0.15, 4.4, gz + 0.15, { chunk: 'market', kind: 'wood' });
  B.vbox('timber', gx - 2.3, 4.3, gz - 0.1, gx + 0.15, 4.5, gz + 0.1, { chunk: 'market' });
  const cage = new E.Node('Cage'); const ck = new E.Kit(B.pal);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; ck.cyl(B.pal.iron, [Math.cos(a) * 0.32, 0, Math.sin(a) * 0.32], 0.014, 1.0, [0, 0, 0], 4); }
  for (const yy of [-0.5, -0.2, 0.15, 0.5]) ck.add(B.pal.iron, E.torus({ radius: 0.32, tube: 0.014, radialSegments: 4, tubularSegments: 16 }), [0, yy, 0], [90, 0, 0]);
  ck.cyl(B.pal.bone, [0, -0.15, 0], 0.13, 0.7, [0, 0, 8], 6); ck.add(B.pal.bone, E.sphere({ radius: 0.11, widthSegments: 8, heightSegments: 6 }), [0.03, 0.25, 0]);
  cage.add(ck.toNode('Cage'));
  B.decor.add(cage);
  const cb = new E.Body({ shape: new E.Box([0.32, 0.5, 0.32]), position: [gx - 2.1, 3.2, gz], mass: 30, angularDamping: 1.5, linearDamping: 0.1 });
  cb.node = cage; cb.userData.kind = 'wood'; cb.userData.cage = true; B.world.add(cb);
  B.world.add(new E.DistanceJoint(null, cb, [gx - 2.1, 4.4, gz], [gx - 2.1, 3.7, gz]));
  cb.applyImpulse([2, 0, 0.5]);
  B.cage = cb;
  B.solid('timber', 4.6, 0, 63.4, 5.4, 1.8, 63.6, { chunk: 'market', kind: 'wood' }); // notice board
  B.vbox('parchment', 4.7, 1.0, 63.35, 5.3, 1.6, 63.4, { chunk: 'market' });
  B.interactables.push({ kind: 'note', x: 5, y: 1.3, z: 63.3, r: 1.8, obj: { id: 'notice' }, prompt: () => 'Read the notice', use: (g) => g.readNote('notice') });
  // a cart
  B.solid('plank', -1.8, 0.5, 64.5, 0.4, 0.9, 66.3, { chunk: 'market', kind: 'wood' }); for (const [wx, wz] of [[-1.8, 64.2], [-1.8, 66.6], [0.4, 64.2], [0.4, 66.6]]) B.kit('market').add(B.pal.timber, E.cylinder({ radiusTop: 0.5, radiusBottom: 0.5, height: 0.1, radialSegments: 10 }), [wx, 0.5, wz], [90, 0, 0]);
  B.prop('sack', -1.3, 0.9, 65.4); B.prop('crateS', -0.4, 0.9, 65.4);
  // plaza wander points and patrol
  const pts = [[-2, 55], [6, 56], [-4, 61], [7, 66], [0, 66], [-6, 57]]; pts.forEach((p, i) => B.poi('plaza_' + i, p[0], p[1], { type: 'stand' }));
  B.route('plaza_beat', [[-6, 52], [6, 52], [6, 68], [-6, 68]]);
  B.route('street_beat', [[0, 20], [0, 44], [0, 74], [0, 44]]);
  B.route('north_gate_beat', [[-1.5, 80], [1.5, 88], [-1.5, 88], [1.5, 80]]);
  B.torch(-7.2, 2.6, 62, { dir: [1, 0], chunk: 'market', range: 10, intensity: 9 });
  B.torch(13.2, 2.6, 56, { dir: [-1, 0], chunk: 'market', range: 10, intensity: 9 });
}
