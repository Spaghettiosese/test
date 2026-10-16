// The festival calendar: ~27 dated events (DESIGN 5.3.22). Engine and schema: src/systems/festivals.js.
// Festival ids match the social area's holiday ids where they overlap (hanami, tanabata, matsuri, ...).
import { register, get, features } from '../../core/registry.js';
import { dateOf, seasonOf, yearOf } from '../../core/time.js';
import { dayKey } from '../../systems/festivals.js';

const say = (who, mood, text) => ({ t: 'say', who, mood, text });
const N = (text) => ({ t: 'say', who: null, mood: null, text });
const scene = (name) => [{ t: 'fade', to: 1, dur: 0.5 }, { t: 'scene', name }, { t: 'fade', to: 0, dur: 0.6 }];
const endScene = [{ t: 'fade', to: 1, dur: 0.6 }, { t: 'scene', name: null }, { t: 'fade', to: 0, dur: 0.6 }];
const giveOr = (game, ids, n = 1) => { for (const id of [].concat(ids)) if (get('item', id)) { game.give(id, n); return id; } return null; };
const after1 = (key) => (game, day) => dayKey(day) === key && day > 112;            // only from year 2 (post-game)
const range = (season, a, b) => (game, day) => seasonOf(day) === season && dateOf(day) >= a && dateOf(day) <= b;
const wins = (game) => (game.state.festivals.wins ||= {});

// A food stall: buy a festival snack.
const food = (id, map, spot, dx, dy, label, items, cost) => ({ id, map, spot, dx, dy, label, cost, run: (g) => { const got = giveOr(g, items); if (got) g.sfx('buy'); } });
// A stall minigame with a prize.
const stall = (id, map, spot, dx, dy, label, minigame, cost, prize, opts) => ({ id, map, spot, dx, dy, label, minigame, cost, opts, daily: true, prize });
const goldfishPrize = (g, r) => { if ((r.data || {}).caught) { g.give('toy_fest_goldfish', 1); if (r.data.gold) { wins(g).goldfish = (wins(g).goldfish || 0) + 1; g.stat('goldenGoldfish'); g.toast('A golden goldfish! Lucky!', 'i_star'); } g.stat('goldfishCaught', r.data.caught); } else g.say('misa', 'sad', 'The paper tore... The stall lady gave me a consolation candy.'); };
const ringPrize = (g, r) => { const h = (r.data || {}).hits || 0; if (h) { g.give('toy_fest_plush', 1); g.stat('ringTossPrizes', h); } };
const lanternPrize = (g, r) => { const n = (r.data || {}).good || 0; g.addMood(4 + n * 2); g.stat('lanternsReleased', 6); if (n === 6) g.stat('perfectLanterns'); };

const T = (spot, spr, dx = 0, dy = 0, extra = {}) => ({ spot, spr, dx, dy, ...extra });
const MATSURI_TOWN = [T('market_1', 'ev_stall_goldfish', 0, -1), T('market_2', 'ev_stall_ringtoss', 0, -1), T('ramen_cart', 'ev_stall_takoyaki', -3, -1), T('fountain', 'ev_lanterns', 0, -3, { light: 'lantern' }), T('stage', 'ev_lanterns', 0, 2, { light: 'lantern' }), T('bench_1', 'ev_chochin', 1, 0, { light: 'lantern' }), T('bench_2', 'ev_chochin', -1, 0, { light: 'lantern' }), T('cafe_terrace', 'ev_stall_sweets', 0, 2), T('noticeboard', 'ev_stall_masks', 3, 1)];

const FESTIVALS = {
  // ---------------- spring ----------------
  first_sunrise: {
    name: 'First Sunrise', icon: 'i_sun', date: after1('spring-1'), maps: ['beach'], hours: ['06:00', '10:00'], holiday: true,
    desc: 'The first sunrise of the year, watched from Shell Beach. Get there early!',
    decor: { beach: [T('bonfire', 'ev_kadomatsu', -2, -1), T('shore', 'ev_chochin_white', 2, 0, { light: 'lantern' })] },
    closeAt: '06:00', closeBy: '09:30', closeMap: 'beach',
    script: (g) => [...scene('sunrise'), say('misa', 'happy', 'Here it comes... the very first sunrise of the year.'), say('mum', 'happy', 'Make a wish on it, sweetheart. First sunrises are the strongest kind.'), say('dad', 'happy', 'I wished for pancakes. Is that allowed?'), say('misa', 'happy', 'It\'s allowed. Happy New Year, everyone.'), { t: 'mood', n: 20 }, { t: 'energy', n: 20 }, ...endScene],
  },
  hatsumode: {
    name: 'New Year shrine visit', icon: 'i_star', date: after1('spring-1'), maps: ['shrine'], hours: ['06:00', '20:00'], holiday: true, shop: true,
    desc: 'Hatsumode: the year\'s first visit to Hoshi Hill Shrine. Amazake, amulets and the year\'s first fortune.',
    decor: { shrine: [T('torii', 'ev_kadomatsu', -2, 0), T('torii', 'ev_kadomatsu', 2, 0), T('fortune_stand', 'ev_stall_fortune', 0, -1), T('steps', 'ev_chochin_white', -2, 0, { light: 'lantern' }), T('steps', 'ev_chochin_white', 2, 0, { light: 'lantern' })] },
    activities: [
      food('amazake', 'shrine', 'fortune_stand', 0, 1, 'Warm amazake', ['drink_fest_amazake'], 0),
      { id: 'pray', map: 'shrine', spot: 'offering_box', dy: 1, label: 'First prayer of the year', daily: true, run: (g) => g.run([{ t: 'sfx', name: 'bell' }, N('Two bows, two claps, one bow.'), { t: 'choice', prompt: 'Wish for...', options: [
        { text: 'Good grades this year', steps: [say('misa', 'happy', 'Please help me study hard this year. And maybe let Rina win only sometimes.'), { t: 'xp', skill: 'study', n: 15 }] },
        { text: 'Health for everyone', steps: [say('misa', 'happy', 'Please keep Grandma, Mum, Dad, Aunt Nori and Mochi healthy. And everyone in town.'), { t: 'energy', n: 30 }] },
        { text: 'Lots of new friends', steps: [say('misa', 'happy', 'Please let this be a year full of friends.'), { t: 'xp', skill: 'charm', n: 15 }] }] }, { t: 'mood', n: 10 }]) },
    ],
  },
  hinamatsuri: {
    name: 'Doll Festival', icon: 'i_star', date: 'spring-3', maps: ['home'], minor: false,
    desc: 'Hinamatsuri: Grandma\'s old doll set comes out for the day, with pastel hina arare.',
    decor: { home: [T('sofa', 'ev_hina', 0, -1)] },
    setup: (g) => g.give('dish_fest_arare', 2, true),
    closeAt: '18:00', closeMap: 'home',
    script: () => [...scene('hina'), say('misa', 'happy', 'Grandma\'s doll set! She used to put it out every spring for Mum.'), { t: 'say', who: 'mochi', mood: 'happy', text: 'Mrrp?' }, say('misa', 'surprised', 'No, Mochi, the emperor is not a toy! ...Okay, one sniff.'), { t: 'mood', n: 10 }, ...endScene],
  },
  koinobori: {
    name: 'Koinobori Day', icon: 'i_wind', date: 'spring-5', maps: ['lane', 'town'], holiday: true, shop: true,
    desc: 'Children\'s Day: carp streamers swim over Lantern Lane, and Sunny Mart sells kashiwa mochi.',
    decor: { lane: [T('crossroad', 'ev_koinobori_0', 1, -1, { anim: ['ev_koinobori_0', 'ev_koinobori_1'] }), T('goro_garden', 'ev_koinobori_1', 2, 0, { anim: ['ev_koinobori_1', 'ev_koinobori_0'] }), T('bus_stop', 'ev_bunting', 0, -1)], town: [T('fountain', 'ev_koinobori_0', 3, 0, { anim: ['ev_koinobori_0', 'ev_koinobori_1'] })] },
    activities: [food('kashiwa', 'town', 'market_1', 0, 0, 'Kashiwa mochi', ['dish_fest_kashiwa'], 45)],
    closeAt: '16:00', closeMap: 'lane',
    script: () => [...scene('carp'), say('misa', 'happy', 'Look at them swim! The black one is the dad, the red one the mum, and the blue one is the kid.'), say('goro', 'happy', 'Back in my day we flew seven. The wind carried one to the next town. Never saw it again.'), say('misa', 'happy', 'Maybe it\'s still swimming somewhere.'), { t: 'mood', n: 8 }, ...endScene],
  },
  hanami: {
    name: 'Hanami Picnic', icon: 'i_leaf', date: 'spring-7', maps: ['park'], hours: ['09:00', '21:00'], shop: true,
    desc: 'Cherry blossom viewing in Sakura Park. Picnics under the trees and Aunt Nori comes to visit.',
    decor: { park: [T('sakura_tree', 'ev_picnic_mat', 1, 1, { flat: true }), T('lawn', 'ev_picnic_mat', -1, 1, { flat: true }), T('lawn', 'ev_picnic_mat', 3, 2, { flat: true }), T('sakura_tree', 'ev_lanterns_pink', 0, -2, { light: 'lantern' }), T('bridge', 'ev_chochin_pink', -2, 0, { light: 'lantern' }), T('bridge', 'ev_chochin_pink', 2, 0, { light: 'lantern' }), T('bandstand', 'ev_stall_sweets', -4, 1)] },
    activities: [food('hanami_dango', 'park', 'bandstand', -4, 2, 'Hanami dango', ['dish_dango', 'dish_fest_cotton_candy'], 50),
      { id: 'photo', map: 'park', spot: 'sakura_tree', dy: 1, label: 'Blossom photo contest', daily: true, run: (g) => { const sc = Math.round(60 + g.rng() * 40); g.stat('blossomPhotos'); return g.run([{ t: 'sfx', name: 'camera' }, say('misa', 'happy', 'Petals, sky, a little bit of branch... perfect.'), N(`The judges give your photo ${sc} points!`), ...(sc >= 90 ? [N('First prize! A box of sakura sweets.'), { t: 'give', item: 'dish_fest_cotton_candy', n: 2 }] : [{ t: 'mood', n: 5 }])]); } }],
    closeAt: '15:00', closeMap: 'park',
    script: () => [...scene('hanami'), say('nori', 'happy', 'Misa! Over here! I brought three kinds of onigiri and a sketchbook.'), say('misa', 'happy', 'Aunt Nori! You came!'), say('nori', 'happy', 'I wouldn\'t miss hanami in Hoshimori. Your mum and I used to have petal fights under this exact tree.'), say('misa', 'happy', 'Petal fight?'), say('nori', 'surprised', '...Petal fight.'), N('A shower of petals later, both of you are pink from head to toe.'), { t: 'friend', npc: 'nori', n: 40 }, { t: 'mood', n: 15 }, ...endScene],
  },
  golden_week: {
    name: 'Golden Week', icon: 'i_sun', date: range('spring', 16, 18), maps: ['town'], holiday: true, shop: true,
    desc: 'Three days off school in a row. The square hosts a flea market and everyone takes it easy.',
    decor: { town: [T('market_1', 'ev_stall_crafts', 0, -1), T('market_2', 'ev_stall_masks', 0, -1), T('fountain', 'ev_bunting', 0, -3)] },
    setup: (g) => g.toast('Golden Week: no school today!', 'i_sun'),
    activities: [{ id: 'flea', map: 'town', spot: 'market_1', label: 'Browse the flea market', daily: true, run: (g) => { const r = g.rng(); g.advance(30); if (r < 0.4) { g.give('toy_fest_mask', 1); return g.say('misa', 'happy', 'A fox mask for 10 coins? Sold!'); } if (r < 0.7) { g.addMoney(30); return g.say('misa', 'happy', 'An old lady bought my spare hair clips. Business!'); } return g.say('misa', 'neutral', 'So many old records and teapots. Nothing for me today, but it was fun to look.'); } }],
  },
  sportsday: { name: 'Sports Day', icon: 'i_school', date: 'spring-19', maps: ['school_grounds'], school: true, desc: 'Relay, tug-of-war and the bread-eating race. Class 2-B against everyone.', decor: { school_grounds: [T('field_center', 'ev_bunting_sports', 0, -4), T('track', 'ev_bunting_sports', 0, -2), T('gate', 'ev_bunting_sports', 0, -1)] } },
  starlight: {
    name: 'Starlight Festival', icon: 'i_star', date: 'spring-28', maps: ['town', 'lighthouse', 'beach'], shop: true, hours: ['10:00', '24:00'],
    desc: 'The last night of spring. The Star Lantern shines across the bay (the story finale, then every year).',
    decor: { town: [...MATSURI_TOWN.slice(0, 5)], beach: [T('shore', 'ev_lanterns', 0, -2, { light: 'lantern' }), T('towel', 'ev_toro', 0, 1, { flat: true })] },
    activities: [stall('goldfish', 'town', 'market_1', 0, 1, 'Goldfish scooping', 'fest_goldfish', 50, goldfishPrize), stall('ringtoss', 'town', 'market_2', 0, 1, 'Ring toss', 'fest_ringtoss', 50, ringPrize),
      { id: 'lanterns', map: 'beach', spot: 'shore', label: 'Release lanterns', minigame: 'fest_lanterns', daily: true, when: 'time>=18:00', prize: lanternPrize }],
    closeAt: '20:00', closeMap: 'beach',
    script: (g) => (g.day > 112 ? [...scene('sky_lanterns'), say('misa', 'happy', 'The Star Lantern is shining again, like every year now.'), say('hana', 'happy', 'Look at it, Toby. Isn\'t it the most beautiful thing.'), say('tobias', 'neutral', '...Hmph. Second most.'), { t: 'mood', n: 20 }, ...endScene] : [N('The whole town is gathering by the lighthouse...')]),
  },
  // ---------------- summer ----------------
  rainy_season: { name: 'Rainy season', icon: 'i_rain', minor: true, date: range('summer', 2, 12), maps: [], desc: 'Tsuyu: the early summer rains. Expect showers most days, and happy frogs.' },
  tanabata: {
    name: 'Tanabata Wish Night', icon: 'i_star', date: 'summer-7', maps: ['town'], shop: true, hours: ['10:00', '23:00'],
    desc: 'Write a wish on a paper strip and hang it on the bamboo. Read everyone else\'s wishes too.',
    decor: { town: [T('fountain', 'ev_bamboo', -3, 0), T('fountain', 'ev_bamboo', 3, 0), T('stage', 'ev_lanterns', 0, 2, { light: 'lantern' }), T('market_1', 'ev_stall_sweets', 0, -1)] },
    activities: [
      { id: 'wish', map: 'town', spot: 'fountain', dx: -3, dy: 1, label: 'Hang a wish', daily: true, run: (g) => g.run([say('misa', 'happy', 'A paper strip and a pen. What do I wish for?'), { t: 'choice', prompt: 'Write a wish', options: [
        { text: 'To see Mum and Dad soon', steps: [say('misa', 'happy', '"I wish the Kujira comes home safe and soon."'), { t: 'flag', k: 'wish_family' }] },
        { text: 'To light up the town', steps: [say('misa', 'happy', '"I wish Hoshimori shines brighter every year."'), { t: 'flag', k: 'wish_town' }] },
        { text: 'For Mochi to live forever', steps: [say('misa', 'happy', '"I wish Mochi gets a hundred more birthdays."'), { t: 'flag', k: 'wish_mochi' }] }] },
        N('You tie the strip to the bamboo. It flutters with all the others.'), { t: 'mood', n: 8 }, { t: 'call', fn: (gg) => gg.stat('wishesMade') }]) },
      { id: 'read', map: 'town', spot: 'fountain', dx: 3, dy: 1, label: 'Read the wishes', run: (g) => { const W = [['Kai', 'I wish to score a goal in the final. And for curry bread every day.'], ['Suzu', 'I wish to finish one story. Just one.'], ['Rina', 'I wish to be first. (And for someone to sit with at lunch.)'], ['Theo', 'paint the whole harbour wall. ask nicely first.'], ['Hina', 'A RAINBOW STAG BEETLE PLEASE'], ['Mika', 'More customers! No wait, fewer! No, more!'], ['Goro', 'Biggest pumpkin. Again.'], ['Pip', 'To find the post office on the first try.'], ['Kiko', 'Limited pudding, restocked forever.'], ['Tobias', '(A neat strip, folded into a star. It is blank.)']]; const a = W[Math.floor(g.rng() * W.length)], b = W[(W.indexOf(a) + 3) % W.length]; return g.run([N(`${a[0]}: "${a[1]}"`), N(`${b[0]}: "${b[1]}"`), say('misa', 'happy', 'Everyone\'s wishes, all fluttering together.')]); } },
    ],
    closeAt: '20:00', closeMap: 'town',
    script: () => [...scene('tanabata'), say('misa', 'happy', 'There\'s Vega... and there\'s Altair, across the river of stars.'), say('misa', 'happy', 'Grandma says they only get to meet once a year, tonight. I hope the sky stays clear for them.'), N('A cool breeze rustles the bamboo. Hundreds of wishes whisper at once.'), { t: 'mood', n: 12 }, ...endScene],
  },
  cleanup_day: {
    name: 'Beach Clean-up Day', icon: 'i_check', date: 'summer-9', maps: ['beach'], hours: ['07:00', '17:00'],
    desc: 'The whole town tidies Shell Beach. Collect as much litter as you can!',
    decor: { beach: [T('shore', 'ev_cleanup_sign', -3, 0), T('towel', 'ev_trash_bags', 2, 0), T('shaved_ice', 'ev_bunting', 0, -2)] },
    activities: [stall('cleanup', 'beach', 'shore', -3, 1, 'Join the clean-up', 'fest_cleanup', 0, (g, r) => { const n = (r.data || {}).got || 0; g.stat('litterCollected', n); g.addMoney(n * 5); g.addXP('charm', 8); for (const id of ['hina', 'ogawa']) if (get('npc', id)) g.addFriend(id, 15); if (n >= 15) giveOr(g, ['star_sticker']); })],
    closeAt: '16:00', closeMap: 'beach',
    script: () => [...scene('cleanup'), say('ogawa', 'happy', 'LOOK AT THIS BEACH! Spotless! I\'m not crying, it\'s sea spray!'), say('hina', 'happy', 'The crabs are going to be so happy. Hi, crabs!'), say('misa', 'happy', 'It looks brand new.'), { t: 'mood', n: 10 }, ...endScene],
  },
  meteor_summer: { name: 'Summer meteor shower', icon: 'i_star', date: 'summer-12', maps: ['yard', 'shrine', 'beach'], hours: ['20:00', '26:00'], desc: 'Shooting stars all night. Find a dark spot after 21:00 and make several wishes.', closeAt: '21:00', closeMap: 'yard', script: () => meteorScript('summer') },
  derby: {
    name: 'Summer Fishing Derby', icon: 'i_fishicon', date: 'summer-14', maps: ['harbour'], hours: ['06:00', '18:00'],
    desc: 'Catch as many fish as you can on the pier, then weigh in with Captain Jun before 18:00.',
    decor: { harbour: [T('pier_end', 'ev_derby_flag', -1, 0), T('bait_shop', 'ev_bunting', 0, -2), T('dock', 'ev_derby_flag', 1, 0)] },
    setup: (g) => { g.state.festivals.derbyStart = g.state.stats.fishCaught || 0; },
    activities: [{ id: 'weighin', map: 'harbour', spot: 'bait_shop', dy: 1, label: 'Derby weigh-in', daily: true, when: 'time>=09:00', run: (g) => { const n = (g.state.stats.fishCaught || 0) - (g.state.festivals.derbyStart || 0); g.stat('derbyEntries'); return g.run(n >= 5 ? [say('jun', 'happy', `${n} fish! Ha! That\'s the best haul on the pier today! Champion of the derby!`), { t: 'money', n: 500 }, { t: 'call', fn: (gg) => { gg.stat('derbyWins'); giveOr(gg, ['star_sticker'], 2); } }] : n > 0 ? [say('jun', 'happy', `${n} fish. Not bad for a landlubber! Here, a little something for trying.`), { t: 'money', n: 50 * n }] : [say('jun', 'neutral', 'Nothing in the bucket yet? The fish are out there. Go and ask them nicely.')]); } }],
  },
  obon: {
    name: 'Obon Lantern Night', icon: 'i_star', date: 'summer-17', maps: ['harbour'], hours: ['17:00', '23:00'],
    desc: 'Bon dancing around the yagura tower, then floating lanterns carry thanks out to sea.',
    decor: { harbour: [T('market_stall', 'ev_yagura', 0, -1), T('pier_end', 'ev_lanterns_bon', 0, -2, { light: 'lantern' }), T('noodle_stand', 'ev_lanterns_bon', 0, -2, { light: 'lantern' }), T('dock', 'ev_toro', 1, 1, { flat: true })] },
    activities: [stall('toro', 'harbour', 'pier_end', 0, 1, 'Float a lantern', 'fest_lanterns', 0, lanternPrize, { water: true }),
      { id: 'dance', map: 'harbour', spot: 'market_stall', dy: 1, label: 'Join the bon dance', daily: true, run: (g) => g.run([{ t: 'sfx', name: 'schoolbell' }, N('Clap, step, turn, clap. The whole town circles the tower to the beat of the taiko.'), say('misa', 'happy', 'I think I\'m getting it! Clap, step, turn, step on Kai\'s foot...'), say('kai', 'surprised', 'Ow! It\'s fine, keep going!'), { t: 'mood', n: 12 }, { t: 'energy', n: -5 }, { t: 'call', fn: (gg) => gg.stat('bonDances') }]) }],
    closeAt: '20:30', closeMap: 'harbour',
    script: () => [...scene('lanterns_water'), say('misa', 'neutral', 'Grandma says the lanterns guide everyone\'s ancestors home, then back again.'), say('misa', 'happy', 'Thank you, Grandpa. I never met you, but your garden still grows.'), N('The lanterns drift out past the lighthouse, one by one.'), { t: 'mood', n: 15 }, ...endScene],
  },
  matsuri: {
    name: 'Summer Matsuri', icon: 'i_star', date: 'summer-20', maps: ['town'], shop: true, hours: ['15:00', '23:30'],
    desc: 'Yukata, goldfish scooping, ring toss, takoyaki and a fireworks show over the bay at 20:00.',
    decor: { town: MATSURI_TOWN },
    activities: [stall('goldfish', 'town', 'market_1', 0, 1, 'Goldfish scooping', 'fest_goldfish', 50, goldfishPrize), stall('ringtoss', 'town', 'market_2', 0, 1, 'Ring toss', 'fest_ringtoss', 50, ringPrize),
      food('takoyaki', 'town', 'ramen_cart', -3, 0, 'Takoyaki', ['dish_takoyaki'], 80), food('candy', 'town', 'cafe_terrace', 0, 3, 'Candy apple', ['dish_fest_candy_apple'], 40), food('cotton', 'town', 'cafe_terrace', 1, 3, 'Cotton candy', ['dish_fest_cotton_candy'], 30), food('mask', 'town', 'noticeboard', 3, 2, 'Fox mask', ['toy_fest_mask'], 60), food('balloon', 'town', 'noticeboard', 2, 2, 'Water balloon yo-yo', ['toy_fest_balloon'], 30)],
    closeAt: '20:00', closeMap: 'town',
    script: () => [...scene('fireworks'), say('kai', 'happy', 'Here it comes! The big one! Let\'s gooo!'), { t: 'sfx', name: 'thunder' }, say('hina', 'surprised', 'It looks like a giant dandelion! A GIANT FIRE DANDELION!'), say('misa', 'happy', 'Tamaya!'), say('kai', 'happy', 'Kagiya!'), N('Gold, pink and blue bloom over the bay, and their reflections bloom again in the water.'), { t: 'mood', n: 20 }, { t: 'call', fn: (g) => g.stat('fireworksSeen') }, ...endScene],
  },
  // ---------------- autumn ----------------
  leaves_walk: {
    name: 'Autumn Leaves Walk', icon: 'i_leaf', date: 'autumn-7', maps: ['park', 'shrine'], hours: ['08:00', '18:00'],
    desc: 'Momijigari: walk the park and the shrine forest path under red and gold leaves. Some piles hide treasures.',
    decor: { park: [T('bench', 'ev_leaf_pile', 1, 1, { flat: true }), T('bridge', 'ev_leaf_pile', -2, 1, { flat: true }), T('lawn', 'ev_leaf_pile', 2, 0, { flat: true })], shrine: [T('forest_path', 'ev_leaf_pile', 0, 1, { flat: true }), T('lookout', 'ev_leaf_pile', -1, 1, { flat: true })] },
    activities: [
      { id: 'pile_park', map: 'park', spot: 'bench', dx: 1, dy: 1, label: 'Jump in the leaf pile', daily: true, run: (g) => leafPile(g) },
      { id: 'pile_shrine', map: 'shrine', spot: 'forest_path', dy: 1, label: 'Jump in the leaf pile', daily: true, run: (g) => leafPile(g) }],
    closeAt: '15:00', closeMap: 'park',
    script: () => [...scene('leaves'), say('misa', 'happy', 'Crunch, crunch, crunch. Autumn sounds like cornflakes.'), { t: 'say', who: 'mochi', mood: 'happy', text: 'Mrrrow!' }, say('misa', 'surprised', 'Mochi, you followed me? You\'re covered in leaves!'), { t: 'mood', n: 12 }, ...endScene],
  },
  harvest: {
    name: 'Harvest Market', icon: 'i_leaf', date: 'autumn-13', maps: ['town'], shop: true, hours: ['09:00', '20:00'],
    desc: 'Crop judging, a pie contest and the giant pumpkin weigh-in against Goro. Harvest night lanterns after dark.',
    decor: { town: [T('market_1', 'ev_stall_veg', 0, -1), T('market_2', 'ev_stall_veg', 0, -1), T('stage', 'ev_bunting', 0, 2), T('fountain', 'ev_lanterns', 0, -3, { light: 'lantern' }), T('bench_1', 'ev_pumpkin', 1, 0)] },
    activities: [{ id: 'judging', map: 'town', spot: 'stage', dy: 3, label: 'Enter the crop judging', daily: true, run: (g) => harvestJudging(g) }],
    closeAt: '18:30', closeMap: 'town',
    script: () => [...scene('leaves'), say('goro', 'neutral', 'Hmph. A fine harvest this year. For everyone. Even you.'), say('misa', 'happy', 'Was that... a compliment, Mr. Hayashi?'), say('goro', 'happy', 'Don\'t push it.'), { t: 'mood', n: 10 }, ...endScene],
  },
  moon: {
    name: 'Moon Viewing', icon: 'i_star', date: 'autumn-15', maps: ['sunny_pines', 'shrine'], hours: ['10:00', '23:00'],
    desc: 'Tsukimi: make dango and watch the harvest moon with Grandma at Sunny Pines.',
    decor: { sunny_pines: [T('garden_bench', 'ev_dango_stand', 1, 0)], shrine: [T('lookout', 'ev_dango_stand', 1, 0)] },
    setup: (g) => giveOr(g, ['dish_dango'], 1),
    closeAt: '18:00', closeMap: 'sunny_pines',
    script: () => [...scene('moon'), say('hana', 'happy', 'There it is. Can you see the rabbit, dear? It\'s pounding mochi.'), say('misa', 'happy', 'I see it! Its ears are... there?'), say('hana', 'happy', 'Your mother said the same thing at your age. Then she ate all the dango.'), say('misa', 'happy', 'I saved you the biggest one, Grandma.'), { t: 'friend', npc: 'hana', n: 40 }, { t: 'mood', n: 15 }, ...endScene],
  },
  culture: { name: 'Culture Festival', icon: 'i_school', date: ['autumn-20', 'autumn-21'], maps: ['school_grounds'], school: true, shop: true, desc: 'Class 2-B\'s cafe, the band on stage, and the art and bug exhibitions.', decor: { school_grounds: [T('gate', 'ev_bunting', 0, -1), T('field_center', 'ev_stall_sweets', -3, 0), T('field_center', 'ev_stall_takoyaki', 3, 0), T('bench', 'ev_chochin', 1, 0, { light: 'lantern' })] } },
  grandparents: {
    name: 'Grandparents\' Day', icon: 'heart', date: 'autumn-22', maps: ['sunny_pines'], holiday: true,
    desc: 'Respect for the Aged Day: a holiday to visit Grandma Hana. Sunny Pines throws a tea party.',
    decor: { sunny_pines: [T('lounge', 'ev_bunting', 0, -2)] },
    closeAt: '10:00', closeBy: '18:00', closeMap: 'sunny_pines',
    script: () => [say('hana', 'happy', 'Misa! On a holiday, too. The others are all jealous, you know.'), say('misa', 'happy', 'Happy Grandparents\' Day, Grandma. I made you a card.'), N('The card has Mochi on it. Mochi is wearing a crown.'), say('hana', 'happy', 'A royal cat. Accurate. I\'ll put it by my bed.'), { t: 'friend', npc: 'hana', n: 50 }, { t: 'mood', n: 10 }],
  },
  ghost: {
    name: 'Lantern Ghost Night', icon: 'i_question', date: 'autumn-28', maps: ['lane', 'shrine'], shop: true, hours: ['16:00', '24:00'],
    desc: 'Costumes, trick-or-treat along Lantern Lane, and ghost stories at the shrine.',
    decor: { lane: [T('crossroad', 'ev_lanterns_ghost', 0, -2, { light: 'lantern' }), T('goro_garden', 'ev_pumpkin', 1, 0, { light: 'candle' }), T('bus_stop', 'ev_obake', 1, 0, { light: 'lantern' }), T('vending', 'ev_pumpkin', -1, 0, { light: 'candle' })], shrine: [T('steps', 'ev_obake', -2, 0, { light: 'lantern' }), T('torii', 'ev_obake', 2, 0, { light: 'lantern' })] },
    activities: [{ id: 'trick', map: 'lane', spot: 'goro_garden', dy: 1, label: 'Trick or treat!', daily: true, when: 'time>=17:00', run: (g) => g.run([say('misa', 'happy', 'Trick or treat!'), say('goro', 'neutral', 'Hmph. Ghosts in my day were scarier. ...Here. Don\'t tell Daifuku.'), { t: 'give', item: 'dish_fest_candy_apple', n: 1 }, { t: 'call', fn: (gg) => gg.stat('trickOrTreats') }]) },
      { id: 'stories', map: 'shrine', spot: 'steps', dy: 1, label: 'Listen to ghost stories', daily: true, when: 'time>=19:00', run: (g) => g.run([say('kiko', 'neutral', 'Long ago, a lantern on this hill lit itself every night... with no one to light it.'), say('misa', 'surprised', 'And then?'), say('kiko', 'happy', 'And then the electric company sent a very confused letter. Boo.'), { t: 'mood', n: 8 }]) }],
    closeAt: '21:00', closeMap: 'shrine',
    script: () => [...scene('ghost_night'), say('misa', 'surprised', 'Did that lantern just... wink at me?'), N('Somewhere in the dark, Kiko laughs and switches off a pocket torch.'), say('misa', 'happy', 'Kiko!'), { t: 'mood', n: 12 }, ...endScene],
  },
  // ---------------- winter ----------------
  first_snow: { name: 'First snow', icon: 'i_snow', minor: true, date: (g, day) => g.state.weatherFx && g.state.weatherFx.firstSnow === day, maps: [], desc: 'The first snowfall of the winter. Snowmen appear all over town.',
    decor: { yard: [T('garden', 'ev_snowman', 0, 0)], town: [T('fountain', 'ev_snowman', 4, 1)], park: [T('lawn', 'ev_snowman', 1, 0)] } },
  wintermarket: {
    name: 'Winter Market', icon: 'i_snow', date: 'winter-6', maps: ['town'], shop: true, hours: ['10:00', '22:00'],
    desc: 'Craft stalls, hot cocoa and an ice sculpture in the square.',
    decor: { town: [T('market_1', 'ev_stall_winter', 0, -1), T('market_2', 'ev_stall_cocoa_winter', 0, -1), T('fountain', 'ev_ice_swan', 0, 2), T('stage', 'ev_bunting_winter', 0, 2), T('bench_1', 'ev_chochin_white', 1, 0, { light: 'lantern' })] },
    activities: [food('cocoa', 'town', 'market_2', 0, 1, 'Hot cocoa', ['drink_fest_cocoa'], 35), food('craft', 'town', 'market_1', 0, 1, 'Handmade gift', ['toy_fest_plush'], 120)],
    closeAt: '18:00', closeMap: 'town',
    script: () => [...scene('winter_market'), say('misa', 'happy', 'Everything smells like cinnamon and roasted chestnuts.'), say('sachiko', 'happy', 'Here, dear, on the house! Don\'t tell anyone, I have a reputation.'), { t: 'give', item: 'drink_fest_cocoa', n: 1 }, ...endScene],
  },
  chocolate: {
    name: 'Friendship Chocolate Day', icon: 'heart', date: 'winter-14', maps: ['home', 'town'], shop: true,
    desc: 'Make chocolates at home and hand them to friends. Everyone loves them.',
    activities: [], setup: () => {},
    closeAt: '10:00', closeBy: '20:00', closeMap: 'home',
    script: () => [say('misa', 'happy', 'Chocolate day! Time to make friendship chocolates.'), { t: 'choice', prompt: 'Make a batch?', options: [
      { text: 'Make 5 chocolates (100c)', when: 'money>=100', steps: [{ t: 'money', n: -100 }, { t: 'time', add: 60 }, N('Melt, pour, chill, decorate. The kitchen smells amazing.'), { t: 'give', item: 'gift_fest_chocolate', n: 5 }, { t: 'xp', skill: 'cooking', n: 20 }, say('misa', 'happy', 'Five boxes with ribbons. Now to find my friends!')] },
      { text: 'Make 2 chocolates (40c)', when: 'money>=40', steps: [{ t: 'money', n: -40 }, { t: 'time', add: 30 }, { t: 'give', item: 'gift_fest_chocolate', n: 2 }, { t: 'xp', skill: 'cooking', n: 8 }] },
      { text: 'Maybe later', steps: [] }] }],
  },
  meteor_winter: { name: 'Winter meteor shower', icon: 'i_star', date: 'winter-15', maps: ['yard', 'shrine', 'beach'], hours: ['20:00', '26:00'], desc: 'The brightest shower of the year. Bundle up and look up after 21:00.', closeAt: '21:00', closeMap: 'yard', script: () => meteorScript('winter') },
  setsubun: {
    name: 'Setsubun', icon: 'i_anger', date: 'winter-21', maps: ['home'], shop: true,
    desc: 'Throw roasted beans to chase out the oni and invite luck in. Eat a lucky roll in silence.',
    decor: { home: [T('door_inside', 'ev_bean_box', 1, 0)] },
    setup: (g) => g.give('dish_fest_beans', 3, true),
    activities: [stall('beans', 'home', 'door_inside', 1, 0, 'Throw beans', 'fest_beans', 0, (g, r) => { g.stat('oniChased', (r.data || {}).hits || 0); g.addMood(8); giveOr(g, ['dish_fest_ehomaki']); })],
    closeAt: '19:00', closeMap: 'home',
    script: () => [...scene('setsubun'), say('misa', 'happy', 'Oni wa soto! Fuku wa uchi! Demons out, luck in!'), { t: 'say', who: 'mochi', mood: 'surprised', text: 'MRRAW!' }, say('misa', 'surprised', 'Mochi, the beans are not for chasing! ...Okay, they are a bit.'), { t: 'mood', n: 10 }, ...endScene],
  },
  yuzu: {
    name: 'Solstice Yuzu Bath', icon: 'i_sun', date: 'winter-22', maps: ['home'],
    desc: 'The longest night: float yuzu in the bath for a big cozy boost.',
    closeAt: '19:00', closeMap: 'home',
    script: () => [say('misa', 'happy', 'The longest night of the year. You know what that means...'), { t: 'choice', prompt: 'Run a yuzu bath?', options: [{ text: 'Yes please', steps: [...scene('yuzu_bath'), say('misa', 'sleepy', 'Ahhh... citrus and steam. I\'m melting. Happily.'), { t: 'mood', n: 30 }, { t: 'energy', n: 40 }, { t: 'call', fn: (g) => g.stat('yuzuBaths') }, ...endScene] }, { text: 'Not tonight', steps: [] }] }],
  },
  starryeve: {
    name: 'Starry Eve', icon: 'i_star', date: 'winter-24', maps: ['town'], shop: true, hours: ['10:00', '24:00'],
    desc: 'A star tree in the square, a gift swap with friends, and Aunt Nori comes to stay.',
    decor: { town: [T('fountain', 'ev_star_tree', 0, -1), T('stage', 'ev_bunting_winter', 0, 2), T('bench_1', 'ev_chochin_white', 1, 0, { light: 'lantern' }), T('bench_2', 'ev_chochin_white', -1, 0, { light: 'lantern' })] },
    activities: [{ id: 'swap', map: 'town', spot: 'fountain', dy: 3, label: 'Gift swap', daily: true, run: (g) => g.run([say('misa', 'happy', 'Gift swap! Everyone puts in a present and draws one out.'), N('You draw a little parcel tied with string...'), { t: 'call', fn: (gg) => { const opts = ['toy_fest_plush', 'drink_fest_cocoa', 'gift_fest_postcard', 'dish_fest_candy_apple']; gg.give(opts[Math.floor(gg.rng() * opts.length)], 1); gg.stat('giftSwaps'); } }, say('misa', 'happy', 'It\'s perfect!')]) }],
    closeAt: '19:00', closeMap: 'town',
    script: () => [...scene('star_tree'), say('nori', 'happy', 'Surprise! I took the last bus. Don\'t tell your mother I slept through two stops.'), say('misa', 'happy', 'Aunt Nori! Look, they lit the star tree!'), say('nori', 'happy', 'Every year it gets more crooked. I love it.'), { t: 'friend', npc: 'nori', n: 40 }, { t: 'mood', n: 15 }, ...endScene],
  },
  newyear: {
    name: 'New Year\'s Eve', icon: 'i_star', date: 'winter-28', maps: ['shrine', 'home'], shop: true, hours: ['10:00', '26:00'],
    desc: 'Toshikoshi soba, then the shrine bell rings 108 times at midnight. First sunrise on Spring 1!',
    decor: { shrine: [T('torii', 'ev_kadomatsu', -2, 0), T('torii', 'ev_kadomatsu', 2, 0), T('steps', 'ev_chochin_white', -2, 0, { light: 'lantern' }), T('steps', 'ev_chochin_white', 2, 0, { light: 'lantern' }), T('fortune_stand', 'ev_stall_fortune', 0, -1)], yard: [T('gate', 'ev_kadomatsu', -1, 0), T('gate', 'ev_kadomatsu', 1, 0)] },
    setup: (g) => g.give('dish_fest_soba', 1, true),
    activities: [food('amazake_nye', 'shrine', 'fortune_stand', 0, 1, 'Warm amazake', ['drink_fest_amazake'], 0)],
    closeAt: '23:30', closeMap: 'shrine',
    script: () => [...scene('shrine_night'), say('kiko', 'happy', 'Misa. Would you like to ring the bell? One hundred and eight times, one for each worry.'), say('misa', 'surprised', 'All of them?'), say('kiko', 'happy', 'We take turns. Ready? One...'), { t: 'sfx', name: 'bell' }, N('BONG. The sound rolls down the hill and out over the sleeping bay.'), { t: 'sfx', name: 'bell' }, say('misa', 'happy', 'Happy New Year, Hoshimori.'), { t: 'mood', n: 20 }, { t: 'call', fn: (g) => g.stat('bellsRung') }, ...endScene],
  },
};

function meteorScript(season) {
  return [...scene('meteors'), say('misa', 'happy', season === 'winter' ? 'Brr. But look! There, and there, and THERE!' : 'Lying on the grass, counting shooting stars...'), say('misa', 'happy', 'Quick, three wishes before they stop!'),
    { t: 'choice', prompt: 'First wish', options: [{ text: 'A good year at school', steps: [{ t: 'xp', skill: 'study', n: 10 }] }, { text: 'Mum and Dad home soon', steps: [{ t: 'mood', n: 6 }] }] },
    { t: 'choice', prompt: 'Second wish', options: [{ text: 'Friends forever', steps: [{ t: 'xp', skill: 'charm', n: 10 }] }, { text: 'A huge fish', steps: [{ t: 'xp', skill: 'fishing', n: 10 }] }] },
    { t: 'choice', prompt: 'Third wish', options: [{ text: 'Grandma stays well', steps: [{ t: 'mood', n: 6 }] }, { text: 'Mochi gets fatter', steps: [{ t: 'say', who: 'mochi', mood: 'happy', text: 'Mrrrp.' }] }] },
    { t: 'call', fn: (g) => g.stat('wishesMade', 3) }, { t: 'mood', n: 15 }, ...endScene];
}
function leafPile(g) {
  const r = g.rng(), found = r < 0.25 ? giveOr(g, ['mat_ev_acorn']) : null;
  g.stat('leafPiles');
  return g.run([{ t: 'sfx', name: 'dig' }, say('misa', 'happy', 'Wheee! Crunch!'), ...(r < 0.08 ? [N('Something glints in the leaves... a coin purse with 200 coins and no name. You hand it to the police box later and they say finders keepers.'), { t: 'money', n: 200 }] : found ? [N('An acorn tumbles out of the pile.')] : [{ t: 'mood', n: 6 }])]);
}
function harvestJudging(g) {
  const crops = Object.keys(g.state.inv).filter((id) => { const it = get('item', id); return it && it.cat === 'crop'; });
  if (!crops.length) return g.run([say('ogawa', 'happy', 'The judging table needs a crop! Bring me something you grew!'), say('misa', 'neutral', 'I\'d better start a garden for next year.')]);
  const best = crops.sort((a, b) => (get('item', b).price || 0) - (get('item', a).price || 0))[0], it = get('item', best), score = Math.min(100, Math.round((it.price || 20) / 3 + g.skillLevel('gardening') * 6 + g.rng() * 20));
  return g.run([{ t: 'take', item: best, n: 1 }, say('ogawa', 'happy', `A fine ${it.name.toLowerCase()}! The judges say... ${score} points!`),
    ...(score >= 70 ? [say('goro', 'surprised', 'Hmph! ...Beaten. By a schoolgirl. Daifuku, don\'t look at me.'), { t: 'money', n: 300 }, { t: 'call', fn: (gg) => { gg.stat('harvestWins'); giveOr(gg, ['star_sticker'], 2); } }] : [say('goro', 'happy', 'Not bad. Not as good as mine. But not bad.'), { t: 'money', n: 60 }]), { t: 'call', fn: (gg) => gg.stat('cropsJudged') }]);
}

for (const [id, def] of Object.entries(FESTIVALS)) register('festival', id, def);
export const FESTIVAL_IDS = Object.keys(FESTIVALS);
export const thisYear = (g) => yearOf(g.day);

features('Festivals', [
  'A festival calendar of 27 events across the year, from Hanami to New Year\'s Eve',
  'Doll Festival: Grandma\'s hina doll set comes out at home, with hina arare',
  'Koinobori Day: carp streamers flap over Lantern Lane and kashiwa mochi go on sale',
  'Hanami Picnic: picnic mats and pink lanterns in Sakura Park, a blossom photo contest and Aunt Nori\'s visit',
  'Golden Week: three days off school and a flea market in the square',
  'Sports Day and the Culture Festival are on the calendar and the school grounds get bunting',
  'Starlight Festival: stalls in the square and, every year after the story, a lantern release on the beach',
  'Tanabata Wish Night: write a wish on a paper strip and read everyone\'s wishes on the bamboo',
  'Beach Clean-up Day: help the town clean Shell Beach for coins and friendship',
  'Summer and winter meteor showers: make three wishes on a night full of shooting stars',
  'Summer Fishing Derby: catch fish all day and weigh in with Captain Jun for a prize',
  'Obon Lantern Night: bon dancing around the yagura tower and floating lanterns at the harbour',
  'Summer Matsuri: stalls, goldfish scooping, ring toss, takoyaki, masks and a fireworks show over the bay',
  'Autumn Leaves Walk: jump in leaf piles in the park and on the shrine path, some hide treasures',
  'Harvest Market: enter your best crop in the judging against Goro',
  'Moon Viewing: dango and the harvest moon with Grandma at Sunny Pines',
  'Grandparents\' Day: a school holiday to visit Grandma Hana',
  'Lantern Ghost Night: pumpkin and ghost lanterns, trick-or-treat on Lantern Lane and ghost stories at the shrine',
  'Winter Market: craft stalls, hot cocoa and an ice swan sculpture in the square',
  'Friendship Chocolate Day: make boxes of chocolates at home that every friend loves',
  'Setsubun: throw beans to chase the oni out of the house, then eat a lucky roll',
  'Solstice yuzu bath on the longest night for a big cozy and energy boost',
  'Starry Eve: a star tree in the square, a gift swap and Aunt Nori\'s visit',
  'New Year\'s Eve: soba, then ring the shrine bell at midnight with Kiko',
  'New Year\'s Day: the year\'s first shrine visit with a wish, and the first sunrise at the beach',
  'Festival food stalls: candy apples, cotton candy, takoyaki, kashiwa mochi, amazake and cocoa',
]);
