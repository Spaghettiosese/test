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
    this.focus = best;
    this.ultReady = alive.filter((u) => u.ult >= u.def.ult.cost - 1e-6).length;
    // ---- stance from numbers, health and ultimates
    const ratio = alive.length / Math.max(1, foes.length), hurtAvg = alive.length ? alive.reduce((a, u) => a + (u.hp + u.armor) / (u.maxHp + u.maxArmor), 0) / alive.length : 0;
    let st = 'hold';
    if (alive.length <= 1 || ratio < 0.55 || hurtAvg < 0.35) st = 'regroup';
    else if (ratio > 1.35 || (this.ultReady >= 3 && ratio >= 0.9)) st = 'push';
    if (s.time > this.stanceUntil) this.stance = st;
    // ---- the human's pings and callouts steer everyone
    const call = s.teamState[this.team]?.call;
    if (call && call.t > this.lastCallT && call.unit?.isPlayer) {
      this.lastCallT = call.t;
      const set = (stance, secs) => { this.stance = stance; this.stanceUntil = s.time + secs; };
      if (call.id === 'group') { this.rally = [...call.unit.pos]; this.rallyUntil = s.time + 10; set('regroup', 8); }
      else if (call.id === 'push') set('push', 14);
      else if (call.id === 'fallback') { this.rally = null; set('regroup', 10); }
      else if (call.id === 'defend') set('hold', 12);
      else if (call.id === 'help') { this.help = call.unit; this.helpUntil = s.time + 8; }
      else if (call.id === 'enemy' && call.target?.alive) { this.focus = call.target; this.focusLock = s.time + 6; }
      else if (call.id === 'go' && call.pos) { this.rally = [...call.pos]; this.rallyUntil = s.time + 12; set('push', 10); }
    }
    if (this.focusLock > s.time && this.focus && !this.focus.alive) this.focusLock = 0;
    if (this.helpUntil < s.time) this.help = null;
    if (this.rallyUntil < s.time) this.rally = null;
    // ---- ultimates fired together land harder: wait for a partner when the fight allows it
    const eng = [...vis.values()].filter((r) => r.d < 45).length;
    if (eng >= 2 && this.ultReady >= 2) { this.combo = s.time + 2.5; this.comboAt = s.time; }
    // ---- an enemy rush at the objective? remember where the fight is
    this.hotspot = vis.size ? [...vis.values()].reduce((a, r) => [a[0] + r.e.pos[0] / vis.size, a[1], a[2] + r.e.pos[2] / vis.size], [0, 0, 0]) : null;
  }
  // may this unit fire its ultimate now? (a combo window is open, or nobody else is ready)
  comboOk(u) { return this.ultReady <= 1 || this.sim.time < this.combo || u.def.role === 'support'; }
}
TeamBrain.prototype.lastCallT = -1; TeamBrain.prototype.focusLock = 0; TeamBrain.prototype.rallyUntil = 0; TeamBrain.prototype.helpUntil = 0;
