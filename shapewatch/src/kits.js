// What each hero's weapons and abilities actually do. A kit can define:
//   update(sim,u,dt)  every frame        canFire1(sim,u)  gate the primary    fire1(sim,u)  custom primary
//   secondary(sim,u,dt,held,pressed)     a1/a2/ult(sim,u) one-shot abilities (return false to refuse)
import { v3, clamp, forward, wrapAngle } from './util.js';

const flat = (d) => { const l = Math.hypot(d[0], d[2]) || 1; return [d[0] / l, 0, d[2] / l]; };
const aimPoint = (sim, u, range = 90) => { const o = sim.eye(u), d = sim.aimDir(u); return sim.trace(o, d, range, { team: u.team, skip: u }).point; };
const toward = (a, b) => v3.norm(v3.sub(b, a));
// the direction a projectile should leave the muzzle so it converges on the crosshair
const projDir = (sim, u, spreadDeg = 0) => sim.spread(toward(sim.muzzle(u), aimPoint(sim, u)), spreadDeg);
function projSpec(w, extra = {}) {
  return { dmg: w.dmg, splash: w.splash || 0, splashDmg: w.splashDmg, speed: w.speed, radius: w.radius || 0.2, color: w.color, size: w.size || 0.2, slow: w.slow, burn: w.burn, gravity: w.gravity || 0, life: w.life || 3, ...extra };
}
function fireProj(sim, u, w) {
  sim.spawnProj(u, projSpec(w), projDir(sim, u, 0.4));
  sim.emit({ type: 'shot', unit: u, sound: w.sound });
}
function cone(sim, u, range, deg, fn, { los = true } = {}) {
  const o = sim.eye(u), f = sim.aimDir(u), cosA = Math.cos(deg * Math.PI / 180 / 2);
  for (const e of sim.enemies(u)) {
    const c = sim.center(e), d = v3.sub(c, o), l = v3.len(d);
    if (l - e.def.radius > range || v3.dot(v3.norm(d), f) < cosA) continue;
    if (los && !sim.los(o, c)) continue;
    fn(e, l, v3.norm(d));
  }
}
function pulse(sim, u, pos, r, color = '#ffffff', kind = 'ring') { sim.emit({ type: 'pulse', pos: [...pos], r, color, kind }); }
function nearestInView(sim, u, range, deg, test = () => true) {
  const o = sim.eye(u), f = sim.aimDir(u); let best = null, bs = Math.cos(deg * Math.PI / 180);
  for (const a of sim.allies(u)) {
    if (!test(a)) continue;
    const c = sim.center(a), d = v3.sub(c, o), l = v3.len(d); if (l > range) continue;
    const s = v3.dot(v3.norm(d), f); if (s > bs && sim.los(o, c)) { bs = s; best = a; }
  }
  return best;
}
function dash(sim, u, dir, speed, t, opts = {}) { u.dash = { t, vx: dir[0] * speed, vz: dir[2] * speed, ...opts }; if (opts.vy !== undefined) { u.vy = opts.vy; u.grounded = false; } }
const moveDir = (sim, u) => {
  const m = u.in.move, f = [Math.sin(u.yaw), Math.cos(u.yaw)], r = [-Math.cos(u.yaw), Math.sin(u.yaw)];
  const x = f[0] * m[1] + r[0] * m[0], z = f[1] * m[1] + r[1] * m[0];
  return Math.hypot(x, z) > 0.2 ? flat([x, 0, z]) : flat(sim.aimDir(u));
};
function slam(sim, u, r, dmg, edge, up = 5) {
  pulse(sim, u, u.pos, r, '#ffb061', 'slam');
  sim.emit({ type: 'boom', pos: [u.pos[0], u.pos[1] + 0.3, u.pos[2]], r, color: '#ffb061', kind: 'slam' });
  sim.area(u.pos, r, (e, d) => {
    const f = 1 - clamp(d / r, 0, 1) * (1 - edge / dmg);
    sim.damage(e, dmg * f, u, { kind: 'splash' });
    const dir = v3.sub(e.pos, u.pos); sim.knock(e, [dir[0] * 0.8, up, dir[2] * 0.8]);
  }, { enemiesOf: u.team });
}
function placeFloor(sim, from, dir, dist) { // furthest free spot along dir (for blink and step)
  let best = [...from];
  for (let d = 0.5; d <= dist; d += 0.5) {
    const p = [from[0] + dir[0] * d, from[1], from[2] + dir[2] * d];
    const g = sim.groundAt(p[0], p[2], p[1] + 0.3, 0.35);
    if (g > from[1] + 0.6 || sim.blockedAt(p[0], p[2], g, 0.4, 1.7)) break;
    if (g < from[1] - 3.5) break;
    best = [p[0], g, p[2]];
  }
  return best;
}

export const KITS = {
  // ------------------------------------------------------------------ BULWARK
  bulwark: {
    update(sim, u, dt) {
      const b = (u.s.barrier ||= { hp: 700, max: 700, up: false, broken: 0, regenT: 0 });
      if (b.broken > 0) { b.broken -= dt; if (b.broken <= 0) b.hp = 150; }
      else if (!b.up) { b.regenT -= dt; if (b.regenT <= 0) b.hp = Math.min(b.max, b.hp + 70 * dt); }
    },
    canFire1: (sim, u) => !u.s.barrier?.up,
    secondary(sim, u, dt, held) {
      const b = u.s.barrier; if (!b) return;
      b.up = held && b.broken <= 0 && b.hp > 0 && !u.dash && u.reloadT <= 0;
    },
    a1(sim, u) {
      const dir = flat(sim.aimDir(u)), hitSet = new Set(); u.s.barrier.up = false;
      dash(sim, u, dir, 15, 1.0, { hit: (s, me) => { for (const e of s.enemies(me)) { if (hitSet.has(e) || v3.dist2d(e.pos, me.pos) > me.def.radius + e.def.radius + 0.6 || Math.abs(e.pos[1] - me.pos[1]) > 2) continue; hitSet.add(e); s.damage(e, 45, me, { kind: 'charge' }); s.knock(e, [dir[0] * 7 + -dir[2] * 4, 3, dir[2] * 7 + dir[0] * 4]); s.addStatus(e, 'stun', 0.5); } } });
      sim.emit({ type: 'dash', unit: u });
    },
    a2(sim, u) {
      pulse(sim, u, u.pos, 10, '#ffb02e');
      sim.area(u.pos, 10, (a) => { if (a.deploy) return; sim.addStatus(a, 'speed', 4, { f: 0.25 }); a.shield = Math.max(a.shield, 75); a.shieldDecay = 12; }, { alliesOf: u.team, y: false });
    },
    ult(sim, u) { sim.addZone({ kind: 'dome', pos: [...u.pos], r: 6, t: 7, team: u.team, owner: u }); },
  },
  // ------------------------------------------------------------------ MAULER
  mauler: {
    secondary(sim, u, dt, held, pressed) {
      if (!pressed || u.cd.w2 > 0) return;
      u.cd.w2 = 8;
      sim.spawnProj(u, { speed: 42, dmg: 40, radius: 0.35, color: '#cfcfd6', size: 0.18, life: 0.45, gravity: 0, hook: true,
        onHit(s, p, hit) {
          if (hit.kind !== 'unit') return;
          const e = hit.unit; s.damage(e, 40, p.owner, { point: p.pos, kind: 'hook' });
          const d = v3.sub(p.owner.pos, e.pos), l = v3.len(d) || 1; s.knock(e, [d[0] / l * 16, 4, d[2] / l * 16]); s.addStatus(e, 'stun', 0.45);
          s.emit({ type: 'pulse', pos: e.pos, r: 1.5, color: '#cfcfd6', kind: 'ring' });
        } }, projDir(sim, u));
    },
    a1(sim, u) {
      const dir = flat(sim.aimDir(u));
      dash(sim, u, dir, 11, 1.4, { vy: 9.5, noGravity: false });
      u.s.onLand = (s, me) => { me.dash = null; slam(s, me, 4.5, 70, 35); };
      sim.emit({ type: 'dash', unit: u });
    },
    a2(sim, u) { sim.addStatus(u, 'resist', 4, { f: 0.5 }); sim.addStatus(u, 'brace', 4); pulse(sim, u, u.pos, 2, '#f2c14e'); },
    ult(sim, u) {
      const dir = flat(sim.aimDir(u)); u.s.ulting = true;
      dash(sim, u, dir, 9, 1.9, { vy: 17 });
      u.s.onLand = (s, me) => { me.dash = null; me.s.ulting = false; slam(s, me, 9, 200, 90, 11); };
    },
  },
  // ------------------------------------------------------------------ ORBIT
  orbit: {
    fire1(sim, u) { fireProj(sim, u, u.def.w1); },
    secondary(sim, u, dt, held, pressed) {
      if (!pressed || u.cd.w2 > 0) return;
      u.cd.w2 = 7; let n = 0;
      cone(sim, u, 14, 80, (e, l) => {
        n++; sim.damage(e, 20, u, { kind: 'pull' });
        const d = v3.sub(u.pos, e.pos), dl = v3.len(d) || 1; sim.knock(e, [d[0] / dl * 17, 3, d[2] / dl * 17]);
      });
      pulse(sim, u, sim.center(u), 5, '#b78bff', 'sweep');
      if (!n) u.cd.w2 = 1.5;
    },
    a1(sim, u) { u.vy = 9.5; u.grounded = false; sim.addStatus(u, 'glide', 2.5); pulse(sim, u, u.pos, 2, '#5cf2e0'); },
    a2(sim, u) { u.shield = Math.max(u.shield, 400); u.shieldDecay = 133; sim.addStatus(u, 'warded', 3); pulse(sim, u, sim.center(u), 2.5, '#5cf2e0'); },
    ult(sim, u) {
      sim.spawnProj(u, { speed: 24, dmg: 0, radius: 0.4, color: '#7a4bff', size: 0.55, gravity: -5, life: 2.2, explodeOnExpire: true,
        onHit(s, p) {
          s.addZone({ kind: 'hole', pos: [...p.pos], r: 10, t: 7, team: p.team, owner: p.owner,
            update(sm, z, dt) {
              sm.area(z.pos, z.r, (e, d) => {
                if (e.team === z.team) return;
                const dir = v3.sub(z.pos, [e.pos[0], e.pos[1] + 0.8, e.pos[2]]), l = v3.len(dir) || 1;
                const pull = (12 + (1 - d / z.r) * 10) * dt;
                e.vx += dir[0] / l * pull * 2.4; e.vz += dir[2] / l * pull * 2.4; if (e.grounded && dir[1] > 1) e.vy = Math.max(e.vy, 2);
                sm.damage(e, 55 * dt, z.owner, { silent: true, kind: 'hole' });
                if (d < 2.2) sm.addStatus(e, 'slow', 0.3, { f: 0.5 });
              }, { enemiesOf: z.team });
            } });
        } }, projDir(sim, u));
    },
  },
  // ------------------------------------------------------------------ SABRE
  sabre: {
    update(sim, u, dt) {
      const r = u.s.rockets; if (!r) return;
      r.t -= dt;
      if (r.t <= 0 && r.n > 0) {
        r.n--; r.t = 0.14;
        sim.spawnProj(u, { speed: 34, dmg: 50, splash: 2.4, splashDmg: 38, radius: 0.22, color: '#ff9a3a', size: 0.14, life: 3, sfxKind: 'rocket' }, projDir(sim, u, 1.6));
        sim.emit({ type: 'shot', unit: u, sound: 'rocket' });
      }
      if (r.n <= 0) u.s.rockets = null;
    },
    secondary(sim, u, dt, held, pressed) { if (pressed && u.cd.w2 <= 0 && !u.s.rockets) { u.cd.w2 = 6; u.s.rockets = { n: 3, t: 0 }; } },
    a1(sim, u) { dash(sim, u, moveDir(sim, u), 15, 0.28); sim.emit({ type: 'dash', unit: u }); },
    a2(sim, u) { sim.heal(u, 75, u); sim.addStatus(u, 'speed', 3, { f: 0.3 }); pulse(sim, u, sim.center(u), 1.8, '#7fffa0'); },
    ult(sim, u) { sim.addStatus(u, 'overdrive', 7); u.ammo = u.def.w1.ammo; u.reloadT = 0; },
  },
  // ------------------------------------------------------------------ CINDER
  cinder: {
    fire1(sim, u) { fireProj(sim, u, u.def.w1); },
    secondary(sim, u, dt, held, pressed) {
      if (!pressed || u.cd.w2 > 0) return;
      u.cd.w2 = 5; const f = flat(sim.aimDir(u));
      cone(sim, u, 6.5, 80, (e) => { sim.damage(e, 35, u, { kind: 'burst' }); sim.knock(e, [f[0] * 11, 4, f[2] * 11]); sim.addStatus(e, 'burn', 2, { dps: 10, src: u }); }, { los: true });
      pulse(sim, u, v3.madd(sim.eye(u), sim.aimDir(u), 1.5), 3, '#ff8a2a', 'sweep');
      sim.emit({ type: 'shot', unit: u, sound: 'burst' });
    },
    a1(sim, u) {
      const from = [...u.pos], to = placeFloor(sim, from, flat(sim.aimDir(u)), 9);
      sim.emit({ type: 'blink', from: [...from], to: [...to], color: '#ff8a2a' });
      u.pos = to; u.vx *= 0.3; u.vz *= 0.3;
    },
    a2(sim, u) {
      const f = flat(sim.aimDir(u)), c = v3.madd(u.pos, f, 7), yaw = Math.atan2(f[0], f[2]);
      sim.addZone({ kind: 'wall', pos: [c[0], u.pos[1], c[2]], yaw, len: 10, wid: 1.4, t: 6, team: u.team, owner: u,
        update(sm, z, dt) {
          const cs = Math.cos(-z.yaw), sn = Math.sin(-z.yaw);
          for (const e of sm.enemies(z.owner)) {
            const px = e.pos[0] - z.pos[0], pz = e.pos[2] - z.pos[2], lx = px * cs + pz * sn, lz = -px * sn + pz * cs;
            if (Math.abs(lx) < z.len / 2 && Math.abs(lz) < z.wid / 2 + e.def.radius && e.pos[1] < z.pos[1] + 2.4 && e.pos[1] > z.pos[1] - 2) { sm.damage(e, 22 * dt, z.owner, { silent: true, kind: 'fire' }); sm.addStatus(e, 'burn', 2.5, { dps: 10, src: z.owner }); }
          }
        } });
    },
    ult(sim, u) {
      sim.spawnProj(u, { speed: 30, dmg: 0, radius: 0.35, color: '#ff5a1a', size: 0.5, gravity: -10, life: 2.5, explodeOnExpire: true,
        onHit(s, p) {
          s.emit({ type: 'boom', pos: [...p.pos], r: 5, color: '#ff7a2a', kind: 'big' });
          s.addZone({ kind: 'fire', pos: [...p.pos], r: 7, t: 8, team: p.team, owner: p.owner,
            update(sm, z, dt) { sm.area(z.pos, z.r, (e) => { sm.damage(e, 40 * dt, z.owner, { silent: true, kind: 'fire' }); sm.addStatus(e, 'burn', 2, { dps: 12, src: z.owner }); }, { enemiesOf: z.team, y: false }); } });
        } }, projDir(sim, u));
    },
  },
  // ------------------------------------------------------------------ VESPER
  vesper: {
    update(sim, u, dt) {
      u.s.charge = clamp((u.s.charge || 0) + (u.s.scoped ? dt * 1.15 : -dt * 3), 0, 1);
      const L = u.s.lance;
      if (L && L.t > 0) { L.t -= dt; if (L.t <= 0) L.ready = true; }
      if (u.reloadT > 0) u.s.scoped = false;
    },
    secondary(sim, u, dt, held) { u.s.scoped = held && u.reloadT <= 0 && u.alive; },
    canFire1: (sim, u) => !(u.s.lance && !u.s.lance.ready),
    fire1(sim, u) {
      const w = u.def.w1, o = sim.eye(u), L = u.s.lance;
      const dir = sim.spread(sim.aimDir(u), u.s.scoped ? 0 : w.spread * (u.moving > 1 ? 1.4 : 0.5));
      const mz = sim.muzzle(u);
      if (L && L.ready) { // Rift Lance: through everything
        u.s.lance = null; u.s.ulting = false;
        const end = v3.madd(o, dir, 120);
        for (const e of sim.enemies(u)) { const h = sim.rayUnit(o, dir, 120, e); if (h) sim.damage(e, 250, u, { head: h.head, point: sim.center(e), kind: 'lance' }); }
        sim.emit({ type: 'tracer', from: mz, to: end, color: '#b6ff4a', width: 3, hit: 'lance' });
        sim.emit({ type: 'shot', unit: u, sound: 'lance' }); u.s.charge = 0; return true;
      }
      const dmg = w.dmg + (u.s.scoped ? 110 * (u.s.charge || 0) : 0);
      const hit = sim.trace(o, dir, w.range, { team: u.team, skip: u });
      if (hit.kind === 'unit') sim.damage(hit.unit, dmg * (hit.head ? w.headMul : 1), u, { head: hit.head, point: hit.point });
      else if (hit.kind === 'barrier') sim.hitBarrier(hit.unit, dmg, u, hit.point);
      else if (hit.kind === 'world') sim.emit({ type: 'impact', point: hit.point, normal: hit.normal, color: w.tracer });
      sim.emit({ type: 'tracer', from: mz, to: hit.point, color: w.tracer, width: 1 + (u.s.charge || 0) * 1.5, hit: hit.kind, unit: u });
      sim.emit({ type: 'shot', unit: u, sound: 'rail' }); u.s.charge = 0;
    },
    a1(sim, u) {
      const o = sim.eye(u), d = sim.aimDir(u), hit = sim.rayWorld(o, d, 42);
      if (!(hit.t < 42)) return false;
      const p = v3.madd(o, d, hit.t - 0.5), dist = v3.dist(o, p), dir = v3.norm(v3.sub(p, o));
      u.vx = u.vz = 0; dash(sim, u, [dir[0], 0, dir[2]], Math.hypot(dir[0], dir[2]) * 26, Math.min(1.1, dist / 26), { noGravity: true, vy: dir[1] * 26, end: (s, me) => { me.vy = Math.min(me.vy, 4); } });
      u.dash.climb = dir[1] * 26; u.dash.hit = (s, me) => { me.vy = u.dash ? u.dash.climb : 0; };
      sim.emit({ type: 'tracer', from: sim.muzzle(u), to: p, color: '#b6ff4a', width: 1, hit: 'grapple' });
    },
    a2(sim, u) {
      sim.spawnProj(u, { speed: 55, dmg: 0, radius: 0.15, color: '#6fffe0', size: 0.12, gravity: -4, life: 1.6, onHit(s, p) {
        s.emit({ type: 'sonar', pos: [...p.pos], color: '#6fffe0' });
        s.area(p.pos, 12, (e) => { s.addStatus(e, 'reveal', 5); }, { enemiesOf: p.team });
      } }, projDir(sim, u));
    },
    ult(sim, u) { u.s.lance = { t: 1.2, ready: false }; u.s.ulting = true; return true; },
  },
  // ------------------------------------------------------------------ FLICKER
  flicker: {
    secondary(sim, u, dt, held, pressed) {
      if (!pressed || u.cd.w2 > 0) return;
      u.cd.w2 = 4; const f = flat(sim.aimDir(u)); let best = null, bd = 99;
      for (const e of sim.enemies(u)) {
        const d = v3.sub(e.pos, u.pos), l = Math.hypot(d[0], d[2]); if (l > 5.5 || Math.abs(d[1]) > 2) continue;
        if (v3.dot(flat(d), f) < 0.5) continue; if (l < bd) { bd = l; best = e; }
      }
      if (!best) { dash(sim, u, f, 10, 0.12); u.cd.w2 = 0.8; return; }
      const away = flat(v3.sub(best.pos, u.pos)), facing = [Math.sin(best.yaw), 0, Math.cos(best.yaw)], behind = v3.dot(away, facing) > 0.2;
      const stand = placeFloor(sim, u.pos, away, Math.max(0, bd - 1.1)); sim.emit({ type: 'blink', from: [...u.pos], to: stand, color: '#40e0ff' }); u.pos = stand;
      sim.damage(best, behind ? 90 : 55, u, { kind: 'melee', head: behind, point: sim.center(best) });
      sim.emit({ type: 'pulse', pos: sim.center(best), r: 1.2, color: '#40e0ff', kind: 'slash' });
    },
    a1(sim, u) {
      const from = [...u.pos], to = placeFloor(sim, from, moveDir(sim, u), 7);
      if (v3.dist(from, to) < 1) return false;
      sim.emit({ type: 'blink', from, to: [...to], color: '#40e0ff' }); u.pos = to; u.vy = Math.max(u.vy, 0);
    },
    a2(sim, u) {
      const h = u.hist[0]; if (!h || sim.time - h.t < 1.5) return false;
      sim.emit({ type: 'blink', from: [...u.pos], to: [...h.pos], color: '#40e0ff', rewind: true });
      u.pos = [...h.pos]; u.vx = u.vz = u.vy = 0; u.hp = Math.max(u.hp, h.hp); u.armor = Math.max(u.armor, h.armor); u.st = {}; u.grounded = false; u.hist = [];
    },
    ult(sim, u) {
      sim.spawnProj(u, { speed: 26, dmg: 0, radius: 0.18, color: '#40e0ff', size: 0.2, gravity: -9, life: 3, onHit(s, p, hit) {
        const att = hit.kind === 'unit' ? hit.unit : null;
        s.addZone({ kind: 'bomb', pos: [...p.pos], t: 1.8, team: p.team, owner: p.owner, att,
          update(sm, z) { if (z.att && z.att.alive) z.pos = sm.center(z.att); },
          onEnd(sm, z) {
            sm.emit({ type: 'boom', pos: [...z.pos], r: 5, color: '#40e0ff', kind: 'big' });
            sm.area(z.pos, 5, (e, d) => sm.damage(e, 220 * (1 - clamp(d / 5, 0, 1) * 0.5), z.owner, { kind: 'splash' }), { enemiesOf: z.team, los: true });
          } });
      } }, projDir(sim, u));
    },
  },
  // ------------------------------------------------------------------ HALO
  halo: {
    secondary(sim, u, dt, held) {
      if (!held) { u.s.beam = null; return; }
      let t = u.s.beam;
      if (!t || !t.alive || v3.dist(u.pos, t.pos) > 22 || !sim.los(sim.eye(u), sim.center(t))) t = nearestInView(sim, u, 20, 14);
      u.s.beam = t || null;
      if (t) sim.heal(t, 60 * dt * (sim.mutator?.id === 'glass' ? 1 : 1), u);
    },
    a1(sim, u) {
      const t = nearestInView(sim, u, 40, 28), dir = t ? flat(v3.sub(t.pos, u.pos)) : flat(sim.aimDir(u));
      dash(sim, u, dir, 17, 0.6, { vy: 3, noGravity: true, hit: (s, me) => { if (t && v3.dist2d(me.pos, t.pos) < 1.6) me.dash = null; } });
      sim.emit({ type: 'dash', unit: u });
    },
    a2(sim, u) {
      pulse(sim, u, sim.center(u), 6, '#fff1a8', 'ring');
      sim.area(u.pos, 6, (a) => { if (!a.deploy) sim.heal(a, 90, u); }, { alliesOf: u.team });
      sim.area(u.pos, 6, (e) => sim.damage(e, 20, u, { kind: 'splash' }), { enemiesOf: u.team, los: true });
    },
    ult(sim, u) {
      const dead = sim.corpses.filter((c) => c.team === u.team && !c.unit.alive).slice(-2);
      for (const c of dead) sim.revive(c.unit, c.pos);
      pulse(sim, u, sim.center(u), 15, '#fff1a8', 'ring');
      sim.area(u.pos, 15, (a) => { if (!a.deploy) sim.heal(a, 100, u); }, { alliesOf: u.team });
    },
  },
  // ------------------------------------------------------------------ PYLON
  pylon: {
    secondary(sim, u, dt, held, pressed) {
      if (!pressed || u.cd.w2 > 0) return; u.cd.w2 = 3;
      sim.spawnProj(u, { speed: 46, dmg: 20, heal: 70, radius: 0.3, color: '#9dff9d', size: 0.14, gravity: -6, life: 2, allies: true }, projDir(sim, u));
    },
    a1(sim, u) { sim.spawnDeploy(u, 'pylon', u.pos, 150, { life: 12 }); pulse(sim, u, u.pos, 6, '#9dff9d', 'ring'); },
    a2(sim, u) { const f = flat(sim.aimDir(u)); sim.spawnDeploy(u, 'sentry', v3.madd(u.pos, f, 1.4), 150, { life: 25 }); },
    ult(sim, u) {
      pulse(sim, u, sim.center(u), 18, '#ffe14d');
      sim.area(u.pos, 18, (a) => { if (a.deploy) return; sim.addStatus(a, 'dmgBoost', 8, { f: 0.35 }); sim.addStatus(a, 'resist', 8, { f: 0.3 }); }, { alliesOf: u.team });
    },
  },
  // ------------------------------------------------------------------ ZEPHYR
  zephyr: {
    update(sim, u, dt) {
      u.s.aura ||= 'heal';
      if (!sim.canAct(u)) return;
      sim.area(u.pos, 10, (a) => { if (a.deploy) return; if (u.s.aura === 'heal') sim.heal(a, 12 * dt, u); else sim.addStatus(a, 'speed', 0.4, { f: 0.3 }); }, { alliesOf: u.team, y: false });
    },
    secondary(sim, u, dt, held, pressed) {
      if (!pressed || u.cd.w2 > 0) return; u.cd.w2 = 0.8; u.s.aura = u.s.aura === 'heal' ? 'speed' : 'heal';
      sim.emit({ type: 'pulse', pos: sim.center(u), r: 3, color: u.s.aura === 'heal' ? '#59f0a8' : '#ffb02e', kind: 'ring' });
    },
    a1(sim, u) {
      const f = flat(sim.aimDir(u));
      cone(sim, u, 7, 75, (e) => { sim.damage(e, 30, u, { kind: 'burst' }); sim.knock(e, [f[0] * 14, 4, f[2] * 14]); });
      pulse(sim, u, v3.madd(sim.eye(u), sim.aimDir(u), 1.5), 3.5, '#ff8fd0', 'sweep');
    },
    a2(sim, u) { dash(sim, u, flat(sim.aimDir(u)), 16, 0.35, { vy: 3.5 }); sim.emit({ type: 'dash', unit: u }); },
    ult(sim, u) {
      pulse(sim, u, sim.center(u), 22, '#59f0a8');
      sim.area(u.pos, 22, (a) => { if (a.deploy) return; a.shield = Math.max(a.shield, 300); a.shieldDecay = 50; }, { alliesOf: u.team });
    },
  },
};

// shared default: hitscan heroes use sim.shootDefault; projectile heroes override fire1 above
export function revive(sim, u, pos) {
  u.alive = true; u.hp = u.maxHp; u.armor = u.maxArmor; u.shield = 0; u.pos = [...pos]; u.vx = u.vz = u.vy = 0; u.st = {}; u.invuln = 2.2; u.dash = null; u.s = {};
  u.ammo = u.def.w1.ammo || 0; u.reloadT = 0; u.killedBy = null; u.hist = [];
  sim.emit({ type: 'revive', unit: u });
}
