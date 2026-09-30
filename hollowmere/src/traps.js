// Bear traps and tripwires: some are set by bandits in the wilds, some are yours to place (H).
// Anyone who steps on one is caught. Crouch beside a trap to disarm and keep it.
import * as E from '../../engine/index.js';

const hyp = Math.hypot;
export class Traps {
  constructor(g) {
    this.g = g; this.list = []; this.t = 0;
    this.mIron = new E.Material({ name: 'Trap iron', color: '#4a4a52', metallic: 0.8, roughness: 0.5 });
    this.mRope = new E.Material({ name: 'Wire', color: '#b8a878', roughness: 0.9 });
    this.gJaw = E.box({ width: 0.34, height: 0.03, depth: 0.16 }); this.gPost = E.box({ width: 0.06, height: 0.5, depth: 0.06 });
    for (const t of g.level.trapSpots || []) this.place(t.kind, t.x, t.z, 'world', t.yaw || 0);
  }
  place(kind, x, z, owner = 'player', yaw = 0) {
    const g = this.g, n = new E.Node('Trap'); n.position.set([x, g.nav.floorAt(x, z), z]); E.quat.fromEuler(n.rotation, 0, yaw, 0);
    if (kind === 'bear') {
      for (const s of [-1, 1]) { const j = new E.Mesh(this.gJaw, this.mIron, 'jaw'); j.position.set([0, 0.03, s * 0.09]); j.castShadow = false; n.add(j); }
      const plate = new E.Mesh(this.gJaw, this.mRope, 'plate'); plate.scale.set([0.4, 1, 0.4]); plate.position.set([0, 0.05, 0]); plate.castShadow = false; n.add(plate);
    } else {
      for (const s of [-1, 1]) { const p = new E.Mesh(this.gPost, this.mIron, 'post'); p.position.set([s * 1.0, 0.25, 0]); p.castShadow = false; n.add(p); }
      const w = new E.Mesh(E.box({ width: 2.0, height: 0.012, depth: 0.012 }), this.mRope, 'wire'); w.position.set([0, 0.22, 0]); w.castShadow = false; n.add(w);
    }
    g.scene.add(n);
    const t = { kind, x, z, owner, yaw, node: n, armed: true, r: kind === 'bear' ? 0.6 : 1.1 };
    this.list.push(t); return t;
  }
  drop() {
    const g = this.g, P = g.player, inv = P.inv, kind = inv.has('beartrap') ? 'bear' : inv.has('wire') ? 'wire' : null;
    if (!kind) { g.toast('You carry no traps'); g.sfx.deny?.(); return; }
    inv.remove(kind === 'bear' ? 'beartrap' : 'wire', 1);
    const f = P.flat; this.place(kind, P.pos[0] + f[0] * 1.4, P.pos[1] * 0 + P.pos[2] + f[1] * 1.4, 'player', P.yaw / (Math.PI / 180));
    g.toast(kind === 'bear' ? 'Bear trap set' : 'Tripwire strung'); g.sfx.pick?.(); P.playVm('Pinch', 0.05);
  }
  trigger(t, victim) {
    const g = this.g; if (!t.armed) return; t.armed = false;
    for (const c of t.node.children) if (c.name === 'jaw') { c.rotation[0] = 0; c.position[1] = 0.12; }
    if (t.kind === 'bear') {
      g.sfx.clang?.(1.2, [t.x, 0, t.z]); g.spark([t.x, 0.15, t.z], [0, 1, 0], 14); g.noise([t.x, 0, t.z], 16, 'combat');
      if (victim === 'player') { g.player.hurt(22, null, {}); g.status.add('root', 3.5); g.flashText('CAUGHT'); }
      else { this.g.stats.traps = (this.g.stats.traps || 0) + 1; victim.hp -= 26; victim.snare = 4.5; victim.stagger = 1; victim.bark('AAGH! My leg!'); g.sfx.grunt?.(1.2, victim.pos, 0.9); g.spawnBlood([victim.x, 0.3, victim.z], [0, 0], 12); if (victim.hp <= 0) victim.die([0, 0], {}); else if (victim.guard) { victim.alert = 1; victim.lastSeen = [...g.player.pos]; g.alarm([victim.x, 0, victim.z], 'combat', victim); } }
    } else {
      g.sfx.alarmBell?.([t.x, 1, t.z]); g.noise([t.x, 0, t.z], t.owner === 'world' ? 34 : 14, 'alarm');
      if (victim === 'player') g.ui.toast('You hit a tripwire. Bells clatter.');
      else { victim.stagger = 1.6; victim.snare = 1.6; victim.bark('Who strung this?!'); victim.ch.upper.playOnce('Stagger', { fadeIn: 0.04, fadeOut: 0.3 }); if (t.owner === 'player') t.armed = true; }
      if (t.owner === 'world') { t.armed = false; }
    }
    if (t.owner === 'player' && t.kind === 'bear') t.spent = true;
  }
  update(dt) {
    this.t -= dt; if (this.t > 0) return; this.t = 0.08;
    const g = this.g, P = g.player;
    for (const t of this.list) {
      if (!t.armed) continue;
      // the player: only world traps (his own he knows)
      if (t.owner === 'world' && !P.dead && P.cc.grounded && hyp(P.pos[0] - t.x, P.pos[2] - t.z) < t.r && !(P.crouch && P.speedNow < 1.0 && t.kind === 'bear' && P.mod?.trapsense)) { this.trigger(t, 'player'); continue; }
      for (const n of g.npcs) {
        if (n.dead || n.state === 'ko' || n.lying || Math.abs(n.x - t.x) > 1.6 || Math.abs(n.z - t.z) > 1.6) continue;
        if (t.owner === 'world' && (n.faction === 'bandits')) continue; // they know where they set them
        if (hyp(n.x - t.x, n.z - t.z) < t.r) { this.trigger(t, n); break; }
      }
    }
  }
  hook(push, eye) {
    const g = this.g, P = g.player;
    for (const t of this.list) {
      if (Math.abs(t.x - eye[0]) > 2.6 || Math.abs(t.z - eye[2]) > 2.6) continue;
      if (t.armed) push(t.x, 0.2, t.z, 2.2, P.crouch ? `Disarm the ${t.kind === 'bear' ? 'bear trap' : 'tripwire'}` : 'Crouch to disarm the trap', () => { if (!P.crouch) return; this.pickUp(t, true); }, 'pick', 0.6, t);
      else if (t.kind === 'bear' && !t.spent) push(t.x, 0.2, t.z, 2.2, 'Reset the sprung trap', () => this.pickUp(t, false), 'pick', 0.6, t);
    }
  }
  pickUp(t, careful) {
    const g = this.g, P = g.player;
    this.list.splice(this.list.indexOf(t), 1); g.scene.remove(t.node);
    P.inv.add(t.kind === 'bear' ? 'beartrap' : 'wire', 1); g.progress.addXp(careful ? 5 : 0, careful ? 'disarmed' : ''); g.sfx.pick?.(); g.toast('Collected the ' + (t.kind === 'bear' ? 'bear trap' : 'tripwire'));
  }
}
