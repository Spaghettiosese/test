// The campaign: four chapters, from the Duke's letter to whatever sleeps beneath the Choir Stones.
// Chapter I lives in story.js (it was the original demo); the later chapters each have a module
// in chapters/. The campaign owns which chapter you are in, the title cards between them, the
// story-wide facts later chapters ask about (who lived, what you learned), the per-chapter state
// of the world, and starting a chapter from the menu with a sensible kit.
import { Chapter2 } from './chapters/c2.js';
import { Chapter3 } from './chapters/c3.js';
import { Chapter4 } from './chapters/c4.js';

export const CHAPTERS = [
  { id: 'c1', n: 'I', title: 'The Duke\'s Seal', blurb: 'Cross Ashgate, get into Ravenspire keep and steal a letter sealed in black wax from the Duke\'s bedchamber.' },
  { id: 'c2', n: 'II', title: 'The Gray Hand', blurb: 'Hunted by the keep and betrayed by your employer: learn what the letter is, and find the woman who sent you for it.' },
  { id: 'c3', n: 'III', title: 'The Hollow Night', blurb: 'The bell tolls thirteen and the dead march on Ashgate. Take the Bone and the Bell before the Gray Hand does.' },
  { id: 'c4', n: 'IV', title: 'The Choir Beneath', blurb: 'Midnight at the Choir Stones. What sleeps under Hollowmere is waking, and it has learned your name.' },
];
export const VERSES = {
  saint: { name: 'Verse of the Saint', text: 'Wax binds the mouth. What is sealed in wax is sealed in a name; burn the name and the mouth forgets.' },
  witch: { name: 'Verse of the Witch', text: 'Bone binds the voice. The Binder gave his own skull to the hill; while it lies there, the Choir sings only in its sleep.' },
  father: { name: 'Verse of the Father', text: 'Bell binds the hour. Twelve strokes keep the night; the thirteenth opens it. Strike the heart thirteen times and the hour closes forever.' },
};
// what a chapter started from the menu hands you
const LOADOUT = {
  c2: { level: 4, gold: 140, items: [['letter', 1], ['potion', 2], ['ember', 1], ['lockpick', 4], ['knife', 4], ['smoke', 1]], gear: ['cowl'], hours: 23.4, pos: [13, 0.1, 150.5], yaw: Math.PI, area: 'Behind the Keep', blade: 2 },
  c3: { level: 7, gold: 260, items: [['letter', 1], ['crossbow', 1], ['bolt', 12], ['bolt_water', 4], ['potion', 3], ['ember', 2], ['lockpick', 5], ['knife', 6], ['smoke', 2], ['firebomb', 1], ['hexbane', 1]], gear: ['cowl', 'jerkin', 'softboots'], hours: 19.2, pos: [140, 0.1, -150], yaw: Math.PI, area: 'Pellmouth', blade: 3, verses: ['saint', 'witch'], flags: { brannochSaved: true, c2done: true } },
  c4: { level: 10, gold: 400, items: [['letter', 1], ['crossbow', 1], ['bolt', 16], ['bolt_fire', 4], ['bolt_sleep', 3], ['potion', 4], ['ember', 3], ['lockpick', 5], ['knife', 8], ['smoke', 2], ['firebomb', 2], ['hexbane', 2], ['binderskull', 1], ['clapper', 1]], gear: ['cowl', 'jerkin', 'softboots'], hours: 22.6, pos: [80, 0.1, -184], yaw: Math.PI, area: 'The Choir Stones', blade: 4, verses: ['saint', 'witch', 'father'], flags: { brannochSaved: true, c2done: true, c3done: true, pardoned: true } },
};

export class Campaign {
  constructor(g) {
    this.g = g; g.reg('campaign', this);
    this.ch = 'c1'; this.ng = 0; this.verses = new Set(); this.facts = {}; this.t = 0;
    this.parts = { c2: new Chapter2(g, this), c3: new Chapter3(g, this), c4: new Chapter4(g, this) };
  }
  get part() { return this.parts[this.ch] || null; }
  def(id = this.ch) { return CHAPTERS.find((c) => c.id === id); }
  index(id = this.ch) { return CHAPTERS.findIndex((c) => c.id === id); }
  // ------------------------------------------------------------ objectives that belong to a chapter
  objective(id, text, sub, target = null, o = {}) {
    const S = this.g.story; let ob = S.objectives.find((x) => x.id === id);
    if (!ob) { ob = { id, text, sub, done: false, ch: this.ch, ...o }; S.objectives.push(ob); if (!o.quiet) { this.g.ui.toast(`New objective: ${text}`); this.g.sfx.bellNote?.(1); } }
    else { ob.text = text; if (sub !== undefined) ob.sub = sub; }
    if (target) ob.target = target;
    return ob;
  }
  has(id) { return !!this.g.story.objectives.find((x) => x.id === id); }
  isDone(id) { return !!this.g.story.objectives.find((x) => x.id === id && x.done); }
  done(id) { this.g.story.complete(id); }
  slash(eye, f, reach, dmg) { return !!this.part?.slash?.(eye, f, reach, dmg); }
  onNpcDeath(n) { for (const p of Object.values(this.parts)) p.onNpcDeath?.(n); }
  // chapters can add things to press E on, and change what people say
  hook(push, eye) { for (const p of Object.values(this.parts)) p.hook?.(push, eye); }
  dialogue(npc) { const order = [this.part, ...Object.values(this.parts).filter((p) => p !== this.part)]; for (const p of order) { const l = p?.dialogue?.(npc); if (l) return l; } return null; }
  targetFor(id) { for (const p of Object.values(this.parts)) { const t = p.targetFor?.(id); if (t) return t; } return null; }
  // ------------------------------------------------------------ what you learned
  learn(key) {
    if (this.verses.has(key)) return false;
    this.verses.add(key); const v = VERSES[key]; const g = this.g;
    g.ui.flashBanner(v.name.toUpperCase(), 2600, true); g.sfx.veil?.(); g.progress.addXp(60, 'a verse of the binding');
    this.part?.onVerse?.(key);
    g.achievements?.check();
    return true;
  }
  // ------------------------------------------------------------ chapters
  begin(id, { card = true, quiet = false } = {}) {
    const g = this.g, from = this.ch; this.ch = id; g.profile.reachChapter(id);
    const d = this.def(id); this.applyWorld();
    const go = () => { this.parts[id]?.start(from); g.achievements?.check(); if (!quiet) setTimeout(() => g.saves.save('auto'), 1200); };
    if (!card) { go(); return; }
    this.titleCard(d, go);
  }
  titleCard(d, then) {
    const g = this.g, P = g.player, eye = P.eyePos, f = P.forward;
    const look = [eye[0] + f[0] * 8, eye[1] + f[1] * 2, eye[2] + f[2] * 8];
    const lines = this.parts[d.id]?.prologue?.() || [];
    const beats = [{ dur: 1.2, fadeTo: 1, fadeRate: 4, cam: { p0: eye, l0: look, fov: 66 } },
      { dur: 4.2, fade: 1, fadeTo: 1, title: ['CHAPTER ' + d.n, d.title], cam: { p0: eye, l0: look, fov: 66 }, enter: () => { g.sfx.bell?.(1); g.sfx.mood && (g.sfx.mood.chapter = d.id); } }];
    for (const [who, text, dur] of lines) beats.push({ dur: dur || 4.5, fadeTo: 1, sub: [who, text], cam: { p0: eye, l0: look, fov: 66 } });
    beats.push({ dur: 1.4, fadeTo: 0, fadeRate: 2.2, cam: { p0: eye, l0: look, fov: 66 } });
    g.story.play(beats, () => { g.mode = 'play'; g.ui.showHud(true); g.ui.letterbox(false); g.pix.fade = 0; g.canvasLock?.(); then?.(); });
  }
  // what each chapter does to the world: run when a chapter begins and when a save is loaded
  applyWorld() { for (const [k, p] of Object.entries(this.parts)) p.world?.(this.index(k) <= this.index()); }
  // ------------------------------------------------------------ chapter select
  startAt(id) {
    const g = this.g, L = LOADOUT[id], P = g.player, S = g.story;
    if (!L) { S.intro(); return; }
    for (const o of S.objectives) if (!o.side) o.done = true;
    S.finale = true; S.fin = true; S.fate = true; S.fateT = 60; S.flags.letterTime = g.time; S.dukeState = 'fled';
    const pr = g.progress; while (pr.level < L.level) { pr.level++; pr.points++; }
    P.inv.gold = L.gold; for (const [it, n] of L.items) P.inv.add(it, n); for (const it of L.gear || []) { P.inv.add(it, 1); g.gear.equip?.(it, true); }
    if (L.blade && g.smith) g.smith.level = Math.max(g.smith.level, L.blade);
    for (const v of L.verses || []) this.verses.add(v);
    Object.assign(this.facts, L.flags || {});
    g.clock.hours = L.hours; for (const n of g.npcs) { if (n.role !== 'hollow') { n.leaveActivity(); n.snapToSchedule(); } }
    P.cc.position = [...L.pos]; P.cc.velocity = [0, 0, 0]; P.yaw = L.yaw; P.pitch = 0; g.setCheckpoint(L.pos, L.yaw);
    pr.applyMods(); P.hp = P.maxHp; P.ember = P.maxEmber;
    if (id !== 'c2') { g.rep.add?.('keep', 120, 'the theft'); }
    g.mode = 'play'; g.ui.showHud(true); g.ui.area(L.area); S.startTime = g.time; P.playVm('Idle', 0.05);
    for (const c of CHAPTERS) { g.profile.reachChapter(c.id); if (c.id === id) break; }
    this.begin(id);
  }
  // ------------------------------------------------------------ New Game+
  carry() {
    const g = this.g, inv = g.player.inv, keep = new Set(['consumable', 'tool', 'gear', 'valuable', 'herb', 'draught', 'ammo', 'disguise']);
    return { ng: this.ng, progress: g.progress.save(), gear: g.gear.save(), smith: g.smith.save(), gold: inv.gold, items: inv.list().filter((it) => keep.has(it.kind) && !['shovel'].includes(it.id)).map((it) => [it.id, it.n]) };
  }
  newGamePlus(c) {
    if (!c) return; const g = this.g; this.ng = (c.ng || 0) + 1;
    g.progress.load(c.progress); g.gear.load(c.gear); g.smith.load(c.smith); g.player.inv.gold = c.gold || 0;
    for (const [id, n] of c.items || []) g.player.inv.add(id, n);
    g.progress.applyMods(); g.player.hp = g.player.maxHp; this.ngScale(); g.profile.d.runs++; g.profile.write();
  }
  // enemies are tougher each time round
  ngScale() {
    const g = this.g; g.ngHp = 1 + 0.35 * this.ng; g.ngDmg = 1 + 0.2 * this.ng;
    for (const n of g.npcs) if (!n.ngScaled && (n.guard || n.role === 'hollow' || n.role === 'bandit')) { n.ngScaled = true; n.maxHp = Math.round(n.maxHp * g.ngHp); n.hp = n.maxHp; }
  }
  update(dt) {
    const g = this.g; if (g.mode !== 'play' && g.mode !== 'talk') return;
    this.part?.update(dt);
    this.t -= dt; if (this.t <= 0) { this.t = 1; g.achievements?.check(); }
  }
  save() { const parts = {}; for (const [k, p] of Object.entries(this.parts)) parts[k] = p.save?.(); return { ch: this.ch, ng: this.ng, verses: [...this.verses], facts: this.facts, parts }; }
  load(d) {
    if (!d) return; this.ch = d.ch || 'c1'; this.ng = d.ng || 0; this.verses = new Set(d.verses || []); this.facts = d.facts || {};
    for (const [k, p] of Object.entries(this.parts)) p.load?.(d.parts?.[k]);
    if (this.ng) this.ngScale();
    this.applyWorld(); this.part?.resume?.();
  }
}
