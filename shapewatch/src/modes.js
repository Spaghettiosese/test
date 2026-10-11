// Game modes: the objective logic that sits on top of the simulation. A mode owns the clock,
// the scoring, respawn rules and how the round ends. The sim calls init / step / onKill.
import { v3, clamp } from './util.js';
import { pathPoint } from './maps.js';

export const PAYLOAD_RADIUS = 4.6;
const CP_BONUS = 110, OT_TIME = 12;

const presence = (sim, pos, r, dy = 3.6) => {
  const n = {}; let total = 0;
  for (const u of sim.units) if (u.alive && !u.deploy && !u.dummy && v3.dist2d(u.pos, pos) < r && Math.abs(u.pos[1] - pos[1]) < dy) { n[u.team] = (n[u.team] || 0) + 1; total++; }
  return { n, total };
};

class Base {
  constructor(sim) { this.sim = sim; }
  init() {}
  step() {}
  onKill() {}
  respawn() { return 7; }
  // candidate spawn positions for a unit
  spawnList(u) { return this.sim.level.spawns[u.team] || this.sim.level.dmSpawns; }
}

// ------------------------------------------------------------------ escort and hybrid
export class EscortMode extends Base {
  constructor(sim, hybrid = false) { super(sim); this.hybrid = hybrid; this.id = hybrid ? 'hybrid' : 'escort'; }
  init() {
    const s = this.sim, L = s.level;
    s.timer = L.attackTime || 300; s.inOvertime = false; s.overtime = 0; s.milestone = 0;
    const p0 = L.path[0];
    s.payload = { dist: 0, pos: [p0[0], 0, p0[1]], yaw: pathPoint(L.pathInfo, 0).yaw, pushers: 0, defenders: 0, contested: false, cp: 0, speed: 0, idle: 0, active: !this.hybrid };
    if (this.hybrid) { s.cap = { point: L.points[0], prog: 0, present: 0, defenders: 0, contested: false, done: false }; this.phase = 'capture'; s.phase = 'capture'; } else s.phase = 'escort';
  }
  respawn(u) { return u.team === 0 ? 6 : 7; }
  // attackers move up after each checkpoint; defenders start at a forward spawn near the first
  // objective and fall back to the next one as the attack advances
  spawnList(u) {
    const s = this.sim, L = s.level;
    if (u.team === 0 && s.milestone > 0 && L.fwd?.length) return L.fwd[Math.min(s.milestone, L.fwd.length) - 1];
    if (u.team === 1 && L.dspawns?.length && s.milestone < L.dspawns.length) return L.dspawns[s.milestone];
    return L.spawns[u.team];
  }
  step(dt) {
    const s = this.sim;
    if (this.hybrid && this.phase === 'capture') this.stepCapture(dt); else this.stepPayload(dt);
    // clock and overtime
    const P = s.payload, contesting = this.hybrid && this.phase === 'capture' ? (s.cap.present > 0 && s.cap.prog > 0.001) : (P.pushers > 0 || P.contested);
    if (!s.inOvertime) {
      s.timer -= dt;
      if (s.timer <= 0) { s.timer = 0; if (contesting) { s.inOvertime = true; s.overtimeSeen = true; s.overtime = OT_TIME; s.emit({ type: 'overtime' }); } else s.finish(1, 'Time ran out'); }
    } else {
      // overtime only drains while no attacker is fighting near the objective
      const holding = this.hybrid && this.phase === 'capture' ? s.cap.present > 0 || s.cap.near > 0 : P.pushers > 0 || P.near > 0;
      s.overtime -= holding ? ((this.hybrid && this.phase === 'capture' ? s.cap.defenders : P.defenders) ? 0.5 : -1.5) * dt : dt * 1.4;
      s.overtime = Math.min(s.overtime, OT_TIME);
      if (s.timer > 0) s.inOvertime = false;
      if (s.overtime <= 0) s.finish(1, 'Overtime expired');
    }
  }
  stepCapture(dt) {
    const s = this.sim, c = s.cap, pr = presence(s, c.point.pos, c.point.r), a = pr.n[0] || 0, d = pr.n[1] || 0;
    c.present = a; c.defenders = d; c.contested = a > 0 && d > 0; c.near = s.units.filter((u) => u.alive && !u.deploy && u.team === 0 && v3.dist2d(u.pos, c.point.pos) < c.point.r + 6).length;
    const slip = s.mutator?.id === 'blizzard' ? 1.3 : 1;
    if (a > 0 && d === 0) { c.prog = Math.min(1, c.prog + 0.058 * (1 + 0.45 * (Math.min(a, 4) - 1)) * slip * dt); for (const u of s.units) if (u.alive && u.team === 0 && !u.deploy && v3.dist2d(u.pos, c.point.pos) < c.point.r) u.stats.obj += dt; }
    // capture progress locks in at each third, like the ticks on an Overwatch point
    const lock = Math.floor(c.prog * 3 + 1e-6) / 3;
    if (a === 0 && d === 0) c.prog = Math.max(lock, c.prog - 0.02 * dt);
    else if (a === 0) { c.prog = Math.max(lock, c.prog - 0.04 * dt); for (const u of s.units) if (u.alive && u.team === 1 && !u.deploy && v3.dist2d(u.pos, c.point.pos) < c.point.r) u.stats.obj += dt; }
    if (c.prog >= 1 && !c.done) {
      c.done = true; this.phase = 'escort'; s.phase = 'escort'; s.payload.active = true; s.timer += 150; s.inOvertime = false; s.milestone++;
      s.emit({ type: 'captured', bonus: 150 });
    }
  }
  stepPayload(dt) {
    const s = this.sim, P = s.payload, L = s.level; let a = 0, df = 0;
    for (const u of s.units) {
      if (!u.alive || u.deploy || u.dummy) continue;
      if (v3.dist2d(u.pos, P.pos) < PAYLOAD_RADIUS && Math.abs(u.pos[1] - P.pos[1]) < 3.5) { if (u.team === 0) a++; else df++; }
    }
    P.pushers = a; P.defenders = df; P.contested = a > 0 && df > 0; P.speed = 0;
    P.near = s.units.filter((u) => u.alive && !u.deploy && u.team === 0 && v3.dist2d(u.pos, P.pos) < 8).length;
    if (a > 0 && df === 0) {
      P.speed = (1.5 + 0.45 * (Math.min(a, 3) - 1)) * (s.mutator?.id === 'blizzard' ? 1.3 : 1);
      P.dist += P.speed * dt; P.idle = 0;
      for (const u of s.units) if (u.alive && u.team === 0 && !u.deploy && v3.dist2d(u.pos, P.pos) < PAYLOAD_RADIUS) u.stats.obj += dt;
    } else { P.idle += dt; if (df > 0) for (const u of s.units) if (u.alive && u.team === 1 && !u.deploy && v3.dist2d(u.pos, P.pos) < PAYLOAD_RADIUS) u.stats.obj += dt * 0.6; }
    const pp = pathPoint(L.pathInfo, P.dist); P.pos = [pp.x, 0, pp.z]; P.yaw = pp.yaw;
    const cp = L.checkpoints[P.cp];
    if (cp !== undefined && P.dist >= cp) { P.cp++; s.milestone++; s.timer += CP_BONUS; s.inOvertime = false; s.emit({ type: 'checkpoint', n: P.cp, bonus: CP_BONUS }); }
    if (P.dist >= L.pathLen - 0.01) s.finish(0, 'The payload reached its destination');
  }
}

// ------------------------------------------------------------------ control (best of three)
export class ControlMode extends Base {
  constructor(sim) { super(sim); this.id = 'control'; }
  init() {
    const s = this.sim; s.timer = 0; s.round = 1; s.wins = [0, 0]; this.order = s.level.points.map((_, i) => i); this.offset = Math.floor(s.rand() * this.order.length); this.resetRound();
  }
  // every round is fought over a different point of the map
  resetRound() {
    const s = this.sim, pts = s.level.points, point = pts[(this.offset + s.round - 1) % pts.length];
    s.control = { point, owner: -1, capTeam: -1, capProg: 0, ctl: [0, 0], present: [0, 0], contested: false, roundT: 0, lastStand: false };
  }
  respawn() { return 7; }
  step(dt) {
    const s = this.sim, c = s.control, pr = presence(s, c.point.pos, c.point.r, 4), n0 = pr.n[0] || 0, n1 = pr.n[1] || 0;
    c.present = [n0, n1]; c.contested = n0 > 0 && n1 > 0; c.roundT += dt;
    const slip = s.mutator?.id === 'blizzard' ? 1.3 : 1;
    if (!c.contested && (n0 || n1)) {
      const t = n0 ? 0 : 1, n = n0 || n1, rate = 0.075 * (1 + 0.4 * (Math.min(n, 4) - 1)) * slip;
      for (const u of s.units) if (u.alive && u.team === t && !u.deploy && !u.dummy && v3.dist2d(u.pos, c.point.pos) < c.point.r) u.stats.obj += dt;
      if (c.owner !== t) {
        if (c.capTeam !== t) { c.capProg -= rate * 1.6 * dt; if (c.capProg <= 0) { c.capTeam = t; c.capProg = 0; } }
        else { c.capProg += rate * dt; if (c.capProg >= 1) { c.owner = t; c.capTeam = -1; c.capProg = 0; s.emit({ type: 'capture', team: t }); } }
      } else c.capProg = Math.max(0, c.capProg - rate * dt);
    }
    // the meter fills while the owner holds the point uncontested; at 99% the round cannot end while anyone contests it
    if (c.owner >= 0 && !c.contested) c.ctl[c.owner] = Math.min(100, c.ctl[c.owner] + 1.0 * slip * dt);
    if (c.owner >= 0 && c.ctl[c.owner] >= 99 && (c.present[1 - c.owner] > 0 || c.capProg > 0.01) && c.ctl[c.owner] < 100) { c.ctl[c.owner] = Math.min(c.ctl[c.owner], 99); if (!c.lastStand) { c.lastStand = true; s.inOvertime = true; s.emit({ type: 'overtime' }); } }
    else if (c.lastStand && !(c.present[1 - c.owner] > 0)) { c.lastStand = false; s.inOvertime = false; }
    const w = c.ctl[0] >= 100 ? 0 : c.ctl[1] >= 100 ? 1 : (c.roundT > 540 ? (c.ctl[0] >= c.ctl[1] ? 0 : 1) : -1);
    if (w >= 0) { s.inOvertime = false; this.endRound(w); }
  }
  endRound(w) {
    const s = this.sim; s.wins[w]++;
    s.emit({ type: 'round', winner: w, wins: [...s.wins], round: s.round });
    if (s.wins[w] >= 2) { s.finish(w, 'Won the match ' + s.wins[w] + ' to ' + s.wins[1 - w]); return; }
    s.state = 'roundbreak'; s.breakT = 5;
  }
  nextRound() {
    const s = this.sim; s.round++; this.resetRound(); s.resetUnits(); s.state = 'setup'; s.setupT = 7; s.emit({ type: 'roundStart', round: s.round });
  }
}

// ------------------------------------------------------------------ elimination (arcade): no respawns, first to three rounds
export class EliminationMode extends Base {
  constructor(sim) { super(sim); this.id = 'elim'; }
  init() { const s = this.sim; s.timer = 0; s.round = 1; s.wins = [0, 0]; this.resetRound(); }
  resetRound() { const s = this.sim; s.elim = { point: s.level.points[0], roundT: 0, open: false, hold: [0, 0], present: [0, 0] }; }
  respawn() { return 9999; }
  spawnList(u) { return this.sim.level.spawns[u.team]; }
  step(dt) {
    const s = this.sim, E = s.elim; E.roundT += dt;
    const alive = [0, 1].map((t) => s.units.filter((u) => u.team === t && !u.deploy && u.alive).length);
    if (!alive[0] || !alive[1]) { this.endRound(alive[0] ? 0 : 1, alive[0] ? 'TEAM WIPE' : 'TEAM WIPE'); return; }
    // after 60 s a point opens in the middle: hold it alone for 6 s to take the round
    if (E.roundT > 60 && !E.open) { E.open = true; s.emit({ type: 'elimPoint' }); }
    if (E.open) {
      const pr = presence(s, E.point.pos, E.point.r, 4), a = pr.n[0] || 0, b = pr.n[1] || 0; E.present = [a, b];
      if (a && !b) E.hold[0] += dt; else if (b && !a) E.hold[1] += dt;
      if (a && b) { /* contested: frozen */ } else if (!a && !b) { E.hold[0] = Math.max(0, E.hold[0] - dt * 0.5); E.hold[1] = Math.max(0, E.hold[1] - dt * 0.5); }
      for (const t of [0, 1]) if (E.hold[t] >= 6) { this.endRound(t, 'POINT CAPTURED'); return; }
    }
    s.timer = Math.max(0, 60 - E.roundT);
  }
  endRound(w, how) {
    const s = this.sim; s.wins[w]++;
    s.emit({ type: 'round', winner: w, wins: [...s.wins], round: s.round, how });
    if (s.wins[w] >= 3) { s.finish(w, 'Won the match ' + s.wins[w] + ' to ' + s.wins[1 - w]); return; }
    s.state = 'roundbreak'; s.breakT = 4;
  }
  nextRound() { const s = this.sim; s.round++; this.resetRound(); s.resetUnits(); s.state = 'setup'; s.setupT = 6; s.emit({ type: 'roundStart', round: s.round }); }
}

// ------------------------------------------------------------------ deathmatch, free for all, training
export class DeathmatchMode extends Base {
  constructor(sim, ffa = false) { super(sim); this.ffa = ffa; this.id = ffa ? 'ffa' : 'tdm'; }
  init() { const s = this.sim; s.timer = this.ffa ? 360 : 480; s.score = [0, 0]; s.scoreTarget = this.ffa ? 20 : 30; }
  respawn() { return this.ffa ? 3.5 : 4; }
  spawnList(u, first) { return first && !this.ffa ? this.sim.level.spawns[u.team] : this.sim.level.dmSpawns; }
  onKill(killer, victim) {
    const s = this.sim; if (!killer || killer === victim) return;
    if (this.ffa) { if (killer.stats.elims >= s.scoreTarget) { s.winnerUnit = killer; s.finish(killer.team, killer.name + ' reached ' + s.scoreTarget + ' eliminations'); } }
    else { s.score[killer.team]++; if (s.score[killer.team] >= s.scoreTarget) s.finish(killer.team, 'First to ' + s.scoreTarget + ' eliminations'); }
  }
  step(dt) {
    const s = this.sim; s.timer -= dt;
    if (s.timer <= 0) {
      s.timer = 0;
      if (this.ffa) { const top = s.units.filter((u) => !u.deploy).sort((a, b) => b.stats.elims - a.stats.elims)[0]; s.winnerUnit = top; s.finish(top.team, 'Most eliminations when time ran out'); }
      else s.finish(s.score[0] === s.score[1] ? (s.rand() < 0.5 ? 0 : 1) : s.score[0] > s.score[1] ? 0 : 1, s.score[0] === s.score[1] ? 'Tied: decided by a coin toss' : 'Higher score at time');
    }
  }
}
export class TrainingMode extends Base {
  constructor(sim) { super(sim); this.id = 'training'; }
  init() { const s = this.sim; s.timer = 0; s.setupT = 0.2; this.t = 0; }
  respawn() { return 2.5; }
  spawnList(u) { return this.sim.level.dmSpawns; }
  step(dt) {
    const s = this.sim; this.t += dt;
    // the range keeps the ultimate topped up so every hero can be tried
    const p = s.player; if (p && p.alive) p.ult = Math.min(p.def.ult.cost, p.ult + p.def.ult.cost * 0.05 * dt);
  }
}

export function createMode(sim, id) {
  switch (id) {
    case 'hybrid': return new EscortMode(sim, true);
    case 'control': return new ControlMode(sim);
    case 'elim': return new EliminationMode(sim);
    case 'tdm': return new DeathmatchMode(sim, false);
    case 'ffa': return new DeathmatchMode(sim, true);
    case 'training': return new TrainingMode(sim);
    default: return new EscortMode(sim, false);
  }
}
