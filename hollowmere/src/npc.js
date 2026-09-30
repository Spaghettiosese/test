// People of Hollowmere. Every NPC lives by a schedule (poi + activity per stretch of the day),
// walks the 1 m navigation grid with A*, and, if they are a guard, watches, listens, investigates,
// raises the alarm and fights. Villagers flee. The dead fall as physics ragdolls and can be looted.
import * as E from '../../engine/index.js';
import { createPerson } from './people/index.js';

const D2R = Math.PI / 180;
const hyp = Math.hypot;
const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
const ACT_CLIP = { sit: 'Sit', eat: 'Sit Eat', drink: 'Drink', work: 'Hammer', sweep: 'Sweep', pray: 'Pray', kneel: 'Pray', talk: 'Talk', stand: 'Idle', guard: 'Stand Guard', sleep: 'Sleep', arms: 'Arms Crossed', warm: 'Warm Hands', cook: 'Sweep', weave: 'Sweep', idle: 'Idle' };
const HELD = { work: 'hammer', sweep: 'broom', drink: 'mug', cook: 'mug' };
const HANDS = { pale: 1 };
let NEXT_ID = 1;

export class NPC {
  constructor(game, def) {
    this.g = game; this.def = def; this.id = def.id || 'npc' + NEXT_ID++; this.name = def.name || 'Villager'; this.role = def.role || 'villager';
    this.guard = this.role === 'guard' || this.role === 'captain' || def.hostile === true;
    this.spec = def.spec; this.schedule = def.schedule || []; this.talkable = !!def.dialogue; this.dialogue = def.dialogue || null;
    this.x = def.pos[0]; this.z = def.pos[1]; this.yaw = (def.yaw ?? 0) * D2R; this.y = game.nav.floorAt(this.x, this.z);
    this.maxHp = def.hp ?? (this.guard ? 60 : 30); this.hp = this.maxHp;
    this.ch = createPerson(this.spec, { detail: def.detail ?? 0.4 });
    this.ch.userData.npc = this; game.scene.add(this.ch);
    this.body = new E.Body({ shape: new E.Capsule(0.3, 0.6), type: 'kinematic', position: [this.x, this.y + 0.9, this.z], group: 8 });
    this.body.userData.kind = 'npc'; this.body.userData.npc = this; game.world.add(this.body);
    this.state = 'routine'; this.mode = 'idle'; this.anim = ''; this.activity = null; this.slot = null; this.slotKey = ''; this.poi = null;
    this.path = null; this.pathI = 0; this.goal = null; this.speed = 0; this.wantSpeed = 0; this.repathT = 0; this.stuckT = 0;
    this.alert = 0; this.stim = null; this.searchT = 0; this.lostT = 0; this.seeT = 0; this.sees = false; this.attackCd = 0; this.atk = null; this.stagger = 0; this.blockT = 0;
    this.active = true; this.dead = false; this.asleep = false; this.lying = false; this.seated = false; this.timer = Math.random() * 3; this.barkT = 0; this.idleT = 0; this.routeI = 0; this.routeDir = 1; this.pauseT = 0;
    this.percT = Math.random() * 0.2; this.wanderT = 0; this.fleeFrom = null; this.discovered = false; this.loot = def.loot || []; this.hostile = this.guard; this.detect = 0;
    this.held = null; this.dist = 0; this.visible = true; this.knownDoor = null; this.tookHit = 0; this.surrender = false; this.spawn = { x: this.x, z: this.z };
    this.hand = null; this.ragdoll = null; this.frozen = false;
    this.tactic = 'engage'; this.ringK = Math.floor(Math.random() * 3); this.tacticPt = null; this.dodgeCd = 0; this.dodgeT = 0; this.dodgeV = [0, 0]; this.ranged = this.spec.weapon === 'crossbow'; this.shotT = 1 + Math.random(); this.calledHelp = false;
    this.strafe = Math.random() < 0.5 ? 1 : -1; this.strafeT = 0; this.searchPt = null; this.lookT = 0; this.retreatT = 0; this.lastVel = [0, 0]; this.feintDone = false;
    if (def.weapon !== null && (this.guard || def.weapon)) { this.ch.hold('R', def.weapon || (this.role === 'captain' ? 'captain' : 'sword')); this.armed = true; }
    this.ch.mixer.on((e) => this.onAnimEvent(e));
    this.applyPose();
    this.ch.update(0.016);
  }
  get pos() { return [this.x, this.y, this.z]; }
  get eye() { return [this.x, this.y + 1.62 * (this.spec.height || 1) * (this.lying ? 0.2 : this.seated ? 0.72 : 1), this.z]; }
  get fwd() { return [Math.sin(this.yaw), Math.cos(this.yaw)]; }

  // ------------------------------------------------------------ animation plumbing
  setAnim(name, fade = 0.3) { if (this.anim === name) return; this.anim = name; this.ch.mixer.setWeights({ [name]: 1 }, fade); this.ch.mixer.timeScale = 1; }
  setLoco(speed) {
    const m = this.ch.mixer, W = 1.15, R = 2.9; this.anim = '';
    if (speed < 0.12) { m.setWeights({ Idle: 1 }, 0.25); m.timeScale = 1; return; }
    if (speed <= W) { const t = speed / W; m.setWeights({ Walk: Math.min(1, t * 1.5), Idle: Math.max(0, 1 - t * 1.5) }, 0.2); m.timeScale = Math.max(0.55, t); return; }
    const t = Math.min(1, (speed - W) / (R - W)); m.setWeights({ Walk: 1 - t, Run: t }, 0.2); m.timeScale = t < 0.5 ? speed / W * 0.75 : speed / R;
  }
  applyPose() {
    // the character node follows the simulation (standing, sitting or lying)
    const c = this.ch, h = this.spec.height || 1;
    if (this.lying) { c.position.set([this.lyingPos[0], this.lyingPos[1], this.lyingPos[2]]); E.quat.fromEuler(c.rotation, -90, this.lyingYaw, 0); }
    else { c.position.set([this.x, this.y + (this.seated ? this.seatDrop : 0), this.z]); E.quat.fromEuler(c.rotation, 0, this.yaw / D2R, 0); }
    void h;
  }
  face(x, z, rate, dt) { const want = Math.atan2(x - this.x, z - this.z); this.yaw += angDiff(want, this.yaw) * -1 * Math.min(1, rate * dt) * -1; this.yaw = this.yaw; }
  turnTo(yaw, rate, dt) { this.yaw += angDiff(yaw, this.yaw) * Math.min(1, rate * dt) * -1 * -1; }
  hold(prop) { if (this.held === prop) return; this.held = prop; this.ch.hold('L', prop === 'mug' ? 'mug' : null); if (prop && prop !== 'mug') this.ch.hold('R', prop); else if (!prop && this.armed) this.ch.hold('R', this.def.weapon || (this.role === 'captain' ? 'captain' : 'sword')); else if (prop === 'mug') { this.ch.hold('R', 'mug'); this.ch.hold('L', null); } }
  bark(text, pitch = 1) { if (this.barkT > 0 || this.dead || this.role === 'hollow') return; this.barkT = 3.5; this.g.bark(this, text, pitch); }
  onAnimEvent(e) {
    if (e.name === 'hit' && this.atk && !this.atk.hit) this.strike();
    if (e.name === 'clang') { this.g.sfx.clang?.(0.5, this.pos); this.g.noise(this.pos, 10, 'clang', this); }
  }

  // ------------------------------------------------------------ schedule
  currentSlot() { const h = this.g.clock.hours; for (const s of this.schedule) if (s.h0 <= s.h1 ? h >= s.h0 && h < s.h1 : h >= s.h0 || h < s.h1) return s; return this.schedule[0] || null; }
  slotChanged(s) { this.slot = s; this.leaveActivity(); this.poi = null; this.route = null; this.stopMove(); this.timer = 0; this.wanderT = 0; this.pauseT = 0; this.g.wakeIfSleeping?.(this); }
  leaveActivity() {
    if (this.lying || this.seated) { const p = this.poi; this.lying = false; this.seated = false; if (p) { const w = p.walk || p.approach; this.x = w[0]; this.z = w[1]; } this.y = this.g.nav.floorAt(this.x, this.z); this.g.wakeSleeper?.(this); }
    this.activity = null; this.anim = ''; if (this.held) this.hold(null); this.ch.upper.fadeWeight?.(1, 0.1); this.showSword(true);
  }
  showSword(v) { const s = this.ch.holding?.R; if (s && this.armed) s.visible = v; }
  stopMove() { this.path = null; this.goal = null; this.wantSpeed = 0; }

  // place the person where their schedule says they are right now (used when the world is created)
  snapToSchedule() {
    const s = this.currentSlot(); if (!s) return;
    this.slotKey = (s.poi || s.route || s.wander || '') + s.act + s.h0; this.slot = s;
    const L = this.g.level;
    if (s.poi && L.pois[s.poi]) { const p = L.pois[s.poi]; const w = p.walk || (p.walk = this.g.nav.nearestWalkable(p.approach[0], p.approach[1], 4) || p.approach); this.x = w[0]; this.z = w[1]; this.y = this.g.nav.floorAt(this.x, this.z); this.arrive(s, p); }
    else if (s.route && L.routes[s.route]) { const R = L.routes[s.route]; this.routeI = Math.floor(Math.random() * R.pts.length); const t = R.pts[this.routeI]; this.x = t[0]; this.z = t[1]; this.y = s.y ?? this.g.nav.floorAt(this.x, this.z); this.routeI = (this.routeI + 1) % R.pts.length; }
    else if (s.wander) { const names = Object.keys(L.pois).filter((k) => k.startsWith(s.wander)); if (names.length) { const p = L.pois[names[Math.floor(Math.random() * names.length)]]; this.x = p.approach[0]; this.z = p.approach[1]; this.y = this.g.nav.floorAt(this.x, this.z); } }
    this.applyPose(); this.body.position = [this.x, this.y + 0.9, this.z];
  }

  // ------------------------------------------------------------ movement
  goTo(x, z, speed = 1.3) {
    if (this.g.pathBudget <= 0) { this.pendingGoal = [x, z, speed]; return false; }
    this.g.pathBudget--; this.pendingGoal = null;
    const p = this.g.nav.findPath(this.x, this.z, x, z, { mode: 1 });
    this.goal = [x, z]; this.wantSpeed = speed; this.path = p; this.pathI = 0; this.stuckT = 0; this.repathT = 1.2;
    if (!p) { this.wantSpeed = 0; return false; }
    return true;
  }
  // moves along the current path; returns true when it arrives
  stepPath(dt) {
    if (!this.path || !this.path.length) { this.speed += (0 - this.speed) * Math.min(1, dt * 8); return true; }
    const t = this.path[this.pathI];
    const dx = t[0] - this.x, dz = t[1] - this.z, d = hyp(dx, dz);
    const last = this.pathI === this.path.length - 1;
    if (d < (last ? 0.22 : 0.4)) { this.pathI++; if (this.pathI >= this.path.length) { this.path = null; return true; } return false; }
    const want = Math.atan2(dx, dz), turn = angDiff(want, this.yaw);
    this.yaw += -turn * -1 * Math.min(1, dt * (this.state === 'chase' ? 12 : 7));
    this.yaw = this.yaw; // (angDiff sign handled below)
    const ahead = Math.abs(turn) < 1.2 ? 1 : 0.3;
    const target = this.wantSpeed * ahead * (last ? Math.min(1, 0.4 + d) : 1);
    this.speed += (target - this.speed) * Math.min(1, dt * 6);
    this.moveBy(Math.sin(this.yaw) * this.speed * dt, Math.cos(this.yaw) * this.speed * dt);
    // doors: open anything shut in our way
    this.doorCheck(dt);
    this.stuckT = this.speed < 0.2 * this.wantSpeed ? this.stuckT + dt : 0;
    if (this.stuckT > 1.4) { this.stuckT = 0; if (this.goal) this.goTo(this.goal[0], this.goal[1], this.wantSpeed); }
    return false;
  }
  moveBy(dx, dz) {
    const nav = this.g.nav, r = 0.28;
    const ok = (x, z) => !nav.isBlocked(x + r, z) && !nav.isBlocked(x - r, z) && !nav.isBlocked(x, z + r) && !nav.isBlocked(x, z - r);
    if (ok(this.x + dx, this.z + dz)) { this.x += dx; this.z += dz; }
    else if (ok(this.x + dx, this.z)) this.x += dx; else if (ok(this.x, this.z + dz)) this.z += dz;
    // gently push apart from neighbours
    for (const o of this.g.nearNpcs(this, 0.7)) { const ox = this.x - o.x, oz = this.z - o.z, l = hyp(ox, oz) || 1; if (l < 0.6) { const p = (0.6 - l) * 0.5; if (ok(this.x + ox / l * p, this.z + oz / l * p)) { this.x += ox / l * p; this.z += oz / l * p; } } }
    const ty = nav.floorAt(this.x, this.z); this.y += (ty - this.y) * 0.35;
  }
  doorCheck(dt) {
    const f = this.fwd;
    for (const d of this.g.level.doors) {
      if (d.gate || d.isOpen() || d.jammed) continue;
      const dx = d.x - this.x, dz = d.z - this.z;
      if (dx * dx + dz * dz < 5.2 && dx * f[0] + dz * f[1] > -0.3) { d.open(this.x, this.z); this.g.sfx.door?.(true, [d.x, 1, d.z]); }
    }
  }

  // ------------------------------------------------------------ main update
  update(dt) {
    if (this.dead) return this.updateDead(dt);
    if (this.rising > 0) { this.rising -= dt; this.y = this.g.nav.floorAt(this.x, this.z) - this.rising * 1.0; this.applyPose(); this.body.position[1] = this.y + 0.9; if (this.rising <= 0) this.anim = ''; return; }
    if (this.dormant) { this.dist = hyp(this.x - this.g.player.pos[0], this.z - this.g.player.pos[2]); this.setAnim('Idle', 0.1); this.applyPose(); return; }
    if (this.dodgeT > 0) { this.dodgeT -= dt; this.moveBy(this.dodgeV[0] * dt, this.dodgeV[1] * dt); }
    this.dodgeCd -= dt; this.shotT -= dt;
    this.barkT = Math.max(0, this.barkT - dt); this.attackCd = Math.max(0, this.attackCd - dt); this.stagger = Math.max(0, this.stagger - dt); this.tookHit = Math.max(0, this.tookHit - dt);
    const P = this.g.player;
    this.dist = hyp(this.x - P.pos[0], this.z - P.pos[2]);
    if (this.pendingGoal && this.g.pathBudget > 0) this.goTo(...this.pendingGoal);
    if (this.state === 'routine' || this.state === 'notice') this.updateRoutine(dt);
    this.updateReaction(dt);
    if (this.guard) this.perceive(dt);
    this.updateState(dt);
    // body & node
    this.applyPose();
    this.body.position[0] = this.x; this.body.position[1] = this.y + 0.9; this.body.position[2] = this.z;
    this.body.velocity = [Math.sin(this.yaw) * this.speed, 0, Math.cos(this.yaw) * this.speed];
  }

  updateRoutine(dt) {
    const s = this.currentSlot();
    if (!s) { this.setLoco(0); return; }
    const key = (s.poi || s.route || s.wander || '') + s.act + s.h0;
    if (key !== this.slotKey) { this.slotKey = key; this.slotChanged(s); }
    if (this.state === 'notice') return;
    const g = this.g;
    // far away: teleport straight to the slot's place instead of walking the whole town
    if (this.dist > 70 && !this.arrived && s.poi && !s.route) { const p = g.level.pois[s.poi]; if (p) { const w = p.walk || (p.walk = g.nav.nearestWalkable(p.approach[0], p.approach[1], 4) || p.approach); this.x = w[0]; this.z = w[1]; this.arrive(s, p); return; } }
    if (s.route) return this.doRoute(s, dt);
    if (s.wander) return this.doWander(s, dt);
    const p = g.level.pois[s.poi];
    if (!p) { this.setLoco(0); return; }
    if (this.activity) { this.doActivity(dt); return; }
    // walk to the nearest free cell to the place, then step into it
    const w = p.walk || (p.walk = g.nav.nearestWalkable(p.approach[0], p.approach[1], 4) || p.approach);
    const near = hyp(this.x - w[0], this.z - w[1]) < 0.6 || hyp(this.x - p.approach[0], this.z - p.approach[1]) < 0.7;
    if (!this.path && !this.goal) {
      if (near) { this.arrive(s, p); return; }
      this.goTo(w[0], w[1], s.speed || 1.25);
      if (!this.path) { this.repathT = 3; }
    }
    if (this.path) { if (this.stepPath(dt)) this.goal = null; this.setLoco(this.speed); if (!this.path && (near || hyp(this.x - w[0], this.z - w[1]) < 1.6)) this.arrive(s, p); }
    else { this.setLoco(this.speed); if (this.repathT > 0) this.repathT -= dt; else { this.goal = null; this.repathT = 2; } }
  }
  arrive(s, p) {
    this.arrived = true; this.stopMove(); this.poi = p; this.activity = s.act || 'stand';
    this.speed = 0; this.setLoco(0);
    if (p.type === 'sleep' || this.activity === 'sleep') {
      this.lying = true; this.lyingPos = [p.x, p.y + 0.08, p.z]; this.lyingYaw = p.yaw; this.setAnim('Sleep', 0.1); this.asleep = true; this.showSword(false); this.g.registerSleeper?.(this); return;
    }
    if (p.type === 'sit') { this.seated = true; this.seatDrop = p.y - this.g.nav.floorAt(p.x, p.z) - 0.02; this.x = p.x; this.z = p.z; this.yaw = p.yaw * D2R; this.y = this.g.nav.floorAt(p.x, p.z); this.setAnim(this.activity === 'eat' ? 'Sit Eat' : 'Sit', 0.2); if (this.activity === 'eat') this.hold('mug'); this.showSword(false); return; }
    if (p.type === 'kneel') { this.x = p.x; this.z = p.z; this.yaw = p.yaw * D2R; this.setAnim('Pray', 0.3); return; }
    this.yaw = p.yaw * D2R;
    const clip = ACT_CLIP[this.activity] || 'Idle';
    this.setAnim(clip, 0.3);
    if (HELD[this.activity]) this.hold(HELD[this.activity]);
    if (this.guard) this.setGuardStance(true);
  }
  setGuardStance(on) { if (this.guard && this.armed) { if (on) this.ch.armR.playOnce ? this.ch.armR.play('Sword Rest', { fade: 0.2 }) : 0; } }
  doActivity(dt) {
    this.speed += (0 - this.speed) * Math.min(1, dt * 8);
    const a = this.activity;
    this.idleT += dt;
    if (a === 'work' && Math.random() < dt * 0.0) return;
    if (this.guard && this.idleT > 12 + (this.id.length % 5) * 3) { this.idleT = 0; this.ch.upper.playOnce('Look Around', { fadeIn: 0.3, fadeOut: 0.5 }); }
    // talk to a neighbour: face the player when he is close & we are just standing
    if ((a === 'stand' || a === 'talk') && !this.guard && this.dist < 3.2 && !this.seated && !this.lying && this.g.player.visibility > 0.1) { const yaw = Math.atan2(this.g.player.pos[0] - this.x, this.g.player.pos[2] - this.z); this.yaw += angDiff(yaw, this.yaw) * Math.min(1, dt * 1.5) * -1 * -1; }
  }
  doRoute(s, dt) {
    const R = this.g.level.routes[s.route]; if (!R) return;
    if (this.pauseT > 0) { this.pauseT -= dt; this.setLoco(0); this.speed = 0; if (this.pauseT <= 0) this.ch.upper.fadeWeight?.(1, 0.1); return; }
    if (this.activity) { this.leaveActivity(); }
    if (!this.path && !this.goal) {
      if (this.routeI >= R.pts.length || this.routeI < 0) { this.routeI = 0; this.routeDir = 1; }
      const t = R.pts[this.routeI];
      if (s.sentry) { this.path = [[t[0], t[1]]]; this.pathI = 0; this.wantSpeed = s.speed || 1.0; this.goal = t; }
      else this.goTo(t[0], t[1], s.speed || 1.35);
      if (!this.path) { this.routeI = (this.routeI + 1) % R.pts.length; return; }
    }
    if (this.path) {
      if (s.sentry) { const t = this.path[0], dx = t[0] - this.x, dz = t[1] - this.z, d = hyp(dx, dz); if (d < 0.3) { this.path = null; this.goal = null; } else { this.yaw += angDiff(Math.atan2(dx, dz), this.yaw) * -1 * -1 * Math.min(1, dt * 4); this.speed += ((s.speed || 1) - this.speed) * Math.min(1, dt * 4); this.x += Math.sin(this.yaw) * this.speed * dt; this.z += Math.cos(this.yaw) * this.speed * dt; this.y = s.y ?? this.y; } if (!this.path) this.reachedWaypoint(R, s); }
      else if (this.stepPath(dt)) { this.goal = null; this.reachedWaypoint(R, s); }
      this.setLoco(this.speed);
      if (this.guard && this.armed) this.ch.armR.play('Sword Rest', { fade: 0.3 });
    }
  }
  reachedWaypoint(R, s) {
    if (R.loop) this.routeI = (this.routeI + 1) % R.pts.length;
    else { this.routeI += this.routeDir; if (this.routeI >= R.pts.length || this.routeI < 0) { this.routeDir *= -1; this.routeI += this.routeDir * 2; } }
    this.pauseT = 0.4 + Math.random() * (s.pause ?? 2.5); this.speed = 0; this.setLoco(0);
    if (this.guard && Math.random() < 0.5) this.ch.upper.playOnce('Look Around', { fadeIn: 0.3, fadeOut: 0.6 });
  }
  doWander(s, dt) {
    if (this.activity) this.leaveActivity();
    if (this.wanderT > 0 && !this.path) { this.wanderT -= dt; this.setLoco(0); this.speed = 0; if (this.wanderT <= 0) this.pickWander(s); return; }
    if (!this.path && !this.goal) { this.pickWander(s); return; }
    if (this.stepPath(dt)) { this.goal = null; this.wanderT = 3 + Math.random() * 7; this.setLoco(0); this.setAnim(Math.random() < 0.3 ? 'Talk' : 'Idle', 0.3); return; }
    this.setLoco(this.speed);
  }
  pickWander(s) {
    const L = this.g.level.pois, names = Object.keys(L).filter((k) => k.startsWith(s.wander));
    if (!names.length) return;
    const p = L[names[Math.floor(Math.random() * names.length)]];
    this.goTo(p.approach[0] + (Math.random() - 0.5), p.approach[1] + (Math.random() - 0.5), s.speed || 1.0);
  }

  // ------------------------------------------------------------ reactions of ordinary people
  updateReaction(dt) {
    if (this.guard || this.role === 'hollow') return;
    if (this.state === 'flee') {
      this.fleeT -= dt;
      if (!this.path || this.repathT < 0) { this.repathT = 1.5; this.pickFleeGoal(); }
      this.repathT -= dt;
      if (this.path) { if (this.stepPath(dt)) { this.state = 'cower'; this.setAnim('Cower', 0.2); this.cowerT = 6; } this.setLoco(this.speed); }
      if (this.fleeT <= 0) { this.state = 'routine'; this.slotKey = ''; this.anim = ''; }
    } else if (this.state === 'cower') {
      this.cowerT -= dt; this.speed = 0; if (this.cowerT <= 0 && this.g.player.pos && hyp(this.x - this.g.player.pos[0], this.z - this.g.player.pos[2]) > 12) { this.state = 'routine'; this.slotKey = ''; this.anim = ''; }
    } else if (this.state === 'handsup') { this.speed = 0; }
  }
  pickFleeGoal() {
    const g = this.g, P = g.player.pos, dx = this.x - P[0], dz = this.z - P[2], l = hyp(dx, dz) || 1;
    // home if it is far enough from the danger, otherwise straight away from it
    const home = this.homePoi();
    let gx = this.x + (dx / l) * 14, gz = this.z + (dz / l) * 14;
    if (home && hyp(home.approach[0] - P[0], home.approach[1] - P[2]) > 8) { gx = home.approach[0]; gz = home.approach[1]; }
    const q = g.nav.nearestWalkable(gx, gz, 6);
    if (q) this.goTo(q[0], q[1], 3.6);
  }
  homePoi() { const s = this.schedule.find((x) => x.act === 'sleep'); return s ? this.g.level.pois[s.poi] : null; }
  scare(from, secs = 12) {
    if (this.guard || this.dead || this.role === 'hollow' || this.state === 'handsup') return;
    if (this.lying || this.seated) this.leaveActivity();
    if (this.state === 'flee') { this.fleeT = Math.max(this.fleeT, secs); return; }
    this.state = 'flee'; this.fleeT = secs; this.repathT = 0; this.path = null; this.goal = null;
    if (Math.random() < 0.7) this.bark(['Help!', 'Guards!', 'Murder!', 'Stay away!', 'No, please!'][Math.floor(Math.random() * 5)], this.spec.voice || 1);
    this.g.noise(this.pos, 12, 'scream', this);
  }

  // ------------------------------------------------------------ guards: seeing & hearing
  perceive(dt) {
    if (this.dead || this.stagger > 0.3) return;
    const gm = this.g.mode; if (gm !== 'play' && gm !== 'talk' && gm !== 'read' && gm !== 'journal') return;
    this.percT -= dt; if (this.percT > 0) return; this.percT = 0.14 + Math.random() * 0.04;
    const g = this.g, P = g.player, eye = this.eye;
    let seen = false, gain = 0;
    const pd = this.dist;
    // asleep or out cold: nothing
    const range = (g.clock.night ? 13 : 20) * (0.45 + 0.75 * Math.min(1.2, P.visibility)) * (this.state === 'chase' ? 1.5 : 1) * (this.def.eyes || 1);
    if (!P.dead && pd < range + 2) {
      const dx = P.pos[0] - this.x, dz = P.pos[2] - this.z, f = this.fwd, c = (dx * f[0] + dz * f[1]) / (pd || 1);
      const near = 1.7 * (P.crouch ? 0.6 : 1) * (P.veilT > 0 ? 0.5 : 1);
      const inCone = c > Math.cos(58 * D2R) || (pd < near && c > -0.15) || (this.state !== 'routine' && this.state !== 'notice' && c > Math.cos(110 * D2R));
      if (inCone && Math.abs(P.pos[1] - this.y) < 4.5) {
        const head = [P.pos[0], P.pos[1] + (P.crouch ? 1.0 : 1.55), P.pos[2]];
        if (g.canSee(eye, head, this.body)) {
          seen = true;
          const k = pd < 2.2 ? 2.2 : 1;
          gain = (1 - Math.min(1, pd / range)) ** 0.7 * (0.3 + P.visibility * 0.9) * (0.6 + 0.4 * Math.max(0, c)) * k;
          this.g.zoneBonus?.(this, P) && (gain *= 1.5);
        }
      }
    }
    this.sees = seen;
    if (seen) {
      this.lostT = 0; this.lastSeen = [P.pos[0], P.pos[1], P.pos[2]];
      this.alert = Math.min(1.2, this.alert + gain * 1.15 * (0.14 + 0.05) * 3.0);
      this.detect = Math.max(this.detect, this.alert);
      if (this.alert >= 1 && this.state !== 'chase' && this.state !== 'attack') this.spotted();
      else if (this.alert > 0.3 && this.state === 'routine') this.noticed(this.lastSeen, 'sight');
    } else {
      this.alert = Math.max(0, this.alert - 0.05 * 0.16 * (this.state === 'routine' ? 3 : 1));
      if (this.state === 'chase' || this.state === 'attack') { this.lostT += 0.16; if (this.lostT > 5) this.loseTrack(); }
    }
    // bodies and dark torches
    if (this.state === 'routine' || this.state === 'notice') this.scanWorld(eye);
  }
  scanWorld(eye) {
    const g = this.g, f = this.fwd;
    for (const n of g.npcs) {
      if (!n.dead || n.discovered) continue;
      const dx = n.x - this.x, dz = n.z - this.z, d = hyp(dx, dz);
      if (d > 14 || (dx * f[0] + dz * f[1]) / (d || 1) < 0.3) continue;
      if (g.canSee(eye, [n.x, n.y + 0.4, n.z], this.body)) { n.discovered = true; this.bark('A body! Sound the alarm!'); g.alarm([n.x, n.y, n.z], 'body', this); this.stim = [n.x, n.z]; this.state = 'investigate'; return; }
    }
    if (this.state === 'routine') for (const t of g.level.torches) {
      if (t.lit || !t.wasLit || t.small || t.noticed > g.time - 25) continue;
      const dx = t.x - this.x, dz = t.z - this.z, d = hyp(dx, dz);
      if (d > 12 || (dx * f[0] + dz * f[1]) / (d || 1) < 0.5) continue;
      t.noticed = g.time; this.bark('Torch has gone out... odd.'); this.noticed([t.x, this.y, t.z], 'torch'); this.relight = t; return;
    }
  }
  hear(pos, radius, kind, srcNpc) {
    if (this.dead || this.state === 'chase' || this.state === 'attack' || this.asleepDeep) return;
    const d = hyp(pos[0] - this.x, pos[2] - this.z);
    let eff = radius * (this.g.nav.los(this.x, this.z, pos[0], pos[2]) ? 1 : 0.55);
    if (this.lying) eff *= 0.5;
    if (d > eff) return;
    const s = 1 - d / eff;
    const strong = ['clang', 'combat', 'scream', 'glass', 'crash', 'alarm', 'slam'].includes(kind);
    if (srcNpc === this) return;
    if (this.guard) {
      if (strong) this.alert = Math.min(1, Math.max(this.alert, 0.6 * (0.5 + s)));
      else this.alert = Math.min(1, this.alert + (kind === 'step' ? 0.17 : 0.3) * (0.5 + s));
      if (kind === 'scream' || kind === 'alarm' || kind === 'slam') this.alert = Math.max(this.alert, 0.8);
      if (this.alert > 0.3) this.noticed(pos, kind);
    } else if (this.lying && strong && d < eff * 0.6) { this.g.wakeSleeper?.(this); this.lying = false; this.asleep = false; this.leaveActivity(); this.bark('Wh-what?'); }
    else if (!this.guard && (kind === 'scream' || kind === 'combat' || kind === 'slam') && d < 14) this.scare(pos, 8);
  }
  noticed(pos, kind) {
    if (this.state === 'chase' || this.state === 'attack' || this.state === 'stagger') return;
    if (this.lying) return;
    this.stim = [pos[0], pos[2]]; this.stimKind = kind;
    if (this.state !== 'notice' && this.state !== 'investigate') {
      this.state = 'notice'; this.noticeT = 0.9; this.stopMove();
      this.bark(kind === 'sight' ? ['Hm?', 'Who goes there?', 'What was that?'][Math.floor(Math.random() * 3)] : ['What was that?', 'Did you hear that?', 'Hello?'][Math.floor(Math.random() * 3)]);
      this.g.sfx.whisper && 0;
    } else if (this.state === 'investigate') this.goTo(pos[0], pos[2], 2.2);
  }
  spotted() {
    this.state = 'chase'; this.alert = 1; this.lostT = 0; this.repathT = 0; this.stopMove();
    this.bark(['Intruder!', 'Halt, thief!', 'There you are!', 'Alarm! Alarm!', 'Stop right there!'][Math.floor(Math.random() * 5)]);
    this.g.alarm(this.lastSeen || this.pos, 'spotted', this);
    this.g.combatT = Math.max(this.g.combatT, 8);
  }
  loseTrack() { this.state = 'search'; this.searchT = 14 + this.g.alarmLevel * 8; this.searchPt = null; this.lookT = 0; this.calledHelp = false; this.stim = this.lastSeen ? [this.lastSeen[0], this.lastSeen[2]] : null; this.alert = 0.6; this.stopMove(); this.bark('Where did he go?'); }

  // ------------------------------------------------------------ state machine for the alert states
  updateState(dt) {
    const P = this.g.player;
    switch (this.state) {
      case 'notice': {
        this.noticeT -= dt; this.speed *= 0.8; this.setLoco(0);
        if (this.stim) this.yaw += angDiff(Math.atan2(this.stim[0] - this.x, this.stim[1] - this.z), this.yaw) * Math.min(1, dt * 5) * -1 * -1;
        if (this.noticeT <= 0) { if (this.alert > 0.55 || this.relight) { this.state = 'investigate'; this.investT = 20; this.goTo(this.stim[0], this.stim[1], 2.0); } else { this.state = 'routine'; this.slotKey = ''; } }
        break;
      }
      case 'investigate': {
        this.investT -= dt;
        if (!this.path && this.stim) this.goTo(this.stim[0], this.stim[1], 2.0);
        const done = this.path ? this.stepPath(dt) : true; this.setLoco(this.speed);
        if (this.guard && this.armed) this.ch.armR.play('Guard Idle', { fade: 0.3 });
        if (done || this.investT <= 0 || hyp(this.x - this.stim[0], this.z - this.stim[1]) < 1.2) {
          if (this.relight) { const t = this.relight; this.relight = null; this.g.relight(t, this); }
          this.state = 'search'; this.searchT = 8; this.searchLook = 0; this.stopMove(); this.ch.upper.playOnce('Look Around', { fadeIn: 0.3, fadeOut: 0.6 });
        }
        break;
      }
      case 'search': {
        this.searchT -= dt; this.lookT -= dt;
        if (this.path) { this.stepPath(dt); this.setLoco(this.speed); }
        else {
          this.speed *= 0.85; this.setLoco(this.speed);
          if (this.searchPt && this.lookT <= 0 && !this.searchPt.done) {
            this.searchPt.done = true; this.lookT = 1.6;
            const o = this.searchPt.obj;
            if (this.searchPt.tag === 'door' && o && !o.isOpen()) { o.open(this.x, this.z); this.g.sfx.door?.(true, [o.x, 1, o.z]); }
            if (this.searchPt.tag === 'spot' && o) { this.bark(['Nobody in here.', 'Check the shelves.', 'Empty.'][Math.floor(Math.random() * 3)]); this.g.sfx.chest?.(); }
            this.ch.upper.playOnce('Look Around', { fadeIn: 0.3, fadeOut: 0.5 });
          }
          if (this.lookT <= 0) { const p = this.g.squad.pickSearchPoint(this); if (p) { this.searchPt = p; this.goTo(p.x, p.z, 1.9); } else this.lookT = 1; }
        }
        if (this.searchT <= 0) { this.state = 'routine'; this.alert = 0.1; this.slotKey = ''; this.anim = ''; this.arrived = false; this.ch.armR.play('Sword Rest', { fade: 0.3 }); this.bark(this.g.alarmLevel > 1.2 ? 'Stay sharp. He is still out there.' : 'Must have been nothing.'); }
        break;
      }
      case 'chase': {
        this.repathT -= dt;
        const dx = P.pos[0] - this.x, dz = P.pos[2] - this.z, d = hyp(dx, dz);
        if (this.sees || this.lostT < 1) { this.lastSeen = [P.pos[0], P.pos[1], P.pos[2]]; this.lastVel = [P.cc?.velocity?.[0] || 0, P.cc?.velocity?.[2] || 0]; }
        let tgt = this.lastSeen || P.pos;
        if (!this.sees && this.lostT > 0.4) tgt = [tgt[0] + this.lastVel[0] * Math.min(this.lostT, 1.6) * 0.6, tgt[1], tgt[2] + this.lastVel[1] * Math.min(this.lostT, 1.6) * 0.6]; // run to where he was heading
        this.reactDodge(dt, d);
        const cornered = d < 1.7 && this.sees;
        if (this.ranged || this.tactic === 'archer') { this.archerAI(dt, d, dx, dz); break; }
        if (d < 2.1 && this.sees && this.stagger <= 0 && (this.tactic === 'engage' || cornered)) { this.state = 'attack'; this.stopMove(); this.beginAttack(); break; }
        if (this.tactic === 'circle' && this.sees && d < 24 && !cornered) { this.circleAI(dt, d, dx, dz); break; }
        if ((this.tactic === 'flank' || this.tactic === 'cutoff') && this.tacticPt && this.sees && d > 5) {
          if (this.repathT <= 0 || !this.path) { this.repathT = 0.7; this.goTo(this.tacticPt[0], this.tacticPt[1], 4.4); }
          if (this.path) this.stepPath(dt); else this.circleAI(dt, d, dx, dz);
          this.setLoco(this.speed); break;
        }
        if (this.repathT <= 0 || !this.path) { this.repathT = 0.5; this.goTo(tgt[0], tgt[2], 4.2); }
        if (this.path) this.stepPath(dt);
        else { this.speed *= 0.9; }
        if (d < 3.5 && this.sees) this.yaw += angDiff(Math.atan2(dx, dz), this.yaw) * Math.min(1, dt * 10) * -1 * -1;
        this.setLoco(this.speed);
        if (this.guard && this.armed) this.ch.armR.play('Guard Idle', { fade: 0.2 });
        break;
      }
      case 'attack': {
        const dx = P.pos[0] - this.x, dz = P.pos[2] - this.z, d = hyp(dx, dz);
        this.speed *= 0.8; this.setLoco(this.speed);
        this.yaw += angDiff(Math.atan2(dx, dz), this.yaw) * Math.min(1, dt * (this.atk ? 3 : 9)) * -1 * -1;
        this.reactDodge(dt, d);
        if (this.atk) {
          this.atk.t += dt;
          if (this.atk.feint && this.atk.t > 0.28 && !this.atk.hit) { this.atk = null; this.attackCd = 0.22; this.feintDone = true; this.ch.upper.playOnce('Idle', { fadeIn: 0.1, fadeOut: 0.2 }); }
          else if (this.atk.t > this.atk.dur) { const c = this.comboLeft > 0 && d < 2.3; this.atk = null; this.attackCd = c ? 0.12 : 0.5 + Math.random() * 0.9; if (c) this.comboLeft--; else this.comboLeft = 0; }
        }
        else if (this.attackCd <= 0) { if (d < 2.4 && (this.sees || d < 1.5)) this.beginAttack(); else { this.state = 'chase'; this.repathT = 0; } }
        else if (d > 3.2) { this.state = 'chase'; this.repathT = 0; }
        else if (d < 1.3) this.moveBy(-dx / (d || 1) * 0.6 * dt, -dz / (d || 1) * 0.6 * dt); // give ground
        else { this.strafeT -= dt; if (this.strafeT <= 0) { this.strafeT = 0.8 + Math.random(); this.strafe = -this.strafe; } this.moveBy(-dz / (d || 1) * this.strafe * 0.9 * dt, dx / (d || 1) * this.strafe * 0.9 * dt); }
        break;
      }
      case 'retreat': {
        this.retreatT -= dt; this.repathT -= dt;
        if (this.repathT <= 0 || !this.path) {
          this.repathT = 1.2; let best = null, bd = 1e9;
          for (const o of this.g.npcs) if (o !== this && o.guard && !o.dead && o.state !== 'retreat') { const dd = hyp(o.x - this.x, o.z - this.z); if (dd > 4 && dd < bd && hyp(o.x - P.pos[0], o.z - P.pos[2]) > 5) { bd = dd; best = o; } }
          const tx = best ? best.x : this.x + (this.x - P.pos[0]) * 3, tz = best ? best.z : this.z + (this.z - P.pos[2]) * 3;
          const q = this.g.nav.nearestWalkable(tx, tz, 6); if (q) this.goTo(q[0], q[1], 4.6);
        }
        if (this.path) this.stepPath(dt); this.setLoco(this.speed);
        if (this.retreatT <= 0 || (!this.path && this.dist > 6)) { this.state = 'chase'; this.repathT = 0; this.tactic = 'circle'; }
        break;
      }
      case 'stagger': { this.stagger -= 0; this.speed *= 0.8; this.setLoco(0); if (this.stagger <= 0) { this.state = 'chase'; this.repathT = 0; } break; }
      case 'handsup': { this.setAnim('Hands Up', 0.25); this.speed = 0; break; }
      default: break;
    }
    if (this.state === 'routine' || this.state === 'flee' || this.state === 'cower') { /* handled */ }
  }
  reactDodge(dt, d) {
    const P = this.g.player;
    if (this.dodgeCd > 0 || this.dodgeT > 0 || this.atk || this.stagger > 0 || !P.atk || d > 2.7 || !this.sees) return;
    if (Math.random() > dt * 3.2) return;
    const s = Math.random() < 0.5 ? 1 : -1, l = d || 1;
    this.dodgeV = [-(P.pos[2] - this.z) / l * s * 5.5, (P.pos[0] - this.x) / l * s * 5.5]; this.dodgeT = 0.24; this.dodgeCd = 3 + Math.random() * 2;
    this.ch.upper.playOnce('Flinch', { fadeIn: 0.05, fadeOut: 0.15 });
  }
  circleAI(dt, d, dx, dz) {
    const ring = 3.6 + this.ringK * 0.7;
    this.strafeT -= dt; if (this.strafeT <= 0) { this.strafeT = 1.5 + Math.random() * 2; if (Math.random() < 0.4) this.strafe = -this.strafe; }
    const l = d || 1, rad = d > ring + 0.8 ? 1 : d < ring - 0.8 ? -1 : 0;
    this.yaw += angDiff(Math.atan2(dx, dz), this.yaw) * Math.min(1, dt * 8) * -1 * -1;
    const vx = (dx / l) * rad * 1.6 + (-dz / l) * this.strafe * 1.5, vz = (dz / l) * rad * 1.6 + (dx / l) * this.strafe * 1.5;
    this.moveBy(vx * dt, vz * dt); this.speed = hyp(vx, vz) * 0.9; this.setLoco(this.speed);
    if (this.armed) this.ch.armR.play('Guard Idle', { fade: 0.2 });
    if (d < 8 && Math.random() < dt * 0.15) this.bark(['Come on, then.', 'Not so brave now.', 'Surrounded.'][Math.floor(Math.random() * 3)]);
  }
  archerAI(dt, d, dx, dz) {
    const near = d < 6.5, far = d > 18, los = this.sees;
    this.yaw += angDiff(Math.atan2(dx, dz), this.yaw) * Math.min(1, dt * 8) * -1 * -1;
    if (near) { const l = d || 1; this.moveBy(-dx / l * 3.2 * dt, -dz / l * 3.2 * dt); this.speed = 3.2; }
    else if (far || !los) { this.repathT -= 0; if (!this.path || this.repathT <= 0) { this.repathT = 0.6; const t = this.lastSeen || this.g.player.pos; this.goTo(t[0], t[2], 3.6); } if (this.path) this.stepPath(dt); }
    else { this.speed *= 0.8; if (this.path) this.stopMove(); }
    this.setLoco(this.speed);
    if (los && !near && d < 26 && this.shotT <= 0) {
      this.shotT = 2.4 + Math.random() * 1.2; this.ch.upper.playOnce('Point', { fadeIn: 0.1, fadeOut: 0.3, speed: 1.6 });
      setTimeout(() => { if (!this.dead && this.state === 'chase') this.g.squad.fireBolt(this); }, 260);
    }
    if (near && this.shotT <= 0 && d < 2.2) { this.state = 'attack'; this.stopMove(); this.beginAttack(); }
  }
  beginAttack() {
    const roll = Math.random();
    const clip = roll < 0.18 ? 'Thrust' : ['Slash A', 'Slash B', 'Overhead'][Math.floor(Math.random() * 3)];
    const shove = roll < 0.1, feint = !this.feintDone && Math.random() < 0.22; this.feintDone = false;
    if (Math.random() < 0.35) this.comboLeft = 1;
    const dur = clip === 'Overhead' ? 1.1 : clip === 'Thrust' ? 0.95 : 0.9;
    this.atk = { clip, t: 0, dur, hit: false, shove, feint };
    this.ch.upper.playOnce(clip, { fadeIn: 0.08, fadeOut: 0.25, speed: feint ? 1.1 : 0.85 });
    this.g.sfx.swing?.(0.7);
  }
  strike() {
    const a = this.atk; if (!a) return; a.hit = true;
    const P = this.g.player, dx = P.pos[0] - this.x, dz = P.pos[2] - this.z, d = hyp(dx, dz), f = this.fwd;
    if (d > 2.5 || (dx * f[0] + dz * f[1]) / (d || 1) < 0.35) { this.g.sfx.swing?.(0.3); return; }
    const dmg = (a.clip === 'Overhead' ? 17 : a.clip === 'Thrust' ? 14 : 11) * (this.def.dmg || 1) * (this.role === 'captain' ? 1.3 : 1);
    const res = a.shove ? P.incoming(4, [this.x, this.z], { from: this, unblockable: true, shove: true }) : P.incoming(dmg, [this.x, this.z], { from: this });
    if (a.shove && res === 'hit') { P.stagger = Math.max(P.stagger, 0.6); this.g.flashText?.('SHOVED'); }
    if (res === 'parried') { this.stagger = 1.3; this.state = 'stagger'; this.atk = null; this.ch.upper.playOnce('Stagger', { fadeIn: 0.04, fadeOut: 0.3 }); this.bark('Gah!'); }
    else if (res === 'hit') { this.g.sfx.slash?.(this.pos); }
  }
  // ------------------------------------------------------------ being hurt
  takeHit(dmg, dir, opts = {}) {
    if (this.dead) return 'dead';
    const unaware = (this.state === 'routine' || this.state === 'notice' || this.lying) && this.alert < 0.95 && !this.sees;
    const behind = dir && ((dir[0] * this.fwd[0] + dir[1] * this.fwd[1]) > 0.1); // dir points from the player to us; same direction as we face => the player is behind us
    if (opts.from === 'player' && (unaware && (behind || this.lying || this.seated || this.asleep || this.surrender))) { dmg = 999; opts.backstab = true; }
    // guards sometimes block a frontal blow
    if (this.guard && !opts.backstab && (this.state === 'chase' || this.state === 'attack') && !this.atk && Math.random() < (this.def.block ?? 0.22) && !behind) {
      this.g.spark([this.x + dir[0] * 0.5, this.y + 1.3, this.z + dir[1] * 0.5], [dir[0], 0, dir[1]], 12); this.g.sfx.clang?.(1, this.pos); this.g.noise(this.pos, 14, 'clang', this);
      this.ch.upper.playOnce('Block', { fadeIn: 0.05, fadeOut: 0.3 }); return 'blocked';
    }
    this.hp -= dmg; this.tookHit = 0.4; this.alert = 1;
    if (this.hp <= 0) { this.die(dir, opts); return 'killed'; }
    this.g.sfx.grunt?.(1, this.pos, this.spec.voice || 1);
    this.ch.upper.playOnce('Flinch', { fadeIn: 0.04, fadeOut: 0.25 });
    this.stagger = 0.35 + (opts.heavy ? 0.4 : 0); this.atk = null;
    if (dir) this.moveBy(dir[0] * 0.5, dir[1] * 0.5);
    if (this.guard) {
      if (this.state !== 'attack') { this.state = 'stagger'; }
      this.lastSeen = [this.g.player.pos[0], this.g.player.pos[1], this.g.player.pos[2]]; this.lostT = 0;
      this.g.alarm(this.lastSeen, 'combat', this);
      if (this.hp < this.maxHp * 0.3 && Math.random() < 0.55 && !this.ranged && this.def.brave !== true) { this.state = 'retreat'; this.retreatT = 7; this.repathT = 0; this.stopMove(); this.bark('Fall back! Get help!'); }
    } else this.scare(this.g.player.pos, 20);
    return 'hit';
  }
  die(dir, opts = {}) {
    if (this.dead) return;
    this.dead = true; this.state = 'dead'; this.hp = 0; this.stopMove(); this.atk = null;
    const g = this.g;
    g.world.remove(this.body);
    if (this.lying) { this.lying = false; }
    this.seated = false; this.leaveActivity?.(); this.ch.position.set([this.x, this.y, this.z]); E.quat.fromEuler(this.ch.rotation, 0, this.yaw / D2R, 0);
    this.ch.upper.fadeWeight?.(0, 0.05); this.ch.armR.fadeWeight?.(0, 0.05); this.ch.armL.fadeWeight?.(0, 0.05);
    const k = opts.backstab ? 0.25 : 1, imp = dir ? [dir[0] * 90 * k, 30 * k, dir[1] * 90 * k] : [0, 0, 0];
    try { this.ragdoll = new E.Ragdoll(g.world, this.ch); this.ragdoll.activate({ impulse: imp, at: 'torso', velocity: [0, 0, 0] }); } catch (e) { console.warn('ragdoll failed', e); }
    g.sfx.die?.(this.pos);
    g.onKill(this, opts);
    // loot
    const drops = [...this.loot];
    if (this.guard) drops.push(['gold', 3 + Math.floor(Math.random() * 9)]);
    else if (Math.random() < 0.5) drops.push(['gold', 1 + Math.floor(Math.random() * 5)]);
    this.loot = drops; this.searched = false;
    g.bloodPool([this.x, this.y, this.z]);
    g.noise(this.pos, opts.backstab ? 4 : 11, opts.backstab ? 'step' : 'combat', this);
    this.deadT = 0;
  }
  updateDead(dt) {
    this.deadT += dt;
    if (this.frozen) return;
    if (this.ragdoll) {
      if (this.dist > 90) return;
      this.ch.update(0); this.ragdoll.update(dt);
      const torso = this.ragdoll.parts.get('torso')?.body;
      if (torso) { this.x = torso.position[0]; this.z = torso.position[2]; this.y = torso.position[1] - 0.3; }
      if (this.deadT > 3 && this.ragdoll.settled) { this.ch.updateWorld(this.g.scene.world); this.frozen = true; }
    }
  }
  setVisible(v) { if (this.visible === v) return; this.visible = v; this.ch.visible = v; }
  // level of detail by distance: fingers and facial features go first, then shadows
  setLod(l) {
    if (this.lod === l) return; this.lod = l;
    if (!this.fine) { this.fine = []; for (const p of this.ch.parts) if (/Finger|Thumb|Eyelid|Brow|Ear|Cheekbone|Nose|Chin|Mouth|^Eye|Buckle|Vambrace|Scar/.test(p.def.name)) this.fine.push(...p.meshes); }
    for (const m of this.fine) m.visible = l === 0;
    for (const p of this.ch.parts) for (const m of p.meshes) m.castShadow = l < 2 && p.def.castShadow !== false;
  }
}
