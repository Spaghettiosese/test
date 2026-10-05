// First-person hands and weapon: the ten ShapeForge weapon rigs from the range, driven by the
// simulation's gun state. Handles aim-down-sights alignment, bob, sway, kick, weapon swaps and
// the scope overlay, as the range's game.js does, but for any loadout.
import * as E from '../../../engine/index.js';
import { WEAPONS as RIGS } from '../../weapons/index.js';
import { weaponPoint, weaponPointWorld } from '../../weapons/rig.js';
import { createGadgetRig, GADGET_VM } from './gadgetvm.js';

const META = { m4a1: 0.2, sniper: 0.07, shotgun: 0.3, revolver: 0.3, smg: 0.2, double: 0.3, garand: 0.2, mp7: 0.2, ak47: 0.2, deagle: 0.28 };
const PM = E.physicsMath;
const Qid = E.quat.create();
export const VM_SCALE = 0.46;

export class ViewModel {
  constructor(game) {
    this.game = game; this.entries = new Map(); this.cur = null; this.kind = 'gun'; this.world = 72;
    this.bob = 0; this.sway = [0, 0]; this.kickZ = 0; this.kickRot = 0; this.swapT = 0; this.pendingEntry = null;
    this.clip = 'Idle'; this.t = 0; this.state = 'idle'; this.useT = 0; this.ads = 0; this.reloadDur = 0; this.scoped = false;
    this.dYaw = 0; this.dPitch = 0; this.visible = true;
  }
  entryFor(key, gunDef) {
    let e = this.entries.get(key);
    if (e) return e;
    const w = RIGS.find((x) => x.id === gunDef.rig);
    const rig = w.create();
    rig.springs = false; rig.visible = false;
    rig.updateWorld = function (pw) { if (pw) E.mat4.multiply(this.world, pw, this.local); else this.world.set(this.local); for (const c of this.children) c.updateWorld(this.world); };
    for (const p of rig.parts) for (const m of p.meshes) m.castShadow = false;
    this.game.scene.add(rig);
    e = { key, rig, gun: w.gun, rigId: w.id, def: gunDef, relief: META[w.id] ?? 0.2 };
    rig.mixer.on((ev) => this.onRigEvent(e, ev));
    rig.play('Idle', { fade: 0 });
    this.entries.set(key, e);
    return e;
  }
  gadgetEntry(id) {
    const key = 'gadget:' + id; let e = this.entries.get(key);
    if (e) return e;
    const g = createGadgetRig(id); if (!g) return null;
    const rig = g.rig; rig.springs = false; rig.visible = false;
    rig.updateWorld = function (pw) { if (pw) E.mat4.multiply(this.world, pw, this.local); else this.world.set(this.local); for (const c of this.children) c.updateWorld(this.world); };
    for (const p of rig.parts) for (const m of p.meshes) m.castShadow = false;
    this.game.scene.add(rig);
    e = { key, rig, gun: g.gun, rigId: 'gadget', gadget: id, def: null, relief: 0.2 };
    rig.play('Idle', { fade: 0 });
    this.entries.set(key, e);
    return e;
  }
  onRigEvent(e, ev) { const a = this.game.audio; if (!a || e !== this.cur) return; const n = ev.name; if (n === 'magOut' || n === 'charge' || n === 'boltUp') a.click(0.9, 0.3); if (n === 'magIn') a.clack(1); if (n === 'boltHome' || n === 'pumpHome' || n === 'slideLock') a.clack(1.2); if (n === 'pumpBack') a.clack(0.9); if (n === 'shellIn') a.click(0.7, 0.35); if (n === 'ping') a.ping(); if (n === 'open' || n === 'close') a.clack(1.3); if (n === 'eject6') a.tink(); }

  // choose what is in the hands this frame
  select(actor) {
    const sel = actor.selected(), g = actor.gun;
    let want = null, kind = 'gun';
    if (sel && GADGET_VM[sel.id] && !(sel.count <= 0 && sel.id !== 'scanner')) { want = this.gadgetEntry(sel.id); kind = 'gadget'; }
    if (!want && g) want = this.entryFor(g.def.rig + ':' + g.def.id, g.def);
    if (want && want !== this.cur && want !== this.pendingEntry) { this.pendingEntry = want; this.swapT = 0; this.pendingKind = kind; }
  }
  play(name, opts = {}) { const e = this.cur; if (!e || !e.rig.mixer.clips.has(name)) return false; e.rig.play(name, { fade: 0.08, restart: true, ...opts }); this.clip = name; this.t = 0; return true; }
  clipDone() { const e = this.cur; if (!e) return true; const a = e.rig.mixer.action(this.clip); return !a || a.time >= a.clip.duration - 1e-3; }

  // ---- events from the simulation
  onShot(actor, gun, kick) {
    const e = this.cur; if (!e || e.gadget) return;
    this.play(gun.mag === 0 && e.rig.mixer.clips.has('Fire Last') ? 'Fire Last' : 'Fire', { fade: gun.def.auto ? 0.03 : 0.04 });
    this.state = 'firing';
    this.kickZ = Math.min(0.06, this.kickZ + 0.012 * kick); this.kickRot = Math.min(8, this.kickRot + kick * 0.9);
  }
  onReload(actor, gun) {
    const e = this.cur; if (!e || e.gadget) return;
    this.state = gun.def.rig === 'shotgun' ? 'reloadStart' : 'reload';
    if (gun.def.rig === 'shotgun') this.play('Reload Start'); else this.play(gun.mag === 0 && e.rig.mixer.clips.has('Reload Empty') ? 'Reload Empty' : 'Reload');
  }
  onShell() { if (this.state === 'reloadStart' || this.state === 'insert') this.state = 'insert'; }
  inspect() { if (this.state === 'idle' && this.cur && !this.cur.gadget) { this.state = 'inspect'; this.play('Inspect', { fade: 0.2 }); } }
  use(actionName = 'Use') { const e = this.cur; if (!e || !e.gadget) return; this.state = 'use'; this.play(actionName, { fade: 0.05 }); }

  update(dt, actor, input, cam) {
    const g = actor.gun;
    this.select(actor);
    // weapon swap: lower, swap, raise
    if (this.pendingEntry) {
      this.swapT += dt;
      if (this.swapT >= 0.2 || !this.cur) {
        if (this.cur) this.cur.rig.visible = false;
        this.cur = this.pendingEntry; this.pendingEntry = null; this.kind = this.pendingKind; this.swapT = -0.28;
        this.cur.rig.visible = true; this.state = 'idle'; this.play(g && !this.cur.gadget && g.mag === 0 && this.cur.rig.mixer.clips.has('Idle Empty') ? 'Idle Empty' : 'Idle', { fade: 0 });
        this.game.audio && this.game.audio.clack(0.8);
      }
    } else if (this.swapT < 0) this.swapT = Math.min(0, this.swapT + dt);
    const e = this.cur; if (!e) return { fov: this.world, scoped: false };
    // clip state machine
    this.t += dt;
    const idleName = !e.gadget && g && g.mag === 0 && e.rig.mixer.clips.has('Idle Empty') ? 'Idle Empty' : 'Idle';
    if (this.state === 'firing' && this.clipDone()) { this.state = 'idle'; this.play(idleName, { fade: g && g.def.auto ? 0.15 : 0.2, restart: false }); }
    if (this.state === 'reload' && !g?.reloading && this.clipDone()) { this.state = 'idle'; this.play(idleName, { fade: 0.2, restart: false }); }
    if (this.state === 'reload' && !g?.reloading) { this.state = 'idle'; this.play(idleName, { fade: 0.15, restart: false }); }
    if (this.state === 'reloadStart' && this.clipDone()) { this.state = 'insert'; this.play('Insert Shell', { fade: 0.05 }); }
    if (this.state === 'insert') {
      if (!g || !g.reloading) { this.state = 'reloadEnd'; this.play('Reload End', { fade: 0.05 }); }
      else if (this.clipDone()) this.play('Insert Shell', { fade: 0, restart: true });
    }
    if (this.state === 'reloadEnd' && this.clipDone()) { this.state = 'idle'; this.play('Idle', { fade: 0.2, restart: false }); }
    if (this.state === 'inspect' && this.clipDone()) { this.state = 'idle'; this.play('Idle', { fade: 0.3, restart: false }); }
    if (this.state === 'use' && this.clipDone()) { this.state = 'idle'; this.play('Idle', { fade: 0.15, restart: false }); }
    e.rig.mixer.update(dt);
    // ---- placement
    const f = input.f, left = input.left, up = input.up, eye = input.eye;
    const camM = E.mat4.create();
    camM.set([left[0], left[1], left[2], 0, up[0], up[1], up[2], 0, f[0], f[1], f[2], 0, eye[0], eye[1], eye[2], 1]);
    const aimable = !e.gadget && (this.state === 'idle' || this.state === 'firing') && this.pendingEntry === null && !(g && g.def.id === 'sniper' && this.state === 'firing' && this.t > 0.3);
    const wantAds = actor.ctl.aim && aimable && !actor.sprinting;
    const speed = e.def && e.def.scoped ? 4.5 : 6;
    this.ads = E.clamp(this.ads + (wantAds ? dt * speed : -dt * 6), 0, 1);
    const a = this.ads * this.ads * (3 - 2 * this.ads);
    const adsFovBase = e.def ? e.def.adsFov : this.world;
    const fovK = Math.tan((this.world * E.DEG) / 2) / Math.tan((e.gun.firstPerson.fov * E.DEG) / 2);
    const sxy = VM_SCALE * (fovK + (1 - fovK) * a);
    const S = E.mat4.fromRTS(E.mat4.create(), Qid, [0, 0, 0], [sxy, sxy, VM_SCALE]);
    const sp = Math.hypot(actor.vel[0], actor.vel[2]);
    this.bob += dt * sp * 2.2;
    const bobAmt = Math.min(1, sp / 3) * (1 - a * 0.85) * (actor.grounded ? 1 : 0.2);
    this.sway[0] += (E.clamp(-input.dYaw * 0.6, -0.04, 0.04) - this.sway[0]) * Math.min(1, dt * 8);
    this.sway[1] += (E.clamp(-input.dPitch * 0.6, -0.04, 0.04) - this.sway[1]) * Math.min(1, dt * 8);
    this.kickZ *= Math.exp(-dt * 14); this.kickRot *= Math.exp(-dt * 12);
    const sw = this.pendingEntry ? this.swapT / 0.2 : this.swapT < 0 ? -this.swapT / 0.28 : 0;
    const sprintLower = actor.sprinting ? 0.5 : 0;
    this.sprintK = (this.sprintK || 0) + (sprintLower - (this.sprintK || 0)) * Math.min(1, dt * 7);
    const off = [-0.05 * (1 - a) + Math.sin(this.bob) * 0.012 * bobAmt + this.sway[0] * (1 - a * 0.9), -0.04 * (1 - a) - Math.abs(Math.cos(this.bob)) * 0.01 * bobAmt + this.sway[1] * (1 - a * 0.9) - sw * 0.35 - this.sprintK * 0.08, -this.kickZ];
    const offM = E.mat4.fromRTS(E.mat4.create(), E.quat.fromEuler(E.quat.create(), -this.kickRot * (1 - a * 0.6) + sw * 40 + this.sprintK * 35, this.sprintK * 12, 0), off);
    let ads = E.mat4.create();
    if (!e.gadget) ads = this.adsTransform(e, a);
    const m = E.mat4.create();
    E.mat4.multiply(m, camM, S); E.mat4.multiply(m, m, offM); E.mat4.multiply(m, m, ads);
    e.rig.local.set(m);
    this.scoped = !!(e.def && e.def.scoped && this.ads > 0.92);
    e.rig.visible = this.visible && !this.scoped;
    const fov = this.world + ((e.def ? adsFovBase : this.world) - this.world) * (e.def && e.def.scoped ? (this.ads > 0.92 ? 1 : a * 0.25) : a);
    return { fov, scoped: this.scoped, ads: a };
  }
  // rotate/translate so the sight line runs down the eye's axis
  adsTransform(e, a) {
    const R = weaponPoint(e.rig, e.gun.points.sightRear, e.gun), F = weaponPoint(e.rig, e.gun.points.sightFront, e.gun);
    const d = E.vec3.normalize([0, 0, 0], E.vec3.sub([0, 0, 0], F, R));
    const q = E.quat.rotationTo(E.quat.create(), d, [0, 0, 1]);
    const Rr = E.vec3.transformQuat([0, 0, 0], R, q);
    const t = [-Rr[0], -Rr[1], e.relief - Rr[2]];
    const qa = E.quat.slerp(E.quat.create(), Qid, q, a);
    return E.mat4.fromRTS(E.mat4.create(), qa, [t[0] * a, t[1] * a, t[2] * a]);
  }
  muzzleWorld() { const e = this.cur; if (!e || e.gadget || !e.gun.points) return null; return weaponPointWorld(e.rig, e.gun.points.muzzle, e.gun); }
  hideAll() { for (const e of this.entries.values()) e.rig.visible = false; this.cur = null; this.pendingEntry = null; }
}
void PM;
