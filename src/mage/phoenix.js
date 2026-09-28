// The Phoenix attack: a bird of living flame built from ShapeForge shapes (superquadric body,
// cone beak and tail feathers, flapping wings on pivot nodes). It is summoned from the
// mage's hands, arcs to the crosshair leaving a trail of fire, bursts on impact, then
// swoops back to the mage and dissolves into embers that refill some ember.
import * as E from '../../engine/index.js';

const M = {
  feather: new E.Material({ name: 'Phoenix feather', color: '#ff7a1a', roughness: 0.5, emissive: '#ff5a10', emissiveStrength: 3.2 }),
  gold: new E.Material({ name: 'Phoenix gold', color: '#ffd35a', roughness: 0.4, emissive: '#ffb020', emissiveStrength: 6 }),
  core: new E.Material({ name: 'Phoenix core', color: '#fff2c0', roughness: 0.6, emissive: '#ffe08a', emissiveStrength: 10 }),
  tip: new E.Material({ name: 'Phoenix tip', color: '#c2260d', roughness: 0.5, emissive: '#e0300a', emissiveStrength: 2.5 }),
};
const sq = (rx, ry, rz, e1 = 0.7, e2 = 0.8) => E.superquadric({ rx, ry, rz, e1, e2, widthSegments: 16, heightSegments: 10 });
const mesh = (geo, mat, name, pos = [0, 0, 0], rot = [0, 0, 0]) => { const m = new E.Mesh(geo, mat, name); m.castShadow = false; m.position.set(pos); m.setEuler(...rot); return m; };

export function createPhoenixModel() {
  const root = new E.Node('Phoenix'), body = new E.Node('Body'); root.add(body);
  body.add(mesh(sq(0.2, 0.19, 0.55), M.feather, 'Body'));
  body.add(mesh(sq(0.13, 0.12, 0.42), M.core, 'Breast', [0, -0.02, 0.06]));
  body.add(mesh(E.sphere({ radius: 0.15, widthSegments: 14, heightSegments: 10 }), M.gold, 'Head', [0, 0.1, 0.62]));
  body.add(mesh(E.cone({ radius: 0.06, height: 0.24, radialSegments: 8 }), M.tip, 'Beak', [0, 0.06, 0.82], [90, 0, 0]));
  for (const s of [-1, 1]) body.add(mesh(E.sphere({ radius: 0.03, widthSegments: 8, heightSegments: 6 }), M.core, 'Eye', [s * 0.09, 0.14, 0.72]));
  // crest and a long tail of five feathers
  for (let i = 0; i < 3; i++) body.add(mesh(E.cone({ radius: 0.025, height: 0.26 + i * 0.04, radialSegments: 6 }), M.gold, 'Crest', [(i - 1) * 0.045, 0.28, 0.58 - i * 0.07], [-140 + i * 8, 0, 0]));
  const tail = [];
  for (let i = -2; i <= 2; i++) {
    const t = new E.Node('Tail'); t.position.set([0, 0.0, -0.5]); t.setEuler(0, i * 9, 0);
    t.add(mesh(E.cone({ radius: 0.07, height: 1.3 - Math.abs(i) * 0.15, radialSegments: 6 }), i % 2 ? M.tip : M.feather, 'Feather', [0, 0, -0.62 + Math.abs(i) * 0.07], [-90, 0, 0]));
    body.add(t); tail.push(t);
  }
  // wings: pivot at the shoulder, three layered panels reaching out
  const wings = [];
  for (const s of [-1, 1]) {
    const pivot = new E.Node('Wing'); pivot.position.set([s * 0.18, 0.05, 0.12]); body.add(pivot);
    [[0.55, 0.42, M.feather, 0], [1.1, 0.34, M.gold, -0.04], [1.55, 0.24, M.tip, -0.1]].forEach(([x, w, mat, dz], k) => pivot.add(mesh(sq(0.5 - k * 0.04, 0.05, w, 0.5, 0.9), mat, 'Feathers', [s * x, 0, dz - k * 0.12], [0, s * -6 * k, 0])));
    wings.push({ pivot, s });
  }
  const light = new E.Light('point', { color: '#ff9a3a', intensity: 9, range: 14, flicker: 0.5 }); root.add(light);
  return { root, body, wings, tail, light };
}

const bez = (a, b, c, t) => { const u = 1 - t; return [0, 1, 2].map((k) => u * u * a[k] + 2 * u * t * b[k] + t * t * c[k]); };
const bezD = (a, b, c, t) => [0, 1, 2].map((k) => 2 * (1 - t) * (b[k] - a[k]) + 2 * t * (c[k] - b[k]));

// A running Phoenix. hooks: { flames(p, n, size), sparks(p, n), ignite(p, r), impact(p), home(): [x,y,z], onDone() }
export class Phoenix {
  constructor(scene, start, target, hooks, { speed = 24 } = {}) {
    this.scene = scene; this.hooks = hooks; this.model = createPhoenixModel(); scene.add(this.model.root);
    this.state = 'out'; this.t = 0; this.time = 0; this.speed = speed; this.dead = false;
    this.a = [...start]; this.c = [...target];
    const mid = [(start[0] + target[0]) / 2, (start[1] + target[1]) / 2, (start[2] + target[2]) / 2];
    const len = Math.hypot(target[0] - start[0], target[1] - start[1], target[2] - start[2]);
    this.b = [mid[0], Math.max(start[1], target[1]) + 3 + len * 0.28, mid[2]];
    this.len = len + 6; this.pos = [...start]; this.igniteT = 0; this.scale = 0.2;
  }
  _place(dir, dt) {
    const m = this.model, v = Math.hypot(dir[0], dir[1], dir[2]) || 1;
    const yaw = (Math.atan2(dir[0], dir[2]) * 180) / Math.PI, pitch = (-Math.asin(E.clamp(dir[1] / v, -1, 1)) * 180) / Math.PI;
    const q = E.quat.multiply(E.quat.create(), E.quat.fromEuler(E.quat.create(), 0, yaw, 0), E.quat.fromEuler(E.quat.create(), pitch, 0, 0));
    m.root.rotation.set(q); m.root.position.set(this.pos);
    if (this.state === 'fade') this.scale = Math.max(0.01, this.scale - dt * 1.6); else this.scale += (1 - this.scale) * Math.min(1, dt * 6);
    const s = this.scale * 2.7; m.root.scale.set([s, s, s]);
    const flap = Math.sin(this.time * 15) * 38 + (this.state === 'back' ? 10 : 0);
    for (const w of m.wings) w.pivot.setEuler(0, 0, w.s * flap + w.s * 8);
    m.tail.forEach((t, i) => t.setEuler(Math.sin(this.time * 6 + i) * 6, (i - 2) * 9 + Math.sin(this.time * 4 + i) * 5, 0));
    m.body.position.set([0, Math.sin(this.time * 15) * 0.06, 0]);
    m.light.intensity = 9 * this.scale;
  }
  update(dt) {
    if (this.dead) return;
    this.time += dt; const h = this.hooks;
    if (this.state === 'out' || this.state === 'back') {
      this.t = Math.min(1, this.t + (this.speed * dt) / this.len);
      const a = this.a, b = this.b, c = this.c;
      const prev = this.pos; this.pos = bez(a, b, c, this.t);
      const d = bezD(a, b, c, this.t);
      this._place(d, dt);
      // wings and body shed fire; the path scorches whatever it crosses
      const back = E.vec3.normalize([0, 0, 0], d).map((x) => -x);
      h.flames(this.pos, 4, 0.5);
      for (let i = 0; i < 2; i++) h.flames([this.pos[0] + (Math.random() - 0.5) * 2.2 * this.scale, this.pos[1] + (Math.random() - 0.5) * 0.5, this.pos[2] + (Math.random() - 0.5) * 2.2 * this.scale], 1, 0.3); // wing tips
      h.sparks(this.pos, 3);
      h.trail(this.pos, back);
      this.igniteT -= dt; if (this.igniteT <= 0) { this.igniteT = 0.07; h.ignite(this.pos, 1.7); }
      if (this.state === 'out' && h.blocked(prev, this.pos)) { h.impact(this.pos); this._turn(); return; }
      if (this.t >= 1) {
        if (this.state === 'out') { h.impact(this.pos); this._turn(); } else { this.state = 'fade'; h.flames(this.pos, 30, 0.6); h.sparks(this.pos, 40); h.arrive?.(); }
      }
    } else if (this.state === 'fade') {
      this._place([0, 1, 0.01], dt); h.flames(this.pos, 3, 0.5);
      if (this.scale <= 0.03) { this.dead = true; this.scene.remove(this.model.root); h.onDone?.(); }
    }
  }
  _turn() { // burst, then swoop up and home to the mage
    this.state = 'back'; this.t = 0; this.a = [...this.pos]; const home = this.hooks.home();
    this.c = home; this.b = [(this.a[0] + home[0]) / 2, Math.max(this.a[1], home[1]) + 9, (this.a[2] + home[2]) / 2];
    this.len = Math.hypot(home[0] - this.a[0], home[1] - this.a[1], home[2] - this.a[2]) + 8;
  }
}
