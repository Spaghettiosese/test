// The bestiary and the deeds list. Entries unlock when you first see a kind of person or creature;
// deeds unlock from what you do. Both live in the Deeds tab of the book.
const hyp = Math.hypot;
export const CODEX = [
  { id: 'watch', name: 'Town Watch', test: (n) => n.faction === 'watch' && n.role === 'guard', text: 'Red-tabarded guards of Ashgate. They walk fixed beats, drink at the watch table and sleep in shifts. Sight is good in torchlight, weak in the dark.' },
  { id: 'keep', name: 'Ravenspire Garrison', test: (n) => n.faction === 'keep' && n.role === 'guard', text: 'Black-tabarded household troops. Better paid, more suspicious, and fond of the crossbow on the ramparts.' },
  { id: 'captain', name: 'Captain Harl', test: (n) => n.role === 'captain', text: 'Grey and scarred. Blocks half your blows and hits like a door. Do not fight him in the open.' },
  { id: 'archer', name: 'Crossbowmen', test: (n) => n.ranged && n.role !== 'hollow', text: 'They keep their distance and shoot with lead. A well-timed parry turns a bolt aside. Break line of sight.' },
  { id: 'bandit', name: 'Mirewood Bandits', test: (n) => n.role === 'bandit', text: 'Cut-purses, deserters and worse. They know their own snares and never step on them. Their chief is Red Cael.' },
  { id: 'hunter', name: 'Bounty Hunters', test: (n) => n.faction === 'hunters', text: 'Paid to bring you in. They come in pairs, one with a crossbow. They arrive when your price stays high.' },
  { id: 'hollow', name: 'The Hollow', test: (n) => n.role === 'hollow' && !n.def.hollowType, text: 'The emptied dead, risen where the bell tolled thirteen. They lie still until something living comes close.' },
  { id: 'brute', name: 'Brute Hollow', test: (n) => n.def.hollowType === 'brute', text: 'A hollow swollen by what fills it. Slow, hard to stagger, and it hits for half your health.' },
  { id: 'screamer', name: 'Screamer Hollow', test: (n) => n.def.hollowType === 'screamer', text: 'Thin and shrieking. It wakes every sleeper in earshot. Kill it first, and quickly.' },
  { id: 'villager', name: 'Townsfolk', test: (n) => n.role === 'villager', text: 'They run from violence and report what they see. A silenced witness cannot testify.' },
  { id: 'noble', name: 'The Household', test: (n) => n.role === 'noble', text: 'The Duke and those who serve him. Frightened people are the most dangerous kind.' },
];
export const DEEDS = [
  { id: 'firstblood', name: 'First Blood', desc: 'Kill anyone.', test: (g) => g.stats.kills >= 1 },
  { id: 'butcher10', name: 'Ten Down', desc: 'Kill ten people.', test: (g) => g.stats.kills >= 10 },
  { id: 'ghost', name: 'Silent Five', desc: 'Make five silent kills.', test: (g) => g.stats.stabs >= 5 },
  { id: 'parry5', name: 'Iron Wrist', desc: 'Parry five blows.', test: (g) => (g.stats.parries || 0) >= 5 },
  { id: 'ko5', name: 'Lights Out', desc: 'Knock out five people with the sap.', test: (g) => (g.stats.ko || 0) >= 5 },
  { id: 'thief5', name: 'Light Fingers', desc: 'Pick five pockets.', test: (g) => (g.stats.pick || 0) >= 5 },
  { id: 'knife3', name: 'Thrown Steel', desc: 'Kill three people with thrown knives.', test: (g) => (g.stats.knifeKills || 0) >= 3 },
  { id: 'fire3', name: 'Pyromaniac', desc: 'Burn three people to death.', test: (g) => (g.stats.fireKills || 0) >= 3 },
  { id: 'poison3', name: 'Slow Death', desc: 'Poison three people to death.', test: (g) => (g.stats.poisonKills || 0) >= 3 },
  { id: 'trap3', name: 'Snared', desc: 'Catch three people in traps.', test: (g) => (g.stats.traps || 0) >= 3 },
  { id: 'craft10', name: 'Apothecary', desc: 'Craft ten items.', test: (g) => (g.stats.crafted || 0) >= 10 },
  { id: 'herbs20', name: 'Herbalist', desc: 'Gather twenty herbs.', test: (g) => (g.stats.herbs || 0) >= 20 },
  { id: 'lore8', name: 'Chronicler', desc: 'Read eight writings.', test: (g) => [...g.story.notesFound].filter((x) => x.startsWith('l_')).length >= 8 },
  { id: 'stones', name: 'Four Lights', desc: 'Attune every waystone.', test: (g) => g.quests.lit.size >= 4 },
  { id: 'quest6', name: 'Odd Jobs', desc: 'Complete six quests or contracts.', test: (g) => Object.values(g.quests.state).filter((s) => s.status === 'done').length >= 6 },
  { id: 'lvl5', name: 'Seasoned', desc: 'Reach level 5.', test: (g) => g.progress.level >= 5 },
  { id: 'lvl10', name: 'Veteran', desc: 'Reach level 10.', test: (g) => g.progress.level >= 10 },
  { id: 'rich', name: 'Coin Purse', desc: 'Hold 400 gold.', test: (g) => g.player.inv.gold >= 400 },
  { id: 'disguise', name: 'Wolf in Watch Clothing', desc: 'Wear a guard uniform.', test: (g) => !!g.rep.disguise },
  { id: 'wanted', name: 'Notorious', desc: 'Earn a bounty of 150 gold.', test: (g) => Math.max(g.rep.total('watch'), g.rep.total('keep')) >= 150 },
  { id: 'rest', name: 'Well Rested', desc: 'Sleep in a bed.', test: (g) => (g.stats.rests || 0) >= 1 },
  { id: 'hollow10', name: 'Choir Breaker', desc: 'Put down ten hollows.', test: (g) => g.story.hollowCount >= 10 },
  { id: 'gear3', name: 'Dressed for It', desc: 'Wear three pieces of gear at once.', test: (g) => Object.keys(g.gear.eq).length >= 3 },
  { id: 'codex8', name: 'Naturalist', desc: 'Fill eight bestiary entries.', test: (g) => g.codex.seen.size >= 8 },
];
export class Codex {
  constructor(g) { this.g = g; this.seen = new Set(); this.done = new Set(); this.t = 0; this.t2 = 2; }
  update(dt) {
    const g = this.g; if (g.mode !== 'play') return;
    this.t -= dt; if (this.t <= 0) {
      this.t = 1;
      for (const n of g.npcs) { if (n.dead || n.dist > 26 || !n.visible) continue; for (const c of CODEX) if (!this.seen.has(c.id) && c.test(n)) { this.seen.add(c.id); g.ui.toast('Bestiary: ' + c.name); g.progress.addXp(4, ''); } }
    }
    this.t2 -= dt; if (this.t2 <= 0) {
      this.t2 = 2.5;
      for (const d of DEEDS) if (!this.done.has(d.id) && d.test(g)) { this.done.add(d.id); g.ui.flashBanner('DEED: ' + d.name.toUpperCase(), 2000, true); g.sfx.coin?.(); g.progress.addXp(30, ''); }
    }
  }
  save() { return { seen: [...this.seen], done: [...this.done] }; }
  load(d) { if (d) { this.seen = new Set(d.seen); this.done = new Set(d.done); } }
}
