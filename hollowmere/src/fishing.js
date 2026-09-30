// Fishing at Pellmouth's pier and shores, and cooking the catch at any fire.
const hyp = Math.hypot;
export class Fishing {
  constructor(g) { this.g = g; this.spots = g.level.fishSpots || []; }
  hook(push, eye) {
    const g = this.g, P = g.player;
    for (const s of this.spots) if (hyp(s.x - eye[0], s.z - eye[2]) < 2.6) push(s.x, s.y + 0.4, s.z, 2.8, 'Fish (hold E)', () => this.cast(s), 'prop', 0.5, s);
    const raw = P.inv.has('rawmeat') ? 'rawmeat' : P.inv.has('fish') ? 'fish' : null;
    if (raw) for (const f of g.level.fires) if (f.lit && hyp(f.x - eye[0], f.z - eye[2]) < 3) { push(f.x, f.y + 0.4, f.z, 3.2, raw === 'fish' ? 'Cook a fish' : 'Roast the venison', () => this.cook(raw), 'fire', 0.5, f); break; }
  }
  cast(s) {
    const g = this.g, P = g.player; let bite = false; const need = 3.2 + Math.random() * 3.6;
    P.startPicking(s, 1, () => this.catch(), 'Fishing', { free: true, need, watch: () => {
      const p = P.picking; if (!bite && p.t > need * 0.55) { bite = true; g.toast('A bite!'); g.sfx.splash?.(); }
      return P.speedNow < 0.6;
    } });
  }
  catch() {
    const g = this.g, P = g.player, r = Math.random(), bonus = P.mod?.forage ? 1 : 0;
    g.stats.fish = (g.stats.fish || 0) + 1; g.sfx.splash?.(); g.progress.addXp(3, '');
    if (r < 0.06) { P.inv.add('ring', 1); g.toast('Something glints in the net: a silver ring'); }
    else if (r < 0.14) { g.toast('You haul up an old boot'); P.inv.add('scrap', 1); }
    else { const n = 1 + (Math.random() < 0.2 ? 1 : 0) + bonus; P.inv.add('fish', n); g.toast(`Caught ${n} fish`); }
  }
  cook(raw = 'fish') {
    const g = this.g, P = g.player; if (!P.inv.remove(raw, 1)) return;
    const out = raw === 'fish' ? 'cookedfish' : 'cookedmeat'; P.inv.add(out, 1); g.sfx.drink?.(); g.toast(raw === 'fish' ? 'Cooked a fish' : 'Roasted the venison'); g.progress.addXp(2, ''); g.stats.cooked = (g.stats.cooked || 0) + 1;
  }
}
