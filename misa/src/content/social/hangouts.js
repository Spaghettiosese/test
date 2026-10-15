// Hangouts (DESIGN #422): from 3 hearts, invite a friend (Contacts app) to meet at a place and time.
// They show up there through a schedule override; talk to them to start a short scene that depends on the place.
import { register, get, features } from '../../core/registry.js';
import { sc, ch, SOCIAL_NPCS, OVERRIDES, FREE, clock12, placeName, HM, mood, time } from './util.js';

export const HANGOUT_HEARTS = 3;
export const SLOTS = [10 * 60, 13 * 60, 16 * 60, 17 * 60 + 30, 19 * 60];
export const PLACES = {
  cafe: { map: 'cafe', spot: 'table_2', name: 'Cafe Kumo', opts: [['Share a slice of cake', 'food'], ['Try the seasonal drink', 'cozy'], ['People-watch by the window', 'quiet']] },
  park: { map: 'park', spot: 'bench', name: 'Sakura Park', opts: [['Feed the ducks', 'nature'], ['Race to the bandstand', 'active'], ['Watch the clouds', 'quiet']] },
  beach: { map: 'beach', spot: 'towel', name: 'Shell Beach', opts: [['Look for shells', 'nature'], ['Skip stones', 'active'], ['Build a sandcastle', 'art']] },
  arcade: { map: 'mart', spot: 'arcade', name: 'the arcade cabinet', opts: [['Play the claw machine', 'luck'], ['High score battle', 'games'], ['Pull the gacha', 'luck']] },
  shrine: { map: 'shrine', spot: 'lookout', name: 'the shrine lookout', opts: [['Draw fortunes', 'luck'], ['Make a wish together', 'quiet'], ['Sketch the view', 'art']] },
  harbour: { map: 'harbour', spot: 'noodle_stand', name: 'the harbour', opts: [['Share a bowl of noodles', 'food'], ['Watch the boats come in', 'quiet'], ['Count the gulls', 'nature']] },
  library: { map: 'library', spot: 'table_1', name: 'the library', opts: [['Read side by side', 'quiet'], ['Look up weird facts', 'study'], ['Write a silly story', 'art']] },
  pines: { map: 'sunny_pines', spot: 'garden_bench', name: 'Sunny Pines', opts: [['Pour the tea', 'cozy'], ['Play cards', 'games'], ['Walk around the garden', 'nature']] },
};
const RESULT = {
  food: 'They split it right down the middle, crumbs and all.', cozy: 'Warm cups, slow talk, and nowhere else to be.', quiet: 'A comfortable quiet settles over you both.',
  nature: 'You spot something tiny and wonderful together.', active: 'You both end up out of breath and laughing.', art: 'It\'s lopsided, but it\'s yours.',
  luck: 'Fortune smiles... a little bit, anyway.', games: 'The score is close. Very, very close.', study: 'You learn three useless and amazing things.',
};

export const plansOf = (game) => game.state.social.plans;
export const planFor = (game, id) => plansOf(game).find((p) => p.npc === id && !p.done && p.day >= game.day);
const placesFor = (def) => (def.social && def.social.places) || Object.keys(PLACES).filter((k) => k !== 'pines');
export { placesFor };
const inWindow = (game, p) => p.day === game.day && game.minutes >= p.at - 30 && game.minutes <= p.at + 150;

// Can this friend come? Returns null (yes) or a reason line in their voice.
export function availability(game, id, day, at) {
  const d = get('npc', id), s = d.social || {};
  const kind = s.free || 'student';
  const why = typeof kind === 'function' ? kind(day, at) : FREE[kind](day, at);
  if (!why) return null;
  return (s.busy && s.busy[why]) || s.busyLine || 'sad|Ah, I can\'t make that time. Another slot?';
}
export function invite(game, id, placeKey, day, at) {
  const reason = availability(game, id, day, at);
  if (reason) return { ok: false, line: reason };
  const s = game.state.social;
  s.plans = s.plans.filter((p) => p.npc !== id || p.done);
  s.plans.push({ npc: id, place: placeKey, day, at, done: false });
  s.invites++;
  const d = get('npc', id), when = `${day === game.day ? 'today' : 'tomorrow'} at ${clock12(at)}`;
  return { ok: true, line: (d.social && d.social.accept) ? d.social.accept.replace('WHEN', when).replace('PLACE', PLACES[placeKey].name) : `happy|Yes! ${PLACES[placeKey].name}, ${when}. See you there!` };
}

OVERRIDES.push((game, id) => {
  const p = plansOf(game).find((x) => x.npc === id && !x.done && inWindow(game, x));
  if (!p) return undefined;
  const pl = PLACES[p.place];
  return { map: pl.map, spot: pl.spot, key: 'hangout' };
});

export function hangoutSteps(game, id, plan) {
  const d = get('npc', id) || { name: id }, hs = (d.social && d.social.hang) || {}, likes = (d.social && d.social.likes) || [];
  const key = plan ? plan.place : placesFor(d)[0], pl = PLACES[key];
  const fav = hs.fav === key;
  const opt = ([text, tag]) => [text,
    `@${RESULT[tag]}`,
    likes.includes(tag) ? (hs.yay || 'happy|This was such a good idea!') : (hs.ok || 'neutral|That was nice. Thanks, Misa.'),
    { t: 'call', fn: (g) => g.addFriend(id, likes.includes(tag) ? 15 : 0) }];
  return sc(id,
    { t: 'soc_arrive', who: id }, { t: 'soc_face', who: id },
    { t: 'call', fn: (g) => { const p = plan && plansOf(g).find((x) => x === plan || (x.npc === plan.npc && x.day === plan.day && x.at === plan.at)); if (p) p.done = true; const f = g.friend(id); if (f.talkedDay !== g.day) { f.talkedDay = g.day; g.stat('talks'); } f.socDay = g.day; g.state.social.hangouts++; g.stat('hangouts'); } },
    '*heart', hs.hi || 'happy|You came! Okay, I\'m officially in hangout mode.',
    hs[key] || `happy|I like ${pl.name}. It feels different when you\'re not just passing through.`,
    fav ? (hs.favLine || 'happy|This is my favourite place in town, you know.') : null,
    ch('What should we do?', ...pl.opts.map(opt)),
    hs.bye || 'happy|Let\'s do this again sometime. Promise?',
    { t: 'call', fn: (g) => g.addFriend(id, 35 + (fav ? 10 : 0)) }, mood(6), time(60),
    { t: 'soc_leave', who: id });
}

register('system', 'socialHangouts', {
  init(game) {
    game.bus.on('dayStart', () => {
      const s = game.state.social;
      for (const p of s.plans) if (!p.done && p.day < game.day) {
        const d = get('npc', p.npc);
        game.mail(`soc_miss_${p.npc}_${p.day}`, d ? d.name : p.npc, (d && d.social && d.social.missed) || 'No worries about yesterday! Let\'s pick another day.');
      }
      s.plans = s.plans.filter((p) => !p.done && p.day >= game.day);
      for (const p of s.plans) if (p.day === game.day) game.toast(`Today: meet ${(get('npc', p.npc) || {}).name} at ${PLACES[p.place].name}, ${clock12(p.at)}`, 'i_cal');
    });
    game.bus.on('hour', ({ h }) => {
      for (const p of plansOf(game)) if (!p.done && p.day === game.day && Math.floor(p.at / 60) === h + 1) game.toast(`Soon: ${(get('npc', p.npc) || {}).name} at ${PLACES[p.place].name} (${clock12(p.at)})`, 'i_cal');
    });
  },
});

for (const id of SOCIAL_NPCS) {
  const d = get('npc', id);
  if (!d || d.hidden) continue;
  register('talkHook', 'soc_hangout_' + id, {
    npc: id, priority: 40,
    when: (g) => { const p = planFor(g, id); return !!p && inWindow(g, p) && g.world && g.world.map && g.world.map.id === PLACES[p.place].map; },
    steps: (g) => hangoutSteps(g, id, planFor(g, id)),
  });
}
export { HM, placeName };

features('Friendship', [
  'Hangouts: from 3 hearts, invite a friend from the Contacts app to a place and time of your choice',
  'Eight hangout places (cafe, park, beach, arcade, shrine, harbour, library, Sunny Pines), each with its own activities',
  'Invited friends really go there: they walk to the meeting place at the agreed time',
  'Friends say no when they are busy (class, work, bedtime) and tell you why',
  'Each friend enjoys different hangout activities and has a favourite place, for bonus friendship',
  'Hangout reminders in the morning and an hour before you meet',
  'Miss a hangout and your friend sends a kind "no worries" message the next day',
  'Hangout scenes: your friend greets you, talks about the place and reacts to the activity you pick',
]);
