// Career progression, kept in localStorage: account level and XP, per-hero statistics, medals earned
// at the end of a match, rotating daily challenges and a short match history. The sim itself never
// touches this; the end-of-match flow hands the finished sim to Career.commit().
import { HERO, HEROES, SUBCLASSES } from './heroes.js';

const KEY = 'shapewatch.career.v2';
const blankHero = () => ({ time: 0, matches: 0, wins: 0, elims: 0, assists: 0, deaths: 0, dmg: 0, heal: 0, ults: 0, shots: 0, hits: 0, crits: 0, headshots: 0, bestStreak: 0, obj: 0 });

// ------------------------------------------------------------------ medals (bronze / silver / gold thresholds per match)
export const MEDALS = [
  { id: 'elims', name: 'ELIMINATOR', desc: 'Eliminations', stat: (s) => s.elims, tiers: [8, 14, 22] },
  { id: 'dmg', name: 'HEAVY HITTER', desc: 'Damage dealt', stat: (s) => s.dmg, tiers: [4000, 7500, 12000] },
  { id: 'heal', name: 'LIFESAVER', desc: 'Healing done', stat: (s) => s.heal, tiers: [2500, 5500, 9000] },
  { id: 'crits', name: 'CRIT KING', desc: 'Critical hits', stat: (s) => s.crits, tiers: [12, 25, 45] },
  { id: 'obj', name: 'OBJECTIVE HERO', desc: 'Seconds on the objective', stat: (s) => s.obj, tiers: [30, 60, 100] },
  { id: 'streak', name: 'ON FIRE', desc: 'Best elimination streak', stat: (s) => s.bestStreak, tiers: [3, 5, 8] },
  { id: 'ult', name: 'ULTIMATE ARTIST', desc: 'Eliminations during an ultimate', stat: (s) => s.ultElims, tiers: [2, 4, 7] },
  { id: 'assist', name: 'TEAM PLAYER', desc: 'Assists', stat: (s) => s.assists, tiers: [6, 11, 18] },
  { id: 'head', name: 'SHARPSHOOTER', desc: 'Headshots', stat: (s) => s.headshots, tiers: [8, 16, 28] },
  { id: 'untouched', name: 'UNTOUCHABLE', desc: 'Eliminations without dying (min. 6)', stat: (s) => (s.deaths === 0 ? s.elims : 0), tiers: [6, 10, 16] },
];
export const TIER = ['', 'BRONZE', 'SILVER', 'GOLD'];
export const matchScore = (s) => Math.round(s.elims * 100 + s.assists * 40 + s.dmg / 10 + s.heal / 12 + s.obj * 10 + s.ultElims * 50 - s.deaths * 20);

export function earnedMedals(stats) {
  const out = [];
  for (const m of MEDALS) { const v = m.stat(stats); let tier = 0; for (let i = 0; i < 3; i++) if (v >= m.tiers[i]) tier = i + 1; if (tier) out.push({ id: m.id, name: m.name, desc: m.desc, tier, value: Math.round(v) }); }
  return out;
}

// ------------------------------------------------------------------ levels
export const xpForLevel = (lvl) => 500 + lvl * 150;
export function levelInfo(xp) {
  let lvl = 1, rest = xp; while (rest >= xpForLevel(lvl)) { rest -= xpForLevel(lvl); lvl++; }
  return { level: lvl, into: rest, need: xpForLevel(lvl), pct: rest / xpForLevel(lvl) };
}
export const TITLES = ['Rookie', 'Cadet', 'Operative', 'Veteran', 'Specialist', 'Captain', 'Commander', 'Paragon', 'Legend', 'Mythic'];
export const titleFor = (lvl) => TITLES[Math.min(TITLES.length - 1, Math.floor((lvl - 1) / 5))];

// ------------------------------------------------------------------ daily challenges
const ROLES_ = ['tank', 'damage', 'support'];
const TEMPLATES = [
  { id: 'elims', text: 'Get {n} eliminations', goals: [15, 25, 40], stat: (s) => s.elims, xp: 250 },
  { id: 'dmg', text: 'Deal {n} damage', goals: [6000, 10000, 16000], stat: (s) => s.dmg, xp: 250 },
  { id: 'heal', text: 'Heal {n} health', goals: [3000, 6000, 10000], stat: (s) => s.heal, xp: 250 },
  { id: 'crits', text: 'Land {n} critical hits', goals: [10, 20, 35], stat: (s) => s.crits, xp: 300 },
  { id: 'head', text: 'Land {n} headshot crits', goals: [6, 12, 20], stat: (s) => s.headshots, xp: 300 },
  { id: 'ults', text: 'Use {n} ultimates', goals: [3, 5, 8], stat: (s) => s.ults, xp: 200 },
  { id: 'obj', text: 'Spend {n} seconds on the objective', goals: [40, 80, 140], stat: (s) => s.obj, xp: 250 },
  { id: 'wins', text: 'Win {n} matches', goals: [1, 2, 3], stat: (s, ctx) => (ctx.won ? 1 : 0), xp: 400 },
  { id: 'assist', text: 'Get {n} assists', goals: [8, 14, 22], stat: (s) => s.assists, xp: 220 },
  { id: 'streak', text: 'Reach a {n} elimination streak', goals: [3, 5, 7], stat: (s) => s.bestStreak, xp: 280, max: true },
  { id: 'role', text: 'Play {n} matches as a {role}', goals: [1, 2, 3], stat: (s, ctx) => (ctx.role === ctx.want ? 1 : 0), xp: 260, role: true },
  { id: 'sub', text: 'Get {n} eliminations as a {sub}', goals: [8, 14, 20], stat: (s, ctx) => (ctx.sub === ctx.want ? s.elims : 0), xp: 300, sub: true },
];
const dayKey = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function rollChallenges(day) {
  const r = mulberry(day), pool = [...TEMPLATES], list = [];
  for (let i = 0; i < 3; i++) {
    const t = pool.splice(Math.floor(r() * pool.length), 1)[0], g = t.goals[Math.floor(r() * 3)], c = { id: t.id, goal: g, progress: 0, done: false, xp: t.xp + Math.round(g * 0) };
    if (t.role) { c.want = ROLES_[Math.floor(r() * 3)]; c.text = t.text.replace('{n}', g).replace('{role}', c.want.toUpperCase()); }
    else if (t.sub) { const subs = Object.keys(SUBCLASSES); c.want = subs[Math.floor(r() * subs.length)]; c.text = t.text.replace('{n}', g).replace('{sub}', c.want.toUpperCase()); }
    else c.text = t.text.replace('{n}', g);
    list.push(c);
  }
  return { day, list };
}

export class Career {
  constructor() {
    this.data = { xp: 0, matches: 0, wins: 0, losses: 0, time: 0, heroes: {}, medals: {}, history: [], challenges: null, settings: {} };
    try { const raw = localStorage.getItem(KEY); if (raw) Object.assign(this.data, JSON.parse(raw)); } catch { /* storage blocked */ }
    this.refreshChallenges();
  }
  save() { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch { /* ignore */ } }
  refreshChallenges() { const d = dayKey(); if (!this.data.challenges || this.data.challenges.day !== d) { this.data.challenges = rollChallenges(d); this.save(); } return this.data.challenges; }
  hero(id) { return (this.data.heroes[id] ||= blankHero()); }
  get level() { return levelInfo(this.data.xp); }
  // fold a finished match into the career. returns what the end screen should show
  commit(sim, me, won) {
    const s = me.stats, role = me.def.role, sub = me.def.sub, before = levelInfo(this.data.xp), medals = earnedMedals(s);
    const h = this.hero(me.hero);
    h.time += s.time; h.matches++; if (won) h.wins++; for (const k of ['elims', 'assists', 'deaths', 'dmg', 'heal', 'ults', 'shots', 'hits', 'crits', 'headshots', 'obj']) h[k] += s[k] || 0; h.bestStreak = Math.max(h.bestStreak, s.bestStreak);
    this.data.matches++; this.data.time += s.time; if (won) this.data.wins++; else this.data.losses++;
    for (const m of medals) this.data.medals[m.id] = (this.data.medals[m.id] || 0) + 1;
    // xp
    const day = dayKey(), firstWin = won && this.data.firstWinDay !== day; if (firstWin) this.data.firstWinDay = day;
    this.data.winStreak = won ? (this.data.winStreak || 0) + 1 : 0;
    const parts = [['Match completed', 120], [won ? 'Victory' : 'Effort', won ? 180 : 50], ['Eliminations', s.elims * 12], ['Assists', s.assists * 6], ['Damage', Math.round(s.dmg / 60)], ['Healing', Math.round(s.heal / 70)], ['Objective', Math.round(s.obj * 1.2)], ['Medals', medals.reduce((a, m) => a + m.tier * 20, 0)]].filter((p) => p[1] > 0);
    if (firstWin) parts.push(['First win of the day', 500]);
    const streakBonus = Math.min(0.5, Math.max(0, (this.data.winStreak - 1) * 0.1));
    // challenges
    const ctx = { won, role, sub }, done = [];
    for (const c of this.refreshChallenges().list) {
      if (c.done) continue; const t = TEMPLATES.find((x) => x.id === c.id); ctx.want = c.want; const v = t.stat(s, ctx);
      c.progress = t.max ? Math.max(c.progress, v) : c.progress + v;
      if (c.progress >= c.goal) { c.done = true; c.progress = c.goal; done.push(c); parts.push(['Challenge: ' + c.text, c.xp]); }
    }
    if (streakBonus > 0) parts.push([`Win streak ×${this.data.winStreak} (+${Math.round(streakBonus * 100)}%)`, Math.round(parts.reduce((a, p) => a + p[1], 0) * streakBonus)]);
    const gain = parts.reduce((a, p) => a + p[1], 0); this.data.xp += gain; const after = levelInfo(this.data.xp);
    const entry = { t: Date.now(), hero: me.hero, map: sim.level.name, mode: sim.modeId, won, k: s.elims, a: s.assists, d: s.deaths, xp: gain };
    this.data.history.unshift(entry); this.data.history.length = Math.min(this.data.history.length, 14);
    this.save();
    return { gain, parts, medals, before, after, leveled: after.level > before.level, challenges: done, score: matchScore(s) };
  }
  reset() { this.data = { xp: 0, matches: 0, wins: 0, losses: 0, time: 0, heroes: {}, medals: {}, history: [], challenges: null, settings: {} }; this.refreshChallenges(); this.save(); }
  topHeroes(n = 3) { return Object.entries(this.data.heroes).sort((a, b) => b[1].time - a[1].time).slice(0, n).filter(([id]) => HERO[id]); }
  totals() {
    const t = blankHero(); for (const h of Object.values(this.data.heroes)) for (const k of Object.keys(t)) if (k === 'bestStreak') t[k] = Math.max(t[k], h[k]); else t[k] += h[k] || 0;
    return t;
  }
}
export const heroList = () => HEROES;
