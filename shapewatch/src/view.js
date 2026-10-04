// Turns the simulation into pictures and sounds: engine scene nodes for every unit, the themed
// level, objectives, first-person viewmodel and the camera modes (first person, spectate, orbit,
// chase for replays, hero preview). Effects live in fx.js. The View only reads simulation data, so
// a replay (proxy units fed by replay.js) goes through exactly the same code.
import * as E from '../../engine/index.js';
import { HERO, SKINS } from './heroes.js';
import { buildHero, buildWeapon, buildPylon, buildSentry, heroColors, mat, glow, animateHero } from './models.js';
import { buildLevelVisuals, THEMES } from './maps.js';
import { PAYLOAD_RADIUS } from './modes.js';
import { heroPose } from './portraits.js';
import { Fx, rgb } from './fx.js';
import { v3, clamp, forward, TAU, lerp } from './util.js';

const DEG = E.DEG;
export const ALLY = '#3a9bff', ENEMY = '#ff4a52';
const R = Math.random;

export class View {
  constructor(canvas) {
    this.renderer = new E.Renderer(canvas);
    Object.assign(this.renderer.settings, { adaptiveResolution: true, targetFps: 55, ssr: false, volumetrics: false, godRays: false, minScale: 0.6 });
    this.renderer.settings.sharpen = 0.1; this.renderer.settings.aberration = 0.1;
    this.scene = new E.Scene(); this.env = this.scene.environment;
    this.camera = new E.Camera(); this.camera.near = 0.05; this.camera.far = 700;
    this.particles = new E.Particles(3200); this.sparks = new E.Particles(2600, { additive: true }); this.sparks.gravity = -6; this.sparks.drag = 1.1;
    this.weather = new E.Particles(2800); this.weather.drag = 0.04; this.weather.gravity = 0;
    this.decals = new E.Decals({ max: 300 }); this.scene.add(this.decals);
    this.fx = new Fx(this);
    this.recs = new Map(); this.deploys = new Map(); this.packNodes = []; this.coreNodes = [];
    this.shake = 0; this.kick = 0; this.bob = 0; this.sway = [0, 0]; this.mode = 'orbit'; this.orbitT = 0; this.fovH = 90; this.sens = 1; this.hitT = 0; this.dmgFlash = 0; this.whiteout = 0; this.punchT = 0;
    this.sound = null; this.levelRef = null; this.replay = false; this.previewTurn = 0; this.chasePos = null; this.specId = null; this.showNumbers = true;
    this.sphereGeo = this.fx.sphereGeo; this.cylGeo = this.fx.cylGeo; this.ringGeo = this.fx.ringGeo; this.coneGeo = this.fx.coneGeo;
    this.theme = null;
  }
  viewTeam() { return this.sim?.playerTeam ?? 0; }
  teamHex(team) { return team === this.viewTeam() ? ALLY : ENEMY; }
  isEnemy(u) { return u.team !== this.viewTeam(); }
  // hooks the HUD can set
  onHit = null; onHurt = null; onKill = null; onEvent = null; onHeal = null; onUlt = null;

  // ------------------------------------------------------------------ world
  applyTheme(th) {
    const env = this.env;
    E.applyTimeOfDay(env, th.time);
    Object.assign(env, { fogDensity: th.fog, fogHeight: 0.1, shadowRadius: 18, shadowFar: 110, skyColor: th.sky, fogColor: th.fogColor, zenithColor: th.zenith, horizonColor: th.horizon, exposure: th.exposure, ambient: th.ambient, sunIntensity: th.neon ? 1.2 : 3.8, volumetric: 0.2, volumeDensity: 0.01 });
    Object.assign(this.renderer.settings, { saturation: th.neon ? 1.3 : 1.18, contrast: 1.1, bloomStrength: th.neon ? 0.4 : 0.2 });
    this.baseFog = th.fog; this.weatherKind = th.particles;
  }
  attach(sim, { skin = 'default', replay = false, keepWorld = false } = {}) {
    this.sim = sim; this.mySkin = skin; this.replay = replay;
    for (const r of this.recs.values()) this.scene.remove(r.model);
    for (const n of this.deploys.values()) this.scene.remove(n);
    this.recs.clear(); this.deploys.clear(); this.fx.reset();
    if (this.vmNode) { this.scene.remove(this.vmNode); this.vmNode = null; this.vmHero = null; }
    if (this.levelRef !== sim.level) this.buildWorld(sim);
    this.decals.clear(); this.particles.list.length = 0; this.sparks.list.length = 0; this.weather.list.length = 0;
    this.me = sim.player; this.deathCam = null; this.zoneFxKey = null; this.fovCur = null; this.scoped = false; this.chasePos = null; this.specId = null; this.whiteout = 0;
    this.previewKey = null;
  }
  buildWorld(sim) {
    if (this.levelRoot) this.scene.remove(this.levelRoot);
    for (const n of [this.payload, ...(this.fwdPads || []), ...this.packNodes, ...this.coreNodes, this.pointVis?.root]) if (n) this.scene.remove(n);
    this.packNodes = []; this.coreNodes = []; this.fwdPads = []; this.payload = null; this.pointVis = null;
    const L = sim.level; this.levelRef = L; this.theme = THEMES[L.theme];
    this.applyTheme(this.theme);
    this.levelRoot = buildLevelVisuals(this.scene, L);
    if (L.pathInfo) this.buildPayload();
    this.buildPoint(L);
    this.buildPacks(sim);
    this.fwdPads = (L.fwd || []).map((list) => {
      const c = list.reduce((a, p) => [a[0] + p[0] / list.length, a[1] + p[2] / list.length], [0, 0]);
      const m = new E.Mesh(E.box({ width: 14, height: 0.04, depth: 8 }), new E.Material({ name: 'FwdPad', color: '#6f819a', emissive: '#3a9bff', emissiveStrength: 0.25, roughness: 0.7 }), 'FwdPad');
      m.position.set([c[0], 0.05, c[1]]); m.castShadow = false; m.visible = false; this.scene.add(m); return m;
    });
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
  // capture point (control and hybrid): a floor ring and a column of light that take the owner's colour
  buildPoint(L) {
    if (!L.points?.length) return;
    const p = L.points[0], root = new E.Node('Point'); root.position.set([p.pos[0], 0, p.pos[2]]);
    this.pointMat = new E.Material({ name: 'PointFill', color: '#cfd8e6', emissive: '#cfd8e6', emissiveStrength: 0.8, opacity: 0.22, doubleSided: true });
    this.pointBeamMat = new E.Material({ name: 'PointBeam', color: '#cfd8e6', emissive: '#cfd8e6', emissiveStrength: 1.4, opacity: 0.12, doubleSided: true });
    const fill = new E.Mesh(this.ringGeo, this.pointMat, 'PointFill'); fill.scale.set([p.r - 0.5, 1, p.r - 0.5]); fill.position.set([0, 0.09, 0]); fill.castShadow = false; fill.receiveShadow = false;
    const beam = new E.Mesh(this.cylGeo, this.pointBeamMat, 'PointBeam'); beam.scale.set([p.r * 0.5, 40, p.r * 0.5]); beam.position.set([0, 20, 0]); beam.castShadow = false; beam.receiveShadow = false;
    const edge = new E.Mesh(E.torus({ radius: 1, tube: 0.04, radialSegments: 6, tubularSegments: 64, arc: 360, tubeScaleY: 1 }), this.pointMat, 'PointEdge'); edge.scale.set([p.r, 1, p.r]); edge.position.set([0, 0.1, 0]); edge.castShadow = false;
    this.pointLight = new E.Light('point', { color: '#cfd8e6', intensity: 10, range: 18 }); this.pointLight.position.set([0, 4, 0]);
    root.add(fill, beam, edge, this.pointLight); this.pointVis = { root, fill, beam, edge, r: p.r }; this.scene.add(root);
  }
  buildPacks(sim) {
    for (const p of sim.packs) {
      const k = new E.Kit(E.archPalette()), g = glow(p.big ? '#7dff9a' : '#a8ffb8', 2.2), s = p.big ? 1.4 : 0.9;
      k.box(g, [0, 0, 0], [0.5 * s, 0.14 * s, 0.14 * s], [0, 0, 0], 0.02); k.box(g, [0, 0, 0], [0.14 * s, 0.5 * s, 0.14 * s], [0, 0, 0], 0.02);
      const n = k.toNode('Pack'); n.position.set([p.pos[0], 0.9 + (p.pos[1] || 0), p.pos[2]]); n.traverse((m) => { if (m.geometry) m.castShadow = false; }); this.scene.add(n); this.packNodes.push(n);
    }
  }

  // ------------------------------------------------------------------ units
  // hero select and the gallery show a dedicated preview model so changes are instant (and work while dead)
  syncPreview(dt) {
    const sel = (this.mode === 'select' || this.mode === 'gallery') && this.previewHero;
    if (!sel) { if (this.previewNode) this.previewNode.visible = false; if (this.previewLight) this.previewLight.visible = this.previewRim.visible = false; return; }
    const key = this.previewHero + this.mySkin;
    if (this.previewKey !== key) {
      if (this.previewNode) this.scene.remove(this.previewNode);
      this.previewNode = buildHero(this.previewHero, this.mySkin); this.previewNode.userData.ring.material = glow(ALLY, 1.6); this.scene.add(this.previewNode); this.previewKey = key; this.previewT = 0;
      if (!this.previewLight) { this.previewLight = new E.Light('point', { color: '#fff1dc', intensity: 22, range: 14 }); this.scene.add(this.previewLight); this.previewRim = new E.Light('point', { color: '#7fb0ff', intensity: 14, range: 12 }); this.scene.add(this.previewRim); }
    }
    this.previewT = (this.previewT || 0) + dt;
    const n = this.previewNode, d = n.userData, a = this.previewAnchor, t = this.previewT, pose = heroPose(this.previewHero); n.visible = true;
    this.previewLight.visible = this.previewRim.visible = true; this.previewLight.position.set([a.pos[0] + a.facing[0] * 3 + 1.6, 2.6, a.pos[2] + a.facing[2] * 3]); this.previewRim.position.set([a.pos[0] - a.facing[0] * 2 - 1.5, 2.4, a.pos[2] - a.facing[2] * 2]);
    n.position.set(a.pos);
    const base = Math.atan2(a.facing[0], a.facing[2]) / DEG, turn = this.mode === 'gallery' ? this.previewTurn : Math.sin(t * 0.5) * 14;
    n.setEuler(0, base + turn, 0);
    const ease = Math.min(1, t * 3), L = (x, y) => x * (1 - ease) + y * ease;
    d.armR.setEuler(L(-70, pose.armR[0] * 0.6), 0, L(0, pose.armR[2] * 0.7)); d.armL.setEuler(L(-55, pose.armL[0] * 0.6), 0, L(18, pose.armL[2] * 0.8)); d.head.setEuler(pose.head[0] * 0.5, pose.head[1] * 0.6 + Math.sin(t * 0.7) * 5, pose.head[2] * 0.4); d.hips.position.set([0, 0.86 + Math.sin(t * 1.6) * 0.008, 0]);
    animateHero(n, t, { flying: false, speed: 0 });
  }
  recFor(u) {
    let r = this.recs.get(u.id);
    const skin = u.isPlayer ? this.mySkin : (u.skin ??= (u.id % 5 === 0 ? SKINS[1 + (u.id % 5)].id : 'default'));
    const key = u.hero + skin;
    if (r && r.key === key) return r;
    if (r) this.scene.remove(r.model);
    const model = buildHero(u.hero, skin);
    model.userData.ring.material = glow(this.teamHex(u.team), 1.6);
    this.scene.add(model);
    r = { model, key, phase: R() * 6, deadT: 0, speed: 0, stepT: 0, barrier: null, beams: {}, fxT: 0, spin: 0, punch: 0, lastFire: false };
    this.recs.set(u.id, r); return r;
  }
  beam(r, key, a, b, color, radius, strength = 4, opacity = 0.7) {
    let m = r.beams[key];
    if (!m) { m = r.beams[key] = new E.Mesh(this.cylGeo, new E.Material({ name: 'Beam', color, emissive: color, emissiveStrength: strength, opacity, doubleSided: true }), 'Beam'); m.castShadow = false; m.receiveShadow = false; this.scene.add(m); }
    this.placeBeam(m, a, b, radius); m.visible = true;
  }
  hideBeams(r, keep = []) { for (const k of Object.keys(r.beams)) if (!keep.includes(k)) r.beams[k].visible = false; }
  placeBeam(mesh, a, b, radius) {
    const d = v3.sub(b, a), l = v3.len(d) || 0.01, q = E.quat.rotationTo(E.quat.create(), [0, 1, 0], [d[0] / l, d[1] / l, d[2] / l]);
    mesh.position.set([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]); E.quat.copy(mesh.rotation, q); mesh.scale.set([radius, l, radius]);
  }
  syncUnits(dt) {
    const sim = this.sim, t = sim.time, me = this.me, vt = this.viewTeam();
    const byId = (id) => id && (typeof id === 'object' ? id : sim.units.find((x) => x.id === id));
    for (const u of sim.units) {
      if (u.deploy) { this.syncDeploy(u, dt); continue; }
      const r = this.recFor(u), m = r.model, d = m.userData, isMe = u === me;
      const fpsSelf = isMe && this.mode === 'fps' && u.alive;
      const hideSelf = fpsSelf || (isMe && (this.mode === 'select' || this.mode === 'gallery') && this.previewHero);
      let hidden = hideSelf || (!u.alive && r.deadT > 4.5) || (u.st.phased && (Math.floor(t * 18) & 1) && u.hero === 'siphon');
      if (u.st.cloak && me && u.team !== vt && !sim.visibleTo(me, u)) hidden = true;
      m.visible = !hidden;
      m.position.set(u.pos); m.setEuler(0, u.yaw / DEG, 0);
      if (!u.alive) {
        r.deadT += dt; const f = clamp(r.deadT / 0.5, 0, 1), e = f * f * (3 - 2 * f);
        m.setEuler(-86 * e, (u.yaw / DEG) + 30 * e, 0); d.ring.visible = false; this.hideBeams(r); if (r.barrier) r.barrier.visible = false; continue;
      }
      r.deadT = 0; d.ring.visible = true;
      const sp = Math.hypot(u.vx, u.vz) * (u.grounded ? 1 : 0.3); r.speed += (sp - r.speed) * Math.min(1, dt * 10);
      r.phase += dt * r.speed * 1.9;
      const skate = u.hero === 'zephyr', amp = Math.min(1, r.speed / 5) * (skate ? 14 : 42) * DEG, sw = Math.sin(r.phase) * amp;
      d.legL.setEuler(sw / DEG, 0, 0); d.legR.setEuler(-sw / DEG, 0, 0);
      d.hips.position.set([0, 0.86 + (skate ? 0 : Math.abs(Math.cos(r.phase)) * 0.03 * Math.min(1, r.speed / 4)), 0]);
      const p = u.pitch / DEG; d.head.setEuler(-p * 0.8, 0, 0); d.spine.setEuler(-p * 0.25 + (skate ? Math.min(1, r.speed / 5) * 12 : 0), 0, 0);
      const fire = u.in.fire1; if (fire && !r.lastFire) r.punch = 1; r.lastFire = fire; r.punch = Math.max(0, r.punch - dt * 4);
      if (this.mode === 'select') { d.armR.setEuler(-28, 0, -8); d.armL.setEuler(-12, 0, 14); }
      else if (u.hero === 'wrecker') { const a = fire ? Math.sin(t * 16) * 38 : 0; d.armR.setEuler(-(70 + p) + a, 0, -6); d.armL.setEuler(-(70 + p) - a, 0, 14); }
      else if (u.hero === 'cantor' || u.hero === 'orbit' && u.dash) { d.armR.setEuler(-(70 + p), 0, -22); d.armL.setEuler(-(70 + p), 0, 22); }
      else { d.armR.setEuler(-(90 + p) + r.punch * 8, 0, -6); d.armL.setEuler(-(90 + p) + 12, 0, 22); }
      if (u.st.stun) d.spine.setEuler(18, 0, 0);
      if (u.dash && (u.hero === 'bulwark' || u.hero === 'wrecker')) d.spine.setEuler(24, 0, 0);
      if (!u.grounded && !u.s.flying) { d.legL.setEuler(-25, 0, 0); d.legR.setEuler(20, 0, 0); }
      if (u.st.sleep || u.st.frozen) { d.spine.setEuler(10, 0, 0); d.head.setEuler(20, 0, 0); }
      if (u.s.bunker) d.spine.setEuler(10, 0, 0);
      d.ring.scale.set([u.def.radius / 0.55 * 1.1, 1, u.def.radius / 0.55 * 1.1]);
      if (d.weaponSpin) { r.spin += dt * (u.s.spun || 0) * 900; d.weaponSpin.setEuler(0, 0, r.spin); }
      animateHero(m, t, { flying: !!u.s.flying, speed: r.speed });
      // footsteps for everyone nearby
      if (u.grounded && r.speed > 2.5) { r.stepT -= dt * r.speed; if (r.stepT <= 0) { r.stepT = 2.4; this.sound?.step(u.pos); } }
      // frontal barrier and Bastille's wall
      const bar = sim.barrierOf(u);
      if (bar && !r.barrier) { r.barrier = new E.Mesh(E.box({ width: 3.8, height: 2.5, depth: 0.14, bevel: 0.03 }), new E.Material({ name: 'Barrier', color: this.teamHex(u.team), emissive: this.teamHex(u.team), emissiveStrength: 1.1, opacity: 0.3, doubleSided: true }), 'Barrier'); r.barrier.castShadow = false; this.scene.add(r.barrier); }
      if (r.barrier) {
        r.barrier.visible = !!bar;
        if (bar) { const c = sim.barrierCenter(u); r.barrier.position.set(c); r.barrier.setEuler(0, sim.barrierYaw(u) / DEG, 0); const f = clamp(bar.hp / bar.max, 0, 1); r.barrier.material.opacity = 0.12 + 0.3 * f; r.barrier.material.color = r.barrier.material.emissive = u.s.wall ? (u.team === vt ? '#9fe8b4' : '#ffb98a') : this.teamHex(u.team); }
      }
      // ---- beams and links
      const eyeFrom = isMe && this.mode === 'fps' ? this.muzzleFP() : sim.muzzle(u), keep = [];
      const tgtBeam = u.s.beam && typeof u.s.beam === 'object' ? byId(u.s.beam) : null;
      if (u.hero === 'halo' && tgtBeam && tgtBeam.alive && u.in.fire2) { const to = sim.center(tgtBeam); this.beam(r, 'heal', eyeFrom, [to[0], to[1] + 0.1, to[2]], '#9fe9ff', 0.05); keep.push('heal'); this.sparks.emit(to, { count: 1, spread: 0.5, up: 0.7, size: 0.06, color: [0.5, 2.2, 3, 1], colorEnd: [0.3, 1, 2, 0.2], life: 0.6, jitter: 0.2 }); }
      const dr = u.s.drainT && byId(u.s.drainT);
      if (u.hero === 'siphon' && dr && dr.alive && u.in.fire1 && !u.s.coal) { this.beam(r, 'drain', eyeFrom, sim.center(dr), '#c6ff6a', 0.04, 4, 0.75); keep.push('drain'); this.sparks.emit(sim.center(dr), { count: 1, spread: 0.4, up: 0.4, size: 0.06, color: [2.2, 3.4, 0.8, 1], life: 0.4, jitter: 0.15 }); }
      if (u.s.coal) { const f = sim.aimDir(u); this.beam(r, 'coal', eyeFrom, v3.madd(eyeFrom, f, 20), '#d8ff8a', 0.32, 3, 0.4); this.beam(r, 'coal2', eyeFrom, v3.madd(eyeFrom, f, 20), '#ffffff', 0.08, 5, 0.8); keep.push('coal', 'coal2'); }
      const hk = u.s.hack && byId(u.s.hack.tgt); if (hk && hk.alive) { this.beam(r, 'hack', eyeFrom, sim.center(hk), '#ff3d9a', 0.025, 4, 0.8); keep.push('hack'); }
      const hm = u.s.harmony && byId(u.s.harmony); if (u.hero === 'cantor' && hm && hm.alive) { const to = [hm.pos[0], hm.pos[1] + hm.def.height + 0.55, hm.pos[2]]; this.beam(r, 'harmony', sim.center(u), to, '#7ff0ff', 0.018, 3, 0.55); keep.push('harmony'); this.sparks.emit(to, { count: 1, spread: 0.2, up: 0.3, size: 0.12, color: [1.4, 3.6, 4, 1], life: 0.3, jitter: 0.1 }); }
      this.hideBeams(r, keep);
      // ---- status and passive flourishes
      const c = [u.pos[0], u.pos[1] + 1, u.pos[2]];
      if (u.st.burn && R() < 0.5) this.sparks.emit(c, { count: 1, spread: 0.3, up: 1.6, size: 0.09, color: [4, 1.6, 0.3, 1], colorEnd: [1.5, 0.2, 0.05, 0.1], life: 0.5, jitter: 0.25, grow: 0.3 });
      if ((u.st.overdrive || u.st.dmgBoost) && R() < 0.3) this.sparks.emit(c, { count: 1, spread: 0.5, up: 0.8, size: 0.05, color: [3, 2.5, 0.6, 1], life: 0.5, jitter: 0.3 });
      if (u.shield > 5 && R() < 0.2) this.sparks.emit([c[0], c[1] + 0.2, c[2]], { count: 1, spread: 0.6, up: 0.4, size: 0.05, color: [0.6, 2, 3.2, 1], life: 0.4, jitter: 0.4 });
      if (u.st.nano && R() < 0.5) this.sparks.emit(c, { count: 1, spread: 0.5, up: 1.2, size: 0.08, color: [4, 3, 0.8, 1], life: 0.5, jitter: 0.3 });
      if (u.st.sleep && R() < 0.12) this.sparks.emit([c[0], c[1] + 0.9, c[2]], { count: 1, spread: 0.2, up: 0.8, size: 0.18, color: [1.4, 1.8, 3, 0.8], life: 1.0, jitter: 0.1, grow: 1.6 });
      if (u.st.frozen && R() < 0.4) this.sparks.emit(c, { count: 1, spread: 0.5, up: 0.3, size: 0.06, color: [2, 3.4, 4, 1], life: 0.6, jitter: 0.3 });
      if (u.st.root && R() < 0.3) this.sparks.emit([c[0], u.pos[1] + 0.1, c[2]], { count: 1, spread: 0.6, up: 0.1, size: 0.07, color: [0.6, 3, 0.6, 1], life: 0.4, jitter: 0.3 });
      if (u.st.marked && R() < 0.25) this.sparks.emit([c[0], c[1] + u.def.height * 0.6, c[2]], { count: 1, spread: 0.1, up: 0.5, size: 0.14, color: [4, 0.5, 0.4, 1], life: 0.5, jitter: 0.05 });
      if (u.st.discord && R() < 0.25) this.sparks.emit([c[0], c[1] + u.def.height * 0.6, c[2]], { count: 1, spread: 0.1, up: 0.5, size: 0.14, color: [2.6, 0.6, 3.8, 1], life: 0.5, jitter: 0.05 });
      if (u.st.cloak && u.team === vt && R() < 0.3) this.sparks.emit(c, { count: 1, spread: 0.6, up: 0.5, size: 0.05, color: [2, 0.6, 3, 0.8], life: 0.5, jitter: 0.3 });
      if (u.st.phased && R() < 0.5) this.sparks.emit(c, { count: 1, spread: 0.6, up: 0.6, size: 0.07, color: [3, 2.6, 1, 1], life: 0.5, jitter: 0.3 });
      if (u.s.trans && R() < 0.8) this.sparks.emit(c, { count: 1, spread: 1.2, up: 1.4, size: 0.1, color: [3, 3.4, 1.2, 1], life: 0.8, jitter: 0.5, buoyancy: 1 });
      if (u.s.flying && R() < 0.8) this.sparks.emit([u.pos[0], u.pos[1] + 0.6, u.pos[2]], { count: 2, spread: 0.3, up: -2.5, size: 0.14, color: [4, 2, 0.5, 1], colorEnd: [1.2, 0.3, 0.1, 0.1], life: 0.35, jitter: 0.15 });
      if (u.hero === 'zephyr' && u.s.aura && !isMe) { /* aura ring is drawn below */ }
      if (u.hero === 'zephyr' && u.s.aura && R() < 0.15) { const a = R() * TAU; this.sparks.emit([u.pos[0] + Math.cos(a) * 9, u.pos[1] + 0.2, u.pos[2] + Math.sin(a) * 9], { count: 1, spread: 0.1, up: 0.5, size: 0.09, color: u.s.aura === 'heal' ? [0.5, 3.4, 1.4, 1] : [4, 2.6, 0.6, 1], life: 0.7, jitter: 0 }); }
      if (u.s.noon && R() < 0.5) this.sparks.emit(c, { count: 1, spread: 0.6, up: 0.4, size: 0.08, color: [4, 2.4, 0.6, 1], life: 0.5, jitter: 0.2 });
    }
    for (const [id, r] of this.recs) if (!sim.units.some((u) => u.id === id)) { this.scene.remove(r.model); for (const b of Object.values(r.beams)) this.scene.remove(b); if (r.barrier) this.scene.remove(r.barrier); this.recs.delete(id); }
  }
  syncDeploy(u, dt) {
    let n = this.deploys.get(u.id);
    if (!n) {
      const c = heroColors(u.hero), dec = u.deploy.kind.startsWith('decoy'); n = dec ? buildHero(u.hero, u.skin || 'default') : u.deploy.kind === 'pylon' ? buildPylon(c) : buildSentry(c);
      if (dec) { n.userData.ring.material = glow(this.teamHex(u.team), 1.6); n.userData.dec = true; }
      this.scene.add(n); this.deploys.set(u.id, n);
      const big = u.deploy.kind === 'pylon', isDec = u.deploy.kind.startsWith('decoy'), ring = new E.Mesh(this.ringGeo, glow(this.teamHex(u.team), 1.2), 'DRing'); ring.scale.set([big ? 6 : 0.7, 1, big ? 6 : 0.7]); ring.position.set([0, 0.05, 0]); ring.castShadow = false;
      if (big) ring.material = new E.Material({ name: 'PylonRing', color: '#9dff9d', emissive: '#9dff9d', emissiveStrength: 0.8, opacity: 0.12, doubleSided: true });
      if (!isDec) n.add(ring);
    }
    n.position.set(u.pos); if (n.userData.dec) { n.setEuler(0, u.yaw / DEG, 0); n.userData.phase = (n.userData.phase || 0) + dt * 9; const sw = Math.sin(n.userData.phase) * 0.7; n.userData.legL.setEuler(sw / DEG, 0, 0); n.userData.legR.setEuler(-sw / DEG, 0, 0); n.userData.armR.setEuler(-90, 0, -6); n.userData.armL.setEuler(-78, 0, 22); }
    if (u.deploy.kind === 'sentry' && n.userData.head) n.userData.head.setEuler(0, u.yaw / DEG, 0);
    n.visible = true;
  }
  removeDeploy(u) { const n = this.deploys.get(u.id); if (n) { this.scene.remove(n); this.deploys.delete(u.id); } }

  // ------------------------------------------------------------------ world objects
  syncWorld(dt) {
    const sim = this.sim, t = sim.time, P = sim.payload, vt = this.viewTeam();
    if (this.payload) {
      const show = !!P && P.active !== false; this.payload.visible = show;
      if (show) {
        this.payload.position.set(P.pos); this.payload.setEuler(0, (P.yaw || 0) / DEG, 0); this.payOrb.position.set([0, 1.75 + Math.sin(t * 2) * 0.05, -0.2]);
        const col = P.contested ? '#ffd36b' : '#3a9bff'; this.zoneMat.color = col; this.zoneMat.emissive = col; this.zoneMat.opacity = 0.16 + (P.pushers ? 0.1 : 0); this.payLight.intensity = 10 + Math.sin(t * 3) * 3;
      }
    }
    this.fwdPads.forEach((m, i) => { m.visible = (sim.milestone || 0) > i; });
    // capture point colours
    if (this.pointVis) {
      const pv = this.pointVis; let col = '#cfd8e6', op = 0.2, bo = 0.1;
      if (sim.control) { const c = sim.control; if (c.owner >= 0) { col = this.teamHex(c.owner); op = 0.34; bo = 0.18; } if (c.capTeam >= 0 && c.capProg > 0) col = mix(col, this.teamHex(c.capTeam), c.capProg); if (c.contested) { col = '#ffd36b'; op = 0.3 + Math.sin(t * 8) * 0.08; } }
      else if (sim.cap) { const c = sim.cap; col = mix('#cfd8e6', this.teamHex(0), clamp(c.prog, 0, 1)); if (c.contested) { col = '#ffd36b'; op = 0.3 + Math.sin(t * 8) * 0.08; } if (c.done) { col = this.teamHex(0); bo = 0.05; } }
      this.pointMat.color = this.pointMat.emissive = col; this.pointMat.opacity = op; this.pointBeamMat.color = this.pointBeamMat.emissive = col; this.pointBeamMat.opacity = bo; this.pointLight.color = col;
      pv.beam.visible = !(sim.cap?.done);
    }
    this.sim.packs.forEach((p, i) => { const n = this.packNodes[i]; if (!n) return; n.visible = p.ready; n.position.set([p.pos[0], 0.9 + (p.pos[1] || 0) + Math.sin(t * 2 + i) * 0.08, p.pos[2]]); n.setEuler(0, t * 60 + i * 40, 0); });
    // echo cores
    const cores = sim.cores;
    while (this.coreNodes.length < cores.length) { const m = new E.Mesh(E.sphere({ radius: 0.22, widthSegments: 10, heightSegments: 8 }), glow('#ffd36b', 3.5), 'Core'); m.castShadow = false; this.scene.add(m); this.coreNodes.push(m); }
    this.coreNodes.forEach((m, i) => { const c = cores[i]; m.visible = !!c; if (c) { m.position.set([c.pos[0], c.pos[1] + 0.4 + Math.sin(t * 3 + i) * 0.1, c.pos[2]]); m.material = glow(c.team === vt ? '#7fc4ff' : '#ff9a9a', 3.5); if (R() < 0.3) this.sparks.emit(m.position, { count: 1, spread: 0.2, up: 0.8, size: 0.05, color: [3, 2.4, 0.8, 1], life: 0.5, jitter: 0.1 }); } });
    // pings leave a short-lived beacon in the world
    this.pingMeshes ||= new Map();
    const live = new Set();
    for (const p of sim.pings || []) {
      live.add(p.id); let m = this.pingMeshes.get(p.id);
      if (!m) { const col = pingColor(p.kind, p.team, vt); m = new E.Mesh(this.coneGeo, glow(col, 3), 'Ping'); m.scale.set([0.28, 0.6, 0.28]); m.setEuler(180, 0, 0); m.castShadow = false; this.scene.add(m); this.pingMeshes.set(p.id, m); }
      m.position.set([p.pos[0], p.pos[1] + 1.1 + Math.sin(t * 5) * 0.12, p.pos[2]]); m.setEuler(180, t * 90, 0);
    }
    for (const [id, m] of this.pingMeshes) if (!live.has(id)) { this.scene.remove(m); this.pingMeshes.delete(id); }
    // weather around the camera
    const cp = this.camera.position, wind = (this.mutatorWind || 1) * (this.sim.mutator?.id === 'blizzard' ? 4 : 1);
    const kind = this.weatherKind;
    if (kind === 'snow') for (let i = 0; i < 22; i++) this.weather.emit([cp[0] + (R() - 0.5) * 50, cp[1] + 9 + R() * 6, cp[2] + (R() - 0.5) * 50], { count: 1, spread: 0.2, up: 0, size: 0.05, grow: 1, color: [1, 1, 1, 0.85], life: 9, vel: [wind * 1.2, -1.5, 0.3], jitter: 0 });
    else if (kind === 'dust') for (let i = 0; i < 8; i++) this.weather.emit([cp[0] + (R() - 0.5) * 60, cp[1] + R() * 8, cp[2] + (R() - 0.5) * 60], { count: 1, spread: 0.5, up: 0.05, size: 0.12, grow: 1.4, color: [0.9, 0.78, 0.55, 0.28], colorEnd: [0.9, 0.78, 0.55, 0.05], life: 6, vel: [3.2, 0.1, 0.8], jitter: 0 });
    else if (kind === 'rain') for (let i = 0; i < 26; i++) this.weather.emit([cp[0] + (R() - 0.5) * 44, cp[1] + 12 + R() * 6, cp[2] + (R() - 0.5) * 44], { count: 1, spread: 0.05, up: 0, size: 0.035, grow: 1, color: [0.6, 0.85, 1, 0.55], life: 1.0, vel: [-1, -14, 0.5], jitter: 0 });
    else if (kind === 'embers') for (let i = 0; i < 5; i++) this.weather.emit([cp[0] + (R() - 0.5) * 50, 0.5 + R() * 3, cp[2] + (R() - 0.5) * 50], { count: 1, spread: 0.3, up: 0.8, size: 0.06, grow: 0.6, color: [3, 1.4, 0.4, 0.9], colorEnd: [1, 0.2, 0.05, 0], life: 5, vel: [0.4, 1.2, 0.2], jitter: 0, buoyancy: 0.8 });
  }

  // ------------------------------------------------------------------ camera and viewmodel
  basis(yaw, pitch) { const f = forward(yaw, pitch), right = [-Math.cos(yaw), 0, Math.sin(yaw)], up = v3.cross(right, f); return { f, right, up }; }
  muzzleFP() {
    const me = this.me, { f, right, up } = this.basis(me.yaw, me.pitch), e = this.sim.eye(me);
    return [e[0] + f[0] * 0.9 + right[0] * 0.18 + up[0] * -0.12, e[1] + f[1] * 0.9 + right[1] * 0.18 + up[1] * -0.12, e[2] + f[2] * 0.9 + right[2] * 0.18 + up[2] * -0.12];
  }
  ensureViewmodel() {
    const me = this.me; if (!me || me.deploy) return;
    const skin = me.isPlayer ? this.mySkin : (me.skin || 'default'), key = me.hero + skin; if (this.vmHero === key) return;
    if (this.vmNode) this.scene.remove(this.vmNode);
    const c = heroColors(me.hero, skin), w = buildWeapon(me.hero, c), node = new E.Node('Viewmodel');
    const sk = mat(c.skin, { roughness: 0.7 }), glove = mat('#23262d', { metallic: 0.3 }), sleeve = mat(c.primary, { roughness: 0.5 }), k = new E.Kit(E.archPalette());
    const big = me.hero === 'wrecker';
    k.box(sleeve, [0.16, -0.22, -0.28], [0.14, 0.14, 0.7], [-12, 8, 0], 0.03); if (!big) k.box(glove, [0.1, -0.1, 0.0], [0.11, 0.11, 0.14], [0, 0, 0], 0.03);
    k.box(me.hero === 'wrecker' ? sk : sleeve, [-0.16, -0.2, 0.16], [0.13, 0.13, 0.8], [-10, -12, 0], 0.03); k.box(glove, [-0.06, -0.04, 0.46], big ? [0.2, 0.18, 0.24] : [0.11, 0.1, 0.16], [0, 0, 0], 0.03);
    if (big) { k.box(glove, [-0.2, -0.06, 0.44], [0.2, 0.18, 0.24], [0, 0, 0], 0.05); for (const x of [-0.26, -0.2, -0.14]) k.box(glow(c.accent, 2.4), [x, -0.06, 0.57], [0.045, 0.14, 0.03]); }
    const arms = k.toNode('Arms'); node.add(arms); node.add(w.node); w.node.position.set([0, 0, 0.0]);
    node.traverse((n) => { n.castShadow = false; n.receiveShadow = false; n.pickable = false; });
    this.scene.add(node); this.vmNode = node; this.vmHero = key; this.vmMuzzle = w.muzzle; this.vmSpin = w.spin; this.vmSpinA = 0;
  }
  chaseCam(dt, u, { dist = 6, height = 2.4, smooth = 3.2 } = {}) {
    const cam = this.camera, c = this.sim.center(u), f = forward(u.yaw, 0);
    const want = [c[0] - f[0] * dist + Math.sin(this.orbitT * 0.6) * 1.2, c[1] + height, c[2] - f[2] * dist];
    this.chasePos = this.chasePos ? [lerp(this.chasePos[0], want[0], 1 - Math.exp(-dt * smooth)), lerp(this.chasePos[1], want[1], 1 - Math.exp(-dt * smooth)), lerp(this.chasePos[2], want[2], 1 - Math.exp(-dt * smooth))] : want;
    cam.position.set(this.chasePos); cam.target.set([c[0] + f[0] * 2, c[1] + 0.2, c[2] + f[2] * 2]); cam.up.set([0, 1, 0]);
  }
  pickSpectate() {
    const sim = this.sim, me = this.me, live = sim.units.filter((u) => u.alive && !u.deploy && u !== me);
    const cur = live.find((u) => u.id === this.specId);
    if (cur) return cur;
    const mates = live.filter((u) => u.team === me?.team);
    const pick = mates[0] || live.find((u) => u === me?.killedBy) || live[0] || null; this.specId = pick?.id ?? null; return pick;
  }
  cycleSpectate(dir = 1) {
    const sim = this.sim, me = this.me, live = sim.units.filter((u) => u.alive && !u.deploy && u !== me && (u.team === me?.team || !sim.units.some((x) => x.alive && !x.deploy && x !== me && x.team === me?.team)));
    if (!live.length) return; const i = live.findIndex((u) => u.id === this.specId); this.specId = live[(i + dir + live.length) % live.length].id; this.chasePos = null;
  }
  updateCamera(dt) {
    const cam = this.camera, sim = this.sim, me = this.me, aspect = this.renderer.width / this.renderer.height || 1.78;
    const vfov = (h) => 2 * Math.atan(Math.tan(h * DEG / 2) / aspect);
    let mode = this.mode; this.orbitT += dt * 0.18;
    this.shake *= Math.exp(-dt * 6); this.kick *= Math.exp(-dt * 12); this.dmgFlash *= Math.exp(-dt * 4); this.punchT = Math.max(0, this.punchT - dt * 5); this.whiteout *= Math.exp(-dt * 1.6);
    this.spectating = false;
    if (mode === 'fps' && me && !me.alive && !this.replay) mode = this.deathCam && this.deathCam.t < 2.0 && this.deathCam.killer?.alive ? 'death' : 'spectate';
    if (mode === 'fps' && me) {
      const e = sim.eye(me), sh = this.shake, rnd = () => (R() - 0.5);
      const { f, up } = this.basis(me.yaw, me.pitch);
      const bobAmt = clamp(Math.hypot(me.vx, me.vz) / 5, 0, 1) * (me.grounded ? 1 : 0.2); this.bob += dt * Math.hypot(me.vx, me.vz) * 1.9;
      const ey = e[1] + Math.sin(this.bob * 2) * 0.012 * bobAmt;
      cam.position.set([e[0] + rnd() * 0.04 * sh, ey + rnd() * 0.04 * sh, e[2] + rnd() * 0.04 * sh]);
      cam.target.set([cam.position[0] + f[0] + rnd() * 0.02 * sh, cam.position[1] + f[1] + rnd() * 0.02 * sh, cam.position[2] + f[2]]); cam.up.set(up);
      const scoped = !!me.s.scoped && me.alive;
      const hf = scoped ? 30 : this.fovH; this.fovCur = (this.fovCur ?? this.fovH); this.fovCur += (hf - this.fovCur) * Math.min(1, dt * (scoped ? 14 : 10));
      cam.fov = vfov(this.fovCur + (sim.mutator?.id === 'lowgrav' ? 4 : 0)); cam.near = 0.04;
      this.scoped = scoped && this.fovCur < 36;
    }
    if (mode === 'death') {
      this.deathCam.t += dt; const k = this.deathCam.killer, tgt = sim.center(k), d = 4.2;
      cam.position.set([tgt[0] - Math.sin(k.yaw) * d, tgt[1] + 1.2, tgt[2] - Math.cos(k.yaw) * d]); cam.target.set(tgt); cam.up.set([0, 1, 0]); cam.fov = vfov(70); this.scoped = false;
    }
    if (mode === 'spectate') {
      const t = this.pickSpectate(); this.scoped = false; cam.near = 0.1;
      if (t) { this.chaseCam(dt, t, { dist: 4.8, height: 1.9, smooth: 6 }); cam.fov = vfov(78); this.spectating = t; }
      else { this.orbitCam(dt, vfov); }
    }
    if (mode === 'chase') { const t = this.me; this.scoped = false; cam.near = 0.1; if (t) { this.chaseCam(dt, t, { dist: 6.5, height: 2.6, smooth: 2.6 }); cam.fov = vfov(70); } }
    if (mode === 'orbit') this.orbitCam(dt, vfov);
    if (mode === 'select' || mode === 'gallery') {
      const p = this.previewAnchor, f = p.facing, sway = Math.sin(sim.time * 0.4) * 0.25, wide = mode === 'gallery' ? 0.0 : 0.9;
      cam.position.set([p.pos[0] + f[0] * 4.3 + wide + sway, 1.25, p.pos[2] + f[2] * 4.3]); cam.target.set([p.pos[0] - 0.1 - (mode === 'gallery' ? 0.6 : 0), 1.2, p.pos[2]]); cam.up.set([0, 1, 0]); cam.fov = vfov(48); this.scoped = false;
    }
    this.listener = { pos: [cam.position[0], cam.position[1], cam.position[2]], yaw: me && mode === 'fps' ? me.yaw : this.camYaw() };
    if (this.sound) { this.sound.listener.pos = this.listener.pos; this.sound.listener.yaw = this.listener.yaw; }
    this.curMode = mode;
  }
  camYaw() { const c = this.camera; return Math.atan2(c.target[0] - c.position[0], c.target[2] - c.position[2]); }
  orbitCam(dt, vfov) {
    const cam = this.camera, sim = this.sim, L = sim.level, P = sim.payload;
    const focus = P && P.active !== false ? [P.pos[0], 1.4, P.pos[2] + 4] : L.points?.[0] ? [L.points[0].pos[0], 1.6, L.points[0].pos[2]] : [(L.bounds.x0 + L.bounds.x1) / 2, 1.6, (L.bounds.z0 + L.bounds.z1) / 2];
    const big = Math.min(L.bounds.x1 - L.bounds.x0, L.bounds.z1 - L.bounds.z0), r = (P ? 17 : Math.max(16, big * 0.22)) + Math.sin(this.orbitT * 0.7) * 5;
    cam.position.set([focus[0] + Math.cos(this.orbitT) * r, 5.5 + Math.sin(this.orbitT * 0.6) * 1.5 + (P ? 0 : 3), focus[2] + Math.sin(this.orbitT) * r]); cam.target.set(focus); cam.up.set([0, 1, 0]); cam.fov = vfov(62); this.scoped = false;
  }
  updateViewmodel(dt) {
    const me = this.me, show = this.curMode === 'fps' && me && me.alive && !this.scoped && this.sim.state !== 'over';
    this.ensureViewmodel(); const node = this.vmNode; if (!node) return;
    node.visible = !!show; if (!show) return;
    const { f, right, up } = this.basis(me.yaw, me.pitch), e = this.camera.position;
    const sp = Math.hypot(me.vx, me.vz), bobA = clamp(sp / 5, 0, 1) * (me.grounded ? 1 : 0.2);
    this.sway[0] += (clamp(-(this._dyaw || 0) * 0.5, -0.06, 0.06) - this.sway[0]) * Math.min(1, dt * 8); this.sway[1] += (clamp(-(this._dpitch || 0) * 0.5, -0.05, 0.05) - this.sway[1]) * Math.min(1, dt * 8); this._dyaw = this._dpitch = 0;
    const punch = this.punchT, off = [0.2 + this.sway[0] + Math.sin(this.bob) * 0.012 * bobA - punch * 0.08, -0.22 + this.sway[1] - Math.abs(Math.cos(this.bob)) * 0.012 * bobA, 0.5 - this.kick * 0.05 + punch * 0.22];
    const slide = me.dash ? 0.12 : 0, reloadDip = me.reloadT > 0 ? Math.sin(Math.min(1, (1 - me.reloadT / (me.def.w1.reload || 1))) * Math.PI) * 0.18 : 0, blockUp = me.s.block ? 0.1 : 0;
    const px = e[0] + right[0] * off[0] + up[0] * (off[1] - reloadDip - slide + blockUp) + f[0] * off[2], py = e[1] + right[1] * off[0] + up[1] * (off[1] - reloadDip - slide + blockUp) + f[1] * off[2], pz = e[2] + right[2] * off[0] + up[2] * (off[1] - reloadDip - slide + blockUp) + f[2] * off[2];
    node.position.set([px, py, pz]);
    node.setEuler(-(me.pitch / DEG) - this.kick * 3 + reloadDip * 90 - punch * 6, me.yaw / DEG, 0);
    if (this.vmSpin) { this.vmSpinA += dt * (me.s.spun || 0) * 900; this.vmSpin.setEuler(0, 0, this.vmSpinA); }
    const s = 0.55; node.scale.set([s, s, s]);
  }

  // ------------------------------------------------------------------ overlays
  project(p) {
    const m = this.camera.viewProj, x = p[0], y = p[1], z = p[2], w = m[3] * x + m[7] * y + m[11] * z + m[15];
    if (w <= 0.05) return null;
    const nx = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w, ny = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
    return { x: (nx * 0.5 + 0.5) * innerWidth, y: (1 - (ny * 0.5 + 0.5)) * innerHeight, w, off: Math.abs(nx) > 1 || Math.abs(ny) > 1 };
  }
  updateOverlays(dt) { this.fx.updateNumbers(dt); }
  tick(dt) { this.fx.tick(dt); this.particles.update(dt); this.sparks.update(dt); this.weather.update(dt); }

  // ------------------------------------------------------------------ frame
  handle(events) { this.fx.handle(events); }
  render(dt) {
    const lines = this.fx.tracerLines(), r = this.renderer;
    r.settings.vignette = this.scoped ? 0.25 : 0.32; r.settings.dofAperture = 0;
    this.env.shadowCenter = [this.camera.position[0], 1, this.camera.position[2]];
    const wo = this.sim?.mutator?.id === 'blizzard', base = this.baseFog || 0.0042; this.env.fogDensity += ((wo ? base * 4 : base) - this.env.fogDensity) * Math.min(1, dt * 1.5); this.mutatorWind = wo ? 3 : 1;
    r.render(this.scene, this.camera, { background: 'sky', particles: [this.particles, this.sparks, this.weather], lines: lines.length ? [{ data: new Float32Array(lines) }] : undefined });
  }
}
function mix(a, b, t) { const A = E.hexToRGB(a), B = E.hexToRGB(b), h = (v) => Math.max(0, Math.min(255, Math.round(v * 255))).toString(16).padStart(2, '0'); return '#' + [0, 1, 2].map((i) => h(A[i] + (B[i] - A[i]) * clamp(t, 0, 1))).join(''); }
const PING = { enemy: '#ff4a52', go: '#ffe14d', objective: '#ffffff', health: '#59f0a8', help: '#ffb02e', ally: '#3a9bff', defend: '#7fc4ff' };
export const pingColor = (kind) => PING[kind] || '#ffffff';
