// Particles, decals, debris and the physics-driven consequences of violence: sparks, blood,
// smoke, breaking pots, the ground-slam shockwave.
import * as E from '../../engine/index.js';

export function installFx(g) {
  g.smoke = new E.Particles(2200); g.smoke.gravity = 0; g.smoke.drag = 0.7;
  g.flames = new E.Particles(3200, { additive: true }); g.flames.gravity = 0; g.flames.drag = 2;
  g.sparks = new E.Particles(1500, { additive: true }); g.sparks.gravity = -3; g.sparks.drag = 1.1;
  g.dust = g.smoke;
  g.decals = new E.Decals({ max: 200 }); g.scene.add(g.decals);
  g.bloodDecals = new E.Decals({ max: 160, material: new E.Material({ name: 'Blood', color: '#4a0810', roughness: 0.4 }) }); g.scene.add(g.bloodDecals);
  g.shardGeo = E.box({ width: 1, height: 1, depth: 1 });
  g.debris = []; g.tracers = []; g.shake = 0;
  g.fx3 = [];
}

const P = {};
P.spark = function spark(pos, normal, n = 10) {
  this.sparks.emit(pos, { count: n, color: [5, 3.4, 1.4, 1], colorEnd: [2.4, 0.6, 0.1, 0.4], size: 0.02, grow: 0.4, spread: 1.6, up: 1.2, life: 0.45, jitter: 0.02, vel: [normal[0] * 1.4, normal[1] * 1.4, normal[2] * 1.4] });
};
P.spawnBlood = function spawnBlood(pos, dir, n = 12) {
  const d = dir || [0, 0];
  this.sparks.emit(pos, { count: 0 });
  this.smoke.emit(pos, { count: n, color: [0.42, 0.03, 0.05, 0.85], colorEnd: [0.2, 0.01, 0.02, 0.0], size: 0.045, grow: 1.6, spread: 1.4, up: 0.9, life: 0.55, jitter: 0.04, vel: [d[0] * 2.4, 0.4, d[1] * 2.4] });
  // spatter on the ground / walls
  if (Math.random() < 0.7) this.bloodDecals.add([pos[0] + d[0] * 0.8, 0.02, pos[2] + d[1] * 0.8], [0, 1, 0], 0.2 + Math.random() * 0.25);
};
P.bloodPool = function bloodPool(pos) { this.bloodDecals.add([pos[0], pos[1] + 0.012, pos[2]], [0, 1, 0], 0.9 + Math.random() * 0.4); };
P.emitBurst = function emitBurst(pos, kind) {
  if (kind === 'veil') this.smoke.emit(pos, { count: 26, color: [0.22, 0.08, 0.4, 0.5], colorEnd: [0.05, 0.02, 0.1, 0], size: 0.22, grow: 4, spread: 1.6, up: 0.3, life: 1.6, jitter: 0.5, buoyancy: 0.2 });
  else if (kind === 'shadow') this.smoke.emit(pos, { count: 2, color: [0.12, 0.04, 0.22, 0.6], colorEnd: [0.05, 0.02, 0.1, 0], size: 0.25, grow: 3, spread: 0.2, up: 0.2, life: 0.7, jitter: 0.25 });
  else if (kind === 'dust') this.smoke.emit(pos, { count: 14, color: [0.55, 0.5, 0.45, 0.5], colorEnd: [0.55, 0.5, 0.45, 0], size: 0.2, grow: 4, spread: 2.2, up: 0.4, life: 1.2, jitter: 0.4 });
  else if (kind === 'poof') this.smoke.emit(pos, { count: 8, color: [0.3, 0.3, 0.3, 0.4], colorEnd: [0.3, 0.3, 0.3, 0], size: 0.1, grow: 3, spread: 0.3, up: 0.5, life: 1.4, jitter: 0.06, buoyancy: 0.5 });
};
// drifting ash: the air of a town that has been burning its dead
P.updateAsh = function updateAsh(dt) {
  const c = this.camera.position, ind = this.indoorK;
  if (ind > 0.6) return;
  const n = dt * 16 * (1 - ind);
  for (let i = 0; i < n + Math.random(); i++) this.smoke.emit([c[0] + (Math.random() - 0.5) * 22, c[1] + Math.random() * 6 - 1.5, c[2] + (Math.random() - 0.5) * 22], { count: 1, color: [0.55, 0.5, 0.52, 0.55], colorEnd: [0.45, 0.42, 0.45, 0], size: 0.03, grow: 1, spread: 0.1, up: -0.25, life: 5, jitter: 0, vel: [0.35, -0.1, 0.1] });
};
P.updateFx = function updateFx(dt) {
  if (this.mode !== 'boot') this.updateAsh(dt);
  this.smoke.update(dt); this.flames.update(dt); this.sparks.update(dt);
  for (const d of this.debris) { d.t -= dt; if (d.t <= 0) { this.world.remove(d.body); this.scene.remove(d.mesh); } }
  this.debris = this.debris.filter((d) => d.t > 0);
  this.shake = Math.max(0, this.shake - dt * 2.4);
  if (this.shake > 0.01) { const s = this.shake * 0.06; this.camera.position[0] += (Math.random() - 0.5) * s; this.camera.position[1] += (Math.random() - 0.5) * s; }
};
P.tracerLines = function tracerLines() { return []; };
// a pot, jug or bottle bursts into shards
P.breakProp = function breakProp(b, dir = [0, 0, 0]) {
  if (b.userData.broken) return; b.userData.broken = true;
  const mesh = b.node, mat = mesh?.material;
  const i = this.dynBodies.indexOf(b); if (i >= 0) this.dynBodies.splice(i, 1);
  const shards = E.fracture(this.world, b, { pieces: [2, 3, 2], point: b.position, speed: 2.5 });
  if (mesh) mesh.parent?.remove(mesh);
  for (const s of shards) { const m = new E.Mesh(this.shardGeo, mat || this.level.pal.pottery, 'Shard'); m.scale.set(s.shape.half.map((h) => h * 2)); m.castShadow = false; s.node = m; this.scene.add(m); this.debris.push({ body: s, mesh: m, t: 18 }); }
  const glass = b.userData.prop === 'bottle';
  this.sfx.glass?.(b.position); this.noise(b.position, glass ? 20 : 15, 'glass');
  this.smoke.emit(b.position, { count: 8, color: [0.7, 0.65, 0.6, 0.4], colorEnd: [0.7, 0.65, 0.6, 0], size: 0.06, grow: 3, spread: 0.8, up: 0.5, life: 0.8 });
  if (b.userData.prop === 'bottle') this.decals.add([b.position[0], 0.02, b.position[2]], [0, 1, 0], 0.4);
};
P.onContact = function onContact(e) {
  const a = e.a, b = e.b; if (e.shot) return;
  const dyn = a.isDynamic ? a : b.isDynamic ? b : null; if (!dyn) return;
  const u = dyn.userData;
  if (u.player || u.ragdoll) return;
  if (u.kind === 'prop') {
    if (e.speed > 3.6 && u.breakable && !u.broken) { this.breakProp(dyn, e.normal); return; }
    if (e.speed > 2.2 && (this.time - (u.lastNoise || 0)) > 0.5) {
      u.lastNoise = this.time;
      const loud = Math.min(24, 5 + e.speed * 3 + Math.min(dyn.mass, 30) * 0.3);
      this.sfx.thud?.(Math.min(1, e.speed / 8), dyn.position); this.noise(dyn.position, loud, dyn.mass > 8 ? 'crash' : 'prop');
    }
  } else if (u.cage) { if (e.speed > 2) this.sfx.clang?.(0.4, dyn.position); }
};
P.gravebreak = function gravebreak() {
  const p = this.player, pos = [p.pos[0], p.pos[1] + 0.2, p.pos[2]];
  this.sfx.slam?.(pos); this.shake = 1; this.world.explode(pos, 7.5, 7); this.noise(pos, 32, 'slam');
  this.emitBurst([pos[0], 0.2, pos[2]], 'dust');
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; this.sparks.emit([pos[0] + Math.cos(a) * 0.8, 0.1, pos[2] + Math.sin(a) * 0.8], { count: 2, color: [1.5, 0.6, 4, 1], colorEnd: [0.4, 0.1, 1, 0.3], size: 0.03, spread: 0.5, up: 1.5, life: 0.8, vel: [Math.cos(a) * 5, 0, Math.sin(a) * 5] }); }
  for (const n of this.npcs) {
    if (n.dead) continue; const dx = n.x - pos[0], dz = n.z - pos[2], d = Math.hypot(dx, dz);
    if (d > 5.2 || Math.abs(n.y - pos[1]) > 2) continue;
    const dir = [dx / (d || 1), dz / (d || 1)];
    this.hitNpc(n, 20 * (1 - d / 6), dir, { from: 'player', heavy: true });
    if (!n.dead) { n.moveBy(dir[0] * 1.6, dir[1] * 1.6); n.stagger = 1.4; if (n.guard) { n.state = 'stagger'; n.atk = null; } }
  }
};
export function installFxMethods(G) { Object.assign(G.prototype, P); }
