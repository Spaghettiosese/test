// Bot brains. Each bot perceives with reaction time, picks a target, positions by role and
// objective (attackers push the payload, defenders hold the next choke and contest it), paths
// around the map with A*, retreats to health packs, and uses its hero's kit with heuristics.
import { findPath } from './map.js';
import { v3, clamp, forward, wrapAngle, yawTo, pitchTo, rng } from './util.js';

// preferred fighting distance per hero
const IDEAL = { bulwark: 8, mauler: 7, orbit: 15, sabre: 22, cinder: 15, vesper: 42, flicker: 9, halo: 18, pylon: 20, zephyr: 13 };
const SKILL = [
  { react: 0.5, turn: 5.5, err: 4.2, strafe: 0.5, head: 0.05, cdUse: 0.5 },
  { react: 0.3, turn: 8.5, err: 2.6, strafe: 0.8, head: 0.2, cdUse: 0.8 },
  { react: 0.17, turn: 13, err: 1.3, strafe: 1.0, head: 0.4, cdUse: 1.0 },
];

export class Brain {
  constructor(sim, u, diff = 1) {
    this.sim = sim; this.u = u; this.sk = SKILL[clamp(diff, 0, 2)]; this.r = rng(u.id * 977 + 13);
    this.seen = new Map(); this.target = null; this.vis = []; this.perceiveT = this.r() * 0.2;
    this.path = null; this.pi = 0; this.repathT = this.r(); this.goal = null; this.mode = 'advance';
    this.strafe = this.r() < 0.5 ? 1 : -1; this.strafeT = 1; this.errX = 0; this.errY = 0; this.errT = 0;
    this.stuckT = 0; this.lastPos = [...u.pos]; this.lastSeen = null; this.lastSeenT = -99; this.slot = 0; this.thinkT = 0;
    this.hold = {}; this.bad = new Map(); this.stuckN = 0; this.wantFire = false; this.lookT = 0; this.scanYaw = 0; this.jumpT = 0; this.packGoal = null;
  }

  // ---------------------------------------------------------------- perception
  perceive() {
    const sim = this.sim, u = this.u, eye = sim.eye(u), f = forward(u.yaw, 0), vis = [];
    for (const e of sim.enemies(u)) {
      const c = sim.center(e), d = v3.sub(c, eye), l = v3.len(d);
      const range = e.deploy ? 30 : 75;
      if (l > range) { this.seen.delete(e.id); continue; }
      const dirN = v3.scale(d, 1 / (l || 1)), inFov = v3.dot(dirN, f) > -0.2 || l < 9;
      const reveal = !!e.st.reveal;
      if (!(inFov || reveal) || !(sim.los(eye, c) || sim.los(eye, [c[0], e.pos[1] + e.def.height - 0.2, c[2]]))) { if (!reveal || !sim.los(eye, c)) { if (!inFov || sim.time - (this.seen.get(e.id) ?? -99) > 0.4) this.seen.delete(e.id); continue; } }
      if (!this.seen.has(e.id)) this.seen.set(e.id, sim.time);
      if (sim.time - this.seen.get(e.id) >= this.sk.react) vis.push({ e, d: l });
    }
    // anyone who just shot me is noticed at once
    const lh = u.lastHit;
    if (lh && sim.time - lh.t < 0.6 && lh.src && lh.src.alive && lh.src.team !== u.team && !vis.some((v) => v.e === lh.src)) {
      const l = sim.dist(u, lh.src); if (l < 70) vis.push({ e: lh.src, d: l, shot: true });
    }
    this.vis = vis;
    if (vis.length) { const t = this.pickTarget(vis); this.target = t; this.lastSeen = [...t.e.pos]; this.lastSeenT = sim.time; this.tvel = [t.e.vx || 0, t.e.vy || 0, t.e.vz || 0]; }
    else if (this.target && (!this.target.e.alive || sim.time - this.lastSeenT > 1.2)) this.target = null;
  }
  pickTarget(vis) {
    const u = this.u; let best = null, bs = -1e9;
    for (const v of vis) {
      const e = v.e; let s = -v.d * 0.6;
      s += (1 - (e.hp + e.armor) / (e.maxHp + e.maxArmor + 1)) * 22;
      if (e.def.role === 'support') s += 6; if (e.deploy) s -= 8; if (e.def.role === 'tank') s -= 5;
      if (this.target && this.target.e === e) s += 12; // stickiness
      if (e.hp + e.armor < 80) s += 10;
      if (u.def.id === 'vesper' && e.def.role !== 'tank') s += 8;
      if (s > bs) { bs = s; best = v; }
    }
    return best;
  }

  // ---------------------------------------------------------------- objective positioning
  objective() {
    const sim = this.sim, u = this.u, P = sim.payload, atk = u.team === 0, role = u.def.role;
    const mates = sim.units.filter((o) => o.team === u.team && !o.deploy), idx = Math.max(0, mates.indexOf(u)), side = idx % 2 ? 1 : -1;
    const zP = P.pos[2];
    if (atk) {
      if (role === 'tank') return [side * 1.2, 0, zP + 2.6];
      if (role === 'damage') return [side * (2.4 + (idx % 3) * 0.6), 0, zP + 0.4 + (idx % 3) * 0.9];
      return [side * 2.6, 0, zP - 2.2];
    }
    // defenders: contest the payload when attackers are on it, else hold the next choke ahead of it
    if (P.pushers > 0 && P.dist > 4) {
      if (role === 'support') return [side * 5, 0, zP + 10];
      return [side * 2.5, 0, zP + (role === 'tank' ? 3 : 7)];
    }
    const chokes = [26, 92, 134], a = chokes.find((z) => z > zP + 8) ?? 134;
    const dz = role === 'tank' ? 0 : role === 'damage' ? 4 + (idx % 2) * 6 : 9;
    const lat = role === 'tank' ? 0 : role === 'damage' ? side * (9 + (idx % 3) * 3) : side * 5;
    return [lat, 0, a + dz];
  }
  chooseGoal() {
    const sim = this.sim, u = this.u, hpf = (u.hp + u.armor * 0.5) / (u.maxHp + u.maxArmor * 0.5);
    // retreat to a health pack when hurt (supports heal each other, so they stay braver)
    const lowAt = u.def.role === 'support' ? 0.28 : 0.38;
    if (hpf < lowAt || (this.mode === 'pack' && hpf < 0.75)) {
      let best = null, bd = 55;
      for (const p of sim.packs) { if (!p.ready || !p.ok[u.team] || (this.bad.get(p) ?? 0) > sim.time) continue; const d = v3.dist2d(u.pos, p.pos) + (p.big ? -8 : 0); if (d < bd) { bd = d; best = p; } }
      if (best) { this.mode = 'pack'; return best.pos; }
      // no pack: fall back toward the team's side of the street
      this.mode = 'fallback'; const back = u.team === 0 ? -1 : 1;
      return [u.pos[0] * 0.5, 0, u.pos[2] + back * 14];
    }
    this.mode = 'advance';
    // support: stay with the wounded
    if (u.def.role === 'support') {
      const hurt = sim.allies(u).filter((a) => a.hp / a.maxHp < 0.7 && v3.dist2d(a.pos, u.pos) < 30).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      if (hurt && v3.dist2d(hurt.pos, u.pos) > 6) return hurt.pos;
    }
    // echo cores nearby are free ultimate charge
    for (const c of sim.cores) if (c.team === u.team && v3.dist2d(c.pos, u.pos) < 9 && (!this.target || this.target.d > 14)) return c.pos;
    // stay near the fight if there is one
    if (this.target && this.target.d < 55) {
      const ideal = IDEAL[u.hero] || 15, t = this.target.e, objD = v3.dist2d(u.pos, this.objective());
      if (objD < 34 && u.def.role !== 'support') {
        const d = this.target.d;
        if (d > ideal * 1.35 || !sim.los(sim.eye(u), sim.center(t))) return t.pos; // close in / find a line
        return null; // hold here and shoot
      }
    }
    return this.objective();
  }

  // ---------------------------------------------------------------- movement
  follow(goal, dt) {
    const sim = this.sim, u = this.u;
    this.repathT -= dt;
    const moved = !this.goal || v3.dist2d(goal, this.goal) > 3.5;
    if ((this.repathT <= 0 || (moved && this.repathT < 0.55)) && (sim._paths ?? 0) < 3) {
      sim._paths = (sim._paths ?? 0) + 1; this.repathT = 0.7 + this.r() * 0.6; this.goal = [...goal];
      const p = findPath(sim.nav, u.pos, goal);
      if (p && p.length) { this.path = p; this.pi = Math.min(1, p.length - 1); } else if (!this.path) this.path = null;
    }
    if (!this.path) return v3.norm([goal[0] - u.pos[0], 0, goal[2] - u.pos[2]]);
    while (this.pi < this.path.length - 1 && v3.dist2d(this.path[this.pi], u.pos) < 0.9) this.pi++;
    // skip ahead when the next node after is straight-line reachable on the same floor
    const n = this.path[this.pi], d = [n[0] - u.pos[0], 0, n[2] - u.pos[2]], l = Math.hypot(d[0], d[2]);
    if (l < 0.3 && this.pi >= this.path.length - 1) return [0, 0, 0];
    return l > 0 ? [d[0] / l, 0, d[2] / l] : [0, 0, 0];
  }
  update(dt) {
    const sim = this.sim, u = this.u, inp = u.in;
    if (!u.alive || sim.state !== 'live') { inp.move = [0, 0]; inp.fire1 = inp.fire2 = false; return; }
    this.perceiveT -= dt; this.thinkT -= dt;
    if (this.perceiveT <= 0) { this.perceiveT = 0.1 + this.r() * 0.05; this.perceive(); }
    const tgt = this.target && this.target.e.alive ? this.target : null, e = tgt?.e;
    // ---- goal and path
    if (this.thinkT <= 0) { this.thinkT = 0.25 + this.r() * 0.15; this.curGoal = this.chooseGoal(); }
    const goal = this.curGoal;
    let wish = [0, 0, 0];
    if (goal) wish = this.follow(goal, dt); else { this.repathT = Math.min(this.repathT, 0.1); }
    // ---- combat movement
    const ideal = IDEAL[u.hero] || 15; let strafeV = [0, 0, 0], rangeV = [0, 0, 0];
    if (tgt && sim.los(sim.eye(u), sim.center(e))) {
      this.strafeT -= dt; if (this.strafeT <= 0) { this.strafe = -this.strafe; this.strafeT = (0.5 + this.r() * 1.3) / Math.max(0.3, this.sk.strafe); }
      const to = v3.norm([e.pos[0] - u.pos[0], 0, e.pos[2] - u.pos[2]]);
      strafeV = v3.scale([to[2], 0, -to[0]], this.strafe * this.sk.strafe);
      const d = tgt.d;
      if (d < ideal * 0.55) rangeV = v3.scale(to, -1); else if (d > ideal * 1.3 && !goal) rangeV = to;
      if (u.def.role === 'tank' && d < ideal * 1.2) rangeV = v3.scale(to, 0.3);
      if (goal) wish = v3.scale(wish, 0.55);
    }
    let mv = [wish[0] + strafeV[0] * 0.9 + rangeV[0], 0, wish[2] + strafeV[2] * 0.9 + rangeV[2]];
    // separate from friends a little
    for (const o of sim.units) if (o !== u && o.alive && !o.deploy && o.team === u.team) { const dx = u.pos[0] - o.pos[0], dz = u.pos[2] - o.pos[2], dd = Math.hypot(dx, dz); if (dd < 1.6 && dd > 0.01) { mv[0] += dx / dd * (1.6 - dd); mv[2] += dz / dd * (1.6 - dd); } }
    const ml = Math.hypot(mv[0], mv[2]); if (ml > 1) { mv[0] /= ml; mv[2] /= ml; }
    // ---- stuck detection
    this.stuckT += dt;
    if (this.stuckT > 1.1) {
      if (v3.dist2d(u.pos, this.lastPos) < 0.35 && ml > 0.3) {
        this.repathT = 0; this.strafe = -this.strafe; this.jumpNow = 0.35; this.path = null; this.stuckN++;
        if (this.stuckN >= 2 && this.mode === 'pack') for (const p of sim.packs) if (v3.dist2d(p.pos, u.pos) < 40) this.bad.set(p, sim.time + 25); // give up on a pack we cannot reach
        if (this.stuckN >= 3) { // last resort: nudge toward the middle of the street
          const nx = u.pos[0] - Math.sign(u.pos[0]) * 0.6; if (!sim.blockedAt(nx, u.pos[2], u.pos[1], u.def.radius, u.def.height)) u.pos[0] = nx;
        }
      } else this.stuckN = 0;
      this.lastPos = [...u.pos]; this.stuckT = 0;
    }
    if (this.jumpNow > 0) this.jumpNow -= dt;
    inp.jump = this.jumpNow > 0 || (tgt && this.r() < 0.004 * this.sk.strafe && u.grounded);
    // ---- aiming
    this.aim(dt, tgt, mv);
    // ---- convert world move to local
    const fw = [Math.sin(u.yaw), Math.cos(u.yaw)], rt = [-Math.cos(u.yaw), Math.sin(u.yaw)];
    inp.move = [mv[0] * rt[0] + mv[2] * rt[1], mv[0] * fw[0] + mv[2] * fw[1]];
    // ---- weapons and abilities
    this.fight(dt, tgt);
  }

  aim(dt, tgt, mv) {
    const sim = this.sim, u = this.u, eye = sim.eye(u);
    let ty = u.yaw, tp = 0, locked = false;
    this.errT -= dt; if (this.errT <= 0) { this.errT = 0.22; this.errX = this.r.gauss() * this.sk.err; this.errY = this.r.gauss() * this.sk.err * 0.7; }
    const healing = this.healTarget && this.wantHeal;
    let aimAt = null;
    if (healing) aimAt = sim.center(this.healTarget);
    else if (tgt) {
      const e = tgt.e, w = u.def.w1, c = sim.center(e);
      const head = this.sk.head > 0.3 && w.head >= 1.5 && tgt.d < 40 && !e.deploy;
      let p = [c[0], head ? e.pos[1] + e.def.height - 0.28 : e.pos[1] + e.def.height * 0.62, c[2]];
      if (w.kind === 'proj' || w.speed) { const sp = w.speed || 40, t = tgt.d / sp; p = [p[0] + (e.vx || 0) * t, p[1] + (e.vy || 0) * t * 0.5, p[2] + (e.vz || 0) * t]; }
      if (this.hold.ultAim) p = this.hold.ultAim;
      aimAt = p;
    } else if (this.lastSeen && sim.time - this.lastSeenT < 1.5) aimAt = [this.lastSeen[0], this.lastSeen[1] + 1.2, this.lastSeen[2]];
    if (aimAt) { ty = yawTo(eye, aimAt); tp = pitchTo(eye, aimAt); locked = true; if (tgt && !healing) { ty += this.errX * Math.PI / 180; tp += this.errY * Math.PI / 180; } }
    else if (Math.hypot(mv[0], mv[2]) > 0.1) { ty = Math.atan2(mv[0], mv[2]); tp = 0; }
    // look around occasionally while walking so the field of view sweeps
    if (!locked) { this.lookT -= dt; if (this.lookT <= 0) { this.lookT = 1.2 + this.r() * 2; this.scanYaw = (this.r() - 0.5) * 1.4; } ty += this.scanYaw * 0.4; }
    const maxTurn = this.sk.turn * dt * (locked ? 1 : 0.5);
    const dy = wrapAngle(ty - u.yaw), dp = tp - u.pitch;
    this.yawErr = Math.abs(dy); this.pitchErr = Math.abs(dp);
    u.yaw = wrapAngle(u.yaw + clamp(dy, -maxTurn, maxTurn));
    u.pitch = clamp(u.pitch + clamp(dp, -maxTurn, maxTurn), -1.2, 1.2);
  }

  // ---------------------------------------------------------------- combat
  fight(dt, tgt) {
    const sim = this.sim, u = this.u, inp = u.in, w = u.def.w1, id = u.hero, cdOK = () => this.r() < this.sk.cdUse;
    inp.fire1 = false; inp.fire2 = false;
    const e = tgt?.e, d = tgt?.d ?? 99, los = e && sim.los(sim.eye(u), sim.center(e));
    const underFire = u.lastHit && sim.time - u.lastHit.t < 2.2;
    const hpf = u.hp / u.maxHp, enemiesNear = (r) => this.vis.filter((v) => v.d < r).length;
    // reload when it is quiet or the magazine is empty
    if (w.ammo && ((u.ammo < w.ammo * 0.3 && !tgt) || u.ammo === 0)) inp.reload = true;
    this.healTarget = null; this.wantHeal = false; this.hold.ultAim = null;
    const ready = (k) => sim.abilityReady(u, k);
    const aligned = () => this.yawErr < Math.max(0.05, Math.atan2(0.45, Math.max(4, d))) && this.pitchErr < 0.1;
    const press = (k) => { if (ready(k)) inp[k] = true; };
    const ultReady = u.ult >= u.def.ult.cost - 1e-6;
    // ---- support healing first
    if (u.def.role === 'support') {
      const hurt = sim.allies(u, id === 'zephyr').filter((a) => a.hp / a.maxHp < 0.9 && v3.dist(a.pos, u.pos) < 24 && sim.los(sim.eye(u), sim.center(a))).sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];
      if (hurt && hurt !== u) {
        const urgent = hurt.hp / hurt.maxHp < 0.75 || !tgt || d > 25;
        if (urgent && id !== 'zephyr') { this.healTarget = hurt; this.wantHeal = true; }
      }
    }
    switch (id) {
      case 'halo': if (this.wantHeal) inp.fire2 = true; break;
      case 'pylon': if (this.wantHeal && ready('w2') && u.cd.w2 <= 0 && this.yawErr < 0.1) inp.fire2 = !u.prev.fire2; break;
      case 'zephyr': { const hurtN = sim.allies(u, true).filter((a) => a.hp / a.maxHp < 0.85 && v3.dist2d(a.pos, u.pos) < 10).length; const want = hurtN >= 1 ? 'heal' : 'speed'; if (u.s.aura !== want && u.cd.w2 <= 0 && this.r() < 0.1) inp.fire2 = !u.prev.fire2; break; }
    }
    // ---- general primary fire
    if (tgt && los && !this.wantHeal) {
      const inRange = d < (w.range ?? 75) * 0.95;
      const quiet = id === 'bulwark' && u.s.barrier?.up;
      if (inRange && aligned() && !quiet && u.reloadT <= 0) {
        if (w.auto) inp.fire1 = true; else inp.fire1 = !u.prev.fire1 && u.fireT <= 0.02;
      }
      if (this.wantHeal === false && u.def.role === 'support' && this.healTarget === null && id === 'halo') inp.fire2 = false;
    } else if (this.wantHeal && id !== 'halo' && id !== 'pylon' && tgt && los && aligned() && d < 40) { /* medics keep their gun off when healing */ }
    // ---- hero-specific play
    if (sim.state !== 'live') return;
    const hotEnemies = this.vis.length;
    switch (id) {
      case 'bulwark': {
        const b = u.s.barrier; const threatened = hotEnemies && (underFire || d < 36 && d > 5);
        inp.fire2 = !!(b && b.hp > 80 && b.broken <= 0 && threatened && !(d < 7 && b.hp < 350));
        if (e && los && d > 6 && d < 17 && hpf > 0.4 && ready('a1') && cdOK() && this.yawErr < 0.2) { inp.fire2 = false; press('a1'); }
        if (hotEnemies && sim.allies(u).filter((a) => v3.dist2d(a.pos, u.pos) < 10).length >= 2 && ready('a2')) press('a2');
        if (ultReady && (enemiesNear(24) >= 3 || (enemiesNear(24) >= 2 && hpf < 0.5))) inp.ult = true;
        break;
      }
      case 'mauler': {
        if (e && los && d > 6 && d < 18 && u.cd.w2 <= 0 && this.yawErr < 0.12 && e.def.role !== 'tank') inp.fire2 = !u.prev.fire2;
        if (e && los && d > 7 && d < 15 && ready('a1') && cdOK() && this.yawErr < 0.2) press('a1');
        if (underFire && hpf < 0.7 && ready('a2')) press('a2');
        if (ultReady && e && d < 24 && enemiesNear(14) >= 2) { this.hold.ultAim = [...e.pos]; if (this.yawErr < 0.15) inp.ult = true; }
        break;
      }
      case 'orbit': {
        if (enemiesNear(13) >= 1 && u.cd.w2 <= 0 && this.yawErr < 0.3 && d > 3) inp.fire2 = !u.prev.fire2;
        if (underFire && hpf < 0.75 && ready('a2')) press('a2');
        if (hpf < 0.5 && ready('a1') && underFire) press('a1');
        const clus = this.cluster(12, 35); if (ultReady && clus) { this.hold.ultAim = [clus[0], clus[1] + 0.5, clus[2]]; if (this.yawErr < 0.12) inp.ult = true; }
        break;
      }
      case 'sabre': {
        if (e && los && d > 8 && d < 26 && u.cd.w2 <= 0 && !u.s.rockets && this.yawErr < 0.12) inp.fire2 = !u.prev.fire2;
        if (hpf < 0.65 && ready('a2')) press('a2');
        if (underFire && ready('a1') && cdOK() && this.r() < 0.03) press('a1');
        if (ultReady && hotEnemies && (enemiesNear(40) >= 2 || d < 28)) inp.ult = true;
        break;
      }
      case 'cinder': {
        if (e && los && d < 6.5 && u.cd.w2 <= 0 && this.yawErr < 0.4) inp.fire2 = !u.prev.fire2;
        if (e && los && d > 14 && ready('a1') && this.yawErr < 0.1 && cdOK() && this.r() < 0.05) press('a1');
        if (e && los && d > 8 && d < 18 && ready('a2') && this.yawErr < 0.3 && cdOK() && this.r() < 0.08) press('a2');
        const clus = this.cluster(8, 30); if (ultReady && clus) { this.hold.ultAim = [clus[0], clus[1] + 0.5, clus[2]]; if (this.yawErr < 0.12) inp.ult = true; }
        break;
      }
      case 'vesper': {
        const far = e && los && d > 16;
        if (!u.s.lance) inp.fire2 = !!(far && u.reloadT <= 0 && u.moving < 2 && !underFire);
        if (u.s.lance && !u.s.lance.ready) inp.fire1 = false;
        // shoot a full charge, or any shot when the target is close or nearly dead
        if (inp.fire1 && !u.s.lance) { const full = (u.s.charge || 0) > 0.8; const dmgNow = 50 + 100 * (u.s.charge || 0); if (u.s.scoped && !full && d > 12 && e.hp + e.armor > dmgNow * 1.2) inp.fire1 = false; if (u.s.scoped && u.s.charge < 0.45 && d > 12) inp.fire1 = false; }
        if (u.s.lance?.ready && e && los && aligned()) { inp.fire1 = !u.prev.fire1; }
        if (e && los && d < 40 && d > 8 && ready('a2') && (this.vis.length >= 2 || hpf < 0.5) && this.r() < 0.02) press('a2');
        if (ultReady && e && los && d < 70 && (e.hp + e.armor > 200 || enemiesNear(80) >= 2)) inp.ult = true;
        if (u.s.lance && !u.s.lance.ready) inp.fire1 = false;
        break;
      }
      case 'flicker': {
        if (e && los && d < 5 && u.cd.w2 <= 0 && this.yawErr < 0.5) inp.fire2 = !u.prev.fire2;
        if (e && los && d > 11 && sim.abilityReady(u, 'a1') && u.charges >= 2 && this.yawErr < 0.15 && this.r() < 0.03) press('a1');
        if (hpf < 0.4 && underFire) { if (ready('a2') && u.hist[0] && u.hist[0].hp > u.hp + 50) press('a2'); else if (u.charges > 0 && this.r() < 0.08) press('a1'); }
        if (ultReady && e && los && d < 20 && (e.hp + e.armor > 150 || enemiesNear(14) >= 2)) { this.hold.ultAim = sim.center(e); if (this.yawErr < 0.2) inp.ult = true; }
        break;
      }
      case 'halo': {
        if (sim.allies(u).filter((a) => a.hp / a.maxHp < 0.6 && v3.dist2d(a.pos, u.pos) < 6.5).length >= 2 && ready('a2')) press('a2');
        const far = sim.allies(u).filter((a) => a.hp / a.maxHp < 0.5 && v3.dist2d(a.pos, u.pos) > 14 && v3.dist2d(a.pos, u.pos) < 36 && sim.los(sim.eye(u), sim.center(a)))[0];
        if (far && this.healTarget === far && ready('a1') && this.yawErr < 0.2) press('a1');
        const dead = sim.corpses.filter((c) => c.team === u.team && !c.unit.alive).length;
        const dying = sim.allies(u).filter((a) => a.hp / a.maxHp < 0.4 && v3.dist2d(a.pos, u.pos) < 15).length;
        if (ultReady && ((dead >= 2 && enemiesNear(22) === 0) || dying >= 2 || dead >= 3)) inp.ult = true;
        break;
      }
      case 'pylon': {
        const hurtN = sim.allies(u, true).filter((a) => a.hp / a.maxHp < 0.75 && v3.dist2d(a.pos, u.pos) < 6).length;
        const mine = sim.units.some((o) => o.deploy?.owner === u && o.deploy.kind === 'pylon');
        if (!mine && (hurtN >= 1 || underFire) && ready('a1')) press('a1');
        const sent = sim.units.some((o) => o.deploy?.owner === u && o.deploy.kind === 'sentry');
        if (!sent && e && los && d < 26 && ready('a2') && this.r() < 0.05) press('a2');
        if (!this.wantHeal && e && los && d < 30 && d > 6 && u.cd.w2 <= 0 && this.yawErr < 0.1 && e.def.role !== 'tank' && this.r() < 0.1) inp.fire2 = !u.prev.fire2;
        const near = sim.allies(u).filter((a) => v3.dist2d(a.pos, u.pos) < 16).length;
        if (ultReady && hotEnemies && near >= 3) inp.ult = true;
        break;
      }
      case 'zephyr': {
        if (e && los && d < 6 && ready('a1') && this.yawErr < 0.35) press('a1');
        if (ready('a2') && this.mode === 'advance' && !tgt && this.r() < 0.01) press('a2');
        const hurt = sim.allies(u).filter((a) => a.hp / a.maxHp < 0.5 && v3.dist2d(a.pos, u.pos) < 18).length;
        if (ultReady && hotEnemies && (hurt >= 2 || underFire && hpf < 0.4 && sim.allies(u).length >= 2)) inp.ult = true;
        break;
      }
    }
  }
  // best centre of >=2 visible enemies within r of each other, in [min,max] range
  cluster(r, max) {
    let best = null, bn = 1;
    for (const a of this.vis) {
      if (a.d > max || a.d < 5) continue;
      const n = this.vis.filter((b) => v3.dist(b.e.pos, a.e.pos) < r).length;
      if (n > bn) { bn = n; best = a.e.pos; }
    }
    return best;
  }
}
