// What the bots remember from earlier rounds of the same match. A round's events are gathered while
// it is played and folded into the memory when it ends (older rounds fade a little each time), so the
// next round's plans can lean on them:
//   * where each side lost people          -> routes and posts there cost more
//   * where the attackers broke through    -> those walls are reinforced first, roamers watch them
//   * where the defenders were found       -> drones look there first, entries avoid them
//   * where the human fought and died      -> roamers and anchors cover the habits of the player
//   * each bot's morale                    -> confidence and tilt carry over by callsign
const CELL = 2;
const key = (x, z, f) => `${Math.floor(x / CELL)},${Math.floor(z / CELL)},${f}`;

class Heat {
  constructor() { this.m = new Map(); }
  add(pos, f, w = 1) { const k = key(pos[0], pos[2], f), e = this.m.get(k); if (e) { e.w += w; e.x = e.x * 0.7 + pos[0] * 0.3; e.z = e.z * 0.7 + pos[2] * 0.3; } else this.m.set(k, { x: pos[0], z: pos[2], f, w }); }
  fade(k = 0.65) { for (const [id, e] of this.m) { e.w *= k; if (e.w < 0.12) this.m.delete(id); } }
  merge(o) { for (const e of o.m.values()) this.add([e.x, 0, e.z], e.f, e.w); }
  get size() { return this.m.size; }
  list() { return [...this.m.values()]; }
  // extra cost for standing at (x, z) on storey f: the nearest remembered spots within 4 m
  at(x, z, f) { let c = 0; for (const e of this.m.values()) { if (e.f !== f) continue; const d = Math.hypot(e.x - x, e.z - z); if (d < 4) c += (4 - d) * 0.5 * Math.min(2.5, e.w); } return c; }
  top(n = 3) { return this.list().sort((a, b) => b.w - a.w).slice(0, n); }
}

export class MatchMemory {
  constructor() {
    this.rounds = 0; this.mood = {}; this.notes = [];
    this.deaths = { atk: new Heat(), def: new Heat() };
    this.breaches = new Heat(); this.entries = new Heat(); this.defSeen = new Heat();
    this.human = { path: new Heat(), kills: new Heat(), deaths: new Heat() };
    this.lastEntry = null; this.lastWon = null; this.cur = null;
  }
  // gather one round's events
  attach(sim) {
    const c = this.cur = { deaths: { atk: new Heat(), def: new Heat() }, breaches: new Heat(), entries: new Heat(), defSeen: new Heat(), human: { path: new Heat(), kills: new Heat(), deaths: new Heat() }, entry: null };
    const fl = (a) => Math.round(a.pos[1] / 3);
    const lose = (e) => { const a = e.actor; if (!a || !a.team) return; c.deaths[a.team].add(a.pos, fl(a), 1); if (a.isPlayer) c.human.deaths.add(a.pos, fl(a), 1); if (e.killer && e.killer.isPlayer) c.human.kills.add(e.killer.pos, fl(e.killer), 1); };
    sim.on('death', (e) => { if (!e.actor.downCredit) lose(e); }); sim.on('down', (e) => { lose(e); if (e.src && e.src.isPlayer) c.human.kills.add(e.src.pos, fl(e.src), 1); });
    sim.on('panelbreak', (e) => { if (e.panel && sim.round.phase === 'action') { const p = sim.world.panelCenter(e.panel); c.breaches.add(p, Math.round(p[1] / 3), e.panel.kind === 'glass' ? 0.3 : 1); } });
    this.sample = 0;
  }
  // called every sim step by the round (cheap: it samples a few times a second)
  tick(sim) {
    const c = this.cur; if (!c || sim.round.phase !== 'action') return;
    if (sim.time - this.sample < 1.5) return; this.sample = sim.time;
    const def = sim.map.def;
    for (const a of sim.actors) {
      if (!a.alive) continue;
      const f = Math.round(a.pos[1] / 3), inside = a.pos[0] > def.bx && a.pos[0] < def.bx + def.bw && a.pos[2] > def.bz && a.pos[2] < def.bz + def.bd;
      if (a.team === 'def') { if (Math.hypot(a.vel[0], a.vel[2]) < 0.6) c.defSeen.add(a.pos, f, 0.25); }
      else if (a.team === 'atk' && inside) { if (!c.entry) c.entry = [a.pos[0], a.pos[1], a.pos[2]]; c.entries.add(a.pos, f, 0.15); }
      if (a.isPlayer) c.human.path.add(a.pos, f, 0.2);
    }
  }
  // fold the finished round in
  commit(sim, won) {
    const c = this.cur; if (!c) return;
    for (const h of [this.deaths.atk, this.deaths.def, this.breaches, this.entries, this.defSeen, this.human.path, this.human.kills, this.human.deaths]) h.fade();
    this.deaths.atk.merge(c.deaths.atk); this.deaths.def.merge(c.deaths.def); this.breaches.merge(c.breaches); this.entries.merge(c.entries); this.defSeen.merge(c.defSeen);
    this.human.path.merge(c.human.path); this.human.kills.merge(c.human.kills); this.human.deaths.merge(c.human.deaths);
    this.lastEntry = c.entry; this.lastWon = won; this.rounds++;
    for (const a of sim.actors) if (a.ai && a.ai.persona) this.mood[a.name] = { confidence: a.ai.persona.habit.confidence * 0.5, tilt: a.ai.persona.habit.tilt * 0.5 };
    this.cur = null;
  }
  restoreMood(persona) { const m = this.mood[persona.callsign]; if (m) { persona.habit.confidence = m.confidence; persona.habit.tilt = m.tilt; } }
  // extra path cost for `team` at a spot: places where its people fell before
  danger(team, x, z, f) { return this.rounds ? this.deaths[team].at(x, z, f) : 0; }
}
