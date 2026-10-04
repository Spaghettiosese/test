// Turns the simulation into pictures and sounds: engine scene nodes for every unit, projectile,
// zone and deployable, first-person viewmodel, camera modes, particles, tracers and decals.
import * as E from '../../engine/index.js';
import { HERO, TEAM_COLORS, SKINS } from './heroes.js';
import { buildHero, buildWeapon, buildPylon, buildSentry, heroColors, mat, glow } from './models.js';
import { buildLevelVisuals, PATH } from './map.js';
import { PAYLOAD_RADIUS } from './sim.js';
import { v3, clamp, forward, TAU } from './util.js';

const DEG = E.DEG;
const rgb = (hex, k = 1) => { const c = E.hexToRGB(hex); return [c[0] * k, c[1] * k, c[2] * k]; };
const TEAM_HEX = ['#3a9bff', '#ff4a52'];

export class View {
  constructor(canvas) {
    this.renderer = new E.Renderer(canvas);
    Object.assign(this.renderer.settings, { adaptiveResolution: true, targetFps: 55, ssr: false, volumetrics: false, godRays: false, minScale: 0.6 });
    this.renderer.settings.sharpen = 0.1; this.renderer.settings.aberration = 0.1;
    this.scene = new E.Scene(); const env = this.env = this.scene.environment;
    E.applyTimeOfDay(env, 15.2);
    Object.assign(env, { fogDensity: 0.0042, fogHeight: 0.1, shadowRadius: 18, shadowFar: 110, skyColor: [0.42, 0.62, 0.95], fogColor: [0.66, 0.77, 0.92], zenithColor: [0.2, 0.42, 0.85], horizonColor: [0.78, 0.86, 0.96], exposure: 0.88, ambient: 0.5, sunIntensity: 3.8, volumetric: 0.2, volumeDensity: 0.01 });
    Object.assign(this.renderer.settings, { saturation: 1.18, contrast: 1.1, bloomStrength: 0.2 });
    this.camera = new E.Camera(); this.camera.near = 0.05; this.camera.far = 600;
    this.particles = new E.Particles(3000); this.sparks = new E.Particles(2200, { additive: true }); this.sparks.gravity = -6; this.sparks.drag = 1.1;
    this.snow = new E.Particles(2600); this.snow.drag = 0.04; this.snow.gravity = 0;
    this.decals = new E.Decals({ max: 300 }); this.scene.add(this.decals);
    this.flash = new E.Light('point', { color: '#ffd9a0', intensity: 0, range: 8 }); this.scene.add(this.flash);
    this.recs = new Map(); this.projs = new Map(); this.deploys = new Map(); this.tracers = []; this.beams = []; this.rings = []; this.nums = []; this.flashT = 0;
    this.shake = 0; this.kick = 0; this.bob = 0; this.sway = [0, 0]; this.mode = 'orbit'; this.orbitT = 0; this.fovH = 90; this.sens = 1;
    this.markEls = new Map(); this.hitT = 0; this.portraits = {}; this.sound = null; this.dmgFlash = 0;
    this.sphereGeo = E.sphere({ radius: 1, widthSegments: 14, heightSegments: 10 }); this.cylGeo = E.cylinder({ radiusTop: 1, radiusBottom: 1, height: 1, radialSegments: 8 });
    this.ringGeo = E.cylinder({ radiusTop: 1, radiusBottom: 1, height: 0.04, radialSegments: 40, capTop: true, capBottom: false });
    this.built = false;
  }

  // ------------------------------------------------------------------ world
  attach(sim, { skin = 'default' } = {}) {
    this.sim = sim; this.mySkin = skin;
    for (const r of this.recs.values()) this.scene.remove(r.model);
    for (const o of [this.projs, this.deploys]) for (const v of o.values()) this.scene.remove(v.node || v);
    for (const b of [...this.beams, ...this.rings]) this.scene.remove(b.mesh);
    this.recs.clear(); this.projs.clear(); this.deploys.clear(); this.beams = []; this.rings = []; this.tracers = [];
    if (this.vmNode) { this.scene.remove(this.vmNode); this.vmNode = null; this.vmHero = null; }
    for (const el of this.markEls.values()) el.remove(); this.markEls.clear();
    for (const n of this.nums) n.el.remove(); this.nums = [];
    if (!this.built) {
      this.level = buildLevelVisuals(this.scene, sim.level); this.built = true;
      this.buildPayload(); this.buildPacks();
    }
    this.decals.clear(); this.particles.list.length = 0; this.sparks.list.length = 0;
    this.me = sim.player; this.deathCam = null; this.lastPlayerHp = null; this.zoneFx = new Map(); this.wasScoped = false;
  }
  buildPayload() {
    const root = new E.Node('Payload'), k = new E.Kit(E.archPalette());
    const body = mat('#c9d3e3', { metallic: 0.5, roughness: 0.35 }), dark = mat('#252a35', { metallic: 0.6, roughness: 0.5 }), blue = glow('#3a9bff', 2);
    k.box(dark, [0, 0.45, 0], [1.9, 0.5, 3.2], [0, 0, 0], 0.08); k.box(body, [0, 0.95, -0.2], [1.6, 0.6, 2.4], [0, 0, 0], 0.1); k.box(blue, [0, 0.62, 1.62], [1.2, 0.14, 0.05]);
    for (const x of [-0.95, 0.95]) for (const z of [-1.1, 1.1]) k.cyl(dark, [x, 0.34, z], 0.34, 0.26, [0, 0, 90], 14);
    k.box(body, [0, 1.35, -0.2], [0.5, 0.25, 0.8], [0, 0, 0], 0.05);
    root.add(k.toNode('PayloadBody'));
    this.payOrb = new E.Mesh(this.sphereGeo, glow('#6fd0ff', 3.5), 'Orb'); this.payOrb.scale.set([0.5, 0.5, 0.5]); this.payOrb.position.set([0, 1.75, -0.2]); root.add(this.payOrb);
    this.payLight = new E.Light('point', { color: '#6fd0ff', intensity: 14, range: 12 }); this.payLight.position.set([0, 2.4, 0]); root.add(this.payLight);
    this.zoneMat = new E.Material({ name: 'PayZone', color: '#3a9bff', emissive: '#3a9bff', emissiveStrength: 1.2, opacity: 0.22, doubleSided: true });
    this.payZone = new E.Mesh(this.ringGeo, this.zoneMat, 'PayZone'); this.payZone.scale.set([PAYLOAD_RADIUS, 1, PAYLOAD_RADIUS]); this.payZone.position.set([0, 0.07, 0]); this.payZone.castShadow = false; this.payZone.receiveShadow = false; root.add(this.payZone);
    this.payload = root; this.scene.add(root);
  }
  buildPacks() {
    this.packNodes = [];
    for (const p of this.sim.packs) {
      const k = new E.Kit(E.archPalette()), g = glow(p.big ? '#7dff9a' : '#a8ffb8', 2.2), s = p.big ? 1.4 : 0.9;
      k.box(g, [0, 0, 0], [0.5 * s, 0.14 * s, 0.14 * s], [0, 0, 0], 0.02); k.box(g, [0, 0, 0], [0.14 * s, 0.5 * s, 0.14 * s], [0, 0, 0], 0.02);
      const n = k.toNode('Pack'); n.position.set([p.pos[0], 0.9, p.pos[2]]); n.traverse((m) => { if (m.geometry) { m.castShadow = false; } }); this.scene.add(n); this.packNodes.push(n);
    }
  }

  // ------------------------------------------------------------------ units
  // hero select shows a dedicated preview model so hero and skin changes are instant (and work while dead)
  syncPreview(dt) {
    const sel = this.mode === 'select' && this.previewHero;
    if (!sel) { if (this.previewNode) this.previewNode.visible = false; if (this.previewLight) this.previewLight.visible = this.previewRim.visible = false; return; }
    const key = this.previewHero + this.mySkin;
    if (this.previewKey !== key) {
      if (this.previewNode) this.scene.remove(this.previewNode);
      this.previewNode = buildHero(this.previewHero, this.mySkin); this.previewNode.userData.ring.material = glow(TEAM_HEX[this.me?.team ?? 0], 1.6); this.scene.add(this.previewNode); this.previewKey = key;
      if (!this.previewLight) { this.previewLight = new E.Light('point', { color: '#fff1dc', intensity: 22, range: 14 }); this.scene.add(this.previewLight); this.previewRim = new E.Light('point', { color: '#7fb0ff', intensity: 14, range: 12 }); this.scene.add(this.previewRim); }
    }
    const n = this.previewNode, d = n.userData, a = this.previewAnchor, t = this.sim.time; n.visible = true;
    this.previewLight.visible = this.previewRim.visible = true; this.previewLight.position.set([a.pos[0] + a.facing[0] * 3 + 1.6, 2.6, a.pos[2] + a.facing[2] * 3]); this.previewRim.position.set([a.pos[0] - a.facing[0] * 2 - 1.5, 2.4, a.pos[2] - a.facing[2] * 2]);
    n.position.set(a.pos); n.setEuler(0, Math.atan2(a.facing[0], a.facing[2]) / DEG + Math.sin(t * 0.5) * 14, 0);
    d.armR.setEuler(-26, 0, -8); d.armL.setEuler(-12, 0, 14); d.head.setEuler(-2, Math.sin(t * 0.7) * 6, 0); d.hips.position.set([0, 0.86 + Math.sin(t * 1.6) * 0.008, 0]);
  }
  recFor(u) {
    let r = this.recs.get(u.id);
    const skin = u.isPlayer ? this.mySkin : (u.skin ??= (u.id % 5 === 0 ? SKINS[1 + (u.id % 3)].id : 'default'));
    const key = u.hero + skin;
    if (r && r.key === key) return r;
    if (r) this.scene.remove(r.model);
    const model = buildHero(u.hero, skin);
    model.userData.ring.material = glow(TEAM_HEX[u.team], 1.6);
    this.scene.add(model);
    r = { model, key, phase: Math.random() * 6, deadT: 0, hidden: false, lastPos: [...u.pos], speed: 0, stepT: 0, barrier: null, beamMesh: null };
    this.recs.set(u.id, r); return r;
  }
  syncUnits(dt) {
    const sim = this.sim, t = sim.time;
    for (const u of sim.units) {
      if (u.deploy) { this.syncDeploy(u, dt); continue; }
      const r = this.recFor(u), m = r.model, d = m.userData, isMe = u === this.me;
      const hideSelf = (isMe && this.mode === 'fps' && u.alive) || (isMe && this.mode === 'select' && this.previewHero);
      m.visible = !hideSelf && !(!u.alive && r.deadT > 4.5);
      m.position.set(u.pos); m.setEuler(0, u.yaw / DEG, 0);
      if (!u.alive) {
        r.deadT += dt; const f = clamp(r.deadT / 0.5, 0, 1), e = f * f * (3 - 2 * f);
        m.setEuler(-86 * e, (u.yaw / DEG) + 30 * e, 0); d.ring.visible = false; continue;
      }
      r.deadT = 0; d.ring.visible = true;
      const sp = Math.hypot(u.vx, u.vz) * (u.grounded ? 1 : 0.3); r.speed += (sp - r.speed) * Math.min(1, dt * 10);
      r.phase += dt * r.speed * 1.9;
      const amp = Math.min(1, r.speed / 5) * 42 * DEG, sw = Math.sin(r.phase) * amp;
      // legs follow the movement direction relative to facing (strafing looks right)
      d.legL.setEuler(sw / DEG, 0, 0); d.legR.setEuler(-sw / DEG, 0, 0);
      d.hips.position.set([0, 0.86 + Math.abs(Math.cos(r.phase)) * 0.03 * Math.min(1, r.speed / 4), 0]);
      const p = u.pitch / DEG; d.head.setEuler(-p * 0.8, 0, 0); d.spine.setEuler(-p * 0.25, 0, 0);
      if (this.mode === 'select') { d.armR.setEuler(-28, 0, -8); d.armL.setEuler(-12, 0, 14); d.head.setEuler(-3, ((Math.sin(t * 0.7) * 8)), 0); }
      else { d.armR.setEuler(-(90 + p) * 1, 0, -6); d.armL.setEuler(-(90 + p) + 12, 0, 22); }
      if (u.st.stun) d.spine.setEuler(18, 0, 0);
      if (u.dash && u.hero === 'bulwark') d.spine.setEuler(24, 0, 0);
      if (!u.grounded) { d.legL.setEuler(-25, 0, 0); d.legR.setEuler(20, 0, 0); }
      d.ring.scale.set([u.def.radius / 0.55 * 1.1, 1, u.def.radius / 0.55 * 1.1]);
      for (const c of m.children) if (c.userData?.wing !== undefined) { /* wings fixed to spine in models */ }
      // footsteps for everyone nearby
      if (u.grounded && r.speed > 2.5) { r.stepT -= dt * r.speed; if (r.stepT <= 0) { r.stepT = 2.4; this.sound?.step(u.pos); } }
      // barrier
      const bar = sim.barrierOf(u);
      if (bar && !r.barrier) { r.barrier = new E.Mesh(E.box({ width: 3.8, height: 2.5, depth: 0.12, bevel: 0.03 }), new E.Material({ name: 'Barrier', color: TEAM_HEX[u.team], emissive: TEAM_HEX[u.team], emissiveStrength: 1.1, opacity: 0.3, doubleSided: true }), 'Barrier'); r.barrier.castShadow = false; this.scene.add(r.barrier); }
      if (r.barrier) {
        r.barrier.visible = !!bar;
        if (bar) { const c = sim.barrierCenter(u); r.barrier.position.set(c); r.barrier.setEuler(0, u.yaw / DEG, 0); r.barrier.material.opacity = 0.12 + 0.3 * (u.s.barrier.hp / u.s.barrier.max); }
      }
      // heal beam
      const tgt = u.s.beam;
      if (tgt && tgt.alive && u.alive && u.hero === 'halo' && u.in.fire2) {
        const from = isMe && this.mode === 'fps' ? this.muzzleFP() : sim.muzzle(u), to = sim.center(tgt);
        this.beamMesh(r, from, [to[0], to[1] + 0.1, to[2]], '#9fe9ff', 0.045);
        this.sparks.emit(to, { count: 1, spread: 0.5, up: 0.7, size: 0.06, color: [0.5, 2.2, 3, 1], colorEnd: [0.3, 1, 2, 0.2], life: 0.6, jitter: 0.2 });
      } else if (r.beamMesh) r.beamMesh.visible = false;
      // status glow
      if (u.st.burn && Math.random() < 0.5) this.sparks.emit([u.pos[0], u.pos[1] + 1, u.pos[2]], { count: 1, spread: 0.3, up: 1.6, size: 0.09, color: [4, 1.6, 0.3, 1], colorEnd: [1.5, 0.2, 0.05, 0.1], life: 0.5, jitter: 0.25, grow: 0.3 });
      if (u.st.overdrive || u.st.dmgBoost) if (Math.random() < 0.3) this.sparks.emit([u.pos[0], u.pos[1] + 1, u.pos[2]], { count: 1, spread: 0.5, up: 0.8, size: 0.05, color: [3, 2.5, 0.6, 1], life: 0.5, jitter: 0.3 });
      if (u.shield > 5 && Math.random() < 0.2) this.sparks.emit([u.pos[0], u.pos[1] + 1.2, u.pos[2]], { count: 1, spread: 0.6, up: 0.4, size: 0.05, color: [0.6, 2, 3.2, 1], life: 0.4, jitter: 0.4 });
    }
    for (const [id, r] of this.recs) if (!sim.units.some((u) => u.id === id)) { this.scene.remove(r.model); this.recs.delete(id); }
  }
  beamMesh(r, a, b, color, radius = 0.04) {
    let mesh = r.beamMesh;
    if (!mesh) { mesh = r.beamMesh = new E.Mesh(this.cylGeo, new E.Material({ name: 'Beam', color, emissive: color, emissiveStrength: 4, opacity: 0.7, doubleSided: true }), 'Beam'); mesh.castShadow = false; this.scene.add(mesh); }
    this.placeBeam(mesh, a, b, radius); mesh.visible = true;
  }
  placeBeam(mesh, a, b, radius) {
    const d = v3.sub(b, a), l = v3.len(d) || 0.01, q = E.quat.rotationTo(E.quat.create(), [0, 1, 0], [d[0] / l, d[1] / l, d[2] / l]);
    mesh.position.set([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]); E.quat.copy(mesh.rotation, q); mesh.scale.set([radius, l, radius]);
  }
  syncDeploy(u, dt) {
    let n = this.deploys.get(u.id);
    if (!n) {
      const c = heroColors(u.hero); n = u.deploy.kind === 'pylon' ? buildPylon(c) : buildSentry(c);
      this.scene.add(n); this.deploys.set(u.id, n);
      const ring = new E.Mesh(this.ringGeo, glow(TEAM_HEX[u.team], 1.2), 'DRing'); ring.scale.set([u.deploy.kind === 'pylon' ? 6 : 0.7, 1, u.deploy.kind === 'pylon' ? 6 : 0.7]); ring.position.set([0, 0.05, 0]); ring.castShadow = false;
      if (u.deploy.kind === 'pylon') { ring.material = new E.Material({ name: 'PylonRing', color: '#9dff9d', emissive: '#9dff9d', emissiveStrength: 0.8, opacity: 0.12, doubleSided: true }); } n.add(ring);
    }
    n.position.set(u.pos);
    if (u.deploy.kind === 'sentry' && n.userData.head) n.userData.head.setEuler(0, u.yaw / DEG, 0);
    n.visible = true;
  }
  removeDeploy(u) { const n = this.deploys.get(u.id); if (n) { this.scene.remove(n); this.deploys.delete(u.id); } }

  // ------------------------------------------------------------------ projectiles and zones
  syncProjs(dt) {
    const sim = this.sim, live = new Set();
    for (const p of sim.projs) {
      live.add(p.id);
      let m = this.projs.get(p.id);
      if (!m) {
        const s = p.spec.size || 0.2, c = p.spec.color || '#fff';
        m = new E.Mesh(this.sphereGeo, glow(c, 4), 'Proj'); m.scale.set([s, s, s]); m.castShadow = false; this.scene.add(m); this.projs.set(p.id, m);
      }
      m.position.set(p.pos);
      const c = rgb(p.spec.color || '#ffffff', 3);
      this.sparks.emit(p.pos, { count: 2, spread: 0.12, up: 0.05, size: (p.spec.size || 0.2) * 0.5, color: [...c, 1], colorEnd: [c[0] * 0.3, c[1] * 0.3, c[2] * 0.3, 0.1], life: 0.35, jitter: 0.03, grow: 0.3 });
    }
    for (const [id, m] of this.projs) if (!live.has(id)) { this.scene.remove(m); this.projs.delete(id); }
  }
  syncZones(dt) {
    const sim = this.sim, live = new Set();
    for (const z of sim.zones) {
      live.add(z.id);
      let f = this.zoneFx.get(z.id);
      if (!f) {
        f = { mesh: null };
        const col = z.kind === 'dome' ? TEAM_HEX[z.team] : z.kind === 'hole' ? '#7a4bff' : z.kind === 'bomb' ? '#40e0ff' : null;
        if (z.kind === 'dome') { f.mesh = new E.Mesh(this.sphereGeo, new E.Material({ name: 'Dome', color: col, emissive: col, emissiveStrength: 0.8, opacity: 0.16, doubleSided: true }), 'Dome'); f.mesh.scale.set([z.r, z.r, z.r]); }
        else if (z.kind === 'hole') { f.mesh = new E.Mesh(this.sphereGeo, new E.Material({ name: 'Hole', color: '#0a0014', emissive: '#7a4bff', emissiveStrength: 0.6, roughness: 0.2 }), 'Hole'); f.mesh.scale.set([0.9, 0.9, 0.9]); }
        else if (z.kind === 'bomb') { f.mesh = new E.Mesh(this.sphereGeo, glow('#40e0ff', 3), 'Bomb'); f.mesh.scale.set([0.25, 0.25, 0.25]); }
        else if (z.kind === 'fire') { f.mesh = new E.Mesh(this.ringGeo, new E.Material({ name: 'FireField', color: '#ff6a1a', emissive: '#ff5a10', emissiveStrength: 1, opacity: 0.25, doubleSided: true }), 'Fire'); f.mesh.scale.set([z.r, 1, z.r]); }
        if (f.mesh) { f.mesh.castShadow = false; f.mesh.receiveShadow = false; this.scene.add(f.mesh); }
        this.zoneFx.set(z.id, f);
      }
      if (f.mesh) { f.mesh.position.set(z.kind === 'fire' ? [z.pos[0], z.pos[1] + 0.06, z.pos[2]] : z.kind === 'hole' ? [z.pos[0], z.pos[1] + 1.4, z.pos[2]] : z.pos); if (z.kind === 'hole') { const s = 0.9 + Math.sin(z.age * 6) * 0.1; f.mesh.scale.set([s, s, s]); } if (z.kind === 'bomb') { const s = 0.22 + (Math.sin(z.age * (6 + z.age * 10)) * 0.5 + 0.5) * 0.14; f.mesh.scale.set([s, s, s]); } }
      const R = Math.random;
      if (z.kind === 'fire') for (let i = 0; i < 4; i++) { const a = R() * TAU, r = Math.sqrt(R()) * z.r; this.sparks.emit([z.pos[0] + Math.cos(a) * r, z.pos[1] + 0.1, z.pos[2] + Math.sin(a) * r], { count: 1, spread: 0.2, up: 2.4, size: 0.28, color: [4, 1.6, 0.3, 1], colorEnd: [1.2, 0.1, 0.0, 0.1], life: 0.7, jitter: 0.1, grow: 0.3, buoyancy: 2 }); if (R() < 0.15) this.particles.emit([z.pos[0] + Math.cos(a) * r, z.pos[1] + 1, z.pos[2] + Math.sin(a) * r], { count: 1, spread: 0.2, up: 0.6, size: 0.5, color: [0.2, 0.2, 0.22, 0.4], colorEnd: [0.3, 0.3, 0.3, 0], life: 2, grow: 4, buoyancy: 0.4 }); }
      else if (z.kind === 'wall') { const cs = Math.cos(z.yaw), sn = Math.sin(z.yaw); for (let i = 0; i < 5; i++) { const lx = (R() - 0.5) * z.len; this.sparks.emit([z.pos[0] + cs * lx, z.pos[1] + 0.1, z.pos[2] - sn * lx], { count: 1, spread: 0.15, up: 3, size: 0.3, color: [4, 1.6, 0.3, 1], colorEnd: [1.2, 0.1, 0, 0.1], life: 0.8, jitter: 0.05, grow: 0.3, buoyancy: 2.5 }); } }
      else if (z.kind === 'hole') { for (let i = 0; i < 6; i++) { const a = R() * TAU, r = z.r * (0.4 + R() * 0.6); this.sparks.emit([z.pos[0] + Math.cos(a) * r, z.pos[1] + 0.3 + R() * 2.4, z.pos[2] + Math.sin(a) * r], { count: 1, spread: 0.1, up: 0, size: 0.1, color: [1.6, 0.8, 4, 1], colorEnd: [0.6, 0.2, 1.4, 0.1], life: 0.5, vel: [(z.pos[0] - (z.pos[0] + Math.cos(a) * r)) * 2.2 - Math.sin(a) * 4, 0, (z.pos[2] - (z.pos[2] + Math.sin(a) * r)) * 2.2 + Math.cos(a) * 4], jitter: 0 }); } }
    }
    for (const [id, f] of this.zoneFx) if (!live.has(id)) { if (f.mesh) this.scene.remove(f.mesh); this.zoneFx.delete(id); }
  }
  syncWorld(dt) {
    const P = this.sim.payload, t = this.sim.time;
    this.payload.position.set(P.pos); this.payOrb.position.set([0, 1.75 + Math.sin(t * 2) * 0.05, -0.2]);
    const col = P.contested ? '#ffd36b' : P.pushers ? '#6fd0ff' : '#6fd0ff';
    this.zoneMat.color = P.contested ? '#ffd36b' : '#3a9bff'; this.zoneMat.emissive = this.zoneMat.color; this.zoneMat.opacity = 0.16 + (P.pushers ? 0.1 : 0);
    this.payLight.intensity = 10 + Math.sin(t * 3) * 3;
    this.sim.packs.forEach((p, i) => { const n = this.packNodes[i]; n.visible = p.ready; n.position.set([p.pos[0], 0.9 + Math.sin(t * 2 + i) * 0.08, p.pos[2]]); n.setEuler(0, t * 60 + i * 40, 0); });
    // echo cores
    const cores = this.sim.cores; this.coreNodes ||= [];
    while (this.coreNodes.length < cores.length) { const m = new E.Mesh(E.sphere({ radius: 0.22, widthSegments: 10, heightSegments: 8 }), glow('#ffd36b', 3.5), 'Core'); m.castShadow = false; this.scene.add(m); this.coreNodes.push(m); }
    this.coreNodes.forEach((m, i) => { const c = cores[i]; m.visible = !!c; if (c) { m.position.set([c.pos[0], c.pos[1] + 0.4 + Math.sin(t * 3 + i) * 0.1, c.pos[2]]); m.material = glow(TEAM_HEX[c.team] === '#3a9bff' ? '#7fc4ff' : '#ff9a9a', 3.5); if (Math.random() < 0.3) this.sparks.emit(m.position, { count: 1, spread: 0.2, up: 0.8, size: 0.05, color: [3, 2.4, 0.8, 1], life: 0.5, jitter: 0.1 }); } });
    // falling snow around the camera
    const cp = this.camera.position, wind = this.mutatorWind || 1.2;
    for (let i = 0; i < 22; i++) this.snow.emit([cp[0] + (Math.random() - 0.5) * 50, cp[1] + 9 + Math.random() * 6, cp[2] + (Math.random() - 0.5) * 50], { count: 1, spread: 0.2, up: 0, size: 0.05, grow: 1, color: [1, 1, 1, 0.85], life: 9, vel: [wind, -1.5, 0.3], jitter: 0 });
  }

  // ------------------------------------------------------------------ events
  handle(events) {
    const sim = this.sim, me = this.me;
    for (const e of events) {
      switch (e.type) {
        case 'shot': {
          const u = e.unit; if (!u) break;
          this.sound?.shot(e.sound, u.pos, u === me);
          if (u === me) { this.kick = Math.min(1.4, this.kick + 0.5); }
          const mz = u === me && this.mode === 'fps' ? this.muzzleFP() : sim.muzzle(u), col = HERO[u.hero].colors.accent;
          this.flash.position.set(mz); this.flash.intensity = u === me ? 14 : 8; this.flashT = 0.05; this.flash.color = '#ffd9a0';
          this.sparks.emit(mz, { count: 3, spread: 0.5, up: 0.2, size: 0.05, color: [5, 3.6, 1.4, 1], colorEnd: [2, 0.6, 0.1, 0.3], life: 0.16, vel: v3.scale(forward(u.yaw, u.pitch), 2), jitter: 0.02 });
          break;
        }
        case 'tracer': {
          const w = e.width || 1;
          const from = e.unit === me && this.mode === 'fps' ? this.muzzleFP() : e.from;
          if (w > 1.4 || e.hit === 'lance' || e.hit === 'grapple') { const mesh = new E.Mesh(this.cylGeo, new E.Material({ name: 'Rail', color: e.color, emissive: e.color, emissiveStrength: 5, opacity: 0.85, doubleSided: true }), 'Rail'); mesh.castShadow = false; this.scene.add(mesh); this.placeBeam(mesh, from, e.to, 0.03 * w); this.beams.push({ mesh, t: e.hit === 'grapple' ? 0.35 : 0.22, t0: e.hit === 'grapple' ? 0.35 : 0.22, w }); }
          else this.tracers.push({ a: from, b: e.to, c: rgb(e.color || '#ffd27a', 3), age: 0, len: v3.dist(from, e.to) });
          break;
        }
        case 'impact': {
          if (e.normal) this.decals.add(e.point, e.normal, 0.06 + Math.random() * 0.04);
          this.sparks.emit(e.point, { count: 4, spread: 1, up: 0.8, size: 0.02, color: [4, 3, 1.4, 1], colorEnd: [1, 0.4, 0.1, 0.2], life: 0.22, jitter: 0.01 });
          this.particles.emit(e.point, { count: 2, spread: 0.3, up: 0.3, size: 0.07, color: [0.95, 0.97, 1, 0.55], colorEnd: [1, 1, 1, 0], life: 0.7, grow: 3 });
          break;
        }
        case 'dmg': {
          if (e.src === me && e.tgt !== me && e.amt > 0.5) { this.hitT = 0.28; this.onHit?.(e); this.sound?.hit(e.head); if (e.kind !== 'burn') this.damageNumber(e); }
          if (e.tgt === me) { this.shake = Math.min(1, this.shake + Math.min(0.5, e.amt / 120)); this.dmgFlash = 1; this.sound?.hurt(); this.onHurt?.(e); }
          if (e.tgt.deploy || e.kind === 'bullet') this.sparks.emit(e.point, { count: 2, spread: 0.6, up: 0.4, size: 0.04, color: e.tgt.team ? [4, 1.2, 1, 1] : [1.5, 2.5, 4, 1], life: 0.2, jitter: 0.05 });
          break;
        }
        case 'kill': this.deathFx(e); this.onKill?.(e); break;
        case 'boom': {
          const big = e.kind === 'big' || e.kind === 'slam' || e.r > 4, c = rgb(e.color || '#ffb061', 3);
          this.sparks.emit(e.pos, { count: big ? 60 : 20, spread: big ? 6 : 3, up: big ? 5 : 3, size: big ? 0.2 : 0.12, color: [...c, 1], colorEnd: [c[0] * 0.3, c[1] * 0.2, 0, 0.1], life: big ? 0.9 : 0.5, jitter: 0.2, grow: 0.4 });
          this.particles.emit(e.pos, { count: big ? 14 : 6, spread: big ? 3 : 1.4, up: 1, size: big ? 0.9 : 0.5, color: [0.7, 0.72, 0.78, 0.5], colorEnd: [0.85, 0.87, 0.9, 0], life: 2, grow: 4, buoyancy: 0.5, jitter: 0.3 });
          this.flash.position.set(e.pos); this.flash.intensity = big ? 60 : 24; this.flashT = 0.12; this.flash.color = e.color || '#ffb061';
          this.sound?.boom(e.pos, big); this.addRing(e.pos, e.r || 1, e.color || '#ffb061', 0.4);
          const d = v3.dist(e.pos, this.camera.position); if (d < 30) this.shake = Math.min(1, this.shake + (big ? 0.6 : 0.2) * (1 - d / 30));
          break;
        }
        case 'pulse': this.addRing(e.pos, e.r, e.color, e.kind === 'slam' ? 0.5 : 0.6); this.sound?.whoosh(e.pos, 400, 1800); break;
        case 'blink': {
          const c = rgb(e.color, 3);
          for (const p of [e.from, e.to]) this.sparks.emit([p[0], p[1] + 1, p[2]], { count: 18, spread: 1.4, up: 1.4, size: 0.07, color: [...c, 1], colorEnd: [c[0] * 0.2, c[1] * 0.2, c[2] * 0.2, 0.1], life: 0.5, jitter: 0.25 });
          this.sound?.blink(e.to);
          break;
        }
        case 'dash': this.sound?.whoosh(e.unit.pos, 200, 900); break;
        case 'jump': if (e.unit === me) this.sound?.jump(e.unit.pos); break;
        case 'land': if (e.unit === me || v3.dist(e.unit.pos, this.camera.position) < 20) { this.sound?.land(e.unit.pos); this.particles.emit(e.unit.pos, { count: 6, spread: 1.2, up: 0.4, size: 0.2, color: [0.95, 0.97, 1, 0.5], colorEnd: [1, 1, 1, 0], life: 0.9, grow: 3 }); } break;
        case 'reload': if (e.unit === me) this.sound?.reload(); break;
        case 'sonar': this.addRing(e.pos, 12, e.color, 0.9); this.sound?.whoosh(e.pos, 1500, 300); break;
        case 'fizzle': this.sparks.emit(e.pos, { count: 8, spread: 1, up: 0.5, size: 0.05, color: [1.5, 2.5, 4, 1], life: 0.3 }); break;
        case 'barrierHit': this.sparks.emit(e.point, { count: 6, spread: 1, up: 0.4, size: 0.05, color: [1.5, 3, 5, 1], life: 0.25 }); break;
        case 'barrierBreak': this.addRing(e.unit.pos, 3, '#5bbcff', 0.5); this.sound?.boom(e.unit.pos, false); break;
        case 'pack': this.sound?.pack(e.pos); break;
        case 'core': this.sound?.core(e.pos); this.addRing(e.pos, 2, '#ffd36b', 0.5); break;
        case 'ult': { this.sound?.ult(e.unit.pos, e.unit === me); this.addRing(e.unit.pos, 9, TEAM_HEX[e.unit.team], 0.9); this.onUlt?.(e); break; }
        case 'revive': this.addRing(e.unit.pos, 3, '#fff1a8', 0.8); this.sound?.core(e.unit.pos); break;
        case 'spawn': if (!e.unit.isPlayer || this.sim.time > 1) this.addRing(e.unit.pos, 1.6, TEAM_HEX[e.unit.team], 0.5); if (e.unit === me) this.deathCam = null; break;
        case 'deploy': this.addRing(e.unit.pos, 2, TEAM_HEX[e.unit.team], 0.5); break;
        case 'destroy': this.removeDeploy(e.unit); if (!e.quiet) { this.sparks.emit(e.unit.pos, { count: 24, spread: 3, up: 3, size: 0.1, color: [4, 2.4, 0.8, 1], life: 0.6 }); this.sound?.boom(e.unit.pos, false); } break;
        default: this.onEvent?.(e);
      }
      if (['checkpoint', 'overtime', 'mutator', 'mutatorEnd', 'live', 'over', 'swap', 'kill', 'ult', 'core', 'revive', 'spawn'].includes(e.type)) this.onEvent?.(e);
    }
  }
  deathFx(e) {
    const v = e.victim; if (v.deploy) return;
    const p = [v.pos[0], v.pos[1] + 1, v.pos[2]], c = rgb(TEAM_HEX[v.team], 3);
    this.sparks.emit(p, { count: 24, spread: 2, up: 2.4, size: 0.08, color: [...c, 1], colorEnd: [c[0] * 0.2, c[1] * 0.2, c[2] * 0.2, 0.1], life: 0.9, jitter: 0.2 });
    this.particles.emit(p, { count: 5, spread: 0.8, up: 0.6, size: 0.5, color: [0.55, 0.58, 0.66, 0.45], colorEnd: [0.7, 0.72, 0.78, 0], life: 1.8, grow: 4, buoyancy: 0.3 });
    if (v === this.me) this.deathCam = { killer: e.killer, t: 0 };
  }
  addRing(pos, r, color, dur) {
    const m = new E.Mesh(this.ringGeo, new E.Material({ name: 'Ring', color, emissive: color, emissiveStrength: 2.2, opacity: 0.55, doubleSided: true }), 'Ring');
    m.castShadow = false; m.receiveShadow = false; m.position.set([pos[0], (pos[1] || 0) + 0.12, pos[2]]); m.scale.set([0.2, 1, 0.2]); this.scene.add(m); this.rings.push({ mesh: m, t: dur, t0: dur, r });
  }
  damageNumber(e) {
    const ex = this.nums.find((n) => n.tgt === e.tgt && n.t > 0.55);
    if (ex) { ex.amt += e.amt; ex.el.textContent = Math.round(ex.amt); ex.t = 0.9; ex.p = [e.point[0], e.point[1] + 0.3, e.point[2]]; if (e.head) { ex.el.style.color = '#ffd36b'; } return; }
    const el = document.createElement('div'); el.className = 'dn' + (e.head ? ' head' : ''); el.textContent = Math.round(e.amt);
    Object.assign(el.style, { position: 'fixed', pointerEvents: 'none', zIndex: 3, font: `italic 700 ${e.head ? 1.5 : 1.1}rem 'Barlow Condensed', sans-serif`, color: e.head ? '#ffd36b' : '#fff', textShadow: '0 0 4px #000, 0 0 2px #000', transform: 'translate(-50%,-50%)' });
    document.getElementById('hud').append(el);
    this.nums.push({ el, p: [e.point[0] + (Math.random() - 0.5) * 0.4, e.point[1] + 0.3, e.point[2] + (Math.random() - 0.5) * 0.4], t: 0.9, tgt: e.tgt, amt: e.amt });
    if (this.nums.length > 14) this.nums.shift().el.remove();
  }

  // ------------------------------------------------------------------ camera and viewmodel
  basis(yaw, pitch) { const f = forward(yaw, pitch), right = [-Math.cos(yaw), 0, Math.sin(yaw)], up = v3.cross(right, f); return { f, right, up }; }
  muzzleFP() {
    const me = this.me, { f, right, up } = this.basis(me.yaw, me.pitch), e = this.sim.eye(me);
    return [e[0] + f[0] * 0.9 + right[0] * 0.18 + up[0] * -0.12, e[1] + f[1] * 0.9 + right[1] * 0.18 + up[1] * -0.12, e[2] + f[2] * 0.9 + right[2] * 0.18 + up[2] * -0.12];
  }
  ensureViewmodel() {
    const me = this.me; if (!me) return;
    const key = me.hero + this.mySkin; if (this.vmHero === key) return;
    if (this.vmNode) this.scene.remove(this.vmNode);
    const c = heroColors(me.hero, this.mySkin), w = buildWeapon(me.hero, c), node = new E.Node('Viewmodel');
    const skin = mat(c.skin, { roughness: 0.7 }), glove = mat('#23262d', { metallic: 0.3 }), sleeve = mat(c.primary, { roughness: 0.5 }), k = new E.Kit(E.archPalette());
    k.box(sleeve, [0.16, -0.22, -0.28], [0.14, 0.14, 0.7], [-12, 8, 0], 0.03); k.box(glove, [0.1, -0.1, 0.0], [0.11, 0.11, 0.14], [0, 0, 0], 0.03);
    k.box(sleeve, [-0.16, -0.2, 0.16], [0.13, 0.13, 0.8], [-10, -12, 0], 0.03); k.box(glove, [-0.06, -0.04, 0.46], [0.11, 0.1, 0.16], [0, 0, 0], 0.03);
    const arms = k.toNode('Arms'); node.add(arms); node.add(w.node); w.node.position.set([0, 0, 0.0]);
    node.traverse((n) => { n.castShadow = false; n.receiveShadow = false; n.pickable = false; });
    this.scene.add(node); this.vmNode = node; this.vmHero = key; this.vmMuzzle = w.muzzle;
  }
  updateCamera(dt, input) {
    const cam = this.camera, sim = this.sim, me = this.me, aspect = this.renderer.width / this.renderer.height || 1.78;
    const vfov = (h) => 2 * Math.atan(Math.tan(h * DEG / 2) / aspect);
    let mode = this.mode;
    this.shake *= Math.exp(-dt * 6); this.kick *= Math.exp(-dt * 12); this.dmgFlash *= Math.exp(-dt * 4);
    if (mode === 'fps' && me) {
      if (!me.alive) { mode = this.deathCam ? 'death' : 'fps'; }
      if (me.alive) {
        const e = sim.eye(me), sh = this.shake, rnd = () => (Math.random() - 0.5);
        const { f, up } = this.basis(me.yaw, me.pitch);
        const bobAmt = clamp(Math.hypot(me.vx, me.vz) / 5, 0, 1) * (me.grounded ? 1 : 0.2); this.bob += dt * Math.hypot(me.vx, me.vz) * 1.9;
        const ey = e[1] + Math.sin(this.bob * 2) * 0.012 * bobAmt;
        cam.position.set([e[0] + rnd() * 0.04 * sh, ey + rnd() * 0.04 * sh, e[2] + rnd() * 0.04 * sh]);
        cam.target.set([cam.position[0] + f[0] + rnd() * 0.02 * sh, cam.position[1] + f[1] + rnd() * 0.02 * sh, cam.position[2] + f[2]]); cam.up.set(up);
        const scoped = me.s.scoped && me.hero === 'vesper' && me.alive;
        const hf = scoped ? 30 - 12 * (me.s.charge || 0) * 0 : this.fovH;
        this.fovCur = (this.fovCur ?? this.fovH); this.fovCur += (hf - this.fovCur) * Math.min(1, dt * (scoped ? 14 : 10));
        cam.fov = vfov(this.fovCur + (this.sim.mutator?.id === 'lowgrav' ? 4 : 0)); cam.near = 0.04;
        this.scoped = scoped && this.fovCur < 36;
      }
    }
    if (mode === 'death') {
      this.deathCam.t += dt; const k = this.deathCam.killer && this.deathCam.killer.alive ? this.deathCam.killer : null, tgt = k ? sim.center(k) : [me.pos[0], me.pos[1] + 1, me.pos[2]];
      const a = this.deathCam.t * 0.2, d = 4.2;
      cam.position.set([tgt[0] - Math.sin(k ? k.yaw : a) * d, tgt[1] + 1.2, tgt[2] - Math.cos(k ? k.yaw : a) * d]); cam.target.set(tgt); cam.up.set([0, 1, 0]); cam.fov = vfov(70); this.scoped = false;
    }
    if (mode === 'orbit') {
      this.orbitT += dt * 0.18; const P = sim.payload.pos, tgt = [P[0], 1.4, P[2] + 4], r = 17 + Math.sin(this.orbitT * 0.7) * 5;
      cam.position.set([tgt[0] + Math.cos(this.orbitT) * r, 5.5 + Math.sin(this.orbitT * 0.6) * 1.5, tgt[2] + Math.sin(this.orbitT) * r]); cam.target.set(tgt); cam.up.set([0, 1, 0]); cam.fov = vfov(62); this.scoped = false;
    }
    if (mode === 'free' && this.freeCam) { cam.position.set(this.freeCam.pos); cam.target.set(this.freeCam.target); cam.up.set([0, 1, 0]); cam.fov = vfov(this.freeCam.fov || 60); this.scoped = false; }
    if (mode === 'select') {
      const p = this.previewAnchor; // hero stands at p, facing the camera
      const f = p.facing; const sway = Math.sin(this.sim.time * 0.4) * 0.25; cam.position.set([p.pos[0] + f[0] * 4.3 + 0.9 + sway, 1.25, p.pos[2] + f[2] * 4.3]); cam.target.set([p.pos[0] - 0.1, 1.2, p.pos[2]]); cam.up.set([0, 1, 0]); cam.fov = vfov(48); this.scoped = false;
    }
    this.listener = { pos: [cam.position[0], cam.position[1], cam.position[2]], yaw: me ? me.yaw : 0 };
    if (this.sound) { this.sound.listener.pos = this.listener.pos; this.sound.listener.yaw = this.listener.yaw; }
    this.curMode = mode;
  }
  updateViewmodel(dt) {
    const me = this.me, show = this.curMode === 'fps' && me && me.alive && !this.scoped && this.sim.state !== 'over';
    this.ensureViewmodel(); const node = this.vmNode; if (!node) return;
    node.visible = !!show; if (!show) return;
    const { f, right, up } = this.basis(me.yaw, me.pitch), e = this.camera.position;
    const sp = Math.hypot(me.vx, me.vz), bobA = clamp(sp / 5, 0, 1) * (me.grounded ? 1 : 0.2);
    this.sway[0] += (clamp(-(this._dyaw || 0) * 0.5, -0.06, 0.06) - this.sway[0]) * Math.min(1, dt * 8); this.sway[1] += (clamp(-(this._dpitch || 0) * 0.5, -0.05, 0.05) - this.sway[1]) * Math.min(1, dt * 8); this._dyaw = this._dpitch = 0;
    const off = [0.2 + this.sway[0] + Math.sin(this.bob) * 0.012 * bobA, -0.22 + this.sway[1] - Math.abs(Math.cos(this.bob)) * 0.012 * bobA, 0.5 - this.kick * 0.05];
    const slide = me.dash ? 0.12 : 0, reloadDip = me.reloadT > 0 ? Math.sin(Math.min(1, (1 - me.reloadT / (me.def.w1.reload || 1)) ) * Math.PI) * 0.18 : 0, ultDip = me.s.ulting ? 0.08 : 0;
    const px = e[0] + right[0] * off[0] + up[0] * (off[1] - reloadDip - slide) + f[0] * off[2], py = e[1] + right[1] * off[0] + up[1] * (off[1] - reloadDip - slide) + f[1] * off[2], pz = e[2] + right[2] * off[0] + up[2] * (off[1] - reloadDip - slide) + f[2] * off[2];
    node.position.set([px, py, pz]);
    node.setEuler(-(me.pitch / DEG) - this.kick * 3 + reloadDip * 90, me.yaw / DEG, 0);
    const s = 0.55; node.scale.set([s, s, s]);
  }

  // ------------------------------------------------------------------ overlays
  project(p) {
    const m = this.camera.viewProj, x = p[0], y = p[1], z = p[2], w = m[3] * x + m[7] * y + m[11] * z + m[15];
    if (w <= 0.05) return null;
    const nx = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w, ny = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
    return { x: (nx * 0.5 + 0.5) * innerWidth, y: (1 - (ny * 0.5 + 0.5)) * innerHeight, w, off: Math.abs(nx) > 1 || Math.abs(ny) > 1 };
  }
  updateOverlays(dt) {
    for (const n of this.nums) { n.t -= dt; n.p[1] += dt * 0.9; const s = this.project(n.p); n.el.style.opacity = clamp(n.t / 0.5, 0, 1); if (s) { n.el.style.left = s.x + 'px'; n.el.style.top = s.y + 'px'; } else n.el.style.opacity = 0; if (n.t <= 0) n.el.remove(); }
    this.nums = this.nums.filter((n) => n.t > 0);
  }
  tick(dt) {
    // ephemeral effects
    for (const t of this.tracers) t.age += dt; this.tracers = this.tracers.filter((t) => t.age < 0.1);
    for (const b of this.beams) { b.t -= dt; b.mesh.material.opacity = 0.85 * clamp(b.t / b.t0, 0, 1); b.mesh.scale.set([b.mesh.scale[0] * (1 - dt * 1.5), b.mesh.scale[1], b.mesh.scale[2] * (1 - dt * 1.5)]); if (b.t <= 0) this.scene.remove(b.mesh); }
    this.beams = this.beams.filter((b) => b.t > 0);
    for (const r of this.rings) { r.t -= dt; const k = 1 - clamp(r.t / r.t0, 0, 1); r.mesh.scale.set([Math.max(0.2, r.r * (0.2 + k * 0.8)), 1, Math.max(0.2, r.r * (0.2 + k * 0.8))]); r.mesh.material.opacity = 0.55 * (1 - k); if (r.t <= 0) this.scene.remove(r.mesh); }
    this.rings = this.rings.filter((r) => r.t > 0);
    if (this.flashT > 0) { this.flashT -= dt; if (this.flashT <= 0) this.flash.intensity = 0; }
    this.particles.update(dt); this.sparks.update(dt); this.snow.update(dt);
  }

  // ------------------------------------------------------------------ frame
  render(dt) {
    const lines = [];
    for (const t of this.tracers) {
      const l = t.len, d = [(t.b[0] - t.a[0]) / (l || 1), (t.b[1] - t.a[1]) / (l || 1), (t.b[2] - t.a[2]) / (l || 1)], head = Math.min(l, t.age * 420 + 6), tail = Math.max(0, head - 14);
      const a = v3.madd(t.a, d, tail), b = v3.madd(t.a, d, head), al = clamp(1 - t.age / 0.1, 0, 1);
      lines.push(...a, ...t.c, al * 0.2, ...b, ...t.c, al);
    }
    const r = this.renderer;
    r.settings.vignette = this.scoped ? 0.25 : 0.32; r.settings.dofAperture = 0;
    const me = this.me; this.env.shadowCenter = [this.camera.position[0], 1, this.camera.position[2]];
    // whiteout surge thickens the fog
    const wo = this.sim?.mutator?.id === 'blizzard'; this.env.fogDensity += ((wo ? 0.02 : 0.0042) - this.env.fogDensity) * Math.min(1, dt * 1.5); this.mutatorWind = wo ? 7 : 1.2;
    r.render(this.scene, this.camera, { background: 'sky', particles: [this.particles, this.sparks, this.snow], lines: lines.length ? [{ data: new Float32Array(lines) }] : undefined });
  }
}
