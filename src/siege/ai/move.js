// Path following for bots: plans with the shared A*, walks the route between the standing points
// of the cells, opens (and, if the bot is the careful kind, closes) doors, breaks barricades,
// vaults windows, climbs stairs, steers round props, and notices when it stops making progress.
import { STOREY, CAST } from '../world/grid.js';
import { yawOf, wrapAngle } from '../sim/util.js';

export class Mover {
  constructor(brain) {
    this.b = brain; this.a = brain.a; this.sim = brain.a.sim; this.nav = this.sim.nav;
    this.steps = []; this.i = 0; this.goal = null; this.target = null; this.opts = {}; this.arrived = true; this.failed = false;
    this.wish = null; this.speed = 'walk'; this.faceYaw = null; this.ver = -1; this.lastPlan = -9;
    this.stuckT = 0; this.lastPos = [...this.a.pos]; this.stuckN = 0; this.dodgeT = 0; this.dodgeDir = 0;
    this.waitT = 0; this.pending = false; this.blockedBy = null; this.subIdx = 0; this.vaulting = false;
    this.nopaths = 0; this.avoid = new Map(); this.passed = []; this.prog = { best: 1e9, t: 0 }; this.stalls = 0; this.bar = null;
  }
  stop() { this.steps = []; this.i = 0; this.goal = null; this.target = null; this.arrived = true; this.wish = null; this.pending = false; this.bar = null; }
  get active() { return !!this.goal && !this.arrived && !this.failed; }
  // set a destination in world coordinates [x, y, z]
  // during the preparation phase defenders may not leave the building: aim at the nearest spot inside it
  keepInside(pos) {
    const sim = this.sim, a = this.a;
    if (a.team !== 'def' || !sim.round || !sim.round.inPrep || !sim.round.inPrep()) return pos;
    const def = sim.map.def, m = 0.7;
    const x = Math.min(Math.max(pos[0], def.bx + m), def.bx + def.bw - m), z = Math.min(Math.max(pos[2], def.bz + m), def.bz + def.bd - m);
    return x === pos[0] && z === pos[2] ? pos : [x, pos[1], z];
  }
  goTo(pos, o = {}) {
    const same = this.goal && Math.hypot(pos[0] - this.goal[0], pos[2] - this.goal[2]) < 2 && Math.abs(pos[1] - this.goal[1]) < 1.5;
    pos = this.keepInside(pos);
    this.goal = [...pos]; this.opts = { speed: 'walk', tol: 0.55, ...o }; this.arrived = false; this.failed = false; this.pending = true; this.bar = null;
    this.prog = { best: 1e9, t: this.sim.time }; this.stalls = same ? this.stalls : 0; if (!same) this.avoid.clear();
    this.plan();
    return !this.failed;
  }
  cost() {
    const base = this.opts.cost || this.b.costFn();
    // in the preparation phase the defenders may not leave the building, so no route goes outside it
    const prep = this.a.team === 'def' && this.sim.round && this.sim.round.inPrep && this.sim.round.inPrep();
    if (!this.avoid.size && !prep) return base;
    const nav = this.nav, def = this.sim.map.def;
    return (n) => {
      if (prep) { const [x, z] = nav.parts(n); if (x < def.bx || x >= def.bx + def.bw || z < def.bz || z >= def.bz + def.bd) return 1e6; }
      return base(n) + (this.avoid.get(n) || 0);
    };
  }
  plan() {
    const sim = this.sim, a = this.a;
    if (sim.pathBudget !== undefined && sim.pathBudget <= 0) { this.pending = true; return; }
    if (sim.pathBudget !== undefined) sim.pathBudget--;
    const nav = this.nav, from = nav.snap(a.pos[0], a.pos[1], a.pos[2]), to = nav.snap(this.goal[0], this.goal[1], this.goal[2]);
    this.lastPlan = sim.time; this.ver = sim.worldVer || 0; this.pending = false;
    // where the body will actually end up: the goal itself if a body fits there, else the nearest spot that fits
    const [sx, sz] = nav.standXZ(to); this.target = Math.hypot(sx - this.goal[0], sz - this.goal[2]) > 0.6 ? [sx, sz] : [this.goal[0], this.goal[2]];
    let path = nav.find(from, to, { cost: this.cost(), avoidDoors: false, goalTol: this.opts.goalTol || 0, breakBarriers: this.opts.breakBarriers ?? this.b.breaksBarriers });
    // the goal may sit in a sealed pocket: settle for the nearest place that can be reached
    if (!path && !this.opts.goalTol) {
      path = nav.find(from, to, { cost: this.cost(), avoidDoors: false, goalTol: 3.5, breakBarriers: this.opts.breakBarriers ?? this.b.breaksBarriers });
      // a path of no steps only counts if the bot really is there already
      if (path && !path.length && Math.hypot(a.pos[0] - this.goal[0], a.pos[2] - this.goal[2]) > (this.opts.tol || 0.55) + 0.9) path = null;
    }
    if (!path) { this.steps = []; this.failed = true; this.sim.emit('nopath', { actor: a }); if (this.nopaths++ >= 1) this.rescue(); return; }
    this.steps = nav.smooth(a.pos[0], a.pos[2], nav.floorOf(a.pos[1]), path); this.i = 0; this.subIdx = 0; this.failed = false; this.bar = null;
    // already part-way up a staircase: carry on from the nearest step of it, not from the foot
    const s0 = this.steps[0];
    if (s0 && s0.kind === 'stair' && s0.pts) {
      let bi = 0, bd = 1e9;
      for (let k = 0; k < s0.pts.length; k++) { const q = s0.pts[k], d = Math.hypot(q[0] - a.pos[0], q[2] - a.pos[2]) + Math.abs(q[1] - a.pos[1]) * 1.5; if (d < bd) { bd = d; bi = k; } }
      this.subIdx = bd < 1.2 ? bi : 0;
    }
    if (!this.steps.length) this.arrived = Math.hypot(a.pos[0] - this.target[0], a.pos[2] - this.target[1]) < this.opts.tol + 0.6;
  }
  doorBetween(prev, node) {
    const w = this.sim.world, [x0, z0, f] = this.nav.parts(prev), [x1, z1] = this.nav.parts(node), y = f * STOREY;
    const p = x0 !== x1 ? w.getX(Math.max(x0, x1), y, z0) : w.getZ(x0, y, Math.max(z0, z1));
    const q = x0 !== x1 ? w.getX(Math.max(x0, x1), y + 1, z0) : w.getZ(x0, y + 1, Math.max(z0, z1));
    return (p && p.door) || (q && q.door) || null;
  }
  windowBetween(prev, node) {
    const w = this.sim.world, [x0, z0, f] = this.nav.parts(prev), [x1, z1] = this.nav.parts(node), y = f * STOREY;
    return x0 !== x1 ? w.getX(Math.max(x0, x1), y + 1, z0) : w.getZ(x0, y + 1, Math.max(z0, z1));
  }
  doorCentre(d) { return [d.ax === 'x' ? d.ix : d.ix + 0.5, d.ax === 'x' ? d.iz + 0.5 : d.iz]; }

  // ---------------------------------------------------------------- doors left open behind us
  tickClose(dt) {
    if (!this.passed.length) return;
    const a = this.a, sim = this.sim;
    for (const p of this.passed) {
      p.age += dt; const d = p.door; if (d.dead || d.barricade > 0 || d.target < 0.5) { p.done = true; continue; }
      const [cx, cz] = this.doorCentre(d), side = (a.pos[0] - cx) * p.n[0] + (a.pos[2] - cz) * p.n[1], dist = Math.hypot(a.pos[0] - cx, a.pos[2] - cz);
      if (p.age > 6 || this.b.inCombat) { p.done = true; continue; }
      if (side * p.s < 0.2 || dist > 4.5) { if (dist > 4.5) p.done = true; continue; } // not through yet, or too far to bother
      if (dist < 1.2) continue;
      // someone standing in the doorway keeps it open
      if (sim.actors.some((o) => o !== a && (o.alive || o.downed) && Math.abs(o.pos[1] - a.pos[1]) < 1.5 && Math.hypot(o.pos[0] - cx, o.pos[2] - cz) < 1.1)) continue;
      if (this.b.persona && this.b.persona.shouldClose(d)) { d.setOpen(false); sim.noise([cx, a.pos[1] + 1, cz], 6, 'door', a); }
      p.done = true;
    }
    this.passed = this.passed.filter((p) => !p.done);
  }
  noteDoor(d, pos) {
    if (!this.b.persona || !this.b.persona.p.close) return;
    const [cx, cz] = this.doorCentre(d), n = d.ax === 'x' ? [1, 0] : [0, 1], s = Math.sign((pos[0] - cx) * n[0] + (pos[2] - cz) * n[1]) || 1;
    // we are on side s now; closing means being on the other side (-s) once through
    this.passed.push({ door: d, n, s: -s, age: 0 });
  }

  update(dt) {
    const a = this.a, sim = this.sim;
    this.wish = null; this.faceYaw = null;
    this.tickClose(dt);
    if (!this.goal || this.arrived) return;
    if (a.mode !== 'normal') return;
    if (this.pending) { this.plan(); if (this.pending || this.failed) return; }
    if ((sim.worldVer || 0) !== this.ver && sim.time - this.lastPlan > 0.8) this.plan();
    if (this.failed) return;
    if (this.waitT > 0) { this.waitT -= dt; return; }
    const pos = a.pos;
    // reached the end?
    if (this.i >= this.steps.length) {
      const tg = this.target || [this.goal[0], this.goal[2]];
      if (Math.hypot(pos[0] - tg[0], pos[2] - tg[1]) < this.opts.tol + 0.15 || this.steps.length === 0) { this.arrived = true; return; }
      this.wish = [tg[0] - pos[0], tg[1] - pos[2]]; this.norm();
      if (Math.hypot(this.wish[0], this.wish[1]) < 1e-3) this.arrived = true;
      this.speed = this.opts.speed; this.faceYaw = yawOf(tg[0] - pos[0], tg[1] - pos[2]);
      this.watchProgress(dt, Math.hypot(pos[0] - tg[0], pos[2] - tg[1]));
      if (this.wish) this.steer(pos);
      return;
    }
    const s = this.steps[this.i];
    let [tx, tz] = this.nav.standXZ(s.node), ty = s.f * STOREY;
    const last = this.i === this.steps.length - 1;
    // the tolerance only applies to the last step
    let reach = last ? Math.max(0.3, this.opts.tol * 0.8) : 0.55;
    if (this.opts.speed === 'run') reach += 0.15;
    if (s.kind === 'door') {
      const d = this.doorBetween(s.prev, s.node);
      if (d && d.barricade > 0) { this.blockedBy = d; this.failed = true; this.sim.emit('blocked', { actor: a, door: d }); return; }
      if (d && !d.dead && d.open < 0.6) {
        const dc = this.doorCentre(d);
        if (Math.hypot(pos[0] - dc[0], pos[2] - dc[1]) < 2.0) { if (d.target < 0.5) { d.setOpen(true); sim.noise([dc[0], pos[1] + 1, dc[1]], 7, 'door', a); } this.noteDoor(d, pos); }
        if (d.open < 0.6) { this.slowApproach(tx, tz, dc); return; }
      } else if (d && !d.dead && !this.passed.some((p) => p.door === d)) this.noteDoor(d, pos);
    }
    if (s.kind === 'barrier') { if (this.breakBarrier(s, dt)) return; [tx, tz] = this.nav.standXZ(s.node); }
    if (s.kind === 'vault') {
      const win = this.windowBetween(s.prev, s.node);
      if (win && win.solid) { this.failed = true; return; }
      const [px, pz] = this.nav.standXZ(s.prev);
      const near = Math.hypot(pos[0] - px, pos[2] - pz) < 0.5;
      if (!near) { tx = px; tz = pz; }
      else { // hop over the sill
        a.yaw = yawOf(tx - pos[0], tz - pos[2]);
        a.startVault([tx, s.f * STOREY, tz]);
        this.i++; return;
      }
    }
    if (s.kind === 'stair' && s.pts) {
      const p = s.pts[this.subIdx];
      if (p) {
        tx = p[0]; tz = p[2]; ty = p[1]; reach = 0.45;
        if (Math.hypot(pos[0] - tx, pos[2] - tz) < reach && Math.abs(pos[1] - ty) < 0.9) { this.subIdx++; if (this.subIdx >= s.pts.length) { this.i++; this.subIdx = 0; } return; }
      } else { this.i++; this.subIdx = 0; return; }
    }
    const dx = tx - pos[0], dz = tz - pos[2], dd = Math.hypot(dx, dz);
    const nx = this.steps[this.i + 1];
    // do not cut a corner that would send the body into a wall or a prop: close in on the waypoint first
    const clear = !nx || dd < 0.2 || nx.kind !== 'walk' || nx.f !== s.f || last || this.nav.canWalk(pos[0], pos[2], ...this.nav.standXZ(nx.node), s.f);
    if (dd < reach && s.kind !== 'stair' && s.kind !== 'barrier' && clear) {
      this.i++; if (this.i >= this.steps.length && !this.opts.exact) { const tg = this.target || [this.goal[0], this.goal[2]]; if (Math.hypot(pos[0] - tg[0], pos[2] - tg[1]) < this.opts.tol + 0.4) this.arrived = true; }
      this.prog = { best: 1e9, t: sim.time };
      return;
    }
    this.wish = [dx / (dd || 1), dz / (dd || 1)];
    this.speed = this.opts.speed; this.faceYaw = yawOf(dx, dz);
    this.watchProgress(dt, this.remaining());
    if (!this.wish || this.pending) return; // re-planned or pulled out of a pocket just now
    // stuck detection: the body is not moving at all
    this.stuckT += dt;
    if (this.stuckT > 0.6) {
      const moved = Math.hypot(pos[0] - this.lastPos[0], pos[2] - this.lastPos[2]);
      if (moved < 0.12 && !a.busy && a.mode === 'normal') {
        this.stuckN++;
        const tg = this.target || [this.goal[0], this.goal[2]], toGoal = Math.hypot(pos[0] - tg[0], pos[2] - tg[1]);
        if (this.stuckN === 2) this.plan();
        else if (this.stuckN === 3 && this.i < this.steps.length - 1 && this.steps[this.i].kind === 'walk' && this.steps[this.i + 1].kind === 'walk') this.i++; // a waypoint we cannot reach: skip it
        else if (this.stuckN === 4 && toGoal < this.opts.tol + 2.2) { this.arrived = true; this.stuckN = 0; return; } // close enough
        else if (this.stuckN >= 5) { this.dodgeT = 0.6; this.dodgeDir = this.b.prof.p.lefty * (this.stuckN % 2 ? 1 : -1); if (this.stuckN > 8) { this.failed = true; this.stuckN = 0; } }
      } else this.stuckN = Math.max(0, this.stuckN - 1);
      this.lastPos = [...pos]; this.stuckT = 0;
    }
    if (!this.wish) return;
    if (this.dodgeT > 0) { this.dodgeT -= dt; const r = a.right; this.wish = [this.wish[0] * 0.4 + r[0] * this.dodgeDir, this.wish[1] * 0.4 + r[2] * this.dodgeDir]; this.norm(); }
    // keep clear of friends
    const inDoor = this.nav.doorDist(pos[0], pos[2], s.f).d < 1.5;
    for (const o of sim.actors) {
      if (o === a || !o.alive || o.team !== a.team || Math.abs(o.pos[1] - pos[1]) > 1.2) continue;
      const ox = pos[0] - o.pos[0], oz = pos[2] - o.pos[2], od = Math.hypot(ox, oz);
      if (od >= 0.9 || od < 1e-3) continue;
      if (inDoor) { // a doorway is one body wide: queue behind whoever is in front rather than shoving sideways
        if (-(ox * this.wish[0] + oz * this.wish[1]) / od > 0.4 && od < 0.8) { this.wish[0] *= 0.25; this.wish[1] *= 0.25; }
        continue;
      }
      this.wish[0] += (ox / od) * (0.9 - od) * 0.8; this.wish[1] += (oz / od) * (0.9 - od) * 0.8;
    }
    this.norm();
    if (s.kind === 'walk' && this.wish && (this.wish[0] || this.wish[1])) this.steer(pos);
  }

  // ---------------------------------------------------------------- progress watchdog
  // A bot that slides along something without getting closer is as stuck as one that does not move.
  watchProgress(dt, remaining) {
    const sim = this.sim, pr = this.prog;
    if (remaining < pr.best - 0.3) { pr.best = remaining; pr.t = sim.time; return; }
    if (sim.time - pr.t < 3.2) return;
    pr.t = sim.time; pr.best = remaining; this.stalls++;
    const a = this.a, here = this.nav.snap(a.pos[0], a.pos[1], a.pos[2]);
    if (this.stalls === 1 || this.stalls === 3) { // plan again, with this neighbourhood made expensive
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const x = this.nav.parts(here)[0] + dx, z = this.nav.parts(here)[1] + dz, f = this.nav.parts(here)[2]; if (this.nav.walkable(x, z, f)) this.avoid.set(this.nav.node(x, z, f), 14); }
      this.plan();
    } else if (this.stalls === 2) this.unstick(...(this.steps[this.i] ? this.nav.standXZ(this.steps[this.i].node) : this.target || [a.pos[0], a.pos[2]]));
    else if (this.stalls >= 4) { this.failed = true; this.stalls = 0; this.sim.emit('nopath', { actor: a, stuck: true }); }
  }
  // Walled into a pocket (a deployable shield across the mouth of a gap, furniture all round): find the
  // closest cell on the open side and hop out to it. Returns whether the bot was moved.
  rescue() {
    const nav = this.nav, a = this.a; if (a.mode !== 'normal' || a.busy) return false;
    if (this.sim.time - (this.lastRescue || -99) < 6) return false;
    const from = nav.snap(a.pos[0], a.pos[1], a.pos[2]), seen = new Set([from]), q = [from];
    while (q.length && seen.size < 260) { const n = q.pop(); nav.each(n, (m) => { if (!seen.has(m)) { seen.add(m); q.push(m); } }, false); }
    if (seen.size >= 260) return false; // plenty of room: not a pocket
    // the nearest cell on this storey that is outside the pocket, has room to roam and can be reached
    // without crossing a wall (a hop across the building's outer wall only gets pushed straight back)
    const w = this.sim.world, [fx, fz, ff] = nav.parts(from); let best = -1, bd = 1e9;
    const big = (n) => { const s2 = new Set([n]), q2 = [n]; while (q2.length && s2.size < 120) { const m = q2.pop(); nav.each(m, (k) => { if (!s2.has(k)) { s2.add(k); q2.push(k); } }, false); } return s2.size >= 120; };
    const cands = [];
    for (let r = 1; r <= 7; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
      const x = fx + dx, z = fz + dz; if (!nav.walkable(x, z, ff) || nav.isHole(x, z, ff)) continue;
      const n = nav.node(x, z, ff); if (seen.has(n) || !nav.fits(n)) continue;
      cands.push([Math.hypot(dx, dz), n]);
    }
    cands.sort((p, q) => p[0] - q[0]);
    for (const [d, n] of cands.slice(0, 40)) {
      const c = nav.centre(n);
      if (w.cast(a.pos[0], a.pos[1] + 1.0, a.pos[2], c[0] - a.pos[0], 0, c[2] - a.pos[2], Math.hypot(c[0] - a.pos[0], c[2] - a.pos[2]), CAST.GLASS | CAST.PROPS)) continue; // a wall in between
      if (!big(n)) continue;
      bd = d; best = n; break;
    }
    if (best < 0) return false;
    this.lastRescue = this.sim.time;
    const to = nav.centre(best);
    if (bd <= 3.4) a.startVault([to[0], to[1], to[2]]); else { a.pos[0] = to[0]; a.pos[1] = to[1]; a.pos[2] = to[2]; a.vel[0] = a.vel[2] = 0; }
    this.stop(); this.sim.emit('rescue', { actor: a, to });
    return true;
  }
  // wedged between props for several seconds: hop to the closest free spot towards the next waypoint
  unstick(tx, tz) {
    const a = this.a, w = this.sim.world, pos = a.pos; let best = null, bd = 1e9;
    for (let r = 0.45; r <= 1.5; r += 0.35) for (let k = 0; k < 16; k++) {
      const ang = (k / 16) * Math.PI * 2, px = pos[0] + Math.sin(ang) * r, pz = pos[2] + Math.cos(ang) * r;
      let ok = !w.cast(pos[0], pos[1] + 0.9, pos[2], px - pos[0], 0, pz - pos[2], r, 0);
      for (let j = 0; ok && j < 8; j++) { const aa = (j / 8) * Math.PI * 2; if (w.cast(px, pos[1] + 0.5, pz, Math.sin(aa), 0, Math.cos(aa), 0.3, 0) || w.cast(px, pos[1] + 1.3, pz, Math.sin(aa), 0, Math.cos(aa), 0.3, 0)) ok = false; }
      if (!ok) continue;
      const d = Math.hypot(tx - px, tz - pz); if (d < bd) { bd = d; best = [px, pos[1], pz]; }
    }
    if (best) { a.pos[0] = best[0]; a.pos[2] = best[2]; a.vel[0] = a.vel[2] = 0; this.stuckN = 0; } else this.failed = true;
  }
  // whiskers: if a prop or wall is right ahead, slide round it towards the freer side
  steer(pos) {
    const w = this.sim.world, y = pos[1], wish = this.wish; if (!wish) return; const l = Math.hypot(wish[0], wish[1]); if (l < 1e-3) return;
    const ux = wish[0] / l, uz = wish[1] / l, reach = 0.62;
    const free = (dx, dz, d) => { for (const h of [0.4, 1.1]) { const hit = w.cast(pos[0], y + h, pos[2], dx, 0, dz, d, 0); if (hit && !(hit.panel && (hit.panel.door || hit.panel.kind === 'glass'))) return false; } return true; };
    if (free(ux, uz, reach) && free(ux, uz, 0.3)) return;
    for (const ang of [0.45, -0.45, 0.9, -0.9, 1.35, -1.35]) {
      const c = Math.cos(ang), sn = Math.sin(ang), dx = ux * c - uz * sn, dz = ux * sn + uz * c;
      if (free(dx, dz, reach)) { this.wish = [dx, dz]; return; }
    }
  }

  // ---------------------------------------------------------------- barricades on the route
  // returns true while the bot is busy with the barricade (approaching it or breaking it)
  breakBarrier(s, dt) {
    const a = this.a, nav = this.nav, [x0, z0, f] = nav.parts(s.prev), [x1, z1] = nav.parts(s.node);
    const bar = nav.barrierAt(x0, z0, x1, z1, f);
    if (!bar) { this.i++; this.bar = null; return true; } // already broken
    const [px, pz] = nav.standXZ(s.prev), pos = a.pos;
    if (Math.hypot(pos[0] - px, pos[2] - pz) > 0.7) { this.wish = [px - pos[0], pz - pos[2]]; this.norm(); this.speed = this.opts.speed; this.faceYaw = yawOf(px - pos[0], pz - pos[2]); this.steer(pos); return true; }
    this.faceYaw = yawOf(bar.centre[0] - pos[0], bar.centre[2] - pos[2]);
    this.b.attackBarrier(bar, dt);
    return true;
  }
  slowApproach(tx, tz, dc) {
    const a = this.a, d = Math.hypot(a.pos[0] - dc[0], a.pos[2] - dc[1]);
    if (d > 1.15) { this.wish = [dc[0] - a.pos[0], dc[1] - a.pos[2]]; this.norm(); this.speed = 'walk'; this.faceYaw = yawOf(this.wish[0], this.wish[1]); } else this.faceYaw = yawOf(tx - a.pos[0], tz - a.pos[2]);
  }
  norm() { if (!this.wish) return; const l = Math.hypot(this.wish[0], this.wish[1]); if (l > 1) { this.wish[0] /= l; this.wish[1] /= l; } }
  // remaining distance along the route (metres, rough)
  remaining() {
    let d = 0, px = this.a.pos[0], pz = this.a.pos[2];
    for (let k = this.i; k < this.steps.length; k++) { const s = this.steps[k], [qx, qz] = this.nav.standXZ(s.node); d += Math.hypot(qx - px, qz - pz); px = qx; pz = qz; }
    return d;
  }
}
void wrapAngle;
