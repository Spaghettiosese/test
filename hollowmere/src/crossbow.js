// The crossbow: I raises or lowers it, the left button looses a bolt, the right button aims down
// the rail (a steadier, narrower view), the mouse wheel or K changes the bolt. Four kinds:
// broadhead (kills, quietly if it kills), water (puts out torches, braziers and fires from range),
// fire (lights what it hits) and sleep (puts a man down without killing him). It reloads by itself.
import * as E from '../../engine/index.js';

const hyp = Math.hypot;
export const BOLTS = [
  { id: 'bolt', name: 'Broadhead', color: '#c8c0b0' },
  { id: 'bolt_water', name: 'Water', color: '#7ac0ff' },
  { id: 'bolt_fire', name: 'Fire', color: '#ff9a48' },
  { id: 'bolt_sleep', name: 'Sleep', color: '#c8a0ff' },
];

export class Crossbow {
  constructor(g) {
    this.g = g; g.reg('crossbow', this); this.up = false; this.aim = false; this.type = 0; this.reload = 0; this.k = 0;
    this.geo = E.box({ width: 0.016, height: 0.016, depth: 0.42 });
    this.mats = BOLTS.map((b) => new E.Material({ name: 'Bolt ' + b.name, color: b.color, metallic: b.id === 'bolt' ? 0.8 : 0.2, roughness: 0.4, emissive: b.id === 'bolt' ? '#000000' : b.color, emissiveStrength: b.id === 'bolt' ? 0 : 1.6 }));
  }
  has() { return this.g.player.inv.has('crossbow'); }
  ammo(i = this.type) { return this.g.player.inv.count(BOLTS[i].id); }
  label() { const b = BOLTS[this.type]; return `${b.name} bolts ×${this.ammo()}`; }
  toggle() {
    const g = this.g, P = g.player;
    if (!this.has()) { g.toast('You have no crossbow'); g.sfx.deny?.(); return; }
    if (P.carried || P.picking || P.dead || P.mount) return;
    this.up = !this.up; this.aim = false;
    if (this.up) { P.atk = null; P.charge = null; P.drawing = P.sheathing = null; P.drawn = false; P.vm.sword.visible = false; P.vm.xbow.visible = true; P.vm.play('XbowRaise', { fade: 0.05, restart: true }); P.vmClip = 'XbowRaise'; P.vmEnd = g.time + 0.3; this.k = 0.3; g.sfx.unsheathe?.(); if (!this.ammo()) this.cycle(1, true); g.toast(this.label() + (g.stats.xbowHint ? '' : '  ·  LMB looses, RMB aims, K or the wheel changes bolts')); g.stats.xbowHint = 1; }
    else this.lower();
  }
  lower() { const P = this.g.player; this.up = false; this.aim = false; P.vm.xbow.visible = false; P.playVm('Idle', 0.1); }
  cycle(dir = 1, quiet = false) {
    for (let i = 1; i <= BOLTS.length; i++) { const t = (this.type + dir * i + BOLTS.length * 4) % BOLTS.length; if (this.ammo(t)) { this.type = t; break; } }
    if (!quiet) { this.g.toast(this.label()); this.g.sfx.pick?.(); }
  }
  // the player's frame: called instead of the sword while the crossbow is up
  update(dt, input) {
    const g = this.g, P = g.player; if (!this.up) return false;
    if (P.dead || P.mount || P.carried) { this.lower(); return false; }
    this.k -= dt; this.reload = Math.max(0, this.reload - dt);
    const wantAim = P.rmb && this.reload <= 0;
    if (wantAim !== this.aim) { this.aim = wantAim; if (this.k <= 0 && this.reload <= 0) P.vm.play(this.aim ? 'XbowAim' : 'XbowIdle', { fade: 0.12 }); }
    if (this.k <= 0 && this.reload <= 0 && P.vmClip !== (this.aim ? 'XbowAim' : 'XbowIdle') && P.vmClip !== 'XbowFire') { P.vm.play(this.aim ? 'XbowAim' : 'XbowIdle', { fade: 0.15 }); P.vmClip = this.aim ? 'XbowAim' : 'XbowIdle'; }
    if (P.lmbPress) this.fire();
    if (input.pressed.has('k')) this.cycle(1);
    // the bow itself: slides up to the eye to aim, kicks back when loosed, dips while reloading
    const xb = P.vm.xbow, A = P.vm.xbowAt, want = this.aim ? A.aim : A.idle, kick = Math.max(0, this.k) * 0.25, dip = this.reload > 0 && this.k <= 0 ? Math.sin(Math.min(1, (1.15 - this.reload) / 0.83) * Math.PI) * 0.12 : 0;
    this.pose = this.pose || [...A.idle];
    for (let i = 0; i < 3; i++) this.pose[i] += (want[i] - this.pose[i]) * Math.min(1, dt * 10);
    xb.position.set([this.pose[0], this.pose[1] - dip, this.pose[2] - kick]);
    return true;
  }
  fire() {
    const g = this.g, P = g.player; if (this.reload > 0 || this.k > 0) return;
    const b = BOLTS[this.type]; if (!this.ammo()) { this.cycle(1, true); if (!this.ammo()) { g.toast('No bolts'); g.sfx.deny?.(); } return; }
    P.inv.remove(b.id, 1);
    const e = P.eyePos, f = P.forward, sp = 46, spread = this.aim ? 0.002 : 0.022;
    const d = [f[0] + (Math.random() - 0.5) * spread, f[1] + (Math.random() - 0.5) * spread, f[2] + (Math.random() - 0.5) * spread];
    const m = new E.Mesh(this.geo, this.mats[this.type], 'Bolt'); m.castShadow = false;
    g.tools.add('xbolt', m, [e[0] + f[0] * 0.4, e[1] - 0.05, e[2] + f[2] * 0.4], [d[0] * sp, d[1] * sp, d[2] * sp], { bolt: b.id, life: 3 });
    P.vm.play('XbowFire', { fade: 0.02, restart: true }); P.vmClip = 'XbowFire'; P.recoil = 0.04; P.kick = 0.02;
    g.sfx.clang?.(0.35); g.sfx.swing?.(0.9); g.noise(P.pos, 4, 'step');
    this.reload = 1.15; this.k = 0.32;
    g.after(0.32, () => { if (this.up) { P.vm.play('XbowReload', { fade: 0.08, restart: true }); P.vmClip = 'XbowReload'; g.sfx.lockClick?.(); } });
    if (!this.ammo()) g.after(1.2, () => { if (this.up) this.cycle(1, false); });
  }
  // a bolt arrives: in someone, or in something
  hit(pr, n, head, dir) {
    const g = this.g, P = g.player, kind = pr.bolt;
    const unaware = (n.state === 'routine' || n.state === 'notice' || n.lying) && n.alert < 0.95 && !n.sees;
    if (kind === 'bolt') {
      const dmg = 48 * (P.mod?.dmg || 1) * (head ? 2.6 : 1) * (unaware ? 1.4 : 1);
      const res = g.hitNpc(n, dmg, [dir[0], dir[2]], { from: 'player', clip: 'bolt', ranged: true, silentKill: unaware && head });
      if (res === 'killed') { g.stats.boltKills = (g.stats.boltKills || 0) + 1; if (head) g.flashText('HEADSHOT'); }
      if (res === 'killed' && Math.random() < 0.5) P.inv.add('bolt', 1);
    } else if (kind === 'bolt_sleep') {
      if (n.role === 'hollow' || n.def.boss || n.arch?.armored) { g.toast('It does not sleep'); g.hitNpc(n, 6, [dir[0], dir[2]], { from: 'player', ranged: true }); return; }
      n.knockOut(50); g.stats.ko = (g.stats.ko || 0) + 1; g.flashText('ASLEEP'); g.progress.addXp(8, 'put to sleep');
      if (!unaware) g.rep.crime('assault', n.pos, { victim: n, range: 14 });
    } else if (kind === 'bolt_fire') { n.burn = Math.max(n.burn, 4); g.hitNpc(n, 12, [dir[0], dir[2]], { from: 'player', ranged: true, fire: true }); g.tools.burst?.(pr.p); }
    else if (kind === 'bolt_water') { g.hitNpc(n, 3, [dir[0], dir[2]], { from: 'player', ranged: true }); n.burn = 0; g.sfx.splash?.(); }
  }
  land(pr, at) {
    const g = this.g, kind = pr.bolt;
    if (kind === 'bolt_water') {
      let doused = 0;
      for (const t of g.level.torches) if (t.lit && hyp(t.x - at[0], t.z - at[2]) < 1.4 && Math.abs(t.y - at[1]) < 1.6) { g.snuff(t); doused++; }
      for (const f of g.level.fires) if (f.lit && hyp(f.x - at[0], f.z - at[2]) < 1.8) { f.lit = false; if (f.light) f.light.intensity = 0; doused++; g.emitBurst?.([f.x, f.y + 0.5, f.z], 'poof'); }
      for (const f of g.tools.fires) if (hyp(f.x - at[0], f.z - at[2]) < f.r + 1) { f.t = 0; doused++; }
      g.sfx.splash?.(); g.smoke.emit(at, { count: 8, color: [0.6, 0.7, 0.8, 0.5], colorEnd: [0.4, 0.5, 0.6, 0], size: 0.12, grow: 2, spread: 0.3, up: 0.8, life: 0.8, jitter: 0.1 });
      if (doused) g.toast('Doused'); g.noise(at, 3, 'step');
    } else if (kind === 'bolt_fire') { g.tools.burst(at); for (const t of g.level.torches) if (!t.lit && hyp(t.x - at[0], t.z - at[2]) < 1.4) g.relight(t); }
    else { g.spark(at, [0, 1, 0], 5); g.sfx.thud?.(0.4, at); g.noise(at, kind === 'bolt_sleep' ? 2 : 7, 'clang'); }
  }
  save() { return { up: false, type: this.type }; }
  load(d) { if (d) this.type = d.type || 0; }
}
