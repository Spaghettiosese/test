// Wild plants to gather for alchemy. Hexwort grows in the Mirewood, Bogcap in the fen, Ember
// moss in the ash of Cinderwick, and Nightbloom opens only in the dark, only at the drowned shrine.
import * as E from '../../engine/index.js';

const KINDS = {
  hex: { item: 'h_hex', name: 'Hexwort', color: '#3c7a48', n: 26, rect: [-250, -150, -62, 190], cnt: [1, 2] },
  bog: { item: 'h_bog', name: 'Bogcap', color: '#8a6a4a', n: 16, rect: [-250, -268, -62, -162], cnt: [1, 2] },
  ember: { item: 'h_ember', name: 'Ember moss', color: '#c8501a', n: 16, rect: [100, -10, 250, 190], cnt: [1, 2], glow: 1.5 },
  bloom: { item: 'nightbloom', name: 'Nightbloom', color: '#9aa8ff', n: 4, near: [-190, -232, 12], cnt: [1, 1], night: true, glow: 3 },
};
export class Foraging {
  constructor(g) {
    this.g = g; this.nodes = []; this.t = 0; const rng = E.rng(777);
    this.geo = E.cone({ radius: 0.16, height: 0.32, radialSegments: 5, heightSegments: 1 });
    for (const [kind, k] of Object.entries(KINDS)) {
      let placed = 0, tries = 0;
      while (placed < k.n && tries++ < 400) {
        const x = k.near ? k.near[0] + (rng() - 0.5) * 2 * k.near[2] : k.rect[0] + rng() * (k.rect[2] - k.rect[0]), z = k.near ? k.near[1] + (rng() - 0.5) * 2 * k.near[2] : k.rect[1] + rng() * (k.rect[3] - k.rect[1]);
        if (g.nav.isBlocked(x, z) || g.nav.isBlocked(x + 0.6, z) || g.nav.isBlocked(x - 0.6, z)) continue;
        if (g.nav.indoorAt(x, z)) continue;
        const m = new E.Material({ name: k.name, color: k.color, roughness: 1, emissive: k.glow ? k.color : '#000000', emissiveStrength: k.glow || 0 });
        const mesh = new E.Mesh(this.geo, m, k.name); mesh.castShadow = false; mesh.position.set([x, g.nav.floorAt(x, z) + 0.16, z]); g.scene.add(mesh);
        this.nodes.push({ kind, k, x, z, mesh, ready: true, regrow: 0 }); placed++;
      }
    }
    g.level.interactablesForaging = true;
  }
  update(dt) {
    this.t -= dt; if (this.t > 0) return; this.t = 1;
    const g = this.g, night = g.clock.night, abs = g.clock.day * 24 + g.clock.hours;
    for (const n of this.nodes) {
      if (!n.ready && abs >= n.regrow) n.ready = true;
      n.mesh.visible = n.ready && (!n.k.night || night);
    }
  }
  hook(push, eye) {
    const g = this.g;
    for (const n of this.nodes) {
      if (!n.ready || !n.mesh.visible || Math.abs(n.x - eye[0]) > 2.6 || Math.abs(n.z - eye[2]) > 2.6) continue;
      push(n.x, n.mesh.position[1], n.z, 2.4, `Gather ${n.k.name}`, () => this.gather(n), 'prop', 0.8, n);
    }
  }
  gather(n) {
    const g = this.g, c = n.k.cnt[0] + Math.floor(Math.random() * (n.k.cnt[1] - n.k.cnt[0] + 1));
    n.ready = false; n.mesh.visible = false; n.regrow = g.clock.day * 24 + g.clock.hours + 18;
    const bonus = Math.random() < (g.player.mod?.forage || 0) ? 1 : 0; g.player.inv.add(n.k.item, c + bonus); g.toast(`Gathered ${c} ${n.k.name}`); g.sfx.pick?.(); g.player.playVm('Reach', 0.06); g.stats.herbs = (g.stats.herbs || 0) + c; g.progress.addXp(3, '');
  }
}
