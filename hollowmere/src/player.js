// The player: first-person movement, stealth (light, noise, crouching), the sword (three-hit
// combo, thrust, block and parry), three Ember skills, lockpicking and carrying things.
import * as E from '../../engine/index.js';
import { createViewmodel, VM } from './viewmodel.js';
import { Inventory } from './items.js';

const D2R = Math.PI / 180;
const clamp = E.clamp;
export const EYE_STAND = 1.62, EYE_CROUCH = 1.06;

export class Player {
  constructor(game, spawn) {
    this.g = game;
    this.cc = new E.CharacterController(game.world, { position: [...spawn], radius: 0.32, height: 1.8, stepHeight: 0.38, maxSlope: 55, mask: 0xffff & ~4 });
    this.cc.body.userData.player = true; this.cc.body.group = 2;
    this.yaw = 0; this.pitch = 0; this.dYaw = 0; this.dPitch = 0;
    this.hp = 120; this.maxHp = 120; this.stamina = 100; this.ember = 60; this.maxEmber = 100;
    this.eye = EYE_STAND; this.crouch = false; this.sprint = false; this.speedNow = 0;
    this.bobT = 0; this.bobY = 0; this.kick = 0; this.recoil = 0; this.sway = [0, 0];
    this.inv = new Inventory(); this.inv.add('lockpick', 3); this.inv.add('potion', 1); this.inv.add('ember', 1);
    this.atk = null; this.queued = false; this.combo = 0; this.comboT = 0; this.blocking = false; this.blockT = 0; this.stagger = 0;
    this.veilT = 0; this.dashT = 0; this.dashDir = [0, 0]; this.cool = { veil: 0, dash: 0, slam: 0, kick: 0 }; this.riposteT = 0;
    this.carried = null; this.carryDist = 1.7; this.picking = null;
    this.lightLevel = 0.3; this.visibility = 0.3; this.hurtT = 0; this.dead = false; this.invuln = 0;
    this.stepDist = 0; this.airT = 0; this.wasGrounded = true; this.fallV = 0;
    this.lmb = false; this.rmb = false; this.lmbPress = false; this.usePress = false; this.useHeld = false;
    this.vm = createViewmodel(); this.vm.visible = true; game.scene.add(this.vm);
    this.vm.mixer.on((e) => this.onVmEvent(e));
    this.fill = new E.Light('point', { color: '#a08ad8', intensity: 2.2, range: 3.2 }); game.scene.add(this.fill);
    this.vmClip = 'Idle';
  }
  get pos() { return this.cc.position; }
  get eyePos() { return [this.cc.position[0], this.cc.position[1] + this.eye + this.bobY, this.cc.position[2]]; }
  get forward() { const cp = Math.cos(this.pitch); return [Math.sin(this.yaw) * cp, Math.sin(this.pitch), Math.cos(this.yaw) * cp]; }
  get flat() { return [Math.sin(this.yaw), Math.cos(this.yaw)]; }
  basis() {
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw), cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const f = [sy * cp, sp, cy * cp], left = [cy, 0, -sy];
    return { f, left, up: [f[1] * left[2] - f[2] * left[1], f[2] * left[0] - f[0] * left[2], f[0] * left[1] - f[1] * left[0]] };
  }
  playVm(name, fade = 0.08, restart = true) { this.vm.play(name, { fade, restart }); this.vmClip = name; }
  onVmEvent(e) { if (e.name === 'hit') this.resolveHit(); if (e.name === 'slam') this.g.gravebreak(); }

  // ------------------------------------------------------------ per-frame
  update(dt, input) {
    const g = this.g;
    if (this.dead) { this.speedNow = 0; return; }
    this.riposteT = Math.max(0, this.riposteT - dt);
    this.hurtT = Math.max(0, this.hurtT - dt); this.invuln = Math.max(0, this.invuln - dt); this.stagger = Math.max(0, this.stagger - dt);
    for (const k in this.cool) this.cool[k] = Math.max(0, this.cool[k] - dt);
    // ---- look
    this.yaw += input.dYaw; this.pitch = clamp(this.pitch + input.dPitch, -1.5, 1.5); this.dYaw = input.dYaw; this.dPitch = input.dPitch;
    input.dYaw = input.dPitch = 0;
    // ---- stance
    const wantCrouch = input.keys.has('c') || input.keys.has('control');
    if (wantCrouch !== this.crouch) this.setCrouch(wantCrouch);
    // ---- movement
    const k = input.keys;
    let ix = (k.has('a') ? 1 : 0) - (k.has('d') ? 1 : 0), iz = (k.has('w') ? 1 : 0) - (k.has('s') ? 1 : 0);
    const moving = !!(ix || iz);
    this.sprint = k.has('shift') && iz > 0 && !this.crouch && this.stamina > 4 && !this.blocking && !this.carried && !this.atk;
    let speed = this.crouch ? 1.7 : this.sprint ? 5.8 : 3.5;
    if (this.blocking) speed *= 0.55; if (this.carried) speed *= 0.6; if (this.g.tools?.dragging) speed *= 0.5; if (this.atk) speed *= 0.6; if (this.stagger > 0) speed *= 0.3; if (this.picking) speed = 0;
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw), lx = Math.cos(this.yaw), lz = -Math.sin(this.yaw);
    let wish = [0, 0];
    if (moving) { const d = [fx * iz + lx * ix, fz * iz + lz * ix], l = Math.hypot(d[0], d[1]); wish = [(d[0] / l) * speed, (d[1] / l) * speed]; }
    if (this.dashT > 0) { this.dashT -= dt; wish = [this.dashDir[0] * 15, this.dashDir[1] * 15]; this.cc.velocity[0] = wish[0]; this.cc.velocity[2] = wish[1]; }
    if (k.has(' ') && !this.crouch && this.stamina > 6) { if (this.cc.grounded) { this.cc.jump(4.5); this.stamina -= 6; g.sfx.jump?.(); g.noise(this.pos, 4, 'jump'); } }
    this.cc.move(wish, dt);
    if (this.cc.position[1] < -20 || !isFinite(this.cc.position[1])) this.respawnNear();
    this.speedNow = Math.hypot(this.cc.velocity[0], this.cc.velocity[2]);
    // landing
    if (this.cc.grounded && !this.wasGrounded && this.fallV < -6) { const dmg = Math.max(0, (-this.fallV - 8) * 9); if (dmg > 0) this.hurt(dmg, null, { fall: true }); g.noise(this.pos, clamp(-this.fallV * 1.6, 4, 16), 'land'); g.sfx.thud?.(0.8); this.kick = 0.05; }
    this.fallV = this.cc.velocity[1]; this.wasGrounded = this.cc.grounded;
    // stamina & footsteps
    if (this.sprint && this.speedNow > 3) this.stamina = Math.max(0, this.stamina - dt * 11 * (this.mod?.sprintCost ?? 1)); else this.stamina = Math.min(100, this.stamina + dt * (this.blocking || this.atk ? 5 : 20) * (this.mod?.stam ?? 1));
    if (this.stamina <= 0.5 && this.sprint) this.sprint = false;
    if (this.cc.grounded && this.speedNow > 0.4) {
      this.stepDist += this.speedNow * dt;
      const stride = this.sprint ? 1.9 : this.crouch ? 1.2 : 1.55;
      if (this.stepDist > stride) {
        this.stepDist = 0;
        const floor = g.nav.noise[Math.max(0, g.nav.at(this.pos[0], this.pos[2]))] ?? 0;
        const loud = (this.sprint ? 13 : this.crouch ? 1.3 : 6.5) * [0.8, 1.0, 1.15, 1.4][floor] * (this.mod?.quiet ?? 1) * (g.weather?.noiseMul ?? 1);
        g.noise(this.pos, loud, 'step'); g.sfx.step?.(floor, this.sprint ? 1.2 : this.crouch ? 0.4 : 0.8);
        if (floor === 3 && g.story.zone === 'fen') { g.smoke.emit([this.pos[0], 0.08, this.pos[2]], { count: 6, color: [0.25, 0.4, 0.4, 0.5], colorEnd: [0.2, 0.3, 0.3, 0], size: 0.08, grow: 2, spread: 0.6, up: 0.6, life: 0.6, jitter: 0.1 }); g.sfx.splash?.(); }
      }
    }
    // eye height & head bob
    const eyeT = this.crouch ? EYE_CROUCH : EYE_STAND;
    this.eye += (eyeT - this.eye) * Math.min(1, dt * 10);
    this.bobT += dt * this.speedNow * (this.sprint ? 1.9 : 2.4);
    const bobAmp = this.cc.grounded ? Math.min(1, this.speedNow / 4) : 0;
    this.bobY = Math.sin(this.bobT * 2) * 0.028 * bobAmp * (this.sprint ? 1.4 : 1) - this.kick;
    this.kick *= Math.exp(-dt * 12);
    // ---- light & visibility
    this.lightLevel += (g.lightAt(this.pos[0], this.pos[1] + 1.1, this.pos[2]) - this.lightLevel) * Math.min(1, dt * 6);
    let vis = 0.12 + this.lightLevel * 0.88;
    vis *= this.crouch ? 0.55 : 1; vis *= this.sprint ? 1.5 : this.speedNow < 0.4 ? 0.72 : 1;
    if (this.veilT > 0) { vis *= 0.28; this.veilT -= dt; }
    if (this.atk) vis = Math.max(vis, 0.85);
    this.visibility = clamp(vis, 0.05, 1.6);
    // ember: dark places feed it
    if (this.lightLevel < 0.3) this.ember = Math.min(this.maxEmber, this.ember + dt * 1.6);
    // ---- combat & interaction
    this.updateCombat(dt, input);
    this.updateCarry(dt, input);
    this.updatePicking(dt, input);
    this.lmbPress = false; this.usePress = false;
    // regeneration out of combat
    if (this.hp < this.maxHp && g.combatT <= 0) this.hp = Math.min(this.maxHp, this.hp + dt * 0.8);
  }
  setCrouch(on) {
    if (!on) { // need headroom
      const hit = this.g.world.raycast([this.pos[0], this.pos[1] + 1.0, this.pos[2]], [0, 1, 0], 0.85, { ignore: this.cc.body, mask: 0xffff & ~14 });
      if (hit) return;
    }
    this.crouch = on; const cc = this.cc; cc.height = on ? 1.15 : 1.8;
    cc.body.shape = new E.Capsule(cc.radius, Math.max(0.01, cc.height / 2 - cc.radius)); cc.body.position = cc._center();
  }
  respawnNear() { this.cc.position = [...this.g.checkpoint]; this.cc.velocity = [0, 0, 0]; }

  // ------------------------------------------------------------ combat
  updateCombat(dt, input) {
    const g = this.g;
    this.blocking = this.rmb && !this.atk && !this.carried && this.stagger <= 0 && this.stamina > 3;
    if (this.blocking) { this.blockT += dt; if (this.vmClip !== 'Block' && this.vmClip !== 'BlockHit') this.playVm('Block', 0.07); } else this.blockT = 0;
    if (!this.blocking && (this.vmClip === 'Block' || this.vmClip === 'BlockHit')) this.playVm('Idle', 0.12);
    this.comboT = Math.max(0, this.comboT - dt);
    if (this.atk) {
      const a = this.atk; a.t += dt;
      if (this.lmbPress && a.t > a.dur * 0.35) this.queued = true;
      if (a.t >= a.dur) {
        this.atk = null; this.playVm('Idle', 0.15);
        if (this.queued) { this.queued = false; this.attack(); }
      }
    } else if (this.lmbPress || (this.lmb && this.queued)) { this.queued = false; if (!this.carried) this.attack(); }
    if (this.stagger > 0 && this.vmClip !== 'Stagger' && !this.atk) this.playVm('Stagger', 0.05);
    // skills on keys
    if (input.pressed.has('1')) this.skillVeil();
    if (input.pressed.has('2')) this.skillDash(input);
    if (input.pressed.has('3')) this.skillSlam();
    if (input.pressed.has('q')) this.kick2();
    if (input.pressed.has('r')) this.g.useItem('potion');
    if (input.pressed.has('t')) this.g.useItem('ember');
    this.g.tools.keys(input, dt);
    input.pressed.clear();
  }
  attack() {
    if (this.stagger > 0 || this.stamina < 8 || this.dead) return;
    const g = this.g;
    // backstab prompt uses the same button: handled in resolveHit through npc awareness
    let clip = ['Slash1', 'Slash2', 'Slash3'][this.combo % 3];
    if (this.sprint && this.speedNow > 4.5) clip = 'Thrust';
    this.combo = this.comboT > 0 ? this.combo + 1 : 0;
    clip = this.sprint && this.speedNow > 4.5 ? 'Thrust' : ['Slash1', 'Slash2', 'Slash3'][this.combo % 3];
    this.comboT = 0.9;
    const dur = { Slash1: 0.62, Slash2: 0.62, Slash3: 0.85, Thrust: 0.7 }[clip];
    this.atk = { clip, t: 0, dur, hit: false };
    this.stamina -= clip === 'Slash3' ? 16 : 10;
    this.playVm(clip, 0.04);
    g.sfx.swing?.(clip === 'Slash3' ? 0.8 : 1);
  }
  resolveHit() {
    if (!this.atk || this.atk.hit) return; this.atk.hit = true;
    const g = this.g, eye = this.eyePos, f = this.forward, flat = this.flat, clip = this.atk.clip;
    const reach = clip === 'Thrust' ? 3.0 : 2.5, arc = Math.cos((clip === 'Thrust' ? 22 : clip === 'Slash3' ? 48 : 62) * D2R);
    let dmg = (clip === 'Slash3' ? 36 : clip === 'Thrust' ? 32 : 24) * (this.mod?.dmg ?? 1); const rip = this.riposteT > 0; if (rip) { dmg *= 2.2; this.riposteT = 0; g.flashText('RIPOSTE'); }
    let hitSomething = false;
    for (const n of g.npcs) {
      if (n.dead || !n.active) continue;
      const dx = n.x - this.pos[0], dz = n.z - this.pos[2], d = Math.hypot(dx, dz);
      if (d > reach + 0.3 || Math.abs(n.y - this.pos[1]) > 1.6) continue;
      const c = (dx * flat[0] + dz * flat[1]) / (d || 1);
      if (c < arc && d > 0.9) continue;
      const ho = { from: 'player', clip, heavy: clip !== 'Slash1' && clip !== 'Slash2', sap: g.tools.sap, bleed: clip === 'Slash3' || clip === 'Thrust' || rip }; const hr = g.hitNpc(n, dmg, [dx / (d || 1), dz / (d || 1)], ho); if (g.tools.poisonHits > 0 && hr !== 'blocked' && hr !== 'dead' && hr !== 'killed' && !g.tools.sap) { n.poison = 12 * (this.mod?.poison || 1); g.tools.poisonHits--; if (!g.tools.poisonHits) g.ui.toast('The poison on your blade is spent'); }
      hitSomething = true;
    }
    // physics props: fling them
    const centre = [eye[0] + f[0] * 1.4, eye[1] + f[1] * 1.4 - 0.2, eye[2] + f[2] * 1.4];
    for (const b of g.world.overlapSphere(centre, 0.85)) {
      if (!b.isDynamic || b === this.carried) continue;
      const push = Math.min(b.mass, 14);
      b.applyImpulse([f[0] * 5.5 * push, 2.0 * push + 1, f[2] * 5.5 * push], b.position); hitSomething = true;
      if (b.userData.breakable) g.breakProp(b, f); else g.sfx.thud?.(0.5);
      g.noise(b.position, 8, 'prop');
    }
    if (!hitSomething) {
      const h = g.world.raycast(eye, f, reach, { ignore: this.cc.body, mask: 0xffff & ~14 });
      if (h && !h.body.isDynamic) {
        g.spark(h.point, h.normal, 10); g.sfx.clang?.(0.8); g.noise(h.point, 11, 'clang'); this.recoil = 0.05;
        if (h.body.userData.kind === 'wood' || h.body.userData.door) g.decals.add(h.point, h.normal, 0.06);
        this.atk.t = Math.max(this.atk.t, this.atk.dur * 0.55); // bounce off the wall: a slower recovery
      }
    }
    if (hitSomething) this.kick = 0.02;
  }
  // shove with the boot: staggers whoever is in front, even through a guard
  kick2() {
    if (this.atk || this.stagger > 0 || this.cool.kick > 0 || this.carried || this.dead || this.stamina < 12) return;
    this.cool.kick = 1.4; this.stamina -= 12; this.playVm('BlockHit', 0.03); this.g.sfx.swing?.(0.5);
    const g = this.g, f = this.flat; let hit = false;
    for (const n of g.npcs) {
      if (n.dead || n.state === 'ko') continue;
      const dx = n.x - this.pos[0], dz = n.z - this.pos[2], d = Math.hypot(dx, dz); if (d > 2.1 || (dx * f[0] + dz * f[1]) / (d || 1) < 0.5) continue;
      hit = true; n.stagger = Math.max(n.stagger, 1.0); n.atk = null; if (n.guard && n.state !== 'chase' && n.state !== 'attack') { n.alert = 1; n.lastSeen = [...this.pos]; }
      if (n.guard && (n.state === 'routine' || n.state === 'notice')) n.spotted(); if (n.guard) n.state = 'stagger';
      n.ch.upper.playOnce('Stagger', { fadeIn: 0.04, fadeOut: 0.3 }); n.moveBy(dx / (d || 1) * 1.2, dz / (d || 1) * 1.2); g.sfx.thud?.(0.7, n.pos);
      if (!n.guard && n.role !== 'hollow') g.rep.crime('assault', n.pos, { victim: n });
    }
    if (hit) { g.flashText('KICK'); g.noise(this.pos, 9, 'combat'); }
  }
  // an incoming blow. returns 'hit' | 'blocked' | 'parried' | 'dodged'
  incoming(dmg, fromXZ, opts = {}) {
    const g = this.g;
    if (this.dead || this.invuln > 0 || g.mode === 'cutscene' || g.mode === 'dead') return 'dodged';
    if (this.blocking && fromXZ) {
      const dx = fromXZ[0] - this.pos[0], dz = fromXZ[1] - this.pos[2], d = Math.hypot(dx, dz) || 1, c = (dx * this.flat[0] + dz * this.flat[1]) / d;
      if (c > 0.35 && !opts.unblockable) {
        const parry = this.blockT < 0.28 + (this.mod?.parry || 0);
        this.stamina -= parry ? 0 : dmg * 0.9;
        this.playVm('BlockHit', 0.02, true); this.vmClip = 'Block';
        g.spark([this.pos[0] + this.flat[0] * 0.8, this.pos[1] + 1.3, this.pos[2] + this.flat[1] * 0.8], [-this.flat[0], 0, -this.flat[1]], parry ? 22 : 12);
        g.sfx.clang?.(parry ? 1.2 : 0.9); g.noise(this.pos, 12, 'clang');
        if (parry) { this.stamina = Math.min(100, this.stamina + 8); this.riposteT = 1.3; g.flashText?.('PARRY'); g.slowmo = 0.3; g.shake = Math.max(g.shake, 0.3); return 'parried'; }
        if (this.stamina <= 0) { this.stagger = 0.8; this.blocking = false; this.stamina = 0; g.sfx.grunt?.(); }
        return 'blocked';
      }
    }
    this.hurt(dmg, fromXZ, opts); return 'hit';
  }
  hurt(dmg, from, opts = {}) {
    if (this.dead) return;
    this.hp -= dmg; this.hurtT = 0.35; this.kick = 0.05; this.g.combatT = 6;
    this.g.sfx.hurt?.(); this.g.pix.hurt = 1;
    if (from && !opts.fall) { const dx = this.pos[0] - from[0], dz = this.pos[2] - from[1], d = Math.hypot(dx, dz) || 1; const kb = opts.shove ? 7 : 2.2; this.cc.velocity[0] += (dx / d) * kb; this.cc.velocity[2] += (dz / d) * kb; }
    if (dmg > 12 && !opts.fall) { this.stagger = 0.25; if (this.atk) { this.atk = null; this.playVm('Stagger', 0.03); } }
    if (this.hp <= 0) { this.hp = 0; this.dead = true; this.g.playerDied(); }
  }

  // ------------------------------------------------------------ skills
  spend(n) { if (this.ember < n) { this.g.toast('Not enough Ember'); this.g.sfx.deny?.(); return false; } this.ember -= n; return true; }
  skillVeil() {
    if (this.cool.veil > 0 || this.atk || !this.spend(30)) return;
    this.veilT = 9; this.cool.veil = 12 * (this.mod?.cd ?? 1); this.playVm('Veil', 0.06); this.g.sfx.veil?.(); this.g.toast('Shadow Veil');
    this.g.emitBurst(this.eyePos, 'veil');
  }
  skillDash(input) {
    if (this.cool.dash > 0 || this.stagger > 0 || !this.spend(22)) return;
    const k = input.keys;
    let ix = (k.has('a') ? 1 : 0) - (k.has('d') ? 1 : 0), iz = (k.has('w') ? 1 : 0) - (k.has('s') ? 1 : 0);
    if (!ix && !iz) iz = 1;
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw), lx = Math.cos(this.yaw), lz = -Math.sin(this.yaw);
    const d = [fx * iz + lx * ix, fz * iz + lz * ix], l = Math.hypot(d[0], d[1]);
    this.dashDir = [d[0] / l, d[1] / l]; this.dashT = 0.22; this.invuln = 0.35; this.cool.dash = 2.5 * (this.mod?.cd ?? 1);
    this.playVm('Dash', 0.03); this.g.sfx.dash?.(); this.g.noise(this.pos, 8, 'dash');
    for (let i = 0; i < 12; i++) this.g.emitBurst([this.pos[0] - this.dashDir[0] * i * 0.3, this.pos[1] + 1, this.pos[2] - this.dashDir[1] * i * 0.3], 'shadow');
  }
  skillSlam() {
    if (this.cool.slam > 0 || this.atk || !this.spend(40)) return;
    this.cool.slam = 9 * (this.mod?.cd ?? 1); this.atk = { clip: 'Slam', t: 0, dur: 1.3, hit: true }; this.playVm('Slam', 0.05); this.g.sfx.swing?.(0.6);
  }

  // ------------------------------------------------------------ carrying
  grab(body) {
    if (this.carried) return;
    this.carried = body; body.wake(); body.gravityScale = 0; body.linearDamping = 6; body.angularDamping = 6;
    this.carryDist = 1.55; this.playVm('Carry', 0.15);
  }
  drop(throwIt = false) {
    const b = this.carried; if (!b) return; this.carried = null;
    b.gravityScale = 1; b.linearDamping = 0.02; b.angularDamping = 0.5; b.wake();
    if (throwIt) { const f = this.forward; const s = 9 / Math.max(1, Math.sqrt(b.mass)); b.velocity = [f[0] * s * 2.2 + this.cc.velocity[0] * 0.5, f[1] * s * 2.2 + 1.5, f[2] * s * 2.2 + this.cc.velocity[2] * 0.5]; b.userData.thrown = 2; this.g.sfx.swing?.(0.7); }
    this.playVm('Idle', 0.15);
  }
  updateCarry(dt, input) {
    const b = this.carried; if (!b) return;
    const eye = this.eyePos, f = this.forward;
    const target = [eye[0] + f[0] * this.carryDist, eye[1] + f[1] * this.carryDist - 0.25, eye[2] + f[2] * this.carryDist];
    b.velocity = [(target[0] - b.position[0]) * 14, (target[1] - b.position[1]) * 14, (target[2] - b.position[2]) * 14];
    if (Math.hypot(b.position[0] - target[0], b.position[1] - target[1], b.position[2] - target[2]) > 2.6) this.drop(false);
    if (this.lmbPress) this.drop(true);
    else if (this.rmb && !this._rmbWas) this.drop(false);
    this._rmbWas = this.rmb;
  }

  // ------------------------------------------------------------ lock picking
  startPicking(target, level, onDone, label = 'Picking the lock', o = {}) {
    if (this.picking) return;
    if (!o.free && !this.inv.has('lockpick')) { this.g.toast('You need a lockpick'); return; }
    if (!o.free) this.g.rep.crime('lockpick', this.pos, { range: 16 });
    this.picking = { target, level, t: 0, need: (o.need ?? (1.6 + level * 1.5)) * (this.mod?.pick ?? 1), onDone, label, tick: 0, x: this.pos[0], z: this.pos[2], free: !!o.free, watch: o.watch };
    this.playVm('Reach', 0.1);
  }
  updatePicking(dt, input) {
    const p = this.picking; if (!p) return;
    if (!input.keys.has('e') || Math.hypot(this.pos[0] - p.x, this.pos[2] - p.z) > 0.6 || this.hurtT > 0.2) { this.picking = null; this.playVm('Idle', 0.12); return; }
    p.t += dt; p.tick += dt;
    if (p.watch && !p.watch(dt)) { this.picking = null; this.playVm('Idle', 0.12); return; }
    if (p.tick > 0.55 && !p.free) { p.tick = 0; this.g.sfx.pick?.(); this.g.noise(this.pos, 3.2, 'pick');
      if (Math.random() < 0.05 * p.level * (this.mod?.snap ?? 1)) { this.inv.remove('lockpick', 1); this.g.toast('Your pick snapped'); this.g.sfx.deny?.(); this.picking = null; this.playVm('Idle', 0.1); return; } }
    if (p.t >= p.need) { const done = p.onDone; this.picking = null; this.playVm('Idle', 0.1); done(); this.g.sfx.lockClick?.(); }
  }

  // ------------------------------------------------------------ camera & viewmodel matrix
  updateView(camera, dt, fovBase) {
    const eye = this.eyePos, { f, left, up } = this.basis();
    // camera roll from strafing & recoil
    camera.position.set(eye); camera.target.set([eye[0] + f[0] * 10, eye[1] + f[1] * 10, eye[2] + f[2] * 10]); camera.up.set(up);
    camera.fov = fovBase * (1 + (this.dashT > 0 ? 0.12 : 0) + (this.sprint ? 0.04 : 0));
    // viewmodel
    this.sway[0] += (clamp(-this.dYaw * 3.5, -0.05, 0.05) - this.sway[0]) * Math.min(1, dt * 9);
    this.sway[1] += (clamp(-this.dPitch * 3.5, -0.05, 0.05) - this.sway[1]) * Math.min(1, dt * 9);
    const bob = this.cc.grounded ? Math.min(1, this.speedNow / 4) : 0;
    const dip = this.carried ? 0.03 : 0;
    const off = [Math.sin(this.bobT) * 0.014 * bob + this.sway[0], -Math.abs(Math.cos(this.bobT)) * 0.012 * bob + this.sway[1] - dip - (this.crouch ? 0.03 : 0), 0];
    const m = E.mat4.create(), cam = new Float32Array([left[0], left[1], left[2], 0, up[0], up[1], up[2], 0, f[0], f[1], f[2], 0, eye[0], eye[1], eye[2], 1]);
    const S = VM.SCALE;
    const pre = E.mat4.fromRTS(E.mat4.create(), E.quat.fromEuler(E.quat.create(), this.recoil * 300, 0, 0), [off[0], off[1], off[2] - 0.05], [S, S, S]);
    const shift = E.mat4.fromRTS(E.mat4.create(), E.quat.create(), [0, -VM.EYE, 0]);
    E.mat4.multiply(m, cam, pre); E.mat4.multiply(m, m, E.mat4.fromRTS(E.mat4.create(), E.quat.create(), [0, -VM.EYE * 0 , 0]));
    // model space eye = (0, EYE, 0): translate so it lands on the camera origin
    const toEye = E.mat4.fromRTS(E.mat4.create(), E.quat.create(), [0, -VM.EYE, 0]);
    E.mat4.multiply(m, m, toEye);
    this.vm.local.set(m); void shift;
    this.recoil *= Math.exp(-dt * 10);
    this.fill.position.set([eye[0] - left[0] * 0.2 + f[0] * 0.3, eye[1] - 0.15, eye[2] - left[2] * 0.2 + f[2] * 0.3]);
    this.vm.visible = !this.dead;
    // keep the viewmodel out of walls: pull back when the wall is close
  }
}
