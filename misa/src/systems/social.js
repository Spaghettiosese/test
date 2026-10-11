// Talking, gifts and heart events.
// NPC lines: def.lines = { default: [...], morning, afternoon, evening, night, rain, snow, sunny, spring..winter,
//   weekend, weekday, h2, h4, h6, h8, h10 (heart tiers), at_<mapId>, firstMeet, birthday, gift_love, gift_like,
//   gift_neutral, gift_dislike, gift_hate }. A line is a string ("happy|Text" sets the portrait mood) or [string].
// Quest/story dialogue: register('talkHook', id, { npc, when(game), steps(game, npcEntity), priority })
import { register, get, all, features } from '../core/registry.js';
import { seasonOf, dateOf } from '../core/time.js';
import { check } from '../core/cond.js';

const MOODS = /^(neutral|happy|surprised|sad|sleepy|angry)\|/;
export function parseLine(line, game) {
  let mood = 'neutral', text = String(line);
  const m = text.match(MOODS);
  if (m) { mood = m[1]; text = text.slice(m[0].length); }
  text = text.replace(/\{season\}/g, game.season).replace(/\{day\}/g, game.day).replace(/\{weekday\}/g, ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][game.weekday]);
  return { mood, text };
}
const pool = (v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

export function isBirthday(def, game) { return def.birthday && def.birthday.season === game.season && def.birthday.day === dateOf(game.day); }

export function pickLine(def, game) {
  const L = def.lines || {}, f = game.friend(def.id), h = game.hearts(def.id), map = game.world && game.world.map ? game.world.map.id : '';
  const ctx = [];
  const add = (k, w) => { const p = pool(L[k]); if (p.length) ctx.push({ p, w, k }); };
  for (let t = 2; t <= 10; t += 2) if (h >= t) add('h' + t, 2 + t / 2);
  add('at_' + map, 4); add(game.part, 2); add(game.weather, 3); add(seasonOf(game.day), 2); add(game.isWeekend ? 'weekend' : 'weekday', 1.5);
  add('default', 2);
  if (!ctx.length) return { mood: 'neutral', text: '...' };
  let total = ctx.reduce((a, c) => a + c.w, 0), r = game.rng() * total, c = ctx[0];
  for (const x of ctx) { if ((r -= x.w) < 0) { c = x; break; } }
  let opts = c.p.filter((l) => l !== f.lastLine);
  if (!opts.length) opts = c.p;
  const line = opts[Math.floor(game.rng() * opts.length)];
  f.lastLine = line;
  return parseLine(line, game);
}

export function talk(game, npc) {
  const def = npc.def, id = def.id, f = game.friend(id);
  npc.talkT = 999;
  const done = () => { npc.talkT = 0; };
  const hooks = all('talkHook').filter((h) => h.npc === id && check(h.when, game)).sort((a, b) => (b.priority || 0) - (a.priority || 0));
  if (hooks.length) return game.run(hooks[0].steps(game, npc)).then(done);
  const steps = [];
  if (!game.state.seen['met:' + id]) {
    game.state.seen['met:' + id] = game.day;
    const fm = pool(def.lines && def.lines.firstMeet);
    for (const l of fm.length ? fm : [`Oh, hi! I'm ${def.name}. You must be new in town.`]) { const p = parseLine(l, game); steps.push({ t: 'say', who: id, mood: p.mood, text: p.text }); }
    game.addFriend(id, 15);
    game.bus.emit('meet', { npc: id });
  } else if (isBirthday(def, game) && f.bdayTalk !== game.day) {
    f.bdayTalk = game.day;
    const p = parseLine(pool(def.lines && def.lines.birthday)[0] || 'happy|It\'s my birthday today! Thanks for remembering... you did remember, right?', game);
    steps.push({ t: 'say', who: id, mood: p.mood, text: p.text });
  } else {
    const p = pickLine(def, game);
    steps.push({ t: 'say', who: id, mood: p.mood, text: p.text });
  }
  if (f.talkedDay !== game.day) { f.talkedDay = game.day; game.addFriend(id, 10); game.stat('talks'); }
  return game.run(steps).then(done);
}

const REACT = { love: 80, like: 45, neutral: 20, dislike: -20, hate: -40 };
const GENERIC = {
  love: ['happy|Oh my gosh! This is my favourite thing in the world! Thank you!!', 'happy|You remembered?! I love it!'],
  like: ['happy|Oh, for me? Thank you, that\'s really sweet.', 'happy|Nice! I like this a lot.'],
  neutral: ['Thanks, that\'s kind of you.', 'Oh, thank you!'],
  dislike: ['sad|Um... thanks, I guess.', 'neutral|Oh. That\'s... a gift.'],
  hate: ['angry|Why would you give me this?', 'sad|...I really don\'t like this.'],
};
export function reaction(def, itemId) {
  const it = get('item', itemId) || {}, gf = def.gifts || {};
  if ((gf.love || []).includes(itemId)) return 'love';
  if ((gf.hate || []).includes(itemId)) return 'hate';
  if ((gf.like || []).includes(itemId)) return 'like';
  if ((gf.dislike || []).includes(itemId)) return 'dislike';
  const tags = it.tags || [];
  if ((gf.loveTags || []).some((t) => tags.includes(t))) return 'love';
  if ((gf.likeTags || []).some((t) => tags.includes(t))) return 'like';
  if ((gf.dislikeTags || []).some((t) => tags.includes(t))) return 'dislike';
  if (tags.includes('universalLove')) return 'love';
  if (tags.includes('trash')) return 'hate';
  return 'neutral';
}
export function gift(game, npc, itemId) {
  const def = npc.def, id = def.id, f = game.friend(id), it = get('item', itemId);
  if (!it || !game.has(itemId)) return;
  const bday = isBirthday(def, game);
  if (f.giftedDay === game.day) return game.run([{ t: 'say', who: id, mood: 'surprised', text: 'You already gave me something today! Save it for another time.' }]);
  if ((f.giftsWeek || 0) >= 2 && !bday) return game.run([{ t: 'say', who: id, mood: 'neutral', text: 'You\'ve given me so much this week already. Let\'s just hang out!' }]);
  const r = reaction(def, itemId);
  game.take(itemId, 1);
  f.giftedDay = game.day; f.giftsWeek = (f.giftsWeek || 0) + 1;
  const pts = REACT[r] * (bday ? 3 : 1);
  game.addFriend(id, pts);
  if ((r === 'love' || r === 'like') && !(f.knownGifts ||= []).includes(itemId)) f.knownGifts.push(itemId);
  game.stat('gifts');
  game.bus.emit('gift', { npc: id, item: itemId, reaction: r, birthday: bday });
  const lines = pool(def.lines && def.lines['gift_' + r]);
  const p = parseLine(lines.length ? lines[Math.floor(game.rng() * lines.length)] : GENERIC[r][Math.floor(game.rng() * GENERIC[r].length)], game);
  const steps = [{ t: 'say', who: id, mood: p.mood, text: p.text }];
  if (bday) steps.push({ t: 'say', who: id, mood: 'happy', text: 'And on my birthday, too! You\'re the best.' });
  if (r === 'love' || r === 'like') steps.unshift({ t: 'emote', who: id, icon: 'heart' }, { t: 'sfx', name: 'heart' });
  return game.run(steps);
}

// Heart events: def.events = [{ id, hearts, map, when?(game), script(game) -> steps }]
function checkHeartEvents(game) {
  if (!game.world || game.scenes.top !== game.world || game.world.busy) return;
  for (const def of all('npc')) for (const e of def.events || []) {
    const f = game.friend(def.id);
    if ((f.events || []).includes(e.id) || game.hearts(def.id) < e.hearts) continue;
    if (e.map && e.map !== game.world.map.id) continue;
    if (!check(e.when, game)) continue;
    (f.events ||= []).push(e.id);
    game.bus.emit('heartEvent', { npc: def.id, id: e.id });
    game.run(e.script(game));
    return;
  }
}

register('system', 'social', {
  init(game) {
    game.talk = (npc) => talk(game, npc);
    game.giveGift = (npc, item) => gift(game, npc, item);
    game.bus.on('dayStart', () => { if (game.weekday === 0) for (const f of Object.values(game.state.friends)) f.giftsWeek = 0; });
    game.bus.on('mapEnter', () => setTimeout(() => checkHeartEvents(game), 700));
    game.bus.on('hour', () => checkHeartEvents(game));
  },
});

features('Friendship', [
  'Talk to anyone in town with E; lines change with time of day, weather, season, weekday, location and friendship level',
  'Talking to someone once a day raises friendship',
  'First meetings: every resident introduces themselves the first time you talk',
  'Ten-heart friendship meter per resident',
  'Gift giving: loved / liked / neutral / disliked / hated reactions with different friendship changes',
  'One gift per person per day, two per week (resets Monday)',
  'Birthdays: gifts on a birthday count triple, and residents mention their birthday',
  'Known gifts are recorded in the Friends app after a liked or loved gift',
  'Heart events: special scenes that trigger at a place once a friendship level is reached',
  'Residents never repeat the same line twice in a row',
  'Heart and emote bubbles over characters\' heads',
  'Quest and story dialogue can take over a conversation (talk hooks)',
]);
