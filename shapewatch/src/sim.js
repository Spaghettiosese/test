// The match simulation. No rendering in here: units, projectiles, zones, the payload and the
// round state machine all advance in step(dt) and report what happened through sim.events.
// Player and bots drive their unit the same way: by writing u.in (move, yaw, pitch, buttons).
import { HERO, HEROES, ROLES } from './heroes.js';
import { KITS, revive } from './kits.js';
import { makeLevelData, buildNav, findPath, PATH, CHECKPOINTS } from './map.js';
import { v3, clamp, forward, rng, TAU } from './util.js';
import { Brain } from './ai.js';

const STEP = 0.6, GRAV = -20, JUMP = 7.4;
const SETUP_TIME = 22, START_TIME = 300, CP_BONUS = 100, RESPAWN = 7, OT_TIME = 12;
export const PAYLOAD_RADIUS = 4.6;
const PATH_LEN = PATH[1][1] - PATH[0][1];

export const MUTATORS = {
  lowgrav: { name: 'LOW GRAVITY', desc: 'The snow is lighter today.' },
  overclock: { name: 'OVERCLOCK', desc: 'Cooldowns recharge twice as fast.' },
  glass: { name: 'GLASS CANNON', desc: 'Everyone hits 40% harder.' },
  blizzard: { name: 'WHITEOUT', desc: 'The payload surges while the storm rolls in.' },
};

let NEXT_ID = 1;
export class Sim {
  constructor({ seed = 7, playerTeam = 0, playerHero = 'sabre', difficulty = 1, mutators = true, headless = false, autoPlayer = false } = {}) {
    this.rand = rng(seed); this.difficulty = difficulty; this.useMutators = mutators; this.headless = headless;
    this.level = makeLevelData(); this.nav = buildNav(this.level);
    this.buildGrid();
    this.units = []; this.projs = []; this.zones = []; this.cores = []; this.corpses = []; this.events = [];
    this.packs = this.level.packs.map((p) => ({ ...p, ready: true, t: 0 }));
    this.time = 0; this.state = 'setup'; this.setupT = SETUP_TIME; this.timer = START_TIME; this.overtime = 0; this.inOvertime = false;
    this.winner = null; this.mutator = null; this.nextMutator = 70 + this.rand() * 20; this.score = [0, 0];
    this.payload = { dist: 0, pos: [PATH[0][0], 0, PATH[0][1]], pushers: 0, defenders: 0, contested: false, cp: 0, speed: 0, idle: 0 };
    this.playerTeam = playerTeam; this.player = null;
    this.compose(playerTeam, playerHero);
    this.units.forEach((u) => { this.spawn(u, true); if (!u.isPlayer || autoPlayer) u.bot = new Brain(this, u, difficulty); });
  }

  // ---------------------------------------------------------------- roster
  compose(playerTeam, playerHero) {
    const names = [['Aria', 'Bram', 'Cade', 'Dara', 'Eli', 'Fynn', 'Gus', 'Hana', 'Ivo', 'Juno', 'Kai', 'Lena'], ['Mika', 'Nox', 'Ora', 'Pike', 'Quin', 'Rhea', 'Soren', 'Tess', 'Uma', 'Vex', 'Wren', 'Zed']];
    for (let t = 0; t < 2; t++) {
      const need = { tank: 1, damage: 2, support: 2 };
      const picked = [];
      if (t === playerTeam) { const h = HERO[playerHero]; need[h.role]--; picked.push({ hero: h.id, player: true }); }
      for (const role of ['tank', 'damage', 'support']) for (let i = 0; i < need[role]; i++) {
        const pool = HEROES.filter((h) => h.role === role && !picked.some((p) => p.hero === h.id));
        picked.push({ hero: this.rand.pick(pool).id });
      }
      picked.forEach((p, i) => {
        const u = this.makeUnit(p.hero, t, p.player ? 'You' : names[t][(i * 2 + t * 3) % 12]);
        if (p.player) { u.isPlayer = true; this.player = u; }
        this.units.push(u);
      });
    }
    this.units.sort((a, b) => a.team - b.team || (a.isPlayer ? -1 : b.isPlayer ? 1 : 0));
  }
  makeUnit(heroId, team, name) {
    const d = HERO[heroId];
    const u = {
      id: NEXT_ID++, name, team, def: d, hero: heroId, isPlayer: false, bot: null, alive: true, deploy: null,
      pos: [0, 0, 0], vx: 0, vz: 0, vy: 0, yaw: team ? Math.PI : 0, pitch: 0, grounded: true,
      hp: d.hp, armor: d.armor, shield: 0, shieldDecay: 0, maxHp: d.hp, maxArmor: d.armor,
      ult: 0, cd: { a1: 0, a2: 0, w2: 0 }, charges: d.a1.charges || 0, chargeT: 0,
      ammo: d.w1.ammo || 0, reloadT: 0, fireT: 0, st: {}, respawnT: 0, invuln: 0, dash: null, hist: [],
      in: { move: [0, 0], fire1: false, fire2: false, a1: false, a2: false, ult: false, reload: false, jump: false },
      prev: { fire1: false, fire2: false }, s: {},
      stats: { elims: 0, assists: 0, deaths: 0, dmg: 0, heal: 0, ults: 0 }, hurt: {}, lastHit: null, killedBy: null, pendingHero: null, streak: 0, moving: 0,
    };
    return u;
  }
  // keep the team at 1 tank / 2 damage / 2 support when the player changes role during setup
  recompose(team) {
    const mates = this.units.filter((u) => u.team === team && !u.deploy), me = mates.find((u) => u.isPlayer), need = { tank: 1, damage: 2, support: 2 };
    if (me) need[me.def.role]--;
    const bots = mates.filter((u) => !u.isPlayer), keep = new Set();
    for (const b of bots) if (need[b.def.role] > 0) { need[b.def.role]--; keep.add(b); }
    for (const b of bots) {
      if (keep.has(b)) continue;
      const role = Object.keys(need).find((r) => need[r] > 0); if (!role) break; need[role]--;
      const pool = HEROES.filter((h) => h.role === role && !mates.some((m) => m.hero === h.id));
      this.swapHero(b, this.rand.pick(pool).id); b.skin = undefined;
    }
  }
  swapHero(u, heroId) {
    const d = HERO[heroId]; u.def = d; u.hero = heroId; u.maxHp = d.hp; u.maxArmor = d.armor; u.s = {}; u.cd = { a1: 0, a2: 0, w2: 0 };
    u.charges = d.a1.charges || 0; u.ammo = d.w1.ammo || 0; u.ult = Math.min(u.ult, 0); u.st = {};
    this.emit({ type: 'swap', unit: u });
  }

  // ---------------------------------------------------------------- spawning
  spawn(u, first = false) {
    if (u.pendingHero && u.pendingHero !== u.hero) this.swapHero(u, u.pendingHero);
    u.pendingHero = null;
    const sp = this.level.spawns[u.team], i = this.units.filter((o) => o.team === u.team && !o.deploy).indexOf(u);
    const p = sp[(i < 0 ? 0 : i) % sp.length];
    u.pos = [p[0] + (this.rand() - 0.5) * 1.2, 0, p[2] + (this.rand() - 0.5) * 1.2]; u.vx = u.vz = u.vy = 0; u.dash = null;
    u.yaw = u.team ? Math.PI : 0; u.pitch = 0; u.alive = true; u.hp = u.maxHp; u.armor = u.maxArmor; u.shield = 0; u.st = {}; u.s = {};
    u.ammo = u.def.w1.ammo || 0; u.reloadT = 0; u.fireT = 0; u.cd = { a1: 0, a2: 0, w2: 0 }; u.charges = u.def.a1.charges || 0; u.hist = [];
    u.invuln = first ? 0 : 2.5; u.hurt = {}; u.lastHit = null; u.killedBy = null;
    if (!first) { u.ult = Math.max(0, u.ult * 0.5 - 0); }
    this.emit({ type: 'spawn', unit: u });
  }

  // ---------------------------------------------------------------- spatial queries
  buildGrid() {
    this.grid = new Map(); const C = 8;
    for (const b of this.level.boxes) for (let i = Math.floor(b.x0 / C); i <= Math.floor(b.x1 / C); i++) for (let j = Math.floor(b.z0 / C); j <= Math.floor(b.z1 / C); j++) {
      const k = i + ',' + j; if (!this.grid.has(k)) this.grid.set(k, []); this.grid.get(k).push(b);
    }
    this.gridC = C;
  }
  near(x, z, r) {
    const C = this.gridC, out = new Set();
    for (let i = Math.floor((x - r) / C); i <= Math.floor((x + r) / C); i++) for (let j = Math.floor((z - r) / C); j <= Math.floor((z + r) / C); j++) { const l = this.grid.get(i + ',' + j); if (l) for (const b of l) out.add(b); }
    return out;
  }
  blockedAt(x, z, y, r, h) {
    for (const b of this.near(x, z, r)) {
      if (b.y1 <= y + STEP + 1e-3 || b.y0 >= y + h) continue;
      const cx = clamp(x, b.x0, b.x1), cz = clamp(z, b.z0, b.z1);
      if ((x - cx) ** 2 + (z - cz) ** 2 < r * r) return true;
    }
    return false;
  }
  groundAt(x, z, y, r) {
    let g = 0;
    for (const b of this.near(x, z, r)) {
      if (b.y1 > y + STEP + 1e-3 || b.y1 <= g) continue;
      const cx = clamp(x, b.x0, b.x1), cz = clamp(z, b.z0, b.z1);
      if ((x - cx) ** 2 + (z - cz) ** 2 < r * r * 0.7) g = b.y1;
    }
    return g;
  }
  ceilingAt(x, z, y, r, h) {
    let c = 1e9;
    for (const b of this.near(x, z, r)) {
      if (b.y0 < y + h * 0.5 || b.y0 >= c) continue;
      const cx = clamp(x, b.x0, b.x1), cz = clamp(z, b.z0, b.z1);
      if ((x - cx) ** 2 + (z - cz) ** 2 < r * r) c = b.y0;
    }
    return c;
  }
  eyeHeight(u) { return u.def.height * 0.92; }
  eye(u) { return [u.pos[0], u.pos[1] + this.eyeHeight(u), u.pos[2]]; }
  aimDir(u) { return forward(u.yaw, u.pitch); }
  right(u) { return [-Math.cos(u.yaw), 0, Math.sin(u.yaw)]; }
  muzzle(u) { const e = this.eye(u), f = this.aimDir(u), r = this.right(u); return [e[0] + f[0] * 0.7 + r[0] * 0.3, e[1] - 0.22 + f[1] * 0.7, e[2] + f[2] * 0.7 + r[2] * 0.3]; }
  center(u) { return [u.pos[0], u.pos[1] + u.def.height * 0.55, u.pos[2]]; }
  dist(a, b) { return v3.dist2d(a.pos, b.pos); }

  // ray vs level boxes: nearest t or Infinity
  rayWorld(o, d, maxT) {
    let best = Infinity, nrm = null;
    for (const b of this.level.boxes) {
      let t0 = 0, t1 = maxT, n = null;
      for (let a = 0; a < 3; a++) {
        const lo = a === 0 ? b.x0 : a === 1 ? b.y0 : b.z0, hi = a === 0 ? b.x1 : a === 1 ? b.y1 : b.z1;
        if (Math.abs(d[a]) < 1e-9) { if (o[a] < lo || o[a] > hi) { t0 = Infinity; break; } continue; }
        let ta = (lo - o[a]) / d[a], tb = (hi - o[a]) / d[a], sgn = -1;
        if (ta > tb) { const s = ta; ta = tb; tb = s; sgn = 1; }
        if (ta > t0) { t0 = ta; n = [0, 0, 0]; n[a] = sgn; }
        if (tb < t1) t1 = tb;
        if (t0 > t1) { t0 = Infinity; break; }
      }
      if (t0 < best && t0 !== Infinity && t0 >= 0) { best = t0; nrm = n; }
    }
    return { t: best, normal: nrm };
  }
  los(a, b) { // clear line between two points?
    const d = v3.sub(b, a), l = v3.len(d); if (l < 0.01) return true;
    const dir = [d[0] / l, d[1] / l, d[2] / l];
    return this.rayWorld(a, dir, l).t >= l - 0.05;
  }
  // ray vs a vertical capsule-ish unit: body cylinder plus head sphere
  rayUnit(o, d, maxT, u) {
    const r = u.def.radius, h = u.def.height, cx = u.pos[0], cz = u.pos[2], y0 = u.pos[1];
    // head sphere
    const hc = [cx, y0 + h - 0.24, cz], hr = u.deploy ? 0 : 0.24;
    let head = Infinity;
    if (hr) { const oc = v3.sub(o, hc), b = v3.dot(oc, d), c = v3.dot(oc, oc) - hr * hr, disc = b * b - c; if (disc >= 0) { const t = -b - Math.sqrt(disc); if (t >= 0 && t <= maxT) head = t; } }
    // body cylinder
    const ox = o[0] - cx, oz = o[2] - cz, a = d[0] * d[0] + d[2] * d[2];
    let body = Infinity;
    if (a > 1e-9) {
      const b = ox * d[0] + oz * d[2], c = ox * ox + oz * oz - r * r, disc = b * b - a * c;
      if (disc >= 0) { const s = Math.sqrt(disc); for (const t of [(-b - s) / a, (-b + s) / a]) { if (t < 0 || t > maxT) continue; const y = o[1] + d[1] * t; if (y >= y0 && y <= y0 + h) { body = t; break; } } }
    } else if (ox * ox + oz * oz < r * r) { body = 0; }
    if (head < Infinity && head <= body + 0.05) return { t: head, head: true };
    if (body < Infinity) return { t: body, head: false };
    return null;
  }
  barrierOf(u) { return u.alive && u.s.barrier && u.s.barrier.up ? u.s.barrier : null; }
  rayBox(o, d, maxT, c, hx, hy, hz, yaw) { // oriented box, rotated about Y
    const cs = Math.cos(-yaw), sn = Math.sin(-yaw), px = o[0] - c[0], pz = o[2] - c[2];
    const lo = [px * cs + pz * sn, o[1] - c[1], -px * sn + pz * cs], ld = [d[0] * cs + d[2] * sn, d[1], -d[0] * sn + d[2] * cs];
    const hs = [hx, hy, hz]; let t0 = 0, t1 = maxT;
    for (let a = 0; a < 3; a++) {
      if (Math.abs(ld[a]) < 1e-9) { if (Math.abs(lo[a]) > hs[a]) return Infinity; continue; }
      let ta = (-hs[a] - lo[a]) / ld[a], tb = (hs[a] - lo[a]) / ld[a]; if (ta > tb) [ta, tb] = [tb, ta];
      t0 = Math.max(t0, ta); t1 = Math.min(t1, tb); if (t0 > t1) return Infinity;
    }
    return t0;
  }
  barrierCenter(u) { const f = [Math.sin(u.yaw), 0, Math.cos(u.yaw)]; return [u.pos[0] + f[0] * 1.9, u.pos[1] + 1.25, u.pos[2] + f[2] * 1.9]; }
  // first thing a bullet hits. opts: team (shooter's team: allies are skipped), pierce (through walls/units)
  trace(o, d, maxT, { team = -1, skip = null, pierce = false, allies = false } = {}) {
    let best = { t: maxT, kind: 'none' };
    if (!pierce) { const w = this.rayWorld(o, d, maxT); if (w.t < best.t) best = { t: w.t, kind: 'world', normal: w.normal }; }
    for (const u of this.units) {
      if (!u.alive || u === skip || (u.team === team && !allies)) continue;
      if (u.invuln > 0 && !u.deploy) { /* still blocks, takes no damage */ }
      const hit = this.rayUnit(o, d, best.t, u);
      if (hit && hit.t < best.t) best = { t: hit.t, kind: 'unit', unit: u, head: hit.head };
      if (!pierce) {
        const bar = this.barrierOf(u);
        if (bar && u.team !== team) { const t = this.rayBox(o, d, best.t, this.barrierCenter(u), 1.9, 1.25, 0.12, u.yaw); if (t < best.t) best = { t, kind: 'barrier', unit: u }; }
      }
    }
    if (!pierce) for (const z of this.zones) if (z.kind === 'dome' && z.team !== team) {
      // enter the dome from outside: stop at its surface
      const oc = v3.sub(o, z.pos), b = v3.dot(oc, d), c = v3.dot(oc, oc) - z.r * z.r;
      if (c > 0) { const disc = b * b - c; if (disc >= 0) { const t = -b - Math.sqrt(disc); if (t >= 0 && t < best.t) best = { t, kind: 'dome', zone: z }; } }
    }
    best.point = v3.madd(o, d, best.t === maxT && best.kind === 'none' ? maxT : best.t);
    return best;
  }
  area(pos, r, fn, { team = null, enemiesOf = null, alliesOf = null, los = false, y = true } = {}) {
    for (const u of this.units) {
      if (!u.alive) continue;
      if (enemiesOf !== null && u.team === enemiesOf) continue;
      if (alliesOf !== null && u.team !== alliesOf) continue;
      const c = this.center(u), d = y ? v3.dist(c, pos) : v3.dist2d(c, pos);
      if (d - u.def.radius > r) continue;
      if (los && !this.los(pos, c)) continue;
      fn(u, d);
    }
  }
  enemies(u) { return this.units.filter((o) => o.alive && o.team !== u.team && !o.invuln); }
  allies(u, selfToo = false) { return this.units.filter((o) => o.alive && o.team === u.team && !o.deploy && (selfToo || o !== u)); }

  // ---------------------------------------------------------------- damage, healing, statuses
  emit(e) { e.t = this.time; this.events.push(e); }
  addStatus(u, name, dur, data = {}) {
    const cur = u.st[name];
    if (cur && cur.t > dur && !data.force) { Object.assign(cur, { ...data, t: cur.t }); return cur; }
    return (u.st[name] = { ...data, t: dur });
  }
  multOut(src) { let m = 1; if (src) { if (src.st.dmgBoost) m *= 1 + src.st.dmgBoost.f; if (src.st.overdrive) m *= 1.25; } if (this.mutator?.id === 'glass') m *= 1.4; return m; }
  multIn(u) {
    let m = 1; if (u.st.resist) m *= 1 - u.st.resist.f;
    for (const z of this.zones) if (z.kind === 'dome' && z.team === u.team && v3.dist2d(z.pos, u.pos) < z.r) m *= 0.4;
    return m;
  }
  damage(tgt, amt, src, { head = false, point = null, kind = 'bullet', noBoost = false, silent = false } = {}) {
    if (!tgt.alive || amt <= 0) return 0;
    if (src && src.team === tgt.team && src !== tgt) return 0;
    if (tgt.invuln > 0 && !tgt.deploy) return 0;
    let d = amt * (noBoost ? 1 : this.multOut(src)) * this.multIn(tgt);
    if (tgt.st.phased) return 0;
    const dealt = d;
    // overshield, then armor (flat reduction per hit), then health
    if (tgt.shield > 0) { const a = Math.min(tgt.shield, d); tgt.shield -= a; d -= a; }
    if (d > 0 && tgt.armor > 0) { const red = Math.min(5, d * 0.3); d -= red; const a = Math.min(tgt.armor, d); tgt.armor -= a; d -= a; }
    if (d > 0) tgt.hp -= d;
    if (src && src !== tgt) {
      src.stats.dmg += dealt; this.chargeUlt(src, dealt * 0.55);
      tgt.hurt[src.id] = this.time; tgt.lastHit = { src, t: this.time, head };
    }
    if (!silent) this.emit({ type: 'dmg', tgt, src, amt: dealt, head, point: point || this.center(tgt), kind });
    if (tgt.hp <= 0) this.kill(tgt, src, head);
    return dealt;
  }
  heal(tgt, amt, src) {
    if (!tgt.alive || tgt.deploy) return 0;
    const a = Math.min(amt, tgt.maxHp - tgt.hp);
    if (a <= 0) return 0;
    tgt.hp += a;
    if (src && src !== tgt) { src.stats.heal += a; this.chargeUlt(src, a * 0.3); }
    this.emit({ type: 'heal', tgt, src, amt: a });
    return a;
  }
  chargeUlt(u, pts) { if (u.deploy || !u.alive) return; u.ult = Math.min(u.def.ult.cost, u.ult + pts); }
  kill(tgt, src, head) {
    tgt.alive = false; tgt.hp = 0; tgt.shield = 0; tgt.streakLost = tgt.streak; tgt.streak = 0;
    if (tgt.deploy) { this.emit({ type: 'destroy', unit: tgt }); this.units.splice(this.units.indexOf(tgt), 1); return; }
    tgt.respawnT = RESPAWN; tgt.stats.deaths++; tgt.killedBy = src && src !== tgt ? src : null; tgt.deadAt = [...tgt.pos];
    const assists = this.units.filter((o) => o !== src && o.team !== tgt.team && !o.deploy && this.time - (tgt.hurt[o.id] ?? -99) < 8);
    if (src && src !== tgt && !src.deploy) { src.stats.elims++; src.streak++; this.chargeUlt(src, 60); }
    for (const a of assists) { a.stats.assists++; this.chargeUlt(a, 40); }
    this.corpses.push({ unit: tgt, pos: [...tgt.pos], team: tgt.team, hero: tgt.hero, t: 12 });
    if (src && src !== tgt) this.cores.push({ pos: [tgt.pos[0], tgt.pos[1] + 0.6, tgt.pos[2]], team: src.team, t: 14, y0: tgt.pos[1] + 0.6 });
    this.emit({ type: 'kill', killer: src && !src.deploy ? src : null, victim: tgt, assists, head, deployKill: src?.deploy ? src : null });
    tgt.in.fire1 = tgt.in.fire2 = false;
    const k = KITS[tgt.hero]; if (k?.onDeath) k.onDeath(this, tgt);
  }
  revive(u, pos) { revive(this, u, pos); }
  knock(u, v) { u.vx += v[0]; u.vz += v[2]; u.vy = Math.max(u.vy, v[1]); if (v[1] > 0.1) u.grounded = false; }

  // ---------------------------------------------------------------- projectiles
  spawnProj(owner, spec, dir, pos = null) {
    const p = { id: NEXT_ID++, owner, team: owner.team, spec, pos: pos ? [...pos] : this.muzzle(owner), vel: v3.scale(dir, spec.speed), age: 0, life: spec.life ?? 4, dead: false, data: {} };
    this.projs.push(p); this.emit({ type: 'proj', proj: p }); return p;
  }
  stepProj(p, dt) {
    const s = p.spec; p.age += dt;
    if (s.gravity) p.vel[1] += s.gravity * dt;
    if (s.homing) { /* gentle steering handled by kit */ }
    const sp = v3.len(p.vel), dir = v3.scale(p.vel, 1 / (sp || 1)), maxT = sp * dt;
    let hit = this.trace(p.pos, dir, maxT + 0.0001, { team: p.team, skip: p.owner, allies: !!s.allies });
    // inflate: also catch units near the swept path (projectiles have a radius)
    if (hit.kind !== 'unit' && s.radius > 0.1) {
      const mid = v3.madd(p.pos, dir, Math.min(hit.t, maxT) * 0.5);
      for (const u of this.units) {
        if (!u.alive || u.team === p.team || u === p.owner) continue;
        const c = this.center(u);
        if (v3.dist(c, mid) < Math.min(hit.t, maxT) * 0.5 + u.def.radius + s.radius * 0.8 + u.def.height * 0.25 && v3.dist(c, v3.madd(p.pos, dir, Math.max(0, Math.min(maxT, v3.dot(v3.sub(c, p.pos), dir))))) < u.def.radius + s.radius + 0.1) { hit = { t: Math.max(0, v3.dot(v3.sub(c, p.pos), dir)), kind: 'unit', unit: u, head: false }; break; }
      }
    }
    if (hit.kind !== 'none' && hit.t <= maxT + 0.001) {
      p.pos = v3.madd(p.pos, dir, hit.t);
      this.projHit(p, hit);
    } else p.pos = v3.madd(p.pos, p.vel, dt);
    // dome walls eat projectiles that were fired from outside
    if (!p.dead) for (const z of this.zones) if (z.kind === 'dome' && z.team !== p.team && v3.dist(p.pos, z.pos) < z.r) { p.dead = true; this.emit({ type: 'fizzle', pos: p.pos }); }
    if (p.age > p.life && !p.dead) { if (s.explodeOnExpire) this.projHit(p, { kind: 'expire' }); else p.dead = true; }
  }
  projHit(p, hit) {
    const s = p.spec, k = KITS[p.owner.hero];
    p.dead = true;
    if (hit.kind === 'barrier' && !s.onHit) { this.hitBarrier(hit.unit, (s.dmg || 0) + (s.splashDmg || 0) * 0.5, p.owner, p.pos); }
    if (s.onHit) { s.onHit(this, p, hit); return; }
    if (hit.kind === 'unit') {
      this.damage(hit.unit, s.dmg, p.owner, { point: p.pos, kind: 'proj' });
      if (s.slow) this.addStatus(hit.unit, 'slow', s.slow[1], { f: s.slow[0] });
      if (s.burn) this.addStatus(hit.unit, 'burn', s.burn[1], { dps: s.burn[0], src: p.owner });
      if (s.heal && hit.unit.team === p.team) this.heal(hit.unit, s.heal, p.owner);
    }
    if (s.splash > 0) {
      this.area(p.pos, s.splash, (u, d) => {
        if (u.team === p.team && !s.hurtSelf) return;
        if (hit.kind === 'unit' && u === hit.unit) return;
        const f = 1 - clamp((d - u.def.radius) / s.splash, 0, 1) * 0.5;
        this.damage(u, (s.splashDmg ?? s.dmg) * f, p.owner, { point: p.pos, kind: 'splash' });
        if (s.slow) this.addStatus(u, 'slow', s.slow[1], { f: s.slow[0] });
      }, { enemiesOf: p.team, los: true });
    }
    this.emit({ type: 'boom', pos: [...p.pos], r: s.splash || 0.6, color: s.color, kind: s.sfxKind || 'small' });
    if (k?.onProjEnd) k.onProjEnd(this, p, hit);
  }

  addZone(z) { z.id = NEXT_ID++; z.age = 0; this.zones.push(z); this.emit({ type: 'zone', zone: z }); return z; }
  spawnDeploy(owner, kind, pos, hp, extra = {}) {
    for (const o of this.units) if (o.deploy && o.deploy.owner === owner && o.deploy.kind === kind && o.alive) { o.alive = false; this.units.splice(this.units.indexOf(o), 1); this.emit({ type: 'destroy', unit: o, quiet: true }); break; }
    const u = this.makeUnit(owner.hero, owner.team, kind);
    u.def = { ...HERO[owner.hero], radius: 0.45, height: 1.1, hp, armor: 0 }; u.hp = u.maxHp = hp; u.armor = 0; u.pos = [...pos]; u.deploy = { kind, owner, t: extra.life ?? 20, ...extra };
    u.stats = null; u.hurt = {}; u.in = { move: [0, 0] };
    this.units.push(u); this.emit({ type: 'deploy', unit: u }); return u;
  }

  // ---------------------------------------------------------------- unit update
  canAct(u) { return u.alive && !u.st.stun && this.state !== 'setup'; }
  speedOf(u) {
    let s = u.def.speed;
    if (u.st.speed) s *= 1 + u.st.speed.f;
    if (u.st.slow) s *= 1 - u.st.slow.f;
    if (u.s.barrier?.up) s *= 0.55;
    if (u.s.scoped) s *= 0.55;
    if (u.st.brace) s *= 0.75;
    return s;
  }
  stepUnit(u, dt) {
    if (u.deploy) return this.stepDeploy(u, dt);
    if (!u.alive) {
      if (this.state === 'live') { u.respawnT -= dt; if (u.respawnT <= 0 && !u.held) this.spawn(u); }
      return;
    }
    u.invuln = Math.max(0, u.invuln - dt);
    // statuses
    for (const k of Object.keys(u.st)) {
      const s = u.st[k]; s.t -= dt;
      if (k === 'burn' && s.src) this.damage(u, s.dps * dt, s.src, { silent: true, kind: 'burn', noBoost: true });
      if (s.t <= 0) delete u.st[k];
    }
    if (u.shield > 0 && u.shieldDecay) u.shield = Math.max(0, u.shield - u.shieldDecay * dt);
    // cooldowns (overclock doubles the tick), recharging blink charges
    const tick = dt * (this.mutator?.id === 'overclock' ? 2 : 1);
    for (const k of ['a1', 'a2', 'w2']) u.cd[k] = Math.max(0, u.cd[k] - tick);
    if (u.def.a1.charges && u.charges < u.def.a1.charges) { u.chargeT += tick; if (u.chargeT >= u.def.a1.cd) { u.charges++; u.chargeT = 0; } }
    // passive ultimate charge
    if (this.state === 'live') this.chargeUlt(u, 5.2 * dt);
    const kit = KITS[u.hero], inp = u.in, can = this.canAct(u);
    if (kit?.update) kit.update(this, u, dt);
    // history for rewind
    if (this.state === 'live') { u.hist.push({ t: this.time, pos: [...u.pos], hp: u.hp, armor: u.armor }); while (u.hist.length && this.time - u.hist[0].t > 3.2) u.hist.shift(); }
    // ---- movement
    let wx = 0, wz = 0;
    const frozen = !can || (this.state === 'setup');
    if (!frozen && !u.dash) {
      const mv = inp.move, f = [Math.sin(u.yaw), Math.cos(u.yaw)], r = [-Math.cos(u.yaw), Math.sin(u.yaw)];
      wx = f[0] * mv[1] + r[0] * mv[0]; wz = f[1] * mv[1] + r[1] * mv[0];
      const l = Math.hypot(wx, wz); if (l > 1) { wx /= l; wz /= l; }
      const sp = this.speedOf(u); wx *= sp; wz *= sp;
      if (inp.jump && u.grounded) { u.vy = JUMP; u.grounded = false; this.emit({ type: 'jump', unit: u }); }
    }
    if (u.dash) {
      u.dash.t -= dt; u.vx = u.dash.vx; u.vz = u.dash.vz;
      if (u.dash && u.dash.hit) u.dash.hit(this, u, dt);
      if (u.dash && u.dash.t <= 0) { const d = u.dash; u.dash = null; if (d.end) d.end(this, u); }
    } else {
      const acc = u.grounded ? 48 : 7, k = Math.min(1, acc * dt);
      u.vx += (wx - u.vx) * k; u.vz += (wz - u.vz) * k;
    }
    const lg = this.mutator?.id === 'lowgrav' ? 0.42 : 1;
    const glide = u.st.glide ? 0.18 : 1;
    if (!u.dash || !u.dash.noGravity) u.vy += GRAV * lg * glide * dt;
    if (u.st.glide && u.vy < -2.2) u.vy = -2.2;
    this.moveUnit(u, dt);
    u.moving = Math.hypot(u.vx, u.vz);
    // push other units apart a little
    for (const o of this.units) {
      if (o === u || !o.alive || o.deploy) continue;
      const dx = u.pos[0] - o.pos[0], dz = u.pos[2] - o.pos[2], min = u.def.radius + o.def.radius, d = Math.hypot(dx, dz);
      if (d < min && d > 1e-4 && Math.abs(u.pos[1] - o.pos[1]) < 1.6) { const push = (min - d) * 0.5 * (o.def.radius / (u.def.radius + o.def.radius) * 2); const nx = u.pos[0] + (dx / d) * push, nz = u.pos[2] + (dz / d) * push; if (!this.blockedAt(nx, nz, u.pos[1], u.def.radius, u.def.height)) { u.pos[0] = nx; u.pos[2] = nz; } }
    }
    if (u.pos[1] < -10) { this.damage(u, 9999, null, { silent: true }); }
    if (!can) { u.prev.fire1 = u.prev.fire2 = false; inp.a1 = inp.a2 = inp.ult = inp.reload = false; return; }
    this.stepWeapon(u, dt, kit);
    // ---- abilities (momentary buttons are consumed here)
    if (inp.a1) { inp.a1 = false; if (this.abilityReady(u, 'a1') && kit?.a1) { if (kit.a1(this, u) !== false) this.spendAbility(u, 'a1'); } }
    if (inp.a2) { inp.a2 = false; if (this.abilityReady(u, 'a2') && kit?.a2) { if (kit.a2(this, u) !== false) this.spendAbility(u, 'a2'); } }
    if (inp.ult) { inp.ult = false; if (u.ult >= u.def.ult.cost - 1e-6 && !u.s.ulting && kit?.ult) { if (kit.ult(this, u) !== false) { u.ult = 0; u.stats.ults++; this.emit({ type: 'ult', unit: u }); } } }
    if (kit?.secondary) kit.secondary(this, u, dt, inp.fire2, inp.fire2 && !u.prev.fire2);
    u.prev.fire1 = inp.fire1; u.prev.fire2 = inp.fire2;
  }
  abilityReady(u, k) {
    if (k === 'a1' && u.def.a1.charges) return u.charges > 0;
    return u.cd[k] <= 0;
  }
  spendAbility(u, k) {
    if (k === 'a1' && u.def.a1.charges) { u.charges--; if (u.charges === u.def.a1.charges - 1) u.chargeT = 0; u.cd.a1 = 0.25; return; }
    u.cd[k] = u.def[k].cd;
  }
  moveUnit(u, dt) {
    const r = u.def.radius, h = u.def.height;
    let nx = u.pos[0] + u.vx * dt, nz = u.pos[2] + u.vz * dt;
    if (!this.blockedAt(nx, u.pos[2], u.pos[1], r, h)) u.pos[0] = nx; else u.vx *= 0.2;
    if (!this.blockedAt(u.pos[0], nz, u.pos[1], r, h)) u.pos[2] = nz; else u.vz *= 0.2;
    const B = this.level.bounds;
    u.pos[0] = clamp(u.pos[0], B.x0 + r, B.x1 - r); u.pos[2] = clamp(u.pos[2], B.z0 + r, B.z1 - r);
    // vertical
    const g = this.groundAt(u.pos[0], u.pos[2], u.pos[1], r);
    const ny = u.pos[1] + u.vy * dt;
    if (u.vy <= 0 && ny <= g + 1e-4) {
      if (!u.grounded && u.vy < -9) this.emit({ type: 'land', unit: u, speed: -u.vy });
      u.pos[1] = g; u.vy = 0; u.grounded = true;
    } else if (u.grounded && u.vy <= 0 && u.pos[1] - g < 0.45) { u.pos[1] = g; u.vy = 0; }
    else {
      u.grounded = false; u.pos[1] = ny;
      const c = this.ceilingAt(u.pos[0], u.pos[2], u.pos[1], r, h);
      if (u.vy > 0 && u.pos[1] + h > c) { u.pos[1] = c - h; u.vy = 0; }
    }
    if (u.grounded && u.s.onLand) { const f = u.s.onLand; u.s.onLand = null; f(this, u); }
  }

  // ---------------------------------------------------------------- weapons
  stepWeapon(u, dt, kit) {
    const w = u.def.w1, inp = u.in;
    u.fireT -= dt;
    if (u.reloadT > 0) { u.reloadT -= dt; if (u.reloadT <= 0) { u.ammo = w.ammo; this.emit({ type: 'reloaded', unit: u }); } return; }
    if (w.ammo && (inp.reload || u.ammo <= 0) && u.ammo < w.ammo && !(kit?.noReload?.(this, u))) { u.reloadT = w.reload; u.in.reload = false; this.emit({ type: 'reload', unit: u }); return; }
    inp.reload = false;
    if (!inp.fire1 || u.fireT > 0) return;
    if (!w.auto && u.prev.fire1) return;
    if (kit?.canFire1 && !kit.canFire1(this, u)) return;
    if (w.ammo && u.ammo <= 0) return;
    if (kit?.fire1) { if (kit.fire1(this, u) === false) return; } else this.shootDefault(u, w);
    if (w.ammo && !u.st.overdrive) u.ammo--;
    u.fireT = 1 / w.rate;
    if (u.invuln > 0 && u.isPlayer) u.invuln = Math.min(u.invuln, 0.3);
  }
  spread(dir, deg, rand = this.rand) {
    if (deg <= 0) return dir;
    const a = rand() * TAU, r = Math.sqrt(rand()) * deg * Math.PI / 180, up = Math.abs(dir[1]) > 0.99 ? [1, 0, 0] : [0, 1, 0];
    const rt = v3.norm(v3.cross(dir, up)), u2 = v3.cross(rt, dir);
    return v3.norm([dir[0] + (rt[0] * Math.cos(a) + u2[0] * Math.sin(a)) * r, dir[1] + (rt[1] * Math.cos(a) + u2[1] * Math.sin(a)) * r, dir[2] + (rt[2] * Math.cos(a) + u2[2] * Math.sin(a)) * r]);
  }
  falloff(w, d) { if (!w.falloff) return 1; const [a, b, m] = w.falloff; return d <= a ? 1 : d >= b ? m : 1 - (1 - m) * (d - a) / (b - a); }
  shootDefault(u, w) {
    const o = this.eye(u), base = this.aimDir(u), moveSpread = u.moving > 1 ? 1 : 0.6;
    const mz = this.muzzle(u);
    for (let i = 0; i < (w.pellets || 1); i++) {
      let dir = this.spread(base, w.spread * moveSpread);
      if (u.st.overdrive) dir = this.assist(u, dir);
      const hit = this.trace(o, dir, w.range, { team: u.team, skip: u });
      this.bulletHit(u, w, hit, o);
      if (i < 3 || this.rand() < 0.25) this.emit({ type: 'tracer', from: mz, to: hit.point, color: w.tracer, hit: hit.kind, unit: u });
    }
    this.emit({ type: 'shot', unit: u, sound: w.sound });
  }
  bulletHit(u, w, hit, origin) {
    if (hit.kind === 'unit') {
      const d = v3.dist(origin, hit.point);
      let dmg = w.dmg * this.falloff(w, d) * (hit.head ? (w.head || 1) : 1);
      this.damage(hit.unit, dmg, u, { head: hit.head, point: hit.point });
    } else if (hit.kind === 'barrier') this.hitBarrier(hit.unit, w.dmg * (w.pellets ? 0.6 : 1), u, hit.point);
    else if (hit.kind === 'world') this.emit({ type: 'impact', point: hit.point, normal: hit.normal, color: w.tracer });
  }
  hitBarrier(owner, amt, src, point) {
    const b = owner.s.barrier; if (!b) return;
    b.hp -= amt * this.multOut(src); b.regenT = 2.5;
    if (src) { src.stats.dmg += amt; this.chargeUlt(src, amt * 0.2); }
    this.emit({ type: 'barrierHit', unit: owner, point });
    if (b.hp <= 0) { b.up = false; b.broken = 6; b.hp = 0; this.emit({ type: 'barrierBreak', unit: owner }); }
  }
  assist(u, dir) { // Overdrive: bend shots toward the enemy nearest the crosshair
    const o = this.eye(u); let best = null, bd = 0.22;
    for (const e of this.enemies(u)) {
      const c = [e.pos[0], e.pos[1] + e.def.height * 0.7, e.pos[2]], d = v3.norm(v3.sub(c, o)), ang = Math.acos(clamp(v3.dot(d, dir), -1, 1));
      if (ang < bd && this.los(o, c)) { bd = ang; best = d; }
    }
    return best || dir;
  }

  // ---------------------------------------------------------------- deployables
  stepDeploy(u, dt) {
    const d = u.deploy; d.t -= dt;
    if (d.t <= 0 || !d.owner.alive && d.kind === 'sentry' && false) { u.alive = false; this.units.splice(this.units.indexOf(u), 1); this.emit({ type: 'destroy', unit: u, quiet: true }); return; }
    if (d.kind === 'pylon') {
      this.area(u.pos, 6, (a) => { if (!a.deploy) this.heal(a, 35 * dt, d.owner); }, { alliesOf: u.team, los: true });
    } else if (d.kind === 'sentry') {
      d.fireT = (d.fireT || 0) - dt;
      let tgt = d.target;
      if (!tgt || !tgt.alive || v3.dist2d(tgt.pos, u.pos) > 28 || !this.los(this.sentryEye(u), this.center(tgt))) {
        tgt = null; let bd = 28;
        for (const e of this.enemies(u)) { const dd = v3.dist2d(e.pos, u.pos); if (dd < bd && !e.deploy && this.los(this.sentryEye(u), this.center(e))) { bd = dd; tgt = e; } }
        d.target = tgt;
      }
      if (tgt) {
        const eye = this.sentryEye(u), c = this.center(tgt), want = Math.atan2(c[0] - eye[0], c[2] - eye[2]);
        let diff = want - u.yaw; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); u.yaw += clamp(diff, -dt * 7, dt * 7);
        if (Math.abs(diff) < 0.2 && d.fireT <= 0) {
          d.fireT = 1 / 7;
          const dir = this.spread(v3.norm(v3.sub(c, eye)), 2.2), hit = this.trace(eye, dir, 30, { team: u.team, skip: u });
          if (hit.kind === 'unit') this.damage(hit.unit, 12, d.owner, { head: hit.head, point: hit.point, kind: 'sentry' });
          else if (hit.kind === 'barrier') this.hitBarrier(hit.unit, 12, d.owner, hit.point);
          this.emit({ type: 'tracer', from: [eye[0] + Math.sin(u.yaw) * 0.5, eye[1], eye[2] + Math.cos(u.yaw) * 0.5], to: hit.point, color: '#ffe14d', hit: hit.kind });
          this.emit({ type: 'shot', unit: u, sound: 'sentry' });
        }
      }
    }
    // settle on the floor
    const g = this.groundAt(u.pos[0], u.pos[2], u.pos[1] + 0.1, 0.3); u.pos[1] = g;
  }
  sentryEye(u) { return [u.pos[0], u.pos[1] + 1.0, u.pos[2]]; }

  // ---------------------------------------------------------------- zones, cores, packs
  stepZones(dt) {
    for (const z of this.zones) {
      z.age += dt; z.t -= dt;
      if (z.update) z.update(this, z, dt);
    }
    this.zones = this.zones.filter((z) => z.t > 0 || (z.onEnd && (z.onEnd(this, z), false)));
    for (const c of this.cores) {
      c.t -= dt;
      for (const u of this.units) if (u.alive && !u.deploy && u.team === c.team && Math.abs(u.pos[1] - c.y0 + 0.6) < 2 && v3.dist2d(u.pos, c.pos) < 1.5 && c.t > 0) {
        c.t = 0; this.chargeUlt(u, u.def.ult.cost * 0.12); this.heal(u, 40, null); this.emit({ type: 'core', unit: u, pos: c.pos }); break;
      }
    }
    this.cores = this.cores.filter((c) => c.t > 0);
    this.corpses = this.corpses.filter((c) => (c.t -= dt) > 0 && !c.unit.alive);
    for (const p of this.packs) {
      if (!p.ready) { p.t -= dt; if (p.t <= 0) p.ready = true; continue; }
      for (const u of this.units) if (u.alive && !u.deploy && u.hp < u.maxHp && v3.dist2d(u.pos, p.pos) < 1.4 && Math.abs(u.pos[1] - p.pos[1]) < 1.5) {
        this.heal(u, p.big ? 250 : 75, null); p.ready = false; p.t = p.big ? 14 : 9; this.emit({ type: 'pack', unit: u, pos: p.pos }); break;
      }
    }
  }

  // ---------------------------------------------------------------- payload and the round
  payloadPoint(d) { return [PATH[0][0], 0, PATH[0][1] + clamp(d, 0, PATH_LEN)]; }
  stepPayload(dt) {
    const P = this.payload; let a = 0, df = 0;
    for (const u of this.units) {
      if (!u.alive || u.deploy) continue;
      if (v3.dist2d(u.pos, P.pos) < PAYLOAD_RADIUS && Math.abs(u.pos[1] - P.pos[1]) < 3.5) { if (u.team === 0) a++; else df++; }
    }
    P.pushers = a; P.defenders = df; P.contested = a > 0 && df > 0;
    P.speed = 0;
    if (a > 0 && df === 0 && this.state === 'live') {
      P.speed = (1.4 + 0.4 * (Math.min(a, 3) - 1)) * (this.mutator?.id === 'blizzard' ? 1.3 : 1);
      P.dist += P.speed * dt; P.idle = 0;
      // heal pulse for those pushing, a small reward the way checkpoints reward
    } else P.idle += dt;
    P.pos = this.payloadPoint(P.dist);
    const cp = CHECKPOINTS[P.cp];
    if (cp !== undefined && P.dist >= cp && cp < PATH_LEN) { P.cp++; this.timer += CP_BONUS; this.inOvertime = false; this.emit({ type: 'checkpoint', n: P.cp, bonus: CP_BONUS }); }
    if (P.dist >= PATH_LEN - 0.01) this.finish(0, 'The payload reached its destination');
  }
  finish(team, why) { if (this.state === 'over') return; this.state = 'over'; this.winner = team; this.why = why; this.emit({ type: 'over', winner: team, why }); }

  step(dt) {
    dt = Math.min(dt, 0.05); this.time += dt; this.events.length = 0;
    if (this.state === 'setup') {
      this.setupT -= dt;
      if (this.setupT <= 0 || this.readyUp) { this.state = 'live'; this.emit({ type: 'live' }); }
    } else if (this.state === 'live') {
      if (!this.inOvertime) { this.timer -= dt; if (this.timer <= 0) { this.timer = 0; if (this.payload.pushers > 0 || this.payload.contested) { this.inOvertime = true; this.overtime = OT_TIME; this.emit({ type: 'overtime' }); } else this.finish(1, 'Time ran out'); } }
      else {
        this.overtime -= this.payload.pushers > 0 ? (this.payload.defenders ? 0.5 : -1.5) * dt : dt * 1.4;
        this.overtime = Math.min(this.overtime, OT_TIME);
        if (this.payload.speed > 0 || this.timer > 0) { if (this.timer > 0) this.inOvertime = false; }
        if (this.overtime <= 0) this.finish(1, 'Overtime expired');
      }
      this.stepMutators(dt);
    }
    this._paths = 0;
    for (const u of this.units) if (u.bot) u.bot.update(dt);
    for (const u of [...this.units]) this.stepUnit(u, dt);
    for (const p of this.projs) if (!p.dead) this.stepProj(p, dt);
    this.projs = this.projs.filter((p) => !p.dead);
    this.stepZones(dt);
    if (this.state !== 'over') this.stepPayload(dt);
    if (this.state === 'over') { this.overT = (this.overT || 0) + dt; }
  }
  stepMutators(dt) {
    if (!this.useMutators) return;
    if (this.mutator) { this.mutator.t -= dt; if (this.mutator.t <= 0) { this.emit({ type: 'mutatorEnd', id: this.mutator.id }); this.mutator = null; this.nextMutator = 60 + this.rand() * 40; } }
    else { this.nextMutator -= dt; if (this.nextMutator <= 0) { const id = this.rand.pick(Object.keys(MUTATORS)); this.mutator = { id, t: 28 }; this.emit({ type: 'mutator', id }); } }
  }
  total() { return PATH_LEN; }
}
export { findPath };
