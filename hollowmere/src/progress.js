// Experience, levels and the perk tree. XP comes from kills (more for silent ones), quests,
// discoveries and lore; every level grants a perk point. Perks are plain multipliers that the
// rest of the game reads from player.mod.
export const PERKS = [
  { id: 'shadowstep', name: 'Shadowstep', max: 3, desc: 'Footsteps are 20% quieter per rank.', tree: 'Shadow' },
  { id: 'cutthroat', name: 'Cutthroat', max: 3, desc: 'Backstabs make no sound and give +8 XP per rank.', tree: 'Shadow' },
  { id: 'lockmaster', name: 'Lockmaster', max: 3, desc: 'Lockpicking is 25% faster per rank and picks rarely snap.', tree: 'Shadow' },
  { id: 'nimble', name: 'Nimble Fingers', max: 3, desc: 'Pickpocketing is easier and pays 30% more per rank.', tree: 'Shadow' },
  { id: 'sharp', name: 'Sharpened Edge', max: 3, desc: 'Sword damage +10% per rank.', tree: 'Blade' },
  { id: 'irongrip', name: 'Iron Grip', max: 3, desc: 'The parry window is 0.05 s longer per rank.', tree: 'Blade' },
  { id: 'secondwind', name: 'Second Wind', max: 3, desc: 'Killing restores 4 health per rank.', tree: 'Blade' },
  { id: 'knifework', name: 'Knifework', max: 3, desc: 'Thrown knives deal +30% damage per rank and are recovered more often.', tree: 'Blade' },
  { id: 'thickskin', name: 'Thick Skin', max: 3, desc: '+15 maximum health per rank.', tree: 'Body' },
  { id: 'fleet', name: 'Fleet of Foot', max: 3, desc: 'Stamina recovers 15% faster and sprinting costs 10% less per rank.', tree: 'Body' },
  { id: 'emberwell', name: 'Ember Well', max: 3, desc: '+20 maximum Ember per rank.', tree: 'Ember' },
  { id: 'umbral', name: 'Umbral Focus', max: 3, desc: 'Ember skills recharge 12% faster per rank.', tree: 'Ember' },
  { id: 'toxicology', name: 'Toxicology', max: 3, desc: 'Poison lasts 30% longer and bites harder per rank.', tree: 'Alchemy' },
  { id: 'pyro', name: 'Firebug', max: 2, desc: 'Fire flasks burn longer and wider.', tree: 'Alchemy' },
  { id: 'sight', name: 'Wraith Eyes', max: 2, desc: 'Wraith Sight lasts longer and shows guard cones.', tree: 'Ember' },
];

export class Progress {
  constructor(g) {
    this.g = g; this.xp = 0; this.level = 1; this.points = 0; this.perks = {}; this.total = 0;
    this.applyMods();
  }
  need(l = this.level) { return Math.round(90 + 55 * l ** 1.35); }
  rank(id) { return this.perks[id] || 0; }
  addXp(n, why = '') {
    if (n <= 0) return;
    this.xp += n; this.total += n;
    this.g.ui.toast(`+${n} XP${why ? '  ' + why : ''}`);
    while (this.xp >= this.need()) {
      this.xp -= this.need(); this.level++; this.points++;
      this.g.ui.flashBanner('LEVEL ' + this.level, 2200); this.g.sfx.bellNote?.(2); this.g.sfx.veil?.();
      const P = this.g.player; if (P) { P.hp = Math.min(P.maxHp, P.hp + 25); }
      this.g.ui.toast('Perk point gained  (P to spend)');
    }
  }
  buy(id) {
    const p = PERKS.find((x) => x.id === id); if (!p || this.points < 1 || this.rank(id) >= p.max) return false;
    this.points--; this.perks[id] = this.rank(id) + 1; this.applyMods(); this.g.sfx.coin?.(); return true;
  }
  applyMods() {
    const r = (i) => this.rank(i);
    const m = {
      quiet: 0.8 ** r('shadowstep'), cutthroat: r('cutthroat'), pick: 0.75 ** r('lockmaster'), snap: 1 - 0.3 * r('lockmaster'), nimble: r('nimble'),
      dmg: 1 + 0.1 * r('sharp'), parry: 0.05 * r('irongrip'), leech: 4 * r('secondwind'), knife: 1 + 0.3 * r('knifework'), knifeSave: 0.35 + 0.15 * r('knifework'),
      hp: 15 * r('thickskin'), stam: 1 + 0.15 * r('fleet'), sprintCost: 1 - 0.1 * r('fleet'), ember: 20 * r('emberwell'), cd: 0.88 ** r('umbral'),
      poison: 1 + 0.3 * r('toxicology'), fire: 1 + 0.35 * r('pyro'), sight: 1 + 0.5 * r('sight'),
    };
    this.g.gear?.apply(m);
    const P = this.g.player; if (!P) { this.mod = m; return; }
    P.mod = m; const hp0 = P.maxHp; P.maxHp = 120 + m.hp; P.hp += P.maxHp - hp0; P.maxEmber = 100 + m.ember; this.mod = m;
  }
  save() { return { xp: this.xp, level: this.level, points: this.points, perks: this.perks, total: this.total }; }
  load(d) { if (!d) return; Object.assign(this, { xp: d.xp, level: d.level, points: d.points, perks: d.perks || {}, total: d.total || 0 }); this.applyMods(); }
}
