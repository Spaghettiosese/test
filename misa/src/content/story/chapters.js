// Main story, part 1: Prologue "Boxes and Buttons" through Chapter 4 "Tick, Tock, Tobias".
import { register, get, features } from '../../core/registry.js';
import { lines, L, choice, advance, scene, fade, wait, sfx, emote, place, walk, leave, goto, give, take, set, friend,
  card, memory, clue, page, call, mood, script, hook } from './util.js';
import { storyState } from '../../systems/quests.js';
import { pendingDeduction } from './board.js';

export const quest = (id, def) => register('quest', id, { main: true, ...def });
export const chapter = (n, def) => register('chapter', `ch${n}`, { n, quest: `main_ch${n}`, ...def });
const met = (npc) => call((g) => { if (get('npc', npc)) g.state.seen['met:' + npc] ||= g.day; });
const mg = (id, opts = {}) => ({ t: 'minigame', id, opts });

// ================================================================ Prologue: Boxes and Buttons
chapter(0, {
  name: 'Boxes and Buttons', trigger: null, open: 'story_ch0_arrive', art: 'story_brass_button',
  teaser: 'I moved into Grandma Hana\'s little house on Lantern Lane today, with Mochi and far too many boxes.',
  summary: 'I moved into Grandma\'s house with Mochi. Pip the postie helped with the boxes, I met grumpy Mr. Hayashi next door, and Mochi brought me a brass button with a star on it. Mum and Dad called from the ship. I miss them already. But the house is warm.',
});
script('story_ch0_arrive', [
  { t: 'card', n: 0, title: 'Boxes and Buttons', sub: 'Spring 1. The day before the new school term.' },
  scene('story_bus'), fade(0, 0.8), wait(1.6),
  ...lines('|Hoshimori Bay. A little seaside town with a shrine on the hill, a harbour full of gulls, and a lighthouse that hasn\'t shone in twenty years.',
    '|Misa Aoki, fifteen, steps off the morning bus with a backpack, a cat carrier, and a head full of nerves.',
    'mochi|Mrrrow.', 'misa/happy|I know, I know. We\'re here, Mochi. This is where Grandma lived.',
    'misa|Mum and Dad are on the research ship for a whole year. So it\'s just you and me now. And Grandma\'s house.',
    'misa/neutral|"Keep the house warm and the cat fed," she said. I can do that. Probably.'),
  fade(1, 0.6), scene(null), goto('lane', 'bus_stop', 'down'), place('pip', { dx: 1, dy: 0 }), fade(0, 0.6),
  emote('pip', 'i_exclaim'),
  ...lines('pip/happy|Hey hey! You must be Misa! Pip Nakamura, Hoshimori postie, at your service!',
    'pip/happy|Your boxes came on yesterday\'s van. I took the liberty of wheeling them up to your grandma\'s porch. Three of them! Heavy ones!',
    'misa/happy|Thank you so much! You didn\'t have to do that.',
    'pip/happy|Course I did! Hana used to give me hot barley tea every winter. Least I can do for her granddaughter.',
    'pip|Her house is right at the end of Lantern Lane. Through the gate, can\'t miss it. Holler if you need anything delivered!'),
  met('pip'), friend('pip', 20), leave('pip'), wait(0.6),
  fade(1, 0.6), goto('home', 'door_inside', 'up'), fade(0, 0.6),
  ...lines('|Grandma Hana\'s little house. It smells of tatami, old books and lavender.',
    'misa|It\'s just like I remember. Smaller, though. Or maybe I got bigger.',
    'mochi|Mrrp?', 'misa/happy|Go on, explore. It\'s your house too now.',
    '|Mochi trots off, tail high, to inspect every corner.',
    'misa|Right. Boxes first. One in the kitchen, one by the sofa, one by my desk.'),
  memory('story_ch0_arrive'),
], 'Arriving in Hoshimori');

const BOX = { box_a: ['kitchen', 'unpacked_a'], box_b: ['sofa', 'unpacked_b'], box_c: ['desk', 'unpacked_c'] };
const BOX_TEXT = {
  box_a: lines('|Mugs, Dad\'s spare frying pan, and a jar of his "emergency curry spice".', 'misa/happy|A note on the jar: "For cold nights. Two spoons, not three. Love, Dad." Ha.'),
  box_b: lines('|A framed photo of Mum, Dad and Misa on the ship\'s deck, squinting into the sun.', 'misa|I\'ll put this on the shelf, where I can see it from the sofa.', '|There\'s a small cardboard box too, for decorating. You can rearrange furniture any time from the decor box.'),
  box_c: lines('|Schoolbooks, a new uniform still in its bag, and Mochi\'s favourite feather toy.', 'mochi/happy|Mrrrow!!', 'misa/happy|Yes, yes, it\'s yours. Here.'),
};
for (const [id, [spot, flag]] of Object.entries(BOX)) {
  register('storyProp', id, { map: 'home', spot, spr: 'story_box', label: 'Unpack the box', when: `quest:main_ch0=0&!flag:${flag}`,
    run: (g) => g.run([sfx('fold'), ...BOX_TEXT[id], set(flag), { t: 'xp', skill: 'homemaking', n: 3 }]) });
}
const unpacked = (g) => ['a', 'b', 'c'].filter((k) => g.flag('unpacked_' + k)).length;

script('story_ch0_button', [
  ...lines('|Evening settles over Lantern Lane. The windows go gold, then blue.', 'misa/sleepy|Long day. Good day, though. I think.'),
  place('mochi', { dx: 1 }), sfx('meow'), emote('mochi', 'i_exclaim'),
  ...lines('mochi|Mrrp! Mrrrp!', '|Mochi drops something at Misa\'s feet with a small, proud clink.',
    'misa/surprised|What have you got there? A button?',
    '|A brass button, dull with age. A tiny star is engraved in its centre.',
    'misa|Where did you even find this? It feels... warm. Like it\'s been in someone\'s pocket.',
    'mochi/happy|Purrrr.', 'misa/happy|Thank you, Mochi. I\'ll keep it safe.'),
  give('story_brass_button'), clue('brass_button'), sfx('phone'),
  ...lines('|Misa\'s phone buzzes. A video call from the research ship Kujira!'),
  scene('story_call'), fade(0, 0.5),
  ...lines('mum/happy|There she is! How\'s the house? Is Mochi settling in? Did you eat?',
    'dad/happy|Did you find my curry spice? Two spoons, not three. Three is for professionals.',
    'misa/happy|The house is perfect. Mochi already owns it. And Mochi found this button...'),
  choice('Tell them about...', ['The button', 'misa|It has a little star on it. Mochi was so proud.', 'mum/surprised|A star button? Grandma had a coat with buttons like that, from her lighthouse days.', 'mum|She never told me much about those years. Maybe you could ask her.'],
    ['Feeling nervous about school', 'misa/sad|School starts tomorrow. What if nobody likes me?', 'dad/happy|Then they need their eyes checked. You\'re brilliant.', 'mum/happy|Just be yourself, sweetheart. And sit next to someone who looks hungry. Hungry people are always friendly.'],
    ['How the ship is', 'misa|How\'s the ship? Seen any whales?', 'mum/happy|Three humpbacks this morning! I\'ll send you photos.', 'dad|And I invented a new soup. The crew call it "the incident". I call it brave.']),
  ...lines('mum/happy|We love you. Call us any time. Give Mochi a scratch from us.', 'dad/happy|And Misa? Lights out by eleven. Captain\'s orders.'),
  fade(1, 0.5), scene(null), fade(0, 0.5),
  ...lines('misa/happy|Okay. Big day tomorrow. Bed.'), memory('story_ch0_button'),
], 'The brass button');

quest('main_ch0', {
  name: 'Boxes and Buttons', chapter: 0, desc: 'Settle into Grandma Hana\'s house on Lantern Lane with Mochi.',
  stages: [
    { text: (g) => `Unpack your boxes (${unpacked(g)}/3)`, hint: 'The boxes are in the kitchen, by the sofa and by your desk', done: { has: 'flag:unpacked_a&flag:unpacked_b&flag:unpacked_c' },
      script: lines('misa/happy|All unpacked! It already feels more like home.', 'mochi|Mrrrow...', 'misa|...and someone is staring at her empty bowl. Subtle, Mochi.') },
    { text: 'Feed Mochi (her bowl is in the kitchen)', hint: 'Use Mochi\'s bowl in the kitchen', done: { has: (g) => g.state.mochi.fedDay === g.day },
      script: lines('misa/happy|There. A happy cat is a quiet cat.', '|Home tasks like dishes and laundry pop up every day. Mum sends a little allowance for each one.', 'misa|Now, let\'s see the neighbourhood. The front door is in the sunroom.') },
    { text: 'Step outside and explore Lantern Lane', hint: 'Go through the yard gate to Lantern Lane', done: { on: 'mapEnter', map: 'lane' },
      script: [place('goro', { dx: 2 }), emote('goro', 'i_question'),
        ...lines('goro|Hmph. So you\'re Hana\'s granddaughter. Goro Hayashi. Next door. That\'s my garden. Don\'t let the cat dig in it.',
          'misa/happy|Nice to meet you, Mr. Hayashi! Your vegetables look amazing.',
          'goro|...They are amazing. Hmph. Your grandmother grew terrible radishes. Tell her I said so. She\'ll laugh.'), met('goro'), friend('goro', 15), leave('goro'),
        ...lines('misa|The lane leads to town and the park. I should be home by evening, though. First night and all.')] },
    { text: 'Head home for the evening (after 5 PM)', hint: 'Go home after 5 PM. Relaxing on the sofa passes the time', done: { has: ['map:home', 'time>=17:00'] }, script: 'story_ch0_button' },
    { text: 'Get some sleep. School starts tomorrow!', hint: 'Sleep in your bed', done: { on: 'sleep' } },
  ],
  reward: { flags: ['phone_calls'] },
});

// ================================================================ Chapter 1: New Girl in 2-B
chapter(1, {
  name: 'New Girl in 2-B', trigger: 'dayn>=2', on: ['dayStart', 'mapEnter'], open: 'story_ch1_open', art: 'i_school',
  teaser: 'My first day at Hoshimori High. Class 2-B. Please let me sit next to someone nice.',
  summary: 'First day in class 2-B! Ms. Fujita sat me next to Kai, who is loud and always hungry. After school Kai and Hina showed me the square and the dark lighthouse on the headland. "It\'ll shine again when the stars come home," they said. I wonder what that means.',
});
script('story_ch1_open', [
  card(1, 'New Girl in 2-B', 'Spring 2'),
  ...lines('misa|New uniform. New school. New everything.', 'mochi|Mrrp.', 'misa/happy|Wish me luck, Mochi.',
    '|Hoshimori High is north of the town square: out through the lane, across the square, and up the hill road.'),
]);
script('story_ch1_homeroom', [
  place('fujita', { spot: 'teacher' }), place('kai', { spot: 'desk_kai' }), place('suzu', { spot: 'desk_suzu' }), place('rina', { spot: 'desk_rina' }), place('theo', { spot: 'desk_theo' }), place('hina', { spot: 'desk_hina' }),
  sfx('schoolbell'),
  ...lines('fujita/happy|Settle down, settle down! Coffee is kicking in, so I\'m legally a teacher now.',
    'fujita|Class 2-B, this is Misa Aoki. She\'s just moved here from the city. Misa, say hello.'),
  choice('Introduce yourself', ['"Hi! I like cats and cooking."', 'misa/happy|Hi! I\'m Misa. I like cats and cooking. Mostly cats.', 'hina/happy|CATS! Do you have a cat? What colour? Does it eat bugs?', set('intro_style', 'cats')],
    ['"I\'m Misa. Please be kind to me."', 'misa|I\'m Misa Aoki. I\'m a bit nervous. Please be kind to me.', 'kai/happy|Don\'t worry, we\'re super nice! Except Rina. Ow! She threw a pencil!', set('intro_style', 'shy')],
    ['"I live in my grandma\'s house now."', 'misa|I\'m Misa. I live in Hana Aoki\'s house, on Lantern Lane. She\'s my grandma.', 'fujita/surprised|Hana Aoki? ...Well. Small world. Welcome, Misa.', set('intro_style', 'hana')]),
  ...lines('fujita|You can sit by the window, next to Kai. Kai, no snacks during maths.', 'kai/happy|No promises!',
    'rina|I\'m Rina Hoshino, class representative. If you need anything, ask me. Or better yet, don\'t need anything.',
    'suzu|...Hi. Suzu. I\'m on the library committee. I like your bag.',
    'theo|Theo. Hey.',
    'fujita/happy|And now, a pop quiz! Don\'t panic, it\'s just to see where everyone is. Science, my favourite flavour.'),
  mg('story_quiz', { set: 'intro' }),
  ...lines('fujita/happy|Not bad at all! Now off to lunch, all of you.', '|Lunch break. Everyone scatters to their favourite spots.'),
  choice('Eat lunch with...', ['Kai, on the rooftop', 'kai/happy|You came! Want half my curry bread? Okay, a third. Okay, a bite.', friend('kai', 30), set('lunch_with', 'kai')],
    ['Suzu, in the library', 'suzu|Oh. You came to the library. Most people don\'t. ...You can sit here. I\'m reading a mystery. It\'s good.', friend('suzu', 30), set('lunch_with', 'suzu')],
    ['Hina, in the school garden', 'hina/happy|Look look look, a ladybird with SEVEN spots! That\'s the lucky kind! You\'re lucky now!', friend('hina', 30), set('lunch_with', 'hina')],
    ['Theo, in the art room', 'theo|...You can stay. I don\'t mind. I\'m drawing the harbour. It\'s not good yet.', friend('theo', 30), set('lunch_with', 'theo')],
    ['Rina, in the student council room', 'rina/surprised|You want to eat with me? ...Fine. Sit up straight. Do you want a strawberry? I have too many.', friend('rina', 30), set('lunch_with', 'rina')]),
  { t: 'clock', at: '15:30' }, sfx('schoolbell'),
  ...lines('|The afternoon passes in a blur of equations and chalk dust. The bell rings for the end of the day.',
    'kai/happy|Hey, new girl! Hina and I are walking through the square. Come on, we\'ll show you around!', 'misa/happy|I\'d love that! I\'ll meet you at the gate.'),
  memory('story_ch1_homeroom'),
], 'First day in 2-B');
script('story_ch1_walk', [
  place('kai', { dx: 1 }), place('hina', { dx: -1 }),
  ...lines('hina/happy|There she is! Okay, tour time. Hoshimori Bay, the best town in the whole world. Probably.', 'kai/happy|Let\'s gooo!'),
  fade(1, 0.6), goto('town', 'fountain', 'up'), place('kai', { dx: 1 }), place('hina', { dx: -1 }), fade(0, 0.6),
  ...lines('kai|This is the square. Ramen cart at night, Sunny Mart for snacks, Cafe Kumo for fancy drinks.',
    'hina|And the noticeboard! People post requests on it. Lost cats. Lost umbrellas. Lost Kai.', 'kai|That was ONE time.',
    'hina/happy|Oh, and from up here you can see the Star Lantern! Look, on the headland past the beach.'),
  scene('story_bay_dark'), fade(0, 0.5),
  ...lines('misa|That\'s a lighthouse? It\'s so dark.', 'kai|It\'s been dark since before we were born. Twenty years, my mum says.',
    'hina|There used to be a festival. The Starlight Festival! On the last night of spring the lantern made a star-shaped beam across the whole bay.',
    'kai|They say it\'ll shine again when the stars come home.', 'misa|When the stars come home... what does that mean?',
    'kai/happy|No idea! Sounds cool though.', 'hina/happy|Grown-ups get all quiet when you ask. It\'s a mystery!'),
  scene(null),
  ...lines('kai/happy|Anyway. I\'m starving. See you tomorrow, Misa!', 'hina/happy|Bye! Explore everything! Especially the park, it has the best beetles!'),
  leave('kai'), leave('hina'), friend('kai', 20), friend('hina', 20), set('town_open'), memory('story_ch1_walk'),
], 'The dark lighthouse');

const placesText = (g) => `Explore town: visit 4 places (${Math.min(4, g.check('places>=4') ? 4 : ['cafe', 'mart', 'library', 'post_office', 'clock_shop', 'shotengai', 'park', 'harbour', 'beach', 'shrine', 'sunny_pines', 'school_grounds'].filter((m) => (g.state.story.visited || {})[m]).length)}/4)`;
quest('main_ch1', {
  name: 'New Girl in 2-B', chapter: 1, desc: 'Your first day at Hoshimori High, class 2-B.',
  stages: [
    { text: 'Walk to Hoshimori High (lane, square, then north)', hint: 'The school is north of the town square', done: { on: 'mapEnter', map: 'school_grounds' },
      script: [place('ogawa', { dx: 2 }), ...lines('ogawa/happy|GOOD MORNING! You must be the new student! I\'m Mr. Ogawa, PE and the school garden!', 'ogawa|Class 2-B is in the main building. Through the doors, then find the classroom. Off you go, you\'ve got this!'), met('ogawa')] },
    { text: 'Find classroom 2-B (school days)', hint: 'Enter the main building, then the classroom, on a school day', done: { on: 'mapEnter', map: 'classroom', when: 'school' }, script: 'story_ch1_homeroom' },
    { text: 'Meet Kai and Hina outside the school', hint: 'Walk out to the school grounds', done: { on: 'mapEnter', map: 'school_grounds' }, script: 'story_ch1_walk' },
    { text: placesText, hint: 'Try the cafe, Sunny Mart, the library, the park or the harbour', done: { has: 'places>=4' },
      script: lines('misa/happy|I\'m starting to find my way around. Hoshimori is small, but there\'s so much in it.') },
  ],
  reward: { flags: ['map_app'], friend: { fujita: 20 } },
});

// ================================================================ Chapter 2: The Paper Star
chapter(2, {
  name: 'The Paper Star', trigger: ['dayn>=4', 'time>=15:30', 'map:town', 'places>=4'], on: ['mapEnter'], open: 'story_ch2_open', art: 'story_paper_star',
  teaser: 'Someone pinned a folded paper star with a riddle to the noticeboard. Seven lights, seven hearts...',
  summary: 'A paper star on the noticeboard: "Seven lights went home to seven hearts. The first sleeps where the cat keeps watch." Grandma hummed a song and said "under the cat, dear". In the library archive, Suzu and I found it: the lantern lens was damaged in a storm twenty years ago. Suzu gave me her number. We\'re partners now!',
});
script('story_ch2_open', [
  card(2, 'The Paper Star', 'Something new on the noticeboard'),
  ...lines('|Among the lost umbrellas and lesson flyers, something on the noticeboard catches the afternoon light.',
    'misa|A paper star? Folded so neatly. There\'s writing inside.'),
  sfx('page'), give('story_paper_star'),
  ...lines('|"Seven lights went home to seven hearts. The first sleeps where the cat keeps watch."',
    'misa|Seven lights... like the stars coming home? Who would pin this here?',
    'misa|Grandma has lived here her whole life. If anyone knows, she does.',
    '|Grandma Hana lives at Sunny Pines now, past Sakura Park. Visiting hours are 9 AM to 6 PM.'),
  clue('paper_star'), memory('story_ch2_open'),
], 'The paper star');
register('boardNote', 'story_paper_star', { title: 'A paper star', when: 'chapter>=2', text: '"Seven lights went home to seven hearts. The first sleeps where the cat keeps watch." No name. Folded with perfect, careful creases.' });

script('story_ch2_hana', [
  emote('hana', 'heart'),
  ...lines('hana/happy|Misa! My little Misa! Look how tall you are. Have you eaten? You look like you haven\'t eaten.',
    'misa/happy|I\'ve eaten, Grandma. Mochi says hello. She\'s already taken over your sofa.',
    'hana/happy|Good. Somebody should.', 'misa|Grandma... I found this on the noticeboard. Do you know what it means?',
    '|Grandma Hana looks at the paper star for a long time. Then she starts to hum, very softly.',
    '|A slow, rolling tune, like waves under a boat.', 'misa|That\'s pretty. What song is that?',
    'hana|Hmm? Oh, an old one. I forget the words. I forget lots of things these days, dear.',
    'hana|Under the cat, dear. Always under the cat.', 'misa/surprised|Under the cat? What cat?',
    'hana/happy|Did you bring biscuits? You should always bring biscuits.'),
  clue('grandma_hint'), friend('hana', 40), memory('story_ch2_hana'),
  ...lines('misa|"Under the cat"... and the paper star said "where the cat keeps watch". I need to know more about the lighthouse.',
    'misa|The library might have old newspapers.'),
  advance('main_ch2'),
], 'Grandma\'s song');
hook('story_ch2_hana', 'hana', 'quest:main_ch2=0', () => [{ t: 'run', script: 'story_ch2_hana' }]);

register('storyProp', 'archive', { map: 'library', spot: 'archive', label: 'Search the newspaper archive', when: 'quest:main_ch2=1', script: 'story_ch2_archive' });
script('story_ch2_archive', [
  ...lines('misa|The newspaper archive. All these spools of film... where do I even start?'),
  place('suzu', { dx: 1 }), emote('suzu', 'i_exclaim'),
  ...lines('suzu/surprised|You\'re using the microfiche? Nobody uses the microfiche.', 'misa|I\'m looking for anything about the old lighthouse. When it went dark.',
    'suzu|...That\'s a mystery. A real one.', 'suzu/happy|Move over. I know how to work the reader. Look for the spring editions, twenty years back.'),
  { t: 'minigame', id: 'story_fiche' },
  scene('story_archive'), fade(0, 0.4),
  ...lines('suzu/surprised|"Starlight Festival cancelled. Lantern lens damaged in storm."', 'misa|Damaged. Not destroyed. So it could be fixed?',
    'suzu|It says the lens was "missing several pieces" after the storm. And nobody ever explained why the keepers stopped.',
    'misa|The paper star said seven lights went home to seven hearts. What if the pieces of the lens are the seven lights?',
    'suzu/happy|...Oh. Oh, that\'s good. That\'s really good.'),
  scene(null),
  ...lines('suzu|Here. My number. If you find anything else, tell me. I want to know how this story ends.', 'misa/happy|Partners?', 'suzu/happy|...Partners.'),
  set('suzu_number'), friend('suzu', 60), clue('headline'), memory('story_ch2_archive'), advance('main_ch2'),
], 'The newspaper archive');

quest('main_ch2', {
  name: 'The Paper Star', chapter: 2, desc: '"Seven lights went home to seven hearts. The first sleeps where the cat keeps watch."',
  stages: [
    { text: 'Ask Grandma Hana about the paper star (Sunny Pines)', hint: 'Sunny Pines is past Sakura Park. Visiting hours 9 AM to 6 PM' },
    { text: 'Search the newspaper archive in the library', hint: 'The archive is in the library, off the town square' },
  ],
  reward: { flags: ['library_card'] },
});

// ================================================================ Chapter 3: Grandma's Attic
chapter(3, {
  name: 'Grandma\'s Attic', trigger: ['flag:chapter_2_done', 'weekend', 'weather:rain|storm'], on: ['dayStart', 'mapEnter'], open: 'story_ch3_open', art: 'story_attic_key',
  teaser: 'A rainy weekend. Mochi is asleep on the lucky cat statue by the door... under the cat?',
  summary: 'Rain all day, so I stayed home. Mochi was napping on the lucky cat statue, and when I coaxed her off, the attic key was underneath! In the attic: Grandma\'s trunk, her Keeper Journal, the first prism (Vega), and an old corkboard that is now my Mystery Board.',
});
script('story_ch3_open', [
  card(3, 'Grandma\'s Attic', 'A rainy weekend'),
  ...lines('|Rain drums on the roof all morning. No going out today.', 'misa|Grey, grey, grey. What do you want to do today, Mochi?',
    '|Mochi is curled up on top of the little white lucky cat statue, fast asleep. One ear twitches.',
    'misa|You love that statue. You\'re like a cat keeping watch on a cat keeping watch.', 'misa/surprised|...Wait. "Where the cat keeps watch." "Under the cat, dear."'),
]);
register('storyProp', 'neko', { map: 'home', spot: 'tv', dx: 1, spr: 'story_neko_mochi', label: 'Gently pet Mochi off the statue', when: 'quest:main_ch3=0', script: 'story_ch3_neko' });
register('storyProp', 'neko_after', { map: 'home', spot: 'tv', dx: 1, spr: 'story_neko', label: 'Lucky cat statue', when: 'quest:main_ch3>=1',
  run: (g) => g.run(lines(['misa|The maneki-neko. It waves for luck. Grandma waved back at it every morning.', 'misa/happy|Thanks for keeping the key safe, little cat.', 'misa|There\'s a dusty paw print on its head. Mochi\'s, definitely.'][g.day % 3])) });
script('story_ch3_neko', [
  ...lines('misa|Mochi... sweetie... could you move, just a little?'), { t: 'minigame', id: 'pet' },
  sfx('meow'), ...lines('|Mochi stretches, yawns enormously, and hops down to find a warmer spot.', 'misa|Thank you. Now, under the cat...'),
  sfx('dig'), ...lines('|The statue rocks on its base. Underneath, in a little hollow, is an iron key with a star-shaped bow.', 'misa/surprised|A key! Grandma, you sneaky... What does it open?',
    '|The only lock in the house Misa hasn\'t opened is the hatch in the hallway ceiling. The attic.'),
  give('story_attic_key'), set('attic_open'), clue('maneki'), memory('story_ch3_neko'), advance('main_ch3'),
], 'Under the cat');

quest('main_ch3', {
  name: 'Grandma\'s Attic', chapter: 3, desc: '"The first sleeps where the cat keeps watch." Mochi\'s favourite statue...',
  stages: [
    { text: 'Gently pet Mochi off the lucky cat statue', hint: 'The statue is in the living room, near the TV' },
    { text: 'Climb the ladder to the attic', hint: 'The attic ladder is in the house', done: { on: 'mapEnter', map: 'attic' },
      script: lines('|Dust motes swirl in the grey light from a round window. Boxes, a dressmaker\'s dummy, a corkboard on the wall, and an old oak trunk.', 'misa|Grandma\'s secret room. It\'s like stepping into a photograph.') },
    { text: 'Open Grandma\'s trunk', hint: 'The trunk sits under the attic window' },
    { text: 'Use the Mystery Board to make your first deduction', hint: 'The corkboard on the attic wall', done: { on: 'boardSolved', id: 'd_cat' },
      script: [...lines('misa/happy|One prism found, six to go. And a whole journal of riddles.', 'misa|Riddle two: "the heart that never stops". I should text Suzu about this.'), { t: 'mail', id: 'story_suzu_ch3', from: 'Suzu', text: 'A KEY under a STATUE? And a secret journal?! This is the best mystery I\'ve ever been in. Keep me updated. Every detail.' }] },
  ],
  reward: { flags: ['keeper_journal_app'] },
});

// ================================================================ Chapter 4: Tick, Tock, Tobias
chapter(4, {
  name: 'Tick, Tock, Tobias', trigger: ['flag:chapter_3_done', { any: ['friend:tobias>=1', 'dayn>=12'] }], on: ['dayStart', 'mapEnter'], open: 'story_ch4_open', art: 'story_prism_altair',
  teaser: '"The second beats in the heart that never stops." A clock never stops... the clock tower?',
  summary: 'Riddle two led to the clock tower. Mr. Wren grumbled the whole time, but he let me fix the jammed chime, and Altair was the chime\'s jewel bearing! Then I compared his repair tag with the paper star. Same handwriting. Mr. Wren writes the paper stars. But why?',
});
script('story_ch4_open', [
  card(4, 'Tick, Tock, Tobias', 'The heart that never stops'),
  ...lines('misa|"The second beats in the heart that never stops. Ask the grumpy one who keeps it wound."',
    'misa|A heart that never stops... a clock! The clock tower in the square.', 'misa|And the grumpy one must be the clockmaker. Wren\'s Clocks, next to the tower.'),
]);
hook('story_ch4_tobias', 'tobias', 'quest:main_ch4=0', [
  emote('tobias', 'i_anger'),
  ...lines('tobias|We\'re closed. ...We\'re open. But we\'re closed to people who look like they\'re about to ask questions.',
    'misa|Mr. Wren? I\'m Misa Aoki. Hana\'s granddaughter. The clock tower chime hasn\'t rung since I arrived. Is it broken?',
    'tobias/surprised|...Hana\'s.', '|He stares at her over his spectacles for a long moment. His pocket watch ticks loudly in the silence.',
    'tobias|The chime has been jammed for years. Nobody in this town cares about precision. They have phones.',
    'misa|I care. Could I try to fix it?', 'tobias|You? A schoolgirl? Fix a 60-year-old escapement?'),
  choice('Say...', ['"Grandma always said I had clever hands."', 'tobias|...She would say that. She said it about everyone. ...She said it about me, once.', friend('tobias', 20)],
    ['"Please. It\'s important."', 'tobias|Everything is important to the young. ...Fine. Fine!'],
    ['"You could supervise me."', 'tobias/happy|Supervise. Hmph. Yes. Someone must, clearly.', friend('tobias', 30)]),
  ...lines('tobias|The tower door is at the back of the shop. Touch nothing that is not a gear. I will be supervising. From down here. Mostly.'),
  set('clock_tower_open'), advance('main_ch4'),
]);
register('storyProp', 'gears', { map: 'clock_tower', spot: 'gears', label: 'Look at the jammed gears', when: 'quest:main_ch4=1', script: 'story_ch4_gears' });
script('story_ch4_gears', [
  ...lines('|The great gear train of the tower. Something is wrong: the gaps between the gears don\'t match the gears in them.',
    'misa|Someone put the wrong gears in. Small where a big one should be, big where a small one should be...'),
  place('tobias', { dx: 1 }),
  ...lines('tobias|I\'m not here. I\'m supervising from a distance. A very short distance.', 'tobias|Match each gear to its gap. The teeth must mesh, or the train will not turn.'),
  { t: 'minigame', id: 'story_gears' }, sfx('bell'), sfx('bell'),
  ...lines('|BONG. BONG. For the first time in years, the clock tower sings over the square. Pigeons scatter. Down below, people stop and look up.',
    'tobias/surprised|...It rings.', '|Something small and bright tumbles out of the bell housing and rolls to Misa\'s feet.',
    'misa/surprised|A prism! It was in the chime! That\'s why it jammed... someone set it as a jewel bearing.'),
  give('story_prism_altair'), clue('altair'),
  ...lines('tobias|Altair. She called it Altair. ...I mean. That is a common name for a jewel. Of clocks. Hmph.',
    'tobias|Take it. It has nothing to do with me. Here, take this repair tag too, for the guild record. Good day.',
    '|He hurries down the stairs much faster than a man with a cane should be able to.',
    'misa|"She called it Altair"... He knows something.', '|The repair tag is written in tiny, perfect, slanted capitals.', 'misa|...I\'ve seen this handwriting before.'),
  set('tag_found'), clue('repair_tag'), friend('tobias', 30), memory('story_ch4_gears'), advance('main_ch4'),
], 'The clock tower sings');

quest('main_ch4', {
  name: 'Tick, Tock, Tobias', chapter: 4, desc: '"The second beats in the heart that never stops. Ask the grumpy one who keeps it wound."',
  stages: [
    { text: 'Ask Mr. Wren about the clock tower chime', hint: 'Wren\'s Clocks is on the town square (closed Sundays)' },
    { text: 'Fix the jammed chime in the clock tower', hint: 'The tower door is at the back of Wren\'s Clocks' },
    { text: 'Compare the handwriting on the Mystery Board', hint: 'The Mystery Board is in the attic', done: { on: 'boardSolved', id: 'd_hand' },
      script: [...lines('misa|Mr. Wren folds the paper stars. Every spring, for twenty years, he\'s been asking someone to look for the prisms.', 'misa|Why not just do it himself? What happened between him and Grandma?'), page('p4')] },
  ],
  reward: { flags: ['clock_repairs'], friend: { tobias: 30 } },
});

features('Main story', [
  'Prologue "Boxes and Buttons": arrive by bus with Mochi, Pip helps with the boxes, unpack three boxes, feed Mochi and meet your neighbour Goro',
  'Guided first evening: Mochi brings the brass button, then a video call with Mum and Dad (three things to talk about)',
  'Chapter 1 "New Girl in 2-B": walk to school, introduce yourself to the class (3 ways), a pop quiz and a lunch spot choice with 5 classmates',
  'Kai and Hina tell the legend of the dark lighthouse in the square after your first school day',
  'Chapter 2 "The Paper Star": a riddle pinned on the town noticeboard (it shows up on the board itself too)',
  'Grandma Hana hums the Keeper\'s Song and says "under the cat, dear"',
  'Library archive research with Suzu, who becomes your detective partner and gives you her number',
  'Chapter 3 "Grandma\'s Attic": on a rainy weekend, coax Mochi off the lucky cat statue to find the attic key (rain is forced on Saturday Spring 13 if it hasn\'t rained)',
  'Attic discovery: Grandma\'s trunk, the Keeper Journal, the Vega prism and the corkboard that becomes the Mystery Board',
  'Chapter 4 "Tick, Tock, Tobias": persuade grumpy Mr. Wren (3 approaches), fix the clock tower chime and recover the Altair prism',
  'The clock tower chime rings over the square again once you fix it',
  'Story objectives always show in the HUD tracker, and story chats take over conversations only when it matters',
]);
