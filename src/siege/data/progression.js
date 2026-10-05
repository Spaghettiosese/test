// Progression: levels and XP, renown and credits, newcomer and daily challenges, the battle
// pass, ranks, cosmetics and the shop. Everything is saved to localStorage by store.js.
import { OPERATORS, STARTER, PRICE } from './operators.js';
import { WEAPONS } from './weapons.js';

export const xpForLevel = (lvl) => 500 + 250 * (lvl - 1); // xp needed to go from lvl to lvl+1
export const levelFromXp = (xp) => { let lvl = 1, need = xpForLevel(1); while (xp >= need) { xp -= need; lvl++; need = xpForLevel(lvl); } return { level: lvl, into: xp, need }; };

export const RANKS = [
  { name: 'Copper', min: 0, color: '#b87333' }, { name: 'Bronze', min: 1200, color: '#cd7f32' }, { name: 'Silver', min: 1500, color: '#c0c6cc' }, { name: 'Gold', min: 1900, color: '#e8c24a' },
  { name: 'Platinum', min: 2300, color: '#6fd0d8' }, { name: 'Emerald', min: 2700, color: '#38c97a' }, { name: 'Diamond', min: 3100, color: '#b58cff' }, { name: 'Champion', min: 3600, color: '#ff4f6a' },
];
export const rankOf = (mmr) => { let r = RANKS[0]; for (const k of RANKS) if (mmr >= k.min) r = k; return r; };

// ---------------------------------------------------------------- challenges
// kind: the stat event that advances it; target: how many; xp / renown: rewards
export const NEWCOMER = [
  { id: 'nc_unlock', text: 'Complete the Basic Tutorial.', kind: 'tutorial_basic', target: 1, xp: 1000 },
  { id: 'nc_atkdef', text: 'Complete Attack and Defense Tutorials.', kind: 'tutorial_atkdef', target: 1, xp: 1000 },
  { id: 'nc_enlisted', text: 'Complete your first match in the Enlisted playlist.', kind: 'enlisted_match', target: 1, xp: 1000 },
];
export const DAILY_POOL = [
  { id: 'd_kills', text: 'Get 8 kills in matches.', kind: 'kill', target: 8, xp: 600, renown: 150 },
  { id: 'd_head', text: 'Score 3 headshots.', kind: 'headshot', target: 3, xp: 700, renown: 200 },
  { id: 'd_plant', text: 'Plant the defuser 2 times.', kind: 'plant', target: 2, xp: 800, renown: 250 },
  { id: 'd_defuse', text: 'Disable the defuser once.', kind: 'defuse', target: 1, xp: 800, renown: 250 },
  { id: 'd_reinf', text: 'Reinforce 6 walls.', kind: 'reinforce', target: 6, xp: 500, renown: 150 },
  { id: 'd_breach', text: 'Breach 5 wall sections.', kind: 'breach', target: 5, xp: 600, renown: 200 },
  { id: 'd_win', text: 'Win 2 rounds.', kind: 'roundwin', target: 2, xp: 600, renown: 200 },
  { id: 'd_assist', text: 'Get 5 assists.', kind: 'assist', target: 5, xp: 500, renown: 150 },
  { id: 'd_match', text: 'Complete a match.', kind: 'match', target: 1, xp: 400, renown: 120 },
  { id: 'd_hammer', text: 'Get a kill with a melee attack.', kind: 'melee', target: 1, xp: 700, renown: 200 },
  { id: 'd_revive', text: 'Revive a teammate.', kind: 'revive', target: 1, xp: 600, renown: 180 },
  { id: 'd_smoke', text: 'Throw 5 grenades.', kind: 'throw', target: 5, xp: 400, renown: 120 },
];

// ---------------------------------------------------------------- cosmetics
export const UNIFORMS = [
  { id: 'default', name: 'Standard issue', price: 0 }, { id: 'urban', name: 'Urban grey', price: 600, uni: '#4e5359', trim: '#26292d' }, { id: 'desert', name: 'Desert sand', price: 600, uni: '#8c7a58', trim: '#4a4030' },
  { id: 'arctic', name: 'Arctic white', price: 900, uni: '#aab4be', trim: '#59636d' }, { id: 'nightops', name: 'Night ops', price: 900, uni: '#1f232a', trim: '#0e1013' }, { id: 'crimson', name: 'Crimson guard', price: 1500, uni: '#6a2a2a', trim: '#2a1212', credit: true },
  { id: 'gold', name: 'Gilded', price: 2500, uni: '#8a7430', trim: '#3e3414', credit: true },
];
export const HEADGEAR = [
  { id: 'default', name: 'Standard', price: 0 }, { id: 'helmet', name: 'Combat helmet', price: 500, head: 'helmet' }, { id: 'cap', name: 'Field cap', price: 300, head: 'cap' }, { id: 'beret', name: 'Beret', price: 300, head: 'beret' },
  { id: 'hood', name: 'Hood', price: 400, head: 'hood' }, { id: 'balaclava', name: 'Balaclava', price: 400, head: 'balaclava' }, { id: 'gasmask', name: 'Gas mask', price: 800, head: 'gasmask' }, { id: 'headband', name: 'Headband', price: 250, head: 'headband' },
];
export const WEAPON_SKINS = [
  { id: 'default', name: 'Factory', price: 0 }, { id: 'tan', name: 'Flat dark earth', price: 500, tint: '#8a7a5a' }, { id: 'olive', name: 'Olive drab', price: 500, tint: '#4f5a3c' }, { id: 'arctic', name: 'Arctic camo', price: 800, tint: '#aab4be' },
  { id: 'crimson', name: 'Crimson', price: 1200, tint: '#8a2a2a' }, { id: 'cobalt', name: 'Cobalt', price: 1200, tint: '#2a4f8a' }, { id: 'gold', name: 'Gold plated', price: 3000, tint: '#c8a030', credit: true },
];
export const CHARMS = ['Brass casing', 'Tiny drone', 'Stuffed bear', 'Dog tag', 'Skull', 'Lucky clover', 'Dice', 'Compass', 'Whistle', 'Dagger', 'Rubber duck', 'Siege star'].map((n, i) => ({ id: 'charm' + i, name: n, price: 200 + i * 80, icon: ['◉', '✈', '♥', '▤', '☠', '♣', '⚃', '✜', '♪', '†', '♟', '★'][i] }));
export const TITLES = [{ id: 'recruit', name: 'Recruit', price: 0 }, { id: 'breacher', name: 'Wall Breaker', price: 400 }, { id: 'anchor', name: 'Unmovable', price: 400 }, { id: 'sharp', name: 'Sharpshooter', price: 600 }, { id: 'cleaner', name: 'Room Cleaner', price: 600 }, { id: 'veteran', name: 'Veteran', price: 1000 }, { id: 'legend', name: 'Living Legend', price: 2500 }];
export const BANNERS = [{ id: 'steel', name: 'Brushed steel', price: 0, c1: '#2b3036', c2: '#454c55' }, { id: 'dusk', name: 'Harbor dusk', price: 300, c1: '#2a1f3a', c2: '#b55a3a' }, { id: 'ice', name: 'Ice', price: 300, c1: '#1c3a52', c2: '#7fc0e0' }, { id: 'jungle', name: 'Overgrown', price: 400, c1: '#1c3a26', c2: '#5a9a52' }, { id: 'ember', name: 'Ember', price: 600, c1: '#3a1410', c2: '#ff6a2a' }, { id: 'royal', name: 'Royal', price: 900, c1: '#241a4a', c2: '#e8c24a' }];

// ---------------------------------------------------------------- battle pass
export const PASS_TIERS = 40, PASS_XP = 1000;
export function passRewards() {
  const out = [];
  const cos = [...UNIFORMS.slice(1).map((u) => ({ type: 'uniform', id: u.id, name: u.name })), ...WEAPON_SKINS.slice(1).map((u) => ({ type: 'skin', id: u.id, name: u.name })), ...CHARMS.slice(0, 6).map((c) => ({ type: 'charm', id: c.id, name: c.name })), ...HEADGEAR.slice(1, 5).map((h) => ({ type: 'headgear', id: h.id, name: h.name })), ...TITLES.slice(1, 4).map((t) => ({ type: 'title', id: t.id, name: t.name }))];
  for (let t = 1; t <= PASS_TIERS; t++) {
    const free = t % 5 === 0 ? { type: 'renown', amount: 300 + t * 20, name: `${300 + t * 20} Renown` } : t % 3 === 0 ? { type: 'booster', amount: 1, name: 'XP booster (+25%, 1 match)' } : { type: 'renown', amount: 100 + t * 5, name: `${100 + t * 5} Renown` };
    const prem = t % 10 === 0 ? { type: 'credits', amount: 200, name: '200 Credits' } : cos[(t * 3) % cos.length] || { type: 'renown', amount: 400, name: '400 Renown' };
    out.push({ tier: t, free, premium: prem });
  }
  return out;
}

// ---------------------------------------------------------------- shop
export function shopItems() {
  const items = [];
  for (const o of OPERATORS) if (!STARTER.includes(o.id)) items.push({ id: 'op:' + o.id, kind: 'operator', name: o.name, sub: `${o.side === 'atk' ? 'Attacker' : 'Defender'} · ${o.role}`, price: PRICE(o), currency: 'renown', op: o.id });
  for (const u of UNIFORMS.slice(1)) items.push({ id: 'uniform:' + u.id, kind: 'uniform', name: u.name + ' uniform', sub: 'All operators', price: u.price, currency: u.credit ? 'credits' : 'renown' });
  for (const u of HEADGEAR.slice(1)) items.push({ id: 'head:' + u.id, kind: 'headgear', name: u.name, sub: 'Headgear', price: u.price, currency: 'renown' });
  for (const u of WEAPON_SKINS.slice(1)) items.push({ id: 'skin:' + u.id, kind: 'skin', name: u.name + ' weapon skin', sub: 'All weapons', price: u.price, currency: u.credit ? 'credits' : 'renown' });
  for (const c of CHARMS) items.push({ id: 'charm:' + c.id, kind: 'charm', name: c.name + ' charm', sub: 'Weapon charm', price: c.price, currency: 'renown' });
  for (const t of TITLES.slice(1)) items.push({ id: 'title:' + t.id, kind: 'title', name: 'Title: ' + t.name, sub: 'Player card', price: t.price, currency: 'renown' });
  for (const b of BANNERS.slice(1)) items.push({ id: 'banner:' + b.id, kind: 'banner', name: b.name + ' banner', sub: 'Player card', price: b.price, currency: 'renown' });
  for (const w of Object.values(WEAPONS)) if (w.price > 0) items.push({ id: 'weapon:' + w.id, kind: 'weapon', name: w.label, sub: 'Weapon', price: w.price, currency: 'renown', weapon: w.id });
  items.push({ id: 'pass', kind: 'pass', name: 'Premium battle pass', sub: 'Unlocks the premium track', price: 1200, currency: 'credits' });
  return items;
}

export const DEFAULT_PROFILE = () => ({
  version: 1, name: 'Operator', title: 'recruit', banner: 'steel', xp: 0, renown: 300, credits: 100, mmr: 0, placement: 0,
  unlockedOps: [...STARTER], weapons: Object.values(WEAPONS).filter((w) => w.price === 0).map((w) => w.id), owned: { uniform: ['default'], headgear: ['default'], skin: ['default'], charm: [], title: ['recruit'], banner: ['steel'] },
  equipped: { uniform: 'default', headgear: 'default', skin: 'default', charm: null }, opLoadouts: {}, fav: { atk: 'hammer', def: 'anvil' },
  stats: { matches: 0, wins: 0, losses: 0, roundsWon: 0, roundsLost: 0, kills: 0, deaths: 0, assists: 0, headshots: 0, shots: 0, hits: 0, plants: 0, defuses: 0, reinforced: 0, breached: 0, seconds: 0, damage: 0, opPlays: {}, opKills: {}, revives: 0, throws: 0, melee: 0 },
  history: [], newcomer: { nc_unlock: 0, nc_atkdef: 0, nc_enlisted: 0, done: {} }, daily: { day: '', list: [] }, pass: { premium: false, claimedFree: [], claimedPrem: [] }, seenOps: [], boosters: 0,
  tutorial: { basic: false, attack: false, defense: false, step: 0 }, notifications: [],
});
export const DEFAULT_SETTINGS = () => ({
  sens: 1, adsSens: 0.85, fov: 74, invertY: false, aimToggle: false, volume: 0.6, musicVol: 0.5, voice: true, subtitles: true, quality: 'high', renderScale: 1, chromatic: false, grain: true,
  crosshair: 'dot', crosshairColor: '#ffffff', hitMarker: true, damageNumbers: false, colorblind: 'off', difficulty: 2, tod: 'day', prep: 45, action: 180, rounds: 3, keys: null, specThird: true, showFps: false, hudScale: 1, playerName: 'Operator', down: true, friendlyFire: false, mode: 'bomb',
});
export function dailyList(rand, dayKey) {
  const pool = DAILY_POOL.slice(); const out = [];
  let s = 0; for (const ch of dayKey) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  while (out.length < 3 && pool.length) out.push({ ...pool.splice(Math.floor(r() * pool.length), 1)[0], progress: 0, claimed: false });
  void rand;
  return out;
}
