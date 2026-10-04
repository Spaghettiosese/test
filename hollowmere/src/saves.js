// Saving and loading through localStorage: three slots, each with its own autosave written when
// things are calm, at checkpoints, waystones and beds. Wrapped in try/catch: the game must run
// when storage is unavailable.
const LEGACY = 'hollowmere.save.v2', SET = 'hollowmere.settings.v1', SLOT = (n) => 'hollowmere.slot.' + n;
export const SLOTS = [1, 2, 3];

export class Saves {
  constructor(g) {
    this.g = g; this.t = 60; this.last = 0; this.ok = true; this.slot = 1;
    // the single save of older builds becomes slot 1
    try { const old = localStorage.getItem(LEGACY); if (old && !localStorage.getItem(SLOT(1))) localStorage.setItem(SLOT(1), old); if (old) localStorage.removeItem(LEGACY); } catch { /* no storage */ }
  }
  raw(n) { try { return JSON.parse(localStorage.getItem(SLOT(n)) || 'null'); } catch { return null; } }
  has(n = null) { return n ? !!this.raw(n) : SLOTS.some((k) => !!this.raw(k)); }
  info(n = null) {
    n = n ?? this.latest(); if (!n) return null; const d = this.raw(n); if (!d) return null;
    const c = d.extra?.campaign;
    return { slot: n, hours: d.hours, level: d.progress?.level || 1, area: d.areaName || d.zone, day: d.day, t: d.t || 0, chapter: c?.ch || 'c1', play: d.playTime || 0, ng: c?.ng || 0, ended: !!d.story?.ended };
  }
  list() { return SLOTS.map((n) => ({ slot: n, info: this.info(n) })); }
  latest() { let best = null, bt = -1; for (const n of SLOTS) { const d = this.raw(n); if (d && (d.t || 0) > bt) { bt = d.t || 0; best = n; } } return best; }
  firstEmpty() { return SLOTS.find((n) => !this.raw(n)) ?? null; }
  remove(n) { try { localStorage.removeItem(SLOT(n)); } catch { /* ignore */ } }
  tick(dt) {
    const g = this.g; this.t -= dt; if (this.t > 0 || g.mode !== 'play') return;
    if (g.opts && !g.opts.v.autosave) { this.t = 90; return; }
    if (g.combatT > 0 || g.alarmLevel > 0.1 || g.player.dead) { this.t = 8; return; }
    this.t = 90; this.save('auto');
  }
  data() {
    const g = this.g, P = g.player, S = g.story, inv = P.inv;
    const b64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode(...u8.subarray(i, i + 8192)); return btoa(s); };
    return {
      v: 2, t: Date.now(), zone: S.zone, areaName: g.areaName, playTime: S.playTime, hours: g.clock.hours, day: g.clock.day,
      pos: [...P.pos], yaw: P.yaw, hp: P.hp, ember: P.ember, checkpoint: g.checkpoint, checkpointYaw: g.checkpointYaw,
      inv: { gold: inv.gold, lootValue: inv.lootValue, items: [...inv.items.entries()] },
      progress: g.progress.save(), rep: g.rep.save(), weather: g.weather.save(),
      quests: { state: g.quests.state, lit: [...g.quests.lit], kills: { role: g.quests.kills.role, id: [...g.quests.kills.id] } },
      story: { flags: S.flags, objectives: S.objectives.map((o) => ({ id: o.id, text: o.text, sub: o.sub, done: o.done, side: !!o.side })), notes: [...S.notesFound], dukeState: S.dukeState, seenZones: [...(S.seenZones || [])], finale: S.finale, fin: !!S.fin, fate: !!S.fate, ended: !!S.ended, hollowCount: S.hollowCount, tracked: S.tracked || null },
      stats: g.stats, dead: g.npcs.filter((n) => n.dead).map((n) => n.id),
      nd: g.level.doors.length, nc: g.level.containers.length,
      containers: g.level.containers.map((c) => (c.opened ? 1 : 0) + (c.locked ? 2 : 0)), doors: g.level.doors.map((d) => (d.locked ? 1 : 0)),
      status: g.status.save(), smith: g.smith.save(), jail: g.jail.save(), shrines: g.shrines.save(), stealth: g.stealth.save(), gear: g.gear.save(), codex: g.codex.save(), lantern: g.lantern.on,
      extra: Object.fromEntries(Object.entries(g.savables).map(([k, m]) => [k, m.save()])), pins: g.wmap.pins, map: b64(g.wmap.seen), tools: { sap: g.tools.sap, poisonHits: g.tools.poisonHits }, quick: g.difficulty,
    };
  }
  save(why = '', slot = null) {
    const g = this.g; if (!g.wmap || g.mode === 'boot' || g.mode === 'menu' || g.noSave) return false;
    if (slot) this.slot = slot;
    try { localStorage.setItem(SLOT(this.slot), JSON.stringify(this.data())); if (why && why !== 'auto') g.ui.toast(`Game saved (slot ${this.slot})`); else if (why === 'auto') g.ui.toast('Autosaved'); return true; } catch (e) { this.ok = false; return false; }
  }
  load(slot = null) {
    const g = this.g; slot = slot ?? this.latest(); if (!slot) return false;
    const d = this.raw(slot);
    if (!d || d.v !== 2) return false;
    this.slot = slot;
    const P = g.player, S = g.story, inv = P.inv;
    g.clock.hours = d.hours; g.clock.day = d.day || 0;
    inv.gold = d.inv.gold; inv.lootValue = d.inv.lootValue; inv.items = new Map(d.inv.items);
    g.gear.load(d.gear); g.smith.load(d.smith); g.jail.load(d.jail); g.shrines.load(d.shrines); g.stealth.load(d.stealth); g.status.load(d.status); g.codex.load(d.codex); g.lantern.on = !!d.lantern;
    g.progress.load(d.progress); g.rep.load(d.rep); g.weather.load(d.weather);
    g.quests.state = d.quests.state || {}; g.quests.lit = new Set(d.quests.lit || []); g.quests.kills = { role: d.quests.kills?.role || {}, id: new Set(d.quests.kills?.id || []) };
    Object.assign(S.flags, d.story.flags || {}); S.notesFound = new Set(d.story.notes || []); S.dukeState = d.story.dukeState || S.dukeState; S.seenZones = new Set(d.story.seenZones || []); if (d.story.finale) S.finale = true; S.tracked = d.story.tracked || null;
    S.fin = !!d.story.fin; S.fate = !!d.story.fate; S.ended = !!d.story.ended; S.hollowCount = d.story.hollowCount || 0; S.playTime = d.playTime || S.playTime;
    for (const so of d.story.objectives) {
      let o = S.objectives.find((x) => x.id === so.id);
      if (!o) { o = { id: so.id, text: so.text, sub: so.sub, done: so.done, side: so.side }; const q = g.quests.def(so.id); if (q) o.target = () => g.quests.targetOf(q); else { const t = g.campaign?.targetFor(so.id); if (t) o.target = t; } S.objectives.push(o); }
      o.done = so.done; o.text = so.text; o.sub = so.sub ?? o.sub;
    }
    Object.assign(g.stats, d.stats || {});
    const sameWorld = d.nd === g.level.doors.length && d.nc === g.level.containers.length; // a save from an older build has different door and chest numbers
    if (sameWorld) g.level.containers.forEach((c, i) => { const f = d.containers[i] | 0; if (f & 1) { c.opened = true; c.loot = []; } c.locked = !!(f & 2) && !(f & 1); });
    if (sameWorld) g.level.doors.forEach((dr, i) => { if (d.doors[i] === 0) dr.locked = false; });
    const dead = new Set(d.dead || []);
    for (const n of g.npcs) if (dead.has(n.id) && !n.dead) { n.dead = true; n.state = 'dead'; n.hp = 0; n.discovered = true; n.frozen = true; n.loot = []; n.setVisible(false); g.world.remove(n.body); }
    try { const bin = atob(d.map); for (let i = 0; i < bin.length && i < g.wmap.seen.length; i++) if (bin.charCodeAt(i)) g.wmap.paint(i % g.wmap.bw, Math.floor(i / g.wmap.bw)); } catch { /* map stays dark */ }
    g.wmap.pins = d.pins || [];
    for (const [k, m] of Object.entries(g.savables)) { try { m.load(d.extra?.[k]); } catch (e) { console.warn('load', k, e); } }
    g.tools.sap = !!d.tools?.sap; g.tools.poisonHits = d.tools?.poisonHits | 0;
    for (const n of g.npcs) if (!n.dead && n.role !== 'hollow') { n.leaveActivity(); n.slotKey = ''; n.snapToSchedule(); }
    P.cc.position = [...d.pos]; P.cc.velocity = [0, 0, 0]; P.yaw = d.yaw; P.pitch = 0; P.hp = d.hp; P.ember = d.ember; g.checkpoint = d.checkpoint || d.pos; g.checkpointYaw = d.checkpointYaw || 0;
    g.progress.applyMods(); P.hp = Math.min(P.maxHp, d.hp);
    return true;
  }
  settings() { try { return JSON.parse(localStorage.getItem(SET) || '{}'); } catch { return {}; } }
  saveSettings(o) { try { localStorage.setItem(SET, JSON.stringify({ ...this.settings(), ...o })); } catch { /* ignore */ } }
}
