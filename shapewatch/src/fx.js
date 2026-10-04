// Visual effects driven by simulation events and by zones/projectiles: tracers, impacts, explosions,
// rings, damage numbers, heal sparkles and the meshes for every zone ability (domes, portals,
// traps, stasis fields, artillery...). Works on plain data, so replays use it unchanged.
import * as E from '../../engine/index.js';
import { glow } from './models.js';
import { v3, clamp, forward, TAU } from './util.js';

const DEG = E.DEG;
export const rgb = (hex, k = 1) => { const c = E.hexToRGB(hex); return [c[0] * k, c[1] * k, c[2] * k]; };
const R = Math.random;
export const PING_COLORS = { enemy: '#ff4a52', go: '#ffe14d', objective: '#ffffff', health: '#59f0a8', help: '#ffb02e', ally: '#3a9bff', defend: '#7fc4ff' };
const NOTIFY = new Set(['checkpoint', 'overtime', 'mutator', 'mutatorEnd', 'live', 'over', 'swap', 'kill', 'ult', 'core', 'revive', 'spawn', 'round', 'roundStart', 'callout', 'ping', 'capture', 'captured', 'pack']);
const glass = (color, opacity = 0.22, em = 1) => new E.Material({ name: 'Fx', color, emissive: color, emissiveStrength: em, opacity, doubleSided: true });

export class Fx {
  constructor(view) {
    this.v = view; const v = view;
    this.tracers = []; this.beams = []; this.rings = []; this.nums = []; this.projs = new Map(); this.zoneFx = new Map(); this.shells = []; this.flashT = 0;
    this.sphereGeo = E.sphere({ radius: 1, widthSegments: 14, heightSegments: 10 }); this.cylGeo = E.cylinder({ radiusTop: 1, radiusBottom: 1, height: 1, radialSegments: 8 });
    this.ringGeo = E.cylinder({ radiusTop: 1, radiusBottom: 1, height: 0.04, radialSegments: 40, capTop: true, capBottom: false });
    this.ribbonGeo = E.torus({ radius: 1, tube: 0.03, radialSegments: 5, tubularSegments: 56, arc: 360, tubeScaleY: 0.6 });
    this.vring = E.torus({ radius: 1, tube: 0.06, radialSegments: 8, tubularSegments: 40, arc: 360, tubeScaleY: 1 });
    this.coneGeo = E.cone({ radius: 1, height: 1, radialSegments: 6 });
    this.flash = new E.Light('point', { color: '#ffd9a0', intensity: 0, range: 8 }); v.scene.add(this.flash);
  }
  reset() {
    const v = this.v;
    for (const b of [...this.beams, ...this.rings]) v.scene.remove(b.mesh);
    for (const m of this.projs.values()) v.scene.remove(m);
    for (const f of this.zoneFx.values()) for (const n of f.nodes) v.scene.remove(n);
    for (const s of this.shells) { v.scene.remove(s.mesh); v.scene.remove(s.warn); }
    for (const n of this.nums) n.el.remove();
    this.beams = []; this.rings = []; this.tracers = []; this.nums = []; this.projs.clear(); this.zoneFx.clear(); this.shells = [];
  }
  teamHex(team) { return this.v.teamHex(team); }

  // ------------------------------------------------------------------ events
  handle(events) {
    const v = this.v, sim = v.sim, me = v.me, rp = v.replay;
    for (const e of events) {
      switch (e.type) {
        case 'shot': {
          const u = e.unit; if (!u) break;
          const mine = u === me;
          v.sound?.shot(e.sound, u.pos, mine);
          if (mine) { v.kick = Math.min(1.4, v.kick + 0.5); if (e.sound === 'punch') v.punchT = 1; }
          if (u.st?.cloak && !mine && u.team !== v.viewTeam()) break;
          const mz = mine && v.mode === 'fps' ? v.muzzleFP() : sim.muzzle(u);
          this.flash.position.set(mz); this.flash.intensity = mine ? 14 : 8; this.flashT = 0.05; this.flash.color = '#ffd9a0';
          v.sparks.emit(mz, { count: 3, spread: 0.5, up: 0.2, size: 0.05, color: [5, 3.6, 1.4, 1], colorEnd: [2, 0.6, 0.1, 0.3], life: 0.16, vel: v3.scale(forward(u.yaw, u.pitch), 2), jitter: 0.02 });
          if (e.sound === 'minigun' || e.sound === 'smg') v.sparks.emit(mz, { count: 1, spread: 0.3, up: -0.3, size: 0.03, color: [4, 3, 1, 1], life: 0.35, vel: [Math.cos(u.yaw) * 1.6, 1.4, -Math.sin(u.yaw) * 1.6], jitter: 0.02 });
          break;
        }
        case 'tracer': {
          const w = e.width || 1, from = e.unit === me && v.mode === 'fps' ? v.muzzleFP() : e.from;
          if (w > 1.4 || e.hit === 'lance' || e.hit === 'grapple') {
            const mesh = new E.Mesh(this.cylGeo, new E.Material({ name: 'Rail', color: e.color, emissive: e.color, emissiveStrength: 5, opacity: 0.85, doubleSided: true }), 'Rail'); mesh.castShadow = false; v.scene.add(mesh);
            v.placeBeam(mesh, from, e.to, 0.03 * w); const t0 = e.hit === 'grapple' ? 0.35 : 0.22; this.beams.push({ mesh, t: t0, t0, w });
          } else this.tracers.push({ a: from, b: e.to, c: rgb(e.color || '#ffd27a', 3), age: 0, len: v3.dist(from, e.to) });
          break;
        }
        case 'impact': {
          if (e.normal) v.decals.add(e.point, e.normal, 0.06 + R() * 0.04);
          v.sparks.emit(e.point, { count: 4, spread: 1, up: 0.8, size: 0.02, color: [4, 3, 1.4, 1], colorEnd: [1, 0.4, 0.1, 0.2], life: 0.22, jitter: 0.01 });
          v.particles.emit(e.point, { count: 2, spread: 0.3, up: 0.3, size: 0.07, color: [0.95, 0.97, 1, 0.55], colorEnd: [1, 1, 1, 0], life: 0.7, grow: 3 });
          break;
        }
        case 'dmg': {
          const crit = !!e.crit;
          if (e.src === me && e.tgt !== me && e.amt > 0.5) {
            v.hitT = 0.28; if (!rp) v.onHit?.(e); v.sound?.hit(e.head, crit);
            if (e.kind !== 'burn' && !rp && v.showNumbers !== false) this.damageNumber(e);
          }
          if (e.tgt === me) { v.shake = Math.min(1, v.shake + Math.min(0.5, e.amt / 120)); v.dmgFlash = 1; v.sound?.hurt(); if (!rp) v.onHurt?.(e); }
          if (crit && e.point) v.sparks.emit(e.point, { count: 10, spread: 1.4, up: 1.0, size: 0.05, color: [5, 3.8, 0.8, 1], colorEnd: [2, 0.8, 0.1, 0.2], life: 0.35, jitter: 0.04 });
          if (e.tgt.deploy || e.kind === 'bullet') v.sparks.emit(e.point, { count: 2, spread: 0.6, up: 0.4, size: 0.04, color: v.isEnemy(e.tgt) ? [4, 1.2, 1, 1] : [1.5, 2.5, 4, 1], life: 0.2, jitter: 0.05 });
          break;
        }
        case 'heal': {
          const t = e.tgt; if (!t) break;
          v.sparks.emit([t.pos[0], t.pos[1] + 1.2, t.pos[2]], { count: 2, spread: 0.5, up: 1.2, size: 0.09, color: [0.5, 3, 1.2, 1], colorEnd: [0.2, 1.4, 0.5, 0.1], life: 0.7, jitter: 0.25, buoyancy: 1.2 });
          if ((e.src === me || t === me) && !rp) v.onHeal?.(e);
          break;
        }
        case 'kill': this.deathFx(e); if (!rp) v.onKill?.(e); break;
        case 'boom': {
          const big = e.kind === 'big' || e.kind === 'slam' || e.r > 4, c = rgb(e.color || '#ffb061', 3);
          v.sparks.emit(e.pos, { count: big ? 60 : 20, spread: big ? 6 : 3, up: big ? 5 : 3, size: big ? 0.2 : 0.12, color: [...c, 1], colorEnd: [c[0] * 0.3, c[1] * 0.2, 0, 0.1], life: big ? 0.9 : 0.5, jitter: 0.2, grow: 0.4 });
          v.particles.emit(e.pos, { count: big ? 14 : 6, spread: big ? 3 : 1.4, up: 1, size: big ? 0.9 : 0.5, color: [0.7, 0.72, 0.78, 0.5], colorEnd: [0.85, 0.87, 0.9, 0], life: 2, grow: 4, buoyancy: 0.5, jitter: 0.3 });
          this.flash.position.set(e.pos); this.flash.intensity = big ? 60 : 24; this.flashT = 0.12; this.flash.color = e.color || '#ffb061';
          v.sound?.boom(e.pos, big); this.addRing(e.pos, e.r || 1, e.color || '#ffb061', 0.4);
          const d = v3.dist(e.pos, v.camera.position); if (d < 30) v.shake = Math.min(1, v.shake + (big ? 0.6 : 0.2) * (1 - d / 30));
          break;
        }
        case 'pulse': this.addRing(e.pos, e.r, e.color, e.kind === 'slam' ? 0.5 : 0.6); v.sound?.whoosh(e.pos, 400, 1800); break;
        case 'blink': {
          const c = rgb(e.color, 3);
          for (const p of [e.from, e.to]) v.sparks.emit([p[0], p[1] + 1, p[2]], { count: 18, spread: 1.4, up: 1.4, size: 0.07, color: [...c, 1], colorEnd: [c[0] * 0.2, c[1] * 0.2, c[2] * 0.2, 0.1], life: 0.5, jitter: 0.25 });
          v.sound?.blink(e.to); break;
        }
        case 'dash': v.sound?.whoosh(e.unit.pos, 200, 900); break;
        case 'jump': if (e.unit === me) v.sound?.jump(e.unit.pos); break;
        case 'land': if (e.unit === me || v3.dist(e.unit.pos, v.camera.position) < 20) { v.sound?.land(e.unit.pos); v.particles.emit(e.unit.pos, { count: 6, spread: 1.2, up: 0.4, size: 0.2, color: [0.95, 0.97, 1, 0.5], colorEnd: [1, 1, 1, 0], life: 0.9, grow: 3 }); } break;
        case 'reload': if (e.unit === me) v.sound?.reload(); break;
        case 'sonar': this.addRing(e.pos, 12, e.color, 0.9); v.sound?.whoosh(e.pos, 1500, 300); break;
        case 'fizzle': v.sparks.emit(e.pos, { count: 8, spread: 1, up: 0.5, size: 0.05, color: [1.5, 2.5, 4, 1], life: 0.3 }); break;
        case 'barrierHit': v.sparks.emit(e.point, { count: 6, spread: 1, up: 0.4, size: 0.05, color: [1.5, 3, 5, 1], life: 0.25 }); break;
        case 'barrierBreak': this.addRing(e.unit.pos, 3, '#5bbcff', 0.5); v.sound?.boom(e.unit.pos, false); break;
        case 'pack': v.sound?.pack(e.pos); break;
        case 'core': v.sound?.core(e.pos); this.addRing(e.pos, 2, '#ffd36b', 0.5); break;
        case 'ult': { v.sound?.ult(e.unit.pos, e.unit === me); this.addRing(e.unit.pos, 9, this.teamHex(e.unit.team), 0.9); v.shake = Math.min(1, v.shake + 0.1); if (!rp) v.onUlt?.(e); break; }
        case 'revive': this.addRing(e.unit.pos, 3, '#fff1a8', 0.8); v.sound?.core(e.unit.pos); v.sparks.emit(e.unit.pos, { count: 40, spread: 1.2, up: 3, size: 0.08, color: [4, 3.6, 1.4, 1], life: 1.2, jitter: 0.3, buoyancy: 1 }); break;
        case 'spawn': if (!e.unit.isPlayer || sim.time > 1) this.addRing(e.unit.pos, 1.6, this.teamHex(e.unit.team), 0.5); if (e.unit === me) v.deathCam = null; break;
        case 'deploy': this.addRing(e.unit.pos, 2, this.teamHex(e.unit.team), 0.5); break;
        case 'destroy': v.removeDeploy(e.unit); if (!e.quiet) { v.sparks.emit(e.unit.pos, { count: 24, spread: 3, up: 3, size: 0.1, color: [4, 2.4, 0.8, 1], life: 0.6 }); v.sound?.boom(e.unit.pos, false); } break;
        case 'flash': {
          this.addRing(e.pos, e.r, '#ffffff', 0.5); this.flash.position.set(e.pos); this.flash.intensity = 80; this.flashT = 0.18; this.flash.color = '#ffffff';
          const c = v.camera.position, d = v3.dist(c, e.pos);
          if (d < e.r + 6 && !rp) { const f = forward(me?.yaw || 0, me?.pitch || 0), to = v3.norm(v3.sub(e.pos, c)); if (v3.dot(f, to) > -0.2) v.whiteout = Math.max(v.whiteout, clamp(1.1 - d / (e.r + 6), 0.3, 1)); }
          break;
        }
        case 'shell': this.addShell(e.pos); break;
        case 'zone': this.zoneBorn(e.zone); break;
        case 'ping': { const col = PING_COLORS[e.ping?.kind] || '#ffffff'; if (e.ping) this.addRing(e.ping.pos, 2, col, 0.9); v.sound?.ping?.(); break; }
        case 'capture': case 'captured': v.sound?.capture?.(); break;
        default: break;
      }
      if (!rp && NOTIFY.has(e.type)) v.onEvent?.(e);
    }
  }
  deathFx(e) {
    const v = this.v, t = e.victim; if (t.deploy) return;
    const p = [t.pos[0], t.pos[1] + 1, t.pos[2]], c = rgb(this.teamHex(t.team), 3);
    v.sparks.emit(p, { count: 24, spread: 2, up: 2.4, size: 0.08, color: [...c, 1], colorEnd: [c[0] * 0.2, c[1] * 0.2, c[2] * 0.2, 0.1], life: 0.9, jitter: 0.2 });
    v.particles.emit(p, { count: 5, spread: 0.8, up: 0.6, size: 0.5, color: [0.55, 0.58, 0.66, 0.45], colorEnd: [0.7, 0.72, 0.78, 0], life: 1.8, grow: 4, buoyancy: 0.3 });
    if (t === v.me && !v.replay) v.deathCam = { killer: e.killer, t: 0 };
  }
  addRing(pos, r, color, dur) {
    const v = this.v, m = new E.Mesh(this.ribbonGeo, new E.Material({ name: 'Ring', color, emissive: color, emissiveStrength: 3, opacity: 0.8, doubleSided: true }), 'Ring');
    m.castShadow = false; m.receiveShadow = false; m.position.set([pos[0], (pos[1] || 0) + 0.12, pos[2]]); m.scale.set([0.2, 1, 0.2]); v.scene.add(m); this.rings.push({ mesh: m, t: dur, t0: dur, r });
  }
  addShell(p) {
    const v = this.v, mesh = new E.Mesh(this.sphereGeo, glow('#ffb061', 4), 'Shell'); mesh.scale.set([0.22, 0.5, 0.22]); mesh.castShadow = false; v.scene.add(mesh);
    const warn = new E.Mesh(this.ringGeo, glass('#ff5a3a', 0.4, 2), 'ShellWarn'); warn.scale.set([3.2, 1, 3.2]); warn.position.set([p[0], p[1] + 0.08, p[2]]); warn.castShadow = false; warn.receiveShadow = false; v.scene.add(warn);
    this.shells.push({ mesh, warn, p: [...p], t: 0.9, t0: 0.9 }); v.sound?.whoosh(p, 1800, 300);
  }
  damageNumber(e) {
    const ex = this.nums.find((n) => n.tgt === e.tgt && n.t > 0.55 && !!n.crit === !!e.crit);
    if (ex) { ex.amt += e.amt; ex.el.textContent = Math.round(ex.amt); ex.t = 0.9; ex.p = [e.point[0], e.point[1] + 0.3, e.point[2]]; return; }
    const el = document.createElement('div'); el.className = 'dn' + (e.head ? ' head' : '') + (e.crit ? ' crit' : ''); el.textContent = Math.round(e.amt);
    if (e.crit) el.dataset.tag = e.head ? 'HEADSHOT' : 'CRIT';
    document.getElementById('hud')?.append(el);
    this.nums.push({ el, p: [e.point[0] + (R() - 0.5) * 0.4, e.point[1] + 0.3, e.point[2] + (R() - 0.5) * 0.4], t: 0.9, tgt: e.tgt, amt: e.amt, crit: e.crit });
    if (this.nums.length > 14) this.nums.shift().el.remove();
  }
  updateNumbers(dt) {
    const v = this.v;
    for (const n of this.nums) { n.t -= dt; n.p[1] += dt * 0.9; const s = v.project(n.p); n.el.style.opacity = clamp(n.t / 0.5, 0, 1); if (s) { n.el.style.left = s.x + 'px'; n.el.style.top = s.y + 'px'; } else n.el.style.opacity = 0; if (n.t <= 0) n.el.remove(); }
    this.nums = this.nums.filter((n) => n.t > 0);
  }

  // ------------------------------------------------------------------ projectiles
  syncProjs() {
    const v = this.v, sim = v.sim, live = new Set();
    for (const p of sim.projs) {
      live.add(p.id);
      let m = this.projs.get(p.id);
      if (!m) { const s = p.spec.size || 0.2, c = p.spec.color || '#fff'; m = new E.Mesh(this.sphereGeo, glow(c, 4), 'Proj'); m.scale.set([s, s, s]); m.castShadow = false; v.scene.add(m); this.projs.set(p.id, m); }
      m.position.set(p.pos);
      const c = rgb(p.spec.color || '#ffffff', 3);
      v.sparks.emit(p.pos, { count: 2, spread: 0.12, up: 0.05, size: (p.spec.size || 0.2) * 0.5, color: [...c, 1], colorEnd: [c[0] * 0.3, c[1] * 0.3, c[2] * 0.3, 0.1], life: 0.35, jitter: 0.03, grow: 0.3 });
    }
    for (const [id, m] of this.projs) if (!live.has(id)) { v.scene.remove(m); this.projs.delete(id); }
  }

  // ------------------------------------------------------------------ zones
  zoneBorn(z) {
    const v = this.v;
    if (z.kind === 'trap') this.addRing(z.pos, 1.6, this.teamHex(z.team), 0.5);
    if (z.kind === 'portal') { this.addRing(z.pos, 1.6, z.which === 'A' ? '#3ad8ff' : '#ff9a3c', 0.6); v.sound?.whoosh(z.pos, 300, 1500); }
    if (z.kind === 'stasis' || z.kind === 'pit') v.sound?.boom(z.pos, true);
  }
  makeZone(z) {
    const v = this.v, nodes = [], add = (n) => { n.castShadow = false; n.receiveShadow = false; v.scene.add(n); nodes.push(n); return n; };
    const col = (z.kind === 'dome' || z.kind === 'trap' || z.kind === 'caltrops' || z.kind === 'stasis' || z.kind === 'pit') ? this.teamHex(z.team) : null;
    const f = { nodes, z, kind: z.kind };
    switch (z.kind) {
      case 'dome': f.main = add(new E.Mesh(this.sphereGeo, glass(col, 0.16, 0.8), 'Dome')); f.main.scale.set([z.r, z.r, z.r]); break;
      case 'hole': f.main = add(new E.Mesh(this.sphereGeo, new E.Material({ name: 'Hole', color: '#0a0014', emissive: '#7a4bff', emissiveStrength: 0.6, roughness: 0.2 }), 'Hole')); f.main.scale.set([0.9, 0.9, 0.9]); f.disc = add(new E.Mesh(this.ringGeo, glass('#7a4bff', 0.18, 1), 'HoleField')); f.disc.scale.set([z.r, 1, z.r]); break;
      case 'bomb': f.main = add(new E.Mesh(this.sphereGeo, glow('#40e0ff', 3), 'Bomb')); f.main.scale.set([0.25, 0.25, 0.25]); break;
      case 'fire': f.main = add(new E.Mesh(this.ringGeo, glass('#ff6a1a', 0.25, 1), 'Fire')); f.main.scale.set([z.r, 1, z.r]); break;
      case 'trap': f.main = add(new E.Mesh(this.ringGeo, glass(col, 0.4, 1.6), 'Trap')); f.main.scale.set([z.r * 0.55, 1, z.r * 0.55]); for (let i = 0; i < 8; i++) { const a = i * TAU / 8, t = add(new E.Mesh(this.coneGeo, glow('#c9ced6', 0.6), 'Tooth')); t.scale.set([0.07, 0.22, 0.07]); t.position.set([z.pos[0] + Math.cos(a) * z.r * 0.55, z.pos[1] + 0.12, z.pos[2] + Math.sin(a) * z.r * 0.55]); } break;
      case 'caltrops': f.main = add(new E.Mesh(this.ringGeo, glass(col, 0.12, 0.8), 'CaltropField')); f.main.scale.set([z.r, 1, z.r]); for (let i = 0; i < 16; i++) { const a = R() * TAU, r = Math.sqrt(R()) * z.r, t = add(new E.Mesh(this.coneGeo, glow('#c9ced6', 0.4), 'Spike')); t.scale.set([0.05, 0.16, 0.05]); t.position.set([z.pos[0] + Math.cos(a) * r, z.pos[1] + 0.08, z.pos[2] + Math.sin(a) * r]); t.setEuler((R() - 0.5) * 40, 0, (R() - 0.5) * 40); } break;
      case 'pit': f.main = add(new E.Mesh(this.ringGeo, new E.Material({ name: 'Pit', color: '#120808', emissive: '#ff3a2a', emissiveStrength: 0.5, opacity: 0.8, doubleSided: true }), 'Pit')); f.main.scale.set([z.r, 1, z.r]); for (let i = 0; i < 18; i++) { const a = R() * TAU, r = Math.sqrt(R()) * z.r * 0.95, t = add(new E.Mesh(this.coneGeo, glow('#b9b1a6', 0.4), 'Fang')); t.scale.set([0.16, 0.6 + R() * 0.5, 0.16]); t.position.set([z.pos[0] + Math.cos(a) * r, z.pos[1] + 0.3, z.pos[2] + Math.sin(a) * r]); } break;
      case 'stasis': f.main = add(new E.Mesh(this.sphereGeo, glass('#c06bff', 0.14, 1.2), 'Stasis')); f.main.scale.set([z.r, z.r, z.r]); f.disc = add(new E.Mesh(this.ringGeo, glass('#c06bff', 0.25, 1.6), 'StasisFloor')); f.disc.scale.set([z.r, 1, z.r]); break;
      case 'barrage': f.main = add(new E.Mesh(this.ringGeo, glass('#ff5a3a', 0.2, 1.4), 'BarrageField')); f.main.scale.set([z.r, 1, z.r]); break;
      case 'orb': f.main = add(new E.Mesh(this.ringGeo, glass('#59f0a8', 0.2, 1.4), 'HealField')); f.main.scale.set([z.r, 1, z.r]); f.core = add(new E.Mesh(this.sphereGeo, glow('#9fffd0', 3), 'HealOrb')); f.core.scale.set([0.32, 0.32, 0.32]); break;
      case 'decay': f.main = add(new E.Mesh(this.ringGeo, glass('#a64bff', 0.22, 1.1), 'DecayField')); f.main.scale.set([z.r, 1, z.r]); f.core = add(new E.Mesh(this.sphereGeo, glow('#b8ff4a', 3), 'DecayOrb')); f.core.scale.set([0.32, 0.32, 0.32]); break;
      case 'portal': {
        const c = z.which === 'A' ? '#3ad8ff' : '#ff9a3c', root = new E.Node('Portal'), ring = new E.Mesh(this.vring, glow(c, 3), 'PortalRing'), disc = new E.Mesh(this.cylGeo, new E.Material({ name: 'PortalDisc', color: '#05030f', emissive: c, emissiveStrength: 0.7, opacity: 0.75, doubleSided: true }), 'PortalDisc');
        const pivot = new E.Node('PortalPivot'); pivot.setEuler(90, 0, 0); ring.scale.set([z.r, z.r, z.r]); disc.scale.set([z.r * 0.95, 0.03, z.r * 0.95]); pivot.add(ring, disc); root.add(pivot); root.position.set(z.pos); root.setEuler(0, (z.yaw || 0) / DEG, 0); add(root); f.main = root; f.ring = ring; break;
      }
      default: break;
    }
    return f;
  }
  syncZones(dt) {
    const v = this.v, sim = v.sim, live = new Set(), t = sim.time;
    for (const z of sim.zones) {
      live.add(z.id);
      let f = this.zoneFx.get(z.id);
      if (!f) { f = this.makeZone(z); this.zoneFx.set(z.id, f); }
      f.z = z;
      const m = f.main, pos = z.pos, age = z.age || 0;
      switch (z.kind) {
        case 'dome': m.position.set(pos); m.material.opacity = 0.12 + Math.sin(age * 3) * 0.03; break;
        case 'hole': { const s = 0.9 + Math.sin(age * 6) * 0.1; m.position.set([pos[0], pos[1] + 1.4, pos[2]]); m.scale.set([s, s, s]); f.disc.position.set([pos[0], pos[1] + 0.06, pos[2]]); for (let i = 0; i < 6; i++) { const a = R() * TAU, r = z.r * (0.4 + R() * 0.6); v.sparks.emit([pos[0] + Math.cos(a) * r, pos[1] + 0.3 + R() * 2.4, pos[2] + Math.sin(a) * r], { count: 1, spread: 0.1, up: 0, size: 0.1, color: [1.6, 0.8, 4, 1], colorEnd: [0.6, 0.2, 1.4, 0.1], life: 0.5, vel: [-Math.cos(a) * r * 2.2 - Math.sin(a) * 4, 0, -Math.sin(a) * r * 2.2 + Math.cos(a) * 4], jitter: 0 }); } break; }
        case 'bomb': { const s = 0.22 + (Math.sin(age * (6 + age * 10)) * 0.5 + 0.5) * 0.14; m.position.set(pos); m.scale.set([s, s, s]); break; }
        case 'fire': m.position.set([pos[0], pos[1] + 0.06, pos[2]]); for (let i = 0; i < 4; i++) { const a = R() * TAU, r = Math.sqrt(R()) * z.r; v.sparks.emit([pos[0] + Math.cos(a) * r, pos[1] + 0.1, pos[2] + Math.sin(a) * r], { count: 1, spread: 0.2, up: 2.4, size: 0.28, color: [4, 1.6, 0.3, 1], colorEnd: [1.2, 0.1, 0, 0.1], life: 0.7, jitter: 0.1, grow: 0.3, buoyancy: 2 }); if (R() < 0.15) v.particles.emit([pos[0] + Math.cos(a) * r, pos[1] + 1, pos[2] + Math.sin(a) * r], { count: 1, spread: 0.2, up: 0.6, size: 0.5, color: [0.2, 0.2, 0.22, 0.4], colorEnd: [0.3, 0.3, 0.3, 0], life: 2, grow: 4, buoyancy: 0.4 }); } break;
        case 'wall': { const cs = Math.cos(z.yaw), sn = Math.sin(z.yaw); for (let i = 0; i < 5; i++) { const lx = (R() - 0.5) * z.len; v.sparks.emit([pos[0] + cs * lx, pos[1] + 0.1, pos[2] - sn * lx], { count: 1, spread: 0.15, up: 3, size: 0.3, color: [4, 1.6, 0.3, 1], colorEnd: [1.2, 0.1, 0, 0.1], life: 0.8, jitter: 0.05, grow: 0.3, buoyancy: 2.5 }); } break; }
        case 'trap': m.position.set([pos[0], pos[1] + 0.06, pos[2]]); m.material.opacity = 0.25 + Math.sin(t * 4) * 0.08; break;
        case 'caltrops': m.position.set([pos[0], pos[1] + 0.05, pos[2]]); break;
        case 'pit': m.position.set([pos[0], pos[1] + 0.06, pos[2]]); if (R() < 0.4) v.sparks.emit([pos[0] + (R() - 0.5) * z.r, pos[1] + 0.2, pos[2] + (R() - 0.5) * z.r], { count: 1, spread: 0.2, up: 2, size: 0.1, color: [3, 0.8, 0.4, 1], life: 0.6 }); break;
        case 'stasis': m.position.set(pos); f.disc.position.set([pos[0], pos[1] + 0.07, pos[2]]); m.material.opacity = 0.1 + Math.sin(age * 5) * 0.04; if (R() < 0.7) { const a = R() * TAU, r = Math.sqrt(R()) * z.r; v.sparks.emit([pos[0] + Math.cos(a) * r, pos[1] + 0.3 + R() * 3, pos[2] + Math.sin(a) * r], { count: 1, spread: 0.1, up: 0.2, size: 0.07, color: [2.4, 1.2, 4, 1], life: 1.0, jitter: 0 }); } break;
        case 'barrage': m.position.set([pos[0], pos[1] + 0.06, pos[2]]); m.material.opacity = 0.14 + Math.sin(age * 6) * 0.06; break;
        case 'orb': case 'decay': {
          m.position.set([pos[0], pos[1] + 0.06, pos[2]]); f.core.position.set([pos[0], pos[1] + 0.9 + Math.sin(age * 3) * 0.1, pos[2]]);
          const heal = z.kind === 'orb'; for (let i = 0; i < 2; i++) { const a = R() * TAU, r = Math.sqrt(R()) * z.r; v.sparks.emit([pos[0] + Math.cos(a) * r, pos[1] + 0.1, pos[2] + Math.sin(a) * r], { count: 1, spread: 0.1, up: heal ? 1.6 : 1.0, size: 0.1, color: heal ? [0.6, 3.4, 1.4, 1] : [2.4, 0.9, 3.6, 1], colorEnd: heal ? [0.2, 1.4, 0.6, 0.1] : [0.8, 0.3, 1.2, 0.1], life: 0.9, jitter: 0, buoyancy: heal ? 1.2 : 0.5 }); } break;
        }
        case 'portal': { m.position.set([pos[0], pos[1], pos[2]]); f.ring.setEuler(0, age * 90, 0); if (R() < 0.6) { const c = z.which === 'A' ? [0.5, 2.4, 4, 1] : [4, 1.9, 0.5, 1], a = R() * TAU; v.sparks.emit([pos[0] + Math.cos(a) * z.r * Math.cos(z.yaw || 0), pos[1] + Math.sin(a) * z.r, pos[2] - Math.cos(a) * z.r * Math.sin(z.yaw || 0)], { count: 1, spread: 0.1, up: 0.2, size: 0.06, color: c, life: 0.5, jitter: 0 }); } break; }
        default: break;
      }
    }
    for (const [id, f] of this.zoneFx) if (!live.has(id)) { for (const n of f.nodes) v.scene.remove(n); this.zoneFx.delete(id); }
    // artillery shells fall from the sky onto their markers
    for (const s of this.shells) {
      s.t -= dt; const k = clamp(1 - s.t / s.t0, 0, 1);
      s.mesh.position.set([s.p[0], s.p[1] + 55 * (1 - k * k), s.p[2]]); s.warn.material.opacity = 0.2 + k * 0.5; const sc = 3.2 * (1.1 - 0.3 * k); s.warn.scale.set([sc, 1, sc]);
      v.sparks.emit(s.mesh.position, { count: 2, spread: 0.1, up: 0.1, size: 0.18, color: [4, 2, 0.6, 1], colorEnd: [1.4, 0.3, 0.1, 0.1], life: 0.3, jitter: 0.04 });
      if (s.t <= 0) { v.scene.remove(s.mesh); v.scene.remove(s.warn); }
    }
    this.shells = this.shells.filter((s) => s.t > 0);
  }

  // ------------------------------------------------------------------ ephemeral effects
  tick(dt) {
    const v = this.v;
    for (const t of this.tracers) t.age += dt; this.tracers = this.tracers.filter((t) => t.age < 0.1);
    for (const b of this.beams) { b.t -= dt; b.mesh.material.opacity = 0.85 * clamp(b.t / b.t0, 0, 1); b.mesh.scale.set([b.mesh.scale[0] * (1 - dt * 1.5), b.mesh.scale[1], b.mesh.scale[2] * (1 - dt * 1.5)]); if (b.t <= 0) v.scene.remove(b.mesh); }
    this.beams = this.beams.filter((b) => b.t > 0);
    for (const r of this.rings) { r.t -= dt; const k = 1 - clamp(r.t / r.t0, 0, 1); r.mesh.scale.set([Math.max(0.2, r.r * (0.2 + k * 0.8)), 1, Math.max(0.2, r.r * (0.2 + k * 0.8))]); r.mesh.material.opacity = 0.8 * (1 - k); if (r.t <= 0) v.scene.remove(r.mesh); }
    this.rings = this.rings.filter((r) => r.t > 0);
    if (this.flashT > 0) { this.flashT -= dt; if (this.flashT <= 0) this.flash.intensity = 0; }
  }
  tracerLines() {
    const lines = [];
    for (const t of this.tracers) {
      const l = t.len, d = [(t.b[0] - t.a[0]) / (l || 1), (t.b[1] - t.a[1]) / (l || 1), (t.b[2] - t.a[2]) / (l || 1)], head = Math.min(l, t.age * 420 + 6), tail = Math.max(0, head - 14);
      const a = v3.madd(t.a, d, tail), b = v3.madd(t.a, d, head), al = clamp(1 - t.age / 0.1, 0, 1);
      lines.push(...a, ...t.c, al * 0.2, ...b, ...t.c, al);
    }
    return lines;
  }
}
