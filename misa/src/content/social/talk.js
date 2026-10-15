// Conversation extras on top of systems/social.js:
//  - a low-priority talk hook per resident that, once a day, swaps the normal line for a reaction:
//    an apology after a twice-repeated bad gift, Misa's birthday, holidays, callbacks to heart-event choices,
//    "long time no see" catch-ups, outfit compliments, little gifts back (6+ hearts) and daily 8-heart perks
//  - daily small-talk friendship cap, daily NPC moods (cheerful / sleepy / grumpy) that nudge gift reactions
import { register, get, features } from '../../core/registry.js';
import { sc, ch, SOCIAL_NPCS, holidayOn, HOLIDAY_NAMES, giveItemOr, seasonOf, dateOf, met } from './util.js';
import { isBirthday } from '../../systems/social.js';

register('stateSlice', 'social', {
  default: () => ({ plans: [], queue: [], perks: {}, party: {}, remind: {}, texts: {}, chats: {}, lastText: {}, invites: 0, hangouts: 0 }),
});

// ---------- small talk cap ----------
export const SMALL_TALK_CAP = 30; // points a day per person from compliments, overheard chats, texts and catch-ups
export function smallTalk(game, id, n) {
  const f = game.friend(id);
  if (!f.small || f.small.day !== game.day) f.small = { day: game.day, pts: 0 };
  const add = Math.max(0, Math.min(n, SMALL_TALK_CAP - f.small.pts));
  if (add > 0) { f.small.pts += add; game.addFriend(id, add); }
  return add;
}

// ---------- daily moods ----------
const MOODS = ['cheerful', 'cheerful', 'calm', 'calm', 'calm', 'sleepy', 'grumpy'];
export function npcMood(game, id) {
  const r = game.rngFor('npcmood:' + id)();
  return MOODS[Math.floor(r * MOODS.length)];
}
export const MOOD_TEXT = { cheerful: 'in a cheerful mood', calm: 'calm and content', sleepy: 'a bit sleepy', grumpy: 'a little grumpy' };

// ---------- reactions ----------
const GENERIC_OUTFIT = ['happy|Ooh, new look? It suits you, Misa.', 'surprised|Oh! I almost didn\'t recognise you. That outfit is lovely.'];
const GENERIC_HOLIDAY = ['happy|Happy HOLIDAY, Misa! The whole town feels different today.', 'happy|It\'s HOLIDAY! Are you going to join in?'];
const GENERIC_CATCHUP = ['happy|Misa! It\'s been days. I was starting to wonder where you\'d got to.', 'happy|There you are! Long time no see. I saved up some news for you.'];
const GENERIC_UPSET = 'sad|You gave me that same thing again... I did say I didn\'t like it.';
const GENERIC_BDAY = 'happy|Wait, isn\'t today your birthday? Happy birthday, Misa!';
const pick = (arr, r) => arr[Math.floor(r * arr.length) % arr.length];
const outfitOf = (game) => game.state.outfit || 'hoodie';
const isDailyOutfit = (o) => o === 'hoodie' || o === 'uniform' || o === 'school_uniform';

// Which reaction (if any) is waiting for this person today?
export function pendingReaction(game, id) {
  const def = get('npc', id), f = game.friend(id);
  if (!def || !met(game, id) || f.socDay === game.day) return null;
  if (isBirthday(def, game) && f.bdayTalk !== game.day) return null; // the engine's own birthday chat goes first
  if (f.upset && game.day - f.upset <= 4) return { kind: 'upset' };
  if (seasonOf(game.day) === 'summer' && dateOf(game.day) === 3 && game.hearts(id) >= 2 && f.misaBday !== game.day) return { kind: 'misaBday' };
  const hol = holidayOn(game.day);
  if (hol && f.holDay !== game.day) return { kind: 'holiday', hol };
  const fu = (def.followups || []).find((x) => game.flag(x.flag) && game.flag(x.flag) !== true && game.flag(x.flag) < game.day && !(f.followed || []).includes(x.flag));
  if (fu) return { kind: 'followup', fu };
  if (f.talkedDay && game.day - f.talkedDay >= 5) return { kind: 'catchup' };
  const o = outfitOf(game);
  if (!isDailyOutfit(o) && !(f.outfits || []).includes(o) && game.rngFor('outfit:' + id)() < 0.7) return { kind: 'outfit', outfit: o };
  const perk8 = def.perks && def.perks[8] && def.perks[8].daily;
  if (perk8 && game.hearts(id) >= 8) return { kind: 'perk8' };
  const gb = def.perks && def.perks[6];
  if (gb && game.hearts(id) >= 6 && game.day - (f.giftBack || -99) >= 4 && game.rngFor('giftback:' + id)() < 0.35) return { kind: 'giftback' };
  return null;
}

function bookkeeping(game, id) {
  const f = game.friend(id);
  f.socDay = game.day;
  if (f.talkedDay !== game.day) { f.talkedDay = game.day; game.addFriend(id, 10); game.stat('talks'); }
}

export function reactionSteps(game, id, r) {
  const def = get('npc', id) || { lines: {} }, s = def.social || {}, f = game.friend(id), rnd = game.rngFor('react:' + id);
  const book = { t: 'call', fn: (g) => bookkeeping(g, id) };
  const kind = r ? r.kind : 'catchup';
  switch (kind) {
    case 'upset':
      return sc(id, book, (def.lines.upset || [GENERIC_UPSET])[0],
        ch('What do you say?',
          ['I\'m sorry. I won\'t do it again.', { t: 'call', fn: (g) => { g.friend(id).upset = 0; g.addFriend(id, 25); } }, (def.lines.apology || ['happy|...Okay. Thank you for saying sorry. We\'re good.'])[0]],
          ['(Change the subject)', 'neutral|...Mm. Anyway.']));
    case 'misaBday':
      return sc(id, book, { t: 'call', fn: (g) => { g.friend(id).misaBday = g.day; smallTalk(g, id, 10); } }, '*heart', (def.lines.misaBirthday || [GENERIC_BDAY])[0], '>happy|You remembered! Thank you.');
    case 'holiday': {
      const key = r ? r.hol : 'hanami', name = HOLIDAY_NAMES[key] || 'a holiday';
      const own = def.lines['hol_' + key];
      const line = own ? pick([].concat(own), rnd()) : pick(def.lines.festival || GENERIC_HOLIDAY, rnd()).replace(/HOLIDAY/g, name);
      return sc(id, book, { t: 'call', fn: (g) => { g.friend(id).holDay = g.day; smallTalk(g, id, 5); } }, line);
    }
    case 'followup': {
      const fu = r.fu;
      return sc(id, book, { t: 'call', fn: (g) => { const ff = g.friend(id); (ff.followed ||= []).push(fu.flag); smallTalk(g, id, 5); } }, ...[].concat(fu.line));
    }
    case 'outfit': {
      const lines = def.lines.outfit || GENERIC_OUTFIT, o = r.outfit, od = get('outfit', o);
      const extra = od && od.name ? `@${def.name} admires your ${od.name.toLowerCase()}.` : null;
      return sc(id, book, { t: 'call', fn: (g) => { const ff = g.friend(id); (ff.outfits ||= []).push(o); smallTalk(g, id, 6); g.stat('outfitCompliments'); } }, extra, pick(lines, rnd()), '>happy|Thanks!');
    }
    case 'perk8': {
      const p = def.perks[8];
      return sc(id, book, { t: 'call', fn: (g) => p.daily(g) }, ...[].concat(p.dailyLine || []));
    }
    case 'giftback': {
      const items = def.perks[6].items || [], pickIt = items.filter((it) => get('item', it));
      const it = pickIt.length ? pickIt[Math.floor(rnd() * pickIt.length)] : null;
      return sc(id, book, (def.lines.giftBack || ['happy|Oh, before I forget: I picked this up for you. It made me think of you.'])[Math.floor(rnd() * (def.lines.giftBack || [1]).length)],
        { t: 'call', fn: (g) => { g.friend(id).giftBack = g.day; if (!giveItemOr(g, it, 0)) g.addMoney(def.perks[6].coins || 30); g.stat('giftsReceived'); } }, '>happy|For me? Thank you!');
    }
    default: // catch-up after a while apart: a bonus so skipping days never costs friendship
      return sc(id, book, { t: 'call', fn: (g) => smallTalk(g, id, 10) }, pick(def.lines.catchup || GENERIC_CATCHUP, rnd()));
  }
}

register('system', 'socialTalk', {
  init(game) {
    registerReactionHooks();
    // gift extras: a cheerful mood adds 10%, a grumpy one takes 10% off; repeating a bad gift upsets them
    game.bus.on('gift', ({ npc, item, reaction }) => {
      const f = game.friend(npc), m = npcMood(game, npc), base = { love: 80, like: 45, neutral: 20 }[reaction];
      if (base && m === 'cheerful') game.addFriend(npc, Math.round(base * 0.1));
      if (base && m === 'grumpy') game.addFriend(npc, -Math.round(base * 0.1));
      if (reaction === 'dislike' || reaction === 'hate') {
        const bad = (f.badGifts ||= {});
        bad[item] = (bad[item] || 0) + 1;
        if (bad[item] >= 2) { f.upset = game.day; game.addFriend(npc, -15); }
      }
    });
  },
});
// Talk hooks must exist before the scripts test enumerates them, so register them eagerly as well.
export function registerReactionHooks() {
  for (const id of SOCIAL_NPCS) {
    const def = get('npc', id);
    if (!def || def.hidden || get('talkHook', 'soc_react_' + id)) continue;
    register('talkHook', 'soc_react_' + id, { npc: id, priority: -10, when: (g) => !!pendingReaction(g, id), steps: (g) => reactionSteps(g, id, pendingReaction(g, id)) });
  }
}

features('Friendship', [
  'Residents compliment Misa\'s outfit the first time they see her in something new',
  'Holiday greetings: everyone in town has something to say on festival days',
  'Friends at 2+ hearts wish Misa a happy birthday on Summer 3',
  'Friends bring up the choices you made in their heart events in later conversations',
  'Catch-up bonus: seeing a friend after 5+ days apart gives extra friendship instead of a penalty',
  'Daily friendship cap on small talk, so you never need to chat with everyone every day',
  'Daily moods: residents can be cheerful, calm, sleepy or grumpy, nudging gift reactions by 10%',
  'Giving the same disliked gift twice upsets a friend; saying sorry makes it right',
  'Friends at 6+ hearts sometimes surprise Misa with a little gift',
  'Daily 8-heart treats: a free Misa Latte from Mika and a personal fortune from Kiko',
]);
