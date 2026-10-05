// The 3D backdrop of the menus: a warm hangar with an operator posed holding a pistol (main
// menu), or a dark studio with the operator on the right (operator select, operators, locker).
// The operator is the same rigged model used in matches, with the hero level of detail.
import * as E from '../../../engine/index.js';
import { makeSoldier, equipWeapon, poseHold } from '../game/soldier.js';
import { makeWeaponProp } from '../../weapons/index.js';

export class MenuScene {
  constructor(renderer, lib) {
    this.r = renderer; this.lib = lib; this.cam = new E.Camera(); this.cam.near = 0.05; this.cam.far = 120;
    this.hangar = this.buildHangar(); this.studio = this.buildStudio();
    this.mode = 'hangar'; this.hero = null; this.opId = null; this.t = 0; this.yaw = 0; this.targetYaw = 0; this.spin = 0;
    this.gun = 'deagle'; this.pose = { aim: 1 }; this.parallax = [0, 0];
  }
  buildHangar() {
    const scene = new E.Scene(), env = scene.environment, lib = this.lib;
    E.applyTimeOfDay(env, 10.6); env.ambient = 0.45; env.sunIntensity = 1.4; env.fogDensity = 0.012; env.fogColor = [0.55, 0.45, 0.32]; env.shadowRadius = 9; env.shadowFar = 30; env.volumetric = 0; env.exposure = 1.0; env.clouds = false;
    env.sunDirection = E.vec3.normalize([0, 0, 0], [0.55, 0.55, 0.62]); env.sunColor = [1.0, 0.82, 0.58];
    const kit = new E.Kit(E.archPalette());
    const M = (k) => lib.get(k);
    kit.box(M('floor:concrete'), [0, -0.05, 0], [40, 0.1, 40]);
    kit.box(M('wall:metal'), [0, 3.2, -7.5], [30, 7, 0.4]);
    // tall windows with light slats on the back wall
    for (let i = -5; i <= 5; i++) { if (Math.abs(i) < 1) continue; kit.box(M('lamp'), [i * 2.6, 4.4, -7.25], [1.1, 2.2, 0.06]); }
    for (let i = -6; i <= 6; i++) kit.box(M('metalDark'), [i * 2.6 + 1.3, 3.2, -7.2], [0.12, 6.5, 0.15]);
    // steel pillars, crates and lockers
    for (const x of [-6, -3.2, 5.6, 8.2]) { kit.box(M('metalDark'), [x, 3, -6.2], [0.35, 6, 0.35]); kit.box(M('stripe'), [x, 0.5, -6.0], [0.38, 1, 0.38]); }
    kit.box(M('metalDark'), [0, 5.8, -6.2], [26, 0.3, 0.4]);
    for (let i = 0; i < 9; i++) kit.cyl(M('chrome'), [-12 + i * 3, 5.3, -5.6], 0.12, 24, [0, 0, 90], 8);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3 - (i % 2); j++) kit.box(M('crate'), [-5.6 + i * 1.05, 0.45 + j * 0.9, -3.8 + (i % 2) * 0.4], [1, 0.9, 1], [0, i * 11 + j * 7, 0]);
    for (let i = 0; i < 6; i++) kit.box(M(i % 2 ? 'lockerA' : 'lockerB'), [3.6 + i * 0.62, 1, -5.6], [0.6, 2, 0.5]);
    kit.box(M('stairs'), [-8.5, 1.4, -4], [1.2, 2.8, 5]); for (let i = 0; i < 10; i++) kit.box(M('rail'), [-7.8, 0.2 + i * 0.3, -6 + i * 0.5], [0.1, 0.1, 0.3]);
    kit.cyl(M('barrel'), [6.5, 0.45, -3.2], 0.3, 0.9, [0, 0, 0], 10); kit.cyl(M('barrel'), [7.2, 0.45, -3.5], 0.3, 0.9, [0, 0, 0], 10);
    scene.add(kit.toNode('Hangar'));
    // lights: warm key, cool fill, rim
    const L = (pos, color, intensity, range) => { const l = new E.Light('point', { color, intensity, range }); l.position.set(pos); scene.add(l); return l; };
    L([-2.6, 2.6, 2.6], '#ffd49a', 30, 12); L([3.4, 2.4, 1.8], '#7aa8ff', 10, 10); L([0.6, 3.0, -2.2], '#ffb870', 22, 10); L([-7, 3, -4], '#ffcf8a', 14, 10);
    return scene;
  }
  buildStudio() {
    const scene = new E.Scene(), env = scene.environment, lib = this.lib;
    E.applyTimeOfDay(env, 12); env.ambient = 0.55; env.sunIntensity = 1.6; env.fogDensity = 0.0; env.clouds = false; env.volumetric = 0; env.exposure = 1.05; env.shadowRadius = 8; env.shadowFar = 20;
    env.sunDirection = E.vec3.normalize([0, 0, 0], [-0.5, 0.45, 0.75]); env.sunColor = [0.8, 0.9, 1.0];
    env.skyColor = [0.16, 0.24, 0.38]; env.groundColor = [0.05, 0.07, 0.1]; env.horizonColor = [0.05, 0.09, 0.15]; env.zenithColor = [0.03, 0.05, 0.1]; env.fogColor = [0.03, 0.06, 0.1];
    const floor = new E.Mesh(E.plane({ width: 40, depth: 40 }), new E.Material({ name: 'StudioFloor', color: '#0d141c', roughness: 0.55, metallic: 0.5 }), 'floor'); scene.add(floor);
    const back = new E.Mesh(E.box({ width: 40, height: 14, depth: 0.2 }), new E.Material({ name: 'StudioWall', color: '#0b1119', roughness: 1, emissive: '#0d1b2b', emissiveStrength: 0.6 }), 'wall'); back.position.set([0, 6, -5]); scene.add(back);
    const L = (pos, color, intensity, range) => { const l = new E.Light('point', { color, intensity, range }); l.position.set(pos); scene.add(l); return l; };
    L([-2, 3, 3], '#e6eeff', 62, 14); L([3, 2.4, -1.6], '#4a8cff', 36, 10); L([-3, 1.8, -1.2], '#ffffff', 26, 9); L([1.5, 1.2, 3.2], '#fff4e0', 16, 8);
    void lib;
    return scene;
  }
  scene() { return this.mode === 'hangar' ? this.hangar : this.studio; }

  setOperator(op, look, { gun = 'deagle', twoHanded = false } = {}) {
    for (const sc of [this.hangar, this.studio]) if (this.hero) sc.remove(this.hero);
    const o = { ...op, look: look || op.look };
    const ch = makeSoldier(o, { hero: true, detail: 1.6 });
    const prop = makeWeaponProp(gun, { detail: 1 });
    equipWeapon(ch, prop, { twoHanded });
    ch.autoAnimate = false;
    this.hero = ch; this.opId = op.id; this.gun = gun; this.twoHanded = twoHanded;
    this.scene().add(ch);
    if (op.ability === 'shield' || op.ability === 'flashshield') { /* the shield rides on the back */ }
    this.t = 0;
  }
  setMode(mode) {
    if (mode === this.mode) return;
    if (this.hero) this.scene().remove(this.hero);
    this.mode = mode;
    if (this.hero) this.scene().add(this.hero);
  }
  update(dt) {
    const h = this.hero; if (!h) return;
    this.t += dt;
    this.yaw += (this.targetYaw - this.yaw) * Math.min(1, dt * 6);
    if (this.mode === 'hangar') { h.position.set([0.15, 0, 0]); h.setEuler(0, -28 + this.yaw + Math.sin(this.t * 0.4) * 2, 0); }
    else { h.position.set([0, 0, 0]); h.setEuler(0, this.yaw + Math.sin(this.t * 0.3) * 3, 0); }
    h.updateWorld(null);
    h.mixer.update(dt);
    poseHold(h, { aim: this.twoHanded ? 0.7 : 1, pitch: 0 });
    for (const x of Object.values(h.handlers || {})) x.update(dt);
    h.updateSockets();
    for (const x of Object.values(h.handlers || {})) if (x.prop.update) x.prop.update(dt);
  }
  render(opts = {}) {
    const cam = this.cam, m = this.mode;
    if (m === 'hangar') {
      const px = this.parallax[0] * 0.25, py = this.parallax[1] * 0.1;
      cam.position.set([0.5 + px, 1.38 + py, 3.7]); cam.target.set([0.0, 1.22, 0]); cam.fov = 33 * E.DEG;
    } else {
      const off = opts.offset ?? 1.1;
      cam.position.set([-off * 0.2, 1.3, 4.0]); cam.target.set([-off, 1.0, 0]); cam.fov = (opts.fov ?? 34) * E.DEG;
    }
    this.scene().environment.shadowCenter = [0, 1, 0];
    this.r.render(this.scene(), cam, { background: m === 'hangar' ? 'sky' : 'sky' });
  }
}
