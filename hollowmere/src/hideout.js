// The hunter's cabin beside the old road. Lease it once and it is yours: a bed that binds your
// respawn, a stash that keeps what you cannot carry (and is safe from the gaol's confiscations),
// a workbench that squeezes extra out of a recipe, and a shelf for the trophies of your bosses.
import * as E from '../../engine/index.js';
import { ITEMS } from './items.js';

const hyp = Math.hypot;
export const LEASE = 220;
const TROPHY_COLORS = { cael: '#ff4a3a', warden: '#58ffc8', saint: '#9ac8ff' };
const TROPHY_NAMES = { cael: "Red Cael's brand", warden: "the Warden's heart-stone", saint: "the Saint's pearl" };

export class Hideout {
  constructor(g) {
    this.g = g; g.reg?.('hideout', this); g.markers?.push(this);
    this.spots = g.level.hideoutSpots; this.owned = false; this.seen = false; this.stash = new Map(); this.trophies = new Set(); this.objs = {};
    if (!this.spots) return;
    const pl = this.spots.plate;
    Object.keys(TROPHY_COLORS).forEach((id, i) => {
      const m = new E.Mesh(E.sphere({ radius: 0.11, widthSegments: 8, heightSegments: 6 }), new E.Material({ name: 'Trophy', color: TROPHY_COLORS[id], emissive: TROPHY_COLORS[id], emissiveStrength: 3, roughness: 0.3 }), 'trophy');
      m.position.set([pl[0], 1.55, pl[1] - 0.9 + i * 0.9]); m.castShadow = false; m.visible = false; g.scene.add(m); this.objs[id] = m;
    });
  }
  get door() { return this.g.level.doors.filter((d) => d.id === this.spots?.door); }
  near(p, r) { return p && hyp(p[0] - this.g.player.pos[0], p[1] - this.g.player.pos[2]) < r; }
  atStash() { return this.owned && this.near(this.spots.stash, 4.5); }
  atBench() { return this.owned && this.near(this.spots.bench, 5); }
  lease() {
    const g = this.g, inv = g.player.inv; if (this.owned) return;
    const price = Math.ceil(LEASE * (g.story.priceMul?.() ?? 1)); if (inv.gold < price) { g.toast(`The notice says ${price} gold`); g.sfx.deny?.(); return; }
    inv.gold -= price; this.owned = true; inv.add('hideoutkey', 1); for (const d of this.door) d.locked = false;
    g.sfx.coin?.(); g.sfx.lockClick?.(); g.flashText('HUNTER\'S CABIN LEASED'); g.toast('The cabin is yours: bed, stash, workbench. Sleep here to bind your waking place.'); g.progress.addXp(25, 'a home');
    g.setCheckpoint?.([this.spots.bench[0] - 2, 0.1, this.spots.bench[1] + 1.2], 0);
  }
  hook(push, eye) {
    const g = this.g, S = this.spots; if (!S) return;
    if (hyp(S.sign[0] - eye[0], S.sign[1] - eye[2]) < 6 && !this.seen) { this.seen = true; g.toast('A notice on the cabin door: LEASE 220 GOLD'); }
    if (!this.owned) { if (hyp(S.sign[0] - eye[0], S.sign[1] - eye[2]) < 3.4) push(S.sign[0], 1.4, S.sign[1], 3.4, `Lease the hunter's cabin (${Math.ceil(LEASE * (g.story.priceMul?.() ?? 1))} gold)`, () => this.lease(), 'note', 0.3, this); return; }
    if (this.near(S.stash, 2.6)) push(S.stash[0], 0.9, S.stash[1], 2.8, 'Open your stash', () => g.ui.toggleJournal('stash'), 'prop', 0.5, this);
    if (this.near(S.bench, 2.6)) push(S.bench[0], 1.0, S.bench[1], 2.8, 'Use the workbench', () => g.ui.toggleJournal('craft'), 'prop', 0.5, this);
    if (this.near(S.plate, 2.4) && this.trophies.size) push(S.plate[0], 1.5, S.plate[1], 2.6, 'Study your trophies', () => g.toast([...this.trophies].map((t) => TROPHY_NAMES[t]).join(' · ')), 'prop', 0.5, this);
  }
  addTrophy(id) { if (this.trophies.has(id)) return; this.trophies.add(id); if (this.objs[id]) this.objs[id].visible = true; this.g.toast(`A trophy for the cabin shelf: ${TROPHY_NAMES[id]}`); }
  put(id, all = false) { const inv = this.g.player.inv; if (!this.atStash() || id === 'letter' || id === 'gold') return; const n = all ? inv.count(id) : 1; if (!n || !inv.remove(id, n)) return; this.stash.set(id, (this.stash.get(id) || 0) + n); this.g.sfx.pick?.(); }
  take(id, all = false) { const c = this.stash.get(id) || 0; if (!c || !this.atStash()) return; const n = all ? c : 1; this.g.player.inv.add(id, n); if (c === n) this.stash.delete(id); else this.stash.set(id, c - n); this.g.sfx.coin?.(); }
  onRest() { const g = this.g; if (this.owned && this.near(this.spots.bench, 9)) { g.checkpoint = [this.spots.bench[0] - 2, 0.1, this.spots.bench[1] + 1.2]; g.checkpointYaw = 0; g.toast('You will wake here if you fall.'); } }
  update() {}
  marks() { const S = this.spots; if (!S || (!this.owned && !this.seen)) return []; return [{ x: S.bench[0], z: S.bench[1], shape: 'home', label: this.owned ? 'Your cabin' : 'Cabin for lease' }]; }
  html(esc) {
    const inv = this.g.player.inv, here = this.atStash();
    if (!this.owned) return `<p class="sub">Lease the hunter's cabin beside the old road (${LEASE} gold) to keep a stash.</p>`;
    const carry = inv.list().filter((i) => i.id !== 'letter'), kept = [...this.stash.entries()].map(([id, n]) => ({ id, n, ...ITEMS[id] }));
    const row = (i, act) => `<li><span>${esc(i.name || i.id)}${i.n > 1 ? ' ×' + i.n : ''}</span><span>${here ? `<button class="mini" data-act="${act}:${i.id}">${act === 'sput' ? 'store' : 'take'}</button>${i.n > 1 ? ` <button class="mini" data-act="${act}all:${i.id}">all</button>` : ''}` : ''}</span></li>`;
    return `<p class="sub">${here ? 'Your stash. It is yours alone: the Watch cannot confiscate it, and nobody reaches it but you.' : 'Come to the chest in your cabin to use the stash.'}</p>
      <div class="cols"><div><h4>Carried</h4><ul>${carry.map((i) => row(i, 'sput')).join('') || '<li><span>Nothing</span></li>'}</ul></div>
      <div><h4>Stashed (${kept.reduce((a, b) => a + b.n, 0)})</h4><ul>${kept.map((i) => row(i, 'stake')).join('') || '<li><span>Empty</span></li>'}</ul><h4>Trophies</h4><ul>${[...this.trophies].map((t) => `<li><span>${TROPHY_NAMES[t]}</span></li>`).join('') || '<li><span>None yet. Bosses leave trophies.</span></li>'}</ul></div></div>`;
  }
  save() { return { o: this.owned, s: this.seen, st: [...this.stash.entries()], tr: [...this.trophies] }; }
  load(d) { if (!d) return; this.owned = !!d.o; this.seen = !!d.s; this.stash = new Map(d.st || []); this.trophies = new Set(d.tr || []); for (const [id, m] of Object.entries(this.objs)) m.visible = this.trophies.has(id); if (this.owned) for (const x of this.door) x.locked = false; }
}
