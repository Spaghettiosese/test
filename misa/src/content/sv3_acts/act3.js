// Act III: "The Second Year" (chapters 25-40, Year 2). A developer, Seaglass Holdings, wants the Community Hall lot and a
// "consolidation" of Hoshimori High. Four multi-part quests with deadlines (the petition, Open Campus, the Winter Fund and
// the witnesses/hearing) build a support score (see state.js) that decides the hearing: saved, partial or reprieve.
import { get, features } from '../../core/registry.js';
import { chapterDef, hook, lines, choice, advance, scene, fade, wait, sfx, place, give, take, friend, memory, mood, call, mg, IF, setv, mail, N, set } from './kit.js';
import { S, supportScore, supportParts, resultOf, SUPPORT_PARTS } from './state.js';
import { readLetter, letterStage } from './kit.js';

const KU = (t) => `|Mr. Kurokawa: ${t}`;
const hall = () => (get('map', 'community_hall') ? 'community_hall' : 'town');
const hallMap = (m) => m === hall();
const res = (v) => `flag:a3_result=${v}`;
const role = (v) => `flag:a3_role=${v}`;
const qn = (id) => (g) => (g.state.story.qn || {})[id] || 0;
// Register talk hooks that each count once toward a collecting stage (signatures, witnesses).
function collect(n, i, ev, field, list) {
  for (const { npc, steps } of list) {
    const key = `a3_${ev}_${npc}`;
    hook(`sv3_c${n}_${npc}`, npc, [`quest:sv3_q${n}=${i}`, `!flag:${key}`], [...steps, call((g) => { g.setFlag(key); S(g).support[field]++; g.bus.emit(ev, { npc }); })]);
  }
}

// ================================================================ Chapter 25
chapterDef(25, {
  name: 'The New Term', trig: ['dayn>=113'], by: 120, art: 'sv3_item_tidechart',
  onStart: (g) => g.setFlag('a3_school_notice'),
  teaser: 'A new year at Hoshimori High. Ms. Fujita has an announcement that nobody wants to hear.',
  summary: 'The second spring began with bad news: the prefecture is reviewing small schools, and Hoshimori High has barely enough students. A notice on the town board says the Community Hall lot is under review too.',
  open: lines('|Cherry blossoms again. Spring, Year 2. The same classroom, the same desks, and a second year of Misa.', 'misa|It feels like someone has turned the lights up one notch. Everything is a little clearer. Even the homework.'),
  stages: [
    { text: 'Go to class on the first day of term', hint: 'The classroom in the school halls', go: 'classroom', steps: [place('rina', { dx: 1 }), place('kai', { dx: -1 }), ...lines('fujita|Settle down. I have a short announcement and a long coffee.', 'fujita|The prefecture has opened a review of small schools. Enrolment here is sixty-one students. The threshold is sixty.',
      'kai|So we are... one student above a cliff?', 'fujita|A cliff with a view, Tanabe. But yes. A school with a falling roll can be merged into Minato High in two years.', 'rina|Merged. We would be bussed forty minutes away. The class council would be abolished.', 'rina|I refuse.', 'fujita|I have not asked you to refuse, Hoshino. Yet.')] },
    { text: 'Talk to Rina about the review', hint: 'Rina is at school, the library, or the shopping street', talk: 'rina', steps: lines('rina|Sixty-one. I counted them twice, in alphabetical order. They are all unique and precious and I have a spreadsheet.', 'misa|What can we do?', 'rina|Be the best sixty-one people this town has ever seen. I will make a plan. You will make it fun. Do not argue.', 'misa/happy|I would never.') },
    { text: 'Read the notice on the town noticeboard', hint: 'The noticeboard in the town square', prop: { map: 'town', spot: 'noticeboard', dy: 1, label: 'A new official notice' },
      steps: [...lines('|A crisp new notice is pinned over the old festival posters: "PREFECTURE REVIEW: Hoshimori High School and Hoshimori Community Hall lot. Public hearing, winter."', '|Below it, in a smaller font: "Developer proposal: Seaglass Holdings."', 'misa|Two lanterns at once. The school and the hall. Someone has big plans for our town.'), friend('rina', 30), memory('sv3_open25')] },
  ],
  reward: { money: 200 },
});

// ================================================================ Chapter 26
chapterDef(26, {
  name: 'Seaglass Arrives', trig: ['since:25>=1'], by: 126,
  onStart: (g) => { g.setFlag('a3_emporium'); g.setFlag('a3_hoarding'); },
  teaser: 'A very polite developer has opened a shop on the square and wants to buy Hoshimori a better future.',
  summary: 'Mr. Kurokawa of Seaglass Holdings opened the Seaglass Emporium on the square and charmed half the town. He wants to build a marina resort where the Community Hall stands.',
  open: lines('|A new striped awning on the square. A new sign. A new smell: sea salt and expensive candles.'),
  stages: [
    { text: 'Meet the stranger at Cafe Kumo', hint: 'Cafe Kumo, on the square', go: 'cafe', steps: [place('mika', { dx: 1 }), ...lines('|A tall man in a pale linen suit is at the window table, tapping a tablet.', KU('Ah. You must be Misa Aoki. The Keeper. I have heard a great deal. Please. Sit. I never discuss business before a good coffee.'), 'mika|He ordered the most expensive thing on the menu and then asked what it was.',
      KU('I want only the best for Hoshimori Bay. A marina. A boardwalk. A real future for the young people. You will thank me when you are older.'), 'misa|And the Community Hall?', KU('A charming ruin. We will preserve its spirit. In a brochure.'), 'mika|...Kumo-chan, we are leaving the room. Now.')] },
    { text: 'Look at the new Seaglass Emporium', hint: 'The square, next to the noticeboard', prop: { map: 'town', spot: 'noticeboard', dx: 7, dy: 1, label: 'Look at the Seaglass Emporium' },
      steps: [...lines('|Glossy shelves, glass jars, soft music. Everything smells like a very clean beach. It is, to be honest, lovely.', KU('Welcome, welcome. The Emporium sells small things for good living. Take a look. A free paper crane for every visitor.'), 'misa|(I hate that I like the paper crane.)'), set('a3_emporium_seen')] },
    { text: 'Ask Sachiko what the town thinks', hint: 'Sunny Mart, on the square', talk: 'sachiko', steps: lines('sachiko|Oh, he has been in three times. Bought a single rice cracker each time. Asked about my lease. Very charming. Very.', 'sachiko|He is giving out discount tickets for the Emporium. I took one. I am not a traitor, I just like a discount.',
      'misa|Sachiko, he wants the Hall lot.', 'sachiko/surprised|The old hall? Where Hana held her harvest suppers?', 'sachiko|...Oh, I took the ticket. I am going to give it back. Slowly. With a lecture.'), },
  ],
  reward: { money: 200 },
});

// ================================================================ Chapter 27: quest 1, the petition
chapterDef(27, {
  name: 'Names on Paper', trig: ['since:26>=1'], by: 138, art: 'sv3_item_tidechart',
  onStart: (g) => g.setFlag('a3_banner_hall'),
  teaser: 'Quest 1, part 1: a petition to keep the Hall and the school. Deadline: Spring 26.',
  summary: 'Rina drafted a petition and we collected five signatures from the people who keep Hoshimori running.',
  open: lines('|A fresh stack of paper, a pen on a string, and one very determined class representative.'),
  stages: [
    { text: 'Get the petition sheet from Rina (by Spring 26)', hint: 'Rina is at school or the library', talk: 'rina', steps: lines('rina|I drafted it in four colours. The green is for the Hall, the blue is for the school, the red is for emphasis.', 'rina|Five names from the people who matter: Mika, Sachiko, Captain Jun, Mr. Hayashi, and Kiko. Politely. In ink.', 'misa|Polite and in ink. Got it.'), },
    { text: (g) => `Collect 5 signatures (${qn('sv3_q27')(g)}/5, by Spring 26)`, hint: 'Mika, Sachiko, Captain Jun, Goro and Kiko', on: { on: 'sv3Sig', count: 5 },
      steps: lines('|Five names sit at the bottom of the page: Mika Kumo, Sachiko Ueda, Jun Ishida, Goro Hayashi, and Kiko Amane in tidy calligraphy.', 'misa/happy|A good start. Now to show it to someone who matters.') },
    { text: 'Show the petition to Ms. Fujita', hint: 'Ms. Fujita is at school or on the roof', talk: 'fujita', steps: lines('fujita|Five signatures in a week? Aoki, you are more dangerous than a chemistry exam.', 'fujita|I will bring this to the school council on Friday. It will not win a hearing, but it will warm the room.', 'misa/happy|Warm rooms are a good start.'),  },
  ],
  reward: { money: 220 },
});
collect(27, 1, 'sv3Sig', 'sig', [
  { npc: 'mika', steps: lines('mika/happy|Sign it? I will sign it twice! Three times if you give me another pen!', 'mika|He ordered a latte and asked how many tables I could remove. I said "none, ever". He wrote it down.') },
  { npc: 'sachiko', steps: lines('sachiko/happy|Of course, dear. And I will tell everyone at the market. Everyone. They cannot stop me.') },
  { npc: 'jun', steps: lines('jun/happy|Sign a thing! Ha! In my day we signed with a harpoon. Hand me the pen, little keeper.', 'jun|The Hall had the best fish suppers. You do not tear down a place where a hundred people ate my grilled mackerel.') },
  { npc: 'goro', steps: lines('goro|Hmph. Paper. Fine.', '|He signs with a firm, square hand.', 'goro|I planted the Hall garden. Forty years ago. Anyone who pulls it out answers to my shovel.') },
  { npc: 'kiko', steps: lines('kiko|The shrine has no opinion on petitions. But I have. I will sign.', 'kiko|The Hall sprites told me about your visit. They are... very concerned. And are very sorry for the dust.') },
]);

// ================================================================ Chapter 28: quest 1, council night
chapterDef(28, {
  name: 'Council Night', trig: ['since:27>=1'], by: 146,
  teaser: 'Quest 1, part 2: the town council meets at the Community Hall. Deadline: Summer 6.',
  summary: 'The town council met at the Hall. I spoke for the petition and chose how much to pledge to the Hall fund.',
  open: lines('misa|Council night. At the Hall. I have a speech, a tie, and a stomach full of butterflies.'),
  stages: [
    { text: 'Attend the town council meeting at the Hall (by Summer 6)', hint: 'The Community Hall, after 6 PM', go: hallMap, when: 'time>=18:00',
      steps: (g) => [scene('sv3_council'), ...lines('|The Hall is full. Chairs scrape. Mika is wearing her good apron. Sachiko is holding a plate of crackers like a weapon.', 'jun|Order! ...Wait, I am not the chair. Sorry. Carry on.'), KU('The proposal is simple. Hoshimori gains a marina, forty jobs and a tidy tax base.'),
        'misa|Excuse me. May I say something?',
        choice('How do you speak?',
          ['Speak from the heart', 'misa|This hall is where Grandma held her harvest suppers. It is where the sprites live. It is where we meet when it rains. A town is not a tax base. It is a lantern with a roof.', call((gm) => { S(gm).support.statement += 2; S(gm).support.council += 2; })],
          ['Cite the numbers', 'misa|Rina found that the hall hosts eleven events a month. Replacing that venue costs more than the marina earns in five years.', 'rina|Page seven. I highlighted it.', call((gm) => { S(gm).support.council += 3; })],
          ['Show the petition', 'misa|Five signatures in a week. And more waiting. Every name here is someone who eats here, works here, sleeps here.', call((gm) => { S(gm).support.council += 2; S(gm).support.sig += 1; })]),
        ...lines('mika|Hear, hear!'), scene(null),
        ...lines('|The council defers the decision to a public hearing in midwinter. Mr. Kurokawa smiles as if he expected it.'),
        choice('The Hall fund collection plate comes round.',
          ['Pledge 300 coins', call((gm) => { if (gm.spend(300)) S(gm).support.pledge += 300; })],
          ['Pledge 800 coins', call((gm) => { if (gm.spend(800)) S(gm).support.pledge += 800; })],
          ['Put in a handful of loose change', call((gm) => { if (gm.spend(30)) S(gm).support.pledge += 30; })],
          ['Not tonight', 'misa|I will find another way to help.']),
        friend('mika', 30), friend('sachiko', 30), memory('sv3_open28')] },
  ],
  reward: { money: 200 },
});

// ================================================================ Chapter 29: camping trip
chapterDef(29, {
  name: 'Under the Same Stars', trig: ['dayn>=145', 'since:28>=1'], by: 160,
  onStart: (g) => g.setFlag('a3_camp_planned'),
  teaser: 'The school camping trip is on Shell Beach: tents, a bonfire, and hopefully not too many ghost stories. Bring chocolate and sugar for s\'mores.',
  summary: 'We pitched tents on Shell Beach, roasted marshmallows, and told ghost stories under the stars. I picked a tent partner and learned something about each friend.',
  open: lines('|Hot sand, long evenings, and a duffel bag Misa packed three times.'),
  stages: [
    { text: 'Bring supplies for s\'mores (2 Chocolate, 1 Sugar)', hint: 'Sunny Mart sells chocolate and sugar', has: ['item:ing_chocolate>=2', 'item:ing_sugar>=1'], steps: [take('ing_chocolate', 2), take('ing_sugar', 1), ...lines('rina|Excellent. I allocated you the chocolate. I did not expect you to take it so literally.')] },
    { text: 'Join the class camp on Shell Beach', hint: 'Shell Beach, after 5 PM', go: 'beach', when: 'time>=17:00',
      steps: [call((g) => g.setFlag('a3_camp_site')), scene('sv3_camp'), ...lines('|Two tents lean against the wind. The bonfire pops. Mr. Ogawa is wearing a headlamp, a cape, and a deeply serious expression.', 'ogawa/happy|AOKI! Welcome to Camp Hoshimori! Rule one: hydrate! Rule two: nobody eats the marshmallows raw!', 'kai|I ate one raw.', 'ogawa|Then you have learned Rule Two the hard way!',
        'rina|The tent allocation is on this clipboard. I made it fair. Seven-point-four percent of it, anyway.'), mg('sv3_roast'), ...lines('hina/happy|Look! A shooting star! No, a plane! No, Kai\'s marshmallow on fire!', 'kai/surprised|It is NOT on fire! It is "caramelised dramatically"!'),
        ...lines('kai|Okay. Ghost story. A long time ago, a lighthouse keeper... forgot her sandwiches.', 'suzu|That is not a ghost story.', 'kai|She was haunted. By hunger.', 'theo/happy|...That is the best ghost story I have heard in months.'),
        '|Afterwards, the tents glow like paper lanterns.', 'rina|Tent partners. I have left it open. Because apparently I am a nicer person than my spreadsheet.',
        choice('Who shares your tent?',
          ['Hina', 'hina/happy|YES! I brought a spare crab! He is called Gerald the Fourth!', call((g) => { S(g).tent = 'hina'; g.setFlag('a3_tent', 'hina'); g.addFriend('hina', 60); })],
          ['Suzu', 'suzu|I have a lantern, a notebook, and three theories about the stars. Please come in.', call((g) => { S(g).tent = 'suzu'; g.setFlag('a3_tent', 'suzu'); g.addFriend('suzu', 60); })],
          ['Rina', 'rina|...Fine. Fine! But I am keeping the left side. It has better airflow.', call((g) => { S(g).tent = 'rina'; g.setFlag('a3_tent', 'rina'); g.addFriend('rina', 60); })]),
        ...lines('|Under the canvas, the sea breathes in and out. Someone is whispering. Someone is laughing. Someone is losing a battle with a zipper.', 'misa/happy|This is the best summer of my life.'),
        fade(1, 0.8), scene(null), wait(0.6), fade(0, 0.8), give('sv3_camp_lantern'), friend('kai', 25), friend('theo', 25), mood(25), memory('sv3_open29')] },
  ],
  reward: { money: 200 },
});

// ================================================================ Chapter 30: quest 2, Open Campus
chapterDef(30, {
  name: 'Open Campus', trig: ['since:29>=1'], by: 172, art: 'sv3_item_tidechart',
  onStart: (g) => g.setFlag('a3_banner_campus'),
  teaser: 'Quest 2: an Open Campus day to show prospective students why Hoshimori High is worth keeping. Deadline: Autumn 4.',
  summary: 'Rina organised Open Campus, four friends ran booths, and we made posters. A dozen families came to see the school.',
  open: lines('|Rina has produced a laminated schedule. Misa has never been so afraid of laminate.'),
  stages: [
    { text: 'Plan Open Campus with Rina (by Autumn 4)', hint: 'Rina is at school or the library', talk: 'rina', steps: lines('rina|Open Campus. Four booths, one tour route, ten posters. Prospective students must feel the heart of the school.', 'rina|I need your hands, Misa. And your face on the poster, because it is oddly trustworthy.') },
    { text: 'Collect poster supplies (3 Paper, 1 Paint)', hint: 'Paper and paint come from the shops and the craft bench', has: ['item:mat_paper>=3', 'item:mat_paint>=1'], steps: [take('mat_paper', 3), take('mat_paint', 1), ...lines('misa|(Three big posters later, my hands are blue and I have no regrets.)')] },
    { text: (g) => `Recruit four friends to run booths (${qn('sv3_q30')(g)}/4)`, hint: 'Kai, Hina, Theo and Suzu', on: { on: 'sv3Recruit', count: 4 }, steps: lines('misa/happy|Four booths. Four friends. We are an army!', 'rina|An army with matching name tags. I will not be argued with.') },
    { text: 'Run Open Campus day at school', hint: 'The school grounds', go: 'school_grounds', steps: [place('rina', { dx: 1 }), place('kai', { dx: -2 }), ...lines('|Banners wave over the school gate. Families wander the grounds with maps and polite smiles.', 'kai/happy|Soccer penalty shootout! Win a snack! Lose a snack! Either way, there is a snack!',
      'hina/happy|Look at our school garden! These ladybirds all have names!', 'theo|Quick sketches. Free. Do not stare at the paper, it makes me nervous.', 'suzu|Short story corner. Three minutes, one ending, no refunds.',
      'rina|Twelve families! Eleven smiles! One toddler eating a petition! I call this a triumph.', call((g) => { S(g).support.recruits = Math.max(S(g).support.recruits, 4); }), friend('rina', 40), memory('sv3_open30'))] },
  ],
  reward: { money: 250 },
});
collect(30, 2, 'sv3Recruit', 'recruits', [
  { npc: 'kai', steps: lines('kai/happy|A booth? I could do a booth! Penalty kicks! I will wear the goalkeeper gloves and a lot of confidence!') },
  { npc: 'hina', steps: lines('hina/happy|Nature booth! I will bring ladybirds, and Gerald! Everyone loves Gerald!') },
  { npc: 'theo', steps: lines('theo|Quick sketches. Fine. I will stay in the corner and draw them. If they ask, I am not shy, I am "artistically reserved".') },
  { npc: 'suzu', steps: lines('suzu|A story booth. Three minutes, one ending. People will line up. Or hide. Either is statistically fine.') },
]);

// ================================================================ Chapter 31: culture festival casting
chapterDef(31, {
  name: 'Casting Call', trig: ['dayn>=169', 'since:30>=1'], by: 187,
  onStart: (g) => g.setFlag('a3_poster'),
  skip: (g) => { if (!g.flag('a3_role')) g.setFlag('a3_role', 'crew'); },
  teaser: 'The Culture Festival play is "The Keeper\'s Daughter", written by Suzu. Pick your role.',
  summary: 'Suzu wrote a play about a lighthouse keeper\'s daughter. I chose my role and rehearsed on the gym stage.',
  open: lines('|Autumn. The school smells of paint and paper flowers. Posters for the Culture Festival are already peeling off the walls.'),
  stages: [
    { text: 'Get the script from Suzu and choose your role', hint: 'Suzu is in the library or at school', talk: 'suzu', steps: lines('suzu|"The Keeper\'s Daughter." A play. Mostly about lighthouses. Slightly about us. I changed all the names, except Mochi\'s.', 'misa|You put Mochi in a play?', 'suzu|She is a cat. She plays herself. She does not need rehearsals. Now. Roles.',
      choice('Which role do you take?',
        ['The Keeper\'s Daughter (lead)', 'suzu|Oh. Oh good. I wrote her with your voice in my head. Do not tell the others.', call((g) => { g.setFlag('a3_role', 'lead'); g.addFriend('suzu', 60); }), give('sv3_play_script')],
        ['The Sea Spirit (comic)', 'kai/happy|YES! I am the Moon! You are the Sea! We do a dance!', 'suzu|It is not a dance. It is "choreographed weather".', call((g) => { g.setFlag('a3_role', 'spirit'); g.addFriend('kai', 60); }), give('sv3_play_script')],
        ['Stage manager', 'rina|Excellent. I have never been so pleased. I will make you the most terrifying stage manager Hoshimori has seen.', call((g) => { g.setFlag('a3_role', 'crew'); g.addFriend('rina', 60); }), give('sv3_play_script')],
        ['The musician with Theo', 'theo|...Guitar and a hum. You take the hum. I take the guitar. We never speak of the hum again.', call((g) => { g.setFlag('a3_role', 'music'); g.addFriend('theo', 60); }), give('sv3_play_script')])) },
    { text: 'Rehearse on the gym stage', hint: 'The gym, through the school grounds', go: 'gym', steps: [scene('sv3_stage'), ...lines('|The gym stage is a patchwork of plywood and good intentions. A paper lighthouse wobbles in the wings.', 'suzu|Take it from the storm scene. Please do not laugh at the storm. It is brave.'),
      IF(role('lead'), lines('misa|"Father, the lamp will not light!" ...Sorry, I forgot the next line.', 'suzu|It is "I will climb the stairs myself". You have lived it. Say it like you have.'), IF(role('spirit'), lines('kai|"I am the Moon and I have OPINIONS!"', 'misa|"I am the Sea and I do not care!"', 'suzu|...That is good. Keep that.'), IF(role('crew'), lines('rina|Spotlight left. No, YOUR left. Good. Never apologise to a spotlight.'), lines('theo|Chord. Hum. Chord.', 'misa|Hum?', 'theo|...Good hum.')))),
      mg('sv3_cue', { n: 6, title: 'Rehearsal', help: 'Press Space on your cue light' }), scene(null), friend('suzu', 30), friend('kai', 20), memory('sv3_open31')] },
  ],
  reward: { money: 200 },
});

// ================================================================ Chapter 32: culture festival performance
chapterDef(32, {
  name: 'Opening Night', trig: ['since:31>=1', 'date:autumn-20|autumn-21'], by: 190,
  skip: (g) => { g.setFlag('a3_poster', false); },
  teaser: 'The Culture Festival, Autumn 20 and 21. Curtain at the gym.',
  summary: 'We performed "The Keeper\'s Daughter" at the Culture Festival. Mr. Kurokawa watched from the back row, and afterwards Rina saw something in his folder.',
  open: lines('|Opening night. The whole school smells of face paint and nerves.'),
  stages: [
    { text: 'Perform the school play at the gym', hint: 'The gym during the Culture Festival, after 2 PM', go: 'gym', when: 'time>=14:00', steps: [scene('sv3_stage'), ...lines('|The lights go down. The paper lighthouse wobbles bravely. A hush falls over the gym.'),
      IF(role('lead'), lines('misa|"I will climb the stairs myself. For everyone out there in the dark." ...I said it. I actually said it.'), IF(role('spirit'), lines('kai|"I am the Moon! I have opinions!"', '|The gym roars with laughter, and Kai nearly falls off the stage.'), IF(role('crew'), lines('rina|Spot, cue, spot. Curtains. Perfect. Do not clap yet, they are still dying on stage.'), lines('theo|...hum.', '|His guitar fills the gym, and his hum is, unexpectedly, perfect.')))),
      mg('sv3_cue', { n: 8, title: 'Opening night', help: 'Press Space on your cue light' }), sfx('chime'), ...lines('|The final line lands. A beat of silence. Then the whole gym stands up.', 'suzu/happy|They are clapping. They are actually clapping. Somebody get me a chair.', 'hina/happy|I cried in the second act! And the third! And the snack bit!'),
      KU('A charming little production. The best part was the lighthouse. Wooden, I think. They are so hard to maintain.'), 'misa|(He was in the back row. Writing on a folder.)', scene(null), friend('suzu', 30), friend('kai', 30), mood(25), memory('sv3_open32')] },
    { text: 'Find Rina after the show', hint: 'Rina is backstage, at school or the library', talk: 'rina', steps: lines('rina|I saw the folder. When he stood to leave, it fell open. There was a floor plan of the Hall. With a line through it.', 'rina|And a second sheet that said "Hoshimori High: phase two". I cannot prove it. I need that folder.', 'misa|You do not mean...', 'rina|I mean we need a plan. A very quiet, very clever plan. I know exactly who to ask.') },
  ],
  reward: { money: 250 },
});

// ================================================================ Chapter 33
chapterDef(33, {
  name: 'The Missing Blueprint', trig: ['since:32>=1', 'dayn>=190'], by: 194,
  teaser: 'Kurokawa\'s plans exist on paper. The paper is in a temporary office at the old harbour cannery. Time to plan.',
  summary: 'Pip noticed crates going into the old cannery office, Suzu drew a plan, and I spotted lights burning in the Seaglass office window.',
  open: lines('misa|If we want the truth, we need the blueprint. A legal one, if possible. A secret one, if not.'),
  stages: [
    { text: 'Ask Pip about the cannery deliveries', hint: 'Pip is on his round in town', talk: 'pip', steps: lines('pip/surprised|Seaglass? The old cannery? I deliver there twice a day! Big crates, little crates, and one parcel marked "FRAGILE: PLANS".', 'pip|The office door has a brass lock. A very ordinary lock. The key is on a ring with a tiny anchor. Do not ask how I know. I deliver, I look. It is the postie\'s curse.') },
    { text: 'Plan the job with Suzu', hint: 'Suzu is in the library', talk: 'suzu', steps: lines('suzu|Operation Moth. Because moths go where the light is, and nobody notices them. I made a diagram. It has arrows.', 'suzu|Theo takes a wax impression for the key. Hina brings a distraction. Kai is our ears. You are our hands. And I am the voice in the sky.', 'misa|And Rina?', 'suzu|Rina is our alibi. She will be at the Ghost Festival. Looking innocent. She is bad at it. It will work anyway.') },
    { text: 'Scout the cannery from the harbour dock', hint: 'The harbour dock', prop: { map: 'harbour', spot: 'dock', label: 'Watch the old cannery office' },
      steps: [scene('sv3_heist'), ...lines('|Across the water, a single window glows in the crumbling cannery. A guard shuffles past it with a torch.', 'misa|There. One guard, one door, one window. And a long wall of crates.', 'misa|(Moths. It is just moths.)'), scene(null), friend('suzu', 30), memory('sv3_open33')] },
  ],
  reward: { money: 220 },
});

// ================================================================ Chapter 34: the heist
chapterDef(34, {
  name: 'Operation Moth', on: ['dayStart', 'mapEnter', 'hour'], trig: ['since:33>=1', 'dayn>=191', 'time>=18:00'], by: 196,
  skip: (g) => { S(g).support.heist = 0; },
  teaser: 'A night operation at the old cannery. Bring a wax key, a bucket of crabs and a very good poker face.',
  summary: 'On Ghost Festival night we crept into the Seaglass office. Hina\'s crabs distracted the guard, Theo\'s pencil key almost worked, and I came away with the blueprint.',
  open: lines('|Dusk. The first paper lanterns of the Ghost Festival glow along the harbour road.', 'misa|Tonight is perfect. Everybody is outside, dressed as something. Nobody looks twice at a girl in a black hoodie.'),
  stages: [
    { text: 'Get the wax key from Theo', hint: 'Theo is at the harbour mural, the roof or the park', talk: 'theo', steps: lines('theo|Here. I made it from a wax impression. It is mostly graphite. If it snaps, say it was always broken.', 'theo|I do not do crime. I do art. This is "performance art with a lock".'), },
    { text: 'Pick up the distraction from Hina', hint: 'Hina is at the school garden, the park or the beach', talk: 'hina', steps: lines('hina/happy|A bucket of hermit crabs! They are very loud. By which I mean they click. The guard hates clicking. Everyone hates clicking.', 'hina|Gerald the Fifth is the leader. If they get lost, whistle. He understands.'), },
    { text: 'Get the earpiece from Kai', hint: 'Kai is at school, the field or the town', talk: 'kai', steps: lines('kai/happy|Code names! You are "Moth". I am "Big Kai". Suzu is "Voice of Doom". Hina is "Crab Mum". Rina is "Alibi".', 'kai|If you need me, press the button. If you do not need me, press it anyway. I get lonely.'), },
    { text: 'Sneak into the Seaglass office at the cannery', hint: 'The harbour, after 9 PM', go: 'harbour', when: 'time>=21:00',
      steps: [scene('sv3_heist'), ...lines('kai|Big Kai to Moth. Guard is on the north side. Whistling something sad.', 'suzu|Voice of Doom here. You have ninety seconds. Walk like you belong. Do not whistle. It is the first thing they notice.', 'hina|Crab Mum to all units: the bucket has been placed. Gerald has taken command.', '|From behind a stack of crates, a hundred small clicks begin. The guard stops, listens, and turns.'),
        mg('sv3_heist', { title: 'Operation Moth' }, (g, r) => { S(g).support.heist = r && r.score >= 0.8 ? 5 : 2; g.setFlag('a3_heist_clean', !!(r && r.score >= 0.8)); }), scene(null),
        ...lines('|The wax key turns on the second try. Inside: a desk, a drafting table, and a blueprint tube labelled PLANS.', '|On the plan the Hall is a grey rectangle marked REMOVE. Beside it, Hoshimori High is shaded hatch-red: CONSOLIDATE, YEAR 3.', 'misa|(It is not a rumour. It is a plan.)'),
        give('sv3_blueprint'), IF('flag:a3_heist_clean', lines('suzu|Clean as a whistle. Which is a terrible metaphor, because we did not whistle.', 'kai|Big Kai says: legendary!'), lines('suzu|Slightly noisy. A little crab drama. But we have the paper.', 'hina|Gerald is fine! He is eating a crisp!')),
        '|The guard returns to find a bucket of crabs, a very polite note ("Sorry about the crabs"), and a door left exactly as it was.', friend('theo', 30), friend('hina', 30), friend('kai', 30), friend('suzu', 30), mood(25), memory('sv3_open34')] },
  ],
  reward: { money: 300 },
});

// ================================================================ Chapter 35: quest 3, the Winter Fund
chapterDef(35, {
  name: 'The Winter Fund', trig: ['dayn>=197', 'since:34>=1'], by: 208,
  teaser: 'Quest 3: a fundraiser stall at the Winter Market to pay for the town\'s legal costs. Deadline: Winter 12.',
  summary: 'Mika baked, the whole town bought, and I pledged what I could to the Hoshimori Fund at the Winter Market.',
  open: lines('|First snow of the year. The square smells of roasted chestnuts and warm sugar.'),
  stages: [
    { text: 'Plan the fundraiser stall with Mika (by Winter 12)', hint: 'Cafe Kumo', talk: 'mika', steps: lines('mika/happy|A fundraiser stall! Oh, I have been waiting my whole life to be asked! Bring me flour and eggs and I will make it rain pastries.') },
    { text: 'Bring Mika 3 Flour and 2 Eggs', hint: 'Sunny Mart sells flour and eggs', has: ['item:ing_flour>=3', 'item:ing_egg>=2'], steps: [take('ing_flour', 3), take('ing_egg', 2), ...lines('mika/happy|Perfect! Let me be alone with the oven for a moment. Do not look.')] },
    { text: 'Run the fundraiser stall at the Winter Market', hint: 'The town square, from Winter 6', go: 'town', when: 'dayn>=202',
      steps: [...lines('|The Winter Market glitters. Paper stars dangle from the stalls. Mika\'s pastries vanish in minutes.', 'mika/happy|Sold out! SOLD OUT! I need a lie-down!', 'sachiko/happy|I bought nine. It is for the cause. And also because they are delicious.'),
        choice('The cash box is open. How much do you add?',
          ['Add 500 coins', call((g) => { if (g.spend(500)) { S(g).support.pledge += 500; g.addFriend('mika', 30); } })],
          ['Add 1500 coins', call((g) => { if (g.spend(1500)) { S(g).support.pledge += 1500; g.addFriend('mika', 60); g.addFriend('sachiko', 30); } })],
          ['Add 100 coins', call((g) => { if (g.spend(100)) S(g).support.pledge += 100; })],
          ['Just time and pastry', 'misa|I will give my time. And my appetite.', call((g) => { g.addFriend('mika', 15); })]),
        ...lines('mika|The Hoshimori Fund is open. Whatever happens at the hearing, we will have a lawyer.'), memory('sv3_open35')] },
  ],
  reward: { money: 200 },
});

// ================================================================ Chapter 36: quest 4, witnesses
chapterDef(36, {
  name: 'Witness Statements', trig: ['since:35>=1'], by: 214,
  teaser: 'Quest 4, part 1: gather witnesses for the public hearing. Deadline: Winter 18.',
  summary: 'Hana, Tobias, Mika and Captain Jun each promised to speak for the Hall and the school at the hearing.',
  open: lines('|The hearing is in a fortnight. Rina has made a witness binder with tabs.'),
  stages: [
    { text: (g) => `Collect 4 witness statements (${qn('sv3_q36')(g)}/4, by Winter 18)`, hint: 'Grandma Hana, Mr. Wren, Mika and Captain Jun', on: { on: 'sv3Testimony', count: 4 }, steps: lines('rina|Four witnesses, in four voices. Perfect. I will turn them into a binder by Sunday.') },
    { text: 'Ask Ms. Fujita how the hearing works', hint: 'Ms. Fujita is at school', talk: 'fujita', steps: lines('fujita|Five minutes each, no interruptions, a rep from the prefecture, and Mr. Kurokawa\'s lawyer with a very large folder.', 'fujita|I will bring a thermos. And my teacher\'s voice. It terrifies men in linen.') },
  ],
  reward: { money: 220 },
});
collect(36, 0, 'sv3Testimony', 'testimonies', [
  { npc: 'hana', steps: lines('hana/happy|Misa, dear. I held the harvest supper in that hall for thirty years. I will tell them that, and I will tell them I danced on the tables.', 'hana|If I forget what I came to say, you will whisper it. We have worked it all out.') },
  { npc: 'tobias', steps: lines('tobias|Hmph. Speeches. The tower bell knows what the town is. I will say that. And that it needs the hall to rest its echo.', 'tobias|I will wear my good coat. The one with the one good button.') },
  { npc: 'mika', steps: lines('mika|The hall is where I did my first cake order. I will testify with a cake. In evidence, as a cake.') },
  { npc: 'jun', steps: lines('jun/happy|I will tell them about the fish supper where a hundred people shared three tables. Ha! They will be crying into their notes.') },
]);

// ================================================================ Chapter 37: the hearing
chapterDef(37, {
  name: 'The Hearing', trig: ['dayn>=214', 'since:36>=1'], by: 217, flags: [],
  skip: (g) => { if (!g.flag('a3_result')) g.setFlag('a3_result', resultOf(supportScore(g))); S(g).act3Result = g.flag('a3_result'); },
  teaser: 'Quest 4, part 2: the public hearing at the Community Hall. Everything you have done so far counts.',
  summary: 'The hearing decided the fate of the Hall and the school. Everyone we gathered spoke up, and the prefecture ruled.',
  open: lines('|Winter 18. Frost on the glass, steam on the windows, and a whole town in its best coat.'),
  stages: [
    { text: 'Practise your closing statement with Rina', hint: 'Rina is at school or the library', talk: 'rina', steps: lines('rina|Five minutes. No notes. You will say it from here. Right here. Hand on your chest.', 'misa|(I cannot breathe.)', 'rina|You can. I have seen you carry a tray of seven teacups through a crowded cafe. You can do anything.'), },
    { text: 'Speak at the public hearing in the Hall', hint: 'The Community Hall, after 3 PM', go: hallMap, when: 'time>=15:00',
      steps: (g) => [scene('sv3_hearing'), ...lines('|The Hall is packed to the rafters. Hall sprites perch on every beam. A panel from the prefecture sits behind a long table.', KU('The proposal is in the public interest. I have evidence of economic benefit.'), 'fujita|And I have evidence of a hundred and one human beings who would like to keep their school.'),
        IF('item:sv3_blueprint', lines('misa|And I have a plan that labels the Hall "REMOVE" and the school "CONSOLIDATE, YEAR 3". Which does not match what was told to this council.', KU('That is... a draft. Confidential.'), 'rina|It is a plan. It is on paper. It is in your handwriting.'), []),
        choice('Your closing statement...',
          ['A town is not a tax base', 'misa|A town is not a tax base. It is a lantern with a roof. A school is a lantern with a bell. If you take them, you take the light.', call((gm) => { S(gm).support.statement += 3; })],
          ['The figures and the plan', 'misa|The Hall pays for itself through events. The school plus Open Campus show growing interest. Here are the numbers.', call((gm) => { S(gm).support.statement += 2; })],
          ['Read the Tidekeeper\'s letter', 'misa|Someone once wrote me that a hall is a lantern with a roof. She was right.', call((gm) => { S(gm).support.statement += gm.flag('act2_done') ? 3 : 1; })]),
        call((gm) => { const sc = supportScore(gm), r = resultOf(sc); gm.setFlag('a3_result', r); S(gm).act3Result = r; gm.setFlag('a3_score', sc); gm.bus.emit('act3Hearing', { result: r, score: sc }); }),
        ...lines('|The panel confers for a long, silent minute. Hall sprites hold their breath.'),
        IF(res('saved'), lines('|The chair stands. "The Hall is designated community heritage. The school remains open, with a five-year protection."', '|The Hall erupts. Hall sprites throw their hats. Mika sobs into a cake. Rina has fainted gracefully onto Kai.', KU('Well. I find I have been outbid by sentiment. How inconvenient. How... rare.')),
          IF(res('partial'), lines('|The chair stands. "The Hall is designated community heritage. The school will be merged with Minato High after the coming graduating class."', 'rina|After graduation. So we get our last year. That is... something.', 'misa|It is a lantern, still lit. Just a short wick.', KU('A compromise. I am not unhappy with a compromise.')),
            lines('|The chair stands. "The decision is deferred for one year pending further evidence. The Hall is protected in the interim."', 'fujita|A reprieve. One year. We have a year, Aoki.', KU('One more year. I shall be patient. I am very good at patience.')))),
        scene(null), friend('rina', 50), friend('fujita', 50), friend('hana', 40), mood(25), memory('sv3_open37')] },
  ],
  reward: { money: 400 },
});

// ================================================================ Chapter 38
chapterDef(38, {
  name: 'What Comes After', trig: ['since:37>=1'], by: 219,
  onStart: (g) => { g.setFlag('a3_hoarding', g.flag('a3_result') === 'reprieve'); g.setFlag('a3_banner_hall', false); g.setFlag('a3_lights_hall', g.flag('a3_result') !== 'reprieve'); },
  teaser: 'The hearing is over. Time to see what changed.',
  summary: 'The town celebrated or regrouped, depending on the verdict. Mr. Kurokawa and I spoke in front of the Emporium.',
  open: lines('|A grey morning after a big night. Smoke from chimneys, frost on the rooftops.'),
  stages: [
    { text: 'Visit Mika at Cafe Kumo', hint: 'Cafe Kumo, on the square', talk: 'mika', steps: lines('mika/happy|Misa! I did not sleep! I made forty pastries! We should open an extra day, an extra cafe, an extra Mika!', IF(res('saved'), lines('mika|The hall. The school. All of it. I am going to cry on a pastry.'), IF(res('partial'), lines('mika|We lost the school in the end. But a year with it is a whole year of Hoshimori nights.'), lines('mika|We have a year. A year is a whole lot of pastries.'))), friend('mika', 30)) },
    { text: 'Talk to Mr. Kurokawa at the Emporium', hint: 'The Seaglass Emporium on the square', prop: { map: 'town', spot: 'noticeboard', dx: 7, dy: 1, label: 'Talk to Mr. Kurokawa' }, steps: [
      KU('Miss Aoki. May I say something unprofessional?'), 'misa|Is it going to be rude?', KU('Not rude. Honest. I did not expect to lose. I do not often lose.'),
      IF(res('saved'), lines(KU('The Emporium will stay. Small, local. A paper crane for every customer. I may even learn the names of my regulars.')), IF(res('partial'), lines(KU('I will redirect the marina to the harbour edge. The Hall remains. Perhaps I will visit it.')), lines(KU('I will be back at the next hearing. With a better lawyer. And perhaps a better crane.')))),
      'misa|I would not mind if you visited the Hall. It has excellent tea.', friend('mika', 20), memory('sv3_open38')] },
  ],
  reward: { money: 250 },
});

// ================================================================ Chapter 39
chapterDef(39, {
  name: 'Starry Eve', on: ['dayStart', 'mapEnter', 'hour'], trig: ['since:38>=1', 'dayn>=220', 'time>=16:00'], by: 223, letter: 16,
  onStart: (g) => g.setFlag('a3_tree'),
  teaser: 'Winter 24. The town lights its first Starry Eve tree, and a letter from the Tidekeeper arrives.',
  summary: 'The town lit a great tree on the square. Mum and Dad called from the ship, and Grandma\'s newest letter came.',
  open: lines('|Winter 24. A great fir tree has appeared on the square overnight, wrapped in paper stars.'),
  stages: [
    letterStage(16),
    { text: 'Join the Starry Eve tree lighting', hint: 'The town square, after 5 PM', go: 'town', when: 'time>=17:00', steps: [scene('sv3_hundred_lights'), ...lines('|The whole of Hoshimori stands around the tree with cups of hot ginger tea. Kiko strikes a small bell. Mr. Wren pulls a lever.', '|A thousand little stars blink awake.'),
      IF('flag:a2_finale=bell', lines('tobias|(The tower bell rings out softly across the square. A familiar note. A familiar tune.)'), lines('jun|(A handful of lantern boats float on the fountain. A small echo of last winter.)')),
      sfx('phone'), ...lines('mum/happy|Misa! We can see the tree on the satellite feed! The captain turned the ship so we could wave!', 'dad|I am not crying. I am wiping my glasses. Both lenses. Both eyes.', 'mum|We have news, sweetheart. We will tell you at New Year. Good news. Probably.', 'misa|Probably?', 'dad|Probably very good.'),
      scene(null), friend('hana', 40), friend('tobias', 40), mood(25), memory('sv3_open39')] },
  ],
  reward: { money: 300 },
});

// ================================================================ Chapter 40: the cliffhanger
chapterDef(40, {
  name: 'Three Envelopes', on: ['dayStart', 'mapEnter', 'hour'], trig: ['since:39>=1', { any: ['flag:a3_eval_seen', 'year>=3'] }], flags: ['act3_done'], art: 'sv3_envelope_town',
  skip: (g) => { if (!S(g).actsEnding) S(g).actsEnding = 'stay'; },
  teaser: 'The year-end evaluation is done. Late that night, Pip knocks with a bundle of envelopes.',
  summary: 'After the evaluation, three envelopes arrived: one from the sea, one from school, one from the town. A fourth, with a wave seal, held a question about the fifth lantern. I opened one first.',
  open: [scene('sv3_envelopes'), ...lines('|Past midnight. Snow ticks softly against the window. A knock at the door, three raps, quick and cheerful.', 'pip|Misa! Sorry! It is the middle of the night but these are urgent and I am excellent at urgent!', 'pip/surprised|Four envelopes. Four! In one day! I have never delivered four!'), scene(null)],
  stages: [
    { text: 'Open the envelopes', hint: 'Your desk at home', prop: { map: 'home', spot: 'desk', label: 'The four envelopes' }, steps: (g) => [scene('sv3_envelopes'),
      ...lines('|Three envelopes lie on the desk, labelled in different hands: a ship stamp, a school crest, a lantern seal. A fourth, thin and blue, bears a tiny wave.'),
      call((gm) => { gm.give('sv3_envelope_sea', 1, true); gm.give('sv3_envelope_school', 1, true); gm.give('sv3_envelope_town', 1, true); }),
      ...lines('misa|I can open one first. Just one. The rest can wait until I am brave.'),
      choice('Which envelope do you open first?',
        ['The ship stamp (Mum and Dad)', ...lines('|"Dear Misa. The Kujira has a berth for a junior researcher next year. We would love you to come. We know it is a lot to ask. We love you whatever you choose. Mum and Dad."'), 'misa|A year at sea. With them.', call((gm) => { S(gm).actsEnding = 'travel'; gm.setFlag('acts_ending', 'travel'); })],
        ['The school crest (Ms. Fujita)', ...lines('|"Dear Aoki. The Kaibara Marine Science scholarship takes one student a year. I wrote the recommendation myself. It was very long. It was accurate. F."'), 'misa|A scholarship. Real science.', call((gm) => { S(gm).actsEnding = 'study'; gm.setFlag('acts_ending', 'study'); })],
        ['The lantern seal (the town)', ...lines('|"Dear Keeper. The council offers you the keys to the Hall, the lighthouse and a very small salary, should you wish to stay as Hoshimori\'s Keeper. Signed: Everyone."'), 'misa|Everyone. They signed it. All of them.', call((gm) => { S(gm).actsEnding = 'stay'; gm.setFlag('acts_ending', 'stay'); })]),
      ...readLetter(17),
      IF(res('saved'), lines('|A fifth sheet is tucked behind the blue letter: a note from Seaglass: "The Emporium extends a standing offer to the Keeper. Sincerely, K."'), IF(res('partial'), lines('|A fifth sheet from Seaglass: "I will see you at the graduation ceremony. I have a speech. K."'), lines('|A fifth sheet from Seaglass: "One year, Miss Aoki. I will see you at graduation. Do bring the sprites. K."'))),
      '|Outside, snow falls on the harbour. Somewhere, a bell rings once in the dark.', 'misa|The fifth lantern. Wherever I go next. ...What do I do?', scene(null), memory('sv3_open40'),
      call((gm) => { gm.toast('Act III complete: The Second Year', 'i_star'); })] },
  ],
  reward: { money: 600 },
});

features('Story Acts', [
  'Act III "The Second Year": 16 new chapters across Year 2, from a new school term to a cliffhanger at the year-end evaluation',
  'A new Seaglass Emporium kiosk opens on the town square run by developer Mr. Kurokawa, with its own shop that changes after the hearing',
  'Rival developer plot: Seaglass wants the Community Hall lot and a school merger, and the player\'s progress decides the outcome',
  'Quest 1 "Names on Paper" and "Council Night": gather five signatures from townsfolk by Spring 26, then speak at the Hall council and pledge coins',
  'School camping trip on Shell Beach: pitch tents, a marshmallow roasting minigame, Kai\'s ghost story and a choice of tent partner',
  'Quest 2 "Open Campus": make posters, recruit Kai, Hina, Theo and Suzu for booths, and run the school open day before Autumn 4',
  'Culture Festival school play "The Keeper\'s Daughter": pick a role (lead, Sea Spirit, stage manager or musician), rehearse and perform with a cue-timing minigame',
  'Mid-act heist "Operation Moth" on Ghost Festival night: collect a wax key, hermit crabs and an earpiece, then creep past a guard in a stealth minigame',
  'Quest 3 "The Winter Fund": bring Mika flour and eggs for a Winter Market stall and decide how much to give to the Hoshimori Fund',
  'Quest 4 "Witness Statements" and "The Hearing": four townsfolk testify, you give a closing statement, and the prefecture rules',
  'The hearing result (saved, partial or reprieve) is computed from the Community Hall restoration, friendships, Year 1 evaluation, savings and everything you gathered',
  'A Starry Eve tree and a call from Mum and Dad on Winter 24, with different callbacks to the Act II finale',
  'Cliffhanger "Three Envelopes": after the Year 2 evaluation Pip delivers a berth on the ship, a scholarship and the town\'s offer, plus a final Tidekeeper letter',
  'The first envelope you open stores a travel, study or stay leaning that Act IV reads, and Act III completes with the actsComplete event',
]);
