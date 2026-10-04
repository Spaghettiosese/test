// Squad director: guards no longer act alone. While the alert is up it hands out tactics
// (engage, circle, flank, cut off the exit, shoot from range), keeps at most two swords on the
// player at once, splits a search between guards so they sweep different rooms, and lets a
// wounded or lone guard run for help. Also owns crossbow bolts.
import * as E from '../../engine/index.js';

const hyp = Math.hypot;
export class Squad {
  constructor(g) {
    this.g = g; this.t = 0; this.visited = []; this.bolts = []; this.callT = 0;
    this.boltGeo = E.box({ width: 0.05, height: 0.05, depth: 0.5 });
    this.boltMat = new E.Material({ name: 'Bolt', color: '#3a2a1c', roughness: 0.8 });
    this.tokens = 0;
  }
  // ---------------------------------------------------------------- tactics
  update(dt) {
    this.updateBolts(dt);
    this.t -= dt; if (this.t > 0) return; this.t = 0.35;
    const g = this.g, P = g.player; if (!P.pos) return;
    const eng = [];
    for (const n of g.npcs) if (n.guard && !n.dead && (n.state === 'chase' || n.state === 'attack') && n.dist < 55) eng.push(n);
    this.tokens = eng.filter((n) => n.state === 'attack' && n.tactic === 'engage').length;
    if (!eng.length) { this.visited = this.visited.filter((v) => g.time - v.t < 90); return; }
    eng.sort((a, b) => a.dist - b.dist);
    const maxAtk = g.alarmLevel > 2 ? 3 : 2;
    const fx = P.flat || [0, 1], vx = P.cc?.velocity?.[0] || 0, vz = P.cc?.velocity?.[2] || 0, vl = hyp(vx, vz);
    let atk = 0, k = 0;
    for (const n of eng) {
      if (n.ranged) { n.tactic = 'archer'; continue; }
      if (atk < maxAtk && n.dist < 22) { n.tactic = 'engage'; atk++; continue; }
      const i = k++;
      if (i % 3 === 0) { // flank: the point beside the player, alternating sides
        const s = (i / 3) % 2 === 0 ? 1 : -1, x = P.pos[0] - fx[1] * 4.5 * s + fx[0] * 1.5, z = P.pos[2] + fx[0] * 4.5 * s + fx[1] * 1.5;
        const q = g.nav.nearestWalkable(x, z, 4); n.tactic = 'flank'; n.tacticPt = q;
      } else if (i % 3 === 1) { // cut off: ahead of where the player is running
        const dx = vl > 1 ? vx / vl : fx[0], dz = vl > 1 ? vz / vl : fx[1];
        const q = g.nav.nearestWalkable(P.pos[0] + dx * 11, P.pos[2] + dz * 11, 5); n.tactic = 'cutoff'; n.tacticPt = q;
      } else n.tactic = 'circle';
      if (!n.tacticPt) n.tactic = 'circle';
    }
    // a guard with nobody around and a fight on his hands shouts for friends
    for (const n of eng) if (n.state === 'chase' && !n.calledHelp && n.hp < n.maxHp * 0.5) {
      n.calledHelp = true; n.bark('Reinforcements! Over here!'); g.alarm(n.pos, 'combat', n); g.sfx.hornShort?.();
    }
  }
  // ---------------------------------------------------------------- searching together
  pickSearchPoint(n) {
    const g = this.g, c = n.stim || [n.x, n.z], now = g.time;
    this.visited = this.visited.filter((v) => now - v.t < 70);
    const fresh = (x, z, r = 4.5) => !this.visited.some((v) => hyp(v.x - x, v.z - z) < r);
    let best = null, bs = -1e9;
    const consider = (x, z, bonus, tag, obj) => {
      if (!fresh(x, z)) return;
      const q = g.nav.nearestWalkable(x, z, 2); if (!q) return;
      const s = bonus - hyp(q[0] - n.x, q[1] - n.z) * 0.35 - hyp(q[0] - c[0], q[1] - c[1]) * 0.25 + Math.random() * 2;
      if (s > bs) { bs = s; best = { x: q[0], z: q[1], tag, obj }; }
    };
    for (const s of (g.level.containers || [])) if (!s.opened && hyp(s.x - c[0], s.z - c[1]) < 22) consider(s.x, s.z, 4, 'spot', s);
    for (const d of g.level.doors) if (!d.gate && !d.isOpen() && hyp(d.x - c[0], d.z - c[1]) < 20) consider(d.x, d.z, 3, 'door', d);
    for (let i = 0; i < 9; i++) { const a = Math.random() * 6.283, r = 3 + Math.random() * 12; consider(c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r, 0, 'roam'); }
    if (best) this.visited.push({ x: best.x, z: best.z, t: now });
    return best;
  }
  // ---------------------------------------------------------------- crossbow bolts
  fireBolt(n, o = {}) {
    const g = this.g, P = g.player;
    const from = [n.x + n.fwd[0] * 0.5, n.y + 1.45, n.z + n.fwd[1] * 0.5];
    const lead = 0.18, tx = P.pos[0] + (P.cc?.velocity?.[0] || 0) * lead, tz = P.pos[2] + (P.cc?.velocity?.[2] || 0) * lead;
    const to = [tx, P.pos[1] + (P.crouch ? 0.9 : 1.35), tz];
    const dx = to[0] - from[0], dy = to[1] - from[1], dz = to[2] - from[2], d = hyp(dx, dy, dz), sp = o.speed || 34;
    const mesh = new E.Mesh(this.boltGeo, this.boltMat, o.kind === 'knife' ? 'Knife' : 'Bolt'); mesh.castShadow = false;
    g.scene.add(mesh);
    this.bolts.push({ mesh, p: from, v: [dx / d * sp, dy / d * sp + 0.6, dz / d * sp], life: 1.6, from: n, dmg: o.dmg || 13, venom: !!o.venom });
    g.sfx.swing?.(0.5); g.sfx.clang?.(0.3, n.pos);
  }
  updateBolts(dt) {
    const g = this.g, P = g.player;
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const b = this.bolts[i]; b.life -= dt;
      const step = [b.v[0] * dt, b.v[1] * dt, b.v[2] * dt], len = hyp(...step);
      b.v[1] -= 4 * dt;
      let dead = b.life <= 0;
      if (!dead) {
        const dir = [step[0] / len, step[1] / len, step[2] / len];
        const h = g.world.raycast(b.p, dir, len + 0.1, { ignore: new Set([b.from.body, P.cc.body]), mask: 0xffff & ~(2 | 4 | 8) });
        if (h) { g.spark([b.p[0] + dir[0] * h.distance, b.p[1] + dir[1] * h.distance, b.p[2] + dir[2] * h.distance], [-dir[0], 0.3, -dir[2]], 6); g.noise(b.p, 8, 'clang'); dead = true; }
        else if (!P.dead && hyp(b.p[0] - P.pos[0], b.p[2] - P.pos[2]) < 0.55 && b.p[1] > P.pos[1] - 0.1 && b.p[1] < P.pos[1] + (P.crouch ? 1.3 : 1.85)) {
          const res = P.incoming(b.dmg * (g.ngDmg || 1), [b.p[0] - dir[0] * 2, b.p[2] - dir[2] * 2], { from: b.from, ranged: true });
          if (res === 'parried') g.flashText?.('DEFLECTED'); else if (res === 'hit' && b.venom) g.status?.add?.('venom');
          dead = true;
        }
      }
      if (dead) { g.scene.remove(b.mesh); this.bolts.splice(i, 1); continue; }
      b.p[0] += step[0]; b.p[1] += step[1]; b.p[2] += step[2];
      b.mesh.position.set(b.p);
      E.quat.fromEuler(b.mesh.rotation, -Math.atan2(b.v[1], hyp(b.v[0], b.v[2])) / (Math.PI / 180), Math.atan2(b.v[0], b.v[2]) / (Math.PI / 180), 0);
    }
  }
}
