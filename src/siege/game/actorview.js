// 3D bodies for the simulation's actors: a rigged operator holding its gun, animated from the
// actor's velocity, stance and aim, blending locomotion clips on a 2D blend space, with spring
// hit reactions, and a ragdoll when it dies.
import * as E from '../../../engine/index.js';
import { makeSoldier, equipWeapon, poseHold } from './soldier.js';
import { makeWeaponProp } from '../../weapons/index.js';
import { STAND, CROUCH, PRONE } from '../sim/actor.js';
import { clamp } from '../sim/util.js';

const RAD = 180 / Math.PI;

export class ActorView {
  constructor(game, actor) {
    this.game = game; this.a = actor;
    this.ch = makeSoldier(actor.op, { hero: false });
    this.props = actor.guns.map((g) => { const p = makeWeaponProp(g.def.rig, { detail: 0.6 }); p.visible = false; return p; });
    this.curProp = -1; this.holdAim = 0.6; this.speedLP = 0; this.dir = [0, 0]; this.lean = 0;
    this.bs = new E.BlendSpace2D(this.ch.mixer, [
      { clip: 'Idle', x: 0, y: 0 }, { clip: 'Walk', x: 0, y: 1.9 }, { clip: 'Run', x: 0, y: 4.2 }, { clip: 'WalkBack', x: 0, y: -1.6 },
      { clip: 'StrafeL', x: 1.7, y: 0 }, { clip: 'StrafeR', x: -1.7, y: 0 },
    ]);
    this.hit = new E.HitReaction(this.ch, { stiffness: 110, damping: 12 });
    this.ch.autoAnimate = false;
    this.ragdoll = null; this.dead = false; this.deadT = 0; this.shown = true; this.mode = 'stand';
    game.scene.add(this.ch);
    this.equip(actor.cur);
    if (actor.shield) this.makeShield();
    this.ch.updateWorld(game.scene.world);
  }
  makeShield() {
    const m = new E.Material({ name: 'Shield', color: '#2a2f36', roughness: 0.45, metallic: 0.6 });
    const win = new E.Material({ name: 'ShieldGlass', color: '#4a6a7c', roughness: 0.05, metallic: 0.4, opacity: 0.55, doubleSided: true });
    const n = new E.Node('Shield');
    const slab = new E.Mesh(E.box({ width: 0.62, height: 1.25, depth: 0.05, bevel: 0.015 }), m, 'ShieldSlab'); n.add(slab);
    const pane = new E.Mesh(E.box({ width: 0.42, height: 0.14, depth: 0.056 }), win, 'ShieldPane'); pane.position.set([0, 0.4, 0]); n.add(pane);
    this.shield = n; this.ch.add(n); n.visible = false;
  }
  equip(i) {
    const a = this.a; if (i === this.curProp || !this.props[i]) return;
    this.props.forEach((p, k) => { if (k !== i) p.visible = false; });
    if (this.ch.equipped('R')) this.ch.unequip('R');
    const prop = this.props[i]; prop.visible = true;
    const two = a.guns[i].def.cls !== 'HG';
    equipWeapon(this.ch, prop, { twoHanded: two });
    this.curProp = i;
  }
  onShot() { const p = this.props[this.curProp]; if (p && !p.rig.playing) p.play('Fire'); else if (p) p.play('Fire'); }
  onReload() { const p = this.props[this.curProp], g = this.a.gun; if (!p || !g) return; const rig = g.def.rig; if (rig === 'shotgun') p.play('Reload Start'); else p.play(g.mag === 0 && p.clips.has('Reload Empty') ? 'Reload Empty' : 'Reload'); }
  setShown(v) { this.shown = v; this.ch.visible = v; }

  update(dt) {
    const a = this.a, ch = this.ch, g = this.game;
    if (a.gun && this.curProp !== a.cur) this.equip(a.cur);
    if (this.dead) {
      // corpse: ragdoll physics already drives the bones
      this.deadT += dt;
      ch.updateWorld(g.scene.world); if (this.ragdoll) this.ragdoll.update(dt);
      ch.updateSockets(); for (const h of Object.values(ch.handlers || {})) if (h.prop.update) h.prop.update(dt);
      return;
    }
    const mode = a.downed ? 'prone' : a.stance === PRONE ? 'prone' : a.stance === CROUCH ? 'crouch' : 'stand';
    ch.position.set([a.pos[0], a.pos[1], a.pos[2]]);
    // vaulting / rappelling hold a pose
    ch.setEuler(0, a.yaw * RAD, 0);
    const f = a.fwd, r = a.right;
    const vf = a.vel[0] * f[0] + a.vel[2] * f[2], vl = -(a.vel[0] * r[0] + a.vel[2] * r[2]), sp = Math.hypot(a.vel[0], a.vel[2]);
    this.dir[0] += (vl - this.dir[0]) * Math.min(1, dt * 10); this.dir[1] += (vf - this.dir[1]) * Math.min(1, dt * 10);
    const mx = ch.mixer;
    if (mode === 'prone') {
      mx.setWeights({ Crawl: 1 }, 0.2); const act = mx.action('Crawl'); if (act) act.speed = sp > 0.1 ? Math.max(0.4, sp / 0.35) : 0;
    } else if (mode === 'crouch') {
      const w = clamp(sp / 1.1, 0, 1); mx.setWeights({ CrouchIdle: 1 - w, CrouchWalk: w }, 0.15);
    } else {
      this.bs.set(this.dir[0], this.dir[1], 0.12);
      for (const n of ['Walk', 'Run', 'WalkBack', 'StrafeL', 'StrafeR']) { const act = mx.action(n); if (act) act.speed = 1; }
    }
    // upper body: lean, head pitch
    ch.updateWorld(g.scene.world);
    mx.update(dt);
    const sk = ch.skeleton, q = E.quat.create();
    const lean = a.lean * 14;
    if (Math.abs(lean) > 0.5) for (const [n, k] of [['spine', 0.5], ['chest', 0.6]]) { const i = sk.boneIndex(n); E.quat.fromEuler(q, 0, 0, -lean * k); E.quat.multiply(sk.rot.subarray(i * 4, i * 4 + 4), sk.rot.subarray(i * 4, i * 4 + 4), q); }
    { const i = sk.boneIndex('head'), p = clamp(-a.pitch * RAD * 0.6, -35, 35); E.quat.fromEuler(q, p, 0, 0); E.quat.multiply(sk.rot.subarray(i * 4, i * 4 + 4), sk.rot.subarray(i * 4, i * 4 + 4), q); }
    sk.update();
    // weapon hold
    const aiming = a.ads > 0.3 || (a.ai && a.ai.inCombat) || a.ctl.fire || a.sim.time - a.lastShotT < 1.2;
    const target = a.downed ? 0 : a.sprinting ? 0.15 : aiming ? 1 : a.ai ? 0.62 : 0.8;
    this.holdAim += (target - this.holdAim) * Math.min(1, dt * 6);
    const crouchDrop = mode === 'crouch' ? 0 : 0;
    poseHold(ch, { aim: this.holdAim, pitch: clamp(-a.pitch, -1.1, 1.1) + crouchDrop });
    this.hit.update(dt);
    for (const h of Object.values(ch.handlers || {})) h.update(dt);
    ch.updateSockets();
    for (const h of Object.values(ch.handlers || {})) if (h.prop.update) h.prop.update(dt);
    ch.visible = this.shown && !(a.mode === 'drone');
    const prop = this.props[this.curProp]; if (prop) prop.visible = !a.downed;
    if (this.shield) {
      const up = a.shield && a.shield.up;
      this.shield.visible = !!a.shield;
      this.shield.position.set(up ? [0, 1.05, 0.55] : [0, 1.25, -0.28]); E.quat.fromEuler(this.shield.rotation, up ? 0 : -4, 0, 0);
    }
    void STAND;
  }
  die(dir, region) {
    if (this.dead) return; this.dead = true;
    const a = this.a, g = this.game;
    this.ch.updateWorld(g.scene.world);
    try {
      g.colliders.ensure(a.pos, 4.5);
      const rd = new E.Ragdoll(g.phys, this.ch);
      rd.activate({ velocity: [a.vel[0] * 0.6, a.vel[1], a.vel[2] * 0.6], impulse: dir ? [dir[0] * 90, 25, dir[2] * 90] : null, at: region === 'head' ? 'head' : 'torso' });
      this.ragdoll = rd;
    } catch (e) { this.ragdoll = null; }
    const prop = this.props[this.curProp];
    if (prop && this.ch.equipped('R')) { /* the gun stays in the dead hand */ }
  }
  revive() { if (!this.dead) return; }
  dispose() { this.game.scene.remove(this.ch); if (this.ragdoll) { try { this.ragdoll.deactivate(0, { moveCharacter: false }); this.ragdoll._release(); } catch (e) { /* already gone */ } } }
  hurt(dir) { this.hit.hit(dir, 5); }
}

export class ActorViews {
  constructor(game) {
    this.game = game; this.map = new Map();
    const sim = game.sim;
    sim.on('shot', (e) => this.map.get(e.actor.id)?.onShot());
    sim.on('reload', (e) => this.map.get(e.actor.id)?.onReload());
    sim.on('swap', (e) => { const v = this.map.get(e.actor.id); if (v) v.equip(e.to); });
    sim.on('death', (e) => { const v = this.map.get(e.actor.id); if (v) { const k = e.from ? [e.actor.pos[0] - e.from[0], 0, e.actor.pos[2] - e.from[2]] : null; const l = k ? Math.hypot(k[0], k[2]) || 1 : 1; v.die(k ? [k[0] / l, 0, k[2] / l] : null, e.region); } });
    sim.on('hurt', (e) => { const v = this.map.get(e.actor.id); if (v && e.from && e.actor.alive) { const d = [e.actor.pos[0] - e.from[0], 0, e.actor.pos[2] - e.from[2]]; const l = Math.hypot(d[0], d[2]) || 1; v.hurt([d[0] / l, 0, d[2] / l]); } });
  }
  add(actor) { const v = new ActorView(this.game, actor); this.map.set(actor.id, v); return v; }
  get(actor) { return this.map.get(actor.id); }
  update(dt) {
    let n = 0;
    for (const v of this.map.values()) { v.update(dt); if (v.ragdoll) n++; }
    void n;
  }
  clear() { for (const v of this.map.values()) v.dispose(); this.map.clear(); }
}
