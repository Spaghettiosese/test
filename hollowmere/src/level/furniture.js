// Doors, torches, candles, chests, tables, beds and the loose physics props that make the
// rooms feel lived in. These extend Builder.
import * as E from '../../../engine/index.js';
import { Builder } from './builder.js';

const P = Builder.prototype;
const rad = (d) => (d * Math.PI) / 180;

// ---------------------------------------------------------------- doors
// A door leaf hangs on a hinge Part; while it is shut a static box blocks the doorway.
P.door = function door({ axis = 'x', x, z, y = 0, w = 1.6, h = 2.5, hinge = 'a', mat = 'door', locked = false, keyId = null, lockLevel = 1, id = null, chunk, gate = false, name = 'door', heavy = false, autoClose = true }) {
  const M = this.pal[mat] || this.pal.door;
  const leaf = new E.Node('Door'), k = new E.Kit(this.pal);
  const t = gate ? 0.22 : 0.12;
  k.box(M, [w / 2, h / 2, 0], [w - 0.03, h, t], [0, 0, 0], 0.01);
  for (const fy of [0.2, 0.8]) k.box(this.pal.iron, [w / 2, h * fy, t / 2 + 0.012], [w - 0.06, 0.09, 0.02]);
  for (const fx of [0.25, 0.5, 0.75]) k.box(this.pal.iron, [w * fx, h / 2, t / 2 + 0.008], [0.05, h - 0.1, 0.015]);
  k.box(this.pal.iron, [w - 0.16, Math.min(1.1, h * 0.45), t / 2 + 0.04], [0.06, 0.06, 0.06]);
  k.box(this.pal.iron, [w - 0.16, Math.min(1.1, h * 0.45), -t / 2 - 0.04], [0.06, 0.06, 0.06]);
  if (gate) for (const yy of [0.35, 0.65]) k.box(this.pal.iron, [w / 2, h * yy, -t / 2 - 0.02], [w - 0.04, 0.08, 0.02]);
  leaf.add(k.toNode('Door leaf'));
  const pivot = new E.Node('Door pivot');
  pivot.add(leaf);
  // hinge position & orientation
  const half = w / 2;
  let px = x, pz = z, rotY = 0;
  if (axis === 'x') { px = hinge === 'a' ? x - half : x + half; rotY = hinge === 'a' ? 0 : 180; } else { pz = hinge === 'a' ? z - half : z + half; rotY = hinge === 'a' ? -90 : 90; }
  pivot.position.set([px, y, pz]); E.quat.fromEuler(pivot.rotation, 0, rotY, 0);
  this.decor.add(pivot);
  const part = new E.Part(pivot, { type: 'hinge', axis: [0, 1, 0], min: -110, max: 110, stiffness: 55, damping: 13 });
  // base rotation is rotY; Part composes baseRot * axisAngle
  const body = new E.Body({ shape: new E.Box(axis === 'x' ? [half, h / 2, 0.09] : [0.09, h / 2, half]), type: 'static', position: [x, y + h / 2, z], friction: 0.6 });
  body.userData.kind = 'wood'; body.userData.door = true;
  this.world.add(body);
  const d = { id, name, axis, x, y, z, w, h, hinge, part, pivot, body, blocking: true, locked, keyId, lockLevel, openT: 0, target: 0, gate, heavy, autoClose, near: 0, opener: null, jammed: false, broken: false };
  d.isOpen = () => Math.abs(part.target) > 5;
  d.open = (fromX, fromZ) => {
    if (d.jammed) return false;
    // swing the leaf away from whoever opens it
    const Lx = axis === 'x' ? (hinge === 'a' ? 1 : -1) : 0, Lz = axis === 'z' ? (hinge === 'a' ? 1 : -1) : 0;
    const side = axis === 'x' ? (Math.sign(fromZ - z) || 1) : (Math.sign(fromX - x) || 1);
    const sgn = axis === 'x' ? side * Lx : -side * Lz;
    part.set(sgn * 100); d.openT = 0; this.emit?.('door', d);
    return true;
  };
  d.close = () => { part.set(0); this.emit?.('doorClose', d); };
  d.toggle = (fx, fz) => (d.isOpen() ? d.close() : d.open(fx, fz));
  d.center = () => [x, y + 1, z];
  this.doors.push(d);
  return d;
};
P.updateDoors = function updateDoors(dt, actors) {
  for (const d of this.doors) {
    d.part.update(dt);
    const open = Math.abs(d.part.value) > 22;
    if (open && d.blocking) { this.world.remove(d.body); d.blocking = false; }
    else if (!open && !d.blocking && Math.abs(d.part.value) < 8 && !d.part.target) { d.body.wake?.(); this.world.add(d.body); d.blocking = true; }
    // close after a while when nobody is near
    if (d.isOpen() && d.autoClose) {
      let near = false;
      for (const a of actors) if (Math.hypot(a[0] - d.x, a[2] - d.z) < 2.4) { near = true; break; }
      d.openT = near ? 0 : d.openT + dt;
      if (d.openT > 5 && !d.hold) d.close();
    }
  }
};

// ---------------------------------------------------------------- light sources
// A wall torch: bracket, stick and flame, a flickering light, and a snuff interaction.
P.torch = function torch(x, y, z, { dir = [0, 1], lit = true, range = 11, intensity = 11, color = '#ff9a48', chunk, name = 'torch', big = false, key = null } = {}) {
  const k = this.kit(chunk), nx = dir[0], nz = dir[1];
  k.box(this.pal.iron, [x - nx * 0.05, y - 0.05, z - nz * 0.05], [0.07, 0.07, 0.07]);
  k.box(this.pal.iron, [x + nx * 0.06, y - 0.22, z + nz * 0.06], [0.05, 0.4, 0.05], [nz * 10, 0, -nx * 10]);
  k.add(this.pal.timber, E.cylinder({ radiusTop: 0.032, radiusBottom: 0.026, height: 0.5, radialSegments: 6 }), [x + nx * 0.1, y + 0.02, z + nz * 0.1]);
  k.add(this.pal.blackCloth, E.sphere({ radius: 0.055, widthSegments: 6, heightSegments: 5 }), [x + nx * 0.1, y + 0.3, z + nz * 0.1], [0, 0, 0], [1, 1.4, 1]);
  const flame = new E.Mesh(E.cone({ radius: big ? 0.09 : 0.06, height: big ? 0.28 : 0.2, radialSegments: 6, heightSegments: 1 }), this.pal.flame, 'Flame');
  flame.position.set([x + nx * 0.1, y + 0.4, z + nz * 0.1]); flame.castShadow = false; flame.receiveShadow = false; this.decor.add(flame);
  const light = new E.Light('point', { color, intensity: lit ? intensity : 0, range, flicker: 0.55, profile: 'smooth' });
  light.position.set([x + nx * 0.25, y + 0.5, z + nz * 0.25]); this.decor.add(light);
  const t = { x, y: y + 0.45, z, flame, light, lit, base: intensity, range, phase: Math.random() * 10, kind: 'torch', name, indoor: this.nav.indoorAt(x, z), snuffable: true };
  flame.visible = lit;
  this.torches.push(t); this.lights.push(light);
  this.interactables.push({ kind: 'torch', x, y: t.y, z, r: 1.6, obj: t, prompt: () => (t.lit ? 'Snuff the torch' : null), use: (g) => g.snuff(t) });
  return t;
};
P.candle = function candle(x, y, z, { lit = true, range = 5.5, intensity = 4.2, holder = true, chunk } = {}) {
  const k = this.kit(chunk);
  if (holder) k.cyl(this.pal.goldM, [x, y - 0.008, z], 0.028, 0.016, [0, 0, 0], 8);
  k.cyl(this.pal.candle, [x, y + 0.045, z], 0.014, 0.09, [0, 0, 0], 6);
  const flame = new E.Mesh(E.cone({ radius: 0.011, height: 0.045, radialSegments: 5, heightSegments: 1 }), this.pal.flame, 'Candle flame');
  flame.position.set([x, y + 0.11, z]); flame.castShadow = false; this.decor.add(flame);
  const light = new E.Light('point', { color: '#ffb066', intensity: lit ? intensity : 0, range, flicker: 0.4 });
  light.position.set([x, y + 0.2, z]); this.decor.add(light);
  const t = { x, y: y + 0.12, z, flame, light, lit, base: intensity, range, phase: Math.random() * 10, kind: 'candle', indoor: this.nav.indoorAt(x, z), snuffable: true, small: true };
  flame.visible = lit; this.torches.push(t); this.lights.push(light);
  this.interactables.push({ kind: 'torch', x, y: t.y, z, r: 1.4, obj: t, prompt: () => (t.lit ? 'Pinch out the candle' : null), use: (g) => g.snuff(t) });
  return t;
};
// a standing fire (hearth, brazier, campfire, forge): stone ring, glowing coals, real flames from the FireSystem
P.hearth = function hearth(x, y, z, { r = 0.5, stone = true, range = 14, intensity = 15, chunk, fuel = true } = {}) {
  const k = this.kit(chunk);
  if (stone) for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; k.box(this.pal.stoneDark, [x + Math.cos(a) * r * 1.15, y + 0.09, z + Math.sin(a) * r * 1.15], [0.24, 0.18, 0.2], [0, -a * 180 / Math.PI, 0], 0.03); }
  k.add(this.pal.ember, E.cylinder({ radiusTop: r * 0.8, radiusBottom: r * 0.9, height: 0.12, radialSegments: 10 }), [x, y + 0.06, z]);
  if (fuel) for (let i = 0; i < 4; i++) k.cyl(this.pal.bark, [x, y + 0.16, z], 0.05, r * 1.5, [90, i * 45, 0], 6);
  const light = new E.Light('point', { color: '#ff8c3a', intensity, range, flicker: 0.6 }); light.position.set([x, y + 0.7, z]); this.decor.add(light);
  const f = { x, y, z, r, light, base: intensity, lit: true, phase: Math.random() * 9, kind: 'hearth', indoor: this.nav.indoorAt(x, z) };
  this.fires.push(f); this.lights.push(light);
  return f;
};
P.chandelier = function chandelier(x, y, z, { r = 0.9, candles = 8, chunk } = {}) {
  const k = this.kit(chunk);
  k.add(this.pal.iron, E.torus({ radius: r, tube: 0.035, radialSegments: 6, tubularSegments: 24 }), [x, y, z], [90, 0, 0]);
  k.cyl(this.pal.iron, [x, y + 0.7, z], 0.02, 1.4, [0, 0, 0], 5);
  const light = new E.Light('point', { color: '#ffae5a', intensity: 14, range: 15, flicker: 0.35 }); light.position.set([x, y + 0.25, z]); this.decor.add(light);
  const t = { x, y, z, light, lit: true, base: 14, range: 15, phase: Math.random() * 9, kind: 'chandelier', indoor: 1, flames: [] };
  for (let i = 0; i < candles; i++) {
    const a = (i / candles) * Math.PI * 2, cx = x + Math.cos(a) * r, cz = z + Math.sin(a) * r;
    k.cyl(this.pal.candle, [cx, y + 0.1, cz], 0.02, 0.14, [0, 0, 0], 5);
    const fl = new E.Mesh(E.cone({ radius: 0.014, height: 0.06, radialSegments: 5, heightSegments: 1 }), this.pal.flame, 'flame'); fl.position.set([cx, y + 0.21, cz]); fl.castShadow = false; this.decor.add(fl); t.flames.push(fl);
  }
  t.snuffable = true; this.torches.push(t); this.lights.push(light);
  this.interactables.push({ kind: 'torch', x, y: y, z, r: 0, obj: t, prompt: () => null, use: () => {} });
  return t;
};

// ---------------------------------------------------------------- containers
// A chest: lid on a hinge, opened by the player, holding loot.
P.chest = function chest(x, z, { y = 0, dir = 0, w = 1.0, d = 0.6, loot = [], locked = false, keyId = null, lockLevel = 1, id = null, name = 'Chest', chunk, mat = 'plank', metal = true, gold = false } = {}) {
  const group = new E.Node('Chest'); group.position.set([x, y, z]); E.quat.fromEuler(group.rotation, 0, dir, 0);
  const k = new E.Kit(this.pal), M = this.pal[mat];
  k.box(M, [0, 0.24, 0], [w, 0.48, d], [0, 0, 0], 0.02);
  if (metal) for (const fx of [-0.36, 0.36]) k.box(this.pal.iron, [fx * w / 0.72 * 0.72, 0.24, 0], [0.07, 0.5, d + 0.02]);
  k.box(this.pal.iron, [0, 0.36, d / 2 + 0.012], [0.09, 0.12, 0.02]);
  if (gold) k.box(this.pal.goldM, [0, 0.46, 0], [w * 0.7, 0.03, d * 0.7]);
  group.add(k.toNode('Chest body'));
  const lid = new E.Node('Lid'); lid.position.set([0, 0.48, -d / 2]);
  const lk = new E.Kit(this.pal); lk.box(M, [0, 0.06, d / 2], [w + 0.02, 0.12, d + 0.02], [0, 0, 0], 0.03); lk.add(M, E.cylinder({ radiusTop: 0.2, radiusBottom: 0.2, height: w + 0.02, radialSegments: 10, heightSegments: 1, capTop: true, capBottom: true }), [0, 0.1, d / 2], [0, 0, 90], [1, 1, 1]);
  if (metal) for (const fx of [-0.36, 0.36]) lk.box(this.pal.iron, [fx, 0.13, d / 2], [0.07, 0.1, d + 0.03]);
  lid.add(lk.toNode('Chest lid')); group.add(lid);
  this.decor.add(group);
  const half = Math.abs(Math.cos(rad(dir))) > 0.7 ? [w / 2, d / 2] : [d / 2, w / 2];
  const b = this.collider(x - half[0], y, z - half[1], x + half[0], y + 0.5, z + half[1], 'wood');
  this.nav.block(x - half[0], z - half[1], x + half[0], z + half[1], 1);
  const c = { kind: 'chest', name, x, y: y + 0.4, z, node: group, lid, loot: loot.slice(), locked, keyId, lockLevel, id, opened: false, lidAngle: 0, body: b, r: 1.7 };
  this.containers.push(c);
  this.interactables.push({ kind: 'container', x, y: c.y, z, r: 1.9, obj: c, prompt: () => (c.opened ? (c.loot.length ? 'Take the rest' : null) : c.locked ? `Locked ${name.toLowerCase()}` : 'Open ' + name.toLowerCase()), use: (g) => g.openContainer(c) });
  return c;
};
// search a piece of furniture that is already built (cupboard, shelf, sack, coffin...)
P.searchSpot = function searchSpot(x, y, z, { name = 'Search', loot = [], locked = false, keyId = null, id = null, r = 1.8, verb = 'Search', once = true } = {}) {
  const c = { kind: 'spot', name, x, y, z, loot: loot.slice(), locked, keyId, id, opened: false, r };
  this.containers.push(c);
  this.interactables.push({ kind: 'container', x, y, z, r, obj: c, prompt: () => (c.opened ? null : c.locked ? `Locked ${name.toLowerCase()}` : `${verb} ${name.toLowerCase()}`), use: (g) => g.openContainer(c) });
  return c;
};

// ---------------------------------------------------------------- furniture (solid)
P.table = function table(x, z, w = 2, d = 1, { h = 0.85, y = 0, mat = 'plank', chunk, cloth = null } = {}) {
  const k = this.kit(chunk);
  this.vbox(mat, x - w / 2, y + h - 0.08, z - d / 2, x + w / 2, y + h, z + d / 2, { chunk, bevel: 0.02 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) this.vbox('timber', x + sx * (w / 2 - 0.12) - 0.06, y, z + sz * (d / 2 - 0.12) - 0.06, x + sx * (w / 2 - 0.12) + 0.06, y + h - 0.08, z + sz * (d / 2 - 0.12) + 0.06, { chunk });
  if (cloth) this.vbox(cloth, x - w / 2 - 0.04, y + h - 0.02, z - d / 2 - 0.04, x + w / 2 + 0.04, y + h + 0.015, z + d / 2 + 0.04, { chunk });
  this.collider(x - w / 2, y, z - d / 2, x + w / 2, y + h, z + d / 2, 'wood');
  this.nav.block(x - w / 2 + 0.05, z - d / 2 + 0.05, x + w / 2 - 0.05, z + d / 2 - 0.05, 1);
  return { top: y + h, x, z };
};
P.bench = function bench(x, z, w = 2, d = 0.4, { h = 0.45, y = 0, chunk } = {}) {
  this.vbox('plank', x - w / 2, y + h - 0.06, z - d / 2, x + w / 2, y + h, z + d / 2, { chunk });
  for (const sx of [-1, 1]) this.vbox('timber', x + sx * (w / 2 - 0.15) - 0.05, y, z - d / 2 + 0.03, x + sx * (w / 2 - 0.15) + 0.05, y + h - 0.06, z + d / 2 - 0.03, { chunk });
  this.collider(x - w / 2, y, z - d / 2, x + w / 2, y + h, z + d / 2, 'wood');
};
P.bar = function bar(x0, z0, x1, z1, { h = 1.05, chunk } = {}) {
  this.vbox('plank', x0, 0, z0, x1, h - 0.08, z1, { chunk }); this.vbox('timber', x0 - 0.05, h - 0.08, z0 - 0.05, x1 + 0.05, h, z1 + 0.05, { chunk, bevel: 0.02 });
  this.collider(x0, 0, z0, x1, h, z1, 'wood'); this.nav.block(x0, z0, x1, z1, 1);
};
P.bed = function bed(x, z, { dir = 0, y = 0, w = 1.1, l = 2.1, canopy = false, sheet = 'linen', chunk, id = 'bed', poi = true, fancy = false } = {}) {
  // bed head toward local -Z; dir rotates about Y (0: head at -z, feet at +z)
  const g = new E.Node('Bed'); g.position.set([x, y, z]); E.quat.fromEuler(g.rotation, 0, dir, 0);
  const k = new E.Kit(this.pal);
  k.box(this.pal.plank, [0, 0.25, 0], [w, 0.18, l], [0, 0, 0], 0.02);
  k.box(this.pal.timber, [0, 0.55, -l / 2 + 0.05], [w + 0.1, 0.9, 0.1], [0, 0, 0], 0.02);
  k.box(this.pal.timber, [0, 0.4, l / 2 - 0.05], [w + 0.1, 0.5, 0.08], [0, 0, 0], 0.02);
  k.box(this.pal[sheet] || this.pal.linen, [0, 0.4, 0.05], [w - 0.06, 0.16, l - 0.3], [0, 0, 0], 0.05);
  k.box(this.pal.linen, [0, 0.52, -l / 2 + 0.38], [w * 0.7, 0.12, 0.4], [0, 0, 0], 0.04);
  if (fancy) k.box(this.pal.crimson, [0, 0.49, 0.5], [w - 0.02, 0.05, l * 0.5], [0, 0, 0]);
  if (canopy) {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(this.pal.timber, [sx * (w / 2 + 0.03), 1.2, sz * (l / 2 - 0.06)], [0.1, 2.4, 0.1], [0, 0, 0], 0.02);
    k.box(this.pal.timber, [0, 2.4, 0], [w + 0.2, 0.1, l + 0.1]);
    for (const sx of [-1, 1]) k.box(this.pal.crimson, [sx * (w / 2 + 0.05), 1.7, 0.2], [0.02, 1.3, l * 0.7]);
    k.box(this.pal.crimson, [0, 2.2, -l / 2 + 0.06], [w, 0.4, 0.02]);
  }
  g.add(k.toNode('Bed mesh')); this.decor.add(g);
  const r = Math.abs(Math.sin(rad(dir))) > 0.7 ? [l / 2, w / 2] : [w / 2, l / 2];
  this.collider(x - r[0], y, z - r[1], x + r[0], y + 0.5, z + r[1], 'wood');
  this.nav.block(x - r[0], z - r[1], x + r[0], z + r[1], 1);
  if (poi) {
    // the sleeper lies with the head toward the bed's head end
    const hx = -Math.sin(rad(dir)), hz = -Math.cos(rad(dir));
    this.pois[id] = { type: 'sleep', x: x - hx * (l / 2 - 0.3) * -1, z: z - hz * (l / 2 - 0.3) * -1, y: y + 0.52, yaw: dir, head: [x + hx * (l / 2 - 0.3), z + hz * (l / 2 - 0.3)], approach: [x + Math.cos(rad(dir)) * (w / 2 + 0.7), z - Math.sin(rad(dir)) * (w / 2 + 0.7)] };
  }
  return g;
};
P.shelf = function shelf(x, z, { dir = 0, w = 2, h = 2.1, d = 0.4, y = 0, books = true, chunk, shelves = 4, loot = null, name = 'shelf' } = {}) {
  const g = new E.Node('Shelf'); g.position.set([x, y, z]); E.quat.fromEuler(g.rotation, 0, dir, 0);
  const k = new E.Kit(this.pal);
  k.box(this.pal.timber, [0, h / 2, -d / 2 + 0.02], [w, h, 0.04]);
  for (const sx of [-1, 1]) k.box(this.pal.timber, [sx * (w / 2 - 0.02), h / 2, 0], [0.04, h, d]);
  for (let i = 0; i <= shelves; i++) k.box(this.pal.timber, [0, (i / shelves) * (h - 0.04) + 0.02, 0], [w, 0.04, d]);
  if (books) for (let i = 0; i < shelves; i++) { let bx = -w / 2 + 0.1; while (bx < w / 2 - 0.16) { const bw = 0.04 + Math.random() * 0.05, bh = 0.2 + Math.random() * 0.14; k.box([this.pal.crimson, this.pal.leatherM, this.pal.blackCloth, this.pal.parchment, this.pal.rugBlue][Math.floor(Math.random() * 5)], [bx + bw / 2, (i / shelves) * (h - 0.04) + 0.04 + bh / 2, 0.02], [bw, bh, d * 0.7]); bx += bw + 0.005; } }
  g.add(k.toNode('Shelf')); this.decor.add(g);
  const r = Math.abs(Math.sin(rad(dir))) > 0.7 ? [d / 2, w / 2] : [w / 2, d / 2];
  this.collider(x - r[0], y, z - r[1], x + r[0], y + h, z + r[1], 'wood'); this.nav.block(x - r[0], z - r[1], x + r[0], z + r[1], 1);
  if (loot) this.searchSpot(x, y + 1.2, z, { name, loot, verb: 'Search' });
};
P.fireplace = function fireplace(x, z, { dir = 0, w = 3, h = 2.6, y = 0, chunk, lit = true, mat = 'stoneOld' } = {}) {
  // opening faces +Z rotated by dir
  const g = new E.Node('Fireplace'); g.position.set([x, y, z]); E.quat.fromEuler(g.rotation, 0, dir, 0);
  const k = new E.Kit(this.pal);
  const M = this.pal[mat];
  for (const sx of [-1, 1]) k.box(M, [sx * (w / 2 - 0.35), h / 2, 0], [0.7, h, 0.9], [0, 0, 0], 0.03);
  k.box(M, [0, h - 0.3, 0], [w, 0.6, 0.9], [0, 0, 0], 0.03);
  k.box(M, [0, h + 0.7, -0.1], [w * 0.7, 1.4, 0.7]);
  k.box(this.pal.blackCloth, [0, h / 2 - 0.3, -0.42], [w - 1.4, h - 0.6, 0.06]);
  k.box(this.pal.timber, [0, h + 0.03, 0.5], [w + 0.1, 0.1, 0.25]);
  k.box(this.pal.iron, [0, 0.12, 0.08], [w - 1.5, 0.05, 0.05]);
  g.add(k.toNode('Fireplace')); this.decor.add(g);
  const q = dir % 360, wide = Math.abs(Math.sin(rad(q))) > 0.7;
  const [hx, hz] = wide ? [0.5, w / 2] : [w / 2, 0.5];
  this.collider(x - hx, y, z - hz, x + hx, y + h, z + hz, 'stone'); this.nav.block(x - hx, z - hz, x + hx, z + hz, 1);
  const fx = x + Math.sin(rad(dir)) * 0.35, fz = z + Math.cos(rad(dir)) * 0.35;
  const f = this.hearth(fx, y + 0.02, fz, { r: 0.42, stone: false, range: 16, intensity: 17, chunk });
  f.lit = lit; f.light.intensity = lit ? f.base : 0;
  return f;
};
P.banner = function banner(x, y, z, { dir = 0, w = 1.1, h = 2.4, mat = 'crimson', emblem = true } = {}) {
  const g = new E.Node('Banner'); g.position.set([x, y, z]); E.quat.fromEuler(g.rotation, 0, dir, 0);
  const k = new E.Kit(this.pal);
  k.box(this.pal.iron, [0, h / 2 + 0.05, 0], [w + 0.2, 0.05, 0.05]);
  k.shape(this.pal[mat], { type: 'plane', width: w, depth: h, subdivisions: 5 }, [{ type: 'wave', axis: 'y', along: 'x', amplitude: 0.025, frequency: 1.3, phase: Math.random() * 6 }], [0, 0, 0.03], [90, 0, 0]);
  if (emblem) { k.add(this.pal.blackCloth, E.extrude({ shape: 'star', points: 4, inner: 0.34, radius: w * 0.3, depth: 0.01, bevel: 0.002 }), [0, h * 0.08, 0.045]); }
  g.add(k.toNode('Banner')); this.decor.add(g);
};
P.rug = function rug(x, z, w, d, mat = 'rug', y = 0.012) { this.vbox(mat, x - w / 2, y - 0.012, z - d / 2, x + w / 2, y + 0.006, z + d / 2, { chunk: this.chunk }); };
P.pillar = function pillar(x, z, { r = 0.45, h = 5, mat = 'stoneWall', chunk } = {}) {
  this.kit(chunk).cyl(this.pal[mat], [x, h / 2, z], r, h, [0, 0, 0], 12);
  this.kit(chunk).cyl(this.pal[mat], [x, 0.15, z], r * 1.3, 0.3, [0, 0, 0], 12);
  this.kit(chunk).cyl(this.pal[mat], [x, h - 0.15, z], r * 1.3, 0.3, [0, 0, 0], 12);
  this.collider(x - r * 0.8, 0, z - r * 0.8, x + r * 0.8, h, z + r * 0.8, 'stone'); this.nav.block(x - r, z - r, x + r, z + r, 1);
};
P.stairs = function stairs({ x, z, dir = 'N', w = 3, steps = 4, rise = 0.25, run = 0.6, y = 0, mat = 'stoneWall', chunk }) {
  // dir: direction of ascent (N = +z, S = -z, E = +x, W = -x)
  for (let i = 0; i < steps; i++) {
    const top = y + rise * (i + 1), o = i * run;
    let b;
    if (dir === 'N') b = [x - w / 2, y, z + o, x + w / 2, top, z + o + run];
    if (dir === 'S') b = [x - w / 2, y, z - o - run, x + w / 2, top, z - o];
    if (dir === 'E') b = [x + o, y, z - w / 2, x + o + run, top, z + w / 2];
    if (dir === 'W') b = [x - o - run, y, z - w / 2, x - o, top, z + w / 2];
    this.vbox(mat, ...b, { chunk }); this.collider(...b, 'stone');
    this.nav.setHeight(b[0], b[2], b[3], b[5], top);
  }
};
P.crate3 = function crate3(x, z, n = 2, { y = 0, chunk } = {}) { // static stacked crates as cover
  for (let i = 0; i < n; i++) this.solid('plank', x - 0.4, y + i * 0.8, z - 0.4, x + 0.4, y + (i + 1) * 0.8, z + 0.4, { chunk, kind: 'wood', bevel: 0.03 });
};

// ---------------------------------------------------------------- loose physics props
const PROPS = {
  barrel: { r: 0.36, h: 0.9, mass: 28, mat: 'plank', shape: 'box', half: [0.34, 0.45, 0.34], pick: false },
  crate: { mass: 14, half: [0.3, 0.3, 0.3], mat: 'plank', shape: 'box', pick: false },
  crateS: { mass: 5, half: [0.2, 0.15, 0.2], mat: 'plank', shape: 'box', pick: true },
  stool: { mass: 4, half: [0.2, 0.22, 0.2], mat: 'plank', shape: 'box', pick: true },
  bucket: { mass: 2, half: [0.14, 0.14, 0.14], mat: 'iron', shape: 'box', pick: true },
  jug: { mass: 1.2, half: [0.09, 0.14, 0.09], mat: 'pottery', shape: 'box', pick: true, breakable: true },
  bottle: { mass: 0.5, half: [0.03, 0.12, 0.03], mat: 'water', shape: 'box', pick: true, breakable: true },
  mug: { mass: 0.4, half: [0.04, 0.05, 0.04], mat: 'silverM', shape: 'box', pick: true },
  skull: { mass: 1.3, radius: 0.09, mat: 'bone', shape: 'sphere', pick: true },
  book: { mass: 0.6, half: [0.08, 0.02, 0.11], mat: 'leatherM', shape: 'box', pick: true },
  sack: { mass: 9, half: [0.24, 0.25, 0.2], mat: 'canvasDirty', shape: 'box', pick: true },
  bread: { mass: 0.5, half: [0.09, 0.05, 0.05], mat: 'hay', shape: 'box', pick: true },
  pot: { mass: 2.5, half: [0.16, 0.16, 0.16], mat: 'pottery', shape: 'box', pick: true, breakable: true },
  candlestick: { mass: 0.7, half: [0.03, 0.12, 0.03], mat: 'goldM', shape: 'box', pick: true },
  hay: { mass: 6, half: [0.4, 0.2, 0.25], mat: 'hay', shape: 'box', pick: false },
  cheese: { mass: 1, half: [0.1, 0.06, 0.1], mat: 'goldM', shape: 'box', pick: true },
  dummy: { mass: 22, half: [0.28, 0.9, 0.28], mat: 'canvasDirty', shape: 'box', pick: false },
};
const propGeo = {};
function geoFor(kind) {
  if (propGeo[kind]) return propGeo[kind];
  const cfg = PROPS[kind]; let g;
  if (kind === 'barrel') g = E.cylinder({ radiusTop: 0.3, radiusBottom: 0.3, height: 0.9, radialSegments: 12, heightSegments: 3 });
  else if (kind === 'jug' || kind === 'pot') g = E.lathe({ points: [[0, -0.14], [0.08, -0.14], [0.12, -0.05], [0.13, 0.03], [0.09, 0.1], [0.06, 0.14], [0, 0.14]], segments: 10, smooth: 1 });
  else if (kind === 'bottle') g = E.lathe({ points: [[0, -0.12], [0.03, -0.12], [0.032, 0.02], [0.02, 0.06], [0.012, 0.09], [0.012, 0.12], [0, 0.12]], segments: 8, smooth: 1 });
  else if (kind === 'mug') g = E.cylinder({ radiusTop: 0.04, radiusBottom: 0.035, height: 0.1, radialSegments: 8 });
  else if (kind === 'bucket') g = E.cylinder({ radiusTop: 0.15, radiusBottom: 0.11, height: 0.28, radialSegments: 10 });
  else if (kind === 'skull') g = E.sphere({ radius: 0.09, widthSegments: 10, heightSegments: 8 });
  else if (kind === 'sack') g = E.superquadric({ rx: 0.24, ry: 0.25, rz: 0.2, e1: 0.6, e2: 0.7, widthSegments: 10, heightSegments: 8 });
  else if (kind === 'candlestick') g = E.cylinder({ radiusTop: 0.012, radiusBottom: 0.035, height: 0.24, radialSegments: 8 });
  else if (kind === 'stool') g = E.cylinder({ radiusTop: 0.2, radiusBottom: 0.16, height: 0.44, radialSegments: 8 });
  else if (kind === 'dummy') g = E.superquadric({ rx: 0.26, ry: 0.55, rz: 0.2, e1: 0.7, e2: 0.7, widthSegments: 10, heightSegments: 8 });
  else g = E.box({ width: cfg.half[0] * 2, height: cfg.half[1] * 2, depth: cfg.half[2] * 2, bevel: 0.015 });
  return (propGeo[kind] = g);
}
P.prop = function prop(kind, x, y, z, { yaw = 0, sleep = true, mass = null, name = null, value = 0, loot = null } = {}) {
  const cfg = PROPS[kind];
  const mesh = new E.Mesh(geoFor(kind), this.pal[cfg.mat], kind); mesh.receiveShadow = true;
  if (kind === 'barrel') { const band = new E.Mesh(E.cylinder({ radiusTop: 0.31, radiusBottom: 0.31, height: 0.05, radialSegments: 12, heightSegments: 1 }), this.pal.iron, 'band'); band.position.set([0, 0.25, 0]); const b2 = new E.Mesh(band.geometry, this.pal.iron, 'band'); b2.position.set([0, -0.25, 0]); mesh.add(band, b2); }
  if (kind === 'dummy') { mesh.position.set([0, 0.1, 0]); const post = new E.Mesh(E.box({ width: 0.1, height: 1.8, depth: 0.1 }), this.pal.timber, 'post'); post.position.set([0, -0.1, 0]); const head = new E.Mesh(E.sphere({ radius: 0.16, widthSegments: 8, heightSegments: 6 }), this.pal.hay, 'head'); head.position.set([0, 0.72, 0]); const arms = new E.Mesh(E.box({ width: 0.9, height: 0.08, depth: 0.08 }), this.pal.timber, 'arms'); arms.position.set([0, 0.3, 0]); mesh.add(post, head, arms); }
  if (kind === 'crate' || kind === 'crateS') { const s = cfg.half[0] * 2 + 0.02; const strap = new E.Mesh(E.box({ width: s, height: 0.05, depth: s }), this.pal.timber, 'strap'); mesh.add(strap); }
  this.decor.add(mesh);
  const shape = cfg.shape === 'sphere' ? new E.Sphere(cfg.radius) : new E.Box(cfg.half);
  const body = new E.Body({ shape, position: [x, y + (cfg.half ? cfg.half[1] : cfg.radius) + 0.01, z], rotation: E.quat.fromEuler(E.quat.create(), 0, yaw, 0), mass: mass ?? cfg.mass, friction: 0.7, restitution: 0.15, angularDamping: 0.5 });
  body.node = mesh; body.userData = { kind: 'prop', prop: kind, pick: cfg.pick, breakable: cfg.breakable, name: name || kind, value, loot, home: [x, y, z] };
  this.world.add(body);
  if (sleep) body.sleep();
  this.props.push(body);
  return body;
};
