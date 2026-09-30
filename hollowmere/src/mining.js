// Mining in Stonehollow and the smith's forge: ore pays, and Brandt reforges your blade.
const hyp = Math.hypot;
export class Mining {
  constructor(g) { this.g = g; this.veins = g.level.oreVeins || []; }
  hook(push, eye) {
    const g = this.g, P = g.player, abs = g.clock.day * 24 + g.clock.hours;
    for (const v of this.veins) {
      if (!v.ready && abs >= v.regrow) v.ready = true;
      if (!v.ready || hyp(v.x - eye[0], v.z - eye[2]) > 2.6) continue;
      push(v.x, v.y, v.z, 2.8, P.inv.has('pickaxe') ? 'Mine the ore (hold E)' : 'An ore vein. You need a pickaxe.', () => this.mine(v), 'prop', 0.4, v);
    }
  }
  mine(v) {
    const g = this.g, P = g.player; if (!P.inv.has('pickaxe')) { g.toast('You need a pickaxe (the foreman keeps one)'); g.sfx.deny?.(); return; }
    let tick = 0;
    P.startPicking(v, 1, () => {
      const n = 2 + Math.floor(Math.random() * 2); v.ready = false; v.regrow = g.clock.day * 24 + g.clock.hours + 40;
      P.inv.add('ore', n); g.stats.mined = (g.stats.mined || 0) + n; g.toast(`Mined ${n} ore`); g.progress.addXp(4, ''); g.sfx.clang?.(0.9);
    }, 'Mining', { free: true, need: 3.4, watch: (dt) => { tick -= dt; if (tick <= 0) { tick = 0.55; g.sfx.clang?.(0.6); g.noise(P.pos, 10, 'clang'); g.spark([v.x, v.y, v.z], [0, 1, 0], 4); } return P.speedNow < 0.6; } });
  }
}
export class Smith {
  constructor(g) { this.g = g; this.level = 0; }
  cost() { const L = this.level + 1; return { ore: 3 * L, gold: 40 * L }; }
  upgrade() {
    const g = this.g, P = g.player; if (this.level >= 5) { g.toast('The blade can be made no finer'); return; }
    const c = this.cost(); if (P.inv.count('ore') < c.ore || P.inv.gold < c.gold) { g.toast(`Need ${c.ore} ore and ${c.gold} gold`); g.sfx.deny?.(); return; }
    P.inv.remove('ore', c.ore); P.inv.gold -= c.gold; this.level++; g.progress.applyMods(); g.sfx.clang?.(1.2); g.sfx.coin?.(); g.ui.flashBanner('BLADE REFORGED · LEVEL ' + this.level, 1800, true); g.stats.forged = this.level;
  }
  save() { return this.level; } load(d) { this.level = d | 0; }
}
