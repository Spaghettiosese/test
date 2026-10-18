// Romance (sv4_romance): wholesome school romance. Misa's same-age schoolmates only; the ceiling is holding hands and blushing.
// Save data: state.sv4r = { aff:{id:0..1000}, partner:null|id, since:day, steady:{id:day}, friends:{id:{day,at}}, plan:null|{npc,kind,day,at,done},
//   journal:[{day,npc,kind,score,tier}], datesWith:{id:n}, weekDates:{week:n}, coupleDone:{key:day}, seen:{key:{day,title,npc,picks[]}},
//   chat:{id:{log:[{me,text,ico,day,min}],pend:null|{tid,day,min},sent:{tid:day},today:{day,n}}}, dramaDone:{}, flirt:{id:day}, talkDay:{id:day},
//   cur:{pts,mini}, perkDay:{lunch,walk,morning}, hintDay, postDone:{}, cool:{id:day} }
// Condition kinds: romstage:<id>>=2 (0 acquaintance .. 5 steady, -1 just friends), crush:<id>>=3 (0..10), partner:<id> or partner:any.
// Bus events emitted: dateDone {npc,kind,score,tier}, confessed {npc,by,accepted}, couple {npc,steady?}, coupleEvent {npc,id}, romStage {npc,stage}, coupleEnded {npc}.
// Stats: dates, confessions, couples, coupleEvents, textsReplied, compliments, romScenes.   Console: __misa.sv4r (see api below).
import { register, get, features } from '../../core/registry.js';
import { addCondKind } from '../../core/cond.js';
import { sc } from '../social/util.js';

export const CORE = ['kai', 'suzu', 'rina', 'theo', 'hina'];
export const EXTRA = ['aoi', 'haru'];
export const isCand = (id) => (CORE.includes(id) || EXTRA.includes(id)) && !!get('npc', id);
export const candidates = () => [...CORE, ...EXTRA].filter((id) => get('npc', id));
export const metBy = (g, id) => !!g.state.seen['met:' + id] || g.hearts(id) > 0;
export const visibleCands = (g) => candidates().filter((id) => metBy(g, id));
export const nameOf = (id) => (get('npc', id) || { name: id }).name;
export const firstName = (id) => nameOf(id).split(' ')[0];

const DEF = () => ({ aff: {}, partner: null, since: 0, steady: {}, friends: {}, plan: null, journal: [], datesWith: {}, weekDates: {}, coupleDone: {}, seen: {},
  chat: {}, dramaDone: {}, flirt: {}, talkDay: {}, cur: { pts: 0, mini: 0 }, perkDay: {}, hintDay: 0, postDone: {}, cool: {}, gifted: {} });
register('stateSlice', 'sv4r', { default: DEF });
export const S = (g) => { const s = (g.state.sv4r ||= DEF()); for (const [k, v] of Object.entries(DEF())) if (s[k] === undefined) s[k] = v; return s; };

export const STAGES = ['Acquaintance', 'Crush', 'Close friend', 'Confession', 'Dating', 'Steady couple'];
export const FRIENDS_STAGE = -1;
export const weekOf = (g) => Math.floor((g.day - 1) / 7);
export const MAX_WEEK_DATES = 2;
export const datesThisWeek = (g) => S(g).weekDates[weekOf(g)] || 0;
export const aff = (g, id) => S(g).aff[id] || 0;
export const crush = (g, id) => Math.min(10, Math.floor(aff(g, id) / 100));
export const partnerOf = (g) => S(g).partner;
export function stageOf(g, id) {
  const s = S(g);
  if (s.partner === id) return s.steady[id] ? 5 : 4;
  const a = aff(g, id), f = s.friends[id];
  if (f && a < f.at + 120) return FRIENDS_STAGE;
  const base = a >= 600 ? 3 : a >= 350 ? 2 : a >= 150 ? 1 : 0;
  return s.partner ? Math.min(base, 2) : base;
}
export const stageName = (g, id) => { const k = stageOf(g, id); return k === FRIENDS_STAGE ? 'Just friends' : STAGES[k]; };
addCondKind('romstage', (g, id) => (isCand(id) ? stageOf(g, id) : -2));
addCondKind('crush', (g, id) => (isCand(id) ? crush(g, id) : 0));
addCondKind('partner', (g, id) => (id === 'any' ? !!S(g).partner : S(g).partner === id));

// Raise affection (it never outruns friendship: one heart of friendship allows one crush level, plus a little).
const lastStage = new WeakMap();
export function addAff(g, id, n, why) {
  if (!isCand(id) || !n) return 0;
  const s = S(g), before = s.aff[id] || 0, hearts = g.hearts(id);
  const cap = s.partner === id ? 1000 : Math.min(1000, 100 * hearts + 99);
  const after = n > 0 ? Math.max(before, Math.min(before + n, cap)) : Math.max(0, before + n);
  s.aff[id] = after;
  const cb = Math.floor(before / 100), ca = Math.floor(after / 100);
  if (ca > cb) g.toast(`${firstName(id)}: crush level ${Math.min(10, ca)}`, 'heart');
  else if (n > 0 && after === before && before >= cap - 1 && !s.hintDay) { s.hintDay = g.day; g.toast('Spend a bit more time as friends first', 'i_star'); }
  refreshStage(g, id);
  return after - before;
}
export function refreshStage(g, id) {
  const k = stageOf(g, id), key = id;
  let m = lastStage.get(g); if (!m) lastStage.set(g, (m = {}));
  const prev = m[key];
  if (prev === undefined) { m[key] = k; return; }
  if (prev !== k) {
    m[key] = k;
    if (k > prev && k >= 1 && k <= 3) g.toast(`${firstName(id)}: ${STAGES[k]}`, 'heart');
    g.bus.emit('romStage', { npc: id, stage: k });
  }
}

// ---------- script helpers ----------
register('command', 'sv4r_aff', { run(game, step) { addAff(game, step.who, step.n); } });
export const A = (who, n) => ({ t: 'sv4r_aff', who, n });
export const call = (fn) => ({ t: 'call', fn });
export const pick = (arr, n = 0) => arr[Math.abs(Math.floor(n)) % arr.length];
export const markSeen = (key, title, npc) => call((g) => noteSeen(g, key, title, npc));
export function noteSeen(g, key, title, npc) {
  const s = S(g);
  if (!s.seen[key]) { s.seen[key] = { day: g.day, title, npc, picks: [] }; g.stat('romScenes'); }
}
// A recorded choice (for the Romance Archive).
export const rec = (key, text) => call((g) => { const e = S(g).seen[key]; if (e && !e.picks.includes(text)) e.picks.push(text); else if (!e) { S(g).seen[key] = { day: g.day, title: key, npc: null, picks: [text] }; } });
export function setCooldown(g, id, days) { S(g).cool[id] = g.day + days; }

// ---------- relationship changes ----------
export function startDating(g, id, by) {
  const s = S(g);
  s.partner = id; s.since = g.day; delete s.friends[id];
  g.setFlag('sv4r_dating', true); g.setFlag(`sv4r_dating_${id}`, true);
  g.stat('couples'); g.bus.emit('couple', { npc: id, by });
  g.toast(`You and ${firstName(id)} are dating!`, 'heart');
  refreshStage(g, id);
}
export function stayFriends(g, id) {
  const s = S(g);
  s.friends[id] = { day: g.day, at: aff(g, id) };
  g.addFriend(id, 20);
  refreshStage(g, id);
}
export function stepBack(g) {
  const s = S(g), id = s.partner;
  if (!id) return null;
  s.partner = null; s.steady = {}; g.setFlag('sv4r_dating', false); g.setFlag(`sv4r_dating_${id}`, false);
  s.friends[id] = { day: g.day, at: aff(g, id) };
  g.bus.emit('coupleEnded', { npc: id });
  refreshStage(g, id);
  return id;
}
export const sinceDays = (g) => (S(g).partner ? g.day - S(g).since : 0);

// ---------- affection sources ----------
const GIFT_AFF = { love: 14, like: 8, neutral: 2, dislike: 0, hate: 0 };
export function wireAffection(game) {
  const bus = game.bus;
  bus.on('gift', (e) => { if (e && isCand(e.npc)) { const n = (GIFT_AFF[e.reaction] || 0) * (e.birthday ? 2 : 1); if (n) addAff(game, e.npc, n); } });
  bus.on('talk', (e) => { if (e && isCand(e.npc)) { const s = S(game); if (s.talkDay[e.npc] !== game.day) { s.talkDay[e.npc] = game.day; addAff(game, e.npc, 3); } } });
  bus.on('heartUp', (e) => { if (e && isCand(e.npc)) addAff(game, e.npc, 10); });
  bus.on('heartEvent', (e) => { if (e && isCand(e.npc)) addAff(game, e.npc, 20); });
  // Flower Dance partner: remember who Misa asked, then reward by how well the dance went.
  const mg = game.minigame && game.minigame.bind(game);
  if (mg) game.minigame = (id, opts) => { try { if (id === 'sv2_dance' && opts && opts.partner) S(game).dancePartner = opts.partner; } catch (e) { /* guard */ } return mg(id, opts); };
  bus.on('minigameDone', (e) => {
    if (!e || e.id !== 'sv2_dance') return;
    const s = S(game), p = s.dancePartner; s.dancePartner = null;
    if (p && isCand(p)) { const sc0 = (e.result && e.result.score) || 0; addAff(game, p, sc0 > 0.7 ? 40 : sc0 > 0.4 ? 25 : 10); game.stat('romFestPartner'); }
  });
  // Starry Eve secret gift: the person Misa drew gets a little extra warmth.
  bus.on('stat', (e) => {
    if (!e || e.k !== 'secretGifts') return;
    const sec = game.state.sv2fest && game.state.sv2fest.secret;
    if (sec && sec.to && isCand(sec.to)) addAff(game, sec.to, 20);
  });
}

// ---------- console API ----------
export const API = {};
register('system', 'sv4Romance', {
  init(game) {
    wireAffection(game);
    game.sv4r = {
      state: () => S(game), aff: (id) => aff(game, id), add: (id, n) => addAff(game, id, n), stage: (id) => stageName(game, id),
      setAff: (id, n) => { S(game).aff[id] = n; refreshStage(game, id); }, ...Object.fromEntries(Object.entries(API).map(([k, f]) => [k, (...a) => f(game, ...a)])),
    };
    for (const ev of ['gameStart', 'gameLoaded', 'newGame']) bus_init(game, ev);
    game.bus.on('dayStart', () => {
      const s = S(game);
      if (s.partner && !s.steady[s.partner] && sinceDays(game) >= 14 && (s.datesWith[s.partner] || 0) >= 3) {
        s.steady[s.partner] = game.day; game.stat('steadyCouples');
        game.bus.emit('couple', { npc: s.partner, steady: true });
        game.toast(`${firstName(s.partner)} and you are a steady couple`, 'heart');
        game.mail(`sv4r_steady_${s.partner}`, nameOf(s.partner), `Hi Misa. I was thinking that being with you has become the easiest part of my week. Thank you for that. See you soon.`);
        refreshStage(game, s.partner);
      }
    });
  },
});
function bus_init(game, ev) { game.bus.on(ev, () => { for (const id of candidates()) refreshStage(game, id); }); }

export const romanceSteps = (who, ...items) => sc(who, ...items);
