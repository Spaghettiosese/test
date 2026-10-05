// The simulation container: owns the world, every actor, devices and projectiles, resolves
// bullets (with penetration), explosions and noise, and steps doors. It never touches WebGL,
// so whole matches can run headless in Node for tests and AI tuning.
import { buildMap } from '../world/mapbuild.js';
import { MATS, WALL_T } from '../world/grid.js';
import { Nav } from './nav.js';
import { Actor } from './actor.js';
import { Devices } from './devices.js';
import { Round } from './round.js';
import { clamp, dirOf, dist3, norm, rng, add, scl } from './util.js';

export class Sim {
  constructor(def, opts = {}) {
    this.map = buildMap(def); this.world = this.map.world; this.nav = new Nav(this.world);
    this.opts = opts; this.seed = opts.seed ?? 1; this.rand = rng(this.seed);
    this.actors = []; this.time = 0; this.listeners = new Map(); this.noises = []; this.noiseSeq = 0;
    this.friendlyFire = opts.friendlyFire ?? false; this.downEnabled = opts.down ?? true; this.godmode = false;
    this.difficulty = opts.difficulty ?? 2; // 0 recruit .. 4 elite
    this.devices = new Devices(this);
    this.round = new Round(this, opts);
    this.stats = { bullets: 0, penetrations: 0 };
    this.world.on('break', (e) => this.onBreak(e));
    this.directors = []; this.worldVer = 0; this.pathBudget = 4;
    this.on('hurt', (e) => { if (e.actor.ai) e.actor.ai.onHurt(e.src, e.from); });
    this.on('door', () => { this.worldVer++; });
    this.on('barricade', () => { this.worldVer++; });
  }
  // ------------------------------------------------------------------ events
  on(type, fn) { if (!this.listeners.has(type)) this.listeners.set(type, new Set()); this.listeners.get(type).add(fn); return () => this.listeners.get(type).delete(fn); }
  emit(type, data) { const l = this.listeners.get(type); if (l) for (const fn of l) fn(data); }
  byId(id) { return this.actors.find((a) => a.id === id); }
  team(t) { return this.actors.filter((a) => a.team === t); }
  alive(t) { return this.actors.filter((a) => a.team === t && a.alive); }
  enemiesOf(a) { return this.actors.filter((o) => o.team !== a.team && (o.alive)); }

  addActor(o) { const a = new Actor(this, o); this.actors.push(a); this.emit('spawn', { actor: a }); return a; }

  // ------------------------------------------------------------------ frame
  update(dt) {
    dt = Math.min(dt, 0.05); this.time += dt; this.pathBudget = 4;
    const idle = this.passive;
    for (const d of this.directors) if (!(idle && idle[d.team])) d.update(dt);
    for (const a of this.actors) { if (a.ai && (a.alive || a.downed) && !(idle && idle[a.team])) a.ai.think(dt); }
    for (const a of this.actors) a.update(dt);
    this.updateDoors(dt);
    this.devices.update(dt);
    this.round.update(dt);
    // forget old noises
    while (this.noises.length && this.time - this.noises[0].t > 3) this.noises.shift();
  }
  updateDoors(dt) {
    for (const d of this.world.doors) {
      if (d.dead) continue;
      const was = d.open >= 0.55;
      d.open += clamp(d.target - d.open, -dt * 3.2, dt * 3.2);
      const now = d.open >= 0.55;
      if (was !== now) this.emit('door', { door: d, open: now });
    }
  }
  onBreak(e) {
    const c = e.panel ? this.world.panelCenter(e.panel) : [0, 0, 0];
    if (e.panel && e.panel.kind === 'glass') this.noise(c, 14, 'glass', e.src?.actor);
    else if (e.panel) this.noise(c, e.panel.mat === 'metal' ? 26 : 30, 'break', e.src?.actor);
    this.worldVer++; this.emit('panelbreak', e);
  }

  // ------------------------------------------------------------------ noise (heard by the AI and the audio)
  noise(pos, loud, kind, src) {
    const n = { pos: [pos[0], pos[1], pos[2]], loud, kind, src: src || null, t: this.time, id: ++this.noiseSeq, team: src ? src.team : null };
    this.noises.push(n); this.emit('sound', n); return n;
  }

  // ------------------------------------------------------------------ shooting
  fire(a, g, delayed = false) {
    const def = g.def;
    if (!delayed) { g.mag--; g.cd = 60 / def.rpm; }
    a.stats.shots++; a.lastShotT = this.time;
    const speed = Math.hypot(a.vel[0], a.vel[2]);
    let cone = def.spread + (def.ads - def.spread) * a.ads + Math.min(0.03, a.bloom) + speed * 0.0045;
    if (a.stance === 1) cone *= 0.8; else if (a.stance === 2) cone *= 0.6;
    if (a.status.blind > 0) cone += 0.08;
    if (a.status.shock > 0) cone += 0.05;
    if (!a.grounded) cone += 0.05;
    a.bloom += def.rpm > 500 ? 0.0035 : 0.01;
    const origin = a.eye(), kick = def.kick * (a.ads > 0.5 ? def.kickAds / def.kick : 1);
    a.kick[0] += kick * 0.0175 * (a.isPlayer ? 0 : 0.7); a.kick[1] += (this.rand() - 0.5) * kick * 0.012 * (a.isPlayer ? 0 : 1);
    const base = dirOf(a.yaw + a.kick[1], a.pitch + a.kick[0]);
    const up = [0, 1, 0], right = norm([base[2], 0, -base[0]]), upv = norm([right[1] * base[2] - right[2] * base[1], right[2] * base[0] - right[0] * base[2], right[0] * base[1] - right[1] * base[0]]);
    void up;
    const muzzle = add(add(origin, scl(base, 0.55)), [0, -0.07, 0]);
    for (let i = 0; i < def.pellets; i++) {
      const ang = this.rand() * Math.PI * 2, r = Math.sqrt(this.rand()) * cone;
      const dir = norm([base[0] + (right[0] * Math.cos(ang) + upv[0] * Math.sin(ang)) * r, base[1] + (right[1] * Math.cos(ang) + upv[1] * Math.sin(ang)) * r, base[2] + (right[2] * Math.cos(ang) + upv[2] * Math.sin(ang)) * r]);
      this.bullet(a, origin, dir, def, { pellet: def.pellets > 1, muzzle });
    }
    this.emit('shot', { actor: a, gun: g, origin, muzzle, dir: base, kick });
    const loud = def.cls === 'SR' ? 95 : def.cls === 'SG' ? 70 : def.cls === 'HG' ? 55 : def.cls === 'AR' ? 62 : def.cls === 'DMR' ? 75 : 50;
    this.noise(origin, a.suppressed ? loud * 0.3 : loud, 'shot', a);
  }
  // trace one bullet (or pellet) through the world: walls take damage and may let it through
  bullet(shooter, o0, d, def, { pellet = false, muzzle = null } = {}) {
    const w = this.world;
    let o = [...o0], energy = 1, travelled = 0, hitSomeone = false;
    this.stats.bullets++;
    let tracerEnd = null;
    for (let seg = 0; seg < 7 && energy > 0.12; seg++) {
      const maxT = Math.max(2, 140 - travelled);
      const h = w.cast(o[0], o[1], o[2], d[0], d[1], d[2], maxT, 0);
      let wallT = h ? h.t : maxT; const hp = h ? { x: h.x, y: h.y, z: h.z, nx: h.nx, ny: h.ny, nz: h.nz, panel: h.panel, prop: h.prop, t: h.t } : null;
      // nearest actor along the same stretch
      let ah = null, at = wallT;
      for (const a of this.actors) {
        if (a === shooter || !(a.alive || a.downed)) continue;
        if (a.team === shooter.team && !this.friendlyFire) continue;
        if (a.mode === 'drone') continue;
        const r = a.hitTest(o, d, at);
        if (r && r.t < at) { ah = { a, r }; at = r.t; }
      }
      // devices (cameras, drones, shields) can be shot too
      const dh = this.devices.rayHit(o, d, at, shooter);
      if (dh && dh.t < at) { ah = null; at = dh.t; this.devices.shotAt(dh.dev, def, shooter, energy); const p = [o[0] + d[0] * dh.t, o[1] + d[1] * dh.t, o[2] + d[2] * dh.t]; this.emit('impact', { pos: p, normal: [-d[0], -d[1], -d[2]], kind: 'device', shooter }); if (dh.block) { tracerEnd = p; break; } }
      if (ah) {
        const A = ah.a, p = [o[0] + d[0] * ah.r.t, o[1] + d[1] * ah.r.t, o[2] + d[2] * ah.r.t];
        tracerEnd = p;
        // frontal ballistic shield
        if (A.shield && A.shield.up && A.alive) {
          const f = A.fwd, dd = d[0] * f[0] + d[2] * f[2];
          if (dd < -0.35 && p[1] - A.pos[1] > 0.15) { this.emit('impact', { pos: p, normal: [-d[0], 0, -d[2]], kind: 'shield', shooter, target: A }); energy = 0; break; }
        }
        const dist = travelled + ah.r.t, fall = 1 - def.falloff * clamp((dist - def.range * 0.45) / (def.range * 1.4), 0, 1);
        const dmg = def.dmg * fall * (0.55 + 0.45 * energy);
        const was = A.hp, before = A.state;
        A.hurt(dmg, { src: shooter, region: ah.r.region, wpn: def, pellet, from: shooter.pos });
        shooter.stats.hits += hitSomeone ? 0 : 1; hitSomeone = true;
        this.emit('hit', { shooter, target: A, region: ah.r.region, dmg: was - A.hp, killed: before !== 'dead' && A.state === 'dead', down: before === 'alive' && A.state === 'downed', pos: p, normal: [-d[0], -d[1], -d[2]], headshot: ah.r.region === 'head' });
        this.noise(p, 8, 'hit', shooter);
        break;
      }
      if (!hp) { tracerEnd = [o[0] + d[0] * maxT, o[1] + d[1] * maxT, o[2] + d[2] * maxT]; break; }
      const p = [hp.x, hp.y, hp.z], n = [hp.nx, hp.ny, hp.nz];
      tracerEnd = p;
      let absorb = 99, kind = 'wall', mat = 'concrete';
      if (hp.panel) {
        const pn = hp.panel;
        mat = pn.reinforced ? 'steel' : pn.mat;
        if (pn.kind === 'glass') { w.damage(pn, 999, { actor: shooter }); kind = 'glass'; absorb = 0.05; this.noise(p, 10, 'glass', shooter); }
        else {
          const m = MATS[pn.reinforced ? 'steel' : pn.mat];
          absorb = pn.reinforced ? 99 : m.absorb; kind = 'wall';
          if (pn.dest) w.damage(pn, def.wallDmg * energy * (pn.soft ? 1 : 0.2) * (pn.reinforced ? 0.1 : 1), { actor: shooter });
          if (pn.door || pn.barricade) absorb = Math.min(absorb, 0.6);
        }
      } else if (hp.prop) { absorb = hp.prop.absorb ?? 1; kind = 'prop'; mat = hp.prop.kind; this.devices.propShot(hp.prop, def, shooter); }
      this.emit('impact', { pos: p, normal: n, kind, mat, panel: hp.panel, prop: hp.prop, shooter, energy, pellet });
      if (absorb >= 90) break;
      const loss = absorb * (1.1 - def.pen) * (kind === 'glass' ? 0.1 : 1);
      energy -= loss; if (energy <= 0.12) break;
      this.stats.penetrations++;
      // exit the thin slab and carry on
      const adv = (hp.panel ? WALL_T + 0.06 : 0.12);
      o = [p[0] + d[0] * adv, p[1] + d[1] * adv, p[2] + d[2] * adv]; travelled += hp.t + adv;
    }
    if (tracerEnd) this.emit('tracer', { from: muzzle || o0, to: tracerEnd, shooter, def });
  }

  // ------------------------------------------------------------------ explosions
  explode(pos, o = {}) {
    const { radius = 5, dmg = 120, power = 220, hard = false, src = null, kind = 'frag', walls = true } = o;
    const w = this.world;
    this.emit('explosion', { pos, radius, kind, hard, src });
    this.noise(pos, 85, 'explosion', src);
    if (walls) w.blast(pos[0], pos[1], pos[2], radius * (kind === 'breach' ? 0.7 : 0.9), power, { hard, src: { actor: src } });
    for (const a of this.actors) {
      if (!a.alive && !a.downed) continue;
      const c = a.chestPos(), d = dist3(pos, c);
      if (d > radius) continue;
      const dir = norm([c[0] - pos[0], c[1] - pos[1], c[2] - pos[2]]);
      const h = d > 0.6 ? w.cast(pos[0], pos[1], pos[2], dir[0], dir[1], dir[2], d - 0.3, 1) : null;
      if (h) continue; // a wall stands between
      const f = 1 - d / radius;
      if (kind === 'flash' || kind === 'stun') continue;
      if (a.team === (src && src.team) && !this.friendlyFire && a !== src) continue;
      a.hurt(dmg * f * f * 1.4, { src, region: 'torso', explosion: true, ignoreArmor: false, from: pos });
      a.applyStatus('stun', 1.5 * f);
      if (a.alive) a.vel = [a.vel[0] + dir[0] * 4 * f, a.vel[1] + 1.5 * f, a.vel[2] + dir[2] * 4 * f];
    }
    this.devices.blast(pos, radius, kind, src);
  }
}
