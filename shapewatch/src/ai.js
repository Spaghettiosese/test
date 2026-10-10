// Bot brains. Every bot perceives (sight with reaction time, hearing, pings), picks targets with its
// team's focus in mind, positions by role, objective and mode (cover, high ground, flanking
// routes), paths with A*, dodges incoming projectiles, retreats to health packs, heals the wounded
// as a support, pings and calls out, counter-picks its hero, and plays its own kit with
// hero-specific logic. Its skill scales with the bot difficulty (or adapts to the player).
import { findPath, floodNav, nodeAt } from './maps.js';
import { v3, clamp, forward, wrapAngle, yawTo, pitchTo, rng, lerp } from './util.js';
import { HEROES, HERO } from './heroes.js';

// preferred fighting distance per hero
const IDEAL = { bulwark: 8, mauler: 7, orbit: 15, wrecker: 3, bastille: 14, sabre: 22, ranger: 20, cinder: 15, vesper: 42, flicker: 9, shade: 6, trapper: 22, skyhawk: 18, riftwalker: 16, halo: 18, serene: 30, pylon: 20, zephyr: 13, cantor: 20, siphon: 8 };
const SKILL = [
  { react: 0.55, turn: 5, err: 4.6, strafe: 0.45, head: 0.04, cdUse: 0.45, dodge: 0.1, coord: 0.2, cover: 0.2, ult: 0.7 },
  { react: 0.32, turn: 8.5, err: 2.7, strafe: 0.8, head: 0.2, cdUse: 0.8, dodge: 0.35, coord: 0.55, cover: 0.5, ult: 1 },
  { react: 0.2, turn: 12, err: 1.5, strafe: 1.0, head: 0.38, cdUse: 1.0, dodge: 0.6, coord: 0.85, cover: 0.75, ult: 1 },
  { react: 0.12, turn: 16, err: 0.8, strafe: 1.15, head: 0.55, cdUse: 1.0, dodge: 0.85, coord: 1, cover: 0.95, ult: 1 },
];
function skillAt(x) {
  x = clamp(x, 0, 3); const i = Math.min(2, Math.floor(x)), f = x - i, a = SKILL[i], b = SKILL[i + 1], o = {};
  for (const k of Object.keys(a)) o[k] = lerp(a[k], b[k], f);
  return o;
}
// rock-paper-scissors between subclasses (+ good matchup for the row against the column)
export const MATCHUP = {
  Bruiser: { Flanker: 1, Recon: 1, Sharpshooter: -1, Specialist: 0, Stalwart: 0, Medic: 1, Tactician: 0, Survivor: 0 },
  Initiator: { Recon: 1, Sharpshooter: 1, Medic: 1, Stalwart: -1, Flanker: -0.5, Specialist: 0 },
  Stalwart: { Sharpshooter: 1, Flanker: 0.5, Specialist: -1, Bruiser: -0.5, Recon: -0.5, Initiator: 0.5 },
  Flanker: { Recon: 1, Medic: 1, Tactician: 1, Specialist: -0.5, Stalwart: -1, Bruiser: -1, Survivor: -0.5 },
  Sharpshooter: { Specialist: 0.5, Flanker: 0.5, Initiator: 0, Stalwart: -1, Bruiser: 0.5, Recon: 0 },
  Specialist: { Stalwart: 1, Bruiser: 0.5, Initiator: 0.5, Recon: -1, Flanker: 0, Sharpshooter: -0.5 },
  Recon: { Specialist: 1, Medic: 0.5, Sharpshooter: 0.5, Flanker: -1, Initiator: -1, Bruiser: -1 },
  Medic: {}, Tactician: {}, Survivor: { Flanker: 0.5, Specialist: 0.5 },
};

export class Brain {
  constructor(sim, u, diff = 1) {
    this.sim = sim; this.u = u; this.diff = diff; this.r = rng(u.id * 977 + 13); this.setSkill();
    this.seen = new Map(); this.target = null; this.vis = []; this.perceiveT = this.r() * 0.2;
    this.path = null; this.pi = 0; this.repathT = this.r(); this.goal = null; this.mode = 'advance';
    this.strafe = this.r() < 0.5 ? 1 : -1; this.strafeT = 1; this.errX = 0; this.errY = 0; this.errT = 0;
    this.stuckT = 0; this.lastPos = [...u.pos]; this.lastSeen = null; this.lastSeenT = -99; this.thinkT = 0;
    this.hold = {}; this.bad = new Map(); this.stuckN = 0; this.lookT = 0; this.scanYaw = 0; this.jumpNow = 0;
    this.coverPos = null; this.coverUntil = 0; this.dodgeUntil = 0; this.dodgeDir = 1; this.heard = null; this.high = null; this.highUntil = 0;
    this.flank = null; this.roam = null; this.roamUntil = 0; this.pingT = -99; this.helpT = -99; this.readyWas = false; this.yawErr = 0; this.pitchErr = 0; this.lastDeaths = 0;
    this.idx = 0;
  }
  setSkill() { const d = this.diff; this.sk = d >= 4 ? skillAt(clamp((this.sim.adapt - 0.4) / 2.2 * 3, 0, 3)) : skillAt(d); }
  get tb() { return this.sim.teams[this.u.team]; }
  hear(src) { const d = v3.dist2d(src.pos, this.u.pos); if (d < 42 && d > 3) this.heard = { pos: [...src.pos], t: this.sim.time, id: src.id }; }

  // ---------------------------------------------------------------- perception
  perceive() {
    const sim = this.sim, u = this.u, eye = sim.eye(u), f = forward(u.yaw, 0), vis = [];
    for (const e of sim.enemies(u)) {
      const c = sim.center(e), d = v3.sub(c, eye), l = v3.len(d), range = e.deploy ? 30 : 80;
      if (l > range) { this.seen.delete(e.id); continue; }
      const dirN = v3.scale(d, 1 / (l || 1)), inFov = v3.dot(dirN, f) > -0.2 || l < 9, reveal = !!e.st.reveal;
      const clear = sim.los(eye, c) || sim.los(eye, [c[0], e.pos[1] + e.def.height - 0.2, c[2]]);
      if (!(clear && (inFov || reveal)) && !(reveal && clear)) { if (!inFov || sim.time - (this.seen.get(e.id) ?? -99) > 0.4) this.seen.delete(e.id); if (!reveal || !clear) continue; }
      if (!this.seen.has(e.id)) {
        this.seen.set(e.id, sim.time);
        const tb = this.tb; if (tb && sim.time - this.pingT > 9 && sim.time - (tb.pingBudget || -99) > 5 && !e.deploy && this.r() < 0.5 && !u.isPlayer && !sim.pings.some((p) => p.target === e)) { this.pingT = sim.time; tb.pingBudget = sim.time; sim.pingAt(u, 'enemy', c, e); }
      }
      if (sim.time - this.seen.get(e.id) >= this.sk.react) vis.push({ e, d: l });
    }
    const lh = u.lastHit;
    if (lh && sim.time - lh.t < 0.6 && lh.src && lh.src.alive && lh.src.team !== u.team && !vis.some((v) => v.e === lh.src) && sim.visibleTo(u, lh.src)) { const l = sim.dist(u, lh.src); if (l < 70) vis.push({ e: lh.src, d: l, shot: true }); }
    this.vis = vis;
    if (vis.length) { const t = this.pickTarget(vis); this.target = t; this.lastSeen = [...t.e.pos]; this.lastSeenT = sim.time; }
    else if (this.target && (!this.target.e.alive || sim.time - this.lastSeenT > 1.2)) this.target = null;
  }
  pickTarget(vis) {
    const u = this.u, tb = this.tb; let best = null, bs = -1e9;
    for (const v of vis) {
      const e = v.e; let s = -v.d * 0.6;
      s += (1 - (e.hp + e.armor) / (e.maxHp + e.maxArmor + 1)) * 22;
      if (e.def.role === 'support') s += 6; if (e.deploy) s -= 8; if (e.def.role === 'tank') s -= 5;
      if (this.target && this.target.e === e) s += 12;
      if (e.hp + e.armor < 80) s += 10;
      if (u.def.sub === 'Recon' && e.def.role !== 'tank') s += 8;
      if (tb && tb.focus === e) s += 22 * this.sk.coord;
      if (u.def.role === 'tank' && v.d < 14) s += 6;
      if (s > bs) { bs = s; best = v; }
    }
    return best;
  }

  // ---------------------------------------------------------------- objective positions per mode
  teamMates() { return this.sim.units.filter((o) => o.team === this.u.team && !o.deploy); }
  objective() {
    const sim = this.sim, u = this.u, L = sim.level, role = u.def.role, mates = this.teamMates(), idx = Math.max(0, mates.indexOf(u)), side = idx % 2 ? 1 : -1, mode = sim.modeId, tb = this.tb;
    const rally = tb?.rally; if (rally) return rally;
    if (mode === 'control' || (mode === 'hybrid' && sim.phase === 'capture')) {
      const pt = L.points[0], c = pt.pos, a = idx * 1.26 + 0.4;
      if (role === 'tank') return [c[0] + side * 1.5, 0, c[2] + (u.team === 0 ? -1 : 1) * 1.5];
      if (role === 'damage') return [c[0] + Math.cos(a) * (pt.r - 2.5), 0, c[2] + Math.sin(a) * (pt.r - 2.5)];
      return [c[0] + side * 3, 0, c[2] + (u.team === 0 ? -pt.r + 1 : pt.r - 1)];
    }
    if (mode === 'escort' || mode === 'hybrid') {
      const P = sim.payload, atk = u.team === 0, zP = P.pos[2], xP = P.pos[0];
      // positions are along the payload's heading so they work on turning routes
      const yaw = P.yaw || 0, fw = [Math.sin(yaw), Math.cos(yaw)], rt = [fw[1], -fw[0]], at = (f, l) => [xP + fw[0] * f + rt[0] * l, 0, zP + fw[1] * f + rt[1] * l];
      if (atk) { if (role === 'tank') return at(2.6, side * 1.2); if (role === 'damage') return at(0.4 + (idx % 3) * 0.9, side * (2.4 + (idx % 3) * 0.6)); return at(-2.2, side * 2.6); }
      if (P.pushers > 0 && P.dist > 4) { if (role === 'support') return at(10, side * 5); return at(role === 'tank' ? 3 : 7, side * 2.5); }
      // hold the next chokepoint: a point further down the route, two thirds of the way to the goal at most
      const ahead = Math.min(P.dist + 36, L.pathLen - 6), pp = pointAlong(L, ahead), pf = [Math.sin(pp.yaw), Math.cos(pp.yaw)], pr = [pf[1], -pf[0]];
      const dz = role === 'tank' ? 0 : role === 'damage' ? 4 + (idx % 2) * 6 : 9, lat = role === 'tank' ? 0 : role === 'damage' ? side * (9 + (idx % 3) * 3) : side * 5;
      return [pp.x + pf[0] * dz + pr[0] * lat, 0, pp.z + pf[1] * dz + pr[1] * lat];
    }
    return this.roamGoal();
  }
  roamGoal() {
    const sim = this.sim, u = this.u, L = sim.level;
    const tb = this.tb;
    if (this.heard && sim.time - this.heard.t < 6) return this.heard.pos;
    if (tb?.hotspot) return tb.hotspot;
    if (this.lastSeen && sim.time - this.lastSeenT < 5) return this.lastSeen;
    // chase the nearest enemy we know about in free-for-all
    let near = null, nd = 1e9; for (const e of sim.units) if (e.alive && e.team !== u.team && !e.deploy && !e.dummy) { const d = v3.dist2d(e.pos, u.pos); if (d < nd) { nd = d; near = e; } }
    if (near && (sim.modeId === 'ffa' || nd < 55)) return near.pos;
    if (!this.roam || sim.time > this.roamUntil || v3.dist2d(u.pos, this.roam) < 4) { this.roam = L.dmSpawns[Math.floor(this.r() * L.dmSpawns.length)]; this.roamUntil = sim.time + 14; }
    return this.roam;
  }
  // home side of the map for fall-backs
  fallbackPoint() {
    const sim = this.sim, u = this.u, tb = this.tb, mates = this.teamMates().filter((m) => m.alive && m !== u);
    if (mates.length) { const c = mates.reduce((a, m) => [a[0] + m.pos[0] / mates.length, 0, a[2] + m.pos[2] / mates.length], [0, 0, 0]); return c; }
    return sim.level.spawns[u.team]?.[2] || sim.level.dmSpawns[0];
  }
  chooseGoal() {
    const sim = this.sim, u = this.u, tb = this.tb, hpf = (u.hp + u.armor * 0.5) / (u.maxHp + u.maxArmor * 0.5);
    const lowAt = u.def.role === 'support' ? 0.3 : 0.4;
    if (hpf < lowAt || (this.mode === 'pack' && hpf < 0.78)) {
      let best = null, bd = 60;
      for (const p of sim.packs) { if (!p.ready || !p.ok[u.team] || (this.bad.get(p) ?? 0) > sim.time) continue; const d = v3.dist2d(u.pos, p.pos) + (p.big ? -8 : 0); if (d < bd) { bd = d; best = p; } }
      if (best) { this.mode = 'pack'; return best.pos; }
      this.mode = 'fallback'; return this.coverGoal() || this.fallbackPoint();
    }
    this.mode = 'advance';
    if (tb && tb.stance === 'regroup' && !(u.def.role === 'tank' && this.target)) { this.mode = 'regroup'; return tb.rally || this.fallbackPoint(); }
    // supports tend the wounded and shadow the front line
    if (u.def.role === 'support') {
      const hurt = this.healCandidate();
      if (hurt && v3.dist2d(hurt.pos, u.pos) > 8) return hurt.pos;
      if (tb?.help && tb.help.alive && v3.dist2d(tb.help.pos, u.pos) > 6) return tb.help.pos;
    }
    for (const c of sim.cores) if (c.team === u.team && v3.dist2d(c.pos, u.pos) < 9 && (!this.target || this.target.d > 14)) return c.pos;
    // snipers and sharpshooters look for high ground that sees the objective
    if ((u.def.sub === 'Recon' || u.hero === 'serene') && !this.target) { const h = this.highGround(); if (h) return h; }
    // flankers swing wide around the fight
    if (u.def.sub === 'Flanker' && (!this.target || this.target.d > 20) && sim.modeId !== 'tdm' && sim.modeId !== 'ffa') { const f = this.flankGoal(); if (f) return f; }
    if (this.target && this.target.d < 58) {
      const ideal = IDEAL[u.hero] || 15, t = this.target.e, objD = v3.dist2d(u.pos, this.objective()), leash = sim.modeId === 'tdm' || sim.modeId === 'ffa' || sim.modeId === 'training' ? 999 : 36;
      if (objD < leash && u.def.role !== 'support') {
        const d = this.target.d;
        if (d > ideal * 1.4 || !sim.los(sim.eye(u), sim.center(t))) return t.pos;
        return this.hurtCover() || null;
      }
    }
    return this.objective();
  }
  // a spot near here that hides us from the threat (used when reloading, hurt or out-numbered)
  coverGoal() {
    const sim = this.sim, u = this.u, tg = this.target?.e || (this.lastSeen && { pos: this.lastSeen }) || (this.heard && { pos: this.heard.pos });
    if (!tg) return null;
    if (this.coverPos && sim.time < this.coverUntil) return this.coverPos;
    const eye = [tg.pos[0], tg.pos[1] + 1.6, tg.pos[2]]; let best = null, bd = 1e9;
    for (let i = 0; i < 16; i++) {
      const a = this.r() * 6.283, rr = 3 + this.r() * 8, x = u.pos[0] + Math.cos(a) * rr, z = u.pos[2] + Math.sin(a) * rr;
      const [ci, cj] = sim.nav.cellOf(x, z), l = sim.nav.layerAt(ci, cj, u.pos[1]); if (l < 0) continue;
      const y = sim.nav.surf[sim.nav.idx(ci, cj, l)]; if (Math.abs(y - u.pos[1]) > 0.7) continue;
      if (!sim.los(eye, [x, y + 1.5, z])) { const d = rr + v3.dist2d([x, 0, z], tg.pos) * -0.02; if (d < bd) { bd = d; best = [x, y, z]; } }
    }
    if (best) { this.coverPos = best; this.coverUntil = sim.time + 2.5; }
    return best;
  }
  hurtCover() { // only duck behind cover when the situation calls for it
    const u = this.u, hpf = u.hp / u.maxHp;
    if ((u.reloadT > 0 || hpf < 0.5 || (this.tb && this.tb.foeN > this.tb.aliveN + 1)) && this.r() < this.sk.cover * 0.5 + 0.1 && u.def.role !== 'tank') return this.coverGoal();
    return null;
  }
  healCandidate() {
    const sim = this.sim, u = this.u; let best = null, bs = 1e9;
    for (const a of sim.allies(u)) {
      const f = (a.hp + 0.3 * a.armor) / (a.maxHp + 0.3 * a.maxArmor); if (f > 0.93 || v3.dist2d(a.pos, u.pos) > 34) continue;
      const s = f + v3.dist2d(a.pos, u.pos) * 0.004 - (a.def.role === 'tank' ? 0.05 : 0); if (s < bs) { bs = s; best = a; }
    }
    const tb = this.tb; if (tb?.help && tb.help.alive && tb.help.hp < tb.help.maxHp * 0.95) return tb.help;
    return best;
  }
  highGround() {
    const sim = this.sim, u = this.u;
    if (this.high && sim.time < this.highUntil) return this.high;
    if (!sim._hi) {
      const nav = sim.nav, f0 = sim._reach0 ||= floodNav(nav, sim.level.spawns[0][2]), list = [];
      for (let n = 0; n < nav.surf.length; n += 3) { const s = nav.surf[n]; if (s > 3.9 && s < 8 && f0[n]) { const l = n % nav.L, cell = (n - l) / nav.L, i = cell % nav.W, j = (cell - i) / nav.W; list.push([nav.x0 + i + 0.5, s, nav.z0 + j + 0.5]); } }
      sim._hi = list;
    }
    const obj = this.objective(); let best = null, bd = 1e9;
    for (let k = 0; k < 40; k++) {
      const p = sim._hi[Math.floor(this.r() * sim._hi.length)]; if (!p) break;
      const od = v3.dist2d(p, obj); if (od < 16 || od > 58) continue;
      if (!sim.los([p[0], p[1] + 1.6, p[2]], [obj[0], 1.5, obj[2]])) continue;
      const d = v3.dist2d(p, u.pos); if (d < bd) { bd = d; best = p; }
    }
    this.high = best; this.highUntil = sim.time + 14; return best;
  }
  flankGoal() {
    const sim = this.sim, u = this.u, obj = this.objective();
    if (this.flank && sim.time < this.flank.until) { return v3.dist2d(u.pos, this.flank.stage) > 6 && !this.flank.done ? this.flank.stage : (this.flank.done = true, obj); }
    const foe = sim.units.find((e) => e.alive && e.team !== u.team && !e.deploy), toObj = v3.norm([obj[0] - u.pos[0], 0, obj[2] - u.pos[2]]), side = this.idx % 2 ? 1 : -1;
    const stage = [obj[0] + -toObj[2] * side * 24, 0, obj[2] + toObj[0] * side * 24];
    this.flank = { stage, until: sim.time + 16, done: false }; return stage;
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
    const n = this.path[this.pi], d = [n[0] - u.pos[0], 0, n[2] - u.pos[2]], l = Math.hypot(d[0], d[2]);
    if (l < 0.3 && this.pi >= this.path.length - 1) return [0, 0, 0];
    return l > 0 ? [d[0] / l, 0, d[2] / l] : [0, 0, 0];
  }
  checkDodge() {
    const sim = this.sim, u = this.u; if (sim.time < this.dodgeUntil) return;
    for (const p of sim.projs) {
      if (p.team === u.team || p.dead) continue;
      const rel = v3.sub(sim.center(u), p.pos), sp = v3.len(p.vel); if (sp < 1) continue;
      const dir = v3.scale(p.vel, 1 / sp), along = v3.dot(rel, dir); if (along < 0 || along > sp * 0.7) continue;
      const perp = v3.len(v3.sub(rel, v3.scale(dir, along)));
      if (perp < 2.2 && this.r() < this.sk.dodge) { const side = v3.dot(v3.cross(dir, [0, 1, 0]), rel) > 0 ? 1 : -1; this.dodgeUntil = sim.time + 0.4; this.dodgeDir = side; if (u.grounded && this.r() < 0.5) this.jumpNow = 0.12; return; }
    }
  }
  update(dt) {
    const sim = this.sim, u = this.u, inp = u.in;
    if (!u.alive || (sim.state !== 'live' && sim.modeId !== 'training')) { inp.move = [0, 0]; inp.fire1 = inp.fire2 = false; return; }
    if (this.idx === 0) this.idx = Math.max(1, this.teamMates().indexOf(u) + 1);
    this.perceiveT -= dt; this.thinkT -= dt;
    if (this.perceiveT <= 0) { this.perceiveT = 0.1 + this.r() * 0.05; this.perceive(); this.checkDodge(); }
    if (this.thinkT <= 0) { this.thinkT = 0.25 + this.r() * 0.15; if (this.diff >= 4) this.setSkill(); this.curGoal = this.chooseGoal(); }
    const tgt = this.target && this.target.e.alive ? this.target : null, e = tgt?.e, goal = this.curGoal;
    // ---- announcements
    const ready = u.ult >= u.def.ult.cost - 1e-6;
    if (ready && !this.readyWas && sim.state === 'live') sim.callout(u, 'ultReady');
    this.readyWas = ready;
    if (u.hp < u.maxHp * 0.4 && u.lastHit && sim.time - this.helpT > 14 && sim.time - u.lastHit.t < 3 && this.tb) { this.helpT = sim.time; sim.callout(u, 'help'); }
    let wish = [0, 0, 0];
    if (goal) wish = this.follow(goal, dt); else this.repathT = Math.min(this.repathT, 0.1);
    // ---- combat movement
    const ideal = IDEAL[u.hero] || 15; let strafeV = [0, 0, 0], rangeV = [0, 0, 0];
    if (tgt && sim.los(sim.eye(u), sim.center(e))) {
      this.strafeT -= dt; if (this.strafeT <= 0) { this.strafe = -this.strafe; this.strafeT = (0.5 + this.r() * 1.3) / Math.max(0.3, this.sk.strafe); }
      const to = v3.norm([e.pos[0] - u.pos[0], 0, e.pos[2] - u.pos[2]]);
      strafeV = v3.scale([to[2], 0, -to[0]], this.strafe * this.sk.strafe);
      const d = tgt.d;
      if (d < ideal * 0.55) rangeV = v3.scale(to, -1); else if (d > ideal * 1.3 && !goal) rangeV = to;
      if (u.def.role === 'tank' && d < ideal * 1.2) rangeV = v3.scale(to, 0.3);
      if (u.hero === 'wrecker' || u.hero === 'shade') rangeV = d > ideal ? to : [0, 0, 0];
      if (goal) wish = v3.scale(wish, 0.55);
      if (u.hero === 'vesper' || u.s.bunker) strafeV = v3.scale(strafeV, 0.3);
    }
    if (sim.time < this.dodgeUntil) { const d0 = this.dodgeDir, t = tgt ? v3.norm([tgt.e.pos[0] - u.pos[0], 0, tgt.e.pos[2] - u.pos[2]]) : forward(u.yaw, 0); strafeV = [t[2] * d0 * 1.4, 0, -t[0] * d0 * 1.4]; }
    let mv = [wish[0] + strafeV[0] * 0.9 + rangeV[0], 0, wish[2] + strafeV[2] * 0.9 + rangeV[2]];
    for (const o of sim.units) if (o !== u && o.alive && !o.deploy && o.team === u.team) { const dx = u.pos[0] - o.pos[0], dz = u.pos[2] - o.pos[2], dd = Math.hypot(dx, dz); if (dd < 1.6 && dd > 0.01) { mv[0] += dx / dd * (1.6 - dd); mv[2] += dz / dd * (1.6 - dd); } }
    const ml = Math.hypot(mv[0], mv[2]); if (ml > 1) { mv[0] /= ml; mv[2] /= ml; }
    // ---- stuck detection
    this.stuckT += dt;
    if (this.stuckT > 1.1) {
      if (v3.dist2d(u.pos, this.lastPos) < 0.35 && ml > 0.3 && !u.st.root && !u.s.bunker && !u.s.channel) {
        this.repathT = 0; this.strafe = -this.strafe; this.jumpNow = 0.35; this.path = null; this.stuckN++;
        if (this.stuckN >= 2 && this.mode === 'pack') for (const p of sim.packs) if (v3.dist2d(p.pos, u.pos) < 40) this.bad.set(p, sim.time + 25);
        if (this.stuckN >= 3) { const nx = u.pos[0] - Math.sign(u.pos[0] - (sim.level.bounds.x0 + sim.level.bounds.x1) / 2) * 0.6; if (!sim.blockedAt(nx, u.pos[2], u.pos[1], u.def.radius, u.def.height)) u.pos[0] = nx; }
      } else this.stuckN = 0;
      this.lastPos = [...u.pos]; this.stuckT = 0;
    }
    if (this.jumpNow > 0) this.jumpNow -= dt;
    inp.jump = this.jumpNow > 0 || (tgt && this.r() < 0.004 * this.sk.strafe && u.grounded) || (u.def.fly && tgt && tgt.d > 9 && u.s.fuel > 25 && this.mode === 'advance');
    this.aim(dt, tgt, mv);
    const fw = [Math.sin(u.yaw), Math.cos(u.yaw)], rt = [-Math.cos(u.yaw), Math.sin(u.yaw)];
    inp.move = [mv[0] * rt[0] + mv[2] * rt[1], mv[0] * fw[0] + mv[2] * fw[1]];
    this.fight(dt, tgt);
  }

  aim(dt, tgt, mv) {
    const sim = this.sim, u = this.u, eye = sim.eye(u);
    let ty = u.yaw, tp = 0, locked = false;
    this.errT -= dt; if (this.errT <= 0) { this.errT = 0.22; this.errX = this.r.gauss() * this.sk.err; this.errY = this.r.gauss() * this.sk.err * 0.7; }
    const healing = this.healTarget && this.wantHeal;
    let aimAt = null;
    if (healing) aimAt = sim.center(this.healTarget);
    else if (this.hold.aimPos) aimAt = this.hold.aimPos;
    else if (tgt) {
      const e = tgt.e, w = u.def.w1, c = sim.center(e);
      const head = this.sk.head > 0.3 && (w.head ?? 1) >= 1.5 && tgt.d < 45 && !e.deploy;
      let p = [c[0], head ? e.pos[1] + e.def.height - 0.28 : e.pos[1] + e.def.height * 0.62, c[2]];
      if (w.kind === 'proj' || w.speed) { const sp = w.speed || 40, t = tgt.d / sp; p = [p[0] + (e.vx || 0) * t, p[1] + (e.vy || 0) * t * 0.5, p[2] + (e.vz || 0) * t]; if (w.gravity) p[1] += 0.5 * -w.gravity * t * t * 0.5; if (u.hero === 'skyhawk' && e.grounded) p[1] = e.pos[1] + 0.3; }
      if (this.hold.ultAim) p = this.hold.ultAim;
      aimAt = p;
    } else if (this.heard && sim.time - this.heard.t < 2.5) aimAt = [this.heard.pos[0], this.heard.pos[1] + 1.4, this.heard.pos[2]];
    else if (this.lastSeen && sim.time - this.lastSeenT < 1.5) aimAt = [this.lastSeen[0], this.lastSeen[1] + 1.2, this.lastSeen[2]];
    if (aimAt) { ty = yawTo(eye, aimAt); tp = pitchTo(eye, aimAt); locked = true; if (tgt && !healing && !this.hold.aimPos) { ty += this.errX * Math.PI / 180; tp += this.errY * Math.PI / 180; } }
    else if (Math.hypot(mv[0], mv[2]) > 0.1) { ty = Math.atan2(mv[0], mv[2]); tp = 0; }
    if (!locked) { this.lookT -= dt; if (this.lookT <= 0) { this.lookT = 1.2 + this.r() * 2; this.scanYaw = (this.r() - 0.5) * 1.4; } ty += this.scanYaw * 0.4; }
    const maxTurn = this.sk.turn * dt * (locked ? 1 : 0.5);
    const dy = wrapAngle(ty - u.yaw), dp = tp - u.pitch;
    this.yawErr = Math.abs(dy); this.pitchErr = Math.abs(dp);
    if (!(u.st.root && u.hero === 'riftwalker')) { u.yaw = wrapAngle(u.yaw + clamp(dy, -maxTurn, maxTurn)); u.pitch = clamp(u.pitch + clamp(dp, -maxTurn, maxTurn), -1.2, 1.2); }
  }

  // ---------------------------------------------------------------- combat
  fight(dt, tgt) {
    const sim = this.sim, u = this.u, inp = u.in, w = u.def.w1, id = u.hero, cdOK = () => this.r() < this.sk.cdUse;
    inp.fire1 = false; inp.fire2 = false;
    const e = tgt?.e, d = tgt?.d ?? 99, los = e && sim.los(sim.eye(u), sim.center(e));
    const underFire = u.lastHit && sim.time - u.lastHit.t < 2.2, hpf = u.hp / u.maxHp, tb = this.tb;
    const near = (r) => this.vis.filter((v) => v.d < r).length;
    if (w.ammo && ((u.ammo < w.ammo * 0.3 && !tgt) || u.ammo === 0)) inp.reload = true;
    this.healTarget = null; this.wantHeal = false; this.hold.ultAim = null; this.hold.aimPos = null;
    if (this.hold.stick && sim.time < this.hold.stick.until) this.hold.aimPos = this.hold.stick.pos;
    const ready = (k) => sim.abilityReady(u, k);
    const aligned = () => this.yawErr < Math.max(0.05, Math.atan2(0.45, Math.max(4, d))) && this.pitchErr < 0.1;
    const press = (k) => { if (ready(k)) inp[k] = true; };
    const ultReady = u.ult >= u.def.ult.cost - 1e-6, comboOk = !tb || this.sk.coord < 0.5 || tb.comboOk(u);
    const ctx = { sim, u, inp, w, e, d, los, underFire, hpf, near, ready, press, aligned, ultReady, cdOK, tgt, brain: this, comboOk, tb };
    // ---- healers: find the most hurt ally in reach and aim at them
    if (u.def.role === 'support') {
      const rng2 = id === 'serene' ? 60 : id === 'cantor' ? 40 : id === 'siphon' ? 12 : 26, sec = u.def.sub;
      const hurt = sim.allies(u, id === 'zephyr' || id === 'siphon').filter((a) => (a.hp + 0.3 * a.armor) / (a.maxHp + 0.3 * a.maxArmor) < (id === 'cantor' ? 0.95 : 0.9) && v3.dist(a.pos, u.pos) < rng2 && sim.los(sim.eye(u), sim.center(a))).sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];
      if (hurt && hurt !== u && id !== 'zephyr' && id !== 'siphon') {
        const urgent = hurt.hp / hurt.maxHp < 0.8 || !tgt || d > 22 || sim.time - this.helpT < 0;
        if (urgent) { this.healTarget = hurt; this.wantHeal = true; }
      }
    }
    // ---- primary fire for everything that is not busy healing
    const range = w.range ?? 75;
    if (tgt && los && !(this.wantHeal && id !== 'serene')) {
      const inRange = d < range * 0.95, quiet = (id === 'bulwark' && u.s.barrier?.up) || (id === 'wrecker' && u.s.block) || u.s.noon || u.s.fan || (u.hero === 'skyhawk' && u.s.barrage);
      if (inRange && aligned() && !quiet && u.reloadT <= 0) { if (w.auto) inp.fire1 = true; else inp.fire1 = !u.prev.fire1 && u.fireT <= 0.02; }
      if (id === 'siphon' && inRange) inp.fire1 = d < w.range && this.yawErr < 0.2;
      if (id === 'bastille' && d < range && los) inp.fire1 = this.yawErr < 0.2;
    }
    if (sim.state !== 'live' && sim.modeId !== 'training') return;
    (HANDLERS[id] || (() => {}))(ctx);
    // nobody sits on an ultimate forever: after a while any decent opening will do
    if (ultReady) { this.ultHeld = (this.ultHeld || 0) + dt; const wait = sim.modeId === 'ffa' ? 5 : 14; if (!inp.ult && this.ultHeld > wait && e && los && d < 30 && (near(30) >= (sim.modeId === 'ffa' ? 1 : 2) || this.ultHeld > wait * 2)) { this.hold.ultAim = this.hold.ultAim || sim.center(e); inp.ult = true; } } else this.ultHeld = 0;
  }
  // Commit to an aim point for a moment before using a lobbed ability (random gating happens only when
  // we are not already lining one up). Returns true once the aim has settled and the throw can go.
  lineUp(p, pos, hold = 0.3) {
    const sim = this.sim, act = this.hold.stick && sim.time < this.hold.stick.until;
    if (!act && this.r() >= p) return false;
    if (!act) this.hold.stick = { pos, until: sim.time + 0.9, t0: sim.time }; else this.hold.stick.pos = pos;
    this.hold.aimPos = pos;
    return sim.time - this.hold.stick.t0 >= hold && this.yawErr < 0.15 && this.pitchErr < 0.15;
  }
  // best centre of >=2 visible enemies within r of each other, in [min,max] range
  cluster(r, max) {
    let best = null, bn = 1;
    for (const a of this.vis) { if (a.d > max || a.d < 5) continue; const n = this.vis.filter((b) => v3.dist(b.e.pos, a.e.pos) < r).length; if (n > bn) { bn = n; best = a.e.pos; } }
    return best;
  }
  // pick a better hero for the next life, using what the enemy team looks like
  counterPick() {
    const sim = this.sim, u = this.u; if (sim.modeId === 'training' || sim.modeId === 'ffa') return null;
    // bots keep their heroes: at most one switch per round, only after a rough patch
    if (u.stats.deaths - this.lastDeaths < 3 || this.r() > 0.35 || (this.swapRound ?? -1) === sim.round || sim.time - (this.swapT ?? -999) < 150) return null;
    this.lastDeaths = u.stats.deaths;
    const foes = sim.units.filter((o) => o.team !== u.team && !o.deploy), mates = sim.units.filter((o) => o.team === u.team && !o.deploy && o !== u);
    let best = u.hero, bs = this.matchScore(HERO[u.hero], foes) - 0.2;
    for (const h of HEROES) { if (h.role !== u.def.role || mates.some((m) => m.hero === h.id)) continue; const s = this.matchScore(h, foes) + this.r() * 0.4; if (s > bs + 0.45) { bs = s; best = h.id; } }
    if (best !== u.hero) { this.swapRound = sim.round; this.swapT = sim.time; }
    return best;
  }
  matchScore(h, foes) { let s = 0; for (const f of foes) s += MATCHUP[h.sub]?.[f.def.sub] || 0; return s / Math.max(1, foes.length) * 3; }
}
function pointAlong(L, d) { const info = L.pathInfo; d = clamp(d, 0, info.total); for (const s of info.seg) if (d <= s.s + s.l + 1e-6) { const t = s.l ? (d - s.s) / s.l : 0; return { x: s.a[0] + (s.b[0] - s.a[0]) * t, z: s.a[1] + (s.b[1] - s.a[1]) * t, yaw: Math.atan2(s.b[0] - s.a[0], s.b[1] - s.a[1]) }; } const s = info.seg.at(-1); return { x: s.b[0], z: s.b[1], yaw: Math.atan2(s.b[0] - s.a[0], s.b[1] - s.a[1]) }; }

// ------------------------------------------------------------------ per-hero play
const ally = (c, f) => c.sim.allies(c.u).filter(f);
const HANDLERS = {
  bulwark(c) {
    const { u, inp, e, d, los, hpf, underFire, ready, press, ultReady, cdOK, near, brain } = c, b = u.s.barrier, hot = brain.vis.length;
    inp.fire2 = !!(b && b.hp > 80 && b.broken <= 0 && hot && (underFire || (d < 36 && d > 5)) && !(d < 7 && b.hp < 350));
    if (e && los && d > 6 && d < 17 && hpf > 0.4 && ready('a1') && cdOK() && brain.yawErr < 0.2) { inp.fire2 = false; press('a1'); }
    if (hot && ally(c, (a) => v3.dist2d(a.pos, u.pos) < 10).length >= 2 && ready('a2')) press('a2');
    if (ultReady && (near(24) >= 3 || (near(24) >= 2 && hpf < 0.5))) inp.ult = true;
  },
  mauler(c) {
    const { u, inp, e, d, los, hpf, underFire, ready, press, ultReady, cdOK, near, brain } = c;
    if (e && los && d > 6 && d < 18 && u.cd.w2 <= 0 && brain.yawErr < 0.12 && e.def.role !== 'tank') inp.fire2 = !u.prev.fire2;
    if (e && los && d > 7 && d < 15 && ready('a1') && cdOK() && brain.yawErr < 0.2) press('a1');
    if (underFire && hpf < 0.7 && ready('a2')) press('a2');
    if (ultReady && e && d < 24 && near(14) >= 2) { brain.hold.ultAim = [...e.pos]; if (brain.yawErr < 0.15) inp.ult = true; }
  },
  orbit(c) {
    const { u, inp, d, hpf, underFire, ready, press, ultReady, near, brain } = c;
    if (near(13) >= 1 && u.cd.w2 <= 0 && brain.yawErr < 0.3 && d > 3) inp.fire2 = !u.prev.fire2;
    if (underFire && hpf < 0.75 && ready('a2')) press('a2');
    if (hpf < 0.5 && ready('a1') && underFire) press('a1');
    const clus = brain.cluster(12, 35); if (ultReady && clus) { brain.hold.ultAim = [clus[0], clus[1] + 0.5, clus[2]]; if (brain.yawErr < 0.12) inp.ult = true; }
  },
  wrecker(c) {
    const { u, inp, e, d, los, hpf, underFire, ready, press, ultReady, cdOK, near, brain } = c;
    inp.fire2 = !!(u.s.block ? (underFire || near(7) >= 1) && hpf > 0.15 : (underFire && d < 14 && !(d < 4) && (u.s.pcharge || 0) < 40 && cdOK()));
    if (inp.fire2 && d < 3.5 && (u.s.block?.stored || 0) > 25) inp.fire2 = false; // release to cash in the stored punch
    if (e && los && d > 6 && d < 15 && ready('a1') && brain.yawErr < 0.15 && cdOK()) { inp.fire2 = false; press('a1'); }
    if (e && d < 3.4 && near(5) >= 2 && ready('a2')) press('a2');
    if (ultReady && near(11) >= 2) { brain.hold.ultAim = e ? [...e.pos] : null; if (!e || brain.yawErr < 0.2) inp.ult = true; }
  },
  bastille(c) {
    const { u, inp, e, d, los, hpf, underFire, ready, press, ultReady, near, brain } = c;
    inp.fire2 = !!(e && los && d > 8 && d < 38 && hpf > 0.3 && !underFire || (e && los && d > 8 && d < 38 && hpf > 0.55)) && u.grounded;
    if (underFire && hpf < 0.6 && ready('a1')) press('a1');
    if (e && los && d > 8 && d < 30 && ready('a2') && brain.yawErr < 0.3) press('a2');
    const clus = brain.cluster(10, 60); if (ultReady && clus && c.comboOk) { brain.hold.ultAim = [clus[0], clus[1] + 0.5, clus[2]]; if (brain.yawErr < 0.15) inp.ult = true; }
  },
  sabre(c) {
    const { u, inp, e, d, los, hpf, underFire, ready, press, ultReady, cdOK, near, brain } = c;
    if (e && los && d > 8 && d < 26 && u.cd.w2 <= 0 && !u.s.rockets && brain.yawErr < 0.12) inp.fire2 = !u.prev.fire2;
    if (hpf < 0.65 && ready('a2')) press('a2');
    if (underFire && ready('a1') && cdOK() && brain.r() < 0.03) press('a1');
    if (ultReady && brain.vis.length && (near(40) >= 2 || d < 28) && c.comboOk) inp.ult = true;
  },
  ranger(c) {
    const { u, inp, e, d, los, hpf, underFire, ready, press, ultReady, cdOK, near, brain, w } = c;
    if (u.s.noon) { inp.fire1 = u.s.noon.el > 3.4; return; }
    if (e && los && d < 14 && u.ammo >= 3 && brain.yawErr < 0.1 && (e.hp + e.armor < 160 || d < 6) && !u.s.fan) inp.fire2 = !u.prev.fire2;
    if (e && los && d > 3 && d < 12 && ready('a2') && cdOK() && brain.yawErr < 0.2) press('a2');
    if ((u.ammo === 0 || (underFire && hpf < 0.5)) && ready('a1')) press('a1');
    if (ultReady && near(70) >= 2 && los && c.comboOk) inp.ult = true;
  },
  cinder(c) {
    const { u, inp, e, d, los, ready, press, ultReady, cdOK, brain } = c;
    if (e && los && d < 6.5 && u.cd.w2 <= 0 && brain.yawErr < 0.4) inp.fire2 = !u.prev.fire2;
    if (e && los && d > 14 && ready('a1') && brain.yawErr < 0.1 && cdOK() && brain.r() < 0.05) press('a1');
    if (e && los && d > 8 && d < 18 && ready('a2') && brain.yawErr < 0.3 && cdOK() && brain.r() < 0.08) press('a2');
    const clus = brain.cluster(8, 30); if (ultReady && clus && c.comboOk) { brain.hold.ultAim = [clus[0], clus[1] + 0.5, clus[2]]; if (brain.yawErr < 0.12) inp.ult = true; }
  },
  vesper(c) {
    const { u, inp, e, d, los, hpf, underFire, ready, press, ultReady, near, brain } = c;
    const far = e && los && d > 16;
    if (!u.s.lance) inp.fire2 = !!(far && u.reloadT <= 0 && u.moving < 2 && !underFire);
    if (inp.fire1 && !u.s.lance) { const full = (u.s.charge || 0) > 0.8, dmgNow = 50 + 100 * (u.s.charge || 0); if (u.s.scoped && !full && d > 12 && e.hp + e.armor > dmgNow * 1.2) inp.fire1 = false; if (u.s.scoped && u.s.charge < 0.45 && d > 12) inp.fire1 = false; }
    if (u.s.lance?.ready && e && los && c.aligned()) inp.fire1 = !u.prev.fire1;
    if (u.s.lance && !u.s.lance.ready) inp.fire1 = false;
    if (e && los && d < 40 && d > 8 && ready('a2') && (brain.vis.length >= 2 || hpf < 0.5) && brain.r() < 0.02) press('a2');
    if (ultReady && e && los && d < 70 && (e.hp + e.armor > 200 || near(80) >= 2) && c.comboOk) inp.ult = true;
  },
  flicker(c) {
    const { u, inp, e, d, los, hpf, underFire, ready, press, ultReady, near, brain, sim } = c;
    if (e && los && d < 5 && u.cd.w2 <= 0 && brain.yawErr < 0.5) inp.fire2 = !u.prev.fire2;
    if (e && los && d > 11 && sim.abilityReady(u, 'a1') && u.charges >= 2 && brain.yawErr < 0.15 && brain.r() < 0.03) press('a1');
    if (hpf < 0.4 && underFire) { if (ready('a2') && u.hist[0] && u.hist[0].hp > u.hp + 50) press('a2'); else if (u.charges > 0 && brain.r() < 0.08) press('a1'); }
    if (ultReady && e && los && d < 20 && (e.hp + e.armor > 150 || near(14) >= 2)) { brain.hold.ultAim = sim.center(e); if (brain.yawErr < 0.2) inp.ult = true; }
  },
  shade(c) {
    const { u, inp, e, d, los, hpf, underFire, ready, press, ultReady, near, brain, sim } = c;
    if (!u.st.cloak && ready('a1') && ((e && d > 16 && hpf > 0.5) || (hpf < 0.4 && underFire) || (!e && brain.mode === 'advance' && brain.r() < 0.01))) press('a1');
    if (e && los && d < 14 && u.cd.w2 <= 0 && !u.s.hack && brain.yawErr < 0.2 && (e.def.role !== 'damage' || brain.r() < 0.4)) inp.fire2 = !u.prev.fire2;
    if (!u.s.beacon && !u.s.hack && ready('a2') && brain.r() < 0.01) press('a2');
    if (u.s.beacon && ((hpf < 0.4 && underFire) || (sim.time % 30 > 29.5))) press('a2');
    if (ultReady && near(14) >= 3) inp.ult = true;
  },
  trapper(c) {
    const { u, inp, e, d, los, ready, press, ultReady, cdOK, near, brain, sim } = c;
    if (e && los && d > 8 && d < 26 && u.cd.w2 <= 0 && brain.lineUp(0.06, [e.pos[0], e.pos[1] + 0.5, e.pos[2]])) inp.fire2 = !u.prev.fire2;
    if (e && los && d > 6 && d < 18 && ready('a1') && brain.lineUp(0.06, [e.pos[0], e.pos[1] + 0.4, e.pos[2]])) press('a1');
    if (e && los && d < 60 && ready('a2') && (e.def.role !== 'tank' || brain.r() < 0.2) && brain.yawErr < 0.08) press('a2');
    const clus = brain.cluster(8, 32); if (ultReady && clus && c.comboOk) { brain.hold.aimPos = [clus[0], clus[1] + 0.5, clus[2]]; if (brain.yawErr < 0.15) inp.ult = true; }
  },
  skyhawk(c) {
    const { u, inp, e, d, los, hpf, underFire, ready, press, ultReady, cdOK, near, brain } = c;
    if (e && los && d < 8 && u.cd.w2 <= 0 && brain.yawErr < 0.25) inp.fire2 = !u.prev.fire2;
    if (e && d > 12 && u.grounded && ready('a1') && cdOK() && brain.r() < 0.05) press('a1');
    if (e && los && d > 10 && !u.st.hover && ready('a2') && brain.r() < 0.03) press('a2');
    const clus = brain.cluster(9, 35); if (ultReady && (clus || near(25) >= 2) && c.comboOk) { if (clus) brain.hold.ultAim = [clus[0], clus[1] + 0.5, clus[2]]; if (!clus || brain.yawErr < 0.2) inp.ult = true; }
  },
  riftwalker(c) {
    const { u, inp, e, d, los, hpf, underFire, ready, press, ultReady, near, brain, tb } = c;
    if (e && los && d > 8 && d < 34 && u.cd.w2 <= 0 && brain.yawErr < 0.08 && e.def.role !== 'tank' && (!tb || near(10) <= 1) && brain.r() < 0.1) inp.fire2 = !u.prev.fire2;
    const clus = brain.cluster(8, 34); if (ultReady && clus && c.comboOk) { brain.hold.aimPos = [clus[0], clus[1], clus[2]]; if (brain.yawErr < 0.15) inp.ult = true; }
  },
  halo(c) {
    const { u, inp, e, d, los, hpf, underFire, ready, press, ultReady, near, brain, sim } = c;
    if (brain.wantHeal) inp.fire2 = true;
    if (ally(c, (a) => a.hp / a.maxHp < 0.6 && v3.dist2d(a.pos, u.pos) < 6.5).length >= 2 && ready('a2')) press('a2');
    const far = ally(c, (a) => a.hp / a.maxHp < 0.5 && v3.dist2d(a.pos, u.pos) > 14 && v3.dist2d(a.pos, u.pos) < 36 && sim.los(sim.eye(u), sim.center(a)))[0];
    if (far && brain.healTarget === far && ready('a1') && brain.yawErr < 0.2) press('a1');
    const dead = sim.corpses.filter((x) => x.team === u.team && !x.unit.alive).length, dying = ally(c, (a) => a.hp / a.maxHp < 0.4 && v3.dist2d(a.pos, u.pos) < 15).length;
    if (ultReady && ((dead >= 2 && near(22) === 0) || dying >= 2 || dead >= 3)) inp.ult = true;
  },
  serene(c) {
    const { u, inp, e, d, los, hpf, underFire, ready, press, ultReady, near, brain, sim } = c;
    inp.fire2 = !!(e && los && d > 20 && u.reloadT <= 0 && u.moving < 2 && !underFire);
    if (brain.wantHeal && brain.healTarget) { inp.fire1 = brain.yawErr < 0.06 && u.fireT <= 0.02 && !u.prev.fire1; }
    if (e && los && d < 22 && ready('a1') && (e.def.role === 'damage' || e.def.role === 'tank' && brain.r() < 0.2) && brain.yawErr < 0.08) press('a1');
    const hurtN = ally(c, (a) => a.hp / a.maxHp < 0.7 && v3.dist2d(a.pos, u.pos) < 18).length;
    if (ready('a2') && e && los && d < 22 && (near(8) >= 2 || hurtN >= 2) && brain.lineUp(0.1, [e.pos[0], e.pos[1] + 0.3, e.pos[2]])) press('a2');
    const tank = sim.allies(u).find((a) => a.def.role === 'tank' && sim.los(sim.eye(u), sim.center(a)) && v3.dist(a.pos, u.pos) < 40);
    if (ultReady && (near(30) >= 2 || underFire) && tank) { brain.hold.aimPos = sim.center(tank); brain.healTarget = tank; if (brain.yawErr < 0.1) inp.ult = true; }
  },
  pylon(c) {
    const { u, inp, e, d, los, underFire, ready, press, ultReady, near, brain, sim } = c;
    const hurtN = sim.allies(u, true).filter((a) => a.hp / a.maxHp < 0.75 && v3.dist2d(a.pos, u.pos) < 6).length, mine = sim.units.some((o) => o.deploy?.owner === u && o.deploy.kind === 'pylon'), sent = sim.units.some((o) => o.deploy?.owner === u && o.deploy.kind === 'sentry');
    if (brain.wantHeal && ready('w2') && u.cd.w2 <= 0 && brain.yawErr < 0.1) inp.fire2 = !u.prev.fire2;
    if (!mine && (hurtN >= 1 || underFire) && ready('a1')) press('a1');
    if (!sent && e && los && d < 26 && ready('a2') && brain.r() < 0.05) press('a2');
    if (!brain.wantHeal && e && los && d < 30 && d > 6 && u.cd.w2 <= 0 && brain.yawErr < 0.1 && e.def.role !== 'tank' && brain.r() < 0.1) inp.fire2 = !u.prev.fire2;
    if (ultReady && brain.vis.length && ally(c, (a) => v3.dist2d(a.pos, u.pos) < 16).length >= 3) inp.ult = true;
  },
  zephyr(c) {
    const { u, inp, e, d, los, hpf, underFire, ready, press, ultReady, brain, sim } = c;
    const hurtN = sim.allies(u, true).filter((a) => a.hp / a.maxHp < 0.85 && v3.dist2d(a.pos, u.pos) < 10).length, want = hurtN >= 1 ? 'heal' : 'speed';
    if (u.s.aura !== want && u.cd.w2 <= 0 && brain.r() < 0.1) inp.fire2 = !u.prev.fire2;
    if (e && los && d < 6 && ready('a1') && brain.yawErr < 0.35) press('a1');
    if (ready('a2') && brain.mode === 'advance' && !e && brain.r() < 0.01) press('a2');
    const hurt = ally(c, (a) => a.hp / a.maxHp < 0.5 && v3.dist2d(a.pos, u.pos) < 18).length;
    if (ultReady && brain.vis.length && (hurt >= 2 || (underFire && hpf < 0.4 && ally(c, () => true).length >= 2))) inp.ult = true;
  },
  cantor(c) {
    const { u, inp, e, d, los, hpf, underFire, ready, press, ultReady, near, brain, sim } = c;
    const h = u.s.harmony, best = brain.healCandidate();
    if (u.cd.w2 <= 0 && best && (!h || !h.alive || (h.hp >= h.maxHp * 0.98 && best.hp < best.maxHp * 0.8)) && sim.los(sim.eye(u), sim.center(best)) && v3.dist(best.pos, u.pos) < 42) { if (brain.lineUp(1, sim.center(best), 0.15)) inp.fire2 = !u.prev.fire2; }
    else if (u.cd.w2 <= 0 && !h) { const t = sim.allies(u).find((a) => a.def.role === 'tank' && sim.los(sim.eye(u), sim.center(a)) && v3.dist(a.pos, u.pos) < 42) || sim.allies(u).find((a) => sim.los(sim.eye(u), sim.center(a)) && v3.dist(a.pos, u.pos) < 42); if (t && brain.lineUp(1, sim.center(t), 0.15)) inp.fire2 = !u.prev.fire2; }
    if (e && los && d < 50 && ready('a1') && brain.yawErr < 0.1 && (e.def.role !== 'damage' || brain.r() < 0.5)) press('a1');
    if (e && los && d < 3.4 && ready('a2') && brain.yawErr < 0.4) press('a2');
    const hurtN = ally(c, (a) => a.hp / a.maxHp < 0.5 && v3.dist2d(a.pos, u.pos) < 15).length;
    if (ultReady && brain.vis.length && (hurtN >= 2 || (underFire && hpf < 0.35 && ally(c, () => true).length >= 2))) inp.ult = true;
  },
  siphon(c) {
    const { u, inp, e, d, los, hpf, underFire, ready, press, ultReady, near, brain, sim } = c;
    const hurtN = sim.allies(u, true).filter((a) => a.hp / a.maxHp < 0.7 && v3.dist2d(a.pos, u.pos) < 7).length;
    if (u.cd.w2 <= 0 && hurtN >= 1) { const w = sim.allies(u, true).filter((a) => a.hp / a.maxHp < 0.7 && v3.dist2d(a.pos, u.pos) < 7).sort((a, b) => a.hp - b.hp)[0]; if (brain.lineUp(0.5, [w.pos[0], w.pos[1], w.pos[2]], 0.3)) inp.fire2 = !u.prev.fire2; }
    else if (e && los && d > 6 && d < 16 && ready('a2') && brain.lineUp(0.06, [e.pos[0], e.pos[1] + 0.2, e.pos[2]])) press('a2');
    if (underFire && hpf < 0.45 && ready('a1')) press('a1');
    const clus = near(12) >= 2; if (ultReady && (clus || (hurtN >= 2 && near(20) >= 1)) && c.comboOk) { if (e) brain.hold.aimPos = sim.center(e); if (!e || brain.yawErr < 0.25) inp.ult = true; }
  },
  sion(c) {
    const { u, inp, e, d, los, hpf, underFire, ready, press, ultReady, cdOK, near, brain } = c;
    if (e && los && d < 5.5 && u.cd.w2 <= 0 && brain.yawErr < 0.25) { inp.fire2 = true; inp.fire1 = false; } else inp.fire2 = false;
    if (e && d < 9 && (underFire || near(8) >= 1) && ready('a1') && hpf < 0.85) press('a1');
    if (near(9) >= 2 && ready('a2')) press('a2');
    if (ultReady && e && los && d > 7 && d < 22 && (near(16) >= 2 || hpf < 0.4) && brain.yawErr < 0.15 && c.comboOk) inp.ult = true;
  },
  stormcaller(c) {
    const { u, inp, e, d, los, hpf, underFire, ready, press, ultReady, near, brain } = c;
    if (e && los && d > 3 && d < 9 && u.cd.w2 <= 0 && brain.yawErr < 0.3) inp.fire2 = !u.prev.fire2;
    if (e && los && d < 22 && ready('a2') && near(30) >= 1) press('a2');
    if (underFire && hpf < 0.5 && ready('a1')) press('a1');
    if (ultReady && near(26) >= 2 && c.comboOk) inp.ult = true;
  },
  ricochet(c) {
    const { u, inp, e, d, los, hpf, underFire, ready, press, ultReady, near, brain } = c;
    if (e && los && d > 8 && d < 45 && u.cd.w2 <= 0 && brain.yawErr < 0.06) inp.fire2 = !u.prev.fire2;
    if (e && d < 8 && underFire && ready('a1')) press('a1');
    if (near(35) >= 2 && ready('a2')) press('a2');
    if (ultReady && e && los && d < 40 && c.comboOk) inp.ult = true;
  },
  mirage(c) {
    const { u, inp, e, d, los, hpf, underFire, ready, press, ultReady, near, brain } = c;
    if (e && los && d > 6 && d < 30 && u.cd.w2 <= 0) inp.fire2 = !u.prev.fire2;
    if (e && !los && d < 25 && ready('a1')) press('a1');
    if (underFire && hpf < 0.4 && ready('a2') && u.s.decoy?.alive) press('a2');
    if (ultReady && e && los && d < 25 && hpf < 0.9 && c.comboOk) inp.ult = true;
  },
  lantern(c) {
    const { u, inp, e, d, los, hpf, ready, press, ultReady, near, sim, brain } = c;
    const hurt = sim.allies(u, true).filter((a) => a.hp / a.maxHp < 0.6 && v3.dist2d(a.pos, u.pos) < 16);
    if (u.cd.w2 <= 0 && (hurt.length >= 1 || (e && d < 28)) && brain.lineUp(0.5, hurt.length ? hurt[0].pos : (e ? e.pos : u.pos), 0.3)) inp.fire2 = !u.prev.fire2;
    if (ready('a1') && near(12) >= 2) press('a1');
    if (ready('a2') && (hurt.length >= 2 || near(30) >= 3)) press('a2');
    if (ultReady && (hurt.length >= 3 || (hurt.length >= 2 && near(20) >= 2)) && c.comboOk) inp.ult = true;
  },
  thorn(c) {
    const { u, inp, e, d, los, hpf, underFire, ready, press, ultReady, near, sim, brain } = c;
    const hurt = sim.allies(u, true).filter((a) => a.hp / a.maxHp < 0.7 && v3.dist2d(a.pos, u.pos) < 30).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    if (hurt && u.cd.w2 <= 0) { if (hurt === u || brain.lineUp(0.4, hurt.pos, 0.4)) inp.fire2 = !u.prev.fire2; }
    if (e && los && d < 24 && d > 5 && ready('a1') && brain.yawErr < 0.1) press('a1');
    else if (e && los && d > 6 && d < 18 && ready('a2') && brain.lineUp(0.06, [e.pos[0], e.pos[1] + 0.2, e.pos[2]])) press('a2');
    if (ultReady && (sim.allies(u, true).filter((a) => a.hp / a.maxHp < 0.65).length >= 3 || (near(12) >= 2 && hpf < 0.5)) && c.comboOk) inp.ult = true;
  },
};

// ------------------------------------------------------------------ training dummies
export class Dummy {
  constructor(sim, u) { this.sim = sim; this.u = u; this.t = Math.random() * 6; this.kind = ['stand', 'strafe', 'jump', 'run', 'strafe', 'stand'][(u.id % 6)]; this.dir = 1; }
  update(dt) {
    const u = this.u, inp = u.in; this.t += dt; inp.fire1 = inp.fire2 = false;
    if (!u.alive) return;
    const home = this.home ||= [...u.pos];
    inp.move = [0, 0]; inp.jump = false;
    if (this.kind === 'strafe') { if (this.t % 4 < 2) inp.move = [1, 0]; else inp.move = [-1, 0]; }
    if (this.kind === 'jump') { inp.jump = this.t % 1.6 < 0.1; }
    if (this.kind === 'run') { const a = this.t * 0.5; inp.move = [Math.sin(a), Math.cos(a)]; }
    // drift back toward home so they stay in the range
    if (this.kind !== 'stand' && Math.hypot(u.pos[0] - home[0], u.pos[2] - home[2]) > 7) { const to = [home[0] - u.pos[0], home[2] - u.pos[2]], l = Math.hypot(to[0], to[1]), f = [Math.sin(u.yaw), Math.cos(u.yaw)], r = [-Math.cos(u.yaw), Math.sin(u.yaw)]; inp.move = [(to[0] / l) * r[0] + (to[1] / l) * r[1], (to[0] / l) * f[0] + (to[1] / l) * f[1]]; }
  }
}
