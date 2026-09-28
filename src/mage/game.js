// Ember Glade + Frozen Sanctum: a third-person fire-mage game. Two levels share one game loop:
// the Glade sandbox (everything wooden burns and spreads, stones and the hut shatter into
// rigid-body chunks) and the boss fight against the Ice Mage, who becomes an Ice Colossus at
// half health. The fire mage has fireballs, a flame stream, a nova, the Phoenix, a Meteor
// Storm, an Inferno Wall and a Flame Dash to dodge with.
import * as E from '../../engine/index.js';
import { createMage, bonePoint } from './mage.js';
import { buildGlade } from './world.js';
import { buildArena } from './arena.js';
import { Destructibles, DEBRIS_GROUP } from './destruct.js';
import { Cutscene } from './cutscene.js';
import { IceBoss } from './boss.js';
import { FireSfx } from './sfx.js';
import { Phoenix } from './phoenix.js';
import { createColossus } from './colossus.js';

const $ = (id) => document.getElementById(id);
const PM = E.physicsMath;
let renderer;
try { renderer = new E.Renderer($('stage')); } catch (e) { $('fatal').hidden = false; $('fatal').textContent = 'This game needs WebGL2. ' + e.message; throw e; }
renderer.settings.adaptiveResolution = true; renderer.settings.targetFps = 50;
renderer.settings.bloomStrength = 0.34;
const camera = new E.Camera(); camera.near = 0.1; camera.far = 600;
const sfx = new FireSfx();
const cutscene = new Cutscene();

// ---------------------------------------------------------------- the mage (one character, reused by both levels)
const chars = {};
let mage, sk, cast, full, locomotion;
function pickChar(element) { // 'fire' or 'ice': two playable characters, built once each
  if (!chars[element]) {
    const m = createMage({}, element === 'ice' ? 'ice' : 'fire'); m.mixer.on(onMageEvent);
    chars[element] = { mage: m, cast: m.mixer.addLayer('cast', { mask: E.boneMask(m.skeleton, ['spine']) }), full: m.mixer.addLayer('full', { mask: null }), loco: new E.BlendSpace1D(m.mixer, [{ clip: 'Idle', x: 0 }, { clip: 'Walk', x: 1.35 }, { clip: 'Run', x: 4.4 }]) };
  }
  const c = chars[element]; mage = c.mage; cast = c.cast; full = c.full; locomotion = c.loco; sk = mage.skeleton;
}

// level state: rebuilt by loadLevel()
let scene, env, world, fire, sparks, snow, destruct, cc, flash, handLight;
let level = 'glade', glade = null, arena = null, boss = null;
const TIMES = [18.3, 20.6, 12.5]; let timeIdx = 0;
const S = {
  yaw: 0, pitch: -0.18, face: 0, dist: 4.6, mana: 100, maxMana: 100, hp: 100, maxHp: 100, breathing: false, breathT: 0, breathSnd: 0, castT: 0, slamT: 0,
  cooldown: 0, shake: 0, moving: 0, started: false, airborne: false, hitCount: 0, walk: false, boom: 0, crackleT: 0,
  element: 'fire', titan: null, invuln: 0, dashT: 0, dashCd: 0, dashDir: [0, 0, 1], chill: 0, frozen: false, dead: false, ended: false, puppet: null,
};
const input = { keys: new Set(), lmb: false, rmb: false, stick: { x: 0, y: 0 } };
const touchMode = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
let titanBoulders = [];
const fireballs = [], meteors = [], walls = [], patches = [], embers = [], explosives = [];
let phoenix = null;
const baseScale = new Map();

// ---------------------------------------------------------------- helpers
function feed(text) { const d = document.createElement('div'); d.textContent = text; $('feed').prepend(d); setTimeout(() => d.remove(), 3200); while ($('feed').children.length > 5) $('feed').lastChild.remove(); }
const fwd = () => { const cp = Math.cos(S.pitch); return [Math.sin(S.yaw) * cp, Math.sin(S.pitch), Math.cos(S.yaw) * cp]; };
const norm = (v) => PM.norm(v);
const madd = PM.madd;
const handR = () => bonePoint(mage, 'hand.R', [0, -0.03, 0.03]);
const handL = () => bonePoint(mage, 'hand.L', [0, -0.03, 0.03]);
const head = () => [cc.position[0], cc.position[1] + 1.55, cc.position[2]];
const ray = (o, d, len) => world.raycast(o, d, len, { ignore: cc.body, mask: 0xffff & ~DEBRIS_GROUP });
function aimPoint() { // where the crosshair points: the first thing along the camera ray, or far away
  const o = [camera.position[0], camera.position[1], camera.position[2]], d = fwd();
  const hit = ray(o, d, 90);
  return hit ? hit.point : madd(o, d, 60);
}
function burst(p, { flames = 40, sparksN = 30, smoke = 10, size = 0.5, power = 3.5 } = {}) {
  fire.flames.emit(p, { count: flames, color: [3.4, 2.2, 0.9, 0.7], colorEnd: [0.9, 0.12, 0.03, 0.2], size, grow: 1.3, spread: power, up: power * 0.6, buoyancy: 1.8, life: 0.7, jitter: 0.25 });
  sparks.emit(p, { count: sparksN, color: [7, 4, 1.2, 1], colorEnd: [2.5, 0.4, 0.05, 0.4], size: 0.05, grow: 0.4, spread: power * 1.5, up: power * 1.6, life: 1.2, jitter: 0.2 });
  fire.smoke.emit(p, { count: smoke, color: [0.12, 0.11, 0.1, 0.55], colorEnd: [0.35, 0.34, 0.33, 0.1], size: size * 1.1, grow: 5, spread: power * 0.4, up: 1.2, buoyancy: 0.7, life: 3.5, jitter: 0.3 });
}
const el = () => (level === 'boss' ? 'fire' : S.element);
const bossOn = () => boss && boss.active && !boss.hidden && !boss.dead;
// a blast: ignites, shoves rigid bodies, wears down destructibles and hurts the boss
function explode(p, normal, radius = 2.4, power = 9, dmg = 34) {
  const n = fire.igniteAt(p, radius);
  world.explode(p, radius * 1.7, power);
  const broke = destruct.damage(p, radius * 1.7, power * 8);
  burst(p, { flames: 60, sparksN: 45, smoke: 14, size: 0.55, power: 3.6 });
  flash.color = '#ffb266'; flash.position.set([p[0], p[1] + 0.4, p[2]]); S.boom = 1; flash.range = 8 + radius * 4;
  const d = Math.hypot(p[0] - cc.position[0], p[2] - cc.position[2]); S.shake = Math.max(S.shake, Math.min(1, 6 / (d + 2)) * 0.5);
  sfx.boom(Math.min(1.2, 0.7 + radius * 0.2));
  if (n) feed(`${n} thing${n > 1 ? 's' : ''} caught fire`);
  if (broke) feed(broke > 1 ? `${broke} things shattered` : 'Shattered!');
  if (bossOn()) { const c = boss.center(), gap = Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]) - boss.radius(); if (gap < radius) boss.hurt(dmg * (1 - 0.5 * Math.max(0, gap) / radius), p); }
  if (level === 'glade') spawnPatch(p, 1);
}

// ---------------------------------------------------------------- player health, dodge
const player = {
  pos: () => [cc.position[0], cc.position[1], cc.position[2]],
  vel: () => [cc.velocity[0], 0, cc.velocity[2]],
  y: () => cc.position[1],
  hurt(n, o = {}) {
    if (S.dead || S.invuln > 0 || S.dashT > 0 || S.frozen || S.ended) return false;
    S.hp = Math.max(0, S.hp - n); S.invuln = 0.8; S.shake = Math.max(S.shake, 0.5);
    if (o.chill) S.chill = 2.2;
    cast.playOnce('Hit', { fadeIn: 0.05, fadeOut: 0.2 }); sfx.thump();
    const h = $('hurt'); h.classList.remove('pop'); void h.offsetWidth; h.classList.add('pop');
    if (S.hp <= 0) defeat();
    return true;
  },
  heal(n) { S.hp = Math.min(S.maxHp, S.hp + n); },
  refill(n) { S.mana = Math.min(S.maxMana, S.mana + n); },
  freeze(b) { S.frozen = b; if (!b) S.puppet = null; },
  teleport(p, yaw) { cc.position = [...p]; cc.velocity = [0, 0, 0]; S.face = yaw; S.yaw = yaw; S.pitch = -0.1; },
  puppet(p, yaw, speed) { S.puppet = { p, yaw, speed }; },
  flare() { const a = handR(), b = handL(); burst(a, { flames: 30, sparksN: 30, smoke: 2, size: 0.3, power: 2 }); burst(b, { flames: 30, sparksN: 30, smoke: 2, size: 0.3, power: 2 }); sfx.whoosh(0.8); },
};
function defeat() {
  S.dead = true; S.frozen = true; if (boss) boss.active = false; input.lmb = input.rmb = false; full.playOnce('Stagger', { fadeIn: 0.2, fadeOut: 9, speed: 0.8 });
  showEnd('FROZEN', 'The Ice Mage stands unbroken.', true);
}
function showEnd(title, sub, retry) {
  S.ended = true; $('endTitle').textContent = title; $('endSub').textContent = sub; $('retry').hidden = !retry; $('endcard').hidden = false; document.exitPointerLock?.();
}
function victory() { S.ended = true; setTimeout(() => showEnd('VICTORY', 'The Ice Mage is shattered and the sanctum thaws.', false), 400); }

function dash() {
  if (S.titan) return titanCharge();
  if (S.dashCd > 0 || S.frozen || S.dead || S.slamT > 0) return;
  const f = [Math.sin(S.yaw), 0, Math.cos(S.yaw)], l = [Math.cos(S.yaw), 0, -Math.sin(S.yaw)], k = input.keys;
  let x = 0, z = 0;
  if (k.has('w')) { x += f[0]; z += f[2]; } if (k.has('s')) { x -= f[0]; z -= f[2]; } if (k.has('a')) { x += l[0]; z += l[2]; } if (k.has('d')) { x -= l[0]; z -= l[2]; }
  const sm = Math.hypot(input.stick.x, input.stick.y);
  if (sm > 0.08) { x += f[0] * -input.stick.y - l[0] * input.stick.x; z += f[2] * -input.stick.y - l[2] * input.stick.x; }
  let m = Math.hypot(x, z); if (m < 0.01) { x = f[0]; z = f[2]; m = Math.hypot(x, z); }
  S.dashDir = [x / m, 0, z / m]; S.dashT = 0.34; S.dashCd = 0.75; S.face = Math.atan2(S.dashDir[0], S.dashDir[2]);
  full.playOnce('Dash', { fadeIn: 0.04, fadeOut: 0.2, speed: 1 }); sfx.whoosh(0.8); feed('Flame Dash');
}

// ---------------------------------------------------------------- powers
function throwFireball() {
  if (S.titan) return titanSmash();
  if (S.cooldown > 0 || S.mana < 14 || S.slamT > 0 || S.breathing || S.frozen || S.dead) return;
  S.mana -= 14; S.cooldown = 0.5; S.castT = 0.6;
  cast.playOnce('Fireball', { fadeIn: 0.08, fadeOut: 0.25, speed: 1.15 });
}
function launchFireball() { // the Fireball clip's 'fireball' event: the hand opens
  const from = handR(), to = aimPoint(), dir = norm([to[0] - from[0], to[1] - from[1], to[2] - from[2]]);
  const ice = el() === 'ice';
  const light = new E.Light('point', { color: ice ? '#7fd6ff' : '#ff8a3a', intensity: 7, range: 9, flicker: 0.5 }); scene.add(light);
  fireballs.push({ p: from, v: [dir[0] * (ice ? 32 : 26), dir[1] * (ice ? 32 : 26) + 0.8, dir[2] * (ice ? 32 : 26)], life: 3, light, ice });
  if (ice) sfx.ice(0.8); else sfx.whoosh(1);
}
function updateFireballs(dt) {
  for (let i = fireballs.length - 1; i >= 0; i--) {
    const f = fireballs[i];
    f.life -= dt; f.v[1] -= 3.2 * dt;
    const len = Math.hypot(...f.v) * dt, dir = norm(f.v);
    const hit = ray(f.p, dir, len + 0.25);
    if (f.ice) { mist(f.p, 2, 0.3, 0.4, 0.1); glint(f.p, 3, 1.2); }
    else { fire.flames.emit(f.p, { count: 3, color: [4.2, 2.6, 0.7, 0.8], colorEnd: [1, 0.15, 0.03, 0.2], size: 0.34, grow: 0.3, spread: 0.5, up: 0.3, buoyancy: 1, life: 0.35, jitter: 0.08 });
    sparks.emit(f.p, { count: 1, color: [8, 5, 1.5, 1], colorEnd: [2, 0.3, 0.05, 0.3], size: 0.04, grow: 0.5, spread: 1.2, up: 0.5, life: 0.6, jitter: 0.05 }); }
    if (!f.ice && Math.random() < dt * 12) fire.smoke.emit(f.p, { count: 1, color: [0.1, 0.09, 0.08, 0.4], colorEnd: [0.3, 0.3, 0.3, 0.1], size: 0.25, grow: 4, spread: 0.2, up: 0.4, buoyancy: 0.5, life: 2, jitter: 0.1 });
    f.light.position.set(f.p);
    let near = null;
    if (!hit) for (const b of fire.burnables) if (!b.permanent && b.state !== 'burnt' && !b.userData?.patch && E.vec3.dist(f.p, b.position) < b.radius * 0.85 + 0.15) { near = b; break; }
    const onBoss = bossOn() && boss.hits(f.p, 0.3);
    if (hit || near || onBoss || f.life <= 0) {
      const p = hit ? hit.point : f.p;
      if (f.ice) iceBlast(p, 2.6, 9); else explode(p, hit ? hit.normal : null, 2.4, 9, 36);
      if (hit && hit.body.isDynamic) hit.body.applyImpulse([dir[0] * 40, dir[1] * 40 + 15, dir[2] * 40], hit.point);
      scene.remove(f.light); fireballs.splice(i, 1); continue;
    }
    f.p = madd(f.p, dir, len);
  }
}
function breathe(dt) {
  const on = input.rmb && S.mana > 0 && S.slamT <= 0 && !S.frozen && !S.dead;
  if (on !== S.breathing) { S.breathing = on; if (on) cast.play('Flamethrower', { fade: 0.15, restart: true }); else cast.setWeights({}, 0.2); }
  if (!on) return;
  S.mana = Math.max(0, S.mana - (S.titan ? 6 : 18) * dt);
  const a = handR(), b = handL(), from = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  const to = aimPoint(), dir = norm([to[0] - from[0], to[1] - from[1], to[2] - from[2]]);
  const ice = el() === 'ice', big = !!S.titan;
  if (ice) {
    for (let i = 0; i < (big ? 30 : 10); i++) { const s = 8 + Math.random() * 7, sp = 0.18 * (0.5 + Math.random()); fire.smoke.emit(from, { count: 1, color: [0.85, 0.94, 1, 0.5], colorEnd: [0.9, 0.97, 1, 0.05], size: big ? 0.4 : 0.2, grow: big ? 10 : 6, spread: 0.2, up: 0, vel: [dir[0] * s + (Math.random() - 0.5) * s * sp, dir[1] * s + (Math.random() - 0.5) * s * sp, dir[2] * s + (Math.random() - 0.5) * s * sp], buoyancy: 0, life: 0.7, jitter: 0.08 }); }
    if (Math.random() < 0.6) sparks.emit(from, { count: 1, color: [1.5, 3, 5, 1], colorEnd: [0.3, 1, 2.5, 0.3], size: 0.05, grow: 0.5, spread: 0.6, up: 0.2, vel: [dir[0] * 8, dir[1] * 8, dir[2] * 8], life: 0.9, jitter: 0.05 });
  } else for (let i = 0; i < 8; i++) {
    const s = 6 + Math.random() * 5, sp = 0.5 + Math.random() * 0.6;
    fire.flames.emit(from, { count: 1, color: [3, 1.5, 0.4, 0.5], colorEnd: [0.9, 0.12, 0.03, 0.15], size: 0.14, grow: 3.2, spread: 0.6, up: 0.2, vel: [dir[0] * s + (Math.random() - 0.5) * sp, dir[1] * s + (Math.random() - 0.5) * sp, dir[2] * s + (Math.random() - 0.5) * sp], buoyancy: 1.2, life: 0.55, jitter: 0.05 });
  }
  if (!ice && Math.random() < 0.5) sparks.emit(from, { count: 1, color: [8, 5, 1.5, 1], colorEnd: [2, 0.3, 0.05, 0.3], size: 0.035, grow: 0.5, spread: 0.6, up: 0.2, vel: [dir[0] * 7, dir[1] * 7, dir[2] * 7], life: 0.9, jitter: 0.05 });
  S.breathT -= dt;
  if (S.breathT <= 0) {
    S.breathT = 0.1;
    let n = 0;
    for (let d = 1; d <= 7.5; d += 0.9) {
      const pt = madd(from, dir, d); if (ice) { extinguishNear(pt, (0.35 + d * 0.11) * (big ? 2 : 1)); if (big) destruct.damage(pt, 1.6, 14); continue; } n += fire.igniteAt(pt, 0.35 + d * 0.11);
      if (bossOn() && boss.hits(pt, 0.35 + d * 0.06)) { boss.hurt(4.2, pt); break; }
    }
    if (n) feed(`${n} thing${n > 1 ? 's' : ''} caught fire`);
    for (let d = 2; d <= 7; d += 2.5) destruct.damage(madd(from, dir, d), 1.2, 6);
    const hit = ray(from, dir, 8);
    if (hit && hit.body.isDynamic) hit.body.applyImpulse([dir[0] * 4, dir[1] * 4 + 1, dir[2] * 4], hit.point);
  }
  S.breathSnd -= dt; if (S.breathSnd <= 0) { S.breathSnd = 0.16; if (ice) sfx.ice(0.3); else sfx.breath(); }
}
function summonPhoenix() {
  if (S.titan) return;
  if (S.mana < 45 || phoenix || S.slamT > 0 || S.cooldown > 0 || S.breathing || S.frozen || S.dead) return;
  S.mana -= 45; S.cooldown = 1; S.castT = 1.3;
  cast.playOnce('Phoenix', { fadeIn: 0.1, fadeOut: 0.3, speed: 1 });
}
function launchPhoenix() { // the Phoenix clip's 'phoenix' event: the bird takes flight
  if (el() === 'ice') return iceSpikeLine();
  const from = madd(head(), [0, 0.9, 0], 1);
  let to = bossOn() && Math.random() < 0 ? boss.center() : aimPoint();
  const dx = to[0] - from[0], dz = to[2] - from[2], d = Math.hypot(dx, dz);
  if (d > 55) to = [from[0] + (dx / d) * 55, to[1], from[2] + (dz / d) * 55];
  to = [to[0], Math.max(to[1], 0.6), to[2]];
  phoenix = new Phoenix(scene, from, to, {
    flames: (p, n, size) => fire.flames.emit(p, { count: n, color: [3.6, 2.2, 0.7, 0.6], colorEnd: [1, 0.15, 0.03, 0.2], size, grow: 1.2, spread: 0.5, up: 0.2, buoyancy: 1.4, life: 0.6, jitter: 0.25 }),
    sparks: (p, n) => sparks.emit(p, { count: n, color: [8, 4.5, 1.2, 1], colorEnd: [2.5, 0.4, 0.05, 0.3], size: 0.05, grow: 0.5, spread: 1.5, up: 0.4, life: 1, jitter: 0.4 }),
    trail: (p) => { if (Math.random() < 0.5) fire.smoke.emit(p, { count: 1, color: [0.12, 0.1, 0.09, 0.4], colorEnd: [0.3, 0.3, 0.3, 0.08], size: 0.4, grow: 5, spread: 0.3, up: 0.3, buoyancy: 0.5, life: 2.5, jitter: 0.3 }); if (level === 'glade' && p[1] < 1.6 && Math.hypot(p[0] - cc.position[0], p[2] - cc.position[2]) > 4 && Math.random() < 0.3) spawnPatch([p[0], 0, p[2]], 2); },
    ignite: (p, r) => { fire.igniteAt(p, r); if (bossOn() && boss.hits(p, 0.8)) boss.hurt(6, p); },
    blocked: (a, b) => { const dir = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l = Math.hypot(...dir); if (l < 1e-4) return false; return !!ray(a, dir, l + 0.5) || (bossOn() && boss.hits(b, 0.4)); },
    impact: (p) => { explode(p, null, 6.5, 26, 110); burst(p, { flames: 120, sparksN: 100, smoke: 25, size: 0.8, power: 7 }); S.shake = Math.max(S.shake, 0.7); if (level === 'glade') for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; spawnPatch([p[0] + Math.sin(a) * 3.5, 0, p[2] + Math.cos(a) * 3.5], 1); } feed('Phoenix strikes!'); },
    home: () => head(),
    arrive: () => { S.mana = Math.min(S.maxMana, S.mana + 25); sfx.whoosh(0.6); },
    onDone: () => { phoenix = null; },
  });
  sfx.whoosh(1.4);
}
function slam() {
  if (S.titan) return titanBoulder();
  if (S.mana < 35 || S.slamT > 0 || S.cooldown > 0 || !cc.grounded || S.frozen || S.dead) return;
  S.mana -= 35; S.slamT = 1.1; S.cooldown = 0.6;
  full.playOnce('Slam', { fadeIn: 0.1, fadeOut: 0.35, speed: 1.1 });
}
function nova() { // the Slam clip's 'slam' event: the fists hit the ground
  if (el() === 'ice') return iceNova();
  const p = [cc.position[0], 0.05, cc.position[2]];
  burst(p, { flames: 90, sparksN: 70, smoke: 20, size: 0.6, power: 6 });
  for (let i = 0; i < 90; i++) { const a = (i / 90) * Math.PI * 2; fire.flames.emit(p, { count: 1, color: [3.6, 2.2, 0.8, 0.6], colorEnd: [1, 0.15, 0.03, 0.2], size: 0.4, grow: 1.2, spread: 0.1, up: 0.4, vel: [Math.sin(a) * 9, 0, Math.cos(a) * 9], buoyancy: 1.2, life: 0.75, jitter: 0.1 }); }
  for (let r = 1.5; r <= 6.5; r += 1.5) for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + r; fire.igniteAt([p[0] + Math.sin(a) * r, 0.5, p[2] + Math.cos(a) * r], 0.9); }
  world.explode([p[0], 0.2, p[2]], 7, 12); destruct.damage([p[0], 0.6, p[2]], 7, 90);
  if (bossOn()) { const c = boss.center(), gap = Math.hypot(p[0] - c[0], p[2] - c[2]) - boss.radius(); if (gap < 7) boss.hurt(46 * (1 - 0.5 * Math.max(0, gap) / 7), p); }
  flash.position.set([p[0], 1, p[2]]); S.boom = 1; flash.range = 22; S.shake = 0.9;
  sfx.boom(1.3); feed('Fire nova!');
}
// Meteor Storm: the sky rains fire on the crosshair
const METEOR = new E.Material({ name: 'Meteor', color: '#3b2a22', roughness: 0.8, emissive: '#ff5a12', emissiveStrength: 4 });
const meteorGeo = E.superquadric({ rx: 0.7, ry: 0.6, rz: 0.75, e1: 0.8, e2: 0.8, widthSegments: 12, heightSegments: 8 });
function castMeteors() {
  if (S.titan) return;
  if (S.mana < 55 || S.cooldown > 0 || S.slamT > 0 || S.breathing || S.frozen || S.dead) return;
  S.mana -= 55; S.cooldown = 1.2; S.castT = 1.8;
  cast.playOnce('Meteor', { fadeIn: 0.1, fadeOut: 0.35, speed: 1 });
}
function launchMeteors() { // the Meteor clip's 'meteors' event: hands snap down
  let tgt = aimPoint(); if (bossOn() && boss.hits(tgt, 6)) tgt = [boss.center()[0], 0, boss.center()[2]];
  for (let i = 0; i < 8; i++) {
    const a = Math.random() * Math.PI * 2, r = i === 0 ? 0 : 1.5 + Math.random() * 6.5;
    meteors.push({ ice: el() === 'ice', tgt: [tgt[0] + Math.sin(a) * r, Math.max(0, tgt[1]), tgt[2] + Math.cos(a) * r], delay: i * 0.16 + Math.random() * 0.1, mesh: null, p: null });
  }
  if (el() === 'ice') { sfx.ice(1.6); feed('Icicle Storm!'); } else { sfx.whoosh(1.6); feed('Meteor Storm!'); }
}
function updateMeteors(dt) {
  const dir = norm([0.32, -1, 0.14]), speed = 34;
  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i];
    if (m.delay > 0) { m.delay -= dt; if (m.delay <= 0) { m.p = madd(m.tgt, dir, -48); m.mesh = m.ice ? new E.Mesh(shardGeo, ICE_SHARD, 'Icicle') : new E.Mesh(meteorGeo, METEOR, 'Meteor'); if (m.ice) m.mesh.scale.set([0.5, 3, 0.5]); m.mesh.castShadow = false; scene.add(m.mesh); } else if (Math.random() < 0.5) sparks.emit([m.tgt[0], 0.15, m.tgt[2]], { count: 1, color: [4, 1.6, 0.4, 0.8], colorEnd: [1, 0.2, 0.05, 0.2], size: 0.14, grow: 0.4, spread: 1.6, up: 0.1, life: 0.35, jitter: 0.6 }); if (m.delay > 0) continue; }
    m.p = madd(m.p, dir, speed * dt); m.mesh.position.set(m.p); if (m.ice) m.mesh.setEuler(180, 0, 0); else m.mesh.setEuler(m.p[1] * 30, m.p[1] * 22, 0);
    if (m.ice) { mist(m.p, 2, 0.5, 0.4, 0.1); glint(m.p, 2, 1); } else {
    fire.flames.emit(m.p, { count: 3, color: [4, 2.2, 0.6, 0.7], colorEnd: [1, 0.12, 0.02, 0.2], size: 0.7, grow: 0.5, spread: 0.6, up: 0.3, buoyancy: 0.6, life: 0.55, jitter: 0.25 });
    fire.smoke.emit(m.p, { count: 1, color: [0.12, 0.1, 0.09, 0.4], colorEnd: [0.3, 0.3, 0.3, 0.08], size: 0.6, grow: 4, spread: 0.4, up: 0.2, buoyancy: 0.4, life: 2, jitter: 0.3 }); }
    const hit = ray([m.p[0] - dir[0] * speed * dt, m.p[1] - dir[1] * speed * dt, m.p[2] - dir[2] * speed * dt], dir, speed * dt + 0.6);
    const onBoss = bossOn() && boss.hits(m.p, 0.4);
    if (m.p[1] <= 0.5 || hit || onBoss) { if (m.ice) iceBlast(hit ? hit.point : m.p, 3.2, 14); else { explode(hit ? hit.point : m.p, null, 3.6, 18, 42); burst(m.p, { flames: 50, sparksN: 50, smoke: 10, size: 0.8, power: 5 }); } scene.remove(m.mesh); meteors.splice(i, 1); }
  }
}
// Inferno Wall: a line of flame sweeps outward along the ground
function castWall() {
  if (S.titan) return;
  if (S.mana < 30 || S.cooldown > 0 || S.slamT > 0 || S.breathing || S.frozen || S.dead) return;
  S.mana -= 30; S.cooldown = 0.9; S.castT = 1.1;
  cast.playOnce('Sweep', { fadeIn: 0.08, fadeOut: 0.3, speed: 1 });
}
function launchWall() { // the Sweep clip's 'wall' event
  if (el() === 'ice') return iceWall();
  const d = norm([Math.sin(S.yaw), 0, Math.cos(S.yaw)]);
  walls.push({ c: [cc.position[0] + d[0] * 2.5, 0, cc.position[2] + d[2] * 2.5], d, t: 0, life: 2.6, speed: 7.5, half: 5, tick: 0 });
  sfx.whoosh(1.3); feed('Inferno Wall');
}
function updateWalls(dt) {
  for (let i = walls.length - 1; i >= 0; i--) {
    const w = walls[i]; w.t += dt; w.c[0] += w.d[0] * w.speed * dt; w.c[2] += w.d[2] * w.speed * dt;
    const side = [w.d[2], 0, -w.d[0]], grow = Math.min(1, w.t * 3) * (1 - Math.max(0, (w.t - w.life + 0.6) / 0.6));
    for (let k = 0; k < 14; k++) { const o = (Math.random() * 2 - 1) * w.half * grow, p = [w.c[0] + side[0] * o, 0.1, w.c[2] + side[2] * o]; fire.flames.emit(p, { count: 1, color: [3.6, 2, 0.6, 0.6], colorEnd: [1, 0.12, 0.03, 0.2], size: 0.55, grow: 1.4, spread: 0.3, up: 1.6 + Math.random() * 1.6, buoyancy: 2.2, life: 0.7, jitter: 0.2 }); }
    if (Math.random() < 0.6) sparks.emit([w.c[0] + side[0] * (Math.random() * 2 - 1) * w.half, 0.4, w.c[2] + side[2] * (Math.random() * 2 - 1) * w.half], { count: 1, color: [8, 4.5, 1.2, 1], colorEnd: [2, 0.3, 0.05, 0.3], size: 0.05, grow: 0.5, spread: 0.6, up: 2, life: 0.9, jitter: 0.1 });
    w.tick -= dt;
    if (w.tick <= 0) {
      w.tick = 0.1;
      for (let o = -w.half * grow; o <= w.half * grow; o += 1.6) {
        const p = [w.c[0] + side[0] * o, 0.6, w.c[2] + side[2] * o];
        fire.igniteAt(p, 0.9); destruct.damage(p, 1.4, 7); world.explode(p, 2.2, 1.2);
        if (level === 'glade' && Math.random() < 0.1) spawnPatch([p[0], 0, p[2]], 2);
      }
      if (bossOn()) { const c = boss.center(), rel = [c[0] - w.c[0], c[2] - w.c[2]], along = rel[0] * w.d[0] + rel[1] * w.d[2], lat = rel[0] * side[0] + rel[1] * side[2]; if (Math.abs(along) < 1.2 + boss.radius() && Math.abs(lat) < w.half + boss.radius()) boss.hurt(3.4, c); }
    }
    if (w.t >= w.life) walls.splice(i, 1);
  }
}
// ---------------------------------------------------------------- Ice Mage powers
const ICE_MAT = new E.Material({ name: 'Player ice', color: '#a8dcf2', roughness: 0.08, metallic: 0.15, emissive: '#3a8fc0', emissiveStrength: 1 });
const ICE_SHARD = new E.Material({ name: 'Player shard', color: '#d6f4ff', roughness: 0.05, emissive: '#7fd6ff', emissiveStrength: 3 });
const shardGeo = E.cone({ radius: 1, height: 1, radialSegments: 6, heightSegments: 1 });
const pspikes = [];
const mist = (p, n = 10, size = 0.5, spread = 2, up = 1) => fire.smoke.emit(p, { count: n, color: [0.85, 0.93, 1, 0.5], colorEnd: [0.9, 0.96, 1, 0.05], size, grow: 4, spread, up, buoyancy: 0.2, life: 1.6, jitter: 0.3 });
const glint = (p, n = 14, spread = 3) => sparks.emit(p, { count: n, color: [1.5, 3, 5, 1], colorEnd: [0.3, 1, 2.5, 0.3], size: 0.07, grow: 0.5, spread, up: spread * 0.6, life: 0.9, jitter: 0.2 });
function extinguishNear(p, r) { let n = 0; for (const b of fire.burnables) if (!b.permanent && b.state === 'burning' && E.vec3.dist(p, b.position) < r + b.radius) { fire.extinguish(b); n++; } return n; }
function addSpike(p, h = 2.8, delay = 0, width = 0.8) {
  const m = new E.Mesh(shardGeo, ICE_SHARD, 'Ice spike'); m.castShadow = false; m.visible = false; m.position.set([p[0], 0, p[2]]); scene.add(m);
  pspikes.push({ m, p: [...p], t: -delay, h, w: width, hit: false });
}
function updateSpikes(dt) {
  for (let i = pspikes.length - 1; i >= 0; i--) {
    const s = pspikes[i]; s.t += dt; if (s.t < 0) continue;
    s.m.visible = true; const k = s.t, hh = k < 0.12 ? s.h * (k / 0.12) : k < 0.9 ? s.h : s.h * Math.max(0.02, 1 - (k - 0.9) / 0.3);
    s.m.scale.set([s.w, Math.max(0.02, hh), s.w]); s.m.position.set([s.p[0], hh / 2, s.p[2]]);
    if (!s.hit) { s.hit = true; destruct.damage([s.p[0], 0.8, s.p[2]], 1.8, 50); world.explode([s.p[0], 0.2, s.p[2]], 2.2, 4); extinguishNear(s.p, 1.6); mist([s.p[0], 0.3, s.p[2]], 4, 0.4, 1.5, 0.6); glint([s.p[0], 0.4, s.p[2]], 6, 2); }
    if (s.t > 1.25) { scene.remove(s.m); pspikes.splice(i, 1); }
  }
}
function iceBlast(p, radius = 2.6, power = 9) {
  const out = extinguishNear(p, radius), broke = destruct.damage(p, radius * 1.7, power * 8);
  world.explode(p, radius * 1.6, power * 0.8);
  mist(p, 16, 0.6, 3, 1.2); glint(p, 34, 5);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + Math.random(); addSpike([p[0] + Math.sin(a) * radius * 0.6, 0, p[2] + Math.cos(a) * radius * 0.6], 1.2 + Math.random() * 1.2, Math.random() * 0.1, 0.45); }
  flash.color = '#8fd8ff'; flash.position.set([p[0], p[1] + 0.4, p[2]]); S.boom = 0.7; flash.range = 10;
  const d = Math.hypot(p[0] - cc.position[0], p[2] - cc.position[2]); S.shake = Math.max(S.shake, Math.min(1, 5 / (d + 2)) * 0.35);
  sfx.ice(1.2);
  if (out) feed(`Extinguished ${out} fire${out > 1 ? 's' : ''}`);
  if (broke) feed(broke > 1 ? `${broke} things shattered` : 'Shattered!');
}
function iceNova() {
  const p = [cc.position[0], 0.05, cc.position[2]];
  for (const r of [2.2, 4.4, 6.6]) for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + r; addSpike([p[0] + Math.sin(a) * r, 0, p[2] + Math.cos(a) * r], 1.6 + r * 0.25, r * 0.06, 0.6); }
  for (let i = 0; i < 90; i++) { const a = (i / 90) * Math.PI * 2; fire.smoke.emit(p, { count: 1, color: [0.85, 0.94, 1, 0.55], colorEnd: [0.9, 0.97, 1, 0.05], size: 0.5, grow: 3, spread: 0.1, up: 0.2, vel: [Math.sin(a) * 10, 0, Math.cos(a) * 10], buoyancy: 0.1, life: 0.8, jitter: 0.1 }); }
  glint(p, 80, 8); const out = extinguishNear(p, 8);
  world.explode([p[0], 0.2, p[2]], 8, 12); destruct.damage([p[0], 0.6, p[2]], 8, 100);
  flash.color = '#8fd8ff'; flash.position.set([p[0], 1, p[2]]); S.boom = 1; flash.range = 22; S.shake = 0.8; sfx.ice(1.6); feed(out ? `Frost nova! ${out} fire${out > 1 ? 's' : ''} out` : 'Frost nova!');
}
function iceSpikeLine() { // the 'phoenix' slot: a line of spikes erupts along the ground toward the crosshair
  const d = norm([Math.sin(S.yaw), 0, Math.cos(S.yaw)]);
  for (let i = 0; i < 14; i++) { const r = 2.5 + i * 1.5; addSpike([cc.position[0] + d[0] * r, 0, cc.position[2] + d[2] * r], 2.2 + i * 0.12, i * 0.07, 0.75 + i * 0.03); }
  sfx.ice(1.4); feed('Glacier Spikes');
}
function iceWall() { // the 'wall' slot: a row of ice blocks that you can also shatter
  const d = norm([Math.sin(S.yaw), 0, Math.cos(S.yaw)]), side = [d[2], 0, -d[0]], yaw = (S.yaw * 180) / Math.PI;
  for (let i = -2; i <= 2; i++) {
    const c = [cc.position[0] + d[0] * 4.5 + side[0] * i * 2.2, 1.4, cc.position[2] + d[2] * 4.5 + side[1] * 0 + side[2] * i * 2.2];
    const node = new E.Mesh(E.box({ width: 2.2, height: 2.8, depth: 1, bevel: 0.12, bevelSegments: 1 }), ICE_MAT, 'Ice block'); node.position.set(c); node.setEuler(0, yaw, 0); scene.add(node);
    const body = world.add(new E.Body({ shape: new E.Box([1.1, 1.4, 0.5]), type: 'static', position: c, rotation: E.quat.fromEuler(E.quat.create(), 0, yaw, 0) })); body.userData.kind = 'static';
    destruct.add({ node, body, hp: 90, size: [2.2, 2.8, 1], grid: [2, 3, 1], material: ICE_MAT, center: [...c], name: 'Ice block' });
    mist([c[0], 0.3, c[2]], 6, 0.6, 1.5, 0.8); glint([c[0], 1, c[2]], 8, 3);
  }
  sfx.ice(1.3); feed('Ice Wall');
}

// ---------------------------------------------------------------- Titan form (Ice Mage transformation)
// X turns the Ice Mage into the Ice Colossus for a while: a cocoon of ice, then a seven-metre body
// (scaled to half size for the player) with a ground smash, a boulder throw, a frost breath and a
// charge that flattens whatever it hits.
const TITAN_COST = 60, TITAN_LIFE = 24, TITAN_SCALE = 0.55;
function toggleTitan() {
  if (S.titan) { if (S.titan.morph >= 1.7) endTitan(); return; }
  if (level !== 'glade' || S.frozen || S.dead) return;
  if (el() !== 'ice') { feed('Only the Ice Mage can transform'); return; }
  if (S.mana < TITAN_COST) { feed(`Need ${TITAN_COST} frost to transform`); return; }
  S.mana -= TITAN_COST;
  const c = createColossus(); c.root.visible = false; scene.add(c.root);
  const cocoon = new E.Mesh(E.sphere({ radius: 1, widthSegments: 20, heightSegments: 14 }), ICE_MAT, 'Cocoon'); scene.add(cocoon);
  const orbit = []; for (let i = 0; i < 14; i++) { const m = new E.Mesh(shardGeo, ICE_SHARD, 'Orbit shard'); m.castShadow = false; m.scale.set([0.16, 0.8, 0.16]); scene.add(m); orbit.push({ m, a: (i / 14) * Math.PI * 2, h: 0.3 + (i % 4) * 0.5 }); }
  S.titan = { c, cocoon, orbit, morph: 0, life: TITAN_LIFE, anim: null, grow: 0, tick: 0, time: 0 };
  S.frozen = true; sfx.roar(); hud.banner('TRANSFORM'); feed('The Ice Mage becomes the Colossus');
}
function endTitan() {
  const t = S.titan; if (!t) return;
  const p = [cc.position[0], 2, cc.position[2]]; mist(p, 30, 1.2, 5, 1.5); glint(p, 60, 7); sfx.ice(1.6); S.shake = Math.max(S.shake, 0.6);
  scene.remove(t.c.root); if (t.cocoon.parent) scene.remove(t.cocoon); for (const o of t.orbit) scene.remove(o.m);
  mage.visible = true; S.titan = null; S.frozen = false; S.dashT = 0; feed('Back to the Ice Mage');
}
function titanFwd() { return [Math.sin(S.face), 0, Math.cos(S.face)]; }
function titanSmash() { const t = S.titan; if (!t || t.anim || S.cooldown > 0 || t.morph < 1.7) return; t.anim = { name: 'smash', t: 0, done: false }; S.cooldown = 1.1; S.face = S.yaw; }
function titanBoulder() { const t = S.titan; if (!t || t.anim || S.cooldown > 0 || t.morph < 1.7) return; t.anim = { name: 'boulder', t: 0, done: false }; S.cooldown = 1.6; S.face = S.yaw; }
function titanCharge() { if (S.dashCd > 0 || !S.titan || S.titan.morph < 1.7) return; const f = titanFwd(); S.dashDir = f; S.dashT = 0.7; S.dashCd = 1.8; S.face = S.yaw; sfx.roar(); }
function titanImpact() {
  const f = titanFwd(), p = [cc.position[0] + f[0] * 5, 0.05, cc.position[2] + f[2] * 5];
  for (const r of [2.5, 5.5, 8.5]) for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + r; addSpike([p[0] + Math.sin(a) * r, 0, p[2] + Math.cos(a) * r], 1.8 + r * 0.2, r * 0.05, 0.7); }
  for (let i = 0; i < 100; i++) { const a = (i / 100) * Math.PI * 2; fire.smoke.emit(p, { count: 1, color: [0.85, 0.94, 1, 0.55], colorEnd: [0.9, 0.97, 1, 0.05], size: 0.6, grow: 3, spread: 0.1, up: 0.2, vel: [Math.sin(a) * 11, 0, Math.cos(a) * 11], buoyancy: 0.1, life: 0.9, jitter: 0.1 }); }
  glint(p, 90, 9); const out = extinguishNear(p, 10);
  world.explode([p[0], 0.2, p[2]], 11, 16); const broke = destruct.damage([p[0], 0.8, p[2]], 10, 170);
  flash.color = '#8fd8ff'; flash.position.set([p[0], 1, p[2]]); S.boom = 1; flash.range = 24; S.shake = 1; sfx.boom(1.5); sfx.ice(1.4);
  if (out) feed(`${out} fire${out > 1 ? 's' : ''} out`); if (broke) feed(`${broke} thing${broke > 1 ? 's' : ''} shattered`);
}
function titanThrow() {
  const t = S.titan, from = [cc.position[0], 4.2, cc.position[2]], to = aimPoint(); to[1] = 0;
  const m = new E.Mesh(E.sphere({ radius: 1.2, widthSegments: 16, heightSegments: 12 }), ICE_MAT, 'Boulder'); scene.add(m);
  titanBoulders.push({ m, from, to, t: 0, dur: 1.1 }); sfx.whoosh(1.2); void t;
}
function updateTitan(dt) {
  const t = S.titan; if (!t) return;
  t.time += dt; const c = t.c, p = cc.position;
  if (t.morph < 1.7) { // cocoon closes, shards orbit, then the Colossus tears out
    t.morph += dt; const k = Math.min(1, t.morph / 1.2);
    t.cocoon.position.set([p[0], 1.0, p[2]]); const cs = 0.5 + k * 2.4; t.cocoon.scale.set([cs, cs * 1.4, cs]);
    t.orbit.forEach((o, i) => { const a = o.a + t.morph * (3 + k * 6), r = 1.3 + k; o.m.position.set([p[0] + Math.sin(a) * r, o.h + k * 1.6, p[2] + Math.cos(a) * r]); o.m.setEuler(0, (a * 180) / Math.PI, 20); });
    S.shake = Math.max(S.shake, 0.2 + 0.4 * k);
    if (Math.random() < 0.5) mist([p[0] + (Math.random() - 0.5) * 3, 0.3, p[2] + (Math.random() - 0.5) * 3], 3, 0.6, 2, 1);
    if (t.morph >= 1.7) {
      scene.remove(t.cocoon); for (const o of t.orbit) scene.remove(o.m); t.orbit = [];
      mage.visible = false; c.root.visible = true; S.frozen = false; S.dashT = 0;
      mist([p[0], 2, p[2]], 40, 1.4, 6, 1.5); glint([p[0], 2, p[2]], 80, 9); destruct.burst([p[0], 2, p[2]], 0.3, ICE_MAT, { count: 26, power: 9, from: [p[0], 0.5, p[2]] });
      const out = extinguishNear([p[0], 1, p[2]], 6); void out; destruct.damage([p[0], 1, p[2]], 6, 90); world.explode([p[0], 0.5, p[2]], 8, 12);
      S.shake = 1; sfx.boom(1.5); sfx.roar(); hud.banner('ICE COLOSSUS');
    }
    return;
  }
  t.life -= dt; if (t.life <= 0) { endTitan(); return; }
  t.grow = Math.min(1, t.grow + dt / 0.7); const sc = TITAN_SCALE * (0.35 + 0.65 * (1 - (1 - t.grow) * (1 - t.grow)));
  c.root.scale.set([sc, sc, sc]); c.root.position.set([p[0], p[1], p[2]]); c.root.rotation.set(E.quat.fromEuler(E.quat.create(), 0, (S.face * 180) / Math.PI, 0));
  const st = c.st; st.walk += dt * S.moving * 1.05; st.amp += (Math.min(1, S.moving / 3) - st.amp) * Math.min(1, dt * 8);
  // arm choreography for the two attacks; idle arms otherwise
  const a = t.anim; let rx = 0, rz = 0, el2 = 0, lean = 0;
  if (a) {
    a.t += dt;
    if (a.name === 'smash') { const up = Math.min(1, a.t / 0.42), down = a.t < 0.42 ? 0 : Math.min(1, (a.t - 0.42) / 0.12); rx = -165 * up * (1 - down) - 22 * down; el2 = 30 * (1 - down); rz = 8; lean = 14 * down; if (a.t >= 0.54 && !a.done) { a.done = true; titanImpact(); } if (a.t > 1.1) t.anim = null; }
    else { const up = Math.min(1, a.t / 0.5), thr = a.t < 0.5 ? 0 : Math.min(1, (a.t - 0.5) / 0.14); rx = -150 * up * (1 - thr) - 35 * thr; el2 = 60 * (1 - thr) + 10; rz = 18; lean = -8 * up + 20 * thr; if (a.t >= 0.56 && !a.done) { a.done = true; titanThrow(); } if (a.t > 1.2) t.anim = null; }
  }
  st.armR = [rx, rz]; st.armL = [rx, rz]; st.elbowR = el2; st.elbowL = el2; st.lean = S.dashT > 0 ? 20 : lean; st.crouch = S.dashT > 0 ? 0.5 : 0; st.headPitch = S.breathing ? -18 : 0;
  c.pose(t.time);
  if (S.dashT > 0) { // the charge flattens what it hits
    t.tick -= dt; const f = titanFwd();
    if (t.tick <= 0) { t.tick = 0.06; const q = [p[0] + f[0] * 2.4, 1.2, p[2] + f[2] * 2.4]; destruct.damage(q, 3.6, 95); world.explode(q, 3.6, 3); extinguishNear(q, 3); mist([p[0], 0.4, p[2]], 4, 0.8, 2, 0.5); }
    S.shake = Math.max(S.shake, 0.25);
  }
  for (let i = titanBoulders.length - 1; i >= 0; i--) {
    const b = titanBoulders[i]; b.t += dt; const k = Math.min(1, b.t / b.dur);
    b.m.position.set([E.lerp(b.from[0], b.to[0], k), E.lerp(b.from[1], 1.2, k) + Math.sin(k * Math.PI) * 7, E.lerp(b.from[2], b.to[2], k)]); b.m.setEuler(k * 380, k * 250, 0); mist(b.m.position, 1, 0.5, 0.4, 0.1);
    if (k >= 1) { iceBlast(b.to, 5, 26); for (let n = 0; n < 8; n++) { const ang = (n / 8) * Math.PI * 2; addSpike([b.to[0] + Math.sin(ang) * 3.5, 0, b.to[2] + Math.cos(ang) * 3.5], 2, n * 0.03, 0.7); } S.shake = Math.max(S.shake, 0.8); sfx.boom(1.2); scene.remove(b.m); titanBoulders.splice(i, 1); }
  }
}

function onMageEvent(e) {
  if (e.name === 'fireball') launchFireball();
  if (e.name === 'slam') nova();
  if (e.name === 'phoenix') launchPhoenix();
  if (e.name === 'meteors') launchMeteors();
  if (e.name === 'wall') launchWall();
  if (e.name === 'footstep' && cc.grounded && S.moving > 1.2 && Math.random() < 0.5) sfx.thump();
}

// ---------------------------------------------------------------- spread (glade only)
function spawnPatch(p, gen = 0) {
  if (level !== 'glade' || patches.length >= 60 || Math.abs(p[0]) > 60 || Math.abs(p[2]) > 60) return null;
  for (const q of patches) if (Math.hypot(q.position[0] - p[0], q.position[2] - p[2]) < 0.9) return null;
  const b = fire.add([p[0], 0.1, p[2]], { radius: 0.55, fuel: 6 + Math.random() * 3, flammability: 1.6, ignition: 0.5, height: 0.6, char: false });
  b.userData = { name: 'Grass', patch: true, gen }; patches.push(b); fire.ignite(b, 0.3); return b;
}
let spreadT = 0;
function updateSpread(dt) {
  const wind = fire.wind;
  spreadT -= dt;
  if (spreadT <= 0) {
    spreadT = 0.35;
    for (const b of fire.burning) {
      if (b.permanent) continue;
      const u = b.userData || {}, gen = u.patch ? u.gen : 0;
      if (u.patch && (gen >= 3 || Math.random() > 0.14)) continue;
      if (!u.patch && Math.random() > 0.5 * Math.min(1, b.fire + 0.2)) continue;
      const a = Math.random() * Math.PI * 2, r = b.radius * 0.9 + 0.8 + Math.random() * 1.6;
      spawnPatch([b.position[0] + Math.sin(a) * r + wind[0] * 1.2, 0, b.position[2] + Math.cos(a) * r + wind[2] * 1.2], gen + 1);
    }
    for (const b of fire.burning) { // embers: a burning thing spits a spark that lands downwind and lights what it hits
      if (b.permanent || b.userData?.patch || b.fire < 0.5 || Math.random() > 0.22) continue;
      const d = 3 + Math.random() * 7, a = Math.atan2(wind[0], wind[2]) + (Math.random() - 0.5) * 1.6;
      embers.push({ from: [b.position[0], b.position[1] + b.height * 0.6, b.position[2]], to: [b.position[0] + Math.sin(a) * d, 0.2, b.position[2] + Math.cos(a) * d], t: 0, dur: 0.9 + d * 0.12 });
    }
  }
  for (let i = embers.length - 1; i >= 0; i--) {
    const e = embers[i]; e.t += dt; const k = Math.min(1, e.t / e.dur);
    const p = [e.from[0] + (e.to[0] - e.from[0]) * k, e.from[1] + (e.to[1] - e.from[1]) * k + Math.sin(k * Math.PI) * 2.5, e.from[2] + (e.to[2] - e.from[2]) * k];
    sparks.emit(p, { count: 1, color: [8, 4, 1, 1], colorEnd: [3, 0.5, 0.05, 0.3], size: 0.06, grow: 0.5, spread: 0.1, up: 0.1, life: 0.4, jitter: 0.02 });
    if (k >= 1) { embers.splice(i, 1); if (fire.igniteAt(e.to, 0.6) === 0 && Math.random() < 0.6) spawnPatch(e.to, 2); }
  }
}
// burning things shrink and sag as their fuel goes and glow like embers through the char
function updateBurnVisuals() {
  const t = fire.time;
  for (const b of fire.burnables) {
    const n = b.node; if (!n || b.permanent) continue;
    const u = b.userData || {};
    if (!baseScale.has(b)) baseScale.set(b, [...n.scale]);
    if (b.state === 'burning' || b.state === 'burnt') {
      const k = b.fuel === Infinity ? 1 : E.clamp(b.fuel / b.maxFuel, 0, 1);
      if (u.collapse || u.prop) { const sc = baseScale.get(b), y = 0.45 + 0.55 * Math.sqrt(k), xz = 0.8 + 0.2 * k; n.scale.set([sc[0] * xz, sc[1] * y, sc[2] * xz]); }
    }
    if (b.mats && b.state === 'burning') {
      const glow = b.fire * b.charred * (0.7 + 0.3 * Math.sin(t * 9 + b.id * 1.7) + 0.2 * Math.sin(t * 23 + b.id));
      for (const { m } of b.mats) { m.emissive = '#ff4a10'; m.emissiveStrength = Math.max(0, glow) * 2.6; }
    }
  }
}
function hookFire() {
  fire.onIgnite = (b) => {
    if (b.userData?.name && !b.permanent) sfx.whoosh(0.5);
    if (b.userData?.explosive && !b.userData.armed) { b.userData.armed = true; explosives.push({ b, t: 1.4 + Math.random() * 0.8 }); }
  };
  fire.onBurntOut = (b) => {
    const u = b.userData || {};
    if (u.patch) { fire.remove(b); patches.splice(patches.indexOf(b), 1); return; }
    if (u.prop) { world.remove(u.prop.body); scene.remove(u.prop.node); glade.props.splice(glade.props.indexOf(u.prop), 1); fire.remove(b); S.hitCount++; }
    else if (u.collapse && u.node) { scene.remove(u.node); u.node.parent?.remove(u.node); fire.remove(b); S.hitCount++; }
    else if (u.name) { S.hitCount++; feed(`${u.name} burnt out`); }
  };
}
function updateExplosives(dt) { // a burning barrel goes off: a blast that shatters what's around it
  for (let i = explosives.length - 1; i >= 0; i--) {
    const e = explosives[i]; e.t -= dt;
    if (e.t <= 0) {
      explosives.splice(i, 1); const u = e.b.userData.prop; if (!u || !glade.props.includes(u)) continue;
      const p = [...u.body.position]; world.remove(u.body); scene.remove(u.node); glade.props.splice(glade.props.indexOf(u), 1); fire.remove(e.b);
      explode(p, null, 4.2, 22, 0); feed('A barrel exploded!'); S.hitCount++;
    }
  }
}

// ---------------------------------------------------------------- level loading
const hud = {
  show(b) { document.body.classList.toggle('hudhidden', !b); },
  boss(b) { const f = $('bossFill'); f.style.width = (b.hp / b.maxHp) * 100 + '%'; $('bossName').textContent = b.phase === 1 ? 'ICE MAGE' : 'ICE COLOSSUS'; document.body.classList.toggle('phase2', b.phase === 2); },
  banner(t) { const el = $('banner'); el.textContent = t; el.hidden = false; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); setTimeout(() => { el.hidden = true; }, 2400); },
};
const G = {
  get scene() { return scene; }, get world() { return world; }, get fire() { return fire; }, get sparks() { return sparks; }, get destruct() { return destruct; },
  sfx, feed, hud, player, cutscene, ray,
  shake: (a) => { S.shake = Math.max(S.shake, a); },
  onVictory: victory,
};
function loadLevel(kind, { skipIntro = false } = {}) {
  level = kind;
  fireballs.length = 0; pspikes.length = 0; titanBoulders = []; S.titan = null; meteors.length = 0; walls.length = 0; patches.length = 0; embers.length = 0; explosives.length = 0; baseScale.clear(); phoenix = null;
  scene = new E.Scene(); env = scene.environment; world = new E.PhysicsWorld({ iterations: 8 });
  const boss1 = kind === 'boss';
  fire = new E.FireSystem(scene, { maxLights: 8, maxFlames: 5000, maxSmoke: 3500, wind: boss1 ? [0.6, 0, 0.3] : [0.5, 0, 0.15] });
  sparks = new E.Particles(2500, { additive: true }); sparks.gravity = -3.5; sparks.drag = 0.9;
  snow = null; destruct = new Destructibles(scene, world); glade = arena = boss = null;
  cutscene.active = false; cutscene.gen = null; document.body.classList.remove('cutscene'); $('subtitle').hidden = true; $('titlecard').hidden = true;
  if (boss1) {
    arena = buildArena(scene, world, fire);
    for (const d of arena.destructibles) destruct.add(d);
    E.applyTimeOfDay(env, 19.8); env.fogDensity = 0.011; env.shadowRadius = 26; env.shadowFar = 120; env.fogHeight = 0.3;
    snow = new E.Particles(1600); snow.gravity = 0; snow.drag = 0.05;
    cc = new E.CharacterController(world, { position: arena.playerStart, radius: 0.34, height: 1.8, mask: 0xffff & ~DEBRIS_GROUP });
  } else {
    glade = buildGlade(scene, world, fire);
    for (const d of glade.destructibles) destruct.add(d);
    E.applyTimeOfDay(env, TIMES[timeIdx]); env.fogDensity = 0.006; env.shadowRadius = 22; env.shadowFar = 110; env.fogHeight = 0.2;
    cc = new E.CharacterController(world, { position: [0, 0.15, -5.5], radius: 0.34, height: 1.8, mask: 0xffff & ~DEBRIS_GROUP });
  }
  cc.body.userData.player = true;
  pickChar(kind === 'boss' ? 'fire' : S.element); scene.add(mage);
  handLight = new E.Light('point', { color: el() === 'ice' ? '#7fd6ff' : '#ff8a3a', intensity: 2, range: 5, flicker: 0.6 }); scene.add(handLight);
  flash = new E.Light('point', { color: boss1 ? '#ffb266' : '#ffb266', intensity: 0, range: 18 }); scene.add(flash);
  hookFire();
  Object.assign(S, { hp: S.maxHp, mana: S.maxMana, dead: false, ended: false, frozen: false, puppet: null, invuln: 0, dashT: 0, dashCd: 0, chill: 0, castT: 0, slamT: 0, cooldown: 0, breathing: false, shake: 0, yaw: boss1 ? 0 : 0, pitch: -0.15, face: 0, hitCount: 0 });
  mage.mixer.stop(); mage.play('Idle', { fade: 0 }); cast.setWeights({}, 0); full.setWeights({}, 0);
  $('resLabel').textContent = el() === 'ice' ? 'Frost' : 'Ember'; $('resHint').textContent = el() === 'ice' ? 'refill at a brazier' : 'refill at a brazier';
  document.body.classList.toggle('boss-level', boss1); $('endcard').hidden = true; $('banner').hidden = true; hud.show(true);
  if (boss1) {
    boss = new IceBoss(G); G.boss = boss;
    if (skipIntro) { boss.skipToFight(); boss.active = true; boss.hidden = false; boss.mage.visible = true; boss.wait = 1.2; hud.boss(boss); hud.banner('ICE MAGE'); }
    else if (S.started) boss.beginIntro();
    hud.boss(boss);
  }
}

// ---------------------------------------------------------------- player + camera
function updatePlayer(dt) {
  const k = input.keys;
  const f = [Math.sin(S.yaw), 0, Math.cos(S.yaw)], l = [Math.cos(S.yaw), 0, -Math.sin(S.yaw)];
  let wx = 0, wz = 0;
  const live = !S.frozen && !S.dead;
  if (live) {
    if (k.has('w')) { wx += f[0]; wz += f[2]; } if (k.has('s')) { wx -= f[0]; wz -= f[2]; }
    if (k.has('a')) { wx += l[0]; wz += l[2]; } if (k.has('d')) { wx -= l[0]; wz -= l[2]; }
  }
  const sm = live ? Math.hypot(input.stick.x, input.stick.y) : 0;
  if (sm > 0.08) { const fx = -input.stick.y, sx = input.stick.x; wx += f[0] * fx - l[0] * sx; wz += f[2] * fx - l[2] * sx; }
  const len = Math.hypot(wx, wz);
  const casting = S.castT > 0 || S.breathing || S.slamT > 0;
  const slow = S.chill > 0 ? 0.62 : 1;
  const top = (S.titan ? 0.9 : 1) * (S.walk || (sm > 0.08 && sm < 0.5) ? 1.9 : 5.0) * (S.slamT > 0 ? 0 : S.breathing ? 0.45 : S.castT > 0 ? 0.7 : 1) * slow;
  if (len > 0) { wx /= len; wz /= len; }
  if (S.puppet) { cc.position = [...S.puppet.p]; cc.velocity = [0, 0, 0]; S.moving += (S.puppet.speed - S.moving) * Math.min(1, dt * 10); S.face = S.puppet.yaw; cc.move([0, 0], dt); cc.position[0] = S.puppet.p[0]; cc.position[2] = S.puppet.p[2]; }
  else if (S.dashT > 0) { cc.velocity[0] = S.dashDir[0] * 17; cc.velocity[2] = S.dashDir[2] * 17; cc.move([S.dashDir[0] * 17, S.dashDir[2] * 17], dt); S.moving = 5; }
  else { cc.move([wx * top, wz * top], dt); }
  if (!S.puppet && live && k.has(' ') && cc.grounded && S.dashT <= 0) { cc.jump(6.4); mage.mixer.play('Jump', { fade: 0.08, restart: true }); }
  if (cc.position[1] < -5) { cc.position = [0, 1, level === 'boss' ? -16 : -5.5]; cc.velocity = [0, 0, 0]; }
  if (level === 'boss') { const r = Math.hypot(cc.position[0], cc.position[2]); if (r > 25) { cc.position[0] *= 25 / r; cc.position[2] *= 25 / r; } }
  const hv = Math.hypot(cc.velocity[0], cc.velocity[2]);
  if (!S.puppet) S.moving += (hv - S.moving) * Math.min(1, dt * 12);
  if (!S.puppet) {
    let target = S.face;
    if (S.dashT > 0) target = Math.atan2(S.dashDir[0], S.dashDir[2]); else if (casting) target = S.yaw; else if (len > 0 && hv > 0.3) target = Math.atan2(cc.velocity[0], cc.velocity[2]);
    let d = target - S.face; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
    S.face += d * Math.min(1, dt * (casting ? 14 : 9));
  }
  mage.position.set([cc.position[0], cc.position[1], cc.position[2]]);
  mage.setEuler(0, (S.face * 180) / Math.PI, 0);
  const airborne = !cc.grounded && cc.position[1] > 0.35 && !S.puppet;
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
  const s = S.shake * S.shake * 0.5;
  if (cutscene.active) {
    const r = cutscene.result;
    camera.position.set([r.pos[0] + (Math.random() - 0.5) * s, r.pos[1] + (Math.random() - 0.5) * s, r.pos[2] + (Math.random() - 0.5) * s]); camera.target.set(r.target); camera.up.set([0, 1, 0]); camera.fov = 58 * E.DEG;
    env.shadowCenter = [r.target[0], 1, r.target[2]]; return;
  }
  if (!S.started) { const a = performance.now() / 9000; const r = level === 'boss' ? 30 : 14; camera.position.set([Math.sin(a) * r, level === 'boss' ? 12 : 4.5, Math.cos(a) * r - 4]); camera.target.set([0, 2, level === 'boss' ? 2 : -3]); camera.up.set([0, 1, 0]); camera.fov = 62 * E.DEG; env.shadowCenter = [0, 1, 0]; return; }
  const aiming = input.rmb || S.castT > 0;
  S.dist += (((aiming ? 3.3 : 4.8) + (level === 'boss' && boss?.phase === 2 ? 2.2 : 0) + (S.titan ? 4.5 : 0)) - S.dist) * Math.min(1, dt * 6);
  const f = fwd(), right = [-Math.cos(S.yaw), 0, Math.sin(S.yaw)];
  const anchor = madd(head(), right, aiming ? 0.7 : 0.35); if (S.titan) anchor[1] += 1.7;
  let dist = S.dist;
  const back = norm([-f[0], -f[1], -f[2]]);
  const hit = ray(anchor, back, dist + 0.3);
  if (hit) dist = Math.max(0.6, hit.distance - 0.3);
  const pos = madd(anchor, back, dist);
  pos[0] += (Math.random() - 0.5) * s; pos[1] += (Math.random() - 0.5) * s; pos[2] += (Math.random() - 0.5) * s;
  pos[1] = Math.max(pos[1], 0.25);
  camera.position.set(pos); camera.target.set(madd(pos, f, 10)); camera.up.set([0, 1, 0]);
  camera.fov = (aiming ? 58 : 66) * E.DEG;
  env.shadowCenter = [cc.position[0] + f[0] * 5, 1, cc.position[2] + f[2] * 5];
}
function updateAura(dt) {
  const power = S.mana / S.maxMana;
  const dashing = S.dashT > 0;
  const iceAura = el() === 'ice';
  if (iceAura) for (const h of [handR(), handL()]) { if (Math.random() < dt * 20) mist(h, 1, 0.12, 0.2, 0.3); if (Math.random() < dt * 9) glint(h, 1, 0.5); }
  else for (const h of [handR(), handL()]) {
    if (Math.random() < dt * (24 + 30 * power)) fire.flames.emit(h, { count: 1, color: [3.4, 2, 0.6, 0.5], colorEnd: [1, 0.15, 0.03, 0.15], size: 0.075 + 0.05 * power, grow: 0.6, spread: 0.12, up: 0.5, buoyancy: 1.6, life: 0.55, jitter: 0.03 });
    if (Math.random() < dt * 4) sparks.emit(h, { count: 1, color: [6, 3.6, 1, 1], colorEnd: [2, 0.3, 0.05, 0.3], size: 0.03, grow: 0.5, spread: 0.3, up: 0.9, life: 1, jitter: 0.03 });
  }
  if (!iceAura && Math.random() < dt * 6) fire.flames.emit(bonePoint(mage, 'shoulder.L', [0, 0, 0]), { count: 1, color: [3, 1.6, 0.4, 0.35], colorEnd: [1, 0.1, 0.02, 0.1], size: 0.05, grow: 0.5, spread: 0.05, up: 0.5, buoyancy: 1.8, life: 0.6, jitter: 0.02 });
  if (dashing) { // Flame Dash leaves a burning trail and singes what it passes through
    const p = [cc.position[0], cc.position[1] + 0.5, cc.position[2]];
    if (el() === 'ice') { mist(p, 3, 0.5, 0.6, 0.3); glint(p, 4, 1.5); extinguishNear(p, 1.4); }
    else { fire.flames.emit(p, { count: 5, color: [3.6, 2, 0.6, 0.6], colorEnd: [1, 0.12, 0.03, 0.2], size: 0.45, grow: 1.2, spread: 0.5, up: 0.6, buoyancy: 1.8, life: 0.5, jitter: 0.25 });
    fire.igniteAt(p, 1.2); }
    if (bossOn() && !S.dashHit && boss.hits(p, 1.2)) { S.dashHit = true; boss.hurt(22, p); feed('Flame Dash hit!'); }
  } else S.dashHit = false;
  handLight.position.set(handR());
  handLight.intensity = (1.5 + 2 * power) * (S.breathing ? 2.5 : 1);
}
function updateSnow(dt) {
  if (!snow) return;
  const c = camera.position;
  for (let i = 0; i < 12; i++) snow.emit([c[0] + (Math.random() - 0.5) * 60, c[1] + 10 + Math.random() * 8, c[2] + (Math.random() - 0.5) * 60], { count: 1, color: [0.95, 0.97, 1, 0.75], colorEnd: [0.95, 0.97, 1, 0.75], size: 0.06 + Math.random() * 0.05, grow: 1, spread: 0.6, up: 0, vel: [1.6, -2.4 - Math.random(), 0.7], buoyancy: 0, life: 8, jitter: 0 });
  snow.update(dt);
}

// ---------------------------------------------------------------- input
const canvas = $('stage');
let locked = false;
const look = (dx, dy) => { if (cutscene.active) return; S.yaw -= dx * 0.0026; S.pitch = E.clamp(S.pitch - dy * 0.0026, -1.15, 0.9); };
document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === canvas; if (S.started && !S.ended) $('menu').hidden = locked; if (locked) $('resume').hidden = true; else if (S.started && !S.ended) $('resume').hidden = false; });
document.addEventListener('mousemove', (e) => { if (locked) look(e.movementX, e.movementY); else if (e.buttons & 4) look(e.movementX, e.movementY); });
canvas.addEventListener('mousedown', (e) => {
  if (!S.started) return; sfx.unlock();
  if (!locked && canvas.requestPointerLock && !S.ended) { try { canvas.requestPointerLock(); } catch { /* drag to look instead */ } }
  if (e.button === 0) { input.lmb = true; throwFireball(); }
  if (e.button === 2) input.rmb = true;
});
window.addEventListener('mouseup', (e) => { if (e.button === 0) input.lmb = false; if (e.button === 2) input.rmb = false; });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
window.addEventListener('keydown', (e) => {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (['w', 'a', 's', 'd', ' '].includes(key)) { input.keys.add(key); e.preventDefault(); }
  if (e.repeat) return;
  if (key === 'Enter' && cutscene.active) skipCutscene();
  if (key === 'Shift') dash();
  if (key === 'q') { S.walk = !S.walk; feed(S.walk ? 'Walking' : 'Running'); }
  if (key === 'e') slam();
  if (key === 'x') toggleTitan();
  if (key === 'f') summonPhoenix();
  if (key === 'g') castMeteors();
  if (key === 'v') castWall();
  if (key === 'r' && level === 'glade') resetGlade();
  if (key === 't' && level === 'glade') { timeIdx = (timeIdx + 1) % TIMES.length; E.applyTimeOfDay(env, TIMES[timeIdx]); env.fogDensity = 0.006; env.shadowRadius = 22; env.shadowFar = 110; env.fogHeight = 0.2; feed(['Dusk', 'Night', 'Noon'][timeIdx]); }
  if (key === 'h') $('help').hidden = !$('help').hidden;
});
window.addEventListener('keyup', (e) => { const key = e.key.length === 1 ? e.key.toLowerCase() : e.key; input.keys.delete(key); });
window.addEventListener('blur', () => { input.keys.clear(); input.lmb = input.rmb = false; });
canvas.addEventListener('mousemove', (e) => { if (!locked && S.started && (e.buttons & 1) && !(e.buttons & 4)) look(e.movementX, e.movementY); });
function skipCutscene() { cutscene.skip(); boss?.flush(); }
function begin(kind, opts) {
  S.started = true; sfx.unlock(); loadLevel(kind, opts); $('menu').hidden = true; $('resume').hidden = true;
  if (canvas.requestPointerLock) { try { canvas.requestPointerLock(); } catch { /* ignore */ } }
  if (touchMode) $('touch').hidden = false;
  document.body.classList.toggle('level-boss', kind === 'boss');
}
const pick = (element) => { S.element = element; $('pickFire').classList.toggle('sel', element === 'fire'); $('pickIce').classList.toggle('sel', element === 'ice'); if (!S.started) loadLevel('glade'); };
$('pickFire').addEventListener('click', () => pick('fire')); $('pickIce').addEventListener('click', () => pick('ice'));
$('startGlade').addEventListener('click', () => begin('glade'));
$('startBoss').addEventListener('click', () => begin('boss'));
$('resume').addEventListener('click', () => { $('menu').hidden = true; if (canvas.requestPointerLock) { try { canvas.requestPointerLock(); } catch { /* ignore */ } } });
$('retry').addEventListener('click', () => begin('boss', { skipIntro: true }));
$('toMenu').addEventListener('click', () => { S.started = false; $('endcard').hidden = true; $('menu').hidden = false; $('resume').hidden = true; if (touchMode) $('touch').hidden = true; loadLevel('glade'); document.body.classList.remove('level-boss', 'boss-level'); });
$('skip').addEventListener('click', skipCutscene);

function resetGlade() {
  for (const b of [...fire.burnables]) if (!b.permanent) { fire.extinguish(b); b.fuel = b.maxFuel; b.heat = 0; b.fire = 0; b.state = 'fresh'; b.charred = 0; if (b.mats) fire._char(b); }
  loadLevel('glade'); feed('The glade is restored');
}

// ---------------------------------------------------------------- loop
function step(dt) {
  S.invuln = Math.max(0, S.invuln - dt); S.dashT = Math.max(0, S.dashT - dt); S.dashCd = Math.max(0, S.dashCd - dt); S.chill = Math.max(0, S.chill - dt);
  if (S.started) {
    cutscene.update(dt);
    S.cooldown = Math.max(0, S.cooldown - dt); S.castT = Math.max(0, S.castT - dt); S.slamT = Math.max(0, S.slamT - dt);
    if (input.lmb && S.cooldown <= 0) throwFireball();
    const nearBrazier = level === 'glade' ? Math.hypot(cc.position[0], cc.position[2]) < 3.2 : arena.braziers.some(([x, z]) => Math.hypot(cc.position[0] - x, cc.position[2] - z) < 3.2);
    if (!S.breathing && !S.frozen) S.mana = Math.min(S.maxMana, S.mana + dt * (nearBrazier ? 45 : level === 'boss' ? 11 : 7));
    updatePlayer(dt);
    breathe(dt);
    boss?.update(dt);
  } else { S.yaw += dt * 0.15; mage.update(dt); boss?.update(dt); }
  world.step(dt);
  destruct.update(dt);
  updateFireballs(dt); updateMeteors(dt); updateWalls(dt); updateSpikes(dt); updateTitan(dt);
  fire.update(dt, camera);
  if (level === 'glade') { updateSpread(dt); updateBurnVisuals(); updateExplosives(dt); }
  if (phoenix) phoenix.update(dt);
  sparks.update(dt); updateSnow(dt);
  updateAura(dt); updateCamera(dt);
  if (S.boom > 0) { S.boom = Math.max(0, S.boom - dt * 4); flash.intensity = 30 * S.boom * S.boom; }
  S.crackleT -= dt; if (S.crackleT <= 0 && fire.stats.burning > 1) { S.crackleT = 0.35; sfx.crackle(Math.min(0.35, 0.05 * fire.stats.burning)); }
}
let hudT = 0;
function updateHud(dt) {
  hudT += dt; if (hudT < 0.05) return; hudT = 0;
  $('manaFill').style.width = (S.titan && S.titan.morph >= 1.7 ? (S.titan.life / TITAN_LIFE) * 100 : (S.mana / S.maxMana) * 100) + '%';
  $('resLabel').textContent = S.titan ? 'Colossus' : el() === 'ice' ? 'Frost' : 'Ember';
  $('hpFill').style.width = (S.hp / S.maxHp) * 100 + '%';
  document.body.classList.toggle('chilled', S.chill > 0);
  $('burning').textContent = Math.max(0, fire.stats.burning - fire.burnables.filter((b) => b.permanent && b.state === 'burning').length);
  $('burnt').textContent = S.hitCount;
}
let last = performance.now();
function frame(now) {
  const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
  step(dt); render(); updateHud(dt);
  requestAnimationFrame(frame);
}
function render() { renderer.render(scene, camera, { background: 'sky', particles: [...fire.particles, sparks, ...(snow ? [snow] : [])] }); }
loadLevel('glade');
requestAnimationFrame(frame);

window.__mage = {
  S, input, mage, camera, renderer, fireballs, meteors, walls, patches, cutscene,
  get cc() { return cc; }, get world() { return world; }, get fire() { return fire; }, get glade() { return glade; }, get boss() { return boss; }, get destruct() { return destruct; }, get level() { return level; },
  get phoenix() { return phoenix; },
  start(kind = 'glade', opts) { begin(kind, opts); },
  simulate(sec) { for (let t = 0; t < sec; t += 1 / 60) step(1 / 60); render(); },
  toggleTitan, throwFireball, slam, summonPhoenix, castMeteors, castWall, dash, resetGlade, skipCutscene,
  look(yaw, pitch) { S.yaw = yaw; S.pitch = pitch; },
};

// ---------------------------------------------------------------- touch controls
if (touchMode) {
  document.body.classList.add('touch'); $('help').hidden = true;
  $('startGlade').textContent = 'Ember Glade (sandbox)'; $('startBoss').textContent = 'Boss Fight: Ice Mage';
  const stickEl = $('stick'), knob = $('knob'); let sid = null, cx = 0, cy = 0;
  const R = 55;
  const setStick = (e) => { let dx = e.clientX - cx, dy = e.clientY - cy; const m = Math.hypot(dx, dy); if (m > R) { dx = (dx / m) * R; dy = (dy / m) * R; } input.stick.x = dx / R; input.stick.y = dy / R; knob.style.transform = `translate(${dx}px, ${dy}px)`; };
  stickEl.addEventListener('pointerdown', (e) => { e.preventDefault(); sid = e.pointerId; stickEl.setPointerCapture(sid); const r = stickEl.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; setStick(e); sfx.unlock(); });
  stickEl.addEventListener('pointermove', (e) => { if (e.pointerId === sid) setStick(e); });
  const endStick = (e) => { if (e.pointerId !== sid) return; sid = null; input.stick.x = input.stick.y = 0; knob.style.transform = ''; };
  stickEl.addEventListener('pointerup', endStick); stickEl.addEventListener('pointercancel', endStick);
  let lid = null, lx = 0, ly = 0; // drag anywhere else to look around
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
  btn('tSlam', slam); btn('tPhoenix', summonPhoenix); btn('tMeteor', castMeteors); btn('tWall', castWall); btn('tDash', dash); btn('tTitan', toggleTitan);
  btn('tJump', () => input.keys.add(' '), () => input.keys.delete(' '));
  btn('tReset', () => { if (level === 'glade') resetGlade(); });
}
