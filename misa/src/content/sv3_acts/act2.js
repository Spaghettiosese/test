// Act II: "The Tidekeeper's Letters" (chapters 10-24, Year 1 summer to winter).
// A mysterious T.K. posts a letter for each chapter. Five Tide Lanterns once guarded the bay: the cave star, the harbour
// wall, the shrine lookout, the clock tower bell and the lighthouse. Three choice points (a2_cp1, a2_cp2, a2_cp3) and two
// branching outcomes (a2_reveal 'open'|'secret' and a2_finale 'bell'|'boats') change later dialogue.
import { get, features } from '../../core/registry.js';
import { chapterDef, readLetter, letterStage, lines, choice, advance, scene, fade, wait, sfx, emote, place, leave, give, friend, memory, mood, call, mg, IF, setv, mail, N, set } from './kit.js';
import { S } from './state.js';

const cp1 = (v) => `flag:a2_cp1=${v}`, cp2 = (v) => `flag:a2_cp2=${v}`, cp3 = (v) => `flag:a2_cp3=${v}`;
const lit = (name) => call((g) => { g.setFlag(`a2_tl_${name}`); g.sfx('chime'); g.toast('A Tide Lantern wakes', 'i_star'); g.bus.emit('sv3TideLit', { name }); });
const hasMap = (id) => !!get('map', id);

// ================================================================ Chapter 10
chapterDef(10, {
  name: 'The Unstamped Letter', trig: ['dayn>=29'], by: 36, letter: 1,
  teaser: 'A letter with no stamp and a tiny wave on the seal was waiting in the mailbox. It sends me to the lighthouse logbook.',
  summary: 'Summer began with an envelope no one posted. It was signed T.K. and talked about five lanterns that once told the tide where to turn. Pip swears it never passed through the post office. The last page of Grandma\'s logbook has been neatly torn out, and the back cover hides a tiny inked wave.',
  open: lines('|Summer. The cicadas all start at once, as though somebody gave a signal.', 'misa|The lamp is lit, the school year is over for now, and Mochi has claimed the best patch of sun. Perfect.'),
  stages: [
    { ...letterStage(1), steps: [...readLetter(1), ...lines('misa/surprised|A second kind of light? Five lanterns? And T.K. knows I am the new Keeper.', 'misa|No stamp. No postmark. I should ask Pip.')] },
    { text: 'Ask Pip about the unstamped letter', hint: 'Pip does his rounds in town, on the lane and at the post office', talk: 'pip', steps: lines('pip/surprised|A wave seal? Never seen one! And I have seen EVERY seal. I once delivered a letter sealed with jam.',
      'pip|Stamps go through my counter, Misa, and nothing came through it for you this week. Whoever it is posted it by hand. Or by magic. Or by very good aim.', 'misa|The paper is thick, like logbook paper.',
      'pip/happy|Then it is the lighthouse for you! Only place in town with that paper. Report back, detective! I will be here, sorting and being suspicious.') },
    { text: 'Check Grandma\'s logbook in the lighthouse', hint: 'The logbook is at the bottom of the Star Lantern, near the door', prop: { map: 'lighthouse', spot: 'logbook', dx: 1, label: 'Look behind the logbook' },
      steps: [...lines('|Misa turns the heavy pages. Near the end, one page has been removed so cleanly it could be a surgeon\'s work.',
        '|Inside the back cover, in faded blue ink, there is a tiny wave. The same wave as on the seal.', 'misa|Somebody wanted me to find this. Somebody who knew the logbook better than anyone.', 'misa/happy|All right, T.K. I am playing. Where does the missing page go?'),
        set('a2_page1'), friend('pip', 20), memory('sv3_open10')] },
  ],
  reward: { money: 120 },
});

// ================================================================ Chapter 11
chapterDef(11, {
  name: 'Pages Gone to Sea', trig: ['since:10>=1'], by: 42, letter: 2,
  teaser: 'The missing pages of the logbook are scattered across town: one with the clockmaker, one with Suzu, one in the library archive.',
  summary: 'Three pages of an old tide chart were hidden around town: Mr. Wren kept one in a clock case, Suzu decoded the second from a library cipher, and the third lay in the archive. Together they show a chart of the bay with five lanterns on it.',
  open: [mail('sv3_m2', 'Pip', 'Another envelope! Same wave seal, same no stamp! It was on my sorting table this morning and I did NOT put it there. Left it in your mailbox. Pip out!'), ...lines('|Another envelope waits in the yard mailbox.')],
  stages: [
    letterStage(2),
    { text: 'Show Mr. Wren the wave sigil', hint: 'Wren\'s Clocks, on the square (closed Sundays)', talk: 'tobias', steps: lines('tobias|...Where did you get that mark.', '|Mr. Wren holds the letter an inch from his nose, then very far away, as if the wave might change its mind.',
      'tobias|T.K. I knew a joke by that name, once. Twenty years ago. It means nothing. Hmph.', 'misa|It says a page is with a man who keeps all the hours.',
      '|He goes to a tall clock, opens the case, and takes out a folded sheet pressed flat behind the pendulum.', 'tobias|I have had this since the storm. I never knew what it was. I could not bring myself to throw it away. Take it. Touch nothing else.') },
    { text: 'Ask Suzu to decode the page', hint: 'Suzu is usually in the library or at Cafe Kumo', talk: 'suzu', steps: lines('suzu|Oh. A cipher. A REAL cipher. I need a moment to be quietly thrilled.', 'suzu/happy|The loops are tide times. Look, every curl is an hour, and the dots are the moon phase. Whoever wrote this was very good and slightly smug.',
      'suzu|It points to the archive on the bottom floor. The shelf for "Harbour, Miscellaneous". Nobody opens that shelf, because the label is a lie.', 'misa|Suzu, you are the best detective in Hoshimori.', 'suzu|I know. Do not tell the others. They will want badges.') },
    { text: 'Search the library archive shelf', hint: 'The library archive is on the ground floor', prop: { map: 'library', spot: 'archive', label: 'The shelf labelled "Miscellaneous"' },
      steps: [...lines('|Behind a stack of tide almanacs, a rolled sheet is tied with blue thread.', '|Misa lays all three pages on the table and they click together like a jigsaw: a chart of the bay.',
        '|Five small lanterns are inked on the coast: a star in the cave, a lamp on the harbour wall, a light on the shrine hill, a bell in the clock tower, and the great lamp of the lighthouse.',
        'misa/happy|The Tide Lanterns. They were real.'), give('sv3_item_tidechart'), set('a2_chart'), friend('suzu', 25), friend('tobias', 25), memory('sv3_open11')] },
  ],
  reward: { money: 150 },
});

// ================================================================ Chapter 12 (choice point 1)
chapterDef(12, {
  name: 'Marks in the Deep', trig: ['since:11>=1'], by: 48, letter: 3, art: 'sv3_item_tidechart',
  skip: (g) => { if (!g.flag('a2_cp1')) g.setFlag('a2_cp1', 'secret'); g.setFlag('a2_tl_cave'); },
  teaser: 'The first Tide Lantern should be in the tidepool cave, behind the carved star. Hina knows the cave best.',
  summary: 'Hina and I woke the cave lantern by repeating a wave sigil. Behind the carved star was a tin box with a second tide table and a note. I had to decide who to tell about it.',
  open: lines('|The sea is warm now, and the beach smells of sunscreen and seaweed.', 'misa|The chart says the cave first. Hina will be thrilled. Or she will be in a rock pool within thirty seconds.'),
  stages: [
    letterStage(3),
    { text: 'Meet Hina at the tidepool cave', hint: 'Through the harbour and Shell Beach, then into the cave', go: 'cave', steps: [place('hina', { dx: 1 }), ...lines('hina/happy|MISA!!! You said BIG SECRET CAVE MISSION and I brought snacks, a net, and Gerald the Third!', 'misa|...Who is Gerald the Third?', 'hina/happy|A crab. Very calm. Excellent in a crisis. He is in my pocket.',
      'hina|Your letter says the star is polite? Let us be polite. Hello, star! We come in peace and with a crab.')] },
    { text: 'Wake the carved star', hint: 'The carved star is at the back of the cave', prop: { map: 'cave', spot: 'star_mark', label: 'Press the carved star' },
      steps: [scene('sv3_cave_stars'), ...lines('|The carved star hums under Misa\'s palm. Faint wave-shaped glyphs glimmer on the stone, one at a time.', 'hina|Misa, it is doing a thing. It wants you to copy it. I will hold the crab.'),
        mg('sv3_sigil', { len: 5, seed: 3, title: 'The cave star' }), scene(null), sfx('chime'), lit('cave'),
        ...lines('|A hollow opens behind the star. A tin box sits inside, dry as a bone, with a second tide table folded around a note.', 'hina/surprised|Whoa. It is beautiful. Whoever hid this really loved this cave.',
          '|The note says: "Lanterns wake in the order of the tide: cave, wall, hill, tower, light. Do not tell everyone at once."', 'misa|Hina... who do we tell? Or do we tell nobody?'),
        choice('Who should see the tin box?',
          ['Show Grandma first', 'misa|Grandma Hana should see this. It might be hers.', 'hina|Okay. I will keep Gerald quiet.', call((g) => { g.setFlag('a2_cp1', 'hana'); g.addFriend('hana', 25); })],
          ['Keep it secret for now', 'misa|Let us wait. If someone wanted it hidden, I would like to know why first.', 'hina|A secret! The best kind. Next best after snacks.', call((g) => { g.setFlag('a2_cp1', 'secret'); g.addFriend('hina', 25); })],
          ['Ask Mr. Wren to look', 'misa|Mr. Wren recognised the sigil. I think he knows more than he says.', 'hina|Grumpy people always know more. It is the grumpiness. It keeps it in.', call((g) => { g.setFlag('a2_cp1', 'tobias'); g.addFriend('tobias', 25); })]),
        friend('hina', 30), memory('sv3_open12')] },
  ],
  reward: { money: 180 },
});

// ================================================================ Chapter 13
chapterDef(13, {
  name: 'The Mural\'s Secret', trig: ['since:12>=1'], by: 54, letter: 4,
  skip: (g) => g.setFlag('a2_tl_harbour'),
  teaser: 'Colour remembers what paint forgets. The harbour mural hides something that only shows in the dark.',
  summary: 'Theo admitted that the harbour mural was painted over an older layer. After dark, the old paint glows with wave sigils. We woke the second Tide Lantern, and Captain Jun told me about the lamp on the wall.',
  open: lines('misa|"Bring someone who sees like an artist." That is obviously Theo.'),
  stages: [
    letterStage(4),
    { text: 'Talk to Theo about the mural', hint: 'Theo paints at the harbour mural and on the school roof', talk: 'theo', steps: lines('theo|Hey.', 'misa|Theo, who painted the mural before you did?', 'theo|...I did not paint over a wall. I painted over a wall that was already someone\'s idea.',
      'theo|The old paint underneath is weird. It is chalky. When I scrubbed it at dusk it left a glow on my fingers. I told nobody. Nobody asks me things.', 'misa/happy|I am asking.', 'theo/happy|Come after dark. I will bring a lamp. A small one. It is shy.') },
    { text: 'Look at the mural after dark', hint: 'The harbour mural, after 7 PM', prop: { map: 'harbour', spot: 'mural', dy: 1, label: 'Look at the mural in the dark' }, when: 'time>=19:00',
      steps: [place('theo', { dx: 1 }), scene('sv3_harbour_mural'), ...lines('|Theo covers his lamp. The old wall shows its second face: pale sea-green glyphs, a ring of waves, a lantern.', 'theo|There. See? It has been here the whole time. Waiting for the lights to go out.',
        'misa|It wants us to copy the pattern, I think.'), mg('sv3_sigil', { len: 6, seed: 5, title: 'The harbour wall' }), scene(null), lit('harbour'), set('a2_mural'),
        ...lines('theo|It did not even glow for me. It glowed for you.', 'misa|It glowed for both of us. You just kept it a secret too long.', 'theo/happy|...Yeah. Okay. Thanks.'), friend('theo', 40)] },
    { text: 'Ask Captain Jun about the wall lamp', hint: 'Captain Jun is at the harbour Bait & Tackle', talk: 'jun', steps: lines('jun/happy|Ha! The wall lamp! Ahoy, little keeper! Come in, sit, I have fifty-seven stories and two of them are true.', 'misa|Captain, the harbour wall lantern. Who built it?',
      'jun|A small crew. Tobias on the gears. A wiry lad called Haru on the lantern glass. And a girl who stood at the end of the pier with a clipboard, telling us we were all wrong.', 'jun/happy|She was usually right. That is what was so annoying.',
      'misa|Captain... what was the girl\'s name?', 'jun|Ahh. A good captain never names a tide. Come back when you have the other four lit.'), friend('jun', 30), memory('sv3_open13')] },
  ],
  reward: { money: 180 },
});

// ================================================================ Chapter 14: a summer night
chapterDef(14, {
  name: 'Midsummer Night', trig: ['dayn>=47', 'since:13>=1'], by: 56, letter: 5,
  teaser: 'On the warmest night of the summer the whole class meets at the beach bonfire. A lantern boat has something to say.',
  summary: 'We had a midsummer bonfire on Shell Beach, with fireworks over the lighthouse. A paper boat washed up with the fifth letter inside, and I asked it a question.',
  open: lines('|The hottest week of summer. Even the gulls are fanning themselves.', 'misa|Kai says everybody is meeting at the bonfire tonight. After seven. I should go.'),
  stages: [
    { text: 'Join the midsummer bonfire on Shell Beach', hint: 'Shell Beach, after 7 PM', go: 'beach', when: 'time>=19:00',
      steps: [scene('sv3_midsummer'), ...lines('|The bonfire cracks and throws sparks at the stars. Fireworks bloom over the lighthouse, pink and gold.',
        'kai/happy|I brought fireworks! Okay, Rina brought fireworks. I brought the lighter. And an opinion about them.', 'rina|They are a licensed display. Please do not touch the licensed display.', 'hina/happy|It is going BOOM! Do it again!',
        'suzu|Statistically, one of us will cry at the finale. I have money on Kai.', 'kai/surprised|I would never! ...Maybe at the last one.', 'theo|Nice night.', 'misa/happy|The best. All of it. Here, with you lot.'), scene(null)] },
    { text: 'Find the paper lantern boat on the shore', hint: 'Walk the shoreline of Shell Beach', prop: { map: 'beach', spot: 'shore', label: 'A paper boat in the shallows' },
      steps: [...lines('|A small paper boat has washed up in the shallows, its candle still burning. A letter is folded in the bow.'), ...readLetter(5)] },
    { text: 'Set a lantern boat adrift and ask it a question', hint: 'The sandbar on Shell Beach', prop: { map: 'beach', spot: 'sandbar', label: 'Launch the lantern boat' },
      steps: [...lines('|Misa sets the boat on the water. It bobs, turns, and sails out toward the lighthouse.', 'misa|What do I ask?'),
        choice('Ask the boat...',
          ['"Who are you?"', 'misa|Who are you? And why me?', '|The candle flickers twice, like a laugh.', friend('suzu', 25)],
          ['"Will we wake them all?"', 'misa|Will we wake all five lanterns?', '|The boat dips over a wave and bobs back up, stubborn and hopeful.', friend('hina', 25)],
          ['"How do I help Grandma?"', 'misa|My grandmother is forgetting things. How do I help her?', '|The boat drifts in a slow circle, as if thinking, then settles toward the shore.', friend('kai', 25)]),
        scene('sv3_midsummer'), ...lines('kai/happy|It went all the way to the lighthouse! Did you see that? A boat! That is BASICALLY a message!', 'suzu|It is basically a current. But I will allow it.'), scene(null), mood(15), memory('sv3_open14')] },
  ],
  reward: { money: 200 },
});

// ================================================================ Chapter 15: autumn, shrine wishes
chapterDef(15, {
  name: 'Wood and Wishes', trig: ['dayn>=57', 'since:14>=1'], by: 66, letter: 6,
  skip: (g) => g.setFlag('a2_tl_shrine'),
  teaser: 'Kiko keeps a board of ema wishes. One of them is not a wish. It is a letter, and a lantern waits on the lookout.',
  summary: 'Kiko helped me read the ema board. One plaque was in the Tidekeeper\'s handwriting, and led to the shrine lookout, where the third Tide Lantern woke up.',
  open: lines('|The first leaves turn gold on Hoshi Hill. The steps smell of sun-warmed cedar.'),
  stages: [
    { text: 'Climb to the shrine and read the ema board', hint: 'The shrine on Hoshi Hill, north of the square', go: 'shrine', steps: lines('kiko|The wind carried you up the steps again. It is good company for a climb.', 'misa|Kiko, may I read the ema? A letter says one is not a wish.', 'kiko|Every wish is a letter. Not every letter is a wish. Go on. The board will not mind.') },
    { text: 'Read the wishes on the ema board', hint: 'The ema board is near the shrine office', prop: { map: 'shrine', spot: 'ema_board', label: 'Read the ema wishes' },
      steps: [...lines('|Hundreds of little wooden plaques rattle in the breeze, each in a different hand.'),
        choice('Which plaque do you read?',
          ['"Please let me pass my exam."', '|"Please let me pass my exam. I studied for six minutes." Signed: Kai, Class 2-B. Misa smiles and moves on.'],
          ['"I wish the tide bell would ring again."', 'misa|"I wish the tide bell would ring again." The handwriting is tidy and sloping, with a tiny wave for a full stop.'],
          ['"More fish. Always more fish."', '|Signed: Captain J. Misa decides this one is definitely a wish.']),
        ...lines('misa|"I wish the tide bell would ring again." That one is not asking for anything. It is telling me where to go.'), ...readLetter(6),
        ...lines('kiko|The tide bell. The one in Mr. Wren\'s tower. Someone wrote that wish a very long time ago, then came back every year to add a little more ink.')] },
    { text: 'Wake the shrine lantern on the lookout', hint: 'The lookout is at the top of the shrine hill', prop: { map: 'shrine', spot: 'lookout', label: 'A lantern wedged in the old stones' },
      steps: [...lines('|Behind a loose stone on the lookout, the glass of an old lamp reflects the harbour far below.', 'kiko|It was my grandmother\'s favourite place. She said the light could see the ships, and the ships could see the light.'),
        mg('sv3_sigil', { len: 6, seed: 7, title: 'The shrine lantern' }), lit('shrine'), ...lines('kiko/happy|There. It breathes. I have not seen a lantern wake since I was small.', 'misa|Three down. Two to go.'), friend('kiko', 40), memory('sv3_open15')] },
  ],
  reward: { money: 200 },
});

// ================================================================ Chapter 16: the clock tower
chapterDef(16, {
  name: 'The Gear Chain', trig: ['since:15>=1'], by: 72, letter: 7, art: 'sv3_item_tidechart',
  skip: (g) => { g.setFlag('a2_tl_tower'); g.setFlag('a2_tower_fixed'); },
  teaser: 'A letter has been left at Wren\'s Clocks. The clock tower\'s tide bell has been silent for twenty years, and its gears need mending.',
  summary: 'Mr. Wren rebuilt the gear chain that carries the sea\'s hours to the tower bell, with my help. The tower\'s fourth Tide Lantern woke, and the clock hands turned gold at sunset.',
  open: lines('misa|The letter says Mr. Wren will pretend he does not mind. I wonder how hard I have to push.'),
  stages: [
    letterStage(7, { map: 'clock_shop', spot: 'counter', label: 'An envelope under the till', text: 'Find the letter at Wren\'s Clocks', hint: 'Wren\'s Clocks, on the square' }),
    { text: 'Ask Mr. Wren about the tide bell', hint: 'Mr. Wren is at the clock shop or up in the tower', talk: 'tobias', steps: (g) => [
      ...lines('tobias|A tide bell. A bell that rings when the tide turns. It was her idea. The gears were mine.'),
      IF(cp1('tobias'), lines('tobias|You showed me the tin box. I did not sleep. I opened my old chest of plans after twenty years. I should have done it sooner.'), []),
      IF(cp1('hana'), lines('tobias|You showed Hana the tin box. She laughed, then she cried. Then she asked me if I still had the plans. I do.'), []),
      IF(cp1('secret'), lines('tobias|You said nothing for weeks. A good Keeper keeps a secret. A bad clockmaker keeps it for twenty years. I am the bad clockmaker.'), []),
      ...lines('tobias|Go up to the tower. The big gear is jammed. The chain is out of order. Fix it, and I will tell the bell to behave.')] },
    { text: 'Repair the gear chain in the clock tower', hint: 'Through the clock shop, up to the tower', prop: { map: 'clock_tower', spot: 'gears', label: 'The jammed gear chain' },
      steps: [place('tobias', { dx: 1 }), ...lines('|Gears the size of dinner plates lock together in the dark. Dust shakes loose from the rafters.', 'tobias|Small, large, medium, large, small. In that order. Do not rush me.'),
        mg('story_gears'), sfx('chime'), call((g) => g.setFlag('a2_tower_fixed')), lit('tower'), ...lines('|Far above, the great bell shivers once. A single clear note rolls out across the roofs of Hoshimori.', 'tobias|...Twenty years. Twenty years and it still keeps time.',
          'tobias/happy|That is the first time I have heard it since I closed the shutters. Do not tell anyone I got a speck of dust in my eye.', 'misa/happy|Of course not.'), friend('tobias', 40), memory('sv3_open16')] },
  ],
  reward: { money: 220 },
});

// ================================================================ Chapter 17: typhoon (choice point 2)
chapterDef(17, {
  name: 'Typhoon Night', trig: ['dayn>=64', 'since:16>=1', 'weather:storm'], by: 76, letter: 8,
  skip: (g) => { if (!g.flag('a2_cp2')) g.setFlag('a2_cp2', 'home'); },
  teaser: 'A typhoon is rolling in. The harbour is full of boats, and the Star Lantern has to shine through the storm.',
  summary: 'A typhoon hit Hoshimori. I had to choose where to be when it arrived, and then I climbed the lighthouse to keep the beam alive until every boat was home. A letter was waiting under the door afterward.',
  open: lines('|The sky is the colour of a bruise. The radio says a typhoon will pass the coast tonight.', 'misa|Everyone will be somewhere they should not be. Where should I be?'),
  stages: [
    { text: 'Decide where to be before the storm hits', hint: 'Go to the harbour', go: 'harbour', steps: [scene('sv3_typhoon'), ...lines('|Waves slap the pier and the whole harbour groans. Boats strain on their ropes.', 'jun|All hands! If you have hands! Double the lines on the Sayori, we are losing the east dock!'), scene(null),
      choice('The wind is rising. Where do you go first?',
        ['Run to Sunny Pines and check on Grandma', 'misa|Grandma is alone up there. I am going.', place('hana', { dx: 1 }), ...lines('hana|Misa! I have been sitting in the dark telling the storm what I think of it. It is not listening.', 'misa|I brought a lantern and a flask of tea.', 'hana/happy|Then it is a party. Sit. Tell me about the lamp.'), call((g) => { g.setFlag('a2_cp2', 'hana'); g.addFriend('hana', 40); })],
        ['Help Captain Jun tie down the boats', 'misa|Captain, tell me where to haul!', place('jun', { dx: 1 }), ...lines('jun/happy|That is the spirit! You hold, I knot! No wait, you knot, I swear!', '|Together they lash down the last three boats, soaked to the skin.', 'jun|You have your grandmother\'s grit. I mean that as the highest compliment, and also as a warning.'), call((g) => { g.setFlag('a2_cp2', 'jun'); g.addFriend('jun', 40); })],
        ['Go home to Mochi and keep the lamp ready', 'misa|Mochi hates storms. I will stay home, and be ready for the lamp.', ...lines('mochi|Mrrrrow.', '|Mochi climbs into Misa\'s lap and refuses to leave. The windows rattle. Somewhere, a dog is yelling at the thunder.'), call((g) => { g.setFlag('a2_cp2', 'home'); g.addMood(8); if (g.state.mochi) g.state.mochi.affection = Math.min(100, (g.state.mochi.affection || 0) + 8); })])] },
    { text: 'Keep the Star Lantern lit through the storm', hint: 'The lamp room of the lighthouse', prop: { map: 'lighthouse', spot: 'lamp_room', dy: 1, label: 'Light the beam through the storm' },
      steps: [scene('sv3_typhoon'), ...lines('|Wind howls round the lamp room. The glass shudders. Out on the water, small lights bob in the black.', 'misa|Keep the beam steady. Every boat is counting on it.'),
        mg('sv3_chain', { n: 5, title: 'Keep the beam steady', help: 'Press Space as the beam crosses each boat', speed: 0.9 }), sfx('chime'), scene(null),
        ...lines('|One by one, the lanterns of the fishing fleet slide into the harbour, safe.', 'jun|Every boat! Every last one! Ha! I knew the light would hold!'), mood(10)] },
    { text: 'Find the letter that was slipped under your door', hint: 'Back at home', prop: { map: 'home', spot: 'door', label: 'A damp envelope on the mat' },
      steps: [...readLetter(8), IF(cp2('hana'), lines('misa|Grandma was right. We talked through the storm. It was easier to be afraid together.'), IF(cp2('jun'), lines('misa|Captain Jun gave me his oilskin coat. I think he will want it back. Eventually.'), lines('misa|Mochi purred right through it. She is the real hero of this chapter.'))), memory('sv3_open17')] },
  ],
  reward: { money: 250 },
});

// ================================================================ Chapter 18
chapterDef(18, {
  name: 'After the Storm', trig: ['since:17>=1'], by: 80, letter: 9,
  teaser: 'The town cleans up. Somewhere on the harbour floats a bottle that is not rubbish.',
  summary: 'The whole town helped clear the storm damage. The ninth letter came in a bottle that washed up at the dock.',
  open: lines('|Debris, seaweed and one very confused crab are scattered across the harbour road.', 'misa|Time to help. And to look kindly at whoever helps me look.'),
  stages: [
    { text: 'See how the harbour fared', hint: 'The harbour, past the town square', go: 'harbour', steps: lines('jun|Not bad, not bad! We lost one net and a deckchair. The deckchair was on my boat, which is annoying, because I was in it.', IF(cp2('jun'), lines('jun|And you! Soaked to the bone and still smiling. I am telling everyone you tie a good knot.'), []), 'misa/happy|I will help carry things.') },
    { text: 'Check on Mika at Cafe Kumo', hint: 'Cafe Kumo, on the square', talk: 'mika', steps: lines('mika|Misa! A shingle fell off the roof and hit Kumo-chan\'s cushion. She is furious. She is also asleep.', 'mika/happy|I have a hundred cups of tea to give out. Take one to the harbour crew? A free refill for a free pair of hands.', 'misa|Done. Where do I start?', 'mika|The harbour. And the market. And Mr. Hayashi, who will pretend he is not cold.') , },
    { text: 'Help Sachiko dry out Sunny Mart', hint: 'Sunny Mart, on the square', talk: 'sachiko', steps: (g) => [...lines('sachiko/happy|Misa, dear! Come in, mind the puddle. I have rice crackers floating in aisle two!', 'sachiko|My nephew is out fishing for them with a net. Could you hold the other end of the sodden carpet?'), IF(cp2('hana'), lines('sachiko|And your grandmother sent her best soup up the hill for the whole street. Did you know? She would not tell me the recipe.'), []), friend('sachiko', 30)] },
    { text: 'Look for the bottle at the dock', hint: 'The harbour dock', prop: { map: 'harbour', spot: 'dock', label: 'A bottle that is not rubbish' },
      steps: [...lines('|Between a snarl of rope and a drowned traffic cone, a green bottle glints, stoppered with a wave-shaped cork.'), ...readLetter(9), ...lines('misa|"Look kindly at whoever helps you look." Everyone helped. That is the whole town.'), friend('pip', 20), memory('sv3_open18')] },
  ],
  reward: { money: 220 },
});

// ================================================================ Chapter 19: moon festival
chapterDef(19, {
  name: 'Moon with the Shade Off', trig: ['dayn>=71', 'since:18>=1'], by: 84, letter: 10,
  teaser: 'On harvest moon night, a letter asks me to sit with the one who sits by the window.',
  summary: 'I watched the harvest moon with Grandma at Sunny Pines. She hummed a tune from the lighthouse years and then lost the thread. Goro told me what it costs her.',
  open: lines('|The moon rises huge and honey-coloured over the bay.'),
  stages: [
    letterStage(10),
    { text: 'Watch the harvest moon with Grandma at Sunny Pines', hint: 'Sunny Pines, after 6 PM', go: 'sunny_pines', when: 'time>=18:00', steps: [place('hana', { dx: 1 }), place('goro', { dx: -1 }), ...lines('|Grandma Hana sits by the window with a blanket, a plate of dango and a very good view.', 'hana/happy|Come, sit. The moon has its shade off tonight. I always liked it better like that.',
      'misa|Grandma, what is that tune you are humming?', 'hana|Hmm? Oh. Oh, it is... something about a bell. About lights. I wrote it. Or he did. Or someone sang it to me once in a very small boat.',
      IF(cp1('hana'), lines('hana|You showed me a tin box with a tide table, dear. I remember. I think I remember. Who gave you that?'), []),
      '|Her hand rests on the windowsill. After a while she stops humming, and her eyes drift away.', 'misa|Grandma?', 'hana|...Is it Tuesday? I was in the middle of a thought and it floated off.', 'misa|It is okay. We can find it again.')] },
    { text: 'Talk to Goro about Grandma', hint: 'Goro is at Sunny Pines, the lane or the park', talk: 'goro', steps: lines('goro|Hmph. She is having a good week. Last week was not so good.', 'misa|How long has she been like this?', 'goro|The good days are still most days. She hides the bad ones. Stubborn as a stump.',
      'goro|You are doing something with those letters, girl. I see you tearing about. Whatever it is, do it quick. She would like to see it.', 'misa|I will. I promise.', 'goro|...Good. Now leave me be. Daifuku is eating my hat.'), },
  ],
  reward: { money: 200, friend: { hana: 40, goro: 40 } },
});

// ================================================================ Chapter 20: Hoshi Woods
chapterDef(20, {
  name: 'The Shy Lantern', trig: ['dayn>=85', 'since:19>=1'], by: 92, letter: 11,
  teaser: 'The first snow of winter. A letter tied to the torii leads to the old trees behind the shrine, where something shy is waiting.',
  summary: 'I followed a fox through the snowy trees behind the shrine and found Grandma\'s old hand lantern, the one she carried on her night rounds.',
  open: lines('|Winter. Frost on the windows, ice on the pond, and Mochi seriously considering a hat.'),
  stages: [
    letterStage(11, { map: 'shrine', spot: 'torii', dy: 1, label: 'A letter tied to the torii', text: 'Read the letter tied to the shrine gate', hint: 'The torii at the foot of the shrine steps' }),
    { text: 'Follow the forest path behind the shrine', hint: 'The forest path on Hoshi Hill', prop: { map: 'shrine', spot: 'forest_path', label: 'Follow the forest path' },
      steps: () => [place('kiko', { dx: 1 }), ...lines('|The path narrows between bare cedars and snow-heavy ferns. Something small and orange slips between the trunks ahead.', 'kiko|A fox. She has been watching you since the steps. She is not hiding, only being polite.',
        hasMap('hoshi_woods') ? 'kiko|Beyond the path lie the deeper woods. Hoshi Woods itself. Go there when you want to hear it breathe.' : 'kiko|The path goes on much farther than it looks. Perhaps one day you will find where it ends.'),
        '|The fox leads Misa to a hollow beneath an old cedar. Wrapped in oilcloth, there is a battered hand lantern with a tiny wave scratched on the base.', 'misa|Grandma\'s night lantern. She carried this on her rounds. The sigil is on it too.',
        give('sv3_fox_lantern'), set('a2_woods'), friend('kiko', 40), memory('sv3_open20')] },
  ],
  reward: { money: 220 },
});

// ================================================================ Chapter 21 (choice point 3)
chapterDef(21, {
  name: 'Blank Page', trig: ['since:20>=1'], by: 98, letter: 12,
  skip: (g) => { if (!g.flag('a2_cp3')) g.setFlag('a2_cp3', 'free'); },
  teaser: 'Snow turns the whole town into a blank page. Theo wants to paint the harbour wall properly, and Rina has opinions.',
  summary: 'Theo and I repainted the harbour wall in the snow while Rina supervised. I decided what Theo should paint on it.',
  open: lines('|Snow lies soft over the rooftops. Everything looks like the beginning of something.'),
  stages: [
    letterStage(12, { map: 'school_roof', spot: 'telescope', label: 'An envelope in the telescope mount', text: 'Find the letter on the school roof', hint: 'The school roof, through the school halls' }),
    { text: 'Meet Theo at the harbour wall', hint: 'The harbour mural, on a clear afternoon', prop: { map: 'harbour', spot: 'mural', dy: 1, label: 'Talk with Theo about the wall' },
      steps: [place('theo', { dx: 1 }), place('rina', { dx: -1 }), ...lines('theo|The wall wants a new layer. The old one is fading. I... do not know what it should say.', 'rina|I have brought a schedule, a colour chart and a thermos. You are welcome.', 'theo|...Thanks, Rina. That is the nicest rude thing anyone has said to me.',
        'misa|What should the wall say, Theo?'),
        choice('Suggest...',
          ['The five Tide Lanterns', 'misa|The five lanterns. So everyone who passes remembers what they were for.', 'theo/happy|Five lights along a coast. Okay. I can paint that.', call((g) => { g.setFlag('a2_cp3', 'lanterns'); g.addFriend('theo', 30); })],
          ['A young Grandma on the pier', 'misa|The girl with the clipboard on the pier. Grandma, young and stubborn.', 'theo|...A girl with a clipboard, telling the sea it is wrong. Yes.', call((g) => { g.setFlag('a2_cp3', 'hana'); g.addFriend('hana', 30); })],
          ['Whatever he feels', 'misa|Whatever you feel, Theo. Maybe the wall already knows.', 'theo|That is the scariest answer. And the best.', 'rina|I will write that on the schedule as "feelings, one hour".', call((g) => { g.setFlag('a2_cp3', 'free'); g.addFriend('rina', 30); })]),
        ...lines('|They work until the snow turns blue. Rina holds the brush jar and the umbrella. Theo paints. The wall breathes in.'), friend('theo', 30), friend('rina', 30), memory('sv3_open21')] },
  ],
  reward: { money: 220 },
});

// ================================================================ Chapter 22: the reveal (branching outcome 1)
chapterDef(22, {
  name: 'A Cup of Tea', trig: ['since:21>=1'], by: 103, letter: 13,
  skip: (g) => { if (!g.flag('a2_reveal')) g.setFlag('a2_reveal', 'secret'); S(g).act2Ending = S(g).act2Ending || null; },
  teaser: 'Pip has a letter that must be handed over in person. It invites me to the room with the best tea and the oldest chair.',
  summary: 'Grandma Hana is the Tidekeeper. She wrote the letters on her good mornings and gave them to Pip, then forgot she had, so she could be surprised when I read them. I chose how to tell her I knew.',
  open: lines('misa|A cup of tea. The oldest chair. There is only one chair in Hoshimori that fits that.'),
  stages: [
    { text: 'Collect the letter from Pip in person', hint: 'The post office counter or Pip on his rounds', talk: 'pip', steps: lines('pip|Misa! I have been holding this for nine days and it has been trying to wriggle out of my hands!', ...readLetter(13), 'pip/surprised|Oh. Oh no. I have said too much with my face, haven\'t I.', 'misa|Pip... who gave you the letters to post?', 'pip|A very nice person. I was told not to say. Please ask her. Gently. Over tea.') },
    { text: 'Have tea with Grandma at Sunny Pines', hint: 'Sunny Pines, in the daytime', go: 'sunny_pines', when: 'time<18:00', steps: [place('hana', { dx: 1 }), ...lines('|Grandma Hana is sitting in the oldest chair in Sunny Pines, with two cups and a tin of very good tea.',
      'hana/happy|Misa, dear! Sit, sit. I made you tea. It might be cold. I made it a while ago.', 'misa|Grandma... I read the letters.', 'hana|Letters?', 'misa|From T.K.', '|Grandma sets down her cup very carefully. For a moment her face does not know what it wants to be.',
      'hana|Tide Keeper. Toby\'s silly name for me. Oh, my star. You found them all?', 'misa|Five lanterns, four lit. A chart, a bottle, a boat. And your night lantern in the woods.',
      'hana|I write on the good mornings, you see. The clear ones. I give the letters to Pip. And then the fog comes in, and I forget I have written. And every time a new one is read, I get to be surprised.',
      'hana|It is like having a secret admirer who is also me.'),
      choice('How do you want to answer?',
        ['I knew it was you, Grandma', 'misa|I think a part of me knew from the first letter. The handwriting, the tea, the way you say "polite".', 'hana/happy|Oh, clever girl. Then I do not have to hide a thing.', call((g) => { g.setFlag('a2_reveal', 'open'); g.addFriend('hana', 60); })],
        ['I will pretend I do not know, for now', 'misa|Maybe it is nicer if the Tidekeeper stays a mystery. Until the last letter.', 'hana/happy|A keeper of secrets. You are my granddaughter after all.', call((g) => { g.setFlag('a2_reveal', 'secret'); g.addFriend('hana', 40); g.addFriend('pip', 30); })])] },
    { text: 'Tell Mr. Wren what you learned', hint: 'Wren\'s Clocks', talk: 'tobias', steps: (g) => [...lines('tobias|...She told you. Of course she did.', 'tobias|I held the paper for her. I carried her letters to Pip\'s predecessor, then to Pip. I was not allowed to say a word. I have been quiet for twenty years with the loudest clocks in town.'),
      IF('flag:a2_reveal=open', lines('tobias|You said you knew. That was kind. She needs people who do not make her feel found out.'), lines('tobias|You are letting her keep the mystery. She will be pleased. She likes a good last act.')),
      ...lines('tobias|The last Tide Lantern is the lighthouse. We need all of them, and the whole town, on the last nights of the year.'), friend('tobias', 40), memory('sv3_open22')] },
  ],
  reward: { money: 250, friend: { hana: 40 } },
});

// ================================================================ Chapter 23: winter stars
chapterDef(23, {
  name: 'Falling Stars', trig: ['dayn>=99', 'since:22>=1'], by: 108, letter: 14,
  teaser: 'The winter meteor shower is on. A teacher who counts, a friend who dreams, and a blanket: the shrine lookout, after dark.',
  summary: 'Ms. Fujita, Suzu, Hina and Kai watched the winter meteors with me from the shrine lookout. Ms. Fujita told me about the star her own teacher once drew for her.',
  open: lines('|The coldest, clearest week of the year. Even the sea sounds hushed.'),
  stages: [
    { text: 'Collect the letter from Ms. Fujita', hint: 'Ms. Fujita is at school, in the staff room, or on the roof', talk: 'fujita', steps: lines('fujita|Aoki. Good. I found this in the Astronomy Club mailbox. It has your name on it, and a wave on the seal. I did not open it. I am a professional.', ...readLetter(14),
      'fujita|Falling stars on the fifteenth. The shrine lookout has the best sky in Hoshimori. Bring a blanket. I will bring coffee and facts.', 'misa/happy|Facts are excellent.') },
    { text: 'Watch the meteor shower from the shrine lookout', hint: 'The shrine lookout, after 8 PM', prop: { map: 'shrine', spot: 'lookout', dy: 1, label: 'Lie back and watch the sky' }, when: 'time>=20:00',
      steps: [place('fujita', { dx: 1 }), place('suzu', { dx: -1 }), place('hina', { dx: 2 }), place('kai', { dx: -2 }), scene('story_meteor'), ...lines('|The sky tears open in long silver stitches.', 'hina/happy|THREE! No, four! Five! I am losing count and I do not care!',
        'kai|I wish for a bigger bag of crisps. Out loud. That is how it works.', 'suzu|It does not. But I will not stop you.', 'fujita|My teacher drew a star on the board when I was fifteen and said, "Somebody has to keep the books on the sky". I never forgot.',
        'fujita|You are keeping the sky, Aoki. Do not underestimate that.', 'misa/happy|Thank you, Ms. Fujita. For the facts. And for the coffee.', 'fujita|Hmph. It was decaf. Do not tell the others.'), scene(null), friend('fujita', 50), friend('suzu', 25), friend('hina', 25), friend('kai', 25), mood(15), memory('sv3_open23')] },
  ],
  reward: { money: 250 },
});

// ================================================================ Chapter 24: the set piece (branching outcome 2)
chapterDef(24, {
  name: 'The Night of a Hundred Lights', on: ['dayStart', 'mapEnter', 'hour'], trig: ['dayn>=109', 'since:23>=1', 'time>=16:00'], by: 112, byMin: 16 * 60 + 30, letter: 15,
  skip: (g) => { if (!g.flag('a2_finale')) g.setFlag('a2_finale', 'boats'); g.setFlag('a2_tl_lighthouse'); },
  flags: ['act2_done'],
  teaser: 'The last nights of the year. The whole town gathers to wake the final Tide Lantern and send a hundred lights across the bay.',
  summary: 'The whole town came to the beach. We woke the lighthouse lantern together, then chose how the hundred lights should sound.',
  open: [mail('sv3_m15', 'Hana', 'Misa, dear, I have had a very odd and very good idea. The whole town. The beach. Tonight. Bring a coat and a friend. P.S. I forget what the idea was. P.P.S. It will come back.'), ...lines('|The last evenings of the year. Frost sparkles on the harbour rope.', 'misa|A hundred lights. A whole town. All five lanterns. Let us do it right.')],
  stages: [
    letterStage(15, {}, lines('misa|Both are true. A bell or a hundred boats. Grandma, you are going to make me choose.')),
    { text: 'Gather the town in the square', hint: 'The town square, after 5 PM', go: 'town', when: 'time>=17:00', steps: [scene('sv3_hundred_lights'), ...lines('|The square glows with paper lanterns. Mika hands out cups of ginger tea, Sachiko stacks rice cakes, Jun carries an absurd armful of paper boats.',
      'mika/happy|Fifty free teas! And a hundred if anyone is brave enough to ask!', 'sachiko/happy|Everyone! Take a cracker! Take two! Take one for your neighbour!', 'jun/happy|A hundred boats, all painted by Tobias\'s hand. He claims he was just "testing glue".', 'kiko|The wind is gentle tonight. It wants to carry them.',
      'pip|I delivered every flyer myself! Some of them to the right houses!', 'goro|Hmph. Fine. I will carry a lantern. Daifuku is carrying a lantern. Do not tell him he is a dog.', 'tobias|The tower is ready. The bell is ready. The gears are... adequate.'), scene(null)] },
    { text: 'Wake the lighthouse lantern at the balcony', hint: 'The lighthouse balcony, after dark', prop: { map: 'lighthouse', spot: 'balcony', label: 'The final Tide Lantern' }, when: 'time>=18:00',
      steps: (g) => [place('hana', { dx: 1 }), place('tobias', { dx: -1 }), fade(1, 0.6), scene('sv3_hundred_lights'), fade(0, 0.8),
        ...lines('|On the balcony of the lighthouse, Grandma Hana leans on Misa\'s arm. Below, a hundred small lights wait on the black water. The four other Tide Lanterns glow along the coast like a necklace.'),
        IF('flag:a2_reveal=open', lines('hana/happy|I did it, Misa. I wrote you into every lantern I ever lit. You were always going to be the one to finish them.'), lines('hana/happy|I have no idea what I am doing here, but I feel like I have been waiting for this all my life.')),
        mg('sv3_chain', { n: 5, title: 'Wake the chain of lights', help: 'Press Space as the beam crosses each lantern' }), sfx('chime'), lit('lighthouse'),
        ...lines('|One by one, the five lanterns answer: cave, wall, hill, tower, light. A pale teal beam sweeps the bay.', 'tobias|All five. In order. As the tide demands.', 'hana/happy|Now. The sound. Choose, my star.'),
        choice('How should the night sound?',
          ['One great tide bell', 'misa|Let the bell ring. One note for all of us.', 'tobias|Understood. I will make it sing.', sfx('chime'), ...lines('|From the clock tower, the bell rolls out one low, clear note. It crosses the town, the harbour, the water. Every window in Hoshimori lights.', 'hana|Oh. Oh, that is the sound. That is how it went.'),
            call((gm) => { gm.setFlag('a2_finale', 'bell'); S(gm).act2Ending = 'bell'; gm.give('sv3_tide_bell', 1, true); })],
          ['A hundred lantern boats', 'misa|Let them sail. A hundred small lights, all different.', 'jun/happy|Cast off, you lot! Gently! Gently!', ...lines('|Along the beach, the whole town kneels at the waterline and sets their boats adrift. A hundred candles drift out toward the lighthouse.', 'hana|Look. They look like stars that decided to come home.'),
            call((gm) => { gm.setFlag('a2_finale', 'boats'); S(gm).act2Ending = 'boats'; gm.give('sv3_boat_lantern', 1, true); })]),
        ...lines('hana/happy|Thank you, Keeper. The sea has its light, and the town has its Keeper.', 'misa/happy|And I have a Tidekeeper. Thank you, Grandma.'),
        IF('flag:a2_reveal=open', lines('hana|Oh, hush. I wrote letters. You did the hard part: you read them.'), lines('hana|Hm? What are you thanking me for? Oh, never mind. It is a lovely night.')),
        fade(1, 0.8), scene(null), fade(0, 0.6), friend('hana', 100), friend('tobias', 60), mood(30),
        call((gm) => { gm.bus.emit('act2Complete', { ending: S(gm).act2Ending, reveal: gm.flag('a2_reveal') }); gm.toast('Act II complete: The Tidekeeper\'s Letters', 'i_star'); }), memory('sv3_open24')] },
  ],
  reward: { money: 500 },
});

features('Story Acts', [
  'Act II "The Tidekeeper\'s Letters": 15 new chapters from Summer to Winter 28 of Year 1, started by the finale of the first spring',
  'A mysterious T.K. sends 15 sealed letters, each leading Misa to a new place and puzzle, delivered by mailbox, shop counter, torii, bottle or hand',
  'The Tide Chart: three torn logbook pages from Mr. Wren, Suzu and the library archive reveal five forgotten Tide Lanterns',
  'Cave star puzzle with Hina: repeat the wave sigil to wake the first Tide Lantern and find a hidden tin box',
  'Harbour mural secret: Theo\'s mural glows with sea-green sigils after dark; Captain Jun tells of the crew who built the wall lamp',
  'Midsummer night chapter: the whole class at the Shell Beach bonfire with fireworks, and a paper lantern boat that carries a letter',
  'Shrine ema wishes: read the plaques with Kiko to find the one in T.K.\'s handwriting and wake the lookout lantern',
  'Clock tower gear chain: mend the tide bell\'s gears with Mr. Wren and watch the tower light up',
  'Typhoon chapter: a forced storm, a choice of where to be, and a night keeping the Star Lantern beam steady for the fishing fleet',
  'After the storm: help Captain Jun, Mika and Sachiko clean up, and find a letter in a bottle at the dock',
  'Harvest moon night with Grandma Hana and Goro, with a letter that asks you to listen',
  'Winter chapter at the shrine: follow a fox into the snowy trees (and into Hoshi Woods if it exists) to find Hana\'s old night lantern',
  'Winter chapter with Theo and Rina: decide what the harbour wall should say',
  'The reveal: Grandma Hana is the Tidekeeper, and you choose to say you knew or to keep the secret',
  'Winter meteor night at the shrine lookout with Ms. Fujita, Suzu, Hina and Kai',
  'Set piece "The Night of a Hundred Lights": the whole town on the beach, a chain-of-lights minigame, and a final choice between one great tide bell or a hundred lantern boats',
  'Three choice points (the tin box, the typhoon, the harbour wall) change later dialogue with Hana, Tobias, Jun and the others',
  'Two branching outcomes: how Misa answers Hana\'s reveal, and the bell or boats finale, each with its own keepsake',
]);
