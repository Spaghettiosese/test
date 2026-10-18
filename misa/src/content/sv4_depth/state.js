// Character Depth (sv4_depth): shared state, memory log, personality traits, reputation and the journal.
// Save data: state.sv4d = { mem:{npc:[{k,day,...}]}, traits:{kind,curious,brave,calm}, rep:{helpful,studious,quirky,dependable,charming},
//   arc:{npc:n}, journal:[{day,npc,part,title,text}], promises:[], prom:{kept,broken,declined}, talked:{npc:day}, mood:{npc:{day,m}},
//   comfort:{npc:day}, trad:{npc:year}, photos:[{id,year,day,pick}], rum:{list,next,seq}, heard:{rumor:{from,day,hops}}, greeted:{npc:day}, pend:{npc:[..]} }
// Condition kinds added: trait:kind>=3, rep:helpful>=6, moodof:kai=tired|blue.   Export for other workers: hasTrait(game, 'Kind', n).
// Bus events emitted: sv4dMemory { npc, k }, sv4dPromise { npc, ok }, sv4dMood, sv4dTrait { trait, score }, sv4dRep { cat, tier }.
import { register, get } from '../../core/registry.js';
import { addCondKind } from '../../core/cond.js';
import { CAST, nameOf } from '../sv3_hearts/core.js';

export { CAST, nameOf };
export const TRAITS = ['kind', 'curious', 'brave', 'calm'];
export const REPS = ['helpful', 'studious', 'quirky', 'dependable', 'charming'];
const DEF = () => ({
  mem: {}, traits: { kind: 0, curious: 0, brave: 0, calm: 0 }, rep: { helpful: 0, studious: 0, quirky: 0, dependable: 0, charming: 0 },
  arc: {}, journal: [], promises: [], prom: { kept: 0, broken: 0, declined: 0 }, talked: {}, mood: {}, comfort: {}, trad: {}, photos: [],
  rum: { list: {}, next: 0, seq: 0 }, heard: {}, greeted: {}, pend: {}, cofr: {}, tmp: '', seen: {},
});
register('stateSlice', 'sv4d', { default: DEF });
export const S = (g) => { const s = (g.state.sv4d ||= DEF()); for (const [k, v] of Object.entries(DEF())) if (s[k] === undefined) s[k] = v; return s; };

// ---------- memory ----------
export const MEM_CAP = 40;
export function remember(g, id, k, data = {}) {
  const s = S(g), list = (s.mem[id] ||= []);
  const m = { k, day: g.day, ...data };
  list.push(m);
  if (list.length > MEM_CAP) list.splice(0, list.length - MEM_CAP);
  g.bus.emit('sv4dMemory', { npc: id, k });
  return m;
}
export const memories = (g, id, k) => (S(g).mem[id] || []).filter((m) => !k || m.k === k);
export const lastMem = (g, id, k, within = 999, pred) => { const l = memories(g, id, k).filter((m) => g.day - m.day <= within && (!pred || pred(m))); return l[l.length - 1] || null; };

// ---------- traits ----------
export const traitScore = (g, t) => Math.floor((S(g).traits[String(t).toLowerCase()] || 0) + 1e-9);
export function hasTrait(game, trait, n = 1) { return traitScore(game, trait) >= n; }
export function addTrait(g, t, n = 1) {
  t = String(t).toLowerCase(); const s = S(g);
  if (!(t in s.traits)) return;
  const before = traitScore(g, t); s.traits[t] += n;
  const after = traitScore(g, t);
  if (after > before) { g.bus.emit('sv4dTrait', { trait: t, score: after }); g.toast(`${t[0].toUpperCase()}${t.slice(1)} ${after}`, 'star'); }
}
// ---------- reputation ----------
export const REP_TIERS = [6, 18, 36];
export const repScore = (g, c) => S(g).rep[c] || 0;
export const repTier = (g, c) => REP_TIERS.filter((t) => repScore(g, c) >= t).length;
export function addRep(g, c, n) {
  const s = S(g); if (!(c in s.rep)) return;
  const before = repTier(g, c); s.rep[c] = Math.max(0, s.rep[c] + n);
  const after = repTier(g, c);
  if (after !== before) { g.bus.emit('sv4dRep', { cat: c, tier: after }); g.toast(`${c[0].toUpperCase()}${c.slice(1)} reputation: tier ${after}`, 'star'); }
}
addCondKind('trait', (g, a) => traitScore(g, a));
addCondKind('rep', (g, a) => repTier(g, a));
addCondKind('moodof', (g, a) => (S(g).mood[a] && S(g).mood[a].day === g.day ? S(g).mood[a].m : 'content'));

// ---------- journal / arcs ----------
export function journal(g, npc, part, title, text) {
  const s = S(g);
  if (!s.journal.some((j) => j.npc === npc && j.part === part)) s.journal.push({ day: g.day, npc, part, title, text });
}
export const arcPart = (g, id) => S(g).arc[id] || 0;
// daily friendship bookkeeping for a conversation that replaces the normal chatter (+10 once a day, like the engine)
export function talkBook(g, id) { const f = g.friend(id); if (f.talkedDay !== g.day) { f.talkedDay = g.day; g.addFriend(id, 10); g.stat('talks'); } }
export const short = (id) => nameOf(id).replace(/^(Ms\.|Mr\.|Grandma|Captain)\s+/, '').split(' ')[0];

// ---------- small shared helpers ----------
export const pickOf = (arr, r) => arr[Math.floor(r * arr.length) % arr.length];
export const inBag = (g, re) => Object.keys(g.state.inv || {}).filter((k) => re.test(k) && g.count(k) > 0 && get('item', k));
