// Timed effects on the player (draughts, blessings, curses). NPC effects (blind, snare, stun,
// poison, burn, bleed) live on the NPC; this file also owns smoke clouds that blind them.
export const EFFECTS = {
  haste: { name: 'Haste', dur: 40, good: true, speed: 1.28 },
  iron: { name: 'Ironhide', dur: 70, good: true, armor: 0.4 },
  night: { name: 'Night Eye', dur: 120, good: true, night: 1 },
  ghost: { name: 'Ghostwalk', dur: 25, good: true, quiet: 0.3, vis: 0.5 },
  mend: { name: 'Mending', dur: 30, good: true, regen: 4 },
  bless: { name: 'Blessing', dur: 240, good: true, xp: 1.25, parry: 0.05 },
  curse: { name: 'Hollow Curse', dur: 100, good: false, stam: 0.6, speed: 0.9 },
  fear: { name: 'Dread', dur: 12, good: false, speed: 0.8, vis: 1.3 },
  fed: { name: 'Well Fed', dur: 120, good: true, regen: 1.5 },
  hearty: { name: 'Hearty', dur: 200, good: true, regen: 2.2, armor: 0.12, stam: 1.15 },
  sharp: { name: 'Honed Edge', dur: 300, good: true, dmg: 1.18 },
  root: { name: 'Snared', dur: 3.5, good: false, speed: 0.05 },
  venom: { name: 'Venom', dur: 8, good: false, regen: -3.2 },
};

export class Status {
  constructor(g) { this.g = g; this.fx = new Map(); this.clouds = []; }
  add(id, dur = null) {
    const e = EFFECTS[id]; if (!e) return; const d = (dur ?? e.dur) * (e.good ? 1 : (this.g.player.mod?.will ?? 1));
    this.fx.set(id, Math.max(this.fx.get(id) || 0, d));
    this.g.ui.toast(`${e.good ? '+' : '-'} ${e.name}`); this.g.sfx.veil?.();
  }
  has(id) { return (this.fx.get(id) || 0) > 0; }
  // product of a multiplicative property across active effects
  mul(key) { let v = 1; for (const [id] of this.fx) { const e = EFFECTS[id]; if (e[key] !== undefined) v *= e[key]; } return v; }
  sum(key) { let v = 0; for (const [id] of this.fx) { const e = EFFECTS[id]; if (e[key]) v += e[key]; } return v; }
  clear() { this.fx.clear(); }
  update(dt) {
    const g = this.g, P = g.player;
    for (const [id, t] of this.fx) { const n = t - dt; if (n <= 0) { this.fx.delete(id); g.ui.toast(EFFECTS[id].name + ' fades'); } else this.fx.set(id, n); }
    const rg = this.sum('regen'); if (rg && P.hp < P.maxHp && !P.dead) P.hp = Math.max(Math.min(P.hp, 1), Math.min(P.maxHp, P.hp + rg * dt));
    // smoke clouds blind whoever stands in them and hide you
    for (let i = this.clouds.length - 1; i >= 0; i--) {
      const c = this.clouds[i]; c.t -= dt;
      if (Math.random() < dt * 30) g.smoke.emit([c.x + (Math.random() - 0.5) * c.r, c.y + 0.3 + Math.random() * 1.2, c.z + (Math.random() - 0.5) * c.r], { count: 1, color: [0.45, 0.45, 0.5, 0.55], colorEnd: [0.3, 0.3, 0.35, 0], size: 0.6, grow: 2, spread: 0.3, up: 0.3, life: 2.4, jitter: 0.2 });
      for (const n of g.npcs) if (!n.dead && Math.hypot(n.x - c.x, n.z - c.z) < c.r) { n.blind = Math.max(n.blind || 0, 2.5); if (n.state === 'chase' || n.state === 'attack') { n.lostT = 6; } }
      if (c.t <= 0) this.clouds.splice(i, 1);
    }
  }
  inSmoke(p) { return this.clouds.some((c) => Math.hypot(p[0] - c.x, p[2] - c.z) < c.r); }
  smoke(at) { this.clouds.push({ x: at[0], y: at[1], z: at[2], r: 4.2, t: 8 }); this.g.noise(at, 8, 'crash'); }
  save() { return [...this.fx]; }
  load(a) { this.fx = new Map(a || []); }
}
