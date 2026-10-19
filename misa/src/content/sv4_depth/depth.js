// NPC memory, promises, the comfort mechanic and the daily "depth" talk hook (memory callbacks, mood lines, schedule-variant lines,
// arc afterglow, rumors and promise requests). One talk hook per person; priorities: promise 6, comfort 4, depth -4.
import { register, get } from '../../core/registry.js';
import { sc, ch, holidayOn, HOLIDAY_NAMES } from '../social/util.js';
import { dateText } from '../../core/time.js';
import { pendingReaction } from '../social/talk.js';
import { isBirthday } from '../../systems/social.js';
import { S, remember, memories, nameOf, addRep, addTrait, talkBook, pickOf, CAST } from './state.js';
import { PEOPLE } from './people.js';
import './people2.js';
import { moodOf, setMood, comfortItems, variantOf } from './moods.js';
import { ARCS } from './kit.js';
import { tellable, tellSteps } from './rumors.js';

export const CAST_ALL = [...CAST, 'aoi', 'haru', 'sora', 'momo'];
const fill = (t, v) => t.replace(/\{gift\}/g, v.gift || 'gift').replace(/\{fest\}/g, v.fest || 'the festival').replace(/\{item\}/g, v.item || 'gift').replace(/\{day\}/g, v.day || 'soon');
const itemName = (id) => (get('item', id) || { name: id }).name.toLowerCase();

// ---------- promises ----------
export const openPromises = (g) => S(g).promises.filter((p) => p.state === 'open');
export const openFor = (g, id) => openPromises(g).find((p) => p.npc === id);
export function keepPromise(g, p) {
  const s = S(g); if (p.state !== 'open') return;
  p.state = 'kept'; s.prom.kept++;
  g.addFriend(p.npc, 60); addRep(g, 'dependable', 2);
  remember(g, p.npc, 'promise', { ok: true, text: p.text });
  (s.pend[p.npc] ||= []).push('kept'); g.stat('sv4dPromisesKept');
  g.bus.emit('sv4dPromise', { npc: p.npc, ok: true });
}
export function breakPromise(g, p) {
  const s = S(g); if (p.state !== 'open') return;
  p.state = 'broken'; s.prom.broken++;
  g.addFriend(p.npc, -40); addRep(g, 'dependable', -2);
  remember(g, p.npc, 'promise', { ok: false, text: p.text });
  (s.pend[p.npc] ||= []).push('broke'); g.stat('sv4dPromisesBroken');
  g.bus.emit('sv4dPromise', { npc: p.npc, ok: false });
}
export function nextFestival(g) {
  for (let d = g.day + 2; d <= g.day + 12; d++) { const k = holidayOn(d); if (k && !S(g).promises.some((p) => p.kind === 'attend' && p.state === 'open' && p.day === d)) return { day: d, key: k, name: HOLIDAY_NAMES[k] || k }; }
  return null;
}
export function askSpec(g, id) {
  const s = S(g), def = get('npc', id);
  if (!def || def.hidden || g.hearts(id) < 3 || openFor(g, id) || openPromises(g).length >= 3 || g.day - (s.seen['ask_' + id] || -99) < 6) return null;
  const likes = [...((def.gifts || {}).love || []), ...((def.gifts || {}).like || [])].filter((i) => get('item', i));
  const kinds = []; if (likes.length) kinds.push('bring'); kinds.push('visit');
  const fest = nextFestival(g); if (fest) kinds.push('attend');
  const r = g.rngFor('sv4dask:' + id), kind = kinds[Math.floor(r() * kinds.length)];
  if (kind === 'bring') { const item = pickOf(likes, r()), due = g.day + 4 + Math.floor(r() * 4); return { kind, item, due, text: `Bring ${itemName(item)} to ${nameOf(id)} by ${dateText(due)}` }; }
  if (kind === 'attend') return { kind, fest: fest.name, due: fest.day, day: fest.day, text: `Meet ${nameOf(id)} at ${fest.name} on ${dateText(fest.day)}` };
  const due = g.day + 3 + Math.floor(r() * 3);
  return { kind: 'visit', due, text: `Visit ${nameOf(id)} on ${dateText(due)}` };
}
function askSteps(g, id, a) {
  const P = PEOPLE[id], v = { item: a.item ? itemName(a.item) : '', fest: a.fest, day: dateText(a.due) };
  const line = a.kind === 'bring' ? P.askBring : a.kind === 'attend' ? P.askAttend : P.askVisit;
  return sc(id, { t: 'call', fn: (gg) => { talkBook(gg, id); S(gg).talked[id] = gg.day; S(gg).seen['ask_' + id] = gg.day; } }, fill(line, v),
    ch(`A promise?`,
      [`I promise!`, { t: 'call', fn: (gg) => { const s = S(gg); s.promises.push({ id: s.promises.length + 1, npc: id, kind: a.kind, item: a.item, day: a.day || a.due, due: a.due, asked: gg.day, state: 'open', text: a.text }); gg.toast(`Promise: ${a.text}`, 'star'); gg.stat('sv4dPromisesMade'); } }, `happy|Thank you. I'll hold you to it. Gently.`],
      [`Sorry, I can't promise that.`, { t: 'call', fn: (gg) => { S(gg).prom.declined++; } }, `neutral|Honest is good. Maybe another time.`]));
}
function promiseSteps(g, id) {
  const s = S(g), pend = s.pend[id] || [], P = PEOPLE[id] || {};
  const steps = [{ t: 'call', fn: (gg) => talkBook(gg, id) }];
  if (pend.length) {
    for (const k of pend) steps.push(...sc(id, k === 'kept' ? P.kept : P.broke, k === 'kept' ? '*heart' : null));
    steps.push({ t: 'call', fn: (gg) => { S(gg).pend[id] = []; } });
    return sc(id, ...steps);
  }
  const p = openFor(g, id);
  if (!p || !p.item) return sc(id, 'neutral|...');
  return sc(id, ...steps, `neutral|Is that the ${itemName(p.item)} you promised?`,
    ch(`Hand it over?`,
      [`Here you go.`, { t: 'call', fn: (gg) => { gg.take(p.item, 1); keepPromise(gg, p); S(gg).pend[id] = []; } }, P.kept, '*heart'],
      [`Not just yet.`, `neutral|Alright. I'll wait. But not forever.`]));
}

// ---------- memory callbacks ----------
export function memCands(g, id) {
  const P = PEOPLE[id]; if (!P) return [];
  const out = [], fresh = (m, within) => g.day - m.day <= within && !(m.used && g.day - m.used < 10);
  const last = (k, within, pred) => memories(g, id, k).filter((m) => fresh(m, within) && (!pred || pred(m))).pop();
  let m;
  if ((m = last('promise', 14, (x) => !x.ok))) out.push({ key: 'broke', m, line: P.broke });
  if ((m = last('promise', 20, (x) => x.ok))) out.push({ key: 'kept', m, line: P.kept });
  if ((m = last('comfort', 20))) out.push({ key: 'comfort', m, line: P.comfort });
  if ((m = last('gift', 25, (x) => x.r === 'love'))) out.push({ key: 'gloved', m, line: fill(P.gloved, { gift: m.name }) });
  if ((m = last('gift', 14, (x) => x.r === 'dislike' || x.r === 'hate'))) out.push({ key: 'gdis', m, line: fill(P.gdis, { gift: m.name }) });
  if ((m = last('fest', 40))) out.push({ key: 'fest', m, line: fill(P.fest, { fest: m.name }) });
  return out;
}
export function arcLines(g, id) {
  const n = S(g).arc[id] || 0, parts = ARCS[id] || [], out = [];
  for (let i = 0; i < n; i++) { const p = parts[i]; if (p) out.push(p.alt && g.flag('sv4d_' + p.alt) ? p.after[1] : p.after[0]); }
  return out;
}
export function pickDepth(g, id) {
  const def = get('npc', id), P = PEOPLE[id], s = S(g), f = g.friend(id);
  if (!def || !P || def.hidden || !g.state.seen['met:' + id] || s.talked[id] === g.day) return null;
  if (isBirthday(def, g) && f.bdayTalk !== g.day) return null;
  if (pendingReaction(g, id)) return null;
  const roll = (k) => g.rngFor(`sv4dt:${k}:${id}`)();
  const v = variantOf(g, id);
  if ((v === 'hobby' || v === 'errand') && roll('v') < 0.85) return { kind: 'variant', line: P[v] };
  const a = askSpec(g, id); if (a && roll('a') < 0.3) return { kind: 'ask', a };
  const t = tellable(g, id); if (t && roll('r') < 0.6) return { kind: 'rumor', t };
  const mc = memCands(g, id); if (mc.length && roll('m') < 0.5) { const c = mc[Math.floor(roll('mm') * mc.length) % mc.length]; return { kind: 'memory', c, line: c.line }; }
  const al = arcLines(g, id); if (al.length && roll('c') < 0.4) return { kind: 'arc', line: pickOf(al, roll('cc')) };
  const m = moodOf(g, id); if (m !== 'content' && P[m] && roll('d') < 0.55) return { kind: 'mood', line: P[m], mood: m };
  return null;
}
function depthSteps(g, id) {
  const d = pickDepth(g, id); if (!d) return sc(id, 'neutral|...');
  if (d.kind === 'ask') return askSteps(g, id, d.a);
  if (d.kind === 'rumor') return [{ t: 'call', fn: (gg) => { S(gg).talked[id] = gg.day; } }, ...tellSteps(g, id, d.t)];
  return sc(id, { t: 'call', fn: (gg) => { talkBook(gg, id); S(gg).talked[id] = gg.day; if (d.c) d.c.m.used = gg.day; } }, d.line);
}

// ---------- comfort ----------
export const comfortReady = (g, id) => {
  if (!g.state.seen['met:' + id] || g.hearts(id) < 1 || !PEOPLE[id]) return false;
  if (!['tired', 'blue', 'prickly'].includes(moodOf(g, id))) return false;
  return S(g).cofr[id] !== g.day && comfortItems(g).length > 0;
};
function comfortSteps(g, id) {
  const P = PEOPLE[id], m = moodOf(g, id), items = comfortItems(g).slice(0, 3);
  const done = (gg, item, pts, quiet) => {
    if (item) gg.take(item, 1);
    gg.addFriend(id, pts); setMood(gg, id, 'content');
    remember(gg, id, 'comfort', { item: item || '', quiet: !!quiet });
    addRep(gg, 'helpful', 1.5); addTrait(gg, quiet ? 'calm' : 'kind', 1); gg.stat('sv4dComforts');
  };
  return sc(id, { t: 'call', fn: (gg) => { talkBook(gg, id); S(gg).cofr[id] = gg.day; } }, P[m], `@${nameOf(id)} seems ${m} today. You have something warm in your bag.`,
    ch(`What do you do?`,
      ...items.map((it) => [`Give them the ${itemName(it)}`, { t: 'call', fn: (gg) => done(gg, it, 45) }, P.comfort, '*heart']),
      [`Just sit with them for a while`, { t: 'call', fn: (gg) => done(gg, null, 12, true) }, `neutral|...Thanks. That helps more than you'd think.`],
      [`Not right now`, `neutral|That's alright.`]));
}

for (const id of CAST_ALL) {
  if (!get('npc', id) || get('talkHook', 'sv4d_depth_' + id)) continue;
  register('talkHook', 'sv4d_prom_' + id, { npc: id, priority: 6, when: (g) => { const s = S(g), p = openFor(g, id); return (s.pend[id] || []).length > 0 || (!!p && p.kind === 'bring' && g.count(p.item) > 0); }, steps: (g) => promiseSteps(g, id) });
  register('talkHook', 'sv4d_comfort_' + id, { npc: id, priority: 4, when: (g) => comfortReady(g, id), steps: (g) => comfortSteps(g, id) });
  register('talkHook', 'sv4d_depth_' + id, { npc: id, priority: -4, when: (g) => !!pickDepth(g, id), steps: (g) => depthSteps(g, id) });
}

register('system', 'sv4dMemory', {
  init(game) {
    game.bus.on('gift', ({ npc, item, reaction, birthday }) => {
      if (!get('npc', npc)) return;
      remember(game, npc, 'gift', { item, name: itemName(item), r: reaction, bday: !!birthday });
    });
    game.bus.on('festivalAttend', (e) => {
      const name = HOLIDAY_NAMES[holidayOn(game.day)] || (e && e.id) || 'the festival';
      if (game.world && game.world.npcs) for (const n of Object.values(game.world.npcs)) if (n.present && n.def && !n.def.hidden && game.hearts(n.id) >= 2) remember(game, n.id, 'fest', { name });
      for (const p of openPromises(game)) if (p.kind === 'attend' && p.due === game.day) keepPromise(game, p);
    });
    game.bus.on('heartEvent', ({ npc, id }) => { remember(game, npc, 'scene', { ev: id }); });
    game.bus.on('talk', ({ npc }) => { const p = openFor(game, npc); if (p && p.kind === 'visit' && p.due === game.day) keepPromise(game, p); });
    game.bus.on('dayStart', () => { for (const p of openPromises(game)) if (p.due < game.day) breakPromise(game, p); });
  },
});
