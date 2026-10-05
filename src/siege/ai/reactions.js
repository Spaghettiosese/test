// Reactions: everything a bot notices that is not an enemy in its sights, and what it does about it.
//
// `Reactions` (one per sim) listens to the simulation and keeps a list of hazards (grenades in the
// air, armed charges, gas, burning thermite). It passes the news on to the bots that can notice it:
// a bullet that went past someone's head, a door that opened, a wall that came down, a team mate who
// fell, a ping from the human, a camera that was shot out.
//
// `reflexes` (mixed into Brain) is what a bot does once it knows: dive out of a frag's reach, turn its
// back on a flashbang, back off a charge that is about to blow, keep its head down under fire, shoot
// the charge or the camera it can see, throw a grenade into the breach, shoot through the wall at
// somebody it can only hear. Everything is gated by difficulty and by the bot's personality, so two
// bots do not react to the same thing in the same way.
import { CAST, STOREY } from '../world/grid.js';
import { STAND, CROUCH } from '../sim/actor.js';
import { clamp, dist3, norm, sub, dot, wrapAngle, yawOf, pitchOf } from '../sim/util.js';
import { findCover, cellsAround, lobPitch } from './tactics.js';

// things a bot can shoot to switch off (static devices); mats, wire, mines and shields cannot be shot
const SHOOTABLE = new Set(['cams', 'turret', 'shockdrone', 'jammer', 'claymore', 'edd', 'alarm', 'healstation', 'breach', 'cluster', 'thermite', 'shockwire']);
const CHARGES = new Set(['breach', 'cluster', 'thermite']);

const segDist = (a, b, p) => { // distance from p to the segment a-b and how far along it the nearest point is (0..1)
  const ab = sub(b, a), ap = sub(p, a), l2 = dot(ab, ab) || 1e-6, t = clamp(dot(ap, ab) / l2, 0, 1);
  const q = [a[0] + ab[0] * t, a[1] + ab[1] * t, a[2] + ab[2] * t];
  return { d: dist3(p, q), t };
};

export class Reactions {
  constructor(sim) {
    this.sim = sim; this.hazards = []; this.tick = 0; this.seq = 1e6; this.barkAt = new Map(); this.stats = {}; this.doors = [];
    const on = (type, fn) => sim.on(type, (e) => fn.call(this, e));
    on('throw', this.onThrow); on('down', this.onDown); on('death', this.onDeath); on('tracer', this.onTracer);
    on('door', this.onDoor); on('panelbreak', this.onBreak); on('place', this.onPlace); on('explosion', this.onExplosion);
    on('devicekill', this.onDeviceKill); on('dronekill', this.onDroneKill); on('trap', this.onTrap); on('alarm', this.onAlarm);
    on('ping', this.onPing); on('reload', this.onReload); on('flashbang', this.onFlash);
  }
  count(k) { this.stats[k] = (this.stats[k] || 0) + 1; }
  bots(team = null) { const out = []; for (const a of this.sim.actors) if (a.ai && a.alive && a.mode !== 'drone' && (!team || a.team === team)) out.push(a.ai); return out; }
  // radio chatter the human can read in the HUD
  bark(actor, text, key = text, gap = 4) {
    if (!actor || actor.isPlayer) return; const now = this.sim.time;
    const k = actor.id + ':' + key; if (now - (this.barkAt.get(k) ?? -99) < gap || now - (this.barkAt.get(actor.id) ?? -99) < 1.0) return;
    this.barkAt.set(k, now); this.barkAt.set(actor.id, now);
    this.sim.emit('bark', { actor, team: actor.team, text, pos: [actor.pos[0], actor.pos[1], actor.pos[2]] });
  }

  // ------------------------------------------------------------------ hazards
  update(dt) {
    this.sitT = (this.sitT || 0) - dt; if (this.sitT <= 0) { this.sitT = 1; this.situation(); }
    this.tick -= dt; if (this.tick > 0) return; this.tick = 0.1;
    const dv = this.sim.devices, out = [];
    for (const p of dv.proj) {
      if (p.dead) continue;
      if (p.kind === 'frag') out.push({ id: p.id, kind: 'frag', pos: p.pos, r: 4.6, t: p.fuse, team: p.team, src: p.owner });
      else if (p.kind === 'impact' && !p.stuck) out.push({ id: p.id, kind: 'impact', pos: p.pos, r: 3.4, t: 0.7, team: p.team, src: p.owner });
      else if (p.kind === 'nitro') out.push({ id: p.id, kind: 'nitro', pos: p.pos, r: 4.6, t: p.stuck ? 3 : 1, team: p.team, src: p.owner, persistent: true });
      else if (p.kind === 'stun') out.push({ id: p.id, kind: 'stun', pos: p.pos, r: 14, t: p.fuse, team: p.team, src: p.owner, flash: true });
    }
    for (const d of dv.list) {
      if (d.dead) continue;
      if (d.kind === 'breach' || d.kind === 'cluster') out.push({ id: d.id, kind: 'charge', pos: d.pos, r: d.kind === 'cluster' ? 4.2 : 3.7, t: 99, team: d.team, src: d.owner, persistent: true, dev: d });
      else if (d.kind === 'thermite') out.push({ id: d.id, kind: 'thermite', pos: d.pos, r: 2.9, t: d.data.burning ? 4.2 - d.data.t : 99, team: d.team, src: d.owner, persistent: true, dev: d });
    }
    for (const g of dv.gas) { if (!g.id) g.id = ++this.seq; out.push({ id: g.id, kind: 'gas', pos: g.pos, r: g.r + 0.7, t: g.t, team: g.team, src: g.owner, persistent: true }); }
    for (const f of dv.fire) out.push({ id: f.id, kind: 'fire', pos: f.pos, r: f.r + 0.6, t: f.t, team: f.team, src: f.owner, persistent: true });
    this.hazards = out;
  }
  // What the state of the round does to a bot's nerve: the clock running out sends the attackers in, the last
  // defender goes quiet and plays for an ambush, a man up makes everyone a little braver.
  situation() {
    const r = this.sim.round; if (!r.inAction()) { for (const b of this.bots()) if (b.persona) b.persona.situ = 0; return; }
    const alive = { atk: 0, def: 0 }; for (const a of this.sim.actors) if (a.alive) alive[a.team]++;
    const planted = r.bomb.state === 'planted' || r.bomb.state === 'defusing';
    for (const b of this.bots()) {
      const p = b.persona; if (!p) continue;
      const mine = alive[b.a.team], theirs = alive[b.a.team === 'atk' ? 'def' : 'atk'];
      let s = 0;
      if (b.a.team === 'atk') {
        if (!planted && r.bomb.state === 'idle') s += clamp((55 - r.t) / 55, 0, 1) * 0.5; // out of time: nobody waits any more
        if (planted) s -= 0.2; // the objective is down: protect it
      } else {
        if (mine === 1 && theirs >= 2 && !planted) s -= 0.4; // the last one alive plays the ambush
        if (planted) s += 0.3; // the defuser is down: it has to be retaken
      }
      if (mine - theirs >= 2) s += 0.12; else if (theirs - mine >= 2) s -= 0.1;
      if (Math.abs(s - p.situ) > 0.12 && Math.abs(s) > 0.25 && s > p.situ && b.a.team === 'atk' && !this.rushed && r.t < 55) { this.rushed = true; this.bark(b.a, "Clock's running, push!", 'clock', 30); }
      if (b.a.team === 'def' && mine === 1 && theirs >= 2 && !this.lastOne) { this.lastOne = true; this.bark(b.a, "I'm the last one!", 'last', 30); }
      p.situ = s;
    }
  }
  // hazards that sit where they are for a while: the path planner steers round them
  persistent(team) { return this.hazards.filter((h) => h.persistent && h.team !== team); }

  // ------------------------------------------------------------------ what was thrown
  onThrow(e) {
    const t = { frag: 'Frag out!', stun: 'Flash out!', smoke: 'Smoke out!', impact: 'Impact out!', sonar: 'Pinging!', nitro: 'C4 down!' }[e.kind];
    if (t) this.bark(e.actor, t, e.kind, 1.5);
  }
  onFlash() { this.count('flashbang'); }
  onExplosion(e) {
    if (!e.pos) return; this.count('explosion');
    for (const b of this.bots()) {
      const d = dist3(b.a.pos, e.pos); if (d > 26 || d < 0.1) continue;
      b.flinch(clamp(1 - d / 26, 0.15, 0.7));
      // an enemy blast is a lead: look at it, and the curious go to see
      if (e.src && e.src.team !== b.a.team) { if (!b.inCombat) { b.watch = [e.pos[0], e.pos[1] + 1, e.pos[2]]; b.watchT = Math.max(b.watchT, 3); } }
    }
  }

  // ------------------------------------------------------------------ people going down
  onDown(e) { this.mateFell(e.actor, e.src); }
  onDeath(e) { if (e.was === 'alive') this.mateFell(e.actor, e.killer); } // a takedown was announced when it happened
  mateFell(victim, killer) {
    if (!victim || this.fellSeen === victim.id + ':' + Math.floor(this.sim.time * 4)) return;
    this.fellSeen = victim.id + ':' + Math.floor(this.sim.time * 4);
    this.count('fall');
    const where = [victim.pos[0], victim.pos[1], victim.pos[2]];
    // the killer's side keeps its head: morale up, and the next few seconds are spent checking the corners
    if (killer && killer.ai && killer.team !== victim.team) { killer.ai.persona.onKill(); killer.ai.afterKill(victim); }
    // the victim's side hears it on the radio
    const mates = this.bots(victim.team).filter((b) => b.a !== victim);
    for (const b of mates) b.persona && b.persona.onMateDown();
    const witness = mates.slice().sort((p, q) => dist3(p.a.pos, where) - dist3(q.a.pos, where))[0];
    if (witness && dist3(witness.a.pos, where) < 30) this.bark(witness.a, `${victim.name} is down!`, 'down', 2.5);
    // where the shot came from: whoever saw the killer knows; the rest have to guess from the way the victim was hit
    let spot = null, sure = false;
    if (killer && killer.team !== victim.team) {
      spot = [killer.pos[0], killer.pos[1], killer.pos[2]];
      const vb = victim.ai; if (vb && vb.sense.hitDir != null && this.sim.time - vb.sense.hitT < 2) { const y = vb.sense.hitDir; spot = [where[0] + Math.sin(y) * 9, where[1], where[2] + Math.cos(y) * 9]; }
      const kc = killer.chestPos ? killer.chestPos() : killer.pos; // (a turret's rounds come from a stand-in for its owner)
      for (const b of mates) { if (this.sim.world.visible(b.a.eye(), kc, CAST.GLASS) && b.a.alive) { sure = true; break; } }
    }
    for (const b of mates) b.mateFell(victim, where, spot, sure);
  }

  // ------------------------------------------------------------------ bullets going past
  onTracer(e) {
    const s = e.shooter; if (!s || !e.from || !e.to) return;
    for (const a of this.sim.actors) {
      if (!a.ai || !a.alive || a.team === s.team || a.mode === 'drone') continue;
      const c = a.chestPos(), near = Math.abs(c[0] - e.from[0]) < 60 && Math.abs(c[2] - e.from[2]) < 60;
      if (!near) continue;
      const { d, t } = segDist(e.from, e.to, c);
      // the bullet must pass close and carry on (a bullet that stopped at the wall in front of us is only an impact)
      if (d < 1.6 && d > 0.28 && t < 0.97 && t > 0.02) a.ai.nearMiss(s, e.from, d);
    }
  }

  // ------------------------------------------------------------------ doors, walls, charges
  onDoor(e) {
    const d = e.door, c = [d.ax === 'x' ? d.ix : d.ix + 0.5, d.f * STOREY + 1.1, d.ax === 'x' ? d.iz + 0.5 : d.iz];
    const n = this.sim.noises.slice(-8).reverse().find((q) => q.kind === 'door' && dist3(q.pos, c) < 3.2 && this.sim.time - q.t < 1.0);
    const by = n ? n.src : null;
    if (by && by.isPlayer) this.count('playerdoor'); this.count('door');
    for (const b of this.bots()) {
      if (by && b.a.team === by.team) continue;
      b.noticeDoor(c, e.open, by);
    }
  }
  onBreak(e) {
    if (!e.panel || !this.sim.round.inAction()) return;
    const c = this.sim.world.panelCenter(e.panel), by = e.src && e.src.actor;
    this.count('wallbreak');
    let barked = false;
    for (const b of this.bots()) {
      if (by && b.a.team === by.team) continue;
      b.noticeHole(c, e.panel.kind === 'glass');
      if (!barked && b.a.team === 'def' && e.panel.kind !== 'glass' && dist3(b.a.pos, c) < 20) { this.bark(b.a, "Wall's open!", 'hole', 3); barked = true; }
    }
  }
  onPlace(e) {
    const d = e.device; if (!d) return;
    if (CHARGES.has(d.kind)) {
      this.count('charge');
      for (const b of this.bots()) {
        if (b.a.team === d.team) continue;
        const dd = dist3(b.a.pos, d.pos);
        if (dd < 22 && (dd < 9 || this.sim.world.visible(b.a.eye(), d.pos, CAST.GLASS))) b.noticeDevice(d);
      }
    }
  }
  onDeviceKill(e) {
    const d = e.device; if (!d || d.owner == null) return;
    this.count('devicekill');
    if (e.fired) return;
    if (d.owner.alive && d.owner.ai) {
      const label = { cams: 'Camera down!', turret: 'Turret down!', jammer: 'Jammer down!', claymore: 'Claymore down!', edd: 'Trap down!', alarm: 'Alarm down!', shockdrone: 'Shock drone down!', breach: 'Charge defused!', cluster: 'Charge defused!', thermite: 'Thermite defused!' }[d.kind];
      if (label && e.src) this.bark(d.owner, label, 'dk' + d.id, 1);
      // the team looks where the shot came from
      if (this.sim.round.inAction() && e.src && e.src.team !== d.team && d.owner.ai.dir) { d.owner.ai.dir.alert([e.src.pos[0], e.src.pos[1], e.src.pos[2]], 'hurt', d.owner.ai, 1); }
    }
  }
  onDroneKill(e) {
    this.count('dronekill');
    const dr = e.drone; if (!dr || !dr.owner) return;
    if (dr.owner.alive) this.bark(dr.owner, 'Drone down!', 'drone', 2);
    const s = e.src;
    if (this.sim.round.inAction() && s && s.team !== dr.team && dr.owner.ai && dr.owner.ai.dir) dr.owner.ai.dir.alert([s.pos[0], s.pos[1], s.pos[2]], 'hurt', dr.owner.ai, 1);
  }
  onTrap(e) { this.count('trap'); const v = e.victim; if (v && v.alive) for (const b of this.bots(v.team)) if (b.a !== v && dist3(b.a.pos, v.pos) < 20) { b.flinch(0.3); b.watch = [v.pos[0], v.pos[1] + 1, v.pos[2]]; b.watchT = 3; } if (v) this.bark(v, 'Tripped a trap!', 'trap', 3); }
  onAlarm(e) {
    this.count('alarm'); const d = e.device; if (!d) return;
    for (const b of this.bots(d.team)) if (dist3(b.a.pos, d.pos) < 30) { b.watch = [d.pos[0], d.pos[1] + 1, d.pos[2]]; b.watchT = 4; b.rx.listenT = 3; }
    if (d.owner && d.owner.alive) this.bark(d.owner, 'Alarm tripped!', 'alarm', 4);
  }
  onReload() { /* the sound is made by the actor; this is only a hook for tests */ }

  // ------------------------------------------------------------------ the human pings
  onPing(e) {
    const me = e.actor; if (!me || !me.isPlayer) return;
    this.count('ping');
    const mates = this.bots(me.team); if (!mates.length) return;
    const pos = [e.pos[0], e.pos[1], e.pos[2]];
    if (e.enemy && e.enemy.alive) {
      for (const b of mates) b.sense.learn({ id: e.enemy.id, actor: e.enemy, pos: [...pos], vel: [e.enemy.vel[0], 0, e.enemy.vel[2]], t: this.sim.time, conf: 0.9, src: 'team' }, me);
      const near = mates.filter((b) => !b.inCombat && b.persona).sort((p, q) => dist3(p.a.pos, pos) - dist3(q.a.pos, pos))[0];
      if (near) { near.startHunt(pos, 'sight', 14); this.bark(near.a, `Copy, going for ${e.enemy.name}`, 'ping', 2); }
      return;
    }
    // a plain ping is "look here": the nearest free bot goes, the holders turn their guns on it
    const free = mates.filter((b) => !b.inCombat && !b.a.busy && b.persona && !b.rvTarget).sort((p, q) => dist3(p.a.pos, pos) - dist3(q.a.pos, pos));
    let sent = false;
    for (const b of free) {
      const d = dist3(b.a.pos, pos);
      if (!sent && d > 3 && d < 45 && !(b.holdPost() && b.task.anchor)) { b.startHunt(pos, 'assist', 16); this.bark(b.a, 'On my way', 'ping', 2); sent = true; }
      else if (d < 30) { b.watch = [pos[0], pos[1] + 1.2, pos[2]]; b.watchT = 6; }
    }
  }
}

// ======================================================================================== reflexes (Brain mixin)
export const reflexes = {
  // ---------------------------------------------------------------- small state changes
  flinch(k) { this.rx.flinchT = Math.max(this.rx.flinchT, k); },
  nearMiss(from_, from, d) {
    const rx = this.rx, now = this.sim.time, a = this.a;
    rx.supp = Math.min(7, rx.supp + (d < 0.7 ? 1.5 : 0.9)); rx.suppFrom = [from[0], from[1], from[2]]; rx.suppT = now;
    this.flinch(d < 0.7 ? 0.6 : 0.35); this.sim.reactions.count('nearmiss');
    if (this.inCombat) return;
    // somebody is shooting at me: that is where they are
    this.watch = [from[0], from[1], from[2]]; this.watchT = Math.max(this.watchT, 3.5);
    if (!this.sense.mem.get(from_.id) || !this.sense.mem.get(from_.id).seen) this.sense.mem.set(from_.id, { id: from_.id, actor: from_, pos: [from[0], from[1] - 0.2, from[2]], vel: [0, 0, 0], t: now, seen: false, conf: 0.6, src: 'sound', kind: 'shot' });
    void a;
  },
  // a squad mate fell: remember it, and decide whether to avenge, fall back or hold
  mateFell(victim, where, spot, sure) {
    const rx = this.rx, p = this.persona, a = this.a, now = this.sim.time;
    rx.mateT = now; rx.mateAt = where; this.flinch(0.3);
    if (!p || this.inCombat || a.busy) return;
    const d = dist3(a.pos, where);
    if (d > 32) return;
    if (!spot) return;
    // everyone looks at the spot the shot probably came from
    this.watch = [spot[0], spot[1] + 1.2, spot[2]]; this.watchT = Math.max(this.watchT, 5);
    if (this.prof.tactics < 1) return;
    const hold = this.holdPost() && this.task.anchor;
    const avenge = !hold && p.push > 0.5 + (1 - p.p.team) * 0.25 && d < 24 && this.huntWilling('assist', spot);
    if (avenge) { if (this.startHunt(spot, sure ? 'chase' : 'assist', 12)) this.sim.reactions.bark(a, 'Going after them!', 'avenge', 6); return; }
    if (p.p.caution > 0.55 && d < 16) { // back off the angle that just killed somebody
      rx.fallback = { from: spot, until: now + 5 };
      this.hurtT = now; this.sense.recentHit = null; this.watch = spot;
      this.sim.reactions.bark(a, 'Fall back!', 'fallback', 6);
    }
  },
  // the bot just got a kill: the next second belongs to the corners
  afterKill(victim) {
    const rx = this.rx, now = this.sim.time; rx.killT = now; rx.killAt = [victim.pos[0], victim.pos[1], victim.pos[2]];
    const g = this.a.gun; if (g && !g.reloading && g.mag < g.def.mag * 0.7 && g.reserve > 0) rx.reloadAfter = now + 0.4;
  },
  noticeDoor(c, open, by) {
    const a = this.a, rx = this.rx, d = dist3(a.pos, c); if (d > 18) return;
    const sees = this.sim.world.visible(a.eye(), c, CAST.GLASS);
    if (!sees && d > 6) return;
    if (this.inCombat || a.busy) return;
    rx.doorAt = c; rx.doorT = this.sim.time + 2.6;
    this.watch = [c[0], c[1], c[2]]; this.watchT = Math.max(this.watchT, 2.6);
    if (open && by && sees) { // somebody opened a door in my face
      this.sense.mem.set(by.id, { id: by.id, actor: by, pos: [by.pos[0], by.pos[1] + 0.9, by.pos[2]], vel: [0, 0, 0], t: this.sim.time, seen: false, conf: 0.7, src: 'sound', kind: 'door' });
      this.sim.reactions.bark(a, 'Door!', 'door', 3);
    }
    if (this.persona && this.persona.p.caution > 0.5) rx.listenT = Math.max(rx.listenT, 2.2);
  },
  noticeHole(c, glass) {
    const a = this.a, rx = this.rx, d = dist3(a.pos, c); if (d > 24 || this.inCombat) return;
    const sees = this.sim.world.visible(a.eye(), c, CAST.GLASS);
    if (!sees && d > 12) return;
    rx.holeAt = [c[0], c[1], c[2]]; rx.holeT = this.sim.time + (glass ? 3 : 7);
    this.watch = [c[0], c[1], c[2]]; this.watchT = Math.max(this.watchT, glass ? 2 : 4);
    if (!glass) rx.listenT = Math.max(rx.listenT, 3);
  },
  // an enemy charge was stuck to a wall in front of us
  noticeDevice(dev) {
    const rx = this.rx, a = this.a; if (this.prof.tactics < 1) return;
    rx.devSeen = rx.devSeen || new Map(); if (!rx.devSeen.has(dev.id)) rx.devSeen.set(dev.id, this.sim.time + 0.2 + this.prof.reaction * 0.5);
    this.sim.reactions.bark(a, 'Charge on the wall!', 'charge', 3);
    this.watch = [dev.pos[0], dev.pos[1], dev.pos[2]]; this.watchT = Math.max(this.watchT, 3);
  },

  // ---------------------------------------------------------------- the reflex layer
  // Called every frame before the bot executes its mode. Returns a plan for the frame, or null:
  //   { kind: 'run' }   a reflex owns the legs (the mover has been given a goal)
  //   { kind: 'freeze' } stand/crouch where we are (blind, waiting out a hazard)
  //   { kind: 'turn', yaw } turn on the spot
  reflexStep(dt) {
    const a = this.a, rx = this.rx, hub = this.sim.reactions, now = this.sim.time;
    rx.flinchT = Math.max(0, rx.flinchT - dt); rx.supp = Math.max(0, rx.supp - dt * 1.1);
    if (rx.listenT > 0) rx.listenT -= dt;
    if (a.mode !== 'normal' || a.downed || !hub) return null;
    const tact = this.prof.tactics;
    // blinded: nothing to see, so do not run about
    const bl = this.blindPlan(dt); if (bl) return bl;
    if (tact >= 1) {
      const hz = this.hazardPlan(dt); if (hz) return hz;
      // sustained fire past our ears from somebody we cannot see: get out of the line
      if (rx.supp >= 3 && !this.inCombat && !a.busy && now - (rx.suppMove ?? -9) > 4.5) {
        rx.suppMove = now; rx.supp = 1.2; this.hurtT = now; this.watch = rx.suppFrom; this.watchT = 3.5; this.sim.reactions.count('suppressed');
        hub.bark(a, 'Taking fire!', 'supp', 4);
      }
      // marked by a drone, a pulse or a trap: the other side knows where we are, so do not be there for long
      if (a.status.tag > 0.5 && !this.inCombat && !a.busy && now - (rx.tagMove ?? -99) > 7 && !(this.holdPost() && this.task.anchor) && (!this.task || !['plant', 'defuse', 'reinforce', 'barricade', 'place', 'breach'].includes(this.task.type))) {
        rx.tagMove = now;
        let from = null, bd = 18;
        for (const dr of this.sim.devices.drones) { if (dr.dead || dr.team === a.team) continue; const d = dist3(dr.pos, a.pos); if (d < bd) { bd = d; from = [dr.pos[0], dr.pos[1], dr.pos[2]]; } }
        if (!from) { const m = this.sense.freshest(6); if (m) from = m.pos; }
        if (from) { this.watch = from; this.watchT = 3; this.hurtT = now; hub.count('tagmove'); hub.bark(a, "I've been spotted!", 'tag', 6); }
      }
      if (rx.fallback && now < rx.fallback.until && !this.inCombat) { rx.fallback = null; this.mode = 'react'; this.reactKind = 'fallback'; this.stateT = 0; this.watch = rx.mateAt || this.watch; this.chooseReaction(); }
      if (rx.reloadAfter && now >= rx.reloadAfter) { rx.reloadAfter = 0; if (!this.inCombat && a.gun && !a.gun.reloading && a.gun.reserve > 0) a.ctl.reload = true; }
    }
    return null;
  },
  // ---- hazards: grenades, flashes, charges, gas
  hazardPlan(dt) {
    const a = this.a, rx = this.rx, hub = this.sim.reactions, now = this.sim.time, w = this.sim.world;
    if (!hub.hazards.length) { if (rx.dodge) { rx.dodge = null; this.mover.stop(); } return null; }
    const eye = a.eye(), head = a.headPos(), chest = a.chestPos(), p = this.persona;
    let worst = null, wu = 0, wait = null;
    for (const h of hub.hazards) {
      if (h.team === a.team && !this.sim.friendlyFire) continue;
      const d = dist3(chest, h.pos);
      // aware of it yet?
      rx.seen = rx.seen || new Map();
      let at = rx.seen.get(h.id);
      if (at === undefined) {
        const warned = rx.warned && rx.warned.get(h.id) !== undefined;
        const close = d < (h.flash ? 8 : 6), sees = d < 20 && w.visible(eye, h.pos, CAST.GLASS);
        if (!(warned || close && (sees || d < 3) || sees)) continue;
        at = now + 0.14 + this.prof.reaction * 0.5 * (1.15 - (p ? p.p.caution : 0.5) * 0.35); rx.seen.set(h.id, at);
        if (!warned && !h.persistent && h.kind !== 'stun') hub.bark(a, h.kind === 'frag' ? 'Grenade!' : 'Incoming!', 'nade', 2.5);
        if (!h.persistent) for (const o of hub.bots(a.team)) if (o !== this && dist3(o.a.pos, a.pos) < 12) { o.rx.warned = o.rx.warned || new Map(); o.rx.warned.set(h.id, now); }
      }
      if (now < at) continue;
      if (h.flash) { if (d > h.r) continue; const dir = norm(sub(h.pos, head)); if (w.cast(head[0], head[1], head[2], dir[0], dir[1], dir[2], Math.max(0.1, d - 0.2), CAST.GLASS | CAST.PROPS)) continue; if (h.t < 1.7 && d > 1.2) { const u = 0.6 + (1 - d / h.r) * 0.3; if (u > wu) { wu = u; worst = h; } } continue; }
      const reach = h.r + (h.persistent ? 0.6 : 0.9);
      if (d >= reach) { if (h.persistent && d < reach + 9 && this.taskInside(h)) wait = wait || h; continue; }
      // a wall between us and the blast: it will not hurt
      const dir = norm(sub(chest, h.pos)), hit = d > 0.6 ? w.cast(h.pos[0], h.pos[1], h.pos[2], dir[0], dir[1], dir[2], d - 0.3, CAST.GLASS) : null;
      if (hit && h.kind !== 'gas' && h.kind !== 'charge' && h.kind !== 'thermite') { if (h.persistent && this.taskInside(h)) wait = wait || h; continue; } // (a charge takes the wall with it)
      const u = 1 + (1 - d / reach);
      if (u > wu) { wu = u; worst = h; }
    }
    if (!worst) {
      if (rx.dodge) { rx.dodge = null; this.mover.stop(); }
      if (wait && !this.inCombat) { this.watch = [wait.pos[0], wait.pos[1], wait.pos[2]]; this.watchT = 1; return { kind: 'freeze', crouch: true }; }
      return null;
    }
    // a flash: turn the back on it (the blind time depends on how much of the face the flash catches), or duck out of its sight
    if (worst.flash) {
      if (this.persona && this.sim.rand() > 0.35 + 0.65 * this.prof.p.nerve && !rx.flashDecided) { rx.flashDecided = worst.id; return null; } // frozen: takes it in the face
      const dc = rx.dodge && rx.dodge.id === worst.id ? rx.dodge : null;
      if (!dc) {
        const spot = this.safeSpot(worst, 4.2);
        rx.dodge = { id: worst.id, spot, until: now + worst.t, flash: true };
        if (spot) { this.mover.goTo(spot, { speed: 'run', tol: 0.5 }); hub.count('flashdive'); } else hub.count('flashturn');
      }
      const dd = rx.dodge;
      if (dd.spot && !this.mover.arrived && !this.mover.failed) return { kind: 'run', noAim: true }; // (running for cover with the back to the flash)
      // no cover to duck into: face away
      return { kind: 'turn', yaw: yawOf(a.pos[0] - worst.pos[0], a.pos[2] - worst.pos[2]), crouch: true };
    }
    // an explosion or a cloud: run to the nearest place it cannot reach
    let dd = rx.dodge;
    if (!dd || dd.id !== worst.id || now > dd.until) dd = rx.dodge = { id: worst.id, spot: null, until: now + 4.5, tried: [], n: 0 };
    if (!dd.spot || !this.mover.active) { // first look, or the last spot was reached (or given up on) and the hazard still reaches us
      if (dd.spot) dd.tried.push(dd.spot);
      if (dd.n++ < 4) {
        dd.spot = this.safeSpot(worst, 10, dd.tried);
        if (dd.spot) { this.mover.goTo(dd.spot, { speed: 'run', tol: 0.5, exact: true }); if (dd.n === 1) hub.count('dodge'); }
      } else dd.spot = null;
    }
    if (!dd.spot) { // nowhere to go: at least run directly away
      const dx = a.pos[0] - worst.pos[0], dz = a.pos[2] - worst.pos[2], l = Math.hypot(dx, dz) || 1;
      this.mover.wish = [dx / l, dz / l]; this.mover.faceYaw = yawOf(dx, dz); return { kind: 'run', direct: true };
    }
    return { kind: 'run' };
  },
  // is the place this bot has been told to stand in the reach of a lasting hazard?
  taskInside(h) {
    const t = this.task, pos = t && (t.pos || t.stand); if (!pos) return false;
    return dist3(pos, h.pos) < h.r + 0.4;
  },
  // the closest cell the hazard cannot reach: far enough away, or behind a wall (for a flash: out of its sight)
  safeSpot(h, maxRun, tried = []) {
    const a = this.a, w = this.sim.world, nav = this.sim.nav, f = nav.floorOf(a.pos[1]);
    const hp = [h.pos[0], h.pos[1] + 0.3, h.pos[2]], known = [];
    for (const m of this.sense.mem.values()) if (m.actor.alive && this.sim.time - m.t < 6) known.push(m.pos);
    let best = null, bs = -1e9;
    for (const c of cellsAround(nav, a.pos, Math.ceil(maxRun), f)) {
      const n = nav.node(Math.floor(c[0]), Math.floor(c[2]), f); if (!nav.fits(n)) continue;
      const d = Math.hypot(c[0] - a.pos[0], c[2] - a.pos[2]); if (d > maxRun) continue;
      if (tried.some((q) => Math.hypot(q[0] - c[0], q[2] - c[2]) < 2)) continue;
      const dh = Math.hypot(c[0] - h.pos[0], c[2] - h.pos[2]);
      const to = [c[0] - hp[0], c[1] + 1.1 - hp[1], c[2] - hp[2]], tl = Math.hypot(to[0], to[1], to[2]) || 1;
      const covered = tl > 0.8 && !!w.cast(hp[0], hp[1], hp[2], to[0] / tl, to[1] / tl, to[2] / tl, tl - 0.25, h.flash ? CAST.GLASS | CAST.PROPS : CAST.GLASS); // (a flash does not care about furniture)
      const safe = h.flash ? covered : (dh > h.r + 1.2 || covered);
      if (!safe) continue;
      // a straight run past the blast centre is no escape
      const seg = segDist([a.pos[0], 0, a.pos[2]], [c[0], 0, c[2]], [h.pos[0], 0, h.pos[2]]);
      let sc = -d - (seg.d < h.r * 0.55 && !h.flash ? 5 : 0) + (covered ? 1.2 : 0) + Math.min(dh, h.r + 4) * 0.25;
      for (const k of known) if (Math.hypot(k[0] - c[0], k[2] - c[2]) < 5) sc -= 3;
      if (sc > bs) { bs = sc; best = c; }
    }
    return best;
  },
  // ---- blind: stop, crouch, and answer what hits us
  blindPlan(dt) {
    const a = this.a, rx = this.rx, now = this.sim.time;
    if (a.status.blind <= 0.5) { rx.blindNote = false; return null; }
    if (!rx.blindNote) { rx.blindNote = true; this.sim.reactions.count('blinded'); this.sim.reactions.bark(a, "I can't see!", 'blind', 5); }
    const hitFresh = now - this.hurtT < 1.6 && this.sense.hitDir != null;
    let yaw = null;
    if (hitFresh) yaw = this.sense.hitDir; else { const m = this.sense.freshest(5); if (m) yaw = yawOf(m.pos[0] - a.pos[0], m.pos[2] - a.pos[2]); }
    this.mover.stop();
    // shot at while blind: fire back at where it came from
    const g = a.gun;
    if (hitFresh && g && !g.reloading && g.mag > 0 && this.sim.rand() < 0.55 + 0.3 * this.prof.p.nerve) { a.ctl.fire = g.def.auto ? true : (Math.floor(now * 9) % 2) === 0; }
    return { kind: 'freeze', crouch: true, yaw, rate: 6 };
  },
  // ---------------------------------------------------------------- applying a plan
  reflexMove(plan, dt) {
    const a = this.a, c = a.ctl;
    if (plan.crouch) c.stance = CROUCH;
    if (plan.kind === 'run') {
      this.applyWish(this.mover.wish, 'run');
      if (this.mode !== 'combat' || plan.noAim) this.faceMove(dt);
    } else if (plan.kind === 'turn') {
      this.mover.stop(); this.want.yaw = plan.yaw; this.want.pitch = 0; this.turnTo(dt, 16);
    } else if (plan.kind === 'freeze') {
      this.mover.stop();
      if (plan.yaw != null) { this.want.yaw = plan.yaw; this.want.pitch = 0; this.turnTo(dt, plan.rate || 5); }
    }
  },

  // ---------------------------------------------------------------- attention while a task runs (does not take over)
  attentionStep(dt) {
    const a = this.a, rx = this.rx, c = a.ctl, now = this.sim.time;
    if (this.prof.tactics < 1 || this.inCombat || a.busy) return;
    const still = a.vel[0] * a.vel[0] + a.vel[2] * a.vel[2] < 0.1;
    // listening: a crouched bot is quieter and steadier
    if (rx.listenT > 0 && still && c.stance === STAND) c.stance = CROUCH;
    // a hole in the wall, a door that just opened: keep the gun on it for a while
    if (still && ((rx.holeAt && now < rx.holeT) || (rx.doorAt && now < rx.doorT))) c.aim = true;
    rx.punishing = false;
  },
  // ---------------------------------------------------------------- shooting what can be shot
  // Charges, cameras and traps an enemy placed, and drones: anything we can see that is worth a few rounds.
  deviceTarget() {
    const a = this.a, sim = this.sim, eye = a.eye(), now = sim.time; let best = null, bs = -1e9;
    const rx = this.rx;
    for (const d of sim.devices.list) {
      if (d.dead || d.team === a.team || !SHOOTABLE.has(d.kind)) continue;
      if (d.kind === 'shockwire' && !d.panel) continue;
      const dd = dist3(eye, d.pos); if (dd > (CHARGES.has(d.kind) ? 24 : 16)) continue;
      if (!sim.world.visible(eye, d.pos, CAST.GLASS)) continue;
      // a charge is the most urgent target; a claymore only matters if we would walk into it
      const sc = (CHARGES.has(d.kind) ? 40 : d.kind === 'cams' || d.kind === 'turret' ? 20 : 10) - dd;
      if (sc > bs) { bs = sc; best = d; }
    }
    if (best) { rx.devSeen = rx.devSeen || new Map(); if (!rx.devSeen.has(best.id)) rx.devSeen.set(best.id, now + 0.25 + this.prof.reaction * 0.7 + (this.persona ? (1 - this.persona.p.caution) * 0.4 : 0.2)); }
    return best;
  },
  // Shoot what was found. Returns true if it took the frame.
  deviceStep(dt) {
    const a = this.a, c = a.ctl, sim = this.sim, rx = this.rx; if (this.prof.tactics < 1 || !a.gun || a.busy) return false;
    this.devCd = (this.devCd || 0) - dt;
    if (!this.devTgt || this.devTgt.dead) { if (this.devCd > 0) return false; this.devCd = 0.4; this.devTgt = this.deviceTarget(); if (!this.devTgt) return false; this.devSeenT = sim.time; sim.reactions.count('devicetarget'); }
    const d = this.devTgt, eye = a.eye(), p = d.pos;
    if (!sim.world.visible(eye, p, CAST.GLASS)) { if (sim.time - this.devSeenT > 1.4) { this.devTgt = null; return false; } } else this.devSeenT = sim.time;
    // attackers do not stand in front of a claymore or a turret to shoot it from point blank, defenders hold their ground
    const at = rx.devSeen && rx.devSeen.get(d.id); if (at && sim.time < at) return false;
    this.mover.stop();
    this.want.yaw = yawOf(p[0] - eye[0], p[2] - eye[2]); this.want.pitch = pitchOf(p[0] - eye[0], p[1] - eye[1], p[2] - eye[2]);
    const err = Math.abs(wrapAngle(this.want.yaw - a.yaw)) + Math.abs(this.want.pitch - a.pitch);
    a.yaw += clamp(wrapAngle(this.want.yaw - a.yaw), -this.prof.aimSpeed * dt * 1.4, this.prof.aimSpeed * dt * 1.4);
    a.pitch += clamp(this.want.pitch - a.pitch, -this.prof.aimSpeed * dt, this.prof.aimSpeed * dt);
    c.stance = STAND; c.aim = err < 0.2;
    if (err < 0.05 && a.gun.mag > 0 && !a.gun.reloading) c.fire = a.gun.def.auto ? (Math.floor(sim.time * 12) % 2) === 0 : (Math.floor(sim.time * 8) % 2) === 0;
    else if (a.gun.mag === 0 && a.gun.reserve > 0) c.reload = true;
    return true;
  },
  // ---------------------------------------------------------------- shooting what is only heard
  // Somebody is behind a wall we can shoot through and we are fairly sure where: send a few rounds
  // through it, the way a good player pre-fires a corner. Returns true when it took the frame.
  prefireStep(dt) {
    const a = this.a, c = a.ctl, sim = this.sim, p = this.persona, g = a.gun;
    if (!p || this.prof.tactics < 2 || !g || g.reloading || g.mag < 4 || a.busy || this.inCombat) return false;
    this.pfCd = (this.pfCd || 0) - dt;
    let tgt = this.pfTgt;
    if (!tgt) {
      if (this.pfCd > 0) return false; this.pfCd = 0.45;
      if (sim.rand() > p.p.prefire) return false;
      const now = sim.time, eye = a.eye(); let best = null, bs = -1e9;
      for (const m of this.sense.mem.values()) {
        if (!m.actor || !m.actor.alive || m.seen) continue;
        const age = now - m.t; if (age > 2.2 || m.conf < 0.45) continue;
        if (m.src !== 'sound' && m.src !== 'tag' && m.src !== 'team') continue;
        const d = dist3(eye, m.pos); if (d < 2.5 || d > 24) continue;
        const aim = [m.pos[0], Math.max(m.pos[1], a.pos[1] + 0.9), m.pos[2]];
        const line = this.softBetween(eye, aim); if (line !== 'soft') continue;
        const sc = m.conf * 3 - age - d * 0.04 + (m.src === 'tag' ? 1 : 0);
        if (sc > bs) { bs = sc; best = { m, aim }; }
      }
      if (!best) return false;
      tgt = this.pfTgt = { aim: best.aim, id: best.m.id, until: now + 1.1 + sim.rand() * 0.6, burst: 3 + Math.floor(sim.rand() * 4), t0: now };
    }
    const eye = a.eye();
    if (sim.time > tgt.until || tgt.burst <= 0 || this.softBetween(eye, tgt.aim) !== 'soft') { this.pfTgt = null; this.pfCd = 2.5 + sim.rand() * 2; return false; }
    this.mover.stop();
    this.want.yaw = yawOf(tgt.aim[0] - eye[0], tgt.aim[2] - eye[2]); this.want.pitch = pitchOf(tgt.aim[0] - eye[0], tgt.aim[1] - eye[1], tgt.aim[2] - eye[2]);
    const err = Math.abs(wrapAngle(this.want.yaw - a.yaw)) + Math.abs(this.want.pitch - a.pitch);
    a.yaw += clamp(wrapAngle(this.want.yaw - a.yaw), -this.prof.aimSpeed * dt * 1.2, this.prof.aimSpeed * dt * 1.2);
    a.pitch += clamp(this.want.pitch - a.pitch, -this.prof.aimSpeed * dt, this.prof.aimSpeed * dt);
    c.stance = STAND;
    if (err < 0.07) { const was = g.mag; c.fire = g.def.auto ? true : (Math.floor(sim.time * 8) % 2) === 0; if (a.lastShotT >= sim.time - dt * 1.5 || g.mag < was) tgt.burst--; }
    if (a.lastShotT >= sim.time - dt * 1.5) { tgt.burst--; sim.reactions.count('prefire'); }
    return true;
  },
  // 'soft' when the only things between two points are walls a bullet goes through, 'open' when there is nothing, 'hard' otherwise
  softBetween(from, to) {
    const w = this.sim.world, d = sub(to, from), l = Math.hypot(d[0], d[1], d[2]) || 1, dir = [d[0] / l, d[1] / l, d[2] / l];
    let o = from, left = l, n = 0;
    for (let i = 0; i < 3; i++) {
      const h = w.cast(o[0], o[1], o[2], dir[0], dir[1], dir[2], left, CAST.GLASS);
      if (!h) return n ? 'soft' : 'open';
      const pn = h.panel;
      if (!pn || pn.reinforced || pn.mat === 'steel' || pn.mat === 'metal' || pn.mat === 'brick' || pn.mat === 'concrete' && l > 9 || h.prop && (h.prop.absorb ?? 1) > 0.6) return 'hard';
      n++; left -= h.t + 0.25; o = [h.x + dir[0] * 0.25, h.y + dir[1] * 0.25, h.z + dir[2] * 0.25];
      if (left <= 0.3) return 'soft';
    }
    return 'hard';
  },
  // ---------------------------------------------------------------- a grenade into the hole
  // After a wall comes down or a door flies open with an enemy known to be behind it: throw something in.
  breachGrenade(dt) {
    const a = this.a, sim = this.sim, rx = this.rx, p = this.persona; if (!p || this.prof.tactics < 2 || a.busy || this.grenadeCd > 0) return false;
    if (!(rx.holeAt && sim.time < rx.holeT)) return false;
    const m = this.sense.freshest(5); if (!m || m.seen || sim.time - m.t > 4 || dist3(m.pos, rx.holeAt) > 9) return false;
    const pick = ['frag', 'impact', 'stun', 'bangs'].find((id) => { const g = a.gadget(id); return g && g.count > 0; });
    if (!pick || sim.rand() > p.p.utility * this.prof.grenades) { this.grenadeCd = 4; return false; }
    const eye = a.eye(), pos = rx.holeAt, d = Math.hypot(pos[0] - eye[0], pos[2] - eye[2]);
    if (d < 4 || d > 15 || !sim.world.visible(eye, pos, CAST.GLASS)) return false;
    const pitch = lobPitch(d, pos[1] - eye[1], 11), yaw = yawOf(pos[0] - eye[0], pos[2] - eye[2]);
    const dir = [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
    a.yaw = yaw; a.pitch = pitch;
    sim.devices.use(a, pick, { dir }); this.grenadeCd = 7 + sim.rand() * 5; rx.holeT = 0; sim.reactions.count('breachnade');
    return true;
  },
};

void CROUCH;
