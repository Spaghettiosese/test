// A round of play, rendered: builds the 3D scene for a Sim, keeps views in step with it, owns
// the camera and the player, and draws. The match flow (menus, operator select, round series)
// lives above this in main.js.
import * as E from '../../../engine/index.js';
import { HARBOR } from '../data/harbor.js';
import { Sim } from '../sim/sim.js';
import { setupRound } from '../sim/setup.js';
import { MaterialLib } from '../world/materials.js';
import { WorldMesher } from '../world/mesher.js';
import { Fx } from './fx.js';
import { ActorViews } from './actorview.js';
import { DeviceViews } from './devview.js';
import { ViewModel } from './viewmodel.js';
import { Player } from './player.js';
import { STOREY } from '../world/grid.js';
import { dirOf, clamp } from '../sim/util.js';

// static box colliders for ragdolls, created on demand around a corpse
class Colliders {
  constructor(game) { this.game = game; this.map = new Map(); }
  ensure(pos, r) {
    const w = this.game.sim.world, phys = this.game.phys, P = E.physicsMath;
    const add = (key, min, max) => {
      if (this.map.has(key)) return;
      const b = phys.add(new E.Body({ shape: new E.Box([(max[0] - min[0]) / 2, (max[1] - min[1]) / 2, (max[2] - min[2]) / 2]), type: 'static', position: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2], friction: 0.7, group: 1 }));
      this.map.set(key, b);
    };
    const x0 = Math.floor(pos[0] - r), x1 = Math.floor(pos[0] + r), z0 = Math.floor(pos[2] - r), z1 = Math.floor(pos[2] + r);
    for (let lvl = 0; lvl <= w.floors * STOREY; lvl += STOREY) {
      if (Math.abs(lvl - pos[1]) > 4) continue;
      for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) { const p = w.getY(x, lvl, z); if (p && !p.dead) add('y' + p.id, [x, lvl - 0.2, z], [x + 1, lvl, z + 1]); }
    }
    for (let iy = Math.floor(pos[1]); iy < pos[1] + 3; iy++) for (let z = z0; z <= z1 + 1; z++) for (let x = x0; x <= x1 + 1; x++) {
      for (const p of [w.getX(x, iy, z), w.getZ(x, iy, z)]) { if (p && p.solid) { const b = w.panelBox(p); add('p' + p.id, b.min, b.max); } }
    }
    for (const pr of w.props) { if (!pr.solid || pr.walk) continue; if (pr.max[0] < pos[0] - r || pr.min[0] > pos[0] + r || pr.max[2] < pos[2] - r || pr.min[2] > pos[2] + r) continue; if (Math.abs(pr.min[1] - pos[1]) > 4) continue; add('r' + pr.id, pr.min, pr.max); }
    void P;
  }
  remove(p) { const b = this.map.get('p' + p.id); if (b) { this.game.phys.remove(b); this.map.delete('p' + p.id); } }
}

export class Game {
  constructor(canvas, { settings, audio, lib } = {}) {
    this.canvas = canvas; this.settings = settings; this.audio = audio; this.lib = lib || new MaterialLib();
    this.renderer = new E.Renderer(canvas);
    const st = this.renderer.settings;
    st.adaptiveResolution = true; st.targetFps = 50; st.ssr = false; st.volumetrics = false; st.contactShadows = false; st.dofAperture = 0;
    this.cam = new E.Camera(); this.cam.near = 0.03; this.cam.far = 600;
    this.sim = null; this.scene = null; this.state = 'idle'; this.shakeAmt = 0; this.time = 0; this.cfg = null;
    this.ambient = null;
  }
  applySettings() {
    const s = this.settings, st = this.renderer.settings;
    st.renderScale = s.renderScale ?? 1; st.ssao = s.quality !== 'low'; st.bloom = s.quality !== 'low'; st.softShadows = s.quality === 'high';
    st.sharpen = s.quality === 'low' ? 0 : 0.18; st.aberration = s.chromatic ? 0.35 : 0.0; st.grain = s.grain ? 0.012 : 0; st.vignette = 0.35;
    this.renderer.shadowSize = undefined;
  }

  // ---------------------------------------------------------------- round setup
  startRound(cfg) {
    this.dispose();
    this.cfg = cfg;
    const sim = this.sim = new Sim(cfg.map || HARBOR, { seed: cfg.seed ?? (Math.random() * 1e9) | 0, difficulty: cfg.level ?? 2, down: cfg.down ?? true, friendlyFire: cfg.friendlyFire ?? false, prep: cfg.prep, action: cfg.action, mode: cfg.mode || 'bomb' });
    Object.assign(sim.round.o, { mode: cfg.mode || 'bomb', prep: cfg.prep ?? 45, action: cfg.action ?? 180 }); sim.round.t = sim.round.o.prep;
    const scene = this.scene = new E.Scene(), env = scene.environment;
    this.tod = cfg.tod ?? 15.2;
    E.applyTimeOfDay(env, this.tod);
    if (this.tod > 6 && this.tod < 19) { env.ambient *= 1.5; env.sunIntensity *= 0.85; } // fill the shadows so dark uniforms stay readable
    env.fogDensity = 0.0024; env.shadowRadius = 22; env.shadowFar = 110; env.fogHeight = 0.0; env.volumetric = 0; env.exposure = this.tod > 19 || this.tod < 6 ? 1.9 : 1.0;
    if (this.tod > 19 || this.tod < 6) { env.ambient = 0.85; env.sunIntensity = 1.4; env.sunColor = [0.65, 0.75, 1.0]; env.sunDirection = E.vec3.normalize([0, 0, 0], [0.4, 0.75, 0.5]); } // a bright moon: no night vision in this game
    this.applySettings();
    this.phys = new E.PhysicsWorld({ iterations: 8, gravity: [0, -9.81, 0] }); this.colliders = new Colliders(this);
    const setup = setupRound(sim, { level: cfg.level, site: cfg.site, spawn: cfg.spawn, player: cfg.player, atk: cfg.atk, def: cfg.def, names: cfg.names, slots: cfg.slots, memory: cfg.memory, start: cfg.start });
    this.setup = setup;
    // world
    const mesher = this.mesher = new WorldMesher(sim.world, this.lib, scene);
    mesher.buildAll(); mesher.buildStatics(sim.map.statics);
    const gm = new E.Mesh(E.plane({ width: 500, depth: 500 }), this.lib.get('floor:ground'), 'ground'); gm.position.set([sim.world.W / 2, -0.03, sim.world.D / 2]); gm.castShadow = false; scene.add(gm);
    for (const l of sim.map.lights) { const L = new E.Light('point', { color: l.color, intensity: l.intensity * (this.tod > 18 || this.tod < 6 ? 1.4 : 1), range: l.range }); L.position.set(l.pos); scene.add(L); }
    sim.world.on('break', (e) => { if (e.panel) { mesher.mark(e.panel); this.colliders.remove(e.panel); } if (e.door) this.mesher.mark(e.door.panels[0]); });
    sim.world.on('damage', (e) => { if (e.reinforce) for (const p of sim.world.units.get(e.unit) || []) mesher.mark(p); });
    sim.on('panelchange', (e) => mesher.mark(e.panel));
    sim.on('reinforce', (e) => { for (const p of sim.world.units.get(e.unit) || []) mesher.mark(p); this.audio && this.audio.clack(0.8); });
    // views
    this.fx = new Fx(this); this.views = new ActorViews(this); this.devs = new DeviceViews(this);
    for (const a of sim.actors) this.views.add(a);
    this.vm = new ViewModel(this); this.vm.world = this.settings.fov ?? 72;
    const pa = sim.actors.find((a) => a.isPlayer);
    this.playerActor = pa || null;
    this.player = pa ? new Player(this, pa) : null;
    sim.player = pa;
    // sound and feedback wiring
    this.wire();
    this.state = 'playing'; this.freeCam = !pa;
    this.camTarget = null;
    return setup;
  }
  wire() {
    const sim = this.sim, au = this.audio;
    sim.on('shot', (e) => { if (au) au.shotAt(e.gun.def, e.origin); this.player && this.player.onShot(e); if (e.actor === this.playerActor) this.vm.onShot(e.actor, e.gun, e.kick); });
    sim.on('reload', (e) => { if (e.actor === this.playerActor) this.vm.onReload(e.actor, e.gun); au && au.at(e.actor.pos, () => au.click(0.9, 0.3), { ref: 4 }); });
    sim.on('shellin', (e) => { if (e.actor === this.playerActor) this.vm.onShell(); });
    sim.on('dryfire', (e) => { if (au && e.actor === this.playerActor) au.empty(); });
    sim.on('sound', (n) => {
      if (!au) return;
      if (n.kind === 'step') au.step(n.pos, n.pos[1] < 0.3 && sim.world.roomAt(n.pos[0], n.pos[1], n.pos[2]) < 0 ? 'tile' : 'tile', Math.min(1.5, n.loud / 9));
      else if (n.kind === 'land') au.thud(n.pos);
      else if (n.kind === 'place') au.place(n.pos);
    });
    sim.on('door', (e) => { if (au) { const d = e.door; au.door([d.ix, 1, d.iz], e.open); } });
    sim.on('hit', (e) => { if (e.shooter === this.playerActor && au) { au.ui(e.killed ? 'kill' : e.headshot ? 'headshot' : 'hit'); } if (e.target === this.playerActor) this.player && (this.player.hitT = 0.4); });
    sim.on('flashbang', (e) => { const a = this.playerActor; if (a && a.status.deaf > 1 && au) au.ring(Math.min(6, a.status.deaf)); });
    sim.on('planted', () => { this.beepT = 0; });
    sim.on('hurt', (e) => { if (e.actor === this.playerActor) { this.hurtFlash = 1; this.hurtDir = e.from; this.shake(0.25); } });
  }
  shake(a) { this.shakeAmt = Math.min(1.5, this.shakeAmt + a); }
  dispose() {
    if (this.views) this.views.clear();
    if (this.vm) this.vm.hideAll();
    this.sim = null; this.scene = null; this.player = null; this.playerActor = null;
  }

  // ---------------------------------------------------------------- frame
  update(dt) {
    const sim = this.sim; if (!sim || this.state === 'idle') return;
    dt = Math.min(dt, 0.05); this.time += dt;
    if (this.state === 'playing') {
      if (this.player) this.player.update(dt);
      sim.update(dt);
    }
    this.mesher.update(3);
    this.phys.step(dt);
    this.views.update(dt); this.devs.update(dt); this.fx.update(dt);
    // the fuse beeps faster as it burns
    const r = sim.round;
    if (r.bomb.state === 'planted' || r.bomb.state === 'defusing') { this.beepT = (this.beepT ?? 0) - dt; if (this.beepT <= 0) { this.beepT = Math.max(0.12, r.bomb.t / 45 * 1.0); this.audio && this.audio.beep(r.bomb.pos, r.bomb.t < 10); } }
    this.updateCamera(dt);
    if (this.audio) { this.audio.listener.pos = this.cam.position; this.audio.listener.yaw = this.camYawRender || 0; this.audio.world = sim.world; }
  }
  updateCamera(dt) {
    const sim = this.sim, cam = this.cam, p = this.player, a = this.playerActor;
    let eye, dir, up = [0, 1, 0], fov = (this.settings.fov ?? 72) * E.DEG, shown = null, hideBody = null;
    this.shakeAmt *= Math.exp(-dt * 6);
    const sh = this.shakeAmt;
    if (!p) { // observer: chase a living operator, hopping to the next one now and then
      const live = sim.actors.filter((x) => x.alive); const t = this.followActor && this.followActor.alive ? this.followActor : (this.followActor = live[0] || sim.actors[0]);
      if (this.followT === undefined || (this.followT -= dt) <= 0) { this.followT = 9; if (this.autoFollow !== false) this.followActor = live[Math.floor(Math.random() * live.length)] || t; }
      const c = this.chase(this.followActor || t, 3.4); eye = c.eye; dir = c.dir; hideBody = c.hide; this.camYawRender = Math.atan2(dir[0], dir[2]);
    } else if (p.view === 'drone' && a.drone && !a.drone.dead) {
      const dr = a.drone; eye = [dr.pos[0], dr.pos[1] + 0.28, dr.pos[2]]; dir = dirOf(p.camYaw, p.camPitch); this.camYawRender = p.camYaw; this.droneJam = dr.jam > 0;
    } else if (p.view === 'cam') {
      const cams = sim.devices.of('def', 'cams'); const c = cams[p.camIndex % Math.max(1, cams.length)];
      if (c) { eye = [c.pos[0] + c.n[0] * 0.1, c.pos[1] + 0.05, c.pos[2] + c.n[2] * 0.1]; dir = dirOf(p.camYaw, p.camPitch); } else { eye = a.eye(); dir = a.look(); }
    } else if (p.view === 'spectate' && p.specTarget) {
      const t = p.specTarget; if (this.settings.specThird) { const c = this.chase(t, 3.2); eye = c.eye; dir = c.dir; hideBody = c.hide; } else { eye = t.eye(); dir = dirOf(t.yaw, t.pitch); hideBody = t; } this.camYawRender = t.yaw;
    } else {
      eye = a.eye(); dir = a.look();
      // lean roll
      const r = a.right; up = [r[0] * -a.lean * 0.18, 1, r[2] * -a.lean * 0.18];
      const res = this.vm.update(dt, a, { f: this.basis(a).f, left: this.basis(a).left, up: this.basis(a).up, eye, dYaw: p.dYaw, dPitch: p.dPitch }, cam);
      p.dYaw = 0; p.dPitch = 0;
      fov = res.fov * E.DEG; this.scopeOn = res.scoped;
      this.camYawRender = a.yaw;
      // head bob while moving on foot
      const sp = Math.hypot(a.vel[0], a.vel[2]);
      this.bobT = (this.bobT || 0) + dt * sp * 2.2; eye = [eye[0], eye[1] + Math.abs(Math.sin(this.bobT)) * 0.012 * Math.min(1, sp / 3) * (1 - res.ads), eye[2]];
      if (this.vm.sprintK) eye[1] += Math.sin(this.bobT * 1.4) * 0.01 * this.vm.sprintK;
    }
    if (p && p.view !== 'player' && p.view !== 'spectate') this.vm.hideAll();
    if (p && p.view === 'spectate' && this.vm.cur) this.vm.hideAll();
    if (sh > 0.01) { eye = [eye[0] + (Math.random() - 0.5) * sh * 0.06, eye[1] + (Math.random() - 0.5) * sh * 0.06, eye[2] + (Math.random() - 0.5) * sh * 0.06]; dir = [dir[0] + (Math.random() - 0.5) * sh * 0.02, dir[1] + (Math.random() - 0.5) * sh * 0.02, dir[2]]; }
    cam.position.set(eye); cam.target.set([eye[0] + dir[0] * 10, eye[1] + dir[1] * 10, eye[2] + dir[2] * 10]); cam.up.set(up); cam.fov = fov;
    cam.near = this.scopeOn ? 0.4 : 0.03;
    // bodies: hide your own in first person, show everyone else
    for (const v of this.views.map.values()) {
      if (v.a === a) v.setShown(!(p && p.view === 'player' && a.alive) && !(p && p.view === 'drone' && false));
      else v.setShown(v.a !== hideBody);
    }
    this.camDir = dir;
  }
  // third-person camera behind an actor: tries a few angles and takes the one with the most room
  chase(t, dist = 3.4) {
    const w = this.sim.world, head = [t.pos[0], t.pos[1] + 1.55, t.pos[2]];
    let best = null, bd = -1;
    for (const off of [0, 0.45, -0.45, 0.9, -0.9]) {
      const back = dirOf(t.yaw + Math.PI + (this.orbit || 0) + off, -0.18);
      const h = w.cast(head[0], head[1], head[2], back[0], back[1], back[2], dist + 0.5, 2);
      const d = h ? Math.max(0, h.t - 0.5) : dist;
      if (d > bd + 0.05) { bd = d; best = back; }
      if (d >= dist * 0.95) break;
    }
    const back = best, d = Math.max(0.35, bd);
    const eye = d < 0.9 ? [head[0], head[1] + 0.05, head[2]] : [head[0] + back[0] * d, head[1] + back[1] * d + 0.25, head[2] + back[2] * d];
    const dir = d < 0.9 ? dirOf(t.yaw, t.pitch) : (() => { const v = [head[0] - eye[0], head[1] - eye[1] - 0.1, head[2] - eye[2]], l = Math.hypot(...v) || 1; return [v[0] / l, v[1] / l, v[2] / l]; })();
    this.clearEye(eye);
    return { eye, dir, hide: d < 0.9 ? t : null };
  }
  // keep a free-floating camera out of nearby walls
  clearEye(e) {
    const w = this.sim.world; let px = 0, pz = 0;
    for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4, dx = Math.sin(a), dz = Math.cos(a), h = w.cast(e[0], e[1], e[2], dx, 0, dz, 0.5, 2); if (h) { px -= dx * (0.5 - h.t); pz -= dz * (0.5 - h.t); } }
    e[0] += px; e[2] += pz;
    const up = w.cast(e[0], e[1], e[2], 0, 1, 0, 0.35, 2); if (up) e[1] -= 0.35 - up.t;
  }
  basis(a) {
    const cy = Math.cos(a.yaw), sy = Math.sin(a.yaw), cp = Math.cos(a.pitch), sp = Math.sin(a.pitch);
    const f = [sy * cp, sp, cy * cp], left = [cy, 0, -sy];
    const up = [f[1] * left[2] - f[2] * left[1], f[2] * left[0] - f[0] * left[2], f[0] * left[1] - f[1] * left[0]];
    return { f, left, up };
  }

  render(dt) {
    if (!this.scene) return;
    const sim = this.sim, env = this.scene.environment, a = this.playerActor;
    env.shadowCenter = [this.cam.position[0] + (this.camDir ? this.camDir[0] * 6 : 0), 1, this.cam.position[2] + (this.camDir ? this.camDir[2] * 6 : 0)];
    const lines = this.fx.lineData(dt);
    const st = this.renderer.settings;
    st.vignette = this.scopeOn ? 0.2 : 0.35;
    const hp = a ? a.hp / (a.maxHp || 100) : 1;
    st.saturation = 0.94 * (a && a.alive ? 0.55 + 0.45 * clamp(hp * 1.6, 0, 1) : 0.35); st.contrast = 1.03;
    this.renderer.render(this.scene, this.cam, { background: 'sky', particles: [this.fx.particles, this.fx.sparks], lines: lines.length ? [{ data: new Float32Array(lines) }] : undefined });
    void sim;
  }
}
