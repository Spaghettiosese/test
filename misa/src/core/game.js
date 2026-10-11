// The engine kernel: owns the save state and offers the services every content module uses.
// Content never touches the DOM or the scene stack directly; it calls these methods.
import { R, get, all } from './registry.js';
import { Bus } from './bus.js';
import { SceneStack } from './scenes.js';
import { newState, migrate } from './state.js';
import { saveSlot, loadSlot, loadSettings, saveSettings } from './save.js';
import { mulberry32 } from '../rng.js';
import * as T from './time.js';
import { check } from './cond.js';

export class Game {
  constructor() {
    this.bus = new Bus();
    this.scenes = new SceneStack(this);
    this.settings = loadSettings();
    this.state = newState();
    this.rng = mulberry32(this.state.seed);
    this.slot = 1;
    this.toasts = [];
    this.clock = 0;          // real seconds since boot (animation clock)
    this.world = null;       // set by the world scene
  }

  // Deterministic random stream for a purpose and day (weather, events) independent of other rolls.
  rngFor(tag, day = this.day) { let h = (this.state.seed ^ (day * 2654435761)) >>> 0; for (const c of tag) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return mulberry32(h); }
  check(cond) { return check(cond, this); }

  // ---------- lifecycle ----------
  initSystems() { for (const s of all('system')) if (s.init) s.init(this); }
  newGame(slot = 1) {
    this.slot = slot; this.state = newState(); this.rng = mulberry32(this.state.seed);
    this.bus.emit('newGame', {});
  }
  load(slot) {
    const s = loadSlot(slot);
    if (!s) return false;
    this.slot = slot; this.state = migrate(s); this.rng = mulberry32((s.seed + s.time.day * 7919) >>> 0);
    this.bus.emit('loaded', {});
    return true;
  }
  save() { if (this.world) this.world.storePosition(); return saveSlot(this.slot, this.state); }
  saveSettings() { saveSettings(this.settings); }

  // ---------- time ----------
  get day() { return this.state.time.day; }
  get minutes() { return this.state.time.minutes; }
  get season() { return T.seasonOf(this.day); }
  get weekday() { return T.weekdayOf(this.day); }
  get weather() { return this.state.weather; }
  get isWeekend() { return T.isWeekend(this.day); }
  get part() { return T.partOfDay(this.minutes); }
  advance(min) {
    const before = Math.floor(this.state.time.minutes / 60);
    this.state.time.minutes += min;
    const after = Math.floor(this.state.time.minutes / 60);
    for (let h = before + 1; h <= after; h++) this.bus.emit('hour', { h });
  }
  // Starts the next morning (called after sleeping or passing out).
  nextDay(wakeAt = 7 * 60) {
    this.bus.emit('dayEnd', { day: this.day });
    this.state.time.day += 1;
    this.state.time.minutes = wakeAt;
    this.state.weather = this.state.tomorrowWeather || T.rollWeather(this.rngFor('weather'), this.day);
    this.state.tomorrowWeather = T.rollWeather(this.rngFor('weather', this.day + 1), this.day + 1);
    this.rng = this.rngFor('day');
    this.bus.emit('dayStart', { day: this.day });
  }

  // ---------- flags & stats ----------
  flag(k) { return this.state.flags[k]; }
  setFlag(k, v = true) { this.state.flags[k] = v; }
  inc(k, n = 1) { this.state.flags[k] = (this.state.flags[k] || 0) + n; return this.state.flags[k]; }
  stat(k, n = 1) { this.state.stats[k] = (this.state.stats[k] || 0) + n; this.bus.emit('stat', { k, v: this.state.stats[k] }); return this.state.stats[k]; }
  // Called by systems for things worth a toast + counter, e.g. game.note('fishCaught').
  note(k, n = 1) { return this.stat(k, n); }

  // ---------- items & money ----------
  count(id) { return this.state.inv[id] || 0; }
  has(id, n = 1) { return this.count(id) >= n; }
  bagUsed() { return Object.keys(this.state.inv).filter((k) => { const d = get('item', k); return d && !d.key; }).length; }
  give(id, n = 1, quiet = false) {
    const it = get('item', id);
    if (!it) { console.warn('unknown item', id); return false; }
    if (!this.state.inv[id] && !it.key && this.bagUsed() >= this.state.bagSize) {
      this.state.storage[id] = (this.state.storage[id] || 0) + n;
      this.toast(`Bag full: ${it.name} sent to your room's chest`, it.icon);
      this.bus.emit('itemGot', { item: id, n, stored: true });
      return true;
    }
    this.state.inv[id] = this.count(id) + n;
    if (!quiet) this.toast(`+${n > 1 ? n + ' ' : ''}${it.name}`, it.icon);
    this.bus.emit('itemGot', { item: id, n });
    return true;
  }
  take(id, n = 1) {
    if (!this.has(id, n)) return false;
    this.state.inv[id] -= n;
    if (this.state.inv[id] <= 0) delete this.state.inv[id];
    return true;
  }
  get money() { return this.state.money; }
  addMoney(n, quiet = false) {
    this.state.money = Math.max(0, this.state.money + n);
    if (!quiet && n) this.toast(`${n > 0 ? '+' : ''}${n} coins`, 'i_coin');
    this.bus.emit('moneyChanged', { money: this.state.money, delta: n });
  }
  spend(n) { if (this.state.money < n) { this.toast('Not enough coins'); return false; } this.addMoney(-n, true); return true; }

  // ---------- body & mood ----------
  get energy() { return this.state.energy; }
  addEnergy(n) { this.state.energy = Math.max(0, Math.min(this.state.maxEnergy, this.state.energy + n)); }
  useEnergy(n) {
    if (this.state.energy < n) { this.toast('Too tired... eat something or rest'); return false; }
    this.addEnergy(-n); return true;
  }
  addMood(n) { this.state.mood = Math.max(0, Math.min(100, this.state.mood + n)); }

  // ---------- skills ----------
  skillXP(id) { return this.state.skills[id] || 0; }
  skillLevel(id) { const xp = this.skillXP(id); let lv = 0; while (lv < 10 && xp >= 20 * (lv + 1) * (lv + 2) / 2) lv++; return lv; }
  addXP(id, n) {
    const before = this.skillLevel(id);
    this.state.skills[id] = this.skillXP(id) + n;
    const after = this.skillLevel(id);
    if (after > before) { const sk = get('skill', id); this.toast(`${sk ? sk.name : id} level ${after}!`, 'i_star'); this.sfx('chime'); this.bus.emit('skillUp', { id, level: after }); }
  }

  // ---------- friendship ----------
  friend(id) {
    if (!get('npc', id)) console.warn('friend(): unknown npc', id);
    return (this.state.friends[id] ||= { pts: 0, talkedDay: 0, giftedDay: 0, giftsWeek: 0, events: [] });
  }
  friendPts(id) { const f = this.state.friends[id]; return f ? f.pts : 0; }
  hearts(id) { return Math.min(10, Math.floor(this.friendPts(id) / 100)); }
  addFriend(id, n) {
    const f = this.friend(id), before = this.hearts(id);
    f.pts = Math.max(0, Math.min(1000, f.pts + n));
    const after = this.hearts(id);
    if (after > before) { const npc = get('npc', id); this.toast(`${npc ? npc.name : id}: ${after} heart${after > 1 ? 's' : ''}`, 'heart'); this.bus.emit('heartUp', { npc: id, hearts: after }); }
  }

  // ---------- quests ----------
  quest(id) { return this.state.quests[id]; }
  startQuest(id) {
    if (this.state.quests[id]) return;
    const q = get('quest', id);
    this.state.quests[id] = { stage: 0, done: false, day: this.day };
    if (q) { this.toast(`New quest: ${q.name}`, 'i_star'); this.sfx('select'); }
    this.bus.emit('questStart', { id });
  }
  setStage(id, stage) { const q = this.state.quests[id]; if (q && !q.done) { q.stage = stage; this.bus.emit('questStage', { id, stage }); } }
  completeQuest(id) {
    const q = this.state.quests[id] || (this.state.quests[id] = { stage: 0, day: this.day });
    if (q.done) return;
    q.done = true; q.doneDay = this.day;
    const def = get('quest', id);
    if (def) {
      this.toast(`Quest complete: ${def.name}`, 'i_star'); this.sfx('chime');
      if (def.reward) { if (def.reward.money) this.addMoney(def.reward.money); for (const [it, n] of Object.entries(def.reward.items || {})) this.give(it, n); if (def.reward.friend) for (const [npc, n] of Object.entries(def.reward.friend)) this.addFriend(npc, n); }
    }
    this.bus.emit('questDone', { id });
  }
  questActive(id) { const q = this.state.quests[id]; return !!q && !q.done; }
  questDone(id) { return !!(this.state.quests[id] && this.state.quests[id].done); }

  // ---------- achievements & collections ----------
  achieve(id) {
    if (this.state.achievements[id]) return;
    this.state.achievements[id] = this.day;
    const a = get('achievement', id);
    this.toast(`Achievement: ${a ? a.name : id}`, 'i_star'); this.sfx('star');
    this.bus.emit('achievement', { id });
  }
  collect(kind, id, n = 1) {
    const c = (this.state.collections[kind] ||= {});
    const first = !c[id];
    c[id] = (c[id] || 0) + n;
    if (first) this.bus.emit('collectNew', { kind, id });
    return first;
  }
  collected(kind, id) { return (this.state.collections[kind] || {})[id] || 0; }

  // ---------- mail (phone messages) ----------
  mail(id, from, text, extra = {}) {
    if (this.state.mail.some((m) => m.id === id)) return;
    this.state.mail.unshift({ id, from, text, day: this.day, read: false, ...extra });
    this.toast(`New message from ${from}`, 'i_phone'); this.sfx('blip');
  }

  // ---------- feedback ----------
  toast(text, icon = null) { this.toasts.push({ text, icon, t: 3.2 }); if (this.toasts.length > 4) this.toasts.shift(); }
  sfx(name) { this.audio && this.audio.sfx(name); }

  // ---------- scenes (factories are registered by the UI/world modules) ----------
  open(kind, ...args) {
    const f = get('scene', kind);
    if (!f) { console.warn('no scene', kind); return null; }
    return this.scenes.push(f.make(this, ...args));
  }
  // Run a dialogue/cutscene script; resolves when it ends.
  run(steps) { return new Promise((res) => this.open('cutscene', typeof steps === 'function' ? steps(this) : steps, res)); }
  say(who, mood, text) { return this.run([{ t: 'say', who, mood, text }]); }
  minigame(id, opts = {}) { return new Promise((res) => this.open('minigame', id, opts, res)); }
  warp(map, x, y, dir) { return this.world ? this.world.warp(map, x, y, dir) : Promise.resolve(); }
}

export { R, get, all, T };
