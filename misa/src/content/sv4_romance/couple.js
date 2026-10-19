// Steady-couple content (sv4_romance): five events per partner (meeting the family, exam week, a festival date, the first-date
// anniversary, a small misunderstanding resolved kindly) and three daily perks (a morning text, a packed lunch, walking home).
// Steady couples also get a little extra daily luck. Console: __misa.sv4r.couple('kai','family')
import { register, get } from '../../core/registry.js';
import { sc, ch, holidayOn, isSchoolDay, giveItemOr, mood, time } from '../social/util.js';
import { S, API, A, call, pick, noteSeen, addAff, firstName, sinceDays, candidates } from './core.js';
import { voiceOf } from './voices.js';
import { pushLog } from './texts.js';
import { addLuck } from '../sv_life/state.js';

export const EVENTS = {
  family: { title: 'Meeting the family', min: 5, ok: () => true, hint: 'a weekend invitation' },
  exam: { title: 'Exam week together', min: 10, ok: (g) => isSchoolDay(g.day) && g.minutes >= 15 * 60 + 30, hint: 'after school on a school day' },
  festival: { title: 'Festival date', min: 7, ok: (g) => !!holidayOn(g.day), hint: 'on a festival day' },
  anniv: { title: 'First date anniversary', min: 28, ok: () => true, hint: 'four weeks after you got together' },
  mix: { title: 'A small misunderstanding', min: 14, ok: (g, id) => !!S(g).coupleDone[`${id}_family`], hint: 'after meeting the family' },
};
export const EVENT_KEYS = Object.keys(EVENTS);
export const doneKey = (id, k) => `${id}_${k}`;
export function readyEvents(g, id) {
  const s = S(g);
  if (s.partner !== id || s.coupleDay === g.day) return [];
  const since = sinceDays(g);
  return EVENT_KEYS.filter((k) => !s.coupleDone[doneKey(id, k)] && since >= EVENTS[k].min && EVENTS[k].ok(g, id));
}
export function coupleSteps(g, id, key) {
  const v = voiceOf(id);
  return sc(id, ...v.couple[key], call((gg) => finishEvent(gg, id, key)), mood(8), time(45));
}
function finishEvent(g, id, key) {
  const s = S(g);
  s.coupleDone[doneKey(id, key)] = g.day; s.coupleDay = g.day;
  noteSeen(g, `couple_${id}_${key}`, `${firstName(id)}: ${EVENTS[key].title}`, id);
  addAff(g, id, 10); g.addFriend(id, 20); g.stat('coupleEvents');
  g.bus.emit('coupleEvent', { npc: id, id: key });
}

export function walkSteps(g, id) {
  const v = voiceOf(id);
  const done = (n, m) => call((gg) => { S(gg).perkDay.walk = gg.day; if (m) gg.addMood(m); });
  return sc(id, '*heart', pick(v.perk.walk, g.day),
    ch('Walk home together?',
      ['Take the long way, along the harbour', '@The sea smells of salt and the gulls are loud. You walk close, shoulders touching, until the path splits at the lane.', A(id, 8), done(0, 8)],
      ['Take the short way, and talk', '@You walk shoulder to shoulder, trading small news from the day, as if nobody else existed.', A(id, 6), done(0, 6)],
      ['Not today, but see you tomorrow', 'happy|Of course. Tomorrow, then. Rest well, Misa.', done(0, 0)]),
    time(25));
}
export const walkReady = (g, id) => { const s = S(g); return s.partner === id && isSchoolDay(g.day) && g.minutes >= 15 * 60 + 30 && g.minutes < 20 * 60 && s.perkDay.walk !== g.day; };

export function installCoupleHooks() {
  for (const id of candidates()) {
    register('talkHook', 'sv4r_couple_' + id, { npc: id, priority: 55, when: (g) => readyEvents(g, id).length > 0, steps: (g) => coupleSteps(g, id, readyEvents(g, id)[0] || 'family') });
    register('talkHook', 'sv4r_walk_' + id, { npc: id, priority: 38, when: (g) => walkReady(g, id), steps: (g) => walkSteps(g, id) });
  }
}
register('system', 'sv4Couple', {
  init(game) {
    game.bus.on('dayStart', () => {
      const s = S(game), id = s.partner;
      if (!id || !get('npc', id)) return;
      const v = voiceOf(id);
      if (s.perkDay.morning !== game.day) {
        s.perkDay.morning = game.day;
        const text = pick(v.perk.morning, game.day).replace(/^[a-z]+\|/, '').replace(/^\(Text\)\s*/, '');
        pushLog(game, id, { me: false, text, ico: 'heart' });
        game.addMood(4); game.toast(`Morning text from ${firstName(id)}`, 'heart');
      }
      if (isSchoolDay(game.day) && s.perkDay.lunch !== game.day && game.rngFor('sv4lunch:' + game.day)() < 0.6) {
        s.perkDay.lunch = game.day;
        const [item, coins, note] = v.perk.lunch;
        giveItemOr(game, item, coins || 30);
        game.toast(note.slice(0, 60), 'heart');
      }
      if (s.steady[id]) { try { addLuck(game, 3); } catch (e) { /* luck system missing */ } }
      for (const k of readyEvents(game, id).slice(0, 1)) game.toast(`${firstName(id)} would like to talk to you (${EVENTS[k].hint})`, 'heart');
    });
  },
});
API.couple = (g, id, key) => g.run(coupleSteps(g, id, key || 'family'));
API.makeCouple = (g, id) => { const s = S(g); s.partner = id; s.since = g.day - 30; s.aff[id] = Math.max(s.aff[id] || 0, 900); g.friend(id).pts = 1000; g.setFlag('sv4r_dating', true); };
