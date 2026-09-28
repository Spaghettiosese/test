// ShapeForge Range: a tiny first-person sandbox. Walk the firing line, pick up the M4A1,
// the .338 sniper or the pump shotgun, and shoot paper, steel, glass and crates. Every gun
// is a ShapeForge character (shapes + skeleton + baked choreography clips); the game drives
// its clips, aligns the sights for aim-down-sights, and turns shots into physics hitscans.
import * as E from '../engine/index.js';
import { WEAPONS, makeWeaponProp } from './weapons/index.js';
import { weaponPoint, weaponPointWorld } from './weapons/rig.js';
import { buildRange } from './range.js';
import { Sfx } from './audio.js';

const $ = (id) => document.getElementById(id);
const PM = E.physicsMath;
let renderer;
try { renderer = new E.Renderer($('stage')); } catch (e) { $('fatal').hidden = false; $('fatal').textContent = 'This game needs WebGL2. ' + e.message; throw e; }
renderer.settings.adaptiveResolution = true; renderer.settings.targetFps = 50;

// ---------------------------------------------------------------- world
const scene = new E.Scene(), env = scene.environment;
E.applyTimeOfDay(env, 16.2);
env.fogDensity = 0.0035; env.shadowRadius = 16; env.shadowFar = 90; env.fogHeight = 0.15;
const world = new E.PhysicsWorld({ iterations: 8 });
const range = buildRange(scene, world);
const camera = new E.Camera(); camera.near = 0.02; camera.far = 700;
const particles = new E.Particles(3000); // dust and smoke
const sparks = new E.Particles(1500, { additive: true }); // V4 additive particles: glowing sparks
sparks.gravity = -4; sparks.drag = 1.2;
const decals = new E.Decals({ max: 400 }); scene.add(decals);
const sfx = new Sfx();

// ---------------------------------------------------------------- weapons
const CFG = {
  m4a1: { label: 'M4A1', mag: 30, auto: true, interval: 0.08, spread: 0.018, adsSpread: 0.0025, pellets: 1, kick: 0.9, kickAds: 0.45, adsFov: 50, relief: 0.2, impulse: 3, brass: 'rifle', ejectOnShot: true },
  sniper: { label: '.338 Sniper', mag: 5, auto: false, interval: 1.42, spread: 0.06, adsSpread: 0, pellets: 1, kick: 4.5, kickAds: 3.2, adsFov: 6.5, relief: 0.07, impulse: 14, brass: 'magnum', scoped: true },
  shotgun: { label: '12 Gauge Pump', mag: 6, auto: false, interval: 0.92, spread: 0.07, adsSpread: 0.05, pellets: 9, kick: 5, kickAds: 3.5, adsFov: 56, relief: 0.3, impulse: 1.6, brass: 'shell' },
  // the revolver's shot leaves 65 ms after the click: that's the double-action pull in its Fire clip
  revolver: { label: '.44 Magnum', mag: 6, auto: false, interval: 0.45, delay: 0.065, spread: 0.022, adsSpread: 0.002, pellets: 1, kick: 7, kickAds: 5, adsFov: 50, relief: 0.3, impulse: 6, brass: 'magnum44' },
  double: { label: 'Double Barrel', mag: 2, auto: false, interval: 0.28, spread: 0.075, adsSpread: 0.055, pellets: 9, kick: 6.5, kickAds: 4.6, adsFov: 56, relief: 0.3, impulse: 2, brass: 'shell' },
  garand: { label: 'M1 Garand', mag: 8, auto: false, interval: 0.18, spread: 0.03, adsSpread: 0.0015, pellets: 1, kick: 3.2, kickAds: 2.3, adsFov: 44, relief: 0.2, impulse: 7, brass: 'rifle3006', ejectOnShot: true },
  deagle: { label: 'Desert Eagle', mag: 7, auto: false, interval: 0.3, spread: 0.02, adsSpread: 0.002, pellets: 1, kick: 8.5, kickAds: 6, adsFov: 52, relief: 0.28, impulse: 9, brass: 'ae50' },
  mp7: { label: 'MP7', mag: 40, auto: true, interval: 0.063, spread: 0.02, adsSpread: 0.0035, pellets: 1, kick: 0.5, kickAds: 0.26, adsFov: 52, relief: 0.2, impulse: 2, brass: 'pdw', ejectOnShot: true },
  smg: { label: 'MP5', mag: 30, auto: true, interval: 0.075, spread: 0.022, adsSpread: 0.004, pellets: 1, kick: 0.6, kickAds: 0.3, adsFov: 52, relief: 0.2, impulse: 2, brass: 'pistol', ejectOnShot: true },
};
const VM_SCALE = 0.55; // the viewmodel is shrunk toward the eye (same picture, far less wall clipping)
const WORLD_FOV = 72;
const vm = WEAPONS.map((w) => {
  const rig = w.create();
  rig.springs = false; rig.visible = false;
  // the rig's matrix is set by the game every frame (camera * viewmodel FOV * aim-down-sights)
  rig.updateWorld = function (pw) { if (pw) E.mat4.multiply(this.world, pw, this.local); else this.world.set(this.local); for (const c of this.children) c.updateWorld(this.world); };
  for (const p of rig.parts) for (const m of p.meshes) m.castShadow = false;
  scene.add(rig);
  const s = { id: w.id, rig, gun: w.gun, cfg: CFG[w.id], ammo: CFG[w.id].mag, state: 'idle', t: 0, clip: 'Idle', shellsToLoad: 0, wasEmpty: false };
  rig.mixer.on((e) => onEvent(s, e));
  rig.play('Idle', { fade: 0 });
  return s;
});
// display copies of the guns lying on their left sides on the shooting counters: each is the
// gun as a V5 mechanism Prop (rig parts, MechClips, grip and sockets), like the engine's makeGun()
const displays = [];
for (const [i, w] of WEAPONS.entries()) {
  const c = makeWeaponProp(w.id, { detail: 0.7 });
  c.name = w.gun.name + ' (display)';
  const q = E.quat.multiply(E.quat.create(), E.quat.fromEuler(E.quat.create(), 0, 62 + i * 8, 0), E.quat.fromEuler(E.quat.create(), 0, 0, 90));
  const [sx, sz] = { m4a1: [-6.4, 0.5], sniper: [-0.3, 0.5], shotgun: [6.3, 0.5], revolver: [-4.7, 0.5], smg: [4.5, 0.5], double: [5.2, 0.76], garand: [-5.4, 0.78], mp7: [1.1, 0.52], deagle: [-2.6, 0.5] }[w.id] ?? [0, 0.5];
  c.rotation.set(q); c.position.set([sx, 0.935 + 0.03, sz]);
  scene.add(c); displays.push(c);
}

// ---------------------------------------------------------------- player
// the player ignores group 4 (shell casings): brass spawns inside the capsule and would shove you backwards
const cc = new E.CharacterController(world, { position: [0, 0.1, -2.6], radius: 0.3, height: 1.8, mask: 0xffff & ~4 });
cc.body.userData.player = true;
const EYE = 1.62;
const P = { bobY: 0, recoilDebt: 0, triggerWasDown: false, cur: 0, next: null, switchT: 0, ads: 0, bob: 0, recoil: 0, kickZ: 0, kickRot: 0, sway: [0, 0], trigger: false, triggerHeld: false, aimHeld: false, aimToggle: false, cooldown: 0, score: 0, shots: 0, hits: 0, flashT: 0, lastLand: 0 };
const input = { keys: new Set(), yaw: 0, pitch: 0, dYaw: 0, dPitch: 0 };
const stick = { id: null, x: 0, y: 0 }; // touch move stick, -1..1 (+x right, +y back)
let touchMode = false;
const W = () => vm[P.cur];

// ---------------------------------------------------------------- helpers
const casings = [], tracers = [], debris = [];
const flashLight = new E.Light('point', { color: '#ffb866', intensity: 0, range: 6 }); scene.add(flashLight);
const brassMat = new E.Material({ name: 'Brass', color: '#c79a48', roughness: 0.3, metallic: 1 });
const hullMat = new E.Material({ name: 'Hull', color: '#a8231b', roughness: 0.45 });
const shardGeo = E.box({ width: 1, height: 1, depth: 1 });
const CASE = {
  rifle: { geo: E.cylinder({ radiusTop: 0.0048, radiusBottom: 0.0048, height: 0.045, radialSegments: 8 }), mat: brassMat, half: [0.005, 0.022, 0.005], mass: 0.012 },
  magnum: { geo: E.cylinder({ radiusTop: 0.0072, radiusBottom: 0.0072, height: 0.07, radialSegments: 8 }), mat: brassMat, half: [0.007, 0.035, 0.007], mass: 0.02 },
  shell: { geo: E.cylinder({ radiusTop: 0.0105, radiusBottom: 0.0105, height: 0.068, radialSegments: 10 }), mat: hullMat, half: [0.0105, 0.034, 0.0105], mass: 0.03 },
  pistol: { geo: E.cylinder({ radiusTop: 0.0048, radiusBottom: 0.0048, height: 0.019, radialSegments: 8 }), mat: brassMat, half: [0.005, 0.0095, 0.005], mass: 0.005 },
  rifle3006: { geo: E.cylinder({ radiusTop: 0.006, radiusBottom: 0.006, height: 0.063, radialSegments: 8 }), mat: brassMat, half: [0.006, 0.031, 0.006], mass: 0.013 },
  ae50: { geo: E.cylinder({ radiusTop: 0.0066, radiusBottom: 0.0066, height: 0.04, radialSegments: 8 }), mat: brassMat, half: [0.0068, 0.02, 0.0068], mass: 0.014 },
  pdw: { geo: E.cylinder({ radiusTop: 0.0042, radiusBottom: 0.0042, height: 0.03, radialSegments: 8 }), mat: brassMat, half: [0.0042, 0.015, 0.0042], mass: 0.004 },
  clip: { geo: E.box({ width: 0.03, height: 0.05, depth: 0.052 }), mat: new E.Material({ name: 'Clip', color: '#56585a', roughness: 0.35, metallic: 0.95 }), half: [0.015, 0.025, 0.026], mass: 0.02 },
  magnum44: { geo: E.cylinder({ radiusTop: 0.0058, radiusBottom: 0.0058, height: 0.03, radialSegments: 8 }), mat: brassMat, half: [0.006, 0.015, 0.006], mass: 0.008 },
};
function feed(text, cls = '') { const d = document.createElement('div'); d.textContent = text; if (cls) d.className = cls; $('feed').prepend(d); setTimeout(() => d.remove(), 3200); while ($('feed').children.length > 6) $('feed').lastChild.remove(); }
function hitmark(big) { const h = $('hitmark'); h.classList.toggle('big', !!big); h.style.transition = 'none'; h.style.opacity = 1; requestAnimationFrame(() => { h.style.transition = 'opacity .35s'; h.style.opacity = 0; }); }
function markHit() { if (!P.hitThisShot) { P.hitThisShot = true; P.hits++; } }
function addScore(n, why) { P.score += n; feed(`+${n}  ${why}`); }
function camBasis() {
  const cy = Math.cos(input.yaw), sy = Math.sin(input.yaw), cp = Math.cos(input.pitch), sp = Math.sin(input.pitch);
  const f = [sy * cp, sp, cy * cp], left = [cy, 0, -sy];
  return { f, left, up: PM.cross(f, left) }; // rig axes: +X left, +Y up, +Z forward
}
function eyePos() { return [cc.position[0], cc.position[1] + EYE + P.bobY, cc.position[2]]; }

// ---------------------------------------------------------------- weapon handling
// guns with empty variants (a pistol's slide locked back) swap them in when the magazine is dry
function variant(s, clip) {
  const has = (n) => s.rig.mixer.clips.has(n);
  if (s.ammo === 0 && clip === 'Idle' && has('Idle Empty')) return 'Idle Empty';
  if (s.ammo === 0 && clip === 'Reload' && has('Reload Empty')) return 'Reload Empty';
  if (s.ammo === 0 && clip === 'Fire' && has('Fire Last')) return 'Fire Last';
  return clip;
}
function play(s, clip, fade = 0.12, restart = true) { clip = variant(s, clip); s.rig.play(clip, { fade, restart }); s.clip = clip; s.t = 0; }
function clipDone(s) { const a = s.rig.mixer.action(s.clip); return a && a.time >= a.clip.duration - 1e-3; }
function onEvent(s, e) {
  if (s !== W()) return;
  const n = e.name;
  if (n === 'eject') ejectCase(s);
  if (n === 'magOut') sfx.click(0.8, 0.3);
  if (n === 'magIn') { s.ammo = s.cfg.mag; sfx.clack(1); }
  if (n === 'charge' || n === 'boltUp') sfx.click(0.9, 0.3);
  if (n === 'boltHome' || n === 'pumpHome') sfx.clack(1.2);
  if (n === 'pumpBack') sfx.clack(0.9);
  if (n === 'boltDown' || n === 'click') sfx.click(1.3, 0.2);
  if (n === 'eject6') ejectCylinder(s);
  if (n === 'slideLock') sfx.clack(1.4);
  if (n === 'eject2') ejectBreech(s);
  if (n === 'ping') pingClip(s);
  if (n === 'open' || n === 'close') sfx.clack(n === 'open' ? 1.3 : 1.5);
  if (n === 'shellIn') { s.ammo = Math.min(s.cfg.mag, s.ammo + 1); sfx.click(0.7, 0.35); }
}
function canAct(s) { return s.state === 'idle' || s.state === 'inspect'; }
function reload() {
  const s = W();
  if (!canAct(s) || s.ammo >= s.cfg.mag || P.next !== null) return;
  s.wasEmpty = s.ammo === 0;
  if (s.id === 'shotgun') { s.state = 'reloadStart'; play(s, 'Reload Start'); }
  else { s.state = 'reload'; play(s, 'Reload'); }
}
function inspect() { const s = W(); if (s.state === 'idle' && P.next === null) { s.state = 'inspect'; play(s, 'Inspect', 0.2); } }
function switchTo(i) { if (i === P.cur || i < 0 || i >= vm.length || P.next !== null) return; P.next = i; P.switchT = 0; }
function tryFire() {
  const s = W();
  if (P.next !== null || P.switchT > 0) return;
  if (s.state === 'inspect') { s.state = 'idle'; play(s, 'Idle', 0.1); }
  if (s.state === 'insert' || s.state === 'reloadStart') { s.stopReload = true; return; }
  if (s.state !== 'idle' && !(s.state === 'firing' && s.cfg.auto) || P.cooldown > 0) return;
  if (s.ammo <= 0) { if (!P.triggerWasDown) { sfx.empty(); reload(); } return; }
  if (!s.cfg.auto && P.triggerWasDown) return; // semi-automatic: one shot per press
  fire(s);
}
function fire(s) {
  s.ammo--; P.shots++; P.hitThisShot = false;
  P.cooldown = s.cfg.interval;
  s.state = 'firing';
  play(s, 'Fire', s.cfg.auto ? 0.03 : 0.04);
  if (s.cfg.delay) s.pending = s.cfg.delay; else discharge(s);
}
// the round actually going off: sound, recoil, hitscan, flash, smoke, brass
function discharge(s) {
  s.pending = 0;
  sfx.shot(s.id);
  // recoil: camera kick and a viewmodel shove
  const k = P.ads > 0.5 ? s.cfg.kickAds : s.cfg.kick;
  P.recoil += k * (0.8 + Math.random() * 0.4) * E.DEG;
  input.yaw += (Math.random() - 0.5) * k * 0.35 * E.DEG;
  P.kickZ = Math.min(0.06, P.kickZ + 0.012 * k); P.kickRot = Math.min(8, P.kickRot + k * 0.9);
  // hitscan from the eye (the gun is sighted in), tracers from the muzzle
  const eye = eyePos(), { f, left, up } = camBasis();
  const muzzle = weaponPointWorld(s.rig, s.gun.points.muzzle, s.gun);
  const sp = s.cfg.adsSpread + (s.cfg.spread - s.cfg.adsSpread) * (1 - P.ads) + Math.hypot(cc.velocity[0], cc.velocity[2]) * 0.006;
  for (let i = 0; i < s.cfg.pellets; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * sp;
    const dir = PM.norm([f[0] + (left[0] * Math.cos(a) + up[0] * Math.sin(a)) * r, f[1] + (left[1] * Math.cos(a) + up[1] * Math.sin(a)) * r, f[2] + (left[2] * Math.cos(a) + up[2] * Math.sin(a)) * r]);
    const hit = world.raycast(eye, dir, 600, { ignore: new Set([cc.body, ...casings.map((c) => c.body)]) });
    const end = hit ? hit.point : PM.madd(eye, dir, 600);
    if (i < 4 || Math.random() < 0.3) tracers.push({ a: muzzle, b: end, t: s.id === 'sniper' ? 0.12 : 0.05 });
    if (hit) impact(hit, dir, s);
  }
  flashLight.position.set(muzzle); flashLight.intensity = s.cfg.auto ? 30 : 60; P.flashT = 0.045;
  particles.emit(muzzle, { count: s.cfg.auto ? 3 : 8, spread: 0.12, up: 0.1, size: 0.05, color: [0.8, 0.78, 0.74, 0.32], colorEnd: [0.9, 0.88, 0.85, 0.08], grow: 5, buoyancy: 0.35, life: s.cfg.auto ? 1.4 : 2.2, jitter: 0.02, vel: PM.scl(f, 0.6) });
  sparks.emit(muzzle, { count: s.cfg.pellets > 1 ? 10 : 4, spread: 0.9, up: 0.3, size: 0.012, grow: 0.4, color: [5, 3, 1.2, 1], colorEnd: [2, 0.5, 0.1, 0.5], life: 0.18, jitter: 0.01, vel: PM.scl(f, 3) });
  if (s.cfg.ejectOnShot) ejectCase(s);
}
// revolver: the ejector rod throws all six empties out of the swung-out cylinder at once
function ejectCylinder(s) {
  const sk = s.rig.skeleton, c = E.vec3.transformMat4([0, 0, 0], sk.worldHead(sk.boneIndex('cyl')), s.rig.world);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; ejectCase(s, [c[0] + Math.cos(a) * 0.012, c[1] - 0.02, c[2] + Math.sin(a) * 0.012], [Math.cos(a) * 0.3, -0.8 - Math.random() * 0.5, Math.sin(a) * 0.3]); }
  sfx.tink();
}
// double barrel: the extractors throw both hulls up and back out of the open chambers
function ejectBreech(s) {
  const sk = s.rig.skeleton, c = E.vec3.transformMat4([0, 0, 0], sk.worldHead(sk.boneIndex('chambered')), s.rig.world);
  const { f, up } = camBasis();
  for (const side of [-1, 1]) ejectCase(s, [c[0], c[1] + 0.02, c[2]], [up[0] * 1.8 - f[0] * 0.8 + side * 0.3, up[1] * 1.8 - f[1] * 0.8 + 0.4, up[2] * 1.8 - f[2] * 0.8 + side * 0.3]);
}
// M1 Garand: the empty en-bloc clip flies up out of the receiver with its famous ping
function pingClip(s) {
  const { f, left, up } = camBasis();
  const p = weaponPointWorld(s.rig, [0, 0.07, 0.04], s.gun);
  ejectCase(s, p, [up[0] * 3.2 - left[0] * 0.6 - f[0] * 0.3, up[1] * 3.2 - left[1] * 0.6 - f[1] * 0.3, up[2] * 3.2 - left[2] * 0.6 - f[2] * 0.3], 'clip');
  sfx.ping();
}
function ejectCase(s, at = null, vel = null, kindName = null) {
  const kind = CASE[kindName || s.cfg.brass];
  const p = at || weaponPointWorld(s.rig, s.gun.points.eject, s.gun);
  const { f, left, up } = camBasis();
  if (casings.length > 40) { const c = casings.shift(); world.remove(c.body); scene.remove(c.mesh); }
  const mesh = new E.Mesh(kind.geo, kind.mat, 'Casing'); mesh.castShadow = false; scene.add(mesh);
  const v = vel ? [vel[0] + cc.velocity[0], vel[1], vel[2] + cc.velocity[2]] : [-left[0] * 2.4 + up[0] * 1.6 - f[0] * 0.4 + cc.velocity[0], -left[1] * 2.4 + up[1] * 1.6 + (Math.random() * 0.6), -left[2] * 2.4 + up[2] * 1.6 - f[2] * 0.4 + cc.velocity[2]];
  const body = world.add(new E.Body({ shape: new E.Box(kind.half), position: p, mass: kind.mass, velocity: v, angularVelocity: [Math.random() * 30 - 15, Math.random() * 30 - 15, Math.random() * 30 - 15], friction: 0.6, restitution: 0.3, mask: 0xffff & ~2, group: 4 }));
  body.node = mesh; body.userData.kind = 'casing';
  casings.push({ body, mesh, t: 10, clinked: false });
}
function impact(hit, dir, s) {
  const b = hit.body, k = b.userData.kind, dist = Math.round(PM.len(PM.sub(hit.point, eyePos())));
  if (k === 'paper') {
    const local = PM.qrot(PM.qconj(b.quaternion), PM.sub(hit.point, b.userData.center));
    const r = Math.hypot(local[0], local[1]) / b.userData.size;
    const pts = r < 0.06 ? 10 : r < 0.42 ? Math.max(1, 9 - Math.floor((r - 0.06) / 0.045)) : 0;
    decals.add(hit.point, hit.normal, 0.012 + (s.cfg.pellets > 1 ? 0 : 0.004));
    particles.emit(hit.point, { count: 3, spread: 0.3, up: 0.2, size: 0.03, color: [0.95, 0.93, 0.88, 0.8], life: 0.5 });
    if (pts) { markHit(); addScore(pts, pts === 10 ? `Bullseye! (${dist} m)` : `${pts} ring (${dist} m)`); hitmark(pts === 10); }
    return;
  }
  if (k === 'plate' || k === 'gong' || k === 'mover') {
    if (b.isDynamic) b.applyImpulse(PM.scl(dir, s.cfg.impulse * (k === 'gong' ? 3 : 1)), hit.point);
    sparks.emit(hit.point, { count: 14, spread: 1.8, up: 1.6, size: 0.02, grow: 0.4, color: [5, 3.2, 1.2, 1], colorEnd: [2.4, 0.6, 0.1, 0.4], life: 0.45, jitter: 0.01 });
    if (b.userData.cool <= 0) {
      markHit(); b.userData.cool = 0.15;
      const pts = k === 'gong' ? Math.round(b.userData.dist / 2) : k === 'mover' ? 25 : 10;
      addScore(pts, k === 'gong' ? `Ding! ${b.userData.dist} m gong` : k === 'mover' ? `Moving target (${dist} m)` : `Steel (${dist} m)`);
      hitmark(k !== 'plate');
      sfx.ding(k === 'gong' ? 1.6 : 0.8, dist);
    }
    return;
  }
  if (k === 'bottle') {
    const mesh = b.node; range.loose.splice(range.loose.findIndex((t) => t.body === b), 1); mesh.parent?.remove(mesh);
    const shards = E.fracture(world, b, { pieces: [2, 3, 2], point: PM.madd(hit.point, dir, -0.05), speed: 3.5 });
    for (const sh of shards) { const m = new E.Mesh(shardGeo, mesh.material, 'Shard'); m.scale.set(sh.shape.half.map((h) => h * 2)); sh.node = m; scene.add(m); debris.push({ body: sh, mesh: m, t: 5 }); }
    particles.emit(hit.point, { count: 14, spread: 1.2, up: 1, size: 0.03, color: [0.6, 0.9, 0.7, 0.9], life: 0.6 });
    markHit(); addScore(15, `Bottle (${dist} m)`); hitmark(); sfx.glass();
    return;
  }
  if (k === 'can' || k === 'crate' || k === 'casing') {
    b.applyImpulse(PM.add(PM.scl(dir, s.cfg.impulse * (k === 'can' ? 0.25 : 3)), [0, k === 'can' ? 0.4 : 0, 0]), hit.point);
    if (k === 'can') b.angularVelocity = [Math.random() * 20 - 10, 8, Math.random() * 20 - 10];
    if (k === 'crate') particles.emit(hit.point, { count: 6, spread: 0.8, up: 0.8, size: 0.03, color: [0.55, 0.42, 0.3, 0.7], life: 0.4 });
    else sparks.emit(hit.point, { count: 8, spread: 1.2, up: 1.2, size: 0.018, grow: 0.4, color: [5, 3.2, 1.2, 1], colorEnd: [2.4, 0.6, 0.1, 0.4], life: 0.35, jitter: 0.01 });
    if (k === 'crate') decals.add(hit.point, hit.normal, 0.014);
    if (k !== 'casing') { markHit(); hitmark(); addScore(k === 'can' ? (b.userData.scored ? 5 : 10) : 2, k === 'can' ? (b.userData.scored ? 'Juggle!' : `Can (${dist} m)`) : 'Crate'); b.userData.scored = true; }
    return;
  }
  // everything else: a bullet hole and dust
  decals.add(hit.point, hit.normal, 0.02 + Math.random() * 0.01);
  const earth = k === 'ground' || k === 'berm';
  particles.emit(hit.point, { count: earth ? 10 : 6, spread: earth ? 0.5 : 0.4, up: earth ? 1.2 : 0.4, size: earth ? 0.09 : 0.05, color: earth ? [0.62, 0.52, 0.38, 0.6] : [0.7, 0.66, 0.6, 0.5], life: earth ? 1.2 : 0.7 });
}

function updateWeapon(dt) {
  const s = W();
  s.t += dt; P.cooldown -= dt;
  if (s.pending > 0) { s.pending -= dt; if (s.pending <= 0) discharge(s); }
  // weapon switch: lower, swap, raise
  if (P.next !== null) {
    P.switchT += dt;
    if (P.switchT >= 0.22) {
      s.rig.visible = false; s.state = 'idle'; play(s, 'Idle', 0);
      P.cur = P.next; P.next = null; P.switchT = -0.3;
      const n = W(); n.state = 'idle'; play(n, 'Idle', 0); n.rig.visible = true;
      sfx.clack(0.8); hud(true);
    }
  } else if (P.switchT < 0) P.switchT = Math.min(0, P.switchT + dt);
  // triggers
  // a press is latched until the next frame, so a tap shorter than a frame still fires
  const pulled = P.triggerHeld || P.firePress;
  if (pulled) tryFire();
  P.triggerWasDown = pulled; P.firePress = false;
  // state machine
  if (s.state === 'firing' && P.cooldown <= 0 && (!s.cfg.auto || !P.triggerHeld)) {
    if (clipDone(s) || s.cfg.auto) { s.state = 'idle'; play(s, 'Idle', s.cfg.auto ? 0.15 : 0.2, false); if (s.ammo === 0 && !s.cfg.auto) reload(); }
  }
  if (s.state === 'firing' && s.cfg.auto && P.triggerHeld && s.ammo === 0 && P.cooldown <= 0) { s.state = 'idle'; play(s, 'Idle', 0.15, false); }
  if (s.state === 'reload' && clipDone(s)) { s.state = 'idle'; play(s, 'Idle', 0.2, false); }
  if (s.state === 'inspect' && clipDone(s)) { s.state = 'idle'; play(s, 'Idle', 0.3, false); }
  if (s.state === 'reloadStart' && clipDone(s)) { s.state = 'insert'; play(s, 'Insert Shell', 0.05); }
  if (s.state === 'insert' && clipDone(s)) {
    if (s.ammo < s.cfg.mag && !s.stopReload) play(s, 'Insert Shell', 0.0);
    else { s.state = 'reloadEnd'; play(s, 'Reload End', 0.05); }
  }
  if (s.state === 'reloadEnd' && clipDone(s)) {
    s.stopReload = false;
    if (s.wasEmpty) { s.state = 'pump'; play(s, 'Pump', 0.1); s.wasEmpty = false; } else { s.state = 'idle'; play(s, 'Idle', 0.2, false); }
  }
  if (s.state === 'pump' && clipDone(s)) { s.state = 'idle'; play(s, 'Idle', 0.2, false); }
  // aim down sights
  const canAim = (s.state === 'idle' || s.state === 'firing') && P.next === null && !(s.id === 'sniper' && s.state === 'firing' && s.t > 0.3);
  const wantAds = (P.aimHeld || P.aimToggle) && canAim;
  P.ads = E.clamp(P.ads + (wantAds ? dt * (s.cfg.scoped ? 4.5 : 6) : -dt * 6), 0, 1);
  s.rig.mixer.update(dt);
}

// Aim-down-sights: rotate/translate the rig so the sight line runs down the eye's +Z axis.
const Qid = E.quat.create();
function adsTransform(s, a) {
  const R = weaponPoint(s.rig, s.gun.points.sightRear, s.gun), F = weaponPoint(s.rig, s.gun.points.sightFront, s.gun);
  const d = E.vec3.normalize([0, 0, 0], E.vec3.sub([0, 0, 0], F, R));
  const q = E.quat.rotationTo(E.quat.create(), d, [0, 0, 1]);
  const Rr = E.vec3.transformQuat([0, 0, 0], R, q);
  const t = [-Rr[0], -Rr[1], s.cfg.relief - Rr[2]];
  const qa = E.quat.slerp(E.quat.create(), Qid, q, a);
  return E.mat4.fromRTS(E.mat4.create(), qa, [t[0] * a, t[1] * a, t[2] * a]);
}
function updateViewmodel(dt) {
  const s = W();
  const { f, left, up } = camBasis();
  const eye = eyePos();
  const cam = E.mat4.create();
  cam.set([left[0], left[1], left[2], 0, up[0], up[1], up[2], 0, f[0], f[1], f[2], 0, eye[0], eye[1], eye[2], 1]);
  // viewmodel FOV: squeeze x/y so the gun looks as it was posed at its own field of view
  const fovK = Math.tan((WORLD_FOV * E.DEG) / 2) / Math.tan((s.gun.firstPerson.fov * E.DEG) / 2);
  const a = P.ads * P.ads * (3 - 2 * P.ads);
  const sxy = VM_SCALE * (fovK + (1 - fovK) * a);
  const S = E.mat4.fromRTS(E.mat4.create(), Qid, [0, 0, 0], [sxy, sxy, VM_SCALE]);
  // sway, bob, recoil, weapon switching (all in rig space, faded out while aiming)
  const sp = Math.hypot(cc.velocity[0], cc.velocity[2]);
  P.bob += dt * sp * 2.2;
  const bobAmt = Math.min(1, sp / 3) * (1 - a * 0.85);
  P.sway[0] += (E.clamp(-input.dYaw * 0.6, -0.04, 0.04) - P.sway[0]) * Math.min(1, dt * 8);
  P.sway[1] += (E.clamp(-input.dPitch * 0.6, -0.04, 0.04) - P.sway[1]) * Math.min(1, dt * 8);
  input.dYaw = 0; input.dPitch = 0;
  P.kickZ *= Math.exp(-dt * 14); P.kickRot *= Math.exp(-dt * 12);
  const sw = P.next !== null ? P.switchT / 0.22 : P.switchT < 0 ? -P.switchT / 0.3 : 0;
  const off = [
    Math.sin(P.bob) * 0.012 * bobAmt + P.sway[0] * (1 - a * 0.9),
    -Math.abs(Math.cos(P.bob)) * 0.01 * bobAmt + P.sway[1] * (1 - a * 0.9) - sw * 0.35,
    -P.kickZ,
  ];
  const offM = E.mat4.fromRTS(E.mat4.create(), E.quat.fromEuler(E.quat.create(), -P.kickRot * (1 - a * 0.6) + sw * 40, 0, 0), off);
  const ads = adsTransform(s, a);
  const m = E.mat4.create();
  E.mat4.multiply(m, cam, S); E.mat4.multiply(m, m, offM); E.mat4.multiply(m, m, ads);
  s.rig.local.set(m);
  // scoped rifle: once the scope is up, hide the rig and show the reticle
  const scoped = s.cfg.scoped && P.ads > 0.92;
  s.rig.visible = !scoped;
  $('scope').hidden = !scoped;
  document.body.classList.toggle('ads', P.ads > 0.6);
  const fov = WORLD_FOV + (s.cfg.adsFov - WORLD_FOV) * (s.cfg.scoped ? (P.ads > 0.92 ? 1 : a * 0.25) : a);
  camera.fov = fov * E.DEG;
  camera.near = scoped ? 0.4 : 0.02; // the viewmodel is hidden behind the scope: buy back depth precision
}

// ---------------------------------------------------------------- player
function updatePlayer(dt) {
  const k = input.keys, s = W();
  let ix = (k.has('a') ? 1 : 0) - (k.has('d') ? 1 : 0), iz = (k.has('w') ? 1 : 0) - (k.has('s') ? 1 : 0);
  // the touch stick is analogue: a light push walks slowly, pushing it to the rim runs
  const sm = Math.min(1, Math.hypot(stick.x, stick.y)), useStick = !ix && !iz && sm > 0.12;
  if (useStick) { ix = -stick.x; iz = -stick.y; }
  const fwd = [Math.sin(input.yaw), Math.cos(input.yaw)], left = [Math.cos(input.yaw), -Math.sin(input.yaw)];
  let wish = [0, 0];
  if (ix || iz) {
    const d = [fwd[0] * iz + left[0] * ix, fwd[1] * iz + left[1] * ix], l = Math.hypot(...d);
    const run = (k.has('shift') || (useStick && sm > 0.92)) && iz > 0.5 && s.state !== 'reload';
    const speed = (P.ads > 0.3 ? 1.6 : run ? 5.6 : 3.2) * (useStick && !run ? Math.min(1, (sm - 0.12) / 0.7 + 0.25) : 1);
    wish = [(d[0] / l) * speed, (d[1] / l) * speed];
  }
  $('stick').classList.toggle('run', useStick && sm > 0.92 && iz > 0.5);
  if (k.has(' ')) cc.jump(4.6);
  cc.move(wish, dt);
  if (cc.position[1] < -5) cc.position = [0, 0.2, -2.6];
  P.bobY = 0;
  // recoil recovery pulls the view most of the way back down
  const rec = P.recoil * Math.min(1, dt * 12);
  input.pitch = E.clamp(input.pitch + rec, -1.5, 1.5); P.recoil -= rec;
  P.recoilDebt = (P.recoilDebt || 0) + rec * 0.7;
  if (!P.triggerHeld || !W().cfg.auto) { const back = P.recoilDebt * Math.min(1, dt * 5); input.pitch -= back; P.recoilDebt -= back; }
}

// ---------------------------------------------------------------- HUD
const WEAPON_BAR = $('weapons');
vm.forEach((s, i) => { const d = document.createElement('div'); d.className = 'slot'; d.innerHTML = `<kbd>${i + 1}</kbd><span>${s.cfg.label}</span>`; d.onclick = () => switchTo(i); WEAPON_BAR.append(d); });
let lastHud = '';
function hud(force) {
  const s = W();
  const txt = `${s.ammo}|${s.state}|${P.cur}|${P.score}`;
  if (txt === lastHud && !force) return; lastHud = txt;
  $('ammo').textContent = s.ammo;
  $('ammoMax').textContent = '/ ' + s.cfg.mag;
  $('wname').textContent = s.cfg.label;
  $('score').textContent = P.score;
  $('acc').textContent = P.shots ? Math.round((P.hits / P.shots) * 100) + '%' : '–';
  [...WEAPON_BAR.children].forEach((d, i) => d.classList.toggle('on', i === P.cur));
  const hint = s.state.startsWith('reload') || s.state === 'insert' ? 'Reloading…' : s.ammo === 0 ? (touchMode ? 'Empty: tap reload' : 'Empty: press R') : s.state === 'inspect' ? 'Inspecting' : '';
  $('whint').textContent = hint;
  $('pips').innerHTML = s.cfg.mag <= 10 ? Array.from({ length: s.cfg.mag }, (_, i) => `<i class="${i < s.ammo ? '' : 'spent'} ${s.id}"></i>`).join('') : '';
}
function updateCrosshair() {
  const s = W();
  const sp = s.cfg.adsSpread + (s.cfg.spread - s.cfg.adsSpread) * (1 - P.ads) + Math.hypot(cc.velocity[0], cc.velocity[2]) * 0.006;
  const px = Math.max(8, (sp / Math.tan(camera.fov / 2)) * (renderer.height / (window.devicePixelRatio || 1)) / 2 * 2 + 10);
  const x = $('xhair'); x.style.width = x.style.height = px + 'px';
  x.style.opacity = P.ads > 0.4 ? 0 : 1;
  // rangefinder under the reticle while scoped
  if (!$('scope').hidden) {
    const hit = world.raycast(eyePos(), camBasis().f, 600, { ignore: new Set([cc.body]) });
    $('rangefinder').textContent = hit ? `${hit.distance.toFixed(0)} m` : '– – –';
  }
}

// ---------------------------------------------------------------- input
const cv = $('stage');
let started = false, drag = null;
const lockEl = () => { try { const r = cv.requestPointerLock?.(); if (r && r.catch) r.catch(() => {}); } catch { /* sandboxed: drag to look */ } };
const locked = () => document.pointerLockElement === cv;
function start() {
  started = true; $('menu').hidden = true; sfx.unlock(); hud(true);
  if (touchMode) {
    $('touch').hidden = false;
    try { const r = document.documentElement.requestFullscreen?.({ navigationUI: 'hide' }); if (r && r.then) r.then(() => screen.orientation?.lock?.('landscape').catch(() => {})).catch(() => {}); } catch { /* not allowed here */ }
  } else lockEl();
}
$('play').onclick = start;
cv.addEventListener('contextmenu', (e) => e.preventDefault());
// Mouse buttons use mousedown/mouseup: browsers send only one pointerdown while any button is
// held, so a left click made while the right button aims would never arrive as a pointer event.
cv.addEventListener('mousedown', (e) => {
  if (!started) return;
  sfx.unlock();
  if (!locked()) lockEl();
  if (e.button === 0) P.triggerHeld = P.firePress = true;
  if (e.button === 2) P.aimHeld = true;
  drag = { x: e.clientX, y: e.clientY };
});
addEventListener('mouseup', (e) => { if (e.button === 0) P.triggerHeld = false; if (e.button === 2) P.aimHeld = false; if (!e.buttons) drag = null; });
addEventListener('pointermove', (e) => {
  if (!started) return;
  if (e.pointerType === 'touch') return; // touches are handled by the touch controls below
  if (e.pointerType === 'mouse' && e.buttons !== undefined) { P.triggerHeld = !!(e.buttons & 1); P.aimHeld = !!(e.buttons & 2); } // stay in sync with the real buttons
  let dx = 0, dy = 0;
  if (locked()) { dx = e.movementX; dy = e.movementY; } else if (drag) { dx = e.clientX - drag.x; dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; }
  const sens = 0.0022 * (camera.fov / (WORLD_FOV * E.DEG)) ** 0.9 * (+$('sens').value || 1);
  input.yaw -= dx * sens; input.pitch = E.clamp(input.pitch - dy * sens, -1.5, 1.5);
  input.dYaw += dx * 0.0004; input.dPitch += dy * 0.0004;
});
addEventListener('wheel', (e) => { if (started) switchTo((P.cur + (e.deltaY > 0 ? 1 : vm.length - 1)) % vm.length); });
addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase(); input.keys.add(k);
  if (!started) { if (k === 'enter') start(); return; }
  if (k === ' ') e.preventDefault();
  if (k === 'r') reload();
  if (k === 'f' || k === 'i') inspect();
  if (k >= '1' && k <= '9' && k.length === 1) switchTo(+k - 1);
  if (k === 'q') switchTo((P.cur + 1) % vm.length);
  if (k === 't') { range.spawnLoose(); range.resetSteel(); decals.clear(); feed('Targets reset'); }
  if (k === 'e') P.aimToggle = !P.aimToggle;
  if (k === 'h') $('help').hidden = !$('help').hidden;
});
addEventListener('keyup', (e) => input.keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => { input.keys.clear(); P.triggerHeld = false; P.aimHeld = false; });
document.addEventListener('pointerlockchange', () => { if (!locked()) { P.triggerHeld = false; } });

// ---------------------------------------------------------------- touch controls
// A move stick bottom-left, drag anywhere else (or on the fire button) to look, and buttons
// for fire, aim, reload, jump, weapon swap, inspect and target reset.
function enableTouch() {
  if (touchMode) return;
  touchMode = true; document.body.classList.add('touch');
  if (started) { $('touch').hidden = false; hud(true); }
}
if (matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0 && matchMedia('(hover: none)').matches) enableTouch();
addEventListener('touchstart', enableTouch, { passive: true, capture: true });
const lookBy = (dx, dy) => {
  const sens = 0.0042 * (camera.fov / (WORLD_FOV * E.DEG)) ** 0.9 * (+$('sens').value || 1);
  input.yaw -= dx * sens; input.pitch = E.clamp(input.pitch - dy * sens, -1.5, 1.5);
  input.dYaw += dx * 0.0004; input.dPitch += dy * 0.0004;
};
// drag-to-look on the canvas (one finger at a time)
const look = { id: null, x: 0, y: 0 };
cv.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'touch' || !started) return;
  e.preventDefault(); sfx.unlock();
  if (look.id === null) { look.id = e.pointerId; look.x = e.clientX; look.y = e.clientY; }
});
addEventListener('pointermove', (e) => {
  if (e.pointerId !== look.id) return;
  lookBy(e.clientX - look.x, e.clientY - look.y); look.x = e.clientX; look.y = e.clientY;
});
const endLook = (e) => { if (e.pointerId === look.id) look.id = null; };
addEventListener('pointerup', endLook); addEventListener('pointercancel', endLook);
// the move stick
const stickEl = $('stick'), knob = stickEl.firstElementChild, STICK_R = 50;
const moveStick = (e) => {
  const r = stickEl.getBoundingClientRect();
  let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
  const l = Math.hypot(dx, dy); if (l > STICK_R) { dx *= STICK_R / l; dy *= STICK_R / l; }
  stick.x = dx / STICK_R; stick.y = dy / STICK_R;
  knob.style.transform = `translate(${dx}px, ${dy}px)`;
};
const releaseStick = (e) => { if (e.pointerId !== stick.id) return; stick.id = null; stick.x = stick.y = 0; knob.style.transform = ''; };
stickEl.addEventListener('pointerdown', (e) => { e.preventDefault(); if (stick.id !== null) return; stick.id = e.pointerId; stickEl.setPointerCapture(e.pointerId); moveStick(e); });
stickEl.addEventListener('pointermove', (e) => { if (e.pointerId === stick.id) moveStick(e); });
stickEl.addEventListener('pointerup', releaseStick); stickEl.addEventListener('pointercancel', releaseStick);
// buttons: `hold` runs on press and release, `tap` once per press
function touchButton(id, { hold, tap, lookWhileHeld = false }) {
  const b = $(id); let pid = null, lx = 0, ly = 0;
  b.addEventListener('pointerdown', (e) => {
    e.preventDefault(); if (pid !== null) return;
    pid = e.pointerId; lx = e.clientX; ly = e.clientY; b.setPointerCapture(e.pointerId); sfx.unlock();
    b.classList.add('on'); hold?.(true); tap?.();
  });
  if (lookWhileHeld) b.addEventListener('pointermove', (e) => { if (e.pointerId !== pid) return; lookBy(e.clientX - lx, e.clientY - ly); lx = e.clientX; ly = e.clientY; });
  const up = (e) => { if (e.pointerId !== pid) return; pid = null; if (id !== 'tAim') b.classList.remove('on'); hold?.(false); };
  b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
  b.addEventListener('contextmenu', (e) => e.preventDefault());
}
const fireHeld = new Set();
for (const id of ['tFire', 'tFire2']) touchButton(id, { hold: (on) => { if (on) { fireHeld.add(id); P.firePress = true; } else fireHeld.delete(id); P.triggerHeld = fireHeld.size > 0; }, lookWhileHeld: true });
touchButton('tAim', { tap: () => { P.aimToggle = !P.aimToggle; $('tAim').classList.toggle('on', P.aimToggle); } });
touchButton('tReload', { tap: reload });
touchButton('tJump', { hold: (on) => { if (on) input.keys.add(' '); else input.keys.delete(' '); } });
touchButton('tNext', { tap: () => switchTo((P.cur + 1) % vm.length) });
touchButton('tInspect', { tap: inspect });
touchButton('tReset', { tap: () => { range.spawnLoose(); range.resetSteel(); decals.clear(); feed('Targets reset'); } });

// ---------------------------------------------------------------- loop
vm[0].rig.visible = true;
let last = performance.now(), hudT = 0;
function step(dt) {
  if (started) { updatePlayer(dt); updateWeapon(dt); } else { input.yaw = Math.sin(performance.now() / 6000) * 0.25; W().rig.mixer.update(dt); }
  world.step(dt);
  range.update(dt);
  for (const c of casings) { c.t -= dt; if (!c.clinked && c.body.position[1] < 0.1) { c.clinked = true; sfx.tink(); } }
  while (casings.length && casings[0].t <= 0) { const c = casings.shift(); world.remove(c.body); scene.remove(c.mesh); }
  for (const d of debris) { d.t -= dt; if (d.t <= 0) { world.remove(d.body); scene.remove(d.mesh); } }
  for (let i = debris.length - 1; i >= 0; i--) if (debris[i].t <= 0) debris.splice(i, 1);
  updateViewmodel(dt);
  if (P.flashT > 0) { P.flashT -= dt; if (P.flashT <= 0) flashLight.intensity = 0; }
  particles.update(dt); sparks.update(dt);
  // walk up to a counter and its gun works its action once (V5 MechClips on the Prop's rig)
  for (const d of displays) {
    const near = Math.hypot(d.position[0] - cc.position[0], d.position[2] - cc.position[2]) < 1.3;
    if (near && !d.userData.shown && !d.rig.playing) { d.userData.shown = true; d.play(d.clips.has('Reload') ? 'Reload' : 'Pump'); }
    if (!near) d.userData.shown = false;
    d.update(dt);
  }
}
function render(dt) {
  const eye = eyePos(), { f, up } = camBasis();
  camera.position.set(eye); camera.target.set(PM.madd(eye, f, 10)); camera.up.set(up);
  const lines = [];
  for (const t of tracers) { t.t -= dt; const al = Math.max(0, t.t / 0.08); lines.push(...t.a, 5, 3.6, 1.6, al, ...t.b, 5, 3.6, 1.6, al * 0.3); }
  for (let i = tracers.length - 1; i >= 0; i--) if (tracers[i].t <= 0) tracers.splice(i, 1);
  env.shadowCenter = [cc.position[0] + f[0] * 8, 1, cc.position[2] + f[2] * 8];
  const scoped = !$('scope').hidden;
  renderer.settings.dofAperture = 0;
  renderer.settings.vignette = scoped ? 0.2 : 0.35;
  renderer.render(scene, camera, { background: 'sky', particles: [particles, sparks], lines: lines.length ? [{ data: new Float32Array(lines) }] : undefined });
}
function frame(now) {
  const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
  step(dt);
  render(dt);
  if (started) { updateCrosshair(); hudT += dt; if (hudT > 0.05) { hudT = 0; hud(); } }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// test hooks for headless checks
window.__range = {
  start, P, vm, input, cc, world, camera, renderer, fire: () => { P.triggerHeld = true; step(1 / 60); P.triggerHeld = false; },
  simulate(sec) { for (let t = 0; t < sec; t += 1 / 60) step(1 / 60); render(1 / 60); },
  set: (o) => Object.assign(P, o), look(yaw, pitch) { input.yaw = yaw; input.pitch = pitch; },
  reload, inspect, switchTo, keys: input.keys, displays,
};
