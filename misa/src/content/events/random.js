// Random daily events with cross-day cooldowns (ported from the old game and expanded).
//   register('event', id, { name, weight, cooldown (days), maps: [...], when?(game) -> bool, script(game) -> steps })
// A scheduler picks at most one event per check while Misa walks around (1 a day on weekdays, 2 on weekends).
import { register, get, all, features } from '../../core/registry.js';
import { check } from '../../core/cond.js';

const say = (who, mood, text) => ({ t: 'say', who, mood, text });
const N = (text) => ({ t: 'say', who: null, mood: null, text });
const call = (fn) => ({ t: 'call', fn });
const scene = (name) => [{ t: 'fade', to: 1, dur: 0.5 }, { t: 'scene', name }, { t: 'fade', to: 0, dur: 0.6 }];
const endScene = [{ t: 'fade', to: 1, dur: 0.5 }, { t: 'scene', name: null }, { t: 'fade', to: 0, dur: 0.6 }];
const ev = (game) => (game.state.events ||= { last: {}, day: 0, n: 0, mailbox: [], lost: null, blackoutUntil: 0, calls: {}, sent: {} });
const between = (game, a, b) => game.minutes >= a * 60 && game.minutes < b * 60;
const clear = (game) => ['sunny', 'cloudy', 'windy'].includes(game.weather);
const hasMochi = (game) => !!game.mochi && (!game.world || game.mochi.map === game.world.map.id);
const mochiComes = call((g) => { if (g.mochi && g.world && g.mochi.map === g.world.map.id && g.mochi.set) { g.mochi.set('greet', 6); } });
const SEASON_GIFT = { spring: 'mat_ev_petal', summer: 'mat_ev_cicada', autumn: 'mat_ev_acorn', winter: 'mat_ev_feather' };
const PARCEL = { spring: ['gift_fest_postcard', 'Cherry blossom season! A sketch of the old Hoshimori park, for your wall.'], summer: ['dish_fest_candy_apple', 'Too hot to draw. Have something sweet instead.'], autumn: ['mat_ev_acorn', 'Autumn in the city is all pigeons. Here is a very fancy acorn.'], winter: ['drink_fest_cocoa', 'Stay warm! Drink this and think of me drawing in fingerless gloves.'] };

export const EVENTS = {
  parcel: { name: 'A parcel from Pip', weight: 3, cooldown: 4, maps: ['home'], when: (g) => between(g, 8, 19), script: (g) => {
    const [item, note] = PARCEL[g.season] || PARCEL.spring;
    return [{ t: 'sfx', name: 'bell' }, say('misa', 'surprised', 'Ding-dong! Was that the door?'), say('pip', 'happy', 'Special delivery for Miss Misa! Rain, snow or sleepy cat, the post must go through.'), say('misa', 'happy', 'Pip! I didn\'t order anything, though...'),
      say('pip', 'neutral', `The tag says it's from your Aunt Nori. There's a note: "${note}"`), { t: 'give', item, n: 1 }, { t: 'mood', n: 8 }, say('pip', 'happy', 'Bye now! Say hi to Mochi!'), call((gg) => gg.stat('parcelsReceived'))];
  } },
  rain: { name: 'Rain rolls in', weight: 2, cooldown: 3, maps: ['home'], when: (g) => g.season !== 'winter' && clear(g) && between(g, 9, 17), script: () => [
    ...scene('rain'), { t: 'sfx', name: 'thunder' }, say('misa', 'surprised', 'Oh! Look at that rain roll in!'), { t: 'say', who: 'mochi', mood: 'sleepy', text: 'Prrr...' }, say('misa', 'happy', 'Perfect napping weather. And the garden gets a free drink today.'),
    call((g) => { g.state.weather = 'rain'; g.bus.emit('weatherChanged', { weather: 'rain' }); }), ...endScene] },
  cat_gift: { name: 'Mochi\'s gift', weight: 3, cooldown: 3, maps: ['home', 'yard'], when: hasMochi, script: (g) => {
    const item = g.rng() < 0.3 ? 'toy_ev_bottlecap' : SEASON_GIFT[g.season];
    return [mochiComes, { t: 'sfx', name: 'meow' }, { t: 'say', who: 'mochi', mood: 'happy', text: 'Mrrp! Mrrp!' }, say('misa', 'surprised', `Mochi, what have you got there? Is that... ${get('item', item) ? 'a ' + get('item', item).name.toLowerCase() : 'a present'}?`),
      say('misa', 'happy', 'It\'s the best one in the world. Thank you! I\'ll keep it forever.'), { t: 'give', item, n: 1 }, { t: 'mood', n: 6 }, call((gg) => { gg.stat('mochiGifts'); if (gg.state.mochi) gg.state.mochi.gifts = (gg.state.mochi.gifts || 0) + 1; })];
  } },
  cat_knock: { name: 'Mochi knocks a plate', weight: 2, cooldown: 4, maps: ['home'], when: hasMochi, script: () => [
    mochiComes, say('misa', 'neutral', 'Mochi... why are you looking at that plate like that?'), { t: 'sfx', name: 'wrong' }, { t: 'say', who: 'mochi', mood: 'happy', text: '*crash*' }, say('misa', 'surprised', 'MOCHI!'),
    say('misa', 'neutral', 'Fine. That\'s one more plate for the sink. At least you look proud of yourself.'),
    call((g) => { const ht = g.state.homeTasks; if (ht && ht.day === g.day) { const t = ht.list.find((x) => x.id === 'dishes'); if (t) t.done = false; else ht.list.push({ id: 'dishes', done: false }); } g.stat('platesKnocked'); })] },
  zoomies: { name: 'The zoomies', weight: 2, cooldown: 2, maps: ['home'], when: (g) => hasMochi(g) && g.minutes >= 9 * 60, script: () => [
    { t: 'say', who: 'mochi', mood: 'happy', text: 'Mrrrrow!!' }, say('misa', 'surprised', 'The zoomies! Everyone stay calm!'), call((g) => { g.bus.emit('startZoomies', {}); g.addMood(6); g.stat('mochiZoomiesSeen'); })] },
  blackout: { name: 'Power cut', weight: 1, cooldown: 6, maps: ['home'], when: (g) => between(g, 17, 21) && !g.flag('blackout'), script: () => [
    { t: 'sfx', name: 'thunder' }, { t: 'fade', to: 1, dur: 0.15 }, call((g) => { g.setFlag('blackout'); ev(g).blackoutUntil = g.day * 10000 + Math.min(g.minutes + 120, 23 * 60); }), { t: 'fade', to: 0, dur: 0.6 },
    say('misa', 'surprised', 'Whoa! The power went out!'), { t: 'say', who: 'mochi', mood: 'neutral', text: 'Mrow.' },
    say('misa', 'happy', 'It\'s okay. I have my little lantern. Everything looks so cozy in the dark.'), call((g) => { g.setFlag('lantern'); g.stat('blackouts'); })] },
  candles: { name: 'Candle evening', weight: 3, cooldown: 5, maps: ['home'], when: (g) => between(g, 18, 22) && (g.weather === 'storm' || g.weather === 'snow') && !g.flag('blackout'), script: () => [
    { t: 'sfx', name: 'thunder' }, { t: 'fade', to: 1, dur: 0.2 }, call((g) => { g.setFlag('blackout'); ev(g).blackoutUntil = g.day * 10000 + 23 * 60; }), { t: 'scene', name: 'candle' }, { t: 'fade', to: 0, dur: 0.8 },
    say('misa', 'surprised', 'The whole street went dark!'), say('misa', 'happy', 'Grandma always kept candles in the kitchen drawer... found them!'),
    N('Three little flames make the living room glow gold. The storm sounds far away now.'), { t: 'say', who: 'mochi', mood: 'happy', text: 'Purrrr...' },
    say('misa', 'sleepy', 'Actually... this is the coziest the house has ever been.'), { t: 'mood', n: 18 }, call((g) => { g.setFlag('lantern'); g.stat('candleEvenings'); }), ...endScene] },
  shooting_star: { name: 'A shooting star', weight: 4, cooldown: 3, maps: ['home', 'yard'], when: (g) => between(g, 20, 23) && clear(g), script: () => [
    ...scene('night'), say('misa', 'happy', 'Look, Mochi! The sky is so clear tonight.'), { t: 'wait', dur: 1.2 }, { t: 'sfx', name: 'star' }, say('misa', 'surprised', 'A shooting star! Quick, make a wish!'),
    { t: 'choice', prompt: 'Wish for...', options: [
      { text: 'A quiet day tomorrow', steps: [say('misa', 'happy', 'I wished for a slow, sunny morning.'), { t: 'mood', n: 10 }] },
      { text: 'Mochi to be happy', steps: [say('misa', 'happy', 'I wished for Mochi to always have warm laps.'), { t: 'say', who: 'mochi', mood: 'happy', text: 'Prrrr...' }, { t: 'mood', n: 6 }, call((g) => { if (g.state.mochi) g.state.mochi.affection = Math.min(100, (g.state.mochi.affection || 0) + 3); })] },
      { text: 'Aunt Nori to visit', steps: [say('misa', 'happy', 'I wished Aunt Nori would come by soon.'), { t: 'flag', k: 'wish_nori' }, { t: 'mood', n: 6 }, call((g) => { if (get('npc', 'nori')) g.addFriend('nori', 20); })] }] },
    call((g) => { g.stat('shootingStars'); g.stat('wishesMade'); }), ...endScene] },
  rainbow: { name: 'A rainbow', weight: 4, cooldown: 3, maps: ['yard', 'lane', 'town', 'park', 'harbour', 'beach', 'shrine', 'school_grounds'], when: (g) => g.weather === 'rain' && between(g, 14, 18), script: () => [
    call((g) => { g.state.weather = 'cloudy'; }), ...scene('rainbow'), say('misa', 'surprised', 'The rain stopped... and look! A rainbow over the whole bay!'),
    { t: 'choice', prompt: 'Take a photo?', options: [{ text: 'Snap!', steps: [{ t: 'sfx', name: 'camera' }, say('misa', 'happy', 'Got it! Mum is going to love this one.'), call((g) => g.stat('rainbowPhotos'))] }, { text: 'Just look', steps: [say('misa', 'happy', 'Some things are better just remembered.')] }] },
    { t: 'mood', n: 10 }, call((g) => g.stat('rainbowsSeen')), ...endScene] },
  lost_item: { name: 'A lost item', weight: 2, cooldown: 6, maps: ['town', 'lane', 'park', 'harbour', 'shotengai'], when: (g) => between(g, 9, 18) && !ev(g).lost && lostOwners(g).length > 0, script: (g) => {
    const owners = lostOwners(g), owner = owners[Math.floor(g.rng() * owners.length)] || 'pip', what = LOST[owner] || 'a keychain with a little star on it';
    return [{ t: 'sfx', name: 'pop' }, say('misa', 'surprised', `Huh? Someone dropped ${what}.`), say('misa', 'neutral', `I think I've seen ${(get('npc', owner) || { name: 'someone' }).name} with this. I should give it back.`),
      call((gg) => { ev(gg).lost = { owner, what, day: gg.day }; gg.give('key_lost_item', 1, true); gg.toast(`Return the lost item to ${(get('npc', owner) || { name: owner }).name}`, 'i_question'); })];
  } },
  musician: { name: 'A street musician', weight: 3, cooldown: 3, maps: ['town', 'shotengai', 'park'], when: (g) => between(g, 11, 20) && clear(g), script: () => [
    { t: 'sfx', name: 'chime' }, N('A busker with a battered accordion is playing a slow old waltz by the fountain. A few people sway along.'), say('misa', 'happy', 'I know this song! Grandma hums it when she knits.'),
    { t: 'choice', prompt: 'Toss a coin?', options: [{ text: 'Toss 10 coins', when: 'money>=10', steps: [{ t: 'money', n: -10 }, N('The busker winks and plays a little flourish just for you.'), { t: 'mood', n: 10 }, call((g) => g.stat('buskerTips'))] }, { text: 'Just listen', steps: [{ t: 'mood', n: 5 }] }] }] },
  balloon: { name: 'A stray balloon', weight: 2, cooldown: 4, maps: ['town', 'park', 'lane'], when: (g) => between(g, 10, 17) && g.weather !== 'storm', script: () => [
    N('A red balloon bobs past at head height, its string trailing along the ground.'), say('misa', 'surprised', 'Got it!'), N('A little boy runs up, out of breath. "That\'s mine! It escaped!"'),
    { t: 'choice', prompt: 'Give it back?', options: [{ text: 'Here you go!', steps: [N('He beams and ties it around his wrist. "Thank you, big sister!"'), { t: 'xp', skill: 'charm', n: 10 }, { t: 'mood', n: 8 }, call((g) => g.stat('kindDeeds'))] },
      { text: 'Tie it on his wrist for him', steps: [say('misa', 'happy', 'There. Now it can\'t escape again.'), N('"You\'re the best!" He races off, balloon bouncing behind him.'), { t: 'xp', skill: 'charm', n: 12 }, { t: 'mood', n: 10 }, call((g) => g.stat('kindDeeds'))] }] }] },
  neighbour_cat: { name: 'A neighbour\'s cat', weight: 2, cooldown: 4, maps: ['yard', 'lane'], when: (g) => between(g, 8, 19) && g.weather !== 'rain' && g.weather !== 'storm', script: () => [
    N('A fluffy white cat with a pink collar is sitting on the fence, washing one paw.'), say('misa', 'happy', 'Hello, Princess! Mrs. Tanaka\'s cat, from three houses down.'),
    { t: 'choice', prompt: 'Princess looks at you.', options: [{ text: 'Offer a hand to sniff', steps: [N('Princess sniffs your fingers, then headbutts them. Approved.'), { t: 'mood', n: 8 }] }, { text: 'Slow-blink at her', steps: [N('Princess slow-blinks back. In cat, that means "you may stay".'), { t: 'mood', n: 10 }] }] },
    call((g) => { g.stat('catVisits'); }), ...(true ? [{ t: 'if', cond: (g) => !!g.mochi, then: [{ t: 'say', who: 'mochi', mood: 'surprised', text: '(from the window) HSSSS.' }, say('misa', 'happy', 'Mochi, be nice. She\'s just visiting.')] }] : [])] },
  tourist: { name: 'A lost tourist', weight: 2, cooldown: 5, maps: ['town', 'harbour'], when: (g) => between(g, 9, 17), script: () => [
    N('A man with a giant backpack is turning a map upside down, then right side up again.'), say(null, null, '"Excuse me! Do you know the way to the lighthouse? The one with the star?"'),
    { t: 'choice', prompt: 'Which way?', options: [
      { text: 'Harbour, then the beach', steps: [N('"The beach! Of course! Thank you!" He presses a small paper bag into your hands. Rice crackers.'), { t: 'money', n: 40 }, { t: 'xp', skill: 'charm', n: 8 }, call((g) => g.stat('touristsHelped'))] },
      { text: 'Up the shrine hill', steps: [N('"Up the hill! Thank you!" ...You realise a minute later that was wrong. Oops. Hopefully the view makes up for it.'), { t: 'mood', n: -2 }] }] }] },
  fireflies: { name: 'Fireflies by the pond', weight: 4, cooldown: 4, maps: ['park', 'yard'], when: (g) => g.season === 'summer' && between(g, 19, 22) && clear(g), script: () => [
    ...scene('meteors'), N('Tiny green lights blink on, one by one, over the water.'), say('misa', 'happy', 'Fireflies! Hina said they only come out on warm still nights.'), { t: 'mood', n: 12 }, call((g) => g.stat('firefliesSeen')), ...endScene] },
};
const LOST = { kai: 'a red sweatband', suzu: 'a notebook full of tiny handwriting', rina: 'a violin rosin in a velvet pouch', theo: 'a pencil stub covered in paint', hina: 'a magnifying glass', pip: 'a stamp book', goro: 'a pair of garden gloves', tobias: 'a tiny brass screwdriver', mika: 'a star hairpin', sachiko: 'a sunflower badge', jun: 'a lucky fishing lure', kiko: 'a game cartridge', fujita: 'a coffee mug lid', ogawa: 'a whistle on a cord' };
function lostOwners(game) { return Object.keys(LOST).filter((id) => get('npc', id) && game.state.seen['met:' + id]); }

for (const [id, def] of Object.entries(EVENTS)) register('event', id, def);

// ---------- the scheduler ----------
function pick(game, world) {
  const st = ev(game), mapId = world.map.id;
  if (st.day !== game.day) { st.day = game.day; st.n = 0; }
  if (st.n >= (game.isWeekend ? 2 : 1)) return null;
  const ok = all('event').filter((e) => e.script && (e.maps || []).includes(mapId) && (!st.last[e.id] || game.day - st.last[e.id] >= (e.cooldown || 1)) && check(e.when, game));
  const total = ok.reduce((a, e) => a + (e.weight || 1), 0);
  if (!total) return null;
  let r = game.rng() * total;
  for (const e of ok) if ((r -= e.weight || 1) < 0) return e;
  return ok[ok.length - 1];
}
export function runEvent(game, e) {
  const st = ev(game);
  st.last[e.id] = game.day; st.n = (st.day === game.day ? st.n : 0) + 1; st.day = game.day;
  game.stat('randomEvents');
  return game.run(e.script(game));
}
register('stateSlice', 'events', { default: () => ({ last: {}, day: 0, n: 0, mailbox: [], lost: null, blackoutUntil: 0, calls: {}, sent: {} }) });
register('worldTick', 'random_events', {
  update(dt, world, game) {
    const st = ev(game);
    // power comes back on
    if (game.flag('blackout') && st.blackoutUntil && (game.day * 10000 + game.minutes >= st.blackoutUntil)) { game.setFlag('blackout', false); game.setFlag('lantern', false); st.blackoutUntil = 0; if (world.map.id === 'home') game.toast('The power is back on', 'i_check'); }
    world._evT = (world._evT || 4) - dt;
    if (world._evT > 0) return;
    world._evT = 10;
    if (game.scenes.top !== world || world.busy || game.state.time.day < 2) return;
    if (game.rng() > 0.05) return;
    const e = pick(game, world);
    if (e) runEvent(game, e);
  },
});
register('system', 'random_events', {
  init(game) {
    game.randomEvent = (id) => { const e = get('event', id); return e ? runEvent(game, e) : Promise.resolve(); };
    game.bus.on('dayStart', () => { const st = ev(game); if (game.flag('blackout')) { game.setFlag('blackout', false); game.setFlag('lantern', false); st.blackoutUntil = 0; } });
    // Return a lost item: a talk hook for each resident who might have dropped something.
    for (const npc of Object.keys(LOST)) {
      const id = `ev_lost_${npc}`;
      if (get('talkHook', id) || !get('npc', npc)) continue;
      register('talkHook', id, {
        npc, priority: 5,
        when: (g) => !!(g.state.events && g.state.events.lost && g.state.events.lost.owner === npc && g.has('key_lost_item')),
        steps: (g) => [say('misa', 'happy', `Is this yours? I found ${(ev(g).lost || {}).what || 'it'} on the street.`), { t: 'say', who: npc, mood: 'surprised', text: 'My... yes! I\'ve been looking everywhere! Thank you so much!' },
          call((gg) => { gg.take('key_lost_item', 1); ev(gg).lost = null; gg.addFriend(npc, 40); gg.stat('lostItemsReturned'); gg.stat('kindDeeds'); })],
      });
    }
  },
});

features('Random events', [
  'Random daily events while you go about your day, with cooldowns so they don\'t repeat too often',
  'Pip rings the doorbell with a seasonal parcel from Aunt Nori',
  'Rain rolls in: a window scene and the weather turns rainy',
  'Mochi brings you seasonal presents: petals, cicada shells, acorns, feathers and shiny bottle caps',
  'Mochi knocks a plate off the counter and the dishes need doing again',
  'Mochi gets the zoomies and races around the house',
  'Power cuts: the house goes dark and Misa\'s lantern lights the way until the power comes back',
  'Stormy candle evenings: a blackout turns into the coziest night with candles',
  'Shooting stars at night: make a wish from the window',
  'Rainbows when the rain clears in the afternoon, with a photo moment',
  'Lost items in town: find who dropped it and return it for a big friendship boost',
  'A street musician plays Grandma\'s favourite waltz; tip a coin for a flourish',
  'A stray balloon to catch and return to a little boy',
  'A neighbour\'s fluffy cat visits the fence (Mochi is not impressed)',
  'A lost tourist asks for directions to the lighthouse',
  'Summer evening fireflies by the pond',
]);
