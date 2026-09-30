// Treasure maps and buried caches. Each map gives a hint and a smudge on the map; take a
// shovel to the spot and dig. A few caches are cursed, and the ground does not always let go.
import * as E from '../../engine/index.js';
import { ITEMS } from './items.js';

const hyp = Math.hypot;
const SITES = [
  { id: 't_camp', at: [22, -26], hint: 'Ten paces east of where travellers burn their first fire. Under the flat grey stone.' },
  { id: 't_fort', at: [42, -102], hint: 'East of the palisade, where the ground is churned by drilling boots. A sergeant buried his savings.' },
  { id: 't_farm', at: [52, -141], hint: 'Behind the farmhouse, by the well nobody draws from. The harvest money that never reached the Duke.' },
  { id: 't_bridge', at: [-9, -214], hint: 'The west bank under the third arch of Greywater Bridge. A toll-keeper\'s nest egg.' },
  { id: 't_hunter', at: [-128, -64], hint: 'Where Wulf skins his kills, beneath the drying rack. He swears he lost a purse.' },
  { id: 't_bandit', at: [-168, 20], hint: 'Bandit camp. The ash of the big cookfire hides more than bones.' },
  { id: 't_tower', at: [-116, 61], hint: 'The ruined tower, north foot of the wall. Under the lintel that fell first.' },
  { id: 't_witch', at: [-196, 100], hint: 'Past the witch\'s stilts, a stump that has never rotted. Dig at its east side.' },
  { id: 't_cinder', at: [158, 70], hint: 'Cinderwick. The mill\'s foundation, where the ash is thinnest.' },
  { id: 't_plague', at: [186, 112], hint: 'Outside the plague ward. Not in the lime pit. Near it.' },
  { id: 't_gallows', at: [192, 154], hint: 'Where the shadows of the hanged point at noon. Seven paces along the longest.' },
  { id: 't_crypt', at: [92, 44], hint: 'Above the catacombs, between three old roots. Something was buried here before the crypt.' },
  { id: 't_pell', at: [120, -150], hint: 'Pellmouth\'s north shore, under the drying racks. A smuggler\'s cache.' },
  { id: 't_stones', at: [72, -188], hint: 'Outside the Choir Stones. Do not dig inside the ring.' },
  { id: 't_mine', at: [-221, 150], hint: 'Outside Stonehollow. Beneath the ore cart that has sat there since the collapse.' },
];
const GEAR_LOOT = ['mendring', 'nightcloak', 'sainttear', 'wolftooth', 'raven', 'embering', 'signet', 'chainvest', 'huntershood', 'softboots'];

export class Treasure {
  constructor(g) {
    this.g = g; g.reg?.('treasure', this); g.markers?.push(this);
    const nav = g.nav, rnd = E.rng(6161); this.sites = [];
    for (const s of SITES) {
      const w = nav.nearestWalkable(s.at[0], s.at[1], 10); if (!w || nav.indoorAt(w[0], w[1])) continue;
      const tier = rnd(), cursed = rnd() < 0.22;
      this.sites.push({ id: s.id, x: w[0], z: w[1], hint: s.hint, cursed, gold: Math.round(70 + tier * 260), item: rnd() < 0.55 ? GEAR_LOOT[Math.floor(rnd() * GEAR_LOOT.length)] : ['gem', 'ring', 'nightbloom'][Math.floor(rnd() * 3)], jx: (rnd() - 0.5) * 24, jz: (rnd() - 0.5) * 24 });
    }
    this.held = []; this.dug = new Set(); this.mounds = new Map();
    this.mat = new E.Material({ name: 'Fresh earth', color: '#2a1e14', roughness: 1 }); this.geo = E.cylinder({ radiusTop: 0.5, radiusBottom: 0.7, height: 0.22, radialSegments: 9 });
  }
  giveMap() {
    const g = this.g, left = this.sites.filter((s) => !this.held.includes(s.id) && !this.dug.has(s.id)); if (!left.length) return false;
    const P = g.player.pos; left.sort((a, b) => hyp(a.x - P[0], a.z - P[2]) - hyp(b.x - P[0], b.z - P[2]));
    const s = left[Math.floor(Math.random() * Math.min(left.length, 6))]; this.held.push(s.id);
    g.player.inv.add('mapscrap', 1); g.wmap.reveal(s.x + s.jx, s.z + s.jz, 26);
    g.ui.flashBanner('TREASURE MAP', 1800, true); g.toast(s.hint); g.sfx.pick?.(); g.stats.maps = (g.stats.maps || 0) + 1; return true;
  }
  byId(id) { return this.sites.find((s) => s.id === id); }
  active() { return this.held.map((id) => this.byId(id)).filter((s) => s && !this.dug.has(s.id)); }
  hook(push, eye) {
    const g = this.g, P = g.player; if (P.mount) return;
    for (const s of this.active()) {
      if (hyp(s.x - eye[0], s.z - eye[2]) > 3.6) continue;
      if (!P.inv.has('shovel')) { push(s.x, 0.3, s.z, 3.6, 'The map marks this spot (you need a shovel)', () => g.toast('You need a shovel. Vesna sells them.'), 'prop', 0.3, s); continue; }
      push(s.x, 0.3, s.z, 3.6, 'Dig here (hold E)', () => this.dig(s), 'prop', 0.3, s);
    }
  }
  dig(s) {
    const g = this.g, P = g.player; let t = 0;
    P.startPicking(s, 1, () => this.unearth(s), 'Digging', { free: true, need: 6.5, watch: (dt) => {
      t += dt; if (t > 0.9) { t = 0; g.sfx.thud?.(0.4, [s.x, 0, s.z]); g.noise([s.x, 0, s.z], 7, 'prop'); g.smoke.emit([s.x, 0.15, s.z], { count: 3, color: [0.3, 0.22, 0.14, 0.4], colorEnd: [0.3, 0.22, 0.14, 0], size: 0.12, grow: 1.5, spread: 0.3, up: 0.8, life: 0.8, jitter: 0.2 }); }
      return P.speedNow < 0.6 && P.picking;
    } });
  }
  unearth(s) {
    const g = this.g, P = g.player, nav = g.nav; this.dug.add(s.id);
    const m = new E.Mesh(this.geo, this.mat, 'mound'); m.position.set([s.x, nav.floorAt(s.x, s.z) + 0.05, s.z]); m.castShadow = false; g.scene.add(m); this.mounds.set(s.id, m);
    P.inv.remove('mapscrap', 1); P.inv.add('gold', s.gold); P.inv.add(s.item, 1); g.stats.dug = (g.stats.dug || 0) + 1; g.sfx.coin?.(); g.flashText('BURIED TREASURE');
    g.toast(`Unearthed ${s.gold} gold and ${ITEMS[s.item]?.name || s.item}`); g.progress.addXp(40, 'treasure');
    if (s.cursed) { g.toast('The earth shivers. Something was buried with it.'); setTimeout(() => { for (let i = 0; i < 2; i++) { const a = Math.random() * 6.28, q = nav.nearestWalkable(s.x + Math.sin(a) * 3.5, s.z + Math.cos(a) * 3.5, 4); if (q) g.story.spawnHollow(q[0], q[1], true, false); } }, 900); }
  }
  marks() { return this.active().map((s) => ({ x: s.x + s.jx, z: s.z + s.jz, shape: 'x', label: 'Buried treasure?', r: 26 })); }
  journal() {
    const a = this.active(); if (!a.length) return '';
    return `<h4>Treasure maps</h4><ul>${a.map((s) => `<li><span>${s.hint}</span></li>`).join('')}</ul>`;
  }
  save() { return { held: this.held, dug: [...this.dug] }; }
  load(d) { if (!d) return; this.held = d.held || []; this.dug = new Set(d.dug || []); for (const id of this.dug) { const s = this.byId(id); if (s && !this.mounds.has(id)) { const m = new E.Mesh(this.geo, this.mat, 'mound'); m.position.set([s.x, this.g.nav.floorAt(s.x, s.z) + 0.05, s.z]); m.castShadow = false; this.g.scene.add(m); this.mounds.set(id, m); } } }
}
