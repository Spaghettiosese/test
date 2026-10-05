// Team-level planners. The attack director stages the squad, opens walls with the right tool,
// pushes in from two directions, plants, then holds the defuser. The defence director spends
// the reinforcement budget, boards up windows, lays traps, assigns anchors and roamers, listens
// for the push and retakes the bomb. Both share what any member sees or hears with the rest.
import { analyseSite } from './analysis.js';
import { findCover } from './tactics.js';
import { STOREY, CAST } from '../world/grid.js';
import { dist2, dist3, norm, sub, yawOf, clamp } from '../sim/util.js';

export class Director {
  constructor(sim, team, level) {
    this.sim = sim; this.team = team; this.level = level; this.brains = []; this.queue = []; this.log = [];
    this.intel = new Map(); this.rand = sim.rand; this.t = 0; this.state = 'init'; this.stateT = 0; this.say = [];
    this.trapSeen = [];
  }
  get round() { return this.sim.round; }
  add(brain) { this.brains.push(brain); brain.dir = this; }
  live() { return this.brains.filter((b) => b.a.alive); }
  enemyTeam() { return this.team === 'atk' ? 'def' : 'atk'; }

  // ---------------------------------------------------------------- comms
  callout(actor, enemy, pos) {
    const delay = 0.35 + this.rand() * 0.5;
    this.queue.push({ t: this.sim.time + delay, entry: { id: enemy.id, actor: enemy, pos: [...pos], vel: [enemy.vel[0], 0, enemy.vel[2]], t: this.sim.time, conf: 1, src: 'team' }, from: actor });
    if (this.brains.some((b) => b.a.isPlayer)) { /* the human hears it through the HUD feed */ }
    const room = this.sim.world.roomName(pos[0], pos[1], pos[2]);
    this.sim.emit('callout', { actor, enemy, pos, room, team: this.team });
  }
  hint(actor, pos, n) {
    // a teammate's shots pull the nearest idle bot's attention
    void actor; void pos; void n;
  }
  knownTraps() { return this.trapSeen; }
  // Something happened at `pos` (a shot, a breach, a bot hit by an unseen enemy): send the bots that
  // are free, willing and close enough to have a look, the curious and aggressive ones first.
  alert(pos, kind, from, count = 1) {
    const now = this.sim.time; this.alertAt = this.alertAt || {};
    if (now - (this.alertAt[kind] ?? -9) < 2.2) return; this.alertAt[kind] = now;
    const cands = [];
    for (const b of this.live()) {
      if (b === from || b.inCombat || b.a.busy || b.rvTarget || (b.hunt && now < b.hunt.until)) continue;
      const d = dist3(b.a.pos, pos); if (d > 36 || !b.persona) continue;
      if (!b.huntWilling(kind === 'hurt' ? 'assist' : 'sound', pos)) continue;
      const p = b.persona, bonus = { roamer: 0.4, rotator: 0.4, aggressor: 0.5, fragger: 0.3, lurker: 0.2, anchor: -0.3, trapper: -0.2, medic: -0.1 }[p.id] || 0;
      cands.push({ b, s: p.p.curious * 0.4 + p.p.team * 0.3 + p.push * 0.3 + bonus - d / 40 });
    }
    cands.sort((q, r) => r.s - q.s);
    for (let i = 0; i < Math.min(count, cands.length); i++) cands[i].b.startHunt(pos, kind === 'hurt' ? 'assist' : 'sound', 12);
  }
  flushQueue() {
    const now = this.sim.time;
    while (this.queue.length && this.queue[0].t <= now) {
      const q = this.queue.shift();
      for (const b of this.brains) if (b.a !== q.from && b.a.alive) b.sense.learn(q.entry, q.from);
      const key = q.entry.id; const old = this.intel.get(key); if (!old || old.t < q.entry.t) this.intel.set(key, q.entry);
    }
  }
  intelAbout(roomCentre, radius, maxAge = 8) {
    let n = 0; const now = this.sim.time;
    for (const e of this.intel.values()) { if (!e.actor.alive || now - e.t > maxAge) continue; if (dist3(e.pos, roomCentre) < radius) n++; }
    return n;
  }
  update(dt) { this.t += dt; this.stateT += dt; this.flushQueue(); this.scanTraps(); }
  scanTraps() {
    if (this.sim.time - (this.trapT || 0) < 0.7) return; this.trapT = this.sim.time;
    // devices a teammate has a clear view of are known to the whole team
    for (const d of this.sim.devices.list) {
      if (d.dead || d.team === this.team || !['mat', 'claymore', 'edd', 'mines', 'barbwire'].includes(d.kind) || d.seenBy) continue;
      for (const b of this.live()) {
        const e = b.a.eye();
        if (dist3(e, d.pos) < 11 && this.sim.world.visible(e, d.pos, CAST.GLASS)) { d.seenBy = this.team; this.trapSeen.push(d.pos); break; }
      }
    }
    this.trapSeen = this.trapSeen.filter((p) => this.sim.devices.list.some((d) => !d.dead && d.pos === p));
  }
  arrived(actor, task) { void actor; void task; }
  taskDone(actor) { const b = actor.ai; if (b) this.nextJob(b); }
  taskFailed(actor, why) { const b = actor.ai; if (!b) return; this.log.push(`${actor.name} failed: ${why}`); this.nextJob(b); }
  nextJob(b) {
    const j = b.jobs && b.jobs.shift();
    b.setTask(j || b.finalTask || null);
  }
  give(b, jobs, final = null) { b.jobs = jobs.slice(); b.finalTask = final; this.nextJob(b); }
}

// ===================================================================================== ATTACK
export class AttackDirector extends Director {
  init() {
    const sim = this.sim, site = this.round.site;
    this.an = analyseSite(sim, site);
    this.spawn = this.round.spawn;
    this.sitePos = site.center; this.plantSpot = 0; this.planter = null;
    this.routeA = this.routeB = null; this.staged = new Set(); this.planStart = 0; this.postPlantSet = false; this.reinforcedKnown = new Set();
    this.state = 'prep';
    this.scouts = [];
    // everyone waits at the spawn during preparation; two bots fly drones
    const live = this.live();
    live.forEach((b, i) => b.setTask({ type: 'hold', pos: sim.nav.centre(sim.nav.snap(this.spawn.cx + (i - 2) * 1.6, 0, this.spawn.cz)), facing: yawOf(this.sitePos[0] - this.spawn.cx, this.sitePos[2] - this.spawn.cz), sweep: 0.2 }));
    const droners = live.slice(0, 2);
    for (const b of droners) this.launchDrone(b);
  }
  launchDrone(b) {
    const a = b.a, sim = this.sim;
    const dr = sim.devices.spawnDrone(a, [a.pos[0] + a.fwd[0], a.pos[1], a.pos[2] + a.fwd[2]], a.yaw);
    const target = this.sitePos, nav = sim.nav;
    const path = nav.find(nav.snap(dr.pos[0], 0, dr.pos[2]), nav.snap(target[0], target[1], target[2]), { avoidDoors: true }) || nav.find(nav.snap(dr.pos[0], 0, dr.pos[2]), nav.snap(target[0], target[1], target[2]));
    this.scouts.push({ dr, path: path || [], i: 0, look: 0, wait: 0 });
  }
  updateDrones(dt) {
    const sim = this.sim, nav = sim.nav;
    for (const s of this.scouts) {
      const dr = s.dr; if (dr.dead) continue;
      const step = s.path[s.i];
      dr.ctl.fwd = 0; dr.ctl.turn = 0; dr.ctl.pitch = 0;
      if (!step) { dr.ctl.turn = 0.6; continue; }
      const tx = step.x + 0.5, tz = step.z + 0.5, f = step.f;
      if (f * STOREY > dr.pos[1] + 0.5 || step.kind === 'stair') { s.i++; continue; } // a wheeled drone cannot climb: it surveys from where it is
      // doors: nudge them open by driving into them (the drone opens a door by touch)
      const d = nav.each ? null : null; void d;
      const dx = tx - dr.pos[0], dz = tz - dr.pos[2], dd = Math.hypot(dx, dz), want = yawOf(dx, dz);
      let da = want - dr.yaw; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
      dr.ctl.turn = clamp(da * 3, -1, 1); dr.ctl.fwd = Math.abs(da) < 0.6 ? 1 : 0.1;
      if (step.kind === 'door') { const dd2 = sim.world.getX(Math.max(step.x, nav.parts(step.prev)[0]), step.f * STOREY, step.z); void dd2; for (const door of sim.world.doors) if (!door.dead && Math.abs((door.ax === 'x' ? door.ix : door.ix + 0.5) - dr.pos[0]) < 1.6 && Math.abs((door.ax === 'x' ? door.iz + 0.5 : door.iz) - dr.pos[2]) < 1.6 && door.barricade <= 0) door.setOpen(true); }
      if (dd < 0.5) s.i++;
      dr.ctl.pitch = Math.sin(sim.time * 0.7) * 0.1;
    }
  }
  update(dt) {
    super.update(dt);
    const r = this.round, sim = this.sim;
    if (r.inPrep()) { this.updateDrones(dt); return; }
    if (this.state === 'prep') this.beginAction();
    const live = this.live();
    if (!live.length) return;
    // retire the drones when the action phase starts
    if (this.scouts.length) { for (const s of this.scouts) if (!s.dr.dead) sim.devices.killDrone(s.dr, null); this.scouts = []; }
    switch (this.state) {
      case 'stage': this.stageStep(); break;
      case 'push': this.pushStep(dt); break;
      case 'post': this.postStep(dt); break;
      default: break;
    }
    if (r.bomb.state === 'planted' && this.state !== 'post') this.beginPostPlant();
    if (r.bomb.state === 'idle' && this.state === 'post') this.state = 'push';
  }

  beginAction() {
    const sim = this.sim, nav = sim.nav, live = this.live(), r = this.round;
    this.state = 'stage'; this.stateT = 0;
    const from = nav.snap(this.spawn.cx, 0, this.spawn.cz), to = nav.snap(this.sitePos[0], this.sitePos[1], this.sitePos[2]);
    const route = nav.find(from, to);
    this.routeA = route || [];
    // a second, different way in: punish the first route's interior cells
    const used = new Set(); if (route) for (const s of route) used.add(s.node);
    const costFn = (n) => { if (used.has(n)) return 7; const x = n % nav.W, z = Math.floor(n / nav.W) % nav.D; for (const u of used) { if (Math.abs((u % nav.W) - x) + Math.abs((Math.floor(u / nav.W) % nav.D) - z) < 2) return 3.5; } return 0; };
    this.routeB = nav.find(from, to, { cost: this.level >= 2 ? costFn : null }) || this.routeA;
    // roles
    const roles = new Map();
    const pick = (pred) => live.find((b) => !roles.has(b) && pred(b.a.op.ability));
    const pointman = pick((a) => a === 'shield' || a === 'flashshield'); if (pointman) roles.set(pointman, 'point');
    for (const b of live) {
      const ab = b.a.op.ability;
      if (['thermite', 'xpellet', 'torch', 'cluster', 'launcher'].includes(ab)) roles.set(b, 'breach');
      else if (ab === 'hammer') roles.set(b, 'hammer');
      else if (ab === 'scanner' || ab === 'sonar') roles.set(b, 'intel');
      else if (ab === 'stimpistol') roles.set(b, 'medic');
    }
    const rest = live.filter((b) => !roles.has(b));
    this.planter = rest[rest.length - 1] || live[live.length - 1]; roles.set(this.planter, roles.get(this.planter) || 'planter');
    for (const b of live) if (!roles.has(b)) roles.set(b, 'entry');
    this.roles = roles;
    // staging cells: a few metres before the route enters the building
    const stageOf = (route, k) => {
      let idx = route.findIndex((s) => sim.world.roomAt(s.x + 0.5, s.f * STOREY, s.z + 0.5) >= 0 && s.f === 0);
      if (idx < 0) idx = Math.min(route.length - 1, 6);
      const s = route[Math.max(0, idx - 4 - k)] || route[0] || { x: Math.floor(this.spawn.cx), z: Math.floor(this.spawn.cz), f: 0 };
      return [s.x + 0.5, 0, s.z + 0.5];
    };
    this.stageA = stageOf(this.routeA, 0); this.stageB = stageOf(this.routeB, 1);
    live.forEach((b, i) => {
      b.group = roles.get(b) === 'breach' || roles.get(b) === 'hammer' || i % 2 ? 'B' : 'A';
      if (this.routeA === this.routeB) b.group = 'A';
      const st = b.group === 'A' ? this.stageA : this.stageB;
      this.give(b, [{ type: 'goto', pos: [st[0] + (i % 3) * 0.6 - 0.6, 0, st[2] + ((i + 1) % 2) * 0.6], speed: 'run', tol: 1.0, sync: 'stage' }], { type: 'hold', pos: st, facing: yawOf(this.sitePos[0] - st[0], this.sitePos[2] - st[2]), sweep: 0.3 });
      b.stageReported = false;
    });
    this.pushAt = this.sim.time + 38; // never wait for ever
  }
  arrived(actor, task) {
    if (task.sync === 'stage') { this.staged.add(actor.id); }
    const b = actor.ai;
    if (task.type === 'goto') this.nextJob(b);
  }
  stageStep() {
    const live = this.live(), now = this.sim.time;
    const ready = live.every((b) => this.staged.has(b.a.id));
    if (ready || now > this.pushAt || this.round.t < 150 - 10) this.beginPush();
  }
  beginPush() {
    const sim = this.sim, live = this.live(), an = this.an;
    this.state = 'push'; this.stateT = 0;
    // pick breach targets: reinforced units of the site that are reachable from outside
    const reinforced = an.units.filter((u) => sim.world.unitReinforced(u.unit));
    const soft = an.units.filter((u) => !sim.world.unitReinforced(u.unit));
    this.breachTargets = { reinforced, soft };
    const hardOps = live.filter((b) => this.roles.get(b) === 'breach'), hammer = live.filter((b) => this.roles.get(b) === 'hammer');
    const used = new Set();
    for (const b of hardOps) {
      const ab = b.a.op.ability;
      const cand = (ab === 'launcher' ? soft : reinforced.length ? reinforced : soft).filter((u) => !used.has(u.unit));
      const u = this.bestUnitFor(b, cand);
      if (u) { used.add(u.unit); b.breachUnit = u; }
    }
    for (const b of hammer) { const u = this.bestUnitFor(b, soft.filter((x) => !used.has(x.unit))); if (u) { used.add(u.unit); b.breachUnit = u; } }
    for (const b of live) this.planJobs(b);
  }
  // the unit whose far side is closest to the bot, with a walkable stand cell outside
  bestUnitFor(b, list) {
    const nav = this.sim.nav, a = b.a;
    let best = null, bs = 1e9;
    for (const u of list) {
      const e = u.mid; if (!e) continue;
      // attackers stand on the side that is NOT in the site
      const out = e.outside;
      if (!nav.walkable(Math.floor(out[0]), Math.floor(out[2]), Math.floor(out[1] / STOREY))) continue;
      const d = dist3(a.pos, out) + (u.ext ? -6 : 0) + (this.sim.world.roomAt(out[0], out[1], out[2]) < 0 ? 4 : 0);
      if (d < bs) { bs = d; best = u; }
    }
    return best;
  }
  planJobs(b) {
    const a = b.a, role = this.roles.get(b), sim = this.sim, site = this.round.site;
    const st = b.group === 'A' ? this.stageA : this.stageB;
    const route = b.group === 'A' ? this.routeA : this.routeB;
    // the doorway where the route enters the building
    let ei = route.findIndex((s) => sim.world.roomAt(s.x + 0.5, s.f * STOREY, s.z + 0.5) >= 0);
    const via = ei >= 0 ? [route[ei].x + 0.5, route[ei].f * STOREY, route[ei].z + 0.5] : st;
    const jobs = [];
    if (b.breachUnit && (role === 'breach' || role === 'hammer')) {
      const u = b.breachUnit, e = u.mid;
      jobs.push({ type: 'goto', pos: st, speed: 'run', tol: 1.2 });
      jobs.push({ type: 'breach', method: this.methodFor(a), unit: u, edge: e, stand: [e.outside[0], e.outside[1], e.outside[2]], face: e.centre, tries: 0 });
    } else if (role === 'intel') {
      jobs.push({ type: 'goto', pos: st, speed: 'run', tol: 1 });
      jobs.push({ type: 'intel', unit: this.an.units[0] });
    }
    if (role === 'planter') {
      jobs.push({ type: 'goto', pos: via, speed: 'walk', tol: 1.2 });
      jobs.push({ type: 'goto', pos: site.center, speed: 'walk', tol: 2.4, sync: 'site', wait: true });
      jobs.push({ type: 'plant', spot: this.plantSpot });
    } else {
      jobs.push({ type: 'goto', pos: via, speed: 'run', tol: 1.2 });
      jobs.push({ type: 'goto', pos: site.center, speed: 'walk', tol: 2.0 });
    }
    this.give(b, jobs, { type: 'hold', pos: site.center, facing: 0, sweep: 1 });
  }
  methodFor(a) { return { thermite: 'thermite', xpellet: 'xpellet', torch: 'torch', cluster: 'cluster', launcher: 'launcher', hammer: 'hammer' }[a.op.ability] || 'hammer'; }

  pushStep(dt) {
    const r = this.round, sim = this.sim, live = this.live();
    // keep the planter alive: if lost, the next free bot takes over
    if (!this.planter || !this.planter.a.alive) {
      const free = live.filter((b) => b.a.alive && !['breach', 'hammer', 'point'].includes(this.roles.get(b)));
      const alt = free[free.length - 1] || live.find((b) => b.a.alive);
      if (alt) { this.planter = alt; this.roles.set(alt, 'planter'); this.planJobs(alt); }
    }
    // everyone but the planter heads into the site; the planter plants when the room is calm
    const pb = live.find((b) => b === this.planter) || live.find((b) => this.roles.get(b) === 'planter');
    if (pb && pb.task && pb.task.type === 'plant') {
      const threats = this.intelAbout(r.site.center, 7, 6);
      const rush = r.t < 50 || this.stateT > 70;
      pb.holdPlant = threats > 0 && !rush;
    }
    if (r.bomb.state === 'planting') this.state = 'push';
    void dt;
  }
  beginPostPlant() {
    const sim = this.sim, live = this.live(), r = this.round, spot = r.bomb.pos;
    this.state = 'post'; this.stateT = 0;
    const cells = []; const nav = sim.nav, w = sim.world;
    const f = Math.floor((spot[1] + 0.5) / STOREY);
    for (let dz = -6; dz <= 6; dz++) for (let dx = -6; dx <= 6; dx++) {
      const x = Math.floor(spot[0]) + dx, z = Math.floor(spot[2]) + dz; if (!nav.walkable(x, z, f) || nav.isHole(x, z, f)) continue;
      const d = Math.hypot(x + 0.5 - spot[0], z + 0.5 - spot[2]); if (d < 2.5 || d > 7) continue;
      const p = [x + 0.5, f * STOREY, z + 0.5];
      if (!w.visible([p[0], p[1] + 1.4, p[2]], [spot[0], spot[1] + 0.4, spot[2]], CAST.GLASS)) continue;
      cells.push(p);
    }
    // spread out: pick cells far from each other
    const picked = [];
    for (const b of live) {
      let best = null, bs = -1e9;
      for (const c of cells) { let s = -dist3(c, b.a.pos) * 0.3; for (const p of picked) s += Math.min(5, dist3(c, p)); if (s > bs) { bs = s; best = c; } }
      if (best) { picked.push(best); const face = this.entranceFacing(best); this.give(b, [], { type: 'hold', pos: best, facing: face, crouch: true, sweep: 0.4, peek: true }); }
    }
  }
  entranceFacing(p) {
    // look at the opening a defender would most likely come through
    let best = null, bd = 1e9; const spot = this.round.bomb.pos || this.sitePos;
    for (const o of this.an.openings) { const c = o.centre; if (o.kind === 'wall') continue; const d = dist3(c, spot); if (d < bd && this.sim.world.visible([p[0], p[1] + 1.4, p[2]], [c[0], c[1], c[2]], CAST.GLASS)) { bd = d; best = c; } }
    if (!best) best = spot;
    return yawOf(best[0] - p[0], best[2] - p[2]);
  }
  postStep() { /* holding */ }
}

// ===================================================================================== DEFENCE
export class DefendDirector extends Director {
  init() {
    const sim = this.sim, site = this.round.site;
    this.an = analyseSite(sim, site); this.state = 'prep'; this.posts = []; this.retake = false; this.retakeT = 0; this.reinforceQueue = [];
    const live = this.live();
    // roles: the first two to get near the site anchor, the rest roam
    // the squad splits by temperament: roamers and aggressors patrol, anchors and trappers hold the site
    const roamPref = (b) => ({ roamer: 3, aggressor: 3, rotator: 2, watcher: 1, medic: 0, trapper: -1, anchor: -2 }[b.persona.id] ?? 0) + b.persona.p.flank + this.rand() * 0.3;
    live.sort((a, b) => roamPref(b) - roamPref(a));
    const nRoam = live.length >= 5 ? 2 : live.length >= 3 ? 1 : 0;
    this.roamers = live.slice(0, nRoam); this.anchors = live.slice(nRoam);
    // reinforcement plan
    const units = this.an.units.filter((u) => !u.nr).slice(0, this.round.o.reinforce);
    const hatches = this.an.hatches.filter((h) => h.panel.dest).slice(0, 2);
    this.reinforcePlan = [...units.map((u) => ({ kind: 'wall', u })), ...hatches.map((h) => ({ kind: 'hatch', h }))];
    // spread jobs across the bots that carry no special building task
    const builders = this.anchors.length ? this.anchors : live;
    builders.forEach((b) => { b.jobs = []; });
    this.reinforcePlan.forEach((item, i) => {
      const b = builders[i % builders.length];
      if (item.kind === 'wall') {
        const e = item.u.mid;
        b.jobs.push({ type: 'reinforce', unit: item.u.unit, stand: [e.inside[0], e.inside[1], e.inside[2]], face: e.centre });
      } else {
        const hh = item.h;
        b.jobs.push({ type: 'reinforce', unit: hh.panel.unit, stand: hh.inside, face: [hh.x + 0.5, hh.lvl, hh.z + 0.5] });
      }
    });
    // barricades for the windows of the site
    this.an.windows.forEach((e, i) => {
      const b = builders[(i + 1) % builders.length];
      b.jobs.push({ type: 'barricade', stand: [e.inside[0], e.inside[1], e.inside[2]], face: e.centre, panel: e.panels[1] });
    });
    // gadgets
    for (const b of live) { const g = this.gadgetJobs(b); b.jobs = [...g, ...(b.jobs || [])]; }
    // every standing point must be somewhere a body fits and, for wall work, within reach of the wall
    for (const b of live) b.jobs = (b.jobs || []).map((j) => this.fixStand(j));
    // final posts
    this.assignPosts();
    for (const b of live) { const fin = b.postTask; this.give(b, b.jobs || [], fin); }
  }
  // a standing point for a job: close to `hint`, a body fits, and `face` is in reach and in view
  standFor(hint, face, maxD = 2.2, nearDoorOK = false) {
    const nav = this.sim.nav, w = this.sim.world, def = this.sim.map.def, f = nav.floorOf(hint[1]), base = f * STOREY, cx = Math.floor(hint[0]), cz = Math.floor(hint[2]);
    let best = null, bd = 1e9;
    for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) {
      const x = cx + dx, z = cz + dz; if (!nav.walkable(x, z, f) || nav.isHole(x, z, f)) continue;
      const n = nav.node(x, z, f); if (!nav.fits(n)) continue;
      const [sx, sz] = nav.standXZ(n), dFace = Math.hypot(sx - face[0], sz - face[2]); if (dFace > maxD) continue;
      if (sx < def.bx + 0.6 || sx > def.bx + def.bw - 0.6 || sz < def.bz + 0.6 || sz > def.bz + def.bd - 0.6) continue; // defenders work from inside the walls
      const eye = [sx, base + 1.5, sz], v = [face[0] - sx, (face[1] ?? base + 1) - eye[1], face[2] - sz], L = Math.hypot(v[0], v[1], v[2]) || 1;
      const h = w.cast(eye[0], eye[1], eye[2], v[0] / L, v[1] / L, v[2] / L, L + 0.05, 0);
      if (h && L - h.t > 0.5) continue; // something other than the target is in the way
      let sc = Math.hypot(sx - hint[0], sz - hint[2]);
      if (!nearDoorOK && nav.doorDist(sx, sz, f).d < 1.15) sc += 3; // do not park in a doorway others have to use
      if (sc < bd) { bd = sc; best = [sx, base, sz]; }
    }
    return best || nav.clearPos(hint);
  }
  fixStand(j) {
    if (!j || !j.stand) return j;
    const face = j.type === 'place' && !j.panel ? j.at : (j.face || j.at || j.stand);
    j.stand = this.standFor(j.stand, face, j.type === 'place' && !j.panel ? 1.2 : 2.3, j.type === 'barricade' || j.type === 'closedoor' || j.type === 'breach');
    return j;
  }
  // a loop of rooms for a roamer: the cells outside the site's openings, in the order that makes a walk
  roamRoute(b) {
    const nav = this.sim.nav, an = this.an, w = this.sim.world, pts = [], seen = new Set(), def = this.sim.map.def;
    for (const o of an.openings) {
      if (o.kind === 'wall' || o.kind === 'solid') continue;
      let out = nav.centre(nav.snap(o.outside[0] + (o.outside[0] - o.inside[0]) * 1.5, o.outside[1], o.outside[2] + (o.outside[2] - o.inside[2]) * 1.5));
      // a roamer stays under the roof: the cell outside an outer wall is watched from inside it instead
      if (out[0] < def.bx + 0.8 || out[0] > def.bx + def.bw - 0.8 || out[2] < def.bz + 0.8 || out[2] > def.bz + def.bd - 0.8) out = nav.centre(nav.snap(o.inside[0], o.inside[1], o.inside[2]));
      const key = `${Math.floor(out[0] / 3)},${Math.floor(out[2] / 3)},${Math.round(out[1])}`; if (seen.has(key)) continue; seen.add(key);
      // watch the doorway from here
      pts.push({ pos: out, facing: yawOf(o.centre[0] - out[0], o.centre[2] - out[2]) + (this.rand() - 0.5) * 0.5, crouch: this.rand() < 0.35 * b.persona.p.caution });
    }
    // plus a spot or two inside the site, so the loop always passes the objective
    const inner = nav.centre(nav.snap(this.round.site.center[0], this.round.site.center[1], this.round.site.center[2]));
    pts.push({ pos: inner, facing: yawOf(this.round.site.center[0] - inner[0], this.round.site.center[2] - inner[2]) + this.rand() * 2, crouch: false });
    // order by angle round the site so the walk is a loop, start somewhere different for each roamer
    const c = this.round.site.center; pts.sort((p, q) => Math.atan2(p.pos[2] - c[2], p.pos[0] - c[0]) - Math.atan2(q.pos[2] - c[2], q.pos[0] - c[0]));
    const k = Math.floor(this.rand() * pts.length), ordered = pts.slice(k).concat(pts.slice(0, k));
    if (b.persona.habit.side < 0) ordered.reverse();
    return ordered;
  }
  // ---- gadget placement plans
  gadgetJobs(b) {
    const a = b.a, an = this.an, w = this.sim.world, jobs = [];
    const doors = an.openings.filter((o) => o.kind === 'door' || o.kind === 'open');
    const placeAtOpening = (id, o, inset = 1.0, normalUp = true) => {
      const into = o.normal, p = [o.inside[0] + into[0] * 0.0, o.inside[1], o.inside[2]];
      jobs.push({ type: 'place', gadget: id, stand: p, at: [o.centre[0] + into[0] * 0.5 + (o.ax === 'x' ? 0 : 0), o.inside[1] + 0.0, o.centre[2] + into[2] * 0.5], normal: [0, 1, 0], panel: null, inset });
      void normalUp;
    };
    const ab = a.op.ability;
    const onFloor = (id, cellOrEdge) => jobs.push({ type: 'place', gadget: id, stand: cellOrEdge.stand || cellOrEdge, at: cellOrEdge.at || [cellOrEdge[0], cellOrEdge[1], cellOrEdge[2]], normal: [0, 1, 0], panel: null });
    const floorAt = (cell) => { const y = w.groundY(cell[0], cell[2], 0.2, cell[1] + 0.2, 0.5); return [cell[0], y > -1e8 ? y : cell[1], cell[2]]; };
    switch (ab) {
      case 'mat': case 'mines': case 'barbwire': for (const o of doors.slice(0, 3)) { const c = floorAt([o.inside[0] + o.normal[0] * 0.2, o.inside[1], o.inside[2] + o.normal[2] * 0.2]); onFloor(ab, { stand: c, at: c }); } break;
      case 'edd': for (const o of doors.slice(0, 3)) { const e = o; const at = [e.centre[0] + e.normal[0] * 0.05, e.inside[1] + 0.3, e.centre[2] + e.normal[2] * 0.05]; jobs.push({ type: 'place', gadget: 'edd', stand: [e.inside[0], e.inside[1], e.inside[2]], at, normal: [e.normal[0], 0, e.normal[2]], panel: e.panels[0] || null }); } break;
      case 'jammer': { const c = floorAt([this.round.site.a[0], this.round.site.a[1], this.round.site.a[2]]); onFloor('jammer', { stand: c, at: c }); const c2 = floorAt([this.round.site.b[0], this.round.site.b[1], this.round.site.b[2]]); onFloor('jammer', { stand: c2, at: c2 }); break; }
      case 'cams': for (const e of an.windows.slice(0, 3)) jobs.push({ type: 'place', gadget: 'cams', stand: [e.inside[0], e.inside[1], e.inside[2]], at: [e.centre[0] + e.normal[0] * 0.05, e.centre[1] + 0.2, e.centre[2] + e.normal[2] * 0.05], normal: [e.normal[0], 0, e.normal[2]], panel: e.panels[2] || e.panels[0] }); break;
      case 'dshield': for (const o of doors.slice(0, 2)) { const c = floorAt([o.inside[0] + o.normal[0] * 0.5, o.inside[1], o.inside[2] + o.normal[2] * 0.5]); onFloor('dshield', { stand: floorAt(o.inside), at: c }); } break;
      case 'armorpanel': for (const o of an.windows.slice(0, 2).concat(doors.slice(0, 1))) jobs.push({ type: 'place', gadget: 'armorpanel', stand: [o.inside[0], o.inside[1], o.inside[2]], at: o.centre, normal: o.normal, panel: o.panels[1] || o.panels[0] }); break;
      case 'turret': { const c = floorAt(this.cornerOpposite(doors[0] || an.openings[0])); onFloor('turret', { stand: c, at: c }); break; }
      case 'healstation': { const c = floorAt([this.round.site.center[0], this.round.site.center[1], this.round.site.center[2]]); onFloor('healstation', { stand: c, at: c }); break; }
      case 'shockwire': for (const u of an.units.slice(0, 2)) { if (!u.mid) continue; const e = u.mid; jobs.push({ type: 'place', gadget: 'shockwire', stand: [e.inside[0], e.inside[1], e.inside[2]], at: [e.centre[0] + e.normal[0] * 0.1, e.centre[1], e.centre[2] + e.normal[2] * 0.1], normal: e.normal, panel: e.panels[1] }); } break;
      case 'armorpack': { const c = floorAt([this.round.site.center[0] + 0.5, this.round.site.center[1], this.round.site.center[2]]); onFloor('armorpack', { stand: c, at: c }); break; }
      default: break;
    }
    // secondary gadget
    const g2 = a.gadgets[1];
    if (g2) {
      if (g2.id === 'barbwire' && doors[0]) { const o = doors[this.rand.int(doors.length)]; const c = floorAt([o.inside[0] + o.normal[0] * 0.1, o.inside[1], o.inside[2] + o.normal[2] * 0.1]); onFloor('barbwire', { stand: c, at: c }); }
      if (g2.id === 'alarm' && doors.length) { const o = doors[this.rand.int(doors.length)]; const c = floorAt([o.outside[0], o.outside[1], o.outside[2]]); onFloor('alarm', { stand: c, at: c }); }
      if (g2.id === 'dshield' && doors.length) { const o = doors[0]; const c = floorAt([o.inside[0] + o.normal[0] * 0.5, o.inside[1], o.inside[2] + o.normal[2] * 0.5]); onFloor('dshield', { stand: floorAt(o.inside), at: c }); }
    }
    return jobs;
  }
  cornerOpposite(o) {
    const site = this.round.site; if (!o) return site.center;
    return [site.center[0] - o.normal[0] * 1.6, site.center[1], site.center[2] - o.normal[2] * 1.6];
  }
  // ---- posts
  assignPosts() {
    const sim = this.sim, site = this.round.site, an = this.an, w = sim.world, nav = sim.nav;
    const approach = an.openings.filter((o) => o.kind !== 'wall').map((o) => o.centre);
    const cands = [];
    for (const [x, z] of an.cells) {
      if (!nav.walkable(x, z, an.f) || nav.partial[nav.node(x, z, an.f)] || !nav.fits(nav.node(x, z, an.f))) continue;
      const p = nav.centre(nav.node(x, z, an.f));
      // not directly in a doorway line, but with a view of at least one opening
      let seen = 0; for (const c of approach) if (w.visible([p[0], p[1] + 1.5, p[2]], [c[0], c[1], c[2]], CAST.GLASS)) seen++;
      if (!seen) continue;
      cands.push({ p, seen });
    }
    const taken = [];
    const live = this.live();
    for (const b of live) {
      const anchor = this.anchors.includes(b);
      let pool = cands;
      if (!anchor) { // roamers hold the rooms around the site
        const ring = [];
        for (const o of an.openings) if (o.kind !== 'wall') ring.push(o.outside);
        const r = ring[this.rand.int(Math.max(1, ring.length))] || site.center;
        pool = null; const rp = this.roamPost(r), route = this.roamRoute(b);
        b.postTask = route.length >= 2 ? { type: 'roam', points: route, roam: true, pos: rp.pos } : { type: 'hold', pos: rp.pos, facing: rp.facing, sweep: 0.6, crouch: this.rand() < 0.4, peek: true, roam: true }; b.roamHome = rp.pos; continue;
      }
      let best = null, bs = -1e9;
      for (const c of pool) { let s = c.seen * 2 + this.rand() * 1.5; for (const t of taken) s -= Math.max(0, 3 - dist3(c.p, t)) * 2; s -= dist3(c.p, b.a.pos) * 0.05; if (s > bs) { bs = s; best = c; } }
      const p = best ? best.p : site.center; taken.push(p);
      let face = 0; { let nb = 1e9; for (const c of approach) { const d = dist3(c, p); if (d < nb && w.visible([p[0], p[1] + 1.5, p[2]], c, CAST.GLASS)) { nb = d; face = yawOf(c[0] - p[0], c[2] - p[2]); } } }
      b.postTask = { type: 'hold', pos: p, facing: face, sweep: 0.5, crouch: this.rand() < 0.5, peek: true, anchor: true };
    }
  }
  roamPost(near) {
    const nav = this.sim.nav, f = Math.floor((near[1] + 0.5) / STOREY);
    const snap = nav.centre(nav.snap(near[0], f * STOREY, near[2]));
    return { pos: snap, facing: yawOf(this.sitePos0()[0] - snap[0], this.sitePos0()[2] - snap[2]) + Math.PI * (this.rand() < 0.5 ? 1 : 0) };
  }
  sitePos0() { return this.round.site.center; }

  update(dt) {
    super.update(dt);
    const r = this.round, sim = this.sim;
    if (this.state === 'init') return;
    if (r.inAction() && this.state === 'prep') { this.state = 'hold'; this.stateT = 0; for (const b of this.live()) { b.jobs = []; if (b.task && b.task.type !== 'hold') { const fin = b.finalTask || b.postTask; b.setTask(fin); } } }
    if (r.inPrep()) return;
    if (r.bomb.state === 'planted' || r.bomb.state === 'defusing') this.retakeStep(dt);
  }
  retakeStep(dt) {
    const r = this.round, live = this.live(), bomb = r.bomb;
    this.retakeT += dt;
    if (!this.retake) {
      const atkKnown = [...this.intel.values()].filter((e) => e.actor.alive && this.sim.time - e.t < 15);
      const atkAlive = this.sim.alive('atk').length;
      const urgent = bomb.t < 24, calm = atkKnown.length <= 1 && this.retakeT > 6, lull = this.retakeT > 14;
      if (urgent || calm || (lull && atkAlive <= 2)) this.retake = true; else return;
      // closest free defender defuses; two others escort
      const sorted = live.slice().sort((a, b) => dist3(a.a.pos, bomb.pos) - dist3(b.a.pos, bomb.pos));
      this.defuser = sorted[0];
      this.defuser && this.give(this.defuser, [{ type: 'defuse' }], { type: 'defuse' });
      sorted.slice(1, 3).forEach((b) => this.give(b, [], { type: 'goto', pos: bomb.pos, speed: 'walk', tol: 3 }));
    }
    if (this.defuser && !this.defuser.a.alive) { const alt = live.slice().sort((a, b) => dist3(a.a.pos, bomb.pos) - dist3(b.a.pos, bomb.pos))[0]; if (alt && alt !== this.defuser) { this.defuser = alt; this.give(alt, [{ type: 'defuse' }], { type: 'defuse' }); } }
  }
}
void norm; void sub; void dist2; void findCover;
