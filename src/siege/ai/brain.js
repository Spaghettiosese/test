// The bot's mind. Each frame it senses, follows its route, turns and shoots; four times a second
// it decides what to do: fight a visible enemy (cover, strafing, bursts, grenades, reloading),
// react to a sound or a hit, or carry on with the task its team's director gave it.
import { Sense } from './sense.js';
import { Mover } from './move.js';
import { profileFor } from './profile.js';
import { findCover, findPeek, lobPitch, facingOf } from './tactics.js';
import { GADGETS } from '../data/gadgets.js';
import { runGadgetAI } from './gadgetai.js';
import { installBehaviors } from './behaviors.js';
import { makePersona } from './persona.js';
import { CAST, STOREY } from '../world/grid.js';
import { STAND, CROUCH } from '../sim/actor.js';
import { clamp, dist3, dist2, norm, sub, dot, wrapAngle, yawOf, pitchOf, approachAngle } from '../sim/util.js';

const RANGE = { AR: [8, 32], SMG: [4, 18], LMG: [8, 30], SG: [2, 9], DMR: [14, 50], SR: [25, 80], HG: [3, 16] };

export class Brain {
  constructor(a, director, level = 2) {
    this.a = a; a.ai = this; this.sim = a.sim; this.dir = director; this.level = level;
    this.prof = profileFor(level, a.sim.rand);
    // defenders sit behind pre-aimed angles and know the rooms: a little quicker on the first shot
    if (a.team === 'def') { this.prof.reaction *= 0.9; this.prof.aimNoise *= 0.94; }
    this.sense = new Sense(this); this.mover = new Mover(this);
    this.task = null; this.mode = 'idle'; this.decideT = a.sim.rand() * 0.3;
    this.tgt = null; this.reactT = 0; this.burstLeft = 0; this.pauseT = 0; this.strafeT = 0; this.strafeDir = 1; this.aimHead = false;
    this.cover = null; this.coverT = 0; this.cm = 'engage'; this.inCombat = false;
    this.noise = [0, 0]; this.noiseT = 0; this.want = { yaw: a.yaw, pitch: 0, snap: false };
    this.watch = null; this.watchT = 0; this.scanT = 0; this.scanDir = 1; this.lastSeenT = -9; this.pauseDoor = 0;
    this.grenadeCd = 4 + a.sim.rand() * 6; this.sweepPhase = a.sim.rand() * 6; this.lastRoom = -2; this.peekT = 0; this.leanDir = 0;
    this.holdUntil = 0; this.stateT = 0; this.gadgetT = 0; this.say = null; this.stuckHunt = 0; this.moveMode = 'walk'; this.hurtT = -9; this.fleeing = false;
    this.talkCd = 0; this.lastTarget = null; this.dangerSpots = []; this.rvTarget = null; this.rvCd = 0;
    this.persona = a.persona || makePersona(a.sim.rand, a.op, a.team, a.name); a.persona = this.persona;
    this.breaksBarriers = a.team === 'atk' ? (a.op.ability === 'hammer' ? 2 : 1) : 0; this.hunt = null; this.dTgt = null; this.lastTgtId = null;
  }
  get a_() { return this.a; }

  // ---------------------------------------------------------------- events from the sim
  onSpot(e, pos) { this.reactT = Math.max(this.reactT, this.prof.reaction * 0.55); this.dir && this.dir.callout(this.a, e, pos); }
  onHear(n, pos, conf) {
    this.watch = pos; this.watchT = 3.5;
    if (this.mode !== 'combat') this.heardT = this.sim.time;
    if (n.kind === 'shot' && this.dir) this.dir.hint(this.a, pos, n);
    // somebody else's trouble is worth a look: go and see, and tell the squad
    if (this.mode === 'combat' || this.inCombat || conf < 0.28 || !this.persona || !this.dir) return;
    if (!['shot', 'explosion', 'melee', 'breach', 'burn', 'plant'].includes(n.kind) && !(n.kind === 'door' && this.persona.p.curious > 0.6) && !(n.kind === 'step' && this.persona.p.curious > 0.75 && conf > 0.5)) return;
    // somebody keeps firing: stop wondering and go and get them, following the sound as it moves
    if (n.kind === 'shot') {
      const now = this.sim.time; this.shotLog = (this.shotLog || []).filter((q) => now - q.t < 6); this.shotLog.push({ t: now, pos });
      const near = this.shotLog.filter((q) => dist3(q.pos, pos) < 12).length;
      const h = this.hunt;
      if (h && h.press && dist3(h.pos, pos) < 14) { h.pos = [pos[0], pos[1], pos[2]]; h.until = Math.max(h.until, now + 8); if (h.phase === 'look' || h.phase === 'search') { h.phase = 'go'; this.mover.stop(); } return; }
      if (near >= 3 && this.persona.push > 0.3 && this.huntWilling('sight', pos)) { if (this.startHunt(pos, 'sight', 20) && this.hunt) this.hunt.press = true; return; }
    }
    if (this.huntWilling('sound', pos)) this.startHunt(pos, 'sound', 12);
    if (conf > 0.45) this.dir.alert(pos, 'sound', this, n.kind === 'shot' || n.kind === 'explosion' ? 3 : 1);
  }
  onFriendlyFight(n) {
    this.friendFightPos = n.pos; this.friendFightT = this.sim.time;
    if (!this.inCombat && this.persona && this.huntWilling('assist', n.pos)) this.startHunt(n.pos, 'assist', 12);
  }
  onTeamIntel(entry) {
    if (this.inCombat || !this.persona || !entry || !entry.pos) return;
    if (this.huntWilling('sight', entry.pos)) this.startHunt(entry.pos, 'sight', 12);
  }
  onHurt(src, from) {
    this.hurtT = this.sim.time; this.sense.hit(src, from);
    if (src && !this.sense.mem.get(src.id)?.seen) {
      this.watch = [src.pos[0], src.pos[1] + 1.5, src.pos[2]]; this.watchT = 4; this.reactT = Math.min(this.reactT, this.prof.reaction * 0.5);
      // shot by someone we cannot see: that is where they are, so go and get them
      if (this.persona && this.prof.tactics >= 1) {
        const err = 1.5, spot = [src.pos[0] + (this.sim.rand() - 0.5) * err, src.pos[1], src.pos[2] + (this.sim.rand() - 0.5) * err];
        if (this.persona.push > 0.3 || this.sim.rand() < 0.4) { this.rushT = this.sim.time; this.hurtSpot = spot; }
        if (this.dir) this.dir.alert(spot, 'hurt', this, 2);
      }
    }
  }
  costFn() {
    const known = [], now = this.sim.time;
    for (const m of this.sense.mem.values()) if (m.actor.alive && now - m.t < 8) known.push(m.pos);
    const nav = this.sim.nav, tact = this.prof.tactics, W = nav.W, D = nav.D;
    const traps = this.dir ? this.dir.knownTraps(this.a.team) : [], mem = this.sim.memory && this.sim.memory.rounds ? this.sim.memory : null, team = this.a.team;
    return (n) => {
      let extra = 0;
      if (mem) { const x = n % W, z = Math.floor(n / W) % D; extra += mem.danger(team, x + 0.5, z + 0.5, Math.floor(n / (W * D))) * Math.min(1.5, tact); }
      if (tact >= 1 && known.length) { const x = n % W, z = Math.floor(n / W) % D; for (const p of known) { const d = Math.hypot(x + 0.5 - p[0], z + 0.5 - p[2]); if (d < 7) extra += (7 - d) * 0.35 * tact; } }
      if (traps.length) { const x = n % W, z = Math.floor(n / W) % D; for (const p of traps) if (Math.abs(x + 0.5 - p[0]) < 1.1 && Math.abs(z + 0.5 - p[2]) < 1.1) extra += 40; }
      return extra;
    };
  }

  // ---------------------------------------------------------------- frame
  think(dt) {
    const a = this.a, c = a.ctl, sim = this.sim;
    c.fwd = c.strafe = 0; c.fire = false; c.use = false; c.jump = false; c.sprint = false; c.aim = false; c.lean = 0; c.stance = STAND;
    if (a.dead) return;
    if (a.downed) { this.downedBehaviour(dt); return; }
    if (a.mode === 'drone') return;
    this.sense.update(dt);
    this.stateT += dt; this.talkCd -= dt; this.grenadeCd -= dt;
    if (this.watchT > 0) this.watchT -= dt;
    this.decideT -= dt;
    if (this.decideT <= 0) { this.decideT = 0.18 + sim.rand() * 0.1; this.decide(); }
    this.mover.update(dt);
    this.execute(dt);
    this.trafficStep(dt);
    this.finish(dt);
  }

  // ---------------------------------------------------------------- decisions
  decide() {
    const a = this.a, now = this.sim.time, th = this.sense.threat();
    if (a.busy && (a.busy.kind === 'plant' || a.busy.kind === 'defuse')) {
      // finish the job unless an enemy is on top of us
      if (th && th.seen && th.dist < 9 && this.prof.tactics > 0) { a.busy = null; this.dir && this.dir.taskFailed(a, 'interrupted'); } else return;
    }
    if (th && th.seen) {
      this.tgt = th; this.lastSeenT = now; this.lastTgtId = th.actor.id;
      if (this.mode !== 'combat') { this.mode = 'combat'; this.stateT = 0; this.cm = 'engage'; this.aimHead = this.sim.rand() < this.prof.headshot * (th.dist < 25 ? 1.3 : 0.5); this.burstLeft = 0; this.pickCombatPlan(th); }
      this.inCombat = true; return;
    }
    // lost sight: keep fighting for a few seconds
    if (this.tgt && this.tgt.actor.alive && now - this.lastSeenT < (3 + 4 * this.prof.p.patience)) { this.mode = 'combat'; this.inCombat = true; return; }
    this.tgt = null; this.inCombat = false;
    if (this.mode === 'combat') {
      this.mode = 'task'; this.stateT = 0; this.mover.stop();
      const m = this.lastTgtId != null ? this.sense.mem.get(this.lastTgtId) : null;
      if (m && m.actor.alive && this.persona && this.huntWilling('chase', m.pos)) this.startHunt(this.sense.predict(m, 1.2), 'chase', 10);
    }
    if (this.rushT !== undefined && now - this.rushT < 0.6 && this.hurtSpot) { this.startHunt(this.hurtSpot, 'hurt', 12); this.rushT = undefined; }
    // hurt by someone unseen, or heard something very close
    if (now - this.hurtT < 2.5 && this.prof.tactics > 0 && this.mode !== 'react') { this.mode = 'react'; this.stateT = 0; this.reactKind = 'hit'; this.chooseReaction(); return; }
    this.mode = 'task';
  }
  pickCombatPlan(th) {
    const a = this.a, d = th.dist ?? dist3(a.eye(), th.pos);
    this.cm = 'engage';
    this.strafeDir = this.prof.p.lefty; this.strafeT = 0.3 + this.sim.rand() * 0.6;
    if (this.prof.tactics >= 1 && a.hp < a.maxHp * 0.35) this.cm = 'retreat';
    void d;
  }
  chooseReaction() {
    const a = this.a;
    const src = this.watch ? this.watch : (this.sense.recentHit ? this.sense.recentHit.pos : null);
    if (!src) return;
    this.want.yaw = yawOf(src[0] - a.pos[0], src[2] - a.pos[2]); this.want.snap = true;
    if (this.prof.tactics >= 1) {
      const cov = findCover(this.sim, a.pos, src, { radius: 5 });
      if (cov) { this.cover = cov; this.mover.goTo(cov, { speed: 'run', tol: 0.5 }); }
    }
  }

  // ---------------------------------------------------------------- execution
  execute(dt) {
    if (this.mode === 'combat') this.combat(dt);
    else if (this.mode === 'react') this.react(dt);
    else this.runTask(dt);
  }

  // ---------------------------------------------------------------- combat
  combat(dt) {
    const a = this.a, c = a.ctl, now = this.sim.time, m = this.tgt, g = a.gun;
    if (!m || !m.actor) return;
    const T = m.actor, vis = m.seen && now - m.t < 0.35, eye = a.eye();
    const pos = vis ? (this.aimHead && T.alive ? T.headPos() : T.chestPos()) : this.sense.predict(m, 0.4);
    const d = Math.hypot(pos[0] - eye[0], pos[2] - eye[2]), dist = dist3(eye, pos);
    this.inCombat = true;
    if (this.reactT > 0) this.reactT -= dt;
    // aim
    const err = this.aimAt(pos, dt, dist);
    c.aim = vis && d > 6 && !a.sprinting && !(a.shield && a.shield.up);
    if (a.shield && a.op.ability === 'shield') a.shield.up = vis || this.holdShield;
    // weapon choice: pistol if the primary is dry and the enemy is close
    if (g && g.mag <= 0 && g.reserve <= 0 && a.guns.length > 1 && a.cur === 0) a.switchGun(1);
    else if (g && g.mag <= 0 && a.guns.length > 1 && a.cur === 0 && dist < 6 && a.guns[1].mag > 0) a.switchGun(1);
    else if (a.cur === 1 && a.guns[0].mag > 0 && dist > 8 && !vis) a.switchGun(0);
    // reload out of sight, or when nearly dry
    const gun = a.gun, low = gun && gun.mag <= Math.max(2, gun.def.mag * 0.18);
    if (gun && !gun.reloading && !gun.full && (gun.mag === 0 || (low && !vis))) { if (gun.reserve > 0) c.reload = true; }
    // fire
    const tol = Math.atan2(vis ? 0.3 : 0.5, Math.max(dist, 1)) + 0.008;
    if (vis && this.reactT <= 0 && gun && !gun.reloading && gun.mag > 0 && this.canFire(T)) {
      if (this.burstLeft <= 0 && this.pauseT <= 0 && Math.abs(err) < tol * 1.5) this.burstLeft = this.burstLength(dist);
      if (this.burstLeft > 0 && Math.abs(err) < tol * 2.2) {
        if (gun.def.auto) c.fire = true; else c.fire = (Math.floor(now * 14) % 2) === 0 && gun.cd <= 0.01;
        if (a.lastShotT === now || gun.cd > 0) { /* shot happened this frame */ }
      }
    }
    if (a.lastShotT >= now - dt * 1.5 && vis) { this.burstLeft -= 1; if (this.burstLeft <= 0) this.pauseT = (gun.def.auto ? 0.18 : 0.12) + this.sim.rand() * (0.5 - this.prof.accuracy * 0.18); }
    if (this.pauseT > 0) this.pauseT -= dt;
    // movement style
    this.combatMove(dt, T, vis, dist, d);
    // grenades at a known but covered position
    if (this.prof.tactics >= 2 && this.grenadeCd <= 0 && !gun?.reloading) this.tryGrenade(pos, dist, vis);
    if (a.op.ability === 'hammer' && dist < 1.7 && vis) this.sim.devices.melee(a);
    runGadgetAI(this, dt, 'combat');
  }
  canFire(T) {
    // no shooting through a friendly in the way
    const a = this.a, eye = a.eye(), t = T.chestPos(), dir = norm(sub(t, eye)), dd = dist3(eye, t);
    for (const o of this.sim.actors) {
      if (o === a || o === T || o.team !== a.team || !o.alive) continue;
      const toO = sub(o.chestPos(), eye), along = dot(toO, dir);
      if (along > 0.5 && along < dd) { const off = Math.hypot(toO[0] - dir[0] * along, toO[1] - dir[1] * along, toO[2] - dir[2] * along); if (off < 0.5) return false; }
    }
    return true;
  }
  burstLength(dist) {
    const g = this.a.gun; if (!g) return 0;
    if (!g.def.auto) return 1 + Math.floor(this.sim.rand() * 2);
    const base = dist < 8 ? 14 : dist < 20 ? 7 : 4;
    return Math.max(2, Math.round(base * (0.6 + this.sim.rand() * 0.9)));
  }
  combatMove(dt, T, vis, dist, d) {
    const a = this.a, c = a.ctl, tact = this.prof.tactics, g = a.gun, cls = g ? g.def.cls : 'AR';
    const [rmin, rmax] = RANGE[cls] || RANGE.AR, isAtk = a.team === 'atk';
    const toT = [T.pos[0] - a.pos[0], T.pos[2] - a.pos[2]], l = Math.hypot(toT[0], toT[1]) || 1, fwd = [toT[0] / l, toT[1] / l], side = [-fwd[1], fwd[0]];
    let wish = null;
    c.stance = STAND;
    if (this.cm === 'retreat') {
      if (!this.cover || this.coverT <= 0) { this.cover = findCover(this.sim, a.pos, T.pos, { radius: 8 }); this.coverT = 1.5; if (this.cover) this.mover.goTo(this.cover, { speed: 'run', tol: 0.4 }); }
      this.coverT -= dt;
      if (this.mover.arrived || !this.cover) { if (a.gun && !a.gun.full && a.gun.reserve > 0) a.ctl.reload = true; const stim = a.gadget('stimpistol'); void stim; if (a.hp > a.maxHp * 0.55 || this.stateT > 12) { this.cm = 'engage'; this.cover = null; } c.stance = CROUCH; }
      return;
    }
    if (tact >= 1 && a.hp < a.maxHp * 0.35 && this.cm !== 'retreat' && this.prof.p.nerve < 0.9) { this.cm = 'retreat'; this.coverT = 0; return; }
    if (g && g.reloading && vis && tact >= 1) { // step behind something while the magazine goes in
      if (!this.cover || this.coverT <= 0) { this.cover = findCover(this.sim, a.pos, T.pos, { radius: 4 }); this.coverT = 1.2; if (this.cover) this.mover.goTo(this.cover, { speed: 'run', tol: 0.4 }); }
      this.coverT -= dt; if (this.cover && !this.mover.arrived) return;
    }
    if (!vis) {
      // out of sight: hold and pre-aim, or push the last known position
      c.stance = (this.mode === 'combat' && tact >= 1 && dist > 10) ? CROUCH : STAND;
      const push = isAtk && tact >= 1 && this.sense.mem.get(T.id) && this.sim.time - this.lastSeenT > 1.2 + 2 * this.prof.p.patience;
      if (push && this.mover.arrived) { const dest = this.sense.predict(this.sense.mem.get(T.id), 1); this.mover.goTo(dest, { speed: 'walk', tol: 1.2 }); }
      if (!isAtk && tact >= 1 && this.peekT > 0) { c.lean = this.leanDir; this.peekT -= dt; }
      else if (!isAtk && tact >= 1 && this.sim.rand() < dt * 0.6 * this.prof.peek) { this.leanDir = this.sim.rand() < 0.5 ? -1 : 1; this.peekT = 0.5 + this.sim.rand() * 0.6; }
      return;
    }
    // visible: advance, back off, or strafe
    if (dist > rmax && (isAtk || this.prof.p.bold > 0.7) && !this.holdPost()) {
      if (!this.mover.active) this.mover.goTo([T.pos[0], T.pos[1], T.pos[2]], { speed: 'walk', tol: rmax * 0.7 });
    } else {
      if (this.mover.active && dist <= rmax) this.mover.stop();
      if (dist < rmin && tact >= 1) wish = [-fwd[0], -fwd[1]];
      else if (tact >= 1) {
        this.strafeT -= dt;
        if (this.strafeT <= 0) { this.strafeDir = -this.strafeDir; this.strafeT = 0.4 + this.sim.rand() * 0.9; if (this.sim.rand() < 0.25) this.strafeT += 0.8; }
        if (this.canStep(side, this.strafeDir)) wish = [side[0] * this.strafeDir * 0.8, side[1] * this.strafeDir * 0.8]; else this.strafeDir = -this.strafeDir;
        if (dist > 16 && this.sim.rand() < 0.5 && a.vel[0] * a.vel[0] + a.vel[2] * a.vel[2] < 0.5) c.stance = CROUCH;
        // lean around the corner on a defended post
        if (this.holdPost() && tact >= 2 && this.sim.rand() < dt * 1.0) { this.leanDir = this.sim.rand() < 0.5 ? -1 : 1; this.peekT = 0.5; }
        if (this.peekT > 0) { c.lean = this.leanDir; this.peekT -= dt; }
      }
    }
    if (wish) { const f = a.fwd, r = a.right; c.fwd = wish[0] * f[0] + wish[1] * f[2]; c.strafe = wish[0] * r[0] + wish[1] * r[2]; }
    if (this.mover.wish) this.applyWish(this.mover.wish, 'walk');
  }
  holdPost() { return this.task && (this.task.type === 'hold' || this.task.type === 'anchor'); }
  canStep(side, dir) {
    const a = this.a, w = this.sim.world, x = a.pos[0], y = a.pos[1] + 0.9, z = a.pos[2];
    return !w.cast(x, y, z, side[0] * dir, 0, side[1] * dir, 0.85, 0);
  }
  // turn toward a world point; returns the remaining angular error (rad)
  aimAt(p, dt, dist) {
    const a = this.a, eye = a.eye(), pr = this.prof;
    this.noiseT -= dt;
    if (this.noiseT <= 0) { this.noiseT = 0.2; const s = pr.aimNoise * (1 + dist / 35) * (a.vel[0] * a.vel[0] + a.vel[2] * a.vel[2] > 1 ? 1.6 : 1) * (a.status.shock > 0 ? 3 : 1) * (a.status.blind > 0 ? 6 : 1); this.noise = [this.sim.rand.gauss() * s, this.sim.rand.gauss() * s * 0.7]; }
    const dx = p[0] - eye[0], dy = p[1] - eye[1], dz = p[2] - eye[2];
    let ty = yawOf(dx, dz) + this.noise[0] - a.kick[1], tp = pitchOf(dx, dy, dz) + this.noise[1] - a.kick[0];
    const ey = wrapAngle(ty - a.yaw), ep = tp - a.pitch;
    const sp = pr.aimSpeed * (a.status.stun > 0 ? 0.4 : 1) * (a.ads > 0.5 ? 0.9 : 1);
    // quick flick for large errors, slower to settle
    const k = 1 - Math.exp(-sp * 2.2 * dt);
    const step = (e) => clamp(e * k, -sp * dt * 1.4, sp * dt * 1.4);
    a.yaw += this.want.snap ? ey : step(ey); this.want.snap = false;
    a.pitch = clamp(a.pitch + step(ep), -1.2, 1.2);
    return Math.hypot(ey, ep);
  }
  tryGrenade(pos, dist, vis) {
    const a = this.a, now = this.sim.time;
    if (dist < 4.5 || dist > 17) return;
    const pick = ['frag', 'impact', 'stun', 'bangs'].find((id) => { const g = a.gadget(id); return g && g.count > 0 && !(id === 'frag' && vis && dist < 6); });
    if (!pick) return;
    if (this.sim.rand() > this.prof.grenades) { this.grenadeCd = 3; return; }
    // only worth it if the target is hidden behind something, or we are flushing a room
    if (vis && pick === 'frag') return;
    const eye = a.eye(), h = pos[1] - eye[1], d = Math.hypot(pos[0] - eye[0], pos[2] - eye[2]);
    const pitch = lobPitch(d, h, 11), yaw = yawOf(pos[0] - eye[0], pos[2] - eye[2]);
    const dir = [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
    // is there a wall in the way of the throw?
    const hit = this.sim.world.cast(eye[0], eye[1], eye[2], dir[0], dir[1], dir[2], Math.min(d, 6) * 0.9, 0);
    if (hit) { this.grenadeCd = 2; return; }
    this.sim.devices.use(a, pick, { dir });
    this.grenadeCd = 6 + this.sim.rand() * 6; void now;
  }

  // ---------------------------------------------------------------- reacting to a sound or a hit
  react(dt) {
    const a = this.a, c = a.ctl;
    c.stance = this.cover ? CROUCH : STAND;
    if (this.watch) { this.want.yaw = yawOf(this.watch[0] - a.pos[0], this.watch[2] - a.pos[2]); }
    if (this.mover.wish) this.applyWish(this.mover.wish, 'run');
    if (this.stateT > 2.8 || (this.mover.arrived && this.stateT > 1.2)) { this.mode = 'task'; this.stateT = 0; }
  }

  // ---------------------------------------------------------------- downed
  downedBehaviour(dt) {
    const a = this.a, c = a.ctl;
    c.stance = 2; c.fire = false;
    const m = this.sense.freshest(6);
    if (m && !this.cover) this.cover = findCover(this.sim, a.pos, m.pos, { radius: 4 });
    if (this.cover) { const dx = this.cover[0] - a.pos[0], dz = this.cover[2] - a.pos[2], l = Math.hypot(dx, dz); if (l > 0.5) { a.yaw = yawOf(dx, dz); c.fwd = 1; } }
    void dt;
  }

  // ---------------------------------------------------------------- tasks (the director's orders)
  runTask(dt) {
    const a = this.a, t = this.task, c = a.ctl;
    if (this.reviveStep(dt)) return;
    if (this.droneStep(dt)) return;
    if (this.huntStep(dt)) return;
    if (!t) { this.idleLook(dt); return; }
    const want = (p, o) => { if (!this.mover.goal || dist3(this.mover.goal, p) > 0.8 || (this.mover.failed && this.stateT > 0.5)) { this.mover.goTo(p, o); this.stateT = 0; } };
    if (runGadgetAI(this, dt, 'task')) return;
    switch (t.type) {
      case 'goto': {
        if (this.mover.failed && this.stateT > 0.5) { t.fails = (t.fails || 0) + 1; if (t.fails >= 3 && this.dir) { this.dir.taskFailed(a, 'stuck'); break; } }
        want(t.pos, { speed: this.pickSpeed(t), tol: t.tol ?? 0.8 });
        if (this.mover.arrived) { this.dir && this.dir.arrived(a, t); }
        this.applyWish(this.mover.wish, this.pickSpeed(t)); this.faceMove(dt, t.facing);
        this.tacticalPause(dt);
        break;
      }
      case 'hold': case 'anchor': {
        want(t.pos, { speed: 'walk', tol: 0.45 });
        this.applyWish(this.mover.wish, this.pickSpeed(t));
        if (this.mover.arrived || !this.mover.active) { this.hold(dt, t); this.dir && !t.reported && ((t.reported = true), this.dir.arrived(a, t)); } else this.faceMove(dt);
        break;
      }
      case 'reinforce': case 'barricade': {
        const pos = t.stand;
        if (dist2(a.pos, pos) > 0.6 || Math.abs(a.pos[1] - pos[1]) > 1.2) { want(pos, { speed: 'run', tol: 0.35, exact: true }); this.applyWish(this.mover.wish, 'run'); this.faceMove(dt); if (this.mover.failed) { this.dir.taskFailed(a, 'nopath'); } break; }
        this.mover.stop();
        this.want.yaw = yawOf(t.face[0] - a.pos[0], t.face[2] - a.pos[2]);
        this.want.pitch = pitchOf(t.face[0] - a.eye()[0], t.face[1] - a.eye()[1], t.face[2] - a.eye()[2]);
        this.turnTo(dt, 9);
        if (!a.busy) {
          const eye = a.eye(), d = [t.face[0] - eye[0], t.face[1] - eye[1], t.face[2] - eye[2]], l = Math.hypot(...d);
          const h = this.sim.world.cast(eye[0], eye[1], eye[2], d[0] / l, d[1] / l, d[2] / l, 3.5, 0);
          const p = h && h.panel;
          const r = t.type === 'reinforce' ? this.sim.round.reinforce(a, p && p.unit === t.unit ? p : this.sim.world.units.get(t.unit)?.[0]) : this.sim.round.barricadeAct(a, p || t.panel);
          if (!r.ok) { this.dir.taskFailed(a, r.msg); break; }
        }
        c.use = true; c.stance = CROUCH;
        if (a.busy) { this.task.working = true; }
        break;
      }
      case 'place': {
        const pos = t.stand;
        if (dist2(a.pos, pos) > 0.7 || Math.abs(a.pos[1] - pos[1]) > 1.2) { want(pos, { speed: 'walk', tol: 0.4 }); this.applyWish(this.mover.wish, 'walk'); this.faceMove(dt); if (this.mover.failed) this.dir.taskFailed(a, 'nopath'); break; }
        this.mover.stop();
        const r = this.sim.devices.placeAt(a, t.gadget, t.at, t.normal, t.panel, null);
        this.dir.taskDone(a, r.ok ? 'placed' : r.msg);
        break;
      }
      case 'roam': this.roamStep(dt); break;
      case 'closedoor': this.closeDoorStep(dt); break;
      case 'plant': {
        const spot = this.sim.round.bombSpots[t.spot ?? 0];
        if (dist2(a.pos, spot) > 0.9) { want(spot, { speed: this.pickSpeed(t), tol: 0.5 }); this.applyWish(this.mover.wish, this.pickSpeed(t)); this.faceMove(dt); if (this.mover.failed) this.dir.taskFailed(a, 'nopath'); this.tacticalPause(dt); break; }
        this.mover.stop();
        if (!a.busy) { const r = this.sim.round.startPlant(a); if (!r.ok) { this.dir.taskFailed(a, r.msg); break; } }
        c.use = true; c.stance = CROUCH;
        break;
      }
      case 'defuse': {
        const b = this.sim.round.bomb;
        if (b.state !== 'planted' && b.state !== 'defusing') { this.dir.taskDone(a, 'nobomb'); break; }
        if (dist2(a.pos, b.pos) > 1.0) { want(b.pos, { speed: 'run', tol: 0.6 }); this.applyWish(this.mover.wish, 'run'); this.faceMove(dt); break; }
        this.mover.stop();
        if (!a.busy) this.sim.round.startDefuse(a);
        c.use = true; c.stance = CROUCH;
        break;
      }
      case 'search': {
        want(t.pos, { speed: 'walk', tol: 1.2 });
        this.applyWish(this.mover.wish, 'walk'); this.faceMove(dt);
        if (this.mover.arrived) this.dir.taskDone(a, 'searched');
        break;
      }
      default: this.idleLook(dt);
    }
  }
  pickSpeed(t) {
    if (t.speed) return t.speed;
    const known = this.sense.freshest(6);
    return known ? 'walk' : (this.a.team === 'atk' ? 'run' : 'walk');
  }
  // pause at a doorway and sweep the room before stepping in
  tacticalPause(dt) {
    const a = this.a, tact = this.prof.tactics; if (tact < 1) return;
    if (this.pauseDoor > 0) { this.pauseDoor -= dt; this.mover.wish = null; a.ctl.stance = CROUCH; this.want.yaw += Math.sin(this.sim.time * 5) * 0.012; return; }
    const room = this.sim.world.roomAt(a.pos[0], a.pos[1], a.pos[2]);
    if (room !== this.lastRoom) {
      if (this.lastRoom !== -2 && this.sim.rand() < this.prof.peek && this.sense.freshest(10)) this.pauseDoor = 0.35 + this.sim.rand() * 0.3;
      this.lastRoom = room;
    }
  }
  hold(dt, t) {
    const a = this.a, c = a.ctl;
    c.stance = t.crouch ? CROUCH : STAND;
    this.scanT -= dt;
    let yaw = t.facing ?? a.yaw;
    if (this.watchT > 0 && this.watch) yaw = yawOf(this.watch[0] - a.pos[0], this.watch[2] - a.pos[2]);
    else yaw += Math.sin(this.sim.time * 0.6 + this.sweepPhase) * 0.5 * (t.sweep ?? 0.5);
    this.want.yaw = yaw; this.want.pitch = 0;
    this.turnTo(dt, 3.5);
    if (t.peek && this.prof.tactics >= 2 && this.sim.rand() < dt * 0.2) { this.leanDir = this.sim.rand() < 0.5 ? -1 : 1; this.peekT = 0.7; }
    if (this.peekT > 0) { c.lean = this.leanDir; this.peekT -= dt; }
    if (this.watchT > 0 && this.watch && !this.inCombat) { c.aim = this.sim.rand() < 0.5; }
    const g = a.gun; if (g && !g.reloading && g.mag < g.def.mag * 0.6 && g.reserve > 0) c.reload = true;
  }
  idleLook(dt) { this.want.yaw = this.a.yaw + Math.sin(this.sim.time * 0.5 + this.sweepPhase) * 0.3; this.turnTo(dt, 2); }

  // ---------------------------------------------------------------- output
  applyWish(w, speed) {
    const a = this.a, c = a.ctl;
    if (!w) return;
    const f = a.fwd, r = a.right;
    c.fwd = w[0] * f[0] + w[1] * f[2]; c.strafe = w[0] * r[0] + w[1] * r[2];
    this.moveMode = speed || 'walk';
    if (speed === 'run') c.sprint = true;
    if (speed === 'crouch') c.stance = CROUCH;
  }
  faceMove(dt, override = null) {
    const m = this.mover;
    let y = override ?? (m.faceYaw ?? this.a.yaw);
    // while moving, glance toward a recent sound
    if (this.watchT > 0 && this.watch && this.prof.tactics >= 1 && !m.wish) y = yawOf(this.watch[0] - this.a.pos[0], this.watch[2] - this.a.pos[2]);
    this.want.yaw = y; this.want.pitch = 0;
    this.turnTo(dt, this.moveMode === 'run' ? 8 : 5);
  }
  turnTo(dt, rate) {
    const a = this.a;
    a.yaw = approachAngle(a.yaw, this.want.yaw, rate * dt);
    a.pitch += clamp(this.want.pitch - a.pitch, -rate * 0.5 * dt, rate * 0.5 * dt);
  }
  finish() {
    const a = this.a;
    // keep a.yaw sane
    a.yaw = wrapAngle(a.yaw);
    if (!this.inCombat && Math.abs(a.pitch) > 0 && this.mode !== 'combat') a.pitch *= 0.98;
  }
  setTask(t) { this.task = t; this.stateT = 0; this.mover.stop(); if (t) t.reported = false; }
}
void STOREY; void CAST; void GADGETS; void facingOf; void findPeek;
installBehaviors(Brain);
