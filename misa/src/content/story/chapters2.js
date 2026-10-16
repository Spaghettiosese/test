// Main story, part 2: Chapter 5 "Low Tide" through the Finale "The Starlight Festival", plus the lighthouse
// interactions (lantern_lamp, logbook) and the story's weather (rain for the attic, the storm, a clear festival night).
import { register, get, features } from '../../core/registry.js';
import { check } from '../../core/cond.js';
import { dateOf, weekdayOf, seasonOf } from '../../core/time.js';
import { lines, choice, advance, scene, fade, wait, sfx, emote, place, walk, leave, goto, give, take, set, friend,
  card, memory, clue, page, call, mood, script, hook } from './util.js';
import { quest, chapter } from './chapters.js';
import { storyState } from '../../systems/quests.js';
import { WISHES } from './journal.js';

const mg = (id, opts = {}) => ({ t: 'minigame', id, opts });
const CLASSMATES = ['kai', 'suzu', 'rina', 'theo', 'hina'];

// ================================================================ Chapter 5: Low Tide
chapter(5, {
  name: 'Low Tide', trigger: ['flag:chapter_4_done', { any: ['date:spring-14', ['weekend', 'dayn>=14']] }], on: ['dayStart', 'mapEnter'], open: 'story_ch5_open', art: 'story_prism_deneb',
  onStart: (g) => g.setFlag('cave_open'),
  teaser: 'The lowest tide of spring opens the tidepool cave. Hina says it\'s full of crabs. And maybe a clue.',
  summary: 'At low tide Hina and I explored the tidepool cave and found Grandma\'s star carved in the rock, next to an anchor. Captain Jun admitted Deneb was set in his lucky lure. He traded it for a Moon Bream I caught off the pier at night, with his borrowed lure. I have three prisms!',
});
script('story_ch5_open', [
  card(5, 'Low Tide', 'The lowest tide of spring'),
  { t: 'mail', id: 'story_hina_tide', from: 'Hina', text: 'MISA!!! Lowest tide of the whole spring today!!! The tidepool cave at Shell Beach is OPEN. Crabs!! Anemones!! Meet me there!!!' },
  ...lines('misa|"Riddle three: the third swims with the luckiest man on the water." The sea... and a cave that only opens at low tide.', 'misa/happy|Shell Beach it is.'),
]);
script('story_ch5_cave', [
  place('hina', { dx: 1 }), emote('hina', 'heart'),
  ...lines('hina/happy|You came!! Look, look! Hermit crabs! That one has a bottle cap for a shell! Genius!',
    'misa/happy|This place is amazing. It\'s like a secret room under the sea.', 'hina|Careful, the rocks are slippy. The tide comes back after lunch. We\'ve got time.',
    'hina|Ooh, and there\'s a weird carving deeper in. A star. Old people say it\'s a sailor\'s mark.'),
  friend('hina', 30),
]);
register('storyProp', 'star_mark', { map: 'cave', spot: 'star_mark', label: 'Look at the carved star', when: 'quest:main_ch5=1', script: 'story_ch5_star' });
script('story_ch5_star', [
  place('hina', { dx: -1 }),
  ...lines('|A star is carved deep into the rock, worn smooth by twenty years of tides. Beside it, a little anchor. And initials: "H.A."',
    'misa/surprised|H.A. Hana Aoki! Grandma carved this.', 'hina/surprised|Your grandma was a cave explorer?! Coolest grandma ever.',
    'misa|A star and an anchor. "The luckiest man on the water"... someone with a boat?',
    'hina|An anchor... Captain Jun! He has an anchor tattoo. And he says he\'s the luckiest fisherman in the bay. Like, every day. Loudly.'),
  clue('star_mark'), memory('story_ch5_star'), advance('main_ch5'),
], 'The carved star');
hook('story_ch5_jun', 'jun', 'quest:main_ch5=2', [
  ...lines('jun/happy|Ahoy, little landlubber! Come to buy bait? Hear a tale? I\'ve got a hundred, all true. Mostly.',
    'misa|Captain, I found a star carved in the tidepool cave. With an anchor next to it. Grandma Hana carved it.', 'jun/surprised|...Hana\'s star. You found Hana\'s star.',
    '|The old captain is quiet for a long moment. Then he pulls a battered lure from his coat. A bright prism is set in it, catching the light.',
    'jun|Twenty years I\'ve fished with this. Never lost a catch. Hana gave it to me the week after the storm. "Keep it safe, Jun, until someone comes asking."',
    'jun|Deneb, she called it. I\'d give it to you right now... but a sailor never gives up his luck for nothing. Superstition, you see.',
    'jun/happy|Bring me a Moon Bream. They only bite at night, off the end of the pier. Here, take my silver night lure. Bring it back with the fish!'),
  give('story_moon_lure'), friend('jun', 30), advance('main_ch5'),
]);
register('storyProp', 'pier_night', { map: 'harbour', spot: 'pier_end', label: (g) => (g.check('time>=20:00') ? 'Cast the borrowed lure' : 'The end of the pier'), when: 'quest:main_ch5=3', script: 'story_ch5_fish' });
script('story_ch5_fish', [{ t: 'if', cond: 'time>=20:00',
  then: [...lines('|The harbour is silver under the moon. Misa casts Captain Jun\'s lure far out into the dark water.'), mg('story_nightfish'),
    ...lines('misa/happy|A Moon Bream! Look at that spot on its side, like a little full moon.', 'misa|Captain Jun closes the shop at 5, but he eats at the noodle stand until 9. Or I\'ll find him tomorrow.'),
    give('story_moon_bream'), memory('story_ch5_fish'), advance('main_ch5')],
  else: lines('misa|Moon Bream only bite after dark. I\'ll come back after 8 PM.') }], 'Night fishing');
hook('story_ch5_trade', 'jun', 'quest:main_ch5=4&item:story_moon_bream', [
  emote('jun', 'i_exclaim'),
  ...lines('jun/surprised|A Moon Bream! And a fine one! You\'ve got the touch, little keeper. Hana\'s blood, no doubt.',
    'jun/happy|A deal\'s a deal.', '|He works the prism free of the lure with his thick, careful fingers and presses it into Misa\'s hand.'),
  take('story_moon_bream'), take('story_moon_lure'), give('story_prism_deneb'), clue('deneb'),
  ...lines('jun|You know, the night the lantern broke, I was out on the Sayori. Hana and Tobias shouting in the lamp room, I could hear them from the water.',
    'jun|Never saw two people so stubborn. Never saw two people who cared so much, either. You\'re putting it back together, aren\'t you?', 'misa/happy|I\'m trying.',
    'jun/happy|Then the sea is on your side. Fair winds, keeper.'),
  friend('jun', 40), memory('story_ch5_trade'), advance('main_ch5'),
]);
quest('main_ch5', {
  name: 'Low Tide', chapter: 5, desc: '"The third swims with the luckiest man on the water. He will want a fish that only bites by moonlight."',
  stages: [
    { text: 'Meet Hina in the tidepool cave at Shell Beach', hint: 'The cave is at the end of Shell Beach, past the harbour', done: { on: 'mapEnter', map: 'cave' }, script: 'story_ch5_cave' },
    { text: 'Find the carved star deep in the cave', hint: 'Look at the back of the tidepool cave' },
    { text: 'Ask Captain Jun about the star and the anchor', hint: 'Captain Jun runs Bait and Tackle at the harbour' },
    { text: 'Catch a Moon Bream off the pier (after 8 PM)', hint: 'Go to the end of the harbour pier after 8 PM' },
    { text: 'Bring the Moon Bream to Captain Jun', hint: 'Captain Jun: the shop 9-5, the gull bench until 7, the noodle stand until 9' },
  ],
  reward: { flags: ['boat_dock'] },
});

// ================================================================ Chapter 6: Stars After School
chapter(6, {
  name: 'Stars After School', trigger: ['flag:chapter_5_done', 'dayn>=16', 'school', 'time>=15:30'], on: ['mapEnter', 'hour'], open: 'story_ch6_open', art: 'story_prism_sirius',
  teaser: '"The fourth waits where the young ones look up." The school roof? But the Astronomy Club was shut down years ago.',
  summary: 'Ms. Fujita was one of Grandma\'s junior stargazers! She agreed to revive the Astronomy Club if I found members. My friends joined, the old telescope gave up Sirius, and on our first club night we traced the summer triangle: Vega, Altair and Deneb. Like my prisms.',
});
script('story_ch6_open', [
  card(6, 'Stars After School', 'Where the young ones look up'),
  ...lines('misa|"The fourth waits where the young ones look up. Little Akane always hogged the eyepiece."',
    'misa/surprised|Akane... Ms. Fujita\'s first name is Akane! And "where the young ones look up" must be the school roof. The old telescope!',
    'misa|There used to be an Astronomy Club. I should ask her about it.'),
]);
hook('story_ch6_fujita', 'fujita', 'quest:main_ch6=0', [
  ...lines('misa|Ms. Fujita, did you know my grandma? Hana Aoki? Her journal says "little Akane always hogged the eyepiece".',
    'fujita/surprised|She wrote that? Ha! ...I did. I absolutely did.', 'fujita|Your grandmother ran star nights at the lighthouse for us kids. She\'s the reason I teach science. Don\'t tell her. She\'ll be insufferable.',
    'misa|There was an Astronomy Club here too, right? With a telescope on the roof?', 'fujita|Disbanded before I came. Too few members. The telescope is still up there, locked under a tarp.',
    'fujita/happy|Tell you what. Find three more members, and I\'ll be your adviser. Four is the minimum. Rules are rules. Even fun rules.'),
  advance('main_ch6'),
]);
for (const id of CLASSMATES) {
  const yes = {
    kai: ['kai/happy|Stars? At NIGHT? On the ROOF? With snacks? Let\'s gooo! I\'m in!'],
    suzu: ['suzu/happy|A club about looking at things far away and wondering? That\'s basically a library with a ceiling made of sky. Yes.'],
    rina: ['rina|An Astronomy Club would look excellent on my record. ...And I suppose it would be nice. Fine. Put me down. In pen.'],
    theo: ['theo|Night sky... good for drawing. I\'ll come. I\'ll bring my sketchbook. And maybe my guitar. Quietly.'],
    hina: ['hina/happy|YES! Moths come to the lights at night! I mean, also stars! Stars and moths! I\'m in!!'],
  }[id];
  hook(`story_ch6_join_${id}`, id, ['quest:main_ch6=1', `!flag:club_${id}`, `friend:${id}>=2`], [
    ...lines('misa|I\'m reviving the Astronomy Club. Star nights on the school roof. Would you join?', ...yes),
    set(`club_${id}`), { t: 'set', var: 'club_members', n: 1 }, friend(id, 30), call((g) => g.toast(`Club members: ${Math.min(3, g.flag('club_members') || 0)}/3`, 'i_star')),
  ]);
  hook(`story_ch6_wait_${id}`, id, (g) => g.check(['quest:main_ch6=1', `!flag:club_${id}`, `friend:${id}<2`]) && g.flag(`club_ask_${id}`) !== g.day,
    [call((g) => g.setFlag(`club_ask_${id}`, g.day)),
      ...lines('misa|Um, I\'m starting an Astronomy Club... would you want to join?', `${id}|Oh! Maybe? I don\'t really know you that well yet. Ask me again once we\'ve hung out a bit more?`,
        '|(Friends join once they\'re at 2 hearts. Chat every day and give little gifts!)')], 25);
}
hook('story_ch6_sheet', 'fujita', 'quest:main_ch6=2', [
  ...lines('misa/happy|Ms. Fujita! Four members! Here\'s the sign-up sheet.', 'fujita/happy|Well, well. The Hoshimori High Astronomy Club, back from the dead. I\'ll file it with the office before they can say no.',
    'fujita|Here, the key to the telescope. Go and take a look while it\'s light. And first official club night is tonight, on the roof. Be up there between 7 and 8, the building locks at 8.'),
  set('astro_club'), advance('main_ch6'),
]);
register('storyProp', 'telescope', { map: 'school_roof', spot: 'telescope', label: 'Check the old telescope', when: 'quest:main_ch6=3', script: 'story_ch6_telescope' });
script('story_ch6_telescope', [
  ...lines('|Under a dusty tarp: a brass telescope on a heavy tripod. The tube is dented, the lens cap taped shut.',
    'misa|Something is rattling in the eyepiece...', sfx('pop'),
    '|A prism drops into Misa\'s palm, bright and cold, like a splinter of winter starlight.', 'misa/happy|Sirius! The brightest star in the night sky. Little Akane was looking through you all along.'),
  give('story_prism_sirius'), clue('sirius'), memory('story_ch6_telescope'), advance('main_ch6'),
], 'The old telescope');
script('story_ch6_night', (g) => {
  const members = CLASSMATES.filter((id) => g.flag(`club_${id}`));
  return [
    { t: 'clock', at: '20:30' }, place('fujita', { dx: 2 }), ...members.map((id, i) => place(id, { dx: -1 - i % 2, dy: i > 1 ? 1 : 0 })),
    ...lines('fujita/happy|Welcome to the first meeting of the revived Hoshimori High Astronomy Club! Tonight: the summer triangle, rising early in spring.',
      'fujita|Three bright stars: Vega, Altair and Deneb. Find them, connect the dots, and you\'ve got a triangle the size of the sky.'),
    mg('story_stars'),
    ...lines('misa/happy|Vega, Altair, Deneb... my first three prisms. Grandma named them after these stars.',
      ...(members.includes('kai') ? ['kai/happy|This is the best club. Stars AND it\'s past bedtime.'] : []),
      ...(members.includes('suzu') ? ['suzu|"And the star will cross the bay." I keep thinking about that line. It sounds like a promise.'] : []),
      ...(members.includes('hina') ? ['hina/happy|A moth landed on the telescope! Best night ever!'] : []),
      'fujita|Your grandmother used to say the lantern\'s beam was the stars coming down to say hello. ...Keep going, Misa. Whatever you\'re doing. I think she\'d like it.'),
    ...members.map((id) => friend(id, 20)), friend('fujita', 40), memory('story_ch6_night'),
    page('p6', 'p7'),
  ];
}, 'The first club night');
register('storyProp', 'club_poster', { map: 'school_halls', spot: 'notice_board', dx: 1, spr: 'story_poster', label: 'Astronomy Club poster', when: 'flag:astro_club',
  run: (g) => g.run(lines('|"HOSHIMORI HIGH ASTRONOMY CLUB. Rooftop star nights. Adviser: Ms. Fujita. Bring snacks (Kai)."', 'misa/happy|Someone drew a little lighthouse in the corner. Theo, probably.')) });
const clubText = (g) => `Recruit 3 classmates at 2+ hearts (${Math.min(3, g.flag('club_members') || 0)}/3)`;
quest('main_ch6', {
  name: 'Stars After School', chapter: 6, desc: '"The fourth waits where the young ones look up. Little Akane always hogged the eyepiece."',
  stages: [
    { text: 'Ask Ms. Fujita about the old Astronomy Club', hint: 'Ms. Fujita is in the classroom or staff room on school days' },
    { text: clubText, hint: 'Ask Kai, Suzu, Rina, Theo or Hina. Friends at 2 hearts say yes', done: { has: 'var:club_members>=3' } },
    { text: 'Bring the sign-up sheet to Ms. Fujita', hint: 'Find Ms. Fujita at school' },
    { text: 'Check the old telescope on the school roof', hint: 'The roof stairs are in the school halls' },
    { text: 'First club night: be on the school roof from 7 PM', hint: 'Be on the roof between 7 and 8 PM (the school locks at 8)', done: { has: ['map:school_roof', 'time>=19:00'] }, script: 'story_ch6_night' },
  ],
  reward: { flags: ['star_map_app', 'astro_club'] },
});

// ================================================================ Chapter 7: What the Shrine Remembers
chapter(7, {
  name: 'What the Shrine Remembers', trigger: ['flag:chapter_6_done', 'var:hana_visits>=3'], on: ['dayStart', 'mapEnter'], open: 'story_ch7_open', art: 'story_prism_spica',
  teaser: 'Two riddles at once: a prayer in six pieces, and something sweet that never moves.',
  summary: 'Kiko let me put the shrine\'s ema poem back in order, and Spica was waiting behind the board. Then I made Starlight Mochi from Grandma\'s recipe. One bite and she remembered: building the lens with Mr. Wren in 1985, and "Mika\'s mother\'s sugar jar". Polaris was at the bottom of it. Six prisms. Only the Little Lantern is left.',
});
script('story_ch7_open', [
  card(7, 'What the Shrine Remembers', 'A prayer in six pieces'),
  ...lines('misa|"The fifth is a prayer in six pieces." A prayer... the shrine on Hoshi Hill!',
    'misa|"The sixth is sweet and never moves. Ask whoever keeps the sugar." Hmm. That one I\'ll ask Grandma about.'),
]);
hook('story_ch7_kiko', 'kiko', 'quest:main_ch7=0', [
  ...lines('kiko|Welcome to Hoshi Hill Shrine. Would you like a fortune? Today\'s are mostly "small blessing". The printer is moody.',
    'misa|Actually... my grandma\'s journal says "the fifth is a prayer in six pieces". Does that mean anything to you?',
    'kiko/surprised|...You\'re Hana\'s granddaughter. My grandmother told me someone would come one day.',
    'kiko|The ema board. Six old plaques, each with one line of a poem. Gran shuffled them before she passed, and said "the right order opens the board".',
    'kiko/happy|I tried for years. I\'m much better at video games than poetry. Want to try? The poem starts with the sea, and ends with the bay.'),
  friend('kiko', 30), advance('main_ch7'),
]);
register('storyProp', 'ema', { map: 'shrine', spot: 'ema_board', label: 'Rearrange the old ema plaques', when: 'quest:main_ch7=1', script: 'story_ch7_ema' });
script('story_ch7_ema', [
  mg('story_ema'), sfx('chime'),
  ...lines('|With a soft wooden click, a panel at the back of the board slides open. Inside, wrapped in silk: a pale violet prism.', 'misa/happy|Spica!'),
  give('story_prism_spica'), clue('spica'), place('kiko', { dx: 1 }),
  ...lines('kiko/happy|You did it! Gran would\'ve given you the "great blessing" fortune. ...I\'ll give you one too. I\'ll print it specially.',
    'kiko|There\'s a back path behind the shrine, through the forest. Gran said keepers used it to reach the headland. It\'s yours to use now.'),
  set('shrine_back_path'), friend('kiko', 40), memory('story_ch7_ema'), advance('main_ch7'),
], 'A prayer in six pieces');
hook('story_ch7_hana', 'hana', 'quest:main_ch7=2', [
  ...lines('misa|Grandma, the journal says "the sixth is sweet and never moves. Ask whoever keeps the sugar". Who kept the sugar?',
    'hana|The sugar? Oh, dear. Somebody... somebody with a café? Or a bakery? Or was it a boat?', 'hana/sad|I\'m sorry, Misa. It\'s there, and then it isn\'t. Like a fish under the water.',
    'misa|It\'s okay, Grandma.', '|Misa flips through the Keeper Journal. A page near the back has a recipe, written in big happy letters: Starlight Mochi.',
    'misa|"Share it warm." Grandma, I\'m going to make you something.', 'hana/happy|Will it have sugar? Everything good has sugar.'),
  page('p8'), friend('hana', 20), advance('main_ch7'),
]);
const ING = ['story_sakura_petals', 'story_rice_flour', 'story_sea_salt'];
const ingText = (g) => `Gather Starlight Mochi ingredients (${ING.filter((i) => g.has(i)).length}/3)`;
register('storyProp', 'ing_sakura', { map: 'park', spot: 'sakura_tree', label: 'Gather sakura petals', when: 'quest:main_ch7=3&!item:story_sakura_petals', run: (g) => g.run([...lines('|Pink petals drift down from the big cherry tree. Misa catches a handful in her hat.'), give('story_sakura_petals')]) });
register('storyProp', 'ing_flour', { map: 'mart', spot: 'aisle_1', label: 'Mochi rice flour', when: 'quest:main_ch7=3&!item:story_rice_flour', run: (g) => g.run([...lines('|A paper bag of mochi rice flour, on the bottom shelf.', 'sachiko/happy|For Hana\'s Starlight Mochi? Oh my, take it, take it! On the house, dear!'), give('story_rice_flour'), friend('sachiko', 20)]) });
register('storyProp', 'ing_salt', { map: 'beach', spot: 'rocks', label: 'Scrape a pinch of sea salt', when: 'quest:main_ch7=3&!item:story_sea_salt', run: (g) => g.run([...lines('|White salt crystals crust the sunny rocks. Misa scrapes a pinch into a twist of paper.', 'misa|"For the sea," Grandma wrote.'), give('story_sea_salt')]) });
register('storyProp', 'mochi_kitchen', { map: 'home', spot: 'kitchen', label: 'Make Starlight Mochi', when: 'quest:main_ch7=4', script: 'story_ch7_cook' });
script('story_ch7_cook', [
  ...lines('|Flour, a splash of water, the petals pounded right in. Misa steams the dough and gets out Grandma\'s old wooden mallet.'),
  mg('story_pound'), take('story_sakura_petals'), take('story_rice_flour'), take('story_sea_salt'), give('story_starlight_mochi'),
  ...lines('|Soft, pale pink mochi, dusted with sea salt, each one pressed with a little star.', 'mochi|Mrrp?', 'misa/happy|Not for you, Mochi. These are for Grandma.'),
  { t: 'xp', skill: 'cooking', n: 20 }, memory('story_ch7_cook'), advance('main_ch7'),
], 'Starlight Mochi');
script('story_ch7_flashback', [
  ...lines('|Grandma Hana takes one bite of the Starlight Mochi. She closes her eyes.', 'hana|...Sakura. And the sea. Oh, Misa.'),
  fade(1, 1), scene('story_sepia'), fade(0, 1.2),
  ...lines('|Spring, 1985. The night of the very first Starlight Festival.',
    'hana/happy|Toby! Stop polishing it, it\'s perfect! The whole town is waiting!', 'tobias|Seven prisms, seven angles, Hana. If one is off by a hair, the star will look like a potato.',
    'hana/happy|Then it will be a beautiful potato. Light it with me.', '|Two young keepers turn the great brass key together. Light pours through seven prisms, and a star unfolds across the bay.',
    'tobias/happy|...It worked. Hana, it worked.', 'hana/happy|Of course it did. We made it.'),
  fade(1, 1), scene(null), fade(0, 1),
  ...lines('hana/happy|Toby and I built that lens with our own hands. He was so grumpy. He was so kind.',
    'hana|And the sugar jar! Mika\'s mother, Mrs. Kumo. She kept her sugar in a blue jar on the café counter. I put Polaris in the bottom, under the sugar. It never moves, you see.',
    'misa/happy|Grandma, you remembered!', 'hana/happy|Some things are worth remembering. Now, is there another mochi, or did you only make one?'),
  take('story_starlight_mochi'), clue('flashback', 'polaris'), friend('hana', 60), page('p10'), memory('story_ch7_flashback'), advance('main_ch7'),
], 'Spring, 1985');
hook('story_ch7_mochi', 'hana', 'quest:main_ch7=5', [{ t: 'run', script: 'story_ch7_flashback' }]);
hook('story_ch7_mika', 'mika', 'quest:main_ch7=6', [
  ...lines('misa|Mika, did your mum have a blue sugar jar? Grandma says she hid something in it a long time ago.',
    'mika/surprised|Mum\'s sugar jar? It\'s right here! I\'d never use anything else. Kumo-chan the espresso machine would sulk.',
    '|Mika tips the blue jar out onto a saucer. Under the last of the sugar, something glints.', 'mika/surprised|Oh my gosh. I\'ve been scooping around that for years!',
    'misa/happy|Polaris. The North Star. It never moves.'),
  give('story_prism_polaris'), friend('mika', 40),
  ...lines('mika/happy|Mum used to say the café was the town\'s north star. Everybody finds their way here eventually. Take it, Misa. Light the lantern for all of us.',
    'misa|Six prisms. Only the seventh is left... "the Little Lantern". Grandma kept it close to her heart.'),
  page('p9'), memory('story_ch7_mika'), advance('main_ch7'),
]);
quest('main_ch7', {
  name: 'What the Shrine Remembers', chapter: 7, desc: '"The fifth is a prayer in six pieces." "The sixth is sweet and never moves."',
  stages: [
    { text: 'Ask Kiko about the shrine\'s ema board', hint: 'Kiko is at Hoshi Hill Shrine, up from the square' },
    { text: 'Put the six ema plaques back in the poem\'s order', hint: 'The ema board is at the shrine' },
    { text: 'Ask Grandma who kept the sugar', hint: 'Grandma is at Sunny Pines (9 AM to 6 PM)' },
    { text: ingText, hint: 'Sakura in the park, flour at Sunny Mart, salt on the beach rocks', done: { has: ING } },
    { text: 'Make Starlight Mochi in your kitchen', hint: 'Use the kitchen at home' },
    { text: 'Bring the Starlight Mochi to Grandma', hint: 'Grandma is at Sunny Pines (9 AM to 6 PM)' },
    { text: 'Ask Mika about her mother\'s sugar jar', hint: 'Cafe Kumo, on the square' },
  ],
  reward: { flags: ['starlight_mochi_recipe'] },
});

// ================================================================ Chapter 8: The Storm
chapter(8, {
  name: 'The Storm', trigger: ['flag:chapter_7_done', 'weekday', { any: ['date:spring-23', 'since:7>=2'] }], on: ['dayStart'], open: 'story_ch8_open', art: 'story_prism_little',
  onStart: (g) => { g.state.weather = 'storm'; g.setFlag('noSchool', true); g.setFlag('story_noschool', true); },
  teaser: 'A storm is rolling in from the sea. School is closed. The radio says to stay indoors.',
  summary: 'A storm knocked out the power. When I lit my lantern, the brass button glowed: the Little Lantern was inside it all along! I ran to the lighthouse and found Mr. Wren at the door, soaked through. He told me everything about the night the lens broke. Grandma said, "Toby, bring the festival back." And he will.',
});
script('story_ch8_open', [
  card(8, 'The Storm', 'Spring storm warning'),
  sfx('thunder'),
  ...lines('|The radio crackles: "...storm warning for Hoshimori Bay. Schools are closed. Stay indoors, secure loose objects, and keep a torch handy..."',
    'misa|No school today. The sky is the colour of a bruise.', 'mochi|Mrrrrow...', 'misa|I know, Mochi. I don\'t like it either. I\'ll be home before dark, promise.'),
]);
script('story_ch8_blackout', [
  sfx('thunder'), set('blackout'),
  ...lines('|CRACK. Thunder shakes the windows, and every light in the house goes out at once.', 'misa/surprised|The power! Mochi? Mochi, where are you?', 'mochi|Mrrp.',
    'misa|Okay. Okay. Grandma keeps a lantern by the door...'),
  set('lantern'), sfx('pop'),
  ...lines('|The little oil lantern flickers to life. And in Misa\'s pocket, something answers it: a warm, steady glow.',
    'misa/surprised|The button?!', '|The brass button is shining from the inside. The light catches a seam around its edge. Misa twists it, and it opens like a locket.',
    '|Inside is a tiny prism, glowing like an ember.', 'misa/surprised|The seventh prism. The Little Lantern. "I keep it close to my heart, sewn on my coat."',
    'misa|Mochi... you found it on my first night. You knew.', 'mochi/happy|Purrrr.'),
  take('story_brass_button'), give('story_prism_little'), clue('little'),
  ...lines('|Outside, through the rain, a light bobs along the coast road. Someone is heading for the headland. For the lighthouse.', 'misa|Who would go out there in this? ...I have to go.'),
  memory('story_ch8_blackout'),
], 'The button glows');
script('story_ch8_door', (g) => [
  fade(1, 0.6), goto('lighthouse', 'door', 'up'), scene('story_storm'), fade(0, 0.6),
  ...lines('|Wind howls around the Star Lantern. Rain comes sideways. At the keeper\'s door stands a figure in a long coat, holding a ring of old iron keys.'),
  scene(null), place('tobias', { dx: 1 }),
  ...lines('misa/surprised|Mr. Wren?!', 'tobias/sad|...Misa. Go home. It\'s not safe.', 'misa|Neither are you! What are you doing out here?',
    'tobias/sad|Twenty years ago tonight, near enough, I stood right here and told your grandmother we should wait. That the storm was too strong. That the lens would not take it.',
    'tobias/sad|She said the boats needed the light. We shouted. I said terrible things. She said terrible things. And the lens cracked into seven pieces in front of us.',
    'tobias/sad|She gave the pieces away. I folded paper stars, every spring, like a coward. Hoping someone braver than me would bring them home.',
    ...(g.flag('deduced_little') || g.flag('chapter_7_done') ? ['misa|You wrote the paper stars. I know. I matched your handwriting.', 'tobias|...Of course you did. You are her granddaughter.'] : [])),
  choice('Tell Mr. Wren...',
    ['Comfort him', 'misa|It wasn\'t only your fault. You were both scared, and you both cared. That\'s why it hurt so much.', 'tobias/sad|...You are very like her. She always forgave people faster than they deserved.', set('ch8_response', 'comfort'), friend('tobias', 60)],
    ['Scold him, gently', 'misa|Twenty years of paper stars, and you never once just knocked on her door? Mr. Wren!', 'tobias/surprised|...Hah. Yes. Yes, that is fair. She would have said exactly that. Louder.', set('ch8_response', 'scold'), friend('tobias', 40)],
    ['Stay quiet and stand with him', '|Misa says nothing. She just steps close and holds up the lantern, so that the light falls on both of them.', 'tobias/sad|...Thank you.', set('ch8_response', 'quiet'), friend('tobias', 50)]),
  ...lines('misa|I have all seven prisms now. The Little Lantern was in Grandma\'s button.', 'tobias/surprised|In the button. Of course it was. She never let it out of her sight.',
    '|Misa\'s phone buzzes. A video call. Sunny Pines. Grandma\'s face fills the screen, lit by a candle.',
    'hana|Misa? The nurses say there\'s a storm. Are you warm? Did you eat?', 'misa|Grandma, I\'m at the lighthouse. Mr. Wren is here. Tobias.',
    '|A long silence on the line. The rain drums on.', 'hana/sad|...Toby?', 'tobias/sad|Hana. I am sorry. I have been sorry for twenty years.',
    'hana/happy|You old fool. So have I.', 'hana/happy|Toby... bring the festival back. For the children. For us.', 'tobias/happy|...On the last night of spring. I promise.'),
  sfx('chime'), set('blackout', false), set('lantern', false),
  ...lines('|As if on cue, the town\'s lights flicker back on, one street at a time, all the way down the hill.',
    'tobias|Go home, keeper. Dry your hair. We have a festival to organise, and the committee is going to be insufferable.'),
  set('festival_announced'), set('lighthouse_open'), friend('hana', 40), memory('story_ch8_door'),
], 'At the lighthouse door');
quest('main_ch8', {
  name: 'The Storm', chapter: 8, desc: 'A spring storm, a blackout, and an old friend at the lighthouse door.',
  stages: [
    { text: 'Get home before the storm hits (after 6 PM)', hint: 'Go home and wait out the storm', done: { has: ['map:home', 'time>=18:00'] }, script: 'story_ch8_blackout' },
    { text: 'Follow the light to the Star Lantern on the headland', hint: 'Through the harbour to Shell Beach, then the lighthouse', done: { on: 'mapEnter', map: ['beach', 'lighthouse'] }, script: 'story_ch8_door' },
  ],
  reward: { flags: ['festival_poster'] },
});

// ================================================================ Finale: The Starlight Festival
chapter(9, {
  name: 'The Starlight Festival', trigger: ['flag:chapter_8_done', { any: ['date:spring-28', ['day:sun', 'since:8>=2']] }], on: ['dayStart'], open: 'story_ch9_open', art: 'story_keeper_badge',
  onStart: (g) => { g.state.weather = 'sunny'; },
  teaser: 'The Starlight Festival is back! Tonight, on the last night of spring, we light the Star Lantern.',
  summary: 'The festival came back, stalls and lanterns and everyone in happi coats. Rina wheeled Grandma up to the lighthouse, and I turned the seven prisms until the beams made a star across the bay. Grandma and Mr. Wren shared a cup of tea. I made a wish on a shooting star. I\'m the new Keeper of the Star Lantern.',
});
script('story_ch9_open', [
  card(9, 'The Starlight Festival', 'The last night of spring'),
  { t: 'mail', id: 'story_suzu_festival', from: 'Suzu', text: 'It\'s today. It\'s actually today. I\'m wearing my happi already. It\'s 7 AM. Meet us in the square!' },
  ...lines('misa/happy|The Starlight Festival. Twenty years, and it\'s back.', 'mochi|Mrrrow!', 'misa/happy|Yes, you can come and watch from the window. You found the most important prism of all.'),
]);
script('story_ch9_square', [
  scene('story_festival'), fade(0, 0.6),
  ...lines('|The square is a river of lanterns and laughter. Stalls sell takoyaki, candy apples and paper boats. Everyone is in spring happi.',
    'kai/happy|MISA! Over here! I\'ve eaten four things already! It\'s only the afternoon!', 'hina/happy|There\'s a goldfish scoop! And a beetle-wrestling booth! Okay, it\'s just me with a beetle. But still!',
    'suzu/happy|I\'m writing everything down. Every single detail. This is the last chapter, Misa.', 'rina|I organised the stall rota. You\'re welcome, everyone.',
    'theo|I painted the lantern banners. ...You like them? Cool.'),
  choice('Spend the afternoon at...',
    ['The goldfish scoop with Hina', 'hina/happy|You got one! Name it! Name it something cool!', 'misa/happy|Little Lantern. Lan for short.', friend('hina', 40)],
    ['The shaved ice stand with Kai', 'kai/happy|Brain freeze! Brain freeze! Worth it!', friend('kai', 40)],
    ['Folding lantern boats with Suzu', 'suzu|We\'ll float them out tonight. I wrote a tiny wish inside mine. Don\'t read it. ...Okay, it says "more chapters".', friend('suzu', 40)],
    ['Sketching the crowd with Theo', 'theo/happy|Hold still... there. You, and the lighthouse behind you. I\'ll finish it tonight.', friend('theo', 40)],
    ['The ring toss with Rina', 'rina/happy|Three for three! Did you see that? ...You did? Good. ...You can have the prize. I have plenty of prizes.', friend('rina', 40)]),
  { t: 'clock', at: '17:30' },
  ...lines('|As the sun drops toward the sea, the crowd starts drifting toward the beach and the headland.', 'suzu|It\'s time. Let\'s go to the lighthouse.'),
  scene(null), memory('story_ch9_square'),
], 'Festival day');
script('story_ch9_gather', [
  fade(1, 0.6), goto('lighthouse', 'lamp_room', 'up'), fade(0, 0.6),
  place('hana', { dx: -1 }), place('rina', { dx: -2 }), place('tobias', { dx: 1 }), place('suzu', { dx: 2 }),
  ...lines('|The lamp room at the top of the Star Lantern. Through the glass, the whole bay glitters with paper lanterns.',
    'rina|I wheeled her up the coast road myself. Sunny Pines said absolutely not. I said I\'m the class representative.', 'hana/happy|She is a terror. I adore her.',
    'hana|...Hello, Toby.', 'tobias|Hello, Hana. You look well.', 'hana/happy|I look eighty-two. You look a hundred. Now stop staring at me and give the girl the key.',
    '|Mr. Wren presses a great brass key into Misa\'s hands. The seven prisms sit in their ring around the lamp, waiting.', 'tobias|Seven prisms, seven angles. Off by a hair, and the star will look like a potato.',
    'hana/happy|Then it will be a beautiful potato. Go on, dear. Light it.'),
  memory('story_ch9_gather'),
], 'The lamp room');
script('story_ch9_light', (g) => {
  const resp = g.flag('ch8_response'), wishSteps = (k, ...extra) => [set('wish', k), ...lines(...extra)];
  return [
    mg('story_lens'), sfx('star'), fade(1, 0.8), scene('story_relight'), fade(0, 1.6),
    ...lines('|Light blooms in the lens. It splits seven ways, turns, and folds together into a single great star that sweeps out across the bay.',
      '|Down on the water, hundreds of paper lantern boats bob in its path. On the beach, the whole town cheers.',
      'hana/happy|There it is. There it is, Toby.', 'tobias/happy|...Not a potato.'),
    ...lines('|Grandma Hana reaches for Mr. Wren\'s hand. He takes it.', 'hana|I\'m sorry I was proud.', 'tobias|I\'m sorry I was prouder.', 'hana/happy|Tea, after? You can tell me about your clocks. You can be boring. I\'ll allow it.'),
    ...(g.flag('satchel_hana_letter') ? lines('hana|Misa brought me your letter, Toby. The one you wrote twenty years ago and never sent.', 'tobias/surprised|The post office lost that!', 'hana/happy|And my granddaughter found it. I read it every night. You spelled "lighthouse" wrong.') : []),
    ...(resp === 'comfort' ? lines('tobias|You told me it wasn\'t only my fault, keeper. I didn\'t believe you. I think I do now.') : resp === 'scold' ? lines('tobias|Twenty years of paper stars and never once knocking on her door. You were right to scold me, keeper.') : lines('tobias|You stood with me in the rain and said nothing. It was exactly the right thing to say.')),
    fade(1, 0.8), scene('story_meteor'), fade(0, 1.2),
    ...lines('|Later, on the balcony, the sky begins to fall: a meteor shower, streaking silver over the sea.', 'suzu|Make a wish, Misa. Quick!'),
    { t: 'choice', prompt: 'Wish for...', options: [
      { text: WISHES.mochi[0], steps: wishSteps('mochi', 'misa/happy|For Mochi. A long, happy, sunny-windowsill life.') },
      { text: WISHES.friends[0], steps: wishSteps('friends', 'misa/happy|For my friends. That we stay friends, even when things change.') },
      { text: WISHES.family[0], steps: wishSteps('family', 'misa/happy|For Mum and Dad. Calm seas, and a safe way home.') },
      { text: WISHES.warmth[0], steps: [...wishSteps('warmth', 'misa/happy|For everyone in Hoshimori. That they always have a light to come home to.'), call((g2) => { g2.state.maxEnergy += 20; g2.addEnergy(20); })] },
    ] },
    sfx('phone'), scene('story_call'),
    ...lines('mum/happy|Misa! We can see it! The captain turned the ship around so the whole crew could watch on the satellite feed!',
      'dad/happy|I\'m not crying. It\'s onions. I\'m cutting onions. In the middle of the night.',
      'mum|I grew up under that light, you know. Your dad asked me to marry him under that star beam.', 'misa/happy|Really?!',
      'mum/happy|Really. We\'re so proud of you, Keeper.'),
    fade(1, 1), scene(null), { t: 'credits' }, fade(0, 1),
    give('story_keeper_badge'), set('lantern_lit'), set('keeper_title'),
    ...['story_prism_vega', 'story_prism_altair', 'story_prism_deneb', 'story_prism_sirius', 'story_prism_spica', 'story_prism_polaris', 'story_prism_little'].map((id) => take(id)),
    ...lines('|Misa is now the Keeper of the Star Lantern. Light the lamp on any night and read the old logbook in the lighthouse.'),
    page('p11', 'p12'), friend('hana', 80), friend('tobias', 80), mood(30), memory('story_ch9_light'), advance('main_ch9'),
  ];
}, 'The Star Lantern shines');
quest('main_ch9', {
  name: 'The Starlight Festival', chapter: 9, desc: 'The last night of spring. Light the Star Lantern.',
  stages: [
    { text: 'Enjoy the Starlight Festival in the square', hint: 'Head to the town square', done: { on: 'mapEnter', map: 'town' }, script: 'story_ch9_square' },
    { text: 'Go to the Star Lantern at dusk', hint: 'Through the harbour and Shell Beach to the lighthouse', done: { on: 'mapEnter', map: ['beach', 'lighthouse'], when: 'time>=17:00' }, script: 'story_ch9_gather' },
    { text: 'Light the Star Lantern', hint: 'Use the great lamp in the lamp room', done: { on: 'storyProp', id: 'lamp_fallback' }, script: 'story_ch9_light' },
  ],
  reward: { flags: ['postgame'], money: 1000 },
});

// ================================================================ the lighthouse: lamp and logbook
export const LOG = [
  'Spring 1, year 1. First night as keeper. Toby says I hold the key like a soup ladle. Lamp lit 19:02.',
  'Summer 3. Fog. Rang the bell every ten minutes. The Sayori came in safe. Jun brought fish as thanks. Too many fish.',
  'Summer 20. Matsuri night. The children counted the beam\'s turns. Little Akane got to 400.',
  'Autumn 9. Found a ginger kitten in the oil store. Named it Mikan. It sleeps on the logbook.',
  'Autumn 30. Storm. Lamp held. Toby slept in the chair and snored like a foghorn. Did not tell him.',
  'Winter 2. Snow on the balcony. Wrote a song for the lamp. Toby wrote a better tune for it. Insufferable.',
  'Winter 28. New Year\'s Eve. The whole town on the beach for the first sunrise. Kaori fell asleep on my shoulder.',
  'Spring 13. Rain. Mended the lens cover. Toby says one of the prisms sings when the beam turns. I can\'t hear it.',
  'Spring 28. Starlight Festival. The star crossed the bay. Somebody proposed under it! I cried. Toby pretended not to.',
  'Summer 11. Taught three children to read the tide tables. One of them will be a scientist, I can tell.',
  'Autumn 1. The lamp is twenty years old. So is the friendship. Toby brought cake. He made it himself. It was terrible.',
  'Spring 27. Storm warning for tomorrow. Toby wants to wait. The boats need the light. We will talk in the morning.',
];
function lightLamp(g) {
  if (!g.flag('lantern_lit')) return g.run(lines('misa|The great lamp of the Star Lantern. The prism ring is empty. Seven gaps, waiting.'));
  if (g.flag('lamp_day') === g.day) return g.run(lines('misa/happy|The lamp is lit. The star is sweeping the bay. All\'s well, keeper.'));
  if (!g.check('time>=18:00')) return g.run(lines('misa|It\'s still light out. I\'ll light the lamp after 6 PM.'));
  return g.run([...lines('|Misa turns the great brass key. The seven prisms hum, and the star unfolds across the dark water.'), sfx('chime'),
    call((g2) => { g2.setFlag('lamp_day', g2.day); g2.inc('keeper_nights'); g2.stat('keeperNights'); g2.addMoney(60); g2.addMood(6); g2.bus.emit('lampLit', { n: g2.flag('keeper_nights') }); }),
    ...lines('|(Keeper\'s stipend from the town council: 60 coins a night.)')]);
}
register('interaction', 'lantern_lamp', {
  label: (g) => (g.questActive('main_ch9') && g.quest('main_ch9').stage === 2 ? 'Light the Star Lantern' : g.flag('lantern_lit') ? (g.flag('lamp_day') === g.day ? 'The Star Lantern' : 'Light the lamp') : 'The great lamp'),
  run(g) { if (g.questActive('main_ch9') && g.quest('main_ch9').stage === 2) { g.bus.emit('storyProp', { id: 'lamp_fallback' }); return; } return lightLamp(g); },
});
// If the lamp room has no lantern_lamp object yet, a sparkle at the lamp_room spot does the same job.
const hasLampObject = () => (((get('map', 'lighthouse') || {}).objects) || []).some((o) => o.use === 'lantern_lamp');
register('storyProp', 'lamp_fallback', { map: 'lighthouse', spot: 'lamp_room', dy: -1, label: 'Light the Star Lantern', when: (g) => !hasLampObject() && g.check('quest:main_ch9=2') });
register('storyProp', 'lamp_duty', { map: 'lighthouse', spot: 'lamp_room', dy: -1, label: 'Light the lamp', when: (g) => !hasLampObject() && g.flag('lantern_lit') && g.flag('lamp_day') !== g.day, run: lightLamp });
register('interaction', 'logbook', {
  label: 'Keeper\'s logbook',
  run(g) {
    const n = Math.min(LOG.length, Math.max(1, (g.flag('keeper_nights') || 0) + (g.flag('lantern_lit') ? 1 : 0)));
    if (!g.flag('lantern_lit')) return g.run(lines('|A thick logbook, swollen with sea air. The last entry is twenty years old.', `|"${LOG[LOG.length - 1]}"`, 'misa|...The night before the storm.'));
    const i = (g.state.story.logRead = ((g.state.story.logRead ?? -1) + 1) % n);
    return g.run([...lines(`|Hana\'s log, entry ${i + 1} of ${LOG.length}: "${LOG[i]}"`), call((g2) => { g2.inc('log_reads'); g2.bus.emit('logRead', { i }); }),
      { t: 'if', cond: (g2) => g2.flag('lamp_day') === g2.day && g2.flag('log_wrote') !== g2.day, then: [choice('Write tonight\'s entry?',
        ['"Lamp lit. All boats home."', 'misa|Lamp lit. All boats home. Mochi waiting at the window.', call((g2) => g2.setFlag('log_wrote', g2.day))],
        ['"Clear sky. Counted 12 shooting stars."', 'misa|Clear sky. Counted twelve shooting stars. Made zero wishes. Saving them.', call((g2) => g2.setFlag('log_wrote', g2.day))],
        ['Not tonight', 'misa|Maybe tomorrow.'])] }]);
  },
});

// ================================================================ story weather and school closures
register('system', 'story_weather', {
  init(game) {
    game.bus.on('sleep', () => {
      const s = storyState(game), t = game.day + 1, wd = weekdayOf(t), date = dateOf(t), spring = seasonOf(t) === 'spring';
      if (game.flag('chapter_2_done') && s.started[3] === undefined && wd === 5 && (date >= 13 || !spring)) game.state.tomorrowWeather = 'rain';
      if (game.flag('chapter_7_done') && s.started[8] === undefined && wd < 5 && ((spring && date === 23) || t - (s.doneDay[7] ?? t) >= 2)) game.state.tomorrowWeather = 'storm';
      if (game.flag('chapter_8_done') && s.started[9] === undefined && ((spring && date === 28) || (wd === 6 && t - (s.doneDay[8] ?? t) >= 2))) game.state.tomorrowWeather = 'sunny';
    });
    game.bus.on('dayStart', () => {
      if (game.flag('story_noschool')) { game.setFlag('story_noschool', false); game.setFlag('noSchool', false); }
      if (game.flag('blackout')) { game.setFlag('blackout', false); game.setFlag('lantern', false); }
    });
  },
});

features('Main story', [
  'Chapter 5 "Low Tide": explore the tidepool cave with Hina at the lowest tide of spring and find Hana\'s carved star',
  'Captain Jun lends his night lure: catch a Moon Bream off the pier after 8 PM and trade it for the Deneb prism',
  'Chapter 6 "Stars After School": Ms. Fujita reveals she was one of Hana\'s junior stargazers',
  'Revive the Astronomy Club: recruit any 3 of 5 classmates once they\'re at 2 hearts (each has their own reason to join)',
  'The old rooftop telescope hides the Sirius prism; the first club night traces the summer triangle with whoever joined',
  'An Astronomy Club poster goes up on the school notice board once the club is revived',
  'Chapter 7 "What the Shrine Remembers": Kiko\'s grandmother\'s ema board hides the Spica prism and opens the shrine back path',
  'Cook Starlight Mochi from Hana\'s journal recipe: gather sakura petals, rice flour and sea salt, then pound it in your kitchen',
  'Starlight Mochi brings back Grandma\'s memories and points to Mika\'s mother\'s sugar jar, which holds the Polaris prism',
  'Chapter 8 "The Storm": a forced storm day closes school, a blackout hits, and your lantern makes the brass button glow',
  'The seventh prism, the Little Lantern, was inside the brass button all along',
  'Tobias confesses at the lighthouse door; comfort him, scold him gently or stay quiet, and he remembers your choice at the finale',
  'A video call with Grandma during the storm: "Toby, bring the festival back"',
  'Finale "The Starlight Festival": a festival afternoon with your friends (5 stalls to pick from)',
  'Rina wheels Grandma up to the lamp room, and Hana and Tobias make up after the lantern is relit',
  'Meteor-shower wish: choose one of 4 wishes, each with its own lasting bonus',
  'Mum and Dad watch the relit lantern on a video call from the ship, then the credits roll',
  'Keeper duties after the finale: light the Star Lantern any evening for a nightly stipend',
  'The keeper\'s logbook: read 12 of Hana\'s old log entries and write your own entry on nights you light the lamp',
  'The story days bring their own weather: a rainy weekend for the attic, the storm, and a clear sky on festival night',
]);
