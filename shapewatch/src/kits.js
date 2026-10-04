// What each hero's weapons and abilities actually do. A kit can define:
//   update(sim,u,dt)  every frame        canFire1(sim,u)  gate the primary    fire1(sim,u)  custom primary
//   secondary(sim,u,dt,held,pressed)     a1/a2/ult(sim,u) one-shot abilities (return false to refuse)
import { v3, clamp, forward, wrapAngle } from './util.js';

const flat = (d) => { const l = Math.hypot(d[0], d[2]) || 1; return [d[0] / l, 0, d[2] / l]; };
const aimPoint = (sim, u, range = 90) => { const o = sim.eye(u), d = sim.aimDir(u); return sim.trace(o, d, range, { team: u.team, skip: u }).point; };
const toward = (a, b) => v3.norm(v3.sub(b, a));
const projDir = (sim, u, spreadDeg = 0) => sim.spread(toward(sim.muzzle(u), aimPoint(sim, u)), spreadDeg);
function projSpec(w, extra = {}) {
  return { dmg: w.dmg, splash: w.splash || 0, splashDmg: w.splashDmg, speed: w.speed, radius: w.radius || 0.2, color: w.color, size: w.size || 0.2, slow: w.slow, burn: w.burn, knock: w.knock, gravity: w.gravity || 0, life: w.life || 3, sfxKind: w.sfxKind, ...extra };
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
// the unit nearest the crosshair among candidates (within a cone and with a clear line)
function pick(sim, u, list, range, deg, score = null) {
  const o = sim.eye(u), f = sim.aimDir(u), cosA = Math.cos(deg * Math.PI / 180); let best = null, bs = -1e9;
  for (const a of list) {
    const c = sim.center(a), d = v3.sub(c, o), l = v3.len(d); if (l > range || l < 0.2) continue;
    const dot = v3.dot(v3.norm(d), f); if (dot < cosA) continue;
    if (!sim.los(o, c)) continue;
    const s = (score ? score(a, dot, l) : 0) + dot * 4 - l * 0.004;
    if (s > bs) { bs = s; best = a; }
  }
  return best;
}
const hurtness = (a) => 1 - (a.hp + a.armor * 0) / a.maxHp;
const pickAlly = (sim, u, range, deg, any = true) => pick(sim, u, sim.allies(u).filter((a) => any || a.hp < a.maxHp), range, deg * (1 + 0), (a, dot) => hurtness(a) * 1.4);
const pickEnemy = (sim, u, range, deg) => pick(sim, u, sim.enemies(u).filter((e) => !e.deploy), range, deg);
function dash(sim, u, dir, speed, t, opts = {}) { u.dash = { t, vx: dir[0] * speed, vz: dir[2] * speed, ...opts }; if (opts.vy !== undefined) { u.vy = opts.vy; u.grounded = false; } }
const moveDir = (sim, u) => {
  const m = u.in.move, f = [Math.sin(u.yaw), Math.cos(u.yaw)], r = [-Math.cos(u.yaw), Math.sin(u.yaw)];
  const x = f[0] * m[1] + r[0] * m[0], z = f[1] * m[1] + r[1] * m[0];
  return Math.hypot(x, z) > 0.2 ? flat([x, 0, z]) : flat(sim.aimDir(u));
};
function slam(sim, u, r, dmg, edge, up = 5, color = '#ffb061') {
  pulse(sim, u, u.pos, r, color, 'slam');
  sim.emit({ type: 'boom', pos: [u.pos[0], u.pos[1] + 0.3, u.pos[2]], r, color, kind: 'slam' });
  sim.area(u.pos, r, (e, d) => {
    const f = 1 - clamp(d / r, 0, 1) * (1 - edge / dmg);
    sim.damage(e, dmg * f, u, { kind: 'splash' });
    const dir = v3.sub(e.pos, u.pos); sim.knock(e, [dir[0] * 0.8, up, dir[2] * 0.8]);
  }, { enemiesOf: u.team });
}
function placeFloor(sim, from, dir, dist) {
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
const groundPoint = (sim, p) => [p[0], sim.groundAt(p[0], p[2], p[1] + 0.6, 0.3), p[2]];
function lob(sim, u, spec) { sim.spawnProj(u, spec, projDir(sim, u)); }
function unitsOnLine(sim, from, dir, len, width, fn) {
  for (const t of sim.units) {
    if (!t.alive) continue;
    const c = sim.center(t), d = v3.sub(c, from), along = v3.dot(d, dir); if (along < 0.5 || along > len) continue;
    const perp = v3.len(v3.sub(d, v3.scale(dir, along))); if (perp > width + t.def.radius) continue;
    if (!sim.los(from, c)) continue;
    fn(t, along);
  }
}

export const KITS = {
  // ================================================================== BULWARK
  bulwark: {
    update(sim, u, dt) {
      const b = (u.s.barrier ||= { hp: 700, max: 700, up: false, broken: 0, regenT: 0 });
      if (b.broken > 0) { b.broken -= dt; if (b.broken <= 0) b.hp = 150; }
      else if (!b.up) { b.regenT -= dt; if (b.regenT <= 0) b.hp = Math.min(b.max, b.hp + 70 * dt); }
    },
    canFire1: (sim, u) => !u.s.barrier?.up,
    secondary(sim, u, dt, held) { const b = u.s.barrier; if (!b) return; b.up = held && b.broken <= 0 && b.hp > 0 && !u.dash && u.reloadT <= 0; },
    a1(sim, u) {
      const dir = flat(sim.aimDir(u)), hitSet = new Set(); u.s.barrier.up = false;
      dash(sim, u, dir, 15, 1.0, { hit: (s, me) => { for (const e of s.enemies(me)) { if (hitSet.has(e) || v3.dist2d(e.pos, me.pos) > me.def.radius + e.def.radius + 0.6 || Math.abs(e.pos[1] - me.pos[1]) > 2) continue; hitSet.add(e); s.damage(e, 45, me, { kind: 'charge' }); s.knock(e, [dir[0] * 7 + -dir[2] * 4, 3, dir[2] * 7 + dir[0] * 4]); s.stun(e, 0.5); } } });
      sim.emit({ type: 'dash', unit: u });
    },
    a2(sim, u) {
      pulse(sim, u, u.pos, 10, '#ffb02e');
      sim.area(u.pos, 10, (a) => { if (a.deploy) return; sim.addStatus(a, 'speed', 4, { f: 0.25 }); a.shield = Math.max(a.shield, 75); a.shieldDecay = 12; }, { alliesOf: u.team, y: false });
    },
    ult(sim, u) { sim.addZone({ kind: 'dome', pos: [...u.pos], r: 6, t: 7, team: u.team, owner: u }); },
  },
  // ================================================================== MAULER
  mauler: {
    secondary(sim, u, dt, held, pressed) {
      if (!pressed || u.cd.w2 > 0) return;
      u.cd.w2 = 8;
      sim.spawnProj(u, { speed: 42, dmg: 40, radius: 0.35, color: '#cfcfd6', size: 0.18, life: 0.45, gravity: 0, hook: true,
        onHit(s, p, hit) {
          if (hit.kind !== 'unit') return;
          const e = hit.unit; s.damage(e, 40, p.owner, { point: p.pos, kind: 'hook' });
          const d = v3.sub(p.owner.pos, e.pos), l = v3.len(d) || 1; s.knock(e, [d[0] / l * 16, 4, d[2] / l * 16]); s.stun(e, 0.45);
          s.emit({ type: 'pulse', pos: e.pos, r: 1.5, color: '#cfcfd6', kind: 'ring' });
        } }, projDir(sim, u));
    },
    a1(sim, u) { const dir = flat(sim.aimDir(u)); dash(sim, u, dir, 11, 1.4, { vy: 9.5 }); u.s.onLand = (s, me) => { me.dash = null; slam(s, me, 4.5, 70, 35); }; sim.emit({ type: 'dash', unit: u }); },
    a2(sim, u) { sim.addStatus(u, 'resist', 4, { f: 0.5 }); sim.addStatus(u, 'brace', 4); pulse(sim, u, u.pos, 2, '#f2c14e'); },
    ult(sim, u) {
      const dir = flat(sim.aimDir(u)); u.s.ulting = true;
      dash(sim, u, dir, 9, 1.9, { vy: 17 });
      u.s.onLand = (s, me) => { me.dash = null; me.s.ulting = false; slam(s, me, 9, 200, 90, 11); };
    },
  },
  // ================================================================== ORBIT
  orbit: {
    fire1(sim, u) { fireProj(sim, u, u.def.w1); },
    secondary(sim, u, dt, held, pressed) {
      if (!pressed || u.cd.w2 > 0) return;
      u.cd.w2 = 7; let n = 0;
      cone(sim, u, 14, 80, (e) => { n++; sim.damage(e, 20, u, { kind: 'pull' }); const d = v3.sub(u.pos, e.pos), dl = v3.len(d) || 1; sim.knock(e, [d[0] / dl * 17, 3, d[2] / dl * 17]); });
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
                const dir = v3.sub(z.pos, [e.pos[0], e.pos[1] + 0.8, e.pos[2]]), l = v3.len(dir) || 1, pull = (12 + (1 - d / z.r) * 10) * dt;
                e.vx += dir[0] / l * pull * 2.4; e.vz += dir[2] / l * pull * 2.4; if (e.grounded && dir[1] > 1) e.vy = Math.max(e.vy, 2);
                sm.damage(e, 55 * dt, z.owner, { silent: true, kind: 'hole' });
                if (d < 2.2) sm.addStatus(e, 'slow', 0.3, { f: 0.5 });
              }, { enemiesOf: z.team });
            } });
        } }, projDir(sim, u));
    },
  },
  // ================================================================== WRECKER
  wrecker: {
    canFire1: (sim, u) => !u.s.block,
    fire1(sim, u) {
      const w = u.def.w1, c = u.s.combo || { n: 0, t: -9 }; if (sim.time - c.t > 1.3) c.n = 0; c.n++; c.t = sim.time; u.s.combo = c;
      const third = c.n >= 3, bonus = u.s.pcharge || 0; u.s.pcharge = 0; let any = false;
      const o = sim.eye(u), f = sim.aimDir(u), cosA = Math.cos(w.arc * Math.PI / 360);
      for (const e of sim.enemies(u)) {
        const cc = sim.center(e), d = v3.sub(cc, o), l = v3.len(d);
        if (l - e.def.radius > w.range || v3.dot(v3.norm(d), f) < cosA || !sim.los(o, cc)) continue;
        const r = sim.critRoll(u, false, w), dmg = (w.dmg * (third ? 1.6 : 1) + bonus) * r.mul;
        u._hitShot = true; any = true; sim.damage(e, dmg, u, { crit: r.crit, kind: 'melee', point: cc });
        const ff = flat(d); sim.knock(e, [ff[0] * (third ? 9 : 3), third ? 5 : 1, ff[2] * (third ? 9 : 3)]);
        if (third) sim.stun(e, 0.4);
      }
      if (third) c.n = 0;
      u.stats.shots++; if (any) u.stats.hits++;
      pulse(sim, u, v3.madd(o, f, 1.6), third ? 2.6 : 1.8, '#ff8a4a', 'slash');
      sim.emit({ type: 'shot', unit: u, sound: 'punch' });
      if (u.def.w1.ammo === 0) return true;
    },
    secondary(sim, u, dt, held) {
      if (held && !u.dash && sim.canAct(u)) { u.s.block ||= { f: 0.75, stored: 0 }; }
      else if (u.s.block) { u.s.pcharge = Math.min(120, (u.s.pcharge || 0) + u.s.block.stored); u.s.block = null; }
    },
    a1(sim, u) {
      const dir = flat(sim.aimDir(u)), ctx = { tgt: null };
      dash(sim, u, dir, 20, 0.8, {
        hit(s, me) {
          if (!ctx.tgt) {
            for (const e of s.enemies(me)) if (v3.dist2d(e.pos, me.pos) < me.def.radius + e.def.radius + 0.7 && Math.abs(e.pos[1] - me.pos[1]) < 2) { ctx.tgt = e; s.damage(e, 70, me, { kind: 'punch', point: s.center(e) }); break; }
          } else if (ctx.tgt.alive) { ctx.tgt.vx = me.vx; ctx.tgt.vz = me.vz; s.addStatus(ctx.tgt, 'stun', 0.25); }
          // stop the charge at a wall
          if (s.rayWorld([me.pos[0], me.pos[1] + 1, me.pos[2]], dir, 1.6).t < 1.6) me.dash.t = 0;
        },
        end(s, me) {
          if (ctx.tgt && ctx.tgt.alive && s.rayWorld([me.pos[0], me.pos[1] + 1, me.pos[2]], dir, 3).t < 3) { s.damage(ctx.tgt, 60, me, { kind: 'slam' }); s.stun(ctx.tgt, 1.2); s.emit({ type: 'boom', pos: s.center(ctx.tgt), r: 2, color: '#ff8a4a', kind: 'big' }); }
        },
      });
      sim.emit({ type: 'dash', unit: u });
    },
    a2(sim, u) {
      u.vy = 8; u.grounded = false; pulse(sim, u, u.pos, 3.2, '#ffd23f', 'slam');
      sim.area(u.pos, 3.4, (e) => { sim.damage(e, 55, u, { kind: 'uppercut' }); e.vy = Math.max(e.vy, 9); e.grounded = false; sim.stun(e, 0.5); }, { enemiesOf: u.team, y: false });
    },
    ult(sim, u) {
      const dir = flat(sim.aimDir(u)); u.s.ulting = true;
      dash(sim, u, dir, 8, 1.9, { vy: 16 });
      u.s.onLand = (s, me) => { me.dash = null; me.s.ulting = false; slam(s, me, 12, 120, 60, 9, '#ffd23f'); s.area(me.pos, 12, (e) => s.addStatus(e, 'slow', 3, { f: 0.5 }), { enemiesOf: me.team }); };
    },
  },
  // ================================================================== BASTILLE
  bastille: {
    update(sim, u, dt) {
      const firing = u.in.fire1 && sim.canAct(u) && u.reloadT <= 0;
      u.s.spun = clamp((u.s.spun || 0) + (firing ? dt / 0.45 : -dt * 2.2), 0, 1);
      const w = u.s.wall; if (w) { w.t -= dt; if (w.t <= 0 || w.hp <= 0) u.s.wall = null; }
      if (u.st.fortify && !u.s.fortified) u.s.fortified = true;
    },
    canFire1: (sim, u) => (u.s.spun || 0) >= 0.98,
    secondary(sim, u, dt, held) { u.s.bunker = !!(held && u.grounded && !u.dash && sim.canAct(u)); },
    a1(sim, u) { sim.addStatus(u, 'fortify', 4); sim.addStatus(u, 'resist', 4, { f: 0.5 }); u.shield = Math.max(u.shield, 100); u.shieldDecay = 25; pulse(sim, u, u.pos, 3, '#e8d34a'); },
    a2(sim, u) {
      const f = flat(sim.aimDir(u)), pos = v3.madd(u.pos, f, 6); pos[1] = sim.groundAt(pos[0], pos[2], u.pos[1] + 0.6, 0.5) + 0.01;
      u.s.wall = { pos: [pos[0], pos[1] + 1.25, pos[2]], yaw: Math.atan2(f[0], f[2]), hp: 500, max: 500, t: 10, up: true };
      pulse(sim, u, pos, 3, '#e8d34a');
    },
    ult(sim, u) {
      const target = aimPoint(sim, u, 60), shells = [];
      sim.addZone({ kind: 'barrage', pos: [...target], r: 12, t: 4.8, team: u.team, owner: u, next: 0, shells, n: 0,
        update(sm, z, dt) {
          if (z.age < 4 && z.n < 16) { z.next -= dt; if (z.next <= 0) { z.next = 0.25; z.n++; const a = sm.rand() * 6.283, r = Math.sqrt(sm.rand()) * z.r, p = [z.pos[0] + Math.cos(a) * r, z.pos[1], z.pos[2] + Math.sin(a) * r]; shells.push({ p, t: 0.9 }); sm.emit({ type: 'shell', pos: p }); } }
          for (const sh of shells) { sh.t -= dt; if (sh.t <= 0 && !sh.done) { sh.done = true; const hp = groundPoint(sm, sh.p); sm.emit({ type: 'boom', pos: hp, r: 3.2, color: '#ffb061', kind: 'big' }); sm.area(hp, 3.2, (e, d) => sm.damage(e, 65 * (1 - clamp(d / 3.2, 0, 1) * 0.4), z.owner, { kind: 'splash' }), { enemiesOf: z.team, los: true }); } }
        } });
    },
  },
  // ================================================================== SABRE
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
  // ================================================================== RANGER
  ranger: {
    update(sim, u, dt) {
      const f = u.s.fan;
      if (f) { f.t -= dt; if (f.t <= 0) { if (u.ammo > 0) { f.t = 0.075; u.ammo--; const w = u.def.w1, o = sim.eye(u), dir = sim.spread(sim.aimDir(u), 6), hit = sim.trace(o, dir, w.range, { team: u.team, skip: u }); sim.bulletHit(u, w, hit, o, 30); sim.emit({ type: 'tracer', from: sim.muzzle(u), to: hit.point, color: w.tracer, hit: hit.kind, unit: u }); sim.emit({ type: 'shot', unit: u, sound: 'cannon' }); } else u.s.fan = null; } }
      const n = u.s.noon;
      if (n) {
        n.t -= dt; n.el += dt;
        const o = sim.eye(u), fw = sim.aimDir(u);
        for (const e of sim.enemies(u)) {
          const c = sim.center(e), d = v3.sub(c, o), l = v3.len(d);
          if (l < 90 && v3.dot(v3.norm(d), fw) > 0.5 && sim.los(o, c)) { const pr = Math.min(1, (n.marks.get(e.id) || 0) + dt / 0.9); if (!n.marks.has(e.id)) sim.emit({ type: 'pulse', pos: c, r: 1.5, color: '#ff4a2a', kind: 'ring' }); n.marks.set(e.id, pr); }
        }
        if (n.t <= 0 || (u.in.fire1 && n.el > 1.2)) {
          for (const [id, pr] of n.marks) { const e = sim.units.find((x) => x.id === id); if (e && e.alive && pr > 0.25 && sim.los(o, sim.center(e))) { sim.damage(e, 80 + 130 * pr, u, { crit: true, kind: 'noon', point: sim.center(e) }); sim.emit({ type: 'tracer', from: sim.muzzle(u), to: sim.center(e), color: '#ff7a3a', hit: 'lance', width: 2 }); } }
          sim.emit({ type: 'shot', unit: u, sound: 'lance' }); u.s.noon = null; u.s.ulting = false; delete u.st.deadeye;
        }
      }
    },
    canFire1: (sim, u) => !u.s.noon && !u.s.fan,
    secondary(sim, u, dt, held, pressed) { if (pressed && u.ammo > 0 && !u.s.fan && u.reloadT <= 0 && !u.s.noon) u.s.fan = { t: 0 }; },
    a1(sim, u) { dash(sim, u, moveDir(sim, u), 11, 0.35); u.ammo = u.def.w1.ammo; u.reloadT = 0; sim.emit({ type: 'dash', unit: u }); },
    a2(sim, u) {
      lob(sim, u, { speed: 28, dmg: 0, radius: 0.25, color: '#ffffff', size: 0.16, gravity: -12, life: 1.1, explodeOnExpire: true,
        onHit(s, p) {
          s.emit({ type: 'boom', pos: [...p.pos], r: 4, color: '#ffffff', kind: 'big' }); s.emit({ type: 'flash', pos: [...p.pos], r: 8 });
          s.area(p.pos, 4.2, (e) => { s.damage(e, 25, p.owner, { kind: 'splash' }); s.stun(e, 0.9); }, { enemiesOf: p.team, los: true });
        } });
    },
    ult(sim, u) { u.s.noon = { t: 4.5, el: 0, marks: new Map() }; u.s.ulting = true; sim.addStatus(u, 'deadeye', 4.6); },
  },
  // ================================================================== CINDER
  cinder: {
    fire1(sim, u) { fireProj(sim, u, u.def.w1); },
    secondary(sim, u, dt, held, pressed) {
      if (!pressed || u.cd.w2 > 0) return;
      u.cd.w2 = 5; const f = flat(sim.aimDir(u));
      cone(sim, u, 6.5, 80, (e) => { sim.damage(e, 35, u, { kind: 'burst' }); sim.knock(e, [f[0] * 11, 4, f[2] * 11]); sim.addStatus(e, 'burn', 2, { dps: 10, src: u }); });
      pulse(sim, u, v3.madd(sim.eye(u), sim.aimDir(u), 1.5), 3, '#ff8a2a', 'sweep');
      sim.emit({ type: 'shot', unit: u, sound: 'burst' });
    },
    a1(sim, u) { const from = [...u.pos], to = placeFloor(sim, from, flat(sim.aimDir(u)), 9); sim.emit({ type: 'blink', from: [...from], to: [...to], color: '#ff8a2a' }); u.pos = to; u.vx *= 0.3; u.vz *= 0.3; },
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
  // ================================================================== VESPER
  vesper: {
    update(sim, u, dt) {
      u.s.charge = clamp((u.s.charge || 0) + (u.s.scoped ? dt * 1.15 : -dt * 3), 0, 1);
      const L = u.s.lance; if (L && L.t > 0) { L.t -= dt; if (L.t <= 0) L.ready = true; }
      if (u.reloadT > 0) u.s.scoped = false;
    },
    secondary(sim, u, dt, held) { u.s.scoped = held && u.reloadT <= 0 && u.alive; },
    canFire1: (sim, u) => !(u.s.lance && !u.s.lance.ready),
    fire1(sim, u) {
      const w = u.def.w1, o = sim.eye(u), L = u.s.lance;
      const dir = sim.spread(sim.aimDir(u), u.s.scoped ? 0 : w.spread * (u.moving > 1 ? 1.4 : 0.5)), mz = sim.muzzle(u);
      if (L && L.ready) {
        u.s.lance = null; u.s.ulting = false;
        const end = v3.madd(o, dir, 120);
        for (const e of sim.enemies(u)) { const h = sim.rayUnit(o, dir, 120, e); if (h) sim.damage(e, 250, u, { head: h.head, crit: h.head, point: sim.center(e), kind: 'lance' }); }
        sim.emit({ type: 'tracer', from: mz, to: end, color: '#b6ff4a', width: 3, hit: 'lance' });
        sim.emit({ type: 'shot', unit: u, sound: 'lance' }); u.s.charge = 0; return true;
      }
      const dmg = w.dmg + (u.s.scoped ? 100 * (u.s.charge || 0) : 0);
      const hit = sim.trace(o, dir, w.range, { team: u.team, skip: u });
      if (hit.kind === 'unit') { u._hitShot = true; const r = sim.critRoll(u, hit.head, w); sim.damage(hit.unit, dmg * r.mul, u, { head: hit.head, crit: r.crit, point: hit.point }); }
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
  // ================================================================== FLICKER
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
      sim.damage(best, behind ? 90 : 55, u, { kind: 'melee', head: behind, crit: behind, point: sim.center(best) });
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
          onEnd(sm, z) { sm.emit({ type: 'boom', pos: [...z.pos], r: 5, color: '#40e0ff', kind: 'big' }); sm.area(z.pos, 5, (e, d) => sm.damage(e, 220 * (1 - clamp(d / 5, 0, 1) * 0.5), z.owner, { kind: 'splash' }), { enemiesOf: z.team, los: true }); } });
      } }, projDir(sim, u));
    },
  },
  // ================================================================== SHADE
  shade: {
    update(sim, u, dt) {
      const b = u.s.beacon; if (b) { b.t -= dt; if (b.t <= 0) u.s.beacon = null; }
      const h = u.s.hack;
      if (h) {
        h.t -= dt; const o = sim.eye(u);
        if (!h.tgt.alive || v3.dist(u.pos, h.tgt.pos) > 18 || !sim.los(o, sim.center(h.tgt)) || !sim.canAct(u)) { u.s.hack = null; u.s.hacking = false; u.cd.w2 = 2; }
        else if (h.t <= 0) { sim.addStatus(h.tgt, 'silenced', 4); sim.addStatus(h.tgt, 'reveal', 4); sim.emit({ type: 'pulse', pos: sim.center(h.tgt), r: 2, color: '#ff3d9a', kind: 'ring' }); u.s.hack = null; u.s.hacking = false; u.cd.w2 = 8; }
      }
    },
    secondary(sim, u, dt, held, pressed) {
      if (!pressed || u.cd.w2 > 0 || u.s.hack) return;
      const t = pickEnemy(sim, u, 16, 14); if (!t) return;
      u.s.hack = { tgt: t, t: 1.2 }; u.s.hacking = true; if (u.st.cloak) delete u.st.cloak;
    },
    a1(sim, u) { sim.addStatus(u, 'cloak', 6); pulse(sim, u, sim.center(u), 2, '#ff3d9a'); },
    a2(sim, u) {
      if (!u.s.beacon) { u.s.beacon = { pos: [...u.pos], t: 20 }; sim.emit({ type: 'pulse', pos: [...u.pos], r: 1.4, color: '#ff3d9a', kind: 'ring' }); return false; }
      sim.emit({ type: 'blink', from: [...u.pos], to: [...u.s.beacon.pos], color: '#ff3d9a' }); u.pos = [...u.s.beacon.pos]; u.vy = 0; u.s.beacon = null; u.hist = [];
    },
    ult(sim, u) {
      pulse(sim, u, sim.center(u), 14, '#ff3d9a', 'ring'); sim.emit({ type: 'boom', pos: sim.center(u), r: 6, color: '#ff3d9a', kind: 'big' });
      sim.area(u.pos, 14, (e) => {
        sim.addStatus(e, 'silenced', 3.5); e.shield = 0; sim.damage(e, 30, u, { kind: 'emp' });
        const b = e.s.barrier; if (b) { b.up = false; b.broken = 6; b.hp = 0; } if (e.s.wall) e.s.wall = null;
      }, { enemiesOf: u.team, los: true });
    },
  },
  // ================================================================== TRAPPER
  trapper: {
    secondary(sim, u, dt, held, pressed) {
      if (!pressed || u.cd.w2 > 0) return; u.cd.w2 = 7;
      lob(sim, u, { speed: 24, dmg: 0, radius: 0.2, color: '#f4a23a', size: 0.2, gravity: -14, life: 3, explodeOnExpire: true,
        onHit(s, p) {
          const mine = s.zones.filter((z) => z.kind === 'trap' && z.owner === p.owner); if (mine.length >= 2) mine[0].t = 0;
          s.addZone({ kind: 'trap', pos: groundPoint(s, p.pos), r: 1.6, t: 45, team: p.team, owner: p.owner,
            update(sm, z) {
              if (z.age < 0.8) return;
              for (const e of sm.enemies(z.owner)) if (!e.deploy && v3.dist2d(e.pos, z.pos) < z.r && Math.abs(e.pos[1] - z.pos[1]) < 1.6) { sm.addStatus(e, 'root', 2.5); sm.damage(e, 40, z.owner, { kind: 'trap' }); sm.emit({ type: 'boom', pos: z.pos, r: 2, color: '#f4a23a', kind: 'small' }); z.t = 0; break; }
            } });
        } });
    },
    a1(sim, u) {
      lob(sim, u, { speed: 22, dmg: 0, radius: 0.2, color: '#c9c9c9', size: 0.18, gravity: -14, life: 3, explodeOnExpire: true,
        onHit(s, p) {
          s.addZone({ kind: 'caltrops', pos: groundPoint(s, p.pos), r: 4.5, t: 6, team: p.team, owner: p.owner,
            update(sm, z, dt) { sm.area(z.pos, z.r, (e) => { if (e.deploy) return; sm.addStatus(e, 'slow', 0.4, { f: 0.6 }); sm.damage(e, 14 * dt, z.owner, { silent: true, kind: 'trap' }); }, { enemiesOf: z.team, y: false }); } });
        } });
    },
    a2(sim, u) {
      const t = pickEnemy(sim, u, 70, 10); if (!t) return false;
      sim.addStatus(t, 'marked', 6, { f: 0.3 }); sim.addStatus(t, 'reveal', 6); sim.emit({ type: 'pulse', pos: sim.center(t), r: 2, color: '#f4a23a', kind: 'ring' });
    },
    ult(sim, u) {
      lob(sim, u, { speed: 26, dmg: 0, radius: 0.3, color: '#f4a23a', size: 0.4, gravity: -10, life: 2.5, explodeOnExpire: true,
        onHit(s, p) {
          s.emit({ type: 'boom', pos: [...p.pos], r: 8, color: '#f4a23a', kind: 'big' });
          s.addZone({ kind: 'pit', pos: groundPoint(s, p.pos), r: 8, t: 3, team: p.team, owner: p.owner });
          s.area(p.pos, 8, (e) => { s.damage(e, 100, p.owner, { kind: 'splash' }); s.addStatus(e, 'root', 3); }, { enemiesOf: p.team, los: true });
        } });
    },
  },
  // ================================================================== SKYHAWK
  skyhawk: {
    update(sim, u, dt) {
      u.s.fuel ??= 100;
      const burning = u.in.jump && !u.grounded && u.s.fuel > 0 && sim.canAct(u) && !u.st.hover;
      if (burning) { u.vy = Math.min(7, u.vy + 30 * dt); u.s.fuel = Math.max(0, u.s.fuel - 38 * dt); }
      u.s.flying = burning || !!u.st.hover;
      if (u.grounded) u.s.fuel = Math.min(100, u.s.fuel + 60 * dt); else if (!burning) u.s.fuel = Math.min(100, u.s.fuel + 12 * dt);
      const b = u.s.barrage;
      if (b) {
        b.t -= dt; b.acc += dt * 9.3;
        while (b.acc >= 1) { b.acc -= 1; sim.spawnProj(u, { speed: 40, dmg: 32, splash: 1.8, splashDmg: 18, radius: 0.22, color: '#ffa04a', size: 0.14, life: 3, sfxKind: 'rocket' }, projDir(sim, u, 4)); }
        if (b.t <= 0) { u.s.barrage = null; u.s.ulting = false; delete u.st.hoverLock; }
      }
    },
    fire1(sim, u) { fireProj(sim, u, u.def.w1); },
    secondary(sim, u, dt, held, pressed) {
      if (!pressed || u.cd.w2 > 0) return; u.cd.w2 = 9;
      lob(sim, u, { speed: 38, dmg: 10, radius: 0.4, color: '#9fd0ff', size: 0.3, life: 1.2, explodeOnExpire: true, splash: 3, splashDmg: 10, knock: 14, sfxKind: 'rocket',
        onHit(s, p, hit) {
          s.emit({ type: 'boom', pos: [...p.pos], r: 3, color: '#9fd0ff', kind: 'big' });
          s.area(p.pos, 3.4, (e) => { if (e.team === p.team) return; const dir = v3.norm(v3.sub(s.center(e), p.pos)); s.damage(e, 10, p.owner, { kind: 'splash' }); s.knock(e, [dir[0] * 15, 4, dir[2] * 15]); }, { enemiesOf: p.team });
          const self = p.owner, ds = v3.dist(s.center(self), p.pos); if (ds < 4) { const dir = v3.norm(v3.sub(s.center(self), p.pos)); self.vx += dir[0] * 10; self.vz += dir[2] * 10; self.vy = Math.max(self.vy, 6); self.grounded = false; }
        } });
    },
    a1(sim, u) { u.vy = 12.5; u.grounded = false; pulse(sim, u, u.pos, 2.5, '#ffa04a', 'slam'); sim.emit({ type: 'dash', unit: u }); },
    a2(sim, u) { sim.addStatus(u, 'hover', 4); pulse(sim, u, sim.center(u), 2, '#9fd0ff'); },
    ult(sim, u) { u.s.barrage = { t: 3.2, acc: 0 }; u.s.ulting = true; sim.addStatus(u, 'hover', 3.4); sim.addStatus(u, 'hoverLock', 3.4); },
  },
  // ================================================================== RIFTWALKER
  riftwalker: {
    secondary(sim, u, dt, held, pressed) {
      if (!pressed || u.cd.w2 > 0) return; u.cd.w2 = 11;
      lob(sim, u, { speed: 50, dmg: 0, radius: 0.3, color: '#c06bff', size: 0.22, life: 1.2,
        onHit(s, p, hit) {
          if (hit.kind !== 'unit' || hit.unit.team === p.team || hit.unit.deploy) return;
          const o = p.owner, e = hit.unit, a = [...o.pos], b = [...e.pos];
          s.emit({ type: 'blink', from: a, to: b, color: '#c06bff' }); s.emit({ type: 'blink', from: b, to: a, color: '#c06bff' });
          o.pos = b; e.pos = a; o.vx = o.vz = o.vy = e.vx = e.vz = e.vy = 0; s.stun(e, 0.3);
        } });
    },
    a1(sim, u) { return placePortal(sim, u, 'A'); },
    a2(sim, u) { return placePortal(sim, u, 'B'); },
    ult(sim, u) {
      const target = aimPoint(sim, u, 36), pos = groundPoint(sim, target);
      sim.addZone({ kind: 'stasis', pos, r: 9, t: 3, team: u.team, owner: u });
      sim.emit({ type: 'boom', pos, r: 9, color: '#c06bff', kind: 'big' });
      sim.area(pos, 9, (e) => { sim.addStatus(e, 'frozen', 3); if (e.dash) e.dash = null; }, { enemiesOf: u.team });
    },
  },
  // ================================================================== HALO
  halo: {
    secondary(sim, u, dt, held) {
      if (!held) { u.s.beam = null; return; }
      let t = u.s.beam;
      if (!t || !t.alive || v3.dist(u.pos, t.pos) > 26 || !sim.los(sim.eye(u), sim.center(t)) || (t.hp >= t.maxHp && sim.time % 1 < dt)) t = pickAlly(sim, u, 24, 20);
      u.s.beam = t || null;
      if (t) sim.heal(t, 70 * dt, u);
    },
    a1(sim, u) {
      const t = pickAlly(sim, u, 40, 30), dir = t ? flat(v3.sub(t.pos, u.pos)) : flat(sim.aimDir(u));
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
  // ================================================================== SERENE
  serene: {
    secondary(sim, u, dt, held) { u.s.scoped = held && u.reloadT <= 0; },
    fire1(sim, u) {
      const w = u.def.w1, o = sim.eye(u), dir = sim.spread(sim.aimDir(u), u.s.scoped ? 0 : w.spread * (u.moving > 1 ? 1.6 : 1)), mz = sim.muzzle(u);
      // heal shots help allies near the crosshair a little: the nearest ally within 3 degrees takes the shot
      let hit = sim.trace(o, dir, w.range, { team: u.team, skip: u, allies: true });
      if (hit.kind === 'unit') {
        if (hit.unit.team === u.team) { if (!hit.unit.deploy) { sim.heal(hit.unit, w.heal, u); sim.emit({ type: 'pulse', pos: sim.center(hit.unit), r: 1.4, color: '#9affc4', kind: 'ring' }); } }
        else { const r = sim.critRoll(u, hit.head, w); u._hitShot = true; sim.damage(hit.unit, w.dmg * r.mul, u, { head: hit.head, crit: r.crit, point: hit.point }); }
      } else if (hit.kind === 'barrier') sim.hitBarrier(hit.unit, w.dmg, u, hit.point);
      else if (hit.kind === 'world') sim.emit({ type: 'impact', point: hit.point, normal: hit.normal, color: w.tracer });
      sim.emit({ type: 'tracer', from: mz, to: hit.point, color: w.tracer, width: 1.4, hit: hit.kind, unit: u });
      sim.emit({ type: 'shot', unit: u, sound: w.sound });
    },
    a1(sim, u) {
      sim.spawnProj(u, { speed: 60, dmg: 0, radius: 0.18, color: '#7a4bff', size: 0.14, life: 1.5, onHit(s, p, hit) {
        if (hit.kind === 'unit' && hit.unit.team !== p.team && !hit.unit.deploy) { s.addStatus(hit.unit, 'sleep', 3.5); s.emit({ type: 'pulse', pos: s.center(hit.unit), r: 1.8, color: '#7a4bff', kind: 'ring' }); }
      } }, projDir(sim, u));
    },
    a2(sim, u) {
      lob(sim, u, { speed: 24, dmg: 0, radius: 0.25, color: '#9affc4', size: 0.24, gravity: -10, life: 1.4, explodeOnExpire: true,
        onHit(s, p) {
          s.emit({ type: 'boom', pos: [...p.pos], r: 4, color: '#9affc4', kind: 'big' });
          s.area(p.pos, 4.2, (a) => { if (a.team === p.team) { if (!a.deploy) { s.heal(a, 80, p.owner); s.addStatus(a, 'healAmp', 4, { f: 0.5 }); } } else { s.damage(a, 60, p.owner, { kind: 'splash' }); s.addStatus(a, 'nohealing', 4); } }, { los: true });
        } });
    },
    ult(sim, u) {
      const t = pickAlly(sim, u, 50, 22) || sim.allies(u).filter((a) => v3.dist(a.pos, u.pos) < 50 && sim.los(sim.eye(u), sim.center(a))).sort((a, b) => a.hp - b.hp)[0];
      if (!t) return false;
      sim.addStatus(t, 'nano', 8); pulse(sim, u, sim.center(t), 3, '#f6c453', 'ring'); sim.emit({ type: 'boom', pos: sim.center(t), r: 3, color: '#f6c453', kind: 'big' });
    },
  },
  // ================================================================== PYLON
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
  // ================================================================== ZEPHYR
  zephyr: {
    update(sim, u, dt) {
      u.s.aura ||= 'heal';
      if (!sim.canAct(u)) return;
      sim.area(u.pos, 10, (a) => { if (a.deploy) return; if (u.s.aura === 'heal') sim.heal(a, 25 * dt, u); else sim.addStatus(a, 'speed', 0.4, { f: 0.3 }); }, { alliesOf: u.team, y: false });
    },
    secondary(sim, u, dt, held, pressed) {
      if (!pressed || u.cd.w2 > 0) return; u.cd.w2 = 0.8; u.s.aura = u.s.aura === 'heal' ? 'speed' : 'heal';
      sim.emit({ type: 'pulse', pos: sim.center(u), r: 3, color: u.s.aura === 'heal' ? '#59f0a8' : '#ffb02e', kind: 'ring' });
    },
    a1(sim, u) { const f = flat(sim.aimDir(u)); cone(sim, u, 7, 75, (e) => { sim.damage(e, 30, u, { kind: 'burst' }); sim.knock(e, [f[0] * 14, 4, f[2] * 14]); }); pulse(sim, u, v3.madd(sim.eye(u), sim.aimDir(u), 1.5), 3.5, '#ff8fd0', 'sweep'); },
    a2(sim, u) { dash(sim, u, flat(sim.aimDir(u)), 16, 0.35, { vy: 3.5 }); sim.emit({ type: 'dash', unit: u }); },
    ult(sim, u) { pulse(sim, u, sim.center(u), 22, '#59f0a8'); sim.area(u.pos, 22, (a) => { if (a.deploy) return; a.shield = Math.max(a.shield, 300); a.shieldDecay = 50; }, { alliesOf: u.team }); },
  },
  // ================================================================== CANTOR
  cantor: {
    update(sim, u, dt) {
      const h = u.s.harmony;
      if (h) { if (!h.alive || v3.dist(h.pos, u.pos) > 48) u.s.harmony = null; else sim.heal(h, 28 * dt, u); }
      const T = u.s.trans; if (T) { T.t -= dt; sim.area(u.pos, 16, (a) => { if (!a.deploy) sim.heal(a, 150 * dt, u); }, { alliesOf: u.team }); if (T.t <= 0) { u.s.trans = null; u.s.ulting = false; u.s.channel = false; } }
    },
    fire1(sim, u) { fireProj(sim, u, u.def.w1); },
    secondary(sim, u, dt, held, pressed) {
      if (!pressed || u.cd.w2 > 0) return;
      const t = pickAlly(sim, u, 45, 16); if (!t) { u.cd.w2 = 0.2; return; }
      u.s.harmony = t; u.cd.w2 = 0.6; sim.emit({ type: 'pulse', pos: sim.center(t), r: 1.8, color: '#7ff0ff', kind: 'ring' });
    },
    a1(sim, u) { const t = pickEnemy(sim, u, 55, 12); if (!t) return false; sim.addStatus(t, 'discord', 6, { f: 0.25 }); sim.addStatus(t, 'reveal', 6); sim.emit({ type: 'pulse', pos: sim.center(t), r: 2, color: '#b36bff', kind: 'ring' }); },
    a2(sim, u) { const f = flat(sim.aimDir(u)); let n = 0; cone(sim, u, 3.4, 80, (e) => { n++; sim.damage(e, 45, u, { kind: 'melee' }); sim.knock(e, [f[0] * 14, 3, f[2] * 14]); sim.stun(e, 0.3); }); pulse(sim, u, v3.madd(sim.eye(u), sim.aimDir(u), 1.4), 2, '#7ff0ff', 'slash'); if (!n) return true; },
    ult(sim, u) { u.s.ulting = true; u.s.channel = true; u.s.trans = { t: 6 }; sim.addStatus(u, 'phased', 6); pulse(sim, u, sim.center(u), 16, '#7ff0ff'); },
  },
  // ================================================================== SIPHON
  siphon: {
    update(sim, u, dt) {
      u.s.drainAcc ||= 0;
      if (!(u.in.fire1 && sim.canAct(u))) { u.s.drainT = null; }
      const C = u.s.coal;
      if (C) {
        C.t -= dt; const o = sim.eye(u), d = sim.aimDir(u);
        unitsOnLine(sim, o, d, 20, 1.3, (t) => { if (t === u) return; if (t.team === u.team) { if (!t.deploy) sim.heal(t, 130 * dt, u, { quiet: true }); } else sim.damage(t, 70 * dt, u, { silent: true, kind: 'drain' }); });
        if (C.t <= 0) { u.s.coal = null; u.s.ulting = false; }
      }
    },
    fire1(sim, u) {
      const w = u.def.w1, o = sim.eye(u);
      let t = u.s.drainT;
      if (!t || !t.alive || t.team === u.team || v3.dist(sim.eye(u), sim.center(t)) > w.range + 1.5 || !sim.los(o, sim.center(t))) t = u.s.drainT = pick(sim, u, sim.enemies(u), w.range, 16);
      if (!t) return false;
      const dmg = w.dmg * (sim.critRoll(u, false, w).mul), dealt = sim.damage(t, dmg, u, { silent: true, kind: 'drain', point: sim.center(t) });
      u._hitShot = true; sim.heal(u, dealt * w.heal, u, { quiet: true });
      u.s.drainAcc += dealt; if (sim.time - (u.s.drainEmit || 0) > 0.25) { u.s.drainEmit = sim.time; sim.emit({ type: 'dmg', tgt: t, src: u, amt: u.s.drainAcc, head: false, crit: false, point: sim.center(t), kind: 'drain' }); u.s.drainAcc = 0; }
      if (sim.time - (u.s.drainSnd || 0) > 0.3) { u.s.drainSnd = sim.time; sim.emit({ type: 'shot', unit: u, sound: 'beam' }); }
    },
    secondary(sim, u, dt, held, pressed) {
      if (!pressed || u.cd.w2 > 0) return; u.cd.w2 = 8;
      lob(sim, u, { speed: 18, dmg: 0, radius: 0.2, color: '#9aff4a', size: 0.22, gravity: -12, life: 2.5, explodeOnExpire: true,
        onHit(s, p) {
          s.addZone({ kind: 'orb', pos: groundPoint(s, p.pos), r: 5, t: 5, team: p.team, owner: p.owner,
            update(sm, z, dt) { sm.area(z.pos, z.r, (a) => { if (!a.deploy) sm.heal(a, 40 * dt, z.owner); }, { alliesOf: z.team }); } });
        } });
    },
    a1(sim, u) { sim.addStatus(u, 'phased', 1.3); dash(sim, u, moveDir(sim, u), 13, 0.5); pulse(sim, u, sim.center(u), 2, '#c68aff'); sim.emit({ type: 'dash', unit: u }); },
    a2(sim, u) {
      lob(sim, u, { speed: 18, dmg: 0, radius: 0.2, color: '#b03aff', size: 0.22, gravity: -12, life: 2.5, explodeOnExpire: true,
        onHit(s, p) {
          s.addZone({ kind: 'decay', pos: groundPoint(s, p.pos), r: 5, t: 6, team: p.team, owner: p.owner,
            update(sm, z, dt) { sm.area(z.pos, z.r, (e) => { if (e.deploy) return; const dd = sm.damage(e, 35 * dt, z.owner, { silent: true, kind: 'drain' }); sm.heal(z.owner, dd * 0.5, z.owner, { quiet: true }); }, { enemiesOf: z.team }); } });
        } });
    },
    ult(sim, u) { u.s.coal = { t: 5 }; u.s.ulting = true; },
  },
  // ================================================================== SION
  sion: {
    canFire1: (sim, u) => !u.s.chg,
    fire1(sim, u) {
      const w = u.def.w1, o = sim.eye(u), f = sim.aimDir(u), cosA = Math.cos(w.arc * Math.PI / 360); let any = false;
      for (const e of sim.enemies(u)) {
        const cc = sim.center(e), d = v3.sub(cc, o), l = v3.len(d);
        if (l - e.def.radius > w.range || v3.dot(v3.norm(d), f) < cosA || !sim.los(o, cc)) continue;
        const r = sim.critRoll(u, false, w); u._hitShot = true; any = true; sim.damage(e, w.dmg * r.mul, u, { crit: r.crit, kind: 'melee', point: cc });
        const ff = flat(d); sim.knock(e, [ff[0] * 2.5, 0.6, ff[2] * 2.5]);
        if (u.st.furnace) u.shield = Math.min(600, u.shield + 20);
      }
      u.stats.shots++; if (any) u.stats.hits++;
      pulse(sim, u, v3.madd(o, f, 1.8), 2.2, '#ff4a2a', 'slash'); sim.emit({ type: 'shot', unit: u, sound: 'punch' });
    },
    secondary(sim, u, dt, held) {
      if (held && u.cd.w2 <= 0 && sim.canAct(u) && !u.dash) { u.s.chg = Math.min(1.5, (u.s.chg || 0) + dt); sim.addStatus(u, 'slow', 0.15, { f: 0.45 }); return; }
      if (!u.s.chg) return;
      const c = u.s.chg; u.s.chg = 0; if (c < 0.25 || u.cd.w2 > 0) return; u.cd.w2 = 7;
      const dmg = 60 + 100 * (c / 1.5), big = c >= 1;
      cone(sim, u, 5.8, 130, (e, l, d) => { sim.damage(e, dmg, u, { kind: 'smash', point: sim.center(e) }); if (big) { e.vy = Math.max(e.vy, 9); e.grounded = false; sim.stun(e, 1.0); } else sim.knock(e, [d[0] * 6, 3, d[2] * 6]); });
      const p = v3.madd(u.pos, flat(sim.aimDir(u)), 3.4); sim.emit({ type: 'boom', pos: [p[0], u.pos[1] + 0.3, p[2]], r: 4, color: '#ff7a3a', kind: 'slam' });
    },
    a1(sim, u) { u.shield = Math.max(u.shield, 250); u.shieldDecay = 42; sim.addStatus(u, 'furnace', 6); pulse(sim, u, sim.center(u), 2.6, '#ff4a2a'); },
    a2(sim, u) {
      pulse(sim, u, u.pos, 9, '#ff4a2a', 'slam');
      sim.area(u.pos, 9, (e) => { if (!e.deploy) sim.addStatus(e, 'slow', 3, { f: 0.35 }); }, { enemiesOf: u.team, y: false });
      sim.addStatus(u, 'fortify', 3); sim.addStatus(u, 'resist', 3, { f: 0.25 });
    },
    ult(sim, u) {
      const dir = flat(sim.aimDir(u)), hitSet = new Set(), ctx = { wall: false }; u.s.ulting = true; sim.addStatus(u, 'fortify', 2.8);
      dash(sim, u, dir, 11.5, 2.6, {
        hit(s, me) {
          for (const e of s.enemies(me)) { if (hitSet.has(e) || v3.dist2d(e.pos, me.pos) > me.def.radius + e.def.radius + 0.7 || Math.abs(e.pos[1] - me.pos[1]) > 2) continue; hitSet.add(e); s.damage(e, 80, me, { kind: 'charge' }); s.knock(e, [dir[0] * 4 + -dir[2] * 7, 4, dir[2] * 4 + dir[0] * 7]); }
          if (s.rayWorld([me.pos[0], me.pos[1] + 1, me.pos[2]], dir, 1.8).t < 1.8) { ctx.wall = true; me.dash.t = 0; }
        },
        end(s, me) { me.s.ulting = false; if (ctx.wall) { slam(s, me, 6, 90, 50, 6, '#ff4a2a'); s.area(me.pos, 6, (e) => s.stun(e, 1.2), { enemiesOf: me.team }); } },
      });
      sim.emit({ type: 'dash', unit: u });
    },
    onDeath(sim, u) { sim.emit({ type: 'boom', pos: [u.pos[0], u.pos[1] + 0.5, u.pos[2]], r: 5, color: '#ff4a2a', kind: 'big' }); sim.area(u.pos, 5, (e, d) => { sim.damage(e, 90 * (1 - clamp(d / 5, 0, 1) * 0.4), u, { kind: 'splash' }); const dir = v3.sub(e.pos, u.pos); sim.knock(e, [dir[0] * 1.2, 5, dir[2] * 1.2]); }, { enemiesOf: u.team }); },
  },
  // ================================================================== STORMCALLER
  stormcaller: {
    fire1(sim, u) {
      const w = u.def.w1, o = sim.eye(u), dir = sim.spread(sim.aimDir(u), w.spread), hit = sim.trace(o, dir, w.range, { team: u.team, skip: u }), mz = sim.muzzle(u);
      sim.bulletHit(u, w, hit, o); sim.emit({ type: 'tracer', from: mz, to: hit.point, color: w.tracer, hit: hit.kind, unit: u });
      if (hit.kind === 'unit') {
        const n = u.st.overcharge ? 3 : 1, near = sim.enemies(u).filter((e) => e !== hit.unit && !e.deploy && v3.dist(sim.center(e), hit.point) < 8).sort((a, b) => v3.dist(sim.center(a), hit.point) - v3.dist(sim.center(b), hit.point)).slice(0, n);
        for (const e of near) { sim.damage(e, w.dmg * 0.5, u, { kind: 'chain', point: sim.center(e) }); sim.emit({ type: 'tracer', from: hit.point, to: sim.center(e), color: '#bffaff', hit: 'unit', unit: u }); }
      }
      sim.emit({ type: 'shot', unit: u, sound: w.sound });
    },
    secondary(sim, u, dt, held, pressed) {
      if (!pressed || u.cd.w2 > 0) return; u.cd.w2 = 6;
      cone(sim, u, 9, 100, (e) => { sim.damage(e, 35, u, { kind: 'shock', point: sim.center(e) }); sim.addStatus(e, 'slow', 2, { f: 0.4 }); });
      pulse(sim, u, sim.center(u), 6, '#6ff3ff', 'sweep');
    },
    a1(sim, u) {
      const from = [...u.pos], to = placeFloor(sim, u.pos, flat(sim.aimDir(u)), 10);
      sim.emit({ type: 'blink', from, to, color: '#6ff3ff' });
      sim.emit({ type: 'boom', pos: [from[0], from[1] + 0.5, from[2]], r: 4, color: '#6ff3ff', kind: 'big' });
      sim.area(from, 4, (e) => sim.damage(e, 40, u, { kind: 'splash' }), { enemiesOf: u.team });
      u.pos = to; u.vy = 0; u.hist = [];
    },
    a2(sim, u) { sim.addStatus(u, 'overcharge', 5); sim.addStatus(u, 'critBuff', 5); pulse(sim, u, sim.center(u), 2.5, '#6ff3ff'); },
    ult(sim, u) {
      sim.addZone({ kind: 'timer', pos: [...u.pos], r: 25, t: 4.4, team: u.team, owner: u, next: 0, n: 0,
        update(sm, z, dt) {
          if (z.n >= 14) return; z.next -= dt; if (z.next > 0) return; z.next = 0.28; z.n++;
          const foes = sm.units.filter((e) => e.alive && e.team !== z.team && !e.deploy && v3.dist2d(e.pos, z.owner.pos) < 28 && !e.st.frozen);
          let p; if (foes.length) { const e = foes[Math.floor(sm.rand() * foes.length)]; p = [e.pos[0], e.pos[1], e.pos[2]]; } else { const a = sm.rand() * 6.283, r = 6 + sm.rand() * 14; p = [z.owner.pos[0] + Math.cos(a) * r, z.owner.pos[1], z.owner.pos[2] + Math.sin(a) * r]; }
          sm.emit({ type: 'tracer', from: [p[0], p[1] + 32, p[2]], to: [p[0], p[1] + 0.3, p[2]], color: '#bffaff', width: 3, hit: 'lance' });
          sm.emit({ type: 'boom', pos: [p[0], p[1] + 0.4, p[2]], r: 3, color: '#6ff3ff', kind: 'big' });
          sm.area(p, 3, (e, d) => sm.damage(e, 70 * (1 - clamp(d / 3, 0, 1) * 0.4), z.owner, { kind: 'splash' }), { enemiesOf: z.team });
        } });
    },
  },
  // ================================================================== RICOCHET
  ricochet: {
    update(sim, u, dt) { if (u.s.caromT > 0) { u.s.caromT -= dt; if (u.s.caromT <= 0) { u.s.carom = false; u.s.ulting = false; } } },
    fire1(sim, u) {
      const w = u.def.w1, o = sim.eye(u); let dir = sim.spread(sim.aimDir(u), w.spread * (u.moving > 1 ? 1 : 0.6)), from = o, range = w.range, first = true;
      const bounces = u.s.carom ? 2 : 1;
      if (u.st.overdrive) dir = sim.assist(u, dir);
      for (let i = 0; i <= bounces; i++) {
        const hit = sim.trace(from, dir, range, { team: u.team, skip: u }), mz = first ? sim.muzzle(u) : from;
        sim.bulletHit(u, w, hit, o, first ? null : w.dmg * 0.75); sim.emit({ type: 'tracer', from: mz, to: hit.point, color: w.tracer, hit: hit.kind, unit: u }); first = false;
        if (hit.kind !== 'world' || !hit.normal) break;
        const n = hit.normal, dd = v3.dot(dir, n); dir = v3.norm([dir[0] - 2 * dd * n[0], dir[1] - 2 * dd * n[1], dir[2] - 2 * dd * n[2]]); from = v3.madd(hit.point, n, 0.08); range -= hit.t; if (range < 3) break;
      }
      sim.emit({ type: 'shot', unit: u, sound: w.sound });
    },
    secondary(sim, u, dt, held, pressed) {
      if (!pressed || u.cd.w2 > 0) return; u.cd.w2 = 5; const hurt = new Set();
      let from = sim.eye(u), dir = sim.aimDir(u), range = 90, mz = sim.muzzle(u);
      for (let i = 0; i < 4; i++) {
        const hit = sim.trace(from, dir, range, { team: u.team, skip: u });
        unitsOnLine(sim, from, dir, Math.min(hit.t, range), 0.5, (t) => { if (t.team === u.team || hurt.has(t)) return; hurt.add(t); const r = sim.critRoll(u, false, u.def.w1); sim.damage(t, 70 * r.mul, u, { kind: 'bank', crit: r.crit, point: sim.center(t) }); });
        sim.emit({ type: 'tracer', from: mz, to: hit.point, color: '#ffd23f', width: 2, hit: 'lance', unit: u });
        if (hit.kind !== 'world' || !hit.normal) break;
        const n = hit.normal, dd = v3.dot(dir, n); dir = v3.norm([dir[0] - 2 * dd * n[0], dir[1] - 2 * dd * n[1], dir[2] - 2 * dd * n[2]]); from = v3.madd(hit.point, n, 0.08); mz = from; range -= hit.t; if (range < 3) break;
      }
      sim.emit({ type: 'shot', unit: u, sound: 'rail' });
    },
    a1(sim, u) { const f = flat(sim.aimDir(u)); dash(sim, u, [-f[0], 0, -f[2]], 12, 0.5, { vy: 7 }); sim.emit({ type: 'dash', unit: u }); },
    a2(sim, u) { cone(sim, u, 35, 130, (e) => { sim.addStatus(e, 'reveal', 4); }, { los: false }); pulse(sim, u, sim.center(u), 8, '#ffd23f', 'sweep'); },
    ult(sim, u) { sim.addStatus(u, 'overdrive', 6); u.s.carom = true; u.s.caromT = 6; u.s.ulting = true; pulse(sim, u, sim.center(u), 4, '#ffd23f'); },
  },
  // ================================================================== MIRAGE
  mirage: {
    secondary(sim, u, dt, held, pressed) {
      if (!pressed || u.cd.w2 > 0) return; u.cd.w2 = 9;
      u.s.decoy = decoy(sim, u, 'decoy', flat(sim.aimDir(u)), 1.4);
    },
    a1(sim, u) { sim.addStatus(u, 'cloak', 3); sim.addStatus(u, 'speed', 3, { f: 0.35 }); pulse(sim, u, sim.center(u), 2, '#ff7ad9'); },
    a2(sim, u) {
      const d = u.s.decoy; if (!d || !d.alive || !sim.units.includes(d)) return false;
      const a = [...u.pos], b = [...d.pos]; sim.emit({ type: 'blink', from: a, to: b, color: '#ff7ad9' }); u.pos = b; d.pos = a; u.vy = 0; u.hist = [];
    },
    ult(sim, u) {
      const f = flat(sim.aimDir(u)), r = [f[2], 0, -f[0]];
      [['decoy', f, 1.4], ['decoy2', v3.norm([f[0] + r[0] * 0.7, 0, f[2] + r[2] * 0.7]), 1.6], ['decoy3', v3.norm([f[0] - r[0] * 0.7, 0, f[2] - r[2] * 0.7]), 1.6]].forEach(([k, d, off]) => decoy(sim, u, k, d, off));
      sim.addStatus(u, 'cloak', 4); sim.addStatus(u, 'dmgBoost', 6, { f: 0.3 }); pulse(sim, u, sim.center(u), 5, '#ff7ad9');
    },
  },
  // ================================================================== LANTERN
  lantern: {
    secondary(sim, u, dt, held, pressed) {
      if (!pressed || u.cd.w2 > 0) return; u.cd.w2 = 10;
      lob(sim, u, { speed: 19, dmg: 0, radius: 0.2, color: '#fff2a8', size: 0.28, gravity: -12, life: 2.5, explodeOnExpire: true,
        onHit(s, p) {
          s.addZone({ kind: 'orb', pos: groundPoint(s, p.pos), r: 6, t: 8, team: p.team, owner: p.owner,
            update(sm, z, dt) { sm.area(z.pos, z.r, (a) => { if (!a.deploy) sm.heal(a, 30 * dt, z.owner); }, { alliesOf: z.team }); sm.area(z.pos, z.r, (e) => { if (!e.deploy) sm.addStatus(e, 'reveal', 0.6); }, { enemiesOf: z.team }); } });
        } });
    },
    a1(sim, u) { pulse(sim, u, u.pos, 10, '#fff2a8'); sim.area(u.pos, 10, (a) => { if (!a.deploy) sim.addStatus(a, 'speed', 3, { f: 0.3 }); }, { alliesOf: u.team, y: false }); },
    a2(sim, u) {
      pulse(sim, u, u.pos, 14, '#fff2a8', 'ring'); sim.area(u.pos, 30, (e) => { if (!e.deploy) sim.addStatus(e, 'reveal', 3); }, { enemiesOf: u.team });
      sim.area(u.pos, 12, (a) => { if (!a.deploy) sim.heal(a, 50, u); }, { alliesOf: u.team });
    },
    ult(sim, u) {
      pulse(sim, u, u.pos, 20, '#fff2a8', 'slam'); sim.emit({ type: 'boom', pos: [u.pos[0], u.pos[1] + 1, u.pos[2]], r: 6, color: '#fff2a8', kind: 'big' });
      sim.area(u.pos, 20, (a) => { if (a.deploy) return; sim.heal(a, 150, u); a.shield = Math.max(a.shield, 150); a.shieldDecay = 25; }, { alliesOf: u.team });
    },
  },
  // ================================================================== THORN
  thorn: {
    fire1(sim, u) { fireProj(sim, u, u.def.w1); },
    secondary(sim, u, dt, held, pressed) {
      if (!pressed || u.cd.w2 > 0) return; u.cd.w2 = 6;
      const t = pickAlly(sim, u, 45, 25) || u; sim.addStatus(t, 'regen', 5, { hps: 35, src: u, force: true }); pulse(sim, u, sim.center(t), 2, '#7dff8a');
    },
    a1(sim, u) {
      sim.spawnProj(u, { speed: 42, dmg: 10, radius: 0.3, color: '#7dff8a', size: 0.2, life: 1.2, gravity: 0, onHit(s, p, hit) { if (hit.kind === 'unit' && hit.unit.team !== p.team) { s.damage(hit.unit, 10, p.owner, { point: p.pos, kind: 'vine' }); s.addStatus(hit.unit, 'root', 1.6); s.emit({ type: 'pulse', pos: hit.unit.pos, r: 2, color: '#7dff8a', kind: 'ring' }); } } }, projDir(sim, u));
      sim.emit({ type: 'shot', unit: u, sound: 'orbit' });
    },
    a2(sim, u) {
      lob(sim, u, { speed: 20, dmg: 0, radius: 0.2, color: '#2f7a3a', size: 0.24, gravity: -13, life: 2.6, explodeOnExpire: true,
        onHit(s, p) { s.addZone({ kind: 'caltrops', pos: groundPoint(s, p.pos), r: 4.5, t: 6, team: p.team, owner: p.owner, update(sm, z, dt) { sm.area(z.pos, z.r, (e) => { if (e.deploy) return; sm.addStatus(e, 'slow', 0.4, { f: 0.4 }); sm.damage(e, 20 * dt, z.owner, { silent: true, kind: 'trap' }); }, { enemiesOf: z.team, y: false }); } }); } });
    },
    ult(sim, u) {
      pulse(sim, u, u.pos, 25, '#7dff8a', 'slam');
      sim.area(u.pos, 25, (a) => { if (a.deploy) return; sim.addStatus(a, 'regen', 8, { hps: 40, src: u, force: true }); a.shield = Math.max(a.shield, 150); a.shieldDecay = 18; }, { alliesOf: u.team });
      sim.area(u.pos, 12, (e) => { if (!e.deploy) sim.addStatus(e, 'root', 2); }, { enemiesOf: u.team });
    },
  },
};

// a hologram that runs ahead of its owner and soaks fire
function decoy(sim, u, kind, dir, off) {
  const p = placeFloor(sim, u.pos, dir, off), d = sim.spawnDeploy(u, kind, p, 80, { life: 6, dir });
  d.def = { ...d.def, radius: 0.4, height: u.def.height }; d.yaw = u.yaw; d.skin = u.skin;
  sim.emit({ type: 'pulse', pos: [...p], r: 2, color: u.def.colors.accent, kind: 'ring' }); return d;
}

// portals: A is the entrance, B is the exit; anyone may use either
function placePortal(sim, u, which) {
  const o = sim.eye(u), d = sim.aimDir(u), hit = sim.rayWorld(o, d, 42);
  if (!(hit.t < 42) || !hit.normal) return false;
  const p = v3.madd(o, d, hit.t - 0.05), n = hit.normal;
  const floor = n[1] > 0.5, pos = floor ? [p[0], p[1], p[2]] : groundPoint(sim, [p[0] + n[0] * 0.9, p[1], p[2] + n[2] * 0.9]);
  if (sim.blockedAt(pos[0], pos[2], pos[1], 0.5, 1.8)) return false;
  for (const z of sim.zones) if (z.kind === 'portal' && z.owner === u && z.which === which) z.t = 0;
  sim.addZone({ kind: 'portal', which, pos, yaw: floor ? u.yaw : Math.atan2(n[0], n[2]), r: 1.1, t: 20, team: u.team, owner: u,
    update(sm, z) {
      const other = sm.zones.find((q) => q.kind === 'portal' && q.owner === z.owner && q.which !== z.which && q.t > 0); if (!other) return;
      for (const t of sm.units) {
        if (!t.alive || t.deploy || sm.time - (t.s.portalT || -9) < 0.9 || v3.dist2d(t.pos, z.pos) > z.r || Math.abs(t.pos[1] - z.pos[1]) > 2.2) continue;
        t.s.portalT = sm.time; sm.emit({ type: 'blink', from: [...t.pos], to: [...other.pos], color: '#c06bff' });
        const out = [Math.sin(other.yaw), 0, Math.cos(other.yaw)]; t.pos = [other.pos[0] + out[0] * 1.2, other.pos[1], other.pos[2] + out[2] * 1.2]; t.vy = Math.max(0, t.vy);
      }
    } });
  return true;
}

export function revive(sim, u, pos) {
  u.alive = true; u.hp = u.maxHp; u.armor = u.maxArmor; u.shield = 0; u.pos = [...pos]; u.vx = u.vz = u.vy = 0; u.st = {}; u.invuln = 2.2; u.dash = null; u.s = {};
  u.ammo = u.def.w1.ammo || 0; u.reloadT = 0; u.killedBy = null; u.hist = []; u.dmgT = -99;
  sim.emit({ type: 'revive', unit: u });
}
