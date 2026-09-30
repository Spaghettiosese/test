// Everything that can be carried. `value` is what a fence would pay (counts towards your score).
export const ITEMS = {
  gold: { name: 'Gold', kind: 'currency' },
  lockpick: { name: 'Lockpick', kind: 'tool', desc: 'Opens simple locks. It sometimes snaps.' },
  potion: { name: 'Red Salve', kind: 'consumable', heal: 50, desc: 'Restores health.' },
  ember: { name: 'Ember Flask', kind: 'consumable', ember: 60, desc: 'Restores Ember.' },
  bread: { name: 'Bread', kind: 'consumable', heal: 8, value: 1 },
  cheese: { name: 'Cheese', kind: 'consumable', heal: 10, value: 2 },
  wine: { name: 'Wine', kind: 'consumable', heal: 12, value: 15 },
  ring: { name: 'Silver ring', kind: 'valuable', value: 60 },
  locket: { name: "Marta's locket", kind: 'quest', value: 40, desc: 'A tarnished locket with a child\'s portrait.' },
  gem: { name: 'Uncut gem', kind: 'valuable', value: 120 },
  book: { name: 'Old book', kind: 'valuable', value: 25, desc: 'Sell it, or read it for XP.' },
  cloth: { name: 'Bolt of cloth', kind: 'valuable', value: 15 },
  sword: { name: 'Steel sword', kind: 'valuable', value: 50 },
  dagger: { name: 'Fine dagger', kind: 'valuable', value: 30 },
  jug: { name: 'Clay jug', kind: 'valuable', value: 3 },
  mug: { name: 'Pewter mug', kind: 'valuable', value: 5 },
  candlestick: { name: 'Candlestick', kind: 'valuable', value: 14 },
  gatekey: { name: 'Gate key', kind: 'key', desc: 'Opens the great gate of Ashgate.' },
  tavernkey: { name: 'Tavern back-door key', kind: 'key' },
  cellarkey: { name: 'Cellar key', kind: 'key' },
  granarykey: { name: 'Granary key', kind: 'key' },
  servantkey: { name: "Servants' door key", kind: 'key', desc: 'Opens the kitchen door of Ravenspire.' },
  keepkey: { name: 'Keep key', kind: 'key', desc: 'Opens the great doors of Ravenspire.' },
  studykey: { name: 'Study key', kind: 'key' },
  chamberkey: { name: "Duke's chamber key", kind: 'key', desc: 'Opens the bedchamber door.' },
  dukekey: { name: "Duke's key", kind: 'key', desc: 'Small, black iron, worn smooth.' },
  mausoleumkey: { name: 'Mausoleum key', kind: 'key', desc: 'Opens the door of the mausoleum.' },
  cryptkey: { name: 'Crypt gate key', kind: 'key', desc: 'Opens the iron gate deep in the catacombs.' },
  tollkey: { name: 'Toll house key', kind: 'key', desc: 'Opens the toll house at Greywater Bridge.' },
  hexbane: { name: 'Hexbane draught', kind: 'consumable', heal: 20, ember: 40, value: 30, desc: 'Bitter. Restores some health and Ember.' },
  nightbloom: { name: 'Nightbloom', kind: 'valuable', value: 45, desc: 'A pale flower that only opens in the dark.' },
  diary: { name: 'Charred diary', kind: 'valuable', value: 8 },
  parcel: { name: 'Sealed parcel', kind: 'quest', desc: 'Gil\'s parcel for Brandt the smith. It rattles.' },
  knife: { name: 'Throwing knife', kind: 'ammo', value: 6, desc: 'Balanced for throwing. G to throw.' },
  poison: { name: 'Nightshade oil', kind: 'consumable', value: 20, desc: 'Coat your blade. 5 to apply; poisons the next five hits.' },
  firebomb: { name: 'Fire flask', kind: 'consumable', value: 25, desc: 'Wine, cloth and a spark. X to throw.' },
  sap: { name: 'Lead sap', kind: 'tool', desc: 'B swaps between blade and sap. The sap knocks out the unwary.' },
  letterfake: { name: 'Unsealed letter', kind: 'junk', value: 0, desc: 'A dull tax memorandum. Not what you came for.' },
  letter: { name: 'The Sealed Letter', kind: 'quest', desc: 'Black wax, a raven pressed into it. It is warm to the touch.' },
};
export class Inventory {
  constructor() { this.items = new Map(); this.gold = 0; this.lootValue = 0; }
  count(id) { return id === 'gold' ? this.gold : this.items.get(id) || 0; }
  has(id) { return this.count(id) > 0; }
  add(id, n = 1) {
    if (id === 'gold') { this.gold += n; this.lootValue += n; return; }
    this.items.set(id, (this.items.get(id) || 0) + n);
    const it = ITEMS[id]; if (it?.value) this.lootValue += it.value * n;
  }
  remove(id, n = 1) { if (id === 'gold') { this.gold = Math.max(0, this.gold - n); return true; } const c = this.items.get(id) || 0; if (c < n) return false; if (c === n) this.items.delete(id); else this.items.set(id, c - n); return true; }
  list() { return [...this.items.entries()].map(([id, n]) => ({ id, n, ...ITEMS[id] })); }
}
