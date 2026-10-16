// Family video calls (Wed and Sun evenings), the yard mailbox (letters, parcels, catalogues, postcards),
// and festival invitations by text. Daily family texts and friendship texts belong to the social area.
import { register, get, all, features } from '../../core/registry.js';
import { seasonOf, dateOf, weekdayOf, yearOf } from '../../core/time.js';

const say = (who, mood, text) => ({ t: 'say', who, mood, text });
const N = (text) => ({ t: 'say', who: null, mood: null, text });
const call = (fn) => ({ t: 'call', fn });
const ev = (game) => (game.state.events ||= { last: {}, day: 0, n: 0, mailbox: [], lost: null, blackoutUntil: 0, calls: {}, sent: {} });
const nameOf = (id) => (get('npc', id) || { name: id }).name;
const has = (id) => !!get('item', id);

// ---------- mailbox ----------
// A piece of post: { id, kind: 'letter'|'parcel'|'catalogue'|'postcard'|'card', from, text, items?: {id: n}, money? }
export function post(game, m) {
  const st = ev(game);
  if (st.sent[m.id]) return false;
  st.sent[m.id] = game.day;
  st.mailbox.push({ day: game.day, ...m });
  return true;
}
const KIND = { letter: 'A letter', parcel: 'A parcel', catalogue: 'The Star Catalogue', postcard: 'A postcard', card: 'A card' };
function openMail(game) {
  const st = ev(game), box = st.mailbox.splice(0);
  if (!box.length) return game.run([{ t: 'sfx', name: 'door' }, say('misa', 'neutral', game.season === 'autumn' ? 'Just a red leaf in the mailbox today.' : 'Nothing in the mailbox today.')]);
  const steps = [{ t: 'sfx', name: 'page' }];
  for (const m of box) {
    steps.push(N(`${KIND[m.kind] || 'Post'} from ${m.from}.`), say(null, null, `"${m.text}"`));
    steps.push(call((g) => {
      for (const [id, n] of Object.entries(m.items || {})) if (has(id)) g.give(id, n);
      if (m.money) g.addMoney(m.money);
      g.mail('ev_' + m.id, m.from, m.text, { kind: m.kind, mailbox: true });
      g.stat('lettersRead');
      if (m.kind === 'catalogue') g.setFlag('catalogue_' + g.season);
    }));
    if (m.kind === 'catalogue' && get('phoneApp', 'catalogue')) steps.push({ t: 'choice', prompt: 'Browse the catalogue?', options: [{ text: 'Open it', steps: [call((g) => { g.open('phone', 'catalogue'); })] }, { text: 'Later', steps: [] }] });
  }
  steps.push(say('misa', 'happy', box.length > 1 ? 'So much post today!' : 'I love getting post.'), { t: 'mood', n: 3 + box.length * 2 });
  return game.run(steps);
}
register('interaction', 'mailbox', {
  label: (g) => { const n = ev(g).mailbox.length; return n ? `Check the mailbox (${n})` : 'Mailbox'; },
  run: (g) => openMail(g),
  overlay(game, world, obj, x, y) { if (ev(game).mailbox.length && Math.floor(game.clock * 2) % 4 !== 3) world.drawEmote('i_mail', obj.x * 16 + obj.w * 8, y - 2); },
});

const NORI_NOTES = {
  spring: ['Spring! Draw everything pink, that\'s my rule. Here is a little something for the house.', 'I found this at a flea market and thought: that is a Misa thing.'],
  summer: ['It is SO hot in the city. I am drawing in front of the fridge with the door open. Enjoy this!', 'A summer present, as promised. Drink lots of water. Tell Mochi I said hi.'],
  autumn: ['Autumn colours make my brushes happy. Sending a little cozy your way.', 'Is Goro still growing those ridiculous pumpkins? Send me a photo!'],
  winter: ['Wear a scarf! Your mum will ask me if you are wearing a scarf. Are you wearing a scarf?', 'A winter parcel to keep you warm. Save me a seat on the sofa for Starry Eve.'],
};
const NORI_ITEMS = { spring: ['gift_fest_postcard'], summer: ['dish_fest_cotton_candy'], autumn: ['mat_ev_acorn', 'gift_fest_postcard'], winter: ['drink_fest_cocoa'] };
const MUM_POSTCARDS = [
  'We followed a pod of dolphins all morning! One jumped so close it splashed my notebook. I miss you. Love, Mum.',
  'Dad tried to make sushi in a storm. The rice won. We are fine, the kitchen is not. Love, Mum.',
  'Today I saw a whale shark. It was the size of the bus to school! Is Mochi being good? Love, Mum.',
  'We crossed the date line, so I got to have the same Tuesday twice. Both were nice. Love, Mum.',
  'The night sky out here has no lights at all. I found the Little Lantern star and thought of you. Love, Mum.',
];
function dailyPost(game) {
  const day = game.day, s = seasonOf(day), d = dateOf(day), y = yearOf(day), r = game.rngFor('post');
  if (day < 2) return;
  if (d === 1) post(game, { id: `cat_${s}_${y}`, kind: 'catalogue', from: 'Aunt Nori', text: `The ${s} edition of my Star Catalogue! Cozy things for the house, paid for with Star Stickers. Circle what you like!` });
  if (weekdayOf(day) === 5) { const notes = NORI_NOTES[s], items = NORI_ITEMS[s]; post(game, { id: `nori_${day}`, kind: 'parcel', from: 'Aunt Nori', text: notes[Math.floor(r() * notes.length)], items: { [items[Math.floor(r() * items.length)]]: 1 } }); }
  if (day % 14 === 3) post(game, { id: `mum_${day}`, kind: 'postcard', from: 'Mum', text: MUM_POSTCARDS[Math.floor(day / 14) % MUM_POSTCARDS.length], items: day % 28 === 3 ? { gift_ship_shell: 1 } : { gift_ship_photo: 1 } });
  if (s === 'summer' && d === 3) {
    post(game, { id: `bday_mum_${y}`, kind: 'card', from: 'Mum and Dad', text: 'Happy birthday to our favourite person in the whole world! Sixteen... no, wait, you\'re still fifteen in this game of life? Either way, we love you. Spend this on something fun.', money: 1000 });
    post(game, { id: `bday_nori_${y}`, kind: 'card', from: 'Aunt Nori', text: 'HAPPY BIRTHDAY! I drew you as a superhero. Mochi is your sidekick. Obviously.', items: { gift_fest_postcard: 1, dish_fest_candy_apple: 1 } });
  }
  if (s === 'spring' && d === 15 && get('npc', 'hana')) post(game, { id: `hana_bday_${y}`, kind: 'letter', from: 'Sunny Pines', text: 'A reminder from the staff: today is Hana Aoki\'s birthday. She has asked for no fuss. She would love a visit.' });
}

// ---------- weekly video call with Mum and Dad ----------
function callTopics(game) {
  const st = game.state.stats, out = [], last = ev(game).callStats || {};
  const diff = (k) => (st[k] || 0) - (last[k] || 0);
  if (diff('fishCaught') > 0) out.push([say('dad', 'happy', `${diff('fishCaught')} fish this week? Bring them home and I\'ll cook them. Actually don\'t, they\'ll be ancient by then.`)]);
  if (diff('cooked') > 0) out.push([say('dad', 'happy', 'You\'ve been cooking! I\'m so proud I could cry. I am crying. It\'s the onions.')]);
  if (diff('festivalsAttended') > 0) out.push([say('mum', 'happy', 'Nori said there was a festival! Did you go? Tell me everything. Did they still do the goldfish?')]);
  if (diff('classesAttended') > 0) out.push([say('mum', 'neutral', 'How is school? Are you keeping up? ...You don\'t have to be top of the class, sweetheart. Just be kind and do your best.')]);
  if (diff('mochiPets') > 2) out.push([say('mum', 'happy', 'Show me Mochi! ...Is she bigger? She looks bigger.'), { t: 'say', who: 'mochi', mood: 'happy', text: 'Mrrp.' }]);
  const up = game.upcomingFestivals ? game.upcomingFestivals(7).find((u) => !u.def.minor) : null;
  if (up) out.push([say('mum', 'happy', `${up.def.name} is coming up! I used to love it. Send pictures!`)]);
  if (game.weather === 'rain' || game.weather === 'storm') out.push([say('dad', 'neutral', 'Is that rain on your window? Close it and make cocoa. Doctor\'s orders. Chef\'s orders.')]);
  out.push([say('dad', 'happy', 'Pun of the week: why did the whale blush? Because it saw the ocean\'s bottom!'), say('misa', 'neutral', 'Dad...'), say('mum', 'happy', 'He\'s been saving that one for three days.')]);
  out.push([say('mum', 'happy', 'We saw humpbacks this week. A mother and her calf, swimming side by side. It made me think of us.')]);
  const r = game.rngFor('call');
  return out.sort(() => r() - 0.5).slice(0, 3).flat();
}
export function videoCallSteps(game) {
  return [{ t: 'fade', to: 1, dur: 0.4 }, { t: 'scene', name: 'ship_cabin' }, { t: 'fade', to: 0, dur: 0.5 },
    say('mum', 'happy', 'There she is! Hi, sweetheart! Can you hear us? The signal is all wobbly.'), say('dad', 'happy', 'Hello from the middle of the ocean! I made curry for forty people today.'),
    say('misa', 'happy', 'Mum! Dad! I can hear you!'), ...callTopics(game),
    { t: 'choice', prompt: 'Tell them about...', options: [
      { text: 'My new friends', steps: [say('misa', 'happy', 'I\'m making friends. Real ones! Everyone here is so nice.'), say('mum', 'happy', 'Of course they are. You\'re easy to love.')] },
      { text: 'Grandma', steps: [say('misa', 'happy', 'Grandma says hi. She remembered your favourite song, Mum.'), say('mum', 'sad', 'Did she? ...Give her a hug from me. A big one.')] },
      { text: 'Mochi\'s latest crime', steps: [say('misa', 'neutral', 'Mochi stole a whole fish cake off the counter. She showed no remorse.'), say('dad', 'happy', 'That\'s my girl. The cat, I mean. You\'re also my girl.')] },
      { text: 'That I miss them', steps: [say('misa', 'sad', 'I miss you both. The house is quiet at night.'), say('mum', 'happy', 'We miss you too. Every single day. Look at the stars tonight; we\'ll be looking at the same ones.')] }] },
    say('dad', 'happy', 'Okay, the captain needs the satellite. Love you, kiddo! Eat vegetables!'), say('mum', 'happy', 'Love you! Talk on the weekend!'),
    call((g) => { g.stat('familyCalls'); g.addMood(12); for (const id of ['mum', 'dad']) if (get('npc', id)) g.addFriend(id, 20); ev(g).callStats = { ...g.state.stats }; }),
    { t: 'fade', to: 1, dur: 0.5 }, { t: 'scene', name: null }, { t: 'fade', to: 0, dur: 0.5 }];
}
register('script', 'ev_family_call', { steps: (g) => videoCallSteps(g) });
const callDay = (game) => [2, 6].includes(game.weekday);
function ringCheck(game, world) {
  const st = ev(game);
  if (!callDay(game) || game.minutes < 19 * 60 || game.minutes >= 21 * 60 || st.calls[game.day] === 'done') return;
  if (st.snooze && st.snooze > game.minutes && st.snoozeDay === game.day) return;
  if (game.scenes.top !== world || world.busy) return;
  st.calls[game.day] = 'ringing';
  game.sfx('phone');
  game.run([{ t: 'sfx', name: 'phone' }, N('Your phone buzzes: Mum and Dad are video calling!'), { t: 'choice', prompt: 'Answer?', options: [
    { text: 'Answer', steps: [call((g) => { ev(g).calls[g.day] = 'done'; }), ...videoCallSteps(game)] },
    { text: 'Not right now', steps: [say('misa', 'neutral', 'I\'ll call them back in a bit.'), call((g) => { const s = ev(g); s.calls[g.day] = 'missed'; s.snooze = g.minutes + 60; s.snoozeDay = g.day; })] }] }]);
}
register('worldTick', 'family_calls', { update(dt, world, game) { world._callT = (world._callT || 1) - dt; if (world._callT <= 0) { world._callT = 2; ringCheck(game, world); } } });

// ---------- festival invitations and first snow photos ----------
const INVITERS = ['kai', 'suzu', 'rina', 'theo', 'hina', 'mika', 'goro', 'pip', 'kiko'];
const INVITE = (name) => [`${name} is tomorrow! Want to go together? I'll meet you there!`, `Don't forget, ${name} is tomorrow!! I've been looking forward to it all week.`, `Are you going to ${name} tomorrow? Everyone is!`];
function festivalTexts(game) {
  if (!game.festivalsOn) return;
  const tomorrow = game.festivalsOn(game.day + 1).filter((f) => !f.minor);
  const friends = INVITERS.filter((id) => get('npc', id) && game.state.seen['met:' + id]).sort((a, b) => game.hearts(b) - game.hearts(a));
  for (const f of tomorrow) {
    const who = friends[0], r = game.rngFor('invite');
    if (who) { const L = INVITE(f.name); game.mail(`ev_inv_${f.id}_${game.day}`, nameOf(who), L[Math.floor(r() * L.length)], { kind: 'text', npc: who }); }
    else game.mail(`ev_inv_${f.id}_${game.day}`, 'Town notice', `${f.name} is tomorrow. ${f.desc}`, { kind: 'notice' });
  }
}
export function snowTexts(game) {
  const L = { kai: 'SNOW!!! Snowball fight at the park, you and me, NOW', hina: 'Snow means animal tracks! I found a fox print! Sending photo!', suzu: 'Snow on the library steps. It looks like an empty page.', theo: '(a photo of a tiny snowman wearing headphones)', mika: 'First snow! Hot chocolate is half price today!' };
  for (const [id, text] of Object.entries(L)) if (get('npc', id) && game.state.seen['met:' + id]) game.mail(`ev_snow_${id}_${game.day}`, nameOf(id), text, { kind: 'text', npc: id });
}
register('system', 'event_mail', {
  init(game) {
    game.post = (m) => post(game, m);
    game.familyCall = () => game.run(videoCallSteps(game));
    game.bus.on('dayStart', () => { dailyPost(game); festivalTexts(game); });
    game.bus.on('festivalAttend', ({ id }) => { const f = get('festival', id); if (f) post(game, { id: `pc_${id}_${yearOf(game.day)}`, kind: 'postcard', from: 'Aunt Nori', text: `Your mum told me you went to ${f.name}! I drew it from memory. Did I get the lanterns right?`, items: { gift_fest_postcard: 1 } }); });
  },
});

features('Phone and post', [
  'Weekly video calls with Mum and Dad on the research ship (Wednesday and Sunday, 19:00-21:00) in their ship cabin',
  'Video calls talk about your week: fish caught, cooking, festivals, school, the weather and Mochi',
  'Answer the call or decline and they ring back an hour later',
  'Yard mailbox: letters, parcels, postcards and cards arrive and wait for you, with a mail bubble when there is post',
  'Aunt Nori sends a seasonal parcel every Saturday',
  'Aunt Nori\'s Star Catalogue arrives in the mailbox at the start of every season',
  'Mum sends postcards from the ship every two weeks, with whale photos and far-sea shells',
  'Birthday cards and money from Mum, Dad and Aunt Nori on Misa\'s birthday',
  'Aunt Nori draws a collectible postcard of every festival you attend',
  'Friends text you the day before a festival to invite you along',
  'Mail you open is kept on your phone',
]);
