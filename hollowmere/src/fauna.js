// Living things that are not people: deer to hunt, crows that scatter, rats in the alleys and
// bats in the dark. Small box-built bodies, simple senses, and they react to noise.
import * as E from '../../engine/index.js';

const hyp = Math.hypot;
const rnd = E.rng(4242);
const r = (a, b) => a + (b - a) * rnd();
const R2D = 180 / Math.PI;
const rx = (n, v) => n.setEuler(v * R2D, 0, 0), rz = (n, v) => n.setEuler(0, 0, v * R2D);

export class Fauna {
  constructor(g) {
    this.g = g; this.list = []; this.t = 0; this.chirpT = 3;
    const M = (n, c, e = 0) => new E.Material({ name: n, color: c, roughness: 1, emissive: e ? c : '#000000', emissiveStrength: e });
    this.m = { deer: M('Deer', '#6a4a30'), deerLight: M('Deer belly', '#a08058'), antler: M('Antler', '#c8b890'), crow: M('Crow', '#14141a'), rat: M('Rat', '#4a4440'), bat: M('Bat', '#221a2a'), eye: M('Eye', '#ff5040', 2), wolf: M('Wolf', '#4c4c54'), wolfLight: M('Wolf belly', '#8c8c94'), eyeY: M('Wolf eye', '#ffd040', 2) };
    this.geo = { box: E.box({ width: 1, height: 1, depth: 1 }) };
    const L = g.level, nav = g.nav;
    const free = (x, z) => !nav.isBlocked(x, z) && !nav.indoorAt(x, z);
    const scatter = (kind, n, rect, test = free) => { let k = 0, tries = 0; while (k < n && tries++ < 300) { const x = r(rect[0], rect[2]), z = r(rect[1], rect[3]); if (!test(x, z)) continue; this.spawn(kind, x, z); k++; } };
    scatter('deer', 16, [-240, -150, -70, 190]); scatter('deer', 4, [56, -230, 200, -80]); scatter('deer', 3, [60, -150, 120, -90]);
    for (const [cx, cz, n] of [[198, 150, 4], [150, 60, 4], [60, -130, 3], [-110, 66, 3], [195, 120, 4], [-190, -225, 3]]) for (let i = 0; i < n; i++) this.spawn('crow', cx + r(-8, 8), cz + r(-8, 8));
    for (let i = 0; i < 10; i++) { const x = r(-40, 40), z = r(18, 90); if (free(x, z)) this.spawn('rat', x, z); }
    for (const p of [[-240, 122], [-230, 134], [-236, 152], [-244, 156], [-232, 122]]) { this.spawn('bat', p[0], p[1]); this.spawn('bat', p[0] + 1, p[1] + 1); }
    for (const p of [[83, 15], [100, 30], [105, 50]]) this.spawn('bat', p[0], p[1]);
    // wolf packs in the wild forest, the fen and the ash
    for (const [cx, cz, k] of [[-120, 10, 3], [-150, -30, 3], [-95, 100, 3], [-140, -205, 2], [-200, -160, 2], [140, 100, 2], [70, -60, 2]]) { let n = 0, tries = 0; while (n < k && tries++ < 40) { const x = cx + r(-12, 12), z = cz + r(-12, 12); if (!free(x, z)) continue; const w = this.spawn('wolf', x, z); w.home = [cx, cz]; n++; } }
  }
  spawn(kind, x, z) {
    const g = this.g, m = this.m, n = new E.Node(kind), part = (mat, pos, size, parent = n) => { const mesh = new E.Mesh(this.geo.box, mat, kind); mesh.scale.set(size); mesh.position.set(pos); mesh.castShadow = false; parent.add(mesh); return mesh; };
    const a = { kind, x, z, y: g.nav.floorAt(x, z), yaw: r(0, 6.28), state: 'idle', t: r(0, 4), hp: kind === 'deer' ? 22 : kind === 'wolf' ? 26 : 3, node: n, legs: [], speed: 0, home: [x, z], dead: false, alpha: 1 };
    if (kind === 'deer') {
      part(m.deer, [0, 0.95, 0], [0.42, 0.5, 1.15]); part(m.deerLight, [0, 0.72, 0.05], [0.36, 0.14, 0.9]);
      a.neck = new E.Node('neck'); a.neck.position.set([0, 1.1, 0.55]); n.add(a.neck); rx(part(m.deer, [0, 0.2, 0.12], [0.16, 0.5, 0.16], a.neck), 0.4); const head = part(m.deer, [0, 0.46, 0.3], [0.17, 0.17, 0.34], a.neck); head.castShadow = false;
      if (rnd() < 0.5) for (const s of [-1, 1]) part(m.antler, [s * 0.1, 0.72, 0.26], [0.04, 0.4, 0.04], a.neck);
      for (const [lx, lz] of [[-0.14, 0.45], [0.14, 0.45], [-0.14, -0.45], [0.14, -0.45]]) { const leg = new E.Node('leg'); leg.position.set([lx, 0.72, lz]); n.add(leg); part(m.deer, [0, -0.36, 0], [0.09, 0.72, 0.09], leg); a.legs.push(leg); }
    } else if (kind === 'crow') {
      part(m.crow, [0, 0.14, 0], [0.12, 0.12, 0.3]); part(m.crow, [0, 0.2, 0.18], [0.08, 0.08, 0.1]);
      a.wings = [-1, 1].map((s) => { const w = new E.Node('wing'); w.position.set([s * 0.05, 0.16, 0]); n.add(w); part(m.crow, [s * 0.16, 0, 0], [0.32, 0.02, 0.18], w); return w; });
      a.perch = true; a.flyY = 0; a.home = [x, z];
    } else if (kind === 'rat') { part(m.rat, [0, 0.07, 0], [0.09, 0.08, 0.26]); part(m.rat, [0, 0.03, -0.2], [0.02, 0.02, 0.2]); }
    else if (kind === 'bat') { a.flyY = 1.8 + r(0, 1.2); part(m.bat, [0, 0, 0], [0.1, 0.08, 0.14]); a.wings = [-1, 1].map((s) => { const w = new E.Node('wing'); w.position.set([s * 0.05, 0, 0]); n.add(w); part(m.bat, [s * 0.14, 0, 0], [0.3, 0.01, 0.14], w); return w; }); a.cx = x; a.cz = z; }
    else if (kind === 'wolf') {
      part(m.wolf, [0, 0.62, 0], [0.32, 0.36, 0.95]); part(m.wolfLight, [0, 0.45, 0.05], [0.26, 0.12, 0.7]);
      a.neck = new E.Node('neck'); a.neck.position.set([0, 0.72, 0.5]); n.add(a.neck); part(m.wolf, [0, 0.04, 0.12], [0.24, 0.26, 0.3], a.neck); part(m.wolf, [0, -0.02, 0.34], [0.13, 0.12, 0.22], a.neck);
      for (const s of [-1, 1]) { part(m.wolf, [s * 0.08, 0.2, 0.05], [0.06, 0.12, 0.05], a.neck); part(m.eyeY, [s * 0.07, 0.07, 0.26], [0.03, 0.03, 0.03], a.neck); }
      for (const [lx, lz] of [[-0.11, 0.36], [0.11, 0.36], [-0.11, -0.36], [0.11, -0.36]]) { const leg = new E.Node('leg'); leg.position.set([lx, 0.46, lz]); n.add(leg); part(m.wolf, [0, -0.23, 0], [0.08, 0.46, 0.08], leg); a.legs.push(leg); }
      a.tail = new E.Node('tail'); a.tail.position.set([0, 0.78, -0.5]); n.add(a.tail); rx(part(m.wolf, [0, -0.1, -0.2], [0.08, 0.08, 0.5], a.tail), -0.5); a.cd = 0; a.senseT = 0;
    }
    g.scene.add(n); this.list.push(a); this.place(a); return a;
  }
  place(a) { const y = a.kind === 'bat' ? a.flyY : a.kind === 'crow' ? a.flyY : 0; a.node.position.set([a.x, a.y + y, a.z]); E.quat.fromEuler(a.node.rotation, 0, a.yaw / (Math.PI / 180), 0); }
  // noise scares what can hear it
  hear(pos, radius, kind) {
    for (const a of this.list) { if (a.dead || a.kind === 'bat' && a.state === 'idle') continue; const d = hyp(a.x - pos[0], a.z - pos[2]); if (d < radius * (a.kind === 'deer' ? 1.1 : 0.9)) this.scare(a, pos); }
  }
  scare(a, from) {
    if (a.dead) return;
    if (a.kind === 'deer') { a.state = 'flee'; a.t = 5; a.fromX = from[0]; a.fromZ = from[2]; }
    else if (a.kind === 'crow' && a.perch) { a.perch = false; a.state = 'fly'; a.t = 7; a.vx = (a.x - from[0]) * 0.3 + r(-2, 2); a.vz = (a.z - from[2]) * 0.3 + r(-2, 2); this.g.sfx.crow?.([a.x, 4, a.z]); this.g.noise([a.x, 0, a.z], 6, 'step'); }
    else if (a.kind === 'rat') { a.state = 'flee'; a.t = 2.5; a.fromX = from[0]; a.fromZ = from[2]; }
  }
  update(dt) {
    const g = this.g, P = g.player; if (!P.pos) return;
    this.t += dt; const time = this.t;
    for (const a of this.list) {
      const dx = a.x - P.pos[0], dz = a.z - P.pos[2], d = hyp(dx, dz);
      const vis = d < 70; a.node.visible = vis && a.alpha > 0; if (!vis || a.dead) { if (a.dead) this.settle(a, dt); continue; }
      a.t -= dt;
      if (a.kind === 'deer') {
        const scared = d < (P.crouch ? 7 : P.sprint ? 26 : 15) && g.canSeeAnimal?.(a) !== false;
        if (scared && a.state !== 'flee') this.scare(a, P.pos);
        if (a.state === 'flee') { const l = hyp(a.x - a.fromX, a.z - a.fromZ) || 1; this.move(a, (a.x - a.fromX) / l, (a.z - a.fromZ) / l, 8, dt); if (a.t <= 0 && d > 18) { a.state = 'idle'; a.t = r(2, 6); } }
        else if (a.state === 'walk') { this.move(a, Math.sin(a.yaw), Math.cos(a.yaw), 1.3, dt); if (a.t <= 0) { a.state = 'idle'; a.t = r(3, 8); } }
        else { a.speed = 0; if (a.t <= 0) { if (rnd() < 0.5) { a.state = 'walk'; a.yaw += r(-1.5, 1.5); a.t = r(2, 5); if (hyp(a.x - a.home[0], a.z - a.home[1]) > 14) a.yaw = Math.atan2(a.home[0] - a.x, a.home[1] - a.z); } else a.t = r(3, 7); } rx(a.neck, 0.9 + Math.sin(time * 1.2 + a.home[0]) * 0.05); }
        if (a.state !== 'idle') rx(a.neck, -0.1);
        a.legs.forEach((leg, i) => { rx(leg, Math.sin(time * (a.speed > 4 ? 14 : 6) + (i % 2 ? Math.PI : 0) + (i > 1 ? 0.6 : 0)) * Math.min(0.9, a.speed * 0.12)); });
      } else if (a.kind === 'crow') {
        if (a.perch) { if (d < (P.crouch ? 4 : 9) && !P.veilT) this.scare(a, P.pos); a.flyY = 0; a.wings.forEach((w) => rz(w, 0.05)); }
        else { a.x += a.vx * dt; a.z += a.vz * dt; a.flyY = Math.min(9, a.flyY + dt * 6) + Math.sin(time * 3 + a.home[0]) * 0.02; a.yaw = Math.atan2(a.vx, a.vz); a.wings.forEach((w, i) => rz(w, Math.sin(time * 22) * 0.9 * (i ? -1 : 1))); if (a.t <= 0) { a.perch = true; a.x = a.home[0]; a.z = a.home[1]; a.flyY = 0; a.state = 'idle'; } }
      } else if (a.kind === 'rat') {
        if (d < (P.crouch ? 2 : 4.5) && a.state !== 'flee') this.scare(a, P.pos);
        if (a.state === 'flee') { const l = hyp(a.x - a.fromX, a.z - a.fromZ) || 1; this.move(a, (a.x - a.fromX) / l, (a.z - a.fromZ) / l, 4.5, dt); if (a.t <= 0) a.state = 'idle'; } else if (a.t <= 0) { a.t = r(1, 4); a.yaw += r(-2, 2); a.state = rnd() < 0.3 ? 'walk' : 'idle'; } if (a.state === 'walk') this.move(a, Math.sin(a.yaw), Math.cos(a.yaw), 1, dt);
      } else if (a.kind === 'wolf') {
        this.wolf(a, d, dt, time);
      } else if (a.kind === 'bat') {
        const lan = g.lantern?.on && d < 10; const ang = time * 1.4 + a.cx; const R = lan ? 6 : 3.5;
        const tx = a.cx + Math.cos(ang) * R, tz = a.cz + Math.sin(ang * 1.3) * R; a.yaw = Math.atan2(tx - a.x, tz - a.z); a.x += (tx - a.x) * Math.min(1, dt * 2.2); a.z += (tz - a.z) * Math.min(1, dt * 2.2); a.flyY = 1.8 + Math.sin(time * 2.4 + a.cx) * 0.5;
        a.wings.forEach((w, i) => rz(w, Math.sin(time * 26) * 1.0 * (i ? -1 : 1)));
        if (d < 4 && !a.startled) { a.startled = 8; g.sfx.whisper?.(); } a.startled = Math.max(0, (a.startled || 0) - dt);
      }
      this.place(a);
    }
    this.chirpT -= dt; if (this.chirpT <= 0) { this.chirpT = 6 + rnd() * 8; const near = this.list.find((a) => !a.dead && a.kind === 'crow' && a.perch && hyp(a.x - P.pos[0], a.z - P.pos[2]) < 40); if (near) g.sfx.crow?.([near.x, 3, near.z]); }
  }
  // a wolf is a pack animal: it watches, stalks whoever comes near at night, and calls the pack
  wolf(a, d, dt, time) {
    const g = this.g, P = g.player, night = g.clock.night, diff = [0.7, 1, 1.3][g.difficulty ?? 1]; a.cd = Math.max(0, a.cd - dt);
    const det = (P.crouch ? 6 : P.sprint || P.mount ? 24 : 15) * (night ? 1.3 : 0.55) * (P.veilT > 0 ? 0.3 : 1);
    if (a.state === 'chase') {
      if (P.dead || d > 48) { a.state = 'idle'; a.t = 3; }
      else if (a.hp < 8) { a.state = 'flee'; a.t = 7; a.fromX = P.pos[0]; a.fromZ = P.pos[2]; }
      else {
        this.steer(a, P.pos[0], P.pos[2], d > 7 ? 7.2 : 5.6, dt);
        if (d < 1.7 && a.cd <= 0 && Math.abs(P.pos[1] - a.y) < 1.4) { a.cd = 1.4; const r = P.incoming(7 * diff, [a.x, a.z], {}); g.sfx.grunt?.(0.9, [a.x, 0, a.z], 0.6); if (r === 'hit') { g.spawnBlood?.([P.pos[0], P.pos[1] + 1, P.pos[2]], [0, 0], 4); if (Math.random() < 0.25) g.status.add('fear', 4); } a.neck.setEuler(-35, 0, 0); }
        else a.neck.setEuler(0, 0, 0);
      }
    } else if (a.state === 'flee') {
      const l = hyp(a.x - a.fromX, a.z - a.fromZ) || 1; this.move(a, (a.x - a.fromX) / l, (a.z - a.fromZ) / l, 7.5, dt); if (a.t <= 0) a.state = 'idle';
    } else {
      a.speed = 0; a.senseT -= dt;
      if (d < det && a.senseT <= 0 && !P.dead) { a.senseT = 0.4; if (g.canSee([a.x, a.y + 0.6, a.z], [P.pos[0], P.pos[1] + 1.2, P.pos[2]])) this.alertPack(a); }
      if (a.state === 'walk') { this.move(a, Math.sin(a.yaw), Math.cos(a.yaw), 1.6, dt); if (a.t <= 0) { a.state = 'idle'; a.t = r(3, 8); } }
      else if (a.t <= 0) { a.t = r(2, 5); if (rnd() < 0.55) { a.state = 'walk'; a.yaw = hyp(a.x - a.home[0], a.z - a.home[1]) > 12 ? Math.atan2(a.home[0] - a.x, a.home[1] - a.z) : a.yaw + r(-2, 2); } }
      a.neck.setEuler(night ? 0 : 25, 0, 0);
    }
    a.legs.forEach((leg, i) => rx(leg, Math.sin(time * (a.speed > 5 ? 17 : 8) + (i % 2 ? Math.PI : 0) + (i > 1 ? 0.8 : 0)) * Math.min(0.9, a.speed * 0.12)));
    a.tail.setEuler(a.state === 'chase' ? 10 : 55, Math.sin(time * 3 + a.home[0]) * 14, 0);
    // howling at night, from the dark
    if (night && a.state === 'idle' && rnd() < dt * 0.012 && d < 90) { g.sfx.howl?.([a.x, 1, a.z]); }
  }
  alertPack(a) {
    const g = this.g; let k = 0;
    for (const o of this.list) if (o.kind === 'wolf' && !o.dead && o.state !== 'chase' && o.state !== 'flee' && hyp(o.x - a.x, o.z - a.z) < 32) { o.state = 'chase'; k++; }
    if (a.state !== 'chase' && !a.dead) { a.state = 'chase'; k++; }
    if (k) { g.sfx.howl?.([a.x, 1, a.z]); g.flashText?.('WOLVES'); g.noise([a.x, 0, a.z], 18, 'scream'); }
  }
  // head for a point, sliding round whatever is in the way
  steer(a, tx, tz, sp, dt) {
    const nav = this.g.nav, base = Math.atan2(tx - a.x, tz - a.z);
    for (const off of [0, 0.5, -0.5, 1.0, -1.0, 1.6, -1.6]) { const ang = base + off, nx = a.x + Math.sin(ang) * sp * dt, nz = a.z + Math.cos(ang) * sp * dt; if (!nav.isBlocked(nx, nz) && !nav.indoorAt(nx, nz)) { a.x = nx; a.z = nz; a.y = nav.floorAt(nx, nz); a.yaw += ((ang - a.yaw + Math.PI * 3) % (Math.PI * 2) - Math.PI) * Math.min(1, dt * 9); a.speed = sp; return; } }
    a.speed = 0;
  }
  move(a, dx, dz, sp, dt) {
    const nav = this.g.nav, nx = a.x + dx * sp * dt, nz = a.z + dz * sp * dt;
    if (nav.isBlocked(nx, nz) || nav.indoorAt(nx, nz)) { a.yaw += 1.2; a.speed = 0; return; }
    a.x = nx; a.z = nz; a.yaw += ((Math.atan2(dx, dz) - a.yaw + Math.PI * 3) % (Math.PI * 2) - Math.PI) * Math.min(1, dt * 6); a.y = nav.floorAt(a.x, a.z); a.speed = sp;
  }
  settle(a, dt) { if (a.fall < 1) { a.fall = Math.min(1, a.fall + dt * 3); E.quat.fromEuler(a.node.rotation, 0, a.yaw / (Math.PI / 180), a.fall * 84); } a.fadeT = (a.fadeT ?? 120) - dt; if (a.fadeT <= 0 && !a.skinned) { a.alpha = 0; a.node.visible = false; } }
  kill(a, dir) {
    if (a.dead) return; a.dead = true; a.fall = 0; a.state = 'dead'; this.g.spawnBlood([a.x, 0.6, a.z], dir || [0, 0], 8); this.g.sfx.thud?.(0.5, [a.x, 0, a.z]);
    if (a.kind === 'deer') this.g.noise([a.x, 0, a.z], 8, 'step'); this.g.stats.hunted = (this.g.stats.hunted || 0) + (a.kind === 'deer' ? 1 : 0); if (a.kind === 'wolf') { this.g.stats.wolves = (this.g.stats.wolves || 0) + 1; this.g.progress.addXp(14, 'wolf'); }
  }
  // melee and thrown hits from the player
  hit(origin, flat, reach, arc, dmg) {
    let any = false;
    for (const a of this.list) {
      if (a.dead || !a.node.visible) continue; const dx = a.x - origin[0], dz = a.z - origin[2], d = hyp(dx, dz); if (d > reach + 0.3) continue;
      if ((dx * flat[0] + dz * flat[1]) / (d || 1) < arc && d > 0.9) continue;
      a.hp -= dmg; any = true; this.g.spawnBlood([a.x, 0.6, a.z], [dx / (d || 1), dz / (d || 1)], 6); if (a.hp <= 0) this.kill(a, [dx / (d || 1), dz / (d || 1)]); else this.scare(a, origin);
    }
    return any;
  }
  hitPoint(p, dmg) { for (const a of this.list) { if (a.dead || !a.node.visible) continue; const y = a.kind === 'deer' ? 0.6 : a.kind === 'wolf' ? 0.4 : 0.1; if (hyp(a.x - p[0], a.z - p[2]) < (a.kind === 'deer' ? 0.6 : a.kind === 'wolf' ? 0.5 : 0.3) && p[1] < a.y + y + 0.9 && p[1] > a.y - 0.2 + (a.kind === 'bat' || a.kind === 'crow' ? a.flyY - 0.3 : 0)) { a.hp -= dmg; if (a.hp <= 0) this.kill(a, [0, 0]); else this.scare(a, p); return a; } } return null; }
  hook(push, eye) {
    const g = this.g;
    for (const a of this.list) if (a.dead && (a.kind === 'deer' || a.kind === 'wolf') && !a.skinned && hyp(a.x - eye[0], a.z - eye[2]) < 2.6) push(a.x, 0.4, a.z, 2.8, a.kind === 'wolf' ? 'Skin the wolf' : 'Skin the deer', () => this.skin(a), 'body', 0.5, a);
  }
  skin(a) { const g = this.g, P = g.player; a.skinned = true; a.node.visible = false; if (a.kind === 'wolf') { P.inv.add('pelt', 1); if (Math.random() < 0.6) P.inv.add('fang', 1); g.toast('Skinned the wolf: a pelt' + (P.inv.has('fang') ? ' and a fang' : '')); g.sfx.pick?.(); g.progress.addXp(8, 'hunted'); return; } const m = 2 + (Math.random() < 0.4 ? 1 : 0); P.inv.add('rawmeat', m); P.inv.add('hide', 1); g.toast(`Skinned the deer: ${m} venison, 1 hide`); g.sfx.pick?.(); g.progress.addXp(5, 'hunted'); }
}
