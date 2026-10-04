// Choir echoes: thirteen splinters of the Choir's song, caught in violet glass when the Binder sealed
// the hill and scattered across the valley. Each hums when you are near and tells a line of the
// story. Every fourth one strengthens you; all thirteen make a charm against the Choir's voice.
import * as E from '../../engine/index.js';

const hyp = Math.hypot;
export const ECHOES = [
  { id: 'e1', at: [-31, 71.5], where: 'the chapel', text: 'We were not always a choir. Once we were a village, and we sang to keep the dark off the fields.' },
  { id: 'e2', at: [-44.5, 79], where: 'the north row of the graveyard', text: 'A child was buried here under another child\'s name. We were given the true one. We keep it still.' },
  { id: 'e3', at: [-12, 141.5], where: 'the Duke\'s study', text: 'He signed with a shaking hand. We have never been refused by a steady one.' },
  { id: 'e4', at: [104, 23], where: 'the ossuary', text: 'The bones remember the tune. Bones always remember.' },
  { id: 'e5', at: [-116, 66], where: 'the ruined tower', text: 'A sentry stood here for forty years watching for us. He saw us in the end. We saw him first.' },
  { id: 'e6', at: [-206, 89], where: 'under the witch\'s hut', text: 'Her daughter asked us for a voice. We gave her one. A gift must be paid for.' },
  { id: 'e7', at: [-188, -229], where: 'the drowned shrine', text: 'The Saint wrote our name in wax and drowned herself to keep it. Water is a poor lock.' },
  { id: 'e8', at: [4, -221], where: 'Greywater Bridge', text: 'The river carries our song to the sea. The sea has not answered yet.' },
  { id: 'e9', at: [192, 101], where: 'the plague ward', text: 'Cinderwick sang for three nights before it burned. We remember every verse.' },
  { id: 'e10', at: [196, 157], where: 'Hangman\'s Hill', text: 'The hanged do not sing. They hum.' },
  { id: 'e11', at: [-236.5, 147], where: 'the mine\'s deep cavern', text: 'The root goes down further than any miner has. It goes down to us.' },
  { id: 'e12', at: [180.5, -156.5], where: 'the end of Pellmouth pier', text: 'Some nights the lake sings back. It has learned from us.' },
  { id: 'e13', at: [-178, 314], where: 'the Rookery\'s dock', text: 'Thirteen strokes open the hour. The Binder knew the other secret: thirteen strokes can also close it.' },
];

export class Echoes {
  constructor(g) {
    this.g = g; g.reg('echoes', this); this.found = new Set(); this.nodes = []; this.t = 0;
    const M = g.level.pal, geo = E.sphere({ radius: 0.13, widthSegments: 4, heightSegments: 2 });
    for (const e of ECHOES) {
      const q = g.nav.nearestWalkable(e.at[0], e.at[1], 4) || e.at; e.x = q[0]; e.z = q[1]; e.y = g.nav.floorAt(q[0], q[1]) + 1.05;
      const m = new E.Mesh(geo, M.choirGlow || new E.Material({ name: 'Echo', color: '#c8a0ff', emissive: '#9a5cff', emissiveStrength: 5 }), 'Echo'); m.castShadow = false; m.position.set([e.x, e.y, e.z]); m.scale.set([1, 1.6, 1]); g.scene.add(m);
      const l = new E.Light('point', { color: '#a070ff', intensity: 2.6, range: 4.5, flicker: 0.3 }); l.position.set([e.x, e.y + 0.2, e.z]); g.scene.add(l); g.level.lights.push(l);
      this.nodes.push({ e, m, l });
    }
  }
  hook(push, eye) {
    for (const N of this.nodes) { const e = N.e; if (this.found.has(e.id) || Math.abs(e.x - eye[0]) > 2.6 || Math.abs(e.z - eye[2]) > 2.6) continue; push(e.x, e.y, e.z, 2.4, 'Take the Choir echo', () => this.take(e), 'quest', 0.4, null); }
  }
  take(e) {
    const g = this.g; if (this.found.has(e.id)) return; this.found.add(e.id); this.sync(); g.stats.echoes = this.found.size;
    const n = this.found.size; g.sfx.veil?.(); g.sfx.bellNote?.(2);
    g.ui.note(`CHOIR ECHO ${n} OF 13`, `Found at ${e.where}. The glass hums, and for a moment you hear it sing:\n\n"${e.text}"`);
    g.progress.addXp(20, 'a Choir echo');
    if (n % 4 === 0) { g.progress.points++; g.player.maxEmber += 5; g.toast('The echoes steady you: +1 perk point, +5 max Ember'); }
    if (n === 13) { g.player.inv.add('echocharm', 1); g.ui.flashBanner('THE CHOIR\'S OWN SONG', 2600, true); g.toast('All thirteen: the echoes fuse into a charm (equip it in the Gear tab)'); }
  }
  sync() { for (const N of this.nodes) { const got = this.found.has(N.e.id); N.m.visible = !got; N.l.intensity = got ? 0 : 2.6; } }
  update(dt) {
    this.t += dt; const P = this.g.player.pos;
    for (const N of this.nodes) { if (!N.m.visible) continue; N.m.position[1] = N.e.y + Math.sin(this.t * 1.7 + N.e.x) * 0.08; if (Math.abs(N.e.x - P[0]) < 9 && Math.abs(N.e.z - P[2]) < 9 && Math.random() < dt * 0.4) this.g.sfx.whisper?.(); }
  }
  marks() { return this.g.tools?.sightT > 0 ? this.nodes.filter((N) => !this.found.has(N.e.id)).map((N) => ({ x: N.e.x, z: N.e.z, shape: 'quest', color: '#a070ff' })) : []; }
  save() { return [...this.found]; }
  load(d) { this.found = new Set(d || []); this.sync(); }
}
