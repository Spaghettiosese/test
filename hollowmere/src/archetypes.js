// Kinds of fighter beyond the ordinary guard. A person's def.arch picks one; the NPC asks it how
// much poise they have, whether they carry a shield, how they open a fight and what they do at
// range. Who fights whom (hollows against the living, the Watch against the hollows, allies at
// your side) is decided here too.
export const ARCH = {
  // a guard with a heater shield: blocks anything from the front that is not a charged blow or a kick
  shield: { name: 'Shieldbearer', hp: 95, poise: 95, speed: 0.86, offhand: 'shield', front: true, dmg: 1.05, bash: 0.3 },
  // the Gray Hand's cutthroats: quick, slippery, knives at range, smoke when hurt, poison on the blade
  knife: { name: 'Gray Hand knife', hp: 62, poise: 34, speed: 1.24, dodge: 2.8, knives: true, smoke: true, dmg: 0.9, venom: true },
  // the Choir's champions: plate over dead flesh; slow, huge blows you cannot block, a stab in the back only hurts
  knight: { name: 'Hollow Knight', hp: 240, poise: 150, speed: 0.92, unblock: 0.42, armored: true, dmg: 1.55 },
  // the Choir's singers: keep their distance, sing notes that home on you, call the dead
  cantor: { name: 'Choir Cantor', hp: 52, poise: 22, speed: 0.95, caster: true, dmg: 0.8 },
  // bosses with fighting styles of their own (see boss.js)
  duelist: { name: 'Duelist', hp: 420, poise: 160, speed: 1.15, dodge: 3.2, parry: 0.45, dmg: 1.25 },
  mistress: { name: 'The Mistress', hp: 480, poise: 170, speed: 1.12, dodge: 3.6, knives: true, venom: true, smoke: true, parry: 0.3, dmg: 1.2 },
};
export const POISE = { guard: 42, captain: 80, bandit: 38, hollow: 30, brute: 95, screamer: 18, villager: 10, noble: 10 };

// can a fight start between these two people?
export function hostile(g, a, b) {
  if (a === b || a.dead || b.dead) return false;
  const ha = a.role === 'hollow', hb = b.role === 'hollow';
  if (ha && hb) return false;
  if (ha || hb) { const o = ha ? b : a; return !o.def.ignoreHollows && !o.peaceful; }
  if (a.ally || b.ally) { const o = a.ally ? b : a; return !o.ally && o.hostile && (o.state === 'chase' || o.state === 'attack') && !o.foe; }
  const wars = g.campaign?.facts?.wars || {}; const key = [a.faction, b.faction].sort().join('|');
  return !!wars[key] && a.guard && b.guard;
}
// who is worth keeping alive whatever happens between other people: anyone with a story
const GENERIC = new Set(['guardgeneric', 'peasant', 'peasant_old', 'farmhand', 'fisher', 'miner', 'drunk1', 'cguard', 'fortguard', 'tollguard']);
export const essential = (n) => !!n.def.essential || (!!n.dialogue && !GENERIC.has(n.dialogue) && n.role !== 'hollow' && n.role !== 'bandit');
