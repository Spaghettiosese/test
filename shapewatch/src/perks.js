// In-match perks. Every hero earns perk XP from damage, healing, eliminations and objective time.
// At level 2 they pick one of two minor perks, at level 3 one of two major perks (keys 1 / 2, no pause).
// Which two are offered is fixed per hero, so each hero has its own pair at each tier.
// The sim reads the chosen perks through has(u, id); the effects live next to the systems they change.
import { HERO } from './heroes.js';

export const PERK_XP = [0, 900, 2600]; // xp needed for level 2 and level 3

export const PERKS = {
  // ---- minor: small, universal
  vigor: { tier: 'minor', name: 'VIGOR', desc: '+30 max health.', icon: 'plus' },
  quickhands: { tier: 'minor', name: 'QUICK HANDS', desc: 'Reload 30% faster.', icon: 'reload' },
  focus: { tier: 'minor', name: 'FOCUS', desc: 'Ultimate charges 15% faster.', icon: 'ult' },
  stride: { tier: 'minor', name: 'STRIDE', desc: 'Move 7% faster.', icon: 'speed' },
  leech: { tier: 'minor', name: 'LEECH', desc: 'Eliminations and assists restore 60 health.', icon: 'drop' },
  tempo: { tier: 'minor', name: 'TEMPO', desc: 'Ability cooldowns are 12% shorter.', icon: 'clock' },
  // ---- tank majors
  ironhide: { tier: 'major', role: 'tank', name: 'IRON HIDE', desc: 'Armor repairs 25 per second after 3 s out of combat.', icon: 'shield' },
  juggernaut: { tier: 'major', role: 'tank', name: 'JUGGERNAUT', desc: 'Knockbacks and stuns on you are 40% weaker.', icon: 'anchor' },
  overflow: { tier: 'major', role: 'tank', name: 'OVERFLOW', desc: 'Healing past full health and armor becomes up to 120 shield.', icon: 'plus' },
  brawler: { tier: 'major', role: 'tank', name: 'BRAWLER', desc: 'Deal 15% more damage to enemies within 8 m.', icon: 'fist' },
  // ---- damage majors
  executioner: { tier: 'major', role: 'damage', name: 'EXECUTIONER', desc: 'Deal 20% more damage to enemies below 40% health.', icon: 'skull' },
  momentum: { tier: 'major', role: 'damage', name: 'MOMENTUM', desc: 'Eliminations reset your ability cooldowns.', icon: 'clock' },
  deadeye: { tier: 'major', role: 'damage', name: 'DEADEYE', desc: 'Critical hits deal 15% more damage.', icon: 'crosshair' },
  adrenaline: { tier: 'major', role: 'damage', name: 'ADRENALINE', desc: 'Eliminations give 3 s of +30% speed and heal 50.', icon: 'speed' },
  // ---- support majors
  triage: { tier: 'major', role: 'support', name: 'TRIAGE', desc: 'Heal 25% more on allies below 35% health.', icon: 'plus' },
  guardian: { tier: 'major', role: 'support', name: 'GUARDIAN', desc: 'Your heals give the target 40 overshield (once per ally every 8 s).', icon: 'shield' },
  battlemedic: { tier: 'major', role: 'support', name: 'BATTLE MEDIC', desc: 'Damage you deal heals your most hurt nearby ally for 30% of it.', icon: 'drop' },
  lifeline: { tier: 'major', role: 'support', name: 'LIFELINE', desc: 'Cooldowns recharge 25% faster while an ally near you is below half health.', icon: 'clock' },
};
const MINORS = Object.keys(PERKS).filter((k) => PERKS[k].tier === 'minor');
const MAJORS = (role) => Object.keys(PERKS).filter((k) => PERKS[k].tier === 'major' && PERKS[k].role === role);

// the two options a hero gets at a tier (stable per hero)
function hash(s) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
export function perkOptions(heroId, tier) {
  const pool = tier === 'minor' ? MINORS : MAJORS(HERO[heroId].role), h = hash(heroId + tier), a = h % pool.length;
  let b = (a + 1 + ((h >>> 8) % (pool.length - 1))) % pool.length;
  return [pool[a], pool[b]];
}
export const has = (u, id) => !!u.perks && (u.perks.minor === id || u.perks.major === id);
