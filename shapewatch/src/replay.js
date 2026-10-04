// Replays. The Recorder samples the live simulation about 20 times a second into a short ring buffer
// of plain-data frames (no unit references), and keeps a clip around every highlight the sim
// scores. The ReplayPlayer feeds a clip back to the View through a stand-in "sim" whose units are
// proxies, so the kill cam (the killer's point of view) and Play of the Game need no special
// rendering path at all.
import { Sim } from './sim.js';
import { HERO } from './heroes.js';

const RATE = 0.05, RING = 17;
const UNIT_KEYS = ['unit', 'tgt', 'src', 'killer', 'victim', 'deployKill'];
const KEEP_EVENTS = new Set(['shot', 'tracer', 'impact', 'dmg', 'kill', 'boom', 'pulse', 'blink', 'dash', 'jump', 'land', 'reload', 'sonar', 'fizzle', 'barrierHit', 'barrierBreak', 'ult', 'revive', 'destroy', 'deploy', 'core', 'pack', 'heal', 'flash', 'shell', 'capture', 'captured']);
const STATUS_SHOWN = ['cloak', 'burn', 'overdrive', 'dmgBoost', 'frozen', 'sleep', 'root', 'silenced', 'marked', 'discord', 'nano', 'phased', 'hover', 'glide', 'stun', 'fortify', 'deadeye', 'speed', 'slow', 'resist', 'reveal', 'healAmp', 'nohealing', 'warded', 'brace'];
const isUnit = (v) => v && typeof v === 'object' && v.def && v.pos && v.id != null;

function snapUnit(u) {
  const s = u.s || {}, st = {};
  if (u.st) for (const k of STATUS_SHOWN) if (u.st[k]) st[k] = true;
  const o = {
    id: u.id, hero: u.hero, team: u.team, name: u.name, x: u.pos[0], y: u.pos[1], z: u.pos[2], yaw: u.yaw, pitch: u.pitch, vx: u.vx || 0, vz: u.vz || 0, hp: u.hp, ar: u.armor || 0, sh: u.shield || 0, alive: u.alive, gr: u.grounded,
    f1: !!u.in?.fire1, f2: !!u.in?.fire2, dash: !!u.dash, rl: u.reloadT || 0, ult: u.ult || 0, st,
  };
  if (s.barrier) o.bar = [s.barrier.up ? 1 : 0, s.barrier.hp, s.barrier.max];
  if (s.wall) o.wall = { pos: [...s.wall.pos], yaw: s.wall.yaw, hp: s.wall.hp, max: s.wall.max };
  if (s.beam?.id) o.beam = s.beam.id;
  if (s.drainT?.id) o.drain = s.drainT.id;
  if (s.hack?.tgt?.id) o.hack = s.hack.tgt.id;
  if (s.harmony?.id) o.harmony = s.harmony.id;
  if (s.coal) o.coal = 1;
  if (s.trans) o.trans = 1;
  if (s.flying) o.flying = 1;
  if (s.ulting) o.ulting = 1;
  if (s.scoped) o.scoped = 1;
  if (s.spun) o.spun = s.spun;
  if (s.block) o.block = 1;
  if (s.bunker) o.bunker = 1;
  if (s.charge) o.charge = s.charge;
  if (s.aura) o.aura = s.aura;
  if (s.fuel != null) o.fuel = s.fuel;
  if (s.noon) o.noon = 1;
  if (s.fan) o.fan = 1;
  if (u.deploy) o.dep = { kind: u.deploy.kind };
  return o;
}
function snapZone(z) {
  const o = {};
  for (const k of Object.keys(z)) { const v = z[k]; if (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean' || (Array.isArray(v) && v.every((x) => typeof x === 'number'))) o[k] = Array.isArray(v) ? [...v] : v; }
  return o;
}
function snapEvent(e) {
  const o = { type: e.type, t: e.t };
  for (const k of Object.keys(e)) {
    const v = e[k];
    if (UNIT_KEYS.includes(k)) o[k] = isUnit(v) ? { __u: v.id } : null;
    else if (k === 'assists') o.assists = v.map((a) => ({ __u: a.id }));
    else if (k === 'proj') o.proj = { id: v.id, pos: [...v.pos], spec: { color: v.spec.color, size: v.spec.size } };
    else if (k === 'zone') o.zone = snapZone(v);
    else if (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean') o[k] = v;
    else if (Array.isArray(v) && v.every((x) => typeof x === 'number')) o[k] = [...v];
  }
  return o;
}

export class Recorder {
  constructor(sim) {
    this.sim = sim; this.ring = []; this.pending = []; this.last = -1; this.clips = []; this.waiting = []; this.hlSeen = 0; this.enabled = true;
    const prev = sim.onStep; sim.onStep = (s) => { prev?.(s); this.tick(); };
  }
  frame(force = false) {
    const s = this.sim;
    if (!force && s.time - this.last < RATE) return null;
    this.last = s.time;
    const P = s.payload, f = {
      t: s.time, units: s.units.map(snapUnit),
      projs: s.projs.map((p) => ({ id: p.id, pos: [...p.pos], color: p.spec.color, size: p.spec.size })),
      zones: s.zones.map(snapZone), cores: s.cores.map((c) => ({ pos: [...c.pos], team: c.team })), packs: s.packs.map((p) => p.ready),
      payload: P ? { pos: [...P.pos], yaw: P.yaw, pushers: P.pushers, contested: P.contested, dist: P.dist, active: P.active, cp: P.cp, defenders: P.defenders } : null,
      control: s.control ? { owner: s.control.owner, capTeam: s.control.capTeam, capProg: s.control.capProg, contested: s.control.contested, ctl: [...s.control.ctl] } : null,
      cap: s.cap ? { prog: s.cap.prog, contested: s.cap.contested, done: s.cap.done } : null, mutator: s.mutator ? { id: s.mutator.id } : null, milestone: s.milestone || 0,
      events: this.pending,
    };
    this.pending = []; this.ring.push(f);
    while (this.ring.length && s.time - this.ring[0].t > RING) this.ring.shift();
    return f;
  }
  tick() {
    if (!this.enabled) return;
    const s = this.sim;
    for (const e of s.events) if (KEEP_EVENTS.has(e.type)) this.pending.push(snapEvent(e));
    this.frame();
    // new highlights: wait a moment for the aftermath, then cut a clip out of the ring
    while (this.hlSeen < s.hl.length) { const hl = s.hl[this.hlSeen++]; this.waiting.push({ hl, until: hl.t1 + 1.4 }); }
    // the sim trims its list occasionally: keep our cursor sane
    if (this.hlSeen > s.hl.length) this.hlSeen = s.hl.length;
    for (let i = this.waiting.length - 1; i >= 0; i--) if (s.time >= this.waiting[i].until) { this.cut(this.waiting[i]); this.waiting.splice(i, 1); }
  }
  cut({ hl, until }) {
    const t0 = Math.max(hl.t0 - 0.6, this.ring[0]?.t ?? 0), frames = this.ring.filter((f) => f.t >= t0 && f.t <= until);
    if (frames.length < 8) return;
    this.clips.push({ hl, frames, focus: hl.uid, kind: 'potg', title: hl.title, hero: hl.hero, name: hl.name, score: hl.score });
    this.clips.sort((a, b) => b.score - a.score); if (this.clips.length > 8) this.clips.length = 8;
  }
  // the last few seconds from the killer's point of view
  killcam(victim, killer, seconds = 4) {
    if (!killer || !this.enabled) return null;
    this.frame(true);
    const t1 = this.sim.time, frames = this.ring.filter((f) => f.t >= t1 - seconds);
    if (frames.length < 6) return null;
    return { frames: frames.slice(), focus: killer.id, kind: 'killcam', victim: victim.id, hero: killer.hero, name: killer.name };
  }
  finish() { for (const w of this.waiting) this.cut(w); this.waiting = []; this.frame(true); }
  best(n = 3) { return this.clips.slice(0, n); }
}

// ------------------------------------------------------------------ playback
export class ReplayPlayer {
  constructor(sim, clip, { speed = 1 } = {}) {
    this.real = sim; this.clip = clip; this.frames = clip.frames; this.i = 0; this.speed = speed; this.done = false;
    this.t0 = this.frames[0].t; this.t1 = this.frames[this.frames.length - 1].t; this.clock = this.t0; this.focus = clip.focus;
    const r = this.sim = Object.create(Sim.prototype);
    Object.assign(r, { level: sim.level, modeId: sim.modeId, playerTeam: sim.playerTeam, mode: sim.mode, state: 'live', units: [], projs: [], zones: [], cores: [], corpses: [], pings: [], packs: sim.packs.map((p) => ({ ...p, ready: true })), events: [], payload: null, control: null, cap: null, mutator: null, time: this.t0, player: null, round: sim.round, wins: sim.wins, timer: sim.timer, teams: [], hl: [], replay: true, difficulty: sim.difficulty });
    this.proxies = new Map();
    this.apply(this.frames[0], this.frames[0], 0, true);
  }
  proxy(id, snap) {
    let p = this.proxies.get(id);
    if (!p) {
      const real = this.real.units.find((u) => u.id === id);
      const hero = snap.hero || real?.hero || 'sabre';
      p = {
        id, hero, def: snap.dep ? { ...HERO[hero], radius: 0.45, height: 1.1 } : real?.def || HERO[hero], name: snap.name || real?.name || 'Unit', team: snap.team ?? real?.team ?? 0, isPlayer: !!real?.isPlayer, deploy: snap.dep ? { kind: snap.dep.kind, owner: null } : null, pos: [0, 0, 0], vx: 0, vz: 0, vy: 0, yaw: 0, pitch: 0, alive: true,
        hp: 100, maxHp: real?.maxHp || 200, armor: 0, maxArmor: real?.maxArmor || 0, shield: 0, st: {}, s: {}, in: { move: [0, 0], fire1: false, fire2: false, a1: false, a2: false, ult: false, reload: false, jump: false }, hurt: {}, skin: real?.skin, ult: 0, cd: { a1: 0, a2: 0, w2: 0 }, grounded: true, reloadT: 0, ammo: real?.ammo || 0, dash: null, stats: real?.stats, bot: null, invuln: 0, held: false,
      };
      this.proxies.set(id, p);
    }
    return p;
  }
  // interpolate frame a -> b by k and rebuild the stand-in sim
  apply(a, b, k, first = false) {
    const r = this.sim, bm = new Map(); for (const u of b.units) bm.set(u.id, u);
    const units = [];
    for (const ua of a.units) {
      const ub = bm.get(ua.id) || ua, p = this.proxy(ua.id, ua), L = (x, y) => x + (y - x) * k;
      p.pos = [L(ua.x, ub.x), L(ua.y, ub.y), L(ua.z, ub.z)]; let dy = ub.yaw - ua.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); p.yaw = ua.yaw + dy * k; p.pitch = L(ua.pitch, ub.pitch);
      p.vx = ua.vx; p.vz = ua.vz; p.hp = ua.hp; p.armor = ua.ar; p.shield = ua.sh; p.alive = ua.alive; p.grounded = ua.gr; p.in.fire1 = ua.f1; p.in.fire2 = ua.f2; p.dash = ua.dash ? {} : null; p.reloadT = ua.rl; p.ult = ua.ult; p.st = {}; for (const key of Object.keys(ua.st)) p.st[key] = { t: 1 };
      const s = (p.s = {});
      if (ua.bar) s.barrier = { up: !!ua.bar[0], hp: ua.bar[1], max: ua.bar[2] };
      if (ua.wall) s.wall = { ...ua.wall };
      const byId = (id) => id ? this.proxies.get(id) || (bm.has(id) ? this.proxy(id, bm.get(id)) : null) : null;
      if (ua.beam) s.beam = byId(ua.beam); if (ua.drain) s.drainT = byId(ua.drain); if (ua.hack) s.hack = { tgt: byId(ua.hack) }; if (ua.harmony) s.harmony = byId(ua.harmony);
      if (ua.coal) s.coal = {}; if (ua.trans) s.trans = {}; if (ua.flying) s.flying = true; if (ua.ulting) s.ulting = true; if (ua.scoped) s.scoped = true; if (ua.spun) s.spun = ua.spun; if (ua.block) s.block = {}; if (ua.bunker) s.bunker = true;
      if (ua.charge) s.charge = ua.charge; if (ua.aura) s.aura = ua.aura; if (ua.fuel != null) s.fuel = ua.fuel; if (ua.noon) s.noon = {}; if (ua.fan) s.fan = {};
      p.moving = Math.hypot(p.vx, p.vz); units.push(p);
    }
    r.units = units; r.time = first ? a.t : a.t + (b.t - a.t) * k;
    r.projs = a.projs.map((p) => ({ id: p.id, pos: p.pos, spec: { color: p.color, size: p.size } }));
    r.zones = a.zones.map((z) => ({ ...z })); r.cores = a.cores; r.packs.forEach((p, i) => { p.ready = a.packs[i] ?? true; });
    r.payload = a.payload; r.control = a.control; r.cap = a.cap; r.mutator = a.mutator; r.milestone = a.milestone;
    r.player = units.find((u) => u.id === this.focus) || null;
  }
  resolve(o) {
    const e = { ...o };
    for (const key of UNIT_KEYS) if (e[key] && e[key].__u != null) e[key] = this.proxies.get(e[key].__u) || null;
    if (e.assists) e.assists = e.assists.map((a) => this.proxies.get(a.__u)).filter(Boolean);
    if (e.type === 'kill' && e.victim) e.victim.alive = false;
    return e;
  }
  // advance real time; returns the events that happened since last call
  step(dt) {
    const out = [];
    if (this.done) return out;
    this.clock += dt * this.speed;
    if (this.clock >= this.t1) { this.clock = this.t1; this.done = true; }
    while (this.i < this.frames.length - 2 && this.frames[this.i + 1].t <= this.clock) { this.i++; for (const e of this.frames[this.i].events) out.push(this.resolve(e)); }
    const a = this.frames[this.i], b = this.frames[Math.min(this.frames.length - 1, this.i + 1)], k = b.t > a.t ? Math.min(1, Math.max(0, (this.clock - a.t) / (b.t - a.t))) : 0;
    this.apply(a, b, k);
    this.sim.events = out;
    return out;
  }
  get progress() { return (this.clock - this.t0) / Math.max(0.01, this.t1 - this.t0); }
  get focusUnit() { return this.sim.player; }
  restart() { this.i = 0; this.clock = this.t0; this.done = false; }
}
