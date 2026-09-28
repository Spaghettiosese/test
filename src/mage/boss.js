// The Ice Mage boss fight. Phase one: the Ice Mage himself, a caster with a handful of
// telegraphed attacks you can dodge (ice bolt volleys, a frost nova ring to jump, chasing
// ice spikes, a sweeping blizzard beam, a blink). At half health a cutscene plays and he
// turns into the Ice Colossus, who smashes, throws boulders, calls icicle rain, charges
// through pillars and breathes frost. Attacks are generators: `yield seconds` waits.
import * as E from '../../engine/index.js';
import { createMage, bonePoint } from './mage.js';
import { createColossus, COLOSSUS_MATERIALS } from './colossus.js';
import { ARENA_RADIUS } from './arena.js';

const lerp = (a, b, k) => a + (b - a) * k;
const easeIn = (k) => k * k, easeOut = (k) => 1 - (1 - k) * (1 - k), easeIO = (k) => k * k * (3 - 2 * k);
const hdist = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
const TELE = new E.Material({ name: 'Telegraph', color: '#ff5a3a', roughness: 1, emissive: '#ff3a1a', emissiveStrength: 2.2, opacity: 0.42, doubleSided: true });
const SHARD = new E.Material({ name: 'Ice shard', color: '#bfefff', roughness: 0.05, emissive: '#5ac8ff', emissiveStrength: 3.2 });
const WAVE = new E.Material({ name: 'Ice wave', color: '#d8f6ff', roughness: 0.1, emissive: '#7fd6ff', emissiveStrength: 3, opacity: 0.8, doubleSided: true });

export class IceBoss {
  constructor(G) {
    this.G = G; this.maxHp = 720; this.hp = this.maxHp; this.phase = 1; this.active = false; this.dead = false;
    this.pos = [0, 0, 8]; this.y = 0; this.yaw = Math.PI; this.speed = 0; this.moving = 0;
    this.mage = createMage({}, 'ice'); this.mage.springs = false; this.mage.scale.set([1.3, 1.3, 1.3]); G.scene.add(this.mage);
    const sk = this.mage.skeleton;
    this.cast = this.mage.mixer.addLayer('cast', { mask: E.boneMask(sk, ['spine']) });
    this.full = this.mage.mixer.addLayer('full', { mask: null });
    this.loco = new E.BlendSpace1D(this.mage.mixer, [{ clip: 'Idle', x: 0 }, { clip: 'Walk', x: 1.35 }, { clip: 'Run', x: 4.4 }]);
    this.colossus = createColossus(); this.colossus.root.visible = false; G.scene.add(this.colossus.root);
    this.tele = []; this.things = []; this.tw = []; this.task = null; this.wait = 1; this.last = ''; this.beam = null;
    this.stun = 0; this.flashT = 0; this.time = 0; this.hidden = true; this.mage.visible = false;
    this.light = new E.Light('point', { color: '#7fd6ff', intensity: 5, range: 12, flicker: 0.2 }); G.scene.add(this.light);
    this.mage.mixer.play('Idle', { fade: 0 });
  }
  // ------------------------------------------------------------ queries
  center() { return this.phase === 1 ? [this.pos[0], this.y + 1.3, this.pos[2]] : [this.pos[0], 3.6, this.pos[2]]; }
  radius() { return this.phase === 1 ? 1.0 : 3.3; }
  hits(p, r = 0) { const c = this.center(); return this.active && !this.hidden && Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]) < this.radius() + r; }
  mouth() { return this.phase === 1 ? bonePoint(this.mage, 'hand.R', [0, -0.05, 0.05]) : [this.pos[0] + Math.sin(this.yaw) * 2.4, 6.0, this.pos[2] + Math.cos(this.yaw) * 2.4]; }
  player() { return this.G.player.pos(); }
  fwd() { return [Math.sin(this.yaw), 0, Math.cos(this.yaw)]; }

  // ------------------------------------------------------------ damage
  hurt(n, p) {
    if (!this.active || this.dead || this.hidden) return false;
    if (this.phase === 2 && this.stun > 0) n *= 1.5;
    this.hp = Math.max(0, this.hp - n); this.flashT = 0.12;
    if (this.phase === 1 && this.hp <= this.maxHp / 2) { this.hp = this.maxHp / 2; this.G.hud.boss(this); this.beginTransform(); return true; }
    if (this.hp <= 0) { this.beginVictory(); return true; }
    if (this.phase === 1 && Math.random() < 0.12 && !this.task) this.cast.playOnce('Hit', { fadeIn: 0.05, fadeOut: 0.2 });
    this.G.hud.boss(this); return true;
  }
  // ------------------------------------------------------------ helpers
  mist(p, n = 8, size = 0.5, spread = 2, up = 1) { this.G.fire.smoke.emit(p, { count: n, color: [0.85, 0.93, 1, 0.5], colorEnd: [0.9, 0.96, 1, 0.05], size, grow: 4, spread, up, buoyancy: 0.2, life: 1.6, jitter: 0.3 }); }
  glint(p, n = 12, spread = 3) { this.G.sparks.emit(p, { count: n, color: [1.5, 3, 5, 1], colorEnd: [0.3, 1, 2.5, 0.3], size: 0.07, grow: 0.5, spread, up: spread * 0.6, life: 0.9, jitter: 0.2 }); }
  burst(p, n = 20, spread = 4) { this.mist(p, n * 0.6, 0.6, spread * 0.5, 1); this.glint(p, n, spread); }
  tween(dur, fn) { this.tw.push({ t: 0, d: dur, fn }); }
  face(target, rate = 1) { const d = Math.atan2(target[0] - this.pos[0], target[2] - this.pos[2]); let a = d - this.yaw; while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; this.yaw += a * rate; }
  telegraphDisc(p, r, dur) { const m = new E.Mesh(E.cylinder({ radiusTop: 1, radiusBottom: 1, height: 0.03, radialSegments: 40 }), TELE, 'Telegraph'); m.castShadow = false; m.position.set([p[0], 0.1, p[2]]); m.scale.set([r, 1, r]); this.G.scene.add(m); const t = { mesh: m, t: 0, d: dur, r }; this.tele.push(t); return t; }
  telegraphLine(a, dir, len, width, dur) { const m = new E.Mesh(E.box({ width, height: 0.03, depth: len }), TELE, 'Telegraph'); m.castShadow = false; const yaw = (Math.atan2(dir[0], dir[2]) * 180) / Math.PI; m.setEuler(0, yaw, 0); m.position.set([a[0] + dir[0] * len / 2, 0.1, a[2] + dir[2] * len / 2]); this.G.scene.add(m); this.tele.push({ mesh: m, t: 0, d: dur, r: 0 }); }
  hurtPlayer(n, p) { return this.G.player.hurt(n, { chill: true, from: p }); }
  ring(p, maxR, speed, dmg, jump = true) { // an expanding wave: jump it or dash through it
    const m = new E.Mesh(E.torus({ radius: 1, tube: 0.06, radialSegments: 8, tubularSegments: 64, tubeScaleY: 3 }), WAVE, 'Wave'); m.castShadow = false; m.position.set([p[0], 0.25, p[2]]); this.G.scene.add(m);
    this.things.push({ kind: 'ring', mesh: m, p: [...p], r: 1, maxR, speed, dmg, hit: false, jump });
  }
  bolt(from, dir, speed = 17, dmg = 12) {
    const m = new E.Mesh(E.cone({ radius: 0.2, height: 0.9, radialSegments: 6, heightSegments: 1 }), SHARD, 'Bolt'); m.castShadow = false; this.G.scene.add(m);
    const l = new E.Light('point', { color: '#7fd6ff', intensity: 4, range: 6 }); this.G.scene.add(l);
    this.things.push({ kind: 'bolt', mesh: m, light: l, p: [...from], v: dir.map((x) => x * speed), dmg, life: 4 });
  }
  spike(p) { // telegraph, then a spike of ice erupts
    const t = this.telegraphDisc(p, 1.7, 0.9);
    const m = new E.Mesh(E.cone({ radius: 1, height: 1, radialSegments: 7, heightSegments: 1 }), SHARD, 'Spike'); m.castShadow = false; m.visible = false; m.position.set([p[0], 0, p[2]]); this.G.scene.add(m);
    this.things.push({ kind: 'spike', mesh: m, p: [...p], t: 0, delay: 0.9, hit: false, tele: t });
  }
  falling(p, r, dmg, delay, radius = 0.5, height = 4) { // an icicle or boulder that drops on a marked spot
    this.telegraphDisc(p, r, delay);
    const m = new E.Mesh(E.cone({ radius, height, radialSegments: 6, heightSegments: 1 }), SHARD, 'Icicle'); m.castShadow = false; m.rotation.set(E.quat.fromEuler(E.quat.create(), 180, 0, 0)); m.position.set([p[0], 30, p[2]]); m.visible = false; this.G.scene.add(m);
    this.things.push({ kind: 'fall', mesh: m, p: [...p], r, dmg, t: 0, delay, height });
  }

  // ------------------------------------------------------------ attack scheduling
  pickAttack() {
    const a = this.phase === 1 ? [['bolts', 3], ['frostNova', 2], ['spikes', 2.5], ['blizzard', 2], ['blink', 1.5]] : [['smash', 3], ['boulder', 2.4], ['icicleRain', 2.4], ['charge', 2.2], ['frostBreath', 2]];
    const pool = a.filter(([n]) => n !== this.last); let w = pool.reduce((s, [, k]) => s + k, 0) * Math.random();
    for (const [n, k] of pool) { w -= k; if (w <= 0) return n; }
    return pool[0][0];
  }
  startAttack() { const n = this.pickAttack(); this.last = n; this.task = this[n](); this.wait = 0; }
  // ------------------------------------------------------------ phase 1 attacks
  *bolts() {
    const P = this.player(); this.face(P, 1);
    this.cast.playOnce('Fireball', { fadeIn: 0.08, fadeOut: 0.25, speed: 1 }); yield 0.42;
    const volleys = this.hp < this.maxHp * 0.75 ? 2 : 1;
    for (let v = 0; v < volleys; v++) {
      const P2 = this.player(), vel = this.G.player.vel(), from = this.mouth(), lead = [P2[0] + vel[0] * 0.35, P2[1] + 1.1, P2[2] + vel[2] * 0.35];
      const base = Math.atan2(lead[0] - from[0], lead[2] - from[2]), dy = (lead[1] - from[1]) / Math.max(1, hdist(lead, from));
      for (const a of [-0.22, 0, 0.22]) this.bolt(from, E.physicsMath.norm([Math.sin(base + a), dy, Math.cos(base + a)]), 17, 12);
      this.G.sfx.ice?.(0.8); this.face(P2, 1);
      if (v + 1 < volleys) { this.cast.playOnce('Fireball', { fadeIn: 0.05, fadeOut: 0.2, speed: 1.3 }); yield 0.5; }
    }
    yield 0.6;
  }
  *frostNova() {
    this.face(this.player(), 1); this.telegraphDisc(this.pos, 13, 1.2); yield 0.55;
    this.full.playOnce('Slam', { fadeIn: 0.1, fadeOut: 0.3, speed: 1 }); yield 0.68;
    this.G.shake(0.6); this.G.sfx.ice?.(1.4); this.ring(this.pos, 14, 9, 16); this.burst([this.pos[0], 0.3, this.pos[2]], 30, 6); this.G.destruct.damage(this.pos, 4, 40);
    yield 0.9;
  }
  *spikes() {
    this.face(this.player(), 1); this.cast.playOnce('Phoenix', { fadeIn: 0.1, fadeOut: 0.3, speed: 1.2 }); yield 0.75;
    for (let i = 0; i < 7; i++) { const P = this.player(), v = this.G.player.vel(); this.spike([P[0] + v[0] * 0.6, 0, P[2] + v[2] * 0.6]); if (i < 2) this.spike([P[0] + (Math.random() - 0.5) * 6, 0, P[2] + (Math.random() - 0.5) * 6]); this.G.sfx.ice?.(0.6); yield 0.4; }
    yield 1.0;
  }
  *blizzard() {
    this.face(this.player(), 1); this.cast.play('Flamethrower', { fade: 0.2, restart: true }); yield 0.5;
    this.beam = { t: 2.6, range: 15, half: 0.24, dps: 30, tick: 0, dir: this.yaw, turn: 0.75 }; this.G.sfx.ice?.(1);
    yield 2.7; this.beam = null; this.cast.setWeights({}, 0.3); yield 0.8;
  }
  *blink() {
    this.burst([this.pos[0], 1.2, this.pos[2]], 30, 5); this.hidden = true; this.mage.visible = false; yield 0.35;
    const P = this.player(), a = Math.random() * Math.PI * 2, d = 11;
    let x = P[0] + Math.sin(a) * d, z = P[2] + Math.cos(a) * d; const r = Math.hypot(x, z), lim = ARENA_RADIUS - 3; if (r > lim) { x *= lim / r; z *= lim / r; }
    this.pos = [x, 0, z]; this.face(P, 1); this.hidden = false; this.mage.visible = true; this.burst([x, 1.2, z], 40, 6); this.G.sfx.ice?.(1.2);
    yield 0.35; yield* this.bolts();
  }
  // ------------------------------------------------------------ phase 2 attacks
  arms(rx, rz, elbow, dur) {
    const s = this.colossus.st, a0 = [...s.armR], b0 = [...s.armL], e0 = s.elbowR, f0 = s.elbowL;
    this.tween(dur, (k) => { const e = easeIO(k); s.armR = [lerp(a0[0], rx, e), lerp(a0[1], rz, e)]; s.armL = [lerp(b0[0], rx, e), lerp(b0[1], rz, e)]; s.elbowR = lerp(e0, elbow, e); s.elbowL = lerp(f0, elbow, e); });
  }
  *smash() {
    const P = this.player(); this.face(P, 1);
    const f = this.fwd(), target = [this.pos[0] + f[0] * 6.5, 0, this.pos[2] + f[2] * 6.5];
    this.arms(-165, 8, 30, 0.9); this.colossus.st.headPitch = 0; this.telegraphDisc(target, 5.5, 1.35); yield 1.3;
    this.arms(-20, 0, 20, 0.16); yield 0.16;
    this.G.shake(1); this.G.sfx.boom?.(1.4); this.burst([target[0], 0.5, target[2]], 45, 8);
    if (hdist(this.player(), target) < 5.5) this.hurtPlayer(30, target);
    this.ring(target, 15, 10, 16); this.G.destruct.damage(target, 8, 130);
    this.G.destruct.burst([target[0], 0.6, target[2]], 0.5, COLOSSUS_MATERIALS.ice, { count: 16, power: 7, from: [target[0], -0.5, target[2]] });
    yield 0.9; this.arms(0, 0, 0, 0.5); yield 0.5;
  }
  *boulder() {
    const P = this.player(); this.face(P, 1);
    const b = new E.Mesh(E.sphere({ radius: 1.4, widthSegments: 16, heightSegments: 12 }), COLOSSUS_MATERIALS.ice, 'Boulder'); this.G.scene.add(b);
    this.arms(-150, 20, 60, 0.8); this.tween(0.8, (k) => { b.position.set([this.pos[0] + this.fwd()[0] * 1.5, lerp(2, 9.6, easeIO(k)), this.pos[2] + this.fwd()[2] * 1.5]); }); yield 0.9;
    const v = this.G.player.vel(), tgt = [P[0] + v[0] * 1.2, 0, P[2] + v[2] * 1.2];
    const r = Math.hypot(tgt[0], tgt[2]), lim = ARENA_RADIUS - 2; if (r > lim) { tgt[0] *= lim / r; tgt[2] *= lim / r; }
    this.telegraphDisc(tgt, 4.6, 1.3); this.arms(-40, 0, 10, 0.18);
    const from = [b.position[0], b.position[1], b.position[2]], dur = 1.25;
    this.things.push({ kind: 'boulder', mesh: b, from, to: tgt, t: 0, dur, dmg: 28 }); yield dur + 0.2; this.arms(0, 0, 0, 0.5); yield 0.9;
  }
  *icicleRain() {
    this.face(this.player(), 1); this.arms(-140, 60, 40, 0.7); this.colossus.st.headPitch = -25; this.G.sfx.roar?.(); yield 0.8;
    for (let i = 0; i < 16; i++) { const P = this.player(), v = this.G.player.vel(), a = Math.random() * Math.PI * 2, d = i < 4 ? 0.5 : Math.random() * 9; let x = P[0] + v[0] * 0.8 + Math.sin(a) * d, z = P[2] + v[2] * 0.8 + Math.cos(a) * d; const rr = Math.hypot(x, z), lim = ARENA_RADIUS - 1.5; if (rr > lim) { x *= lim / rr; z *= lim / rr; } this.falling([x, 0, z], 1.6, 16, 1.05); yield 0.13; }
    this.colossus.st.headPitch = 0; yield 1.3; this.arms(0, 0, 0, 0.5); yield 0.6;
  }
  *charge() {
    const P = this.player(); this.face(P, 1); let dir = this.fwd();
    this.colossus.st.lean = 0; this.tween(0.9, (k) => { this.colossus.st.crouch = 0.7 * easeIO(k); this.colossus.st.lean = 22 * easeIO(k); });
    this.telegraphLine(this.pos, dir, 28, 4.4, 1.0); this.G.sfx.roar?.(); yield 1.0;
    let t = 0, hit = false, wall = false, accT = 0; this.speed = 22;
    while (t < 1.7) {
      const dt = this._dt; t += dt; accT += dt;
      this.pos[0] += dir[0] * 22 * dt; this.pos[2] += dir[2] * 22 * dt;
      if (hdist(this.player(), this.pos) < 3.0 && !hit && this.hurtPlayer(32, this.pos)) hit = true;
      if (accT > 0.06) { accT = 0; this.G.destruct.damage([this.pos[0] + dir[0] * 2, 1.5, this.pos[2] + dir[2] * 2], 4, 90); this.mist([this.pos[0], 0.4, this.pos[2]], 5, 0.7, 2, 0.5); }
      this.G.shake(0.3);
      if (Math.hypot(this.pos[0], this.pos[2]) > ARENA_RADIUS - 3.6) { wall = true; break; }
      yield 0;
    }
    this.speed = 0; this.tween(0.5, (k) => { this.colossus.st.lean = lerp(22, wall ? -12 : 0, k); this.colossus.st.crouch = lerp(0.7, wall ? 0.5 : 0, k); });
    if (wall) { this.G.shake(1); this.G.sfx.boom?.(1.6); this.burst([this.pos[0], 3, this.pos[2]], 60, 8); this.G.destruct.burst([this.pos[0] + dir[0] * 3, 3, this.pos[2] + dir[2] * 3], 0.6, COLOSSUS_MATERIALS.ice, { count: 22, power: 8, from: this.pos }); this.stun = 2.6; this.G.feed('The Colossus is stunned!'); this.colossus.st.headPitch = 25; }
    else this.stun = 0.8;
    yield this.stun; this.stun = 0; this.colossus.st.headPitch = 0;
    this.tween(0.4, (k) => { this.colossus.st.lean = lerp(this.colossus.st.lean, 0, k); this.colossus.st.crouch = lerp(this.colossus.st.crouch, 0, k); }); yield 0.5;
  }
  *frostBreath() {
    this.face(this.player(), 1); this.arms(-30, 30, 50, 0.6); this.tween(0.6, (k) => { this.colossus.st.headPitch = -30 * easeIO(k); }); yield 0.7;
    this.beam = { t: 3, range: 22, half: 0.3, dps: 34, tick: 0, dir: this.yaw, turn: 0.55, big: true }; this.tween(0.3, (k) => { this.colossus.st.headPitch = lerp(-30, 12, k); }); this.G.sfx.ice?.(1.4);
    yield 3.1; this.beam = null; this.tween(0.5, (k) => { this.colossus.st.headPitch = lerp(12, 0, k); }); this.arms(0, 0, 0, 0.5); yield 0.9;
  }

  // ------------------------------------------------------------ cutscenes
  show() { this.hidden = false; if (this.phase === 1) this.mage.visible = true; else this.colossus.root.visible = true; }
  *intro(c) {
    const G = this.G, pl = G.player, B = this;
    G.hud.show(false); B.hidden = true; B.mage.visible = false; pl.freeze(true); pl.teleport([0, 0.15, -22], 0);
    c.title('THE FROZEN SANCTUM', 'Summit of the Eternal Winter');
    c.shot({ pos: [-36, 26, -30], look: [0, 2, 0] }, { pos: [34, 14, -28], look: [0, 3, 4] }, 4.4); yield 4.4; c.title();
    c.tween(3.8, (k) => pl.puppet([0, 0.15, -22 + 11 * k], 0, 3.0));
    c.shot({ pos: () => [1.3, 1.6, pl.pos()[2] - 4.4], look: () => [0, 1.6, pl.pos()[2] + 3] }, { pos: () => [1.5, 1.2, pl.pos()[2] - 3], look: () => [0, 1.9, pl.pos()[2] + 5] }, 3.8); yield 3.8;
    pl.puppet([0, 0.15, -11], 0, 0);
    // he drops from the sky
    B.pos = [0, 0, 7]; B.yaw = Math.PI; B.y = 32; B.show(); B.mage.mixer.play('Jump', { fade: 0, restart: true });
    c.shot({ pos: [7, 1.0, -3], look: [0, 3.5, 6] }, { pos: [4.5, 0.8, -2.5], look: [0, 2.2, 7] }, 1.6);
    B.tween(0.9, (k) => { B.y = lerp(32, 0, easeIn(k)); });
    yield 0.9; B.y = 0; G.shake(1); G.sfx.boom?.(1.4); B.burst([0, 0.4, 7], 70, 9); B.ring([0, 0, 7], 8, 12, 0); B.full.playOnce('Slam', { fadeIn: 0.05, fadeOut: 0.4, speed: 1 }); B.mage.mixer.setWeights({ Idle: 1 }, 0.2);
    yield 1.0;
    c.title('ICE MAGE', 'Lord of the Frozen Sanctum');
    c.shot({ pos: [3, 1.2, 1.5], look: [0, 2.0, 7] }, { pos: [2, 1.9, 2.4], look: [0, 2.2, 7] }, 3.6); B.cast.playOnce('Point', { fadeIn: 0.15, fadeOut: 0.4, speed: 1 });
    c.caption('ICE MAGE', 'A spark climbs my mountain. How amusing.'); yield 2.6; c.title(); yield 1.0;
    c.shot({ pos: () => [pl.pos()[0] + 0.9, 1.75, pl.pos()[2] + 1.9], look: () => [pl.pos()[0], 1.6, pl.pos()[2]] }, { pos: () => [pl.pos()[0] + 0.55, 1.7, pl.pos()[2] + 1.3], look: () => [pl.pos()[0], 1.65, pl.pos()[2]] }, 3.0);
    pl.flare(); c.caption('FIRE MAGE', 'Then let us see which of us burns brighter.'); yield 3.0;
    c.caption();
    c.shot({ pos: [-16, 5, -19], look: [0, 2, -2] }, { pos: [-13, 3.5, -16], look: [0, 2, 0] }, 1.6); yield 1.6;
  }
  beginIntro(done) { this.G.cutscene.start((c) => this.intro(c), () => { this.G.hud.show(true); this.G.player.freeze(false); this.active = true; this.hidden = false; this.mage.visible = true; this.y = 0; this.wait = 1.4; this.G.hud.boss(this); this.G.hud.banner('ICE MAGE'); done?.(); }); }
  skipToFight() { this.pos = [0, 0, 7]; this.show(); this.y = 0; }

  beginTransform() {
    this.active = false; this.task = null; this.beam = null; this.cast.setWeights({}, 0.1); this.stun = 0;
    this.G.cutscene.start((c) => this.transform(c), () => {
      this.phase = 2; this.active = true; this.hidden = false; this.mage.visible = false; this.colossus.root.visible = true; this.colossus.root.scale.set([1, 1, 1]);
      this.G.hud.show(true); this.G.player.freeze(false); this.G.player.heal(30); this.G.player.refill(60); this.wait = 1.6; this.G.hud.boss(this); this.G.hud.banner('ICE COLOSSUS');
    });
  }
  *transform(c) {
    const G = this.G, B = this, pl = G.player;
    G.hud.show(false); pl.freeze(true); B.clearThreats();
    B.mage.mixer.setWeights({ Idle: 1 }, 0.1); B.full.playOnce('Stagger', { fadeIn: 0.2, fadeOut: 0.5, speed: 1 });
    c.shot({ pos: () => [B.pos[0] + 3.4, 1.5, B.pos[2] - 3.6], look: () => [B.pos[0], 1.2, B.pos[2]] }, { pos: () => [B.pos[0] + 2.6, 1.3, B.pos[2] - 2.8], look: () => [B.pos[0], 1.0, B.pos[2]] }, 3.4);
    B.burst([B.pos[0], 1.2, B.pos[2]], 20, 4); c.caption('ICE MAGE', 'Impossible... a mere ember?'); yield 2.6;
    c.caption('ICE MAGE', 'Enough games. Winter endures!'); yield 2.0; c.caption();
    // rise and roar; shards orbit and the floor freezes over
    B.full.playOnce('Roar', { fadeIn: 0.3, fadeOut: 0.3, speed: 1 });
    const orb = []; for (let i = 0; i < 16; i++) { const m = new E.Mesh(E.cone({ radius: 0.16, height: 0.8, radialSegments: 5, heightSegments: 1 }), SHARD, 'Orbit shard'); m.castShadow = false; G.scene.add(m); orb.push({ m, a: (i / 16) * Math.PI * 2, h: 0.4 + (i % 4) * 0.6 }); }
    const frost = new E.Mesh(E.torus({ radius: 1, tube: 0.05, radialSegments: 8, tubularSegments: 64, tubeScaleY: 1.5 }), WAVE, 'Frost wave'); frost.position.set([B.pos[0], 0.2, B.pos[2]]); G.scene.add(frost);
    c.shot({ pos: () => [B.pos[0] + 6, 1.0, B.pos[2] - 6.5], look: () => [B.pos[0], 2.8, B.pos[2]] }, { pos: () => [B.pos[0] + 3.5, 0.7, B.pos[2] - 8.5], look: () => [B.pos[0], 4.2, B.pos[2]] }, 4.6);
    let spin = 0;
    B.tween(4.6, (k, dt) => { spin += 0.02 + k * 0.12; const r = lerp(1.6, 4.4, k); orb.forEach((o, i) => { o.m.position.set([B.pos[0] + Math.sin(o.a + spin) * r, o.h + k * 3.2, B.pos[2] + Math.cos(o.a + spin) * r]); o.m.setEuler(0, ((o.a + spin) * 180) / Math.PI, 20); }); const fr = 1 + k * 30; frost.scale.set([fr, 1, fr]); if (Math.random() < 0.6) B.mist([B.pos[0] + (Math.random() - 0.5) * 6, 0.3, B.pos[2] + (Math.random() - 0.5) * 6], 4, 0.7, 3, 1.5); G.shake(0.15 + 0.35 * k); });
    c.caption('ICE MAGE', 'Become ice... and be shattered!'); yield 3.0; c.caption(); yield 1.6;
    // the cocoon closes, the Colossus tears out of it
    const cocoon = new E.Mesh(E.sphere({ radius: 1, widthSegments: 20, heightSegments: 14 }), COLOSSUS_MATERIALS.deep, 'Cocoon'); cocoon.position.set([B.pos[0], 1.2, B.pos[2]]); G.scene.add(cocoon);
    c.shot({ pos: [B.pos[0] - 9, 3.0, B.pos[2] - 12], look: [B.pos[0], 3.4, B.pos[2]] }, { pos: [B.pos[0] - 6, 2.4, B.pos[2] - 16], look: [B.pos[0], 4.0, B.pos[2]] }, 2.6);
    B.tween(1.6, (k) => { const s = 0.6 + easeIO(k) * 3.4; cocoon.scale.set([s, s * 1.3, s]); orb.forEach((o) => { o.m.scale.set([Math.max(0.01, 1 - k), Math.max(0.01, 1 - k), Math.max(0.01, 1 - k)]); }); G.shake(0.3 + k * 0.5); });
    yield 1.6; B.mage.visible = false; B.phase = 2; B.colossus.root.visible = true; B.colossus.root.position.set([B.pos[0], 0, B.pos[2]]); B.colossus.root.rotation.set(E.quat.fromEuler(E.quat.create(), 0, (B.yaw * 180) / Math.PI, 0));
    G.scene.remove(cocoon); orb.forEach((o) => G.scene.remove(o.m)); G.scene.remove(frost);
    G.shake(1); G.sfx.boom?.(1.6); B.burst([B.pos[0], 3, B.pos[2]], 90, 11); G.destruct.burst([B.pos[0], 3, B.pos[2]], 0.5, COLOSSUS_MATERIALS.ice, { count: 30, power: 10, from: [B.pos[0], 1, B.pos[2]] });
    G.destruct.damage(B.pos, 9, 140);
    B.arms(0, 0, 0, 0.1); B.tween(1.6, (k) => { const s = 0.25 + 0.75 * easeOut(k); B.colossus.root.scale.set([s, s, s]); });
    yield 1.7; B.colossus.st.headPitch = -22; B.arms(-55, 55, 40, 0.8); G.sfx.roar?.();
    c.title('ICE COLOSSUS', 'The winter takes form');
    c.shot({ pos: () => [B.pos[0] + 5, 1.2, B.pos[2] - 11], look: () => [B.pos[0], 5.5, B.pos[2]] }, { pos: () => [B.pos[0] + 2.5, 0.8, B.pos[2] - 9], look: () => [B.pos[0], 6.6, B.pos[2]] }, 3.4); G.shake(0.6); yield 3.2;
    c.title(); B.arms(0, 0, 0, 0.6); B.colossus.st.headPitch = 0; yield 0.6;
    c.shot({ pos: [-14, 6, -18], look: [B.pos[0], 3, B.pos[2]] }, { pos: [-11, 4, -15], look: [B.pos[0], 3, B.pos[2]] }, 1.4); yield 1.4;
  }
  beginVictory() {
    this.active = false; this.dead = true; this.task = null; this.beam = null;
    this.G.cutscene.start((c) => this.victory(c), () => { this.G.hud.show(true); this.G.onVictory(); });
  }
  *victory(c) {
    const G = this.G, B = this;
    G.hud.show(false); G.player.freeze(true); B.clearThreats(); B.colossus.st.headPitch = 20; B.colossus.st.crouch = 0.6; B.stun = 0;
    c.shot({ pos: () => [B.pos[0] + 5, 3, B.pos[2] - 12], look: () => [B.pos[0], 4, B.pos[2]] }, { pos: () => [B.pos[0] + 8, 3.5, B.pos[2] - 9], look: () => [B.pos[0], 4.5, B.pos[2]] }, 3.4);
    B.tween(2.2, (k) => { B.cy = -k * 0.6; B.jit = 0.25 * k; B.flashT = 0.1; if (Math.random() < 0.5) B.glint(B.center(), 6, 5); G.shake(0.2 + k * 0.5); });
    yield 2.2; G.sfx.boom?.(1.6); G.shake(1);
    B.burst(B.center(), 120, 14); G.destruct.burst(B.center(), 1.0, COLOSSUS_MATERIALS.ice, { count: 70, power: 13, from: [B.pos[0], 0.5, B.pos[2]] }); G.destruct.damage(B.pos, 10, 200);
    B.colossus.root.visible = false; B.hidden = true;
    c.title('VICTORY', 'The winter melts away'); c.shot({ pos: [B.pos[0] + 7, 3.2, B.pos[2] - 9], look: [B.pos[0], 2.6, B.pos[2]] }, { pos: [B.pos[0] + 12, 5, B.pos[2] - 4], look: [B.pos[0], 2.2, B.pos[2]] }, 4.6); yield 4.6; c.title();
  }
  flush() { for (const t of this.tw) t.fn(1, 0); this.tw = []; }
  clearThreats() { for (const t of this.tele) this.G.scene.remove(t.mesh); this.tele.length = 0; for (const th of this.things) this.dropThing(th); this.things.length = 0; this.beam = null; }
  dropThing(th) { this.G.scene.remove(th.mesh); if (th.light) this.G.scene.remove(th.light); if (th.tele) { this.G.scene.remove(th.tele.mesh); this.tele.splice(this.tele.indexOf(th.tele), 1); } }

  // ------------------------------------------------------------ per-frame
  update(dt) {
    this._dt = dt; this.time += dt; const G = this.G;
    for (let i = this.tw.length - 1; i >= 0; i--) { const t = this.tw[i]; t.t += dt; const k = Math.min(1, t.t / t.d); t.fn(k, dt); if (k >= 1) this.tw.splice(i, 1); }
    // telegraph markers pulse and expire
    for (let i = this.tele.length - 1; i >= 0; i--) { const t = this.tele[i]; t.t += dt; const k = t.t / t.d; t.mesh.position.y = 0.1 + 0.01 * Math.sin(t.t * 20); if (t.r) { const s = t.r * (0.94 + 0.06 * Math.sin(t.t * 16)); t.mesh.scale.set([s, 1, s]); } if (k >= 1) { G.scene.remove(t.mesh); this.tele.splice(i, 1); } }
    this.updateThings(dt); this.updateBeam(dt);
    if (this.flashT > 0) this.flashT -= dt;
    const flashing = this.flashT > 0;
    COLOSSUS_MATERIALS.ice.emissive = flashing ? '#ff9a5a' : '#2a7fb8'; COLOSSUS_MATERIALS.ice.emissiveStrength = flashing ? 2.4 : 0.9;
    for (const k of ['robe', 'robeDark', 'skin']) { const m = this.mage.materials.get(k); if (m) { m.emissive = flashing ? '#ff9a5a' : '#000000'; m.emissiveStrength = flashing ? 1.6 : 0; } }
    if (this.active && !this.dead) {
      if (this.task) { this.wait -= dt; while (this.wait <= 0 && this.task) { const r = this.task.next(); if (r.done) { this.task = null; this.wait = this.phase === 1 ? 0.6 + Math.random() * 0.9 : 0.5 + Math.random() * 0.7; break; } this.wait = r.value ?? 0; } }
      else { this.wait -= dt; this.idleMove(dt); if (this.wait <= 0) this.startAttack(); }
    } else if (!this.active && !this.dead) this.speed = 0;
    this.present(dt);
  }
  idleMove(dt) {
    const P = this.player(), d = hdist(P, this.pos); this.face(P, Math.min(1, dt * 6));
    const dir = this.fwd(), side = [dir[2], 0, -dir[0]];
    let fw = 0, sd = 0;
    if (this.phase === 1) { if (d > 14) fw = 4.2; else if (d < 8) fw = -3.4; else sd = 1.5; } else if (d > 8) fw = 3.4;
    this.pos[0] += (dir[0] * fw + side[0] * sd) * dt; this.pos[2] += (dir[2] * fw + side[2] * sd) * dt; this.speed = Math.hypot(fw, sd);
    const r = Math.hypot(this.pos[0], this.pos[2]), lim = ARENA_RADIUS - (this.phase === 1 ? 2 : 4); if (r > lim) { this.pos[0] *= lim / r; this.pos[2] *= lim / r; }
  }
  present(dt) {
    if (this.phase === 1) {
      const m = this.mage; m.position.set([this.pos[0], this.y, this.pos[2]]); m.setEuler(0, (this.yaw * 180) / Math.PI, 0);
      if (!this.dead && !this.hidden) { const sp = this.G.cutscene.active && this.y > 0.1 ? 0 : this.speed; this.loco.mixer.setWeights({ ...this.loco.weights(sp), Jump: this.y > 0.3 ? 1 : 0 }, 0.15); }
      m.update(dt); this.light.position.set([this.pos[0], this.y + 2.4, this.pos[2]]); this.light.intensity = this.hidden ? 0 : 5;
    } else {
      const c = this.colossus, r = c.root, j = this.jit || 0;
      r.position.set([this.pos[0] + (Math.random() - 0.5) * j, this.cy || 0, this.pos[2]]);
      r.rotation.set(E.quat.fromEuler(E.quat.create(), 0, (this.yaw * 180) / Math.PI, 0));
      c.st.walk += dt * this.speed * 1.05; c.st.amp += (Math.min(1, this.speed / 3) - c.st.amp) * Math.min(1, dt * 8);
      c.pose(this.time); this.light.position.set([this.pos[0], 5, this.pos[2]]); this.light.intensity = this.hidden ? 0 : 12; this.light.range = 22;
    }
  }
  updateThings(dt) {
    const G = this.G, P = this.player();
    for (let i = this.things.length - 1; i >= 0; i--) {
      const th = this.things[i]; let done = false;
      if (th.kind === 'ring') {
        th.r += th.speed * dt; th.mesh.scale.set([th.r, 2.2, th.r]);
        for (let n = 0; n < 6; n++) { const a = Math.random() * Math.PI * 2; this.glint([th.p[0] + Math.sin(a) * th.r, 0.3, th.p[2] + Math.cos(a) * th.r], 1, 1.5); }
        if (Math.random() < 0.7) { const a = Math.random() * Math.PI * 2; this.mist([th.p[0] + Math.sin(a) * th.r, 0.2, th.p[2] + Math.cos(a) * th.r], 1, 0.6, 0.6, 0.6); }
        if (!th.hit && th.dmg > 0 && Math.abs(hdist(P, th.p) - th.r) < 0.9 && G.player.y() < 0.9) { th.hit = true; this.hurtPlayer(th.dmg, th.p); }
        if (th.r >= th.maxR) done = true;
      } else if (th.kind === 'bolt') {
        th.life -= dt; const len = Math.hypot(...th.v) * dt, dir = E.physicsMath.norm(th.v);
        const hit = G.ray(th.p, dir, len + 0.2);
        th.p = E.physicsMath.madd(th.p, dir, len); th.mesh.position.set(th.p); th.light.position.set(th.p);
        th.mesh.rotation.set(E.quat.rotationTo(E.quat.create(), [0, 1, 0], dir.map((x) => -x)));
        this.glint(th.p, 2, 0.6); this.mist(th.p, 1, 0.25, 0.3, 0.1);
        if (Math.hypot(P[0] - th.p[0], P[1] + 1.0 - th.p[1], P[2] - th.p[2]) < 0.9 && this.hurtPlayer(th.dmg, th.p)) { this.burst(th.p, 14, 3); done = true; }
        else if (hit || th.life <= 0) { this.burst(th.p, 14, 3); G.destruct.damage(th.p, 1.8, 26); G.world.explode(th.p, 2.5, 2); done = true; }
      } else if (th.kind === 'spike') {
        th.t += dt;
        if (th.t >= th.delay) {
          const k = th.t - th.delay; th.mesh.visible = true;
          const h = k < 0.14 ? lerp(0.1, 3.4, k / 0.14) : k < 0.9 ? 3.4 : lerp(3.4, 0.1, (k - 0.9) / 0.35), s = 0.95;
          th.mesh.scale.set([s, h, s]); th.mesh.position.set([th.p[0], h / 2, th.p[2]]);
          if (!th.hit && k < 0.5 && hdist(P, th.p) < 1.7 && G.player.y() < 2.3) { th.hit = true; this.hurtPlayer(18, th.p); }
          if (k > 0 && k < dt + 0.001) { this.burst([th.p[0], 0.3, th.p[2]], 14, 4); G.destruct.damage(th.p, 2, 30); G.sfx.ice?.(0.7); }
          if (k > 1.25) done = true;
        }
      } else if (th.kind === 'fall') {
        th.t += dt;
        if (th.t >= th.delay - 0.3) { const k = (th.t - (th.delay - 0.3)) / 0.3; th.mesh.visible = true; th.mesh.position.set([th.p[0], lerp(24, th.height / 2, Math.min(1, easeIn(k))), th.p[2]]); }
        if (th.t >= th.delay) { this.burst([th.p[0], 0.4, th.p[2]], 18, 5); G.destruct.damage(th.p, th.r + 1, 45); G.sfx.ice?.(0.9); G.shake(0.25); if (hdist(P, th.p) < th.r && G.player.y() < 2) this.hurtPlayer(th.dmg, th.p); done = true; }
      } else if (th.kind === 'boulder') {
        th.t += dt; const k = Math.min(1, th.t / th.dur);
        th.mesh.position.set([lerp(th.from[0], th.to[0], k), lerp(th.from[1], 1.3, k) + Math.sin(k * Math.PI) * 9, lerp(th.from[2], th.to[2], k)]); th.mesh.setEuler(k * 400, k * 300, 0);
        if (Math.random() < 0.6) this.mist(th.mesh.position, 1, 0.7, 0.5, 0.2);
        if (k >= 1) { this.burst([th.to[0], 0.6, th.to[2]], 60, 9); G.shake(0.9); G.sfx.boom?.(1.2); if (hdist(P, th.to) < 4.6 && G.player.y() < 2) this.hurtPlayer(th.dmg, th.to); G.destruct.damage(th.to, 6, 110); G.world.explode([th.to[0], 0.4, th.to[2]], 7, 10); G.destruct.burst([th.to[0], 0.8, th.to[2]], 0.5, COLOSSUS_MATERIALS.ice, { count: 16, power: 8, from: [th.to[0], -0.5, th.to[2]] }); this.ring(th.to, 9, 9, 10); done = true; }
      }
      if (done) { this.dropThing(th); this.things.splice(i, 1); }
    }
  }
  updateBeam(dt) {
    const b = this.beam; if (!b) return;
    b.t -= dt; const P = this.player(), from = this.mouth();
    // the stream slowly swings toward you: strafe out of it or dash through
    const want = Math.atan2(P[0] - this.pos[0], P[2] - this.pos[2]); let a = want - b.dir; while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2;
    b.dir += Math.max(-b.turn * dt, Math.min(b.turn * dt, a)); this.yaw = b.dir;
    const d = [Math.sin(b.dir), (this.phase === 1 ? -0.02 : -0.22), Math.cos(b.dir)];
    const n = b.big ? 26 : 14;
    for (let i = 0; i < n; i++) { const s = 8 + Math.random() * 9, sp = (b.big ? 0.22 : 0.14) * (0.5 + Math.random()); this.G.fire.smoke.emit(from, { count: 1, color: [0.85, 0.94, 1, 0.5], colorEnd: [0.9, 0.97, 1, 0.05], size: 0.22, grow: b.big ? 9 : 6, spread: 0.2, up: 0, vel: [d[0] * s + (Math.random() - 0.5) * s * sp, d[1] * s + (Math.random() - 0.5) * s * sp * 0.4 + 0.4, d[2] * s + (Math.random() - 0.5) * s * sp], buoyancy: 0, life: b.range / s, jitter: 0.1 }); }
    this.glint(from, 3, 1);
    b.tick -= dt;
    if (b.tick <= 0) {
      b.tick = 0.25;
      const to = [P[0] - from[0], 0, P[2] - from[2]], dist = Math.hypot(to[0], to[2]);
      const ang = Math.abs(Math.atan2(to[0], to[2]) - b.dir); const wrapped = Math.min(ang, Math.PI * 2 - ang);
      if (dist < b.range && wrapped < b.half + 0.05 && this.G.player.y() < 2.2) this.hurtPlayer(b.dps * 0.25, from);
      for (let r = 3; r < b.range; r += 4) this.G.destruct.damage([from[0] + d[0] * r, 1, from[2] + d[2] * r], 2, 10);
    }
  }
}
