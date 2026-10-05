// One round: the preparation phase, the action phase, the objective (defuser plant, area
// capture), the reinforcement budget, and the conditions that end it.
import { STOREY } from '../world/grid.js';
import { dist2 } from './util.js';

export const PHASE = { PREP: 'prep', ACTION: 'action', END: 'end' };

export class Round {
  constructor(sim, opts = {}) {
    this.sim = sim; this.o = { prep: 45, action: 180, plant: 7, defuse: 7, fuse: 45, mode: 'bomb', secureHold: 10, reinforce: 10, ...opts };
    this.phase = PHASE.PREP; this.t = this.o.prep; this.elapsed = 0; this.result = null;
    this.site = null; this.reinforcements = this.o.reinforce; this.reinforcedUnits = new Set();
    this.bomb = { state: 'idle', t: 0, spot: -1, planter: null, defuser: null, pos: null, progress: 0 };
    this.secure = { hold: 0, who: null };
    this.endT = 0; this.plantOvertime = false; this.firstBlood = null;
    this.callouts = [];
  }
  get siteCenter() { return this.site.center; }
  get bombSpots() { return [this.site.a, this.site.b]; }
  inPrep() { return this.phase === PHASE.PREP; }
  inAction() { return this.phase === PHASE.ACTION; }
  setSite(i) { this.site = this.sim.map.sites[i]; this.siteIndex = i; this.sim.emit('site', { site: this.site }); }

  // ---------------------------------------------------------------- spawning
  spawnPositions(team, spawn, n) {
    const out = [];
    if (team === 'atk') {
      const z = spawn, w = z.x1 - z.x0, h = z.z1 - z.z0, horiz = w >= h;
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n;
        out.push(horiz ? [z.x0 + w * t, 0, z.z0 + h * 0.5] : [z.x0 + w * 0.5, 0, z.z0 + h * t]);
      }
    }
    return out;
  }
  // keep each team in its start area during the preparation phase
  confine() {
    if (!this.inPrep()) return;
    const sp = this.spawn, def = this.sim.map.def;
    for (const a of this.sim.actors) {
      if (!a.alive || a.mode !== 'normal') continue;
      if (a.team === 'atk' && sp) {
        const m = 2.5;
        a.pos[0] = Math.min(Math.max(a.pos[0], sp.x0 - m), sp.x1 + m); a.pos[2] = Math.min(Math.max(a.pos[2], sp.z0 - m), sp.z1 + m);
      } else if (a.team === 'def') {
        const x0 = def.bx + 0.35, x1 = def.bx + def.bw - 0.35, z0 = def.bz + 0.35, z1 = def.bz + def.bd - 0.35;
        a.pos[0] = Math.min(Math.max(a.pos[0], x0), x1); a.pos[2] = Math.min(Math.max(a.pos[2], z0), z1);
      }
    }
  }

  // ---------------------------------------------------------------- hold actions
  // turn a wall section into steel
  reinforce(a, panel) {
    if (a.team !== 'def' || !this.inPrep()) return { ok: false, msg: 'Reinforcement only in the preparation phase' };
    if (!panel || panel.nr || !panel.dest || panel.kind !== 'wall' || !panel.unit) return { ok: false, msg: 'This wall cannot be reinforced' };
    if (this.sim.world.unitReinforced(panel.unit)) return { ok: false, msg: 'Already reinforced' };
    const extra = a.op.ability === 'extrareinforce';
    if (extra && a.extraLeft === undefined) a.extraLeft = 2;
    if (!(this.reinforcements > 0 || (extra && a.extraLeft > 0))) return { ok: false, msg: 'No reinforcements left' };
    const unit = panel.unit, dur = extra ? 1.7 : 2.8;
    a.busy = {
      kind: 'reinforce', t: 0, dur, freeze: true, unit,
      cancelIf: (x) => !x.ctl.use || !x.alive || x.status.stun > 0,
      onDone: (x) => {
        if (this.sim.world.unitReinforced(unit)) return;
        if (extra && x.extraLeft > 0) x.extraLeft--; else this.reinforcements--;
        this.sim.world.reinforceUnit(unit); x.stats.reinforced++; this.reinforcedUnits.add(unit);
        this.sim.emit('reinforce', { actor: x, unit });
      },
    };
    return { ok: true };
  }
  barricadeAct(a, panel) {
    if (a.team !== 'def') return { ok: false, msg: 'Defenders barricade' };
    if (!panel || !(panel.door || panel.kind === 'glass')) return { ok: false, msg: 'Aim at a door or window' };
    if (panel.door && panel.door.barricade > 0) return { ok: false, msg: 'Already barricaded' };
    a.busy = { kind: 'barricade', t: 0, dur: 1.5, freeze: true, cancelIf: (x) => !x.ctl.use || !x.alive, onDone: (x) => this.sim.devices.barricade(panel, { by: x }) };
    return { ok: true };
  }
  nearSpot(a) { const sp = this.bombSpots; for (let i = 0; i < 2; i++) if (dist2(a.pos, sp[i]) < 1.5 && Math.abs(a.pos[1] - sp[i][1]) < 1.5) return i; return -1; }
  startPlant(a) {
    if (a.team !== 'atk' || this.o.mode !== 'bomb' || !this.inAction() || this.bomb.state !== 'idle') return { ok: false, msg: 'Cannot plant' };
    const spot = this.nearSpot(a); if (spot < 0) return { ok: false, msg: 'Get to a bomb site marker' };
    this.bomb.state = 'planting'; this.bomb.planter = a; this.bomb.spot = spot; this.bomb.t = 0;
    this.sim.emit('plantstart', { actor: a, spot }); this.sim.noise(a.pos, 25, 'plant', a);
    a.busy = {
      kind: 'plant', t: 0, dur: this.o.plant, freeze: true, cancelIf: (x) => { const gone = !x.ctl.use || !x.alive || x.status.stun > 0; if (gone && this.bomb.state === 'planting') { this.bomb.state = 'idle'; this.bomb.planter = null; this.sim.emit('plantcancel', { actor: x }); } return gone; },
      onDone: (x) => { this.bomb.state = 'planted'; this.bomb.t = this.o.fuse; this.bomb.pos = [...this.bombSpots[spot]]; x.stats.plants++; x.stats.score += 50; this.sim.emit('planted', { actor: x, spot, pos: this.bomb.pos }); this.sim.noise(this.bomb.pos, 50, 'plant', x); },
    };
    return { ok: true };
  }
  startDefuse(a) {
    if (a.team !== 'def' || this.bomb.state !== 'planted') return { ok: false, msg: 'Nothing to defuse' };
    if (dist2(a.pos, this.bomb.pos) > 1.6 || Math.abs(a.pos[1] - this.bomb.pos[1]) > 1.5) return { ok: false, msg: 'Get to the defuser' };
    this.bomb.state = 'defusing'; this.bomb.defuser = a; this.bomb.progress = 0;
    this.sim.emit('defusestart', { actor: a });
    a.busy = {
      kind: 'defuse', t: 0, dur: this.o.defuse, freeze: true, cancelIf: (x) => { const gone = !x.ctl.use || !x.alive || x.status.stun > 0; if (gone && this.bomb.state === 'defusing') { this.bomb.state = 'planted'; this.bomb.defuser = null; this.sim.emit('defusecancel', { actor: x }); } return gone; },
      onDone: (x) => { this.bomb.state = 'defused'; x.stats.defuses++; x.stats.score += 50; this.sim.emit('defused', { actor: x }); this.end('def', 'defused'); },
    };
    return { ok: true };
  }

  // ---------------------------------------------------------------- the clock and the win conditions
  update(dt) {
    const sim = this.sim;
    if (this.phase === PHASE.END) { this.endT += dt; return; }
    this.elapsed += dt;
    this.confine();
    if (this.phase === PHASE.PREP) {
      this.t -= dt;
      if (this.t <= 0) { this.phase = PHASE.ACTION; this.t = this.o.action; sim.emit('phase', { phase: PHASE.ACTION }); }
      return;
    }
    // action phase
    this.t -= dt;
    const b = this.bomb;
    if (b.state === 'planting' && b.planter) b.progress = (b.planter.busy ? b.planter.busy.t / this.o.plant : 1);
    if (b.state === 'defusing' && b.defuser) b.progress = (b.defuser.busy ? b.defuser.busy.t / this.o.defuse : 0);
    if (b.state === 'planted' || b.state === 'defusing') {
      b.t -= dt;
      if (b.t <= 0) { b.state = 'exploded'; sim.explode(b.pos, { radius: 9, dmg: 400, power: 800, kind: 'bomb', src: null, hard: true }); sim.emit('bombexplode', {}); this.end('atk', 'exploded'); return; }
    }
    const atk = sim.alive('atk'), def = sim.alive('def');
    const downedOnly = (arr) => arr.length === 0;
    if (def.length === 0 && sim.team('def').every((x) => x.dead || x.downed)) { this.end('atk', 'elimination'); return; }
    if (atk.length === 0 && sim.team('atk').every((x) => x.dead || x.downed) && b.state !== 'planted' && b.state !== 'defusing') { this.end('def', 'elimination'); return; }
    void downedOnly;
    if (this.o.mode === 'secure') this.secureStep(dt, atk, def);
    if (this.t <= 0 && b.state !== 'planting' && b.state !== 'planted' && b.state !== 'defusing') { this.end(this.o.mode === 'secure' && this.secure.hold > 0 ? 'atk' : 'def', 'time'); }
  }
  secureStep(dt, atk, def) {
    const c = this.site.center, inside = (a) => dist2(a.pos, c) < 3.2 && Math.abs(a.pos[1] - c[1]) < 2;
    const a = atk.filter(inside), d = def.filter(inside);
    if (a.length && !d.length) { this.secure.hold += dt; if (this.secure.hold >= this.o.secureHold) this.end('atk', 'secured'); }
    else this.secure.hold = Math.max(0, this.secure.hold - dt * 2);
  }
  end(winner, reason) {
    if (this.phase === PHASE.END) return;
    this.phase = PHASE.END; this.result = { winner, reason }; this.endT = 0;
    this.sim.emit('roundend', { winner, reason });
  }
  // extra seconds of fuse remaining for the HUD
  get fuse() { return this.bomb.state === 'planted' || this.bomb.state === 'defusing' ? Math.max(0, this.bomb.t) : null; }
}
void STOREY;
