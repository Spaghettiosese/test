// Saves the player's profile and settings in localStorage (when it is available) and applies
// rewards: XP and levels, challenge progress, purchases, battle pass claims and match results.
import { DEFAULT_PROFILE, DEFAULT_SETTINGS, NEWCOMER, dailyList, levelFromXp, rankOf, shopItems, passRewards, PASS_XP, PASS_TIERS, UNIFORMS, HEADGEAR, WEAPON_SKINS, TITLES, BANNERS, CHARMS } from './progression.js';
import { DEFAULT_KEYS } from '../game/player.js';

const KEY = 'siegeforge.v1';

export class Store {
  constructor() {
    this.profile = DEFAULT_PROFILE(); this.settings = DEFAULT_SETTINGS(); this.listeners = new Set();
    this.load();
    this.settings.keys = { ...DEFAULT_KEYS, ...(this.settings.keys || {}) };
    this.refreshDaily();
  }
  load() {
    try {
      const raw = localStorage.getItem(KEY); if (!raw) return;
      const o = JSON.parse(raw);
      this.profile = merge(DEFAULT_PROFILE(), o.profile || {}); this.settings = merge(DEFAULT_SETTINGS(), o.settings || {});
    } catch { /* private mode or corrupt: start fresh */ }
  }
  save() { try { localStorage.setItem(KEY, JSON.stringify({ profile: this.profile, settings: this.settings })); } catch { /* storage unavailable */ } this.emit(); }
  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit() { for (const f of this.listeners) f(); }
  reset() { this.profile = DEFAULT_PROFILE(); this.refreshDaily(); this.save(); }
  refreshDaily() {
    const key = new Date().toISOString().slice(0, 10);
    if (this.profile.daily.day !== key) { this.profile.daily = { day: key, list: dailyList(Math.random, key) }; this.save(); }
  }

  // ---- level and currencies
  get level() { return levelFromXp(this.profile.xp); }
  get rank() { return rankOf(this.profile.mmr); }
  addXp(n) {
    const p = this.profile, before = levelFromXp(p.xp).level, boost = p.boosters > 0 ? 1.25 : 1;
    p.xp += Math.round(n * boost); const after = levelFromXp(p.xp).level; const ups = [];
    for (let l = before + 1; l <= after; l++) { const r = { level: l, renown: 250 + l * 25, credits: l % 5 === 0 ? 50 : 0 }; p.renown += r.renown; p.credits += r.credits; ups.push(r); }
    this.save(); return ups;
  }
  addRenown(n) { this.profile.renown += n; this.save(); }
  spend(cur, n) { if (this.profile[cur] < n) return false; this.profile[cur] -= n; this.save(); return true; }

  // ---- challenges: a stat event advances every matching challenge
  track(kind, n = 1) {
    const p = this.profile, done = [];
    for (const c of NEWCOMER) if (c.kind === kind && !p.newcomer.done[c.id]) { p.newcomer[c.id] = Math.min(c.target, (p.newcomer[c.id] || 0) + n); if (p.newcomer[c.id] >= c.target) { p.newcomer.done[c.id] = true; done.push(c); } }
    for (const c of p.daily.list) if (c.kind === kind && !c.claimed && c.progress < c.target) { c.progress = Math.min(c.target, c.progress + n); if (c.progress >= c.target) done.push(c); }
    if (done.length) this.save();
    return done;
  }
  claimDaily(id) { const c = this.profile.daily.list.find((x) => x.id === id); if (!c || c.claimed || c.progress < c.target) return null; c.claimed = true; this.addRenown(c.renown); return this.addXp(c.xp); }
  newcomerReward(id) { const c = NEWCOMER.find((x) => x.id === id); if (!c) return []; return this.addXp(c.xp); }

  // ---- ownership and shop
  owns(kind, id) { const p = this.profile; if (kind === 'operator') return p.unlockedOps.includes(id); if (kind === 'weapon') return p.weapons.includes(id); return (p.owned[kind] || []).includes(id); }
  buy(item) {
    const p = this.profile; if (item.kind === 'pass') { if (p.pass.premium) return 'You already own the premium pass'; if (!this.spend(item.currency, item.price)) return 'Not enough ' + item.currency; p.pass.premium = true; this.save(); return null; }
    const [kind, id] = item.id.split(':'); const k = kind === 'op' ? 'operator' : kind === 'head' ? 'headgear' : kind;
    if (this.owns(k, id)) return 'Already owned';
    if (!this.spend(item.currency, item.price)) return 'Not enough ' + item.currency;
    this.grant(k, id); return null;
  }
  grant(kind, id) {
    const p = this.profile;
    if (kind === 'operator') { if (!p.unlockedOps.includes(id)) p.unlockedOps.push(id); }
    else if (kind === 'weapon') { if (!p.weapons.includes(id)) p.weapons.push(id); }
    else { const k = kind === 'head' ? 'headgear' : kind; (p.owned[k] ||= []); if (!p.owned[k].includes(id)) p.owned[k].push(id); }
    this.save();
  }
  equip(kind, id) { this.profile.equipped[kind] = id; this.save(); }
  look(opLook) { // the operator's look with the equipped cosmetics applied
    const eq = this.profile.equipped, out = { ...opLook }, u = UNIFORMS.find((x) => x.id === eq.uniform), h = HEADGEAR.find((x) => x.id === eq.headgear);
    if (u && u.uni) { out.uni = u.uni; out.trim = u.trim; }
    if (h && h.head) out.head = h.head;
    return out;
  }
  skinTint() { const s = WEAPON_SKINS.find((x) => x.id === this.profile.equipped.skin); return s && s.tint ? s.tint : null; }

  // ---- battle pass
  get passXp() { return this.profile.xp; }
  passTier() { return Math.min(PASS_TIERS, Math.floor((this.profile.xp % (PASS_XP * PASS_TIERS)) / PASS_XP)); }
  claimPass(tier, track) {
    const p = this.profile, r = passRewards()[tier - 1]; if (!r || tier > this.passTier()) return null;
    const list = track === 'premium' ? p.pass.claimedPrem : p.pass.claimedFree; if (list.includes(tier)) return null;
    if (track === 'premium' && !p.pass.premium) return null;
    const rw = r[track === 'premium' ? 'premium' : 'free']; list.push(tier);
    if (rw.type === 'renown') p.renown += rw.amount; else if (rw.type === 'credits') p.credits += rw.amount; else if (rw.type === 'booster') p.boosters += rw.amount;
    else this.grant(rw.type === 'headgear' ? 'headgear' : rw.type, rw.id);
    this.save(); return rw;
  }

  // ---- end of a match: stats, xp, renown, history
  recordMatch(res) {
    const p = this.profile, s = p.stats, me = res.me;
    s.matches++; if (res.won) s.wins++; else if (!res.draw) s.losses++;
    s.roundsWon += res.roundsWon; s.roundsLost += res.roundsLost; s.seconds += res.seconds || 0;
    for (const k of ['kills', 'deaths', 'assists', 'headshots', 'shots', 'hits', 'plants', 'defuses', 'reinforced', 'breached', 'damage']) s[k] += me[k] || 0;
    s.opPlays[res.op] = (s.opPlays[res.op] || 0) + 1; s.opKills[res.op] = (s.opKills[res.op] || 0) + (me.kills || 0);
    if (res.ranked) { p.mmr = Math.max(0, p.mmr + (res.won ? 28 + Math.round((me.kills - me.deaths) * 1.5) : -(22 - Math.round(Math.min(10, me.kills) * 0.8)))); p.placement = Math.min(10, p.placement + 1); }
    p.history.unshift({ t: Date.now(), map: res.map, mode: res.mode, won: res.won, score: `${res.roundsWon}-${res.roundsLost}`, kills: me.kills, deaths: me.deaths, op: res.op, ranked: !!res.ranked, xp: res.xp, renown: res.renown });
    p.history.length = Math.min(p.history.length, 30);
    const earned = []; if (p.boosters > 0) p.boosters--;
    const ups = this.addXp(res.xp); this.addRenown(res.renown);
    this.track('match'); if (res.enlisted) this.track('enlisted_match');
    for (const k of ['kill', 'headshot', 'plant', 'defuse', 'reinforce', 'breach', 'assist']) { const n = k === 'kill' ? me.kills : k === 'headshot' ? me.headshots : k === 'plant' ? me.plants : k === 'defuse' ? me.defuses : k === 'reinforce' ? me.reinforced : k === 'breach' ? me.breached : me.assists; if (n) earned.push(...this.track(k, n)); }
    if (res.roundsWon) earned.push(...this.track('roundwin', res.roundsWon));
    this.save(); return { ups, earned };
  }
}
function merge(base, over) {
  for (const k of Object.keys(over)) {
    if (over[k] && typeof over[k] === 'object' && !Array.isArray(over[k]) && base[k] && typeof base[k] === 'object') base[k] = merge(base[k], over[k]); else base[k] = over[k];
  }
  return base;
}
void shopItems; void TITLES; void BANNERS; void CHARMS;
