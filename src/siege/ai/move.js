// Path following for bots: plans with the shared A*, walks the route, opens doors on the way,
// vaults windows, climbs stairs, notices when it is stuck or the world changed, and replans.
import { STOREY } from '../world/grid.js';
import { yawOf, wrapAngle } from '../sim/util.js';

export class Mover {
  constructor(brain) {
    this.b = brain; this.a = brain.a; this.sim = brain.a.sim; this.nav = this.sim.nav;
    this.steps = []; this.i = 0; this.goal = null; this.opts = {}; this.arrived = true; this.failed = false;
    this.wish = null; this.speed = 'walk'; this.faceYaw = null; this.ver = -1; this.lastPlan = -9;
    this.stuckT = 0; this.lastPos = [...this.a.pos]; this.stuckN = 0; this.dodgeT = 0; this.dodgeDir = 0;
    this.waitT = 0; this.pending = false; this.blockedBy = null; this.subIdx = 0; this.vaulting = false;
  }
  stop() { this.steps = []; this.i = 0; this.goal = null; this.arrived = true; this.wish = null; this.pending = false; }
  get active() { return !!this.goal && !this.arrived && !this.failed; }
  // set a destination in world coordinates [x, y, z]
  goTo(pos, o = {}) {
    this.goal = [...pos]; this.opts = { speed: 'walk', tol: 0.55, ...o }; this.arrived = false; this.failed = false; this.pending = true;
    this.plan();
    return !this.failed;
  }
  plan() {
    const sim = this.sim, a = this.a;
    if (sim.pathBudget !== undefined && sim.pathBudget <= 0) { this.pending = true; return; }
    if (sim.pathBudget !== undefined) sim.pathBudget--;
    const from = this.nav.snap(a.pos[0], a.pos[1], a.pos[2]), to = this.nav.snap(this.goal[0], this.goal[1], this.goal[2]);
    this.lastPlan = sim.time; this.ver = sim.worldVer || 0; this.pending = false;
    const path = this.nav.find(from, to, { cost: this.opts.cost || this.b.costFn(), avoidDoors: false, goalTol: this.opts.goalTol || 0 });
    if (!path) { this.steps = []; this.failed = true; this.sim.emit('nopath', { actor: a }); return; }
    this.steps = this.nav.smooth(a.pos[0], a.pos[2], this.nav.floorOf(a.pos[1]), path); this.i = 0; this.subIdx = 0; this.failed = false;
    if (!this.steps.length) this.arrived = Math.hypot(a.pos[0] - this.goal[0], a.pos[2] - this.goal[2]) < this.opts.tol + 0.6;
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

  update(dt) {
    const a = this.a, sim = this.sim;
    this.wish = null; this.faceYaw = null;
    if (!this.goal || this.arrived) return;
    if (a.mode !== 'normal') return;
    if (this.pending) { this.plan(); if (this.pending || this.failed) return; }
    if ((sim.worldVer || 0) !== this.ver && sim.time - this.lastPlan > 0.8) this.plan();
    if (this.failed) return;
    if (this.waitT > 0) { this.waitT -= dt; return; }
    const pos = a.pos;
    // reached the end?
    if (this.i >= this.steps.length) {
      if (Math.hypot(pos[0] - this.goal[0], pos[2] - this.goal[2]) < this.opts.tol + 0.15 || this.steps.length === 0) { this.arrived = true; return; }
      this.wish = [this.goal[0] - pos[0], this.goal[2] - pos[2]]; this.norm();
      if (Math.hypot(this.wish[0], this.wish[1]) < 1e-3) this.arrived = true;
      this.speed = this.opts.speed; this.faceYaw = yawOf(this.goal[0] - pos[0], this.goal[2] - pos[2]);
      return;
    }
    const s = this.steps[this.i];
    let tx = s.x + 0.5, tz = s.z + 0.5, ty = s.f * STOREY;
    const last = this.i === this.steps.length - 1;
    // the tolerance only applies to the last step
    let reach = last ? Math.max(0.3, this.opts.tol * 0.8) : 0.55;
    if (this.opts.speed === 'run') reach += 0.15;
    if (s.kind === 'door') {
      const d = this.doorBetween(s.prev, s.node);
      if (d && d.barricade > 0) { this.blockedBy = d; this.failed = true; this.sim.emit('blocked', { actor: a, door: d }); return; }
      if (d && !d.dead && d.open < 0.6) {
        const dc = [d.ax === 'x' ? d.ix : d.ix + 0.5, d.ax === 'x' ? d.iz + 0.5 : d.iz];
        if (Math.hypot(pos[0] - dc[0], pos[2] - dc[1]) < 2.0) { d.setOpen(true); this.waitT = 0.0; }
        if (d.open < 0.6) { this.slowApproach(tx, tz, dc); return; }
      }
    }
    if (s.kind === 'vault') {
      const win = this.windowBetween(s.prev, s.node);
      if (win && win.solid) { this.failed = true; return; }
      const [px, pz] = this.nav.parts(s.prev);
      const near = Math.hypot(pos[0] - (px + 0.5), pos[2] - (pz + 0.5)) < 0.5;
      if (!near) { tx = px + 0.5; tz = pz + 0.5; }
      else { // hop over the sill
        a.yaw = yawOf(s.x + 0.5 - pos[0], s.z + 0.5 - pos[2]);
        a.startVault([s.x + 0.5, s.f * STOREY, s.z + 0.5]);
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
    if (dd < reach && s.kind !== 'stair') {
      // look ahead: cut the corner if the next hop is straight and free
      this.i++; if (this.i >= this.steps.length && !this.opts.exact) { if (Math.hypot(pos[0] - this.goal[0], pos[2] - this.goal[2]) < this.opts.tol + 0.4) this.arrived = true; }
      return;
    }
    this.wish = [dx / (dd || 1), dz / (dd || 1)];
    this.speed = this.opts.speed; this.faceYaw = yawOf(dx, dz);
    // stuck detection
    this.stuckT += dt;
    if (this.stuckT > 0.6) {
      const moved = Math.hypot(pos[0] - this.lastPos[0], pos[2] - this.lastPos[2]);
      if (moved < 0.12 && !a.busy && a.mode === 'normal') {
        this.stuckN++;
        if (this.stuckN === 2) this.plan(); else if (this.stuckN >= 3) { this.dodgeT = 0.6; this.dodgeDir = this.b.prof.p.lefty * (this.stuckN % 2 ? 1 : -1); if (this.stuckN > 7) { this.failed = true; this.stuckN = 0; } }
      } else this.stuckN = Math.max(0, this.stuckN - 1);
      this.lastPos = [...pos]; this.stuckT = 0;
    }
    if (this.dodgeT > 0) { this.dodgeT -= dt; const r = a.right; this.wish = [this.wish[0] * 0.4 + r[0] * this.dodgeDir, this.wish[1] * 0.4 + r[2] * this.dodgeDir]; this.norm(); }
    // keep clear of friends
    for (const o of sim.actors) {
      if (o === a || !o.alive || o.team !== a.team || Math.abs(o.pos[1] - pos[1]) > 1.2) continue;
      const ox = pos[0] - o.pos[0], oz = pos[2] - o.pos[2], od = Math.hypot(ox, oz);
      if (od < 0.9 && od > 1e-3) { this.wish[0] += (ox / od) * (0.9 - od) * 0.8; this.wish[1] += (oz / od) * (0.9 - od) * 0.8; }
    }
    this.norm();
  }
  slowApproach(tx, tz, dc) {
    const a = this.a, d = Math.hypot(a.pos[0] - dc[0], a.pos[2] - dc[1]);
    if (d > 1.15) { this.wish = [dc[0] - a.pos[0], dc[1] - a.pos[2]]; this.norm(); this.speed = 'walk'; this.faceYaw = yawOf(this.wish[0], this.wish[1]); } else this.faceYaw = yawOf(tx - a.pos[0], tz - a.pos[2]);
  }
  norm() { const l = Math.hypot(this.wish[0], this.wish[1]); if (l > 1) { this.wish[0] /= l; this.wish[1] /= l; } }
  // remaining distance along the route (metres, rough)
  remaining() {
    let d = 0, px = this.a.pos[0], pz = this.a.pos[2];
    for (let k = this.i; k < this.steps.length; k++) { const s = this.steps[k]; d += Math.hypot(s.x + 0.5 - px, s.z + 0.5 - pz); px = s.x + 0.5; pz = s.z + 0.5; }
    return d;
  }
}
void wrapAngle;
