// Visual effects, all driven by simulation events: bullet holes and dust, sparks, tracers,
// muzzle flashes, brass, wall rubble, explosions, smoke grenades and flashbangs.
import * as E from '../../../engine/index.js';
import { MATS } from '../world/grid.js';

const zeroM = E.mat4.fromRTS(E.mat4.create(), E.quat.create(), [0, -1000, 0], [0, 0, 0]);

export class Fx {
  constructor(game) {
    this.game = game; const sim = game.sim, scene = game.scene;
    this.particles = new E.Particles(4500); this.sparks = new E.Particles(2200, { additive: true }); this.sparks.gravity = -4; this.sparks.drag = 1.2;
    this.decals = new E.Decals({ max: 900, material: new E.Material({ name: 'BulletHole', color: '#17120e', roughness: 0.95 }) }); scene.add(this.decals);
    this.holeSlots = new Map(); // panel id -> [slot indices]
    this.tracers = []; this.lights = []; this.flash = 0;
    for (let i = 0; i < 4; i++) { const l = new E.Light('point', { color: '#ffb866', intensity: 0, range: 7 }); scene.add(l); this.lights.push({ l, t: 0 }); }
    this.explLight = new E.Light('point', { color: '#ffa550', intensity: 0, range: 16 }); scene.add(this.explLight); this.explT = 0;
    // debris: brass casings and rubble as instanced boxes with a tiny physics of their own
    const mk = (geo, mat, n) => { const im = new E.InstancedMesh(geo, mat, n, 'Debris'); im.castShadow = false; for (let i = 0; i < n; i++) im.instanceMatrices.set(zeroM, i * 16); scene.add(im); return { im, n, next: 0, items: [] }; };
    this.brass = mk(E.cylinder({ radiusTop: 0.0055, radiusBottom: 0.0055, height: 0.04, radialSegments: 6 }), new E.Material({ name: 'Brass', color: '#c79a48', roughness: 0.3, metallic: 1 }), 160);
    this.shell = mk(E.cylinder({ radiusTop: 0.011, radiusBottom: 0.011, height: 0.07, radialSegments: 8 }), new E.Material({ name: 'Hull', color: '#a8231b', roughness: 0.45 }), 40);
    this.rubble = {
      plaster: mk(E.box({ width: 1, height: 1, depth: 1 }), new E.Material({ name: 'RubblePlaster', color: '#cfc9bc', roughness: 0.95 }), 260),
      wood: mk(E.box({ width: 1, height: 1, depth: 1 }), new E.Material({ name: 'RubbleWood', color: '#8a6a40', roughness: 0.9 }), 180),
      brick: mk(E.box({ width: 1, height: 1, depth: 1 }), new E.Material({ name: 'RubbleBrick', color: '#9d5640', roughness: 0.9 }), 180),
      metal: mk(E.box({ width: 1, height: 1, depth: 1 }), new E.Material({ name: 'RubbleMetal', color: '#6a7078', roughness: 0.5, metallic: 0.8 }), 90),
      glass: mk(E.box({ width: 1, height: 1, depth: 1 }), new E.Material({ name: 'Shards', color: '#b8dcee', roughness: 0.05, metallic: 0.2, opacity: 0.8 }), 160),
    };
    this.bursts = []; // expanding explosion shells
    this.burstMesh = new E.Mesh(E.sphere({ radius: 1, widthSegments: 14, heightSegments: 9 }), new E.Material({ name: 'Blast', color: '#ffcf80', emissive: '#ff9a40', emissiveStrength: 8, opacity: 0.6, doubleSided: true }), 'Blast'); this.burstMesh.castShadow = false; this.burstMesh.visible = false; scene.add(this.burstMesh);
    this.smokeT = 0; this.fires = [];
    this.bind(sim);
  }
  bind(sim) {
    const on = (t, f) => sim.on(t, f.bind(this));
    on('impact', this.onImpact); on('tracer', this.onTracer); on('shot', this.onShot); on('panelbreak', this.onBreak);
    on('explosion', this.onExplosion); on('flashbang', this.onFlashbang); on('death', this.onDeath); on('swing', this.onSwing);
    on('burn', this.onBurn); on('thermite', this.onBurn); on('shock', this.onShock); on('stick', (e) => this.sparkAt(e.proj.pos, 4));
    on('hit', this.onHit); on('gas', (e) => this.puff(e.pos, [0.5, 0.8, 0.3, 0.5], 24, 2.2)); on('turretshot', (e) => this.flashAt([e.device.pos[0], e.device.pos[1] + 0.8, e.device.pos[2]], 0.5));
  }

  // ---------------------------------------------------------------- small helpers
  puff(p, color, count = 8, size = 0.08, o = {}) { this.particles.emit(p, { count, spread: o.spread ?? 0.6, up: o.up ?? 0.5, size, color, colorEnd: o.colorEnd ?? [color[0], color[1], color[2], 0.05], life: o.life ?? 1.2, grow: o.grow ?? 3.2, buoyancy: o.buoyancy ?? 0.1, jitter: o.jitter ?? 0.05, vel: o.vel }); }
  sparkAt(p, n = 8, o = {}) { this.sparks.emit(p, { count: n, spread: o.spread ?? 1.6, up: o.up ?? 1.2, size: 0.016, grow: 0.4, color: [5, 3.2, 1.2, 1], colorEnd: [2.4, 0.6, 0.1, 0.4], life: o.life ?? 0.4, jitter: 0.01, vel: o.vel }); }
  flashAt(p, k = 1) { const s = this.lights.reduce((a, b) => (a.t < b.t ? a : b)); s.l.position.set(p); s.l.intensity = 40 * k; s.t = 0.05; }
  decal(p, n, size, panel) {
    const d = this.decals, slot = d.next;
    // an old slot reused by a new hole: forget its panel
    d.add(p, n, size);
    if (panel) { let arr = this.holeSlots.get(panel.id); if (!arr) this.holeSlots.set(panel.id, (arr = [])); arr.push(slot); }
  }
  spawnDebris(kind, pos, n, speed, size = 0.1, vel = [0, 0, 0]) {
    const pool = kind === 'brass' ? this.brass : kind === 'shell' ? this.shell : this.rubble[kind] || this.rubble.plaster;
    for (let i = 0; i < n; i++) {
      const s = size * (0.5 + Math.random());
      const it = { i: pool.next, p: [pos[0] + (Math.random() - 0.5) * 0.3, pos[1] + (Math.random() - 0.5) * 0.3, pos[2] + (Math.random() - 0.5) * 0.3], v: [vel[0] + (Math.random() - 0.5) * speed, vel[1] + Math.random() * speed * 0.8, vel[2] + (Math.random() - 0.5) * speed], q: E.quat.fromEuler(E.quat.create(), Math.random() * 360, Math.random() * 360, Math.random() * 360), w: [(Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12], s: kind === 'brass' || kind === 'shell' ? [1, 1, 1] : [s, s * (0.4 + Math.random() * 0.6), s * (0.5 + Math.random())], rest: false, t: kind === 'brass' || kind === 'shell' ? 14 : 20, bounces: 0 };
      pool.next = (pool.next + 1) % pool.n;
      pool.items = pool.items.filter((x) => x.i !== it.i); pool.items.push(it);
    }
  }
  updateDebris(dt) {
    const w = this.game.sim.world;
    const pools = [this.brass, this.shell, ...Object.values(this.rubble)];
    for (const pool of pools) {
      if (!pool.items.length) continue;
      for (const it of pool.items) {
        it.t -= dt;
        if (!it.rest) {
          it.v[1] -= 9.81 * dt;
          const np = [it.p[0] + it.v[0] * dt, it.p[1] + it.v[1] * dt, it.p[2] + it.v[2] * dt];
          const g = w.groundY(np[0], np[2], 0.05, it.p[1] + 0.3, 0.6);
          if (np[1] < g + it.s[1] * 0.5 && it.v[1] < 0) {
            np[1] = g + it.s[1] * 0.5; it.v[1] *= -0.28; it.v[0] *= 0.6; it.v[2] *= 0.6; it.bounces++;
            if (Math.hypot(it.v[0], it.v[1], it.v[2]) < 0.4 || it.bounces > 4) { it.rest = true; }
            if (it.bounces === 1 && (pool === this.brass || pool === this.shell)) this.game.audio && this.game.audio.tink(np);
          }
          // walls stop rubble
          const h = w.cast(it.p[0], it.p[1], it.p[2], it.v[0], it.v[1], it.v[2], Math.hypot(it.v[0], it.v[1], it.v[2]) * dt + 0.03, 2);
          if (h) { it.v[0] *= -0.3; it.v[2] *= -0.3; it.v[1] *= 0.5; } else it.p = np;
          E.quat.multiply(it.q, it.q, E.quat.fromEuler(E.quat.create(), it.w[0] * dt * 57, it.w[1] * dt * 57, it.w[2] * dt * 57));
          if (it.rest) it.w = [0, 0, 0];
        }
        pool.im.setMatrixAt(it.i, it.t > 0 ? E.mat4.fromRTS(E.mat4.create(), it.q, it.p, it.s) : zeroM);
      }
      pool.items = pool.items.filter((x) => x.t > 0);
    }
  }

  // ---------------------------------------------------------------- event handlers
  onImpact(e) {
    const p = e.pos, n = e.normal;
    if (e.kind === 'wall' || e.kind === 'prop') {
      const mat = e.mat || 'plaster', hard = mat === 'steel' || mat === 'metal' || mat === 'concrete';
      if (e.panel) this.decal(p, n, 0.014 + Math.random() * 0.01, e.panel); else this.decal(p, n, 0.012, null);
      const col = mat === 'brick' ? [0.72, 0.5, 0.42, 0.5] : mat === 'wood' ? [0.6, 0.45, 0.3, 0.5] : [0.82, 0.8, 0.75, 0.5];
      this.puff(p, col, e.pellet ? 2 : 5, 0.06, { life: 0.8, spread: 0.4, up: 0.2 });
      if (hard) this.sparkAt(p, 7, { vel: [n[0] * 2, n[1] * 2, n[2] * 2] });
      else if (Math.random() < 0.3) this.spawnDebris(mat === 'wood' ? 'wood' : mat === 'brick' ? 'brick' : 'plaster', p, 1, 2, 0.015);
    } else if (e.kind === 'glass') { this.spawnDebris('glass', p, 4, 3, 0.03); this.sparkAt(p, 4, { vel: [0, 0, 0] }); }
    else if (e.kind === 'shield' || e.kind === 'device') this.sparkAt(p, 10);
  }
  onHit(e) {
    if (e.melee) return;
    this.puff(e.pos, [0.55, 0.06, 0.05, 0.7], e.headshot ? 9 : 5, 0.05, { life: 0.5, spread: 0.7, up: 0.3, colorEnd: [0.3, 0.02, 0.02, 0.0] });
  }
  onTracer(e) {
    const s = e.shooter; if (!s) return;
    const a = e.from, b = e.to, d = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    if (d < 1.5) return;
    this.tracers.push({ a: [...a], b: [...b], t: e.def && e.def.cls === 'SR' ? 0.12 : 0.05, boost: s.isPlayer ? 1 : 0.8 });
  }
  onShot(e) {
    const a = e.actor, m = e.muzzle, def = e.gun.def;
    this.flashAt(m, a.isPlayer ? 1 : 0.8);
    this.puff(m, [0.8, 0.78, 0.74, 0.22], def.cls === 'SG' ? 5 : 2, 0.05, { life: 1.2, spread: 0.12, up: 0.1, grow: 5 });
    this.sparkAt(m, def.pellets > 1 ? 8 : 3, { spread: 0.9, up: 0.3, life: 0.18, vel: [e.dir[0] * 3, e.dir[1] * 3, e.dir[2] * 3] });
    if (def.cls === 'SR' || def.cls === 'SG') this.spawnDebris(def.cls === 'SG' ? 'shell' : 'brass', a.eye(), 1, 2.5, 1, [-a.right[0] * 2 + a.vel[0], 1.5, -a.right[2] * 2 + a.vel[2]]);
    else this.spawnDebris('brass', [a.pos[0] + a.fwd[0] * 0.3, a.pos[1] + a.eyeH - 0.15, a.pos[2] + a.fwd[2] * 0.3], 1, 2, 1, [-a.right[0] * 2.2 + a.vel[0], 1.4, -a.right[2] * 2.2 + a.vel[2]]);
  }
  onBreak(e) {
    const p = e.panel; if (!p) return;
    const c = this.game.sim.world.panelCenter(p);
    // forget the bullet holes of a panel that is gone
    const slots = this.holeSlots.get(p.id); if (slots) { for (const s of slots) this.decals.setMatrixAt(s, zeroM); this.holeSlots.delete(p.id); }
    const kind = p.kind === 'glass' ? 'glass' : p.reinforced ? 'metal' : ({ brick: 'brick', wood: 'wood', metal: 'metal', hatchwood: 'wood', plaster: 'plaster' }[p.mat] || 'plaster');
    this.spawnDebris(kind, c, kind === 'glass' ? 10 : 6, 4.5, kind === 'glass' ? 0.05 : 0.18);
    this.puff(c, kind === 'brick' ? [0.7, 0.5, 0.4, 0.55] : [0.86, 0.84, 0.8, 0.55], 14, 0.22, { life: 2.2, spread: 1.2, up: 0.7, grow: 3.6 });
    this.game.audio && this.game.audio.shatter(c, kind);
  }
  onExplosion(e) {
    this.bursts.push({ p: [...e.pos], t: 0, r: e.radius * 0.5, kind: e.kind });
    this.explLight.position.set(e.pos); this.explLight.intensity = 90; this.explT = 0.35;
    this.puff(e.pos, [0.35, 0.33, 0.31, 0.65], 26, 0.5, { life: 3.4, spread: 2.4, up: 1.1, grow: 4.5, buoyancy: 0.15 });
    this.puff(e.pos, [0.9, 0.8, 0.7, 0.5], 18, 0.35, { life: 1.8, spread: 3.2, up: 0.8 });
    this.sparkAt(e.pos, 40, { spread: 6, up: 4, life: 0.7 });
    this.game.shake(Math.max(0, 0.9 - Math.hypot(...[0, 1, 2].map((i) => e.pos[i] - this.game.cam.position[i])) / (e.radius * 3.5)) * 1.2);
    this.game.audio && this.game.audio.explosion(e.pos, e.radius);
  }
  onFlashbang(e) {
    this.flashAt(e.pos, 3); this.sparkAt(e.pos, 30, { spread: 5, life: 0.35 }); this.puff(e.pos, [0.9, 0.9, 0.9, 0.6], 10, 0.3, { life: 1.4 });
    this.explLight.position.set(e.pos); this.explLight.intensity = 140; this.explT = 0.2;
    this.game.audio && this.game.audio.bang(e.pos);
  }
  onSwing(e) { if (!e.hit) { this.game.audio && this.game.audio.whoosh(e.actor.pos); return; } this.puff(e.pos, [0.82, 0.8, 0.76, 0.6], 8, 0.14, { life: 1.1, spread: 0.9, up: 0.4 }); this.spawnDebris(e.soft ? 'plaster' : 'metal', e.pos, 3, 3, 0.08); this.game.audio && this.game.audio.thud(e.pos); }
  onBurn(e) { const p = e.pos || e.device.pos; this.fires.push({ p: [...p], t: 5.5 }); this.sparkAt(p, 40, { spread: 2.5, up: 2, life: 0.8 }); }
  onShock(e) { this.sparkAt(e.pos, 30, { spread: 3, up: 2, life: 0.3 }); this.flashAt(e.pos, 2); }
  onDeath(e) { const a = e.actor; if (a.isPlayer) return; this.puff([a.pos[0], a.pos[1] + 1.1, a.pos[2]], [0.45, 0.04, 0.04, 0.6], 10, 0.09, { life: 0.9, spread: 0.9, up: 0.3, colorEnd: [0.25, 0.02, 0.02, 0.0] }); }

  // ---------------------------------------------------------------- per frame
  update(dt) {
    this.particles.update(dt); this.sparks.update(dt);
    for (const s of this.lights) { if (s.t > 0) { s.t -= dt; if (s.t <= 0) s.l.intensity = 0; } }
    if (this.explT > 0) { this.explT -= dt; this.explLight.intensity *= Math.exp(-dt * 8); if (this.explT <= 0) this.explLight.intensity = 0; }
    this.updateDebris(dt);
    // explosion fireballs
    this.burstMesh.visible = this.bursts.length > 0;
    if (this.bursts.length) {
      const b = this.bursts[0]; b.t += dt; const u = b.t / 0.28;
      this.burstMesh.position.set(b.p); const s = b.r * (0.3 + u * 1.3); this.burstMesh.scale.set([s, s, s]); this.burstMesh.material.opacity = Math.max(0, 0.7 * (1 - u));
      if (u >= 1) this.bursts.shift();
    }
    // smoke grenade clouds keep puffing
    this.smokeT -= dt;
    if (this.smokeT <= 0) {
      this.smokeT = 0.09;
      for (const s of this.game.sim.world.smoke) { const k = Math.min(1, s.t / 3, (s.max - s.t) / 1.2 + 0.2); this.particles.emit([s.x, s.y - 0.5, s.z], { count: 4, spread: s.r * 0.55, up: 0.2, size: 0.65, color: [0.78, 0.78, 0.8, 0.5 * k], colorEnd: [0.7, 0.7, 0.72, 0.0], grow: 2, life: 2.6, jitter: s.r * 0.5, buoyancy: 0.02 }); }
      for (const g of this.game.sim.devices.gas) this.particles.emit(g.pos, { count: 3, spread: g.r * 0.5, up: 0.1, size: 0.5, color: [0.55, 0.75, 0.3, 0.32], colorEnd: [0.5, 0.7, 0.3, 0], grow: 2, life: 2, jitter: g.r * 0.5, buoyancy: 0.0 });
      for (const f of this.fires) { f.t -= 0.09; this.sparks.emit(f.p, { count: 3, spread: 0.7, up: 1.6, size: 0.016, color: [5, 2.4, 0.8, 1], colorEnd: [2, 0.4, 0.1, 0.3], life: 0.5, grow: 0.5 }); this.particles.emit([f.p[0], f.p[1] + 0.2, f.p[2]], { count: 1, spread: 0.2, up: 0.5, size: 0.14, color: [0.3, 0.28, 0.26, 0.4], colorEnd: [0.3, 0.3, 0.3, 0], grow: 3, life: 1.6, buoyancy: 0.4 }); }
      this.fires = this.fires.filter((f) => f.t > 0);
    }
  }
  // tracer line data for renderer.render({ lines })
  lineData(dt) {
    const out = [];
    for (const t of this.tracers) { t.t -= dt; const al = Math.max(0, t.t / 0.08) * t.boost; out.push(...t.a, 5, 3.6, 1.6, al, ...t.b, 5, 3.6, 1.6, al * 0.25); }
    this.tracers = this.tracers.filter((t) => t.t > 0);
    return out;
  }
  clear() { this.decals.clear(); this.holeSlots.clear(); this.tracers = []; }
}
void MATS;
