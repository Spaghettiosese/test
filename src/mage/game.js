// Ember Glade: a third-person playground for the Ember Mage. WASD to move, the mouse to
// aim; the left button throws fireballs, the right button breathes a stream of flame,
// E slams the ground into a fire nova. Everything wooden burns and spreads through the
// engine's FireSystem; crates and barrels are physics bodies that tumble and burn.
import * as E from '../../engine/index.js';
import { createMage, bonePoint } from './mage.js';
import { buildGlade } from './world.js';
import { FireSfx } from './sfx.js';

const $ = (id) => document.getElementById(id);
const PM = E.physicsMath;
let renderer;
try { renderer = new E.Renderer($('stage')); } catch (e) { $('fatal').hidden = false; $('fatal').textContent = 'This game needs WebGL2. ' + e.message; throw e; }
renderer.settings.adaptiveResolution = true; renderer.settings.targetFps = 50;
renderer.settings.bloomStrength = 0.34;

// ---------------------------------------------------------------- world
const scene = new E.Scene(), env = scene.environment;
const TIMES = [18.3, 20.6, 12.5]; let timeIdx = 0;
const setTime = () => { E.applyTimeOfDay(env, TIMES[timeIdx]); env.fogDensity = 0.006; env.shadowRadius = 22; env.shadowFar = 110; env.fogHeight = 0.2; };
setTime();
const world = new E.PhysicsWorld({ iterations: 8 });
const fire = new E.FireSystem(scene, { maxLights: 8, maxFlames: 5000, maxSmoke: 3000, wind: [0.5, 0, 0.15] });
const glade = buildGlade(scene, world, fire);
const camera = new E.Camera(); camera.near = 0.1; camera.far = 500;
const sparks = new E.Particles(2500, { additive: true }); sparks.gravity = -3.5; sparks.drag = 0.9;
const decals = new E.Decals({ max: 200, sides: 28, material: new E.Material({ name: 'Scorch', color: '#0c0908', roughness: 1 }) }); scene.add(decals);
const sfx = new FireSfx();

// ---------------------------------------------------------------- the mage
const mage = createMage();
scene.add(mage);
const sk = mage.skeleton;
const cast = mage.mixer.addLayer('cast', { mask: E.boneMask(sk, ['spine']) });
const full = mage.mixer.addLayer('full', { mask: null });
const locomotion = new E.BlendSpace1D(mage.mixer, [{ clip: 'Idle', x: 0 }, { clip: 'Walk', x: 1.35 }, { clip: 'Run', x: 4.4 }]);
const cc = new E.CharacterController(world, { position: [0, 0.15, -5.5], radius: 0.34, height: 1.8, mask: 0xffff });
cc.body.userData.player = true;
const handLight = new E.Light('point', { color: '#ff8a3a', intensity: 2, range: 5, flicker: 0.6 }); scene.add(handLight);
const flash = new E.Light('point', { color: '#ffb266', intensity: 0, range: 18 }); scene.add(flash);

const S = {
  yaw: 0, pitch: -0.18, face: 0, dist: 4.6, mana: 100, maxMana: 100, breathing: false, breathT: 0, breathSnd: 0, castT: 0, slamT: 0,
  cooldown: 0, shake: 0, moving: 0, started: false, airborne: false, hitCount: 0, walk: false, boom: 0, crackleT: 0,
};
const input = { keys: new Set(), lmb: false, rmb: false, stick: { x: 0, y: 0 } };
const touchMode = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
const fireballs = [];

// ---------------------------------------------------------------- helpers
function feed(text) { const d = document.createElement('div'); d.textContent = text; $('feed').prepend(d); setTimeout(() => d.remove(), 3200); while ($('feed').children.length > 5) $('feed').lastChild.remove(); }
const fwd = () => { const cp = Math.cos(S.pitch); return [Math.sin(S.yaw) * cp, Math.sin(S.pitch), Math.cos(S.yaw) * cp]; };
const norm = (v) => PM.norm(v);
const madd = PM.madd;
const handR = () => bonePoint(mage, 'hand.R', [0, -0.03, 0.03]);
const handL = () => bonePoint(mage, 'hand.L', [0, -0.03, 0.03]);
const head = () => [cc.position[0], cc.position[1] + 1.55, cc.position[2]];

// where the crosshair points: the first thing along the camera ray, or far away
function aimPoint() {
  const o = camera.position, d = fwd();
  const hit = world.raycast([o[0], o[1], o[2]], d, 90, { ignore: cc.body });
  return hit ? hit.point : madd([o[0], o[1], o[2]], d, 60);
}
function burst(p, { flames = 40, sparksN = 30, smoke = 10, size = 0.5, power = 3.5 } = {}) {
  fire.flames.emit(p, { count: flames, color: [3.4, 2.2, 0.9, 0.7], colorEnd: [0.9, 0.12, 0.03, 0.2], size, grow: 1.3, spread: power, up: power * 0.6, buoyancy: 1.8, life: 0.7, jitter: 0.25 });
  sparks.emit(p, { count: sparksN, color: [7, 4, 1.2, 1], colorEnd: [2.5, 0.4, 0.05, 0.4], size: 0.05, grow: 0.4, spread: power * 1.5, up: power * 1.6, life: 1.2, jitter: 0.2 });
  fire.smoke.emit(p, { count: smoke, color: [0.12, 0.11, 0.1, 0.55], colorEnd: [0.35, 0.34, 0.33, 0.1], size: size * 1.1, grow: 5, spread: power * 0.4, up: 1.2, buoyancy: 0.7, life: 3.5, jitter: 0.3 });
}
function explode(p, normal, radius = 2.4, power = 9) {
  const n = fire.igniteAt(p, radius);
  world.explode(p, radius * 1.7, power);
  burst(p, { flames: 60, sparksN: 45, smoke: 14, size: 0.55, power: 3.6 });
  if (normal && decals) decals.add(p, normal, radius * 0.65);
  flash.position.set([p[0], p[1] + 0.4, p[2]]); S.boom = 1; flash.range = 8 + radius * 4;
  const d = Math.hypot(p[0] - cc.position[0], p[2] - cc.position[2]); S.shake = Math.max(S.shake, Math.min(1, 6 / (d + 2)) * 0.5);
  sfx.boom(Math.min(1.2, 0.7 + radius * 0.2));
  if (n) feed(`${n} thing${n > 1 ? 's' : ''} caught fire`);
}

// ---------------------------------------------------------------- powers
function throwFireball() {
  if (S.cooldown > 0 || S.mana < 14 || S.slamT > 0 || S.breathing) return;
  S.mana -= 14; S.cooldown = 0.55; S.castT = 0.6;
  cast.playOnce('Fireball', { fadeIn: 0.08, fadeOut: 0.25, speed: 1.15 });
}
function launchFireball() { // the Fireball clip's 'fireball' event: the hand opens
  const from = handR(), to = aimPoint(), dir = norm([to[0] - from[0], to[1] - from[1], to[2] - from[2]]);
  const light = new E.Light('point', { color: '#ff8a3a', intensity: 7, range: 9, flicker: 0.5 }); scene.add(light);
  fireballs.push({ p: from, v: [dir[0] * 26, dir[1] * 26 + 0.8, dir[2] * 26], life: 3, light });
  sfx.whoosh(1);
}
function updateFireballs(dt) {
  for (let i = fireballs.length - 1; i >= 0; i--) {
    const f = fireballs[i];
    f.life -= dt; f.v[1] -= 3.2 * dt;
    const len = Math.hypot(...f.v) * dt, dir = norm(f.v);
    const hit = world.raycast(f.p, dir, len + 0.25, { ignore: cc.body });
    fire.flames.emit(f.p, { count: 3, color: [4.2, 2.6, 0.7, 0.8], colorEnd: [1, 0.15, 0.03, 0.2], size: 0.34, grow: 0.3, spread: 0.5, up: 0.3, buoyancy: 1, life: 0.35, jitter: 0.08 });
    sparks.emit(f.p, { count: 1, color: [8, 5, 1.5, 1], colorEnd: [2, 0.3, 0.05, 0.3], size: 0.04, grow: 0.5, spread: 1.2, up: 0.5, life: 0.6, jitter: 0.05 });
    if (Math.random() < dt * 12) fire.smoke.emit(f.p, { count: 1, color: [0.1, 0.09, 0.08, 0.4], colorEnd: [0.3, 0.3, 0.3, 0.1], size: 0.25, grow: 4, spread: 0.2, up: 0.4, buoyancy: 0.5, life: 2, jitter: 0.1 });
    f.light.position.set(f.p);
    if (hit || f.life <= 0) {
      const p = hit ? hit.point : f.p;
      explode(p, hit ? hit.normal : null, 2.4, 9);
      if (hit && hit.body.isDynamic) hit.body.applyImpulse([dir[0] * 40, dir[1] * 40 + 15, dir[2] * 40], hit.point);
      scene.remove(f.light); fireballs.splice(i, 1); continue;
    }
    f.p = madd(f.p, dir, len);
  }
}
function breathe(dt) {
  const on = input.rmb && S.mana > 0 && S.slamT <= 0;
  if (on !== S.breathing) { S.breathing = on; if (on) cast.play('Flamethrower', { fade: 0.15, restart: true }); else cast.setWeights({}, 0.2); }
  if (!on) return;
  S.mana = Math.max(0, S.mana - 18 * dt);
  const a = handR(), b = handL(), from = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  const to = aimPoint(), dir = norm([to[0] - from[0], to[1] - from[1], to[2] - from[2]]);
  for (let i = 0; i < 8; i++) {
    const s = 6 + Math.random() * 5, sp = 0.5 + Math.random() * 0.6;
    fire.flames.emit(from, { count: 1, color: [3, 1.5, 0.4, 0.5], colorEnd: [0.9, 0.12, 0.03, 0.15], size: 0.14, grow: 3.2, spread: 0.6, up: 0.2, vel: [dir[0] * s + (Math.random() - 0.5) * sp, dir[1] * s + (Math.random() - 0.5) * sp, dir[2] * s + (Math.random() - 0.5) * sp], buoyancy: 1.2, life: 0.55, jitter: 0.05 });
  }
  if (Math.random() < 0.5) sparks.emit(from, { count: 1, color: [8, 5, 1.5, 1], colorEnd: [2, 0.3, 0.05, 0.3], size: 0.035, grow: 0.5, spread: 0.6, up: 0.2, vel: [dir[0] * 7, dir[1] * 7, dir[2] * 7], life: 0.9, jitter: 0.05 });
  S.breathT -= dt;
  if (S.breathT <= 0) {
    S.breathT = 0.1;
    let n = 0;
    for (let d = 1; d <= 7.5; d += 0.9) n += fire.igniteAt(madd(from, dir, d), 0.35 + d * 0.11);
    if (n) feed(`${n} thing${n > 1 ? 's' : ''} caught fire`);
    const hit = world.raycast(from, dir, 8, { ignore: cc.body });
    if (hit) { if (hit.body.isDynamic) hit.body.applyImpulse([dir[0] * 4, dir[1] * 4 + 1, dir[2] * 4], hit.point); if (Math.random() < 0.3) decals.add(hit.point, hit.normal, 0.6 + Math.random() * 0.5); }
  }
  S.breathSnd -= dt; if (S.breathSnd <= 0) { S.breathSnd = 0.16; sfx.breath(); }
}
function slam() {
  if (S.mana < 35 || S.slamT > 0 || S.cooldown > 0 || !cc.grounded) return;
  S.mana -= 35; S.slamT = 1.1; S.cooldown = 0.6;
  full.playOnce('Slam', { fadeIn: 0.1, fadeOut: 0.35, speed: 1.1 });
}
function nova() { // the Slam clip's 'slam' event: the fists hit the ground
  const p = [cc.position[0], 0.05, cc.position[2]];
  burst(p, { flames: 90, sparksN: 70, smoke: 20, size: 0.6, power: 6 });
  for (let i = 0; i < 90; i++) { // a ring of flame racing outward
    const a = (i / 90) * Math.PI * 2;
    fire.flames.emit(p, { count: 1, color: [3.6, 2.2, 0.8, 0.6], colorEnd: [1, 0.15, 0.03, 0.2], size: 0.4, grow: 1.2, spread: 0.1, up: 0.4, vel: [Math.sin(a) * 9, 0, Math.cos(a) * 9], buoyancy: 1.2, life: 0.75, jitter: 0.1 });
  }
  for (let r = 1.5; r <= 6.5; r += 1.5) for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + r; fire.igniteAt([p[0] + Math.sin(a) * r, 0.5, p[2] + Math.cos(a) * r], 0.9); }
  world.explode([p[0], 0.2, p[2]], 7, 12);
  decals.add(p, [0, 1, 0], 3.4);
  flash.position.set([p[0], 1, p[2]]); S.boom = 1; flash.range = 22; S.shake = 0.9;
  sfx.boom(1.3); feed('Fire nova!');
}
mage.mixer.on((e) => {
  if (e.name === 'fireball') launchFireball();
  if (e.name === 'slam') nova();
  if (e.name === 'footstep' && cc.grounded && S.moving > 1.2 && Math.random() < 0.5) sfx.thump();
});

// ---------------------------------------------------------------- fire hooks
fire.onIgnite = (b) => { if (b.userData?.name && !b.permanent) sfx.whoosh(0.5); };
fire.onBurntOut = (b) => {
  const u = b.userData || {};
  if (u.prop) { // crates and barrels fall apart into embers
    world.remove(u.prop.body); scene.remove(u.prop.node); glade.props.splice(glade.props.indexOf(u.prop), 1); fire.remove(b); S.hitCount++;
  } else if (u.collapse && u.node) { scene.remove(u.node); u.node.parent?.remove(u.node); fire.remove(b); S.hitCount++; }
  else if (u.name) { S.hitCount++; feed(`${u.name} burnt out`); }
};

// ---------------------------------------------------------------- player + camera
function updatePlayer(dt) {
  const k = input.keys;
  const f = [Math.sin(S.yaw), 0, Math.cos(S.yaw)], l = [Math.cos(S.yaw), 0, -Math.sin(S.yaw)];
  let wx = 0, wz = 0;
  if (k.has('w')) { wx += f[0]; wz += f[2]; } if (k.has('s')) { wx -= f[0]; wz -= f[2]; }
  if (k.has('a')) { wx += l[0]; wz += l[2]; } if (k.has('d')) { wx -= l[0]; wz -= l[2]; }
  const sm = Math.hypot(input.stick.x, input.stick.y);
  if (sm > 0.08) { const fx = -input.stick.y, sx = input.stick.x; wx += f[0] * fx - l[0] * sx; wz += f[2] * fx - l[2] * sx; }
  const len = Math.hypot(wx, wz);
  const casting = S.castT > 0 || S.breathing || S.slamT > 0;
  const top = (S.walk || (sm > 0.08 && sm < 0.5) ? 1.9 : 5.0) * (S.slamT > 0 ? 0 : S.breathing ? 0.45 : S.castT > 0 ? 0.7 : 1);
  if (len > 0) { wx /= len; wz /= len; }
  cc.move([wx * top, wz * top], dt);
  if (k.has(' ') && cc.grounded) { cc.jump(6.4); mage.mixer.play('Jump', { fade: 0.08, restart: true }); }
  if (cc.position[1] < -5) { cc.position = [0, 1, -5.5]; cc.velocity = [0, 0, 0]; }
  const hv = Math.hypot(cc.velocity[0], cc.velocity[2]);
  S.moving += (hv - S.moving) * Math.min(1, dt * 12);
  // face the movement direction, or the camera while casting
  let target = S.face;
  if (casting) target = S.yaw; else if (len > 0 && hv > 0.3) target = Math.atan2(cc.velocity[0], cc.velocity[2]);
  let d = target - S.face; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
  S.face += d * Math.min(1, dt * (casting ? 14 : 9));
  mage.position.set([cc.position[0], cc.position[1], cc.position[2]]);
  mage.setEuler(0, (S.face * 180) / Math.PI, 0);
  // animation
  const airborne = !cc.grounded && cc.position[1] > 0.35;
  if (airborne !== S.airborne) { S.airborne = airborne; if (!airborne) locomotion.set(S.moving, 0.1); }
  if (airborne) mage.mixer.setWeights({ Jump: 1 }, 0.1);
  else {
    const w = locomotion.weights(S.moving); locomotion.mixer.setWeights({ ...w, Jump: 0 }, 0.15);
    const wa = mage.mixer.action('Walk'), ra = mage.mixer.action('Run');
    if (wa) wa.speed = E.clamp(S.moving / 1.35, 0.55, 1.5); if (ra) ra.speed = E.clamp(S.moving / 4.4, 0.6, 1.3);
  }
  mage.update(dt);
}
function updateCamera(dt) {
  S.shake = Math.max(0, S.shake - dt * 1.6);
  const aiming = input.rmb || S.castT > 0;
  S.dist += ((aiming ? 3.3 : 4.8) - S.dist) * Math.min(1, dt * 6);
  const f = fwd(), right = [-Math.cos(S.yaw), 0, Math.sin(S.yaw)];
  const anchor = madd(head(), right, aiming ? 0.7 : 0.35);
  let dist = S.dist;
  const back = norm([-f[0], -f[1], -f[2]]);
  const hit = world.raycast(anchor, back, dist + 0.3, { ignore: cc.body });
  if (hit) dist = Math.max(0.6, hit.distance - 0.3);
  const s = S.shake * S.shake * 0.5;
  const pos = madd(anchor, back, dist);
  pos[0] += (Math.random() - 0.5) * s; pos[1] += (Math.random() - 0.5) * s; pos[2] += (Math.random() - 0.5) * s;
  pos[1] = Math.max(pos[1], 0.25);
  camera.position.set(pos); camera.target.set(madd(pos, f, 10)); camera.up.set([0, 1, 0]);
  camera.fov = (aiming ? 58 : 66) * E.DEG;
  env.shadowCenter = [cc.position[0] + f[0] * 5, 1, cc.position[2] + f[2] * 5];
}

// ---------------------------------------------------------------- ambient fire on the mage
function updateAura(dt) {
  const power = S.mana / S.maxMana;
  for (const h of [handR(), handL()]) {
    if (Math.random() < dt * (24 + 30 * power)) fire.flames.emit(h, { count: 1, color: [3.4, 2, 0.6, 0.5], colorEnd: [1, 0.15, 0.03, 0.15], size: 0.075 + 0.05 * power, grow: 0.6, spread: 0.12, up: 0.5, buoyancy: 1.6, life: 0.55, jitter: 0.03 });
    if (Math.random() < dt * 4) sparks.emit(h, { count: 1, color: [6, 3.6, 1, 1], colorEnd: [2, 0.3, 0.05, 0.3], size: 0.03, grow: 0.5, spread: 0.3, up: 0.9, life: 1, jitter: 0.03 });
  }
  const eye = bonePoint(mage, 'head', [0, 0.1, 0.09]);
  if (Math.random() < dt * 6) fire.flames.emit(bonePoint(mage, 'shoulder.L', [0, 0, 0]), { count: 1, color: [3, 1.6, 0.4, 0.35], colorEnd: [1, 0.1, 0.02, 0.1], size: 0.05, grow: 0.5, spread: 0.05, up: 0.5, buoyancy: 1.8, life: 0.6, jitter: 0.02 });
  void eye;
  handLight.position.set(handR());
  handLight.intensity = (1.5 + 2 * power) * (S.breathing ? 2.5 : 1);
}

// ---------------------------------------------------------------- input
const canvas = $('stage');
let locked = false;
const look = (dx, dy) => { S.yaw -= dx * 0.0026; S.pitch = E.clamp(S.pitch - dy * 0.0026, -1.15, 0.9); };
document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === canvas; $('menu').hidden = locked; });
document.addEventListener('mousemove', (e) => { if (locked) look(e.movementX, e.movementY); else if (e.buttons & 4) look(e.movementX, e.movementY); });
canvas.addEventListener('mousedown', (e) => {
  if (!S.started) return; sfx.unlock();
  if (!locked && canvas.requestPointerLock) { try { canvas.requestPointerLock(); } catch { /* drag to look instead */ } }
  if (e.button === 0) { input.lmb = true; throwFireball(); }
  if (e.button === 2) input.rmb = true;
});
window.addEventListener('mouseup', (e) => { if (e.button === 0) input.lmb = false; if (e.button === 2) input.rmb = false; });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
window.addEventListener('keydown', (e) => {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (['w', 'a', 's', 'd', ' '].includes(key)) { input.keys.add(key); e.preventDefault(); }
  if (e.repeat) return;
  if (key === 'q') { S.walk = !S.walk; feed(S.walk ? 'Walking' : 'Running'); }
  if (key === 'e') slam();
  if (key === 'r') resetGlade();
  if (key === 't') { timeIdx = (timeIdx + 1) % TIMES.length; setTime(); feed(['Dusk', 'Night', 'Noon'][timeIdx]); }
  if (key === 'h') $('help').hidden = !$('help').hidden;
});
window.addEventListener('keyup', (e) => { const key = e.key.length === 1 ? e.key.toLowerCase() : e.key; input.keys.delete(key); });
window.addEventListener('blur', () => { input.keys.clear(); input.lmb = input.rmb = false; });
$('start').addEventListener('click', () => { S.started = true; $('menu').hidden = true; sfx.unlock(); if (canvas.requestPointerLock) { try { canvas.requestPointerLock(); } catch { /* ignore */ } } });
canvas.addEventListener('mousemove', (e) => { if (!locked && S.started && (e.buttons & 1) && !(e.buttons & 4)) look(e.movementX, e.movementY); });

function resetGlade() {
  for (const b of [...fire.burnables]) if (!b.permanent) { fire.extinguish(b); b.fuel = b.maxFuel; b.heat = 0; b.fire = 0; b.state = 'fresh'; b.charred = 0; if (b.mats) fire._char(b); }
  for (const p of glade.props) { world.remove(p.body); scene.remove(p.node); }
  for (const b of fire.burnables.filter((x) => x.userData?.prop)) fire.remove(b);
  glade.props.length = 0; glade.buildProps(); decals.clear(); S.mana = 100; feed('The glade is restored');
}

// ---------------------------------------------------------------- loop
function step(dt) {
  if (S.started) {
    S.cooldown = Math.max(0, S.cooldown - dt); S.castT = Math.max(0, S.castT - dt); S.slamT = Math.max(0, S.slamT - dt);
    if (input.lmb && S.cooldown <= 0) throwFireball();
    const nearBrazier = Math.hypot(cc.position[0], cc.position[2]) < 3.2;
    if (!S.breathing) S.mana = Math.min(S.maxMana, S.mana + dt * (nearBrazier ? 45 : 7));
    updatePlayer(dt);
    breathe(dt);
  } else { S.yaw += dt * 0.15; mage.update(dt); }
  world.step(dt);
  updateFireballs(dt);
  fire.update(dt, camera);
  sparks.update(dt);
  updateAura(dt);
  updateCamera(dt);
  if (S.boom > 0) { S.boom = Math.max(0, S.boom - dt * 4); flash.intensity = 30 * S.boom * S.boom; }
  S.crackleT -= dt; if (S.crackleT <= 0 && fire.stats.burning > 1) { S.crackleT = 0.35; sfx.crackle(Math.min(0.35, 0.05 * fire.stats.burning)); }
}
let hudT = 0;
function hud(dt) {
  hudT += dt; if (hudT < 0.05) return; hudT = 0;
  $('manaFill').style.width = (S.mana / S.maxMana) * 100 + '%';
  $('burning').textContent = Math.max(0, fire.stats.burning - fire.burnables.filter((b) => b.permanent && b.state === 'burning').length);
  $('burnt').textContent = S.hitCount;
}
let last = performance.now();
function frame(now) {
  const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
  step(dt); render(); hud(dt);
  requestAnimationFrame(frame);
}
function render() { renderer.render(scene, camera, { background: 'sky', particles: [...fire.particles, sparks] }); }
requestAnimationFrame(frame);

window.__mage = {
  S, input, cc, mage, world, fire, glade, camera, renderer, fireballs,
  start() { S.started = true; $('menu').hidden = true; },
  simulate(sec) { for (let t = 0; t < sec; t += 1 / 60) step(1 / 60); render(); },
  throwFireball, slam, resetGlade,
  look(yaw, pitch) { S.yaw = yaw; S.pitch = pitch; },
};

// ---------------------------------------------------------------- touch controls
if (touchMode) {
  document.body.classList.add('touch'); $('help').hidden = true; $('start').addEventListener('click', () => { $('touch').hidden = false; });
  $('start').textContent = 'Tap to begin';
  const stickEl = $('stick'), knob = $('knob'); let sid = null, cx = 0, cy = 0;
  const R = 55;
  const setStick = (e) => { let dx = e.clientX - cx, dy = e.clientY - cy; const m = Math.hypot(dx, dy); if (m > R) { dx = (dx / m) * R; dy = (dy / m) * R; } input.stick.x = dx / R; input.stick.y = dy / R; knob.style.transform = `translate(${dx}px, ${dy}px)`; };
  stickEl.addEventListener('pointerdown', (e) => { e.preventDefault(); sid = e.pointerId; stickEl.setPointerCapture(sid); const r = stickEl.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; setStick(e); sfx.unlock(); });
  stickEl.addEventListener('pointermove', (e) => { if (e.pointerId === sid) setStick(e); });
  const endStick = (e) => { if (e.pointerId !== sid) return; sid = null; input.stick.x = input.stick.y = 0; knob.style.transform = ''; };
  stickEl.addEventListener('pointerup', endStick); stickEl.addEventListener('pointercancel', endStick);
  // drag anywhere else to look around
  let lid = null, lx = 0, ly = 0;
  canvas.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' || lid !== null) return; lid = e.pointerId; lx = e.clientX; ly = e.clientY; });
  canvas.addEventListener('pointermove', (e) => { if (e.pointerId !== lid) return; look((e.clientX - lx) * 1.5, (e.clientY - ly) * 1.5); lx = e.clientX; ly = e.clientY; });
  const endLook = (e) => { if (e.pointerId === lid) lid = null; };
  canvas.addEventListener('pointerup', endLook); canvas.addEventListener('pointercancel', endLook);
  const btn = (id, down, up) => { const b = $(id); let pid = null;
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); if (pid !== null) return; pid = e.pointerId; b.setPointerCapture(pid); b.classList.add('on'); sfx.unlock(); down?.(); });
    const end = (e) => { if (e.pointerId !== pid) return; pid = null; b.classList.remove('on'); up?.(); };
    b.addEventListener('pointerup', end); b.addEventListener('pointercancel', end); b.addEventListener('contextmenu', (e) => e.preventDefault()); };
  btn('tFire', () => { input.lmb = true; throwFireball(); }, () => { input.lmb = false; });
  btn('tFlame', () => { input.rmb = true; }, () => { input.rmb = false; });
  btn('tSlam', slam);
  btn('tJump', () => input.keys.add(' '), () => input.keys.delete(' '));
  btn('tReset', resetGlade);
}
