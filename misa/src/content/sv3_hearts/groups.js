// Group hangouts: 11 scripted multi-person scenes plus a generic birthday party for each cast member.
// Plan them from the Bonds phone app (Groups tab) or from the console: __misa.sv3.planGroup('beach').
// A plan puts the guests on the meeting map for a few hours (schedule override); walk in and the scene starts by itself.
// Unlock rule: every guest must have the scene's required hearts. Guests answer "busy" through the hangout availability rules.
import { register, get, features } from '../../core/registry.js';
import { sc, flag, mood, time, giveOr, backdrop, fade, OVERRIDES, clock12, placeName, seasonOf, dateOf } from '../social/util.js';
import { availability } from '../social/hangouts.js';
import { yearOf } from '../../core/time.js';
import { S, nameOf, ch3, rec, CAST } from './core.js';

// ---------- the friendship web: who is who to whom (also drives overheard chats, cross-talk and the Bonds Web tab) ----------
// [a, b, kind, blurb]
export const REL = [
  ['kai', 'rina', 'rivalry', 'Kai and Rina bicker about homework, tests and who got to the cafe first. It is mostly affection.'],
  ['suzu', 'theo', 'shy friends', 'Suzu and Theo share long comfortable silences, one with a book and one with a sketchpad.'],
  ['hina', 'goro', 'garden ties', 'Hina swaps snail facts for Goro\'s compost tips. Neither admits how much they enjoy it.'],
  ['mika', 'sachiko', 'business rivals', 'Cafe Kumo and Sunny Mart argue about vanilla, prices and who has the better gossip.'],
  ['hana', 'goro', 'old friends', 'Hana and Goro have played cards for decades. They both claim to be winning.'],
  ['hana', 'sachiko', 'old friends', 'Sachiko and Hana were thick as thieves in their youth, and still gossip by the hour.'],
  ['kai', 'hina', 'fishing pals', 'Kai and Hina spend weekends on the pier arguing about whether fish can hear.'],
  ['rina', 'suzu', 'frenemies', 'Rina lends Suzu pens and Suzu lends Rina secret mysteries. Neither admits it.'],
  ['tobias', 'goro', 'chess rivals', 'Tobias and Goro have been losing the same chess game for four hours. It is going well.'],
  ['jun', 'tobias', 'old salts', 'Jun runs on tides, Tobias on seconds. They keep each other honest.'],
  ['jun', 'kai', 'mentor', 'Jun is quietly teaching Kai to read the sea. Kai thinks he is learning how to fish.'],
  ['fujita', 'ogawa', 'colleagues', 'Fujita and Ogawa trade science puns and PE puns. The staff room has rules about it.'],
  ['fujita', 'rina', 'mentor', 'Ms. Fujita sees herself in Rina, and nudges her to take a break now and then.'],
  ['theo', 'kai', 'odd couple', 'Theo says four words a day. Kai uses them all up on the first morning.'],
  ['pip', 'kiko', 'game buddies', 'Pip and Kiko compare high scores on Neko Jump. The shrine has a leaderboard. It is on a prayer slip.'],
  ['pip', 'sachiko', 'regulars', 'Pip is Sachiko\'s favourite delivery. Sachiko is Pip\'s favourite source of snacks.'],
  ['mika', 'hana', 'family friends', 'Mika\'s mum and Hana grew up together. Mika treats Hana like an aunt.'],
  ['ogawa', 'goro', 'tomato rivals', 'Ogawa and Goro have an eternal contest over the best tomato. It will be settled at the Harvest Market.'],
  ['kiko', 'jun', 'superstitious', 'Kiko and Jun swap charms, omens and sea fables. They always agree that whistling is a bad idea.'],
  ['hina', 'ogawa', 'garden club', 'Hina and Ogawa run the school garden together, loudly, with a ladybird mascot.'],
  ['suzu', 'fujita', 'bookish', 'Suzu feeds Ms. Fujita novels about comets, and gets science notes in return.'],
  ['mika', 'tobias', 'regulars', 'Tobias has had the same onigiri and tea at Cafe Kumo at twelve sharp for nine years.'],
  ['theo', 'hina', 'art and bugs', 'Hina is Theo\'s favourite subject. Theo is the only one who can draw her bugs correctly.'],
  ['rina', 'mika', 'staff crush', 'Rina studies at Cafe Kumo so she can pretend not to like the strawberry shortcake.'],
];
const KIND_LINE = { rivalry: 'Do not think I forgot, rival.', 'shy friends': 'I... brought something. It is small.', 'garden ties': 'I brought a cutting for your windowsill.', 'business rivals': 'My cake is better than yours. But happy birthday.', 'old friends': 'Another year, another card game I will win.', 'fishing pals': 'I saved the best worm for today.', frenemies: 'I wrapped it neatly. Naturally.', 'chess rivals': 'I am letting you win today. Just today.', 'old salts': 'Fair winds, old friend.', mentor: 'You have come a long way.', colleagues: 'I put a pun on your card.', 'odd couple': 'I have four words ready. Happy. Birthday. To. You.', 'game buddies': 'I beat your high score, but happy birthday anyway.', regulars: 'The usual, plus candles.', 'family friends': 'Mum says happy birthday too.', 'tomato rivals': 'I grew this tomato just for you. It is bigger than yours.', superstitious: 'I brought a lucky charm. Do not whistle.', 'garden club': 'The ladybird sends her regards.', bookish: 'I picked a book that fits you.', 'art and bugs': 'I drew you a card. There is a beetle on it.', 'staff crush': 'I did not make this for you. I just happened to. Happy birthday.' };
export const relOf = (a, b) => REL.find((r) => (r[0] === a && r[1] === b) || (r[0] === b && r[1] === a));

// ---------- the scenes ----------
const mk = (o) => o;
export const GROUPS = [
  mk({ id: 'beach', name: 'Beach Day', map: 'beach', at: 13 * 60, cast: ['kai', 'hina', 'theo', 'suzu'], hearts: 4, spots: [['beach', 'shore'], ['beach', 'towel'], ['beach', 'driftwood'], ['beach', 'rocks']], reward: 'shell_pearl',
    blurb: 'Sandcastles, shells and sunburnt noses.',
    script: () => sc('misa', '@Shell Beach at noon. Warm sand, bright water, a mountain of towels, and four friends who have not stopped talking since the bus.',
      'kai/happy|LAST ONE IN IS A SEA SLUG! ...Oh. Hina is already in. She was in before I said it.', 'hina/happy|Kai! There\'s a crab! He has opinions!',
      'theo/neutral|I brought a sketchbook. And sunscreen. Mostly sunscreen.', 'suzu/neutral|I brought a book. And an umbrella. The book needs the umbrella.',
      ch3('sv3g_beach', 'What does the group do first?',
        ['Build a sandcastle together', '@Theo designs, Hina digs the moat, Kai hauls water, and Suzu writes the royal history on a flag made from a stick.', 'theo/happy|The East Tower leans. It\'s a feature. Historic.', 'kai/happy|Our castle has a MOAT! The sea is jealous!', { t: 'friend', npc: 'theo', n: 20 }, { t: 'friend', npc: 'suzu', n: 20 }, flag('soc3g_beach_castle')],
        ['Race along the shore', '@Kai and Hina take off. Theo walks. Suzu officiates from the umbrella with a clipboard.', 'kai/happy|I WON! ...No wait, Hina stopped to look at a shell. Does that count?', 'hina/happy|It was a RARE shell!', { t: 'friend', npc: 'kai', n: 20 }, { t: 'friend', npc: 'hina', n: 20 }, flag('soc3g_beach_race')],
        ['Hunt for shells and sea glass', '@Everyone fans out along the tideline. Hina narrates. Suzu finds a blue piece of glass and hands it to Theo without a word.', 'theo/surprised|...That is my favourite colour. How did you know?', 'suzu/happy|You draw with it. Every sketch.', { t: 'friend', npc: 'theo', n: 25 }, { t: 'friend', npc: 'suzu', n: 25 }, flag('soc3g_beach_shells')]),
      '@The afternoon tilts toward gold. Kai builds a bonfire the size of a sad teapot. The others laugh and add driftwood.',
      'hina/happy|Best beach day ever. I count it as one of the top seven.', 'kai/happy|What are the other six?', 'hina/happy|Every other time with you two.',
      '@Four voices sing, off-key and warm, while the first stars pick their way through the dusk.',
      mood(20), time(150), { t: 'call', fn: (g) => { for (const id of ['kai', 'hina', 'theo', 'suzu']) g.addFriend(id, 25); } }) }),
  mk({ id: 'sleepover', name: 'Sleepover at Misa\'s', map: 'home', at: 19 * 60, cast: ['suzu', 'rina', 'hina'], hearts: 5, spots: [['home', 'sofa'], ['home', 'kitchen'], ['home', 'tv']], reward: 'furn_plushie_cat',
    blurb: 'Pillow forts, snacks and secrets in the living room.',
    script: () => sc('misa', backdrop(null), '@Mochi watches from the top of the fridge as three sleeping bags unroll across the living room floor.',
      'hina/happy|I brought snacks! And a jar of beetles! ...Don\'t worry, the jar is closed. Mostly.', 'rina/neutral|I brought a study schedule. For tomorrow. In case anyone feels inspired.', 'suzu/happy|I brought three mysteries. Choose your doom.',
      'rina/surprised|Mori, you brought... a haunted lighthouse story? At night? In October?', 'suzu/happy|Yes. And you\'re going to read the ghost\'s part.',
      ch3('sv3g_sleepover', 'What is the plan for the night?',
        ['Ghost stories by torchlight', '@Rina reads the ghost in a trembling voice. Hina screams at every creak. Mochi hisses at nothing in particular.', 'rina/happy|"...and the light went out." ...I am very good at this. Suzu, mark that down.', 'suzu/happy|Marked.', { t: 'friend', npc: 'suzu', n: 20 }, { t: 'friend', npc: 'rina', n: 20 }, flag('soc3g_sleepover_ghosts')],
        ['Pillow fort fight', '@Hina builds a fort. Rina storms it. Suzu defends the keep with a particularly heavy cushion.', 'hina/happy|FOR THE BEETLES!', 'rina/happy|I surrender! ...Never mind, I don\'t!', { t: 'friend', npc: 'hina', n: 25 }, { t: 'friend', npc: 'rina', n: 15 }, flag('soc3g_sleepover_fort')],
        ['Truth or dare, gentle edition', '@Suzu admits she writes about all of you. Rina admits she keeps Misa\'s drawings. Hina admits she named a spider after Rina.', 'rina/surprised|You named a SPIDER after me?', 'hina/happy|She\'s very elegant! She has long legs!', { t: 'friend', npc: 'suzu', n: 20 }, { t: 'friend', npc: 'rina', n: 25 }, flag('soc3g_sleepover_truth')]),
      '@Later, in the glow of the nightlight, three voices whisper one last secret each. Nobody tells anybody else.',
      'suzu/happy|I am glad you invited us. I have never been to a sleepover before.', 'rina/neutral|Neither have I. ...I enjoyed it. This did not happen.', 'hina/happy|Hug pile!',
      '@One by one the laughter fades into sleepy breathing. Mochi hops down and curls up on the nearest sleeping bag.',
      mood(25), time(150), { t: 'call', fn: (g) => { for (const id of ['suzu', 'rina', 'hina']) g.addFriend(id, 30); } }) }),
  mk({ id: 'study', name: 'Study Group', map: 'library', at: 16 * 60, cast: ['suzu', 'rina', 'kai', 'theo'], hearts: 4, spots: [['library', 'table_1'], ['library', 'table_2'], ['library', 'desk'], ['library', 'archive']], reward: 'book_study_guide',
    blurb: 'Exams are coming. Four very different study styles.',
    script: () => sc('misa', '@The library hums with the quiet clatter of pencils. Four friends have claimed the big table by the window.',
      'rina/neutral|The schedule. First, algebra. Then, history. Then a three-minute snack break. Kai, that means you do not eat during algebra.', 'kai/sad|The snack was for my brain.',
      'suzu/neutral|I have made flashcards. They are in a story form. "Once upon a time, there was an isosceles triangle."', 'theo/neutral|...I drew diagrams. They are also kind of portraits.',
      ch3('sv3g_study', 'Who do you help first?',
        ['Help Kai with his maths', '@You use the soccer trick. Kai\'s eyes widen as fractions turn into teams and goals.', 'kai/happy|HALF A TEAM IS FIVE PLAYERS! I\'ve been wasting my life!', 'rina/surprised|He... actually understood.', { t: 'friend', npc: 'kai', n: 30 }, { t: 'friend', npc: 'rina', n: 10 }, flag('soc3g_study_kai')],
        ['Join Rina\'s timetable drill', '@The two of you race through twenty questions. Rina checks your answers with a red pen. Twice.', 'rina/happy|Nineteen out of twenty. The twentieth was a trick question. ...Fine, a very good trick question.', { t: 'friend', npc: 'rina', n: 30 }, flag('soc3g_study_rina')],
        ['Read Suzu\'s story-flashcards aloud', '@You read. The group falls quiet. Even Theo looks up.', 'suzu/happy|It works! I knew it! Stories make facts sticky!', 'theo/happy|The triangle was heroic. I\'m drawing it.', { t: 'friend', npc: 'suzu', n: 25 }, { t: 'friend', npc: 'theo', n: 15 }, flag('soc3g_study_suzu')]),
      '@An hour later the table is a battlefield of notes. Rina checks her watch, nods and slides a bag of snacks into the middle.',
      'rina/neutral|Break time. Three minutes. Kai, you may now eat.', 'kai/happy|THIS IS THE BEST DAY OF MY LIFE.', 'theo/happy|There are crumbs on my sketchbook. It\'s fine. They look like stars.',
      mood(10), { t: 'xp', skill: 'study', n: 30 }, time(120), { t: 'call', fn: (g) => { for (const id of ['suzu', 'rina', 'kai', 'theo']) g.addFriend(id, 20); } }) }),
  mk({ id: 'market', name: 'Harbour Market Trip', map: 'lane', at: 10 * 60, cast: ['sachiko', 'kai', 'hina', 'jun'], hearts: 4, spots: [['lane', 'bus_stop'], ['lane', 'bus_stop'], ['lane', 'bus_stop'], ['harbour', 'market_stall']], reward: 'gift_ship_shell',
    blurb: 'A bus ride to the harbour market with a shopping list and a lot of snacks.',
    script: () => sc('misa', '@The Number 3 bus wheezes up to the stop. Sachiko is already aboard, clutching a shopping list the length of her arm.',
      'sachiko/happy|Sit, dears, sit. Misa, by the window. Kai, do NOT eat the samples before we get there. Hina, the jar stays closed.', 'hina/happy|It\'s a very patient bug.',
      'kai/happy|The window seat has the best view of the sea. I\'m calling it. Window, I mean. I love windows.', fade(1, 0.4),
      { t: 'call', fn: (g) => g.warp('harbour', 23, 7, 'down') }, fade(0, 0.4),
      '@The harbour market is a riot of stalls, flags, steam and shouting. Gulls patrol the crates. Captain Jun waves from behind a stack of fresh fish.',
      'jun/happy|Ahoy, shoppers! Mind the squid. He\'s not for sale. He\'s a friend.', 'sachiko/happy|Jun! You still owe me three coupons from 1998.', 'jun/surprised|...I thought we agreed that was a gift.',
      ch3('sv3g_market', 'What does the group shop for?',
        ['Fresh fish for a harbour feast', '@Jun picks the best mackerel. Sachiko haggles. Kai carries. Hina gives each fish a name.', 'jun/happy|Beauties, every one. Tonight, grilled.', { t: 'friend', npc: 'jun', n: 20 }, { t: 'friend', npc: 'sachiko', n: 15 }, flag('soc3g_market_fish')],
        ['Souvenirs for everyone', '@You choose small things: a shell keyring, a paper fish, a tiny bell. Hina chooses a jar of sea glass.', 'hina/happy|It\'s for all of us. Everyone gets one!', { t: 'friend', npc: 'hina', n: 20 }, { t: 'friend', npc: 'kai', n: 15 }, flag('soc3g_market_souvenirs')],
        ['Street food crawl', '@Takoyaki, yaki-onigiri, a cup of roasted chestnuts. Kai eats like a man who has been starved for years.', 'kai/happy|Best. Market. Ever. Rank: first. Out of one.', { t: 'friend', npc: 'kai', n: 25 }, flag('soc3g_market_food')]),
      'sachiko/happy|Right, dears, back on the bus. We are not missing the 4 o\'clock. Mr. Ishida, kindly stop flirting with the fishmonger.', 'jun/surprised|I wasn\'t! I was inspecting the inventory!',
      '@The bus rattles home, everyone full of fish and noise. Hina falls asleep against the window. Kai tries not to move.',
      mood(18), time(180), { t: 'call', fn: (g) => { for (const id of ['sachiko', 'kai', 'hina', 'jun']) g.addFriend(id, 22); } }) }),
  mk({ id: 'festival', name: 'Festival Prep Committee', map: 'town', at: 16 * 60, cast: ['rina', 'mika', 'sachiko', 'pip'], hearts: 5, spots: [['town', 'stage'], ['town', 'noticeboard'], ['town', 'fountain'], ['town', 'market_1']], reward: 'furn_bunting',
    blurb: 'The committee meets at the stage to plan the next festival.',
    script: () => sc('misa', '@The stage in the town square is cluttered with banners, ribbons and a very large pot of glue. Rina is standing at the front with a clipboard.',
      'rina/neutral|Meeting called to order. Item one: lanterns. Item two: stalls. Item three: who ate the committee biscuits.', 'pip/sad|...I might have had one. Or seven.',
      'mika/happy|Cafe Kumo will do the tea stall! Kumo-chan needs a new outlet. Her ego is enormous.', 'sachiko/surprised|Tea? Dear, the mart has always run the tea stall. For twenty years.',
      'mika/surprised|The mart serves tea in plastic cups. Cafe Kumo uses porcelain.', 'sachiko/sad|Porcelain breaks, dear.',
      ch3('sv3g_festival', 'How do you settle the stall dispute?',
        ['Suggest they share the stall', '@You propose one stall, two menus: Kumo\'s tea and Sunny Mart snacks, side by side.', 'rina/happy|Efficient. Elegant. Merged revenue streams. I approve.', 'mika/happy|Oh! We could trade recipes!', 'sachiko/happy|Fine, dear. But I\'m choosing the biscuits.', { t: 'friend', npc: 'mika', n: 20 }, { t: 'friend', npc: 'sachiko', n: 20 }, flag('soc3g_festival_share')],
        ['Let Rina decide', 'rina/neutral|The stall goes to... whoever can serve fifty cups in ten minutes. A race!', '@Mika and Sachiko pour at superhuman speed. It ends in a tie and a spilled teapot.', { t: 'friend', npc: 'rina', n: 25 }, flag('soc3g_festival_race')],
        ['Hand out lanterns to cool tempers', '@You hang a string of lanterns above the pair. The warm light softens both of them.', 'sachiko/happy|Oh, that is lovely. Fine. Fine, dear.', { t: 'friend', npc: 'sachiko', n: 15 }, { t: 'friend', npc: 'pip', n: 15 }, flag('soc3g_festival_lanterns')]),
      'pip/happy|I can deliver the flyers! Every house! Even the ones I always get lost in! Mostly!', 'rina/neutral|Pip. Take the map. Follow it. Do not improvise.',
      '@By sunset the plan is pinned to the noticeboard, a masterpiece of coloured pens, arrows and a rather fierce sticker.',
      mood(15), time(120), { t: 'call', fn: (g) => { for (const id of ['rina', 'mika', 'sachiko', 'pip']) g.addFriend(id, 22); } }) }),
  mk({ id: 'rainy', name: 'Rainy-Day Cafe', map: 'cafe', at: 13 * 60, cast: ['theo', 'suzu', 'mika', 'fujita'], hearts: 4, spots: [['cafe', 'table_1'], ['cafe', 'table_2'], ['cafe', 'counter'], ['cafe', 'window_seat']], reward: 'drink_matcha_latte',
    blurb: 'A quiet afternoon at Cafe Kumo, with tea and whatever the weather feels like.',
    script: (g) => sc('misa', g.weather === 'rain' || g.weather === 'storm' ? '@Rain taps the cafe windows in a slow patter. Four friends wait inside, steam rising from their cups.' : '@The cafe is warm and gold. Four friends wait at a window table, wishing it were raining so it felt more cosy.',
      'mika/happy|A Misa Latte for the guest of honour! Kumo-chan, do your thing! ...She did a cough. That means yes.', 'fujita/happy|Coffee number two. In my defence, I have a lesson plan to prepare and an uprising of papers to quell.',
      'suzu/neutral|I brought a notebook. Theo, can I... can I read you a paragraph?', 'theo/neutral|...Yes. If I can draw while you read.',
      ch3('sv3g_rainy', 'What does the group do over tea?',
        ['Listen to Suzu\'s story', '@Suzu reads. Theo sketches the scene as it appears: a girl, a lighthouse, a pocket watch.', 'fujita/happy|That is better than half the novels I own.', 'suzu/surprised|...Thank you.', { t: 'friend', npc: 'suzu', n: 25 }, { t: 'friend', npc: 'theo', n: 15 }, flag('soc3g_rainy_story')],
        ['Play cards at the counter', '@Mika deals. Fujita calls bluffs. Theo wins the first round and refuses to say how.', 'mika/happy|I have never lost to a teenager before. I\'m taking this very well.', { t: 'friend', npc: 'mika', n: 20 }, { t: 'friend', npc: 'fujita', n: 15 }, flag('soc3g_rainy_cards')],
        ['Just listen to the rain', '@Nobody speaks for ten minutes. It is the loudest, cosiest quiet you have ever heard.', 'theo/happy|This is the best part of any day.', { t: 'friend', npc: 'theo', n: 25 }, flag('soc3g_rainy_rain')]),
      { t: 'if', cond: 'weather:rain|storm', then: sc('misa', 'fujita/happy|On rainy days the lighthouse beam looks like a long white sentence. Have you noticed?', { t: 'friend', npc: 'fujita', n: 10 }), else: [] },
      'mika/happy|Stay as long as you like. The cafe is yours until closing. And the cake is on the house, but don\'t tell my accountant. She\'s Kumo-chan.',
      mood(18), time(120), { t: 'call', fn: (g2) => { for (const id of ['theo', 'suzu', 'mika', 'fujita']) g2.addFriend(id, 22); } }) }),
  mk({ id: 'camping', name: 'Camping at Sakura Park', map: 'park', at: 19 * 60, cast: ['ogawa', 'goro', 'kai', 'hina'], hearts: 4, spots: [['park', 'lawn'], ['park', 'bench'], ['park', 'pond_edge'], ['park', 'sakura_tree']], reward: 'toy_fest_balloon',
    blurb: 'Tents on the lawn, a campfire and stories under the stars.',
    script: () => sc('misa', '@Dusk over Sakura Park. Three tents, a smoky little campfire and a very large thermos of green tea.',
      'ogawa/happy|AOKI! Welcome to Camp Aoki! Rule one: no complaining. Rule two: no complaining about rule one.', 'goro/neutral|Hmph. I brought my own chair. I do not sleep on the ground. I am seventy-eight.',
      'kai/happy|I brought marshmallows! Hina brought a jar of bugs! We are SET.', 'hina/happy|The bugs are for stories! They are not for eating!',
      ch3('sv3g_camping', 'How do you spend the evening?',
        ['Tell ghost stories', '@Goro tells a story so quiet that Kai holds his breath. Ogawa weeps at the ending. It is a tale about a lost watering can.', 'goro/neutral|...And that is why you always return your tools.', 'kai/surprised|I will NEVER forget a watering can.', { t: 'friend', npc: 'goro', n: 25 }, { t: 'friend', npc: 'kai', n: 15 }, flag('soc3g_camping_ghosts')],
        ['Toast marshmallows', '@Hina toasts five at once. Kai drops three. Ogawa makes a tiny philosophical speech about sugar.', 'ogawa/happy|Life is like a marshmallow! Golden on the outside, mushy and sweet inside!', { t: 'friend', npc: 'ogawa', n: 25 }, { t: 'friend', npc: 'hina', n: 15 }, flag('soc3g_camping_marshmallows')],
        ['Stargaze from the lawn', '@You lie on your backs. Hina counts shooting stars. Goro admits he has never looked up this long in his life.', 'goro/neutral|There are a lot of them. I thought they were fewer.', { t: 'friend', npc: 'goro', n: 20 }, { t: 'friend', npc: 'hina', n: 20 }, flag('soc3g_camping_stars')]),
      '@The fire shrinks to a bed of glowing coals. Ogawa snores in two languages. Goro pretends he does not.',
      'kai/happy|Camp Aoki. Best camp. I\'m giving it five stars.', 'hina/happy|Six! One for each bug!',
      mood(22), time(150), { t: 'call', fn: (g) => { for (const id of ['ogawa', 'goro', 'kai', 'hina']) g.addFriend(id, 25); } }) }),
  mk({ id: 'club', name: 'Astronomy Club Trip', map: 'lighthouse', at: 19 * 60, cast: ['fujita', 'suzu', 'rina', 'kai'], hearts: 5, spots: [['lighthouse', 'balcony'], ['lighthouse', 'lamp_room'], ['lighthouse', 'stairs'], ['lighthouse', 'door']], reward: 'gift_star_chart',
    blurb: 'A night trip up the Star Lantern to watch the sky.',
    script: () => sc('misa', backdrop('nightSky'), '@The Star Lantern glows against a ceiling of stars. Ms. Fujita has set up the club telescope on the balcony and is giving everyone a mug of cocoa.',
      'fujita/happy|Welcome, Astronomy Club. Tonight\'s agenda: Jupiter, two satellites and the fact that Kai has not been told what a nebula is.', 'kai/surprised|It is a cloud! In space! I looked it up!',
      'rina/neutral|I have prepared a star-tracking schedule. For efficiency.', 'suzu/neutral|I have prepared a story about the constellations. For atmosphere.',
      ch3('sv3g_club', 'Who gets the first look through the telescope?',
        ['Kai, the beginner', '@Kai squints. Gasps. "It has STRIPES. Jupiter has STRIPES. Like a bee."', 'kai/happy|I\'m going to remember this forever. Forever and a day.', 'fujita/happy|Every astronomer starts with that exact expression.', { t: 'friend', npc: 'kai', n: 30 }, flag('soc3g_club_kai')],
        ['Rina, the planner', '@Rina studies it with great ceremony. A tiny smile escapes.', 'rina/happy|...It is bigger than the textbook said. Please do not repeat that.', { t: 'friend', npc: 'rina', n: 30 }, flag('soc3g_club_rina')],
        ['Suzu, the storyteller', '@Suzu is silent for a full minute. Then she begins to whisper a tale of the star she sees.', 'fujita/happy|That is science and poetry in one breath. Perfect.', { t: 'friend', npc: 'suzu', n: 30 }, flag('soc3g_club_suzu')]),
      '@A meteor blazes over the water. Four voices gasp at once.', 'fujita/happy|Make a wish, club. Quietly. A good wish needs room.',
      'kai/happy|I wished for ramen.', 'rina/neutral|I wished for the next test to be easy.', 'suzu/happy|I wished for a good ending. To everything.',
      mood(22), { t: 'xp', skill: 'study', n: 30 }, time(120), { t: 'call', fn: (g) => { for (const id of ['fujita', 'suzu', 'rina', 'kai']) g.addFriend(id, 25); } }) }),
  mk({ id: 'pines', name: 'Garden Afternoon at Sunny Pines', map: 'sunny_pines', at: 13 * 60, cast: ['hana', 'goro', 'mika', 'sachiko'], hearts: 5, spots: [['sunny_pines', 'garden_bench'], ['sunny_pines', 'lounge'], ['sunny_pines', 'dining'], ['sunny_pines', 'hana_chair']], reward: 'gift_pressed_flower',
    blurb: 'Tea, cards and old stories with the grown-ups on the garden bench.',
    script: () => sc('misa', '@Sunny Pines in the afternoon. Grandma Hana holds court on the garden bench with a pot of tea and a deck of cards. Three old friends have gathered round.',
      'hana/happy|Misa, my darling! Sit, sit. Mr. Hayashi is losing at cards again.', 'goro/sad|I am not losing. I am being polite.', 'sachiko/happy|Dear, he has been polite for three hours.',
      'mika/happy|I brought the cake! Mum says hello. She says she misses cheating you at cards, Mrs. Aoki.', 'hana/happy|Tell her to come and be cheated in person.',
      ch3('sv3g_pines', 'What do you do at the garden party?',
        ['Deal the cards for a round of hanafuda', '@You deal. Goro grumbles. Hana lays down a perfect hand. Sachiko gasps. Mika claps.', 'hana/happy|Beginner\'s luck? No, dear. Granddaughter\'s luck.', { t: 'friend', npc: 'hana', n: 30 }, { t: 'friend', npc: 'goro', n: 10 }, flag('soc3g_pines_cards')],
        ['Ask them for old stories', '@Hana, Sachiko and Goro take turns. A runaway goat. A summer typhoon. A proposal on a ferry. Mika has heard none of them.', 'mika/surprised|Mum NEVER mentioned the goat.', 'sachiko/happy|Your mum was the goat, dear.', { t: 'friend', npc: 'sachiko', n: 20 }, { t: 'friend', npc: 'mika', n: 20 }, flag('soc3g_pines_stories')],
        ['Help Goro water the flowers', '@You and Goro take the watering can. He mutters instructions. The roses lean toward you like they have been waiting.', 'goro/neutral|...You have a way with them. Do not tell Hana I said so.', 'hana/happy|I heard.', { t: 'friend', npc: 'goro', n: 30 }, flag('soc3g_pines_garden')]),
      '@Late afternoon. Hana dozes, a card still in her hand. Sachiko drapes a blanket over her. Goro quietly refills the teapot.',
      'goro/neutral|She won. As always. I will not say anything to her face.', 'sachiko/happy|Dear, you never do.',
      mood(18), time(150), { t: 'call', fn: (g) => { for (const id of ['hana', 'goro', 'mika', 'sachiko']) g.addFriend(id, 25); } }) }),
  mk({ id: 'fishing', name: 'Fishing Day on the Pier', map: 'harbour', at: 10 * 60, cast: ['jun', 'kai', 'hina', 'tobias'], hearts: 4, spots: [['harbour', 'pier_end'], ['harbour', 'dock'], ['harbour', 'bench'], ['harbour', 'boat']], reward: 'fish_sea_bream',
    blurb: 'Rods, bait and tall tales on the pier.',
    script: () => sc('misa', '@The pier at mid-morning. A row of rods leans against the rail like a sleepy orchestra. Captain Jun hands out bait; Tobias hands out advice, unasked.',
      'tobias/neutral|The tide turns at 10:42. Precisely. Cast at 10:41, and the fish will be on time.', 'jun/happy|Fish don\'t wear watches, Toby.', 'kai/happy|I\'m going to catch the BIGGEST fish. Hina\'s going to catch the WEIRDEST one.', 'hina/happy|The weirdest ones are the best!',
      ch3('sv3g_fishing', 'What is your fishing strategy?',
        ['Follow Jun\'s old-fashioned patience', '@You sit. You wait. Jun hums a shanty. Eventually your line trembles.', 'jun/happy|There you go, little keeper. Slow and soft. The sea takes her time with the good ones.', { t: 'friend', npc: 'jun', n: 30 }, flag('soc3g_fishing_patient')],
        ['Time it with Tobias', '@You cast at exactly 10:41 by his pocket watch. A fat bream takes it before 10:42.', 'tobias/surprised|...Within a second. Remarkable. I will never admit this to Ishida.', 'jun/happy|I heard that, Toby.', { t: 'friend', npc: 'tobias', n: 30 }, flag('soc3g_fishing_clock')],
        ['Bet Kai and Hina on a contest', '@A friendly contest: heaviest catch wins an ice cream. Hina pulls up a boot. Kai pulls up a bigger boot.', 'kai/happy|MY boot is bigger! I win! That\'s how fishing works!', { t: 'friend', npc: 'kai', n: 20 }, { t: 'friend', npc: 'hina', n: 20 }, flag('soc3g_fishing_boots')]),
      '@By noon the bucket holds three fish, two boots and Jun\'s lunchbox, which the gulls are eyeing.',
      'jun/happy|A good day on the water is when nobody goes home hungry. Not even the gulls.',
      mood(16), { t: 'xp', skill: 'fishing', n: 30 }, time(150), { t: 'call', fn: (g) => { for (const id of ['jun', 'kai', 'hina', 'tobias']) g.addFriend(id, 22); } }) }),
  mk({ id: 'karaoke', name: 'Karaoke Night at Cafe Kumo', map: 'cafe', at: 17 * 60 + 30, cast: ['kai', 'pip', 'kiko', 'rina'], hearts: 5, spots: [['cafe', 'karaoke'], ['cafe', 'table_2'], ['cafe', 'table_3'], ['cafe', 'table_4']], reward: 'toy_fest_mask',
    blurb: 'The cafe\'s karaoke corner, with a very small stage and very big feelings.',
    script: () => sc('misa', '@Cafe Kumo after closing. The karaoke machine glows in the corner. Four friends are arguing about who goes first.',
      'kai/happy|I\'M GOING FIRST! I have prepared three songs! They are all about soccer!', 'pip/happy|I\'ve got a postal song! It\'s about stamps!',
      'kiko/neutral|I will sing second. A keeper does not rush. ...Is Neko Jump on the playlist?', 'rina/neutral|I will not be singing. I am here to supervise. And possibly judge.',
      ch3('sv3g_karaoke', 'Whose song do you request?',
        ['Kai\'s soccer anthem', '@Kai belts out a ballad about a goalkeeper with feelings. Pip harmonises. Kiko holds up a lighter app.', 'kai/happy|THANK YOU! I WROTE THE LYRICS ON MY ARM!', { t: 'friend', npc: 'kai', n: 25 }, { t: 'friend', npc: 'pip', n: 10 }, flag('soc3g_karaoke_kai')],
        ['Kiko\'s retro game medley', '@Kiko sings a note-perfect chiptune medley, eyes closed. The whole cafe goes quiet.', 'pip/surprised|Kiko! You\'ve been hiding a VOICE!', 'kiko/happy|The kami gave me one. I just never asked what for.', { t: 'friend', npc: 'kiko', n: 30 }, flag('soc3g_karaoke_kiko')],
        ['Rina, the secret singer', '@You hand Rina the microphone. She takes a long breath and sings, very quietly, in a clear, lovely voice.', 'kai/surprised|...Rina. That\'s really good.', 'rina/surprised|...Say nothing. To anyone.', { t: 'friend', npc: 'rina', n: 35 }, flag('soc3g_karaoke_rina')]),
      '@The set ends with all four of them crammed on the tiny stage, singing the one song everyone knows, terribly.',
      'pip/happy|Same time next month? I\'ll write a verse about parcels!', 'kai/happy|And I\'ll write one about ramen!',
      mood(22), time(120), { t: 'call', fn: (g) => { for (const id of ['kai', 'pip', 'kiko', 'rina']) g.addFriend(id, 25); } }) }),
];
export const groupOf = (id) => GROUPS.find((x) => x.id === id);
export const canGroup = (g, sc0) => sc0.cast.every((id) => g.hearts(id) >= sc0.hearts);
export const missingFor = (g, sc0) => sc0.cast.filter((id) => g.hearts(id) < sc0.hearts);

// ---------- planning ----------
export const plans = (g) => S(g).group.plans;
export function planGroup(g, id) {
  const gr = groupOf(id), s = S(g).group;
  if (!gr) return { ok: false, line: 'No such outing.' };
  if (s.plans.some((p) => !p.done && p.day >= g.day)) return { ok: false, line: 'You already have a group outing planned.' };
  const low = missingFor(g, gr);
  if (low.length) return { ok: false, line: `Not close enough yet: ${low.map(nameOf).join(', ')} need ${gr.hearts} hearts.` };
  const d0 = g.day + (g.minutes <= gr.at - 60 ? 0 : 1);
  for (const day of [d0, d0 + 1, d0 + 2]) {
    if (gr.cast.some((c) => availability(g, c, day, gr.at))) continue;
    s.plans.push({ id, day, at: gr.at, done: false });
    g.stat('groupPlans');
    return { ok: true, line: `${gr.name}: ${day === g.day ? 'today' : day === g.day + 1 ? 'tomorrow' : 'in two days'} at ${clock12(gr.at)}, ${placeName(gr.map)}.`, day };
  }
  return { ok: false, line: 'Somebody is busy with school or work. Try another day (weekends are best).' };
}
export const inWindow = (g, p) => p.day === g.day && g.minutes >= p.at - 30 && g.minutes <= p.at + 150;

OVERRIDES.push((game, id) => {
  const p = S(game).group.plans.find((x) => !x.done && inWindow(game, x));
  if (!p) return undefined;
  const gr = groupOf(p.id), i = gr && gr.cast.indexOf(id);
  if (!gr || i < 0) return undefined;
  const [map, spot] = gr.spots[i];
  return { map, spot, key: 'sv3group' };
});

export function markGroup(g, id) {
  const s = S(g).group;
  s.done[id] = (s.done[id] || 0) + 1; s.last = { id, day: g.day };
  for (const p of s.plans) if (p.id === id && !p.done) p.done = true;
  g.stat('groupHangouts'); g.bus.emit('sv3Group', { id });
}
export function groupSteps(g, id) {
  const gr = groupOf(id);
  const body = gr.script(g);
  const opening = [{ t: 'call', fn: (g2) => markGroup(g2, id) }];
  const tail = [{ t: 'call', fn: (g2) => { giveOr(g2, gr.reward, 150); g2.toast(`${gr.name} complete!`, 'heart'); } }];
  return [...opening, ...body, ...tail];
}
register('script', 'sv3_group_all', { steps: (g) => groupSteps(g, 'beach') });
for (const gr of GROUPS) register('script', 'sv3_group_' + gr.id, { steps: (g) => groupSteps(g, gr.id) });

// ---------- birthday parties (one generic scene that adapts to the guest of honour) ----------
const PARTY_PLACE = { hana: ['sunny_pines', ['dining', 'lounge', 'garden_bench', 'hana_chair']], kiko: ['shrine', ['lookout', 'fortune_stand', 'offering_box', 'steps']], jun: ['harbour', ['noodle_stand', 'pier_end', 'bench', 'dock']], tobias: ['clock_shop', ['counter', 'bench', 'stool']], sachiko: ['mart', ['aisle_1', 'aisle_2', 'register']] };
const PARTY_DEFAULT = ['cafe', ['table_2', 'table_1', 'table_3', 'table_4']];
export const partyPlace = (id) => PARTY_PLACE[id] || PARTY_DEFAULT;
export function bdayOf(g) { return CAST.find((id) => { const b = (get('npc', id) || {}).birthday; return b && b.season === g.season && b.day === dateOf(g.day); }); }
const doneKey = (g, id) => `${id}_y${yearOf(g.day)}`;
export function partyHost(g) {
  const id = bdayOf(g);
  if (!id || g.hearts(id) < 4 || S(g).group.done['bday_' + doneKey(g, id)] || g.minutes < 17 * 60 || g.minutes > 21 * 60 + 30) return null;
  return id;
}
export function partyGuests(g, id) {
  const rels = REL.filter((r) => r[0] === id || r[1] === id).map((r) => (r[0] === id ? r[1] : r[0])).filter((x) => CAST.includes(x) && g.hearts(x) >= 3);
  const rest = CAST.filter((x) => x !== id && !rels.includes(x) && g.hearts(x) >= 3).sort((a, b) => g.friendPts(b) - g.friendPts(a));
  return [...rels, ...rest].slice(0, 2);
}
OVERRIDES.push((game, id) => {
  const host = partyHost(game);
  if (!host) return undefined;
  const [map, spots] = partyPlace(host), who = [host, ...partyGuests(game, host)], i = who.indexOf(id);
  return i < 0 ? undefined : { map, spot: spots[i % spots.length], key: 'sv3party' };
});
const GIFT_PTS = { love: 120, like: 70, neutral: 30 };
export function partySteps(g, id) {
  const d = get('npc', id), guests = partyGuests(g, id), gifts = d.gifts || {}, first = d.name.split(' ')[0];
  const opts = [];
  for (const [kind, list] of [['love', gifts.love || []], ['like', gifts.like || []]]) for (const it of list) if (get('item', it) && opts.length < 3) opts.push([`Give ${get('item', it).name}`, { when: `item:${it}` }, { t: 'take', item: it, n: 1 }, { t: 'friend', npc: id, n: GIFT_PTS[kind] }, `${id}/happy|${kind === 'love' ? 'This is my favourite thing in the world. You remembered!' : 'Oh, this is lovely. Thank you, Misa.'}`, flag(`soc3_party_${id}_${kind}`)]);
  for (const hm of ['gift_handmade_card', 'gift_handmade_scarf', 'gift_handmade_bouquet']) if (get('item', hm) && opts.length < 4) opts.push([`Give ${get('item', hm).name}`, { when: `item:${hm}` }, { t: 'take', item: hm, n: 1 }, { t: 'friend', npc: id, n: 100 }, `${id}/surprised|You made this? By hand? ...I will keep it forever.`, flag(`soc3_party_${id}_handmade`)]);
  opts.push(['A handwritten card', { t: 'friend', npc: id, n: 40 }, `${id}/happy|"Happy birthday, ${first}." In your handwriting. I will pin it on my wall.`, flag(`soc3_party_${id}_card`)]);
  const ret = d.perks && d.perks[6] && d.perks[6].items && d.perks[6].items.find((it) => get('item', it));
  return sc('misa', { t: 'call', fn: (g2) => { S(g2).group.done['bday_' + doneKey(g2, id)] = g2.day; g2.stat('birthdayPartiesHosted'); } },
    `@Today is ${d.name}'s birthday. A banner, a cake and a small crowd are waiting.`,
    `${id}/surprised|Wait. Is this... for me? You all planned this?`,
    ...guests.map((gid, i) => {
      const r = relOf(id, gid), gd = get('npc', gid);
      return `${gid}/happy|Happy birthday, ${first}! ${r && KIND_LINE[r[2]] ? KIND_LINE[r[2]] : gd.name.split(' ')[0] + ' brought a cake. A real one.'}`;
    }),
    '*>heart', `Happy birthday, ${first}! We even lit the candles. Make a wish.`,
    `${id}/happy|A wish... hm. I wished for more days like this one.`,
    ch3('sv3g_party_' + id, 'What do you give?', ...opts),
    `${id}/happy|You three have made this my best birthday yet.`,
    '@Everyone sings, loudly and off-key. The candles flicker. Somebody laughs so hard they hiccup.',
    ret ? { t: 'call', fn: (g2) => { g2.give(ret, 1); } } : { t: 'call', fn: (g2) => g2.addMoney(60) },
    `${id}/happy|And I have a little something for YOU, because the best part of a birthday is giving back.`,
    mood(20), time(90), { t: 'call', fn: (g2) => { for (const gid of guests) g2.addFriend(gid, 15); g2.addFriend(id, 30); } });
}
register('script', 'sv3_party', { steps: (g) => partySteps(g, partyHost(g) || bdayOf(g) || 'kai') });
for (const id of CAST) register('script', 'sv3_party_' + id, { steps: (g) => partySteps(g, id) });

register('system', 'sv3Groups', {
  init(game) {
    game.sv3 = Object.assign(game.sv3 || {}, { planGroup: (id) => planGroup(game, id), groups: GROUPS, runGroup: (id) => game.run(groupSteps(game, id)), runParty: (id) => game.run(partySteps(game, id)) });
    const idle = () => !!(game.world && game.world.map && game.scenes.top === game.world && !game.world.busy);
    const tryRun = () => {
      if (!idle()) return;
      const p = S(game).group.plans.find((x) => !x.done && inWindow(game, x));
      if (p) { const gr = groupOf(p.id); if (gr && game.world.map.id === gr.map) { markGroup(game, p.id); game.run(groupSteps(game, p.id).slice(1)); return; } }
      const host = partyHost(game);
      if (host && game.world.map.id === partyPlace(host)[0]) game.run(partySteps(game, host));
    };
    game.bus.on('mapEnter', () => setTimeout(tryRun, 1200));
    game.bus.on('hour', () => tryRun());
    game.bus.on('dayStart', () => {
      const s = S(game).group;
      s.plans = s.plans.filter((p) => !p.done && p.day >= game.day);
      for (const p of s.plans) if (p.day === game.day) game.toast(`Today: ${groupOf(p.id).name}, ${clock12(p.at)}`, 'i_cal');
      const b = bdayOf(game);
      if (b && game.hearts(b) >= 4 && !s.done['bday_' + doneKey(game, b)]) game.toast(`${nameOf(b)}'s birthday party tonight at ${placeName(partyPlace(b)[0])}!`, 'heart');
    });
  },
});

features('Relationships Deep', [
  'Group hangout: Beach Day with Kai, Hina, Theo and Suzu, with a sandcastle, race or shell hunt',
  'Group hangout: a sleepover at Misa\'s house with Suzu, Rina and Hina, with ghost stories, pillow forts or truth or dare',
  'Group hangout: a library study group with Suzu, Rina, Kai and Theo',
  'Group hangout: a bus trip to the harbour market with Sachiko, Kai, Hina and Captain Jun',
  'Group hangout: the festival prep committee at the town stage with Rina, Mika, Sachiko and Pip',
  'Group hangout: a rainy-day cafe afternoon with Theo, Suzu, Mika and Ms. Fujita',
  'Group hangout: camping at Sakura Park with Mr. Ogawa, Mr. Hayashi, Kai and Hina',
  'Group hangout: an Astronomy Club trip up the Star Lantern with Ms. Fujita, Suzu, Rina and Kai',
  'Group hangout: a garden afternoon at Sunny Pines with Hana, Goro, Mika and Sachiko',
  'Group hangout: fishing day on the pier with Captain Jun, Kai, Hina and Tobias',
  'Group hangout: karaoke night at Cafe Kumo with Kai, Pip, Kiko and Rina',
  'Birthday parties: on each cast member\'s birthday, two friends who know them gather for a party with gift choices that adapt to their tastes, and a keepsake in return',
  'Group outings unlock only when every guest has the required hearts and are planned from the Bonds phone app',
  'Guests cross-talk through a relationship table: rivalries, shy friendships, mentors, old friends and business rivals',
]);
