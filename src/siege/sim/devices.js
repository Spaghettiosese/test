// Gadgets in play: placed devices (charges, traps, cameras, turrets, shields...), thrown
// grenades, projectiles, drones, and the actions that use them (hammer swings, torches).
// Everything is simulation logic; the view draws devices from `kind` and `state`.
import { GADGETS } from '../data/gadgets.js';
import { MATS, STOREY, CAST } from '../world/grid.js';
import { clamp, dirOf, dist3, norm, raySphere, scl, add, sub, dot, len } from './util.js';

let DEV_ID = 1;
export class Device {
  constructor(o) {
    Object.assign(this, { id: DEV_ID++, kind: 'x', owner: null, team: 'atk', pos: [0, 0, 0], n: [0, 1, 0], panel: null, hp: 30, age: 0, armed: false, active: true, jammed: 0, dead: false, data: {}, radius: 0.22 }, o);
    this.maxHp = this.hp;
  }
}

// how each device is mounted: floor | wall | any | window | door | hatch
const MOUNT = {
  thermite: 'wall', breach: 'wallhatch', cluster: 'wallhatch', claymore: 'any', edd: 'wall', mat: 'floor', barbwire: 'floor', jammer: 'any', cams: 'wall', dshield: 'floor', turret: 'floor',
  shockwire: 'wall', mines: 'floor', healstation: 'floor', alarm: 'any', armorpanel: 'opening', shockdrone: 'floor', armorpack: 'floor',
};
const HP = { thermite: 25, breach: 20, cluster: 20, claymore: 25, edd: 20, mat: 40, barbwire: 40, jammer: 40, cams: 22, dshield: 140, turret: 70, shockwire: 40, mines: 25, healstation: 30, alarm: 20, armorpanel: 700, shockdrone: 30, armorpack: 10 };

export class Devices {
  constructor(sim) { this.sim = sim; this.list = []; this.proj = []; this.fire = []; this.gas = []; this.drones = []; this.flashes = []; }
  get world() { return this.sim.world; }
  of(team, kind) { return this.list.filter((d) => !d.dead && (!team || d.team === team) && (!kind || d.kind === kind)); }

  // ------------------------------------------------------------------ using a gadget (player and AI both land here)
  // `use` throws, places at the look target, fires darts, swings, or toggles an item.
  use(a, id, opts = {}) {
    const g = a.gadget(id), def = GADGETS[id]; if (!def) return { ok: false, msg: 'Unknown gadget' };
    if (g && g.count <= 0 && def.count > 0) return { ok: false, msg: 'Out of ' + def.name };
    switch (def.family) {
      case 'throw': return this.throwIt(a, id, opts);
      case 'device': return this.placeLooking(a, id, opts);
      case 'melee': return this.melee(a);
      case 'dart': return this.dart(a, id);
      default: return { ok: false, msg: def.name };
    }
  }
  consume(a, id) { const g = a.gadget(id); if (g) g.count = Math.max(0, g.count - 1); }

  // ------------------------------------------------------------------ throwables
  throwIt(a, id, opts = {}) {
    const o = a.eye(), d = opts.dir || a.look(), sp = opts.speed ?? 11;
    const kind = { frag: 'frag', stun: 'stun', bangs: 'stun', smoke: 'smoke', cinders: 'smoke', impact: 'impact', sonar: 'sonar', nitro: 'nitro' }[id] || id;
    this.proj.push({ kind, owner: a, team: a.team, pos: add(o, scl(d, 0.5)), vel: [d[0] * sp + a.vel[0] * 0.5, d[1] * sp + 2.2 + a.vel[1] * 0.3, d[2] * sp + a.vel[2] * 0.5], fuse: { frag: 2.6, stun: 1.8, smoke: 1.2, impact: 9, sonar: 1.5, nitro: 99 }[kind] || 2, t: 0, stuck: false, id: DEV_ID++, bounces: 0 });
    this.consume(a, id); this.sim.emit('throw', { actor: a, kind }); this.sim.noise(o, 8, 'throw', a);
    return { ok: true };
  }
  updateProj(dt) {
    const w = this.world;
    for (const p of this.proj) {
      if (p.dead) continue;
      p.t += dt; p.fuse -= dt;
      if (!p.stuck) {
        p.vel[1] -= 9.81 * dt;
        const sp = len(p.vel) * dt;
        if (sp > 0) {
          const dir = scl(p.vel, 1 / (sp / dt)), h = w.cast(p.pos[0], p.pos[1], p.pos[2], dir[0], dir[1], dir[2], sp + 0.05, 0);
          if (h && h.t <= sp + 0.05) {
            const n = [h.nx, h.ny, h.nz], vn = dot(p.vel, n);
            if (p.kind === 'impact') { this.detonate(p); continue; }
            if (p.kind === 'nitro' || p.kind === 'launcher' || p.kind === 'xpellet' || p.kind === 'stickyfrag') {
              p.stuck = true; p.pos = [h.x + n[0] * 0.04, h.y + n[1] * 0.04, h.z + n[2] * 0.04]; p.n = n; p.panel = h.panel; p.vel = [0, 0, 0];
              if (p.kind === 'launcher') p.fuse = p.data?.delay ?? 1.4; if (p.kind === 'xpellet') p.fuse = 2.2;
              this.sim.emit('stick', { proj: p }); continue;
            }
            p.pos = [h.x + n[0] * 0.05, h.y + n[1] * 0.05, h.z + n[2] * 0.05];
            p.vel = [p.vel[0] - n[0] * vn * 1.38, p.vel[1] - n[1] * vn * 1.38, p.vel[2] - n[2] * vn * 1.38];
            p.vel = scl(p.vel, n[1] > 0.5 ? 0.62 : 0.78); p.bounces++;
            if (Math.hypot(p.vel[0], p.vel[1], p.vel[2]) < 1.2 && n[1] > 0.5) p.vel = [0, 0, 0];
            if (p.bounces < 5 && Math.abs(vn) > 1.5) this.sim.emit('bounce', { proj: p });
          } else p.pos = add(p.pos, scl(p.vel, dt));
        }
      }
      if (p.panel && p.panel.dead) { p.stuck = false; p.vel = [0, -0.5, 0]; p.panel = null; }
      if (p.kind !== 'nitro' && p.fuse <= 0) this.detonate(p);
    }
    this.proj = this.proj.filter((p) => !p.dead);
  }
  detonate(p) {
    if (p.dead) return; p.dead = true;
    const s = this.sim, o = p.owner;
    switch (p.kind) {
      case 'frag': s.explode(p.pos, { radius: 4.6, dmg: 150, power: 140, src: o, kind: 'frag' }); break;
      case 'impact': s.explode(p.pos, { radius: 3.2, dmg: 90, power: 320, src: o, kind: 'impact' }); break;
      case 'nitro': s.explode(p.pos, { radius: 4.2, dmg: 190, power: 650, src: o, kind: 'nitro' }); break;
      case 'launcher': s.explode(p.pos, { radius: 2.8, dmg: 30, power: 520, src: o, kind: 'breach' }); break;
      case 'xpellet': this.burnPanel(p, o); break;
      case 'stun': this.flash(p.pos, o, 14, true); s.emit('flashbang', { pos: p.pos }); s.noise(p.pos, 90, 'explosion', o); break;
      case 'smoke': this.world.smoke.push({ x: p.pos[0], y: p.pos[1] + 0.8, z: p.pos[2], r: 3.1, t: 13, density: 1, max: 13 }); s.emit('smoke', { pos: p.pos }); s.noise(p.pos, 20, 'throw', o); break;
      case 'sonar': this.sonar(p.pos, o); break;
      default: break;
    }
  }
  // a pellet burns a one-panel hole in a reinforced wall
  burnPanel(p, o) {
    if (!p.panel || p.panel.dead) return;
    const pn = p.panel; pn.reinforced = false; this.world.breakPanel(pn, { actor: o });
    this.sim.emit('burn', { pos: p.pos }); this.sim.noise(p.pos, 18, 'burn', o);
  }
  flash(pos, src, radius, slow) {
    const w = this.world;
    for (const a of this.sim.actors) {
      if (!a.alive && !a.downed) continue;
      const head = a.headPos(), d = dist3(pos, head);
      if (d > radius) continue;
      const dir = norm(sub(pos, head));
      const blocked = d > 0.4 && w.cast(head[0], head[1], head[2], dir[0], dir[1], dir[2], d - 0.2, CAST.GLASS | CAST.PROPS);
      const f = a.fwd, facing = clamp(f[0] * dir[0] + f[2] * dir[2], -1, 1);
      const k = 1 - d / radius;
      if (!blocked) { a.applyStatus('blind', (1.2 + 3.6 * k) * (0.45 + 0.55 * (facing * 0.5 + 0.5))); a.applyStatus('stun', 2.5 * k); }
      a.applyStatus('deaf', 3 + 4 * k); if (slow) a.applyStatus('slow', 3 * k);
    }
    this.flashes.push({ pos, t: 0.4 });
  }
  sonar(pos, src) {
    for (const a of this.sim.actors) {
      if (a.team === src.team || !a.alive) continue;
      if (dist3(pos, a.pos) < 14) a.applyStatus('tag', 5);
    }
    this.sim.emit('sonar', { pos });
  }

  // ------------------------------------------------------------------ darts (launcher, X-pellets, stim)
  dart(a, id) {
    const o = a.eye(), d = a.look();
    if (id === 'stimpistol') {
      const h = this.sim.world.cast(o[0], o[1], o[2], d[0], d[1], d[2], 14, CAST.GLASS);
      let best = null, bt = h ? h.t : 14;
      for (const t of this.sim.actors) {
        if (t === a || t.team !== a.team || !(t.alive || t.downed)) continue;
        const r = t.hitTest(o, d, bt); if (r && r.t < bt) { best = t; bt = r.t; }
      }
      if (!best && !opts_selfHeal(a)) return { ok: false, msg: 'No teammate in sight' };
      const tgt = best || a;
      this.consume(a, id);
      tgt.applyStatus('heal', 2.2); tgt.armorPlates = Math.max(tgt.armorPlates, 1);
      if (tgt.downed) tgt.revive(a);
      this.sim.emit('stim', { actor: a, target: tgt });
      return { ok: true };
    }
    const kind = id === 'launcher' ? 'launcher' : 'xpellet';
    this.proj.push({ kind, owner: a, team: a.team, pos: add(o, scl(d, 0.6)), vel: scl(d, 28), fuse: 99, t: 0, stuck: false, id: DEV_ID++, bounces: 0, data: {} });
    this.consume(a, id); this.sim.emit('throw', { actor: a, kind }); this.sim.noise(o, 35, 'shot', a);
    return { ok: true };
  }

  // ------------------------------------------------------------------ melee
  melee(a, o2 = {}) {
    const w = this.world, o = a.eye(), d = a.look(), reach = 2.1;
    const hammer = a.op.ability === 'hammer' || o2.hammer;
    this.sim.noise(a.pos, 14, 'melee', a);
    let hitT = reach, targetActor = null, region = 'torso';
    for (const t of this.sim.actors) {
      if (t === a || t.team === a.team || !(t.alive || t.downed)) continue;
      const r = t.hitTest(o, d, hitT); if (r && r.t < hitT) { hitT = r.t; targetActor = t; region = r.region; }
    }
    const h = w.cast(o[0], o[1], o[2], d[0], d[1], d[2], hitT + 0.01, CAST.GLASS);
    const wallHit = h && h.t < hitT + 0.01 ? { panel: h.panel, prop: h.prop, pt: [h.x, h.y, h.z], t: h.t } : null;
    if (targetActor && (!wallHit || wallHit.t >= hitT)) {
      const p = [o[0] + d[0] * hitT, o[1] + d[1] * hitT, o[2] + d[2] * hitT];
      if (targetActor.shield && targetActor.shield.up) { this.sim.emit('impact', { pos: p, kind: 'shield', normal: [0, 0, 0] }); if (hammer) { targetActor.shield.up = false; targetActor.shield.cd = 2.5; } return { ok: true }; }
      targetActor.hurt(region === 'head' ? 999 : hammer ? 95 : 60, { src: a, region, wpn: { melee: true }, from: a.pos, fatal: false });
      this.sim.emit('hit', { shooter: a, target: targetActor, region, dmg: 60, killed: targetActor.dead, pos: p, melee: true });
      return { ok: true };
    }
    if (wallHit) {
      if (wallHit.panel) {
        const pn = wallHit.panel;
        if (hammer && pn.soft && pn.dest && pn.kind !== 'door') {
          const hole = w.holeFor(pn, wallHit.pt, 2, 2);
          pn.hp -= 1000; for (const q of hole) w.damage(q, 1000, { actor: a, melee: true });
          a.stats.breached += hole.length; this.sim.emit('swing', { actor: a, hit: true, pos: wallHit.pt, soft: true });
        } else if (pn.door || pn.kind === 'glass') { w.damage(pn, pn.kind === 'glass' ? 99 : hammer ? 120 : 40, { actor: a, melee: true }); this.sim.emit('swing', { actor: a, hit: true, pos: wallHit.pt, soft: true }); }
        else { w.damage(pn, hammer ? 70 : 10, { actor: a, melee: true }); this.sim.emit('swing', { actor: a, hit: true, pos: wallHit.pt, soft: false }); }
        return { ok: true };
      }
      if (wallHit.prop && wallHit.prop.dev) { this.damageDevice(wallHit.prop.dev, hammer ? 220 : 60, a); return { ok: true }; }
    }
    // melee swing at devices
    for (const dv of this.list) {
      if (dv.dead || dv.team === a.team) continue;
      const t = raySphere(o, d, dv.pos, dv.radius + 0.12); if (t !== null && t <= reach) { this.damageDevice(dv, hammer ? 220 : 60, a); return { ok: true }; }
    }
    this.sim.emit('swing', { actor: a, hit: false });
    return { ok: true };
  }

  // ------------------------------------------------------------------ placement
  placeLooking(a, id, opts = {}) {
    const o = a.eye(), d = opts.dir || a.look();
    const h = this.world.cast(o[0], o[1], o[2], d[0], d[1], d[2], 2.6, id === 'shockdrone' ? 0 : CAST.GLASS * 0);
    if (!h) return { ok: false, msg: 'Aim at a surface' };
    return this.placeAt(a, id, [h.x, h.y, h.z], [h.nx, h.ny, h.nz], h.panel, h.prop, opts);
  }
  placeAt(a, id, pos, n, panel, prop, opts = {}) {
    const mount = MOUNT[id] || 'any';
    const floor = n[1] > 0.7, wallN = Math.abs(n[1]) < 0.4, ceil = n[1] < -0.7;
    const p = [pos[0] + n[0] * 0.04, pos[1] + n[1] * 0.04, pos[2] + n[2] * 0.04];
    if (mount === 'floor' && !floor) return { ok: false, msg: 'Place on the floor' };
    if (mount === 'wall' && !(wallN && panel)) return { ok: false, msg: 'Place on a wall' };
    if (mount === 'wallhatch' && !panel) return { ok: false, msg: 'Place on a wall or hatch' };
    if (mount === 'any' && ceil) return { ok: false, msg: 'Not on the ceiling' };
    if (mount === 'opening') return this.armorPanel(a, pos, n, panel);
    if (id === 'thermite' && panel && !panel.reinforced) { /* thermite still burns a plain wall */ }
    if (id === 'cams' && !(panel)) return { ok: false, msg: 'Stick it to a wall or window' };
    if (id === 'shockwire' && !(panel && panel.reinforced)) { if (!(panel && panel.dest && !panel.perimeter)) return { ok: false, msg: 'Needs a wall' }; }
    if (this.list.filter((d) => !d.dead && d.owner === a && d.kind === id).length >= (GADGETS[id].count || 3) + 2) return { ok: false, msg: 'Too many placed' };
    const dev = new Device({ kind: id, owner: a, team: a.team, pos: p, n: [...n], panel: panel && panel.ax ? panel : null, hp: HP[id] || 25, data: { yaw: a.yaw }, active: true });
    if (id === 'shockwire' && panel) { for (const q of this.world.units.get(panel.unit) || [panel]) q.shock = true; dev.data.unit = panel.unit; }
    if (id === 'mat' || id === 'mines' || id === 'alarm' || id === 'claymore' || id === 'edd' || id === 'barbwire' || id === 'turret' || id === 'healstation' || id === 'jammer') dev.armed = true;
    if (id === 'edd') dev.data.ax = Math.abs(n[0]) > 0.5 ? 'z' : 'x';
    if (id === 'dshield' || id === 'barbwire') this.addProp(dev, id);
    if (id === 'turret') dev.data = { ...dev.data, aim: a.yaw, cd: 0, target: null };
    if (id === 'breach' || id === 'cluster') dev.data.hard = id === 'breach';
    if (id === 'shockdrone') { dev.data.vel = 0; }
    this.consume(a, id); this.list.push(dev);
    this.sim.emit('place', { device: dev, actor: a }); this.sim.noise(p, id === 'turret' ? 12 : 9, 'place', a);
    return { ok: true, device: dev };
  }
  addProp(dev, id) {
    const p = dev.pos, yaw = dev.data.yaw, f = [Math.sin(yaw), Math.cos(yaw)];
    if (id === 'dshield') {
      const wide = Math.abs(f[0]) > Math.abs(f[1]) ? [0.08, 1.05, 0.62] : [0.62, 1.05, 0.08];
      dev.prop = this.world.addProp({ min: [p[0] - wide[0], p[1], p[2] - wide[2]], max: [p[0] + wide[0], p[1] + wide[1], p[2] + wide[2]], kind: 'dshield', absorb: 99, cover: 'high', dev });
    } else if (id === 'barbwire') {
      dev.prop = this.world.addProp({ min: [p[0] - 0.5, p[1], p[2] - 0.5], max: [p[0] + 0.5, p[1] + 0.5, p[2] + 0.5], kind: 'wire', absorb: 0.05, cover: 'low', solid: false, walk: true, dev });
    }
  }
  // armor panel / barricade a door or window
  armorPanel(a, pos, n, panel) {
    const door = panel && panel.door, win = panel && panel.kind === 'glass';
    if (!door && !win) return { ok: false, msg: 'Aim at a door or window' };
    if (door && (door.barricade > 0)) return { ok: false, msg: 'Already barricaded' };
    this.barricade(panel, { armored: true, by: a });
    this.consume(a, 'armorpanel');
    return { ok: true };
  }
  barricade(panel, { armored = false, by = null } = {}) {
    const w = this.world;
    if (panel.door) {
      const d = panel.door; d.barricade = armored ? 3 : 2; d.barricadeHp = armored ? 900 : 260; d.armored = armored; d.target = 0;
      this.sim.emit('barricade', { door: d, armored, by });
      return true;
    }
    if (panel.kind === 'glass' || panel.kind === 'window') {
      const { ax, ix, iy, iz } = panel; w.remove(panel); panel.dead = true;
      const mat = armored ? 'metal' : 'wood';
      const np = w.put(ax, ix, iy, iz, new (panel.constructor)({ kind: 'barricade', mat, hp: armored ? 600 : 130, sa: armored ? 'wall:metal' : 'barricade', sb: armored ? 'wall:metal' : 'barricade', pair: panel.pair, f: panel.f, ext: panel.ext, nr: true, barricade: true, armor: armored }));
      this.sim.emit('barricade', { panel: np, armored, by }); this.sim.emit('panelchange', { panel: np });
      return true;
    }
    return false;
  }

  // ------------------------------------------------------------------ damage
  damageDevice(d, amount, src) {
    if (d.dead) return;
    d.hp -= amount;
    if (d.kind === 'drone') { if (d.hp <= 0) this.killDrone(d, src); return; }
    if (d.hp <= 0) this.kill(d, src);
  }
  kill(d, src) {
    if (d.dead) return; d.dead = true;
    if (d.prop) this.world.removeProp(d.prop);
    if (d.kind === 'shockwire' && d.data.unit) for (const q of this.world.units.get(d.data.unit) || []) q.shock = false;
    this.sim.emit('devicekill', { device: d, src });
  }
  shotAt(d, def, shooter, energy) { this.damageDevice(d, def.dmg * energy * (def.pellets > 1 ? 0.3 : 1) * (d.kind === 'dshield' ? 0 : 1), shooter); }
  propShot(prop, def, shooter) { if (prop.dev && prop.dev.kind === 'dshield') this.damageDevice(prop.dev, def.dmg * 0.12 * (def.pellets > 1 ? 0.3 : 1), shooter); }
  blast(pos, radius, kind, src) {
    for (const d of this.list) {
      if (d.dead || d.kind === 'armorpanel') continue;
      const dd = dist3(pos, d.pos);
      if (dd < radius) { if (d.kind === 'thermite' && d.data.burning) continue; this.damageDevice(d, 400 * (1 - dd / radius) + 60, src); }
    }
    for (const p of this.proj) if (!p.dead && p.kind === 'nitro' && dist3(pos, p.pos) < radius * 0.6) { /* sympathetic detonation is left to the owner */ }
    // doors and barricades close to a blast
    for (const dr of this.world.doors) { if (dr.dead) continue; const c = [dr.ix + (dr.ax === 'x' ? 0 : 0.5), 1, dr.iz + (dr.ax === 'x' ? 0.5 : 0)]; if (dist3(pos, c) < radius * 0.7) this.world.damage(dr.panels[0], 400, { actor: src }); }
  }
  rayHit(o, d, maxT, shooter) {
    let best = null;
    for (const dv of this.list) {
      if (dv.dead || dv.team === shooter.team || dv.kind === 'dshield' || dv.kind === 'barbwire' || dv.kind === 'mat') continue;
      if (dv.kind === 'mines' || dv.kind === 'claymore' && false) continue;
      const t = raySphere(o, d, dv.pos, dv.radius);
      if (t !== null && t < maxT && (!best || t < best.t)) best = { t, dev: dv };
    }
    for (const dr of this.drones) { if (dr.dead || dr.team === shooter.team) continue; const t = raySphere(o, d, dr.pos, 0.28); if (t !== null && t < maxT && (!best || t < best.t)) best = { t, dev: dr }; }
    return best;
  }

  // ------------------------------------------------------------------ detonation by the owner (thermite, charges, nitro, drones)
  detonateOwned(a) {
    let did = false;
    for (const d of this.list) {
      if (d.dead || d.owner !== a || d.jammed > 0) continue;
      if (d.kind === 'thermite' && !d.data.burning) { d.data.burning = true; d.data.t = 0; this.sim.emit('ignite', { device: d }); did = true; }
      else if ((d.kind === 'breach' || d.kind === 'cluster') && !d.data.fired) { this.fireCharge(d); did = true; }
      else if (d.kind === 'shockdrone' && !d.data.fired) { this.shockBurst(d); did = true; }
    }
    for (const p of this.proj) if (!p.dead && p.owner === a && p.kind === 'nitro') { this.detonate(p); did = true; }
    return did;
  }
  fireCharge(d) {
    d.data.fired = true; d.dead = true;
    const w = this.world, n = d.n, hard = d.kind === 'breach', here = d.panel;
    const c = [d.pos[0] - n[0] * 0.1, d.pos[1] - n[1] * 0.1, d.pos[2] - n[2] * 0.1];
    if (here && !here.dead) {
      const pts = [];
      for (const q of w.holeFor(here, c, d.kind === 'cluster' ? 3 : 2, 2)) pts.push(q);
      for (const q of pts) { if (!q.dest) continue; if (q.reinforced && !hard) continue; w.breakPanel(q, { actor: d.owner }); }
      if (here.ax === 'y' || here.hatch) w.breakPanel(here, { actor: d.owner });
    }
    this.sim.explode(c, { radius: d.kind === 'cluster' ? 3.4 : 2.9, dmg: 75, power: d.kind === 'cluster' ? 420 : 200, hard, src: d.owner, kind: 'breach', walls: false });
    this.sim.emit('devicekill', { device: d, src: d.owner, fired: true });
  }
  shockBurst(d) {
    d.data.fired = true; d.dead = true;
    for (const a of this.sim.actors) if (a.team !== d.team && a.alive && dist3(a.pos, d.pos) < 3.5) { a.hurt(35, { src: d.owner, region: 'torso', quiet: false, ignoreArmor: true }); a.applyStatus('shock', 4); a.applyStatus('slow', 4); }
    for (const o of this.list) if (!o.dead && o.team !== d.team && dist3(o.pos, d.pos) < 4) this.damageDevice(o, 999, d.owner);
    this.sim.emit('shock', { pos: d.pos });
  }

  // ------------------------------------------------------------------ per-frame
  update(dt) {
    this.updateProj(dt);
    const sim = this.sim, w = this.world;
    for (const d of this.list) {
      if (d.dead) continue;
      d.age += dt; if (d.jammed > 0) d.jammed -= dt;
      if (d.panel && d.panel.dead && d.kind !== 'cams') { this.kill(d, null); continue; }
      if (d.kind === 'cams' && d.panel && d.panel.dead && d.panel.kind !== 'glass') { this.kill(d, null); continue; }
      const enemies = sim.actors.filter((a) => a.team !== d.team && a.alive);
      switch (d.kind) {
        case 'thermite': if (d.data.burning) { d.data.t += dt; if (d.data.t >= 4.2) this.finishThermite(d); } break;
        case 'mat': for (const a of enemies) if (a.grounded && Math.hypot(a.pos[0] - d.pos[0], a.pos[2] - d.pos[2]) < 0.55 && Math.abs(a.pos[1] - d.pos[1]) < 0.6 && !d.data.cool) { a.hurt(14, { src: d.owner, region: 'legs', ignoreArmor: true, quiet: false }); a.applyStatus('slow', 6); a.applyStatus('tag', 8); d.data.cool = 2; sim.emit('trap', { device: d, victim: a }); } if (d.data.cool) d.data.cool = Math.max(0, d.data.cool - dt); break;
        case 'barbwire': for (const a of enemies) if (a.stance < 2 && Math.hypot(a.pos[0] - d.pos[0], a.pos[2] - d.pos[2]) < 0.55 && Math.abs(a.pos[1] - d.pos[1]) < 0.6) { a.applyStatus('slow', 1.5); a.hurt(6 * dt, { src: d.owner, region: 'legs', ignoreArmor: true, quiet: true }); } break;
        case 'alarm': if (d.jammed <= 0) for (const a of enemies) if (dist3(a.pos, d.pos) < 3.2 && !d.data.cool) { a.applyStatus('tag', 5); d.data.cool = 6; sim.noise(d.pos, 30, 'alarm', d.owner); sim.emit('alarm', { device: d, victim: a }); } if (d.data.cool) d.data.cool = Math.max(0, d.data.cool - dt); break;
        case 'mines': for (const a of enemies) if (a.grounded && Math.hypot(a.pos[0] - d.pos[0], a.pos[2] - d.pos[2]) < 0.6 && Math.abs(a.pos[1] - d.pos[1]) < 0.6) { this.gas.push({ pos: [d.pos[0], d.pos[1] + 0.5, d.pos[2]], r: 2.6, t: 7, owner: d.owner, team: d.team }); sim.emit('gas', { pos: d.pos }); this.kill(d, null); a.gasSrc = d.owner; break; } break;
        case 'claymore': case 'edd': if (d.jammed <= 0) this.tripwire(d, enemies); break;
        case 'healstation': for (const a of sim.actors) if (a.team === d.team && a.alive && dist3(a.pos, d.pos) < 3.2) a.applyStatus('heal', 0.3); d.data.life = (d.data.life ?? 14) - dt; if (d.data.life <= 0) this.kill(d, null); break;
        case 'jammer': for (const o of this.list) if (!o.dead && o.team !== d.team && o.kind !== 'mat' && dist3(o.pos, d.pos) < 9 && (o.kind === 'cams' || o.kind === 'shockdrone' || o.kind === 'breach' || o.kind === 'cluster')) o.jammed = 0.3; for (const dr of this.drones) if (!dr.dead && dr.team !== d.team && dist3(dr.pos, d.pos) < 9) dr.jam = 0.3; for (const a of enemies) if (dist3(a.pos, d.pos) < 9) a.status.jam = Math.max(a.status.jam, 0.3); break;
        case 'turret': this.turretStep(d, enemies, dt); break;
        case 'shockwire': for (const a of enemies) if (d.panel && !d.panel.dead) { const c = w.panelCenter(d.panel); if (dist3(a.pos, [c[0], a.pos[1], c[2]]) < 0.95 && Math.abs(a.pos[1] + 0.9 - c[1]) < 1.6) { a.applyStatus('shock', 0.5); a.hurt(10 * dt, { src: d.owner, region: 'torso', ignoreArmor: true, quiet: true }); } } for (const o of this.list) if (!o.dead && o.team !== d.team && (o.kind === 'thermite' || o.kind === 'breach' || o.kind === 'cluster') && o.panel === d.panel) this.kill(o, d.owner); break;
        case 'armorpack': for (const a of sim.actors) if (a.team === d.team && a.alive && dist3(a.pos, d.pos) < 1.3 && a.armorPlates < 2) { a.armorPlates++; this.kill(d, null); break; } break;
        default: break;
      }
    }
    this.list = this.list.filter((d) => !d.dead);
    // gas clouds
    for (const g of this.gas) {
      g.t -= dt;
      for (const a of sim.actors) if (a.alive && a.team !== g.team && dist3(a.chestPos(), g.pos) < g.r) a.applyStatus('gas', 1.2);
    }
    this.gas = this.gas.filter((g) => g.t > 0);
    for (const s of this.world.smoke) s.t -= dt;
    this.world.smoke = this.world.smoke.filter((s) => s.t > 0);
    this.flashes = this.flashes.filter((f) => (f.t -= dt) > 0);
    this.updateDrones(dt);
  }
  finishThermite(d) {
    d.dead = true;
    const w = this.world, p = d.panel;
    if (p && !p.dead) {
      const c = [d.pos[0] - d.n[0] * 0.1, d.pos[1] - d.n[1] * 0.1, d.pos[2] - d.n[2] * 0.1];
      const hole = w.holeFor(p, c, 3, 2);
      for (const q of hole) { if (q.dest) { q.reinforced = false; w.breakPanel(q, { actor: d.owner }); } }
      this.sim.emit('thermite', { pos: d.pos });
    }
    for (const a of this.sim.actors) if (a.team !== d.team && a.alive && dist3(a.chestPos(), d.pos) < 2.2) a.hurt(55, { src: d.owner, region: 'torso', explosion: true, ignoreArmor: true });
    this.sim.noise(d.pos, 25, 'burn', d.owner);
  }
  tripwire(d, enemies) {
    const reach = d.kind === 'claymore' ? 4.2 : 1.6, n = d.kind === 'claymore' ? d.n : [0, 0, 0];
    for (const a of enemies) {
      const rel = sub(a.chestPos(), d.pos), dd = len(rel);
      if (dd > reach) continue;
      if (d.kind === 'claymore') {
        const cosA = dot(norm(rel), n);
        if (cosA < 0.6) continue;
        if (this.world.cast(d.pos[0], d.pos[1], d.pos[2], rel[0] / dd, rel[1] / dd, rel[2] / dd, dd - 0.2, CAST.GLASS | CAST.PROPS)) continue;
        d.dead = true; this.sim.explode(d.pos, { radius: 4.2, dmg: 140, power: 40, src: d.owner, kind: 'claymore', walls: false }); return;
      }
      // EDD: the beam crosses the doorway along its wall
      const across = d.data.ax === 'x' ? Math.abs(a.pos[2] - d.pos[2]) < 0.35 && Math.abs(a.pos[0] - d.pos[0]) < 1.2 : Math.abs(a.pos[0] - d.pos[0]) < 0.35 && Math.abs(a.pos[2] - d.pos[2]) < 1.2;
      if (across && Math.abs(a.pos[1] - d.pos[1] + 1) < 1.8) {
        d.dead = true; a.hurt(45, { src: d.owner, region: 'torso', ignoreArmor: true }); a.applyStatus('shock', 4); a.applyStatus('stun', 3); a.applyStatus('slow', 4);
        this.sim.emit('trap', { device: d, victim: a }); this.sim.noise(d.pos, 40, 'alarm', d.owner); return;
      }
    }
  }
  turretStep(d, enemies, dt) {
    const sim = this.sim, w = this.world, t = d.data;
    t.cd = Math.max(0, (t.cd || 0) - dt);
    if (d.jammed > 0) return;
    const eye = [d.pos[0], d.pos[1] + 0.75, d.pos[2]];
    let best = null, bd = 17;
    for (const a of enemies) {
      const h = a.chestPos(), dd = dist3(eye, h); if (dd > bd) continue;
      if (a.stance === 2 && dd > 9) continue;
      if (!w.visible(eye, h, CAST.GLASS)) continue;
      bd = dd; best = a;
    }
    if (!best) { t.target = null; t.aim += Math.sin(d.age * 0.8) * dt * 0.4; return; }
    t.target = best.id; const h = best.chestPos();
    const want = Math.atan2(h[0] - eye[0], h[2] - eye[2]);
    let da = want - t.aim; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    t.aim += clamp(da, -dt * 3.5, dt * 3.5);
    if (Math.abs(da) < 0.12 && t.cd <= 0) {
      t.cd = 0.14; const dir = norm(sub(h, eye)), sp = 0.035;
      const fake = { team: d.team, stats: d.owner.stats, id: d.owner.id, pos: d.pos, eye: () => eye, suppressed: true };
      const dd = [dir[0] + (sim.rand() - 0.5) * sp, dir[1] + (sim.rand() - 0.5) * sp, dir[2] + (sim.rand() - 0.5) * sp];
      sim.bullet(fake, eye, norm(dd), { dmg: 9, pen: 0.3, wallDmg: 2, range: 25, falloff: 0.5, pellets: 1 }, { muzzle: eye });
      sim.emit('turretshot', { device: d });
    }
    void dirOf; void STOREY; void MATS;
  }

  // ------------------------------------------------------------------ drones (wheeled recon, controlled by the player or the AI)
  spawnDrone(owner, pos, yaw = 0) {
    const dr = { id: DEV_ID++, kind: 'drone', owner, team: owner.team, pos: [...pos], yaw, pitch: 0, vel: [0, 0, 0], hp: 12, dead: false, jam: 0, ctl: { fwd: 0, strafe: 0, turn: 0, pitch: 0, jump: false }, seen: new Map(), age: 0, view: null, y: pos[1], cam: false };
    this.drones.push(dr); owner.drone = dr; this.sim.emit('drone', { drone: dr }); return dr;
  }
  updateDrones(dt) {
    const w = this.world;
    for (const dr of this.drones) {
      if (dr.dead) continue;
      dr.age += dt; if (dr.jam > 0) dr.jam -= dt;
      const c = dr.ctl, spd = dr.jam > 0 ? 0 : 2.6;
      dr.yaw += c.turn * dt * 2.4; dr.pitch = clamp(dr.pitch + c.pitch * dt * 1.6, -1.2, 1.2);
      const f = [Math.sin(dr.yaw), Math.cos(dr.yaw)], r = [-Math.cos(dr.yaw), Math.sin(dr.yaw)];
      const tx = (f[0] * c.fwd + r[0] * c.strafe) * spd, tz = (f[1] * c.fwd + r[1] * c.strafe) * spd;
      dr.vel[0] += (tx - dr.vel[0]) * Math.min(1, dt * 8); dr.vel[2] += (tz - dr.vel[2]) * Math.min(1, dt * 8);
      const np = [dr.pos[0] + dr.vel[0] * dt, dr.pos[1], dr.pos[2] + dr.vel[2] * dt];
      // the drone is a low box: slide along walls
      w.pushOut(np, 0.22, 0.3, 0.12);
      const g = w.groundY(np[0], np[2], 0.2, dr.pos[1], 0.3);
      np[1] = g > -Infinity ? g : dr.pos[1];
      dr.pos = np;
      // spotting: anything with a clear line to the drone's eye within 14 m is marked for the team
      const eye = [dr.pos[0], dr.pos[1] + 0.25, dr.pos[2]], fw = dirOf(dr.yaw, dr.pitch);
      for (const a of this.sim.actors) {
        if (a.team === dr.team || !a.alive) continue;
        const h = a.chestPos(), d = sub(h, eye), dd = len(d);
        if (dd > 15 || dd < 0.1) continue;
        if (dot(norm(d), fw) < 0.35) continue;
        if (!w.visible(eye, h, CAST.GLASS)) continue;
        dr.seen.set(a.id, this.sim.time); a.applyStatus('tag', 2.5);
      }
    }
    this.drones = this.drones.filter((d) => !d.dead);
  }
  killDrone(dr, src) { if (dr.dead) return; dr.dead = true; if (dr.owner) dr.owner.drone = null; this.sim.emit('dronekill', { drone: dr, src }); }
}
function opts_selfHeal(a) { return a.hp < a.maxHp; }
