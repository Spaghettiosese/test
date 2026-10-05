// What a bot does when it is not following a director's order or fighting a visible enemy:
// investigating and hunting, reviving a squad mate, breaking a barricade, shooting a drone,
// patrolling as a roamer and shutting a door. Mixed into Brain's prototype.
import { CAST, STOREY } from '../world/grid.js';
import { STAND, CROUCH } from '../sim/actor.js';
import { clamp, dist3, dist2, norm, sub, dot, wrapAngle, yawOf, pitchOf } from '../sim/util.js';

const HOSTILE_NOISE = new Set(['shot', 'explosion', 'melee', 'door', 'breach', 'plant', 'burn', 'step', 'throw', 'place', 'hit']);

export const behaviors = {
  // ---------------------------------------------------------------- hunting
  // Head for a place an enemy is, was, or made a noise, look round when there, then give up.
  startHunt(pos, kind = 'sound', dur = 14) {
    const now = this.sim.time, h = this.hunt;
    const rank = { sound: 0, assist: 1, sight: 2, chase: 3, hurt: 4 };
    if (h && now < h.until) {
      const rh = rank[h.kind] ?? 0, rk = rank[kind] ?? 0;
      if (rh > rk && dist3(h.pos, pos) < 8) return false; // keep the more urgent errand
      if (rh >= rk && h.phase === 'go' && now - h.t0 < 5) return false; // finish walking there before changing its mind
    }
    // the errand is a place on the floor, even when the sound or the sighting was at head height
    pos = [pos[0], Math.max(0, Math.min(this.sim.world.floors - 1, Math.floor((pos[1] + 0.3) / STOREY))) * STOREY, pos[2]];
    this.hunt = { pos: [pos[0], pos[1], pos[2]], kind, t0: now, until: now + dur, phase: 'go', lookT: 0, search: [], si: 0 };
    // the flankers come at it from the side
    if (this.persona && this.persona.p.flank > 0.5 && (kind === 'sound' || kind === 'assist' || kind === 'sight') && dist3(this.a.pos, pos) > 9) {
      const via = this.flankSpot(pos); if (via) { this.hunt.via = via; this.hunt.phase = 'via'; }
    }
    this.mover.stop(); this.stateT = 0; this.sim.emit('hunt', { actor: this.a, kind, pos });
    return true;
  },
  // a spot 4-8 m from `pos`, out of its sight, off to one side of the way we would come
  flankSpot(pos) {
    const nav = this.sim.nav, w = this.sim.world, a = this.a, f = nav.floorOf(pos[1]);
    if (Math.abs(nav.floorOf(a.pos[1]) - f) > 0) return null;
    const ax = a.pos[0] - pos[0], az = a.pos[2] - pos[2], al = Math.hypot(ax, az) || 1;
    let best = null, bs = -1e9;
    for (let k = 0; k < 14; k++) {
      const ang = this.sim.rand() * Math.PI * 2, r = 4 + this.sim.rand() * 4, x = Math.floor(pos[0] + Math.cos(ang) * r), z = Math.floor(pos[2] + Math.sin(ang) * r);
      if (!nav.walkable(x, z, f) || nav.isHole(x, z, f) || !nav.fits(nav.node(x, z, f))) continue;
      const p = nav.centre(nav.node(x, z, f)), bx = p[0] - pos[0], bz = p[2] - pos[2], bl = Math.hypot(bx, bz) || 1;
      const side = 1 - Math.abs((ax * bx + az * bz) / (al * bl)); // 1 = square on to the line we would come along
      if (w.visible([pos[0], pos[1] + 1.5, pos[2]], [p[0], p[1] + 1.2, p[2]], CAST.GLASS)) continue;
      const sc = side * 2 - Math.hypot(p[0] - a.pos[0], p[2] - a.pos[2]) / 25;
      if (sc > bs) { bs = sc; best = p; }
    }
    return best;
  },
  // is this bot willing to leave what it is doing for this errand?
  huntWilling(kind, pos) {
    const p = this.persona; if (!p) return false;
    const t = this.task, a = this.a, d = dist3(a.pos, pos);
    if (kind === 'hurt') return true;
    if (a.busy) return false;
    // the defence cannot send everyone out looking: two at a time, one when it is short of people
    if (a.team === 'def' && this.dir && this.sim.round.phase === 'action' && kind !== 'chase') {
      const live = this.dir.live().length, out = this.dir.brains.filter((b) => b !== this && b.a.alive && b.hunt && this.sim.time < b.hunt.until && b.hunt.kind !== 'hurt').length;
      if (out >= (live <= 3 ? 1 : 2) && !['roamer', 'aggressor'].includes(p.id)) return false;
      if (out >= 3) return false;
    }
    if (t && ['plant', 'defuse', 'breach', 'intel', 'reinforce', 'place', 'barricade', 'closedoor'].includes(t.type)) return false;
    if (this.dir && this.dir.state === 'stage' && a.team === 'atk') return false; // the squad is stacking up
    // an anchor stays on its post for anything but a fight right next to it
    if (this.holdPost() && t.anchor && d > 12 && kind !== 'chase' && kind !== 'hurt') return false;
    let reach = kind === 'sound' ? 8 + 26 * p.p.curious : kind === 'assist' ? 6 + 22 * p.p.team : 12 + 30 * p.push;
    if (a.team === 'def' && this.sim.round.phase === 'action' && !['roamer', 'aggressor', 'rotator'].includes(p.id)) reach *= 0.55; // holders stay near their post
    if (d > reach) return false;
    const want = kind === 'sound' ? p.p.curious * (0.5 + 0.5 * p.push) : kind === 'assist' ? p.p.team : kind === 'sight' ? p.push : p.push * 0.9 + 0.1;
    return this.sim.rand() < want * (this.prof.tactics >= 1 ? 1 : 0.4);
  },
  // go, look round, check the rooms next to it
  huntStep(dt) {
    const h = this.hunt; if (!h) return false;
    const a = this.a, c = a.ctl, now = this.sim.time;
    if (now > h.until || a.busy) { this.hunt = null; return false; }
    const want = (p, o) => { if (!this.mover.goal || dist3(this.mover.goal, p) > 1.2 || (this.mover.failed && this.stateT > 0.8)) { this.mover.goTo(p, o); this.stateT = 0; } };
    const fast = h.kind === 'chase' || h.kind === 'hurt' || (this.persona && this.persona.p.pace > 0.65 && h.kind !== 'sound');
    if (h.phase === 'via') {
      want(h.via, { speed: 'run', tol: 1.2 }); this.applyWish(this.mover.wish, 'run'); this.faceMove(dt);
      if (this.mover.failed && this.stateT > 1.2) h.phase = 'go';
      if (this.mover.arrived || dist3(a.pos, h.via) < 1.8) { this.mover.stop(); h.phase = 'go'; }
      return true;
    }
    if (h.phase === 'go' || h.phase === 'search') {
      const goal = h.phase === 'go' ? h.pos : h.search[h.si];
      if (!goal) { this.hunt = null; return false; }
      want(goal, { speed: fast ? 'run' : 'walk', tol: h.phase === 'go' ? 2.2 : 1.3 });
      this.applyWish(this.mover.wish, fast ? 'run' : 'walk'); this.faceMove(dt);
      if (this.mover.failed && this.stateT > 1.5) { this.hunt = null; return false; }
      if (this.mover.arrived || dist3(a.pos, goal) < 2) {
        this.mover.stop();
        if (h.phase === 'go') { this.sim.emit('huntarrive', { actor: a, kind: h.kind, t: now - h.t0 }); h.phase = 'look'; h.lookT = 1.4 + this.sim.rand() * 1.4; h.search = this.searchSpots(h.pos); h.si = 0; h.yaw0 = a.yaw; }
        else { h.si++; h.phase = 'look'; h.lookT = 1.2 + this.sim.rand(); h.yaw0 = a.yaw; }
      }
      return true;
    }
    // look: sweep the room from where we stand
    h.lookT -= dt;
    this.want.yaw = (h.yaw0 ?? a.yaw) + Math.sin((now - h.t0) * 2.1) * 1.2; this.want.pitch = 0; this.turnTo(dt, 5);
    c.stance = this.persona && this.persona.p.caution > 0.6 ? CROUCH : STAND;
    if (h.lookT <= 0) { if (h.si < h.search.length && this.persona && this.persona.push > 0.35) h.phase = 'search'; else { this.hunt = null; this.mover.stop(); return false; } }
    return true;
  },
  // a few places round `pos` that the hunter cannot see from `pos`, closest first
  searchSpots(pos) {
    const nav = this.sim.nav, w = this.sim.world, f = nav.floorOf(pos[1]), out = [];
    const cx = Math.floor(pos[0]), cz = Math.floor(pos[2]);
    for (let dz = -6; dz <= 6; dz += 2) for (let dx = -6; dx <= 6; dx += 2) {
      const x = cx + dx, z = cz + dz; if (!nav.walkable(x, z, f) || nav.isHole(x, z, f) || !nav.fits(nav.node(x, z, f))) continue;
      const p = nav.centre(nav.node(x, z, f)); const d = Math.hypot(p[0] - pos[0], p[2] - pos[2]); if (d < 3) continue;
      if (w.visible([pos[0], pos[1] + 1.5, pos[2]], [p[0], p[1] + 1.2, p[2]], CAST.GLASS)) continue; // already seen from the spot
      out.push({ p, d });
    }
    out.sort((q, r) => q.d - r.d);
    const picked = []; for (const o of out) if (picked.every((q) => dist3(q, o.p) > 4)) picked.push(o.p);
    return picked.slice(0, 2);
  },

  // ---------------------------------------------------------------- reviving
  reviveTarget() {
    const a = this.a, sim = this.sim, p = this.persona;
    if (this.prof.tactics < 1 || !sim.downEnabled) return null;
    // nobody is shooting at us: no enemy seen in the last second or two (heard sounds do not count)
    const seen = this.sense.visibleEnemies().length; if (seen) return null;
    const lastSeen = sim.time - this.lastSeenT, calm = 1.2 + (1 - (p ? p.p.team : 0.5)) * 3.2;
    if (lastSeen < calm) return null;
    let best = null, bd = 18;
    for (const o of sim.actors) {
      if (o === a || o.team !== a.team || !o.downed || (o.reviver && o.reviver !== a && o.reviver.alive && !o.reviver.downed)) continue;
      const d = dist3(a.pos, o.pos) + Math.abs(a.pos[1] - o.pos[1]) * 2;
      if (d < bd && o.downT > 4 + d / 4.8) { bd = d; best = o; }
    }
    return best;
  },
  reviveStep(dt) {
    const a = this.a, c = a.ctl; let t = this.rvTarget;
    if (t && (!t.downed || (t.reviver && t.reviver !== a))) { if (t.reviver === a) t.reviver = null; t = this.rvTarget = null; }
    if (t && (this.sense.visibleEnemies().length || this.sim.time - this.lastSeenT < 0.5)) { if (t.reviver === a) t.reviver = null; this.rvTarget = null; this.rvCd = 1.5; return false; }
    if (!t) { this.rvCd -= dt; if (this.rvCd > 0) return false; this.rvCd = 0.35; t = this.reviveTarget(); if (!t) return false; this.rvTarget = t; t.reviver = a; this.mover.stop(); this.hunt = null; this.sim.emit('callout_revive', { actor: a, target: t }); }
    const d = dist3(a.pos, t.pos);
    if (d > 1.35 || Math.abs(a.pos[1] - t.pos[1]) > 1.2) {
      if (!this.mover.goal || dist3(this.mover.goal, t.pos) > 1 || (this.mover.failed && this.stateT > 0.6)) { this.mover.goTo([t.pos[0], t.pos[1], t.pos[2]], { speed: 'run', tol: 1.0 }); this.stateT = 0; }
      this.applyWish(this.mover.wish, 'run'); this.faceMove(dt);
      if (this.mover.failed && this.stateT > 1.5) { t.reviver = null; this.rvTarget = null; this.rvCd = 3; }
      return true;
    }
    this.mover.stop();
    this.want.yaw = yawOf(t.pos[0] - a.pos[0], t.pos[2] - a.pos[2]); this.want.pitch = 0; this.turnTo(dt, 9);
    c.use = true; c.stance = CROUCH;
    if (!a.busy) a.busy = { kind: 'revive', t: 0, dur: 3.4, freeze: true, cancelIf: (x) => !x.ctl.use || !x.alive || !t.downed, onDone: () => { t.revive(a); this.rvTarget = null; this.sim.emit('revived_by_bot', { actor: a, target: t }); } };
    return true;
  },

  // ---------------------------------------------------------------- barricades
  attackBarrier(bar, dt) {
    const a = this.a, c = a.ctl, sim = this.sim, ctr = bar.centre, eye = a.eye();
    this.want.yaw = yawOf(ctr[0] - a.pos[0], ctr[2] - a.pos[2]); this.want.pitch = pitchOf(ctr[0] - eye[0], ctr[1] - eye[1], ctr[2] - eye[2]);
    this.turnTo(dt, 12);
    const aligned = Math.abs(wrapAngle(this.want.yaw - a.yaw)) < 0.25, dist = Math.hypot(ctr[0] - a.pos[0], ctr[2] - a.pos[2]);
    this.melCd = (this.melCd || 0) - dt;
    if (aligned && dist < 1.9 && this.melCd <= 0 && !a.busy) { sim.devices.melee(a, { hammer: a.op.ability === 'hammer' }); this.melCd = a.op.ability === 'hammer' ? 0.8 : 1.15; }
    else if (aligned && dist >= 1.9 && a.gun && a.gun.mag > 0 && !a.gun.reloading) c.fire = a.gun.def.auto ? true : (Math.floor(sim.time * 8) % 2) === 0;
    else if (a.gun && a.gun.mag === 0 && a.gun.reserve > 0) c.reload = true;
    c.stance = STAND;
  },

  // ---------------------------------------------------------------- drones
  // shoot an enemy drone that can see (or be seen by) us
  droneTarget() {
    const a = this.a, sim = this.sim, eye = a.eye(); let best = null, bd = 16;
    for (const dr of sim.devices.drones) {
      if (dr.dead || dr.team === a.team) continue;
      const p = [dr.pos[0], dr.pos[1] + 0.15, dr.pos[2]], d = dist3(eye, p);
      if (d < bd && sim.world.visible(eye, p, CAST.GLASS)) { bd = d; best = dr; }
    }
    return best;
  },
  droneStep(dt) {
    if (this.prof.tactics < 1 || !this.a.gun) return false;
    const a = this.a, c = a.ctl, sim = this.sim;
    this.droneCd = (this.droneCd || 0) - dt; if (this.droneCd > 0 && !this.dTgt) return false;
    if (!this.dTgt || this.dTgt.dead) { this.droneCd = 0.3; this.dTgt = this.droneTarget(); if (!this.dTgt) return false; this.dSeenT = sim.time; this.dReact = 0.45 + this.prof.reaction * 0.5 + (this.persona ? (1 - this.persona.p.curious) * 0.9 : 0.4); }
    const dr = this.dTgt, eye = a.eye(), p = [dr.pos[0], dr.pos[1] + 0.12, dr.pos[2]];
    if (!sim.world.visible(eye, p, CAST.GLASS)) { if (sim.time - this.dSeenT > 1.5) { this.dTgt = null; return false; } } else this.dSeenT = sim.time;
    this.dReact -= dt;
    this.mover.stop();
    this.want.yaw = yawOf(p[0] - eye[0], p[2] - eye[2]); this.want.pitch = pitchOf(p[0] - eye[0], p[1] - eye[1], p[2] - eye[2]);
    const err = Math.abs(wrapAngle(this.want.yaw - a.yaw)) + Math.abs(this.want.pitch - a.pitch);
    a.yaw += clamp(wrapAngle(this.want.yaw - a.yaw), -this.prof.aimSpeed * dt * 1.4, this.prof.aimSpeed * dt * 1.4); a.pitch += clamp(this.want.pitch - a.pitch, -this.prof.aimSpeed * dt, this.prof.aimSpeed * dt);
    c.stance = STAND;
    if (this.dReact <= 0 && err < 0.08 && a.gun.mag > 0 && !a.gun.reloading) c.fire = a.gun.def.auto ? true : (Math.floor(sim.time * 10) % 2) === 0;
    return true;
  },

  // ---------------------------------------------------------------- doors
  // walk to a door and push it shut (defenders do this in the preparation phase)
  closeDoorStep(dt) {
    const a = this.a, t = this.task, c = a.ctl, d = t.door;
    if (!d || d.dead || d.barricade > 0 || d.target < 0.5) { this.dir && this.dir.taskDone(a, 'doorshut'); return; }
    const dc = [d.ax === 'x' ? d.ix : d.ix + 0.5, d.ax === 'x' ? d.iz + 0.5 : d.iz];
    const stand = t.stand;
    if (dist2(a.pos, stand) > 0.8 || Math.abs(a.pos[1] - stand[1]) > 1.2) {
      if (!this.mover.goal || dist3(this.mover.goal, stand) > 0.8 || (this.mover.failed && this.stateT > 0.5)) { this.mover.goTo(stand, { speed: 'walk', tol: 0.5 }); this.stateT = 0; }
      this.applyWish(this.mover.wish, 'walk'); this.faceMove(dt);
      if (this.mover.failed) this.dir.taskFailed(a, 'nopath');
      return;
    }
    this.mover.stop();
    this.want.yaw = yawOf(dc[0] - a.pos[0], dc[1] - a.pos[2]); this.turnTo(dt, 9);
    t.t = (t.t || 0) + dt;
    if (t.t > 0.5) { d.setOpen(false); this.sim.noise([dc[0], a.pos[1] + 1, dc[1]], 6, 'door', a); this.sim.emit('doorshut', { actor: a, door: d }); this.dir.taskDone(a, 'doorshut'); }
  },

  // ---------------------------------------------------------------- traffic
  // a bot that is standing in a doorway while a squad mate is trying to pass steps aside
  trafficStep(dt) {
    const a = this.a, c = a.ctl, sim = this.sim;
    if (this.inCombat || this.mode === 'combat' || a.busy || a.mode !== 'normal') { this.yieldT = 0; return; }
    if (Math.abs(c.fwd) + Math.abs(c.strafe) > 0.1) return; // already going somewhere
    this.trafficCd = (this.trafficCd || 0) - dt;
    if (this.yieldT > 0) this.yieldT -= dt;
    else {
      if (this.trafficCd > 0) return;
      this.trafficCd = 0.3;
      const f = sim.nav.floorOf(a.pos[1]), { d: dd, door } = sim.nav.doorDist(a.pos[0], a.pos[2], f);
      if (!door || dd > 0.85) return;
      const t = this.task; if (t && (t.type === 'closedoor' || t.type === 'barricade') && t.door === door) return;
      let wanted = false;
      for (const o of sim.actors) {
        if (o === a || !o.alive || o.team !== a.team || Math.abs(o.pos[1] - a.pos[1]) > 1.2) continue;
        if (Math.hypot(o.pos[0] - a.pos[0], o.pos[2] - a.pos[2]) < 3.2 && o.vel[0] * o.vel[0] + o.vel[2] * o.vel[2] > 0.5) { wanted = true; break; }
      }
      if (!wanted) return;
      this.yieldT = 0.9;
      // leave across the wall line, towards the side we are already leaning to
      const n = door.ax === 'x' ? [1, 0] : [0, 1], cx = door.ax === 'x' ? door.ix : door.ix + 0.5, cz = door.ax === 'x' ? door.iz + 0.5 : door.iz;
      const side = Math.sign((a.pos[0] - cx) * n[0] + (a.pos[2] - cz) * n[1]) || (this.persona ? this.persona.habit.side : 1);
      this.yieldDir = [n[0] * side, n[1] * side];
    }
    if (this.yieldT > 0 && this.yieldDir) this.applyWish(this.yieldDir, 'walk');
  },

  // ---------------------------------------------------------------- roaming
  // a roamer walks a loop of rooms around the objective, stopping to listen at each
  roamStep(dt) {
    const a = this.a, t = this.task, c = a.ctl, sim = this.sim;
    if (!t.points || !t.points.length) { this.dir && this.dir.taskDone(a, 'noroute'); return; }
    t.i = t.i || 0; t.phase = t.phase || 'go';
    const pt = t.points[t.i % t.points.length];
    if (t.phase === 'go') {
      if (!this.mover.goal || dist3(this.mover.goal, pt.pos) > 0.9 || (this.mover.failed && this.stateT > 0.6)) { this.mover.goTo(pt.pos, { speed: 'walk', tol: 0.6 }); this.stateT = 0; if (this.mover.failed) { t.i++; return; } }
      this.applyWish(this.mover.wish, this.persona && this.persona.p.pace > 0.7 ? 'run' : 'walk'); this.faceMove(dt);
      if (this.mover.failed && this.stateT > 1.5) { t.i++; this.mover.stop(); return; }
      this.tacticalPause(dt);
      if (this.mover.arrived) { t.phase = 'dwell'; t.dwell = (2.5 + 5 * (this.persona ? this.persona.p.patience : 0.5)) * (0.7 + sim.rand() * 0.6); t.wait0 = sim.time; this.mover.stop(); }
      return;
    }
    // dwell: face the way the point watches, sweep a little, lean, listen
    t.dwell -= dt;
    this.hold(dt, { facing: pt.facing, sweep: 0.7, crouch: pt.crouch, peek: true });
    if (t.dwell <= 0) { t.i++; t.phase = 'go'; }
  },
};

export function installBehaviors(Brain) { for (const [k, f] of Object.entries(behaviors)) Brain.prototype[k] = f; }
void norm; void sub; void dot; void STOREY; void HOSTILE_NOISE;
