// An AI hand on a recon drone. It plans a route over the shared navigation graph, drives the
// wheels, climbs stairs, opens doors by nudging them, hops kerbs and benches when it is held up,
// pauses to look round in each room, and reports every defender or trap it sees to its squad.
import { STOREY } from '../world/grid.js';
import { yawOf, wrapAngle, clamp } from '../sim/util.js';

export class DronePilot {
  // plan: world positions [x, y, z] to survey, in order
  constructor(dir, brain, dr, plan) {
    this.dir = dir; this.b = brain; this.dr = dr; this.sim = dir.sim; this.nav = dir.sim.nav;
    this.plan = plan.filter(Boolean); this.pi = 0; this.path = []; this.i = 0; this.sub = 0;
    this.dwell = 0; this.look = 0; this.replans = 0; this.lastPlan = -9; this.told = new Map(); this.done = false;
    this.trail = [];
  }
  get goal() { return this.plan[this.pi]; }
  // find a way to the current goal that a wheeled drone can take (no vaults, drops or barricades)
  route() {
    const nav = this.nav, dr = this.dr; this.lastPlan = this.sim.time;
    const g = this.goal; if (!g) { this.done = true; return; }
    const from = nav.snap(dr.pos[0], dr.pos[1], dr.pos[2]), to = nav.snap(g[0], g[1], g[2]);
    let path = nav.find(from, to, { avoidDoors: false });
    if (!path) { this.nextGoal(); return; }
    const cut = path.findIndex((s) => s.kind === 'vault' || s.kind === 'drop' || s.kind === 'barrier');
    if (cut >= 0) path = path.slice(0, cut);
    this.path = path; this.i = 0; this.sub = 0;
    if (!path.length && Math.hypot(dr.pos[0] - g[0], dr.pos[2] - g[2]) < 1.4) this.arrive();
  }
  nextGoal() { this.pi++; this.path = []; this.i = 0; this.dwell = 0; if (this.pi >= this.plan.length) this.done = true; }
  arrive() { this.dwell = 2.2 + this.sim.rand() * 1.4; this.look = this.sim.rand() < 0.5 ? 1 : -1; this.path = []; }
  update(dt) {
    const dr = this.dr, sim = this.sim, c = dr.ctl; if (dr.dead) return;
    c.fwd = 0; c.strafe = 0; c.turn = 0; c.jump = false; c.pitch = -dr.pitch * 0.8;
    this.report();
    if (dr.jam > 0) return;
    if (this.dwell > 0) { // look round: a slow pan, then on to the next place
      this.dwell -= dt; c.turn = 0.55 * this.look * (Math.sin(sim.time * 1.3) > -0.4 ? 1 : -0.4);
      if (this.dwell <= 0) this.nextGoal();
      return;
    }
    if (this.done) { c.turn = 0.35; return; }
    if (!this.path.length || this.i >= this.path.length) {
      const g = this.goal;
      if (g && Math.hypot(dr.pos[0] - g[0], dr.pos[2] - g[2]) < 1.6 && Math.abs(dr.pos[1] - g[1]) < 1.8) { this.arrive(); return; }
      if (sim.time - this.lastPlan > 0.6) { this.route(); if (++this.replans > 40) this.done = true; }
      return;
    }
    const s = this.path[this.i];
    let tx, tz;
    if (s.kind === 'stair' && s.pts) {
      const p = s.pts[this.sub]; if (!p) { this.i++; this.sub = 0; return; }
      tx = p[0]; tz = p[2];
      if (Math.hypot(dr.pos[0] - tx, dr.pos[2] - tz) < 0.4) { this.sub++; if (this.sub >= s.pts.length) { this.i++; this.sub = 0; } return; }
    } else {
      [tx, tz] = this.nav.standXZ(s.node);
      if (s.kind === 'door') this.openDoorAhead(s);
      if (Math.hypot(dr.pos[0] - tx, dr.pos[2] - tz) < 0.42) { this.i++; this.sub = 0; if (this.i >= this.path.length) { const g = this.goal; if (g && Math.hypot(dr.pos[0] - g[0], dr.pos[2] - g[2]) < 2.2) this.arrive(); } return; }
    }
    const want = yawOf(tx - dr.pos[0], tz - dr.pos[2]), da = wrapAngle(want - dr.yaw);
    c.turn = clamp(da * 3.2, -1, 1);
    c.fwd = Math.abs(da) < 0.5 ? 1 : Math.abs(da) < 1.2 ? 0.35 : 0;
    // held up: hop it, then back up and try again, then plan a different way
    if (dr.stuckT > 0.35 && dr.grounded) c.jump = true;
    if (dr.stuckT > 1.4) { c.fwd = -1; c.turn = this.look || 1; }
    if (dr.stuckT > 2.6) { dr.stuckT = 0; this.path = []; if (++this.replans > 12) this.nextGoal(); else this.route(); }
    c.pitch = -dr.pitch * 0.8 + Math.sin(sim.time * 0.9) * 0.05;
  }
  // doors open when a drone drives into them
  openDoorAhead(s) {
    const [x0, z0] = this.nav.parts(s.prev), w = this.sim.world, y = s.f * STOREY;
    const p = x0 !== s.x ? w.getX(Math.max(x0, s.x), y, z0) : w.getZ(x0, y, Math.max(z0, s.z)), q = x0 !== s.x ? w.getX(Math.max(x0, s.x), y + 1, z0) : w.getZ(x0, y + 1, Math.max(z0, s.z));
    const d = (p && p.door) || (q && q.door); if (!d || d.dead || d.barricade > 0 || d.target > 0.5) return;
    const dc = [d.ax === 'x' ? d.ix : d.ix + 0.5, d.ax === 'x' ? d.iz + 0.5 : d.iz];
    if (Math.hypot(this.dr.pos[0] - dc[0], this.dr.pos[2] - dc[1]) < 1.5) d.setOpen(true);
  }
  // tell the squad about every enemy and trap the drone has just seen
  report() {
    const dr = this.dr, sim = this.sim, now = sim.time;
    for (const [id, t] of dr.seen) {
      if (now - t > 0.3) continue;
      const a = sim.actors.find((x) => x.id === id); if (!a || !a.alive) continue;
      if (now - (this.told.get(id) ?? -9) < 4) continue; this.told.set(id, now);
      this.dir.droneSaw(this.b.a, a, dr);
    }
  }
}
