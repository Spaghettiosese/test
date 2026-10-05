// An Actor is any combatant: the human player, a teammate bot or an enemy bot. The simulation
// moves and shoots every actor identically; only the source of the control inputs (`ctl`) differs.
import { WEAPONS } from '../data/weapons.js';
import { GADGETS } from '../data/gadgets.js';
import { OPS_BY_ID, hpFor, speedFor } from '../data/operators.js';
import { clamp, dirOf, rayVCapsule, raySphere, TAU, wrapAngle } from './util.js';
import { STOREY } from '../world/grid.js';

export const STAND = 0, CROUCH = 1, PRONE = 2;
export const BODY = { r: 0.3, h: [1.8, 1.4, 0.62], eye: [1.65, 1.2, 0.5], head: [1.62, 1.16, 0.46] };
export const SPEED = { walk: 2.7, run: 4.7, crouch: 1.55, prone: 0.6, ads: 1.75, down: 0.55 };
export const LEAN_OFFSET = 0.42;
export const RELOAD_TIME = { m4a1: 2.7, sniper: 3.2, shotgun: 0.5, revolver: 3.0, smg: 2.5, double: 2.6, garand: 2.6, mp7: 2.3, ak47: 2.1, deagle: 2.2,
  aug: 2.1, famas: 2.1, compact9: 2.1, m45: 2.1, mp10: 2.1, lmg: 3.4, p90: 2.1, d12: 2.7, dmr: 2.1, lever: 3.4 };
// the rigs that have a longer Reload Empty clip (the slide or the handle is worked at the end)
export const EMPTY_MULT = { deagle: 1.23, aug: 1.43, famas: 1.43, lmg: 1.43, p90: 1.43, d12: 1.43, dmr: 1.43, compact9: 1.24, m45: 1.24, mp10: 1.24 };
export const SHELL_TIME = 0.62;

let ACTOR_ID = 1;

export class Gun {
  constructor(id) {
    this.id = id; this.def = WEAPONS[id];
    this.mag = this.def.mag; this.reserve = this.def.mag * this.def.reserve;
    this.cd = 0; this.reloading = false; this.reloadT = 0; this.shells = 0; this.draw = 0; this.pending = 0;
  }
  get empty() { return this.mag <= 0; }
  get full() { return this.mag >= this.def.mag; }
  get total() { return this.mag + this.reserve; }
}

export class Actor {
  constructor(sim, o) {
    this.sim = sim; this.id = ACTOR_ID++;
    this.team = o.team; this.op = typeof o.op === 'string' ? OPS_BY_ID[o.op] : o.op; this.name = o.name || this.op.name;
    this.isPlayer = !!o.isPlayer; this.ai = null; this.view = null;
    this.pos = [...(o.pos || [0, 0, 0])]; this.vel = [0, 0, 0]; this.yaw = o.yaw || 0; this.pitch = 0;
    this.lean = 0; this.leanT = 0; this.stance = STAND; this.curH = BODY.h[0]; this.eyeH = BODY.eye[0];
    this.grounded = true; this.fallFrom = this.pos[1]; this.speedMul = speedFor(this.op);
    this.maxHp = hpFor(this.op); this.hp = this.maxHp; this.armorPlates = 0;
    this.state = 'alive'; this.downT = 0; this.reviveT = 0; this.diedAt = 0; this.shieldUntil = 0; this.shieldOn = false;
    this.mode = 'normal'; // normal | vault | rappel | drone | climb
    this.ctl = { fwd: 0, strafe: 0, sprint: false, aim: false, fire: false, reload: false, stance: STAND, lean: 0, jump: false, use: false };
    this.trigPrev = false; this.ads = 0; this.bloom = 0; this.kick = [0, 0]; this.lastShotT = -9; this.lastStepT = 0; this.stepDist = 0;
    this.status = { blind: 0, deaf: 0, slow: 0, shock: 0, gas: 0, tag: 0, jam: 0, burn: 0, heal: 0, bleed: 0, stun: 0 };
    this.stats = { kills: 0, deaths: 0, assists: 0, downs: 0, revives: 0, headshots: 0, damage: 0, plants: 0, defuses: 0, score: 0, shots: 0, hits: 0, reinforced: 0, breached: 0 };
    this.damagers = new Map(); // actor id -> time of last damage (assists)
    this.guns = []; this.cur = 0;
    this.gadgets = []; // [{ id, count }]; index 0 = operator gadget, 1 = secondary gadget
    this.gsel = -1;
    this.shield = null; // { up, flash }
    this.carrying = null; this.busy = null; // timed actions: { kind, t, dur, target, onDone }
    this.zoneStamp = 0; this.outline = 0; this.lastDamager = null;
    this.setLoadout(o.primary, o.secondary, o.gadget2);
    if (o.armor !== undefined) this.armorPlates = o.armor;
    if (this.op.ability === 'shield' || this.op.ability === 'flashshield') this.shield = { up: false, flash: this.op.ability === 'flashshield', cd: 0, bash: 0 };
  }
  get alive() { return this.state === 'alive'; }
  // Attackers cannot be hurt in their spawn for the first seconds of the action phase (or until they fire or
  // leave it): the building's windows look straight onto the yard, so without this the round is decided at once.
  get spawnProtected() { return this.shieldOn && this.sim.time < this.shieldUntil; }
  startSpawnShield(seconds = 20) { this.shieldOn = true; this.shieldUntil = this.sim.time + seconds; }
  updateSpawnShield() {
    if (!this.shieldOn) return;
    const sp = this.sim.round && this.sim.round.spawn, m = 3.5;
    const outside = sp && (this.pos[0] < sp.x0 - m || this.pos[0] > sp.x1 + m || this.pos[2] < sp.z0 - m || this.pos[2] > sp.z1 + m);
    if (this.sim.time >= this.shieldUntil || outside || this.sim.time - (this.lastShotT || -9) < 0.1 || this.pos[1] > 1.5) { this.shieldOn = false; this.sim.emit('spawnshield', { actor: this, on: false }); }
  }
  get downed() { return this.state === 'downed'; }
  get dead() { return this.state === 'dead'; }
  get gun() { return this.guns[this.cur]; }
  get armor() { return this.op.armor; }
  get isAtk() { return this.team === 'atk'; }

  setLoadout(primary, secondary, gadget2) {
    this.guns = [];
    if (primary && !(this.op.ability === 'flashshield' && false)) this.guns.push(new Gun(primary));
    if (secondary) this.guns.push(new Gun(secondary));
    this.cur = 0;
    const ab = this.op.ability;
    this.gadgets = [];
    if (GADGETS[ab] && !['reinforce', 'barricade'].includes(ab)) this.gadgets.push({ id: ab, count: GADGETS[ab].count });
    if (gadget2) this.gadgets.push({ id: gadget2, count: GADGETS[gadget2].count });
    this.gsel = -1;
  }
  gadget(id) { return this.gadgets.find((g) => g.id === id); }
  selected() { return this.gsel >= 0 ? this.gadgets[this.gsel] : null; }

  // ------------------------------------------------------------------ geometry
  get right() { return [-Math.cos(this.yaw), 0, Math.sin(this.yaw)]; }
  get fwd() { return [Math.sin(this.yaw), 0, Math.cos(this.yaw)]; }
  eye(out = [0, 0, 0]) {
    const r = this.right, lo = this.lean * LEAN_OFFSET;
    out[0] = this.pos[0] + r[0] * lo; out[1] = this.pos[1] + this.eyeH; out[2] = this.pos[2] + r[2] * lo;
    return out;
  }
  look() { return dirOf(this.yaw, this.pitch); }
  headPos() { const r = this.right, lo = this.lean * LEAN_OFFSET * 0.9; return [this.pos[0] + r[0] * lo, this.pos[1] + this.curH * 0.93, this.pos[2] + r[2] * lo]; }
  chestPos() { return [this.pos[0], this.pos[1] + this.curH * 0.66, this.pos[2]]; }
  // nearest hit of a ray on this actor: { t, region } or null
  hitTest(o, d, maxT) {
    if (!this.alive && !this.downed) return null;
    if (this.spawnProtected) return null; // bullets go straight through a team still in its spawn
    const s = this.curH / BODY.h[0], lo = this.lean * LEAN_OFFSET, r = this.right;
    const lx = this.pos[0] + r[0] * lo, lz = this.pos[2] + r[2] * lo;
    let best = null;
    const test = (t, region) => { if (t !== null && t <= maxT && (!best || t < best.t)) best = { t, region }; };
    if (!this.downed) test(raySphere(o, d, [lx, this.pos[1] + this.curH - 0.1, lz], 0.115), 'head');
    test(rayVCapsule(o, d, this.pos[0] + r[0] * lo * 0.6, this.pos[2] + r[2] * lo * 0.6, this.pos[1] + 0.9 * s, this.pos[1] + 1.5 * s, 0.25), 'torso');
    test(rayVCapsule(o, d, this.pos[0], this.pos[2], this.pos[1] + 0.05, this.pos[1] + 0.9 * s, 0.18), 'legs');
    return best;
  }

  // ------------------------------------------------------------------ per-frame update
  update(dt) {
    this.updateSpawnShield();
    const st = this.status;
    for (const k in st) if (st[k] > 0) st[k] = Math.max(0, st[k] - dt);
    if (st.burn > 0) this.hurt(8 * dt, { src: null, region: 'torso', ignoreArmor: true, quiet: true });
    if (st.gas > 0) this.hurt(6 * dt, { src: this.gasSrc || null, region: 'torso', ignoreArmor: true, quiet: true });
    if (st.heal > 0 && this.alive) this.hp = Math.min(this.maxHp + this.armorPlates * 15, this.hp + 22 * dt);
    this.bloom = Math.max(0, this.bloom - dt * 0.05);
    this.kick[0] *= Math.exp(-dt * 7); this.kick[1] *= Math.exp(-dt * 7);
    if (this.state === 'downed') {
      this.downT -= dt; this.hp = Math.max(1, this.hp - 0.4 * dt);
      if (this.downT <= 0) { this.die({ src: this.lastDamager, region: 'torso', bleed: true }); return; }
    }
    if (this.dead) return;
    this.moveStep(dt);
    this.weaponStep(dt);
    if (this.busy) {
      const b = this.busy; b.t += dt;
      if (b.cancelIf && b.cancelIf(this)) this.busy = null;
      else if (b.t >= b.dur) { this.busy = null; b.onDone && b.onDone(this); }
    }
    if (this.shield) { this.shield.cd = Math.max(0, this.shield.cd - dt); this.shield.bash = Math.max(0, this.shield.bash - dt); }
  }

  moveStep(dt) {
    const w = this.sim.world, c = this.ctl;
    if (this.mode === 'vault') { this.vaultStep(dt); return; }
    if (this.mode === 'rappel' || this.mode === 'drone') { this.vel[0] = this.vel[1] = this.vel[2] = 0; return; }
    // stance
    let want = this.downed ? PRONE : c.stance;
    if (this.busy && this.busy.kind === 'plant') want = Math.max(want, CROUCH);
    if (want < this.stance) { // standing up needs headroom
      const hh = BODY.h[want] + 0.05, hit = w.cast(this.pos[0], this.pos[1] + this.curH - 0.05, this.pos[2], 0, 1, 0, hh - this.curH + 0.1, 3);
      if (!hit) this.stance = want;
    } else this.stance = want;
    const tH = BODY.h[this.stance], tE = BODY.eye[this.stance];
    this.curH += clamp(tH - this.curH, -dt * 4.5, dt * 4.5); this.eyeH += clamp(tE - this.eyeH, -dt * 4.5, dt * 4.5);
    // lean
    const wantLean = this.stance === PRONE || this.sprinting ? 0 : c.lean;
    this.leanT += clamp(wantLean - this.leanT, -dt * 5, dt * 5);
    this.lean = this.leanSafe(this.leanT);
    // speed
    const aimingNow = this.ads > 0.4;
    let speed;
    if (this.downed) speed = SPEED.down; else if (this.stance === PRONE) speed = SPEED.prone; else if (this.stance === CROUCH) speed = SPEED.crouch;
    else if (c.sprint && c.fwd > 0.5 && !aimingNow && !this.gun?.reloading && !(this.shield && this.shield.up) && this.grounded) speed = SPEED.run; else speed = aimingNow ? SPEED.ads : SPEED.walk;
    this.sprinting = speed === SPEED.run;
    speed *= this.speedMul;
    if (this.shield) speed *= this.shield.up ? 0.62 : 0.85;
    if (this.gun && this.gun.def.speed) speed *= this.gun.def.speed; // a belt-fed gun is a heavy thing to run with
    if (this.status.slow > 0) speed *= 0.55;
    if (this.status.stun > 0) speed *= 0.6;
    if (this.busy && this.busy.kind !== 'reinforce' && this.busy.slow) speed *= this.busy.slow;
    if (this.busy && this.busy.freeze) speed = 0;
    const f = this.fwd, r = this.right;
    let wx = f[0] * c.fwd + r[0] * c.strafe, wz = f[2] * c.fwd + r[2] * c.strafe;
    const wl = Math.hypot(wx, wz); if (wl > 1) { wx /= wl; wz /= wl; }
    wx *= speed; wz *= speed;
    const acc = this.grounded ? 14 : 2.5, k = Math.min(1, acc * dt);
    this.vel[0] += (wx - this.vel[0]) * k; this.vel[2] += (wz - this.vel[2]) * k;
    this.vel[1] -= 9.81 * dt;
    if (c.jump && this.grounded && this.stance === STAND && !this.downed) { this.vel[1] = 3.6; this.grounded = false; this.fallFrom = this.pos[1]; }
    c.jump = false;
    // integrate with collision
    const pos = this.pos, r0 = BODY.r;
    pos[0] += this.vel[0] * dt; pos[2] += this.vel[2] * dt;
    w.pushOut(pos, r0, this.curH, 0.4);
    const b = this.sim.map.bounds;
    pos[0] = clamp(pos[0], b.x0, b.x1); pos[2] = clamp(pos[2], b.z0, b.z1);
    this.pushApart(dt);
    // vertical
    const ground = w.groundY(pos[0], pos[2], r0, pos[1], 0.42);
    pos[1] += this.vel[1] * dt;
    if (pos[1] <= ground + 1e-3 && this.vel[1] <= 0) {
      if (!this.grounded) this.land(this.fallFrom - ground);
      pos[1] = ground; this.vel[1] = 0; this.grounded = true;
    } else if (pos[1] > ground + 0.05) {
      if (this.grounded) { this.fallFrom = pos[1]; }
      this.grounded = false;
    }
    if (this.vel[1] > 0) {
      const cl = w.ceilingY(pos[0], pos[2], pos[1] + this.curH);
      if (pos[1] + this.curH > cl) { pos[1] = cl - this.curH; this.vel[1] = 0; }
    }
    if (pos[1] < -30) { this.hurt(9999, { region: 'torso', src: null, void: true }); }
    // footsteps make noise
    const sp = Math.hypot(this.vel[0], this.vel[2]);
    if (this.grounded && sp > 0.8) {
      this.stepDist += sp * dt;
      const stride = this.sprinting ? 1.5 : 1.1;
      if (this.stepDist > stride) {
        this.stepDist = 0;
        const loud = this.stance === CROUCH ? 3 : this.stance === PRONE ? 1.5 : this.sprinting ? 17 : sp > 2.2 ? 9 : 5;
        this.sim.noise(pos, loud, 'step', this);
      }
    }
  }
  leanSafe(l) {
    if (Math.abs(l) < 0.02) return 0;
    const w = this.sim.world, r = this.right, y = this.pos[1] + this.eyeH, side = Math.sign(l);
    const h = w.cast(this.pos[0], y, this.pos[2], r[0] * side, 0, r[2] * side, LEAN_OFFSET * Math.abs(l) + 0.2, 0);
    if (h) return side * Math.max(0, (h.t - 0.25) / LEAN_OFFSET);
    return l;
  }
  pushApart(dt) {
    for (const o of this.sim.actors) {
      if (o === this || !o.alive || Math.abs(o.pos[1] - this.pos[1]) > 1.5) continue;
      const dx = this.pos[0] - o.pos[0], dz = this.pos[2] - o.pos[2], d = Math.hypot(dx, dz);
      if (d < 0.55 && d > 1e-4) { const push = (0.55 - d) * 0.5; this.pos[0] += (dx / d) * push; this.pos[2] += (dz / d) * push; }
    }
  }
  land(drop) {
    if (drop > 3.2) { this.hurt((drop - 3.0) * 22, { region: 'legs', src: null, fall: true, ignoreArmor: true }); this.sim.noise(this.pos, 14, 'land', this); }
    else if (drop > 0.6) this.sim.noise(this.pos, Math.min(12, 4 + drop * 3), 'land', this);
  }

  // vault over a window sill or through a hole: a short scripted hop
  startVault(to) {
    this.mode = 'vault'; this.vault = { from: [...this.pos], to: [...to], t: 0, dur: 0.75 };
    this.stance = STAND; this.sim.noise(this.pos, 8, 'vault', this);
  }
  vaultStep(dt) {
    const v = this.vault; v.t += dt;
    const u = clamp(v.t / v.dur, 0, 1), e = u * u * (3 - 2 * u);
    this.pos[0] = v.from[0] + (v.to[0] - v.from[0]) * e; this.pos[2] = v.from[2] + (v.to[2] - v.from[2]) * e;
    this.pos[1] = v.from[1] + (v.to[1] - v.from[1]) * e + Math.sin(u * Math.PI) * 0.55;
    this.vel[0] = this.vel[1] = this.vel[2] = 0;
    if (u >= 1) { this.mode = 'normal'; this.grounded = false; this.fallFrom = this.pos[1]; this.vel[1] = 0; }
  }

  // ------------------------------------------------------------------ weapons
  weaponStep(dt) {
    const c = this.ctl;
    this.ads += clamp((c.aim && !this.gun?.reloading && this.alive && !(this.shield && this.shield.up) && !this.sprinting ? 1 : 0) - this.ads, -dt * 6, dt * 6);
    for (const g of this.guns) {
      g.cd = Math.max(0, g.cd - dt);
      if (g.draw > 0) g.draw -= dt;
      if (g.pending > 0) { g.pending -= dt; if (g.pending <= 0) this.sim.fire(this, g, true); }
    }
    const g = this.gun;
    if (!g || !this.alive) return;
    if (g.reloading) {
      if (g.def.rig === 'shotgun') { // shells go in one at a time and a trigger pull interrupts
        g.shellT -= dt;
        if (c.fire && g.mag > 0 && g.shellT < SHELL_TIME - 0.1) { g.reloading = false; this.sim.emit('reloadcancel', { actor: this, gun: g }); }
        else if (g.shellT <= 0) {
          if (g.reserve > 0 && g.mag < g.def.mag) { g.mag++; g.reserve--; g.shellT = SHELL_TIME; this.sim.emit('shellin', { actor: this, gun: g }); }
          if (g.mag >= g.def.mag || g.reserve <= 0) { g.reloading = false; this.sim.emit('reloaded', { actor: this, gun: g }); }
        }
      } else {
        g.reloadT -= dt;
        if (g.reloadT <= 0) {
          const take = Math.min(g.def.mag - g.mag, g.reserve);
          g.mag += take; g.reserve -= take; g.reloading = false;
          this.sim.emit('reloaded', { actor: this, gun: g });
        }
      }
    } else {
      if (c.reload && !g.full && g.reserve > 0 && this.mode !== 'vault') this.startReload();
      else if (g.empty && g.reserve > 0 && !c.fire) this.startReload();
    }
    c.reload = false;
    // trigger (weapons are safed during the preparation phase)
    if (this.sim.round && this.sim.round.inPrep() && !(this.team === 'def' && this.sim.devices.drones.some((d) => !d.dead && d.team !== this.team))) c.fire = false;
    const rising = c.fire && !this.trigPrev;
    if (c.fire && !g.reloading && g.cd <= 0 && g.draw <= 0 && !this.busy && this.mode !== 'vault' && !(this.shield && this.shield.up && this.cur === 0 && !this.gunWithShield(g))) {
      if (g.mag > 0 && (g.def.auto || rising)) {
        if (g.def.delay) { g.pending = g.def.delay; g.cd = 60 / g.def.rpm; g.mag--; } else this.sim.fire(this, g, false);
      } else if (g.mag <= 0 && rising) { this.sim.emit('dryfire', { actor: this }); if (g.reserve > 0) this.startReload(); }
    }
    this.trigPrev = c.fire;
  }
  gunWithShield(g) { return g.def.cls === 'HG'; }
  startReload() {
    const g = this.gun; if (!g || g.reloading || g.full || g.reserve <= 0) return false;
    g.reloading = true;
    const rig = g.def.rig;
    g.reloadT = RELOAD_TIME[rig] * (g.mag === 0 ? (EMPTY_MULT[rig] || 1) : 1);
    if (rig === 'shotgun') { g.shellT = RELOAD_TIME.shotgun; }
    this.sim.emit('reload', { actor: this, gun: g }); this.sim.noise(this.pos, this.suppressed ? 2 : 7, 'reload', this);
    return true;
  }
  switchGun(i) {
    if (i === this.cur || i >= this.guns.length) return false;
    const g = this.gun; if (g) { g.reloading = false; g.pending = 0; }
    this.cur = i; this.guns[i].draw = 0.55; this.sim.emit('swap', { actor: this, to: i });
    return true;
  }
  addAmmo(frac = 0.5) { for (const g of this.guns) g.reserve = Math.min(g.def.mag * g.def.reserve, g.reserve + Math.round(g.def.mag * g.def.reserve * frac)); }

  // ------------------------------------------------------------------ damage
  hurt(amount, o = {}) {
    if (!this.alive && !(this.downed && !o.quiet)) return false;
    if (this.sim.godmode && this.isPlayer) return false;
    // nobody can be hurt by another player during preparation, and a fresh spawn is protected
    if (o.src && o.src !== this && this.sim.round && this.sim.round.inPrep() && !this.sim.allowPrepDamage) return false;
    if (this.spawnProtected && !o.fall && !o.void) return false;
    const reg = o.region || 'torso';
    if (!o.ignoreArmor) {
      amount *= 1 - this.armor * 0.045; // heavier armour soaks a little of each hit
      if (this.armorPlates > 0 && reg !== 'head') amount *= 0.82;
    }
    if (reg === 'head' && !o.noHeadshot) { // a headshot kills outright (shotgun pellets and gas do not)
      amount = o.pellet ? amount * 1.6 : 9999;
    } else if (reg === 'legs') amount *= 0.8;
    amount = Math.max(0, amount);
    this.hp -= amount;
    if (o.src && o.src !== this) {
      this.lastDamager = o.src; this.damagers.set(o.src.id, this.sim.time);
      if (o.src.stats) o.src.stats.damage += Math.min(amount, 150);
    }
    this.lastHurtT = this.sim.time;
    if (!o.quiet) this.sim.emit('hurt', { actor: this, amount, src: o.src, region: reg, from: o.from, wpn: o.wpn });
    if (this.hp <= 0) {
      if (this.state === 'downed') this.die(o);
      else if (reg === 'head' || o.explosion || o.fall || o.fatal || !this.sim.downEnabled || o.void) this.die(o);
      else this.down(o);
      return true;
    }
    return false;
  }
  down(o) {
    this.state = 'downed'; this.hp = 30; this.downT = 28; this.stance = PRONE; this.busy = null; this.shield && (this.shield.up = false);
    this.lastDamager = o.src || this.lastDamager;
    // a takedown is a kill on the scoreboard (the kill feed says "downed"); finishing or reviving does not change it
    this.downCredit = null; const k = o.src;
    if (k && k !== this && k.stats) {
      if (k.team !== this.team) {
        k.stats.kills++; k.stats.downs++; k.stats.score += o.region === 'head' ? 125 : 100; if (o.region === 'head') k.stats.headshots++; this.downCredit = k;
        for (const [id, t] of this.damagers) if (id !== k.id && this.sim.time - t < 8) { const a = this.sim.byId(id); if (a && a.team !== this.team) { a.stats.assists++; a.stats.score += 40; } }
      } else k.stats.score -= 150;
    }
    this.sim.emit('down', { actor: this, src: o.src, wpn: o.wpn });
  }
  revive(by) { if (!this.downed) return; this.state = 'alive'; this.hp = Math.round(this.maxHp * 0.35); this.stance = CROUCH; this.downCredit = this.downCredit; if (by && by.stats && by !== this) { by.stats.revives++; by.stats.score += 50; } this.sim.emit('revive', { actor: this, by }); }
  die(o = {}) {
    if (this.dead) return;
    const was = this.state; this.state = 'dead'; this.hp = 0; this.diedAt = this.sim.time; this.busy = null; this.stats.deaths++;
    const killer = o.src || this.lastDamager;
    if (this.downCredit) { // already counted when it went down: finishing it is worth a little, bleeding out nothing
      if (killer && killer !== this.downCredit && killer.team !== this.team && killer.stats) killer.stats.score += 25;
    } else {
      if (killer && killer !== this && killer.stats) {
        if (killer.team !== this.team) { killer.stats.kills++; killer.stats.score += o.region === 'head' ? 125 : 100; if (o.region === 'head') killer.stats.headshots++; } else killer.stats.score -= 150;
      }
      for (const [id, t] of this.damagers) if (killer && id !== killer.id && this.sim.time - t < 8) { const a = this.sim.byId(id); if (a && a.team !== this.team) { a.stats.assists++; a.stats.score += 40; } }
    }
    this.downCredit = null;
    this.sim.emit('death', { actor: this, killer, region: o.region, wpn: o.wpn, headshot: o.region === 'head', bleed: !!o.bleed, from: o.from, explosion: !!o.explosion, was });
  }
  applyStatus(k, t) { this.status[k] = Math.max(this.status[k], t); }
}
void TAU; void wrapAngle; void STOREY;
