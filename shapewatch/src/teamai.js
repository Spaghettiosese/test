// The team commander. Every half second it looks at the whole fight, the way a good shotcaller
// would, and tells the bots what to do together: who to focus, whether to push, hold or regroup,
// when to fire ultimates as a combo, and how to react to the player's pings and callouts.
import { v3, clamp } from './util.js';

export class TeamBrain {
  constructor(sim, team) {
    this.sim = sim; this.team = team; this.t = 0; this.focus = null; this.stance = 'hold'; this.stanceUntil = 0; this.rally = null; this.help = null;
    this.combo = 0; this.comboAt = -99; this.aliveN = 5; this.foeN = 5; this.ultReady = 0; this.hotspot = null; this.lastPingId = 0; this.seen = new Map();
  }
  members() { return this.sim.units.filter((u) => u.team === this.team && !u.deploy); }
  update(dt) {
    this.t -= dt; if (this.t > 0) return; this.t = 0.4 + this.sim.rand() * 0.15; this.think();
  }
  think() {
    const s = this.sim, mem = this.members(), alive = mem.filter((u) => u.alive), foes = s.units.filter((u) => u.team !== this.team && !u.deploy && u.alive);
    this.aliveN = alive.length; this.foeN = foes.length;
    // ---- what the team can see
    const vis = new Map();
    for (const u of alive) {
      const list = u.bot ? u.bot.vis : [];
      for (const v of list) { const rec = vis.get(v.e.id) || { e: v.e, n: 0, d: 0 }; rec.n++; rec.d = Math.min(rec.d || 999, v.d); vis.set(v.e.id, rec); }
    }
    for (const [id, rec] of vis) this.seen.set(id, { pos: [...rec.e.pos], t: s.time });
    // ---- focus fire: a wounded, valuable enemy that several of us can see
    let best = null, bs = -1e9;
    const cen = alive.length ? alive.reduce((a, u) => [a[0] + u.pos[0] / alive.length, a[1] + u.pos[1] / alive.length, a[2] + u.pos[2] / alive.length], [0, 0, 0]) : [0, 0, 0];
    for (const rec of vis.values()) {
      const e = rec.e; let sc = rec.n * 12 - v3.dist(e.pos, cen) * 0.35 + (1 - (e.hp + e.armor) / (e.maxHp + e.maxArmor + 1)) * 30;
      if (e.def.role === 'support') sc += 10; if (e.def.sub === 'Recon' || e.def.sub === 'Sharpshooter') sc += 6; if (e.deploy) sc -= 14; if (e.def.role === 'tank') sc -= 8; if (this.focus === e) sc += 14;
      if (e.hp + e.armor < 90) sc += 18;
      if (sc > bs) { bs = sc; best = e; }
    }
    // a pinged target stays the focus for a while
    if (!(this.focusLock > s.time && this.focus?.alive)) this.focus = best;
    this.ultReady = alive.filter((u) => u.ult >= u.def.ult.cost - 1e-6).length;
    // ---- stance from numbers, health and ultimates
    const ratio = alive.length / Math.max(1, foes.length), hurtAvg = alive.length ? alive.reduce((a, u) => a + (u.hp + u.armor) / (u.maxHp + u.maxArmor), 0) / alive.length : 0;
    let st = 'hold';
    if (alive.length <= 1 || ratio < 0.55 || hurtAvg < 0.35) st = 'regroup';
    else if (ratio > 1.35 || (this.ultReady >= 3 && ratio >= 0.9)) st = 'push';
    if (s.time > this.stanceUntil) this.stance = st;
    // ---- the human's pings and callouts steer everyone
    const queue = s.teamState[this.team]?.playerCalls || [];
    while (queue.length) {
      const call = queue.shift(); if (call.t <= this.lastCallT) continue;
      this.lastCallT = call.t;
      const set = (stance, secs) => { this.stance = stance; this.stanceUntil = s.time + secs; };
      if (call.id === 'group') { this.rally = [...call.unit.pos]; this.rallyUntil = s.time + 10; set('regroup', 8); }
      else if (call.id === 'push') set('push', 14);
      else if (call.id === 'fallback') { this.rally = null; set('regroup', 10); }
      else if (call.id === 'defend') set('hold', 12);
      else if (call.id === 'help') { this.help = call.unit; this.helpUntil = s.time + 8; }
      else if (call.id === 'enemy' && call.target?.alive) { this.focus = call.target; this.focusLock = s.time + 6; }
      else if (call.id === 'objective' && call.pos) { this.rally = [...call.pos]; this.rallyUntil = s.time + 10; set('push', 10); }
      else if (call.id === 'go' && call.pos) { this.rally = [...call.pos]; this.rallyUntil = s.time + 12; set('push', 10); }
    }
    if (this.focusLock > s.time && this.focus && !this.focus.alive) this.focusLock = 0;
    if (this.helpUntil < s.time) this.help = null;
    if (this.rallyUntil < s.time) this.rally = null;
    // ---- objective duty: who sits on the cart, who contests it, and whether the clock says everyone goes
    this.assignRoles(alive, foes);
    // ---- regroup somewhere behind the fight, not in the middle of it
    this.regroupPoint = this.behindFront(alive);
    // ---- ultimates fired together land harder: wait for a partner when the fight allows it
    const eng = [...vis.values()].filter((r) => r.d < 45).length;
    if (eng >= 2 && this.ultReady >= 2) { this.combo = s.time + 2.5; this.comboAt = s.time; }
    // ---- an enemy rush at the objective? remember where the fight is
    this.hotspot = vis.size ? [...vis.values()].reduce((a, r) => [a[0] + r.e.pos[0] / vis.size, a[1], a[2] + r.e.pos[2] / vis.size], [0, 0, 0]) : null;
  }
  // may this unit fire its ultimate now? (a combo window is open, nobody else is ready, or we have waited long enough)
  comboOk(u) { return this.ultReady <= 1 || this.sim.time < this.combo || u.def.role === 'support' || (u.bot?.ultHeld || 0) > 4; }
  roleOf(u) { return this.roles?.get(u.id) || null; }
  assignRoles(alive, foes) {
    const s = this.sim, m = s.modeId; this.roles = new Map(); this.urgent = false;
    if (m === 'escort' || m === 'hybrid') {
      const P = s.payload, capture = m === 'hybrid' && s.phase === 'capture', short = s.timer < 25 || s.inOvertime;
      if (this.team === 0) {
        this.urgent = short || (capture && s.timer < 40);
        if (!capture) { const tank = alive.find((u) => u.def.role === 'tank' && !u.isPlayer), sup = alive.filter((u) => u.def.role === 'support' && !u.isPlayer).sort((a, b) => v3.dist2d(a.pos, P.pos) - v3.dist2d(b.pos, P.pos))[0]; for (const u of [tank, sup]) if (u) this.roles.set(u.id, 'sit'); }
      } else {
        this.urgent = short && (capture ? s.cap.present > 0 : P.pushers > 0);
        if (!capture && P.pushers > 0) { const c = alive.filter((u) => !u.isPlayer && u.def.role !== 'support').sort((a, b) => v3.dist2d(a.pos, P.pos) - v3.dist2d(b.pos, P.pos))[0]; if (c) this.roles.set(c.id, 'contest'); }
      }
    } else if (m === 'control' && s.control) {
      const c = s.control, them = c.ctl[1 - this.team];
      this.urgent = (c.owner === 1 - this.team && them > 85) || (c.owner !== this.team && c.ctl[this.team] > 90);
    }
  }
  // a point on the team's side of the fight, about 25 m back toward home
  behindFront(alive) {
    const s = this.sim; if (!alive.length) return null;
    const home = s.mode.spawnList?.(alive[0]) || s.level.spawns[this.team]; if (!home?.length) return null;
    const h = home[Math.floor(home.length / 2)], c = alive.reduce((a, u) => [a[0] + u.pos[0] / alive.length, 0, a[2] + u.pos[2] / alive.length], [0, 0, 0]);
    const d = v3.dist2d(c, h); if (d < 30) return [h[0], h[1] || 0, h[2]];
    const t = 28 / d; return [c[0] + (h[0] - c[0]) * t, 0, c[2] + (h[2] - c[2]) * t];
  }
}
TeamBrain.prototype.lastCallT = -1; TeamBrain.prototype.focusLock = 0; TeamBrain.prototype.rallyUntil = 0; TeamBrain.prototype.helpUntil = 0;
