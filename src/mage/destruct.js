// Destructible environment on the physics engine. A destructible is a static body with a mesh
// and hit points. Blasts (explosions, meteors, the Colossus' fists) wear it down; when it
// breaks, its body and mesh are replaced by a grid of dynamic rigid-body chunks that
// tumble away from the blast, bounce off the ground and each other, then fade out.
import * as E from '../../engine/index.js';

export const DEBRIS_GROUP = 8; // chunks never block the player or shots

export class Destructibles {
  constructor(scene, world, { maxChunks = 260 } = {}) {
    this.scene = scene; this.world = world; this.items = []; this.chunks = []; this.maxChunks = maxChunks;
    this.geo = new Map(); this.onBreak = null; this.broken = 0;
  }
  // item: { node, body, hp, center, radius, size:[x,y,z], grid:[nx,ny,nz], material, name, onBreak }
  add(item) {
    item.maxHp = item.hp; item.alive = true; item.grid ||= [2, 2, 2];
    item.center ||= [...item.body.position]; item.radius ||= Math.max(...item.size) * 0.5;
    this.items.push(item); return item;
  }
  // Wear down everything near a blast. Returns how many things broke.
  damage(point, radius, power) {
    let broke = 0;
    for (const it of [...this.items]) {
      if (!it.alive) continue;
      const d = Math.hypot(it.center[0] - point[0], it.center[1] - point[1], it.center[2] - point[2]) - it.radius;
      if (d > radius) continue;
      it.hp -= power * (1 - Math.max(0, d) / radius);
      if (it.hp <= 0) { this.shatter(it, point, power); broke++; }
    }
    return broke;
  }
  _geo(w, h, d) {
    const k = [w, h, d].map((v) => v.toFixed(2)).join('x');
    if (!this.geo.has(k)) this.geo.set(k, E.box({ width: w, height: h, depth: d, bevel: Math.min(w, h, d) * 0.12, bevelSegments: 1 }));
    return this.geo.get(k);
  }
  shatter(it, from, power = 10) {
    if (!it.alive) return; it.alive = false; this.broken++;
    this.world.remove(it.body); it.node.parent?.remove(it.node); this.scene.remove(it.node);
    this.items.splice(this.items.indexOf(it), 1);
    const [nx, ny, nz] = it.grid, [sx, sy, sz] = it.size, cw = sx / nx, ch = sy / ny, cd = sz / nz;
    const q = it.body.quaternion;
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) for (let k = 0; k < nz; k++) {
      const local = [(i + 0.5) * cw - sx / 2, (j + 0.5) * ch - sy / 2, (k + 0.5) * cd - sz / 2];
      const p = E.physicsMath.add(it.center, E.physicsMath.qrot(q, local));
      const jit = 0.85 + Math.random() * 0.25, w = cw * jit, h = ch * jit, d = cd * jit;
      const body = this.world.add(new E.Body({ shape: new E.Box([w / 2, h / 2, d / 2]), position: p, rotation: [...q], mass: Math.max(0.5, w * h * d * 700), friction: 0.7, restitution: 0.2, group: DEBRIS_GROUP }));
      const node = new E.Mesh(this._geo(w, h, d), it.material, 'Debris'); node.castShadow = false; node.position.set(p); this.scene.add(node); body.node = node;
      const dir = E.physicsMath.norm(E.physicsMath.add(E.physicsMath.sub(p, from), [0, 0.6, 0]));
      const s = Math.min(9, 2 + power * 0.12) * (0.5 + Math.random());
      body.velocity = [dir[0] * s + (Math.random() - 0.5) * 2, dir[1] * s * 0.8 + 1 + Math.random() * 2, dir[2] * s + (Math.random() - 0.5) * 2];
      body.angularVelocity = [(Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8];
      this.chunks.push({ body, node, t: 5 + Math.random() * 4, life: 1 });
    }
    while (this.chunks.length > this.maxChunks) this._drop(this.chunks.shift());
    it.onBreak?.(it); this.onBreak?.(it);
  }
  // free-floating debris from something that was never a destructible (the Colossus, a boulder)
  burst(center, size, material, { count = 40, power = 10, from = center, up = 0.6 } = {}) {
    for (let n = 0; n < count; n++) {
      const w = size * (0.3 + Math.random() * 0.6), h = size * (0.3 + Math.random() * 0.6), d = size * (0.3 + Math.random() * 0.6);
      const p = [center[0] + (Math.random() - 0.5) * size * 3, center[1] + (Math.random() - 0.5) * size * 3, center[2] + (Math.random() - 0.5) * size * 3];
      const body = this.world.add(new E.Body({ shape: new E.Box([w / 2, h / 2, d / 2]), position: p, mass: Math.max(0.5, w * h * d * 600), friction: 0.7, restitution: 0.25, group: DEBRIS_GROUP }));
      const node = new E.Mesh(this._geo(w, h, d), material, 'Debris'); node.castShadow = false; node.position.set(p); this.scene.add(node); body.node = node;
      const dir = E.physicsMath.norm(E.physicsMath.add(E.physicsMath.sub(p, from), [0, up, 0]));
      const s = power * (0.4 + Math.random() * 0.8);
      body.velocity = [dir[0] * s, dir[1] * s + 2, dir[2] * s]; body.angularVelocity = [(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10];
      this.chunks.push({ body, node, t: 4 + Math.random() * 4, life: 1 });
    }
    while (this.chunks.length > this.maxChunks) this._drop(this.chunks.shift());
  }
  _drop(c) { this.world.remove(c.body); this.scene.remove(c.node); }
  update(dt) {
    for (let i = this.chunks.length - 1; i >= 0; i--) {
      const c = this.chunks[i]; c.t -= dt;
      if (c.t < 1) c.node.scale.set([Math.max(0.01, c.t), Math.max(0.01, c.t), Math.max(0.01, c.t)]);
      if (c.t <= 0 || c.body.position[1] < -5) { this._drop(c); this.chunks.splice(i, 1); }
    }
  }
  clear() { for (const c of this.chunks) this._drop(c); this.chunks.length = 0; for (const it of this.items) { this.world.remove(it.body); it.node.parent?.remove(it.node); } this.items.length = 0; }
}
