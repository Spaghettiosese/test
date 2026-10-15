// Messages from friends: texts by friendship level, birthday reminders, thank-you notes after heart events,
// friendship perks at 4/6/8 hearts, best-friend daily texts, family texts, and Misa's surprise birthday party.
import { register, get, all, features } from '../../core/registry.js';
import { SOCIAL_NPCS, met, giveItemOr, seasonOf, dateOf, weekdayOf, sc, OVERRIDES, isSchoolDay } from './util.js';

const nameOf = (id) => (get('npc', id) || { name: id }).name;
// queued mail arrives on a later morning: { day, id, from, text, item?, coins? }
export function queueMail(game, m) { game.state.social.queue.push({ day: game.day + 1, ...m }); }

function deliver(game) {
  const s = game.state.social, now = s.queue.filter((m) => m.day <= game.day);
  s.queue = s.queue.filter((m) => m.day > game.day);
  for (const m of now) {
    game.mail(m.id, nameOf(m.from), m.text);
    if (m.item || m.coins) { if (giveItemOr(game, m.item, m.coins || 0)) game.toast(`${nameOf(m.from)} sent you a gift!`, 'i_mail'); }
    if (m.apply) { const p = get('npc', m.from).perks[8]; if (p && p.apply) p.apply(game); }
  }
}

function birthdays(game) {
  const tomorrow = game.day + 1, s = game.state.social;
  for (const n of all('npc')) {
    if (!n.birthday || (!n.hidden && !met(game, n.id))) continue;
    if (n.birthday.season === seasonOf(tomorrow) && n.birthday.day === dateOf(tomorrow) && s.remind[n.id] !== tomorrow) {
      s.remind[n.id] = tomorrow;
      const loves = (game.friend(n.id).knownGifts || []).map((i) => get('item', i)).filter(Boolean).map((i) => i.name);
      game.mail(`soc_bday_${n.id}_${tomorrow}`, 'Calendar', `Reminder: tomorrow is ${n.name}'s birthday! Gifts on a birthday count triple.${loves.length ? ` ${n.name} likes: ${loves.slice(0, 3).join(', ')}.` : ''}`);
    }
    if (n.birthday.season === game.season && n.birthday.day === dateOf(game.day)) game.toast(`Today is ${n.name}'s birthday!`, 'heart');
  }
}

// Friends text according to their hearts; best friends (10) text most days.
function texts(game) {
  const s = game.state.social, r = game.rngFor('texts');
  const pool = SOCIAL_NPCS.map((id) => get('npc', id)).filter((d) => d && !d.hidden && d.texts && game.hearts(d.id) >= 2 && game.day - (s.texts[d.id] || -9) >= 3);
  const send = (d, tier) => {
    const list = d.texts[tier] || [];
    if (!list.length) return;
    const text = list[Math.floor(r() * list.length)];
    s.texts[d.id] = game.day; s.lastText[d.id] = text;
    game.mail(`soc_txt_${d.id}_${game.day}`, d.name, text);
  };
  const tierOf = (d) => { const h = game.hearts(d.id); return h >= 10 ? 10 : h >= 8 ? 8 : h >= 5 ? 5 : 2; };
  const best = pool.filter((d) => game.hearts(d.id) >= 10);
  if (best.length && r() < 0.8) { send(best[Math.floor(r() * best.length)], 10); return; }
  if (pool.length && r() < 0.45) { const w = pool.map((d) => game.hearts(d.id)), tot = w.reduce((a, b) => a + b, 0); let x = r() * tot; for (const [i, d] of pool.entries()) { if ((x -= w[i]) < 0) { send(d, tierOf(d)); break; } } }
}

// Family: Mum texts every morning, Dad sends a recipe on Fridays, Aunt Nori pops up now and then.
function family(game) {
  const r = game.rngFor('family'), s = game.state.social;
  for (const [id, cond] of [['mum', true], ['dad', weekdayOf(game.day) === 4], ['nori', r() < 0.2]]) {
    const d = get('npc', id);
    if (!d || !cond || !d.texts) continue;
    const list = d.texts[seasonOf(game.day)] && r() < 0.4 ? d.texts[seasonOf(game.day)] : d.texts.any;
    const text = list[(game.day + Math.floor(r() * 3)) % list.length];
    s.lastText[id] = text;
    game.mail(`soc_fam_${id}_${game.day}`, d.name, text);
  }
}

// Perks: a welcome gift at 4 hearts (and their phone number at 2), gift-backs at 6, a lasting perk at 8.
function onHeartUp(game, { npc, hearts }) {
  const d = get('npc', npc), s = game.state.social;
  if (!d || !d.perks) return;
  const got = (s.perks[npc] ||= []);
  for (const tier of [2, 4, 6, 8]) {
    if (hearts < tier || got.includes(tier)) continue;
    got.push(tier);
    const p = d.perks[tier];
    if (tier === 2) queueMail(game, { id: `soc_num_${npc}`, from: npc, text: (d.texts && d.texts.number) || `Hi, it's ${d.name}! Here's my number. Text me sometime!` });
    else if (p) queueMail(game, { id: `soc_perk${tier}_${npc}`, from: npc, text: p.text || '', item: p.item, coins: p.coins, apply: tier === 8 });
  }
}

// Weekly perks (8 hearts): every Monday the friends with a weekly perk send something.
function weekly(game) {
  for (const id of SOCIAL_NPCS) {
    const d = get('npc', id), p = d && d.perks && d.perks[8];
    if (!p || !p.weekly || game.hearts(id) < 8 || weekdayOf(game.day) !== (p.weekday ?? 0)) continue;
    const r = game.rngFor('weekly:' + id), items = (p.weekly.items || []).filter((i) => get('item', i));
    const it = items.length ? items[Math.floor(r() * items.length)] : null;
    game.mail(`soc_week_${id}_${game.day}`, d.name, p.weekly.text);
    giveItemOr(game, it, p.weekly.coins || 40);
  }
}

// ---------- Misa's birthday (Summer 3): friends at 4+ hearts throw a surprise party at home after 17:00 ----------
const PARTY_SPOTS = ['sofa', 'kitchen', 'tv', 'desk', 'door_inside'];
const isParty = (game) => seasonOf(game.day) === 'summer' && dateOf(game.day) === 3 && game.minutes >= 17 * 60 && game.minutes < 22 * 60;
export function partyGuests(game) {
  return SOCIAL_NPCS.filter((id) => { const d = get('npc', id); return d && !d.hidden && id !== 'hana' && game.hearts(id) >= 4; })
    .sort((a, b) => game.friendPts(b) - game.friendPts(a)).slice(0, PARTY_SPOTS.length);
}
const partyKey = (game) => 'y' + Math.floor((game.day - 1) / 112);
OVERRIDES.push((game, id) => {
  if (!isParty(game) || game.state.social.party[partyKey(game)]) return undefined;
  const i = partyGuests(game).indexOf(id);
  return i < 0 ? undefined : { map: 'home', spot: PARTY_SPOTS[i], key: 'party' };
});
export function partySteps(game) {
  const guests = partyGuests(game).length ? partyGuests(game) : ['kai', 'suzu'];
  const steps = [{ t: 'call', fn: (g) => { g.state.social.party[partyKey(g)] = g.day; g.stat('birthdayParties'); } },
    { t: 'say', who: null, mood: null, text: 'The lights are off. Someone giggles in the dark...' },
    { t: 'sfx', name: 'chime' }];
  guests.forEach((id, i) => {
    const d = get('npc', id) || { lines: {} };
    steps.push({ t: 'emote', who: id, icon: 'heart' });
    steps.push(...sc(id, (d.lines && d.lines.party && d.lines.party[0]) || (i === 0 ? 'happy|SURPRISE! Happy birthday, Misa!' : 'happy|Happy birthday!')));
    const p = d.perks && d.perks[6];
    if (p && p.items) steps.push({ t: 'call', fn: (g) => giveItemOr(g, p.items[0], 20) });
  });
  steps.push(...sc('misa', 'surprised|You... all of you planned this? In my house?',
    guests[0] ? `${guests[0]}/happy|Mochi let us in. Well, she didn't stop us.` : null,
    '@Everyone sings, badly and loudly. Mochi watches from the top of the fridge.',
    'happy|This is the best birthday I\'ve ever had. Thank you, everyone.'));
  steps.push({ t: 'call', fn: (g) => { for (const id of guests) g.addFriend(id, 30); g.addMood(30); } }, { t: 'time', add: 90 });
  return steps;
}

register('system', 'socialMail', {
  init(game) {
    const morning = () => { deliver(game); birthdays(game); family(game); texts(game); weekly(game); };
    game.bus.on('dayStart', morning);
    game.bus.on('heartUp', (e) => onHeartUp(game, e));
    game.bus.on('heartEvent', ({ npc, id }) => {
      const d = get('npc', npc), ev = d && (d.events || []).find((e) => e.id === id);
      if (ev && ev.thanks) queueMail(game, { id: `soc_thx_${id}`, from: npc, text: ev.thanks, item: ev.thanksItem, coins: ev.thanksCoins });
    });
    const tryParty = () => {
      if (!game.world || game.world.map.id !== 'home' || !isParty(game) || game.state.social.party[partyKey(game)] || !partyGuests(game).length) return;
      if (game.scenes.top !== game.world) return;
      game.run(partySteps(game));
    };
    game.bus.on('mapEnter', () => setTimeout(tryParty, 1200));
    game.bus.on('hour', () => tryParty());
  },
});
register('script', 'soc_party', { steps: (g) => partySteps(g) });

features('Friendship', [
  'Friends give Misa their phone number at 2 hearts and start texting her, more often as you grow closer',
  'Best friends (10 hearts) text Misa most mornings',
  'Birthday reminder message the day before a friend\'s birthday, with the gifts you know they like',
  'Morning reminder when it is someone\'s birthday today',
  'Thank-you notes arrive the morning after heart events, sometimes with a small gift',
  'Friendship perk at 4 hearts: a welcome gift in the mail',
  'Friendship perks at 8 hearts: each friend gives a lasting bonus (faster running, more energy, a bigger bag, skill lessons, weekly parcels...)',
  'Surprise birthday party: on Summer 3 evening, friends at 4+ hearts wait for Misa at home with gifts',
  'Mum texts good morning every day, Dad sends a recipe every Friday and Aunt Nori checks in now and then',
  'Weekly 8-heart parcels from Suzu, Hina, Pip, Mr. Hayashi and Sachiko',
]);
