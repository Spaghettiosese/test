// Prayer: the chapel altar and the Choir Stones grant blessings, for a price. The stones also gamble.
const hyp = Math.hypot;
export class Shrines {
  constructor(g) {
    this.g = g; this.last = {};
    const P = g.level.pois; this.list = [];
    if (P.altar) this.list.push({ id: 'chapel', name: 'the altar of the Pale Saint', x: P.altar.x, z: P.altar.z, y: 1.2, safe: true, cost: 10 });
    if (P.stones_altar) this.list.push({ id: 'stones', name: 'the Choir Stones', x: P.stones_altar.x, z: P.stones_altar.z + 1.8, y: 1.0, safe: false, cost: 0 });
    if (P.mine_deep) this.list.push({ id: 'root', name: 'the Choir Root', x: -237.5, z: 152.3, y: 1.2, safe: false, cost: 0 });
  }
  hook(push, eye) {
    const g = this.g, abs = g.clock.day * 24 + g.clock.hours;
    for (const s of this.list) { if (hyp(s.x - eye[0], s.z - eye[2]) > 3.2) continue; const ready = abs - (this.last[s.id] ?? -99) > 24; push(s.x, s.y, s.z, 3.4, ready ? (s.safe ? `Pray at ${s.name} (${s.cost} gold)` : `Touch ${s.name}`) : 'The shrine is quiet. Come back tomorrow.', () => this.use(s, ready), 'prop', 0.3, s); }
  }
  use(s, ready) {
    const g = this.g, P = g.player; if (!ready) { g.sfx.deny?.(); return; }
    if (s.cost && P.inv.gold < s.cost) { g.toast('Not enough gold for an offering'); g.sfx.deny?.(); return; }
    P.inv.gold -= s.cost; this.last[s.id] = g.clock.day * 24 + g.clock.hours;
    if (s.safe || Math.random() < 0.55) { g.status.add('bless'); P.hp = Math.min(P.maxHp, P.hp + 30); P.ember = P.maxEmber; g.sfx.bellNote?.(1); g.progress.addXp(8, 'blessed'); }
    else { g.status.add('curse'); g.sfx.hollowCry?.(P.pos); g.ui.toast('It answers, and not kindly.'); g.noise(P.pos, 20, 'scream'); }
  }
  save() { return this.last; } load(d) { this.last = d || {}; }
}
