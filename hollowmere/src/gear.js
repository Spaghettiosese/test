// Equipment: five slots (head, body, feet, ring, charm). Gear is found, looted and bought;
// equipped pieces fold into the same modifier table the perks use.
import { ITEMS } from './items.js';

export const GEAR = {
  cowl: { name: 'Leather cowl', slot: 'head', quiet: 0.92, desc: 'Muffles breathing. Quieter footsteps.', value: 35 },
  ironcap: { name: 'Iron cap', slot: 'head', armor: 0.1, desc: 'A dented cap. Blows land softer.', value: 30 },
  huntershood: { name: 'Hunter\'s hood', slot: 'head', quiet: 0.9, vis: 0.94, desc: 'Green-grey wool. Harder to spot.', value: 45 },
  watchhelm: { name: 'Watchman\'s helm', slot: 'head', armor: 0.14, quiet: 1.05, desc: 'Guard issue. Loud but sturdy.', value: 55 },
  jerkin: { name: 'Padded jerkin', slot: 'body', armor: 0.12, desc: 'Quilted linen and wool.', value: 60 },
  chainvest: { name: 'Chain vest', slot: 'body', armor: 0.24, quiet: 1.12, desc: 'Heavy and jingling. Very protective.', value: 110 },
  nightcloak: { name: 'Night cloak', slot: 'body', vis: 0.85, quiet: 0.94, desc: 'Woven with black thread. Shadows cling to it.', value: 120 },
  leathers: { name: 'Bandit leathers', slot: 'body', armor: 0.1, dmg: 1.05, desc: 'Scarred hide cut for a fight.', value: 50 },
  softboots: { name: 'Soft boots', slot: 'feet', quiet: 0.8, desc: 'Felt soles. Your steps whisper.', value: 70 },
  greaves: { name: 'Iron greaves', slot: 'feet', armor: 0.07, quiet: 1.1, desc: 'Shin plates. Loud on stone.', value: 45 },
  hidewraps: { name: 'Deerhide wraps', slot: 'feet', quiet: 0.72, desc: 'Silent on stone and leaf alike.', value: 55 },
  hidecloak: { name: "Hunter's cloak", slot: 'body', vis: 0.86, quiet: 0.93, armor: 0.06, desc: 'Mottled hide. Breaks up your outline.', value: 90 },
  choircrown: { name: 'Crown of the Choir Root', slot: 'head', ember: 30, regen: 0.6, armor: 0.08, desc: 'Violet roots woven round a circlet. It hums, very softly, in tune with your pulse.', value: 160 },
  drownedveil: { name: 'Veil of the Drowned Saint', slot: 'body', vis: 0.76, quiet: 0.84, armor: 0.08, desc: 'Wet, weightless, and cold as a well. You are harder to look at.', value: 180 },
  redbrand: { name: "Red Cael's brand", slot: 'charm', dmg: 1.12, knife: 1.1, desc: 'An iron brand, still faintly warm. Your blows land harder.', value: 120 },
  embering: { name: 'Ring of Ember', slot: 'ring', ember: 25, desc: 'A red stone that holds warmth. +25 max Ember.', value: 90 },
  mendring: { name: 'Ring of Mending', slot: 'ring', regen: 0.9, desc: 'Slowly knits your wounds.', value: 100 },
  signet: { name: 'Thieves\' signet', slot: 'ring', nimble: 1, desc: 'Fingers move a little quicker.', value: 80 },
  wolftooth: { name: 'Wolf tooth charm', slot: 'charm', dmg: 1.08, desc: 'Sword damage +8%.', value: 65 },
  sainttear: { name: 'Saint\'s tear charm', slot: 'charm', parry: 0.06, desc: 'A pale glass drop. Longer parry window.', value: 95 },
  raven: { name: 'Raven feather', slot: 'charm', knife: 1.25, desc: 'Thrown knives fly true.', value: 60 },
};
for (const [id, g] of Object.entries(GEAR)) ITEMS[id] = { name: g.name, kind: 'gear', slot: g.slot, desc: g.desc, value: g.value };

export const SLOTS = [['head', 'Head'], ['body', 'Body'], ['feet', 'Feet'], ['ring', 'Ring'], ['charm', 'Charm']];
export class Gear {
  constructor(g) { this.g = g; this.eq = {}; }
  equip(id) {
    const d = GEAR[id]; if (!d || !this.g.player.inv.has(id) && this.eq[d.slot] !== id) return false;
    const old = this.eq[d.slot]; if (old === id) { this.unequip(d.slot); return true; }
    if (old) this.g.player.inv.add(old, 1);
    this.g.player.inv.remove(id, 1); this.eq[d.slot] = id; this.g.progress.applyMods(); this.g.sfx.coin?.(); this.g.toast('Equipped ' + d.name); return true;
  }
  unequip(slot) { const id = this.eq[slot]; if (!id) return; this.g.player.inv.add(id, 1); delete this.eq[slot]; this.g.progress.applyMods(); }
  // fold worn gear into the modifier table m
  apply(m) {
    m.armor = 0; m.vis = 1; m.regen = 0;
    for (const id of Object.values(this.eq)) {
      const d = GEAR[id]; if (!d) continue;
      if (d.quiet) m.quiet *= d.quiet; if (d.armor) m.armor += d.armor; if (d.vis) m.vis *= d.vis; if (d.dmg) m.dmg *= d.dmg; if (d.parry) m.parry += d.parry;
      if (d.ember) m.ember += d.ember; if (d.regen) m.regen += d.regen; if (d.nimble) m.nimble += d.nimble; if (d.knife) m.knife *= d.knife;
    }
  }
  save() { return this.eq; }
  load(d) { this.eq = d || {}; }
}
