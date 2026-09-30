// Street lamps follow the day: Lamplighter Fenn walks the street lighting them at dusk and
// putting them out at dawn. If he is gone, they change on their own, one at a time.
export class Lamps {
  constructor(g) { this.g = g; this.lamps = g.level.torches.filter((t) => t.name === 'lamp'); this.t = 0; this.applyNow(); }
  want() { return this.g.clock.between(18.8, 5.8); }
  set(t, on) { t.lit = on; if (on) t.wasLit = true; t.light.intensity = on ? t.base : 0; if (t.flame) t.flame.visible = on; }
  applyNow() { const w = this.want(); for (const t of this.lamps) this.set(t, w); }
  update(dt) {
    this.t -= dt; if (this.t > 0) return; this.t = 0.5;
    const g = this.g, w = this.want(), lp = g.npcs.find((n) => n.id === 'lamplighter');
    for (const t of this.lamps) {
      if (t.lit === w) { t.wrongT = 0; continue; }
      t.wrongT = (t.wrongT || 0) + 0.5; if (t.wrongT > 25) { this.set(t, w); continue; }
      if (lp && !lp.dead) { if (Math.hypot(lp.x - t.x, lp.z - t.z) < 3.4) { this.set(t, w); if (w) g.emitBurst([t.x, t.y, t.z], 'poof'); } }
      else if (Math.random() < 0.3) this.set(t, w);
    }
  }
}
