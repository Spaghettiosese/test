// Post-game epilogues (Summer "Keeper's Logbook", Autumn "The Other Lantern", Winter "Homecoming") and side arcs
// A (Cafe Kumo's Missing Menu), B (Pip's Forgotten Satchel), D (Rival Notes) and E (Theo's Garage Band).
import { register, get, features } from '../../core/registry.js';
import { dateOf, seasonOf } from '../../core/time.js';
import { itemIcon } from '../../gfx/icons.js';
import { lines, choice, advance, scene, fade, wait, sfx, emote, place, leave, give, take, set, friend, memory, page, call, mood, script, hook } from './util.js';

const quest = (id, def) => register('quest', id, def);
const mg = (id, opts = {}) => ({ t: 'minigame', id, opts });
const once = (key) => (g) => g.flag(key) !== g.day;
const markDay = (key) => call((g) => g.setFlag(key, g.day));
const count = (id) => (g) => (g.state.story.qn || {})[id] || 0;

// ================================================================ Epilogue: Summer, "Keeper's Logbook"
quest('epi_summer', {
  name: 'Keeper\'s Logbook', chapter: 10, desc: 'Summer at the Star Lantern. Keep the lamp lit, and read what Grandma wrote in her keeper years.',
  start: { has: ['flag:lantern_lit', 'season:summer'] },
  stages: [
    { text: (g) => `Light the Star Lantern on summer nights (${count('epi_summer')(g)}/3)`, hint: 'Use the lamp in the lighthouse lamp room after 6 PM', done: { on: 'lampLit', count: 3 } },
    { text: (g) => `Read Hana's old logbook entries (${count('epi_summer')(g)}/3)`, hint: 'The logbook is in the lighthouse', done: { on: 'logRead', count: 3 } },
    { text: 'Tell Grandma what you read in her logbook', hint: 'Grandma is at Sunny Pines' },
  ],
  reward: { money: 500, flags: ['epilogue_summer_done'] },
});
hook('story_epi_summer', 'hana', 'quest:epi_summer=2', [
  ...lines('misa/happy|Grandma, I\'ve been reading your logbook. The ginger kitten in the oil store! Mikan!', 'hana/happy|Mikan! Oh, that cat. She stole Toby\'s sandwiches for a whole year.',
    'misa|And you wrote that the whole town came to the beach for the first sunrise. And that Mum fell asleep on your shoulder.', 'hana/happy|She snored. Like her grandfather. Like Toby. All the important people in my life snore.',
    'hana|Keep writing in it, Misa. A logbook is just a diary that the sea gets to read too.'),
  friend('hana', 60), page('p12'), memory('story_epi_summer'), advance('epi_summer'),
]);

// ================================================================ Epilogue: Autumn, "The Other Lantern"
quest('epi_autumn', {
  name: 'The Other Lantern', chapter: 11, desc: 'Mr. Wren has been building something in secret for twenty years.',
  start: { has: ['flag:lantern_lit', 'season:autumn'] },
  stages: [
    { text: 'Visit Mr. Wren at his clock shop', hint: 'Wren\'s Clocks, on the square (closed Sundays)' },
    { text: 'Find the music box key in the clock tower', hint: 'Look near the bell at the top of the clock tower' },
    { text: 'Bring the key back to Mr. Wren', hint: 'Wren\'s Clocks' },
    { text: 'Take the music box to Grandma', hint: 'Sunny Pines' },
  ],
  reward: { flags: ['epilogue_autumn_done'], friend: { tobias: 100, hana: 100 } },
});
hook('story_epi_autumn_1', 'tobias', 'quest:epi_autumn=0', [
  ...lines('tobias|Ah. The keeper. Come here. No, closer. Touch nothing.', '|Under a cloth on his workbench: a tiny brass lighthouse, no taller than a teacup, with a lamp of polished glass.',
    'misa/surprised|It\'s the Star Lantern! A tiny one!', 'tobias|A music box. I started it the winter after the storm. For her. I never finished the key. Couldn\'t bring myself to.',
    'tobias|I made the key, in the end. And then I lost it. In the clock tower. Out of pure spite, I suspect. The tower\'s, not mine.', 'misa/happy|I\'ll find it.'),
  advance('epi_autumn'),
]);
register('storyProp', 'music_key', { map: 'clock_tower', spot: 'bell', label: 'Something glinting by the bell', when: 'quest:epi_autumn=1',
  run: (g) => g.run([...lines('|Wedged in a crack under the great bell: a winding key, no bigger than a fingernail, shaped like a star.'), give('story_music_key'), advance('epi_autumn')]) });
hook('story_epi_autumn_2', 'tobias', 'quest:epi_autumn=2&item:story_music_key', [
  take('story_music_key'), ...lines('tobias|...That is the one. Hmph. Under the bell. Of course.', '|He fits the key, turns it three times, and sets the little lighthouse on the counter.'),
  sfx('chime'), ...lines('|The tiny lamp turns, scattering stars across the shop walls, and a slow rolling melody plays. The Keeper\'s Song.',
    'tobias|Take it to her. ...Tell her I wrote the tune. She\'ll say it\'s lovely. I\'ll pretend I didn\'t hear.'), give('story_music_box'), advance('epi_autumn'),
]);
hook('story_epi_autumn_3', 'hana', 'quest:epi_autumn=3&item:story_music_box', [
  ...lines('misa|Grandma, this is from Mr. Wren. He made it for you, a long time ago.', '|Misa winds the little brass lighthouse. Stars turn across the lounge ceiling. The Keeper\'s Song fills the room.'),
  sfx('chime'),
  ...lines('|Grandma Hana begins to sing, softly, every word of it. The residents put down their knitting to listen.',
    'hana/happy|"Hush now, little lantern, the sea is dark and wide. Shine across the water, and bring the sailors home."', 'hana/happy|...He wrote a lovely tune. Don\'t tell him I said so.',
    'misa/happy|He said you\'d say that.', 'hana/happy|Then he knows me. Good. Tell him tea is on Sunday. He can stop standing at the gate now.'),
  take('story_music_box'), memory('story_epi_autumn'), advance('epi_autumn'),
]);

// ================================================================ Epilogue: Winter, "Homecoming"
const homecomingDay = (g) => g.season === 'winter' && dateOf(g.day) >= 27;
const newYear = (g) => g.season === 'spring' && dateOf(g.day) === 1 && g.day > 28;
quest('epi_winter', {
  name: 'Homecoming', chapter: 12, desc: 'Mum and Dad are coming home for New Year!',
  start: { has: ['flag:lantern_lit', 'season:winter'] },
  stages: [
    { text: 'Mum and Dad\'s ship docks on Winter 27. Wait for them!', hint: 'Just live your life. The Kujira arrives on Winter 27', done: { has: homecomingDay }, script: 'story_epi_winter_ship' },
    { text: 'Ring in the New Year, then wake up for the first sunrise', hint: 'Sleep through New Year\'s Eve', done: { on: 'dayStart', when: newYear }, script: 'story_epi_winter_sunrise' },
  ],
  reward: { flags: ['epilogue_winter_done'], money: 1000 },
});
script('story_epi_winter_ship', [
  fade(1, 0.6), scene('story_ship'), fade(0, 0.8),
  ...lines('|A horn sounds across Hoshimori Bay. The research ship Kujira, white and orange, slides into the harbour.', 'mum/happy|MISA!!',
    '|Mum is down the gangway before it finishes lowering. Dad is right behind her with three bags and a giant pot.', 'misa/happy|MUM! DAD!',
    'dad/happy|I brought soup. It survived the whole voyage. Its name is Gerald.', 'mum/happy|Look at you. Look at you! You lit the lantern. You kept the house warm.',
    'misa/happy|And the cat fed. Mochi is going to sit on all your bags.'),
  fade(1, 0.8), scene(null), fade(0, 0.8), memory('story_epi_winter_ship'),
], 'The Kujira comes home');
script('story_epi_winter_sunrise', [
  scene('story_sunrise'), fade(0, 1.2),
  ...lines('|Before dawn on the first day of the new year, the Aoki family walks down to Shell Beach in their warmest coats.',
    '|Half the town is already there. Grandma Hana, wrapped in blankets, with Mr. Wren holding her thermos.', 'mum|I used to watch the first sunrise right here, with Grandma. Every year.',
    'dad|Make a wish for the year. Mine is a bigger pot.', 'misa/happy|Mine is... more of this. More years like this one.',
    '|The sun lifts out of the sea, gold and enormous. Behind them, the Star Lantern blinks off for the day, its work done.'),
  fade(1, 1.2), scene(null), fade(0, 0.8), mood(40), memory('story_epi_winter_sunrise'),
], 'The first sunrise');

// ================================================================ Side arc A: Cafe Kumo's Missing Menu
export const RECIPE_CARDS = [
  ['library', 'stacks', 'dish_kumo_honey_toast', 'Honey Toast', '"Where the books sleep." Mum always read in the library stacks.'],
  ['goro_house', 'kitchen', 'dish_kumo_veggie_curry', 'Garden Curry', '"Where the gardener grumbles." Mr. Hayashi\'s kitchen!'],
  ['park', 'bandstand', 'dish_kumo_sakura_scone', 'Sakura Scone', 'She used to sell scones at the park bandstand concerts.'],
  ['clock_shop', 'bench', 'dish_kumo_cloud_pancakes', 'Cloud Pancakes', 'She swapped recipes for clock repairs with Mr. Wren. Hmm!'],
  ['post_office', 'sorting', 'dish_kumo_melon_soda', 'Melon Soda Float', 'She posted a card to a magazine once. Maybe it never left?'],
  ['mart', 'gacha', 'dish_kumo_pudding', 'Kumo Pudding', 'Sachiko and Mum swapped pudding tips by the old toy machine.'],
  ['harbour', 'noodle_stand', 'dish_kumo_omurice', 'Harbour Omurice', 'Mum loved the harbour noodle stand. She argued with the cook about eggs.'],
  ['beach', 'driftwood', 'dish_kumo_strawberry_sando', 'Strawberry Sando', 'Beach picnics! She always sat on the big driftwood log.'],
  ['shrine', 'fortune_stand', 'dish_kumo_matcha_roll', 'Matcha Roll', 'She brought cake to the shrine every New Year for good fortune.'],
  ['school_halls', 'library_corner', 'dish_kumo_hojicha_float', 'Hojicha Float', 'She ran the school bake sale for years. In the hall book corner.'],
  ['shotengai', 'stall', 'dish_kumo_cheesecake', 'Baked Cheesecake', 'The Friday merchant\'s stall in the Shotengai bought her cheesecakes.'],
  ['cafe', 'window_seat', 'dish_kumo_star_parfait', 'Star Parfait', 'Her favourite seat in the whole cafe was by the window...'],
];
const cardsFound = (g) => RECIPE_CARDS.filter((c) => g.flag(`recipe_card_${c[2]}`)).length;
RECIPE_CARDS.forEach(([map, spot, dish, name], i) => {
  register('storyProp', `recipe_${i}`, { map, spot, label: 'A recipe card?', when: ['quest:arc_menu=0', `!flag:recipe_card_${dish}`],
    run: (g) => g.run([sfx('page'), ...lines(`|Tucked out of sight: a recipe card in neat looping handwriting. "${name}."`), give('story_recipe_card'), set(`recipe_card_${dish}`), { t: 'set', var: 'recipe_cards', n: 1 },
      call((g2) => { if (g2.learnRecipe) g2.learnRecipe(dish); g2.bus.emit('recipeCardFound', { dish }); g2.toast(`Recipe cards: ${cardsFound(g2)}/12`, 'i_quest'); })]) });
});
quest('arc_menu', {
  name: 'Cafe Kumo\'s Missing Menu', giver: 'mika', desc: 'Mika\'s mother\'s recipe box was lost years ago. Twelve cards are scattered around town.',
  start: { has: { any: ['flag:soc_recipe_hunt', 'friend:mika>=5'] } },
  stages: [
    { text: (g) => `Find the 12 lost recipe cards (${cardsFound(g)}/12)`, hint: 'Ask Mika for clues. Cards sparkle where they hide', done: { has: (g) => cardsFound(g) >= 12 } },
    { text: 'Bring the recipe cards back to Mika', hint: 'Cafe Kumo, on the square' },
  ],
  reward: { flags: ['misa_latte', 'cafe_rank_5'], money: 800 },
});
hook('story_arc_menu_hint', 'mika', ['quest:arc_menu=0', once('menu_hint_day')], (g) => {
  const next = RECIPE_CARDS.find((c) => !g.flag(`recipe_card_${c[2]}`));
  return [markDay('menu_hint_day'), ...lines(`mika|${cardsFound(g)} cards so far! I keep remembering things Mum said...`, `mika/happy|${next ? next[4] : 'I think that\'s all of them!'}`)];
}, 28);
hook('story_arc_menu_party', 'mika', 'quest:arc_menu=1', [
  ...lines('misa/happy|Mika! All twelve. Your mum\'s whole recipe box.', 'mika/surprised|...All of them. Even the star parfait. That was her favourite.', '|Mika holds the cards to her chest, eyes shining.',
    'mika/happy|You know what? The cafe turns thirty this month. We\'re having a party. A proper one. Everyone\'s invited. And you\'re the guest of honour!'),
  fade(1, 0.6), scene('story_party'), fade(0, 0.8),
  ...lines('|Cafe Kumo\'s 30th anniversary. Paper lanterns, twelve old recipes on a brand-new menu, and half the town squeezed between the tables.',
    'mika/happy|And a new drink, for the menu board. Honey, a little cinnamon, steamed milk and a star of cocoa on top. The Misa Latte!', 'misa/surprised|You named a drink after me?!',
    'mika/happy|Kumo-chan insisted. The espresso machine has excellent taste.'),
  fade(1, 0.6), scene(null), fade(0, 0.6), take('story_recipe_card', 12), friend('mika', 150), memory('story_arc_menu'), advance('arc_menu'),
]);

// ================================================================ Side arc B: Pip's Forgotten Satchel
export const LETTERS = [
  ['hana', 'To H., keeper of the light, Lantern Lane', 'From T. W. The handwriting is tiny, perfect, slanted capitals.', 'Ah... his writing. Twenty years, and his writing is exactly the same. Thank you, dear. I\'ll read it when I\'m alone.'],
  ['goro', 'To my grumpy gardener, Lantern Lane', 'Signed "your Fumiko". Pressed inside: a dried sweet pea flower.', '...Fumiko. My wife. She wrote me a letter? ...Give me a minute. Hmph. Pollen. It\'s the pollen.'],
  ['sachiko', 'To Mum, the corner shop by the fountain', 'Written in crayon. "From Kenta, age 8, at summer camp."', 'Oh my goodness. Kenta! From camp! "The food is bad and I miss your melon buns." Oh, I\'m calling him right now!'],
  ['jun', 'To the skipper of the Sayori, berth 4', 'From "a fisherman you towed home in the fog".', 'Ha! The fog of ninety-nine! I towed him ten miles. He says he named his son after me. Well, I\'ll be.'],
  ['kiko', 'To the little miko at the top of the stairs', 'In old brush calligraphy, signed with a fox seal.', 'Gran\'s fox seal... "To my little miko: be serene on duty, and play as many games as you like off it." ...She knew.'],
  ['mika', 'To Mika-chan, age 9, Cafe Kumo', 'From "Mum, on her baking course in the city". Smells faintly of vanilla.', 'Mum wrote to me? "Look after Kumo-chan while I\'m gone." Kumo-chan was... the espresso machine. Even then!'],
  ['fujita', 'To Akane, junior stargazer, Hoshimori High', 'In round friendly handwriting, with a star doodle.', 'From your grandmother. "Little Akane, you have a scientist\'s eyes. Never stop looking up." ...Excuse me. Coffee. I need coffee.'],
  ['ogawa', 'To Daichi, fastest boy in Hoshimori', 'From "Coach Mori". A newspaper clipping is folded inside.', 'MY OLD COACH! "Proud of you, Daichi." I\'M NOT CRYING. THIS IS SWEAT. EMOTIONAL SWEAT.'],
  ['kai', 'To the Tanabe family, by the school', 'A wedding card. "Congratulations, Mr. and Mrs. Tanabe!"', 'My parents\' wedding card? Twenty years late? Ha! Mum is going to lose it. Thanks, Misa!'],
  ['suzu', 'To the Mori bookshop, Lantern Lane (closed)', 'A publisher\'s envelope, addressed to someone who wrote stories.', '...This is to my grandfather. He wanted to be a writer. "We would be pleased to publish your story." He never knew. ...I\'m going to keep writing.'],
];
LETTERS.forEach(([npc, addr, clue], i) => register('item', `story_letter_${i + 1}`, { name: 'Old Letter', desc: `${addr}. ${clue}`, cat: 'key', key: true, price: 0, icon: itemIcon('letter', { c: '#f4e4c1' }) }));
const delivered = (g) => LETTERS.filter((l, i) => g.flag(`letter_${i + 1}_done`)).length;
quest('arc_satchel', {
  name: 'Pip\'s Forgotten Satchel', giver: 'pip', desc: 'Ten letters, undelivered for twenty years. Only nicknames and old addresses to go on.',
  start: { has: { any: ['flag:soc_satchel_found', 'friend:pip>=5'] } },
  stages: [
    { text: (g) => `Deliver the old letters (${delivered(g)}/10)`, hint: 'Read each letter in your bag for clues. Pip has ideas too', done: { has: (g) => delivered(g) >= 10 } },
    { text: 'Tell Pip every letter got home', hint: 'Pip is at the post office or out on his rounds' },
  ],
  reward: { items: { story_stamp_album: 1, story_postie_cap: 1 }, flags: ['honorary_postie'], friend: { pip: 150 } },
});
register('system', 'story_satchel', { init(game) { game.bus.on('questStart', ({ id }) => { if (id === 'arc_satchel') LETTERS.forEach((l, i) => game.give(`story_letter_${i + 1}`, 1, true)); }); } });
LETTERS.forEach(([npc, addr, clue, reply], i) => {
  const n = i + 1;
  hook(`story_letter_${n}`, npc, ['quest:arc_satchel=0', `item:story_letter_${n}`], [
    ...lines(`misa|I think this letter is for you. It\'s from twenty years ago. "${addr}."`, `${npc}/surprised|For me?`, `${npc}/happy|${reply}`),
    take(`story_letter_${n}`), set(`letter_${n}_done`), friend(npc, 60), ...(npc === 'hana' ? [set('satchel_hana_letter')] : []),
    call((g) => g.toast(`Letters delivered: ${delivered(g)}/10`, 'i_mail')),
  ], 35);
});
hook('story_arc_satchel_hint', 'pip', ['quest:arc_satchel=0', once('satchel_hint_day')], (g) => {
  const i = LETTERS.findIndex((l, k) => !g.flag(`letter_${k + 1}_done`)), l = LETTERS[i];
  const who = l ? (get('npc', l[0]) || { name: l[0] }).name : '';
  return [markDay('satchel_hint_day'), ...lines(`pip|${delivered(g)} down! You\'re faster than me, and I have a bike.`, l ? `pip/happy|"${l[1]}"... hmm. You know who that sounds like? ${who}. Maybe!` : 'pip/happy|That\'s all of them!')];
}, 28);
hook('story_arc_satchel_end', 'pip', 'quest:arc_satchel=1', [
  ...lines('misa/happy|Pip! All ten letters delivered. Every single one got home.', 'pip/surprised|ALL TEN?! Twenty years late, but still! That\'s the most heroic postal achievement in Hoshimori history!',
    'pip/happy|Here. My stamp album, twenty years of Hoshimori mail. And this cap. It makes you an honorary postie. Officially! I made the rules myself!'),
  memory('story_arc_satchel'), advance('arc_satchel'),
]);

// ================================================================ Side arc D: Rival Notes
quest('arc_rival', {
  name: 'Rival Notes', giver: 'rina', desc: 'Rina Hoshino has decided you are her rival. Apparently.',
  start: { has: ['flag:chapter_1_done', 'dayn>=12'] },
  stages: [
    { text: 'Rina has challenged you to a quiz duel', hint: 'Talk to Rina at school or the library' },
    { text: (g) => `Study with Rina after school (${Math.min(2, g.flag('rina_study') || 0)}/2)`, hint: 'Rina studies at the library table after 5 PM', done: { has: 'var:rina_study>=2' } },
    { text: 'Accept Rina\'s sleepover invite (Fri or Sat, 3 hearts)', hint: 'Get to 3 hearts with Rina, then talk to her on a Friday or Saturday' },
    { text: 'Wait for the term-final rankings (Spring 26)', hint: 'Rankings go up after finals', done: { has: 'dayn>=26' }, script: 'story_arc_rival_rank' },
  ],
  reward: { items: { story_rival_notes: 1 }, flags: ['perk_rival_notes'], friend: { rina: 100 } },
});
hook('story_arc_rival_duel', 'rina', 'quest:arc_rival=0', [
  emote('rina', 'i_anger'),
  ...lines('rina|Misa Aoki. The midterm results are up. You\'re in the top ten. In your FIRST TERM.', 'rina|I have been top of this class for a year. I don\'t intend to stop. From now on, we are rivals.',
    'misa/surprised|Rivals? I just wanted to pass maths...', 'rina|A quiz duel. Five questions. Right now. Ready? Of course you\'re not. Go!'),
  mg('story_quiz', { set: 'duel', rival: 4 }),
  ...lines('rina|...Hmph. Not bad.', 'rina|Not bad AT ALL. This is going to be a long and glorious rivalry. I\'ll be at the library after school. Studying. Not waiting for you. Studying.'),
  friend('rina', 40), advance('arc_rival'),
], 32);
hook('story_arc_rival_study', 'rina', ['quest:arc_rival=1', 'map:library', once('rina_study_day')], [
  markDay('rina_study_day'),
  ...lines('rina|You came. I\'ve colour-coded the syllabus. Pink is history. Gold is maths. Green is "things Kai will ask us later".', '|An hour of quiet studying passes. Rina explains fractions three different ways until one of them clicks.'),
  { t: 'xp', skill: 'study', n: 25 }, { t: 'time', add: 60 }, { t: 'set', var: 'rina_study', n: 1 }, friend('rina', 40),
  ...lines('rina/happy|...This is more efficient with two people. That\'s the only reason. Same time again?'),
], 32);
hook('story_arc_rival_sleep', 'rina', ['quest:arc_rival=2', 'friend:rina>=3', 'day:fri|sat'], [
  ...lines('rina|Misa. My parents are working nights this weekend. I have snacks for an army and nobody to... I mean. Study sleepover. Tonight. For rival purposes.', 'misa/happy|I\'d love to!'),
  fade(1, 0.6), scene('story_sleepover'), fade(0, 0.8),
  ...lines('|Rina\'s room is spotless, except for a mountain of snacks and a violin case covered in stickers.', 'rina|...Can I tell you something? You can\'t laugh.',
    'rina/sad|I didn\'t want a rival. I wanted a friend. I just didn\'t know how to ask. Rivals have to talk to each other. Friends just... might not.', 'misa/happy|Rina. We\'re both. Rival-friends. Frivals.',
    'rina/happy|...That\'s the worst word I\'ve ever heard. I love it.'),
  fade(1, 0.6), scene(null), fade(0, 0.6), friend('rina', 80), memory('story_arc_rival_sleep'), advance('arc_rival'),
], 32);
script('story_arc_rival_rank', [
  ...lines('|The term-final rankings are pinned up outside the staff room. A crowd jostles around them.', 'misa|Rina, first. And me... third!',
    'rina/happy|THIRD. In your first term. Next term, I expect you in second. Here. My notes. All of them. Colour-coded. Don\'t lose them. Rival\'s orders.'),
  memory('story_arc_rival_rank'),
], 'The rankings');

// ================================================================ Side arc E: Theo's Garage Band
export const BAND_NAMES = ['The Lantern Cats', 'Mochi and the Meteors', 'Low Tide Club', 'Kai Ate My Homework', 'The Paper Stars', 'Hermit Crab Revolution'];
const festivalGig = (g) => (g.world && g.world.map ? g.world.map.id : g.state.map) === 'gym' && g.season === 'autumn' && dateOf(g.day) >= 20 && dateOf(g.day) <= 21;
const lateGig = (g) => (g.world && g.world.map ? g.world.map.id : g.state.map) === 'cafe' && !(g.season === 'autumn' && dateOf(g.day) <= 21) && g.season !== 'summer';
quest('arc_band', {
  name: 'Theo\'s Garage Band', giver: 'theo', desc: 'Theo wants to start a band. You\'re on keys. Apparently.',
  start: { has: { any: ['flag:soc_band_started', ['friend:theo>=4', '!season:spring']] } },
  stages: [
    { text: 'Recruit Kai on drums', hint: 'Talk to Kai' },
    { text: 'Recruit Hina on bass', hint: 'Talk to Hina' },
    { text: 'Pick a band name with Theo', hint: 'Talk to Theo' },
    { text: (g) => `Band practice with Theo (${Math.min(5, g.flag('band_practice') || 0)}/5)`, hint: 'Talk to Theo once a day to practise', done: { has: 'var:band_practice>=5' } },
    { text: 'Play the Culture Festival (school gym, Autumn 20-21)', hint: 'The gym on Autumn 20 or 21. Missed it? Cafe Kumo will host a make-up gig', done: { has: { any: [festivalGig, lateGig] } }, script: 'story_arc_band_gig' },
  ],
  reward: { items: { story_band_poster: 1 }, flags: ['rock_star'], friend: { theo: 100, kai: 60, hina: 60 } },
});
hook('story_arc_band_kai', 'kai', 'quest:arc_band=0', [...lines('misa|Theo\'s starting a band. Want to play drums?', 'kai/happy|DRUMS?! I hit things for a living! I mean, soccer balls. Same thing! I\'m in!'), friend('kai', 30), advance('arc_band')], 32);
hook('story_arc_band_hina', 'hina', 'quest:arc_band=1', [...lines('misa|Hina, we need a bass player. For Theo\'s band.', 'hina/happy|Bass is like a big bug that hums! I\'m in! I\'ll learn! How hard can it be? Don\'t answer that!'), friend('hina', 30), advance('arc_band')], 32);
hook('story_arc_band_name', 'theo', 'quest:arc_band=2', [
  ...lines('misa/happy|Drums: Kai. Bass: Hina. Keys: me. Guitar: you. We\'re a band!', 'theo/happy|...We\'re a band. Okay. We need a name. I made a list. Pick one.'),
  { t: 'choice', prompt: 'Band name', options: BAND_NAMES.map((n) => ({ text: n, steps: [set('band_name', n), ...lines(`theo/happy|"${n}." Yeah. That\'s us.`)] })) },
  advance('arc_band'),
], 32);
hook('story_arc_band_practice', 'theo', ['quest:arc_band=3', once('band_day')], (g) => [
  markDay('band_day'), ...lines('theo|Practice? Kai and Hina are already set up. Let\'s go from the top.'),
  mg('story_band', { song: (g.flag('band_practice') || 0) % 3 }), { t: 'set', var: 'band_practice', n: 1 }, { t: 'time', add: 60 }, friend('theo', 25),
  ...lines(['kai/happy|I only dropped my sticks twice!', 'hina/happy|My fingers hurt! In a good way!', 'theo/happy|...That was actually good. Again tomorrow.'][(g.flag('band_practice') || 0) % 3]),
], 32);
script('story_arc_band_gig', (g) => [
  fade(1, 0.6), scene('story_concert'), fade(0, 0.8),
  ...lines(`|The lights go down. A hand-painted banner unrolls: "${g.flag('band_name') || 'The Lantern Cats'}".`, 'theo/sad|...My hands are shaking.', 'misa/happy|Mine too. Let\'s shake together. One, two, three, four!',
    '|Kai counts them in. Hina\'s bass hums. Theo\'s guitar rings out, clear and bright, and Misa\'s keys carry the melody of the Keeper\'s Song, sped up into something new.',
    '|The crowd sings along by the last chorus.', 'theo/happy|...We did it. We actually did it.', 'kai/happy|ENCORE! Wait, can we ask for our own encore?'),
  fade(1, 0.6), scene(null), fade(0, 0.6), memory('story_arc_band_gig'),
], 'The gig');

features('Epilogues', [
  'Summer epilogue "Keeper\'s Logbook": keep the lamp lit on summer nights, read Hana\'s log and talk it over with her',
  'Autumn epilogue "The Other Lantern": Tobias reveals a tiny music-box lighthouse, and you find its lost key in the clock tower',
  'The music box plays the Keeper\'s Song, and Grandma finally sings all the words',
  'Winter epilogue "Homecoming": the Kujira docks on Winter 27 and Mum and Dad come home',
  'Watch the first sunrise of the new year on Shell Beach with the whole family',
]);
features('Side arcs', [
  'Side arc "Cafe Kumo\'s Missing Menu": find Mika\'s mum\'s 12 lost recipe cards hidden around town',
  'Mika remembers a new clue about where a recipe card is hidden each day you ask',
  'Cafe Kumo\'s 30th anniversary party, where Mika names the Misa Latte after you',
  'Side arc "Pip\'s Forgotten Satchel": 10 letters undelivered for 20 years, addressed only by nickname or old address',
  'Each old letter has a clue in its description, and Pip offers a guess for the next one',
  'Ten heartfelt letter deliveries, from Goro\'s late wife to Ms. Fujita\'s note from Hana',
  'Delivering Tobias\'s old letter to Hana adds a bonus scene at the finale',
  'Pip\'s stamp album and an honorary postie cap for delivering every letter',
  'Side arc "Rival Notes": Rina\'s quiz duel, two study sessions at the library and a sleepover confession',
  'Term-final rankings where Rina hands over her colour-coded Rival\'s Notes',
  'Side arc "Theo\'s Garage Band": recruit Kai on drums and Hina on bass',
  'Band name picker: choose from 6 silly names that appear on the gig banner',
  'Five band practices, then a Culture Festival gig (or a make-up gig at Cafe Kumo if you miss it)',
]);
